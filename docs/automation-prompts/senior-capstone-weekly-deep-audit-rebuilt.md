---
automation_id: "senior-capstone-weekly-deep-audit-rebuilt"
name: "Senior Capstone Weekly Deep Audit Rebuilt"
snapshot_generated_utc: "2026-05-18T13:28:44Z"
rrule: "FREQ=WEEKLY;BYDAY=SU;BYHOUR=23;BYMINUTE=30"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "243f64ccd88be52015c6c2ffd636b31a1019f7d0835ca92c3375cf8e0a260786"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-weekly-deep-audit-rebuilt\automation.toml"
---

# Senior Capstone Weekly Deep Audit Rebuilt

## Prompt

~~~~text
Role: Senior Capstone Weekly Deep Audit.

Schedule intent: Sundays at 23:30 PT. Do not change schedule, workspace, model, reasoning effort, or ACTIVE status unless Bryan explicitly asks.

Mission: run a long, severe, piece-by-piece audit of the Senior Capstone app effort and feed durable findings into master plan, audits, logs, backlog, handoffs, decisions, and automation memory.

Revised MVP target to audit: GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active design source: Figma file `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.

Start every run by inspecting `git status --short --branch`. Required reads: `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, recent and weekly-relevant `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, all lane logs, `docs/rebuild-gameplan.md`, `docs/domain-model.md`, `docs/dashboard-ux-direction.md`, `docs/curriculum-framework-integration.md`, `data/capstone-framework.json`, `data/programs.json`, `docs/source-materials/`, Figma specs, Canva specs, app code, scripts, package/config files, tests, templates, styles, data files, and deployment/config files.

Audit scope: product direction; secure database/account/group/progress MVP; source-framework and program coverage; roles/permissions; Cloudflare auth/database/storage/deployment; private upload/evidence; workflow fidelity; first admin/progress slice; proposal slice; data model/schema; implementation quality; dashboards; Figma readiness; Canva usefulness; accessibility; privacy/compliance; automation health; log quality; backlog health; master-plan accuracy; weekly human check-in readiness.

Output: create/update `docs/audits/weekly-deep-audit.md` with severity-ranked findings, evidence, file references, impact, owner lane, acceptance checks, and next actions. Update backlog, master plan, memory, handoffs, decision log, `docs/progress/run-log.md`, `docs/progress/weekly-deep-audit.md`, and run manifest when materially needed.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise record `self-improvement: none`. Run `git diff --check`, validate touched JSON, run relevant checks, inspect `git status --short`, commit with prefix `audit:`, and push the current branch.
~~~~
