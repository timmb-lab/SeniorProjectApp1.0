# Full Multisite Sales MVP Audit Summary

Date: 2026-05-24

Starting HEAD: `2c5735c36977a401512bfa41feeca425070c357a`

## Bottom Line

The repo is on the right MVP path, but it is not ready for a school or district sales demo yet.

Phases 1 through 6.5 have built the correct foundation: the sales MVP contract is explicit, the additive multisite schema exists, announcements are removed from the active MVP surface, site-aware permission helpers are in place, realistic fake multisite data is locally seeded/proven, Figma source context has been inspected, and the visual gaps are documented.

The strongest blocker is not a lack of direction. It is that the route-connected product demo is not complete yet:

- No site admin dashboard route/UI yet.
- No student directory route/UI yet.
- No student detail route/UI yet.
- Remote D1 still lacks migration `0011_multisite_site_role_foundation.sql`.
- The authenticated workspace still does not fully match the actual Figma product control center.

## What Is Proven

- Local Phase 2 migration proof for the site/role foundation.
- Announcement removal from active workspace/API route inventory/demo seed creation.
- Site-aware permission helper behavior for platform admin, legacy admin, org admin, site admin, viewer, program teacher, mentor, student, and misc admin.
- Local Desert Valley School District seed/proof with 3 fake sites, 370 fake students, no student credentials, no announcements, and story buckets.
- Existing dashboard/review/presentation/archive/import/role-assignment routes have useful integration/source coverage.
- Phase 6.5 inspected live Figma read-only for file `z4t4tFPAKrMDh6pIYOeEw6`, page `0:1`, node `2:5`; live Figma was not edited.

## What Is Not Proven

- Remote multisite D1 behavior.
- Remote seed/write/proof.
- Site admin dashboard behavior.
- Student directory and detail behavior.
- Hosted browser screenshot proof for the future demo screens.
- Full Figma visual alignment in the authenticated app.
- Real user onboarding, credential delivery, SSO/domain cutover, or pilot compliance posture.

## Main Blockers

1. Remote D1 needs migration `0011` before Phase 5B remote seed/proof.
2. The site admin dashboard must be built before an administrator sales demo is credible.
3. Phase 6.5 found the workspace is only partially Figma-aligned.
4. Student directory and detail are still future work.
5. Real user/pilot policy is still out of scope and unresolved.

## Recommendation

Run `06.6_design_cleanup_before_dashboard.txt` before `07_site_admin_dashboard.txt`.

Phase 6.6 should be small and safe:

- Add exact Figma token aliases.
- Add the dark product header pattern.
- Add gold eyebrow/product context text.
- Add posture chips.
- Complete status chips.
- Add reason/owner/next-action problem-state UI.
- Clean up empty/permission-denied copy.
- Add tests.
- Do not add routes or run remote operations.

Then Phase 7 should build the site admin dashboard using the Figma operating-view pattern and site-aware route requirements.

## Go / No-Go

| Area | Decision |
| --- | --- |
| Phase 7 immediately | No-go |
| Phase 7 after Phase 6.6 | Go |
| Remote migration `0011` now | No-go |
| Remote seed 5B now | No-go |
| Sales demo today | No-go |
| Exact next prompt | `06.6_design_cleanup_before_dashboard.txt` |

## Phase 7 Update

After Phase 6.6, Phase 7 added the first route-connected administration surface:

- `/api/site/dashboard` is implemented and tested independently from legacy `/api/admin/dashboard`.
- The route proves local Desert Valley site scoping: Desert Valley High School returns 250 students, and each secondary site returns 60 students.
- The authenticated workspace renders a Figma-aligned Site Dashboard for platform, organization, site-administration, legacy admin, and viewer roles.
- Viewer dashboard access is read-only and mutation permissions are disabled.
- Student directory and student detail are still not built; Phase 8 should build on the site dashboard route foundation.

Updated next prompt after Phase 7: `08_student_directory_api_ui.txt`.

## Phase 8 Update

After Phase 7, Phase 8 added the route-connected site-scoped Student Directory:

- `/api/site/students` is implemented and tested independently from legacy admin/program/mentor/student dashboards.
- The route proves local Desert Valley directory scoping: Desert Valley High School has 250 total unfiltered matching students, Canyon Ridge Career Academy has 60, and North Valley Technical High School has 60, while returned rows respect pagination.
- Default `limit` is 50, maximum `limit` is 100, offset pagination changes the returned set, and `filteredTotal` tracks filter matches before pagination.
- Canonical filters are implemented for status, story, risk, presentation status, and archive status. Missing mentor, revision requested, and archive failed story filters are proven against the seeded story buckets.
- Viewer directory access is read-only with mutation permissions disabled.
- Program teacher directory access is safely scoped to selected-site program students and does not expose full-site counts.
- The authenticated workspace renders a Figma-aligned Students section with filters, result counts, story/risk chips, status pills, problem-state empty handling, and disabled `Detail view coming soon` row controls only.
- Student detail is still not built; Phase 9 should build on the directory route and filter vocabulary.

Updated next prompt after Phase 8: `09_student_detail_timeline_ui.txt`.
