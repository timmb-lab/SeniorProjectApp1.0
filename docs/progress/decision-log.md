# Decision Log

Last refreshed: 2026-05-19

## Current Automation Decision

- `area`: project-local Senior Capstone automation
- `decision`: Keep exactly one GUI-available project automation, `senior-capstone-hourly-qol-orchestrator`, running every 30 minutes from this repo.
- `applies to`: `automation/qol/project-lock.json`, `automation/qol/GUI_ALLOWED_COMMANDS.md`, `automation/qol/hourly-orchestrator.mjs`, `docs/automation-cadence.md`, `docs/automation-memory.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, and `scripts/verify-cadence-30min.ps1`.
- `reason`: Bryan clarified there should be no other project automation than the single GUI-available runner.
- `verification`: `scripts/verify-cadence-30min.ps1` checks the 30-minute cadence and fails if active project automation returns to hourly or 60-minute scheduling language.

## Current Product Decisions

- The app target is a secure, database-backed Senior Capstone application, not a static guide or visual-only prototype.
- The accepted deployment direction is GitHub-connected Cloudflare Pages/Functions with D1.
- Hardened username/password pilot auth is the MVP path until school SSO is available.
- Google Drive is the MVP evidence repository path while D1 stores metadata, review state, and audit history.
- Real student data must not be entered into alpha or committed to the repo.
