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
  - Draft, Submitted, Under review, Revision requested, Approved, Blocked, Overridden

- `Submission Card`
  - No work started, Draft saved, Submitted locked, Revision open, Approved

- `Evidence Row`
  - Upload, External link, Staff note, Access check, Failed upload

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

Verification status:
- Canvas write succeeded and returned the frame IDs above.
- Final screenshot/metadata verification is pending because the follow-up MCP call hit the Education-plan tool-call limit for team `1638213362346160913`.
