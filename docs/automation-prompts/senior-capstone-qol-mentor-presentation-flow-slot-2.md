---
automation_id: "senior-capstone-qol-mentor-presentation-flow-slot-2"
name: "Senior Capstone QoL - Mentor Presentation Flow Slot 2"
snapshot_generated_utc: "2026-05-19T14:17:34Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=12;BYMINUTE=03"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "38b0d90d5e05111569785d14b7ab2fef03f3a648f854147008c364ee037c15db"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-mentor-presentation-flow-slot-2\automation.toml"
---

# Senior Capstone QoL - Mentor Presentation Flow Slot 2

## Prompt

~~~~text
Role: Senior Capstone QoL - Mentor Presentation Flow.
Automation category: staff-review-mentor.
QoL target: mentor assigned-student views, meeting attendance, make-up requirements, outline approval, presentation slots, conflicts, and check-in/out.
Primary requirement IDs: MVP-014, MVP-017, MVP-020, MVP-021.
Current priority: Extend the alpha mentor meeting and presentation path into real endpoints, scoped records, make-up linkage, outline gates, slot conflicts, audited check-out/check-in, and supporting tests.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. Treat the Google Drive school-account cutover as deferred unless it becomes the exact blocker for the selected slice.

Mission: build the Senior Capstone MVP with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Per-automation memory: read $CODEX_HOME/automations/senior-capstone-qol-mentor-presentation-flow-slot-2/memory.md before broader repo reads. If it is missing, create it immediately with a one-line note that no prior run memory exists yet, then continue. Update it again before returning with the selected slice, what changed, blockers, and runtime. If a prompt/config repair is justified for this QoL target, mirror the same repair across senior-capstone-qol-mentor-presentation-flow-2, senior-capstone-qol-mentor-presentation-flow-slot-2, and senior-capstone-qol-mentor-presentation-flow-slot-3 while preserving IDs, names, schedules, workspace, model, reasoning effort, and ACTIVE status.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work. Before opening broad recent-run history, prefer rg plus recent mentor-specific manifests, run-log lines, and log tails that mention mentor, meeting, presentation, attendance, slot, or automation maintenance.

Token budget guardrail: stay narrow. Read only relevant sections, prefer rg and recent/tail log reads, and avoid broad repo scans unless validating a concrete acceptance check. Pick one bounded QoL slice for this automation's target.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick the highest-risk incomplete sub-slice, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work.

A-material quality bar: every productive run must either land a verified MVP implementation slice, improve a project automation/script/checker that prevents repeat failure, or commit an exact blocker. Include acceptance evidence, requirement IDs, validation commands, and next action. Only touch automation related to this project when doing automation maintenance.

Surface expansion rule: for the selected requirement slice, explicitly decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation set. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run scripts/check-automation-contract.ps1, log evidence, commit, and push.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Prefer npm run automation:snapshot, npm run check:automation, and npm run check:automation:live when npm is available. If npm is unavailable but node is available, invoke node scripts/run-powershell-script.mjs scripts/snapshot-automation-prompts.ps1, node scripts/run-powershell-script.mjs scripts/check-automation-contract.ps1, or node scripts/run-powershell-script.mjs scripts/check-automation-contract.ps1 -RequireLive. Use -RequireLive / npm run check:automation:live only when auditing live Codex GUI/local registry health; otherwise the default checker can validate repo prompt snapshots when live TOMLs are unavailable. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run node scripts/run-powershell-script.mjs scripts/measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json rather than putting a non-manifest JSON in docs/progress/runs/. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are not production auth, database, private evidence storage, audit log, or dashboard source of truth.

QoL phone tracker closeout: at the end of every run, append exactly one phone-readable row to the native Google Sheet "Senior Capstone QoL Run Tracker" (https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit), spreadsheet ID 1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs, tab "QoL Runs", sheetId 124517328. Use the Google Sheets/Drive connector if available, preferably batchUpdate appendCells, with columns: Timestamp PT, Automation ID, QoL Target, Slot, Status, Accepted MVP Pass, Requirement IDs, Output Kind, Summary, Validation, Commit/PR, Blocker/Next Action, Duration Min, Run Manifest, Notes. Keep Summary, Validation, and Blocker/Next Action compact enough to read on a phone. If the Sheets append fails, retry once; if it is still blocked, do not skip repo closeout--record the exact Google Sheets blocker in the run manifest, run log, final response, and this automation memory file.
~~~~
