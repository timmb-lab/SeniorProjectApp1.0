# Multisite Sales MVP Decisions

Date: 2026-05-24

This decision record locks the target vocabulary and scope for the multisite sales demo MVP sequence.

## Decisions

- Tenant means organization, district, or customer for now. The existing `tenants` schema should be treated as the organization/customer layer until a later terminology pass changes it.
- Site means school or campus. A site/school layer is missing from the current schema and should be added additively in Phase 2.
- Backend `site_admin` displays as "Administration" in the UI. This label is intended for principals, assistant principals, and site leadership.
- Existing `admin` remains platform-equivalent during transition. Bryan's existing admin accounts must continue to work without interruption.
- New platform/system capabilities should prefer `platform_admin` once the new role model is added.
- `misc_admin` remains legacy/narrow. It should not silently become `site_admin`, and it should stay aggregate/reporting-only unless a later decision explicitly expands it.
- Announcements are removed from the MVP product surface. The product should not replace Remind, Canvas, Infinite Campus, Google Classroom, email, or other school communication systems.
- Phase 3 removed announcement UI loading/cards, admin creation routes, generated route inventory entries, and new fake announcement seeding, while leaving the database table in place for later safe cleanup.
- Remaining announcement references after removal must stay classified as deprecated, schema-only, historical docs, generated output, test-only, or removed.
- Figma alignment is MVP credibility work. It is required for the sales demo screens, but it is not final polish.
- No domain, OAuth redirect URI, Cloudflare Pages project, or Cloudflare hostname mapping changes are part of this MVP sequence.
- Demo data must be fake `.test` only. No real student data should be seeded, committed, printed, or shown in demo docs.
- Phase 2 should use additive migrations and compatibility shims. It should not destructively rewrite roles, permissions, seed behavior, or remote data.

## Current-State Notes

- Current backend role IDs are `student`, `mentor`, `program_teacher`, `admin`, and `misc_admin`.
- Current tenant migration exists, but there is no site/school table.
- Current admin, teacher, mentor, student, archive, presentation, review, readiness, and audit surfaces are useful building blocks, but they need site-aware route families for the sales demo.
- Current local and remote demo seeders create single-site style program/cohort demo data and no longer create announcements.
- Current generated production route inventory no longer lists announcement routes because the route files were deleted in Phase 3 and the inventory was regenerated.

## Phase 2 Additive Foundation

- Migration `0011_multisite_site_role_foundation.sql` adds `sites`, `site_users`, and `site_programs`.
- Migration `0011_multisite_site_role_foundation.sql` adds roles `platform_admin`, `org_admin`, `site_admin`, and `viewer`.
- The default compatibility site is `site-capstone-sandbox-main` under `tenant-capstone-sandbox`, with all active programs mapped through `site_programs`.
- Legacy `admin` remains platform-equivalent during transition and keeps current admin-only route behavior.
- `platform_admin` is available for new platform/system capabilities, but it does not replace legacy `admin` in existing routes during this phase.
- `site_admin` remains labeled "Administration" in product/UI language.
- `misc_admin` remains legacy/narrow and is not promoted to site administration.
- Phase 3 removed announcement surfaces from the MVP product surface.
- Phase 4 adds full site-aware capability permission helpers for later route/UI phases.

## Phase 3 Announcement Removal

- The workspace no longer fetches announcement data and no longer renders announcement cards in the overview.
- `/api/announcements` and `/api/admin/announcements` are deleted from the active route surface; route inventory must stay generated from source.
- Local and remote demo seeds no longer create fake announcements, but they may clean up older demo-owned announcement rows during reset.
- The legacy `announcements` table remains deprecated/schema-only until a later non-destructive cleanup decision.
- Schools should continue using existing communication systems such as Remind, Canvas, Infinite Campus, Google Classroom, email, or district-approved tools.

## Phase 4 Site-Aware Capability Foundation

- Site-aware permissions are helper-first. Current production routes are not broadly converted until seeded multisite data and route-specific tests exist.
- New helpers in `functions/_lib/permissions.ts` answer platform, tenant, site, student detail/evidence, review, mentor assignment, presentation, archive, readiness, audit, user, security, and tenant-config capability questions.
- `platform_admin` and legacy `admin` are platform-equivalent for new helper checks; `isAdmin` remains legacy-admin-only so existing admin routes do not silently widen.
- `canManageUsers` now allows `platform_admin` and legacy `admin`, but current admin import and role-assignment routes still use legacy `isAdmin` gates until scoped user-management policy is designed.
- `org_admin`, `site_admin`, and `viewer` require active tenant/site scope and deny unrelated tenants/sites.
- `site_admin` can perform assigned-site operational capabilities in helpers, but cannot manage users, platform security, or tenant configuration in this phase.
- `viewer` is read-only in helpers and cannot mutate reviews, add staff notes, manage mentor assignments, manage presentation/archive operations, manage users, or manage security.
- `misc_admin` remains legacy/narrow and is not treated as `site_admin` or `platform_admin`.

