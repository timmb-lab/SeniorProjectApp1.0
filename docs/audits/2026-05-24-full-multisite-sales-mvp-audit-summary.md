# Full Multisite Sales MVP Audit Summary

Date: 2026-05-24

Starting HEAD: `2c5735c36977a401512bfa41feeca425070c357a`

## Bottom Line

The repo is on the right MVP path, but it is not ready for a school or district sales demo yet.

Phases 1 through 6.5 have built the correct foundation: the sales MVP contract is explicit, the additive multisite schema exists, announcements are removed from the active MVP surface, site-aware permission helpers are in place, realistic fake multisite data is locally seeded/proven, Figma source context has been inspected, and the visual gaps are documented.

The strongest blocker is not a lack of direction. It is that the route-connected product demo is not complete yet:

- No site admin dashboard route/UI yet.
- No student directory route/UI yet.
- No student detail route/UI yet.
- Remote D1 still lacks migration `0011_multisite_site_role_foundation.sql`.
- The authenticated workspace still does not fully match the actual Figma product control center.

## What Is Proven

- Local Phase 2 migration proof for the site/role foundation.
- Announcement removal from active workspace/API route inventory/demo seed creation.
- Site-aware permission helper behavior for platform admin, legacy admin, org admin, site admin, viewer, program teacher, mentor, student, and misc admin.
- Local Desert Valley School District seed/proof with 3 fake sites, 370 fake students, no student credentials, no announcements, and story buckets.
- Existing dashboard/review/presentation/archive/import/role-assignment routes have useful integration/source coverage.
- Phase 6.5 inspected live Figma read-only for file `z4t4tFPAKrMDh6pIYOeEw6`, page `0:1`, node `2:5`; live Figma was not edited.

## What Is Not Proven

- Remote multisite D1 behavior.
- Remote seed/write/proof.
- Site admin dashboard behavior.
- Student directory and detail behavior.
- Hosted browser screenshot proof for the future demo screens.
- Full Figma visual alignment in the authenticated app.
- Real user onboarding, credential delivery, SSO/domain cutover, or pilot compliance posture.

## Main Blockers

1. Remote D1 needs migration `0011` before Phase 5B remote seed/proof.
2. The site admin dashboard must be built before an administrator sales demo is credible.
3. Phase 6.5 found the workspace is only partially Figma-aligned.
4. Student directory and detail are still future work.
5. Real user/pilot policy is still out of scope and unresolved.

## Recommendation

Run `06.6_design_cleanup_before_dashboard.txt` before `07_site_admin_dashboard.txt`.

Phase 6.6 should be small and safe:

- Add exact Figma token aliases.
- Add the dark product header pattern.
- Add gold eyebrow/product context text.
- Add posture chips.
- Complete status chips.
- Add reason/owner/next-action problem-state UI.
- Clean up empty/permission-denied copy.
- Add tests.
- Do not add routes or run remote operations.

Then Phase 7 should build the site admin dashboard using the Figma operating-view pattern and site-aware route requirements.

## Go / No-Go

| Area | Decision |
| --- | --- |
| Phase 7 immediately | No-go |
| Phase 7 after Phase 6.6 | Go |
| Remote migration `0011` now | No-go |
| Remote seed 5B now | No-go |
| Sales demo today | No-go |
| Exact next prompt | `06.6_design_cleanup_before_dashboard.txt` |

## Phase 7 Update

After Phase 6.6, Phase 7 added the first route-connected administration surface:

- `/api/site/dashboard` is implemented and tested independently from legacy `/api/admin/dashboard`.
- The route proves local Desert Valley site scoping: Desert Valley High School returns 250 students, and each secondary site returns 60 students.
- The authenticated workspace renders a Figma-aligned Site Dashboard for platform, organization, site-administration, legacy admin, and viewer roles.
- Viewer dashboard access is read-only and mutation permissions are disabled.
- Student directory and student detail are still not built; Phase 8 should build on the site dashboard route foundation.

Updated next prompt after Phase 7: `08_student_directory_api_ui.txt`.

## Phase 8 Update

