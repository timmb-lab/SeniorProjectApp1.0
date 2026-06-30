# Real-Student Pilot Readiness Gap Analysis

Date: 2026-06-30

Pilot decision today: **NO-GO for real-student production pilot readiness.**

Allowed claim today: **Hosted fake-account click-around demo readiness is green** for approved fake `.test` accounts and fake data only.

This document is the gap-closure framework for moving from hosted fake-account demo readiness toward a small controlled real-student pilot. It does not approve real student data, real roster seeding, live destructive migrations, or a production pilot. It names what is proven, what is fake/demo-only, what is missing, and what must be verified before any real-student pilot.

## Current Proof Boundary

- Current hosted fake-account proof status: `HOSTED_FAKE_ACCOUNT_PILOT_GREEN`.
- Current browser proof verdict: `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`.
- Current manifest: `docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json`.
- Manifest real-student status: `NOT_CLAIMED_READY`.
- Health signals expected before any hosted walkthrough: `databaseReady=true` and `studentRosterProfilesReady=true`.
- Migration `0016_student_roster_profiles.sql` is an already-applied health verification item, not a live-demo migration step.
- `student_archive_manifest_download` remains `skipped_not_ready` / Future pilot item unless the hosted dashboard proof marks it `passed`.
- Legacy synthetic hosted sales-demo seed status `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING` is not a blocker for canonical hosted fake-account demo readiness.

## Pilot Readiness Matrix

