# Custom-Domain Cutover Checklist

Date: 2026-05-21 PT

Product/app target domain: `thecapstoneproject.com`
Target product alias: `www.thecapstoneproject.com`
Optional app split hostname: `app.thecapstoneproject.com`
East Tech guide future custom domain: `TBD`
Current legacy hostnames pending migration: `thecapstoneapp.com`, `www.thecapstoneapp.com`, `app.thecapstoneapp.com`
Current Google OAuth redirect URI remains `https://app.thecapstoneapp.com/api/auth/google/callback`

Live cutover is not complete until Cloudflare Pages custom-domain association, DNS/Cloudflare activation, HTTPS/TLS, product app health, workspace health, and alpha/account exposure checks pass. Git push success, Pages project existence, DNS record existence, and Pages auto-deploy success are not enough.

## Target Product Mapping

| Hostname | Purpose | Pages project | Deploy source | Deploy command | Required live proof |
| --- | --- | --- | --- | --- | --- |
| `thecapstoneproject.com` | Capstone Project product/app root | `senior-capstone-app` | `.` | `npm run deploy` | HTTPS reaches product root/workspace safely |
| `www.thecapstoneproject.com` | Optional product alias | `senior-capstone-app` | `.` | `npm run deploy` | HTTPS loads or redirects safely |
| `app.thecapstoneproject.com` | Optional app split only if required | `senior-capstone-app` | `.` | `npm run deploy` | Only add if split is needed and Google OAuth/envs are updated |

Fallback Pages URLs remain:

- `https://senior-capstone-app.pages.dev`
- `https://senior-capstone-public.pages.dev`

Current legacy hostnames remain documented until a later migration/redirect pass:

- `thecapstoneapp.com`
- `www.thecapstoneapp.com`
- `app.thecapstoneapp.com`

Retired stakeholder option projects stay excluded from product hostnames:

- `senior-capstone-option-titan`
- `senior-capstone-option-primary`

## Pre-Cutover Repo Gate

Run:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:custom-domain-cutover
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:alpha-account-gating
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Required:

- Production navigation stays free of alpha/account routes.
- Public companion does not proxy alpha/account/API routes.
- Retired stakeholder option projects are not mapped to `thecapstoneproject.com`, `www.thecapstoneproject.com`, or `app.thecapstoneproject.com`.
- No active package script deploys retired stakeholder option output.
- No real student records or fake passwords are present in committed/static assets.

## Cloudflare Pages Custom Domains

Use the Cloudflare Pages custom-domain flow or the Pages Domains API. A CNAME-only change is not a valid cutover. A hostname must be associated with the target Pages project through Cloudflare Pages custom domains before DNS/TLS success can count as verified.

Dashboard fallback steps:

1. Cloudflare Dashboard
2. Workers & Pages
3. `senior-capstone-app`
4. Custom domains
5. Set up a domain
6. Add `thecapstoneproject.com`
7. Add `www.thecapstoneproject.com` if Bryan wants the alias live
8. Wait until custom domains show active
9. Run repo live checks

Pages Domains API references:

- `GET /accounts/{account_id}/pages/projects/{project_name}/domains`
- `POST /accounts/{account_id}/pages/projects/{project_name}/domains`

Use API tokens over global keys. Required read verification needs Pages Read or Pages Write. Attaching domains needs Pages Write. Do not print or commit token values.

## Redirect And Routing Caveats

- `_redirects` belongs in the static asset output directory.
- `_redirects` applies to static asset responses and does not protect requests served by Pages Functions.
- `_redirects` does not support domain-level redirects. Do not force apex/www behavior with hostname-dependent `_redirects` rules.
- Use Cloudflare Redirect Rules for domain-level canonicalization if Bryan wants root-to-www or www-to-root later.
- `_routes.json` controls Pages Functions invocation when Functions are present; `exclude` has priority over `include`.
- Do not use `_redirects` to protect `/api/*`, `alpha.html`, `account.html`, or internal QA API routes.

## Live Verification

When `CLOUDFLARE_API_TOKEN` has the needed scope:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:custom-domain-cutover --live-required --live-http
```

Required live proof:

- Token verifies without printing the token.
- Pages domains list for `senior-capstone-app` contains active `thecapstoneproject.com`.
- Pages domains list for `senior-capstone-app` contains active `www.thecapstoneproject.com` if the alias is configured.
- Retired stakeholder option projects do not contain product hostnames.
- `https://thecapstoneproject.com/workspace.html` reaches the app workspace route.
- `https://thecapstoneproject.com/api/health` returns 200 without secrets.
- `https://thecapstoneproject.com/api/auth/me` signed out returns the expected unauthenticated response without user records.
- Normal app home does not land on `alpha.html` or `account.html`.

If the token is missing, record `CLOUDFLARE_DOMAIN_CHECK_BLOCKED_NO_TOKEN`. If scope is insufficient, record `CLOUDFLARE_DOMAIN_CHECK_BLOCKED_INSUFFICIENT_SCOPE`. If Cloudflare shows `initializing` or `pending`, record the exact status and do not claim live cutover passed.

## Google Workspace SSO Redirect

This rename/surface pass does not change the live Google OAuth redirect URI. Keep:

```text
https://app.thecapstoneapp.com/api/auth/google/callback
```

A later SSO cutover must add the exact new redirect URI in Google Cloud and Cloudflare Pages env/secrets, deploy the app, verify `/api/auth/config`, and prove Google Workspace SSO fail-closed behavior before enabling a new product-domain OAuth redirect.

## Alpha/Account Exposure

Current enforceable state is Option A safety: `alpha.html` and `account.html` are deployed from `senior-capstone-app`, unlinked from normal production navigation, internal-labeled, and fake `.test` only. That is not pilot-safe final production unless Bryan explicitly accepts direct URL exposure or chooses Option B/C in `docs/alpha-account-deployment-decision.md`.

Run:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:alpha-account-gating
```

## Rollback Steps

If cutover fails:

- Stop pilot traffic and real-record entry.
- Remove or pause the custom hostname mapping from the failing Pages project.
- Repoint traffic to the prior known-good Pages hostname or Cloudflare rule.
- Keep `https://senior-capstone-app.pages.dev` and `https://senior-capstone-public.pages.dev` as emergency fallbacks unless Bryan separately disables them.
- Record hostname, response code, TLS state, failing command, and timestamp in `docs/progress/run-log.md`.
- Re-run local and live gates before retrying.

Rollback must not rely on force-push, repo reset, broad user-account imports, fake-password commits, or deleting unreviewed generated output.
