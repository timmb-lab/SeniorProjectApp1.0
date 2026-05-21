param(
    [Parameter(Mandatory = $true, Position = 0)][string]$ScriptName,
    [string]$RepoRoot = "",
    [switch]$PreferNpm,
    [Parameter(ValueFromRemainingArguments = $true, Position = 1)][string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"
$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
    $RepoRoot = Join-Path $scriptRoot ".."
}
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

. (Join-Path $scriptRoot "resolve-node.ps1")
$nodeExe = Resolve-CodexNode

function Get-NpmCandidates {
    $candidates = New-Object System.Collections.Generic.List[string]

    foreach ($envPath in @($env:NPM_CMD, $env:NPM)) {
        if ($envPath) {
            $candidates.Add($envPath)
        }
    }

    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if ($base) {
            $candidates.Add((Join-Path $base "nodejs\npm.cmd"))
        }
    }

    if ($HOME) {
        $candidates.Add((Join-Path $HOME "AppData\Roaming\nvm\npm.cmd"))
        $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
        if (Test-Path -LiteralPath $runtimeRoot) {
            Get-ChildItem -LiteralPath $runtimeRoot -Filter "npm.cmd" -File -Recurse -ErrorAction SilentlyContinue |
                ForEach-Object { $candidates.Add($_.FullName) }
        }
    }

    try {
        $whereResults = @(where.exe npm.cmd 2>$null)
        foreach ($result in $whereResults) {
            if ($result) {
                $candidates.Add($result.Trim())
            }
        }
    }
    catch {
    }

    return @($candidates | Where-Object { $_ } | Select-Object -Unique)
}

function Invoke-Node {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)

    & $nodeExe @Args
    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
    if ($exitCode -ne 0) {
        exit $exitCode
    }
}

function Invoke-ProjectPowerShell {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [string[]]$Args = @()
    )

    $path = Join-Path $RepoRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        throw "PowerShell script not found: $path"
    }

    & powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $path @Args
    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
    if ($exitCode -ne 0) {
        exit $exitCode
    }
}

