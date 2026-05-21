# Figma Product Preview And State Variants Packet

Date: 2026-05-18

Preferred Figma write target:
- Team/project: `Senior Project App`
- Team id: `1638213362346160913`
- Plan key: `team::1638213362346160913`
- Project URL: `https://www.figma.com/files/team/1638213362346160913/all-projects?fuid=1601310066605052228`

Reference-only prior Figma file:
- `Senior Capstone App - Product UI System Regenerated`
- File key: `LLucMgAPscRa9020iHHigB`
- URL: `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`
- Prior target context: `team::1601310068697743794`

Active recreated Figma file:
- `Senior Capstone App - Product UI System Recreated`
- File key: `z4t4tFPAKrMDh6pIYOeEw6`
- URL: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`
- Active target context: `team::1638213362346160913`

Source implementation:
- Local preview route: `app-preview.html`
- Local renderer: `renderAppPreviewPage` in `app.js`
- Local styles: product preview rules in `styles.css`

Current blocker:
- Direct Figma MCP writes against the prior file/team were blocked by the connected Education-plan tool-call limit.
- Recent rate-limit links pointed at old team `1601310068697743794`, while Bryan's intended Education team/project is `team::1638213362346160913`.
- This packet was executed into the recreated active file `z4t4tFPAKrMDh6pIYOeEw6` in the new `Senior Project App` team/project.
- The final screenshot/metadata verification call is still blocked by the new team's Education-plan MCP quota until calls reset.

## Target Page

Create or replace a page named:

`03 Product Preview + State Variants`

Purpose:
- Extend the regenerated product UI system with reusable variants and role-aware state coverage.
- Turn the local `app-preview.html` work into Figma canvas artifacts without reinterpreting the product direction.
- Give rebuild a clear bridge from Figma screens to routes, components, data fields, and permission rules.
- Ensure the first new writable file in `team::1638213362346160913` carries forward the reference file's product structure instead of retrying the old team-bound file.

## Canvas Structure

Use a 1680px-wide master board on `paper` background.

Recommended top-level frame:
- Name: `Senior Capstone Product Preview + State Variants`
- Width: `1680`
- Layout: vertical auto-layout
- Padding: `48`
- Gap: `28`
- Fill: `paper`

Child frames:
- `Frame / Slice Control Header`
- `Section / Status System`
- `Section / Role Dashboards`
- `Section / Permission Upload Lock Override States`
- `Section / Review Drawer Variants`
- `Section / Component Variant Inventory`
- `Section / Rebuild Data Mapping`
- `Section / Acceptance Checks`

## Visual Tokens

Use the same semantic palette from the local product preview:

- `ink`: `#172026`
- `muted`: `#596871`
- `paper`: `#fbfaf7`
- `surface`: `#ffffff`
- `line`: `#dce4e5`
- `charcoal`: `#22303a`
- `red`: `#b82f2f`
- `blue`: `#2463a6`
- `green`: `#22734d`
- `amber`: `#a65f00`
- `teal`: `#047b83`
- `gold`: `#d9a441`
- `violet`: `#6c4aa3`
- `coral`: `#c6553d`

Typography:
- Inter Bold for page titles and important metrics.
- Inter Semi Bold for headings, labels, tabs, buttons, and status text.
- Inter Regular for body copy.
- Letter spacing should stay `0`.

Radius:
- Cards and controls: `8px`
- Status pills and filter chips: full pill radius.

## Status Pill Variants

Create a reusable `Status Pill` component set or a clearly grouped variant frame with text plus color:

- `Draft`: neutral background, muted text.
- `Submitted`: pale blue background, blue text.
- `Under review`: pale blue background, blue text.
- `Revision requested`: pale amber background, amber text.
- `Approved`: pale green background, green text.
- `Blocked`: pale red background, red text.
- `Rejected`: pale red background, red text.
- `Overridden`: pale violet background, violet text.
- `Archived`: neutral background, muted text.

Rule:
- Never rely on color alone.
- Every status label must remain visible at mobile scale.

## Role Dashboard Frames

### Student Workspace

Frame name:
- `Screen Slice / Student Workspace / State Variants`

Purpose:
- Keep the student view calm and next-action oriented.

Must include:
- Current next-action card: `Finish Research Proposal Challenge`
- Status: `Revision requested`
- Primary action: `Continue Draft`
- Secondary action: `View Feedback`
- Phase progress strip:
  - Setup / Approved
  - Proposal / Revision requested
  - Research / Draft
  - Build / Not started
  - Present / Locked
- Research section completeness rows:
  - Problem and proposed solution / Approved
  - Three sources / Submitted
  - Key quote / Draft
  - AI feedback used / Under review
  - Final student version / Revision requested
- Private evidence table:
  - Project proposal draft v2 / Document / Private to student and assigned staff / Revision requested
  - Audience survey notes / Upload / Program teacher and mentor / Submitted
  - Source article link / External link / Access check needed / Blocked
  - Teacher coaching note / Staff note / Staff only / Under review

Data annotation:
- `Submission`
- `SubmissionVersion`
- `EvidenceArtifact`
- `Review`
- `Comment`
- `Deadline`

### Program Teacher Review Queue

Frame name:
- `Screen Slice / Program Teacher Review Queue / Dense State`

Purpose:
- Make review work fast and intervention-oriented.

