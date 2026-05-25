# Capstone Project Master Plan

Date: 2026-05-18
Last accuracy audit: 2026-05-21 PT

This is the top-level product plan for Capstone Project. The split builders must read this before choosing work. If a run cannot explain how its slice advances this plan and leave durable evidence, it should pick a different slice.

The MVP requirement source is `docs/mvp-requirements-catalog.md`. Every Functionality UX Upgrade run must ladder from this master plan into that catalog, name the requirement IDs it advances, and update the catalog when status, evidence, blockers, owner category, or acceptance checks materially change. Active automation ownership is recorded in `docs/automation-cadence.md`.

## P0 Production Experience Gate

The repo has two production deliverables:

1. Capstone Project product/app.
2. East Tech Senior Capstone Guide.

The project is not production-ready, pilot-ready, or ready for broad non-dev review until both deliverables pass this P0 gate. Alpha, smoke, preview, stakeholder-option, generated-mirror, Figma, Canva, and automation artifacts can support the work, but they do not substitute for the real production app or the real public website.

Production content must stay mapped to source materials through `docs/source-materials/production-content-crosswalk.md`.

The production app:

- Is the secure operational system.
- Is not `alpha.html`.
- Is not `account.html`.
- Is not `app-preview.html` unless app-preview is deliberately converted, renamed, routed, and validated as the canonical production app.
- Is not a public persona switcher.
- Is not a fake `.test` seeded account walkthrough.
- Is not a Figma prototype.
- Is not a Canva visual asset.
- Must choose screens from authenticated session plus D1-backed user plus role plus permission scope.
- Must support student, mentor, program teacher, admin, and misc admin experiences.
- Must use server/database-backed status, submissions, review, evidence, permissions, and audit state.
- Must not show alpha, QA, smoke, fake account, prompt, Codex, or builder language on canonical production routes.

The production website:

- Is the public information companion.
- Must have a small top banner or segmented control to switch between Student Guide and Teacher Guide.
- Treats the Student/Teacher toggle as public content organization, not login, auth, or permissions.
- Must provide lots of visible, source-aligned information.
- Must not hide required content only inside collapsed details panels.
- Must use visible sections, cards, timelines, checklists, tables, rubric summaries, anchor links, and clear "what to do next" blocks.
- Must align with the Your Senior booklet and the other Senior Project PDF/source documents.
- Must not expose dev, alpha, QA, prompt, or preview-only copy as the normal public experience.

### Forbidden Production-Surface Copy

The following copy is forbidden on canonical production app, website, and generated public surfaces unless explicitly allowlisted as internal docs, tests, alpha, or smoke:

- internal alpha
- QA only
- QA console
- smoke test
- seeded demo
- seeded persona
- fake `.test`
- non-production preview
- preview-only
- app boundary
- reset alpha
- run report
- prompt leftover
- Codex
- builder
- automation prompt
- TODO
- FIXME
- dev note
- developer note
- placeholder
- lorem ipsum
- dummy data
- fake data
- not production
- do not enter real student records
- setup key
- token
- API secret
- test account
- alpha route
- internal only
- stakeholder option as a normal production mode
- titan blend as a normal production mode
- back to basics as a normal production mode
- raw Drive storage IDs
- stack traces
- debug output
- instructions written to Codex/developers instead of students/teachers/mentors/admins

### Production App Acceptance Criteria

- Canonical production app route is identified in `docs/production-surface-registry.md`.
- Authenticated session is required.
- Screen selection comes from role/scope, not a public persona toggle.
- Student sees only own records.
- Mentor sees only assigned students.
- Program teacher sees assigned program/cohort students.
- Admin sees operational admin tools.
- Misc admin sees only explicitly scoped reporting/support.
- Unauthorized access returns a production-safe denial.
- Dashboard counts come from server/D1 state.
- Sensitive actions are audit logged.
- Fake, test, and internal tools are unlinked from normal app navigation.
- Production-copy checker passes.

### Production Website Acceptance Criteria

