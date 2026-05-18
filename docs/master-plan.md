# Senior Capstone Master Plan

Date: 2026-05-18

This is the top-level product plan for the Senior Capstone rebuild. Every automation lane must read this before choosing work. If a run cannot explain how its slice advances this plan, it should pick a different slice.

The category-owned MVP requirement source is `docs/mvp-requirements-catalog.md`. Every automation run must ladder from this master plan into that catalog, name the requirement IDs it advances, and update the catalog when status, evidence, blockers, owner category, or acceptance checks materially change.

## Product Destination

Build a hosted Senior Capstone application for students, mentors, program teachers, administrators, and miscellaneous support/admin users.

The revised MVP is a secure, database-centered web app. It is not a static guide, a Figma-only prototype, a Canva asset library, or a fake dashboard. The database, account model, permissions, progress updates, audit logs, and deployment path are the product backbone.

The immediate delivery target is sharper than the full MVP: by Day 7, the project needs a full-fledged alpha where the complete app flow works end to end even though production user accounts do not work yet. Count Monday, 2026-05-18 as Day 1 for this plan; the Day 7 alpha gate is end of day Sunday, 2026-05-24 PT. If a later run uses "seven days from now" language, 2026-05-25 is a buffer day, not the target.

Figma can prototype account flows, data-backed states, role-aware dashboards, and handoff specs, but it must not be treated as the production account system, database, file store, or source of truth. MVP 1.0 requires a real application/backend foundation for identity, authorization, persistent records, private evidence, and audited workflow changes.

MVP 1.0 must support:

- A fully functional database that holds operational Senior Capstone data, including users, groups, roles, programs, cohorts, requirements, deadlines, submissions, evidence metadata, review decisions, progress/status history, audit events, announcements, and exports.
- Secure user accounts with hardened username/password login for the MVP pilot because district SSO is not available yet. Keep the auth boundary narrow enough to swap in managed SSO later.
- User groups and role-based permissions for student, mentor, program teacher, admin, and misc admin users.
- Admin-managed user/group/program/cohort assignment workflows.
- Student and staff progress updates backed by trusted server/database state.
- Private upload/evidence spaces for student documents, links, images, reflections, rubrics, presentation materials, and archive exports, using a Google Drive evidence repository as the MVP storage path while D1 stores metadata, review state, and audit history.
- Student submissions, revisions, comments, resubmissions, approvals, and phase progress.
- Mentor and program teacher review flows with revision requests and approvals.
- Admin controls for users, groups, programs, cohorts, assignments, deadlines, templates, announcements, exports, and audited overrides.
- Dashboards for students, mentors, program teachers, and admins.
- Audit logs for sensitive actions.
- Privacy-conscious handling of student records, uploads, exports, staff notes, and access control.
- GitHub-connected deployment to Cloudflare Workers/Pages, with Cloudflare-managed production environments and a future Bryan-purchased custom domain.

Day 7 alpha may temporarily defer production user-account readiness. It must still prove the whole user journey through seeded/demo personas, route guards, working forms, persisted or server-owned demo state where practical, dashboard updates, review/status transitions, and clear audit/activity history. First-admin bootstrap is now complete, and four fake `.test` role accounts are seeded and login-verified in production D1 for alpha walkthrough/testing. Do not let password reset, invitation, account import, district SSO, or remaining account hardening block the Day 7 alpha.

Figma and Canva are major first-class inputs to the product experience. Figma should drive functional UI design, role-aware screens, implementation-ready specs, state coverage, and guided prototype/page annotations that explain real app progress and the next ladder step. Canva should create stunning supporting images and visual assets that make the app feel polished without baking important live text or private data into images.

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

Before that slice can count as started, the repo needs a concrete MVP foundation setup:

- App scaffold that can run locally and deploy through GitHub to Cloudflare Workers/Pages.
- Auth/session boundary using the hardened username/password pilot path until school SSO is available.
- Database schema and migrations for users, groups, roles, memberships, programs, cohorts, requirements, progress, submissions, reviews, comments, evidence metadata, announcements, exports, deadlines, and audit events.
- Private evidence storage plan using Google Drive as the MVP repository path, with server-side authorization, deletion/replacement rules, retention, archive/export, and audit events.
- Server-side authorization helpers for student-own records, assigned mentor records, program/cohort teacher records, admin records, and narrow misc admin permissions.
- Seed/dev data for at least one admin, program teacher, mentor, student, program, cohort, assignment, progress record, and audit event.
- Test runner and first permission/workflow tests before any dashboard metric is trusted.
- Environment/secrets template for local, preview, and production deployment assumptions.

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
- Figma frames, variables, or plugin storage are not used as the production account, database, or evidence layer.

