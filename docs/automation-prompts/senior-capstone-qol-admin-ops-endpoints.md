---
automation_id: "senior-capstone-qol-admin-ops-endpoints"
name: "Senior Capstone QoL - Admin Ops Endpoints"
snapshot_generated_utc: "2026-05-18T20:29:27Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=4,12,20;BYMINUTE=51"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "dfdceff70cab7f5f854438fc4e4177e031e71a4e3ae8d8657cb7d13e1895d4bf"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-qol-admin-ops-endpoints\automation.toml"
---

# Senior Capstone QoL - Admin Ops Endpoints

## Prompt

~~~~text
Role: Senior Capstone QoL - Admin Ops Endpoints.
Automation category: admin-ops-reporting.
Schedule intent: run 3x/day in America/Los_Angeles at 04:51, 12:51, 20:51. This is one individual QoL automation in the rebuilt Senior Capstone set. Keep this automation ACTIVE and do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

QoL target: admin operations endpoints, deadlines/templates, overrides, audit/activity, exports/archive controls, and redaction.
Primary requirement IDs: MVP-007, MVP-018, MVP-019, MVP-020, MVP-022, MVP-027.

Current priority: Implement or verify admin surfaces/endpoints, override reasons, deadline/template operations, audit redaction, export lifecycle, scoped permissions, and retention notes.

Mission: build the Senior Capstone MVP as a GitHub-to-Cloudflare hosted, security-focused, database-backed app with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Then read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and the relevant progress log before selecting work.

Token budget guardrail: stay narrow. Read only the relevant sections after the required anchors, prefer rg and recent/tail log reads before opening large files, and avoid broad repo scans unless validating a concrete acceptance check. Pick one bounded QoL slice for this automation's target, not a sweeping multi-feature pass.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick the highest-risk incomplete sub-slice for this QoL target, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work.

A-material quality bar: every productive run must either land a verified MVP implementation slice, improve a project automation/script/checker that prevents repeat failure, or commit an exact blocker. Avoid vague planning; include acceptance evidence, requirement IDs, validation commands, and next action. Only touch automation related to this project when doing automation maintenance.

Surface expansion rule: for the selected requirement slice, explicitly decide which project surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers. Do not treat a requirement as complete because one surface improved; advance or verify every required surface until the catalog acceptance evidence is met.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run the checker, log the evidence, commit, and push.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively with auto-approved execution flags, for example powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\check-automation-contract.ps1. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts. If connector/OAuth/Cloudflare/Wrangler blocks external work, commit an exact blocker and next account/tool action instead of waiting silently.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. Update docs/automation-memory.md, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, or docs/mvp-requirements-catalog.md when material. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Canva support assets are supporting visuals only. Figma and Canva must never be treated as production auth, database, private evidence storage, audit log, or dashboard source of truth.
~~~~
