param(
    [string]$RepoRoot = ".",
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$CodexHome = "$HOME\.codex",
    [int]$Days = 30,
    [string]$OutputPath = "",
    [string]$ConfigPath = (Join-Path $PSScriptRoot "automation-config.json")
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

function Read-AutomationConfig {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolvedPath = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path $RepoRoot $Path
    }

    if (-not (Test-Path -LiteralPath $resolvedPath)) {
        throw "Missing automation config: $resolvedPath"
    }

    return Get-Content -Raw -LiteralPath $resolvedPath | ConvertFrom-Json
}

function Get-TomlStringValue {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Key
    )

    $pattern = "(?m)^" + [regex]::Escape($Key) + " = `"((?:\\.|[^`"\\])*)`""
    $match = [regex]::Match($Content, $pattern)
    if (-not $match.Success) {
        return $null
    }

    return ('"' + $match.Groups[1].Value + '"') | ConvertFrom-Json
}

function Get-RRulePart {
    param(
        [Parameter(Mandatory = $true)][string]$RRule,
        [Parameter(Mandatory = $true)][string]$Key
    )

    $match = [regex]::Match($RRule, "(^|;)" + [regex]::Escape($Key) + "=([^;]+)")
    if (-not $match.Success) {
        return @()
    }

    return $match.Groups[2].Value.Split(",") | ForEach-Object { $_.Trim() }
}

function Get-JsonProperty {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string[]]$Names
    )

    foreach ($name in $Names) {
        if ($Object.PSObject.Properties.Name -contains $name) {
            return $Object.$name
        }
    }

    return $null
}

function Convert-ToManifestTimestamp {
    param([Parameter(Mandatory = $true)][string]$Value)

    try {
        return [DateTimeOffset]::Parse($Value)
    }
    catch {
        if ($Value -match "\sPT$") {
            try {
                return [DateTimeOffset]::Parse(($Value -replace "\sPT$", "-07:00"))
            }
            catch {
                return $null
            }
        }

        return $null
    }
}

function Get-ManifestTimestamp {
    param([Parameter(Mandatory = $true)]$Manifest)

    foreach ($field in @("timestamp_local", "timestamp", "timestampLocal", "timestamp_pt", "timestampPt")) {
        $value = Get-JsonProperty -Object $Manifest -Names @($field)
        if ($null -ne $value -and [string]$value -ne "") {
            return Convert-ToManifestTimestamp -Value ([string]$value)
        }
    }

    return $null
}

function Group-PropertyCount {
    param(
        [array]$Items,
        [string]$PropertyName,
        [string]$Fallback = "unknown"
    )

    $counts = @{}
    foreach ($item in $Items) {
        $value = $Fallback
        if ($item.PSObject.Properties.Name -contains $PropertyName -and $null -ne $item.$PropertyName -and [string]$item.$PropertyName -ne "") {
            $value = [string]$item.$PropertyName
        }
        if (-not $counts.ContainsKey($value)) {
            $counts[$value] = 0
        }
        $counts[$value]++
    }
    return $counts
}

$now = Get-Date
$windowStart = $now.AddDays(-1 * $Days)
$windowStartOffset = [DateTimeOffset]$windowStart
$config = Read-AutomationConfig -Path $ConfigPath
$automationIds = @($config.automations | ForEach-Object { $_.id })
$strictManifestCutoff = [DateTimeOffset]::Parse([string]$config.strictManifestCutoff)

$automations = @()
$dailySlots = New-Object System.Collections.Generic.List[string]
foreach ($id in $automationIds) {
    $tomlPath = Join-Path $AutomationRoot "$id\automation.toml"
    if (-not (Test-Path -LiteralPath $tomlPath)) {
        $automations += [pscustomobject]@{
            id = $id
            present = $false
            status = "missing"
            name = $null
            rrule = $null
            daily_starts = 0
        }
        continue
    }

    $raw = Get-Content -Raw -LiteralPath $tomlPath
    $name = Get-TomlStringValue -Content $raw -Key "name"
    $status = Get-TomlStringValue -Content $raw -Key "status"
    $rrule = Get-TomlStringValue -Content $raw -Key "rrule"
    $hours = @(Get-RRulePart -RRule $rrule -Key "BYHOUR")
    $minutes = @(Get-RRulePart -RRule $rrule -Key "BYMINUTE")
    $starts = 0
    if ($status -eq "ACTIVE" -and $hours.Count -gt 0 -and $minutes.Count -gt 0) {
        foreach ($hour in $hours) {
            $slot = "{0:D2}:{1:D2}" -f [int]$hour, [int]$minutes[0]
            $dailySlots.Add($slot)
            $starts++
        }
    }

    $automations += [pscustomobject]@{
        id = $id
        present = $true
        status = $status
        name = $name
        rrule = $rrule
        daily_starts = $starts
    }
}

