# Senior Capstone Master Plan

Date: 2026-05-18

This is the top-level product plan for the Senior Capstone rebuild. Every automation lane must read this before choosing work. If a run cannot explain how its slice advances this plan, it should pick a different slice.

## Product Destination

Build a hosted Senior Capstone application for students, mentors, program teachers, administrators, and miscellaneous support/admin users.

The app must support:

- Secure user accounts with managed auth or hardened username/password login.
- Role-based permissions for student, mentor, program teacher, admin, and misc admin users.
- Private upload/evidence spaces for student documents, links, images, reflections, rubrics, presentation materials, and archive exports.
- Student submissions, revisions, comments, resubmissions, approvals, and phase progress.
- Mentor and program teacher review flows with revision requests and approvals.
- Admin controls for users, programs, cohorts, assignments, deadlines, templates, exports, and audited overrides.
- Dashboards for students, mentors, program teachers, and admins.
- Audit logs for sensitive actions.
- Privacy-conscious handling of student records, uploads, exports, staff notes, and access control.

This project is not finished when it looks good. It is finished when the hosted app can safely manage real student workflow and staff visibility.

## North Star Workflow

The app should move the school away from scattered linked documents, manual email chasing, private spreadsheets, and unclear project status.

Students should always know:

- What phase they are in.
- What is due next.
- What evidence they need to submit.
- What has been approved.
- What needs revision.
- Who can help them improve the project.

Staff should always know:

- Which students are on track.
- Which students are stuck.
- Which projects are too vague, too small, or not CTE-aligned yet.
- Which submissions need review.
- Which mentor meetings, presentations, celebration items, reflections, and archive exports are incomplete.
- Where to intervene before work becomes weak or rushed.

The app should make compliance and visibility easier so staff time can shift toward coaching students into better projects.

## Required Programs

The app must explicitly support:

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

Program requirements must become first-class records, filters, dashboard dimensions, and student-facing expectations.

## Required Roles

Student:
- Own workspace, own submissions, own evidence, own comments visible to student, own dashboard, own archive/export.

Mentor:
- Assigned student visibility, mentor-meeting support, comments, mentor-scoped review or approval if configured.

Program teacher:
- Program/cohort student visibility, proposal/research review, program-specific requirement guidance, teacher-scoped approvals, progress dashboards.

Admin:
- User/program/cohort/assignment/deadline/template/export management, audited overrides, all-program dashboards, audit access.

Misc admin:
- Narrow explicit permissions only, such as reporting, deadline help, export support, or read-only dashboard views.

## Source Framework

The source PDFs and extracted framework are product requirements, not reference clutter:

- `data/capstone-framework.json`
- `docs/curriculum-framework-integration.md`
- `docs/source-materials/research-proposal-challenge.txt`
- `docs/source-materials/senior-project-cycle-linked-document.txt`
- `docs/source-materials/senior-guide.txt`
- `docs/source-materials/mentor-teacher-guide.txt`

Old instructions to copy, link, email, or save documents should become app-native submissions, evidence artifacts, review gates, dashboard signals, and archive/export workflows.

## First Real Vertical Slice

The first production slice is:

Student proposal/research submission -> private evidence upload/link -> program teacher review -> revision request or approval -> status history -> audit event -> dashboard aggregate.

Acceptance criteria:

- Student can only access their own records.
- Mentor can only access assigned students unless explicitly scoped otherwise.
- Program teacher can access assigned program/cohort students.
- Admin can access all operational records.
- Misc admin has no broad default access.
- Submissions persist in server/database-backed state.
- Evidence artifacts are private or access-controlled.
- Revisions preserve prior versions.
- Comments and review decisions persist.
- Status transitions are auditable.
- Dashboard counts derive from trusted server/database-style state.
- Tests cover permissions, protected evidence access, valid transitions, and unauthorized access.

## Milestone Path

Use `docs/automation-milestones.md` for the detailed milestone checklist. The strategic order is:

1. Operating base and shared memory.
2. Architecture and scaffold.
3. Domain, auth, permissions, uploads, and audit foundations.
4. First proposal/research vertical slice.
5. Remaining source-cycle workflows: mentor meetings, presentation, celebration, reflections, archive/export.
6. Role dashboards.
7. Visual system and collateral.
8. Production hardening and pilot readiness.

Earlier incomplete milestones beat later polish unless a P0/P1 risk says otherwise.

## Stack Decision Priority

The next major rebuild decision is the production stack:

- App framework.
- Auth provider.
- Database.
- Private upload/file storage.
- ORM/migrations.
- Deployment host.
- Environment/secrets strategy.
- Test runner and CI.
- Backup/export posture.

No automation should pretend the app is functional until this foundation exists in the repo and is tested.

## Lane Responsibilities

Figma:
- Functional app screens, app shell, dashboards, components, responsive states, accessibility, permission-aware UI states, upload/evidence states, developer-ready specs.

Core rebuild:
- Architecture, scaffold, auth, authorization, database/schema, private upload/evidence storage, workflow logic, dashboard aggregates, tests, CI/deployment readiness.

Audit:
- Quality gate, backlog hygiene, privacy/security critique, source-framework coverage, app-readiness findings, acceptance criteria, repeated-work detection.

Canva:
- Supporting visuals only: program identity, phase/process visuals, empty states, onboarding, recognition, export/print collateral. Canva does not define functional app layout.

Daily report:
- Executive memory, last-24-hour summary, log health, stale handoffs, decisions, blockers, and next priorities.

## Master Source Order

When materials conflict, use this order:

1. Current repository code/data and source PDFs/framework.
2. This master plan.
3. Accepted decisions in `docs/progress/decision-log.md`.
4. P0/P1 backlog items in `docs/automation-backlog.md`.
5. Open handoffs in `docs/progress/handoffs.md`.
6. `docs/automation-memory.md`.
7. Lane logs and `docs/progress/run-log.md`.
8. Older rollups in `docs/automation-progress.md`.

If the master plan is wrong or stale, update it with evidence and log the decision.

## Logging Requirements

Every productive automation run must reference:

- This master plan.
- `docs/automation-self-improvement.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- Its lane log.
- `docs/automation-backlog.md`

Each run must log:

- Which master-plan section justified the slice.
- Which log/backlog/handoff/decision was referenced.
- What changed.
- What was verified.
- What remains blocked.
- What the next lane should do.
- Whether self-improvement was unnecessary or what narrow prompt/config improvement was made with evidence.

## Anti-Drift Rules

Do not:

- Build fake login screens and call that auth.
- Store student records in `localStorage`.
- Build dashboards from client-only state.
- Treat Figma, Canva, or docs as the product.
- Put private evidence in public static assets.
- Skip audit logs for approvals, overrides, exports, role changes, or sensitive access.
- Prioritize decorative visuals before workflow, permission, upload, and review foundations.
- Repeat the same broad audit or design slice without closing a handoff/backlog item.
- Create new plans when the next milestone needs implementation.
- Edit automation prompts/configs without evidence, logs, and preservation of cadence/workspace/model/status unless Bryan explicitly asked.

## Weekly Human Check-In Questions

Each week, Bryan should be able to answer:

- Did the repo move closer to a real hosted app?
- What shipped as code, schema, tests, UI specs, or durable external artifacts?
- What new risks or blockers appeared?
- Which handoffs are stale?
- Are automations repeating work?
- Is the first vertical slice closer to done?
- What needs a human decision before the next week?