## Phase 5A Multisite Demo Seed Foundation

- Local and remote demo seeders now share the same Desert Valley School District multisite shape.
- The primary site, Desert Valley High School, has exactly 250 fake students; Canyon Ridge Career Academy and North Valley Technical High School each have 60 fake students.
- Demo users remain fake `.test` accounts only: `demo-student.capstone.test` and `demo-staff.capstone.test`.
- Demo seeders create no student credentials and no announcements.
- Fake platform, organization, site-administration, viewer, program teacher, and mentor persona accounts are created; credential values stay only in ignored `.secrets/demo-...json` files.
- Story buckets are deterministic and searchable by prefix for model excellent, missing mentor, awaiting review, revision requested, presentation pending, archive ready, archive failed, high-risk, and rich timeline students.
- Phase 5A local proof validates the multisite shape locally. Remote dry-run may be used when safe, but remote write remains deferred.

## Phase 6 Figma Alignment Foundation

- Figma/product alignment is applied to the repo workspace as a design-system foundation, not as a full route or workflow build.
- The local Figma/design source for this phase is repo documentation, especially `docs/design/figma-first-pass-product-system.md` and `docs/design/figma-product-preview-state-variants.md`; no live Figma file is edited in this phase.
- Workspace CSS now exposes semantic product tokens for primary, accent, status, neutral surface, border, radius, shadow, focus, spacing, and typography use.
- The authenticated workspace keeps the ABC-inspired school-friendly visual language and adds read-only viewer, site-context, student-directory, detail-panel, story-chip, risk-chip, metric-action, and empty-state class patterns for later phases.
- `site_admin` continues to display as "Administration"; `platform_admin`, `org_admin`, and `viewer` have user-facing labels without changing backend role IDs.

## Phase 7 Site Admin Dashboard

- `/api/site/dashboard` is the first new site-aware route family in the sales MVP sequence.
- The route defaults to the primary Desert Valley demo site for platform/org/legacy admin users only when multiple accessible sites exist and the primary demo site is accessible; the response includes `accessibleSites` so a future selector can be built.
- Assigned `site_admin` and assigned `viewer` users infer their single active site when `siteId` is omitted.
- Inaccessible, inactive, missing, or invalid explicit `siteId` values are denied instead of falling back to global data.
- Legacy `/api/admin/dashboard` remains unchanged for compatibility and still reports global legacy admin counts.
- The workspace prefers the route-connected Site Dashboard for platform, organization, site-administration, legacy admin, and viewer overview paths, while legacy admin users can still open the Admin Command Center section.
- Phase 7 did not build student directory or student detail routes; Phase 8 later adds the directory and leaves student detail for Phase 9.

## Phase 8 Site Student Directory

- `/api/site/students` is the second site-aware route family in the sales MVP sequence and uses the shared site-selection helper extracted from the Phase 7 dashboard.
- Pagination is part of the contract: default `limit` is 50, maximum `limit` is 100, `returned` reflects the current page, `filteredTotal` reflects filter matches before pagination, and `total` reflects the unfiltered selected-site or selected-program scope.
- Primary site returns exactly 250 total unfiltered matching students, while returned row count respects pagination.
- Program teacher access is intentionally narrower than site administration access: it returns only selected-site students in the teacher-visible program scope and does not expose full-site counts.
- Viewer access remains read-only with mutation permissions false.
- Directory filters use canonical values for status, story, risk, presentation, and archive states so Phase 9 student detail can reuse the same vocabulary.
- Student rows now link into the Phase 9 detail drawer through the real `View detail` control.

## Phase 9 Site Student Detail And Timeline

- `/api/site/students/:studentId` is the drill-down route for selected-site operational student detail. It reuses Phase 8 canonical story/status/presentation/archive values instead of creating a parallel vocabulary.
- `/api/site/students/:studentId/timeline` is separate from the main detail payload. Detail includes only a `timelinePreview` capped at 10 events, while the timeline route owns paginated history with default limit 50, max limit 100, offset, and optional type filtering.
- Payloads are intentionally bounded: submissions 5, evidence 10, reviews 10, comments 10, status history 10, mentor meetings 5, and timeline preview 10. Full history should build on the timeline route rather than widening detail.
- Site scoping starts from the selected active site and selected student membership; workflow tables that lack `site_id` are joined through the selected student and active selected-site membership. The route must not fall back to global legacy dashboards.
- Cross-site or out-of-scope student requests use generic denial/not-found responses so a scoped user cannot distinguish another site's real student from a nonexistent student.
- Role visibility defaults safe: admin-family roles can see scoped operational detail; viewer is read-only; program teacher is scoped to teacher-visible program/cohort students; mentor is scoped to assigned-student support data; student self-service remains separate; misc admin is denied.
- The workspace detail surface is read/detail-only in this phase. Review decisions, mentor assignment, archive retry/export, user-management, and download controls remain outside Phase 9 unless an existing scoped route is explicitly tested.

