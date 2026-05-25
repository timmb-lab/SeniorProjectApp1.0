# Automation Guardrails

The only active automation for this repo is Functionality UX Upgrade (`functionality-ux-upgrade-hourly`).

The active prompt is:

- `automation/prompts/functionality-ux-upgrade-hourly.md`

The active state and handoff files are:

- `automation/state/functionality-ux-growth-state.json`
- `docs/functionality-ux-growth-ladder.md`
- `docs/functionality-ux-growth-ledger.md`
- `docs/automation-cadence.md`

Validate automation-contract changes with:

```powershell
npm run verify:functionality-ux-automation
```

Do not add, revive, or document another active automation unless Bryan explicitly requests it in a future task.
