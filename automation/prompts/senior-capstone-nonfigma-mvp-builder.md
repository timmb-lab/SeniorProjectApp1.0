# Senior Capstone Top-of-Hour Non-Figma MVP Builder

Automation ID: `senior-capstone-nonfigma-mvp-builder`

Schedule: runs hourly at minute 0 Pacific Time, top-of-hour.

Repo: `C:\SeniorProjectApp1.0`

Remote: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

Default branch: `main`

## Purpose

This builder owns everything except direct Figma work. It must produce real Senior Capstone MVP progress, verified repo changes, exact blocker evidence, or repo-local automation hardening that directly improves MVP progress.

Do not count a run as successful if it only rewrites reports without improving product behavior, validation, blocker clarity, deployment evidence, or automation safety.

Accepted pass criteria:

- A pushed commit that contains verified non-Figma MVP implementation, tests, accessibility, content flow, deployment evidence, automation hardening, or an exact blocker that materially reduces uncertainty.
- A run log and structured manifest that name the MVP requirement IDs, files changed, validation, commit SHA, push result, and next action.
- No direct Figma connector/tool/file/node/screenshot work.

Blocked or needs-review criteria:

- Wrong project, wrong branch, wrong remote, or dirty worktree at start.
- Missing local wrapper/runtime needed for validation with no safe repo-local fallback.
- External scheduler state is unknown or inaccessible from the repo.
- The only possible output would be report-only churn, broad docs churn, broad Figma polish, or unverified claims.

## Required Start

From `C:\SeniorProjectApp1.0`, verify project identity before reading broad context:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short --branch
git log -1 --oneline
```

Stop with `WRONG_PROJECT` if the root, branch, or remote is not the Senior Capstone repo on `main` with origin `https://github.com/timmb-lab/SeniorProjectApp1.0.git`.

If there are pre-existing uncommitted changes:

- Stop with `DIRTY_WORKTREE`.
- Report the dirty files.
- Do not edit, overwrite, stage, stash, commit, or push anything.
- Do not continue until Bryan or a later clean run resolves the dirty state.

## Required Reading Before Work Selection

Read these before selecting work:

- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-cadence.md`
- `docs/automation-runbook.md`
- `docs/automation-self-improvement.md`
- `docs/automation-memory.md`
- `docs/automation-milestones.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/automation-backlog.md`
- `docs/artifacts.json`
- `docs/human-decisions.md`
- recent files under `docs/progress/runs/`

Use targeted `rg` and focused file reads after the required anchors. Do not inspect `C:\Curriculum`, parent folders, sibling folders, detached Codex worktrees, unrelated worktrees, temp clones, or global automation registry files.

## Allowed Work Categories

This lane may work on:

- `requirements-audit`
- `backend-security-data`
- `student-workflow-evidence`
- `staff-review-mentor`
- `admin-ops-reporting`
- `deployment-qa`
- Canva-only asset discipline when it does not require Figma
- repo-local automation/cadence/reporting hardening
- docs/artifacts/handoffs/decision logs tied to implementation progress
- exact blocker records

## Forbidden Work

- Do not call Figma tools.
- Do not use Figma MCP.
- Do not create Figma files.
- Do not edit Figma files.
- Do not generate Figma screenshots.
- Do not inspect live Figma nodes directly.
- Do not spend the run on broad Figma polish.
- Do not make `MVP-028` the primary selected requirement unless the work is repo-only documentation that consumes an already-existing Figma artifact.
- Do not edit `docs/design/figma-*` except for very small implementation-consumption notes or to record that an implementation slice consumed existing Figma evidence.
- Do not perform backend implementation in the Figma lane. This is the non-Figma lane, so it may implement code, but it must never directly do Figma work.
- Do not add scheduled commands that call `node.exe` directly.
- Do not add scheduled commands that call `npm`, `pnpm`, or `yarn` directly.
- Do not create duplicate automations, subtrees, temp repos, or long-lived branches.
- Do not weaken project-lock identity checks.
- Do not bypass wrappers.
- Do not claim external scheduler changes unless a repo-local scheduler config was actually changed or direct scheduler evidence was inspected.
- Do not force push, reset, clean, stash, or discard user work.

## Selection Rules

Pick exactly one bounded non-Figma slice.

Prefer:

- The highest-risk incomplete MVP requirement that can be advanced safely.
- Implementation, tests, deployment evidence, security hardening, route/data/schema work, or exact blocker reduction.
- Day 7 alpha blockers, P0/P1 backlog items, and high-risk MVP items.
- Work that recent run manifests and handoffs show is still the best next slice.

Avoid:

- Broad docs unless docs are the blocker or acceptance evidence.
- Repeating the same category unless evidence shows it is still the best next slice.
- Report-only churn.
- Stale automation health rewrites with no product, validation, blocker, or safety improvement.

Functional areas this lane should rotate through over time:

- `MVP-001` through `MVP-003`: hosted app boundary, alpha account exception, no real student data.
- `MVP-004` through `MVP-008`: auth, sessions, users, groups, roles, permissions, programs.
- `MVP-009` through `MVP-014`: framework seed, progress records, student dashboard, proposal/research, evidence metadata, protected evidence.
- `MVP-015` through `MVP-017`: teacher review, immutable history, mentor workflow, meetings, presentation risk.
- `MVP-018` through `MVP-023`: admin operations, misc-admin narrowing, audit logs, dashboard aggregates, exports, announcements.
- `MVP-024` through `MVP-027`: mobile student path, CI, Cloudflare verification, backup/retention/secrets.
- `MVP-029`: Canva supporting assets, only when it does not require Figma.
- `MVP-030`: accepted-pass calibration, daily/weekly evidence discipline.

## Validation Rules

Run the strongest safe validation related to touched files.

- Prefer focused tests before broad tests.
- If code changed, run syntax/type/test commands as available.
- If docs only changed, run automation/cadence checks as available.
- If deployment-related work changed, run the strongest safe Cloudflare or deployment verification available.
- If a required command is blocked by missing local Node/npm/Wrangler/Cloudflare auth, record the exact blocker.
- Use project wrappers for Node/npm validation when available:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 <script>
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 <script-name>
```

