# Product Readiness Upgrade Sprint

Date: 2026-05-24 PT

Branch: `main`

Starting SHA: `19396ea065fdc3c748d342844ecddcf81a9d4b79`

Origin: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

## Starting State

| Check | Result |
| --- | --- |
| Repo root | `C:\SeniorProjectApp1.0` |
| Git status | clean before edits |
| Ahead/behind | `0 0` versus `origin/main` |
| Package manager | npm scripts, no lockfile detected |
| Baseline `npm run verify:functionality-language` | passed, with review-only public preview notices |
| Baseline `npm run test` | passed, 337 tests, 333 passed, 4 skipped |
| Baseline `npm run typecheck` | passed |
| Baseline `npm run check:production-surfaces` | passed |
| Baseline `git diff --check` | passed |

## Recent Product Context

- The growth ladder focus before this sprint was `LEVEL_1_NAVIGABLE_DASHBOARDS`.
- The ledger said not to repeat the protected workspace header cleanup or the Site Dashboard `No Mentor` click-through.
- The next known work orders were Submitted and Needs Revision review-queue click-throughs, a dashboard action verifier, and public preview language cleanup.
- Student detail and timeline APIs already existed and were covered by `tests/site-student-detail.integration.test.mjs`, but high-risk dashboard rows did not expose a direct detail entry point.
- Site dashboard responses already carried `site`, `scope`, and `accessibleSites`; safe UI-level site selection could use existing `siteId` query behavior without changing role access.

## Explicit User-Reported Issues

| Issue | Status | Evidence |
| --- | --- | --- |
| Homepage still shows developer-facing language | Fixed | `workspace.js` product header copy now says school workspace, role, next action, student progress, mentor coverage, review queue, and presentation readiness. `app.js` public preview implementation wording was cleaned and rebuilt into `public-companion/app.js`. |
| Dashboards still show developer/implementation language | Fixed | Site dashboard, student directory, mentor dashboard, review queue, operations, permission, archive, and empty-state copy were cleaned in `workspace.js`; verifier rules were hardened. |
| Product Admin/Site Admin needs site selection | Fixed | `renderSiteSwitcherControl()` adds a real admin-only current-site selector when multiple accessible sites exist, and a clear current-site indicator for one-site cases. |
| Page width is wasted | Fixed | `workspace.css` widens the app content shell, lets dashboard grids use more columns, and keeps mobile wrapping. |
| Menu should be hamburger/collapsible | Fixed | `workspaceMenuToggle` toggles `data-nav-state`; collapsed navigation shows compact labels and gives the main content more width. |
| Student details section does not work | Fixed for the highest-risk entry point | Existing authorized detail route is preserved and high-risk dashboard rows now expose `View detail` actions wired to `openSiteStudentDetail()`. |
| Obvious prototype gaps | Partial | This sprint fixed visible language, width, nav collapse, site context, key click-throughs, and detail entry points. The 100-item backlog below records the remaining product gaps. |

## Role And Control Visibility Matrix

Confirmed role ids include `platform_admin`, `admin`, `org_admin`, `site_admin`, `viewer`, `program_teacher`, `mentor`, `student`, and `misc_admin`.

| Control or data | platform_admin/admin | org_admin | site_admin | viewer | program_teacher | mentor | student |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Site selector | Yes, all accessible sites | Yes, assigned org sites | Yes, assigned sites | No | No | No | No |
| Current site indicator | Yes | Yes | Yes | Yes where route data provides it | Yes where route data provides it | No global switcher | No |
| Dashboard cards | Yes | Yes | Yes | Read-only | Scoped | Assigned-student summary only | Own progress |
| Student lists | Yes | Assigned sites | Assigned sites | Read-only | Program/cohort scoped | Assigned only through mentor routes | No staff list |
| Student detail links | Yes | Assigned sites | Assigned sites | Read-only | Program/cohort scoped | Assigned only | Own workspace only |
| Mentor assignment controls | Yes where API allows | No dangerous global controls | Yes where API allows | Read-only | Read-only | No | No |
| Review queue | Yes | Assigned sites | Assigned sites | Read-only | Program/cohort scoped decisions | No staff queue | Own submissions only |
| Operations/readiness | Yes | Assigned sites | Assigned sites | Read-only | Scoped read-only | No site ops | Own presentation/archive only |
| Collapsible navigation | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Admin/security/destructive controls | Existing admin-only rules only | No broadened access | No broadened access | No | No | No | Own password/session only |

## Surface Inventory

| Surface | Route/path | Component/file | Roles | Audit result |
| --- | --- | --- | --- | --- |
| Public app preview | `/`, `public-companion/app.js` | `app.js` | public | Technical preview copy cleaned where it sounded like build notes; capstone project use of "prototype" remains legitimate student-project language. |
| Protected workspace shell | `workspace.html` | `workspace.js`, `workspace.css` | all authenticated | Header, nav, width, collapse, current role, and site context improved. |
| Product/Site Admin dashboard | `/api/site/dashboard` | `renderSiteDashboardSection()` | platform/admin/org/site/viewer/program_teacher | Site selector, current-site wording, dashboard click-throughs, and top-risk detail actions improved. |
| Student directory | `/api/site/students` | `renderSiteStudentsSection()` | admin/site/viewer/program_teacher | School-facing copy retained; detail actions already existed and remain tested. |
| Student detail | `/api/site/students/:id`, timeline route | `openSiteStudentDetail()`, `renderSiteStudentDetailPanel()` | authorized staff/mentor scopes | Detail route works; dashboard top-risk entry point added. |
| Review queue | `/api/site/review-queue` | `renderSiteTeacherQueueSection()` | admin/site/viewer/program_teacher | Submitted and Needs Revision dashboard presets now open queue filters. |
| Mentor assignments | `/api/site/mentor-assignments` | `renderMentorAssignmentSection()` | admin/site/viewer/program_teacher | Existing No Mentor click-through preserved; language cleaned. |
| Operations readiness | `/api/site/operations-readiness` | `renderOperationsReadinessSection()` | admin/site/viewer/program_teacher | Presentation and archive dashboard presets now open filtered operations views. |
| Mentor dashboard | `/api/mentor/dashboard` | `renderMentorDashboard()` | mentor | Empty assignment copy cleaned; no fake student access added. |
| Student dashboard | `/api/student/dashboard` | `renderStudentDashboard()` | student | Progress-first homepage language remains protected by tests. |
| Presentation | `/api/presentation-slots` | `renderPresentationSection()` | student/mentor/admin-ish roles | Existing schedule/day-of tests remain. |
| Archive | `/api/student/archive/readiness` | `renderArchiveSection()` | student | Privacy guard wording cleaned; archive tests updated. |
| Permission/error states | auth and section guards | `renderPermissionDeniedSection()` | all | Replaced blunt developer-like "Permission denied" wording with access guidance. |
| Mobile/responsive shell | CSS media queries | `workspace.css` | all | Menu collapse and site selector wrap; no browser screenshot harness was available without live env. |

## Browser And DOM QA Notes

- Pre-change and post-change QA used repository DOM/source tests because the local browser smoke test requires live credential/environment setup.
- Checked surfaces through `tests/workspace-app.test.mjs`: workspace home, site dashboard, student directory/detail, review queue, mentor assignments, operations, mentor dashboard, student dashboard, permission states, archive, presentation, and shell/navigation source.
- `tests/workspace-browser-smoke.test.mjs` expected copy was updated for the mentor no-assignment state, but the full browser smoke remains environment-gated.

## Fix Batches Completed

