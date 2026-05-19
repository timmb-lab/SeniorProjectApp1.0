#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

if command -v pwsh >/dev/null 2>&1; then
  PS=pwsh
else
  PS=powershell
fi

exec "$PS" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$REPO_ROOT/scripts/run-automation.ps1" "$@"

