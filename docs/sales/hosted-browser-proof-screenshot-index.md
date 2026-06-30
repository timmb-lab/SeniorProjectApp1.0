# Hosted Browser Proof Screenshot Index

Date: 2026-06-29

Environment: `https://senior-capstone-app.pages.dev`

Proof status: `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`

Credential path: `HOSTED_FAKE_ACCOUNTS_USED_FOR_BROWSER_PROOF`

Manifest: `docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json`

Screenshot hygiene: `SCREENSHOTS_GENERATED_SAFE`

No-secret confirmation: the browser proof script checks for visible password values and secret-like rendered text, and the generated screenshots were spot-checked for visible passwords, `.secrets` content, Cloudflare tokens, OAuth secrets, raw D1 tables, raw Drive IDs/storage IDs, and credential files. None were observed. Fake `.test` persona identifiers may be visible.

Migration readiness: the browser proof records a redacted `/api/health` summary. Current hosted proof expects `databaseReady=true` and `studentRosterProfilesReady=true`; `studentRosterProfilesReady=false` blocks hosted browser proof as `HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016`.

## Screenshots

| File | Persona | Account type | Screen | Claim boundary | Notes |
| --- | --- | --- | --- | --- | --- |
| `docs/sales/screenshots/2026-06-29/01-signed-out-home.png` | Signed-out hosted workspace | No account / demo-only sign-in surface | Workspace sign-in/home route | Safe hosted screenshot, not real-student proof | Password field is empty; no credential values visible. |
| `docs/sales/screenshots/2026-06-29/02-student-dashboard.png` | Student | Fake `.test` demo-only account | Student workspace / My Work | Fake-account click-around proof only | Student lands on an understandable project dashboard with own-work scope. |
| `docs/sales/screenshots/2026-06-29/03-program-teacher-dashboard.png` | Program Teacher | Fake `.test` demo-only account | Program Dashboard | Fake-account click-around proof only | Program-scoped navigation and review/student entry points are visible. |
| `docs/sales/screenshots/2026-06-29/04-mentor-dashboard.png` | Mentor | Fake `.test` demo-only account | Mentor Dashboard | Fake-account click-around proof only | Mentor lands on assigned-student risk/support surface. |
| `docs/sales/screenshots/2026-06-29/05-viewer-directory.png` | Viewer | Fake `.test` demo-only account | Student Directory / read-only viewer | Fake-account click-around proof only | Viewer lands on the read-only student directory boundary. |
| `docs/sales/screenshots/2026-06-29/06-site-admin-dashboard.png` | Site Admin | Fake `.test` demo-only account | Site Dashboard | Fake-account click-around proof only | Site Admin lands on assigned-school dashboard/program/admin boundary. |
| `docs/sales/screenshots/2026-06-29/07-admin-command-center.png` | Global Admin | Fake `.test` demo-only account | Admin Command Center | Fake-account click-around proof only | Admin lands on platform command-center navigation. |
| `docs/sales/screenshots/2026-06-29/08-misc-admin-readiness.png` | misc_admin | Fake `.test` demo-only account | Readiness / limited legacy reporting | Fake-account click-around proof only | misc_admin is limited to aggregate readiness, matching expected behavior. |
| `docs/sales/screenshots/2026-06-29/09-student-mobile-dashboard.png` | Student mobile | Fake `.test` demo-only account | Mobile student workspace | Fake-account mobile smoke proof only | Narrow viewport is usable for fake-account smoke testing. |

## Known Limits

- This is Hosted fake-account click-around demo readiness only. It is not Real-student production pilot readiness.
- The proof covers first-load click-around surfaces and role boundaries; it does not submit destructive or mutation-heavy workflow actions.
- `student_archive_manifest_download` remains a Future pilot item and is `skipped_not_ready` in the hosted dashboard gate unless a scoped student manifest download is actually available.
- Generated remote staff credential files are not the walkthrough credential source; the proof uses the approved hosted fake `.test` accounts in ignored local secrets.
- Real-student onboarding still needs SSO, support, retention, data ownership, and policy approval work.
