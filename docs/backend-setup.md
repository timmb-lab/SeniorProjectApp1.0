# Backend Setup

Date: 2026-05-18

This records the first MVP backend foundation now configured for the Senior Capstone app.

## Accepted Direction

- Hosting: GitHub-connected Cloudflare Pages project `senior-capstone-app`.
- Backend runtime: Cloudflare Pages Functions in `functions/`.
- Database: Cloudflare D1 database `senior-capstone-db`.
- Auth for MVP pilot: hardened username/password, because district SSO is not available.
- Evidence uploads: Google Drive repository path, with D1 storing metadata and access state.

## Live Resources

- Cloudflare account: `539e8f7c55e7b1472013626ad72f4c7f`.
- Pages project: `senior-capstone-app`.
- Pages URL: `https://senior-capstone-app.pages.dev`.
- D1 database id: `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`.
- D1 region: `WNAM`.
- Google Drive evidence root folder: `https://drive.google.com/drive/folders/1XPgYKbIMqv332DAJZJNJetHppFB670e7`.
- Google Drive evidence index: `https://docs.google.com/spreadsheets/d/1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c`.

## Current Schema

Migration `migrations/0001_foundation.sql` has been applied remotely. It creates users, password credentials, sessions, login attempts, roles, role assignments, programs, cohorts, groups, mentor assignments, requirements, progress records, status history, submissions, reviews, comments, evidence repositories, evidence artifacts, deadlines, announcements, exports, audit events, and app settings.

Seeded records:

- 5 roles: student, mentor, program teacher, admin, misc admin.
- 9 CTE programs.
- Default Google Drive evidence repository row pointing at the evidence root folder and index sheet.
- First real admin account: `bryan.timm89@gmail.com`.
- 5 fake `.test` alpha accounts: one student, one program teacher, one mentor, one admin, and one misc-admin reporting account, with cohort/group/mentor/proposal/progress/submission/evidence fixtures.

## Auth Boundary

The pilot auth flow uses:

- PBKDF2-SHA-256 password hashing with 100,000 Cloudflare Workers-compatible iterations and per-password salt.
- Optional `PASSWORD_PEPPER` secret for production.
- 14-character minimum password with lowercase, uppercase, number, symbol, and name/email checks.
- Login throttling after repeated failures.
- 12-hour HttpOnly, Secure, SameSite=Lax session cookies.
- Hashed session tokens, optional `SESSION_PEPPER`, logout revocation, and audit events.
- One-time admin bootstrap endpoint gated by `BOOTSTRAP_SETUP_KEY`; production setup key is removed after first-admin creation.
- Cloudflare Pages preview/production now have `PASSWORD_PEPPER` and `SESSION_PEPPER` stored as `secret_text` environment variables.

## Production Test Accounts

The production D1 database has been verified with Bryan's real admin account plus fake alpha test accounts. After reseeding with the current endpoint, the fake account set includes 5 `.test` users. Test credentials are generated into ignored local storage at `.secrets/test-accounts-2026-05-18.json`; do not commit, paste, or expose those passwords.

Seeded test accounts:

- `maya.student@senior-capstone.test` - student.
- `chen.teacher@senior-capstone.test` - program teacher scoped to IT.
- `rivera.mentor@senior-capstone.test` - mentor assigned to the test student.
- `lee.admin@senior-capstone.test` - admin.
- `reporting.miscadmin@senior-capstone.test` - misc admin scoped to alpha-readiness reporting.

These accounts are fake alpha data only. They are safe for role-flow testing but are not the final account lifecycle, import, password-reset, or district SSO replacement.

## Remaining Required Config

- Add Google Drive server-side credential/OAuth implementation before accepting file bytes from students.
- Add permission tests and workflow tests before real student data is entered.
- Add account lifecycle flows for invitation/import, password reset, credential rotation, and role/group management before pilot use.

Current test-account workflow route coverage:

- `/api/student/dashboard` reads D1 progress, submissions, and evidence for an authorized student record.
- `/api/submissions/:id/evidence` attaches scoped HTTPS evidence-link metadata while file-byte upload remains pending.
- `/api/submissions/:id/submit` moves draft/revision-requested submissions into submitted review state.
- `/api/teacher/review-queue` lists submitted/revision-needed work for program-scoped teachers or admins.
- `/api/mentor/assigned` lists active mentor assignments with submission status and evidence counts.
- `/api/reviews/:submissionId/decision` persists approval/revision decisions with review, status-history, progress, and audit writes.
- `/api/reviews/:submissionId/history` returns scoped review/status history.
- `/api/admin/announcements` lets admins create scoped announcements for all users, roles, programs, or cohorts.
- `/api/announcements` returns only currently visible announcements for the signed-in user's role/program/cohort scope.
- `/api/admin/exports/student-archive` queues admin-only student archive export records without generating real files yet.
- `/api/exports/:id/download` checks admin or student-scope access and reports pending signed-download state.
- `/api/reports/readiness` returns aggregate-only admin/misc-admin readiness counts without names, emails, or student-level rows.
- `/api/admin/audit-events` returns admin-only, redacted audit entries.

Completed on 2026-05-18:

- `GOOGLE_DRIVE_EVIDENCE_ROOT_ID` is set to `1XPgYKbIMqv332DAJZJNJetHppFB670e7` in Cloudflare Pages preview and production.
- D1 `evidence_repositories.root_folder_id` for `default-google-drive` is set to `1XPgYKbIMqv332DAJZJNJetHppFB670e7` and status is `active`.
- Google Drive connector metadata verified the folder as a Drive folder titled `Senior Project App`.
- Production deployment `17a04f3` verified `APP_ENV=production`, `userCount=1`, and live Day 7 alpha routes.
- First admin bootstrap completed for `bryan.timm89@gmail.com`; D1 verified active global admin role plus `bootstrap_admin_created` audit event.
- Login and `/api/auth/me` verified with the first admin account; `BOOTSTRAP_SETUP_KEY` was removed from Cloudflare Pages production and a redeploy made the live bootstrap endpoint return 403.
- Production deployment `c7908d04` for commit `dc2f82a` added the admin-only test-account seed endpoint; `/api/health` now verifies `APP_ENV=production`, `authMode=hardened_username_password`, Google Drive evidence config, and `userCount=5`.
- `POST /api/admin/test-accounts` seeded the four fake `.test` accounts plus alpha cohort, group membership, mentor assignment, requirement, progress, submission, and evidence fixtures; the endpoint returns 401 unauthenticated and 403 for a logged-in student.
- Login and `/api/auth/me` verified all four fake role accounts; D1 verification confirmed their roles/scopes plus `test_accounts_seeded` audit evidence.

R2 is no longer the MVP upload blocker because the accepted upload repository is Google Drive. R2 can remain a future fallback if enabled in the Cloudflare dashboard.
