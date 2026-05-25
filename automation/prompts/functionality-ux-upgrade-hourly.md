# Functionality UX Upgrade

Automation slug: `functionality-ux-upgrade-hourly`

Recommended cadence: top and bottom of the hour.

The Functionality UX Upgrade automation should run twice per hour: once at the top of the hour and once at the bottom of the hour. In human schedule terms, that means HH:00 and HH:30 local Pacific time.

Repo: `C:\SeniorProjectApp1.0`

Remote: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

Branch: `main`

GUI-visible identity to preserve:

- Display name: `Functionality UX Upgrade`
- Automation slug/id: `functionality-ux-upgrade-hourly`
- Active prompt path: `automation/prompts/functionality-ux-upgrade-hourly.md`
- The Codex Desktop GUI entry must stay active and must continue to point at this prompt path.
- Do not rename this file, change this heading, change the slug, or create a duplicate active prompt.

This prompt governs a product-readiness lane for the Capstone Project app. It is designed to run twice per hour for weeks and steadily compound real app functionality, role-based usability, dashboard depth, navigation clarity, empty states, permission messaging, language quality, and validation coverage.

This is not a marketing polish lane, fake-page lane, broad refactor lane, credential/config/deployment lane, or random cleanup lane.

## 1. Mission

Every run must spend serious attention on the current repository, then complete one bounded repo-grounded improvement batch or one exact blocker record.

Target behavior when the runner budget allows it:

- Spend roughly 10 to 20 minutes on analysis, implementation, validation, and documentation.
- Run multiple repo review passes before selecting work.
- Discover 10 to 20 candidate work orders.
- Score candidates with the rubric in this prompt.
- Select one high-value safe work order batch that can be finished in a single run.
- Implement a small but real app/product improvement.
- Add or update a focused test/verifier whenever practical.
- Update the growth ledger and JSON state.
- Commit only after validation passes.
- Leave a clear Ladder Handoff for the next run.

The lane should feel like a careful product engineer steadily sharpening the app, not a script picking the easiest text replacement or wandering into stale automation cleanup.

## 2. Non-Negotiable Safety Rules

- Preserve authentication, authorization, tenant isolation, site isolation, RBAC, program/cohort scope, mentor assigned-student scope, and student privacy.
- Do not weaken API 401/403/404 enforcement to make UI work easier.
- Do not edit `.env`, `.secrets`, ignored credential files, tokens, private keys, password hashes, salts, setup credentials, OAuth secrets, Cloudflare secrets, DNS/domain config, or production deployment config unless this prompt itself contains a wrong static statement about those files.
- Do not run deploys, remote seed/reset/migration commands, account reset commands, credential creation/repair, live Cloudflare config changes, domain/DNS changes, or OAuth changes.
- Do not create real users, real credentials, fake pilot-readiness claims, dangerous admin controls, broad schema migrations, or broad refactors.
- Do not fake metrics, records, routes, buttons, links, or workflow completion.
- Do not add fake pages, fake metrics, mock data, placeholder workflows, dead links, empty links, `href="#"`, or buttons that imply missing functionality works.
- Do not revive announcements or student-to-student messaging.
- Do not expose staff-only notes, admin controls, raw Drive/storage identifiers, token/password/setup credential fields, full private URLs, or unsafe audit metadata.
- Do not stage, stash, clean, reset, overwrite, or revert unrelated user or other-automation work.

## 3. Repo Identity Gate

Start every run from `C:\SeniorProjectApp1.0` and print:

- repo root
- current branch
- current SHA
- origin URL
- git status
- package manager
- relevant `package.json` scripts
- current date/time

Run:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git remote -v
git status --short --branch
git fetch origin --prune
git rev-parse origin/main
git rev-list --count origin/main..HEAD
git rev-list --count HEAD..origin/main
Get-Date -Format o
```

Inspect `package.json` scripts before choosing validation commands.

Continue only when:

- repo root is `C:\SeniorProjectApp1.0`
- branch is `main`
- origin is `https://github.com/timmb-lab/SeniorProjectApp1.0.git`
- local `main` is aligned with `origin/main`, or safely fast-forwarded before editing
- the worktree is clean or only contains files created by this same run
- package name is still `senior-capstone-app`

