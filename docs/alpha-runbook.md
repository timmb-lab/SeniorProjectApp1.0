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
- Review history records revision and approval decisions.
- Evidence metadata is visible without treating file-byte upload as complete.
- Audit/activity entries record the alpha actions.
- The UI labels that seeded personas are not production accounts.

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
- App shell with route controls for student workspace, teacher review, mentor meetings, admin overview, and audit activity.
- Seeded personas for student, program teacher, mentor, admin, and misc admin.
- Persona-scoped route availability with explicit misc-admin narrowing.
- Student dashboard, guided proposal sections, blocked-submit reasons, and evidence metadata entry.
- Teacher review queue actions for revision request and approval.
- Mentor meeting, presentation slot risk, and scoped mentor actions.
- Admin export/deadline actions, misc-admin report action, and denied approval action.
- Dashboard aggregates, review history, evidence validation, and audit/activity timeline updates.
- Alpha contract checker validates required personas, routes, workflow actions, mobile CSS breakpoints, accessibility anchors, no browser storage for student records, and no-real-student-data warnings.

## Known Alpha Gaps

- Production login, first-admin bootstrap verification, password reset, invitations, and account import remain post-alpha hardening.
- Google Drive upload credentials, real file-byte upload, and signed retrieval remain incomplete; the root folder is selected and configured.
- Broader auth/permission/protected-evidence tests are still needed beyond the current alpha state-machine and contract checks.
- Cloudflare preview/production proof needs a fresh deployment verification after connector auth or local Wrangler access works.
