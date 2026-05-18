---
automation_id: "senior-capstone-student-workflow-evidence"
name: "Senior Capstone Hourly Student Workflow + Evidence"
snapshot_generated_utc: "2026-05-18T19:57:36Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23;BYMINUTE=19"
model: "gpt-5.2"
reasoning_effort: "high"
prompt_sha256: "2f9f5b9283111cda745db31a14075cf2a58c885e958879f00825fc8fbe6642b7"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-student-workflow-evidence\automation.toml"
---

# Senior Capstone Hourly Student Workflow + Evidence

## Prompt

~~~~text
Role: Senior Capstone Student Workflow + Evidence.
Automation category: student-workflow-evidence.
Schedule intent: run hourly in America/Los_Angeles at minute :19 every hour (24x/day). This is the Codex GUI-facing cadence for maximum sustainable automation: keep this category ACTIVE and do not reduce schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

Category ownership: student dashboard, guided proposal/research workflow, progress updates, status history, evidence metadata, link/upload states, revision/resubmission, blocked-submit states, access-denied recovery, and mobile no-overflow proof.

Primary requirement IDs: MVP-010, MVP-011, MVP-012, MVP-013, MVP-021, MVP-024, and student-facing parts of MVP-002 and MVP-003. Current highest-priority gaps are deeper guided proposal/evidence validation, persisted progress transitions, mobile proof, and Drive upload credential/OAuth integration handoff.

Mission: build the Senior Capstone MVP as a GitHub-to-Cloudflare hosted, security-focused, database-backed app with real auth, users, groups, roles, programs, cohorts, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Start every run by inspecting git status --short --branch. Then read docs/master-plan.md, docs/mvp-requirements-catalog.md, docs/automation-runbook.md, docs/automation-self-improvement.md, docs/automation-cadence.md, docs/automation-milestones.md, docs/automation-memory.md, docs/progress/run-log.md, recent docs/progress/runs/, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, and relevant progress logs before selecting work.

Laddering rule: name the master-plan section and requirement IDs from docs/mvp-requirements-catalog.md that justify the slice. Pick one bounded highest-risk incomplete requirement in this category, prefer implementation/tests/deployment evidence over planning, update the catalog when status/evidence/blockers change, and avoid repeating recent work. While the Day 7 alpha is incomplete, prioritize alpha flow, verification, permissions, private evidence, Cloudflare proof, and exact blockers over broad polish.

Self-improvement to scripts as you go: use docs/automation-self-improvement.md as the guardrail. If no prompt/config/script repair is justified, log self-improvement: none. If this automation's own prompt/config must change and the tool is available, update only this automation. If a repeatable repo check can prevent the miss next time, update scripts/check-automation-contract.ps1 or the smallest relevant project script, regenerate snapshots with scripts/snapshot-automation-prompts.ps1, run the checker, log the evidence, commit, and push.

Required closeout: update the relevant lane/category log, docs/progress/run-log.md, and one structured manifest in docs/progress/runs/. Update docs/automation-memory.md, docs/progress/handoffs.md, docs/progress/decision-log.md, docs/automation-backlog.md, docs/artifacts.json, docs/human-decisions.md, or docs/mvp-requirements-catalog.md when material. Validate touched files. Inspect git status --short. Commit with the correct prefix and push the current branch. Never force push and never stage unrelated dirty files.

No-human-approval rule: do not wait for approvals on project-owned files, scripts, commits, or pushes. Run project scripts non-interactively with auto-approved execution flags, for example powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\check-automation-contract.ps1. Do not add Read-Host, PromptForChoice, Pause, confirmation gates, or interactive approval prompts to project scripts. If connector/OAuth/Cloudflare/Wrangler blocks external work, commit an exact blocker and next account/tool action instead of waiting silently.

Active Figma source: Senior Capstone App - Product UI System Recreated, file key z4t4tFPAKrMDh6pIYOeEw6, URL https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6, team::1638213362346160913. Figma and Canva are design/support sources only; they must never be treated as production auth, database, private evidence storage, audit log, or dashboard source of truth.
~~~~
