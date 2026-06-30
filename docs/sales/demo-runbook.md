# Sales Demo Runbook

## Demo Purpose

This is an internal Bryan runbook for a fake-data, multisite Capstone Project demo for school and district administrators.

For the hosted live click-around order, use `docs/sales/demo-day-operator-script.md` first. This runbook remains the broader proof and fallback reference.

Use it to show how the current MVP helps school operations teams answer:

- Which students need attention?
- Which teachers have work waiting for review?
- Which students are missing mentors?
- Which students are ready for presentation or archive closeout?
- Which roles can see which information?

This demo is a fake-data demo only. Hosted fake-account click-around proof is green, but it is not a real student-data pilot, FERPA certification claim, billing claim, or final production-readiness claim.

## Claims Legend

- Proven locally: automated local seed/proof/tests currently verify this behavior.
- Fake-data demo only: the demo uses synthetic `.test` users and seeded records.
- Hosted fake-account pilot proof ready: the 2026-06-29 pass added hosted fake-account browser/screenshot proof for the main click-around roles. The older synthetic hosted sales-demo seed gate is separate and currently reports missing remote demo seed data.
- Planned / future: a useful next capability, but not built or proven in this phase.
- Not claimed: do not state or imply this in sales conversations.

## What This Demo Proves

| Area | Claim label | Proof |
| --- | --- | --- |
| Multisite foundation | Proven locally | Desert Valley School District has three fake sites: 250 primary-site students and 60 students at each secondary site. |
| Site Dashboard | Proven locally | `/api/site/dashboard`, integration tests, and `npm run prove:demo:local`. |
| Student Directory | Proven locally | `/api/site/students` with selected-site pagination, filters, story/risk chips, and no cross-site leakage. |
| Student Detail / Timeline | Proven locally | `/api/site/students/:studentId` and `/api/site/students/:studentId/timeline` with bounded, redacted data. |
| Program Teacher Review Queue | Proven locally | `/api/site/review-queue`; program teachers can review only scoped submitted work in tests. |
| Mentor Assignments | Proven locally | `/api/site/mentor-assignments`; read/list proof is local and assignment mutation proof is integration-tested. |
| Operations Readiness | Proven locally | `/api/site/operations-readiness` shows presentation, archive, and attention worklists. |
| Viewer read-only mode | Proven locally | Viewer receives read-only UI and mutation permissions false. |
| No announcements/student messaging | Proven locally | Announcement routes are removed from active MVP surfaces; workspace has no announcement UI. |
| Product shell / Figma alignment | Proven locally | Workspace tests cover product header, site context, cards, filters, chips, drawer, and problem states. |
| Redaction | Proven locally | Tests/proof check for raw Drive IDs, storage IDs, token/password/setup fields, and unsafe audit metadata. |

## What This Demo Does Not Yet Prove

| Area | Claim label | Safe wording |
| --- | --- | --- |
| Hosted demo readiness | Fake-account pilot proof ready | "The hosted fake-account pilot proof is green for fake-account click-around only; real-student production is not claimed." |
| Real student data readiness | Not claimed | "This uses fake data only today." |
| Billing/subscription readiness | Not claimed | "Billing is outside this MVP demo." |
| Tenant-owned Drive migration | Planned / future | "Current proof avoids raw storage IDs; tenant-owned storage policy is future work unless separately proven." |
| Real school onboarding | Planned / future | "A pilot would need legal, security, SSO, data ownership, and onboarding approval." |
| Remote seed write | Not current for hosted sales demo | "The legacy synthetic hosted sales-demo gate currently reports missing remote demo seed data; the fake-account click-around proof is separate." |
| FERPA/compliance certification | Not claimed | "This demo is designed around privacy-aware roles and redaction, but it is not a compliance certification." |
| Archive retry/export mutation UI | Planned / future | "Archive retry/export controls are not built in this phase." |
| Presentation scheduling mutation UI | Planned / future | "Presentation scheduling/check-in workflows remain separate from the Phase 12 worklists." |
| District procurement/security approval | Not claimed | "A real district review remains a next step." |

