# Automation Progress

Last refreshed: 2026-05-20

This file keeps the current automation operating note for the Senior Capstone project.

The project-local automation contract is split:

- Active non-Figma builder: `senior-capstone-nonfigma-mvp-builder`.
- Active Figma-only builder: `senior-capstone-figma-product-builder`.
- Non-Figma RRULE: `FREQ=HOURLY;BYMINUTE=0;BYSECOND=0`.
- Figma RRULE: `FREQ=HOURLY;BYMINUTE=30;BYSECOND=0`.
- Project lock: `automation/qol/project-lock.json`.
- Allowed commands: `automation/qol/GUI_ALLOWED_COMMANDS.md`.
- Cadence verifier: `scripts/verify-cadence-30min.ps1`.

No other Senior Capstone project delivery automation should be created, invoked, revived, or maintained from this repo unless Bryan explicitly asks for it. The old `senior-capstone-hourly-qol-orchestrator` is legacy diagnostic/manual only. The daily summary and weekly strategy review are oversight automations, not competing delivery lanes.

For current product progress, use:

- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/automation-backlog.md`