$automationIdByName = @{}
foreach ($automation in $automations) {
    if ($automation.name) {
        $automationIdByName[[string]$automation.name] = [string]$automation.id
    }
}

$dailySlotsSorted = @($dailySlots | Sort-Object)
$minimumSpacingMinutes = $null
if ($dailySlotsSorted.Count -gt 1) {
    $minutesOfDay = @($dailySlotsSorted | ForEach-Object {
        $parts = $_.Split(":")
        ([int]$parts[0] * 60) + [int]$parts[1]
    } | Sort-Object)
    $gaps = New-Object System.Collections.Generic.List[int]
    for ($i = 0; $i -lt $minutesOfDay.Count; $i++) {
        $current = $minutesOfDay[$i]
        $next = if ($i -eq $minutesOfDay.Count - 1) { $minutesOfDay[0] + 1440 } else { $minutesOfDay[$i + 1] }
        $gaps.Add($next - $current)
    }
    $minimumSpacingMinutes = ($gaps | Measure-Object -Minimum).Minimum
}

$manifestDir = Join-Path $RepoRoot "docs\progress\runs"
$manifestRecords = @()
if (Test-Path -LiteralPath $manifestDir) {
    Get-ChildItem -LiteralPath $manifestDir -Filter "*.json" | ForEach-Object {
        $raw = Get-Content -Raw -LiteralPath $_.FullName
        try {
            $manifest = $raw | ConvertFrom-Json
            $timestamp = Get-ManifestTimestamp -Manifest $manifest
            if ($timestamp -and $timestamp.LocalDateTime -ge $windowStart) {
                $manifestRecords += [pscustomobject]@{
                    file = $_.Name
                    raw = $raw
                    manifest = $manifest
                    timestamp = $timestamp.ToString("o")
                    timestamp_offset = $timestamp
                    has_timestamp_local = ($manifest.PSObject.Properties.Name -contains "timestamp_local")
                    lane = Get-JsonProperty -Object $manifest -Names @("lane", "category")
                    automation_id = Get-JsonProperty -Object $manifest -Names @("automation_id", "automation")
                    status = Get-JsonProperty -Object $manifest -Names @("status")
                    accepted_mvp_pass = if ($manifest.PSObject.Properties.Name -contains "accepted_mvp_pass") { [bool]$manifest.accepted_mvp_pass } else { $null }
                    duration_minutes = Get-JsonProperty -Object $manifest -Names @("duration_minutes")
                    output_kind = Get-JsonProperty -Object $manifest -Names @("output_kind")
                }
            }
        }
        catch {
            $manifestRecords += [pscustomobject]@{
                file = $_.Name
                raw = $raw
                parse_error = $_.Exception.Message
                status = "invalid-json"
            }
        }
    }
}

$explicitAccepted = @($manifestRecords | Where-Object { $_.accepted_mvp_pass -eq $true })
$completed = @($manifestRecords | Where-Object { $_.status -eq "completed" })
$missingAcceptedField = @($manifestRecords | Where-Object { $null -eq $_.accepted_mvp_pass })
$missingDurationField = @($manifestRecords | Where-Object { $null -eq $_.duration_minutes })
$strictManifestRecords = @($manifestRecords | Where-Object { $_.timestamp_offset -and $_.timestamp_offset -ge $strictManifestCutoff })
$missingAutomationIdField = @($strictManifestRecords | Where-Object { -not $_.automation_id })
$missingStatusField = @($strictManifestRecords | Where-Object { -not $_.status })
$missingCanonicalTimestampField = @($strictManifestRecords | Where-Object { -not $_.has_timestamp_local })

