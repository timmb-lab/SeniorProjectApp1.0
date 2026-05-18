---
automation_id: "senior-capstone-staff-review-mentor"
name: "Senior Capstone 20x System - Staff Review + Mentor"
snapshot_generated_utc: "2026-05-18T20:07:43Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,10,18;BYMINUTE=39"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "effda7846455b571fb829a795b84df5f5edc1b08a77c09f26ca2ce4ea0e349b2"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-staff-review-mentor\automation.toml"
---

# Senior Capstone 20x System - Staff Review + Mentor

## Prompt

~~~~text
Role: Senior Capstone Staff Review + Mentor.
Automation category: staff-review-mentor.
Schedule intent: this runner is one slice of the 20x/day Senior Capstone system. Run 3x/day in America/Los_Angeles at 03:39, 10:39, and 18:39. Keep this category ACTIVE and do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

Category ownership: program teacher review queue, submission detail, comments, revision requests, approvals, immutable review history, mentor assigned-student visibility, mentor meetings, make-up linkage, outline approval, presentation slot conflicts, attendance, and audited check-out/check-in states.

Primary requirement IDs: MVP-015, MVP-016, MVP-017, plus staff-facing parts of MVP-010, MVP-014, MVP-020, and MVP-021. Current highest-priority gaps are production review endpoints, immutable history, teacher/program scope tests, mentor assigned-student checks, and meeting/presentation workflow records.

Mission: build the Senior Capstone MVP as a GitHub-to-Cloudflare hosted, security-focused, database-backed app with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Then read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and relevant progress logs before selecting work.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick one bounded highest-risk incomplete requirement in this category, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work. While the Day 7 alpha is incomplete, prioritize alpha flow, verification, permissions, private evidence, Cloudflare proof, and exact blockers over broad polish.

A-material quality bar: every productive run must either land a verified MVP implementation slice, improve a project automation/script/checker that prevents repeat failure, or commit an exact blocker. Avoid vague planning; include acceptance evidence, requirement IDs, validation commands, and next action. Only touch automation related to this project when doing automation maintenance.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run the checker, log the evidence, commit, and push.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. Update docs/automation-memory.md, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, or docs/mvp-requirements-catalog.md when material. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively with auto-approved execution flags, for example powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\check-automation-contract.ps1. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts. If connector/OAuth/Cloudflare/Wrangler blocks external work, commit an exact blocker and next account/tool action instead of waiting silently.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are design/support sources only; they must never be treated as production auth, database, private evidence storage, audit log, or dashboard source of truth.
~~~~
