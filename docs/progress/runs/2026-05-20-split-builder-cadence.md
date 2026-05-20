# Split Builder Cadence

Date: 2026-05-20 PT

## Purpose

Replace the single undifferentiated 30-minute Senior Capstone builder model with two clean recurring builder lanes:

- `senior-capstone-nonfigma-mvp-builder` hourly at minute 0 PT.
- `senior-capstone-figma-product-builder` hourly at minute 30 PT.

Daily and weekly automations remain oversight/reporting only. Combined builder capacity remains 48 scheduled starts/day and 1,440 scheduled starts/30 days.

## Selected Requirement IDs

- `MVP-028`
- `MVP-030`
- Project-local automation/cadence contract

## Changed Files

- `automation/prompts/senior-capstone-nonfigma-mvp-builder.md`
- `automation/prompts/senior-capstone-figma-product-builder.md`
- `docs/automation-cadence.md`
- `automation/qol/project-lock.json`
- `automation/qol/hourly-orchestrator.mjs`
- `automation/qol/GUI_ALLOWED_COMMANDS.md`
- `automation/qol/README.md`
- `automation/qol/REPORT_SCHEMA.md`
- `automation/qol/SCHEDULED_GUI_CANARY.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-runbook.md`
- `docs/automation-memory.md`
- `docs/automation-backlog.md`
- `docs/automation-progress.md`
- `docs/automation-self-improvement.md`
- `docs/automation.md`
- `docs/daily-automation-reporting.md`
- `docs/master-plan.md`
- `docs/progress/run-log.md`
- `docs/progress/audit.md`
- `docs/progress/decision-log.md`
- `docs/progress/figma.md`
- `docs/progress/handoffs.md`
- `docs/progress/runs/README.md`
- `docs/progress/weekly-deep-audit.md`
- `docs/artifacts.json`
- `docs/human-decisions.md`
- `scripts/verify-cadence-30min.ps1`
- `tests/qol-orchestrator.test.mjs`
- `tests/fixtures/qol-registry-single-active.json`
- `tests/fixtures/qol-registry-multiple-active.json`
- `tests/fixtures/qol-registry-unexpected-active.json`

## Validation Commands

- `git status --short --branch`
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\verify-cadence-30min.ps1 -RepoRoot .`
- `npm run verify:automation-cadence`
- `npm run verify:qol-automation`
- `npm run check:automation`
- JSON parse checks for `package.json`, `automation/qol/project-lock.json`, and `docs/artifacts.json`

## Results

- `git status --short --branch`: pass; changed files were limited to this automation split.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\verify-cadence-30min.ps1 -RepoRoot .`: pass.
- `npm run verify:automation-cadence`: blocked because `npm` is not on PATH in this shell.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 verify:automation-cadence`: pass.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 verify:qol-automation`: pass; 14 QoL smoke checks passed.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation`: pass.
- JSON parse checks: pass for `package.json`, `automation/qol/project-lock.json`, and `docs/artifacts.json`.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 test`: pass; 113 tests passed.

## Commit SHA

Pending until the commit is created; this manifest is intended to be included in that same commit.

## Push Result

Pending until `git push origin main` completes.

## Next Handoff

Bryan must update the external Codex automation scheduler so the non-Figma builder runs hourly at minute 0 PT, the Figma-only builder runs hourly at minute 30 PT, the old `senior-capstone-hourly-qol-orchestrator` is disabled or diagnostic/manual only, and daily/weekly oversight remains active.
