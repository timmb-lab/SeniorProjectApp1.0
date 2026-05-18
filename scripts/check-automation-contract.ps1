param(
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$RepoRoot = ".",
    [switch]$RequireLive
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$liveAutomationsValidated = 0
$snapshotFallbacks = 0

$automationIds = @(
    "senior-capstone-qol-source-framework-seed-2",
    "senior-capstone-qol-drive-upload-oauth-2",
    "senior-capstone-qol-protected-evidence-tests-2",
    "senior-capstone-qol-teacher-review-endpoints-2",
    "senior-capstone-qol-immutable-review-history-2",
    "senior-capstone-qol-mentor-presentation-flow-2",
    "senior-capstone-qol-admin-ops-endpoints-2",
    "senior-capstone-qol-announcements-2",
    "senior-capstone-qol-account-lifecycle-2",
    "senior-capstone-qol-cloudflare-verification-2"
)

$expectedAutomationConfig = @{
    "senior-capstone-qol-source-framework-seed-2" = @{
        Name = "Senior Capstone QoL - Source Framework Seed"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,8,16;BYMINUTE=03"
    }
    "senior-capstone-qol-drive-upload-oauth-2" = @{
        Name = "Senior Capstone QoL - Drive Upload OAuth"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,8,16;BYMINUTE=51"
    }
    "senior-capstone-qol-protected-evidence-tests-2" = @{
        Name = "Senior Capstone QoL - Protected Evidence Tests"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,9,17;BYMINUTE=39"
    }
    "senior-capstone-qol-teacher-review-endpoints-2" = @{
        Name = "Senior Capstone QoL - Teacher Review Endpoints"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=2,10,18;BYMINUTE=27"
    }
    "senior-capstone-qol-immutable-review-history-2" = @{
        Name = "Senior Capstone QoL - Immutable Review History"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,11,19;BYMINUTE=15"
    }
    "senior-capstone-qol-mentor-presentation-flow-2" = @{
        Name = "Senior Capstone QoL - Mentor Presentation Flow"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=4,12,20;BYMINUTE=03"
    }
    "senior-capstone-qol-admin-ops-endpoints-2" = @{
        Name = "Senior Capstone QoL - Admin Ops Endpoints"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=4,12,20;BYMINUTE=51"
    }
    "senior-capstone-qol-announcements-2" = @{
        Name = "Senior Capstone QoL - Announcements"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=5,13,21;BYMINUTE=39"
    }
    "senior-capstone-qol-account-lifecycle-2" = @{
        Name = "Senior Capstone QoL - Account Lifecycle"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=6,14,22;BYMINUTE=27"
    }
    "senior-capstone-qol-cloudflare-verification-2" = @{
        Name = "Senior Capstone QoL - Cloudflare Verification"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=7,15,23;BYMINUTE=15"
    }
}

$requiredPromptFragments = @(
    "docs/master-plan.md",
    "docs/mvp-requirements-catalog.md",
    "docs/automation-runbook.md",
    "docs/automation-self-improvement.md",
    "docs/automation-cadence.md",
    "docs/automation-milestones.md",
    "docs/automation-memory.md",
    "docs/progress/run-log.md",
    "docs/progress/runs/",
    "docs/progress/handoffs.md",
    "docs/progress/decision-log.md",
    "docs/automation-backlog.md",
    "docs/artifacts.json",
    "docs/human-decisions.md",
    "git status --short --branch",
    "QoL target",
    "Primary requirement IDs",
    "Token budget guardrail",
    "Laddering rule",
    "A-material quality bar",
    "Surface expansion rule",
    "app code/routes/schema",
    "Cloudflare Pages/D1/env/deploy",
    "Figma route-data-permission handoff",
    "Canva support assets",
    "tests/CI",
    "docs/artifacts/handoffs",
    "No-human-approval rule",
    "Run project scripts non-interactively",
    "Self-improvement to scripts as you go",
    "Only touch automation related to this project",
    "commit",
    "push the current branch",
    "scripts/snapshot-automation-prompts.ps1",
    "scripts/check-automation-contract.ps1",
    "scripts/run-powershell-script.mjs",
    "npm run automation:snapshot",
    "npm run check:automation",
    "npm run check:automation:live",
    "-RequireLive",
    "measure-automation-efficiency.ps1",
    "-OutputPath",
    "accepted_mvp_pass",
    "duration_minutes",
    "output_kind",
    "automation_efficiency.duplicate_scope_checked",
    "automation_efficiency.scale_signal",
    "real auth",
    "protected student records",
    "z4t4tFPAKrMDh6pIYOeEw6",
    "team::1638213362346160913"
)

$targetFragments = @{
    "senior-capstone-qol-source-framework-seed-2" = @("source-framework seed loader", "MVP-009", "data/capstone-framework.json")
    "senior-capstone-qol-drive-upload-oauth-2" = @("Google Drive upload credential/OAuth", "MVP-013", "evidence metadata")
    "senior-capstone-qol-protected-evidence-tests-2" = @("protected evidence access checks", "MVP-014", "permission")
    "senior-capstone-qol-teacher-review-endpoints-2" = @("teacher review", "MVP-015", "revision")
    "senior-capstone-qol-immutable-review-history-2" = @("immutable review history", "MVP-016", "submission versioning")
    "senior-capstone-qol-mentor-presentation-flow-2" = @("mentor assigned-student", "MVP-017", "presentation")
    "senior-capstone-qol-admin-ops-endpoints-2" = @("admin operations endpoints", "MVP-018", "export")
    "senior-capstone-qol-announcements-2" = @("announcement", "MVP-023", "No student-to-student messaging")
    "senior-capstone-qol-account-lifecycle-2" = @("account lifecycle", "MVP-004", "session expiry")
    "senior-capstone-qol-cloudflare-verification-2" = @("Cloudflare", "MVP-026", "D1 binding")
}

$allWeekDays = @("MO", "TU", "WE", "TH", "FR", "SA", "SU")
$expectedDailyTimes = @(
    "00:03", "00:51", "01:39", "02:27", "03:15", "04:03", "04:51", "05:39", "06:27", "07:15",
    "08:03", "08:51", "09:39", "10:27", "11:15", "12:03", "12:51", "13:39", "14:27", "15:15",
    "16:03", "16:51", "17:39", "18:27", "19:15", "20:03", "20:51", "21:39", "22:27", "23:15"
)
$minimumStartSpacingMinutes = 45

function Get-TomlStringValue {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Key
    )

    $pattern = "(?m)^" + [regex]::Escape($Key) + " = `"((?:\\.|[^`"\\])*)`""
    $match = [regex]::Match($Content, $pattern)
    if (-not $match.Success) {
        throw "Could not find TOML string key '$Key'."
    }

    return ('"' + $match.Groups[1].Value + '"') | ConvertFrom-Json
}

function Get-StringSha256 {
    param([Parameter(Mandatory = $true)][string]$Value)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        $hash = $sha.ComputeHash($bytes)
        return ([BitConverter]::ToString($hash)).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }
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

function Assert-File {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        $failures.Add("Missing required file: $Path")
    }
}

function Get-JsonProperty {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string]$Name
    )

    if ($Object.PSObject.Properties.Name -contains $Name) {
        return $Object.$Name
    }

    return $null
}