## Day 7 Alpha Gate

Target date:
- Day 1: Monday, 2026-05-18.
- Day 7 alpha due: Sunday, 2026-05-24 PT.

Definition:
- A full-fledged alpha is a working web app flow, not a visual prototype.
- Production user accounts may be incomplete or disabled.
- The app may use a role/persona switcher, seeded demo users, or a single local/preview bypass to represent student, mentor, program teacher, admin, and misc admin roles.
- The alpha must make it obvious which account/security pieces are mocked, stubbed, or bypassed so nobody mistakes it for a safe pilot with real student records.

Required alpha flows:
- Student opens a dashboard, sees current phase, next action, due items, evidence needs, revision state, and program context.
- Student completes and saves a guided proposal/research form, including section completeness and draft/revision status.
- Student attaches evidence as links or upload metadata; real Google Drive file-byte upload can remain incomplete if the evidence flow, metadata, validation, and access states work.
- Student submits, receives teacher feedback, revises, and resubmits.
- Program teacher reviews a queue, opens submission detail, comments, requests revision, approves, and sees dashboard counts update.
- Mentor sees assigned-student context, meeting/presentation risk cues, and scoped notes/actions.
- Admin sees program/cohort overview, seeded user/group/program/cohort assignment surfaces, deadlines/templates, audit/activity history, export/archive controls, and override/reason states.
- Misc admin has a narrow read/reporting-style view, not broad default admin access.
- Status history, audit/activity timeline, and dashboard aggregates update when alpha actions happen.
- Empty, loading, error, permission-denied, upload/evidence failure, revision-needed, approved, and blocked-submit states exist for the core flow.
- The student path works on a mobile viewport without horizontal overflow.
- The app can run locally from documented commands and should have Cloudflare preview/deployment evidence if the deployment path is not blocked.

Execution framework:
- Use `docs/alpha-week-framework.md` as the day-by-day alpha build rail for 2026-05-18 through 2026-05-24. It does not change the schedule, workspace, model, reasoning effort, or active automation status.
- Day 1 evidence now includes the D1-backed alpha route/persona flow, Cloudflare/D1/Drive setup records, first-admin bootstrap, fake login-capable role accounts, the alpha runbook, alpha week framework, alpha state-machine tests, alpha contract checker, preview deployment command, and GitHub Actions CI workflows.

Account exception for alpha:
- Production login, password reset, invitations, account import, credential lifecycle, district SSO, and full server-side account hardening are not required for Day 7 alpha. First-admin bootstrap has been completed and should stay behind the alpha flow as production hardening, not as a Day 7 walkthrough dependency.
- Fake `.test` accounts now exist for the alpha roles and can be used for login/session smoke checks. Their passwords live only in ignored local `.secrets/` files and must not be copied into docs, commits, screenshots, Figma, or Canva.
- Do not delete or abandon the real auth scaffold. Keep it behind the alpha flow as the post-alpha hardening path.
- Permission behavior in alpha should be represented through route/persona scoping and tests where practical, but must be labeled as alpha-scoped until hardened accounts work.

Day 7 acceptance checks:
- A reviewer can run the app and complete the student -> teacher review -> revision/resubmission -> approval -> dashboard/audit update loop without editing code.
- A reviewer can switch to staff/admin personas and inspect the same underlying seeded/demo records from role-appropriate views.
- Core records and transitions are represented through app state, API routes, D1/local database, or a documented server-owned demo-state layer; they are not just static HTML.
- The repo contains a Day 7 alpha runbook, known gaps, and exact post-alpha account/security tasks.
- Real student data is not entered into alpha.

