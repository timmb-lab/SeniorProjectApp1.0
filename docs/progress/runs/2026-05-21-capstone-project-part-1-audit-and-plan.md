# Capstone Project Final Consolidation - Part 1 Audit And Plan

Date/time: 2026-05-21 16:13 PT

Part 1 scope: evidence audit, Bryan decision lock, current-state/target-state matrix, Part 2 implementation plan, and safe validation only. No broad rename, production behavior change, Cloudflare project rename, D1 rename, auth rewrite, checker rewrite, stakeholder directory deletion, or generated-output churn was performed in this Part 1 artifact.

## Identity

Step 0 exact command output:

```text
> pwd
C:\SeniorProjectApp1.0

> git rev-parse --show-toplevel
C:/SeniorProjectApp1.0

> git branch --show-current
main

> git remote -v
origin  https://github.com/timmb-lab/SeniorProjectApp1.0.git (fetch)
origin  https://github.com/timmb-lab/SeniorProjectApp1.0.git (push)

> git status --short

> git status --branch
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

> git rev-parse HEAD
6c9e8a4a4d42893699a5ce268767b8805c208bff

> node --version
v24.15.0

> npm --version
11.12.1
```

Fast-forward pull:

```text
> git pull --ff-only origin main
Already up to date.
From https://github.com/timmb-lab/SeniorProjectApp1.0
 * branch            main       -> FETCH_HEAD
```

Required local files were present: `package.json`, `wrangler.jsonc`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, and `docs/production-surface-registry.md`.

GitHub connector readback: repository `timmb-lab/SeniorProjectApp1.0`, clone URL `https://github.com/timmb-lab/SeniorProjectApp1.0.git`, default branch `main`, public visibility, current connector permissions include push/admin. This does not override branch protection if GitHub rejects a push.

## Official Documentation Checked

Cloudflare official docs checked:

- Pages Wrangler configuration: https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- Pages build configuration: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Pages Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Pages redirects: https://developers.cloudflare.com/pages/configuration/redirects/
- Pages Functions routing: https://developers.cloudflare.com/pages/functions/routing/
- D1 Wrangler commands: https://developers.cloudflare.com/d1/wrangler-commands/
- API token permissions: https://developers.cloudflare.com/fundamentals/api/reference/permissions/

Practical Cloudflare constraints extracted:

- `wrangler.jsonc` plus `pages_build_output_dir` is production-affecting Pages configuration; do not edit it casually.
- Pages build command/output directory and root directory are Cloudflare project settings or Wrangler deployment inputs; repo text alone does not prove dashboard state.
- Git-integrated Pages projects can auto-deploy on pushes, but that Cloudflare-side integration does not give the local shell API credentials.
- `_redirects` belongs in the deployed static output directory and does not apply to Pages Functions routes.
- Pages Functions use file-based routing under `functions/`; API/auth behavior must be changed in function code, not by redirect files.
- D1 bindings and migrations are tied to configured database names/IDs; remote migration application requires explicit Wrangler/API action.
- Live Cloudflare verification depends on a valid token and sufficient scopes; local static checks can pass without proving remote domain, Pages, D1, DNS, TLS, or deployed route state.

GitHub official docs checked:

- Protected branches and required status checks: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Managing branches/default branch: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository

Practical GitHub constraints extracted:

- `main` is the default branch for this repo, but default branch identity should be verified rather than inferred from local checkout.
- Protected branches can block force pushes, direct pushes, merge commits, or pushes without required checks.
- Required checks must be successful, skipped, or neutral before protected-branch changes are accepted.
- If direct push is rejected, Part 2 should not force push; it should switch to a branch/PR fallback.

OpenAI/Codex official docs checked:

- Codex CLI: https://developers.openai.com/codex/cli
- Codex web/cloud: https://developers.openai.com/codex/cloud

Practical Codex constraints extracted:

- Codex can read, change, and run code in the selected directory, so repo root and branch validation must be explicit before edits.
- Codex cloud works with connected GitHub repositories and can create pull requests, so local GitHub identity and remote URL should be recorded before pushing.
- The OpenAI docs MCP was not exposed in the current tool list after tool discovery; official OpenAI Developers pages were used as fallback.

## Repo Files Inspected

Core files inspected: `package.json`, `wrangler.jsonc`, `README.md`.

