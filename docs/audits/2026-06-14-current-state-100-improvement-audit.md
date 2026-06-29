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

## Top 25 Implementation Addendum

Update: the app now treats the "someone unfamiliar can sit down and use it" goal as a first-screen workflow requirement. The current implementation covers the highest-leverage top-25 items through existing route-backed student, Review Queue, mentor, site dashboard, Users & Access, upload/storage, and audit surfaces, plus a new shared first-use guide layer in `workspace.js` and `workspace.css`.

Implemented and verified in this pass:

1. Student first-use path: read the single next-action card first.
2. Student first-use path: open the named item instead of scanning every panel.
3. Student first-use path: add proof or send revision only on the matching item.
4. Student first-use path: stop at the Program Teacher approval gate.
5. Program Teacher first-use path: start with decision order.
6. Program Teacher first-use path: select one review row at a time.
7. Program Teacher first-use path: check proof, history, and the manual gate.
8. Program Teacher first-use path: save exactly one decision or stop in read-only mode.
9. Mentor first-use path: use revision, meeting, presentation, then regular-support order.
10. Mentor first-use path: start with the suggested meeting question.
11. Mentor first-use path: open student detail only for assigned students when needed.
12. Mentor first-use path: record purpose, status, and follow-up after the check-in.
13. Site dashboard first-use path: confirm first-day setup before trusting live workflows.
14. Site dashboard first-use path: open the most urgent tile first.
15. Site dashboard first-use path: keep details secondary to the first-screen metrics.
16. Site dashboard first-use path: route the owner for review, mentor, and final-file blockers.
17. Users & Access first-use path: choose the smallest role.
18. Users & Access first-use path: confirm site, program, or student scope.
19. Users & Access first-use path: require an admin note before saving.
20. Users & Access first-use path: use approved setup-password delivery.
21. Audit first-use path: open saved audit filters first.
22. Audit first-use path: use anomaly counts to classify support, setup, or security follow-up.
23. Audit first-use path: keep audit review redacted.
24. Audit first-use path: route account, proof, and review issues to the right owner.
25. Shared proof and layout: one reusable first-use component with focused workspace render tests.

## Second Top 25 Implementation Addendum

Update: the repeated "someone unfamiliar can sit down and use it" pass focused on row-level ownership. The app now labels who owns the next move and what to do next on the worklists where users are most likely to freeze after reading the first-screen guide.

1. Student Directory rows now show a plain owner label.
2. Student Directory rows now show a plain "Do next" instruction.
3. Missing-mentor rows point to Site Admin or Program Teacher ownership.
4. Missing-mentor rows tell staff to use Mentor Assignments before the next check-in.
5. Submitted-review rows identify Program Teacher ownership.
6. Submitted-review rows tell staff to use the Review Queue after proof/history checks.
7. Revision rows identify that the student owns the next change.
8. Revision rows clarify that Program Teachers wait for a submitted revision.
9. Missing-proof rows identify student proof ownership.
10. Presentation rows route readiness to Program Teacher or site staff.
11. Final-file failed rows route ownership to Site Admin.
12. Final-file failed rows tell staff to open Operations final-file rows before student handoff.
13. Read-only Student Directory rows now give escalation language instead of mutation language.
14. Review Queue rows now show an owner/action block beside the existing decision hint.
15. Proof-ready submitted rows tell Program Teachers to select one row, check proof/history, and save one decision.
16. Submitted rows without proof tell reviewers to hold approval and ask for exact proof.
17. Revision-requested Review Queue rows tell reviewers to wait for a submitted revision.
18. Approved Review Queue rows clarify that the row is approval history, not another decision point.
19. Operations ranked actions now name the responsible owner.
20. Operations ranked actions now show the next action directly inside the ranked list.
21. Storage-provider blockers now say to confirm setup before student downloads.
22. Evidence-missing blockers now route proof follow-up to students with Program Teacher support.
23. Audit anomaly cards now show an owner.
24. Audit anomaly cards now show a redacted "Do next" route.
25. Focused workspace render tests now prove the owner/action guidance across Students, Review Queue, Operations, and Audit.

## Third Top 25 Implementation Addendum

Update: this pass added a shared "Current screen" orientation strip to the workspace shell. Every route now answers three first-time-user questions before the detailed screen content appears: what this screen is for, where to start, and what not to do here.

1. Overview now explains that summary counts are signals, not saved record changes.
2. Profile now tells users to learn their role before taking action.
3. Site Dashboard now points users to urgent tiles and first-day setup first.
4. Programs now separates active-program management from account and mentor work.
5. Students now tells staff to search or use saved filters before opening one record.
6. Students now says Program Teacher decisions belong in Review Queue.
7. Student Workspace now tells students to read "Do this next" before opening panels.
8. Student Workspace now says not to start a new phase before Program Teacher approval.
9. Student Final Files now separates ready downloads from failed or pending packages.
10. Mentor Dashboard now starts mentors with focus filters and the suggested meeting plan.
11. Assigned Students now separates mentor check-ins from mentor assignment management.
12. Program Dashboard now points Program Teachers to the review-first list.
13. Program Dashboard now separates program attention from global or school account access.
14. Review Queue now says to select one row and check proof/history.
15. Review Queue now warns against approving missing proof or batch approval.
16. Mentor Assignments now says one mentor, one student, and confirm the student row first.
17. Operations now tells staff to use ranked actions before long worklists.
18. Operations now warns not to mark completion from the summary strip.
19. Presentation now separates schedule/day-of work from Program Teacher review decisions.
20. Admin Command Center now routes users from risk cards into source screens.
21. Readiness now frames reports as aggregate-only and private-proof safe.
22. Users & Access now requires current-access and preflight review before saving.
23. Audit now emphasizes saved filters, anomaly cards, and redacted investigation.
24. Final File Exports now separates failed, pending, and complete package follow-up.
25. Security/Account now clearly limits the screen to the signed-in user's password and session.

## Fourth Top 25 Implementation Addendum

Update: this pass turned the shared screen-orientation copy into immediate route-backed actions. Every suggested next click is filtered to sections the signed-in user can open, uses existing workspace routes, presets, or audit filters instead of placeholder buttons, and keeps the browser URL aligned when it moves to another plain section.

1. Overview now offers role-aware first clicks instead of only a text summary.
2. Profile now offers the same role-aware first clicks after users read their access guide.
3. Student Overview/Profile actions route students to Student Workspace, Presentation, and Final Files.
4. Mentor Overview/Profile actions route mentors to Mentor Dashboard, Assigned Students, and Presentation.
5. Program Teacher Overview/Profile actions route to Program Dashboard, submitted Review Queue rows, and missing-proof Student Directory rows.
6. Site/Admin Overview/Profile actions route to Site Dashboard, missing-mentor Student Directory rows, and Operations attention rows.
7. Viewer Overview/Profile actions route to the read-only Student Directory, Profile, and Account screens.
8. Misc Admin Overview/Profile actions route to aggregate Readiness, Profile, and Account screens.
9. Site Dashboard orientation actions open missing mentors, submitted review work, and final-file failures.
10. Programs orientation actions return users to Site Dashboard, Users & Access, or Security.
11. Student Directory orientation actions open missing-mentor, submitted-work, and high-risk filters.
12. Student Workspace orientation actions open Presentation, Final Files, and Account.
13. Student Final Files orientation actions return to Student Workspace, Presentation, or Account.
14. Mentor Dashboard orientation actions open Assigned Students, Presentation, or Account.
15. Assigned Students orientation actions return to Mentor Dashboard, Presentation, or Account.
16. Program Dashboard orientation actions open submitted work, revision follow-up, and missing-proof filters.
17. Review Queue orientation actions open submitted, revision, and proof-attached filters.
18. Mentor Assignments orientation actions open unassigned, active, and missing-mentor filters.
19. Operations orientation actions open presentation, final-file, and missing-proof worklists.
20. Presentation orientation actions open outline follow-up, ready-for-check-out, and Operations presentation follow-up.
21. Admin Command Center orientation actions open Site Dashboard, Audit, and failed final-file exports.
22. Readiness orientation actions open Operations, Site Dashboard, and Student Directory when available.
23. Users & Access orientation actions route back to current-school review, Profile, and Security before risky account work.
24. Audit orientation actions open recent protected activity, student-dashboard activity, and review-queue activity with redacted filters.
25. Final File Exports and Security orientation actions open package-status filters or safe account/profile destinations, and plain section actions now sync shareable workspace URLs.

## Fifth Top 25 Implementation Addendum

Update: this pass added recovery actions to shared problem states so unfamiliar users are not stranded when a screen needs a site selection, access update, refreshed data, or support follow-up. The actions are reusable, route-backed, and available anywhere the shared problem-state helper appears.

1. Problem states now include a compact "Try next" recovery row.
2. Every recovery row can refresh the workspace without relying on the topbar.
3. Every signed-in recovery row can route users to Profile when that section is available.
4. Every signed-in recovery row can route users to Account or Security when that section is available.
5. Recovery actions are capped at three buttons to keep error states calm.
6. Recovery actions use existing `data-section` navigation instead of fake links.
7. Recovery refresh uses the existing workspace data loader.
8. Site Dashboard site-selection states now include recovery actions below the reason/owner/next-action grid.
9. Programs site-selection states now include recovery actions before any add/remove controls appear.
10. Student Directory site-selection states inherit the same recovery actions.
11. Review Queue site-selection states now help users recover without implying review rows loaded.
12. Mentor Assignment site-selection states inherit the shared recovery pattern.
13. Operations site-selection states inherit the shared recovery pattern.
14. Users & Access site-selection states now give safe alternatives before account-management forms appear.
15. Permission-denied states now route users toward Profile and Account instead of leaving them at a stop sign.
16. Role-pending states inherit refresh/profile/account recovery where allowed.
17. No-active-assignment states inherit refresh/profile/account recovery where allowed.
18. Unavailable dashboard states inherit refresh/profile/account recovery where allowed.
19. Student-detail unavailable states inherit recovery actions while preserving current access boundaries.
20. Review-history unavailable states inherit the same safe recovery pattern.
21. The recovery row uses existing button styling rather than a new interaction style.
22. Mobile layouts now stack recovery buttons cleanly under problem text.
23. Workspace render tests now prove recovery actions on selection-required and permission-denied states.
24. Navigation verifier now guards recovery actions and refresh wiring.
25. The implementation keeps recovery actions separate from mutation controls, so no unavailable save/approve/assign action is implied.

## Sixth Top 25 Implementation Addendum

Update: this pass focused on the final-click moment. The app already tells users where to go, what screen they are on, and how to recover from blocked states. The next risk was that unfamiliar users could still reach a real save, assign, submit, password, or final-file handoff action without knowing what to check before committing. A new shared "before you finish" checklist now appears on the highest-risk workflow surfaces without adding any new permissions, fake actions, or backend claims.

1. Added a reusable task-finish checklist component for high-risk workflow surfaces.
2. Added stable `data-task-finish-checklist` markers for focused tests and future audits.
3. Added per-check state markers so ready, context, blocked, and staff-action checks are visually distinct.
4. Student command cards now show checks before acting on the primary next step.
5. Student revision states now say to open the exact item, read the Program Teacher note, attach corrected proof, and stop at approval.
6. Student waiting-for-review states now say to check the sent version and not change direction.
7. Student final-file blocker states now say to read the blocker and avoid random uploads.
8. Student draft/missing-work states now say to match the checklist item before adding proof.
9. Student final-file screens now show handoff checks before download, package requests, or final proof work.
10. Ready final-file downloads now remind students to download within the window.
11. Ready final-file downloads now remind students to keep a personal copy before school account access closes.
12. Blocked final-file states now clarify that the student screen does not create package retries.
13. Mentor assignment forms now show checks before saving an assignment.
14. Mentor assignment checks remind staff to confirm the student still needs coverage.
15. Mentor assignment checks remind staff to review active mentor load before choosing a mentor.
16. Mentor assignment checks clarify that assignment does not create accounts, change roles, or message students.
17. Users & Access account creation now shows checks before creating an account or setup password.
18. Account creation checks emphasize smallest-role selection.
19. Account creation checks emphasize site, program, cohort, or student scope matching.
20. Account creation checks emphasize approved setup-password handoff before saving.
21. Account creation checks emphasize audit-note clarity for later admin review.
22. Account password changes now show checks before saving a password update.
23. Password checks remind users that other active sessions close after a change.
24. Admin final-file exports now show handoff checks before telling anyone a package is ready.
25. Navigation and workspace render tests now guard the checklist component and the student, mentor, account, password, and final-file placements.

## Seventh Top 25 Implementation Addendum

Update: this pass focused on app language itself. The workspace already gives first-click guidance, recovery actions, and final-click checks, but someone unfamiliar with the app can still hesitate when they see domain terms such as evidence, scope, read-only, Program Teacher approval, package status, or redacted activity. A new shared "Words on this screen" language guide now appears after the current-screen orientation strip and translates the key terms for the active route.

