# Backend Setup

Date: 2026-05-18

This records the first MVP backend foundation now configured for the Senior Capstone app.

## Accepted Direction

- Hosting: GitHub-connected Cloudflare Pages project `senior-capstone-app`.
- Backend runtime: Cloudflare Pages Functions in `functions/`.
- Database: Cloudflare D1 database `senior-capstone-db`.
- Auth for MVP pilot: hardened username/password, because district SSO is not available.
- Evidence uploads: Google Drive repository path, with D1 storing metadata and access state.

## Production Surface Boundary

`senior-capstone-app` is the canonical app/backend project. It may contain internal QA files in the repo, but normal production navigation must not route students, families, staff, or mentors into `alpha.html`, `account.html`, fake `.test` account flows, reset/report panels, or stakeholder option pages.

`senior-capstone-public` is a separate generated public companion guide project. It is production-safe public guidance, not the secure workflow app, and it must not proxy internal alpha/account/API routes.

`senior-capstone-option-titan` and `senior-capstone-option-primary` are stakeholder review projects only. Do not promote either as canonical production without updating `docs/production-deployment-policy.md` and `docs/production-surface-registry.md`.

Before a pilot-facing deploy, custom-domain cutover, or stakeholder option promotion/retirement, use `docs/production-predeploy-checklist.md`. Live Pages/D1 verification remains incomplete until `CLOUDFLARE_API_TOKEN` is available and `check:cloudflare:live` passes.

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
- Reset-required accounts can complete a credential rotation through `/api/auth/complete-reset`; the route requires the current password, rejects weak or unchanged replacements, clears reset state, increments password version, revokes stale sessions, creates a fresh session, and writes `password_reset_completed`.
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

## Local Workspace Smoke Seed

2026-05-20 local verification found the previous `invalid_credentials` blocker was caused by local D1 containing the migrated schema but no fake `.test` user rows, while the ignored credential file already existed from a previous seed. The local Pages dev server was reading `.wrangler/state/v3/d1`, and safe `.test` row queries returned no fake users before the new seed ran.

Use the local-only seed before credential-backed workspace smoke:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 scripts\seed-local-workspace-smoke.mjs
```

The script:

- applies local D1 migrations only with Wrangler `--local`;
- refuses `--remote`;
- creates or updates only fake `.test` users;
- writes passwords only to ignored `.secrets/local-workspace-smoke-accounts.json`;
- seeds student, program teacher, mentor, admin, misc admin, and no-role local accounts;
- seeds one student submission and evidence fixture for workspace evidence-link/upload checks;
- prints only redacted account/fixture metadata.

Run credential-backed local smoke with:

```powershell
$env:WORKSPACE_SMOKE_BASE_URL='http://127.0.0.1:8788'
$env:WORKSPACE_SMOKE_CREDENTIALS_FILE='.secrets\local-workspace-smoke-accounts.json'
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 tests\workspace-browser-smoke.test.mjs
```

The credential file is intentionally ignored by git through `.secrets/`. Never paste, commit, or print the passwords.

## 2026-05-20 Workspace/Live Verification Notes

- Local credential-backed workspace smoke now passes against `http://127.0.0.1:8788`: fake student login, session restore, dashboard, evidence link, Drive-missing upload blocker, unsupported upload denial, logout, and role-route coverage for `program_teacher`, `mentor`, `admin`, `misc_admin`, and no-role.
- In-app browser verification found and fixed a real workspace UI bug: `workspace.js` disabled evidence forms before reading `FormData`, causing the visible link form to post an undefined submission ID. The form data is now captured before controls are disabled.
- Live signed-out `https://senior-capstone-app.pages.dev/workspace.html` redirects to `/workspace`; the canonical route loads with the Senior Project Workspace title/assets/sign-in UI, `/api/auth/me` returns 401 `{ "authenticated": false }`, and signed-out logout returns `{ "ok": true }`.
- Live fake student login succeeds with the ignored `.test` credential file; the hosted browser renders the Student Workspace with no console errors, and the live credential-backed smoke verifies dashboard, evidence link, Drive-missing upload blocker, unsupported upload denial, and logout. Role-wide live coverage was not run because the local no-role account is local-only.
- Live `/api/health` reports `GOOGLE_DRIVE_EVIDENCE_ROOT_ID` and the evidence index configured, but `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY` are not configured. Real Drive upload/download remains blocked.
- Repo static Cloudflare checks pass, but non-interactive Wrangler/connector live Pages/D1 management remains blocked. Earlier runs had no exported `CLOUDFLARE_API_TOKEN`; on 2026-05-20 22:43 PT the token was present but Cloudflare rejected it as `Invalid access token [code: 9109]`.

## Remaining Required Config

- Add Cloudflare Pages secrets `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY` for production and preview before accepting file bytes from students. `GOOGLE_DRIVE_EVIDENCE_ROOT_ID` is already present in `wrangler.jsonc` and live health reports it configured.
- Add permission tests and workflow tests before real student data is entered.
- Add account lifecycle flows for invitation/import, admin reset initiation, active-user credential rotation, and role/group management before pilot use.

Current test-account workflow route coverage:

- `/api/auth/complete-reset` completes reset-required credential rotation with stale-session revocation and audit coverage.
- `/api/student/dashboard` reads D1 progress, submissions, and evidence for an authorized student record.
- `/api/submissions/:id/evidence` attaches scoped HTTPS evidence-link metadata while file-byte upload remains pending.
- `/api/submissions/:id/submit` moves draft/revision-requested submissions into submitted review state.
- `/api/teacher/review-queue` lists submitted/revision-needed work for program-scoped teachers or admins.
- `/api/mentor/assigned` lists active mentor assignments with submission status and evidence counts.
- `/api/reviews/:submissionId/decision` persists approval/revision decisions with review, status-history, progress, and audit writes.
- `/api/reviews/:submissionId/history` returns scoped review/status history.
- `/api/admin/announcements` lets admins create scoped announcements for all users, roles, programs, or cohorts.
- `/api/announcements` returns only currently visible announcements for the signed-in user's role/program/cohort scope.
- `/api/admin/exports/student-archive` verifies Drive repository/credential/provider readiness before successful archive generation; provider setup or access failures create a failed export row and `student_archive_export_provider_unavailable` audit event instead of claiming package delivery.
- When the provider is ready, `/api/admin/exports/student-archive` generates an admin-only scoped student archive manifest artifact from persisted progress/evidence rows, uploads the redacted manifest JSON into the configured Drive root, stores the Drive file ID only server-side in `exports.drive_file_id`, stores the scoped manifest body/hash/expiry in `export_artifacts`, includes configurable retention-window metadata, and records the export lifecycle audit event.
- `/api/exports/:id/download` checks admin or student-scope access, streams the generated JSON archive manifest when unexpired, emits only redaction/package-ready headers without raw Drive IDs, and returns an expired-package retry state after the download window.
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
