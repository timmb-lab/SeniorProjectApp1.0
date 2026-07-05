# Real-Student Pilot Go/No-Go Gate

Current status: **NO-GO for real-student pilot readiness.**

Fake-account demo readiness is not real-student pilot readiness. Real-student pilot remains NO-GO unless manual/policy evidence is completed. No automated screenshot run can replace required approvals.

## Current Status

- Hosted fake-account demo readiness is green for approved fake `.test` accounts and fake data.
- Local fake-account browser UI proof is green for fake/demo accounts.
- The real-student pilot decision is blocked by missing manual/policy evidence.
- Full production readiness is not claimed.
- The durable RBAC contract is `docs/security/role-access-matrix.md`; any mismatch between the gate, runbook, and role matrix keeps the pilot at NO-GO.
- Supporting closure docs now exist for role-scope proof, synthetic roster validation, and backup/restore rehearsal, but they do not replace the required evidence manifests.
- Policy packet and archive scope decision: `docs/demo/student-pilot-evidence-packet.md` and `docs/demo/student-archive-export-scope-decision.md`.

## What Is Green

- Hosted fake-account browser proof: `GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`.
- Local fake-account UI proof and screenshots.
- Role, mutation-origin, Viewer read-only, View as Student, and import guardrail tests.
- `0016_student_roster_profiles.sql` exists and is treated as an already-applied health signal, not as a live-demo migration step.

## What Is Not Yet Proven

- Real school approval.
- Privacy/support/retention approval.
- Approved SSO or managed-local credential delivery.
- Real roster validation.
- Backup/restore rehearsal against non-real data.
- Role-scoped pilot-account proof with approved pilot-shaped accounts.
- Archive/download readiness if archive is in pilot scope.

## Required Manual Evidence

| Evidence | Required path | Status until present |
| --- | --- | --- |
| Role-scoped pilot account proof | `docs/progress/runs/real-student-pilot-role-scope-proof.json` | MANUAL_PROOF_REQUIRED |
| Backup/restore rehearsal evidence | `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json` | MANUAL_PROOF_REQUIRED |
| Real-roster validation evidence | `docs/progress/runs/real-student-pilot-roster-validation-evidence.json` | MANUAL_PROOF_REQUIRED |
| Privacy/support/retention approval | `docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json` | MANUAL_PROOF_REQUIRED |
| SSO or managed-local credential delivery approval | `docs/progress/runs/real-student-pilot-credential-delivery-approval.json` | MANUAL_PROOF_REQUIRED |
| Archive/download proof, if in scope | `docs/progress/runs/real-student-pilot-archive-download-evidence.json` | FUTURE_PILOT_ITEM |

Supporting docs:

- `docs/demo/role-scoped-pilot-account-proof.md`
- `docs/demo/synthetic-roster-validation-dry-run.md`
- `docs/demo/backup-restore-rehearsal-runbook.md`
- `docs/demo/student-pilot-evidence-packet.md`
- `docs/demo/student-archive-export-scope-decision.md`

## Automated Proof Summary

Automated proof can support the decision packet, but it cannot approve the pilot by itself.

| Automated proof | What it proves | What it does not prove |
| --- | --- | --- |
| `npm run check:pilot-readiness` | Static preflight, no-go classification, missing evidence categories | Manual approval, real roster correctness, credential delivery approval |
| `npm test` | Source and regression guardrails | Policy approval or staff training |
| `npm run typecheck` | TypeScript/surface typing | Runtime school approval |
| `npm run check` | Composite local/static checks and pilot readiness preflight | Live real-student go decision |
| `npm run prove:workspace-ui-polish` | Local fake-account screenshot proof | Real-student pilot approval |
| Hosted fake-account browser proof | Hosted fake-account click-around demo | Real-student production or pilot readiness |

## Non-Negotiable Blockers

The pilot remains NO-GO if any blocker is true:

- Any required manual evidence path is missing.
- School/admin approval is missing.
- Privacy/support/retention approval is missing.
- SSO or managed-local credential delivery is not approved.
- Backup/restore rehearsal evidence is missing.
- Real roster validation evidence is missing.
- A role can see or mutate outside pilot scope.
- Viewer is not read-only.
- View as Student can mutate or open unauthorized students.
- Global Admin local-account-only behavior is weakened.
- Fake-account proof is presented as real-student approval.
- Archive/download is claimed while `student_archive_manifest_download` is still skipped/not ready.

## Final Go/No-Go Decision Area

| Decision field | Value |
| --- | --- |
| Decision date | TBD |
| Decision owner | TBD |
| Pilot owner | TBD |
| Technical owner | TBD |
| Support owner | TBD |
| Privacy/data owner | TBD |
| Roster owner | TBD |
| Decision | NO-GO until all required evidence is present and reviewed |
| Notes | Do not change this decision based only on screenshots, fake `.test` proof, or local tests. |

## Decision Rule

Change this gate only after:

1. All required manual evidence manifests exist and are reviewed.
2. `npm run check:pilot-readiness` no longer reports missing required manual evidence.
3. The pilot owner records written go approval.
4. The technical owner confirms validation commands pass.
5. The privacy/data owner confirms student data handling is approved.