1. Added a reusable screen-language guide component to the workspace shell.
2. Added stable `data-screen-language-guide` markers for focused tests and future audits.
3. Added stable `data-language-term` markers for each visible term.
4. Overview now defines signal, access, and next step.
5. Student overview now defines Student Workspace as the main place for tasks, proof, feedback, and approval.
6. Viewer overview now defines monitoring as watching progress without changing records.
7. Profile now defines role, scope, and read-only.
8. Site Dashboard now defines urgent tile, first-day setup, and school-wide.
9. Programs now defines active program, available program, and site program.
10. Student Directory now defines saved filter, high risk, and missing proof.
11. Student Workspace now defines proof, Program Teacher approval, and revision.
12. Student Final Files now defines final files, download window, and package status.
13. Mentor Dashboard now defines focus filter, meeting plan, and revision signal.
14. Assigned Students now defines assigned student, meeting record, and follow-up.
15. Program Dashboard now defines review-first list, cohort, and manual gate.
16. Review Queue now defines submitted work, decision, and proof history.
17. Mentor Assignments now defines coverage, active mentor load, and assignment reason.
18. Operations now defines ranked action, readiness blocker, and owner.
19. Presentation now defines check-out, check-in, and outline.
20. Admin Command Center now defines platform risk, source screen, and protected activity.
21. Readiness now defines aggregate, private proof, and readiness score.
22. Users & Access now defines smallest role, scope, and setup password.
23. Audit now defines redacted, anomaly, and protected record.
24. Admin Final Files now defines export package, failed package, and complete package.
25. Account/Security now defines session, password change, and sign out.

## Eighth Top 25 Implementation Addendum

Update: this pass focused on action consequences. The workspace now explains what clicks do on the active screen before an unfamiliar user experiments: whether a click only filters, opens another screen, reveals details, saves a record, changes status, downloads a file, or needs source-screen follow-up. A new shared "What clicks do here" guide appears after the language guide and uses stable markers for tests and future audits.

1. Added a reusable screen action-impact guide to the workspace shell.
2. Added stable `data-screen-action-impact-guide` markers for every route.
3. Added stable `data-action-impact` markers for each click-effect item.
4. Added click-effect state markers for safe, route, changes, and context actions.
5. Overview now clarifies that summary cards route to source screens.
6. Profile now clarifies that role-action buttons navigate without changing records.
7. Site Dashboard now clarifies that metric buttons open filtered source screens.
8. Programs now clarifies that add/remove forms save school-program settings.
9. Student Directory now clarifies that search and filters only narrow the list.
10. Student Directory now clarifies that Program Teacher decisions are saved in Review Queue.
11. Student Workspace now clarifies that Open item only expands a checklist row.
12. Student Workspace now clarifies that proof links/uploads save to the selected work item.
13. Student Workspace now clarifies that sending work moves the item to Program Teacher review.
14. Student Final Files now clarifies that blocked states do not create package retries.
15. Mentor Dashboard now clarifies that focus filters do not change records.
16. Assigned Students now clarifies that recording a meeting saves a mentor check-in note.
17. Program Dashboard now clarifies that summary rows do not approve, reject, or request revision.
18. Review Queue now clarifies that filters are safe, row selection opens proof/history, and the decision form saves the outcome.
19. Mentor Assignments now clarifies that saving an assignment connects one active mentor to one student.
20. Operations now clarifies that rows are monitoring and handoff context, not completion toggles.
21. Presentation now clarifies that check-out/check-in controls change day-of slot status.
22. Admin Command Center now clarifies that risk cards route to source screens and counts do not edit records.
23. Users & Access now clarifies that create/import forms save users, roles, and scoped access.
24. Audit now clarifies that filters only narrow redacted logs and fixes happen in source screens.
25. Final File Exports and Account/Security now clarify package downloads, failed package follow-up, password changes, and sign-out effects.

## Ninth Top 25 Implementation Addendum

Update: this pass focused on privacy, audience, and visibility confidence. The workspace now answers "who can see this?" on every active screen so an unfamiliar user knows when they are looking at their own work, staff-only support context, student-visible feedback, redacted audit rows, protected downloads, or sensitive account setup data before they act.

1. Added a reusable screen visibility guide to the workspace shell.
2. Added stable `data-screen-visibility-guide` markers for every route.
3. Added stable `data-visibility-note` markers for each visibility item.
4. Added visibility state markers for self, staff, shared, private, redacted, and context notes.
5. Overview now explains that only allowed screens are offered to the signed-in account.
6. Student overview now points students toward their own checklist, proof, feedback, and final-file status.
7. Viewer overview now clarifies read-only monitoring without record changes.
8. Profile now explains who can see account access details and where access concerns should go.
9. Site Dashboard now distinguishes school-wide summaries from protected source-screen details.
10. Programs now clarifies that program setup is separate from private student progress and account details.
11. Student Directory now explains that visible rows are allowed records and that private proof stays protected.
12. Student Workspace now states who can see student proof after it is added.
13. Student Workspace now clarifies when mentors can see support context.
14. Student Final Files now separates student download visibility from staff package-status visibility.
15. Mentor Dashboard now clarifies assigned-mentor visibility and no full-directory exposure.
16. Assigned Students now clarifies mentor meeting notes as staff support records.
17. Program Dashboard now clarifies assigned-student visibility and avoids unrelated account detail exposure.
18. Review Queue now distinguishes Program Teacher reviewer access, student-visible feedback, and staff-only context.
19. Mentor Assignments now clarifies coverage-staff access and that no family message is sent from the screen.
20. Operations now clarifies staff readiness visibility while protecting private proof detail.
21. Presentation now clarifies day-of status visibility without exposing review feedback.
22. Admin Command Center and Readiness now clarify aggregate reporting versus protected source-screen details.
23. Users & Access now identifies authorized account staff and sensitive setup-password handoff.
24. Audit now identifies global-admin visibility, redacted rows, and source-screen follow-up.
25. Admin Final Files and Account/Security now clarify protected downloads, raw file hiding, and personal session changes.

## Tenth Top 25 Implementation Addendum

Update: this pass focused on first-minute readiness. The workspace now answers "what do I need before I start?" on every active screen so an unfamiliar user knows which school, row, proof, decision, owner, filter, password, or handoff note should be ready before they touch controls.

1. Added a reusable screen start guide to the workspace shell.
2. Added stable `data-screen-start-guide` markers for every route.
3. Added stable `data-start-requirement` markers for each before-you-start item.
4. Added start-check state markers for choose, check, prepare, confirm, source, and context needs.
5. Overview now asks users to confirm account context, pick one next step, and use source screens for saved changes.
6. Student overview now points students to Student Workspace for checklist, proof, feedback, and approval status.
7. Viewer overview now reinforces monitor-only use before changing records.
8. Profile now asks users to read their access banner and note missing school, program, student, or task access.
9. Site Dashboard now asks staff to choose the current school, read urgent tiles, and open source screens.
10. Programs now asks staff to confirm the current school, program fit, and setup note before changing settings.
11. Student Directory now asks users to confirm school context, start with filters, and open one student for private detail.
12. Student Workspace now asks students to open one checklist item, have proof ready, and read latest feedback first.
13. Student Final Files now asks students to check package status, handoff timing, and blocker wording.
14. Mentor Dashboard now asks mentors to start with focus filters and open one assigned student before meeting support.
15. Assigned Students now asks mentors to choose an assigned student, prepare a meeting result, and write follow-up.
16. Program Dashboard now asks Program Teachers to review risks first and use source lists for detail.
17. Review Queue now asks Program Teachers to select one row, review proof/history, and choose one outcome before saving.
18. Mentor Assignments now asks staff to choose student and mentor, check mentor load, and add an assignment reason.
19. Operations now asks staff to pick a blocker type, check listed owner, and open source screens for changes.
20. Presentation now asks staff to set schedule filters, confirm the slot, and use day-of controls only with known status.
21. Admin Command Center now asks admins to start with risk cards and treat summaries as routing, not edit forms.
22. Readiness now asks users to confirm report context and use aggregate numbers before opening protected detail.
23. Users & Access now asks staff to confirm the person/school, choose the smallest role, and prepare handoff notes.
24. Audit now asks reviewers to set filters first, read redacted rows, and fix issues in source screens.
25. Admin Final Files and Account/Security now ask users to filter package status, confirm handoff ownership, and prepare password/session actions.

## Eleventh Top 25 Implementation Addendum

Update: this pass focused on completion confidence. The workspace now answers "how do I know I am done here?" on every active screen so an unfamiliar user knows when a route has finished its job, when to wait, when to open a source screen, and when no records were changed.

1. Added a reusable screen done guide to the workspace shell.
2. Added stable `data-screen-done-guide` markers for every route.
3. Added stable `data-done-signal` markers for each completion signal.
4. Added done-signal state markers for complete, saved, route, source, safe, check, waiting, followup, and handoff outcomes.
5. Overview now clarifies that opening the source screen, browsing safely, or refreshing data can mark the screen done.
6. Student overview now confirms the student is done when Student Workspace is opened for checklist, proof, feedback, or approval status.
7. Viewer overview now confirms monitoring is complete when allowed records were checked without changes.
8. Profile now defines done as understood access, named access concern, and next screen choice.
9. Site Dashboard now defines done as confirmed school, owner/source path found, and no summary-only record change.
10. Programs now defines done as checked program list, preserved reason, and untouched account/mentor work.
11. Student Directory now defines done as narrowed list, opened record, and review decision work routed to Review Queue.
12. Student Workspace now defines done as updated checklist row, changed next action, or clear waiting state.
13. Student Final Files now defines done as known package status, protected download handling, or blocker explanation.
14. Mentor Dashboard now defines done as clear focus list, opened assigned student, or meeting route chosen.
15. Assigned Students now defines done as saved meeting history, named follow-up, and separate review ownership.
16. Program Dashboard now defines done as risk path chosen, cohort checked, and decision work left in Review Queue.
17. Review Queue now defines done as saved Program Teacher decision, updated queue, and clear student next step.
18. Mentor Assignments now defines done as saved coverage, visible reason, and reasonable mentor load.
19. Operations now defines done as identified owner, source screen opened for changes, and monitoring complete.
20. Presentation now defines done as updated slot status, narrowed schedule, and untouched review outcomes.
21. Admin Command Center now defines done as routed risk, summary-only monitoring, and protected detail kept in source screens.
22. Readiness now defines done as interpreted report, routed detail, and private proof hidden.
23. Users & Access now defines done as correct access row, ready handoff record, and review trail.
24. Audit now defines done as identified pattern, chosen source screen, and redacted log preserved.
25. Admin Final Files and Account/Security now define done as clear package row, approved protected download, failed-row follow-up, password result, or ended session.

## Twelfth Top 10 Implementation Addendum

Update: this pass closed the remaining concrete student top-ten proof-form gap. The proof forms now answer "what counts as proof for the work item I selected?" using the same requirement descriptions and quality guidance already loaded into the student dashboard.

1. Link and file proof forms now render selected-work proof guides.
2. Guide copy is requirement-aware instead of generic upload help.
3. Requirement descriptions explain what the selected proof should show.
4. Quality guidance becomes "before you attach it" checks when available.
5. Guide facts show phase, status, and next action for the selected work item.
6. Changing the Work item select updates the visible proof guide without a page reload.
7. Focused evidence handoff now updates both proof selectors and their guides.
8. The UI keeps link fallback and upload progress behavior unchanged.
9. Proof receipt styling now uses the existing soft-blue design token.
10. Focused workspace render tests now prove requirement-aware proof guides.

## Thirteenth Top 10 Implementation Addendum

Update: this second GUI/UX pass focused on reducing student scanning after the top guidance layers were already in place. The student workspace now adds a compact panel map before the collapsed secondary sections so students can choose one relevant panel instead of reading every card.

1. Added a student "Where to open next" panel map before the secondary disclosure stack.
2. The map summarizes Checklist, Feedback, Progress, Proof tools, Sent work, and Files and links.
3. Revision states now push Checklist and Feedback to the strongest visual tone.
4. Feedback shows a plain "fix" count instead of making students infer urgency from notes.
5. Proof tools now say when they are useful and when they are still locked by missing work.
6. Sent work now distinguishes waiting-for-review from general started work.
7. Files and links now show proof count and tell students to confirm proof is on the right item.
8. Map buttons reuse the existing accessible disclosure controls and state.
9. Mobile layouts keep the map as a stable grid instead of adding another full-width wall.
10. Focused workspace render tests now prove the map, copy, counts, and disclosure wiring.

## Second-Pass 100 GUI/UX Opportunities

