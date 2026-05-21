# Senior Capstone Daily MVP Summary

Title: Senior Capstone Daily MVP Summary

Automation ID: `senior-capstone-daily-mvp-summary`

Schedule: Daily at 8:00 AM Pacific Time.

Project: `C:\SeniorProjectApp1.0`

Visible GUI title: Senior Capstone Daily MVP Summary

## Purpose

Run a read-mostly daily oversight report that summarizes the last 24 hours of Senior Capstone MVP builder activity from durable repo evidence.

This automation summarizes, counts, audits, steers, and escalates. It is not a builder. It must not replace the split builders, create a third builder, or change hourly automation behavior. preserve GUI visibility for the existing daily and weekly oversight entries.

## Strict Scope

- Oversight only.
- No hourly automation edits.
- No builder prompt edits.
- No builder schedule edits.
- No non-Figma implementation.
- No Figma design work.
- No Cloudflare deployment.
- No app code changes.
- No broad cleanup.
- No dependency or lockfile changes.
- No revival of legacy hourly QoL orchestrator.
- do not touch hourly automations.

Do not edit, rename, disable, recreate, clone, hide, archive, or re-register `senior-capstone-nonfigma-mvp-builder`, `senior-capstone-figma-product-builder`, or `senior-capstone-hourly-qol-orchestrator`. Do not edit `automation/prompts/senior-capstone-nonfigma-mvp-builder.md` or `automation/prompts/senior-capstone-figma-product-builder.md`; those hourly builder prompt paths are read-only context only.

## Required Start

From `C:\SeniorProjectApp1.0`, verify project identity before broad reading:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short --branch
git log -1 --oneline
```

Stop with `WRONG_PROJECT` if the root is not `C:\SeniorProjectApp1.0`, the branch is not `main`, or the origin remote is not `https://github.com/timmb-lab/SeniorProjectApp1.0.git`.

If there are pre-existing uncommitted changes:

- Stop with `DIRTY_WORKTREE`.
- Report the dirty files.
- Do not edit, overwrite, stage, stash, clean, reset, commit, or push anything.

## Daily Required Reads

Read these sources before writing the daily report:

- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-cadence.md`
- `docs/automation-runbook.md`
- `docs/automation-memory.md`
- `docs/automation-backlog.md`
- `docs/progress/run-log.md` recent tail only if large
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/human-decisions.md`
- `docs/artifacts.json`
- Recent `docs/progress/runs/` manifests from the last 24 hours
- `git log` from the last 24 hours

Use targeted reads after the required anchors. Do not inspect `C:\Curriculum`, parent folders, sibling projects, detached Codex worktrees, temp clones, or hidden/global automation registries. If registry state is not already represented in repo evidence, report it as unknown rather than reaching outside this project.

## Daily Analysis Requirements

### 1. Identity

Report:

- repo root
- branch
- origin
- start SHA
- end SHA if the daily report commit changes the repo

### 2. Scheduled Capacity Versus Accepted Passes

scheduled starts are not accepted passes.

Count the last 24 hours of actual accepted MVP passes from durable evidence only. Report:

- scheduled builder starts as capacity only, never as accepted pass count
- total accepted MVP pass count
- accepted MVP pass count by requirement ID
- accepted MVP pass count by lane
- non-Figma accepted pass count
- Figma accepted pass count
- rejected or report-only runs that did not count

### 3. Accepted MVP Pass Definition

An accepted MVP pass counts only if it includes at least one of:

- pushed repo commit with validation
- published external artifact recorded in repo
- committed blocker that reduces uncertainty with an exact next action

Report-only summaries do not count. Broad docs churn does not count. Broad Figma polish does not count. Scheduled starts do not count. Local-only unpushed changes do not count. Unverified claims do not count. report-only churn must be called out when it appears.

### 4. Non-Figma Lane Health

Report whether the top-of-hour non-Figma builder advanced:

- `MVP-004` login/session flow
- `MVP-013` and `MVP-014` upload/evidence flow
- production app route
- student/teacher guide mode
- user-facing dev/prompt/scaffold language cleanup
- backend/data/security
- Cloudflare static/local verification
- Cloudflare live verification or honest `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN` blocker
- tests/checks

### 5. Figma Lane Health

Report whether the bottom-of-hour Figma builder produced:

- implementation-ready handoff
- route/data/permission annotations
- state variants
- screenshot/metadata verification
- exact Figma blocker
- or only broad polish

### 6. Wrong-Lane Detection

- Non-Figma lane must not do direct Figma work.
- Figma lane must not implement backend/app code.
- Daily oversight must not do either.
- If wrong-lane work appears in evidence, report it with file or artifact links.

### 7. MVP Priority Checks

Highlight:

- login status
- upload status
- app route status
- production copy safety status
- Cloudflare verification status
- current P0/P1 blockers
- Bryan action items
- next non-Figma slice
- next Figma slice

### 8. Evidence Quality Checks

Detect and report:

- missing structured manifest
- missing `docs/progress/run-log.md` update
- missing commit SHA
- missing push result
- stale blocker repeated with no new action
- "passed" claims without validation
- live Cloudflare claims without token, connector, direct endpoint, or repo-recorded proof
- Figma claims without link, key, node, screenshot, or metadata evidence
- missing or stale human decisions when Bryan action is required

## Output Files

Update `docs/progress/daily-mvp-summary.md`.

Optionally append compact JSONL to `docs/progress/daily-mvp-summary.jsonl` if the run can do so without weakening readability or validation.

The daily summary must be phone-readable and action-oriented.

Use these sections:

- Date/time
- Last 24-hour accepted pass count
- Requirement IDs advanced
- Non-Figma lane status
- Figma lane status
- Login/upload/app route status
- Cloudflare status
- Blockers
- Bryan actions
- Next non-Figma builder target
- Next Figma builder target
- Evidence links/files
- Hourly automations untouched confirmation

## Allowed Writes

Daily oversight may write only:

- `docs/progress/daily-mvp-summary.md`
- `docs/progress/daily-mvp-summary.jsonl`

It may update `docs/human-decisions.md` only when a new Bryan action is required and evidence shows no existing matching item. Keep that change minimal.

Do not update app code, Figma files, Cloudflare config, deployment files, builder prompt files, schedules, hidden registry records, dependency manifests, or lockfiles.

## Commit And Push

If daily oversight files changed, commit and push only those files.

Commit message:

```text
automation: update senior capstone daily oversight summary
```

If no files changed, explain why. Stage only explicit files changed by this daily oversight run.

## Validation

If `docs/artifacts.json`, JSONL, or other JSON evidence is touched or parsed, validate it with PowerShell `ConvertFrom-Json`.

If this prompt, cadence docs, project lock, or verifier changes in a future maintenance run, validate with:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\verify-cadence-30min.ps1 -RepoRoot .
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation
```

Do not run hourly builders. Do not run Figma tools. Do not run Cloudflare deploy. Do not run migrations.

## Final Report

Return:

- identity result
- branch before and after
- start SHA and end SHA
- accepted pass count
- requirement IDs advanced
- lane health summary
- wrong-lane findings
- evidence quality findings
- Bryan actions
- next non-Figma target
- next Figma target
- files changed
- validation result
- commit SHA
- push result
- explicit confirmation that hourly automations were untouched
