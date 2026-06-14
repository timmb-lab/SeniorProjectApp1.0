# Current-State 100 Improvement Audit

Date: 2026-06-14

Repo: `C:\SeniorProjectApp1.0`

Inspected baseline SHA: `40ee631026602e103f5e3136a6ac5ab502ca5be0`

Working tree note: this audit includes the current uncommitted workspace usability work in `workspace.js`, `workspace.css`, and `tests/workspace-app.test.mjs`.

## Audit Scope

This pass focuses on whether the app is becoming fully usable for students, mentors, Program Teachers, and school staff. The audit weighted "what does this person do next?" higher than visual polish. It also checked upload/storage readiness, role boundaries, security/exploit resistance, proof quality, and pilot-readiness gaps.

Evidence sampled:

- `workspace.js` and `workspace.css` role workspaces, student flows, review queue, mentor dashboard, operations, archive, upload, URL state, and access states.
- `functions/api/**` and `functions/_lib/**` protected routes for student dashboard, evidence upload/download, review queue, review decisions/history, mentor meetings, site students, operations, access assignments, and auth.
- `tests/**` route, workspace, evidence, auth, permissions, hosted proof, and production-surface coverage.
- `docs/functionality-language-audit.md`, `docs/product-readiness-upgrade-sprint.md`, `docs/mvp-requirements-catalog.md`, `docs/product/demo-role-readiness.md`, `docs/student-progress-dashboard.md`, `docs/production-predeploy-checklist.md`, and `docs/generated/production-route-inventory.md`.

## Current Verdict

The app is much more functional than a prototype now: it has real protected routes, scoped role workspaces, student proof upload/link flows, review decisions, student-visible feedback history, mentor meeting records, presentation and archive readiness, admin/user management, and a strong test suite. The biggest remaining risk is not "nothing works." The risk is that real users can still get confused in high-stakes moments: which item to fix, when approval unlocks the next step, who owns a blocker, whether an upload really landed, and what a read-only user can safely do.

The highest-value next work is therefore:

1. Make every student screen say exactly one primary next action.
2. Make Program Teacher approval/manual gate states unmistakable everywhere they affect phase movement.
3. Make mentor workflows more action-oriented without granting mentor power they should not have.
4. Prove hosted/browser states for uploads, denial paths, role-pending, no-assignment, and mobile layout.
5. Add more security guardrails around rate limits, audit review, storage failure handling, and dangerous admin actions.

## Biggest Weaknesses

1. **Hosted proof is still thinner than local proof.** Local and route tests are strong, but several docs still call out hosted click-through, permission-denied UI proof, mobile/browser proof, and upload progress/retry proof as open.
2. **Student next-step clarity is good but still fragmented.** Student flows now include stage guide, checklist, proof, feedback, sent work, files, and timeline, but a student can still be looking at several panels and wonder which one to act on first.
3. **Manual Program Teacher approval is not yet a universal state model.** Review Queue now explains it well, but other surfaces should consistently show whether the student is blocked, waiting, approved, or revising.
4. **Mentor workflows are useful but still mostly advisory.** Mentors can see assigned students, meeting/presentation/revision signals, and record meetings, but the next meeting plan and escalation path could be clearer.
5. **Storage works through Google Drive, but real-user confidence still needs browser proof and fallback language.** The backend has strong upload tests and live-gate docs, but students need very clear receipts, retry states, and "use link instead" fallback.
6. **Admin/site operations are powerful but dense.** Site dashboards, Users & Access, Operations, archive, and audit are route-backed, but they need more "do this then this" sequencing for real school staff.
7. **Security posture is strong for scope checks, but pilot hardening needs continued abuse-path review.** Rate limits, CSRF/origin checks, role-scope drift, dangerous admin actions, and audit review workflows need regular proof.

## Top 25 Recommended Implementation Order

