# Senior Capstone Automation Memory

Date initialized: 2026-05-18
Last refreshed: 2026-05-20

This is the compact working memory for the Senior Capstone project-local automation loop. The project now has four GUI-available delivery automation rows across two lanes: `senior-capstone-nonfigma-mvp-builder`, `senior-capstone-figma-product-builder-15`, `senior-capstone-nonfigma-mvp-builder-30`, and `senior-capstone-figma-product-builder`, plus two oversight automations: `senior-capstone-daily-mvp-summary` and `senior-capstone-weekly-script-audit`. The non-Figma builder lane runs hourly at minute 0 and minute 30 PT, the Figma-only builder lane runs hourly at minute 15 and minute 45 PT, and all four builder rows are governed by `automation/qol/project-lock.json`, `docs/automation-cadence.md`, and the active prompt files in `automation/prompts/`.

The legacy `senior-capstone-hourly-qol-orchestrator` ID is diagnostic/manual only if present and must not be counted as active builder capacity. No other Senior Capstone project delivery automation should be created, invoked, revived, or maintained from this repo unless Bryan explicitly asks for it.

## Product Target

Build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a secure database-backed operating system for users, groups, roles, programs, cohorts, progress updates, private upload/evidence spaces, student submissions, mentor/teacher review, revision requests, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records.

Urgent alpha gate: count 2026-05-18 as Day 1; by end of day Sunday, 2026-05-24 PT, Bryan needs a full-fledged alpha where the whole app flow works through seeded/demo personas or a clearly labeled role switcher. Production user accounts may remain incomplete for alpha, but student, teacher, mentor, admin, misc-admin, proposal, evidence metadata, review/revision/approval, dashboard, audit/activity, export/archive, mobile student, error/empty/permission flows should work well enough to walk through.

This is not a static guide, brochure, or visual-only project.

## Current State

