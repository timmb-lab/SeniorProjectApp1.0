# Student-Ready Pilot Closure Plan - 2026-07-05

This plan starts the student-ready pilot closure run from the current `main` state. It is a technical and operator-readiness plan, not an approval record. Real-student pilot readiness stays blocked until the required manual and policy evidence exists.

## 1. Starting SHA And Repo State

- Working directory confirmed: `C:\SeniorProjectApp1.0`.
- Branch confirmed: `main`.
- Starting SHA: `d2ecce830433dfc1490e8d337452c088d3924af7`.
- `origin/main` after fetch: `d2ecce830433dfc1490e8d337452c088d3924af7`.
- Ahead/behind after fetch: `0/0`.
- Working tree at start: clean.
- Latest commit: `d2ecce83 chore: close yuge max repo hygiene`.
- `C:\Curriculum` is outside this run and must remain untouched.

Npm scripts inspected from `package.json` include:

- Core checks: `test`, `check`, `typecheck`, `build:public-site`, `check:production-surfaces`, `check:route-inventory`, `check:generated-output-drift`.
- Readiness gate: `check:pilot-readiness`.
- Local proof: `seed:demo:local:dry-run`, `seed:demo:local`, `seed:demo:local:reset`, `prove:demo:local`, `prove:pilot:local`, `prove:workspace-ui-polish`.
- Hosted fake-account proof: `check:workspace:hosted-evidence`, `check:workspace:hosted-dashboard`, `check:workspace:hosted-permissions`, `prove:hosted-fake-pilot-browser`.
- Role and UI guardrails: `verify:permission-matrix`, `verify:mutation-origin`, `verify:workspace-navigation`, `verify:workspace-url-state`, `check:workspace-accessibility`, `check:workspace-errors`, `check:workspace-mobile`.

Surfaces inspected for this plan:

- `README.md`.
- `package.json`.
- `docs/demo/`.
- `docs/design/`.
- `docs/progress/runs/`.
- `docs/sales/`.
- `docs/security/role-access-matrix.md`.
- `tests/`.
- `scripts/`.
- `functions/api/`.
- `workspace.js`, `workspace.html`, and `workspace.css`.
- Readiness and proof scripts, including `scripts/check-real-student-pilot-readiness.mjs`.

## 2. Current Readiness Status

`npm run check:pilot-readiness` passes as a non-mutating static gate and reports:

- Final decision: `NO_GO_REAL_STUDENT_PILOT`.
- Hosted fake-account demo: `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`.
- Real-student production status: `NOT_CLAIMED_READY`.
- Status counts: 3 `PASS`, 1 `BLOCKED`, 2 `NON_BLOCKING_DEMO_ONLY`, 2 `FUTURE_PILOT_ITEM`, and 5 `MANUAL_PROOF_REQUIRED`.

Current honest status:

- Local fake-account demo readiness: green when the local fake-account proof stack passes.
- Hosted fake-account demo readiness: green for the checked fake `.test` account paths.
- Real-student pilot readiness: no-go until manual/policy evidence is complete.

## 3. Current Blocker List

The readiness gate currently requires these missing evidence manifests before a real-student pilot claim can change:

- `role_scoped_pilot_account_proof`: `docs/progress/runs/real-student-pilot-role-scope-proof.json`.
- `backup_restore_rehearsal_evidence`: `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json`.
- `real_roster_validation_evidence`: `docs/progress/runs/real-student-pilot-roster-validation-evidence.json`.
- `privacy_support_retention_approval`: `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json`.
- `sso_or_managed_local_credential_delivery`: `docs/progress/runs/real-student-pilot-credential-delivery-approval.json`.

Pilot-scope or future item:

- `archive_manifest_download_acceptance`: `docs/progress/runs/real-student-pilot-archive-download-evidence.json`, required only if archive/download is included in the first pilot.

## 4. What Can Be Closed By Code, Docs, And Tests

This run can close or reduce the following risks without real student data:

