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

## Run 2026-05-24 19:05 PT

- Starting SHA: `5a28b1ac309ce26839faed69296b9312561ce6db`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `student-detail-latest-feedback-context`
- Work order selected: Add latest visible feedback context to the authorized student detail summary.
- Selection reason: Missing/evidence drill-downs remain unsafe without exact route/filter support, while the student detail API already returns scoped review/comment rows with server-owned staff-only filtering. This was the safest product-readiness slice that improves staff drill-down usefulness without changing access.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Student detail latest feedback context | `LEVEL_2_STUDENT_DETAIL_DEPTH` | staff, viewer, teacher, mentor-scoped | 5 | 5 | 5 | S | 55 | selected |
| Missing/evidence dashboard drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 40 | deferred: unsupported mapping still unproven |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 41 | deferred: needs credentialed runtime |
| Student Directory mentor filter options | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff | 4 | 3 | 4 | M | 42 | deferred: API lacks safe mentor option labels |
| Program Teacher row detail actions | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher | 4 | 4 | 4 | S | 48 | rejected this run: feedback context was lower risk |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 47 | rejected: less tied to current handoff |
| Mentor assigned-student meeting summary | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | mentor | 4 | 4 | 4 | S | 46 | rejected: needs mentor dashboard field audit |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 44 | rejected: already verifier-covered |
| Detail privacy/redaction verifier extension | `LEVEL_7_AUDITABILITY_AND_TRUST` | staff, students | 4 | 5 | 5 | S | 50 | rejected: app UX slice was ready |
| Public guide workflow-copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 43 | rejected: protected app depth had higher value |
| Status breakdown click-through | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 4 | 3 | 4 | S | 43 | deferred: exact status-to-route mapping needs review |
| Student phase/detail drill-down | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 5 | 2 | 3 | M | 38 | deferred: no dedicated student-safe detail route |

