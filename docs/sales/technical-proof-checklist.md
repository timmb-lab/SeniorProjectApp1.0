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
| Site Dashboard | `/api/site/dashboard` | `tests/site-dashboard.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof shows 250 primary-site students through the route; browser proof used existing fake hosted admin fallback. |
| Student Directory | `/api/site/students` | `tests/site-students.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof finds Missing Mentor and Rich Timeline story rows; browser proof searched Rich Timeline. |
| Student Detail | `/api/site/students/:studentId` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof renders a story student detail response with timeline preview. |
| Timeline | `/api/site/students/:studentId/timeline` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof returns timeline events for a story student; browser proof opened the timeline section. |
| Review Queue | `/api/site/review-queue` | `tests/site-review-queue.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof sees submitted and revision-requested demo rows; browser proof used existing fake hosted program teacher credentials. |
| Review Decision | `/api/reviews/:submissionId/decision` | `tests/site-review-queue.integration.test.mjs` | Integration tests | NOT RUN REMOTELY | Mutations stay integration-tested; Phase 13C remote proof is read-only. |
| Mentor Assignments | `/api/site/mentor-assignments` | `tests/site-mentor-assignments.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof sees Missing Mentor coverage rows; browser proof filtered Missing Mentor and did not submit assignment mutation. |
| Operations Readiness | `/api/site/operations-readiness` | `tests/site-operations-readiness.integration.test.mjs` | `npm run prove:demo:local` | REMOTE API PROVEN; BROWSER PROVEN WITH CAVEATS | Hosted proof sees archive failed, archive ready, presentation pending, and high-risk story worklists; browser proof filtered archive failed and presentation pending. |
| Viewer read-only | Multiple site routes | `tests/site-aware-permissions.test.mjs`, `tests/workspace-app.test.mjs` | `npm run prove:demo:local` | DATA PROVEN; BROWSER PERSONA BLOCKED | D1 proof verifies viewer persona exists; hosted viewer session proof is blocked because the safe existing fake hosted credential file has no viewer account and generated remote staff credentials fail hosted login. |
| No announcements | Workspace/source/seed checks | `tests/production-workflow-source.test.mjs`, `tests/workspace-app.test.mjs`, seed tests | `npm run prove:demo:local` | REMOTE PROVEN | Remote D1 proof reports 0 demo announcements. |
| Redaction | All demo routes | Integration/source tests | `npm run prove:sales-demo:local` | REMOTE API PROVEN; browser pending | Hosted API proof found no raw Drive IDs/storage IDs/secrets. |
| Remote migration 0011 gate | Remote D1 schema | `tests/remote-migration-0011-gate.test.mjs` | `npm run prove:remote:migration-0011` | SCHEMA READY; seed present | Proves `sites`, `site_users`, `site_programs`, new roles, sandbox site, sandbox site-program mappings, no FK violations, and remote seed present. |
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

Expected Phase 13C status:

```text
REMOTE_MIGRATION_0011_ALREADY_PRESENT
HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING
REMOTE_DEMO_SEED_APPLIED_HOSTED_BROWSER_PROOF_PENDING
```

Remote fake-data proof is ready at the data/API gate after:

1. Remote fake-data seed dry-run is clean.
2. Remote fake-data seed write is explicitly approved.
3. Hosted smoke proof uses only fake `.test` credentials.
4. Final no-secret and no-real-data scans pass.

Phase 14 hosted browser proof status:

```text
HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS
SCREENSHOTS_GENERATED_SAFE
EXISTING_FAKE_HOSTED_CREDENTIALS_USED_FOR_BROWSER_PROOF
```

Hosted browser proof remains caveated until:

1. Generated remote persona login behavior is resolved without credential leakage.
2. A safe fake hosted viewer credential path is available and viewer read-only is browser-proven.
3. Mentor browser proof can show assigned-student rows rather than the fallback no-active-assignment state.

Previous schema blocker status before Phase 13B:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```
