# Student Pilot Evidence Packet

Status: **POLICY REVIEW PACKET READY FOR ADMINISTRATOR REVIEW; real-student pilot remains NO-GO.**

This packet collects the evidence categories a school administrator, policy owner, support owner, roster owner, and technical owner must review before a real-student pilot. It is an operational packet, not legal advice, not FERPA certification, and not pilot approval.

## Current Decision

| Readiness area | Current status | Evidence or next action |
| --- | --- | --- |
| Fake-account local demo | GREEN for checked fake `.test` flows | `docs/sales/workspace-ui-polish-screenshot-index.md` |
| Hosted fake-account demo | GREEN for checked fake `.test` hosted flows | `docs/sales/hosted-browser-proof-screenshot-index.md` |
| Role-scoped pilot account proof | MANUAL_PROOF_REQUIRED | `docs/demo/role-scoped-pilot-account-proof.md`; expected manifest `docs/progress/runs/real-student-pilot-role-scope-proof.json` |
| Synthetic roster dry-run | READY FOR REVIEW, not real roster approval | `docs/demo/synthetic-roster-validation-dry-run.md` |
| Real roster validation | MANUAL_PROOF_REQUIRED | Expected manifest `docs/progress/runs/real-student-pilot-roster-validation-evidence.json` |
| Backup/restore rehearsal | RUNBOOK READY, evidence missing | `docs/demo/backup-restore-rehearsal-runbook.md`; expected manifest `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json` |
| Privacy/support/retention approval | MANUAL_PROOF_REQUIRED | Expected manifest `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json` |
| Credential delivery | MANUAL_PROOF_REQUIRED | Expected manifest `docs/progress/runs/real-student-pilot-credential-delivery-approval.json` |
| Archive/download | FUTURE PILOT ITEM unless first pilot includes archive handoff | `docs/demo/student-archive-export-scope-decision.md` |
| Real-student pilot | NO-GO | `npm run check:pilot-readiness` |

## Required Owners

Complete before any real student data is imported:

| Owner | Person | Required approval |
| --- | --- | --- |
| Pilot owner | TBD | Pilot scope, dates, participating school/site, and go/no-go decision |
| School/admin decision owner | TBD | School authorization to run the pilot |
| Privacy/data owner | TBD | Data categories, privacy review, retention/deletion expectations |
| Support owner | TBD | Help path, incident intake, escalation, and student/staff communication |
| Technical owner | TBD | Deploy health, backup/restore rehearsal, rollback/pause path |
| Roster owner | TBD | Approved source of truth and roster dry-run/preview evidence |
| School IT / credential owner | TBD | SSO or approved managed-local credential delivery |

## Privacy Review Checklist

The privacy/data owner must approve:

1. Data categories in `docs/demo/student-data-handling-summary.md`.
2. Student, staff, mentor, viewer, and admin role access in `docs/security/role-access-matrix.md`.
3. Whether proof uploads/links are in first pilot scope.
4. Whether archive/export/download is excluded or included.
5. Audit event retention and who can review audit events.
6. Where screenshots and proof reports may be stored.
7. Whether parent/student communication is required before launch.
8. Who can approve correction, retention, deletion, or data export requests.

## Support Plan

Before launch, the support owner must publish:

- Support contact name and channel.
- Hours or response expectation during the pilot.
- Login/access issue path.
- Wrong roster or wrong assignment path.
- Evidence upload/link issue path.
- Possible data exposure escalation path.
- Pause/stop authority.

Student-facing support language:

1. Sign in.
2. Open My Capstone.
3. Start on Today.
4. Do this next.
5. Ask your Program Teacher or support contact if something is missing or wrong.

## Data Retention And Deletion

Before launch, the privacy/data owner must decide:

- How long account records remain.
- How long capstone workflow records remain.
- Whether evidence files/links are stored in the app during the first pilot.
- Whether final-file/archive export is excluded.
- How to deactivate or remove accounts after the pilot.
- Who can request correction or deletion.
- Who confirms data was retained or removed.

Do not treat account deactivation as proof of deletion.

## Account Provisioning

Before any real account is created:

1. Approve the roster source and column mapping.
2. Approve either the SSO path or the managed-local credential path.
3. Confirm Global Admin remains local-account-only and protected.
4. Confirm staff roles and student assignments.
5. Run fake/synthetic CSV preview first.
6. Record support owner readiness.
7. Run `npm run check:pilot-readiness`.

## Account Deprovisioning

Before pilot start, decide:

- Who disables accounts at the end.
- Who removes role assignments.
- Who removes mentor/viewer assignments.
- What happens to evidence files or links.
- What happens to archive/final-file records.
- What emergency lockout action is allowed.

## Credential Delivery Plan

### Path A: Google Workspace SSO

Use this path only if school IT approves the live domain, OAuth configuration, allowed domains, and support process.

Requirements:

- Live school domain approved.
- OAuth callback and environment are verified.
- Student and staff accounts are matched to approved roster identities.
- SSO cannot create or use Global Admin.
- Local Global Admin break-glass account remains active.
- Login failure support path is published.

Status today: not approved for real-student pilot in this packet.

### Path B: Approved Managed-Local Credentials

Use this path only if school/admin and privacy/data owners approve managed local account delivery.

Requirements:

- Temporary credentials are generated only through approved app flows.
- Credential values are never committed, printed in docs, pasted into screenshots, or sent through unapproved channels.
- Users must reset temporary passwords on first sign-in.
- Support owner confirms how lost/expired credentials are handled.
- Global Admin remains local-account-only and named.

Status today: not approved for real-student pilot in this packet.

## Staff Onboarding

Use `docs/demo/staff-pilot-onboarding-checklist.md`.

Staff must know:

- Which students they can see.
- Which actions they can take.
- How Viewer read-only works.
- How View as Student works and that it is read-only.
- How to report wrong assignment, missing roster data, login issues, or possible data exposure.
- Fake-account proof is not real-student approval.

## Student Onboarding

Use `docs/demo/student-pilot-onboarding-checklist.md`.

Student language should stay simple:

1. Sign in.
2. Open My Capstone.
3. Check Today.
4. Do this next.
5. Open Feedback if something needs changes.
6. Ask for help if something is missing or looks wrong.

## Draft School/Parent Communication

Status: draft requiring school approval before use.

> Our school is preparing a limited Senior Capstone app pilot. The app helps students see what to do next, view feedback, and track proof files for their capstone work. The pilot will use approved school accounts and approved roster information only after school review. Students should use their own account, keep login information private, and report anything that looks wrong to their Program Teacher or the named support contact.

Do not send this message until the pilot owner and policy owner approve it.

## Required Evidence Before GO

Real-student pilot remains NO-GO until all required evidence exists and is reviewed:

- `docs/progress/runs/real-student-pilot-role-scope-proof.json`
- `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json`
- `docs/progress/runs/real-student-pilot-roster-validation-evidence.json`
- `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json`
- `docs/progress/runs/real-student-pilot-credential-delivery-approval.json`

Archive/download evidence is required only if archive/download is included in the first pilot:

- `docs/progress/runs/real-student-pilot-archive-download-evidence.json`

## Current Recommendation

Use this packet for administrator/policy review. Do not import real students or start a real-student pilot until the required manifests exist, owners approve them, and `npm run check:pilot-readiness` no longer reports `NO_GO_REAL_STUDENT_PILOT`.
