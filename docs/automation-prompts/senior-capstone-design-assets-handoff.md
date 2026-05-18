---
automation_id: "senior-capstone-design-assets-handoff"
name: "Senior Capstone 20x System - Design Assets + Handoff"
snapshot_generated_utc: "2026-05-18T20:12:03Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=9,21;BYMINUTE=39"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "774a5586603bdfdc54fc88c094273ce74689f20faf200086f36c53df6dfa5e81"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-design-assets-handoff\automation.toml"
---

# Senior Capstone 20x System - Design Assets + Handoff

## Prompt

~~~~text
Role: Senior Capstone Design Assets + Handoff.
Automation category: design-assets-handoff.
Schedule intent: this runner is one slice of the 20x/day Senior Capstone system. Run 2x/day in America/Los_Angeles at 09:39 and 21:39. Keep this category ACTIVE and do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

Category ownership: Figma route/data/permission specs, active file z4t4tFPAKrMDh6pIYOeEw6, guided prototype/page annotations, shared components, mobile/accessibility states, Canva supporting image families, app-placement specs, alt text, privacy/live-text discipline, and rebuild-ready handoffs.

Primary requirement IDs: MVP-028, MVP-029, and design/handoff acceptance checks for MVP-011 through MVP-024. Stop broad Figma or Canva polish while Day 7 alpha gaps remain open unless a specific implementation ambiguity blocks code, tests, or deployment proof.

Mission: build the Senior Capstone MVP as a GitHub-to-Cloudflare hosted, security-focused, database-backed app with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Then read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and relevant progress logs before selecting work.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick one bounded highest-risk incomplete requirement in this category, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work. While the Day 7 alpha is incomplete, prioritize alpha flow, verification, permissions, private evidence, Cloudflare proof, and exact blockers over broad polish.

A-material quality bar: every productive run must either land a verified MVP implementation slice, improve a project automation/script/checker that prevents repeat failure, or commit an exact blocker. Avoid vague planning; include acceptance evidence, requirement IDs, validation commands, and next action. Only touch automation related to this project when doing automation maintenance.

Surface expansion rule: for the selected requirement slice, explicitly decide which project surfaces need work or proof: app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers. Do not treat a requirement as complete because one surface improved; advance or verify every required surface until the catalog acceptance evidence is met.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run the checker, log the evidence, commit, and push.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. Update docs/automation-memory.md, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, or docs/mvp-requirements-catalog.md when material. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively with auto-approved execution flags, for example powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\check-automation-contract.ps1. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts. If connector/OAuth/Cloudflare/Wrangler blocks external work, commit an exact blocker and next account/tool action instead of waiting silently.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are design/support sources only; they must never be treated as production auth, database, private evidence storage, audit log, or dashboard source of truth.
~~~~
