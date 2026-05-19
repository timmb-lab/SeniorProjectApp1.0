---
automation_id: "senior-capstone-qol-announcements-slot-3"
name: "Senior Capstone QoL - Announcements Slot 3"
snapshot_generated_utc: "2026-05-19T13:01:29Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=21;BYMINUTE=39"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "73a11403eeb520b6708b397c8e476300e76900f68a1a43f023987d831700042c"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-announcements-slot-3\automation.toml"
---

# Senior Capstone QoL - Announcements Slot 3

## Prompt

~~~~text
Role: Senior Capstone QoL - Announcements.
Automation category: admin-ops-reporting.
QoL target: staff/admin announcement surfaces without student-to-student messaging, privacy-safe copy, and auditability.
Primary requirement IDs: MVP-018, MVP-020, MVP-023, MVP-027.
Current priority: Keep announcements narrow to role-scoped alpha notices and audit-safe display states that support the seeded walkthrough without expanding into messaging or broad polish.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. Treat the Google Drive school-account cutover as deferred unless it becomes the exact blocker for the selected slice.

Mission: build the Senior Capstone MVP with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work.

Token budget guardrail: stay narrow, prefer rg and recent/tail log reads, and pick one bounded QoL slice. Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice, avoid repeating recent work, and update catalog evidence when it changes. A-material quality bar: every productive run must land verified MVP implementation, improve a project automation/script/checker, or commit an exact blocker with evidence and next action.

Surface expansion rule: decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: if prompt/config/script repair is justified, update only this project automation area and the smallest relevant project script; otherwise log self-improvement: none. Only touch automation related to this project when doing automation maintenance. Use scripts/snapshot-automation-prompts.ps1, scripts/check-automation-contract.ps1, scripts/run-powershell-script.mjs, npm run automation:snapshot, npm run check:automation, npm run check:automation:live, -RequireLive, and measure-automation-efficiency.ps1 as appropriate.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Validate touched files, inspect git status, commit with the correct prefix, push the current branch, never force push, and never stage unrelated dirty files.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run node scripts/run-powershell-script.mjs scripts/measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are not production auth, database, private evidence storage, audit log, or dashboard source of truth.

QoL phone tracker closeout: at the end of every run, append exactly one phone-readable row to the native Google Sheet "Senior Capstone QoL Run Tracker" (https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit), spreadsheet ID 1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs, tab "QoL Runs", sheetId 124517328. Use the Google Sheets/Drive connector if available, preferably batchUpdate appendCells, with columns: Timestamp PT, Automation ID, QoL Target, Slot, Status, Accepted MVP Pass, Requirement IDs, Output Kind, Summary, Validation, Commit/PR, Blocker/Next Action, Duration Min, Run Manifest, Notes. Keep Summary, Validation, and Blocker/Next Action compact enough to read on a phone. If the Sheets append fails, retry once; if it is still blocked, do not skip repo closeout--record the exact Google Sheets blocker in the run manifest, run log, and final response.
~~~~
