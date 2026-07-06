# Figma Admin Console Overhaul Plan

Date: 2026-07-06

Repository: `C:\SeniorProjectApp1.0`

Branch: `main`

Starting commit: `4c9acaac6caf70d3b7d8915ef952d825ca8db0a6`

Origin state: `main...origin/main` at `0 ahead / 0 behind`

## Executive Summary

This pass rebuilds the admin side around one question: what setup or operations need fixing first?

The app already has a separated Staff Workspace and Admin Console, route-backed People/Students/Assignments/Programs/Imports/Reports/Audit surfaces, CSV preview, scoped assignment APIs, and fake-account proof. The overhaul should not add a fake second console. It should convert the current admin experience into guided operations: Needs Setup first, one primary action, page-level Actions menus, row More menus, dropdown filters, collapsible details, plain import help, readable reports, readable audit summaries, and mobile-first rows.

The real-student pilot remains **NO-GO**. Fake-account local or hosted proof can support demo confidence only; it cannot approve real student data, real roster import, real credential delivery, or production pilot readiness.

## Figma Access Summary

The Figma connector was available and inspected the product UI file recorded in repo docs:

- File key: `z4t4tFPAKrMDh6pIYOeEw6`
- Top-level page returned on 2026-07-06: `00 Master Plan + Foundations`
- Main node inspected: `2:5`, `Senior Capstone Product Control Center`
- Useful concepts: compact school-operations surface, admin operating view, semantic colors, text plus color for status, permission/data rules, private evidence, role-scoped views, audited changes

Limitations:

- No detailed admin dashboard, people, import wizard, reports, or audit mockups were available in the inspected file.
- No variables or component library were imported for this implementation.
- This pass uses Figma as conceptual guidance only and keeps the repo UI, routes, CSS, and tests as the source of truth.

## Current Diagnosis

Current admin strengths:

- Admin Console is already separated from daily Workspace mode.
- Students cannot use Admin Console when role gating is respected.
- People, Students, Assignments, Imports, Programs, Reports, and Audit already have route-backed data or existing local state.
- CSV preview/import, local Global Admin guardrails, View as Student boundaries, Viewer read-only boundaries, and site/program scope helpers already exist.
- Existing proof scripts already know about the Workspace/Admin Console split and screenshot set.

Current admin gaps:

- Admin pages still mix setup-first rows with older dashboard, proof, action-map, signal, lane, and diagnostic-style language.
- Some pages lack a consistent page-level Actions menu and row More menu pattern.
- Filters exist in several places, but the admin-specific pages need clearer search/dropdown/more-filter affordances.
- Import instructions and report/audit details need to be collapsed by default for non-technical admins.
- Reports should feel like a simple health check, not a BI wall.
- Audit should summarize access review, recent changes, and potential issues without raw payload language.
- Mobile admin first view needs useful rows before secondary explanation.

## Admin User Assumptions

- A Site Admin wants to know which roster, coverage, program, or import issue to fix first.
- A Global Admin may see broader account/security context, but elevated controls must stay local-account guarded and separated from normal school setup.
- Administration users may monitor or perform allowed school setup only within current RBAC.
- Program Teacher, Mentor, Viewer, and Student roles should not see unsafe admin setup/security controls unless the current RBAC already permits a limited version.
- Viewer remains read-only.
- Student never sees Admin Console.

## Target Mental Model

- Overview: what needs setup first?
- People: which staff/user accounts need adding, checking, or fixing?
- Students: which students need roster/profile/setup work?
- Assignments: who needs mentor, viewer, or Program Teacher coverage?
- Programs: which programs need setup or teacher coverage?
- Imports: what template should I download, what CSV should I upload, what errors need fixing?
- Reports: what is the basic health of roster, coverage, imports, and progress?
- Audit: what access, role, or recent-change issue needs review?
- Pilot readiness: what evidence is still missing before real students?

## Text Wireframes

