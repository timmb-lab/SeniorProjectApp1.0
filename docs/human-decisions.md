# Human Decision Queue

This file is the durable queue for decisions Bryan needs to make or explicitly accept. Automations should add items here when a decision affects cost, accounts, deployment, privacy, school operations, or long-term maintenance.

Status values:

- `open`
- `recommended`
- `accepted`
- `rejected`
- `superseded`

## Open Decisions

No open external automation scheduler decisions are blocking the current scaffold. The Google Drive evidence root folder is selected and configured, first-admin bootstrap is complete for `bryan.timm89@gmail.com`, and the production setup key has been removed. Remaining setup work is configuration/implementation: add Cloudflare Pages Google Drive credential secrets before real student uploads, add account lifecycle flows, broaden permission tests, and provide `CLOUDFLARE_API_TOKEN` before the next non-interactive Pages/D1 project/deployment/secret verification or remote mutation/deploy proof.

### HD-2026-05-20-002

- `status`: open
- `area`: canonical URL and production surface cutover
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Choose the final public URL/domain mapping before pilot: whether the future custom domain points to `senior-capstone-app`, `senior-capstone-public`, or a split such as public guide on the root domain and app/backend on an app subdomain.
- `current recommendation`: Keep `senior-capstone-app` as the canonical secure app/backend and `senior-capstone-public` as a production-safe generated public guide until the custom domain plan is chosen.
- `decision workflow`: `docs/custom-domain-cutover-checklist.md`
- `created`: 2026-05-20

### HD-2026-05-20-003

- `status`: open
- `area`: internal QA route exposure before pilot
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Decide whether `alpha.html` and `account.html` should remain deployed but unlinked for Bryan/internal QA, move behind an additional access gate, or be removed from production deployment before real pilot users enter the app.
- `current recommendation`: Keep them unlinked and clearly labeled through the Day 7 alpha, then gate or remove them before pilot use with real records.
- `decision workflow`: `docs/alpha-account-deployment-decision.md`
- `created`: 2026-05-20

### HD-2026-05-20-004

- `status`: open
- `area`: stakeholder option retention
- `owner`: Bryan
- `severity`: P2
- `decision needed`: Decide whether to keep both stakeholder option Pages projects after review, retire one or both, or promote one direction into the canonical public guide.
- `current recommendation`: Keep both as labeled review artifacts until Bryan selects a visual direction; do not promote either without updating the production-surface policy and registry.
- `decision workflow`: `docs/stakeholder-option-lifecycle.md`
- `created`: 2026-05-20

### HD-2026-05-20-005

- `status`: open
- `area`: live Cloudflare verification token
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Decide whether to provide `CLOUDFLARE_API_TOKEN` for read-only non-interactive Pages/D1 verification before the next deploy or custom-domain cutover.
- `current recommendation`: Provide a scoped token for verification runs when possible; if unavailable, record `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN` for remote Pages/D1 management and treat only static Cloudflare checks plus direct live endpoint checks as passed. On 2026-05-20, repo `check:cloudflare` passed static config, `check:cloudflare:live` failed because no token was exported, Wrangler `whoami --json` reported `loggedIn:false`, tool discovery did not expose a Cloudflare connector, and direct live signed-out/signed-in endpoint checks for `senior-capstone-app` passed.
- `decision workflow`: `docs/production-predeploy-checklist.md`
- `created`: 2026-05-20

### HD-2026-05-20-006

- `status`: open
- `area`: Google Drive service-account secrets for live uploads
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Add or verify the Cloudflare Pages secret values for `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY` in `senior-capstone-app` production, and preview if preview upload testing is desired.
- `current recommendation`: Add both Drive credential secrets in Cloudflare Pages without exposing values in repo or chat, then rerun live Drive probe/upload/download verification with fake `.test` accounts only. Live `/api/health` on 2026-05-20 reports `GOOGLE_DRIVE_EVIDENCE_ROOT_ID` and the index configured, but `googleDriveCredentialParts.clientEmail=false` and `googleDriveCredentialParts.privateKey=false`, so real Drive upload/download is blocked.
- `decision workflow`: `docs/progress/human-action-email-draft-2026-05-20-cloudflare-drive.md`
- `created`: 2026-05-20

## Accepted Decisions

### HD-2026-05-20-001

- `status`: accepted
- `area`: external Codex automation scheduler
- `owner`: Bryan
- `severity`: P0
- `decision`: Use the split external Codex scheduler with `senior-capstone-nonfigma-mvp-builder` hourly at minute 0 PT and `senior-capstone-figma-product-builder` hourly at minute 30 PT. Keep `senior-capstone-daily-mvp-summary` and `senior-capstone-weekly-script-audit` active as oversight/reporting automations, not builder capacity. Keep `senior-capstone-hourly-qol-orchestrator` paused or manual diagnostic only.
- `accepted implementation`: Live hidden Codex registry audit on 2026-05-20 found the two expected builders ACTIVE with `FREQ=HOURLY;BYMINUTE=0;BYSECOND=0` and `FREQ=HOURLY;BYMINUTE=30;BYSECOND=0`, daily/weekly oversight ACTIVE, and `senior-capstone-hourly-qol-orchestrator` PAUSED.
- `evidence`: `automation/qol/state/automation-registry-evidence.json`
- `created`: 2026-05-20
- `accepted`: 2026-05-20

### HD-2026-05-18-003