function Get-ManifestTimestamp {
    param([Parameter(Mandatory = $true)]$Manifest)

    foreach ($field in @("timestamp", "timestamp_local")) {
        $value = Get-JsonProperty -Object $Manifest -Name $field
        if ($value) {
            try {
                return [DateTimeOffset]::Parse([string]$value)
            }
            catch {
                return $null
            }
        }
    }

    return $null
}

function Get-SnapshotStringValue {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Key
    )

    $pattern = "(?m)^" + [regex]::Escape($Key) + ': "([^"]*)"'
    $match = [regex]::Match($Content, $pattern)
    if (-not $match.Success) {
        throw "Could not find snapshot frontmatter key '$Key'."
    }

    return $match.Groups[1].Value -replace "`r`n", "`n"
}

function Get-SnapshotPrompt {
    param([Parameter(Mandatory = $true)][string]$Content)

    $match = [regex]::Match($Content, "(?s)## Prompt\s*(?:\r?\n)+~~~~text(?:\r?\n)(.*?)(?:\r?\n)~~~~")
    if (-not $match.Success) {
        throw "Could not find prompt code fence in snapshot."
    }

    return $match.Groups[1].Value -replace "`r`n", "`n"
}

$hasAnyExpectedLiveAutomation = $false
if (Test-Path -LiteralPath $AutomationRoot) {
    foreach ($id in $automationIds) {
        if (Test-Path -LiteralPath (Join-Path $AutomationRoot "$id\automation.toml")) {
            $hasAnyExpectedLiveAutomation = $true
            break
        }
    }
}

