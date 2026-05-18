# Automation Cadence

Date: 2026-05-18

Bryan explicitly reset the Senior Capstone automation setup on 2026-05-18, then explicitly tuned the cadence the same day. The prior project automations were deleted from the active local automation set and replaced with seven MVP requirement category runners. The current production cadence is a 20x/day Senior Capstone system in America/Los_Angeles, distributed across the seven categories by risk with no shared scheduled start.

End goal: a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a secure database-backed operating system with users, groups, roles, programs, cohorts, progress updates, submissions, private evidence, reviews, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records.

Master plan: `docs/master-plan.md`.
MVP requirements catalog: `docs/mvp-requirements-catalog.md`.
Shared runbook: `docs/automation-runbook.md`.
Shared memory: `docs/automation-memory.md`.
Cross-lane run log: `docs/progress/run-log.md`.
Cross-lane handoffs: `docs/progress/handoffs.md`.
Decision log: `docs/progress/decision-log.md`.
Milestones: `docs/automation-milestones.md`.
Self-improvement protocol: `docs/automation-self-improvement.md`.
Prompt snapshots: `docs/automation-prompts/`.
Structured run manifests: `docs/progress/runs/`.
Human decision queue: `docs/human-decisions.md`.
Artifact registry: `docs/artifacts.json`.
Contract checker: `scripts/check-automation-contract.ps1`.

## Active Category Automations

