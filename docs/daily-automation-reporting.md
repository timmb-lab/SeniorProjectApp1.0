# Daily Automation Reporting

Date: 2026-05-18
Last refreshed: 2026-05-20

## Purpose

Daily reporting is owned by a separate report-only automation so the split builders can stay focused on implementation and Figma-only product handoffs.

Primary owner:
- `senior-capstone-daily-mvp-summary`

Schedule:
- Daily morning summary of the prior 24 hours.

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

Until the Google Drive connector is reauthorized with write access, the daily summary automation should:

- Send the daily report through the available Codex automation output, and email it if Gmail access works in that automation context.
- Include an action-required note about Google Drive write access for `bryan.timm89@gmail.com`.
- Avoid repo writes by default. Use `docs/daily-automation-reports.md` as a fallback only if Bryan explicitly asks for committed daily report history.

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

The daily automation output is the near-term executive record. The files above remain the operational memory used by the split builders and weekly strategy review.
