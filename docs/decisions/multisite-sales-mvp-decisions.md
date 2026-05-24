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
- Phase 4 builds full site-aware capability permissions.

## Phase 3 Announcement Removal

- The workspace no longer fetches announcement data and no longer renders announcement cards in the overview.
- `/api/announcements` and `/api/admin/announcements` are deleted from the active route surface; route inventory must stay generated from source.
- Local and remote demo seeds no longer create fake announcements, but they may clean up older demo-owned announcement rows during reset.
- The legacy `announcements` table remains deprecated/schema-only until a later non-destructive cleanup decision.
- Schools should continue using existing communication systems such as Remind, Canvas, Infinite Campus, Google Classroom, email, or district-approved tools.
