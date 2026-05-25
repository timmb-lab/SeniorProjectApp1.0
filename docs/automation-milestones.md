# Automation Milestones

Date: 2026-05-18

These milestones keep the automation lanes pointed at the revised MVP: a secure database-backed Capstone Project app, designed heavily in Figma, supported by polished Canva imagery, and hosted from GitHub to Cloudflare.

The detailed category-owned MVP requirements live in `docs/mvp-requirements-catalog.md`. Milestone work should update that catalog whenever status, evidence, blockers, or acceptance checks materially change.

## Delivery Constraint

Bryan's current target is to reach MVP in 100 automation passes or fewer over roughly 45 days. This does not change automation cadence or ownership. It tightens the definition of a useful pass: each run should ship a concrete artifact, code slice, test, verified design spec, blocker closure, or implementation-ready handoff that reduces secure-hosted-MVP ambiguity.

The urgent alpha target is earlier: count Monday, 2026-05-18 as Day 1, with a full app-flow alpha due by end of day Sunday, 2026-05-24 PT. Production user accounts do not have to work for that alpha, but the whole app flow must work through seeded/demo personas or a clearly labeled role switcher.

Day 7 alpha must prove:
- Student dashboard, guided proposal/research, evidence metadata/link flow, submit, revise, and resubmit.
- Program teacher review queue, comments, revision request, approval, and status history.
- Mentor, admin, and misc-admin role views with scoped demo visibility.
- Dashboard aggregates and audit/activity history updating from app state, API routes, D1/local database, or another documented server-owned demo-state layer.
- Mobile-safe student path, error/empty/permission states, alpha runbook, known gaps, and no real student data.
- Clear labeling that production login/account lifecycle, first-admin bootstrap, password reset, imports/invitations, district SSO, and hardened permission tests are post-alpha hardening tasks.

## M0 - Operating Base

Goal:
- Shared runbook, cadence, backlog, lane logs, program seed data, rebuild audit, domain model, and dashboard direction exist.

Definition of done:
- `docs/automation-runbook.md`
- `docs/automation-cadence.md`
- `docs/automation-backlog.md`
- `docs/rebuild-gameplan.md`
- `docs/domain-model.md`
- `docs/dashboard-ux-direction.md`
- `docs/curriculum-framework-integration.md`
- `data/programs.json`
- `data/capstone-framework.json`
- `docs/source-materials/extraction-manifest.json`

Status:
- In progress until these files are committed and pushed.

## M1 - Cloudflare Architecture And Scaffold

Goal:
- Choose the Cloudflare-compatible hosted app architecture and create the minimal project scaffold.

Required outputs:
- Architecture decision record oriented around GitHub-to-Cloudflare deployment.
- Package/build/test commands.
- TypeScript or equivalent typed foundation.
- Test runner.
- Initial CI/build notes.
- Cloudflare Workers/Pages project structure and local development notes.
- Cloudflare environment/secrets plan.
- Custom domain readiness notes for Bryan's future domain purchase.
- Explicit public-guide preservation strategy.
- Explicit source-PDF framework preservation strategy.

Primary owner:
- Core rebuild.

Support:
- Audit validates assumptions.
- Figma identifies app-shell requirements.

## M2 - Secure Database, Accounts, Groups, And Progress Foundation

Goal:
- Create the database-centered MVP foundation: auth, users, groups, roles, programs, cohorts, progress updates, upload/evidence, domain, status, permissions, and audit logging.

Required outputs:
- User/account model or managed-auth strategy.
- User group/cohort model.
- Role and permission model.
- Admin assignment/provisioning model for users, groups, programs, cohorts, mentors, and teachers.
- Database schema for users, groups, memberships, programs, cohorts, requirements, progress records, submissions, evidence artifacts, review decisions, comments, status history, audit events, announcements, exports, and deadlines.
- Program seed loader or seed strategy.
- Senior Project framework seed loader for `data/capstone-framework.json`.
- Private upload/evidence artifact model.
- Requirement section and quality-check model.
- Submission status transition rules.
- Mentor meeting attendance and presentation slot models.
- Progress update workflow with audit events and role-aware visibility.
- Announcement data model with staff/admin posting controls.
- Permission matrix.
- Audit event model.
- Tests for permissions, account/group scoping, progress updates, and status transitions.
- Privacy/security notes for auth, uploads, file storage, exports, retention, and audit logs.
- Cloudflare database/storage security notes, including secrets, migrations, backup/export, and least-privilege access assumptions.

