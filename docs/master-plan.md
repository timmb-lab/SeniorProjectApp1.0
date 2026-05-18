# Senior Capstone Master Plan

Date: 2026-05-18

This is the top-level product plan for the Senior Capstone rebuild. Every automation lane must read this before choosing work. If a run cannot explain how its slice advances this plan, it should pick a different slice.

## Product Destination

Build a hosted Senior Capstone application for students, mentors, program teachers, administrators, and miscellaneous support/admin users.

The revised MVP is a secure, database-centered web app. It is not a static guide, a Figma-only prototype, a Canva asset library, or a fake dashboard. The database, account model, permissions, progress updates, audit logs, and deployment path are the product backbone.

MVP 1.0 must support:

- A fully functional database that holds operational Senior Capstone data, including users, groups, roles, programs, cohorts, requirements, deadlines, submissions, evidence metadata, review decisions, progress/status history, audit events, announcements, and exports.
- Secure user accounts with managed auth or hardened username/password login.
- User groups and role-based permissions for student, mentor, program teacher, admin, and misc admin users.
- Admin-managed user/group/program/cohort assignment workflows.
- Student and staff progress updates backed by trusted server/database state.
- Private upload/evidence spaces for student documents, links, images, reflections, rubrics, presentation materials, and archive exports.
- Student submissions, revisions, comments, resubmissions, approvals, and phase progress.
- Mentor and program teacher review flows with revision requests and approvals.
- Admin controls for users, groups, programs, cohorts, assignments, deadlines, templates, announcements, exports, and audited overrides.
- Dashboards for students, mentors, program teachers, and admins.
- Audit logs for sensitive actions.
- Privacy-conscious handling of student records, uploads, exports, staff notes, and access control.
- GitHub-connected deployment to Cloudflare Workers/Pages, with Cloudflare-managed production environments and a future Bryan-purchased custom domain.

Figma and Canva are major first-class inputs to the product experience. Figma should drive functional UI design, role-aware screens, implementation-ready specs, and state coverage. Canva should create stunning supporting images and visual assets that make the app feel polished without baking important live text or private data into images.

This project is not finished when it looks good. It is finished when the hosted app can safely manage real student workflow and staff visibility from a secure database-backed foundation.

## 2.0 Product Horizon

After MVP 1.0 is real, version 2.0 should explore native or cross-platform iOS and Android apps.

2.0 goals:

- Mobile student/staff access to core dashboards and progress state.
- Push notifications for seniors and staff when deadlines, revision requests, approvals, announcements, or schedule changes matter.
- Announcement section for school/program/capstone updates.
- Mobile-friendly evidence capture and upload if privacy and storage controls are ready.
- No student-to-student messaging. Messaging is not a product requirement and should not be added as a hidden chat feature, comment workaround, or social feed.

Mobile work must not displace MVP 1.0 database, security, account/group, workflow, deployment, and admin-preview priorities.

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

## MVP 1.0 Vertical Slice

The first production slice is now database/security first:

Admin creates or imports users, groups, programs, cohorts, and role assignments -> student record is created -> student or staff updates capstone progress -> status history persists -> audit event records the change -> role-aware dashboard aggregate updates from trusted database state -> app deploys through GitHub to Cloudflare.

The first workflow slice after that foundation is:

Student proposal/research submission -> private evidence upload/link -> program teacher review -> revision request or approval -> status history -> audit event -> dashboard aggregate.

Acceptance criteria:

- User, group, role, program, cohort, requirement, progress, and audit data persist in the database.
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
- A GitHub-to-Cloudflare deployment path exists before the app is described as hosted.

## Milestone Path

Use `docs/automation-milestones.md` for the detailed milestone checklist. The strategic order is:

1. Operating base and shared memory.
2. Cloudflare/GitHub architecture and scaffold.
3. Secure database, auth, account/group, permission, progress, upload, and audit foundations.
4. Admin preview and role-aware dashboard foundation.
5. First proposal/research vertical slice.
6. Remaining source-cycle workflows: mentor meetings, presentation, celebration, reflections, archive/export.
7. Visual system, Canva image families, and Figma implementation coverage.
8. Production hardening, custom domain readiness, and pilot readiness.

