# Real-Student Pilot Readiness Runbook

Status: **NO-GO for real-student pilot use until the manual/policy evidence below is complete and approved.**

This runbook closes the operational gap between fake-account demo readiness and a controlled real-student pilot. It is an operator checklist, not an approval by itself.

Use this runbook with `docs/security/role-access-matrix.md`, `docs/sales/real-student-pilot-readiness-gap-analysis.md`, `docs/sales/real-student-pilot-proof-plan.md`, `docs/demo/role-scoped-pilot-account-proof.md`, `docs/demo/synthetic-roster-validation-dry-run.md`, and `docs/demo/backup-restore-rehearsal-runbook.md`.

## Readiness Levels

### Fake-Account Local Demo Readiness

Means:

- Fake/demo accounts work locally.
- UI flows are screenshot-proofed with fake data.
- RBAC and read-only boundaries pass fake-account checks.
- No real student data is involved.

Does not mean:

- Approved for real students.
- Policy reviewed.
- FERPA/privacy process complete.
- Staff trained.
- School pilot authorized.

### Hosted Fake-Account Demo Readiness

Means:

- Hosted deployment works for approved fake `.test` accounts.
- Fake/demo accounts behave as expected.
- Browser proof/screenshots are green.
- Product behavior can be shown with non-real data.

Does not mean:

- Real-student pilot approved.
- Real roster import approved.
- Real credential delivery approved.
- Retention/support/privacy approved.

### Real-Student Pilot Readiness

Requires:

- Manual/policy evidence.
- Authorized school approval.
- Staff onboarding.
- Student data handling process.
- Account lifecycle process.
- Support/incident process.
- Rollback/no-go plan.
- Documented pilot scope.

## Pilot Scope

Complete this table before any real roster or account work starts.

| Field | Pilot value | Owner | Status |
| --- | --- | --- | --- |
| Pilot school/site | TBD | Pilot owner | NO-GO until named |
| Pilot dates | TBD | Pilot owner | NO-GO until named |
| Number of students | TBD | Roster owner | NO-GO until approved |
| Staff roles | TBD | Staff owner | NO-GO until scoped |
| Programs/cohorts | TBD | Roster owner | NO-GO until mapped |
| What the pilot tests | TBD | Pilot owner | NO-GO until scoped |
| What the pilot does not test | TBD | Pilot owner | NO-GO until scoped |

Default scope rule: keep the first pilot smaller than the app's full feature set. Exclude archive/download from the first pilot unless the archive evidence manifest is completed.

## Required Approvals

| Approval | Evidence needed | Owner | Status |
| --- | --- | --- | --- |
| School/admin approval | Written pilot approval and named decision owner | Pilot owner | NO-GO |
| Data/privacy approval | School/district policy-owner approval | Privacy/data owner | NO-GO |
| Staff owner | Named person responsible for staff usage and training | Staff owner | NO-GO |
| Technical owner | Named person responsible for deploy, health, rollback, and logs | Technical owner | NO-GO |
| Support owner | Named person responsible for issue intake and escalation | Support owner | NO-GO |
| Go/no-go decision owner | Named person who can pause, stop, or approve the pilot | Pilot owner | NO-GO |

## Student Data Handling

What may be stored after approval:

- Student account identity: name, email/login identifier, status.
- Roster profile: site, program, cohort, graduation year.
- Capstone workflow records: requirements, submissions, review status, feedback, due dates, presentation/final-file status.
- Evidence metadata and approved evidence files or links if evidence upload/linking is in pilot scope.
- Audit events for access, account, import, review, evidence, archive, and denied actions.

What should not be stored or exposed:

- Plaintext passwords.
- Unapproved real student data in fake/demo screenshots.
- Raw Drive IDs, tokens, private URLs, setup passwords, or credential material in UI, screenshots, proof manifests, or docs.
- Real roster rows before the roster owner and privacy/data owner approve the source and import process.

Where data lives:

