# Automation Handoff Ledger

This file tracks cross-lane asks that should survive for future automation runs. Lane logs can contain narrative, but this ledger is the actionable queue.

After the 2026-05-20 split-cadence update, new handoffs should name the consuming builder lane (`non-figma` or `figma-only`) plus the functional owner from `docs/automation-cadence.md`: `source-framework-seed`, `drive-upload-oauth`, `protected-evidence-tests`, `teacher-review-endpoints`, `immutable-review-history`, `mentor-presentation-flow`, `admin-ops-endpoints`, `announcements`, `account-lifecycle`, `cloudflare-verification`, or `design-assets-handoff`. Legacy lane labels remain in historical entries.

Status values:

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Open Handoffs

### H-2026-05-20-005

- `source lane`: requirements-audit
- `owner lane`: deployment-qa
- `status`: open
- `source`: production surface classification and fencing pass
- `artifact`: `docs/production-deployment-policy.md`, `docs/production-surface-registry.md`, `docs/generated/production-route-inventory.md`, `docs/production-predeploy-checklist.md`, `scripts/check-production-surfaces.mjs`, `scripts/check-generated-output-drift.mjs`
- `next action`: When `CLOUDFLARE_API_TOKEN` is available, run live Cloudflare verification after the pushed commit and record whether `senior-capstone-app`, `senior-capstone-public`, and review-only option deploy targets match the documented production-surface policy.
- `acceptance check`: Live verification records current Pages projects, confirms canonical `senior-capstone-app` and `senior-capstone-public` intent, and does not claim alpha/account routes are pilot-ready.
- `evidence to close`: `check:cloudflare:live` or equivalent read-only Wrangler proof plus a run-log entry and updated production-surface report or follow-up note.
- `last updated`: 2026-05-20

### H-2026-05-20-006

- `source lane`: requirements-audit
- `owner lane`: requirements-audit
- `status`: open
- `source`: production surface classification, predeploy gate, and human decision queue
- `artifact`: `HD-2026-05-20-002`, `HD-2026-05-20-003`, `HD-2026-05-20-004`, `HD-2026-05-20-005`, `docs/alpha-account-deployment-decision.md`, `docs/stakeholder-option-lifecycle.md`, `docs/custom-domain-cutover-checklist.md`
- `next action`: After Bryan decides custom-domain mapping, pre-pilot alpha/account exposure, and stakeholder option retention, update the deployment policy, surface registry, public/stakeholder docs, and validation allowlists.
- `acceptance check`: The chosen production URL/domain and stakeholder option status are reflected in docs, scripts, checker policy, and route inventory with no ambiguous deploy targets.
- `evidence to close`: Accepted human-decision entries plus passing `check:production-surfaces`, `check:route-inventory`, and `check`.
- `last updated`: 2026-05-20

### H-2026-05-20-007

- `source lane`: requirements-audit
- `owner lane`: non-figma / requirements-audit and backend-security-data
- `status`: open
- `source`: P0 production app/website gate
- `artifact`: `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/production-surface-registry.md`, `docs/source-materials/production-content-crosswalk.md`, `scripts/check-production-surfaces.mjs`, `SC-007`
- `next action`: Broaden no-hidden-core-content coverage proof across every public guide route, align local fake `.test` credentials with local D1 state, then run credential-backed browser smoke for `workspace.html` login/session restore, role sections, evidence link, upload blocked state, and logout; verify hosted workspace login/upload once live secrets are available.
- `acceptance check`: Public website mode toggle stays visible with source-aligned Student/Teacher content; normal public nav stays free of alpha/account/internal QA links; canonical `workspace.html` route requires auth and chooses screens from D1-backed role/scope, with signed-in browser proof for every seeded role.
- `evidence to close`: Passing `check:production-surfaces`, `check:generated-output-drift`, `check`, `tests/workspace-app.test.mjs`, `tests/workspace-browser-smoke.test.mjs` against a local Pages dev target, route-level no-hidden-core-content evidence, credential-backed browser role/upload/logout proof, and live verification for hosted workspace auth/upload when Cloudflare/Drive secrets are available.
- `last updated`: 2026-05-20 15:09 PT

### H-2026-05-20-008

- `source lane`: requirements-audit
- `owner lane`: figma-only / design-assets-handoff
- `status`: open
- `source`: P0 production app/website gate
- `artifact`: `docs/master-plan.md`, `docs/source-materials/production-content-crosswalk.md`, `MVP-031` through `MVP-040`
- `next action`: Create or update Figma handoffs for the role-aware production app shell and the Student/Teacher public website modes, using route/data/permission/state annotations only.
- `acceptance check`: Figma handoff distinguishes app roles from public website guide modes, includes student/mentor/program-teacher/admin/misc-admin state variants, and does not treat stakeholder options as Student/Teacher guide modes.
- `evidence to close`: Verified Figma node IDs/screenshots/metadata and repo-local handoff notes that implementation can consume without broad visual-only polish.
- `last updated`: 2026-05-20 13:27 PT