## Demo Environment

- Local dev demo: Proven locally.
- Hosted live walkthrough: use the fake-account sequence in `docs/sales/demo-day-operator-script.md`.
- Data: fake-data demo only.
- Organization: Desert Valley School District.
- Primary site: Desert Valley High School, 250 fake students.
- Secondary sites: Canyon Ridge Career Academy and North Valley Technical High School, 60 fake students each.
- Total fake students: 370.
- Demo users use fake `.test` domains only.
- Credentials stay in ignored `.secrets` files.
- Do not paste, screenshot, or show passwords, credential files, Cloudflare tokens, OAuth secrets, or raw D1 tables during an administrator demo.
- No real student data is seeded or claimed.

## Local Demo Reset Checklist

Run these from `C:\SeniorProjectApp1.0`:

```powershell
npm run seed:demo:local:reset
npm run prove:demo:local
npm run prove:sales-demo:local
```

Expected results:

- `3` fake sites.
- `370` fake students total.
- Desert Valley High School has exactly `250` students.
- Canyon Ridge Career Academy has exactly `60` students.
- North Valley Technical High School has exactly `60` students.
- No announcements.
- No student credentials.
- Site dashboard, directory, detail/timeline, review queue, mentor assignments, and operations readiness proof all pass.
- Viewer read-only proof passes.
- Program teacher scoping proof passes.
- No raw Drive/storage/secrets appear in proof output.

## Demo Personas

For hosted fake-account demos, use `docs/sales/demo-day-operator-script.md` for the current role order and fake `.test` account labels. For local Desert Valley demos, use the credential values from the latest ignored `.secrets/demo-staff-logins-*.json` file. Do not show or paste any credential file.

| Order | Persona | Fake email | Role | Scope | Demo use |
| ---: | --- | --- | --- | --- | --- |
| 1 | Avery Administration | `admin.desert-valley-high@demo-staff.capstone.test` | Administration | Desert Valley High School | Main site operations path. |
| 2 | Primary IT Program Teacher | `teacher-it-01@demo-staff.capstone.test` | Program Teacher | IT program | Review queue and scoped teacher view. |
| 3 | Valeria Viewer | `viewer.desert-valley-high@demo-staff.capstone.test` | Viewer | Desert Valley High School | Read-only proof. |
| 4 | Primary Mentor | `mentor001@demo-staff.capstone.test` | Mentor | Assigned students | Assigned-student-only mentor dashboard. |
| 5 | Owen District | `org.admin@demo-staff.capstone.test` | Organization Admin | Desert Valley School District | District/multisite framing if needed. |
| 6 | Priya Platform | `platform.admin@demo-staff.capstone.test` | Platform Admin | Platform-wide | Technical/admin escalation only. |

Session hygiene:

- Use a clean browser profile or private window.
- Log out between personas.
- Keep `.secrets`, password files, Cloudflare token screens, OAuth screens, and raw database tools closed.
- Do not show raw internal IDs unless the audience is technical and asked for a proof explanation.

## Demo Story Students

Search by these prefixes in the Students section or use them in worklist filters:

| Prefix | Claim label | Use |
| --- | --- | --- |
| Model Excellent Demo | Proven locally | Show a strong completed student story. |
| Missing Mentor Demo | Proven locally | Show mentor coverage and assignment need. |
| Awaiting Review Demo | Proven locally | Show teacher review queue. |
| Revision Loop Demo | Proven locally | Show feedback loop, status history, and timeline. |
| Presentation Pending Demo | Proven locally | Show presentation readiness attention. |
| Archive Ready Demo | Proven locally | Show closeout/archive-ready story. |
| Archive Failed Demo | Proven locally | Show archive/export failure worklist without storage IDs. |
| High Risk Demo | Proven locally | Show risk/attention scan. |
| Rich Timeline Demo | Proven locally | Show evidence, reviews, mentor meetings, presentation, archive, and timeline in one detail drawer. |

