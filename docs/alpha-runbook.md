# Day 7 Alpha Runbook

Target: a reviewer can walk the app flow without production accounts or real student records.

## Run

Use the Cloudflare Pages dev or preview environment so `/api/alpha/state` can read and write D1-backed alpha state.

Local command:

```bash
npm run dev
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
npm test
```

The test suite exercises the alpha state machine, permission denial, evidence URL validation, mentor action, admin export queue, and misc-admin report action.
