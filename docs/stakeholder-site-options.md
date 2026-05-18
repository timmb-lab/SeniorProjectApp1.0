# Stakeholder Site Options

Date: 2026-05-18

The stakeholder review set has three public website directions that use the same Senior Capstone content model but different visual systems.

## Options

- Option 1, current companion: `senior-capstone-public`
- Option 2, Titan Blend: `senior-capstone-option-titan`
- Option 3, Back To Basics: `senior-capstone-option-primary`

## Review URLs

- Option 1: `https://senior-capstone-public.pages.dev/`
- Option 2: `https://senior-capstone-option-titan.pages.dev/`
- Option 3: `https://senior-capstone-option-primary.pages.dev/`

## Local Build

```powershell
npm run build:site-options
```

This builds:

- `public-companion/` for Option 1
- `stakeholder-options/titan-blend/` for Option 2
- `stakeholder-options/back-to-basics/` for Option 3

The two stakeholder option roots are intentionally tracked. Cloudflare deploys each from its own root folder so they do not inherit the app project's root `wrangler.jsonc`, Pages Functions, D1 bindings, or private app configuration.

## Visual Direction

Option 2, Titan Blend, uses a more polished pathway-dashboard layout with Titan navy, gold, red, and teal/green accents blended into a professional stakeholder presentation.

Option 3, Back To Basics, uses primary colors, high-contrast outlines, classroom grid energy, and simple page structure for a friendly student and family feel.

## App Boundary

All stakeholder option sites remain public-only. Links that need the working alpha flow point to:

```text
https://senior-capstone-app.pages.dev/alpha.html
```

Do not expose credentials, seeded account passwords, D1 details, Google Drive IDs, or protected student data on these public option sites.