1. #1 Student single "Do this now" command card.
2. #2 Student blocked-by-approval banner across all relevant panels.
3. #16 Program Teacher queue "approve next steps" checklist lock.
4. #17 Program Teacher selected-row decision quality rubric.
5. #31 Mentor next-meeting plan card.
6. #58 Upload receipt with proof-to-requirement confirmation.
7. #59 Upload retry and link fallback proof in browser.
8. #73 Rate-limit proof for upload, review decision, mentor meeting, and admin import.
9. #43 Site Admin first-day setup checklist.
10. #44 Site Admin "students without mentor" assignment wizard.
11. #3 Student revision-only lane.
12. #18 Review Queue missing-proof hold reason.
13. #60 Storage provider unavailable student fallback.
14. #74 CSRF/origin guard coverage expansion.
15. #92 Hosted role-state browser proof.
16. #93 Mobile screenshot/layout proof.
17. #19 Review Queue stale submission recovery path.
18. #32 Mentor revision since last meeting workflow.
19. #45 Users & Access preflight before account import.
20. #61 Google Docs/native export UI proof.
21. #75 Audit anomaly review dashboard.
22. #4 Student due-date danger state.
23. #20 Comment-only decision clarity everywhere it appears.
24. #46 Site selection persistence across all site workspaces.
25. #94 Full end-to-end pilot smoke script.

## 100 Improvement Matrix