if (-not (Test-Path -LiteralPath $AutomationRoot)) {
    if ($RequireLive) {
        $failures.Add("Missing automation root: $AutomationRoot")
    }
    else {
        $warnings.Add("Missing automation root '$AutomationRoot'; validating repo prompt snapshots instead. Use -RequireLive to fail this condition.")
    }
}
else {
    $projectTomls = @(Get-ChildItem -LiteralPath $AutomationRoot -Recurse -Filter "automation.toml" | Where-Object { $_.FullName -like "*senior-capstone*" })
    foreach ($toml in $projectTomls) {
        $id = $toml.Directory.Name
        if ($automationIds -notcontains $id) {
            if ($RequireLive -or $hasAnyExpectedLiveAutomation) {
                $failures.Add("Unexpected Senior Capstone automation TOML exists after reset: $($toml.FullName)")
            }
            else {
                $warnings.Add("Unexpected Senior Capstone automation TOML found outside the expected live set: $($toml.FullName)")
            }
        }
    }
}

$scheduleSlots = @{}
$activeSlotsByDay = @{}
$combinedPromptText = ""
foreach ($day in $allWeekDays) {
    $activeSlotsByDay[$day] = New-Object System.Collections.Generic.List[string]
}

foreach ($id in $automationIds) {
    $tomlPath = Join-Path $AutomationRoot "$id\automation.toml"
    $snapshotPath = Join-Path $RepoRoot "docs\automation-prompts\$id.md"
    $sourceKind = "live"
    $expected = $expectedAutomationConfig[$id]

    if (-not (Test-Path -LiteralPath $tomlPath)) {
        if ($RequireLive) {
            $failures.Add("Missing live automation TOML: $tomlPath")
        }

        if (-not (Test-Path -LiteralPath $snapshotPath)) {
            $failures.Add("$id is missing both live TOML and repo prompt snapshot: $snapshotPath")
            continue
        }

        $snapshot = Get-Content -Raw -LiteralPath $snapshotPath
        try {
            $name = Get-SnapshotStringValue -Content $snapshot -Key "name"
            $prompt = Get-SnapshotPrompt -Content $snapshot
            $status = $expected.Status
            $rrule = Get-SnapshotStringValue -Content $snapshot -Key "rrule"
            $sourceKind = "snapshot"
            $snapshotFallbacks += 1
        }
        catch {
            $failures.Add("$id snapshot could not be parsed: $($_.Exception.Message)")
            continue
        }

        $warnings.Add("$id live TOML was not found; validated repo snapshot $snapshotPath instead.")
    }
    else {
        $raw = Get-Content -Raw -LiteralPath $tomlPath
        $name = Get-TomlStringValue -Content $raw -Key "name"
        $prompt = Get-TomlStringValue -Content $raw -Key "prompt"
        $status = Get-TomlStringValue -Content $raw -Key "status"
        $rrule = Get-TomlStringValue -Content $raw -Key "rrule"
        $liveAutomationsValidated += 1
    }

    $promptHash = Get-StringSha256 -Value $prompt
    $combinedPromptText += [Environment]::NewLine + $prompt

    if ($name -ne $expected.Name) {
        $failures.Add("$id $sourceKind config has unexpected name '$name'; expected '$($expected.Name)'")
    }
    if ($status -ne $expected.Status) {
        $failures.Add("$id $sourceKind config has unexpected status '$status'; expected '$($expected.Status)'")
    }
    if ($rrule -ne $expected.RRule) {
        $failures.Add("$id $sourceKind config has unexpected RRULE '$rrule'; expected '$($expected.RRule)'")
    }

    foreach ($fragment in $requiredPromptFragments) {
        if ($prompt -notlike "*$fragment*") {
            $failures.Add("$id prompt is missing required fragment: $fragment")
        }
    }

    foreach ($fragment in $targetFragments[$id]) {
        if ($prompt -notlike "*$fragment*") {
            $failures.Add("$id prompt is missing target fragment: $fragment")
        }
    }

    $days = @(Get-RRulePart -RRule $rrule -Key "BYDAY")
    $hours = @(Get-RRulePart -RRule $rrule -Key "BYHOUR")
    $minutes = @(Get-RRulePart -RRule $rrule -Key "BYMINUTE")
    if ($days.Count -ne 7 -or $hours.Count -ne 3 -or $minutes.Count -ne 1) {
        $failures.Add("$id must run exactly 3x/day across all seven days; got RRULE $rrule")
    }
    else {
        foreach ($day in $days) {
            foreach ($hour in $hours) {
                $minuteValue = [int]($minutes[0])
                $time = "{0:D2}:{1:D2}" -f [int]$hour, $minuteValue
                $slot = "{0} {1}" -f $day, $time
                if (-not $scheduleSlots.ContainsKey($slot)) {
                    $scheduleSlots[$slot] = New-Object System.Collections.Generic.List[string]
                }
                $scheduleSlots[$slot].Add($id)
                if ($status -eq "ACTIVE") {
                    $activeSlotsByDay[$day].Add($time)
                }
            }
        }
    }

    if (-not (Test-Path -LiteralPath $snapshotPath)) {
        $failures.Add("$id is missing prompt snapshot: $snapshotPath")
    }
    else {
        $snapshot = Get-Content -Raw -LiteralPath $snapshotPath
        try {
            $snapshotPrompt = Get-SnapshotPrompt -Content $snapshot
            $snapshotPromptHash = Get-StringSha256 -Value $snapshotPrompt
            if ($snapshotPromptHash -ne $promptHash) {
                $failures.Add("$id snapshot prompt hash does not match $sourceKind prompt hash")
            }
        }
        catch {
            $failures.Add("$id snapshot prompt body could not be parsed: $($_.Exception.Message)")
        }

        $hashMatch = [regex]::Match($snapshot, 'prompt_sha256: "([a-f0-9]{64})"')
        if (-not $hashMatch.Success) {
            $failures.Add("$id snapshot is missing prompt_sha256 frontmatter")
        }
        elseif ($hashMatch.Groups[1].Value -ne $promptHash) {
            $failures.Add("$id snapshot hash does not match $sourceKind prompt")
        }
    }
}

