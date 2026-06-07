# Production Surface 100-Pass Report

Date: 2026-05-20

## Identity

- `repo root`: `C:/SeniorProjectApp1.0`
- `branch before`: `main`
- `branch after`: `main`
- `origin`: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`
- `start commit`: `35f44b2 rebuild: show review history in account smoke (MVP-015)`
- `end commit`: pending final commit SHA; final response records the exact pushed end commit because a committed file cannot contain its own commit hash.

## Pass Summary

- `accepted passes completed`: 35
- `target passes`: 100
- `stopped early`: yes
- `stop reason`: Local production-surface classification, fencing, generated-output rebuild, route inventory, and validation checks passed. Live Cloudflare verification remains blocked without `CLOUDFLARE_API_TOKEN`.
- `commits made`: pending final commit.

## Surfaces Inventoried

- Root HTML entry points: 31
- Public companion generated HTML entry points: 26
- Stakeholder option generated HTML entry points: 38
- API routes under `functions/api`: 28
- Deploy/dev scripts classified from `package.json`: 10
- Wrangler project configs: 4
- Generated output roots: 3

## Production Classification

- `production`: root public guide pages, `app-preview.html` as a non-production workflow preview, production app/backend API routes, `senior-capstone-app`, and `senior-capstone-public` public companion deploy.
- `internal-alpha`: `alpha.html`, `alpha.js`, `alpha.css`, `/api/alpha/state`, and `deploy:preview`.
- `internal-smoke`: `account.html`, `account.js`, `account.css`, and `/api/admin/test-accounts`.
- `stakeholder-review`: `old/stakeholder-options/titan-blend/**`, `old/stakeholder-options/back-to-basics/**`, `deploy:option:titan`, and `deploy:option:primary`.
- `generated-output`: `public-companion/**`, archived stakeholder option output roots, and `docs/generated/production-route-inventory.md`.
- `legacy`: `old/legacy-redirects/audit.html` and `old/legacy-redirects/roadmap.html` redirects.
- `unknown`: none in the committed route inventory.

## Main Fixes

- Created `docs/production-surface-registry.md` with deploy target, route, API, generated-output, and validation classifications.
- Created `docs/production-deployment-policy.md` defining canonical production, internal QA, stakeholder review, generated output, forbidden production copy, and deploy-script intent.
- Added `scripts/check-production-surfaces.mjs` and wired `check:production-surfaces` into the aggregate `check` rail.
- Added `scripts/inventory-production-routes.mjs`, `inventory:production-routes`, `check:route-inventory`, and committed deterministic inventory output.
- Removed alpha/account smoke links from normal public navigation and public companion output.
- Renamed public "Product App Preview" copy to "App Workflow Preview" with explicit non-production boundary language.
- Tightened `alpha.html` and `account.html` copy as internal QA only with no real student records.
- Removed generated public-companion proxy redirects for alpha/account/API routes.
- Added stakeholder option review banners and relabeled alpha links as internal QA.
- Updated README, public-site docs, stakeholder-option docs, backend setup, master plan, human decisions, and MVP catalog with the production-surface boundary.
- Updated tests to enforce that account/alpha routes stay out of production public navigation.

## Production Leakage

Found:

- Root app navigation linked `alpha.html` and `account.html` as normal public paths.
- Home/support cards presented account smoke as a normal support.
- Public companion generated output inherited those labels and links.
- Stakeholder options linked `Open App Alpha` and footer `App Alpha` without an internal QA label.
- Generated public companion `_redirects` proxied alpha/API paths to the app project.
- README presented alpha/smoke routes alongside public website instructions.

Fixed:

- Normal public navigation no longer links alpha/account routes.
- Public companion output no longer proxies alpha/account/API routes.
- Stakeholder options are visibly review-only and alpha links are labeled internal QA.
- Production leak checker now fails on forbidden production phrases.

## Validation Results

- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces` -> pass; 87 production text surfaces scanned.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory` -> pass; inventory current.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:site-options` -> pass; 3 generated roots checked.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare` -> pass for static config; live verification blocked because `CLOUDFLARE_API_TOKEN` is not set.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 test` -> pass; 115 tests.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check` -> pass; includes alpha contract, cadence, production surfaces, route inventory, site options, Cloudflare static checks, tests, and typecheck.
- `git diff --check` -> pass.

## Remaining Blockers

- Live Cloudflare Pages/D1 verification still needs `CLOUDFLARE_API_TOKEN`.
- Bryan must choose final custom-domain mapping for the app/public guide.
- Bryan must decide whether alpha/account QA pages stay deployed unlinked, move behind a gate, or are removed before pilot.
- Bryan must decide whether to retain, retire, or promote stakeholder options after review.

## Next 10 Recommended Passes

1. Add a pre-deploy checklist that requires `check:production-surfaces`, `check:route-inventory`, `check:site-options`, and `check:cloudflare`.
2. Decide and document final custom-domain routing for app vs public companion.
3. Add an access gate or deployment exclusion plan for `alpha.html` and `account.html` before real pilot records.
4. Add a CI assertion that `public-companion/_redirects` never proxies internal alpha/account/API routes.
5. Extend production-surface checker to scan selected rendered text from HTML/JS bundles if the app splits routes later.
6. Add stakeholder-option retirement/promote workflow once Bryan picks a direction.
7. Add a generated-output drift check for `public-companion/**` and `old/stakeholder-options/**`.
8. Add live Cloudflare verification once `CLOUDFLARE_API_TOKEN` is available.
9. Add real custom-domain checklist and post-cutover verification commands.
10. Confirm no external analytics/bookmarks still need root `audit.html` or `roadmap.html`; both shells are now archived under `old/legacy-redirects/`.

## Final Safety Check

- `no real student data exposed`: pass based on local scans and existing tests.
- `no fake passwords committed`: pass; account smoke test still avoids password storage and `.secrets/` remains ignored.
- `alpha/smoke pages fenced`: pass; removed from normal public navigation and labeled internal QA.
- `stakeholder options labeled`: pass; generated review banner added.
- `production leak checker added/passing`: pass.
- `canonical production deploy target documented`: pass.