Must include metric cards:
- `18` awaiting review
- `9` revision loops
- `6` evidence risks
- `12` approved this week

Must include filter bar:
- Program: `All assigned`
- Cohort: `Class of 2026`
- Status: `Action needed`
- Overdue: `On`

Must include queue rows:
- Sample Student A / IT / Research Challenge / Revision requested
- Sample Student B / Culinary / Core Concept Proposal / Submitted
- Sample Student C / Medical Professions / Safety Scope / Blocked
- Sample Student D / Construction / Materials Plan / Under review
- Sample Student E / Teaching & Training / Proposal / Approved

Row signals:
- evidence count
- source count
- revision count
- last activity
- due date
- action button

Data annotation:
- `student_profile_id`
- `program_id`
- `cohort_id`
- `requirement_id`
- `submission_status`
- `source_count`
- `revision_count`
- `due_at`
- `last_reviewed_at`

### Mentor Dashboard

Frame name:
- `Screen Slice / Mentor Dashboard / Assigned Scope`

Purpose:
- Show assigned students only and avoid broad cohort exposure.

Must include:
- Metric cards:
  - 14 assigned students
  - 5 meetings due
  - 4 presentation risks
  - 8 ready to coach
- Assigned student cards:
  - Sample Student A / Needs make-up / Outline missing / No new artifact in 9 days / Blocked
  - Sample Student F / Scheduled / Draft outline ready / 2 fresh uploads / Submitted
  - Sample Student G / Complete / Needs practice questions / Prototype photos added / Under review
  - Sample Student H / Not scheduled / Presentation slot missing / Research approved / Revision requested

Data annotation:
- `mentor_id`
- `mentor_meeting_one_status`
- `mentor_meeting_two_status`
- `presentation_slot_status`
- `updated_at`

### Admin Overview

Frame name:
- `Screen Slice / Admin Overview / Audit Safe`

Purpose:
- Manage cohort setup, user provisioning, exports, and audit-sensitive actions.

Must include metric cards:
- `486` cohort records
- `27` missing mentors
- `11` provisioning issues
- `4` exports queued

Program health rows:
- IT / 78% / Evidence access checks
- Culinary / 64% / Costing and safety plans
- Medical Professions / 58% / Scope and source accuracy
- Construction / 71% / Materials approval
- Teaching & Training / 82% / Learner feedback evidence

Audit events:
- Role assignment changed / Overridden
- Private evidence accessed / Approved
- Revision requested / Revision requested
- Export package queued / Under review

Data annotation:
- `User`
- `RoleAssignment`
- `Program`
- `Cohort`
- `ExportJob`
- `AuditEvent`
- `OverrideReason`

## Edge State Frames

Create a section named:

`Section / Permission Upload Lock Override States`

Include these state cards:

- `Permission Denied`
  - Status: `Rejected`
  - Message: Mentors see assigned students only. Misc admin sees explicitly granted dashboards only.

- `Upload Failed`
  - Status: `Blocked`
  - Message: Student can retry, replace, or attach an external link without exposing a public file URL.

- `Submission Locked`
  - Status: `Under review`
  - Message: Draft fields lock while a reviewer is making a decision; version history stays visible.

- `Resubmission Ready`
  - Status: `Revision requested`
  - Message: Feedback routes back to the exact section that must change before the next submit.

- `Admin Override`
  - Status: `Overridden`
  - Message: Override requires a reason and writes an audit event before state changes.

- `Empty Queue`
  - Status: `Archived`
  - Message: Empty states explain the missing action, filter, or assignment.

## Review Drawer Variants

Create a component or grouped frame:

`Component / Review Drawer`

Variants:
- `Comment`
- `Request Revision`
- `Approve`
- `Escalate`
- `Flag Weak CTE Alignment`

The `Request Revision` state must show:
- selected requirement
- student and program metadata
- section-specific feedback field
- missing evidence checklist
- action bar with Approve, Request Revision, Flag CTE, Escalate
- audit note: reviewer, timestamp, status transition

## Admin Override Reason Modal

Create a modal frame:

`Modal / Admin Override Reason`

Must include:
- title: `Override requires a reason`
- affected record summary
- reason textarea
- permission warning
- cancel button
- confirm override button
- audit-event preview row

State rules:
- Confirm button disabled until reason exists.
- Override status is visually distinct from ordinary approval.
- The modal must not hide the original submission status.

## Mobile Student Frame

Create a 390px-wide frame:

`Screen / Student Product Preview / Mobile`

Must include:
- compact header
- one next-action card
- status pill
- primary action
- bottom nav chips: My Progress, Submit Work, Feedback, Deadlines, Portfolio
- collapsed evidence and feedback rows

Mobile rules:
- No wide tables.
- Staff dashboards collapse to cards or filtered lists.
- Button text must not wrap awkwardly.

## Component Variant Inventory

Create a summary grid:

- `Status Pill`
  - Draft, Submitted, Under review, Revision requested, Approved, Blocked, Overridden, Archived, Access denied, Upload scanning, Link check needed

- `Submission Card`
  - No work started, Draft saved, Submitted locked, Revision open, Approved

- `Evidence Row`
  - Draft upload, Scanning, External link check, Submitted locked, Revision requested, Reviewer redacted, Approved archive, Failed upload

- `Action Button`
  - Primary submit, Secondary save draft, Danger override, Disabled pending, Loading submit, Permission blocked, Retry

