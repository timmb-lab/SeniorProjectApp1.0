# Production Deployment Policy

Date: 2026-05-21

This policy defines how Capstone Project product surfaces, the East Tech guide, internal QA, and retired stakeholder outputs are deployed and validated.

## Canonical Product

Capstone Project is the official product title. Do not use "The Capstone Project" as the official title.

Canonical product app and backend:

- Cloudflare Pages project: `senior-capstone-app`
- Repo root deployed by `npm run deploy`
- Source root: `.`
- Backend: `functions/api/**`
- Config: `wrangler.jsonc`
- Canonical workspace route: `workspace.html`
- Product/app target domain: `thecapstoneproject.com`
- Product alias if configured: `www.thecapstoneproject.com`
- Optional app split hostname only if needed: `app.thecapstoneproject.com`

The repo root includes public guide source files, but the product target root redirects to the authenticated workspace through root `_redirects`. Product copy must stay school-agnostic. East Tech, ECTA, Titans, Las Vegas, and CCSD references belong in the guide/public content, not reusable app internals.

## East Tech Guide

Canonical public guide:

- Cloudflare Pages project: `senior-capstone-public`
- Generated output root: `public-companion/`
- Deploy script: `npm run deploy:public-site`
- Purpose: East Tech/Titans-specific Student Guide / Teacher Guide content only.
- East Tech guide future custom domain is `TBD`; Bryan will buy/configure it later.

The guide is production-safe public guidance for East Tech, but it is not the long-term Capstone Project product root.

## Custom Domain Policy

Product/app target:

- `thecapstoneproject.com` -> `senior-capstone-app`
- `www.thecapstoneproject.com` -> `senior-capstone-app` if alias is configured
- `app.thecapstoneproject.com` -> optional only if a later split remains required

Current legacy state:

- `thecapstoneapp.com` and `www.thecapstoneapp.com` are legacy/current public guide hostnames pending migration.
- `app.thecapstoneapp.com` is the current legacy app hostname and current Google Workspace SSO redirect host.
- Current Google OAuth redirect URI remains `https://app.thecapstoneapp.com/api/auth/google/callback` until a later Cloudflare plus Google OAuth redirect URI cutover adds the exact new URI in Google Cloud and Cloudflare env/secrets.

Cloudflare Pages custom-domain association is required before any hostname is considered cut over. DNS or CNAME evidence alone is not enough. Verify with the Pages Domains API or the Cloudflare dashboard Custom domains page before claiming live production-domain success.

Do not use `_redirects` as a domain-level redirect mechanism and do not use `_redirects` as a security boundary for `/api/*`, `alpha.html`, `account.html`, or internal QA API routes. `_redirects` applies to static asset responses, while Pages Functions routing is controlled by file routes plus `_routes.json`; `_routes.json` `exclude` rules have priority over `include` rules.

## Retired Stakeholder Options

`Titan Blend` and `Back To Basics` are retired as active stakeholder options. Titan visual direction is absorbed into the East Tech guide theme.

Retired technical artifacts:

- `stakeholder-options/titan-blend/`
- `stakeholder-options/back-to-basics/`
- `senior-capstone-option-titan`
- `senior-capstone-option-primary`

The historical directories may remain temporarily as non-deployed review history. The active package scripts `build:stakeholder-sites`, `build:site-options`, `dev:option:titan`, `dev:option:primary`, `deploy:option:titan`, and `deploy:option:primary` must not exist. `check:site-options` validates that retired options are not active deploy targets.

Cloudflare cleanup for `senior-capstone-option-titan` and `senior-capstone-option-primary` is manual follow-up unless live tooling verifies deletion/disablement.

## Production Deploy Scripts

Production scripts:

- `npm run deploy`: deploys repo root to `senior-capstone-app`.
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
- Any `stakeholder-options/**` page

`app-preview.html` may remain linked only as a clearly labeled workflow preview. It must not claim the secure app is finished or pilot-ready.

## Internal QA Only

Internal QA surfaces are for Bryan and testers:

- `alpha.html`, `alpha.js`, `alpha.css`
- `account.html`, `account.js`, `account.css`
- `/api/alpha/state`
- `/api/admin/test-accounts`
- fake `.test` role accounts and seeded alpha fixtures

Internal QA pages may include alpha, smoke, fake-account, seeded-record, and no-real-record warnings. They must not expose passwords, invite real student records, or be presented as proof of pilot readiness.

Current enforceable alpha/account deployment policy is Option A safety from `docs/alpha-account-deployment-decision.md`: deployed from the app project, unlinked from normal production navigation, internal-labeled, and fake `.test` only. Option B or C remains open before broader pilot unless Bryan explicitly accepts direct URL exposure.

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
