# Senior Capstone Automation Memory

Date initialized: 2026-05-18

This is the compact working memory for the long-running automation loop. Every automation should read this before selecting work and update it only when the current state materially changes.

Top-level product plan: `docs/master-plan.md`.

## Product Target

Build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a secure database-backed operating system for users, groups, roles, programs, cohorts, progress updates, private upload/evidence spaces, student submissions, mentor/teacher review, revision requests, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records.

This is not a static guide, brochure, or visual-only project.

Figma is the heavy product-design source for functional app screens, database-backed states, admin preview, dashboards, and mobile-aware patterns. Canva is the heavy supporting-image source for polished visuals with clear app placement and no baked-in private/live data. Version 2.0 may explore iOS/Android apps with push notifications and announcements, but no student-to-student messaging.

## Current State

- Repository still contains the original static guide shell.
- No production app scaffold has been committed yet.
- No managed auth, database, user/group model, private upload storage, migrations, API layer, tests, CI, or GitHub-to-Cloudflare deployment pipeline has been implemented yet.
- Source PDFs have been extracted and converted into app-native requirements in `data/capstone-framework.json`.
- The four main automation lanes are staggered hourly at `:00`, `:15`, `:30`, and `:45` and must commit/push their durable outputs.
- The four main automation lanes and the daily reporting automation now read the shared memory, run log, handoff ledger, and decision log before choosing work or summarizing progress.
- Every main lane prompt now requires a lane log entry, compact run-log entry, relevant memory/handoff/decision updates, verification, commit, and push.
- Every main lane and the daily reporting automation now reference `docs/master-plan.md` along with the logs.
- Daily automation summaries and the Google Drive/Doc target should use `bryan.timm89@gmail.com`.
- Every main lane and the daily reporting automation now use `docs/automation-self-improvement.md` to self-review, log whether prompt/config changes were needed, and update only their own live automation prompt/config when evidence justifies it.
- A weekly deep audit automation, `senior-capstone-weekly-deep-audit`, now runs Sundays at `23:30 PT` to produce a severe whole-system audit and feed durable findings into the master plan, memory, backlog, handoffs, decision log, and run logs.
- Automation operating infrastructure now includes prompt snapshots in `docs/automation-prompts/`, structured run manifests in `docs/progress/runs/`, human decisions in `docs/human-decisions.md`, external artifact registry in `docs/artifacts.json`, and contract scripts in `scripts/`.

## Current Priority

1. Resolve `SC-005` / `HD-2026-05-18-001`: choose and document the Cloudflare-compatible app stack/hosting/auth/database/private-upload architecture.
2. Scaffold the real app foundation with TypeScript, package scripts, tests, and GitHub-to-Cloudflare deployment structure.
3. Model users, groups, roles, permissions, programs, cohorts, requirements, progress records, submissions, evidence artifacts, reviews, approvals, announcements, and audit events.
4. Build the MVP admin/progress vertical slice: admin creates/imports users/groups/programs/cohorts -> role-aware progress update -> audit log -> dashboard aggregate -> Cloudflare preview.
5. Build the proposal workflow slice: student proposal submission -> evidence upload/link -> teacher review -> revision/approval -> audit log -> dashboard aggregate.

## Canonical Programs

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

## Active Backlog

See `docs/automation-backlog.md`.

Current backlog anchors:

- `SC-001`: framework seed loader and minimal requirement schema.
- `SC-002`: guided Research Proposal Challenge UI and review queue spec.
- `SC-003`: private EvidenceArtifact model and permission tests.
- `SC-004`: mentor meetings, presentation scheduling, celebration evidence, archive/export workflows.
- `SC-005`: P0 Cloudflare stack/auth/database/user-group/progress/private-upload decision and scaffold pressure.

## Known External Artifact Memory

- Canva folder: `FAHJ-n-VqFE`.
- Canva asset: `DAHJ-v7TOM8`, proposal approval process strip, no-text 1600x500, palette from `styles.css`.
- Next Canva priority: proposal dashboard empty-state family.
- Active Figma product UI file: `https://www.figma.com/design/LLucMgAPscRa9020iHHigB` (`LLucMgAPscRa9020iHHigB`). Regenerated after the Figma account update; canvas writing succeeded under authenticated account `timmb@nv.ccsd.net`.
- Active Figma repo spec: `docs/design/figma-first-pass-product-system.md`.
- Superseded Figma historical file: `https://www.figma.com/design/fkfNI9JNy0A3Rm8KnoxJLj` (`fkfNI9JNy0A3Rm8KnoxJLj`). File creation succeeded but canvas write was blocked by the prior Starter MCP tool-call limit.
- Canva first-pass folder: `FAHJ-8DxQyk`, `https://www.canva.com/folder/FAHJ-8DxQyk`.
- Canva first-pass workflow infographic: `DAHJ-3dKnPU`, edit `https://www.canva.com/d/C-dVNnTDKRODcKi`, view `https://www.canva.com/d/tfRo2Sq_1JHu0zu`.
- Canva first-pass visual-system report: `DAHJ-xaMuj8`, edit `https://www.canva.com/d/NXZGwxgXRKYnTPc`, view `https://www.canva.com/d/MA6S4b_xAC69y1C`.
- Canva first-pass program identity poster: `DAHJ-6LVuME`, edit `https://www.canva.com/d/J9nRXQPXi0O-_hM`, view `https://www.canva.com/d/2FoRYnzFDrZAHqc`.

## Decisions To Respect

Read `docs/progress/decision-log.md` for accepted or superseded decisions.

- As of this update, the deployment direction is GitHub-to-Cloudflare Workers/Pages; the exact Cloudflare-compatible auth/database/storage/security implementation is still open under `HD-2026-05-18-001`.
- `D-2026-05-18-001`: automations use the log-first scaling protocol.
- `D-2026-05-18-002`: `docs/master-plan.md` is the top-level product plan.
- `D-2026-05-18-003`: daily automation summaries and Google Drive/Doc target account use `bryan.timm89@gmail.com`.
- `D-2026-05-18-004`: automations may improve their own prompt/config from evidence using the guarded self-improvement protocol, while preserving schedule/workspace/model/status unless the user explicitly asks otherwise.
- `D-2026-05-18-005`: run a weekly deep audit automation to perform a long piece-by-piece whole-system review and feed findings back into the master plan and logs.
- `D-2026-05-18-007`: automations use prompt snapshots, structured run manifests, human decisions, artifact registry, and a contract checker as core operating infrastructure.
- `D-2026-05-18-008`: MVP 1.0 is a secure database/account/group/progress foundation hosted through GitHub to Cloudflare; Figma and Canva are heavy product/visual inputs; 2.0 may add iOS/Android notifications and announcements, with no student messaging.

## Handoff Rules

Read `docs/progress/handoffs.md` before selecting work. Close handoffs with evidence, not vibes.

Each new handoff should include:

- Stable handoff ID.
- Source lane.
- Owner lane.
- Status.
- Exact next action.
- Acceptance check.
- Evidence needed to close.

## Logging Rules

Every productive automation run should update:

- Its lane log in `docs/progress/`.
- `docs/progress/run-log.md`.
- A structured run manifest in `docs/progress/runs/`.
- Any changed handoff, decision, backlog, or memory file.
- `docs/artifacts.json` for durable external artifacts.
- `docs/human-decisions.md` for Bryan-level decisions.

Every run should end with a pushed commit or a committed blocker entry explaining why that could not happen.

Every run should also record `self-improvement: none` or a specific self-improvement change with evidence.