1. Add a student panel map so collapsed sections have obvious entry points.
2. Make the panel map state-aware for revision, waiting review, draft work, and proof status.
3. Show the highest-urgency student panel with a stronger left border.
4. Turn feedback count into action language such as "fix" or "note."
5. Separate proof tools from proof history in the student's first decision surface.
6. Let map buttons reuse disclosure state instead of duplicating navigation.
7. Keep all student panel labels in booklet-friendly language.
8. Make the map mobile-first with stable card heights.
9. Add an open-state indicator to each student map card.
10. Keep the panel map before secondary panels, not after them.
11. Add a staff queue map for Review Queue filters.
12. Add a Program Teacher selected-row checklist summary above the decision form.
13. Move Review Queue proof-missing holds closer to the disabled approval choice.
14. Add a compact "selected row" breadcrumb in the Review Queue side panel.
15. Make comment-only outcomes visually distinct from approval outcomes.
16. Add a "new since last viewed" marker for review rows after URL restore.
17. Add safe keyboard focus return after a review decision saves.
18. Add an "open next proof-ready row" button without adding batch approval.
19. Add row density controls for long review queues.
20. Add a review-panel sticky footer for decision actions on tall screens.
21. Add a mentor panel map for meeting history, student detail, and presentation risk.
22. Put the next mentor question above long student signal grids.
23. Add "regular support" visual calm states for mentors.
24. Show when mentor details are collapsed but contain revision changes.
25. Add mentor meeting form help that changes with meeting purpose.
26. Make meeting-purpose choices look like segmented controls.
27. Add a mentor row "last meeting" time chip.
28. Add a mentor row "Program Teacher owns review" guard badge.
29. Add a mentor empty state that explains what "all caught up" means.
30. Keep mentor student detail actions visually secondary to meeting actions.
31. Add a site dashboard setup progress strip above urgent tiles.
32. Make first-day setup show which item is the next setup blocker.
33. Add a site dashboard "school selected" confirmation near metrics.
34. Add clearer contrast between summary-only metrics and clickable metrics.
35. Add a "source screen" label on every site dashboard drill-down.
36. Add visual grouping for mentor, proof, review, presentation, and final-file blockers.
37. Add a small "who owns this" label to each urgent tile.
38. Add a calm all-clear state for site dashboard when no urgent tile is active.
39. Add a date freshness chip for site dashboard data.
40. Add multi-site switcher helper text only when multiple schools exist.
41. Add Student Directory row density controls for long schools.
42. Keep saved filters visible while scrolling Student Directory results.
43. Add per-row "why shown" text for every saved filter.
44. Make missing mentor rows visually different from missing proof rows.
45. Add a read-only viewer summary at the top of Student Directory.
46. Add active search result count near the search field.
47. Add a "clear search" affordance inside Student Directory.
48. Keep pagination controls visible after long result lists.
49. Add a student-detail tab summary row above tabs.
50. Add a "latest important event" card in student detail summary.
51. Add a proof visibility badge in student detail proof rows.
52. Add staff-only comment counts without exposing private text.
53. Make timeline filters look like tabs instead of form controls.
54. Add a "newest first" label in every timeline.
55. Add empty state differences for no timeline loaded versus no events.
56. Add an Operations panel map for ranked actions, filters, and rows.
57. Put owner and next action in the same visual block for Operations rows.
58. Add a "no mutation here" badge for monitoring-only operations lists.
59. Add Operations filters as chips after form submission.
60. Add package failure guidance close to final-file rows.
61. Add final-file row tone for failed, pending, complete, and expired.
62. Add protected-download caution before final-file download links.
63. Make package status copy student-safe in all staff views.
64. Add a final-file "handoff ready" visual state only when complete.
65. Add a visible retry-not-available explanation for failed package rows.
66. Add Users & Access role cards with smallest-role examples.
67. Add a scope preview before account save.
68. Add setup-password handoff checks next to account creation.
69. Make destructive access removal warnings more compact but harder to miss.
70. Add a current-access summary above account forms.
71. Add field-level helper text only where policy risk is high.
72. Add role/scope mismatch warning before save.
73. Add import-review summary grouped by role and school.
74. Add "no accounts changed yet" state before import submission.
75. Keep one-time setup output visually separate from reusable forms.
76. Add Audit saved-filter cards for common investigations.
77. Add redaction explanation directly above audit rows.
78. Add anomaly summary grouped by account, proof, review, and export.
79. Add "fix in source screen" buttons for audit anomaly cards.
80. Add audit row severity tone without exposing private details.
81. Add session-expired form recovery near the form that failed.
82. Add consistent toast placement for long workspace pages.
83. Add skip links to the active work panel, not only workspace main.
84. Add focus outlines around custom chip buttons.
85. Add visible disabled reasons for every disabled mutation button.
86. Add compact mobile summaries before long card lists.
87. Reduce repeated guide surfaces after users open a specific work panel.
88. Add print styles for student progress without proof URLs.
89. Add a "last saved" line after student proof actions.
90. Add file-type examples next to upload accept rules.
91. Add browser proof for mobile student map layout.
92. Add browser proof for Program Teacher selected-row layout.
93. Add browser proof for mentor dashboard row expansion.
94. Add browser proof for Users & Access warnings.
95. Add visual checks for no-overlap at 360px width.
96. Add contrast checks for warning and danger cards.
97. Split long workspace guide code after UX behavior stabilizes.
98. Add component-level screenshots for the main role panels.
99. Add a weekly UX smoke that reports skipped hosted checks plainly.
100. Keep this audit list tied to route-backed screens and avoid unbacked controls.

## Fourteenth Top 10 Implementation Addendum

Update: this third GUI/UX pass implemented the highest-value mentor-dashboard slice from the second-pass list. Mentors now get a compact action map before scanning assigned-student rows, so they can choose one real next action instead of interpreting metrics, filters, and row cards separately.

1. Added a mentor "Where to help next" action map above mentor filters and the assigned-student row stack.
2. Added a Next conversation card that surfaces the first mentor question before long signal grids.
3. The Next conversation card opens the existing meeting-history/detail path for the focused student.
4. Added a Revision follow-up card that counts revision students and explains the Program Teacher proof comparison.
5. Added a Meeting follow-up card that routes to the existing meeting-due focus filter.
6. Added a Presentation readiness card that routes to the existing presentation-risk focus filter.
7. Added a Regular support card so calm students remain visible without competing with urgent work.
8. The active mentor filter now appears in the map, not only in the filter bar.
9. Collapsed mentor rows now warn when hidden details contain revision changes since the last check-in.
10. Focused workspace render tests now prove the map, active filter state, detail shortcut, and collapsed revision alert.

## Third-Pass 100 GUI/UX Opportunities

1. Add a mentor action map before mentor filters and rows.
2. Put the next mentor question inside the first mentor decision surface.
3. Route the next mentor action to the existing meeting-history path.
4. Give revision follow-up its own count and proof-comparison guidance.
5. Give meeting follow-up its own card and focus route.
6. Give presentation readiness its own card and focus route.
7. Give regular support a calm state so mentors know no urgent action is hidden.
8. Reflect the active mentor filter inside the action map.
9. Warn when collapsed mentor row details contain revision changes.
10. Keep all mentor map controls route-backed or disclosure-backed.
11. Add a row-level "Program Teacher owns approval" guard badge for mentors.
12. Add a mentor "last meaningful update" chip that combines proof, meeting, and presentation dates.
13. Add a mentor row micro-timeline for revision, meeting, and presentation events.
14. Keep the student detail button visually secondary when the meeting path is the better next step.
15. Add a mentor empty state that distinguishes "no students assigned" from "all assigned students are calm."
16. Add meeting-purpose helper copy that changes for revision, presentation, proof, planning, and check-in.
17. Turn meeting-purpose choices into segmented controls.
18. Add a mentor meeting form preview that says what will be saved before submit.
19. Add a "save meeting note" disabled reason when status or notes are incomplete.
20. Add mentor-specific presentation prep cards for assigned students only.
21. Add a Program Teacher review queue map with Submitted, Revision, Missing proof, and History cards.
22. Put selected review-row identity in a sticky compact header while deciding.
23. Add a proof-quality checklist beside the Program Teacher decision form.
24. Add a visual hold state when approval is blocked by missing proof.
25. Add a "decision affects student" preview before Program Teacher save.
26. Add a row marker for review items changed since the reviewer last opened the queue.
27. Add an "open next proof-ready row" action without batch approval.
28. Add a Review Queue density toggle for long lists.
29. Add keyboard focus return after review decision save.
30. Add a mobile review decision footer that keeps the selected row visible.
31. Add a Site Dashboard setup map for Programs, Users, Mentors, Storage, and Students.
32. Show the first missing setup item as the primary Site Dashboard action.
33. Keep current school selection visible near every Site Dashboard metric.
34. Give summary-only tiles a distinct non-clickable visual style.
35. Put owner and source screen on every Site Dashboard urgent tile.
36. Add a "school is calm" Site Dashboard state when no urgent tile is active.
37. Add data freshness chips for Site Dashboard, Operations, and Readiness.
38. Add visual group labels for mentor, proof, review, presentation, and final-file blockers.
39. Add a cross-site context warning when a multi-site user has not selected a school.
40. Add a site-switch confirmation after changing school context.
41. Add a Student Directory action map for Search, Saved filters, Detail, Read-only, and Clear.
42. Keep Student Directory saved filters sticky on long lists.
43. Add "why this row appears" copy for every saved filter.
44. Add row tones for missing mentor, missing proof, revision, presentation, and final-file blockers.
45. Add a compact read-only viewer banner above Student Directory rows.
46. Put active search result count next to the search field.
47. Add a clear-search icon button inside the search control.
48. Keep Student Directory pagination controls available after long result lists.
49. Add mobile row summaries for Student Directory before the full row detail.
50. Add a no-results state that suggests the nearest useful filter reset.
51. Add a student-detail summary map above tabs.
52. Put latest important event above the student-detail timeline.
53. Add proof visibility badges in student-detail proof rows.
54. Add staff-only comment counts without showing private comment bodies.
55. Make timeline filters look like tabs.
56. Add "newest first" labels in every timeline and meeting history.
57. Split empty states for "not loaded yet" and "loaded with no events."
58. Add a detail-tab completion signal when a tab has no next action.
59. Add focus return from detail drawers to the originating row.
60. Add mobile-safe sticky tab labels for student detail.
61. Add an Operations action map for Ranked actions, Presentation, Final files, Proof, and Source screens.
62. Put owner and next action in the same Operations row block.
63. Add a no-mutation badge to monitoring-only Operations rows.
64. Show active Operations filters as removable chips.
65. Keep package failure guidance next to the failed package row.
66. Add final-file row tones for failed, pending, complete, expired, and provider unavailable.
67. Add protected-download caution before staff final-file links.
68. Show "handoff ready" only when a package is complete.
69. Explain when failed package retry is not available from the current screen.
70. Add package-status glossary terms inside admin final-file exports.
71. Add Users & Access role cards with smallest-role examples.
72. Add a scope preview before saving account access.
73. Put setup-password handoff checks beside account creation.
74. Make access-removal warnings compact but visually stronger.
75. Add a current-access summary above every account-management form.
76. Add field-level helper copy only where policy risk is high.
77. Add role/scope mismatch warnings before save.
78. Group import-review summaries by role and school.
79. Add "no accounts changed yet" state before import submission.
80. Keep one-time setup output visually separate from reusable forms.
81. Add Audit saved-filter cards for common investigations.
82. Add redaction explanation directly above audit rows.
83. Group audit anomalies by account, proof, review, export, and session.
84. Add "fix in source screen" buttons for anomaly cards.
85. Add audit severity tones without exposing private detail.
86. Add session-expired recovery near the form that failed.
87. Make toast placement predictable on long workspace pages.
88. Add skip links to the active work panel.
89. Strengthen focus outlines for custom chip and card buttons.
90. Add visible disabled reasons for every disabled mutation button.
91. Add compact mobile summaries before every long card list.
92. Reduce repeated guide surfaces after a user opens a specific work panel.
93. Add print styles for student progress without proof URLs.
94. Add a "last saved" line after proof, meeting, review, and access actions.
95. Add file-type examples next to upload accept rules.
96. Add browser proof for mentor action map at desktop and mobile widths.
97. Add browser proof for Program Teacher selected-row layout.
98. Add browser proof for Users & Access warnings.
99. Add no-overlap visual checks at 360px width.
100. Keep every UX improvement tied to a route-backed screen, existing action, or tested disclosure state.

## Fifteenth Top 10 Implementation Addendum

Update: this fourth GUI/UX pass implemented the highest-value Program Teacher Review Queue slice. The queue now has a compact lane map before filters, and the selected decision panel gives a clearer selected-row summary, proof-quality checklist, and inline missing-proof hold right beside the disabled approval action.

1. Added a Review Queue "Where to review next" action map before filters and rows.
2. Added a Submitted decisions lane that routes to the existing submitted-work preset.
3. Added a Proof-ready lane that routes to the existing proof-attached review preset.
4. Added a Missing proof lane that explains approval stays locked until proof appears.
5. Added a Revision follow-up lane that separates student-owned revision work from new decisions.
6. Added a High risk lane that routes to the existing high-risk review preset.
7. The active queue lane is now tracked in the map from current filters.
8. Selected review panels now show a compact selected-row summary with version, status, proof, reviews, and comments.
9. Selected review panels now show a proof-quality checklist before the decision checklist.
10. Missing-proof decisions now repeat the hold directly beside the disabled approval button.

## Fourth-Pass 100 GUI/UX Opportunities

