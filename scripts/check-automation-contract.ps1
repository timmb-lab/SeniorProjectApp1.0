param(
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$failures = New-Object System.Collections.Generic.List[string]

$automationIds = @(
    "senior-capstone-figma-product-design-rebuilt",
    "senior-capstone-rebuild-rebuilt",
    "senior-capstone-content-quality-audits-rebuilt",
    "senior-capstone-canva-visual-system-rebuilt",
    "senior-capstone-daily-automation-report-rebuilt",
    "senior-capstone-weekly-deep-audit-rebuilt"
)

$requiredPromptFragments = @(
    "master planner",
    "pass logger",
    "docs/master-plan.md",
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
    "git status --short",
    "commit",
    "push the current branch",
    "Publication/script auto-approval hard rule",
    "auto-approved execution flags",
    "committed blockers",
    "automation_update",
    "scripts/snapshot-automation-prompts.ps1",
    "scripts/check-automation-contract.ps1",
    "z4t4tFPAKrMDh6pIYOeEw6",
    "team::1638213362346160913",
    "LLucMgAPscRa9020iHHigB"
)

$expectedAutomationConfig = @{
    "senior-capstone-rebuild-rebuilt" = @{
        Name = "Senior Capstone Gold Standard Orchestrator"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,5,10,15,20;BYMINUTE=20"
    }
    "senior-capstone-figma-product-design-rebuilt" = @{
        Name = "Senior Capstone Figma Product Design Standby"
        Status = "PAUSED"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,7,13,19;BYMINUTE=15"
    }
    "senior-capstone-canva-visual-system-rebuilt" = @{
        Name = "Senior Capstone Canva Visual System Standby"
        Status = "PAUSED"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,6,12,18;BYMINUTE=10"
    }
    "senior-capstone-content-quality-audits-rebuilt" = @{
        Name = "Senior Capstone Content Quality Audit Standby"
        Status = "PAUSED"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,9,15,21;BYMINUTE=45"
    }
    "senior-capstone-daily-automation-report-rebuilt" = @{
        Name = "Senior Capstone Daily Report Standby"
        Status = "PAUSED"
        RRule = "FREQ=DAILY;BYHOUR=7;BYMINUTE=40"
    }
    "senior-capstone-weekly-deep-audit-rebuilt" = @{
        Name = "Senior Capstone Weekly Deep Audit Rebuilt"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=SU;BYHOUR=23;BYMINUTE=45"
    }
}

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

$scheduleSlots = @{}
$activeEverydaySeniorSlots = @{}
$expectedDailyTimes = @("00:20", "05:20", "10:20", "15:20", "20:20")
$allWeekDays = @("MO", "TU", "WE", "TH", "FR", "SA", "SU")

foreach ($day in $allWeekDays) {
    $activeEverydaySeniorSlots[$day] = New-Object System.Collections.Generic.List[string]
}

$knownAutomationIds = @{}
foreach ($id in $automationIds) {
    $knownAutomationIds[$id] = $true
}

if (Test-Path -LiteralPath $AutomationRoot) {
    Get-ChildItem -LiteralPath $AutomationRoot -Directory -Filter "senior-capstone-*" | ForEach-Object {
        if (-not $knownAutomationIds.ContainsKey($_.Name)) {
            $tomlPath = Join-Path $_.FullName "automation.toml"
            if (Test-Path -LiteralPath $tomlPath) {
                $raw = Get-Content -Raw -LiteralPath $tomlPath
                $status = Get-TomlStringValue -Content $raw -Key "status"
                if ($status -eq "ACTIVE") {
                    $failures.Add("Unexpected ACTIVE Senior Capstone automation outside source-of-truth set: $($_.Name)")
                }
            }
        }
    }
}

foreach ($id in $automationIds) {
    $tomlPath = Join-Path $AutomationRoot "$id\automation.toml"
    if (-not (Test-Path -LiteralPath $tomlPath)) {
        $failures.Add("Missing live automation TOML: $tomlPath")
        continue
    }

    $raw = Get-Content -Raw -LiteralPath $tomlPath
    $name = Get-TomlStringValue -Content $raw -Key "name"
    $prompt = Get-TomlStringValue -Content $raw -Key "prompt"
    $status = Get-TomlStringValue -Content $raw -Key "status"
    $rrule = Get-TomlStringValue -Content $raw -Key "rrule"
    $promptHash = Get-StringSha256 -Value $prompt

    $expected = $expectedAutomationConfig[$id]
    if ($expected) {
        if ($name -ne $expected.Name) {
            $failures.Add("$id has unexpected name '$name'; expected '$($expected.Name)'")
        }

        if ($status -ne $expected.Status) {
            $failures.Add("$id has unexpected status '$status'; expected '$($expected.Status)'")
        }

        if ($rrule -ne $expected.RRule) {
            $failures.Add("$id has unexpected RRULE '$rrule'; expected '$($expected.RRule)'")
        }
    }

    if ($status -ne "ACTIVE" -and $prompt -like "*ACTIVE status*") {
        $failures.Add("$id is $status but prompt says to preserve ACTIVE status")
    }

    $days = Get-RRulePart -RRule $rrule -Key "BYDAY"
    if ($days.Count -eq 0 -and $rrule -like "FREQ=DAILY*") {
        $days = @("MO", "TU", "WE", "TH", "FR", "SA", "SU")
    }

    $hours = Get-RRulePart -RRule $rrule -Key "BYHOUR"
    $minutes = Get-RRulePart -RRule $rrule -Key "BYMINUTE"
    if ($days.Count -eq 0 -or $hours.Count -eq 0 -or $minutes.Count -eq 0) {
        $failures.Add("$id has an RRULE the schedule conflict checker cannot parse: $rrule")
    }
    else {
        foreach ($day in $days) {
            foreach ($hour in $hours) {
                foreach ($minute in $minutes) {
                    $time = "{0:D2}:{1:D2}" -f [int]$hour, [int]$minute
                    $slot = "{0} {1}" -f $day, $time
                    if (-not $scheduleSlots.ContainsKey($slot)) {
                        $scheduleSlots[$slot] = New-Object System.Collections.Generic.List[string]
                    }
                    $scheduleSlots[$slot].Add("$($id)[$status]")

                    if ($status -eq "ACTIVE" -and $days.Count -eq 7) {
                        $activeEverydaySeniorSlots[$day].Add("$time $id")
                    }
                }
            }
        }
    }

    foreach ($fragment in $requiredPromptFragments) {
        if ($prompt -notlike "*$fragment*") {
            $failures.Add("$id prompt is missing required fragment: $fragment")
        }
    }

    $snapshotPath = Join-Path $RepoRoot "docs\automation-prompts\$id.md"
    if (-not (Test-Path -LiteralPath $snapshotPath)) {
        $failures.Add("$id is missing prompt snapshot: $snapshotPath")
    }
    else {
        $snapshot = Get-Content -Raw -LiteralPath $snapshotPath
        $hashMatch = [regex]::Match($snapshot, 'prompt_sha256: "([a-f0-9]{64})"')
        if (-not $hashMatch.Success) {
            $failures.Add("$id snapshot is missing prompt_sha256 frontmatter")
        }
        elseif ($hashMatch.Groups[1].Value -ne $promptHash) {
            $failures.Add("$id snapshot hash does not match live prompt")
        }
    }
}

foreach ($slot in $scheduleSlots.Keys) {
    if ($scheduleSlots[$slot].Count -gt 1) {
        $failures.Add("Schedule slot conflict at $slot`: $($scheduleSlots[$slot] -join ', ')")
    }
}

foreach ($day in $allWeekDays) {
    $slots = @($activeEverydaySeniorSlots[$day])
    $times = @($slots | ForEach-Object { ($_ -split " ")[0] } | Sort-Object)
    $expected = @($expectedDailyTimes | Sort-Object)
    $unexpectedOwners = @($slots | Where-Object { $_ -notlike "* senior-capstone-rebuild-rebuilt" })

    if ($slots.Count -ne 5) {
        $failures.Add("$day has $($slots.Count) active everyday Senior Capstone starts; expected exactly 5: $($expectedDailyTimes -join ', ')")
    }
    elseif (($times -join ",") -ne ($expected -join ",")) {
        $failures.Add("$day active everyday Senior Capstone starts are $($times -join ', '); expected exactly $($expectedDailyTimes -join ', ')")
    }

    if ($unexpectedOwners.Count -gt 0) {
        $failures.Add("$day has active daily Senior starts outside the gold orchestrator: $($unexpectedOwners -join ', ')")
    }
}

$requiredFiles = @(
    "docs\master-plan.md",
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
    "scripts\check-automation-contract.ps1"
)

foreach ($relative in $requiredFiles) {
    Assert-File -Path (Join-Path $RepoRoot $relative)
}

$scriptDir = Join-Path $RepoRoot "scripts"
if (Test-Path -LiteralPath $scriptDir) {
    $forbiddenScriptPatterns = @(
        ("Read" + "-Host"),
        ("Prompt" + "ForChoice"),
        ("(?m)^\s*" + "Pause\b"),
        ("-" + "Confirm")
    )

    Get-ChildItem -LiteralPath $scriptDir -Filter "*.ps1" -File | ForEach-Object {
        $scriptContent = Get-Content -Raw -LiteralPath $_.FullName
        foreach ($pattern in $forbiddenScriptPatterns) {
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
            Get-Content -Raw -LiteralPath $path | ConvertFrom-Json | Out-Null
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
    foreach ($fragment in @("master planner", "pass logger", "docs/progress/runs/", "docs/artifacts.json", "docs/human-decisions.md", "scripts/check-automation-contract.ps1", "scripts/snapshot-automation-prompts.ps1", "docs/automation-prompts/", "Project Script Auto-Approval Rule", "-NonInteractive", "local-only repo changes are not an acceptable closeout")) {
        if ($runbook -notlike "*$fragment*") {
            $failures.Add("Runbook is missing infrastructure reference: $fragment")
        }
    }
}
else {
    $failures.Add("Missing runbook: $runbookPath")
}

if ($failures.Count -gt 0) {
    Write-Error ("Automation contract check failed:" + [Environment]::NewLine + ($failures | ForEach-Object { "- $_" }) -join [Environment]::NewLine)
    exit 1
}

Write-Output "Automation contract check passed for $($automationIds.Count) automations."
