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

- `requirements` for required project work and phase groups.
- `progress_records` for approved/archived completion, current phase, and last updated signals.
- `submissions` for submitted, missing, waiting-for-review, and revision-needed counts.
- `reviews` joined through the student's own submissions for latest teacher feedback.
- `evidence_artifacts` for evidence counts and safe download/link actions already returned by the student dashboard route.
- `mentor_assignments` joined to active mentor display names for support status.

The route continues to use `canAccessStudent`, so a student sees their own record only unless an existing authorized staff/mentor scope is allowed by current policy.

## Progress Calculation

Overall completion is:

```text
approved or archived required requirements / total required requirements
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
- Four summary cards: Project Phases, Required Submissions, Review Status, and Mentor / Support.
- What to Work On Next, prioritized by revision items, missing submissions, current-phase work, waiting review, then next remaining requirement.
- Feedback History, showing bounded teacher review notes already tied to the student's own submissions, with submission version and current status context.
- Submission timeline inside Feedback History, loaded from the filtered review-history route when a student opens a feedback row, showing versions, status changes, and student-visible teacher notes.
- Submitted Work rows now repeat the latest teacher feedback beside the matching submission when the scoped dashboard response includes a review for that submission.
- Progress Details with current phase, completed requirements, missing submissions, review counts, last updated, evidence count, and feedback action status.
- May 5 archive status fact when the student-owned archive readiness response has closeout checks to summarize.
- Support note that shows the assigned mentor name when available or a safe no-mentor fallback.

## Student-Safe Fallbacks

- No requirements: "Your teacher has not added project requirements yet."
- No mentor: "No mentor assigned yet."
- No due date: "Not available yet."
- No next steps: "You are caught up right now."
- Dashboard load failure: "We could not load your project progress."

The UI avoids raw IDs, staff-only notes, tenant/admin fields, technical errors, and internal build language.

## Click-Throughs

No new fake links were added. The dashboard keeps existing real actions only:

- Attach evidence link through the existing student evidence form.
- Upload evidence file through the existing student upload form.
- Download or open evidence using existing safe evidence URLs when present.
- Review archive readiness through the existing Archive workspace section; the student home only summarizes the next archive blocker and does not add a fake archive request action.
- Open a feedback-row timeline through the existing `/api/reviews/:submissionId/history` route. The route already enforces own-student or assigned-scope access and filters staff-only comments before the workspace renders the timeline.

Future requirement drill-down links were not added because there is not yet a dedicated student-safe requirement detail page.

Teacher feedback history is read-only and comes from review rows already scoped to the student's own submissions. Each feedback row includes the matching submission version and current status so students can connect the note to the work they most recently sent back. Students can open a row timeline to see submitted versions, status changes, and student-visible teacher notes from the shared review-history route. The submitted-work list only repeats feedback that matches that submission ID. Staff-only comments are not added to the student dashboard response, and the shared review-history route filters `staff_only` comments out for student and assigned-mentor readers.

## Language Cleanup

Student-facing copy on this route now uses "work," "evidence," "submitted work," and "project progress" instead of technical labels such as "progress items" or "artifact type." The student-primary homepage no longer shows the staff-oriented product posture header. Tests cover the student homepage for banned developer/prototype language and technical posture copy.

## Backlog

1. Add a student-safe requirement detail page.
2. Add phase-specific student progress pages.
3. Add richer student-safe feedback timeline affordances only if students need compare/filter controls beyond the current in-row timeline.
4. Add mentor contact/support workflow without exposing unsafe contact data.
5. Add a richer due-date timeline from `deadlines`.
6. Add a downloadable student progress summary.
7. Add a parent/guardian-friendly print view after policy review.
