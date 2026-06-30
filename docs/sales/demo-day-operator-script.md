# Demo Day Operator Script

Date: 2026-06-30

Use this as the live hosted walkthrough script. It is written for a staff/admin demo using fake `.test` accounts only.

## Current Status

- Demo claim: Hosted fake-account click-around demo readiness is green.
- Health signal to confirm before the demo: `/api/health` reports `databaseReady=true` and `studentRosterProfilesReady=true`.
- Proof status to cite: `HOSTED_FAKE_ACCOUNT_PILOT_GREEN` and `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`.
- Real-student production pilot readiness: No-go / not claimed.
- `student_archive_manifest_download`: Future pilot item; intentionally `skipped_not_ready`. Do not demo it as a completed workflow.
- Legacy synthetic hosted sales-demo seed: deprecated compatibility check only. Current missing-seed status is `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING`; the historical label `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING` means the old synthetic seed was absent, not that the current hosted fake-account demo is blocked.

Do not run migrations, remote seeds, resets, deploys, or credential commands during the live demo unless a separate approved migration/deployment gate exists. Treat migration `0016_student_roster_profiles.sql` as an already-applied health signal to verify through `/api/health`, not as a live-demo migration step. If `studentRosterProfilesReady=false`, do not demo Add Student or CSV roster profile fields.

## Demo Readiness Summary

| Area | Demo-day status | Evidence | Is it a live-demo blocker? | Notes |
| --- | --- | --- | --- | --- |
| Hosted app loads | Go | Hosted workspace route and screenshot manifest show `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`; `/api/health` must be reachable. | No-go if unreachable | Switch to screenshots/proof docs if the hosted app or health endpoint is down. |
| Login/auth | Go with canonical fake `.test` accounts | Hosted browser proof logs in the role accounts from the ignored credential source. | No-go if a non-`.test` account or visible password file is needed | Never show credentials, tokens, or password material. |
| Student roster profile health | Go when health is green | `/api/health` reports `databaseReady=true` and `studentRosterProfilesReady=true`. | No-go for Add Student / CSV roster profile demos if false | Health signal only; do not run migration `0016_student_roster_profiles.sql` during the demo. |
| Fake `.test` role accounts | Go | Canonical fake `.test` accounts cover Student, Program Teacher, Mentor, Viewer, Site Admin, Admin, and misc_admin. | No-go if canonical fake accounts cannot sign in | These are the walkthrough accounts; generated legacy staff credentials are not the source. |
| View as Student | Go for authorized staff only | Operator script and workspace tests cover staff-only, read-only preview behavior. | No-go if students can enter it or staff can open unauthorized students | Always exit the preview before switching personas. |
| Add Student | Caveat | Form and validation are safe to show when roster profile health is green. | No-go for live create/import if `studentRosterProfilesReady=false` or real/non-`.test` data is required | Prefer showing validation; create only fake `.test` accounts when explicitly planned. |
| CSV Student Import | Caveat | Preview blocks duplicates, unsafe scopes, invalid years, and student-as-mentor/viewer assignments. | No-go for final import if health is false or the CSV includes real students | Use preview as the main demo. |
| Viewer read-only | Go | Hosted screenshot and permission checks show read-only viewer boundaries. | No-go if Viewer has mutation controls | Viewer may inspect assigned student context only. |
| Program Teacher scope | Go | Hosted Program Teacher screenshot plus review-queue integration tests. | No-go if Program Teacher sees broad school/global data | Review mutation remains scoped to authorized submitted work. |
| Mentor scope | Go | Hosted Mentor screenshot plus mentor API/integration proof. | No-go if Mentor sees unassigned students | Mentors stay assigned-student only. |
| Site Admin/Admin/Global Admin boundaries | Go with caveat | Hosted Site Admin and Admin screenshots plus permission tests. | No-go if a role sees broader student data than its scope allows | Global Admin is a fake-account command-center view, not real pilot approval. |
| Archive manifest download | Future pilot item | Hosted dashboard gate records `student_archive_manifest_download` as `skipped_not_ready` unless a scoped student manifest URL exists. | No, unless someone claims archive download is finished | Owner-style acceptance: fake student archive export produces a scoped app download, no storage IDs leak, hosted dashboard proof marks it `passed`, screenshot/docs are updated, and pilot retention policy is approved. |
| Legacy synthetic hosted sales-demo seed | Caveat | `prove:sales-demo:hosted` is a deprecated read-only compatibility check; missing seed reports `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING`. | No | Do not reseed during demo day. Historical `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING` is not the current fake-account demo gate. |

## Account Source

Use the approved hosted fake `.test` accounts from the ignored credential source. Do not show the credential file, passwords, tokens, Cloudflare screens, OAuth secrets, or raw database tables.

