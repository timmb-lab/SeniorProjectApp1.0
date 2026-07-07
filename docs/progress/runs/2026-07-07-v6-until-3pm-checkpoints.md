# 2026-07-07 V6 Until-3PM Checkpoints

## Startup Checkpoint

- Local time: `2026-07-07 07:20:40 -07:00`
- Phoenix time: `2026-07-07 07:20:40 America/Phoenix`
- Elapsed minutes: `0`
- Minutes until 3PM: `459`
- Current SHA: `1ffd87d851dd473861e1892f7d7dfccbb94792e9`
- Commits since start: `0`
- Git status: clean, `main...origin/main`, alignment `0 0`
- Screens/states changed: none yet
- Screenshots captured: none yet for V6
- Tests run: startup repo status/origin checks only
- Failures/blockers: none
- Next work target: V5 screenshot review and first implementation slice
- Real work continues before 3PM: YES

## Working Log

- `2026-07-07 07:20:40 -07:00`: Started V6 from clean `main` at V5 final SHA `1ffd87d851dd473861e1892f7d7dfccbb94792e9`; read V6 prompt, V5 final proof, V5 screenshot index, V5 manifest summary, and proof script screenshot-plan hooks.
- `2026-07-07 07:37:03 -07:00`: Corrected an accidental summary-only stop after the user called out that the V6 run had not continued. Rechecked clock, repo status, `HEAD`, `origin/main`, and alignment. Result: still before 3PM Phoenix, on `main`, aligned `0 0`, with only V6 scaffolding untracked. Resumed real implementation work.
- `2026-07-07 07:39:00 -07:00`: Completed V6 implementation slice 01, mobile first-viewport hierarchy hardening. Tightened V2 tablet/phone stage spacing, hero spacing, hero title size, support copy line height, and command/admin/report hero density so role-specific work appears earlier on phones and half-width screens. Added regression assertions for the new V2 hero and command-hero breakpoints.
- `2026-07-07 07:42:04 -07:00`: Completed V6 implementation slice 02, role Today primary-route hardening. Added a compact primary-step row ahead of the Program Teacher, Viewer, and staff-admin Today plan grids so the first live route/action is not competing with equal secondary cards. Viewer remains read-only and only receives monitoring routes.
- `2026-07-07 07:43:44 -07:00`: Completed V6 implementation slice 03, mentor shell language hardening. Replaced one visible "scoped" mentor shell sentence with plain assigned-student boundary language and added a regression assertion to keep that wording from returning.
- `2026-07-07 07:45:21 -07:00`: Completed V6 implementation slice 04, CSV import outcome-first flow. Moved the latest preview outcome above the long import form after a preview exists, so admins see "fix this row first" or "confirm this import" before scrolling through file/text/note inputs. Detailed preview rows and error lists remain below the editable form.
- `2026-07-07 07:47:04 -07:00`: Completed V6 implementation slice 05, report export boundary hardening. Added visible per-export boundary notes for staff, viewer, and admin CSV downloads and replaced one "authorized view" report helper with "current allowed view" language.
- `2026-07-07 07:57:25 -07:00`: Completed V6 implementation slice 06 after visual proof review. V6 screenshots showed Program Teacher and Viewer phone still put the shared Staff Workspace header ahead of the role-specific plan. Reordered staff Today rendering so Program Teacher, Viewer, and staff-admin plans lead before the shared Staff Workspace header; mentors keep the existing header-first layout because they do not have a dedicated role plan block.
- `2026-07-07 08:05:59 -07:00`: Refreshed V6 browser proof after slice 06. Result: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`, `78` screenshots, `32` mobile screenshots, `0` failures, fake-data-only, real-student status still `NOT_CLAIMED_READY`. Visually rechecked Program Teacher, Viewer, and Administration phone screenshots and confirmed the role-specific plan now appears before the shared Staff Workspace header.
- `2026-07-07 08:09:34 -07:00`: Completed V6 implementation slice 07, Admin Console primary-surface ordering. Marked real Admin Console sections as primary surfaces so overview, people, students, assignments, programs, imports, reports, and audit content render before shared V3/V5 guidance. This directly addresses the mobile Admin Reports screenshot where shared guidance appeared before report choices.

## Slice 01 - Mobile First-Viewport Hierarchy

- Files changed:
  - `workspace.css`
  - `tests/workspace-app.test.mjs`
- User-facing surfaces affected:
  - Student, Mentor, Program Teacher, Viewer, Site Admin, Administration, Global Admin, and Reports phone/tablet V2 screens that share the V2 shell.
  - Admin/report command heroes that previously consumed too much first viewport before operational content.
- RBAC/data impact: none. CSS/test-only slice; no permission, mutation, route, or data-access logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 02 - Role Today Primary Route

- Files changed:
  - `workspace.js`
  - `workspace.css`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Program Teacher Today now surfaces the first live review/support route above the equal-card plan grid.
  - Viewer Today now surfaces one read-only monitoring route before secondary read-only cards.
  - Site Admin / Administration / Global Admin staff Today now surfaces one student-support route before setup/report cards.
- RBAC/data impact: no permission, mutation, or API changes. The new primary row reuses the same `data-section` / `data-section-preset` route controls already guarded by existing workspace routing and available-section checks.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 03 - Mentor Shell Language

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Mentor V2 shell focus strip now says "Mentor view shows assigned students only" instead of "Mentor view is scoped to assigned students."
- RBAC/data impact: none. Copy/test-only change; no permission, route, mutation, or API logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run verify:functionality-language`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 04 - CSV Import Outcome First

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - People > Import Students
  - People > Import Staff
  - Admin Imports routed import views