| Category | Automation ID | Schedule PT | RRULE | Primary output |
| --- | --- | --- | --- | --- |
| Requirements + Audit | `senior-capstone-mvp-requirements-audit` | `00:03`, `12:03`, `23:03` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,12,23;BYMINUTE=03` | Requirement catalog, backlog hygiene, accepted-pass count, weekly calibration. |
| Backend Security + Data | `senior-capstone-backend-security-data` | `01:15`, `07:15`, `13:15`, `19:15` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,7,13,19;BYMINUTE=15` | Auth, users, groups, roles, permissions, D1 schema, server authorization. |
| Student Workflow + Evidence | `senior-capstone-student-workflow-evidence` | `02:27`, `08:27`, `14:27`, `20:27` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=2,8,14,20;BYMINUTE=27` | Student dashboard, proposal/research, progress, evidence metadata, mobile student path. |
| Staff Review + Mentor | `senior-capstone-staff-review-mentor` | `03:39`, `10:39`, `18:39` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,10,18;BYMINUTE=39` | Teacher review, revision, approval, comments, mentor meetings, presentation scheduling. |
| Admin Ops + Reporting | `senior-capstone-admin-ops-reporting` | `04:51`, `15:51` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=4,15;BYMINUTE=51` | Admin provisioning, deadlines/templates, announcements, exports, audit views, misc-admin narrowing. |
| Deployment QA + CI | `senior-capstone-deployment-qa` | `06:03`, `17:03` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=6,17;BYMINUTE=03` | Cloudflare preview/prod proof, CI, smoke tests, secrets/env checks, backup/readiness notes. |
| Design Assets + Handoff | `senior-capstone-design-assets-handoff` | `09:39`, `21:39` | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=9,21;BYMINUTE=39` | Figma implementation specs, Canva supporting imagery, component/state handoffs, guided prototype. |

This creates 20 Senior Capstone starts per day across the project, weighted toward backend/security and student workflow while preserving all seven categories. The start slots are staggered with no exact overlaps and at least 30 minutes between starts. Each runner must keep its own slice bounded, favor implementation or verification evidence, and must not overwrite unrelated dirty work. If the worktree is dirty because another category run is still closing, the runner should classify the dirty files, avoid staging unrelated changes, and either pick a non-conflicting read-only/verification slice or record a compact committed blocker.

## Shared Operating Contract

Every category automation must:

- Inspect `git status --short --branch` before reading or editing.
- Read `docs/master-plan.md` and `docs/mvp-requirements-catalog.md` before selecting work.
- Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, and the relevant lane/category logs.
- Name the master-plan section and requirement IDs that justify the slice.
- Choose one bounded slice from its category, preferring P0/P1 MVP gaps and Day 7 alpha work while the alpha is incomplete.
- Meet the A-material quality bar: land verified MVP progress, repair a repeatable automation/script/checker failure, or commit an exact blocker with requirement IDs, validation, and next action.
- Apply the surface expansion rule: for the selected requirement, decide which surfaces need work or proof across app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.
- Update `docs/mvp-requirements-catalog.md` when status, evidence, blocker, or acceptance checks materially change.
- Update the relevant progress log, `docs/progress/run-log.md`, and one structured manifest in `docs/progress/runs/`.
- Update `docs/automation-memory.md`, handoffs, decisions, backlog, artifacts, or human decisions when materially needed.
- Run the self-improvement closeout: record `self-improvement: none` when no prompt/config/script change is justified, or update only its own prompt/config and the smallest relevant project script when evidence and tool availability justify it.
- If automation prompts/configs changed, regenerate `docs/automation-prompts/` with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, and run the checker.
- Validate touched files with the strongest available checks.
- Commit and push repo changes with a category-appropriate prefix, staging only files touched by the current run.

No-Human-Approval Script Rule:

- Do not end with local-only repo changes.
- Run project scripts non-interactively with `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\<script-name>.ps1`.
- Project scripts in `scripts/` must not use `Read-Host`, `PromptForChoice`, `Pause`, `prompt()`, `confirm()`, `readline`, `inquirer`, stdin waits, or ad hoc confirmation gates.
- If a connector, OAuth scope, Cloudflare auth, Wrangler, or external policy blocks the task, write a committed blocker with the exact next account/tool action instead of waiting silently.

## Category Ownership

Requirements + Audit owns:
- `docs/mvp-requirements-catalog.md`, weekly goal calibration, accepted-pass count, backlog hygiene, source-framework coverage, anti-drift review, and no-real-student-data checks.

Backend Security + Data owns:
- Hardened auth, sessions, first-admin bootstrap, users, groups, roles, permissions, program/cohort records, D1 schema/migrations, seed loaders, server authorization, and protected-record access checks.

Student Workflow + Evidence owns:
- Student dashboard, guided proposal/research workflow, progress updates, evidence metadata/linking, blocked-submit states, revision/resubmission path, mobile student path, and student-facing audit/activity visibility.

Staff Review + Mentor owns:
- Program teacher queue, submission detail, comments, revision requests, approvals, immutable review history, mentor assigned-student views, mentor meetings, presentation scheduling, conflicts, and attendance/check-in states.

Admin Ops + Reporting owns:
- Admin account/group/program/cohort operations, deadlines/templates, announcements, overrides, export/archive lifecycle, audit-log views, misc-admin reporting scope, and redaction rules.

Deployment QA + CI owns:
- GitHub-to-Cloudflare deployment proof, Pages/D1 binding verification, CI, smoke tests, mobile/browser QA, environment/secrets checks, backup/restore notes, and exact deployment blockers.

Design Assets + Handoff owns:
- Active Figma product UI source `z4t4tFPAKrMDh6pIYOeEw6`, guided prototype, route/data/permission specs, shared component/state handoffs, Canva supporting image specs, and implementation-ready annotations. It must not treat Figma or Canva as production data.

## Daily And Weekly Goal

The 100-pass target remains evidence-based:

- Minimum: 2 accepted MVP passes per calendar day.
- Stretch: 3 accepted MVP passes per calendar day when unblocked.
- Weekly minimum: 14 accepted MVP passes.
- Weekly stretch: 16-18 accepted MVP passes.
- Cap discipline: do not count more than 100 accepted passes before the MVP is honestly assessed as pilot-ready or not.

The `requirements-audit` category owns weekly calibration. On Sundays, it reviews the prior seven days of commits, run manifests, run-log entries, backlog movement, handoffs, and blockers, then updates only this project's master plan, memory, and requirements catalog when evidence shows the next week's daily goal or category allocation should change.

## Commit Prefixes

- Requirements + Audit: `audit:`
- Backend Security + Data: `rebuild:`
- Student Workflow + Evidence: `rebuild:`
- Staff Review + Mentor: `rebuild:`
- Admin Ops + Reporting: `rebuild:`
- Deployment QA + CI: `rebuild:`
- Design Assets + Handoff: `figma:` when Figma-heavy, `canva:` when Canva-heavy, otherwise `rebuild:` for repo-only handoff alignment.

## Deleted Prior Project Automations

The category reset supersedes these prior local automation TOMLs:

- `senior-capstone-canva-visual-system-rebuilt`
- `senior-capstone-content-quality-audits-rebuilt`
- `senior-capstone-daily-automation-report-rebuilt`
- `senior-capstone-daily-guided-prototype-refresh`
- `senior-capstone-figma-product-design-rebuilt`
- `senior-capstone-rebuild-rebuilt`
- `senior-capstone-weekly-deep-audit-rebuilt`

The old concepts are not lost; they are absorbed into the seven requirement categories above.
