param(
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$OutputDir = "docs\automation-prompts"
)

$ErrorActionPreference = "Stop"

$automationIds = @(
    "senior-capstone-figma-product-design-rebuilt",
    "senior-capstone-rebuild-rebuilt",
    "senior-capstone-content-quality-audits-rebuilt",
    "senior-capstone-canva-visual-system-rebuilt",
    "senior-capstone-daily-automation-report-rebuilt",
    "senior-capstone-weekly-deep-audit-rebuilt"
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

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$indexRows = New-Object System.Collections.Generic.List[string]
$indexRows.Add("# Automation Prompt Snapshots")
$indexRows.Add("")
$indexRows.Add("Generated: $generatedAt")
$indexRows.Add("")
$indexRows.Add("These files are repo snapshots of the live Codex automation prompts. Regenerate them after any prompt/config update with:")
$indexRows.Add("")
$indexRows.Add("~~~powershell")
$indexRows.Add("powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\snapshot-automation-prompts.ps1")
$indexRows.Add("~~~")
$indexRows.Add("")
$indexRows.Add("| Automation | Prompt SHA-256 | Snapshot |")
$indexRows.Add("| --- | --- | --- |")

foreach ($id in $automationIds) {
    $tomlPath = Join-Path $AutomationRoot "$id\automation.toml"
    if (-not (Test-Path -LiteralPath $tomlPath)) {
        throw "Missing automation TOML for $id at $tomlPath"
    }

    $raw = Get-Content -Raw -LiteralPath $tomlPath
    $name = Get-TomlStringValue -Content $raw -Key "name"
    $prompt = Get-TomlStringValue -Content $raw -Key "prompt"
    $rrule = Get-TomlStringValue -Content $raw -Key "rrule"
    $model = Get-TomlStringValue -Content $raw -Key "model"
    $reasoning = Get-TomlStringValue -Content $raw -Key "reasoning_effort"
    $hash = Get-StringSha256 -Value $prompt
    $snapshotPath = Join-Path $OutputDir "$id.md"

    $body = @"
---
automation_id: "$id"
name: "$name"
snapshot_generated_utc: "$generatedAt"
rrule: "$rrule"
model: "$model"
reasoning_effort: "$reasoning"
prompt_sha256: "$hash"
source_toml: "$tomlPath"
---

# $name

## Prompt

~~~~text
$prompt
~~~~
"@

    Set-Content -LiteralPath $snapshotPath -Value $body -Encoding UTF8
    $indexRows.Add("| $id | $hash | [$id.md](./$id.md) |")
}

Set-Content -LiteralPath (Join-Path $OutputDir "README.md") -Value ($indexRows -join [Environment]::NewLine) -Encoding UTF8
Write-Output "Snapshot complete: $($automationIds.Count) automation prompts written to $OutputDir"
