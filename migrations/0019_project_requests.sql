PRAGMA foreign_keys = ON;

-- Students can suggest a new project and teammates. Staff approve the request
-- before any student's active project membership changes.
CREATE TABLE IF NOT EXISTS project_requests (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  submitted_by_student_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  proposed_name TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'changes_requested', 'declined', 'cancelled')),
  staff_feedback TEXT,
  reviewed_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  approved_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_project_requests_site_status
  ON project_requests(site_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_project_requests_submitter_status
  ON project_requests(submitted_by_student_id, status, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_requests_one_open_per_student
  ON project_requests(submitted_by_student_id)
  WHERE status = 'submitted';

CREATE TABLE IF NOT EXISTS project_request_members (
  request_id TEXT NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL DEFAULT 'member'
    CHECK (requested_role IN ('lead', 'member')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (request_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_request_members_student
  ON project_request_members(student_user_id, request_id);

CREATE TRIGGER IF NOT EXISTS trg_project_request_members_max_five_insert
BEFORE INSERT ON project_request_members
WHEN (
  SELECT COUNT(*)
  FROM project_request_members
  WHERE request_id = NEW.request_id
) >= 5
BEGIN
  SELECT RAISE(ABORT, 'A project request can tag no more than five students.');
END;

-- Keep the project model complete for students created after migration 0018.
CREATE TRIGGER IF NOT EXISTS trg_student_site_membership_create_project
AFTER INSERT ON site_users
WHEN NEW.membership_status = 'active'
 AND EXISTS (
   SELECT 1 FROM user_roles
   WHERE user_id = NEW.user_id AND role_id = 'student'
 )
 AND NOT EXISTS (
   SELECT 1 FROM project_members
   WHERE student_user_id = NEW.user_id AND active = 1
 )
BEGIN
  INSERT OR IGNORE INTO projects (
    id, site_id, name, summary, status, current_phase, created_by
  )
  SELECT
    'project-' || NEW.user_id,
    NEW.site_id,
    user_accounts.display_name || ' Project',
    'Your Senior Project workspace.',
    'active',
    'start',
    NEW.user_id
  FROM user_accounts
  WHERE user_accounts.id = NEW.user_id
    AND user_accounts.status = 'active';

  INSERT OR IGNORE INTO project_members (
    project_id, student_user_id, member_role, active, assigned_by
  )
  SELECT 'project-' || NEW.user_id, NEW.user_id, 'lead', 1, NEW.user_id
  WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'project-' || NEW.user_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_student_role_create_project
AFTER INSERT ON user_roles
WHEN NEW.role_id = 'student'
 AND NOT EXISTS (
   SELECT 1 FROM project_members
   WHERE student_user_id = NEW.user_id AND active = 1
 )
BEGIN
  INSERT OR IGNORE INTO projects (
    id, site_id, name, summary, status, current_phase, created_by
  )
  SELECT
    'project-' || NEW.user_id,
    site_users.site_id,
    user_accounts.display_name || ' Project',
    'Your Senior Project workspace.',
    'active',
    'start',
    NEW.user_id
  FROM user_accounts
  JOIN site_users ON site_users.user_id = user_accounts.id
    AND site_users.membership_status = 'active'
  JOIN sites ON sites.id = site_users.site_id
    AND sites.status = 'active'
  WHERE user_accounts.id = NEW.user_id
    AND user_accounts.status = 'active'
  ORDER BY site_users.site_id
  LIMIT 1;

  INSERT OR IGNORE INTO project_members (
    project_id, student_user_id, member_role, active, assigned_by
  )
  SELECT 'project-' || NEW.user_id, NEW.user_id, 'lead', 1, NEW.user_id
  WHERE EXISTS (SELECT 1 FROM projects WHERE id = 'project-' || NEW.user_id);
END;
