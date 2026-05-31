# Functionality and Language Audit

## 1. Repository Identity

- Repo root: `C:\SeniorProjectApp1.0`
- Branch inspected: `main`
- Starting SHA: `ee0a3d94b77a45bdd5921df20d6c1ffc719c82f5`
- Origin: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`
- Package: `senior-capstone-app`
- Package manager detected: npm scripts through repo PowerShell wrappers
- Audit date/time: 2026-05-24T14:46:20-07:00

This audit is repo-grounded and product-readiness focused. It does not run remote writes, seed data, reset accounts, deploy, change Cloudflare, change OAuth, change domain/DNS, change schema, create users, or weaken authentication, authorization, tenant isolation, site isolation, program scoping, mentor assignment boundaries, or student privacy.

## 2. Audit Passes Completed

| Pass | Focus | Repo evidence inspected |
| --- | --- | --- |
| First pass | Application map | `package.json`, `docs/generated/production-route-inventory.md`, `workspace.html`, `workspace.js`, `workspace.css`, `functions/api/**`, `functions/_lib/**`, `migrations/**`, `tests/**`, `automation/**`, `docs/**` |
| Second pass | User-facing language | High-risk word search across `workspace.js`, `app.js`, `public-companion/app.js`, `alpha.*`, `account.*`, root HTML, generated public companion files |
| Third pass | Workflow functionality | Site dashboard, student directory, student detail/timeline, review queue, mentor assignment, operations readiness, student dashboard, teacher, mentor, viewer, admin, API permissions, tests |
| Fourth pass | Product-readiness language cleanup | Header copy, dashboard card copy, empty states, permission errors, route labels, read-only language, action labels |
| Fifth pass | Prioritization and automation fit | Existing automation prompts, cadence docs, local Codex automation registry, package validation scripts |

## 3. Role Map

| Role | Implemented route/API behavior | Current usable experience | Main gaps |
| --- | --- | --- | --- |
| `platform_admin` and legacy `admin` | Can use broad admin APIs; new helpers treat `platform_admin` and legacy `admin` as platform-capable. | Admin dashboard, audit, users/import, role assignment, review, presentation, archive, readiness. | Legacy route gates still often depend on `admin`; platform-admin route parity needs a bounded conversion plan. |
| `org_admin` | Helper-supported tenant/site visibility; site dashboard, directory, review queue, mentor assignments, operations are available through site helpers. | Can inspect site-scoped surfaces when routed through `/api/site/...`. | No distinct organization dashboard; no tenant-level rollup route; language still says "Organization" but not a real org workspace. |
| `site_admin` / Administration | Helper-supported site operations, student detail, review, mentor assignment, presentation/archive readiness, no platform security. | Site dashboard, students, review queue, mentor assignments, operations in workspace; student detail drawer. | Site-admin mentor POST selection default omits `site_admin` even though permission helper and tests expect site operations management; site selector is future-only. |
| Administration/AP/Principal | Currently represented closest by `site_admin` and `viewer`. | Site dashboard and operations are usable but not explicitly named AP/Principal in UI. | Needs role-specific language and safe read/monitor paths without platform security/reset controls. |
| `viewer` | Read-only site dashboards, student directory/detail, review queue, mentor coverage, operations. | Workspace has read-only banner, hides mutation controls in tested paths, and now surfaces a viewer-only monitoring queue for review work, mentor coverage, and operations follow-up. | Hosted section-level permission-denied proof still needs credentialed runtime; continue avoiding mutation controls. |
| `program_teacher` | Program/cohort-scoped dashboard, review queue, student directory, student detail, operations; review mutation is scoped. | Can review submitted work and open students through existing route-connected sections. | Cannot manage mentor assignments; if product wants teacher mentor assignment, permissions/API need explicit decision and tests. |
| `mentor` | Mentor dashboard and assigned-student-only access through active assignments. | Assigned students only; cannot manage assignments. | Mentor cannot open full site directory; mentor detail experience should be richer around meetings, feedback, recent activity, and next steps. |
| `student` | Own dashboard, submissions/evidence, archive readiness, presentation scope, own record. | Student homepage now has a progress-first dashboard using real requirements/submissions/evidence/mentor data and teacher feedback from own submissions, including submission version/status context. | No full student-specific timeline pages for feedback, phase detail, or due-date timeline. |
| `misc_admin` | Narrow legacy aggregate/readiness behavior. | Readiness/reporting support only; workspace labels the role as `Reporting Viewer` and the report as aggregate-only. | Keep out of principal/AP positioning; future work should improve route semantics only if product policy expands reporting. |

## 4. Route Map

| Surface | Route/path | Main source | Roles seen in code/tests | Notes |
| --- | --- | --- | --- | --- |
| Protected app shell | `workspace.html` | `workspace.js`, `workspace.css` | all authenticated roles | Canonical app workspace. |
| Auth/session | `/api/auth/me`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/google/*`, password routes | `functions/api/auth/**` | all authenticated users | Session and account states are app-visible. |
| Site dashboard | `/api/site/dashboard` | `functions/api/site/dashboard.ts` | platform/admin/org/site/viewer | Read-only viewer supported; no program teacher site dashboard. |
| Student directory | `/api/site/students` | `functions/api/site/students.ts` | platform/admin/org/site/viewer/program_teacher | Filters by program, status, risk, story, presentation, archive, no mentor. |
| Student detail | `/api/site/students/:studentId` | `functions/_lib/site-student-detail.ts` | platform/admin/org/site/viewer/program_teacher/mentor/student self | Staff-only fields are visibility-filtered by role. |
| Student timeline | `/api/site/students/:studentId/timeline` | `functions/_lib/site-student-detail.ts` | same as detail | Bounded timeline; useful for staff detail. |
| Review queue | `/api/site/review-queue` | `functions/api/site/review-queue.ts` | platform/admin/org/site/viewer/program_teacher | Review decisions are scoped and mutation-gated. |
| Mentor assignments | `/api/site/mentor-assignments` | `functions/_lib/site-mentor-assignments.ts` | platform/admin/org/site/viewer/program_teacher for GET; platform/admin/org/site for manage helper | GET supports read-only/scoped views; POST default needs site-admin review. |
| Operations readiness | `/api/site/operations-readiness` | `functions/api/site/operations-readiness.ts` | platform/admin/org/site/viewer/program_teacher | Read-only worklists; student detail open buttons exist. |
| Program teacher dashboard | `/api/program-teacher/dashboard` | `functions/api/program-teacher/dashboard.ts` | program_teacher/admin | Scoped overview and rows. |
| Mentor dashboard | `/api/mentor/dashboard`, `/api/mentor/assigned` | `functions/api/mentor/**` | mentor/admin | Assigned-only mentor experience. |
| Student dashboard | `/api/student/dashboard` | `functions/api/student/dashboard.ts` | student self, scoped staff when allowed | Real progress summary, next steps, mentor support. |
| Presentations | `/api/presentation-slots` and check-in/out | `functions/api/presentation-slots/**` | student, mentor, teacher, admin | Day-of controls are scoped. |
| Archive/readiness | `/api/student/archive/readiness`, `/api/admin/exports/student-archive`, `/api/exports/:id/download` | `functions/api/student/archive/readiness.ts`, `functions/_lib/archive-export.ts` | student/staff/admin scoped | Storage identifiers redacted. |
| Public guide | root HTML + `app.js` | `app.js`, `styles.css`, generated `public-companion/` | public | Some implementation-facing app-preview copy remains. |
| Internal alpha QA | `alpha.html`, `/api/alpha/state` | `alpha.js`, `functions/api/alpha/state.js` | internal QA | Intentionally internal and not production nav. |
| Internal account QA | `account.html` | `account.js` | internal QA | Intentionally fake-account smoke surface. |

## 5. Home Screen Language Review

The authenticated workspace home shell still had product-internal posture copy in `workspace.js`:

- `Database-backed MVP`
- `Cloudflare target`
- `Database-backed MVP - Private evidence - Audit-safe operations`

These phrases can appear to real staff on the protected workspace header. They describe implementation posture, not school work. The safe replacement is school-facing language:

- `Student progress`
- `Mentor coverage`
- `Review queue`
- `Presentation readiness`
- `School workspace`

The public guide has legitimate student project language using "prototype" in curriculum contexts. The public app-preview copy at `app.js` / `public-companion/app.js` previously included stale future-app, backend-readiness, preview-data, source-count, and audit-sensitive wording. The 2026-05-25 public-site slice reframed it as a current Workspace Workflow guide while keeping the signed-in workspace boundary clear.

Internal `alpha.html`, `alpha.js`, `account.html`, and `account.js` contain "internal", "fake", "test", and "demo" copy by design. Those routes are classified as internal QA/smoke routes in `docs/generated/production-route-inventory.md` and should remain isolated from production navigation rather than being cleaned as if they were normal user pages.

## 6. User-Facing Language Issues Found

| File | Current text or pattern | Where it appears | Role(s) affected | Problem | Replacement direction | Safe now? |
| --- | --- | --- | --- | --- | --- | --- |
| `workspace.js` | `Database-backed MVP` | Workspace posture chip/header | staff/admin/viewer/teacher/mentor | Internal implementation maturity language. | `Student progress` or `School workspace` | Yes |
| `workspace.js` | `Cloudflare target` | Workspace posture chip | staff/admin/viewer/teacher/mentor | Infrastructure vendor language. | `Presentation readiness` or `Mentor coverage` | Yes |
| `workspace.js` | `Audit-sensitive admin` | Workspace posture chip | staff/admin/viewer | Technical and ominous. | `Audited changes` where needed | Yes |
| `workspace.js` | `Role-Safe Priorities` | Role-pending overview | all if role pending | Reads like internal RBAC vocabulary. | `Your workspace priorities` | Yes |
| `workspace.js` | `Permission denied` | Permission boundary cards | all denied users | Technical/error-first. | `You do not have access to this section` | Yes |
| `workspace.js` | `assigned site operating records` | Permission detail | staff | Awkward system language. | `records for this assigned school` | Yes |
| `workspace.js` | `Directory viewed, denied, and unauthorized paths are recorded...` | Student directory posture card | staff | Audit implementation is too prominent. | `Access is protected and reviewed` | Yes |
| `workspace.js` | `Dashboard viewed, denied, and unauthorized paths are recorded.` | Site dashboard posture card | staff/viewer | Technical audit phrasing. | `Access is protected for this school workspace` | Yes |
| `workspace.js` | `role scope` / `Role scoped views` | Many cards | staff/students | RBAC-adjacent language. | `assigned records`, `your assigned students` | Yes |
| `workspace.js` | Formerly `Source record counts` | Program Teacher dashboard cards | program teachers/admin | Database/source-system phrasing. | Replaced with `Students by program`; guarded by language verifier. | Complete |
| `workspace.js` | `Redacted operating signals` | Top risk card | admin/site | Privacy/security jargon. | `Priority student signals` | Yes |
| `workspace.js` | `Audit-safe administration posture` | Next actions card | admin/site | Internal compliance tone. | `Recommended follow-up` | Yes |
| `workspace.js` | `Storage identifiers redacted.` | Archive rows | staff | Technical storage detail. | `File details are protected.` | Yes |
| `workspace.js` | Formerly `Assignment form unavailable` | Mentor assignment empty state | site admin | Sounded broken when no rows/mentors. | Replaced with `No assignment can be made right now`; guarded by language verifier. | Complete |
| `workspace.js` | `selected-site` | Mentor/operations sections | staff | System-scope phrase. | `this school` or `selected school` | Yes |
| `workspace.js` | `Workspace assignment is not active yet` | Mentor no-assignment state | mentor | Abstract account phrasing. | `No students are assigned to you yet` | Yes |
| `workspace.js` | Raw archive provider status in Operations rows | Operations archive worklist | staff/viewer/program teacher | Rows could show implementation status such as `drive_config_missing`. | Replaced with school-facing storage status labels and verifier guard. | Complete |
| `workspace.js` | `Site Context` | Scope card | staff/viewer | Useful, but sounds system/admin heavy. | `School workspace` | Yes |
| `app.js` | Formerly `Future App Workflow`, `Non-production workflow preview`, `when the backend is ready`, `Search preview data`, `source counts`, `Audit-sensitive`, and `No localStorage source of truth` | Public app-preview | public/stakeholders | Stale future-app and implementation wording made the signed-in app sound unbuilt or technical. | Replaced with `Workspace Workflow`, signed-in workflow guidance, protected-activity copy, and example-workspace labels; guarded by language verifier. | Complete |
| `account.html` | Fake Test Account Smoke Page | Internal account QA | internal QA | Fine only if isolated. | Keep internal; do not link publicly. | No normal-user change |
| `alpha.html` | Internal alpha / QA only | Internal alpha QA | internal QA | Fine only if isolated. | Keep internal; do not link publicly. | No normal-user change |
| `workspace.js` | `global` scope chips | Staff header role chips | admin/staff | Raw scope terms can confuse normal users. | Replaced with assigned-record, assigned-school, assigned-program, and own-student labels; guarded by language verifier. | Complete |
| `workspace.js` | Formerly raw `aggregate_only` readiness scope | Readiness report | misc admin/admin | API scope value leaked into UI and report lacked aggregate-only boundary language. | Replaced with `Aggregate reporting only`, metric context, and no-individual-student-record guidance; guarded by language verifier. | Complete |

## 7. Developer/Prototype/Prompt Language Leaks

Confirmed protected app leak candidates:

- `workspace.js`: `Database-backed MVP`
- `workspace.js`: `Cloudflare target`
- `workspace.js`: default header eyebrow with implementation posture

Confirmed public/stakeholder copy risks:

- Completed 2026-05-25: `app.js` and generated `public-companion/app.js` no longer describe the app-preview as `Future App Workflow`, `Non-production workflow preview`, or something waiting for the backend to be ready.
- Completed 2026-05-25: `app.js` and generated `public-companion/app.js` now use `Workspace Workflow`, example-workspace labels, student-count wording, and protected-activity copy for the public app-preview surface.

Not counted as normal-user leaks:

- `account.html`, `account.js`, `alpha.html`, `alpha.js`: internal QA/smoke surfaces clearly classified as internal.
- Curriculum use of "prototype" in public guide lessons: legitimate student project language.
- Docs, tests, migrations, and scripts: developer-facing by design.

## 8. Dead-End or Misleading UI Language

- Dashboard metric tiles often have `Open` buttons only when an `actionSection` is wired. That is good, but many non-clickable metric cards look visually similar to clickable ones. Future slices should add clearer non-interactive styling or route links when a real section exists.
- Site dashboard cards such as `Top Risk Students` and `Mentor Coverage` now have route-backed drill-downs. `Presentation Snapshot` and `Archive / Export Snapshot` now expose row-level Operations drill-downs only for exact supported status filters; unsupported raw statuses remain summary-only.
- Program teacher `Students` card renders scoped student rows, but the best drill-down is still the site student detail drawer through other surfaces. Add direct open-detail affordances where route-safe.
- Viewer read-only sections sometimes show operational words like `Teacher intervention` and `Assignment action`; the controls are hidden, but the copy can better emphasize observation and escalation.
- Mentor dashboard assigned-student cards need richer open-detail and recent activity groupings for mentors to know what to do next.

## 9. Button/Card/Link Clarity Issues

- `renderMetricTile` has optional `actionSection`; only some counts are linked.
- Admin and Site Dashboard `Students` counts now open the Student Directory through the supported `students` section.
- Site dashboard `No Mentor` now opens the Student Directory with `noMentor=true`, and the Mentor Coverage card also offers a missing-mentor student-list drill-down.
- Site dashboard `Submitted` and `Needs Revision` open Review Queue filters.
- Site dashboard presentation/archive metrics open Operations filters.
- Site dashboard `Presentation Snapshot` scheduled/completed rows and `Archive / Export Snapshot` supported status rows open exact Operations filters; unsupported raw presentation statuses remain summary-only.
- Student Directory summary tiles now filter the existing scoped directory for `No Mentor`, `Submitted`, `Needs Revision`, `Presentation Pending`, `Archive Ready`, `Archive Failed`, and `High Risk` rows instead of staying summary-only.
- Metrics without a supported route, such as Evidence for roles without a dedicated evidence-record surface, are marked as summary-only instead of receiving fake action buttons.
- Site dashboard `Recent Activity` opens Audit only when the signed-in role already has the Audit section; otherwise it remains summary-only.
- Student directory rows have a real `View detail` button, which should be preserved and expanded to other staff lists.
- Mentor assignment active rows and unassigned rows have real `View student detail` buttons where permission allows.
- Review Queue `Evidence Attached`, `High Risk`, `Stale Activity`, and `Missing Mentor` summary tiles now open exact scoped Review Queue filters with URL state.
- Review queue selected submission has `Open student detail`, which should be preserved.
- Operations rows have `Open student detail`, which should be preserved.
- Public guide `Future App Workflow` wording should be retired or reframed now that the app has real hosted/API proof.

## 10. Empty State Language Issues

- Some empty states say a route is "unavailable" when the actual state may be no records. Separate empty data from load failure.
- Several states say "selected-site" or "assigned-site" instead of "this school" or "your assigned school."
- Permission denied states should tell users who can help without exposing role internals.
- Mentor no-assignment state should say "No students are assigned to you yet" instead of "Workspace assignment is not active yet."
- Student empty states improved in the student progress dashboard but future feedback/phase detail pages need the same simple language.

## 11. Permission/Error Language Issues

- Replace `Permission denied` on normal workspace pages with `You do not have access to this section.`
- Replace `This role cannot...` with role-safe explanations such as `Your account can view this information but cannot make changes.`
- Avoid showing raw route/scope concepts like `global`, `tenant`, or `role scope` unless the page is platform/security admin only.
- Continue returning strict 401/403/404 at API level. This audit is about UI language only, not weakening enforcement.

## 12. Improvement Table

| # | Category | Role(s) affected | Current repo evidence | Current limitation | Proposed improvement | User value | Files/areas likely involved | Permission/RBAC considerations | Scope considerations | Size | Automation safe? | Suggested acceptance test | First implementation slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Language | Staff, admin, viewer | `workspace.js` `WORKSPACE_POSTURE_CHIPS` | Says `Database-backed MVP`. | Replace with school-work labels. | Workspace feels real. | `workspace.js`, tests | No RBAC change. | All roles. | XS | Yes | Source verifier blocks old phrase. | Update header chips. |
| 2 | Language | Staff, admin, viewer | `workspace.js` header eyebrow | Says infrastructure/maturity posture. | Use `School workspace`. | Clear first impression. | `workspace.js`, tests | No RBAC change. | All roles. | XS | Yes | Render test checks new copy. | Update header default. |
| 3 | Language | Staff | `workspace.js` `Cloudflare target` | Vendor language. | Replace with `Presentation readiness`. | Removes infrastructure jargon. | `workspace.js`, tests | None. | All roles. | XS | Yes | Verifier bans phrase. | Header slice. |
| 4 | Language | All denied users | `renderPermissionDeniedSection` | Says `Permission denied`. | Say `You do not have access to this section.` | Less technical, more helpful. | `workspace.js`, tests | Do not change API statuses. | All roles. | XS | Yes | Workspace render test. | Copy only. |
| 5 | Language | Staff | `renderSitePermissionRules` | Says audit paths recorded. | Say access is protected and reviewed. | Less surveillance tone. | `workspace.js` | None. | Site. | XS | Yes | Snapshot/source test. | Copy only. |
| 6 | Language | Staff | `renderStudentDirectoryOperatingPosture` | Says unauthorized paths/raw search text. | Student-safe privacy copy. | Better trust. | `workspace.js` | None. | Site/program. | XS | Yes | Language verifier. | Copy only. |
| 7 | Functionality | Site admin | Site dashboard `No Mentor` tile | No direct link to mentor assignments. | Link to Mentor Assignments section. | Faster assignment workflow. | `workspace.js` | Only if section is role-available. | Site. | XS | Yes | Workspace render has `data-section="mentorAssignments"`. | Add actionSection. |
| 8 | Functionality | Site admin, org admin | Site dashboard submitted count | No direct review queue link. | Link to Review Queue. | Faster review work. | `workspace.js` | Viewer link read-only only. | Site/program. | XS | Yes | Button appears only when section exists. | Add actionSection. |
| 9 | Functionality | Site admin | Site dashboard revision count | No direct review queue link. | Link to Review Queue. | Prioritizes revision loops. | `workspace.js` | Review mutation remains gated. | Site/program. | XS | Yes | Button routes to teacher section. | Add actionSection. |
| 10 | Functionality | Site admin | Site dashboard presentation metrics | No operations drill-down. | Link to Operations. | Faster readiness follow-up. | `workspace.js` | Operations role check. | Site. | XS | Yes | Render action only when operations available. | Add actionSection. |
| 11 | Functionality | Site admin | Site dashboard archive metrics | No operations drill-down. | Link to Operations. | Faster closeout follow-up. | `workspace.js` | Operations read-only for viewer. | Site. | XS | Yes | Tile opens operations. | Add actionSection. |
| 12 | Functionality | Site admin | Top risk card rows | Rows cannot open student detail. | Add `View student detail` to top-risk rows. | Opens exact student from risk summary. | `workspace.js`, API row includes `studentId` | Use existing detail permission. | Site. | S | Yes | Button loads `/api/site/students/:id`. | Add button where row has id. |
| 13 | Functionality | Site admin | Mentor coverage card | Mentor load rows do not open assigned list filter. | Add mentor filter handoff to Mentor Assignments. | Workload management. | `workspace.js` | Manage/view only by role. | Site. | S | Partial | Filter state test. | Set mentor filter then section. |
| 14 | Functionality | Program teacher | Program teacher `Students` list | Scoped rows lack detail open in some helper cards. | Add open-detail actions to scoped list rows. | Teachers can act from dashboard. | `workspace.js` `renderScopedStudentList` | Program scope only. | Program/cohort. | S | Yes | Teacher render has open-detail button. | One row action. |
| 15 | Functionality | Mentor | Mentor assigned cards | Need stronger detail open. | Add/open detail from mentor card if route-safe. | Mentor sees timeline/context. | `workspace.js`, mentor APIs | Assigned-only. | Active assignments only. | S | Yes | Mentor cannot open unassigned student. | Button to detail. |
| 16 | Functionality | Viewer | Viewer dashboard | Read-only status present but not enough role-specific next steps. | Added viewer-specific monitoring queue backed by existing Review Queue, Student Directory, and Operations presets. | Viewer knows what to monitor and where authorized staff act. | `workspace.js` | No controls. | Site. | S | Complete | No mutation controls in viewer render. | Completed 2026-05-28. |
| 17 | Functionality | Administration/AP | Site admin labels | `Administration` exists but no AP/principal distinction. | Add principal/AP-friendly description without new role. | Leadership demo clarity. | `workspace.js`, docs | No new roles. | Site. | XS | Yes | Source copy test. | Label helper copy. |
| 18 | Functionality | Org admin | No org dashboard | Tenant-level rollup absent. | Add read-only org overview route later. | District leadership view. | `functions/api/org/**`, workspace | Org scope only. | Tenant/site. | L | No | Org admin sees only tenant sites. | Backlog/spec. |
| 19 | Functionality | Site admin | Mentor assignment POST default | `defaultSiteRoleIds` omits `site_admin` in POST. | Align POST site selection with `canManageMentorAssignments`. | Site admin can assign mentors. | `functions/_lib/site-mentor-assignments.ts`, tests | Mentors still denied. | Site only. | S | Yes | Site admin POST succeeds; mentor POST denied. | Update default list if tests prove. |
| 20 | Functionality | Program teacher | Mentor assignment manage policy | Teacher can view but not assign. | Decide if teachers should assign within scope. | Aligns user expectation. | permissions, mentor assignment API/UI | Must prevent scope expansion. | Program/cohort. | M | Partial | Teacher scoped assignment test. | Decision doc first. |
| 21 | Functionality | Site admin | Mentor reassignment absent | POST only creates/reactivates; no reassign/remove UI. | Add deactivate/reassign with audit. | Correct assignment mistakes. | API, migrations if history needed | Site ops only. | Site. | M | Partial | Reassign audit test. | Remove assignment endpoint. |
| 22 | Functionality | Site admin | Bulk mentor assignment absent | One-by-one only. | Add safe bulk queue for unassigned students. | Reduces workload. | API/UI | Site ops only; no mentor self assign. | Site/program. | L | Partial | Bulk cannot cross site. | CSV-free small batch. |
| 23 | Functionality | Admin/site | Assignment history limited | Audit write exists, but no UI timeline. | Show assignment history on student detail. | Accountability. | detail API, audit query | Staff-only. | Site. | M | Partial | History visible to site admin, hidden to student. | Read-only history. |
| 24 | Functionality | Site admin | Site selection future-only | Multiple site users hit selection-required states. | Implement site switcher. | Multi-school users can proceed. | `site-scope.ts`, `workspace.js` | Only accessible sites. | Tenant/site. | M | Partial | Site switch cannot load unauthorized site. | Query param/site selector. |
| 25 | Functionality | Viewer | Operations read-only banner always shown | Even managers see read-only operations worklists. | Distinguish viewer read-only from intentionally no mutation phase. | Reduces confusion. | `workspace.js` | Keep mutations gated. | Site. | XS | Yes | Manager copy differs from viewer. | Copy branch. |
| 26 | Functionality | Staff | Operations worklists | Scheduling/retry controls out of phase. | Add controls only if APIs support and permissions allow. | Completes workflow. | presentation/archive APIs/UI | Role-gated. | Site/program. | M | Partial | Viewer sees no controls. | Presentation check-in existing controls. |
| 27 | Functionality | Site admin | Student detail drawer tabs | Good data, but not bookmarkable. | Add route state/hash for selected student/tab. | Shareable support workflows. | `workspace.js` | Same auth. | Site/program. | S | Partial | Reload preserves detail without leaking id? | Hash state. |
| 28 | Functionality | Staff | Student detail notes/comments | Read-only comments shown; add staff note if API supports. | Staff can document interventions. | `site-student-detail`, comments API maybe missing | Staff-only; student-hidden rules. | Site/program/mentor assigned. | M | Partial | Student cannot see staff-only note. | Audit data model first. |
| 29 | Functionality | Staff | Review queue | Decision controls exist, but dashboard next action not filtered. | Direct filters for submitted/revision rows. | Faster reviews. | `workspace.js`, query builders | Mutation unchanged. | Site/program. | S | Yes | Section opens with status filter. | Add filter transfer. |
| 30 | Functionality | Teacher | Review feedback | Decision form exists only selected row. | Add clear row-level "Review" affordance and empty state guidance. | Better teacher workflow. | `workspace.js` | Teacher only mutates in scope. | Program/cohort. | S | Yes | Viewer has no decision controls. | Copy/button clarity. |
| 31 | Functionality | Mentor | Mentor meetings | Meeting API exists but mentor dashboard may not surface recent meetings enough. | Add meeting status summary per assigned student. | Mentor knows follow-up. | mentor API/UI | Assigned only. | Active assignments. | S | Yes | Assigned student has meeting status. | Render existing field. |
| 32 | Functionality | Student | Feedback drill-down | Student sees summary, not feedback page. | Add student feedback section/page from review rows. | Student knows revisions. | student dashboard/API | Student own only. | Self. | M | Partial | Cross-student denied. | Section first. |
| 33 | Functionality | Student | Due dates unavailable | Summary says unavailable. | Add due dates if framework data exists. | Better planning. | requirements/deadlines API | Student own/program. | Program. | M | Partial | No NaN when no dates. | API include deadline labels. |
| 34 | Functionality | Student | Phase detail absent | Progress details grouped, not phase pages. | Add phase-specific detail panels. | Clear tasks. | student dashboard UI/API | Self only. | Program. | M | Partial | Phase count test. | Expand details. |
| 35 | Functionality | Student | Submission action links | Dashboard lists next steps but no safe anchor. | Add in-page anchors to submission forms. | Faster action. | `workspace.js` | Self only. | Student. | XS | Yes | No fake hrefs. | Anchor existing form. |
| 36 | Functionality | Student | Mentor support | Shows mentor name only. | Add teacher/mentor help workflow if supported. | Knows who can help. | API/UI/docs | Do not expose unsafe contact info. | Student. | S | Partial | No raw emails unless approved. | Text-only support. |
| 37 | Functionality | Admin | Admin user import | Real-user import blocked correctly, copy is long. | Add safer approved path explanation. | Less confusion. | `workspace.js` | Platform admin only. | Global. | XS | Yes | No credentials in UI. | Copy. |
| 38 | Functionality | Admin | Role assignments | Exists, but not surfaced in main quick actions by scope. | Add role management link only for platform admin. | Easier admin work. | workspace/admin routes | Platform only. | Global. | S | Partial | Viewer cannot see. | Quick action. |
| 39 | Functionality | Viewer | Audit language | Viewer sees audit terms in cards. | Replace with "protected access" language. | Read-only users understand. | `workspace.js` | No data change. | Site. | XS | Yes | Source verifier. | Copy. |
| 40 | Functionality | Staff | Global search absent | Search limited per section. | Add role-safe student search landing. | Faster navigation. | workspace, `/api/site/students` | Same directory perms. | Site/program. | M | Partial | Search only returns accessible students. | Header search. |
| 41 | Functionality | Staff | Breadcrumb/back links | Drawer has close only. | Add back-to-list context. | Reduces dead ends. | `workspace.js` | None. | All. | XS | Yes | Keyboard close/back. | Copy/button. |
| 42 | Functionality | Staff | Filter persistence | Filters global in JS session only. | Preserve filters in URL params. | Share and return easier. | `workspace.js` | No new access. | Site/program. | M | Partial | Unauthorized params denied. | One section filter URL. |
| 43 | Functionality | Staff | Student row email visible | Staff directory shows email. | Confirm policy or hide for viewer. | Privacy clarity. | `workspace.js`, API | Role-based. | Site. | S | Partial | Viewer snapshot redacts if needed. | Decision first. |
| 44 | Functionality | Staff | Risk scoring explanation | Risk chips appear without explanation. | Add reason/next action tooltip/text. | Trustworthy prioritization. | `workspace.js` | No data change. | Site/program. | XS | Yes | Chip text includes reason. | Copy. |
| 45 | Functionality | Admin | Export failures | Archive snapshot not actionable. | Link failed exports to archive exports or operations. | Faster closeout. | `workspace.js` | Admin/site ops only. | Site/global. | S | Yes | Click opens archive/ops. | Metric action. |
| 46 | Functionality | Site admin | Recent activity | Count only; no drill-down from site dashboard. | Add recent activity list or audit link if allowed. | Understand changes. | site dashboard API/UI | Org/site admin only; viewer maybe read-only. | Site. | M | Partial | Viewer safe. | Read-only recent list. |
| 47 | Functionality | Staff | Program breakdown | Counts but no filtered student list. | Click program row to directory filter. | Cohort/program work. | `workspace.js` | Scope-limited. | Site/program. | S | Yes | Directory opens program filter. | Program row action. |
| 48 | Functionality | Staff | Status breakdown | Counts but no filtered list. | Click status to directory/review queue. | Find exact students. | `workspace.js` | Scope-limited. | Site/program. | S | Yes | Status filter set. | One status action. |
| 49 | Functionality | Mentor | Mentor assigned scope | No route for all assigned students detail list beyond dashboard. | Add assigned student list filters. | Mentor prioritization. | mentor dashboard/API | Assigned only. | Mentor. | M | Partial | Cannot see unassigned. | Sort by needs attention. |
| 50 | Functionality | Staff | Empty load vs no data | Many `unavailable` labels for no data. | Split error and empty messages. | Less panic. | `workspace.js` | None. | All. | S | Yes | Error fixture vs empty fixture. | One section. |
| 51 | Functionality | Staff | Mobile density | Workspace has responsive CSS but dense tables/cards need proof. | Add mobile smoke for dashboard/list. | Real usability. | tests/browser | No access change. | All. | M | Partial | Screenshot or DOM smoke. | Non-screenshot smoke. |
| 52 | Functionality | Staff | Public guide and app boundary | Public app-preview says future app workflow. | Update boundary language. | Fewer stakeholder doubts. | `app.js`, generated public companion | No auth. | Public. | S | Yes | Production surface test. | Copy and rebuild public. |
| 53 | Functionality | Admin | Administration/AP workspace | Site admin is closest, but no principal/AP language. | Add principal-friendly operational header. | Better demo. | workspace copy/docs | No new role. | Site. | XS | Yes | Copy test. | Copy. |
| 54 | Functionality | Tests | Route-link verifier absent | No dedicated dashboard link verifier. | Add verifier for no `href="#"` and valid section actions. | Prevent dead cards. | scripts/tests | No product change. | Source. | S | Yes | Fails on dead links. | Script. |
| 55 | Language | Staff | `Site Context` | System label. | `School workspace`. | Easier scan. | `workspace.js` | None. | Site. | XS | Yes | Render test. | Copy. |
| 56 | Language | Program Teacher | Formerly `Source record counts` | Technical program summary copy. | Replaced with `Students by program` and assigned-program language. | More natural program dashboard. | `workspace.js`, tests, verifier | None. | Program dashboard. | XS | Complete | Workspace render test and language verifier. | Complete. |
| 57 | Language | Staff | `Bounded section summary` | Technical. | `Latest project summary`. | Better detail page. | `workspace.js` | None. | Detail. | XS | Yes | Source test. | Copy. |
| 58 | Language | Staff | `Stable event types and safe summaries` | Technical timeline language. | `Recent activity`. | Better timeline. | `workspace.js` | None. | Detail. | XS | Yes | Source test. | Copy. |
| 59 | Language | Staff | `Role-based visibility` | Technical. | `Visible notes`. | Clearer. | `workspace.js` | Preserve filtering. | Detail. | XS | Yes | Source test. | Copy. |
| 60 | Language | Staff | `Private evidence metadata` | Technical. | `Evidence details`. | Clearer. | `workspace.js` | No storage IDs. | Detail. | XS | Yes | Source test. | Copy. |
| 61 | Language | Staff | `Current mentor assigned scope` | Awkward. | `Current assignments`. | Clearer. | `workspace.js` | None. | Mentor assignments. | XS | Yes | Source test. | Copy. |
| 62 | Language | Staff | `Selected-site mentor load` | Scope jargon. | `Mentor workload at this school`. | Clearer. | `workspace.js` | None. | Site. | XS | Yes | Source test. | Copy. |
| 63 | Language | Staff | `No selected-site mentors match` | Scope jargon. | `No mentors at this school match these filters.` | Clearer. | `workspace.js` | None. | Site. | XS | Yes | Source test. | Copy. |
| 64 | Language | Staff | `No selected-site...` repeated | Scope jargon. | Replace with `this school`. | Clearer. | `workspace.js` | None. | Site. | S | Yes | Language scan. | Copy group. |
| 65 | Language | Staff | `Teacher intervention` | Sometimes too intervention-heavy. | `Teacher follow-up` where appropriate. | Less punitive. | `workspace.js` | None. | Teacher/review. | XS | Yes | Source test. | Copy. |
| 66 | Language | Viewer | `Assignment action` | Implies edit even when hidden. | `Assignment status`. | Read-only clarity. | `workspace.js` | No controls. | Viewer. | XS | Yes | Viewer render. | Copy branch. |
| 67 | Language | Student | `Uploaded And Linked Work` | Capitalization odd. | `Uploaded and linked work`. | Polish. | `workspace.js` | None. | Student. | XS | Yes | Student render. | Copy. |
| 68 | Language | Student | `Submit Evidence` | Maybe okay but "evidence" can feel technical. | Keep or pair with `Add your work`. | Student-safe. | `workspace.js` | None. | Student. | XS | Yes | Student copy test. | Copy. |
| 69 | Language | Staff | `No active student records match this assigned view` | Abstract. | `No students match this view right now.` | Clearer. | `workspace.js` | None. | Mentor/staff. | XS | Yes | Source test. | Copy. |
| 70 | Language | Staff | `Operating view` | Admin-heavy. | `School dashboard` when not platform. | Clearer. | `workspace.js` | None. | Site. | XS | Yes | Render test. | Copy. |
| 71 | Language | Staff | `Global admin` chip | Fine for platform, bad for site users. | Make context-specific. | Avoid overclaim. | `workspace.js` | No role change. | Global only. | XS | Yes | Site users do not see global admin. | Copy check. |
| 72 | Language | Public | Formerly `Future App Workflow` | App is no longer just future. | Replaced with `Workspace Workflow`; guarded by verifier/test. | Better product trust. | `app.js`, generated public companion | No auth. | Public. | S | Yes | Build public-site drift check. | Complete |
| 73 | Language | Public | Formerly implementation-storage and backend-ready language | Design/build-internal. | Replaced with saved-workspace-record and signed-in workflow copy. | Less prototype feel. | `app.js`, generated public companion | None. | Public. | S | Yes | Production text verifier. | Complete |
| 74 | Language | Public | Formerly preview-data/source-count/audit-sensitive wording | Internal. | Replaced with example workspace search, student counts, and protected activity labels. | Clearer. | `app.js`, generated public companion | None. | Public. | XS | Yes | Source test. | Complete |
| 75 | Language | Admin | `credential_delivery_policy_required` visible in test/source | Error code appears in source tests; UI maps long message. | Keep code hidden; shorten message. | Cleaner admin UX. | `workspace.js`, tests | Security unchanged. | Admin. | XS | Yes | UI no code string except source handling? | Copy. |
| 76 | Functionality | Tests | No dedicated functionality-language audit test | Audit could go stale. | Add test verifying audit sections, 75 rows, prompt. | Keeps audit useful. | tests | No product change. | Source. | XS | Yes | Count table rows. | Test. |
| 77 | Functionality | Automation | Current generic builder may touch broad MVP tasks | Need focused product-readiness automation. | Add hourly `Functionality UX Upgrade`. | Continuous real UX depth. | automation prompt, scheduler | Must preserve RBAC. | Repo. | XS | Yes | Prompt contains guardrails. | Prompt+automation. |
| 78 | Functionality | Security | Language cleanup could mask API errors | Need verifier scope. | Source verifier only checks UI phrases, not API logic. | Avoid accidental auth changes. | scripts/tests | No auth edits. | Source. | XS | Yes | Verifier ignores docs/tests. | Script. |
| 79 | Functionality | Staff | Dashboard card purpose | Some cards are summary-only without explanation. | Add "why this matters" microcopy or real links. | Staff know what to do. | `workspace.js` | None. | Site/program. | S | Yes | Card has action or non-clickable explanation. | One card group. |
| 80 | Functionality | Privacy | Staff-only comments | Detail API handles visibility, UI labels not explicit. | Label staff-only vs student-visible notes if data supports. | Prevent privacy confusion. | detail API/UI | Preserve visibility policy. | Role-scoped. | M | Partial | Student cannot see staff-only. | Label visible notes first. |

Summary counts: 54 functionality/workflow items and 26 language/navigation/clarity items.

## 13. Top 20 Immediate Fixes

1. Replace workspace header `Database-backed MVP` copy.
2. Replace workspace header `Cloudflare target` copy.
3. Add a source verifier for staff-facing internal product language.
4. Replace `Permission denied` with a student/staff-safe access message.
5. Replace `Role scoped views` on normal dashboard cards.
6. Replace `Directory viewed, denied...` with protected-access copy.
7. Link Site Dashboard `No Mentor` to Mentor Assignments.
8. Link Site Dashboard `Submitted` to Review Queue.
9. Link Site Dashboard `Needs Revision` to Review Queue.
10. Link Site Dashboard `Presentations` to Operations.
11. Link Site Dashboard `Archive / Exports` to Operations.
12. Add `View student detail` to Top Risk Students rows.
13. Add direct student detail actions to program teacher student rows.
14. Clarify viewer read-only overview copy.
15. Replace `selected-site` phrases with `this school`.
16. Replace `Assignment form unavailable` with a clear no-action state.
17. Reframe public app-preview from `Future App Workflow`. Complete 2026-05-25.
18. Keep public app-preview/workspace guide copy free of design-artifact or implementation-readiness language.
19. Add dashboard action/link verifier.
20. Add audit doc test to keep 75+ findings present.

## 14. Top 20 Functionality Upgrades

1. Site admin `No Mentor` metric opens mentor assignment workflow.
2. Site admin review counts open review queue filters.
3. Operations counts open filtered operations worklists.
4. Program rows open filtered student directory.
5. Status rows open filtered records.
6. Top risk rows open student detail.
7. Program teacher rows open student detail.
8. Mentor assigned cards open assigned student detail.
9. Add site switcher for multi-site users.
10. Fix mentor assignment POST site-admin default if tests confirm mismatch.
11. Add mentor reassignment/remove workflow with audit.
12. Add assignment history to student detail.
13. Add viewer-specific dashboard overview. Complete 2026-05-28.
14. Add Administration/AP/Principal-friendly site dashboard language.
15. Add org-admin tenant rollup route.
16. Add mentor meeting status depth to mentor dashboard.
17. Add student feedback/revision drill-down.
18. Add due dates to student dashboard when framework deadlines are available.
19. Add route-safe URL state for filters/student detail.
20. Add dashboard card/action verifier.

## 15. Do-Not-Automate Items

- Do not weaken auth, RBAC, tenant/site/program/student scoping.
- Do not let mentors assign students to themselves or broaden access.
- Do not create remote users, credentials, domains, OAuth settings, or Cloudflare config.
- Do not run remote seed/reset/migration/deploy commands as part of this audit automation.
- Do not implement destructive admin controls without a human product/security decision.
- Do not make broad schema migrations without a dedicated approved prompt.
- Do not create fake pages with mock data.
- Do not add placeholder buttons, `href="#"`, or cards that imply missing functionality exists.
- Do not expose staff-only notes to students.
- Do not claim real pilot readiness, production onboarding readiness, or FERPA certification.
- Do not revive announcements unless there is a separate approved product decision.
- Do not edit `.env`, `.secrets`, or credential files.

## 16. Testing Strategy

- Keep source-level UI language verifier focused on production user-facing app/source files, not docs/tests/internal QA surfaces.
- Add route/card link verifier to prevent `href="#"`, empty links, and buttons to missing workspace sections.
- Add workspace render tests for each role: site admin, viewer, program teacher, mentor, student.
- Add permission tests for mentor assignment management: site admin allowed, viewer/program teacher/mentor denied until product decision changes.
- Add student detail render tests for staff roles and mentor assigned-only visibility.
- Add empty-state tests for no records vs load failure.
- Add public-surface language tests for app-preview once the public copy is cleaned.

## 17. Automation Backlog

The new hourly automation should select exactly one bounded work order per run from this audit. Preferred early work orders:

1. Replace one group of internal workspace labels.
2. Add one dashboard metric action to an existing real section.
3. Add one student detail open button to an existing staff list.
4. Add one viewer read-only copy hardening slice.
5. Add one mentor assignment permission test slice.
6. Add one route/card link verifier.
7. Add one empty-state wording cleanup.
8. Add one student next-step clarity improvement backed by real data.
9. Add one mentor assigned-student detail improvement.
10. Add one public app-preview language cleanup after confirming generated-output flow.

Every automation run must re-scan the current repo, verify the chosen issue still exists, implement only one safe slice, update this audit or a run log, validate, and commit only if the repo remains valid.

## 18. Completed Slices

| Date | Slice | Evidence | Status |
| --- | --- | --- | --- |
| 2026-05-24 | Replaced the protected workspace product header and posture chips so normal authenticated users no longer see `Database-backed MVP`, `Cloudflare target`, `Audit-sensitive admin`, or `Senior Capstone Product` in the app header. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, `npm run verify:functionality-language` | Complete |
| 2026-05-24 | Linked the Site Dashboard `No Mentor` metric to the real Mentor Assignments workflow with the missing-mentor filter applied, so site staff and read-only viewers can move from coverage summary to scoped assignment rows without a dead route. | `workspace.js`, `tests/workspace-app.test.mjs`, `npm run verify:functionality-language`, `node --test tests/workspace-app.test.mjs` | Complete |
| 2026-05-24 | Added latest visible feedback context to the authorized student detail summary, using review/comment rows already returned by the scoped detail API and keeping staff-only visibility rules server-owned. | `workspace.js`, `tests/workspace-app.test.mjs`, `npm run verify:functionality-language`, `node --test tests/workspace-app.test.mjs` | Complete |
| 2026-05-24 | Repaired the admin workspace drill-down lane: hamburger close now hides the full nav and frees desktop width, dashboard `Students` opens the Student Directory, `No Mentor` and Mentor Coverage open the actual missing-mentor student list, admin review/presentation counts use real filtered sections, and route-less evidence/activity counts are summary-only unless the role has the target section. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused workspace tests/verifiers | Complete |
| 2026-05-24 | Linked Site Dashboard `Status Breakdown` rows to the existing scoped Student Directory status filter, with unsupported status rows remaining summary-only and verifier coverage blocking unsupported dashboard presets. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused workspace tests/verifiers | Complete |
| 2026-05-24 | Added a real `View detail` action to Program Teacher dashboard scoped-student rows, reusing the existing site student detail handler and route so teachers can move from their dashboard list into authorized student context without a fake link. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-24 | Preserved Operations worklist context when staff open a student detail drawer from presentation, archive, or readiness rows, so the drawer opens and closes inside Operations instead of jumping to the broader Student Directory. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-24 | Added a real `View detail` action to Mentor Dashboard assigned-student rows, reusing the existing authorized site student detail route and keeping the drawer inside the Mentor Dashboard context. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-24 | Preserved Review Queue context when staff open a student detail drawer from a selected submission, so the drawer opens and closes inside the Review Queue instead of switching to the broader Student Directory. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-24 | Preserved Program Teacher Dashboard and Mentor Assignments context when users open the existing authorized student detail drawer, so closing detail returns to the originating worklist instead of the broader Student Directory. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-24 | Preserved Site Dashboard context when staff open a top-risk student's existing authorized detail drawer, including the current site id in the detail request so closing returns to the dashboard rather than the broader Student Directory. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-24 | Linked Operations `Program Breakdown` rows to the existing scoped Operations readiness `programId` filter, so staff can move from a program summary to the matching presentation/archive/readiness rows without a fake route. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-25 | Added student-safe archive blocked guidance to the student home and Archive tab using the existing own-student archive readiness checks, so students see the next closeout item without fake request actions or new data paths. | `workspace.js`, `tests/workspace-app.test.mjs`, focused workspace test/verifier | Complete |
| 2026-05-25 | Added the student home `Latest Feedback` panel from review rows already scoped through `/api/student/dashboard`, so students can see the newest teacher note for their own submitted work without staff-only comments or new links. | `functions/api/student/dashboard.ts`, `workspace.js`, `tests/student-dashboard-access.integration.test.mjs`, `tests/workspace-app.test.mjs`, focused route/UI tests | Complete |
| 2026-05-25 | Added matching teacher feedback context to student Submitted Work rows, using the existing scoped dashboard feedback payload so students can connect a review note to the exact submission without a fake history link. | `workspace.js`, `tests/workspace-app.test.mjs`, focused workspace test/verifier | Complete |
| 2026-05-25 | Linked Operations `Presentation Pending` and `Archive Failed` summary tiles to existing scoped Operations filters, so staff can move from summary counts to the matching worklist rows without a new route or fake action. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace test/verifier | Complete |
| 2026-05-25 | Added route-backed Operations category filtering and Next Actions drill-downs, so staff can move from grouped follow-up categories like risk or archive to matching scoped Operations rows with URL state. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked the Operations `Needs Attention` summary tile to a real scoped `needsAttention=true` Operations filter, so staff can move from blocked, missing, or high-risk totals to the matching worklist rows with shareable URL state. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked the Operations `Outline Pending` summary tile to a real scoped `outlineAttention=true` Operations filter, so staff can move from outline approval totals to exact outline-pending or outline-revision rows without changing presentation status semantics. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-25 | Hardened the shared review-history route so students and assigned mentors only receive student-visible submission comments while staff roles keep staff-only history, and renamed the student home panel to `Feedback History` with bounded review-note copy. | `functions/api/reviews/[submissionId]/history.ts`, `workspace.js`, `tests/review-loop.integration.test.mjs`, `tests/workspace-app.test.mjs`, focused route/UI tests | Complete |
| 2026-05-25 | Added submission version and current-status context to student `Feedback History` rows using the existing own-student dashboard feedback payload, so students can connect teacher notes to the exact submitted version without a new route or fake history page. | `functions/api/student/dashboard.ts`, `workspace.js`, `tests/student-dashboard-access.integration.test.mjs`, `tests/workspace-app.test.mjs`, focused route/UI tests | Complete |
| 2026-05-25 | Added a real student `Feedback History` timeline action that loads the already filtered review-history route for the matching submission, showing versions, status changes, and student-visible teacher notes without exposing staff-only comments or adding a fake page. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused workspace test/verifier | Complete |
| 2026-05-25 | Added a student `Your Required Work` checklist from the existing `/api/student/dashboard` requirement/progress/submission data, so students can see every required item, status, submitted version, and next step without a fake requirement page. | `functions/api/student/dashboard.ts`, `workspace.js`, `tests/student-dashboard-access.integration.test.mjs`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused route/UI tests | Complete |
| 2026-05-25 | Grouped the student `Your Required Work` checklist by senior project phase with per-phase completion counts, so students can scan each phase's remaining work without a fake requirement page or new route. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused workspace test/verifier | Complete |
| 2026-05-25 | Added persisted deadline labels/dates to student next steps and `Your Required Work` rows from existing requirement/deadline records, so students can see when each requirement is due without a fake calendar page or new route. | `functions/api/student/dashboard.ts`, `workspace.js`, `tests/student-dashboard-access.integration.test.mjs`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused route/UI tests | Complete |
| 2026-05-25 | Added student-safe requirement descriptions and first quality nudges to the `Your Required Work` checklist from existing requirements and quality checks, so students see what the requirement means without a fake detail page or new write path. | `functions/api/student/dashboard.ts`, `workspace.js`, `workspace.css`, `tests/student-dashboard-access.integration.test.mjs`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused route/UI tests | Complete |
| 2026-05-25 | Added real per-requirement student actions to the `Your Required Work` checklist: rows with attached evidence can send the existing submission for teacher review through `/api/submissions/:id/submit`, and rows without evidence focus the existing evidence forms instead of adding a fake page. | `functions/api/student/dashboard.ts`, `workspace.js`, `workspace.css`, `tests/student-dashboard-access.integration.test.mjs`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused route/UI tests | Complete |
| 2026-05-25 | Added an in-page requirement detail disclosure to the student `Your Required Work` checklist, summarizing status, due date, evidence, submitted version, progress, next action, and latest matching teacher feedback from already scoped dashboard data without a new route. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `docs/student-progress-dashboard.md`, focused workspace test/verifier | Complete |
| 2026-05-25 | Linked the Operations `Evidence Missing` summary tile to the existing scoped Operations `category=evidence` and `readiness=missing` filters, so staff can move from missing evidence/submission-progress counts to matching worklist rows without adding a Review Queue filter or fake route. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-25 | Clarified Viewer/read-only workspace, Site Dashboard, Review Queue, Mentor Assignments, and Operations language so read-only users see monitoring/escalation boundaries and authorized-action ownership without role/scope jargon or fake controls. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Reworked Program Teacher dashboard language from source/scope wording to assigned-program copy, including `Assigned Student Progress`, `Assigned Students`, `Students by program`, and guarded removal of `Source record counts`. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language verifiers | Complete |
| 2026-05-25 | Replaced shared workspace access chips and related list/detail/review language that exposed raw scope terms such as `site:...`, `program:...`, `global`, `total in scope`, and `role scope` with school-facing assignment labels. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Clarified Review Queue empty, history, and disabled-decision states so staff see matching-work, true no-data, protected-history, and read-only decision ownership language instead of `assigned access`, row/item wording, or load-like no-history copy. | `workspace.js`, `functions/_lib/site-review-queue.ts`, `tests/workspace-app.test.mjs`, `tests/site-review-queue.integration.test.mjs`, `scripts/verify-functionality-language.mjs`, focused route/UI/language/navigation verifiers | Complete |
| 2026-05-25 | Added Review Queue comment visibility labels for selected submissions, showing student-visible and staff-only comment counts without rendering note bodies or changing review-history access. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language verifiers | Complete |
| 2026-05-25 | Clarified Operations presentation, archive, and attention empty states so staff can distinguish active-filter mismatches from true no-data without row jargon or fake actions. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language/navigation verifiers | Complete |
| 2026-05-25 | Added meeting, presentation, outline, evidence, and next-step context to Mentor Dashboard assigned-student rows using fields already returned by `/api/mentor/dashboard`, so mentors can prioritize check-ins without a new route or access expansion. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, focused workspace/language/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Clarified Mentor Assignments empty states so staff see student coverage language for filtered no-matches and true no-data instead of row jargon. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Sorted Mentor Dashboard assigned-student rows so revision, meeting, and presentation attention items appear before on-track students, using existing scoped `needsAttention` and status fields without changing routes or permissions. | `workspace.js`, `tests/workspace-app.test.mjs`, focused workspace/mentor route/language/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Added read-only mentor coverage history to authorized student detail from existing `mentor_assignments` rows, with assigner names shown only in admin-operational detail responses and hidden from mentor/support contexts. | `functions/_lib/site-student-detail.ts`, `workspace.js`, `tests/site-student-detail.integration.test.mjs`, `tests/workspace-app.test.mjs`, focused route/UI verifiers | Complete |
| 2026-05-25 | Added a real Mentor Dashboard `Open meeting history` action that opens the existing authorized student-detail Mentor tab, so mentors can jump from an assigned-student card to scoped meeting rows without a fake section or new access path. | `workspace.js`, `tests/workspace-app.test.mjs`, focused workspace/language/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Added linked-work context to authorized student-detail Mentor Meeting rows from existing meeting, submission, and requirement records, so staff and assigned mentors can see which submitted work a meeting supported without rendering raw submission IDs in the Mentor tab. | `functions/_lib/site-student-detail.ts`, `workspace.js`, `tests/site-student-detail.integration.test.mjs`, `tests/workspace-app.test.mjs`, focused route/UI/language tests | Complete |
| 2026-05-25 | Added a mentor-only `Record meeting` form to the existing authorized student-detail Mentor tab, using `/api/mentor/meetings` for actively assigned mentors and hardening optional linked-submission writes so meetings cannot point at another student's work. | `functions/api/mentor/meetings.ts`, `workspace.js`, `tests/mentor-meetings.integration.test.mjs`, `tests/workspace-app.test.mjs`, focused route/UI/language tests | Complete |
| 2026-05-25 | Reframed the public app-preview as `Workspace Workflow`, replacing stale future-app/backend-ready/preview-data/source-count/audit-sensitive implementation wording while keeping the signed-in workspace boundary clear. | `app.js`, `public-companion/app.js`, `scripts/verify-functionality-language.mjs`, `tests/account-and-evidence-access.test.mjs`, `npm run build:public-site` | Complete |
| 2026-05-25 | Added a visible public guide `Core guide coverage` route map for required student and teacher content, linking existing public pages for planning, evidence/build work, presentation preparation, and finish/archive work without hiding the main path in details panels. | `app.js`, `public-companion/app.js`, `tests/account-and-evidence-access.test.mjs`, `docs/mvp-requirements-catalog.md`, `npm run build:public-site`, `npm run check:generated-output-drift` | Complete |
| 2026-05-25 | Added visible teacher/mentor checkpoint panels to public support pages so each resource page pairs student first moves with adult support actions without adding routes or private-workspace claims. | `app.js`, `styles.css`, `public-companion/app.js`, `public-companion/styles.css`, `tests/account-and-evidence-access.test.mjs`, `npm run build:public-site`, `npm run check:generated-output-drift` | Complete |
| 2026-05-25 | Added visible teacher/mentor support checks to public phase pages from existing phase adult-role, evidence, and question data, so each phase page surfaces how adults can keep students moving without taking over the work. | `app.js`, `public-companion/app.js`, `tests/account-and-evidence-access.test.mjs`, `npm run build:public-site`, `npm run check:generated-output-drift` | Complete |
| 2026-05-25 | Added visible student/teacher responsibility panels to the public templates, portfolio, rubrics, and grades pages, so remaining high-value public resource pages pair student proof actions with teacher/mentor checks before the detailed cards. | `app.js`, `styles.css`, `public-companion/app.js`, `public-companion/styles.css`, `tests/account-and-evidence-access.test.mjs`, `npm run build:public-site`, `npm run check:generated-output-drift` | Complete |
| 2026-05-25 | Linked Program Teacher dashboard `Submitted` and `Needs Revision` metrics to the existing scoped Review Queue status filters, so assigned-program teachers move from workload counts to the exact review worklist without a fake route or broadening access. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked exact Site Dashboard snapshot rows to existing scoped Operations filters, so scheduled/completed presentation rows and supported archive-status rows open matching Operations worklists while unsupported raw presentation statuses stay summary-only. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Added an Operations `Check-In Needed` metric that opens the existing scoped `presentationStatus=attention_required` worklist for checked-out presentations needing staff check-in follow-up, without adding mutation controls. | `workspace.js`, `tests/workspace-app.test.mjs`, `tests/site-operations-readiness.integration.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused route/UI/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Added an Operations `Stale Activity` metric that opens the existing scoped `risk=stale` worklist, so staff and read-only viewers can find students with no recent progress without hunting through the broader attention queue. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-25 | Added an Operations `Archive In Progress` metric and `archiveStatus=in_progress` filter alias that opens queued or running archive package rows, so staff can monitor packages being prepared without fake retry controls or separate queued/running hunting. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-25 | Added Operations `Archive Expiring Soon` and `Archive Expired` metrics backed by existing scoped `archiveStatus=expiring_soon` and `archiveStatus=expired` filters, so staff can find download-window follow-up rows without fake retry controls. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-31 | Added real Operations provider-unavailable archive semantics and a `Storage Setup Needed` metric backed by the existing scoped `archiveStatus=provider_unavailable` filter, so staff can separate storage setup blockers from student archive failures without fake retry controls. | `functions/_lib/site-operations-readiness.ts`, `workspace.js`, `tests/site-operations-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, dashboard/navigation verifiers | Complete |
| 2026-05-31 | Clarified Operations archive worklist row and empty-state guidance for storage setup, expired download windows, expiring download windows, in-progress packages, completed packages, and export failures without adding retry/export controls. | `workspace.js`, `tests/workspace-app.test.mjs`, focused workspace/language verifiers | Complete |
| 2026-05-31 | Clarified student Archive readiness/download guidance so protected users no longer see signed-link/export-wiring or provider implementation language, and failed archive packages explain staff follow-up without fake retry controls. | `functions/api/student/archive/readiness.ts`, `workspace.js`, `tests/archive-readiness.integration.test.mjs`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused route/UI/language verifiers | Complete |
| 2026-05-25 | Replaced raw Operations archive provider statuses such as `drive_config_missing` with school-facing storage status labels in archive worklist rows, and guarded the render path with a language verifier. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language verifiers | Complete |
| 2026-05-25 | Linked the Review Queue `High Risk` summary tile to the existing scoped `risk=high` Review Queue filter, so staff can move from the count to matching review rows with shareable URL state. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused workspace/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked the Review Queue `Stale Activity` summary tile to the existing scoped `risk=stale` Review Queue filter, so staff can find submitted or revision work with stale activity directly from the queue summary. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused workspace/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked the Review Queue `Missing Mentor` summary tile to the existing scoped `risk=no_mentor` Review Queue filter, so staff can find submitted or revision work for students missing mentor coverage without switching to a separate coverage workflow first. | `functions/_lib/site-review-queue.ts`, `workspace.js`, `tests/site-review-queue.integration.test.mjs`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused route/UI/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked the Review Queue `Evidence Attached` summary tile to the new scoped `evidenceStatus=attached` Review Queue filter, so staff can open submitted or revision work that already has evidence attached without changing review permissions or exposing evidence bodies. | `functions/_lib/site-review-queue.ts`, `workspace.js`, `tests/site-review-queue.integration.test.mjs`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-review-queue-deeplinks.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused route/UI/dashboard/navigation verifiers | Complete |
| 2026-05-26 | Linked the Review Queue `Evidence Missing` summary tile to a scoped `evidenceStatus=missing` filter, so staff can find submitted or revision work with no attached evidence before attempting approval, without changing review permissions or exposing evidence bodies. | `functions/_lib/site-review-queue.ts`, `workspace.js`, `tests/site-review-queue.integration.test.mjs`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-review-queue-deeplinks.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused route/UI/dashboard/navigation verifiers | Complete |
| 2026-05-25 | Linked Student Directory summary tiles to existing scoped directory filters for submitted, revision-requested, high-risk, presentation-pending, archive-ready, and archive-failed students, so staff and read-only viewers can move from summary counts to matching student rows without new routes or access expansion. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, focused workspace/dashboard/navigation verifiers | Complete |
| 2026-05-26 | Clarified Student Directory filtered empty states so staff and read-only viewers see the active workflow named directly for submitted work, revision follow-up, high-risk, presentation, archive, program, search, and missing-mentor views instead of generic no-match copy. | `workspace.js`, `tests/workspace-app.test.mjs`, `npm run verify:functionality-language`, focused workspace/language/dashboard/navigation verifiers | Complete |
| 2026-05-26 | Clarified the aggregate Readiness report for `misc_admin`/admin reporting users so raw API scope values such as `aggregate_only` render as school-facing labels, metrics include purpose text, and the page explains it does not open individual student records. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `scripts/verify-functionality-language.mjs`, focused workspace/language verifiers | Complete |
| 2026-05-26 | Clarified Review Queue no-result states for approved, evidence-missing, evidence-attached, submitted, revision, risk, program, story, and search filters so staff see the active review workflow instead of a generic filtered empty state. | `workspace.js`, `tests/workspace-app.test.mjs`, `npm run verify:functionality-language`, focused workspace/language tests | Complete |
| 2026-05-28 | Added a viewer-only read-only monitoring queue to the Site Dashboard using existing scoped Review Queue, Student Directory missing-mentor, and Operations presets, so viewers land on concrete monitoring priorities without mutation controls or new data paths. | `workspace.js`, `tests/workspace-app.test.mjs`, `scripts/verify-dashboard-actions.mjs`, focused workspace/dashboard/language verifiers | Complete |