Earlier incomplete milestones beat later polish unless a P0/P1 risk says otherwise.

## 100-Pass Delivery Constraint

Bryan's current delivery pressure is to reach an MVP in 100 automation passes or fewer over roughly the next 45 days. This does not change the automation cadence, schedule, workspace, model, reasoning effort, or active status.

The pass budget should bias every lane toward reducing implementation ambiguity:

- Figma slices should name routes, data fields, permission scopes, states, interactions, and acceptance checks.
- Core rebuild slices should prioritize shipped scaffold, schema, auth/permission tests, progress/audit persistence, and Cloudflare preview evidence.
- Audit slices should turn gaps into owner-specific findings with acceptance checks, not broad restatements.
- Canva slices should support app placement and live-text discipline, not decorative drift.

The target is not "100 design passes." It is 100 total compounding passes toward a secure hosted MVP.

### Real Daily MVP Goal

The schedule provides five orchestration opportunities per day, but the real delivery goal is evidence-based accepted MVP progress, not five perfect changesets every day.

For the current 45-day / 100-pass target, use this daily goal:

- Minimum: 2 accepted MVP passes per calendar day.
- Stretch: 3 accepted MVP passes per calendar day when the repo is unblocked.
- Weekly minimum: 14 accepted MVP passes.
- Weekly stretch: 16-18 accepted MVP passes.
- Cap discipline: do not count more than 100 accepted passes before the MVP is honestly assessed as pilot-ready or not.

An accepted MVP pass must leave durable evidence: a pushed commit or published external artifact with committed repo records, plus validation or an explicit blocker that reduces ambiguity. Routine log repair, prompt snapshot repair, external quota retries, or repeated broad design polish do not count unless they unblock a P0/P1 MVP path.

Daily priority order:

1. First accepted pass of the day should move implementation: scaffold, schema, auth, permissions, storage, tests, CI, deployment, or database-backed workflow.
2. Second accepted pass should deepen or verify the same MVP path: tests, migration coverage, audit events, protected evidence, dashboard aggregate correctness, or deployment proof.
3. Stretch pass can be Figma, Canva, audit, or docs only when it directly unblocks implementation or closes a concrete P0/P1 handoff.

Weekly adjustment rule for this project only: the Sunday weekly deep audit reviews the last seven days of run manifests, run log entries, commits, backlog movement, handoffs, and audit findings. It then updates this master plan and `docs/automation-memory.md` with the next week's daily goal/allocation if evidence shows the plan is too loose, too aggressive, or pointed at the wrong lane. This weekly calibration may adjust goals and pass allocation, but it must not change automation schedules, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

### 2026-05-18 Baseline After Figma And Automation Catch-Up

Today's work materially improved the implementation runway, but it did not yet create the hosted database-backed app. Treat the repo state through commit `08660f3` as the 100-pass baseline:

- Operating base is stronger: the project now has a 5x/day gold-standard orchestrator, prompt snapshots, structured run manifests, a human-decision queue, artifact registry, contract checker, publication/commit-push requirements, and non-interactive project-script rules.
- Stack direction is accepted: `HD-2026-05-18-001` and ADR-0001 select the default GitHub-to-Cloudflare path with TypeScript, Cloudflare Workers/Pages, D1-compatible database, R2-compatible private evidence storage, Workers-compatible managed auth or school-approved SSO, server authorization, and audit logging.
- Active Figma source is usable: professional-plan calls verified and updated file `z4t4tFPAKrMDh6pIYOeEw6` in team `1638213362346160913`.
- Figma implementation handoffs now exist for the first MVP spine:
  - `18:2`: 100-pass route/data/permission execution map.
  - `31:2`: teacher review drawer and admin override states.
  - `37:2`: private evidence, access checks, and immutable review-history contract.
  - `43:2`: shared `StatusPill`, `ActionButton`, `EvidenceArtifactRow`, `PermissionGate`, and `ReviewHistoryItem` component contract.
  - `48:2`: admin account/group/role/program/cohort provisioning, scoped misc-admin permissions, duplicate import handling, and audit-event contract.
  - `56:2`: mobile student evidence/revision states for revision checklist, upload/link, submit-blocked, and access-denied recovery, with mobile overflow, private evidence, and audit acceptance checks.
  - `61:2`: progress-update to dashboard-aggregate contract with server-owned transitions, stale-write conflict handling, audit-first sensitive changes, and database-derived dashboard counts.
