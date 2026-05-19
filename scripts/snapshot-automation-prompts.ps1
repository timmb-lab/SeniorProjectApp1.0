<#
.SYNOPSIS
  Repo-local automation prompt snapshot indexer.

.DESCRIPTION
  This repo already carries committed prompt snapshots under `docs/automation-prompts/`.
  Under the project-only scope boundary, this script DOES NOT read live Codex automation
  TOML files from user home directories. Instead it:

  - enumerates automation IDs from `scripts/automation-config.json`
  - verifies a corresponding snapshot markdown exists in `docs/automation-prompts/<id>.md`
  - rebuilds `docs/automation-prompts/README.md` as an index
#>

param(
  [string]$OutputDir = "docs\\automation-prompts",
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

  $resolvedPath = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $RepoRoot $Path }
  if (-not (Test-Path -LiteralPath $resolvedPath)) {
    throw "Missing automation config: $resolvedPath"
  }

  return Get-Content -Raw -LiteralPath $resolvedPath | ConvertFrom-Json
}

function Get-PromptSha {
  param([Parameter(Mandatory = $true)][string]$Content)

  $match = [regex]::Match($Content, "(?m)^prompt_sha256:\\s*\"?([0-9a-f]{64})\"?\\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value
  }
  return ""
}

$config = Read-AutomationConfig -Path $ConfigPath
$trackedAutomations = @(
  @($config.automations | Where-Object { $null -ne $_ }) +
  @($config.supportAutomations | Where-Object { $null -ne $_ })
)
$automationIds = @($trackedAutomations | ForEach-Object { $_.id } | Where-Object { $_ } )
if ($automationIds.Count -eq 0) {
  throw "No automation IDs found in scripts/automation-config.json"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$indexRows = New-Object System.Collections.Generic.List[string]
$indexRows.Add("# Automation Prompt Snapshots")
$indexRows.Add("")
$indexRows.Add("Generated: $generatedAt")
$indexRows.Add("")
$indexRows.Add("These files are repo snapshots. Regenerate the index with:")
$indexRows.Add("")
$indexRows.Add("~~~powershell")
$indexRows.Add("powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\snapshot-automation-prompts.ps1")
$indexRows.Add("~~~")
$indexRows.Add("")
$indexRows.Add("| Automation ID | Prompt SHA-256 | Snapshot |")
$indexRows.Add("| --- | --- | --- |")

foreach ($id in $automationIds) {
  $snapshotPath = Join-Path $OutputDir "$id.md"
  if (-not (Test-Path -LiteralPath $snapshotPath)) {
    throw "Missing required prompt snapshot for $id at $snapshotPath"
  }

  $content = Get-Content -Raw -LiteralPath $snapshotPath
  $sha = Get-PromptSha -Content $content
  if (-not $sha) { $sha = "unknown" }
  $indexRows.Add("| $id | $sha | [$id.md](./$id.md) |")
}

Set-Content -LiteralPath (Join-Path $OutputDir "README.md") -Value ($indexRows -join [Environment]::NewLine) -Encoding UTF8

Write-Output "Snapshot index complete: $($automationIds.Count) automation prompts indexed in $OutputDir"

