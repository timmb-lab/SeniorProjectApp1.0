# Production Predeploy Checklist

Date: 2026-05-20

Use this checklist before any pilot-facing deploy, preview promotion, or custom-domain cutover. It converts the production-surface cleanup into a gate: static checks may pass locally, but live Cloudflare checks are not complete unless `CLOUDFLARE_API_TOKEN` is available and read-only verification succeeds.

## Required Local Gate

Run from `C:\SeniorProjectApp1.0`:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:predeploy-gate
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:route-inventory
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:site-options
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 test
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Required result:

- Predeploy gate checker confirms package scripts, checklist commands, README commands, and static/live Cloudflare wording stay aligned.
- Production-surface checker passes with no dev/test copy on production-classified surfaces.
- Route inventory checker confirms `docs/generated/production-route-inventory.md` is current.
- Generated-output drift checker passes for `public-companion/` and `stakeholder-options/**`.
- Site option checker confirms generated manifests/pages exist.
- Cloudflare static check passes for `wrangler.jsonc`, local Wrangler, D1 binding, and migrations.
- Tests pass.
- Aggregate `check` passes.

## Data And Credential Gate

Before pilot deploy:

- Confirm no real student records exist in public/static assets, screenshots, fixtures, docs, or generated output.
- Confirm no fake account passwords are committed or pasted into docs, screenshots, Figma, Canva, or public pages.
- Confirm `.secrets/` remains ignored and any local test-account JSON stays untracked.
- Confirm `wrangler.jsonc` contains no secret values, private keys, or `CLOUDFLARE_API_TOKEN`.
- Confirm real student records are not entered into alpha/pilot until auth, evidence, and permission checks pass.

Validation:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare
```

## Required Bryan Decisions

These must be decided before pilot users or real records enter the app:

- Alpha/account deployment policy: choose Option A, B, or C from `docs/alpha-account-deployment-decision.md`.
- Stakeholder option lifecycle: retain, retire, or promote from `docs/stakeholder-option-lifecycle.md`.
- Custom-domain mapping: choose final hostnames using `docs/custom-domain-cutover-checklist.md`.
- Live verification token: decide whether to provide `CLOUDFLARE_API_TOKEN` for read-only Pages/D1 verification automation.

## Cloudflare Static Gate

Static gate command:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare
```

Required result:

- `wrangler.jsonc` project name is `senior-capstone-app`.
- Pages output directory is `.`.
- D1 binding `DB` points to `senior-capstone-db`.
- D1 database id matches the recorded production database.
- Migrations directory exists.
- Local Wrangler CLI resolves through the repo.
- No obvious secrets are present in config.

This is static proof only. It does not prove the live Pages project, live D1 database, current deployment, custom domain, or API health.

## Cloudflare Live Gate

Live gate command, only when `CLOUDFLARE_API_TOKEN` exists:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
```

Required result:

- Wrangler `whoami` succeeds.
- Live Pages project `senior-capstone-app` exists.
- Live D1 database `senior-capstone-db` exists and matches database id `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`.
- Run log records the exact result.

If the token is missing, record `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`. Do not claim live verification passed.

## D1 Binding Gate

Before deploy:

- Static `wrangler.jsonc` D1 binding check passes.
- Required migrations are committed.
- Any new remote migration is applied and verified only when authorized token/session exists.
- Remote D1 verification is recorded before real student records enter the app.

Pilot blocker:

- If any migration is pending remotely and live verification cannot run, record the pending migration and block real-record pilot use.

## API Health Gate

After a deploy or cutover, verify:

- `GET /api/health` returns 200 on the app hostname.
- Health output does not expose secret values.
- D1 and evidence configuration fields report expected readiness state.
- `GET /api/auth/me` returns an unauthenticated response without leaking user records when no session is present.
- Internal alpha/account API routes remain internal QA only.

Do not treat static local checks as API health proof.

## Generated Output Gate

Run:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:generated-output-drift
```

Required result:

- `public-companion/` HTML, `app.js`, `styles.css`, `assets/`, and `templates/` match source expectations.
- `public-companion/_redirects` does not proxy `alpha.html`, `account.html`, or `/api/`.
- `public-companion/` contains no fake account, test account, smoke, seeded persona, or internal QA copy.
- Stakeholder options retain the review banner and label alpha links as `Internal Alpha QA`.
- Stakeholder options do not link to `account.html`.

## Custom-Domain Cutover Checklist

Before cutover:

- Bryan chooses final app/public hostnames.
- DNS/CNAME targets are prepared.
- Cloudflare Pages custom domains are attached to the correct project.
- SSL/TLS issuance is complete.
- App health and public companion health checks are prepared.
- Rollback hostnames and DNS records are documented.

Use `docs/custom-domain-cutover-checklist.md` for the detailed steps.

## Rollback Checklist

If any post-deploy or cutover check fails:

- Stop accepting real student records.
- Move DNS/CNAME records back to the last known-good Pages hostname or previous domain target.
- Revert only the deployment or DNS change that caused the failure; do not reset the repo.
- Record the failed command, hostname, response code, and timestamp in the run log.
- Re-run the local gate and live gate before retrying.
- Keep alpha/account and stakeholder review surfaces unlinked from production navigation during rollback.
