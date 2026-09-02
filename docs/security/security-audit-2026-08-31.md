# Senior Project App Security Audit

Date: 2026-08-31
Scope: local repository, Cloudflare Pages Functions, D1 access patterns, authentication, authorization, Google identity and Drive integration, browser controls, dependencies, and safe local tests.
Production access: the initial audit was local-only. The authorized 2026-09-01 closeout applied migration `0024`, deployed the reviewed build, repaired fake `.test` accounts, ran live fake-account checks, and performed read-only Cloudflare inspection. No real user account or record was used.

## Executive decision

The code and deployed production build are materially safer after this audit. No known critical issue remains in the reviewed code, the security-focused tests pass, migration `0024_project_request_safety.sql` is applied, and the reviewed build is deployed. Fake-data production testing is approved. Real-user launch remains a **conditional no-go** until the remaining organizational controls and the staff MFA/passkey risk are accepted or closed.

The most serious confirmed problems were an internal QA API that could be reachable and mutated without authentication when environment configuration was wrong, Google SSO account-lifecycle gaps, and an unlocked development dependency tree with known high-severity advisories. These are fixed in the repository.

## Method

The audit traced:

- local-password login, reset, password change, session creation, session readback, and logout;
- Google OAuth/OIDC start, state, callback, hosted-domain, identity-link, tenant-membership, and offboarding behavior;
- role and record boundaries for Global Admin, Site Admin, Administration, Program Teacher, Mentor, Viewer, and Student;
- site, program, cohort, mentor-assignment, student, project, and team membership scope;
- every application mutation route for method and same-origin enforcement;
- JSON, multipart file, URL, identifier, and SQL handling;
- Google Drive link, service-account upload, download, probe, and repository metadata paths;
- audit-event content, provider errors, secrets, committed configuration, and error responses;
- browser headers, static scripts/styles, dynamic HTML escaping, and external-link handling;
- package versions, lockfile state, `npm audit`, CI installation, and dependency-audit enforcement.

All database mutation and role-boundary tests used local fixtures or disposable local SQLite/D1-compatible databases. No real student record was read or changed.

## Fixed findings

