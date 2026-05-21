# Automation Cadence

Date: 2026-05-20

Current active model name: quarter-hour split-builder cadence.

The Senior Capstone project now uses four active hourly builder instances across two lanes, staggered so one builder starts every 15 minutes, plus daily and weekly oversight. Old single-builder cadence is retired. Bryan explicitly approved the quarter-hour builder capacity model on 2026-05-20. The older same-minute duplicate split model has been replaced by:

- Minute 0 PT: non-Figma MVP builder instance 1.
- Minute 15 PT: Figma-only product builder instance 1.
- Minute 30 PT: non-Figma MVP builder instance 2.
- Minute 45 PT: Figma-only product builder instance 2.

Combined builder capacity is scheduled capacity, not guaranteed successful completed changes: 48 + 48 = 96 scheduled builder runs per day, and 1,440 + 1,440 = 2,880 scheduled builder runs per 30 days. Oversight automations report and recalibrate from evidence; they are not builder capacity.

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
Structured run manifests: `docs/progress/runs/`.
Phone tracker: `Senior Capstone QoL Run Tracker` (`https://docs.google.com/spreadsheets/d/1J8jQMn85wJwo9Rh6LjQUVv_WfLS1YJWsbpcLBCojjjs/edit`).
Human decision queue: `docs/human-decisions.md`.
Artifact registry: `docs/artifacts.json`.
Cadence verifier: `scripts/verify-cadence-30min.ps1`.
Node/npm wrappers: `scripts/run-node-script.ps1` and `scripts/run-npm-script.ps1`.
Builder prompts: `automation/prompts/senior-capstone-nonfigma-mvp-builder.md` and `automation/prompts/senior-capstone-figma-product-builder.md`.
Oversight prompts: `automation/prompts/senior-capstone-daily-mvp-summary.md` and `automation/prompts/senior-capstone-weekly-script-audit.md`.

## Active Automation

| Automation | ID | Schedule PT | Primary output |
| --- | --- | --- | --- |
| Non-Figma MVP Builder 1 | `senior-capstone-nonfigma-mvp-builder` | Hourly at minute 0 | One bounded non-Figma MVP implementation, validation, deployment, docs, Canva-only, automation-hardening, or exact blocker slice. |
| Figma Product Builder 1 | `senior-capstone-figma-product-builder-15` | Hourly at minute 15 | Separate GUI-visible duplicate of the working Figma product builder prompt, with the same Figma-only scope and start safety. |
| Non-Figma MVP Builder 2 | `senior-capstone-nonfigma-mvp-builder-30` | Hourly at minute 30 | Separate GUI-visible duplicate of the working non-Figma builder prompt, with the same lane scope and start safety. |
| Figma Product Builder 2 | `senior-capstone-figma-product-builder` | Hourly at minute 45 | One bounded Figma-only product design, state variant, route/data/permission handoff, screenshot/metadata verification, or exact Figma blocker. |
| Daily MVP Summary | `senior-capstone-daily-mvp-summary` | Daily at 8:00 AM PT | Report-only summary of the last 24 hours. |
| Weekly Strategy Review | `senior-capstone-weekly-script-audit` | Sundays at 6:00 PM PT | Evidence-based weekly review and plan/catalog/memory/backlog adjustment. |

The legacy `senior-capstone-hourly-qol-orchestrator` ID is replaced as the active builder. It may remain in the repo only as a diagnostic/manual QoL runner through `automation/qol/doctor.mjs` and `automation/qol/hourly-orchestrator.mjs`; it must not be counted as active builder capacity.

## Split Builder Contract

- Combined capacity is now 96 scheduled starts/day.
- Non-Figma builder runs 48/day across two GUI-visible instances.
- Figma builder runs 48/day across two GUI-visible instances.
- Daily summary and weekly review are oversight, not builder capacity.
- Accepted passes require durable evidence.
- Figma-only accepted passes require a functional handoff, state variant, route/data/permission annotation, screenshot/metadata verification, or exact blocker evidence.
- Broad Figma polish does not count.
- Broad docs churn does not count.
- Reports alone do not count.
- Wrong-lane work does not count.
- No-verification work does not count.
- Uncommitted file changes do not count.
- Unproven scheduler claims do not count.
- Each builder must commit/push when possible.

Each builder must:

- Inspect `git status --short --branch` before reading or editing.
- Read its required source docs before selecting work.
- Pick exactly one bounded slice.
- Update the relevant progress log, `docs/progress/run-log.md`, and one structured manifest in `docs/progress/runs/`.
- Update `docs/mvp-requirements-catalog.md` when status, evidence, blocker, owner category, or acceptance checks materially change.
- Update `docs/automation-memory.md`, handoffs, decisions, backlog, artifacts, or human decisions when materially needed.
- Validate touched files with the strongest safe checks.
- Commit and push repo changes with the lane-appropriate prefix, staging only files touched by that run.

## Requirement Rotation

The non-Figma builder owns `MVP-001` through `MVP-027`, `MVP-029`, and `MVP-030` except direct Figma work:

