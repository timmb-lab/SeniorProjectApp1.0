# Role-Scoped Pilot Account Proof

Status: **FAKE-ACCOUNT MATRIX READY FOR REVIEW; real-student pilot evidence still MANUAL_PROOF_REQUIRED.**

This document defines the pilot-shaped role matrix to use before a school approves real accounts. It uses fake `.test` accounts and fake students only. It does not replace `docs/progress/runs/real-student-pilot-role-scope-proof.json`.

## Evidence Boundary

- Allowed evidence today: fake `.test` account proof, local tests, hosted fake-account screenshots, and redacted role-matrix notes.
- Not allowed today: real student names, real student emails, real roster rows, real credentials, or approval claims.
- Required before real-student pilot: an approved role-scope proof manifest at `docs/progress/runs/real-student-pilot-role-scope-proof.json`.

## Synthetic Account Matrix

| Role | Fake account pattern | Can see | Cannot see | Allowed actions | Forbidden actions | View as Student |
| --- | --- | --- | --- | --- | --- | --- |
| Student | `student.pilot@senior-capstone.test` | Own My Capstone, proof files, feedback, deadlines, presentation, and final checklist | Other students, Staff Workspace, Admin Console, staff routes | Student-owned proof/submission/account actions only where student APIs allow them | Staff review, import, assignment, report setup, admin mutations | Cannot start or keep preview mode |
| Mentor | `mentor.pilot@senior-capstone.test` | Assigned students only | Unassigned students, site-wide roster, Admin Console | Scoped support context and allowed notes | Reviews outside assignment, imports, account changes, broad reports | Read-only preview only for assigned students |
| Program Teacher | `teacher.pilot@senior-capstone.test` | Assigned program/cohort/site students and review queue | Cross-program/site students, global users | In-scope review decisions and scoped support actions | Global users, site/global admin creation, out-of-scope reviews | Read-only preview only for scoped students |
| Viewer | `viewer.pilot@senior-capstone.test` | Assigned students and read-only reports context | Unassigned students and Admin Console | View assigned context | Mutate, approve, import, assign, schedule, export, reset passwords | Read-only preview only for assigned students |
| Administration | `administration.pilot@senior-capstone.test` | Approved school/program setup and student/staff context | Global security, tenant config, out-of-scope schools | Scoped school operations where backend allows | Create Global Admin, bypass site/program scope | Read-only preview only for scoped students |
| Site Admin | `site.admin.pilot@senior-capstone.test` | Assigned-site people, assignments, programs, imports, reports, and allowed audit/reporting surfaces | Cross-site students and platform security | Scoped site setup and assignment actions | Create Global Admin, cross-site changes | Read-only preview only for assigned-site students |
| Global Admin | `global.admin.pilot@senior-capstone.test` | Platform/admin context through local-account-only admin access | SSO-only Global Admin path | Guarded platform management | Remove last active local Global Admin, use SSO as Global Admin | Read-only preview only after selecting an authorized student |
| Unauthorized/misc | `misc.pilot@senior-capstone.test` | Only aggregate/readiness surfaces explicitly allowed | Student detail, staff queues, imports, Admin Console | None beyond allowed read-only surfaces | Student detail, View as Student, imports, account changes | Cannot start preview without another authorized staff role |

## Required Positive Checks

Run with fake accounts only:

1. Student opens My Capstone and sees only Today, My Work, Feedback, Final Checklist, Presentation, and Final Files when available.
2. Mentor opens only assigned student records.
3. Program Teacher opens only assigned program/cohort/site work.
4. Viewer sees assigned context with read-only wording and no mutation controls.
5. Administration and Site Admin stay inside assigned school/site context.
6. Global Admin uses the local-account-only path and keeps the break-glass caveat visible in operator docs.
7. Authorized staff can enter View as Student only for allowed students.

## Required Denial Checks

The proof is not acceptable unless these fail safely:

1. Student cannot open Admin Console or Staff Workspace.
2. Student cannot access another student's record.
3. Mentor cannot access an unassigned student.
4. Program Teacher cannot cross program/site scope.
5. Viewer cannot mutate, approve, import, assign, schedule, export, or reset passwords.
6. View as Student cannot mutate and cannot open unauthorized students.
7. SSO cannot create or use Global Admin.
8. Scoped admins cannot create Global Admin or cross-site assignments.
9. Unauthorized/misc account cannot open student detail or account management.

## Local Proof Commands

```powershell
npm run verify:permission-matrix
npm run verify:mutation-origin
node --test tests\site-aware-permissions.test.mjs
node --test tests\workspace-app.test.mjs
node --test tests\real-student-pilot-readiness.test.mjs tests\real-student-pilot-demo-docs.test.mjs
npm run check:pilot-readiness
```

Expected result today: local/static proof passes, but `npm run check:pilot-readiness` still reports `role_scoped_pilot_account_proof` as `MANUAL_PROOF_REQUIRED` until the approved manifest exists.

## Hosted Proof Notes

Hosted checks may support the fake-account matrix only when they use approved fake `.test` credentials:

```powershell
npm run check:workspace:hosted-permissions
npm run prove:hosted-fake-pilot-browser
```

Do not run hosted proof with real student accounts until the school approves account provisioning, credential delivery, roster scope, support ownership, and privacy/data handling.

## Manifest Acceptance Criteria

The eventual manifest at `docs/progress/runs/real-student-pilot-role-scope-proof.json` must be redacted and include:

- Pilot owner, technical owner, and proof date.
- Account roles tested, with real credentials omitted.
- Fake/sanitized account source used before real accounts.
- Positive and negative checks for every role in the matrix.
- View as Student authorization and read-only results.
- Viewer mutation denial results.
- Student self-only and other-student denial results.
- Confirmation that no secrets, passwords, tokens, raw storage IDs, or real student rows appear.
- Final decision: pass, fail, or needs review.

## Current Decision

This blocker is narrowed by the matrix and tests, not closed. Real-student pilot remains **NO-GO** until the manual role-scope manifest exists and is reviewed.
