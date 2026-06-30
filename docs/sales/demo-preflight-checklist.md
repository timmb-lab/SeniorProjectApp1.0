# Demo Preflight Checklist

## Local Reset And Proof

- [ ] Confirm repo is `C:\SeniorProjectApp1.0` on `main`.
- [ ] Run `git status --short --branch` and confirm expected state.
- [ ] Run `npm run seed:demo:local:reset`.
- [ ] Run `npm run prove:demo:local`.
- [ ] Run `npm run prove:sales-demo:local`.
- [ ] Confirm proof shows 3 fake sites and 370 fake students.
- [ ] Confirm Desert Valley High School has 250 fake students.
- [ ] Confirm secondary sites have 60 fake students each.
- [ ] Confirm no announcements.
- [ ] Confirm no student credentials.
- [ ] Confirm no raw Drive/storage/secrets in proof output.

## Browser Setup

- [ ] Start local app with `npm run dev`.
- [ ] Open the Wrangler local URL for `workspace.html`.
- [ ] Use a clean browser profile or private window.
- [ ] Close `.secrets`, token, OAuth, and raw database tabs.
- [ ] Confirm no credential files are visible.
- [ ] Confirm a fallback copy of `docs/sales/admin-demo-script.md` and `docs/sales/demo-one-page-leavebehind.md` is open or ready.
- [ ] For a hosted demo, open `docs/sales/demo-day-operator-script.md` and follow its role order.

## Hosted Fake-Account Proof

- [ ] Confirm hosted `/api/health` reports `databaseReady=true`.
- [ ] Confirm hosted `/api/health` reports `studentRosterProfilesReady=true`.
- [ ] Run `npm run check:workspace:hosted-permissions`.
- [ ] Run `npm run check:workspace:hosted-dashboard`.
- [ ] Run `npm run check:workspace:hosted-evidence`.
- [ ] Run `npm run prove:hosted-fake-pilot-browser`.
- [ ] Confirm hosted fake-account browser status is `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`.
- [ ] Confirm screenshot index exists at `docs/sales/hosted-browser-proof-screenshot-index.md`.
- [ ] Confirm generated remote staff credentials are not shown; use only the approved hosted fake `.test` accounts for browser walkthroughs.

## Legacy Hosted Synthetic Seed Gate

- [ ] Run `npm run prove:remote:migration-0011` only when the technical reviewer asks for the migration 0011 read-only proof.
- [ ] Run `npm run prove:demo:remote` only when the technical reviewer asks for the legacy synthetic hosted API gate.
- [ ] Run `npm run prove:sales-demo:hosted` only when the technical reviewer asks for the legacy synthetic hosted sales-demo gate.
- [ ] Confirm the legacy synthetic hosted sales-demo proof result. Current expected result is `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING` unless a new approved remote demo seed has run.
- [ ] Do not run remote seed writes, remote resets, migrations, deploys, or credential commands during demo preflight without a separate approval gate.

## Persona Checks

- [ ] Follow `docs/sales/demo-day-operator-script.md` for the hosted role order and account labels.
- [ ] Avery Administration can sign in.
- [ ] Primary IT Program Teacher can sign in.
- [ ] Viewer can sign in and lands on the read-only student directory boundary.
- [ ] Primary Mentor can sign in and lands on the mentor dashboard.
- [ ] Student can sign in and lands on My Work.
- [ ] Site Admin can sign in and lands on the assigned-school dashboard.
- [ ] misc_admin can sign in and remains limited to aggregate readiness.
- [ ] Log out between personas.
- [ ] Do not show password files or credential values.

## Screen Checks

- [ ] Site Dashboard loads.
- [ ] Students directory loads.
- [ ] `Rich Timeline Demo` opens student detail.
- [ ] Review Queue loads for program teacher.
- [ ] Mentor Assignments loads for Administration.
- [ ] Operations loads.
- [ ] Viewer read-only marker appears.
- [ ] View as Student appears only for authorized staff contexts and stays read-only.
- [ ] Students cannot activate View as Student.
- [ ] Add Student shows site/program/cohort/graduation-year fields only when hosted health reports `studentRosterProfilesReady=true`.
- [ ] CSV preview blocks unsafe mentor/viewer assignments before final import.
- [ ] Student mobile workspace is usable enough for smoke testing.
- [ ] No announcements appear.
- [ ] No scheduling/archive retry/export controls appear in Operations.

## Story Student Checks

- [ ] `Model Excellent Demo`
- [ ] `Missing Mentor Demo`
- [ ] `Awaiting Review Demo`
- [ ] `Revision Loop Demo`
- [ ] `Presentation Pending Demo`
- [ ] `Archive Ready Demo`
- [ ] `Archive Failed Demo`
- [ ] `High Risk Demo`
- [ ] `Rich Timeline Demo`

## Fallback Ready

- [ ] If local screen fails, use `docs/sales/technical-proof-checklist.md`.
- [ ] If hosted/prod is asked, say fake-account hosted pilot proof is green for fake-account click-around only, not real-student production.
- [ ] If compliance is asked, say compliance certification is not claimed.