If identity fails, stop immediately with `WRONG_PROJECT` or `WRONG_BRANCH_OR_REMOTE`.

## 4. Dirty Tree Handling

If the working tree is dirty at start:

1. List dirty files.
2. Inspect only enough to classify whether they are related to this run.
3. Preserve user work.
4. Do not overwrite, stage, stash, reset, clean, or revert unrelated changes.

If unrelated dirty files exist, stop with `DIRTY_WORKTREE`.

If dirty files are created by this same run, continue carefully and stage only those files during closeout.

If a previous run left known generated files that are unrelated to this lane, stop and report them rather than mixing concerns.

## 5. Context Files To Read

Read these before selecting work:

- `package.json` scripts, especially active verification scripts
- `automation/prompts/functionality-ux-upgrade-hourly.md`
- `docs/functionality-language-audit.md`
- `docs/functionality-ux-growth-ladder.md`
- `docs/functionality-ux-growth-ledger.md`
- `automation/state/functionality-ux-growth-state.json` if present
- `docs/student-progress-dashboard.md` if present
- `docs/generated/production-route-inventory.md`
- `docs/automation-cadence.md`
- `docs/automation-backlog.md`
- `docs/automation-runbook.md`
- `docs/automation-self-improvement.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md` recent entries
- recent `docs/progress/runs/` manifests when relevant
- `docs/master-plan.md`
- `docs/mvp-requirements-catalog.md`
- role/RBAC documentation and permission helper tests for the selected surface
- admin, student, teacher/advisor, mentor, viewer, and administration-facing workspace surfaces
- demo data and seed/prove scripts only as context; do not run live writes unless the selected work safely requires a local dry-run proof
- Cloudflare, D1, OAuth, Drive, and deployment docs only for context; do not edit production config in this lane
- `workspace.html`
- `workspace.js`
- `workspace.css`
- `scripts/verify-functionality-language.mjs`
- `tests/functionality-language-audit.test.mjs`
- relevant `functions/api/**` and `functions/_lib/**` files for the selected route
- relevant `tests/**` files for the selected area

Use targeted `rg` searches after the required reading. Do not infer behavior from file names alone. Look for current evidence in source, tests, docs, and routes.

## 6. Growth Ladder Model

Use `docs/functionality-ux-growth-ladder.md` as the long-term maturity map:

- `LEVEL_0_PROTOTYPE_CLEANUP`
- `LEVEL_1_NAVIGABLE_DASHBOARDS`
- `LEVEL_2_STUDENT_DETAIL_DEPTH`
- `LEVEL_3_MENTOR_ASSIGNMENT_WORKFLOW`
- `LEVEL_4_ROLE_SPECIFIC_WORKSPACES`
- `LEVEL_5_REVIEW_AND_INTERVENTION_QUEUES`
- `LEVEL_6_STUDENT_PROGRESS_DRILL_DOWN`
- `LEVEL_7_AUDITABILITY_AND_TRUST`
- `LEVEL_8_REPORTING_AND_OPERATIONAL_READINESS`
- `LEVEL_9_AUTONOMOUS_QUALITY_IMPROVEMENT`

The automation should usually choose the earliest ladder level with unmet exit criteria and a safe, testable slice. It may target a later level when the previous ledger handoff points there, the earlier level is blocked, or a later item unlocks higher compounding value.

Do not clean Level 0 language forever if Level 0 is mostly healthy. Move upward into navigable dashboards, drill-downs, queues, role workspaces, and verifiers.

## 7. Growth Ledger And State Rules

Every successful run must update:

- `docs/functionality-ux-growth-ledger.md`
- `automation/state/functionality-ux-growth-state.json`

If either file is missing, create it.

Ledger rules:

- Append only.
- Do not delete or rewrite historical entries.
- Cross-reference ladder level, audit/backlog item, commit, validation, and next work.
- Include a Ladder Handoff section.
- If implementation fails but analysis produced a useful blocker, append a Failed/Deferred entry when safe.

JSON state rules:

- Keep it small and machine-readable.
- Do not make it brittle.
- Preserve arrays for completed, deferred, blocked, next recommended, and do-not-repeat items.
- Update `lastRunAt`, `lastStartingSha`, `lastEndingSha`, `currentLadderFocus`, and `lastValidationStatus` when known.
- Add completed work order IDs so future runs avoid repeating them.

Suggested state shape:

```json
{
  "lastRunAt": null,
  "lastStartingSha": null,
  "lastEndingSha": null,
  "currentLadderFocus": "LEVEL_0_PROTOTYPE_CLEANUP",
  "completedWorkOrders": [],
  "deferredWorkOrders": [],
  "blockedWorkOrders": [],
  "nextRecommendedWorkOrders": [],
  "doNotRepeat": [],
  "lastValidationStatus": null
}
```

## 8. Candidate Discovery

Requirement: Discover 10 to 20 possible work orders before editing.

Before editing, discover 10 to 20 possible work orders from:

- `docs/functionality-language-audit.md`
- `docs/functionality-ux-growth-ladder.md`
- `docs/functionality-ux-growth-ledger.md`
- `automation/state/functionality-ux-growth-state.json`
- recent run handoffs and do-not-repeat notes
- `docs/automation-backlog.md`
- current `workspace.js`/route/test inspection
- TODOs only when relevant to real app functionality
- validation gaps
- incomplete prior slices
- recent commits and changed files

Each candidate should include:

- title
- affected user role
- affected route or surface
- user pain point
- expected improvement
- files likely involved
- risk level
- testing path
- whether it touches forbidden areas

Use `rg` for current evidence. Good searches include:

```powershell
rg -n "Permission denied|Role scoped|selected-site|No Mentor|Submitted|Needs Revision|View student detail|href=\"#\"|actionSection|data-section|TODO|placeholder|prototype|mock|tenant|RBAC" workspace.js app.js public-companion tests scripts docs
rg -n "mentorAssignments|reviewQueue|operationsReadiness|siteStudent|student detail|dashboard" workspace.js tests functions
git log --oneline -8
```

Candidate discovery must be written in the final report and ledger summary. It can be compact, but it must show the selected work was not random.

## 9. Candidate Scoring Rubric

Score each candidate from 1 to 5 in these categories:

- Student impact
- Teacher/advisor impact
- Admin impact
- Usability improvement
- Implementation safety
- Testability
- Small-batch feasibility
- Production readiness value
- Regression risk, reversed so lower risk scores higher
- Existing route/component/data readiness
- Ladder progression
- Avoids repetition or stale completed work

Then summarize:

- total score
- risk level: low, medium, high
- implementation size: XS, S, M, L
- selected/not selected
- reason

Use this table format in the run notes/final report:

| Candidate | Ladder Level | Roles | Impact | Safety | Testability | Size | Score | Decision |
|---|---|---|---:|---:|---:|---|---:|---|

Usually choose the highest-value safe candidate, not the highest raw score if risk is high. Reject candidates that require fake data, broad rewrites, unclear RBAC, missing routes, or unapproved policy decisions.

The selected item must include:

- why this one
- why not the others
- what it unlocks next

## 10. Work Order Selection Rules

- Select one bounded primary work order or tightly related batch.
- Include supporting tests, verifiers, and docs only when they protect or explain the selected work.
- Keep the selected batch small enough to validate fully in one run.
- Prefer work that advances the current ladder focus or unlocks the next ladder level.
- Prefer workflow clarity, missing empty states, admin drill-downs, student progress visibility, teacher/advisor usability, dashboard usefulness, clearer status labels, safer forms, route-level polish, demo/proof surfaces, and verifier-backed improvements.
- Prefer existing routes/components/data over new abstractions.
- Reject broad rewrites, broad redesigns, broad schema migrations, and vague docs churn.
- Reject cosmetic churn, speculative architecture changes, auth/RBAC or tenant-boundary changes, migrations, D1 schema/config edits, Cloudflare/deployment edits, secret/env edits, and stale cleanup that does not improve functionality.
- Reject isolated low-value copy when higher-priority ladder blockers are safe and ready.
- Reject work already listed in `completedWorkOrders` or `doNotRepeat` unless current repo evidence proves regression.
- If the selected item turns unsafe, mark it deferred and choose the next safe candidate only if still within scope and clean. Otherwise update ledger/state and stop.

