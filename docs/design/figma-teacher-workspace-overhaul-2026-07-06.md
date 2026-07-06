# Figma Teacher Workspace Overhaul

Date: 2026-07-06

Repository: `C:\SeniorProjectApp1.0`

Branch: `main`

Starting commit: `193141c206622435ef30fa6308b792c0001f01fc`

## Executive Summary

This pass keeps the product model intact: students need a simple My Capstone path, teachers need the next student or work item to open, and admins need setup work listed before operational detail. The UI direction is progressive disclosure: one primary action, compact filters, student/work rows first, and advanced detail behind More, Show details, tabs, or disclosures.

The app is not approved for a real-student pilot in this plan. Fake-account browser proof may demonstrate local usability, but the real-student pilot remains NO-GO until the manual policy, privacy, roster, credential, support, and backup evidence exists.

## Starting State

- Repo root confirmed as `C:\SeniorProjectApp1.0`.
- Branch confirmed as `main`.
- `HEAD` and `origin/main` were aligned at `193141c206622435ef30fa6308b792c0001f01fc`.
- Working tree was clean before edits.
- `C:\Curriculum` is out of scope and was not inspected or touched.
- Package scripts include focused workspace proof, mobile/accessibility checks, permission and mutation verifiers, `npm test`, `npm run typecheck`, and `npm run check`.

## Figma Access Summary

Repo artifact metadata identifies the active product UI Figma file as `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`.

Read-only Figma MCP inspection succeeded on 2026-07-06:

- File key: `z4t4tFPAKrMDh6pIYOeEw6`
- File name returned by the API: `Document`
- Editor type: `figma`
- Page count: 7
- Local variable collections: 0
- Local paint styles: 0
- Local text styles: 0
- Main foundation node: `Senior Capstone Product Control Center`
- Prototype page inspected: `05 Full MVP Alpha Prototype`

Useful conceptual patterns from Figma:

- Compact app shell with a left navigation rail and one clear main panel.
- Status pills used sparingly as metadata, not as the main content.
- Review and admin screens organized around rows, headers, and action areas.
- Explicit protected-record boundaries that should stay in implementation docs and admin/audit surfaces, not normal teacher copy.

Limitations:

- No current Figma variables or styles were available to import.
- The inspected prototype is older and still uses product-design language like queue, admin ops, security-first, and protected-record annotations.
- This pass borrows concepts only. It does not copy a design pixel-for-pixel, import licensed assets, or add a runtime Figma dependency.

## Current UI Diagnosis

The 2026-07-05 and 2026-07-06 app is already much calmer than earlier dashboard-heavy versions. Student-facing wording was simplified in the prior commit, and the Staff Workspace/Admin Console split is preserved.

Remaining issues:

- Staff Today still shows five equal summary metrics before the teacher reaches rows.
- Teacher rows still used `Owner:` and `Do next:`, which felt like internal workflow routing instead of teacher guidance.
- Admin Overview used `Setup reasons by lane`, which exposed implementation language in a normal setup screen.
- Staff Reports used `Setup Signals`, which sounded like a monitoring console instead of a work summary.
- Some advanced and legacy surfaces still contain action-map, lane, signal, blocker, and owner vocabulary and should be handled in later bounded passes.

## Screenshot Diagnosis

Screens reviewed from `docs/sales/screenshots/2026-06-30-ui-polish`:

- `03-program-teacher-workspace.png`: good student rows and primary Open Student action, but the first viewport still has many chrome elements and row language showed `Owner:`.
- `40-staff-reviews.png`: strong Start Here panel and filter disclosure, but filters still occupy a large block before rows.
- `32-admin-console-site-admin-overview.png`: setup rows are clear, but the page still read as an operations dashboard and the readiness section title used lane language.
- `44-mobile-staff-students.png`: mobile is readable, but the first viewport is still heavy with header, mode switch, role chips, and school context before the student list.

## Teacher Pain Points

- A teacher should know which student to open first without reading a workflow explanation.
- Staff should not have to decode terms like owner, signal, lane, blocker, or action map.
- Search and filters should help find students, not dominate the page.
- More actions should hide secondary tools without hiding the primary Open or Review action.
- Empty or zero-count categories should collapse into a calm message.

## Non-Technical Teacher Assumptions

- The teacher is busy and will scan headings, counts, names, and buttons.
- The teacher understands Review, Needs changes, Missing work, Open student, and More.
- The teacher may not know the app's data model, permission model, or proof vocabulary.
- The first visible action should be safe and reversible whenever possible.

## ESL And Lower-Reading-Level Assumptions

- Prefer short sentences with common verbs: open, review, fix, add, ask, send.
- Avoid dense noun stacks and system labels.
- Repeat labels consistently across Student, Staff, and Admin screens.
- Put optional explanations behind disclosures so the main path remains short.

## Patterns Borrowed Conceptually

- Sidebar plus focused work surface.
- Compact status metadata after the main title, not before useful work.
- Row-first lists for students and review items.
- Button hierarchy with one obvious primary action.
- Disclosures for detail, help, history, import instructions, and advanced filters.

## Patterns Avoided

- Pixel copying from Figma.
- Runtime Figma dependency.
- Licensed or imported design assets.
- Large tile walls before a list.
- Internal product-design language in normal teacher screens.
- Broad permission or route changes for a visual/copy cleanup pass.

