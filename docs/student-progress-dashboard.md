# Student Progress Dashboard

## Route Updated

- Student landing route: `workspace.html`
- Student landing renderer: `renderOverviewSection()` routes student users to `renderStudentSection()` in `workspace.js`
- Student data route: `/api/student/dashboard`
- Student-primary workspaces suppress the shared technical product posture header so the first student content is the progress dashboard.

## Files Changed

- `functions/api/student/dashboard.ts`
- `workspace.js`
- `workspace.css`
- `tests/student-dashboard-access.integration.test.mjs`
- `tests/workspace-app.test.mjs`
- `docs/student-progress-dashboard.md`

## Data Used

The dashboard uses existing student-scoped data only:

- `requirements` records for required project work and booklet phase groups.
- `deadlines` records for saved due labels and due dates.
- `progress_records` for approved/archived completion, current phase, and last updated signals.
- `submissions` records for sent work, missing work, waiting-for-review, and revision-needed counts.
- `reviews` joined through the student's own sent work for latest teacher feedback.
- `evidence_artifacts` records for proof counts and safe download/link actions already returned by the student dashboard route.
- `mentor_assignments` joined to active mentor display names for support status.

The route continues to use `canAccessStudent`, so a student sees their own record only unless an existing authorized staff/mentor scope is allowed by current policy.

## Progress Calculation

Overall completion is:

```text
approved or archived required work items / total required work items
```

Submitted work is counted separately so students can distinguish complete work from work that is waiting for teacher review or needs revision.

Status uses simple rules:

- `Needs Revision` when any submission needs revision.
- `Waiting for Review` when any submission is submitted and awaiting review.
- `Complete` at 100%.
- `Almost Done` at 80% or higher.
- `In Progress` or `Getting Started` when work exists but is not complete.
- `Not Started` when no project work is available yet.

## Dashboard Sections

- Progress hero with title, percentage, status badge, and accessible progress bar.
- Four summary cards: Senior Project Phases, Work Sent In, Teacher Review, and Mentor Help.
- What to Work On Next, prioritized by revision items, missing sent work, current-phase work, waiting review, then next remaining checklist item.
- Upcoming deadlines, which reorders the existing incomplete checklist rows into a due-date-first list so students can start with the nearest deadline without leaving the current dashboard or opening a fake calendar page.
- Senior Project Checklist is now a secondary disclosure, not a default-open wall. It still uses the existing student-scoped dashboard data, booklet phase groups, phase-focus filters, item descriptions, simple teacher tips, status/version/due-date context, next steps, and in-page detail disclosure after the student opens it.
- Item detail can now open the full work timeline inline through the existing student-safe `/api/reviews/:submissionId/history` route, so students can compare versions, status changes, and visible teacher notes without leaving the same checklist panel.
- Checklist rows now show the matching sent-work ID's proof count when a submission exists. Draft or revision rows with proof can be sent to teacher review through the existing scoped submit route; rows without proof focus the existing proof forms instead of adding a fake requirement page.
- Feedback History is now a secondary disclosure, showing bounded teacher review notes already tied to the student's own submissions, with submission version and current status context after the student opens it.
- Feedback History now includes in-page filters for all notes, needs revision, teacher notes, and approved feedback, so students can focus the notes that still need action without leaving the current dashboard.
- Work timeline inside Feedback History, loaded from the filtered review-history route when a student opens a feedback row, now shows current-version, submitted-version-count, teacher-note-count, and status-update-count summary facts plus proof-count and current-version cues inside each submitted version row.
- Timeline teacher notes now keep the newest visible note first across both review decisions and general teacher comments, so students can compare the latest teacher note against older review history without opening a new page.
- Work You Sent In is now a secondary disclosure. Rows still repeat the latest teacher feedback beside the matching work item when the scoped dashboard response includes a review for that item.
- Work You Sent In now includes in-page filters for all work, drafts, waiting for review, needs revision, and approved work, so students can focus one status at a time without leaving the current dashboard or relying on a new route.
- Work You Sent In rows can now open the same student-safe work timeline in place, so students can check versions, status changes, and visible teacher notes from either Feedback History or the sent-work list.
- Work You Sent In filters clear a selected work timeline when the chosen filter hides that row, so students do not stay on a stale timeline after switching focus.
- Progress Details is now a secondary disclosure with current phase, work done, work still missing, review counts, last updated, proof count, feedback action status, May 5 final-files facts, and support shortcuts.
- The `Need help?` panel now lives inside Progress Details and gives route-free quick actions that reuse the existing feedback filters, sent-work filters, and in-page item detail, so students can jump straight to the right workflow without exposing mentor contact details or adding a new page.
- May 5 final-files status fact when the student-owned readiness response has final checks to summarize.
- Support note that shows the assigned mentor name when available or a safe no-mentor fallback.
- First load now keeps the student surface to the progress hero, one primary next action, a short next-step list, up to three upcoming deadlines, and accessible disclosure entry points for the checklist, feedback, progress/support, proof tools, sent work, and uploaded/linked files.

