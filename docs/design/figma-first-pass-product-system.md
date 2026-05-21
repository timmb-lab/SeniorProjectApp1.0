# Figma First-Pass Product System

Date: 2026-05-18

Master-plan sections referenced:
- Product Destination
- North Star Workflow
- First Real Vertical Slice
- Lane Responsibilities
- Logging Requirements

Preferred Figma write target:
- Team/project: `Senior Project App`
- Team id: `1638213362346160913`
- Plan key: `team::1638213362346160913`
- Project URL: `https://www.figma.com/files/team/1638213362346160913/all-projects?fuid=1601310066605052228`

Reference Figma artifact:
- Active recreated file: `Senior Capstone App - Product UI System Recreated`
- Active file key: `z4t4tFPAKrMDh6pIYOeEw6`
- Active URL: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`
- Prior populated file: `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`
- Authenticated Figma account reported during regeneration: `timmb@nv.ccsd.net`
- Prior target context: `team::1601310068697743794`

Status:
- Future Figma writes should continue the active writable product UI file `z4t4tFPAKrMDh6pIYOeEw6` inside the `Senior Project App` team/project.
- The prior regenerated file remains reference-only.
- Active file creation and canvas writes succeeded in `team::1638213362346160913`.
- Bryan's professional-plan upgrade unblocked follow-up Figma MCP calls: metadata, screenshots, read-only inspection, library discovery, design-system search, and a new canvas write all succeeded on 2026-05-18.
- Prior regenerated file creation succeeded under the updated Figma connection and direct canvas writing succeeded.
- The prior file contains the planned three-page structure, reusable component examples, desktop screens, mobile screen, and automation handoff board.
- Prior historical file `fkfNI9JNy0A3Rm8KnoxJLj` is superseded. That file was created under the earlier Figma setup but canvas writing was blocked by the Starter MCP tool-call limit.

## Product UI Thesis

The app should feel like a serious school-operations product: calm for students, dense for staff, and strict about privacy. The design system should make weak project status hard to hide and make good coaching easier.

Do not build a marketing site. The first screen after login should be the actual work surface for the user's role.

## Core App Shell

Desktop shell:
- Left sidebar with role-aware navigation.
- Top bar with global search, cohort filter, program filter, notifications, and profile.
- Center work surface with cards, tables, boards, or forms.
- Right rail for contextual metrics, review backlog, deadlines, interventions, or audit notes.

Mobile shell:
- Student-first bottom navigation or compact menu.
- One next-action card at the top.
- Staff dashboards collapse to filtered lists and queues.
- Avoid wide tables on phones.

Navigation by role:
- Student: My Progress, Submit Work, Feedback, Deadlines, Portfolio, Resources.
- Mentor: Assigned Students, Review Queue, Meetings, Presentation Prep, Comments.
- Program teacher: Program Dashboard, Students, Review Queue, Requirements, Deadlines, Mentor Status, Reports.
- Admin: Overview, Programs, Users, Assignments, Cohorts, Requirements, Dashboards, Exports, Audit Log, Settings.
- Misc admin: generated from explicit permissions only.

## Visual Foundations

Suggested tokens:
- `ink`: primary text and high-emphasis UI.
- `muted`: secondary text and metadata.
- `paper`: app background.
- `surface`: cards, rows, panels.
- `line`: borders and dividers.
- `blue`: submitted, under review, active review queue.
- `green`: approved and complete.
- `amber`: revision requested, warning, action needed.
- `red`: blocked, rejected, permission/error state.
- `teal`: evidence, upload/link, artifact management.
- `violet`: admin override, audit-sensitive state.
- `coral`: coaching/intervention highlight.

Typography:
- Display: 40-44px, bold, only for top-level product anchors.
- Page title: 28-32px, bold.
- Section title: 18-22px, semi bold.
- Body: 14-16px, regular.
- Metadata/caption: 11-12px, regular or semi bold.

Status labels:
- Not started
- Draft
- Submitted
- Under review
- Revision requested
- Approved
- Blocked
- Rejected
- Overridden
- Archived

Status rules:
- Always render text plus color.
- Every status pill needs an accessible label.
- `Revision requested` must link to the exact feedback and resubmission path.
- `Blocked` must include reason and owner.
- `Overridden` must be visually distinct and audit-linked.

## Component Inventory

Design these as reusable Figma components before the next screen pass:

- App shell
- Sidebar item
- Top search/filter bar
- Role-aware navigation group
- Status pill
- Metric card
- Student next-action card
- Submission card
- Evidence artifact row
- Upload drop zone
- External link artifact card
- Requirement section progress item
- Research Challenge section block
- Review queue row
- Feedback/comment thread
- Approval action bar
- Revision request panel
- Audit event row
- Student progress table row
- Program health card
- Deadline chip
- Empty state
- Permission-denied state
- Upload failure state
- Loading/skeleton row

## First Vertical Slice Screens

### Student Home

Purpose:
- Tell the student exactly what to do next.

Primary layout:
- Current phase and due date.
- Next-action card: "Finish Research Proposal Challenge".
- Phase progress strip.
- Submission cards for proposal, research challenge, evidence, and reflection.
- Feedback panel with teacher/mentor comments.
- Evidence panel showing uploaded files and links.

Data mapping:
- `StudentProfile`
- `Program`
- `Requirement`
- `Submission`
- `SubmissionVersion`
- `EvidenceArtifact`
- `Review`
- `Comment`
- `Deadline`

States:
- No work started.
- Draft saved.
- Submitted and locked from edit.
- Under review.
- Revision requested with feedback.
- Approved with status history.
- Missing evidence.
- Upload failed.
- Permission denied if the session is wrong.

### Guided Proposal And Research Form

Purpose:
- Turn the Research Proposal Challenge into a guided quality engine, not a loose document upload.

Sections:
- Problem and proposed solution.
- Three sources.
- Key quote.
- Counterclaim.
- Refutation.
- Student draft.
- AI feedback used for revision support.
- Final student version.
- Why it matters.

Design requirements:
- Section-level completeness.
- Source count indicators.
- Required evidence/link attachment.
- Teacher intervention flags for vague, weak, or non-CTE-aligned work.
- Save draft, submit, resubmit, and view feedback actions.
- Version history visible after review.

Backlog link:
- Supports `SC-002`.

### Evidence Upload And Link Space

Purpose:
- Give students one safe place to submit documents, links, images, slides, photos, reflections, and final products.

Required UI:
- Upload drop zone.
- Add external link.
- Artifact metadata: title, type, original filename, size, uploaded by, created date, visibility, review status.
- Access check indicator for external links.
- Review note and revision state.
- Delete/replace rules tied to submission status.

Privacy rules:
- No public URLs for private uploads.
- Show "private to you and assigned staff" language.
- Staff-only notes must be visually separate.

Backlog link:
- Supports `SC-003`.

### Program Teacher Review Queue

Purpose:
- Make program-level review fast and intervention-oriented.

Primary layout:
- Filter bar: program, cohort, phase, status, overdue, mentor.
- Metric cards: awaiting review, revision loops, evidence risks, blocked, approved this week.
- Table/list of students and submissions.
- Right rail: top interventions and upcoming deadlines.

Row data:
- Student name.
- Program.
- Requirement.
- Status.
- Evidence count.
- Source count.
- Revision count.
- Last activity.
- Reviewer.
- Due date.
- Action button.

Actions:
- Open submission.
- Approve.
- Request revision.
- Flag not ambitious/specific enough.
- Comment.
- Escalate.

### Mentor Dashboard

Purpose:
- Help mentors manage assigned students without seeing unrelated records.

Must show:
- Assigned student list.
- Meeting status.
- Review queue.
- Presentation readiness.
- Students without recent evidence.
- Quick comment/review actions.

Special states:
- No assigned students.
- Missed meeting.
- Make-up needed.
- Outline approval needed.
- Presentation slot missing.

### Admin Overview

Purpose:
- Manage the whole cohort safely.

Must show:
- Program comparison.
- Review backlog by role.
- Missing mentor assignments.
- User provisioning issues.
- Export queue.
- Recent overrides.
- Audit-sensitive events.

Admin-only controls:
- Manage users.
- Assign roles.
- Manage programs/cohorts.
- Update deadlines.
- Export reports.
- View audit log.
- Apply audited override.

### Empty And Error States

Required empty states:
- No proposals yet.
- Filtered out.
- Waiting on review.
- Revision requested.
- No assigned students.
- No evidence uploaded.
- No export generated.
- No audit events found.

Required error states:
- Permission denied.
- Upload failed.
- External link cannot be accessed.
- Submission locked while under review.
- Session expired.
- Admin override requires reason.

## Figma Artifact Plan

The active writable file `z4t4tFPAKrMDh6pIYOeEw6` was created in `team::1638213362346160913` and preserves the same core three dense pages from the prior regenerated reference file, plus the new state-variant page:

1. `00 Master Plan + Foundations`
   - Product control center.
   - Role lane cards.
   - Color/status tokens.
   - Anti-drift rules.

2. `01 Components + App Screens`
   - Status pills.
   - Metric cards.
   - Submission cards.
   - Evidence rows.
   - Student home.
   - Program teacher review queue.
   - Mentor dashboard.
   - Admin overview.
   - Mobile student view.

3. `02 Automation Handoff`
   - First vertical slice flow.
   - Handoff cards for Figma, rebuild, audit, Canva.
   - Known limits.
   - Acceptance checks.

4. `03 Product Preview + State Variants`
   - Status system.
   - Student, teacher, mentor, and admin state slices.
   - Permission, upload, lock, resubmission, empty queue, and override states.
   - Review drawer variants, admin override modal, mobile student view, and rebuild mapping.

Active file structure from successful write calls:

- `00 Master Plan + Foundations`
  - Page ID: `0:1`
  - Primary frame: `Senior Capstone Product Control Center`, node `2:5`
- `01 Components + App Screens`
  - Page ID: `2:2`
  - Component count: 9
  - Primary frames:
    - `Senior Capstone Components + App Screens`, node `3:2`
    - `Screen / Student Home / Desktop`, node `3:66`
    - `Screen / Guided Proposal Form`, node `3:154`
    - `Screen / Program Teacher Review Queue`, node `3:190`
    - `Screens / Mentor + Admin Snapshots`, node `3:246`
    - `Screen / Student Home / Mobile`, node `3:301`
- `02 Automation Handoff`
  - Page ID: `2:3`
  - Primary frame: `Handoff Control Board`, node `5:2`
  - Lane handoff frame: `Lane Handoff Cards`, node `5:38`
- `03 Product Preview + State Variants`
  - Page ID: `2:4`
  - Primary frame: `Senior Capstone Product Preview + State Variants`, node `6:2`
  - Edge states: `Section / Permission Upload Lock Override States`, node `6:143`
  - Review drawer: `Component / Review Drawer`, node `6:198`
  - Admin override modal: `Modal / Admin Override Reason`, node `6:219`
  - Mobile student: `Screen / Student Product Preview / Mobile`, node `6:232`
  - Rebuild mapping: `Section / Rebuild Data Mapping`, node `6:257`
  - 100-pass MVP execution map: `Section / 100-Pass MVP Execution Map`, node `18:2`
  - Route/data contract nodes: `/student/progress`, `/teacher/review`, `/mentor/assigned`, `/admin/users`, and `/admin/audit`, nodes `18:44` through `18:47`
  - Review and admin override interaction variants: `Section / Review + Override Interaction Variants`, node `31:2`
  - Review/override developer handoff contract: node `31:144`
  - Private evidence and review-history contract: `Section / Private Evidence + Review History Contract`, node `37:2`
  - Private evidence developer handoff contract: node `37:177`
- `01 Components + App Screens`
  - MVP component variant implementation matrix: `Section / MVP Component Variant Implementation Matrix`, node `43:2`
  - `MVP / StatusPill` component set: node `43:55`
  - `MVP / ActionButton` component set: node `43:73`
  - `MVP / EvidenceArtifactRow` component set: node `43:149`
  - Shared UI developer handoff contract: node `43:150`

## 100-Pass MVP Execution Map

Bryan's professional-plan upgrade allowed a new implementation-facing section to be added directly to the active Figma file. Node `18:2` defines the pass budget as a product constraint: reach MVP in 100 automation passes or fewer over roughly 45 days without changing the accepted gold-standard automation cadence.

Pass lanes:
- `01-15`: Operating backbone, stack scaffold, database/auth/storage decisions, deployment path, and seed models.
- `16-35`: Secure records, permissions, private evidence, audit events, and protected student access.
- `36-55`: Admin progress slice, users/groups/programs/cohorts, trusted dashboard aggregates, and audit log.
- `56-75`: Proposal workflow, guided research sections, evidence upload/link, teacher review, revision, approval, and status history.
- `76-90`: Pilot hardening, empty/error states, exports, announcements, mobile-aware student states, and role QA.
- `91-100`: Launch polish, accessibility checks, Cloudflare preview/domain readiness, and human pilot checklist.

Route/data contract:
- `/student/progress`: own submissions, evidence, review feedback, section completeness, and next action; student self-scope only.
- `/teacher/review`: program/cohort queue, revision/approval action, evidence count, source count, and review state; teacher program/cohort scope.
- `/mentor/assigned`: assigned students, meetings, presentation prep, and safe comments; assigned-student scope only.
- `/admin/users`: users, groups, roles, cohorts, assignments, provisioning, and override controls; admin-only with audit events.
- `/admin/audit`: sensitive actions, exports, role changes, overrides, evidence access, and retention/export controls; admin/audit permission only.

Every rebuild route that consumes this section should name persisted data, server authorization, loading/error/permission states, audit events, and tests before it is counted as implemented.

## Review And Override Interaction Variants

Node `31:2` deepens the MVP review/approval slice with developer-ready states for the teacher review drawer and admin override modal.

Teacher review drawer states:
- `Default Evidence Loaded`, node `31:21`
- `Request Revision Draft`, node `31:36`
- `Submitting Decision`, node `31:49`
- `Success Logged`, node `31:60`
- `Permission Denied`, node `31:71`

Admin override modal states:
- `Missing Reason Disabled`, node `31:85`
- `Valid Reason Ready`, node `31:96`
- `Submitting Override`, node `31:109`
- `Audit Event Preview`, node `31:120`
- `Rollback Error`, node `31:131`

Developer contract:
- Routes: `/teacher/review/:submissionId`, `/admin/submissions/:id/override`, `/admin/audit`
- Records: `ReviewDecision`, `OverrideRequest`, `AuditEvent`, `Submission`, `EvidenceArtifact`, `UserGroupRole`
- Guardrails: private evidence remains role-scoped, no student-to-student messaging, override reason is required, and audit is captured before status transition.
- Acceptance checks: audit-first state changes, required admin reason, private-evidence authorization, and default/invalid/loading/success/permission/error state coverage.

## Private Evidence And Review History Contract

Node `37:2` deepens `SC-003` and the secure records pass lane with implementation-facing states for upload/link evidence, access checks, permission handling, immutable review history, and archive readiness.

Evidence lifecycle states:
- `Draft Attached`, node `37:21`
- `Upload Scanning`, node `37:34`
- `External Link Check`, node `37:45`
- `Submitted Locked`, node `37:56`
- `Reviewer Redacted`, node `37:69`
- `Approved For Archive`, node `37:82`

Permission and history structures:
- `Permission Matrix / Evidence Access`, node `37:94`
- `Review History Timeline`, node `37:132`
- `Developer Handoff / Evidence Data Route Contract`, node `37:177`
- `Evidence Acceptance Checks`, node `37:201`

Developer contract:
- Routes: `/student/evidence`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, `/admin/audit`
- Records: `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, `StudentArchiveExport`
- Guardrails: `storage_key` is never rendered to clients, signed URLs are time boxed, external links get access checks, review history is immutable, and unauthorized evidence access logs an audit denial.
- Acceptance checks: no public storage keys, signed URL expiry, link access check, immutable history, and unauthorized audit event tests.