- `Permission Gate`
  - Allowed, Denied, Redacted fields, Expired signed URL, Explicit misc admin scope

- `Review Drawer`
  - Comment, Request revision, Approve, Escalate, Flag weak CTE alignment

- `Admin Modal`
  - Role edit, Deadline change, Override reason, Export confirmation

## Rebuild Mapping

The Figma page should explicitly map UI pieces to code/data concepts:

- Student workspace -> student dashboard route.
- Program teacher queue -> review queue route.
- Mentor dashboard -> assigned-students route.
- Admin overview -> admin overview route.
- Private evidence table -> `EvidenceArtifact` list component.
- Review drawer -> `ReviewDecision` and `Comment` workflow.
- Admin override modal -> `AuditEvent` and `OverrideReason` workflow.
- Status pill -> shared status component.

## Acceptance Checks

Before marking the Figma slice complete:

- Active writable Figma file `z4t4tFPAKrMDh6pIYOeEw6` exists in `team::1638213362346160913`.
- Page `03 Product Preview + State Variants` exists in that active file.
- The active file key and URL are recorded in `docs/artifacts.json`, `docs/automation-memory.md`, `docs/progress/figma.md`, and `docs/progress/run-log.md`.
- Frame IDs are recorded in `docs/progress/figma.md`.
- Status uses text plus color.
- No screen uses real student data.
- Private evidence and staff-only notes are visually separated.
- Permission denied, upload failure, submission locked, resubmission, empty queue, and override states exist.
- Desktop role dashboard frames and mobile student frame exist.
- Component variant inventory exists.
- Screenshot or metadata verification is logged.
- Handoff `H-2026-05-18-007` is updated or resolved.

## Execution Record

Executed in active file `z4t4tFPAKrMDh6pIYOeEw6` on 2026-05-18.

Created/updated frames:
- `Senior Capstone Product Preview + State Variants`, node `6:2`
- `Screen Slice / Student Workspace / State Variants`, node `6:34`
- `Screen Slice / Program Teacher Review Queue / Dense State`, node `6:77`
- `Screen Slice / Mentor Dashboard / Assigned Scope`, node `6:112`
- `Screen Slice / Admin Overview / Audit Safe`, node `6:127`
- `Section / Permission Upload Lock Override States`, node `6:143`
- `Component / Review Drawer`, node `6:198`
- `Modal / Admin Override Reason`, node `6:219`
- `Screen / Student Product Preview / Mobile`, node `6:232`
- `Section / Rebuild Data Mapping`, node `6:257`
- `Section / Review + Override Interaction Variants`, node `31:2`
  - `State / Review Drawer / Default Evidence Loaded`, node `31:21`
  - `State / Review Drawer / Request Revision Draft`, node `31:36`
  - `State / Review Drawer / Submitting Decision`, node `31:49`
  - `State / Review Drawer / Success Logged`, node `31:60`
  - `State / Review Drawer / Permission Denied`, node `31:71`
  - `State / Admin Override / Missing Reason Disabled`, node `31:85`
  - `State / Admin Override / Valid Reason Ready`, node `31:96`
  - `State / Admin Override / Submitting Override`, node `31:109`
  - `State / Admin Override / Audit Event Preview`, node `31:120`
  - `State / Admin Override / Rollback Error`, node `31:131`
  - `Developer Handoff / Route Data Permission Contract`, node `31:144`
- `Section / Private Evidence + Review History Contract`, node `37:2`
  - `Lifecycle / Draft Attached`, node `37:21`
  - `Lifecycle / Upload Scanning`, node `37:34`
  - `Lifecycle / External Link Check`, node `37:45`
  - `Lifecycle / Submitted Locked`, node `37:56`
  - `Lifecycle / Reviewer Redacted`, node `37:69`
  - `Lifecycle / Approved For Archive`, node `37:82`
  - `Permission Matrix / Evidence Access`, node `37:94`
  - `Review History Timeline`, node `37:132`
  - `Developer Handoff / Evidence Data Route Contract`, node `37:177`
  - `Evidence Acceptance Checks`, node `37:201`
- `Section / MVP Component Variant Implementation Matrix`, node `43:2` on `01 Components + App Screens`
  - `MVP / StatusPill` component set, node `43:55`
  - `MVP / ActionButton` component set, node `43:73`
  - `MVP / EvidenceArtifactRow` component set, node `43:149`
  - `Developer Handoff / Shared UI Data Contract`, node `43:150`
- `Section / Admin Account + Group Provisioning Contract`, node `48:2` on `03 Product Preview + State Variants`
  - `Developer Handoff / Admin Provisioning Route Data Contract`, node `48:208`
  - Eight provisioning states: user import draft, role assignment ready, program/cohort scope, assignment conflict, saving, audit logged success, permission denied, and misc admin narrow scope.
- `Section / Mobile Evidence + Revision Workflow Contract`, node `56:2` on `03 Product Preview + State Variants`
  - `Mobile State / Revision Checklist`, node `56:8`
  - `Mobile State / Evidence Upload`, node `56:37`
  - `Mobile State / Submit Blocked`, node `56:66`
  - `Mobile State / Access Recovery`, node `56:91`
  - `Developer Handoff / Mobile Evidence Revision Route Data Contract`, node `56:114`
