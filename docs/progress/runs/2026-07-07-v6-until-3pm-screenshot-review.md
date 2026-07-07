# 2026-07-07 V6 Until-3PM Screenshot Review

Status: in progress; refreshed after slices 01-33.

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
- Student-detail status and framing should read like a record was opened, not like a backend payload loaded.
- Admin People should name the selected school or every school this account can manage instead of saying `inside the current view` or `global scope`.
- Report percentage and chart helper text should say which students or programs are counted instead of exposing the internal `denominator` term.
- Admin setup, report, audit, and readiness helper text should use visible/current/available language instead of backend-style loaded/unloaded wording.
- Non-CSV Admin, audit, report, and operations worklists should use records/work/events/items/lists instead of data-row jargon.

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

## Refresh 12 Spot Checks

- `13-site-admin-student-detail-click.png`: Admin student detail now says `Student detail opened` and `this student's status`.
- `14-viewer-read-only-detail-click.png`: Viewer read-only detail keeps the boundary while using the opened/this-student wording.
- `15-view-as-student-entered-desktop.png`: View as Student entry now says `Student view opened`.
- `41-student-detail-timeline.png`: timeline proof now says `Student timeline opened`.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.

## Refresh 13 Spot Checks

- `17-people-access-landing.png`: Admin People now says staff are managed for the selected school or every school this account can manage.
- `68-mobile-admin-people.png`: mobile Admin People uses the same selected-school/every-school copy.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `inside the current view`: `0`.

## Refresh 14 Spot Checks

- `35-admin-reports.png`: Admin Reports now says `Percentages say which students are counted`.
- `42-mobile-admin-reports.png`: mobile Admin Reports keeps the report picker and CSV download affordances with counted-students confidence copy.
- `29-workspace-reports.png` and `74-viewer-reports-desktop.png`: staff and Viewer reports keep the scoped report flow without internal denominator wording.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `denominator` or `Denominator`: `0`.

## Refresh 15 Spot Checks

- `17-people-access-landing.png`: Admin People now says `every school this account can manage`.
- `37-mobile-admin-overview.png` and `73-mobile-global-admin-overview.png`: Admin setup confirmation now says the item clears when `current records` confirm it.
- `71-mobile-admin-programs.png`: Admin Programs now says `No Program Teacher gaps in current assignments`.
- `68-mobile-admin-people.png`: mobile Admin People keeps the same school-facing people-management language.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `loaded` or `unloaded`: `0`.
- Manifest scan: screenshot text samples containing `global scope`: `0`.

## Refresh 16 Spot Checks

- `35-admin-reports.png`: Admin Reports now says `If a number needs follow-up`.
- `36-admin-audit.png` and `72-mobile-admin-audit.png`: Admin Audit now says `redacted events` and `Redacted events only`.
- `70-mobile-admin-assignments.png`: Admin Assignments now says `Administration and Site Admin access grants`.
- `71-mobile-admin-programs.png`: Admin Programs now says `Program Teacher assignments`.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `redacted rows`, `review rows`, `open stale rows`, or `assignment rows`: `0`.

## Refresh 17 Spot Checks

- Selected target: Admin People and Admin Students access summaries should say what this account can create and who owns Global Admin setup, instead of using generic `Allowed roles` and unavailable-account wording.
- `17-people-access-landing.png`: Admin People now shows `CAN CREATE` and `PLATFORM OWNER Required for Global Admin accounts`.
- `18-admin-students`: Admin Students keeps the same create/global-owner access summary.
- `68-mobile-admin-people.png`: mobile Admin People keeps the new wording in the access block.
- `69-admin-students-half-screen.png`: half-screen Admin Students keeps the same access-summary wording.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `Allowed roles`, `Not available from this account`, or `Global Admin Not available`: `0`.
- Manifest scan: screenshot text samples containing `loaded` or `unloaded`: `0`.
- Manifest scan: screenshot text samples containing `global scope`: `0`.

## Refresh 18 Spot Checks

