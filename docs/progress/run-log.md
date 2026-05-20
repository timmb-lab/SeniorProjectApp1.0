# Senior Capstone Run Log

Last refreshed: 2026-05-20

This is the compact run log for the current single-runner automation contract.

## Current Automation Contract

- Active GUI automation: `senior-capstone-hourly-qol-orchestrator`.
- Cadence: every 30 minutes.
- RRULE: `FREQ=MINUTELY;INTERVAL=30`.
- Source of truth: `automation/qol/project-lock.json`.
- Verifier: `scripts/verify-cadence-30min.ps1`.
- Rule: no other Senior Capstone project automation should be created, invoked, revived, or maintained from this repo.

## Current Product Baseline

- Cloudflare Pages/Functions and D1 scaffold exists.
- Day 7 alpha flow exists at `alpha.html` with `/api/alpha/state`.
- First-admin bootstrap is complete.
- Fake `.test` role accounts are seeded for walkthrough testing, with credentials kept only in ignored `.secrets/`.
- Remaining priority: broader permission/protected-evidence tests, real workflow endpoints, Drive upload credential/OAuth, account lifecycle, mobile/error/empty QA, and deployment verification.

Future productive runs should append compact entries that name the master-plan section, MVP requirement IDs, files changed, verification, blocker status, and commit/push result.

## 2026-05-19 20:30 PT - MVP-009 Framework Seed Loader Foundation

- `master-plan sections`: 30-Minute Master-Plan Orchestrator; Updated 100-Pass Allocation From Current State; Logging Requirements.
- `requirement IDs`: `MVP-009`; `backlog IDs`: `SC-001`.
- `files changed`: `migrations/0002_framework_seed.sql`, `scripts/framework-seed.mjs`, `tests/framework-seed.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-backlog.md`, `docs/automation-memory.md`, `docs/master-plan.md`, and `docs/progress/runs/2026-05-19-2030-framework-seed-mvp-009.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none (remote D1 apply/verification deferred to follow-on pass with Wrangler).

## 2026-05-19 20:49 PT - MVP-006/MVP-014 Permission Helper Tests

- `master-plan sections`: Day 7 Alpha Gate; Immediate next five passes should deepen the shipped alpha; Logging Requirements.
- `requirement IDs`: `MVP-006`, `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `tests/permissions-access.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, and `docs/progress/runs/2026-05-19-2049-permission-tests-mvp-006-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-19 21:19 PT - MVP-014 Evidence Access Route Tests

- `master-plan sections`: Day 7 Alpha Gate; Immediate next five passes should deepen the shipped alpha; Logging Requirements.
- `requirement IDs`: `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `tests/evidence-check-access.integration.test.mjs`, `functions/api/evidence/[id]/check-access.ts`, `functions/_lib/auth.ts`, `functions/_lib/permissions.ts`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, and `docs/progress/runs/2026-05-19-2119-evidence-access-route-tests-mvp-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-19 21:42 PT - MVP-014 Evidence Access Role Coverage Tests

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `tests/evidence-check-access.integration.test.mjs`, `docs/automation-memory.md`, and `docs/progress/runs/2026-05-19-2142-evidence-access-role-coverage-mvp-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-19 22:24 PT - MVP-013 Google Drive OAuth Probe Route + Tests

- `master-plan sections`: Day 7 Alpha Gate; The critical gap has shifted; Immediate next five passes should deepen the shipped alpha; Logging Requirements.
- `requirement IDs`: `MVP-013`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `functions/_lib/google-drive.ts`, `functions/api/evidence/drive-probe.ts`, `tests/google-drive-probe.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-backlog.md`, `docs/automation-memory.md`, and `docs/progress/runs/2026-05-19-2224-drive-oauth-probe-mvp-013.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none (Drive secrets + upload/retrieval wiring still pending).

## 2026-05-19 22:58 PT - MVP-013 Drive Evidence Upload + Download Routes