| ID | Severity | Finding | Resolution |
|---|---:|---|---|
| SEC-01 | High | The legacy alpha state API and QA pages could be exposed when `APP_ENV` was missing or wrong. The API was unauthenticated and could write shared QA state and audit-like records. | QA pages and the alpha API now default to blocked. They work only in explicit `local`, `development`, or `test` environments. Alpha mutations also require an allowed origin. |
| SEC-02 | High | Google SSO trusted an existing identity without rechecking active tenant membership, and a recreated Google account with the same email but a different `sub` could be silently linked. | SSO now requires an active user, matching tenant identity, and active tenant membership. A conflicting email identity with a new Google subject is denied for manual review. |
| SEC-03 | High (supply chain) | The repository had no lockfile and the development toolchain reported five high-severity and one low-severity advisories. | A lockfile was created, Wrangler and Cloudflare types were upgraded, `npm audit` is clean, CI now uses `npm ci --ignore-scripts`, and CI blocks high-severity advisories. |
| SEC-04 | Medium | Login limiting was account-only, allowing password spraying across many accounts from one address. SSO starts and current-password checks were not similarly bounded. | Added per-account and per-IP login limits, per-IP SSO-start limits, and authenticated password-change failure limits. D1 indexes support the time-window lookups. |
| SEC-05 | Medium | Password hashing used PBKDF2-HMAC-SHA-256 at 100,000 iterations, and verification did not reliably honor the stored work factor. | New passwords use 600,000 iterations. Legacy 100,000-iteration credentials remain usable and are upgraded after a successful login. Unsupported or malformed work factors fail safely. |
| SEC-06 | Medium | Production authentication could fall back to an empty password or session pepper if a secret was missing. Session readback had a separate path that did not share the fail-closed rule. | Login, reset, password change, session creation, session lookup, Google SSO, bootstrap, and `/api/auth/me` now fail closed when required production secrets are absent. |
| SEC-07 | Medium | Any authenticated user could call Drive repository and live-probe diagnostics, disclosing operational posture and triggering provider work. | These endpoints now require the security-management permission and audit denied access. |
| SEC-08 | Medium | A project update could combine a project from one school with a submitted site from another school, creating a cross-school membership change for a multi-site manager. | Updates now load the project, reject archived/missing projects, and require the actual project site to match the submitted site before membership changes. |
| SEC-09 | Medium | Some JSON and multipart routes could buffer a large body before enforcing a limit. | Project and mentor-assignment JSON now use the bounded JSON reader. Uploads reject oversized declared requests and check rate limits before parsing multipart data. |
| SEC-10 | Medium | Audit metadata redaction was shallow, and a Google token-exchange response body could enter an application error and later an audit record. | Audit metadata is recursively bounded and redacted on write and read. Provider response bodies are no longer copied into token-exchange errors. |
| SEC-11 | Medium | Sessions could accumulate without a practical active-session cap. | Session creation cleans old records and revokes active sessions beyond the newest ten-account window. Password changes still revoke prior active sessions. |
| SEC-12 | Low | Static and API responses had partial browser protections only. | Added restrictive CSP, HSTS, clickjacking protection, MIME-sniffing protection, permissions policy, same-origin resource/opener policies, and consistent headers on JSON, redirects, and file responses. Inline script remains disallowed; style attributes are allowed only because current progress meters use bounded inline widths. |
| SEC-13 | Low | The production-surface and permission verifiers encoded obsolete product rules: they rejected controlled school theming and assigned-mentor review. | The checks now allow only the exact school-theme mapping and prove that mentors may review assigned students but cannot review unassigned students. |
| SEC-14 | Medium | The app-managed Drive path had more access than the link-first student workflow needs. | Production is now `link_only`. The upload route stops before parsing a file and directs the student to save a Drive link. Legacy recovery code uses the narrower `drive.file` scope. |
| SEC-15 | Low-Medium | Login and audit fingerprints used unkeyed SHA-256. | Login, rate-limit, session-context, and audit fingerprints now use HMAC-SHA-256. A dedicated rotatable key is supported, with the existing session pepper as a safe transition fallback. |
| SEC-16 | Low | Public health output revealed environment, auth, database, roster, and Drive readiness details. | Signed-out health now returns only `{ ok: true }`. Detailed readiness is returned only to a signed-in security administrator. |
| SEC-17 | Low | Two first-admin requests could pass the initial empty-account check at the same time. | Bootstrap now claims the first account with one conditional database insert. Only one concurrent request can win. |
| SEC-18 | Low | Production sessions did not use the browser-enforced `__Host-` cookie prefix. | Production now forces `__Host-sc_session` with `Secure`, `Path=/`, no `Domain`, `HttpOnly`, and `SameSite=Lax`. Local development keeps its local cookie name. |

## Controls confirmed

- Session values are random, stored as hashes, and sent in `Secure`, `HttpOnly`, `SameSite=Lax`, path-scoped cookies without a `Domain` attribute.
- State-changing routes use POST/DELETE and reject a conflicting browser `Origin`; no state-changing GET route was found in the application API.
- D1 statements use bound parameters. Dynamic placeholder counts are derived from server-bounded arrays; no injectable SQL value concatenation was found.
- Students are self-scoped. Viewers are assignment-scoped and read-only. Mentors are assignment-scoped. Program Teachers are program/cohort-scoped. Site roles are site-scoped. Global security and tenant management remain Global/Platform Admin-only.
- Project groups allow one to five students. Project and Google Drive links are normalized and rendered with HTML escaping. External links open with `noopener noreferrer`.
- Student evidence links accept only exact `drive.google.com` or `docs.google.com` hosts after HTTPS, credential-bearing URL, deceptive-host, and credential-harvesting checks.
- The student interface and committed production mode store Google Drive links rather than reading or copying a student's folder.
- Legacy app-managed files remain readable for controlled recovery, but new production uploads are retired and the remaining provider scope is `drive.file`.
- No tracked environment file, private key, password, or token was found by the repository/history checks performed during this audit.

