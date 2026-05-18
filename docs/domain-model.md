# Senior Capstone Domain Model Blueprint

Date: 2026-05-18

## Purpose

This document defines the first serious product model for the hosted Senior Capstone app. It is intentionally more complete than the current static guide because the hosted version must manage real users, student records, reviews, approvals, revisions, dashboards, and audit history.

## Program Catalog

Programs must be first-class records:

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

Each program should support:

- Display name
- Slug
- Active/inactive state
- Program teachers
- Default mentor pool
- Program-specific requirements
- Program-specific deadline overrides
- Program-specific display expectations
- Program-specific rubric notes
- Evidence examples
- Safety or permission notes

## Users And Roles

User:
- `id`
- `email`
- `username`
- `password_hash` or managed-auth subject
- `first_name`
- `last_name`
- `display_name`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

Role:
- `student`
- `mentor`
- `program_teacher`
- `admin`
- `misc_admin`

UserRole:
- `user_id`
- `role`
- `program_id` optional scope
- `cohort_id` optional scope
- `starts_at`
- `ends_at`
- `assigned_by_user_id`

Permission:
- Use explicit permissions for sensitive operations, especially misc admin.
- Examples: `users.manage`, `programs.manage`, `submissions.review`, `submissions.override`, `reports.export`, `audit.view`, `deadlines.manage`.

## Student Profile

StudentProfile:
- `id`
- `user_id`
- `student_number` optional, if district permits storing it
- `cohort_id`
- `program_id`
- `primary_program_teacher_id`
- `primary_mentor_id`
- `graduation_year`
- `status`
- `created_at`
- `updated_at`

Avoid storing sensitive support/accommodation notes unless the school explicitly needs them in this app and access is tightly scoped.

## Staff Profile

StaffProfile:
- `id`
- `user_id`
- `job_title`
- `department`
- `active`
- `created_at`
- `updated_at`

StaffProgramAssignment:
- `staff_profile_id`
- `program_id`
- `assignment_type`: teacher, mentor_pool, admin_support
- `cohort_id`

MentorAssignment:
- `student_profile_id`
- `mentor_staff_profile_id`
- `cohort_id`
- `assigned_by_user_id`
- `starts_at`
- `ends_at`
- `status`

## Cohorts And Time

Cohort:
- `id`
- `name`
- `school_year`
- `starts_on`
- `ends_on`
- `status`

Deadline:
- `id`
- `cohort_id`
- `program_id` optional
- `phase_id`
- `requirement_id` optional
- `due_at`
- `visibility`
- `created_by_user_id`
- `updated_by_user_id`

## Curriculum And Requirements

Phase:
- `id`
- `slug`
- `title`
- `sequence`
- `timeframe_label`
- `student_summary`
- `staff_summary`
- `active`

Requirement:
- `id`
- `phase_id`
- `slug`
- `title`
- `description`
- `submission_type`
- `required`
- `sequence`
- `default_reviewer_role`
- `active`

ProgramRequirement:
- `id`
- `program_id`
- `cohort_id`
- `requirement_id`
- `custom_title`
- `custom_description`
- `evidence_expectations`
- `display_expectations`
- `safety_notes`
- `required`
- `active`

Template:
- `id`
- `requirement_id`
- `title`
- `content`
- `format`
- `active`

## Submissions

Submission:
- `id`
- `student_profile_id`
- `cohort_id`
- `program_id`
- `phase_id`
- `requirement_id`
- `status`
- `current_version_id`
- `submitted_at`
- `last_reviewed_at`
- `approved_at`
- `approved_by_user_id`
- `created_at`
- `updated_at`

SubmissionVersion:
- `id`
- `submission_id`
- `version_number`
- `title`
- `body`
- `reflection`
- `student_notes`
- `created_by_user_id`
- `created_at`

EvidenceArtifact:
- `id`
- `submission_version_id`
- `artifact_type`: upload, external_link, text, image, document, video, other
- `title`
- `description`
- `storage_key`
- `external_url`
- `mime_type`
- `size_bytes`
- `created_by_user_id`
- `created_at`

