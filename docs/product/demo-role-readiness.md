# Demo Role Readiness

This file is the durable role-by-role demo readiness scorecard for the Functionality UX Upgrade lane. Future product runs should refresh it from current repo evidence, focused validation, and safe hosted proof when available.

## 1. Timestamp

- Last updated: `2026-05-31T20:46:10-07:00`

## 2. Starting SHA

- `1ad1400c3a84e81ef584385d21211e35633a8d11`

## 3. Ending SHA

- Pending closeout commit for the automation-contract upgrade run.

## 4. Current Role Readiness Table

| Role | Status | Default landing section | Current top gap |
| --- | --- | --- | --- |
| Global Admin | PARTIALLY READY | Admin/Site Dashboard workspace surfaces | Needs a fresh role scorecard pass that confirms current click-throughs and global-versus-site boundaries together. |
| Site Admin | PARTIALLY READY | Site Dashboard and Users & Access | Lacks a confirmed real Programs management GUI path for assigned-school setup. |
| Administration | PARTIALLY READY | Site Dashboard read/monitor surfaces | Needs a distinct read-only role pass that proves no security/review dead ends remain. |
| Program Teacher | PARTIALLY READY | Program Teacher Dashboard | Needs another queue-depth pass for any missing-submission or intervention workflow gaps. |
| Mentor | PARTIALLY READY | Mentor Dashboard | Needs hosted/live proof plus continued mentor-support workflow review beyond assigned-student focus filters. |
| Viewer | NEEDS LIVE HOSTED TEST | Site Dashboard read-only surfaces | Needs live section-level permission proof to confirm no hidden mutation or dead-end drift. |
| Student | PARTIALLY READY | Student Dashboard | Needs another full scorecard pass to confirm current student drill-downs, evidence states, and feedback flows together. |

## 5. Role-By-Role Visible Sections

- Global Admin: Site Dashboard, Student Directory, Review Queue, Mentor Assignments, Operations, Users & Access, Mentor Dashboard, Student Dashboard, presentation and archive surfaces, plus global-only admin sections where currently backed.
- Site Admin: Site Dashboard, Student Directory, Review Queue, Mentor Assignments, Operations, Users & Access, student detail, presentation and archive surfaces for the assigned school.
- Administration: Site Dashboard, Student Directory, read-only student detail, Review Queue and Operations only where current helper-backed visibility already allows safe monitoring.
- Program Teacher: Program Teacher Dashboard, scoped Student Directory, scoped student detail, scoped Review Queue, scoped Operations, presentation schedule when current routes allow.
- Mentor: Mentor Dashboard, assigned-student detail, mentor meetings, shared presentation schedule entries visible through existing mentor scope.
- Viewer: Site Dashboard read-only monitoring surfaces, read-only Student Directory/detail, read-only Review Queue, read-only Mentor Coverage, read-only Operations.
- Student: Student Dashboard, own submissions/evidence, own feedback history, own archive/presentation readiness, own requirement detail.

## 6. Role-By-Role Loaded API Routes

- Global Admin: `/api/site/dashboard`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/site/access-assignments`, `/api/student/dashboard`, `/api/mentor/dashboard`, presentation and archive routes, plus current admin-backed routes.
- Site Admin: `/api/site/dashboard`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/site/access-assignments`, student detail/timeline routes, presentation and archive routes.
- Administration: current helper-backed site dashboard, student directory/detail, review queue, and operations routes only where read-only access is already supported.
- Program Teacher: `/api/program-teacher/dashboard`, scoped `/api/site/students`, scoped `/api/site/review-queue`, scoped `/api/site/operations-readiness`, student detail/timeline routes when currently authorized.
- Mentor: `/api/mentor/dashboard`, `/api/mentor/assigned`, `/api/mentor/meetings`, assigned-student detail/timeline routes when currently authorized.
- Viewer: read-only `/api/site/dashboard`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, student detail/timeline routes where viewer access is already helper-backed.
- Student: `/api/student/dashboard`, own submission/evidence routes, own review-history routes, own archive readiness, own presentation schedule visibility.

