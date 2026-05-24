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
- The first announcement removal pass should remove UI loading/cards, admin creation surface, and new fake announcement seeding, while leaving the database table in place unless a later cleanup phase safely removes it.
- Remaining announcement references after removal must be classified as deprecated, schema-only, historical, or removed.
- Figma alignment is MVP credibility work. It is required for the sales demo screens, but it is not final polish.
- No domain, OAuth redirect URI, Cloudflare Pages project, or Cloudflare hostname mapping changes are part of this MVP sequence.
- Demo data must be fake `.test` only. No real student data should be seeded, committed, printed, or shown in demo docs.
- Phase 2 should use additive migrations and compatibility shims. It should not destructively rewrite roles, permissions, seed behavior, or remote data.

## Current-State Notes

- Current backend role IDs are `student`, `mentor`, `program_teacher`, `admin`, and `misc_admin`.
- Current tenant migration exists, but there is no site/school table.
- Current admin, teacher, mentor, student, archive, presentation, review, readiness, and audit surfaces are useful building blocks, but they need site-aware route families for the sales demo.
- Current local and remote demo seeders create single-site style program/cohort demo data and still seed announcements.
- Current generated production route inventory still lists announcement routes because the route files exist. That should be corrected by a later removal implementation, not by manually editing generated output.
