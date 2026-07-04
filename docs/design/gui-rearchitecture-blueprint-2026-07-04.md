# GUI Rearchitecture Blueprint

Date: 2026-07-04

Scope: Prompt 0 planning and screen-contract pass for the authenticated Capstone App GUI. This document does not change runtime behavior. It defines the product model, navigation, screen contracts, component plan, RBAC expectations, and proof gates that the next implementation passes must follow.

Starting implementation inspected:

- `workspace.html`
- `workspace.js`
- `workspace.css`
- `functions/_lib/permissions.ts`
- `functions/_lib/effective-access.ts`
- `functions/_lib/site-student-detail.ts`
- `functions/_lib/student-roster-profiles.ts`
- `functions/api/student/dashboard.ts`
- `functions/api/site/dashboard.ts`
- `functions/api/site/students.ts`
- `functions/api/site/students/[studentId].ts`
- `functions/api/site/review-queue.ts`
- `functions/api/site/operations-readiness.ts`
- `functions/api/site/programs.ts`
- `functions/api/site/access-assignments.ts`
- `functions/api/admin/dashboard.ts`
- `functions/api/admin/users/import.ts`
- `functions/api/admin/audit-events.ts`
- `tests/workspace-app.test.mjs`
- `tests/workspace-ui-polish-proof.test.mjs`
- `tests/workspace-browser-smoke.test.mjs`
- `tests/site-aware-permissions.test.mjs`
- `tests/site-students.integration.test.mjs`
- `tests/site-student-detail.integration.test.mjs`
- `tests/site-access-assignments.integration.test.mjs`
- `tests/admin-users-import.integration.test.mjs`
- `tests/admin-dashboard.integration.test.mjs`
- `scripts/prove-workspace-ui-polish.mjs`
- `scripts/prove-local-demo-workspace.mjs`
- `scripts/prove-hosted-fake-pilot-browser.mjs`
- `scripts/check-workspace-mobile-contract.mjs`
- `scripts/check-workspace-accessibility-contract.mjs`
- `scripts/verify-workspace-navigation-integrity.mjs`
- `scripts/verify-dashboard-actions.mjs`
- `docs/sales/workspace-ui-polish-screenshot-index.md`
- `docs/product/demo-role-readiness.md`
- `docs/student-progress-dashboard.md`
- `docs/design/ux-visual-audit-phase-6-5.md`
- `docs/dashboard-ux-direction.md`

## 1. Executive Diagnosis

The current GUI has the right backend instincts and several useful route-backed widgets, but the screen architecture is still organized around proving roles and permissions instead of completing school jobs.

Main problem:

- The first signed-in experience often explains the role before showing the user work.
- Staff and admin surfaces still carry proof, demo, safety, and capability language as normal UI.
- Too many sections render the same combination of hero, metrics, action map cards, disclosure panels, guidance panels, and role profile blocks.
- Repeated data appears in many similarly styled cards instead of compact rows, queues, tables, or tabs.
- The mobile layout is technically protected from overflow, but the experience can still become a long stack of every explanation and every card.
- Student, staff Workspace, and Admin Console mental models are mixed. `availableWorkspaceSections()` and `availableAdminConsoleSections()` currently share many of the same section ids and renderers.
- The most important object, the student and their capstone progress, is present but not central enough. Student detail exists as a drawer with rich tabs, but staff landing screens still compete with role/context scaffolding.

The next five implementation passes must rebuild around user jobs:

- Student: "My Capstone. What do I need to finish next?"
- Staff Workspace: "Which students need attention today?"
- Admin Console: "What setup, access, imports, programs, reports, or audit issues need fixing?"

This is not a color pass. The fix is screen structure, navigation, component boundaries, copy hierarchy, and proof expectations.

## 2. Current Implementation Inventory