Primary owner:
- Core rebuild.

Support:
- Audit checks FERPA-conscious handling and consistency.

## M2A - Day 7 Full App-Flow Alpha

Goal:
- By Sunday, 2026-05-24 PT, create a full-fledged alpha where every core Senior Capstone flow works without production user accounts.

Allowed alpha shortcut:
- Use seeded/demo personas or a role switcher for student, mentor, program teacher, admin, and misc admin.
- Keep production username/password login, first-admin bootstrap, account import/invitation, password reset, and district SSO out of the Day 7 critical path.

Required outputs:
- App shell and route map.
- Role/persona switcher or alpha bypass clearly labeled as not production auth.
- Seed/demo data for the canonical programs and representative student/staff records.
- Student dashboard and guided proposal/research workflow.
- Evidence link/upload metadata flow with failure and permission states.
- Teacher review queue, comments, revision request, approval, resubmission, and status history.
- Mentor dashboard and scoped assigned-student view.
- Admin program/cohort/deadline/template/dashboard/audit/export surfaces.
- Misc-admin narrow reporting/read view.
- Dashboard aggregates and audit/activity timeline that update after alpha actions.
- Mobile student path without horizontal overflow.
- Alpha runbook, known gaps, and post-alpha account/security hardening list.

Current setup evidence:
- `alpha.html`, `alpha.js`, `alpha.css`, `/api/alpha/state`, `functions/_lib/alpha-flow-model.js`, and D1 `app_settings` provide the first D1-backed route/persona alpha flow.
- `docs/alpha-runbook.md` and `docs/alpha-week-framework.md` define the Day 7 walkthrough, daily build goals, known gaps, and no-real-student-data guardrails.
- `tests/alpha-flow.test.mjs`, `scripts/check-alpha-contract.mjs`, `npm run check`, `npm run deploy:preview`, and `.github/workflows/ci.yml` add the alpha verification and preview rails.
- Remaining priority is Cloudflare Pages deployment verification, first-admin bootstrap verification, broader auth/permission/protected-evidence tests, mobile proof, Drive upload credentials, and real workflow endpoint hardening.

Primary owner:
- Core rebuild.

Support:
- Figma supplies route/state/handoff references only when implementation hits ambiguity.
- Audit verifies alpha truthfulness, known gaps, and no-real-student-data handling.

## M3 - Admin Preview And Progress Vertical Slice

Goal:
- Prove the revised MVP backbone in an admin-preview-worthy flow before broader workflow depth.

Workflow:
- Admin creates or imports users, groups, programs, cohorts, mentor assignments, and teacher assignments.
- Student, mentor, teacher, and admin accounts see only their permitted records.
- Student or staff updates capstone progress.
- Progress update persists in the database.
- Audit event records the change.
- Dashboard aggregate updates from trusted database state.
- App can be deployed from GitHub to Cloudflare for preview.

Required outputs:
- Figma admin preview screens and database-backed state specs.
- Canva-supported empty/onboarding/announcement visuals where useful.
- User/group/program/cohort schema.
- Progress record schema.
- Role-aware progress update implementation.
- Audit event implementation.
- Dashboard aggregate implementation.
- GitHub-to-Cloudflare preview deployment notes or config.
- Tests for group scoping, role permissions, progress changes, audit events, and unauthorized access.
- Empty/loading/error/permission states.

Primary owners:
- Core rebuild and Figma.

Support:
- Audit validates security and permission coverage.
- Canva supports polished non-text visuals that have a clear app placement.

## M4 - First Proposal/Research Workflow Slice

Goal:
- Prove the first real workflow end to end.

