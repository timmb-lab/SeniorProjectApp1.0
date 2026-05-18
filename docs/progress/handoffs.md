# Automation Handoff Ledger

This file tracks cross-lane asks that should survive for future automation runs. Lane logs can contain narrative, but this ledger is the actionable queue.

Status values:

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Open Handoffs

### H-2026-05-18-001

- `source lane`: canva
- `owner lane`: canva
- `status`: open
- `source`: captured Canva memory from prior run
- `artifact`: Canva asset `DAHJ-v7TOM8` in folder `FAHJ-n-VqFE`
- `next action`: Create or specify the proposal dashboard empty-state family: no proposals yet, filtered out, waiting on review, and revision requested.
- `acceptance check`: Asset/spec includes placement, dimensions, alt text, live-text guidance, privacy notes, and handoff for Figma/rebuild.
- `evidence to close`: Canva link/ID or committed asset spec entry plus lane progress entry.
- `last updated`: 2026-05-18

### H-2026-05-18-004

- `source lane`: canva
- `owner lane`: canva
- `status`: open
- `source`: manual Canva first-pass kickoff
- `artifact`: Canva folder `FAHJ-8DxQyk`, specs `docs/visual-assets/canva-first-pass.md` and `docs/visual-assets/canva-asset-specs.md`
- `next action`: Refine the proposal dashboard empty-state family using the new workflow infographic and visual-system report.
- `acceptance check`: Empty-state family includes no proposals yet, filtered out, waiting on review, and revision requested states with app placement, dimensions, alt text, privacy notes, and live-text guidance.
- `evidence to close`: Canva design IDs or committed specs for the empty-state family plus lane progress entry.
- `last updated`: 2026-05-18

### H-2026-05-18-005

- `source lane`: figma
- `owner lane`: rebuild
- `status`: open
- `source`: regenerated Figma product UI system
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6` in `team::1638213362346160913`, reference-only prior file `LLucMgAPscRa9020iHHigB`, spec `docs/design/figma-first-pass-product-system.md`
- `next action`: After the Cloudflare stack/scaffold decision, map the active Figma screens to app routes/components/data fields for the revised MVP admin/progress slice and the proposal workflow slice.
- `acceptance check`: Rebuild plan or implementation references the active Figma frame IDs for student home, guided proposal form, evidence/review states, teacher review queue, mentor/admin dashboards, mobile student home, product preview state variants, and the 100-pass route/data contract.
- `evidence to close`: Committed implementation plan or code scaffold consuming `z4t4tFPAKrMDh6pIYOeEw6` and naming routes/components/data fields.
- `last updated`: 2026-05-18 09:06 PT

### H-2026-05-18-006

- `source lane`: ops
- `owner lane`: rebuild
- `status`: in-progress
- `source`: automation operating-infrastructure pass plus revised MVP direction
- `artifact`: `SC-005`, `HD-2026-05-18-001`, `docs/architecture/adr-0001-stack-auth-database-upload.md`
- `next action`: Finish the scaffold by adding tests/CI, first-admin bootstrap, Drive root folder ID, server-side Drive upload credentials, and first admin/progress workflow endpoints.
- `acceptance check`: Tests cover hardened auth, student-own access, assigned mentor access, program/cohort teacher access, admin access, misc-admin narrowing, protected evidence access, unauthorized denial, valid status transitions, and audit events.
- `evidence to close`: Passing tests plus first vertical-slice endpoints that use the D1 schema and Google Drive evidence repository metadata without real student data.
- `last updated`: 2026-05-18 10:54 PT

### H-2026-05-18-008

- `source lane`: figma
- `owner lane`: rebuild
- `status`: open
- `source`: professional-plan Figma verification and 100-pass MVP map
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, `03 Product Preview + State Variants` node `6:2`, `100-Pass MVP Execution Map` node `18:2`, route/data contract nodes `18:44` through `18:47`, review/override variants node `31:2`, developer handoff contract node `31:144`, private evidence/review-history contract node `37:2`, evidence handoff contract node `37:177`, MVP component variant matrix node `43:2`, status component set `43:55`, action component set `43:73`, evidence row component set `43:149`, shared UI contract `43:150`, admin account/group provisioning contract node `48:2`, admin provisioning handoff node `48:208`, mobile evidence/revision contract node `56:2`, mobile handoff node `56:114`, progress dashboard aggregate contract node `61:2`, progress dashboard aggregate handoff node `61:113`, audit log/export controls contract node `69:2`, audit export handoff node `69:180`
- `next action`: Consume the route/data/permission contract while scaffolding the accepted Cloudflare database/auth/progress foundation, then implement shared `StatusPill`, `ActionButton`, `EvidenceArtifactRow`, `PermissionGate`, and `ReviewHistoryItem` primitives before wiring teacher review decisions, admin override paths, private evidence upload/link access checks, immutable review history, admin user/group/role/cohort provisioning, mobile student evidence/revision states, progress-update/dashboard-aggregate persistence, immutable audit-log filters, export-request authorization, signed archive downloads, and denied export/audit access states from nodes `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, and `69:2`.
- `acceptance check`: Rebuild commits a stack/scaffold or implementation plan that maps `/student/progress`, `/api/progress-updates`, `/api/submissions/:id/status`, `/teacher/review`, `/teacher/dashboard`, `/mentor/assigned`, `/mentor/dashboard`, `/admin/users`, `/admin/groups`, `/admin/programs`, `/admin/cohorts`, `/admin/dashboard`, `/admin/audit`, `/api/audit-events`, `/api/audit-events/:id`, `/admin/exports`, `/api/exports/student-archive`, `/api/exports/:id/download`, `/student/archive`, `/student/evidence`, `/student/submissions/:submissionId/revise`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, `/api/admin/users/import`, `/api/admin/role-assignments`, `/api/admin/mentor-assignments`, review decisions, admin overrides, evidence upload/link checks, review history, shared component variants, admin provisioning states, mobile revision/blocked-submit/access-denied states, progress/dashboard aggregate states, audit-event filters, export-request records, signed download expiry, and retention-policy controls to persisted data, server authorization, audit events, private-evidence guards, signed URL expiry, stable loading/disabled states, accessible text-plus-color status, duplicate import handling, narrow misc-admin scope, mobile no-overflow behavior, stale-write conflict handling, server-derived dashboard counts, no storage-key exposure, and loading/error/permission tests.
- `evidence to close`: Committed rebuild plan or code scaffold referencing `z4t4tFPAKrMDh6pIYOeEw6`, node `18:2`, node `31:2`, node `37:2`, node `43:2`, node `48:2`, node `56:2`, node `61:2`, and node `69:2`.
- `last updated`: 2026-05-18 11:03 PT

