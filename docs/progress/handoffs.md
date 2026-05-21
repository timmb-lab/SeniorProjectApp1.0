# Automation Handoff Ledger

This file tracks cross-lane asks that should survive for future automation runs. Lane logs can contain narrative, but this ledger is the actionable queue.

After the 2026-05-20 split-cadence update, new handoffs should name the consuming builder lane (`non-figma` or `figma-only`) plus the functional owner from `docs/automation-cadence.md`: `source-framework-seed`, `drive-upload-oauth`, `protected-evidence-tests`, `teacher-review-endpoints`, `immutable-review-history`, `mentor-presentation-flow`, `admin-ops-endpoints`, `announcements`, `account-lifecycle`, `cloudflare-verification`, or `design-assets-handoff`. Legacy lane labels remain in historical entries.

Status values:

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Open Handoffs

### H-2026-05-21-001

- `source lane`: figma-only / design-assets-handoff
- `owner lane`: non-figma / account-lifecycle and backend-security-data
- `status`: open
- `source`: MVP-028 credential lifecycle handoff
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, page `05 Full MVP Alpha Prototype`, node `153:2` (`Prototype / 21 / Credential lifecycle handoff`), shared plugin data key `senior_capstone/credential_lifecycle_contract_2026_05_21`, and repo notes in `docs/progress/figma.md`.
- `next action`: Consume node `153:2` when finishing invitation/import, generated or temporary credential policy, hosted reset-panel proof, signed-in password-change proof, admin reset-required initiation proof, stale-session fallback proof, and redacted audit coverage.
- `acceptance check`: Credential lifecycle blockers stay distinct from role-pending, no-assignment, and section-denied workspace states; reset-required users do not enter role dashboards first; admin reset requires reason and cannot target self; password changes require current password and never log secrets; successful credential rotation closes stale sessions; denied attempts write redacted audit events; fake `.test` accounts are used for proof.
- `evidence to close`: Passing auth/admin reset/workspace browser tests plus hosted marker or browser proof for reset completion, active-user password change, admin reset initiation, stale-session fallback, invalid-current denial, and weak/reused-password guidance; no passwords, temporary credentials, or real student records appear in docs, Figma, screenshots, logs, or chat.
- `last updated`: 2026-05-21 00:22 PT

### H-2026-05-20-005

- `source lane`: requirements-audit
- `owner lane`: deployment-qa
- `status`: resolved
- `source`: production surface classification and fencing pass
- `artifact`: `docs/production-deployment-policy.md`, `docs/production-surface-registry.md`, `docs/generated/production-route-inventory.md`, `docs/production-predeploy-checklist.md`, `scripts/check-production-surfaces.mjs`, `scripts/check-generated-output-drift.mjs`
- `next action`: Closed for the canonical app/D1 blocker by the 2026-05-20 PT live run. Future custom-domain or sibling Pages project verification belongs under the custom-domain/stakeholder lifecycle decisions.
- `acceptance check`: Satisfied for `senior-capstone-app`: token verify, Pages project lookup, D1 database lookup, and D1 id match passed; `wrangler whoami` warning was scoped-token-only and non-blocking.
- `evidence to close`: `npm run check:cloudflare`, `npm run check:cloudflare:live`, D1 remote migration apply/list/schema probes, and run-log entry `2026-05-20 23:11 PT - Cloudflare/D1 Resolved, Drive Live Classified`.
- `last updated`: 2026-05-20 23:11 PT

### H-2026-05-20-012

