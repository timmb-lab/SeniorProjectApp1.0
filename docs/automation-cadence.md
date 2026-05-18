# Automation Cadence

Date: 2026-05-18

The Senior Capstone rebuild now uses a four-hour non-overlap automation rotation. Only one automation lane should run in a given hour: Figma first, core rebuild second, audit third, Canva fourth, then the cycle repeats. Each automation should read the shared anchor docs, update `docs/automation-progress.md`, and avoid duplicating the prior job's work.

End goal: a hosted app with secure users, roles, permissions, private upload/evidence spaces, submissions, reviews, approvals, dashboards, admin controls, audit logs, and protected student records.

Master plan: `docs/master-plan.md`.
Shared runbook: `docs/automation-runbook.md`.
Shared memory: `docs/automation-memory.md`.
Cross-lane run log: `docs/progress/run-log.md`.
Cross-lane handoffs: `docs/progress/handoffs.md`.
Decision log: `docs/progress/decision-log.md`.
Shared milestones: `docs/automation-milestones.md`.
Shared curriculum framework: `data/capstone-framework.json` and `docs/curriculum-framework-integration.md`.
Daily reporting notes: `docs/daily-automation-reporting.md`.

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
- Read `docs/automation-milestones.md` before selecting work.
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

- Figma may create product UI specs and app-component direction, but should not own backend implementation.
- Core rebuild may implement app architecture, auth, permissions, private upload/evidence storage, and workflows, but should consume Figma/Canva/content outputs instead of inventing visual direction from scratch.
- Canva may create or specify supporting visuals for upload/evidence/review/revision/permission concepts, but should not define functional app layout.
- Content audits may critique and patch content/specs, but should clearly hand larger work to Figma, Canva, or core rebuild.
- Content audits own unresolved issue triage in `docs/automation-backlog.md`.
- No lane should recreate the source PDFs as static checklist pages when the app can make the same requirement a submission, evidence artifact, review gate, dashboard signal, or export task.

Work priority:

1. P0/P1 issues from audits or `docs/automation-backlog.md`.
2. Earliest incomplete milestone from `docs/automation-milestones.md`.
3. Continuation of the previous lane's explicitly recommended next step.
4. Handoffs from the adjacent lane in the automation cadence.
5. The smallest useful vertical slice or reusable asset/spec in that lane.

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
- Compact current memory: `docs/automation-memory.md`
- Cross-lane run index: `docs/progress/run-log.md`
- Handoff ledger: `docs/progress/handoffs.md`
- Durable decision log: `docs/progress/decision-log.md`

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

## Four-Hour Non-Overlap Rotation

Hour 1 at `:00` - Figma Product Design
- Automation: `senior-capstone-figma-product-design`
- Schedule: `00:00`, `04:00`, `08:00`, `12:00`, `16:00`, `20:00`.
- Purpose: app UI source of truth, dashboard layouts, design system, components, responsive states, accessibility states, and implementation-ready product specs.
- Primary anchors: `docs/dashboard-ux-direction.md`, `docs/domain-model.md`, `data/programs.json`, `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`.
- Primary log: `docs/progress/figma.md`.

Hour 2 at `:00` - Core Hosted-App Rebuild
- Automation: `senior-capstone-rebuild-hourly`
- Schedule: `01:00`, `05:00`, `09:00`, `13:00`, `17:00`, `21:00`.
- Purpose: architecture, app scaffolding, backend, auth, database/schema, tests, deployment readiness, and integration of the design/content direction into a working hosted app.
- Primary anchors: `docs/rebuild-gameplan.md`, `docs/domain-model.md`, `docs/dashboard-ux-direction.md`, `data/programs.json`, `data/capstone-framework.json`, `docs/curriculum-framework-integration.md`.
- Primary log: `docs/progress/rebuild.md`.

Hour 3 at `:00` - Content Quality Audit
- Automation: `senior-capstone-content-quality-audits`
- Schedule: `02:00`, `06:00`, `10:00`, `14:00`, `18:00`, `22:00`.
- Purpose: critical audit of curriculum, product requirements, roles, dashboards, program specificity, accessibility, privacy, workflow clarity, and implementation readiness.
- Primary anchors: all docs, `app.js`, templates, teacher companion guide, program seed data, and `data/capstone-framework.json`.
- Primary log: `docs/progress/audit.md`.

Hour 4 at `:00` - Canva Visual System
- Automation: `senior-capstone-canva-visual-system`
- Schedule: `03:00`, `07:00`, `11:00`, `15:00`, `19:00`, `23:00`.
- Purpose: supporting visual assets, program identity graphics, phase/process visuals, onboarding graphics, report visuals, recognition assets, certificates, and printable/exportable collateral.
- Primary anchors: `docs/dashboard-ux-direction.md`, `data/programs.json`, `data/capstone-framework.json`, templates, and progress log.
- Primary log: `docs/progress/canva.md`.

## Division Of Labor

Figma owns:
- Functional app screens.
- Dashboard layout.
- Components.
- Design tokens.
- Interactive states.
- Upload/evidence UI states.
- Permission-aware UI states.
- Dev-ready UI specs.

Canva owns:
- Supporting visual assets.
- Program and phase graphics.
- Upload, evidence, review, revision, and permission support visuals.
- Print/export visuals.
- Recognition materials.
- Student-facing explanatory visuals.

Core rebuild owns:
- Real app implementation.
- Auth and authorization.
- User, role, and permission enforcement.
- Private upload/evidence storage.
- Database-backed workflows.
- Tests.
- Deployment readiness.

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
- Automation: `senior-capstone-daily-automation-report`
- Schedule: daily at `07:30`.
- Purpose: summarize the previous 24 hours of automation changes, email the summary to `timmb@nv.ccsd.net`, and append the same summary to the Google Doc titled `Senior Capstone Daily Automation Log`.

Fallback:
- If Google Drive write access is blocked, the report should still be emailed and should also be written to `docs/daily-automation-reports.md`.
- Google Drive create/import returned `403 Forbidden` during setup on 2026-05-18, so Drive reauthorization with write access may be required before the Google Doc append path succeeds.