### Admin Overview - Desktop

```text
Admin Console / Overview                         [Fix setup] [Actions]
What setup needs attention?

Needs Setup
Issue row | count | plain reason                 [Fix setup] [Show details]
Issue row | count | plain reason                 [Fix setup] [Show details]
No setup issues found                            (shown only when clean)

Quick Actions
Add student | Add staff | Assign mentor | Import students

Health Summary
Students | Staff | Mentor coverage | Roster completeness | Imports needing review

Recent changes
Compact row | person/record | date               [Open audit if allowed]
```

### Admin Overview - Mobile

```text
Admin Console
Overview                                         [Actions]

Needs Setup
Issue row
[Fix setup] [Show details]

Quick Actions
[Add student] [Import students]

Health Summary collapsed below setup rows
```

### People

```text
People                                           [Add staff] [Actions]
Search staff                                     [Role] [Site] [Program] [Status] [More filters]

Staff row
Name | email when authorized | role | site/program | setup status
[Manage] [More]

Add Staff panel
Name | email | role | site/program/student scope
[Save staff] [Cancel]
Role/scope help collapsed
```

### Students

```text
Students                                         [Add student] [Actions]
Search students                                  [Setup status] [Program] [Cohort] [Grad year] [More filters]

Student row
Name | program/site | cohort | grad year | mentor | viewer | setup status
[Manage] [More]

Add Student panel
Plain fields, plain validation, assignment handoff
```

### Assignments

```text
Assignments                                      [Assign mentor] [Actions]
Missing Coverage
Student/program | missing role | suggested action [Assign] [Show details]

[Mentors] [Viewers] [Program Teachers] [Administration]
[Program] [Cohort] [Coverage type] [Staff role] [More filters]

Assignment picker
Student dropdown | staff dropdown
Invalid targets disabled with reason
```

### Programs

```text
Programs                                         [Manage program] [Actions]
[Site] [Teacher assigned] [Program status]

Program row
Program | site | Program Teacher | student count | setup status
[Manage] [More]

Missing Program Teacher coverage appears as a setup issue.
```

### Imports

```text
Imports                                          [Upload CSV] [Actions]
[Students] [Staff]

Templates
[Download student template] [Download staff template]
[Show CSV help]

Upload CSV
Choose file | Preview | Confirm valid rows

Results
Summary row | row-level errors collapsed
Recent imports empty state when none exist
```

### Reports

```text
Reports                                          [Export report] [Actions]
[Program] [Cohort] [Setup status] [More filters]

Summary strip
Roster completeness | Mentor coverage | Viewer coverage | Program coverage

Simple bars with text labels
[Show details]
Export options hidden/disabled when no authorized rows exist
```

### Audit

```text
Audit                                            [Review access] [Actions]
Summary
Access review | Role assignments | Recent changes | Potential issues

Recent changes
Plain row | affected person/record if authorized | date | action [Show details]

Potential issues
Staff without scope | students without mentor | program without teacher | import errors
Details collapsed; no raw JSON.
```

### Pilot Readiness Panel

```text
Pilot Readiness                                  [View gate]
Fake-account demo: green when proof says so
Real-student pilot: NO-GO until manual evidence exists

Missing evidence
Role-scope proof | roster validation | credential delivery | privacy/support approval | backup/restore
```

## Component Plan

- `AdminPageHeader`: title, subtitle, one primary action, page-level Actions menu.
- `AdminActionMenu`: import, download template, export, view audit, setup checklist, help; unauthorized actions omitted.
- `AdminFilterBar`: search, dropdown filters, More filters disclosure, Reset.
- `AdminNeedsSetupList`: compact issue rows, hides zero-count noise, shows `No setup issues found` when clean.
- `AdminIssueRow`: issue, count, primary Fix/Open action, collapsible details.
- `AdminDataRow`: compact staff/student/program/import/audit row with primary action plus More menu.
- `AdminMoreMenu`: row secondary actions only; forbidden actions omitted.
- `CsvHelpDisclosure`: long CSV help collapsed by default.
- `ImportResultList`: compact summary with row errors expandable.
- `ReportSummaryStrip`: compact summary instead of KPI wall.
- `SimpleAdminChart`: accessible bars with text labels.
- `AuditSummaryList`: plain summary rows, expandable details, no raw payloads.
- `MobileAdminControls`: compact Actions and collapsed filters for phone-width layouts.