- Student Guide / Teacher Guide top-banner toggle exists.
- Current mode label is visible.
- Student mode front-loads student tasks.
- Teacher mode front-loads teacher/mentor responsibilities.
- Core content is visible or clearly summarized.
- Source documents are mapped.
- Public copy is production-safe.
- Generated output stays production-safe.
- Stakeholder options are not confused with Student/Teacher guide modes.
- Normal public navigation has no alpha/account/internal QA links.

## Role-Aware Production App Contract

The production app must choose visible screens from the authenticated session, D1-backed user identity, role, and permission scope. Future work must add tests proving role/scope screen selection and denial behavior.

Student must see:

- Current phase.
- Next required action.
- Due dates.
- Program context.
- Proposal/research status.
- Evidence requirements.
- Evidence upload/link status.
- Teacher comments.
- Revision requests.
- Resubmission path.
- Approval status.
- Mentor Meeting 1 status.
- Mentor Meeting 2 status.
- Presentation outline status.
- Presentation day status.
- Celebration Day display status.
- Thank-you letter status.
- Required mentor handwritten note reminder.
- Portfolio minimum/maximum path.
- Reflection task status.
- May 5 archive/download reminder.
- Own safe activity history.

Student must not see:

- Other student records.
- Teacher queues.
- Admin tools.
- Broad reports.
- Raw storage IDs.
- Internal QA tools.

Mentor must see:

- Assigned students only.
- Mentor meeting prep/status.
- Missed meeting/make-up flags.
- Presentation outline cues.
- Assigned student project/evidence overview where permitted.
- Scoped notes/actions only.

Program teacher must see:

- Assigned program/cohort students.
- Proposal/research review queue.
- Submission detail.
- Evidence metadata/access where permitted.
- Rubric-aligned criteria.
- Comments.
- Revision request.
- Approval.
- Resubmission history.
- Presentation/Celebration readiness.
- Intervention signals.

Admin must see:

- All-program dashboard.
- User/group/program/cohort management.
- Mentor assignments.
- Role assignments.
- Deadlines/templates.
- Announcements.
- Audits.
- Reports.
- Exports/archive.
- Override tools with required reasons.

Misc admin must see:

- Narrow reporting/support only.
- Aggregate readiness if allowed.
- No broad student access by default.
- No approval/export/role-change power by default.

Required states:

- loading
- empty
- error
- permission denied
- no assignment
- revision needed
- approved
- blocked submit
- upload failed
- evidence provider unavailable
- export unavailable
- deadline passed
- make-up needed
- role missing
- account disabled/reset required where relevant

## Student And Teacher Website Contract

The production website must expose a public top banner toggle with these visible labels:

- Viewing: Student Guide
- Viewing: Teacher Guide
- Switch to Student Guide
- Switch to Teacher Guide

Rules:

- This is not authentication.
- This is not private permissions.
- It may use `localStorage` because it is only public display preference.
- It must not hide core content from either audience.
- It changes emphasis, ordering, quick actions, and language.

Student Guide must visibly include:

- What Senior Capstone is.
- Why it matters.
- Where to start.
- Senior Remind/class website reminder.
- Program-specific expectations.
- Individual/group path.
- Required components.
- Core Concept Proposal.
- Research Proposal Challenge.
- Senior Project Folder and Linked Document.
- Resume.
- Major due dates.
- Mentor Meeting 1.
- Mentor Meeting 2.
- Presentation outline.
- Presentation Day.
- Celebration Day.
- Ingredients list reminder for food items.
- Thank-you letter.
- Handwritten notes including mentor note.
- Reflections.
- Portfolio minimum/maximum paths.
- Rubrics.
- Grade locations.
- Special recognition.
- May 5 archive/download reminder.

Teacher Guide must visibly include:

- What teachers/mentors need to know.
- Program-specific expectation guidance.
- Proposal review/approval checks.
- Grading responsibilities by class.
- Mentor Meeting 1 duties.
- Missed meeting form reminders.
- Mentor Meeting 2 outline approval.
- Presentation scheduling.
- Presentation Day grading workflow.
- Google Form grading reminder.
- Senior check-out/check-in.
- First 10 minutes in class rule.
- Celebration Day schedule/rubric/audience expectations.
- Paper rubric option.
- Ingredients list reminder for food items.
- Reflection/portfolio week expectations.
- Intervention signals.
- Rubric evidence to look for.

