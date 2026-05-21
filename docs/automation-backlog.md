# Automation Backlog

This file tracks unresolved cross-category issues for the Senior Capstone rebuild. Ordinary backlog hygiene is owned by the split builders in their lanes, while the weekly strategy review may reprioritize backlog items from seven-day evidence.

Active automation ownership is tracked in `docs/automation-cadence.md`. The `owner` values in backlog items remain functional product groupings; they are not separate project automations.

## Status Values

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Severity Values

- `P0`: blocks safe hosted launch or risks student privacy/security/data integrity.
- `P1`: breaks core workflow, role clarity, dashboard trust, or program coverage.
- `P2`: causes confusion, inconsistency, accessibility weakness, or implementation ambiguity.
- `P3`: polish, copy refinement, or future enhancement.

## Items

### SC-001

- `severity`: P1
- `owner`: rebuild
- `status`: in-progress
- `source`: 2026 source-PDF curriculum ingestion
- `affected area`: framework seed loading
- `evidence`: `data/capstone-framework.json` defines 16 requirements with due labels, credit owners, review gates, quality nudges, evidence expectations, and dashboard signals. Migration `migrations/0002_framework_seed.sql` adds minimal tables for sections, quality checks, credit owners, review gates, student evidence, and dashboard signals. `scripts/framework-seed.mjs` generates idempotent seed SQL for requirements/deadlines/checks and related framework tables; migration `migrations/0003_framework_seed_data.sql` captures the generated seed data; tests `tests/framework-seed.test.mjs` + `tests/framework-seed-migration.test.mjs` guard counts and prevent leaking local source paths into SQL output. `scripts/verify-framework-seed-d1.ps1` applies migrations locally and verifies seeded counts by query (requirements=16, deadlines=24, review_gates=4, quality_checks=20) and confirms `req-alpha-proposal` is absent after seeding.
- `next action`: Remote D1 migrations are now applied/recorded through `0007`. Optionally rerun remote seeded count verification and re-run the admin test-account seed endpoint in preview/production to migrate alpha fixtures onto seeded requirement IDs (starting with `req-proposal-draft`).
- `last updated`: 2026-05-20 23:11 PT

### SC-002

- `severity`: P1
- `owner`: figma
- `status`: resolved
- `source`: Research Proposal Challenge PDF
- `affected area`: student proposal/research workflow
- `evidence`: The source assignment is a guided quality engine. The active recreated Figma file `z4t4tFPAKrMDh6pIYOeEw6` now includes guided proposal frame `3:154`, with section-level completeness, revision feedback, attached evidence, submit/resubmit path, and teacher review context. `docs/design/figma-first-pass-product-system.md` records the active file and frame IDs.
- `next action`: Future Figma runs should deepen variants and edge states instead of treating the guided proposal form as missing.
- `last updated`: 2026-05-18

### SC-003

- `severity`: P1
- `owner`: rebuild
- `status`: in-progress
- `source`: Cycle linked document, senior guide, and mentor teacher guide PDFs
- `affected area`: private evidence/upload/link model
- `evidence`: Source workflow repeatedly asks students to link documents, slides, photos, letters, reflections, and final products. Figma now has a private evidence/review-history implementation contract in active file `z4t4tFPAKrMDh6pIYOeEw6`, node `37:2`, shared `EvidenceArtifactRow` component variants in node `43:2` / component set `43:149`, and mobile student evidence/revision contract node `56:2`, with upload/link states, permission matrix, review history, mobile blocked-submit/access-denied states, and audit guardrails. Migration `migrations/0001_foundation.sql` now creates `evidence_repositories` and `evidence_artifacts`; D1 has the default Google Drive repository row pointing to root folder `1pfEhlrU1fax9N8LfaoA1Cyo5nUIXetG2` and index sheet `1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0`; `/api/evidence/repository` is authenticated and audited. Service-account JWT token exchange helper exists (`functions/_lib/google-drive.ts`) plus authenticated/audited `/api/evidence/drive-probe` tests. Drive-backed evidence file upload and access-controlled streaming download routes now exist: `/api/submissions/:id/evidence/upload` (multipart -> Drive -> `evidence_artifacts.drive_file_id`) and `/api/evidence/:id/download` (authz + audit + stream bytes), with integration tests covering missing session/config, token exchange failure, unsupported file types, provider failures, and success cases without leaking storage IDs. The canonical `workspace.html` student upload form now calls the real link and file upload endpoints and gives honest storage-not-configured messages.
- `next action`: Cloudflare Pages Drive credential parts are configured, but `npm run check:drive:live` fails because the service account receives HTTP 404 for both the configured root folder and index sheet. Share the configured root and index with the service-account email, confirm the IDs, then rerun `npm run check:drive:live` and verify upload/download behavior through the canonical workspace; extend to resumable uploads (>5MB), Google Docs export cases, and browser-level upload progress/retry handling.
- `last updated`: 2026-05-20 23:11 PT

### SC-004

