# Real-Student Pilot Readiness Gap Analysis

Date: 2026-06-30

Pilot decision today: **NO-GO for real-student production pilot readiness.**

Allowed claim today: **Hosted fake-account click-around demo readiness is green** for approved fake `.test` accounts and fake data only.

This document is the gap-closure framework for moving from hosted fake-account demo readiness toward a small controlled real-student pilot. It does not approve real student data, real roster seeding, live destructive migrations, or a production pilot. It names what is proven, what is fake/demo-only, what is missing, and what must be verified before any real-student pilot.

Operator proof details live in `docs/sales/real-student-pilot-proof-plan.md`. The role boundary contract is `docs/security/role-access-matrix.md`. The operator-facing runbook packet is under `docs/demo/`:

- `docs/demo/real-student-pilot-readiness-runbook.md`
- `docs/demo/real-student-pilot-go-no-go-gate.md`
- `docs/demo/staff-pilot-onboarding-checklist.md`
- `docs/demo/student-pilot-onboarding-checklist.md`
- `docs/demo/student-data-handling-summary.md`
- `docs/demo/role-scoped-pilot-account-proof.md`
- `docs/demo/synthetic-roster-validation-dry-run.md`
- `docs/demo/backup-restore-rehearsal-runbook.md`
- `docs/demo/student-pilot-evidence-packet.md`
- `docs/demo/student-archive-export-scope-decision.md`

The non-mutating gate is:

```powershell
npm run check:pilot-readiness
```

## Readiness Tiers

| Tier | Current decision | What is proven | What is not proven |
| --- | --- | --- | --- |
| Local/demo readiness | Go for fake-data local proof when local seed/proof commands pass. | Synthetic local data, local route/API proof, local role/mutation tests. | Real roster, real credential delivery, school policy approval, hosted account proof for real people. |
| Hosted fake-account demo readiness | Green for approved fake `.test` click-around demo. | `HOSTED_FAKE_ACCOUNT_PILOT_GREEN`, `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`, screenshots, fake-account role walkthrough, redaction checks. | Real-student pilot readiness, real roster import, real SSO/domain approval, retention/support/privacy approval. |
| Real-student pilot readiness | **NO-GO / BLOCKED**. | Gap analysis, preflight, source/test guardrails, fake proof limitations. | SSO or approved managed-local credential delivery, privacy/support/retention approval, real roster validation, backup/restore rehearsal, role-scoped pilot-account proof. |
| Full production readiness | Not claimed. | None beyond the narrower demo and pilot-prep evidence above. | Scaled operations, domain/tenant rollout, support SLA, full audit/retention program, backup/restore operations, broader compliance/legal review. |

## Current Proof Boundary

- Current hosted fake-account proof status: `HOSTED_FAKE_ACCOUNT_PILOT_GREEN`.
- Current browser proof verdict: `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`.
- Current manifest: `docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json`.
- Manifest real-student status: `NOT_CLAIMED_READY`.
- Health signals expected before any hosted walkthrough: `databaseReady=true` and `studentRosterProfilesReady=true`.
- Migration `0016_student_roster_profiles.sql` is an already-applied health verification item, not a live-demo migration step.
- `student_archive_manifest_download` remains `skipped_not_ready` / Future pilot item unless the hosted dashboard proof marks it `passed`.
- Legacy synthetic hosted sales-demo seed status `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING` is not a blocker for canonical hosted fake-account demo readiness.
- fake `.test` proof limitations: fake accounts and fake data prove hosted click-around and selected role boundaries only. They do not prove school approval, legal/privacy acceptance, real account delivery, real roster correctness, backup/restore readiness, or full production readiness.

## Pilot Readiness Matrix

