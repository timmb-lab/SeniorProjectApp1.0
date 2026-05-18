# Senior Capstone Rebuild Gameplan

Date: 2026-05-18

## Executive Verdict

The current repository is a strong public curriculum companion. It is not a foundation for authenticated student records yet. The content is useful and should be preserved, but the application architecture must be rebuilt around identity, server-owned state, database-backed submissions, approvals, dashboards, audit trails, and deployment operations.

The biggest risk is mistaking the current local checklist behavior for real student progress tracking. Today, progress and notes live only in `localStorage`. That means one browser, one device, no staff visibility, no approvals, no accountability, no backups, and no privacy controls. For the hosted end goal, that entire layer must be replaced.

## Current Repo Inventory

- `app.js`: one 3,101-line client-side JavaScript file containing curriculum data, route rendering, navigation, local checklist state, local note state, rubrics, templates, examples, pacing, and page assembly.
- `styles.css`: one 1,714-line stylesheet for the static guide UI.
- `*.html`: thin static shells that load `app.js` and `styles.css`; phase pages are differentiated by `data-page` and `data-phase-id`.
- `templates/*.md`: useful student-facing starter documents and rubrics.
- `teacher-companion/implementation-guide.md`: useful staff-facing planning guidance.
- `assets/app-hero.jpg`: one visual asset.
- No `package.json`, build system, test runner, backend, database schema, authentication layer, deployment config, CI, environment config, or formal data model.

## What Is Worth Keeping

- The student-friendly phase language.
- The phase sequence: purpose, proposal, build, mentor checks, presentation prep, presentation, display, gratitude, portfolio, reflection, wrap-up.
- Rubrics and portfolio expectations.
- Template content.
- Teacher companion guidance.
- The calm student tone and step-based navigation approach.
- Some visual style decisions, as long as the future app becomes more operational for staff dashboards.

## What Is Not Salvageable As Production Infrastructure

- `localStorage` as progress state.
- Client-only rendering as the authority for student workflow.
- Single-file app structure.
- Static HTML page shells as the long-term routing strategy.
- No authentication or authorization.
- No role boundaries.
- No database-backed submissions.
- No audit history.
- No admin tools.
- No export/reporting pathway.
- No test harness.
- No environment separation.
- No deployment/release process.

## Required Programs

The hosted app must support these programs explicitly from the beginning:

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

These cannot remain vague pathway examples. They need first-class database records, editable program requirements, program-specific deadlines, program-specific evidence expectations, and dashboard filters.

## Role Model

Student:
- View assigned program requirements and phase checklist.
- Create drafts.
- Submit required items.
- Upload or link evidence.
- Write reflections.
- See status, comments, deadlines, and revision requests.
- Resubmit after revision.

Mentor:
- See assigned students only.
- Review mentor-meeting prep, evidence, reflections, and presentation readiness.
- Comment on work.
- Request revisions.
- Approve mentor-owned checkpoints if the school workflow grants that permission.

Program teacher:
- See students in assigned program sections.
- Edit program-specific requirement text, evidence expectations, and deadline guidance.
- Review submissions.
- Approve, request revision, or flag concerns.
- Monitor program progress.
- Coordinate with mentors.

Admin:
- Manage users, roles, programs, cohorts, assignments, phase templates, deadlines, rubrics, dashboards, exports, and system settings.
- Perform audited overrides.
- Manage inactive users and school-year rollover.

Misc admin:
- Receive narrow permissions such as exporting reports, updating deadlines, managing templates, or viewing dashboards without broad student-record powers.

## Core Workflows

1. Student onboarding
   - Account created or imported.
   - Student assigned to cohort, program, program teacher, mentor, and graduation year.
   - Student sees only their own requirements and submissions.

2. Program requirements
   - Program teacher or admin defines expectations for each pathway.
   - Students must confirm program rules before proposal submission.
   - Requirements can vary by cohort year.

3. Proposal
   - Student drafts Core Concept Proposal.
   - Student submits.
   - Program teacher reviews for CTE fit and feasibility.
   - Final approver approves or returns revision.

4. Build and check-ins
   - Student submits evidence, check-in reflections, blockers, and progress artifacts.
   - Mentor or teacher comments.
   - Revision and support flags are tracked.

5. Mentor meetings
   - Student prepares notes and questions.
   - Mentor records feedback and next actions.
   - Meeting can be marked complete, missed, or needs follow-up.

6. Presentation preparation and presentation
   - Student submits outline, visuals, logistics, and evidence.
   - Mentor checks readiness.
   - Teacher or assigned reviewer records presentation status.

7. Celebration display
   - Student submits display plan and photos.
   - Program teacher reviews against program expectations.

8. Gratitude, portfolio, and reflection
   - Student submits thank-you evidence, portfolio items, resume/reflection pieces, and final reflection.
   - Teacher/admin approves final completion.

9. Dashboards and reporting
   - Staff see completion status by program, phase, section, mentor, and cohort.
   - Admin can export progress, missing work, overdue work, approvals, and revision loops.

## Submission Status Model

Use explicit statuses rather than loose booleans:

- `not_started`
- `draft`
- `submitted`
- `under_review`
- `revision_requested`
- `approved`
- `blocked`
- `rejected`
- `overridden`
- `archived`

Every status change must store who changed it, when, why, and what changed.

## Data Model Summary

Primary entities:

- User
- Role
- Permission
- Cohort
- Program
- ProgramRequirement
- StudentProfile
- StaffProfile
- MentorAssignment
- Phase
- Milestone
- Requirement
- Submission
- SubmissionVersion
- EvidenceArtifact
- Review
- Comment
- Approval
- Rubric
- RubricCriterion
- Deadline
- Notification
- DashboardSavedView
- ExportJob
- AuditEvent

