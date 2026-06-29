# Production Predeploy Checklist

Date: 2026-05-21

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
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:custom-domain-cutover
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:alpha-account-gating
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-cutover
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:drive:live
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:workspace:hosted-evidence
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:workspace:hosted-permissions
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 test
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check
```

Required result:

- Predeploy gate checker confirms package scripts, checklist commands, README commands, and static/live Cloudflare wording stay aligned.
- Production-surface checker passes with no dev/test copy on production-classified surfaces.
- Route inventory checker confirms `docs/generated/production-route-inventory.md` is current.
- Generated-output drift checker passes for `public-companion/`.
- Site option checker confirms East Tech guide generated output exists and retired stakeholder options are not active deploy targets.
- Cloudflare static check passes for `wrangler.jsonc`, local Wrangler, D1 binding, and migrations.
- Custom-domain cutover static check passes for target product domain `thecapstoneproject.com`, guide future domain `TBD`, current legacy hostnames, and retired stakeholder project exclusion.
- Alpha/account gating check passes for internal labels, no normal production navigation links, and no public companion proxying.
- Cloudflare live check passes token verify plus Pages/D1 lookup. Scoped-token `wrangler whoami` warnings are acceptable only when token verify, Pages project lookup, D1 database lookup, and D1 id match all pass.
- Production cutover aggregate passes only when live-only checks are not blocked and the domain/API/app proof succeeds.
- Production cutover aggregate runs the hosted workspace evidence gate once; run `check:drive:live` separately when you need the standalone Drive alias proof so the fake student's upload quota is not consumed twice in the same aggregate.
- Drive live check passes before accepting real student file bytes: runtime credential parts configured, service-account token exchange works, root folder is visible as a folder, index sheet is visible as a Google Sheet, fake `.test` upload succeeds, D1 metadata/audit are verified without selecting raw Drive IDs, and browser/API output stays redacted.
- Hosted workspace evidence check passes or is explicitly skipped for missing ignored fake `.test` credentials; it must prove canonical `workspace.html` upload/download, including one >5MB resumable upload, before real student evidence is accepted.
- Hosted workspace permission check passes or is explicitly skipped for missing ignored fake `.test` credentials; it must not use real accounts.
- Tests pass.
- Aggregate `check` passes.

## Cloudflare Credential Model

- Cloudflare GitHub integration may automatically deploy after pushes to `main`.
- That integration is Cloudflare-side and does not give the local Codex/Wrangler shell Cloudflare API credentials.
- The repo's static checks do not require `CLOUDFLARE_API_TOKEN`.
- Remote Pages/D1 verification requires `CLOUDFLARE_API_TOKEN` in the environment, plus any required account/project identifiers, or a repo-supported authenticated Cloudflare connector if a script is explicitly written to use one. For local runs, load the token from user scope before live checks: `$env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")`.
- If no local token/auth path is present, live verification must report `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`.
- Git push success is not the same as live Cloudflare verification success.
- Cloudflare GitHub auto-deploy success is not the same as Codex local live verification success unless the script verifies the live URL/API/D1 state.
- Do not commit credentials.

## Data And Credential Gate

Before pilot deploy:

- Confirm no real student records exist in public/static assets, screenshots, fixtures, docs, or generated output.
- Confirm no fake account passwords are committed or pasted into docs, screenshots, Figma, Canva, or public pages.
- Confirm `.secrets/` remains ignored and any local test-account JSON stays untracked.
- Confirm `wrangler.jsonc` contains no secret values, private keys, or `CLOUDFLARE_API_TOKEN`.
- Confirm real non-`.test` admin-visible temporary credential imports remain blocked unless Bryan has accepted a delivery policy and `ALLOW_REAL_TEMP_CREDENTIAL_IMPORT=true` is intentionally configured.
- Confirm real student records are not entered into alpha/pilot until auth, permissions, Drive upload, D1 metadata, and account lifecycle checks pass.

Validation:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:production-surfaces
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:drive:live
```

## Required Bryan Decisions

These must be decided before pilot users or real records enter the app:

- Alpha/account deployment policy: choose Option A, B, or C from `docs/alpha-account-deployment-decision.md`.
- Stakeholder option lifecycle: final decision is retire active options; Titan direction is absorbed into the East Tech guide.
- Custom-domain live cutover: product/app target is `thecapstoneproject.com`; East Tech guide future custom domain is `TBD`; live activation remains separate until Pages domains, DNS/TLS, and product workspace/API health pass.
- Real-user temporary credential delivery policy: choose HD-2026-05-21-001 before importing real pilot users.
- Google Drive upload permission/policy: keep `npm run check:drive:live` passing against the configured Shared Drive evidence root.

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

`check:cloudflare` is intentionally static-only. Run `check:cloudflare:live` for read-only live Pages/D1 proof.

## Cloudflare Live Gate

Live gate command, only when `CLOUDFLARE_API_TOKEN` exists:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live
```

Required result:

