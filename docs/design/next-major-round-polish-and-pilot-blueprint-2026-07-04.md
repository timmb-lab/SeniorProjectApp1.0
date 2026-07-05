# Next Major Round Polish And Pilot Blueprint

Date: 2026-07-04

Scope: Post-GUI-rebuild audit and implementation blueprint for moving the Senior Capstone App from demo-credible to calmer, safer, and more pilot-ready. This pass is intentionally documentation-first. It does not restart the GUI architecture and does not change RBAC behavior.

## 1. Executive Summary

The authenticated app is materially better after the six-commit GUI rebuild ending at `0282027350c40e7edb36d561b14d2820c30c2194`. The product model is now clear:

- Student: "What do I do next?"
- Staff: "Which students need attention?"
- Admin: "What setup or operations need fixing?"

The next round should preserve that model and target specific gaps. The goal is not another full rearchitecture. The goal is to move from demo-credible to pilot-safe and polished enough to show repeatedly, while keeping fake-account demo proof separate from real-student pilot approval.

## 2. Repository State Captured

Captured before edits:

| Check | Result |
| --- | --- |
| Current branch | `main` |
| Starting SHA | `0282027350c40e7edb36d561b14d2820c30c2194` |
| `origin/main` SHA | `0282027350c40e7edb36d561b14d2820c30c2194` |
| Ahead/behind | clean and aligned with `origin/main` |
| Senior Capstone working tree | clean |
| Recent commits | `0282027` responsive product polish, `31044f0` admin operations flow, `5237fcb` staff queues, `b0fb207` My Capstone, `56adda0` IA reset, `4c520c3` GUI blueprint |
| Package scripts | test, typecheck, check, workspace proof, hosted fake-pilot proof, pilot-readiness checks, RBAC/navigation/mobile checks |
| `C:\Curriculum` | not touched by this pass; it had unrelated pre-existing changes when inspected read-only |

Relevant scripts available now include `npm test`, `npm run typecheck`, `npm run check`, `npm run prove:workspace-ui-polish`, `npm run prove:demo:local`, `npm run prove:hosted-fake-pilot-browser`, `npm run check:pilot-readiness`, `npm run verify:workspace-navigation`, `npm run verify:permission-matrix`, `npm run check:workspace-mobile`, and `npm run check:workspace-accessibility`.

## 3. Guardrails

- Preserve Student = My Capstone.
- Preserve Staff = attention queues plus student detail.
- Preserve Admin = operations, setup, audit, reporting, imports, and access management.
- Do not reintroduce proof-dashboard or card-wall UI.
- Do not hardcode fake/demo-only UI.
- Do not weaken RBAC, role scoping, mutation guards, account rules, or proof gates.
- Preserve Viewer read-only behavior.
- Preserve staff-only, authorization-scoped View as Student behavior.
- Preserve the Global Admin local-account requirement where it is currently enforced.
- Keep fake-account demo proof, hosted fake-account demo proof, and real-student pilot readiness as separate claims.
- Do not allow broad visual churn without screenshot or browser proof.

## 4. Current State Audit

