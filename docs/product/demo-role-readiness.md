# Demo Role Readiness

This file is the durable role-by-role demo readiness scorecard for the Functionality UX Upgrade lane. Future product runs should refresh it from current repo evidence, focused validation, and safe hosted proof when available.

## 1. Timestamp

- Last updated: `2026-05-31T21:52:15-07:00`

## 2. Starting SHA

- `aec0ef4209f95f97fd9493c6f6736599bf982741`

## 3. Ending SHA

- Pending closeout commit for the Site Admin Programs denial-proof expansion and Administration/Viewer readiness refresh run.

## 4. Current Role Readiness Table

| Role | Status | Default landing section | Current top gap |
| --- | --- | --- | --- |
| Global Admin | PARTIALLY READY | Admin/Site Dashboard workspace surfaces | Needs one more pass that confirms current click-throughs and global-versus-site boundaries together, now including cross-site Programs visibility. |
| Site Admin | PARTIALLY READY | Site Dashboard, Programs, and Users & Access | Local seeded proof now confirms reversible remove-then-add Programs setup, but the default demo site still opens with no addable program on first load. |
| Administration | PARTIALLY READY | Site Dashboard read/monitor surfaces | Local proof now confirms this role is read-only on monitoring surfaces and denied from Site Programs, but it still needs a broader click-through pass across Site Dashboard, Students, Operations, Presentation, and Readiness together. |
| Program Teacher | PARTIALLY READY | Program Teacher Dashboard | Needs another queue-depth pass for any missing-submission or intervention workflow gaps. |
| Mentor | PARTIALLY READY | Mentor Dashboard | Needs hosted/live proof plus continued mentor-support workflow review beyond assigned-student focus filters. |
| Viewer | PARTIALLY READY | Overview monitoring + Student Directory | Local proof now confirms the read-only landing and Site Programs denial, but hosted click-through proof is still needed for final confidence. |
| Student | PARTIALLY READY | Student Dashboard | Needs another full scorecard pass to confirm current student drill-downs, evidence states, and feedback flows together. |

## 5. Role-By-Role Visible Sections

- Global Admin: Site Dashboard, Programs, Student Directory, Review Queue, Mentor Assignments, Operations, Users & Access, Mentor Dashboard, Student Dashboard, presentation and archive surfaces, plus global-only admin sections where currently backed.
- Site Admin: Site Dashboard, Programs, Student Directory, Review Queue, Mentor Assignments, Operations, Users & Access, student detail, presentation and archive surfaces for the assigned school.
- Administration: Site Dashboard, Student Directory, read-only student detail, Operations, Presentation, Readiness, and Account; the shell now shows this role as read-only monitoring.
- Program Teacher: Program Teacher Dashboard, scoped Student Directory, scoped student detail, scoped Review Queue, scoped Operations, presentation schedule when current routes allow.
- Mentor: Mentor Dashboard, assigned-student detail, mentor meetings, shared presentation schedule entries visible through existing mentor scope.
- Viewer: Overview monitoring panel plus read-only Student Directory/detail. The monitoring panel now opens exact Student Directory filters instead of denied Review Queue or Operations sections.
- Student: Student Dashboard, own submissions/evidence, own feedback history, own archive/presentation readiness, own requirement detail.

## 6. Role-By-Role Loaded API Routes

- Global Admin: `/api/site/dashboard`, `/api/site/programs`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/site/access-assignments`, `/api/student/dashboard`, `/api/mentor/dashboard`, presentation and archive routes, plus current admin-backed routes.
- Site Admin: `/api/site/dashboard`, `/api/site/programs`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/site/access-assignments`, student detail/timeline routes, presentation and archive routes.
- Administration: `/api/site/dashboard`, `/api/site/students`, student detail/timeline routes, `/api/site/operations-readiness`, `/api/presentation-slots`, and `/api/reports/readiness`. This role is locally proven to stay out of `/api/site/programs`.
- Program Teacher: `/api/program-teacher/dashboard`, scoped `/api/site/students`, scoped `/api/site/review-queue`, scoped `/api/site/operations-readiness`, student detail/timeline routes when currently authorized.
- Mentor: `/api/mentor/dashboard`, `/api/mentor/assigned`, `/api/mentor/meetings`, assigned-student detail/timeline routes when currently authorized.
- Viewer: `/api/site/students` plus student detail/timeline routes where viewer access is already helper-backed. Viewer default monitoring now reuses Student Directory filter state instead of loading denied sections, and local proof confirms `/api/site/programs` stays denied.
- Student: `/api/student/dashboard`, own submission/evidence routes, own review-history routes, own archive readiness, own presentation schedule visibility.

## 7. Role-By-Role Allowed Actions