- Cloudflare D1 stores app accounts, roles, roster profile, project workflow, and audit records.
- Google Drive-backed evidence or archive artifacts are used only if configured and approved for the pilot.
- Fake-account screenshots stay under `docs/sales/screenshots/` and must not include real student records unless explicitly approved.

Access model:

- Students see their own workspace only.
- Mentors see assigned students only.
- Program Teachers see assigned program/cohort/site work only.
- Viewers are read-only and assigned-student scoped.
- Administration and Site Admin roles stay school/site scoped.
- Global Admin remains a local account and is not created or operated through SSO.

The durable role contract is `docs/security/role-access-matrix.md`. If this runbook and the role matrix disagree, treat the pilot as NO-GO until the mismatch is resolved and tested.

Exports and retention:

- Final-file/archive export is excluded from the first pilot unless explicitly in scope and proven.
- Retention/deletion expectations must be approved before real student data is entered.
- Account deactivation does not by itself prove data deletion.

## Account Provisioning

Before provisioning:

- Confirm pilot scope, roster owner, and approved source of truth.
- Confirm SSO or approved managed-local credential delivery.
- Confirm Global Admin local-account caveat and named break-glass owner.
- Confirm role assignment, site/program scope, and test-account separation.
- Confirm setup-password/reset/support expectations if local accounts are used.

Provisioning steps:

1. Run `/api/health` and `npm run check:pilot-readiness`.
2. Run sanitized CSV preview with fake/synthetic pilot-shaped rows.
3. Confirm CSV templates and actual import implementation match.
4. Confirm mentor, viewer, Program Teacher, Administration, Site Admin, and Global Admin boundaries.
5. Create staff accounts first, then student accounts only after support is ready.
6. Record who approved the account set and when.

## Account Deprovisioning

Before pilot start, name the deprovisioning owner and emergency lockout path.

- Student removal/deactivation: disable sign-in or archive site access according to approved retention policy.
- Staff removal/deactivation: remove roles/site/program/student assignments before or with account deactivation.
- Role removal: remove only the scoped assignment needed; do not broaden access as a shortcut.
- Assignment cleanup: remove mentor/viewer/program-teacher assignments that are no longer valid.
- Data export/retention/deletion: follow school-approved retention policy; do not delete pilot data without owner approval.
- Emergency lockout: named technical owner disables affected accounts, rotates local credentials if needed, pauses imports, and documents the incident.

## Pre-Pilot Checklist

All items are required unless a named owner explicitly excludes the feature from pilot scope.

- Deployment health checked.
- DB migration health checked, including `studentRosterProfilesReady=true`.
- Auth health checked.
- Role/RBAC proof completed with pilot-shaped accounts.
- Student roster import dry run completed with fake/sanitized rows.
- CSV templates verified against preview/import implementation.
- Mentor and Program Teacher assignments verified.
- Viewer read-only verified.
- View as Student verified as authorization-scoped and read-only.
- Reports verified.
- Admin audit verified.
- Support contact ready.
- Rollback plan ready.

## During-Pilot Operating Procedure

Daily checks:

- Check `/api/health`.
- Check audit activity for denied access, account changes, failed uploads, and import attempts.
- Confirm support queue status.
- Confirm no staff member is blocked by wrong role/scope.
- Confirm no student is blocked by missing roster, missing assignment, or login problem.

How staff report issues:

- Staff reports go to the support owner with student/account identifiers redacted unless approved.
- Access issues include role, site, program, and expected assignment.
- Evidence/upload issues include browser, time, and app error text, not private file IDs.

What not to change during live use:

- Do not import real roster changes without roster-owner review.
- Do not broaden roles to work around one access issue.
- Do not run live migrations as a demo/pilot unblock step.
- Do not publish screenshots with real student data unless approved.

Wrong assignment/access issue process:

1. Pause the affected user action.
2. Confirm current role/scope in Admin Console and audit.
3. Correct the smallest assignment needed.
4. Verify denied broader access still fails.
5. Record support note and owner.

Student unable to access work process:

1. Confirm the student account status and login path.
2. Confirm roster site/program/cohort mapping.
3. Confirm workflow rows exist for the student.
4. Escalate to technical owner if auth or data is unavailable.

