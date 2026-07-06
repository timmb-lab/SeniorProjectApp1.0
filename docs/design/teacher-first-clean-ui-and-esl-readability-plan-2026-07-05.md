# Teacher-First Clean UI And ESL Readability Plan

Date: 2026-07-05

Scope: Stage 00 planning pass for the teacher-first clean GUI and student-ready simplicity round. This document changes no runtime behavior. It is the practical contract for simplifying normal Student, Staff Workspace, and Admin Console screens without weakening RBAC, scope checks, or the real-student pilot NO-GO boundary.

## Space-Saving UI Addendum

Progressive disclosure is required for this round. Normal teacher, student, and admin screens should show the main action first, the main list or queue second, and move secondary controls into predictable menus, tabs, disclosures, or drawers.

Required patterns:

- Use dropdown filters for status, program, cohort, mentor, review, setup issue, and activity filters instead of always-visible card walls.
- Use a `More` menu for secondary row actions. Student roster rows should keep `Open` visible and move secondary actions such as `View as Student`, timeline, assignment, export, or copy-link actions behind `More` when supported.
- Use collapsible sections for setup details, old feedback, past submissions, timeline history, advanced filters, import instructions, audit details, report methodology, and optional help text.
- Use tabs or segmented controls to prevent giant vertical pages in Student Detail, Admin Console, Student pages, and Staff Workspace.
- Use compact summary strips or a calm caught-up message instead of many zero-count cards.
- Keep long help text behind `What does this mean?`, `How imports work`, `CSV columns`, or similar expandable labels.

A screen fails this round if filters take more space than the work list, every possible category is visible at once, row actions clutter the list, or mobile shows chrome/control panels before useful content. A screen passes when the main action is obvious, secondary tools are tucked away, zero-count noise is hidden or summarized, and the first viewport is readable for a non-technical teacher.

## 1. Current State Summary

Repository state captured before edits:

| Check | Result |
| --- | --- |
| Current directory | `C:\SeniorProjectApp1.0` |
| Branch | `main` |
| Starting SHA | `4e4b9d1796cf874621fcc68bb606913344128aa0` |
| Working tree | Clean |
| Latest commit | `4e4b9d17 test: close student ready proof and readiness gate` |
| `C:\Curriculum` | Out of scope and untouched |

The authenticated app is route-backed and proof-heavy. `workspace.js` remains the primary UI surface for Student My Capstone, Staff Workspace, Student Detail, Review Queue, Admin Console, imports, reports, View as Student, and empty/error states. `workspace.css`, `tests/workspace-app.test.mjs`, `scripts/prove-workspace-ui-polish.mjs`, role/RBAC verifiers, and the local/hosted proof scripts are the main regression surfaces.

The current product model is still correct:

- Student = What do I do next?
- Teacher/staff = Which students need attention?
- Admin = What setup or operations need fixing?

The problem is visual and language complexity, not missing proof. Normal users still see too much dashboard/control-panel language in some workflows.

## 2. What Improved In Previous Rounds

- Student navigation is now `Today`, `My Work`, `Feedback`, and `Final Checklist`.
- Staff Workspace and Admin Console are separated.
- View as Student is staff-only, authorization-scoped, and read-only.
- Viewer stays read-only in UI and proof.
- Local fake-account UI proof is green with 46 screenshots and 0 failures.
- Pilot local proof is green for fake accounts.
- Hosted fake-account browser proof is green in the existing artifact.
- The plain-language/ESL guideline now exists at `docs/design/plain-language-and-esl-ui-guidelines.md`.
- Student-facing copy already replaced several technical terms, including `Submitted Work`, `Evidence / Files`, and `Needs Revision`.
- Real-student pilot readiness remains honestly `NO-GO`.

## 3. What Still Feels Confusing

Current normal screens still expose system thinking in places where teachers and students need plain next steps:

- `renderSiteStudentDirectorySection()` starts with eight metric tiles, including likely zero-count tiles, before search and the student list.
- `renderStudentDirectoryActionMap()` exposes an Action Map, lanes, owners, signals, blockers, and high-risk language in the normal Students screen.
- `renderTeacherSection()` and `renderReviewQueueActionMap()` still use lane/map concepts instead of a simple review list.
- `renderStaffWorkspaceTodaySection()` shows equal-weight summary metrics and empty queues that can make a calm day look busy.
- `renderStaffQueueStudentRow()` and `renderReviewQueueRow()` show `Owner:` and `Do next:` blocks that read like workflow tooling instead of teacher tasks.
- `renderStudentDetailSummary()` and detail tabs still use phrases like assigned record view, protected student record, evidence records, and manual checkpoint.
- Admin Overview is improved but still has health, setup readiness lanes, quick actions, recent activity, and metrics competing at once.
- Proof scripts currently expect confusing wording such as `Action map`, `Assigned records only`, and `Setup reasons by lane`.

