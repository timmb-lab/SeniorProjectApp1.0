# Production Deployment Policy

Date: 2026-05-20

This policy defines which Senior Capstone surfaces are real production, which are internal QA, which are stakeholder review artifacts, and how generated output must be handled.

## Canonical Production

Canonical production app and backend:

- Cloudflare Pages project: `senior-capstone-app`
- Repo root deployed by `npm run deploy`
- Source root: `.`
- Backend: `functions/api/**`
- Config: `wrangler.jsonc`
- Purpose: secure hosted app/backend foundation for Senior Capstone workflows.

Canonical public companion site:

- Cloudflare Pages project: `senior-capstone-public`
- Generated output root: `public-companion/`
- Deploy script: `npm run deploy:public-site`
- Purpose: public student/family/staff guide only.

The app/backend project is the canonical operational product. The public companion is production-safe public guidance, but it is generated output and not the secure workflow app.

## Production Deploy Scripts

Production scripts:

- `npm run deploy`: deploys repo root to `senior-capstone-app`.
- `npm run deploy:public-site`: rebuilds and deploys `public-companion/` to `senior-capstone-public`.

Preview or review-only scripts:

- `npm run deploy:preview`: deploys the root app project to branch `alpha`; this is not the canonical production branch.
- `npm run deploy:option:titan`: deploys `stakeholder-options/titan-blend/` to `senior-capstone-option-titan`; review only.
- `npm run deploy:option:primary`: deploys `stakeholder-options/back-to-basics/` to `senior-capstone-option-primary`; review only.

Local dev scripts:

- `npm run dev`: root app/backend local Pages dev.
- `npm run dev:alpha`: internal alpha/QA local Pages dev.
- `npm run dev:public-site`: generated public companion local Pages dev.
- `npm run dev:option:titan`: stakeholder review local Pages dev.
- `npm run dev:option:primary`: stakeholder review local Pages dev.

## Pages Not Linked From Production Navigation

These pages must not be part of normal student/family production navigation:

- `alpha.html`
- `account.html`
- Any route with alpha reset/report controls
- Any fake account, `.test` account, seeded-persona, smoke-test, or internal run-report UI
- Any `stakeholder-options/**` page unless a stakeholder is intentionally reviewing a design direction

`app-preview.html` may remain linked only as a clearly labeled non-production workflow preview. It must not claim the secure app is finished or pilot-ready.

## Internal QA Only

Internal QA surfaces are for Bryan and testers:

- `alpha.html`, `alpha.js`, `alpha.css`
- `account.html`, `account.js`, `account.css`
- `/api/alpha/state`
- `/api/admin/test-accounts`
- fake `.test` role accounts and seeded alpha fixtures

Internal QA pages may include alpha, smoke, fake-account, seeded-record, and no-real-record warnings. They must not expose passwords, invite real student records, or be presented as proof of pilot readiness.

## Forbidden Production Copy

Production-classified public surfaces must not include visible copy or labels that suggest dev/test leakage, including:

- fake account
- smoke test
- seeded demo
- Day 7 Alpha
- alpha console
- reset alpha
- run report
- test account
- `.test account`
- localhost
- not pilot-ready
- prototype only
- stakeholder review direction
- Option 1
- Option 2
- product preview
- demo persona
- seeded persona
- no production accounts
- do not enter real student records
- MVP account check
- Open App Alpha

The production checker enforces these phrases only against production/public generated surfaces. Docs, tests, internal QA pages, stakeholder option artifacts, and fixtures may mention them when explaining boundaries.

## Generated Output

Generated output roots:

- `public-companion/`
- `stakeholder-options/titan-blend/`
- `stakeholder-options/back-to-basics/`

Source of truth:

- Root public pages, `app.js`, `styles.css`, `assets/`, and `templates/` feed `public-companion/` through `scripts/build-public-site.mjs`.
- `scripts/build-stakeholder-sites.mjs` is the source of truth for both stakeholder option directories.

Generated directories are tracked because each Cloudflare Pages project can deploy from its own root. Do not manually edit generated output as the source of truth. Change the source/build script, rebuild with `npm run build:site-options`, run `npm run check:site-options`, and commit source plus generated output together.

Generated public companion output must not proxy unlabeled internal alpha, account QA, or app API routes. `scripts/check-generated-output-drift.mjs` enforces that `public-companion/` still matches source expectations and that review option output keeps its stakeholder-only labels. Stakeholder option output may link to the internal alpha only with an explicit QA/internal label and must display that it is not canonical production.

## Stakeholder Options

`stakeholder-options/**` are review artifacts only. They are allowed to show visual-direction language such as Option 2 or Option 3 because that is the point of the artifact, but they are not canonical production and must be labeled as review options.

Do not deploy a stakeholder option as canonical production without a new Bryan decision and a follow-up pass that updates:

- this policy
- `docs/production-surface-registry.md`
- `docs/public-site.md`
- `docs/stakeholder-site-options.md`
- package deploy script descriptions if needed
- production-surface validation allowlists

## Validation

Required local validation for production-surface work:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:site-options
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Run `npm run inventory:production-routes` after route/deploy changes and commit the generated inventory when it changes.

Use `docs/production-predeploy-checklist.md` before pilot-facing deploys, custom-domain cutover, or any change that might expose internal QA surfaces.