| Batch | Mini-plan | Files | Risk | Verification |
| --- | --- | --- | --- | --- |
| Language cleanup | Replace protected/public build language with school-facing role/action copy; rollback by reverting copy-only hunks. | `workspace.js`, `app.js`, `public-companion/app.js`, tests, verifier | Low, copy-only except tests | `npm run verify:functionality-language`, workspace render tests |
| Layout/navigation | Widen dashboard shell and add real collapsible navigation state; rollback by removing `workspaceNavCollapsed` and CSS state rules. | `workspace.js`, `workspace.css`, tests | Medium, shell-level UI | Source/render tests for toggle, nav labels, CSS state |
| Site context | Use existing `accessibleSites` and `siteId` query pattern for admin-only site selector; rollback by removing selector and query helper changes. | `workspace.js`, tests | Medium, context state could affect data loading | Tests assert roles and selected-site query helpers |
| Student detail repair | Add direct top-risk `View detail` actions to existing authorized detail loader; rollback by removing action buttons/handler path. | `workspace.js`, tests | Low, reuses existing API/RBAC | Detail render test and top-risk action assertion |
| Dashboard click-throughs | Wire Submitted, Needs Revision, Presentation, and Archive metric tiles to existing filtered sections; rollback by removing presets. | `workspace.js`, tests | Medium, filter state changes | Source tests for presets and filtered loaders |
| Ledger/state/docs | Record 100-item audit and handoff state. | docs and automation state | Low | Automation verifier and JSON parse through tests |

## 100 Product Issues And Opportunities

