PRAGMA foreign_keys = ON;

-- Every project needs one confirmed Mentor and one confirmed Program Teacher.
-- A request can collect those confirmations before staff create the final project.
ALTER TABLE project_requests ADD COLUMN program_id TEXT REFERENCES programs(id) ON DELETE SET NULL;

-- Repair projects created by the older new-student triggers before adult
-- eligibility is calculated. One active student membership is enough to find
-- the project's program/cohort without changing any project work.
UPDATE projects
SET program_id = COALESCE(program_id, (
      SELECT groups.program_id
      FROM project_members
      JOIN group_memberships ON group_memberships.user_id = project_members.student_user_id
      JOIN groups ON groups.id = group_memberships.group_id
      WHERE project_members.project_id = projects.id
        AND project_members.active = 1
        AND groups.program_id IS NOT NULL
      ORDER BY groups.program_id
      LIMIT 1
    )),
    cohort_id = COALESCE(cohort_id, (
      SELECT groups.cohort_id
      FROM project_members
      JOIN group_memberships ON group_memberships.user_id = project_members.student_user_id
      JOIN groups ON groups.id = group_memberships.group_id
      WHERE project_members.project_id = projects.id
        AND project_members.active = 1
        AND groups.cohort_id IS NOT NULL
      ORDER BY groups.cohort_id
      LIMIT 1
    ))
WHERE program_id IS NULL OR cohort_id IS NULL;

DROP TRIGGER IF EXISTS trg_student_site_membership_create_project;
CREATE TRIGGER trg_student_site_membership_create_project
AFTER INSERT ON site_users
WHEN NEW.membership_status = 'active'
 AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role_id = 'student')
 AND NOT EXISTS (SELECT 1 FROM project_members WHERE student_user_id = NEW.user_id AND active = 1)
BEGIN
  INSERT OR IGNORE INTO projects (
    id, site_id, program_id, cohort_id, name, summary, status, current_phase, created_by
  )
  SELECT
    'project-' || NEW.user_id,
    NEW.site_id,
    (SELECT groups.program_id FROM group_memberships JOIN groups ON groups.id = group_memberships.group_id WHERE group_memberships.user_id = NEW.user_id AND groups.program_id IS NOT NULL ORDER BY groups.program_id LIMIT 1),
    (SELECT groups.cohort_id FROM group_memberships JOIN groups ON groups.id = group_memberships.group_id WHERE group_memberships.user_id = NEW.user_id AND groups.cohort_id IS NOT NULL ORDER BY groups.cohort_id LIMIT 1),
    user_accounts.display_name || ' Project',
    'Your Senior Project workspace.',
    'active',
    'start',
    NEW.user_id
  FROM user_accounts
  WHERE user_accounts.id = NEW.user_id
    AND user_accounts.status IN ('active', 'pending_reset');

  INSERT OR IGNORE INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
  SELECT 'project-' || NEW.user_id, NEW.user_id, 'lead', 1, NEW.user_id
  WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'project-' || NEW.user_id);
END;

DROP TRIGGER IF EXISTS trg_student_role_create_project;
CREATE TRIGGER trg_student_role_create_project
AFTER INSERT ON user_roles
WHEN NEW.role_id = 'student'
 AND NOT EXISTS (SELECT 1 FROM project_members WHERE student_user_id = NEW.user_id AND active = 1)
BEGIN
  INSERT OR IGNORE INTO projects (
    id, site_id, program_id, cohort_id, name, summary, status, current_phase, created_by
  )
  SELECT
    'project-' || NEW.user_id,
    site_users.site_id,
    (SELECT groups.program_id FROM group_memberships JOIN groups ON groups.id = group_memberships.group_id WHERE group_memberships.user_id = NEW.user_id AND groups.program_id IS NOT NULL ORDER BY groups.program_id LIMIT 1),
    (SELECT groups.cohort_id FROM group_memberships JOIN groups ON groups.id = group_memberships.group_id WHERE group_memberships.user_id = NEW.user_id AND groups.cohort_id IS NOT NULL ORDER BY groups.cohort_id LIMIT 1),
    user_accounts.display_name || ' Project',
    'Your Senior Project workspace.',
    'active',
    'start',
    NEW.user_id
  FROM user_accounts
  JOIN site_users ON site_users.user_id = user_accounts.id AND site_users.membership_status = 'active'
  JOIN sites ON sites.id = site_users.site_id AND sites.status = 'active'
  WHERE user_accounts.id = NEW.user_id
    AND user_accounts.status IN ('active', 'pending_reset')
  ORDER BY site_users.site_id
  LIMIT 1;

  INSERT OR IGNORE INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
  SELECT 'project-' || NEW.user_id, NEW.user_id, 'lead', 1, NEW.user_id
  WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'project-' || NEW.user_id);
END;

UPDATE project_requests
SET program_id = (
  SELECT projects.program_id
  FROM project_members
  JOIN projects ON projects.id = project_members.project_id
  WHERE project_members.student_user_id = project_requests.submitted_by_student_id
    AND project_members.active = 1
  LIMIT 1
)
WHERE program_id IS NULL;

