# Functionality UX Growth Ledger

This append-only ledger records work completed by `automation/prompts/functionality-ux-upgrade-hourly.md`. Future hourly runs must append a new run entry here before closeout, even when the result is a documented blocker rather than an implementation commit.

Do not delete historical entries. If an older entry needs correction, add a short correction note in a later run.

## Run Entry Template

```markdown
## Run YYYY-MM-DD HH:mm PT

- Starting SHA:
- Ending SHA:
- Branch:
- Ladder level targeted:
- Backlog item:
- Work order selected:
- Selection reason:
- User-facing improvement:
- Roles affected:
- Files changed:
- Tests/verifiers added or updated:
- Validation commands:
- Validation result:
- Commit:
- Push status:
- Deferred items:
- New backlog items:
- Next recommended work order:
- Do-not-repeat notes:
- Ladder Handoff:
  - Targeted Level:
  - Advanced:
  - Evidence:
  - Unlocks:
  - Next:
  - Blockers:
  - Do not repeat:
  - First file to inspect next run:
```

## Completed Before Ledger Creation

### 2026-05-24 - Protected Workspace Header Cleanup

- Starting SHA: `ee0a3d94b77a45bdd5921df20d6c1ffc719c82f5`
- Ending SHA: not recorded in this ledger at the time
- Branch: `main`
- Ladder level targeted: `LEVEL_0_PROTOTYPE_CLEANUP`
- Backlog item: `docs/functionality-language-audit.md` items 1 through 3
- Work order selected: Replace protected workspace product header and posture chip implementation language.
- Selection reason: High-visibility protected app language made the workspace read like a build artifact.
- User-facing improvement: Authenticated users no longer see `Database-backed MVP`, `Cloudflare target`, `Audit-sensitive admin`, or `Senior Capstone Product` in the workspace header.
- Roles affected: staff, admin, viewer, program teacher, mentor, student sign-in context
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, `docs/functionality-language-audit.md`
- Tests/verifiers added or updated: workspace render tests and functionality language verifier
- Validation commands: `npm run verify:functionality-language`
- Validation result: passed
- Commit: not recorded in this ledger at the time
- Push status: unknown from this ledger
- Deferred items: public app-preview implementation wording remains queued
- New backlog items: none
- Next recommended work order: continue Level 0 language cleanup or move to Level 1 dashboard navigation
- Do-not-repeat notes: protected workspace header/posture chip cleanup is complete
- Ladder Handoff:
  - Targeted Level: `LEVEL_0_PROTOTYPE_CLEANUP`
  - Advanced: yes
  - Evidence: protected app header language verifier blocks key internal phrases
  - Unlocks: dashboard and role workflow improvements can now build from a school-facing shell
  - Next: clean permission/read-only language or dashboard navigation
  - Blockers: public app-preview copy still has review-only notices
  - Do not repeat: do not re-clean the same header phrases
  - First file to inspect next run: `workspace.js`

### 2026-05-24 15:05 PT - Site Dashboard No Mentor Click-Through

- Starting SHA: `4de44c38bbe1602f0d42a6547f007b786a17d992`
- Ending SHA: `e0171a9941b10e35067da7e57b5263561e5a4c91`
- Branch: `main`
- Ladder level targeted: `LEVEL_1_NAVIGABLE_DASHBOARDS`
- Backlog item: `docs/functionality-language-audit.md` top immediate fix 7 / functionality upgrade 1
- Work order selected: Link Site Dashboard `No Mentor` metric to existing Mentor Assignments with missing-mentor filters.
- Selection reason: The dashboard already surfaced the count and the scoped assignment workflow already existed, so the safest compounding slice was a filtered route-connected action.
- User-facing improvement: Site staff and read-only viewers can move from a coverage summary to the exact scoped missing-mentor records.
- Roles affected: Site Admin, Administration/AP/Principal equivalents, Viewer/read-only staff, Program Teacher read-only coverage where scoped
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `docs/functionality-language-audit.md`
- Tests/verifiers added or updated: workspace app render/source tests for the filtered dashboard action
- Validation commands: `npm run verify:functionality-language`; `node --test tests/workspace-app.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`
- Validation result: passed; `git diff --check` had CRLF normalization warnings only
- Commit: `e0171a9941b10e35067da7e57b5263561e5a4c91`
- Push status: not pushed by this one-off lane
- Deferred items: Submitted/Needs Revision review-queue filters; presentation/archive operations filters; dashboard link verifier
- New backlog items: none
- Next recommended work order: link Site Dashboard `Submitted` or `Needs Revision` metrics into the existing Review Queue filters
- Do-not-repeat notes: `No Mentor` metric is already linked to Mentor Assignments with `noMentor=true` and `status=unassigned`
- Ladder Handoff:
  - Targeted Level: `LEVEL_1_NAVIGABLE_DASHBOARDS`
  - Advanced: yes
  - Evidence: Site Dashboard `No Mentor` metric opens Mentor Assignments with missing-mentor filters
  - Unlocks: review-count and operations-count click-through work
  - Next: link `Submitted` or `Needs Revision` to Review Queue filters
  - Blockers: none for the next review-count action
  - Do not repeat: do not relink the No Mentor metric
  - First file to inspect next run: `workspace.js` `renderSiteDashboardSection()`

