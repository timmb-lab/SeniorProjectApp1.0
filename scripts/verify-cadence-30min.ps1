param(
    [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$failures = New-Object System.Collections.Generic.List[string]
$checkedFiles = New-Object System.Collections.Generic.List[string]

$nonFigmaTopId = "senior-capstone-nonfigma-mvp-builder"
$nonFigmaBottomId = "senior-capstone-nonfigma-mvp-builder-bottom"
$figmaTopId = "senior-capstone-figma-product-builder-top"
$figmaBottomId = "senior-capstone-figma-product-builder"
$nonFigmaId = $nonFigmaTopId
$figmaId = $figmaBottomId
$expectedBuilderInstanceIds = @($nonFigmaTopId, $nonFigmaBottomId, $figmaTopId, $figmaBottomId)
$dailyId = "senior-capstone-daily-mvp-summary"
$weeklyId = "senior-capstone-weekly-script-audit"
$legacyId = "senior-capstone-hourly-qol-orchestrator"
$figmaFileKey = "z4t4tFPAKrMDh6pIYOeEw6"
$figmaPlanKey = "team::1638213362346160913"
$expectedRoot = "C:\SeniorProjectApp1.0"

function Normalize-LocalPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    return ([System.IO.Path]::GetFullPath($Path).TrimEnd('\', '/') -replace '/', '\').ToLowerInvariant()
}

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

    if (-not $Text.Contains($Needle)) {
        $failures.Add("$Context is missing required text: $Needle")
    }
}

function Assert-NotContains {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Context
    )

    if ($Text.Contains($Needle)) {
        $failures.Add("$Context contains forbidden text: $Needle")
    }
}

function Assert-Match {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Pattern,
        [Parameter(Mandatory = $true)][string]$Context
    )

    if ($Text -notmatch $Pattern) {
        $failures.Add("$Context does not match required pattern: $Pattern")
    }
}

function Assert-ArrayContains {
    param(
        [Parameter(Mandatory = $true)]$Array,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Context
    )

    if (@($Array | Where-Object { $_ -eq $Needle }).Count -eq 0) {
        $failures.Add("$Context does not include $Needle")
    }
}

function Assert-ArrayNotContains {
    param(
        [Parameter(Mandatory = $true)]$Array,
        [Parameter(Mandatory = $true)][string]$Needle,
        [Parameter(Mandatory = $true)][string]$Context
    )

    if (@($Array | Where-Object { $_ -eq $Needle }).Count -ne 0) {
        $failures.Add("$Context must not include $Needle")
    }
}

function Assert-NoForbiddenScheduledCommandLines {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Context
    )

    $lineNumber = 0
    foreach ($line in ($Text -split '\r?\n')) {
        $lineNumber += 1
        $trimmed = $line.Trim()

        if ($trimmed -match '^(?:[`>\-\*\s]*)(?:\.\\)?node(?:\.exe)?\s+(?:--|automation[\\/]|scripts[\\/]|[A-Za-z]:|\.\\|[\w.-]+\.mjs\b)') {
            $failures.Add("$Context line $lineNumber suggests direct Node scheduled execution: $trimmed")
        }

        if ($trimmed -match '^(?:[`>\-\*\s]*)(?:\.\\)?(?:npm|pnpm|yarn)(?:\.cmd)?\s+') {
            $failures.Add("$Context line $lineNumber suggests package-manager scheduled execution: $trimmed")
        }
    }
}

function Assert-NoHourlyBuilderPromptMutationInstructions {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Context
    )

    $lineNumber = 0
    foreach ($line in ($Text -split '\r?\n')) {
        $lineNumber += 1
        $mentionsHourlyPrompt = $line -match 'automation[\\/]+prompts[\\/]+senior-capstone-(?:nonfigma-mvp-builder|figma-product-builder)\.md'
        $isProtective = $line -match '(?i)\b(do not|never|read-only|forbidden|must not|unchanged|not edit|not edited|without modifying)\b'

        if ($mentionsHourlyPrompt -and -not $isProtective) {
            $failures.Add("$Context line $lineNumber mentions an hourly builder prompt without protective read-only language: $($line.Trim())")
        }
    }
}