Planning and policy docs inspected: `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/production-surface-registry.md`, `docs/production-deployment-policy.md`, `docs/production-predeploy-checklist.md`, `docs/stakeholder-option-lifecycle.md`, `docs/public-site.md`, `docs/source-materials/production-content-crosswalk.md`, `docs/generated/production-route-inventory.md`, `docs/progress/run-log.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/human-decisions.md`, `docs/artifacts.json`, `docs/architecture/adr-0002-tenant-google-workspace-sso-and-storage.md`, `docs/progress/runs/2026-05-21-1548-tenant-sso-role-dashboard.json`.

Automation docs inspected: `docs/automation-cadence.md`, `docs/automation-memory.md`, `docs/automation-runbook.md`, `docs/automation-milestones.md`.

Frontend/source inspected: `index.html`, `app.js`, `styles.css`, `workspace.html`, `workspace.js`, `workspace.css`, `alpha.html`, `alpha.js`, `account.html`, `account.js`, `app-preview.html`.

Generated/public/stakeholder surfaces inspected: `public-companion/`, `stakeholder-options/titan-blend/`, `stakeholder-options/back-to-basics/`.

Scripts/checkers inspected: `scripts/build-public-site.mjs`, `scripts/build-stakeholder-sites.mjs`, `scripts/check-production-surfaces.mjs`, `scripts/check-generated-output-drift.mjs`, `scripts/check-site-options.mjs`, `scripts/inventory-production-routes.mjs`, `scripts/check-cloudflare.mjs`, `scripts/check-custom-domain-cutover.mjs`, `scripts/check-production-cutover.mjs`, `scripts/run-npm-script.ps1`, `scripts/run-node-script.ps1`.

Tests inspected by inventory/search: dashboard integration tests, Google SSO integration tests, workspace tests, production workflow/source tests, generated-output and site-option tests, custom-domain cutover tests, Cloudflare/Drive live checker tests.

Additional protected baseline files were present: `migrations/0010_tenant_google_sso.sql`, `functions/api/admin/dashboard.ts`, `functions/api/program-teacher/dashboard.ts`, `functions/api/mentor/dashboard.ts`, `functions/api/auth/config.ts`, `functions/api/auth/google/start.ts`, `functions/api/auth/google/callback.ts`, `tests/admin-dashboard.integration.test.mjs`, `tests/program-teacher-dashboard.integration.test.mjs`, `tests/mentor-dashboard.integration.test.mjs`, `tests/google-sso.integration.test.mjs`, and ADR-0002 at `docs/architecture/adr-0002-tenant-google-workspace-sso-and-storage.md`.

Missing required files: none.

## Protected Baseline From 6c9e8a4

`git show --name-status --format='%H%n%P%n%s' 6c9e8a4a4d42893699a5ce268767b8805c208bff` showed:

- Commit: `6c9e8a4a4d42893699a5ce268767b8805c208bff`
- Parent: `c340cf0ae890d802d9d9bbb5ece46eedfcba8da9`
- Message: `mvp: build tenant-aware role dashboards`

Files added by the protected baseline: `docs/architecture/adr-0002-tenant-google-workspace-sso-and-storage.md`, `docs/progress/runs/2026-05-21-1548-tenant-sso-role-dashboard.json`, `functions/_lib/auth-config.ts`, `functions/_lib/google-oauth.ts`, `functions/_lib/oauth-state.ts`, `functions/api/admin/dashboard.ts`, `functions/api/auth/config.ts`, `functions/api/auth/google/callback.ts`, `functions/api/auth/google/start.ts`, `functions/api/mentor/dashboard.ts`, `functions/api/program-teacher/dashboard.ts`, `migrations/0010_tenant_google_sso.sql`, `tests/admin-dashboard.integration.test.mjs`, `tests/google-sso.integration.test.mjs`, `tests/helpers/auth-fixtures.mjs`, `tests/helpers/d1-sqlite.mjs`, `tests/mentor-dashboard.integration.test.mjs`, and `tests/program-teacher-dashboard.integration.test.mjs`.

Files modified by the protected baseline: `docs/backend-setup.md`, `docs/generated/production-route-inventory.md`, `docs/human-decisions.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/progress/handoffs.md`, `docs/progress/run-log.md`, `functions/_lib/permissions.ts`, `functions/_types.ts`, `tests/permissions-access.test.mjs`, `tests/workspace-app.test.mjs`, `workspace.css`, and `workspace.js`.

