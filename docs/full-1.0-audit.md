# Full 1.0 Functional Audit

Date: 2026-06-07

This is the current repo-backed 1.0 audit for the protected app. It focuses on the working app, not the retired stakeholder mockups or legacy synthetic demo fixtures.

## Current 1.0 Decisions

- Auth is local accounts only for now. `wrangler.jsonc` sets `AUTH_MODE=hardened_username_password`, `AUTH_GOOGLE_SSO_ENABLED=false`, and `AUTH_LOCAL_LOGIN_ENABLED=true`.
- Google Workspace SSO remains scaffolded but disabled. The workspace hides the Google sign-in panel in local-only mode, and admin import rejects SSO account creation while SSO is disabled.
- The active school seed baseline is empty: `Test High School` and `East Career & Technical Academy`.
- Former seeded test schools are archived by migration `0014_local_only_empty_test_schools.sql`; their site memberships and site-program mappings are deactivated.

## Your Senior Booklet Alignment

- Student-facing requirement phases now use the booklet sequence: `start`, `phase-1`, `phase-2a`, `phase-2b`, `phase-3a`, `phase-3b`, `phase-4`, and `finish`.
- Student dashboard copy now explains each phase in plain language tied to setup, proposal approval, build work, mentor feedback, presentation, celebration, reflections, and final files.
- The visible student finish phase is `Finish: Download and Keep`, matching the source booklet reminder to download and keep important files before school account access ends.
- Student-owned surfaces now use `proof`, `work`, `sent work`, `fix and send again`, and `final files` instead of adult/system labels like evidence artifacts, submissions, quality prompts, and archive packages.
- Staff, mentor, viewer, and admin workspace copy now follows the same vocabulary where it is visible to users: proof counts, sent work, final-file packages, and final-file readiness.
- Migration `0013_student_booklet_phase_alignment.sql` aligns persisted requirement phase values without rewriting historical progress/audit rows.

## Working Role Profiles

- Student: sees own booklet-phase checklist, due work, feedback, sent work, proof actions, presentation state, and May 5 final-file readiness.
- Mentor: sees assigned students, meeting context, presentation/proof signals, and assigned-student detail only.
- Program Teacher: sees scoped dashboard, Review Queue, student directory filters, mentor coverage, presentation, and operations worklists for assigned program/cohort/site scope.
- Viewer: has read-only assigned-site or assigned-student visibility without mutation controls.
- Administration: has assigned-school oversight/readiness visibility without user/program mutation controls.
- Site Admin: can manage assigned-school programs, student membership removal, account removal for ordinary site accounts, mentor assignments, and site access where permitted.
- Global Admin: can manage all schools, import local accounts, remove ordinary accounts across schools, review audits, final-file exports, readiness, and role assignments.

## Functional Management Coverage

- Programs: `/api/site/programs` supports audited add/remove of active catalog programs for a selected school. Global Admin and Site Admin roles can use it where their scope allows.
- Students: `/api/admin/users/import` can create local student accounts assigned to a school. `/api/site/students/:studentId` `DELETE` archives the student's school membership, clears active mentor/viewer assignments, disables orphaned student sign-in, revokes sessions, and audits the required admin note.
- Accounts: `/api/admin/users/:id` `DELETE` archives/removes ordinary accounts within the caller's allowed scope, prevents self-removal, protects elevated peers for site admins, preserves at least one local Global Admin, disables accounts with no active school membership, revokes sessions, and audits the required admin note.
- Local account creation: `/api/admin/users/import` creates pending-reset local accounts with one-time setup passwords returned only in the no-store admin response. Temporary credential values stay out of audit metadata.

## Audit And Safety

- Management mutations require an authenticated user, role/scope checks, and an admin note where the action changes account/student/program assignment state.
- SSO routes continue to fail closed when disabled or partially configured.
- Site-scoped users cannot remove elevated peers or reach schools outside their assigned scope.
- The new empty-school migration has integration proof that the only active schools are `Test High School` and `East Career & Technical Academy`, with zero active site users and zero active site programs.

## Verification

- `node --test tests\admin-users-import.integration.test.mjs tests\site-user-management.integration.test.mjs tests\multisite-site-role-foundation.test.mjs tests\workspace-app.test.mjs tests\google-sso.integration.test.mjs` passed with 106 tests.
- `node --test tests\workspace-app.test.mjs tests\student-dashboard-access.integration.test.mjs tests\account-and-evidence-access.test.mjs tests\archive-readiness.integration.test.mjs` passed with 119 tests after the role-wide language pass; it includes rendered-text guardrails against old student labels like `Requirement Checklist`, `Open requirement`, `Add evidence`, `evidence item`, `archive package`, `May 5 archive`, `quality prompt`, `artifact`, `CTE connection`, and `district access`.
- `npm run check` passed with 403 passing tests and 4 expected local HTTP skips after regenerating `docs/generated/production-route-inventory.md`.
- Local browser/HTTP smoke confirmed `http://127.0.0.1:8788/workspace` loads the workspace and `/api/auth/config` returns `authMode=hardened_username_password`, `googleSsoEnabled=false`, and `localLoginEnabled=true`.

## Known Follow-Ups

- Hosted proof is still needed after deploying these changes.
- Invitation/email delivery is still a future polish path; the current 1.0 path is admin-created local accounts with out-of-band setup credential handoff.
- The old `seed:demo:*` scripts remain legacy synthetic demo/stress fixtures and are not the 1.0 empty-school baseline.
