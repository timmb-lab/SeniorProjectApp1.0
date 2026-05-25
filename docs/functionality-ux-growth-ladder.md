# Functionality UX Growth Ladder

This ladder is the long-term product-growth model for `automation/prompts/functionality-ux-upgrade-hourly.md`. The hourly automation should use it to improve the Capstone Project app in compounding layers instead of drifting through unrelated one-off fixes.

The ladder is not a rigid waterfall. A run may choose a higher-level slice when the lower level is already healthy or when the higher-level slice is clearly safer and more valuable. The automation should still explain the selected level, the rejected alternatives, and what the chosen work unlocks next.

## Operating Principles

- Improve real app behavior, role-based usability, dashboard depth, user-facing language, or validation.
- Preserve auth, RBAC, tenant isolation, site isolation, program/cohort scope, mentor assigned-student scope, and student privacy.
- Use existing real routes, real persisted data, and real UI surfaces.
- Do not create fake links, fake metrics, mock pages, placeholder workflows, or dead buttons.
- Leave durable evidence: tests/verifiers, ledger entry, JSON state update, and a commit when validation passes.
- Prefer work that compounds: one dashboard action feeding one existing filtered list is more valuable than a broad cosmetic rewrite.

## Level 0 - Prototype Cleanup

### Purpose

Remove developer, prototype, prompt, mock, test, fixture, internal infrastructure, tenant/RBAC/schema, and implementation-maturity language from normal user-facing surfaces.

### Role Impact

All authenticated users benefit because the app reads like a school workspace instead of a build artifact. Students, viewers, teachers, mentors, and site staff need clear language without internal technical vocabulary.

### Example Work Orders

- Clean workspace header/product posture language.
- Clean public app-preview implementation wording.
- Replace `Permission denied` with user-safe access messaging.
- Replace tenant/RBAC/schema language with school/program/student language.
- Add or harden language leak verifiers.
- Split load failure messages from no-data empty states.

### Exit Criteria

- Protected app surfaces have no obvious developer/prototype/internal language.
- Public surfaces either have clean copy or explicit review-only notices.
- `npm run verify:functionality-language` exists and passes.
- Tests cover the most important student/staff language paths.

### Safe Automation Slices

- Replace one cluster of user-facing labels in `workspace.js`.
- Add one verifier rule for a confirmed protected-surface leak.
- Update one focused render test for a role-specific language state.
- Clean one public copy cluster and rebuild generated output when the source flow is confirmed.

### Do-Not-Automate Warnings

- Do not sanitize API status codes or weaken 401/403/404 behavior.
- Do not hide security/privacy facts from admins when they are needed.
- Do not clean internal QA pages as if they were production surfaces unless production navigation exposes them.

### Suggested Tests/Verifiers

- `npm run verify:functionality-language`
- `tests/workspace-app.test.mjs`
- `tests/functionality-language-audit.test.mjs`
- Production surface copy checks when public files change.

## Level 1 - Navigable Dashboards

### Purpose

Make dashboard cards, counts, and status summaries traceable to real filtered records or visibly summary-only when no route exists.

### Role Impact

Site Admins, Administration/AP/Principal users, Viewer/read-only staff, Program Teachers, and Mentors can move from "what is happening?" to "which records need attention?" without hunting.

### Example Work Orders

- Site Dashboard `No Mentor` opens Mentor Assignments filtered to unassigned students.
- `Submitted` and `Needs Revision` open Review Queue filters.
- Presentation/archive cards open Operations filters.
- Program rows open Student Directory filtered by program.
- Top-risk rows open authorized student detail.
- Add a dashboard link verifier for known route/action targets.

### Exit Criteria

- Important dashboard cards have valid route-backed actions or clear non-clickable language.
- No `href="#"`, empty links, or dead buttons.
- Dashboard click-through behavior preserves role and scope boundaries.
- A verifier or render test guards the highest-value links.

### Safe Automation Slices

