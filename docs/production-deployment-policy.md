# Production Deployment Policy

Date: 2026-09-01

This policy defines how Capstone Project product surfaces, the East Tech guide, internal QA, and retired stakeholder outputs are deployed and validated.

## Canonical Product

Capstone Project is the official product title. Do not use "The Capstone Project" as the official title.

Canonical product app and backend:

- Cloudflare Pages project: `senior-capstone-app`
- Safe production bundle deployed by `npm run deploy`
- Deployment output: `.deploy-app/`
- Backend: `functions/api/**`
- Config: `wrangler.jsonc`
- Canonical workspace route: `/`
- Canonical product/app domain: `thecapstoneapp.com`
- Canonical alias: `www.thecapstoneapp.com` redirects to the apex
- Project-domain redirects: `thecapstoneproject.com` and `www.thecapstoneproject.com`
- Retired app/SSO hostname: `app.thecapstoneapp.com` must have no DNS record and must not be attached to Pages

The repo root includes public guide source files, but the isolated product deployment copies the authenticated workspace entry as its root page and excludes the guide pages. Product copy must stay school-agnostic. East Tech, ECTA, Titans, Las Vegas, and CCSD references belong in the guide/public content, not reusable app internals.

## East Tech Guide

Canonical public guide:

- Cloudflare Pages project: `senior-capstone-public`
- Generated output root: `public-companion/`
- Deploy script: `npm run deploy:public-site`
- Purpose: East Tech/Titans-specific Student Guide / Teacher Guide content only.
- East Tech guide future custom domain is `TBD`; Bryan will buy/configure it later.

The guide is production-safe public guidance for East Tech, but it is not the long-term Capstone Project product root.

## Custom Domain Policy

Canonical product/app state:

- `thecapstoneapp.com` -> `senior-capstone-app`
- `www.thecapstoneapp.com` -> permanent redirect to `thecapstoneapp.com`
- `thecapstoneproject.com` -> permanent redirect to the matching path on `thecapstoneapp.com`
- `www.thecapstoneproject.com` -> permanent redirect to the matching path on `thecapstoneapp.com`
- `senior-capstone-app.pages.dev` -> permanent redirect to `thecapstoneapp.com`
- `app.thecapstoneapp.com` -> retired, removed from DNS, and detached from Cloudflare Pages

Only the canonical apex and the three redirect custom domains may remain attached to the app Pages project. The canonical Google OAuth redirect URI is `https://thecapstoneapp.com/api/auth/google/callback`; Google Workspace sign-in remains disabled unless separately approved and configured.

Cloudflare Pages custom-domain association is required before any hostname is considered cut over. DNS or CNAME evidence alone is not enough. Verify with the Pages Domains API or the Cloudflare dashboard Custom domains page before claiming live production-domain success.

Do not use `_redirects` as a domain-level redirect mechanism and do not use `_redirects` as a security boundary for `/api/*`, `alpha.html`, `account.html`, or internal QA API routes. `_redirects` applies to static asset responses, while Pages Functions routing is controlled by file routes plus `_routes.json`; `_routes.json` `exclude` rules have priority over `include` rules.

## Retired Stakeholder Options

`Titan Blend` and `Back To Basics` are retired as active stakeholder options. Titan visual direction is absorbed into the East Tech guide theme.

Retired technical artifacts:

- `old/stakeholder-options/titan-blend/`
- `old/stakeholder-options/back-to-basics/`
- `old/scripts/build-stakeholder-sites.mjs`
- `senior-capstone-option-titan`
- `senior-capstone-option-primary`

The historical directories are archived as non-deployed review history. The active package scripts `build:stakeholder-sites`, `build:site-options`, `dev:option:titan`, `dev:option:primary`, `deploy:option:titan`, and `deploy:option:primary` must not exist. `check:site-options` validates that retired options are not active deploy targets.

Cloudflare cleanup for `senior-capstone-option-titan` and `senior-capstone-option-primary` is manual follow-up unless live tooling verifies deletion/disablement.

## Production Deploy Scripts

Production scripts:

- `npm run deploy`: builds `.deploy-app/` and deploys only that safe production bundle to `senior-capstone-app`.
- `npm run deploy:public-site`: rebuilds and deploys `public-companion/` to `senior-capstone-public`.

Preview/internal scripts:

- `npm run deploy:preview`: deploys the root app project to branch `alpha`; this is not the canonical production branch.
- `npm run dev`: root app/backend local Pages dev.
- `npm run dev:alpha`: internal alpha/QA local Pages dev.
- `npm run dev:public-site`: generated East Tech guide local Pages dev.

## Pages Not Linked From Production Navigation

These pages must not be part of normal student/family production navigation:

- `alpha.html`
- `account.html`
- Any route with alpha reset/report controls
- Any fake account, `.test` account, seeded-persona, smoke-test, or internal run-report UI
- Any `old/stakeholder-options/**` page

`app-preview.html` may remain linked only as a clearly labeled workflow preview. It must not claim the secure app is finished or pilot-ready.

## Internal QA Only

Internal QA surfaces are for Bryan and testers:

- `alpha.html`, `alpha.js`, `alpha.css`
- `account.html`, `account.js`, `account.css`
- `/api/alpha/state`
- `/api/admin/test-accounts`
- fake `.test` role accounts and seeded alpha fixtures

Internal QA pages may include alpha, smoke, fake-account, seeded-record, and no-real-record warnings. They must not expose passwords, invite real student records, or be presented as proof of pilot readiness.

Current enforceable alpha/account deployment policy is Option C from `docs/alpha-account-deployment-decision.md`: the files remain in source for local QA, but the production bundle excludes them and production middleware returns 404 for their routes.

## Generated Output

Generated output root:

- `public-companion/`

Source of truth:

- Root public pages, `app.js`, `styles.css`, `assets/`, and `templates/` feed `public-companion/` through `scripts/build-public-site.mjs`.

Generated public guide output must not proxy unlabeled internal alpha, account QA, or app API routes. `scripts/check-generated-output-drift.mjs` enforces that `public-companion/` still matches source expectations. Retired stakeholder output is checked by `scripts/check-site-options.mjs` as historical only, not as deterministic active deploy output.

## Validation

Required local validation for production-surface work:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:site-options
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:custom-domain-cutover
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:alpha-account-gating
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Run `npm run inventory:production-routes` after route/deploy changes and commit the generated inventory when it changes.

Use `docs/production-predeploy-checklist.md` before pilot-facing deploys, custom-domain cutover, or any change that might expose internal QA surfaces.
