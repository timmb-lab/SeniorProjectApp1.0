# Program Teacher workflow closeout — September 2, 2026

## Outcome

The public Program Teacher journey now centers on projects, student work, review decisions, mentor coverage, and short reports. A teacher can choose a school, open the next project that needs attention, review one submission, move between students and projects, confirm both required adults, manage the project team, use Google Drive templates and work links, and see the next action without entering unrelated account-management screens.

## Corrections made

- Rebuilt Today around the exact first submitted project and one clear review action.
- Replaced oversized loading and error layouts with short, plain progress states.
- Corrected old fake demo rows whose work was not linked to their active projects.
- Kept project lists, board view, team controls, templates, Drive folder links, and project-adult checks together in the project workspace.
- Made Student details preserve the selected review or directory context and removed duplicate school/cohort wording.
- Simplified review history and timeline copy so it describes student activity instead of internal routes.
- Reduced the Program Teacher Admin Console to an overview and mentor coverage; unrelated staff, imports, password, and account controls are no longer presented.
- Reduced mentor assignment controls to Mentor, Student, Change, and Reason.
- Made Reports a direct screen with scoped project, review, setup, mentor, and adult-coverage counts.
- Fixed the Tools panel width, field layout, dark-view report contrast, and the dead-end **Open students** action.
- Kept the visible browser address at the canonical root while internal navigation retains its state.

## Public Program Teacher walkthrough

Verified on [thecapstoneproject.com](https://thecapstoneproject.com/) with an ignored fake `.test` Program Teacher account:

1. Sign-in, school choice, and role-scoped project load.
2. Today and the first project waiting for review.
3. Review queue, previous/next work, missing-work guard, decision controls, and feedback history.
4. Student detail: Work, Feedback, Evidence, and Timeline; return to the same queue.
5. Projects in list and board views; project detail, next project, team membership, and project creation.
6. Required Mentor and Program Teacher assignment checks.
7. Google Drive project folder, teacher templates, and submitted work links.
8. Student Directory search and filters from Tools, including direct opening of the real directory.
9. Reports and CSV actions.
10. Admin Overview and the role-limited Mentor coverage screen.
11. Light view, dark view, school colors, and the static canonical browser address.

No live student review decision, account change, or project reassignment was saved during the browser walkthrough. Those write paths remain covered by automated fake-data integration tests.

## Verification

- Full automated suite: 594 tests, 590 passed, 4 intentionally skipped, 0 failed.
- Type checking, fifth-grade language, navigation, role permissions, accessibility, mobile layout, theme, density, and production-surface checks passed.
- Hosted Program Teacher scope, presentation access, student directory, and Google Drive link behavior passed.
- Canonical domain, HTTPS, secondary-domain redirects, and retired app subdomains passed live checks.
- Production bundle deployed through Cloudflare Pages and rechecked in a fresh public browser session.

The database correction was limited to fake demo records. It did not alter real-user data.
