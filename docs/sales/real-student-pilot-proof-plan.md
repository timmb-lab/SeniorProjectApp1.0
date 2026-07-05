# Real-Student Pilot Proof Plan

Date: 2026-06-30

Decision boundary: **NO-GO for real-student production pilot readiness.** This plan defines the proof packet required before that claim can change. It does not approve real student data, real roster import, SSO launch, backup/restore completion, or archive handoff.

Hosted fake-account proof remains useful and green for fake `.test` click-around demos only. The missing items below are manual/operator evidence requirements for a controlled real-student pilot.

Supporting operator docs narrow the proof work without changing the NO-GO decision:

- `docs/demo/role-scoped-pilot-account-proof.md`
- `docs/demo/synthetic-roster-validation-dry-run.md`
- `docs/demo/backup-restore-rehearsal-runbook.md`

## Expected Evidence Manifests

These paths are intentionally absent until each proof is actually performed and reviewed. `npm run check:pilot-readiness` reports missing required manifests as `MANUAL_PROOF_REQUIRED`, not as completed work.

| Evidence | Expected path | Status until present | Required before real-student pilot? | Notes |
| --- | --- | --- | --- | --- |
| Role-scoped pilot account proof | `docs/progress/runs/real-student-pilot-role-scope-proof.json` | `MANUAL_PROOF_REQUIRED` | Yes | Use approved pilot-shaped accounts and redacted output only. |
| Backup/restore rehearsal evidence | `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json` | `MANUAL_PROOF_REQUIRED` | Yes | Run against non-real data; do not run destructive restore on production data. |
| Real-roster validation evidence | `docs/progress/runs/real-student-pilot-roster-validation-evidence.json` | `MANUAL_PROOF_REQUIRED` | Yes | Use roster owner signoff and sanitized dry-run/preview rows before live import. |
| Privacy/support/retention approval | `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json` | `MANUAL_PROOF_REQUIRED` | Yes | School/district policy approval must be written and retained. |
| SSO or managed-local credential delivery approval | `docs/progress/runs/real-student-pilot-credential-delivery-approval.json` | `MANUAL_PROOF_REQUIRED` | Yes | SSO cannot create or use Global Admin; Global Admin local account remains separate. |
| Archive/download proof, if in pilot scope | `docs/progress/runs/real-student-pilot-archive-download-evidence.json` | `FUTURE_PILOT_ITEM` | Only if archive/download is in first pilot scope | `student_archive_manifest_download` must pass hosted proof before the workflow is claimed. |

## Role-Scoped Pilot Account Proof Plan

Run this only after the school approves pilot-shaped accounts and the credential path. Use fake/synthetic rows until approval exists; never use real records as the first proof attempt.

| Role | Positive acceptance criteria | Negative/denial expectation | Proof command or manual proof needed |
| --- | --- | --- | --- |
| Student | Student sees only their own dashboard, proof, feedback, deadlines, presentation, final files, and account controls. | Student cannot access admin/staff surfaces, Admin Console, View as Student, other students, staff routes, or import/account actions. | Hosted login smoke with approved student account plus API denial checks. |
| Mentor | Mentor sees assigned students only, including allowed detail and support context. | Mentor cannot access unassigned students, site-wide directories, Admin Console, People & Access, import, or review actions outside assignment. | Hosted/API proof for assigned and intentionally unassigned student IDs. |
| Program Teacher | Program Teacher sees only assigned program/cohort/site work and can review only in-scope submitted work. | Program Teacher cannot cross program/site scope, cannot manage global users, and cannot create site/global admins. | Permission matrix plus hosted program-scoped account walkthrough. |
| Viewer | Viewer can inspect assigned student context in read-only mode. | Viewer cannot mutate, approve, import, assign, schedule, export, reset passwords, or open account-management controls. | `npm run check:workspace:hosted-permissions` plus manual UI review for mutation controls. |
| Administration | Administration can inspect allowed school/program scope without security/reset/elevated admin powers. | Administration cannot become Global Admin, bypass site/program scope, or create elevated accounts. | Scoped account proof plus audit review of denied actions. |
| Site Admin | Site Admin can manage site programs/users/assignments within the assigned site. | Site Admin cannot create Global Admin, cannot cross school/site scope, and cannot exceed site permissions. | Hosted/API proof for site dashboard, programs, People & Access, and cross-site denial. |
| Global Admin local account | Global Admin uses local-account-only break-glass/admin ownership and remains separated from SSO. | SSO cannot create or use Global Admin; no SSO-only account can become the last active local Global Admin. | Local-admin account proof, last-admin protection tests, and named break-glass owner signoff. |
| View as Student | Authorized staff can preview an authorized student in read-only mode and exit cleanly. | View as Student cannot mutate, cannot be activated by students, and cannot open unauthorized students. | Workspace tests plus hosted/manual proof from each staff role in scope. |

Minimum denial checks before pilot:

- Viewer cannot mutate.
- Mentor cannot access unassigned students.
- Program Teacher cannot cross program/site scope.
- Student cannot access admin/staff surfaces.
- SSO cannot create or use Global Admin.
- View as Student cannot mutate.

