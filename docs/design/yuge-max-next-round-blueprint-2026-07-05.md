# YUGE MAX Next Round Blueprint

Date: 2026-07-05

Scope: Prompt 00 planning pass for the 2026-07-05 YUGE MAX round. This blueprint protects the successful authenticated GUI rebuild while planning Prompts 01 through 12: shell density, visual polish, Student product completion, Staff Workspace depth, Admin Console operations, real-data states, reports/templates/exports, mobile/accessibility, RBAC proof, real-student pilot gates, final proof, and repo hygiene.

This document changes no runtime behavior. It is the execution contract for the remaining stages.

## 1. Starting Repository State

Captured before Prompt 00 edits:

| Check | Result |
| --- | --- |
| Current directory | `C:\SeniorProjectApp1.0` |
| Branch | `main` |
| Starting SHA | `649f5658c5e1a751bb0c7a55b08dec19f518fbff` |
| `origin/main` SHA after fetch | `649f5658c5e1a751bb0c7a55b08dec19f518fbff` |
| Ahead/behind | `0/0` |
| Working tree | Clean |
| Recent latest commit | `649f565 test: refresh final demo proof and readiness gate` |
| Package scripts inspected | `test`, `typecheck`, `check`, production gates, workspace verifiers, local/hosted proof scripts, pilot-readiness checks |
| Prompt source | `C:\Users\bryan\.codex\attachments\8149105c-ef43-4238-9b8d-f756e847062f\pasted-text.txt` |
| `C:\Curriculum` | Out of scope and untouched |

Relevant scripts available now include:

- `npm test`
- `npm run typecheck`
- `npm run check`
- `npm run verify:workspace-navigation`
- `npm run verify:workspace-url-state`
- `npm run verify:dashboard-actions`
- `npm run verify:review-queue-deeplinks`
- `npm run verify:permission-matrix`
- `npm run verify:mutation-origin`
- `npm run verify:workspace-density`
- `npm run verify:functionality-language`
- `npm run check:workspace-mobile`
- `npm run check:workspace-accessibility`
- `npm run check:workspace-errors`
- `npm run check:pilot-readiness`
- `npm run prove:workspace-ui-polish`
- `npm run prove:demo:local`
- `npm run prove:pilot:local`
- `npm run prove:hosted-fake-pilot-browser`
- `npm run check:workspace:hosted-permissions`
- `npm run check:workspace:hosted-dashboard`
- `npm run check:workspace:hosted-evidence`
- `npm run check:cloudflare:live`

`npm run build` is not defined in `package.json`; do not claim it ran unless a build script is added later.

## 2. Recent GUI Rebuild Summary

The known-good product model was established by the prior GUI rebuild and proof round:

| Commit | Summary | Protected outcome |
| --- | --- | --- |
| `4c520c3` | GUI rearchitecture blueprint | Defined Student, Staff Workspace, and Admin Console contracts. |
| `56adda0` | Workspace information architecture reset | Separated daily Workspace from Admin Console. |
| `b0fb207` | Student My Capstone rebuild | Student navigation became Today, My Work, Feedback, Final Checklist. |
| `5237fcb` | Staff Workspace queues | Staff landing moved toward attention queues and Student Detail. |
| `31044f0` | Admin Console operations | Admin nav became Overview, People, Students, Assignments, Programs, Imports, Reports, Audit. |
| `0282027` | Responsive polish and regressions | Added local proof and mobile/visual coverage. |
| `7ac3395` through `649f565` | Next-round polish and final proof | Completed additional polish, real-data hardening, reports/imports confidence, pilot gate docs, and final fake-account proof. |

The current state is green for local fake-account demo proof and hosted fake-account browser/demo proof according to `docs/progress/runs/2026-07-04-next-major-round-final-proof.md`. Real-student pilot readiness remains NO-GO because required manual/policy evidence is not complete.

## 3. Product Model To Protect

- Student = "What do I do next?"
- Staff = "Which students need attention?"
- Admin = "What setup or operations need fixing?"

