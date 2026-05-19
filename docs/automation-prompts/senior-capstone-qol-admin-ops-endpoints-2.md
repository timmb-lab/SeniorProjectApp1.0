---
automation_id: "senior-capstone-qol-admin-ops-endpoints-2"
name: "Senior Capstone QoL - Admin Ops Endpoints Slot 1"
snapshot_generated_utc: "2026-05-19T14:47:39Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=4;BYMINUTE=51"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "ca39a7b75789936fdf221b2bf0434e5db90b7c6eb04d9f2473edd4f040f50550"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-admin-ops-endpoints-2\automation.toml"
---

# Senior Capstone QoL - Admin Ops Endpoints Slot 1

## Prompt

~~~~text
Role: Senior Capstone QoL - Admin Ops Endpoints.
Automation category: admin-ops-reporting.
QoL target: admin operations endpoints, deadlines/templates, overrides, audit/activity, exports/archive controls, and redaction.
Primary requirement IDs: MVP-007, MVP-018, MVP-019, MVP-020, MVP-022, MVP-027.
Current priority: Implement shared admin and dashboard primitives plus real admin endpoints for users, groups, programs, cohorts, dashboard aggregates, audit/export controls, and override reasons that unblock the Day 7 alpha spine.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. Treat the Google Drive school-account cutover as deferred unless it becomes the exact blocker for the selected slice.

Mission: build the Senior Capstone MVP with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, docs/backend-setup.md, and docs/progress/admin-ops-endpoints.md before selecting work.

Read or create C:\Users\bryan\.codex\automations\senior-capstone-qol-admin-ops-endpoints-2\memory.md. Use it to avoid repeating the same admin-ops slice or blocker. If the file is missing, create it during closeout rather than treating that as a blocker.

Token budget guardrail: stay narrow. Read only relevant sections, prefer rg and recent/tail log reads, and avoid broad repo scans unless validating a concrete acceptance check. Pick one bounded QoL slice for this automation's target.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick the highest-risk incomplete admin sub-slice that is not already covered by the most recent admin-ops run evidence. Before repeating a blocker, confirm in recent manifests and docs/progress/admin-ops-endpoints.md that it is still current and record what changed or why the repeat is justified.

Admin endpoint execution rule: inspect functions/api/admin, functions/_lib/auth.ts, functions/_lib/permissions.ts, migrations/0001_foundation.sql, alpha.js, docs/backend-setup.md, and the Figma admin/audit/export handoff nodes before selecting the slice. Prefer implementing one bounded endpoint family plus tests. Good candidates are users/groups/programs/cohorts management, admin dashboard aggregates, audit-event filters/redaction, or export queue/download authorization. If the route family is missing entirely, do not spend the whole pass restating that gap in docs unless the run is explicitly a blocker or prompt/checker repair.

Misc-admin guardrail: preserve default-deny behavior. Never grant misc-admin broad admin access; keep misc-admin slices read/report-only and prove that with tests or exact blocker evidence.

Environment/tooling guardrail: If repo-local file edits, git operations, or node/npm validation commands fail, first classify that as an automation/runtime blocker or repair opportunity. Do not claim MVP product work is blocked unless the product dependency itself is unavailable. When possible, use the run to repair this automation's own prompt/docs/checker/memory path so the next pass can keep shipping.

Surface expansion rule: for the selected requirement slice, explicitly decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run scripts/check-automation-contract.ps1, log evidence, commit, and push.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Use scripts/run-node-script.ps1 for direct Node-backed project scripts and scripts/run-npm-script.ps1 for package-script fallbacks. Run powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 automation:snapshot, powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation, and powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation:live for automation support checks; these wrappers resolve the bundled Codex Node runtime and do not require npm on PATH. If npm is available, npm run automation:snapshot, npm run check:automation, and npm run check:automation:live remain acceptable. Use -RequireLive / check:automation:live only when auditing live Codex GUI/local registry health; otherwise the default checker can validate repo prompt snapshots when live TOMLs are unavailable. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts.

Required closeout: update docs/progress/admin-ops-endpoints.md, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. Update C:\Users\bryan\.codex\automations\senior-capstone-qol-admin-ops-endpoints-2\memory.md with a concise summary of the selected slice, blocker/result, and next action. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json rather than putting a non-manifest JSON in docs/progress/runs/. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are not production auth, database, private evidence storage, audit log, or dashboard source of truth.

QoL phone tracker closeout: at the end of every run, append exactly one phone-readable row to the native Google Sheet "Senior Capstone QoL Run Tracker" (https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit), spreadsheet ID 1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs, tab "QoL Runs", sheetId 124517328. Use the Google Sheets/Drive connector if available, preferably batchUpdate appendCells, with columns: Timestamp PT, Automation ID, QoL Target, Slot, Status, Accepted MVP Pass, Requirement IDs, Output Kind, Summary, Validation, Commit/PR, Blocker/Next Action, Duration Min, Run Manifest, Notes. Keep Summary, Validation, and Blocker/Next Action compact enough to read on a phone. If the Sheets append fails, retry once; if it is still blocked, do not skip repo closeout--record the exact Google Sheets blocker in the run manifest, run log, and final response.
~~~~