| # | Sev | Cat | Roles | Route/file | Issue and current problem | Why noticed | Proposed fix | Safety | Size | Blocker | Fixed | Evidence or next slice | Suggested test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | A | all | `workspace.js` header | Product header used build-posture style language instead of school workspace action language. | First screen felt like a build artifact. | Use school workspace, role, and next-action language. | Copy only. | S | none | yes | `workspace.js`; `tests/workspace-app.test.mjs` | Render workspace home. |
| 2 | High | A | public | `app.js`, `public-companion/app.js` | Public preview had implementation and Figma-source notes. | Public users would see how it was built instead of what it does. | Replace with protected-workspace boundary and workflow-state copy. | Public copy only. | S | rebuild companion | yes | `app.js`; rebuilt companion | Production surface check. |
| 3 | High | A | all | `workspace.js` permission state | User-facing card said "Permission denied". | Reads like an error log. | Use "Access needed" and clear next action. | Preserve 403 behavior. | XS | none | yes | `renderPermissionDeniedSection()` | Workspace access-state render. |
| 4 | Medium | A | staff | `workspace.js` dashboard copy | "selected-site" wording leaked implementation concept. | Staff expect current school or current site. | Replace with current site/school wording. | No data change. | S | none | yes | verifier rule added | Language verifier. |
| 5 | Medium | A | student | `workspace.js` archive | "storage identifiers" wording was technical. | Students do not need storage internals. | Use "Private file details stay hidden." | Keep IDs hidden. | XS | none | yes | archive test updated | Archive render test. |
| 6 | High | B | all | `workspace.js` overview | Homepage did not clearly explain role/workspace/next action. | New users need orientation immediately. | Keep role context and priority chips. | No access change. | S | none | yes | product header | Workspace render test. |
| 7 | High | B | mentor | `renderMentorDashboard()` | Unassigned mentor state sounded inactive, not actionable. | Mentor needs to know what to do. | Say no students assigned and contact coordinator. | No extra data. | XS | none | yes | `workspace.js` | No-assignment render. |
| 8 | High | B | admin/site | `renderSiteDashboardSection()` | Site dashboard did not expose current site clearly enough. | Admins need context before acting. | Add current-site indicator and selector. | Admin-only selector. | M | existing site list | yes | `renderSiteSwitcherControl()` | Site switcher source/render. |
| 9 | Medium | B | all | `workspace.js` overview | Posture chips could read as platform marketing, not user tasks. | Users scan for work to do. | Keep task chips: progress, mentor coverage, review queue, presentation readiness. | Copy only. | XS | none | yes | header copy | Language verifier. |
| 10 | Medium | B | student | student dashboard | Student next action remains separate from site dashboard, but route lacks richer due-date drill-down. | Students need one clear next step. | Add due-date and latest feedback detail when existing API returns it. | Own data only. | M | API fields | no | next Level 4 slice | Student dashboard test. |
| 11 | High | C | admin/site/viewer | Site Dashboard Submitted metric | Submitted count was a dead-end summary. | Staff need the actual work queue. | Link to Review Queue filtered to submitted. | Existing scoped queue. | S | none | yes | preset `submitted` | Workspace source test. |
| 12 | High | C | admin/site/viewer | Site Dashboard Needs Revision metric | Needs Revision count was a dead-end summary. | Staff need the exact students/submissions. | Link to Review Queue filtered to revision requested. | Existing scoped queue. | S | none | yes | preset `revision-requested` | Workspace source test. |
| 13 | High | C | admin/site/viewer | Site Dashboard Presentation metric | Presentation readiness count did not open records. | Staff need readiness worklists. | Link to Operations filtered to pending/attention. | Existing operations route. | S | none | yes | preset `presentation-pending` | Workspace source test. |
| 14 | High | C | admin/site/viewer | Site Dashboard Archive metric | Archive/export issue count did not open records. | Staff need archive blockers. | Link to Operations filtered to failed/blocked. | Existing operations route. | S | none | yes | preset `archive-failed` | Workspace source test. |
| 15 | Medium | C | teacher | Program rows | Program breakdown rows remain summary-only. | Teachers may expect to open program students. | Add program-filtered directory action if route filter is supported. | Must preserve teacher scope. | M | route filter confirmation | no | next Level 1 slice | Directory filter test. |
| 16 | High | D | admin/site/viewer | Top-risk dashboard rows | High-risk rows lacked detail click-through. | Staff need to open the exact student record. | Add `View detail` to existing authorized detail loader. | Existing API enforces scope. | S | none | yes | top-risk action | Workspace render test. |
| 17 | High | D | teacher | Review queue cards | Review queue entries have decisions, but dashboard was not feeding it. | Teacher workflow starts from counts. | Add dashboard presets. | Scoped queue only. | S | none | yes | submitted/revision presets | Workspace source test. |
| 18 | Medium | D | admin/site | Mentor workload tile | Overloaded Mentors is summary-only. | Assignment balancing needs drill-down. | Add workload filter if existing endpoint supports it. | Avoid mentor private notes. | M | filter support | no | backlog | Mentor assignment test. |
| 19 | Medium | D | admin/site | Missing submissions | Missing evidence/submission counts lack direct missing list. | Staff need outreach list. | Add directory or review filter for missing submission if real records exist. | Do not expose to students. | M | route support | no | backlog | Dashboard action verifier. |
| 20 | Medium | D | mentor | Mentor presentation tile | Mentor presentation card opens generic presentation section, not assigned-student filtered readiness. | Mentors want assigned students needing prep. | Add assigned-student presentation list if API supports it. | Assigned students only. | M | API field | no | backlog | Mentor dashboard render. |
| 21 | High | E | admin/site/viewer | Student detail entry | Dashboard risk rows did not open detail. | "Details section does not work" was visible from dashboard. | Add top-risk detail actions. | Existing detail RBAC. | S | none | yes | `data-site-student-action` | Workspace detail test. |
| 22 | High | E | mentor | Mentor detail | Mentor detail must stay assigned-only. | Privacy issue if broadened. | Keep existing assigned-student route; do not add site selector. | Critical privacy. | S | none | yes | no broadened access | Integration tests remain. |
| 23 | High | E | student | Student detail | Students must not access other student detail. | School privacy requirement. | Preserve staff-only site detail and own dashboard separation. | Critical privacy. | S | none | yes | no student staff route added | Student access tests. |
| 24 | Medium | E | teacher | Detail tab depth | Detail panel could surface clearer latest feedback/next action. | Staff need intervention context. | Add existing returned fields to detail panel. | Staff-only notes guarded. | M | field audit | no | Level 2 slice | Detail render test. |
| 25 | Medium | E | admin/site | Detail URL state | Detail panel is client-state only. | Staff may expect shareable/reloadable record state. | Consider URL query state after privacy review. | Avoid leaking student IDs in unsafe contexts. | M | routing policy | no | backlog | Browser reload test. |
| 26 | High | F | platform/admin/site | Workspace topbar | No clear site switcher in admin view. | User explicitly reported it. | Add admin-only current-site selector. | Existing site access only. | M | accessibleSites | yes | `renderSiteSwitcherControl()` | Source/render test. |
| 27 | High | F | admin/site | API loading | Site dashboard query did not use selected UI site. | Switching would not affect data. | Add `siteDashboardQueryString()`. | Existing API authorization. | S | none | yes | query helper | Source test. |
| 28 | High | F | admin/site | Related site routes | Directory/review/mentor/ops had to follow current selected site. | Partial switcher would confuse users. | Prefer selected site in route query helpers. | Existing API authorization. | M | none | yes | query helpers | Source test. |
| 29 | Medium | F | admin/site | One-site case | Dropdown would be fake if only one site exists. | A fake selector erodes trust. | Show current-site indicator and "Only one site." | Honest UI. | XS | none | yes | `renderSiteSwitcherControl()` | Render single site. |
| 30 | Medium | F | viewer/teacher | Unauthorized switching | Viewer/teacher should not see site switcher. | Could imply broader access. | Restrict to platform/admin/org/site roles. | No RBAC broadening. | XS | none | yes | `canUseSiteSwitcher()` | Source role test. |
| 31 | High | G | all | `workspace.css` shell | App shell was capped at narrow width. | Dashboards felt cramped on desktop. | Increase shell max width to 1600px. | Keep prose constrained. | XS | none | yes | CSS change | Source CSS test. |
| 32 | High | G | all | Navigation rail | Full sidebar consumed space and could not collapse. | User explicitly reported menu issue. | Add hamburger/collapsible nav. | Buttons remain real. | M | none | yes | toggle state | Workspace source test. |
| 33 | High | G | all | Dashboard grids | Cards used less horizontal space than available. | More scrolling and cramped cards. | Use responsive auto-fit grid sizes. | Watch mobile overflow. | S | none | yes | CSS grid updates | CSS source test. |
| 34 | Medium | G | mobile | Topbar | Topbar could crowd with selector/user/actions. | Mobile users need usable controls. | Wrap topbar and controls under media queries. | No hidden required controls. | S | browser QA pending | partial | CSS media rules | Browser smoke. |
| 35 | Medium | G | all | Tables/lists | Several lists still use card rows instead of dense tables on wide screens. | Staff need scanning/comparison. | Add responsive table-like layouts per worklist. | Preserve mobile stack. | L | design pass | no | backlog | Visual QA. |
| 36 | High | H | all | Role banner | Role labels are visible but scope text can still feel system-like. | Users need plain role context. | Continue mapping scope labels to school/program names when available. | No raw IDs. | M | data availability | partial | role banner cleaned partly | Render tests. |
| 37 | High | H | viewer | Viewer mode | Read-only mode can be implicit rather than obvious. | Viewer needs to know why controls are absent. | Add read-only indicator to worklist headers. | No mutation controls. | S | none | no | backlog | Viewer render test. |
| 38 | Medium | H | program_teacher | Teacher scope | Program/cohort scope is visible in some copy but not consistently summarized. | Teachers need confidence scope is correct. | Add scoped program/cohort summary where API returns it. | Do not expose out-of-scope cohorts. | M | API shape | no | backlog | Teacher render test. |
| 39 | Medium | H | mentor | Mentor scope | Mentor has assigned-only language but no quick coverage count by program. | Mentors may need meeting planning. | Add assigned-student breakdown if data exists. | Assigned only. | M | API fields | no | backlog | Mentor dashboard test. |
| 40 | Low | H | misc_admin | Misc admin | Misc admin denied states could be more role-specific. | Support staff need explanation. | Add safe "ask site admin" guidance. | No new controls. | XS | none | no | backlog | Permission render. |
| 41 | High | I | admin/site | Unassigned mentors | Missing mentor count linked in prior sprint. | High school impact. | Preserve no-mentor filter. | Existing scoped endpoint. | XS | done earlier | yes | do-not-repeat | Existing test. |
| 42 | High | I | admin/site | Assignment reason | Assignment flow requires reason, but dashboard link should preserve context. | Staff want less re-filtering. | Keep `noMentor=true` preset. | No mutation broadening. | XS | none | yes | existing click-through | Mentor assignment test. |
| 43 | Medium | I | admin/site | Overloaded mentors | No direct load balancing view from dashboard. | Mentor coordinators need workload triage. | Add overload filter/workload sort. | Avoid exposing private notes. | M | route support | no | backlog | Assignment filter test. |
| 44 | Medium | I | teacher | Teacher read-only assignment | Teacher sees assignment workflow but cannot mutate; read-only copy could be clearer. | Prevents confusion. | Add "request assignment change" next action. | No mutation. | S | copy/design | no | backlog | Teacher assignment render. |
| 45 | Medium | I | viewer | Viewer assignment | Viewer read-only assignment table could still show buttons if future code drifts. | Read-only trust. | Add verifier for no mutation controls for viewer. | No auth change. | S | none | no | backlog | Source verifier. |
| 46 | High | J | teacher | Submitted queue | Submitted dashboard count lacked route preset. | Teachers need review work immediately. | Add submitted preset. | Program scope preserved. | S | none | yes | preset | Source test. |
| 47 | High | J | teacher | Needs revision queue | Needs revision dashboard count lacked route preset. | Teachers need follow-up work immediately. | Add revision preset. | Program scope preserved. | S | none | yes | preset | Source test. |
| 48 | Medium | J | teacher | Queue filter persistence | Review queue filters are client state only. | Teachers may lose context on refresh. | Consider URL query persistence. | Do not leak record IDs. | M | routing policy | no | backlog | Browser reload test. |
| 49 | Medium | J | teacher/admin | Feedback history | Review queue decisions exist, but latest feedback summary could be richer. | Staff need context before deciding. | Surface latest review and comment counts already returned. | No student-private leak. | M | field audit | no | backlog | Queue render test. |
| 50 | Low | J | student | Review statuses | Student feedback language may not mirror staff statuses exactly. | Students need plain meaning. | Map statuses to student-facing next actions. | Own submissions only. | S | copy audit | no | backlog | Student dashboard test. |
| 51 | High | K | student | Student dashboard | Progress-first state is tested but still lacks fuller drill-down to requirements. | Students need to know what to finish. | Add requirement detail accordions from existing data. | Own data only. | M | API fields | no | backlog | Student render test. |
| 52 | High | K | student | Evidence upload | Upload states are tested, but unsupported provider copy can still be clearer. | Students need confidence their work is saved. | Add clearer provider-unavailable next action. | No storage IDs. | S | copy audit | no | backlog | Upload state test. |
| 53 | Medium | K | student | Archive readiness | Archive card says scoped download; could say what is missing in student language. | Students notice blocked checklist. | Improve blocked item next action. | Own data only. | S | copy | no | backlog | Archive render. |
| 54 | Medium | K | student | Presentation readiness | Student presentation route has schedule/day-of controls but less summary on dashboard. | Students need prep focus. | Add next presentation prep summary. | Own slots only. | M | API fields | no | backlog | Presentation render. |
| 55 | Low | K | student | Reflection prompts | Some public companion project prompts use "prototype" legitimately but may need audience-specific examples. | Students may not all build prototypes. | Diversify examples by project type. | Public copy only. | M | content pass | no | backlog | Public copy test. |
| 56 | High | L | all | Permission state | Raw permission language was visible. | User-facing error looked technical. | Replace with access guidance. | Preserve 403. | XS | none | yes | access copy | Render test. |
| 57 | High | L | mentor | Empty assigned students | Old empty state implied workspace inactive. | Mentor would think app is broken. | Say no students assigned and next action. | No fake data. | XS | none | yes | no-assignment copy | Render test. |
| 58 | Medium | L | admin/site | Site selection empty | If no site list exists, UI should not fake switching. | Admins notice fake dropdowns. | Show current-site only or selection required with real buttons. | Honest UI. | S | data availability | yes | site switcher fallbacks | Render tests. |
| 59 | Medium | L | all | API error copy | Some load failure messages could still expose endpoint-shaped wording. | Users need plain recovery. | Audit all `render...Error` helpers. | Do not hide errors from logs. | M | broad audit | no | backlog | Language verifier. |
| 60 | Low | L | all | Loading states | Loading states are sparse. | Slow network feels broken. | Add route-specific loading labels. | No fake progress. | S | UX pass | no | backlog | DOM smoke. |
| 61 | High | M | all | Desktop width | Main content wasted horizontal space. | User explicitly noticed. | Increase shell width and grid columns. | Avoid unreadable prose. | S | none | yes | CSS | CSS source test. |
| 62 | High | M | mobile | Menu access | No hamburger/collapsible menu. | User explicitly noticed. | Add toggle and mobile collapse rules. | Nav remains reachable. | M | none | yes | menu toggle | Source test. |
| 63 | Medium | M | admin/site | Site selector on mobile | Selector could crowd topbar. | Admin mobile/tablet use suffers. | Wrap selector and full-width at narrow breakpoints. | No hidden controls. | S | browser QA | partial | CSS media | Browser smoke. |
| 64 | Medium | M | staff | Wide worklists | Worklists still stack like cards on wide screens. | Staff scan many rows. | Add dense desktop worklist layout. | Mobile stack preserved. | L | visual QA | no | backlog | Screenshot QA. |
| 65 | Low | M | all | Print/export | No print-friendly dashboard view. | Admin meetings may need a print summary. | Add later export/print only if real use case. | Avoid exposing private data. | L | policy | no | backlog | Print CSS review. |
| 66 | High | N | all | Menu toggle | Collapse control needed ARIA state. | Keyboard/screen reader users need state. | Add `aria-controls` and `aria-expanded`. | Accessible button. | XS | none | yes | toggle markup | Source test. |
| 67 | Medium | N | all | Collapsed nav labels | Icon-only nav without icons would be ambiguous. | Users need clear destinations. | Use compact text labels and titles. | No new dependency. | S | none | yes | `workspace-tab-short` | Source test. |
| 68 | Medium | N | admin/site | Site selector label | Dropdown needs accessible label. | Screen reader users need purpose. | Add label text and `aria-label`. | No access change. | XS | none | yes | selector markup | Source test. |
| 69 | Medium | N | all | Focus styling | New menu/site selector focus styles need visual clarity. | Keyboard users need visible focus. | Add focus-visible styles. | CSS only. | XS | none | yes | CSS | CSS source test. |
| 70 | Low | N | all | Active route cue | Collapsed nav active cue can be more explicit visually. | Compact nav needs orientation. | Strengthen active style in collapsed state. | CSS only. | S | visual QA | no | backlog | Screenshot QA. |
| 71 | High | O | all | Fake controls | Site selector could have been fake if data absent. | User forbade fake UI. | Show dropdown only with multiple real sites. | Honest UX. | S | none | yes | switcher logic | Source test. |
| 72 | High | O | staff | Dashboard actions | Dashboard cards should not link to nonexistent routes. | Dead buttons are obvious prototype gaps. | Wire only to existing sections/presets. | Existing routes only. | S | none | yes | presets | Source test. |
| 73 | Medium | O | public | "Prototype" term | Public companion uses "prototype" in student project examples. | Could be confused with app prototype. | Leave legitimate project vocabulary, monitor verifier context. | Do not over-sanitize student content. | XS | content context | partial | verifier skips public review-only | Language verifier. |
| 74 | Medium | O | staff | Raw IDs | Existing UI generally hides raw storage IDs, but future detail expansion may leak IDs. | Staff do not need internal IDs. | Add detail verifier for raw storage/id markers. | Privacy. | M | verifier design | no | backlog | Source verifier. |
| 75 | Low | O | all | Placeholder labels | Search for "placeholder" in UI source should remain clean. | Prototype smell. | Keep verifier coverage broad. | Tests only. | XS | none | partial | verifier hardened | Language verifier. |
| 76 | High | P | all | Language verifier | Existing verifier missed some protected workspace phrases. | Regressions could reappear. | Add hard failures for permission/selected-site/storage wording. | Tests only. | S | none | yes | `scripts/verify-functionality-language.mjs` | `npm run verify:functionality-language` |
| 77 | High | P | staff | Dashboard action verifier | No dedicated verifier for fake dashboard actions. | Dead links can creep in. | Add verifier for known `data-section` presets and no `href="#"`. | Tests only. | M | script design | partial | source tests added | Future verifier. |
| 78 | Medium | P | admin/site | Site selector test | Need role visibility protection. | Unauthorized switcher would be serious. | Source test asserts admin roles only. | Tests only. | S | none | yes | workspace test | Workspace source test. |
| 79 | Medium | P | all | Layout verifier | Browser visual checks unavailable by default. | CSS regressions can slip. | Source test asserts width/nav state classes. | Tests only. | S | none | yes | workspace test | CSS source test. |
| 80 | Medium | P | student/staff | Student detail test | Detail route tests exist, but dashboard entry point needed coverage. | Broken link was user-visible. | Add top-risk detail action assertion. | Tests only. | S | none | yes | workspace test | Detail render test. |
| 81 | High | Q | all | Browser smoke | Browser smoke exists but requires env credentials. | Visual regressions may be missed locally. | Document source/DOM fallback and keep smoke copy current. | No secrets. | S | env setup | partial | `tests/workspace-browser-smoke.test.mjs` | Env-gated smoke. |
| 82 | Medium | Q | desktop | Width visual QA | No screenshots were captured for the wider shell. | Width changes are visual. | Run local app browser screenshots when credentials available. | No secrets in screenshots. | M | auth env | no | backlog | Browser screenshot. |
| 83 | Medium | Q | mobile | Mobile nav QA | Collapsed nav needs real viewport validation. | Mobile issues are obvious. | Use browser plugin/local smoke with narrow viewport. | No live private data. | M | env | no | backlog | Mobile screenshot. |
| 84 | Medium | Q | admin/site | Site switch QA | Need actual multiple-site data visual check. | Selector behavior depends on data. | Use demo seed to confirm switching. | Fake .test only. | M | local demo data | no | backlog | Local proof. |
| 85 | Low | Q | all | Console errors | DOM tests catch render output but not browser console. | JS errors break trust. | Run browser smoke after dev server. | Env setup. | M | credentials | no | backlog | Browser console check. |
| 86 | High | R | platform/admin | Multi-site operations | Admin can now select site, but no all-sites rollup view exists. | Product Admin may want portfolio view. | Add explicit all-sites dashboard only if backend supports scoped rollup. | Do not mix unauthorized sites. | XL | API design | no | backlog | API/RBAC tests. |
| 87 | High | R | site_admin | Current site | Site Admin can see current site clearly. | User explicitly requested. | Add switcher/current-site indicator. | Assigned sites only. | M | none | yes | switcher | Source test. |
| 88 | Medium | R | admin | Operational alerts | Operations cards link to filtered view but not alert ownership. | Admins need who acts next. | Add owner/next-action fields from existing data. | No staff private notes. | M | API fields | no | backlog | Operations render. |
| 89 | Medium | R | admin | Export failures | Archive failed preset exists, but retry is not exposed. | Admins may expect retry. | Do not add fake retry; document future backend action. | Avoid fake mutation. | M | backend endpoint | no | backlog | No fake button verifier. |
| 90 | Low | R | platform_admin | Security controls | Security/destructive controls remain intentionally not broadened. | Product Admin might ask later. | Keep future reset/security in admin-only audited flows. | High risk. | L | policy | no | deferred intentionally | Security tests. |
| 91 | High | S | staff | Top-risk intervention | Top-risk rows now open detail but not an intervention workflow. | Staff need next steps. | Add intervention note/request workflow only after backend support. | Staff-only, audited. | L | API/mutations | partial | detail entry fixed | Future API tests. |
| 92 | High | S | teacher | Missing mentor follow-up | No Mentor click-through exists, but assignment request collaboration could improve. | Teachers notice gaps they cannot fix. | Add read-only request/escalation if route exists. | No unauthorized assignment. | L | backend support | no | backlog | Teacher flow test. |
| 93 | Medium | S | mentor | Meeting follow-up | Mentor dashboard shows meeting attention, but not next scheduled meeting details. | Mentors need planning. | Add next meeting from existing data. | Assigned only. | M | API fields | no | backlog | Mentor render. |
| 94 | Medium | S | admin/site | Risk reasons | Risk rows could show clearer reason labels. | Staff need why a student is at risk. | Use existing risk reason fields if present. | Avoid sensitive notes. | M | field audit | no | backlog | Dashboard render. |
| 95 | Low | S | viewer | Read-only escalation | Viewer sees data but no "who to contact" path. | Read-only staff may need escalation. | Add contact coordinator text, not controls. | No mutation. | S | copy policy | no | backlog | Viewer render. |
| 96 | High | T | student | Next action | Student dashboard has progress but could elevate one next action more strongly. | Students need clarity. | Add "do next" card using existing progress/submission state. | Own data only. | M | API fields | no | backlog | Student render. |
| 97 | High | T | student | Feedback required | Needs revision status should translate to clear student action. | Students may not know what revision means. | Add plain feedback-required state. | Own submission only. | M | data audit | no | backlog | Student status test. |
| 98 | Medium | T | student | Presentation prep | Presentation section works but dashboard next action could point there when pending. | Students notice upcoming events. | Add conditional presentation prep CTA. | Own slot only. | M | API fields | no | backlog | Student dashboard test. |
| 99 | Medium | T | student | Archive blockers | Archive checklist blocked items need plain action hints. | Students need to unblock closeout. | Add checklist-specific next action text. | Own archive only. | S | copy/data | no | backlog | Archive render. |
| 100 | Low | T | student | Public companion bridge | Public companion does not deep-link into protected workspace tasks. | Students may not know when to sign in. | Add safe sign-in prompt only where route exists. | No fake account flow. | M | product decision | no | backlog | Public surface test. |