## Phase 10 Program Teacher Review Workflow

- `/api/site/review-queue` is the new site-aware queue surface. It scopes rows through active selected-site `site_users`, active student role membership, submissions for selected-site students, program/cohort group membership, and evidence/review/comment counts. The route defaults to submitted and revision-requested rows, uses bound filters, and caps pagination at 100 rows.
- `/api/teacher/review-queue` remains for legacy compatibility. The site workspace uses `/api/site/review-queue`.
- The review decision/history model remains the existing `/api/reviews/:submissionId/decision` and `/api/reviews/:submissionId/history` routes. When `siteId` is provided, both routes validate selected-site membership and teacher program scope before returning or mutating.
- Mutation policy is intentionally narrow: the new site Review Queue UI exposes approve, request-revision, and comment-only controls only to scoped `program_teacher` users on submitted work. Platform admin, org admin, site admin, and viewer are read-only in the new UI; legacy admin backend compatibility is preserved but not expanded into broad site-admin controls.
- Review payloads stay bounded and redacted. The queue does not expose raw Drive/storage IDs, token/password/setup credential fields, full private evidence URLs, or unsafe audit metadata.
- After a successful decision, the workspace refreshes the queue and refreshes the open student detail drawer when the selected review row belongs to the open student, without resetting directory filters or pagination.

## Phase 11 Mentor Assignment Workflow

- `/api/site/mentor-assignments` is the new selected-site mentor coverage and assignment surface. It scopes rows through active selected-site `site_users`, active student and mentor role memberships, selected-site program/cohort membership, and active `mentor_assignments`; it does not use global mentor dashboard data.
- GET is bounded and filterable with default limit 50 and max limit 100. It returns selected-site summary counts, mentor load rows, unassigned students, active assignments, filters, pagination, and permission flags.
- The MVP mutation policy is assign-only. POST requires an authenticated user, selected active site, `canManageMentorAssignments`, an active same-site student with the student role, an active same-site mentor with the mentor role, and a sanitized non-empty reason.
- The uniqueness policy is one active mentor assignment per selected-site student. Duplicate active assignment attempts return `active_assignment_exists`; reassign and deactivate are intentionally deferred rather than represented as fake UI controls.
- Capability helpers drive mutation policy: site admin can manage assigned-site mentor assignments; platform admin, legacy admin, and org admin can manage where the existing helper allows; viewer and program teacher are read-only; mentor, student, and misc admin are denied from the management route.
- Assignment writes audit `site_mentor_assignment_created` and conflict/denial paths without full sensitive reason text, Drive/storage IDs, secret fields, credentials, or user-management metadata.
- Workspace Mentor Assignments refreshes the assignment route after a successful assign and also refreshes loaded site dashboard, student directory, and open student detail state without resetting directory filters or pagination.

## Phase 12 Presentation, Archive, And Readiness Worklists

- `/api/site/operations-readiness` is the selected-site read-only operations route for the sales demo. A combined route is preferred over separate presentation/archive/report routes so the workspace can load one bounded operations view and preserve a single site-selection contract.
- Presentation, archive, and readiness rows are scoped through active selected-site student membership, student role membership, selected-site program/cohort membership, presentation slots, archive export rows, submissions, evidence counts, progress records, mentor coverage, and review/comment counts. Tables without `site_id` are joined through the selected student and selected site.
- The route maps existing data into stable canonical values for presentation (`ready`, `pending`, `scheduled`, `completed`, `missing`, `outline_pending`, `outline_revision_needed`, `attention_required`), archive (`ready`, `complete`, `failed`, `missing`, `queued`, `running`, `expired`, `expiring_soon`, `provider_unavailable`), and readiness (`ready`, `in_progress`, `attention_required`, `blocked`, `missing`, `complete`).
- Phase 12 remains read-only. Presentation scheduling, check-in/check-out, archive retry/export, reporting export, and user-management mutations are intentionally absent.
- Viewer and program teacher responses are read-only; program teacher summaries and rows are scoped to teacher-visible selected-site students. Mentor, student, and misc admin are denied from the site operations route; mentor assigned-student surfaces remain separate.
- Archive/export responses and audit metadata omit raw Drive IDs, storage identifiers, full private URLs, secret/token/password/setup credential fields, credentials, and unsafe raw audit payloads.
