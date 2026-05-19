# Automation 30-Day Efficiency Audit

Date: 2026-05-18

Scope: audit the current Senior Capstone QoL automation system for efficient self-scaling over the next 30 days.

Update 2026-05-18 17:38 PT: the live registry was later split from 10 compound QoL automations into 30 single-slot QoL automations because compound multiple-BYHOUR schedules were not reliably firing. Daily start capacity remains 30, 30-day capacity remains 900, and minimum spacing remains 48 minutes.

## Executive Finding

The audited system was already aggressive enough. At audit time, it had 10 active QoL automations, 30 scheduled starts per day, no shared start slots, and 48 minutes of minimum spacing. Over 30 days that is 900 scheduled starts.

The efficiency problem is not start volume. The system only needs:

- 60 accepted MVP passes in 30 days for the minimum 2/day target.
- 90 accepted MVP passes in 30 days for the 3/day stretch target.
- 6.67 percent accepted-pass conversion for minimum.
- 10 percent accepted-pass conversion for stretch.

Adding more starts before measuring conversion would create churn risk. The right self-scaling strategy is to retarget QoL focus, blockers, prompt clarity, and acceptance checks from evidence before changing cadence.

## What Is Strong

- At audit time, the live local registry contained exactly the 10 expected Senior Capstone QoL automation TOMLs.
- At audit time, all 10 were `ACTIVE`.
- At audit time, each target ran exactly 3x/day through one compound automation.
- The schedule creates 30 starts/day with no exact overlaps.
- Minimum start spacing is 48 minutes.
- At audit time, `scripts/check-automation-contract.ps1` enforced the exact 10 IDs, names, schedules, status, prompt fragments, prompt snapshot hashes, full `MVP-001` through `MVP-030` coverage, JSON parsing, and non-interactive script rules. It now enforces the exact 30 single-slot QoL IDs while preserving the same 30-start/day capacity.
- The QoL split is efficient: each runner owns a concrete unfinished MVP gap instead of one giant all-purpose prompt.
- The full Figma prototype now exists, so design should no longer consume broad capacity unless implementation hits a specific route/data/permission ambiguity.

## Gaps Found

1. The system lacked a reusable 30-day efficiency scorecard.
   - Fix added: `scripts/measure-automation-efficiency.ps1`.

2. Run manifests did not consistently expose machine-readable accepted-pass telemetry.
   - Audit script found 18 manifests in the 30-day window.
   - `accepted_mvp_pass` was missing from all 18.
   - `duration_minutes` was missing from all 18.
   - Many older manifests also lack normalized `status`, which makes conversion math noisy.

3. The rebuilt QoL system is too new to prove observed automation yield yet.
   - The audit found no observed manifests yet from the 10 new QoL automation IDs because they were just created.
   - This is not a failure, but the next weekly calibration must verify each QoL runner has either accepted evidence or an exact blocker.

4. Auto-scaling language existed, but it was mostly weekly-goal oriented.
   - Fix added: explicit 30-day scaling rules in the runbook, cadence doc, self-improvement protocol, master plan, and manifest README.

## New Efficiency Rules

Future manifests should include:

- `requirement_ids`
- `accepted_mvp_pass`
- `duration_minutes`
- `output_kind`
- `automation_efficiency.scale_signal`

Weekly calibration should use:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30
```

Scale decisions:

- Keep the 30-start/day schedule unless Bryan explicitly asks for cadence changes or evidence proves the schedule is hurting output.
- If conversion is below target, retarget toward implementation, tests, deployment proof, exact blockers, and high-risk requirements.
- If a QoL runner has no accepted evidence or exact blocker after seven days, sharpen its backlog item, handoff, or prompt instructions.
- If duration or dirty-worktree collisions repeatedly exceed the 48-minute spacing, reduce collision risk before adding starts.
- If blockers dominate, commit precise blockers and move adjacent work that can still produce evidence.
- If stretch target is exceeded with low collision risk, keep cadence stable and raise acceptance quality.

## Current Recommendation

Keep 30 starts/day. After the 2026-05-18 17:38 PT single-slot split, that means 30 active single-slot QoL automations rather than 10 compound automations. Do not add more starts now.

For the next 30 days, scale by evidence:

1. First week: require every QoL runner to produce at least one manifest with `accepted_mvp_pass`, `duration_minutes`, `output_kind`, and a clear scale signal.
2. Sundays: run the 30-day scorecard and retarget the next week in `docs/master-plan.md`, `docs/automation-memory.md`, and `docs/mvp-requirements-catalog.md`.
3. Daily: the first two accepted passes should remain implementation or verification heavy until the Day 7 alpha is accepted.
4. Stop broad design expansion unless it closes a concrete implementation ambiguity; the full Figma prototype page `98:2` is now available as the build reference.

## Validation

- `scripts/measure-automation-efficiency.ps1` ran successfully.
- At audit time, it reported 10 active QoL automations, 30 daily starts, 900 starts per 30 days, 48-minute minimum spacing, 60-pass minimum target, 90-pass stretch target, and 6.67/10 percent conversion thresholds. After the single-slot split, the same scorecard reports 30 active QoL automations, 30 daily starts, 900 starts per 30 days, and 48-minute minimum spacing.
- Follow-up validation should run `scripts/check-automation-contract.ps1`, JSON parse checks, conflict-marker scan, and `git diff --check`.