- Add one filtered dashboard action to an existing section.
- Add one row-level `View student detail` action where the route already authorizes it.
- Add one source/test verifier that prevents fake dashboard links.
- Add one clear summary-only state for a non-clickable card.

### Do-Not-Automate Warnings

- Do not create links to routes that do not exist.
- Do not invent filters unsupported by the API.
- Do not expose a staff-only destination to students or mentors.
- Do not make a metric clickable only because it looks like it should be.

### Suggested Tests/Verifiers

- `tests/workspace-app.test.mjs` render and handler tests.
- A dashboard-action verifier for `data-section` and preset filters.
- API tests for filtered routes when query behavior changes.

## Level 2 - Student Detail Depth

### Purpose

Authorized staff can open useful student detail from dashboards and lists, with enough context to understand progress, submissions, evidence, mentor assignment, review status, risks, and next action.

### Role Impact

Site staff, viewers, program teachers, and mentors get faster support workflows. Students remain protected from seeing other students and staff-only notes.

### Example Work Orders

- Add `View student detail` to Top Risk rows.
- Add detail actions to program teacher student rows.
- Improve detail tabs for progress, reviews, evidence, mentor assignment, archive, or timeline.
- Add role-safe labels for staff-only and student-visible notes.
- Add URL state for selected detail only if privacy and reload behavior are clear.

### Exit Criteria

- Staff roles can drill into student detail from core lists.
- Mentors only see assigned students.
- Students only see their own records.
- Tests prove access boundaries and staff-only redaction.

### Safe Automation Slices

- Add one detail action from one existing authorized list.
- Improve one detail tab label or empty state.
- Add one test for role-specific detail rendering.
- Add one timeline/detail field already returned by an API.

### Do-Not-Automate Warnings

- Do not expose staff-only comments to students.
- Do not add cross-student links to student routes.
- Do not add bookmark/share state without confirming it cannot bypass authorization.

### Suggested Tests/Verifiers

- `tests/site-student-detail.integration.test.mjs`
- `tests/workspace-app.test.mjs`
- Role matrix tests for student, mentor, viewer, teacher, and admin scopes.

## Level 3 - Mentor Assignment Workflow

### Purpose

Authorized staff can see, assign, reassign, remove, and audit mentor coverage safely, while mentors cannot expand their own access.

### Role Impact

Site Admins and school operations staff can close coverage gaps. Viewers and Program Teachers can inspect coverage when policy allows. Mentors see assigned-student context without self-assignment power.

### Example Work Orders

- Improve unassigned-student filtering.
- Add mentor workload visibility.
- Add assignment/reassignment/remove controls only where APIs and permissions support them.
- Add assignment audit/history to student detail.
- Add self-assignment and cross-site denial tests.

### Exit Criteria

- Safe assignment flow exists for authorized site operations roles.
- Mentor workload is visible enough to avoid overload.
- Mentors cannot assign themselves, broaden access, or view unassigned students.
- RBAC tests cover view and mutation behavior.

### Safe Automation Slices

- Add one workload signal already returned by the API.
- Add one assignment permission regression test.
- Improve one empty state for no mentors/no students.
- Add assignment history if the persisted records already support it.

### Do-Not-Automate Warnings

- Do not let mentors assign students to themselves.
- Do not broaden Program Teacher mutation rights without explicit product/security decision and tests.
- Do not create users, credentials, site memberships, or role assignments as part of mentor assignment UI.
- Do not add dangerous bulk assignment controls.

### Suggested Tests/Verifiers

- `tests/site-mentor-assignments.integration.test.mjs`
- `tests/admin-mentor-assignments.integration.test.mjs`
- `tests/workspace-app.test.mjs`
- Permission helper tests.

## Level 4 - Role-Specific Workspaces

### Purpose

Each role lands on a useful workspace with clear boundaries and next steps, not a generic dashboard that makes users infer their job.

### Role Impact

Site Admins, Administration/AP/Principal users, Viewers, Program Teachers, Mentors, and Students each get a home that matches their responsibility and permission level.

### Example Work Orders

