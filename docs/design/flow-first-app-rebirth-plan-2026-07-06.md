# Flow-First App Rebirth Plan

Date: 2026-07-06
Repository: `C:\SeniorProjectApp1.0`
Branch: `main`
Starting SHA: `7b8a51088e09108f16f70f0dbf758e0d74884d95`
Origin/main SHA: `7b8a51088e09108f16f70f0dbf758e0d74884d95`
Ahead/behind at start: `0/0`
Scope boundary: SeniorProjectApp only. `C:\Curriculum` must not be touched.

## Current Diagnosis

The app has already moved away from the oldest all-in-one dashboard model, and the Workspace/Admin Console split is now useful. The latest local screenshot proof still shows the next problem: first-view pages contain too many competing objects before the user reaches the actual job.

Visible symptoms from the 2026-07-06 screenshot set:

- Student Today shows page chrome, access context, a hero strip, a header, current work, next action, progress, and status cards in one early viewport.
- Mentor Today shows a large title, start panel, summary metrics, queue rows, and a scope panel together.
- Program Teacher Today shows the same start panel plus five metrics before the worklist has room to breathe.
- Admin Console is better separated, but some normal pages still carry access, audit, setup, and operations language that belongs in Help, Audit, or Access Review.

The goal is not another copy pass. The goal is to make each role move through a task flow: start, choose a list row, open detail, take one action, move to the next item.

## What Must Move Out Of Normal Product UI

Normal Student, Mentor, Teacher, Viewer, and Admin task screens should not foreground:

- role-proof text,
- fake-pilot proof text,
- raw access rules,
- action maps,
- lane, owner, signal, blocker, or workflow-engine language,
- broad metric walls,
- API language,
- raw JSON,
- allowed-role or capability explanation cards,
- security policy explanations that are not needed to complete the current task.

Those concepts can still exist in Audit, Access Review, Help, proof scripts, tests, and readiness documents.

## Inspiration Patterns

These are conceptual patterns, not pixel-copy targets.

- Linear: queue to issue detail to next action.
- Asana: task lists with one selected work item.
- Stripe Dashboard: operational pages with compact filters and clear primary actions.
- Shopify Admin: setup guide, list, detail, and confirmation loops.
- Retool: focused internal tools with scoped forms and safe actions.
- Notion: simple page hierarchy plus database views.
- Airtable Interfaces: task-specific filtered record interfaces.
- Slack: channel or thread focus instead of showing every conversation.
- Todoist: Today-first work and lightweight completion loops.
- Duolingo: one next step and progress only when it motivates action.
- Gmail: inbox list to message detail to reply/archive.
- Trello: board/list/card drill-down.
- GitHub Issues: issue list to detail to action timeline.
- Apple Settings: drill-down navigation where one screen does one job.
- Google Classroom: classwork/people/grades separation and assignment detail.

## Role Flows

Student:

1. Today: show the current capstone step and one safe next action.
2. My Work: show current work first; older work is secondary.
3. Feedback: show needs-changes first; older feedback is secondary.
4. Final Checklist: show presentation and final-file readiness as a short checklist.
5. Help: route to teacher help guidance without staff/admin terms.

Mentor:

1. Mentor Start: show assigned students needing attention first.
2. Students: search/filter only assigned students.
3. Student Detail: current step, evidence, feedback, meeting context.
4. Review/Check-in: add mentor note or mark meeting context when allowed.
5. Next Student: return to the next assigned row.

Program Teacher:

1. Teacher Start: show review work waiting first.
2. Reviews: work queue with compact filters.
3. Review Detail: one submitted item, one decision area.
4. Student Detail: student context and past feedback.
5. Reports: scoped progress only after urgent work is handled.

Admin:

1. Setup Home: one list of setup issues.
2. Guided Fix: people, students, assignments, programs, or imports.
3. Confirm: success/error result and next setup issue.
4. Reports: scoped health summaries.
5. Audit/Access Review: advanced access and proof details.

Viewer:

1. Allowed Students: read-only student list.
2. Student Detail: read-only status, feedback, presentation, and final-file state.
3. Reports: read-only summaries when allowed.
4. Exit: no mutation controls.

## Screen Map

The app can keep its single-page implementation, but the view states should behave like routes.

- Student: Today, My Work, Feedback, Final Checklist, Help.
- Mentor: Today, Students, Student Detail, Review/Check-in, Reports.
- Program Teacher: Today, Reviews, Review Detail, Student Detail, Reports.
- Viewer: Students, Student Detail, Reports.
- Admin Console: Setup, People, Students, Assignments, Programs, Imports, Reports, Audit.

Each screen should be one of: Start, List, Detail, Form/Wizard, Report, Help/Audit.

## Component Targets