## RBAC And Security Risks

- Page/menu visibility is not the security boundary; existing API permissions remain authoritative.
- Do not add direct mutation controls for roles that current RBAC does not already authorize.
- Student cannot see Admin Console or staff-only View as Student.
- Viewer cannot mutate and cannot see account/import/review/edit controls.
- Site Admin remains site-scoped.
- Program Teacher, Mentor, and Administration only see admin-side tools already allowed by the existing permission model.
- Global Admin local-account requirement must remain visible and enforced.
- Assignment pickers must not suggest students as mentor/viewer/staff targets or out-of-scope staff.
- Import/export controls must use only authorized fields and loaded rows.
- Audit cannot expose raw JSON, tokens, storage IDs, or private unauthorized details.

## Acceptance Criteria

- Non-technical admin sees what to fix first.
- Each admin page has one obvious primary action and secondary actions in Actions/More menus.
- Zero-count setup noise is hidden or summarized.
- Filters are dropdown/search-first and do not overpower rows.
- Details, CSV help, report methodology, and audit detail are collapsed by default.
- Mobile admin pages show useful setup/list content early.
- Student and Viewer role boundaries remain intact.
- Fake-account proof is never described as real-student pilot approval.

## Proof Plan

Focused checks:

- `node --test tests/workspace-app.test.mjs`
- `node --test tests/workspace-ui-polish-proof.test.mjs`
- `npm run verify:dashboard-actions`
- `npm run verify:workspace-navigation`
- `npm run verify:workspace-url-state`
- `npm run verify:permission-matrix`
- `npm run verify:mutation-origin`
- `npm run check:workspace-mobile`
- `npm run check:workspace-accessibility`
- `npm run check:workspace-errors`
- `npm run check:pilot-readiness`

Full checks:

- `npm test`
- `npm run typecheck`
- `npm run check`
- `npm run prove:workspace-ui-polish`
- `git diff --check`

Hosted fake-account checks can be rerun only when environment and credentials are available. They must not be used as real-student pilot approval.

## Stage Plan

1. Add this admin overhaul plan.
2. Add shared admin header, action menu, filter, issue-row, More menu, disclosure, report, audit, and mobile classes.
3. Rebuild Overview around setup issues and quick actions.
4. Simplify People around staff setup, filters, and safe actions.
5. Simplify Students around roster setup, filters, setup flags, and safe actions.
6. Strengthen Assignments around missing coverage and scoped pickers.
7. Clarify Programs around setup and Program Teacher coverage.
8. Improve Imports around templates, CSV help, validation, and results.
9. Simplify Reports into scoped health summaries and safe exports.
10. Clarify Audit and Access Review.
11. Strengthen pilot readiness wording without overclaiming.
12. Improve mobile and accessibility proof.
13. Harden menu, filter, role access, and mutation proof.
14. Close with screenshot/proof report and clean pushed `main`.

## Stop Conditions

- Workspace is not `C:\SeniorProjectApp1.0`.
- Branch is not `main`.
- Edits would touch `C:\Curriculum` or files outside this repo.
- A change weakens API RBAC, direct-route protection, Viewer read-only behavior, or student privacy.
- Student can see Admin Console.
- Viewer can mutate.
- Global Admin local-account protections are weakened.
- Fake-account proof is presented as real-student pilot readiness.
- `NO-GO` real-student pilot language is removed without manual/policy evidence.