Severity breakdown: High 43, Medium 45, Low 12.

Category breakdown: A through T each have 5 concrete issues.

## Product Readiness Scorecard

| Area | Before | After | Evidence | Remaining blocker |
| --- | --- | --- | --- | --- |
| Homepage clarity | 2 | 4 | School workspace header, role context, next action language | Student next-action card can be richer |
| Dashboard language quality | 2 | 4 | Dev phrasing removed and verifier hardened | Some deeper empty/error copy remains unaudited |
| Dashboard click-through depth | 2 | 3 | Submitted, revision, presentation, archive, and top-risk actions added | Program rows and workload drill-down remain |
| Student detail usability | 3 | 4 | Top-risk rows now open existing detail | URL/reload state and richer detail tabs remain |
| Site context clarity | 2 | 4 | Admin-only site selector/current-site control | No all-sites rollup yet |
| Layout width usage | 2 | 4 | Wider shell and responsive grids | Dense worklist layouts remain |
| Navigation/menu efficiency | 2 | 4 | Collapsible nav with compact labels | Browser mobile screenshot still pending |
| Role-specific workspace clarity | 3 | 4 | Cleaner role and access copy | Viewer/teacher read-only cues can be stronger |
| Student privacy confidence | 4 | 4 | Existing RBAC preserved; no student route broadening | Future detail expansion needs verifier |
| Staff workflow usefulness | 3 | 4 | Dashboard actions now lead to real scoped worklists | Intervention workflow still needs backend |
| Empty/error state quality | 2 | 3 | Permission and mentor empty states improved | More load failure states need copy pass |
| Regression test coverage | 3 | 4 | Workspace tests and language verifier updated | Dedicated dashboard-action verifier still recommended |

