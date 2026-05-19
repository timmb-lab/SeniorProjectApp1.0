param(
    [string]$PreferredPath = ""
)

$ErrorActionPreference = "Stop"

function Test-NodeExecutable {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    try {
        $version = & $Path --version 2>$null
        return ($LASTEXITCODE -eq 0 -and [string]$version -match "^v\d+")
    }
    catch {
        return $false
    }
}

function Resolve-CodexNode {
    param([string]$PreferredPath = "")

    $candidates = New-Object System.Collections.Generic.List[string]

    foreach ($envPath in @($PreferredPath, $env:NODE_EXE, $env:CODEX_NODE_EXE)) {
        if ($envPath) {
            $candidates.Add($envPath)
        }
    }

    if ($HOME) {
        $primaryRuntimeNode = Join-Path $HOME ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
        $candidates.Add($primaryRuntimeNode)

        $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
        if (Test-Path -LiteralPath $runtimeRoot) {
            Get-ChildItem -LiteralPath $runtimeRoot -Filter "node.exe" -File -Recurse -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -like "*\dependencies\node\bin\node.exe" } |
                ForEach-Object { $candidates.Add($_.FullName) }
        }
    }

    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if ($base) {
            $candidates.Add((Join-Path $base "nodejs\node.exe"))
        }
    }

    try {
        $whereResults = @(where.exe node.exe 2>$null)
        foreach ($result in $whereResults) {
            if ($result) {
                $candidates.Add($result.Trim())
            }
        }
    }
    catch {
    }

    $uniqueCandidates = @($candidates | Where-Object { $_ } | Select-Object -Unique)
    $orderedCandidates = @(
        @($uniqueCandidates | Where-Object { $_ -notlike "*\WindowsApps\*" }) +
        @($uniqueCandidates | Where-Object { $_ -like "*\WindowsApps\*" })
    )

    foreach ($candidate in $orderedCandidates) {
        if (Test-NodeExecutable -Path $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "Could not locate an executable Node.js runtime. Set NODE_EXE or CODEX_NODE_EXE to a working node.exe path."
}

if ($MyInvocation.InvocationName -ne ".") {
    Resolve-CodexNode -PreferredPath $PreferredPath
}