- Global Admin: cross-surface monitoring, current admin-backed access management, cross-site program mapping changes, review and operational drill-downs, global-only navigation where the route already exists.
- Site Admin: assigned-school access changes, site program add/remove changes, mentor coverage management, review/operations drill-downs, student detail drill-downs, assigned-school monitoring.
- Administration: read-only monitoring, student detail drill-downs, operations/presentation/readiness follow-up, and assigned-school progress review; no destructive controls.
- Program Teacher: scoped review decisions, scoped student detail, scoped queue and operations drill-downs, presentation-day follow-up where already route-backed.
- Mentor: assigned-student follow-up, mentor meeting records, mentor dashboard focus changes, assigned-student detail and meeting-history drill-downs.
- Viewer: read-only monitoring only; can open assigned/scoped student lists and student detail paths, change in-page filters, and share filtered student-list URLs, but cannot mutate records.
- Student: open own requirement detail, open own submission/feedback timelines, add evidence, and send existing own work for review where current routes already support it.

## 8. Role-By-Role Forbidden Or Hidden Actions

- Global Admin: should not be reduced to mentor-only or program-teacher-only scope on shared staff surfaces.
- Site Admin: no global security ownership changes, no other-school management, no fake Audit or Export links when no site-scoped surface exists, and no program changes outside the assigned school.
- Administration: no security controls, no account resets, no user-management dead links, no review-approval surface that current helpers do not allow, no Site Programs access, and no mutation controls that current APIs do not allow.
- Program Teacher: no global security or user management, no off-program student access, no unbacked mentor assignment controls.
- Mentor: no self-assignment, no unrelated student visibility, no broader directory access, no privileged user/program management.
- Viewer: no review mutation, no mentor assignment mutation, no user/program/security management, no Site Programs access, no denied-section buttons on the default landing workflow, and no role-visible dead links to forbidden sections.
- Student: no staff-only notes, no other-student data, no staff/admin controls, no unsafe storage or audit metadata.

## 9. Demo Data Readiness

- The current local demo proof now covers Site Admin Programs end-to-end, but it does so with a reversible remove-then-restore cycle because the primary site starts with all nine current programs already active.
- Future runs should explicitly mark `NEEDS SEEDED DATA` when the real blocker is missing assigned students, missing programs, or missing review/evidence examples rather than a broken workflow.
- High-value demo states to keep visible: at least one no-mentor student, one submitted review row, one needs-revision row, one evidence-attached row, one evidence-missing row, presentation/archive follow-up examples, and at least one obvious first-load addable program if Programs setup is part of the demo.

## 10. Hosted/Live Test Readiness

- Hosted section-level permission proof still depends on allowed fake-account runtime and audit-event writes.
- Viewer remains the clearest role for live proof because the default read-only landing experience changed recently and still needs hosted click-through confirmation.
- Future runs should use safe hosted proof when configured, but should not block bounded source-level improvements when hosted access is unavailable.

## 11. Known Issues Fixed This Run

- Expanded the local `/api/site/programs` proof to cover Administration, Program Teacher, Mentor, Viewer, and Student denial alongside the existing Global Admin and Site Admin allowed paths.
- Added regression guards that keep the `Programs` workspace section limited to Global Admin and Site Admin through source assertions and workspace-navigation verification.
- Confirmed the existing Administration read-only shell boundary and Viewer monitoring landing continue to match the current local proof while Site Programs remains denied for both roles.

## 12. Known Issues Still Open

- A first-load addable Programs option is still missing from the primary demo site; the current proof is honest and reversible, but not yet the best live demo shape.
- The broader role-by-role refresh is still incomplete for Global Admin, Program Teacher, Mentor, and Student together, and Administration/Viewer still need hosted click-through confirmation.
- Hosted section-level permission proof remains dependent on allowed fake-account runtime.

## 13. Validation Results

- Current local validation passed for the refreshed slice, including focused Programs proof expansion plus broader repo validation before closeout: `node --test tests/site-programs.integration.test.mjs`, `node --test tests/workspace-app.test.mjs`, `node --test tests/access-v5-effective.test.mjs`, `npm run verify:dashboard-actions`, `npm run verify:review-queue-deeplinks`, `npm run verify:workspace-navigation`, `npm run verify:functionality-language`, `npm run inventory:production-routes`, `npm run check:route-inventory`, `node --test tests/functionality-language-audit.test.mjs`, `node scripts/prove-local-demo-workspace.mjs`, `npm run test`, `npm run typecheck`, `npm run check`, and `git diff --check`.

## 14. Recommended Next Run Target

- Improve the primary local demo seed so Site Admin Programs opens with at least one honest addable option on first load, then continue the full role-readiness refresh across Global Admin, Program Teacher, Mentor, and Student after the Administration/Viewer local proof baseline.