Protected behavior/current functionality: ABC/primary-color CSS tokens, role-aware workspace theme modifiers, command-center cards, D1-backed admin/program-teacher/mentor dashboards, `/api/admin/dashboard`, `/api/program-teacher/dashboard`, `/api/mentor/dashboard`, `/api/auth/config`, Google SSO start/callback fail-closed scaffold, hashed OAuth state/nonce, Google ID-token and hosted-domain validation, local fallback auth, fake `.test` support, viewer role context helpers, aggregate/dashboard permission gates, scoped teacher student resolution helpers, migration `0010`, dashboard/SSO tests, route inventory updates, and ADR-0002. Part 2 must preserve this behavior.

## Decision Locks Confirmed

- Official product title: `Capstone Project`.
- Do not use official `The Capstone Project`.
- Product/app target domain: `thecapstoneproject.com`.
- `www.thecapstoneproject.com` may be an alias if configured later.
- `app.thecapstoneproject.com` may be used only if a subdomain split remains required.
- East Tech guide future custom domain: TBD; do not invent it.
- Product/app is school-agnostic, reusable, multi-school, nonprofit/SaaS-style, and tenant-ready.
- East Tech/Titan branding belongs only to the East Tech public guide/school-specific surface.
- East Tech guide is not the long-term product root.
- Stakeholder comparison is over.
- `Titan Blend` and `Back To Basics` are retired as active options.
- Titan visual direction should be absorbed into East Tech guide branding.
- Do not rewrite auth, D1, evidence, role permissions, API architecture, or automation cadence.
- If technical rename is risky, defer and document.
- Repo edits do not equal Cloudflare dashboard changes.
- Do not claim Cloudflare custom domains changed unless verified live.
- Do not claim `thecapstoneproject.com` is live unless verified live.
- Do not force push.
- Do not commit secrets or fake account passwords.

## Current-State Vs Target-State Summary

Durable matrix: `docs/progress/runs/2026-05-21-capstone-project-part-1-current-target-matrix.md`.

Most important current-state facts:

- Product copy is still mixed across `Senior Capstone`, `Senior Capstone Project`, `Senior Project Workspace`, and a small number of `The Capstone App` references.
- Current repo domain config and custom-domain checker target `thecapstoneapp.com`, `www.thecapstoneapp.com`, and `app.thecapstoneapp.com`.
- `thecapstoneproject.com`, `www.thecapstoneproject.com`, and `app.thecapstoneproject.com` do not appear in the repo yet.
- Technical IDs currently include `SeniorProjectApp1.0`, `senior-capstone-app`, `senior-capstone-public`, `senior-capstone-option-titan`, `senior-capstone-option-primary`, and `senior-capstone-db`.
- Technical IDs should not be assumed wrong. D1, Cloudflare project names, repo path, package name, and cookie name are deferred unless Part 2 can prove a safe low-risk change.
- Public guide generated output is deterministic and currently includes East Tech/Titan content and Student/Teacher guide toggle markers.
- Stakeholder option directories and deploy/dev scripts remain active even though Bryan has retired the options as active choices.
- Current old-domain live verification for `thecapstoneapp.com` passed during this audit, but target-domain live status is unknown/pending.

## Search Inventory Summary

Search command pattern: `rg --fixed-strings --count-matches --glob '!node_modules/**' --glob '!vendor/**' -- "<term>"`.

Counts are `matches/files`.

Old product names:

- `Capstone App`: 24/16; important files include `alpha.html`, `account.html`, `scripts/check-custom-domain-cutover.mjs`, `docs/artifacts.json`, `docs/backend-setup.md`, `docs/master-plan.md`.
- `The Capstone App`: 2/2; important files include `docs/progress/run-log.md`, `docs/progress/runs/2026-05-21-real-staff-account-setup.json`.
- `Senior Capstone App`: 21/14; important files include `alpha.html`, `account.html`, `docs/artifacts.json`, `docs/backend-setup.md`, `docs/master-plan.md`.
- `Senior Project App`: 20/10; important files include automation ledger/prompts, `scripts/seed-local-workspace-smoke.mjs`, design docs, progress docs.
- `SeniorProjectApp`: 101/43; mostly technical/path/automation/history references.
- `SeniorProjectApp1.0`: 97/40; mostly repo path/automation/script guard references.
- `capstone app`, `the capstone app`, and `Capstone Portal`: 0.