Review:
- `id`
- `submission_id`
- `reviewer_user_id`
- `reviewer_role`
- `decision`
- `comment`
- `created_at`

Approval:
- `id`
- `submission_id`
- `approved_by_user_id`
- `approval_type`: mentor, teacher, admin_override, final
- `comment`
- `created_at`

Comment:
- `id`
- `submission_id`
- `author_user_id`
- `visibility`: student_and_staff, staff_only, admin_only
- `body`
- `created_at`
- `updated_at`

## Status Transitions

Allowed normal transitions:

- `not_started` -> `draft`
- `draft` -> `submitted`
- `submitted` -> `under_review`
- `under_review` -> `revision_requested`
- `under_review` -> `approved`
- `revision_requested` -> `draft`
- `draft` -> `submitted`
- `under_review` -> `blocked`

Admin-only transitions:

- any active status -> `overridden`
- any active status -> `archived`
- `blocked` -> `draft`
- `rejected` -> `draft`, if the school wants appeals or restart behavior

Every transition creates an AuditEvent.

## Audit Events

AuditEvent:
- `id`
- `actor_user_id`
- `event_type`
- `entity_type`
- `entity_id`
- `student_profile_id` optional
- `program_id` optional
- `cohort_id` optional
- `before_json`
- `after_json`
- `reason`
- `ip_address`
- `user_agent`
- `created_at`

Event types:

- user.created
- user.updated
- user.deactivated
- role.assigned
- role.removed
- program.updated
- requirement.updated
- assignment.updated
- submission.created
- submission.version_created
- submission.status_changed
- submission.comment_created
- submission.reviewed
- submission.approved
- submission.override_applied
- artifact.created
- artifact.deleted
- export.created
- audit.viewed

## Permission Matrix

Student:
- Read own profile, own requirements, own submissions, own comments visible to student.
- Create and edit own drafts.
- Submit own work.
- Read own review decisions.
- Cannot approve, override, export, or view other students.

Mentor:
- Read assigned student profiles and submissions.
- Comment on assigned student work.
- Review assigned mentor checkpoints.
- Approve only mentor-scoped checkpoints if configured.
- Cannot view unassigned students by default.

Program teacher:
- Read students in assigned program/cohort.
- Review program submissions.
- Request revisions.
- Approve teacher-scoped requirements.
- Edit program-specific requirement guidance if permitted.
- See dashboards for assigned program/cohort.

Admin:
- Full operational access.
- Can manage users, programs, assignments, requirements, exports, and overrides.
- All sensitive actions audited.

Misc admin:
- No default broad access.
- Access only through explicit permissions and scopes.

## Dashboard Metrics

Student dashboard:
- Current phase.
- Next required action.
- Submitted items.
- Approved items.
- Revision requests.
- Due dates.
- Mentor and teacher contact.

Mentor dashboard:
- Assigned students.
- Students needing review.
- Upcoming meetings.
- Revision loops.
- Missing presentation readiness items.

Program teacher dashboard:
- Program completion by phase.
- Missing proposals.
- Overdue check-ins.
- Students with repeated revision requests.
- Mentor meeting status.
- Presentation status.
- Display/portfolio completion.

Admin dashboard:
- Cohort-wide completion.
- Program comparison.
- Mentor workload.
- Teacher review backlog.
- Overdue submissions.
- Export queue.
- Role and assignment health.
- Audit flags for overrides and exports.

## Program Requirement Dimensions

Each program should be able to define:

- Proposal expectations
- Technical skill evidence
- Safety or permissions
- Materials and tools
- Mentor meeting requirements
- Presentation expectations
- Celebration display expectations
- Portfolio artifacts
- Reflection prompts
- Recognition criteria

## Open Product Questions

- Will students authenticate with district accounts or local usernames/passwords?
- Who provisions accounts?
- Are parents/guardians ever users?
- Can a student have multiple mentors?
- Can a project be group-based, and if so how are individual submissions tracked?
- Who is the final approver for each phase?
- Which actions should trigger email or app notifications?
- What exports are required for grading systems?
- How long should student records be retained?
- What file types and upload sizes are allowed?

