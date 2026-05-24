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

## Hosted Data/API Proof

- [ ] Run `npm run prove:remote:migration-0011`.
- [ ] Run `npm run prove:demo:remote`.
- [ ] Run `npm run prove:sales-demo:hosted`.
- [ ] Confirm hosted status is `HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING`.
- [ ] Confirm no screenshots are claimed unless Phase 14 browser artifacts exist.
- [ ] Confirm generated remote staff credentials are not shown; use only an approved fake hosted credential path for browser walkthroughs.

## Persona Checks

- [ ] Avery Administration can sign in.
- [ ] Primary IT Program Teacher can sign in.
- [ ] Valeria Viewer can sign in.
- [ ] Primary Mentor can sign in.
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
- [ ] If hosted/prod is asked, say fake-data API proof is ready but browser/screenshot proof is still pending.
- [ ] If compliance is asked, say compliance certification is not claimed.