- `MVP-001` through `MVP-003`: hosted app boundary, alpha account exception, no real student data.
- `MVP-004` through `MVP-008`: auth, sessions, D1 account records, roles, admin assignment workflows, and required programs.
- `MVP-009` through `MVP-014`: source-framework seed, progress records, student dashboard, proposal/research flow, evidence metadata, and protected evidence access.
- `MVP-015` through `MVP-017`: teacher review, immutable history, mentor workflow, meetings, and presentation risk.
- `MVP-018` through `MVP-023`: admin operations, misc-admin narrowing, audit logs, dashboard aggregates, exports, and announcements.
- `MVP-024` through `MVP-027`: mobile student path, CI, Cloudflare verification, backup/retention/secrets.
- `MVP-029`: Canva supporting assets when no Figma work is required.
- `MVP-030`: evidence-based 100-pass calibration, daily summary, weekly review, and automation health.

The Figma builder owns `MVP-028` and may support other MVPs only through design handoffs tied to concrete implementation ambiguity:

- functional state variants
- route/data/permission annotations
- component variant inventories
- screenshot or metadata verification
- exact Figma blocker records
- implementation-ready handoffs for `MVP-004` through `MVP-027`

Canva work stays outside the Figma-only lane unless the Figma lane is documenting placement or relationship to a Figma handoff. Figma is not production data, a working backend, a secure evidence store, or the source of truth for student records.

## Daily And Weekly Goal

The 100-pass target remains evidence-based:

- Minimum: 2 accepted MVP passes per calendar day.
- Stretch: 3 accepted MVP passes per calendar day when unblocked.
- Weekly minimum: 14 accepted MVP passes.
- Weekly stretch: 16-18 accepted MVP passes.
- Cap discipline: do not count more than 100 accepted passes before the MVP is honestly assessed as pilot-ready or not.

Scheduled starts are not accepted passes. An accepted MVP pass must leave durable evidence: a pushed commit or published external artifact recorded in the repo, plus validation or a concrete blocker that reduces MVP ambiguity.

Each morning, `senior-capstone-daily-mvp-summary` reports what actually changed in the prior 24 hours. On Sundays, `senior-capstone-weekly-script-audit` reviews the prior seven days of commits, run manifests, run-log entries, backlog movement, handoffs, blockers, accepted-pass count, and requirement coverage, then updates only this project's plan/memory/catalog/backlog records when evidence shows the next week's daily goal or allocation should change.

## Cadence Verification

Run this verifier during explicit automation audits and Sunday calibration:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\verify-cadence-30min.ps1 -RepoRoot .
```

Current quarter-hour split-builder scale math:

- 48 non-Figma starts/day.
- 48 Figma starts/day.
- 96 combined starts/day.
- 48 + 48 = 96 scheduled builder runs per day.
- 1,440 non-Figma starts/30 days.
- 1,440 Figma starts/30 days.
- 2,880 combined starts/30 days.
- 1,440 + 1,440 = 2,880 scheduled builder runs per 30 days.
- Minimum target: 60 accepted MVP passes per 30 days.
- Stretch target: 90 accepted MVP passes per 30 days.
- Required conversion: 2.08 percent for minimum, 3.13 percent for stretch.

Auto-scaling means retargeting requirement focus, lane separation, blockers, and acceptance checks from evidence before changing the schedule. If quarter-hour handoff collisions, dirty-worktree contention, or low accepted-pass conversion appear, first sharpen slice selection, blockers, validation, and handoffs before adding more automations.

## External Scheduler Handling

Repo validation enforces prompt, lock, docs, and verifier truth. It does not prove the external Codex scheduler has been changed unless a repo-local scheduler config exists and was updated, or direct scheduler evidence is inspected in the current run.

No repo-local scheduler manifest currently controls the external scheduler. Bryan approved this external scheduler change on 2026-05-20. Keep the external scheduler aligned with this repo-local truth:

1. Create or update `senior-capstone-nonfigma-mvp-builder` to run hourly at minute 0 PT.
2. Create or update `senior-capstone-figma-product-builder-15` to run hourly at minute 15 PT with an exact copy of the working Figma prompt body.
3. Create or update `senior-capstone-nonfigma-mvp-builder-30` to run hourly at minute 30 PT with an exact copy of the working non-Figma prompt body.
4. Create or update `senior-capstone-figma-product-builder` to run hourly at minute 45 PT.
5. Disable `senior-capstone-hourly-qol-orchestrator` as recurring or keep it absent/manual diagnostic only.
6. Keep daily and weekly oversight active.
7. Do not collapse the four rows into a single every-15-minute automation.

Preserve GUI visibility, project binding, cwd, enabled status, and the quarter-hour 0 / 15 / 30 / 45 split-builder cadence. The superseded `senior-capstone-figma-product-builder-top` and `senior-capstone-nonfigma-mvp-builder-bottom` rows are paused scheduler history, not active builder capacity.

## Commit Prefixes

- Requirements + Audit: `audit:`
- Backend Security + Data: `rebuild:`
- Student Workflow + Evidence: `rebuild:`
- Staff Review + Mentor: `rebuild:`
- Admin Ops + Reporting: `rebuild:`
- Deployment QA + CI: `rebuild:`
- Figma-only Product Builder: `figma:`
- Canva-only support work: `canva:`
- Repo-local cadence/docs hardening: `audit:` or `docs:`