## Backup/Restore Rehearsal Checklist

Backup/restore rehearsal is not complete. Do not infer it from migrations, hosted fake-account screenshots, or local demo seed proof.

Before real-student pilot approval, capture a redacted evidence manifest showing:

1. Named technical owner and backup/restore approver.
2. D1 export command or Cloudflare-supported export path used for the rehearsal.
3. Exact non-real dataset used for the rehearsal.
4. Restore rehearsal target, isolated from production student data.
5. Schema version and migrations present before and after restore.
6. Proof that restored tables can answer `/api/health`, role/auth checks, student dashboard, staff directory, and archive readiness smoke checks.
7. Rollback plan if restore fails or returns stale data.
8. Confirmation that no destructive database operations ran against production real-student data.
9. Storage/evidence handoff notes for Google Drive-backed evidence and archive artifacts.
10. Incident/support contact and expected recovery time objective for the pilot.

Related source/runbook surfaces:

- `docs/backend-setup.md`
- `docs/architecture/adr-0001-stack-auth-database-upload.md`
- `migrations/`
- `npm run check:pilot-readiness`

## Real-Roster Validation Checklist

Real roster validation is not complete. Use fake/synthetic rows only until the roster owner and privacy/support owner approve the pilot import process.

Required roster validation items:

This checklist covers approved source of truth, required fields, cohort, graduation year, program/site mapping, mentor/viewer assignment, duplicate handling, deactivation/archive handling, and fake/synthetic rows only.

| Item | Acceptance criteria | Proof needed |
| --- | --- | --- |
| Approved source of truth | The school/district names the authoritative roster source and owner. | Written roster-owner signoff. |
| Required fields | `first_name`, `last_name`, `email`, `site`, `program`, `status`, `cohort`, and `graduation_year` are present or intentionally mapped. | Sanitized column map. |
| Email/account identity | Student/staff email domains and identity type match the approved SSO or managed-local plan. | Credential-delivery approval manifest. |
| Cohort rules | Cohort values match the pilot grouping used by the school. | Sanitized sample rows and validation notes. |
| Graduation year rules | Graduation year values are numeric, plausible, and approved for the pilot class. | Preview output with invalid-year rejection proof. |
| Program/site mapping | Each row maps to an existing allowed site and program. | Dry-run preview with unknown site/program rejection proof. |
| Mentor/viewer assignment rules | Mentor/viewer assignment targets are existing scoped staff, not students or elevated/global roles. | Preview output for valid and invalid assignment targets. |
| Duplicate handling | Existing users and duplicate CSV rows are detected before mutation. | Preview output showing duplicates are blocked or reconciled. |
| Deactivation/archive handling | Graduated, withdrawn, inactive, and archived students have a named handling rule before import. | Roster-owner policy note. |
| Test import | The first rehearsal uses fake/synthetic rows only. | Redacted fake-row preview/import proof, if import is approved. |

## Archive/Download Acceptance Criteria

`student_archive_manifest_download` remains `skipped_not_ready` / `FUTURE_PILOT_ITEM` unless a scoped hosted dashboard proof marks it `passed`.

If archive/download is included in the first pilot scope, the proof must show:

1. What the archive manifest includes: student identity, project requirements, progress state, submissions, evidence summaries, feedback/review history, presentation/final-file state, retention metadata, and redacted storage references.
2. Who can download it: the student for their own package and authorized staff/admin roles within approved scope.
3. What role scope applies: student-own, assigned mentor/viewer read rules, program/site/admin scope, and Global Admin local-account-only controls.
4. Privacy boundary: no raw Drive IDs, storage IDs, tokens, private URLs, setup passwords, or credential material in responses, screenshots, or manifests.
5. Audit/logging: export generated, export denied, export downloaded, missing/expired artifact, and provider unavailable paths are audit-visible without leaking secrets. The audit/logging review must name who reads the events during the pilot.
6. Proof command/manual proof needed: `npm run check:workspace:hosted-dashboard`, `npm test`, and a redacted hosted/manual proof manifest where `student_archive_manifest_download` is `passed`.
7. Pilot policy dependency: retention, storage ownership, support, and data exit/handoff must be approved before real student archives are generated.

This item is not required for hosted fake-account demo day unless someone claims archive manifest download is complete.

## Final Pilot Packet Contents

Before changing the NO-GO decision, the packet must include:

- Passing validation stack: `npm run check:pilot-readiness`, `npm test`, `npm run typecheck`, `npm run check`, `npm run prove:demo:local`, hosted workspace gates, and hosted fake-account browser proof.
- Current `/api/health` result showing `databaseReady=true` and `studentRosterProfilesReady=true`.
- Role-scoped pilot account proof manifest.
- Roster validation evidence manifest.
- Backup/restore rehearsal evidence manifest.
- Privacy/support/retention approval manifest.
- SSO or approved managed-local credential delivery manifest.
- Archive/download evidence manifest or explicit written exclusion from first pilot scope.
- Named pilot owner, support owner, technical owner, roster owner, and privacy/data owner.
