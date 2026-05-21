# Human Decision Queue

This file is the durable queue for decisions Bryan needs to make or explicitly accept. Automations should add items here when a decision affects cost, accounts, deployment, privacy, school operations, or long-term maintenance.

Status values:

- `open`
- `recommended`
- `accepted`
- `rejected`
- `superseded`

## Open Decisions

No open external automation scheduler decisions are blocking the current scaffold. The Google Drive Shared Drive evidence root is selected, configured, and passes the live fake-upload gate; first-admin bootstrap is complete for `bryan.timm89@gmail.com`; the production setup key has been removed; Cloudflare live verification token decision is resolved; hosted fake `.test` role permission proof now covers student, program teacher, mentor, misc-admin denial, and admin allowed paths; the official product/domain decision is now Capstone Project at target `thecapstoneproject.com`; the East Tech guide future domain is TBD; and stakeholder option comparison is retired. Live custom-domain cutover remains separate and must not be claimed until Pages custom domains, DNS/TLS, product workspace/API health, and alpha/account exposure checks pass. Remaining setup work is configuration/implementation and policy: keep the broader temporary credential delivery policy open beyond the narrow Bryan-approved five-account staff/admin handoff, resolve the new tenant Google Workspace SSO decisions, live-prove Google Docs export with a fake native Docs fixture if approved, keep hosted upload/dashboard proof passing after deployment, and broaden remaining permission tests.

### HD-2026-05-21-010

- `status`: open
- `area`: tenant Google Workspace SSO, local fallback, and school-owned storage policy
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Decide the production tenant/identity/storage policy before live Google Workspace SSO or real school tenant onboarding is enabled.
- `specific decisions`:
  - Which production tenant domain(s) should be allowed for Google Workspace SSO?
  - Should auto-provisioning create role-pending users, or should SSO require pre-provisioned users only?
  - Should local password login remain enabled for real users after SSO is live?
  - Who can use break-glass local login?
  - Should tenant evidence storage stay app-managed Google Drive for MVP or move to school-owned Drive before pilot?
  - What is the tenant offboarding policy for exports, retention, disabled accounts, and archive handoff?
  - Which Google Cloud project/OAuth client owns the production app?
  - Which redirect URIs are approved beyond the current legacy `https://app.thecapstoneapp.com/api/auth/google/callback`?
  - Should product-domain app-owned accounts be treated as internal admin identities or normal tenant identities?
- `current recommendation`: Keep Google Workspace SSO disabled in production until the Google Cloud OAuth client, Cloudflare Pages secrets/env vars, tenant-domain records, and hosted fake-account regression checks are complete. Keep local auth enabled for fake `.test`, local smoke, development, and explicit break-glass use until Bryan approves a narrower policy.
- `implementation status`: Schema, safe auth config, SSO start/callback routes, workspace sign-in behavior, mocked integration tests, backend setup notes, and ADR-0002 are implemented as a fail-closed foundation. No production tenant domain has been added to the repo seed data.
- `created`: 2026-05-21

### HD-2026-05-21-001

- `status`: open
- `area`: temporary credential delivery for imported accounts
- `owner`: Bryan
- `severity`: P1
- `decision needed`: Decide whether the admin import flow may use one-time admin-visible temporary credentials for real pilot account setup, or whether the app must implement an email/invitation/school-approved credential delivery path before real users are imported.
- `current recommendation`: Use the new admin workspace one-time display UI only for fake `.test` alpha proof and internal setup. Code now blocks real non-`.test` admin-visible temporary credential imports by default unless `ALLOW_REAL_TEMP_CREDENTIAL_IMPORT=true` is intentionally configured after policy acceptance. Before real student or staff accounts, Bryan must choose one of: approve a documented manual one-time credential distribution procedure; implement an invitation/email delivery path; or keep real imports blocked until a district-approved identity delivery path exists. Do not put temporary credential values in docs, Figma, screenshots, logs, audit metadata, commits, or chat.
- `2026-05-21 update`: Bryan approved a narrow real owner/admin account setup for `bryan.timm89@gmail.com` / Bryan Timm only. Remote D1 verification on 2026-05-21 found the account already active with global `admin` role and no reset requirement, so no duplicate account and no new Bryan setup credential were created. This is an owner/admin bootstrap/repair exception and does not approve real student, staff, mentor, or parent imports. General real-user credential delivery remains open. `/api/admin/users/import` should continue blocking real non-`.test` admin-visible temporary credential imports unless Bryan separately accepts a credential delivery policy and intentionally configures `ALLOW_REAL_TEMP_CREDENTIAL_IMPORT=true`.
- `2026-05-21 staff/admin exception`: Bryan approved only the five-account real staff/admin manual temporary credential handoff for `timmb@nv.ccsd.net`, `clarkj9@nv.ccsd.net`, `christr@nv.ccsd.net`, `rawsojp@nv.ccsd.net`, and `bryan@thecapstoneapp.com`, with all temporary credentials sent only to `bryan@thecapstoneapp.com` for manual distribution. The exception does not approve real student imports, parent imports, broad staff imports, future reusable real-user credential distribution, or sending credentials directly to individual account holders. Temporary credentials must require reset on first login and must not be committed, printed, logged, placed in docs/evidence/audit metadata/screenshots, or sent anywhere except the approved Bryan handoff.
- `decision workflow`: Figma node `158:2` (`Prototype / 22 / Admin import temporary credential handoff`), Figma node `163:2` (`Prototype / 23 / Admin import proof QA handoff`), and handoff `H-2026-05-21-002`.
- `created`: 2026-05-21

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

