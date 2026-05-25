<#
.SYNOPSIS
  Central automation guardrail wrapper (repo-local).

.DESCRIPTION
  Enforces the required standard flow for reusable automations:
    A) Preflight (repo root, git upstream, sheet config)
    B) Run automation (plus any required doctors)
    C) Commit (always; allow-empty if needed)
    D) Push (no force-push)
    E) Google Sheet append (with retries; durable outbox on failure)
#>

[CmdletBinding(PositionalBinding = $false)]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$AutomationName,

  [string]$RepoRoot = "",

  [switch]$DryRun,

  [switch]$AllowDirtyStart,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$AutomationArgs
)

$ErrorActionPreference = "Stop"

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

$script:PowerShellExe = Get-CurrentPowerShellExe

function Write-Utf8NoBomFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)][string[]]$Args,
    [string]$WorkingDirectory = $script:ResolvedRepoRoot
  )

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & git @Args 2>&1
    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = [string]($output -join "`n")
  }
}

function Require-NonEmpty {
  param(
    [AllowNull()][AllowEmptyString()][string]$Value,
    [Parameter(Mandatory = $true)][string]$Message
  )

  if (-not $Value -or -not $Value.Trim()) {
    throw $Message
  }

  return $Value
}

function Get-EnvFirst {
  param([Parameter(Mandatory = $true)][string[]]$Names)

  foreach ($name in $Names) {
    $value = [string][System.Environment]::GetEnvironmentVariable($name)
    if ($value -and $value.Trim()) {
      return $value
    }
  }
  return ""
}

function New-RunId {
  $stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
  $suffix = ([guid]::NewGuid().ToString("N")).Substring(0, 8)
  return "$stamp-$suffix"
}

function Invoke-RepoPowerShell {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$ScriptRelativePath,
    [string[]]$Args = @(),
    [Parameter(Mandatory = $true)][string]$RunId
  )

  $logDir = Join-Path (Join-Path $script:ResolvedRepoRoot ".automation-log-outbox") "logs"
  if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  }

  $stdoutPath = Join-Path $logDir "$RunId.$Label.stdout.log"
  $stderrPath = Join-Path $logDir "$RunId.$Label.stderr.log"
  $scriptPath = Join-Path $script:ResolvedRepoRoot $ScriptRelativePath
  if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Missing repo script: $ScriptRelativePath"
  }

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  & $script:PowerShellExe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $scriptPath @Args 1> $stdoutPath 2> $stderrPath
  $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
  $stopwatch.Stop()

  return [pscustomobject]@{
    Label = $Label
    ExitCode = $exitCode
    DurationSeconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
    StdoutPath = $stdoutPath
    StderrPath = $stderrPath
  }
}

function Invoke-LoggedNode {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$NodeScriptRelativePath,
    [string[]]$Args = @(),
    [Parameter(Mandatory = $true)][string]$RunId
  )

  $nodeWrapper = "scripts/run-node-script.ps1"
  $nodeArgs = @($NodeScriptRelativePath) + @($Args)
  return Invoke-RepoPowerShell -Label $Label -ScriptRelativePath $nodeWrapper -Args $nodeArgs -RunId $RunId
}

# Resolve repo root (must be this repo).
$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
  $RepoRoot = Join-Path $scriptRoot ".."
}
$script:ResolvedRepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