- `source lane`: manual Codex live-readiness bridge
- `owner lane`: non-figma / drive-upload-oauth, account-lifecycle, and protected-evidence-tests
- `status`: blocked
- `source`: `npm run check:drive:live`
- `artifact`: `scripts/check-google-drive-live.mjs`, `docs/progress/runs/2026-05-20-2311-drive-live-cloudflare-cleanup.json`
- `next action`: Root/index visibility is fixed by the corrected sandbox IDs. Resolve the remaining Drive upload HTTP 403 for the configured service account, then rerun `npm run check:drive:live`.
- `acceptance check`: Drive live check passes with fake `.test` login, token exchange, root folder MIME proof, index sheet MIME proof, fake upload success, remote D1 evidence/audit proof without selecting raw Drive IDs, and browser/API leakage checks.
- `evidence to close`: Passing `npm run check:drive:live`; then move to account lifecycle/import/reset/role management and authorized download path hardening.
- `last updated`: 2026-05-20 23:36 PT

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
- `next action`: Broaden no-hidden-core-content coverage proof across every public guide route, then complete live Drive upload/download once the Drive upload HTTP 403 is resolved. The non-Figma lane has now consumed Figma node `133:2` for local session-expired, disabled-account, reset-required, role-pending, permission-denied, and no-active-assignment workspace states; remaining workspace proof is hosted post-deploy account-state/no-assignment markers plus a live section-level permission-denied browser state.
- `acceptance check`: Public website mode toggle stays visible with source-aligned Student/Teacher content; normal public nav stays free of alpha/account/internal QA links; canonical `workspace.html` route requires auth and chooses screens from D1-backed role/scope, with credential-backed proof for local student login/session/evidence/upload-block/logout, local role routes, no-role role-pending UI, unassigned mentor no-assignment UI, source-executed disabled/reset/session/permission-denied UI, and direct live signed-out/signed-in workspace proof. Live Drive upload/download remains required before pilot uploads.
- `evidence to close`: Passing `check:production-surfaces`, `check:generated-output-drift`, `check`, `tests/workspace-app.test.mjs`, credential-backed `tests/workspace-browser-smoke.test.mjs` against local Pages dev, in-app browser signed-in workspace/evidence/logout proof, in-app browser no-role role-pending proof, in-app browser unassigned mentor no-assignment proof, direct live signed-out/signed-in workspace proof, hosted post-deploy account-state marker proof, live section-level permission-denied proof, and live Drive upload/download after Cloudflare Drive secrets are configured.
- `last updated`: 2026-05-20 18:10 PT

### H-2026-05-20-009

- `source lane`: figma-only / design-assets-handoff
- `owner lane`: non-figma / admin-ops-reporting, staff-review-mentor, and student-workflow-evidence
- `status`: in-progress
- `source`: MVP-028 celebration archive readiness handoff
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, page `05 Full MVP Alpha Prototype`, node `144:2` (`Prototype / 18 / Celebration archive readiness handoff`), shared plugin data key `senior_capstone/celebration_archive_readiness_contract_2026_05_20`, and repo notes in `docs/progress/figma.md`.
- `next action`: Remote migration `0007_archive_export_artifacts.sql` is applied/recorded. Capture hosted fake-account proof for the Drive-backed archive package upload/app-scoped download path after the Drive upload HTTP 403 is fixed; decide whether a separate signed Drive-link delivery is needed beyond scoped app downloads.
- `acceptance check`: Canonical workspace or admin/export UI derives archive readiness from persisted progress, evidence, export, and audit rows; students can access only their own archive; admin export requires reason/scope; misc-admin student-record access is denied unless an explicit future student scope is implemented; expired/download/denied/provider-unavailable paths are audited and never expose Drive storage IDs.
- `evidence to close`: Hosted fake-account proof for Drive-backed package upload/app-scoped download markers after the upload 403 is fixed. First consumption slice landed previously: `/api/student/archive/readiness`, workspace Archive tab, explicit admin archive reason, truthful signed-download disabled state, `tests/archive-readiness.integration.test.mjs`, workspace tests/smoke, and in-app browser student Archive tab proof. The 2026-05-20 21:10 PT non-Figma slice added `export_artifacts`, scoped JSON archive manifest generation, authenticated manifest download, expired-package retry, workspace manifest link markers, and focused integration/source/workspace tests. The 2026-05-20 21:17 PT Figma slice added node `149:2` with provider-unavailable, signed-link, remote migration, and retention-policy route/data/permission states. The 2026-05-20 21:38 PT non-Figma slice partially consumed node `149:2` by provider-gating archive generation, auditing failed provider states, adding configurable retention metadata, and rendering workspace retention state. The 2026-05-20 22:09 PT non-Figma slice partially consumed node `151:2` by uploading redacted manifest JSON into Drive after provider probes, storing Drive file IDs only server-side, and exposing only Drive-package-ready markers/headers. The 2026-05-20 23:36 PT live check proved root/index visibility is fixed and the remaining Drive blocker is upload HTTP 403.
- `last updated`: 2026-05-20 23:11 PT

### H-2026-05-20-010

