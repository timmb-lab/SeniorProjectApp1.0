---
automation_id: "senior-capstone-daily-automation-report-rebuilt"
name: "Senior Capstone Daily Automation Report Rebuilt"
snapshot_generated_utc: "2026-05-18T15:26:06Z"
rrule: "FREQ=DAILY;BYHOUR=7;BYMINUTE=40"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "bc801dc369effd86811c4060d3b40a313f150853b2669cfa57a07c30bb8e9e98"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-daily-automation-report-rebuilt\automation.toml"
---

# Senior Capstone Daily Automation Report Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Daily Automation Report.

Schedule intent: daily at 07:40 PT, staggered away from the 30-minute beta loop. Do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

Report destination: email or draft to `bryan.timm89@gmail.com`; Google Drive/Doc target is `bryan.timm89@gmail.com` and document title `Senior Capstone Daily Automation Log` when connector permissions allow. If Drive is blocked, write to `docs/daily-automation-reports.md` and log the blocker.

Connector approval preflight: this automation is expected to run unattended. Before attempting mutating Google Drive calls, verify local Codex app config at `C:\Users\bryan\.codex\config.toml` includes `approval_mode = "approve"` for Google Drive `google drive_create_file` and `google drive_batch_update_document`. If either grant is missing, if Drive write access is unauthorized, or if a connector approval prompt would be required, do not start a mutating Drive call; write the report to `docs/daily-automation-reports.md`, log `ACTION REQUIRED`, and continue the repo commit/push closeout. For email, prefer a draft over direct sending unless unattended Gmail sending has been explicitly approved.

Revised MVP target to evaluate: GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active design source: Figma file `Senior Capstone App - Product UI System Recreated`, key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`, in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`. Reference-only prior file: `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`, old team `team::1601310068697743794`.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by reading the master planner and recent pass logger entries, summarize the last 24 hours, then update the daily report destination or fallback log, pass logger, run manifest, and any material memory/handoff/backlog/decision/artifact/human-decision records. If evidence shows this automation prompt or support scripts are stale, use `automation_update` only for this automation's own prompt/config, regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, log the self-improvement result, commit, and push.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/daily-automation-reporting.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, all lane logs, and last-24-hour git commits/changed files.

Report scope: previous 24 hours of commits, push status, lane activity, progress toward secure database/account/group/progress MVP, GitHub-to-Cloudflare deployment, auth/database/upload/permissions/security gaps, Figma/Canva artifact links, backlog changes, open P0/P1 items, stale blockers/handoffs, new decisions, repeated work, missing logs/commits, connector blockers, next priorities, and human decisions.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise record `self-improvement: none`. Validate, inspect `git status --short`, commit repo fallback/log updates with prefix `audit:`, and push the current branch.
~~~~
