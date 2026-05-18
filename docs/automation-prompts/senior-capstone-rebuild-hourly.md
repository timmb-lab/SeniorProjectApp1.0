---
automation_id: "senior-capstone-rebuild-hourly"
name: "Senior Capstone Rebuild"
snapshot_generated_utc: "2026-05-18T04:06:08Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,5,9,13,17,21;BYMINUTE=0"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "df16088004b89cd4c86371b6c575d062b80210f9e2f1e0535f4cc21e9548347d"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-rebuild-hourly\automation.toml"
---

# Senior Capstone Rebuild

## Prompt

~~~~text
Lane: Senior Capstone Core Hosted-App Rebuild.

Schedule intent: hour 2 of the four-hour non-overlap rotation at 01:00, 05:00, 09:00, 13:00, 17:00, and 21:00. Do not change this schedule unless Bryan explicitly asks.

Connector/account policy:
- Active Figma product UI file for implementation reference: `Senior Capstone App - Product UI System Regenerated`, file key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`; Figma `whoami` most recently reported `timmb@nv.ccsd.net`.
- Superseded historical Figma file `fkfNI9JNy0A3Rm8KnoxJLj` is only context and should not be consumed as the active design source.
- Any Google Drive, Google Doc, or daily-summary destination must target `bryan.timm89@gmail.com` when connector permissions allow.
- If external design/artifact links from Figma or Canva are needed, consume only links/IDs recorded in repo specs/logs, `docs/artifacts.json`, or returned by tools during the run.

Non-negotiable product destination:
Build a real hosted Senior Capstone app, not a static guide, fake login screen, localStorage prototype, or documentation-only plan. The app must support secure users, roles, permissions, private upload/evidence spaces, student submissions, mentor/program-teacher review, revision requests, approvals, dashboards, admin controls, audit logs, exports, and protected student records.

Current P0 rebuild pressure:
- `SC-005` is the active P0 blocker until accepted or superseded: production stack, auth, database, private uploads, deployment, secrets, tests, and hosted-app foundation.
- `HD-2026-05-18-001` is the human decision queue item for this stack choice.
- `docs/architecture/adr-0001-stack-auth-database-upload.md` is the proposed default stack ADR.
- Do not spend broad rebuild runs on lower-priority feature work while this decision is open unless a higher emergency exists or the run is producing evidence needed to close this decision.

Required programs:
IT; Culinary; Hospitality & Marketing; Mechanical Technology; Construction; Sports Medicine; Teaching & Training; Early Childhood Education; Medical Professions.

Start-of-run reads, before selecting work:
1. Inspect `git status --short --branch` and current upstream. If clean and fast-forward sync is safe, sync before editing; if dirty, classify dirty files and do not overwrite unrelated work.
2. Read `docs/master-plan.md` and name the section your slice advances.
3. Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, and `docs/automation-milestones.md`.
4. Read `docs/automation-memory.md`, the most recent entries in `docs/progress/run-log.md`, `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, and `docs/progress/rebuild.md`.
5. Read `docs/human-decisions.md`, `docs/artifacts.json`, and `docs/automation-prompts/README.md` when the run touches stack decisions, external artifacts, or prompt/config self-improvement.
6. Read adjacent lane context from `docs/progress/figma.md`, `docs/progress/audit.md`, and `docs/progress/canva.md` when it affects the selected slice.
7. Read architecture/product anchors: `docs/rebuild-gameplan.md`, `docs/domain-model.md`, `docs/dashboard-ux-direction.md`, `data/programs.json`, `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`, relevant source-material excerpts in `docs/source-materials/`, and implementation-ready Figma/Canva specs including `docs/design/figma-first-pass-product-system.md`.

Source-of-truth order:
Current repo code/data and source materials; `docs/master-plan.md`; accepted decisions; P0/P1 backlog; open handoffs; `docs/automation-memory.md`; lane logs/run log/run manifests; older rollups.

