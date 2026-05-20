param(
    [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$failures = New-Object System.Collections.Generic.List[string]
$checkedFiles = New-Object System.Collections.Generic.List[string]

$nonFigmaId = "senior-capstone-nonfigma-mvp-builder"
$figmaId = "senior-capstone-figma-product-builder"
$dailyId = "senior-capstone-daily-mvp-summary"
$weeklyId = "senior-capstone-weekly-script-audit"
$legacyId = "senior-capstone-hourly-qol-orchestrator"
$figmaFileKey = "z4t4tFPAKrMDh6pIYOeEw6"
$figmaPlanKey = "team::1638213362346160913"

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

$cadenceDoc = Read-Text "docs\automation-cadence.md"
Assert-Contains $cadenceDoc $nonFigmaId "Automation cadence doc"
Assert-Contains $cadenceDoc $figmaId "Automation cadence doc"
Assert-Contains $cadenceDoc $dailyId "Automation cadence doc"
Assert-Contains $cadenceDoc $weeklyId "Automation cadence doc"
Assert-Match $cadenceDoc "minute 0|Hourly at minute 0|top-of-hour" "Automation cadence doc"
Assert-Match $cadenceDoc "minute 30|Hourly at minute 30|bottom-of-hour" "Automation cadence doc"
Assert-Contains $cadenceDoc "24 non-Figma starts/day" "Automation cadence doc"
Assert-Contains $cadenceDoc "24 Figma starts/day" "Automation cadence doc"
Assert-Contains $cadenceDoc "48 combined starts/day" "Automation cadence doc"
Assert-Contains $cadenceDoc "720 non-Figma starts/30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "720 Figma starts/30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "1,440 combined starts/30 days" "Automation cadence doc"
Assert-Contains $cadenceDoc "Daily summary and weekly review are oversight, not builder capacity" "Automation cadence doc"
Assert-NoForbiddenScheduledCommandLines $cadenceDoc "Automation cadence doc"

$projectLockText = Read-Text "automation\qol\project-lock.json"
if ($projectLockText) {
    try {
        $projectLock = $projectLockText | ConvertFrom-Json
        Assert-ArrayContains $projectLock.allowedActiveAutomationIds $nonFigmaId "project-lock allowedActiveAutomationIds"
        Assert-ArrayContains $projectLock.allowedActiveAutomationIds $figmaId "project-lock allowedActiveAutomationIds"
        Assert-ArrayContains $projectLock.allowedActiveAutomationIds $dailyId "project-lock allowedActiveAutomationIds"
        Assert-ArrayContains $projectLock.allowedActiveAutomationIds $weeklyId "project-lock allowedActiveAutomationIds"
        Assert-ArrayContains $projectLock.expectedBuilderAutomationIds $nonFigmaId "project-lock expectedBuilderAutomationIds"
        Assert-ArrayContains $projectLock.expectedBuilderAutomationIds $figmaId "project-lock expectedBuilderAutomationIds"
        Assert-ArrayContains $projectLock.legacyDiagnosticAutomationIds $legacyId "project-lock legacyDiagnosticAutomationIds"

        if ($projectLock.expectedAutomationCadenceDescription -ne "split hourly builders: non-Figma at minute 0 PT and Figma-only at minute 30 PT") {
            $failures.Add("project-lock expectedAutomationCadenceDescription does not describe the split hourly builders")
        }
        if ($projectLock.expectedBuilderCadences.nonFigma.id -ne $nonFigmaId) {
            $failures.Add("project-lock expectedBuilderCadences.nonFigma.id is incorrect")
        }
        if ($projectLock.expectedBuilderCadences.nonFigma.rrule -ne "FREQ=HOURLY;BYMINUTE=0;BYSECOND=0") {
            $failures.Add("project-lock non-Figma RRULE is incorrect")
        }
        if ($projectLock.expectedBuilderCadences.figma.id -ne $figmaId) {
            $failures.Add("project-lock expectedBuilderCadences.figma.id is incorrect")
        }
        if ($projectLock.expectedBuilderCadences.figma.rrule -ne "FREQ=HOURLY;BYMINUTE=30;BYSECOND=0") {
            $failures.Add("project-lock Figma RRULE is incorrect")
        }
    }
    catch {
        $failures.Add("project-lock is not valid JSON: $($_.Exception.Message)")
    }
}

$nonFigmaPromptPath = "automation\prompts\senior-capstone-nonfigma-mvp-builder.md"
$figmaPromptPath = "automation\prompts\senior-capstone-figma-product-builder.md"
$nonFigmaPrompt = Read-Text $nonFigmaPromptPath
$figmaPrompt = Read-Text $figmaPromptPath

Assert-Contains $nonFigmaPrompt $nonFigmaId "Non-Figma prompt"
Assert-Contains $nonFigmaPrompt "minute 0" "Non-Figma prompt"
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
Assert-NoForbiddenScheduledCommandLines $nonFigmaPrompt "Non-Figma prompt"

Assert-Contains $figmaPrompt $figmaId "Figma prompt"
Assert-Contains $figmaPrompt "minute 30" "Figma prompt"
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
Assert-NoForbiddenScheduledCommandLines $figmaPrompt "Figma prompt"

$runbook = Read-Text "docs\automation-runbook.md"
Assert-Contains $runbook "## Split Builder Cadence" "Automation runbook"
Assert-Contains $runbook $nonFigmaId "Automation runbook"
Assert-Contains $runbook $figmaId "Automation runbook"
Assert-Contains $runbook "Figma prompt blocks backend implementation" "Automation runbook"
Assert-Contains $runbook "non-Figma prompt blocks direct Figma work" "Automation runbook"
Assert-Contains $runbook "Registry drift prevention" "Automation runbook"
Assert-Contains $runbook "Scheduled start does not equal accepted pass" "Automation runbook"

$memory = Read-Text "docs\automation-memory.md"
Assert-Contains $memory "2026-05-20 - Split Builder Cadence" "Automation memory"
Assert-Contains $memory "Non-Figma builder runs at minute 0 PT" "Automation memory"
Assert-Contains $memory "Figma-only builder runs at minute 30 PT" "Automation memory"
Assert-Contains $memory "Combined capacity remains 48 starts/day" "Automation memory"

$catalog = Read-Text "docs\mvp-requirements-catalog.md"
Assert-Contains $catalog 'bottom-of-hour Figma-only builder owns `MVP-028`' "MVP requirements catalog"
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
    }
    catch {
        $failures.Add("docs/artifacts.json is not valid JSON: $($_.Exception.Message)")
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
Write-Output "- $nonFigmaId at minute 0 PT"
Write-Output "- $figmaId at minute 30 PT"
Write-Output "Oversight automations:"
Write-Output "- $dailyId"
Write-Output "- $weeklyId"
Write-Output "Legacy diagnostic/manual ID:"
Write-Output "- $legacyId"