Screen contracts that must remain intact:

| Area | Required nav |
| --- | --- |
| Student shell | Today, My Work, Feedback, Final Checklist |
| Staff Workspace | Today, Students, Reviews, Reports |
| Student Detail | Overview, Work, Feedback, Evidence, Timeline |
| Admin Console | Overview, People, Students, Assignments, Programs, Imports, Reports, Audit |

Do not restart the GUI. Improve the current route-backed model.

## 4. Risks And Non-Negotiables

- Work on `main` only.
- Do not touch `C:\Curriculum`.
- Do not weaken RBAC/security behavior.
- Do not hardcode fake/demo-only UI.
- Do not use real student data.
- Preserve Student = My Capstone.
- Preserve Staff = student attention queues plus Student Detail.
- Preserve Admin = operations, setup, imports, assignments, audit, and reports.
- Preserve Viewer read-only.
- Preserve staff-only, authorization-scoped View as Student.
- Preserve the Global Admin local-account requirement where enforced.
- Keep fake-account local demo readiness, hosted fake-account demo readiness, and real-student pilot readiness separate.
- Keep real-student pilot NO-GO unless required manual/policy evidence is complete.
- Do not reintroduce proof-dashboard UI, card-wall UI, giant role explanation panels, or role capability text as the dominant content of normal product screens.
- Do not allow Students to see Admin Console.
- Do not allow Viewer mutation controls.
- Do not allow unauthorized staff to see students outside scope.
- Commit and push only after the relevant stage checks pass.

## 5. Current Implementation Audit By Area