- `severity`: P1
- `owner`: rebuild
- `status`: in-progress
- `source`: Senior guide and mentor teacher guide PDFs
- `affected area`: mentor meetings, presentation scheduling, celebration evidence, and archive/export
- `evidence`: The PDFs require mentor meeting attendance/make-up tracking, outline approval, presentation time scheduling, presentation check-out/check-in, celebration setup photo, ingredient lists for food, and May 5 personal archive/export. Figma now specifies archive/export controls in active file `z4t4tFPAKrMDh6pIYOeEw6`, node `69:2`; meeting/presentation scheduling in node `78:2`; celebration/archive readiness in node `144:2`; archive provider/retention states in node `149:2`; and Drive archive delivery in node `151:2`. Meeting persistence exists in `migrations/0004_mentor_meetings.sql`, `/api/mentor/meetings`, and `tests/mentor-meetings.integration.test.mjs`. Presentation slot persistence now exists in `migrations/0006_presentation_slots.sql`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-out`, `/api/presentation-slots/:id/check-in`, and `tests/presentation-slots.integration.test.mjs`, with scoped visibility, admin/program-teacher scheduling, same-location conflict blocking, day-of check-out/check-in status/timestamps, and audit events for denied/conflict/scheduled/transition outcomes. The canonical workspace consumes `/api/presentation-slots` and renders presentation schedule, outline status, empty state, and staff-only check-out/check-in controls. Archive readiness now exists in `/api/student/archive/readiness`, deriving Celebration Day evidence, ingredient-list, thank-you/mentor note, reflection/portfolio, archive export, provider/signed-download readiness, retention policy/window state, scoped manifest readiness, and Drive package readiness from persisted progress/evidence/export/artifact rows with view/denial audit events and storage IDs redacted. Migration `0007_archive_export_artifacts.sql`, `/api/admin/exports/student-archive`, `/api/exports/:id/download`, and `functions/_lib/archive-export.ts` now verify Drive provider readiness before successful archive generation, record failed provider or package-upload states as failed exports with audit events, upload the redacted manifest JSON to the configured Drive root, store the Drive file ID only server-side in `exports.drive_file_id`, and stream scoped app downloads from the redacted manifest body/hash/expiry in `export_artifacts`. The canonical workspace now renders a student Archive tab for the May 5 package checklist, a manifest download link when available, a Drive package file row, and retention-policy state; focused archive/source/workspace tests passed on 2026-05-20 22:09 PT.
- `next action`: Remote migrations `0006`, `0007`, and `0008` are now applied/recorded. Persist outline approval gates beyond slot status, fix the remaining Drive upload HTTP 403, add hosted presentation/archive dashboard proof after Drive upload passes, decide whether signed Drive links are needed beyond scoped app downloads, and confirm retention policy.
- `last updated`: 2026-05-20 23:11 PT

### SC-005

- `severity`: P0
- `owner`: rebuild
- `status`: in-progress
- `source`: automation self-improvement infrastructure pass and repeated stack-decision risk
- `evidence`: `docs/master-plan.md` now defines the revised MVP as a secure database-backed app with users, groups, roles, progress updates, private evidence, audit logs, dashboards, announcements, exports, and GitHub-to-Cloudflare hosting. `docs/architecture/adr-0001-stack-auth-database-upload.md` is accepted and refined by `D-2026-05-18-019`. Active Figma nodes `18:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, and `78:2` specify route/data/permission contracts for execution map, evidence history, component variants, admin provisioning, mobile revision, progress dashboards, audit logs, exports, mentor meetings, and presentation scheduling. Local scaffold now includes `package.json`, `wrangler.jsonc`, `functions/`, `.dev.vars.example`, and migrations `0001` through `0008`. Cloudflare Pages project `senior-capstone-app` and D1 database `senior-capstone-db` are provisioned; all committed migrations are now applied/recorded remotely; Pages preview/production config includes the D1 binding, Google Drive evidence root folder, Google Drive evidence index sheet, and `PASSWORD_PEPPER` / `SESSION_PEPPER` secrets. `alpha.html`, `alpha.js`, `alpha.css`, `/api/alpha/state`, and `functions/_lib/alpha-flow-model.js` now create the Day 7 alpha app flow with D1-backed seeded state, persona switching, student/teacher/mentor/admin/misc-admin views, workflow transitions, audit timeline updates, evidence validation, and no `localStorage` student-record persistence. Alpha state-machine tests, alpha contract checks, CI, the week framework, and preview script now exist. Production deployment verified `/alpha.html`, `/api/alpha/state`, `APP_ENV=production`, first-admin login/session for `bryan.timm89@gmail.com`, and `/api/health` `userCount=5` after fake alpha test accounts were seeded. D1 has the global admin role, four fake `.test` role accounts, test cohort/group/mentor/proposal/progress/submission/evidence fixtures, `bootstrap_admin_created`, and `test_accounts_seeded` audit evidence; production `BOOTSTRAP_SETUP_KEY` has been removed. The admin-only seed endpoint rejects unauthenticated calls with 401 and student calls with 403. `/api/auth/complete-reset` completes reset-required credential rotation with audit/session coverage; `/api/admin/users/:id/require-password-reset` lets admins require reset on another active/reset-pending account; `/api/auth/change-password` lets active signed-in users rotate known credentials, closes other active sessions by issuing a fresh session, and audits success/denial; `/api/admin/users/import` now imports pending-reset users with generated one-time temporary credentials, initial role assignment, duplicate/scope validation, and redacted import audits. `workspace.js` renders both the reset completion panel and a signed-in Security panel. Cloudflare live verification passes and Drive root/index probes now pass with corrected IDs, but Drive upload remains blocked by Google Drive HTTP 403. Broader auth/permission tests, hosted/import UI proof or email-delivery policy, and production meeting/presentation workflow code remain incomplete.
- `next action`: Broaden tests for permission helpers, protected evidence access, status transitions, audit/export controls, meeting attendance, and presentation-slot conflicts; then add hosted/admin UI proof for import/provisioning or the first admin/progress vertical slice while consuming active Figma contracts.
- `last updated`: 2026-05-21 00:09 PT

