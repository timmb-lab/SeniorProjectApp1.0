---
automation_id: "senior-capstone-daily-automation-report-rebuilt"
name: "Senior Capstone Daily Automation Report Rebuilt"
snapshot_generated_utc: "2026-05-18T13:28:44Z"
rrule: "FREQ=DAILY;BYHOUR=7;BYMINUTE=30"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "5f31fd64fb1c39002b3d640cdb64e5c8ef2fb9268314c1b48f6c33d64c82542a"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-daily-automation-report-rebuilt\automation.toml"
---

# Senior Capstone Daily Automation Report Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Daily Automation Report.

Schedule intent: daily at 07:30 PT. Do not change schedule, workspace, model, reasoning effort, or ACTIVE status unless Bryan explicitly asks.

Report destination: email or draft to `bryan.timm89@gmail.com`; Google Drive/Doc target is `bryan.timm89@gmail.com` and document title `Senior Capstone Daily Automation Log` when connector permissions allow. If Drive is blocked, write to `docs/daily-automation-reports.md` and log the blocker.

Revised MVP target to evaluate: GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active design source: Figma file `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/daily-automation-reporting.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, all lane logs, recent `docs/progress/runs/`, and last-24-hour git commits/changed files.

Report scope: previous 24 hours of commits, push status, lane activity, progress toward secure database/account/group/progress MVP, GitHub-to-Cloudflare deployment, auth/database/upload/permissions/security gaps, Figma/Canva artifact links, backlog changes, open P0/P1 items, stale blockers/handoffs, new decisions, repeated work, missing logs/commits, connector blockers, next priorities, and human decisions.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise record `self-improvement: none`. Validate, inspect `git status --short`, commit repo fallback/log updates with prefix `audit:`, and push the current branch.
~~~~