| Area | Working now | Still weak or risky | Likely files | Likely tests/proofs | Stop condition |
| --- | --- | --- | --- | --- | --- |
| Package scripts and gates | Broad local, hosted, role, mobile, accessibility, proof, and pilot checks exist. | Long command stack can mutate screenshot/progress artifacts and can be slow. | `package.json`, `scripts/*`, `tests/*` | `npm test`, `npm run typecheck`, `npm run check`, focused proof aliases | Required gate fails and cannot be fixed safely. |
| README and docs index | README already links the current polish blueprint and readiness/proof docs. | New YUGE plan needs a clear pointer without overclaiming readiness. | `README.md`, `docs/design/*`, `docs/progress/runs/*` | `tests/next-major-round-blueprint.test.mjs`, `git diff --check` | Docs claim real-student readiness from fake-account proof. |
| Design blueprints | `gui-rearchitecture` and `next-major-round-polish-and-pilot` preserve screen contracts. | YUGE 01-12 run is broader and needs explicit per-stage sequencing. | `docs/design/*` | Blueprint doc test | New plan contradicts current screen contracts. |
| Demo readiness/runbooks | Demo-day and real-pilot docs exist and separate fake-account proof from real-student gates. | Evidence ownership and final proof status must remain current after later stages. | `docs/demo/*`, `docs/sales/*`, `docs/progress/runs/*` | `npm run check:pilot-readiness`, pilot readiness tests | Any doc removes NO-GO without manual/policy evidence. |
| Screenshot/proof docs | Local and hosted screenshot manifests exist, including dated screenshot folders. | Hosted proof can refresh artifacts that should be intentional, not accidental churn. | `docs/sales/screenshots/*`, `docs/sales/*screenshot-index.md`, `docs/progress/runs/*.json` | `npm run prove:workspace-ui-polish`, `npm run prove:hosted-fake-pilot-browser` | Screenshots expose real data, secrets, raw IDs, or fake-pilot claims as real-pilot readiness. |
| Functions/API RBAC | Permission helpers and route guards are the authority for student scope, Viewer read-only, Program Teacher scope, and admin actions. | UI changes can hide/show the wrong controls if not derived from current permissions. | `functions/_lib/permissions.ts`, `functions/_lib/effective-access.ts`, `functions/_lib/site-student-detail.ts`, `functions/api/*` | `npm run verify:permission-matrix`, integration tests, hosted permission gate | Student/Admin leak, off-scope student visibility, or Viewer mutation appears. |
| Workspace shell | `renderAppShell`, mode switch, nav, account menu, and route state exist. | Header/topbar can still feel dense on mobile/admin. | `workspace.js`, `workspace.css`, `workspace.html` | `verify:workspace-navigation`, `verify:workspace-url-state`, mobile proof | Student sees Admin Console or mode switch. |
| Student shell/UI | Student Today/My Work/Feedback/Final Checklist are implemented and proofed. | More completion polish must stay student-facing and route-backed. | Student renderers in `workspace.js`, student CSS blocks | `tests/workspace-app.test.mjs`, screenshot proof | Student UI shows staff/admin controls or demo/proof language. |
| Staff Workspace | Staff Today, queues, directory, reviews, reports, and detail tabs are implemented. | Queue depth, row density, and read-only handling need continued proof as copy/layout changes. | Staff renderers in `workspace.js`, `workspace.css`, `functions/api/site/*` | Workspace tests, review queue deep links, local/hosted proof | Mentor/Program Teacher/Viewer scope drifts. |
| Admin Console | Overview, People, Students, Assignments, Programs, Imports, Reports, Audit exist. | Admin is high-risk because setup, imports, assignments, and audit can affect access. | Admin renderers in `workspace.js`, admin APIs, import/assignment helpers | Admin/import/role tests, mutation-origin verifier | Unsupported import/template columns or unauthorized mutation controls appear. |
| Reports/charts | Accessible report summaries and proof screenshots exist. | Counts/percentages must remain source-backed and not decorative. | `workspace.js`, reports APIs, `workspace.css` bars/tables | Report tests, accessibility check, screenshots | Raw JSON/SQL/IDs or color-only charts appear. |
| Mobile/accessibility | Mobile and accessibility contract scripts exist and pass in final proof. | Header density and stacked admin screens are still high-risk after broad edits. | `workspace.css`, screenshot proof scripts, accessibility verifier | `check:workspace-mobile`, `check:workspace-accessibility`, Playwright screenshots | Useful content falls below excessive chrome or text overlaps. |
| View as Student | Staff-only scoped preview and exit/restore flow exist. | Any shell/nav changes can weaken preview boundaries if not tested. | `workspace.js`, student/detail helpers, URL-state verifier | Workspace tests, `verify:permission-matrix`, screenshot proof | Unauthorized preview or mutable preview state. |
| Imports/exports/templates | CSV import, templates, preview validation, archive/export surfaces exist. | Templates must match supported fields and archive/download readiness must not overclaim. | `workspace.js`, `functions/api/admin/users/import.ts`, export routes/docs | Admin import tests, production gates | Invalid rows mutate or templates advertise unsupported columns. |

## 6. Prompt-By-Prompt Execution Plan

