# Automation Self-Improvement Protocol

Date: 2026-05-18

This protocol lets each Senior Capstone automation improve its own instructions over months of work without drifting away from the product goal.

The goal is a GitHub-to-Cloudflare hosted app whose MVP is a secure database-backed Senior Capstone system with users, groups, roles, progress updates, private upload/evidence spaces, submissions, reviews, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records. Prompt or script improvement is only useful when it helps the automations build that app more reliably.

## Required Loop

The active 5x/day orchestrator, active weekly deep audit, and any explicitly reactivated standby lane should run this loop:

1. Read `docs/master-plan.md`, `docs/automation-runbook.md`, this protocol, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, and the relevant lane/reporting logs before selecting work.
2. Do the highest-value bounded product, audit, visual, or reporting slice unless the automation itself is blocked or the user explicitly requested automation improvement.
3. During closeout, compare the run against its own prompt, the shared docs, and recent logs.
4. If no prompt/config improvement is justified, write `self-improvement: none` in the lane/report log.
5. If a small improvement is justified by evidence, update only that automation's own live prompt/config with `automation_update`, then log what changed and why.
6. Preserve the existing automation `id`, `kind`, `name`, schedule, workspace, model, reasoning effort, and status unless the user explicitly asked to change one of those fields.
7. Regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1` after any live prompt/config change.
8. Update `scripts/check-automation-contract.ps1` when the master planner, pass logger, prompt snapshot, manifest, or self-patching contract changed and the checker needs to enforce the new requirement.
9. Run project scripts non-interactively with `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ...` so scheduled runs do not pause for shell-level prompts.
10. Run `scripts/check-automation-contract.ps1` after any prompt/config, support-script, or automation-operating-doc change.
11. Commit and push any repo documentation, log, manifest, prompt snapshot, spec, or script changes created during the run; local-only repo changes are not an acceptable closeout.

## Valid Self-Improvement Triggers

An automation may improve its own prompt/config when recent evidence shows one of these problems:

- It repeatedly missed a required source doc, master-plan section, log, handoff, decision, backlog item, or lane output.
- It produced vague logs, missing next actions, missing artifact links/IDs, or non-actionable handoffs.
- It failed to preserve commit/push evidence, external artifact records, or blocker records.
- It found a reproducible script, checker, prompt snapshot, manifest, verifier, or fallback failure that blocks unattended runs.
- It repeated the same scope without closing a backlog item, handoff, or concrete acceptance check.
- It confused lane ownership, created work for the wrong lane, or needed a clearer handoff boundary.
- It missed a security, privacy, role/permission, upload/evidence, audit-log, or hosted-app constraint.
- It used the wrong destination account for Gmail, Google Drive, Canva, Figma, or daily summaries.
- It hit a connector, quota, auth, or publication blocker that needs a clearer fallback path.
- It discovered stale or contradictory prompt language compared with accepted decisions and current docs.

## Allowed Changes

Allowed self-improvement changes are narrow:

- Add or clarify required reads.
- Add missing log, handoff, backlog, decision, verification, commit, or push instructions.
- Add missing structured run manifest, artifact registry, human decision queue, or prompt snapshot instructions.
- Add or repair a script/checker/snapshot/manifest/fallback path that lets future runs resolve the same issue without human intervention.
- Add or repair non-interactive script execution, auto-approval defaults, and checker coverage when scripts could otherwise wait for unattended approval.
- Tighten lane ownership and acceptance checks.
- Improve fallback behavior for Figma, Canva, Gmail, Google Drive, git, or deployment blockers.
- Add a missing source-of-truth reference.
- Improve final-response requirements so the human can see what changed.
- Update repo docs that describe the automation operating contract.
- Update `scripts/check-automation-contract.ps1` or `scripts/snapshot-automation-prompts.ps1` when the automation contract or snapshot format changed.

## Forbidden Changes

Do not:

- Weaken the hosted-app goal, role/permission requirements, upload/evidence privacy, audit logging, or protected student-record posture.
- Remove the requirement to log, commit, and push.
- Change cadence, schedule, workspace, model, reasoning effort, status, or other automations unless the user explicitly asked.
- Rewrite another lane's prompt. Create a handoff for that lane instead.
- Spend a run on broad prompt polishing without evidence.
- Delete historical logs, handoffs, decisions, or backlog items to make the state look cleaner.
- Stage unrelated dirty files.
- Force push.

## Documentation Requirements

When an automation improves itself, it must record:

- The evidence that triggered the change.
- The exact automation ID updated.
- The prompt/config area changed.
- The fields intentionally preserved, especially schedule, workspace, model, reasoning effort, and status.
- Verification that the live automation file or tool response now includes the intended rule.
- Verification that prompt snapshots and the automation contract checker are current when prompt/config changed.
- Verification that support scripts were updated when the master planner, pass logger, prompt snapshot, or self-patching contract changed.
- The commit hash for repo documentation/log updates, or the blocker if commit/push could not complete.

Durable decisions belong in `docs/progress/decision-log.md`. Routine per-run notes belong in the lane log and `docs/progress/run-log.md`.

## Balance Rule

The default work of each run is still product progress. Self-improvement is a closeout discipline and a repair path, not the main product. A prompt/config update may be the primary slice only when the user requested it, the automation is blocked by its own instructions, or a P0/P1 automation failure prevents productive work.

## Weekly Goal Calibration

For this Senior Capstone project only, the weekly deep audit automation owns the 100-pass goal calibration loop. It should compare the last seven days of committed run evidence against the real daily target in `docs/master-plan.md`: minimum 2 accepted MVP passes per day, 3 stretch, and 14 accepted MVP passes per week. When evidence shows the next week's target or allocation should change, update only this project's `docs/master-plan.md` and `docs/automation-memory.md`, log the rationale, validate, commit, and push. This calibration may adjust goals and allocations, but it must not change automation schedules, workspace, model, reasoning effort, or status unless Bryan explicitly asks.