## MVP Component Variant Implementation Matrix

Node `43:2` deepens the shared UI system so rebuild can implement common components before hard-coding page-specific statuses, action buttons, or private evidence rows.

Component sets:
- `MVP / StatusPill`, node `43:55`, with 11 variants: Draft, Submitted, Under Review, Revision Requested, Approved, Blocked, Overridden, Archived, Access Denied, Upload Scanning, and Link Check Needed.
- `MVP / ActionButton`, node `43:73`, with 7 variants: Primary Submit, Secondary Save Draft, Danger Override, Disabled Pending, Loading Submit, Permission Blocked, and Retry.
- `MVP / EvidenceArtifactRow`, node `43:149`, with 8 variants: Draft Upload, Scanning, External Link Check, Submitted Locked, Revision Requested, Reviewer Redacted, Approved Archive, and Failed Upload.

Developer contract:
- Shared components: `StatusPill`, `ActionButton`, `EvidenceArtifactRow`, `PermissionGate`, and `ReviewHistoryItem`.
- Routes/API: `/student/progress`, `/student/evidence`, `/teacher/review`, `/admin/users`, `/admin/audit`, and `/api/evidence/:id/check-access`.
- Records: `Submission`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, `UserGroupRole`, and `StudentArchiveExport`.
- Guardrails: status uses text plus color, private storage keys stay hidden, signed URLs are time-boxed, overrides and denials are audited, disabled/loading layouts stay stable, and no student messaging is introduced.
- Acceptance checks: all variants include accessible labels, unauthorized users never see private fields, audit event IDs are available for sensitive actions, mobile labels fit without overlap, and tests cover denied, loading, error, retry, and revision states.