New product name:

- `Capstone Project`: 133/98; already present in public guide and generated output.
- `The Capstone Project`: 0.

Old domains:

- `thecapstoneapp.com`: 169/23; important files include `config/production-domains.json`, `README.md`, `tests/custom-domain-cutover.test.mjs`, ADR-0002, Google SSO tests, custom-domain checklist, human decisions.
- `www.thecapstoneapp.com`: 36/16; important files include domain config, README, custom-domain checker/tests/docs.
- `app.thecapstoneapp.com`: 64/21; important files include domain config, README, alpha/account gating, custom-domain checker, backend setup, human decisions, Google SSO redirect docs/tests.

New domains:

- `thecapstoneproject.com`: 0.
- `www.thecapstoneproject.com`: 0.
- `app.thecapstoneproject.com`: 0.

Stakeholder/option state:

- `stakeholder-options`: 88/18.
- `titan-blend`: 43/15.
- `back-to-basics`: 41/14.
- `senior-capstone-option-titan`: 60/23.
- `senior-capstone-option-primary`: 60/23.
- `stakeholder review`: 25/17.
- `visual direction`: 8/5.
- `option site`: 7/3.
- `review artifact`: 14/9.
- `generated option`: 1/1.
- `app-preview`: 167/64.
- `public-companion`: 123/34.
- Common generic terms also hit many files: `comparison` 20/13, `choose` 92/33, `variant` 140/40, `prototype` 141/32, `preview` 389/121, `demo` 135/43, `mock` 75/35.

East Tech/Titan references:

- `East Tech`: 22/6; concentrated in guide/app source/templates.
- `East Career`: 45/45; public guide and generated outputs.
- `ECTA`: 91/54; public guide, generated outputs, and automation/history.
- `titan`: 131/34; public guide, stakeholder option scripts/outputs, docs, config.
- `Titans`, `titan-blue`, `titan-silver`, `Las Vegas`, `CCSD`: 0.

Forbidden production copy categories:

- Internal QA terms are present but mostly allowed in alpha/account/tests/docs/checkers: `internal alpha` 29/16, `QA only` 7/7, `QA console` 3/3, `smoke test` 16/14, `seeded demo` 13/9, `seeded persona` 9/8, `fake .test` 105/48, `test account` 74/51.
- Public preview terms are present and need Part 2 review: `non-production preview` 5/4, `preview-only` 7/5, `app boundary` 6/4, `app-preview` 167/64.
- Automation/history terms are present and usually allowed in docs/automation/tests: `Codex` 93/44, `builder` 1023/122, `automation prompt` 14/8, `run report` 15/15.
- Quality placeholder terms are low count and mostly checker/docs/tests: `TODO` 6/6, `FIXME` 5/5, `placeholder` 25/17, `lorem ipsum` 2/2, `dummy data` 2/2, `fake data` 2/2.
- Secret/security terms are mostly variable names or guardrails, not values: `setup key` 11/8, `token` 925/113, `API secret` 2/2, `raw Drive storage IDs` 3/3, `stack traces` 4/4, `debug` 13/11.

Important classifications:

- Rename in Part 2: product-facing `Senior Project Workspace`, top-level README/master-plan/catalog product copy, old domain target docs/checkers.
- Allowed technical legacy ID: repo name/path, package name for now, Wrangler project names, D1 database name/ID, session cookie name, automation IDs, historical run manifests.
- Allowed historical doc: previous run logs/manifests that record what happened at the time.
- Allowed internal QA reference: alpha/account/test/checker copy that is not normal production navigation.
- Allowed East Tech guide branding: public guide, public generated output, source materials/templates.
- Product/app leakage to fix: East Tech/Titan/Senior Project wording in `workspace.html` and `workspace.js` where it presents the school-agnostic app.
- Stakeholder retirement update: active option scripts, generated option dirs/docs/checkers/tests.
- Deferred/risky: Cloudflare project rename, D1 rename, repo rename, local path/package rename unless proven safe.

## Package Script Audit

Keep unchanged or defer:

- `dev`, `dev:alpha`, `deploy`, `deploy:preview`, `db:migrate:local`, `db:migrate:remote`, `check:alpha`, `check:alpha-contract`, `check:automation`, `check:predeploy-gate`, `check:production-surfaces`, `check:route-inventory`, `check:cloudflare`, `check:cloudflare:live`, `check:custom-domain-cutover`, `check:alpha-account-gating`, `check:production-cutover`, `check:drive:live`, `check:workspace:hosted-evidence`, `check:workspace:hosted-dashboard`, `check:workspace:hosted-permissions`, owner-admin scripts, automation cadence/QoL scripts, `inventory:production-routes`, `typecheck`, `types`, `test`.

Update in Part 2:

- `build:public-site`, `deploy:public-site`, `check:production-surfaces`, `check:route-inventory`, `check:generated-output-drift`, `check:custom-domain-cutover`, `check:production-cutover`, `inventory:production-routes` if target names/domains/surfaces change.

Remove/retire/replace in Part 2:

- `dev:option:titan`, `dev:option:primary`, `deploy:option:titan`, `deploy:option:primary`.
- `build:stakeholder-sites`, `build:site-options`, and `check:site-options` should be retired, repurposed, or replaced with retirement validation. Do not remove validation entirely.

Must not be touched:

- Auth/session/evidence/D1/remote migration behavior scripts and automation cadence scripts, except product-name documentation wording if Part 2 proves it is safe.

## Cloudflare Reality Summary

Current repo config:

- Root `wrangler.jsonc` name: `senior-capstone-app`.
- Pages output directory: `.`.
- D1 binding: `DB`.
- D1 database: `senior-capstone-db`.
- D1 database ID: `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`.
- Migrations dir: `./migrations`.
- Session cookie var: `sc_session`.
- Public guide generated Wrangler: `senior-capstone-public`.
- Stakeholder option generated Wranglers: `senior-capstone-option-titan`, `senior-capstone-option-primary`.

Current documented/live old domains:

- `thecapstoneapp.com`, `www.thecapstoneapp.com`, and `app.thecapstoneapp.com`.
- `npm run check:custom-domain-cutover` verified these old domains as active in this audit because a Cloudflare token was present.

Target domains:

- Product/app preferred destination: `thecapstoneproject.com`.
- Optional alias: `www.thecapstoneproject.com`.
- Optional app split: `app.thecapstoneproject.com`.
- East Tech guide future custom domain: TBD.

Live verification:

- `CLOUDFLARE_API_TOKEN` was present.
- `npm run check:cloudflare:live` passed read-only Pages/D1 verification.
- Target `thecapstoneproject.com` was not configured or verified in this audit and must be treated as unknown/pending.

Manual Cloudflare follow-ups:

- Add/verify target product custom domains in Cloudflare Pages/DNS/TLS when Bryan is ready.
- Decide whether app split remains needed before using `app.thecapstoneproject.com`.
- Update Google OAuth redirect URI only after target app host is chosen.
- Decommission or archive stakeholder option Pages projects separately if Bryan wants them removed from Cloudflare.
- Cloudflare project names may remain legacy technical identifiers until a safe Cloudflare rename/cutover pass.

Repo edits do not equal Cloudflare custom-domain changes. Do not claim `thecapstoneproject.com` is live until verified with live tooling.

## Surface Classification

Capstone Project app/product:

- `workspace.html`, `workspace.js`, and `workspace.css` are the canonical protected app surface.
- Current app copy still says `Senior Project Workspace` and should become school-agnostic `Capstone Project` copy in Part 2.
- Protected dashboard, role, auth, SSO, permission, evidence, and API behavior must be preserved.
- `workspace.css` contains protected ABC/primary-color and role-aware token work from `6c9e8a4`.

East Tech guide:

- `index.html`, `app.js`, `styles.css`, and `public-companion/` are the public guide surface.
- East Tech/ECTA/Titan references are valid here.
- Student Guide / Teacher Guide toggle markers are present in `app.js` and `public-companion/app.js`.
- Current palette is mixed red/blue/green/amber/violet/coral/teal/gold with `titan-black`; Part 2 should absorb Titan direction into this canonical guide without preserving `Titan Blend` as an active option label.

Internal QA:

- `alpha.html`/`alpha.js` and `account.html`/`account.js` are internal QA/account smoke surfaces.
- Fake `.test`, internal alpha, seeded demo, and no-real-student-record copy is allowed here and in tests/checkers/docs.
- Do not expose fake account passwords or real staff temporary credentials.

