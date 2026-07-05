# Senior Project App Role Access Matrix

Date: 2026-07-05

Scope: authenticated Workspace and Admin Console access for local fake-account proof, hosted fake-pilot proof, and future real-student pilot readiness. This matrix is a security contract, not a sales claim. Real-student pilot remains NO-GO until production pilot blockers have separate proof.

## Core Boundary

All role decisions must be enforced by backend permission helpers and route handlers first. UI guards, disabled buttons, CSV previews, hidden actions, and View as Student preflight are usability safeguards only.

- Permission source: `functions/_lib/permissions.ts`
- Mutation origin proof: `scripts/verify-mutation-origin-coverage.mjs`
- Matrix proof: `scripts/verify-permission-role-matrix.mjs`
- Integration tests: `tests/site-aware-permissions.test.mjs`
- Workspace role and View as Student tests: `tests/workspace-app.test.mjs`

## Matrix

| Role | Visible students | Workspace access | Admin Console access | Mutation abilities | View as Student | Read-only behavior | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Student | Own student record only. | My Capstone student sections only. No Staff Workspace routes, staff queues, or admin routes. | None. Student admin deep links fail safely. | Student-owned proof, submission, password, and account flows only where the student API allows self access. No staff review, assignment, import, report setup, or admin mutations. | Cannot see or activate View as Student. Deep links with `viewAsStudentId` are ignored. | Not a monitoring role; student self actions remain scoped to the signed-in student. | `tests/site-aware-permissions.test.mjs` self-only test; `tests/workspace-app.test.mjs` student nav, admin-denied, and View as Student denial tests; screenshot `20-student-admin-route-blocked.png`. |
| Mentor | Active mentor-assigned students only. | Assigned student support and presentation context. No full directory. | None. | May add scoped staff support notes where allowed. Cannot mutate review decisions, manage users, manage security, import, assign, or review outside assigned students. | Can enter read-only preview only from an authorized assigned student context. Unauthorized deep links are rejected. | Staff preview remains read-only; mentor role is not a viewer role but still cannot save student-side changes from preview. | Assignment-backed permission tests; Mentor workspace screenshots `04-mentor-workspace.png` and `30-mobile-mentor-today.png`. |
| Viewer | Viewer-assigned students only. | Read-only Students and Reports context for assigned records. | None. | No mutation powers: no staff note, review decision, mentor/viewer/program assignment, import, archive, presentation, account, or security mutations. | Viewer is a staff read-only role and may enter View as Student only for assigned, authorized students. Preview remains read-only. | Entire workspace runs with viewer read-only boundaries; edit, review, import, assignment, archive, and account controls stay hidden. | Viewer permission tests; Workspace read-only tests; screenshots `05-viewer-read-only-workspace.png`, `14-viewer-read-only-detail-click.png`, `39-viewer-students-directory.png`, and `46-mobile-viewer-students.png`. |
| Program Teacher | Students inside assigned program or cohort scopes only. | Program-scoped review queue, student records, mentor coverage context, reports, and operations worklists. | Scoped console access for people/access surfaces allowed to Program Teacher. | Can mutate review decisions for scoped submissions and manage mentor coverage in scope. Cannot manage global users, security, site programs, audit, archive exports, or out-of-scope students. | Can enter read-only preview only for authorized scoped students. Unauthorized deep links are rejected. | Preview is read-only; normal Program Teacher review mutations stay backend-scoped to authorized submissions. | Program/cohort permission tests; Workspace review tests; screenshots `03-program-teacher-workspace.png` and `40-staff-reviews.png`. |
| Administration | Students and site operations inside assigned school scope only. | School-level Workspace, Students, Reports, and operational context inside assigned site. | School-scoped Admin Console for allowed people/access/import/report surfaces. | May manage scoped school users/access where the backend allows. Cannot manage global users, security, tenant config, audit, archive exports, or out-of-scope schools. | Can enter read-only preview only for authorized school students. Unauthorized deep links are rejected. | Preview is read-only; console actions remain site-scoped. | Site-aware permission tests and People management UI tests. |
| Site Admin | Students and operations inside assigned site only. | Site-scoped Workspace, students, review/mentor/operations/report context. | Site-scoped Admin Console. No platform security or global user management. | Can manage scoped site setup, assignments, imports, mentor coverage, presentation/archive operations where backend allows. Cannot manage security, tenant config, or cross-site users. | Can enter read-only preview only for authorized site students. Unauthorized deep links are rejected. | Preview is read-only; normal admin actions remain site-scoped. | Site Admin permission tests; screenshots `02-workspace-site-admin-desktop.png`, `13-site-admin-student-detail-click.png`, `32-admin-console-site-admin-overview.png`, and `33-admin-assignments.png`. |
| Global Admin / Platform Admin / legacy Admin | All active tenants, sites, and students exposed by the current APIs. | Global Workspace context plus explicit Admin Console switch. | Global Admin Console, including platform/audit/security surfaces where local account requirements are satisfied. | Full platform-scoped management through guarded routes. Security and global user management remain global/platform-admin only. | Can enter read-only preview only after selecting an authorized student. Unauthorized deep links are rejected. | Preview is always read-only even for Global Admin. | Platform/admin permission tests; screenshots `01-admin-console-global-admin-desktop.png`, `27-global-admin-workspace-today.png`, and `36-admin-audit.png`. |
| Misc Admin | Aggregate readiness only. No scoped student detail by default. | Reporting/readiness surfaces only where explicitly allowed. | None unless separately granted by another role. | No user, security, assignment, import, review, or student-detail mutations. | Cannot use View as Student without another staff role that authorizes student access. | Default-deny role for student records. | Misc Admin default-deny permission tests and Administration workspace screenshot `26-administration-workspace-today.png`. |

## View As Student Contract

- Only staff roles with an authorized student context can start View as Student: Global Admin, Site Admin, Administration, Program Teacher, Mentor, and Viewer.
- Student accounts cannot start View as Student, cannot keep a preview active by URL, and cannot see preview entry controls.
- Every active preview renders a persistent banner with the selected student, staff account context, read-only preview label, and exit control.
- Preview mode cannot submit, upload proof, review, assign, import, change account records, or save student-side changes.
- Refresh and deep links restore only authorized preview students. Unauthorized `viewAsStudentId` requests are removed from URL state and return to an allowed section.

## Import, Assignment, Report, And Export Contract

- People imports and access assignments must call backend permission checks such as `canManageSiteUsers`, `canManageMentorAssignments`, role creation validation, active site/program/student validation, and assignment-target validation.
- Invalid assignment targets are blocked server-side: wrong role, missing student, missing program, out-of-scope site, student-as-mentor, and Global Admin creation from scoped import are rejected.
- Client CSV preview explains row-level validation but does not replace backend validation.
- Report CSV exports are generated from data already loaded for the authorized viewer and omit internal IDs, storage identifiers, password material, admin notes, and raw JSON.
- Archive package downloads remain separate guarded API flows; local report CSV proof does not claim real-student archive package readiness.

## Required Proof Commands

Run these before claiming the matrix is still valid:

```powershell
npm run verify:permission-matrix
npm run verify:mutation-origin
node --test tests\site-aware-permissions.test.mjs
node --test tests\workspace-app.test.mjs
npm run prove:workspace-ui-polish
node --test tests\workspace-ui-polish-proof.test.mjs
```

For hosted/demo verification, run hosted permission proof only with the approved fake-account environment:

```powershell
npm run check:workspace:hosted-permissions
```

Hosted proof remains fake-account proof unless the run is explicitly configured and documented as production pilot evidence.
