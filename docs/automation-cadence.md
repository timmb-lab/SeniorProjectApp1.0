# Automation Cadence

Date: 2026-05-19

Bryan deleted the previous Senior Capstone project automation fleet on 2026-05-19 and replaced it with one hourly master-plan-driven orchestrator.

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
Phone tracker: `Senior Capstone QoL Run Tracker` (`https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit`).
Human decision queue: `docs/human-decisions.md`.
Artifact registry: `docs/artifacts.json`.
Contract checker: `scripts/check-automation-contract.ps1`.
Node/npm wrappers: `scripts/run-node-script.ps1` and `scripts/run-npm-script.ps1`.

## Active Automation

| Automation | ID | Schedule PT | Primary output |
| --- | --- | --- | --- |
| Hourly master-plan orchestrator | `senior-capstone-hourly-master-plan-orchestrator` | Once per hour, all day, every day | One bounded master-plan slice per run, selected from `MVP-001` through `MVP-030` by current risk, recent evidence, blockers, and Day 7 alpha priority. |

The orchestrator runs 24 times per day. It replaces the previous thirty single-slot QoL automations, support refresh jobs, seven-category runners, 20x cadence, prototype refresh, and older broad orchestrators for this project.

## Hourly Selection Contract

Every hourly run must:

- Inspect `git status --short --branch` before reading or editing.
- Read `docs/master-plan.md` and `docs/mvp-requirements-catalog.md` before selecting work.
- Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, and `docs/human-decisions.md`.
- Name the master-plan section and requirement IDs that justify the slice.
- Pick exactly one bounded slice from the full catalog, preferring Day 7 alpha blockers and the highest-risk incomplete MVP requirement that can be advanced in the current tool state.
- Rotate from evidence: compare recent manifests, run-log entries, handoffs, dirty-worktree state, and catalog status before choosing the next slice.
- Cover every functional category over time: `requirements-audit`, `backend-security-data`, `student-workflow-evidence`, `staff-review-mentor`, `admin-ops-reporting`, `deployment-qa`, and `design-assets-handoff`.
- Respect the token budget guardrail: read required anchors, then use targeted `rg`, recent manifests, and specific source files instead of broad full-repo wandering.
- Meet the A-material quality bar: land verified MVP progress, repair a repeatable automation/script/checker failure, or commit an exact blocker with requirement IDs, validation, and next action.
- Apply the surface expansion rule: for the selected requirement, decide which surfaces need work or proof across app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.
- Update `docs/mvp-requirements-catalog.md` when status, evidence, blocker, or acceptance checks materially change.
- Update the relevant progress log, `docs/progress/run-log.md`, and one structured manifest in `docs/progress/runs/`.
- Append one compact phone-readable row to the `QoL Runs` tab in the Google Sheet tracker at closeout when the Google Sheets connector is available; otherwise record the exact blocker in repo closeout.
- Update `docs/automation-memory.md`, handoffs, decisions, backlog, artifacts, or human decisions when materially needed.
- Run the self-improvement closeout: record `self-improvement: none` when no prompt/config/script change is justified, or update only this orchestrator prompt/config and the smallest relevant project script when evidence and tool availability justify it.
- Validate touched files with the strongest available checks.
- Commit and push repo changes with a category-appropriate prefix, staging only files touched by the current run.

## Requirement Rotation

The orchestrator prompt explicitly covers all catalog IDs:

- `MVP-001` through `MVP-003`: hosted app boundary, alpha account exception, no real student data.
- `MVP-004` through `MVP-008`: auth, sessions, D1 account records, roles, admin assignment workflows, and required programs.
- `MVP-009` through `MVP-014`: source-framework seed, progress records, student dashboard, proposal/research flow, evidence metadata, and protected evidence access.
- `MVP-015` through `MVP-017`: teacher review, immutable history, mentor workflow, meetings, and presentation risk.
- `MVP-018` through `MVP-023`: admin operations, misc-admin narrowing, audit logs, dashboard aggregates, exports, and announcements.
- `MVP-024` through `MVP-027`: mobile student path, CI, Cloudflare verification, backup/retention/secrets.
- `MVP-028` through `MVP-030`: Figma handoff discipline, Canva asset discipline, and evidence-based 100-pass calibration.

The first two accepted passes each day should usually be implementation-heavy while the Day 7 alpha or `SC-005` remains open. Design, Canva, broad docs, or calibration can be selected when they directly unblock a P0/P1 implementation path or close a concrete handoff.

## Daily And Weekly Goal

The 100-pass target remains evidence-based:

- Minimum: 2 accepted MVP passes per calendar day.
- Stretch: 3 accepted MVP passes per calendar day when unblocked.
- Weekly minimum: 14 accepted MVP passes.
- Weekly stretch: 16-18 accepted MVP passes.
- Cap discipline: do not count more than 100 accepted passes before the MVP is honestly assessed as pilot-ready or not.

Scheduled starts are not accepted passes. An accepted MVP pass must leave durable evidence: a pushed commit or published external artifact recorded in the repo, plus validation or a concrete blocker that reduces MVP ambiguity.

On Sundays, `senior-capstone-hourly-master-plan-orchestrator` reviews the prior seven days of commits, run manifests, run-log entries, backlog movement, handoffs, blockers, accepted-pass count, and requirement coverage, then updates only this project's master plan, memory, and requirements catalog when evidence shows the next week's daily goal or allocation should change.

## 30-Day Efficiency Audit

Run this scorecard during explicit automation audits and Sunday calibration:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30
```

Current hourly scale math:

- 24 active scheduled starts/day.
- 720 active scheduled starts per 30 days.
- Minimum target: 60 accepted MVP passes per 30 days.
- Stretch target: 90 accepted MVP passes per 30 days.
- Required conversion: 8.34 percent for minimum, 12.5 percent for stretch.

Auto-scaling means retargeting requirement focus and acceptance checks from evidence before changing the schedule. If hourly collisions, dirty-worktree contention, or low accepted-pass conversion appear, first sharpen slice selection, blockers, and validation before adding more automations.

## Commit Prefixes

- Requirements + Audit: `audit:`
- Backend Security + Data: `rebuild:`
- Student Workflow + Evidence: `rebuild:`
- Staff Review + Mentor: `rebuild:`
- Admin Ops + Reporting: `rebuild:`
- Deployment QA + CI: `rebuild:`
- Design Assets + Handoff: `figma:` when Figma-heavy, `canva:` when Canva-heavy, otherwise `rebuild:` for repo-only handoff alignment.

## Superseded Project Automations

The hourly orchestrator supersedes all prior Senior Capstone project automation TOMLs, including:

- Thirty `senior-capstone-qol-*` single-slot automations.
- `senior-capstone-public-site-refresh`.
- `senior-capstone-weekly-script-audit`.
- Earlier category runners, standby lanes, daily prototype jobs, and broad orchestrators.

The old concepts are not lost; they are absorbed into the hourly master-plan selection rules above.