Stakeholder options:

- `stakeholder-options/titan-blend/` and `stakeholder-options/back-to-basics/` are currently active review artifacts with generated banners and deploy/dev scripts.
- Bryan has retired both as active options.
- Titan Blend styling can inform the East Tech guide, but option labels/copy should not remain active production language.
- Directory deletion can be deferred if checker/generated-output rewrite risk is high; active deploy/dev scripts should not remain.

Generated output:

- `public-companion/` should be regenerated only after guide source updates.
- Stakeholder generated output should either be retired/archived or validated as retired, not kept as active choices.

## Part 2 Implementation Plan

A. Product rename:

- Update product-facing copy in `README.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/production-surface-registry.md`, `docs/production-deployment-policy.md`, `docs/production-predeploy-checklist.md`, `workspace.html`, and `workspace.js`.
- Replace visible app/product references from `Senior Project Workspace`, `Senior Capstone App`, `Senior Capstone`, `The Capstone App`, and similar product titles with `Capstone Project` wording where they are current product/app copy.
- Leave historical run logs/manifests, automation IDs, repo path, Cloudflare project IDs, D1 IDs, package name, and test fixture domains unless a checker explicitly needs a safe update.
- Add a guardrail search for accidental official `The Capstone Project`.

B. Domain direction:

- Update domain config/docs/checkers/tests from `thecapstoneapp.com` to target `thecapstoneproject.com` where they describe future product/app target.
- Keep old domains as legacy/current-live historical context only.
- Update app-subdomain references to `app.thecapstoneproject.com` only if the implementation still needs split app/backend hosting.
- Record Cloudflare dashboard/DNS/TLS and Google OAuth redirect URI changes as manual follow-ups.
- Do not claim target live status unless live check proves it.

C. App/product neutrality:

- Remove East Tech/Titan leakage from `workspace.html` and `workspace.js` unless it is tenant-provided runtime data.
- Preserve role-aware dashboards, auth, SSO fail-closed behavior, permission gates, local fallback, fake `.test` support, and evidence behavior.
- Use neutral copy such as `Capstone Project Workspace`, `project coordinator`, `program teacher`, and `your school workspace`.

D. East Tech guide:

- Update `index.html`, `app.js`, `styles.css`, source templates, and `public-companion/` build output so the guide reads as East Tech/Titans-specific, not the master product root.
- Apply Titan blue/silver/white/black direction to canonical guide tokens; do not preserve `Titan Blend` as an option label.
- Preserve Student Guide / Teacher Guide toggle, public guide content, templates, and core East Tech source-material mapping.
- Rebuild with `npm run build:public-site` and verify deterministic output.

E. Stakeholder option retirement:

- Remove or disable `dev:option:titan`, `dev:option:primary`, `deploy:option:titan`, and `deploy:option:primary`.
- Retire, repurpose, or replace `build:stakeholder-sites`, `build:site-options`, and `check:site-options` with retirement validation.
- Decide whether to delete option dirs in Part 2 or leave archived docs/dirs with explicit retired status. If deletion causes too much checker churn, defer deletion and remove active deploy paths.
- Update `docs/stakeholder-option-lifecycle.md`, `docs/stakeholder-site-options.md`, route inventory, production registry, generated-output drift checker, site-option checker, and tests.
- Record Cloudflare option project decommission as manual follow-up.

F. Docs:

- Update `README.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/production-surface-registry.md`, `docs/production-deployment-policy.md`, `docs/production-predeploy-checklist.md`, `docs/stakeholder-option-lifecycle.md`, `docs/public-site.md`, `docs/human-decisions.md`, `docs/progress/decision-log.md`, and route inventory.
- Add structured run manifest for Part 2.
- Update run log with implementation summary, validation, blockers, and commit/push result.
- Avoid broad rewrites of automation cadence.

G. Validation:

- Run the Part 2 validation rail below.
- Treat target-domain live checks as conditional on Cloudflare/DNS/TLS being configured.
- Treat Google SSO live checks as conditional on Bryan decisions, OAuth client ownership, redirect URI, Cloudflare secrets/env vars, and remote migration 0010.

H. Commit:

- Suggested Part 2 commit message from prompt: `audit: finalize Capstone Project rename and surface split`.