## Admin Account And Group Provisioning Contract

Node `48:2` deepens the MVP admin foundation so rebuild can scaffold secure users, groups, roles, cohorts, assignments, scoped misc-admin permissions, and audit events without guessing the first admin workflow.

Provisioning states:
- `User Import Draft`
- `Role Assignment Ready`
- `Program + Cohort Scope`
- `Assignment Conflict`
- `Saving Provisioning Change`
- `Audit Logged Success`
- `Permission Denied`
- `Misc Admin Narrow Scope`

Developer contract:
- Handoff node: `48:208`
- Routes/API: `/admin/users`, `/admin/groups`, `/admin/programs`, `/admin/cohorts`, `/admin/audit`, `/api/admin/users/import`, `/api/admin/role-assignments`, and `/api/admin/mentor-assignments`.
- Records: `User`, `UserRole`, `StudentProfile`, `StaffProfile`, `Group`, `GroupMembership`, `Program`, `Cohort`, `MentorAssignment`, `StaffProgramAssignment`, `Permission`, and `AuditEvent`.
- Guardrails: server-side authorization is required, misc admin has no broad default access, duplicate imports are blocked before submit, save requests are idempotent, protected student records never leak through denial states, and no student messaging is introduced.
- Acceptance checks: denied role edit, valid assignment, duplicate import, audit event persistence, dashboard scope update, and misc-admin narrow-scope tests.

## Mobile Evidence And Revision Workflow Contract

Node `56:2` deepens the mobile student implementation path for private evidence and revision loops without changing MVP scope into a native app. It shows the responsive web states rebuild must support at a 390px mobile viewport.

Mobile states:
- `Mobile State / Revision Checklist`, node `56:8`
- `Mobile State / Evidence Upload`, node `56:37`
- `Mobile State / Submit Blocked`, node `56:66`
- `Mobile State / Access Recovery`, node `56:91`

Developer contract:
- Handoff node: `56:114`
- Routes/API: `/student/evidence`, `/student/submissions/:submissionId/revise`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, and `/admin/audit`.
- Records: `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, `UserGroupRole`, `RequirementSection`, and `Deadline`.
- Guardrails: mobile UI is a thin view over trusted server/database state, submit remains disabled while evidence is blocked/scanning/link-check-needed, storage keys are never exposed, denied evidence access is audited, and offline draft behavior cannot become the source of truth for protected records.
- Acceptance checks: 390px mobile layout has no horizontal overflow, revision checklist is derived from persisted review/comment data, upload/link actions require server authorization, access denied creates an audit event, and no student messaging is introduced.

## Progress Update And Dashboard Aggregate Contract

Node `61:2` closes a first-MVP implementation gap by specifying how progress changes become trusted role-dashboard counts. It is intentionally code-facing: the server validates scope, persists progress/status history, writes audit records, handles stale conflicts, and recalculates dashboard aggregates from saved rows.

Progress/dashboard states:
- `Student Progress Update Draft`
- `Staff Progress Adjustment`
- `Status History Persisted`
- `Dashboard Aggregate Recalculated`
- `Conflict + Audit Visible`

Developer contract:
- Handoff node: `61:113`
- Routes/API: `/student/progress`, `/api/progress-updates`, `/api/submissions/:id/status`, `/teacher/dashboard`, `/mentor/dashboard`, `/admin/dashboard`, and `/admin/audit`.
- Records: `ProgressUpdate`, `StatusHistory`, `RequirementProgress`, `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `DashboardAggregate`, `DashboardSnapshot`, `AuditEvent`, `UserGroupRole`, `Requirement`, and `Deadline`.
- Guardrails: status transitions are server-owned, no `localStorage` source of truth, dashboard counts derive from persisted rows, stale writes return conflict states, audit writes precede visible sensitive state changes, and no student messaging is introduced.
- Acceptance checks: allowed self-update persists progress/history, unauthorized update is denied and audited, stale writes do not change aggregates, aggregates link to source records, private evidence storage keys never render in dashboards, and audit events persist for status/staff/override/export-sensitive reads.

