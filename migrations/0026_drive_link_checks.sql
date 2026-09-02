PRAGMA foreign_keys = ON;

ALTER TABLE projects ADD COLUMN drive_folder_check_status TEXT NOT NULL DEFAULT 'not_checked'
  CHECK (drive_folder_check_status IN ('not_checked', 'student_confirmed', 'staff_confirmed'));
ALTER TABLE projects ADD COLUMN drive_folder_checked_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN drive_folder_checked_at TEXT;

ALTER TABLE project_templates ADD COLUMN link_check_status TEXT NOT NULL DEFAULT 'not_checked'
  CHECK (link_check_status IN ('not_checked', 'staff_confirmed'));
ALTER TABLE project_templates ADD COLUMN link_checked_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL;
ALTER TABLE project_templates ADD COLUMN link_checked_at TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_drive_folder_check_status
  ON projects(drive_folder_check_status, drive_folder_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_templates_link_check_status
  ON project_templates(site_id, active, link_check_status, updated_at DESC);