## Resolved Handoffs

### H-2026-05-18-002

- `source lane`: audit
- `owner lane`: rebuild
- `status`: resolved
- `source`: security/app-readiness discussion
- `artifact`: `SC-001` and `SC-003`
- `next action`: Closed by ADR-0001, `D-2026-05-18-019`, local scaffold, Cloudflare Pages project `senior-capstone-app`, D1 database `senior-capstone-db`, migration `0001_foundation`, and `docs/backend-setup.md`.
- `acceptance check`: Satisfied for the initial scaffold. Follow-on implementation continues under `H-2026-05-18-006`, `SC-003`, and `SC-005`.
- `evidence to close`: `docs/architecture/adr-0001-stack-auth-database-upload.md`, `docs/backend-setup.md`, `package.json`, `wrangler.jsonc`, `functions/`, `migrations/0001_foundation.sql`, and remote D1 table verification on 2026-05-18.
- `last updated`: 2026-05-18 10:54 PT

### H-2026-05-18-003

- `source lane`: figma
- `owner lane`: figma
- `status`: resolved
- `source`: manual Figma first-pass kickoff
- `artifact`: superseded Figma file `fkfNI9JNy0A3Rm8KnoxJLj`, then-active Figma file `LLucMgAPscRa9020iHHigB`, spec `docs/design/figma-first-pass-product-system.md`
- `next action`: Build the three-page Figma file when MCP quota allows: `00 Master Plan + Foundations`, `01 Components + App Screens`, `02 Automation Handoff`.
- `acceptance check`: Figma progress log includes page/frame IDs plus metadata or screenshot verification.
- `evidence to close`: `docs/progress/figma.md` records active file `LLucMgAPscRa9020iHHigB`, all three pages, key frame IDs, 9 components, metadata verification, and screenshot verification.
- `last updated`: 2026-05-18

### H-2026-05-18-007

- `source lane`: figma/rebuild
- `owner lane`: figma
- `status`: resolved
- `source`: local product preview upgrade and state-variant packet; active file recreation succeeded but final screenshot/metadata verification was initially blocked by the new team's Education-plan MCP quota
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, `03 Product Preview + State Variants` node `6:2`, review drawer `6:198`, admin override modal `6:219`, rebuild mapping `6:257`, and 100-pass MVP execution map `18:2`
- `next action`: Verify metadata and screenshots after Bryan upgraded Figma to the professional plan.
- `acceptance check`: Figma includes role-aware shell states, status pill variants, review drawer variants, permission denied, upload failure, submission locked, resubmission, empty queue, admin override states, desktop/mobile verification, and page/frame IDs in `docs/progress/figma.md`.
- `evidence to close`: `docs/progress/figma.md` records successful metadata, screenshots, library discovery, design-system search, read-only inspection, and write verification for node `18:2`.
- `last updated`: 2026-05-18 09:06 PT
