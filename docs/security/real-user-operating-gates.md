# Real-User Operating Gates

Real student and staff accounts are blocked in production until the school or district records the approvals below. Fake `.test` accounts remain available for product testing. This document is an operating record, not approval.

## Required Approval Record

Create `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json` only after every owner below has approved the exact pilot scope.

| Gate | Named owner required | Decision to record | Minimum evidence |
| --- | --- | --- | --- |
| Student privacy | School or district privacy owner | Approved or declined | Data fields, viewers, school separation, Drive-link behavior, and student/parent notice reviewed |
| Support | Support owner | Approved or declined | Contact path, coverage hours, urgent escalation, and account-recovery owner reviewed |
| Retention | Records or retention owner | Approved or declined | D1 records, audit logs, exports, Google Drive links, deletion timing, and legal hold reviewed |
| Incident response | Security or IT owner | Approved or declined | Incident contact, severity levels, notification path, containment steps, and evidence preservation reviewed |
| Data ownership | School or district data owner | Approved or declined | School-owned data, student-owned Drive files, export rights, offboarding, and vendor access reviewed |
| Roster | School roster owner | Approved or declined | Source roster, site/program mapping, adult assignments, duplicate handling, and withdrawal handling reviewed |
| Account delivery | School account owner | Approved or declined | Private delivery of 30-minute one-time setup codes and identity checks reviewed |

## Enforced Application Gate

Production account creation for any active, non-`.test` address returns `pilot_approval_required` unless the deployment variable `REAL_STUDENT_PILOT_APPROVED` is exactly `true`. Do not set that variable from a verbal request or technical test. Set it only after the approval record exists and the release owner checks it.

The separate retention setting stays `policy_review_required` until the retention owner approves a policy. Google Workspace SSO stays disabled unless separately approved; this gate does not enable it.

## Approval Record Template

The JSON record must include:

- `decision`: `APPROVED` or `DECLINED`.
- `approvedAt`: date and time with time zone.
- `pilotScope`: schools, roles, dates, and maximum users.
- One object for each gate above with the owner’s name, title, decision, date, and evidence reference.
- `releaseOwner`: the person allowed to set or remove the production flag.
- `rollbackOwner`: the person responsible for disabling the pilot and preserving evidence.
- `retentionStatus`: the approved retention policy identifier or `policy_review_required`.
- `ssoStatus`: keep `DISABLED_NOT_APPROVED` unless a separate approval is attached.

## Stop and Roll Back

If an approval expires, an owner withdraws approval, or a privacy/security incident occurs:

1. Remove or set `REAL_STUDENT_PILOT_APPROVED=false`.
2. Disable affected accounts; do not delete evidence during an incident.
3. Record an incident owner and timeline.
4. Follow the approved retention and notification rules.
5. Reopen only after every required owner signs a new approval record.
