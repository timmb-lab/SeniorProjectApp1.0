<#
.SYNOPSIS
  Retries pending Google Sheet log appends from .automation-log-outbox/.

.DESCRIPTION
  This command replays stored payloads created when the guarded automation wrapper
  failed during the Google Sheets append step.
  It does not create commits by itself; run via scripts/run-automation.ps1 if you
  want strict commit/push/log closeout for the sync action.
#>

[CmdletBinding(PositionalBinding = $false)]
param(
  [string]$RepoRoot = "",
  [string]$OutboxDir = ".automation-log-outbox",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
  $RepoRoot = Join-Path $scriptRoot ".."
}
$resolvedRepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

function Get-CurrentPowerShellExe {
  try {
    $path = (Get-Process -Id $PID).Path
    if ($path -and (Test-Path -LiteralPath $path)) {
      return $path
    }
  }
  catch {
  }

  foreach ($name in @("pwsh", "powershell")) {
    $cmd = Get-Command -Name $name -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) {
      return $cmd.Source
    }
  }

  throw "No PowerShell executable found (pwsh/powershell)."
}

$powerShellExe = Get-CurrentPowerShellExe

Push-Location $resolvedRepoRoot
try {
  $resolvedOutboxDir = if ([System.IO.Path]::IsPathRooted($OutboxDir)) {
    $OutboxDir
  }
  else {
    Join-Path $resolvedRepoRoot $OutboxDir
  }

  if (-not (Test-Path -LiteralPath $resolvedOutboxDir)) {
    Write-Output "No outbox directory present: $resolvedOutboxDir"
    return
  }

  $records = @(Get-ChildItem -LiteralPath $resolvedOutboxDir -Filter "*.json" -File -Force | Sort-Object Name)
  if ($records.Count -eq 0) {
    Write-Output "No pending outbox records found in $resolvedOutboxDir"
    return
  }

  $failures = 0
  foreach ($record in $records) {
    if ($DryRun) {
      Write-Output "DRY RUN: would append sheet log payload: $($record.FullName)"
      continue
    }

    & $powerShellExe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File (Join-Path $resolvedRepoRoot "scripts/run-node-script.ps1") `
      "scripts/log_automation_to_sheet.mjs" "--payload" $record.FullName

    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
    if ($exitCode -eq 0) {
      Remove-Item -LiteralPath $record.FullName -Force
      Write-Output "Logged: $($record.Name)"
    }
    else {
      $failures += 1
      Write-Warning "Failed to log payload $($record.Name) (exit $exitCode). Leaving in outbox."
    }
  }

  if ($failures -gt 0) {
    exit 1
  }
}
finally {
  Pop-Location
}
