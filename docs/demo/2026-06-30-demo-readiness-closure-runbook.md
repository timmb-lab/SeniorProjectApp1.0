# Demo Readiness And Migration Closure Runbook

Date: 2026-06-30

Repo: `C:\SeniorProjectApp1.0`

Branch: `main`

Starting commit for this closure pass: `fd5f0f655e45e73fe23fac9ccc1b6bf7687d9a7d`

Part 3 lock-pass starting commit: `576600f9a01fa07727f2924342f601ea794faa99`

## Final Demo-Day Lock

Use `docs/sales/demo-day-operator-script.md` as the canonical live hosted walkthrough. This migration closure runbook preserves the 2026-06-30 repair history and proof context; do not start the live demo from this document.

Demo-day proof commands:

```powershell
npm run check:pilot-readiness
npm run prove:demo:local
npm run check:workspace:hosted-permissions
npm run check:workspace:hosted-dashboard
npm run check:workspace:hosted-evidence
npm run prove:hosted-fake-pilot-browser
npm run prove:sales-demo:hosted
```

Claims boundary:

- Allowed: Hosted fake-account click-around demo readiness is green when the hosted proof gates pass.
- Allowed: local/demo proof gates passed when `npm run prove:demo:local` is green.
- Not allowed: real-student pilot approval, legal/security/privacy/retention approval, archive manifest download readiness, or fake `.test` proof as real roster proof.
- Expected real-student pilot answer: NO-GO until `docs/sales/real-student-pilot-readiness-gap-analysis.md` and `docs/sales/real-student-pilot-proof-plan.md` evidence requirements are satisfied.

No-go stop conditions live in `docs/sales/demo-day-operator-script.md`: hosted app unreachable, fake role login failure, role boundary proof failure, Viewer mutation, Student staff/admin exposure, unauthorized Admin Console exposure, View as Student mutation or scope bypass, missing migration health signal, or stale/missing proof artifacts.

## Migration Requirement

Migration `migrations/0016_student_roster_profiles.sql` is required before any environment should create or import students with roster profile fields. For the current hosted demo, treat it as an already-applied Health signal to verify through `/api/health`, not as a live-demo migration step.

The migration creates:

- `student_roster_profiles.student_user_id`
- `student_roster_profiles.cohort`
- `student_roster_profiles.graduation_year`
- `student_roster_profiles.created_at`
- `student_roster_profiles.updated_at`
- index `idx_student_roster_profiles_graduation_year`

Historical repair path used during the closure pass:

```powershell
npm run db:migrate:remote
```

Do not run this during demo day unless a separate approved migration/deployment gate exists.

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
- Existing deployed `/api/health` omitted `studentRosterProfilesReady` before this code was pushed.
- After pushing this closure pass, hosted health flipped to `studentRosterProfilesReady=true` on poll attempt 5.

## Hosted Proof Status

Hosted fake-account browser proof command:

```powershell
npm run prove:hosted-fake-pilot-browser
```

The proof remains Hosted fake-account click-around demo readiness only. It is not a Real-student production pilot readiness claim.

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

Run from `C:\SeniorProjectApp1.0`. The list below is retained as closure-pass proof context; for live operation, use the shorter preflight sequence in `docs/sales/demo-day-operator-script.md`.

```powershell
node --check workspace.js
node --check scripts/prove-hosted-fake-pilot-browser.mjs
node --test tests/student-roster-profiles-migration.test.mjs tests/site-students.integration.test.mjs tests/site-access-assignments.integration.test.mjs tests/admin-users-import.integration.test.mjs tests/hosted-browser-proof-gate.test.mjs tests/account-and-evidence-access.test.mjs
npm run check:pilot-readiness
npm test
npm run typecheck
npm run check
npm run prove:demo:local
npm run prove:sales-demo:hosted
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
- `npm run prove:hosted-fake-pilot-browser`: passed before push; the pre-deploy manifest recorded `studentRosterProfilesReady` as `not_reported_by_deployed_health`.
- `npm run prove:hosted-fake-pilot-browser`: passed again after push/deploy; the manifest recorded `studentRosterProfilesReady=true`.
- `npm run check:workspace:hosted-evidence`: passed.
- `npm run check:workspace:hosted-dashboard`: initially failed before remote migration 0016 with a viewer-directory HTTP 500, then passed after remote migrations 0015 and 0016 were applied.
- `npm run check:workspace:hosted-permissions`: initially failed before remote migration 0016 with the same viewer-directory HTTP 500, then passed after remote migrations 0015 and 0016 were applied.
- `git diff --check`: passed.