function Assert-NoReplacementAutomationInstructions {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [Parameter(Mandatory = $true)][string]$Context
    )

    $lineNumber = 0
    foreach ($line in ($Text -split '\r?\n')) {
        $lineNumber += 1
        $trimmed = $line.Trim()
        $looksLikeReplacementAutomation = $trimmed -match '(?i)\b(create|recreate|clone|register|re-register)\b.*\b(automation|builder)\b'
        $isProtective = $trimmed -match '(?i)\b(do not|never|no creation|forbidden|must not|without deleting|without recreating|not attempted)\b'

        if ($looksLikeReplacementAutomation -and -not $isProtective) {
            $failures.Add("$Context line $lineNumber appears to instruct creating or replacing automations: $trimmed")
        }
    }
}

function Assert-PackageQolScriptsUseWrappers {
    param($PackageJson)

    foreach ($scriptName in @("qol:doctor", "qol:hourly", "qol:hourly:dry-run", "qol:hourly:explain", "qol:smoke", "verify:qol-automation", "verify:automation-cadence", "check:automation")) {
        $property = $PackageJson.scripts.PSObject.Properties[$scriptName]
        $command = if ($property) { [string]$property.Value } else { "" }
        if (-not $command) {
            $failures.Add("package.json is missing script $scriptName")
            continue
        }

        if ($scriptName -eq "verify:automation-cadence" -or $scriptName -eq "check:automation") {
            if ($command -notlike "*scripts/run-npm-script.ps1*" -and $command -notlike "*scripts\run-npm-script.ps1*") {
                $failures.Add("package.json script $scriptName must use scripts/run-npm-script.ps1")
            }
        }
        elseif ($command -notlike "*scripts/run-node-script.ps1*" -and $command -notlike "*scripts\run-node-script.ps1*") {
            $failures.Add("package.json script $scriptName must use scripts/run-node-script.ps1")
        }

        if ($command -match '\bnode(?:\.exe)?\s+automation[\\/]qol[\\/](?:doctor|hourly-orchestrator)\.mjs') {
            $failures.Add("package.json script $scriptName calls Node directly for QoL automation")
        }
    }
}

if ((Normalize-LocalPath $RepoRoot) -ne (Normalize-LocalPath $expectedRoot)) {
    $failures.Add("RepoRoot must resolve to $expectedRoot; got $RepoRoot")
}

try {
    $gitTopLevel = (& git -C $RepoRoot rev-parse --show-toplevel 2>$null).Trim()
    if (-not $gitTopLevel) {
        $failures.Add("git rev-parse --show-toplevel returned empty output")
    }
    elseif ((Normalize-LocalPath $gitTopLevel) -ne (Normalize-LocalPath $RepoRoot)) {
        $failures.Add("RepoRoot does not match git top-level. RepoRoot=$RepoRoot gitTopLevel=$gitTopLevel")
    }
}
catch {
    $failures.Add("Unable to verify git top-level for RepoRoot: $($_.Exception.Message)")
}

$cadenceDoc = Read-Text "docs\automation-cadence.md"
Assert-Contains $cadenceDoc "split-builder cadence" "Automation cadence doc"
foreach ($builderId in $expectedBuilderInstanceIds) {
    Assert-Contains $cadenceDoc $builderId "Automation cadence doc"
}
Assert-Contains $cadenceDoc $dailyId "Automation cadence doc"
Assert-Contains $cadenceDoc $weeklyId "Automation cadence doc"
Assert-Match $cadenceDoc "minute 0|Hourly at minute 0|top-of-hour" "Automation cadence doc"
Assert-Match $cadenceDoc "minute 30|Hourly at minute 30|bottom-of-hour" "Automation cadence doc"
Assert-Contains $cadenceDoc "48 non-Figma starts/day" "Automation cadence doc"
Assert-Contains $cadenceDoc "48 Figma starts/day" "Automation cadence doc"
Assert-Contains $cadenceDoc "96 combined starts/day" "Automation cadence doc"
Assert-Contains $cadenceDoc "48 + 48 = 96 scheduled builder runs per day" "Automation cadence doc"
Assert-Contains $cadenceDoc "1,440 non-Figma starts/30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "1,440 Figma starts/30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "2,880 combined starts/30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "1,440 + 1,440 = 2,880 scheduled builder runs per 30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "Bryan explicitly approved" "Automation cadence doc"
Assert-Contains $cadenceDoc "Daily summary and weekly review are oversight, not builder capacity" "Automation cadence doc"
Assert-Match $cadenceDoc "External scheduler handling" "Automation cadence doc"
Assert-Match $cadenceDoc "unproven scheduler claims" "Automation cadence doc"
Assert-Contains $cadenceDoc "Old single-builder cadence is retired" "Automation cadence doc"
Assert-NoForbiddenScheduledCommandLines $cadenceDoc "Automation cadence doc"

