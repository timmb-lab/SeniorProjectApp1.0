---
automation_id: "senior-capstone-figma-product-design"
name: "Senior Capstone Figma Product Design"
snapshot_generated_utc: "2026-05-18T06:32:17Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23;BYMINUTE=15"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "27b7bf906ff0901912c36655a96f0ba2ed3c5d5397e1238b87842e27604d6707"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-figma-product-design\automation.toml"
---

# Senior Capstone Figma Product Design

## Prompt

~~~~text
Lane: Senior Capstone Figma Product Design.

Schedule intent: hourly non-overlap slot at :15 every hour for the Senior Capstone core automation cadence. This is the Figma/admin-preview design driver for getting a basic preview-ready product UI spun up later this week. Do not change this schedule unless Bryan explicitly asks.

Connector/account policy:
- Active Figma account/artifact: Figma `whoami` most recently reported `timmb@nv.ccsd.net`; active product UI file is `Senior Capstone App - Product UI System Regenerated`, file key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`.
- Continue work in active file `LLucMgAPscRa9020iHHigB` unless Bryan explicitly asks for a new file or repo logs record a newer accepted active file.
- Superseded historical file `fkfNI9JNy0A3Rm8KnoxJLj` is only context; it was blocked by the old Starter MCP tool-call limit.
- Any Google Drive, Google Doc, or daily-summary destination must target `bryan.timm89@gmail.com` when connector permissions allow.
- Record every Figma artifact link/file key/page ID you create or inspect in committed repo docs or logs before ending.
- If Figma write access, quota, auth, or connector availability blocks the canvas work, create or update an implementation-ready repo spec instead and log the blocker.

Non-negotiable product destination:
Build a hosted Senior Capstone app, not a static site or visual-only artifact. The app must support secure users, groups, roles, permissions, progress updates, private upload/evidence spaces, student submissions, mentor/program-teacher review, revision requests, approvals, announcements, dashboards, admin controls, audit logs, exports, and protected student records. Design work must make the secure database-backed app clearer and more buildable.

Revised MVP target:
MVP 1.0 is a fully functional, security-focused, database-backed Senior Capstone app. Users, groups, roles, program/cohort assignments, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records must persist in trusted server/database state before polish is counted as product progress.
Deployment target: GitHub-connected Cloudflare Workers/Pages, with Cloudflare-managed environments and a future Bryan-purchased custom domain.
Figma is a heavy product-design source for functional UI, role-aware screens, database-backed states, admin preview, responsive/mobile-aware patterns, and implementation-ready specs.
Canva is a heavy supporting-visual source for stunning app images, onboarding, empty states, announcements, recognition, and program/phase visuals, but it must not bake important live text, statuses, student data, or private records into images.
2.0 horizon: future iOS and Android apps may add push notifications and an announcement section for seniors/staff. Do not add student-to-student messaging, chat, or social feeds.

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
2. Admin-preview readiness gaps for users, groups, role assignment, progress updates, database-backed dashboards, and Cloudflare-hosted preview flows that can make the UI feel real sooner without faking backend guarantees.
3. Earliest incomplete milestone that needs app UI/spec work.
4. Open handoffs assigned to Figma.
5. The previous Figma next step.
6. The smallest useful app-screen/component/spec slice.

Lane ownership:
Own app UI source of truth: app shell, role-aware dashboards, admin account/group/progress management, proposal/research submission flow, upload/evidence states, mentor/program-teacher review queues, announcement surfaces, component inventory, design tokens, responsive/mobile-aware states, empty/error/loading/success states, accessibility states, and developer-ready specs. Do not own backend implementation. Do not create decorative visuals with no app placement.

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
