# Senior Capstone Weekly Strategy Review

Title: Senior Capstone Weekly Strategy Review

Automation ID: `senior-capstone-weekly-script-audit`

Visible GUI title: Senior Capstone Weekly Strategy Review

Schedule: Sundays at 6:00 PM Pacific Time.

Project: `C:\SeniorProjectApp1.0`

## Purpose

Run a weekly evidence-based strategy review that examines seven days of Senior Capstone MVP evidence and adjusts plan, memory, backlog, catalog, and related records only when evidence requires it.

This automation summarizes, counts, audits, steers, and escalates. It is not a builder. It must not replace the split builders, create a third builder, or change hourly automation behavior. preserve GUI visibility for the existing daily and weekly oversight entries.

## Strict Scope

- Oversight only.
- No hourly automation edits.
- No builder prompt edits.
- No builder schedule edits.
- No app implementation.
- No backend implementation.
- No Figma design work.
- No Cloudflare deployment.
- No ordinary product changes.
- no schedule changes unless Bryan asks.
- No creation of new builders.
- No revival of old hourly QoL orchestrator.
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

## Weekly Required Reads

Read these before writing the weekly review:

- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- `docs/automation-cadence.md`
- `docs/automation-runbook.md`
- `docs/automation-self-improvement.md`
- `docs/automation-memory.md`
- `docs/automation-milestones.md`
- `docs/automation-backlog.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/human-decisions.md`
- `docs/artifacts.json`
- `docs/progress/runs/` from the last seven days
- `git log` from the last seven days
- `automation/qol/project-lock.json`

Use targeted reads after the required anchors. Do not inspect `C:\Curriculum`, parent folders, sibling projects, detached Codex worktrees, temp clones, or hidden/global automation registries. If registry state is not already represented in repo evidence, report it as unknown rather than reaching outside this project.

## Weekly Analysis Requirements

### 1. Seven-Day Accepted MVP Pass Count

Report:

- total accepted MVP passes
- accepted passes by day
- accepted passes by requirement ID
- accepted passes by lane
- non-Figma accepted passes
- Figma accepted passes
- exact blockers that counted because they reduced uncertainty
- rejected or report-only runs that did not count

An accepted MVP pass counts only if it includes a pushed repo commit with validation, a published external artifact recorded in repo, or a committed blocker that reduces uncertainty with an exact next action.

### 2. Weekly Goal Comparison

Compare actual evidence against:

- minimum goal: 14 accepted MVP passes/week
- weekly stretch: 16 to 18 accepted MVP passes/week

Report:

- actual count
- gap to minimum
- gap to stretch
- whether the project is on pace

Scheduled starts are capacity only. They are not accepted MVP passes.

### 3. Requirement Coverage

The requirement coverage review must include:

- `MVP-004` login/session
- `MVP-013` evidence metadata
- `MVP-014` protected evidence/upload
- `MVP-032` canonical app route if present in catalog
- `MVP-033` role-aware app selection if present
- `MVP-034` production copy safety if present
- `MVP-039` public/app copy boundary if present
- `MVP-028` Figma handoff quality
- Cloudflare/production verification requirements
- any P0/P1 backlog items

### 4. Lane Effectiveness

Assess:

- non-Figma lane implementation quality
- Figma lane handoff quality
- wrong-lane violations
- repeated blockers
- stale work
- excessive docs-only churn
- unverified claims

### 5. Blocker Review

Review:

- Cloudflare token/connector blockers
- Figma connector/quota blockers
- dirty worktree blockers
- wrapper/runtime blockers
- missing validation blockers
- human decision blockers
- stale repeated blockers

### 6. Next-Week Steering

Produce:

- top 3 non-Figma targets
- top 3 Figma targets
- top 3 blockers to burn down
- Bryan actions
- docs/catalog/backlog changes justified by evidence

### 7. Allowed Weekly Doc Updates

Only update these when evidence supports it:

- `docs/progress/weekly-strategy-review.md`
- `docs/progress/weekly-strategy-review.jsonl`
- `docs/automation-memory.md`
- `docs/automation-backlog.md`
- `docs/mvp-requirements-catalog.md`
- `docs/master-plan.md`
- `docs/progress/handoffs.md`
- `docs/human-decisions.md`

### 8. Not Allowed

- no app code changes
- no Figma changes
- no builder prompt changes
- no hourly automation changes
- no schedule changes
- no deploys
- no dependency changes

## Output Files

Update `docs/progress/weekly-strategy-review.md`.

Optionally append compact JSONL to `docs/progress/weekly-strategy-review.jsonl` if the run can do so without weakening readability or validation.

The weekly output must include:

- week range
- accepted pass count
- weekly goal comparison
- requirement coverage table
- blocker trend table
- lane effectiveness
- next-week allocation
- Bryan actions
- Hourly automations untouched confirmation

## Commit And Push

Commit only weekly oversight/planning files changed by this run.

Commit message:

```text
automation: update senior capstone weekly oversight review
```

If no files changed, explain why. Stage only explicit files changed by this weekly oversight run.

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
- seven-day accepted MVP pass count
- weekly goal comparison
- requirement coverage findings
- blocker trends
- lane effectiveness
- next-week allocation
- Bryan actions
- docs changed and why
- validation result
- commit SHA
- push result
- explicit confirmation that hourly automations were untouched
