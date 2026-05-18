# Automation Milestones

Date: 2026-05-18

These milestones keep the four automation lanes pointed at the same product outcome.

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
- `data/programs.json`

Status:
- In progress until these files are committed and pushed.

## M1 - Architecture And Scaffold

Goal:
- Choose the hosted app architecture and create the minimal project scaffold.

Required outputs:
- Architecture decision record.
- Package/build/test commands.
- TypeScript or equivalent typed foundation.
- Test runner.
- Initial CI/build notes.
- Explicit public-guide preservation strategy.

Primary owner:
- Core rebuild.

Support:
- Audit validates assumptions.
- Figma identifies app-shell requirements.

## M2 - Domain And Security Foundation

Goal:
- Create implementation-ready auth, user, upload/evidence, domain, status, role, and permission foundations.

Required outputs:
- User/account model or managed-auth strategy.
- Role and permission model.
- Program seed loader or seed strategy.
- Private upload/evidence artifact model.
- Submission status transition rules.
- Permission matrix.
- Audit event model.
- Tests for permissions and status transitions.
- Privacy/security notes for auth, uploads, file storage, exports, retention, and audit logs.

Primary owner:
- Core rebuild.

Support:
- Audit checks FERPA-conscious handling and consistency.

## M3 - First Vertical Slice

Goal:
- Prove the first real workflow end to end.

Workflow:
- Student creates Core Concept Proposal.
- Student uploads or links required evidence/artifacts and supporting reflections.
- Student submits proposal.
- Program teacher reviews proposal.
- Teacher requests revision or approves.
- Status history and comments persist.
- Audit event records every sensitive transition.
- Dashboard aggregate updates by program.

Required outputs:
- Student proposal UI/spec.
- Evidence upload/link UI/spec.
- Teacher review queue UI/spec.
- Server/database-style workflow implementation.
- Tests for valid transitions and unauthorized access.
- Tests for protected evidence access.
- Program-level aggregate.
- Upload-failure, empty/loading/error, and permission states.

Primary owner:
- Core rebuild.

Support:
- Figma designs the student and teacher surfaces.
- Audit validates acceptance criteria.
- Canva supports onboarding/status visuals only if useful.

## M4 - Role Dashboards

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

## M5 - Visual System And Collateral

Goal:
- Add supporting visuals without compromising operational clarity.

Required outputs:
- Program identity visual system.
- Phase/process visual system.
- Empty-state asset family.
- Student onboarding visuals.
- Recognition/export collateral.

Primary owner:
- Canva.

Support:
- Figma determines UI placement.
- Audit checks accessibility and usefulness.

## M6 - Production Hardening

Goal:
- Make the app pilot-ready.

Required outputs:
- Auth hardening.
- Deployment environment docs.
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