- Selected target: role and Admin headers should give plain work guidance instead of describing screen construction or the V6 redesign.
- `02-workspace-site-admin-desktop.png`: Site Admin Today now says `Start with one student group, one student record, or one report question before opening supporting details`.
- `03-program-teacher-workspace.png`: Program Teacher Today now says `Start with the next submitted item, review the student's work, then save a decision`.
- `04-mentor-workspace.png` and `30-mobile-mentor-today.png`: Mentor surfaces now use assigned-student action language without `Mentor work starts with...`.
- `05-viewer-read-only-workspace.png`, `39-viewer-students-directory.png`, and `74-viewer-reports-desktop.png`: Viewer surfaces keep the read-only boundary without old screen-construction wording.
- `01-admin-console-global-admin-desktop.png`, `09-admin-console-half-screen.png`, `32-admin-console-site-admin-overview.png`, and `73-mobile-global-admin-overview.png`: Admin Overview now says `Start with the next setup issue, then open the exact fix and confirm it cleared`.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `screens now begin`, `route-backed task`, or `Secondary context stays closed`: `0`.
- Manifest scan: screenshot text samples containing `Teachers move from queue`, `without starting from metrics or system status`, or `Viewer screens are read-only and start`: `0`.
- Manifest scan: screenshot text samples containing `This view keeps the next action first`, `decode the app`, `Mentor work starts with the assigned student list`, or `Admin Console starts`: `0`.

## Refresh 19 Spot Checks

- Selected target: visible setup and work guidance should use task/item/work wording rather than generic `screen` wording.
- `01-admin-console-global-admin-desktop.png`, `09-admin-console-half-screen.png`, `32-admin-console-site-admin-overview.png`, and `73-mobile-global-admin-overview.png`: Admin Overview passed proof markers expecting `Open the exact setup item`.
- `02-workspace-site-admin-desktop.png`, `10-workspace-half-screen.png`, `26-administration-workspace-today.png`, and `27-global-admin-workspace-today.png`: staff headers now say `One focused task`.
- `24-student-my-work-desktop.png`, `43-student-my-work-phone.png`, and `53-student-my-work-half-screen.png`: Student My Work no longer says `Your work screen opens`.
- `35-admin-reports.png` and `42-mobile-admin-reports.png`: report-choice helper now says `linked setup item`.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `Your work screen opens`, `One focused screen`, or `Open the exact setup screen`: `0`.
- Manifest scan: screenshot text samples containing `setup screen`, `linked setup screen`, or `setup screens`: `0`.
- Manifest scan: screenshot text samples containing `One focused task`: `16`.
- Manifest scan: screenshot text samples containing `After that setup item is fixed`: `3`.

## Refresh 20 Spot Checks

- Selected target: staff/teacher/mentor/viewer plan labels and audit guidance should use work-path/source-area language instead of internal route/source-screen wording.
- `02-workspace-site-admin-desktop.png`, `10-workspace-half-screen.png`, `26-administration-workspace-today.png`, and `27-global-admin-workspace-today.png`: staff plans now use `Student support path`.
- `03-program-teacher-workspace.png` and `49-program-teacher-today-phone.png`: Program Teacher plan now uses `Review path`.
- `04-mentor-workspace.png` and `30-mobile-mentor-today.png`: Mentor plan now uses `Assigned-student path`.
- `05-viewer-read-only-workspace.png` and `50-viewer-today-phone.png`: Viewer plan now uses `Read-only path`.
- `36-admin-audit.png` and `72-mobile-admin-audit.png`: Admin Audit now uses `source area`.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Manifest scan: screenshot text samples containing `Route review work`, `Student support route`, `Review route`, `Assigned-student route`, or `Read-only route`: `0`.
- Manifest scan: screenshot text samples containing `source screen, then` or `source screen.`: `0`.
- Manifest scan: screenshot text samples containing `Student support path`, `Review path`, `Assigned-student path`, `Read-only path`, or `source area`: present.
- Direction update: future V6 work should prioritize Chromebook/desktop browser needs; mobile proof remains a guardrail.

## Refresh 21 Spot Checks

- Selected target: student Chromebook desktop browser flows should be explicit proof targets, not inferred from phone or wide-desktop screenshots.
- Added Chromebook-size proof at `1366x768` for Student Today, My Work, Feedback, and Final Checklist.
- `79-student-today-chromebook.png`: the Today card and next-step map are visible in the first viewport after tightening the student hero.
- `80-student-my-work-chromebook.png`: My Work header, status, Continue button, and Current work card are visible in the first viewport.
- `81-student-feedback-chromebook.png`: Feedback header, View Work button, and Needs changes card are visible in the first viewport.
- `82-student-final-checklist-chromebook.png`: Final Checklist header, Continue My Work button, and first finish-check row are visible in the first viewport.
- Manifest count: `82` screenshots total, including `32` mobile screenshots and `4` Chromebook/student desktop screenshots.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Direction update: desktop/Chromebook browser needs are the primary student target from here; mobile screenshots remain regression coverage.

## Refresh 22 Spot Checks