## Demo Data Dictionary

- Fake organization: Desert Valley School District.
- Fake sites: Desert Valley High School, Canyon Ridge Career Academy, North Valley Technical High School.
- Fake roles: platform admin, organization admin, site Administration, viewer, program teacher, mentor, student.
- Story buckets: `model_excellent`, `missing_mentor`, `awaiting_review`, `revision_requested`, `presentation_pending`, `archive_ready`, `archive_failed`, `high_risk`, `rich_timeline`.
- Submission statuses: `draft`, `submitted`, `under_review`, `revision_requested`, `approved`, `blocked`, `archived`, `complete`.
- Presentation statuses: `ready`, `pending`, `scheduled`, `completed`, `missing`, `outline_pending`, `outline_revision_needed`, `attention_required`.
- Archive statuses: `ready`, `complete`, `failed`, `missing`, `queued`, `running`, `expired`, `expiring_soon`, `provider_unavailable`.
- Risk values: `high`, `medium`, `low`, `stale`, `no_mentor`.
- Realistic fake data: student names, sites, programs, submissions, evidence metadata, comments, reviews, mentor meetings, presentation slots, archive/export state.
- Not real: students, parents, staff, passwords shown on screen, district records, Drive files, legal approvals, billing, procurement status.

## Recommended Demo Flow

### 1. Sign In / Product Framing

- Persona: Avery Administration.
- Page: `workspace.html`.
- Click: sign in with the fake site-administration account.
- Point out: "This is a school-operations workspace for capstone visibility."
- Say: "This is fake data only. Local proof, hosted API/data proof, and hosted fake-account browser proof are complete for click-around readiness."
- Do not claim: real student readiness, production readiness, or compliance certification.
- Fallback: if login fails, run `npm run prove:sales-demo:local`, then use this runbook and the one-page leave-behind to continue the story honestly.

### 2. Site Dashboard

- Persona: Avery Administration.
- Section: Site Dashboard.
- Click: site dashboard navigation.
- Point out: 250 students at Desert Valley High School, selected-site metrics, risk and readiness signals.
- Say: "The dashboard is site-scoped, not a global pile of student data."
- Do not claim: this is live district data.
- Fallback: use `docs/sales/technical-proof-checklist.md` row for Site Dashboard.

### 3. Student Directory Filters

- Persona: Avery Administration.
- Section: Students.
- Click: filters for story/risk/no mentor/search.
- Search: `Missing Mentor Demo`, then `Revision Loop Demo`.
- Point out: directory state, status pills, story/risk chips, selected-site scope.
- Say: "Administrators can find students by operational story, not just by name."
- Do not claim: student messaging or Canvas replacement.
- Fallback: use the local proof counts and story-map doc.

### 4. Student Detail / Timeline

- Persona: Avery Administration.
- Section: Students.
- Search: `Rich Timeline Demo`.
- Click: View detail.
- Point out: summary, progress, submissions, evidence, reviews/comments, mentor, presentation, archive, timeline.
- Say: "This is the capstone story in one place, with bounded sections and redaction."
- Do not claim: raw Drive files are exposed or downloaded here.
- Fallback: search `Model Excellent Demo` or use `Revision Loop Demo`.

### 5. Program Teacher Review Queue

- Persona: Primary IT Program Teacher.
- Section: Review Queue.
- Click: submitted rows and selected submission panel.
- Search/filter: IT-scoped submitted or `Awaiting Review Demo`.
- Point out: approve, request revision, comment-only controls only for the scoped program teacher.
- Say: "Teachers review their scoped work; site admins can inspect read-only."
- Do not claim: every staff role can review or mutate.
- Fallback: explain mutation is covered in integration tests and local proof keeps demo state repeatable.

### 6. Mentor Assignments

