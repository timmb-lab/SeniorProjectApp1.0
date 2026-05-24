# Full Multisite Sales MVP Audit

Date: 2026-05-24

Repo: `C:\SeniorProjectApp1.0`

Branch inspected: `main`

Starting HEAD for this audit phase: `2c5735c36977a401512bfa41feeca425070c357a`

This audit is intentionally repo-based and documentation-only. It does not build routes, change schema, seed data, run remote writes, deploy, change domain/OAuth/Cloudflare configuration, touch ignored credential files, or edit live Figma.

## 1. Executive Summary

Yes, the repo is now on the right MVP path. Phases 1 through 6.5 moved the product away from a single-school guide/dashboard posture and toward a multi-organization, multi-site sales MVP for school and district administrators. The strongest work so far is not cosmetic: the contract is explicit, the site/role migration exists, announcements were removed from the active MVP product surface, site-aware permission helpers exist, fake multisite demo data is locally seeded and proven, and Figma source context has been inspected.

No, it is not ready for a school or district sales demo today. It can prove a lot locally to a technical reviewer, but it cannot yet carry a credible principal/AP walkthrough. The missing pieces are visible and important: the site admin dashboard route is not built, student directory and student detail are not built, the live remote D1 database still needs migration `0011_multisite_site_role_foundation.sql` before remote multisite proof or seed write, and the authenticated workspace still does not fully look like the actual Figma product control center.

What is complete:

- The sales MVP contract and decisions exist and are specific.
- Tenant means organization/district/customer and site means school/campus.
- Migration `0011_multisite_site_role_foundation.sql` adds `sites`, `site_users`, `site_programs`, plus `platform_admin`, `org_admin`, `site_admin`, and `viewer`.
- Announcements are removed from active workspace loading, active API routes, route inventory, and demo seed creation. The legacy table remains deprecated/schema-only.
- Helper-first site-aware capabilities cover platform, org, site, viewer, program teacher, mentor, student, review, presentation, archive, audit, and security questions.
- Local Desert Valley School District demo data is seeded and proven with three fake sites, 370 fake students, no student credentials, no new announcements, safe example.com evidence links, and named demo story buckets.
- Phase 6 added exact Figma palette values and future workspace CSS hooks.
- Phase 6.5 inspected the actual Figma file/node read-only and produced a visual audit.

What is still missing:

- Route-connected `/api/site/...` dashboard, student directory, and student detail families.
- A first-viewport, site-scoped Administration dashboard that uses the Figma dark product header and operating-view language.
- A dense student directory and student detail experience with private evidence, audit, and status context.
- Consistent status problem-state treatment: reason, owner, and next action for revision, blocked, rejected, and override states.
- Remote D1 migration `0011` and any subsequent remote seed/proof phase.
- Hosted screenshot/browser proof for the eventual site admin, directory, student detail, viewer, mobile, empty, and permission-denied states.
- A real user onboarding and credential-delivery policy before pilot users.

What is truly proven:

- Local migrations and local D1 behavior are proven through tests and Phase 5A proof.
- Permission helper behavior is proven by `tests/site-aware-permissions.test.mjs`.
- Existing admin, program teacher, mentor, student, review, presentation, archive/readiness, audit, import, and role assignment routes have integration/source coverage.
- Local fake demo data shape is proven, including multisite counts, story buckets, no student credentials, no new announcements, and storage redaction.
- The workspace source is checked to remain announcement-free.

What is only documented:

- Target `/api/site/...` route families.
- Site admin dashboard design behavior.
- Student directory and student detail design behavior.
- Full Figma operating-view application in the authenticated app.
- Tenant-owned Drive future direction.
- Real pilot compliance, onboarding, credential delivery, and district policy.

What is locally proven but not remotely proven:

- The Desert Valley multisite data shape.
- Site-aware seeded personas and their local dashboard behavior.
- Local dashboard/API proof using generated fake staff credentials from ignored files.
- Remote seed/proof scripts are source-tested, but the live remote D1 target has not been migrated or seeded for the multisite shape.

What is still blocked by remote D1 migration `0011`:

- Remote multisite dry-run inspection of the live target shape.
- Any safe Phase 5B remote seed write.
- Remote hosted proof of multisite demo data.
- Remote validation of site roles, site memberships, and site-program mappings against the real Cloudflare D1 database.

What should happen next:

- Run Phase 6.6 before Phase 7.
- Keep Phase 6.6 small: CSS/UX/copy/status/header cleanup only, no routes.
- Then build Phase 7 site admin dashboard against the Figma operating-view requirements and this audit.

Should Phase 6.6 happen before Phase 7? Yes. The next feature route should not inherit the current light/generic dashboard posture. A quick visual cleanup first will give Phase 7 a reusable product header, status/problem-state language, and token aliases so the dashboard starts on the correct design foundation.

## 2. Phase Ledger

