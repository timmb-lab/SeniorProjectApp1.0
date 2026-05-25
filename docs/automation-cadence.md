# Automation Cadence

Date: 2026-05-24

Current active automation: Functionality UX Upgrade (`functionality-ux-upgrade-hourly`).

This is the only active automation contract documented by the repo. The repo no longer defines any other active automation cadence.

Active verification:

```powershell
npm run verify:functionality-ux-automation
```

The functionality UX verifier protects the prompt, growth ladder, growth ledger, JSON state, and this single-automation contract. `npm run check` also runs the same test through the aggregate project checks.

Do not add or document another active automation unless Bryan explicitly asks for it in a future task.