| File or component | Role or screen affected | Current anti-pattern | Keep, split, replace, or refactor | Risk |
| --- | --- | --- | --- | --- |
| `workspace.html` | Authenticated workspace entry | Single shell is fine; title still says generic workspace. | Keep. Update script/css version only when runtime changes. | Low |
| `workspace.js` `loadWorkspaceData()` | All authenticated screens | Loads many role payloads into one large client state object. | Keep data loading initially; split render structure first. | High |
| `workspace.js` `renderAppShell()` | App shell, header, rail, mode switch | Shell renders role command strip, role profile guidance, and active screens together. | Refactor into `AppShell`, `StudentShell`, `StaffWorkspaceShell`, `AdminConsoleShell`. | High |
| `workspace.js` `renderWorkspaceModeSwitch()` | Staff/admin mode switch | Students are correctly excluded, but many staff roles see Admin Console even for monitoring surfaces. | Keep gating; simplify visible modes by role contract. | Medium |
| `workspace.js` `availableWorkspaceSections()` | Workspace nav | Current nav is role-shaped and feature-shaped: Overview, Profile, Site Dashboard, Students, Review Queue, Operations, Presentation, Readiness, Account. | Replace with job nav: Student or Staff. Preserve route checks. | High |
| `workspace.js` `availableAdminConsoleSections()` / `adminConsoleSectionsForRoles()` | Admin Console nav | Admin Console reuses many Workspace sections and labels such as Site Overview, Student Monitor, Review / Evidence, Final Files. | Replace labels and grouping with operations nav: Overview, People, Students, Assignments, Programs, Imports, Reports, Audit. | High |
| `workspace.js` `renderWorkspaceRoleCommandStrip()` | Normal landing pages | Large role/context strip includes "Signed in as", "Role and mode", "Safety", confidence/demo markers. | Remove from normal landing screens; replace with compact `RoleBadge` and optional read-only banner. | Medium |
| `workspace.js` `renderRoleProfileSection()` | Overview/Profile | Makes role explanation a primary screen through "Working profile", "What you can see", "What you do here", and "What stays out of this role". | Move to help/profile only; never make it the default landing body. | Medium |
| `workspace.js` `renderScreenGuidance()` | All screens | Long collapsible guide explains terms, click effects, visibility, start checks, and done signals. | Remove from normal product surfaces or move to hidden support/help mode. | Medium |
| `workspace.js` `renderStudentSection()` | Student My Work | Strong data-backed student surface, but one page contains Today, phase path, mission cards, first-use guide, command card, deadlines, checklist, feedback, proof, submissions, and files. | Split into Student Today, My Work, Feedback, Final Checklist. Reuse data and helpers. | High |
| `workspace.js` student helpers | Student dashboards | Some language is good, but "proof" panels and instructional guides are numerous. | Keep proof-as-student-work language where needed; reduce repeated guide blocks. | Medium |
| `workspace.js` `renderSiteStudentDirectorySection()` | Staff Students | Good filters and route-backed rows, but action-map cards plus metrics plus posture cards can crowd the actual roster. | Keep route/filter/data contract; convert landing to attention queues plus compact rows/table. | High |
| `workspace.js` `renderStudentRow()` | Staff Students | Row is semantically a row but styled as `workspace-student-card`; it contains many chips and actions. | Refactor to `StudentRow` with compact desktop table/list and mobile row. | Medium |
| `workspace.js` `renderSiteStudentDetailSurface()` | Staff detail drawer | Rich tabs exist and should be kept; tab labels are too backend-ish for final contract. | Keep and rename tabs to Overview, Work, Feedback, Evidence, Timeline. | High |
| `workspace.js` `renderProgramTeacherDashboardSection()` | Program Teacher | Review-first concept is useful; still wrapped in command-center, metric grid, action map, details disclosure. | Rebuild as Staff Today with review queue first. | Medium |
| `workspace.js` `renderMentorDashboardSection()` | Mentor | Assigned-student support is present; still has dashboard language and extra guide cards. | Rebuild as Staff Today with assigned-student attention queues. | Medium |
| `workspace.js` `renderViewerOverviewSection()` / `renderReadOnlyBanner()` | Viewer | Read-only boundary is clear, but viewer still participates in Staff/Admin mode concepts. | Keep read-only treatment; make Viewer Workspace an inspection queue without Admin Console. | Medium |
| `workspace.js` `renderAdminConsoleOverviewSection()` | Admin Console overview | Starts with "What this role can manage or monitor" and includes safety/demo proof cards. | Replace with operational overview: setup issues, health summary, quick actions. | High |
| `workspace.js` `renderAdminOverviewSection()` | Global/Admin dashboard | Useful metrics and route-backed admin data, but section is named command center and mixes school-wide operations, audit, final files, quick actions. | Reuse metrics/reports; split into Admin Console Overview/Reports/Audit. | High |
| `workspace.js` `renderAdminUsersSection()` and people helpers | People, imports, assignments | Strong current-state and CSV preview pieces exist, but they sit under one People & Access section. | Split into People, Assignments, Imports, Students as top-level Admin Console sections. | High |
| `workspace.js` `renderCsvImportScreen()` | Imports | Good template downloads, preview, row errors, and no invalid-row mutation principle. | Keep; move to dedicated Imports section with student/staff import tabs. | Medium |
| `workspace.js` `renderSiteProgramsSection()` | Programs | Real scoped route and forms exist. | Keep route-backed forms; redesign as Admin Programs management screen. | Medium |
| `workspace.js` `renderAdminAuditSection()` | Audit | Useful redacted audit filters; too much "proof/security checks" explanatory UI. | Keep filters/table/anomaly data; remove proof copy from normal overview. | Medium |
| `workspace.css` | Whole GUI | Many component classes exist; card and action-map patterns dominate. Role colors include red admin emphasis and multiple broad card grids. | Refactor around shared rows, tables, metric strips, shell classes, responsive list patterns. | High |
| `workspace.css` media blocks | Mobile | Guards overflow and collapses grids; mobile still inherits too many sections. | Keep technical guards; redesign mobile IA to show focused tabs and one primary action. | Medium |
| `functions/_lib/permissions.ts` | RBAC | Authoritative rules are broad and nuanced; UI must not replace them. | Keep. Use server checks as truth. | High |
| `functions/_lib/effective-access.ts` | Role labels, canonical roles, local Global Admin | Needed for Global Admin local-account guardrails and role scope. | Keep. Do not weaken. | High |
| `functions/_lib/site-student-detail.ts` | Student detail, timeline, visibility | Rich protected detail model with site selection handling. | Keep. Drive Staff Detail contracts from this payload. | High |
| `functions/api/student/dashboard.ts` | Student data | Good student-scoped payload for progress, next steps, requirements, feedback, evidence. | Keep. Split UI screens around this payload before adding routes. | Medium |
| `functions/api/site/students.ts` | Staff directory | Strong filters: progress, evidence, review, risk, presentation, archive, mentor. | Keep. Derive attention queues from these fields. | Medium |
| `functions/api/admin/users/import.ts` | People/imports | Has role validation, local Global Admin message, status support, assignment summary. | Keep. UI templates must match supported fields only. | High |
| `tests/workspace-app.test.mjs` | Main UI regression suite | Tests currently assert role command strips, Admin Console proof caveats, and old nav language. | Update intentionally during implementation passes. | High |
| `scripts/prove-workspace-ui-polish.mjs` | Screenshot proof | Current screenshot plan maps 23 old surfaces and expected copy. | Reuse proof harness and artifact pattern; update screenshot set to new contracts. | Medium |
| `docs/sales/screenshots/2026-06-30-ui-polish/` | Existing screenshots | Good convention, but current proof story reflects old IA. | Keep convention; add new dated folder only when screenshot set changes. | Low |