| Area | Current state | Evidence | Real-student blocker? | Acceptance criteria | Proof command or manual proof needed | Owner/dependency if known |
| --- | --- | --- | --- | --- | --- | --- |
| Hosted app availability | Hosted fake-account proof is green; live app still needs same-day health before any real pilot discussion. | `docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json`; `/api/health`; hosted proof commands. | Yes, if health or hosted access is stale. | Hosted route loads; `/api/health` is reachable; no stale deployment markers. | `npm run prove:hosted-fake-pilot-browser`; health check. | Technical owner. |
| Local/demo readiness | Local fake-data demo remains separate from real-student readiness. | `npm run seed:demo:local:reset`; `npm run prove:demo:local`; local integration tests. | No for hosted fake demo; yes if used as real-student evidence. | Local proof can support demos only when clearly labeled fake/synthetic. | `npm run prove:demo:local`. | Demo operator. |
| Hosted fake-account demo readiness | Green for fake `.test` click-around. | `HOSTED_FAKE_ACCOUNT_PILOT_GREEN`; screenshot manifest; hosted permission/dashboard/evidence gates. | No for demo; yes if overclaimed. | Keep fake/demo-only labels and no-secret proof. | Hosted workspace gates and screenshot proof. | Demo operator. |
| Real-student pilot decision | **NO-GO / BLOCKED**. | This document; `docs/sales/real-student-pilot-proof-plan.md`; `npm run check:pilot-readiness`. | Yes. | All required manual proof manifests and approval packet exist and pass review. | `npm run check:pilot-readiness` plus manual packet review. | Pilot owner, technical owner, privacy/support owner. |
| Full production readiness | Not claimed. | Current repo has narrower demo and pilot-prep proof only. | Yes. | Separate production launch checklist, support/retention/compliance operations, backup/restore operations, tenant rollout plan. | Manual production readiness review. | Product/business owner. |
| Database health | Basic D1 and roster-profile health are surfaced. | `functions/api/health.ts`; manifest health fields. | Yes. | `databaseReady=true` and `studentRosterProfilesReady=true` immediately before pilot. | `/api/health`; `npm run check:pilot-readiness`. | Technical owner. |
| Migration health, including 0016 | `0016_student_roster_profiles.sql` exists and is health-verified, not a live-demo action. | Migration file; health route; import error `student_roster_profiles_migration_required`. | Yes. | Migration is already applied before pilot; no live-demo migration is used to unblock student create/import. | `/api/health`; `npm test`. | Technical owner. |
| Google SSO or approved managed-local credential delivery | SSO code/tests exist, but live-school identity path is not approved here. | Google SSO helpers/tests; auth config docs. | Yes. | Tenant domain and OAuth client are approved, or managed-local delivery has written approval; setup passwords are not exposed. | Manual credential-delivery approval manifest; live-domain SSO proof if used. | School/district IT and technical owner. |
| Local Global Admin account model | Local-account-only Global Admin protections exist. | Permission/import tests; effective access helpers. | Yes. | Global Admin remains local-account-only, named, audited, and separated from SSO. | `npm test`; local-admin proof; owner signoff. | Technical owner. |
| Test/fake accounts | Canonical hosted proof uses approved fake `.test` accounts only. | Hosted permission/browser proof scripts. | Yes, as a claim boundary. | Fake accounts never mix with real roster/account approval. | `npm run check:workspace:hosted-permissions`; `npm run check:pilot-readiness`. | Demo operator. |
| Real staff account onboarding | Routes/import guardrails exist; real staff onboarding policy is not approved. | `functions/api/admin/users/import.ts`; import tests. | Yes. | Staff roles/sites/programs are approved, scoped, and credentialed through approved path. | Manual onboarding plan and dry-run proof. | School roster/IT owner. |
| Real student account onboarding | Student create/import exists but real student use is not approved. | Student roster profile migration; import tests; Add Student UI; `credential_delivery_policy_required`. | Yes. | Approved source roster, preview-first validation, no unapproved local credential delivery. | Roster validation evidence manifest; `npm test`. | Roster owner and privacy/support owner. |
| Add Student | UI/API support scoped student creation with roster profile and optional mentor/viewer assignments. | `workspace.js`; import route/tests. | Yes for real students. | Health green; site/program valid; assignment targets scoped; credential policy approved. | Fake `.test` proof only until real approval; `npm test`. | Site Admin / technical owner. |
| Student CSV Import | Preview/import validation exists for fake/synthetic rehearsals. | CSV preview UI; import route/tests. | Yes for real students. | Preview-first workflow; duplicate/out-of-scope/invalid year/unsafe assignment rows rejected before mutation. | Sanitized roster dry-run evidence; `npm test`. | Roster owner. |
| Staff CSV Import, if present | Staff CSV UI/source exists with scoped-role guardrails; Global Admin CSV creation is blocked. | Workspace staff CSV template; import route/tests. | Yes. | Pilot staff rows are scoped and approved; elevated roles are manual/local-only where required. | Staff onboarding checklist; `npm test`. | School IT / technical owner. |
| Student roster profiles | Roster profile table and health check exist. | `migrations/0016_student_roster_profiles.sql`; roster helpers; tests. | Yes. | Health reports ready; profile fields map to approved roster source. | `/api/health`; roster validation evidence. | Technical owner and roster owner. |
| Mentor assignment | Scoped mentor assignment exists, including create-side assignment checks. | Import route/tests; hosted permission proof. | Yes. | Mentor targets are active, scoped staff; student-as-mentor and out-of-scope targets fail. | `npm test`; role-scoped pilot proof. | Site Admin / technical owner. |
| Viewer assignment | Scoped Viewer assignment exists and Viewer is read-only. | `viewer_student_forbidden`; tests; hosted Viewer proof. | Yes. | Viewer can inspect assigned context only and cannot mutate. | `npm run check:workspace:hosted-permissions`; `npm test`. | Technical owner. |
| Program Teacher scope | Program-scoped views and review paths are tested. | Workspace tests; site-aware permission tests; hosted screenshot. | Yes. | Program Teacher cannot cross program/site scope. | `npm run verify:permission-matrix`; role proof. | Technical owner. |
| Administration/Admin scope | School Administration/Admin boundaries exist but require real-pilot role proof. | Workspace role matrix; effective access helpers. | Yes. | Administration sees allowed school/program scope without reset/elevated security powers. | Role-scoped pilot-account proof. | Pilot owner / technical owner. |
| Site Admin scope | Site Admin dashboard, programs, People & Access, and assignment flows exist. | Hosted permission proof; site integration tests. | Yes. | Site Admin can manage only assigned-site programs/users/assignments. | `npm run check:workspace:hosted-permissions`; role proof. | Site owner. |
| Global Admin scope | Local-only Global Admin command center and protections exist. | Local-admin/import tests; Global Admin role copy. | Yes. | SSO cannot create or use Global Admin; named local break-glass owner exists. | Local-admin proof; credential-delivery approval. | Technical owner. |
| View as Student | Staff-only authorized preview is read-only. | Workspace tests; hosted role proof; operator script. | Yes. | Students cannot enter; staff can preview only authorized students; preview cannot mutate. | `npm test`; hosted/manual role proof. | Technical owner. |
| Viewer read-only | Viewer read-only directory and API denials are proofed. | Hosted permission proof; workspace tests. | Yes. | Viewer has no mutation/account/review/import/export controls. | `npm run check:workspace:hosted-permissions`; `npm test`. | Technical owner. |
| Student dashboard | Fake-account student dashboard is hosted browser proven. | Student screenshot; student dashboard access tests. | Yes for real students. | Student sees only own rows; support and policy path exists. | `npm test`; approved pilot account smoke. | Pilot owner / technical owner. |
| Student detail | Scoped student detail/timeline exists for authorized staff. | Student detail integration tests; workspace tests. | Yes. | Detail/timeline/private notes remain role-scoped and no raw storage IDs leak. | `npm test`; role-scoped proof. | Technical owner. |
| Program management | Site Admin and Global Admin program workflows exist. | Site programs route/tests; local proof. | Pilot-dependent. | Only designated setup admins use program changes; rollback notes exist. | `npm test`; setup checklist. | Site owner / technical owner. |
| Audit/logging | Auth, import, denied access, archive, evidence, and review paths write audits. | Integration tests across auth/import/evidence/archive/review routes. | Yes. | Pilot names audit reviewer, retention window, and incident escalation. | `npm test`; privacy/support approval manifest. | Privacy/support owner. |
| Error handling | User-safe workspace error states are guarded. | `npm run check:workspace-errors`; workspace tests. | Yes. | Login, roster, evidence, and scope errors have support/escalation path. | `npm run check:workspace-errors`; support runbook review. | Support owner. |
| Data export/archive/download | Archive readiness/export source exists; hosted `student_archive_manifest_download` is future/not ready. | Archive route/tests; hosted dashboard proof. | Yes if archive is pilot scope. | Archive is excluded from pilot or manifest download passes with privacy/audit/retention criteria. | `npm run check:workspace:hosted-dashboard`; archive evidence manifest if in scope. | Privacy/retention owner and technical owner. |
| Backup/restore rehearsal | Not documented as complete. | Proof-plan expected manifest path; backend/ADR notes. | Yes. | D1 export/restore rehearsal succeeds against non-real data with rollback owner and smoke proof. | `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json`. | Technical owner. |
| Real roster validation | Not complete. | Proof-plan checklist and expected manifest path. | Yes. | Approved source of truth, required fields, cohort/graduation year rules, program/site mapping, mentor/viewer rules, duplicate and deactivation handling are proven with fake/sanitized rows first. | `docs/progress/runs/real-student-pilot-roster-validation-evidence.json`. | Roster owner. |
| Privacy/data separation | Automated role/mutation tests are strong; policy approval remains missing. | Permission matrix; mutation-origin verifier; hosted proof. | Yes. | Written privacy, support, retention, and data ownership approval exists. | `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json`. | Privacy/support owner. |
| Tenant/school separation | Multisite/site-aware permission tests exist. | Multisite and site-aware tests; migration 0011 proof. | Yes. | Assigned sites/programs match pilot roster and account scopes. | `npm test`; pilot scope signoff. | School roster owner. |
| Hosted proof screenshots | Screenshot set exists for fake-account browser walkthrough. | Hosted screenshot index and images. | No for demo; yes if overclaimed. | Screenshots remain dated, fake-account-labeled, and secret-free. | `npm run prove:hosted-fake-pilot-browser`. | Demo operator. |
| Known skipped items, including `student_archive_manifest_download` | Explicitly skipped/not ready and Future pilot item. | Hosted permission proof; hosted proof plan. | Yes if archive is pilot scope. | Not claimed until hosted proof marks it `passed` and archive policy is approved. | Hosted dashboard proof plus archive evidence if in scope. | Technical owner and privacy/retention owner. |
| Legacy synthetic hosted sales-demo seed | Deprecated compatibility check; missing seed is non-blocking for canonical fake-account demo. | Hosted proof plan; `prove:sales-demo:hosted` docs/tests. | No for fake-account demo; not pilot evidence. | Old seed absence is not treated as current hosted fake-account blocker. | `npm run check:pilot-readiness`; technical review only if asked. | Demo operator. |