## Run 2026-05-24 15:06 PT

- Starting SHA: `e0171a9941b10e35067da7e57b5263561e5a4c91`
- Ending SHA: pending until closeout commit is created
- Branch: `main`
- Ladder level targeted: `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`
- Backlog item: one-off user request to upgrade the functionality UX automation prompt into a durable product growth engine
- Work order selected: Create the growth ladder, ledger, JSON state, expanded hourly prompt, and prompt-quality regression test.
- Selection reason: The current automation prompt was safe but too short, did not force enough candidate discovery/scoring, did not track ladder progress, and did not provide durable do-not-repeat state for weeks of hourly compounding work.
- User-facing improvement: Future hourly runs should make better product decisions and produce more consistent app functionality, UX clarity, role workflow, dashboard depth, and validation improvements.
- Roles affected: all roles indirectly through improved automation selection and safety
- Files changed: `automation/prompts/functionality-ux-upgrade-hourly.md`, `docs/functionality-ux-growth-ladder.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, automation prompt quality tests, and package/script wiring
- Tests/verifiers added or updated: prompt quality test and `verify:functionality-ux-automation`
- Validation commands: `npm run verify:functionality-ux-automation`; `npm run verify:functionality-language`; `node --test tests/functionality-language-audit.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit; see final run report or `git log -1`
- Push status: not pushed
- Deferred items: future runs should add richer dashboard link verifier coverage after the prompt upgrade lands
- New backlog items: none yet
- Next recommended work order: run the upgraded hourly automation once and inspect the first Ladder Handoff
- Do-not-repeat notes: do not replace this growth system with a short generic checklist; keep ladder/ledger/state concepts enforced by tests
- Ladder Handoff:
  - Targeted Level: `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`
  - Advanced: yes
  - Evidence: growth ladder, ledger, JSON state, upgraded prompt, package verifier, wrapper fallback, and regression test passed validation
  - Unlocks: scored, traceable, non-repetitive hourly product work
  - Next: run the automation once on the next safe app slice
  - Blockers: none known at draft time
  - Do not repeat: do not re-audit the old short prompt after this commit; inspect the new ladder/state first
  - First file to inspect next run: `automation/state/functionality-ux-growth-state.json`

## Product Upgrade Sprint 2026-05-24 15:43 PT