## 3. Current Copy Inventory

Normal product surfaces should remove, demote, or hide these phrases unless a test, doc, support guide, or explicit proof artifact requires them.

### Role-proof and capability copy

- "What this role can manage or monitor"
- "Role context"
- "Signed in as"
- "Role and mode"
- "Allowed for your role"
- "Demo and access confidence"
- "Working profile"
- "Role profile"
- "What you can see"
- "What you do here"
- "What stays out of this role"
- "Workspace assignments"
- "Most days, use these in order."
- "Global Admin working profile"
- "Student working profile"
- "Daily workspace is clear. Management lives in Admin Console."
- "Use Workspace for your account, role profile, and immediate work."

### Empty state copy

- "No workspace sections are open for this role yet."
- "No console actions are available for this role yet."
- "No data" style fallbacks should be replaced when found.
- "Showing 0 of 0" is banned for normal UI. The current result summary uses "Showing X of Y"; follow-up passes must ensure zero results become human copy such as "No students match those filters."

### Admin/system copy leaking into student UI

- "Capstone Project Workspace" as the student mental model.
- "Student home" as a kicker should become "Today" or "My Capstone."
- "Proof", "evidence", and "archive" are overloaded. Keep "proof" where it means student project proof; replace storage/debug meanings with "Files", "Links", "Final Checklist", or "Final Files."
- Student Account should stay sign-in only and must not expose Workspace/Admin Console framing.

### Debug, proof, or demo wording

- "Demo proof guard"
- "Use .test training accounts for walkthroughs; live student use still needs district policy sign-off."
- "Audit is for triage and proof"
- "Security checks that are enforced now"
- "proof script", "browser proof", "fake pilot", and "hydrated dashboard" must stay out of normal UI.
- Existing docs and screenshot indexes may retain proof language because they are proof artifacts, not normal product UI.

### Repeated instructional paragraphs

- The Screen Guide stack: "Terms, click effects, visibility, start checks, and done signals."
- First-use guide patterns such as "Use My Work in order", "Use this path before opening forms...", and "Create access only after..." should be replaced with concise screen headers, primary actions, and short inline helper text.
- Long "reason / owner / next action" blocks should be reserved for errors, blocked states, empty states, and high-risk mutations.

## 4. New Product Mental Model

The final GUI is three products inside one authenticated app.

### Student = My Capstone

Students should see a calm, focused capstone work surface.

Routing and nav:

- Default to Student Today.
- Hide Workspace/Admin Console language.
- Top-level nav is Today, My Work, Feedback, Final Checklist.

Components:

- Progress tracker, current action, deadlines, work rows, feedback rows, final checklist.
- No staff dashboard, tenant, program setup, audit, import, or assignment language.

Copy:

- "Do this next", "Continue My Work", "Read Feedback", "Final Checklist".
- Keep "proof" only as student project proof attached to work.

Mobile:

- First viewport shows current action and progress.
- Secondary panels become focused tabs, not a dump of every disclosure.

### Staff Workspace = student case management

Staff Workspace is for mentors, Program Teachers, Viewers, Administration, Site Admins, and Global Admins when they are doing daily student work.

Routing and nav:

- Default to Staff Today.
- Top-level nav is Today, Students, Reviews, Reports.
- Admin setup work moves to Admin Console.

Components:

- Summary metric strip, attention queues, compact student rows, student detail tabs, read-only banners.
- Repeated records must be queues, rows, tables, or list rows.

Copy:

- "Which students need attention today?"
- "Needs Review", "Needs Help", "Missing Setup", "Recently Updated", "On Track".

Mobile:

- Queue tabs first, then compact student rows.
- Student Detail tabs must be reachable and horizontally usable.

### Admin Console = operations

Admin Console is for setup, access, imports, assignments, programs, reports, and audit.

Routing and nav:

- Top-level nav is Overview, People, Students, Assignments, Programs, Imports, Reports, Audit.
- Only authorized roles see it.

Components:

- Setup issue list, quick action grid, management tables, CSV import panels, simple report bars, audit table.

Copy:

- "Needs Setup", "Add Staff", "Add Student", "Import CSV", "Download Template", "Manage Assignments", "Open Audit".

Mobile:

- Admin Overview shows setup issues and quick actions before anything else.
- People/Students/Assignments are searchable lists, not card walls.

## 5. Role-to-Experience Contract