- `source lane`: figma-only / design-assets-handoff
- `owner lane`: non-figma / admin-ops-reporting, deployment-qa, and student-workflow-evidence
- `status`: in-progress
- `source`: MVP-028 archive provider and retention handoff
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, page `05 Full MVP Alpha Prototype`, node `149:2` (`Prototype / 19 / Archive provider and retention handoff`), shared plugin data key `senior_capstone/archive_provider_retention_contract_2026_05_20`, and repo notes in `docs/progress/figma.md`.
- `next action`: Remote migrations `0007` and `0008` are applied/recorded. Capture hosted archive UI/API proof after the Drive upload HTTP 403 is fixed, and decide whether signed Drive links are required beyond the scoped app download endpoint.
- `acceptance check`: Missing Drive credentials never render as successful package delivery; provider failures keep the original export reason/scope and write audit events; signed/scoped downloads include expiry and retry affordance; expired-package and denied paths are audited; retention values stay configurable until school policy is confirmed; no Drive storage IDs, stack traces, or fake account shortcuts render.
- `evidence to close`: Hosted/fake-account proof for Drive-backed archive package upload or a future signed-link decision. Partial consumption now exists: `/api/admin/exports/student-archive` verifies Drive provider readiness before success, writes failed exports plus `student_archive_export_provider_unavailable` for missing credentials or Drive access failures, archive manifests include configurable retention metadata, `/api/student/archive/readiness` reports provider/retention/download-expiring state, `workspace.js` renders `data-archive-retention-status`, and the 22:09 PT repo path uploads the redacted manifest JSON to Drive before completing the export. Focused archive/workspace/source/type checks passed.
- `last updated`: 2026-05-20 23:11 PT

### H-2026-05-20-011

- `source lane`: figma-only / design-assets-handoff
- `owner lane`: non-figma / admin-ops-reporting, deployment-qa, and student-workflow-evidence
- `status`: in-progress
- `source`: MVP-028 Drive archive delivery handoff
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, page `05 Full MVP Alpha Prototype`, node `151:2` (`Prototype / 20 / Drive archive delivery handoff`), shared plugin data key `senior_capstone/drive_archive_delivery_contract_2026_05_20`, and repo notes in `docs/progress/figma.md`.
- `next action`: After the Drive upload HTTP 403 is fixed, capture hosted fake-account proof for admin archive generation, Drive package upload markers, student archive download states, expired retry, and permission denial, then decide whether a separate signed Drive-link flow is needed.
- `acceptance check`: Drive credential probe passes before package success; remote D1 `export_artifacts` exists before hosted package success; generated package or signed link has `expires_at`, content hash/package id, and student scope without raw Drive IDs; download, expired, denied, missing artifact, and retry paths write audit events; retention values stay configurable until Bryan confirms school policy.
- `evidence to close`: Hosted fake `.test` proof for admin queue, Drive package upload, student archive card, scoped download, expired retry, and permission denial using node `151:2` as the design contract. Repo-side partial consumption landed in commit `39c04b051f2d63eb81e513b679c656b4294d1586`: archive generation uploads a redacted package file to Drive after provider probes, stores the Drive ID only server-side, exposes safe package-ready markers, and keeps raw Drive IDs out of workspace/download responses. Live Drive proof is currently blocked by upload HTTP 403 after root/index probes pass.
- `last updated`: 2026-05-20 23:11 PT

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
- `next action`: Finish the scaffold by broadening permission tests, adding server-side Drive upload credentials, implementing account provisioning/import, deciding whether generated/temporary credential policy is needed, and implementing first admin/progress workflow endpoints.
- `acceptance check`: Tests cover hardened auth, student-own access, assigned mentor access, program/cohort teacher access, admin access, misc-admin narrowing, protected evidence access, unauthorized denial, valid status transitions, and audit events.
- `evidence to close`: Passing tests plus first vertical-slice endpoints that use the D1 schema and Google Drive evidence repository metadata without real student data. D1-backed alpha flow, state-machine tests, alpha framework/check/CI, deployment verification, first-admin bootstrap, fake role-account seeding, login proof, admin-only seed endpoint guard evidence, reset-required `/api/auth/complete-reset` credential rotation, admin reset initiation, and active-user `/api/auth/change-password` credential rotation with audit/session tests now exist; broader permission tests, invitation/import, generated/temporary credential policy, and Drive upload credentials remain before close.
- `last updated`: 2026-05-21 00:09 PT

### H-2026-05-18-008

