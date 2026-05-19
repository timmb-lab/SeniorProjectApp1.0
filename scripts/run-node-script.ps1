param(
    [string]$RepoRoot = "",
    [string]$NodePath = "",
    [Parameter(Mandatory = $true, Position = 0)][string]$ScriptPath,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"
$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
    $RepoRoot = Join-Path $scriptRoot ".."
}
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

. (Join-Path $scriptRoot "resolve-node.ps1")
$nodeExe = Resolve-CodexNode -PreferredPath $NodePath

$scriptPathCandidates = @(
    (Join-Path (Get-Location).Path $ScriptPath),
    (Join-Path $RepoRoot $ScriptPath)
)
$resolvedScriptPath = $scriptPathCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $resolvedScriptPath) {
    throw "Node script not found: $ScriptPath"
}
$resolvedScriptPath = (Resolve-Path -LiteralPath $resolvedScriptPath).Path

Push-Location $RepoRoot
try {
    & $nodeExe $resolvedScriptPath @ScriptArgs
    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
    if ($exitCode -ne 0) {
        exit $exitCode
    }
}
finally {
    Pop-Location
}