| Role | Default landing | Visible top-level areas | Students visible | Primary job/question | Actions allowed | Actions forbidden | Read-only treatment | View as Student | Admin Console |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Student | Student Today | Student Today, My Work, Feedback, Final Checklist, Account | Self only | What do I need to finish next? | Add proof/link/upload when route allows, send own draft/revision for review, view own feedback/final checklist | Staff dashboards, other students, admin console, imports, assignments, audit, staff notes | Not read-only; self-scoped | Not available | Not available |
| Mentor | Staff Today | Today, Students, Reports, Account | Actively assigned students | Which assigned students need help or a meeting today? | View assigned student detail, record mentor meeting only for active assigned student, open presentation prep where allowed | Review decisions, imports, assignments beyond existing policy, programs, audit, broad student search | Normal staff view; assigned-only copy | Available only for authorized assigned/scoped students | Generally not part of default contract; if kept for monitoring during transition, no mutation controls |
| Program Teacher | Staff Today | Today, Students, Reviews, Reports, Account | Program/cohort scoped students | Which work needs review and which students need support? | Review submitted work, request revision/approve when server allows, view program-scoped students, monitor mentor/presentation blockers | Off-program students, global users/security, site programs unless server allows | Not read-only; scope banner compact | Available for scoped students | Available only for role-scoped operations if product decides; no global tools |
| Viewer | Viewer Workspace | Today, Students, Reports, Account | Assigned students only | What can I inspect and who should I notify? | View assigned student detail and status | All mutations, review decisions, imports, assignments, programs, audit, other students | Persistent `Read-only access` banner and row chips | Not available unless policy explicitly changes | Not available in final normal UI |
| Administration | Staff Today | Today, Students, Reports, Account | Assigned school students | Which school-level student issues need monitoring? | View school students, monitor reports, open read-only detail where server allows | Account/security/program changes unless existing server route allows; review mutations if not server-allowed | "Read-only access" where controls are hidden; avoid "monitoring workspace" essays | Available only if server allows and read-only | Available only if current policy keeps scoped People/Assignments; otherwise Staff Reports only |
| Site Admin | Staff Today | Staff Today, Students, Reviews, Reports, Admin Console, Account | Assigned site students | Which students need attention and what setup is missing? | Manage site people/access, mentor/viewer assignments, programs, imports, presentation and final-file operations where server allows | Cross-site/global changes unless Global Admin, weakening access, unscoped mutation | Normal admin with scope badge | Available for site-scoped students | Yes |
| Global Admin | Admin Console Overview or Staff Today by chosen mode | Staff Workspace plus Admin Console | All students where APIs allow; current site selection for site-scoped routes | What operations/access/audit issue needs fixing? | Global/site operations where server allows; audit/security; site selection | Bypassing local Global Admin guardrails, unscoped mutation without route checks | Normal admin; local-account guardrail visible in Admin Console only | Available for authorized students | Yes |

## 6. Top-Level Navigation Contract

### Student navigation

- Today
- My Work
- Feedback
- Final Checklist

Visible to:

- Student
- Staff in View as Student mode, read-only, with a visible preview banner

Must not be visible to:

- Staff normal Workspace as their primary nav
- Admin Console

### Staff Workspace navigation

- Today
- Students
- Reviews
- Reports

Visible to:

- Mentor: Today, Students, Reports
- Program Teacher: Today, Students, Reviews, Reports
- Viewer: Today, Students, Reports
- Administration: Today, Students, Reports
- Site Admin: Today, Students, Reviews, Reports
- Global Admin: Today, Students, Reviews, Reports

Must not be visible to:

- Student self experience

### Admin Console navigation

- Overview
- People
- Students
- Assignments
- Programs
- Imports
- Reports
- Audit

Visible to:

- Site Admin
- Global Admin
- Any Administration/Program Teacher capability only if existing server policy intentionally grants that section; do not show mutation surfaces just because UI can hide buttons.

Must not be visible to:

- Student
- Viewer
- Mentor in final normal UI

Notes:

- Current `security` remains Account for all roles, but it should be visually separate from product nav or placed under user menu.
- Current Presentation and Final Files move into Student Final Checklist, Staff Reports, Admin Reports, or Admin operations detail depending on role.

## 7. Screen Contracts

