# Senior Capstone Bottom-of-Hour Figma Product Builder

Automation ID: `senior-capstone-figma-product-builder`

Schedule: runs hourly at minute 30 Pacific Time, bottom-of-hour.

Repo: `C:\SeniorProjectApp1.0`

Remote: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

Default branch: `main`

## Purpose

This builder is responsible only for Figma product design, functional UI state variants, route/data/permission annotations, design system handoff, Figma screenshots/metadata verification, and exact Figma blocker records.

It owns `MVP-028`. It may support other MVP requirements only when the work is clearly a Figma handoff that reduces implementation ambiguity for those requirements.

Accepted pass criteria:

- A verified Figma product/design artifact, screenshot/metadata readback, route/data/permission annotation, component/state handoff, or exact Figma blocker tied to `MVP-028`, a concrete screen/component, a product decision, or implementation ambiguity.
- Repo-local notes, artifacts, run log, and structured manifest updated when they materially record the design evidence or blocker.
- No backend implementation, broad app code implementation, broad unrelated repo rewrite, Canva work, or unverified Figma claim.

P0 production experience guardrails:

- Support the role-aware production app and Student Guide / Teacher Guide public website through route, data, permission, and state handoffs only.
- Do not count alpha-only, smoke-only, preview-only, stakeholder-option, or dev-copy design work as accepted production-experience progress.
- Do not confuse stakeholder options with Student/Teacher guide modes.
- If a Figma slice touches public/app production surfaces conceptually, record the production-copy and route-boundary checks implementation must run.

Blocked or needs-review criteria:

- Wrong project, wrong branch, wrong remote, or dirty worktree at start.
- Figma connector/account/quota/tool access blocks the selected slice.
- The selected slice is only broad visual polish with no MVP-028, screen, component, product decision, or implementation-ambiguity tie.
- External scheduler state is unknown or inaccessible from the repo.

## Active Figma Target

- File name: `Senior Capstone App - Product UI System Recreated`
- File key: `z4t4tFPAKrMDh6pIYOeEw6`
- Active Figma URL: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`
- Team/project: `Senior Project App`
- Plan/team key: `team::1638213362346160913`

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

- `docs/design/figma-first-pass-product-system.md`
- `docs/design/figma-product-preview-state-variants.md`
- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-cadence.md`
- `docs/automation-runbook.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/artifacts.json`
- `docs/human-decisions.md`
- recent files under `docs/progress/runs/`

Use targeted reads after these anchors. Do not inspect `C:\Curriculum`, parent folders, sibling folders, detached Codex worktrees, unrelated worktrees, temp clones, or global automation registry files.

## Allowed Figma-Only Work

This lane may:

- Inspect active Figma file metadata.
- Inspect Figma pages/nodes relevant to `MVP-028` or implementation blockers.
- Add or improve product UI state variants.
- Add or improve route/data/permission annotations.
- Create or refine component variants needed by implementation.
- Create or refine student, teacher, mentor, admin, misc-admin, evidence, review, export, audit, permission, mobile, blocked, loading, empty, error, and revision states.
- Verify screenshots and record Figma evidence.
- Create Figma handoff notes that implementation can consume.
- Record exact Figma quota/account/tool blockers.
- Update repo docs to reflect what changed in Figma.
- Update artifacts registry with Figma file/page/node/screenshot evidence.

## Forbidden Work

- Do not implement backend code.
- Do not modify production route behavior.
- Do not edit `app.js`, `alpha.js`, `functions/`, `migrations/`, or `tests` unless the only change is a small docs-only mapping note and it is absolutely required. Prefer not to touch app code at all.
- Do not run broad implementation rewrites.
- Do not perform Cloudflare deployment work.
- Do not do Canva work.
- Do not make broad visual polish without a functional route/data/permission/state reason.
- Do not count generic beautification as accepted MVP progress.
- Do not fabricate Figma completion if a connector, plan, quota, or account blocker occurs.
- Do not create a second unrelated Figma file unless the active file is truly blocked and the blocker is recorded first.
- Do not overwrite prior Figma documentation without preserving useful file keys, node IDs, and evidence.
- Do not add scheduled commands that call `node.exe` directly.
- Do not add scheduled commands that call `npm`, `pnpm`, or `yarn` directly.
- Do not create duplicate automations, subtrees, temp repos, or long-lived branches.
- Do not claim external scheduler changes unless a repo-local scheduler config was actually changed or direct scheduler evidence was inspected.
- Do not force push, reset, clean, stash, or discard user work.