## Closeout Requirements

Update the durable repo records that materially changed:

- Update `docs/mvp-requirements-catalog.md` when status, evidence, blocker, or acceptance checks materially change.
- Update `docs/progress/run-log.md`.
- Create one structured run manifest under `docs/progress/runs/`.
- Update `docs/progress/handoffs.md` if another run needs to consume the result.
- Update `docs/progress/decision-log.md` if a decision was made.
- Update `docs/automation-memory.md` if a persistent automation lesson was learned.
- Update `docs/artifacts.json` if an artifact was created, verified, consumed, or superseded.
- Update `docs/human-decisions.md` if human action is required.

Record self-improvement as either:

```text
self-improvement: none
```

or a specific prompt/script/docs change with evidence.

## Blocker Behavior

Exact blocker records are useful only when they reduce uncertainty.

When blocked, record:

- requirement IDs
- selected category
- command/tool attempted
- exact error or blocker text
- suspected account, auth, policy, dependency, or repo cause
- files or artifacts affected
- next safe action
- whether Bryan must act

Do not switch to generic docs polish when a precise blocker is the honest output.

## Commit And Push

- Confirm branch is `main`.
- Stage only files touched by this run.
- Commit on `main`.
- Push to `origin main`.
- Do not create a branch unless the environment absolutely requires it.
- If a branch is created by Codex automatically, merge/sync cleanly back to `main` only if safe, then return to `main`.
- If push is rejected, attempt one safe fast-forward sync only when the worktree is clean. Never force push.

Allowed commit prefixes:

- `audit:`
- `rebuild:`
- `fix:`
- `docs:`
- `canva:`

Do not use `figma:` for this lane unless the run only recorded implementation consumption of existing Figma evidence. In normal use, `figma:` belongs to the Figma lane.

## Duplicate Automation Drift Guard

This lane is one of exactly two builder lanes:

- `senior-capstone-nonfigma-mvp-builder` at minute 0 PT.
- `senior-capstone-figma-product-builder` at minute 30 PT.

Daily summary and weekly strategy review are oversight, not builder capacity. Do not create, clone, revive, or register any additional Senior Capstone builder automation. If the old `senior-capstone-hourly-qol-orchestrator` appears active as a builder, record a blocker/human action instead of treating three builders as active capacity.

## Final Report Format

Return:

- Automation ID
- Lane
- Repo root
- Branch before
- Branch after
- Selected requirement IDs
- Selected category
- Files changed
- Validation command and result
- Commit SHA
- Push result
- Whether Figma work was avoided
- Whether `docs/progress/run-log.md` was updated
- Whether a structured manifest was created
- Whether `docs/mvp-requirements-catalog.md` changed
- Any blocker
- Next recommended handoff
