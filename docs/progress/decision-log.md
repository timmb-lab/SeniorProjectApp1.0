# Decision Log

Last refreshed: 2026-05-21

## Current Automation Decision

- `area`: project-local Senior Capstone automation
- `decision`: Split the active builder into `senior-capstone-nonfigma-mvp-builder` at minute 0 PT and `senior-capstone-figma-product-builder` at minute 30 PT, with `senior-capstone-daily-mvp-summary` as a report-only daily summary and `senior-capstone-weekly-script-audit` as the weekly strategy review.
- `applies to`: `automation/prompts/senior-capstone-nonfigma-mvp-builder.md`, `automation/prompts/senior-capstone-figma-product-builder.md`, `automation/qol/project-lock.json`, `automation/qol/GUI_ALLOWED_COMMANDS.md`, `automation/qol/hourly-orchestrator.mjs`, `docs/automation-cadence.md`, `docs/automation-memory.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, and `scripts/verify-cadence-30min.ps1`.
- `reason`: Bryan clarified that the project should no longer treat builder capacity as one undifferentiated 30-minute automation. Non-Figma implementation and Figma-only design handoff work need separate prompts, schedules, and safety boundaries while preserving 48 combined scheduled builder starts/day.
- `verification`: `scripts/verify-cadence-30min.ps1` checks split builder IDs, minute 0/minute 30 cadence language, prompt existence/content, project lock IDs, oversight handling, and wrapper-only scheduled command guidance.

## Current Product Decisions

- Official product title is Capstone Project, not "The Capstone Project".
- The app target is a secure, database-backed Capstone Project application, not a static guide or visual-only prototype.
- Product/app target domain is `thecapstoneproject.com`; `www.thecapstoneproject.com` may be an alias; `app.thecapstoneproject.com` is optional only if a split remains required.
- East Tech guide future custom domain is TBD.
- East Tech/Titan branding belongs only in the East Tech guide.
- Titan Blend and Back To Basics are retired as active stakeholder options.
- The accepted deployment direction is GitHub-connected Cloudflare Pages/Functions with D1.
- Hardened username/password pilot auth is the MVP path until school SSO is available.
- Google Drive is the MVP evidence repository path while D1 stores metadata, review state, and audit history.
- Real student data must not be entered into alpha or committed to the repo.

## D-2026-05-21-021 - Capstone Project final name, domain, and surface split

- `area`: product naming, domain, and production surfaces
- `decision`: Official product title is Capstone Project; target product/app domain is `thecapstoneproject.com`; East Tech guide future custom domain is TBD; the app is school-agnostic and tenant-ready; East Tech/Titan branding belongs only to the guide; Titan Blend and Back To Basics are retired as active options.
- `applies to`: `README.md`, `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/production-surface-registry.md`, `docs/production-deployment-policy.md`, `docs/production-predeploy-checklist.md`, `docs/stakeholder-option-lifecycle.md`, `docs/public-site.md`, `config/production-domains.json`, package scripts, checkers, route inventory, public guide output, and workspace copy.
- `reason`: Bryan ended the stakeholder option comparison and locked the reusable product/app identity separately from the East Tech school-specific guide.
- `implementation rule`: Do not rewrite auth, D1, evidence, role permissions, API architecture, Google Workspace SSO, or automation cadence. Keep `https://app.thecapstoneapp.com/api/auth/google/callback` as the current SSO redirect until a later Google OAuth and Cloudflare env cutover is verified.
- `validation`: Target-domain checks may report pending/initializing live state unless Cloudflare Pages custom-domain association, DNS/TLS, workspace/API health, and signed-out auth checks pass.

## D-2026-05-20-020 - Production app/site split and Student/Teacher website mode

- `area`: production experience
- `decision`: The Senior Capstone production experience has two deliverables: a role-aware production app and a public website with Student Guide / Teacher Guide modes.
- `applies to`: `docs/master-plan.md`, `docs/mvp-requirements-catalog.md`, `docs/production-surface-registry.md`, `docs/source-materials/production-content-crosswalk.md`, public guide source, canonical production app route, and generated public output.
- `reason`: Alpha, account smoke, app preview, stakeholder options, and generated mirrors support review/testing, but they are not the canonical production experience Bryan wants.
- `implementation rule`: The app must choose screens from authenticated session, D1-backed user, role, and permission scope. The website Student/Teacher toggle is public content organization only, not auth or permissions.
- `validation`: Production-copy and generated-output checks must keep alpha/smoke/preview/dev/prompt copy out of canonical public/app surfaces, and normal public navigation must not link to internal QA/account surfaces.