1. Add a Review Queue lane map before filters and rows.
2. Make Submitted decisions a distinct lane from revision follow-up.
3. Make Proof-ready a distinct lane from any attached-proof context.
4. Make Missing proof explain the approval lock before row selection.
5. Make Revision follow-up student-owned until a submitted revision appears.
6. Make High risk a distinct lane that still uses existing review filters.
7. Reflect the active review lane inside the queue map.
8. Add a selected-row summary in the right review panel.
9. Show proof, review, and comment counts in the selected-row summary.
10. Put proof-quality checks before the decision checklist.
11. Repeat missing-proof hold next to disabled approval.
12. Add a compact selected-row breadcrumb that remains visible while scrolling the decision panel.
13. Add row density controls for long Review Queues.
14. Add a selected-row sticky footer for approval, revision, and comment-only actions.
15. Add focus return to the selected row after saving a decision.
16. Add "new since last opened" markers for rows restored from URL state.
17. Add a next-proof-ready-row action without batch approval.
18. Add a visible difference between comment-only and status-changing decisions.
19. Add a warning when feedback text is too vague for a revision request.
20. Add examples of good approval and revision feedback below the textarea.
21. Add a Program Teacher dashboard action map for Review, Revision, Missing proof, and Students.
22. Add Program Teacher workload grouping by program and cohort.
23. Add a "manual gate" badge wherever approval affects the student phase.
24. Add a proof visibility badge in each Review Queue row.
25. Add a review-history "latest decision" chip to rows.
26. Add a row-level "why high risk" chip with short cause text.
27. Add a read-only reviewer action map that avoids mutation language.
28. Add a queue-empty state that points to the nearest useful source screen.
29. Add a queue share-link confirmation after copying.
30. Add a compact mobile header for selected review rows.
31. Add a student-detail review tab summary map.
32. Add latest Program Teacher decision above student-detail history.
33. Add proof-to-requirement match badges in student detail.
34. Add private-proof visibility copy beside proof rows.
35. Add timeline filter tabs for review history.
36. Add "newest first" labels in review history and comments.
37. Add student-visible versus staff-only note grouping in detail.
38. Add a no-history state that tells reviewers how to write a first decision.
39. Add focus return from student detail drawer to selected review row.
40. Add mobile-safe detail drawer tab labels.
41. Add a Site Dashboard action map for Setup, Review, Mentors, Proof, and Final files.
42. Add a first missing setup item above Site Dashboard urgent tiles.
43. Add owner/source labels to all Site Dashboard urgent tiles.
44. Add current-school confirmation beside every Site Dashboard metric.
45. Add a calm all-clear Site Dashboard state.
46. Add data freshness chips for Site Dashboard and Review Queue.
47. Add visual grouping for proof, review, mentor, presentation, and final-file blockers.
48. Add a warning when multi-site staff have no current school selected.
49. Add a site-switch confirmation after changing school context.
50. Add route-backed "fix in source screen" buttons for dashboard anomalies.
51. Add Student Directory saved-filter map.
52. Keep Student Directory saved filters sticky on long lists.
53. Add "why shown" text for every saved filter.
54. Add row tones for missing mentor, missing proof, revision, presentation, and final-file blockers.
55. Add a compact viewer banner above read-only directory rows.
56. Add active search result count beside directory search.
57. Add clear-search icon button inside the search field.
58. Keep directory pagination visible after long result lists.
59. Add mobile row summaries before full detail actions.
60. Add no-results suggestions based on the active filter.
61. Add an Operations lane map for Ranked actions, Presentation, Final files, Proof, and Source screens.
62. Put owner and next action in the same Operations row block.
63. Add no-mutation badges to monitoring-only rows.
64. Show active Operations filters as removable chips.
65. Keep final-file failure guidance next to failed package rows.
66. Add final-file tones for failed, pending, complete, expired, and provider unavailable.
67. Add protected-download caution before staff final-file links.
68. Show handoff-ready only when package status is complete.
69. Explain when failed package retry is not available from the current screen.
70. Add package-status glossary terms in admin final-file exports.
71. Add Users & Access role cards with smallest-role examples.
72. Add scope preview before saving account access.
73. Add setup-password handoff checks beside account creation.
74. Make access-removal warnings compact but visually stronger.
75. Add current-access summaries above account forms.
76. Add field helper copy only where policy risk is high.
77. Add role/scope mismatch warnings before save.
78. Group import-review summaries by role and school.
79. Add "no accounts changed yet" state before import submission.
80. Separate one-time setup output from reusable account forms.
81. Add Audit saved-filter cards for common investigations.
82. Put redaction explanation directly above audit rows.
83. Group audit anomalies by account, proof, review, export, and session.
84. Add source-screen fix buttons for anomaly cards.
85. Add audit severity tones without private details.
86. Add session-expired recovery near the form that failed.
87. Make toast placement predictable on long workspace pages.
88. Add skip links to the active work panel.
89. Strengthen focus outlines for custom chip and card buttons.
90. Add visible disabled reasons for every disabled mutation button.
91. Add compact mobile summaries before long card lists.
92. Reduce repeated guide surfaces after a user opens a specific work panel.
93. Add print styles for student progress without proof URLs.
94. Add a last-saved line after proof, meeting, review, and access actions.
95. Add file-type examples next to upload accept rules.
96. Add desktop and mobile browser proof for the Review Queue lane map.
97. Add browser proof for Program Teacher selected-row layout.
98. Add browser proof for Users & Access warnings.
99. Add no-overlap visual checks at 360px width.
100. Keep every UX improvement tied to existing routes, real data, or tested disclosure state.

## Sixteenth Top 10 Implementation Addendum

Update: this fifth GUI/UX pass implemented the highest-value Site Dashboard slice from the prior opportunity list. The dashboard now gives School Admins and monitoring users a compact action map before raw metric tiles, so they can pick one owner lane, confirm the current school, and route into the correct source screen without expanding dense details first.

1. Added a Site Dashboard "Where to start at this school" action map.
2. Added current-school confirmation directly in the action map header.
3. Added a Setup lane that names the first setup gap instead of making staff infer it.
4. Added owner labels for School Admin, Site staff, Program Teacher, student/reviewer, operations, and the school team.
5. Added a Mentor coverage lane that routes to the existing mentor-assignment or missing-mentor worklist.
6. Added a Review work lane that routes to submitted or revision Review Queue presets.
7. Added a Proof blockers lane that keeps private proof summary-safe and routes high-risk follow-up to the student list.
8. Added an Operations lane that chooses failed final-file exports before presentation follow-up.
9. Added an all-clear/return-here lane so staff know when to stop expanding details and resume routine follow-up.
10. Added focused Site Dashboard render coverage for the action map, counts, owner copy, and route-backed buttons.

## Fifth-Pass 100 GUI/UX Opportunities

1. Add a Site Dashboard action map before raw metric tiles.
2. Confirm the current school directly in the Site Dashboard action map.
3. Show the first setup gap above broad dashboard details.
4. Add owner labels to each Site Dashboard action lane.
5. Add a mentor-coverage lane that routes to existing assignment filters.
6. Add a review-work lane that routes to existing Review Queue filters.
7. Add a proof-blocker lane that avoids exposing private proof files.
8. Add an operations lane that prioritizes failed exports before routine presentation work.
9. Add an all-clear lane for routine follow-up after blockers are handled.
10. Test Site Dashboard action lanes against real route presets.
11. Add a data-freshness chip beside the Site Dashboard action map.
12. Add a "last refreshed" label to each dashboard summary group.
13. Add a current-school badge beside every Site Dashboard metric tile.
14. Add a site-switch confirmation after changing selected school context.
15. Show which metrics are school-scoped versus program-scoped.
16. Add a one-click return from source screens back to the Site Dashboard action map.
17. Persist the last opened Site Dashboard owner lane in URL state.
18. Collapse the first-day checklist after every item is ready.
19. Show only the first unresolved first-day checklist item by default.
20. Add a read-only variant of the Site Dashboard action map with monitoring language.
21. Add an "assigned staff to notify" hint to read-only dashboard lanes.
22. Add compact empty states for each Site Dashboard action lane.
23. Add color-neutral "all clear" states to mentor, review, proof, and operations lanes.
24. Add source labels to every metric tile, not only action-map lanes.
25. Add a "why this count matters" tooltip to No Mentor and Final Files metrics.
26. Add keyboard focus order proof from action map to source buttons.
27. Add mobile screenshot proof for the Site Dashboard action map.
28. Add no-overlap checks for action-map cards at 360px width.
29. Add a short site dashboard glossary for "Submitted", "Needs Revision", and "Final Files".
30. Move low-frequency detail panels behind more specific disclosure groups.
31. Add a "Review Queue source" badge on review-related dashboard rows.
32. Add a "Mentor Assignments source" badge on missing-mentor rows.
33. Add an "Operations source" badge on final-file and presentation rows.
34. Add proof privacy copy beside any proof-related dashboard count.
35. Add risk-reason chips to the top-risk student summary.
36. Add a "view only assigned school" reminder for multi-site staff.
37. Add a "current school locked" reminder for single-site staff.
38. Add a route-backed "students in this program" action from program summary rows.
39. Add stale-activity warning thresholds to dashboard action lanes.
40. Add a dashboard "print summary" layout that excludes private proof details.
41. Add a Site Dashboard guided-tour state for first-time School Admins.
42. Add a "hide guidance after source screen opened" preference.
43. Add persistent lane ordering based on urgency.
44. Add a small legend that explains lane colors without relying on color alone.
45. Add high-contrast focus outlines for action-map cards and buttons.
46. Add skip links from the top of the dashboard to action map, metrics, and details.
47. Add compact landmark labels for screen readers on dashboard groups.
48. Add aria-live confirmation after routing from dashboard lanes.
49. Add disabled reasons when a lane cannot open a source screen.
50. Add a "tell assigned staff" fallback for dashboard lanes without permission.
51. Add an operations sublane for provider-unavailable storage setup.
52. Add an operations sublane for expiring final-file packages.
53. Add an operations sublane for expired final-file packages.
54. Add a presentation sublane for ready-for-checkout work.
55. Add a presentation sublane for day-of check-in work.
56. Add a proof sublane for missing proof versus unclear proof.
57. Add a review sublane for submitted work with proof attached.
58. Add a review sublane for revisions waiting on student action.
59. Add a mentor sublane for overloaded mentors.
60. Add a mentor sublane for students with no recent meeting.
61. Add a setup sublane for missing Program Teacher access.
62. Add a setup sublane for missing program mapping.
63. Add a setup sublane for no active students.
64. Add a setup sublane for missing site assignment.
65. Add dashboard actions that preserve selected-site query parameters across every source screen.
66. Add a "copy school dashboard link" confirmation.
67. Add a "recently changed counts" highlight after refresh.
68. Add shimmer-free loading skeletons for dashboard cards.
69. Add a calm offline/unavailable state for dashboard route failures.
70. Add clearer distinction between summary-only counts and source-screen rows.
71. Add a viewer-safe "what you cannot change here" banner.
72. Add School Admin-specific wording that avoids global-admin security language.
73. Add Program Teacher-specific wording when a Program Teacher opens site-level review signals.
74. Add mentor-safe wording when mentor-related counts appear outside Mentor Dashboard.
75. Add proof-file privacy warnings before any staff detail drilldown.
76. Add browser proof for read-only Site Dashboard action-map rendering.
77. Add browser proof for School Admin Site Dashboard action-map rendering.
78. Add browser proof for multi-site selection then Site Dashboard action map.
79. Add browser proof for action-map route buttons changing URL state.
80. Add a Playwright pixel check for non-overlapping dashboard action-map cards.
81. Add a regression test for all-clear Site Dashboard fixtures.
82. Add a regression test for no-program setup fixtures.
83. Add a regression test for no-active-students setup fixtures.
84. Add a regression test for read-only lanes falling back to student monitoring routes.
85. Add a regression test for source buttons hidden by unavailable sections.
86. Add a regression test for high-risk proof lane routing.
87. Add a regression test for presentation-only operations routing.
88. Add a regression test for archive-failed operations routing.
89. Add a regression test for mentor-assignment fallback to Student Directory.
90. Add a regression test for Program Teacher coverage setup gaps.
91. Add an admin dashboard action map for tenant-wide risk.
92. Add an Audit action map for account, proof, review, export, and session anomalies.
93. Add a Users & Access action map for create, import, scope review, and removal.
94. Add a Student Directory saved-filter map for missing mentor, missing proof, revisions, and operations.
95. Add an Operations action map for ranked actions, presentation, archive, proof, and source rows.
96. Add a Readiness report action map for aggregate-only follow-up.
97. Add a Security/Account action map for password, sessions, and support.
98. Add consistent "owner / source / next action" micro-layouts across every operational dashboard.
99. Add a dashboard UX checklist to the verifier scripts for route-backed actions.
100. Keep every dashboard improvement tied to existing routes, scoped permissions, real data, and focused tests.

## Seventeenth Top 10 Implementation Addendum

Update: this sixth GUI/UX pass implemented the highest-value Operations slice. The Operations screen now has a lane map before KPI decks, filters, ranked actions, and long worklists, so site staff can choose one owner/source lane before scanning every operational record.

1. Added an Operations "Work one operations lane first" map before summary KPIs.
2. Added a failed final-files lane that routes to the existing `archive-failed` Operations preset.
3. Added a storage setup lane that routes to the existing `archive-provider-unavailable` preset.
4. Added a proof lane that routes to the existing `evidence-missing` preset.
5. Added a presentation lane that chooses the existing presentation attention or pending preset.
6. Added a ranked staff-action lane that routes to the existing `needs-attention` preset.
7. Added a source-screens return lane that helps staff come back after one blocker instead of scanning every row.
8. Added owner labels for Site Admin, Program Teacher/site staff, student + Program Teacher, assigned staff, and the school team.
9. Added current school/year context inside the Operations map header.
10. Added focused Operations render coverage for lane counts, owner copy, source labels, and route-backed buttons.

## Sixth-Pass 100 GUI/UX Opportunities