Pause pilot process:

- The go/no-go owner can pause immediately for access/data exposure, broken login at scale, incorrect roster mapping, missing backup/restore path, or unclear privacy/support ownership.

## Incident/Support Procedure

Severity levels:

- Sev 1: possible data exposure, cross-student access, credential leakage, or broad role escalation.
- Sev 2: multiple users blocked from login, submission, review, assignment, or roster access.
- Sev 3: one user blocked with no data exposure.
- Sev 4: cosmetic, documentation, or training issue.

Access/data exposure response:

1. Pause affected workflow.
2. Disable or narrow affected account/role if needed.
3. Preserve audit evidence without exposing private data.
4. Notify pilot owner, privacy/data owner, support owner, and technical owner.
5. Do not resume until the go/no-go owner approves.

Broken login response:

- Confirm SSO/local path, account status, reset requirement, and support contact.
- Do not share temporary passwords through unapproved channels.

Broken assignment response:

- Confirm student/site/program/mentor/viewer relationship.
- Fix the smallest assignment necessary.
- Verify Viewer remains read-only and View as Student remains read-only.

Incorrect student data response:

- Pause further edits to the affected record.
- Confirm roster source of truth.
- Correct with roster-owner approval.
- Record what was corrected and by whom.

Rollback/disable procedure:

- Technical owner disables affected routes/accounts or pauses imports.
- Restore from the rehearsed non-real backup/restore process only after owner approval.
- Communicate status using approved school channels.

Communication template placeholders:

- Incident summary:
- Affected users:
- What is paused:
- What remains safe to use:
- Owner:
- Next update time:

## Post-Pilot Checklist

- Export/retain needed records according to approved retention policy.
- Collect staff and student feedback.
- Remove/deactivate accounts if needed.
- Remove stale role assignments.
- Document issues and incident outcomes.
- Update backlog.
- Confirm retention/deletion handling.
- Decide whether archive/download remains excluded or moves into the next pilot scope.

## Go/No-Go Table

Missing manual evidence defaults to NO-GO.

| Requirement | Evidence needed | Evidence path/link | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Role-scoped pilot account proof | Approved pilot-shaped role walkthrough and denial checks | `docs/progress/runs/real-student-pilot-role-scope-proof.json` | Technical owner | NO-GO | Student, Mentor, Program Teacher, Viewer, Administration, Site Admin, Global Admin, and View as Student proof. |
| Backup/restore rehearsal evidence | Non-real D1 export/restore rehearsal and smoke proof | `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json` | Technical owner | NO-GO | Do not infer from migrations or fake screenshots. |
| Real-roster validation evidence | Roster-owner signoff and sanitized dry-run/preview evidence | `docs/progress/runs/real-student-pilot-roster-validation-evidence.json` | Roster owner | NO-GO | Source, fields, cohort, graduation year, site/program, mentor/viewer, duplicates, deactivation. |
| Privacy/support/retention approval | Written school/district approval | `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json` | Privacy/support owner | NO-GO | Operational summary is not legal advice. |
| SSO or managed-local credential delivery | Approved SSO proof or managed local credential delivery approval | `docs/progress/runs/real-student-pilot-credential-delivery-approval.json` | School IT / technical owner | NO-GO | Global Admin remains local-account-only. |
| Archive/download, if in scope | Hosted proof that archive manifest download is ready | `docs/progress/runs/real-student-pilot-archive-download-evidence.json` | Privacy/retention owner | Future pilot item | Exclude unless first pilot needs archive handoff. |

Supporting closure docs that narrow, but do not close, blockers:

- `docs/demo/role-scoped-pilot-account-proof.md`
- `docs/demo/synthetic-roster-validation-dry-run.md`
- `docs/demo/backup-restore-rehearsal-runbook.md`

## Validation Commands

Run before any go/no-go meeting:

```powershell
npm run check:pilot-readiness
npm test
npm run typecheck
npm run check
npm run prove:workspace-ui-polish
```

The expected honest result today is still NO-GO for real-student pilot readiness.
