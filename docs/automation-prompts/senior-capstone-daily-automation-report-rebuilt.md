---
automation_id: "senior-capstone-daily-automation-report-rebuilt"
name: "Senior Capstone Daily Report Standby"
snapshot_generated_utc: "2026-05-18T17:27:42Z"
rrule: "FREQ=DAILY;BYHOUR=7;BYMINUTE=40"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "b8a37cb9115793b6585921ff997634672cf66a715c8f1a0cf736f444560f2bea"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-daily-automation-report-rebuilt\automation.toml"
---

# Senior Capstone Daily Report Standby

## Prompt

~~~~text
Backend boundary from D-2026-05-18-015: Figma may design account and data flows, but real auth, database records, private evidence storage, audit logs, dashboard metrics, migrations, environment templates, deployment config, seed data, and permission tests belong to the app backend foundation. Never treat Figma, Canva, plugin storage, localStorage, or public static assets as production student record storage.

Lane: Senior Capstone Daily Report Standby.

Schedule intent: this daily-report specialist job is intentionally PAUSED so the Senior Capstone system has one primary 5x/day gold-standard orchestrator. The primary orchestrator owns at-most-once-per-local-day reporting. The retained standby schedule is daily at 07:40 PT for future reactivation only if Bryan explicitly asks. Do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks or a committed automation decision supersedes this standby model.

Gold standard role while paused: preserve a ready-to-run reporting prompt that can summarize automation work without intervention, with master planner, pass logger, laddering, self-healing, approval preflight, repo fallback, commit, and push requirements intact.

Report destination: email draft or approved send to `bryan.timm89@gmail.com`; Google Drive/Doc target is `bryan.timm89@gmail.com` and document title `Senior Capstone Daily Automation Log` when connector permissions allow. If Drive is blocked, write to `docs/daily-automation-reports.md` and log the blocker.

Connector approval preflight: before attempting mutating Google Drive calls, verify local Codex app config at `C:\Users\bryan\.codex\config.toml` includes `approval_mode = "approve"` for Google Drive `google drive_create_file` and `google drive_batch_update_document`. If either grant is missing, if Drive write access is unauthorized/403, or if a connector approval prompt would be required, do not wait for Bryan; write the report to `docs/daily-automation-reports.md`, log `ACTION REQUIRED` only for account reauthorization, and continue commit/push closeout. For email, prefer a draft over direct sending unless unattended Gmail sending has been explicitly approved.

Revised MVP target to evaluate: GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Active design source: Figma file `Senior Capstone App - Product UI System Recreated`, key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`, team id `1638213362346160913`, plan key `team::1638213362346160913`. Reference-only prior file: `LLucMgAPscRa9020iHHigB`.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by inspecting `git status --short --branch`, then read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/daily-automation-reporting.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, all lane logs, and last-24-hour git commits/changed files.

Report scope: previous 24 hours of commits, push status, lane activity, progress toward secure database/account/group/progress MVP, GitHub-to-Cloudflare deployment, auth/database/upload/permissions/security gaps, Figma/Canva artifact links, backlog changes, open P0/P1 items, stale blockers/handoffs, new decisions, repeated work, missing logs/commits, connector blockers, next priorities, and human decisions.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, and log the self-improvement result. Otherwise record `self-improvement: none`. Validate, inspect `git status --short`, commit repo fallback/log updates with prefix `audit:`, and push the current branch.
Publication/script auto-approval hard rule: for this project, do not end with local-only repo changes. After any repo file change, run validation, inspect `git status --short`, stage only current-run files, commit with the correct lane prefix, and push the current branch. If push is rejected, fetch/rebase once on a clean worktree and retry; never force push. Run project scripts non-interactively with auto-approved execution flags such as `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\...`. Do not add `Read-Host`, `PromptForChoice`, `Pause`, or confirmation gates to project scripts; scripts should default to the safe approved path, expose explicit flags for risky external/destructive actions, and write committed blockers instead of waiting for unattended approval.
~~~~