## Part 2 Validation Plan

Required commands after implementation:

```powershell
git diff --check
npm run check
npm run test
npm run typecheck
npm run check:production-surfaces
npm run check:route-inventory
npm run check:generated-output-drift
npm run check:site-options
npm run inventory:production-routes
npm run check:cloudflare
npm run check:custom-domain-cutover
npm run check:production-cutover
```

Conditions:

- Run `npm run check:site-options` only if retained or replaced with meaningful retirement validation.
- Run `npm run inventory:production-routes` when route/deploy/script classifications change, then commit the generated route inventory.
- Run `npm run check:cloudflare:live` only when `CLOUDFLARE_API_TOKEN` or a repo-supported authenticated connector path is available.
- Run target-domain live checks only after Cloudflare Pages custom domains/DNS/TLS are configured for `thecapstoneproject.com`.
- Run hosted dashboard/SSO proof only after remote migration 0010 and SSO env/secret readiness.

Planned post-change searches:

- Old names: `Capstone App`, `The Capstone App`, `Senior Capstone App`, `Senior Project App`, `SeniorProjectApp`, `SeniorProjectApp1.0`.
- Old domains: `thecapstoneapp.com`, `www.thecapstoneapp.com`, `app.thecapstoneapp.com`.
- Accidental official title: `The Capstone Project`.
- Stakeholder active references: `Titan Blend`, `Back To Basics`, `stakeholder review option`, `Option 2`, `Option 3`, active option deploy/dev scripts.
- Forbidden production copy: internal alpha, QA console, smoke test, fake `.test`, non-production preview, prompt leftover, TODO/FIXME, placeholder, fake data, raw Drive storage IDs, stack traces, debug.
- East Tech/Titan leakage into app/product files: `East Tech`, `East Career`, `ECTA`, `Titan`, `titan`.
- Deleted file references if option dirs/scripts are removed.
- Package scripts pointing to retired paths.
- Docs saying Bryan decision unresolved where this prompt locked the decision.

## Part 1 Validation Results

Safe validation after adding audit artifacts:

| Command | Result | Important output |
|---|---|---|
| `git diff --check` | Passed | No whitespace errors; emitted existing warning that `docs/progress/run-log.md` LF will be replaced by CRLF when Git touches it. |
| `npm run check:production-surfaces` | Passed | `Production surface leak check passed: 91 production text surface(s) scanned.` |
| `npm run check:route-inventory` | Passed | `Production route inventory is up to date.` |
| `npm run check:cloudflare` | Passed | Static Wrangler/D1 checks passed; live Pages/D1 verification was skipped by this static script. |
| `npm run check:cloudflare:live` | Passed | Read-only token, Pages project `senior-capstone-app`, and D1 database `senior-capstone-db` verified. |
| `npm run check:custom-domain-cutover` | Passed for current old domains | Verified current old `thecapstoneapp.com`, `www.thecapstoneapp.com`, and `app.thecapstoneapp.com`; this does not verify `thecapstoneproject.com`. |
| `npm run check` | Passed | Aggregate local/static check passed with 231 passing tests and 4 expected opt-in local HTTP skips. |

Skipped in Part 1:

- `npm run check:production-cutover` was not run as a Part 1 static check because the repo script is an aggregate live cutover gate, not a static-only audit. It fans out into live custom-domain, hosted workspace, Drive, typecheck, tests, and aggregate checks. Part 2 should run it only when target-domain and live-check conditions are intended.

## Blockers

Exact blockers remaining:

- Live target product domain `thecapstoneproject.com` is unknown/pending until Cloudflare Pages custom domains, DNS/TLS, and live checks are configured and verified.
- East Tech guide future custom domain is TBD; Bryan will buy it later.
- Cloudflare project names may remain legacy technical identifiers until a safe Cloudflare rename/cutover pass.
- Production Google Workspace SSO still needs Bryan's tenant domain(s), auto-provisioning policy, break-glass local-login policy, OAuth client owner, and redirect URI decisions.
- Cloudflare Pages still needs Google SSO env vars/secrets before SSO can be enabled.
- Remote D1 migration `0010_tenant_google_sso.sql` must be applied through Wrangler before hosted tenant/SSO records are available.
- Full hosted role proof for new dashboard routes should run after remote migration/deploy readiness.

## Next Step

Run Part 2 prompt.
