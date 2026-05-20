# Senior Capstone Automation Memory

Date initialized: 2026-05-18
Last refreshed: 2026-05-20

This is the compact working memory for the Senior Capstone project-local automation loop. The project now has two alternating GUI-available delivery automations, `senior-capstone-nonfigma-mvp-builder` and `senior-capstone-figma-product-builder`, plus two oversight automations: `senior-capstone-daily-mvp-summary` and `senior-capstone-weekly-script-audit`. The non-Figma builder runs hourly at minute 0 PT, the Figma-only builder runs hourly at minute 30 PT, and both are governed by `automation/qol/project-lock.json`, `docs/automation-cadence.md`, and the active prompt files in `automation/prompts/`.

The legacy `senior-capstone-hourly-qol-orchestrator` ID is diagnostic/manual only and must not be counted as active builder capacity. No other Senior Capstone project delivery automation should be created, invoked, revived, or maintained from this repo unless Bryan explicitly asks for it.

## Product Target

Build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a secure database-backed operating system for users, groups, roles, programs, cohorts, progress updates, private upload/evidence spaces, student submissions, mentor/teacher review, revision requests, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records.

Urgent alpha gate: count 2026-05-18 as Day 1; by end of day Sunday, 2026-05-24 PT, Bryan needs a full-fledged alpha where the whole app flow works through seeded/demo personas or a clearly labeled role switcher. Production user accounts may remain incomplete for alpha, but student, teacher, mentor, admin, misc-admin, proposal, evidence metadata, review/revision/approval, dashboard, audit/activity, export/archive, mobile student, error/empty/permission flows should work well enough to walk through.

This is not a static guide, brochure, or visual-only project.

## Current State

- Repository contains the Cloudflare Pages Functions/D1 scaffold under `functions/`, `migrations/`, `package.json`, `wrangler.jsonc`, and `.dev.vars.example`.
- Day 7 alpha flow exists at `alpha.html` with `/api/alpha/state` using D1 `app_settings` as a server-owned seeded demo-state layer for student, program teacher, mentor, admin, and misc-admin personas.
- Cloudflare Pages project `senior-capstone-app` and D1 database `senior-capstone-db` are provisioned, and migration `migrations/0001_foundation.sql` has been applied remotely.
- Hardened username/password bootstrap, login, logout, and session lookup endpoints exist. First-admin bootstrap is complete for `bryan.timm89@gmail.com`.
- Auth edge-state integration coverage now exists for `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`, including disabled, reset-required, invalid login, session expiry, and logout revocation: `tests/auth-login.integration.test.mjs`.
- Four fake `.test` alpha accounts are seeded for walkthrough testing. Credentials are only in ignored `.secrets/` files and must not be copied into docs, commits, screenshots, Figma, Canva, or chat.
- Google Drive evidence repository root folder `1XPgYKbIMqv332DAJZJNJetHppFB670e7` and index sheet `1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c` exist and are wired into Pages config and D1 metadata. Service-account JWT token exchange helper exists (`functions/_lib/google-drive.ts`) plus authenticated/audited `/api/evidence/drive-probe` integration tests, and Drive-backed evidence file upload + streaming download routes (`/api/submissions/:id/evidence/upload`, `/api/evidence/:id/download`) with local integration tests covering token exchange/provider failures, redaction, denied-access (including misc-admin), and the >5MB resumable upload path (upload cap now 20MB); real Cloudflare-secret verification is still pending.
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
- Submission version persistence now exists for the review loop: migration `migrations/0005_submission_versions.sql` adds immutable `submission_versions`; `/api/submissions/:id/submit` snapshots each submitted/resubmitted version with redacted evidence metadata; `/api/reviews/:submissionId/history` returns versions alongside reviews/status history; `tests/review-loop.integration.test.mjs` proves version 1 and version 2 survive revision/resubmission/approval.
- Student submissions now block on missing evidence: `/api/submissions/:id/submit` returns 409 `submission_missing_evidence` (audited) until at least one `evidence_artifacts` row is attached; coverage lives in `tests/review-loop.integration.test.mjs`.
- Mentor meeting persistence foundation now exists: migration `migrations/0004_mentor_meetings.sql` plus authenticated mentor meeting record/list route `/api/mentor/meetings` with assignment-scope enforcement, audit events, and integration coverage in `tests/mentor-meetings.integration.test.mjs`.

## Active Automation Contract

- Active top-of-hour non-Figma MVP builder: `senior-capstone-nonfigma-mvp-builder`.
- Active bottom-of-hour Figma-only product builder: `senior-capstone-figma-product-builder`.
- Active report-only daily summary: `senior-capstone-daily-mvp-summary`.
- Active weekly strategy review: `senior-capstone-weekly-script-audit`.
- Non-Figma cadence: `FREQ=HOURLY;BYMINUTE=0;BYSECOND=0`.
- Figma cadence: `FREQ=HOURLY;BYMINUTE=30;BYSECOND=0`.
- Capacity: 24 non-Figma starts/day, 24 Figma starts/day, 48 combined starts/day, and 1,440 combined scheduled starts in 30 days.
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
- Combined capacity remains 48 starts/day.
- Figma-only lane owns `MVP-028` and functional design handoffs.
- Non-Figma lane owns implementation, tests, deployment, data, docs, Canva-only work, automation safety, and blockers.
- Daily and weekly automations remain oversight, not builder capacity.
- External scheduler may still require manual configuration unless a repo-local scheduler config exists and is changed with evidence.

## Current Priority

Immediate next useful passes:

1. Broaden auth, permission, protected-evidence, status-transition, audit/export, meeting, and presentation-slot tests.
2. Extend alpha proposal/review/evidence/audit records into real workflow endpoints.
3. Add Google Drive server-side credential/OAuth implementation plus access-controlled evidence upload/retrieval assumptions.
4. Implement account provisioning/import, invitation, password reset, credential rotation, and known-gaps QA.
5. Keep mobile/error/empty/permission alpha QA current while the Day 7 walkthrough hardens.

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
- `SC-004`: mentor meetings, presentation scheduling, celebration evidence, archive/export workflows.
- `SC-005`: P0 Cloudflare stack/auth/database/user-group/progress/private-upload scaffold is in progress with Pages/D1/migrations/auth endpoints, password/session pepper secrets, Drive root folder configured, D1-backed alpha flow, state-machine tests, alpha contract checks, CI, production alpha deployment, verified first-admin bootstrap, and login-verified fake role test accounts; broader permission tests, account lifecycle, and Drive upload credentials remain.
- `SC-006`: P0 Day 7 full app-flow alpha due 2026-05-24 PT; production user accounts may be incomplete, and the first D1-backed seeded alpha flow plus fake login-capable role accounts now exist.

## Known External Artifact Memory

- Canva folder: `FAHJ-n-VqFE`.
- Canva asset: `DAHJ-v7TOM8`, proposal approval process strip, no-text 1600x500.
- Active Figma product UI file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6` (`z4t4tFPAKrMDh6pIYOeEw6`), team id `1638213362346160913`.
- Key Figma implementation contract nodes: `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, and full MVP alpha prototype page `98:2`.
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
