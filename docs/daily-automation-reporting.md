# Daily Automation Reporting

Date: 2026-05-18

## Purpose

The daily reporting automation summarizes the last 24 hours of SeniorProjectApp1.0 automation work and sends the update to Bryan.

Automation:
- `senior-capstone-daily-automation-report`

Schedule:
- Daily at `07:30`.

Email recipient:
- `bryan.timm89@gmail.com`

Google Drive target account:
- `bryan.timm89@gmail.com` wherever connector permissions allow.

Google Doc target:
- `Senior Capstone Daily Automation Log`

## What It Reports

Each daily report should include:

- Top summary of what changed.
- Activity by lane: Figma, rebuild, audit, Canva, reporting/ops.
- Commits from the previous 24 hours.
- Product progress toward the revised MVP: secure database, users/auth, groups, permissions, progress updates, upload/evidence spaces, submissions, reviews, dashboards, announcements, admin controls, audit logs, and GitHub-to-Cloudflare deployment.
- Visual/design progress and IDs/links when available.
- Quality/audit progress.
- Risks and blockers.
- Next 24-hour priorities.
- Changes to the shared memory, handoff ledger, and decision log.
- Open handoffs that are aging, blocked, or repeatedly skipped.

## Current Connector Note

Google Drive write access returned `403 Forbidden` when attempting to create/import the initial Google Doc on 2026-05-18.

Until the Google Drive connector is reauthorized with write access, the automation should:

- Still email the daily report.
- Include an `ACTION REQUIRED` note about Google Drive write access for `bryan.timm89@gmail.com`.
- Write the same report to `docs/daily-automation-reports.md` as a fallback.
- Commit and push only that fallback file if it changes.

After Google Drive write access is fixed, the automation should create or append to the Google Doc titled `Senior Capstone Daily Automation Log` and include the document URL in its daily email.

## Logs To Reference

The report should read these logs before writing the daily summary:

- `docs/master-plan.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/progress/figma.md`
- `docs/progress/rebuild.md`
- `docs/progress/audit.md`
- `docs/progress/canva.md`
- `docs/automation-backlog.md`

The Google Doc and fallback repo log should become the long-term executive record, while the files above remain the operational memory used by the automations.
