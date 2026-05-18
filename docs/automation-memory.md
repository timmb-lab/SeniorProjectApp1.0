# Senior Capstone Automation Memory

Date initialized: 2026-05-18

This is the compact working memory for the long-running automation loop. Every automation should read this before selecting work and update it only when the current state materially changes.

Top-level product plan: `docs/master-plan.md`.

## Product Target

Build a hosted Senior Capstone app with secure accounts, role-based permissions, private upload/evidence spaces, student submissions, mentor/teacher review, revision requests, approvals, dashboards, admin controls, audit logs, exports, and protected student records.

This is not a static guide, brochure, or visual-only project.

## Current State

- Repository still contains the original static guide shell.
- No production app scaffold has been committed yet.
- No managed auth, database, private upload storage, migrations, API layer, tests, CI, or deployment pipeline has been implemented yet.
- Source PDFs have been extracted and converted into app-native requirements in `data/capstone-framework.json`.
- The four main automation lanes are staggered in a four-hour rotation and must commit/push their durable outputs.
- The four main automation lanes and the daily reporting automation now read the shared memory, run log, handoff ledger, and decision log before choosing work or summarizing progress.
- Every main lane prompt now requires a lane log entry, compact run-log entry, relevant memory/handoff/decision updates, verification, commit, and push.
- Every main lane and the daily reporting automation now reference `docs/master-plan.md` along with the logs.
- Daily automation summaries and the Google Drive/Doc target should use `bryan.timm89@gmail.com`.
- Every main lane and the daily reporting automation now use `docs/automation-self-improvement.md` to self-review, log whether prompt/config changes were needed, and update only their own live automation prompt/config when evidence justifies it.

## Current Priority

1. Choose and document the app stack/hosting/auth/database/storage architecture.
2. Scaffold the real app foundation with TypeScript, package scripts, tests, and a protected app structure.
3. Model users, roles, permissions, programs, requirements, submissions, evidence artifacts, reviews, approvals, and audit events.
4. Build the first vertical slice: student proposal submission -> evidence upload/link -> teacher review -> revision/approval -> audit log -> dashboard aggregate.

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

Current P1 anchors:

- `SC-001`: framework seed loader and minimal requirement schema.
- `SC-002`: guided Research Proposal Challenge UI and review queue spec.
- `SC-003`: private EvidenceArtifact model and permission tests.
- `SC-004`: mentor meetings, presentation scheduling, celebration evidence, archive/export workflows.

## Known External Artifact Memory

- Canva folder: `FAHJ-n-VqFE`.
- Canva asset: `DAHJ-v7TOM8`, proposal approval process strip, no-text 1600x500, palette from `styles.css`.
- Next Canva priority: proposal dashboard empty-state family.
- Figma first-pass file: `https://www.figma.com/design/fkfNI9JNy0A3Rm8KnoxJLj` (`fkfNI9JNy0A3Rm8KnoxJLj`). File creation succeeded; canvas write was blocked by Figma Starter MCP tool-call limit.
- Figma first-pass repo spec: `docs/design/figma-first-pass-product-system.md`.
- Canva first-pass folder: `FAHJ-8DxQyk`, `https://www.canva.com/folder/FAHJ-8DxQyk`.
- Canva first-pass workflow infographic: `DAHJ-3dKnPU`, edit `https://www.canva.com/d/C-dVNnTDKRODcKi`, view `https://www.canva.com/d/tfRo2Sq_1JHu0zu`.
- Canva first-pass visual-system report: `DAHJ-xaMuj8`, edit `https://www.canva.com/d/NXZGwxgXRKYnTPc`, view `https://www.canva.com/d/MA6S4b_xAC69y1C`.
- Canva first-pass program identity poster: `DAHJ-6LVuME`, edit `https://www.canva.com/d/J9nRXQPXi0O-_hM`, view `https://www.canva.com/d/2FoRYnzFDrZAHqc`.

## Decisions To Respect

Read `docs/progress/decision-log.md` for accepted or superseded decisions.

- As of initialization, no final app stack has been accepted in-repo.
- `D-2026-05-18-001`: automations use the log-first scaling protocol.
- `D-2026-05-18-002`: `docs/master-plan.md` is the top-level product plan.
- `D-2026-05-18-003`: daily automation summaries and Google Drive/Doc target account use `bryan.timm89@gmail.com`.
- `D-2026-05-18-004`: automations may improve their own prompt/config from evidence using the guarded self-improvement protocol, while preserving schedule/workspace/model/status unless the user explicitly asks otherwise.

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
- Any changed handoff, decision, backlog, or memory file.

Every run should end with a pushed commit or a committed blocker entry explaining why that could not happen.

Every run should also record `self-improvement: none` or a specific self-improvement change with evidence.