1. Add an Operations lane map before KPIs and filters.
2. Put failed final-file exports in the first Operations lane.
3. Put storage-provider setup blockers in their own Operations lane.
4. Separate missing proof from general staff-action rows.
5. Separate presentation schedule, outline, and check-in follow-up from final-file work.
6. Add an assigned-staff lane for high-risk and blocked readiness rows.
7. Add a return-here lane after working one filtered Operations source.
8. Put current school/year context in the Operations lane map.
9. Add owner labels to every Operations lane.
10. Test Operations lane-map counts and route-backed buttons.
11. Add active-lane highlighting when Operations filters match a lane.
12. Add a clear-lane button that resets Operations filters.
13. Add a lane-empty all-clear card for failed final files.
14. Add a lane-empty all-clear card for storage setup.
15. Add a lane-empty all-clear card for missing proof.
16. Add a lane-empty all-clear card for presentation follow-up.
17. Add a lane-empty all-clear card for high-risk readiness rows.
18. Add Operations all-clear copy that distinguishes no blockers from no records.
19. Add "why this lane is first" copy based on severity rank.
20. Add a small severity legend for Operations lane colors.
21. Add keyboard focus proof for Operations lane buttons.
22. Add mobile screenshot proof for Operations lane cards.
23. Add no-overlap checks for Operations at 360px.
24. Add screen-reader landmark labels for Operations lane groups.
25. Add aria-live confirmation after applying an Operations lane preset.
26. Add source badges inside Operations KPI cards.
27. Add source badges inside Operations blocker bars.
28. Add "summary only" explanations when Operations buttons are unavailable.
29. Add read-only wording variants for Operations lanes.
30. Add Program Teacher wording variants for Operations lanes.
31. Add viewer wording variants for Operations lanes.
32. Add owner/source/next-action micro-layout to Operations active filter chips.
33. Add removable filter chips for each Operations active filter.
34. Add a "copy this Operations view" confirmation.
35. Add stale-link recovery when an Operations URL filter no longer returns rows.
36. Add one-click "open student directory with same blocker" from Operations empty states.
37. Add one-click "open Review Queue with same proof blocker" from Operations proof rows.
38. Add one-click "open Mentor Assignments" from no-mentor Operations rows.
39. Add one-click "open Final Files" from archive failed rows.
40. Add one-click "open Presentation" from presentation readiness rows.
41. Add row-level source labels for Archive, Presentation, Evidence, Review, Mentor, and Risk.
42. Add row-level "why shown" copy for each Operations worklist row.
43. Add row tones for failed, provider unavailable, expired, expiring soon, missing proof, and attention required.
44. Add a sticky Operations filter summary on long worklists.
45. Add a compact mobile row summary before full Operations row detail.
46. Add pagination context that says whether the next page has higher or lower priority rows.
47. Add a no-results suggestion tailored to archive filters.
48. Add a no-results suggestion tailored to presentation filters.
49. Add a no-results suggestion tailored to proof filters.
50. Add a no-results suggestion tailored to risk filters.
51. Add a protected-download caution near completed archive rows.
52. Add "download window ending" emphasis for expiring final-file rows.
53. Add "expired window" guidance that avoids promising downloads.
54. Add storage setup preflight copy before provider-unavailable rows.
55. Add staff-only versus student-visible status distinctions in final-file rows.
56. Add proof privacy copy before any Operations student-detail drawer.
57. Add student-detail return breadcrumbs from Operations.
58. Add focus return from student detail back to the originating Operations row.
59. Add row count by owner above the Operations worklist.
60. Add row count by source above the Operations worklist.
61. Add row count by severity above the Operations worklist.
62. Add a density toggle for long Operations worklists.
63. Add "new since last opened" markers for Operations rows restored from URL state.
64. Add "last refreshed" timestamp to Operations data.
65. Add data freshness warning when Operations generatedAt is stale.
66. Add a safe print layout for Operations without proof links or storage identifiers.
67. Add a handoff summary for Site Admins to share with Program Teachers.
68. Add a handoff summary for Program Teachers to share with site staff.
69. Add a handoff summary for viewers that avoids mutation language.
70. Add consistent language for "final files" instead of mixed archive/export terms.
71. Add glossary popovers for provider unavailable, failed, expired, and expiring soon.
72. Add glossary popovers for outline pending and attention required.
73. Add a "do not change from summary" warning beside ranked actions.
74. Add "student owns this" labels for proof and revision blockers.
75. Add "staff owns this" labels for storage and final-file blockers.
76. Add "Program Teacher owns this" labels for proof review and presentation readiness.
77. Add "Site Admin owns this" labels for storage and account blockers.
78. Add operation-source filter shortcuts to the Site Dashboard action map.
79. Add operation-source filter shortcuts to the Admin Dashboard.
80. Add Operations blockers to Users & Access preflight when account work blocks source rows.
81. Add Operations blockers to readiness report drilldowns without exposing private proof.
82. Add Operations blocker counts to Program Dashboard in assigned-scope language.
83. Add Operations blocker counts to Mentor Dashboard only when mentor action is expected.
84. Add Operations blocker counts to Student Directory saved-filter cards.
85. Add a guided first-run Operations path for new Site Admins.
86. Add dismissible guidance once a user opens a lane twice.
87. Add a preference to keep Operations details collapsed by default.
88. Add a preference to keep active filters visible on reload.
89. Add browser proof for Site Admin Operations lane map.
90. Add browser proof for Program Teacher Operations lane map.
91. Add browser proof for read-only Operations lane map.
92. Add browser proof for lane preset buttons changing URL state.
93. Add verifier coverage for Operations lane-map preset buttons.
94. Add verifier coverage for Operations owner labels.
95. Add verifier coverage for Operations source labels.
96. Add fixture coverage for all-clear Operations.
97. Add fixture coverage for storage-only Operations blockers.
98. Add fixture coverage for presentation-only Operations blockers.
99. Add fixture coverage for proof-only Operations blockers.
100. Keep Operations UX improvements tied to existing filters, scoped permissions, and protected student detail.

## Eighteenth Top 10 Implementation Addendum

Update: this seventh GUI/UX pass implemented the highest-value Users & Access slice. The screen now gives account staff a compact access action map before account creation, assignment forms, history disclosures, and removal controls, so they can confirm scope, role size, current access, setup handoff, and removal impact before changing a person's access.

1. Added a Users & Access "Do one safe access step first" action map before the account form.
2. Added a current-school card that confirms the active school/year and routes to the existing Site Dashboard.
3. Added a smallest-role card that shows available role count and focuses the role/account creation form.
4. Added a current-access card that shows active scoped grants and focuses the access summary.
5. Added an account-setup card that focuses the account preflight before any setup-password handoff.
6. Added a school-grants card that counts available assignment forms and focuses the assignment controls.
7. Added a removal-safety card that counts removable rows and focuses the removal warning before destructive access changes.
8. Added an access-history card that opens the existing access-history disclosure instead of adding another history surface.
9. Added a role-history card that opens the existing role-assignment disclosure for global and scoped grants.
10. Added focused Users & Access render coverage for map copy, counts, shortcut wiring, disclosure wiring, and route-backed actions.

## Seventh-Pass 100 GUI/UX Opportunities

1. Add a Users & Access action map before account creation and assignment forms.
2. Confirm the active school/year inside the Users & Access action map.
3. Show role-option count before the role picker.
4. Make the smallest-role decision the first role-related card.
5. Show active scoped access count before any new assignment.
6. Focus the current access summary from the action map.
7. Focus the account preflight from the account-setup card.
8. Count available assignment forms before the forms section.
9. Focus assignment forms from the action map.
10. Count removable rows before the removal warning.
11. Focus the removal warning from the action map.
12. Open access history from the action map.
13. Open role assignment history from the action map.
14. Add focused render tests for Users & Access map counts and shortcuts.
15. Add keyboard focus proof for Users & Access shortcut buttons.
16. Add browser screenshot proof for the Users & Access action map.
17. Add mobile screenshot proof for Users & Access action-map wrapping.
18. Add all-clear copy when no active access assignments exist.
19. Add all-clear copy when no accounts are removable.
20. Add role-safe map wording for School Admins.
21. Add role-safe map wording for Program Teachers.
22. Add role-safe map wording for read-only viewers.
23. Add a warning card when no current school is selected.
24. Add a route-backed "choose school" action when no current school is selected.
25. Add current-school mismatch warnings when an account belongs to another site.
26. Add "student work is not deleted" copy beside every remove button.
27. Add "school access only" copy beside assignment removal rows.
28. Add a protected-current-user row state for the signed-in account.
29. Add a protected-last-admin row state when backend data exposes that condition.
30. Add row-level owner labels to active mentor, viewer, Program Teacher, School Admin, and Site Admin grants.
31. Add row-level source labels for account creation versus assignment grant.
32. Add row-level "why shown" text in current access tables.
33. Add role description popovers for Student, Mentor, Viewer, Program Teacher, School Admin, Site Admin, and Global Admin.
34. Add "broad access" warnings for Site Admin and Global Admin picks.
35. Add "program-scoped" explanation beside Program Teacher picks.
36. Add "viewer cannot edit" explanation beside Viewer picks.
37. Add "mentor coverage" explanation beside Mentor picks.
38. Add role-picker grouping by student-facing, staff support, program, school, and platform access.
39. Add active chosen-role summary after quick-pick selection.
40. Add a clear selected-role quick action.
41. Add setup-password handoff checklist as a compact sticky summary near submit.
42. Add delivery method reminder once the local account option is selected.
43. Add SSO disabled explanation in the auth-method area.
44. Add account lifecycle state badges to the account table.
45. Add "pending reset" next-step copy next to pending accounts.
46. Add "active local account" next-step copy next to active accounts.
47. Add "invite not sent from this app" copy next to invite email fields.
48. Add duplicate-email recovery copy in the form area before submit.
49. Add role/scope mismatch recovery copy before submit.
50. Add current-site student count context near student role assignment.
51. Add mentor coverage count context near mentor assignment.
52. Add viewer coverage count context near viewer assignment.
53. Add Program Teacher program count context near Program Teacher assignment.
54. Add School Admin site count context near School Admin assignment.
55. Add Site Admin site count context near Site Admin assignment.
56. Add "this form changes school access" labels above scoped assignment forms.
57. Add "this form creates sign-in access" label above account creation.
58. Add "this form does not notify the user" warning near account creation.
59. Add "this button removes access, not data" labels near removal forms.
60. Add row grouping by students, support staff, program staff, and admins.
61. Add row sorting by highest-risk access first.
62. Add filter chips for role type in the account table.
63. Add filter chips for active, pending reset, and inactive account states.
64. Add filter chips for current school, other school, and global scope when backend data allows it.
65. Add a saved "needs setup handoff" view for account staff.
66. Add a saved "broad roles" review view for admins.
67. Add a saved "recently changed" view for access audits.
68. Add a "copy this access view" action for support handoff.
69. Add a print-safe access summary with no temporary passwords.
70. Add privacy copy that one-time setup passwords are shown only once.
71. Add visual separation between one-time passwords and normal account rows.
72. Add a forced "copy password" success confirmation if clipboard support exists.
73. Add a manual-copy fallback when clipboard support is unavailable.
74. Add "temporary password hidden after navigation" warning to the result panel.
75. Add a before-leaving warning when a one-time password result is still visible.
76. Add row-level audit-note previews in recent access history.
77. Add actor and timestamp emphasis in access history.
78. Add role-history grouping by global, site, program, and cohort scope.
79. Add a history empty state that says no grants were recorded in this scope.
80. Add history filters for assigned, removed, and updated actions when available.
81. Add support for deep-linking directly to access history.
82. Add support for deep-linking directly to role history.
83. Add support for deep-linking directly to removal warning.
84. Add support for deep-linking directly to account preflight.
85. Add URL-state restoration for Users & Access focus targets.
86. Add focus-return after toggling access-history disclosures.
87. Add focus-return after account creation result appears.
88. Add focus-return after assignment save result appears.
89. Add inline success summary after a grant is assigned.
90. Add inline success summary after a grant is removed.
91. Add inline error recovery near the exact failed assignment form.
92. Add inline error recovery near the exact failed removal form.
93. Add inline error recovery near the exact failed account form.
94. Add verifier coverage for Users & Access action-map shortcuts.
95. Add verifier coverage for role-safe Users & Access routes.
96. Add fixture coverage for no current school in Users & Access.
97. Add fixture coverage for school admin with no removable rows.
98. Add fixture coverage for Program Teacher with one assignment form.
99. Add fixture coverage for global admin role history with mixed scopes.
100. Keep Users & Access UX improvements tied to scoped permissions, real assignment data, and tested route/disclosure actions.

## Nineteenth Top 10 Implementation Addendum

Update: this eighth GUI/UX pass implemented the highest-value Audit slice. The Audit screen now gives global admins a redacted action map before saved filters, anomaly cards, security proof, and recent rows, so they can choose one investigation lane without exposing private notes, proof links, tokens, or storage identifiers.

1. Added an Audit "Choose one redacted audit lane" action map above saved filters.
2. Added a recent-activity lane that clears filters and shows the latest redacted log.
3. Added a denied-access lane that counts access denials and routes to protected-record denial filters.
4. Added a proof-storage lane that separates provider failures from student upload mistakes.
5. Added a blocked-proof lane that counts unsafe file/link blocks and opens the matching redacted audit filter.
6. Added a review-decisions lane that counts review and review-queue audit rows without opening private proof.
7. Added an account-changes lane that separates user, role, access, and reset work from general audit activity.
8. Added export-failure and provider-setup lanes for final-file handoff risk.
9. Added a session-pressure summary lane for sign-in support/security triage without fake actions.
10. Added focused Audit render coverage for lane counts, owners, active filter state, and route-backed audit buttons.

