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

## Acceptance Checks For Next Figma Run

- Continue active writable file `z4t4tFPAKrMDh6pIYOeEw6` in `team::1638213362346160913`.
- Maintain all three planned pages unless a future accepted decision expands the file.
- Deepen the existing desktop student screen rather than recreating it from scratch.
- Deepen the existing teacher review queue screen rather than recreating it from scratch.
- Deepen the existing mobile student screen rather than recreating it from scratch.
- Components are named consistently with this spec and should become richer variants over time.
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
- Next state-variant packet: `docs/design/figma-product-preview-state-variants.md`

Exact next action:
- Continue `z4t4tFPAKrMDh6pIYOeEw6`. When MCP quota resets, run final metadata/screenshot verification for the recreated pages, then deepen component variants and route-level annotations from `docs/design/figma-product-preview-state-variants.md`.

Acceptance check:
- Figma progress log records page/frame IDs, screenshot or metadata verification, and next UI slice.

Known limits:
- The original historical file hit the Starter MCP tool-call limit. The regenerated reference file was successfully written through the updated Figma connection, but the 2026-05-18 follow-up pass hit the Education-plan MCP tool-call limit with rate-limit links pointing at old team `1601310068697743794`. The recreated file was then created and written in `team::1638213362346160913`; the final verification call hit the Education-plan MCP limit for the new team, confirming the route is corrected but quota is temporarily exhausted.
