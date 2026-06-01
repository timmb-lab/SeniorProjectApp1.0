# Demo Role Readiness

This file is the durable role-by-role demo readiness scorecard for the Functionality UX Upgrade lane. Future product runs should refresh it from current repo evidence, focused validation, and safe hosted proof when available.

## 1. Timestamp

- Last updated: `2026-05-31T21:11:22-07:00`

## 2. Starting SHA

- `4046ecb0d90e0715bd7b190267eab0e25ed37e6c`

## 3. Ending SHA

- Pending closeout commit for the Site Admin Programs management run.

## 4. Current Role Readiness Table

| Role | Status | Default landing section | Current top gap |
| --- | --- | --- | --- |
| Global Admin | PARTIALLY READY | Admin/Site Dashboard workspace surfaces | Needs a fresh role scorecard pass that confirms current click-throughs and global-versus-site boundaries together, now including cross-site Programs management. |
| Site Admin | PARTIALLY READY | Site Dashboard and Users & Access | Needs a seeded-data and click-through proof pass for the new Programs setup workflow at assigned schools. |
| Administration | PARTIALLY READY | Site Dashboard read/monitor surfaces | Needs a distinct read-only role pass that proves no security/review dead ends remain. |
| Program Teacher | PARTIALLY READY | Program Teacher Dashboard | Needs another queue-depth pass for any missing-submission or intervention workflow gaps. |
| Mentor | PARTIALLY READY | Mentor Dashboard | Needs hosted/live proof plus continued mentor-support workflow review beyond assigned-student focus filters. |
| Viewer | NEEDS LIVE HOSTED TEST | Site Dashboard read-only surfaces | Needs live section-level permission proof to confirm no hidden mutation or dead-end drift. |
| Student | PARTIALLY READY | Student Dashboard | Needs another full scorecard pass to confirm current student drill-downs, evidence states, and feedback flows together. |

## 5. Role-By-Role Visible Sections

- Global Admin: Site Dashboard, Programs, Student Directory, Review Queue, Mentor Assignments, Operations, Users & Access, Mentor Dashboard, Student Dashboard, presentation and archive surfaces, plus global-only admin sections where currently backed.
- Site Admin: Site Dashboard, Programs, Student Directory, Review Queue, Mentor Assignments, Operations, Users & Access, student detail, presentation and archive surfaces for the assigned school.
- Administration: Site Dashboard, Student Directory, read-only student detail, Review Queue and Operations only where current helper-backed visibility already allows safe monitoring.
- Program Teacher: Program Teacher Dashboard, scoped Student Directory, scoped student detail, scoped Review Queue, scoped Operations, presentation schedule when current routes allow.
- Mentor: Mentor Dashboard, assigned-student detail, mentor meetings, shared presentation schedule entries visible through existing mentor scope.
- Viewer: Site Dashboard read-only monitoring surfaces, read-only Student Directory/detail, read-only Review Queue, read-only Mentor Coverage, read-only Operations.
- Student: Student Dashboard, own submissions/evidence, own feedback history, own archive/presentation readiness, own requirement detail.

## 6. Role-By-Role Loaded API Routes

- Global Admin: `/api/site/dashboard`, `/api/site/programs`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/site/access-assignments`, `/api/student/dashboard`, `/api/mentor/dashboard`, presentation and archive routes, plus current admin-backed routes.
- Site Admin: `/api/site/dashboard`, `/api/site/programs`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/site/access-assignments`, student detail/timeline routes, presentation and archive routes.
- Administration: current helper-backed site dashboard, student directory/detail, review queue, and operations routes only where read-only access is already supported.
- Program Teacher: `/api/program-teacher/dashboard`, scoped `/api/site/students`, scoped `/api/site/review-queue`, scoped `/api/site/operations-readiness`, student detail/timeline routes when currently authorized.
- Mentor: `/api/mentor/dashboard`, `/api/mentor/assigned`, `/api/mentor/meetings`, assigned-student detail/timeline routes when currently authorized.
- Viewer: read-only `/api/site/dashboard`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, student detail/timeline routes where viewer access is already helper-backed.
- Student: `/api/student/dashboard`, own submission/evidence routes, own review-history routes, own archive readiness, own presentation schedule visibility.