$projectLockText = Read-Text "automation\qol\project-lock.json"
if ($projectLockText) {
    try {
        $projectLock = $projectLockText | ConvertFrom-Json
        foreach ($builderId in $expectedBuilderInstanceIds) {
            Assert-ArrayContains $projectLock.allowedActiveAutomationIds $builderId "project-lock allowedActiveAutomationIds"
            Assert-ArrayContains $projectLock.expectedBuilderAutomationIds $builderId "project-lock expectedBuilderAutomationIds"
        }
        Assert-ArrayContains $projectLock.allowedActiveAutomationIds $dailyId "project-lock allowedActiveAutomationIds"
        Assert-ArrayContains $projectLock.allowedActiveAutomationIds $weeklyId "project-lock allowedActiveAutomationIds"
        Assert-ArrayNotContains $projectLock.allowedActiveAutomationIds $legacyId "project-lock allowedActiveAutomationIds"
        Assert-ArrayContains $projectLock.allowedOversightAutomationIds $dailyId "project-lock allowedOversightAutomationIds"
        Assert-ArrayContains $projectLock.allowedOversightAutomationIds $weeklyId "project-lock allowedOversightAutomationIds"
        Assert-ArrayContains $projectLock.legacyDiagnosticAutomationIds $legacyId "project-lock legacyDiagnosticAutomationIds"
        Assert-ArrayNotContains $projectLock.expectedBuilderAutomationIds $legacyId "project-lock expectedBuilderAutomationIds"

        if (@($projectLock.expectedBuilderAutomationIds).Count -ne 4) {
            $failures.Add("project-lock expectedBuilderAutomationIds must contain exactly the four duplicated split builder IDs")
        }
        if ($projectLock.PSObject.Properties["expectedAutomationCadenceRRule"]) {
            $failures.Add("project-lock must not retain singular expectedAutomationCadenceRRule from the old 30-minute builder")
        }
        if ($projectLock.expectedRepositoryRootWindowsPath -ne $expectedRoot) {
            $failures.Add("project-lock expectedRepositoryRootWindowsPath is incorrect")
        }
        if ([string]$projectLock.automationIdStatus -notmatch "legacy|diagnostic") {
            $failures.Add("project-lock automationIdStatus must mark the old automation ID as legacy/diagnostic")
        }
        if ([string]$projectLock.legacyDiagnosticAutomationStatus -notmatch "manual|diagnostic|non-recurring") {
            $failures.Add("project-lock legacyDiagnosticAutomationStatus must mark the old automation ID manual/diagnostic/non-recurring")
        }

        if ($projectLock.expectedAutomationCadenceDescription -ne "duplicated split hourly builders: non-Figma at minute 0 and minute 30 PT; Figma-only at minute 0 and minute 30 PT") {
            $failures.Add("project-lock expectedAutomationCadenceDescription does not describe the duplicated split hourly builders")
        }
        if (@($projectLock.expectedBuilderInstances).Count -ne 4) {
            $failures.Add("project-lock expectedBuilderInstances must contain exactly four builder instances")
        }
        if ($projectLock.expectedBuilderCadences.nonFigmaTop.id -ne $nonFigmaTopId -or $projectLock.expectedBuilderCadences.nonFigmaTop.rrule -ne "FREQ=HOURLY;BYMINUTE=0;BYSECOND=0") {
            $failures.Add("project-lock expectedBuilderCadences.nonFigmaTop is incorrect")
        }
        if ($projectLock.expectedBuilderCadences.nonFigmaBottom.id -ne $nonFigmaBottomId -or $projectLock.expectedBuilderCadences.nonFigmaBottom.rrule -ne "FREQ=HOURLY;BYMINUTE=30;BYSECOND=0") {
            $failures.Add("project-lock expectedBuilderCadences.nonFigmaBottom is incorrect")
        }
        if ($projectLock.expectedBuilderCadences.figmaTop.id -ne $figmaTopId -or $projectLock.expectedBuilderCadences.figmaTop.rrule -ne "FREQ=HOURLY;BYMINUTE=0;BYSECOND=0") {
            $failures.Add("project-lock expectedBuilderCadences.figmaTop is incorrect")
        }
        if ($projectLock.expectedBuilderCadences.figmaBottom.id -ne $figmaBottomId -or $projectLock.expectedBuilderCadences.figmaBottom.rrule -ne "FREQ=HOURLY;BYMINUTE=30;BYSECOND=0") {
            $failures.Add("project-lock expectedBuilderCadences.figmaBottom is incorrect")
        }
        if ($projectLock.expectedOversightCadences.daily.id -ne $dailyId) {
            $failures.Add("project-lock expectedOversightCadences.daily.id is incorrect")
        }
        if ($projectLock.expectedOversightCadences.daily.rrule -ne "FREQ=DAILY;BYHOUR=8;BYMINUTE=0;BYSECOND=0") {
            $failures.Add("project-lock daily oversight RRULE is incorrect")
        }
        if ($projectLock.expectedOversightCadences.weekly.id -ne $weeklyId) {
            $failures.Add("project-lock expectedOversightCadences.weekly.id is incorrect")
        }
        if ($projectLock.expectedOversightCadences.weekly.rrule -ne "FREQ=WEEKLY;BYDAY=SU;BYHOUR=18;BYMINUTE=0;BYSECOND=0") {
            $failures.Add("project-lock weekly oversight RRULE is incorrect")
        }
        if ($projectLock.expectedOversightPromptPaths.daily -ne "automation/prompts/senior-capstone-daily-mvp-summary.md") {
            $failures.Add("project-lock expectedOversightPromptPaths.daily is incorrect")
        }
        if ($projectLock.expectedOversightPromptPaths.weekly -ne "automation/prompts/senior-capstone-weekly-script-audit.md") {
            $failures.Add("project-lock expectedOversightPromptPaths.weekly is incorrect")
        }
    }
    catch {
        $failures.Add("project-lock is not valid JSON: $($_.Exception.Message)")
    }
}