- Persona: Avery Administration.
- Section: Mentor Assignments.
- Filter: no mentor.
- Search: `Missing Mentor Demo`.
- Point out: missing mentor list, active mentor coverage, assign form for authorized managers.
- Say: "This resolves a common operations gap: which students still need an adult connection?"
- Do not claim: reassign/deactivate controls are built; they are planned/future.
- Fallback: show read-only coverage if you do not want to mutate local demo state.

### 7. Operations Readiness

- Persona: Avery Administration.
- Section: Operations.
- Filters: `presentation_pending`, `archive_failed`, `archive_ready`, `high_risk`.
- Search/show: `Presentation Pending Demo`, `Archive Failed Demo`, `Archive Ready Demo`, `High Risk Demo`.
- Point out: presentation readiness, archive readiness, and attention rows.
- Say: "This helps staff see who is ready to present, who is blocked, and who needs follow-up before closeout."
- Do not claim: scheduling, check-in/check-out, or archive retry/export mutation exists here.
- Fallback: open row detail for `Rich Timeline Demo` to show context.

### 8. Viewer Read-Only Mode

- Persona: Valeria Viewer.
- Section: Dashboard, Students, Review Queue, Mentor Assignments, Operations.
- Point out: read-only marker and no mutation controls.
- Say: "Some roles need visibility without the ability to change records."
- Do not claim: viewers can approve, assign, or manage users.
- Fallback: show technical proof matrix if time is short.

### 9. Optional Mentor / Student Surfaces

- Persona: Primary Mentor.
- Section: Mentor dashboard.
- Point out: assigned students only.
- Student self-service: optional only if the local account flow is prepared; student credentials are not created by the multisite seed.
- Do not claim: parent messaging or student chat exists.

### 10. Close With Next Gates

- Say: "The local fake-data MVP is ready to demo. Hosted fake-account pilot proof is green for fake-account click-around only."
- Do not claim: real-student pilot readiness or compliance certification.

## Role-Based Demo Paths

### Site Administration

- Purpose: school-wide operational visibility.
- Can see: selected-site dashboard, directory, detail, review queue read-only, mentor assignment management, operations readiness.
- Cannot do: platform security, user management, archive retry/export mutation, presentation scheduling in Operations.
- Demo: Dashboard -> Students -> Detail -> Mentor Assignments -> Operations.
- Avoid: claiming full district or compliance readiness.

### Program Teacher

- Purpose: review scoped student work.
- Can see: scoped dashboard, scoped Review Queue, scoped Students/detail, scoped Operations read-only.
- Can do: approve, request revision, or comment-only feedback for in-scope submitted work.
- Cannot do: see full site, assign mentors, manage users, archive retry/export.
- Demo: Review Queue -> selected submission -> feedback controls.
- Avoid: broad admin claims.

### Viewer

- Purpose: visibility without mutation.
- Can see: assigned-site operational views.
- Cannot do: approve, assign, schedule, retry archive, manage users/security.
- Demo: read-only marker and absent mutation controls.
- Avoid: showing any mutation affordance as available.

### Mentor

- Purpose: assigned-student support.
- Can see: assigned-student mentor dashboard.
- Cannot do: site operations route, full directory, review mutation, mentor assignment management.
- Demo: mentor dashboard only.
- Avoid: claiming mentors see full site data.

### Optional Student

- Purpose: self-service context.
- Can see: own dashboard and archive readiness path where safely configured.
- Cannot do: site admin routes, other student data, staff worklists.
- Demo: optional only when a safe student credential path exists.
- Avoid: implying the multisite seed creates student login credentials.

## 7-Minute Quick Demo