| Capability | Current status | Evidence | Demo-only/fake-only dependency? | Real-student pilot risk | Required before pilot? | Recommended next action | Validation command/proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hosted app availability | Fake-account hosted proof is green; live app still needs a same-day health check before any pilot use. | `docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json`; `npm run prove:hosted-fake-pilot-browser`; `/api/health`. | Yes, current proof uses fake `.test` accounts. | Hosted outage or stale deployment could be mistaken for pilot readiness. | Yes | Run health and hosted workspace gates immediately before any pilot decision. | `npm run check:workspace:hosted-permissions`; `npm run prove:hosted-fake-pilot-browser` |
| Database health | Health route reports basic D1 readiness and roster-profile table readiness. | `functions/api/health.ts` returns `databaseReady` and `studentRosterProfilesReady`. | No, but current proof data is fake. | A schema drift or missing table would break student create/import. | Yes | Treat health as a preflight gate; do not repair with live migration during demo. | `/api/health`; `npm run check:pilot-readiness` |
| Migration health, including 0016 | `0016_student_roster_profiles.sql` exists and is treated as health verification, not a live-demo action. | `migrations/0016_student_roster_profiles.sql`; `studentRosterProfilesReady=true`; `student_roster_profiles_migration_required` import error. | No | Running migrations ad hoc against live data could be unsafe. | Yes | Keep 0016 in health/preflight; use a separate approved migration plan for repairs. | `npm test`; `npm run check:pilot-readiness` |
| Google SSO | SSO code and tests exist, but hosted real-school SSO approval/config is not this fake-account proof. | `functions/_lib/google-oauth.ts`; `tests/google-sso.integration.test.mjs`; `migrations/0010_tenant_google_sso.sql`. | Current hosted demo does not depend on real SSO. | Real staff/student identity, domain approval, auto-provisioning, and support are unresolved. | Yes for normal real pilot | Confirm tenant domain, OAuth client, support process, and fallback before pilot. | `npm test`; approved SSO live-domain proof |
| Local Global Admin account model | Proven as local-account-only with last-active local Global Admin protection. | `tests/permissions-access.test.mjs`; `functions/api/admin/users/import.ts`; workspace copy. | No | Real pilot needs support ownership, break-glass procedure, and audit review. | Yes | Document owner/admin rota and emergency account recovery before pilot. | `npm test`; admin account runbook review |
| Test/fake accounts | Canonical hosted proof uses approved fake `.test` accounts only. | `scripts/check-hosted-workspace-permissions.mjs`; `scripts/prove-hosted-fake-pilot-browser.mjs`. | Yes | Fake account proof can be overclaimed as production readiness. | Yes, as a boundary to preserve | Keep fake `.test` accounts separate from real roster onboarding and never mix proof claims. | `npm run check:workspace:hosted-permissions`; `npm run check:pilot-readiness` |
| Real staff account onboarding | Staff import/create routes exist with role/scope guardrails; real onboarding policy is not fully approved. | `functions/api/admin/users/import.ts`; `tests/admin-users-import.integration.test.mjs`. | Demo mostly uses fake accounts. | Temporary credential delivery, SSO choice, staff verification, and support are unresolved. | Yes | Decide SSO-first vs managed local onboarding and document owner support. | `npm test`; pilot onboarding checklist signoff |
| Real student account onboarding | Student create/import exists but real student use is not approved; roster profiles require 0016 health, and unapproved real local credential delivery is blocked by `credential_delivery_policy_required`. | `student_roster_profiles` migration; import tests; workspace Add Student UI. | Demo uses fake students. | Real roster, privacy, guardian/school policy, and account delivery are unresolved. | Yes | Run dry-run roster validation on sanitized data only; approve privacy and support process. | `npm test`; `npm run check:pilot-readiness`; dry-run roster review |
| Add Student | UI and API support scoped student creation with roster profile and optional mentor/viewer assignments. | `workspace.js` Add Student; `functions/api/admin/users/import.ts`; `tests/admin-users-import.integration.test.mjs`. | Demo should use fake `.test` only unless separately approved. | Wrong scope, unsafe support assignment, real local credentials, or missing 0016. | Yes | Keep Add Student pilot-gated by health, scope, assignment-target checks, and credential policy. | `npm test`; Add Student dry-run / fake `.test` proof |
| Student CSV Import | Preview and import validation exist; guardrails block duplicate rows and unsafe support assignments. | `workspace.js` CSV preview; `functions/api/admin/users/import.ts`; import tests. | Demo uses fake CSV rows. | Real CSV errors could mutate accounts if preview/signoff is skipped. | Yes | Require preview-first process, scoped staff targets, and real roster owner signoff. | `npm test`; `npm run check:pilot-readiness` |
| Staff CSV Import, if present | Staff CSV UI exists for scoped staff rows; Global Admin CSV creation is blocked. | `workspace.js` staff CSV template; `validateCsvStaffRow`; `functions/api/admin/users/import.ts`. | Demo uses fake staff rows. | Elevated role mistakes or staff scope drift. | Yes | Limit first pilot to approved roles/sites; keep Global Admin local/manual only. | `npm test`; staff import dry-run review |
| Student roster profiles | Roster profile table and health check exist; create/import blocks students when missing. | `migrations/0016_student_roster_profiles.sql`; `functions/_lib/student-roster-profiles.ts`; tests. | No | Missing migration blocks student onboarding and stale profiles can misroute cohorts. | Yes | Verify `studentRosterProfilesReady=true` and validate cohort/graduation-year source. | `/api/health`; `npm test` |
| Mentor assignment | Scoped mentor assignment exists, including student create side assignments. | `functions/api/admin/users/import.ts`; `tests/admin-users-import.integration.test.mjs`; site mentor assignment tests. | Demo uses fake mentors/students. | Mentor could see wrong students if target scope checks regress. | Yes | Keep active scoped target validation; run hosted permission and local integration gates. | `npm test`; `npm run check:workspace:hosted-permissions` |
| Viewer assignment | Scoped viewer assignment exists and Viewer is read-only. Program Teacher cannot create viewer assignment under current rule. | `viewer_student_forbidden`; `tests/admin-users-import.integration.test.mjs`; hosted Viewer proof. | Demo uses fake viewer. | Viewer mutation or overbroad visibility would be a hard no-go. | Yes | Preserve read-only UI/API and assignment-scope checks. | `npm test`; `npm run check:workspace:hosted-permissions` |
| Program Teacher scope | Program-scoped dashboards, review, student directory, and View as Student entry points are tested. | `tests/workspace-app.test.mjs`; `tests/site-aware-permissions.test.mjs`; hosted browser screenshot. | Hosted proof uses fake Program Teacher. | Program scope leak across schools/programs. | Yes | Keep program/cohort scoping in permission matrix and hosted proof. | `npm run verify:permission-matrix`; hosted proof |
| Administration/Admin scope | School Administration has scoped People & Access and monitoring; Admin/Global Admin has broader fake-account command-center proof. | Workspace role matrix tests; `functions/_lib/permissions.ts`. | Hosted proof currently uses fake admin accounts. | Confusing school admin, site admin, and global admin boundaries. | Yes | Require role-by-role pilot walkthrough with exact assigned sites. | `npm test`; `npm run check:workspace:hosted-permissions` |
| Site Admin scope | Site Admin dashboard, programs, People & Access, mentor/viewer coverage, and privilege boundary are tested. | `check-hosted-workspace-permissions.mjs`; site integration tests. | Hosted proof uses fake Site Admin. | Site Admin could affect wrong school if scope checks regress. | Yes | Keep site switch and site assignment verification in preflight. | `npm run check:workspace:hosted-permissions`; `npm test` |
| Global Admin scope | Local-only Global Admin model and command center exist. | `global_admin_requires_local_account`; role matrix tests. | Hosted proof uses fake Global Admin. | Broad platform access without support procedure. | Yes | Require break-glass, audit review, and named owner before real pilot. | `npm test`; admin runbook approval |
| View as Student | Staff-only authorized preview is read-only; students cannot enter. | `tests/workspace-app.test.mjs`; workspace banner copy; hosted role proof. | Demo uses fake students. | Preview could be mistaken for mutation or used outside scope. | Yes | Keep read-only preview language and authorization tests; train staff to exit preview. | `npm test`; `npm run check:workspace:hosted-permissions` |
| Viewer read-only | Viewer read-only directory and mutation denials are hosted-proofed. | `viewer_read_only_directory`; `viewer_mutation_denials`; workspace tests. | Hosted proof uses fake Viewer. | Viewer mutation or review/account controls would be a hard no-go. | Yes | Keep Viewer read-only gate as a pilot no-go check. | `npm run check:workspace:hosted-permissions`; `npm test` |
| Student dashboard | Student own-work dashboard is hosted browser proven for fake account. | Screenshot `02-student-dashboard`; `tests/student-dashboard-access.integration.test.mjs`. | Yes | Real students need support, content ownership, and data policy. | Yes | Verify real roster identity mapping and student support path before pilot. | `npm test`; hosted student smoke with approved pilot account |
| Student detail | Scoped student detail and timeline exist for staff roles. | `tests/site-student-detail.integration.test.mjs`; workspace detail tests. | Current hosted proof is fake-account. | Private notes/proof visibility must stay scoped. | Yes | Run role-specific detail proof with approved pilot data model before real data. | `npm test`; hosted permission proof |
| Program management | Site Admin and Global Admin program add/remove/restore workflows exist; not for School Admin/Viewer/Program Teacher/Mentor/Student. | `functions/api/site/programs.ts`; workspace tests; local proof. | Demo uses fake programs. | Program changes can alter student/program scope. | Pilot-dependent | Use only with designated setup admin; require rollback notes. | `npm test`; `npm run prove:demo:local` |
| Audit/logging, if present | Auth, import, denied access, archive readiness, evidence, and review paths write audits. | Integration tests across auth/import/evidence/archive/review routes. | No, but demo audits are fake-account. | Pilot audit review process and retention ownership still missing. | Yes | Define who reviews audit logs and how long logs are retained. | `npm test`; policy signoff |
| Error handling | User-safe errors and fallback states are guarded. | `npm run check:workspace-errors`; workspace tests. | No | Real pilot support will need owner escalation and plain incident handling. | Yes | Add pilot support runbook before live students. | `npm run check:workspace-errors`; support runbook review |
| Data export/archive/download | Archive readiness and export artifacts exist; scoped student archive manifest download is not ready. | `functions/api/student/archive/readiness.ts`; `tests/archive-readiness.integration.test.mjs`; hosted dashboard proof. | Current hosted archive proof is partial/fake. | Retention, storage ownership, and download support are unresolved. | Yes if archive is in pilot scope | Keep archive download out of pilot claims until acceptance criteria pass. | `npm run check:workspace:hosted-dashboard`; `student_archive_manifest_download` must pass |
| Backups/rollback | Migration and seed/reset commands are gated, but pilot backup/restore rehearsal is not documented as complete here. | Migration scripts; remote seed/reset confirmation gates. | No | No approved restore drill for real student data. | Yes | Define backup cadence, restore drill, rollback owner, and pilot data exit plan. | Backup/restore rehearsal evidence |
| Privacy/data separation | Role-scoped permission and mutation-origin tests are strong; real privacy policy signoff remains separate. | `npm run verify:permission-matrix`; `npm run verify:mutation-origin`; hosted proof. | Hosted proof uses fake data. | Legal/privacy approval, consent, and support boundaries unresolved. | Yes | Obtain district/school privacy approval before real student data. | Policy approval plus automated gates |
| Tenant/school separation | Multisite and site-aware permissions are tested. | `tests/multisite-site-role-foundation.test.mjs`; `tests/site-aware-permissions.test.mjs`; migration 0011 proof. | Demo uses fake schools. | Misconfigured site membership could expose records. | Yes | Verify assigned sites/programs from real roster source before pilot. | `npm test`; `npm run prove:remote:migration-0011` |
| Hosted proof screenshots | Screenshot set exists for fake-account browser walkthrough. | `docs/sales/hosted-browser-proof-screenshot-index.md`; screenshot files. | Yes | Screenshots could be overclaimed as real pilot proof. | No for pilot, useful for demo | Keep labels explicit: fake-account click-around only. | `npm run prove:hosted-fake-pilot-browser` |
| No-go checks | Operator script has no-go list; this doc adds pilot no-go matrix. | `docs/sales/demo-day-operator-script.md`; this document. | No | Hidden no-go items can become accidental production claims. | Yes | Keep `check:pilot-readiness` in release validation. | `npm run check:pilot-readiness` |
| Known skipped items, including `student_archive_manifest_download` | Explicitly skipped/not ready and Future pilot item. | `scripts/check-hosted-workspace-permissions.mjs`; hosted dashboard proof docs. | Yes | Archive download readiness could be assumed from dashboard proof. | Yes if archive download is in scope | Do not claim archive manifest download until hosted proof marks it `passed`. | `npm run check:workspace:hosted-dashboard`; `npm run check:pilot-readiness` |
| Legacy synthetic hosted sales-demo seed | Deprecated compatibility check; missing seed is non-blocking for canonical fake-account demo. | `docs/sales/hosted-proof-plan.md`; `prove:sales-demo:hosted` docs/tests. | Yes | Old missing-seed blocker could confuse current pilot/demo status. | No for fake-account demo; not a pilot proof | Keep legacy seed out of pilot readiness claims unless intentionally revived. | `npm run check:pilot-readiness` |
| Real production pilot acceptance criteria | Not met today. | This matrix; existing demo docs; current fake-account proof caveats. | N/A | Real students could be used before legal/security/support readiness. | Yes | Satisfy acceptance criteria below before changing the decision. | Pilot signoff packet plus full validation stack |

