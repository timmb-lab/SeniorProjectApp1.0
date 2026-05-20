param(
    [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$failures = New-Object System.Collections.Generic.List[string]
$checkedFiles = New-Object System.Collections.Generic.List[string]
$excluded = New-Object System.Collections.Generic.List[string]

function Read-Text {
    param([Parameter(Mandatory = $true)][string]$RelativePath)

    $path = Join-Path $RepoRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        $failures.Add("Missing required file: $RelativePath")
        return ""
    }

    $checkedFiles.Add($RelativePath)
    return Get-Content -Raw -LiteralPath $path
}

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Context
    )

    if ($Text -notlike "*$Needle*") {
        $failures.Add("$Context is missing required text: $Needle")
    }
}

function Assert-NotMatch {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Pattern,
        [Parameter(Mandatory = $true)][string]$Context
    )

    if ($Text -match $Pattern) {
        $failures.Add("$Context still contains disallowed cadence pattern: $Pattern")
    }
}

$projectLockText = Read-Text "automation\qol\project-lock.json"
if ($projectLockText) {
    try {
        $projectLock = $projectLockText | ConvertFrom-Json
        if ($projectLock.expectedAutomationCadenceRRule -ne "FREQ=MINUTELY;INTERVAL=30") {
            $failures.Add("project-lock expectedAutomationCadenceRRule must be FREQ=MINUTELY;INTERVAL=30")
        }
        if ($projectLock.expectedAutomationCadenceDescription -ne "every 30 minutes") {
            $failures.Add("project-lock expectedAutomationCadenceDescription must be every 30 minutes")
        }
        $allowedIds = @($projectLock.allowedActiveAutomationIds | Where-Object { $_ })
        if ($allowedIds.Count -ne 1) {
            $failures.Add("project-lock must allow exactly one active project automation; found $($allowedIds.Count)")
        }
        elseif ($allowedIds[0] -ne $projectLock.automationId) {
            $failures.Add("project-lock allowed active automation must match automationId")
        }
    }
    catch {
        $failures.Add("project-lock is not valid JSON: $($_.Exception.Message)")
    }
}

$legacyConfigText = Read-Text "scripts\automation-config.json"
if ($legacyConfigText) {
    try {
        $legacyConfig = $legacyConfigText | ConvertFrom-Json
        $superseded = $legacyConfig.supersededBySingleGuiAutomation
        if ($null -eq $superseded) {
            $failures.Add("scripts/automation-config.json must mark the old prompt snapshot inventory as superseded by the single GUI automation")
        }
        elseif ($superseded.automationId -ne "senior-capstone-hourly-qol-orchestrator" -or
            $superseded.cadenceRRule -ne "FREQ=MINUTELY;INTERVAL=30" -or
            $superseded.sourceOfTruth -ne "automation/qol/project-lock.json") {
            $failures.Add("scripts/automation-config.json supersededBySingleGuiAutomation must point to the 30-minute project lock source of truth")
        }
    }
    catch {
        $failures.Add("scripts/automation-config.json is not valid JSON: $($_.Exception.Message)")
    }
}

$guiDoc = Read-Text "automation\qol\GUI_ALLOWED_COMMANDS.md"
Assert-Contains $guiDoc "bounded 30-minute GUI runner" "GUI allowed command doc"
Assert-Contains $guiDoc "scheduled 30-minute canary" "GUI allowed command doc"
Assert-NotMatch $guiDoc "top-of-hour|once per hour|every hour" "GUI allowed command doc"

$readme = Read-Text "automation\qol\README.md"
Assert-Contains $readme "30-minute orchestrator" "QoL README"
Assert-NotMatch $readme "Project-Local QoL Hourly|Run the hourly orchestrator|hourly GUI" "QoL README"

$schema = Read-Text "automation\qol\REPORT_SCHEMA.md"
Assert-Contains $schema "30-minute GUI runner" "QoL report schema"
Assert-NotMatch $schema "hourly GUI runner" "QoL report schema"

$canary = Read-Text "automation\qol\SCHEDULED_GUI_CANARY.md"
Assert-Contains $canary "scheduled 30-minute GUI run" "Scheduled GUI canary"
Assert-NotMatch $canary "top-of-hour|PENDING_NEXT_TOP_OF_HOUR" "Scheduled GUI canary"