- User-facing improvement: Staff opening a student detail drawer now see the latest visible review/comment in the summary instead of switching tabs before understanding the current feedback context.
- Roles affected: site admin, org admin, platform/admin, viewer, program teacher, mentor assigned-student detail where already authorized
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `docs/product-readiness-upgrade-sprint.md`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`
- Tests/verifiers added or updated: workspace render test now asserts the latest feedback summary marker and visible note copy
- Validation commands: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/site-student-detail.integration.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; `node --test tests/account-and-evidence-access.test.mjs`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: missing-submission/evidence drill-down; browser visual QA; Student Directory mentor filter options; student-safe phase/detail pages
- New backlog items: none
- Next recommended work order: inspect Program Teacher scoped student rows or mentor assigned-student cards for a safe existing-detail action/context improvement; keep missing/evidence drill-down deferred until the mapping is exact
- Do-not-repeat notes: student detail latest feedback summary is complete; do not re-add it unless the authorized detail API adds a new visible feedback source
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: student detail summary renders `data-student-detail-feedback="latest"` from scoped review/comment data and tests cover the rendered context
  - Unlocks: more useful staff/teacher detail drill-downs before adding deeper tabs or URL state
  - Next: add one more safe detail entry/context improvement, or run credentialed browser QA if credentials/runtime are available
  - Blockers: missing/evidence dashboard drill-down still lacks exact supported filter mapping; browser QA still needs credentialed runtime
  - Do not repeat: do not re-add latest feedback summary
  - First file to inspect next run: `workspace.js` `renderStudentDetailSummary()`

## Run 2026-05-24 19:35 PT

- Starting SHA: `b079911f14b1e1ddfeae836b2ee784822118b657`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Ladder level targeted: `LEVEL_1_NAVIGABLE_DASHBOARDS`
- Backlog item: `status-breakdown-directory-clickthrough`
- Work order selected: Link Site Dashboard `Status Breakdown` rows to the existing scoped Student Directory status filter.
- Selection reason: The previous memory handoff named status-breakdown drill-down as the next safe slice; the repo still rendered status rows as static snapshot rows, while `/api/site/students` already supports scoped `status` filters and shareable Student Directory URL state.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Status Breakdown -> Student Directory status filter | `LEVEL_1_NAVIGABLE_DASHBOARDS` | admin, site staff, viewer | 4 | 5 | 5 | S | 55 | selected |
| Missing/evidence dashboard drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 40 | deferred: unsupported mapping still unproven |
| Credentialed browser QA for drill-down URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 41 | deferred: needs credentialed runtime |
| Student Directory mentor filter options | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff | 4 | 3 | 4 | M | 42 | deferred: API lacks safe mentor option labels |
| Program Teacher scoped student detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher | 4 | 4 | 4 | S | 47 | rejected this run: current handoff favored dashboard navigation |
| Mentor assigned-student detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | mentor | 4 | 3 | 3 | M | 39 | deferred: assigned-site detail context needs audit |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: less tied to current Level 1 handoff |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 43 | rejected: already covered by read-only verifier |
| Public guide app-boundary cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 42 | rejected: protected app workflow had higher value |
| Student detail URL state | `LEVEL_2_STUDENT_DETAIL_DEPTH` | staff | 4 | 2 | 3 | M | 36 | deferred: URL student-id privacy policy not settled |
| Operations snapshot row drill-downs | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 4 | 3 | 4 | S | 43 | rejected: metric presets already cover the safest operations paths |
| Program dashboard language cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | program teacher | 2 | 5 | 4 | XS | 39 | rejected: lower workflow impact than a real drill-down |
| Mentor meeting status summary | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | mentor | 4 | 3 | 3 | S | 40 | deferred: needs mentor dashboard field audit |

- User-facing improvement: Staff can open supported `Status Breakdown` rows such as Submitted, Revision requested, and Approved into the filtered Student Directory instead of manually recreating the status filter.
- Roles affected: platform admin, admin, org admin, site admin, viewer/read-only staff; program teacher student-directory filters remain scoped by the existing route when reached through available sections.
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, `docs/functionality-language-audit.md`, `docs/product-readiness-upgrade-sprint.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`
- Tests/verifiers added or updated: workspace render/source assertions for status-breakdown actions; dashboard action verifier and workspace navigation verifier guard the new `status-breakdown` preset.
- Validation commands:
  - Baseline focused validation: `npm run verify:dashboard-actions`; `npm run verify:workspace-navigation`; `node --test tests/workspace-app.test.mjs`
  - Final validation: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed at draft time
- Deferred items: missing-submission/evidence drill-down; credentialed browser QA; Student Directory mentor filter options; mentor assigned-student detail action
- New backlog items: none
- Next recommended work order: map missing-submission/evidence-attention counts to an exact supported scoped route/filter, or run credentialed browser QA if the approved runtime/credentials are available.
- Do-not-repeat notes: do not re-add Status Breakdown status-filter actions; extend only if new dashboard status values need a supported mapping.
- Ladder Handoff:
  - Targeted Level: `LEVEL_1_NAVIGABLE_DASHBOARDS`
  - Advanced: yes
  - Evidence: `Status Breakdown` rows now use `data-section-preset="status-breakdown"` and set the Student Directory `status` filter with verifier/test coverage.
  - Unlocks: staff can drill from status counts to exact scoped student rows before deeper missing/evidence work.
  - Next: exact missing-submission/evidence mapping or credentialed browser QA.
  - Blockers: missing/evidence mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rebuild the status-breakdown click-through unless a regression appears.
  - First file to inspect next run: `workspace.js` `renderStatusBreakdown()`

## Run 2026-05-24 20:38 PT

- Starting SHA: `2fe656a67c671a2e164a3b3bcd68929b9646f8cf`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: work stayed on clean local `main`; local `main` was already one commit ahead of `origin/main`, and no push was run
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `program-teacher-scoped-student-detail-action`
- Work order selected: Add a real detail action to Program Teacher dashboard scoped-student rows.
- Selection reason: Missing/evidence dashboard drill-downs remain unsafe without exact filter mapping, while Program Teacher dashboard rows already expose scoped student IDs and the existing student detail route/handler already enforces program scope.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Program Teacher scoped student detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher | 4 | 5 | 5 | S | 53 | selected |
| Missing/evidence dashboard drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 40 | deferred: exact route/filter support still unproven |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 41 | deferred: needs approved credentials/runtime |
| Student Directory mentor filter options | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff | 4 | 3 | 4 | M | 42 | deferred: needs safe API-provided mentor labels |
| Mentor assigned-student detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | mentor | 4 | 3 | 3 | M | 39 | deferred: source-section/site-selection behavior needs audit |
| Operations row detail context preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | staff | 3 | 5 | 4 | S | 45 | rejected this run: teacher dashboard gap was clearer |
| Program Teacher review affordance cleanup | `LEVEL_5_REVIEW_AND_INTERVENTION_QUEUES` | program teacher | 4 | 4 | 4 | S | 43 | rejected: detail entry was smaller and safer |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 42 | rejected: lower workflow impact |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: less aligned to staff detail-depth handoff |
| Public guide app-boundary cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 40 | rejected: protected app workflow had higher value |
| Site Admin mentor POST default alignment | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 4 | 2 | 4 | M | 38 | deferred: mutation policy/risk higher than this lane slice |
| Unsupported Review Queue params | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 4 | 2 | 3 | M | 35 | deferred: missing/evidence/mentor/student params remain intentionally blocked |

- User-facing improvement: Program Teachers can move from their scoped dashboard student list directly to authorized student detail instead of switching sections and searching again.
- Roles affected: Program Teacher; existing site/student/detail roles were preserved
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, `docs/progress/run-log.md`
- Tests/verifiers added or updated: workspace render test for Program Teacher detail action; dashboard-action verifier guard for scoped-student detail buttons
- Validation commands:
  - Focused: `npm run verify:dashboard-actions`; `node --test tests/workspace-app.test.mjs`; `npm run verify:functionality-language`
  - Final: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: missing/evidence drill-down; credentialed browser QA; Student Directory mentor filter options; mentor assigned-student detail action; operations detail-context preservation
- New backlog items: none
- Next recommended work order: inspect Operations row detail context or Mentor assigned-student cards for the next safe existing-detail action; keep missing/evidence drill-down deferred until exact filter support exists.
- Do-not-repeat notes: do not re-add Program Teacher dashboard scoped-student detail buttons unless a regression removes them.
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: Program Teacher dashboard rows now render `data-site-student-action="view-detail"` with scoped student IDs, and the verifier/test guard the route-backed detail action.
  - Unlocks: smoother teacher workflow from dashboard summary to student context before deeper feedback/revision affordances.
  - Next: preserve Operations detail context or audit Mentor assigned-student detail entry.
  - Blockers: missing/evidence route/filter mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rebuild this Program Teacher detail button.
  - First file to inspect next run: `workspace.js` `renderScopedStudentList()`

## Run 2026-05-24 21:05 PT

- Starting SHA: `a555d428090129e2acf7049cb407310d3efe8353`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: work stayed on clean local `main`; local `main` was two commits ahead of `origin/main`, `origin/main` was not ahead, and no push was run
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `operations-detail-context-preservation`
- Work order selected: Preserve Operations worklist context when opening student detail from Operations rows.
- Selection reason: The current code passed Operations row actions through the real site student detail route, but `openSiteStudentDetail()` always switched the UI back to the broader Student Directory. The fix was bounded, route-backed, and verifier-friendly.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Operations detail context preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | site staff, viewer, program teacher | 4 | 5 | 5 | XS | 55 | selected |
| Mentor assigned-student detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | mentor | 4 | 3 | 4 | S | 46 | deferred: mentor source/site context needs one more audit |
| Operations Program Breakdown filter action | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 4 | 5 | 4 | S | 48 | rejected this run: detail context bug was clearer and smaller |
| Operations empty-state wording | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff, viewer | 3 | 5 | 4 | XS | 44 | rejected: lower workflow value |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: less aligned to current Level 2 handoff |
| Public `Future App Workflow` copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 42 | rejected: protected workflow depth had higher value |
| Program dashboard `Source record counts` copy | `LEVEL_0_PROTOTYPE_CLEANUP` | program teacher | 2 | 5 | 4 | XS | 39 | rejected: isolated language cleanup |
| Permission detail role-scope copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | denied users | 3 | 5 | 4 | XS | 41 | rejected: no workflow unlock |
| Assignment form unavailable copy | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 3 | 5 | 4 | XS | 43 | rejected: safe but lower impact |
| Review Queue detail source preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | staff, teacher | 4 | 3 | 3 | M | 40 | deferred: Review Queue does not yet render a detail surface |
| Missing/evidence drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 38 | deferred: exact supported route/filter mapping remains unproven |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 39 | blocked: needs credentialed runtime |

- User-facing improvement: Staff can open presentation, archive, or readiness student details without losing the Operations worklist and filters they were reviewing.
- Roles affected: platform admin, admin, org admin, site admin, viewer/read-only staff, program teacher
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, `docs/progress/run-log.md`
- Tests/verifiers added or updated: workspace render/handler test now asserts Operations stays active and closes back to Operations; dashboard-action verifier now guards explicit source-section preservation.
- Validation commands:
  - Focused: `node --test tests/workspace-app.test.mjs`; `npm run verify:dashboard-actions`
  - Final: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/site-operations-readiness.integration.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: mentor assigned-student detail action; missing/evidence drill-down; credentialed browser QA; Review Queue detail surface/context preservation
- New backlog items: none
- Next recommended work order: inspect mentor assigned-student cards and add a scoped detail action only if the source section and site resolution remain safe.
- Do-not-repeat notes: do not re-add Operations detail source preservation; extend it only if another worklist gets its own detail surface.
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: Operations row student-detail actions call `openSiteStudentDetail(..., { sourceSection: "operations" })`; close returns to the opening worklist; focused test and verifier cover it.
  - Unlocks: other non-directory worklists can safely add detail surfaces without losing context.
  - Next: mentor assigned-student detail action after confirming mentor source/site behavior, or Operations Program Breakdown filter action if Level 1 is prioritized.
  - Blockers: missing/evidence drill-down mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rework this Operations context handoff unless a regression appears.
  - First file to inspect next run: `workspace.js` `renderMentorStudentCards()`

## Run 2026-05-24 21:38 PT

- Starting SHA: `d98cedef101cefb189e2f8c459752416164bf19d`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: work stayed on clean local `main`; local `main` was three commits ahead of `origin/main`, `origin/main` was not ahead, and no push was run
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `mentor-dashboard-assigned-student-detail-action`
- Work order selected: Add a real detail action to Mentor Dashboard assigned-student rows while preserving Mentor Dashboard as the source section.
- Selection reason: The previous handoff pointed at `renderMentorStudentCards()`. Current code still rendered assigned-student cards without a detail action, while `/api/site/students/:studentId` already authorizes mentor-assigned student detail and returns generic denial/not-found responses for out-of-scope students.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Mentor Dashboard assigned-student detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | mentor | 5 | 5 | 5 | S | 55 | selected |
| Operations Program Breakdown filter action | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff, viewer | 4 | 5 | 4 | S | 48 | rejected: current handoff favored mentor detail depth |
| Program Teacher detail context preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher | 4 | 4 | 4 | S | 47 | rejected: mentor gap was clearer and next in handoff |
| Review Queue detail source preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | staff, teacher | 4 | 4 | 4 | S | 46 | deferred: add review-panel drawer context in a separate slice |
| Legacy Assigned Students detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | mentor | 3 | 4 | 4 | S | 44 | rejected: Mentor Dashboard is the primary richer mentor surface |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: less aligned to current Level 2 handoff |
| Student detail visible-note labels | `LEVEL_7_AUDITABILITY_AND_TRUST` | staff, students | 4 | 5 | 4 | S | 45 | rejected: current drill-down entry point had higher workflow value |
| Operations empty-state wording | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff, viewer | 3 | 5 | 4 | XS | 43 | rejected: safe but lower workflow impact |
| Assignment form unavailable copy | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 3 | 5 | 4 | XS | 43 | rejected: lower impact than real mentor detail action |
| Student Directory mentor filter options | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff | 4 | 3 | 4 | M | 42 | deferred: needs safe API-provided mentor option labels |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 42 | rejected: already covered by existing read-only affordances |
| Public `Future App Workflow` copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 40 | rejected: protected app workflow had higher value |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 39 | blocked: needs credentialed runtime |
| Missing/evidence drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 38 | deferred: exact supported route/filter mapping remains unproven |
| Site Admin mentor POST default alignment | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 4 | 2 | 4 | M | 37 | deferred: mutation policy/risk is higher than this lane slice |

- User-facing improvement: Mentors can open assigned-student detail directly from their dashboard and close back to the assigned-student worklist instead of losing context or switching to an unavailable directory.
- Roles affected: mentor; existing admin/staff/student detail visibility remains server-owned by the site student detail route
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, `docs/progress/run-log.md`
- Tests/verifiers added or updated: workspace render/handler test now asserts Mentor Dashboard detail open/close context; dashboard-action verifier guards the mentor dashboard detail source section.
- Validation commands:
  - Focused: `node --test tests/workspace-app.test.mjs`; `npm run verify:dashboard-actions`
  - Final: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/site-student-detail.integration.test.mjs`; `node --test tests/mentor-dashboard.integration.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: Review Queue detail source preservation; Program Teacher detail context preservation; Operations Program Breakdown filter action; missing/evidence drill-down; credentialed browser QA
- New backlog items: none
- Next recommended work order: preserve Review Queue or Program Teacher dashboard detail context using the same explicit source-section pattern, or inspect Operations Program Breakdown for a safe existing operations filter.
- Do-not-repeat notes: do not re-add Mentor Dashboard assigned-student detail buttons; extend only if another mentor surface needs the same existing detail route.
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: Mentor Dashboard assigned-student rows now render `data-mentor-dashboard-action="open-student"` and call `openSiteStudentDetail(..., { sourceSection: "mentorDashboard" })`; close returns to Mentor Dashboard.
  - Unlocks: other non-directory worklists can preserve their own detail context with the same explicit source-section pattern.
  - Next: Review Queue detail source preservation or Program Teacher dashboard detail context preservation.
  - Blockers: missing/evidence drill-down mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rebuild Mentor Dashboard detail entry unless a regression removes it.
  - First file to inspect next run: `workspace.js` `handleReviewQueueAction()` and `renderTeacherSection()`

## Run 2026-05-24 22:04 PT

- Starting SHA: `2445e59447111b814711b728e0ee3a52584d8680`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: work stayed on clean local `main`; local `main` was four commits ahead of `origin/main`, `origin/main` was not ahead, and no push was run
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `review-queue-detail-source-preservation`
- Work order selected: Preserve Review Queue context when opening student detail from a selected submission.
- Selection reason: The previous handoff pointed at `handleReviewQueueAction()` and `renderTeacherSection()`. Current code still routed Review Queue student-detail actions through the generic Student Directory source, so users left the queue context after using a real authorized detail action.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Review Queue detail source preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | staff, viewer, program teacher | 4 | 5 | 5 | XS | 55 | selected |
| Program Teacher dashboard detail context preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher | 4 | 5 | 4 | S | 50 | next candidate |
| Operations Program Breakdown filter action | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff, viewer | 4 | 5 | 4 | S | 48 | rejected: current handoff favored review detail context |
| Mentor Assignments detail source preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | site staff, viewer, program teacher | 4 | 4 | 4 | S | 47 | deferred: assignment workflow context needs separate audit |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: lower alignment with current Level 2 handoff |
| Student detail visible-note labels | `LEVEL_7_AUDITABILITY_AND_TRUST` | staff, students | 4 | 5 | 4 | S | 45 | rejected: current issue was a concrete navigation bug |
| Legacy Assigned Students detail action | `LEVEL_2_STUDENT_DETAIL_DEPTH` | mentor | 3 | 4 | 4 | S | 44 | rejected: Mentor Dashboard is the richer completed mentor surface |
| Operations empty-state wording | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff, viewer | 3 | 5 | 4 | XS | 43 | rejected: lower workflow value |
| Assignment form unavailable copy | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 3 | 5 | 4 | XS | 43 | rejected: safe but copy-only |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 42 | rejected: existing read-only banners are already guarded |
| Public `Future App Workflow` copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 40 | rejected: protected app workflow had higher value |
| Missing/evidence drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 38 | deferred: exact supported route/filter mapping remains unproven |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 39 | blocked: needs credentialed runtime |
| Site Admin mentor POST default alignment | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 4 | 2 | 4 | M | 37 | deferred: mutation policy/risk is higher than this lane slice |

- User-facing improvement: Staff can open a selected Review Queue student's detail drawer and close back to the Review Queue without losing the selected review worklist context.
- Roles affected: platform admin, admin, org admin, site admin, viewer/read-only staff, program teacher
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, `docs/progress/run-log.md`
- Tests/verifiers added or updated: workspace render/handler test now asserts Review Queue detail open/close context; dashboard-action verifier now guards Review Queue `sourceSection: "teacher"` and queue-local detail rendering.
- Validation commands:
  - Focused: `npm run verify:dashboard-actions`; `node --test tests/workspace-app.test.mjs`
  - Final: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/site-review-queue.integration.test.mjs`; `node --test tests/site-student-detail.integration.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: Program Teacher dashboard detail context preservation; Mentor Assignments detail context preservation; Operations Program Breakdown filter action; missing/evidence drill-down; credentialed browser QA
- New backlog items: none
- Next recommended work order: preserve Program Teacher dashboard detail context or Mentor Assignments detail context using the same explicit source-section pattern, after confirming the current worklist should remain visible.
- Do-not-repeat notes: do not re-add Review Queue detail source preservation; extend only if another review surface needs the same detail context.
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: Review Queue student-detail actions call `openSiteStudentDetail(..., { sourceSection: "teacher" })`; `renderTeacherSection()` renders the existing student detail surface inside the Review Queue when that source is active; close returns to Review Queue.
  - Unlocks: remaining non-directory worklists can preserve context with the same explicit source-section pattern.
  - Next: Program Teacher dashboard detail context preservation or Mentor Assignments detail source preservation.
  - Blockers: missing/evidence drill-down mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rebuild this Review Queue context handoff unless a regression appears.
  - First file to inspect next run: `workspace.js` `handleSiteStudentAction()` and `renderProgramTeacherDashboardSection()`

## Run 2026-05-24 22:36 PT

- Starting SHA: `853bae590d09a957c2b4c394076efd482d6c6c64`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: work stayed on clean local `main`; local `main` was five commits ahead of `origin/main`, `origin/main` was not ahead, and no push was run
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `remaining-detail-context-preservation`
- Work order selected: Preserve Program Teacher Dashboard and Mentor Assignments context when opening the existing authorized student detail drawer.
- Selection reason: Current source showed the remaining Program Teacher and Mentor Assignments detail actions still opened through the generic Student Directory source, while Review Queue, Operations, and Mentor Dashboard context preservation were already complete and guarded.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Program Teacher + Mentor Assignments detail context preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher, site staff, viewer | 4 | 5 | 5 | S | 56 | selected |
| Program Teacher dashboard detail context only | `LEVEL_2_STUDENT_DETAIL_DEPTH` | program teacher | 4 | 5 | 5 | XS | 53 | included in selected batch |
| Mentor Assignments detail context only | `LEVEL_2_STUDENT_DETAIL_DEPTH` | site staff, viewer, program teacher | 4 | 5 | 5 | XS | 53 | included in selected batch |
| Site Dashboard top-risk detail context preservation | `LEVEL_2_STUDENT_DETAIL_DEPTH` | site staff, viewer | 4 | 4 | 4 | S | 47 | rejected: needs separate dashboard detail-surface decision |
| Operations Program Breakdown filter action | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff, viewer | 4 | 5 | 4 | S | 48 | rejected: current handoff favored remaining detail-context bugs |
| Missing/evidence drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 38 | deferred: exact supported route/filter mapping remains unproven |
| Assignment form unavailable copy cleanup | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 3 | 5 | 4 | XS | 43 | rejected: copy-only and lower workflow impact |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 42 | rejected: existing read-only banners are already guarded |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: less aligned with current Level 2 handoff |
| Student detail visible-note labels | `LEVEL_7_AUDITABILITY_AND_TRUST` | staff, students | 4 | 5 | 4 | S | 45 | rejected: current issue was a concrete navigation bug |
| Operations empty-state wording | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff, viewer | 3 | 5 | 4 | XS | 43 | rejected: safe but lower workflow value |
| Public `Future App Workflow` copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 40 | rejected: protected app workflow had higher value |
| Student Directory mentor filter options | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff | 4 | 3 | 4 | M | 42 | deferred: needs safe API-provided mentor option labels |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 39 | blocked: needs credentialed runtime |
| Site Admin mentor POST default alignment | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 4 | 2 | 4 | M | 37 | deferred: mutation policy/risk is higher than this lane slice |

- User-facing improvement: Program Teachers, site staff, viewers, and read-only coverage reviewers can open a student detail drawer from the worklist they are using and close back to that same context.
- Roles affected: `program_teacher`, `site_admin`, `org_admin`, `admin`, `platform_admin`, and `viewer`; mentor/student access boundaries were not expanded.
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, `docs/progress/run-log.md`
- Tests/verifiers added or updated: workspace render/handler tests for Program Teacher and Mentor Assignments detail context; dashboard-action verifier guards both explicit source sections and embedded detail surfaces.
- Validation commands:
  - Focused: `npm run verify:dashboard-actions`; `node --test tests/workspace-app.test.mjs`
  - Final planned: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/site-student-detail.integration.test.mjs`; `node --test tests/site-mentor-assignments.integration.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: Site Dashboard top-risk detail context; Operations Program Breakdown filter action; missing/evidence drill-down; credentialed browser QA
- New backlog items: none
- Next recommended work order: inspect Site Dashboard top-risk detail context or Operations Program Breakdown for a safe route-backed filter action.
- Do-not-repeat notes: do not re-add Program Teacher Dashboard, Mentor Assignments, Review Queue, Operations, or Mentor Dashboard detail-context preservation unless a regression removes the source-section handoff.
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: Program Teacher Dashboard and Mentor Assignments student-detail actions now pass explicit source sections, render the existing detail drawer inside those sections, and close back to the originating worklist.
  - Unlocks: remaining dashboard/detail work can focus on new safe source surfaces instead of repairing the same context bug.
  - Next: inspect Site Dashboard top-risk detail context or Operations Program Breakdown filter action.
  - Blockers: missing/evidence drill-down mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rebuild the completed detail-context source sections.
  - First file to inspect next run: `workspace.js` `renderSiteTopRiskStudents()` and `renderSiteDashboardSection()`

## Run 2026-05-24 23:07 PT

- Starting SHA: `3dd4af21e4db710cced646efb2c780c201c62f53`
- Ending SHA: pending closeout commit; final hash is in the completion report
- Branch: `main`
- Branch policy: work stayed on clean local `main`; local `main` was six commits ahead of `origin/main`, `origin/main` was not ahead, and no push was run
- Ladder level targeted: `LEVEL_2_STUDENT_DETAIL_DEPTH`
- Backlog item: `site-dashboard-top-risk-detail-context`
- Work order selected: Preserve Site Dashboard context when opening the existing authorized student detail drawer from Top Risk Students.
- Selection reason: The previous handoff pointed at `renderSiteTopRiskStudents()` and `renderSiteDashboardSection()`. Current source still sent top-risk detail actions through the generic Students source, so closing the detail drawer left the dashboard context even though the button was rendered from the Site Dashboard.
- Candidate scoring summary:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|
| Site Dashboard top-risk detail context | `LEVEL_2_STUDENT_DETAIL_DEPTH` | site staff, viewer | 4 | 5 | 5 | XS | 57 | selected |
| Operations Program Breakdown filter action | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff, viewer, program teacher | 4 | 5 | 4 | S | 50 | next candidate |
| Operations readiness category filter action | `LEVEL_5_REVIEW_AND_INTERVENTION_QUEUES` | staff, viewer | 4 | 4 | 4 | S | 47 | rejected: needs clearer row-to-filter mapping |
| Student archive blocked guidance | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 5 | 4 | S | 46 | rejected: less aligned with current handoff |
| Student detail visible-note labels | `LEVEL_7_AUDITABILITY_AND_TRUST` | staff, students | 4 | 5 | 4 | S | 45 | rejected: lower workflow impact than context loss |
| Operations empty-state wording | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff, viewer | 3 | 5 | 4 | XS | 43 | rejected: safe but copy-only |
| Assignment form unavailable copy cleanup | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 3 | 5 | 4 | XS | 43 | rejected: safe but lower value than real workflow context |
| Viewer read-only homepage clarity | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | viewer | 3 | 5 | 4 | XS | 42 | rejected: read-only banners already have guard coverage |
| Student Directory mentor filter options | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | staff | 4 | 3 | 4 | M | 42 | deferred: needs safe API-provided mentor labels |
| Public `Future App Workflow` copy cleanup | `LEVEL_0_PROTOTYPE_CLEANUP` | public | 3 | 5 | 4 | S | 40 | rejected: protected app workflow had higher value |
| Credentialed browser QA for worklist URLs | `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT` | all | 4 | 4 | 3 | M | 39 | blocked: needs credentialed runtime |
| Missing/evidence drill-down mapping | `LEVEL_1_NAVIGABLE_DASHBOARDS` | staff | 5 | 2 | 3 | M | 38 | deferred: exact supported route/filter mapping remains unproven |
| Site Admin mentor POST default alignment | `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW` | site admin | 4 | 2 | 4 | M | 37 | deferred: mutation policy/risk is too high for this slice |
| Mentor assigned-student meeting depth | `LEVEL_4_ROLE_SPECIFIC_WORKSPACES` | mentor | 4 | 3 | 3 | M | 36 | deferred: needs API/data shape inspection |
| Student due-date detail | `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN` | student | 4 | 3 | 3 | M | 35 | deferred: due-date source mapping needs a separate proof slice |

- User-facing improvement: Site staff and viewers can open a top-risk student's detail from the Site Dashboard and close back to the same dashboard context instead of being moved to the broader Student Directory.
- Roles affected: `platform_admin`, `admin`, `org_admin`, `site_admin`, and `viewer`; student, mentor, and program-teacher access boundaries were not expanded.
- Files changed: `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `docs/functionality-language-audit.md`, `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, `docs/progress/run-log.md`
- Tests/verifiers added or updated: workspace render/handler test now asserts Site Dashboard top-risk detail open/close context and current-site detail query; dashboard-action verifier guards Site Dashboard detail source rendering.
- Validation commands:
  - Baseline focused: `npm run verify:dashboard-actions`; `node --test tests/workspace-app.test.mjs`
  - Focused after edits: `npm run verify:dashboard-actions`; `node --test tests/workspace-app.test.mjs`
  - Final: `npm run verify:dashboard-actions`; `npm run verify:review-queue-deeplinks`; `npm run verify:workspace-navigation`; `npm run verify:functionality-language`; `npm run verify:functionality-ux-automation`; `node --test tests/workspace-app.test.mjs`; `node --test tests/site-student-detail.integration.test.mjs`; `node --test tests/functionality-language-audit.test.mjs`; JSON parse for `automation/state/functionality-ux-growth-state.json`; `npm run check:route-inventory`; `npm run test`; `npm run typecheck`; `npm run check:production-surfaces`; `npm run check`; `git diff --check`; `git status --short`
- Validation result: passed; `git diff --check` reported CRLF normalization warnings only
- Commit: pending closeout commit
- Push status: not pushed
- Deferred items: Operations Program Breakdown filter action; missing/evidence drill-down mapping; credentialed browser QA; student archive blocked guidance
- New backlog items: none
- Next recommended work order: add a route-backed Operations Program Breakdown program filter action, because `/api/site/operations-readiness` and URL state already support `programId`.
- Do-not-repeat notes: do not re-add Site Dashboard top-risk detail context preservation; extend only if another dashboard row needs explicit source-section handling.
- Ladder Handoff:
  - Targeted Level: `LEVEL_2_STUDENT_DETAIL_DEPTH`
  - Advanced: yes
  - Evidence: Top Risk Student detail actions now keep `sourceSection: "siteDashboard"`, render the existing detail drawer inside Site Dashboard, include the current site id in the detail request, and close back to Site Dashboard.
  - Unlocks: remaining dashboard work can move back to Level 1 Operations program drill-downs instead of repairing detail-context loss.
  - Next: add Operations Program Breakdown `programId` filter action if the current source still renders those rows summary-only.
  - Blockers: missing/evidence drill-down mapping remains unproven; browser QA still needs credentialed runtime.
  - Do not repeat: do not rebuild Site Dashboard top-risk detail context unless a regression removes it.
  - First file to inspect next run: `workspace.js` `renderOperationsProgramBreakdown()` and `handleOperationsReadinessAction()`