| Phase | Commit | What changed | Validation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Phase 1 contract | `8a9991b docs: define multisite sales demo MVP contract` | Created the multisite sales demo contract and decision record. Defined tenant as organization/district/customer, site as school/campus, target roles, announcement removal, Figma alignment, fake data rules, and route direction. | `npm run test`, `npm run typecheck`, `npm run check`, `npm run check:production-surfaces`, `git diff --check` passed. | Complete | This was a target contract, not implementation. It correctly identified that site schema did not yet exist. |
| Phase 2 schema/site/roles | `1c6ee05 db: add multisite site and role foundation` | Added migration `0011_multisite_site_role_foundation.sql` with `sites`, `site_users`, `site_programs`, roles `platform_admin`, `org_admin`, `site_admin`, `viewer`, default sandbox site, and compatibility updates. | Local migration applied; local proof checked default site, active programs, new roles, old roles, duplicates, FK check; test/typecheck/check passed. | Complete locally | Remote migration was not run. The migration is additive and should remain the required remote gate before remote seed. |
| Phase 3 announcements removal | `8bf6fe7 chore: remove announcements from MVP workspace` | Removed workspace announcement loading/cards, deleted active announcement API route files, regenerated route inventory, removed new announcement seed creation, updated docs/tests. | Route inventory, production surfaces, test, typecheck, check, diff-check passed. | Complete | Legacy `announcements` table remains in `0001` as deprecated/schema-only for later cleanup. |
| Phase 4 site-aware permission helpers | `beb510f auth: add site-aware permission capabilities` | Added role helpers, tenant/site scope helpers, and capability helpers for platform, org, site, viewer, directory, detail, review, notes, mentor assignment, presentation, archive, readiness, audit, security, and tenant config. | Test/typecheck/check/diff-check passed with 267 passing tests and expected local HTTP skips. | Complete as helper foundation | Current routes were not broadly converted. Existing `admin` route compatibility remains intentionally narrow through `isAdmin`. |
| Phase 5A local multisite seed/proof | `7f26ef4 data: add multisite demo seed and local proof` | Added Desert Valley School District fake tenant, three sites, 370 students, staff/mentor/admin/viewer personas, site memberships, site programs, story buckets, evidence, reviews, meetings, presentation, archive metadata, no student credentials, no announcements. | Local dry-run, local reset, local proof, test, typecheck, check, diff-check passed. Remote dry-run was blocked before write because remote D1 lacks `sites`. | Complete locally, remote blocked | Phase 5B is unsafe until migration `0011` is applied remotely in an approved phase. |
| Phase 6 Figma token/design foundation | `f8ac7d8 ui: add Figma-aligned workspace design foundation` | Added exact Figma-derived palette values and workspace design hooks, target role labels, viewer read-only banner, and future CSS classes for site context, student directory/detail, filters, story/risk chips, metric action tiles, and empty states. | Test/typecheck/check/production-surfaces/diff-check passed. | Complete as foundation | Did not build site dashboard, directory, detail, or fully apply the live Figma product header. |
| Phase 6.5 UX visual audit | `2c5735c docs: audit Figma UX alignment before site dashboard` | Created the Figma/UX audit, inspected live Figma read-only metadata/context for file `z4t4tFPAKrMDh6pIYOeEw6`, page `0:1`, node `2:5`, and confirmed live Figma was not edited. | Test/typecheck/check/production-surfaces/diff-check passed. | Complete | Found partial alignment only and recommended `06.6_design_cleanup_before_dashboard.txt` before Phase 7. |

## 3. Current Product Architecture

The current product architecture is a transition architecture. It now has the primitives needed for multisite sales MVP work, but the user-facing route layer is still mostly the older compatibility surface.

Tenant as organization/district/customer:

- `migrations/0010_tenant_google_sso.sql` adds the `tenants` table.
- The product contract defines tenant as organization, district, or customer until later naming work changes it.
- `tenant_domains`, `identity_providers`, `tenant_users`, `auth_identities`, and `oauth_states` support tenant-aware Google SSO and membership concepts.
- The current fake sales demo tenant is Desert Valley School District.

Site as school/campus:

- `migrations/0011_multisite_site_role_foundation.sql` adds `sites`.
- A site belongs to one tenant.
- Sites have active/suspended/archived status, timezone, school year, and tenant-unique slug.
- The local demo seed creates Desert Valley High School, Canyon Ridge Career Academy, and North Valley Technical High School.

`site_users`:

- Added by migration `0011`.
- Joins users to sites with membership status.
- Used by permission helpers to resolve assigned site access for site admins, viewers, students, mentors, and program teachers indirectly.
- Local demo seed populates this for staff, mentors, students, and leadership personas.

`site_programs`:

- Added by migration `0011`.
- Joins sites to programs.
- Used by helper logic to derive site access for program teachers scoped to programs.
- Local demo seed maps all active programs to the primary site and selected programs to secondary sites.

`tenant_users`:

- Added by migration `0010`.
- Supports tenant membership independent of site membership.
- Used by permission helpers for org admin tenant visibility.
- It is not yet surfaced as a full org management UI.

Auth identities:

- Current auth includes password sessions and Google identity tables.
- `functions/api/auth/me.ts` returns authenticated user and role assignments.
- Auth/session behavior is proven locally by integration and smoke tests.
- Google Workspace SSO/domain cutover is not part of this MVP phase sequence.

Role assignments:

- Current role assignment storage remains `user_roles`.
- Roles now include legacy roles plus new multisite roles after migration `0011`.
- Assignment scopes use `scope_type` and `scope_id`.
- Admin import and role assignment APIs accept new role IDs but still use legacy admin route gates for existing compatibility.

Current route families:

- Auth/session routes: `/api/auth/me`, login/logout/change/reset support.
- Legacy admin routes: `/api/admin/dashboard`, audit events, user import, role assignments, mentor assignments, archive exports.
- Program teacher route: `/api/program-teacher/dashboard` and `/api/teacher/review-queue`.
- Mentor routes: dashboard/assigned/meetings.
- Student routes: dashboard, submissions, evidence, archive readiness.
- Shared operations: presentation slots, review history/decision.