CREATE TABLE IF NOT EXISTS project_adult_assignments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES project_requests(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  adult_role TEXT NOT NULL CHECK (adult_role IN ('mentor', 'program_teacher')),
  assignee_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  invited_name TEXT,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'replaced')),
  nominated_by TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
  responded_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  responded_at TEXT,
  replacement_for_id TEXT REFERENCES project_adult_assignments(id) ON DELETE SET NULL,
  replaced_by_id TEXT REFERENCES project_adult_assignments(id) ON DELETE SET NULL,
  staff_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((project_id IS NOT NULL AND request_id IS NULL) OR (project_id IS NULL AND request_id IS NOT NULL)),
  CHECK (assignee_user_id IS NOT NULL OR (invited_name IS NOT NULL AND invited_email IS NOT NULL)),
  CHECK (status != 'accepted' OR assignee_user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_adults_one_accepted_project_role
  ON project_adult_assignments(project_id, adult_role)
  WHERE project_id IS NOT NULL AND status = 'accepted';

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_adults_one_pending_project_role
  ON project_adult_assignments(project_id, adult_role)
  WHERE project_id IS NOT NULL AND status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_adults_one_accepted_request_role
  ON project_adult_assignments(request_id, adult_role)
  WHERE request_id IS NOT NULL AND status = 'accepted';

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_adults_one_pending_request_role
  ON project_adult_assignments(request_id, adult_role)
  WHERE request_id IS NOT NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_project_adults_assignee_status
  ON project_adult_assignments(assignee_user_id, status, adult_role, updated_at);

CREATE INDEX IF NOT EXISTS idx_project_adults_site_status
  ON project_adult_assignments(site_id, status, adult_role, updated_at);

CREATE TABLE IF NOT EXISTS project_adult_assignment_events (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES project_adult_assignments(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'nominated',
    'accepted',
    'declined',
    'cancelled',
    'replaced',
    'linked_to_account',
    'moved_to_project'
  )),
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_project_adult_events_assignment
  ON project_adult_assignment_events(assignment_id, created_at, id);

CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'project_adult_invitation',
    'project_adult_accepted',
    'project_adult_declined',
    'project_adult_replaced'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'project',
  entity_id TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
  ON user_notifications(user_id, read_at, created_at);

-- Preserve the newest active project mentor as a confirmed canonical Mentor.
INSERT OR IGNORE INTO project_adult_assignments (
  id, project_id, site_id, program_id, adult_role, assignee_user_id,
  invited_name, invited_email, status, nominated_by, responded_by,
  responded_at, created_at, updated_at
)
SELECT
  'adult-mentor-' || ranked.id,
  ranked.project_id,
  ranked.site_id,
  ranked.program_id,
  'mentor',
  ranked.mentor_user_id,
  ranked.display_name,
  ranked.email,
  'accepted',
  COALESCE(ranked.assigned_by, ranked.mentor_user_id),
  ranked.mentor_user_id,
  ranked.updated_at,
  ranked.created_at,
  ranked.updated_at
FROM (
  SELECT
    project_mentor_assignments.*,
    projects.site_id,
    projects.program_id,
    user_accounts.display_name,
    user_accounts.email,
    ROW_NUMBER() OVER (
      PARTITION BY project_mentor_assignments.project_id
      ORDER BY project_mentor_assignments.updated_at DESC, project_mentor_assignments.id DESC
    ) AS row_number
  FROM project_mentor_assignments
  JOIN projects ON projects.id = project_mentor_assignments.project_id
  JOIN user_accounts ON user_accounts.id = project_mentor_assignments.mentor_user_id
  WHERE project_mentor_assignments.active = 1
    AND projects.status != 'archived'
    AND user_accounts.status = 'active'
) ranked
WHERE ranked.row_number = 1;

-- Confirm a Program Teacher only when the existing school/program data names
-- exactly one eligible person. Ambiguous or missing projects stay visibly flagged.
INSERT OR IGNORE INTO project_adult_assignments (
  id, project_id, site_id, program_id, adult_role, assignee_user_id,
  invited_name, invited_email, status, nominated_by, responded_by,
  responded_at
)
SELECT
  'adult-teacher-' || projects.id,
  projects.id,
  projects.site_id,
  projects.program_id,
  'program_teacher',
  teacher.id,
  teacher.display_name,
  teacher.email,
  'accepted',
  teacher.id,
  teacher.id,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM projects
JOIN user_roles teacher_role
  ON teacher_role.role_id = 'program_teacher'
 AND teacher_role.scope_type = 'program'
 AND teacher_role.scope_id = projects.program_id
JOIN user_accounts teacher ON teacher.id = teacher_role.user_id AND teacher.status = 'active'
JOIN site_users teacher_site
  ON teacher_site.user_id = teacher.id
 AND teacher_site.site_id = projects.site_id
 AND teacher_site.membership_status = 'active'
WHERE projects.status != 'archived'
  AND projects.program_id IS NOT NULL
  AND (
    SELECT COUNT(DISTINCT eligible_role.user_id)
    FROM user_roles eligible_role
    JOIN user_accounts eligible ON eligible.id = eligible_role.user_id AND eligible.status = 'active'
    JOIN site_users eligible_site
      ON eligible_site.user_id = eligible.id
     AND eligible_site.site_id = projects.site_id
     AND eligible_site.membership_status = 'active'
    WHERE eligible_role.role_id = 'program_teacher'
      AND eligible_role.scope_type = 'program'
      AND eligible_role.scope_id = projects.program_id
  ) = 1;
