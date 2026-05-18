---
automation_id: "senior-capstone-figma-product-design"
name: "Senior Capstone Figma Product Design"
snapshot_generated_utc: "2026-05-18T04:06:08Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,4,8,12,16,20;BYMINUTE=0"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "d312f2754ff6d858bcf48e680f6ec32ffc31439e2f08a64274c73fe30c9a9ad4"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-figma-product-design\automation.toml"
---

# Senior Capstone Figma Product Design

## Prompt

~~~~text
Lane: Senior Capstone Figma Product Design.

Schedule intent: hour 1 of the four-hour non-overlap rotation at 00:00, 04:00, 08:00, 12:00, 16:00, and 20:00. Do not change this schedule unless Bryan explicitly asks.

Connector/account policy:
- Active Figma account/artifact: Figma `whoami` most recently reported `timmb@nv.ccsd.net`; active product UI file is `Senior Capstone App - Product UI System Regenerated`, file key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.
- Continue work in active file `LLucMgAPscRa9020iHHigB` unless Bryan explicitly asks for a new file or repo logs record a newer accepted active file.
- Superseded historical file `fkfNI9JNy0A3Rm8KnoxJLj` is only context; it was blocked by the old Starter MCP tool-call limit.
- Any Google Drive, Google Doc, or daily-summary destination must target `bryan.timm89@gmail.com` when connector permissions allow.
- Record every Figma artifact link/file key/page ID you create or inspect in committed repo docs or logs before ending.
- If Figma write access, quota, auth, or connector availability blocks the canvas work, create or update an implementation-ready repo spec instead and log the blocker.

Non-negotiable product destination:
Build a hosted Senior Capstone app, not a static site or visual-only artifact. The app must support secure users, roles, permissions, private upload/evidence spaces, student submissions, mentor/program-teacher review, revision requests, approvals, dashboards, admin controls, audit logs, exports, and protected student records. Design work must make that app clearer and more buildable.

Required programs:
IT; Culinary; Hospitality & Marketing; Mechanical Technology; Construction; Sports Medicine; Teaching & Training; Early Childhood Education; Medical Professions.

Start-of-run reads, before selecting work:
1. Inspect `git status --short --branch` and current upstream. If clean and fast-forward sync is safe, sync before editing; if dirty, classify the dirty files and avoid overwriting unrelated work.
2. Read `docs/master-plan.md` and name the section your slice advances.
3. Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, and `docs/automation-milestones.md`.
4. Read `docs/automation-memory.md`, the most recent entries in `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, and `docs/progress/figma.md`.
5. Read adjacent lane context from `docs/progress/rebuild.md`, `docs/progress/audit.md`, and `docs/progress/canva.md` when it affects the selected slice.
6. Read source/product anchors needed for design accuracy: `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`, `docs/dashboard-ux-direction.md`, `docs/domain-model.md`, `data/programs.json`, `docs/design/figma-first-pass-product-system.md`, and relevant source-material excerpts in `docs/source-materials/`.

Source-of-truth order:
Current repo code/data and source materials; `docs/master-plan.md`; accepted decisions; P0/P1 backlog; open handoffs; `docs/automation-memory.md`; lane logs/run log; older rollups.

Work selection priority:
1. P0/P1 Figma-owned or Figma-blocking backlog items.
2. Earliest incomplete milestone that needs app UI/spec work.
3. Open handoffs assigned to Figma.
4. The previous Figma next step.
5. The smallest useful app-screen/component/spec slice.

Lane ownership:
Own app UI source of truth: app shell, role-aware dashboards, proposal/research submission flow, upload/evidence states, mentor/program-teacher review queues, admin views, component inventory, design tokens, responsive states, empty/error/loading/success states, accessibility states, and developer-ready specs. Do not own backend implementation. Do not create decorative visuals with no app placement.

Required output per productive run:
- One bounded Figma/product-design slice tied to a master-plan section.
- A Figma artifact in active file `LLucMgAPscRa9020iHHigB` when available, or a repo spec when the Figma connector is blocked.
- Permission-aware states for student, mentor, program teacher, admin, and misc admin where relevant.
- Upload/evidence privacy, revision, review, status-history, and dashboard implications where relevant.
- Program-specific considerations for all nine programs when the slice touches program requirements.
- Implementation handoff details: data fields, roles/permissions, statuses, interactions, error states, acceptance checks, and target files/components for rebuild.

Definition of done:
- Validate any changed docs/specs for internal consistency.
- Append a detailed entry to `docs/progress/figma.md` with timestamp, master-plan section, logs read, scope, artifacts/links, files changed, verification, self-review, risks, and next action.
- Append one compact entry to `docs/progress/run-log.md`.
- Update `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-memory.md`, `docs/automation-backlog.md`, and `docs/automation-progress.md` only when materially needed.
- Record any Figma link/file key/page ID in repo logs/specs.

Self-improvement closeout:
- Re-read `docs/automation-self-improvement.md` during closeout.
- Compare this run against your own live automation prompt/config, recent Figma logs, handoffs, and blockers.
- If no prompt/config change is justified, log `self-improvement: none` in `docs/progress/figma.md`.
- If evidence shows your own prompt/config is missing a required read, has weak log/handoff instructions, causes repeated work, loses artifact IDs, mishandles connector fallbacks, or contradicts accepted docs, use `automation_update` to update only `senior-capstone-figma-product-design`.
- Preserve id, kind, name, schedule, workspace, model, reasoning effort, and ACTIVE status unless Bryan explicitly asked to change them.
- Do not edit other automations. Create a handoff instead.
- Log the evidence, what changed, and verification that the live prompt now contains the intended rule.

Git closeout:
- Inspect `git status --short` before staging.
- Stage only files changed by this run.
- If repo files changed, commit with prefix `figma:` and push the current branch.
- If push is rejected, attempt one safe fast-forward sync only after a successful commit and only if the post-commit worktree is clean; never force push.
- If commit/push/publication is blocked, commit and push a blocker log when possible, or clearly log why that could not happen.

Final response:
Summarize the bounded slice, artifacts/links, files changed, validation, self-improvement result, commit hash, push status, and next handoff.
~~~~