| Time | Step | Persona | Script |
| --- | --- | --- | --- |
| 0:00-0:45 | Open | Avery Administration | "This is fake local data showing how a school team can run senior projects from one operations view." |
| 0:45-1:45 | Site Dashboard | Avery | "Here is the selected school: 250 fake students, risk signals, review pressure, mentor coverage, and readiness." |
| 1:45-2:45 | Students | Avery | Search `Revision Loop Demo`: "We can find the student story quickly." |
| 2:45-3:45 | Detail | Avery | Open `Rich Timeline Demo`: "Here is evidence, reviews, mentor, presentation, archive, and timeline in one drawer." |
| 3:45-4:45 | Review Queue | IT Teacher | "Teachers see scoped work and can review submitted items." |
| 4:45-5:45 | Mentor Assignments | Avery | Filter missing mentors: "Administration can see coverage gaps." |
| 5:45-6:30 | Operations | Avery | Filter archive failed/presentation pending: "Closeout worklists show who needs staff follow-up." |
| 6:30-7:00 | Close | Avery | "This is fake data. Local proof, hosted API/data proof, and hosted fake-account browser proof are ready for click-around only." |

## 15-Minute Deeper Demo

| Time | Step | Persona | Script |
| --- | --- | --- | --- |
| 0:00-1:00 | Opening | Avery | "This is not replacing Canvas or messaging. It is an operations layer for capstone progress." |
| 1:00-2:30 | Site Dashboard | Avery | Show selected-site metrics and explain 250/60/60 multisite proof. |
| 2:30-4:00 | Student Directory | Avery | Search `Missing Mentor Demo`, filter risk/story, show selected-site rows. |
| 4:00-6:00 | Detail / Timeline | Avery | Open `Rich Timeline Demo`; move through Summary, Evidence, Reviews, Mentor, Presentation, Archive, Timeline. |
| 6:00-8:00 | Review Queue | IT Teacher | Show scoped queue, submitted work, feedback box, and decision controls. Explain mutation is program-teacher scoped. |
| 8:00-10:00 | Mentor Assignments | Avery | Show missing mentors, mentor loads, active assignments, and reason-required assign form. Do not reassign/deactivate. |
| 10:00-12:00 | Operations | Avery | Show Presentation Pending, Archive Failed, Archive Ready, High Risk filters. Open a row detail. |
| 12:00-13:00 | Viewer | Valeria Viewer | Show read-only marker and absent mutation controls. |
| 13:00-14:00 | Mentor | Primary Mentor | Show assigned-student-only view. |
| 14:00-15:00 | Caveats / Next Gate | Avery | Say hosted fake-data API proof is ready; next step is browser/persona/screenshot proof without exposing credentials. |

## Talking Points For Administrators

- "This shows who needs attention."
- "This is not replacing Canvas, Remind, Google Classroom, Infinite Campus, email, or district-approved messaging."
- "The demo uses fake data today."
- "The views are role-scoped: administration, teacher, viewer, mentor, and student paths are different."
- "Private evidence and audit-sensitive operations are treated carefully; raw storage identifiers are not shown in the demo APIs."
- "A real pilot needs legal, security, data ownership, SSO, and hosted proof gates."

## Do Not Show During Demo

- `.secrets`
- Password JSON files
- Raw Cloudflare token or environment-variable screens
- Raw Google OAuth client secret screens
- Raw Drive IDs or Drive parent folder IDs
- D1 tables with internal IDs unless this is a technical review
- Unfinished alpha pages unless intentionally explaining history
- Internal run manifests unless needed for technical proof
- Credential files
- Browser tabs with tokens, secrets, private URLs, or password material

## Live Demo Fallback Plan

- Login fails: log out, clear the private window, verify the fake credential source is available without showing it, and run `npm run prove:sales-demo:local`.
- Persona fails: switch back to Avery Administration and explain the role path is covered by local proof/tests.
- Local dev server fails: restart with `npm run dev`; use the runbook, one-page leave-behind, and technical proof checklist while it starts.
- Section loads slowly: pause on the current screen and explain the route/proof mapping; refresh once.
- Browser state looks wrong: use a new private window and avoid showing credential files.
- Hosted question comes up: say, "Hosted fake-account browser proof is green for fake-account click-around only; the older synthetic hosted sales-demo API seed gate currently reports missing remote demo seed data."

