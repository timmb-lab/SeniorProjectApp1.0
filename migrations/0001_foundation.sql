PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_norm TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending_reset')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS password_credentials (
  user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'PBKDF2-SHA-256',
  iterations INTEGER NOT NULL DEFAULT 310000,
  password_version INTEGER NOT NULL DEFAULT 1,
  requires_reset INTEGER NOT NULL DEFAULT 0,
  password_changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  identifier_hash TEXT NOT NULL,
  ip_hash TEXT,
  success INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time
  ON login_attempts(identifier_hash, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT,
  revoked_at TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_expires
  ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT
);

INSERT OR IGNORE INTO roles (id, label, description) VALUES
  ('student', 'Student', 'Own workspace and own evidence only.'),
  ('mentor', 'Mentor', 'Assigned student visibility only.'),
  ('program_teacher', 'Program Teacher', 'Assigned program or cohort visibility.'),
  ('admin', 'Admin', 'Full operational access with audit logging.'),
  ('misc_admin', 'Misc Admin', 'Narrow explicit support permissions only.');

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  scope_type TEXT NOT NULL DEFAULT 'global',
  scope_id TEXT NOT NULL DEFAULT '',
  assigned_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, role_id, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO programs (id, name) VALUES
  ('it', 'IT'),
  ('culinary', 'Culinary'),
  ('hospitality-marketing', 'Hospitality & Marketing'),
  ('mechanical-technology', 'Mechanical Technology'),
  ('construction', 'Construction'),
  ('sports-medicine', 'Sports Medicine'),
  ('teaching-training', 'Teaching & Training'),
  ('early-childhood-education', 'Early Childhood Education'),
  ('medical-professions', 'Medical Professions');

CREATE TABLE IF NOT EXISTS cohorts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  school_year TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('program', 'cohort', 'mentor_assignment', 'custom')),
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  cohort_id TEXT REFERENCES cohorts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS group_memberships (
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS mentor_assignments (
  id TEXT PRIMARY KEY,
  mentor_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  assigned_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (mentor_user_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_assignments_student
  ON mentor_assignments(student_user_id, active);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progress_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  requirement_id TEXT REFERENCES requirements(id) ON DELETE SET NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'submitted', 'revision_requested', 'approved', 'archived')),
  updated_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_progress_student_phase
  ON progress_records(student_id, phase);

CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_status_history_student_time
  ON status_history(student_id, created_at);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  requirement_id TEXT REFERENCES requirements(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'revision_requested', 'approved', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'revision_requested', 'comment_only')),
  feedback TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_submission_time
  ON reviews(submission_id, created_at);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('submission', 'evidence_artifact', 'progress_record')),
  entity_id TEXT NOT NULL,
  author_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'student_and_staff' CHECK (visibility IN ('staff_only', 'student_and_staff')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_entity_time
  ON comments(entity_type, entity_id, created_at);

CREATE TABLE IF NOT EXISTS evidence_repositories (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'google_drive',
  title TEXT NOT NULL,
  root_folder_id TEXT,
  index_sheet_id TEXT,
  owner_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending_folder' CHECK (status IN ('pending_folder', 'active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO evidence_repositories (
  id,
  provider,
  title,
  root_folder_id,
  index_sheet_id,
  owner_email,
  status
) VALUES (
  'default-google-drive',
  'google_drive',
  'Senior Capstone Evidence Repository',
  NULL,
  '1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c',
  'bryan.timm89@gmail.com',
  'pending_folder'
);

CREATE TABLE IF NOT EXISTS evidence_artifacts (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL DEFAULT 'default-google-drive' REFERENCES evidence_repositories(id) ON DELETE RESTRICT,
  student_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('google_drive_file', 'external_link', 'generated_export')),
  drive_file_id TEXT,
  drive_parent_folder_id TEXT,
  external_url TEXT,
  title TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('pending_review', 'approved', 'revision_requested', 'archived')),
  created_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  CHECK (drive_file_id IS NOT NULL OR external_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_evidence_student_status
  ON evidence_artifacts(student_id, review_status);

CREATE TABLE IF NOT EXISTS deadlines (
  id TEXT PRIMARY KEY,
  requirement_id TEXT REFERENCES requirements(id) ON DELETE SET NULL,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  cohort_id TEXT REFERENCES cohorts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_at TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_deadlines_due
  ON deadlines(active, due_at);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_scope TEXT NOT NULL DEFAULT 'all' CHECK (audience_scope IN ('all', 'program', 'cohort', 'role')),
  audience_id TEXT,
  publish_at TEXT,
  expires_at TEXT,
  created_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  export_type TEXT NOT NULL,
  requested_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  target_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  drive_file_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'complete', 'failed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity_time
  ON audit_events(entity_type, entity_id, created_at);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('auth.mode', 'hardened_username_password'),
  ('evidence.provider', 'google_drive'),
  ('evidence.index_sheet_id', '1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c');