- `source lane`: figma
- `owner lane`: student-workflow-evidence, staff-review-mentor, admin-ops-reporting, backend-security-data, and deployment-qa
- `status`: open
- `source`: professional-plan Figma verification and 100-pass MVP map
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, `03 Product Preview + State Variants` node `6:2`, `100-Pass MVP Execution Map` node `18:2`, route/data contract nodes `18:44` through `18:47`, review/override variants node `31:2`, developer handoff contract node `31:144`, private evidence/review-history contract node `37:2`, evidence handoff contract node `37:177`, MVP component variant matrix node `43:2`, status component set `43:55`, action component set `43:73`, evidence row component set `43:149`, shared UI contract `43:150`, admin account/group provisioning contract node `48:2`, admin provisioning handoff node `48:208`, mobile evidence/revision contract node `56:2`, mobile handoff node `56:114`, progress dashboard aggregate contract node `61:2`, progress dashboard aggregate handoff node `61:113`, audit log/export controls contract node `69:2`, audit export handoff node `69:180`, mentor meeting/presentation scheduling contract node `78:2`, mentor presentation handoff node `78:166`, full MVP alpha prototype page `98:2`, prototype frames `98:3` through `98:17`, production boundary node `124:2`, workspace account edge-state node `133:2`, presentation dashboard state handoff node `139:2`, and prototype map rail `98:1130`
- `next action`: Continue consuming the route/data/permission contract and page `98:2` by deepening the D1-backed alpha route into real workflow endpoints and shared `StatusPill`, `ActionButton`, `EvidenceArtifactRow`, `PermissionGate`, and `ReviewHistoryItem` primitives before hardening teacher review decisions, admin override paths, private evidence upload/link access checks, immutable review history, admin user/group/role/cohort provisioning, mobile student evidence/revision states, progress-update/dashboard-aggregate persistence, immutable audit-log filters, export-request authorization, signed archive downloads, meeting attendance, make-up linkage, outline approval gates, celebration/archive workflow states, announcements without peer messaging, protected-record boundary checks, and mobile no-overflow behavior from nodes `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, `124:2`, `133:2`, `139:2`, and prototype frames `98:3` through `98:17`. Immediate review-history UI consumption is now present in both the account smoke path and the primary alpha console; workspace node `133:2` is now consumed locally for session-expired, disabled-account, reset-required, role-pending, permission-denied, and no-active-assignment states; presentation slot scheduling plus check-out/check-in endpoints now exist and node `139:2` is consumed in the canonical workspace Presentation tab. Next rebuild work should verify hosted/live workspace presentation states after deploy if unblocked, persist outline approval gates, or move into celebration/archive depth.
- `acceptance check`: Rebuild commits a stack/scaffold or implementation plan that maps `/student/progress`, `/api/progress-updates`, `/api/submissions/:id/status`, `/teacher/review`, `/teacher/dashboard`, `/mentor/assigned`, `/mentor/dashboard`, `/mentor/meetings`, `/api/meetings/:id/attendance`, `/student/mentor-meetings`, `/student/presentation`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-in`, `/admin/users`, `/admin/groups`, `/admin/programs`, `/admin/cohorts`, `/admin/dashboard`, `/admin/audit`, `/api/audit-events`, `/api/audit-events/:id`, `/admin/exports`, `/api/exports/student-archive`, `/api/exports/:id/download`, `/student/archive`, `/student/evidence`, `/student/submissions/:submissionId/revise`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, `/api/admin/users/import`, `/api/admin/role-assignments`, `/api/admin/mentor-assignments`, review decisions, admin overrides, evidence upload/link checks, review history, shared component variants, admin provisioning states, mobile revision/blocked-submit/access-denied states, progress/dashboard aggregate states, audit-event filters, export-request records, signed download expiry, meeting attendance, make-up requirements, outline approval, presentation slot records, check-out/check-in, and retention-policy controls to persisted data, server authorization, audit events, private-evidence guards, signed URL expiry, stable loading/disabled states, accessible text-plus-color status, duplicate import handling, narrow misc-admin scope, mobile no-overflow behavior, stale-write conflict handling, server-derived dashboard counts, no storage-key exposure, and loading/error/permission tests.
- `evidence to close`: Committed rebuild plan or code scaffold referencing `z4t4tFPAKrMDh6pIYOeEw6`, node `18:2`, node `31:2`, node `37:2`, node `43:2`, node `48:2`, node `56:2`, node `61:2`, node `69:2`, node `78:2`, and full prototype page `98:2`. First D1-backed alpha flow evidence now exists in `alpha.html`, `alpha.js`, `alpha.css`, `/api/alpha/state`, `functions/_lib/alpha-flow-model.js`, `tests/alpha-flow.test.mjs`, `docs/alpha-runbook.md`, `docs/alpha-week-framework.md`, `scripts/check-alpha-contract.mjs`, and CI workflows; production alpha, first-admin bootstrap, fake role-account login, and admin-only seed guard are verified; the review-history API now returns comments plus immutable submission version snapshots; `account.html`/`account.js` render those comments/version snapshots without exposing Drive storage IDs; and the primary alpha console now preserves/renders teacher comments, review decisions, status events, and version snapshots from server-owned alpha state with storage-identifier blocking. Figma verification on 2026-05-20 updated `98:9` and `98:10` so the prototype names `/api/reviews/:submissionId/history`, `reviews`, `comments`, `status_history`, `submission_versions`, scoped permissions, and storage-ID redaction; `get_design_context` and `get_screenshot` succeeded for both nodes after the correction. The 12:35 PT Figma pass updated and verified handoff node `98:17` with `review_history_consumed_at`, a primary alpha-console consumption note, and next rebuild focus on mentor/presentation/admin depth. The 13:06 PT non-Figma pass added `migrations/0006_presentation_slots.sql`, `/api/presentation-slots`, and `tests/presentation-slots.integration.test.mjs` for scoped presentation-slot visibility, admin/program-teacher scheduling, same-location conflict blocking, and audit events. The 16:08 PT non-Figma pass added `/api/presentation-slots/:id/check-out`, `/api/presentation-slots/:id/check-in`, and shared transition logic with scoped admin/program-teacher authorization, invalid-status guards, status/timestamp persistence, and audit coverage in the same integration test. The 18:10 PT non-Figma pass consumed workspace node `133:2` locally by adding `/api/auth/me` account-state blockers plus workspace UI states/tests for session-expired, account-disabled, reset-required, role-pending, permission-denied, and no-active-assignment, including local browser proof for the unassigned mentor state. The 18:33 PT Figma pass added and verified presentation dashboard state handoff node `139:2` with 6 states, 7 routes, 8 records, 6 guardrails, screenshot `717x1024` from original `1360x1943`, and zero clipped/overflow readback after layout correction. The 19:10 PT non-Figma pass consumed node `139:2` into the canonical workspace: `workspace.js` loads `/api/presentation-slots`, renders a Presentation tab with persisted schedule/outline/day-of states, shows staff-only check-out/check-in controls, extends local smoke seed data, and passed source, API, credential-backed HTTP, aggregate, and in-app browser validation. Real workflow endpoints, shared primitives, Drive upload credentials, hosted edge/presentation proof, outline/celebration/archive depth, and implementation references to prototype frames `98:3` through `98:17` remain before close.
- `latest Figma handoff`: 2026-05-21 node `153:2` added credential lifecycle states for admin reset initiation, reset completion, active-user password change, invalid current password, weak/reused password, stale-session fallback, and redacted audit proof. Node `151:2` remains the Drive archive delivery contract; it is partially consumed by the repo-side Drive package upload path, with hosted fake-account proof still blocked by Drive upload HTTP 403.
- `last updated`: 2026-05-20 23:11 PT

## Resolved Handoffs

### H-2026-05-20-008

- `source lane`: requirements-audit
- `owner lane`: figma-only / design-assets-handoff
- `status`: resolved
- `source`: P0 production app/website gate
- `artifact`: active Figma file `z4t4tFPAKrMDh6pIYOeEw6`, page `05 Full MVP Alpha Prototype`, node `124:2` (`Prototype / 15 / Production app and public guide boundary`), and repo notes in `docs/progress/figma.md`.
- `next action`: Closed by the verified Figma production-boundary handoff. Rebuild should consume node `124:2` when adding browser-visible role-pending and permission-denied workspace states.
- `acceptance check`: Satisfied. The handoff distinguishes public website guide modes from authenticated app roles, includes student, mentor, program-teacher, admin, misc-admin, no-role pending, permission denied, Drive-missing, and unsupported-upload states, and does not treat stakeholder options as Student/Teacher guide modes.
- `evidence to close`: `use_figma` created and corrected node `124:2`; `get_design_context` and `get_screenshot` succeeded; final readback found zero suspicious clipped text nodes, zero child overflow, 7 route/API entries, 9 records, 6 permission scopes, 6 guardrails, and 3 external setup blocker notes.
- `last updated`: 2026-05-20 16:41 PT

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
