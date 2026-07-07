# 2026-07-07 V6 Until-3PM Screenshot Review

Status: in progress; refreshed after slices 01-18.

Source artifacts:

- V5 final proof: `docs/progress/runs/2026-07-07-6h-v5-real-gui-overhaul-final-proof.md`
- V5 screenshot index: `docs/sales/v5-real-gui-overhaul-screenshot-index.md`
- V5 browser manifest: `docs/progress/runs/2026-07-07-v5-real-gui-overhaul-browser-proof.json`
- V5 screenshot folder: `docs/sales/screenshots/2026-07-07-v5-real-gui-overhaul/`

## Review Method

- Read V5 proof and screenshot inventory.
- Inspect representative desktop, mobile, and half-screen images across Student, Mentor, Program Teacher, Viewer, Admin/Site Admin, Reports, and mobile flows.
- Convert findings into safe V6 implementation targets.
- Do not treat this review as completion; it must feed real implementation.

## Initial Opportunities To Validate Visually

1. Student Today: confirm next action is dominant enough on phone and half-screen.
2. Student My Work: verify work cards do not bury upload/continue action.
3. Student Feedback: verify revision/feedback path is first, not history metadata.
4. Student Final Checklist: verify final-file guidance does not feel like admin closeout.
5. Student admin-blocked state: verify recovery action is plain and obvious.
6. Mentor Today: verify assigned-student priority is visible without roster overload.
7. Mentor Dashboard: verify metrics lead to real filters and do not read like static stats.
8. Mentor assigned-student desktop: verify first student action is above details.
9. Mentor assigned-student phone: verify primary button stack is reachable.
10. Program Teacher Today: verify review-next action is visible above program summary.
11. Program Teacher Review Work: verify decision hierarchy is clear.
12. Program Teacher missing-proof state: verify approval lock reads as guidance, not failure.
13. Program Dashboard phone: verify review cues fit without crowding.
14. Viewer Today: verify read-only status feels intentional.
15. Viewer Students directory: verify owner/next-action guidance is visible.
16. Viewer Reports: verify summary-only paths do not look like disabled tools.
17. Site Admin Overview: verify first setup issue is distinguishable from supporting counts.
18. Admin People: verify staff/student/import choices are not too many equal buttons.
19. Admin Students: verify setup flags are explained before rows.
20. Admin Assignments: verify mentor/viewer/program lanes read as a guided flow.
21. Admin Programs: verify add/remove context avoids control-panel feel.
22. Admin Imports: verify template, preview, and fix flow is clear on phone.
23. Admin Reports: verify report questions and chart text equivalents are readable on phone.
24. Admin Audit: verify audit is support/review, not a primary daily workflow.
25. Mobile drawer/switcher: verify the header does not push role-specific work too far down.
26. Half-screen Admin Students: verify rows/actions do not overflow or crowd.
27. Reports across roles: verify exported CSV boundaries remain obvious and non-technical.
28. Technical language sweep: verify primary UI does not expose API, payload, mutation, database, debug, fake, seed, or token language.
29. Dead UI cleanup: verify old left-rail/card-wall/control-panel remnants are not active.
30. Demo path: verify there is a concise route-backed demo sequence across Student, Mentor, Program Teacher, Viewer, Admin, and Reports.

## Selected V6 Targets

- Mobile first-viewport hardening for student and staff role landing screens.
- Program Teacher, Viewer, School Admin, and Mentor Today plans should lead before shared Staff Workspace guidance.
- CSV import preview results should appear before the long form after validation.
- Report exports should state the current allowed-view boundary before download buttons.
- Admin Console pages should show their real section content before shared start-state guidance.
- Student My Work, Feedback, and Final Checklist should show their actual route content before shared start-state guidance.
- Admin page header overflow menus should name the section-specific action set rather than saying only `Actions`.
- Role Today plans should not repeat the primary route card immediately in the secondary card grid.
- Loaded student-detail routes should use record-specific framing instead of generic Admin setup or list-start framing.
- Runtime program/cohort labels should not expose exact demo seed markers in primary UI.
- Hidden Admin student-search routes should show the real student directory, including empty-search recovery, rather than generic setup fallback copy.
- Viewer Reports should lead with report review, not a generic Viewer frame that sends the reader back to Students.
- Report export boundary copy should stay privacy-preserving while avoiding internal phrases such as `current admin view`, `storage links`, and `no IDs`.
- Admin Imports should read as a CSV preview workflow, not generic import tooling or generic help.