## Remaining risks and required decisions

| ID | Severity | Remaining risk | Required action |
|---|---:|---|---|
| REM-02 | Medium | Local password accounts, including a possible Global Admin, have no application MFA or passkey requirement. Google Workspace SSO is disabled by launch decision `HD-2026-09-01-001`. | Keep hardened local login for the approved fake-data phase. Before real staff use, implement app-native MFA/passkeys or record a formal risk acceptance with tightly controlled break-glass credentials and recovery ownership. |
| REM-03 | Closed | Migration `0024_project_request_safety.sql` is applied, the reviewed build is deployed, signed-out health is minimal, production is `link_only`, fake role accounts work, and hosted permission/Drive-link gates pass. | Keep the hosted gates in every production closeout. |
| REM-05 | Low-Medium | Cloudflare read-only inspection confirmed active Managed Free WAF and DDoS L7 rulesets for both product zones. No custom auth- or API-specific edge rate-limit rule was proven. | Add and verify custom edge limits for auth, upload, and unusually high API request rates if traffic or pilot risk justifies them. Keep the application limits as defense in depth. |

## Verification record

- Security backlog closure suite: 5 passed, 0 failed.
- Full local application suite: 555 tests discovered; 551 passed, 0 failed, and 4 credential-backed local HTTP browser checks were skipped without opt-in credentials.
- Role matrix verifier: passed.
- Mutation-origin coverage verifier: passed.
- Production-surface leak verifier: passed across 103 production text surfaces.
- Predeploy consistency verifier: passed.
- Workspace accessibility, error-state, mobile, URL-state, and generated-route checks: passed after updating the route inventory.
- TypeScript typecheck: passed.
- Dependency audit: 0 critical, 0 high, 0 moderate, 0 low.
- Functionality UX automation contract: passed after the automation name and twice-hourly schedule were aligned; the automation remains paused until the user chooses to activate it.
- Authorized Cloudflare closeout on 2026-09-01: migration `0024` applied; deployment `c9b35b67-7a30-415c-8160-10206681b2ae` is live; Pages and D1 identities matched; no migration remains pending.
- Live signed-out check on 2026-09-01: the workspace loads with the simple sign-in screen, `/api/health` returns only `{ "ok": true }`, local hardened login is enabled, Google SSO is disabled, and production reports the link-only evidence contract.
- Hosted fake-account proof on 2026-09-01: the seven canonical `.test` accounts were recreated and the permission matrix passed for Student, Program Teacher, Mentor, Viewer, Misc Admin, Site Admin, and Global Admin. The Drive-link evidence gate also passed. No real account was used.
- Live signed-out browser check on 2026-09-01: light/dark switching, notice contrast, scroll behavior, and the phone layout passed with no horizontal overflow. Authenticated role-by-role browser navigation remains pending the required password-entry confirmation.
- Cloudflare edge-policy check on 2026-09-01: both active product zones expose Cloudflare normalization, Managed Free WAF, and DDoS L7 rulesets. No settings were changed and no custom auth-specific edge rule was proven.

## Security baselines used

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP HTTP Security Response Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [Google OpenID Connect reference](https://developers.google.com/identity/openid-connect/reference)

## Production closeout checklist

1. Close or formally accept REM-02 before real staff use. Google Workspace SSO was explicitly rejected for the current launch; app-native MFA/passkeys are the remaining technical option.
2. Store peppers and provider credentials only in the approved Cloudflare secret store; rotate any credential whose custody is uncertain.
3. Keep migration and deployment checks green; `0024` and the reviewed build are live as of 2026-09-01.
4. Complete the interactive fake-account browser walkthrough; hosted API role and negative-boundary checks already pass.
5. Confirm internal QA routes return 404 when `APP_ENV` is missing and when it is `production`.
6. Confirm CSP, HSTS, `nosniff`, frame denial, and no-store headers on the deployed site and API.
7. Confirm Google identity offboarding and recreated-account handling with controlled test identities.
8. Configure Cloudflare edge protections, monitoring, and alert review ownership.
9. Record acceptance or remediation owners and dates for every remaining item above.
