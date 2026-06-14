# ADR-0002: Tenant Google Workspace SSO And Storage Direction

Date: 2026-05-21

## Context

The app is moving from an alpha-friendly hardened local login model toward a school-subscribed, tenant-aware product. Current fake `.test` accounts and local username/password auth are still required for smoke tests, development, and approved fallback. Production identity should align with school Google Workspace accounts when tenant domains and OAuth client configuration are approved.

Evidence storage is a separate concern from login identity. The MVP currently uses an app-managed Google Drive evidence repository while D1 stores metadata, workflow state, access state, and audit rows.

## Decision

Add an additive tenant/SSO foundation without weakening existing local auth:

- Model tenants, tenant domains, identity providers, tenant-user membership, auth identities, and OAuth state in D1.
- Keep local username/password login available by default for fake `.test`, local smoke, development, approved fallback, and break-glass access.
- Prefer Google Workspace SSO for production identity through a backend OpenID Connect authorization-code flow.
- Validate Google ID tokens server-side, including issuer, audience, expiration, email verification, subject, nonce/state, and hosted-domain policy where configured.
- Treat Google OAuth `hd` request input as a UI hint only; enforce tenant access from verified ID-token claims and tenant records.
- Keep login scopes minimal: `openid email profile`.
- Keep Drive service-account/storage credentials separate from Google Workspace login configuration.
- Preserve the current app-managed Drive path for MVP while designing for tenant/school-owned Drive resources later.

For evidence and final-file storage, the current production direction remains Google Drive plus D1 metadata:

- Use Google Drive for uploaded proof bytes and archive package artifacts during MVP because the app already has route-backed upload, download/export, audit, and storage-failure handling around that provider.
- Keep D1 as the source of truth for workflow state, evidence metadata, review state, access scope, audit events, retention windows, and package status.
- Treat Cloudflare R2 or S3-compatible storage as a future scale/offboarding option, not a prerequisite for the 7-day functionality push, unless Drive quota, tenant-owned storage policy, or export handoff requirements make Drive unsuitable.
- Hide Drive file IDs, folder IDs, provider tokens, signed URL internals, and raw storage keys from browser output and audit summaries.
- Prefer proof-link fallback language when Drive is unavailable so students can keep moving without fake upload success.

## Consequences

- The existing global unique `user_accounts.email_norm` constraint remains unchanged in this pass. If true duplicate emails across tenants are needed later, that will require a future migration.
- SSO start/callback routes must fail closed unless all required OAuth settings are present.
- Local fake-account testing and password-login regression tests must continue to pass.
- Tenant auto-provisioning is a policy choice, not a default privilege expansion.
- Tenant offboarding must be deliberate: disable access, preserve/export data, hand off school copies when approved, and avoid destructive deletion by default.

## Security Notes

- Do not store OAuth client secrets, ID tokens, access tokens, auth codes, cookies, Drive private keys, setup passwords, or temporary credentials in docs, audit metadata, screenshots, manifests, or browser output.
- Store only OAuth state and nonce hashes in D1.
- Do not request Google Drive scopes for login.
- Do not expose raw Drive file IDs, parent folder IDs, or storage keys in browser JSON.
- This is a FERPA-aligned implementation direction, not a claim of FERPA compliance.

## Current Implementation Status

- `migrations/0010_tenant_google_sso.sql` adds the additive tenant/SSO schema and safe sandbox tenant seed.
- `/api/auth/config` returns safe client auth flags.
- `/api/auth/google/start` creates hashed state/nonce records and redirects only when SSO is configured.
- `/api/auth/google/callback` validates state, exchanges the code server-side, verifies ID-token claims/signature, resolves tenant/domain state, links or provisionally creates users according to tenant policy, and creates the existing app session.
- Workspace sign-in consumes `/api/auth/config` and keeps local login visible when enabled.
- Local mocked SSO integration tests cover disabled config, state replay, invalid tokens, hosted-domain rejection, inactive tenants, unprovisioned accounts, and existing-user session creation.

## Open Decisions

- Which production tenant domain(s) are allowed for Google Workspace SSO?
- Should tenant SSO auto-provision role-pending users, or require pre-provisioned users only?
- Should local password login remain enabled for real users after SSO is live?
- Who is authorized to use break-glass local login?
- Should tenant evidence storage stay app-managed Google Drive through pilot, move to school-owned Drive, or migrate to R2/S3 for stronger offboarding control?
- What is the tenant offboarding policy for exports, retention, disabled accounts, and archive handoff?
- Which Google Cloud project/OAuth client owns the production app?
- Which redirect URIs are approved?
- Should legacy app-owned accounts on the current `app.thecapstoneapp.com` SSO redirect be treated as internal admin identities or normal tenant identities after the product domain target moves to `thecapstoneproject.com`?

## Migration And Offboarding Plan

If Drive stops meeting pilot needs, migrate storage in this order:

1. Keep current D1 evidence and export metadata stable.
2. Add a storage provider abstraction that can read existing Drive-backed artifacts while writing new artifacts to the approved provider.
3. Backfill packages in batches, audit each migration job, and keep source Drive objects until a school-approved retention window passes.
4. Update student and staff UI only after the new provider has download, access-denial, failure, retention, and redaction tests equal to the Drive routes.
