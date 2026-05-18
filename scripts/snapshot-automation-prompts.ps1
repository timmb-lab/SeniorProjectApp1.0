param(
    [string]$AutomationRoot = "$HOME\.codex\automations",
    [string]$OutputDir = "docs\automation-prompts",
    [string]$RepoRoot = (Join-Path $PSScriptRoot ".."),
    [string]$ConfigPath = (Join-Path $PSScriptRoot "automation-config.json")
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
if (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
    $OutputDir = Join-Path $RepoRoot $OutputDir
}

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

function Test-PathWithinDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Directory
    )

    $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
    $fullDirectory = [System.IO.Path]::GetFullPath($Directory).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )

    return $fullPath.Equals($fullDirectory, [System.StringComparison]::OrdinalIgnoreCase) -or
        $fullPath.StartsWith($fullDirectory + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
}

$config = Read-AutomationConfig -Path $ConfigPath
$trackedAutomations = @(
    @($config.automations | Where-Object { $null -ne $_ }) +
    @($config.supportAutomations | Where-Object { $null -ne $_ })
)
$automationIds = @($trackedAutomations | ForEach-Object { $_.id })

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

$outputParent = Split-Path -Parent $OutputDir
if (-not $outputParent) {
    $outputParent = $RepoRoot
}
New-Item -ItemType Directory -Force -Path $outputParent | Out-Null
$tempDir = Join-Path $outputParent (".automation-prompts.tmp." + [guid]::NewGuid().ToString("N"))

try {
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

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
        $snapshotPath = Join-Path $tempDir "$id.md"

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

    Set-Content -LiteralPath (Join-Path $tempDir "README.md") -Value ($indexRows -join [Environment]::NewLine) -Encoding UTF8

    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    $resolvedOutputDir = (Resolve-Path -LiteralPath $OutputDir).Path
    $resolvedTempDir = (Resolve-Path -LiteralPath $tempDir).Path
    $resolvedOutputParent = (Resolve-Path -LiteralPath $outputParent).Path

    if (-not (Test-PathWithinDirectory -Path $resolvedTempDir -Directory $resolvedOutputParent)) {
        throw "Refusing to replace snapshots from temp dir outside output parent: $resolvedTempDir"
    }

    Get-ChildItem -LiteralPath $resolvedOutputDir -Filter "senior-capstone*.md" -File | Remove-Item -Force
    Get-ChildItem -LiteralPath $resolvedTempDir -File | ForEach-Object {
        Move-Item -LiteralPath $_.FullName -Destination (Join-Path $resolvedOutputDir $_.Name) -Force
    }
}
finally {
    if (Test-Path -LiteralPath $tempDir) {
        $resolvedTempDir = (Resolve-Path -LiteralPath $tempDir).Path
        $resolvedOutputParent = (Resolve-Path -LiteralPath $outputParent).Path
        if (Test-PathWithinDirectory -Path $resolvedTempDir -Directory $resolvedOutputParent) {
            Remove-Item -LiteralPath $resolvedTempDir -Recurse -Force
        }
    }
}

Write-Output "Snapshot complete: $($automationIds.Count) automation prompts written to $OutputDir"
