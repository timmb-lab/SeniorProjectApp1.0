# Demo Readiness And Migration Closure Runbook

Date: 2026-06-30

Repo: `C:\SeniorProjectApp1.0`

Branch: `main`

Starting commit for this closure pass: `fd5f0f655e45e73fe23fac9ccc1b6bf7687d9a7d`

## Migration Requirement

Migration `migrations/0016_student_roster_profiles.sql` is required before any environment should create or import students with roster profile fields.

The migration creates:

- `student_roster_profiles.student_user_id`
- `student_roster_profiles.cohort`
- `student_roster_profiles.graduation_year`
- `student_roster_profiles.created_at`
- `student_roster_profiles.updated_at`
- index `idx_student_roster_profiles_graduation_year`

Apply through the normal D1 migration flow:

```powershell
npm run db:migrate:remote
```

Use the health endpoint after deploy/migration:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri https://senior-capstone-app.pages.dev/api/health
```

Expected migration readiness signal after this pass deploys: `studentRosterProfilesReady=true`.

Safe behavior:

- Existing student directory and Users & Access reads render legacy students with blank roster profile fields if the table is not present yet.
- Student create/import blocks before mutation with `student_roster_profiles_migration_required` if `0016` is missing.
- Missing roster profile rows render as empty `cohort` and `graduationYear` values.

Closure result on 2026-06-30:

- Remote migration list initially showed `0015_remove_org_admin_role.sql` and `0016_student_roster_profiles.sql` pending.
- Remote role-count readback showed zero `org_admin` assignments before applying `0015`.
- Ran `npm run db:migrate:remote` with the configured Cloudflare account id; Wrangler applied `0015` and `0016`.
- Re-ran `npx wrangler d1 migrations list senior-capstone-db --remote`; result: no migrations to apply.
- Re-ran remote schema readback; `student_roster_profiles` exists.
- Existing deployed `/api/health` still omitted `studentRosterProfilesReady` before this code was pushed, so the new health field must be verified after the deploy containing this closure pass goes live.

## Hosted Proof Status

Hosted fake-account browser proof command:

```powershell
npm run prove:hosted-fake-pilot-browser
```

The proof remains fake-account hosted click-through proof only. It is not a real-student production pilot claim.

The browser proof now records a redacted `/api/health` summary in its manifest. If hosted health explicitly reports `studentRosterProfilesReady=false`, the proof status is `HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016`.

## Demo Roles

Use fake `.test` roles only:

- Student
- Viewer
- Mentor
- Program Teacher
- Administration
- Site Admin
- Global Admin when using the protected global/admin path

Do not show passwords, `.secrets`, Cloudflare tokens, OAuth secrets, raw D1 tables, raw Drive IDs, or credential files.

## Exact Demo Path

1. Signed-out landing page: open `workspace.html` signed out and confirm the clean sign-in surface.
2. Student workspace: sign in as Student and show only the student workspace, own work, deadlines, proof, feedback, and presentation/final files paths.
3. Viewer read-only proof: sign in as Viewer, open Students, confirm read-only state and no mutation controls.
4. Mentor assigned-student proof: sign in as Mentor, open Mentor Dashboard, confirm assigned students only.
5. Program Teacher scoped student proof: sign in as Program Teacher, open Program Dashboard, Students, and Review Queue, confirm program-scoped access and no broad People screens.
6. Administration People proof: sign in as Administration, open People/Users & Access flows for scoped school operations.
7. Site Admin People/Assignments/Programs proof: sign in as Site Admin, show Students, Users & Access, Programs, and scoped staff/student management.
8. View as Student proof: use only allowed staff contexts, confirm entry/exit state, and keep the viewed student mode read-only where applicable.
9. CSV import preview/validation proof: show the People import preview, validation errors, roster fields, mentor/viewer assignment fields, and success/error feedback without exposing generated passwords in a demo.
10. Safe denial examples: show signed-out auth state, student denial for admin routes, viewer mutation denial, and unauthorized deep-link safety.

## Do Not Demo Yet

- Real student data.
- FERPA/legal/security certification.
- Billing, procurement, or district approval.
- Archive retry/export mutation UI as a completed workflow.
- Presentation scheduling/check-in/check-out mutation UI as part of the Operations surface.
- Tenant-owned Drive migration unless separately approved and proven.
- Any hosted environment where `/api/health` reports `studentRosterProfilesReady=false`.

## Validation Commands

Run from `C:\SeniorProjectApp1.0`.

```powershell
node --check workspace.js
node --check scripts/prove-hosted-fake-pilot-browser.mjs
node --test tests/student-roster-profiles-migration.test.mjs tests/site-students.integration.test.mjs tests/site-access-assignments.integration.test.mjs tests/admin-users-import.integration.test.mjs tests/hosted-browser-proof-gate.test.mjs tests/account-and-evidence-access.test.mjs
npm test
npm run typecheck
npm run check
npm run prove:demo:local
npm run verify:workspace-navigation
npm run verify:workspace-url-state
npm run verify:dashboard-actions
npm run verify:review-queue-deeplinks
npm run verify:permission-matrix
npm run verify:mutation-origin
npm run verify:functionality-language
npm run verify:workspace-density
npm run check:workspace-mobile
npm run check:workspace-accessibility
npm run check:workspace-errors
npm run check:route-inventory
npm run check:production-surfaces
npm run prove:hosted-fake-pilot-browser
npm run check:workspace:hosted-evidence
npm run check:workspace:hosted-dashboard
npm run check:workspace:hosted-permissions
git diff --check
git diff --cached --check
```

Current focused validation status:

- `node --check workspace.js`: passed.
- `node --check scripts/prove-hosted-fake-pilot-browser.mjs`: passed.
- Focused migration/roster/admin/hosted-doc route tests listed above: passed, 36 passing tests.
- Full local `npm test`: passed, 463 tests total, 459 passed, 4 skipped.
- `npm run typecheck`: passed.
- `npm run check`: passed.
- `npm run prove:demo:local`: passed.
- Navigation, URL state, dashboard actions, review queue deep links, permission matrix, mutation origin, functionality language, workspace density, mobile, accessibility, workspace errors, route inventory, and production surfaces verifiers listed above: passed.
- `npm run prove:hosted-fake-pilot-browser`: passed; manifest recorded `studentRosterProfilesReady` as `not_reported_by_deployed_health` because the hosted deployment had not yet included this closure code.
- `npm run check:workspace:hosted-evidence`: passed.
- `npm run check:workspace:hosted-dashboard`: initially failed before remote migration 0016 with a viewer-directory HTTP 500, then passed after remote migrations 0015 and 0016 were applied.
- `npm run check:workspace:hosted-permissions`: initially failed before remote migration 0016 with the same viewer-directory HTTP 500, then passed after remote migrations 0015 and 0016 were applied.
- `git diff --check`: passed.