- The Cloudflare API token verifies successfully through `GET https://api.cloudflare.com/client/v4/user/tokens/verify`.
- Wrangler `whoami` is optional and non-blocking. Scoped API tokens can be valid and active even when `whoami` cannot retrieve account identity.
- Live Pages project `senior-capstone-app` exists.
- Live D1 database `senior-capstone-db` exists and matches database id `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`.
- Run log records the exact result.

If the token is missing, record `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`. Do not claim live verification passed.

## Google Drive Live Gate

Live Drive gate command:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:drive:live
```

Required result before real student file bytes:

- Live `/api/health` reports `EVIDENCE_STORAGE_PROVIDER=google_drive`, root configured, index configured, and both Google Drive credential parts configured without exposing secret values.
- The deployed runtime service account can exchange its JWT for an access token.
- The configured root id is visible to the service account and has MIME type `application/vnd.google-apps.folder`.
- The configured index id is visible to the service account and has MIME type `application/vnd.google-apps.spreadsheet`.
- A fake `.test` student can upload one tiny text proof through `/api/submissions/:id/evidence/upload`.
- Remote D1 has the `evidence_artifacts` row and `evidence_file_uploaded` audit event; the verification must not select or print raw Drive file IDs.
- Signed-out, non-student, unsupported, empty, and oversized upload denials still fail before provider success.
- Upload response and browser/API refresh output do not include `drive_file_id`, `driveFileId`, parent folder ids, access tokens, private keys, or fake account passwords.

Current 2026-05-21 PT status:

- Cloudflare Pages runtime credential parts are configured.
- The Drive evidence root now points at Shared Drive folder `0AJHkstxfN-dTUk9PVA`; the Evidence Index sheet remains `1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0`.
- After a production Pages deploy, `npm run check:drive:live` passes token exchange, root folder visibility, index sheet visibility, fake `.test` upload, D1 metadata/audit verification, denial guards, and storage-ID leak checks.
- `npm run check:workspace:hosted-evidence` is the explicit hosted workspace alias for the same fake `.test` upload/download gate, including the >5MB resumable upload/download path.
- `npm run check:workspace:hosted-permissions` is the explicit hosted permission-state gate for fake `.test` role/scope accounts; it skips honestly if the ignored credential file or env credentials are unavailable.

## D1 Binding Gate

Before deploy:

- Static `wrangler.jsonc` D1 binding check passes.
- Required migrations are committed.
- Any new remote migration is applied and verified only when authorized token/session exists.
- Remote D1 verification is recorded before real student records enter the app.

Current 2026-05-21 PT status: remote D1 migrations `0001` through `0009` are applied and recorded by Wrangler; required MVP tables including `export_artifacts` and `presentation_slots` were verified remotely without selecting student rows.

Pilot blocker:

- If any migration is pending remotely and live verification cannot run, record the pending migration and block real-record pilot use.

## API Health Gate

After a deploy or cutover, verify:

- `GET /api/health` returns 200 on the app hostname.
- `GET https://thecapstoneproject.com/api/health` returns 200 after target product custom-domain activation.
- Health output does not expose secret values.
- D1 and evidence configuration fields report expected readiness state.
- `GET /api/auth/me` returns an unauthenticated response without leaking user records when no session is present.
- `GET https://thecapstoneproject.com/api/auth/me` signed out returns the expected unauthenticated response.
- `https://thecapstoneproject.com/workspace.html` reaches the canonical workspace or app navigation points there.
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
- Retired stakeholder options are not part of active deterministic generated output.
- `check:site-options` confirms retired stakeholder options are not active deploy targets and do not link to `account.html`.

## Custom-Domain Cutover Checklist

Domain direction is resolved:

- Product/app target: `thecapstoneproject.com` -> `senior-capstone-app`.
- Product alias if configured: `www.thecapstoneproject.com` -> `senior-capstone-app`.
- Optional split app hostname only if needed: `app.thecapstoneproject.com`.
- East Tech guide future custom domain: `TBD`.
- Current legacy hostnames pending migration: `thecapstoneapp.com`, `www.thecapstoneapp.com`, and `app.thecapstoneapp.com`.
- Retired stakeholder options: no product hostname mapping and no active deploy scripts.

Before claiming live cutover:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:custom-domain-cutover
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:custom-domain-cutover --live-required --live-http
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:alpha-account-gating
```

Required live checks:

- `https://thecapstoneproject.com` reaches the product root/workspace safely.
- `https://www.thecapstoneproject.com` loads or redirects safely if the alias is configured.
- `https://thecapstoneproject.com/api/health` returns 200.
- `https://thecapstoneproject.com/api/auth/me` signed out returns unauthenticated/no-record output.
- `https://thecapstoneproject.com/workspace.html` is reachable.

Use `docs/custom-domain-cutover-checklist.md` for the detailed steps and rollback path.

## Rollback Checklist

If any post-deploy or cutover check fails:

- Stop accepting real student records.
- Move DNS/CNAME records back to the last known-good Pages hostname or previous domain target.
- Revert only the deployment or DNS change that caused the failure; do not reset the repo.
- Record the failed command, hostname, response code, and timestamp in the run log.
- Re-run the local gate and live gate before retrying.
- Keep alpha/account and stakeholder review surfaces unlinked from production navigation during rollback.