- Behavior changed:
  - Waiting state still shows template, readiness, form, and empty preview guidance.
  - After a preview exists, the next outcome row now appears immediately after readiness and before the long form.
  - Error state surfaces the first row to fix before the editable form.
  - Ready state surfaces confirm guidance before the editable form.
  - Detailed counts and row-level error lists still render after the form.
- RBAC/data impact: no permission, API, validation, or import-confirm mutation logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 05 - Report Export Boundaries

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Staff Reports CSV export cards
  - Viewer read-only Reports CSV export cards
  - Admin Reports export choice rows
- Behavior changed:
  - Each report export now names what the download is limited to.
  - Staff/viewer exports state that downloads include only students or review rows the role can already load/open.
  - Admin exports state that downloads use the current admin view and omit IDs, passwords, admin notes, storage links, row notes, setup passwords, and credentials as appropriate.
- RBAC/data impact: no CSV data generation, permission, route, or export availability logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run verify:dashboard-actions`: PASS
  - `npm run verify:functionality-language`: PASS
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 06 - Role Plan Before Shared Staff Header

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- Visual finding:
  - Fresh V6 screenshots passed but showed the role-specific Program Teacher and Viewer plans still started after the shared Staff Workspace title/action block on phone.
- User-facing surfaces affected:
  - Program Teacher Today
  - Viewer Today
  - Administration / Site Admin / Global Admin staff Today
- Behavior changed:
  - Dedicated role plan blocks now render before the shared Staff Workspace header when available.
  - Mentor Today is unchanged because no dedicated mentor Today plan is rendered in this path.
- RBAC/data impact: no permission, route, mutation, or API logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Browser Proof Refresh 01

- Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
- Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`
- Screenshot index: `docs/sales/v6-until-3pm-screenshot-index.md`
- Verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`
- Screenshots: `78`
- Mobile screenshots: `32`
- Failures: `0`
- Started: `2026-07-07T14:57:53.622Z`
- Completed: `2026-07-07T15:05:17.912Z`
- Claim boundary: local fake-account browser UI proof only; hosted readiness and real-student pilot readiness are not claimed.
- Real-student production status: `NOT_CLAIMED_READY`
- Real work continues before 3PM: YES

## Slice 07 - Admin Console Primary Surfaces

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Admin Overview
  - Admin People
  - Admin Students
  - Admin Assignments
  - Admin Programs
  - Admin Imports
  - Admin Reports
  - Admin Audit
- Behavior changed:
  - Real Admin Console section content now renders in the V2 primary surface before shared start-state/flow guidance.
  - Admin Reports and Admin Overview have explicit order assertions to prevent the shared explainer from returning ahead of page content.
- RBAC/data impact: no role, permission, API, route, mutation, or data-access logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 08 - Mentor Today Assigned-Student Plan

- Files changed:
  - `workspace.js`
  - `workspace.css`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Mentor Today
  - Mentor assigned-student route
  - Mentor presentation/report follow-up links
- Behavior changed:
  - Mentor Today now has a dedicated role plan before the shared Staff Workspace header.
  - The first Mentor Today action routes to the existing Mentor Dashboard/assigned-student surface.
  - Follow-up cards point only to existing mentor, presentation, and staff report surfaces.
  - Mentor overview now uses the V2 primary surface ordering so real assigned-student work appears before shared shell guidance.
- RBAC/data impact: no permission, API, route availability, mutation, or data-access logic changed. Mentor remains assigned-student scoped.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test --test-name-pattern "workspace defaults to workflow landings" tests\workspace-app.test.mjs`: PASS, `1` pass, `0` fail
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Browser Proof Refresh 02

- Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
- Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`
- Screenshot index: `docs/sales/v6-until-3pm-screenshot-index.md`
- Verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`
- Screenshots: `78`
- Mobile screenshots: `32`
- Failures: `0`
- Started: `2026-07-07T15:17:20.354Z`
- Completed: `2026-07-07T15:24:41.664Z`
- Visual spot checks:
  - `30-mobile-mentor-today.png`: Mentor plan appears in the first phone viewport and routes first to Mentor Dashboard.
  - `42-mobile-admin-reports.png`: Admin Reports begins with the report path and export rows, not shared shell guidance.
  - `04-mentor-workspace.png`: desktop Mentor Today shows the assigned-student plan before the shared Staff Workspace header.
- Claim boundary: local fake-account browser UI proof only; hosted readiness and real-student pilot readiness are not claimed.
- Real-student production status: `NOT_CLAIMED_READY`
- Real work continues before 3PM: YES

## Slice 09 - Student Work Screens Lead With Real Content

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Student My Work
  - Student Feedback
  - Student Final Checklist
- Behavior changed:
  - Student My Work, Feedback, and Final Checklist now render their real section content inside the V2 primary surface.
  - Shared start-state and flow guidance now follows the actual student screen content instead of leading those routes.
  - Existing Today behavior remains primary-surface-backed.
- RBAC/data impact: no permission, API, student data, submission, upload, review, or final-file logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test --test-name-pattern "workspace defaults to workflow landings" tests\workspace-app.test.mjs`: PASS, `1` pass, `0` fail
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Browser Proof Refresh 03

- Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
- Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`
- Screenshot index: `docs/sales/v6-until-3pm-screenshot-index.md`
- Verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`
- Screenshots: `78`
- Mobile screenshots: `32`
- Failures: `0`
- Started: `2026-07-07T15:29:27.400Z`
- Completed: `2026-07-07T15:37:09.801Z`
- Visual spot checks:
  - `43-student-my-work-phone.png`: My Work content and Continue action now appear before shared start-state guidance.
  - `54-student-feedback-phone.png`: Feedback content and View Work action now appear before shared feedback guidance.
  - `55-student-final-checklist-phone.png`: Final Checklist content and Continue My Work action now appear before shared final guidance.
- Claim boundary: local fake-account browser UI proof only; hosted readiness and real-student pilot readiness are not claimed.
- Real-student production status: `NOT_CLAIMED_READY`
- Real work continues before 3PM: YES

## Slice 10 - Admin Header Action Menus Name Their Purpose

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Admin People
  - Admin Students
  - Admin Assignments
  - Admin Imports
  - Admin Reports
  - Admin Audit
  - Admin Programs
- Behavior changed:
  - Admin page header overflow menus now use section-specific labels such as `More people actions`, `More student actions`, and `More report actions`.
  - The old generic header summary label `Actions` is no longer used for Admin People.
  - Existing menu items, route targets, downloads, and role-scoped visibility remain unchanged.
- RBAC/data impact: no permission, route availability, mutation, CSV, audit, report, assignment, or People data logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test --test-name-pattern "admin console surfaces setup reasons|admin console menus filters" tests\workspace-app.test.mjs`: PASS, `2` pass, `0` fail
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Browser Proof Refresh 04

- Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
- Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`
- Screenshot index: `docs/sales/v6-until-3pm-screenshot-index.md`
- Verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`
- Screenshots: `78`
- Mobile screenshots: `32`
- Failures: `0`
- Started: `2026-07-07T15:41:10.610Z`
- Completed: `2026-07-07T15:48:37.240Z`
- Visual spot checks:
  - `68-mobile-admin-people.png`: generic `Actions` button is replaced with `More people actions`.
  - `17-people-access-landing.png`: desktop Admin People uses the same named menu pattern.
  - `35-admin-reports.png`: Admin Reports proof remains green after named report actions.
- Claim boundary: local fake-account browser UI proof only; hosted readiness and real-student pilot readiness are not claimed.
- Real-student production status: `NOT_CLAIMED_READY`
- Real work continues before 3PM: YES

## Slice 11 - Role Today Plans Do Not Repeat The Primary Card

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Mentor Today
  - Program Teacher Today
  - Viewer Today
  - Administration / Site Admin / Global Admin staff Today
- Behavior changed:
  - The card promoted into the `First route` / primary route strip no longer repeats immediately in the secondary plan grid.
  - Remaining plan cards continue to render as secondary choices.
  - Primary route selection uses the same availability and count rules as before.