Current compatibility routes:

- `/api/admin/dashboard` remains global legacy admin, not site-scoped Administration.
- `/api/reports/readiness` remains aggregate readiness and allows legacy `misc_admin`.
- Existing review and dashboard routes use the older global/program/cohort/mentor/student scopes, not the future `/api/site/...` family.

What is still single-site/global:

- The primary admin dashboard is global and reports `scope: "admin_global"`.
- Admin audit events are legacy admin-only in current route behavior.
- Admin user import and role assignment routes are not yet site-admin scoped.
- Workspace navigation does not yet start from a site selector or site context.
- Public guide surfaces remain East Tech/Titan guide surfaces and are intentionally separate from the authenticated product.

What is now multi-site-capable:

- Schema supports sites, site users, and site programs.
- Permission helpers can answer tenant/site access and route-capability questions.
- Demo seed can create a fake district with multiple fake sites.
- Local proof verifies local multisite data shape and site-aware permission helper behavior.
- Future CSS hooks exist for site context, student directory, detail panels, story chips, risk chips, and empty states.

## 4. Role and Permission State

| Role | Intended behavior | Implemented behavior | Proven behavior | Remaining gaps | Risks |
| --- | --- | --- | --- | --- | --- |
| `platform_admin` | Platform/system administration across organizations and sites. | Role exists; `isPlatformAdmin` treats it and legacy `admin` as platform-capable for new helpers. Some current admin routes still require legacy `admin`. | Site-aware permission tests prove platform access to tenants, sites, security, users, student records, and review mutation through helpers. | Existing route gates are not fully broadened to `platform_admin`; route-by-route conversion is needed. | Confusion if a seeded platform admin cannot use legacy admin routes that still require `admin`. |
| Legacy `admin` | Compatibility platform-equivalent during transition, preserving Bryan/admin access. | Current admin routes mostly still depend on legacy `admin`; new helpers treat it as platform-equivalent. | Admin dashboard, import, role assignment, review, archive, presentation, and readiness tests prove current behavior. | Eventually needs explicit migration path toward `platform_admin`. | If future code mixes `isAdmin` and `isPlatformAdmin` casually, access may be inconsistent. |
| `org_admin` | Organization-level oversight across assigned tenant and sites, no platform security. | Helper-supported via tenant scope and tenant membership. No route-connected org dashboard yet. | Permission tests prove tenant/site visibility and denial of platform security/user management. | No org UI, no org-scoped admin routes, no production route proof. | May be over-promised in demos if visible route layer is not built. |
| `site_admin` / Administration | Site-level leadership operations for principals/APs. | Role exists and displays as "Administration" in workspace role labels; helper-supported assigned site operations. | Permission tests prove assigned site dashboard/directory/detail/evidence/mentor/presentation/archive/readiness helper access and denial of platform security/user management. | No site admin dashboard route yet; current admin dashboard is global legacy admin. User import is not site-scoped yet. | This is the most important sales demo role and is not ready as a route-connected product experience. |
| `viewer` | Read-only operational visibility for assigned site/scope. | Role exists; helper denies mutation/security/audit event management; workspace has read-only banner. | Permission tests prove read-only site visibility and denial of mutation/user/security actions. Workspace tests cover read-only banner source. | Future route UI must consistently disable action affordances and mark read-only mode. Current legacy routes are not broadly viewer-enabled. | A viewer route that accidentally exposes mutation would be a high-trust demo failure. |
| `program_teacher` | Program/cohort-scoped review queue and student visibility. | Current routes and helpers support program/cohort/global teacher scope. | Dashboard, review queue, review decision/history, and site-aware tests prove scoped access and denied bad scopes. | Needs dense Figma-aligned queue UI, filters, intervention reasons, owner/next action, and site-aware route composition. | Teachers can be technically correct while the UI still feels too sparse for a sales demo. |
| `mentor` | Assigned-student-only visibility and mentor workflow. | Current mentor dashboard and helpers rely on active `mentor_assignments`. | Mentor dashboard and site-aware tests prove assigned-only access and denial of broad directory/review mutation. | Needs richer assigned scope UI, meeting/readiness/evidence grouping, and assignment management for admins. | Mentor visibility can be hard to explain if not visually framed as assigned scope. |
| `student` | Own record, own submissions/evidence, own presentation/archive readiness. | Current student dashboard, evidence, archive, presentation, and review readback paths are self-scoped. | Student dashboard smoke/integration/source tests prove own access, evidence attach/upload handling, archive readiness, redaction, and denied cross-student access. | Student directory/detail are admin-facing later routes; student work surface still needs stronger Figma work-surface hierarchy. | Student account credentials are intentionally not created in Phase 5A demo seed, so live student persona demo is limited unless a later safe policy adds them. |
| `misc_admin` | Legacy narrow aggregate/readiness role, not site admin. | Still aggregate readiness only; denied student detail and review/admin operations. | Site-aware tests, readiness tests, review tests, and workspace smoke prove narrow behavior. | Needs careful copy so it is not mistaken for Administration. | Role name is confusing. It can undercut admin demo clarity if surfaced too prominently. |

## 5. Data Model and Migration Audit

Foundation schema:

- `migrations/0001_foundation.sql` creates the core user account, password credential, session, role, user role, program, cohort, group, membership, mentor assignment, requirement, progress, status history, submission, review, comment, evidence repository, evidence artifact, deadline, announcement, export, audit event, and app setting tables.
- The original role set is `student`, `mentor`, `program_teacher`, `admin`, and `misc_admin`.
- The foundation schema still includes the legacy `announcements` table.

Tenant migration:

- `migrations/0010_tenant_google_sso.sql` creates tenants, tenant domains, identity providers, tenant users, auth identities, and OAuth states.
- It includes a default sandbox tenant and a sandbox Google Workspace provider row marked as needing configuration.
- It does not add school/campus sites.

Site migration:

- `migrations/0011_multisite_site_role_foundation.sql` adds `sites`, `site_users`, and `site_programs`.
- It adds roles `platform_admin`, `org_admin`, `site_admin`, and `viewer`.
- It creates a default sandbox site and maps active programs to the sandbox site for compatibility.
- It is additive and is the required remote D1 blocker before any safe remote multisite seed.

Announcements table status:

- The table still exists in the foundation migration.
- Active announcement API route files have been deleted.
- Workspace announcement loading/cards were removed.
- Demo seeds no longer create announcement rows, though reset cleanup can remove older demo-owned rows.
- Later destructive cleanup can be considered only after a separate safe schema cleanup phase.

Evidence/export/audit tables:

- Evidence artifacts support metadata and Drive-backed fields, but API responses and proof scripts assert storage identifiers are redacted.
- Archive/export tables and route code support manifest artifacts, provider readiness, retention/expiry states, and scoped download behavior.
- Audit events are written for dashboard, review, student detail, evidence, presentation, archive, import, role assignment, and permission-denied flows.
- Admin audit route redacts sensitive metadata.

Presentation/mentor tables:

- `mentor_assignments` exists in the foundation schema and is used by mentor dashboards and permission helpers.
- Presentation slots are created by later migrations and used by `/api/presentation-slots`.
- Tests prove presentation slot visibility and update behavior for scoped roles.

Gaps for site-scoped production routes:

- No `/api/site/dashboard` route yet.
- No `/api/site/students` directory route yet.
- No `/api/site/students/[studentId]` route family yet.
- Current admin dashboard queries are global and do not filter by site.
- Current admin import and role assignment routes do not enforce site-admin scoped user management.

Whether destructive schema cleanup is needed later:

- Not before the sales demo route build.
- The legacy `announcements` table can remain deprecated/schema-only.
- Legacy `admin` and `misc_admin` compatibility should remain until a clear migration plan exists.
- Destructive cleanup should be deferred until after remote migration/seed proof and route-level site behavior are stable.

## 6. Seed and Proof Audit

Desert Valley School District fake tenant:

- Phase 5A creates the fake tenant `Desert Valley School District`.
- It uses fake `.test` demo domains only.
- It is designed for repeated sales storytelling, not random filler data.

Three fake sites:

- Desert Valley High School: primary site with 250 fake students.
- Canyon Ridge Career Academy: secondary site with 60 fake students.
- North Valley Technical High School: secondary site with 60 fake students.

370 fake students:

- 370 total fake student accounts are created in local demo seed.
- Student records are distributed 250/60/60 across sites.
- Students use fake demo-student domain addresses.

No student credentials:

- Phase 5A intentionally creates no student credentials.
- This protects against accidental student-login demo drift and keeps student-persona proof controlled.
- Staff/persona credential files are written only under ignored local paths and are not documented with values.

No announcements:

- Demo seeds do not create new announcements.
- Proof checks assert no demo announcement rows remain.
- This supports the product non-goal: Capstone Project is not a messaging/announcement replacement.

Story buckets:

- Model excellent.
- Missing mentor.
- Awaiting review.
- Revision requested.
- Presentation pending.
- Archive ready.
- Archive failed.
- High risk.
- Rich timeline.

Persona docs:

- `docs/demo/personas.md` lists fake persona names, fake emails, roles, scope, and demo purpose.
- It deliberately does not include credential values.

Local proof status:

- Phase 5A local dry-run passed.
- Phase 5A local reset seed passed.
- Phase 5A local proof passed.
- Local proof verifies multisite shape, story buckets, no announcements, no student credentials, safe example.com evidence links, and site-aware permission helper behavior.

Remote dry-run blocker:

- Remote dry-run was attempted in Phase 5A only because Cloudflare API auth was available in the environment.
- It failed before any write because remote D1 was missing the `sites` table.
- No remote migration, reset, seed, or write was run.

Remote D1 missing migration `0011`:

- This is the main remote blocker.
- Remote D1 must apply `0011_multisite_site_role_foundation.sql` in an approved phase before Phase 5B remote seed write is safe.

Should 5B be done now or deferred?

- Defer 5B.
- Run Phase 6.6 and Phase 7 locally first so the remote seed supports a route-connected, credible dashboard demo.
- Run remote migration `0011` and remote seed/proof only in a dedicated approved phase with explicit safety gates.

## 7. UX / Visual / Figma Audit Synthesis

Phase 6.5 inspected the actual Figma project context read-only:

- File key: `z4t4tFPAKrMDh6pIYOeEw6`.
- Page: `0:1`, `00 Master Plan + Foundations`.
- Node: `2:5`, `Senior Capstone Product Control Center`.
- Live Figma was not edited.

What matches Figma:

- The workspace contains exact palette values for ink, muted, paper, surface, blue, green, amber, red, teal, violet, coral, gold, and border.
- Role labels now include new multisite roles, including `site_admin` displayed as "Administration".
- Viewer read-only banner support exists.
- Future CSS hooks exist for site context, directory/detail, filter bars, story/risk chips, metric action tiles, and empty states.
- App preview/public docs contain useful product concepts such as private evidence, scoped roles, audit-sensitive actions, and status variants.

What does not match Figma:

- The authenticated app does not lead with the dark charcoal product header.
- The gold eyebrow and exact posture chips are missing from the main signed-in workspace.
- The rendered experience still reads as a light generic dashboard in key places.
- North Star Workflow cards are not visible after sign-in.
- Permission/data rule cards are not consistently represented.
- Status chip coverage is incomplete for blocked, overridden, archived, and some problem states.
- Problem states do not consistently expose reason, owner, and next action.
- Admin visuals do not yet read as a serious violet/audit/admin operating view.

Token fidelity:

- Hex values are mostly exact in `workspace.css`.
- Naming still carries ABC-era aliases such as yellow, purple, and line instead of explicit gold, violet, and border aliases.
- Public guide, alpha, account, and app preview surfaces use separate palettes and should not be forced into the product system before the authenticated app is ready.

Header pattern gaps:

- Missing dark product header.
- Missing gold product context text.
- Missing exact chips: Database-backed MVP, No student messaging, Cloudflare target, Private evidence, Audit-sensitive admin.
- Missing first-viewport site/role/scope posture for Administration.

Status chip gaps:

- Status uses text plus color in many places, but the Figma status set is not fully covered.
- Draft, Submitted, Under review, Revision requested, Approved, Blocked, Overridden, and Archived should be explicit.
- Revision, blocked, rejected, and override states need reason, owner, and next action.

North Star workflow gap:

- Student work surface, Teacher review queue, Mentor assigned scope, and Admin operating view are not consistently visible as product concepts in the authenticated workspace.

Permission/data rule gap:

- Private evidence, Role scoped views, Audited changes, and Teacher intervention need reusable visual treatment.

School-operations seriousness gap:

- The backend and copy are serious.
- The rendered UI still needs to feel less like a developer dashboard and more like a school operations control center for principals, APs, CTE coordinators, mentors, and district staff.

## 8. Sales Demo Readiness

| Demo area | Current readiness | Evidence | Gap | Next action |
| --- | --- | --- | --- | --- |
| Sign-in | Partial | Workspace sign-in supports auth states and source tests/smoke checks. | Does not use Figma dark product header or posture chips. | Phase 6.6 product header/copy cleanup. |
| Site admin dashboard | Not ready | Roles/schema/helpers and global admin dashboard exist. | No site-scoped dashboard route/UI; current admin dashboard is global legacy admin. | Phase 7 after Phase 6.6. |
| Student directory | Not ready | Permission helpers and future CSS classes exist. | No route-connected directory and no dense filtered UI. | Phase 8. |
| Student detail | Not ready | Student dashboard/detail readback/review history/evidence pieces exist. | No site-scoped detail route or full admin-facing detail experience. | Phase 9. |
| Program teacher review queue | Partial | `/api/teacher/review-queue`, dashboard, review tests, audit tests. | UI lacks dense queue filters/actions and reason/owner/next action. | Later review workflow after core site dashboard/directory/detail. |
| Mentor dashboard | Partial | Mentor dashboard and assigned-student tests exist. | Needs stronger assigned-scope coaching UI and admin assignment workflows. | Later mentor assignment phase. |
| Viewer read-only mode | Partial | Helper tests prove read-only; workspace banner exists. | Needs persistent UI markers and route-level disabled actions in future site routes. | Phase 6.6 marker; Phase 7 route proof. |
| Presentation/readiness | Partial | Presentation slots and readiness/archive tests exist. | Needs school-ops language and site dashboard integration. | Phase 7 summary tiles, later operations detail. |
| Archive/export | Partial | Archive readiness/export source and integration tests exist. | Provider/retention language is technical; remote/hosted proof not complete. | Phase 7 summary, later archive/reporting phase. |
| Audit/security | Partial | Audit events, redaction, import reason, role assignment audits exist. | Current admin audit route is legacy admin-only; site-scoped audit view not built. | Phase 7 should show audit-safe language; later route conversion. |
| Multi-site proof | Local only | Local seed/proof creates and validates three sites and 370 students. | Remote D1 lacks migration `0011`; no remote write/proof. | Dedicated remote migration/seed phase after approved gate. |
| Figma polish | Partial | Exact palette values and audit docs exist; live Figma inspected. | Actual app still not fully using the Figma product control center. | Phase 6.6 before Phase 7. |

Would this look credible in front of principals/APs today?

- Not yet as a polished product demo.
- It would be credible as a technical proof for a trusted internal reviewer.
- It would feel unfinished to a nontechnical administrator because the site admin dashboard, directory, student detail, and Figma control-center header are not yet present.

Minimum design/UX lift before showing it:

- Phase 6.6 dark product header, gold eyebrow, posture chips, status chips, problem-state detail, empty-state cleanup, and read-only marker.
- Phase 7 site admin dashboard with real site-scoped counts and story buckets.
- Phase 8 directory and Phase 9 detail before a complete sales narrative.

## 9. Technical Risk Register

