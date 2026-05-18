# Automation Cadence

Date: 2026-05-18

The Senior Capstone rebuild now uses a primary 5x/day gold-standard orchestrator plus one daily guided-prototype refresh. The live app automation `senior-capstone-rebuild-rebuilt` is named `Senior Capstone Gold Standard Orchestrator` and runs every day at `00:20`, `05:20`, `10:20`, `15:20`, and `20:20` PT. It reads the master plan and logs, follows the work ladder, chooses one bounded beta-advancing slice, updates the repo or external artifact, verifies, logs, commits, pushes, and repairs its own prompt/scripts when evidence shows drift.

Specialist lane automations still exist for Figma, Canva, content audit, and daily reporting, but they are intentionally `PAUSED` standby records so the Senior Capstone daily cadence is not a pileup of overlapping lane jobs. Weekly deep audit remains `ACTIVE` as the separate severe weekly review. `senior-capstone-daily-guided-prototype-refresh` is also `ACTIVE` and runs once daily at `22:10` PT to update the multi-frame guided prototype from that day's actual progress and ladder position.

The real daily delivery goal for this project is not five accepted changes every day. The current 100-pass / 45-day target requires at least 2 accepted MVP passes per calendar day, with 3 as the stretch goal when the repo is unblocked. The weekly deep audit recalibrates this project-only daily goal every Sunday from committed evidence and may update `docs/master-plan.md` and `docs/automation-memory.md`; it must not change schedules, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

End goal: a GitHub-to-Cloudflare hosted app whose MVP is a secure database-backed Senior Capstone operating system: users, groups, roles, programs, cohorts, progress updates, submissions, private evidence, reviews, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records.

Master plan: `docs/master-plan.md`.
Shared runbook: `docs/automation-runbook.md`.
Shared memory: `docs/automation-memory.md`.
Cross-lane run log: `docs/progress/run-log.md`.
Cross-lane handoffs: `docs/progress/handoffs.md`.
Decision log: `docs/progress/decision-log.md`.
Shared milestones: `docs/automation-milestones.md`.
Shared curriculum framework: `data/capstone-framework.json` and `docs/curriculum-framework-integration.md`.
Daily reporting notes: `docs/daily-automation-reporting.md`.
Self-improvement protocol: `docs/automation-self-improvement.md`.
Weekly deep audit log: `docs/progress/weekly-deep-audit.md`.
Prompt snapshots: `docs/automation-prompts/`.
Structured run manifests: `docs/progress/runs/`.
Human decision queue: `docs/human-decisions.md`.
Artifact registry: `docs/artifacts.json`.
Contract checker: `scripts/check-automation-contract.ps1`.

## Shared Operating Contract

Every automation should:

- Inspect git status and recently changed files first.
- Inspect the current branch and upstream before changing files.
- If the worktree is clean and an upstream exists, sync with a safe fast-forward pull before editing.
- If the worktree is dirty, do not pull; classify the dirty files and avoid overwriting unrelated work.
- Read `docs/master-plan.md` and name the section that justifies the run's selected slice.
- Read its lane-specific progress log and the other lane logs before choosing work.
- Read `docs/automation-memory.md`, `docs/progress/run-log.md`, `docs/progress/handoffs.md`, and `docs/progress/decision-log.md` before choosing work.
- Read `docs/automation-runbook.md` before selecting work.
- Read `docs/automation-self-improvement.md` before selecting work and again during closeout.
- Read `docs/automation-milestones.md` before selecting work.
- Read `docs/human-decisions.md`, `docs/artifacts.json`, and recent `docs/progress/runs/` manifests when the run touches stack decisions, external artifacts, prompt changes, or repeated-work analysis.
- Read `data/capstone-framework.json` and `docs/curriculum-framework-integration.md` before changing requirement, workflow, dashboard, or source-material behavior.
- Read `docs/automation-backlog.md` when present and choose work from the highest-priority relevant item.
- Check the last two entries in its lane log to avoid repeating the same scope.
- Choose one bounded slice per run.
- Prefer concrete artifacts, patches, specs, validations, or findings over broad brainstorming.
- Preserve user and automation changes from other jobs.
- Validate any files it changes.
- Update its lane-specific progress log with timestamp, scope, changes, verification, risks, and next action.
- Include the master-plan section referenced in the lane progress entry.
- Update `docs/progress/run-log.md` with one compact entry each run.
- Update `docs/automation-memory.md` when active priorities, stack decisions, artifact IDs, blockers, or next-lane priorities changed.
- Update `docs/progress/handoffs.md` for every cross-lane ask and close handoffs only with evidence.
- Update `docs/progress/decision-log.md` for durable decisions future runs should respect.
- Update `docs/automation-progress.md` with only a short rollup when it is safe to do so.
- Create one structured run manifest in `docs/progress/runs/`.
- Update `docs/artifacts.json` for durable external artifacts.
- Update `docs/human-decisions.md` for Bryan-level decisions.
- Run the self-improvement closeout: log `self-improvement: none` when no prompt/config change is justified, or update only its own live automation prompt/config with evidence while preserving schedule, workspace, model, reasoning effort, and status.
- If a live prompt/config changes, regenerate `docs/automation-prompts/` and run `scripts/check-automation-contract.ps1`.
- Satisfy the publication/commit gate in `docs/automation-runbook.md`: pushed repo commit, published external artifact with committed repo handoff, or committed blocker entry.
- Record every external artifact link or ID in a committed lane log, design spec, asset registry, or audit handoff before ending the run.
- If it changes repository files, stage only its own changes, commit with a lane-prefixed message, and push the current branch.
- Never stage unrelated dirty files from the user or another automation.
- If commit or push fails, log the exact blocker and next action instead of silently leaving work behind.
- Inspect `git status --short` before ending and do not leave the automation's own changes untracked or unstaged.
- Hand off work to the right lane instead of crossing ownership boundaries.
- Include a handoff packet whenever another lane needs to act.
- Never force push. If push is rejected, attempt one safe fast-forward sync only after a successful commit and only when the post-commit worktree is clean.