- `status`: accepted
- `area`: Cloudflare/GitHub account authorization, MVP auth mode, and evidence storage
- `owner`: Bryan
- `severity`: P0
- `decision`: Use Bryan's authorized Cloudflare account for the first remote MVP foundation, use hardened username/password auth because district SSO is not available, and use Google Drive as the MVP upload/evidence repository path.
- `accepted implementation`: Cloudflare Pages project `senior-capstone-app` is configured for GitHub-connected deployment; D1 database `senior-capstone-db` is created and migrated; Pages preview/production environment variables point to hardened username/password auth and Google Drive evidence storage; Google Drive evidence root folder `1XPgYKbIMqv332DAJZJNJetHppFB670e7` and index sheet `1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c` exist.
- `remaining configuration`: add server-side Google Drive upload credentials/OAuth, account lifecycle flows, and broader permission tests before accepting real student uploads. First-admin bootstrap is complete, the production `BOOTSTRAP_SETUP_KEY` has been removed, and `PASSWORD_PEPPER`, `SESSION_PEPPER`, and `GOOGLE_DRIVE_EVIDENCE_ROOT_ID` are already set in Cloudflare Pages.
- `current account evidence`: Cloudflare account `539e8f7c55e7b1472013626ad72f4c7f` is reachable from prior proof; D1 and Pages provisioning succeeded; Workers has existing Worker `it-networking-curriculum`; R2 remains disabled with Cloudflare error `10042` but is no longer an MVP blocker because Google Drive is the accepted evidence repository path. GitHub app access is installed for `timmb-lab`. Local Wrangler 4.93.0 is available through the repo dependency and wrapper; global `npm`, `npx`, and live read-only Pages/D1 verification remain blocked in this shell until `CLOUDFLARE_API_TOKEN` is provided.
- `safe automation behavior`: Continue local scaffold, tests, and Cloudflare Pages/D1 configuration. Do not enter real student data or claim pilot readiness until Drive upload credentials, account lifecycle, and permission tests are complete.
- `source`: User confirmed on 2026-05-18: "You are authorized in cloudflare... We need hardned Un?pw as we can't connect to district SSO -- uploads need to have google drive repo"
- `last updated`: 2026-05-18

### HD-2026-05-18-001

- `status`: accepted
- `area`: Cloudflare production stack, secure users, database, groups, progress, and private uploads
- `owner`: Bryan with rebuild lane recommendation
- `severity`: P0
- `decision`: Proceed with the default Cloudflare-compatible stack unless later evidence forces a superseding ADR.
- `accepted stack`: TypeScript app deployed from GitHub to Cloudflare Workers/Pages + Cloudflare D1 + Google Drive evidence repository for MVP uploads + hardened username/password pilot auth until school SSO becomes available + server-side authorization and audit logging. Cloudflare R2 remains a future fallback only if enabled and approved.
- `why this is recommended`: Bryan has stated the hosting goal is GitHub to Cloudflare Workers with a future purchased domain. The revised MVP needs a fully functional secure database for users, groups, roles, progress, submissions, reviews, approvals, private evidence, announcements, dashboards, and audit logs. The stack decision should now optimize for Cloudflare deployment without weakening auth, authorization, backups, or private evidence controls.
- `options`:
  - `A`: Cloudflare Workers/Pages + D1 + R2 + Workers-compatible managed auth or school-approved SSO. Aligns with the revised hosting goal; auth/security design must be made explicit.
  - `B`: Cloudflare Workers/Pages + external managed Postgres/storage/auth. Keeps Cloudflare hosting while using stronger managed data/auth services if D1/R2 are not enough.
  - `C`: Next.js + Supabase + Vercel or equivalent. Faster integrated auth/database/storage path, but now conflicts with the preferred Cloudflare hosting direction unless used as a fallback.
  - `D`: Custom server + database + storage. Maximum control, highest maintenance burden.
- `automation instruction`: Rebuild should implement option A by default and only open a new human-decision item if account ownership, district policy, credentials, budget, or production provisioning blocks the work.
- `acceptance check`: `docs/architecture/adr-0001-stack-auth-database-upload.md` is accepted and implementation work begins with auth, database, storage, backup/export, local development, secrets, GitHub-to-Cloudflare deployment, and custom-domain assumptions explicit.
- `created`: 2026-05-18
- `accepted`: 2026-05-18

### HD-2026-05-18-003

- `status`: accepted
- `area`: MVP delivery constraint and Figma plan
- `owner`: Bryan
- `severity`: P0
- `decision`: Bryan upgraded Figma to a professional plan and set the operating target to reach MVP in 100 automation passes or fewer over roughly the next 45 days.
- `impact`: Automations should keep the existing cadence and active status, but each pass should reduce implementation ambiguity and prioritize secure hosted MVP evidence over broad polish.
- `source`: User request on 2026-05-18: "I updated the pklan to a professional one so can we try all the figma calls again and get it caught up? I want you to really really dial in to get to a MVP in 100 passes or less over the next 45 days or so"
- `last updated`: 2026-05-18

### HD-2026-05-18-002

- `status`: accepted
- `area`: deployment direction and product roadmap
- `owner`: Bryan
- `severity`: P0
- `decision`: The Senior Capstone MVP should target GitHub-connected Cloudflare Workers/Pages hosting. Bryan expects to purchase a custom domain later. Version 2.0 should explore iOS and Android apps with notifications and announcements, but no student-to-student messaging.
- `impact`: Rebuild should favor Cloudflare-compatible architecture and deployment work; Figma should keep mobile-aware patterns visible without turning mobile into MVP scope; audit should reject student messaging features and keep mobile work behind MVP 1.0.
- `source`: User request on 2026-05-18 asking to revise the MVP around a fully functional secure database, Figma/Canva-heavy design, GitHub-to-Cloudflare Workers hosting, and a 2.0 iOS/Android app goal.
- `last updated`: 2026-05-18
