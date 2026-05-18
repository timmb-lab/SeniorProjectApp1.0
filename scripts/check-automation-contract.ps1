param(
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$failures = New-Object System.Collections.Generic.List[string]

$automationIds = @(
    "senior-capstone-mvp-requirements-audit",
    "senior-capstone-backend-security-data",
    "senior-capstone-student-workflow-evidence",
    "senior-capstone-staff-review-mentor",
    "senior-capstone-admin-ops-reporting",
    "senior-capstone-deployment-qa",
    "senior-capstone-design-assets-handoff"
)

$legacyAutomationIds = @(
    "senior-capstone-canva-visual-system-rebuilt",
    "senior-capstone-content-quality-audits-rebuilt",
    "senior-capstone-daily-automation-report-rebuilt",
    "senior-capstone-daily-guided-prototype-refresh",
    "senior-capstone-figma-product-design-rebuilt",
    "senior-capstone-rebuild-rebuilt",
    "senior-capstone-weekly-deep-audit-rebuilt"
)

$expectedAutomationConfig = @{
    "senior-capstone-mvp-requirements-audit" = @{
        Name = "Senior Capstone 20x System - Requirements + Audit"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,12,23;BYMINUTE=03"
    }
    "senior-capstone-backend-security-data" = @{
        Name = "Senior Capstone 20x System - Backend Security + Data"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,7,13,19;BYMINUTE=15"
    }
    "senior-capstone-student-workflow-evidence" = @{
        Name = "Senior Capstone 20x System - Student Workflow + Evidence"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=2,8,14,20;BYMINUTE=27"
    }
    "senior-capstone-staff-review-mentor" = @{
        Name = "Senior Capstone 20x System - Staff Review + Mentor"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,10,18;BYMINUTE=39"
    }
    "senior-capstone-admin-ops-reporting" = @{
        Name = "Senior Capstone 20x System - Admin Ops + Reporting"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=4,15;BYMINUTE=51"
    }
    "senior-capstone-deployment-qa" = @{
        Name = "Senior Capstone 20x System - Deployment QA + CI"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=6,17;BYMINUTE=03"
    }
    "senior-capstone-design-assets-handoff" = @{
        Name = "Senior Capstone 20x System - Design Assets + Handoff"
        Status = "ACTIVE"
        RRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=9,21;BYMINUTE=39"
    }
}

$expectedRunsPerDayByAutomation = @{
    "senior-capstone-mvp-requirements-audit" = 3
    "senior-capstone-backend-security-data" = 4
    "senior-capstone-student-workflow-evidence" = 4
    "senior-capstone-staff-review-mentor" = 3
    "senior-capstone-admin-ops-reporting" = 2
    "senior-capstone-deployment-qa" = 2
    "senior-capstone-design-assets-handoff" = 2
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
    "requirement IDs",
    "commit",
    "push the current branch",
    "20x/day Senior Capstone system",
    "A-material quality bar",
    "Surface expansion rule",
    "app code/routes/schema",
    "Cloudflare Pages/D1/env/deploy",
    "Figma route-data-permission handoff",
    "Canva support assets",
    "tests/CI",
    "docs/artifacts/handoffs",
    "No-human-approval rule",
    "auto-approved execution flags",
    "Self-improvement to scripts as you go",
    "Only touch automation related to this project",
    "scripts/snapshot-automation-prompts.ps1",
    "scripts/check-automation-contract.ps1",
    "real auth",
    "protected student records",
    "z4t4tFPAKrMDh6pIYOeEw6",
    "team::1638213362346160913"
)

$categoryFragments = @{
    "senior-capstone-mvp-requirements-audit" = @("requirements-audit", "weekly calibration", "accepted MVP passes", "source-framework coverage")
    "senior-capstone-backend-security-data" = @("backend-security-data", "first-admin bootstrap", "permissions", "D1")
    "senior-capstone-student-workflow-evidence" = @("student-workflow-evidence", "student dashboard", "evidence metadata", "mobile")
    "senior-capstone-staff-review-mentor" = @("staff-review-mentor", "teacher review", "revision", "mentor")
    "senior-capstone-admin-ops-reporting" = @("admin-ops-reporting", "exports", "audit", "misc admin")
    "senior-capstone-deployment-qa" = @("deployment-qa", "Cloudflare", "CI", "smoke")
    "senior-capstone-design-assets-handoff" = @("design-assets-handoff", "Figma", "Canva", "handoff")
}

$allWeekDays = @("MO", "TU", "WE", "TH", "FR", "SA", "SU")
$expectedDailyTimes = @("00:03", "01:15", "02:27", "03:39", "04:51", "06:03", "07:15", "08:27", "09:39", "10:39", "12:03", "13:15", "14:27", "15:51", "17:03", "18:39", "19:15", "20:27", "21:39", "23:03")
$minimumStartSpacingMinutes = 30

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

if (-not (Test-Path -LiteralPath $AutomationRoot)) {
    $failures.Add("Missing automation root: $AutomationRoot")
}
else {
    foreach ($legacyId in $legacyAutomationIds) {
        $legacyToml = Join-Path $AutomationRoot "$legacyId\automation.toml"
        if (Test-Path -LiteralPath $legacyToml) {
            $failures.Add("Legacy Senior Capstone automation TOML still exists after reset: $legacyToml")
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
    $combinedPromptText += [Environment]::NewLine + $prompt

    $expected = $expectedAutomationConfig[$id]
    if ($name -ne $expected.Name) {
        $failures.Add("$id has unexpected name '$name'; expected '$($expected.Name)'")
    }
    if ($status -ne $expected.Status) {
        $failures.Add("$id has unexpected status '$status'; expected '$($expected.Status)'")
    }
    if ($rrule -ne $expected.RRule) {
        $failures.Add("$id has unexpected RRULE '$rrule'; expected '$($expected.RRule)'")
    }

    foreach ($fragment in $requiredPromptFragments) {
        if ($prompt -notlike "*$fragment*") {
            $failures.Add("$id prompt is missing required fragment: $fragment")
        }
    }

    foreach ($fragment in $categoryFragments[$id]) {
        if ($prompt -notlike "*$fragment*") {
            $failures.Add("$id prompt is missing category fragment: $fragment")
        }
    }

    $days = @(Get-RRulePart -RRule $rrule -Key "BYDAY")
    $hours = @(Get-RRulePart -RRule $rrule -Key "BYHOUR")
    $minutes = @(Get-RRulePart -RRule $rrule -Key "BYMINUTE")
    $expectedRunsPerDay = $expectedRunsPerDayByAutomation[$id]
    if ($days.Count -ne 7 -or $hours.Count -ne $expectedRunsPerDay -or $minutes.Count -ne 1) {
        $failures.Add("$id must run $expectedRunsPerDay times per day across all seven days; got RRULE $rrule")
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
    $times = @($activeSlotsByDay[$day] | Sort-Object)
    $expected = @($expectedDailyTimes | Sort-Object)
    if ($times.Count -ne 20) {
        $failures.Add("$day has $($times.Count) active Senior Capstone category starts; expected 20")
    }
    elseif (($times -join ",") -ne ($expected -join ",")) {
        $failures.Add("$day active category starts are $($times -join ', '); expected $($expected -join ', ')")
    }

    $minutesOfDay = @($times | ForEach-Object {
        $parts = $_.Split(":")
        ([int]$parts[0] * 60) + [int]$parts[1]
    } | Sort-Object)
    for ($i = 0; $i -lt $minutesOfDay.Count; $i++) {
        $current = $minutesOfDay[$i]
        $next = if ($i -eq $minutesOfDay.Count - 1) { $minutesOfDay[0] + 1440 } else { $minutesOfDay[$i + 1] }
        if (($next - $current) -lt $minimumStartSpacingMinutes) {
            $failures.Add("$day has category starts less than $minimumStartSpacingMinutes minutes apart around minute $current")
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
    foreach ($fragment in @("docs/mvp-requirements-catalog.md", "Category Runner No-Intervention Contract", "No-Human-Approval Script Rule", "-NonInteractive", "local-only repo changes are not an acceptable closeout")) {
        if ($runbook -notlike "*$fragment*") {
            $failures.Add("Runbook is missing infrastructure reference: $fragment")
        }
    }
}

$masterPlanPath = Join-Path $RepoRoot "docs\master-plan.md"
if (Test-Path -LiteralPath $masterPlanPath) {
    $masterPlan = Get-Content -Raw -LiteralPath $masterPlanPath
    foreach ($fragment in @("docs/mvp-requirements-catalog.md", "Real Daily MVP Goal", "Minimum: 2 accepted MVP passes per calendar day", "20x Automation Readiness")) {
        if ($masterPlan -notlike "*$fragment*") {
            $failures.Add("Master plan is missing category/daily goal reference: $fragment")
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
            $failures.Add("No active category automation prompt explicitly targets requirement: $requirementId")
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Error ("Automation contract check failed:" + [Environment]::NewLine + ($failures | ForEach-Object { "- $_" }) -join [Environment]::NewLine)
    exit 1
}

Write-Output "Automation contract check passed for $($automationIds.Count) category automations."