## Required Real-Student Pilot Acceptance Criteria

These are the minimum criteria before changing the decision from NO-GO to a controlled small-pilot candidate:

1. A named pilot owner, support owner, emergency technical owner, roster owner, and privacy/data owner are assigned.
2. School/district privacy, support, retention, and data ownership expectations are approved in writing.
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
15. The validation stack passes: `npm run check:pilot-readiness`, `npm test`, `npm run typecheck`, `npm run check`, `npm run prove:demo:local`, hosted workspace gates, and hosted browser proof.

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
- Backup/restore, real roster validation, data-retention, support, or privacy approval is missing.

## Preflight Behavior

`npm run check:pilot-readiness` is non-mutating. It does not require real student data, does not call hosted endpoints, does not run migrations, and does not read credentials. It classifies evidence as:

- `PASS`: static/source proof exists.
- `BLOCKED`: final real-student pilot decision remains blocked.
- `NON_BLOCKING_DEMO_ONLY`: useful for fake hosted demo only.
- `FUTURE_PILOT_ITEM`: later/pilot-scope-dependent work, such as archive manifest download.
- `MANUAL_PROOF_REQUIRED`: required human/operator proof that is not present yet.

The expected honest result today is: fake hosted demo green, real-student pilot NO-GO with clearer evidence, checks, and acceptance criteria.

## Recommended Next Work

1. Complete the privacy/support/retention and credential-delivery approval manifests.
2. Run the backup/restore rehearsal against non-real data and store redacted evidence.
3. Run the real-roster validation process with fake/sanitized rows before any real import.
4. Run role-scoped pilot-account proof after approved pilot-shaped accounts exist.
5. Decide whether archive/download is excluded from the first controlled pilot or prioritized until `student_archive_manifest_download` passes hosted proof.