| # | Priority | Role | Surface | Improvement | Recommended proof |
|---:|---|---|---|---|---|
| 1 | P0 | Student | Student home | Add one unmistakable "Do this now" command card that chooses the single next action from revision, proof missing, submit, wait, presentation, or final files. | Workspace render test for each status branch. |
| 2 | P0 | Student | Student home, checklist, sent work | Show a consistent "wait for Program Teacher approval before next phase" banner whenever submitted work is waiting or a phase is gated. | Student dashboard test with submitted and approved fixtures. |
| 3 | P0 | Student | Feedback Inbox | Add a revision-only lane that says exactly what to fix, where to attach proof, and how to send it again. | Feedback fixture with revision_requested and matching proof. |
| 4 | P1 | Student | Upcoming deadlines | Add a danger state for overdue or due-soon items with "finish proof" or "send for review" action text. | Deadline ordering and overdue copy test. |
| 5 | P1 | Student | Requirement detail | Add a "ready to send?" readiness checklist: proof attached, latest note read, title present, submit button available. | Requirement detail render test. |
| 6 | P1 | Student | Requirement detail | Show why the send-for-review button is disabled, not only that proof is missing. | Disabled-action copy test. |
| 7 | P1 | Student | Work You Sent In | Add "who owns the next move" as a stronger visual lane: student, Program Teacher, or staff. | Submission status mapping test. |
| 8 | P1 | Student | Work timeline | Add "latest thing first" label and separate teacher-visible status changes from teacher feedback notes. | Timeline DOM test. |
| 9 | P1 | Student | Uploaded and linked work | Add "not matched to a checklist item" recovery with a clear next action to choose the right work item. | Evidence row without requirementId fixture. |
| 10 | P1 | Student | Proof forms | Add a small "what counts as proof here" prompt using requirement description/source data when available. | Requirement-aware proof form test. |
| 11 | P1 | Student | Final files | Put the exact final-files blocker into the main student next-action card when May 5 work is the highest risk. | Archive readiness branch test. |
| 12 | P2 | Student | Presentation | Add a student-facing "presentation prep next" card when outline/presentation status is pending. | Presentation fixture render test. |
| 13 | P2 | Student | Progress details | Add a simple printable/downloadable progress summary after privacy review. | Print-safe DOM snapshot, no private IDs. |
| 14 | P2 | Student | Need help panel | Add policy-approved support escalation text: who to ask when no mentor, missing proof, or blocked approval. | Copy test, no raw contact leak. |
| 15 | P2 | Student | Mobile student view | Add mobile-specific proof that first screen shows progress, one next action, and no overlapping text. | Browser screenshot/mobile smoke. |
| 16 | P0 | Program Teacher | Review Queue | Add a decision checklist beside approval: proof attached, history checked, student note written, phase movement understood. | Review Queue selected-row test. |
| 17 | P0 | Program Teacher | Review Queue | Add a mini quality rubric to distinguish Approve, Request revision, and Comment only. | Render test for decision helper. |
| 18 | P0 | Program Teacher | Review Queue | Strengthen missing-proof rows with a "hold approval" state and action to open proof/student detail. | Queue fixture with submitted and zero proof. |
| 19 | P1 | Program Teacher | Review Queue | Add stale submission recovery: "student has not changed work since revision request" or "new revision arrived." | Version/history fixture test. |
| 20 | P1 | Program Teacher | Review Queue | Make comment-only visibly non-gating wherever it appears in queue, history, student timeline, and status chips. | Comment-only route and UI tests. |
| 21 | P1 | Program Teacher | Program Dashboard | Add "review first" list that orders submitted, missing proof, revision returned, high risk, and stale activity. | Program dashboard render test. |
| 22 | P1 | Program Teacher | Student detail | Add "teacher decision history" summary to the detail header before the full reviews tab. | Student detail fixture test. |
| 23 | P1 | Program Teacher | Student Directory | Add exact "needs teacher approval" filter if backend can support it from submitted/revision state. | Route and URL-state test. |
| 24 | P1 | Program Teacher | Review Queue | Add batch-safe "open next submitted item" navigation, not batch approval. | Queue navigation test, no mutation. |
| 25 | P2 | Program Teacher | Review Queue | Add keyboard shortcuts only after buttons are stable and accessible. | Accessibility and no accidental submit test. |
| 26 | P2 | Program Teacher | Review Queue | Add clearer empty states for "all done," "filtered out," and "site selection needed." | Empty-state fixture tests. |
| 27 | P2 | Program Teacher | Operations | Add teacher-specific language explaining which blockers they can solve and which require Site Admin. | Operations role-copy test. |
| 28 | P2 | Program Teacher | Student detail | Add "phase approval status" fact next to progress and latest feedback. | Detail summary test. |
| 29 | P2 | Program Teacher | Review Queue URL state | Add shareable queue links for exact status/risk/story filters if not already covered by current URL state. | Deep-link verifier. |
| 30 | P2 | Program Teacher | Hosted proof | Run a hosted Program Teacher browser click-through from dashboard metric to review decision to student timeline update. | Hosted fake-account proof. |
| 31 | P0 | Mentor | Mentor Dashboard | Add next-meeting plan card: who to meet, why, and what question to ask first. | Mentor dashboard fixture test. |
| 32 | P0 | Mentor | Mentor Dashboard | Add "revision since last meeting" lane using latest meeting and submission timestamps. | Mentor API and UI tests. |
| 33 | P1 | Mentor | Student detail mentor tab | Put linked work/revision context above meeting history so mentors know why the meeting matters. | Detail mentor tab render test. |
| 34 | P1 | Mentor | Mentor meeting form | Add "meeting purpose" choices tied to statuses: revision, presentation, proof, planning, check-in. | Form submission and validation test. |
| 35 | P1 | Mentor | Mentor Dashboard | Add "ask next" prompts beside each assigned student row. | Existing prompt copy test. |
| 36 | P1 | Mentor | Mentor Dashboard | Add "no action needed today" state for assigned students who are on track. | Filter-empty fixture test. |
| 37 | P1 | Mentor | Presentation | Add mentor-specific presentation prep checklist for assigned students only. | Assigned-only presentation render test. |
| 38 | P1 | Mentor | Permissions | Add stronger mentor denial copy when trying to open unassigned student detail. | 403 UI proof. |
| 39 | P2 | Mentor | Mentor Dashboard | Add sort controls: needs revision, meeting due, presentation risk, newest activity. | URL/focus state test. |
| 40 | P2 | Mentor | Mentor meetings | Add scheduled date semantics only after policy decides whether mentors can schedule or just record. | Policy doc plus route test. |
| 41 | P2 | Mentor | Mentor Dashboard | Add downloadable meeting prep sheet only if privacy policy allows. | Print/export no-private-data test. |
| 42 | P2 | Mentor | Hosted proof | Run hosted mentor assigned-student and meeting-record click-through with fake data. | Hosted browser smoke. |
| 43 | P0 | Site Admin | Site Dashboard | Add first-day setup checklist: programs active, users imported, mentors assigned, students added, storage ready. | Site admin fixture test. |
| 44 | P0 | Site Admin | Mentor Assignments | Add guided assignment wizard for unassigned students, one student at a time, with review before save. | Route/UI test with audit event. |
| 45 | P0 | Global Admin | Users & Access | Add account import preflight: role scope, site/program match, reset-required delivery policy, no real temp credentials unless allowed. | Admin import UI and route tests. |
| 46 | P1 | Multi-site staff | Site selector | Prove current site selection persists across dashboard, students, review, mentor assignments, operations, programs, access, and detail. | Cross-section URL-state test. |
| 47 | P1 | Site Admin | Users & Access | Add "what removal does" warning before removing school access or disabling orphaned student sign-in. | Removal confirmation test. |
| 48 | P1 | Site Admin | Student Directory | Add "needs approval," "proof missing," "mentor meeting follow-up," and "final files blocked" saved filter chips. | Directory route and UI tests. |
| 49 | P1 | Site Admin | Operations | Add owner column: student, Program Teacher, mentor, Site Admin, Global Admin, storage/admin. | Operations fixture test. |
| 50 | P1 | Site Admin | Operations | Add "do this next" per blocker row, not only category/status labels. | Operations row copy test. |
| 51 | P1 | Global Admin | Audit | Add saved filters for recent denied access, upload failures, review decisions, account changes, and export failures. | Audit URL-state and route tests. |
| 52 | P1 | Global Admin | Archive exports | Add clearer retry/failed state when package generation fails, while avoiding fake retry buttons until endpoint exists. | Archive failed fixture test. |
| 53 | P1 | Administration/Viewer | Read-only workspaces | Add escalation guidance: who to notify and which exact worklist to share. | Read-only render test. |
| 54 | P2 | Org Admin | Organization dashboard | Add tenant/site rollup only after route policy is explicit. | New route authorization tests. |
| 55 | P2 | Site Admin | Programs | Add "program missing from school" setup flow with safe add/remove confirmation. | Site programs route test. |
| 56 | P2 | Admin | Account lifecycle | Add invite/email workflow only after delivery policy is decided. | Policy and route tests. |
| 57 | P2 | Admin | Reporting | Add aggregate export/report for leadership with no individual private proof. | Redaction test. |
| 58 | P0 | Student | Upload receipt | After upload/link, show a durable receipt naming the checklist item, proof title, time, and next action. | Upload/link workspace tests. |
| 59 | P0 | Student | Upload browser flow | Prove progress, retry, cancel/network failure, provider failure, and link fallback in a real browser. | Browser upload smoke. |
| 60 | P0 | Student | Storage unavailable | When Drive is unavailable, say "use proof link or contact instructor" and keep upload controls honest. | Provider-unavailable fixture. |
| 61 | P1 | Student/Staff | Google Workspace files | Add UI proof for Google Docs export/download cases and unsupported native Workspace files. | Download integration and UI tests. |
| 62 | P1 | Security | Upload route | Add extension/MIME abuse cases for renamed files, generic MIME, mixed-case extensions, and huge declared size. | Evidence upload tests. |
| 63 | P1 | Security | Upload route | Consider lightweight content sniffing for high-risk file types if Workers limits allow. | Route tests, no false approval claims. |
| 64 | P1 | Security | Upload route | Add repeated-upload throttling per user/submission to reduce abuse. | Rate-limit integration test. |
| 65 | P1 | Security | Evidence links | Add phishing/credential pattern warnings beyond URL credential rejection. | Evidence link validation tests. |
| 66 | P1 | Staff | Evidence download | Add clearer audit/event trail in UI when staff downloads protected evidence. | Audit route and UI test. |
| 67 | P2 | Storage | Provider config | Add admin-facing storage readiness panel with root, index, and provider status without IDs/secrets. | Health/storage UI test. |
| 68 | P2 | Storage | Retention | Add retention-window copy for final files and evidence downloads. | Archive retention fixture. |
| 69 | P2 | Storage | Quotas | Add Drive quota or provider failure classification if Google returns quota/403 variants. | Provider error tests. |
| 70 | P2 | Storage | Archive packages | Add student-safe package-ready notification state without exposing signed URL internals. | Archive readiness test. |
| 71 | P2 | Storage | File names | Review filename sanitization end-to-end so Drive names stay readable but safe. | Upload metadata test. |
| 72 | P2 | Storage | Third-party decision | Document why Google Drive is current storage, when R2/S3 would be needed, and migration/offboarding plan. | ADR update. |
| 73 | P0 | Security | Abuse prevention | Add or prove rate limits for login, upload, review decisions, mentor meeting writes, admin import, and password reset. | Route-level rate-limit tests. |
| 74 | P0 | Security | CSRF/origin | Expand cross-origin POST protection proof to every mutation route, not only shared helper tests. | Mutation route integration tests. |
| 75 | P0 | Security | Audit | Add an audit anomaly view: denied access spikes, failed uploads, repeated login failures, import attempts, and role changes. | Audit dashboard tests. |
| 76 | P1 | Security | Permissions | Add a role/scope matrix verifier that fails if Program Teacher gains global security or mentor gains broad student access. | Source/integration verifier. |
| 77 | P1 | Security | Admin destructive actions | Add two-step confirmation and reason enforcement for account removals, password resets, import, and archive export retry. | Workspace and route tests. |
| 78 | P1 | Security | Sensitive output | Expand leak scans for tokens, Drive IDs, private keys, temp passwords, raw folder IDs, and setup credentials across UI and docs. | Production-surface checker. |
| 79 | P1 | Security | Sessions | Add visible session-expired recovery and test idle/expired session during form submit. | Browser/form test. |
| 80 | P1 | Security | Passwords | Add admin policy copy for temporary credential delivery before real account import. | Admin import render test. |
| 81 | P1 | Security | SSO | Keep Google SSO disabled unless fully configured; add admin-visible disabled reason without broken sign-in affordance. | Auth config/workspace test. |
| 82 | P2 | Security | CSP | Review headers for CSP, anti-clickjacking, referrer policy, and no-store on sensitive JSON. | Header tests. |
| 83 | P2 | Security | Logs | Ensure all audit metadata stays redacted and does not store note text where forbidden. | Audit metadata tests. |
| 84 | P2 | Security | Dependencies | Add dependency/update audit cadence for Wrangler, Workers types, and TypeScript. | CI or checklist proof. |
| 85 | P1 | Student/Teacher | Public guide | Add clearer "sign in to do the private workflow" bridge only where protected app exists. | Public surface test. |
| 86 | P1 | Student/Teacher | Public guide | Run mobile/desktop visual QA for public Student Guide and Teacher Guide mode. | Browser screenshots. |
| 87 | P1 | Teacher | Public guide | Add phase-by-phase teacher approval checkpoints that align with manual Program Teacher approval in app. | Source crosswalk test. |
| 88 | P2 | Student | Public guide | Add project-type examples beyond build/prototype language for service, research, design, teaching, and portfolio projects. | Content source test. |
| 89 | P2 | Mentor | Public guide | Add mentor-facing "before each meeting" checklist tied to app meeting statuses. | Public copy test. |
| 90 | P2 | Family | Public guide | Add family/guardian plain-language timeline page only if program policy wants it. | Public page test. |
| 91 | P2 | Content | Crosswalk | Keep source-material crosswalk updated when student app language changes. | Crosswalk verifier. |
| 92 | P0 | QA | Hosted proof | Run hosted browser proof for role-pending, no-assignment, permission-denied, signed-out, and reset-required states. | `check:workspace:hosted-permissions`. |
| 93 | P0 | QA | Mobile layout | Add mobile screenshots for student, mentor, Program Teacher Review Queue, Site Dashboard, and Users & Access. | Browser screenshot set. |
| 94 | P0 | QA | End-to-end pilot flow | Create one full fake-account pilot script: import users, student proof, submit, teacher revision, student resubmit, approval, mentor meeting, presentation, final files. | Local and hosted smoke. |
| 95 | P1 | QA | Dashboard actions | Extend dashboard verifier for every `data-section` preset and every summary-only row. | `verify:dashboard-actions`. |
| 96 | P1 | QA | URL state | Add a consolidated URL-state verifier for review, student detail, mentor focus, presentation focus, audit, archive, and operations. | New verifier or workspace tests. |
| 97 | P1 | QA | Accessibility | Add keyboard and ARIA smoke for dialogs, disclosure panels, nav collapse, filters, and review decision form. | DOM/browser a11y smoke. |
| 98 | P1 | QA | Error states | Add fixtures for 401, 403, 404, 409, 500, and provider errors on major sections. | Workspace error-state tests. |
| 99 | P2 | QA | Performance | Split or lazy-load the very large `workspace.js` after product behavior stabilizes. | Bundle/perf smoke. |
| 100 | P2 | QA | Release readiness | Add a one-command weekly readiness report that runs local gates, reports skipped hosted gates, and prints pilot blockers. | Script plus doc test. |

## Recommended Next Batch

If the next request is "do the top 25," implement only route-backed and locally provable slices. The safest first batch is:

- Student next-action and approval-gate clarity: #1, #2, #3, #5, #6, #7, #11.
- Program Teacher review clarity: #16, #17, #18, #19, #20, #21.
- Mentor next-meeting clarity: #31, #32, #33, #35.
- Upload/storage confidence: #58, #59, #60, #62.
- Security and hosted proof: #73, #74, #75, #92.

Avoid broad refactors, fake links, new permissions, or fake retry buttons. Prefer existing route payloads, structural `data-*` markers, focused tests, and browser proof where the risk is visual or hosted-only.