## 11. Allowed Work Categories

Allowed:

- real dashboard click-throughs to existing filtered sections
- route-safe list/detail actions
- role-specific workspace improvements
- permission and read-only messaging
- empty state clarity
- student next-step clarity backed by real data
- mentor assigned-student workflow depth
- mentor assignment visibility and safe controls
- review/intervention queue filters
- language/product-readiness cleanup
- source-level verifiers and focused tests
- audit/ledger/state/backlog updates tied to the selected work

## 12. Forbidden Work Categories

Forbidden:

- marketing-only polish unrelated to app workflow
- pure color/style changes unless they fix functional clarity
- fake/mock/placeholder pages
- dead links or fake buttons
- auth/RBAC weakening
- tenant/site/program/student privacy weakening
- dangerous reset/security controls
- real user or credential creation/repair
- secrets, `.env`, `.secrets`, tokens, OAuth, domain/DNS, Cloudflare live config
- remote seed/reset/migration/deploy commands
- broad schema migrations
- broad refactors without direct user value
- unrelated curriculum/content work
- announcements reintroduction
- FERPA/pilot-readiness claims

## 13. Role Hierarchy And Permissions

Respect current implemented roles:

- `platform_admin` and legacy `admin`: platform-capable, broad admin/API visibility where existing code allows.
- `org_admin`: tenant/site visibility through helper-supported site routes; no platform security by default.
- `site_admin`: assigned-site operations; no platform security/user management unless current code allows it.
- Administration/AP/Principal: currently closest to `site_admin` and `viewer`; improve language and read/monitor paths without inventing unimplemented roles.
- `viewer`: read-only site dashboards, directory/detail, review queue, mentor coverage, operations; no mutation controls.
- `program_teacher`: program/cohort-scoped dashboard, review queue, student directory/detail, operations; mutation only where current APIs allow.
- `mentor`: active assigned-student-only access; no full directory, no assignment management, no access expansion.
- `student`: own dashboard, submissions/evidence, archive/presentation scope, own record only.
- `misc_admin`: narrow readiness/reporting support; do not position as principal/AP.

Never broaden a role without API permission changes and tests, and do not do broad permission changes in this lane without explicit safety evidence.

## 14. Student Privacy Rules

- Students see only their own records.
- Mentors see only actively assigned students.
- Program Teachers see only scoped program/cohort students unless current policy says otherwise.
- Viewers remain read-only.
- Staff-only comments, admin fields, tenant internals, unsafe audit metadata, and storage identifiers stay hidden from students.
- UI changes must not create new data paths that bypass server authorization.
- If privacy or visibility is unclear, add a test/documentation item first rather than expanding access.

## 15. Dashboard Click-Through Rules

Make a card/count clickable only when:

- a real route or existing workspace section exists,
- the current role can use that route/section,
- the needed filters are already supported or can be added safely,
- the result uses real records,
- and tests/verifiers cover the action when practical.

Do not add a link merely because the card looks clickable. For cards without a safe destination, add clear summary-only language or defer to backlog.

Preferred Level 1 slices:

- `Submitted` -> Review Queue filtered to submitted.
- `Needs Revision` -> Review Queue filtered to revision requested.
- Presentation pending -> Operations filtered to presentation attention.
- Archive failed -> Operations/archive filtered to failed status.
- Program row -> Student Directory filtered by program.
- Top risk student row -> Student Detail.

## 16. Student Detail Rules

- Reuse existing student detail drawer/routes before creating new pages.
- Add detail actions only from lists already authorized to view that student.
- Preserve directory/filter state when opening detail if existing patterns do so.
- Keep staff-only notes hidden from students.
- Add or update role-specific tests when changing detail access/rendering.
- Do not add bookmarkable IDs or URL state unless authorization and privacy behavior are explicitly tested.

## 17. Mentor Assignment Rules

- Mentors cannot assign students to themselves.
- Mentors cannot broaden access.
- Viewer and Program Teacher read-only behavior must stay visibly read-only unless product/security policy changes.
- Site Admin/authorized operations controls must require valid selected-site student, selected-site mentor, and a sanitized reason when mutation exists.
- Do not create users, roles, credentials, or site memberships from assignment UI.
- Add tests for self-assignment, cross-site denial, missing role denial, and read-only gating when touching assignment behavior.