- Selected target: student Chromebook desktop browser proof should include shorter page viewports where browser chrome, shelf, or bookmark bars reduce available height.
- Added short Chromebook-size proof at `1366x650` for Student Today, My Work, Feedback, and Final Checklist.
- Added student-only `max-height: 700px` desktop CSS tightening for the step switcher, hero, primary action row, and primary-surface spacing.
- `83-student-today-chromebook-short.png`: Today work card, One thing now, teacher-review text, and Open item are visible in the short first viewport.
- `84-student-my-work-chromebook-short.png`: My Work header, Waiting for review, Continue, and Current work summary are visible in the short first viewport.
- `85-student-feedback-chromebook-short.png`: Feedback header, View Work, Needs changes, and no-action-needed note are visible in the short first viewport.
- `86-student-final-checklist-chromebook-short.png`: Final Checklist header, Continue My Work, Finish checks, and first proposal row are visible in the short first viewport.
- Manifest count: `86` screenshots total, including `32` mobile screenshots, `8` Chromebook/student desktop screenshots, and `4` short Chromebook/student desktop screenshots.
- Manifest scan: screenshot text samples containing `DEMO_SEED` or `seed`: `0`.
- Direction update: short Chromebook desktop browser proof is now first-class for student-owned routes; mobile screenshots remain regression coverage.

## Refresh 23 Spot Checks

- Selected target: Student My Work hero should stay short enough for Chromebook browser first-view scanning.
- `24-student-my-work-desktop.png`: My Work hero now says `Finish one item` and the work card remains visible above the fold.
- `80-student-my-work-chromebook.png`: Chromebook My Work hero is one line and the Current work card remains visible in the first viewport.
- `84-student-my-work-chromebook-short.png`: short Chromebook My Work hero is one line and the Current work summary remains visible in the first viewport.
- `43-student-my-work-phone.png` and `53-student-my-work-half-screen.png`: mobile and half-screen regression captures still pass with the shorter My Work heading.
- Manifest count: `86` screenshots total, including `32` mobile screenshots, `8` Chromebook/student desktop screenshots, and `4` short Chromebook/student desktop screenshots.
- Manifest scan: screenshot text samples containing `Finish the next capstone item` or `Keep the work screen on one requirement`: `0`.
- Manifest scan: screenshot text samples containing `Finish one item` or `Keep one requirement in focus`: present in My Work captures.

## Refresh 24 Spot Checks

- Selected target: Student Feedback hero should stay short enough for Chromebook browser first-view scanning.
- `81-student-feedback-chromebook.png`: Feedback hero now says `Fix one feedback note` on one line and the Needs changes card remains visible in the first viewport.
- `85-student-feedback-chromebook-short.png`: short Chromebook Feedback hero is one line and the Needs changes card remains visible in the first viewport.
- `25-student-feedback-desktop.png`: desktop Feedback keeps the shortened student task language.
- `54-student-feedback-phone.png`: mobile Feedback regression capture still passes with the shorter heading.
- `82-student-final-checklist-chromebook.png`: wider Chromebook hero width also keeps the Final Checklist title on one line and shows first finish rows in the first viewport.
- Manifest count: `86` screenshots total, including `32` mobile screenshots, `8` Chromebook/student desktop screenshots, and `4` short Chromebook/student desktop screenshots.
- Manifest scan: screenshot text samples containing `Read the note and fix one thing` or `Fix the feedback that asks for action`: `0`.
- Manifest scan: screenshot text samples containing `Fix one feedback note` or `Fix one action note`: present in Feedback captures.

## Refresh 25 Spot Checks

- Selected target: hidden-but-real student Presentation and Final Files direct routes should render as primary Chromebook browser pages, not fall back to Student Today.
- First proof attempt with new hidden-route captures failed because direct `?section=presentation` and `?section=archive` opened the Student Today V2 shell as the primary route.
- Fixed route behavior with `STUDENT_PRIMARY_SECTION_IDS` and route-specific student V2 models for Presentation and Final Files.
- `87-student-presentation-chromebook.png`: Presentation route shows `Know your presentation plan`, `Your Presentation`, and readiness tiles as the first primary surface.
- `88-student-presentation-chromebook-short.png`: short Chromebook Presentation route shows the same primary presentation surface in the first viewport.
- `89-student-final-files-chromebook.png`: Final Files route shows `Save final files`, `Download and Keep`, readiness status, and file-readiness tiles as the first primary surface.
- `90-student-final-files-chromebook-short.png`: short Chromebook Final Files route keeps final-file readiness visible in the first viewport.
- Manifest count: `90` screenshots total, including `32` mobile screenshots, `12` Chromebook/student desktop screenshots, and `6` short Chromebook/student desktop screenshots.
- Final manifest verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`, `0` failures.
