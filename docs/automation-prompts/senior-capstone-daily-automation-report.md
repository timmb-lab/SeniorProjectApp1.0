---
automation_id: "senior-capstone-daily-automation-report"
name: "Senior Capstone Daily Automation Report"
snapshot_generated_utc: "2026-05-18T04:06:08Z"
rrule: "FREQ=DAILY;BYHOUR=7;BYMINUTE=30"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "5b16dca007f0b839b5bbaa171f685a25514a95281111523fb3b11b3322b2535a"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-daily-automation-report\automation.toml"
---

# Senior Capstone Daily Automation Report

## Prompt

~~~~text
Lane: Senior Capstone Daily Automation Report.

Schedule intent: daily at 07:30. Do not change this schedule unless Bryan explicitly asks.

Destinations:
- Email summary destination: `bryan.timm89@gmail.com`.
- Google Drive/Google Doc target account: `bryan.timm89@gmail.com` when connector permissions allow.
- Google Doc title: `Senior Capstone Daily Automation Log`.
- Repo fallback and durable reference file: `docs/daily-automation-reports.md` when Google Doc write access is blocked or when a repo copy is useful for future automations.

Active design artifact to mention when relevant:
- Figma active product UI file: `Senior Capstone App - Product UI System Regenerated`, file key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`; Figma `whoami` most recently reported `timmb@nv.ccsd.net`.
- Superseded historical Figma file `fkfNI9JNy0A3Rm8KnoxJLj` should be described only as the prior blocked file.

Non-negotiable product destination to evaluate:
The automation loop is building a hosted Senior Capstone app with secure users, roles, permissions, private upload/evidence spaces, submissions, mentor/program-teacher review, revision requests, approvals, dashboards, admin controls, audit logs, exports, and protected student records. The daily report should judge progress against that end goal, not just count activity.

Required programs to watch for coverage:
IT; Culinary; Hospitality & Marketing; Mechanical Technology; Construction; Sports Medicine; Teaching & Training; Early Childhood Education; Medical Professions.

Start-of-run reads:
1. Inspect `git status --short --branch` and current upstream. If clean and fast-forward sync is safe, sync before editing; if dirty, classify dirty files and do not overwrite unrelated work.
2. Read `docs/master-plan.md`, especially Product Destination, First Real Vertical Slice, Milestone Path, Logging Requirements, and Weekly Human Check-In Questions.
3. Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/daily-automation-reporting.md`, and `docs/automation-memory.md`.
4. Read recent entries from `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, and all lane logs in `docs/progress/`.
5. Inspect git commits, changed files, and any relevant artifact IDs/links from the last 24 hours.

Reporting scope:
Cover the previous 24 hours of automation work. Include:
- Commits and pushed branches.
- Lane-by-lane activity for Figma, rebuild, audit, Canva, and reporting.
- Product progress toward the hosted app and first vertical slice.
- Auth/database/upload/permissions/security gaps.
- Figma/Canva artifact links/IDs and whether they are recorded in repo logs/specs.
- Backlog changes, open P0/P1 items, stale blockers, stale handoffs, and new decisions.
- Repeated work, missing logs, missing commits, failed pushes, connector blockers, or weak handoffs.
- Recommended next priorities for the next 24 hours.
- Any human decisions Bryan needs to make.

Delivery requirements:
- Send or draft the email summary to `bryan.timm89@gmail.com` using available Gmail capabilities. Do not send to the old school account unless Bryan explicitly changes the destination.
- Append the same summary to the Google Doc titled `Senior Capstone Daily Automation Log` under the `bryan.timm89@gmail.com` Google Drive target when connector permissions allow.
- If Google Drive write access is blocked, write the summary to `docs/daily-automation-reports.md` and include the Drive blocker in the email/report.
- If Gmail send is unavailable or confirmation is required, draft the email and clearly log the blocker.

Definition of done:
- The daily summary exists in at least one durable destination: sent/drafted email, Google Doc, and/or repo fallback.
- Any repo fallback or reporting-doc update is committed and pushed.
- Update `docs/automation-memory.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, or `docs/automation-backlog.md` only when the report discovers a durable change, blocker, or decision future runs need.
- Append a compact reporting entry to `docs/progress/run-log.md` when repo logs are changed or a material reporting blocker is discovered.

Self-improvement closeout:
- Re-read `docs/automation-self-improvement.md` during closeout.
- Compare the report against your own live automation prompt/config, recent reporting results, delivery failures, missing recipients, Drive/Gmail blockers, stale summary structure, and log usefulness.
- If no prompt/config change is justified, record `self-improvement: none` in the report or repo fallback when a repo report is written.
- If evidence shows your own prompt/config is missing a required read, has weak report structure, loses destination/account rules, mishandles Google Drive/Gmail fallbacks, misses log-health checks, or contradicts accepted docs, use `automation_update` to update only `senior-capstone-daily-automation-report`.
- Preserve id, kind, name, schedule, workspace, model, reasoning effort, and ACTIVE status unless Bryan explicitly asked to change them.
- Do not edit other automations. Create a handoff or report recommendation instead.
- Log the evidence, what changed, and verification that the live prompt now contains the intended rule.

Git closeout:
- Inspect `git status --short` before staging.
- Stage only files changed by this run.
- If repo files changed, commit with prefix `audit:` unless the change is only reporting docs, in which case `audit:` is still acceptable for reporting quality/log hygiene, and push the current branch.
- If push is rejected, attempt one safe fast-forward sync only after a successful commit and only if the post-commit worktree is clean; never force push.
- If commit/push/publication is blocked, log the exact blocker and next action.

Final response:
Summarize delivery status, last-24-hour headline, blockers, self-improvement result, repo commit hash if any, push status, and next priorities.
~~~~