| Screen | Page title | User question answered | Primary action | Required sections and data pattern | Empty state text | Forbidden content/copy | Mobile behavior | RBAC/read-only notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Student Today | My Capstone | What do I need to do next? | Continue My Work | Progress tracker, current action, urgent deadline, latest feedback, final checklist status. Use tracker, one action card, compact rows. | "You are caught up for now." or "No work has been assigned yet." | Workspace/Admin Console, role profile, staff metrics, proof/debug wording | Current action and progress above fold; secondary rows below | Self only; View as Student is read-only |
| Student My Work | My Work | What work is assigned and what needs proof or review? | Open selected work item | Phase tabs, work rows, status badges, proof actions, submit controls when allowed. Use rows/grouped list. | "No work has been assigned yet." | Admin, staff, tenant, audit, "Showing 0 of 0" | Phase tabs horizontal scroll; rows stack with action first | Own dashboard route only |
| Student Feedback | Feedback | What did my Program Teacher say and what should I fix? | Open feedback item | Feedback inbox, revision lane, history/timeline, filters. Use list rows and detail drawer/panel. | "No feedback yet." | Staff-only note labels if not student-visible; role-proof copy | Filters as segmented row; latest/actionable feedback first | Student-visible feedback only |
| Student Final Checklist | Final Checklist | Am I ready for presentation, final files, and closeout? | Open Final Checklist | Completion checklist, presentation status, final files status, blockers. Use checklist rows and progress bars. | "Final checklist is not ready yet." | Archive provider internals, admin export details | Checklist rows above fold; technical detail hidden | Student can see own final-file readiness, not admin export controls |
| Mentor Today | Today | Which assigned students need mentor help today? | Open assigned student | Needs Help queue, upcoming/overdue meetings, recent updates, presentation prep. Use attention queue and rows. | "No assigned students need mentor follow-up right now." | Admin Console, broad student search, role essays | Queue tabs above compact rows | Active mentor assignments only; meeting form only where `canRecordMentorMeeting()` allows |
| Program Teacher Today | Today | Which reviews and students need attention today? | Open Review Queue | Needs Review queue, Needs Revision, Missing Proof, Missing Mentor, On Track. Use queues and compact rows. | "No reviews waiting right now." | Capability proofs, setup/security copy | Review queue first; filters collapse to tabs | Program/cohort scope from server; review mutations only where allowed |
| Viewer Workspace | Today | What assigned students can I inspect? | Open Student | Read-only banner, assigned-student rows, escalation hints. Use rows. | "No students are assigned to this viewer yet." | Admin Console, mutation buttons, long role explanations | Read-only banner remains visible; row actions limited | Assigned students only; all mutation controls hidden |
| Administration Workspace | Today | Which school issues need monitoring? | Open Students | School attention summary, student rows, reports handoff. Use metric strip plus queues. | "No school follow-up is visible right now." | Viewer wording, global/security/admin essays | Queues before reports | Respect existing read-only or scoped permissions |
| Site Admin Workspace | Today | Which students need attention before setup work? | Open Students | Site attention queues, review counts, missing setup summary, Admin Console handoff. Use metric strip and queues. | "No student attention items are waiting right now." | People/import forms in Workspace Today | Student queues above Admin Console handoff | Site scope only |
| Global Admin Workspace | Today | What student work needs attention across current scope? | Open Students | Current-site selector, student queues, reports handoff. Use rows/queues. | "No student attention items are waiting in this scope." | Global admin proof/debug landing | Site selector remains reachable; queues first | Site-scoped routes may require site selection |
| Staff Students Directory | Students | Which student am I looking for? | Open Student | Search/filter bar, saved filters, compact rows/table, pagination. Use list/table rows. | "No students match those filters." | Giant action-map card wall, "Showing 0 of 0" | Filters collapse; rows become stacked list items | Scope is role-dependent; Viewer rows read-only |
| Staff Reviews | Reviews | What work needs a decision or follow-up? | Review Next Item | Needs Review queue, revision follow-up, proof status, selected review panel. Use queue rows and detail panel. | "No reviews waiting right now." | Review controls for read-only roles; proof/debug caveats | Queue rows first; detail opens below or drawer | Program Teacher/site/global review mutation only where server allows |
| Staff Reports | Reports | How is my assigned student group doing? | View Report | Simple status distribution, progress bars, missing setup counts, review backlog. | "No report data is available for this scope yet." | Complex BI, raw JSON, debug copy | Bars and count cards in compact grid | Only aggregate/scope-safe data |
| Student Detail Overview | Student Detail | What is this student's current story? | Open Work or Feedback | Summary facts, next action, progress, mentor, latest feedback. Use tabs. | "Student detail is unavailable for this scope." | Raw ids, private storage identifiers | Header collapses; tabs horizontal | Use `/api/site/students/:studentId`; read-only if scope says so |
| Student Detail Work | Work | What work has this student started or sent? | Open Work Row | Requirements/submissions list, phase status, version cues. | "No work records are available for this student." | Student self-only controls unless staff route allows | Rows stack; filters as chips | Staff scoped only |
| Student Detail Feedback | Feedback | What feedback or comments matter? | Open Feedback | Review/comment rows, visibility labels, latest note. | "No feedback records are available for this student." | Staff-only comments outside allowed scopes | Latest note first; visibility chips text based | Visibility from `site-student-detail` policy |
| Student Detail Evidence | Evidence | What proof/files are attached? | Inspect Evidence | Evidence rows with safe actions and counts. | "No evidence uploaded yet." | Drive IDs, storage internals, unsafe links | Compact list with safe actions | Private file details remain hidden |
| Student Detail Timeline | Timeline | What changed over time? | Filter Timeline | Timeline filters, event rows, pagination/load full route. | "No timeline events are available for this student." | Raw audit/debug rows | Filter chips at top | Timeline route enforces scope |
| Admin Console Overview | Overview | What needs setup or fixing? | Open Top Issue | Setup issue list, health metrics, quick actions, recent issues. Use setup issue list and quick action grid. | "No setup issues found." | "What this role can manage", demo proof guard, role essays | Setup issues and quick actions first | Site Admin/Global Admin only by final contract |
| People | People | Who is in this scope and who needs account setup? | Add Staff or Add Student | Staff/student tables, search, current accounts, status. | "No people match those filters." | CSV import docs above people rows, global controls for site roles | Search and primary add action above list | Mutations only where `/api/admin/users/import` and effective access allow |
| Admin Students | Students | Which student roster records need setup? | Add Student | Roster table, missing mentor/viewer/program/cohort flags, open student detail. | "No student setup issues found." | Staff Workspace review queue mixed into admin roster | Table becomes list rows | Site/global admin scope |
| Assignments | Assignments | Which mentor, viewer, Program Teacher, or admin assignments need changes? | Manage Assignments | Current assignment summary first, then forms. Use tables/forms. | "No assignment gaps found." | Auto-assigning unsupported targets, broad access by default | Current-state cards then compact forms | Server-side assignment rules remain authoritative |
| Programs | Programs | Which programs are active for this school? | Add Program | Active programs table, add/remove/restore forms, site selection state. | "No active programs yet." | Program controls for unauthorized roles | Active table first | Site Admin and Global Admin only |
| Imports | Imports | How do I import students or staff safely? | Download Template or Preview CSV | Student import, staff import, templates, expected columns, preview, row errors. | "No imports have run yet." | Unsupported columns in actual templates, invalid row mutation | Template buttons visible above fold | Use supported fields from current implementation |
| Admin Reports | Reports | What is the operational health of this site/global scope? | View Report | Roster completeness, mentor/viewer coverage, program coverage, progress distribution, review status. Use bars/count cards. | "No report data is available for this scope yet." | Complex BI, raw SQL/JSON | Simple bars and tables | Scope-safe aggregates only |
| Audit | Audit | Are access, roles, assignments, and recent changes safe? | Open Audit Filter | Access review, role assignments, recent changes, potential issues. Use filters and table rows. | "No recent changes match this filter." | Raw secrets, raw JSON, proof-script language | Saved filters as chips; table rows stack | Redacted audit only; global/site admin by server policy |

## 8. Component Architecture Plan

