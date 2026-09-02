# Alpha And Account Deployment Decision

Date: 2026-09-02

Bryan selected Option C. These pages remain useful for local QA, but they are not part of the canonical production deployment at `https://thecapstoneproject.com/`.

Current state:

- `alpha.html`, `alpha.js`, and `alpha.css` are classified as `internal-alpha`.
- `account.html`, `account.js`, and `account.css` are classified as `internal-smoke`.
- They are excluded from the `.deploy-app/` production bundle and blocked by production middleware.
- Production-surface validation allows alpha/smoke language only on these internal QA surfaces.
- Current enforceable state is Option C: source files remain for local QA, but the isolated production bundle excludes them and production middleware returns 404 for their paths.
- The decision is closed unless Bryan explicitly asks to restore a protected internal QA deployment.

## Option A: Keep Deployed But Unlinked And Clearly Internal QA

Pros:

- Fastest path for Day 7 alpha review.
- Keeps Bryan/internal QA able to verify role flows, fake `.test` accounts, and backend smoke behavior.
- Requires the fewest repo and Cloudflare changes.

Risks:

- Anyone with the direct URL can open the page.
- Internal QA copy remains present on the app host even though it is fenced from navigation.
- This is not enough for pilot use with real student records unless Bryan accepts the exposure.

Required repo changes:

- Keep internal QA labels and no-real-record warnings current.
- Keep production navigation free of links to `alpha.html` and `account.html`.
- Keep `check:production-surfaces` and `check:generated-output-drift` passing.

Required Cloudflare changes:

- None beyond normal deploy verification.
- Optional: add Cloudflare Access later if this option becomes too exposed.

Validation command:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:alpha-account-gating
```

Bryan decision needed:

- Confirm that direct URL access is acceptable through the alpha period and not acceptable as proof of pilot readiness.

## Option B: Gate Behind Access Controls Before Pilot

Pros:

- Preserves internal QA tooling while reducing accidental public exposure.
- Best fit if Bryan still needs alpha/account QA during pilot preparation.
- Makes the production host cleaner without deleting useful diagnostic pages.

Risks:

- Requires Cloudflare Access or equivalent edge gating work.
- Gate configuration must be verified live; local static checks are not enough.
- Misconfiguration could block Bryan/testers or leave the gate ineffective.

Required repo changes:

- Document the gate policy in `docs/production-deployment-policy.md` and `docs/backend-setup.md`.
- Add a route/deploy validation note once the gate exists.
- Keep alpha/account labels as internal QA; access control does not make them production pages.

Required Cloudflare changes:

- Configure access controls for `alpha.html`, `account.html`, associated assets, and internal QA API routes as needed.
- Verify access-denied behavior without a session or allowed identity.
- Verify Bryan/internal QA access works.

Validation command:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
```

Bryan decision needed:

- Choose the access-control mechanism and who can access internal QA pages.

## Option C: Remove From Production Deployment Before Pilot

Pros:

- Cleanest production posture for pilot users.
- Eliminates direct public access to internal alpha/account pages from the canonical app host.
- Makes the app host easier to explain as a real production surface.

Risks:

- Removes useful smoke tooling from the deployed environment.
- Requires an alternate QA environment or branch for alpha/account verification.
- Can slow troubleshooting if real pilot issues need role/account diagnostics.

Required repo changes:

- Move alpha/account pages out of the root deploy output or deploy them only to a separate internal preview target.
- Update `docs/production-surface-registry.md`, `docs/production-deployment-policy.md`, route inventory, README, and validation allowlists.
- Update tests or checkers that currently classify alpha/account as deployed internal surfaces.

Required Cloudflare changes:

- Confirm deployed production output no longer serves `alpha.html` and `account.html`.
- Optionally create a separate internal-only Pages project or branch for QA.

Validation command:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
```

Bryan decision needed:

- Confirm that alpha/account QA should be unavailable on the canonical production deployment before pilot.

## Current Recommendation

Option C was accepted as part of the 2026-09-02 domain cleanup. Internal QA files remain available only from local source workflows; they are not copied to `.deploy-app/` and are not served by the production app.

Run `npm run check:alpha-account-gating` after any navigation, public companion, stakeholder option, alpha/account, or internal QA API change.
