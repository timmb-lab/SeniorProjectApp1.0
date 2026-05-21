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

Before a pilot-facing deploy, custom-domain cutover, or stakeholder option promotion/retirement, use `docs/production-predeploy-checklist.md`. Live Pages/D1 verification is no longer the active blocker: on 2026-05-20 PT, a user-scope scoped token verified successfully, `check:cloudflare:live` passed, the Pages project was visible, and the D1 database id matched. Scoped-token `wrangler whoami` warnings can still appear and are non-blocking when token verify plus Pages/D1 lookup pass.

## Live Resources

- Cloudflare account: `539e8f7c55e7b1472013626ad72f4c7f`.
- Pages project: `senior-capstone-app`.
- Pages URL: `https://senior-capstone-app.pages.dev`.
- D1 database id: `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`.
- D1 region: `WNAM`.
- Google Drive evidence root folder: `https://drive.google.com/drive/folders/1XPgYKbIMqv332DAJZJNJetHppFB670e7`.
- Google Drive evidence index: `https://docs.google.com/spreadsheets/d/1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c`.

## Current Schema

Remote D1 migration state was corrected on 2026-05-20 PT. Wrangler initially reported all seven committed migrations pending because earlier schema work had been applied outside Wrangler's migration bookkeeping. The repo migrations are idempotent, so `npx wrangler d1 migrations apply senior-capstone-db --remote` applied and recorded:

- `0001_foundation.sql` - auth, users, roles, workflow, evidence, exports, audit, and app settings foundation.
- `0002_framework_seed.sql` - source-framework support tables.
- `0003_framework_seed_data.sql` - generated framework seed data.
- `0004_mentor_meetings.sql` - mentor meeting records.
- `0005_submission_versions.sql` - immutable submission version snapshots.
- `0006_presentation_slots.sql` - presentation scheduling and check-out/check-in state.
- `0007_archive_export_artifacts.sql` - scoped archive manifest artifacts.

After apply, `wrangler d1 migrations list senior-capstone-db --remote` reported no pending migrations. Remote schema probes verified `user_accounts`, `sessions`, `user_roles`, `submissions`, `evidence_repositories`, `evidence_artifacts`, `audit_events`, `exports`, `export_artifacts`, and `presentation_slots`.

Migration `migrations/0001_foundation.sql` creates users, password credentials, sessions, login attempts, roles, role assignments, programs, cohorts, groups, mentor assignments, requirements, progress records, status history, submissions, reviews, comments, evidence repositories, evidence artifacts, deadlines, announcements, exports, audit events, and app settings.

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
- Live `/api/health` now reports the Google Drive evidence root, index, client email part, and private key part configured. The service-account credential is present in the runtime, but live Drive access is still blocked because `/api/evidence/drive-probe` audits `rootStatus:404` and `indexStatus:404` for the configured root folder and index sheet. The fake upload route fails truthfully with `drive_upload_failed` and Drive status 404 rather than claiming success.
- Repo static Cloudflare checks pass, and non-interactive live Pages/D1 management is now verified with the scoped user-scope token. Earlier `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN` and `Invalid access token [code: 9109]` records are historical; the current Cloudflare state is resolved.

## 2026-05-20 Cloudflare/D1/Drive Live Bridge

Commands run with the Cloudflare token loaded only from user-scope environment:

```powershell
$env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
npm run check:cloudflare
npm run check:cloudflare:live
npm run check:drive:live
```

Results:

- `check:cloudflare` passed static Wrangler/D1 checks.
- `check:cloudflare:live` passed token verify, Pages project lookup, D1 database lookup, and D1 id match; `wrangler whoami` warned but was acceptable for this scoped token.
- Remote D1 migrations `0001` through `0007` are applied and recorded by Wrangler; required MVP tables were verified remotely without selecting student rows.
- `check:drive:live` is now the first-class Drive live gate. It logs in with ignored fake `.test` credentials, verifies pre-provider upload denials, checks live health, calls the deployed Drive probe, and, when Drive is ready, uploads one tiny fake proof file and verifies D1 metadata without selecting raw Drive file IDs.
- Current Drive classification is `DRIVE_ROOT_NOT_VISIBLE`: runtime credentials are configured and token exchange reaches Drive, but the service account receives HTTP 404 for both the configured root folder and index sheet. The blocked allowed-upload proof returns `drive_upload_failed` with Drive status 404.

The Google Drive human connector account visibility is not the app readiness proof. A human Google Drive connector not seeing the folder can be a warning, but the app is ready only when the Cloudflare Pages runtime service account can exchange a token, read the root folder, read the index sheet, upload a fake file, persist D1 metadata, and keep raw Drive IDs out of browser/API output.

## Remaining Required Config

- Share the configured Google Drive root folder with the configured service-account email as editor/content manager, and share the configured index sheet with the same service account as editor if index writes are expected or viewer if read-only index checks are enough. The Cloudflare Pages credential secret parts are present; the current blocker is Drive resource visibility/permissions, not a new Cloudflare token.
- Confirm the root folder and index sheet ids in `wrangler.jsonc` still point to the sandbox Workspace resources intended for this app, then rerun `npm run check:drive:live`.
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