- `Section / Progress Update + Dashboard Aggregate Contract`, node `61:2` on `03 Product Preview + State Variants`
  - Five progress/dashboard states: student progress update draft, staff progress adjustment, status history persisted, dashboard aggregate recalculated, and conflict plus audit visible.
  - Six server transition pipeline steps: receive update, authorize scope, validate transition, persist records, write audit, and recompute dashboard.
  - `Developer Handoff / Progress Dashboard Aggregate Route Data Contract`, node `61:113`
- `Section / Audit Log + Export Controls Contract`, node `69:2` on `03 Product Preview + State Variants`
  - Five audit/export states: audit stream filtered, sensitive event detail, export request draft, export queued and ready, and permission denied plus retention review.
  - Six audit/export pipeline steps: filter event stream, open redacted event detail, request scoped export, authorize reason and scope, generate signed archive, and record download acknowledgement.
  - `Developer Handoff / Audit Export Route Data Contract`, node `69:180`
- `Section / Mentor Meeting + Presentation Scheduling Contract`, node `78:2` on `03 Product Preview + State Variants`
  - Six meeting/presentation states: meeting prep ready, attendance recorded, make-up required, outline approval gate, presentation slot conflict, and check-out/check-in ready.
  - Six mentor presentation pipeline steps: seed checkpoint requirement, collect prep evidence, record attendance or make-up, approve outline gate, schedule presentation slot, and audit check-out/check-in.
  - `Developer Handoff / Mentor Presentation Route Data Contract`, node `78:166`
- 2026-05-20 review-history prototype alignment on `05 Full MVP Alpha Prototype`
  - `Prototype / 06 / Review detail and decision drawer`, node `98:9`
  - `Prototype / 07 / Student revision loop`, node `98:10`
  - Route/data/permission text nodes updated: `98:533`, `98:534`, `98:535`, `98:602`, `98:603`, and `98:604`.
- 2026-05-20 route handoff consumption update on `05 Full MVP Alpha Prototype`
  - `Prototype / 14 / Route and implementation handoff`, node `98:17`
  - Handoff text nodes updated: `98:1079`, `98:1087`, `98:1088`, `98:1073`, `98:1074`, `98:1119`, and `98:1123` through `98:1127`.
  - Shared plugin data key `senior_capstone/handoff_status_2026_05_20` records that review history is consumed in the primary alpha console and that the next rebuild focus is mentor, presentation, admin depth, and hosted alpha smoke.
- 2026-05-20 production app/public guide boundary handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 15 / Production app and public guide boundary`, node `124:2`
  - Created route/data/permission/state annotations that separate public Student/Teacher guide mode from the authenticated `/workspace` app route.
  - Shared plugin data key `senior_capstone/production_boundary_contract_2026_05_20` records 7 routes, 9 records, 6 permission scopes, 6 guardrails, 3 external setup blockers, and the next rebuild action for role-pending and permission-denied workspace states.
- 2026-05-21 route inventory consumption update on `05 Full MVP Alpha Prototype`
  - Updated `Prototype / 15 / Production app and public guide boundary`, node `124:2`, after generated production route inventory classified `workspace.html` as `senior-capstone-app` / `production` / `conditional`.
  - Updated text nodes `124:5`, `124:12`, `124:52`, `124:71`, `124:140`, `124:146`, `124:147`, and `124:150` to mark route inventory proof consumed and remove stale Cloudflare-token blocker language.
  - Shared plugin data key `senior_capstone/production_route_inventory_consumption_2026_05_21` records consumed commit `b318eb146c8be4aac41fec3cca2adc817a01ec91`, consumed manifest `docs/progress/runs/2026-05-21-0233-workspace-route-inventory-mvp-032.json`, and remaining hosted account-state, section-denied, Drive upload, and credential-delivery proof.
- 2026-05-20 workspace account edge-state handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 16 / Workspace account edge-state handoff`, node `133:2`
  - Created route/data/permission/state annotations for session expired, disabled account, password reset required, role pending, no active assignment, and section-level permission denied.
  - Shared plugin data key `senior_capstone/workspace_account_edge_contract_2026_05_20` records 6 states, 9 routes, 9 records, 6 guardrails, and the next rebuild action for disabled/reset-required/no-assignment/session-expired workspace UI proof.
- 2026-05-20 presentation dashboard state handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 17 / Presentation dashboard state handoff`, node `139:2`
  - Created route/data/permission/state annotations that consume existing presentation slot, conflict, check-out, and check-in APIs into student, mentor, teacher, admin, denied-action, empty, and loading dashboard states.
  - Shared plugin data key `senior_capstone/presentation_dashboard_state_contract_2026_05_20` records 6 states, 7 routes, 8 records, 6 guardrails, and the next rebuild action for canonical dashboard presentation-state browser proof.
- 2026-05-20 celebration archive readiness handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 18 / Celebration archive readiness handoff`, node `144:2`
  - Created route/data/permission/state annotations for Celebration Day evidence, program-specific ingredient evidence, thank-you and mentor-note completion, reflection/portfolio readiness, May 5 archive requests, expired signed downloads, and archive permission denial.
  - Shared plugin data key `senior_capstone/celebration_archive_readiness_contract_2026_05_20` records 7 states, 8 routes, 14 records, 5 permission scopes, 7 guardrails, 7 acceptance checks, and the next rebuild action for archive/closeout workflow depth.