$requirementMatches = New-Object System.Collections.Generic.HashSet[string]
foreach ($record in $manifestRecords) {
    foreach ($match in [regex]::Matches([string]$record.raw, "MVP-\d{3}")) {
        [void]$requirementMatches.Add($match.Value)
    }
}

$manifestAutomationIds = New-Object System.Collections.Generic.HashSet[string]
foreach ($record in $manifestRecords) {
    if ($record.automation_id) {
        [void]$manifestAutomationIds.Add([string]$record.automation_id)
    }
}

$sessionRecords = @()
$sessionIndexPath = Join-Path $CodexHome "session_index.jsonl"
$sessionIndexPresent = Test-Path -LiteralPath $sessionIndexPath
if ($sessionIndexPresent) {
    Get-Content -LiteralPath $sessionIndexPath -ErrorAction SilentlyContinue | ForEach-Object {
        if (-not $_) {
            return
        }

        try {
            $session = $_ | ConvertFrom-Json
            $threadName = [string](Get-JsonProperty -Object $session -Names @("thread_name"))
            if (-not $threadName -or -not $automationIdByName.ContainsKey($threadName)) {
                return
            }

            $updatedAtValue = [string](Get-JsonProperty -Object $session -Names @("updated_at"))
            if (-not $updatedAtValue) {
                return
            }

            $updatedAt = [DateTimeOffset]::Parse($updatedAtValue)
            if ($updatedAt -lt $windowStartOffset) {
                return
            }

            $sessionRecords += [pscustomobject]@{
                session_id = Get-JsonProperty -Object $session -Names @("id")
                automation_id = $automationIdByName[$threadName]
                thread_name = $threadName
                updated_at = $updatedAt.ToString("o")
            }
        }
        catch {
        }
    }
}

$sessionAutomationIds = New-Object System.Collections.Generic.HashSet[string]
foreach ($record in $sessionRecords) {
    if ($record.automation_id) {
        [void]$sessionAutomationIds.Add([string]$record.automation_id)
    }
}

$qolAutomationsWithoutObservedManifest = @()
foreach ($id in $automationIds) {
    if (-not $manifestAutomationIds.Contains($id)) {
        $qolAutomationsWithoutObservedManifest += $id
    }
}

$qolAutomationsWithoutObservedSession = @()
foreach ($id in $automationIds) {
    if (-not $sessionAutomationIds.Contains($id)) {
        $qolAutomationsWithoutObservedSession += $id
    }
}

$dailyStartCapacity = $dailySlotsSorted.Count
$periodStartCapacity = $dailyStartCapacity * $Days
$minimumAcceptedTarget = 2 * $Days
$stretchAcceptedTarget = 3 * $Days
$minimumConversionPercent = if ($periodStartCapacity -gt 0) { [math]::Round(($minimumAcceptedTarget / $periodStartCapacity) * 100, 2) } else { $null }
$stretchConversionPercent = if ($periodStartCapacity -gt 0) { [math]::Round(($stretchAcceptedTarget / $periodStartCapacity) * 100, 2) } else { $null }

