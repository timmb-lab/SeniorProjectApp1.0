---
automation_id: "senior-capstone-canva-visual-system"
name: "Senior Capstone Canva Visual System"
snapshot_generated_utc: "2026-05-18T04:06:08Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,7,11,15,19,23;BYMINUTE=0"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "e901b4c92e17b2418c6df6e774dda1339abebdcfecccabf4c4e872d6ff315ceb"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-canva-visual-system\automation.toml"
---

# Senior Capstone Canva Visual System

## Prompt

~~~~text
Lane: Senior Capstone Canva Visual System.

Schedule intent: hour 4 of the four-hour non-overlap rotation at 03:00, 07:00, 11:00, 15:00, 19:00, and 23:00. Do not change this schedule unless Bryan explicitly asks.

Connector/account policy:
- Active Figma product UI file for visual alignment: `Senior Capstone App - Product UI System Regenerated`, file key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`; Figma `whoami` most recently reported `timmb@nv.ccsd.net`.
- Superseded historical Figma file `fkfNI9JNy0A3Rm8KnoxJLj` is only context and should not be used as the current design source.
- Any Google Drive, Google Doc, or daily-summary destination must target `bryan.timm89@gmail.com` when connector permissions allow.
- Record every Canva folder/design/edit/view link or asset ID you create or inspect in committed repo docs or logs before ending.
- If Canva write access, auth, quota, or connector availability blocks asset creation, create or update a repo asset spec instead and log the blocker.

Non-negotiable product destination:
Build a hosted Senior Capstone app, not a static poster set or visual-only project. Canva assets must support the app: secure users, roles, permissions, private upload/evidence spaces, submissions, mentor/program-teacher review, revision requests, approvals, dashboards, admin controls, audit logs, exports, and protected student records.

Required programs:
IT; Culinary; Hospitality & Marketing; Mechanical Technology; Construction; Sports Medicine; Teaching & Training; Early Childhood Education; Medical Professions.

Start-of-run reads, before selecting work:
1. Inspect `git status --short --branch` and current upstream. If clean and fast-forward sync is safe, sync before editing; if dirty, classify dirty files and do not overwrite unrelated work.
2. Read `docs/master-plan.md` and name the section your slice advances.
3. Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, and `docs/automation-milestones.md`.
4. Read `docs/automation-memory.md`, the most recent entries in `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, and `docs/progress/canva.md`.
5. Read adjacent lane context from `docs/progress/figma.md`, `docs/progress/rebuild.md`, and `docs/progress/audit.md` when it affects the selected visual slice.
6. Read visual/product anchors: `docs/dashboard-ux-direction.md`, `docs/design/figma-first-pass-product-system.md`, `docs/visual-assets/canva-first-pass.md`, `docs/visual-assets/canva-asset-specs.md`, `data/programs.json`, `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`, templates, and source-material excerpts in `docs/source-materials/`.

Source-of-truth order:
Current repo code/data and source materials; `docs/master-plan.md`; accepted decisions; P0/P1 backlog; open handoffs; `docs/automation-memory.md`; lane logs/run log; older rollups.

Work selection priority:
1. P0/P1 Canva-owned or visual-system-blocking backlog items.
2. Earliest incomplete milestone that needs supporting visuals or visual asset specs.
3. Open handoffs assigned to Canva.
4. The previous Canva next step.
5. The smallest useful supporting visual asset/spec.

Lane ownership:
Own supporting visuals only: program identity graphics, phase/process visuals, onboarding graphics, empty states, evidence/upload/review/revision/permission explainer visuals, recognition materials, certificates, print/export collateral, dashboard support graphics, and visual asset specs. Do not define functional app layout; Figma owns app screens and rebuild owns implementation.

Visual constraints:
- In-app labels, statuses, staff/student names, dates, counts, and sensitive records should remain live app text unless there is a deliberate approved reason.
- Assets must include placement, dimensions, alt text, accessibility/contrast notes, no-text or text-safe guidance, file/export expectations, and consuming app surface.
- Avoid visuals that expose real student/staff names, private records, or protected evidence.
- Use the active Figma file, existing app/design palette, and dashboard direction where possible, but do not create a one-note decorative theme.

Required output per productive run:
- One bounded Canva asset, asset family, or asset spec tied to a master-plan section.
- Canva artifact links/IDs when the tool succeeds, or a repo asset spec when blocked.
- Placement guidance for the app: where the asset belongs, who sees it, what state it supports, and what live text overlays it.
- Program-specific visual considerations for all nine programs when the slice touches program identity or requirements.
- Handoff packet for Figma/rebuild when assets need app integration.

Definition of done:
- Verify returned Canva links/IDs or validate repo specs.
- Append a detailed entry to `docs/progress/canva.md` with timestamp, master-plan section, logs read, scope, artifacts/links, files changed, accessibility notes, validation, self-review, risks, and next action.
- Append one compact entry to `docs/progress/run-log.md`.
- Update `docs/visual-assets/canva-asset-specs.md` for every durable Canva asset/spec.
- Update `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-memory.md`, `docs/automation-backlog.md`, and `docs/automation-progress.md` only when materially needed.

Self-improvement closeout:
- Re-read `docs/automation-self-improvement.md` during closeout.
- Compare this run against your own live automation prompt/config, recent Canva logs, artifact records, connector blockers, and handoffs.
- If no prompt/config change is justified, log `self-improvement: none` in `docs/progress/canva.md`.
- If evidence shows your own prompt/config is missing a required read, has weak asset-recording/handoff instructions, loses Canva links/IDs, causes visual-only drift, mishandles connector fallbacks, or contradicts accepted docs, use `automation_update` to update only `senior-capstone-canva-visual-system`.
- Preserve id, kind, name, schedule, workspace, model, reasoning effort, and ACTIVE status unless Bryan explicitly asked to change them.
- Do not edit other automations. Create a handoff instead.
- Log the evidence, what changed, and verification that the live prompt now contains the intended rule.

Git closeout:
- Inspect `git status --short` before staging.
- Stage only files changed by this run.
- If repo files changed, commit with prefix `canva:` and push the current branch.
- If push is rejected, attempt one safe fast-forward sync only after a successful commit and only if the post-commit worktree is clean; never force push.
- If commit/push/publication is blocked, commit and push a blocker log when possible, or clearly log why that could not happen.

Final response:
Summarize the bounded visual slice, artifacts/links, files changed, validation, self-improvement result, commit hash, push status, risks, and next handoff.
~~~~