- The critical gap is unchanged: no production app scaffold, managed auth, database schema, private file storage, migrations, API layer, tests, CI, or GitHub-to-Cloudflare deployment pipeline exists yet.

Because of that gap, the next useful 100-pass plan must prioritize implementation over additional design polish unless the design work is directly blocking rebuild.

### Updated 100-Pass Allocation From Current State

Use this allocation as the working budget until a committed implementation pass proves it should change:

1. Passes 1-10: create the Cloudflare-compatible TypeScript app scaffold, package scripts, local dev path, test runner, CI/build notes, Wrangler/Pages structure, environment template, and public-guide/source-framework preservation path.
2. Passes 11-25: create D1-compatible schema/migrations and seed strategy for programs, cohorts, requirements, requirement sections, quality checks, deadlines, submissions, evidence artifacts, reviews, comments, status history, audit events, announcements, and exports.
3. Passes 26-40: implement auth/account identity, user groups, roles, role scopes, mentor/teacher assignments, admin provisioning surfaces, permission helpers, and tests for student/mentor/teacher/admin/misc-admin boundaries.
4. Passes 41-55: implement trusted progress updates, status transitions, audit-event persistence, dashboard aggregates from server/database state, and tests for valid/invalid transitions and unauthorized access.
5. Passes 56-70: implement private evidence upload/link metadata, R2 or equivalent private storage assumptions, signed URL expiry, external-link access checks, immutable review history, denied-access audit events, and protected-evidence tests.
6. Passes 71-82: implement the proposal/research workflow slice: guided sections, source/quote/counterclaim quality checks, submit/resubmit, teacher review queue, revision request, approval, comments, and dashboard update.
7. Passes 83-90: implement admin override, export/archive, announcement, misc-admin scoped reporting, audit-log views, and source-cycle extensions needed for mentor meetings, presentation, celebration, reflections, and May 5 archive readiness.
8. Passes 91-97: harden deployment and operations: Cloudflare preview evidence, environment/secrets checklist, backup/export posture, accessibility/security QA, retention notes, and no-student-messaging verification.
9. Passes 98-100: finish pilot readiness: staff provisioning checklist, seed/demo data posture without real student records, custom-domain readiness, final audit review, and Bryan-facing pilot checklist.

Immediate next five passes should be implementation-heavy:

1. Scaffold the accepted Cloudflare/TypeScript app with build/test/dev commands.
2. Add database/storage configuration stubs, migration layout, and domain model types.
3. Add users/groups/programs/cohorts/roles schema and seed loading for canonical programs, consuming Figma node `48:2` for provisioning states and permission guardrails.
4. Add permission, `ProgressUpdate`, `StatusHistory`, `DashboardAggregate`, and audit-event primitives with focused tests, consuming Figma node `61:2` for transition/aggregate guardrails.
5. Add private `EvidenceArtifact` storage/link metadata model with signed URL/link-check/review-history tests.

Do not spend the next several non-audit passes on additional broad Figma polish while `SC-005` remains in progress, unless rebuild hits a specific UI ambiguity that only Figma can resolve. The design side is currently ahead of the hosted-app foundation; the app now needs code, schema, tests, and Cloudflare deployment evidence.

## Stack And Deployment Direction

The accepted deployment direction is GitHub-connected Cloudflare hosting. Bryan expects to purchase a domain after the hosted path is ready.

The accepted rebuild stack direction is the Cloudflare-compatible production stack:

- App framework and Workers/Pages structure.
- Auth provider and account/group provisioning model.
- Database, likely Cloudflare D1 or another Cloudflare-compatible secure database path.
- Private upload/file storage, likely Cloudflare R2 or another access-controlled storage path.
- ORM/migrations.
- GitHub-to-Cloudflare deployment workflow.
- Environment/secrets strategy.
- Test runner and CI.
- Backup/export posture.
- Custom domain cutover checklist.

