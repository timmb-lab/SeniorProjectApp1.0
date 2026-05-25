# Automation Runbook

Current active automation: Functionality UX Upgrade (`functionality-ux-upgrade-hourly`).

## Source Files

- Prompt: `automation/prompts/functionality-ux-upgrade-hourly.md`
- Growth ladder: `docs/functionality-ux-growth-ladder.md`
- Growth ledger: `docs/functionality-ux-growth-ledger.md`
- State: `automation/state/functionality-ux-growth-state.json`
- Cadence note: `docs/automation-cadence.md`

## Validation

Run:

```powershell
npm run verify:functionality-ux-automation
```

For PR readiness, use the project validation ladder requested by the current task. Do not run retired automation checks.

## Change Rule

Do not add, revive, or document any other active automation unless Bryan explicitly asks for it in a future task. Tracked automation docs and checks should point only to Functionality UX Upgrade.