- Starting SHA: `19396ea065fdc3c748d342844ecddcf81a9d4b79`
- Ending SHA: pending closeout commit
- Branch: `main`
- Ladder levels targeted: `LEVEL_0_PROTOTYPE_CLEANUP`, `LEVEL_1_NAVIGABLE_DASHBOARDS`, `LEVEL_2_STUDENT_DETAIL_DEPTH`, `LEVEL_4_ROLE_SPECIFIC_WORKSPACES`, `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`
- Backlog item: one-time user-requested product-readiness upgrade sprint covering homepage language, dashboard language, site selection, layout width, collapsible navigation, student detail entry, and obvious product gaps
- Work order selected: Fix the explicit reported issues, document a 100-item repo-grounded product audit, and leave validated handoff state for future growth runs.
- Selection reason: The request named high-visibility school-user blockers and asked for an aggressive but safe product cleanup rather than another narrow hourly slice.
- User-facing improvement: The protected workspace now reads as a school workspace, uses more desktop width, has a collapsible menu, shows admin-only current-site selection, links more dashboard counts to real scoped worklists, and opens high-risk student detail from the dashboard.
- Roles affected: Product/platform admin, org admin, site admin, viewer, program teacher, mentor, student, and public preview visitors
- Explicit user-reported issues addressed:
  - Homepage developer/product-build language: fixed
  - Dashboard developer/implementation language: fixed
  - Product/Site Admin site selector/current-site control: fixed
  - Page width and cramped dashboard layout: fixed
  - Hamburger/collapsible menu: fixed
  - Student detail entry from dashboard risk rows: fixed using existing authorized detail route
  - Prototype/product gaps: partially fixed, with 100 concrete follow-up issues documented
- 100-item audit file: `docs/product-readiness-upgrade-sprint.md`
- Ladder levels advanced:
  - `LEVEL_0_PROTOTYPE_CLEANUP`: protected and public-facing language cleanup expanded
  - `LEVEL_1_NAVIGABLE_DASHBOARDS`: Submitted, Needs Revision, Presentation, Archive, and Top Risk actions now route to real work surfaces
  - `LEVEL_2_STUDENT_DETAIL_DEPTH`: top-risk dashboard rows now open existing authorized student detail
  - `LEVEL_4_ROLE_SPECIFIC_WORKSPACES`: Product/Site Admin site context and mentor empty states improved without broadening access
  - `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`: sprint audit, scorecard, verifier, and state handoff updated
- Fixes completed:
  - Cleaned workspace homepage, permission, dashboard, empty-state, archive privacy, and public preview implementation copy
  - Added admin-only site selector/current-site indicator using existing `accessibleSites` and `siteId` query behavior
  - Propagated selected site into site dashboard, directory, review queue, mentor assignments, operations, student detail, and timeline calls
  - Added collapsible navigation with compact labels and accessible toggle state
  - Widened app shell and dashboard grids for better desktop use
  - Added dashboard presets for submitted work, revision work, presentation readiness, and archive failures
  - Added Top Risk `View detail` actions to the existing student detail loader
  - Hardened protected workspace language verifier
- Fixes partially completed:
  - Browser/mobile visual QA used source and DOM tests because local credentialed smoke was not available in this run
  - Dashboard action verifier coverage exists in workspace tests, but a standalone route/action verifier remains recommended
  - Student detail entry was repaired from dashboard risk rows; richer detail tabs and URL state remain future work
- Fixes deferred:
  - Product Admin all-sites rollup until backend aggregate/RBAC design exists
  - Program-row, mentor workload, missing submission, and student next-action drill-downs until route/filter support is confirmed
  - Staff intervention mutation workflows until backend/audit support exists
- Files changed:
  - `workspace.js`
  - `workspace.css`
  - `app.js`
  - `public-companion/app.js`
  - `scripts/verify-functionality-language.mjs`
  - `tests/workspace-app.test.mjs`
  - `tests/workspace-browser-smoke.test.mjs`
  - `docs/product-readiness-upgrade-sprint.md`
  - `docs/functionality-ux-growth-ledger.md`
  - `automation/state/functionality-ux-growth-state.json`
- Tests/verifiers added or updated:
  - `scripts/verify-functionality-language.mjs`
  - `tests/workspace-app.test.mjs`
  - `tests/workspace-browser-smoke.test.mjs`
- Browser/DOM checks:
  - Source/DOM render coverage checked workspace home, site dashboard, student directory/detail, review queue, mentor assignments, operations, mentor dashboard, student dashboard, permission states, archive, presentation, site selector, and collapsible nav.
  - No screenshots were committed because the browser smoke harness requires credentialed local/runtime setup.
