# Technical Proof Checklist

## Local Commands

Run from `C:\SeniorProjectApp1.0`:

```powershell
npm run seed:demo:local:reset
npm run prove:demo:local
npm run prove:sales-demo:local
npm run test
npm run typecheck
npm run check
npm run check:production-surfaces
```

Expected pass conditions:

- Local seed creates 3 fake sites and 370 fake students.
- Desert Valley High School has 250 fake students.
- Canyon Ridge Career Academy and North Valley Technical High School have 60 fake students each.
- No announcements are created.
- No student credentials are created by the multisite demo seed.
- Route proof covers dashboard, directory, detail/timeline, review queue, mentor assignments, and operations readiness.
- Viewer read-only proof passes.
- Program teacher scoping proof passes.
- Redaction checks pass for Drive IDs, storage IDs, token/password/setup fields, and unsafe audit metadata.

## Route / Screen Matrix

| Demo screen | Route(s) | Test file | Local proof command | Hosted proof status | Notes |
| --- | --- | --- | --- | --- | --- |
| Site Dashboard | `/api/site/dashboard` | `tests/site-dashboard.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; FAKE-ACCOUNT BROWSER PROVEN | Hosted proof shows primary-site students through the route; the 2026-06-29 browser proof captures Site Admin on the assigned-school dashboard. |
| Student Directory | `/api/site/students` | `tests/site-students.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; VIEWER BROWSER PROVEN | Hosted proof finds story rows through the route; the 2026-06-29 browser proof captures Viewer on the read-only directory boundary. |
| Student Detail | `/api/site/students/:studentId` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; HISTORICAL BROWSER SCREENSHOT | Hosted proof renders a story student detail response with timeline preview; the 2026-06-29 screenshot set focuses on role first-load surfaces. |
| Timeline | `/api/site/students/:studentId/timeline` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; HISTORICAL BROWSER SCREENSHOT | Hosted proof returns timeline events for a story student; the 2026-06-29 screenshot set focuses on role first-load surfaces. |
| Review Queue | `/api/site/review-queue` | `tests/site-review-queue.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; PROGRAM TEACHER SCREENSHOT | Hosted proof sees submitted and revision-requested demo rows; the 2026-06-29 browser proof captures the Program Teacher dashboard entry point. |
| Review Decision | `/api/reviews/:submissionId/decision` | `tests/site-review-queue.integration.test.mjs` | Integration tests | NOT RUN REMOTELY | Mutations stay integration-tested; Phase 13C remote proof is read-only. |
| Mentor Assignments | `/api/site/mentor-assignments` | `tests/site-mentor-assignments.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; SITE ADMIN SCREENSHOT | Hosted proof sees Missing Mentor coverage rows; the 2026-06-29 browser proof captures Site Admin access to the assigned-school workspace. |
| Operations Readiness | `/api/site/operations-readiness` | `tests/site-operations-readiness.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; ADMIN/MISC SCREENSHOTS | Hosted proof sees archive failed, archive ready, presentation pending, and high-risk story worklists; the 2026-06-29 browser proof captures Admin and misc_admin first-load boundaries. |
| Viewer read-only | Multiple site routes | `tests/site-aware-permissions.test.mjs`, `tests/workspace-app.test.mjs` | `npm run prove:demo:local` | DATA PROVEN; FAKE-ACCOUNT BROWSER PROVEN | Hosted viewer login and read-only directory screenshot are captured in the 2026-06-29 hosted browser proof. |
| No announcements | Workspace/source/seed checks | `tests/production-workflow-source.test.mjs`, `tests/workspace-app.test.mjs`, seed tests | `npm run prove:demo:local` | REMOTE PROVEN | Remote D1 proof reports 0 demo announcements. |
| Redaction | All demo routes | Integration/source tests | `npm run prove:sales-demo:local` | REMOTE API PROVEN; FAKE-ACCOUNT BROWSER PROVEN | Hosted API proof found no raw Drive IDs/storage IDs/secrets; browser proof checks visible password values and secret-like rendered text. |
| Remote migration 0011 gate | Remote D1 schema | `tests/remote-migration-0011-gate.test.mjs` | `npm run prove:remote:migration-0011` | SCHEMA READY; legacy seed missing | Proves `sites`, `site_users`, `site_programs`, new roles, sandbox site, sandbox site-program mappings, and no FK violations; `npm run prove:sales-demo:hosted` currently reports the legacy synthetic remote seed is missing. |
| Route inventory | `docs/generated/production-route-inventory.md` | `tests/production-workflow-source.test.mjs` | `npm run check:route-inventory` | NO ROUTE CHANGES | Current API surface documented; Phase 13C did not add/remove product routes. |

## Roles Proven Locally

- Platform admin and legacy admin can inspect active site operations.
- Organization admin can inspect assigned tenant sites.
- Site Administration can inspect assigned site operations and manage mentor assignments where permitted.
- Viewer is read-only.
- Program teacher is program/cohort scoped and can review in-scope submitted work.
- Mentor is assigned-student only.
- Student self-service remains separate.
- Misc admin does not become site administration.

## Hosted Proof Gates

Remote migration 0011 gate:

```powershell
npm run prove:remote:migration-0011
```

Current hosted fake-account status:

```text
REMOTE_MIGRATION_0011_ALREADY_PRESENT
HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING
HOSTED_FAKE_ACCOUNT_PILOT_GREEN
GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF
```

Remote fake-data proof is ready at the data/API gate after:

1. Remote fake-data seed dry-run is clean.
2. Remote fake-data seed write is explicitly approved.
3. Hosted smoke proof uses only fake `.test` credentials.
4. Final no-secret and no-real-data scans pass.

Hosted browser proof status:

```text
GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF
SCREENSHOTS_GENERATED_SAFE
HOSTED_FAKE_ACCOUNTS_USED_FOR_BROWSER_PROOF
```

Fake-account hosted pilot limits:

1. `student_archive_manifest_download` remains `skipped_not_ready`.
2. Destructive or mutation-heavy workflow actions stay integration/API-proven, not browser-clicked.
3. Generated remote staff credential files are not the walkthrough credential source.
4. Real-student production still needs SSO, support, retention, data ownership, and policy approval work.

Previous schema blocker status before Phase 13B:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```