Push-Location $script:ResolvedRepoRoot
try {
  # Verify repo root.
  $topLevel = Invoke-Git -Args @("rev-parse", "--show-toplevel")
  if ($topLevel.ExitCode -ne 0) {
    throw "Not a git repo (git rev-parse failed): $($topLevel.Output)"
  }
  $normalizedTop = (Resolve-Path -LiteralPath $topLevel.Output.Trim()).Path
  if ($normalizedTop -ne $script:ResolvedRepoRoot) {
    throw "Automation must run from repo root. Expected: $script:ResolvedRepoRoot; got: $normalizedTop"
  }

  $runId = New-RunId
  $startedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
  $gitBranchResult = Invoke-Git -Args @("rev-parse", "--abbrev-ref", "HEAD")
  if ($gitBranchResult.ExitCode -ne 0) {
    throw "Unable to resolve current git branch: $($gitBranchResult.Output)"
  }
  $gitBranch = $gitBranchResult.Output.Trim()
  if ($gitBranch -eq "HEAD") {
    $fallbackBranch = Get-EnvFirst -Names @("GITHUB_HEAD_REF", "GITHUB_REF_NAME", "BRANCH_NAME")
    $gitBranch = if ($fallbackBranch) { $fallbackBranch } else { "detached" }
  }

  $startingShaResult = Invoke-Git -Args @("rev-parse", "HEAD")
  if ($startingShaResult.ExitCode -ne 0) {
    throw "Unable to resolve current git SHA: $($startingShaResult.Output)"
  }
  $startingSha = $startingShaResult.Output.Trim()

  $upstream = Invoke-Git -Args @("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
  if ($upstream.ExitCode -ne 0) {
    if ($DryRun) {
      $upstreamName = "dry-run: upstream not required"
    }
    else {
      throw "Current branch has no upstream remote. Set an upstream (e.g. git push -u) before running guarded automations."
    }
  }
  else {
    $upstreamName = $upstream.Output.Trim()
  }

  $statusBefore = Invoke-Git -Args @("status", "--porcelain=v1")
  $dirtyBefore = $statusBefore.Output.Trim()
  if (-not $AllowDirtyStart -and $dirtyBefore) {
    throw "Worktree is dirty before automation run. Commit/stash first, or pass -AllowDirtyStart (not recommended).`n$dirtyBefore"
  }

  # Verify sheet logging config before doing work.
  $spreadsheetId = Get-EnvFirst -Names @("AUTOMATION_SHEETS_SPREADSHEET_ID")
  $tabName = Get-EnvFirst -Names @("AUTOMATION_SHEETS_TAB_NAME")
  $clientEmail = Get-EnvFirst -Names @("GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_DRIVE_CLIENT_EMAIL")
  $privateKey = Get-EnvFirst -Names @("GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_DRIVE_PRIVATE_KEY")
  Require-NonEmpty -Value $spreadsheetId -Message "Missing env var: AUTOMATION_SHEETS_SPREADSHEET_ID"
  Require-NonEmpty -Value $tabName -Message "Missing env var: AUTOMATION_SHEETS_TAB_NAME"
  Require-NonEmpty -Value $clientEmail -Message "Missing env var: GOOGLE_SHEETS_CLIENT_EMAIL (or GOOGLE_DRIVE_CLIENT_EMAIL fallback)"
  Require-NonEmpty -Value $privateKey -Message "Missing env var: GOOGLE_SHEETS_PRIVATE_KEY (or GOOGLE_DRIVE_PRIVATE_KEY fallback)"

  if ($DryRun) {
    Write-Output "DRY RUN: would run '$AutomationName' from repo root, then commit, push, and append to Google Sheets."
    return
  }

  $actor = Get-EnvFirst -Names @("AUTOMATION_ACTOR", "GITHUB_ACTOR", "USERNAME", "USER")
  $hostName = Get-EnvFirst -Names @("COMPUTERNAME", "HOSTNAME")

  $auditPath = Join-Path $script:ResolvedRepoRoot "automation\\audit\\runs\\$runId.json"
  $audit = [ordered]@{
    schema_version = 1
    run_id = $runId
    timestamp_utc = $startedAtUtc
    repo_root = $script:ResolvedRepoRoot
    repo_name = (Split-Path -Leaf $script:ResolvedRepoRoot)
    automation_name = $AutomationName
    command = [ordered]@{
      adapter = "scripts/run-automation.ps1"
      invocation = "scripts/run-npm-script.ps1"
      script = $AutomationName
      args = @($AutomationArgs)
    }
    git = [ordered]@{
      branch = $gitBranch
      upstream = $upstreamName
      starting_sha = $startingSha
      status_before = @($statusBefore.Output.Split("`n") | Where-Object { $_ -ne "" })
    }
    host = [ordered]@{
      actor = $actor
      host = $hostName
    }
    execution = [ordered]@{
      steps = @()
      exit_code = $null
      duration_seconds = $null
      outcome = "unknown"
    }
  }

  # Run automation through the repo-local npm-script adapter.
  $steps = New-Object System.Collections.Generic.List[object]
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

  $steps.Add((Invoke-RepoPowerShell -Label "run" -ScriptRelativePath "scripts\\run-npm-script.ps1" -Args (@($AutomationName) + @($AutomationArgs)) -RunId $runId))

  $stopwatch.Stop()

  $automationExitCode = 0
  foreach ($step in $steps) {
    if ($step.ExitCode -ne 0) {
      $automationExitCode = $step.ExitCode
    }
  }

  $audit.execution.steps = @($steps)
  $audit.execution.exit_code = $automationExitCode
  $audit.execution.duration_seconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
  $audit.execution.outcome = if ($automationExitCode -eq 0) { "success" } else { "failure" }

  Write-Utf8NoBomFile -Path $auditPath -Content ($audit | ConvertTo-Json -Depth 10)

  # Commit (always).
  $null = Invoke-Git -Args @("add", "-A")
  $hasStaged = (Invoke-Git -Args @("diff", "--cached", "--name-only")).Output.Trim()

  $commitMessage = @(
    "automation: $AutomationName run $runId",
    "",
    "automation_name: $AutomationName",
    "run_id: $runId",
    "outcome: $($audit.execution.outcome)",
    "exit_code: $automationExitCode",
    "duration_seconds: $($audit.execution.duration_seconds)",
    "starting_sha: $startingSha",
    "branch: $gitBranch",
    "sheet_log: pending",
    ""
  ) -join "`n"

  if ($hasStaged) {
    $commitResult = Invoke-Git -Args @("commit", "-m", $commitMessage)
    if ($commitResult.ExitCode -ne 0) {
      throw "git commit failed: $($commitResult.Output)"
    }
  }
  else {
    $commitResult = Invoke-Git -Args @("commit", "--allow-empty", "-m", $commitMessage)
    if ($commitResult.ExitCode -ne 0) {
      throw "git commit (allow-empty) failed: $($commitResult.Output)"
    }
  }

  $commitSha = (Invoke-Git -Args @("rev-parse", "HEAD")).Output.Trim()

  # Push.
  $pushResult = Invoke-Git -Args @("push")
  if ($pushResult.ExitCode -ne 0) {
    throw "git push failed: $($pushResult.Output)"
  }

  # Google Sheet log (with retries + durable outbox).
  $outboxDir = Join-Path $script:ResolvedRepoRoot ".automation-log-outbox"
  New-Item -ItemType Directory -Force -Path $outboxDir | Out-Null
  $outboxPath = Join-Path $outboxDir "$runId.json"

  $commandSummary = ("powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-automation.ps1 $AutomationName " + ($AutomationArgs -join " ")).Trim()
  $rowValues = @(
    $startedAtUtc,
    $runId,
    (Split-Path -Leaf $script:ResolvedRepoRoot),
    $AutomationName,
    $commandSummary,
    $gitBranch,
    $startingSha,
    $commitSha,
    "pushed",
    $audit.execution.outcome,
    [string]$automationExitCode,
    [string]$audit.execution.duration_seconds,
    $actor,
    $hostName,
    "",
    ""
  )

  $outboxPayload = [ordered]@{
    schema_version = 1
    created_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    run_id = $runId
    sheet = [ordered]@{
      spreadsheet_id = $spreadsheetId
      tab_name = $tabName
    }
    row = [ordered]@{
      values = $rowValues
    }
    meta = [ordered]@{
      automation_name = $AutomationName
      branch = $gitBranch
      starting_sha = $startingSha
      commit_sha = $commitSha
    }
    attempts = 0
    last_error = $null
  }

  Write-Utf8NoBomFile -Path $outboxPath -Content ($outboxPayload | ConvertTo-Json -Depth 10)

  $sheetLogSucceeded = $false
  foreach ($delaySeconds in @(1, 2, 4)) {
    $outboxPayload.attempts = [int]$outboxPayload.attempts + 1
    Write-Utf8NoBomFile -Path $outboxPath -Content ($outboxPayload | ConvertTo-Json -Depth 10)

    $sheetStep = Invoke-LoggedNode -Label "sheet" -NodeScriptRelativePath "scripts\\log_automation_to_sheet.mjs" -Args @("--payload", $outboxPath) -RunId $runId
    if ($sheetStep.ExitCode -eq 0) {
      $sheetLogSucceeded = $true
      break
    }

    $outboxPayload.last_error = "Sheet log failed (exit $($sheetStep.ExitCode)). stderr: $($sheetStep.StderrPath)"
    Write-Utf8NoBomFile -Path $outboxPath -Content ($outboxPayload | ConvertTo-Json -Depth 10)
    Start-Sleep -Seconds $delaySeconds
  }

  if (-not $sheetLogSucceeded) {
    throw "Google Sheet logging failed; pending outbox record written: $outboxPath"
  }

  Remove-Item -LiteralPath $outboxPath -Force -ErrorAction SilentlyContinue

  if ($automationExitCode -ne 0) {
    throw "Automation command failed with exit code $automationExitCode (commit pushed; sheet logged)."
  }

  Write-Output "Automation run complete: $AutomationName ($runId) commit=$commitSha sheet=logged"
}
finally {
  Pop-Location
}
