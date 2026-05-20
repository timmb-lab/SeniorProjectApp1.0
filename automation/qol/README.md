# Project-Local QoL 30-Minute Orchestrator

This directory contains the bounded project-local QoL diagnostic path for the Senior Capstone app. It is scoped to this repository only and fails closed when the selected Codex project does not match `automation/qol/project-lock.json`.

As of 2026-05-20, this path is not an active MVP builder prompt. The active builder prompts are `automation/prompts/senior-capstone-nonfigma-mvp-builder.md` and `automation/prompts/senior-capstone-figma-product-builder.md`. These scripts remain useful for project identity checks, automation health reports, lock/state diagnostics, and safety audits.

## Authoritative Files

- Runner prompt and allowed action contract: `automation/qol/GUI_ALLOWED_COMMANDS.md`
- Active non-Figma builder prompt: `automation/prompts/senior-capstone-nonfigma-mvp-builder.md`
- Active Figma-only builder prompt: `automation/prompts/senior-capstone-figma-product-builder.md`
- Project identity lock: `automation/qol/project-lock.json`
- Doctor: `automation/qol/doctor.mjs`
- Legacy diagnostic orchestrator: `automation/qol/hourly-orchestrator.mjs`
- Report schema: `automation/qol/REPORT_SCHEMA.md`
- Canary criteria: `automation/qol/SCHEDULED_GUI_CANARY.md`
- Approved Node wrapper: `scripts/run-node-script.ps1`
- Latest evidence report: `automation/qol/reports/latest.md`

## Legacy Bounded Runner Actions

The older scheduled Codex GUI runner was intentionally narrow. If this diagnostic path is invoked manually, keep its action set narrow:

1. Run the doctor through the approved wrapper.
2. Run the legacy diagnostic orchestrator through the approved wrapper if the doctor exits successfully.
3. Read and summarize `automation/qol/reports/latest.md`.

The exact commands are:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs
```

This diagnostic runner must not use `scripts/run-automation.ps1`, package-manager shortcuts, direct `node.exe`, fallback scripts, altered arguments, alternate shells, dependency installs, git commands, network access, or manual edits. `scripts/run-automation.ps1` intentionally refuses `qol:hourly` so the bounded diagnostic path cannot commit, push, or log to external services. The only file changes allowed during a diagnostic run are those produced by the approved repo-local scripts.

## Why Wrapper-Only

`scripts/run-node-script.ps1` resolves a working Node runtime for Codex desktop environments where PATH can be sparse or `node.exe` can point at the WindowsApps shim. The legacy diagnostic runner must use this wrapper so invocation is explicit, repo-local, and repeatable. Direct Node execution is forbidden for the diagnostic runner because it bypasses that adapter and makes failures harder to distinguish from project failures.

## What It Reads

- Master plan: `docs/master-plan.md`
- Structured requirement overlay: `docs/mvp-requirements-catalog.md`
- Backlog overlay: `docs/automation-backlog.md`
- Sanitized live hidden-registry evidence: `automation/qol/state/automation-registry-evidence.json`

The orchestrator does not use another project, parent directory, sibling checkout, temp clone, global Codex state, or external automation registry as its source of truth. If live hidden-registry evidence is absent, the report must say `UNKNOWN_REGISTRY_UNINSPECTABLE`. Test fixtures under `tests/fixtures/` are regression inputs only and must not be cited as live scheduler proof.

## State, Lock, Logs, And Reports

- State: `automation/qol/state/state.json`
- Generated plan index: `automation/qol/state/plan-index.json`
- Overlap lock: `automation/qol/state/lock/metadata.json`
- Logs: `automation/qol/logs/`
- Reports: `automation/qol/reports/`
- Latest report: `automation/qol/reports/latest.md`

State saves are atomic. Previous state files are backed up before replacement. A fresh lock blocks overlap. A stale lock older than 90 minutes is moved aside inside `automation/qol/state/` with metadata preserved before a new lock is acquired. If lock freshness or ownership is unclear, treat the run as blocked instead of deleting user work.

## Report Freshness

`latest.md` is fresh when its `run_id`, `run_started_at`, `run_finished_at`, and matching per-run report filename all describe the just-completed orchestrator run. If the doctor fails, the orchestrator must not run and no fresh orchestrator report should be assumed. If the orchestrator fails before writing a new report, read `latest.md` only to state that it is stale or unverifiable.

For the current canary, compare against the baseline in `automation/qol/SCHEDULED_GUI_CANARY.md`. After a canary succeeds, do not keep using an old hardcoded run_id as the only freshness baseline; compare against the latest repo-local run evidence and timestamps.

## Failure Handling

If `doctor.mjs` fails:

- stop immediately
- do not run `hourly-orchestrator.mjs`
- report the doctor failure
- do not retry
- do not run fallback scripts
- do not rely on stale reports except to state no fresh report was produced

If `hourly-orchestrator.mjs` fails:

- read `automation/qol/reports/latest.md` if available
- state whether it appears fresh or stale
- report the failure clearly
- do not retry
- do not run fallback scripts

Failure recovery must stay repo-local. Do not inspect, edit, pause, unpause, create, delete, revive, or modify external/global Codex automation registry entries.

## Developer Verification

These commands are for a human-maintenance pass, not for broadening the scheduled runner:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs --smoke
```

Package scripts are available for local convenience, but the scheduled runner prompt forbids package-manager shortcuts:

```powershell
npm run qol:doctor
npm run qol:hourly
npm run verify:qol-automation
```

## Repo-Local Codex Rules

No repo-local `.codex/config.toml` exists at this time. If one is added later, it should forbid direct execution of:

- `node automation/qol/doctor.mjs`
- `node automation/qol/hourly-orchestrator.mjs`
- `node.exe automation/qol/doctor.mjs`
- `node.exe automation/qol/hourly-orchestrator.mjs`

It should require or prefer the two exact `scripts/run-node-script.ps1` commands listed above. Do not edit global Codex config for this policy.
