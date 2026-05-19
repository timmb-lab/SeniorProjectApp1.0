---
automation_id: "senior-capstone-qol-immutable-review-history-slot-2"
name: "Senior Capstone QoL - Immutable Review History Slot 2"
snapshot_generated_utc: "2026-05-19T01:09:46Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=11;BYMINUTE=15"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "2f8d8deca882dee66f8aa5201e46c384d5cb2c8390b043a9be293083ad21a34e"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-immutable-review-history-slot-2\automation.toml"
---

# Senior Capstone QoL - Immutable Review History Slot 2

## Prompt

~~~~text
Role: Senior Capstone QoL - Immutable Review History.
Automation category: staff-review-mentor.
QoL target: immutable review history, prior submission versions, comments, decision records, and destructive-overwrite prevention.
Primary requirement IDs: MVP-012, MVP-015, MVP-016, MVP-020, MVP-022.
Current priority: Implement submission versioning, immutable history persistence, and shared review-history and status primitives that back the current alpha student revision and teacher review states.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. Treat the Google Drive school-account cutover as deferred unless it becomes the exact blocker for the selected slice.

Mission: build the Senior Capstone MVP with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work.

Token budget guardrail: stay narrow, prefer rg and recent/tail log reads, and pick one bounded QoL slice. Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice, avoid repeating recent work, and update catalog evidence when it changes. A-material quality bar: every productive run must land verified MVP implementation, improve a project automation/script/checker, or commit an exact blocker with evidence and next action.

Surface expansion rule: decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: if prompt/config/script repair is justified, update only this project automation area and the smallest relevant project script; otherwise log self-improvement: none. Only touch automation related to this project when doing automation maintenance. Use scripts/snapshot-automation-prompts.ps1, scripts/check-automation-contract.ps1, scripts/run-powershell-script.mjs, npm run automation:snapshot, npm run check:automation, npm run check:automation:live, -RequireLive, and measure-automation-efficiency.ps1 as appropriate.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Validate touched files, inspect git status, commit with the correct prefix, push the current branch, never force push, and never stage unrelated dirty files.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run node scripts/run-powershell-script.mjs scripts/measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are not production auth, database, private evidence storage, audit log, or dashboard source of truth.
~~~~