After Phase 7, Phase 8 added the route-connected site-scoped Student Directory:

- `/api/site/students` is implemented and tested independently from legacy admin/program/mentor/student dashboards.
- The route proves local Desert Valley directory scoping: Desert Valley High School has 250 total unfiltered matching students, Canyon Ridge Career Academy has 60, and North Valley Technical High School has 60, while returned rows respect pagination.
- Default `limit` is 50, maximum `limit` is 100, offset pagination changes the returned set, and `filteredTotal` tracks filter matches before pagination.
- Canonical filters are implemented for status, story, risk, presentation status, and archive status. Missing mentor, revision requested, and archive failed story filters are proven against the seeded story buckets.
- Viewer directory access is read-only with mutation permissions disabled.
- Program teacher directory access is safely scoped to selected-site program students and does not expose full-site counts.
- The authenticated workspace renders a Figma-aligned Students section with filters, result counts, story/risk chips, status pills, problem-state empty handling, and disabled `Detail view coming soon` row controls only.
- Student detail is still not built; Phase 9 should build on the directory route and filter vocabulary.

Updated next prompt after Phase 8: `09_student_detail_timeline_ui.txt`.

## Phase 9 Update

After Phase 8, Phase 9 added the site-scoped Student Detail and Timeline drill-down:

- `/api/site/students/:studentId` is implemented and tested independently from legacy dashboards and student self-service.
- `/api/site/students/:studentId/timeline` is implemented as the separate full timeline route; the detail route carries only a `timelinePreview` capped at 10 events.
- Detail sections are bounded: submissions 5, evidence 10, reviews 10, comments 10, status history 10, mentor meetings 5, and timeline preview 10.
- The route reuses Phase 8 canonical story/status/presentation/archive vocabulary and resolves story proof students by seeded display-name prefixes.
- Viewer detail access is read-only with mutation permissions disabled; program teacher detail access is scoped to selected-site program students; mentor detail access is assigned-student only; student and misc admin are denied.
- Cross-site and out-of-scope requests use generic denial/not-found responses without leaking whether the student exists elsewhere.
- Evidence, archive, and timeline responses avoid raw Drive IDs, storage IDs, credentials, token/password fields, and unsafe raw audit metadata.
- The authenticated workspace Students rows now open a Figma-aligned detail drawer with Summary, Progress, Submissions, Evidence, Reviews & Comments, Mentor, Presentation, Archive, and Timeline sections. Directory filters, search, pagination, and selected site are preserved when opening and closing detail.
- No review decision, mentor assignment, archive retry/export, user-management, download, or messaging mutation UI was added.

Updated next prompt after Phase 9: `10_program_teacher_review_workflow.txt`.

## Phase 10 Update

After Phase 9, Phase 10 added the site-aware Program Teacher Review Workflow:

- `/api/site/review-queue` is implemented and tested as a selected-site queue with default limit 50, max limit 100, status/program/search/story/risk filters, summary counts, and no global queue fallbacks.
- Program teacher access is scoped to selected-site program/cohort students and can approve, request revision, or add comment-only feedback only for in-scope submitted submissions.
- Site admin, org admin, platform admin, legacy admin, and viewer workspace queue views are read-only in the new site Review Queue UI; legacy admin backend decision compatibility remains preserved.
- `/api/reviews/:submissionId/decision` and `/api/reviews/:submissionId/history` now support optional `siteId` validation so selected-site membership and program-teacher scope are checked before mutation or history readback.
- Review decisions continue to write review/comment/status/progress/status-history/audit records, and review history remains bounded.
- Queue, history, decision, and workspace output avoid raw Drive IDs, storage IDs, token/password/setup credential fields, full private evidence URLs, and unsafe audit metadata.
- The workspace renders a Figma-aligned Review Queue with filters, queue rows, selected submission panel, bounded history, teacher feedback controls for allowed program teachers, read-only role explanations, and queue/student-detail refresh behavior after successful decisions.
- No mentor assignment, archive retry/export, user-management, remote migration/write/seed, deploy, domain/OAuth/Cloudflare config change, announcement, or student messaging UI was added.

