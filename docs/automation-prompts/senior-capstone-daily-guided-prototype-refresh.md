---
automation_id: "senior-capstone-daily-guided-prototype-refresh"
name: "Senior Capstone Daily Guided Prototype Refresh"
snapshot_generated_utc: "2026-05-18T18:23:46Z"
rrule: "FREQ=DAILY;BYHOUR=22;BYMINUTE=10"
model: "gpt-5.5"
reasoning_effort: "xhigh"
prompt_sha256: "d4d1fa0479ba0b657a19ead5e0534af4cb5876b7001c135412320f70ea79d000"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-daily-guided-prototype-refresh\automation.toml"
---

# Senior Capstone Daily Guided Prototype Refresh

## Prompt

~~~~text
Backend boundary from D-2026-05-18-018 and D-2026-05-18-019: Figma may design account and data flows, but real auth, database records, private evidence storage, audit logs, dashboard metrics, migrations, environment templates, deployment config, seed data, and permission tests belong to the app backend foundation. Never treat Figma, Canva, plugin storage, localStorage, or public static assets as production student record storage.

Lane: Senior Capstone Daily Guided Prototype Refresh.

Schedule intent: run once per day in America/Los_Angeles at 22:10 PT, after the 20:20 gold-standard orchestrator pass, to update the active multi-page guided Figma prototype from that day's actual progress, blockers, and next ladder position. Keep this automation ACTIVE unless Bryan explicitly asks otherwise or a committed automation decision supersedes this daily prototype model. Preserve workspace, model, and reasoning effort unless Bryan explicitly asks.

Gold standard role: keep the active Figma prototype alive as a daily guided walkthrough of the hosted-app MVP, not a separate product plan. The daily prototype refresh should make the day's progress visible to Bryan and future rebuild work: what changed, what is now real, what remains blocked, what the next ladder step is, and how the app/user journey should reflect it.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Active Figma write target: continue `Senior Capstone App - Product UI System Recreated`, file key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`, in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`. Reference-only prior file: `LLucMgAPscRa9020iHHigB`.

Daily guided prototype contract: update or create page `04 Guided Daily Prototype` in the active Figma file. Keep it multi-frame and click-through, with Back/Next prototype reactions when Figma tools allow. It should include at minimum: start/overview, today's progress, student guided path, staff guided path, security/data boundary, and next ladder. Reflect the last 24 hours of `docs/progress/run-log.md`, recent `docs/progress/runs/`, backlog movement, handoffs, accepted decisions, artifacts, and current master-plan ladder. Do not put real student data or credentials into Figma.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by inspecting `git status --short --branch`, then read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/figma.md`, and adjacent lane logs before selecting the daily prototype update.

Work ladder for this automation: 1) summarize the day's actual MVP progress into `04 Guided Daily Prototype`, 2) update the next-ladder frame from the current P0/P1 backlog and handoffs, 3) add route/data/permission annotations needed by rebuild, 4) verify page/frame IDs and prototype reaction counts, 5) use repo fallback spec/log updates if Figma quota or auth blocks a write.

No-intervention connector rule: if Figma MCP quota, auth, account, or approval would block a write, do not wait for Bryan. Use a repo-side guided prototype update note or handoff fallback, log the blocker, and continue validation, commit, and push the current branch.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, and log the self-improvement result. Otherwise log `self-improvement: none`. Validate touched files, inspect `git status --short`, commit with prefix `figma:`, and push the current branch.

Publication/script auto-approval hard rule: for this project, do not end with local-only repo changes. After any repo file change, run validation, inspect `git status --short`, stage only current-run files, commit with the correct lane prefix, and push the current branch. If push is rejected, fetch/rebase once on a clean worktree and retry; never force push. Run project scripts non-interactively with auto-approved execution flags such as `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\...`. Do not add `Read-Host`, `PromptForChoice`, `Pause`, or confirmation gates to project scripts; scripts should default to the safe approved path, expose explicit flags for risky external/destructive actions, and write committed blockers instead of waiting for unattended approval.
~~~~