| Component/class | Purpose | High-level props/data | Used by |
| --- | --- | --- | --- |
| `AppShell` or `BaseShell` | Shared topbar, account menu, status, site selector, body slot | `user`, `role`, `mode`, `siteContext`, `nav`, `status` | All authenticated modes |
| `StudentShell` | Student-only shell and nav | `studentDashboard`, `activeStudentTab`, `previewState` | Student Today/My Work/Feedback/Final Checklist |
| `StaffWorkspaceShell` | Staff daily workspace shell | `role`, `scope`, `staffNav`, `readOnly`, `siteContext` | Staff Today/Students/Reviews/Reports |
| `AdminConsoleShell` | Operations shell with admin nav | `capabilities`, `adminNav`, `scope`, `setupIssues` | Admin Console |
| `PageHeader` | Short title, subtitle, one primary action | `title`, `question`, `primaryAction`, `badges` | All screens |
| `RoleBadge` | Compact role identity without explanatory body | `roleId`, `label`, `scope` | Shell/topbar |
| `StatusBadge` | Text plus semantic status | `status`, `label`, `tone` | Rows, queues, reports |
| `SummaryMetricStrip` | 3-5 scan metrics | `items[{label,value,detail,status,href/action}]` | Staff Today, Admin Overview, Reports |
| `AttentionQueue` | Prioritized list of student/action rows | `title`, `items`, `emptyText`, `filterAction` | Staff Today, Program Teacher, Mentor |
| `StudentRow` | Compact student record row | `student`, `statusBadges`, `primaryAction`, `readOnly` | Students, queues, admin roster |
| `StaffRow` | Compact staff/person row | `person`, `roles`, `scope`, `actions` | People |
| `AdminRow` / `AdminTable` | Dense management rows/tables | `columns`, `rows`, `actions`, `emptyText` | People, Assignments, Programs, Audit |
| `EmptyState` | Human empty states | `title`, `detail`, `nextAction`, `owner?` | All screens |
| `ProgressTracker` | Student progress and final checklist | `percent`, `steps`, `currentStep`, `blocked` | Student screens, Reports |
| `SimpleReportBar` | Accessible horizontal bar/report | `label`, `value`, `max`, `detail`, `status` | Staff/Admin reports |
| `SearchFilterBar` | Search and bounded filters | `fields`, `values`, `onApply`, `onClear` | Students, People, Audit |
| `DetailTabs` | Stable tabs for detail views | `tabs`, `activeTab`, `onSelect` | Student Detail, Student screens |
| `ReadOnlyBanner` | Persistent read-only boundary | `audience`, `detail`, `allowed`, `forbidden` | Viewer, read-only detail, View as Student |
| `ViewAsStudentBanner` | Preview state and exit action | `studentName`, `source`, `onExit` | Staff preview |
| `QuickActionGrid` | Small set of clear admin actions | `actions[{label,icon?,target,disabledReason}]` | Admin Overview |
| `SetupIssueList` | Admin operational issues | `issues[{type,count,owner,nextAction,target}]` | Admin Overview, Reports |

Implementation note: existing helpers such as `renderMetricTile`, `renderSummaryStrip`, `renderIntentionalEmptyState`, `statusPill`, `renderStudentRows`, `renderStudentDetailTabs`, and CSV/import helpers can be wrapped or renamed rather than rewritten immediately.

## 9. Data and RBAC Plan

Do not change backend authorization rules as part of the screen rebuild. UI visibility is not a substitute for server enforcement.

| Role | Student visibility | Staff visibility | Admin mutation rules | Read-only treatment | Server-side enforcement | Unauthorized deep links |
| --- | --- | --- | --- | --- | --- | --- |
| Student | Self via `/api/student/dashboard`, own submissions/evidence/history | None | Own proof/upload/submit only where routes allow | None | `canAccessStudent`, submission/evidence routes | Show "You do not have access to that student." |
| Mentor | Active assigned students via mentor assignments | None except own context | Record mentor meetings only for active assigned students | Not read-only unless policy says | `canViewMentorDashboard`, `canAccessStudent`, `canRecordMentorMeeting` UI plus route checks | Return to Today/Students |
| Program Teacher | Program/cohort scoped students from `getProgramTeacherScopedStudentIds` | Mentor coverage summaries where allowed | Review decisions only for scoped submissions; scoped people access only where current route allows | Not read-only by default | `canViewReviewQueue`, `canMutateReviewDecision`, `canManageSiteUsers` | Deny off-program student/detail/review |
| Viewer | Assigned students from viewer assignments | None | None | Persistent read-only banner and chips | `getViewerAssignedStudentIds`, `canViewStudentDirectory`, `canAccessStudent` | Deny mutation and off-assignment detail |
| Administration | Assigned school students | School staff visibility only if current route allows | Treat as read-only unless current server route explicitly allows | "Read-only access" for hidden controls | `canViewSiteDashboard`, `canViewStudentDirectory`, route permissions | School-pick or access-denied guidance |
| Site Admin | Assigned site students and staff | Site staff | Site-scoped people, assignments, programs, presentation/final-file operations where routes allow | Normal scoped admin | `canManageSiteUsers`, `canManageSitePrograms`, `canManageMentorAssignments`, route checks | Site selection required if ambiguous |
| Global Admin | All where APIs allow; site selection for site routes | Global/site staff | Global/site admin routes, audit, security, imports within policy | Normal admin; local Global Admin guardrail visible | `isGlobalAdmin`, `loadEffectiveAccess`, local credential checks | Safe denial or site selection |

Fail-safe rules:

- If a section is not available by `availableSectionIds`, route to the nearest allowed landing with a concise denial.
- If a site-scoped route returns selection required, show site choices instead of a generic error.
- If a student detail route returns 403, say "You do not have access to that student." Avoid backend jargon.
- Hide unavailable controls, but still assume the server may deny any mutation.
- Do not expand roles to make a UI layout simpler.