$nonFigmaPromptPath = "automation\prompts\senior-capstone-nonfigma-mvp-builder.md"
$figmaPromptPath = "automation\prompts\senior-capstone-figma-product-builder.md"
$dailyPromptPath = "automation\prompts\senior-capstone-daily-mvp-summary.md"
$weeklyPromptPath = "automation\prompts\senior-capstone-weekly-script-audit.md"
$nonFigmaPrompt = Read-Text $nonFigmaPromptPath
$figmaPrompt = Read-Text $figmaPromptPath
$dailyPrompt = Read-Text $dailyPromptPath
$weeklyPrompt = Read-Text $weeklyPromptPath

Assert-Contains $nonFigmaPrompt $nonFigmaId "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "minute 0" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "top-of-hour" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt $expectedRoot "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "DIRTY_WORKTREE" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "C:\Curriculum" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Do not call Figma tools." "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Do not use Figma MCP." "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Do not create Figma files." "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Do not edit Figma files." "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Stage only files touched by this run" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt 'Push to `origin main`' "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "docs/progress/run-log.md" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "docs/progress/runs/" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "docs/mvp-requirements-catalog.md" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "exact blocker" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Accepted pass criteria" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Blocked or needs-review criteria" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "report-only churn" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "broad docs churn" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "broad Figma polish" "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "Do not claim external scheduler changes" "Non-Figma prompt"
Assert-NotContains $nonFigmaPrompt "runs every 30 minutes" "Non-Figma prompt"
Assert-NoForbiddenScheduledCommandLines $nonFigmaPrompt "Non-Figma prompt"