| Area | What is working | What feels weak | Likely source files/components | Risk | Recommended pass |
| --- | --- | --- | --- | --- | --- |
| Header/navigation density | `renderAppShell()` now separates Student, Staff Workspace, and Admin Console labels; students do not get the admin switch. | Topbar still carries menu, brand, mode switch, role badge, site context, refresh, and sign-out in a dense row, especially on mobile/admin. | `workspace.js` `renderAppShell()`, `renderWorkspaceModeSwitch()`, `renderActiveRoleBadge()`, `renderSiteSwitcher()`, `workspace.css` topbar/media rules. | Medium | Prompt 1 |
| Visual weight/borders/typography | Tokens exist and most cards use 8px radius; rows/lists are now common. | Many surfaces still have bordered panels, heavy badges, 900+ font weights, and admin panels with strong border-left treatment. | `workspace.css` tokens, `.workspace-card`, `.workspace-rail-card`, `.workspace-admin-console-*`, `.workspace-row`, badges. | Medium | Prompt 2 |
| Student polish | My Capstone nav exists: Today, My Work, Feedback, Final Checklist; the student first question is clear. | Mobile should keep the current action above chrome; empty states and proof language need continued care. | `workspace.js` student section helpers, `workspace.css` student screen classes, `tests/workspace-app.test.mjs`. | Medium | Prompt 2 and Prompt 5 |
| Staff Workspace polish | Staff nav exists: Today, Students, Reviews, Reports; queues and student detail are route-backed. | Some role context and scope explanation can still compete with the actual queue. Viewer read-only needs to stay visible but quiet. | Staff renderers in `workspace.js`, student directory/detail helpers, `workspace.css` queue/row/detail classes. | High | Prompt 1 and Prompt 2 |
| Student Detail polish | Detail tabs now map to Overview, Work, Feedback, Evidence, Timeline. | Dense detail rows can still feel like a proof artifact when many chips render. | `renderSiteStudentDetailSurface()` and detail-tab helpers in `workspace.js`. | High | Prompt 2 and Prompt 3 |
| Admin Console polish | Admin nav exists: Overview, People, Students, Assignments, Programs, Imports, Reports, Audit; imports/templates are real. | Admin is visually the heaviest area and can stack setup, safety, report, and operational panels before the operator's next fix. | Admin console renderers in `workspace.js`, admin CSS blocks, admin/import/access tests. | High | Prompt 1, Prompt 2, Prompt 4 |
| Reports/charts | Staff/Admin reports include accessible bars and screenshot proof markers. | Report labels and visual hierarchy need to remain operational, not decorative. | `workspace.js` report helpers, `workspace.css` report bars, `tests/workspace-ui-polish-proof.test.mjs`. | Medium | Prompt 2 and Prompt 4 |
| Mobile/responsive behavior | 900px and 620px guards, drawer behavior, and proof screenshots exist. | Header plus page header can still consume the first mobile viewport before useful content. | `workspace.css` media queries, proof script screenshots 30-38. | High | Prompt 1 and Prompt 6 |
| Empty states/copy | Intentional empty state patterns exist and "Showing 0 of 0" is already guarded in proof. | Some zero/search states need continued product copy audits so they remain human and action-oriented. | Empty-state helpers and tests in `workspace.js`/`tests/workspace-app.test.mjs`. | Medium | Prompt 2 and Prompt 3 |
| Forms/imports/assignment flows | People/import/account creation enforce notes, confirmations, CSV validation, local Global Admin rule, and scope checks. | Operators need high-confidence current-state summaries before edit controls, especially on mobile. | Admin People/Students/Assignments/Imports renderers and `functions/api/admin/users/import.ts`. | High | Prompt 3 and Prompt 4 |
| Pilot-readiness documentation | Existing docs and tests keep hosted fake-account proof separate from real-student readiness. `check:pilot-readiness` reports NO-GO. | Real-student pilot runbook, onboarding, go/no-go, and data-handling docs should be consolidated for operators. | `docs/sales/*`, `docs/demo/*`, `scripts/check-real-student-pilot-readiness.mjs`, `tests/real-student-pilot-readiness.test.mjs`. | High | Prompt 5 |
| Hosted/fake-account proof | Hosted fake-pilot and local UI polish manifests exist with fake-data and no-go caveats. | Final proof must refresh only when artifacts intentionally reflect the next round; hosted proof may mutate screenshots/manifests. | `scripts/prove-hosted-fake-pilot-browser.mjs`, `scripts/prove-workspace-ui-polish.mjs`, `docs/progress/runs/*`, `docs/sales/screenshots/*`. | Medium | Prompt 6 |
| Real-student readiness gap | The repo currently blocks real-student pilot claims without manual/policy evidence. | Missing evidence owners and operator checklists need clearer paths. | Pilot docs, readiness tests, README readiness references. | High | Prompt 5 |

## 5. Next Round Workstreams

### Prompt 1: Header And Navigation Density Pass

Goal: Make authenticated shell navigation calmer without changing screen contracts.

Why it matters: The header should orient users, not dominate the first viewport.

Target files: `workspace.js`, `workspace.css`, `tests/workspace-app.test.mjs`, `scripts/check-workspace-mobile-contract.mjs`, screenshot proof where selectors change.

Screens affected: Student shell, Staff Workspace, Admin Console, mobile drawer, mode switch, role badge, site context, account controls.

Non-goals: No new routes, no RBAC changes, no Admin Console exposure to students, no full UI rebuild.

Acceptance criteria:

- Student sees My Capstone with no staff/admin switch.
- Staff sees Today, Students, Reviews, Reports.
- Authorized admins see compact Workspace/Admin Console switching.
- Viewer read-only is compact and visible.
- Mobile first viewport reaches useful content quickly.
- Existing role/scoping tests still pass.

Proof needed: focused workspace tests, mobile contract, navigation integrity, screenshot proof if layout changes materially.