## Audit Log And Export Controls Contract

Node `69:2` deepens the security and records side of the MVP by specifying the audit-log review and export/archive control surface. It is implementation-facing: audit events are immutable, sensitive details are redacted, exports require explicit reason and scope, download links expire, denied access is audited, and retention-policy values stay configurable until school policy is confirmed.

Audit/export states:
- `Audit Stream Filtered`
- `Sensitive Event Detail`
- `Export Request Draft`
- `Export Queued + Ready`
- `Permission Denied + Retention Review`

Developer contract:
- Handoff node: `69:180`
- Routes/API: `/admin/audit`, `/api/audit-events`, `/api/audit-events/:id`, `/admin/exports`, `/api/exports/student-archive`, `/api/exports/:id/download`, and `/student/archive`.
- Records: `AuditEvent`, `AuditEventView`, `ExportRequest`, `StudentArchiveExport`, `ExportArtifact`, `EvidenceArtifact`, `Submission`, `StudentProfile`, `UserGroupRole`, `Program`, `Cohort`, and `RetentionPolicy`.
- Guardrails: audit events are append-only, export requires reason/scope/explicit permission, signed downloads expire, storage keys never render, view/export/download/denied actions write audit events, misc-admin access stays explicitly scoped, retention values are configurable, and no student messaging is introduced.
- Acceptance checks: audit stream filtering by actor/entity/student/program/cohort/date/event type, sensitive detail redaction, denied export without reason/scope/permission, expiring signed archive download, student own-archive-only access, misc-admin scoped export limits, and audit events for request/download/view/denied access.

## Mentor Meeting And Presentation Scheduling Contract

Node `78:2` deepens `SC-004` by specifying how Mentor Meeting One, Mentor Meeting Two, outline approval, presentation scheduling, and presentation day logistics become database-backed, permission-scoped records. It is implementation-facing: meeting prep remains private evidence, attendance and make-up are persisted, outline approval is a review gate, slot conflicts block saves, check-out/check-in changes are audited, and mentor visibility stays assigned-student only.

Meeting/presentation states:
- `Meeting Prep Ready`
- `Attendance Recorded`
- `Make-up Required`
- `Outline Approval Gate`
- `Presentation Slot Conflict`
- `Check-out Check-in Ready`

Developer contract:
- Handoff node: `78:166`
- Routes/API: `/mentor/meetings`, `/mentor/assigned`, `/api/meetings/:id/attendance`, `/student/mentor-meetings`, `/student/presentation`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-in`, `/teacher/dashboard`, and `/admin/audit`.
- Records: `Meeting`, `MeetingAttendance`, `MentorAssignment`, `PresentationSlot`, `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Requirement`, `Deadline`, `AuditEvent`, `StudentProfile`, and `UserGroupRole`.
- Guardrails: mentors see assigned students only, attendance and slot changes write audit events, make-up records preserve the original missed meeting, outline approval is a review gate rather than a checkbox, slot conflicts block duplicate saves, check-out/check-in ties to the presentation slot, and no student messaging is introduced.
- Acceptance checks: unassigned mentor denial, missed meeting creates make-up requirement, outline approval persists review/status history, duplicate slot save is blocked, day-of check-out/check-in writes audit events, students see only their own meeting/presentation records, and dashboards derive state from persisted rows.

## Review History Prototype Alignment

The 2026-05-20 Figma pass aligned the full MVP alpha prototype with the implemented review-history path after rebuild added comments and immutable submission versions.

- `Prototype / 06 / Review detail and decision drawer`, node `98:9`, now annotates `/teacher/reviews/:id` plus `/api/reviews/:submissionId/history` and records `submissions`, `reviews`, `comments`, `status_history`, `submission_versions`, and `evidence_artifacts`.
- `Prototype / 07 / Student revision loop`, node `98:10`, now annotates `/student/submissions/:id/revision` plus `/api/reviews/:submissionId/history` and records `reviews`, `comments`, `status_history`, `submission_versions`, `evidence_artifacts`, and `requirement_sections`.
- Both frames preserve the protected-record rule: students see only their own feedback/history, reviewer/admin decisions stay scoped, storage IDs remain redacted, and audit events persist for review-sensitive changes.
- `get_design_context` and `get_screenshot` succeeded for nodes `98:9` and `98:10` after the annotation and layout corrections; the `use_figma` readback found zero suspicious clipped text nodes in both frames.

## Full Alpha Handoff Consumption Update

The 2026-05-20 12:35 PT Figma pass updated the full MVP alpha prototype handoff frame after rebuild consumed the review-history alignment in the primary alpha console.

- `Prototype / 14 / Route and implementation handoff`, node `98:17`, now records `review_history_consumed_at` in the handoff records row and states that review history is consumed in the primary alpha console.
- The acceptance checklist now points the next rebuild focus at mentor, presentation, and admin depth instead of repeating review-history UI work.
- The handoff frame preserves the route/data/permission boundary: Figma is design handoff only; production permissions stay in API middleware, D1 policy checks, audit events, and storage-ID redaction.
- Layout QA corrected the compact no-student-messaging sidebar card and acceptance-check header widths; `use_figma` readback found zero suspicious clipped text nodes.
- `get_design_context` and `get_screenshot` succeeded for node `98:17`; screenshot verification returned `1024x648` from original `1360x860`.

## Production App And Public Guide Boundary Handoff

The 2026-05-20 16:41 PT Figma pass added a production-boundary handoff after rebuild created the canonical authenticated workspace and public Student/Teacher guide mode.

- `Prototype / 15 / Production app and public guide boundary`, node `124:2`, distinguishes public guide-mode content from authenticated workspace app behavior.
- Public website annotations name `/` and generated `public-companion/` as public content surfaces: the Student/Teacher toggle changes emphasis only, may use localStorage only as a display preference, and must not imply auth, account state, private records, or stakeholder-option guide modes.
- Authenticated workspace annotations name `/workspace`, `/workspace.html`, `/api/auth/me`, `/api/student/dashboard`, `/api/submissions/:id/evidence`, and `/api/submissions/:id/evidence/upload` with records `User`, `UserRole`, `StudentProfile`, `Submission`, `EvidenceArtifact`, `Review`, `AuditEvent`, `Program`, and `Cohort`.
- Permission annotations cover signed-out, student own workspace, mentor assigned scope, program-teacher scope, admin ops, misc-admin explicit scope, no-role pending, permission denied, Drive-missing, and unsupported-upload states.
- Shared plugin data key `senior_capstone/production_boundary_contract_2026_05_20` records 7 routes, 9 records, 6 permission scopes, 6 guardrails, and the current Drive/Cloudflare setup blockers.
- `get_design_context` and `get_screenshot` succeeded for node `124:2`; screenshot verification returned `800x1024` from original `1360x1742`, and final `use_figma` readback found zero suspicious clipped text nodes and zero child overflow.

## Production Route Inventory Consumption Update

The 2026-05-21 02:50 PT Figma pass updated the existing production-boundary handoff after non-Figma generated route inventory proof landed for the canonical workspace route.

- `Prototype / 15 / Production app and public guide boundary`, node `124:2`, now states that `workspace.html` is repo-classified as `senior-capstone-app` / `production` / `conditional` and is the protected production app route.
- Updated text nodes: `124:5`, `124:12`, `124:52`, `124:71`, `124:140`, `124:146`, `124:147`, and `124:150`.
- Shared plugin data key `senior_capstone/production_route_inventory_consumption_2026_05_21` records consumed commit `b318eb146c8be4aac41fec3cca2adc817a01ec91`, manifest `docs/progress/runs/2026-05-21-0233-workspace-route-inventory-mvp-032.json`, three consumed route-inventory proof points, and four remaining implementation proof items.
- Remaining rebuild focus is hosted account-state/no-assignment marker proof, live section-level permission-denied browser proof, Drive upload/download after the redacted Google Drive HTTP 403 is fixed, and real-user setup credential delivery policy before pilot imports.
- Final `use_figma` readback found 79 text nodes, zero collapsed text nodes, zero suspicious clipped text nodes, and zero direct-child overflow. `get_design_context` and `get_screenshot` succeeded for node `124:2`; screenshot verification returned `783x1024` from original `1360x1779`.

## Workspace Account Edge-State Handoff

The 2026-05-20 17:37 PT Figma pass added a workspace account edge-state handoff after rebuild consumed the production-boundary handoff for role-pending and permission-denied workspace states.

- `Prototype / 16 / Workspace account edge-state handoff`, node `133:2`, covers account and scope states that still need browser/UI proof in the canonical `/workspace` route.
- State annotations cover `session_expired`, `account_disabled`, `reset_required`, `role_pending`, `no_active_assignment`, and `section_permission_denied`.
- Route annotations name `/workspace`, `/workspace.html`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/student/dashboard`, `/api/mentor/assigned`, `/api/teacher/review-queue`, and `/api/reports/readiness`.
- Record annotations name `User`, `UserCredential`, `Session`, `UserRole`, `StudentProfile`, `StaffProfile`, `MentorAssignment`, `StaffProgramAssignment`, and `AuditEvent`.
- Shared plugin data key `senior_capstone/workspace_account_edge_contract_2026_05_20` records 6 states, 9 routes, 9 records, 6 guardrails, and the next rebuild action for disabled/reset-required/no-assignment/session-expired workspace UI proof.
- The first readback found zero-width text and an oversized `41066px` auto-layout height; a layout correction fixed text widths and reduced the frame to `1360x1568`.
- Final `use_figma` readback found 58 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 9 routes, 9 records, and 6 guardrails. `get_design_context` and `get_screenshot` succeeded for node `133:2`; screenshot verification returned `889x1024` from original `1360x1568`.

