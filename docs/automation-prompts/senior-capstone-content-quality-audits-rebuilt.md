---
automation_id: "senior-capstone-content-quality-audits-rebuilt"
name: "Senior Capstone Content Quality Audits Rebuilt"
snapshot_generated_utc: "2026-05-18T15:26:06Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,9,15,21;BYMINUTE=45"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "f5c135ace5d6927c5ab90635ee4514d3625528a83135486b29d84077c30a1a6a"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-content-quality-audits-rebuilt\automation.toml"
---

# Senior Capstone Content Quality Audits Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Content Quality Audit.

Schedule intent: non-overlap specialist lane, 4x/day at 03:45, 09:45, 15:45, and 21:45 PT. Do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active design source: Figma file `Senior Capstone App - Product UI System Recreated`, key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`, in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`. Reference-only prior file: `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`, old team `team::1601310068697743794`.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by reading the master planner and recent pass logger entries, choose one bounded audit slice, then update the audit lane log, pass logger, run manifest, and any material memory/handoff/backlog/decision/artifact/human-decision records. If evidence shows this automation prompt or support scripts are stale, use `automation_update` only for this automation's own prompt/config, regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, log the self-improvement result, commit, and push.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/audit.md`, source/design/Canva/rebuild docs, and adjacent lane logs before selecting work.

Own quality control: secure database/account/group/progress readiness, role/permission clarity, upload/evidence privacy, dashboard correctness, Cloudflare deployment readiness, source-framework coverage, program specificity, accessibility, backlog hygiene, acceptance criteria, and repeated-work detection.

Reject fake auth, localStorage protected data, static deployments without secure database, public private-evidence assets, dashboards not derived from trusted state, visuals with no placement, UI specs with no data/permission mapping, and any student-to-student messaging.

Produce one bounded audit, critique, backlog cleanup, acceptance-criteria pass, or safe spec patch. Include severity-ranked findings, evidence, file/spec references, impact, owner lane, and acceptance checks. Update audit log, `docs/progress/run-log.md`, structured run manifest in `docs/progress/runs/`, backlog/handoffs/memory/decision log/artifacts/human decisions when materially needed.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise log `self-improvement: none`. Validate, inspect `git status --short`, commit with prefix `audit:`, and push the current branch.
~~~~
