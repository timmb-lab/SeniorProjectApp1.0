# Student Data Handling Summary

This document is an operational summary, not legal advice. It must be reviewed by the school/district policy owner. The pilot should not proceed until approved.

## Purpose Of The App

The Senior Capstone App helps students track capstone requirements, proof, submissions, feedback, presentation/final-file status, and support from assigned staff. It also gives staff scoped tools for review, mentoring, roster setup, reporting, and audit follow-up.

## Student Data Categories

Potential pilot data categories:

- Student identity: name, email/login identifier, account status.
- Roster profile: school/site, program, cohort, graduation year.
- Capstone workflow: requirements, due dates, progress, submissions, review status, feedback, presentation, and final-file readiness.
- Evidence: approved file/link metadata and evidence content if upload/linking is included in pilot scope.
- Access/audit metadata: role assignments, mentor/viewer assignments, import attempts, login/session events, denied access, review decisions, and export/archive events.

## Staff Access By Role

- Student: own records only.
- Mentor: assigned students only.
- Program Teacher: assigned program/cohort/site work only.
- Viewer: assigned student context in read-only mode.
- Administration: scoped school/program operational work.
- Site Admin: assigned-site users, assignments, programs, imports, reports, and allowed audit/reporting surfaces.
- Global Admin: platform-level local-account-only admin access, separated from SSO.

## Site And Program Scoping

The app is designed so staff access is bounded by site, program, cohort, or direct student assignment. Pilot account proof must verify the actual pilot accounts cannot cross those boundaries.

## Viewer Read-Only Behavior

Viewer is a monitoring role. Viewer must not mutate student work, approve submissions, import accounts, change assignments, schedule presentations, export records, or reset passwords.

## Global Admin Caveat

Global Admin remains a local account so platform access is still available if SSO is unavailable. SSO cannot create or use Global Admin, and the last active local Global Admin must remain protected.

## Demo/Fake Data Separation

Fake-account local and hosted demos use fake `.test` accounts and fake data. Fake-account demo readiness is not real-student pilot readiness. No real student data should appear in fake/demo screenshots, proof manifests, or sales docs unless a school/district policy owner explicitly approves that use.

## Export And Import Handling

Imports:

- Student and staff CSV imports must be previewed before final import.
- Unsupported CSV columns are blocked so data is not silently ignored.
- Real roster import requires approved source-of-truth, dry-run/preview evidence, and credential-delivery approval.

Exports:

- Archive/final-file export is excluded from the first pilot unless explicitly approved.
- Export/download proof must show no raw Drive IDs, storage IDs, tokens, private URLs, setup passwords, or credential material.
- student_archive_manifest_download remains a future pilot item until hosted proof marks it passed and the workflow is approved for pilot scope.

## Retention And Deletion Expectations

Retention/deletion expectations must be approved before real student data is entered. Account deactivation, role removal, assignment cleanup, archive export, record retention, and deletion requests need named owners and written policy.

## Limitations And Open Questions

- School/district privacy, support, retention, and data ownership approval is missing.
- Real roster validation evidence is missing.
- Backup/restore rehearsal evidence is missing.
- SSO or approved managed-local credential delivery evidence is missing.
- Role-scoped pilot account proof is missing.
- Archive/download should be excluded unless its evidence is completed.

## Required Approvers Before Real-Student Pilot

- Pilot owner.
- School/admin decision owner.
- Privacy/data policy owner.
- Support owner.
- Technical owner.
- Roster owner.
- School IT or credential-delivery owner.

Until those owners approve the required evidence packet, the real-student pilot remains NO-GO.
