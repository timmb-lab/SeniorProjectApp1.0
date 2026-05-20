# Daily Automation Reporting

Date: 2026-05-18
Last refreshed: 2026-05-19

## Purpose

Daily reporting is a responsibility of the single GUI-available 30-minute QoL runner. There is no separate daily reporting automation for this project.

Primary owner:
- `senior-capstone-hourly-qol-orchestrator`

Schedule:
- At most once per local day when the single runner selects a reporting slice.

Email recipient:
- `bryan.timm89@gmail.com`

Google Drive target account:
- `bryan.timm89@gmail.com` wherever connector permissions allow.

Google Doc target:
- `Senior Capstone Daily Automation Log`

## What It Reports

Each daily report should include:

- Top summary of what changed.
- Activity by product grouping: Figma, rebuild, audit, Canva, reporting/ops.
- Commits from the previous 24 hours.
- Product progress toward the revised MVP.
- Visual/design progress and IDs/links when available.
- Quality/audit progress.
- Risks and blockers.
- Next 24-hour priorities.
- Changes to shared memory, handoffs, and decisions.
- Open handoffs that are aging, blocked, or repeatedly skipped.

## Current Connector Note

Google Drive write access returned `403 Forbidden` when attempting to create/import the initial Google Doc on 2026-05-18.

Until the Google Drive connector is reauthorized with write access, the runner should:

- Send the daily email if Gmail access works.
- Include an action-required note about Google Drive write access for `bryan.timm89@gmail.com`.
- Write the same report to `docs/daily-automation-reports.md` as a fallback only when the runner chooses a daily reporting slice.
- Commit and push only that fallback file if it changes.

## Logs To Reference

The report should read these logs before writing the daily summary:

- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/progress/figma.md`
- `docs/progress/rebuild.md`
- `docs/progress/audit.md`
- `docs/progress/canva.md`
- `docs/automation-backlog.md`

The Google Doc and fallback repo log should become the long-term executive record, while the files above remain the operational memory used by the single runner.