- Validation commands:
  - Baseline: `npm run verify:functionality-language`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `git diff --check`
  - Targeted during implementation: `npm run verify:functionality-language`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `npm run check:production-surfaces`
  - Final validation: `npm run verify:functionality-ux-automation`; `npm run verify:functionality-language`; `node --test tests/functionality-language-audit.test.mjs`; `node --test tests/workspace-app.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit; see final report or `git log -1` because embedding the final hash in the same commit would change the hash
- Push status: not pushed
- Next recommended work orders:
  - Add standalone dashboard action verifier for fake links, unsupported presets, and unauthorized destinations
  - Run browser screenshot QA for desktop/mobile collapsed and expanded navigation
  - Add program-row click-through to Student Directory after confirming supported filters
  - Add mentor workload and missing submission drill-downs
  - Add student next-action and archive-blocker guidance
- Do-not-repeat notes:
  - Do not re-clean the workspace header posture language unless a new leak appears
  - Do not relink the No Mentor metric; it was completed before this sprint
  - Do not add fake site switching, fake all-sites rollups, fake retry buttons, or fake intervention workflows
  - Do not broaden viewer, teacher, mentor, or student access while adding drill-downs
  - Do not repeat this 100-item audit as generic docs work; use it to select concrete next slices
- Ladder Handoff:
  - Targeted Level: `LEVEL_1_NAVIGABLE_DASHBOARDS`
  - Advanced: yes, with Level 0, Level 2, Level 4, and Level 9 supporting work
  - Evidence: route-backed dashboard presets, admin site selector, collapsible nav, top-risk detail actions, hardened verifier, and sprint audit
  - Unlocks: safer future dashboard drill-downs and browser visual QA
  - Next: add the standalone dashboard action verifier, then program-row or workload drill-down
  - Blockers: browser screenshots need credentialed local runtime; all-sites rollup needs backend aggregate design
  - Do not repeat: do not redo the explicit fixed items unless regression evidence appears
  - First file to inspect next run: `docs/product-readiness-upgrade-sprint.md`

## Run 2026-05-24 16:37 PT

- Starting SHA: `f278233c8ba309dd9aee3a3711aa8803810a523b`
- Ending SHA: pending closeout commit
- Branch: `functionality-usability-continuation-20260524`
- Ladder level targeted: `LEVEL_1_NAVIGABLE_DASHBOARDS` with `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` regression protection
- Backlog item: `dashboard-action-link-verifier`, `program-row-directory-clickthrough`, `mentor-workload-clickthrough`, and `student-next-action-card`
- Work order selected: Add the standalone dashboard/action verifier, then complete route-backed program and mentor workload drill-downs plus a student-owned next-action focus card.
- Selection reason: The previous sprint named the verifier as the safest next compounding slice, and the existing Student Directory and Mentor Assignments filters already supported the two highest-confidence drill-downs.
- User-facing improvement: Staff can open program-scoped student lists and mentor-specific workload lists from dashboard rows; students see one clear top next action before the longer task list.
- Roles affected: site/admin staff, viewer/read-only staff, program teacher scoped staff, students
- Files changed: `workspace.js`, `workspace.css`, `functions/api/site/dashboard.ts`, `scripts/verify-dashboard-actions.mjs`, `package.json`, `tests/workspace-app.test.mjs`, `tests/functionality-language-audit.test.mjs`, sprint docs, ledger, and JSON state
- Tests/verifiers added or updated: added `verify:dashboard-actions`; updated workspace render/source assertions; updated functionality audit verifier-registration test
- Validation commands:
  - Baseline before edits: `npm run verify:functionality-language`; `npm run typecheck`; `npm run check:production-surfaces`; `git diff --check`; `npm run test`
  - Targeted after edits: `npm run verify:dashboard-actions`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`
  - Final validation: `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`