- Repository contains the Cloudflare Pages Functions/D1 scaffold under `functions/`, `migrations/`, `package.json`, `wrangler.jsonc`, and `.dev.vars.example`.
- Day 7 alpha flow exists at `alpha.html` with `/api/alpha/state` using D1 `app_settings` as a server-owned seeded demo-state layer for student, program teacher, mentor, admin, and misc-admin personas.
- Cloudflare Pages project `senior-capstone-app` and D1 database `senior-capstone-db` are provisioned, and migration `migrations/0001_foundation.sql` has been applied remotely.
- Hardened username/password bootstrap, login, logout, and session lookup endpoints exist. First-admin bootstrap is complete for `bryan.timm89@gmail.com`.
- Auth edge-state and account-lifecycle integration coverage now exists for `/api/auth/login`, `/api/auth/complete-reset`, `/api/auth/change-password`, `/api/auth/me`, and `/api/auth/logout`, including disabled login, reset-required login, invalid login, expired-session `/me`, disabled-account `/me`, reset-required `/me`, logout revocation, reset-required credential rotation, active-user self credential rotation, password-version increment, stale-session revocation, fresh-session issuance, and new-password login: `tests/auth-login.integration.test.mjs`.
- Four fake `.test` alpha accounts are seeded for walkthrough testing. Credentials are only in ignored `.secrets/` files and must not be copied into docs, commits, screenshots, Figma, Canva, or chat.
- Google Drive evidence repository root folder `1pfEhlrU1fax9N8LfaoA1Cyo5nUIXetG2` and index sheet `1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0` exist and are wired into Pages config and D1 metadata. Service-account JWT token exchange helper exists (`functions/_lib/google-drive.ts`) plus authenticated/audited `/api/evidence/drive-probe` integration tests, and Drive-backed evidence file upload + streaming download routes (`/api/submissions/:id/evidence/upload`, `/api/evidence/:id/download`) with local integration tests covering token exchange/provider failures, redaction, denied-access (including misc-admin), and the >5MB resumable upload path (upload cap now 20MB); real Cloudflare-secret verification is still pending.
- Account smoke test page (`account.html`) now includes a Drive file upload/download panel to manually verify file-byte evidence behavior against the seeded submission fixtures without committing passwords.
- Alpha state-machine tests, alpha contract checks, the cadence verifier, and consolidated GitHub Actions CI exist.
- Source PDFs have been extracted and converted into app-native requirements in `data/capstone-framework.json`.
- Framework seed loader now includes schema + data migrations: `migrations/0002_framework_seed.sql` adds minimal framework tables (sections, checks, credit owners, review gates, evidence signals) and `migrations/0003_framework_seed_data.sql` captures the generated seed data. `scripts/framework-seed.mjs` generates idempotent seed SQL for D1, and `tests/framework-seed.test.mjs` + `tests/framework-seed-migration.test.mjs` guard counts and prevent leaking local source paths into SQL output.
- Local D1 migrations + seed-count verification can be run via `scripts/verify-framework-seed-d1.ps1`; remote D1 apply/verification is blocked until `CLOUDFLARE_API_TOKEN` is available for non-interactive Wrangler runs.
- Admin test-account seeding now references the seeded requirement ID `req-proposal-draft` (replacing the alpha-only placeholder `req-alpha-proposal`) for the canonical proposal workflow fixtures.
- Executable permission-helper tests now cover the default-deny `canAccessStudent` role matrix used by protected evidence access checks (mentor access requires both an active assignment and the `mentor` role; program-teacher scopes default-deny empty scope IDs / null matching): `tests/permissions-access.test.mjs`.
- Admin mentor-assignment management now exists: `/api/admin/mentor-assignments` is admin-only, blocks invalid mentor/student role combinations on upsert (POST), supports assignment listing (GET), supports audited deactivation (DELETE), and writes audit events for denials and successful lifecycle changes (integration coverage: `tests/admin-mentor-assignments.integration.test.mjs`).
- Admin role-assignment management now exists: `/api/admin/role-assignments` is admin-only and supports listing (GET), creating/upserting (POST), and removing (DELETE) `user_roles` records while validating `program_teacher` program/cohort scopes against `programs`/`cohorts` and writing audit events for creates/duplicates/removals (integration coverage: `tests/admin-role-assignments.integration.test.mjs`).
- Evidence access route integration tests now execute `/api/evidence/:id/check-access` against a deterministic D1 mock and assert 401/403/404/200 behavior for student own access, mentor-assigned access, program-teacher program scope, admin access, misc-admin narrowing, plus audit events, storage-id redaction, and empty-scope denial regression coverage: `tests/evidence-check-access.integration.test.mjs`.
- Teacher review loop integration tests now exercise student submit -> teacher revision request -> student resubmit (version++) -> teacher approval, asserting review queue membership plus persisted `reviews` + `status_history`: `tests/review-loop.integration.test.mjs`.
- Submission version and review-comment persistence now exists for the review loop: migration `migrations/0005_submission_versions.sql` adds immutable `submission_versions`; `/api/submissions/:id/submit` snapshots each submitted/resubmitted version with redacted evidence metadata; `/api/reviews/:submissionId/decision` supports `comment_only` feedback and writes review feedback into `comments`; `/api/reviews/:submissionId/history` returns comments and versions alongside reviews/status history; `tests/review-loop.integration.test.mjs` proves comment-only feedback plus version 1 and version 2 survive revision/resubmission/approval.
- The account smoke UI now has a review-history panel that calls `/api/reviews/submission-alpha-maya-proposal/history`, renders teacher comments, review decisions, status timeline rows, and immutable version snapshots, and blocks rendering if private Drive storage identifiers ever appear in the payload. Source coverage lives in `tests/account-and-evidence-access.test.mjs`.
- Student submissions now block on missing evidence: `/api/submissions/:id/submit` returns 409 `submission_missing_evidence` (audited) until at least one `evidence_artifacts` row is attached; coverage lives in `tests/review-loop.integration.test.mjs`.
- Mentor meeting persistence foundation now exists: migration `migrations/0004_mentor_meetings.sql` plus authenticated mentor meeting record/list route `/api/mentor/meetings` with assignment-scope enforcement, audit events, and integration coverage in `tests/mentor-meetings.integration.test.mjs`.
- Presentation slot persistence foundation now exists: migration `migrations/0006_presentation_slots.sql` plus authenticated `/api/presentation-slots` list/create route. The route exposes only slots the viewer can access, limits scheduling to admin/program-teacher staff, blocks same-location overlapping slots, and audits denied/conflict/scheduled outcomes. Integration coverage lives in `tests/presentation-slots.integration.test.mjs`, and local D1 migration verification applied the migration successfully.
- Public Student/Teacher guide mode now exists for the production website gate: `app.js` renders the top-banner mode control with `Viewing: Student Guide`, `Viewing: Teacher Guide`, `Switch to Student Guide`, `Switch to Teacher Guide`, `aria-pressed`, and public `senior-capstone-guide-mode` preference storage. The home page keeps both Student Guide and Teacher Guide source summaries visible, `public-companion/` was rebuilt from source, `scripts/check-production-surfaces.mjs` checks exact guide-toggle markers, and `tests/account-and-evidence-access.test.mjs` covers the source behavior. In-app browser visual verification was attempted but blocked because no active Codex browser pane was available.
- The canonical `workspace.html` route now renders explicit access-boundary UI states: expired sessions see `data-workspace-state="session-expired"`, disabled accounts see `data-workspace-state="account-disabled"`, reset-required accounts see `data-workspace-state="reset-required"`, signed-in users with no assigned roles see `data-workspace-state="role-pending"`, role-scoped 403 API responses render `data-workspace-state="permission-denied"`, and mentors with no active students see `data-workspace-state="no-active-assignment"`. `tests/workspace-app.test.mjs` executes those states with stubbed API responses; local Pages dev credential smoke still passes with the local-only unassigned mentor account; the in-app browser verified the seeded no-role role-pending card and unassigned mentor no-assignment UI with zero console errors.
- The canonical `workspace.html` route now renders a password-reset completion panel when login or session state returns `password_reset_required`; it posts to `/api/auth/complete-reset` and source/VM tests cover the visible `data-auth-action="complete-reset"` marker. Direct hosted `https://senior-capstone-app.pages.dev/workspace.js` returned HTTP 200 with the marker on poll 2 after push; in-app browser tooling was not exposed during the 2026-05-20 22:40 PT pass, so visual browser proof remains a follow-up.
- The canonical `workspace.html` route now includes a signed-in Security tab with `data-auth-action="change-password"` that posts to `/api/auth/change-password`; source/VM tests verify the form marker and session-closure copy. The endpoint verifies the current password, rejects weak/unchanged replacements, rotates the password hash/salt, increments `password_version`, revokes other active sessions by issuing a fresh session, and audits `password_changed_by_user` / `password_change_denied`.
- The canonical `workspace.html` route now consumes `/api/presentation-slots` for student, mentor, program-teacher, and admin roles and renders a Presentation tab with schedule, location, outline status, empty state, and staff-only check-out/check-in controls. Local seed `scripts/seed-local-workspace-smoke.mjs` includes a presentation slot fixture. Validation passed in `tests/workspace-app.test.mjs`, `tests/workspace-browser-smoke.test.mjs` with local Pages/D1, aggregate `check`, and in-app browser proof for the program-teacher Presentation tab with zero console errors.
- Archive export delivery now uploads the storage-ID-redacted archive manifest JSON into the configured Drive evidence root before marking an export complete. The Drive file ID is stored only server-side in `exports.drive_file_id`; `/api/student/archive/readiness`, `/api/exports/:id/download`, and `workspace.js` expose only Drive-package-ready booleans/headers and keep raw Drive IDs out of client responses. Coverage lives in `tests/archive-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, and `tests/production-workflow-source.test.mjs`.

## Active Automation Contract

- Active minute-0 non-Figma MVP builder: `senior-capstone-nonfigma-mvp-builder`.
- Active minute-15 Figma-only product builder: `senior-capstone-figma-product-builder-15`.
- Active minute-30 non-Figma MVP builder: `senior-capstone-nonfigma-mvp-builder-30`.
- Active minute-45 Figma-only product builder: `senior-capstone-figma-product-builder`.
- Active report-only daily summary: `senior-capstone-daily-mvp-summary`.
- Active weekly strategy review: `senior-capstone-weekly-script-audit`.
- Non-Figma cadences: `FREQ=HOURLY;BYMINUTE=0;BYSECOND=0` and `FREQ=HOURLY;BYMINUTE=30;BYSECOND=0`.
- Figma cadences: `FREQ=HOURLY;BYMINUTE=15;BYSECOND=0` and `FREQ=HOURLY;BYMINUTE=45;BYSECOND=0`.
- Capacity: 48 non-Figma starts/day, 48 Figma starts/day, 96 combined starts/day, and 2,880 combined scheduled starts in 30 days.
- Daily and weekly automations remain oversight, not builder capacity.
- The stable `hourly` name remains only as a legacy diagnostic/manual ID; the actual builder cadence is split by lane.
- Verification command: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\verify-cadence-30min.ps1 -RepoRoot .`.
- Diagnostic runner command path: `automation/qol/hourly-orchestrator.mjs`.
- Diagnostic doctor command path: `automation/qol/doctor.mjs`.

