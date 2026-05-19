---
automation_id: "senior-capstone-qol-source-framework-seed-2"
name: "Senior Capstone QoL - Source Framework Seed Slot 1"
snapshot_generated_utc: "2026-05-19T14:47:39Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0;BYMINUTE=03"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "3daa8e0e2b3f5ebbf2f030cc8c3d87446aead25920e123eafe67ba04799df2e0"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-source-framework-seed-2\automation.toml"
---

# Senior Capstone QoL - Source Framework Seed Slot 1

## Prompt

~~~~text
Role: Senior Capstone QoL - Source Framework Seed.
Automation category: requirements-audit.
QoL target: source-framework seed loader, requirements/deadlines/quality-check records, source-PDF coverage, and catalog drift control.
Primary requirement IDs: MVP-002, MVP-003, MVP-008, MVP-009, MVP-030, plus catalog/backlog portions of MVP-001.
Current priority: Keep the framework/catalog aligned with the immediate alpha ladder by landing only the requirement, deadline, review-gate, dashboard-signal, and data/capstone-framework.json seed work that the new tests, real workflow endpoints, and shared alpha primitives need next.
Targeted goal alignment: prioritize 1) broader tests, 2) real workflow endpoints, 3) shared alpha primitives, and 5) account-lifecycle and known-gaps hardening. Treat the Google Drive school-account cutover as deferred unless it becomes the exact blocker for the selected slice.

Mission: build the Senior Capstone MVP as a GitHub-to-Cloudflare hosted, security-focused, database-backed app with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch, then immediately inspect git branch --show-current. If git status shows detached HEAD or the branch name is blank, treat that as an immediate repo-state blocker or repair target before deep implementation work. Do not spend a long run on product changes if there is no pushable branch; first log the exact branch state, use only non-destructive git inspection to identify the intended branch, and record the blocker in the manifest/run log if the branch cannot be safely recovered without rewriting someone else's work. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work.

Automation memory: read and maintain C:\Users\bryan\.codex\automations\senior-capstone-qol-source-framework-seed-2\memory.md at the start and end of every run. If it does not exist, create it with a compact note of recent requirement-slice decisions, repeated blockers, last useful validation evidence, and the next recommended source-framework action so the next slot can continue without repeating stale analysis.

Token budget guardrail: stay narrow. Read only relevant sections, prefer rg and recent/tail log reads, and avoid broad repo scans unless validating a concrete acceptance check. Pick one bounded QoL slice for this automation's target.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick the highest-risk incomplete sub-slice, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work.

Duplicate-scope guardrail: before selecting the slice, compare the repo state, recent manifests, and this automation memory file. If the same blocker-only diagnosis was already logged recently and no new evidence changed it, do not spend another run restating it. Either repair the prompt/checker/script path that caused the repeat, land the next implementation or test step, or record a materially new blocker.

A-material quality bar: every productive run must either land a verified MVP implementation slice, improve a project automation/script/checker that prevents repeat failure, or commit an exact blocker. Include acceptance evidence, requirement IDs, validation commands, and next action. Only touch automation related to this project when doing automation maintenance.

Surface expansion rule: for the selected requirement slice, explicitly decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run scripts/check-automation-contract.ps1, log evidence, commit, and push.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Use scripts/run-node-script.ps1 for direct Node-backed project scripts and scripts/run-npm-script.ps1 for package-script fallbacks. Run powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 automation:snapshot, powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation, and powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation:live for automation support checks; these wrappers resolve the bundled Codex Node runtime and do not require npm on PATH. If npm is available, npm run automation:snapshot, npm run check:automation, and npm run check:automation:live remain acceptable. Use -RequireLive / check:automation:live only when auditing live Codex GUI/local registry health; otherwise the default checker can validate repo prompt snapshots when live TOMLs are unavailable. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json rather than putting a non-manifest JSON in docs/progress/runs/. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Canva support assets are supporting visuals only. Figma and Canva must never be treated as production auth, database, private evidence storage, audit log, or dashboard source of truth.

QoL phone tracker closeout: at the end of every run, append exactly one phone-readable row to the native Google Sheet "Senior Capstone QoL Run Tracker" (https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit), spreadsheet ID 1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs, tab "QoL Runs", sheetId 124517328. Use the Google Sheets/Drive connector if available, preferably batchUpdate appendCells, with columns: Timestamp PT, Automation ID, QoL Target, Slot, Status, Accepted MVP Pass, Requirement IDs, Output Kind, Summary, Validation, Commit/PR, Blocker/Next Action, Duration Min, Run Manifest, Notes. Keep Summary, Validation, and Blocker/Next Action compact enough to read on a phone. If the Sheets append fails, retry once; if it is still blocked, do not skip repo closeout--record the exact Google Sheets blocker in the run manifest, run log, and final response.
~~~~