## Refresh 02 Spot Checks

- `30-mobile-mentor-today.png`: Mentor Today now shows the assigned-student plan inside the first phone viewport.
- `42-mobile-admin-reports.png`: Mobile Admin Reports opens with the report path and export cards instead of shell guidance.
- `04-mentor-workspace.png`: Desktop Mentor Today shows the role plan ahead of the shared Staff Workspace header.

## Refresh 03 Spot Checks

- `43-student-my-work-phone.png`: My Work content and Continue action now lead before shared guidance.
- `54-student-feedback-phone.png`: Feedback content and View Work action now lead before shared guidance.
- `55-student-final-checklist-phone.png`: Final Checklist content and Continue My Work action now lead before shared guidance.

## Refresh 04 Spot Checks

- `68-mobile-admin-people.png`: Admin People now shows `More people actions` instead of a generic `Actions` button.
- `17-people-access-landing.png`: desktop Admin People follows the same named action menu pattern.
- `35-admin-reports.png`: Admin Reports remains green with the named report action menu.

## Refresh 05 Spot Checks

- `48-site-admin-today-phone.png`: the secondary grid starts with review work, not a second copy of the student support route.
- `30-mobile-mentor-today.png`: the secondary grid starts with the assigned-student list, not a second copy of the Mentor Dashboard route.
- `49-program-teacher-today-phone.png`: the secondary grid starts with revision support, not a second copy of the review route.

## Refresh 06 Spot Checks

- `23-student-detail-phone.png`: hidden Admin student detail now shows `Review this student record` and `Record before setup`; the earlier generic `Open tools` / `Focused admin task` block is gone.
- `13-site-admin-student-detail-click.png`: desktop Admin detail keeps the record-first context on the scoped Admin Console route.
- `14-viewer-read-only-detail-click.png`: Viewer detail keeps the record-first context and still exposes the read-only boundary.
- `31-mobile-student-detail.png`: Workspace student detail on phone uses `Record before lists` before the detail tabs and supporting context.

## Refresh 07 Spot Checks

- `13-site-admin-student-detail-click.png`: student detail context now shows `Culinary - Desert Valley High School Class of 2027`, with no `DEMO_SEED` marker.
- `23-student-detail-phone.png`: phone detail context keeps the cleaned program/school/year label in the first viewport.
- `39-viewer-students-directory.png` and `46-mobile-viewer-students.png`: Viewer student rows no longer expose `IT / DEMO_SEED`.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.

## Refresh 08 Spot Checks

- `21-empty-student-search.png`: hidden Admin student search now renders the route-connected student directory empty state with `No matching student search results` and `Clear filters`.
- `16-view-as-student-exited-return.png`: exiting View as Student returns to the real Admin student search/directory surface instead of generic setup guidance.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.

## Refresh 09 Spot Checks

- `74-viewer-reports-desktop.png`: Viewer Reports now starts with `Answer one report question`, `Open report`, and `Report-safe fields` instead of the generic `Open students` frame.
- `39-viewer-students-directory.png`: Viewer Students now starts with `Open one assigned student` before the read-only directory.
- `46-mobile-viewer-students.png`: mobile Viewer Students keeps the assigned-student frame and read-only boundary.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.

## Refresh 10 Spot Checks

- `42-mobile-admin-reports.png`: Admin mobile report copy now uses `visible to this admin role` instead of `current admin view`.
- `63-site-admin-reports-phone.png`, `65-administration-reports-phone.png`, and `67-global-admin-reports-phone.png`: staff report states keep the same route-backed report flow with friendlier export-boundary wording.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `current admin view`, `storage links`, or `no IDs`: `0`.

## Refresh 11 Spot Checks

- `19-csv-import-template.png`: desktop Admin Imports now shows `Open CSV checklist`.
- `38-mobile-admin-imports.png`: mobile Admin Imports now shows `Template columns and example` instead of `CSV help`.
- `76-csv-import-preview-errors.png` and `77-mobile-csv-import-preview-errors.png`: preview-error states keep row-level validation while using the CSV preview frame.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `CSV help`, `Open import tools`, or `Guided setup flow`: `0`.