### H-2026-05-18-001

- `source lane`: canva
- `owner lane`: design-assets-handoff
- `status`: open
- `source`: captured Canva memory from prior run
- `artifact`: Canva asset `DAHJ-v7TOM8` in folder `FAHJ-n-VqFE`
- `next action`: Create or specify the proposal dashboard empty-state family: no proposals yet, filtered out, waiting on review, and revision requested.
- `acceptance check`: Asset/spec includes placement, dimensions, alt text, live-text guidance, privacy notes, and handoff for Figma/rebuild.
- `evidence to close`: Canva link/ID or committed asset spec entry plus lane progress entry.
- `last updated`: 2026-05-18

### H-2026-05-18-004

- `source lane`: canva
- `owner lane`: design-assets-handoff
- `status`: open
- `source`: manual Canva first-pass kickoff
- `artifact`: Canva folder `FAHJ-8DxQyk`, specs `docs/visual-assets/canva-first-pass.md` and `docs/visual-assets/canva-asset-specs.md`
- `next action`: Refine the proposal dashboard empty-state family using the new workflow infographic and visual-system report.
- `acceptance check`: Empty-state family includes no proposals yet, filtered out, waiting on review, and revision requested states with app placement, dimensions, alt text, privacy notes, and live-text guidance.
- `evidence to close`: Canva design IDs or committed specs for the empty-state family plus lane progress entry.
- `last updated`: 2026-05-18

### H-2026-05-18-005

