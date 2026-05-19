# Project-Local QoL Hourly Orchestrator

This directory contains the one project-local QoL automation entrypoint for the Senior Capstone app. It is scoped to this repository only and fails closed when the selected Codex project does not match `automation/qol/project-lock.json`.

## What It Reads

- Master plan: `docs/master-plan.md`
- Structured requirement overlay: `docs/mvp-requirements-catalog.md`
- Backlog overlay: `docs/automation-backlog.md`

The orchestrator parses MVP table rows, backlog `SC-*` items, and the QoL sections in the master plan. It does not use another project, parent directory, sibling checkout, or global Codex state as its source of truth.

## How Work Is Chosen

Each hourly run scores ready tasks by priority, dependency state, category freshness, last attempt, failure cooldown, recurring cadence, and dirty-worktree risk. It selects one bounded slice, runs at most one safe project-local validation command, records state, writes a report, and exits.

Recurring safety tasks remain recurring. Product-facing MVP tasks are not rewritten by the script; the script only performs bounded QoL validation, scope auditing, plan indexing, and reporting unless a future project-local plan item adds a safe command.

## Commands

Use the project wrappers so the Codex bundled Node runtime is used when PATH is sparse:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs --dry-run
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs --explain
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs --smoke
```

Package scripts are also available:

```powershell
npm run qol:doctor
npm run qol:hourly
npm run qol:hourly:dry-run
npm run qol:hourly:explain
npm run qol:smoke
```

## State, Lock, Logs, And Reports

- State: `automation/qol/state/state.json`
- Generated plan index: `automation/qol/state/plan-index.json`
- Overlap lock: `automation/qol/state/lock/metadata.json`
- Logs: `automation/qol/logs/`
- Reports: `automation/qol/reports/`
- Latest report: `automation/qol/reports/latest.md`

State saves are atomic. Previous state files are backed up before replacement. A fresh lock causes the run to exit cleanly. A stale lock older than 90 minutes is moved aside with metadata preserved before a new lock is acquired.

## Project Identity Guard

The lock file checks the repo basename, package name, Wrangler project name, Git top-level, Git remote substring/hash, unique project marker, and expected plan/state/log/report paths. All project paths are resolved and rejected if they escape this repo. If the wrong Codex project is selected, the script exits before acquiring a lock or writing state.

## Codex Automation Setup

Create one Codex desktop automation and select only this project in the project picker. Recommended schedule: hourly, cron `0 * * * *`.

Recommended execution mode: worktree, because this repo often has active local docs edits and the guard is worktree-compatible. Local mode is also supported when you intentionally want state and reports written in the current checkout.

The canonical GUI command contract is `automation/qol/GUI_ALLOWED_COMMANDS.md`. Because local direct `node.exe` execution can be blocked by the WindowsApps shim, the scheduled GUI path must use `scripts/run-node-script.ps1` for both doctor and hourly orchestrator execution. The GUI automation should not run legacy Senior Capstone scripts, edit external automation registry entries, or continue after doctor fails.

Recurring prompt:

> Run the project-local QoL hourly orchestrator for THIS selected project only. First verify that the selected Codex project matches the project lock. Do not inspect or modify any other project. Run the QoL doctor/preflight if available, then run the hourly orchestrator. Follow the master plan, perform only the bounded selected work slice, write the run report, and summarize results. If the project identity guard fails, stop immediately and report the mismatch.

The prompt should run:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs
```

## Common Failures

- Wrong project selected: choose `SeniorProjectApp1.0` in Codex and rerun. Do not point this automation at another project.
- Missing master plan: restore `docs/master-plan.md` or update `automation/qol/project-lock.json` in the same repo with a reviewed plan path.
- Active lock: inspect `automation/qol/reports/latest.md`; a fresh lock means another hourly run is still active.
- Stale lock: the script preserves stale metadata and continues after the 90-minute threshold.
- Missing Node: run through `scripts/run-node-script.ps1`, which resolves the Codex bundled Node runtime.

## Resetting State Safely

Pause the Codex automation first. Move `automation/qol/state/state.json` to a timestamped backup inside `automation/qol/state/`, then run `qol:doctor` and `qol:hourly --dry-run`. Do not delete logs or reports outside `automation/qol/`.

## Adding Tasks

Add or update rows in `docs/mvp-requirements-catalog.md`, backlog items in `docs/automation-backlog.md`, or relevant sections in `docs/master-plan.md`. Include status and acceptance or next-action text so the parser can score the task without guessing.
