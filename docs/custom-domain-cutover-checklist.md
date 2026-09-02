# Production Domain Checklist

Last verified: 2026-09-02

Product/app canonical domain: `thecapstoneapp.com`

Canonical app URL: `https://thecapstoneapp.com/`

Canonical product alias: `www.thecapstoneapp.com`

Secondary redirect hostnames: `thecapstoneproject.com`, `www.thecapstoneproject.com`

Permanent redirect target: `https://thecapstoneapp.com`

Retired app hostname: `app.thecapstoneapp.com`

Google OAuth redirect URI: `https://thecapstoneapp.com/api/auth/google/callback`

East Tech guide future custom domain: `TBD`

## Required Live State

| Address | Required behavior |
| --- | --- |
| `https://thecapstoneapp.com/` | Serves the Capstone Project workspace directly, with no path added to the browser address. |
| `https://www.thecapstoneapp.com/*` | Returns a permanent redirect to the same safe path on the canonical domain. |
| `https://thecapstoneproject.com/*` | Returns a permanent redirect to the canonical domain. |
| `https://www.thecapstoneproject.com/*` | Returns a permanent redirect to the canonical domain. |
| `https://senior-capstone-app.pages.dev/*` | Returns a permanent redirect to the canonical domain. |
| `app.thecapstoneapp.com` | Has no DNS record, no Cloudflare Pages custom-domain attachment, and does not resolve. |

The old `/workspace`, `/workspace/`, `/workspace.html`, and `/index.html` entry paths redirect to `/`. API paths remain unchanged.

## Cloudflare Rules

- The Pages project is `senior-capstone-app`.
- The Pages domain list must contain the canonical apex and the three redirect aliases.
- The retired app hostname must be absent from both DNS and the Pages domain list.
- A DNS record or CNAME-only result is not enough; the Pages custom-domain association must match this table.
- Host redirects are handled in Pages middleware because `_redirects` does not support domain-level redirects.
- `_redirects` handles only the old workspace entry paths.
- The project `*.pages.dev` production alias redirects to the canonical domain. Immutable deployment preview addresses remain available for release verification.

Pages API routes used for verification and retirement:

- `GET /accounts/{account_id}/pages/projects/{project_name}/domains`
- `DELETE /accounts/{account_id}/pages/projects/{project_name}/domains/{domain_name}`

Use a scoped API token. Never print or commit it.

## Google Sign-In Boundary

Google Workspace sign-in is currently disabled. If it is approved later, configure the exact canonical callback below in Google Cloud and Cloudflare before enabling it:

```text
https://thecapstoneapp.com/api/auth/google/callback
```

Do not restore the retired app subdomain for sign-in.

## Verification

```powershell
npm run build:app
npm run test -- --test-name-pattern "domain|production blocks legacy"
npm run check:custom-domain-cutover -- --live-required --live-http
npm run check:alpha-account-gating -- --live-required
```

Required results:

- The canonical root returns the workspace with HTTP 200.
- Old workspace paths return 308 to the bare canonical root and keep the query string.
- All supported alias domains return 308 to the canonical root or matching API path.
- The Pages API reports four active custom-domain associations.
- The retired app subdomain is absent from every checked Pages project.
- The retired app subdomain has no DNS record and does not resolve.
- Internal QA pages still return 404 in production.

## Rollback

If the canonical root fails after a deploy, roll back the Pages deployment first. Do not reattach the retired app subdomain. Re-run the live checks before reopening access.
