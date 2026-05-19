# Automation Cadence

Date: 2026-05-18

Bryan explicitly reset the Senior Capstone automation setup on 2026-05-18, then explicitly rebuilt it again as a focused QoL system. All prior project automation TOMLs are deleted. The current production cadence is the full QoL timeline: thirty GUI-managed single-slot Senior Capstone QoL automations are active, three per QoL target, each with one daily start in America/Los_Angeles. The brief May 19 burn-down pause is superseded because Bryan clarified that the QoL timeline should keep multiple daily passes active.

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
Npm/CI wrapper: `scripts/run-powershell-script.mjs`.

## QoL Automation Registry

Current active QoL starts are all rows from `00:03` through `23:15` PT. Slot 1, Slot 2, and Slot 3 are all active so every QoL target gets three daily passes. The two support automations are intentionally outside the 30-start QoL grid and are checked against a separate 20-minute support spacing budget: public-site refresh runs at `06:03` PT every three days, and weekly script audit runs Sundays at `23:39` PT.

| QoL target | Automation ID | Schedule PT | Primary output |
| --- | --- | --- | --- |
| Source framework seed | `senior-capstone-qol-source-framework-seed-2` | `00:03` | Source-framework loader, requirement/deadline/check records, catalog drift control. |
| Drive upload OAuth | `senior-capstone-qol-drive-upload-oauth-2` | `00:51` | Google Drive upload credentials/OAuth, evidence metadata, provider states. |
| Protected evidence tests | `senior-capstone-qol-protected-evidence-tests-2` | `01:39` | Private evidence permissions, denied-access audit events, protected-record tests. |
| Teacher review endpoints | `senior-capstone-qol-teacher-review-endpoints-2` | `02:27` | Teacher queue/detail endpoints, comments, revision, approval, status history. |
| Immutable review history | `senior-capstone-qol-immutable-review-history-2` | `03:15` | Submission versions, immutable reviews/comments, destructive-overwrite prevention. |
| Mentor presentation flow | `senior-capstone-qol-mentor-presentation-flow-2` | `04:03` | Mentor scope, meeting attendance, outline gates, presentation slots, conflicts. |
| Admin ops endpoints | `senior-capstone-qol-admin-ops-endpoints-2` | `04:51` | Admin operations, overrides, deadlines/templates, exports, audit redaction. |
| Announcements | `senior-capstone-qol-announcements-2` | `05:39` | Staff/admin announcements without student messaging. |
| Account lifecycle | `senior-capstone-qol-account-lifecycle-2` | `06:27` | Invitations/imports, password reset, credential rotation, sessions, role scopes. |
| Cloudflare verification | `senior-capstone-qol-cloudflare-verification-2` | `07:15` | Post-push Pages/D1/env verification, CI, smoke checks, secrets, blockers. |
| Source framework seed | `senior-capstone-qol-source-framework-seed-slot-2` | `08:03` | Source-framework loader, requirement/deadline/check records, catalog drift control. |
| Drive upload OAuth | `senior-capstone-qol-drive-upload-oauth-slot-2` | `08:51` | Google Drive upload credentials/OAuth, evidence metadata, provider states. |
| Protected evidence tests | `senior-capstone-qol-protected-evidence-tests-slot-2` | `09:39` | Private evidence permissions, denied-access audit events, protected-record tests. |
| Teacher review endpoints | `senior-capstone-qol-teacher-review-endpoints-slot-2` | `10:27` | Teacher queue/detail endpoints, comments, revision, approval, status history. |
| Immutable review history | `senior-capstone-qol-immutable-review-history-slot-2` | `11:15` | Submission versions, immutable reviews/comments, destructive-overwrite prevention. |
| Mentor presentation flow | `senior-capstone-qol-mentor-presentation-flow-slot-2` | `12:03` | Mentor scope, meeting attendance, outline gates, presentation slots, conflicts. |
| Admin ops endpoints | `senior-capstone-qol-admin-ops-endpoints-slot-2` | `12:51` | Admin operations, overrides, deadlines/templates, exports, audit redaction. |
| Announcements | `senior-capstone-qol-announcements-slot-2` | `13:39` | Staff/admin announcements without student messaging. |
| Account lifecycle | `senior-capstone-qol-account-lifecycle-slot-2` | `14:27` | Invitations/imports, password reset, credential rotation, sessions, role scopes. |
| Cloudflare verification | `senior-capstone-qol-cloudflare-verification-slot-2` | `15:15` | Post-push Pages/D1/env verification, CI, smoke checks, secrets, blockers. |
| Source framework seed | `senior-capstone-qol-source-framework-seed-slot-3` | `16:03` | Source-framework loader, requirement/deadline/check records, catalog drift control. |
| Drive upload OAuth | `senior-capstone-qol-drive-upload-oauth-slot-3` | `16:51` | Google Drive upload credentials/OAuth, evidence metadata, provider states. |
| Protected evidence tests | `senior-capstone-qol-protected-evidence-tests-slot-3` | `17:39` | Private evidence permissions, denied-access audit events, protected-record tests. |
| Teacher review endpoints | `senior-capstone-qol-teacher-review-endpoints-slot-3` | `18:27` | Teacher queue/detail endpoints, comments, revision, approval, status history. |
| Immutable review history | `senior-capstone-qol-immutable-review-history-slot-3` | `19:15` | Submission versions, immutable reviews/comments, destructive-overwrite prevention. |
| Mentor presentation flow | `senior-capstone-qol-mentor-presentation-flow-slot-3` | `20:03` | Mentor scope, meeting attendance, outline gates, presentation slots, conflicts. |
| Admin ops endpoints | `senior-capstone-qol-admin-ops-endpoints-slot-3` | `20:51` | Admin operations, overrides, deadlines/templates, exports, audit redaction. |
| Announcements | `senior-capstone-qol-announcements-slot-3` | `21:39` | Staff/admin announcements without student messaging. |
| Account lifecycle | `senior-capstone-qol-account-lifecycle-slot-3` | `22:27` | Invitations/imports, password reset, credential rotation, sessions, role scopes. |
| Cloudflare verification | `senior-capstone-qol-cloudflare-verification-slot-3` | `23:15` | Post-push Pages/D1/env verification, CI, smoke checks, secrets, blockers. |

