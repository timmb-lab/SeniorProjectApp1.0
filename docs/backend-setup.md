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
- 4 fake `.test` alpha accounts: one student, one program teacher, one mentor, and one misc-admin reporting account, with cohort/group/mentor/proposal/progress/submission/evidence fixtures.

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

The production D1 database is working and currently has 5 active users: Bryan's real admin account plus 4 fake alpha test accounts. Test credentials were generated into ignored local storage at `.secrets/test-accounts-2026-05-18.json`; do not commit, paste, or expose those passwords.

Seeded test accounts:

- `maya.student@senior-capstone.test` - student.
- `chen.teacher@senior-capstone.test` - program teacher scoped to IT.
- `rivera.mentor@senior-capstone.test` - mentor assigned to the test student.
- `reporting.miscadmin@senior-capstone.test` - misc admin scoped to alpha-readiness reporting.

These accounts are fake alpha data only. They are safe for role-flow testing but are not the final account lifecycle, import, password-reset, or district SSO replacement.

## Remaining Required Config

- Add Google Drive server-side credential/OAuth implementation before accepting file bytes from students.
- Add permission tests and workflow tests before real student data is entered.
- Add account lifecycle flows for invitation/import, password reset, credential rotation, and role/group management before pilot use.

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