Every builder run must ladder from `docs/master-plan.md` into `docs/mvp-requirements-catalog.md`, select one bounded requirement slice in its lane, name the requirement IDs advanced, update the catalog when material progress happens, and leave durable verification, a Figma handoff, or an exact blocker.

## Dated Memory

### 2026-05-20 - Split Builder Cadence

- Builder cadence split into two lanes.
- Non-Figma builder runs at minute 0 PT.
- Figma-only builder runs at minute 30 PT.
- Active Figma file key: `z4t4tFPAKrMDh6pIYOeEw6`.
- Old builder `senior-capstone-hourly-qol-orchestrator` is legacy/manual/diagnostic only.
- Superseded by Bryan's later 2026-05-20 duplicated cadence approval: combined capacity is now 96 starts/day.
- Figma-only lane owns `MVP-028` and functional design handoffs.
- Non-Figma lane owns implementation, tests, deployment, data, docs, Canva-only work, automation safety, and blockers.
- Daily and weekly automations remain oversight, not builder capacity.
- External scheduler may still require manual configuration unless a repo-local scheduler config exists and is changed with evidence.

### 2026-05-20 - Quarter-hour Builder Cadence

- Bryan approved moving SeniorProjectApp1.0 to four active GUI-visible builder instances with one builder start every 15 minutes.
- Non-Figma builder instances are `senior-capstone-nonfigma-mvp-builder` at minute 0 PT and `senior-capstone-nonfigma-mvp-builder-30` at minute 30 PT.
- Figma builder instances are `senior-capstone-figma-product-builder-15` at minute 15 PT and `senior-capstone-figma-product-builder` at minute 45 PT.
- Combined scheduled capacity is 96 starts/day: 48 non-Figma starts/day and 48 Figma starts/day.
- Thirty-day scheduled capacity is 2,880 starts: 1,440 non-Figma starts and 1,440 Figma starts.
- The duplicate scheduler prompt bodies should remain exact matches to their source lane prompt bodies; do not rewrite active automation prompt bodies during cadence maintenance.
- Daily and weekly automations remain oversight, not builder capacity.
- The legacy hourly QoL orchestrator remains absent/manual/diagnostic only if present and must not be revived.