## 4. Screens That Must Change First

1. Staff/teacher `Students`
   - File/function: `workspace.js` `renderSiteStudentDirectorySection()`, `renderStudentDirectoryActionMap()`, `renderStudentRows()`, `renderStudentDirectoryFilterBar()`.
   - First job: replace the metric/action-map opening with Start Here, search, simple filters, and a row list.

2. Staff `Reviews`
   - File/function: `renderTeacherSection()`, `renderReviewQueueActionMap()`, `renderReviewQueueDecisionGuide()`, `renderReviewQueueRow()`.
   - First job: show waiting work first, then one selected review panel.

3. Staff `Student Detail`
   - File/function: `renderSiteStudentDetailSurface()`, `renderStudentDetailSummary()`, `renderStudentDetailCasePlan()`, detail tab renderers.
   - First job: answer what this student needs next before showing facts, tabs, history, and protected context.

4. Student My Capstone
   - File/function: `renderStudentSection()`, student mission/progress/feedback/final-checklist helpers.
   - First job: keep the first sentence and button direct; remove remaining lane/signal/checkpoint labels from student-visible copy.

5. Admin Console
   - File/function: `renderAdminConsoleOverviewSection()`, `renderAdminSetupIssues()`, `renderAdminSetupReadinessPanel()`, People/Students/Assignments/Imports helpers.
   - First job: make setup a checklist with one first action, then move health and reports lower.

6. Proof expectations
   - File/function: `scripts/prove-workspace-ui-polish.mjs`, `tests/workspace-app.test.mjs`, `tests/workspace-ui-polish-proof.test.mjs`.
   - First job: stop expecting Action Map, lane, signal, and assigned-record wording after UI stages replace them.

## 5. Banned Vocabulary List

Normal teacher/student product UI should not show these words unless they are inside admin audit/debug/proof docs or an explicitly advanced admin diagnostic:

- Action map
- lane
- lanes
- owner
- signal
- queue signal
- support signal
- readiness candidates
- archive handoff
- export blocker
- assigned records only
- scoped records
- role proof
- fake pilot
- hydration
- mutation
- RBAC
- high risk
- blocker
- final files failed
- system health
- no-go
- Showing 0 of 0
- No data
- record
- slice
- command center
- global admin working profile
- what this role can do
- your account can
- permissions enforced

Action Map, lane, owner, and signal wording must not be visible in normal teacher workflow screens.

## 6. Preferred Vocabulary List

Teacher/staff screens should prefer:

- Start here
- Review work
- Help students
- Missing work
- Needs changes
- Waiting for review
- Ready for presentation
- Ready for final review
- Missing mentor
- Open student
- View students
- Search students
- Add student
- Import students
- Assign mentor
- Download template
- No students need this right now
- You are caught up
- Only your students are shown
- Who can help
- Files need help
- Files are not ready yet

Student screens should prefer:

- My Capstone
- What to do next
- Continue my work
- Turn in work
- Upload file
- Read feedback
- Fix and resubmit
- Done
- Not started
- Waiting for review
- Ask your teacher
- No feedback yet
- No work due right now

## 7. Teacher Personas

Non-technical teacher:

- Needs to know which student to open first.
- Will not read a long screen explanation.
- Should see Start Here, a short list, and one obvious action.

Busy Program Teacher:

- Needs waiting work, missing proof, and students needing changes.
- Should not decode lanes, risk signals, owners, or workflow maps.
- Needs the review action close to the student/work row.

Mentor checking quickly:

- Needs assigned students only and clear check-in prompts.
- Should see who needs a meeting, who needs changes, and who is caught up.
- Should never see off-scope students.

Admin assistant importing students:

- Needs a checklist: download template, preview CSV, fix errors, confirm import.
- Should see current roster state before edit controls.
- Needs plain validation messages and no raw CSV parser language.

Principal checking progress:

- Needs a calm summary and a way to open lists behind counts.
- Should not see mutation controls unless their actual role allows them.
- Needs proof caveats separated from normal progress reporting.

## 8. Student Personas

ESL student:

- Needs short sentences with common verbs: open, fix, send, upload, ask.
- Should see one next step before optional details.
- Should not see staff/admin or proof-system words.

Student with low reading confidence:

- Needs concrete action labels and calm empty states.
- Benefits from repeated, consistent labels.
- Should not have to decide from multiple equal cards.

Student who is absent often:

- Needs what is missing, what is due soon, and who to ask.
- Should be told not to skip ahead until approval is recorded.
- Needs feedback and current work easy to find.

Student using Chromebook/mobile:

- Needs the next action and one button in the first viewport.
- Should not scroll past navigation, badges, and summaries before seeing the task.
- Text and buttons must wrap without overlap.

## 9. Screen Contracts For Teacher-Facing Pages

Staff Today:

- Primary question: Which students need attention today?
- First content: one Start Here action or a calm caught-up message.
- Secondary content: short rows grouped by useful work, not all possible categories.
- Forbidden: wall of zero cards, owner/signal/lane wording, role-permission explanation.

Students:

- Primary question: Which students need attention, or how do I find a student?
- First content: Start Here with only useful nonzero actions.
- Secondary content: search, simple filters, and student rows.
- Filters: All, Needs Review, Needs Changes, Missing Work, Ready, and Missing Mentor only for setup-capable roles.
- Empty state: No students need attention right now. View all students.
- Forbidden: Action Map, lanes, owner, signal, high risk, assigned records only, and a wall of zero cards.

Reviews:

- Primary question: What work do I need to review?
- First content: Waiting for review.
- Secondary content: needs changes and recently reviewed.
- Primary action: Review.
- Empty state: No work is waiting for review right now.
- Forbidden: queue signal, submitted lane, archive handoff, and proof-dashboard framing.

Student Detail:

- Primary question: What does this student need next?
- First content: student name, simple status, next step, and a role-safe action.
- Secondary content: Overview, Work, Feedback, Evidence/Files, Timeline.
- Empty states: No feedback yet; No files uploaded yet; No activity yet.
- Forbidden: raw debug data, system workflow terms, and too many badges above the next step.

Staff Reports:

- Primary question: What is happening overall?
- First content: a few meaningful metrics with links to the lists behind them.
- Secondary content: charts and exports.
- Forbidden: chart walls, misleading percentages, and unauthorized data.

## 10. Screen Contracts For Student-Facing Pages

Student Today:

- Primary question: What do I do next?
- First content: one sentence that names the next action.
- Primary action: Continue my work.
- Empty state: You are caught up right now.
- Forbidden: staff/admin language, RBAC, scope, dashboard, artifact, archive, record, lane, signal.

My Work:

- Primary question: What work should I open?
- First content: current work, then work waiting for review, then optional details.
- Primary action: Open item, Add proof, or Send for review.
- Empty state: Ask your Program Teacher which item should appear first.

Feedback:

- Primary question: What feedback do I need to fix?
- First content: feedback that needs changes, if any.
- Primary action: Open work to fix.
- Empty state: No feedback yet.

Final Checklist:

- Primary question: What still needs to be done before closeout?
- First content: short checklist with Done, Waiting for review, Needs work, Not confirmed yet.
- Primary action: Open My Work or Open Feedback.
- Empty state: Not confirmed yet, with who to ask.

## 11. Screen Contracts For Admin Pages

Admin Overview:

- Primary question: What setup needs fixing?
- First content: setup checklist.
- Primary action: complete the first setup item.
- Secondary content: people, students, assignments, imports, reports, audit.
- Empty state: No setup issues found.
- Forbidden: giant equal card wall and workflow-engine language.

People:

- Primary question: Which staff account or access item needs setup?
- First content: current people/access state.
- Primary action: Add staff, assign role, or review current access.
- Forbidden: form-first layout before current state.

Students:

- Primary question: Which roster setup items need fixing?
- First content: current student roster state and missing fields.
- Primary action: Add student, import students, or open a student.

Assignments:

- Primary question: Who needs a mentor, viewer, Program Teacher, or site access?
- First content: gaps before forms.
- Primary action: assign coverage.

Imports:

- Primary question: How do I import students or staff safely?
- First content: step-by-step process: download template, preview file, fix rows, confirm import.
- Secondary content: required columns and recent results.
- Forbidden: unsupported columns, vague errors, raw CSV parser messages.

Reports:

- Primary question: What is happening overall?
- First content: simple metrics and list links.
- Forbidden: chart wall and unauthorized export controls.

Audit:

- Primary question: What changed, and does it need attention?
- First content: redacted recent changes and plain issue groups.
- Forbidden: raw payloads, secrets, tokens, storage IDs, and audit jargon outside the audit section.

## 12. Visual Simplification Rules

- One screen, one job.
- Put the most important action near the top.
- Hide zero-count categories unless they are part of a requested report.
- Prefer rows over giant cards for repeated students and work items.
- Use fewer badges; keep status chips meaningful.
- Use lighter borders, stronger spacing, and compact headings.
- Keep the readable content width reasonable on wide screens.
- Do not nest cards inside cards.
- Do not let summaries, filters, badges, and headers compete equally.
- Use progressive disclosure for advanced details.
- On a calm day, show one calm message instead of many empty categories.

## 13. Mobile Simplification Rules

- The first mobile viewport must show useful content and one obvious action.
- Keep navigation compact and out of the way after sign-in.
- Avoid horizontal scroll.
- Keep row actions wrap-safe.
- Do not let badges, mode switches, or summaries push the task below the fold.
- Use one-column rows for student lists and review queues.
- Keep search visible before long lists.
- Verify student, teacher, viewer, and admin mobile screenshots after visual stages.

## 14. Testing And Proof Plan

Stage 00:

- Add this plan.
- Add doc tests for existence, required sections, screen contracts, and banned/preferred vocabulary.
- Run `git diff --check`.
- Run targeted doc tests.
- Run `npm test`, `npm run typecheck`, and `npm run check` when practical before the Stage 00 commit.

UI stages:

- Update focused `tests/workspace-app.test.mjs` expectations before or with the UI change.
- Update `scripts/prove-workspace-ui-polish.mjs` so screenshots no longer require confusing copy.
- Run `node --test tests/workspace-app.test.mjs` for each UI slice.
- Run `npm run verify:workspace-navigation`, `npm run verify:workspace-url-state`, `npm run verify:permission-matrix`, and `npm run verify:mutation-origin` for shell, route, or RBAC-sensitive work.
- Run `npm run check:workspace-mobile` and `npm run check:workspace-accessibility` for responsive/visual work.
- Run `npm run prove:workspace-ui-polish` after visual/product stages and review screenshots.

Final proof:

- Run the full local regression stack: `npm test`, `npm run typecheck`, `npm run check`, local proof, pilot local proof, permission/mutation checks, mobile/accessibility checks, and pilot readiness preflight.
- Hosted fake-account proof may be rerun only when credentials/environment are available and artifacts are intentionally updated.
- Keep fake-account proof and real-student pilot readiness separate.

## 15. Stop Conditions

Stop, fix, or ask before proceeding if any of these occur:

- Repository is not on `main`.
- Working tree contains unrelated changes that make the stage unsafe.
- A stage would touch `C:\Curriculum`.
- RBAC, role scope, or privacy behavior becomes uncertain.
- Student can see Admin Console, Staff Workspace, or another student's data.
- Viewer can mutate.
- Mentor sees unassigned students.
- Program Teacher sees off-program/off-scope students.
- View as Student becomes visible to students, off-scope, or mutable.
- Global Admin local-account rules weaken.
- Fake-account proof is described as real-student approval.
- Real-student pilot NO-GO is removed without manual/policy evidence.
- Normal teacher UI still opens with Action Map, lanes, owner/signal wording, or a wall of zero cards after the relevant UI stage.
- Mobile first viewport hides the main task behind chrome, badges, or summary blocks.
- Screenshots look like a control panel instead of a teacher/student work tool.
- Validation fails and cannot be fixed safely in the stage.

## 16. Files Inspected For Stage 00

- `package.json`
- `README.md`
- `workspace.js`
- `workspace.css`
- `workspace.html`
- `docs/design/yuge-max-next-round-blueprint-2026-07-05.md`
- `docs/design/plain-language-and-esl-ui-guidelines.md`
- `docs/progress/runs/2026-07-05-student-ready-final-proof.md`
- `docs/sales/workspace-ui-polish-screenshot-index.md`
- `tests/next-major-round-blueprint.test.mjs`
- `tests/plain-language-ui-guidelines.test.mjs`
- `tests/workspace-app.test.mjs`
- `tests/workspace-ui-polish-proof.test.mjs`
- `scripts/prove-workspace-ui-polish.mjs`
- `scripts/verify-functionality-language.mjs`
- `functions/_lib/permissions.ts`
- `functions/_lib/effective-access.ts`
- `functions/_lib/site-student-detail.ts`