## Required Real-Student Pilot Acceptance Criteria

These are the minimum criteria before changing the decision from NO-GO to a controlled small-pilot candidate:

1. A named pilot owner, support owner, and emergency technical owner are assigned.
2. School/district privacy, data ownership, retention, and support expectations are approved in writing.
3. Google SSO or approved managed local account creation is configured for the pilot tenant and tested with real staff identities.
4. Real student onboarding uses approved roster source data, preview-first validation, and no unapproved temporary credential path.
5. `/api/health` reports `databaseReady=true` and `studentRosterProfilesReady=true` immediately before pilot start.
6. Migration 0016 is verified as already applied; no live-demo migration is run to unblock the pilot.
7. Add Student and Student CSV Import guardrails are tested against sanitized pilot-shaped rows before any real import.
8. Mentor and Viewer assignment targets are proven in scope; student-as-mentor/student-as-viewer and elevated targets remain blocked before mutation.
9. Program Teacher, Mentor, Viewer, Site Admin, Administration/Admin, and Global Admin role boundaries are verified with pilot-shaped accounts.
10. View as Student remains authorized-student-only and read-only; it does not grant student mutation power.
11. Viewer remains read-only in UI and API.
12. Archive/export/download scope is either explicitly excluded from pilot or `student_archive_manifest_download` is proven ready with no storage identifier leaks.
13. Backup/restore and rollback procedures are rehearsed against non-real data and approved for pilot data.
14. Incident/support messaging exists for login failures, wrong roster/scope, evidence upload issues, and data correction requests.
15. The validation stack passes: `npm test`, `npm run typecheck`, `npm run check`, `npm run prove:demo:local`, hosted workspace gates, hosted browser proof, and `npm run check:pilot-readiness`.