### 2026-05-20 - Owner-Approved Duplicated Builder Cadence

- Bryan explicitly approved duplicating the working Senior Capstone builder automation setup on 2026-05-20.
- Earlier duplicated non-Figma builder instances were `senior-capstone-nonfigma-mvp-builder` at minute 0 PT and `senior-capstone-nonfigma-mvp-builder-bottom` at minute 30 PT.
- Earlier duplicated Figma builder instances were `senior-capstone-figma-product-builder-top` at minute 0 PT and `senior-capstone-figma-product-builder` at minute 30 PT.
- The new GUI rows were created as separate visible automations with exact live prompt-body copies from their source lane.
- Combined scheduled capacity is now 96 starts/day: 48 non-Figma starts/day and 48 Figma starts/day.
- Thirty-day scheduled capacity is now 2,880 starts: 1,440 non-Figma starts and 1,440 Figma starts.
- Daily and weekly automations remain oversight, not builder capacity.
- The legacy hourly QoL orchestrator remains diagnostic/manual only if present and must not be revived.
- Superseded by the quarter-hour cadence above, which preserves 96 starts/day while removing same-minute Non-Figma/Figma collisions.

### 2026-05-20 - Primary Alpha Review History

- Non-Figma builder moved review-history visibility into the primary alpha console after the account smoke path and Figma handoff were aligned.
- `functions/_lib/alpha-flow-model.js` now preserves alpha comments, status timeline entries, and immutable submission version snapshots for submit, revision request, resubmit, and approval.
- `alpha.js` renders comments, decisions, submission versions, and status events with storage-identifier blocking; `tests/alpha-flow.test.mjs` and `scripts/check-alpha-contract.mjs` now guard this behavior.
- Next best non-Figma slices should rotate away from repeated review-history UI unless hosted alpha smoke finds a regression; mentor/presentation/admin depth and remote D1/Cloudflare verification remain higher-value follow-ups.

### 2026-05-20 - Presentation Slot Scheduling Foundation

- Non-Figma builder added D1-backed presentation slot scheduling under `MVP-017`.
- `migrations/0006_presentation_slots.sql` creates persisted presentation slots with status, outline status, location, duration, and check-out/check-in columns for the next slice.
- `/api/presentation-slots` now supports scoped list/create behavior: mentors can see assigned-student slots, admin/program-teacher staff can schedule in-scope students, and overlapping same-location slots return `presentation_slot_conflict`.
- `tests/presentation-slots.integration.test.mjs`, full test suite, typecheck, and local D1 migration verification passed. Remote D1 apply/verification still requires `CLOUDFLARE_API_TOKEN`.
- `/api/presentation-slots/:id/check-out` and `/api/presentation-slots/:id/check-in` now persist day-of presentation status/timestamps for in-scope admin/program-teacher staff, block mentor/out-of-scope/invalid-status attempts, and audit both denials and successful transitions.

### 2026-05-20 - Figma Production Boundary Handoff

- Figma-only builder added node `124:2`, `Prototype / 15 / Production app and public guide boundary`, to the active file `z4t4tFPAKrMDh6pIYOeEw6` on page `05 Full MVP Alpha Prototype`.
- The handoff separates public Student/Teacher guide mode (`/` and generated `public-companion/`) from the authenticated role-aware workspace (`/workspace`, `/workspace.html`, auth/session APIs, student dashboard, evidence link/upload APIs).
- Shared plugin data key `senior_capstone/production_boundary_contract_2026_05_20` records 7 routes, 9 records, 6 permission scopes, 6 guardrails, and the current Drive/Cloudflare setup blockers.
- Final Figma verification succeeded: `get_design_context` and `get_screenshot` passed for node `124:2`, with screenshot `800x1024` from original `1360x1742`; readback found zero suspicious clipped text nodes and zero child overflow.
- Follow-up rebuild work from this handoff has started: role-pending, permission-denied, session-expired, disabled, reset-required, and no-assignment workspace states now have local proof; remaining proof is hosted post-deploy verification plus live Drive upload/download after Bryan configures `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY`.

### 2026-05-20 - Workspace Account Edge-State Consumption

- Non-Figma builder consumed the repo-recorded workspace account edge-state handoff without calling Figma tools.
- `/api/auth/me` now returns specific blockers for valid session cookies tied to expired sessions, disabled accounts, and reset-required accounts, while fresh signed-out users still receive the plain unauthenticated response.
- `workspace.js` renders session-expired, account-disabled, reset-required, role-pending, permission-denied, and no-active-assignment `data-workspace-state` markers; local seed now includes an unassigned fake mentor for local-only smoke proof.
- Validation passed: focused auth/workspace tests, credential-backed local HTTP workspace smoke, in-app browser unassigned mentor no-assignment proof with zero console errors, full test suite, production-surface check, and aggregate `check`. Live Cloudflare inspection still needs `CLOUDFLARE_API_TOKEN`, and real Drive upload/download still needs Drive credential secrets.
- Next best non-Figma slices: verify hosted account-state markers after deployment, add a live section-level permission-denied proof, broaden public no-hidden-core-content coverage, or resume MVP-017 dashboard surfacing.