## Presentation Dashboard State Handoff

The 2026-05-20 18:33 PT Figma pass added a presentation dashboard state handoff after rebuild implemented presentation slot scheduling plus check-out/check-in endpoints.

- `Prototype / 17 / Presentation dashboard state handoff`, node `139:2`, maps existing presentation-slot APIs into dashboard-facing student, mentor, teacher, admin, denied-action, empty, and loading states.
- State annotations cover `student_slot_scheduled`, `mentor_assigned_risk`, `teacher_day_of_queue`, `admin_conflict_review`, `permission_denied_action`, and `empty_loading_surface`.
- Route annotations name `/student/presentation`, `/mentor/assigned`, `/teacher/dashboard`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-out`, `/api/presentation-slots/:id/check-in`, and `/admin/audit`.
- Record annotations name `PresentationSlot`, `MeetingAttendance`, `MentorAssignment`, `StaffProgramAssignment`, `Review`, `Submission`, `StudentProfile`, and `AuditEvent`.
- Shared plugin data key `senior_capstone/presentation_dashboard_state_contract_2026_05_20` records 6 states, 7 routes, 8 records, 6 guardrails, and the next rebuild action for surfacing presentation status, conflict, check-out, and check-in states in canonical dashboards.
- The first write succeeded but visual QA found cramped compact action labels; a follow-up layout correction converted those rows to stacked content.
- Final `use_figma` readback found zero suspicious clipped text nodes and zero child overflow. `get_design_context` and `get_screenshot` succeeded for node `139:2`; screenshot verification returned `717x1024` from original `1360x1943`.

## Celebration Archive Readiness Handoff

The 2026-05-20 20:18 PT Figma pass added a celebration, portfolio, reflection, and archive readiness handoff after rebuild consumed the presentation dashboard state handoff.

- `Prototype / 18 / Celebration archive readiness handoff`, node `144:2`, maps final closeout readiness, May 5 archive/export, signed download, and permission-denied states to implementation-facing routes and records.
- State annotations cover `Celebration evidence missing`, `Ingredient list required`, `Thank-you + mentor note pending`, `Reflection and portfolio ready`, `Archive request ready`, `Export download expired`, and `Permission denied for archive`.
- Route annotations name `/student/celebration`, `/student/portfolio`, `/student/archive`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/exports/student-archive`, `/api/exports/:id/download`, and `/admin/audit`.
- Record annotations name `EvidenceArtifact`, `Submission`, `SubmissionVersion`, `Review`, `Comment`, `Requirement`, `RequirementProgress`, `Deadline`, `StudentArchiveExport`, `ExportRequest`, `ExportArtifact`, `AuditEvent`, `RetentionPolicy`, and `UserGroupRole`.
- Shared plugin data key `senior_capstone/celebration_archive_readiness_contract_2026_05_20` records 7 states, 8 routes, 14 records, 5 permission scopes, 7 guardrails, and 7 acceptance checks.
- Initial readback found fixed-height rows clipping child cards; a follow-up `use_figma` correction changed those rows to autosize and expanded the frame to `1360x2218`.
- Final `use_figma` readback found 87 text nodes, zero suspicious clipped text nodes, and zero child overflow. `get_design_context` and `get_screenshot` succeeded for node `144:2`; screenshot verification returned `628x1024` from original `1360x2218`.

## Archive Provider And Retention Handoff

The 2026-05-20 21:17 PT Figma pass added an archive provider, signed-link, and retention-policy handoff after rebuild added scoped JSON archive manifests and expired-download behavior.