- Validation result: passed; baseline `npm run test` first failed only because the brand-new local branch had no upstream, then passed after setting temporary upstream to `origin/main`; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit; see final report or `git log -1`
- Push status: pending
- Deferred items: missing-submission drill-down, all-sites Product Admin rollup, and browser screenshot QA remain deferred for the safety reasons in `docs/product-readiness-upgrade-sprint.md`
- New backlog items: extend `verify:dashboard-actions` whenever new dashboard action types are introduced
- Next recommended work order: map the missing-submission/evidence-attention count to a supported filter, then add the drill-down only if the mapping is exact and scoped
- Do-not-repeat notes: do not relink Program Breakdown or Mentor Coverage dashboard rows; do not add fake controls for missing submissions, retry, intervention, or all-sites rollups
- Ladder Handoff:
  - Targeted Level: `LEVEL_1_NAVIGABLE_DASHBOARDS`
  - Advanced: yes
  - Evidence: dashboard verifier added, Program Breakdown opens Student Directory with `programId`, Mentor Coverage opens Mentor Assignments with `mentorUserId`, and student home has a first next-action card
  - Unlocks: safer future dashboard drill-downs because unsupported presets now fail verification
  - Next: missing-submission/evidence-attention drill-down after route/filter mapping
  - Blockers: browser screenshot QA still needs credentialed local runtime; all-sites rollup still needs backend aggregate design
  - Do not repeat: do not redo the verifier, program preset, or mentor-workload preset unless a regression appears
  - First file to inspect next run: `scripts/verify-dashboard-actions.mjs`

## Run 2026-05-24 16:59 PT

- Starting SHA: `1e2e22c63a7b0a71320ff7099e014e6ae7a00835`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `product-functionality-megasprint-3-20260524`
- Ladder level targeted: `LEVEL_1_NAVIGABLE_DASHBOARDS`, `LEVEL_4_ROLE_SPECIFIC_WORKSPACES`, `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`
- Backlog item: Product Functionality Megasprint 3.0
- Work order selected: Review Queue URL-state/deep links, active filter UI across core worklists, workspace navigation verifier, Review Queue deep-link verifier, and docs/state handoff.
- Selection reason: The prior run completed dashboard card drill-downs and explicitly left Review Queue URL-state as the next safe high-value workflow improvement.
- User-facing improvement: Staff can open/reload Review Queue links with real supported filters, see active filters in Review Queue, Student Directory, Mentor Assignments, and Operations, clear filters from the visible summary, and get clearer no-results guidance.
- Roles affected: admin, platform admin, org admin, site admin, viewer, program teacher; student surfaces were preserved and revalidated but not changed.
- Files changed: `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `tests/functionality-language-audit.test.mjs`, `scripts/verify-review-queue-deeplinks.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, `package.json`, `docs/product-readiness-upgrade-sprint.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`
- Tests/verifiers added or updated: added `npm run verify:review-queue-deeplinks`, added `npm run verify:workspace-navigation`, extended workspace URL/history render tests, and extended functionality language audit registration tests.
- Validation commands: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git diff --cached --check`
- Validation result: passed; the first `npm run test` attempt failed only because the new local branch had no upstream, then passed after setting a temporary upstream to the prior sprint branch; `git diff --check` reported CRLF normalization warnings only and `git diff --cached --check` passed cleanly
- Commit: pending closeout commit
- Push status: pending
- Deferred items: missing/evidence/student/mentor Review Queue params without complete supported filter paths; browser screenshot QA; Student Directory and Mentor Assignments URL-state beyond visible active filters.
- New backlog items: credentialed browser QA for Review Queue deep links and active filters; evaluate student-specific Review Queue link only after privacy/UI review; consider URL-state for other staff worklists if product wants reloadable worklist URLs.
- Next recommended work order: map missing-submission/evidence-attention counts to a real supported route/filter, or run credentialed browser QA for the Review Queue URL-state work.
- Do-not-repeat notes: do not add `missing`, `evidenceStatus`, `mentorUserId`, `studentUserId`, or `studentId` Review Queue links until backend, UI, and privacy support are complete.
- Ladder Handoff:
  - Targeted Level: `LEVEL_1_NAVIGABLE_DASHBOARDS`
  - Advanced: yes
  - Evidence: Review Queue URL state, active filter summaries, and two verifiers now pass focused tests.
  - Unlocks: dashboard links and staff-shared queue URLs can be regression-protected.
  - Next: missing/evidence drill-down mapping or credentialed browser QA.
  - Blockers: missing-submission route/filter mapping remains unconfirmed; browser QA needs credentialed local runtime.
  - Do not repeat: do not re-add already-supported dashboard presets or active-filter UI unless a new list view is added.
  - First file to inspect next run: `workspace.js`

## Run 2026-05-24 18:35 PT

- Starting SHA: `b9c347c46d59c31c82a63b70ea027025c6cc4eb8`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: no new branch was created; work stayed directly on synced `main`
- Ladder level targeted: `LEVEL_1_NAVIGABLE_DASHBOARDS`, `LEVEL_4_ROLE_SPECIFIC_WORKSPACES`, `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`
- Backlog item: Product Functionality Upgrade Megapass 4.1
- Candidate opportunities inspected: 286
- Candidate opportunities implemented: 12
- Work order selected: Add reloadable/shareable URL state for existing Student Directory, Mentor Assignments, and Operations filters; make dashboard presets sync those URLs; expose the existing Operations submission-status filter; and harden tests/verifiers.
- Selection reason: Review Queue URL-state was complete, and the remaining safe staff worklists already had scoped backend filters and visible UI patterns. This was the highest-value path that avoided auth/RBAC changes, migrations, fake routes, and unsupported Review Queue params.
- User-facing improvement: Staff can reload or share filtered Student Directory, Mentor Assignments, and Operations views; active filters explain the URL behavior; page size/offset filters are visible; school switching clears stale filter params; Operations users can filter by submission status.
- Roles affected: platform admin, admin, org admin, site admin, viewer, program teacher. Mentor and student surfaces were preserved and revalidated but not changed.
- Files changed: `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, `docs/product-readiness-upgrade-sprint.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`
- Tests/verifiers added or updated: extended workspace URL/history render tests; hardened `verify:dashboard-actions` for URL-synced dashboard presets; hardened `verify:workspace-navigation` for shareable worklist URL helpers and site-switch stale-filter cleanup.
- Supported routes/query params confirmed:
  - Student Directory: `/api/site/students` with `section=students`, `siteId`, `search`, `programId`, `status`, `noMentor`, `risk`, `story`, `presentationStatus`, `archiveStatus`, `limit`, `offset`
  - Mentor Assignments: `/api/site/mentor-assignments` with `section=mentorAssignments`, `siteId`, `programId`, `mentorUserId`, `studentSearch`, `status`, `noMentor`, `limit`, `offset`
  - Operations: `/api/site/operations-readiness` with `section=operations`, `siteId`, `programId`, `status`, `story`, `risk`, `presentationStatus`, `archiveStatus`, `readiness`, `limit`, `offset`