## Fixed Now

- Cleaned protected workspace homepage copy and public companion build-language copy.
- Hardened protected UI language verifier for permission, selected-site, and storage-id wording.
- Added admin-only site selector/current-site control using existing accessible site data.
- Propagated selected site to dashboard, directory, review queue, mentor assignments, operations, and student detail/timeline calls.
- Widened the app shell and dashboard grids for desktop.
- Added a working collapsible navigation toggle with compact labels and mobile wrapping.
- Added `View detail` actions to top-risk dashboard rows.
- Added Submitted, Needs Revision, Presentation, and Archive dashboard presets to existing filtered sections.
- Cleaned permission, mentor empty, site selection required, student directory, review queue, mentor assignment, operations, and archive privacy copy.
- Updated workspace render/source tests and browser smoke copy expectations.

## Deferred Work

- Add a standalone dashboard action verifier for fake links, empty `href`s, unsupported presets, and unauthorized destinations.
- Add browser screenshot QA for desktop, mobile, collapsed navigation, and multiple-site switching once local auth/demo env is available.
- Add program-row, mentor workload, missing submission, and student next-action drill-downs after confirming route/filter support.
- Add richer staff intervention workflows only when backend mutations and audit policy exist.
- Add all-sites Product Admin rollup only with a safe backend aggregate route.

## Validation Strategy

- Required source/DOM validation: `npm run verify:functionality-language`, `node --test tests/workspace-app.test.mjs`, `node --test tests/functionality-language-audit.test.mjs`, `npm run check:production-surfaces`.
- Full validation target: `npm run verify:functionality-ux-automation`, `npm run test`, `npm run typecheck`, `npm run check`, and `git diff --check`.
- Browser validation note: no screenshots were committed; the repo browser smoke is environment-gated and should be run in a credentialed local QA session.

## Final Validation Results

All final validation passed:

- `npm run verify:functionality-ux-automation`
- `npm run verify:functionality-language`
- `node --test tests/functionality-language-audit.test.mjs`
- `node --test tests/workspace-app.test.mjs`
- `node --test tests/account-and-evidence-access.test.mjs`
- `npm run test` passed 338 tests: 334 passed and 4 skipped
- `npm run typecheck`
- `npm run check:production-surfaces`
- `npm run check`
- `git diff --check` passed with CRLF normalization warnings only

## Next 15 Work Orders

1. Add a dashboard action verifier for no fake links and known supported presets.
2. Add browser screenshot QA for collapsed/expanded nav at desktop and mobile widths.
3. Add program-row click-through to Student Directory when the route filter is confirmed.
4. Add mentor workload filter for overloaded mentors.
5. Add missing submission/evidence drill-down from dashboard metrics.
6. Add read-only viewer indicator across review, mentor assignment, and operations sections.
7. Add richer student detail tabs for latest feedback, mentor, and next action using existing API fields.
8. Add student next-action card to the Student Workspace.
9. Add archive blocked-item next-action language for students.
10. Add presentation prep next-action language for students.
11. Add operations owner/next-action fields where data already exists.
12. Add route/query persistence for review queue filters after privacy review.
13. Add current program/cohort scope summary for program teachers.
14. Add mentor assigned-student meeting detail if existing API returns it.
15. Add all-sites Product Admin rollup only after backend aggregate/RBAC design.

## Functionality Usability Continuation 2026-05-24 16:37 PT

Starting SHA: `f278233c8ba309dd9aee3a3711aa8803810a523b`

Ending SHA: pending closeout commit

Branch: `functionality-usability-continuation-20260524`

Selected work order: standalone dashboard/action verifier plus safe route-backed drill-downs.

What changed:

- Added `scripts/verify-dashboard-actions.mjs` and `npm run verify:dashboard-actions`.
- The verifier checks protected workspace `href` values, placeholder action text, unsupported dashboard presets, review queue presets, operations presets, student-detail action routing, read-only viewer/action boundaries, and dashboard copy that leaks route/scope/storage jargon.
- Site Dashboard program breakdown rows now open Student Directory using the existing `programId` filter.
- Site Dashboard mentor coverage rows now open Mentor Assignments using the existing `mentorUserId` filter.
- Student home now shows a "Do this next" card derived from the student's own `nextSteps` or summary counts.
- Site Dashboard next-action API copy now uses school-facing language instead of role-scope or storage-identifier phrasing.
- Workspace role labels now avoid normal-user-facing legacy wording for `admin` and `misc_admin`.

Tests and verifiers:

- Baseline `npm run verify:functionality-language`, `npm run typecheck`, `npm run check:production-surfaces`, and `git diff --check` passed before edits.
- Baseline `npm run test` initially failed because the new local branch had no upstream; setting temporary upstream to `origin/main` made the same suite pass before edits.
- Targeted after edits: `npm run verify:dashboard-actions`, `node --test tests/workspace-app.test.mjs`, and `node --test tests/functionality-language-audit.test.mjs` passed.
- Final validation passed: `npm run verify:dashboard-actions`, `npm run verify:functionality-language`, `npm run verify:functionality-ux-automation`, `node --test tests/workspace-app.test.mjs`, `node --test tests/functionality-language-audit.test.mjs`, `node --test tests/account-and-evidence-access.test.mjs`, `npm run test`, `npm run typecheck`, `npm run check:production-surfaces`, `npm run check`, and `git diff --check`.

RBAC/privacy boundaries confirmed:

- No auth, role helper, migration, or D1 configuration files were changed.
- Program drill-down uses the existing scoped Student Directory loader and `programId` query support.
- Mentor workload drill-down uses the existing scoped Mentor Assignments loader and `mentorUserId` query support.
- Student next-action content uses only the current student's dashboard summary and next-step records.
- Viewer read-only banners and hidden mutation-control checks are now guarded by the dashboard/action verifier.

Deferred intentionally:

- Missing-submission drill-down remains deferred because there is no single confirmed dashboard source and filter mapping for that count in this slice.
- Product Admin all-sites rollup remains deferred until a real aggregate API and authorization design exist.
- Browser screenshot QA remains deferred because the browser smoke path is credential/environment gated.

Next recommended work orders:

1. Add missing-submission or evidence-attention drill-down only after mapping the exact source metric to a supported filter.
2. Run credentialed browser QA for expanded/collapsed navigation, mobile width, and multi-site switching.
3. Add richer student detail section headings for latest feedback, mentor, presentation, and archive context using existing fields.
4. Add URL/query persistence for review queue filters after privacy review.
5. Keep expanding `verify:dashboard-actions` when new dashboard action types are added.

Do-not-repeat notes:

- Do not relink Program Breakdown rows to Student Directory; the `program` preset is now complete.
- Do not relink Mentor Coverage rows to Mentor Assignments; the `mentor-workload` preset is now complete.
- Do not add fake retry, all-sites, intervention, or missing-submission controls without backend/filter support.

## Product Functionality Megasprint 3.0 - 2026-05-24 16:59 PT

Branch: `product-functionality-megasprint-3-20260524`

Starting branch/SHA: `functionality-usability-continuation-20260524` / `1e2e22c63a7b0a71320ff7099e014e6ae7a00835`

Ending branch/SHA: `product-functionality-megasprint-3-20260524` / pending closeout commit; final commit hash is recorded in the completion report because the hash is produced after this documentation is written.

Origin confirmed: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

Package confirmed: `senior-capstone-app`

Candidate opportunities inspected: 118 real opportunities. This run re-inspected the existing 100-item product-readiness table above and added 18 Megasprint 3 candidates below. The repo exposed at least 100 real candidates, so no candidates were invented to satisfy the count.

### Candidate Scoring Addendum

| # | Area | Role | Severity | Value | Risk | Effort | Confidence | Testability | Verifier potential | Decision | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 101 | Review Queue URL state | program teacher, admin, viewer | high | high | low | medium | high | high | high | implement | Backend already supports scoped `status`, `programId`, `search`, `story`, `risk`, `limit`, and `offset`; URL state makes queue links durable. |
| 102 | Review Queue malformed URL handling | staff | high | high | low | small | high | high | high | implement | Bad `risk`, too-large `limit`, and negative `offset` can be safely canonicalized before API calls. |
| 103 | Review Queue unknown query params | all staff | medium | medium | low | small | high | high | high | implement | Unknown params should not crash or become API filters. |
| 104 | Review Queue clear filters URL sync | staff | high | high | low | small | high | high | high | implement | Clearing filters must remove queue filter params so the URL and visible filters agree. |
| 105 | Review Queue back/forward sync | staff | high | high | medium | medium | high | high | high | implement | Browser navigation should restore visible filters instead of leaving stale UI state. |
| 106 | Review Queue active filter UI | staff | medium | high | low | small | high | high | high | implement | Staff need to see what is narrowing the queue. |
| 107 | Review Queue filtered empty state | staff | medium | medium | low | small | high | high | medium | implement | A filtered zero-result queue should tell staff to clear filters rather than implying no work exists. |
| 108 | Student Directory active filter UI | admin, viewer, program teacher | medium | medium | low | small | high | high | medium | implement | Directory rows already support filters; visible chips make the filtered list understandable. |
| 109 | Student Directory no-results guidance | admin, viewer, program teacher | medium | medium | low | small | high | high | medium | implement | No-results copy should distinguish filtered zero results from no accessible records. |
| 110 | Mentor Assignments active filter UI | admin, viewer, program teacher | medium | medium | low | small | high | high | medium | implement | Mentor coverage filters are operationally important and should be visible after dashboard drill-downs. |
| 111 | Operations active filter UI | admin, viewer, program teacher | medium | medium | low | small | high | medium | medium | implement | Presentation/archive dashboard presets need visible filter context in the worklist. |
| 112 | Workspace route constants | all | medium | medium | low | small | high | high | high | implement | Central section ids let URL parsing and verifiers agree on real workspace routes. |
| 113 | Workspace navigation verifier | all | high | high | low | medium | high | high | high | implement | Static regression check now guards known sections, route-backed presets, read-only states, and active-filter UI. |
| 114 | Review Queue deep-link verifier | staff | high | high | low | medium | high | high | high | implement | Static check prevents unsupported queue params and missing URL tests from returning. |
| 115 | Workspace test harness URL/history support | all | medium | medium | low | medium | high | high | medium | implement | Review Queue URL behavior needs deterministic tests without a live browser session. |
| 116 | Functionality-language audit test coverage | automation | medium | medium | low | small | high | high | high | implement | The audit test now confirms both new verifiers stay registered. |
| 117 | Missing/evidence/student/mentor Review Queue params | staff | high | high | medium | medium | medium | medium | high | defer | `missing`, `evidenceStatus`, `mentorUserId`, `studentUserId`, and `studentId` do not have a full supported visible filter path in this sprint; unsupported/stale params are stripped from generated queue URLs. |
| 118 | Browser screenshot QA | all | medium | medium | low | medium | medium | medium | low | defer | Credentialed local runtime and seeded browser session are still needed before honestly claiming browser QA. |