- `master-plan sections`: Day 7 Alpha Gate; Immediate next five passes should deepen the shipped alpha; Logging Requirements.
- `requirement IDs`: `MVP-013`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `functions/_lib/google-drive.ts`, `functions/_lib/workflow.ts`, `functions/api/submissions/[id]/evidence/upload.ts`, `functions/api/evidence/[id]/download.ts`, `functions/api/evidence/[id]/check-access.ts`, `tests/evidence-drive-file.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-backlog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-19-2258-drive-evidence-upload-download-mvp-013.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none (Cloudflare Pages Drive secrets still need configuration to verify real uploads/downloads).

## 2026-05-19 23:24 PT - MVP-013 Drive Evidence Smoke UI

- `master-plan sections`: Day 7 Alpha Gate; Immediate next five passes should deepen the shipped alpha; Logging Requirements.
- `requirement IDs`: `MVP-013`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `account.html`, `account.css`, `account.js`, `docs/mvp-requirements-catalog.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-19-2324-account-drive-smoke-mvp-013.json`.
- `verification`: `node --check account.js` (via `scripts/resolve-node.ps1`), `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none (Cloudflare Pages Drive secrets still need configuration to verify real uploads/downloads).

## 2026-05-19 23:45 PT - MVP-009 Framework Seed Data Migration

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-009`; `backlog IDs`: `SC-001`.
- `files changed`: `migrations/0003_framework_seed_data.sql`, `tests/framework-seed-migration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-backlog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-19-2345-framework-seed-data-mvp-009.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none (still need to apply migrations to local/remote D1 and verify seeded counts by query).

## 2026-05-20 00:12 PT - MVP-009 Seeded Requirement Fixtures

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-009`; `backlog IDs`: `SC-001`.
- `files changed`: `functions/api/admin/test-accounts.ts`, `tests/test-account-seed.test.mjs`, `docs/artifacts.json`, `docs/mvp-requirements-catalog.md`, `docs/automation-backlog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0012-seeded-requirement-fixtures-mvp-009.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none (still need to apply migrations to local/remote D1 and verify seeded counts by query).

## 2026-05-20 00:46 PT - MVP-009 D1 Framework Seed Migration Verification

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-009`; `backlog IDs`: `SC-001`.
- `files changed`: `scripts/verify-framework-seed-d1.ps1`, `docs/mvp-requirements-catalog.md`, `docs/automation-backlog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0046-framework-seed-d1-verify-mvp-009.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\verify-framework-seed-d1.ps1 -InstallDeps` (local apply + counts verified), `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: Remote D1 apply/verification requires `CLOUDFLARE_API_TOKEN` for non-interactive Wrangler; remote migration remains pending.

## 2026-05-20 01:13 PT - MVP-014 Evidence Download Access Tests

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `tests/evidence-drive-file.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0113-evidence-download-tests-mvp-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 01:43 PT - MVP-014 Evidence Download Role Coverage Tests

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `tests/evidence-drive-file.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0143-evidence-download-role-coverage-mvp-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 02:21 PT - MVP-015 Teacher Review Loop Integration Test

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-015`; `backlog IDs`: `SC-005`, `SC-006`.
- `files changed`: `tests/review-loop.integration.test.mjs`, `functions/api/submissions/[id]/submit.ts`, `functions/api/reviews/[submissionId]/decision.ts`, `functions/api/reviews/[submissionId]/history.ts`, `functions/api/teacher/review-queue.ts`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0221-review-loop-integration-mvp-015.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 02:47 PT - MVP-004/MVP-005 Auth Edge-State Integration Tests

- `master-plan sections`: Day 7 Alpha Gate; 2026-05-20 30-Minute MVP Builder And Oversight; Logging Requirements.
- `requirement IDs`: `MVP-004`, `MVP-005`; `backlog IDs`: `SC-005`.
- `files changed`: `tests/auth-login.integration.test.mjs`, `functions/api/auth/login.ts`, `functions/api/auth/me.ts`, `functions/api/auth/logout.ts`, `functions/api/auth/bootstrap.ts`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/rebuild.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0247-auth-edge-tests-mvp-004-005.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 03:20 PT - MVP-017 Mentor Meeting Persistence Route + Tests

- `master-plan sections`: Day 7 Alpha Gate; Immediate next five passes should deepen the shipped alpha; Logging Requirements.
- `requirement IDs`: `MVP-017`; `backlog IDs`: `SC-004`.
- `files changed`: `migrations/0004_mentor_meetings.sql`, `functions/api/mentor/meetings.ts`, `tests/mentor-meetings.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0320-mentor-meetings-mvp-017.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 03:40 PT - MVP-014 Evidence Download Misc-Admin Denial Test

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `tests/evidence-drive-file.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0340-evidence-download-misc-admin-mvp-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 04:16 PT - MVP-012 Block Submissions Without Evidence

- `master-plan sections`: Day 7 Alpha Gate; Seven-day implementation ladder (Day 3: evidence metadata validation + blocked-submit states); Logging Requirements.
- `requirement IDs`: `MVP-012`; `backlog IDs`: `SC-005`, `SC-006`.
- `files changed`: `functions/api/submissions/[id]/submit.ts`, `tests/review-loop.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/rebuild.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0416-submit-evidence-gate-mvp-012.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass).
- `blockers`: none.