- `Prototype / 19 / Archive provider and retention handoff`, node `149:2`, deepens the remaining archive/export implementation gap after node `144:2`.
- State annotations cover `drive_credentials_missing`, `provider_unavailable_retry`, `generation_queued`, `scoped_package_ready`, `retention_window_expiring`, and `policy_review_required`.
- Route annotations name `/api/admin/exports/student-archive`, `/api/exports/:id/download`, `/api/student/archive/readiness`, `/api/evidence/drive-probe`, `/api/submissions/:id/evidence/upload`, and `/admin/audit`.
- Record annotations name `ExportRequest`, `StudentArchiveExport`, `ExportArtifact`, `EvidenceArtifact`, `EvidenceRepository`, `AuditEvent`, `RetentionPolicy`, `UserGroupRole`, `RequirementProgress`, and `Deadline`.
- Shared plugin data key `senior_capstone/archive_provider_retention_contract_2026_05_20` records 6 states, 6 routes, 10 records, 5 permission scopes, 6 guardrails, 7 acceptance checks, and the current Cloudflare/Drive blockers.
- `use_figma` created node `149:2` and returned 108 text nodes, zero suspicious clipped text nodes, and zero overflow. `get_design_context` and `get_screenshot` succeeded for node `149:2`; screenshot verification returned `706x1024` from original `1360x1975`.

## Drive Archive Delivery Handoff

The 2026-05-20 21:48 PT Figma pass added a Drive-backed archive delivery and hosted-proof handoff after rebuild partially consumed node `149:2` by provider-gating archive generation and rendering retention state.

- `Prototype / 20 / Drive archive delivery handoff`, node `151:2`, deepens the remaining package-delivery gap after node `149:2`.
- State annotations cover `credentials_configured`, `package_assembly_to_drive`, `signed_link_issued`, `student_download_started`, `expired_link_retry`, and `hosted_proof_required`.
- Route annotations name `/api/admin/exports/student-archive`, `/api/exports/:id/download`, `/api/student/archive/readiness`, `/api/evidence/drive-probe`, and `/admin/audit`.
- Record annotations name `ExportRequest`, `StudentArchiveExport`, `ExportArtifact`, `EvidenceArtifact`, `EvidenceRepository`, `AuditEvent`, `RetentionPolicy`, `UserGroupRole`, `RequirementProgress`, and `Deadline`.
- Shared plugin data key `senior_capstone/drive_archive_delivery_contract_2026_05_20` records 6 states, 5 routes, 10 records, 5 permission scopes, 6 guardrails, and 6 acceptance checks.
- `use_figma` created node `151:2` and returned 102 text nodes, zero suspicious clipped text nodes, and zero child overflow. `get_design_context` and `get_screenshot` succeeded for node `151:2`; screenshot verification returned `684x1024` from original `1360x2038`.

## Credential Lifecycle Handoff

The 2026-05-21 00:22 PT Figma pass added a credential lifecycle handoff after rebuild added reset-required completion, admin reset initiation, and active-user password change.

- `Prototype / 21 / Credential lifecycle handoff`, node `153:2`, deepens account lifecycle implementation after node `133:2` clarified broad workspace account edge states.
- State annotations cover `admin_reset_requested`, `reset_completion_form`, `password_changed_session_rotated`, `invalid_current_password`, `weak_or_reused_password`, and `stale_session_revoked`.
- Route annotations name `/workspace`, `/api/auth/login`, `/api/auth/me`, `/api/auth/complete-reset`, `/api/auth/change-password`, `/api/admin/users/:id/require-password-reset`, and `/admin/audit`.
- Record annotations name `User`, `UserCredential`, `Session`, `UserRole`, and `AuditEvent`.
- Shared plugin data key `senior_capstone/credential_lifecycle_contract_2026_05_21` records 6 states, 7 routes, 5 records, 6 guardrails, and the next rebuild action for invitation/import, generated or temporary credential policy, hosted reset/change proof, admin reset initiation proof, stale-session fallback, and redacted audit checks.
- Initial readback found compact chip width and 4px row overflow issues; a targeted `use_figma` correction fixed chip sizing and state-row spacing.
- Final `use_figma` readback found 59 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 7 routes, 5 records, and 6 guardrails. `get_design_context` and `get_screenshot` succeeded for node `153:2`; screenshot verification returned `868x1024` from original `1360x1605`.

## Admin Import Temporary Credential Handoff

The 2026-05-21 00:54 PT Figma pass added an admin import and temporary credential handoff after rebuild added `/api/admin/users/import` with generated pending-reset credentials.

- `Prototype / 22 / Admin import temporary credential handoff`, node `158:2`, deepens the account import and generated credential gap after node `153:2`.
- State annotations cover `Import batch draft`, `Validation errors`, `Pending reset created`, `One-time credential display`, `Delivery policy needed`, and `Permission denied audit`.
- Route annotations name `/admin/users`, `/api/admin/users/import`, `/api/admin/role-assignments`, `/api/admin/users/:id/require-password-reset`, `/api/auth/complete-reset`, `/workspace`, and `/admin/audit`.
- Record annotations name `User`, `UserCredential`, `UserRole`, `Program`, `Cohort`, `StaffProfile`, `StudentProfile`, `Session`, and `AuditEvent`.
- Permission annotations distinguish admin `users.manage`, optional future misc-admin `users.manage`, student/mentor/teacher denial, and signed-out denial.
- Shared plugin data key `senior_capstone/admin_import_temp_credential_contract_2026_05_21` records 6 states, 7 routes, 9 records, 4 permission scopes, 6 guardrails, and 5 acceptance checks.
- Guardrails specify that temporary credentials are shown once only, credential values never appear in audit metadata/Figma/docs/screenshots/chat, pending-reset users complete reset before role dashboards, duplicate/invalid-scope rows block submit, and fake `.test` proof is the only accepted proof data.
- Final `use_figma` readback found 59 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 7 routes, 9 records, 4 permission scopes, 6 guardrails, and 5 acceptance checks. `get_design_context` and `get_screenshot` succeeded for node `158:2`; screenshot verification returned `814x1024` from original `1360x1712`.

## Admin Import Proof QA Handoff

The 2026-05-21 01:23 PT Figma pass added a proof QA handoff after rebuild consumed node `158:2` into the canonical workspace admin import UI.

- `Prototype / 23 / Admin import proof QA handoff`, node `163:2`, turns the admin import handoff into concrete fake-account proof states.
- State annotations cover `hosted_admin_form_loaded`, `validation_errors_blocked`, `import_success_no_store`, `reset_first_login_required`, `denied_role_attempt`, and `refresh_and_stale_session_safety`.
- Route annotations name `/workspace`, `/api/auth/me`, `/api/admin/users/import`, `/api/auth/login`, `/api/auth/complete-reset`, `/api/auth/change-password`, `/api/admin/audit-events`, and `/admin/audit`.
- Record annotations name `User`, `UserCredential`, `UserRole`, `Session`, `Program`, `Cohort`, `StaffProfile`, `StudentProfile`, and `AuditEvent`.
- UI marker annotations name `data-admin-action="import-users"`, `data-admin-import-result="one-time-setup-passwords"`, `data-auth-action="complete-reset"`, `data-auth-action="change-password"`, and `data-workspace-state="permission-denied"`.
- Shared plugin data key `senior_capstone/admin_import_proof_qa_contract_2026_05_21` records 6 states, 8 routes, 9 records, 5 UI markers, 6 guardrails, and 5 acceptance checks.
- Initial readback found collapsed text heights; a targeted text-height correction fixed all collapsed nodes. Final `use_figma` readback found 49 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 8 routes, 9 records, 5 UI markers, 6 guardrails, and 5 acceptance checks. `get_design_context` and `get_screenshot` succeeded for node `163:2`; screenshot verification returned `985x1024` from original `1360x1414`.
- The 2026-05-21 01:49 PT Figma pass updated node `163:2` after reset-first API proof landed in the repo. Shared plugin data now records `apiProofConsumedAt=2026-05-21T01:37:00-07:00`, 7 consumed API proof points, and 7 remaining browser proof checks. `use_figma` updated 11 text nodes with zero collapsed text and zero overflow; `get_design_context` and `get_screenshot` succeeded, with screenshot verification returning `1007x1024` from original `1360x1384`.