### Prompt 2: Visual Elegance And Design System Refinement

Goal: Reduce visual heaviness across product surfaces while preserving route-backed structure.

Why it matters: The app should feel calm, operational, and repeatably demo-ready without becoming decorative.

Target files: `workspace.css`, small `workspace.js` class/copy adjustments, visual proof tests.

Screens affected: Student Today/My Work/Feedback/Final Checklist, Staff queues, Student Detail, Admin Overview/People/Imports/Reports/Audit.

Non-goals: No design-system rewrite, no new framework, no permissions changes, no marketing landing page.

Acceptance criteria:

- Fewer heavy borders and giant badges on normal product screens.
- Rows/lists/tables remain the default for repeated records.
- Status colors map to status and include text.
- Admin looks operational, not urgent by default.
- Typography inside compact controls fits on mobile.

Proof needed: `npm run prove:workspace-ui-polish` if screenshots are changed, workspace visual tests, mobile/accessibility checks.

### Prompt 3: Workflow Completion And Real-Data Hardening

Goal: Make workflows that already look complete more trustworthy with real route state, validation, and honest fallbacks.

Why it matters: A pilot-safe product must avoid "looks done" screens that hide missing setup, missing data, or invalid operations.

Target files: `workspace.js`, route-backed helpers under `functions/api/site/*` or `functions/_lib/*` only if needed, focused workflow tests.

Screens affected: Student actions, Staff queues, Student Detail, View as Student, Viewer read-only, People/Students/Assignments/Programs.

Non-goals: No fake/demo-only hardcoding, no broad API expansion, no role broadening.

Acceptance criteria:

- Empty and missing-data states say what to do next.
- Mutation controls are hidden or disabled by role/scope and still server-guarded.
- View as Student stays staff-only and authorization-scoped.
- Viewer cannot mutate.
- Global Admin local-account rule remains enforced.

Proof needed: RBAC tests, View as Student tests, Viewer read-only tests, workflow/render tests, `git diff --check`.

### Prompt 4: Reports, Exports, Imports, And Operational Admin Confidence

Goal: Strengthen Admin Console operator confidence around imports, reports, assignments, templates, audit, and export/readiness boundaries.

Why it matters: Admins need to know current state before making account, roster, assignment, or import changes.

Target files: Admin renderers in `workspace.js`, `workspace.css`, admin/import/report tests, readiness docs where claims need labels.

Screens affected: Admin Overview, People, Students, Assignments, Programs, Imports, Reports, Audit.

Non-goals: No unsupported import columns, no fake success, no raw secret/debug output, no archive/download readiness overclaim.

Acceptance criteria:

- Import templates are easy to find and accurately scoped.
- Invalid CSV preview rows do not mutate.
- Assignment and program screens show current state before forms.
- Reports use accessible labels and simple bars/tables.
- Audit remains redacted and role-scoped.

Proof needed: CSV/import tests, admin tests, report accessibility tests, screenshot proof for admin surfaces.

### Prompt 5: Real-Student Pilot Readiness Closure

Goal: Close the documentation and gate gap between fake-account demo readiness and real-student pilot readiness.

Why it matters: The app must not accidentally claim approval for real students based only on automated fake-account proof.

Target files: `docs/demo/*`, `docs/sales/*`, README readiness references, `tests/real-student-pilot-readiness.test.mjs`, `scripts/check-real-student-pilot-readiness.mjs` if needed.

Screens affected: Docs/gates primarily. UI only if a natural internal admin readiness link exists.

Non-goals: No legal compliance overclaim, no real-student approval without manual evidence, no student-facing policy clutter.

Acceptance criteria:

- Fake-account local demo readiness, hosted fake-account demo readiness, and real-student pilot readiness are defined separately.
- Real-student pilot remains NO-GO until manual/policy evidence is complete.
- Required evidence categories have owners/status/evidence paths.
- Staff/student onboarding and data-handling summaries exist.
- Tests enforce the safety caveat language.

Proof needed: readiness doc tests, `npm run check:pilot-readiness`, full test stack where practical.

### Prompt 6: Final Hosted Demo Proof And Release Gate

Goal: Refresh final proof and produce a trustworthy release status.

Why it matters: The final state must say exactly what is green, what was not run, and what remains blocked.

Target files: proof manifests, screenshot indexes, final run report, tiny regression fixes only.

Screens affected: Full fake-account demo screenshot set for Student, Staff, Admin, mobile, imports, reports, detail, and read-only flows.