This now creates 30 active Senior Capstone QoL starts per day across the project, three per QoL target. The single-slot pattern preserves the reliability fix for multi-BYHOUR scheduling while keeping the intended QoL timeline active. The active QoL start slots are staggered with no exact overlaps and at least 45 minutes between QoL starts. Support jobs are audited separately so they cannot sit directly on top of a QoL start. Each runner must keep its own slice bounded, favor implementation or verification evidence, and must not overwrite unrelated dirty work. If the worktree is dirty because another QoL run is still closing, the runner should classify the dirty files, avoid staging unrelated changes, and either pick a non-conflicting verification slice or record a compact committed blocker.

The original `-2` suffixes are the app-managed GUI Slot 1 automation IDs created after the original direct-file TOMLs were found to be orphaned from the Codex automation app. The `slot-2` and `slot-3` IDs are app-managed single-slot companions added on 2026-05-18 because a single automation with multiple daily BYHOUR values was not reliably firing; they are active again after Bryan clarified on 2026-05-19 that the QoL timeline needs multiple daily runs.

## Shared Operating Contract

Every QoL automation must:

- Inspect `git status --short --branch` before reading or editing.
- Read `docs/master-plan.md` and `docs/mvp-requirements-catalog.md` before selecting work.
- Read `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, and the relevant lane/category logs.
- Name the master-plan section and requirement IDs that justify the slice.
- Choose one bounded slice from its category, preferring P0/P1 MVP gaps and Day 7 alpha work while the alpha is incomplete.
- Respect the token budget guardrail: read the required anchors, then use targeted `rg`, recent manifests, and relevant log sections rather than broad full-file or full-repo reads.
- Meet the A-material quality bar: land verified MVP progress, repair a repeatable automation/script/checker failure, or commit an exact blocker with requirement IDs, validation, and next action.
- Apply the surface expansion rule: for the selected requirement, decide which surfaces need work or proof across app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.
- Update `docs/mvp-requirements-catalog.md` when status, evidence, blocker, or acceptance checks materially change.
- Update the relevant progress log, `docs/progress/run-log.md`, and one structured manifest in `docs/progress/runs/`.
- Append one compact phone-readable row to the `QoL Runs` tab in the Google Sheet tracker at closeout when the Google Sheets connector is available.
- Update `docs/automation-memory.md`, handoffs, decisions, backlog, artifacts, or human decisions when materially needed.
- Run the self-improvement closeout: record `self-improvement: none` when no prompt/config/script change is justified, or update only its own prompt/config and the smallest relevant project script when evidence and tool availability justify it.
- If automation prompts/configs changed, regenerate `docs/automation-prompts/` with `npm run automation:snapshot` or `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, and run `npm run check:automation` or the checker directly. Use `npm run check:automation:live` only when live registry health is the audit target.
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

`senior-capstone-qol-source-framework-seed-2` owns weekly calibration. On Sundays, it reviews the prior seven days of commits, run manifests, run-log entries, backlog movement, handoffs, and blockers, then updates only this project's master plan, memory, and requirements catalog when evidence shows the next week's daily goal or QoL allocation should change.

## 30-Day Efficiency Auto-Scaling Audit

Run this scorecard during explicit automation audits and Sunday calibration:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30
```

Current full-QoL scale math:

- 30 active scheduled starts/day.
- 900 active scheduled starts per 30 days.
- Minimum target: 60 accepted MVP passes per 30 days.
- Stretch target: 90 accepted MVP passes per 30 days.
- Required conversion: 6.67 percent for minimum, 10 percent for stretch.

Auto-scaling means retargeting the next week's QoL focus and acceptance checks from evidence before changing the schedule. The May 18-19 overnight audit still justifies the writable preflight and exact blocker rule, but it no longer justifies pausing Slot 2 or Slot 3 without a fresh user request.

## Commit Prefixes

- Requirements + Audit: `audit:`
- Backend Security + Data: `rebuild:`
- Student Workflow + Evidence: `rebuild:`
- Staff Review + Mentor: `rebuild:`
- Admin Ops + Reporting: `rebuild:`
- Deployment QA + CI: `rebuild:`
- Design Assets + Handoff: `figma:` when Figma-heavy, `canva:` when Canva-heavy, otherwise `rebuild:` for repo-only handoff alignment.

## Deleted Prior Project Automations

The QoL rebuild supersedes these prior local automation TOMLs:

- `senior-capstone-canva-visual-system-rebuilt`
- `senior-capstone-content-quality-audits-rebuilt`
- `senior-capstone-daily-automation-report-rebuilt`
- `senior-capstone-daily-guided-prototype-refresh`
- `senior-capstone-figma-product-design-rebuilt`
- `senior-capstone-rebuild-rebuilt`
- `senior-capstone-weekly-deep-audit-rebuilt`
- `senior-capstone-mvp-requirements-audit`
- `senior-capstone-backend-security-data`
- `senior-capstone-student-workflow-evidence`
- `senior-capstone-staff-review-mentor`
- `senior-capstone-admin-ops-reporting`
- `senior-capstone-deployment-qa`
- `senior-capstone-design-assets-handoff`

The old concepts are not lost; they are absorbed into the ten QoL target groups above.
