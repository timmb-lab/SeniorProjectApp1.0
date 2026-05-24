# Multisite Sales Demo MVP Contract

Date: 2026-05-24

This contract reframes Capstone Project around the next MVP sequence: a reusable, multi-organization and multi-site sales demo that Bryan can show to school and district administrators. It is a target contract, not an implementation record.

## 1. Product Goal

Capstone Project is a reusable, multi-organization / multi-site capstone management platform for school sites and districts. It supports capstone tracking from planning through evidence, teacher review, mentor support, presentation readiness, and archive/export readiness.

The product should be tenant-ready, school-aware, role-safe, seeded with realistic synthetic data, aligned to the Figma product direction, and focused on administrative visibility into capstone progress and readiness.

## 2. Sales Demo Goal

The demo should let Bryan walk into a room of school/district administrators and show:

- an organization/district
- multiple school sites
- a site administrator dashboard
- a searchable student directory
- student drill-down
- program teacher review workflow
- mentor assigned-student workflow
- viewer read-only workflow
- presentation/archive/reporting readiness
- polished Figma-aligned UI
- fake but realistic seeded data

The demo should not present Capstone Project as only a single-school dashboard, an alpha page, an announcement tool, or an East Tech-only guide.

## 3. Product Hierarchy

Target hierarchy:

```text
Platform
  Organization / District / Customer
    Site / School
      Programs
      Cohorts
      Students
      Program Teachers
      Mentors
      Evidence
      Reviews
      Presentations
      Archive / Exports
```

`tenant` in the current code and early schema should be treated as the organization / district / customer layer until a later terminology cleanup says otherwise.

## 4. Role Model

Target backend role IDs:

- `platform_admin`
- `org_admin`
- `site_admin`
- `program_teacher`
- `mentor`
- `viewer`
- `student`

User-facing labels:

- Platform Admin
- Organization Admin
- Administration
- Program Teacher
- Mentor
- Viewer
- Student

Role transition rules:

- Backend `site_admin` should show as "Administration" in the UI for principals, assistant principals, and site leadership.
- Existing `admin` is legacy/current and remains platform-equivalent during transition.
- Existing Bryan admin accounts must continue to work.
- New code should prefer `platform_admin` for new platform/system capabilities.
- `misc_admin` is legacy/narrow and should not silently become site admin.

Phase 2 additive foundation:

- Migration `0011_multisite_site_role_foundation.sql` adds the site/school layer with `sites`, `site_users`, and `site_programs`.
- Migration `0011_multisite_site_role_foundation.sql` adds backend role IDs `platform_admin`, `org_admin`, `site_admin`, and `viewer`.
- `site_admin` continues to display as "Administration" for site leadership.
- `platform_admin` now exists for new platform/system capabilities, while legacy `admin` remains platform-equivalent during transition and Bryan's existing admin accounts continue to work.
- `misc_admin` remains legacy/narrow and must not silently become `site_admin`.
- Phase 3 removed announcement product surfaces from the active workspace, route inventory, and demo seeds.
- Phase 4 adds the helper-first site-aware capability permission model for later route/UI phases.
- Full conversion of current routes to site-aware behavior remains a later phase after multisite demo seed data exists.

## 5. Capability Matrix

Legend:

- `Yes`: allowed for the role.
- `Scoped`: allowed only inside the actor's organization, site, program, cohort, or assignment scope.
- `Read`: read-only access.
- `Own`: the student's own record only.
- `Compat`: legacy compatibility, equivalent to platform admin during transition.
- `No`: not allowed.

### Platform And Site Administration

| Capability | platform_admin | org_admin | site_admin | viewer | program_teacher | mentor | student | legacy admin | legacy misc_admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| view platform admin area | Yes | No | No | No | No | No | No | Compat | No |
| manage organizations | Yes | No | No | No | No | No | No | Compat | No |
| manage sites | Yes | Scoped org | No | No | No | No | No | Compat | No |
| view org dashboard | Yes | Scoped org | No | Read scoped | No | No | No | Compat | No |
| view site dashboard | Yes | Scoped org/site | Scoped site | Read scoped | No | No | No | Compat | No |
| manage tenant/SSO/Drive/security settings | Yes | Scoped org | No | No | No | No | No | Compat | No |

### Student Visibility And Evidence

| Capability | platform_admin | org_admin | site_admin | viewer | program_teacher | mentor | student | legacy admin | legacy misc_admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| view student directory | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned summary only | No | Compat | No |
| view all students in site | Yes | Scoped org/site | Scoped site | Read scoped | No | No | No | Compat | No |
| view only scoped students | Scoped optional | Scoped optional | Scoped optional | Scoped | Scoped program/cohort | Assigned only | Own | Compat | No |
| view student detail | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned only | Own | Compat | No |
| view student evidence | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned only | Own | Compat | No |
| download evidence | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned only | Own | Compat | No |
| add staff notes | Yes | Scoped org/site | Scoped site | No | Scoped program/cohort | Assigned mentor notes | No | Compat | No |