## Pilot No-Go Checks

Stop before real student use if any item below is true:

- `/api/health` is unreachable.
- `/api/health` reports `databaseReady=false`.
- `/api/health` reports `studentRosterProfilesReady=false`.
- Real pilot requires a non-approved credential path or visible setup passwords.
- A fake-account proof is being used as the only evidence for real-student readiness.
- A student can see Admin Console, staff-only View as Student, or another student's record.
- Viewer has mutation controls or review/account setup controls.
- Program Teacher, Mentor, Site Admin, Administration/Admin, or Global Admin can see broader records than their assigned pilot scope.
- Add Student or CSV Import would create real accounts without approved SSO/local credential delivery policy.
- Mentor/viewer targets are unknown, out of scope, students, elevated admins, or otherwise unsafe.
- `student_archive_manifest_download` is claimed complete while hosted dashboard proof still reports `skipped_not_ready`.
- Backup/restore, data-retention, support, or privacy approval is missing.

## Low-Risk Improvements Added With This Pass

- Added `npm run check:pilot-readiness` as a non-mutating pilot preflight. It verifies current proof artifacts, this matrix, no-overclaim language, migration-0016 health treatment, import/create guardrails, View as Student safety, and archive-manifest honesty.
- Added regression tests so the pilot-readiness doc must list caveats/no-go items and cannot silently convert fake-account proof into real-student production pilot proof.
- Kept `student_archive_manifest_download` honest as a future item. No archive implementation was expanded in this pass.

## Recommended Next Work

1. Draft the real pilot support and privacy packet before any real roster import.
2. Run `npm run check:pilot-readiness` before every pilot-readiness discussion.
3. Decide whether archive/download is excluded from the first controlled pilot or prioritized until `student_archive_manifest_download` passes hosted proof.
4. Run a sanitized roster preview rehearsal with the exact Add Student / Student CSV Import guardrails before a live pilot.
5. Re-run hosted permission proof after any account, role, import, or View as Student change.