## Visual Direction

- Calm work tool, not a control panel.
- Fewer badges and lighter borders.
- Compact summaries only when they help choose a list.
- Max-width content rhythm on desktop and useful content early on mobile.
- Rows should carry the screen, with secondary actions in More menus.

## Component Plan

- `StartHerePanel`: already present conceptually in Reviews and Students; keep it first and compact.
- `CompactSummaryStrip`: use for nonzero counts and caught-up states, not as a wall of tiles.
- `DropdownFilterBar`: keep Search and the most useful dropdown visible, move the rest into More filters.
- `MoreActionsMenu`: keep Open or Review visible, move View as Student and rare actions behind More.
- `CollapsibleDetails`: use for setup detail, old feedback, import help, report methodology, and audit detail.
- `PlainLanguageStatusBadge`: map technical statuses to Waiting for review, Needs changes, Missing work, Ready to present, Ready to finish, and Not confirmed yet.
- `RowExpansionPanel`: use for old history or secondary context only.

## Screen Wireframes

Teacher Today:

```text
Staff Workspace
Who needs attention today?                  [Open Student] [Admin Console]

Start Here
Review work waiting | Help students | Missing work | Missing setup

Needs Review (count)
Student name | next step | status chips                       [Open Student] [More]
Student name | next step | status chips                       [Open Student] [More]

[Show details for other groups]
```

Students Roster:

```text
Students
Find a student or start with work that needs attention.

Start Here: View all | Review work | Needs changes | Missing work

[Search students] [Status dropdown] [More filters] [Reset]

Student | plain status | next step | last update               [Open Student] [More]
Student | plain status | next step | last update               [Open Student] [More]
```

Reviews Queue:

```text
Reviews
Work waiting for review.

Start Here
Waiting for review | Needs changes | Missing work | Needs help soon

[Search] [Status dropdown] [Program dropdown] [More filters]

Work item row: student, work title, plain status, date          [Review] [More]
Selected item: summary, proof, history, one decision area
```

Student Detail:

```text
Student name                     [Primary action] [More]
Plain status | current step | mentor/teacher coverage | read-only badge when needed

[Overview] [Work] [Feedback] [Evidence] [Timeline]

What this student needs next
Short next step, recent activity, important flags

[Show older feedback] [Show timeline details]
```

Admin Overview:

```text
Admin Console
Operations Overview
What setup needs attention?

Needs Setup
Issue row | count | plain reason                              [Fix setup] [Show details]
Issue row | count | plain reason                              [Fix setup] [Show details]

Quick Actions [Actions menu]
Current scope health
Latest changes
```

Mobile Teacher Today:

```text
Capstone App
[Menu] [Role] [Account]

Staff Workspace
Who needs attention today?
[Open Student]

Start Here
Review work waiting | Help students

Student row
[Open Student] [More]
```

Mobile Admin Overview:

```text
Capstone App
[Menu] [Workspace/Admin segmented control]

Admin Console
What setup needs attention?

Needs Setup
Issue row
[Fix setup]

[Actions] [Show health]
```

## Stage Plan

1. Document current Figma, repo, screenshot, and screen diagnosis.
2. Remove the most visible internal teacher/admin labels from normal first-view surfaces.
3. Continue with bounded passes for Student Detail, Admin Console sections, Staff Reports, and advanced operations language.
4. Refresh focused tests and proof expectations after each UI pass.
5. Run mobile, accessibility, permission, mutation, and screenshot proof before final closeout.

## Tests And Proof Plan

- `node --test tests/workspace-app.test.mjs`
- `node --test tests/workspace-ui-polish-proof.test.mjs`
- `npm run verify:functionality-language`
- `npm run verify:dashboard-actions`
- `npm run verify:workspace-navigation`
- `npm run verify:workspace-url-state`
- `npm run verify:permission-matrix`
- `npm run verify:mutation-origin`
- `npm run check:workspace-mobile`
- `npm run check:workspace-accessibility`
- `npm run prove:workspace-ui-polish`
- `npm test`
- `npm run typecheck`
- `npm run check`
- `npm run check:pilot-readiness`
- `git diff --check`

Hosted fake-account proof should only be rerun when environment and credentials are available and the resulting artifacts are intentionally part of the stage. It must not be described as real-student approval.

## Risk Register

- UI copy changes can break proof scripts that assert old wording.
- Broad banned-term sweeps can accidentally touch docs, tests, audit surfaces, or route internals where technical wording is valid.
- Menus can hide forbidden actions visually but must not become the only access guard.
- Mobile fixes can regress desktop density if spacing is changed too broadly.
- Real-student pilot language must stay NO-GO until manual/policy evidence exists.

## Stop Conditions

- Repo is not `C:\SeniorProjectApp1.0`.
- Branch is not `main`.
- The worktree has unrelated changes that make the stage unsafe.
- Any edit would touch `C:\Curriculum`.
- Student can see Staff Workspace, Admin Console, or another student's data.
- Viewer can mutate.
- Mentor sees unassigned students.
- Program Teacher sees off-program or off-scope students.
- View as Student becomes visible to students, off-scope, or mutable.
- Global Admin local-account requirements weaken.
- A fake-account proof is presented as real-student pilot readiness.
- Mobile first view hides the main task behind chrome, badges, or summary blocks.