## 18. Viewer/Admin Role Rules

- Viewer copy should say what can be reviewed/monitored and who can act.
- Viewer surfaces should not show mutation controls.
- Admin/Site Admin copy should be operational and action-oriented without exposing implementation jargon.
- Administration/AP/Principal language can clarify monitoring and escalation, but do not invent unimplemented role IDs.
- Platform/global admin language should not leak to site-scoped users.

## 19. Language Cleanup Rules

Normal user-facing language should be simple, direct, school-safe, and non-technical.

Avoid these in normal protected app UI:

- `Database-backed MVP`
- `Cloudflare target`
- `Audit-sensitive admin`
- raw `tenant`, `RBAC`, `schema`, `route`, `scope`, or `provider` jargon
- `prompt`, `Codex`, `mock`, `placeholder`, `scaffold`, `fake`, `prototype`, `debug`
- scary audit phrasing when "protected and reviewed" is enough

Student language should be friendly, clear, useful for ELL/IEP students, and focused on "your work" and "next step."

Staff/admin language should be professional, action-oriented, and precise.

## 20. Empty State Rules

- Separate load failure from true no-data.
- Explain who can help or what changes the state.
- Avoid saying "unavailable" when there are simply no records.
- Replace `selected-site`/`assigned-site` jargon with "this school" or "your assigned school" when safe.
- Viewer empty states should emphasize read-only monitoring/escalation.
- Student empty states should be supportive and specific.

## 21. Route/Link Rules

- No `href="#"`.
- No empty `href=""`.
- No button without an implemented handler when it implies action.
- No dead section IDs.
- No fake external links.
- Validate route inventories when adding real routes.
- When adding `data-section` actions, verify the target section exists in `availableSections()` for the intended roles.
- When adding query/filter behavior, verify the API supports it and returns scoped records.

## 22. Data Reality Rules

- Use persisted API data or existing route responses.
- Do not fabricate counts, rows, statuses, due dates, mentor details, contact info, archive readiness, or review state.
- If data is missing, use a safe empty state and add a backlog/deferred item.
- If a route does not exist, do not fake a link. Either create a bounded real route with tests, or defer.
- If a metric is summary-only, say so through UI treatment or copy.

## 23. Implementation Size Rules

Prefer XS/S slices:

- one card action
- one filter transfer
- one detail button
- one empty-state cleanup
- one permission message
- one verifier/test
- one role homepage clarification

M-sized slices are allowed only when they remain strongly bounded and testable. L-sized broad rewrites are not for this hourly lane.

Stop after one bounded batch. Do not continue into an unrelated second app feature because the first was easy.

Implementation rules:

- Make minimal file changes.
- Follow existing local patterns before adding abstractions.
- Add no new dependency unless the selected work clearly justifies it.
- Avoid broad rewrites and broad file moves.
- Do not add placeholder UI pretending to be real functionality.
- Do not put fake data in production paths.
- Keep UI changes accessibility-conscious with simple language and clear loading, empty, and error states.
- Preserve school-safe demo behavior and tenant-safe data access.
- Add tests or verifiers when behavior changes.

## 24. Test/Verifier Requirements

Add or update a focused test/verifier whenever practical.

Use existing scripts where available:

- `npm run verify:functionality-language`
- `npm run verify:functionality-ux-automation` when automation prompt/ladder/state changes
- `node --test tests/<focused-test>.mjs`
- `npm run test`
- `npm run typecheck`
- `npm run check:production-surfaces`
- `npm run check:route-inventory`
- `npm run check`
- `git diff --check`

Choose the narrowest relevant validation first, then broader checks when user-facing source changes.

Do not invent a package script unless you also add the script and validation support.

GUI visibility validation:

- Preserve the active Markdown path, display name, slug/id, and enabled state used by the Codex Desktop GUI.
- If the local Codex Desktop automation TOML exists, verify it still has `id = "functionality-ux-upgrade-hourly"`, `name = "Functionality UX Upgrade"`, `status = "ACTIVE"`, a prompt that references `automation/prompts/functionality-ux-upgrade-hourly.md`, and the expected repo working directory.
- If the local GUI TOML is absent, do not guess. Preserve the repo-side identity fields and report that GUI visibility requires external confirmation.
- Do not create a duplicate GUI-visible automation entry unless Bryan explicitly asks for a second entry because the platform cannot express both HH:00 and HH:30 in one schedule.

## 25. Documentation Requirements

Update docs when the selected work materially changes status, backlog, handoff, or automation memory:

- `docs/functionality-language-audit.md` for completed audit rows or material new findings.
- `docs/functionality-ux-growth-ledger.md` every run.
- `automation/state/functionality-ux-growth-state.json` every successful run.
- `docs/automation-backlog.md` for new blockers/prerequisites.
- `docs/student-progress-dashboard.md` when student dashboard behavior changes.
- `docs/generated/production-route-inventory.md` only through the route inventory script when route files change.

Avoid broad docs churn. Documentation should make the next run sharper.

## 26. Ledger Update Requirements

Append a run entry with:

- Starting SHA
- Ending SHA
- Branch
- Ladder level targeted
- Backlog item
- Work order selected
- Selection reason
- User-facing improvement
- Roles affected
- Files changed
- Tests/verifiers added or updated
- Validation commands
- Validation result
- Commit
- Push status
- Deferred items
- New backlog items
- Next recommended work order
- Do-not-repeat notes
- Ladder Handoff

For failed/deferred runs, record the exact blocker and next safe action instead of pretending success.

## 27. JSON State Update Requirements

Update `automation/state/functionality-ux-growth-state.json` after implementation and validation:

- `lastRunAt`: current PT timestamp
- `lastStartingSha`
- `lastEndingSha`
- `currentLadderFocus`
- `completedWorkOrders`
- `deferredWorkOrders`
- `blockedWorkOrders`
- `nextRecommendedWorkOrders`
- `doNotRepeat`
- `lastValidationStatus`

Keep work order IDs stable and descriptive. Do not duplicate completed work orders.

## 28. Validation Requirements

Before committing:

```powershell
git status --short
git diff --stat
git diff --check
npm run check
npm run test
npm run typecheck
npm run check:production-surfaces
npm run verify:functionality-ux-automation
```

Also run relevant package scripts that exist in `package.json`.

If JSON files changed, parse them before commit. If YAML files changed, run the repo's available parser/checker or report that no YAML checker exists.

Always run the automation verifier before commit. It owns the stale automation reference scan, including retired cadence, retired checker, and retired builder-lane language, while still allowing the valid HH:00 and HH:30 schedule.

If validation fails:

- identify the first failing command,
- identify the first relevant error,
- decide whether this run caused it,
- fix if related and safe,
- otherwise record it as pre-existing and do not claim a clean pass.

Do not commit broken changes unless the only committed change is an explicit blocker record and the repo convention allows it.

## 29. Commit Rules

- Commit on `main` only when validation is acceptable.
- Stage only files intentionally touched by this run.
- Do not push unless the triggering prompt explicitly asks for push or the configured GUI workflow explicitly requires it.
- Use clear commit messages.
- Suggested commit message style:

```text
ux: improve dashboard navigation
docs: upgrade functionality ux automation
```

For this functionality UX lane, `ux:`, `docs:`, `test:`, or `automation:` are appropriate depending on the selected work.

## 30. Final Report Format

Return:

- repo identity and starting/ending SHA
- package manager and key validation scripts available
- current automation/growth-state summary
- candidate scoring table
- selected work order and why
- why the top rejected candidates were not selected
- ladder level targeted and whether it advanced
- exact files changed
- permission/privacy considerations
- tests/verifiers added or updated
- validation commands and results
- commit hash if committed
- push status
- blockers/caveats
- next recommended work order
- explicit skipped candidates and why
- explicit confirmation that app functionality, auth, RBAC, tenant boundaries, migrations, D1 config, secrets/env files, Cloudflare/OAuth/deployment settings, and live data were not changed unless the selected work explicitly and safely required one of those areas
- Ladder Handoff:
  - Targeted Level
  - Advanced
  - Evidence
  - Unlocks
  - Next
  - Blockers
  - Do not repeat
  - First file to inspect next run