## 2026-05-20 04:48 PT - MVP-006 Mentor Role Required for Mentor Assignments

- `master-plan sections`: Day 7 Alpha Gate; Anti-Drift Rules; Logging Requirements.
- `requirement IDs`: `MVP-006`; `backlog IDs`: `SC-005`.
- `files changed`: `functions/_lib/permissions.ts`, `tests/permissions-access.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/rebuild.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0448-mentor-role-guard-mvp-006.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass; 83 tests).
- `blockers`: none.

## 2026-05-20 05:18 PT - MVP-006/MVP-007 Admin Mentor Assignment Provisioning Guard

- `master-plan sections`: Day 7 Alpha Gate; Anti-Drift Rules; Logging Requirements.
- `requirement IDs`: `MVP-006`, `MVP-007`, `MVP-020`; `backlog IDs`: `SC-005`.
- `files changed`: `functions/api/admin/mentor-assignments.ts`, `tests/admin-mentor-assignments.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/rebuild.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0518-admin-mentor-assignments-mvp-006.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass; 89 tests).
- `blockers`: none.

## 2026-05-20 05:44 PT - MVP-007 Admin Mentor Assignment List + Deactivation

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-007`, `MVP-020`; `backlog IDs`: `SC-005`.
- `files changed`: `functions/api/admin/mentor-assignments.ts`, `tests/admin-mentor-assignments.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/rebuild.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0544-admin-mentor-assignment-list-deactivate-mvp-007.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass; 97 tests).
- `blockers`: none.

## 2026-05-20 06:20 PT - MVP-013 Resumable Drive Evidence Upload

- `master-plan sections`: Day 7 Alpha Gate; Logging Requirements.
- `requirement IDs`: `MVP-013`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `functions/_lib/google-drive.ts`, `functions/api/submissions/[id]/evidence/upload.ts`, `tests/evidence-drive-file.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0620-drive-resumable-upload-mvp-013.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass; 99 tests).
- `blockers`: none.

## 2026-05-20 06:49 PT - MVP-006/MVP-014 Teacher Scope Default-Deny Hardening

- `master-plan sections`: Day 7 Alpha Gate; Anti-Drift Rules; Logging Requirements.
- `requirement IDs`: `MVP-006`, `MVP-014`; `backlog IDs`: `SC-003`, `SC-005`.
- `files changed`: `functions/_lib/permissions.ts`, `tests/permissions-access.test.mjs`, `tests/evidence-check-access.integration.test.mjs`, `docs/mvp-requirements-catalog.md`, `docs/automation-memory.md`, `docs/progress/rebuild.md`, `docs/progress/run-log.md`, and `docs/progress/runs/2026-05-20-0649-teacher-scope-null-guard-mvp-006-014.json`.
- `verification`: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-npm-script.ps1 test` (pass; 101 tests).
- `blockers`: none.