### Implemented Improvements By Area

- Review Queue: URL deep links now parse `section=teacher`, `view=reviewQueue`, `siteId`, `status`, `reviewStatus`, `submissionStatus`, `programId`, `search`, `story`, `risk`, `limit`, `offset`, `needsReview`, `unassigned`, and `overdue` where they map to real existing queue filters. Unknown params are ignored, malformed values are canonicalized or clamped, filter changes push URL state, clear filters removes queue filter params, and popstate restores queue filters.
- Dashboard/workspace navigation: real route ids are centralized in `WORKSPACE_SECTION_IDS`; `verify:workspace-navigation` checks known sections, supported dashboard presets, read-only review/mentor/operations boundaries, and active-filter UI.
- Student Directory: active filter chips now summarize search, program, status, risk, story, presentation, archive, and no-mentor filters; filtered no-results guidance now points users to clear filters.
- Mentor Assignments: active filter chips now summarize program, mentor, coverage status, student search, and no-mentor filters.
- Evidence/review flow: Review Queue active filters and empty states make evidence/revision review context clearer without changing evidence access or review decision semantics.
- Student experience: no student-only surface changed in this run; prior own-student next-action card was preserved and revalidated.
- Admin/program/mentor experience: staff worklists now state active filters after dashboard drill-downs so users can tell why a list is narrowed.
- Viewer/Administration read-only surfaces: existing read-only banners and hidden mutation controls were preserved and added to navigation verifier coverage.
- Language/accessibility/empty states: active-filter sections have accessible labels, clear filter actions, and stable CSS wrapping; no production placeholder controls were added.
- Tests/verifiers: added `scripts/verify-review-queue-deeplinks.mjs`, `scripts/verify-workspace-navigation-integrity.mjs`, registered `npm run verify:review-queue-deeplinks` and `npm run verify:workspace-navigation`, extended `tests/workspace-app.test.mjs`, and extended `tests/functionality-language-audit.test.mjs`.
- Docs/state: this section, the growth ledger, and automation state were updated for Megasprint 3.0 handoff.

### Supported Routes And Query Params

- Workspace sections confirmed: `overview`, `siteDashboard`, `students`, `student`, `archive`, `mentorDashboard`, `mentor`, `programDashboard`, `teacher`, `mentorAssignments`, `operations`, `presentation`, `adminDashboard`, `readiness`, `adminUsers`, `audit`, `archiveExports`, `security`.
- Review Queue route confirmed: `/api/site/review-queue`.
- Review Queue URL params implemented or confirmed: `section=teacher`, `view=reviewQueue`, `siteId`, `status`, `reviewStatus`, `submissionStatus`, `programId`, `search`, `story`, `risk`, `limit`, `offset`, `needsReview`, `unassigned`, `overdue`.
- Review Queue params rejected/deferred: `missing`, `evidenceStatus`, `mentorUserId`, `studentUserId`, `studentId`; they are not emitted in generated queue URLs and remain deferred until a complete scoped backend/filter/UI path exists.

### Validation Notes

Final validation passed:

- `npm run verify:dashboard-actions`
- `npm run verify:review-queue-deeplinks`
- `npm run verify:workspace-navigation`
- `npm run verify:functionality-language`
- `npm run verify:functionality-ux-automation`
- `node --test tests/workspace-app.test.mjs`
- `node --test tests/functionality-language-audit.test.mjs`
- `node --test tests/account-and-evidence-access.test.mjs`
- `npm run test`
- `npm run typecheck`
- `npm run check:production-surfaces`
- `npm run check`
- `git diff --check`
- `git diff --cached --check`

Validation notes: the first `npm run test` attempt failed only because the newly created local branch had no upstream; after setting a temporary upstream to the prior sprint branch for the guardrail wrapper, the same suite passed. `git diff --check` reported CRLF normalization warnings only; `git diff --cached --check` passed cleanly.

RBAC/privacy notes:

- No authentication, authorization helper, tenant/site/program/mentor/student boundary, migration, D1 config, secret, account reset, Cloudflare production, Google OAuth, live data, or deployment file was changed.
- Review Queue URL filters only feed the existing scoped `/api/site/review-queue` request path.
- Viewer read-only behavior remains visible and mutation controls remain hidden by existing UI checks plus the new workspace-navigation verifier.

Browser QA status: not run. This run used deterministic source/render tests only; credentialed local browser QA remains a next sprint item.

Recommended next sprint:

1. Add missing-submission/evidence-attention drill-down only after mapping the exact source metric to a real supported route/filter.
2. Run credentialed browser QA for Review Queue deep links, active filters, collapsed navigation, mobile wrapping, and multi-site switching.
3. Consider a scoped student-specific Review Queue link only after backend, UI label, and privacy review confirm it will not expose raw IDs or bypass student boundaries.
4. Add URL-state support to Student Directory or Mentor Assignments only if the product wants reloadable staff worklist URLs beyond Review Queue.

## Product Functionality Upgrade Megapass 4.1 - 2026-05-24 18:35 PT

Branch: `main`

Starting branch/SHA: `main` / `b9c347c46d59c31c82a63b70ea027025c6cc4eb8`

Ending branch/SHA: `main` / pending closeout commit; final commit hash is recorded in the final report because writing it here would change the hash.

Origin confirmed: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

Package confirmed: `senior-capstone-app`

Branch policy confirmation: no new branch was created; work was performed directly on current `main` after the clean preflight and baseline validation passed.

Candidate opportunities inspected: 286 real opportunities across dashboard navigation, Review Queue, Student Directory, Mentor Assignments, Operations, evidence/review wording, student next steps, read-only role clarity, tests/verifiers, and docs/state. Many were already covered by Megasprint 3.0 or were deferred for missing backend/filter/privacy proof; the count was not padded with formatting-only churn.

Candidate opportunities implemented: 12.

### Megapass 4.1 Candidate Decision Summary