- Student-facing wording that is too technical, too staff-centered, or too hard for ESL/lower-reading-level students.
- Student empty states and error states that do not say what to do next.
- Regression tests that allow student surfaces to show internal terms such as RBAC, mutation, scope, hydration, fake pilot, proof script, or raw debug language.
- Staff/admin wording that affects safe student support, roster import, assignment, and review decisions.
- Synthetic roster dry-run coverage using fake or de-identified rows.
- Backup/restore runbook and non-real-data rehearsal packet templates.
- Role-scoped pilot proof matrix and fake pilot-shaped account expectations.
- Privacy/support/retention packet templates and review checklists.
- SSO or approved managed-local credential delivery decision packet.
- Archive/download pilot-scope decision language.
- Final proof report that keeps fake-account proof separate from real-student readiness.

## 5. What Cannot Be Closed Without Human Approval

This run cannot honestly complete:

- School or district privacy approval.
- Support ownership, response time, escalation, and retention approval.
- Real roster owner signoff.
- Real student data import validation.
- Production backup/restore approval for real student records.
- Approved live-school SSO tenant setup.
- Approved managed-local credential delivery for real users.
- Any claim that fake-account proof proves real-student pilot readiness.

These items must remain `MANUAL_PROOF_REQUIRED`, `POLICY-PENDING`, or `NO-GO` until durable evidence exists.

## 6. Student-Facing Language Risks

The current student UI already has a strong `My Capstone` model, but the source still contains student-visible terms that need careful review:

- Status words such as `Submitted`, `Pending`, `Needs revision`, and `Evidence`.
- Error words such as `Forbidden`, `Unauthorized`, and validation language.
- Technical or staff words that must stay out of normal student screens, including `scope`, `permission`, `workflow`, `manifest`, `pilot`, `fake`, and `proof script`.
- Long helper text around proof files, final checklist, presentation, and archive/download states.

The copy pass should prefer:

- `Turned in`.
- `Waiting for review`.
- `Needs changes`.
- `Proof files` or a short definition of Evidence where school language requires it.
- `You cannot open this page. If you think this is wrong, ask your teacher.`
- `Something went wrong. Try again or ask your teacher.`

## 7. ESL And Lower-Reading-Level Improvement Plan

Student screens should answer three questions:

1. What happened?
2. What should I do next?
3. Who can help?

Implementation approach:

- Audit student-facing copy in `workspace.js`, `workspace.html`, tests, and demo/onboarding docs.
- Add a durable copy inventory at `docs/design/student-facing-copy-audit-2026-07-05.md`.
- Replace high-impact page titles, status labels, empty states, error states, and primary action labels first.
- Keep required school terms only when needed, and define them once in simple words.
- Add tests that prevent banned technical/demo/proof language from returning to student surfaces.
- Preserve Student navigation as Today, My Work, Feedback, and Final Checklist.

## 8. Role-Scoped Pilot Account Proof Plan

Use fake but pilot-shaped accounts until the school approves real pilot accounts. The proof packet should show:

- Student sees only their own capstone, own work, own feedback, and own checklist.
- Student never sees Staff Workspace, Admin Console, View as Student, other students, imports, reports, or audit tools.
- Mentor sees only assigned students.
- Program Teacher stays inside assigned program/site scope.
- Viewer stays read-only and cannot mutate.
- Site Admin and Administration stay site/school scoped.
- Global Admin stays local-account-only for platform/security powers.
- View as Student remains staff-only, authorization-scoped, and read-only.

Expected evidence path after real operator proof exists:

- `docs/progress/runs/real-student-pilot-role-scope-proof.json`.

## 9. Synthetic Roster Validation Plan

Use fake or de-identified roster-like rows only. Do not use real student data.

Coverage goals:

- Required fields: first name, last name, email, site, program, status, cohort, and graduation year.
- Unknown site/program rejection.
- Duplicate row handling.
- Invalid email and graduation year rejection.
- Mentor/viewer assignment target validation.
- Student-as-mentor and elevated-target rejection before mutation.
- Preview-first behavior before any import write.
- Clear row-numbered errors in admin UI and docs.

Expected evidence path after operator proof exists:

- `docs/progress/runs/real-student-pilot-roster-validation-evidence.json`.

## 10. Backup/Restore Rehearsal Plan

This run may improve the runbook and evidence template. It must not perform destructive production restore work.

Rehearsal evidence should eventually include:

- Named technical owner and approver.
- D1 export method or Cloudflare-supported export path.
- Isolated non-real dataset.
- Restore target separated from production student data.
- Schema and migration state before and after restore.
- Smoke checks for `/api/health`, role/auth checks, student dashboard, staff directory, and archive readiness.
- Rollback plan and support contact.
- Confirmation no real student data was used.

