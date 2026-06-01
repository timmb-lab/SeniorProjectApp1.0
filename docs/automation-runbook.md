# Automation Runbook

Current active automation: Functionality UX Upgrade (`functionality-ux-upgrade-hourly`).

## Source Files

- Prompt: `automation/prompts/functionality-ux-upgrade-hourly.md`
- Growth ladder: `docs/functionality-ux-growth-ladder.md`
- Growth ledger: `docs/functionality-ux-growth-ledger.md`
- State: `automation/state/functionality-ux-growth-state.json`
- Role readiness scorecard: `docs/product/demo-role-readiness.md`
- Cadence note: `docs/automation-cadence.md`

## Cadence And GUI Visibility

The intended cadence is HH:00 and HH:30. The Functionality UX Upgrade automation should run twice per hour: once at the top of the hour and once at the bottom of the hour.

The Codex Desktop GUI-visible record lives outside the repo in the local automation registry. Preserve the existing display name `Functionality UX Upgrade`, id `functionality-ux-upgrade-hourly`, working directory `C:\SeniorProjectApp1.0`, and prompt reference to `automation/prompts/functionality-ux-upgrade-hourly.md`. Normal steady-state is `ACTIVE`, but an intentional Bryan-requested `PAUSED` status is valid if it is reported honestly and the repo-side identity stays unchanged.

## Validation

Run:

```powershell
npm run verify:functionality-ux-automation
```

For PR readiness, use the project validation ladder requested by the current task. Do not run retired automation checks. When the run touches role visibility, seeded-data dependencies, click-through proof, or hosted permission readiness, refresh `docs/product/demo-role-readiness.md` alongside the ledger/state updates.

## Change Rule

Do not add, revive, or document any other active automation unless Bryan explicitly asks for it in a future task. Tracked automation docs and checks should point only to Functionality UX Upgrade.