Work selection priority:
1. `SC-005` / `HD-2026-05-18-001` stack/auth/database/private-upload decision until accepted, superseded, or precisely blocked.
2. Other P0/P1 rebuild-owned or rebuild-blocking backlog items.
3. Earliest incomplete milestone needing architecture, code, data, tests, or deployment work.
4. Open handoffs assigned to rebuild.
5. The previous rebuild next step.
6. The smallest useful vertical slice toward the first real app workflow.

Lane ownership:
Own the real implementation: app scaffold, package scripts, TypeScript/project structure, auth/provider decision, authorization, user/role/permission model, database/schema/migrations, private upload/evidence storage model, source-framework seed loader, submissions/reviews/approvals/status history/audit events, dashboard aggregates, tests, CI, deployment readiness, backups/exports, and environment/secrets posture. Consume Figma/Canva/content outputs instead of inventing visual direction from scratch.

First vertical slice priority:
Student proposal/research submission -> private evidence upload/link -> program teacher review -> revision request or approval -> status history -> audit event -> dashboard aggregate. Build toward this first once the stack/auth/database/private-upload foundation is accepted or scaffolded.

Security and data constraints:
- Do not store student records, submissions, approvals, evidence, staff notes, or private uploads in `localStorage`, public static assets, or unauthenticated client-only state as a final architecture.
- Permission tests must cover student-own access, assigned mentor access, program/cohort teacher access, admin access, misc-admin narrowing, and unauthorized denial whenever behavior changes.
- Sensitive transitions must create audit records.

Required output per productive run:
- One bounded implementation/architecture/test slice tied to a master-plan section.
- Production-facing code, schema, test, ADR/spec, or scaffold progress that makes the hosted app more real.
- Validation appropriate to the files changed.
- Handoff packets for design, content, or audit when another lane must act.
- A structured run manifest in `docs/progress/runs/`.
- Updates to `docs/artifacts.json` and `docs/human-decisions.md` when the run creates/uses durable artifacts or needs Bryan-level decisions.

Definition of done:
- Run relevant tests/checks. If tests do not exist yet, add or document the smallest appropriate verification and the next test foundation.
- Append a detailed entry to `docs/progress/rebuild.md` with timestamp, master-plan section, logs read, scope, files changed, validation, self-review, risks, and next action.
- Append one compact entry to `docs/progress/run-log.md`.
- Create one structured run manifest in `docs/progress/runs/`.
- Update `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-memory.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, and `docs/automation-progress.md` only when materially needed.

Self-improvement closeout:
- Re-read `docs/automation-self-improvement.md` during closeout.
- Compare this run against your own live automation prompt/config, recent rebuild logs, handoffs, blockers, tests, and structured manifests.
- If no prompt/config change is justified, log `self-improvement: none` in `docs/progress/rebuild.md` and the run manifest.
- If evidence shows your own prompt/config is missing a required read, has weak log/handoff/manifest instructions, causes repeated work, loses commit/push evidence, mishandles implementation blockers, or contradicts accepted docs, use `automation_update` to update only `senior-capstone-rebuild-hourly`.
- Preserve id, kind, name, schedule, workspace, model, reasoning effort, and ACTIVE status unless Bryan explicitly asked to change them.
- After any prompt/config change, run `scripts/snapshot-automation-prompts.ps1` and `scripts/check-automation-contract.ps1`, then commit the prompt snapshots.
- Do not edit other automations. Create a handoff instead.
- Log the evidence, what changed, and verification that the live prompt now contains the intended rule.

Git closeout:
- Inspect `git status --short` before staging.
- Stage only files changed by this run.
- If repo files changed, commit with prefix `rebuild:` and push the current branch.
- If push is rejected, attempt one safe fast-forward sync only after a successful commit and only if the post-commit worktree is clean; never force push.
- If commit/push/publication is blocked, commit and push a blocker log when possible, or clearly log why that could not happen.

Final response:
Summarize the bounded slice, files changed, validation, run manifest, self-improvement result, commit hash, push status, risks, and next handoff.
~~~~