foreach ($slot in $scheduleSlots.Keys) {
    if ($scheduleSlots[$slot].Count -gt 1) {
        $failures.Add("Schedule slot conflict at $slot`: $($scheduleSlots[$slot] -join ', ')")
    }
}

foreach ($day in $allWeekDays) {
    $times = @($activeSlotsByDay[$day] | Sort-Object)
    $expected = @($expectedDailyTimes | Sort-Object)
    if ($times.Count -ne 30) {
        $failures.Add("$day has $($times.Count) active Senior Capstone QoL starts; expected 30")
    }
    elseif (($times -join ",") -ne ($expected -join ",")) {
        $failures.Add("$day active QoL starts are $($times -join ', '); expected $($expected -join ', ')")
    }

    $minutesOfDay = @($times | ForEach-Object {
        $parts = $_.Split(":")
        ([int]$parts[0] * 60) + [int]$parts[1]
    } | Sort-Object)
    for ($i = 0; $i -lt $minutesOfDay.Count; $i++) {
        $current = $minutesOfDay[$i]
        $next = if ($i -eq $minutesOfDay.Count - 1) { $minutesOfDay[0] + 1440 } else { $minutesOfDay[$i + 1] }
        if (($next - $current) -lt $minimumStartSpacingMinutes) {
            $failures.Add("$day has QoL starts less than $minimumStartSpacingMinutes minutes apart around minute $current")
        }
    }
}

