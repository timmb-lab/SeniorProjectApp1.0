---
automation_id: "senior-capstone-qol-account-lifecycle-2"
name: "Senior Capstone QoL - Account Lifecycle"
snapshot_generated_utc: "2026-05-18T23:11:22Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=6,14,22;BYMINUTE=27"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "f89cdec02d48663b964c6fabfb7c25f072b753b2eeddc2d03b71ed624706d462"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-account-lifecycle-2\automation.toml"
---

# Senior Capstone QoL - Account Lifecycle

## Prompt

~~~~text
Role: Senior Capstone QoL - Account Lifecycle.
Automation category: backend-security-data.
Schedule intent: run 3x/day in America/Los_Angeles at 06:27, 14:27, 22:27. This is one individual QoL automation in the rebuilt Senior Capstone set. Keep this automation ACTIVE and do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

QoL target: account lifecycle, invitations/imports, password reset, credential rotation, session expiry, role assignments, and default-deny permissions.
Primary requirement IDs: MVP-004, MVP-005, MVP-006, MVP-007, MVP-020, MVP-027.
Current priority: Implement or verify invitation/import, password reset, credential rotation, disabled/reset-required states, session expiry, role-scope denial tests, and audit events.

Mission: build the Senior Capstone MVP as a GitHub-to-Cloudflare hosted, security-focused, database-backed app with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work.

Token budget guardrail: stay narrow. Read only relevant sections, prefer rg and recent/tail log reads, and avoid broad repo scans unless validating a concrete acceptance check. Pick one bounded QoL slice for this automation's target.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick the highest-risk incomplete sub-slice, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work.

A-material quality bar: every productive run must either land a verified MVP implementation slice, improve a project automation/script/checker that prevents repeat failure, or commit an exact blocker. Include acceptance evidence, requirement IDs, validation commands, and next action. Only touch automation related to this project when doing automation maintenance.

Surface expansion rule: for the selected requirement slice, explicitly decide which surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run scripts/check-automation-contract.ps1, log evidence, commit, and push.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively. Prefer npm run automation:snapshot, npm run check:automation, and npm run check:automation:live when npm is available. If npm is unavailable but node is available, invoke node scripts/run-powershell-script.mjs scripts/snapshot-automation-prompts.ps1, node scripts/run-powershell-script.mjs scripts/check-automation-contract.ps1, or node scripts/run-powershell-script.mjs scripts/check-automation-contract.ps1 -RequireLive. Use -RequireLive / npm run check:automation:live only when auditing live Codex GUI/local registry health; otherwise the default checker can validate repo prompt snapshots when live TOMLs are unavailable. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. The manifest must include requirement_ids, accepted_mvp_pass, duration_minutes, output_kind, automation_efficiency.duplicate_scope_checked, and automation_efficiency.scale_signal. For explicit automation audits, Sunday calibration, repeated blockers, or collision/yield concerns, run node scripts/run-powershell-script.mjs scripts/measure-automation-efficiency.ps1 -RepoRoot . -Days 30; when saving a durable scorecard, add -OutputPath docs/audits/<scorecard-name>.json rather than putting a non-manifest JSON in docs/progress/runs/. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Canva support assets are supporting visuals only. Figma and Canva must never be treated as production auth, database, private evidence storage, audit log, or dashboard source of truth.
~~~~