- Unsupported/deferred params: Review Queue `missing`, `evidenceStatus`, `mentorUserId`, `studentUserId`, and `studentId` remain deferred; Student Directory mentor filter remains deferred until safe mentor options/labels are returned by that API.
- Validation commands:
  - Baseline before edits: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
  - Targeted after edits: `node --test tests/workspace-app.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`
  - Full before docs closeout: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result before docs: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: pending
- Browser QA status: not run; credentialed browser QA remains a separate blocked/manual task
- RBAC/privacy notes: no auth/RBAC, tenant/site/program/mentor/student scoping, evidence access, D1 config, migrations, secrets, env, Cloudflare production settings, Google OAuth settings, live data, deployment, or destructive commands changed
- Deferred items: missing-submission/evidence-attention drill-down; browser QA; Student Directory mentor filter options; all-sites product admin rollup; unsupported Review Queue params
- Next recommended work order: either run credentialed browser QA for shareable worklist URLs, or map missing-submission/evidence-attention counts to an exact supported route/filter before adding any drill-down
- Do-not-repeat notes: do not add fake dashboard actions or unsupported Review Queue params; do not reintroduce retired builder cadence checks; do not hardcode `C:\SeniorProjectApp1.0` as a verifier requirement
- Ladder Handoff:
  - Targeted Level: `LEVEL_4_ROLE_SPECIFIC_WORKSPACES`
  - Advanced: yes
  - Evidence: shareable URL-state for three staff worklists, URL-synced dashboard presets, active filter URL notes, operations submission filter, and verifier/test coverage
  - Unlocks: browser QA can now test stable shareable worklist URLs across staff roles
  - Next: credentialed browser QA or exact missing/evidence drill-down mapping
  - Blockers: missing/evidence mapping remains unproven; browser QA needs credentials/runtime
  - Do not repeat: do not rebuild URL-state for these three worklists unless adding a new supported filter
  - First files to inspect next run: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`