$requiredFiles = @(
    "docs\master-plan.md",
    "docs\mvp-requirements-catalog.md",
    "docs\automation-runbook.md",
    "docs\automation-self-improvement.md",
    "docs\automation-cadence.md",
    "docs\automation-milestones.md",
    "docs\automation-memory.md",
    "docs\automation-backlog.md",
    "docs\automation-prompts\README.md",
    "docs\progress\run-log.md",
    "docs\progress\handoffs.md",
    "docs\progress\decision-log.md",
    "docs\progress\runs\README.md",
    "docs\audits\automation-30-day-efficiency-audit-2026-05-18.md",
    "docs\progress\figma.md",
    "docs\progress\canva.md",
    "docs\progress\rebuild.md",
    "docs\progress\audit.md",
    "docs\progress\weekly-deep-audit.md",
    "docs\daily-automation-reporting.md",
    "docs\daily-automation-reports.md",
    "docs\human-decisions.md",
    "docs\artifacts.json",
    "docs\architecture\adr-0001-stack-auth-database-upload.md",
    "scripts\snapshot-automation-prompts.ps1",
    "scripts\check-automation-contract.ps1",
    "scripts\run-powershell-script.mjs",
    "scripts\measure-automation-efficiency.ps1"
)

foreach ($relative in $requiredFiles) {
    Assert-File -Path (Join-Path $RepoRoot $relative)
}

$scriptDir = Join-Path $RepoRoot "scripts"
if (Test-Path -LiteralPath $scriptDir) {
    $forbiddenPowerShellPatterns = @(
        ("Read" + "-Host"),
        ("Prompt" + "ForChoice"),
        ("(?m)^\s*" + "Pause\b"),
        ("-" + "Confirm")
    )

    Get-ChildItem -LiteralPath $scriptDir -Filter "*.ps1" -File | ForEach-Object {
        $scriptContent = Get-Content -Raw -LiteralPath $_.FullName
        foreach ($pattern in $forbiddenPowerShellPatterns) {
            if ($scriptContent -match $pattern) {
                $failures.Add("Project script $($_.Name) contains interactive approval/prompt pattern: $pattern")
            }
        }
    }

    $forbiddenGeneralScriptPatterns = @(
        "readline\.createInterface",
        "\binquirer\b",
        "\bprompts\(",
        "\bprompt\(",
        "\bconfirm\(",
        "process\.stdin\.resume\("
    )

    Get-ChildItem -LiteralPath $scriptDir -Include "*.js", "*.mjs", "*.cjs", "*.ts" -File -Recurse | ForEach-Object {
        $scriptContent = Get-Content -Raw -LiteralPath $_.FullName
        foreach ($pattern in $forbiddenGeneralScriptPatterns) {
            if ($scriptContent -match $pattern) {
                $failures.Add("Project script $($_.Name) contains interactive approval/prompt pattern: $pattern")
            }
        }
    }
}
else {
    $failures.Add("Missing scripts directory: $scriptDir")
}