- Viewer read-only home language and action clarity.
- Administration/AP/Principal operational read-only snapshot.
- Program Teacher review workspace improvements.
- Mentor assigned-student workspace improvements.
- Student progress dashboard next-step clarity.

### Exit Criteria

- Every role lands on a useful first screen.
- Read-only roles are visibly read-only.
- Mutation controls are hidden unless allowed.
- Empty states explain what to do next.

### Safe Automation Slices

- Improve one role-specific homepage copy cluster.
- Add one real row/action to a role dashboard from existing API data.
- Add one role-specific empty state test.
- Clarify one read-only banner without changing API policy.

### Do-Not-Automate Warnings

- Do not invent new roles without a product/security decision.
- Do not make Viewer or Program Teacher mutation-capable by UI-only change.
- Do not reuse admin language for student or mentor workspaces.

### Suggested Tests/Verifiers

- `tests/workspace-app.test.mjs`
- Role dashboard integration tests.
- Permission helper tests.

## Level 5 - Review and Intervention Queues

### Purpose

Staff can answer "who needs help now?" through route-backed, filtered queues instead of scanning dashboards manually.

### Role Impact

Program Teachers, Site Admins, Viewers, and Administration/AP/Principal users can find needs-review, needs-revision, missing-submission, at-risk, no-mentor, and presentation-readiness records.

### Example Work Orders

- Dashboard review counts open Review Queue status filters.
- Add or improve missing-submission queue.
- Add at-risk filter/sort if data already exists.
- Add presentation readiness queue filters.
- Improve row-level review affordances and empty states.

### Exit Criteria

- Staff can find actionable records by status/risk/readiness.
- Queues are role-safe and route-backed.
- Viewer sees observation/escalation language, not mutation language.
- Tests cover filter behavior and role visibility.

### Safe Automation Slices

- Wire one dashboard metric to one existing queue filter.
- Add one filter option already supported by the route.
- Improve one queue empty state.
- Add one focused filter/render test.

### Do-Not-Automate Warnings

- Do not fake a queue with client-only sample data.
- Do not add mutation controls to read-only roles.
- Do not create intervention labels that feel punitive when follow-up language is clearer.

### Suggested Tests/Verifiers

- `tests/site-review-queue.integration.test.mjs`
- `tests/site-operations-readiness.integration.test.mjs`
- `tests/workspace-app.test.mjs`

## Level 6 - Student Progress Drill-Down

### Purpose

The student dashboard becomes explorable, with student-safe detail for requirements, phases, feedback, due dates, evidence, and support.

### Role Impact

Students get clear next steps and can understand their own progress without staff mediation. Staff benefit from fewer "what do I do next?" questions.

### Example Work Orders

- Student-safe requirement detail.
- Phase-specific progress panels.
- Student-visible feedback drill-down after comment visibility is clear.
- Due-date timeline from framework data.
- Mentor/support workflow that does not expose unsafe contact info.

### Exit Criteria

- Students can click from summary to real detail.
- No fake routes or placeholder pages.
- Student sees only self-safe data.
- Empty states are friendly, clear, and useful for ELL/IEP students.

### Safe Automation Slices

- Add one in-page anchor to an existing form or section.
- Add one detail panel backed by `/api/student/dashboard`.
- Add one due-date field when the API already returns it.
- Add one student render test for safe next-step language.

### Do-Not-Automate Warnings

- Do not expose other students, staff-only notes, or unsafe contact data.
- Do not add fake student pages.
- Do not claim due dates when data is unavailable.

### Suggested Tests/Verifiers

- `tests/student-dashboard-access.integration.test.mjs`
- `tests/workspace-app.test.mjs`
- Language verifier for student-safe copy.

## Level 7 - Auditability and Trust

### Purpose

Important changes and protected-record reads are traceable, redacted, and explainable.

### Role Impact

Admins and school operations staff can trust the system. Students and families are protected by explicit boundaries.

### Example Work Orders

- Mentor assignment history.
- Review state history.
- Updated by / updated at labels.
- Role-safe activity log.
- Tests around tenant/site/program/student access.
- Admin-safe operational docs.