### 2026-05-20 - Figma Presentation Dashboard State Handoff

- Figma-only builder added node `139:2`, `Prototype / 17 / Presentation dashboard state handoff`, to the active file `z4t4tFPAKrMDh6pIYOeEw6` on page `05 Full MVP Alpha Prototype`.
- The handoff maps implemented `/api/presentation-slots`, `/api/presentation-slots/:id/check-out`, and `/api/presentation-slots/:id/check-in` behavior into student, mentor, teacher, admin, denied-action, empty, and loading dashboard states.
- Shared plugin data key `senior_capstone/presentation_dashboard_state_contract_2026_05_20` records 6 states, 7 routes, 8 records, 6 guardrails, and the next rebuild action for canonical dashboard presentation-state browser proof.
- Final Figma verification succeeded: `get_design_context` and `get_screenshot` passed for node `139:2`, with screenshot `717x1024` from original `1360x1943`; final readback found zero suspicious clipped text nodes and zero child overflow after a compact-row layout correction.
- This handoff has now been consumed in the canonical workspace for presentation slot visibility and staff check-out/check-in controls from persisted `/api/presentation-slots` rows without using client-only workflow state.

### 2026-05-20 - Workspace Presentation Dashboard Consumption

- Non-Figma builder consumed the repo-recorded Figma presentation dashboard handoff node `139:2` without calling Figma tools.
- `workspace.js` now loads `/api/presentation-slots` for student, mentor, program-teacher, and admin users, adds a Presentation tab, renders scheduled/checked-out/checked-in/empty states, and shows check-out/check-in buttons only to program-teacher/admin staff.
- `scripts/seed-local-workspace-smoke.mjs` now seeds a local-only presentation requirement and scheduled Room 101 slot for credential-backed workspace smoke without printing passwords.
- Validation passed: focused workspace source/VM test, presentation-slot integration test, local D1 seed, credential-backed local HTTP workspace smoke, in-app browser program-teacher Presentation tab proof with zero console errors, typecheck, production-surface check, full test suite, aggregate `check`, and direct hosted `workspace.js` marker proof for `/api/presentation-slots` plus `data-presentation-action="check-out"`.
- Next best non-Figma slices: hosted presentation-dashboard proof after deployment, outline approval gate persistence, celebration evidence, archive/export depth, or public no-hidden-core-content proof while Cloudflare/Drive secrets remain blocked.

### 2026-05-20 - Figma Celebration Archive Readiness Handoff

- Figma-only builder `senior-capstone-figma-product-builder-15` added node `144:2`, `Prototype / 18 / Celebration archive readiness handoff`, to active file `z4t4tFPAKrMDh6pIYOeEw6` on page `05 Full MVP Alpha Prototype`.
- The handoff maps Celebration Day evidence, ingredient-list requirements, thank-you and mentor-note completion, reflection/portfolio readiness, May 5 archive request, expired signed download, and archive permission-denied states to closeout/archive implementation.
- Shared plugin data key `senior_capstone/celebration_archive_readiness_contract_2026_05_20` records 7 states, 8 routes, 14 records, 5 permission scopes, 7 guardrails, 7 acceptance checks, and the next rebuild action for archive/closeout workflow depth.
- Initial Figma readback found fixed-height rows clipping taller child cards; row autosizing correction expanded node `144:2` to `1360x2218`.
- Final Figma verification succeeded: `get_design_context` and `get_screenshot` passed for node `144:2`, with screenshot `628x1024` from original `1360x2218`; final readback found 87 text nodes, zero suspicious clipped text nodes, and zero child overflow.
- Next best non-Figma slice from this handoff: implement celebration evidence, thank-you/mentor note, reflection/portfolio completion, May 5 archive package, scoped signed download, expired download, provider-unavailable, and archive permission-denied states from persisted rows and audit events.

### 2026-05-20 - Workspace Archive Readiness Consumption

- Non-Figma builder `senior-capstone-nonfigma-mvp-builder-30` partially consumed repo-recorded Figma node `144:2` without calling Figma tools.
- `/api/student/archive/readiness` now derives Celebration Day evidence, ingredient-list, thank-you/mentor note, reflection/portfolio, export, storage-provider, and signed-download readiness from persisted progress, evidence, export, and audit rows while redacting storage identifiers.
- The canonical workspace now adds a student Archive tab for the May 5 package checklist and storage/privacy guardrails.
- Validation passed: focused archive-readiness integration, workspace VM/source tests, production workflow source checks, typecheck, route inventory, full test suite, aggregate `check`, credential-backed local HTTP smoke, and in-app browser student Archive tab proof with zero console errors. Aggregate `check` still reports `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`, and real Drive delivery still needs Cloudflare Drive credential secrets.
- Remaining archive/export depth: real export artifact generation, signed expiry or safe Drive link behavior, expired-download retry, provider-unavailable generation states, retention handling, and hosted archive UI proof after deployment/credentials.

### 2026-05-20 - Scoped Archive Manifest Generation