- 2026-05-20 archive provider and retention handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 19 / Archive provider and retention handoff`, node `149:2`
  - Created route/data/permission/state annotations for missing Drive credentials, provider-unavailable retry, queued generation, scoped package readiness, expiring retention windows, and retention policy review.
  - Shared plugin data key `senior_capstone/archive_provider_retention_contract_2026_05_20` records 6 states, 6 routes, 10 records, 5 permission scopes, 6 guardrails, 7 acceptance checks, and the current Cloudflare token plus Drive credential blockers.
- 2026-05-20 Drive archive delivery handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 20 / Drive archive delivery handoff`, node `151:2`
  - Created route/data/permission/state annotations for Drive credentials configured, package assembly to Drive, signed link issued, student download started, expired link retry, and hosted proof required.
  - Shared plugin data key `senior_capstone/drive_archive_delivery_contract_2026_05_20` records 6 states, 5 routes, 10 records, 5 permission scopes, 6 guardrails, 6 acceptance checks, and the next rebuild action for Drive-backed package or signed-link delivery plus hosted fake-account proof after Cloudflare/Drive secrets are available.
- 2026-05-21 credential lifecycle handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 21 / Credential lifecycle handoff`, node `153:2`
  - Created route/data/permission/state annotations for admin reset requested, reset completion form, password changed plus session rotation, invalid current password, weak or reused password, and stale session revoked.
  - Shared plugin data key `senior_capstone/credential_lifecycle_contract_2026_05_21` records 6 states, 7 routes, 5 records, 6 guardrails, and the next rebuild action for invitation/import, generated or temporary credential policy, hosted reset/change proof, admin reset initiation proof, stale-session fallback, and redacted audit checks.
- 2026-05-21 admin import temporary credential handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 22 / Admin import temporary credential handoff`, node `158:2`
  - Created route/data/permission/state annotations for admin import draft, validation errors, pending-reset account creation, one-time temporary credential display, delivery policy needed, and permission-denied audit.
  - Shared plugin data key `senior_capstone/admin_import_temp_credential_contract_2026_05_21` records 6 states, 7 routes, 9 records, 4 permission scopes, 6 guardrails, 5 acceptance checks, and the next rebuild action for hosted admin import UI proof plus a credential-delivery policy decision before real pilot users.
- 2026-05-21 admin import proof QA handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 23 / Admin import proof QA handoff`, node `163:2`
  - Created route/data/permission/state annotations for hosted admin form loaded, validation errors blocked, import success no-store, reset-first login required, denied role attempt, and refresh/stale-session safety.
  - Shared plugin data key `senior_capstone/admin_import_proof_qa_contract_2026_05_21` records 6 states, 8 routes, 9 records, 5 UI markers, 6 guardrails, 5 acceptance checks, and the next rebuild action for fake-account browser/API proof after the workspace admin import UI landed.
- 2026-05-21 admin import API proof consumption update on `05 Full MVP Alpha Prototype`
  - Updated `Prototype / 23 / Admin import proof QA handoff`, node `163:2`, after reset-first API proof landed in run `2026-05-21-0137-admin-import-reset-proof-mvp-004`.
  - Shared plugin data key `senior_capstone/admin_import_proof_qa_contract_2026_05_21` now records `apiProofConsumedAt=2026-05-21T01:37:00-07:00`, 7 consumed API proof checks, 7 remaining browser proof checks, and implementation commit `f9f6ea8db24b064a821571c4b731236ed386b5f4`.
  - The visual handoff now explicitly narrows rebuild to browser-level fake-account proof for validation UI, no-store setup output clearing on refresh, reset-first login before dashboards, denied-role UI behavior, stale-session safety, and no credential leakage.
- 2026-05-21 student dashboard access audit handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 24 / Student dashboard access audit handoff`, node `173:2`
  - Created route/data/permission/audit annotations after `/api/student/dashboard` gained unauthorized, denied, and allowed protected-dashboard audit proof in run `2026-05-21-0306-student-dashboard-access-audit-mvp-006`.
  - State annotations cover signed-out request, student own dashboard viewed, student-other denied, mentor active assignment, program-teacher scoped cohort, and admin-allowed/misc-admin-denied behavior.
  - Shared plugin data key `senior_capstone/student_dashboard_access_audit_contract_2026_05_21` records consumed commit `d8eb8c95b56406c0c8c051ea0d55876986112567`, 5 permission scopes, 5 guardrails, 4 acceptance checks, and the next rebuild action for broadening the same audited permission matrix to remaining workflow endpoints plus live permission UI proof.
