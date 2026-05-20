# Automation Guardrails

This repo standardizes broad reusable automation runs behind a guardrail wrapper. The bounded Senior Capstone QoL hourly GUI runner is a special narrow path and uses `automation/qol/GUI_ALLOWED_COMMANDS.md` instead.

## Why

Every automation run must:

1. run from the repo root,
2. produce an audit record,
3. commit its result,
4. push to the current branch upstream,
5. append a row to the project's Google Sheet run log.

## Run Through The Wrapper

PowerShell (Windows):

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-automation.ps1 <automation-name> [args...]
```

Shell (macOS/Linux, requires `pwsh` or `powershell` available):

```sh
./scripts/run_automation.sh <automation-name> [args...]
```

Examples for broad guarded automations:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-automation.ps1 figma:hourly
```

The QoL hourly GUI runner must not use this wrapper; `scripts/run-automation.ps1` refuses `qol:hourly` so it cannot commit, push, or log to Sheets from the bounded hourly path. Its allowed sequence is:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs
```

## Required Environment Variables

The wrapper fails fast if Google Sheet logging is not configured.

Set these in your shell/session (or use your own `.env` loader):

- `AUTOMATION_SHEETS_SPREADSHEET_ID`
- `AUTOMATION_SHEETS_TAB_NAME`
- `GOOGLE_SHEETS_CLIENT_EMAIL` (or fallback `GOOGLE_DRIVE_CLIENT_EMAIL`)
- `GOOGLE_SHEETS_PRIVATE_KEY` (or fallback `GOOGLE_DRIVE_PRIVATE_KEY`)

Optional:

- `AUTOMATION_ACTOR` (defaults to `USERNAME`/`USER`)

## Outbox + Backfill

If the Sheets append fails after a successful push, the wrapper writes a durable pending payload into:

- `.automation-log-outbox/`

Retry pending payloads:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\sync-automation-sheet-logs.ps1
```

## Dry Run

`-DryRun` performs preflight checks only (no run/commit/push/sheet write).

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-automation.ps1 figma:hourly -DryRun
```

## Intentional Exclusions

Some scripts are intentionally **not** guarded (no commit/push/sheet log) because they are dev/CI helpers or deploy commands:

- `.github/workflows/ci.yml` (CI checks)
- `npm run dev*`, `npm run deploy*` (deployment/dev servers)