## Student Dashboard Access Audit Handoff

The 2026-05-21 03:24 PT Figma pass added a student dashboard protected-access audit handoff after rebuild proved route-level `/api/student/dashboard` audit behavior.

- `Prototype / 24 / Student dashboard access audit handoff`, node `173:2`, turns the student dashboard access audit into route/data/permission implementation guidance.
- State annotations cover signed-out request, student own dashboard viewed, student-other denied, mentor active assignment, program-teacher scoped cohort, and admin-allowed/misc-admin-denied behavior.
- Route annotations name `/api/student/dashboard`, `/api/auth/me`, `/workspace`, `/admin/audit`, and future `/api/audit-events` readback.
- Record annotations name `User`, `UserRole`, `StudentProfile`, `StaffProfile`, `MentorAssignment`, `StaffProgramAssignment`, `Program`, `Cohort`, `RequirementProgress`, `Submission`, `EvidenceArtifact`, and `AuditEvent`.
- Audit annotations name `student_dashboard_unauthorized`, `student_dashboard_denied`, and `student_dashboard_viewed`; guardrails require redacted metadata and no Drive storage identifiers in UI, logs, screenshots, Figma, or docs.
- Shared plugin data key `senior_capstone/student_dashboard_access_audit_contract_2026_05_21` records consumed run `2026-05-21-0306-student-dashboard-access-audit-mvp-006`, consumed commit `d8eb8c95b56406c0c8c051ea0d55876986112567`, 5 permission scopes, 5 guardrails, and 4 acceptance checks.
- Initial readback found fixed-height rows and clipped 10px text; targeted autosizing and text-height corrections expanded the frame to `1360x1455`. Final `use_figma` readback found 49 text nodes, zero suspicious clipped text nodes, and zero child overflow. `get_design_context` and `get_screenshot` succeeded for node `173:2`; screenshot verification returned `958x1024` from original `1360x1455`.

## Teacher Review Queue Access Audit Handoff

The 2026-05-21 03:52 PT Figma pass added a teacher review queue access audit handoff after rebuild proved route-level `/api/teacher/review-queue` audit and empty-scope default-deny behavior.

- `Prototype / 25 / Teacher review queue access audit handoff`, node `178:2`, turns the teacher review queue scope audit into route/data/permission implementation guidance.
- State annotations cover signed-out queue request, misc-admin denied role, empty program-scope no-leak behavior, scoped program-teacher queue visibility, admin inspection, and queue-row privacy.
- Route annotations name `/api/teacher/review-queue`, `/teacher/reviews`, `/workspace`, `/admin/audit`, `/api/audit-events`, `/api/reviews/:submissionId/history`, and `/api/reviews/:submissionId/decision`.
- Record annotations name `User`, `UserRole`, `StaffProfile`, `StaffProgramAssignment`, `Program`, `Cohort`, `Group`, `StudentProfile`, `Submission`, `Review`, `Comment`, `RequirementProgress`, and `AuditEvent`.
- Audit annotations name `review_queue_unauthorized`, `review_queue_denied`, and `review_queue_viewed`; guardrails require default-deny empty scopes, redacted actor metadata, no private evidence bodies, no Drive/storage identifiers, and fake `.test` proof only.
- Shared plugin data key `senior_capstone/teacher_review_queue_scope_audit_contract_2026_05_21` records consumed run `2026-05-21-0336-teacher-review-queue-scope-audit-mvp-015`, consumed commits `0920bf2d33af753817700439bf44374655c57958` and `2e0ac3262c9252bd1d98358ac97d6c420ab30df9`, 6 states, 7 routes, 13 records, 5 permission scopes, 5 guardrails, and 4 acceptance checks.
- Initial `use_figma` write failed atomically on an invalid divider `HUG` sizing assignment before creating canvas nodes; the corrected write created node `178:2`. Final readback found 49 text nodes, zero suspicious clipped text nodes, zero child overflow, and zero collapsed frames. `get_design_context` and `get_screenshot` succeeded for node `178:2`; screenshot verification returned `1010x1024` from original `1360x1379`.

## Review History And Decision Access Audit Handoff

The 2026-05-21 04:22 PT Figma pass added a review history and review decision access audit handoff after rebuild proved `/api/reviews/:submissionId/history` and `/api/reviews/:submissionId/decision` protected-record audits.

- `Prototype / 26 / Review history and decision access audit handoff`, node `180:2`, turns review endpoint audit proof into route/data/permission implementation guidance.
- State annotations cover history signed-out, history scope denied, history viewed counts, decision signed-out, decision scope denied, and decision success audited behavior.
- Route annotations name `/api/reviews/:submissionId/history`, `/api/reviews/:submissionId/decision`, `/api/teacher/review-queue`, `/workspace`, `/admin/audit`, and `/api/audit-events`.
- Record annotations name `User`, `UserRole`, `StaffProfile`, `StaffProgramAssignment`, `StudentProfile`, `Submission`, `SubmissionVersion`, `Review`, `Comment`, `RequirementProgress`, `EvidenceArtifact`, and `AuditEvent`.
- Audit annotations name `review_history_unauthorized`, `review_history_denied`, `review_history_viewed`, `review_decision_unauthorized`, `review_decision_denied`, `submission_approved`, `submission_revision_requested`, and `submission_review_comment_added`.
- Shared plugin data key `senior_capstone/review_history_decision_access_audit_contract_2026_05_21` records consumed run `2026-05-21-0405-review-history-decision-audit-mvp-015`, consumed commits `d083100cd9cc501643217d627948026be4753f24` and `737fbc1`, 6 states, 6 routes, 12 records, 5 guardrails, and 4 acceptance checks.
- Initial readback found collapsed text heights from the first write; targeted layout correction expanded the frame to `1360x1463`. Final `use_figma` readback found 50 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 6 routes, and 8 audit events. `get_design_context` and `get_screenshot` succeeded for node `180:2`; screenshot verification returned `952x1024` from original `1360x1463`.

## Evidence Link Access Audit Handoff

The 2026-05-21 04:54 PT Figma pass added an evidence-link access audit handoff after rebuild proved `/api/submissions/:id/evidence` protected metadata attach audits.