No-hidden-core-content rule:

- Required directions, due dates, rubrics, responsibilities, and actions must be visible or summarized without needing to expand details panels.
- Details panels can remain for deeper examples or optional extra help.

## Naming And Domain Direction

Locked decisions for this pass:

- Official product title: Capstone Project.
- Do not use "The Capstone Project" as the official product title.
- Product/app target domain: `thecapstoneproject.com`.
- `www.thecapstoneproject.com` may be an alias if configured.
- `app.thecapstoneproject.com` is optional only if the implementation still requires an app split.
- East Tech guide future custom domain: TBD.
- Product/app is school-agnostic, reusable, multi-school, nonprofit/SaaS-style, and tenant-ready.
- East Tech/Titan branding belongs only to the East Tech public guide/school-specific surface.
- `Titan Blend` and `Back To Basics` are retired as active options; Titan direction is absorbed into the East Tech guide.

Repo-local technical identifiers such as `SeniorProjectApp1.0`, `senior-capstone-app`, `senior-capstone-public`, `senior-capstone-db`, and D1 IDs may remain legacy technical identifiers until a separate low-risk infrastructure rename/cutover is planned and verified.

## Product Destination

Build a hosted Capstone Project application for students, mentors, program teachers, administrators, and miscellaneous support/admin users.

The revised MVP is a secure, database-centered web app. It is not a static guide, a Figma-only prototype, a Canva asset library, or a fake dashboard. The database, account model, permissions, progress updates, audit logs, and deployment path are the product backbone.

The immediate delivery target is sharper than the full MVP: by Day 7, the project needs a full-fledged alpha where the complete app flow works end to end even though production user accounts do not work yet. Count Monday, 2026-05-18 as Day 1 for this plan; the Day 7 alpha gate is end of day Sunday, 2026-05-24 PT. If a later run uses "seven days from now" language, 2026-05-25 is a buffer day, not the target.

Figma can prototype account flows, data-backed states, role-aware dashboards, and handoff specs, but it must not be treated as the production account system, database, file store, or source of truth. MVP 1.0 requires a real application/backend foundation for identity, authorization, persistent records, private evidence, and audited workflow changes.

MVP 1.0 must support:

- A fully functional database that holds operational capstone data, including users, groups, roles, programs, cohorts, requirements, deadlines, submissions, evidence metadata, review decisions, progress/status history, audit events, announcements, and exports.
- Secure user accounts with hardened username/password login preserved for fake `.test` accounts, local smoke tests, approved fallback/break-glass access, and current alpha proof, while Google Workspace SSO becomes the preferred production identity target.
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

Day 7 alpha may temporarily defer production user-account readiness. It must still prove the whole user journey through seeded/demo personas, route guards, working forms, persisted or server-owned demo state where practical, dashboard updates, review/status transitions, and clear audit/activity history. First-admin bootstrap is now complete, and fake `.test` role accounts are seeded and login-verified in production D1 for alpha walkthrough/testing. Do not let password reset, invitation, account import, Google Workspace SSO configuration, or remaining account hardening block the Day 7 alpha.

Figma and Canva are major first-class inputs to the product experience. Figma should drive functional UI design, role-aware screens, implementation-ready specs, state coverage, and guided prototype/page annotations that explain real app progress and the next ladder step. Canva should create stunning supporting images and visual assets that make the app feel polished without baking important live text or private data into images.

This project is not finished when it looks good. It is finished when the hosted app can safely manage real student workflow and staff visibility from a secure database-backed foundation.

Production surfaces must stay classified and enforced. The canonical production app/backend, generated public companion, internal alpha/QA pages, stakeholder review options, generated mirrors, and legacy redirects must not blur together. Production-classified routes must not expose dev/test language, fake-account UX, alpha/smoke panels, stakeholder option labels, or claims that unfinished backend features are complete. The production-surface checker must block those leaks before deployment.