Seven-day implementation ladder:
1. Day 1, 2026-05-18: lock alpha scope, preserve Cloudflare/D1/Drive setup records, create the alpha route/persona shell, add the runbook/framework/check/CI rails, seed fake role test accounts, and prioritize working flows over more broad design polish.
2. Day 2, 2026-05-19: preserve the verified D1-backed alpha/first-admin/test-account proof, verify any new deployment after subsequent commits, and turn any new deploy/config blocker into a committed exact next action.
3. Day 3, 2026-05-20: deepen student dashboard, guided proposal/research form, save/draft/submit states, evidence metadata validation, blocked-submit/access states, and mobile no-overflow proof.
4. Day 4, 2026-05-21: complete program teacher review queue, comments, revision request, approval, resubmission loop, immutable history, status history, and broader permission tests.
5. Day 5, 2026-05-22: deepen mentor dashboard, meeting/presentation cues, admin overview, misc-admin narrowing, program/cohort/deadline/template surfaces, dashboard aggregates, and audit/activity timeline into real workflow endpoints.
6. Day 6, 2026-05-23: add export/archive controls, announcements or admin notices, mobile student no-overflow proof, error/empty/permission states, and Cloudflare preview attempt or exact blocker.
7. Day 7, 2026-05-24: alpha QA, bug fixes, runbook, known gaps, acceptance walk-through, and final alpha status commit.

Post-alpha hardening starts after the Day 7 gate:
- Hardened username/password account lifecycle.
- First-admin credential rotation.
- Import/invitation/provisioning flows.
- Full server-side authorization tests.
- Google Drive upload credentials/OAuth, access-control tests, and credential rotation.
- Real private evidence access and retention controls.
- Pilot-readiness security/privacy review.

## Milestone Path

Use `docs/automation-milestones.md` for the detailed milestone checklist. The strategic order is:

1. Operating base and shared memory.
2. Cloudflare/GitHub architecture and scaffold.
3. Day 7 alpha flow completeness with seeded/demo personas and no production account requirement.
4. Secure database, auth, account/group, permission, progress, upload, and audit foundations.
5. Admin preview and role-aware dashboard foundation.
6. First proposal/research vertical slice.
7. Remaining source-cycle workflows: mentor meetings, presentation, celebration, reflections, archive/export.
8. Visual system, Canva image families, and Figma implementation coverage.
9. Production hardening, custom domain readiness, and pilot readiness.

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

The current QoL schedule provides 30 targeted starts per day, but the real delivery goal is evidence-based accepted MVP progress, not 30 counted changesets every day.

For the current 45-day / 100-pass target, use this daily goal:

- Minimum: 2 accepted MVP passes per calendar day.
- Stretch: 3 accepted MVP passes per calendar day when the repo is unblocked.
- Weekly minimum: 14 accepted MVP passes.
- Weekly stretch: 16-18 accepted MVP passes.
- Cap discipline: do not count more than 100 accepted passes before the MVP is honestly assessed as pilot-ready or not.

An accepted MVP pass must leave durable evidence: a pushed commit or published external artifact with committed repo records, plus validation or an explicit blocker that reduces ambiguity. Routine log repair, prompt snapshot repair, external quota retries, or repeated broad design polish do not count unless they unblock a P0/P1 MVP path.

Daily priority order:

1. Until the Day 7 alpha gate is met, first accepted pass of the day should move a visible app flow: routing, role/persona switching, student workflow, teacher review, mentor/admin views, dashboard updates, evidence metadata, audit/activity history, mobile path, or alpha runbook.
2. Second accepted pass should deepen or verify the same alpha path: working transitions, seeded/demo data, tests, local run proof, Cloudflare preview proof, error/empty/permission states, or bug fixes.
3. Stretch pass can be Figma, Canva, audit, or docs only when it directly unblocks the Day 7 alpha or closes a concrete P0/P1 handoff.

Weekly adjustment rule for this project only: `senior-capstone-qol-source-framework-seed` reviews the last seven days of run manifests, run log entries, commits, backlog movement, handoffs, and audit findings on Sundays. It then updates this master plan, `docs/automation-memory.md`, and `docs/mvp-requirements-catalog.md` with the next week's daily goal/allocation if evidence shows the plan is too loose, too aggressive, or pointed at the wrong QoL target.

30-day efficiency rule: use `scripts/measure-automation-efficiency.ps1` to audit the active automation system before changing cadence. The current 30-start/day QoL system creates 900 scheduled starts in 30 days; it needs 60 accepted MVP passes for the minimum target and 90 for the stretch target. That means conversion quality matters more than more starts. Auto-scaling should retarget QoL focus, blockers, prompt clarity, and acceptance checks from evidence before recommending schedule changes.

