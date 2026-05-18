# Dashboard UX Direction

Date: 2026-05-18

## Reference Takeaway

The dashboard references point toward a mature operational product:

- Persistent left navigation.
- Search and filters near the top.
- Main work surface in the center.
- Right-side context panel for metrics, calendar, activity, or summaries.
- Cards for active work.
- Tables/grids for dense staff operations.
- Board views for status movement.
- Timeline/resource views for workload and deadline pressure.
- Clear status pills, count badges, progress percentages, avatars, and due dates.
- Calm rounded surfaces, but not decorative clutter.

For Senior Capstone, this should become a school operations dashboard, not a generic project-management clone. The interface should help staff answer: who is stuck, what is late, who needs review, which programs are healthy, which mentors are overloaded, and what needs action today.

## Product Mood

Use the examples as structural inspiration, not as a palette to copy.

The product should feel:

- Calm
- Dense
- Scannable
- Trustworthy
- School-operational
- Fast for repeated staff use
- Simple for students under deadline stress

Avoid:

- Giant marketing hero sections.
- Decorative cards that do not answer an operational question.
- Cute metrics without action.
- Too much purple/gradient energy.
- Public-student-guide tone inside staff dashboards.
- Dashboards that look impressive but hide the next action.

## Layout Pattern

Baseline desktop layout:

- Left sidebar: product area navigation.
- Top bar: search, current cohort/program filter, notifications, profile.
- Main center: selected work view.
- Right rail: contextual stats, deadlines, review queue, calendar, or interventions.

Baseline mobile layout:

- Bottom navigation or compact menu.
- Student-first current task view.
- Staff dashboards become filtered lists, not full grids.
- Avoid forcing wide tables on phones.

## Primary Navigation

Student:
- My Progress
- Submit Work
- Feedback
- Deadlines
- Portfolio
- Resources

Mentor:
- Assigned Students
- Review Queue
- Meetings
- Presentation Prep
- Comments

Program teacher:
- Program Dashboard
- Students
- Review Queue
- Requirements
- Deadlines
- Mentor Status
- Reports

Admin:
- Overview
- Programs
- Users
- Assignments
- Cohorts
- Requirements
- Dashboards
- Exports
- Audit Log
- Settings

Misc admin navigation should be generated from explicit permissions.

## Core Dashboard Views

### Student Home

Purpose:
- Tell the student exactly what to do next.

Must show:
- Current phase.
- Next required submission.
- Due date.
- Status of each phase.
- Revision requests.
- Mentor/teacher feedback.
- Evidence still missing.
- Button to continue draft or submit.

Best structure:
- Top current-action card.
- Phase progress strip.
- Submission cards grouped by phase.
- Feedback panel.
- Resource/template links tied to the active requirement.

Do not show:
- Cohort-wide metrics.
- Other students.
- Admin-style charts.

### Mentor Dashboard

Purpose:
- Make assigned-student review work fast.

Must show:
- Assigned students.
- Review queue.
- Meeting status.
- Students with revision requests.
- Students with no recent evidence.
- Presentation readiness.
- Quick comment/review actions.

Useful views:
- Kanban by status: Not started, Drafting, Submitted, Revision requested, Approved, Blocked.
- List by next action.
- Calendar of mentor meetings/presentation dates.

Right rail:
- Reviews due today.
- Students without recent activity.
- Upcoming meetings.
- Mentor workload count.

### Program Teacher Dashboard

Purpose:
- Operate a whole program cohort.

Must show:
- Completion by phase.
- Proposal approval status.
- Build/check-in health.
- Mentor meeting completion.
- Presentation readiness.
- Celebration display readiness.
- Portfolio completion.
- Students overdue.
- Students blocked.
- Students with repeated revision loops.
- Mentor coverage gaps.

Useful views:
- Program overview cards.
- Student table with filters.
- Board view by workflow status.
- Timeline/deadline view.
- Requirement matrix by student.
- Exportable missing-work list.

Right rail:
- Top interventions.
- Review backlog.
- Upcoming deadlines.
- Program health summary.

### Admin Dashboard

Purpose:
- Manage the system and cohort at scale.