| Risk | Severity | Current mitigation | Remaining action | Owner/phase |
| --- | --- | --- | --- | --- |
| Remote D1 migration `0011` blocker | High | Remote write was not run; blocker documented. | Apply migration remotely only in an approved phase, then run dry-run and proof before seed write. | Remote migration/5B phase |
| Admin role compatibility | High | Legacy `admin` preserved; `platform_admin` introduced helper-first. | Convert routes deliberately and test mixed legacy/new roles. | Phase 7+ route work |
| Future site-scoped routes | High | Helpers and schema exist. | Build `/api/site/dashboard`, `/api/site/students`, and detail routes with tests. | Phases 7-9 |
| Viewer read-only enforcement | High | Helpers deny mutations and workspace banner exists. | Ensure every future route/action treats viewer as read-only and every UI marks it. | Phase 6.6 and Phase 7 |
| Seed/proof divergence local vs remote | High | Remote scripts are source-tested; no remote write yet. | After migration `0011`, run remote dry-run/proof and compare with local proof. | Remote 5B |
| No remote write yet | Medium | All remote writes were deferred. | Keep remote operations behind explicit prompts and confirmations. | Later approved remote phase |
| Figma not fully applied | Medium | Phase 6.5 audit documents exact gaps. | Run Phase 6.6 before new route UI. | Phase 6.6 |
| Route inventory stability | Medium | Inventory regenerated only when routes changed; checks exist. | Do not manually edit inventory without route changes. | Every route phase |
| Cloudflare live verification | Medium | Hosted proof scripts/tests exist, but not run in this phase. | Run hosted proof only after route-connected demo screens exist and credentials are approved. | Hosted proof phase |
| Google OAuth/domain constraints | Medium | Domain/OAuth changes excluded from current sequence. | Keep demo independent of live SSO until policy/config phase. | Later deployment phase |
| Tenant-owned Drive future | Medium | Current storage mode supports app-managed/pending concepts; identifiers are redacted. | Decide tenant-owned Drive migration only after MVP demo/pilot policy. | Later SaaS/productization |
| Real user onboarding / credential policy | High | Demo uses fake `.test`; student credentials are not created. | Define delivery/reset/onboarding policy before real pilot import. | Before pilot |

## 10. Security / Privacy / FERPA-Adjacent Review

Secrets handling:

- This phase did not read, modify, or print ignored credential files.
- Existing docs point to ignored credential-file locations without values.
- Phase 5A and hosted proof tests assert credential values are not printed.

Ignored credential files:

- Demo staff/persona credential files are generated under ignored local paths.
- Docs mention their location pattern only so Bryan can find them locally.
- The audit does not contain credential values.

Credential printing:

- Current scripts/tests emphasize no credential printing or committed values.
- Admin import behavior uses reset-first/temporary credential handling and no-store UI expectations.
- Real user import still requires a delivery policy before pilot.

Raw Drive ID redaction:

- Wrangler has configured Drive-related environment vars, but this audit intentionally omits their values.
- Student dashboard/archive/submission readback APIs redact storage identifiers.
- Tests assert responses do not expose Drive file/folder identifiers or tokens.

Evidence privacy:

- Demo evidence uses metadata-only example.com links.
- Upload/download paths distinguish provider unavailable and scoped download behavior.
- Student, teacher, mentor, admin, and viewer access remains scoped by route/helper rules.

Audit logs:

- Audit events exist and are used for protected dashboard and workflow access.
- Review history/decision, student detail, evidence, presentation, archive, import, and role assignment routes write audit events.
- Admin audit metadata is redacted for sensitive keys.

Role scoping:

- `program_teacher` is program/cohort/global scoped.
- `mentor` is assigned-student scoped.
- `student` is self-only.
- `viewer` is read-only assigned-site in helpers.
- `misc_admin` remains aggregate/readiness only.

Fake data only:

- Demo domains are `.test`.
- No real student data is seeded.
- Protected real/admin rows are preserved by remote seed safety logic.

Remote seed safety:

- Remote write requires explicit remote mode and confirmation.
- Remote seed is blocked until migration `0011` exists remotely.
- Cleanup is limited to demo-owned rows, fake domains, example.com demo evidence, or explicit demo markers.

Real user import guard:

- Admin import requires reason.
- Temporary/reset-first credential behavior is tested.
- Policy remains needed before real pilot users.

Site admin vs platform admin separation:

- Helpers deny site admins platform security, user management, and tenant config.
- Current route layer still needs site-scoped user-management work if site admins will import/manage site users.

Viewer read-only:

- Helper behavior is strong.
- UI consistency needs Phase 6.6 and route-connected proof in Phase 7.

Remaining compliance gaps before pilot:

- Formal FERPA/privacy review.
- Real district data sharing agreement.
- Credential delivery and reset policy.
- Real user onboarding/offboarding.
- Tenant-owned Drive or approved storage policy.
- Hosted production proof of redaction and permission-denied states.
- Audit retention and export policy.

## 11. Testing and Validation Review

Current test counts over phases:

- Phase 1: 251 passing tests plus 4 expected local HTTP skips.
- Phase 2: 258 passing tests plus 4 expected local HTTP skips.
- Phase 3: 258 passing tests plus 4 expected local HTTP skips.
- Phase 4: 267 passing tests plus 4 expected local HTTP skips.
- Phase 5A: 268 passing tests plus 4 expected local HTTP skips.
- Phase 6: 269 passing tests plus 4 expected local HTTP skips.
- Phase 6.5: 274 passing tests plus 4 expected local HTTP skips.

Types of tests:

- Source tests for production workflow contracts and announcement removal.
- Integration tests for admin dashboard, program teacher dashboard, mentor dashboard, student dashboard access, review loop, presentation slots, archive readiness, admin users import, and role assignments.
- Permission helper tests for site-aware capabilities.
- Local and remote seed tests using local SQLite/D1-compatible adapters.
- Workspace source and browser smoke tests.
- Hosted proof source tests for fake-account-only and redaction behavior.
- UX audit content tests for Phase 6.5.

What is well covered:

- Legacy admin dashboard data shape and sensitive-output filtering.
- Program teacher scope and review queue access.
- Mentor assigned-student access.
- Student self-service dashboard, evidence, archive readiness, and redaction.
- Review history/decision auditing and scoped access.
- Presentation slot visibility and state updates.
- Announcement route/source/seed removal.
- Local demo seed shape and story bucket counts.
- Permission helpers for new multisite roles.

What is not covered:

- Route-connected `/api/site/dashboard`, because it does not exist yet.
- Route-connected `/api/site/students`, because it does not exist yet.
- Route-connected `/api/site/students/[studentId]`, because it does not exist yet.
- Browser screenshot proof of the final Figma-aligned site admin dashboard.
- Remote D1 migrated multisite proof.
- Real SSO/domain behavior for a district tenant.
- Real user import delivery policy.

Hosted/browser proof missing:

- Hosted proof should wait until Phase 7-9 surfaces exist.
- Required future screenshots should cover desktop and mobile: sign-in, site admin, directory, detail, teacher, mentor, viewer, empty, and denied states.

Route inventory/production surface checks:

- Current inventory is generated from source and no longer lists announcement routes.
- Production surface registry treats workspace as canonical protected product route and alpha/account surfaces as internal/smoke.
- Route inventory should not be regenerated unless route files change.

Recommended new tests before sales demo:

- Phase 6.6 source tests for product header, posture chips, status set, reason/owner/next-action pattern, no announcements, no raw storage identifiers.
- Phase 7 integration tests for `/api/site/dashboard` site selection, role access, viewer read-only, site-scoped counts, and audit events.
- Phase 7 workspace tests for Figma header and site admin dashboard rendering.
- Phase 8 directory tests for filters, site scoping, viewer read-only, no storage identifiers.
- Phase 9 detail tests for scope, timeline/evidence/review/presentation/archive sections, and problem-state detail.
- Hosted proof tests after route-connected UI exists.

## 12. Remote / Deployment / Cloudflare Readiness

Local proof vs remote proof:

- Local proof is strong for the current MVP state.
- Remote proof is not complete for multisite because the live D1 database lacks migration `0011`.
- Remote proof scripts exist and contain redaction/fake-account safeguards, but should not be run as a substitute for migration/seed approval.

Remote D1 missing migration `0011`:

- This is the main deployment/data blocker.
- Remote D1 needs migration `0011` before remote multisite dry-run, seed write, or hosted proof can be trusted.
- Remote D1 needs the site/role migration before remote multisite dry-run can inspect or seed the intended shape.

Cloudflare API auth status if documented:

- Phase 5A documented that remote dry-run was attempted because Cloudflare API auth was available in the environment.
- The value was not documented and should not be documented.

Domain/OAuth constraints:

- Domain, OAuth, and Cloudflare live config changes are explicitly out of scope for this sequence.
- `wrangler.jsonc` should not be changed in these audit/design phases.
- Google Workspace SSO/domain cutover should remain a later, explicit deployment/policy phase.

Whether to run remote migration now or later:

- Later.
- This audit is no-go for remote migration because it is documentation-only and the next route/UI work can continue locally.
- Run it only in an approved remote phase with a clear rollback/verification plan.

Whether to defer remote seed until after UI:

- Yes.
- Remote seed should wait until Phase 6.6 and at least the Phase 7 site admin route/dashboard are ready to show the data.

Deployment gates needed before live demo:

- Phase 6.6 visual cleanup complete.
- Phase 7 site admin dashboard complete and locally proven.
- Phase 8 student directory and Phase 9 detail complete or intentionally excluded from the demo script.
- Remote migration `0011` applied in approved phase.
- Remote dry-run and proof pass.
- Remote seed write only with fake `.test` data and explicit confirmation.
- Hosted screenshot/browser proof passes.
- No raw storage IDs, secrets, or credential values in docs/API/UI output.

## 13. Product Scope and Non-Goals

Current scope:

- Multi-organization/multi-site sales MVP.
- School/campus site administration.
- Student progress/evidence/review/presentation/archive readiness.
- Role-scoped teacher, mentor, admin, viewer, and student surfaces.
- Fake but realistic demo data.
- Figma-aligned school operations product UI.

Non-goals:

- No announcements.
- No billing yet.
- No real data.
- No tenant-owned Drive migration yet.
- No live domain/OAuth cutover.
- No real user import without policy.
- No overbuilt org analytics before site admin demo.
- No student messaging replacement.
- No destructive schema cleanup in this sequence.
- No remote seed without remote migration and explicit approval.

## 14. Recommended Next Path

Option A: Run Phase 6.6 before Phase 7.

- Add exact Figma token aliases while preserving existing variables.
- Add dark product header classes/rendering.
- Add gold eyebrow/product context text.
- Add posture chips.
- Complete workspace status chip coverage.
- Add problem-state reason/owner/next-action component.
- Improve empty state copy.
- Keep route files unchanged.
- Keep announcement routes/UI absent.

Option B: Skip Phase 6.6 and go directly to Phase 7.

