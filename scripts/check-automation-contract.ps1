param(
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$failures = New-Object System.Collections.Generic.List[string]

$automationIds = @(
    "senior-capstone-figma-product-design",
    "senior-capstone-rebuild-hourly",
    "senior-capstone-content-quality-audits",
    "senior-capstone-canva-visual-system",
    "senior-capstone-daily-automation-report",
    "senior-capstone-weekly-deep-audit"
)

$requiredPromptFragments = @(
    "docs/master-plan.md",
    "docs/automation-runbook.md",
    "docs/automation-self-improvement.md",
    "docs/automation-memory.md",
    "docs/progress/run-log.md",
    "docs/progress/handoffs.md",
    "docs/progress/decision-log.md",
    "docs/automation-backlog.md",
    "git status --short",
    "push the current branch",
    "automation_update",
    "LLucMgAPscRa9020iHHigB"
)

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

function Assert-File {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        $failures.Add("Missing required file: $Path")
    }
}

foreach ($id in $automationIds) {
    $tomlPath = Join-Path $AutomationRoot "$id\automation.toml"
    if (-not (Test-Path -LiteralPath $tomlPath)) {
        $failures.Add("Missing live automation TOML: $tomlPath")
        continue
    }

    $raw = Get-Content -Raw -LiteralPath $tomlPath
    $prompt = Get-TomlStringValue -Content $raw -Key "prompt"
    $promptHash = Get-StringSha256 -Value $prompt

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

$requiredFiles = @(
    "docs\automation-prompts\README.md",
    "docs\progress\runs\README.md",
    "docs\human-decisions.md",
    "docs\artifacts.json",
    "docs\architecture\adr-0001-stack-auth-database-upload.md",
    "scripts\snapshot-automation-prompts.ps1",
    "scripts\check-automation-contract.ps1"
)

foreach ($relative in $requiredFiles) {
    Assert-File -Path (Join-Path $RepoRoot $relative)
}

$jsonFiles = @(
    "docs\artifacts.json",
    "docs\progress\runs\2026-05-18-ops-self-improvement-infrastructure.json"
)

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
    foreach ($fragment in @("docs/progress/runs/", "docs/artifacts.json", "docs/human-decisions.md", "scripts/check-automation-contract.ps1", "docs/automation-prompts/")) {
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