Must show:
- Cohort-wide completion.
- Program comparison.
- Review backlog by role.
- Overdue rates.
- Missing mentor assignments.
- User provisioning issues.
- Export jobs.
- Audit-sensitive events.
- Deadline conflicts.

Useful views:
- Overview metric cards.
- Program grid.
- User/role table.
- Assignment matrix.
- Audit log table.
- Export center.

Right rail:
- Alerts requiring admin action.
- Recent overrides.
- Recent exports.
- Unassigned students/staff.

## View Modes To Support

The references suggest multiple view modes. Senior Capstone should support these once the underlying data is real:

- Cards: best for student submissions and mentor queue.
- Board: best for workflow status movement.
- Table: best for teacher/admin scanning and filtering.
- Calendar: best for presentation dates, mentor meetings, deadlines.
- Timeline: best for phase deadlines and overdue pressure.
- Matrix: best for students x requirements completion.
- Resource view: best for mentor workload and program teacher review load.

Do not build all views first. Start with the table and cards for the first vertical slice, then add board/calendar/matrix when statuses are trustworthy.

## Dashboard Metrics

Metric cards must be actionable. Every metric should click through to the underlying list.

Good metric cards:
- Proposals awaiting review.
- Students overdue this week.
- Revision requests open.
- Mentor meetings not scheduled.
- Presentation slots missing.
- Display plans missing.
- Portfolios incomplete.
- Medical Professions students blocked by safety/permission notes.

Weak metric cards:
- Total students, unless it filters.
- Generic percentage complete without explaining what is incomplete.
- Decorative activity charts with no action path.

## Status Pills

Use consistent status labels:

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

Status color rules:

- Approved: green
- Submitted/under review: blue
- Revision requested: amber
- Blocked/rejected: red
- Draft/not started: neutral
- Overridden: purple or slate with explicit label
- Archived: muted neutral

Never rely on color alone. Include text labels.

## Dashboard Components

Reusable components to design early:

- App shell
- Sidebar
- Top bar
- Global search
- Cohort/program filter
- Student selector
- Status pill
- Metric card
- Review queue item
- Submission card
- Requirement checklist
- Phase progress strip
- Student progress table
- Program health card
- Deadline chip
- Comment thread
- Audit event row
- Empty state
- Permission-denied state

## First Dashboard Slice

For the first real implementation, build:

Student:
- Proposal submission card.
- Proposal status history.
- Revision feedback panel.

Program teacher:
- Proposal review queue.
- Student/program filter.
- Approve/request revision controls.

Admin:
- Read-only cohort overview showing proposal counts by program.

This slice proves:
- Auth boundaries.
- Role-based dashboard rendering.
- Server-side authorization.
- Submission status transitions.
- Audit logs.
- Dashboard aggregation.

## Data Needed For Dashboard Aggregates

Do not calculate dashboards from client state. Dashboard numbers should come from database queries or server-side aggregate services.

Needed fields:

- `program_id`
- `cohort_id`
- `student_profile_id`
- `mentor_id`
- `phase_id`
- `requirement_id`
- `submission_status`
- `due_at`
- `submitted_at`
- `approved_at`
- `last_reviewed_at`
- `revision_count`
- `blocked_reason`
- `reviewer_id`
- `updated_at`

## Design Guardrails

- Keep staff pages dense but readable.
- Use compact cards and tables.
- Make filters sticky or always reachable.
- Every alert should lead to the exact students/items involved.
- Right rail content should change with context.
- Keep student pages simpler than staff pages.
- Make overdue and revision states impossible to miss.
- Add skeleton/loading states for dashboards.
- Include empty states that explain what action is missing.
- Build keyboard-accessible controls.
- Preserve enough contrast for school environments and projectors.

## How The References Map To This App

Projector-style dashboards:
- Use for staff operational dashboards: sidebar, main work cards, right metric rail.

Trello board:
- Use for phase/submission workflow movement, but only after permissions and audit logs are in place.

Airtable grid:
- Use for admin/program teacher tables, filters, grouping, and exports.

Resource planning grid:
- Use later for mentor workload, teacher review load, and presentation scheduling pressure.

Project phase diagram:
- Use as a simplified student progress strip, not as the staff dashboard centerpiece.