### 2026-05-18 Baseline After Figma And Automation Catch-Up

Today's work materially improved the implementation runway, but it did not yet create the hosted database-backed app. Treat the repo state through commit `08660f3` as the 100-pass baseline:

- Operating base is stronger: the project now has category-owned MVP requirements, prompt snapshots, structured run manifests, a human-decision queue, artifact registry, contract checker, publication/commit-push requirements, and non-interactive project-script rules.
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
  - `69:2`: audit-log and export-controls contract with immutable audit stream filters, redacted event detail, scoped export request, signed archive/download states, permission denial, retention-policy cues, and no-storage-key exposure.
  - `78:2`: mentor meeting and presentation scheduling contract with prep evidence, attendance/make-up tracking, outline approval gate, presentation slot conflict handling, check-out/check-in state, scoped permissions, and audit events.
  - `98:2`: full MVP alpha prototype page with 15 clickable app states, frames `98:3` through `98:17`, map rail `98:1130`, route/data/permission annotations, protected-record boundary, announcements without peer messaging, mobile path, and implementation handoff.
- The critical gap has shifted: the Cloudflare Pages/D1 scaffold, auth endpoints, production alpha route, first-admin bootstrap, fake role test accounts, alpha tests, and CI rails now exist, but Drive upload credentials, broad permission/protected-evidence tests, account lifecycle, post-reset deployment verification, and production workflow endpoints remain incomplete.

Because of that gap, the next useful 100-pass plan must prioritize implementation, deployment proof, and tests over additional design polish unless design work is directly blocking a concrete route/data/permission implementation. The full Figma prototype now exists; future Figma work should be targeted QA/handoff refinement, not another broad prototype pass, until the hosted alpha catches up.

### 2026-05-18 Category Automation Reset

Bryan explicitly reset the Senior Capstone automation setup on 2026-05-18. The prior active/standby automation model is superseded by seven active MVP category runners:

- `requirements-audit`
- `backend-security-data`
- `student-workflow-evidence`
- `staff-review-mentor`
- `admin-ops-reporting`
- `deployment-qa`
- `design-assets-handoff`

The requirement catalog in `docs/mvp-requirements-catalog.md` is now the pass ladder between this master plan and individual run work. The schedule is execution capacity, not a target to count scheduled starts as accepted passes. Keep the daily accepted-pass goal at 2 minimum, 3 stretch, until the weekly evidence review changes it.

### 2026-05-18 Hourly Category Automation Escalation

Bryan explicitly asked for the automation to run as many times per day as practical with no human approvals, logging, laddering, and self-improvement to scripts as it goes. The seven active category runners now run hourly with distinct minute offsets, producing 168 scheduled starts per day and 24 starts per category per day:

- `requirements-audit`: hourly at `:03`.
- `backend-security-data`: hourly at `:11`.
- `student-workflow-evidence`: hourly at `:19`.
- `staff-review-mentor`: hourly at `:27`.
- `admin-ops-reporting`: hourly at `:35`.
- `deployment-qa`: hourly at `:43`.
- `design-assets-handoff`: hourly at `:51`.

This cadence was briefly the Codex GUI-facing source of truth before the later 20x tuning and QoL rebuild. It is intentionally preserved as historical context, but the active source of truth is now the QoL Automation Rebuild section below.

### 2026-05-18 20x Automation Readiness

Bryan then asked to make the automation A-material and ready to run 20x/day while touching only this project's automation. This 20x/day system was the Codex GUI-facing source of truth before the later QoL rebuild: 20 total project starts per day, distributed across seven category runners by MVP risk.

- `requirements-audit`: `00:03`, `12:03`, `23:03`.
- `backend-security-data`: `01:15`, `07:15`, `13:15`, `19:15`.
- `student-workflow-evidence`: `02:27`, `08:27`, `14:27`, `20:27`.
- `staff-review-mentor`: `03:39`, `10:39`, `18:39`.
- `admin-ops-reporting`: `04:51`, `15:51`.
- `deployment-qa`: `06:03`, `17:03`.
- `design-assets-handoff`: `09:39`, `21:39`.

