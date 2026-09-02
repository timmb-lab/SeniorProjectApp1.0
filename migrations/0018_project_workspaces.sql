PRAGMA foreign_keys = ON;

-- A project is the shared work area. Students remain user accounts and join one
-- active Senior Project at a time. A project can have one to five students.
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  cohort_id TEXT REFERENCES cohorts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  current_phase TEXT NOT NULL DEFAULT 'start',
  created_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_site_status
  ON projects(site_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_projects_program_status
  ON projects(program_id, status, updated_at);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'member'
    CHECK (member_role IN ('lead', 'member')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  assigned_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (project_id, student_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_members_one_active_project
  ON project_members(student_user_id)
  WHERE active = 1;

CREATE INDEX IF NOT EXISTS idx_project_members_project_active
  ON project_members(project_id, active, created_at);

CREATE TRIGGER IF NOT EXISTS trg_project_members_max_five_insert
BEFORE INSERT ON project_members
WHEN NEW.active = 1
 AND (
   SELECT COUNT(*)
   FROM project_members
   WHERE project_id = NEW.project_id
     AND active = 1
 ) >= 5
BEGIN
  SELECT RAISE(ABORT, 'A project can have no more than five students.');
END;

CREATE TRIGGER IF NOT EXISTS trg_project_members_max_five_update
BEFORE UPDATE OF active, project_id ON project_members
WHEN NEW.active = 1
 AND (
   SELECT COUNT(*)
   FROM project_members
   WHERE project_id = NEW.project_id
     AND active = 1
     AND student_user_id != OLD.student_user_id
 ) >= 5
BEGIN
  SELECT RAISE(ABORT, 'A project can have no more than five students.');
END;

CREATE TABLE IF NOT EXISTS project_mentor_assignments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mentor_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  assigned_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (project_id, mentor_user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_mentor_assignments_mentor_active
  ON project_mentor_assignments(mentor_user_id, active, project_id);

-- Shared requirements create one team submission. Personal requirements keep one
-- response per student even when the student belongs to a team.
ALTER TABLE requirements ADD COLUMN work_scope TEXT NOT NULL DEFAULT 'project'
  CHECK (work_scope IN ('project', 'individual'));

UPDATE requirements
SET work_scope = 'individual'
WHERE id IN (
  'req-resume',
  'req-thanks-and-thanks',
  'req-reflection-best-work',
  'req-reflection-senior-project',
  'req-reflection-tenet-mastery',
  'req-reflection-project-based-learning',
  'req-reflection-next-year-plan',
  'req-personal-archive-export'
);

ALTER TABLE submissions ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE progress_records ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE evidence_artifacts ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE status_history ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE mentor_meetings ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE presentation_slots ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_project_requirement_status
  ON submissions(project_id, requirement_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_progress_project_phase
  ON progress_records(project_id, phase, updated_at);

CREATE INDEX IF NOT EXISTS idx_evidence_project_status
  ON evidence_artifacts(project_id, review_status, created_at);

-- Preserve all existing work by giving every current student an individual
-- project. Staff can later combine those memberships into a team project.
INSERT OR IGNORE INTO projects (
  id,
  site_id,
  program_id,
  cohort_id,
  name,
  summary,
  status,
  current_phase,
  created_by
)
SELECT
  'project-' || student.id,
  (
    SELECT site_users.site_id
    FROM site_users
    JOIN sites ON sites.id = site_users.site_id
    WHERE site_users.user_id = student.id
      AND site_users.membership_status = 'active'
      AND sites.status = 'active'
    ORDER BY site_users.site_id ASC
    LIMIT 1
  ),
  (
    SELECT groups.program_id
    FROM group_memberships
    JOIN groups ON groups.id = group_memberships.group_id
    WHERE group_memberships.user_id = student.id
      AND groups.program_id IS NOT NULL
    ORDER BY groups.program_id ASC
    LIMIT 1
  ),
  (
    SELECT groups.cohort_id
    FROM group_memberships
    JOIN groups ON groups.id = group_memberships.group_id
    WHERE group_memberships.user_id = student.id
      AND groups.cohort_id IS NOT NULL
    ORDER BY groups.cohort_id ASC
    LIMIT 1
  ),
  student.display_name || ' Project',
  'Your shared Senior Project workspace.',
  'active',
  COALESCE((
    SELECT progress_records.phase
    FROM progress_records
    WHERE progress_records.student_id = student.id
    ORDER BY progress_records.updated_at DESC
    LIMIT 1
  ), 'start'),
  student.id
FROM user_accounts student
JOIN user_roles student_role ON student_role.user_id = student.id
  AND student_role.role_id = 'student'
WHERE student.status = 'active'
  AND EXISTS (
    SELECT 1
    FROM site_users
    JOIN sites ON sites.id = site_users.site_id
    WHERE site_users.user_id = student.id
      AND site_users.membership_status = 'active'
      AND sites.status = 'active'
  );

INSERT OR IGNORE INTO project_members (
  project_id,
  student_user_id,
  member_role,
  active,
  assigned_by
)
SELECT
  'project-' || student.id,
  student.id,
  'lead',
  1,
  student.id
FROM user_accounts student
JOIN user_roles student_role ON student_role.user_id = student.id
  AND student_role.role_id = 'student'
WHERE student.status = 'active'
  AND EXISTS (
    SELECT 1 FROM projects WHERE projects.id = 'project-' || student.id
  );

UPDATE submissions
SET project_id = (
  SELECT project_members.project_id
  FROM project_members
  WHERE project_members.student_user_id = submissions.student_id
    AND project_members.active = 1
  LIMIT 1
)
WHERE project_id IS NULL;

UPDATE progress_records
SET project_id = (
  SELECT project_members.project_id
  FROM project_members
  WHERE project_members.student_user_id = progress_records.student_id
    AND project_members.active = 1
  LIMIT 1
)
WHERE project_id IS NULL;

UPDATE evidence_artifacts
SET project_id = COALESCE(
  (
    SELECT submissions.project_id
    FROM submissions
    WHERE submissions.id = evidence_artifacts.submission_id
    LIMIT 1
  ),
  (
    SELECT project_members.project_id
    FROM project_members
    WHERE project_members.student_user_id = evidence_artifacts.student_id
      AND project_members.active = 1
    LIMIT 1
  )
)
WHERE project_id IS NULL;

UPDATE status_history
SET project_id = (
  SELECT project_members.project_id
  FROM project_members
  WHERE project_members.student_user_id = status_history.student_id
    AND project_members.active = 1
  LIMIT 1
)
WHERE project_id IS NULL;

UPDATE mentor_meetings
SET project_id = (
  SELECT project_members.project_id
  FROM project_members
  WHERE project_members.student_user_id = mentor_meetings.student_user_id
    AND project_members.active = 1
  LIMIT 1
)
WHERE project_id IS NULL;

UPDATE presentation_slots
SET project_id = (
  SELECT project_members.project_id
  FROM project_members
  WHERE project_members.student_user_id = presentation_slots.student_user_id
    AND project_members.active = 1
  LIMIT 1
)
WHERE project_id IS NULL;

INSERT OR IGNORE INTO project_mentor_assignments (
  id,
  project_id,
  mentor_user_id,
  active,
  assigned_by,
  created_at,
  updated_at
)
SELECT
  'project-mentor-' || mentor_assignments.id,
  project_members.project_id,
  mentor_assignments.mentor_user_id,
  mentor_assignments.active,
  mentor_assignments.assigned_by,
  mentor_assignments.created_at,
  mentor_assignments.created_at
FROM mentor_assignments
JOIN project_members ON project_members.student_user_id = mentor_assignments.student_user_id
  AND project_members.active = 1;
