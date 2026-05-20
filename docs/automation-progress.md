# Automation Progress

Last refreshed: 2026-05-19

This file keeps the current automation operating note for the Senior Capstone project.

The project-local automation contract is singular:

- Active GUI automation: `senior-capstone-hourly-qol-orchestrator`.
- Cadence: every 30 minutes.
- RRULE: `FREQ=MINUTELY;INTERVAL=30`.
- Project lock: `automation/qol/project-lock.json`.
- Allowed commands: `automation/qol/GUI_ALLOWED_COMMANDS.md`.
- Cadence verifier: `scripts/verify-cadence-30min.ps1`.

No other Senior Capstone project delivery automation should be created, invoked, revived, or maintained from this repo unless Bryan explicitly asks for it. The daily summary and weekly strategy review are oversight automations, not competing delivery lanes.

For current product progress, use:

- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/automation-backlog.md`
