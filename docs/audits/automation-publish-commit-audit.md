# Automation Publish And Commit Audit

Date: 2026-05-18

## Scope

Audited the four active product-building automations:

- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

Daily reporting automation is out of scope for this audit because the request asked for the four build/design/audit lanes.

## Verdict

All four automations already had baseline git closeout language:

- inspect git status at start
- avoid pulling over dirty work
- stage only own files
- commit with lane prefix
- push current branch
- never force push
- log blocker if commit/push fails

However, the prompts left one important ambiguity: an external Figma or Canva artifact could be created, but the durable repo handoff could be missed if the lane treated the external tool output as sufficient. That would make weekly review harder because the artifact would exist outside the repo without a committed pointer, acceptance check, or next action.

## Findings

### P1 - External Artifacts Needed A Hard Repo Handoff Gate

Affected lanes:
- Figma
- Canva

Evidence:
- Figma prompt required a Figma artifact/link or repo spec and had git closeout language.
- Canva prompt required a Canva artifact/spec and had git closeout language.
- Neither shared operating doc explicitly said an external artifact only counts as published work after its link/ID is committed into the repo progress/spec/asset records.

Impact:
- A lane could create a useful Figma/Canva artifact but leave the project without a durable repo trace for weekly review or rebuild consumption.

Fix applied:
- Added `Publication And Commit Gate` to `docs/automation-runbook.md`.
- Added cadence requirements that every external artifact link/ID must be recorded in a committed lane log, design spec, asset registry, or audit handoff.

### P1 - Own Untracked Files Needed A Stronger End-Of-Run Rule

Affected lanes:
- Figma
- Rebuild
- Audit
- Canva

Evidence:
- All prompts included commit/push rules, but the shared docs did not explicitly forbid ending with the automation's own untracked generated files.

Impact:
- Automations could produce local files without committing them, leaving work invisible to daily reports and future runs.

Fix applied:
- Added runbook and cadence rules requiring `git status --short` inspection before ending.
- Added explicit prohibition against leaving generated files untracked or relying on final-chat text as the only record.

### P2 - "No Repo Changes" Needed To Be Rare And Explained

Affected lanes:
- Figma
- Rebuild
- Audit
- Canva

Evidence:
- Existing prompts said not to commit when no repo files changed, which is correct, but every productive run should normally update a lane progress log.

Impact:
- A productive run with no committed progress entry could look like no work happened.

Fix applied:
- Added runbook guidance that if no repo files changed, the automation must say why, and that this should be rare because productive runs should update the lane progress log.

## Resulting Enforcement Standard

Each run must now end with one of:

1. A pushed repo commit containing the run's changes.
2. A published external artifact with its link/ID recorded in a committed and pushed repo handoff.
3. A committed and pushed blocker entry explaining why publication, commit, or push could not complete.

## Verification

- Live automation configs were inspected directly from `.codex/automations`.
- All four active product-lane prompts include git closeout language.
- Shared runbook and cadence now add the missing publication/commit gate that every lane reads at start.

## Residual Risk

This is now prompt/process-enforced, not technically sandbox-enforced. Weekly check-ins should still review:

- Whether each lane progress log has new entries.
- Whether external Figma/Canva IDs appear in repo specs or asset registries.
- Whether `git log --since="7 days ago"` shows lane-prefixed commits.
- Whether any daily report mentions uncommitted files, push failures, or Drive/Gmail connector blockers.