## Eighth-Pass 100 GUI/UX Opportunities

1. Add an Audit action map before saved filters and anomaly panels.
2. Put recent protected activity in the first Audit lane.
3. Add a denied-access lane for protected-record denials.
4. Add a proof-storage lane for provider failures.
5. Add a blocked-proof lane for unsafe file and link attempts.
6. Add a review-decisions lane for Program Teacher decision rows.
7. Add an account-changes lane for account, role, access, and reset work.
8. Add an export-failure lane for final-file handoff risk.
9. Add a provider-setup lane for storage unavailable rows.
10. Add a session-pressure summary lane without fake actions.
11. Show the active audit filter in the action-map header.
12. Mark the currently viewed audit lane visually.
13. Count lanes from currently loaded redacted audit rows.
14. Route every actionable Audit lane through existing audit filter buttons.
15. Keep non-actionable Audit summary lanes visibly non-clickable.
16. Add keyboard focus proof for Audit lane buttons.
17. Add mobile screenshot proof for Audit lane cards.
18. Add no-overlap checks for Audit at 360px.
19. Add screen-reader labels for the Audit action map.
20. Add "fix in source screen" hints to every Audit lane.
21. Add source-screen chips for Users & Access, Operations, Final Files, Review Queue, and Security.
22. Add all-clear copy when denied-access count is zero.
23. Add all-clear copy when proof-storage count is zero.
24. Add all-clear copy when blocked-proof count is zero.
25. Add all-clear copy when export-failure count is zero.
26. Add severity ordering for Audit lanes with active signals.
27. Add a compact active-signal count in the Audit hero.
28. Add "redacted by design" copy near every Audit row list.
29. Add "private proof stays out of Audit" copy near review lanes.
30. Add "do not reset from Audit" copy near account lanes.
31. Add "confirm scope first" copy near denied-access lanes.
32. Add "do not ask student to retry until storage is checked" copy near proof-storage lanes.
33. Add "student help or security escalation" copy near blocked-proof lanes.
34. Add "package not ready until complete" copy near export lanes.
35. Add row-level owner labels inside Recent Audit rows.
36. Add row-level source labels inside Recent Audit rows.
37. Add row-level next-action hints inside Recent Audit rows.
38. Add a compact filter summary that names action and entity type separately.
39. Add removable filter chips for action and entity type.
40. Add a one-click copy for the current redacted Audit view.
41. Add stale-link recovery when an Audit URL filter returns no rows.
42. Add no-results guidance tailored to denied-access filters.
43. Add no-results guidance tailored to upload-failure filters.
44. Add no-results guidance tailored to blocked-file filters.
45. Add no-results guidance tailored to proof-link filters.
46. Add no-results guidance tailored to review-decision filters.
47. Add no-results guidance tailored to account-change filters.
48. Add no-results guidance tailored to export-failure filters.
49. Add no-results guidance tailored to provider-setup filters.
50. Add audit event freshness timestamp in the Audit header.
51. Add stale-data warning when audit generatedAt is old.
52. Add day/time grouping for Recent Audit rows.
53. Add actor grouping for Recent Audit rows without exposing private metadata.
54. Add entity-type grouping for Recent Audit rows.
55. Add action-family grouping for Recent Audit rows.
56. Add density toggle for long Audit row lists.
57. Add page-size control for global admins with large logs.
58. Add Audit pagination state to shareable URLs.
59. Add Audit filter restoration tests for every saved filter.
60. Add Audit verifier coverage for action-map route-backed buttons.
61. Add Audit verifier coverage for summary-only lanes.
62. Add fixture coverage for denied-access-heavy audit rows.
63. Add fixture coverage for storage-failure-heavy audit rows.
64. Add fixture coverage for blocked-proof-heavy audit rows.
65. Add fixture coverage for review-decision-heavy audit rows.
66. Add fixture coverage for account-change-heavy audit rows.
67. Add fixture coverage for export-failure-heavy audit rows.
68. Add fixture coverage for provider-setup-heavy audit rows.
69. Add fixture coverage for login-pressure audit rows.
70. Add mixed-severity fixture coverage for lane ordering.
71. Add zero-row Audit map coverage.
72. Add filtered-zero-row Audit map coverage.
73. Add global-admin-only browser proof for Audit.
74. Add permission-denied browser proof for non-global audit attempts.
75. Add source-screen return breadcrumbs from Audit to Admin Command Center.
76. Add source-screen return breadcrumbs from Audit to Users & Access.
77. Add source-screen return breadcrumbs from Audit to Final Files.
78. Add source-screen return breadcrumbs from Audit to Operations.
79. Add source-screen return breadcrumbs from Audit to Review Queue.
80. Add "open source screen" buttons only when the role can open that source.
81. Add redacted row previews for audit events that hide notes and tokens.
82. Add audit-row privacy tests for setup-password and Drive identifier strings.
83. Add audit-row privacy tests for proof URL strings.
84. Add audit-row privacy tests for private student note strings.
85. Add audit-row privacy tests for auth token strings.
86. Add a print-safe redacted Audit summary.
87. Add a handoff summary for access admins.
88. Add a handoff summary for storage admins.
89. Add a handoff summary for Program Teacher leads.
90. Add a handoff summary for Site Admin final-file work.
91. Add a handoff summary for account support.
92. Add alert copy for repeated denied access by the same actor.
93. Add alert copy for repeated blocked proof by the same student.
94. Add alert copy for repeated export failures on the same package.
95. Add alert copy for repeated provider setup blockers.
96. Add "do not broaden access from Audit alone" guardrail.
97. Add "do not promise final-file readiness from Audit alone" guardrail.
98. Add "do not expose private proof during audit review" guardrail.
99. Add "audit proves activity but source screens fix work" reminder.
100. Keep Audit UX improvements tied to existing redacted data, route-backed filters, and global-admin-only permissions.

## Twentieth Top 10 Implementation Addendum

Update: this ninth GUI/UX pass implemented the highest-value Student Directory saved-filter map slice. The Student Directory now presents a ten-lane action map before the saved filters, manual filter form, result summary, detail panel, and rows, so staff can choose the roster slice that matches the next real staff move.

1. Added an All students lane that marks the default unfiltered roster as the current view.
2. Added a Missing mentor lane with owner copy for Site Admin or Program Teacher follow-up.
3. Added a Missing proof lane that routes to the existing missing-evidence directory filter.
4. Added a Review needed lane that routes to review-status filtering instead of asking staff to infer from generic submitted counts.
5. Added a Revision follow-up lane for students with requested changes.
6. Added a High risk lane for outreach triage.
7. Added a Mentor meeting lane for missing or follow-up mentor meeting records.
8. Added a Presentation lane for pending presentation readiness.
9. Added a Final files ready lane for closeout candidates.
10. Added a Final files blocked lane for archive/export blockers, plus focused render and route-active-state test coverage.

## Ninth-Pass 100 GUI/UX Opportunities

1. Add a ten-lane Student Directory action map before saved filters.
2. Mark the unfiltered roster as a visible "All students" lane.
3. Add a Missing mentor lane with owner and next-step copy.
4. Add a Missing proof lane with proof-specific language.
5. Add a Review needed lane that uses reviewStatus instead of vague submitted copy.
6. Add a Revision follow-up lane for requested changes.
7. Add a High risk lane for outreach triage.
8. Add a Mentor meeting lane for missing or stale meeting records.
9. Add a Presentation lane for pending presentation readiness.
10. Add Final files ready and blocked closeout lanes.
11. Show the current Student Directory lane with a clear active state.
12. Set aria-pressed on active directory action buttons.
13. Count lane cards from summary data when available.
14. Fall back to visible-row counts when summary keys are missing.
15. Keep every lane route-backed through existing Student Directory presets.
16. Add map coverage to the main Student Directory render test.
17. Add active-lane coverage after applying a route-backed preset.
18. Add browser smoke coverage for the action map on localhost.
19. Add mobile screenshot proof for the action map at phone width.
20. Add no-overlap checks for action cards with long owner labels.
21. Add sticky saved filters after the action map for long result lists.
22. Add a compact "current lane" chip in the directory hero.
23. Add a "clear to all students" action inside the active-filter summary.
24. Add removable active-filter chips for status, proof, review, risk, presentation, and archive.
25. Add a direct Review Queue button beside the Review needed lane for Program Teachers.
26. Add a Mentor Assignments button beside the Missing mentor lane when the role can manage assignments.
27. Add an Operations button beside final-file blocked rows when the role can open Operations.
28. Add role-specific read-only map copy for viewers.
29. Add "you can view but not change" labels to viewer action cards.
30. Add per-lane empty states when a saved filter returns no rows.
31. Add stale URL recovery copy when a bookmarked filter no longer has matches.
32. Add a school-context confirmation line inside the action map header.
33. Add site switcher proximity for multi-site directory users.
34. Add lane ordering by active blocker severity.
35. Keep the All students lane first even when severity ordering changes.
36. Add lane grouping for setup, proof, review, meetings, presentation, and closeout.
37. Add a compact density mode for schools with very large rosters.
38. Add a row-density toggle that preserves the selected filter.
39. Add per-row owner labels that align with action-map owner labels.
40. Add per-row "why this row appears" chips for every saved lane.
41. Add a missing-mentor reason chip for no active assignment versus inactive mentor.
42. Add a proof reason chip for no proof versus inaccessible proof.
43. Add a review reason chip for submitted versus explicitly needs_review.
44. Add a revision reason chip for latest revision request age.
45. Add a high-risk reason chip that names the safest visible risk signal.
46. Add mentor-meeting age copy for follow-up rows.
47. Add presentation readiness copy for pending versus missing schedule.
48. Add final-file copy for ready, missing, failed, and complete archive states.
49. Add a "last activity" freshness warning in the result summary.
50. Add a generated-at freshness warning when the directory snapshot is old.
51. Add keyboard skip links from the action map to filters and results.
52. Add screen-reader labels for count badges inside action cards.
53. Add focus-visible styling proof for every action card button.
54. Add route-verifier coverage for all ten Student Directory action lanes.
55. Add fixture coverage for summary counts missing but visible rows present.
56. Add fixture coverage for summary counts present but no visible rows.
57. Add fixture coverage for multi-site users opening a Student Directory lane.
58. Add fixture coverage for Program Teacher scoped directory maps.
59. Add fixture coverage for viewer read-only directory maps.
60. Add fixture coverage for empty all-students roster.
61. Add fixture coverage for empty missing-mentor results.
62. Add fixture coverage for empty proof-missing results.
63. Add fixture coverage for empty review-needed results.
64. Add fixture coverage for empty revision results.
65. Add fixture coverage for empty high-risk results.
66. Add fixture coverage for empty mentor-meeting results.
67. Add fixture coverage for empty presentation results.
68. Add fixture coverage for empty final-file ready results.
69. Add fixture coverage for empty final-file blocked results.
70. Add browser proof that action-map buttons update URL state.
71. Add browser proof that back/forward preserves the active map lane.
72. Add browser proof that refresh restores the active map lane.
73. Add a map card for stale activity if backend exposes a stable filter.
74. Add a map card for no current Program Teacher if backend exposes a stable filter.
75. Add a map card for no current site if a future global roster view exists.
76. Add a search-within-current-lane control.
77. Add a "save this search" affordance for staff-created filters.
78. Add a "copy current roster view" affordance for internal handoff.
79. Add a print-safe current-lane roster summary.
80. Add a CSV export request entry point only when permissions allow it.
81. Add a "recently updated" sort option.
82. Add a "most urgent first" sort option.
83. Add a "mentor missing first" sort option.
84. Add a "review age" sort option for Program Teachers.
85. Add a "presentation date" sort option when presentation data is present.
86. Add a "final-file readiness" sort option when archive data is present.
87. Add pagination copy that names the current lane.
88. Keep pagination controls available after long row lists.
89. Add a compact mobile row summary before the full row detail.
90. Add row actions that open the relevant detail tab from each lane.
91. Open the Mentor tab from mentor-meeting rows when possible.
92. Open the Evidence tab from missing-proof rows when possible.
93. Open the Reviews tab from review-needed and revision rows when possible.
94. Open the Presentation tab from presentation rows when possible.
95. Open the Archive tab from final-file rows when possible.
96. Add source-screen return breadcrumbs when opening detail from a lane.
97. Add guardrail copy that private proof remains protected in directory lists.
98. Add guardrail copy that account changes happen in Users & Access, not Student Directory.
99. Add guardrail copy that archive blockers are fixed in Operations, not by changing student status.
100. Keep Student Directory UX improvements tied to scoped records, real route-backed filters, protected detail panels, and tested role permissions.

## Twenty-First Top 10 Implementation Addendum

Update: this tenth GUI/UX pass implemented the highest-value Readiness report action-map slice. Readiness now opens with an action map that tells aggregate-only users how to interpret report signals safely, and gives school-level users route-backed lanes into the source screens that own the next move.