Lane boundaries:

- Figma should be used heavily for product UI specs, app-component direction, role-aware dashboard/admin-preview design, mobile-aware patterns, and database-backed state coverage, but should not own backend implementation.
- Core rebuild owns Cloudflare/GitHub architecture, auth, permissions, database schema, user groups, progress updates, private upload/evidence storage, workflows, and deployment; it should consume Figma/Canva/content outputs instead of inventing visual direction from scratch.
- Canva should be used heavily for stunning supporting images and visual asset families for upload/evidence/review/revision/permission/announcement concepts, but should not define functional app layout or bake live/private data into images.
- Content audits may critique and patch content/specs, but should clearly hand larger work to Figma, Canva, or core rebuild.
- Content audits own unresolved issue triage in `docs/automation-backlog.md`.
- No lane should recreate the source PDFs as static checklist pages when the app can make the same requirement a submission, evidence artifact, review gate, dashboard signal, or export task.

Work priority:

1. P0/P1 issues from audits or `docs/automation-backlog.md`.
2. Secure database/auth/account-group/progress foundation and GitHub-to-Cloudflare deployment work.
3. Earliest incomplete milestone from `docs/automation-milestones.md`.
4. Continuation of the previous lane's explicitly recommended next step.
5. Handoffs from the adjacent lane in the automation cadence.
6. The smallest useful vertical slice or reusable asset/spec in that lane.

Commit message prefixes:

- Figma: `figma:`
- Core rebuild: `rebuild:`
- Content audits: `audit:`
- Canva: `canva:`

Lane-specific progress logs:

- Figma: `docs/progress/figma.md`
- Core rebuild: `docs/progress/rebuild.md`
- Content audits: `docs/progress/audit.md`
- Canva: `docs/progress/canva.md`

Scaling logs:

- Master plan: `docs/master-plan.md`
- Self-improvement protocol: `docs/automation-self-improvement.md`
- Compact current memory: `docs/automation-memory.md`
- Cross-lane run index: `docs/progress/run-log.md`
- Structured run manifests: `docs/progress/runs/`
- Handoff ledger: `docs/progress/handoffs.md`
- Durable decision log: `docs/progress/decision-log.md`
- Human decision queue: `docs/human-decisions.md`
- Artifact registry: `docs/artifacts.json`

The shared `docs/automation-progress.md` is now a rollup file, not the primary scratchpad. This reduces merge conflicts when multiple automations run in the same hour.

Backlog:

- Shared unresolved issue queue: `docs/automation-backlog.md`
- The audit automation owns backlog severity, owner, status, and next-action hygiene.
- Other lanes should read it and may resolve/update their own completed items when safe.
- When a lane picks a backlog item, it should mark it in-progress/resolved/blocked with evidence when safe.

Definition of done for every run:

