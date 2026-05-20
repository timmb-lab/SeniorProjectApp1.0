param(
    [string]$RepoRoot = "",
    [string]$DatabaseName = "senior-capstone-db",
    [switch]$InstallDeps,
    [switch]$Remote,
    [string]$NodePath = "",
    [string]$NpmPath = ""
)

$ErrorActionPreference = "Stop"
$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot) {
    $RepoRoot = Join-Path $scriptRoot ".."
}
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

. (Join-Path $scriptRoot "resolve-node.ps1")
$nodeExe = Resolve-CodexNode -PreferredPath $NodePath

function Resolve-NpmCmd {
    param([string]$PreferredPath = "")

    $candidates = New-Object System.Collections.Generic.List[string]
    foreach ($envPath in @($PreferredPath, $env:NPM_CMD, $env:NPM)) {
        if ($envPath) {
            $candidates.Add($envPath)
        }
    }

    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if ($base) {
            $candidates.Add((Join-Path $base "nodejs\\npm.cmd"))
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

    foreach ($candidate in @($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

$wranglerJs = Join-Path $RepoRoot "node_modules\\wrangler\\bin\\wrangler.js"
$wranglerCmd = Join-Path $RepoRoot "node_modules\\.bin\\wrangler.cmd"

function Test-HasWrangler {
    return (Test-Path -LiteralPath $wranglerJs) -or (Test-Path -LiteralPath $wranglerCmd)
}

function Invoke-Wrangler {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)

    if (Test-Path -LiteralPath $wranglerJs) {
        & $nodeExe $wranglerJs @Args
    }
    elseif (Test-Path -LiteralPath $wranglerCmd) {
        & $wranglerCmd @Args
    }
    else {
        throw "wrangler is not installed. Run 'npm install' (or rerun with -InstallDeps) to populate node_modules."
    }

    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
    if ($exitCode -ne 0) {
        throw "wrangler failed (exit $exitCode): wrangler $($Args -join ' ')"
    }
}

Push-Location $RepoRoot
try {
    if (-not (Test-HasWrangler)) {
        if (-not $InstallDeps) {
            throw "node_modules is missing wrangler. Rerun with -InstallDeps to install dev dependencies before applying migrations."
        }

        $npmCmd = Resolve-NpmCmd -PreferredPath $NpmPath
        if (-not $npmCmd) {
            throw "npm.cmd not found. Install Node.js/npm, or set NPM_CMD/NpmPath to a working npm.cmd path."
        }

        $originalPath = $env:PATH
        try {
            $npmDir = Split-Path -Parent $npmCmd
            $nodeDir = Split-Path -Parent $nodeExe
            $env:PATH = "$nodeDir;$npmDir;$originalPath"

            Write-Host "Installing dev dependencies (no package-lock)..."
            & $npmCmd install --no-package-lock --no-audit --no-fund
            $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
            if ($exitCode -ne 0) {
                throw "npm install failed (exit $exitCode)"
            }
        }
        finally {
            $env:PATH = $originalPath
        }

        if (-not (Test-HasWrangler)) {
            throw "wrangler still missing after npm install. Expected node_modules to include wrangler."
        }
    }

    Write-Host "Applying D1 migrations locally for '$DatabaseName'..."
    Invoke-Wrangler "d1" "migrations" "apply" $DatabaseName "--local"

    $verificationSql = @"
SELECT 'requirements_seeded' AS metric, COUNT(*) AS count FROM requirements WHERE id LIKE 'req-%';
SELECT 'deadlines_seeded' AS metric, COUNT(*) AS count FROM deadlines WHERE id LIKE 'deadline-%';
SELECT 'review_gates_seeded' AS metric, COUNT(*) AS count FROM requirement_review_gates;
SELECT 'quality_checks_seeded' AS metric, COUNT(*) AS count FROM quality_checks WHERE id LIKE 'qc-%';
SELECT 'proposal_draft_exists' AS metric, COUNT(*) AS count FROM requirements WHERE id = 'req-proposal-draft';
SELECT 'alpha_placeholder_exists' AS metric, COUNT(*) AS count FROM requirements WHERE id = 'req-alpha-proposal';
"@

    Write-Host "Verifying seeded framework counts locally..."
    Invoke-Wrangler "d1" "execute" $DatabaseName "--local" "--command" $verificationSql

    if ($Remote) {
        if (-not $env:CLOUDFLARE_API_TOKEN) {
            Write-Warning "Remote D1 migration/verification skipped: CLOUDFLARE_API_TOKEN is required for Wrangler in non-interactive environments."
            Write-Warning "REMOTE_BLOCKER: Set CLOUDFLARE_API_TOKEN, then rerun this script with -Remote."
        }
        else {
            Write-Host "Applying D1 migrations remotely for '$DatabaseName'..."
            try {
                Invoke-Wrangler "d1" "migrations" "apply" $DatabaseName "--remote"
                Write-Host "Verifying seeded framework counts remotely..."
                Invoke-Wrangler "d1" "execute" $DatabaseName "--remote" "--command" $verificationSql
            }
            catch {
                Write-Warning "Remote D1 migration/verification failed."
                Write-Warning $_
                Write-Warning "REMOTE_BLOCKER: Verify CLOUDFLARE_API_TOKEN is valid and has D1 permissions, then rerun with -Remote."
            }
        }
    }
}
finally {
    Pop-Location
}