Non-goals: No large features, no visual-system rebuild, no RBAC rewrite, no real-student readiness overclaim.

Acceptance criteria:

- Main is clean and pushed.
- Local tests/proofs are green or failures are documented honestly.
- Hosted proof runs only if environment is available.
- Final report separates local fake-account, hosted fake-account, and real-student pilot status.
- Real-student pilot remains NO-GO unless manual/policy evidence exists.

Proof needed: `npm test`, `npm run typecheck`, `npm run check`, `git diff --check`, local proof scripts, hosted proof scripts if available, final report.

## 6. Screen Preservation Contract

| Screen | Primary user question | Primary action | Forbidden regressions |
| --- | --- | --- | --- |
| Student Today | What do I do next today? | Continue the current capstone action. | Staff/admin chrome, role essays, hidden next step, fake proof language. |
| Student My Work | What work is due or ready to send? | Open a work item, attach proof, or send when route allows. | Unsupported upload/submit claims, admin words, giant card wall. |
| Student Feedback | What did staff say and what changed? | Read feedback and revise if needed. | Staff-only decision controls, hidden revision status. |
| Student Final Checklist | What must be true before I am done? | Check final requirements and missing proof. | Storage/debug language, "Showing 0 of 0", confusing archive claims. |
| Staff Today | Which students need attention? | Open the highest-priority queue or student detail. | Landing dominated by role explanation, hidden scope, unauthorized rows. |
| Staff Students | Which students can I inspect or support? | Search/filter and open authorized student detail. | Off-scope students, giant cards, mutation controls for Viewer. |
| Staff Reviews | What work needs review? | Open submitted work and decide only when allowed. | Review controls for unauthorized roles, unsupported status changes. |
| Staff Reports | What is happening across my scope? | Inspect accessible aggregate reports. | Raw JSON/IDs, color-only charts, cross-scope leakage. |
| Student Detail Overview | What is this student's current state? | Open the right detail tab or staff action. | Off-scope access, hidden read-only state, old backend-ish tab labels. |
| Student Detail Work | What work needs staff attention? | Inspect work rows and open evidence/history. | Mutation leakage, card wall, unclear status. |
| Student Detail Feedback | What feedback and decisions exist? | Review feedback timeline. | Unauthorized decisions, missing source/status text. |
| Student Detail Evidence | What proof/files are available? | Inspect allowed evidence. | Raw storage identifiers, unsafe download claims. |
| Student Detail Timeline | What changed recently? | Scan recent activity. | Raw audit data or secret-like output. |
| Admin Overview | What setup or operations need fixing? | Open the top setup issue or quick action. | Role-proof dashboard, urgent-looking admin everywhere, no current state. |
| Admin People | Which accounts need setup or correction? | Add/import/edit accounts within policy. | Global Admin SSO creation, missing admin note, unsupported role expansion. |
| Admin Students | Which student records need setup? | Add student, inspect current roster, assign helpers. | Fake roster claims, unsupported student mutation, hidden scope. |
| Admin Assignments | What mentor/viewer/program assignments are missing? | Fix scoped assignments. | Broad auto-assignment, off-site mutation, forms before current state. |
| Admin Programs | Which programs are active? | Add/update scoped programs. | Unauthorized program management, confusing site selection. |
| Admin Imports | How do I import safely? | Download template or preview CSV. | Invalid-row mutation, unsupported columns, hidden fake-account caveat. |
| Admin Reports | What is operational health? | Inspect accessible report summaries. | Decorative charts, raw IDs, cross-scope aggregates. |
| Admin Audit | Are role/access changes safe? | Filter redacted audit rows. | Secrets, raw tokens, unscoped audit rows. |

## 7. Visual Acceptance Criteria

- No role landing page may be dominated by role explanation text.
- Repeated records render as rows, lists, queues, or tables, not giant cards.
- No normal product screen should display "Showing 0 of 0."
- Mobile first screen must show useful content or a primary action without scrolling through role explanations.
- Header should not stack excessive badges before main content.
- Admin should look operational but not visually heavy.
- Status colors must mean status, not decoration.
- Viewer read-only must be visible but not obnoxious.
- Student UI must stay calm and student-friendly.
- Product screenshots must not look like proof dashboards.
- Buttons and compact controls must fit their text on phone widths.
- Header, nav, and role context must support the task without becoming the task.

## 8. Pilot Readiness Acceptance Criteria

Fake-account local demo readiness means:

- Fake/demo accounts work locally.
- UI flows are screenshot-proofed or test-proofed.
- RBAC passes fake-account checks.
- No real student data is involved.

