---
automation_id: "senior-capstone-qol-drive-upload-oauth-slot-3"
name: "Senior Capstone QoL - Drive Upload OAuth Slot 3"
snapshot_generated_utc: "2026-05-19T15:53:04Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=16;BYMINUTE=51"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "ed5d0015ea64dc264cda1a8969ce4b5af2cb6ef0d234b6186a35234195f6ba77"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-drive-upload-oauth-slot-3\automation.toml"
---

# Senior Capstone QoL - Drive Upload OAuth Slot 3

## Prompt

~~~~text
Role: Senior Capstone QoL - Drive Upload OAuth.
Automation category: student-workflow-evidence.
QoL target: Google Drive upload credential/OAuth path, evidence metadata, provider failure states, and private repository assumptions.
Primary requirement IDs: MVP-013, plus Drive-facing portions of MVP-014, MVP-022, and MVP-027.
Current priority: Treat the Google Drive school-account cutover as deferred. Only preserve safe evidence metadata, provider error states, retrieval assumptions, and exact blockers that affect the immediate alpha ladder.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. This lane should stay narrow and mostly produce safe metadata/path assumptions or an exact blocker until Bryan handles the school-account move.
Known narrow-focus drift to resolve before reopening broad audits: .dev.vars.example already references GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY, but functions/_types.ts, functions/api/health.ts, and functions/api/evidence/repository.ts do not consume a server-side Drive credential path yet. docs/alpha-week-framework.md requires upload/provider-unavailable, but alpha.js and functions/_lib/alpha-flow-model.js do not yet implement that provider-unavailable state.
Lane memory rule: read C:\Users\bryan\.codex\automations\senior-capstone-qol-drive-upload-oauth-slot-3\memory.md before choosing work; if it is missing, create it during closeout with the latest lane-specific blocker/progress summary and current runtime so the other Drive slots do not repeat the same audit.
Preferred slice order for this lane: 1) implement or test the missing upload/provider-unavailable state, 2) wire or document the exact GOOGLE_DRIVE_CLIENT_EMAIL / GOOGLE_DRIVE_PRIVATE_KEY runtime gap without attempting the deferred school-account cutover, 3) if neither is safely possible, commit one exact blocker tied to the missing credential path or connector/tool access.

Mission: build the Senior Capstone MVP with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work.

Token budget guardrail: stay narrow, prefer rg and recent/tail log reads, and pick one bounded QoL slice. Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice, avoid repeating recent work, and update catalog evidence when it changes. A-material quality bar: every productive run must land verified MVP implementation, improve a project automation/script/checker, or commit an exact blocker with evidence and next action.

Surface expansion rule: decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: if prompt/config/script repair is justified, update only this project automation area and the smallest relevant project script; otherwise log self-improvement: none. Only touch automation related to this project when doing automation maintenance. Use scripts/snapshot-automation-prompts.ps1, scripts/check-automation-contract.ps1, scripts/run-node-script.ps1, scripts/run-npm-script.ps1, npm run automation:snapshot, npm run check:automation, npm run check:automation:live, -RequireLive, and measure-automation-efficiency.ps1 as appropriate.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively with scripts/run-node-script.ps1 or scripts/run-npm-script.ps1 when node/npm are unreliable. Validate touched files, inspect git status, commit with the correct prefix, push the current branch, never force push, and never stage unrelated dirty files.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are not production auth, database, private evidence storage, audit log, or dashboard source of truth.

QoL phone tracker closeout: at the end of every run, append exactly one phone-readable row to the native Google Sheet "Senior Capstone QoL Run Tracker" (https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit), spreadsheet ID 1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs, tab "QoL Runs", sheetId 124517328. Use the Google Sheets/Drive connector if available, preferably batchUpdate appendCells, with columns: Timestamp PT, Automation ID, QoL Target, Slot, Status, Accepted MVP Pass, Requirement IDs, Output Kind, Summary, Validation, Commit/PR, Blocker/Next Action, Duration Min, Run Manifest, Notes. Keep Summary, Validation, and Blocker/Next Action compact enough to read on a phone. If the Sheets append fails, retry once; if it is still blocked, do not skip repo closeout--record the exact Google Sheets blocker in the run manifest, run log, and final response.
~~~~