- One bounded scope selected.
- Artifact, patch, spec, audit, or validation produced.
- Files touched are validated.
- Lane progress log updated.
- Backlog updated when relevant.
- Handoff packet added when another lane must act.
- External artifact links/IDs logged in repo when external tools are used.
- Only own files staged.
- Lane-prefixed commit created when repo files changed.
- Current branch pushed, or blocker logged precisely.

## Primary 5x/Day Gold Standard Orchestrator

Senior Capstone Gold Standard Orchestrator
- Automation: `senior-capstone-rebuild-rebuilt`
- Schedule: every day at `00:20`, `05:20`, `10:20`, `15:20`, and `20:20` PT.
- RRULE: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,5,10,15,20;BYMINUTE=20`
- Purpose: keep upgrading the project from the master plan, backlog, handoffs, decision log, artifacts, and recent run manifests until beta.
- Beta target: hosted GitHub-to-Cloudflare app with secure database-backed users/groups/roles/programs/cohorts, trusted progress state, private evidence/upload metadata, submissions, review/revision/approval, audit events, dashboards, admin controls, tests, and deployment path.
- Run shape: one bounded deliverable per run, with verification, lane log, run log, structured run manifest, material memory/handoff/backlog/decision/artifact updates, self-improvement closeout, commit, and push.
- No-intervention rule: use saved connector approvals when already present, avoid tool calls that would pause for approval, use repo fallbacks for connector/OAuth blockers, and record `ACTION REQUIRED` only for account/legal/budget/school-policy issues that cannot be resolved from the repo.

## Daily Guided Prototype Refresh

Senior Capstone Daily Guided Prototype Refresh
- Automation: `senior-capstone-daily-guided-prototype-refresh`
- Schedule: daily at `22:10` PT, after the `20:20` gold-standard orchestrator pass.
- RRULE: `FREQ=DAILY;BYHOUR=22;BYMINUTE=10`
- Purpose: keep the active Figma page `04 Guided Daily Prototype` current as a clickable guided walkthrough of the day's real repo/app/design progress, current blockers, and next ladder step.
- Active Figma target: `Senior Capstone App - Product UI System Recreated`, file key `z4t4tFPAKrMDh6pIYOeEw6`, in team `team::1638213362346160913`.
- Required frames: start/overview, today's progress, student guided path, staff guided path, security/data boundary, and next ladder.
- Guardrail: the prototype explains and guides the MVP; it never stores production accounts, student records, real credentials, private evidence, or the source of truth for dashboard data.
- Fallback: if Figma quota/auth blocks a write, the job must record a repo-side blocker or guided-prototype update note, validate, commit, and push.

## Specialist Lane Cadence

These jobs remain available as specialist lane definitions, but they are intentionally `PAUSED`. The 5x/day orchestrator owns lane selection and may perform bounded Figma, Canva, audit, or daily-report work from these rules without reactivating separate jobs.

Canva Visual System
- Automation: `senior-capstone-canva-visual-system-rebuilt`
- Status: `PAUSED` standby.
- Retained schedule if reactivated: `00:10`, `06:10`, `12:10`, and `18:10`.
- Purpose: supporting visual assets, program identity graphics, phase/process visuals, onboarding graphics, report visuals, recognition assets, certificates, and printable/exportable collateral.
- MVP emphasis: create polished app-supporting image families while preserving live UI text, privacy, accessibility, and Figma/rebuild placement.
- Primary anchors: `docs/dashboard-ux-direction.md`, `data/programs.json`, `data/capstone-framework.json`, templates, and progress log.
- Primary log: `docs/progress/canva.md`.

Figma Product Design
- Automation: `senior-capstone-figma-product-design-rebuilt`
- Status: `PAUSED` standby.
- Retained schedule if reactivated: `01:15`, `07:15`, `13:15`, and `19:15`.
- Purpose: app UI source of truth, database-backed state design, dashboard layouts, admin-preview readiness, design system, components, responsive states, accessibility states, and implementation-ready product specs.
- Primary anchors: `docs/dashboard-ux-direction.md`, `docs/domain-model.md`, `data/programs.json`, `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`.
- Primary log: `docs/progress/figma.md`.

Core Hosted-App Rebuild
- Automation: `senior-capstone-rebuild-rebuilt`
- Schedule: `00:20`, `05:20`, `10:20`, `15:20`, and `20:20` PT.
- Purpose: Cloudflare/GitHub architecture, app scaffolding, backend, auth, database/schema, user groups, progress updates, tests, deployment readiness, and integration of the design/content direction into a working hosted app.
- Primary anchors: `docs/rebuild-gameplan.md`, `docs/domain-model.md`, `docs/dashboard-ux-direction.md`, `data/programs.json`, `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`.
- Primary log: `docs/progress/rebuild.md`.

Content Quality Audit
- Automation: `senior-capstone-content-quality-audits-rebuilt`
- Status: `PAUSED` standby.
- Retained schedule if reactivated: `03:45`, `09:45`, `15:45`, and `21:45`.
- Purpose: critical audit of MVP database/security readiness, curriculum, product requirements, roles, dashboards, program specificity, accessibility, privacy, workflow clarity, Cloudflare deployment readiness, and implementation readiness.
- Primary anchors: all docs, `app.js`, templates, teacher companion guide, program seed data, and `data/capstone-framework.json`.
- Primary log: `docs/progress/audit.md`.

## Division Of Labor

Figma owns:
- Functional app screens.
- Dashboard layout.
- Admin preview and account/group management surfaces.
- Components.
- Design tokens.
- Interactive states.
- Upload/evidence UI states.
- Permission-aware UI states.
- Database-backed progress/update states.
- Announcement and notification surfaces for future 2.0 planning.
- Dev-ready UI specs.

Canva owns:
- Supporting visual assets.
- Program and phase graphics.
- Upload, evidence, review, revision, and permission support visuals.
- Announcement, empty-state, and onboarding image families.
- Print/export visuals.
- Recognition materials.
- Student-facing explanatory visuals.

Core rebuild owns:
- Real app implementation.
- Auth and authorization.
- User, role, and permission enforcement.
- User groups, cohorts, and admin assignment workflows.
- Secure database schema and migrations.
- Progress update workflow and audit logging.
- Private upload/evidence storage.
- Database-backed workflows.
- Tests.
- GitHub-to-Cloudflare deployment readiness.

Content audits own:
- Quality control.
- Consistency.
- Coverage gaps.
- Program specificity.
- Accessibility and privacy review.
- Hard-nosed critique.
- Severity-ranked findings.
- Acceptance criteria gaps.

## Required Programs

Every automation must keep these programs explicit:

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

## Daily Reporting Automation

Reporting job:
- Automation: `senior-capstone-daily-automation-report-rebuilt`
- Status: `PAUSED` standby.
- Retained schedule if reactivated: daily at `07:40`.
- Primary path: the 5x/day orchestrator owns at-most-once-per-local-day reporting so the system stays at 5 daily Senior runs while still producing a daily report when needed.
- Purpose: summarize the previous 24 hours of automation changes, email or draft the summary to `bryan.timm89@gmail.com`, and append the same summary to the Google Doc titled `Senior Capstone Daily Automation Log` under the `bryan.timm89@gmail.com` Google Drive target when connector permissions allow.

Fallback:
- If Google Drive write access is blocked, the report should still be written to `docs/daily-automation-reports.md`.
- Google Drive create/import returned `403 Forbidden` during setup on 2026-05-18, so Drive reauthorization with write access for `bryan.timm89@gmail.com` may be required before the Google Doc append path succeeds.

## Weekly Deep Audit Automation

Weekly audit job:
- Automation: `senior-capstone-weekly-deep-audit-rebuilt`
- Schedule: Sundays at `23:45`.
- Purpose: run a long, severe, piece-by-piece audit of the whole Senior Capstone product, repo, source-framework coverage, app-readiness, security/privacy posture, dashboard usefulness, Figma/Canva usefulness, backlog health, log quality, automation health, and weekly human check-in readiness.
- Weekly 100-pass goal calibration: review the last seven days of run manifests, run log entries, commits, backlog movement, and handoffs; count accepted MVP passes against the minimum 2/day and 14/week goal; update only this project's master plan and memory with the next week's daily goal/allocation when evidence requires it.

Required outputs:
- Create or update `docs/audits/weekly-deep-audit.md` with severity-ranked findings, evidence, owner lane, acceptance checks, and next actions.
- Append a detailed entry to `docs/progress/weekly-deep-audit.md`.
- Update `docs/automation-backlog.md`, `docs/progress/handoffs.md`, `docs/automation-memory.md`, `docs/progress/decision-log.md`, and `docs/progress/run-log.md` when the audit discovers durable findings, blockers, handoffs, or decisions.
- Update `docs/master-plan.md` only when the product destination, source-of-truth order, milestone path, anti-drift rules, or weekly check-in questions materially need correction.
- Commit with prefix `audit:` and push the current branch.
