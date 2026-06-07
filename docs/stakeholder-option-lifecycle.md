# Stakeholder Option Lifecycle

Date: 2026-05-21

Final decision: stakeholder option comparison is over.

## Locked Outcome

- Official product title is Capstone Project.
- `Titan Blend` is retired as an active option.
- `Back To Basics` is retired as an active option.
- Titan visual direction is absorbed into the East Tech Senior Capstone Guide.
- The East Tech guide remains school-specific public content.
- Capstone Project product/app remains school-agnostic and tenant-ready.

## Repo State

Retired historical roots:

- `old/stakeholder-options/titan-blend/`
- `old/stakeholder-options/back-to-basics/`

Retired Cloudflare Pages project names:

- `senior-capstone-option-titan`
- `senior-capstone-option-primary`

The directories are archived as historical review output, but they are not active deploy targets and must not be linked from normal product or guide navigation.

Removed active package scripts:

- `build:stakeholder-sites`
- `build:site-options`
- `dev:option:titan`
- `dev:option:primary`
- `deploy:option:titan`
- `deploy:option:primary`

Retained validation:

```powershell
npm run check:site-options
```

That checker now validates retirement state, not active option generation.

Archived generator:

- `old/scripts/build-stakeholder-sites.mjs`

## Cloudflare Follow-Up

Cloudflare option project cleanup is a manual follow-up unless live tooling verifies it in a dedicated pass. Safe cleanup choices are:

- disable the retired Pages projects;
- delete them after confirming no needed historical artifact is lost;
- leave them unlinked and unmapped while documenting them as historical only.

Do not map retired option projects to:

- `thecapstoneproject.com`
- `www.thecapstoneproject.com`
- `app.thecapstoneproject.com`
- any future East Tech guide custom domain

## Future Design Work

Future East Tech guide design work should happen in the canonical guide source:

- `index.html`
- public route HTML files
- `app.js`
- `styles.css`
- `assets/`
- `templates/`
- generated `public-companion/`

Do not revive stakeholder option labels as normal production modes.