## 31. Failure Handling

If repo identity fails:

- stop immediately.

If working tree is dirty with unrelated changes:

- stop, list dirty files, and do not edit.

If validation fails before changes:

- document the pre-existing failure.
- choose a work order that does not make it worse if safe.
- otherwise stop.

If validation fails after changes:

- fix if related and safe.
- otherwise revert only your own changes when possible and safe.
- log a deferred item or blocker.

If selected work turns unsafe:

- do not force it.
- mark deferred.
- choose next safe candidate only if still within scope.
- otherwise update ledger/state and stop.

If route does not exist:

- do not fake the link.
- add a backlog/deferred item.
- create a real route only if bounded, safe, and tested.

If data is missing:

- do not fake the metric.
- use a safe empty state.
- add a backlog/deferred item.

If RBAC is unclear:

- do not broaden access.
- add a test or documentation item first.

## 32. Next-Work-Order Handoff Rules

Every run must leave breadcrumbs:

- current ladder level targeted
- whether that level advanced
- evidence of advancement
- next rung dependency
- next best work order
- blockers
- do-not-repeat notes
- new test/verifier coverage
- first file/function a future run should inspect

Example:

```text
Ladder Handoff:
- Targeted Level: LEVEL_1_NAVIGABLE_DASHBOARDS
- Advanced: yes
- Evidence: Site Dashboard No Mentor card opens mentor assignments filtered by unassigned students.
- Unlocks: review-count dashboard click-throughs.
- Next: add Submitted/Needs Revision review queue filters.
- Do not repeat: No Mentor card already linked as of commit e0171a9.
- First file to inspect next run: workspace.js renderSiteDashboardSection()
```

## Work Order Type Templates

### TYPE A - Language/Product Readiness

Choose when user-facing copy still leaks internal terms, confusing labels, permission jargon, or weak empty states.

Safe first slices:

- replace one label cluster
- improve one permission message
- improve one empty state
- add one language verifier rule

Likely files:

- `workspace.js`
- `workspace.html`
- `app.js`
- `public-companion/app.js`
- `scripts/verify-functionality-language.mjs`
- `tests/workspace-app.test.mjs`

Tests/verifiers:

- functionality language verifier
- workspace render tests
- production-surface checks

Forbidden shortcuts:

- do not hide real security facts
- do not edit internal QA copy as production copy unless linked from production
- do not weaken API errors

### TYPE B - Dashboard Click-Through

Choose when a dashboard card/count can lead to a real existing section or route.

Safe first slices:

- card opens an existing workspace section
- preset filters applied to existing list
- row opens authorized student detail
- no-fake-link verifier

Likely files:

- `workspace.js`
- `tests/workspace-app.test.mjs`
- relevant route tests if query support changes

Tests/verifiers:

- workspace render/handler test
- dashboard link verifier
- API filter test when route behavior changes

Forbidden shortcuts:

- no fake routes
- no unsupported query params
- no student-unsafe destinations

### TYPE C - Student Detail / Drill-Down

Choose when authorized users need to move from a list/dashboard to deeper student context.

Safe first slices:

- add detail action from an authorized list
- expose one existing detail field
- improve detail tab language
- add detail render/access test

Likely files:

- `workspace.js`
- `functions/_lib/site-student-detail.ts`
- `functions/api/site/students/**`
- `tests/site-student-detail.integration.test.mjs`
- `tests/workspace-app.test.mjs`

Tests/verifiers:

- detail integration tests
- role-specific workspace render tests
- privacy/redaction assertions

Forbidden shortcuts:

- no staff-only notes to students
- no cross-student student links
- no URL state without access proof

### TYPE D - Role Workspace

Choose when a role homepage is generic, confusing, or missing useful next steps.

Safe first slices:

- Viewer read-only clarity
- Site Admin/AP/Principal operational header
- Program Teacher workflow affordance
- Mentor assigned-student summary
- Student next-step clarity

Likely files:

- `workspace.js`
- `workspace.css` only when layout clarity requires it
- role dashboard API/tests if data changes

Tests/verifiers:

- workspace role render tests
- route integration tests
- permission tests

Forbidden shortcuts:

- no invented roles
- no UI-only permission expansion
- no marketing landing page

### TYPE E - Mentor Assignment

Choose when coverage workflow, workload, unassigned filters, or assignment safety needs depth.

Safe first slices:

- unassigned filter clarity
- workload view improvement
- safe assignment control already backed by API
- self-assignment prevention test
- assignment history if data already supports it

Likely files:

- `workspace.js`
- `functions/_lib/site-mentor-assignments.ts`
- `tests/site-mentor-assignments.integration.test.mjs`
- `tests/workspace-app.test.mjs`

Tests/verifiers:

- mentor assignment route tests
- permission helper tests
- workspace read-only render tests

Forbidden shortcuts:

- no mentor self-assignment
- no access broadening
- no user/credential creation
- no bulk dangerous controls

### TYPE F - Review/Intervention Queue

Choose when staff need better ways to find submitted, revision, missing, at-risk, no-mentor, or readiness records.

Safe first slices:

- needs-review dashboard filter
- needs-revision dashboard filter
- missing-submission filter if route supports it
- presentation readiness filter
- row-level review affordance

Likely files:

- `workspace.js`
- `functions/api/site/review-queue.ts`
- `functions/api/site/operations-readiness.ts`
- relevant integration tests

Tests/verifiers:

- review queue integration tests
- operations readiness tests
- workspace render tests

Forbidden shortcuts:

- no client-only fake queues
- no viewer mutation controls
- no punitive language when follow-up language works

### TYPE G - Verification/Regression Protection

Choose when repeated errors need automated protection.

Safe first slices:

- language leak verifier
- dashboard link verifier
- route inventory verifier
- RBAC test
- privacy/redaction test
- no fake href test

Likely files:

- `scripts/**`
- `tests/**`
- `package.json`

Tests/verifiers:

- the new verifier itself
- `npm run test`
- `npm run check`

Forbidden shortcuts:

- no brittle exact-prose checks when concept checks are enough
- no verifier that silently ignores production files
- no broad test rewrites unrelated to the issue

### TYPE H - Documentation/Backlog Alignment

Choose only when docs/state are blocking useful automation decisions or a completed implementation needs durable tracking.

Safe first slices:

- update audit completion status
- split a broad backlog item into testable slices
- add acceptance criteria
- add dependencies/blockers
- improve next-run handoff

Likely files:

- `docs/functionality-language-audit.md`
- `docs/functionality-ux-growth-ledger.md`
- `automation/state/functionality-ux-growth-state.json`
- `docs/automation-backlog.md`

Tests/verifiers:

- functionality audit tests
- prompt/state tests
- JSON parse check

Forbidden shortcuts:

- no docs-only churn when a safe app functionality slice is ready
- no deleting historical ledger entries
- no hiding blockers by marking them resolved without evidence

## No Random Walk Rules

- Do not work on isolated low-value copy if higher-priority ladder blockers exist.
- Do not keep cleaning language forever if Level 0 exit criteria are mostly met.
- Do not repeatedly update docs without app functionality unless docs/state are blocking automation.
- Do not start a new area when the previous run clearly handed off a next step.
- Do not select work merely because it is easy.
- Prefer compounding work:
  - route used by future cards
  - verifier used by future runs
  - detail page/action used by staff workflows
  - helper used by multiple dashboards
  - test that protects role boundaries

## Autonomous But Accountable Rules

Do not ask the user for approval for safe bounded improvements. Make the decision, explain it, validate it, and record it.

Stop for:

- auth model changes
- destructive admin actions
- major schema migrations
- privacy-sensitive exports
- production deployment changes
- tenant ownership changes
- anything involving secrets or credentials

Every final report and ledger entry must include:

- decision log summary
- candidate scoring
- selected item reason
- rejected candidate reasons
- risk assessment
- final handoff

## Prompt Quality Guard

When this prompt, growth ladder, growth ledger, or growth state changes, run:

```powershell
npm run verify:functionality-ux-automation
```

Also run broader validation (`npm run test`, `npm run typecheck`, `npm run check`, and `npm run verify:functionality-language`) when practical.