- Non-Figma builder `senior-capstone-nonfigma-mvp-builder` continued `MVP-018`/`MVP-022` archive/export depth without Figma tools.
- Added migration `migrations/0007_archive_export_artifacts.sql` plus `functions/_lib/archive-export.ts` to generate a storage-ID-redacted student archive manifest from persisted progress/evidence rows, with content hash, byte length, and 14-day expiry.
- `/api/admin/exports/student-archive` now requires an admin reason, creates a completed export plus `export_artifacts` row, and audits `student_archive_export_generated`; `/api/exports/:id/download` streams the unexpired JSON manifest to admin/scoped users, audits download/missing/expired states, and returns `archive_download_expired` with a retry instruction after expiry.
- `workspace.js` now renders a student Archive manifest download link when `/api/student/archive/readiness` reports `scopedDownloadReady`.
- Validation passed: focused archive-readiness integration (8 tests), workspace source/VM test (7), production-workflow source test (10), strict typecheck, full test suite (141 passing tests plus 3 expected opt-in skips), production-surface check, artifact JSON parse, `git diff --check`, aggregate `check` with static Cloudflare checks and `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`, and direct hosted `workspace.js` marker proof for `data-archive-download="manifest"` on poll 4 after push.
- Remaining archive/export depth: apply/verify migration `0007` remotely when `CLOUDFLARE_API_TOKEN` is available, add Drive-backed package files or signed-link delivery after Drive credentials, provider-unavailable generation states, retention policy docs, and hosted archive UI proof.

### 2026-05-20 - Figma Archive Provider And Retention Handoff

- Figma-only builder `senior-capstone-figma-product-builder-15` added node `149:2`, `Prototype / 19 / Archive provider and retention handoff`, to active file `z4t4tFPAKrMDh6pIYOeEw6` on page `05 Full MVP Alpha Prototype`.
- The handoff maps missing Drive credentials, provider-unavailable retry, queued export generation, scoped package readiness, retention-window expiry, and policy-review states to archive/export implementation after the scoped JSON manifest work.
- Shared plugin data key `senior_capstone/archive_provider_retention_contract_2026_05_20` records 6 states, 6 routes, 10 records, 5 permission scopes, 6 guardrails, 7 acceptance checks, and the current `CLOUDFLARE_API_TOKEN` plus Google Drive credential blockers.
- Final Figma verification succeeded: `use_figma` returned 108 text nodes, zero suspicious clipped text nodes, and zero child overflow; `get_design_context` and `get_screenshot` passed for node `149:2`, with screenshot `706x1024` from original `1360x1975`.
- Next best non-Figma slice from this handoff: add provider-unavailable archive generation states, retention-policy handling, Drive-backed package or signed-link delivery, and hosted archive UI proof after Cloudflare/Drive secrets are available.

### 2026-05-20 - Archive Provider Failure And Retention Handling

- Non-Figma builder `senior-capstone-nonfigma-mvp-builder-30` partially consumed repo-recorded Figma node `149:2` without calling Figma tools.
- `/api/admin/exports/student-archive` now verifies Drive repository/credential/provider access before successful archive generation; missing Drive credentials or access failures create failed export rows and `student_archive_export_provider_unavailable` audit events instead of claiming package delivery.
- `functions/_lib/archive-export.ts` now centralizes archive provider readiness, configurable archive download-window retention metadata, and expiring-download detection; `.dev.vars.example` and `wrangler.jsonc` document the non-secret archive retention knobs.
- `/api/student/archive/readiness` and `workspace.js` now expose provider status, retention policy review state, download-window expiry warnings, and `data-archive-retention-status` without returning Drive storage identifiers.
- Validation passed: `tests/archive-readiness.integration.test.mjs` (10 tests), `tests/workspace-app.test.mjs` (7 tests), `tests/production-workflow-source.test.mjs` (10 tests), and strict `typecheck`.
- Remaining archive/export depth: apply/verify migration `0007` remotely when `CLOUDFLARE_API_TOKEN` is available, add Drive-backed package files or signed-link delivery after Drive secrets, and capture hosted archive UI proof after deployment/credentials.

### 2026-05-20 - Figma Drive Archive Delivery Handoff

- Figma-only builder `senior-capstone-figma-product-builder` added node `151:2`, `Prototype / 20 / Drive archive delivery handoff`, to active file `z4t4tFPAKrMDh6pIYOeEw6` on page `05 Full MVP Alpha Prototype`.
- The handoff deepens the remaining archive/export gap after node `149:2` was partially consumed by provider-gating archive generation and rendering retention state.
- Shared plugin data key `senior_capstone/drive_archive_delivery_contract_2026_05_20` records 6 states, 5 routes, 10 records, 5 permission scopes, 6 guardrails, and 6 acceptance checks for Drive credentials configured, package assembly to Drive, signed link issued, student download started, expired link retry, and hosted proof required states.
- Final Figma verification succeeded: `use_figma` returned 102 text nodes, zero suspicious clipped text nodes, and zero child overflow; `get_design_context` and `get_screenshot` passed for node `151:2`, with screenshot `684x1024` from original `1360x2038`.
- Next best non-Figma slice from this handoff: consume node `151:2` for Drive-backed package files or signed-link delivery, remote migration `0007` readback, hosted fake-account archive proof, expired retry, permission denial, and no raw Drive ID rendering after Cloudflare/Drive secrets are available.

