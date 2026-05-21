# Custom-Domain Cutover Checklist

Date: 2026-05-21 PT

Domain selected: `thecapstoneapp.com`
Purchased through Cloudflare: confirmed by Bryan
Added to Cloudflare: confirmed by Bryan
Root mode: `guide-root-app-subdomain`

Live cutover is not complete until Cloudflare Pages custom-domain association, DNS/Cloudflare activation, HTTPS/TLS, app health, public guide health, and alpha/account exposure checks pass. Git push success, Pages project existence, DNS record existence, and Pages auto-deploy success are not enough.

## Canonical Mapping

| Hostname | Purpose | Pages project | Deploy source | Deploy command | Required live proof |
| --- | --- | --- | --- | --- | --- |
| `thecapstoneapp.com` | public landing / student guide | `senior-capstone-public` | `public-companion/` | `npm run deploy:public-site` | HTTPS loads public guide |
| `www.thecapstoneapp.com` | public guide alias / same guide / optional Cloudflare redirect rule | `senior-capstone-public` | `public-companion/` | `npm run deploy:public-site` | HTTPS loads or redirects safely |
| `app.thecapstoneapp.com` | secure app/backend | `senior-capstone-app` | `.` | `npm run deploy` | `/api/health`, `/api/auth/me`, workspace |

Fallback Pages URLs remain:

- `https://senior-capstone-public.pages.dev`
- `https://senior-capstone-app.pages.dev`

Review-only Pages projects stay excluded from production hostnames:

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
- Stakeholder option sites remain review-only and are not mapped to `thecapstoneapp.com`, `www.thecapstoneapp.com`, or `app.thecapstoneapp.com`.
- No real student records or fake passwords are present in committed/static assets.

## Cloudflare Pages Custom Domains

Use the Cloudflare Pages custom-domain flow or the Pages Domains API. A CNAME-only change is not a valid cutover. A hostname must be associated with the target Pages project through Cloudflare Pages custom domains before DNS/TLS success can count as verified.

Dashboard fallback steps:

1. Cloudflare Dashboard
2. Workers & Pages
3. `senior-capstone-public`
4. Custom domains
5. Set up a domain
6. Add `thecapstoneapp.com`
7. Add `www.thecapstoneapp.com`
8. Workers & Pages
9. `senior-capstone-app`
10. Custom domains
11. Set up a domain
12. Add `app.thecapstoneapp.com`
13. Wait until custom domains show active
14. Run repo live checks

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
- Pages domains list for `senior-capstone-public` contains active `thecapstoneapp.com` and `www.thecapstoneapp.com`.
- Pages domains list for `senior-capstone-app` contains active `app.thecapstoneapp.com`.
- Stakeholder option projects do not contain production hostnames.
- `https://thecapstoneapp.com` loads the public guide or redirects safely to the same public guide.
- `https://www.thecapstoneapp.com` loads the public guide or redirects safely to the same public guide.
- `https://app.thecapstoneapp.com/workspace.html` reaches the app workspace route.
- `https://app.thecapstoneapp.com/api/health` returns 200 without secrets.
- `https://app.thecapstoneapp.com/api/auth/me` signed out returns the expected unauthenticated response without user records.
- Normal app home does not land on `alpha.html` or `account.html`.

If the token is missing, record `CLOUDFLARE_DOMAIN_CHECK_BLOCKED_NO_TOKEN`. If scope is insufficient, record `CLOUDFLARE_DOMAIN_CHECK_BLOCKED_INSUFFICIENT_SCOPE`. Do not claim live cutover passed.

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
- Keep `https://senior-capstone-public.pages.dev` and `https://senior-capstone-app.pages.dev` as emergency fallbacks unless Bryan separately disables them.
- Record hostname, response code, TLS state, failing command, and timestamp in `docs/progress/run-log.md`.
- Re-run local and live gates before retrying.

Rollback must not rely on force-push, repo reset, broad user-account imports, fake-password commits, or deleting unreviewed generated output.