1. Added an aggregate Readiness action map before KPIs and blocker cards so report-only users get clear interpretation before raw numbers.
2. Added a score lane that frames the score as a trend signal and names the approved-versus-total denominator.
3. Added a submitted-work lane that keeps review workload aggregate and source-screen safe.
4. Added a revision-loop lane that highlights follow-up pressure without exposing individual student records.
5. Added a proof-volume lane with private-proof-hidden guardrail copy.
6. Added a final-file queue lane that treats queued packages as aggregate workload, not as student detail.
7. Added a school Readiness action map before KPIs for Site Admin and School Admin monitoring workflows.
8. Added route-backed Operations lanes for staff-action rows, final-file blockers, missing proof, presentation readiness, stale activity, and program risk.
9. Added role-safe source-screen lanes for Review Queue, Mentor Assignments, and Site Dashboard, including summary-only fallback when a role cannot open Review Queue.
10. Added focused render coverage plus cache-busted workspace assets so the new Readiness map can be browser-smoked as part of the local workspace.

## Tenth-Pass 100 GUI/UX Opportunities

1. Put the Readiness action map before KPI cards on every Readiness view.
2. Separate aggregate-only interpretation from school-level operational routing.
3. Add a score interpretation lane with a visible denominator.
4. Label the score as a trend signal instead of a completion promise.
5. Add a submitted-work aggregate lane.
6. Add a revision-loop aggregate lane.
7. Add a private-proof aggregate lane.
8. Add a final-file queue aggregate lane.
9. Add an explicit aggregate privacy guardrail lane.
10. Show active aggregate signal count in the action-map header.
11. Keep aggregate lanes summary-only unless the role has source-screen access.
12. Keep aggregate copy away from student names, proof paths, account identifiers, and row-like language.
13. Add screen-reader labels for aggregate count badges.
14. Add a no-data aggregate state that explains what the report can still prove.
15. Add a stale-generated-at warning when the aggregate report is old.
16. Add a "do not infer student proof" reminder near aggregate proof totals.
17. Add a "do not broaden access from this report" reminder near aggregate follow-up.
18. Add aggregate empty-state copy that still names the privacy boundary.
19. Add a printable aggregate summary after privacy review.
20. Add test coverage for aggregate reports with zero submitted, revision, evidence, and queued counts.
21. Put the school Readiness action map before KPIs and blocker cards.
22. Use a different title for School Admin monitoring than Site Admin operating.
23. Show active blocker count in the school action-map header.
24. Add a staff-action lane backed by the existing Operations needs-attention preset.
25. Add a final-file blockers lane backed by the existing Operations archive-failed preset.
26. Add a missing-proof lane backed by the existing Operations evidence-missing preset.
27. Add a presentation-readiness lane backed by the existing Operations presentation-pending preset.
28. Add a stale-activity lane backed by the existing Operations stale-activity preset.
29. Add a program-risk lane backed by the existing Operations program-breakdown preset.
30. Include the program id on program-risk buttons so the route cannot silently fail.
31. Add a Review Queue lane for roles that can open submitted review work.
32. Make the Review Queue lane summary-only for School Admin users who cannot open that section.
33. Add a Mentor Assignments lane for coverage failures.
34. Add a Site Dashboard lane for whole-school context.
35. Keep every actionable school lane as a real button, not a fake link.
36. Keep every unavailable school lane as a visible summary badge.
37. Add owner labels to every Readiness lane.
38. Add count badges to every Readiness lane.
39. Add source labels to every Readiness lane.
40. Use tone color only to support, not replace, the text.
41. Keep the card min-height stable so count changes do not move the layout.
42. Use the existing compact link-button style for lane actions.
43. Use the existing summary badge style for non-actionable lanes.
44. Add overflow wrapping for owner, count, source, and detail text.
45. Add mobile stacking for the action-map header.
46. Add mobile screenshot proof for the school Readiness map.
47. Add mobile screenshot proof for the aggregate Readiness map.
48. Add no-overlap proof for long school names in the action map.
49. Add no-overlap proof for long owner labels in the action map.
50. Add keyboard focus proof for every route-backed Readiness lane.
51. Add a route verifier entry for staff-action rows.
52. Add a route verifier entry for final-file blockers.
53. Add a route verifier entry for missing-proof rows.
54. Add a route verifier entry for presentation-readiness rows.
55. Add a route verifier entry for stale-activity rows.
56. Add a route verifier entry for program-risk rows.
57. Add a route verifier entry for mentor-coverage rows.
58. Add browser proof that the staff-action lane sets `needsAttention=true`.
59. Add browser proof that the final-files lane sets `archiveStatus=failed`.
60. Add browser proof that the missing-proof lane sets `category=evidence` and `readiness=missing`.
61. Add browser proof that the presentation lane sets `presentationStatus=pending`.
62. Add browser proof that the stale lane sets `risk=stale`.
63. Add browser proof that the program lane sets the program id.
64. Add browser proof that back and forward preserve the selected Operations filter.
65. Add browser proof that refresh restores the Readiness section before any click.
66. Add copy that explains when KPIs are calculated from visible school records.
67. Add copy that explains why aggregate and school Readiness may disagree.
68. Add a source-data freshness chip beside the school action-map badge.
69. Add a role-scope chip beside the school action-map badge.
70. Add a site-name chip beside the school action-map badge for multi-site users.
71. Add a "selected school" warning when the site switcher changes Readiness context.
72. Add a "no selected school" recovery state for multi-site Readiness users.
73. Add a program-risk empty state when no program breakdown exists.
74. Add a final-file blocker empty state when storage setup is the only blocker.
75. Add separate final-file lanes for failed, expired, expiring, provider-unavailable, and in-progress if the report becomes too dense.
76. Add separate presentation lanes for outline pending, schedule missing, and check-in attention if the report becomes too dense.
77. Add a proof lane that distinguishes missing evidence from inaccessible proof if the backend exposes both.
78. Add a stale lane that names the safe visible stale signal.
79. Add a staff-action lane that explains what "needs attention" includes.
80. Add program-risk card copy that names the top program when one is selected.
81. Add a "current source screen" breadcrumb after following a Readiness lane.
82. Add a return-to-Readiness action from Operations after opening a lane.
83. Add a "copy current Readiness route" affordance for staff handoff.
84. Add a print-safe school Readiness summary after privacy review.
85. Add row-density controls only after the source-screen lanes are stable.
86. Add school Readiness empty-state coverage for no Operations API body.
87. Add school Readiness fallback copy when Operations API fails but aggregate report loads.
88. Add aggregate fallback copy when Reports API fails but Operations API loads.
89. Add test coverage for Site Admin users who can open Review Queue from the map.
90. Add test coverage for School Admin users who see Review Queue as summary-only.
91. Add test coverage for Program Teacher users who see scoped Operations Readiness.
92. Add test coverage for global admins who see school Readiness with selected site context.
93. Add test coverage for report-only misc admin users who never see individual row actions.
94. Add test coverage for missing program id on program-risk cards.
95. Add accessibility checks for the action-map region label.
96. Add accessibility checks for card button names.
97. Add color-contrast checks for every card tone.
98. Add a route-safety guard that unknown action-map presets fall back to the section, not a dead click.
99. Add audit copy that Readiness proves risk but source screens fix work.
100. Keep Readiness UX improvements tied to scoped records, aggregate privacy, existing source screens, and route-backed presets.

## Twenty-Second Top 10 Implementation Addendum

Update: this eleventh GUI/UX pass implemented the highest-value Account/Security action-map slice. The Account screen now starts by routing users through identity, password, session, sign-in, support, Users & Access, and Audit boundaries before they touch the password form.

1. Added an Account/Security action map before the password form.
2. Added a signed-in identity lane that routes to Profile and states that password changes apply only to the current account.
3. Added a password form lane that focuses the self-service password form.
4. Added a password-checklist lane that focuses the existing before-save checklist.
5. Added a session-impact lane that explains other sessions close after a successful password change.
6. Added a sign-in-method lane that explains local-only versus Google Workspace sign-in without adding broken SSO actions.
7. Added a support/recovery lane for forgotten current password, disabled account, or expected SSO cases.
8. Added a Users & Access boundary lane that is route-backed for account managers and summary-only for ordinary users.
9. Added an Audit boundary lane that is route-backed for Global Admins and admin-only for everyone else.
10. Added focused render coverage for regular Account users and Global Admin Security users, plus cache-busted workspace assets for browser proof.

## Eleventh-Pass 100 GUI/UX Opportunities

1. Put an Account/Security action map before the password form.
2. Add a signed-in identity lane with the current role label.
3. Route the identity lane to Profile.
4. State that password changes affect only the signed-in account.
5. Show the current role scope near the identity lane.
6. Add a password form lane with a direct focus action.
7. Add a password-checklist lane with a direct focus action.
8. Add a session-impact lane with a direct focus action.
9. Add a sign-in-method lane with a direct focus action.
10. Add a support/recovery lane with a direct focus action.
11. Add a Users & Access boundary lane.
12. Make the Users & Access lane route-backed for roles that can manage accounts.
13. Make the Users & Access lane summary-only for ordinary users.
14. Add an Audit boundary lane.
15. Make the Audit lane route-backed for Global Admins.
16. Make the Audit lane summary-only for non-admin users.
17. Add current-account-only copy near the password form.
18. Add local-only sign-in copy when Google Workspace sign-in is disabled.
19. Add SSO-plus-local copy when both methods are available.
20. Add SSO-only copy if local login is disabled in a future environment.
21. Add a support panel explaining forgotten current-password recovery.
22. Add a support panel explaining disabled-account recovery.
23. Add a support panel explaining expected-SSO recovery.
24. Add a support panel explaining that other-user resets belong elsewhere.
25. Add a Global Admin version of session-impact copy.
26. Add a student/mentor/staff version of session-impact copy.
27. Add "return to your workspace" copy after password change.
28. Add "sign in again before continuing protected admin work" copy for Global Admins.
29. Add no-fake-reset copy for users who do not know their current password.
30. Add no-role-change-here copy for ordinary users.
31. Add no-account-removal-here copy for ordinary users.
32. Add no-setup-password-here copy for ordinary users.
33. Add no-audit-history-here copy for ordinary users.
34. Add a safe route to Users & Access for School Admins.
35. Add a safe route to Users & Access for Program Teachers.
36. Add a safe route to Users & Access for Site Admins.
37. Add a safe route to Audit for Global Admins.
38. Add an admin security proof route only if audit context is available.
39. Add a "copy support summary" affordance after policy approval.
40. Add visible password requirement hints if the server exposes policy details.
41. Add current-password error recovery copy beside the form.
42. Add new-password mismatch recovery copy beside the form.
43. Add password-too-short recovery copy beside the form.
44. Add rate-limited recovery copy beside the form.
45. Add expired-session recovery before resubmitting the form.
46. Preserve form values safely only where appropriate after validation errors.
47. Clear password fields after successful change.
48. Add success copy that says other sessions are closed.
49. Add a "return to previous section" action after successful change.
50. Add browser proof for password-form lane focus.
51. Add browser proof for password-checklist lane focus.
52. Add browser proof for session-impact lane focus.
53. Add browser proof for sign-in-mode lane focus.
54. Add browser proof for support lane focus.
55. Add browser proof that student Account does not expose Users & Access routing.
56. Add browser proof that Global Admin Security routes to Users & Access.
57. Add browser proof that Global Admin Security routes to Audit.
58. Add mobile screenshot proof for Account action map.
59. Add mobile screenshot proof for Global Admin Security action map.
60. Add no-overlap checks for long emails in the identity lane.
61. Add no-overlap checks for long role-scope labels.
62. Add no-overlap checks for long SSO labels.
63. Add no-overlap checks for long support copy.
64. Add screen-reader labels for action-map region and buttons.
65. Add focus-visible proof for action-map buttons.
66. Add color contrast proof for every action-map card tone.
67. Add keyboard-only navigation proof through the password form.
68. Add keyboard-only navigation proof through the action map.
69. Add explicit autocomplete attributes proof for password inputs.
70. Add submit-disabled-busy copy proof for the password form.
71. Add network-error recovery copy proof for password change.
72. Add policy-blocked recovery copy proof if backend adds policy errors.
73. Add current-account email confirmation before password change if risk warrants it.
74. Add optional reveal-password controls only if accessibility review approves.
75. Add password manager guidance without discouraging approved managers.
76. Add a "do not share password" reminder in support copy.
77. Add a "do not paste temporary passwords into tickets" reminder for account managers.
78. Add direct route from Users & Access setup-password guidance back to Security.
79. Add direct route from Account support guide to Profile.
80. Add direct route from session-expired recovery to Account after sign-in.
81. Add account state badges for active, reset-required, disabled, and SSO-only if server exposes them.
82. Add a safe disabled-account panel for signed-in users if the state can be read.
83. Add a reset-required-specific Account screen after first sign-in.
84. Add a "why am I seeing Account instead of Security?" note for ordinary users.
85. Add Global Admin wording that separates personal password changes from platform security review.
86. Add School Admin wording that separates personal password changes from school account management.
87. Add Program Teacher wording that separates personal password changes from student/mentor account setup.
88. Add Mentor wording that separates personal password changes from assigned-student support.
89. Add Student wording that separates personal password changes from project proof.
90. Add Misc Admin wording that separates personal password changes from aggregate reporting.
91. Add render coverage for SSO-plus-local Account mode.
92. Add render coverage for Google SSO-only Account mode.
93. Add render coverage for local-login-disabled fallback mode.
94. Add render coverage for role-pending users opening Account.
95. Add render coverage for disabled Google Workspace sign-in copy.
96. Add render coverage for Global Admin Users & Access and Audit routing.
97. Add render coverage for ordinary-user summary-only account-management boundaries.
98. Add route-verifier coverage for Profile, Users & Access, and Audit Account/Security lanes.
99. Add audit copy that Account/Security changes personal credentials while source screens manage other protected records.
100. Keep Account/Security UX improvements tied to current-user password changes, source-screen routing, SSO configuration, and tested role boundaries.

