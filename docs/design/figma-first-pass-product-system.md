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
- Full MVP alpha prototype page: node `98:2`, with review detail node `98:9` and student revision node `98:10` aligned to the implemented review-history endpoint, handoff frame `98:17` updated after primary alpha-console consumption, and production boundary handoff node `124:2` distinguishing the public guide mode from the authenticated workspace route.

Exact next action:
- Rebuild should consume nodes `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, `98:9`, `98:10`, `98:17`, and `124:2` while scaffolding the accepted Cloudflare database/auth/progress/audit/export/meeting/presentation foundation. Review history is already consumed in the primary alpha console; next rebuild focus should move to role-pending and permission-denied workspace states, mentor/presentation, and admin workflow depth unless hosted alpha smoke finds a regression.

Acceptance check:
- Figma progress log records page/frame IDs, screenshot or metadata verification, route/data fields, permission scopes, and the next UI slice.

Known limits:
- The original historical file hit the Starter MCP tool-call limit. The regenerated reference file was successfully written through the updated Figma connection, but the 2026-05-18 follow-up pass hit the Education-plan MCP tool-call limit with rate-limit links pointing at old team `1601310068697743794`. The recreated file was then created and written in `team::1638213362346160913`. Bryan's professional-plan upgrade later unblocked the active-file metadata/screenshot verification and the `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, and `78:2` canvas writes.
