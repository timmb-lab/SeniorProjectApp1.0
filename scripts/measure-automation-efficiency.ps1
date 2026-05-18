param(
    [string]$RepoRoot = ".",
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [int]$Days = 30
)

$ErrorActionPreference = "Stop"

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

function Get-ManifestTimestamp {
    param([Parameter(Mandatory = $true)]$Manifest)

    foreach ($field in @("timestamp", "timestamp_local")) {
        if ($Manifest.PSObject.Properties.Name -contains $field -and $Manifest.$field) {
            try {
                return [DateTimeOffset]::Parse([string]$Manifest.$field)
            }
            catch {
                return $null
            }
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
        if ($item.PSObject.Properties.Name -contains $PropertyName -and $item.$PropertyName) {
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

$automationIds = @(
    "senior-capstone-qol-source-framework-seed",
    "senior-capstone-qol-drive-upload-oauth",
    "senior-capstone-qol-protected-evidence-tests",
    "senior-capstone-qol-teacher-review-endpoints",
    "senior-capstone-qol-immutable-review-history",
    "senior-capstone-qol-mentor-presentation-flow",
    "senior-capstone-qol-admin-ops-endpoints",
    "senior-capstone-qol-announcements",
    "senior-capstone-qol-account-lifecycle",
    "senior-capstone-qol-cloudflare-verification"
)

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
                    lane = if ($manifest.PSObject.Properties.Name -contains "lane") { $manifest.lane } else { $null }
                    automation_id = if ($manifest.PSObject.Properties.Name -contains "automation_id") { $manifest.automation_id } else { $null }
                    status = if ($manifest.PSObject.Properties.Name -contains "status") { $manifest.status } else { $null }
                    accepted_mvp_pass = if ($manifest.PSObject.Properties.Name -contains "accepted_mvp_pass") { [bool]$manifest.accepted_mvp_pass } else { $null }
                    duration_minutes = if ($manifest.PSObject.Properties.Name -contains "duration_minutes") { $manifest.duration_minutes } else { $null }
                    output_kind = if ($manifest.PSObject.Properties.Name -contains "output_kind") { $manifest.output_kind } else { $null }
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

$qolAutomationsWithoutObservedManifest = @()
foreach ($id in $automationIds) {
    if (-not $manifestAutomationIds.Contains($id)) {
        $qolAutomationsWithoutObservedManifest += $id
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
if ($qolAutomationsWithoutObservedManifest.Count -gt 0) {
    $recommendations.Add("The current QoL system is new; require the next weekly calibration to verify each QoL automation has at least one observed manifest or exact blocker.")
}
if ($dailyStartCapacity -ge 30) {
    $recommendations.Add("Do not add more starts before proving conversion; 30 starts/day only needs 6.67 percent accepted-pass conversion for the 2/day minimum and 10 percent for the 3/day stretch.")
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
        status_counts = Group-PropertyCount -Items $manifestRecords -PropertyName "status"
        lane_counts = Group-PropertyCount -Items $manifestRecords -PropertyName "lane"
        automation_counts = Group-PropertyCount -Items $manifestRecords -PropertyName "automation_id"
        requirement_ids_seen = @($requirementMatches | Sort-Object)
        qol_automations_without_observed_manifest = $qolAutomationsWithoutObservedManifest
    }
    recommendations = $recommendations
}

$result | ConvertTo-Json -Depth 8