function Invoke-TypeScriptCheck {
    param(
        [string[]]$Args = @(),
        [switch]$Optional
    )

    $localTsc = Join-Path $RepoRoot "node_modules\typescript\bin\tsc"
    if (Test-Path -LiteralPath $localTsc) {
        Invoke-Node $localTsc "--noEmit" @Args
        return
    }

    $tscCandidates = New-Object System.Collections.Generic.List[string]
    foreach ($envPath in @($env:TSC_CMD, $env:TSC)) {
        if ($envPath) {
            $tscCandidates.Add($envPath)
        }
    }

    $localTscCmd = Join-Path $RepoRoot "node_modules\.bin\tsc.cmd"
    $tscCandidates.Add($localTscCmd)

    try {
        $whereResults = @(where.exe tsc.cmd 2>$null)
        foreach ($result in $whereResults) {
            if ($result) {
                $tscCandidates.Add($result.Trim())
            }
        }
    }
    catch {
    }

    foreach ($candidate in @($tscCandidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (Test-Path -LiteralPath $candidate) {
            & $candidate "--noEmit" @Args
            $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
            if ($exitCode -ne 0) {
                exit $exitCode
            }
            return
        }
    }

    $message = "TypeScript compiler not found. Run npm install, or set TSC_CMD to a working tsc.cmd path."
    if ($Optional) {
        Write-Warning "$message Skipping optional aggregate typecheck; run the typecheck script directly when strict TypeScript validation is required."
        return
    }

    [Console]::Error.WriteLine($message)
    exit 1
}

function Invoke-KnownProjectScript {
    param([switch]$AllowUnknown)

    $script:KnownProjectScriptHandled = $false
    switch ($ScriptName) {
        "check" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "--check" "alpha.js"
            Invoke-Node "scripts\check-alpha-contract.mjs"
            Invoke-ProjectPowerShell "scripts\verify-cadence-30min.ps1"
            Invoke-Node "scripts\check-predeploy-gate.mjs"
            Invoke-Node "scripts\check-production-surfaces.mjs"
            Invoke-Node "scripts\inventory-production-routes.mjs" "--check"
            Invoke-Node "scripts\check-generated-output-drift.mjs"
            Invoke-Node "scripts\check-site-options.mjs"
            Invoke-Node "scripts\check-cloudflare.mjs"
            Invoke-Node "scripts\check-custom-domain-cutover.mjs"
            Invoke-Node "scripts\check-alpha-account-gating.mjs"

            $testFiles = @(Get-ChildItem -LiteralPath (Join-Path $RepoRoot "tests") -Filter "*.test.mjs" -File | ForEach-Object { $_.FullName })
            if ($testFiles.Count -eq 0) {
                throw "No test files found in tests\*.test.mjs"
            }
            Invoke-Node "--test" @testFiles
            Invoke-TypeScriptCheck -Optional
            return
        }
        "check:automation" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\verify-cadence-30min.ps1" $ScriptArgs
            return
        }
        "check:predeploy-gate" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-predeploy-gate.mjs" @ScriptArgs
            return
        }
        "check:production-surfaces" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-production-surfaces.mjs" @ScriptArgs
            return
        }
        "check:route-inventory" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\inventory-production-routes.mjs" "--check" @ScriptArgs
            return
        }
        "check:generated-output-drift" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-generated-output-drift.mjs" @ScriptArgs
            return
        }
        "check:alpha" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "--check" "alpha.js"
            return
        }
        "check:alpha-contract" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-alpha-contract.mjs" @ScriptArgs
            return
        }
        "build:public-site" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\build-public-site.mjs" @ScriptArgs
            return
        }
        "check:site-options" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-site-options.mjs" @ScriptArgs
            return
        }
        "inventory:production-routes" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\inventory-production-routes.mjs" "--write" @ScriptArgs
            return
        }
        "check:cloudflare" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-cloudflare.mjs" @ScriptArgs
            return
        }
        "check:cloudflare:live" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-cloudflare.mjs" "--live-required" @ScriptArgs
            return
        }
        "check:custom-domain-cutover" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-custom-domain-cutover.mjs" @ScriptArgs
            return
        }
        "check:alpha-account-gating" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-alpha-account-gating.mjs" @ScriptArgs
            return
        }
        "check:production-cutover" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-production-cutover.mjs" @ScriptArgs
            return
        }
        "check:drive:live" {
            $script:KnownProjectScriptHandled = $true
            if (-not $env:CLOUDFLARE_API_TOKEN) {
                $env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
            }
            if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
                $env:CLOUDFLARE_ACCOUNT_ID = "539e8f7c55e7b1472013626ad72f4c7f"
            }
            Invoke-Node "scripts\check-google-drive-live.mjs" @ScriptArgs
            return
        }
        "check:workspace:hosted-evidence" {
            $script:KnownProjectScriptHandled = $true
            if (-not $env:CLOUDFLARE_API_TOKEN) {
                $env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
            }
            if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
                $env:CLOUDFLARE_ACCOUNT_ID = "539e8f7c55e7b1472013626ad72f4c7f"
            }
            if ($env:WORKSPACE_SMOKE_BASE_URL -and -not $env:DRIVE_LIVE_BASE_URL) {
                $env:DRIVE_LIVE_BASE_URL = $env:WORKSPACE_SMOKE_BASE_URL
            }
            if ($env:WORKSPACE_SMOKE_CREDENTIALS_FILE -and -not $env:DRIVE_LIVE_CREDENTIALS_FILE) {
                $env:DRIVE_LIVE_CREDENTIALS_FILE = $env:WORKSPACE_SMOKE_CREDENTIALS_FILE
            }
            Invoke-Node "scripts\check-google-drive-live.mjs" @ScriptArgs
            return
        }
        "check:workspace:hosted-permissions" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-hosted-workspace-permissions.mjs" @ScriptArgs
            return
        }
        "check:workspace:hosted-dashboard" {
            $script:KnownProjectScriptHandled = $true
            Invoke-Node "scripts\check-hosted-workspace-permissions.mjs" @ScriptArgs
            return
        }
        "qol:hourly" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\run-node-script.ps1" (@("automation\qol\hourly-orchestrator.mjs") + @($ScriptArgs))
            return
        }
        "qol:hourly:dry-run" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\run-node-script.ps1" (@("automation\qol\hourly-orchestrator.mjs", "--dry-run") + @($ScriptArgs))
            return
        }
        "qol:hourly:explain" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\run-node-script.ps1" (@("automation\qol\hourly-orchestrator.mjs", "--explain") + @($ScriptArgs))
            return
        }
        "qol:doctor" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\run-node-script.ps1" (@("automation\qol\doctor.mjs") + @($ScriptArgs))
            return
        }
        "qol:smoke" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\run-node-script.ps1" (@("automation\qol\hourly-orchestrator.mjs", "--smoke") + @($ScriptArgs))
            return
        }
        "verify:qol-automation" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\run-node-script.ps1" (@("automation\qol\hourly-orchestrator.mjs", "--smoke") + @($ScriptArgs))
            return
        }
        "verify:automation-cadence" {
            $script:KnownProjectScriptHandled = $true
            Invoke-ProjectPowerShell "scripts\verify-cadence-30min.ps1" $ScriptArgs
            return
        }
        "typecheck" {
            $script:KnownProjectScriptHandled = $true
            Invoke-TypeScriptCheck -Args $ScriptArgs
            return
        }
        "test" {
            $script:KnownProjectScriptHandled = $true
            $testFiles = @(Get-ChildItem -LiteralPath (Join-Path $RepoRoot "tests") -Filter "*.test.mjs" -File | ForEach-Object { $_.FullName })
            if ($testFiles.Count -eq 0) {
                throw "No test files found in tests\*.test.mjs"
            }
            Invoke-Node "--test" @testFiles
            return
        }
        default {
            if ($AllowUnknown) {
                return
            }

            throw "npm.cmd was not found, and script '$ScriptName' has no local fallback in scripts/run-npm-script.ps1."
        }
    }
}

$npmPath = $null
foreach ($candidate in Get-NpmCandidates) {
    if (Test-Path -LiteralPath $candidate) {
        $npmPath = (Resolve-Path -LiteralPath $candidate).Path
        break
    }
}

Push-Location $RepoRoot
try {
    if (-not $PreferNpm) {
        Invoke-KnownProjectScript -AllowUnknown
        if ($script:KnownProjectScriptHandled) {
            return
        }
    }

    if ($npmPath) {
        $originalPath = $env:PATH
        try {
            $npmDir = Split-Path -Parent $npmPath
            $env:PATH = "$npmDir;$originalPath"
            & $npmPath run $ScriptName @ScriptArgs
            $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
            if ($exitCode -ne 0) {
                exit $exitCode
            }
            return
        }
        finally {
            $env:PATH = $originalPath
        }
    }

    Invoke-KnownProjectScript
}
finally {
    Pop-Location
}