## Student-Safe Fallbacks

- No checklist items: "Your teacher has not added Senior Project work yet."
- No mentor: "No mentor assigned yet."
- No due date: "Due date: Not available yet."
- No next steps: "You are caught up right now."
- Dashboard load failure: "We could not load your project progress."

The UI avoids raw IDs, staff-only notes, tenant/admin fields, technical errors, and internal build language.

## Click-Throughs

No new fake links were added. The dashboard keeps existing real actions only:

- Attach a proof link through the existing student proof route and proof form.
- Upload a proof file through the existing student upload route and proof form.
- Download or open proof using existing safe proof URLs when present.
- Review the inline checklist grouped by booklet phase from the existing student dashboard response, including persisted deadline labels/dates, item descriptions, and one simple teacher tip when available; it does not add a fake item page or unbacked action.
- Open the same in-page item detail from the Upcoming deadlines panel, which simply reuses the current checklist state and item actions.
- Send draft or revised work for teacher review from a checklist row only when the existing submission has attached proof. The submit action uses `/api/submissions/:id/submit`, which enforces own-student access, draft/revision status, and required proof.
- Focus the existing link/file proof forms from a checklist row when the matching submission has no proof yet.
- Open in-page item details from a checklist row. The detail disclosure uses the already loaded student dashboard payload to summarize status, due date, proof count, sent version, progress state, next action, and the latest matching teacher feedback without calling a new route.
- Open the full work timeline from item detail through the existing `/api/reviews/:submissionId/history` route when a student needs version history, status changes, or student-visible teacher notes in the same panel.
- Focus the checklist on one booklet phase at a time using in-page phase buttons, then switch back to all phases without leaving the student workspace or adding a new route.
- Review May 5 final-file readiness through the existing Final Files workspace section; the student home only summarizes the next final-file blocker and does not add a fake package request action.
- Open a feedback-row timeline through the existing `/api/reviews/:submissionId/history` route. The route already enforces own-student or assigned-scope access and filters staff-only comments before the workspace renders the timeline.
- Open the same work timeline from a Work You Sent In row through the existing `/api/reviews/:submissionId/history` route when a student wants the timeline from the sent-work list instead of the feedback panel.
- Use the `Need help?` panel to jump to filtered feedback, filtered sent work, or the next item already returned by the current student dashboard response. These quick actions stay in-page and reuse the same item, feedback, and sent-work state instead of adding a fake support page.

Dedicated item drill-down links were not added because there is not yet a separate student-safe item detail page. The current guided action and detail view stay in-page and use the existing student dashboard, proof, feedback, and submit route data.

Teacher feedback history is read-only and comes from review rows already scoped to the student's own work. Each feedback row includes the matching version and current status so students can connect the note to the work they most recently sent back. Students can open a row timeline to see sent versions, status changes, and student-visible teacher notes from the shared review-history route. The sent-work list now offers the same timeline shortcut and still only repeats feedback that matches that work ID. Staff-only comments are not added to the student dashboard response, and the shared review-history route filters `staff_only` comments out for student and assigned-mentor readers.

## Language Cleanup

Student-facing copy on this route now uses "work," "proof," "sent work," "fix and send again," "final files," and "project progress" instead of technical labels such as "progress items," "artifact type," "quality prompt," or "archive package." The student-primary homepage no longer shows the staff-oriented product posture header. Tests cover the rendered student homepage for banned developer/prototype language, technical posture copy, and old student labels.

## Backlog

1. Extend the student-safe item detail disclosure only if students need more than the current checklist, proof focus action, send-for-review action, inline timeline handoff, and in-page status/feedback summary.
2. Add dedicated phase-specific student progress pages only if students need more than the current grouped checklist, phase-focus filters, and in-page item detail.
3. Add shareable sent-work-list URL state only if students need more than the current in-page status filters, feedback filters, version/proof timeline cues, and in-row timeline.
4. Add mentor contact/support workflow only if policy allows a real contact path beyond the current in-page support actions.
5. Add a richer due-date timeline or calendar only if students need more than the upcoming-deadlines panel plus checklist-item deadline labels.
6. Add a downloadable student progress summary.
7. Add a parent/guardian-friendly print view after policy review.
