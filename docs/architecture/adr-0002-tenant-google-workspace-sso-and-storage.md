# ADR-0002: Tenant Google Workspace SSO And Storage Direction

Date: 2026-05-21

## 2026-09-01 Launch Decision

Google Workspace SSO is not approved for the current launch. Production keeps `AUTH_GOOGLE_SSO_ENABLED=false`, uses hardened local username/password sign-in, and does not configure or use Google OAuth credentials for staff sign-in. The SSO implementation remains a dormant, fail-closed foundation only. This decision does not claim MFA coverage; app-native MFA or passkeys remain future security work if required.

## Context

The app is moving from an alpha-friendly hardened local login model toward a school-subscribed, tenant-aware product. Current fake `.test` accounts and local username/password auth are still required for smoke tests, development, and approved fallback. Production identity should align with school Google Workspace accounts when tenant domains and OAuth client configuration are approved.

Evidence storage is separate from login identity. Students keep their work in school Google Drive. The app stores reviewed links and workflow data in D1; it does not need access to each student's project folder.

## Decision

Add an additive tenant/SSO foundation without weakening existing local auth:

- Model tenants, tenant domains, identity providers, tenant-user membership, auth identities, and OAuth state in D1.
- Keep local username/password login available by default for fake `.test`, local smoke, development, approved fallback, and break-glass access.
- Prefer Google Workspace SSO for production identity through a backend OpenID Connect authorization-code flow.
- Validate Google ID tokens server-side, including issuer, audience, expiration, email verification, subject, nonce/state, and hosted-domain policy where configured.
- Treat Google OAuth `hd` request input as a UI hint only; enforce tenant access from verified ID-token claims and tenant records.
- Keep login scopes minimal: `openid email profile`.
- Keep any legacy Drive service-account credential separate from Google Workspace login configuration.
- Use link-only evidence for new production work. Keep legacy app-managed files available only for controlled recovery while they are phased out.

For evidence and final-file organization, the current production direction is student-owned Google Drive links plus D1 metadata:

- Students save a main project-folder link and item-level Docs, Sheets, Slides, or Drive links. The app opens those links but does not read or copy the folder.
- New direct file uploads are disabled in production. The legacy provider uses the narrower `drive.file` scope for controlled recovery of app-created files.
- Keep D1 as the source of truth for workflow state, evidence metadata, review state, access scope, audit events, retention windows, and package status.
- Treat Cloudflare R2 or S3-compatible storage as a future scale/offboarding option, not a prerequisite for the 7-day functionality push, unless Drive quota, tenant-owned storage policy, or export handoff requirements make Drive unsuitable.
- Hide Drive file IDs, folder IDs, provider tokens, signed URL internals, and raw storage keys from browser output and audit summaries.
- Provide school-owned template links that an authorized school administrator can replace. Students make their own copy and save its link on the matching work item.

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
- When can the legacy app-managed Drive recovery path and its service credential be removed completely?
- What is the tenant offboarding policy for exports, retention, disabled accounts, and archive handoff?
- Which Google Cloud project/OAuth client owns the production app?
- Which additional redirect URIs, if any, are approved beyond `https://thecapstoneapp.com/api/auth/google/callback`?
- Should product-domain app-owned accounts be treated as internal admin identities or normal tenant identities?

## Migration And Offboarding Plan

Retire the legacy app-managed Drive path in this order:

1. Keep current D1 evidence and export metadata stable.
2. Keep old app-created files readable with the narrow `drive.file` scope during the approved recovery window.
3. Give each owner a school-approved handoff or personal copy, and audit the handoff without storing raw Drive IDs in browser output.
4. Remove the service credential and legacy read routes after the retention owner confirms the recovery window has ended.
