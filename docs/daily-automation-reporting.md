# Daily Automation Reporting

Date: 2026-05-18

## Purpose

Daily reporting is now a QoL-runner responsibility after the 2026-05-18 automation reset and later QoL rebuild. The standalone daily-report automation was deleted with the old project automation setup.

Primary owner:
- `senior-capstone-qol-source-framework-seed`

Schedule:
- Primary path: at most once per local day during a source-framework/catalog QoL pass.
- Supporting evidence may be gathered from any QoL runner's logs and manifests.

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

The daily report is intended to run without Bryan sitting at the machine. Before attempting Google Drive writes, confirm the local Codex app has `Always allow` grants for:

- `google drive_create_file`
- `google drive_batch_update_document`

In `C:\Users\bryan\.codex\config.toml`, those grants appear as `approval_mode = "approve"` entries under the Google Drive connector tool sections. If either grant is missing, the automation should not start a mutating Drive call because it may pause on an approval prompt. It should use the repo fallback and log an action-required note instead. If the grants exist but Google Drive returns `403 Forbidden`, treat that as an account/scope reauthorization blocker, not as an automation prompt to wait on.

Until the Google Drive connector is reauthorized with write access, the automation should:

- Still email the daily report.
- Include an `ACTION REQUIRED` note about Google Drive write access for `bryan.timm89@gmail.com`.
- Write the same report to `docs/daily-automation-reports.md` as a fallback.
- Commit and push only that fallback file if it changes.

After Google Drive write access is fixed, the automation should create or append to the Google Doc titled `Senior Capstone Daily Automation Log` and include the document URL in its daily email.

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

The Google Doc and fallback repo log should become the long-term executive record, while the files above remain the operational memory used by the automations.