### Review And Mentor Workflows

| Capability | platform_admin | org_admin | site_admin | viewer | program_teacher | mentor | student | legacy admin | legacy misc_admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| view review queue | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | No | No | Compat | No |
| approve/request revision/comment | Read-only in site UI | Read-only in site UI | Read-only in site UI | No | Scoped program/cohort | No | No | Compat | No |
| view mentor assignments | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Own assigned students | No | Compat | No |
| manage mentor assignments | Yes | Scoped org/site | Scoped site | No | No | No | No | Compat | No |

### Presentation, Archive, Reports, And Audit

| Capability | platform_admin | org_admin | site_admin | viewer | program_teacher | mentor | student | legacy admin | legacy misc_admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| view presentation operations | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned only | Own | Compat | Aggregate only if explicitly granted |
| manage presentation operations | Yes | Scoped org/site | Scoped site | No | Scoped program/cohort | No | No | Compat | No |
| view archive/export status | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned status only | Own | Compat | Aggregate only |
| manage archive/export | Yes | Scoped org/site | Scoped site | No | No | No | Request own package only | Compat | No |
| view readiness reports | Yes | Scoped org/site | Scoped site | Read scoped | Scoped program/cohort | Assigned summary | Own | Compat | Aggregate only |
| view audit events | Yes | Scoped org/site | Scoped site | No | No | No | No | Compat | No |

### Account And Role Operations

| Capability | platform_admin | org_admin | site_admin | viewer | program_teacher | mentor | student | legacy admin | legacy misc_admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| import users | Yes | Scoped org | Scoped site | No | No | No | No | Compat | No |
| reset passwords | Yes | Scoped org | Scoped site | No | No | No | No | Compat | No |
| view one-time setup credentials | Yes | Scoped org | Scoped site | No | No | No | No | Compat | No |
| manage roles | Yes | Scoped org | Scoped site role set only | No | No | No | No | Compat | No |

## 6. Announcement Removal Decision

Announcements are out of MVP product scope. Schools already use Remind, Canvas, Infinite Campus, Google Classroom, email, or other school communication systems.

The product should not try to replace those tools.

Required direction:

- remove announcement loading from workspace UI
- remove announcement cards from overview
- remove admin announcement creation from product surface
- stop seeding new fake announcements
- update docs so announcements are not listed as active MVP routes/features
- do not drop the DB table in the first removal pass unless a later cleanup phase safely does so
- remaining announcement references must be classified as deprecated, schema-only, historical, or removed

Current repo state after Phase 3: announcement loading and cards are removed from `workspace.js`; `/api/announcements` and `/api/admin/announcements` route files are deleted; generated production route inventory no longer lists announcement routes; local and remote demo seeds no longer create announcement rows; proof scripts do not expect announcements. The legacy `announcements` table remains in `migrations/0001_foundation.sql` as deprecated/schema-only until a later safe cleanup phase.

## 7. Figma Alignment Decision

Figma alignment is MVP credibility work, not final polish.

Required sales-demo screens:

- sign-in / workspace landing
- site admin dashboard
- student directory
- student detail
- program teacher review queue
- mentor dashboard
- viewer read-only mode
- reports/readiness

A later Figma mapping document is required:

```text
docs/design/figma-product-alignment.md
```

That future document must map:

```text
Figma screen/element -> app surface -> workspace.js function/section -> CSS/token -> verification
```

Phase 6 creates `docs/design/figma-product-alignment.md` and applies the first workspace design-system foundation: semantic CSS tokens, ABC-inspired primary color mapping, read-only viewer banner patterns, target role labels, and future component classes for site dashboards, student directories, student detail panels, and readiness/reporting surfaces. This phase does not build the site dashboard, student directory, student detail routes, or review workflow UI.

## 8. Route Direction

Target route families:

- `/api/platform/organizations`
- `/api/platform/sites`
- `/api/org/sites`
- `/api/site/dashboard`
- `/api/site/students`
- `/api/site/students/[studentId]`
- `/api/site/students/[studentId]/timeline`
- `/api/site/evidence`
- `/api/site/mentor-assignments`
- `/api/site/presentation-slots`
- `/api/site/archive-exports`
- Keep `/api/student/dashboard` for student self-service.

Existing admin routes may remain for compatibility, but new sales MVP routes should be site-aware.

Phase 4 permission foundation:

- `functions/_lib/permissions.ts` now exposes site-aware organization, site, viewer, program teacher, mentor, student, and platform capability helpers.
- Existing legacy routes remain compatible; admin-only routes that currently depend on legacy `admin` are not broadly converted in Phase 4.
- `platform_admin` and legacy `admin` are platform-equivalent for new helper checks, while `isAdmin` continues to mean legacy `admin` for current route compatibility.
- `site_admin` and `viewer` capabilities require assigned active sites and do not gain platform/security/user-management powers.
- `misc_admin` remains narrow and aggregate-readiness compatible only.

Phase 7 site dashboard implementation:

- `/api/site/dashboard` is implemented as the first route-connected sales-demo surface.
- The route scopes counts through active `site_users`, active `site_programs`, and selected-site student joins for workflow tables that do not yet carry `site_id`.
- Desert Valley High School returns exactly 250 students; Canyon Ridge Career Academy and North Valley Technical High School return exactly 60 students each in local seeded proof and integration tests.
- `platform_admin`, legacy `admin`, `org_admin`, assigned `site_admin`, and assigned `viewer` can view the route; `viewer` is read-only; `program_teacher`, `mentor`, `student`, and legacy `misc_admin` are denied.
- The authenticated workspace renders a Figma-aligned Site Dashboard section from `/api/site/dashboard` while keeping legacy `/api/admin/dashboard` for compatibility.

Phase 8 site student directory implementation:

- `/api/site/students` is implemented as the route-connected Student Directory surface.
- The route reuses the shared site-selection helper used by `/api/site/dashboard` and scopes records through active selected-site `site_users`, student roles, program/group membership, mentor assignments, submissions, evidence counts, presentation slots, and archive/export rows.
- Primary site returns exactly 250 total unfiltered matching students, while returned row count respects pagination.
- Default pagination limit is 50, maximum limit is 100, `pagination.returned` equals the returned row count, and `pagination.filteredTotal` is the filter match count before pagination.
- Canonical filters are implemented for status, story bucket, risk, presentation status, archive status, no mentor, program, and search. Story filters include `missing_mentor`, `revision_requested`, and `archive_failed` proof paths.
- `platform_admin`, legacy `admin`, `org_admin`, assigned `site_admin`, assigned `viewer`, and scoped `program_teacher` can view the route; `viewer` is read-only and `program_teacher` is limited to scoped program/site students. `mentor`, `student`, and legacy `misc_admin` are denied.
- The authenticated workspace renders a Figma-aligned Students section from `/api/site/students` with filters, result counts, pagination summary, story/risk chips, status chips, and real `View detail` controls.

Phase 9 site student detail and timeline implementation:

- `/api/site/students/:studentId` is implemented as the site-scoped drill-down route and reuses the Phase 8 canonical status, story, presentation status, and archive status vocabulary.
- `/api/site/students/:studentId/timeline` is implemented as the full timeline route. The detail route includes `timelinePreview` capped at 10 events; the timeline route defaults to limit 50, caps limit at 100, supports offset, and can filter by stable event type.
- Detail sections are bounded: submissions 5, evidence 10, reviews 10, comments 10, status history 10, mentor meetings 5, and timeline preview 10.
- Cross-site and out-of-scope students return generic denial/not-found responses and do not disclose whether the student exists in another site.
- Visibility is conservative by role: admin-family roles see scoped operational detail; viewer is read-only; program teacher sees scoped evidence/review/submission data only; mentor sees assigned-student support data only; student self-service remains `/api/student/dashboard`; misc admin is denied.
- Evidence, archive, and timeline responses omit raw Drive IDs, storage IDs, token/password/setup credential fields, and unsafe raw audit metadata.
- The authenticated workspace opens a Figma-aligned detail drawer from the Students section, preserves directory search/filter/pagination and selected site state, renders section tabs, uses `renderProblemState()` for loading/error/denied/empty states, and adds no mutation buttons.

Phase 10 program teacher review workflow implementation:

- `/api/site/review-queue` is implemented as the site-aware Review Queue route. It reuses shared site selection, active selected-site student membership, student role membership, program/cohort group membership, and bounded pagination with default limit 50 and maximum limit 100.
- The existing `/api/teacher/review-queue` remains as legacy compatibility. The existing `/api/reviews/:submissionId/decision` and `/api/reviews/:submissionId/history` remain the review mutation/history model and are extended with optional `siteId` checks for selected-site and program-teacher scope.
- In the new site Review Queue UI, `program_teacher` can approve, request revision, or add comment-only feedback only for in-scope submitted submissions. Platform admin, legacy admin, org admin, site admin, and viewer can inspect the site queue read-only in the workspace; legacy admin backend compatibility remains available outside the new site UI.
- Decisions continue to write reviews, comments, submission/progress status updates when applicable, status history, and audit events. History remains bounded and evidence/storage identifiers stay redacted.
- The authenticated workspace renders a route-connected Review Queue section with site context, filters, summary counts, queue rows, selected submission context, bounded review history, teacher feedback controls for allowed program teachers, read-only explanations for read-only roles, and no mentor-assignment, archive retry/export, user-management, or announcement UI.