- Faster feature start.
- Higher risk that the site admin dashboard is built on the current light/generic visual pattern.
- More likely to require rework once dashboard, directory, and detail need to match Figma.
- Less coherent for sales-demo credibility.

Recommendation:

- Choose Option A.
- Run `06.6_design_cleanup_before_dashboard.txt` before `07_site_admin_dashboard.txt`.
- The reason is not polish for its own sake. Phase 7 is the main sales-demo screen, and it should start from the actual Figma product control center pattern rather than retrofit it later.

Phase 6.6 should do exactly this:

- Add Figma token aliases for ink, muted, paper, surface, blue, green, amber, red, teal, violet, coral, gold, and border.
- Add or adapt a dark product header pattern in the authenticated workspace.
- Use gold eyebrow text.
- Show header posture chips: Database-backed MVP, No student messaging, Cloudflare target, Private evidence, Audit-sensitive admin.
- Add complete status chip styles for Draft, Submitted, Under review, Revision requested, Approved, Blocked, Overridden, Archived, plus current operational states.
- Add a small reusable problem-state block with reason, owner, and next action.
- Improve important empty states and permission-denied states.
- Ensure focus states remain accessible.
- Add source tests.
- No route changes.
- No remote operations.

## 15. Phase 7 Readiness Requirements

Phase 7 should not start until Phase 6.6 is complete, unless Bryan explicitly accepts visual rework risk.

Phase 7 route requirements:

- Add a site admin dashboard route family, preferably `/api/site/dashboard`.
- It must accept or resolve a site selection.
- It must deny missing/invalid/inactive site scope.
- It must support platform/admin compatibility without weakening scoped roles.

Site selection requirements:

- Site admin should see only assigned site(s).
- Org admin should see sites within assigned tenant.
- Platform/legacy admin should be able to inspect active sites.
- Viewer should see assigned site(s) read-only.

Role access requirements:

- Allow `platform_admin` and legacy `admin`.
- Allow scoped `org_admin`.
- Allow assigned `site_admin`.
- Allow assigned `viewer` read-only.
- Deny program teacher, mentor, student, misc admin unless a later explicit read-only use case is approved.

Site-scoped counts:

- Active students.
- Missing mentor.
- Awaiting review.
- Revision requested.
- Approved/completed.
- Presentation pending.
- Archive ready.
- Archive failed.
- High risk/stale activity.
- Program breakdown.
- Mentor coverage.
- Recent audit summary.

Figma header requirements:

- Dark product header.
- Gold eyebrow.
- White product title.
- Serious school-operations subtitle.
- Posture chips.
- Site/role/scope banner.

Read-only viewer requirements:

- Persistent read-only marker.
- No mutation actions.
- Any hidden/disabled action state should be explicit and accessible.
- Tests must prove viewer cannot mutate.

No announcements:

- No messaging/announcement controls.
- No `/api/announcements` dependency.
- No "current updates" product card.

Audit events:

- Dashboard access should write an audit event.
- Denied access should write an audit event.
- Metadata should be counts/scope only and redacted.

Tests:

- Integration tests for role access and site filtering.
- Source tests for no announcements and no raw storage identifiers.
- Workspace render/source tests for the Figma header and read-only marker.

Local proof:

- Phase 7 should run local seeded proof against Desert Valley.
- It should not require remote D1.

## 16. MVP Backlog

Must do before sales demo:

- Phase 6.6 Figma cleanup.
- Phase 7 site admin dashboard.
- Phase 8 student directory.
- Phase 9 student detail.
- Local proof and browser screenshot proof for these routes.
- Clear demo script using the story buckets.
- No announcements or messaging UI.
- Viewer read-only proof.
- Redaction proof for evidence/storage identifiers.

Should do before pilot:

- Remote migration `0011` in approved phase.
- Remote demo seed/proof with fake data.
- Hosted proof of route and UI behavior.
- Real user onboarding and credential-delivery policy.
- Tenant/domain/SSO policy review.
- Site-scoped user import/role assignment policy.
- Audit retention/export policy.
- Accessibility pass on final screens.

Later SaaS/productization:

- Tenant-owned Drive migration.
- Billing/subscription.
- Org-level analytics.
- Multi-tenant admin console.
- Deeper mentor assignment operations.
- Archive/reporting automation.
- District SSO provisioning and offboarding workflows.
- Data retention configuration.

Not now:

- Remote seed write.
- Remote migration in this audit/design pass.
- Live deploy.
- Domain/OAuth cutover.
- Billing.
- Real student data.
- Announcement replacement.
- Student messaging.
- Destructive schema cleanup.
- Full org-wide analytics before the site admin demo is strong.

## 17. Final Go / No-Go Decision

Go/no-go for Phase 7:

- No-go immediately.
- Go after Phase 6.6 completes the small Figma-aligned design cleanup.

Go/no-go for remote migration `0011`:

- No-go in this phase.
- It should happen later in a dedicated approved remote migration phase.

Go/no-go for remote seed 5B:

- No-go now.
- Remote seed should wait until remote D1 has migration `0011` and the route-connected demo UI is ready enough to justify remote proof.

Go/no-go for sales demo:

- No-go today for a school/district administrator sales demo.
- Go later after Phase 6.6, Phase 7, Phase 8, Phase 9, local browser proof, and a clear remote/hosted proof gate.

Exact next prompt recommended:

`06.6_design_cleanup_before_dashboard.txt`
