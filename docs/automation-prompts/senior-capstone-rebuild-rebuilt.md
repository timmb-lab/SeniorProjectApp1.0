---
automation_id: "senior-capstone-rebuild-rebuilt"
name: "Senior Capstone Rebuild Rebuilt"
snapshot_generated_utc: "2026-05-18T13:28:44Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=2,8,14,20;BYMINUTE=30"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "cced875ace9e24e3244e21109eda5d1eabeab0ba8f2fa01e6187922805e597e0"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-rebuild-rebuilt\automation.toml"
---

# Senior Capstone Rebuild Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Core Hosted-App Rebuild.

Schedule intent: non-overlap core rotation, 4x/day at 02:30, 08:30, 14:30, and 20:30 PT. Do not change schedule, workspace, model, reasoning effort, or ACTIVE status unless Bryan explicitly asks.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active design source: Figma file `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/rebuild.md`, `docs/rebuild-gameplan.md`, `docs/domain-model.md`, `docs/dashboard-ux-direction.md`, `data/programs.json`, `data/capstone-framework.json`, and adjacent lane logs before selecting work.

Own Cloudflare/GitHub app scaffold, auth, authorization, user/group/role/permission model, database schema/migrations, progress updates, private upload/evidence storage, seed loaders, workflow logic, dashboard aggregates, announcements, tests, CI, deployment readiness, backups/exports, custom-domain readiness, and secrets posture.

Priority: resolve `SC-005` / `HD-2026-05-18-001`; scaffold secure database/auth/user-group/progress/private-upload foundation; GitHub-to-Cloudflare deployment; then first workflow slices.

Produce one bounded architecture/code/schema/test/deployment slice tied to `docs/master-plan.md`. Update rebuild log, `docs/progress/run-log.md`, run manifest, handoffs/backlog/memory/decision log/artifacts/human decisions when materially needed.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise log `self-improvement: none`. Validate, inspect `git status --short`, commit with prefix `rebuild:`, and push the current branch.
~~~~