## Technical Proof Matrix

| Demo screen | Route(s) | Test file | Local proof | Hosted status | Notes |
| --- | --- | --- | --- | --- | --- |
| Site Dashboard | `/api/site/dashboard` | `tests/site-dashboard.integration.test.mjs` | `npm run prove:demo:local` | Fake-account role surface proven; legacy seed missing | Selected-site local proof plus hosted Site Admin first-load screenshot. |
| Student Directory | `/api/site/students` | `tests/site-students.integration.test.mjs` | `npm run prove:demo:local` | Fake-account viewer surface proven; legacy seed missing | Filters, pagination, story/risk, no cross-site leakage are local/API proof. |
| Student Detail | `/api/site/students/:studentId` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | Legacy hosted seed missing | Bounded sections, redaction, role scope are local/API proof. |
| Timeline | `/api/site/students/:studentId/timeline` | `tests/site-student-detail.integration.test.mjs` | `npm run prove:demo:local` | Legacy hosted seed missing | Rich Timeline Demo event types are local/API proof. |
| Review Queue | `/api/site/review-queue` | `tests/site-review-queue.integration.test.mjs` | `npm run prove:demo:local` | Fake-account Program Teacher surface proven; legacy seed missing | Mutation proof is integration-tested. |
| Mentor Assignments | `/api/site/mentor-assignments` | `tests/site-mentor-assignments.integration.test.mjs` | `npm run prove:demo:local` | Fake-account Site Admin surface proven; legacy seed missing | Assignment mutation proof is integration-tested. |
| Operations Readiness | `/api/site/operations-readiness` | `tests/site-operations-readiness.integration.test.mjs` | `npm run prove:demo:local` | Fake-account Admin/misc surfaces proven; legacy seed missing | Presentation/archive/readiness worklists are local/API proof. |
| Viewer read-only | Multiple site routes | `tests/site-aware-permissions.test.mjs`, workspace tests | `npm run prove:demo:local` | Fake-account viewer browser proven | Mutation permissions false. |
| No announcements | Route inventory/workspace/seed tests | `tests/production-workflow-source.test.mjs`, `tests/workspace-app.test.mjs` | `npm run prove:demo:local` | Remote proven | No active announcements UI/routes/seeds. |
| Redaction | All site routes | Integration and source tests | `npm run prove:sales-demo:local` | Fake-account browser no-secret check; legacy seed missing | No raw Drive/storage/secrets in responses. |
| Route inventory | Generated inventory | `tests/production-workflow-source.test.mjs` | `npm run check:route-inventory` | No route changes | Inventory includes current site routes. |

## Role Access Matrix

| Role | Current local demo behavior | Claim label |
| --- | --- | --- |
| Platform admin | Can view active site routes across fake sites; platform/security claims remain narrow. | Proven locally |
| Legacy admin | Platform-equivalent for current transition; preserves compatibility. | Proven locally |
| Organization admin | Can view assigned tenant sites. | Proven locally |
| Site Administration | Can view/manage assigned-site operations according to capability helpers. | Proven locally |
| Viewer | Assigned-site read-only; no mutation permissions. | Proven locally |
| Program teacher | Scoped to selected-site program/cohort; review mutation only for in-scope submitted work. | Proven locally |
| Mentor | Assigned students only through mentor dashboard/detail support paths. | Proven locally |
| Student | Own self-service only; site admin routes denied. | Proven locally |
| Misc admin | Narrow/aggregate legacy role; site operations routes denied. | Proven locally |

## Known Caveats