- `status`: accepted
- `area`: stakeholder option retention
- `owner`: Bryan
- `severity`: P2
- `decision`: Retire Titan Blend and Back To Basics as active options. Absorb Titan direction into the East Tech guide.
- `implementation status`: Active option build/dev/deploy package scripts are removed; `check:site-options` validates retirement state; Cloudflare project cleanup remains manual follow-up unless verified live.
- `decision workflow`: `docs/stakeholder-option-lifecycle.md`
- `created`: 2026-05-20
- `accepted`: 2026-05-21

### HD-2026-05-20-007

- `status`: open
- `area`: archive retention policy
- `owner`: Bryan
- `severity`: P2
- `decision needed`: Confirm the student archive download/retention window and whether the default 14-day package availability is acceptable before pilot archives use real student records.
- `current recommendation`: Keep `ARCHIVE_DOWNLOAD_WINDOW_DAYS=14` and `ARCHIVE_RETENTION_POLICY_STATUS=policy_review_required` until school retention policy is confirmed; use fake `.test` accounts only for archive package verification.
- `decision workflow`: `functions/_lib/archive-export.ts` and `wrangler.jsonc`
- `created`: 2026-05-20

### HD-2026-05-21-002

- `status`: open
- `area`: Google Docs live export provider fixture and format policy
- `owner`: Bryan
- `severity`: P2
- `decision needed`: Decide whether the app should live-prove native Google Docs evidence export with a fake `.test` Google Docs fixture in the Shared Drive, and confirm the preferred export format for native Docs before real records rely on it.
- `current recommendation`: Keep the implemented app default as PDF export for native Google Docs (`application/vnd.google-apps.document` -> `application/pdf`) because it is broadly readable and stable for archive/download packages. Use only a fake `.test` fixture document for live proof. Do not create or export real student Docs until the credential-delivery and archive-retention decisions are resolved.
- `implementation status`: Provider-safe code/tests now classify native Google Docs in archive manifests and use the Google Drive `files.export` endpoint for app-scoped evidence downloads. Live Google Docs export is not yet claimed because no fake native Docs fixture has been approved or seeded for hosted proof.
- `decision workflow`: `functions/_lib/google-drive.ts`, `functions/api/evidence/[id]/download.ts`, and `functions/_lib/archive-export.ts`
- `created`: 2026-05-21

## Accepted Decisions

### HD-2026-05-20-002

- `status`: superseded
- `area`: canonical URL and production surface cutover
- `owner`: Bryan
- `severity`: P1
- `decision`: Use `thecapstoneapp.com` as the production domain with root mode `guide-root-app-subdomain`.
- `accepted mapping`: Public guide on `thecapstoneapp.com` and `www.thecapstoneapp.com` through `senior-capstone-public`; secure app/backend on `app.thecapstoneapp.com` through `senior-capstone-app`.
- `live cutover state`: not yet verified in docs by this decision alone. Pages custom-domain association, DNS/TLS, public guide health, app health, and alpha/account exposure checks remain separate proof gates.
- `stakeholder exclusion`: `senior-capstone-option-titan` and `senior-capstone-option-primary` remain review-only and must not be mapped to the production hostnames.
- `decision workflow`: `docs/custom-domain-cutover-checklist.md`
- `created`: 2026-05-20
- `accepted`: 2026-05-21
- `superseded by`: Capstone Project target-domain decision on 2026-05-21: product/app target is `thecapstoneproject.com`, East Tech guide future domain is TBD, and old `thecapstoneapp.com` hostnames are legacy/current pending migration.

### HD-2026-05-21-011

- `status`: accepted
- `area`: final product naming, domain, and surface split
- `owner`: Bryan
- `severity`: P1
- `decision`: Official product title is Capstone Project, not "The Capstone Project"; product/app target domain is `thecapstoneproject.com`; `www.thecapstoneproject.com` may be an alias; `app.thecapstoneproject.com` is optional only if a split is required; East Tech guide future custom domain is TBD; the app is school-agnostic and tenant-ready; East Tech/Titan branding belongs only to the East Tech guide.
- `stakeholder outcome`: Titan Blend and Back To Basics are retired as active options; Titan direction is absorbed into the East Tech guide.
- `live cutover state`: Bryan registered `thecapstoneproject.com` in Cloudflare during the Part 2 run and authorized live target-domain work. Live success must still be based on Pages custom-domain association, DNS/TLS, workspace/API health, and final verification output.
- `decision workflow`: `docs/custom-domain-cutover-checklist.md`, `docs/production-surface-registry.md`, `docs/stakeholder-option-lifecycle.md`
- `accepted`: 2026-05-21

### HD-2026-05-20-006

- `status`: accepted
- `area`: Google Drive service-account live uploads
- `owner`: Bryan
- `severity`: P1
- `decision`: Move the evidence root to the Shared Drive folder `0AJHkstxfN-dTUk9PVA` while keeping the existing Evidence Index sheet `1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0`.
- `accepted implementation`: On 2026-05-21 PT, `wrangler.jsonc`, Cloudflare Pages production/preview environment variables, and remote D1 `evidence_repositories.default-google-drive` were updated to the Shared Drive root. A production Pages deploy completed, then `npm run check:drive:live` passed provider config, runtime credential parts, fake `.test` auth, denial guards, Drive token/root/index probes, fake upload, remote D1 evidence/audit verification, and storage-ID leak checks.
- `decision workflow`: `docs/progress/human-action-email-draft-2026-05-20-cloudflare-drive.md`
- `created`: 2026-05-20
- `accepted`: 2026-05-21

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
- `accepted implementation`: Cloudflare Pages project `senior-capstone-app` is configured for GitHub-connected deployment; D1 database `senior-capstone-db` is created and migrated; Pages preview/production environment variables point to hardened username/password auth and Google Drive evidence storage; Google Drive evidence Shared Drive root folder `0AJHkstxfN-dTUk9PVA` and index sheet `1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0` exist.
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