Workflow:
- Student creates Core Concept Proposal.
- Student uploads or links required evidence/artifacts and supporting reflections.
- Student completes Research Proposal Challenge sections: problem, solution, sources, quote, counterclaim, refutation, own draft, AI feedback, final version, and significance.
- Student submits proposal.
- Program teacher reviews proposal.
- Teacher requests revision or approves.
- Status history and comments persist.
- Audit event records every sensitive transition.
- Dashboard aggregate updates by program.

Required outputs:
- Student proposal UI/spec.
- Evidence upload/link UI/spec.
- Research challenge guided-section UI/spec.
- Teacher review queue UI/spec.
- Server/database-backed workflow implementation.
- Tests for valid transitions and unauthorized access.
- Tests for protected evidence access.
- Tests for section-level revision and review status.
- Program-level aggregate.
- Upload-failure, empty/loading/error, and permission states.

Primary owner:
- Core rebuild.

Support:
- Figma designs the student and teacher surfaces.
- Audit validates acceptance criteria.
- Canva supports onboarding/status visuals only if useful.

## M5 - Source Cycle Completion Slice

Goal:
- Implement the remaining source-PDF workflow structure after the first proposal/research slice is reliable.

Workflow:
- Mentor Meeting One prep, attendance, missed-meeting follow-up, and next actions.
- Mentor Meeting Two outline approval and presentation time scheduling.
- Thanks and Thanks thank-you submission.
- Presentation Day slides, check-out/check-in, rubric scoring, and completion status.
- Celebration Day display plan, setup photo, ingredient list when food is shared, rubric status.
- Five reflections.
- May 5 archive/export package and student acknowledgement.

Required outputs:
- Requirement records seeded from `data/capstone-framework.json`.
- Meeting attendance implementation.
- Presentation slot/check-out model.
- Celebration evidence model.
- Reflection submission model.
- Archive/export workflow.
- Dashboard aggregates for each workflow signal.
- Permission tests for private records.

Primary owner:
- Core rebuild.

Support:
- Figma designs the student/staff surfaces.
- Audit validates source-PDF coverage.
- Canva supports student-facing visuals where they reduce confusion.

## M6 - Role Dashboards

Goal:
- Build trustworthy dashboards for repeated staff use and calm student next-action views.

Required outputs:
- Student dashboard.
- Mentor dashboard.
- Program teacher dashboard.
- Admin overview.
- Filters by program, phase, cohort, mentor, status, and overdue state.
- Actionable metric cards that link to underlying records.

Primary owners:
- Figma and core rebuild.

Support:
- Audit checks dashboard actionability.
- Canva supports empty states and program visuals.

## M7 - Visual System And Collateral

Goal:
- Add stunning supporting visuals without compromising operational clarity, privacy, accessibility, or database-backed live state.

Required outputs:
- Program identity visual system.
- Phase/process visual system.
- Empty-state asset family.
- Student onboarding visuals.
- Announcement image family.
- Recognition/export collateral.

Primary owner:
- Canva.

Support:
- Figma determines UI placement.
- Audit checks accessibility and usefulness.

## M8 - Production Hardening And Cloudflare Launch

Goal:
- Make the app pilot-ready.

Required outputs:
- Auth hardening.
- Cloudflare deployment environment docs.
- GitHub-to-Cloudflare deployment verification.
- Custom domain setup checklist for Bryan's purchased domain.
- Backup/restore posture.
- Export controls.
- Accessibility checks.
- Audit-log review.
- Staff/user provisioning flow.
- Pilot checklist.

Primary owner:
- Core rebuild.

Support:
- Audit verifies readiness.
- Figma/Canva polish high-friction areas.

## M9 - 2.0 Mobile Horizon

Goal:
- Preserve a clear post-MVP path for iOS and Android without letting mobile work derail MVP 1.0.

Required outputs:
- Mobile architecture recommendation after the web MVP is real.
- Notification model for seniors/staff.
- Announcement section requirements.
- Privacy/security notes for mobile access and push notifications.
- Explicit exclusion of student-to-student messaging.

Primary owner:
- Future planning after MVP 1.0.

Support:
- Figma may maintain mobile-aware patterns.
- Rebuild may keep APIs clean enough for future mobile clients.