See `docs/domain-model.md` for the deeper version.

## Security And Privacy Requirements

This app will handle student records. Treat it as sensitive from day one.

- Never store plaintext passwords.
- Prefer district-approved managed identity if available.
- If local usernames/passwords are required, use a hardened password hashing strategy and server-side session handling.
- Enforce authorization on the server for every protected read and write.
- Do not rely on hidden UI controls as security.
- Keep student records scoped by assignment and role.
- Log approvals, overrides, exports, role changes, comments, submission edits, and login/admin events.
- Separate public guide content from private student data.
- Define retention, export, backup, restore, and incident-response expectations before launch.
- Avoid storing sensitive accommodation or personal notes unless there is a clear operational reason and access control.

## Architecture Recommendation

Use a full-stack TypeScript application with:

- Server-rendered or hybrid frontend routes for authenticated dashboards.
- API/server actions for protected mutations.
- Relational database for records, approvals, assignments, submissions, and audit logs.
- ORM or query builder with migrations.
- Managed file storage for uploads, with private access and signed URLs.
- Role-based access control with server-side policies.
- Automated tests for permissions, workflow transitions, and dashboard calculations.
- Deployment pipeline with preview and production environments.

Do not start with a public-only static host if the goal is authenticated records. The static guide can remain as public content, but the product needs a real application server or managed backend.

## Frontend Product Direction

Student UI:
- Mobile-first.
- Shows exactly what is due now.
- Uses plain language.
- Makes submission status obvious.
- Keeps evidence upload/linking simple.
- Avoids dashboard clutter.

Mentor UI:
- Assigned student list.
- Review queue.
- Quick comments.
- Meeting notes.
- Approval and revision controls.

Teacher/admin UI:
- Dense dashboards.
- Filters by program, phase, student, mentor, cohort, status, and overdue state.
- Bulk progress visibility.
- Export and intervention lists.
- Clear audit trail for sensitive actions.

Dashboard direction is captured in `docs/dashboard-ux-direction.md`. Use those references to shape staff-facing work surfaces: sidebar navigation, top search/filter controls, central cards/tables/boards, right-side metrics, status pills, and action-oriented dashboard counts.

## Critical Gaps To Close

P0:
- Choose hosted app stack and data ownership model.
- Define real roles and permissions.
- Create database schema.
- Implement auth.
- Replace `localStorage` progress with server-backed student records.
- Model programs and program-specific requirements.
- Add tests for authorization and status transitions.

P1:
- Student submission flow.
- Mentor review flow.
- Teacher dashboard.
- Admin user/program management.
- Audit log.
- Evidence artifacts and private file handling.
- Deadline/overdue logic.

P2:
- Notifications.
- Exports.
- Advanced reporting.
- School-year rollover.
- Bulk import.
- Rubric scoring.
- Recognition workflows.
- Read-only public guide mode.

## Migration Strategy

1. Freeze current static guide as the content source.
2. Extract phase, rubric, template, pacing, and program content into structured files.
3. Build a new app shell with real routing and authentication.
4. Seed the database with phase and program records.
5. Implement one vertical slice: student proposal submission to teacher approval.
6. Expand slice-by-slice through build, mentor meeting, presentation, display, and portfolio.
7. Add dashboards once the underlying statuses are trustworthy.
8. Pilot with demo data before real student data.
9. Run a limited real cohort pilot.
10. Only then deprecate the static-only guide.

## First Vertical Slice

The first real product slice should be:

Student submits Core Concept Proposal -> program teacher reviews -> revision requested or approved -> dashboard updates -> audit log records every change.

Acceptance criteria:

- Student cannot view another student's proposal.
- Mentor cannot approve unless assigned and permitted.
- Program teacher can see students in their assigned program.
- Admin can see all.
- Status history is visible.
- Comments persist.
- Revisions do not destroy prior versions.
- Dashboard counts update from database state.
- Tests cover unauthorized access and valid transitions.

## Testing Strategy

Minimum test layers:

- Unit tests for status transitions and permission checks.
- Integration tests for submission and approval API routes.
- Database migration checks.
- Dashboard aggregation tests.
- Authenticated route tests.
- Accessibility checks for critical student and staff pages.
- Smoke test for public guide pages.

Current verification baseline:

- `app.js` syntax can be checked with the bundled Node runtime.
- Internal content links can be checked with a small script.
- There are no project-native tests yet.

## Operational Concerns

Before production:

- Decide who owns user provisioning.
- Decide whether students self-register, are imported, or are provisioned by admin.
- Define password reset process.
- Define staff offboarding process.
- Define school-year rollover.
- Define data export rules.
- Define who can see audit logs.
- Define backup frequency and restore test process.
- Define support process for incorrect assignments.
- Define process for changing program requirements mid-year.

## Things To Avoid

- Do not bolt fake login screens onto the static app.
- Do not put student records in browser storage.
- Do not expose submissions as public static JSON.
- Do not create dashboards from untrusted client state.
- Do not let the UI decide authorization.
- Do not start with every possible dashboard before the submission workflow is reliable.
- Do not make program requirements hard-coded forever.
- Do not upload evidence to a public folder.
- Do not skip audit logs for admin overrides.

## Immediate Next Moves

1. Keep this audit as the rebuild anchor.
2. Add structured program seed data.
3. Add a deeper domain model and permission matrix.
4. Pick the application stack.
5. Scaffold the hosted app in a separate app directory or branch.
6. Extract curriculum data from `app.js` into structured modules.
7. Implement the first vertical slice with tests.
