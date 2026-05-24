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
| approve/request revision/comment | Yes | Scoped org/site | Scoped site | No | Scoped program/cohort | No | No | Compat | No |
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

Current repo state as of this contract: announcements still exist in `migrations/0001_foundation.sql`, `/api/announcements`, `/api/admin/announcements`, `workspace.js`, production route inventory, seed scripts, seed tests, and several historical planning docs. They should be removed from active product surfaces in a later implementation phase rather than edited piecemeal in this contract pass.

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

- `README.md` already frames Capstone Project as the product and the East Tech guide as a separate public guide, but it still lists announcements as active workflow routes and seeded demo data.
- `package.json` is `senior-capstone-app` with validation scripts for `test`, `typecheck`, `check`, and production-surface checks.
- `wrangler.jsonc` keeps the Cloudflare Pages project as `senior-capstone-app`, D1 binding `DB`, and current Google Drive/app environment vars. This phase does not change live config.
- Production-surface docs and generated route inventory still classify `workspace.html` and current API routes, including announcement routes, as active current surfaces.
- `migrations/0001_foundation.sql` creates the legacy role set: `student`, `mentor`, `program_teacher`, `admin`, and `misc_admin`. It also creates the `announcements` table.
- `migrations/0010_tenant_google_sso.sql` adds tenants, tenant domains, identity providers, tenant users, auth identities, and OAuth state. It does not add a site/school table.
- There are no migrations after `0010_tenant_google_sso.sql` at the time of this audit.
- `functions/_types.ts` defines `RoleId` with only current legacy/current roles, not `platform_admin`, `org_admin`, `site_admin`, or `viewer`.
- `functions/_lib/permissions.ts` treats `admin` as global full access, allows scoped program/cohort teachers, active assigned mentors, student self-access, and keeps `misc_admin` out of student detail while allowing aggregate readiness.
- Current dashboard routes are global/admin or program/mentor/student scoped, but not organization/site scoped.
- `functions/api/announcements.ts` and `functions/api/admin/announcements.ts` are active current routes and should be deprecated/removed from the MVP product surface later.
- `workspace.html`, `workspace.js`, and `workspace.css` form the authenticated app. The UI loads `/api/announcements`, shows an overview announcement card for role-pending/default cases, uses legacy role labels, and lacks site-aware navigation.
- Local and remote demo seed/proof scripts create 250 fake students in one program/cohort model, with fake staff, mentors, evidence, reviews, mentor meetings, presentation slots, exports, and current announcement rows.
- Relevant tests cover permissions, admin/program teacher/mentor/student dashboards, review workflow, workspace rendering, production source expectations, local/remote demo seeding, announcement endpoint source checks, and production-surface safety.
