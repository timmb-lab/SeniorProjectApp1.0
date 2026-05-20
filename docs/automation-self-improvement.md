# Automation Self-Improvement Protocol

Date: 2026-05-19

This protocol applies only to the single Senior Capstone GUI runner, `senior-capstone-hourly-qol-orchestrator`.

The goal is a GitHub-to-Cloudflare hosted app whose MVP is a secure database-backed Senior Capstone system with users, groups, roles, progress updates, private upload/evidence spaces, submissions, reviews, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records. Prompt or script improvement is useful only when it helps the runner build that app more reliably.

## Required Loop

The 30-minute GUI runner should:

1. Read `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/automation-runbook.md`, this protocol, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, and the relevant lane/reporting logs before selecting work.
2. Do the highest-value bounded product, audit, visual, or reporting slice unless the runner itself is blocked or the user explicitly requested automation maintenance.
3. During closeout, compare the run against the single GUI contract, the shared docs, and recent logs.
4. If no prompt/config improvement is justified, write `self-improvement: none` in the lane/report log.
5. If a small improvement is justified by evidence, update only this project's GUI runner contract, project-local automation docs, or the smallest relevant project script, then log what changed and why.
6. Preserve the single automation ID, workspace, model, reasoning effort, and 30-minute cadence unless the user explicitly asks to change one of those fields.
7. Run project scripts non-interactively with `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ...`, `scripts/run-node-script.ps1`, or `scripts/run-npm-script.ps1`.
8. Validate automation contract changes with `scripts/verify-cadence-30min.ps1` or `npm run check:automation`.
9. Commit and push repo documentation, log, manifest, spec, or script changes created during the run; local-only repo changes are not an acceptable closeout.

## Valid Self-Improvement Triggers

The runner may improve its own contract when recent evidence shows it:

- Repeatedly missed a required source doc, master-plan section, log, handoff, decision, backlog item, or lane output.
- Produced vague logs, missing next actions, missing artifact links/IDs, or non-actionable handoffs.
- Failed to preserve commit/push evidence, external artifact records, or blocker records.
- Found a reproducible script, verifier, manifest, or fallback failure that blocks unattended runs.
- Repeated the same scope without closing a backlog item, handoff, or concrete acceptance check.
- Missed a security, privacy, role/permission, upload/evidence, audit-log, or hosted-app constraint.
- Hit a connector, quota, auth, or publication blocker that needs a clearer fallback path.
- Discovered stale or contradictory language compared with accepted decisions and current docs.

## Boundaries

Do not weaken the hosted-app goal, role/permission requirements, upload/evidence privacy, audit logging, or protected student-record posture. Do not change cadence, workspace, model, reasoning effort, or status unless the user explicitly asks. Do not stage unrelated dirty files, force push, or wait on interactive script prompts.

## Weekly Goal Calibration

The single GUI runner owns 100-pass goal calibration for this project. It should compare the last seven days of committed run evidence against the real daily target in `docs/master-plan.md`: minimum 2 accepted MVP passes per day, 3 stretch, and 14 accepted MVP passes per week. When evidence shows the next week's target or allocation should change, update only this project's `docs/master-plan.md`, `docs/automation-memory.md`, and `docs/mvp-requirements-catalog.md`, log the rationale, validate, commit, and push.
