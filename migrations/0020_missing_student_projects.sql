PRAGMA foreign_keys = ON;

-- Some local/imported students can already exist when the project triggers are
-- installed. Give each student who still has no active membership a safe
-- individual project without changing students who already belong to a team.
INSERT INTO projects (
  id, site_id, program_id, cohort_id, name, summary, status, current_phase, created_by
)
SELECT
  'project-' || student.id,
  (
    SELECT site_users.site_id FROM site_users
    JOIN sites ON sites.id = site_users.site_id AND sites.status = 'active'
    WHERE site_users.user_id = student.id AND site_users.membership_status = 'active'
    ORDER BY site_users.site_id LIMIT 1
  ),
  (
    SELECT groups.program_id FROM group_memberships
    JOIN groups ON groups.id = group_memberships.group_id
    WHERE group_memberships.user_id = student.id AND groups.program_id IS NOT NULL
    ORDER BY groups.program_id LIMIT 1
  ),
  (
    SELECT groups.cohort_id FROM group_memberships
    JOIN groups ON groups.id = group_memberships.group_id
    WHERE group_memberships.user_id = student.id AND groups.cohort_id IS NOT NULL
    ORDER BY groups.cohort_id LIMIT 1
  ),
  student.display_name || ' Project',
  'Your Senior Project workspace.',
  'active',
  COALESCE((
    SELECT progress_records.phase FROM progress_records
    WHERE progress_records.student_id = student.id
    ORDER BY progress_records.updated_at DESC LIMIT 1
  ), 'start'),
  student.id
FROM user_accounts student
JOIN user_roles student_role ON student_role.user_id = student.id AND student_role.role_id = 'student'
WHERE student.status = 'active'
  AND EXISTS (
    SELECT 1 FROM site_users
    JOIN sites ON sites.id = site_users.site_id AND sites.status = 'active'
    WHERE site_users.user_id = student.id AND site_users.membership_status = 'active'
  )
  AND NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.student_user_id = student.id AND project_members.active = 1
  )
ON CONFLICT(id) DO UPDATE SET
  site_id = excluded.site_id,
  name = excluded.name,
  status = 'active',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

INSERT INTO project_members (
  project_id, student_user_id, member_role, active, assigned_by
)
SELECT 'project-' || student.id, student.id, 'lead', 1, student.id
FROM user_accounts student
JOIN user_roles student_role ON student_role.user_id = student.id AND student_role.role_id = 'student'
WHERE student.status = 'active'
  AND EXISTS (SELECT 1 FROM projects WHERE projects.id = 'project-' || student.id)
  AND NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.student_user_id = student.id AND project_members.active = 1
  )
ON CONFLICT(project_id, student_user_id) DO UPDATE SET
  member_role = 'lead',
  active = 1,
  assigned_by = excluded.assigned_by,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

UPDATE submissions
SET project_id = (
  SELECT project_members.project_id FROM project_members
  WHERE project_members.student_user_id = submissions.student_id AND project_members.active = 1 LIMIT 1
)
WHERE project_id IS NULL;

UPDATE progress_records
SET project_id = (
  SELECT project_members.project_id FROM project_members
  WHERE project_members.student_user_id = progress_records.student_id AND project_members.active = 1 LIMIT 1
)
WHERE project_id IS NULL;

UPDATE evidence_artifacts
SET project_id = COALESCE(
  (SELECT submissions.project_id FROM submissions WHERE submissions.id = evidence_artifacts.submission_id LIMIT 1),
  (SELECT project_members.project_id FROM project_members WHERE project_members.student_user_id = evidence_artifacts.student_id AND project_members.active = 1 LIMIT 1)
)
WHERE project_id IS NULL;

UPDATE status_history
SET project_id = (
  SELECT project_members.project_id FROM project_members
  WHERE project_members.student_user_id = status_history.student_id AND project_members.active = 1 LIMIT 1
)
WHERE project_id IS NULL;

UPDATE mentor_meetings
SET project_id = (
  SELECT project_members.project_id FROM project_members
  WHERE project_members.student_user_id = mentor_meetings.student_user_id AND project_members.active = 1 LIMIT 1
)
WHERE project_id IS NULL;

UPDATE presentation_slots
SET project_id = (
  SELECT project_members.project_id FROM project_members
  WHERE project_members.student_user_id = presentation_slots.student_user_id AND project_members.active = 1 LIMIT 1
)
WHERE project_id IS NULL;