## Tenant-Based School Subscription And Google Workspace SSO Direction

The long-term product direction is a school-subscribed, tenant-aware SaaS application. Each school tenant needs explicit tenant status, subscription status, verified domains, identity-provider configuration, role/scope assignments, evidence storage mode, export/offboarding posture, and audit/retention policy.

Preferred production identity is Google Workspace SSO through a backend OpenID Connect authorization-code flow. Local username/password remains available for fake `.test` accounts, local smoke tests, development, approved break-glass admin access, and explicit fallback while SSO is being configured and proven. SSO must not block current fake-account testing.

The Google OAuth `hd` request parameter is only a login-screen hint. It is not an access-control boundary. Tenant access must be enforced from the returned and verified ID-token claims, including issuer, audience, expiration, verified email, subject, nonce/state, and hosted-domain policy when a Workspace domain restriction is configured. Login scopes stay minimal: `openid email profile`; Drive scopes are not part of login.

No SSO route is pilot-ready until the Cloudflare Pages environment variables, Google Cloud OAuth web-client redirect URI, tenant domain records, ID-token verification, local/mock tests, and hosted fake-account regression checks pass. This plan describes a FERPA-aligned implementation direction only; it does not claim FERPA compliance.

Evidence storage direction stays separate from login identity. The current MVP uses the app-managed Google Drive evidence repository and D1 stores workflow metadata, review state, access state, and audit rows rather than private file bytes. The target direction supports tenant/school-owned Google Workspace Drive or service-account resources once Bryan approves ownership, folder policy, and offboarding mechanics.

Tenant offboarding must disable tenant access, preserve and export tenant data, provide a school-owned copy when policy allows, keep audit/retention requirements explicit, and avoid destructive deletion by default.

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

The foundation is started but not complete. Current verified state:

- Exists: Cloudflare Pages/Functions scaffold, `wrangler.jsonc`, package scripts, local dev path, CI check rail, and production Pages deployment evidence.
- Exists: hardened username/password pilot auth endpoints for bootstrap, login, logout, session lookup, session cookies, and audit events.
- Exists: D1 migration `0001_foundation` for users, credentials, sessions, roles, assignments, programs, cohorts, groups, requirements, progress, submissions, reviews, comments, evidence metadata, announcements, exports, deadlines, audit events, and app settings.
- Exists: Google Drive evidence repository choice, evidence root/index records, and environment configuration. Missing: server-side Drive credential/OAuth implementation, real file-byte upload, access-controlled retrieval, deletion/replacement rules, and broader evidence-access tests.
- Exists: permission helpers and alpha persona scoping. Missing: broad production-grade permission tests for student-own, mentor-assigned, program/cohort teacher, admin, and narrow misc admin access.
- Exists: first admin, fake `.test` alpha role accounts, seeded cohort/group/mentor/proposal/progress/submission/evidence fixtures, and audit evidence in production D1.
- Exists: Node test runner, alpha state-machine tests, alpha contract checker, automation contract checker, and test-account seed tests. Missing: broader auth, workflow, permission, evidence, export, meeting, and presentation-slot tests.
- Exists: local/preview/production environment templates and Cloudflare secret setup notes. Missing: verification after each new post-push deployment and backup/restore/retention hardening before pilot use.

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
- Production login, password reset, invitations, account import, credential lifecycle, Google Workspace SSO configuration, and full server-side account hardening are not required for Day 7 alpha. First-admin bootstrap has been completed and should stay behind the alpha flow as production hardening, not as a Day 7 walkthrough dependency.
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

Bryan's current delivery pressure is to reach an MVP in 100 automation passes or fewer over roughly the next 45 days. The current active automation contract is Functionality UX Upgrade (`functionality-ux-upgrade-hourly`), focused on safe product-readiness improvements, tests, verifiers, and clear handoffs.

The pass budget should bias every lane toward reducing implementation ambiguity:

- Figma slices should name routes, data fields, permission scopes, states, interactions, and acceptance checks.
- Core rebuild slices should prioritize shipped scaffold, schema, auth/permission tests, progress/audit persistence, and Cloudflare preview evidence.
- Audit slices should turn gaps into owner-specific findings with acceptance checks, not broad restatements.
- Canva slices should support app placement and live-text discipline, not decorative drift.

The target is not "100 design passes." It is 100 total compounding passes toward a secure hosted MVP.

### Real Daily MVP Goal

The current Functionality UX Upgrade automation is the only active automation contract. The real delivery goal is evidence-based accepted MVP progress, not counted scheduled starts.

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

Automation adjustment rule for this project only: use `docs/functionality-ux-growth-ledger.md`, `automation/state/functionality-ux-growth-state.json`, and recent committed evidence to recalibrate the next safe Functionality UX Upgrade target. Do not add or document another active automation without explicit future instruction.

### 2026-05-18 Historical Baseline After Figma And Automation Catch-Up

The 2026-05-18 morning work materially improved the implementation runway, but at that point it had not yet created the hosted database-backed app. Treat the repo state through commit `08660f3` as the historical 100-pass baseline; later bullets in this plan record the current shipped scaffold, D1, auth, alpha, and automation state:

- Operating base was stronger by that baseline: the project had MVP requirements, structured run manifests, a human-decision queue, artifact registry, publication/commit-push requirements, and non-interactive project-script rules. Current ownership is the split builder model in the Split Builder Master-Plan Orchestrator section.
- Stack direction is accepted and later refined: `HD-2026-05-18-001`, ADR-0001, and `D-2026-05-18-019` select the GitHub-to-Cloudflare path with Cloudflare Workers/Pages, D1, hardened username/password pilot auth until school SSO is available, Google Drive as the MVP evidence repository, server authorization, and audit logging. R2 is only a future fallback if enabled and approved.
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

## Functionality UX Upgrade Automation

### Current Automation Contract

The only active automation is Functionality UX Upgrade (`functionality-ux-upgrade-hourly`). It should produce real app/product-readiness progress, tests/verifiers, and accurate handoff state without weakening auth, RBAC, privacy, deployment, or production-data boundaries.

Each pass picks a bounded safe slice, names the master-plan section and MVP requirement IDs it advances, checks recent ledger/state entries to avoid repeating stale work, and prefers the highest-risk incomplete requirement that can be advanced from the current repo state.

### Updated 100-Pass Allocation From Current State

Early foundation work is no longer hypothetical: the repo already has the Cloudflare Pages/Functions scaffold, D1 migration, hardened auth bootstrap/login/session endpoints, D1-backed alpha state API, fake login-capable alpha accounts, first-admin proof, CI, and alpha tests. Use the remaining 100-pass budget in this order until weekly evidence recalibrates it:

1. Permission and evidence safety: broaden auth, permission helper, protected evidence, denied-access audit, export, meeting, and presentation-slot tests.
2. Source framework seed: implement the seed loader for `data/capstone-framework.json`, requirements, sections, quality checks, deadlines, credit owners, and review gates.
3. Real workflow endpoints: move proposal/research, evidence metadata, teacher review, revision, approval, status history, dashboard aggregate, and audit changes beyond the single alpha demo-state endpoint.
4. Google Drive evidence implementation: add server-side credential/OAuth handling, upload/retrieval assumptions, access-controlled redirects/downloads, provider-unavailable states, deletion/replacement rules, and retention/audit behavior.
5. Account lifecycle and admin provisioning: implement invitation/import, password reset, credential rotation, disabled/reset-required states, user/group/program/cohort assignment flows, and misc-admin denial tests.
6. Mentor, presentation, admin ops, announcements, and exports: implement meeting attendance, make-up linkage, outline gates, presentation-slot conflicts, audited check-out/check-in, one-way announcements, export/archive lifecycle, and audit redaction.
7. Deployment and operations: verify each post-push Cloudflare deployment, broaden CI, document backup/restore posture, scan for secrets/private data, and keep mobile/accessibility QA current.
8. Pilot readiness: staff provisioning checklist, seed/demo data posture without real student records, custom-domain readiness, final security/privacy audit, and Bryan-facing pilot checklist.

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