Assert-Contains $figmaPrompt $figmaId "Figma prompt"
Assert-Contains $figmaPrompt "minute 30" "Figma prompt"
Assert-Contains $figmaPrompt "bottom-of-hour" "Figma prompt"
Assert-Contains $figmaPrompt $expectedRoot "Figma prompt"
Assert-Contains $figmaPrompt "DIRTY_WORKTREE" "Figma prompt"
Assert-Contains $figmaPrompt "C:\Curriculum" "Figma prompt"
Assert-Contains $figmaPrompt "Figma-only" "Figma prompt"
Assert-Contains $figmaPrompt $figmaFileKey "Figma prompt"
Assert-Contains $figmaPrompt $figmaPlanKey "Figma prompt"
Assert-Contains $figmaPrompt "MVP-028" "Figma prompt"
Assert-Contains $figmaPrompt "Do not implement backend code." "Figma prompt"
Assert-Contains $figmaPrompt "Do not modify production route behavior." "Figma prompt"
Assert-Contains $figmaPrompt "route/data/permission" "Figma prompt"
Assert-Contains $figmaPrompt "state variants" "Figma prompt"
Assert-Contains $figmaPrompt "exact Figma blocker" "Figma prompt"
Assert-Contains $figmaPrompt "Stage only files touched by this Figma run" "Figma prompt"
Assert-Contains $figmaPrompt 'Push to `origin main`' "Figma prompt"
Assert-Contains $figmaPrompt "docs/artifacts.json" "Figma prompt"
Assert-Contains $figmaPrompt "docs/progress/run-log.md" "Figma prompt"
Assert-Contains $figmaPrompt "docs/progress/runs/" "Figma prompt"
Assert-Contains $figmaPrompt "Accepted pass criteria" "Figma prompt"
Assert-Contains $figmaPrompt "Blocked or needs-review criteria" "Figma prompt"
Assert-Contains $figmaPrompt "concrete screen/component" "Figma prompt"
Assert-Contains $figmaPrompt "implementation ambiguity" "Figma prompt"
Assert-Contains $figmaPrompt "broad visual polish" "Figma prompt"
Assert-Contains $figmaPrompt "Do not claim external scheduler changes" "Figma prompt"
Assert-NotContains $figmaPrompt "runs every 30 minutes" "Figma prompt"
Assert-NoForbiddenScheduledCommandLines $figmaPrompt "Figma prompt"

Assert-Contains $dailyPrompt $dailyId "Daily oversight prompt"
Assert-Contains $dailyPrompt "Senior Capstone Daily MVP Summary" "Daily oversight prompt"
Assert-Contains $dailyPrompt "Daily at 8:00 AM" "Daily oversight prompt"
Assert-Contains $dailyPrompt "accepted MVP pass" "Daily oversight prompt"
Assert-Contains $dailyPrompt "scheduled starts are not accepted passes" "Daily oversight prompt"
Assert-Contains $dailyPrompt "docs/progress/runs/" "Daily oversight prompt"
Assert-Contains $dailyPrompt "docs/progress/run-log.md" "Daily oversight prompt"
Assert-Contains $dailyPrompt "docs/mvp-requirements-catalog.md" "Daily oversight prompt"
Assert-Contains $dailyPrompt "Cloudflare" "Daily oversight prompt"
Assert-Contains $dailyPrompt "login" "Daily oversight prompt"
Assert-Contains $dailyPrompt "upload" "Daily oversight prompt"
Assert-Contains $dailyPrompt "report-only churn" "Daily oversight prompt"
Assert-Contains $dailyPrompt "human decisions" "Daily oversight prompt"
Assert-Contains $dailyPrompt "do not touch hourly automations" "Daily oversight prompt"
Assert-Contains $dailyPrompt "preserve GUI visibility" "Daily oversight prompt"
Assert-Contains $dailyPrompt "Do not run hourly builders." "Daily oversight prompt"
Assert-Contains $dailyPrompt "No builder prompt edits." "Daily oversight prompt"
Assert-Contains $dailyPrompt "No revival of legacy hourly QoL orchestrator." "Daily oversight prompt"
Assert-NoForbiddenScheduledCommandLines $dailyPrompt "Daily oversight prompt"
Assert-NoHourlyBuilderPromptMutationInstructions $dailyPrompt "Daily oversight prompt"
Assert-NoReplacementAutomationInstructions $dailyPrompt "Daily oversight prompt"