$jsonFiles = New-Object System.Collections.Generic.List[string]
$jsonFiles.Add("docs\artifacts.json")

$runManifestDir = Join-Path $RepoRoot "docs\progress\runs"
if (Test-Path -LiteralPath $runManifestDir) {
    Get-ChildItem -LiteralPath $runManifestDir -Filter "*.json" | ForEach-Object {
        $jsonFiles.Add((Resolve-Path -Relative -LiteralPath $_.FullName))
    }
}
else {
    $failures.Add("Missing run manifest directory: $runManifestDir")
}

foreach ($relative in $jsonFiles) {
    $path = Join-Path $RepoRoot $relative
    if (Test-Path -LiteralPath $path) {
        try {
            $jsonObject = Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
            $normalizedPath = ($relative -replace "\\", "/")
            if ($normalizedPath -like "*docs/progress/runs/*.json") {
                $timestamp = Get-ManifestTimestamp -Manifest $jsonObject
                $telemetryCutoff = [DateTimeOffset]::Parse("2026-05-18T14:47:00-07:00")
                if ($timestamp -and $timestamp -ge $telemetryCutoff) {
                    $requirementIds = Get-JsonProperty -Object $jsonObject -Name "requirement_ids"
                    if ($null -eq $requirementIds -or @($requirementIds).Count -eq 0) {
                        $failures.Add("Run manifest $relative is missing non-empty requirement_ids telemetry")
                    }

                    if ($jsonObject.PSObject.Properties.Name -notcontains "accepted_mvp_pass") {
                        $failures.Add("Run manifest $relative is missing accepted_mvp_pass telemetry")
                    }
                    elseif ($jsonObject.accepted_mvp_pass -isnot [bool]) {
                        $failures.Add("Run manifest $relative accepted_mvp_pass must be a boolean")
                    }

                    $durationMinutes = Get-JsonProperty -Object $jsonObject -Name "duration_minutes"
                    if ($null -eq $durationMinutes) {
                        $failures.Add("Run manifest $relative is missing duration_minutes telemetry")
                    }
                    elseif (-not ($durationMinutes -is [int] -or $durationMinutes -is [long] -or $durationMinutes -is [double] -or $durationMinutes -is [decimal]) -or [double]$durationMinutes -lt 0) {
                        $failures.Add("Run manifest $relative duration_minutes must be a non-negative number")
                    }

                    $allowedOutputKinds = @("implementation", "test", "deployment-proof", "figma", "canva", "audit", "script-repair", "blocker")
                    $outputKind = [string](Get-JsonProperty -Object $jsonObject -Name "output_kind")
                    if (-not $outputKind -or $allowedOutputKinds -notcontains $outputKind) {
                        $failures.Add("Run manifest $relative output_kind must be one of: $($allowedOutputKinds -join ', ')")
                    }

                    $automationEfficiency = Get-JsonProperty -Object $jsonObject -Name "automation_efficiency"
                    if ($null -eq $automationEfficiency) {
                        $failures.Add("Run manifest $relative is missing automation_efficiency telemetry")
                    }
                    else {
                        $scaleSignal = [string](Get-JsonProperty -Object $automationEfficiency -Name "scale_signal")
                        $allowedScaleSignals = @("keep", "retarget", "reduce-collisions", "needs-human-blocker")
                        if (-not $scaleSignal -or $allowedScaleSignals -notcontains $scaleSignal) {
                            $failures.Add("Run manifest $relative automation_efficiency.scale_signal must be one of: $($allowedScaleSignals -join ', ')")
                        }

                        if ($automationEfficiency.PSObject.Properties.Name -notcontains "duplicate_scope_checked") {
                            $failures.Add("Run manifest $relative automation_efficiency is missing duplicate_scope_checked")
                        }
                        elseif ($automationEfficiency.duplicate_scope_checked -isnot [bool]) {
                            $failures.Add("Run manifest $relative automation_efficiency.duplicate_scope_checked must be a boolean")
                        }
                    }
                }
            }
        }
        catch {
            $failures.Add("Invalid JSON in $relative`: $($_.Exception.Message)")
        }
    }
    else {
        $failures.Add("Missing required JSON file: $relative")
    }
}

