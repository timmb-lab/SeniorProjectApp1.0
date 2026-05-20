# Decision Log

Last refreshed: 2026-05-20

## Current Automation Decision

- `area`: project-local Senior Capstone automation
- `decision`: Use `senior-capstone-hourly-qol-orchestrator` as the single 30-minute MVP builder, with `senior-capstone-daily-mvp-summary` as a report-only daily summary and `senior-capstone-weekly-script-audit` as the weekly strategy review.
- `applies to`: `automation/qol/project-lock.json`, `automation/qol/GUI_ALLOWED_COMMANDS.md`, `automation/qol/hourly-orchestrator.mjs`, `docs/automation-cadence.md`, `docs/automation-memory.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, and `scripts/verify-cadence-30min.ps1`.
- `reason`: Bryan clarified that the automation must produce real MVP results, send a daily last-24-hours summary, and run a detailed seven-day strategy review that adjusts the master plan from evidence.
- `verification`: `scripts/verify-cadence-30min.ps1` checks the 30-minute builder cadence, oversight automation records, and stale hourly/single-report-only language.

## Current Product Decisions

- The app target is a secure, database-backed Senior Capstone application, not a static guide or visual-only prototype.
- The accepted deployment direction is GitHub-connected Cloudflare Pages/Functions with D1.
- Hardened username/password pilot auth is the MVP path until school SSO is available.
- Google Drive is the MVP evidence repository path while D1 stores metadata, review state, and audit history.
- Real student data must not be entered into alpha or committed to the repo.
