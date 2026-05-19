# Day 7 Alpha Runbook

Target: a reviewer can walk the app flow without production accounts or real student records.

Do not enter real student records in this alpha.

Daily build framework:

- `docs/alpha-week-framework.md`

## Run

Use the Cloudflare Pages dev or preview environment so `/api/alpha/state` can read and write D1-backed alpha state.

Local command:

```bash
npm run dev:alpha
```

Open:

```text
http://localhost:8788/alpha.html
```

Optional account smoke page:

```text
http://localhost:8788/account.html
```

Use it to verify fake `.test` account login, session lookup, logout, returned role scopes, backend readiness, and the protected alpha evidence access check. The protected evidence result should match the signed-in fake account's expected allow/deny outcome. The smoke checklist should show the session, selected-account match, expected role scope, evidence outcome, and health readiness.

## Walkthrough

1. Student: save the proposal draft, attach an HTTPS evidence link, then submit.
2. Program Teacher: request a revision.
3. Student: resubmit the revision.
4. Program Teacher: approve the proposal.
5. Mentor: mark the mentor meeting held and optionally flag a presentation-slot risk.
6. Admin: queue the archive export and add a deadline notice.
7. Misc Admin: run the readiness report and try the restricted approval action to confirm permission denial.

Expected result:

- Dashboard aggregates update after each action.
- Walkthrough progress shows done, ready, and locked steps for the reviewer path.
- The Act Next card names the next required persona/action and can switch testers to that persona.
- Persona tabs mark the next responsible reviewer, reviewer checks summarize alpha readiness, and Copy Summary produces a quick walkthrough receipt.
- Review history records revision and approval decisions.
- Evidence metadata is visible without treating file-byte upload as complete.
- Audit/activity entries record the alpha actions.
- Out-of-order workflow actions are disabled in the UI or return a clear blocked-transition message.
- The UI labels that seeded personas are not production accounts.

## Optional Login Smoke Accounts

Five fake `.test` accounts exist for alpha login/session checks. Passwords are stored only in ignored local `.secrets/test-accounts-2026-05-18.json` and must not be copied into docs or screenshots.

- `maya.student@senior-capstone.test` - student.
- `chen.teacher@senior-capstone.test` - program teacher.
- `rivera.mentor@senior-capstone.test` - mentor.
- `lee.admin@senior-capstone.test` - admin.
- `reporting.miscadmin@senior-capstone.test` - misc admin.

## Validation

```bash
npm run check
```

This runs the alpha syntax check, alpha contract checker, alpha state-machine tests, and TypeScript check. The narrower state-machine test command is:

```bash
npm test
```

The test suite exercises the alpha state machine, permission denial, evidence URL validation, mentor action, admin export queue, and misc-admin report action.

Preview deployment command when Cloudflare auth and Wrangler are available:

```bash
npm run deploy:preview
```

## Current Alpha Coverage

- D1-backed seeded alpha state through `/api/alpha/state`.
- Login-verified fake `.test` role accounts for student, program teacher, mentor, admin, and misc admin.
- Initial D1-backed workflow endpoints exist for student dashboard reads, evidence-link attachment, student submission, teacher/admin review decisions, review history, teacher review queue, mentor assigned-student readout, scoped announcements, student archive export queue/status, misc-admin aggregate readiness reports, and admin audit-event readout.
- Account smoke page for fake account login/session/logout and protected evidence access checks.
- Account smoke page compares protected-evidence allow/deny results against the active fake account and flags unexpected scope behavior.
- Account smoke page includes a role-scope checklist, readable health readiness summary, copyable session summary, and one-click smoke sequence.
- Account smoke backend health check reports auth mode, D1 user count, evidence root/index readiness, and Google Drive credential readiness without exposing secret values.
- App shell with route controls for student workspace, teacher review, mentor meetings, admin overview, and audit activity.
- Seeded personas for student, program teacher, mentor, admin, and misc admin.
- Persona-scoped route availability with explicit misc-admin narrowing.
- Student dashboard, guided proposal sections, blocked-submit reasons, and evidence metadata entry.
- Teacher review queue actions for revision request and approval.
- State-machine guards prevent approving drafts, resubmitting before revision, moving approved proposals backward, and duplicating meeting/export actions.
- Reset is guarded by a confirmation prompt so reviewers do not accidentally clear the walkthrough state.
- Mentor meeting and archive export actions unlock only after proposal approval.
- Mentor meeting, presentation slot risk, and scoped mentor actions.
- Admin export/deadline actions, misc-admin report action, and denied approval action.
- Dashboard aggregates, review history, evidence validation, and audit/activity timeline updates.
- Alpha contract checker validates required personas, routes, workflow actions, mobile CSS breakpoints, accessibility anchors, no browser storage for student records, and no-real-student-data warnings.

## Known Alpha Gaps

- Password reset, invitations, account import, credential lifecycle, and full production account-management UI remain post-alpha hardening.
- Google Drive upload credentials, real file-byte upload, and signed retrieval remain incomplete; the root folder is selected and configured.
- Broader auth/permission/protected-evidence tests are still needed beyond the current alpha state-machine and contract checks.
- Cloudflare production proof exists for the current D1-backed alpha and fake account seed; each later commit still needs fresh deployment verification or an exact blocker.
