# Stakeholder Option Lifecycle

Date: 2026-05-20

The stakeholder option sites are generated review artifacts, not canonical production. They may stay in the repo only when their lifecycle is clear and validation keeps them from being mistaken for the production app or public companion.

Current option sites:

- `stakeholder-options/titan-blend/` deploys to `senior-capstone-option-titan`.
- `stakeholder-options/back-to-basics/` deploys to `senior-capstone-option-primary`.
- Source of truth is `scripts/build-stakeholder-sites.mjs`.
- Both must display the stakeholder review banner.
- Alpha links must be labeled `Internal Alpha QA`.

## Lifecycle 1: Retain As Review Artifact

Use this when Bryan still wants stakeholders to compare visual directions.

Required repo state:

- Keep both generated option roots committed.
- Keep deploy scripts named as review-only targets.
- Keep `docs/production-deployment-policy.md` and `docs/production-surface-registry.md` classifying them as `stakeholder-review`.
- Keep `scripts/check-generated-output-drift.mjs` and `scripts/check-site-options.mjs` passing.

Validation:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:site-options
```

Do not:

- Link option pages from normal production navigation.
- Describe either option as canonical production.
- Deploy an option to the final production custom domain.

## Lifecycle 2: Retire

Use this when Bryan is done comparing one or both option sites.

Required repo changes:

- Remove or archive the retired generated output root.
- Remove or disable the corresponding deploy script if the target will no longer be maintained.
- Update `docs/production-surface-registry.md`, `docs/production-deployment-policy.md`, `docs/stakeholder-site-options.md`, README, and route inventory.
- Update `scripts/check-generated-output-drift.mjs` and `scripts/check-site-options.mjs` so they no longer require the retired output.
- Add a run-log note with the retirement reason and date.

Required Cloudflare changes:

- Disable, delete, or clearly mark the retired Pages project as non-production.
- Remove any custom domains or stakeholder links pointing to the retired target.

Validation:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Cleanup steps:

- Confirm no production page links to the retired option.
- Confirm no package script suggests retired output is canonical.
- Confirm docs no longer ask reviewers to use a retired site.

## Lifecycle 3: Promote To Canonical Public Companion

Use this only if Bryan chooses one option as the public companion design direction.

Required repo changes:

- Move the chosen direction into the public companion source/build path.
- Remove stakeholder-review wording from the promoted production output.
- Remove alpha/internal QA links from the promoted production output.
- Update `scripts/build-public-site.mjs` or the source public pages so `public-companion/` is generated from the promoted direction.
- Update package scripts only if the canonical public companion deploy command changes.
- Update `docs/production-deployment-policy.md`, `docs/production-surface-registry.md`, README, `docs/public-site.md`, and route inventory.
- Update `scripts/check-production-surfaces.mjs` and `scripts/check-generated-output-drift.mjs` so the promoted surface is scanned as production-safe public output.

Required Cloudflare changes:

- Keep or migrate canonical public companion deployment to `senior-capstone-public` unless Bryan chooses a new project.
- Remove review-only Pages project mapping if it becomes obsolete.
- Verify custom-domain mapping after promotion.

Validation:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Promotion is not complete until production-surface validation passes and the route inventory shows the promoted output as canonical public companion, not stakeholder review.

## Current Recommendation

No final lifecycle decision is recorded yet. Keep both option sites as labeled review artifacts until Bryan chooses retain, retire, or promote.
