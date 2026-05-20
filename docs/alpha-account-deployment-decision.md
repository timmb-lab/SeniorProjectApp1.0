# Alpha And Account Deployment Decision

Date: 2026-05-20

Bryan needs to choose how `alpha.html` and `account.html` should be handled before pilot users or real student records enter the app. These pages are useful internal QA surfaces, but they are not canonical production navigation.

Current state:

- `alpha.html`, `alpha.js`, and `alpha.css` are classified as `internal-alpha`.
- `account.html`, `account.js`, and `account.css` are classified as `internal-smoke`.
- They are deployed from the root `senior-capstone-app` project today, but removed from normal public navigation and labeled internal QA.
- Production-surface validation allows alpha/smoke language only on these internal QA surfaces.

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

No final choice is recorded yet. The current docs recommend Option A through the Day 7 alpha, then Option B or C before pilot use with real records. Bryan must explicitly accept the final policy.
