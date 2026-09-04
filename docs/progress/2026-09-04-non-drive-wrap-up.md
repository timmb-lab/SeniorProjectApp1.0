# Non-Drive completion wrap-up — September 4, 2026

## Completed

- Local and production support student-ID usernames without exposing internal account email values in the student-management list.
- Global Admin, Site Admin, and School Administrator users can open **Students → Manage Students → Edit placement** to change program, active status, mentor, or optional support partner/viewer. The server rechecks school scope and target roles, records an audit event, and revokes sessions when a student is made inactive.
- New accounts still use one-time setup handling and require a password change. The existing password-strength rules remain enforced.
- The supplied roster was validated as 25 unique names and student IDs after removing `#`. Grade was intentionally ignored. No mentor assignment is added.
- The full automated suite passed: 649 tests, 645 passed, 4 intentional local-HTTP skips, 0 failed.
- A fresh production browser run passed all 30 Viewer and School Administrator destinations in both Workspace and Admin Console, including Students, Projects, Profile, Security, Mentor Assignments, Presentation, Operations, Readiness, and Reports.
- A fresh hosted cross-role browser proof passed all 10 representative desktop, tablet, and mobile scenarios.

## Real-roster release boundary

The roster is technically ready, but no student PII was written to production because the repository's existing real-student gate requires recorded school/district approval for privacy, support ownership, retention, and managed credential delivery. The ignored local import utility is ready to create `timmb`, import the 25 students into IT, attach the Program Teacher to their projects, leave mentors blank, and generate unique first-login handoff passwords once that approval flag is deliberately enabled.

## Google Drive handoff

1. In Cloudflare Pages for `senior-capstone-app`, add production secrets `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY`.
2. Give that service account Editor or Content Manager access to the approved Shared Drive root configured for the app.
3. Redeploy current `main`.
4. Run `npm run prove:program-storage:live`.
5. Sign in as Program Teacher and confirm **Account → Profile → Program file storage** says **Ready**, then test one student PDF and DOCX preview, download, and open action.