$recommendations = New-Object System.Collections.Generic.List[string]
if ($missingAcceptedField.Count -gt 0) {
    $recommendations.Add("Add accepted_mvp_pass to future run manifests so weekly audits can distinguish real MVP progress from routine logging.")
}
if ($missingDurationField.Count -gt 0) {
    $recommendations.Add("Add duration_minutes to future run manifests so overlap risk can be measured against the 45-minute spacing.")
}
if ($missingAutomationIdField.Count -gt 0 -or $missingStatusField.Count -gt 0 -or $missingCanonicalTimestampField.Count -gt 0) {
    $recommendations.Add("Use canonical timestamp_local, automation_id, and status fields in new run manifests so audits can attribute QoL output reliably.")
}
if ($qolAutomationsWithoutObservedManifest.Count -gt 0) {
    if ($sessionRecords.Count -gt 0) {
        $recommendations.Add("Scheduled QoL sessions are visible in the Codex session index, but not every automation has a repo manifest yet; require closeout manifests or exact blockers for scheduled worktree runs.")
    }
    else {
        $recommendations.Add("The current QoL system is new; require the next weekly calibration to verify each QoL automation has at least one observed manifest or exact blocker.")
    }
}
if (-not $sessionIndexPresent) {
    $recommendations.Add("Codex session_index.jsonl was not found, so this scorecard could not verify whether scheduled sessions fired.")
}
elseif ($qolAutomationsWithoutObservedSession.Count -gt 0) {
    $recommendations.Add("Some QoL automations have no observed Codex session in this window; verify whether their slots have elapsed before treating them as scheduler failures.")
}
if ($dailyStartCapacity -ge 30) {
    $recommendations.Add("Do not add more starts before proving conversion; $dailyStartCapacity starts/day needs $minimumConversionPercent percent accepted-pass conversion for the 2/day minimum and $stretchConversionPercent percent for the 3/day stretch.")
}
elseif ($dailyStartCapacity -eq 10) {
    $recommendations.Add("Reduced 10-start/day mode is active; verify this was explicitly requested because the current QoL timeline normally expects 30 starts/day. At 10 starts/day, the 2/day minimum needs $minimumConversionPercent percent conversion and the 3/day stretch needs $stretchConversionPercent percent.")
}
$recommendations.Add("Auto-scaling should retarget QoL focus, acceptance criteria, and blockers from evidence before changing schedules.")

$result = [pscustomobject]@{
    generated_at = $now.ToString("o")
    window = [pscustomobject]@{
        days = $Days
        starts_at = $windowStart.ToString("o")
        ends_at = $now.ToString("o")
    }
    schedule = [pscustomobject]@{
        active_qol_automations = @($automations | Where-Object { $_.status -eq "ACTIVE" }).Count
        daily_start_capacity = $dailyStartCapacity
        period_start_capacity = $periodStartCapacity
        daily_slots = $dailySlotsSorted
        minimum_spacing_minutes = $minimumSpacingMinutes
        automations = $automations
    }
    target_math = [pscustomobject]@{
        minimum_accepted_passes = $minimumAcceptedTarget
        stretch_accepted_passes = $stretchAcceptedTarget
        minimum_conversion_percent = $minimumConversionPercent
        stretch_conversion_percent = $stretchConversionPercent
    }
    observed_manifests = [pscustomobject]@{
        count = $manifestRecords.Count
        completed_count = $completed.Count
        explicit_accepted_mvp_pass_count = $explicitAccepted.Count
        missing_accepted_mvp_pass_field_count = $missingAcceptedField.Count
        missing_duration_minutes_field_count = $missingDurationField.Count
        strict_manifest_count = $strictManifestRecords.Count
        missing_automation_id_field_count = $missingAutomationIdField.Count
        missing_status_field_count = $missingStatusField.Count
        missing_canonical_timestamp_local_field_count = $missingCanonicalTimestampField.Count
        status_counts = Group-PropertyCount -Items $manifestRecords -PropertyName "status"
        lane_counts = Group-PropertyCount -Items $manifestRecords -PropertyName "lane"
        automation_counts = Group-PropertyCount -Items $manifestRecords -PropertyName "automation_id"
        requirement_ids_seen = @($requirementMatches | Sort-Object)
        qol_automations_without_observed_manifest = $qolAutomationsWithoutObservedManifest
    }
    observed_sessions = [pscustomobject]@{
        codex_home = $CodexHome
        session_index_present = $sessionIndexPresent
        count = $sessionRecords.Count
        automation_counts = Group-PropertyCount -Items $sessionRecords -PropertyName "automation_id"
        recent_sessions = @($sessionRecords | Sort-Object updated_at -Descending | Select-Object -First 30)
        qol_automations_without_observed_session = $qolAutomationsWithoutObservedSession
    }
    recommendations = $recommendations
}

$json = $result | ConvertTo-Json -Depth 8

if ($OutputPath) {
    $resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
        $OutputPath
    }
    else {
        Join-Path $RepoRoot $OutputPath
    }
    $outputDirectory = Split-Path -Parent $resolvedOutputPath
    if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
        New-Item -ItemType Directory -Path $outputDirectory | Out-Null
    }
    Set-Content -LiteralPath $resolvedOutputPath -Value $json -Encoding UTF8
}

$json