## 10. Attention Queue Derivation Plan

Use existing data only. The first implementation should derive queues from current dashboard, directory, review, operations, and detail payloads. If a signal is unavailable, use honest fallback copy.

### Needs Review

Source candidates:

- `reviewStatus === "needs_review"`
- `latestSubmissionStatus === "submitted"`
- Review queue rows from `/api/site/review-queue`
- Program dashboard `needsReview`

Fallback:

- "No reviews waiting right now."

### Needs Help

Source candidates:

- `progressStatus === "behind"`
- `risk === "high"` or risk flags include high/stale
- `latestSubmissionStatus === "revision_requested"`
- Mentor meeting status missed/make-up required
- Student nextAction text from route payloads

Fallback:

- "No students need help right now."

### Missing Setup

Source candidates:

- No active mentor
- Viewer unassigned where relevant
- Program/cohort missing
- Roster profile missing
- Storage/final-file provider unavailable
- Import row errors or skipped existing rows

Fallback:

- "No setup issues found."

### Recently Updated

Source candidates:

- `lastActivityAt`
- recent activity rows from site/program/admin dashboards
- timeline preview rows

Fallback:

- "No recent updates in this scope yet."

### On Track

Source candidates:

- `progressStatus === "on_track"`
- no active risk flags
- no missing mentor/proof/review blockers
- completion/progress percent where route supplies it

Fallback:

- "No on-track summary is available yet."

## 11. Reporting Plan

Reports should be school-friendly, simple, and accessible. No complex BI.

### Student reports

- Overall progress tracker.
- Phase checklist completion.
- Waiting-for-review count.
- Needs-revision count.
- Final checklist status.

Visuals:

- Progress bar.
- Checklist rows.
- Count chips.

### Staff Workspace reports

- Visible students by status.
- Needs review count.
- Needs help/missing setup count.
- Mentor coverage.
- Program or cohort coverage when scoped.
- Presentation/final-file blockers where allowed.

Visuals:

- Summary metric strip.
- Horizontal bars.
- Compact tables.

### Admin Console reports

- Roster completeness.
- Mentor coverage.
- Viewer coverage where data exists.
- Program coverage.
- Student progress distribution.
- Missing setup issue summary.
- Review status.
- Import/setup issue summary.
- Audit/access review counts.

Visuals:

- Count cards.
- Percent bars.
- Horizontal bars.
- Compact issue tables.

Accessibility:

- Every bar has text value and `aria-label`.
- Never rely on color only.
- Avoid raw internal ids.

## 12. Mobile and Responsive Plan

Global mobile rules:

- Compact header, no giant intro.
- Primary action appears above the fold.
- Navigation becomes focused tabs or a compact menu.
- Rows/tables become stacked row cards with labels.
- Action toolbars wrap without changing layout dimensions.
- Detail tabs horizontal-scroll or segmented controls.
- Metric strips become 2-column or 1-column compact grids.

Student mobile:

- Today shows current action and progress first.
- My Work/Feedback/Final Checklist are separate tabs, not all panels stacked under one page.
- Proof upload/link controls appear only inside the selected work context.

Staff mobile:

- Today shows queue tabs and top queue rows first.
- Students has search/filter first, then compact rows.
- Student Detail opens as a full-width panel with sticky title and usable tabs.
- Reviews puts queue before decision form.

Admin mobile:

- Overview shows setup issues and quick actions first.
- People/Students/Assignments have search and primary action near top.
- Imports keeps Download Template and Preview CSV visible before long helper text.
- Audit filters are chips before table/list rows.
- Avoid a 20-card scroll on first load.

Current technical guards in `workspace.css` should be preserved: 900px and 620px breakpoints, drawer overlay width cap, sticky drawer close control, hidden horizontal overflow, and stacked rows. The next passes must improve product flow, not remove these safety guards.

## 13. Visual Acceptance Criteria

- No landing screen is dominated by role explanation text.
- No normal landing screen has more than four major stacked card sections before the first actionable list, table, or queue.
- Repeated records render as rows, lists, queues, or tables, not giant cards.
- Primary action appears above the fold on mobile.
- Empty states never say "Showing 0 of 0."
- Student UI does not expose Workspace/Admin Console/staff framing.
- Admin Console feels operational and distinct from Workspace.
- Viewer read-only status is obvious without blocking useful inspection.
- Screenshots look like a product, not a proof document.
- Role identity is compact: badge, small header accent, or read-only banner.
- Status colors are paired with text.
- Admin red is reserved for real danger; admin identity should not make every surface feel urgent.
- CSS must avoid one-note palettes and card walls.

## 14. Screenshot Self-Review Gate

Each follow-up implementation pass must generate or update screenshots using the existing proof convention unless the pass explicitly explains why screenshot proof was unavailable.

For each target role/screen, answer:

- Can the target user understand the screen in under 10 seconds?
- Is the screen centered on the user's actual job?
- Is there one obvious primary action?
- Is proof/debug/role-explanation copy still visible?
- Does mobile feel intentionally designed, or just stacked?
- Are repeated records shown as rows/lists instead of card walls?

If any answer fails, continue implementation before commit.

Existing proof convention:

- Local UI polish proof: `npm run prove:workspace-ui-polish`
- Current manifest: `docs/progress/runs/2026-06-30-workspace-ui-polish-browser-proof.json`
- Current screenshot directory: `docs/sales/screenshots/2026-06-30-ui-polish/`
- Existing script: `scripts/prove-workspace-ui-polish.mjs`

Follow-up passes should update this proof harness or create a clearly dated successor directory, not invent an unrelated proof pattern.