Assert-Contains $weeklyPrompt $weeklyId "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "Senior Capstone Weekly Strategy Review" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "Sundays at 6:00 PM" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "seven days" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "14 accepted MVP passes" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "weekly stretch" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "docs/automation-memory.md" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "docs/automation-backlog.md" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "docs/master-plan.md" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "docs/mvp-requirements-catalog.md" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "handoffs" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "requirement coverage" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "no schedule changes unless Bryan asks" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "do not touch hourly automations" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "preserve GUI visibility" "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "Do not run hourly builders." "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "No builder prompt edits." "Weekly oversight prompt"
Assert-Contains $weeklyPrompt "No revival of old hourly QoL orchestrator." "Weekly oversight prompt"
Assert-NoForbiddenScheduledCommandLines $weeklyPrompt "Weekly oversight prompt"
Assert-NoHourlyBuilderPromptMutationInstructions $weeklyPrompt "Weekly oversight prompt"
Assert-NoReplacementAutomationInstructions $weeklyPrompt "Weekly oversight prompt"

$runbook = Read-Text "docs\automation-runbook.md"
Assert-Contains $runbook "## Split Builder Cadence" "Automation runbook"
Assert-Contains $runbook $nonFigmaId "Automation runbook"
Assert-Contains $runbook $figmaId "Automation runbook"
Assert-Contains $runbook "Figma prompt blocks backend implementation" "Automation runbook"
Assert-Contains $runbook "non-Figma prompt blocks direct Figma work" "Automation runbook"
Assert-Contains $runbook "Registry drift prevention" "Automation runbook"
Assert-Contains $runbook "Scheduled start does not equal accepted pass" "Automation runbook"
Assert-Contains $runbook "Old single-builder cadence is retired" "Automation runbook"
Assert-Contains $runbook "Figma connector blocked" "Automation runbook"
Assert-Contains $runbook "npm missing from PATH" "Automation runbook"

$memory = Read-Text "docs\automation-memory.md"
Assert-Contains $memory "2026-05-20 - Split Builder Cadence" "Automation memory"
Assert-Contains $memory "2026-05-20 - Owner-Approved Duplicated Builder Cadence" "Automation memory"
Assert-Contains $memory $nonFigmaBottomId "Automation memory"
Assert-Contains $memory $figmaTopId "Automation memory"
Assert-Contains $memory "96 starts/day" "Automation memory"
Assert-Contains $memory $figmaFileKey "Automation memory"
Assert-Contains $memory "External scheduler may still require manual configuration" "Automation memory"

$catalog = Read-Text "docs\mvp-requirements-catalog.md"
Assert-Contains $catalog "Figma-only builder lane also has minute 0 and minute 30" "MVP requirements catalog"
Assert-Contains $catalog "non-Figma builder may consume existing Figma evidence" "MVP requirements catalog"
Assert-Contains $catalog "Figma is not production data" "MVP requirements catalog"

$guiDoc = Read-Text "automation\qol\GUI_ALLOWED_COMMANDS.md"
Assert-Contains $guiDoc "legacy diagnostic runner contract" "GUI allowed command doc"
Assert-Contains $guiDoc "not the active split builder contract" "GUI allowed command doc"
Assert-Contains $guiDoc "automation/prompts/senior-capstone-nonfigma-mvp-builder.md" "GUI allowed command doc"
Assert-Contains $guiDoc "automation/prompts/senior-capstone-figma-product-builder.md" "GUI allowed command doc"
Assert-Contains $guiDoc "Do not call node.exe directly." "GUI allowed command doc"
Assert-Contains $guiDoc "Do not attempt fallback scripts" "GUI allowed command doc"
Assert-NoForbiddenScheduledCommandLines $guiDoc "GUI allowed command doc"

$packageText = Read-Text "package.json"
if ($packageText) {
    try {
        $packageJson = $packageText | ConvertFrom-Json
        Assert-PackageQolScriptsUseWrappers $packageJson
    }
    catch {
        $failures.Add("package.json is not valid JSON: $($_.Exception.Message)")
    }
}