## Twenty-Third Top 10 Implementation Addendum

Update: this twelfth GUI/UX pass implemented the highest-value student proof-storage fallback slice. The Add Proof or Links panel now gives students a visible, route-backed map for link proof, file upload, upload status, Program Teacher escalation, and final-file storage ownership before they use either form.

1. Added a student proof-storage fallback map before the link and upload forms.
2. Added a "choose exact work item" card so students start by matching proof to the checklist item.
3. Added a link-first fallback card that explains secure HTTPS proof links when file storage is unavailable.
4. Added a storage-readiness upload card that changes copy for ready, failed, pending, and provider-unavailable states.
5. Added an upload-status card that sends students to the live progress/retry state instead of making them scan the form.
6. Added a Program Teacher escalation card for failed storage attempts.
7. Added a final-file storage card that routes to Final Files and states that setup blockers are staff-owned.
8. Added focus buttons for proof guide, link form, upload form, upload status, and support copy.
9. Tightened failed-upload copy so students attach a link first and retry only after storage is confirmed ready.
10. Tightened final-file guidance so storage setup blockers point to proof links, existing proof, and staff ownership.

## Twelfth-Pass 100 GUI/UX Opportunities

1. Put a proof-storage fallback map before both evidence forms.
2. Label the fallback region with the current storage state.
3. Add a choose-work-item card before link and upload actions.
4. Show the number of started work items in the choose-work card.
5. Add a direct focus action from choose-work to the proof guide.
6. Add a link-first fallback card.
7. Use "secure HTTPS link" language in the fallback card.
8. Explain that proof links keep Program Teacher review moving when storage is unavailable.
9. Add a direct focus action from the fallback card to the link form.
10. Add a storage-readiness upload card.
11. Show "Storage ready" when provider status is ready or configured.
12. Show "Storage setup needed" when credentials are missing.
13. Show "Storage setup needed" when provider status is not ready.
14. Show "Upload problem" after a failed upload.
15. Show "Storage check pending" while archive readiness is not loaded.
16. Change upload card detail based on ready, failed, pending, and unavailable states.
17. Add a direct focus action from the upload card to the upload form.
18. Add an upload-status card.
19. Show current upload label on the upload-status card.
20. Show upload progress percentage on the upload-status card.
21. Add a direct focus action from upload-status card to the live status region.
22. Tell students not to retry over and over after failed uploads.
23. Add a Program Teacher escalation card.
24. Use "Tell your Program Teacher what happened" as the escalation title.
25. Explain that a proof link plus upload-failure note is the support path.
26. Add a direct focus action from escalation card to the support box.
27. Add a final-file storage ownership card.
28. State that final-file storage setup is staff-owned.
29. Route final-file storage card to the Final Files section.
30. Explain that checklist proof can continue while storage setup is fixed.
31. Add status pills to the proof-storage fallback map.
32. Use card tones for ready, warning, danger, quiet, link, teacher, and staff states.
33. Keep card border radius aligned with existing workspace cards.
34. Keep map typography compact enough for an operations-style workflow screen.
35. Avoid a decorative hero treatment in the proof panel.
36. Avoid burying fallback language below a failed upload only.
37. Keep the original "Add proof in this order" guide after the new map.
38. Preserve per-submission "what counts as proof" guidance.
39. Preserve link form validation language.
40. Preserve upload form file-type and 20 MB guidance.
41. Add a data hook for the fallback map.
42. Add a data hook for the storage state.
43. Add data hooks for each fallback card.
44. Add data hooks for storage focus buttons.
45. Add a data hook that marks failed-upload link-first priority.
46. Test ready storage rendering.
47. Test failed upload rendering.
48. Test storage-provider-unavailable rendering.
49. Test upload-progress card data.
50. Test link-form focus button presence.
51. Test upload-form focus button presence.
52. Test upload-status focus button presence.
53. Test proof-guide focus button presence.
54. Test support focus button presence.
55. Test Final Files route button presence.
56. Test that storage provider errors do not expose provider IDs.
57. Test that upload states still avoid Drive IDs and tokens.
58. Test that the fallback map does not reintroduce product-header copy.
59. Add browser proof for the link-first focus action.
60. Add browser proof for the upload-form focus action.
61. Add browser proof for the upload-status focus action.
62. Add mobile screenshot proof for the fallback map.
63. Add no-overlap checks for long proof card copy.
64. Add no-overlap checks for long upload file names.
65. Add keyboard-only proof across fallback map buttons.
66. Add focus-visible proof for fallback map buttons.
67. Add screen-reader announcement proof for upload status.
68. Add contrast proof for warning and danger card states.
69. Add contrast proof for ready and quiet card states.
70. Add hosted proof that provider-unavailable copy appears with real storage config off.
71. Add hosted proof that ready storage copy appears with storage configured.
72. Add hosted proof that failed upload copy appears after a simulated provider failure.
73. Add a visual receipt that proof was saved to the selected work item after link attach.
74. Add a visual receipt that file upload was saved to the selected work item after upload.
75. Add a mismatched-proof correction action near the receipt.
76. Add a "copy proof link fallback note" action if staff approves clipboard support.
77. Add a "what to tell my Program Teacher" helper after upload failure.
78. Add a compact storage health fact to Progress Details.
79. Add a storage unavailable note to Files and Links when evidence is empty.
80. Add proof-link fallback copy to archive blocking checks.
81. Add final-file storage ownership copy to staff Operations rows.
82. Add Program Teacher review-queue copy when evidence is a link fallback.
83. Add audit events for upload fallback path usage if product policy wants it.
84. Add rate-limit recovery copy specific to repeated upload retries.
85. Add offline/network-loss recovery copy specific to file uploads.
86. Add expired-session recovery copy before retrying an upload.
87. Add duplicate-file warning if the same title and file name is uploaded twice.
88. Add duplicate-link warning if the same URL is attached twice.
89. Add invalid-private-link warning when a proof URL looks like a sign-in wall.
90. Add student-friendly copy for unsupported file signatures.
91. Add a small "accepted file types" disclosure with examples.
92. Add per-phase proof examples in the proof guide.
93. Add mentor-visible read-only proof fallback context without granting upload power.
94. Add Program Teacher-visible fallback receipts in student detail.
95. Add Site Admin storage setup link from Operations to the relevant setup screen.
96. Add no-storage-config smoke coverage to the local demo script.
97. Add no-storage-config smoke coverage to hosted preview.
98. Add mobile proof for upload failure and fallback map together.
99. Add audit copy that proof fallback improves review continuity without bypassing approval.
100. Keep proof-storage UX improvements tied to student evidence routes, final-file ownership, and tested provider states.

## Twenty-Fourth Top 10 Implementation Addendum

Update: this thirteenth GUI/UX pass implemented the highest-value student proof-receipt slice. After a link or file proof save, the Files and Links panel now gives the student a clear receipt action map for confirmation, wrong-item correction, sending work for review, and the Program Teacher approval gate.

1. Rebuilt the proof receipt header so it states that proof was saved and must be confirmed against the matching checklist item.
2. Added receipt data hooks for proof kind, matched state, submission id, and requirement id.
3. Added a matched-status pill so the saved proof looks like a confirmable state, not just a note.
4. Added a receipt action card for opening the matching checklist item.
5. Added a wrong-item correction card that tells students to add corrected proof and tell the Program Teacher which proof to ignore.
6. Added a send-for-review card that routes students toward Work You Sent In after proof is attached.
7. Added a Program Teacher approval-gate card that reminds students proof saved is not approval.
8. Added receipt action handlers that open the checklist item, proof tools, sent-work panel, or files panel.
9. Added responsive receipt-card styling so the post-save receipt works at desktop and phone widths.
10. Added render/static coverage for matched receipt state, all four receipt cards, action hooks, approval-gate copy, and storage-id redaction.

## Thirteenth-Pass 100 GUI/UX Opportunities

1. Make proof receipt look like a saved-state confirmation instead of plain helper text.
2. Add a visible "Proof saved" receipt header.
3. Add a "confirm right checklist item" headline.
4. Show proof kind in the receipt state.
5. Show matched-versus-pending state in the receipt data.
6. Show submission id in the receipt data hook.
7. Show requirement id in the receipt data hook.
8. Add a matched-state status pill.
9. Add a pending-match status pill for delayed proof list updates.
10. Keep saved-at time visible in student-friendly format.
11. Add a receipt action card for the matching checklist item.
12. Add a direct checklist button from the receipt.
13. Focus the matching checklist item after clicking the checklist button.
14. Open the checklist disclosure before focusing the item.
15. Add a receipt action card for wrong-item correction.
16. Tell students not to delete or hide the original proof from this screen.
17. Tell students to add corrected proof to the right item.
18. Tell students to tell the Program Teacher which proof to ignore.
19. Add a direct proof-tools button from the wrong-item card.
20. Preserve the receipt submission selection when reopening proof tools.
21. Add a receipt action card for sending work for review.
22. Add a direct Work You Sent In button from the receipt.
23. Explain that sending happens only after all required proof is attached.
24. Add a receipt action card for the approval gate.
25. Explain that proof saved does not equal Program Teacher approval.
26. Add a direct Files and Links button from the approval-gate card.
27. Keep the original four-step receipt checklist below the action map.
28. Make the four-step checklist secondary to action cards.
29. Use "proof" instead of "evidence" in student-visible receipt copy.
30. Avoid storage IDs, Drive IDs, or provider names in receipt copy.
31. Add data hooks for every receipt card.
32. Add data hooks for every receipt action.
33. Add route-safe action handling for missing requirement ids.
34. Fall back to Files and Links when the receipt cannot map a checklist item.
35. Add success copy when opening the matching checklist item.
36. Add success copy when opening proof tools for correction.
37. Add success copy when opening Work You Sent In.
38. Add success copy when staying in Files and Links.
39. Keep receipt actions button-based, not fake links.
40. Keep receipt cards at existing card radius.
41. Use distinct but restrained tones for ready, warning, student, and teacher states.
42. Keep card heights stable when titles wrap.
43. Stack receipt header on mobile.
44. Stack receipt cards cleanly on mobile.
45. Prevent long proof titles from overflowing receipt cards.
46. Prevent long requirement titles from overflowing receipt header.
47. Prevent long Program Teacher copy from crowding action buttons.
48. Add no-horizontal-scroll proof for receipt map at phone width.
49. Add keyboard focus proof for receipt actions.
50. Add screen-reader region labels for receipt map.
51. Add accessible button names for receipt actions.
52. Add browser proof for checklist receipt action.
53. Add browser proof for proof-tools correction action.
54. Add browser proof for Work You Sent In receipt action.
55. Add browser proof for Files and Links receipt action.
56. Add browser proof for matched receipt state after link attach.
57. Add browser proof for matched receipt state after file upload.
58. Add browser proof for pending receipt state while proof list refreshes.
59. Add mobile screenshot proof for proof receipt after link attach.
60. Add mobile screenshot proof for proof receipt after file upload.
61. Add visual diff coverage for the proof receipt map.
62. Add a "copy what changed" student note if approved by privacy review.
63. Add a "tell Program Teacher" draft only after product policy approval.
64. Add explicit duplicate-proof recovery if backend exposes duplicate signals.
65. Add invalid-private-link recovery near receipt if a link later fails.
66. Add stale-receipt expiration when the student navigates away for a long time.
67. Add a receipt close action if students need to dismiss old saves.
68. Keep the receipt visible until another proof save or session reload.
69. Add a receipt icon only if it improves scanning without adding clutter.
70. Add proof receipt context to Progress Details when a new save just happened.
71. Add proof receipt context to Work You Sent In rows after save.
72. Add proof receipt context to the matching checklist detail after save.
73. Add proof receipt context to Program Teacher view so staff see link fallback history.
74. Add mentor-safe proof receipt context without granting proof actions.
75. Add a receipt mismatch warning if the saved proof does not appear in Files and Links.
76. Add a "try refresh" path if proof receipt stays pending after reload.
77. Add receipt-state cleanup after sign out.
78. Add receipt-state cleanup after switching users.
79. Add receipt-state cleanup after student scope changes.
80. Add receipt-state test for missing requirement id fallback.
81. Add receipt-state test for pending matched proof.
82. Add receipt-state test for uploaded file proof.
83. Add receipt-state test for link proof.
84. Add receipt-state test for long proof title.
85. Add receipt-state test for long requirement title.
86. Add receipt-state test for wrong-item correction action.
87. Add receipt-state test for checklist focus action.
88. Add receipt-state test for sent-work focus action.
89. Add receipt-state test for Files and Links focus action.
90. Add receipt-state test that proof copy avoids storage-provider language.
91. Add receipt-state test that student-visible copy avoids "evidence."
92. Add receipt-state test that Drive identifiers never render.
93. Add route-verifier coverage for receipt action hooks.
94. Add accessibility-contract coverage for receipt map buttons.
95. Add mobile-contract coverage for receipt map grid.
96. Add design-token coverage for receipt tones.
97. Add audit copy that proof receipts help continuity without bypassing review.
98. Add hosted proof for link-save receipt.
99. Add hosted proof for file-upload receipt.
100. Keep proof-receipt UX tied to saved proof, matched checklist item, correction path, and Program Teacher approval.

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