## 15. Test and Proof Plan

After all five implementation passes, the repo should include or update tests/proof for:

- Student nav tests: Today, My Work, Feedback, Final Checklist.
- Staff nav tests: Today, Students, Reviews, Reports.
- Admin nav tests: Overview, People, Students, Assignments, Programs, Imports, Reports, Audit.
- RBAC visibility tests for student, mentor, Program Teacher, Viewer, Administration, Site Admin, Global Admin.
- View as Student tests for authorized staff only, read-only banner, URL restore, and denied unauthorized preview.
- Viewer read-only tests for banner, row/detail DOM, and absence of mutation controls.
- Banned copy regression tests for normal role landing pages.
- Empty state tests that reject "Showing 0 of 0."
- Student Detail tab tests for Overview, Work, Feedback, Evidence, Timeline.
- CSV template/import tests for student and staff templates, preview validation, row errors, and no invalid mutation.
- Report/chart accessibility tests for text labels and ARIA values.
- Mobile layout smoke tests for Student, Staff, Admin, Imports, and Student Detail.
- Screenshot proof scripts for every role in the final demo set.

Important current tests to revise deliberately:

- `tests/workspace-app.test.mjs` currently asserts role command strips, role profile copy, Admin Console proof caveats, and old nav labels.
- `scripts/verify-workspace-navigation-integrity.mjs` currently expects old section ids and route-presets. Keep route preset coverage, but update visible nav contracts.
- `scripts/check-workspace-mobile-contract.mjs` should keep overflow/drawer guards while adding new screen classes.
- `tests/workspace-ui-polish-proof.test.mjs` and `scripts/prove-workspace-ui-polish.mjs` must be updated to the new screenshot set.

Suggested final screenshot set:

- Student Today
- Student My Work
- Student Feedback
- Student Final Checklist
- Mentor Today
- Program Teacher Today
- Viewer read-only Students/Workspace
- Administration oversight Workspace
- Site Admin Staff Today
- Staff Students Directory
- Staff Student Detail Overview/Evidence
- Staff Reviews
- Staff Reports
- Site Admin Admin Console Overview
- Global Admin Admin Console Overview
- Admin People
- Admin Students
- Admin Assignments
- Admin Imports with templates
- Admin Programs
- Admin Reports
- Audit
- Mobile Student
- Mobile Staff
- Mobile Admin
- Mobile Imports

## 16. Implementation Sequence

### 1. Information Architecture Reset

Concrete files/screens:

- `workspace.js`: shell, nav, `availableWorkspaceSections`, `availableAdminConsoleSections`, mode switching, role strip/profile placement.
- `workspace.css`: shell/nav/tabs/card wall cleanup.
- `tests/workspace-app.test.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, screenshot proof harness.

Risk:

- High. Tests currently protect old role proof surfaces and route-state assumptions.

Definition of done:

- Three distinct shells exist conceptually or in code: Student, Staff Workspace, Admin Console.
- Students do not see Workspace/Admin Console mode.
- Staff Workspace nav is Today/Students/Reviews/Reports.
- Admin Console nav is Overview/People/Students/Assignments/Programs/Imports/Reports/Audit.

### 2. Student My Capstone Rebuild

Concrete files/screens:

- `workspace.js`: split `renderStudentSection()` and helpers into Student Today/My Work/Feedback/Final Checklist surfaces.
- `workspace.css`: student shell, progress tracker, detail tabs, focused mobile.
- Student tests and screenshot proof.

Risk:

- High. Student proof/upload/submit/history controls are real and must remain route-backed.

Definition of done:

- Student first screen answers "What do I do next?"
- Work, feedback, and final checklist are separate navigable surfaces.
- Staff/admin language is absent.

### 3. Staff Workspace + Student Detail Rebuild

Concrete files/screens:

- `workspace.js`: Program Teacher, Mentor, Viewer, Administration, Site Admin, Global Admin staff Today; Students Directory; Reviews; Reports; Student Detail tabs.
- `functions/api/site/students.ts` and existing dashboard routes only if queue data needs small response additions.
- `workspace.css`: queues, rows, detail tab responsive patterns.
- Staff/RBAC/detail tests and screenshots.

Risk:

- High. Must preserve scoped student visibility and read-only boundaries.

Definition of done:

- Staff landing is attention queues, not role proof.
- Student records are rows/tables.
- Student Detail uses Overview/Work/Feedback/Evidence/Timeline.

### 4. Admin Console Operations Rebuild

Concrete files/screens:

- `workspace.js`: Admin Overview, People, Students, Assignments, Programs, Imports, Reports, Audit.
- Existing import/program/access helpers should be moved or wrapped.
- `workspace.css`: management tables, setup issue list, quick action grid.
- Admin, people, imports, assignments, programs, audit tests and screenshots.

Risk:

- High. People/import/assignment workflows have security implications and current tests are broad.

Definition of done:

- Admin Overview is dominated by setup issues, quick actions, and health summary.
- Imports exposes templates clearly.
- Unauthorized roles cannot see admin mutation controls.

### 5. Visual/Responsive/Reporting/Demo Proof Pass

Concrete files/screens:

- `workspace.css`: shared visual system, status badges, mobile polish, reports bars.
- `workspace.js`: final copy cleanup, report components, empty states.
- `scripts/prove-workspace-ui-polish.mjs`, screenshot index, proof manifest tests.

Risk:

- Medium to high. Broad visual changes can regress mobile and proof selectors.

Definition of done:

- Final screenshots are demo-ready.
- Banned phrases are absent from normal UI.
- Student, Staff, and Admin feel distinct and coherent.
- Full validation stack runs and main is clean/pushed.