- `source lane`: figma
- `owner lane`: backend-security-data
- `status`: open
- `source`: regenerated Figma product UI system
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6` in `team::1638213362346160913`, reference-only prior file `LLucMgAPscRa9020iHHigB`, spec `docs/design/figma-first-pass-product-system.md`
- `next action`: After the Cloudflare stack/scaffold decision, map the active Figma screens to app routes/components/data fields for the revised MVP admin/progress slice and the proposal workflow slice.
- `acceptance check`: Rebuild plan or implementation references the active Figma frame IDs for student home, guided proposal form, evidence/review states, teacher review queue, mentor/admin dashboards, mobile student home, product preview state variants, and the 100-pass route/data contract.
- `evidence to close`: Committed implementation plan or code scaffold consuming `z4t4tFPAKrMDh6pIYOeEw6` and naming routes/components/data fields.
- `last updated`: 2026-05-18 09:06 PT

### H-2026-05-18-006

- `source lane`: ops
- `owner lane`: backend-security-data and deployment-qa
- `status`: in-progress
- `source`: automation operating-infrastructure pass plus revised MVP direction
- `artifact`: `SC-005`, `HD-2026-05-18-001`, `docs/architecture/adr-0001-stack-auth-database-upload.md`
- `next action`: Finish the scaffold by broadening auth/permission tests, adding server-side Drive upload credentials, implementing account provisioning/password-reset lifecycle, and implementing first admin/progress workflow endpoints.
- `acceptance check`: Tests cover hardened auth, student-own access, assigned mentor access, program/cohort teacher access, admin access, misc-admin narrowing, protected evidence access, unauthorized denial, valid status transitions, and audit events.
- `evidence to close`: Passing tests plus first vertical-slice endpoints that use the D1 schema and Google Drive evidence repository metadata without real student data. D1-backed alpha flow, state-machine tests, alpha framework/check/CI, deployment verification, first-admin bootstrap, fake role-account seeding, login proof, and admin-only seed endpoint guard evidence now exist; broader permission tests and Drive upload credentials remain before close.
- `last updated`: 2026-05-18 12:45 PT

### H-2026-05-18-008

- `source lane`: figma
- `owner lane`: student-workflow-evidence, staff-review-mentor, admin-ops-reporting, backend-security-data, and deployment-qa
- `status`: open
- `source`: professional-plan Figma verification and 100-pass MVP map
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, `03 Product Preview + State Variants` node `6:2`, `100-Pass MVP Execution Map` node `18:2`, route/data contract nodes `18:44` through `18:47`, review/override variants node `31:2`, developer handoff contract node `31:144`, private evidence/review-history contract node `37:2`, evidence handoff contract node `37:177`, MVP component variant matrix node `43:2`, status component set `43:55`, action component set `43:73`, evidence row component set `43:149`, shared UI contract `43:150`, admin account/group provisioning contract node `48:2`, admin provisioning handoff node `48:208`, mobile evidence/revision contract node `56:2`, mobile handoff node `56:114`, progress dashboard aggregate contract node `61:2`, progress dashboard aggregate handoff node `61:113`, audit log/export controls contract node `69:2`, audit export handoff node `69:180`, mentor meeting/presentation scheduling contract node `78:2`, mentor presentation handoff node `78:166`, full MVP alpha prototype page `98:2`, prototype frames `98:3` through `98:17`, and prototype map rail `98:1130`
- `next action`: Continue consuming the route/data/permission contract and page `98:2` by deepening the D1-backed alpha route into real workflow endpoints and shared `StatusPill`, `ActionButton`, `EvidenceArtifactRow`, `PermissionGate`, and `ReviewHistoryItem` primitives before hardening teacher review decisions, admin override paths, private evidence upload/link access checks, immutable review history, admin user/group/role/cohort provisioning, mobile student evidence/revision states, progress-update/dashboard-aggregate persistence, immutable audit-log filters, export-request authorization, signed archive downloads, meeting attendance, make-up linkage, outline approval gates, audited presentation check-out/check-in states, announcements without peer messaging, protected-record boundary checks, and mobile no-overflow behavior from nodes `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, and prototype frames `98:3` through `98:17`. Immediate review-history UI consumption is now present in both the account smoke path and the primary alpha console, and presentation slot records/conflict checks now exist; next rebuild work should either verify the hosted walkthrough after deploy or move to the next Day 7 gap: presentation check-out/check-in or admin workflow depth.
- `acceptance check`: Rebuild commits a stack/scaffold or implementation plan that maps `/student/progress`, `/api/progress-updates`, `/api/submissions/:id/status`, `/teacher/review`, `/teacher/dashboard`, `/mentor/assigned`, `/mentor/dashboard`, `/mentor/meetings`, `/api/meetings/:id/attendance`, `/student/mentor-meetings`, `/student/presentation`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-in`, `/admin/users`, `/admin/groups`, `/admin/programs`, `/admin/cohorts`, `/admin/dashboard`, `/admin/audit`, `/api/audit-events`, `/api/audit-events/:id`, `/admin/exports`, `/api/exports/student-archive`, `/api/exports/:id/download`, `/student/archive`, `/student/evidence`, `/student/submissions/:submissionId/revise`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, `/api/admin/users/import`, `/api/admin/role-assignments`, `/api/admin/mentor-assignments`, review decisions, admin overrides, evidence upload/link checks, review history, shared component variants, admin provisioning states, mobile revision/blocked-submit/access-denied states, progress/dashboard aggregate states, audit-event filters, export-request records, signed download expiry, meeting attendance, make-up requirements, outline approval, presentation slot records, check-out/check-in, and retention-policy controls to persisted data, server authorization, audit events, private-evidence guards, signed URL expiry, stable loading/disabled states, accessible text-plus-color status, duplicate import handling, narrow misc-admin scope, mobile no-overflow behavior, stale-write conflict handling, server-derived dashboard counts, no storage-key exposure, and loading/error/permission tests.
- `evidence to close`: Committed rebuild plan or code scaffold referencing `z4t4tFPAKrMDh6pIYOeEw6`, node `18:2`, node `31:2`, node `37:2`, node `43:2`, node `48:2`, node `56:2`, node `61:2`, node `69:2`, node `78:2`, and full prototype page `98:2`. First D1-backed alpha flow evidence now exists in `alpha.html`, `alpha.js`, `alpha.css`, `/api/alpha/state`, `functions/_lib/alpha-flow-model.js`, `tests/alpha-flow.test.mjs`, `docs/alpha-runbook.md`, `docs/alpha-week-framework.md`, `scripts/check-alpha-contract.mjs`, and CI workflows; production alpha, first-admin bootstrap, fake role-account login, and admin-only seed guard are verified; the review-history API now returns comments plus immutable submission version snapshots; `account.html`/`account.js` render those comments/version snapshots without exposing Drive storage IDs; and the primary alpha console now preserves/renders teacher comments, review decisions, status events, and version snapshots from server-owned alpha state with storage-identifier blocking. Figma verification on 2026-05-20 updated `98:9` and `98:10` so the prototype names `/api/reviews/:submissionId/history`, `reviews`, `comments`, `status_history`, `submission_versions`, scoped permissions, and storage-ID redaction; `get_design_context` and `get_screenshot` succeeded for both nodes after the correction. The 12:35 PT Figma pass updated and verified handoff node `98:17` with `review_history_consumed_at`, a primary alpha-console consumption note, and next rebuild focus on mentor/presentation/admin depth. The 13:06 PT non-Figma pass added `migrations/0006_presentation_slots.sql`, `/api/presentation-slots`, and `tests/presentation-slots.integration.test.mjs` for scoped presentation-slot visibility, admin/program-teacher scheduling, same-location conflict blocking, and audit events. Real workflow endpoints, shared primitives, Drive upload credentials, broader permission tests, presentation check-out/check-in, and implementation references to prototype frames `98:3` through `98:17` remain before close.
- `last updated`: 2026-05-20 13:06 PT

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