No automation should pretend the app is functional until this foundation exists in the repo and is tested.

Current stack pressure:

- `HD-2026-05-18-001` is accepted for the production stack.
- `docs/architecture/adr-0001-stack-auth-database-upload.md` is the accepted Cloudflare-oriented ADR.
- `SC-005` is now in-progress and keeps the scaffold in front of the automation loop.
- Rebuild should prioritize the Cloudflare stack/auth/database/user-group/progress/private-upload foundation before broad app feature work.

## Lane Responsibilities

Figma:
- Heavy product-design ownership for functional app screens, app shell, dashboards, admin preview, components, responsive states, accessibility, permission-aware UI states, upload/evidence states, database-backed states, announcement surfaces, mobile-aware patterns, and developer-ready specs.

Core rebuild:
- Cloudflare/GitHub architecture, scaffold, auth, authorization, database/schema, user groups, progress updates, private upload/evidence storage, workflow logic, dashboard aggregates, tests, CI/deployment readiness, custom-domain readiness, and security posture.

Audit:
- Quality gate, backlog hygiene, privacy/security critique, source-framework coverage, app-readiness findings, acceptance criteria, repeated-work detection.

Canva:
- Stunning supporting visuals only: program identity, phase/process visuals, dashboard empty states, onboarding, announcement imagery, recognition, export/print collateral, and app-supporting image families. Canva does not define functional app layout or store live app text/data.

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
- `docs/progress/runs/`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- Its lane log.
- `docs/automation-backlog.md`
- `docs/artifacts.json` when external artifacts are created, consumed, superseded, or verified.
- `docs/human-decisions.md` when a human-level decision is needed or changed.

For automation control, this file is the master planner. The pass logger is `docs/progress/run-log.md` plus the structured manifest written to `docs/progress/runs/` and the lane/report log. If an automation changes those operating rules, it must update the relevant live prompt or support script, especially `scripts/check-automation-contract.ps1`, in the same pass.

Each run must log:

- Which master-plan section justified the slice.
- Which log/backlog/handoff/decision was referenced.
- What changed.
- What was verified.
- What remains blocked.
- What the next lane should do.
- Whether self-improvement was unnecessary or what narrow prompt/config improvement was made with evidence.
- Which structured run manifest was written.

## Anti-Drift Rules

Do not:

- Build fake login screens and call that auth.
- Store student records in `localStorage`.
- Build dashboards from client-only state.
- Treat Figma, Canva, or docs as the product.
- Put private evidence in public static assets.
- Treat a static Cloudflare deployment as the MVP if the secure database/account/group foundation is missing.
- Skip audit logs for approvals, overrides, exports, role changes, or sensitive access.
- Prioritize decorative visuals before workflow, permission, upload, and review foundations.
- Let Canva imagery replace live app text, database-backed statuses, accessibility labels, or private data.
- Build chat or student-to-student messaging. Version 2.0 may include announcements and notifications, but no student messaging.
- Start iOS/Android app implementation before MVP 1.0 database, security, deployment, and admin-preview foundations are real.
- Repeat the same broad audit or design slice without closing a handoff/backlog item.
- Create new plans when the next milestone needs implementation.
- Edit automation prompts/configs without evidence, logs, and preservation of cadence/workspace/model/status unless Bryan explicitly asked.

## Weekly Human Check-In Questions

Each week, Bryan should be able to answer:

- Did the project hit at least 14 accepted MVP passes this week, and were they mostly implementation-heavy while `SC-005` remained open?
- Did the weekly deep audit adjust the next week's daily goal/allocation from evidence instead of vibes?
- Did the repo move closer to a real hosted app?
- Did the repo move closer to the secure database/account/group/progress MVP?
- Did the GitHub-to-Cloudflare deployment path move forward?
- What shipped as code, schema, tests, UI specs, or durable external artifacts?
- What new risks or blockers appeared?
- Which handoffs are stale?
- Are automations repeating work?
- Is the first vertical slice closer to done?
- Are Figma and Canva outputs feeding actual implementation instead of drifting into visual-only work?
- What needs a human decision before the next week?