$artifactsText = Read-Text "docs\artifacts.json"
if ($artifactsText) {
    try {
        $artifacts = $artifactsText | ConvertFrom-Json
        $splitArtifact = @($artifacts.artifacts | Where-Object { $_.id -eq "senior-capstone-split-builder-cadence" })
        if ($splitArtifact.Count -ne 1) {
            $failures.Add("docs/artifacts.json must contain exactly one senior-capstone-split-builder-cadence artifact")
        }
        elseif (
            $splitArtifact[0].capacity.non_figma_starts_per_day -ne 48 -or
            $splitArtifact[0].capacity.figma_starts_per_day -ne 48 -or
            $splitArtifact[0].capacity.combined_starts_per_day -ne 96 -or
            $splitArtifact[0].capacity.non_figma_starts_per_30_days -ne 1440 -or
            $splitArtifact[0].capacity.figma_starts_per_30_days -ne 1440 -or
            $splitArtifact[0].capacity.combined_starts_per_30_days -ne 2880
        ) {
            $failures.Add("docs/artifacts.json split builder artifact must record 48/day per lane and 2,880 combined starts per 30 days")
        }
    }
    catch {
        $failures.Add("docs/artifacts.json is not valid JSON: $($_.Exception.Message)")
    }
}

$registryEvidenceText = Read-Text "automation\qol\state\automation-registry-evidence.json"
if ($registryEvidenceText) {
    try {
        $registryEvidence = $registryEvidenceText | ConvertFrom-Json
        foreach ($builderId in $expectedBuilderInstanceIds) {
            Assert-ArrayContains $registryEvidence.expectedBuilderIds $builderId "registry evidence expectedBuilderIds"
            Assert-ArrayContains $registryEvidence.activeBuilderIds $builderId "registry evidence activeBuilderIds"
            Assert-ArrayContains $registryEvidence.activeSeniorCapstoneIds $builderId "registry evidence activeSeniorCapstoneIds"
        }
        Assert-ArrayContains $registryEvidence.activeSeniorCapstoneIds $dailyId "registry evidence activeSeniorCapstoneIds"
        Assert-ArrayContains $registryEvidence.activeSeniorCapstoneIds $weeklyId "registry evidence activeSeniorCapstoneIds"
        if (@($registryEvidence.activeBuilderIds).Count -ne 4) {
            $failures.Add("registry evidence must show exactly four active builder IDs")
        }
        if (@($registryEvidence.missingBuilderIds).Count -ne 0) {
            $failures.Add("registry evidence must not show missing builder IDs")
        }
        if (@($registryEvidence.unexpectedActiveIds).Count -ne 0) {
            $failures.Add("registry evidence must not show unexpected active IDs")
        }
        if (@($registryEvidence.legacyActiveIds).Count -ne 0) {
            $failures.Add("registry evidence must not show active legacy diagnostic IDs")
        }
        if (@($registryEvidence.duplicateActiveIds).Count -ne 0) {
            $failures.Add("registry evidence must not show duplicate active IDs")
        }
        if ($registryEvidence.verdict -ne "PASS") {
            $failures.Add("registry evidence verdict must be PASS")
        }
    }
    catch {
        $failures.Add("automation-registry-evidence is not valid JSON: $($_.Exception.Message)")
    }
}

if ($failures.Count -gt 0) {
    Write-Output "Split cadence verification failed."
    Write-Output "Checked files: $($checkedFiles.Count)"
    foreach ($failure in $failures) {
        Write-Output "- $failure"
    }
    exit 1
}

Write-Output "Split cadence verification passed."
Write-Output "Checked files: $($checkedFiles.Count)"
Write-Output "Active builder automations:"
Write-Output "- $nonFigmaTopId at minute 0 PT"
Write-Output "- $nonFigmaBottomId at minute 30 PT"
Write-Output "- $figmaTopId at minute 0 PT"
Write-Output "- $figmaBottomId at minute 30 PT"
Write-Output "Oversight automations:"
Write-Output "- $dailyId"
Write-Output "- $weeklyId"
Write-Output "Legacy diagnostic/manual ID:"
Write-Output "- $legacyId"