- `Prototype / 27 / Evidence link access audit handoff`, node `183:2`, turns evidence-link attach audit proof into route/data/permission implementation guidance.
- State annotations cover signed-out attach request, cross-student attach denied, staff attach-route denied, student link metadata stored, no Drive identifier leakage, and file-byte blocker separate.
- Route annotations name `/api/submissions/:id/evidence`, `/student/evidence`, `/workspace`, `/api/evidence/:id/check-access`, `/api/submissions/:id/evidence/upload`, `/api/evidence/:id/download`, and `/admin/audit`.
- Record annotations name `User`, `UserRole`, `Session`, `Submission`, `EvidenceArtifact`, `EvidenceRepository`, `Review`, `Comment`, `RequirementProgress`, and `AuditEvent`.
- Audit annotations name `evidence_attach_unauthorized`, `evidence_attach_denied`, and `evidence_link_attached`.
- Shared plugin data key `senior_capstone/evidence_link_access_audit_contract_2026_05_21` records consumed run `2026-05-21-0439-evidence-link-access-audit-mvp-013`, consumed commits `7dd04d67039c0473a62d9a95b3ff05298bb36c72` and `29146c3e3b148a67237a0215901c4572c809ba67`, 6 states, 7 routes, 10 records, 5 permission scopes, 6 guardrails, and 5 acceptance checks.
- Initial readback found collapsed text heights from the first write; targeted text-height correction expanded the frame to `1360x1434`. Final `use_figma` readback found 50 text nodes, zero suspicious clipped text nodes, and zero child overflow. `get_design_context` and `get_screenshot` succeeded for node `183:2`; screenshot verification returned `972x1024` from original `1360x1434`.

## Submission Submit Access Audit Handoff

The 2026-05-21 05:30 PT Figma pass added a submission-submit access audit handoff after rebuild proved `/api/submissions/:id/submit` protected submit audits.

- `Prototype / 28 / Submission submit access audit handoff`, node `187:2`, turns student-owned submit audit proof into route/data/permission implementation guidance.
- State annotations cover signed-out submit request, cross-student submit denied, staff submit route denied, missing evidence blocks submit, successful submit snapshots version, and immutable review-loop handoff behavior.
- Route annotations name `/api/submissions/:id/submit`, `/student/submissions/:id`, `/workspace`, `/api/reviews/:submissionId/history`, `/admin/audit`, and `/api/audit-events`.
- Record annotations name `User`, `UserRole`, `Session`, `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `RequirementProgress`, `Review`, `Comment`, and `AuditEvent`.
- Audit annotations name `submission_submit_unauthorized`, `submission_submit_denied`, `submission_submit_blocked_missing_evidence`, and `submission_submitted`.
- Shared plugin data key `senior_capstone/submission_submit_access_audit_contract_2026_05_21` records consumed run `2026-05-21-0506-submission-submit-access-audit-mvp-012`, consumed commit `c35dd306c199f29d3e5d64a802c6912ca4de13c0`, 6 states, 6 routes, 10 records, 5 permission scopes, 6 guardrails, and 6 acceptance checks.
- Final `use_figma` readback found 50 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 6 routes, 10 records, and 4 audit events. `get_design_context` and `get_screenshot` succeeded for node `187:2`; screenshot verification returned `1024x1013` from original `1360x1345`.

## Acceptance Checks For Next Figma Run

- Continue active writable file `z4t4tFPAKrMDh6pIYOeEw6` in `team::1638213362346160913`.
- Maintain all four planned pages unless a future accepted decision expands the file.
- Deepen the existing desktop student screen rather than recreating it from scratch.
- Deepen the existing teacher review queue screen rather than recreating it from scratch.
- Deepen the existing mobile student screen rather than recreating it from scratch.
- Components are named consistently with this spec and should become richer variants over time.
- Shared component sets from node `43:2` should be consumed before rebuild creates one-off status/action/evidence UI.
- Every screen names role, permission scope, data source, status behavior, upload/evidence implications, and audit implications.
- No screen uses real student data.
- No critical app text is baked into Canva imagery.
- Status uses text plus color.
- Handoff IDs are logged in `docs/progress/handoffs.md`.

## Handoff Packet

Consumer lane:
- Figma

Artifact:
- Preferred team/project target: `https://www.figma.com/files/team/1638213362346160913/all-projects?fuid=1601310066605052228`
- Active recreated file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`
- Reference-only prior file: `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`
- Superseded historical: `https://www.figma.com/design/fkfNI9JNy0A3Rm8KnoxJLj`
- This spec file.
- State-variant packet: `docs/design/figma-product-preview-state-variants.md`
- 100-pass MVP execution map: node `18:2` in the active Figma file.
- MVP component variant implementation matrix: node `43:2` in the active Figma file.
- Admin account/group provisioning contract: node `48:2` in the active Figma file.
- Mobile evidence/revision workflow contract: node `56:2` in the active Figma file.
- Progress update/dashboard aggregate contract: node `61:2` in the active Figma file.
- Audit log/export controls contract: node `69:2` in the active Figma file.
- Mentor meeting/presentation scheduling contract: node `78:2` in the active Figma file.
- Full MVP alpha prototype page: node `98:2`, with review detail node `98:9` and student revision node `98:10` aligned to the implemented review-history endpoint, handoff frame `98:17` updated after primary alpha-console consumption, production boundary handoff node `124:2` distinguishing the public guide mode from the authenticated workspace route, workspace account edge-state handoff node `133:2`, presentation dashboard state handoff node `139:2`, celebration archive readiness handoff node `144:2`, archive provider/retention handoff node `149:2`, Drive archive delivery handoff node `151:2`, credential lifecycle handoff node `153:2`, admin import temporary credential handoff node `158:2`, admin import proof QA handoff node `163:2`, student dashboard access audit handoff node `173:2`, teacher review queue access audit handoff node `178:2`, review history/decision access audit handoff node `180:2`, evidence link access audit handoff node `183:2`, and submission submit access audit handoff node `187:2`.

Exact next action:
- Rebuild should consume nodes `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, `98:9`, `98:10`, `98:17`, `124:2`, `133:2`, `139:2`, `144:2`, `149:2`, `151:2`, `153:2`, `158:2`, `163:2`, `173:2`, `178:2`, `180:2`, `183:2`, and `187:2` while scaffolding the accepted Cloudflare database/auth/progress/audit/export/meeting/presentation foundation. Review history, workspace account states, presentation dashboard states, initial archive manifests, admin import API behavior, student dashboard protected-access auditing, teacher review queue scope/audit behavior, review history/decision access auditing, evidence-link metadata access auditing, and submission-submit access auditing are already partially consumed locally; next rebuild focus should use nodes `183:2` and `187:2` to broaden the same role/scope/audit matrix to submission detail/readback, evidence upload/download proof, mentor-meeting, presentation-slot, archive/export, and hosted permission UI proof. Node `151:2` remains the Drive-backed package or signed-link delivery handoff after the Drive upload HTTP 403 is fixed.

Acceptance check:
- Figma progress log records page/frame IDs, screenshot or metadata verification, route/data fields, permission scopes, and the next UI slice.

Known limits:
- The original historical file hit the Starter MCP tool-call limit. The regenerated reference file was successfully written through the updated Figma connection, but the 2026-05-18 follow-up pass hit the Education-plan MCP tool-call limit with rate-limit links pointing at old team `1601310068697743794`. The recreated file was then created and written in `team::1638213362346160913`. Bryan's professional-plan upgrade later unblocked the active-file metadata/screenshot verification and the `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, and `78:2` canvas writes.