## 7. Role-By-Role Allowed Actions

- Global Admin: cross-surface monitoring, current admin-backed access management, cross-site program mapping changes, review and operational drill-downs, global-only navigation where the route already exists.
- Site Admin: assigned-school access changes, site program add/remove changes, mentor coverage management, review/operations drill-downs, student detail drill-downs, assigned-school monitoring.
- Administration: read-only monitoring, student detail drill-downs, queue/operations review where helper-backed; no destructive controls.
- Program Teacher: scoped review decisions, scoped student detail, scoped queue and operations drill-downs, presentation-day follow-up where already route-backed.
- Mentor: assigned-student follow-up, mentor meeting records, mentor dashboard focus changes, assigned-student detail and meeting-history drill-downs.
- Viewer: read-only monitoring only; can open assigned/scoped read-only detail paths but cannot mutate records.
- Student: open own requirement detail, open own submission/feedback timelines, add evidence, and send existing own work for review where current routes already support it.

## 8. Role-By-Role Forbidden Or Hidden Actions

- Global Admin: should not be reduced to mentor-only or program-teacher-only scope on shared staff surfaces.
- Site Admin: no global security ownership changes, no other-school management, no fake Audit or Export links when no site-scoped surface exists, and no program changes outside the assigned school.
- Administration: no security controls, no account resets, no user-management dead links, no mutation controls that current APIs do not allow.
- Program Teacher: no global security or user management, no off-program student access, no unbacked mentor assignment controls.
- Mentor: no self-assignment, no unrelated student visibility, no broader directory access, no privileged user/program management.
- Viewer: no review mutation, no mentor assignment mutation, no user/program/security management, no role-visible dead links to forbidden sections.
- Student: no staff-only notes, no other-student data, no staff/admin controls, no unsafe storage or audit metadata.

## 9. Demo Data Readiness

- Current scorecard baseline still needs a dedicated seeded-data pass for the new Site Admin Programs workflow, viewer assigned-student coverage, and any role that could appear empty only because test accounts lack records.
- Future runs should explicitly mark `NEEDS SEEDED DATA` when the real blocker is missing assigned students, missing programs, or missing review/evidence examples rather than a broken workflow.
- High-value demo states to keep visible: at least one no-mentor student, one submitted review row, one needs-revision row, one evidence-attached row, one evidence-missing row, and presentation/archive follow-up examples.

## 10. Hosted/Live Test Readiness

- Hosted section-level permission proof still depends on allowed fake-account runtime and audit-event writes.
- Viewer is the clearest `NEEDS LIVE HOSTED TEST` role today because read-only section proof benefits most from live navigation evidence.
- Future runs should use safe hosted proof when configured, but should not block bounded source-level improvements when hosted access is unavailable.

## 11. Known Issues Fixed This Run

- Added a real Site Admin and Global Admin `Programs` workspace section backed by `/api/site/programs`, with safe site-scoped add/remove mapping controls against `site_programs.active` and no role expansion.
- Added focused route, workspace, permission, and navigation verifier coverage for the new Programs management path.

## 12. Known Issues Still Open

- The first full role-by-role scorecard refresh under the upgraded prompt is still pending.
- The new Programs workflow still needs a seeded-data/demo-account pass that proves useful add/remove options for Site Admin test accounts.
- Hosted section-level permission proof remains dependent on allowed fake-account runtime.

## 13. Validation Results

- Current local validation passed for the Programs slice: focused route/workspace/permission tests, `npm run verify:dashboard-actions`, `npm run verify:review-queue-deeplinks`, `npm run verify:workspace-navigation`, `npm run verify:functionality-language`, `npm run inventory:production-routes`, `npm run test`, `npm run typecheck`, and `npm run check`.

## 14. Recommended Next Run Target

- Run the upgraded lane against the next real role-focused slice by proving seeded Site Admin Programs behavior end-to-end, then refresh the first full role scorecard with Administration and Viewer click-through proof.