- RBAC/data impact: no permission, route availability, role scope, API, student data, or mutation logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --test --test-name-pattern "workspace defaults to workflow landings|workspace separates Admin Console mode" tests\workspace-app.test.mjs`: PASS, `2` pass, `0` fail
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Browser Proof Refresh 05

- Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
- Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`
- Screenshot index: `docs/sales/v6-until-3pm-screenshot-index.md`
- Verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`
- Screenshots: `78`
- Mobile screenshots: `32`
- Failures: `0`
- Started: `2026-07-07T15:52:30.274Z`
- Completed: `2026-07-07T15:59:56.182Z`
- Visual spot checks:
  - `48-site-admin-today-phone.png`: secondary plan grid begins with review work instead of repeating the student support route.
  - `30-mobile-mentor-today.png`: secondary plan grid begins with one assigned student instead of repeating the Mentor Dashboard route.
  - `49-program-teacher-today-phone.png`: secondary plan grid begins with revision support instead of repeating the review route.
- Claim boundary: local fake-account browser UI proof only; hosted readiness and real-student pilot readiness are not claimed.
- Real-student production status: `NOT_CLAIMED_READY`
- Real work continues before 3PM: YES

## Slice 12 - Admin Student Detail Leads With The Record

- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `scripts/prove-workspace-ui-polish.mjs`
  - `docs/progress/runs/2026-07-07-v6-until-3pm-checkpoints.md`
- User-facing surfaces affected:
  - Admin-mode hidden student detail route
  - Mobile Student Detail proof path
- Behavior changed:
  - A loaded student detail on the hidden Admin `students` route now renders as `data-v2-primary-surface="admin-student-detail"`.
  - The real student detail panel appears before shared admin start-state and setup guidance.
  - The browser proof now expects student-detail content instead of accepting generic `Admin flow / Open Ready / Open tools` copy.
- RBAC/data impact: no permission, detail API, URL-state permission, student data, View as Student, or mutation logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --check scripts\prove-workspace-ui-polish.mjs`: PASS
  - `node --test --test-name-pattern "workspace opens real student detail" tests\workspace-app.test.mjs`: PASS, `1` pass, `0` fail
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Real work continues before 3PM: YES

## Slice 13 - Student Detail Frames Lead With Record Context

- Implementation commit: `0bdf133` (`Lead student detail frames with record context`)
- Files changed:
  - `workspace.js`
  - `tests/workspace-app.test.mjs`
  - `scripts/prove-workspace-ui-polish.mjs`
- User-facing surfaces affected:
  - Admin-mode hidden student detail route
  - Staff Workspace student detail route
  - Viewer read-only student detail route
  - Student detail evidence and timeline tab proof paths
- Behavior changed:
  - Loaded student-detail screens now use a record-specific V2 frame: `Student detail`, `Review this student record`, and either `Record before setup` or `Record before lists`.
  - The old generic Admin fallback copy (`Open Ready`, `Open tools`, `Focused admin task`) is no longer accepted for the hidden Admin student-detail route.
  - Viewer detail proof still requires the read-only boundary while allowing the record-first frame.
  - Existing detail tabs, scoped URL state, Viewer read-only behavior, and staff/admin detail actions remain route-backed.
- RBAC/data impact: no permission, detail API, URL-state permission, student data, View as Student, Viewer read-only, or mutation logic changed.
- Focused checks:
  - `node --check workspace.js`: PASS
  - `node --check tests\workspace-app.test.mjs`: PASS
  - `node --check scripts\prove-workspace-ui-polish.mjs`: PASS
  - `node --test --test-name-pattern "workspace opens real student detail" tests\workspace-app.test.mjs`: PASS, `1` pass, `0` fail
  - `node --test tests\workspace-app.test.mjs`: PASS, `115` pass, `0` fail
  - `npm run check:workspace-mobile`: PASS
  - `npm run check:workspace-accessibility`: PASS
  - `npm run verify:dashboard-actions`: PASS
  - `git diff --check`: PASS with line-ending warnings only
- Browser proof note:
  - First proof attempt after the code change failed because proof expectations still described the previous workspace/detail frame.
  - The verifier was tightened to expect the new record-first detail frame and to keep Viewer read-only markers.
- Real work continues before 3PM: YES

## Browser Proof Refresh 06

- Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
- Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`
- Screenshot index: `docs/sales/v6-until-3pm-screenshot-index.md`
- Verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`
- Screenshots: `78`
- Mobile screenshots: `32`
- Failures: `0`
- Started: `2026-07-07T16:28:41.250Z`
- Completed: `2026-07-07T16:36:26.543Z`
- Visual spot checks:
  - `23-student-detail-phone.png`: hidden Admin student detail now shows `Review this student record` and `Record before setup` instead of generic `Open tools` / `Focused admin task`.
  - `13-site-admin-student-detail-click.png`: desktop Admin detail opens with record-first context while preserving the scoped Admin Console route.
  - `14-viewer-read-only-detail-click.png`: Viewer detail uses the record-first frame while still showing the read-only boundary.
  - `31-mobile-student-detail.png`: Workspace student detail phone route uses `Record before lists` before detail tabs and supporting context.
- Claim boundary: local fake-account browser UI proof only; hosted readiness and real-student pilot readiness are not claimed.
- Real-student production status: `NOT_CLAIMED_READY`
- Real work continues before 3PM: YES