A-material automation means each productive run must do one of three things: land verified MVP progress, repair a repeatable project automation/script/checker failure, or commit an exact blocker that makes the next account/tool action clear. It must name requirement IDs, log durable evidence, run relevant checks, commit, push, and avoid waiting for human approval on project-owned files/scripts/commits.

### 2026-05-18 QoL Automation Rebuild

Bryan then requested deleting all project automation and rebuilding from scratch so every listed unfinished QoL item gets at least three passes per day without concentrating token use in a few broad runners. The current Codex GUI-facing source of truth is ten individual QoL automations, each running 3x/day:

- `senior-capstone-qol-source-framework-seed`: `00:03`, `08:03`, `16:03`.
- `senior-capstone-qol-drive-upload-oauth`: `00:51`, `08:51`, `16:51`.
- `senior-capstone-qol-protected-evidence-tests`: `01:39`, `09:39`, `17:39`.
- `senior-capstone-qol-teacher-review-endpoints`: `02:27`, `10:27`, `18:27`.
- `senior-capstone-qol-immutable-review-history`: `03:15`, `11:15`, `19:15`.
- `senior-capstone-qol-mentor-presentation-flow`: `04:03`, `12:03`, `20:03`.
- `senior-capstone-qol-admin-ops-endpoints`: `04:51`, `12:51`, `20:51`.
- `senior-capstone-qol-announcements`: `05:39`, `13:39`, `21:39`.
- `senior-capstone-qol-account-lifecycle`: `06:27`, `14:27`, `22:27`.
- `senior-capstone-qol-cloudflare-verification`: `07:15`, `15:15`, `23:15`.

Each QoL automation stays narrow, names requirement IDs, respects the token budget guardrail, applies the surface expansion rule, validates, logs, commits, and pushes. The schedule is execution capacity, not an accepted-pass count.

### Updated 100-Pass Allocation From Current State

Use this allocation as the working budget until a committed implementation pass proves it should change:

1. Passes 1-10: create the Cloudflare-compatible TypeScript app scaffold, package scripts, local dev path, test runner, CI/build notes, Wrangler/Pages structure, environment template, and public-guide/source-framework preservation path.
2. Passes 11-25: create D1-compatible schema/migrations and seed strategy for programs, cohorts, requirements, requirement sections, quality checks, deadlines, submissions, evidence artifacts, reviews, comments, status history, audit events, announcements, and exports.
3. Passes 26-40: implement auth/account identity, user groups, roles, role scopes, mentor/teacher assignments, admin provisioning surfaces, permission helpers, and tests for student/mentor/teacher/admin/misc-admin boundaries.
4. Passes 41-55: implement trusted progress updates, status transitions, audit-event persistence, dashboard aggregates from server/database state, and tests for valid/invalid transitions and unauthorized access.
5. Passes 56-70: implement private evidence upload/link metadata, Google Drive repository upload/retrieval assumptions, access-controlled download or redirect behavior, external-link access checks, immutable review history, denied-access audit events, and protected-evidence tests.
6. Passes 71-82: implement the proposal/research workflow slice: guided sections, source/quote/counterclaim quality checks, submit/resubmit, teacher review queue, revision request, approval, comments, and dashboard update.
7. Passes 83-90: implement admin override, export/archive, announcement, misc-admin scoped reporting, audit-log views, and source-cycle extensions needed for mentor meetings, presentation, celebration, reflections, and May 5 archive readiness.
8. Passes 91-97: harden deployment and operations: Cloudflare preview evidence, environment/secrets checklist, backup/export posture, accessibility/security QA, retention notes, and no-student-messaging verification.
9. Passes 98-100: finish pilot readiness: staff provisioning checklist, seed/demo data posture without real student records, custom-domain readiness, final audit review, and Bryan-facing pilot checklist.

Immediate next five passes should deepen the shipped alpha into the real MVP spine:

1. Broaden tests for auth, permission helpers, protected evidence access, status transitions, audit/export controls, meeting attendance, and presentation-slot conflicts.
2. Extend alpha proposal/review/evidence/audit records into real workflow endpoints instead of one demo-state endpoint.
3. Implement shared `StatusPill`, `ActionButton`, `EvidenceArtifactRow`, `PermissionGate`, and `ReviewHistoryItem` primitives against the current alpha states.
4. Add Google Drive server-side credential/OAuth implementation plus access-controlled evidence upload/retrieval assumptions before real uploads.
5. Add account provisioning/import, invitation, password reset, credential rotation, and known-gaps QA while keeping seeded personas and fake login-capable test accounts available for the Day 7 walkthrough.

