# Site Admin workflow closeout

Date: September 2, 2026  
Public app: https://thecapstoneproject.com/  
Test boundary: Hosted `.test` accounts and synthetic school data only. No real student records were used or changed.

## Outcome

The full Site Admin journey was walked in the public app from sign-in through the staff workspace and Admin Console. The flow now keeps required project ownership, school setup, people, assignments, reports, templates, imports, and password help clear without presenting optional access or read-only work as required action.

The browser address remained on the canonical root while moving between workspace and admin screens. Light and dark views both worked, and the selected school look remained available from Programs.

## Problems corrected

- Site Admin project review actions now say **Open review details**. Only an assigned Mentor or Program Teacher is told to make a review decision.
- Student detail now tells Site Admins that the assigned reviewer saves the decision.
- Project adult guidance now uses neutral project language instead of telling an admin “your Mentor.”
- Required Mentor and Program Teacher ownership stays prominent for every project.
- Optional read-only Viewer access no longer creates hundreds of false student setup problems.
- Unassigned Mentor and Viewer accounts are treated as ready to use, not broken staff accounts.
- Assignment priorities now put required Mentor and Program Teacher coverage first and label Viewer access as optional.
- Roster reports identify optional Viewer access without adding it to setup-error flags.
- Large report, readiness, and mentor-load sections stay behind clear choices instead of opening all at once.
- People, Assignments, Programs, and CSV import wording now uses the same labels throughout the app.
- CSV examples are marked as samples that must be replaced before preview.
- Account and password-help language no longer exposes sign-in implementation terms to ordinary users.
- Site Admin reports explain the read-only review boundary and keep deeper charts and downloads secondary.

## Hosted walkthrough completed

- Projects: list, search, filters, pagination, project detail, team adults, Google Drive folder links, templates, create/group entry points.
- Work queue: Today, Review Work, read-only review history, and next-step wording.
- Reports: direct summary, secondary details, exports, readiness, presentations, and final-file status.
- Admin Overview: first blocker, setup checklist, health, quick actions, and recent activity.
- People: staff summary, search, add flow, password-reset disclosure, role limits, and account-removal guidance.
- Students: roster summary, search, detail tabs, View as Student entry, review boundary, and return path.
- Assignments: required Mentor and Program Teacher coverage, optional Viewer access, school grants, forms, and history.
- Programs: school look, active programs, add/remove flow, and Program Teacher coverage guidance.
- Imports: student/staff templates, sample warning, preview-first flow, error recovery, and confirm-disabled state.
- Account shell: visible role, refresh, sign out, light/dark switch, stable canonical address, and school-scoped navigation.

## Verification

- Full automated check: 600 tests; 596 passed, 4 intentional browser-only skips, 0 failures.
- Production cutover gate: passed, including canonical-domain behavior, role permissions, type checks, test suite, and Drive-link-only storage behavior.
- Final hosted role proof: Student, Program Teacher, Mentor, Viewer, reporting admin, Site Admin, and Global Admin checks passed.
- Final browser proof: canonical Site Admin session confirmed corrected Overview, People, Students, Assignments, Programs, Imports, Reports, student detail, and theme behavior.
- Deployment: `60b03552.senior-capstone-app.pages.dev`; canonical traffic remains `thecapstoneproject.com`.

## Readiness boundary

The hosted synthetic-account experience is green. A real-student pilot remains a separate no-go until the school supplies the required roster validation, privacy/support/retention approval, role-scoped pilot account proof, and an approved credential-delivery process.
