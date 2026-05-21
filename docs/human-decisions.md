# Human Decision Queue

This file is the durable queue for decisions Bryan needs to make or explicitly accept. Automations should add items here when a decision affects cost, accounts, deployment, privacy, school operations, or long-term maintenance.

Status values:

- `open`
- `recommended`
- `accepted`
- `rejected`
- `superseded`

## Open Decisions

No open external automation scheduler decisions are blocking the current scaffold. The Google Drive evidence root folder is selected and configured, first-admin bootstrap is complete for `bryan.timm89@gmail.com`, the production setup key has been removed, and the Cloudflare live verification token decision is resolved. Remaining setup work is configuration/implementation: fix the Google Drive upload HTTP 403 before real student uploads, finish account lifecycle flows, decide temporary credential delivery before real pilot accounts, and broaden permission tests.

### HD-2026-05-21-001

- `status`: open
- `area`: temporary credential delivery for imported accounts
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Decide whether the admin import flow may use one-time admin-visible temporary credentials for real pilot account setup, or whether the app must implement an email/invitation/school-approved credential delivery path before real users are imported.
- `current recommendation`: Use one-time admin display only for fake `.test` alpha proof and internal setup. Before real student or staff accounts, either Bryan approves a documented manual distribution procedure or the rebuild lane implements an invitation/email delivery policy. Do not put temporary credential values in docs, Figma, screenshots, logs, audit metadata, commits, or chat.
- `decision workflow`: Figma node `158:2` (`Prototype / 22 / Admin import temporary credential handoff`) and handoff `H-2026-05-21-002`.
- `created`: 2026-05-21

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

### HD-2026-05-20-006

- `status`: open
- `area`: Google Drive service-account secrets for live uploads
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Resolve the Google Drive upload HTTP 403 after the corrected sandbox root/index IDs.
- `current recommendation`: Keep the existing Cloudflare token and Drive credential secrets. Bryan verified the sandbox root folder and index sheet IDs were stale/wrong; `wrangler.jsonc`, Cloudflare Pages env vars, and D1 metadata now point to the verified `Senior Capstone App` folder and `Evidence Index` sheet. `npm run check:drive:live` now passes token exchange plus root/index probes, but the fake upload route still fails truthfully with `drive_upload_failed` and redacted Google Drive status 403. Confirm the service account can create files in that folder under Workspace policy; if the 403 is quota/ownership related, move the root to a Shared Drive or use an approved delegated Workspace identity, then rerun `npm run check:drive:live`.
- `decision workflow`: `docs/progress/human-action-email-draft-2026-05-20-cloudflare-drive.md`
- `created`: 2026-05-20

### HD-2026-05-20-007

- `status`: open
- `area`: archive retention policy
- `owner`: Bryan
- `severity`: P2
- `decision needed`: Confirm the student archive download/retention window and whether the default 14-day package availability is acceptable before pilot archives use real student records.
- `current recommendation`: Keep `ARCHIVE_DOWNLOAD_WINDOW_DAYS=14` and `ARCHIVE_RETENTION_POLICY_STATUS=policy_review_required` until school retention policy is confirmed; use fake `.test` accounts only for archive package verification.
- `decision workflow`: `functions/_lib/archive-export.ts` and `wrangler.jsonc`
- `created`: 2026-05-20

## Accepted Decisions

### HD-2026-05-20-005

- `status`: accepted
- `area`: live Cloudflare verification token
- `owner`: Bryan
- `severity`: P1
- `decision`: Bryan provided/loaded a valid user-scope Cloudflare API token for read-only non-interactive Pages/D1 verification.
- `accepted implementation`: On 2026-05-20 PT, `npm run check:cloudflare` and `npm run check:cloudflare:live` passed. Token verify returned valid/active, Pages project `senior-capstone-app` was visible, D1 database `senior-capstone-db` was visible, and the D1 id matched `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`. `wrangler whoami --json` warned for the scoped token, but that is non-blocking because token verify plus Pages/D1 lookup passed.
- `historical context`: Earlier runs recorded `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`, and one 2026-05-20 22:43 PT aggregate check saw Cloudflare reject a token with `Invalid access token [code: 9109]`. Those are no longer the current state.
- `decision workflow`: `docs/production-predeploy-checklist.md`
- `created`: 2026-05-20
- `accepted`: 2026-05-20

### HD-2026-05-20-001

- `status`: accepted
- `area`: external Codex automation scheduler
- `owner`: Bryan
- `severity`: P0
- `decision`: Use the quarter-hour external Codex scheduler with `senior-capstone-nonfigma-mvp-builder` hourly at minute 0 PT, `senior-capstone-figma-product-builder-15` hourly at minute 15 PT, `senior-capstone-nonfigma-mvp-builder-30` hourly at minute 30 PT, and `senior-capstone-figma-product-builder` hourly at minute 45 PT. Keep `senior-capstone-daily-mvp-summary` and `senior-capstone-weekly-script-audit` active as oversight/reporting automations, not builder capacity. Keep `senior-capstone-hourly-qol-orchestrator` paused, absent, or manual diagnostic only.
- `accepted implementation`: Live hidden Codex registry audit on 2026-05-20 found the four expected quarter-hour builders ACTIVE at minutes 0, 15, 30, and 45 PT, daily/weekly oversight ACTIVE, superseded same-minute duplicate rows PAUSED, and `senior-capstone-hourly-qol-orchestrator` absent/not revived.
- `evidence`: `automation/qol/state/automation-registry-evidence.json`
- `created`: 2026-05-20
- `accepted`: 2026-05-20

### HD-2026-05-18-003

- `status`: accepted
- `area`: Cloudflare/GitHub account authorization, MVP auth mode, and evidence storage
- `owner`: Bryan
- `severity`: P0
- `decision`: Use Bryan's authorized Cloudflare account for the first remote MVP foundation, use hardened username/password auth because district SSO is not available, and use Google Drive as the MVP upload/evidence repository path.
- `accepted implementation`: Cloudflare Pages project `senior-capstone-app` is configured for GitHub-connected deployment; D1 database `senior-capstone-db` is created and migrated; Pages preview/production environment variables point to hardened username/password auth and Google Drive evidence storage; Google Drive evidence root folder `1pfEhlrU1fax9N8LfaoA1Cyo5nUIXetG2` and index sheet `1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0` exist.
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