$runbookPath = Join-Path $RepoRoot "docs\automation-runbook.md"
if (Test-Path -LiteralPath $runbookPath) {
    $runbook = Get-Content -Raw -LiteralPath $runbookPath
    foreach ($fragment in @("QoL Automation Rebuild", "Token Budget Guardrail", "30-Day Efficiency Auto-Scaling Protocol", "measure-automation-efficiency.ps1", "accepted_mvp_pass", "Surface Expansion Rule", "No-Human-Approval Script Rule", "-NonInteractive", "local-only repo changes are not an acceptable closeout")) {
        if ($runbook -notlike "*$fragment*") {
            $failures.Add("Runbook is missing infrastructure reference: $fragment")
        }
    }
}

$masterPlanPath = Join-Path $RepoRoot "docs\master-plan.md"
if (Test-Path -LiteralPath $masterPlanPath) {
    $masterPlan = Get-Content -Raw -LiteralPath $masterPlanPath
    foreach ($fragment in @("docs/mvp-requirements-catalog.md", "Real Daily MVP Goal", "Minimum: 2 accepted MVP passes per calendar day", "QoL Automation Rebuild", "30-day efficiency rule", "measure-automation-efficiency.ps1")) {
        if ($masterPlan -notlike "*$fragment*") {
            $failures.Add("Master plan is missing category/daily goal reference: $fragment")
        }
    }
}

$manifestReadmePath = Join-Path $RepoRoot "docs\progress\runs\README.md"
if (Test-Path -LiteralPath $manifestReadmePath) {
    $manifestReadme = Get-Content -Raw -LiteralPath $manifestReadmePath
    foreach ($fragment in @("accepted_mvp_pass", "duration_minutes", "output_kind", "automation_efficiency", "scale_signal")) {
        if ($manifestReadme -notlike "*$fragment*") {
            $failures.Add("Run manifest README is missing efficiency field reference: $fragment")
        }
    }
}

$catalogPath = Join-Path $RepoRoot "docs\mvp-requirements-catalog.md"
if (Test-Path -LiteralPath $catalogPath) {
    $catalog = Get-Content -Raw -LiteralPath $catalogPath
    $allMvpRequirementIds = 1..30 | ForEach-Object { "MVP-{0:D3}" -f $_ }
    foreach ($category in @("requirements-audit", "backend-security-data", "student-workflow-evidence", "staff-review-mentor", "admin-ops-reporting", "deployment-qa", "design-assets-handoff")) {
        if ($catalog -notlike "*$category*") {
            $failures.Add("MVP requirements catalog is missing category: $category")
        }
    }
    foreach ($requirementId in $allMvpRequirementIds) {
        if ($catalog -notlike "*$requirementId*") {
            $failures.Add("MVP requirements catalog is missing requirement: $requirementId")
        }
        if ($combinedPromptText -notlike "*$requirementId*") {
            $failures.Add("No active QoL automation prompt explicitly references requirement: $requirementId")
        }
    }
}

foreach ($warning in $warnings) {
    Write-Warning $warning
}

if ($failures.Count -gt 0) {
    $failureText = ($failures | ForEach-Object { "- $_" }) -join [Environment]::NewLine
    Write-Error ("Automation contract check failed:" + [Environment]::NewLine + $failureText)
    exit 1
}

Write-Output "Automation contract check passed for $($automationIds.Count) QoL automations ($liveAutomationsValidated live, $snapshotFallbacks snapshot fallback)."
