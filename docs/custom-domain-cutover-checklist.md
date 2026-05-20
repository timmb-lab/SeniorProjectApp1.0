# Custom-Domain Cutover Checklist

Date: 2026-05-20

This checklist prepares the Senior Capstone app and public companion for a future Bryan-owned custom domain. Hostnames are placeholders until Bryan chooses the final mapping.

## Current Cloudflare Pages Project Mapping

| Project | Current Pages URL | Current role | Deploy command |
| --- | --- | --- | --- |
| `senior-capstone-app` | `https://senior-capstone-app.pages.dev` | Canonical app/backend project | `npm run deploy` |
| `senior-capstone-public` | `https://senior-capstone-public.pages.dev` | Generated public companion guide | `npm run deploy:public-site` |
| `senior-capstone-option-titan` | `https://senior-capstone-option-titan.pages.dev` | Stakeholder review only | `npm run deploy:option:titan` |
| `senior-capstone-option-primary` | `https://senior-capstone-option-primary.pages.dev` | Stakeholder review only | `npm run deploy:option:primary` |

## Desired Final Hostnames

Placeholders until Bryan decides:

- App/backend: `app.<custom-domain>` or `<custom-domain>` if the app is the root.
- Public companion: `<custom-domain>` or `guide.<custom-domain>` if the guide is the root.
- Stakeholder options: no production custom domain unless Bryan explicitly retains review hostnames.

Open decision:

- Choose whether the root domain should serve the secure app/backend, the public companion guide, or a split root/subdomain model.

## Pre-Cutover Repo Gate

Run:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Required:

- Production navigation stays free of alpha/account routes.
- Public companion does not proxy alpha/account/API routes.
- Stakeholder option sites remain labeled review-only or are retired/promoted by decision.
- No real student records or fake passwords are present in committed/static assets.

## Cloudflare Live Verification

When `CLOUDFLARE_API_TOKEN` is available:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
```

If the token is missing, record `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN` and do not claim live Pages/D1 verification passed.

## DNS And CNAME Human Actions

Bryan or the Cloudflare account owner must:

- Buy or confirm ownership of the custom domain.
- Add the domain to Cloudflare DNS if it is not already managed there.
- Attach the chosen hostname to the correct Cloudflare Pages project.
- Create the required CNAME record for each hostname.
- Confirm no stakeholder review hostname is mapped as canonical production by accident.
- Wait for DNS propagation and Cloudflare Pages domain activation.

Do not commit tokens, DNS provider credentials, registrar credentials, or Cloudflare secrets.

## SSL/TLS Check

After Cloudflare activates the hostname:

- Open the hostname over `https://`.
- Confirm certificate is valid and issued for the hostname.
- Confirm there are no mixed-content warnings.
- Confirm root-to-subdomain redirects, if any, use HTTPS.
- Confirm HSTS or stricter policies are not enabled until rollback behavior is understood.

## App And Backend Health Check

For the app/backend hostname:

- Open the production home page.
- Verify `GET /api/health` returns 200.
- Verify the health response does not expose secret values.
- Verify D1/evidence readiness fields are expected for the current phase.
- Verify `GET /api/auth/me` without a session does not expose user records.
- Verify alpha/account pages are handled according to Bryan's selected policy.

Do not enter real student records until auth, evidence, and permission checks pass.

## Public Companion Health Check

For the public companion hostname:

- Open the public guide home page.
- Open several phase/support pages.
- Confirm navigation does not link to `alpha.html` or `account.html`.
- Confirm `_redirects` does not proxy `/api/`.
- Confirm app workflow copy is a preview/boundary explanation, not a finished secure-app claim.

## Post-Cutover Smoke Checks

- Production-surface checker still passes locally.
- Route inventory still matches the chosen mapping.
- Cloudflare static check passes.
- Live Cloudflare check passes when token exists.
- App health endpoint passes on the custom hostname.
- Public companion pages load on the custom hostname.
- Stakeholder review targets remain review-only or are retired.
- No real student records are entered until the pilot safety gates pass.

## Rollback Steps

If cutover fails:

- Stop pilot traffic and real-record entry.
- Remove or pause the custom hostname mapping from the failing Pages project.
- Restore DNS/CNAME records to the previous known-good target.
- Use the `pages.dev` hostname for emergency access if needed.
- Record hostname, response code, TLS state, failing command, and timestamp in `docs/progress/run-log.md`.
- Re-run the local gate before retrying.

Rollback must not rely on force-push, repo reset, or deleting unreviewed generated output.