Fake-account local demo readiness does not mean:

- Real students are approved.
- School policy has reviewed the app.
- FERPA-adjacent/privacy process is complete.
- Staff or students are trained.

Hosted fake-account demo readiness means:

- Hosted deployment and health checks work for fake/demo accounts.
- Fake/demo accounts behave as expected in browser proof.
- Screenshots are safe to show as non-real data product behavior.

Hosted fake-account demo readiness does not mean:

- Real-student pilot is approved.
- Real roster, account lifecycle, support, retention, or privacy evidence is complete.

Real-student pilot readiness requires manual/policy evidence in addition to automated UI proof:

- Student data handling.
- Privacy/FERPA-adjacent review by the school/district policy owner.
- Account provisioning.
- Account deprovisioning.
- Staff training/onboarding.
- Student onboarding.
- Parent/school communication if applicable.
- Support/incident process.
- Data retention/export/deletion expectations.
- Rollback/no-go process.
- Initial pilot scope and limits.

Until those categories have documented evidence and owners, the real-student pilot status remains NO-GO.

## 9. Test And Proof Plan

After the round, the validation stack should cover:

- Header/nav regression.
- Mobile nav regression.
- Banned copy regression.
- Student shell regression.
- Staff Workspace regression.
- Admin Console regression.
- Viewer read-only regression.
- View as Student regression.
- CSV template/import regression.
- Report accessibility regression.
- Hosted fake-account proof.
- Real-student readiness gate.
- Permission matrix and role-scope checks.
- Local fake-account UI screenshot proof.
- Final hosted proof only when the environment is available.

Recommended command order for final proof:

```powershell
npm test
npm run typecheck
npm run check
npm run check:pilot-readiness
npm run verify:workspace-navigation
npm run verify:permission-matrix
npm run check:workspace-mobile
npm run check:workspace-accessibility
npm run prove:workspace-ui-polish
npm run prove:hosted-fake-pilot-browser
git diff --check
git status --short --branch
```

Hosted proof must be documented as fake-account demo proof unless the manual real-student pilot evidence exists.

## 10. Implementation Sequence

Run the next prompts in order:

1. Header/navigation density.
2. Visual design system polish.
3. Workflow completion and real-data hardening.
4. Reports/imports/admin confidence.
5. Real-student pilot readiness closure.
6. Final proof/release gate.

Each prompt should start from a clean `main`, stop on unrelated dirty work, preserve the current product model, run checks before commit, push only after the working tree is clean, and keep `C:\Curriculum` untouched.

## 11. Risks And Stop Conditions

Stop if any of these happen:

- RBAC regression.
- Student sees Admin Console.
- Viewer can mutate.
- Unauthorized staff sees a student.
- View as Student bypasses authorization.
- Global Admin local-account rule weakens.
- Demo/fake proof claims real-pilot readiness.
- Screenshots reveal a return to card-wall UI.
- Mobile first screen becomes header-heavy again.
- Any prompt creates a dirty `C:\Curriculum` change.
- A test/proof failure is skipped or hidden.

## 12. Files Inspected For This Audit

- `workspace.js`
- `workspace.css`
- `workspace.html`
- `package.json`
- `README.md`
- `docs/design/gui-rearchitecture-blueprint-2026-07-04.md`
- `docs/sales/hosted-proof-plan.md`
- `docs/sales/hosted-browser-proof-screenshot-index.md`
- `docs/sales/real-student-pilot-readiness-gap-analysis.md`
- `docs/sales/real-student-pilot-proof-plan.md`
- `docs/demo/2026-06-30-demo-readiness-closure-runbook.md`
- `tests/workspace-app.test.mjs`
- `tests/workspace-ui-polish-proof.test.mjs`
- `tests/real-student-pilot-readiness.test.mjs`
- `tests/hosted-browser-proof-gate.test.mjs`
- `scripts/prove-workspace-ui-polish.mjs`
- `scripts/prove-hosted-fake-pilot-browser.mjs`
- `scripts/check-real-student-pilot-readiness.mjs`

## 13. Prompt 0 Acceptance Check

This blueprint intentionally makes no runtime change. It creates the contract for the remaining prompts:

- Preserve the successful GUI architecture.
- Keep future work targeted.
- Preserve RBAC/security and read-only behavior.
- Keep fake-account demo readiness separate from real-student pilot readiness.
- Require proof before claims.
- Keep `C:\Curriculum` out of scope.