- Legacy synthetic hosted sales-demo API proof currently reports missing remote demo seed data.
- Hosted fake-account browser/persona/screenshot proof is green for fake-account click-around only.
- Hosted `/api/health` currently needs to report `databaseReady=true` and `studentRosterProfilesReady=true` before demoing Add Student or CSV roster profile fields. If either signal turns false, pause those create/import demos until the migration gate is repaired.
- `student_archive_manifest_download` remains skipped/not ready.
- Archive retry/export mutation UI is deferred.
- Presentation scheduling/check-in/check-out mutation UI is not part of Operations.
- Mentor reassign/deactivate is deferred.
- Real onboarding policy, SSO policy, legal/security review, data ownership, retention, and district approval are needed before real data.
- FERPA/legal/security certification is not claimed.
- Tenant-owned Drive storage/data export policy is future work unless separately proven.

## Before Live Hosted Demo Checklist

1. Open `docs/sales/demo-day-operator-script.md` and follow that hosted role order.
2. Confirm `/api/health` reports `databaseReady=true` and `studentRosterProfilesReady=true`.
3. Run hosted smoke proof using fake `.test` credentials only.
4. Run `npm run check:workspace:hosted-permissions`, `npm run check:workspace:hosted-dashboard`, and `npm run check:workspace:hosted-evidence` when the demo needs fresh hosted proof.
5. Run `npm run prove:hosted-fake-pilot-browser` when screenshots or browser proof need a fresh manifest.
6. Confirm the legacy synthetic hosted sales-demo proof status if asked. Current expected result remains `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING` unless a new approved remote demo seed has run.
7. Do not run remote migrations, remote seed writes, remote resets, deploys, OAuth changes, or credential commands during the live demo without a separate approval gate.
8. Use the hosted screenshot index or capture replacement screenshots only if the credential path is safe and date/environment labels are preserved.
9. Run final no-secret scan.
10. Confirm Bryan/admin account still works if it is part of the technical follow-up.
11. Confirm OAuth/domain settings are unchanged.
12. Confirm no remote writes occurred outside the approved gate.

## Sales Demo Do / Do Not

Do:

- Show fake data.
- Focus on administrator visibility.
- Show role scope.
- Show no announcements/student messaging.
- Show read-only viewer mode.
- Show story students.
- Say hosted fake-account pilot proof is green for fake-account click-around only.

Do not:

- Claim FERPA compliance certification.
- Claim production pilot readiness.
- Use real student data.
- Show passwords.
- Show Drive IDs or secrets.
- Overpromise integrations.
- Claim real-student production proof passed.

## Post-Demo Follow-Up Checklist

- Collect administrator questions.
- Note requested integrations.
- Note data ownership concerns.
- Note reporting needs.
- Note approval/security concerns.
- Send the one-page summary.
- Schedule a technical review if needed.
- Proceed to the real-student pilot policy/support/SSO readiness plan only after approval.

## Go / No-Go Table

| Area | Current decision | Reason | Next gate |
| --- | --- | --- | --- |
| Local sales demo | Go | Proven locally with fake data. | Run reset/proof before demo. |
| Hosted sales demo | Go for fake-account click-around | Hosted fake-account browser/screenshots are ready; the legacy synthetic sales-demo API seed gate currently reports missing remote demo seed data. | Keep screenshots current before demos. |
| Remote D1 migration 0011 | Complete | Migration was applied and remains proven. | No further migration without a dedicated gate. |
| Remote D1 migration 0016 | Complete for current hosted proof | Hosted health reports `studentRosterProfilesReady=true`. | No-go for Add Student / CSV roster fields if health flips false. |
| Remote seed 5B | Not current remotely | `npm run prove:sales-demo:hosted` reports `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING`. | No reseed without a new approved gate. |
| District pilot | No-go | Needs legal/security review, data policy, SSO, onboarding, support, retention, and data ownership approval. | Pilot readiness plan. |
| Real student data pilot | No-go | No real student data approval. | Legal/security/data governance approval. |
| FERPA/legal review | Required | Not claimed as complete. | District/legal review. |
| Tenant-owned Drive storage | Future/planned | Current demo uses redacted metadata and example links. | Storage ownership decision and proof. |