$orchestrator = Read-Text "automation\qol\hourly-orchestrator.mjs"
Assert-Contains $orchestrator "PENDING_NEXT_30_MINUTE_RUN" "QoL orchestrator"
Assert-Contains $orchestrator "every_30_minutes" "QoL orchestrator"
Assert-Contains $orchestrator "sinceAttempt >= 0.5" "QoL orchestrator"
Assert-Contains $orchestrator "3 * 30 * 60 * 1000" "QoL orchestrator"
Assert-NotMatch $orchestrator "PENDING_NEXT_TOP_OF_HOUR|QoL Hourly Orchestrator Report|Run the bounded hourly" "QoL orchestrator"

$cadenceDoc = Read-Text "docs\automation-cadence.md"
Assert-Contains $cadenceDoc "Every 30 minutes, all day, every day" "Automation cadence doc"
Assert-Contains $cadenceDoc "senior-capstone-hourly-qol-orchestrator" "Automation cadence doc"
Assert-Contains $cadenceDoc "The orchestrator runs 48 times per day" "Automation cadence doc"
Assert-Contains $cadenceDoc "It is the only active project automation" "Automation cadence doc"
Assert-Contains $cadenceDoc "1,440 active scheduled starts per 30 days" "Automation cadence doc"
Assert-NotMatch $cadenceDoc "Once per hour|24 active scheduled starts/day|720 active scheduled starts|Current hourly scale math" "Automation cadence doc"

$runbook = Read-Text "docs\automation-runbook.md"
Assert-Contains $runbook "runs every 30 minutes all day" "Automation runbook"
Assert-Contains $runbook "senior-capstone-hourly-qol-orchestrator" "Automation runbook"
Assert-Contains $runbook "daily active start capacity is 48" "Automation runbook"
Assert-Contains $runbook "1,440 active scheduled starts in 30 days" "Automation runbook"
Assert-NotMatch $runbook "runs once per hour|24 active starts/day|720 active scheduled starts|current hourly orchestrator cadence" "Automation runbook"

$masterPlan = Read-Text "docs\master-plan.md"
Assert-Contains $masterPlan "one GUI-available 30-minute master-plan orchestrator" "Master plan"
Assert-Contains $masterPlan "senior-capstone-hourly-qol-orchestrator" "Master plan"
Assert-Contains $masterPlan "48 active starts/day" "Master plan"
Assert-Contains $masterPlan "1,440 active scheduled starts in 30 days" "Master plan"
Assert-NotMatch $masterPlan "runs once per hour|24 active starts|720 active scheduled starts|current active cadence is one hourly" "Master plan"

$catalog = Read-Text "docs\mvp-requirements-catalog.md"
Assert-Contains $catalog "one 30-minute master-plan orchestrator" "MVP requirements catalog"
Assert-NotMatch $catalog "one hourly master-plan orchestrator" "MVP requirements catalog"

$automationDoc = Read-Text "docs\automation.md"
Assert-Contains $automationDoc "QoL 30-minute GUI runner" "Automation wrapper doc"
Assert-NotMatch $automationDoc "QoL hourly GUI runner|bounded hourly path" "Automation wrapper doc"

$testFile = Read-Text "tests\qol-orchestrator.test.mjs"
Assert-Contains $testFile "PENDING_NEXT_30_MINUTE_RUN" "QoL orchestrator tests"
Assert-NotMatch $testFile "PENDING_NEXT_TOP_OF_HOUR" "QoL orchestrator tests"

$excluded.Add("scripts/automation-config.json: superseded prompt snapshot config for old QoL fleet; current source of truth is automation/qol/project-lock.json")
$excluded.Add("docs/automation-prompts/**: repo snapshots for superseded non-GUI automation shapes")
$excluded.Add("automation/qol/logs/** and timestamped automation/qol/reports/*.md: historical run evidence")
$excluded.Add("automation/backups/**: safety backup created for this cadence update")
$excluded.Add("docs/progress/**, docs/audits/**, docs/automation-progress.md: historical progress and audit records")

if ($failures.Count -gt 0) {
    Write-Output "30-minute cadence verification failed."
    Write-Output "Checked files: $($checkedFiles.Count)"
    foreach ($failure in $failures) {
        Write-Output "- $failure"
    }
    exit 1
}

Write-Output "30-minute cadence verification passed."
Write-Output "Checked files: $($checkedFiles.Count)"
Write-Output "Active automation: single GUI runner from automation/qol/project-lock.json"
Write-Output "Cadence: FREQ=MINUTELY;INTERVAL=30"
Write-Output "Excluded as non-active/historical:"
foreach ($item in $excluded) {
    Write-Output "- $item"
}