## 9. Demo Seed Direction

Future synthetic sales demo data should include:

- one fake organization/district
- at least three fake school sites
- one fully populated primary site with 250 students
- two lighter sites proving multi-site scaling
- fake platform admin
- fake org admin
- fake site admins
- fake viewers
- fake program teachers
- fake mentors
- fake students
- fake artifacts, comments, reviews, status history, mentor meetings, presentation slots, exports
- no announcements

All demo account domains must be fake `.test` domains. Seed data must not contain real student records, real staff records beyond explicitly protected Bryan/admin compatibility checks, or committed credential values.

## 10. Demo Story Map Requirement

Future seed data must include named/predictable fake examples:

- model excellent students
- students missing mentors
- students submitted awaiting review
- students with revision requested
- students with presentation pending
- students archive-ready
- students with archive/export failed
- stale/high-risk students
- students with rich comments/reviews/evidence timeline

These examples should be stable enough for Bryan to rehearse and repeat the demo without hunting through random data.

## 11. Persona Sheet Requirement

The demo seed/proof phase must create:

```text
docs/demo/personas.md
```

This file must not contain passwords.

It should include:

- persona display name
- fake email
- role
- organization/site/program scope
- what to demo with that persona
- credentials location reminder such as `.secrets/demo-...json`, without exposing values

## 12. Explicit Non-Goals For This MVP Sequence

- no billing implementation yet
- no live domain/OAuth cutover
- no real student data
- no real user import unless credential-delivery policy is approved
- no replacement for Remind/Canvas/IC/Google Classroom announcements
- no full tenant-owned Drive migration unless a later phase targets it
- no full org-wide analytics before site admin demo is solid
- no production secret changes
- no destructive schema cleanup in early phases

## 13. Go/No-Go Checklist Before Phase 2

- [x] tenant/organization schema inspected
- [x] current roles inspected
- [x] legacy admin compatibility understood
- [x] announcement inventory identified
- [ ] additive migration strategy agreed
- [x] no domain/OAuth changes needed
- [x] site layer missing and should be added
- [x] Bryan admin access must be preserved
- [x] Phase 2 should be additive only

## Current Repo Audit Snapshot

- `README.md` frames Capstone Project as the product and the East Tech guide as a separate public guide, and Phase 3 removed announcements from active workflow routes and seeded demo data.
- `package.json` is `senior-capstone-app` with validation scripts for `test`, `typecheck`, `check`, and production-surface checks.
- `wrangler.jsonc` keeps the Cloudflare Pages project as `senior-capstone-app`, D1 binding `DB`, and current Google Drive/app environment vars. This phase does not change live config.
- Production-surface docs and generated route inventory classify `workspace.html` and current API routes; Phase 3 removed announcement routes from active current surfaces.
- `migrations/0001_foundation.sql` creates the legacy role set: `student`, `mentor`, `program_teacher`, `admin`, and `misc_admin`. It also creates the `announcements` table.
- `migrations/0010_tenant_google_sso.sql` adds tenants, tenant domains, identity providers, tenant users, auth identities, and OAuth state. It does not add a site/school table.
- There are no migrations after `0010_tenant_google_sso.sql` at the time of this audit.
- `functions/_types.ts` defines `RoleId` with only current legacy/current roles, not `platform_admin`, `org_admin`, `site_admin`, or `viewer`.
- `functions/_lib/permissions.ts` treats `admin` as global full access, allows scoped program/cohort teachers, active assigned mentors, student self-access, and keeps `misc_admin` out of student detail while allowing aggregate readiness.
- Phase 4 adds site-aware capability helpers in `functions/_lib/permissions.ts` without broadly converting the current routes; tests prove platform, organization, site, viewer, program teacher, mentor, student, misc-admin, and deny-by-default behavior.
- Current dashboard routes are global/admin or program/mentor/student scoped, but not organization/site scoped.
- Announcement route files have been removed from the active MVP route surface; the schema table remains deprecated/schema-only.
- `workspace.html`, `workspace.js`, and `workspace.css` form the authenticated app. The UI no longer loads announcement data or renders announcement overview cards; it still uses current compatibility route families and lacks full site-aware navigation.
- Phase 5A local and remote demo seed/proof scripts support Desert Valley School District with three fake school sites, 370 `.test` students, site memberships, site-program mappings, target persona roles, named story buckets, evidence, reviews, mentor meetings, presentation slots, exports, and no new announcement rows. Phase 5A writes and proves this shape locally only; remote write remains deferred.
- Relevant tests cover permissions, admin/program teacher/mentor/student dashboards, review workflow, workspace rendering, production source expectations, local/remote demo seeding, announcement removal source checks, and production-surface safety.
