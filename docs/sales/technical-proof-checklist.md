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
| Site Dashboard | `/api/site/dashboard` | `tests/site-dashboard.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Selected-site summary and 250/60/60 counts. |
| Student Directory | `/api/site/students` | `tests/site-students.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Filters, pagination, story/risk, no cross-site leakage. |
| Student Detail | `/api/site/students/:studentId` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Bounded sections and redaction. |
| Timeline | `/api/site/students/:studentId/timeline` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Rich Timeline Demo event types. |
| Review Queue | `/api/site/review-queue` | `tests/site-review-queue.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Program teacher scoped mutation is integration-tested. |
| Review Decision | `/api/reviews/:submissionId/decision` | `tests/site-review-queue.integration.test.mjs` | Integration tests | BLOCKED: remote D1 migration 0011 | Approve, revision, comment-only for in-scope submitted work. |
| Mentor Assignments | `/api/site/mentor-assignments` | `tests/site-mentor-assignments.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | GET proof is local; assign mutation is integration-tested. |
| Operations Readiness | `/api/site/operations-readiness` | `tests/site-operations-readiness.integration.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Presentation, archive, readiness worklists. |
| Viewer read-only | Multiple site routes | `tests/site-aware-permissions.test.mjs`, `tests/workspace-app.test.mjs` | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Mutation permissions false. |
| No announcements | Workspace/source/seed checks | `tests/production-workflow-source.test.mjs`, `tests/workspace-app.test.mjs`, seed tests | `npm run prove:demo:local` | BLOCKED: remote D1 migration 0011 | Announcement routes/UI/seeds remain removed. |
| Redaction | All demo routes | Integration/source tests | `npm run prove:sales-demo:local` | BLOCKED: remote D1 migration 0011 | No raw Drive/storage/secrets in route proof. |
| Route inventory | `docs/generated/production-route-inventory.md` | `tests/production-workflow-source.test.mjs` | `npm run check:route-inventory` | BLOCKED: remote D1 migration 0011 | Current API surface documented. |

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

Hosted proof is BLOCKED until:

1. Remote D1 has migration `0011_multisite_site_role_foundation.sql`.
2. Remote fake-data seed dry-run is clean.
3. Remote fake-data seed write is explicitly approved.
4. Hosted smoke proof uses only fake `.test` credentials.
5. Browser/screenshot proof is captured and labeled by environment/date.
6. Final no-secret and no-real-data scans pass.