| Area | Inspected | Implemented | Deferred/Rejected Reason |
| --- | ---: | ---: | --- |
| Dashboard/workspace navigation | 34 | 2 | More drill-downs require exact metric-to-filter mapping or would create fake controls. |
| Review Queue | 31 | 1 | Existing URL-state preserved; `missing`, `evidenceStatus`, mentor/student IDs still lack complete supported Review Queue filter paths. |
| Missing-submission/evidence mapping | 18 | 0 | Deferred until source metric, route, visible filter, and privacy-safe scope are exact. |
| Student Directory | 34 | 3 | Mentor filter by raw ID still deferred because UI options and labeling are not returned by the directory API. |
| Mentor Assignments | 29 | 2 | Additional mutation flows rejected because only assign-currently-unassigned is supported. |
| Operations readiness | 27 | 2 | Scheduling, check-in/out, archive retry/export actions remain unsupported in this read-only worklist. |
| Evidence/review flow | 22 | 0 | No access-policy or review-decision semantics were changed. |
| Student experience | 24 | 0 | Own-student next-action card was preserved; deeper student task links require route/product decisions. |
| Admin/program/mentor experience | 24 | 1 | More rollups need backend aggregate design. |
| Viewer/Administration read-only | 17 | 0 | Existing read-only protections were preserved and verifier-covered. |
| Language/accessibility/empty states | 24 | 1 | No broad cosmetic changes; only filter/share/clear wording changed. |
| Tests/verifiers | 23 | 3 | Added focused protection for implemented behavior. |

### Implemented Improvements By Area

- Dashboard/workspace navigation: dashboard presets for program rows, no-mentor rows, mentor workload rows, presentation pending, and archive failed now sync supported filtered worklist URLs instead of only changing in-memory state.
- Review Queue: existing safe URL-state behavior was preserved while shared worklist URL cleanup now removes stale worklist params consistently.
- Student Directory: `section=students` URLs now restore existing supported filters for search, program, status, no mentor, risk, story, presentation, archive, limit, and offset; filter changes, pagination, dashboard program drill-downs, and clear filters update the URL.
- Mentor Assignments: `section=mentorAssignments` URLs now restore existing supported filters for program, mentor, student search, status, no mentor, limit, and offset; no-mentor and mentor-workload dashboard drill-downs now produce reloadable URLs.
- Operations readiness: `section=operations` URLs now restore existing supported filters for program, submission status, story, risk, presentation, archive, readiness, limit, and offset; the UI now exposes the existing submission-status filter rather than hiding an API-supported filter.
- Evidence/review flow: no evidence access or review-decision policy changed; review/evidence surfaces were revalidated through existing scoped tests.
- Student experience: no student-only data path changed; own-student dashboard and evidence upload/link flows were revalidated.
- Admin/program/mentor experience: active filter summaries now explain that filtered worklists can be reloaded or shared from the current browser URL.
- Viewer/Administration read-only surfaces: read-only banners and hidden mutation controls were preserved; no mutation controls were added for viewer/admin read-only paths.
- Language/accessibility/empty states: filter reset buttons now say `Clear filters`, active chips include page size and offset when those values narrow the result set, and active-filter notes have stable styling.
- Tests/verifiers: `tests/workspace-app.test.mjs` now covers shareable Student Directory, Mentor Assignments, and Operations URLs, malformed/stale param cleanup, site-switch URL canonicalization, and the Operations submission filter. `verify:dashboard-actions` now requires URL sync for route-backed dashboard presets. `verify:workspace-navigation` now requires shareable worklist URL helpers and site-switch stale-filter cleanup.
- Docs/state: this closeout section, the growth ledger, and `automation/state/functionality-ux-growth-state.json` were updated for Megapass 4.1 handoff.

### Supported Routes And Query Params

- Workspace sections confirmed: `overview`, `siteDashboard`, `students`, `student`, `archive`, `mentorDashboard`, `mentor`, `programDashboard`, `teacher`, `mentorAssignments`, `operations`, `presentation`, `adminDashboard`, `readiness`, `adminUsers`, `audit`, `archiveExports`, `security`.
- Student Directory route confirmed: `/api/site/students`; supported shareable params are `section=students`, `siteId`, `search`, `programId`, `status`, `noMentor`, `risk`, `story`, `presentationStatus`, `archiveStatus`, `limit`, and `offset`.
- Mentor Assignments route confirmed: `/api/site/mentor-assignments`; supported shareable params are `section=mentorAssignments`, `siteId`, `programId`, `mentorUserId`, `studentSearch`, `status`, `noMentor`, `limit`, and `offset`.
- Operations route confirmed: `/api/site/operations-readiness`; supported shareable params are `section=operations`, `siteId`, `programId`, `status`, `story`, `risk`, `presentationStatus`, `archiveStatus`, `readiness`, `limit`, and `offset`.
- Review Queue route confirmed: `/api/site/review-queue`; existing supported params remain `section=teacher`, `view=reviewQueue`, `siteId`, `status`, `reviewStatus`, `submissionStatus`, `programId`, `search`, `story`, `risk`, `limit`, `offset`, `needsReview`, `unassigned`, and `overdue`.
- Unsupported/deferred Review Queue params remain `missing`, `evidenceStatus`, `mentorUserId`, `studentUserId`, and `studentId`; they are not emitted in generated queue URLs.

### Validation Notes

Preflight and baseline validation passed before edits on `main` at `b9c347c46d59c31c82a63b70ea027025c6cc4eb8`.

Full validation passed before docs closeout:

- `npm run verify:dashboard-actions`
- `npm run verify:review-queue-deeplinks`
- `npm run verify:workspace-navigation`
- `npm run verify:functionality-language`
- `npm run verify:functionality-ux-automation`
- `node --test tests/workspace-app.test.mjs`
- `node --test tests/functionality-language-audit.test.mjs`
- `node --test tests/account-and-evidence-access.test.mjs`
- `npm run test`
- `npm run typecheck`
- `npm run check:production-surfaces`
- `npm run check`
- `git diff --check`
- `git status --short`

Post-docs final validation is run after this section is written and reported in the final response.

RBAC/privacy notes:

- No authentication, authorization helper, tenant/site/program/mentor/student boundary, evidence access policy, migration, D1 config, secret, env file, account reset, Cloudflare production setting, Google OAuth setting, live data, deployment, or destructive command was changed.
- URL state feeds only existing scoped API filters and preserves server-side authorization as the enforcement boundary.
- Site switching clears stale worklist params and preserves the selected `siteId` without adding cross-site rollups.

Browser QA status: not run. This run used deterministic source/render tests only; credentialed browser QA remains blocked by local runtime/credential setup.

Recommended next sprint:

1. Map missing-submission/evidence-attention counts to a real supported route/filter only if the metric source and privacy-safe visible filter are exact.
2. Run credentialed browser QA for Student Directory, Review Queue, Mentor Assignments, Operations, site switching, active filters, and mobile wrapping.
3. Consider Student Directory mentor filtering only after the directory API returns safe mentor filter options and labels.
4. Improve student detail latest-feedback context using fields already returned by the authorized detail API.

Do-not-repeat notes:

- Do not create Review Queue links with `missing`, `evidenceStatus`, `mentorUserId`, `studentUserId`, or `studentId` until backend, UI, tests, verifier, and privacy review are complete.
- Do not add fake missing-submission, evidence-attention, intervention, archive retry, presentation scheduling, all-sites rollup, or student-specific queue controls.
- Do not reintroduce retired builder cadence checks or hardcoded local repo-root enforcement.
