---
automation_id: "senior-capstone-qol-protected-evidence-tests-slot-2"
name: "Senior Capstone QoL - Protected Evidence Tests Slot 2"
snapshot_generated_utc: "2026-05-19T14:17:34Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=9;BYMINUTE=39"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "1a4ddaa3e861756c3eb13c44265f1780baf1a7c598de3cefe39b1847ed8d2c93"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-protected-evidence-tests-slot-2\automation.toml"
---

# Senior Capstone QoL - Protected Evidence Tests Slot 2

## Prompt

~~~~text
Role: Senior Capstone QoL - Protected Evidence Tests.
Automation category: backend-security-data.
QoL target: protected evidence access checks, denied-access audit events, permission helper coverage, and private student record safety.
Primary requirement IDs: MVP-006, MVP-014, MVP-020, MVP-027, plus permission portions of MVP-013.
Current priority: Broaden auth, permission-helper, protected-evidence, status-transition, audit/export, meeting-attendance, and presentation-slot-conflict tests tied to the Day 7 alpha path.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. Treat the Google Drive school-account cutover as deferred unless it becomes the exact blocker for the selected slice.

Mission: build the Senior Capstone MVP with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work. Read C:\Users\bryan\.codex\automations\senior-capstone-qol-protected-evidence-tests-slot-2\memory.md first if it exists; create it during closeout if it is missing. If that memory path is unavailable in the current environment, record the exact blocker once and continue the repo-side slice instead of spending the run on repeated path probes.

Token budget guardrail: stay narrow, prefer rg and recent/tail log reads, and pick one bounded QoL slice. Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice, avoid repeating recent work, and update catalog evidence when it changes. A-material quality bar: every productive run must land verified MVP implementation, improve a project automation/script/checker, or commit an exact blocker with evidence and next action.

Protected-evidence default ladder: unless a higher-severity dirty-worktree collision blocks it, choose exactly one of these bounded slices and finish it end-to-end: 1) permission-helper tests around functions/_lib/permissions.ts and related auth/session helpers, 2) real evidence access route/helper work under functions/api/evidence/ plus denied-access audit_events coverage through functions/_lib/auth.ts, or 3) scoped backend tests that consume the seeded fixtures in functions/api/admin/test-accounts.ts for mentor, program_teacher, admin, misc_admin, and unauthorized evidence access. Prefer real backend tests and routes over alpha-only state-model coverage.

High-signal repo surfaces for this lane: functions/_lib/permissions.ts, functions/_lib/auth.ts, functions/api/evidence/, functions/api/admin/test-accounts.ts, migrations/0001_foundation.sql, tests/*.test.mjs, docs/progress/rebuild.md, and docs/progress/run-log.md. Do not stop at repo exploration if there is no evidence-item access endpoint yet; implement the smallest missing route or helper and its tests in the same run when the worktree is writable.

Surface expansion rule: decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: if prompt/config/script repair is justified, update only this project automation area and the smallest relevant project script; otherwise log self-improvement: none. Only touch automation related to this project when doing automation maintenance. Use scripts/snapshot-automation-prompts.ps1, scripts/check-automation-contract.ps1, scripts/run-powershell-script.mjs, npm run automation:snapshot, npm run check:automation, npm run check:automation:live, -RequireLive, and measure-automation-efficiency.ps1 as appropriate.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Validate touched files, inspect git status, commit with the correct prefix, push the current branch, never force push, and never stage unrelated dirty files. If git status shows detached HEAD, identify the containing branch with a non-interactive git command before closeout; if no branch can be resolved safely, commit the bounded change and record the exact push blocker rather than skipping product or automation work.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. Update the automation memory file with a 3-6 line summary, current focus, exact blocker/next action, and the local run timestamp. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run node scripts/run-powershell-script.mjs scripts/measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are not production auth, database, private evidence storage, audit log, or dashboard source of truth.

QoL phone tracker closeout: at the end of every run, append exactly one phone-readable row to the native Google Sheet "Senior Capstone QoL Run Tracker" (https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit), spreadsheet ID 1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs, tab "QoL Runs", sheetId 124517328. Use the Google Sheets/Drive connector if available, preferably batchUpdate appendCells, with columns: Timestamp PT, Automation ID, QoL Target, Slot, Status, Accepted MVP Pass, Requirement IDs, Output Kind, Summary, Validation, Commit/PR, Blocker/Next Action, Duration Min, Run Manifest, Notes. Keep Summary, Validation, and Blocker/Next Action compact enough to read on a phone. If the Sheets append fails, retry once; if it is still blocked, do not skip repo closeout--record the exact Google Sheets blocker in the run manifest, run log, final response, and automation memory file.
~~~~