## 7. Role-By-Role Allowed Actions

- Global Admin: cross-surface monitoring, current admin-backed access management, review and operational drill-downs, global-only navigation where the route already exists.
- Site Admin: assigned-school access changes, mentor coverage management, review/operations drill-downs, student detail drill-downs, assigned-school monitoring.
- Administration: read-only monitoring, student detail drill-downs, queue/operations review where helper-backed; no destructive controls.
- Program Teacher: scoped review decisions, scoped student detail, scoped queue and operations drill-downs, presentation-day follow-up where already route-backed.
- Mentor: assigned-student follow-up, mentor meeting records, mentor dashboard focus changes, assigned-student detail and meeting-history drill-downs.
- Viewer: read-only monitoring only; can open assigned/scoped read-only detail paths but cannot mutate records.
- Student: open own requirement detail, open own submission/feedback timelines, add evidence, and send existing own work for review where current routes already support it.

## 8. Role-By-Role Forbidden Or Hidden Actions

- Global Admin: should not be reduced to mentor-only or program-teacher-only scope on shared staff surfaces.
- Site Admin: no global security ownership changes, no other-school management, no fake Audit or Export links when no site-scoped surface exists.
- Administration: no security controls, no account resets, no user-management dead links, no mutation controls that current APIs do not allow.
- Program Teacher: no global security or user management, no off-program student access, no unbacked mentor assignment controls.
- Mentor: no self-assignment, no unrelated student visibility, no broader directory access, no privileged user/program management.
- Viewer: no review mutation, no mentor assignment mutation, no user/program/security management, no role-visible dead links to forbidden sections.
- Student: no staff-only notes, no other-student data, no staff/admin controls, no unsafe storage or audit metadata.

## 9. Demo Data Readiness

- Current scorecard baseline still needs a dedicated seeded-data pass for Site Admin Programs coverage, viewer assigned-student coverage, and any role that could appear empty only because test accounts lack records.
- Future runs should explicitly mark `NEEDS SEEDED DATA` when the real blocker is missing assigned students, missing programs, or missing review/evidence examples rather than a broken workflow.
- High-value demo states to keep visible: at least one no-mentor student, one submitted review row, one needs-revision row, one evidence-attached row, one evidence-missing row, and presentation/archive follow-up examples.

## 10. Hosted/Live Test Readiness

- Hosted section-level permission proof still depends on allowed fake-account runtime and audit-event writes.
- Viewer is the clearest `NEEDS LIVE HOSTED TEST` role today because read-only section proof benefits most from live navigation evidence.
- Future runs should use safe hosted proof when configured, but should not block bounded source-level improvements when hosted access is unavailable.

## 11. Known Issues Fixed This Run

- Added the durable scorecard file required by the automation lane so future runs have one stable place to record role-by-role status, visible sections, loaded routes, allowed actions, forbidden actions, seeded-data needs, and hosted-test needs.
- Upgraded the active automation prompt to require explicit role scorecard updates, click-through proof, no-visible-dead-end checks, Site Admin Programs review, seeded-data checks, and June 3, 2026 demo-readiness prioritization.

## 12. Known Issues Still Open

- Site Admin Programs management still needs a dedicated repo-grounded implementation or blocker pass.
- The first full role-by-role scorecard refresh under the upgraded prompt is still pending.
- Hosted section-level permission proof remains dependent on allowed fake-account runtime.

## 13. Validation Results

- Planned for this automation-contract slice: prompt/doc regression tests plus JSON/markdown closeout checks after edits.

## 14. Recommended Next Run Target

- Run the upgraded lane against a real role-focused product slice, starting with either Site Admin Programs readiness or the first full role scorecard refresh with click-through proof.