| Prompt | Goal | Primary files | Validation focus | Commit message |
| --- | --- | --- | --- | --- |
| 01 Header/navigation and role shell density | Reduce authenticated shell density across Student, Staff Workspace, and Admin Console without redesigning the app. | `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, nav/mobile verifiers | Header/nav visibility, URL state, mobile first viewport, role shell density | `ui: reduce authenticated shell density` |
| 02 Visual system, typography, spacing, and elegance | Reduce heavy borders, loud typography, visual clutter, and one-note styling. | `workspace.css`, small `workspace.js` class/copy changes, visual proof tests | Banned card-wall/proof-dashboard regressions, screenshot polish, accessibility | `ui: refine visual system and product polish` |
| 03 Student product and My Capstone completion | Make Student screens feel finished, clear, polished, and usable. | Student renderers in `workspace.js`, student CSS, focused student tests | Student-only nav, next action, feedback, final checklist, mobile student proof | `ui: complete student my capstone experience` |
| 04 Staff Workspace queues, reviews, and Student Detail depth | Deepen staff case-management workflows and detail tabs. | Staff renderers, `functions/api/site/*` only if needed, CSS queues/details | Mentor/Program Teacher/Viewer scope, review workflow, detail tab proof | `ui: deepen staff workspace and student detail` |
| 05 Admin Console operations depth | Make Admin Console a trustworthy operations panel. | Admin renderers, import/assignment/program helpers, admin CSS | People, Students, Assignments, Programs, Imports, Reports, Audit, RBAC | `feat: deepen admin console operations` |
| 06 Real-data loading, empty, error, and forbidden states | Harden major screens for missing fields, empty lists, partial data, failed APIs, and forbidden scopes. | `workspace.js`, `workspace.css`, error/loading helpers, selected API helpers | Empty/error/forbidden states, no raw JSON, human next steps | `fix: harden real data states across workflows` |
| 07 Reports, exports, CSV templates, and analytics confidence | Strengthen trust in counts, percentages, templates, imports, and exports. | Reports/import/export renderers, `functions/api/reports/*`, import/export tests | Accurate labels, template support, export caveats, accessible charts | `feat: strengthen reports templates and exports` |
| 08 Mobile, accessibility, keyboard, and visual regression sweep | Dedicated mobile/accessibility proof after product changes. | `workspace.css`, ARIA/focus helpers, proof scripts, screenshot indexes | Keyboard/focus, mobile screenshots, text fit, no overlap | `ui: improve mobile accessibility and proof screenshots` |
| 09 RBAC, security, View as Student, and role matrix proof | Security-focused regression and hardening pass. | Permission helpers, route tests, workspace role gates, proof scripts | Role matrix, deep-link denials, Viewer read-only, View as Student | `test: harden role access and view as student proof` |
| 10 Real-student pilot readiness gate, runbooks, and data handling | Strengthen pilot docs and gates while preserving NO-GO. | `docs/demo/*`, `docs/sales/*`, readiness tests/scripts, README | Manual evidence matrix, onboarding, data handling, NO-GO caveats | `docs: strengthen real student pilot readiness gate` |
| 11 Hosted/local proof, screenshots, and release report | Run local/hosted proof and refresh screenshots/manifests/report. | Proof scripts, screenshot folders, `docs/progress/runs/2026-07-05-yuge-max-final-proof.md` | Full proof stack, role screenshots, hosted availability, release report | `test: refresh yuge max proof and release report` |
| 12 Final cleanup, docs index, repo hygiene, and push verification | Clean docs/indexes/artifacts, verify final state, push alignment. | README, docs indexes, proof report, package/tests only if needed | Stale links, caveat consistency, clean tree, ahead/behind 0/0 | `chore: close yuge max repo hygiene` |

## 7. File Map By Workstream

| Workstream | Files to inspect first | Files to avoid or touch only with direct cause |
| --- | --- | --- |
| Shell/navigation | `workspace.js`, `workspace.css`, `workspace.html`, `scripts/verify-workspace-navigation-integrity.mjs`, `scripts/verify-workspace-url-state.mjs` | API permissions unless a UI proof reveals a server mismatch. |
| Student product | Student renderers in `workspace.js`, student CSS blocks, `tests/workspace-app.test.mjs`, screenshot proof script | New routes unless existing dashboard payload is insufficient and tests justify it. |
| Staff Workspace | Staff renderers, student directory/detail helpers, `functions/_lib/site-student-detail.ts`, `functions/api/site/*`, staff tests | Broad permission rewrites. |
| Admin Console | Admin renderers, `functions/api/admin/users/import.ts`, `functions/api/admin/role-assignments.ts`, audit/export routes, admin tests | Unsupported import/export behaviors or real credential handling. |
| Real-data states | Empty/error/loading helpers, API response handling, route tests | Fake-only data branches. |
| Reports/templates/exports | Report helpers, import template shelf, export/admin archive docs/routes | Real-student archive readiness claims without proof. |
| Mobile/accessibility | `workspace.css`, accessibility contract script, mobile contract script, screenshot proof | Decorative-only CSS churn. |
| RBAC/security | `functions/_lib/permissions.ts`, `functions/_lib/effective-access.ts`, role tests, hosted permission script | Any permission widening without explicit test-backed need. |
| Pilot readiness | `docs/demo/*`, `docs/sales/*`, `scripts/check-real-student-pilot-readiness.mjs`, pilot tests | Removing NO-GO caveats. |
| Final proof/hygiene | `docs/progress/runs/*`, screenshot indexes, README, `git status`, `git log` | Temp files, unrelated generated churn. |

## 8. Workstream Matrix

| Workstream | Goal | Primary files | Tests | Proof screenshots | RBAC risk | Data risk | Mobile risk | Commit message |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shell density | Calm header and role shell. | `workspace.js`, `workspace.css` | Nav, URL, workspace app tests | Student, Staff, Admin desktop/mobile | High | Low | High | `ui: reduce authenticated shell density` |
| Visual polish | Quiet typography, spacing, borders, badges. | `workspace.css`, visual classes | UI polish tests, accessibility | Full local UI polish set | Medium | Low | High | `ui: refine visual system and product polish` |
| Student My Capstone | Student knows next action, work, feedback, final checklist. | Student renderers/CSS | Student workspace tests | Student Today/My Work/Feedback/Final Checklist | High | Medium | High | `ui: complete student my capstone experience` |
| Staff Workspace | Better queues, reviews, detail depth. | Staff renderers, site APIs if needed | Role/detail/review tests | Mentor, Program Teacher, Viewer, Detail | High | Medium | Medium | `ui: deepen staff workspace and student detail` |
| Admin operations | Current state before operations/editing. | Admin renderers, import/assignment helpers | Admin/import/program/audit tests | Admin Overview/People/Students/Assignments/Programs/Imports/Reports/Audit | High | High | Medium | `feat: deepen admin console operations` |
| Real-data states | Human loading/empty/error/forbidden states. | `workspace.js`, CSS, selected API helpers | Error-state contract, workspace app tests | Empty/forbidden state shots if changed | High | High | Medium | `fix: harden real data states across workflows` |
| Reports/templates/exports | Trustworthy counts, templates, exports. | Reports/import/export helpers | Report/import/export tests | Reports, Imports, export readiness if visual | Medium | High | Medium | `feat: strengthen reports templates and exports` |
| Mobile/a11y | Keyboard, focus, text fit, responsive proof. | `workspace.css`, scripts/proofs | Mobile/accessibility contracts | Required mobile set | Medium | Low | High | `ui: improve mobile accessibility and proof screenshots` |
| RBAC proof | Role matrix, View as Student, deep links. | Permission helpers, proof scripts, tests | Permission matrix, mutation origin, hosted permissions | Role proof shots as needed | High | High | Medium | `test: harden role access and view as student proof` |
| Pilot gate | Real-student readiness docs stay honest. | `docs/demo/*`, `docs/sales/*`, readiness script/tests | Pilot readiness, doc tests | None unless docs screenshots changed | Medium | High | Low | `docs: strengthen real student pilot readiness gate` |
| Final proof | Refresh local/hosted proof and report. | Proof scripts, screenshot dirs, final report | Full stack plus hosted if available | Full required set | High | High | High | `test: refresh yuge max proof and release report` |
| Repo hygiene | Clean docs/index/artifacts and push alignment. | README, docs indexes, final report | Full regression where practical | Only if visuals changed | Medium | Medium | Low | `chore: close yuge max repo hygiene` |

## 9. Testing Matrix

| Stage group | Required checks when relevant | Notes |
| --- | --- | --- |
| Every stage | `git diff --check`, focused tests, `git status --short --branch` | Run before commit; rerun after fixes. |
| Runtime UI edits | `npm test`, `npm run typecheck`, `npm run check` | Full stack is expected for broad UI/RBAC changes. |
| Shell/nav edits | `npm run verify:workspace-navigation`, `npm run verify:workspace-url-state`, `npm run verify:workspace-density` | Preserve nav contracts and route state. |
| Student/staff/admin edits | `node --test tests/workspace-app.test.mjs` plus relevant integration tests | Keep tests focused first, then full stack. |
| RBAC/security edits | `npm run verify:permission-matrix`, `npm run verify:mutation-origin`, hosted permissions if available | Server-side permissions are authoritative. |
| Mobile/a11y edits | `npm run check:workspace-mobile`, `npm run check:workspace-accessibility` | Screenshots required when visual layout changes. |
| Error states | `npm run check:workspace-errors` | Empty/error/forbidden copy must be human-readable. |
| Real-pilot docs | `npm run check:pilot-readiness`, `node --test tests/real-student-pilot-readiness.test.mjs tests/real-student-pilot-demo-docs.test.mjs` | NO-GO is a valid pass while manual evidence is missing. |
| Final proof | `npm run prove:workspace-ui-polish`, `npm run prove:demo:local`, `npm run prove:pilot:local`, hosted proof if credentials/env available | Do not pretend unavailable hosted proof ran. |

## 10. Screenshot And Proof Matrix

| Proof area | Required coverage | Artifact pattern |
| --- | --- | --- |
| Student desktop/mobile | Student Today, My Work, Feedback, Final Checklist, current action above chrome | `docs/sales/screenshots/<date-or-existing-proof-folder>/`, local proof manifest |
| Staff Workspace | Mentor Today, Program Teacher Today, Administration Workspace, Global/Site Admin Workspace, Students, Reviews, Reports | Local UI polish screenshots and manifest |
| Viewer read-only | Viewer Students and Viewer Detail with no mutation controls | Local screenshots plus permission tests |
| View as Student | Entered and exited states, read-only preview boundary | Local screenshots plus URL-state/permission tests |
| Admin Console | Overview, People, Students, Assignments, Programs, Imports templates, Reports, Audit | Local screenshot set |
| Mobile Admin | Overview, Imports, Reports | Local screenshot set and mobile contract |
| Hosted fake-account | Signed-out, Student desktop/mobile, Program Teacher, Mentor, Viewer, Site/Admin, misc/admin readiness | Hosted manifest and screenshot index when environment supports |
| Final report | Stage summary, commits, checks, local proof, hosted proof, role behavior, caveats | `docs/progress/runs/2026-07-05-yuge-max-final-proof.md` |

## 11. RBAC And Security Matrix

| Boundary | Source of truth | Proof expectation |
| --- | --- | --- |
| Student self-scope | `/api/student/dashboard`, submission/evidence routes, `canAccessStudent` | Student sees own My Capstone only and no Admin Console. |
| Mentor scope | Mentor assignments and `canAccessStudent` | Mentor sees assigned students only. |
| Program Teacher scope | `getProgramTeacherScopedStudentIds`, review route guards | Program Teacher sees program/cohort-scoped students and scoped reviews only. |
| Viewer read-only | Viewer assignment helpers, read-only flags in site/detail routes | Viewer sees assigned records only, no mutation controls, no review/admin actions. |
| Administration/site scope | Site role helpers and site selection gates | Administration/Site Admin see only allowed school/site records and operations. |
| Global Admin | Effective access helpers and local-account rules | Global Admin can access platform paths without weakening local-account requirement. |
| Admin Console visibility | `adminConsoleCapabilitiesFor`, route permissions | Students and unauthorized roles cannot open Admin Console. |
| View as Student | UI state plus server authorization checks | Staff-only, authorization-scoped, read-only preview; unauthorized deep links fail safely. |
| Imports/assignments | Admin import/role-assignment APIs | Unsupported roles/columns fail, invalid CSV rows do not mutate, Global Admin local rule enforced. |
| Audit/export | Admin audit/export routes | Redacted, scoped, no raw secrets, no unproven archive/download claims. |

## 12. Role Matrix

| Role | Allowed shell | Allowed nav | Allowed student visibility | Mutation permissions | Admin access | View as Student access | Read-only treatment | Proof expectations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Student | My Capstone | Today, My Work, Feedback, Final Checklist | Self only | Own proof/link/upload/submit where routes allow | None | None | Not read-only; self-scoped | Student cannot see Admin Console, staff queues, other students, or staff-only controls. |
| Mentor | Staff Workspace | Today, Students, Reports, Account where present | Active assigned students | Mentor-meeting/support actions only where routes allow | None by default | Only for authorized assigned/scoped students if enabled by current policy | Normal staff, scoped | Assigned-only student list/detail, no off-scope rows, no review/admin mutation. |
| Program Teacher | Staff Workspace plus scoped Admin Console if current capabilities allow | Today, Students, Reviews, Reports; scoped admin setup/import paths where allowed | Program/cohort-scoped students | Review decisions and scoped setup actions only where server allows | Scoped only; no global tools | Authorized scoped students only | Not read-only by default | Program scope derived from helper, off-program denial, review queue scoped. |
| Viewer | Staff Workspace | Today, Students, Reports, Account where present | Assigned students only | None | None | None unless policy explicitly changes later | Persistent read-only banner/chips; controls hidden | Read-only directory/detail, mutation denials, no Admin Console. |
| Administration | Staff Workspace, scoped monitoring | Today, Students, Reports, Account where present | Assigned school students | Monitoring/read-only unless current route explicitly permits | Scoped only if capabilities allow | Only if server allows | Read-only where permissions require | School scope visible, no global/security tools, no unsupported mutations. |
| Site Admin | Staff Workspace and Admin Console | Staff Today, Students, Reviews, Reports; Admin Overview, People, Students, Assignments, Programs, Imports, Reports, Audit where scoped | Assigned site students | Site-scoped people, assignments, programs, imports, presentations/final-file operations where routes allow | Site-scoped Admin Console | Authorized site students only | Normal scoped admin | Site selection safe, no cross-site leakage, setup forms after current state. |
| Global Admin | Staff Workspace and Admin Console | Full platform/site nav where routes allow | All route-authorized students; site selection where needed | Global/site admin actions within policy | Full Admin Console where enforced | Authorized students only | Normal admin; local-account caveat visible where relevant | Local Global Admin rule preserved, no secret leakage, scoped routes still respect site selection. |
| Unauthorized/misc | Signed-out route, denied/limited misc readiness surfaces | No protected student/admin nav unless role allows | None or aggregate-only by explicit role | None | None | None | Denial copy only | Deep links fail safely and do not reveal private records. |

## 13. Pilot Readiness Evidence Matrix

| Readiness lane | Current target status | Evidence required | Automated proof role | Claim boundary |
| --- | --- | --- | --- | --- |
| Fake-account local demo readiness | Green when local fake-account tests/proofs pass | Local fake `.test` accounts, local D1/demo seed, local browser screenshots, role/RBAC checks | Can prove route/UI behavior for fake data | Does not approve real students. |
| Hosted fake-account demo readiness | Green when hosted health, fake-account browser, dashboard, permissions, and evidence gates pass | Hosted fake `.test` credentials, hosted health, screenshots/manifests, hosted permission/evidence checks | Can prove hosted click-around and fake-data workflows | Does not approve real-student pilot. |
| Real-student pilot readiness | NO-GO until manual/policy evidence is complete | Role-scoped pilot account proof, backup/restore rehearsal, real roster validation, privacy/support/retention approval, SSO or managed local credential delivery, pilot scope decision, archive/download acceptance if in scope | Can supplement evidence but cannot replace it | Automated screenshot/browser proof cannot replace manual/policy evidence for real-student pilot readiness. |

Required real-student evidence categories to preserve in docs and gates:

- Role-scoped pilot account proof.
- Backup/restore rehearsal evidence.
- Real roster validation evidence.
- Privacy, support, and retention approval.
- SSO or managed local credential delivery approval.
- Staff onboarding.
- Student onboarding.
- Parent/school communication if applicable.
- Support/incident process.
- Data retention/export/deletion expectations.
- Rollback/no-go process.
- Pilot scope and excluded features.
- Archive manifest/download acceptance if included in the first pilot.

## 14. Stop Conditions

Stop, fix, or ask before proceeding if any of these occur:

- Repo is not on `main`.
- Working tree has unrelated changes that make the stage unsafe.
- `origin/main` cannot be fetched or ahead/behind cannot be understood before a commit.
- A stage would touch `C:\Curriculum`.
- RBAC is weakened or uncertain.
- Student sees Admin Console.
- Viewer can mutate.
- Mentor or Program Teacher can see off-scope students.
- View as Student bypasses authorization or becomes mutable.
- Global Admin local-account rule weakens.
- Fake-account proof is described as real-student pilot approval.
- Real-student pilot NO-GO is removed without manual/policy evidence.
- Proof scripts expose secrets, real student data, raw storage IDs, or raw JSON.
- Normal UI returns to role-proof dashboard, giant role explanation panels, or card-wall-first screens.
- Mobile first viewport becomes dominated by header/chrome.
- Validation fails and cannot be fixed safely within the stage.

## 15. Expected Output Commits

| Prompt | Expected commit |
| --- | --- |
| 00 | `docs: add yuge max next round blueprint` |
| 01 | `ui: reduce authenticated shell density` |
| 02 | `ui: refine visual system and product polish` |
| 03 | `ui: complete student my capstone experience` |
| 04 | `ui: deepen staff workspace and student detail` |
| 05 | `feat: deepen admin console operations` |
| 06 | `fix: harden real data states across workflows` |
| 07 | `feat: strengthen reports templates and exports` |
| 08 | `ui: improve mobile accessibility and proof screenshots` |
| 09 | `test: harden role access and view as student proof` |
| 10 | `docs: strengthen real student pilot readiness gate` |
| 11 | `test: refresh yuge max proof and release report` |
| 12 | `chore: close yuge max repo hygiene` |

Each commit must contain only related changes for that prompt and must be pushed to `origin/main` after successful validation.

## 16. Definition Of Done

At the end of Prompt 12:

- `main` only; no branch created.
- `origin/main` pushed and aligned.
- Working tree clean.
- `C:\Curriculum` untouched.
- Student sees only My Capstone and own data.
- Staff sees student attention queues, authorized student rows/detail, reviews, and reports.
- Admin Console remains operations/setup/imports/assignments/programs/reports/audit.
- Viewer remains read-only.
- Mentor and Program Teacher scope remains enforced.
- Unauthorized deep links fail safely.
- View as Student remains staff-only, authorization-scoped, and read-only.
- Global Admin local-account requirement remains enforced where current code enforces it.
- No card-wall, role-proof dashboard, giant role explanation, raw JSON/debug output, or "Showing 0 of 0" regression on normal product screens.
- Reports and templates are simple, accurate, accessible, and matched to supported routes.
- Local fake-account demo readiness and hosted fake-account demo readiness are reported separately.
- Real-student pilot readiness remains NO-GO unless manual/policy evidence is complete.
- Final proof report lists starting SHA, final SHA, commits, checks, screenshots/artifacts, hosted status, caveats, and remaining blockers.

## 17. Files Inspected For Prompt 00

- `package.json`
- `README.md`
- `workspace.html`
- `workspace.js`
- `workspace.css`
- `docs/design/gui-rearchitecture-blueprint-2026-07-04.md`
- `docs/design/next-major-round-polish-and-pilot-blueprint-2026-07-04.md`
- `docs/progress/runs/2026-07-04-next-major-round-final-proof.md`
- `docs/progress/runs/README.md`
- `docs/sales/`
- `docs/demo/`
- `functions/_lib/permissions.ts`
- `functions/_lib/effective-access.ts`
- `functions/_lib/site-student-detail.ts`
- `functions/api/admin/users/import.ts`
- `functions/api/admin/role-assignments.ts`
- `tests/next-major-round-blueprint.test.mjs`
- `tests/workspace-app.test.mjs`
- `scripts/prove-local-demo-workspace.mjs`
- `scripts/prove-hosted-fake-pilot-browser.mjs`
- `scripts/prove-workspace-ui-polish.mjs`
- `scripts/check-real-student-pilot-readiness.mjs`