Expected evidence path after operator proof exists:

- `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json`.

## 11. Privacy, Support, Retention Approval Packet Plan

Create or strengthen review-ready packet content for:

- Data owner.
- Pilot owner.
- Support owner.
- Emergency technical owner.
- Roster owner.
- Retention window and deletion/export expectations.
- Incident and support escalation.
- Audit reviewer.
- Student/family-facing support message if the app cannot load, login fails, or roster data is wrong.

Expected evidence path after approval exists:

- `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json`.

## 12. SSO Or Managed-Local Credential Plan

Do not weaken the Global Admin local-account requirement.

The credential decision packet should require one approved path:

- Google Workspace SSO for pilot staff/students, with tenant/domain and OAuth client approval, while Global Admin remains local-account-only.
- Approved managed-local account delivery with no visible setup passwords in docs, screenshots, logs, audit metadata, or normal UI.

Expected evidence path after approval exists:

- `docs/progress/runs/real-student-pilot-credential-delivery-approval.json`.

## 13. Student Archive/Export Scope Plan

Current gate status keeps archive manifest download as a future or pilot-scope-dependent item. This run should decide and document one of these:

- Exclude archive/download from the first pilot and keep it as a future item.
- Include it in first pilot scope only after hosted proof, retention approval, audit/logging review, and privacy acceptance exist.

No normal student UI should claim archive/download is ready unless the supporting hosted proof and policy evidence exist.

## 14. Screenshot And Proof Plan

Preferred proof order:

- Focused student copy and workspace tests.
- `npm run check:workspace-errors`.
- `npm run check:workspace-accessibility`.
- `npm run check:workspace-mobile`.
- `npm run verify:permission-matrix`.
- `npm run verify:mutation-origin`.
- `npm run prove:pilot:local`.
- `npm run prove:workspace-ui-polish` when UI copy/layout changes affect screenshots.
- Hosted fake-account gates only when the local proof stack is stable and the claim remains fake-account-only.

Screenshot updates should preserve the existing fake-account proof boundary and avoid committing timestamp-only churn unless the screenshot set is intentionally refreshed.

## 15. Test Plan

Add or update tests for:

- Student surfaces do not contain banned technical/demo language.
- Student nav remains Today, My Work, Feedback, and Final Checklist.
- Student cannot see Staff Workspace, Admin Console, or View as Student controls.
- Student error states include a next step.
- Student empty states are calm and helpful.
- Final Checklist unknown states use conservative language.
- Feedback and review states use `Waiting for review` and `Needs changes` where student-facing.
- Viewer has no mutation controls.
- Import validation errors keep row numbers where row data is available.
- Pilot evidence documents keep real-student readiness as `NO-GO` or `POLICY-PENDING` until required manifests exist.

Validation ladder for major stages:

- `git diff --check`.
- Focused `node --test ...` suites relevant to the stage.
- `npm test`.
- `npm run typecheck`.
- `npm run check`.
- `npm run check:pilot-readiness`.

## 16. Stop Conditions

Stop before editing, committing, or claiming readiness if any of these occur:

- Current branch is not `main`.
- Working tree contains unrelated changes.
- Any change would touch `C:\Curriculum`.
- A proposed UI or API change weakens RBAC, student privacy, View as Student, Viewer read-only behavior, or Global Admin local-account requirements.
- Real student data is required.
- Hosted proof is unavailable but would be required for the claim being made.
- Manual approval is missing but the claim would require it.
- A copy change risks exposing role/RBAC/debug details in student UI.

## 17. Expected Commits

Use separate commits after meaningful checked stages:

1. `docs: add student ready closure plan`.
2. `ui: simplify student facing language`.
3. `ui: clarify student capstone next steps`.
4. `ui: clarify staff and admin support language`.
5. `test: guard student plain language surfaces`.
6. `docs: add pilot evidence packet templates`.
7. `test: strengthen synthetic roster and role proof`.
8. `docs: close student readiness proof report`.

The final state should be `main` clean, pushed, and aligned with `origin/main` at `0/0`. If manual evidence is still missing, the final report must say the technical package is ready for administrator/policy review, not that real-student pilot approval is complete.
