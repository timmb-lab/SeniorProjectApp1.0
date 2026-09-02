# Production Domain Consolidation

Date: 2026-09-02
Canonical address: `https://thecapstoneapp.com/`
Data boundary: no production D1 reads or writes were used.

## Live result

- `thecapstoneapp.com` serves the app directly at `/`.
- `www.thecapstoneapp.com`, `thecapstoneproject.com`, and `www.thecapstoneproject.com` permanently redirect to the canonical domain.
- The direct `senior-capstone-app.pages.dev` project address permanently redirects to the canonical domain.
- Old `/workspace`, `/workspace/`, `/workspace.html`, and `/index.html` entry paths permanently redirect to `/` while preserving safe query strings.
- `app.thecapstoneapp.com` has no DNS record and no Cloudflare Pages custom-domain attachment.
- The Pages project has exactly four active custom-domain associations: the canonical apex and the three supported redirect aliases.

## Verification

- The canonical root and health endpoint returned HTTP 200.
- The signed-out auth check returned the expected HTTP 401.
- Internal QA pages returned HTTP 404.
- The domain cutover checker passed Pages attachment, live HTTPS redirect, canonical-path, and retired-hostname DNS checks.
- The repository check passed 581 tests: 577 passed, 0 failed, and 4 credential-backed browser checks were skipped by design.
- Type checking and diff validation passed.

The previous 2026-09-01 browser records describe the address used by that historical run. This record supersedes their public entry URL; new use and new proof should start at `https://thecapstoneapp.com/`.