Updated next prompt after Phase 10: `11_mentor_assignment_workflow.txt`.

## Phase 11 Update

After Phase 10, Phase 11 added the site-scoped Mentor Assignment Workflow:

- `/api/site/mentor-assignments` is implemented and tested as a selected-site mentor coverage route with default limit 50, max limit 100, program/mentor/student-search/status/no-mentor filters, summary counts, and no global mentor-dashboard fallback.
- POST supports only the MVP assignment mutation: assign one active same-site mentor to one currently unassigned active same-site student with a required reason.
- Duplicate active assignments are prevented with a conflict response; reassign and deactivate are deferred rather than shown as fake UI controls.
- Site admin can manage assigned-site mentor assignments; platform admin, legacy admin, and org admin follow the existing capability helper; viewer and program teacher are read-only; mentor, student, and misc admin are denied from the management route.
- Assignment responses, audit metadata, local proof output, and workspace UI avoid raw Drive IDs, storage IDs, token/password/setup credential fields, credentials, and user-management metadata.
- The workspace renders a Figma-aligned Mentor Assignments section with filters, summary tiles, mentor coverage rows, unassigned-student rows, active assignment rows, read-only role explanations, and assign-only controls for authorized managers.
- Successful assignment refreshes the mentor assignment section and loaded site dashboard, student directory, and open student detail state without resetting directory filters or pagination.
- No mentor meeting mutation, archive retry/export, user-management, remote migration/write/seed, deploy, domain/OAuth/Cloudflare config change, announcement, or student messaging UI was added.

Updated next prompt after Phase 11: `12_presentation_archive_reports.txt`.

## Phase 12 Update

After Phase 11, Phase 12 added Presentation, Archive, and Readiness Worklists:

- `/api/site/operations-readiness` is implemented and tested as a combined selected-site operations route with default limit 50, max limit 100, presentation/archive/readiness/story/risk/program filters, summary counts, and no global presentation/archive/report fallbacks.
- Primary-site scope proves exactly 250 selected-site students; each secondary site proves 60 selected-site students.
- Archive Failed Demo, Archive Ready Demo, Presentation Pending Demo, High Risk Demo, and Rich Timeline Demo rows are proven through worklist filters and row-to-detail integration.
- Viewer and program teacher views are read-only; program teacher rows are scoped to teacher-visible selected-site students. Mentor, student, and misc admin are denied from the site operations route.
- Archive/export rows, audit metadata, local proof output, and workspace UI avoid raw Drive IDs, storage IDs, full private URLs, token/password/setup credential fields, credentials, and unsafe audit metadata.
- The workspace renders a Figma-aligned Operations section with Presentation, Archive, and Readiness panels, filters, summary tiles, story/risk/status chips, read-only explanations, and real student-detail drawer actions.
- No presentation scheduling, check-in/check-out, archive retry/export, reporting export, user-management, remote migration/write/seed, deploy, domain/OAuth/Cloudflare config change, announcement, or student messaging UI was added.

Updated next prompt after Phase 12: `13_sales_demo_runbook_and_hosted_proof.txt`.

## Phase 13 Update

After Phase 12, Phase 13 packaged the local fake-data MVP into a sales-demo runbook and proof plan:

- Added `docs/sales/demo-runbook.md`, administrator demo script, FAQ, one-page leave-behind, technical proof checklist, preflight checklist, data dictionary, hosted-proof plan, and screenshot checklist.
- Added `npm run prove:sales-demo:local` as a non-mutating local proof summary for the sales-demo route/screen package.
- Added `npm run prove:sales-demo:hosted` as a read-only hosted gate that reports blocked status instead of running migrations, seed writes, deploys, or config changes.
- Documentation labels claims as Proven locally, Fake-data demo only, Hosted proof blocked, Planned / future, or Not claimed.
- Hosted proof remains blocked until remote D1 has migration `0011_multisite_site_role_foundation.sql` and remote fake-data proof is explicitly approved and run.

Updated next prompt after Phase 13: `13B_remote_migration_0011_gate.txt`.