### 2026-05-20 - Drive Archive Package Delivery

- Non-Figma builder `senior-capstone-nonfigma-mvp-builder` partially consumed repo-recorded Figma node `151:2` without direct Figma work.
- `functions/_lib/archive-export.ts` now uploads the redacted archive manifest JSON to the configured Drive root through the existing service-account helper after provider probes pass.
- `/api/admin/exports/student-archive` records Drive upload failures as failed exports, stores successful Drive package IDs only server-side in `exports.drive_file_id`, keeps app-scoped manifest body/hash/expiry in `export_artifacts`, and audits package-ready state without raw Drive IDs.
- `/api/student/archive/readiness`, `/api/exports/:id/download`, and `workspace.js` now surface `drivePackageReady` / `data-archive-drive-package` / `x-archive-drive-package-ready` without exposing Drive storage IDs.
- Validation passed: focused archive-readiness test (11), workspace source/VM test (7), production workflow source test (10), strict typecheck, full test suite (144 passing tests plus 3 expected opt-in skips), production-surface check, and `git diff --check` with CRLF warnings only.
- Remaining archive/export blockers: remote migration `0007` and Pages/D1 inspection still require `CLOUDFLARE_API_TOKEN`; live Drive package proof still requires `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY`; Bryan still needs to confirm archive retention policy.

### 2026-05-20 - Reset-Required Password Completion

- Non-Figma builder `senior-capstone-nonfigma-mvp-builder-30` advanced `MVP-004`/`MVP-005` account lifecycle without direct Figma work.
- Added `/api/auth/complete-reset` for reset-required accounts. It verifies the current password, rejects weak or unchanged replacements, rotates the password hash/salt, increments `password_version`, clears `requires_reset` / `pending_reset`, revokes stale sessions, creates a fresh session, and audits `password_reset_completed`.
- `workspace.js` now renders a reset completion panel with `data-auth-action="complete-reset"` when login or session state returns `password_reset_required`.
- Validation passed: focused auth integration, workspace source/VM, workspace browser-smoke source, production workflow source, strict typecheck, production-surface check, route-inventory check, full test suite (144 passing tests plus 3 expected opt-in skips), and `git diff --check` with CRLF warnings only. Aggregate `check` passed local/static gates but failed live Cloudflare verification because `CLOUDFLARE_API_TOKEN` was present and rejected by Cloudflare as `Invalid access token [code: 9109]`.
- Remaining account lifecycle depth: invitation/import, admin reset initiation, active-user credential rotation, and visual browser reset-panel proof. Live Cloudflare verification requires replacing the invalid token.

### 2026-05-21 - Active-User Password Change

- Non-Figma builder `senior-capstone-nonfigma-mvp-builder` advanced `MVP-004`/`MVP-005` account lifecycle without direct Figma work.
- Added `/api/auth/change-password` for signed-in active users who know the current password. It rejects invalid current passwords, weak replacements, unchanged replacements, and reset-required accounts, rotates credential hash/salt, increments `password_version`, revokes existing active sessions, creates a fresh session, and audits success/denial without logging secrets.
- `workspace.js` now renders a signed-in Security tab with a self-service password-change form and source/VM coverage in `tests/workspace-app.test.mjs`; `tests/auth-login.integration.test.mjs` covers credential rotation, stale-session denial, audit events, and new-password login.
- Validation passed: focused auth/workspace tests, strict typecheck, full test suite (156 pass / 3 expected skips), production-surface check, route-inventory check, and `git diff --check` with CRLF warnings only.
- Remaining account lifecycle depth: invitation/import, generated/temporary credential policy if needed, and visual browser proof after deployment. Drive upload remains blocked by Google Drive HTTP 403 after root/index probes pass.

## Current Priority

Immediate next useful passes:

1. Finish archive/export delivery depth after the repo-side Drive package path: apply/verify migration `0007`, configure Drive credential secrets, capture hosted fake-account archive UI proof for Drive package upload/app-scoped download markers, decide whether signed Drive links are needed beyond scoped app downloads, and verify no raw Drive IDs render.
2. Broaden public-site no-hidden-core-content proof across every guide route, then verify the newest workspace account-state/no-assignment markers after hosted deployment and add a live section-level permission-denied proof.
3. Extend alpha proposal/review/evidence/audit records into real workflow endpoints.
4. Add Google Drive server-side credential/OAuth implementation plus access-controlled evidence upload/retrieval assumptions.
5. Implement account provisioning/import, generated/temporary credential policy if needed, and known-gaps QA.
6. Keep mobile/error/empty/permission alpha QA current while the Day 7 walkthrough hardens.