- `FlowShell`: role-aware shell with the left navigation and one focused content area.
- `FlowHeader`: short title, one sentence, one primary action, optional menu.
- `StartHerePanel`: tells the user what to do first.
- `PrimaryAction`: one visible main action per screen.
- `SecondaryActionsMenu`: safe, permission-filtered secondary actions.
- `BackNextBar`: plain back/next path in detail flows.
- `DrillDownList`: rows first, filters compact.
- `DetailHeader`: student/work item identity plus status and read-only badge.
- `DetailTabs`: detail pages only; not first-view dashboards.
- `EmptyState`: calm, useful, and short.
- `DropdownFilterBar`: search plus one or two filters, more filters hidden.
- `CollapsibleDetails`: access/help/audit detail behind a disclosure.
- `ProgressChecklist`: used for student checklist and setup completion.
- `ReviewQueueRow`: one review item with Review as the primary action.
- `StudentRow`: one student with Open Student as the primary action.
- `MobileFlowNav`: keeps the main task visible before secondary controls.

## Stage Plan

Stage 00: document this plan and progress log, then continue with implementation.
Stage 01: refactor staff Today from dashboard wall to focused flow.
Stage 02: add or refine shared flow classes and tests.
Stage 03: tighten Student Today into one current step and one action.
Stage 04: rebuild Mentor around assigned-student start, detail, action, next.
Stage 05: rebuild Program Teacher around review queue, review detail, student detail.
Stage 06: make Viewer read-only list/detail/report flows obvious.
Stage 07: keep Admin setup-first and move access explanations to Audit/Access Review.
Stage 08: remove normal-page control-panel artifacts.
Stage 09: visual pass for lighter borders, more whitespace, and row-led hierarchy.
Stage 10: mobile pass with first task visible early.
Stage 11: accessibility and ESL readability pass.
Stage 12: pilot-readiness and safety gate review.
Stage 13: full role proof and screenshot QA.
Stage 14: final report, no overclaiming.

## Screenshot Plan

Final screenshot proof should include:

- Student Today desktop and phone.
- Student My Work, Feedback, and Final Checklist.
- Mentor Today desktop and phone.
- Mentor Students and Student Detail.
- Program Teacher Today, Reviews, and Review Detail.
- Viewer Students and read-only Student Detail.
- Admin Setup, People, Students, Assignments, Imports, Reports, and Audit.
- Unauthorized student admin deep link.
- Staff View as Student entered and exited.

Every screenshot should be manually reviewed for: one job, one primary action, useful content visible early, safe secondary menus, no forbidden normal-page proof language, and mobile readability.

## Figma Status

The Figma connector is authenticated for Bryan and exposes a view-only `Senior Project App` plan. In this thread the callable Figma tools do not include project or file search/listing, and no node-specific Figma URL was provided with this prompt. Therefore this plan records Figma availability honestly but does not claim project-file inspection for this run.

Prior repo design docs identify an older product UI Figma file and note that it is useful conceptually but not a current token or component source. This run will borrow flow patterns, not copy Figma pixels.

## Risk Register

- A visual-only change can hide an RBAC issue if tests are weakened. Do not weaken tests.
- Moving actions into More menus can accidentally expose forbidden actions. Keep permission filters and server guards.
- Broad term cleanup can damage Audit/Help/proof surfaces where technical language belongs.
- Large CSS changes can improve desktop while harming mobile. Re-check mobile.
- Fake-account proof can be mistaken for real-student readiness. Keep `NO_GO_REAL_STUDENT_PILOT`.
- Hosted proof artifacts may change timestamps and screenshots. Commit only intentional artifacts.
- `workspace.js` is large; keep implementation slices bounded and test-backed.

## 12-Hour Checkpoint Plan

The prompt requests a minimum 12-hour staged program with active work from minute `:00` to `:39` and checkpoint work from `:40` to `:59`.

This document starts the program. If the environment cannot remain active for a full 12 hours, each completed stage must still record:

- time or stage marker,
- current SHA,
- changed files,
- tests run,
- screenshot/proof status,
- finished work,
- remaining work,
- blockers,
- whether it was active work or checkpoint work.

No final report may claim the 12-hour minimum was satisfied unless the wall-clock requirement actually was satisfied.

## Stop Conditions

- Repo is not `C:\SeniorProjectApp1.0`.
- Branch is not `main`.
- Work would touch `C:\Curriculum` or files outside this repo.
- The worktree contains unrelated changes that make the stage unsafe.
- Student can open Staff Workspace, Admin Console, mutation controls, or another student's records.
- Viewer can mutate or see mutation controls.
- Mentor sees unassigned students.
- Program Teacher sees out-of-program students.
- Administration, Site Admin, or Global Admin scope broadens beyond the current implementation.
- Global Admin local-account requirements weaken.
- Unauthorized deep links stop failing safely.
- Real-student pilot readiness would be claimed without manual/policy evidence.
- Screenshots still show a dashboard wall and the stage is not explicitly marked incomplete.