- Cloudflare Pages/Functions app framework and runtime structure.
- Hybrid auth boundary: hardened username/password remains for fake `.test`, local, development, approved fallback, and break-glass use while Google Workspace SSO is the preferred production target.
- Cloudflare D1 database with SQL migrations.
- Private upload/file storage through a Google Drive evidence repository for MVP, with Cloudflare R2 treated as a future fallback only if enabled and approved.
- Migration-first schema management; do not introduce an ORM unless it removes real complexity.
- GitHub-to-Cloudflare deployment workflow.
- Environment/secrets strategy.
- Test runner and CI.
- Backup/export posture.
- Custom domain cutover checklist.

No automation should call the app pilot-ready or safe for real student records until the remaining permission, evidence, account-lifecycle, deployment, backup, and privacy gaps are tested.

Verified setup and remaining order:

1. Done: scaffold Pages/Functions runtime, package scripts, local dev command, test runner, CI workflow, deployment config, and environment templates.
2. Done: add D1 migration tooling and first database tables for users, groups, memberships, roles, programs, cohorts, progress, submissions, reviews, evidence metadata, announcements, exports, deadlines, and audit events.
3. Done for alpha: add persona/role switching plus seeded/demo state for student, teacher, mentor, admin, and misc admin.
4. Done for alpha: wire student, teacher, mentor, admin, and misc-admin alpha routes to D1-backed server-owned demo state and status transitions.
5. Done for foundation: add hardened username/password auth/session integration for bootstrap, login, logout, and session lookup. Remaining: account lifecycle, credential rotation, reset-required/disabled states, import/invitation, and broader tests.
6. In progress: add server-side permission helpers. Remaining: broad permission and protected-record tests before real records.
7. Remaining: add Google Drive upload credential/OAuth and storage access patterns before accepting real uploads.
8. In progress for alpha: dashboard metrics derive from alpha/server-owned state. Remaining: production dashboard aggregates from D1 workflow records.
9. Remaining: consume Figma implementation specs in real routes/components as each workflow endpoint is implemented.

Current stack pressure:

- `HD-2026-05-18-001` is accepted for the production stack.
- `docs/architecture/adr-0001-stack-auth-database-upload.md` is the accepted Cloudflare-oriented ADR.
- `D-2026-05-18-019` accepted the initial no-district-SSO hardened username/password pilot and Google Drive evidence repository path; this is now superseded as the permanent direction by the tenant-based Google Workspace SSO target while local auth remains as a bounded fallback.
- Cloudflare Pages project `senior-capstone-app`, D1 database `senior-capstone-db`, migration `0001_foundation`, Google Drive evidence root folder, Google Drive evidence index sheet, first admin, and four fake `.test` alpha role accounts are now provisioned and recorded in `docs/backend-setup.md`.
- `SC-005` remains in progress: scaffold, D1, auth foundation, alpha state, first admin, fake role accounts, and CI exist; Drive upload credentials/OAuth, broad permission/protected-evidence tests, account lifecycle, and production workflow endpoints remain incomplete.
- Rebuild should prioritize tests, real workflow endpoints, Drive evidence implementation, account lifecycle, and deployment verification over broad new design or static-site polish.

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

For automation control, this file is the master planner. The pass logger is `docs/progress/run-log.md` plus the structured manifest written to `docs/progress/runs/` and the lane/report log. If the builder or oversight automations change those operating rules, the run must update the relevant project lock, automation docs, or verifier script in the same pass.

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
- Let alpha, smoke, stakeholder review, generated output, or legacy routes appear to be the canonical production app.
- Link normal production navigation to fake-account, alpha reset/report, internal smoke, or stakeholder option pages.
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
- Did the Functionality UX Upgrade ledger/state update the next recommended work from evidence instead of vibes?
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
