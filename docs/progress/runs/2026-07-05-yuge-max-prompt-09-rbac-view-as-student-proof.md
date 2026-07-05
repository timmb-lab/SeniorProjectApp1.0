# Yuge Max Prompt 09 - RBAC, Security, And View As Student Proof

Start SHA: `37477d2f1e6cbd69c5cf7b5a45a7c7f7272c9039`

Prompt 09 focused on preserving the authenticated role boundary across Workspace, Admin Console, View as Student, imports, assignments, reports, and exports.

Implemented:

- Added `docs/security/role-access-matrix.md` as the durable RBAC contract for Student, Mentor, Viewer, Program Teacher, Administration, Site Admin, Global/Admin, and Misc Admin behavior.
- Extended `scripts/verify-permission-role-matrix.mjs` so the matrix doc stays tied to source permissions, integration tests, View as Student constraints, and export redaction boundaries.
- Added a workspace regression proving Viewer report exports are scoped/read-only and Student deep links cannot surface staff/admin report export controls.
- Updated the screenshot index with a Prompt 09 proof map for Student clean shell, Mentor assigned queue, Program Teacher program queue, Viewer read-only detail, denied state, Admin Console roles, and View as Student banner/exit evidence.
- Refreshed the local browser proof manifest with the 46-capture fake-account screenshot proof run.

Validation:

- `npm run verify:permission-matrix` passed.
- `npm run verify:mutation-origin` passed.
- `node --test tests\site-aware-permissions.test.mjs` passed, 8/8.
- `node --test tests\workspace-app.test.mjs` passed, 113/113.
- `npm run prove:workspace-ui-polish` passed, 46 screenshots.
- `node --test tests\workspace-ui-polish-proof.test.mjs` passed, 3/3.
- `git diff --check` passed with only LF-to-CRLF warnings for touched text files.
- `npm run typecheck` passed.
- `npm run verify:workspace-navigation` passed.
- `npm run verify:workspace-url-state` passed.
- `npm run check:workspace-mobile` passed.
- `npm run check:workspace-accessibility` passed.
- `npm run verify:workspace-density` passed.
- `npm run check:workspace-errors` passed.
- `npm test` passed, 480 passing and 4 expected local HTTP skips.
- `npm run build:public-site` passed.
- `npm run check` passed with the expected `PILOT_READINESS_PREFLIGHT_COMPLETE_NO_GO` / `NO_GO_REAL_STUDENT_PILOT` decision.
- `npm run check:workspace:hosted-permissions` passed against hosted fake `.test` accounts for Student, Program Teacher, Mentor, Viewer, Misc Admin, Site Admin, and Admin. It still reports `student_archive_manifest_download` as `skipped_not_ready` / future pilot item, which is expected.

Proof boundary:

- Local screenshots and hosted permission proof are fake-account proof only.
- View as Student is staff-authorized, read-only, bannered, and deep-link bounded.
- Viewer remains assigned-student-only and read-only, including hosted mutation-denial proof.
- Real-student pilot status remains **NO-GO** pending the required manual pilot evidence.
