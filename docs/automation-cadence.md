# Automation Cadence

Date: 2026-05-24

Current active automation: Functionality UX Upgrade (`functionality-ux-upgrade-hourly`).

This is the only active automation contract documented by the repo. The repo no longer defines any other active automation cadence.

Intended cadence:

- Top-of-hour run: HH:00
- Bottom-of-hour run: HH:30

The Functionality UX Upgrade automation should run twice per hour: once at the top of the hour and once at the bottom of the hour.

GUI visibility:

- Codex Desktop currently discovers the GUI-visible automation from the local automation record at `%USERPROFILE%\.codex\automations\functionality-ux-upgrade-hourly\automation.toml`.
- Stable GUI identity fields are `id = "functionality-ux-upgrade-hourly"`, `name = "Functionality UX Upgrade"`, `status = "ACTIVE"`, and `cwds` containing `C:\SeniorProjectApp1.0`.
- The GUI prompt text must continue to reference `automation/prompts/functionality-ux-upgrade-hourly.md`.
- Repo files do not own the local GUI record directly, so repo changes must preserve the prompt path, heading, slug, and single active prompt file.

Active verification:

```powershell
npm run verify:functionality-ux-automation
```

The functionality UX verifier protects the prompt, growth ladder, growth ledger, JSON state, cadence wording, optional local GUI automation record when present, and this single-automation contract. `npm run check` also runs the same test through the aggregate project checks.

Do not add or document another active automation unless Bryan explicitly asks for it in a future task.