| Order | Role to show | Hosted fake account label | Start at | What to prove |
| ---: | --- | --- | --- | --- |
| 0 | Signed out | No account | `/workspace.html` | Clean protected workspace sign-in surface. |
| 1 | Student | `maya.student@senior-capstone.test` | `/workspace.html?section=student` | Student sees only their own work, proof, feedback, deadlines, presentation, and final-file paths. |
| 2 | Program Teacher | `chen.teacher@senior-capstone.test` | `/workspace.html?section=programDashboard` | Program-scoped dashboard, Students, Review Queue, and authorized read-only View as Student. |
| 3 | Mentor | `rivera.mentor@senior-capstone.test` | `/workspace.html?section=mentorDashboard` | Assigned-student-only mentor view. |
| 4 | Viewer | `sam.viewer@senior-capstone.test` | `/workspace.html?section=students` | Assigned-student read-only monitoring, with no mutation controls. |
| 5 | Site Admin | `parker.siteadmin@senior-capstone.test` | `/workspace.html?section=siteDashboard` | Assigned-school dashboard, Students, Programs, People & Access, mentor/viewer coverage. |
| 6 | Global Admin | `lee.admin@senior-capstone.test` | `/workspace.html?section=adminDashboard` | Platform command center for the currently allowed fake-account scope. |
| 7 | Reporting Admin | `reporting.miscadmin@senior-capstone.test` | `/workspace.html?section=readiness` | Aggregate readiness only, without individual student operations. |

The hosted proof uses the `admin` role as the Global Admin command-center persona. If an `administration` fake account is available in a local or future hosted set, use it for the school-operations path between Program Teacher and Site Admin; otherwise use Site Admin for the People & Access demonstration.

## Role Walkthrough

1. Signed out
   Say: "This is a protected hosted workspace. Today uses fake accounts and fake data only."

2. Student
   Show: My Work, Upcoming deadlines, proof, feedback, Presentation, Final Files.
   Say: "Students see their own Senior Project path. They do not see staff worklists, admin routes, or other students."
   Do not show: any staff View as Student entry point from a student login.

3. Program Teacher
   Show: Program Dashboard, Students, Review Queue.
   Say: "Program Teachers see their scoped program work. Review actions stay scoped to authorized submitted work."
   View as Student: enter only from an authorized student row, point out the read-only banner, then exit.

4. Mentor
   Show: Mentor Dashboard and Assigned Students.
   Say: "Mentors see the students assigned to them, not a full school directory."

5. Viewer
   Show: Students directory and one student detail.
   Say: "Viewer is visibility-only. This role is useful for support staff who need context but should not change records."
   Check: no approve, assign, schedule, account, or import mutation controls are available.

6. Site Admin
   Show: Site Overview, Students, Programs, People & Access, Mentor Assignments.
   Say: "Site Admin is the safest live persona for school setup and roster coverage because the account is scoped to the assigned school."
   Show coverage: assigned mentor/viewer rows, missing mentor coverage, and read-only access summaries before editing anything.

7. Global Admin
   Show: Admin Command Center and site switch/scope language if needed.
   Say: "This is the broader fake-account admin view. It is not a claim that a real district pilot is approved."

8. Reporting Admin
   Show: Readiness.
   Say: "This role can review aggregate readiness without opening individual student operations."

## Add Student Safe Demo

Use Site Admin unless a specific higher-scope admin proof is needed.

1. Open People & Access.
2. Choose Add Student.
3. Point out required scope fields: school/site, program, status, cohort, and graduation year.
4. Point out optional support fields: assigned mentor and assigned viewer.
5. Say: "Mentor and Viewer assignments must target existing scoped staff. Unsafe targets are blocked before the account is created."
6. For a live demo, prefer showing the form and validation messages. Create only fake `.test` accounts and only when the demo explicitly needs a mutation.
7. Do not show generated passwords. Confirm the setup-password delivery process without exposing the password value.

Safe line if asked about migration readiness:

> "The hosted health check is green for roster profile fields today: `databaseReady=true` and `studentRosterProfilesReady=true`. If that ever turns false, we pause student create/import demos until the migration gate is fixed."

## CSV Import Safe Demo

Use the preview step as the main demo. Do not import live unless the audience explicitly needs to see a fake-account mutation.

Preview first, import only after the row summary is clean and the demo intentionally calls for creating fake accounts.

Student CSV columns to mention:

```text
first_name,last_name,email,site,program,status,cohort,graduation_year,mentor_email,viewer_email
```

Staff CSV columns to mention:

```text
first_name,last_name,email,role,site,program,status,assigned_student_emails
```

Safe preview pattern:

1. Paste or upload a small fake `.test` CSV.
2. Click Preview.
3. Show that duplicate emails, out-of-scope sites/programs, invalid graduation years, unknown mentors/viewers, and student-as-mentor/student-as-viewer assignments are blocked before import.
4. Show the summary counts for new rows, existing rows, mentor assignments, viewer assignments, and rows with errors.
5. Do not click Final Import unless the planned demo includes creating fake accounts.

## View As Student Safe Demo

- Staff only: Program Teacher, Mentor, Viewer, Administration/Site Admin, and Global Admin may see the entry point when authorized.
- Students cannot activate View as Student.
- Staff can only enter for authorized students.
- The preview is read-only; Viewer remains read-only inside the preview.
- Always exit the preview before switching personas.

## No-Go Checks

Stop or switch to screenshots/proof docs if any of these are true:

- `/api/health` is unreachable.
- `/api/health` reports `databaseReady=false`.
- `/api/health` reports `studentRosterProfilesReady=false`.
- A non-`.test` credential is required.
- A page shows passwords, tokens, raw Drive IDs, private URLs, or raw database internals.
- Any role sees broader student data than its scope should allow.
- Viewer has a mutation control.
- Student can reach staff-only View as Student or admin actions.

## Close

Say:

"This hosted demo proves fake-account click-around readiness for the main roles. It does not claim real-student production pilot readiness. A real pilot still needs legal, security, SSO, data ownership, retention, support, and onboarding approval."