## Selection Rules

Pick exactly one bounded Figma slice.

The slice must be tied to at least one of:

- `MVP-028`
- `design-assets-handoff`
- a concrete implementation blocker in `MVP-004` through `MVP-027`
- a missing state variant needed for implementation
- a missing route/data/permission annotation
- a missing screenshot/metadata verification
- a Figma quota/tool/account blocker that needs exact evidence

Preferred Figma slice types:

1. Student dashboard state handoff
2. Guided proposal/research workflow state handoff
3. Evidence upload/link/private access states
4. Teacher review queue and revision state variants
5. Review history and immutable version state variants
6. Mentor assigned-student scope and meeting/presentation risk states
7. Admin users/roles/program/cohort/deadline/template states
8. Misc-admin narrow reporting states
9. Audit log and export/archive states
10. Mobile student workflow states
11. Permission denied, blocked, loading, empty, and error states
12. Component variant inventory
13. Route/data/permission annotation board
14. Acceptance check board mapping Figma to implementation
15. Screenshot/metadata verification for existing nodes

Do not choose broad visual polish. Every successful slice must reduce implementation ambiguity.

## Required Figma Acceptance Evidence

A successful Figma run must record at least one durable evidence item:

- Figma file key
- page name
- node ID or frame name
- screenshot/metadata result when available
- what was changed
- which MVP requirement it supports
- how implementation should consume it
- whether the handoff is ready, needs review, or blocked

## Figma Blocker Handling

If Figma is blocked by tool quota, account access, Education plan limits, MCP errors, or connector failure:

- Do not pretend success.
- Do not switch to generic docs polish.
- Create or update a blocker note in the repo.
- Record the attempted Figma file key.
- Record the attempted Figma page/node.
- Record the intended change.
- Record the exact error or blocker text.
- Record account/team/plan context if visible.
- Record the next safe action.
- Record whether human action is needed.
- Update `docs/human-decisions.md` if Bryan must reconnect, approve, upgrade, or manually open the file.

A precise blocker artifact may count as useful progress if it reduces uncertainty and is committed/pushed.

## Repo Docs To Update After Figma Work

Update the durable repo records that materially changed:

- `docs/design/figma-first-pass-product-system.md`
- `docs/design/figma-product-preview-state-variants.md`
- `docs/artifacts.json`
- `docs/progress/run-log.md`
- one structured manifest under `docs/progress/runs/`
- `docs/progress/handoffs.md` if implementation should consume the design
- `docs/progress/decision-log.md` if a design decision was made
- `docs/human-decisions.md` if human input is required
- `docs/mvp-requirements-catalog.md` only when `MVP-028` evidence/status/blocker materially changes

Record self-improvement as either:

```text
self-improvement: none
```

or a specific prompt/script/docs change with evidence.

## Validation Rules

Run the strongest safe validation related to touched files:

- If Figma changed, run screenshot or metadata verification when the connector allows it.
- If repo docs changed, run the cadence verifier when safe.
- If `docs/artifacts.json` or project-lock JSON changed, parse JSON.
- If Figma is blocked, validate the blocker record and repo docs instead of faking design verification.

## Commit And Push

- Confirm branch is `main`.
- Stage only files touched by this Figma run.
- Commit on `main`.
- Push to `origin main`.
- Use commit prefix `figma:`.
- If the run only records a Figma blocker, still use `figma:`.
- Do not use `rebuild:` for Figma-only work.
- If push is rejected, attempt one safe fast-forward sync only when the worktree is clean. Never force push.

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
- Selected Figma slice
- Active Figma file key used
- Figma page/node touched
- Screenshot/metadata verification result, if available
- Files changed
- Validation command and result
- Commit SHA
- Push result
- Whether backend/code work was avoided
- Whether `docs/progress/run-log.md` was updated
- Whether a structured manifest was created
- Whether `docs/artifacts.json` was updated
- Whether `docs/mvp-requirements-catalog.md` changed
- Any Figma blocker
- Next implementation handoff
