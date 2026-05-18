# Day 7 Alpha Runbook

Date: 2026-05-18

This runbook tracks the working alpha due Sunday, 2026-05-24 PT. The alpha is allowed to use seeded/demo personas while production accounts remain incomplete, but it must never be represented as safe for real student records.

## Local Run

```powershell
npm run dev:alpha
```

Open:

```text
http://localhost:8788/alpha.html
```

This requires Node/npm plus Wrangler from the project dev dependencies. The page first requests `/api/alpha/state`, a Cloudflare Pages Function backed by a server-owned seed object. If the function is unavailable, the browser falls back to `data/alpha-demo-state.json` for static review.

## Current Alpha Coverage

- App shell with route controls for student workspace, teacher review, mentor meetings, admin overview, and audit activity.
- Seeded personas for student, program teacher, mentor, admin, and misc admin.
- Persona-scoped route availability with explicit misc-admin narrowing.
- Student dashboard, guided proposal sections, blocked-submit reasons, and evidence metadata entry.
- Teacher review queue actions for revision request and approval.
- Mentor meeting make-up, outline approval cue, presentation slot conflict, and check-in actions.
- Admin aggregate overview, deadline blocks, export-control placeholder, and audit/activity timeline.
- In-memory alpha transitions that update the dashboard, review state, mentor state, and audit timeline without using `localStorage`.

## Known Alpha Gaps

- Alpha transitions are in memory only; D1 persistence for proposal/review/evidence workflow comes next.
- Production login, first-admin bootstrap, password reset, invitations, and account import remain post-alpha hardening.
- Google Drive root folder ID, upload credentials, real file-byte upload, and signed retrieval remain incomplete.
- CI/test coverage for alpha routes, permissions, protected evidence, and status transitions is still missing.
- Cloudflare preview proof needs a fresh deployment attempt after the alpha route is verified locally.

## Acceptance Walkthrough Target

1. Open the alpha route.
2. Review the student workspace as Jordan Lee.
3. Add evidence metadata, clear blocked-submit state where possible, and submit.
4. Switch to program teacher, request revision, then approve.
5. Switch to mentor, record make-up completion, resolve slot conflict, and check in.
6. Switch to admin and verify dashboard aggregates and audit events changed.
7. Switch to misc admin and confirm the view stays narrow and read-only.
8. Verify the mobile viewport has no horizontal overflow.