### Exit Criteria

- Key workflows have traceability.
- Audit metadata is safe and redacted.
- Tests protect privacy and RBAC.
- UI language explains traceability without feeling surveillant.

### Safe Automation Slices

- Render one existing history field.
- Add one audit-event assertion.
- Improve one protected-access explanation.
- Add one redaction regression test.

### Do-Not-Automate Warnings

- Do not expose raw storage IDs, token values, password/setup credentials, or secret-bearing metadata.
- Do not make audit logs broadly visible without permission tests.
- Do not add surveillance-heavy language to normal student/staff UI.

### Suggested Tests/Verifiers

- Route integration tests for audit events.
- Production surface secret/storage scans.
- Permission helper tests.

## Level 8 - Reporting and Operational Readiness

### Purpose

School staff can monitor progress, readiness, mentor coverage, presentation status, and archive/export status without developer help.

### Role Impact

Administration/AP/Principal users, Site Admins, Program Teachers, Mentors, and Viewers can understand operational state and decide what to do next.

### Example Work Orders

- AP/Principal progress snapshots.
- Program teacher intervention reports.
- Mentor workload reports.
- Presentation readiness report.
- Safe export/print only when policy and data support it.
- Audit-safe summaries.

### Exit Criteria

- Staff can monitor and act from the app.
- Reports respect role and privacy boundaries.
- Export/print claims are truthful.
- Operational docs match app behavior.

### Safe Automation Slices

- Add one read-only summary from existing route data.
- Add one report filter.
- Add one export/readiness empty state.
- Add one validation for report redaction.

### Do-Not-Automate Warnings

- Do not add privacy-sensitive exports without policy clarity and tests.
- Do not claim FERPA certification or pilot readiness.
- Do not run remote deploys, seeds, migrations, or resets from this lane.

### Suggested Tests/Verifiers

- `tests/site-operations-readiness.integration.test.mjs`
- `tests/archive-readiness.integration.test.mjs`
- `tests/workspace-app.test.mjs`
- Production-surface checks.

## Level 9 - Autonomous Quality Improvement

### Purpose

The automation improves the app continuously without repeating itself, drifting into random work, or losing evidence.

### Role Impact

All users benefit because the automation compounds product quality over weeks and leaves understandable handoffs for future runs.

### Example Work Orders

- Candidate scoring and selection discipline.
- Stale item detection.
- Dashboard link verifier.
- Language leak scanning.
- Route/action verifier.
- Growth ledger and JSON state updates.
- Do-not-repeat enforcement.

### Exit Criteria

- Automation decisions are traceable.
- Every run records what changed, what passed, what failed, and what should happen next.
- Repeated low-value work is avoided.
- Validation coverage grows over time.

### Safe Automation Slices

- Add one verifier for a repeated mistake.
- Improve prompt/state/ledger rules when recent evidence justifies it.
- Add one ledger/state consistency test.
- Split a broad backlog item into actionable next slices.

### Do-Not-Automate Warnings

- Do not churn docs instead of app functionality unless docs/state are blocking useful automation.
- Do not add brittle tests that only check exact prose.
- Do not create new scheduler rows or change cadence without explicit user instruction.

### Suggested Tests/Verifiers

- `tests/functionality-language-audit.test.mjs`
- `tests/functionality-ux-automation-prompt.test.mjs`
- `npm run verify:functionality-ux-automation`
- `npm run verify:functionality-ux-automation`

## Ladder Advancement Guidance

Hourly runs should usually choose the earliest level whose exit criteria are not met and whose next slice is safe, useful, and testable. A run may temporarily target a later level when:

- the previous ledger handoff points there,
- the lower-level remaining items are blocked,
- a verifier or route already unlocks a higher-impact slice,
- or a user-facing regression needs immediate attention.

The automation should not remain in Level 0 forever. Once protected app language is mostly clean and verifiers exist, it should move toward Levels 1 through 5, where dashboard navigation and staff workflows produce stronger compounding value.
