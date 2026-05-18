---
automation_id: "senior-capstone-canva-visual-system-rebuilt"
name: "Senior Capstone Canva Visual System Rebuilt"
snapshot_generated_utc: "2026-05-18T13:28:44Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,6,12,18;BYMINUTE=0"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "12db4312fa472915544389f8c8f1e1affd84d68721173324cfa53e3cd0bc75a4"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-canva-visual-system-rebuilt\automation.toml"
---

# Senior Capstone Canva Visual System Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Canva Visual System.

Schedule intent: non-overlap core rotation, 4x/day at 00:00, 06:00, 12:00, and 18:00 PT. Do not change schedule, workspace, model, reasoning effort, or ACTIVE status unless Bryan explicitly asks.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records.

Active product UI source: Figma file `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, and `docs/automation-backlog.md` before selecting work. Use `automation_update` only for this automation's own prompt/config if self-improvement is justified. End with validation, lane logs, a run manifest, a lane-prefixed commit, and push the current branch.
~~~~