- 2026-05-21 teacher review queue access audit handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 25 / Teacher review queue access audit handoff`, node `178:2`
  - Created route/data/permission/audit annotations after `/api/teacher/review-queue` gained unauthorized, denied, viewed, and empty-scope no-leak proof in run `2026-05-21-0336-teacher-review-queue-scope-audit-mvp-015`.
  - State annotations cover signed-out queue request, misc-admin denied role, empty program-scope no-leak behavior, scoped program-teacher queue visibility, admin inspection, and queue-row privacy.
  - Shared plugin data key `senior_capstone/teacher_review_queue_scope_audit_contract_2026_05_21` records consumed commits `0920bf2d33af753817700439bf44374655c57958` and `2e0ac3262c9252bd1d98358ac97d6c420ab30df9`, 6 states, 7 routes, 13 records, 5 permission scopes, 5 guardrails, 4 acceptance checks, and the next rebuild action for broadening the same audited permission matrix to review detail/history/decision endpoints plus hosted permission UI proof.
- 2026-05-21 review history and decision access audit handoff on `05 Full MVP Alpha Prototype`
  - `Prototype / 26 / Review history and decision access audit handoff`, node `180:2`
  - Created route/data/permission/audit annotations after `/api/reviews/:submissionId/history` gained unauthorized, denied, and viewed read audits and `/api/reviews/:submissionId/decision` gained unauthorized/denied reviewer audits in run `2026-05-21-0405-review-history-decision-audit-mvp-015`.
  - State annotations cover history signed-out, history scope denied, history viewed counts, decision signed-out, decision scope denied, and decision success audited behavior.
  - Shared plugin data key `senior_capstone/review_history_decision_access_audit_contract_2026_05_21` records consumed commits `d083100cd9cc501643217d627948026be4753f24` and `737fbc1`, 6 states, 6 routes, 12 records, 5 guardrails, 4 acceptance checks, and the next rebuild action for broadening the protected-record audit matrix to submissions, evidence, mentor meetings, presentation slots, archive/export, and hosted permission UI proof.

Verification status:
- Canvas write succeeded and returned the frame IDs above.
- Professional-plan verification later succeeded for the active file.
- `get_screenshot` succeeded for nodes `6:2`, `6:198`, `6:219`, `6:257`, `18:2`, and `31:2`.
- `get_design_context` succeeded for node `31:2`.
- Follow-up readback confirmed board `6:2` includes node `31:2`, board height expanded to `5393`, and shared contract data on `31:2` names review/override routes, data records, and security guardrails.
- `get_screenshot` succeeded for node `37:2`; visual QA found lifecycle cards clipping on the first screenshot.
- Follow-up `use_figma` layout fix created lifecycle rows `38:2` and `38:3`, expanded board `6:2` to height `7054`, and final `get_screenshot` succeeded for node `37:2` at `1584x1633`.
- Follow-up readback confirmed shared contract data on `37:2` names private evidence routes, data records, and security guardrails.
- `get_screenshot` succeeded for node `43:2`; visual QA found status variant clipping on the first screenshot.
- Follow-up `use_figma` layout fix expanded `MVP / StatusPill` node `43:55` to a two-column layout, expanded board `3:2` to height `4978`, and final `get_screenshot` succeeded for node `43:2` at `1584x1404`.
- Follow-up readback confirmed shared contract data on `43:2`, component-set contracts on nodes `43:55`, `43:73`, and `43:149`, and variant counts of 11 status states, 7 action states, and 8 evidence row states.
- `get_screenshot` succeeded for node `48:2`; visual QA found clipped text heights on the first screenshot.
- Follow-up `use_figma` text-height correction expanded node `48:2` to `1584x1680`, expanded board `6:2` to height `8761.8`, and final `get_screenshot` succeeded for node `48:2`.
- Follow-up readback confirmed shared contract data on `48:2`, handoff node `48:208`, 8 provisioning states, 8 routes, 12 records, 6 acceptance checks, and zero clipped text nodes.
- `get_design_context` for existing mobile node `6:232` confirmed the current mobile style before adding node `56:2`.
- `get_libraries` and `search_design_system` succeeded; no richer mobile/evidence component matched, so the section reused local visual conventions and shared status/action/evidence language from node `43:2`.
- Initial `use_figma` write for node `56:2` failed atomically on an invalid auto-layout enum before making changes.
- Corrected `use_figma` write created node `56:2`, mobile state nodes `56:8`, `56:37`, `56:66`, `56:91`, and handoff node `56:114`.
- `get_screenshot` succeeded for node `56:2`; visual QA found oversized mobile pill labels on the first screenshot.
- Follow-up `use_figma` layout correction tightened 21 pill labels and 4 mobile bottom-nav groups.
- Final `get_screenshot` and `get_design_context` succeeded for node `56:2`.
- Follow-up readback confirmed board `6:2` height `9858.8`, 4 mobile states, zero direct-child overflow inside 360px phone frames, 7 routes, 9 records, 5 permission scopes, and 6 acceptance checks in shared contract data.
- `get_design_context`, `get_libraries`, and `search_design_system` succeeded before adding node `61:2`; search returned no richer dashboard/progress primitive, so the section matched local conventions.
- `use_figma` write created node `61:2`, five progress/dashboard states, six pipeline steps, and handoff node `61:113`.
- First screenshot/metadata verification found horizontal rows with fixed 100px heights while children were taller.
- Follow-up `use_figma` autosizing correction adjusted 31 horizontal rows and 22 vertical frames in place, expanded node `61:2` to `1584x1345`, and expanded board `6:2` to height `11231.8`.
- Final `get_screenshot`, `get_design_context`, and metadata succeeded for node `61:2`.
- Follow-up readback confirmed shared contract data on `61:2`, handoff node `61:113`, 5 progress/dashboard states, 6 pipeline steps, 7 routes, 12 records, 5 permission scopes, 6 guardrails, 7 acceptance checks, zero clipped text nodes, and zero clipped horizontal rows.
- `get_design_context`, `get_libraries`, and `search_design_system` succeeded before adding node `69:2`; search returned no richer audit/export primitive, so the section matched local conventions.
- `use_figma` readback confirmed board `6:2` had no existing audit/export controls contract before the write.
- `use_figma` write created node `69:2`, five audit/export states, six pipeline steps, audit stream/export request panels, and handoff node `69:180`.
- First screenshot/metadata verification found non-pill text nodes at 1px height.
- Follow-up `use_figma` text-height and autosizing correction adjusted 66 text nodes, 50 horizontal rows, and 28 vertical frames in place, expanded node `69:2` to `1584x1819`, and expanded board `6:2` to height `13078.8`.
- Final `get_screenshot`, `get_design_context`, and metadata succeeded for node `69:2`.
- Follow-up readback confirmed shared contract data on `69:2`, handoff node `69:180`, 5 audit/export states, 6 pipeline steps, 7 routes, 12 records, 5 permission scopes, 7 guardrails, 7 acceptance checks, zero clipped text nodes, and zero clipped horizontal rows.
- `get_design_context`, `get_libraries`, and `search_design_system` succeeded before adding node `78:2`; search returned only the local status pill primitive and no richer mentor/scheduling component, so the section matched local conventions.
- `use_figma` readback confirmed board `6:2` had no existing mentor meeting/presentation scheduling contract before the write.
- `use_figma` write created node `78:2`, six meeting/presentation states, six pipeline steps, meeting attendance and presentation scheduling panels, route/data/permission matrix, and handoff node `78:166`.
- Initial metadata verification found new pill frames collapsed to 15px height even though text was not clipped.
- Follow-up `use_figma` pill-height correction adjusted 21 pill frames plus row/container autosizing, expanded node `78:2` to `1584x1900`, and expanded board `6:2` to height `15006.8`.
- Final `get_screenshot`, `get_design_context`, and metadata succeeded for node `78:2`.
- Follow-up readback confirmed shared contract data on `78:2`, handoff node `78:166`, 6 states, 6 pipeline steps, 9 routes, 13 records, 5 permission scopes, 7 guardrails, 7 acceptance checks, zero clipped text nodes, zero collapsed pills, and zero clipped horizontal rows.
- 2026-05-20 `use_figma` write updated node `98:9` to map `/teacher/reviews/:id` and `/api/reviews/:submissionId/history` to `submissions`, `reviews`, `comments`, `status_history`, `submission_versions`, and `evidence_artifacts`; sidebar and header text widths were corrected.
- 2026-05-20 `use_figma` write updated node `98:10` to map `/student/submissions/:id/revision` and `/api/reviews/:submissionId/history` to `reviews`, `comments`, `status_history`, `submission_versions`, `evidence_artifacts`, and `requirement_sections`; sidebar and revision-card text widths were corrected.
- `get_design_context` and `get_screenshot` succeeded for nodes `98:9` and `98:10` after the correction; screenshot sizes returned `1024x623` for node `98:9` and `1024x648` for node `98:10`, and readback found zero suspicious clipped text nodes in both frames.
- 2026-05-20 `use_figma` write updated node `98:17` to record `review_history_consumed_at`, the primary alpha-console review-history consumption state, and the next rebuild focus on mentor, presentation, and admin depth; it also corrected compact handoff text widths.
- `get_design_context` and `get_screenshot` succeeded for node `98:17` after the correction; screenshot verification returned `1024x648` from original `1360x860`, and readback found zero suspicious clipped text nodes.
- 2026-05-20 `use_figma` write created node `124:2` to map `/`, `public-companion/`, `/workspace`, `/workspace.html`, `/api/auth/me`, `/api/student/dashboard`, `/api/submissions/:id/evidence`, and `/api/submissions/:id/evidence/upload` to public guide state versus authenticated role/scope state.
- First screenshot/metadata verification found text nodes collapsed to 1px height and lower acceptance-card bullet rows overflowing their cards.
- Follow-up `use_figma` layout corrections expanded all text heights and fixed bullet-row widths in place, expanding node `124:2` to `1360x1742`.
- Final `get_design_context` and `get_screenshot` succeeded for node `124:2`; screenshot verification returned `800x1024` from original `1360x1742`, and readback confirmed zero suspicious clipped text nodes, zero child overflow, 7 contract routes, 9 records, 6 permission scopes, 6 guardrails, and 3 blocker notes.
- 2026-05-20 `use_figma` write created node `133:2` to map `/workspace`, `/workspace.html`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/student/dashboard`, `/api/mentor/assigned`, `/api/teacher/review-queue`, and `/api/reports/readiness` to account lifecycle and assignment/scope edge states.
- First readback found zero-width text and an oversized `41066px` auto-layout height; follow-up `use_figma` layout correction fixed text widths, frame autosizing, and reduced node `133:2` to `1360x1568`.
- Final `get_design_context` and `get_screenshot` succeeded for node `133:2`; screenshot verification returned `889x1024` from original `1360x1568`, and readback confirmed 58 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 9 routes, 9 records, and 6 guardrails.
- 2026-05-20 `use_figma` write created node `139:2` to map `/student/presentation`, `/mentor/assigned`, `/teacher/dashboard`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-out`, `/api/presentation-slots/:id/check-in`, and `/admin/audit` to dashboard-facing presentation states.
- Initial visual readback found compact panel action labels squeezed too narrowly; follow-up `use_figma` layout correction converted those rows to stacked content, expanded node `139:2` to `1360x1943`, and returned zero suspicious clipped text nodes plus zero child overflow.
- Final `get_design_context` and `get_screenshot` succeeded for node `139:2`; screenshot verification returned `717x1024` from original `1360x1943`, and readback confirmed 6 states, 7 routes, 8 records, and 6 guardrails in shared contract data.
- 2026-05-20 `use_figma` write created node `144:2` to map `/student/celebration`, `/student/portfolio`, `/student/archive`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/exports/student-archive`, `/api/exports/:id/download`, and `/admin/audit` to closeout/archive readiness states.
- Initial readback found fixed-height horizontal rows clipping taller child cards; follow-up `use_figma` row autosizing correction adjusted 7 horizontal rows plus vertical containers, expanded node `144:2` to `1360x2218`, and returned zero suspicious clipped text nodes plus zero child overflow.
- Final `get_design_context` and `get_screenshot` succeeded for node `144:2`; screenshot verification returned `628x1024` from original `1360x2218`, and readback confirmed 7 states, 8 routes, 14 records, 5 permission scopes, 7 guardrails, and 7 acceptance checks in shared contract data.
- 2026-05-20 `use_figma` write created node `149:2` to map archive provider failures, remote migration pending setup, scoped package readiness, signed/scoped download expiry, and retention-policy review to persisted export/evidence/audit records.
- Final readback found 108 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 6 routes, 10 records, 5 permission scopes, 6 guardrails, and 7 acceptance checks in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `149:2`; screenshot verification returned `706x1024` from original `1360x1975`.
- 2026-05-20 `use_figma` write created node `151:2` to map the remaining Drive-backed archive package or signed-link delivery states after provider-gated archive generation was partially implemented.
- Final readback found 102 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 5 routes, 10 records, 5 permission scopes, 6 guardrails, and 6 acceptance checks in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `151:2`; screenshot verification returned `684x1024` from original `1360x2038`.
- 2026-05-21 `use_figma` write created node `153:2` to map credential lifecycle states after reset-required completion, admin reset initiation, and active-user password change landed in the workspace.
- Initial readback found compact chip width and 4px state-row overflow issues; follow-up `use_figma` correction fixed chip sizing and state-row spacing.
- Final readback found 59 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 7 routes, 5 records, and 6 guardrails in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `153:2`; screenshot verification returned `868x1024` from original `1360x1605`.
- 2026-05-21 `use_figma` write created node `158:2` to map admin import and one-time temporary credential states after `/api/admin/users/import` landed.
- Initial readback found collapsed 1px text heights and row overflow; follow-up layout corrections expanded text/rows and then tightened chip/action labels.
- Final readback found 59 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 7 routes, 9 records, 4 permission scopes, 6 guardrails, and 5 acceptance checks in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `158:2`; screenshot verification returned `814x1024` from original `1360x1712`.
- 2026-05-21 `use_figma` write created node `163:2` to map admin import proof QA states after the canonical workspace admin import UI landed.
- Initial readback found 32 collapsed 1px text heights; a targeted text-height correction expanded node `163:2` to `1360x1414`.
- Final readback found 49 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 8 routes, 9 records, 5 UI markers, 6 guardrails, and 5 acceptance checks in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `163:2`; screenshot verification returned `985x1024` from original `1360x1414`.
- 2026-05-21 `use_figma` update marked node `163:2` API proof consumed after the reset-first API proof pass; readback found 49 text nodes, zero collapsed text nodes, zero child overflow, 7 consumed API proof points, and 7 remaining browser proof checks. `get_design_context` and `get_screenshot` succeeded, and screenshot verification returned `1007x1024` from original `1360x1384`.
- 2026-05-21 `use_figma` write created node `173:2` to map student dashboard protected-access audit states after `/api/student/dashboard` route-level proof landed.
- Initial readback found fixed-height horizontal rows and clipped 10px text nodes; targeted layout correction autosized rows, expanded text heights, and expanded node `173:2` to `1360x1455`.
- Final readback found 49 text nodes, zero suspicious clipped text nodes, zero child overflow, 5 permission scopes, 5 guardrails, and 4 acceptance checks in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `173:2`; screenshot verification returned `958x1024` from original `1360x1455`.
- 2026-05-21 `use_figma` write created node `178:2` to map teacher review queue protected-access audit states after `/api/teacher/review-queue` route-level proof landed.
- Initial write failed atomically on an invalid divider `HUG` sizing assignment before creating canvas nodes; corrected write created node `178:2`.
- Final readback found 49 text nodes, zero suspicious clipped text nodes, zero direct-child overflow, zero collapsed frames, 6 states, 7 routes, 13 records, 5 permission scopes, 5 guardrails, and 4 acceptance checks in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `178:2`; screenshot verification returned `1010x1024` from original `1360x1379`.
- 2026-05-21 `use_figma` write created node `180:2` to map review history and decision protected-access audit states after `/api/reviews/:submissionId/history` and `/api/reviews/:submissionId/decision` proof landed.
- Initial readback found collapsed 1px text heights and collapsed auto-layout frame height; a targeted text-height and auto-layout correction expanded node `180:2` to `1360x1463`.
- Final readback found 50 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 6 routes, and 8 audit events in shared contract data.
- `get_design_context` and `get_screenshot` succeeded for node `180:2`; screenshot verification returned `952x1024` from original `1360x1463`.
