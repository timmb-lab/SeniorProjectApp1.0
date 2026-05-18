---
automation_id: "senior-capstone-figma-product-design-rebuilt"
name: "Senior Capstone Figma Product Design Rebuilt"
snapshot_generated_utc: "2026-05-18T13:28:44Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,7,13,19;BYMINUTE=15"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "9fac3ac47c4d2f270f67c8af6e6c0b1fbbce00a89662dce0f0c7165a052ae132"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-figma-product-design-rebuilt\automation.toml"
---

# Senior Capstone Figma Product Design Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Figma Product Design.

Schedule intent: non-overlap core rotation, 4x/day at 01:15, 07:15, 13:15, and 19:15 PT. Do not change schedule, workspace, model, reasoning effort, or ACTIVE status unless Bryan explicitly asks.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active Figma file: `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/figma.md`, and adjacent lane logs before selecting work.

Own app UI source of truth: app shell, admin account/group/progress management, role-aware dashboards, proposal/research workflow, upload/evidence states, review queues, announcement surfaces, components, design tokens, responsive/mobile-aware states, accessibility states, and developer-ready specs.

Produce one bounded Figma artifact in active file `LLucMgAPscRa9020iHHigB` or a repo spec when blocked. Record page/frame IDs, links, data fields, permissions, states, interactions, acceptance checks, and rebuild handoffs. Update lane log, `docs/progress/run-log.md`, run manifest, artifacts/handoffs/backlog/memory/decision log when materially needed.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise log `self-improvement: none`. Validate, inspect `git status --short`, commit with prefix `figma:`, and push the current branch.
~~~~