Real daily MVP goal: minimum 2 accepted MVP passes per calendar day, stretch 3 when unblocked, and at least 14 accepted MVP passes per week until the 100-pass target is met or recalibrated.

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
- `SC-003`: Google Drive EvidenceArtifact model is in progress; metadata tables and root folder exist, but upload credentials and permission tests are still needed.
- `SC-004`: mentor meetings, presentation scheduling, celebration evidence, archive/export workflows; Drive-backed archive package upload now exists locally, while hosted proof needs Cloudflare token plus Drive secrets.
- `SC-005`: P0 Cloudflare stack/auth/database/user-group/progress/private-upload scaffold is in progress with Pages/D1/migrations/auth endpoints, password/session pepper secrets, Drive root folder configured, D1-backed alpha flow, state-machine tests, alpha contract checks, CI, production alpha deployment, verified first-admin bootstrap, login-verified fake role test accounts, reset-required password completion, admin reset initiation, and active-user credential rotation; broader permission tests, invitation/import, generated/temporary credential policy, and Drive upload credentials remain.
- `SC-006`: P0 Day 7 full app-flow alpha due 2026-05-24 PT; production user accounts may be incomplete, and the first D1-backed seeded alpha flow plus fake login-capable role accounts now exist.

## Known External Artifact Memory

- Canva folder: `FAHJ-n-VqFE`.
- Canva asset: `DAHJ-v7TOM8`, proposal approval process strip, no-text 1600x500.
- Active Figma product UI file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6` (`z4t4tFPAKrMDh6pIYOeEw6`), team id `1638213362346160913`.
- Key Figma implementation contract nodes: `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, and full MVP alpha prototype page `98:2` with implementation nodes through `151:2`.
- 2026-05-20 Figma review-history alignment updated full MVP alpha prototype nodes `98:9` and `98:10` to match `/api/reviews/:submissionId/history`, `reviews`, `comments`, `status_history`, `submission_versions`, scoped permissions, and storage-ID redaction; `get_design_context` and `get_screenshot` succeeded for both nodes.
- 2026-05-20 Figma handoff update verified node `98:17` after primary alpha-console review-history consumption; it records `review_history_consumed_at`, redirects next rebuild focus to mentor/presentation/admin depth, preserves API/D1/audit/storage-redaction boundaries, and passed `get_design_context` plus `get_screenshot`.
- 2026-05-20 Figma production-boundary handoff verified node `124:2`; it distinguishes public Student/Teacher guide mode from authenticated `/workspace` state, records route/data/permission contract data, and passed screenshot/metadata/readback QA.
- 2026-05-20 Figma workspace account edge-state handoff verified node `133:2`; it distinguishes session expired, disabled account, reset required, role pending, no active assignment, and section permission denied states for `/workspace`, records route/data/audit contract data, and passed screenshot/metadata/readback QA after a text-width autosizing correction.
- 2026-05-20 Figma presentation dashboard state handoff verified node `139:2`; it maps presentation slot, conflict, check-out, check-in, denied-action, empty, and loading states to persisted dashboard consumption with 6 states, 7 routes, 8 records, and 6 guardrails.
- 2026-05-20 Figma celebration archive readiness handoff verified node `144:2`; it maps closeout, Celebration Day evidence, reflection/portfolio, thank-you/mentor note, archive request, signed download, and archive permission states to persisted evidence/export/audit records with 7 states, 8 routes, 14 records, 5 permission scopes, 7 guardrails, and 7 acceptance checks.
- 2026-05-20 Figma archive provider and retention handoff verified node `149:2`; it maps Drive credential missing, provider-unavailable retry, queued generation, scoped package readiness, retention-window expiry, and policy review states to persisted export/evidence/audit records with 6 states, 6 routes, 10 records, 5 permission scopes, 6 guardrails, and 7 acceptance checks.
- 2026-05-20 Figma Drive archive delivery handoff verified node `151:2`; it maps credentials configured, package assembly to Drive, signed link issued, student download started, expired link retry, and hosted proof required states to persisted export/evidence/audit records with 6 states, 5 routes, 10 records, 5 permission scopes, 6 guardrails, and 6 acceptance checks.
- 2026-05-20 non-Figma workspace archive readiness pass partially consumed node `144:2` in repo code only by adding `/api/student/archive/readiness`, a student Archive workspace tab, explicit admin export reason enforcement, truthful signed-download-disabled output, focused integration/source/smoke/browser proof, and route inventory coverage.
- 2026-05-20 non-Figma archive manifest pass added `export_artifacts`, scoped JSON archive manifest generation/download, content hash/expiry metadata, expired-package retry state, storage-ID redaction tests, and a workspace manifest download marker.
- 2026-05-20 non-Figma archive provider/retention pass partially consumed node `149:2` by making archive generation provider-gated, auditing missing-credential/access failure states as failed exports, exposing configurable retention policy/window metadata, and rendering retention state in the canonical workspace.
- Bryan's phone-friendly live QoL tracker is the native Google Sheet `Senior Capstone QoL Run Tracker`, spreadsheet id `1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs`.

## Handoff And Logging Rules

Read `docs/progress/handoffs.md` before selecting work. Close handoffs with evidence.

Every productive run should update:

- Its relevant lane log in `docs/progress/`.
- `docs/progress/run-log.md`.
- A structured run manifest in `docs/progress/runs/`.
- Any changed handoff, decision, backlog, or memory file.
- `docs/artifacts.json` for durable external artifacts.
- `docs/human-decisions.md` for Bryan-level decisions.

Every run should end with a pushed commit or a committed blocker entry explaining why that could not happen. Every run should also record `self-improvement: none` or a specific self-improvement change with evidence.