Do not spend the next several non-audit passes on additional broad Figma polish while the Day 7 alpha still needs deeper workflow endpoints and QA, unless rebuild hits a specific UI/security ambiguity that blocks the alpha. The design side is currently ahead of the hosted app, including full prototype page `98:2`; the app now needs real routes, forms, transitions, demo data, tests/smoke checks, and preview evidence.

## Stack And Deployment Direction

The accepted deployment direction is GitHub-connected Cloudflare hosting. Bryan expects to purchase a domain after the hosted path is ready.

The accepted rebuild stack direction is the Cloudflare-compatible production stack:

- App framework and Workers/Pages structure.
- Auth provider and account/group provisioning model.
- Database, likely Cloudflare D1 or another Cloudflare-compatible secure database path.
- Private upload/file storage through a Google Drive evidence repository for MVP, with Cloudflare R2 treated as a future fallback only if enabled and approved.
- ORM/migrations.
- GitHub-to-Cloudflare deployment workflow.
- Environment/secrets strategy.
- Test runner and CI.
- Backup/export posture.
- Custom domain cutover checklist.

No automation should pretend the app is functional until this foundation exists in the repo and is tested.

Immediate setup order:

1. Scaffold the TypeScript app/runtime, package scripts, local dev command, test runner, and deployment config.
2. Add schema/migration tooling and the first database tables for users, groups, memberships, roles, programs, cohorts, progress, and audit events.
3. Add an alpha persona/role switcher and seeded/demo users so every core app flow can work without production accounts by 2026-05-24.
4. Wire student, teacher, mentor, admin, and misc-admin alpha routes to shared demo/server-owned state and status transitions.
5. Add hardened username/password auth/session integration behind a narrow app-owned interface so the exact provider can be swapped if school SSO later becomes available.
6. Add server-side permission checks and tests before using the alpha for real records.
7. Add Google Drive upload credential/OAuth and storage access patterns before accepting real uploads.
8. Wire the first admin/student/teacher dashboard metrics only from server/database or explicit alpha demo state.
9. Connect Figma implementation specs to the real routes/components after the secure data boundary exists.

Current stack pressure:

- `HD-2026-05-18-001` is accepted for the production stack.
- `docs/architecture/adr-0001-stack-auth-database-upload.md` is the accepted Cloudflare-oriented ADR.
- `D-2026-05-18-019` accepts the no-district-SSO hardened username/password pilot and Google Drive evidence repository path.
- Cloudflare Pages project `senior-capstone-app`, D1 database `senior-capstone-db`, migration `0001_foundation`, Google Drive evidence root folder, Google Drive evidence index sheet, first admin, and four fake `.test` alpha role accounts are now provisioned and recorded in `docs/backend-setup.md`.
- `SC-005` is now in-progress and keeps the scaffold in front of the automation loop.
- Rebuild should prioritize the Cloudflare stack/auth/database/user-group/progress/private-upload foundation before broad app feature work.

## Lane Responsibilities

Figma:
- Heavy product-design ownership for functional app screens, app shell, dashboards, admin preview, components, responsive states, accessibility, permission-aware UI states, upload/evidence states, database-backed states, announcement surfaces, mobile-aware patterns, developer-ready specs, and guided prototype/page annotations that ladder from actual progress into the next MVP slice.

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
- Let production account/login hardening block the Day 7 alpha; use clearly labeled seeded/demo personas for alpha instead.
- Call the Day 7 alpha pilot-ready or safe for real student records while production accounts and hardened permissions are incomplete.
- Use Figma variables, prototype state, plugins, or plugin storage as the app's production auth, database, evidence storage, or audit log.
- Store student records in `localStorage`.
- Build dashboards from client-only state.
- Treat Figma, Canva, or docs as the product.
- Treat the daily Figma prototype as production data, a working backend, or evidence that an app feature is implemented when the repo/backend does not yet support it.
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
- Did `senior-capstone-qol-source-framework-seed` adjust the next week's daily goal/allocation from evidence instead of vibes?
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