### SC-006

- `severity`: P0
- `owner`: rebuild
- `status`: in-progress
- `source`: Bryan Day 7 alpha deadline request
- `affected area`: full app-flow alpha without production user accounts
- `evidence`: Bryan needs a full-fledged alpha by Day 7. For planning, Day 1 is Monday, 2026-05-18 and the alpha gate is end of day Sunday, 2026-05-24 PT. Production user accounts may remain incomplete, but the whole app flow must work through seeded/demo personas or a clearly labeled role switcher. The first D1-backed seeded alpha flow is deployed at `alpha.html` with `/api/alpha/state`, covering student proposal/evidence submit, teacher revision/approval, mentor meeting/presentation risk, admin export/deadline notice, misc-admin read-only report, dashboard aggregates, audit/activity, evidence validation, and permission denial. Four fake `.test` role accounts are also login-verified for student, program teacher, mentor, and misc-admin walkthroughs, with credentials stored only in ignored `.secrets/`. `docs/alpha-week-framework.md`, `scripts/check-alpha-contract.mjs`, `scripts/verify-cadence-30min.ps1`, `npm run check`, `npm run deploy:preview`, and `.github/workflows/ci.yml` now define the week plan and alpha/automation verification rail.
- `next action`: Deepen the alpha into real workflow endpoints and add the known-gaps file, broader permission tests, mobile/error/empty QA, invitation/import, generated/temporary credential policy if needed, and Drive upload credential/OAuth implementation.
- `acceptance check`: A reviewer can run the app and complete student -> teacher review -> revision/resubmission -> approval -> dashboard/audit update without real accounts or code edits, while the UI clearly labels alpha account/security shortcuts and avoids real student data.
- `last updated`: 2026-05-18 12:45 PT

### SC-007

- `severity`: P0
- `owner`: rebuild
- `status`: in-progress
- `source`: 2026-05-20 P0 production app/website gate
- `affected area`: canonical production app route and public Student/Teacher website modes
- `evidence`: `docs/master-plan.md` defines the P0 Production Experience Gate with two production deliverables: a role-aware secure app and a public website with Student Guide / Teacher Guide modes. `docs/mvp-requirements-catalog.md` adds `MVP-031` through `MVP-040`; `docs/production-surface-registry.md` now names `workspace.html` as the canonical protected app route and keeps `alpha.html`, `account.html`, and `app-preview.html` non-canonical. `docs/source-materials/production-content-crosswalk.md` maps the Senior booklet, Senior Guide, Mentor Teacher Guide, Research Proposal Challenge, and Cycle Linked Document into website/app/evidence gaps. `app.js`, `styles.css`, and generated `public-companion/` implement the public Student/Teacher guide top-banner mode with visible current mode label, `aria-pressed`, public `senior-capstone-guide-mode` preference storage, and visible guide summary cards. `workspace.html`, `workspace.js`, and `workspace.css` implement sign-in/session restore, account-state blockers, role-aware dashboards, evidence link submission, and file upload wired to production APIs. Stakeholder option CTAs now point to the protected workspace instead of internal alpha QA. `scripts/check-production-surfaces.mjs` checks exact guide-toggle markers and workspace files, while `tests/workspace-app.test.mjs` covers workspace route/API/copy/storage guardrails plus session-expired, account-disabled, reset-required, role-pending, permission-denied, and no-active-assignment states. Local credential-backed workspace smoke covers student/role/no-assignment behavior, and in-app browser proof covers no-role and unassigned-mentor UI with zero console errors.
- `next action`: Broaden no-hidden-core-content coverage proof across the public route set, verify the newest workspace account-state/no-assignment markers after hosted deployment, add live section-level permission-denied browser coverage, then verify Drive upload/download once live secrets are available.
- `acceptance check`: Public website exposes Student Guide and Teacher Guide modes with visible source-aligned content; canonical app route renders from authenticated role/scope rather than alpha/smoke/preview/persona switching; production-copy, generated-output, and workspace tests pass.
- `last updated`: 2026-05-20 15:45 PT
