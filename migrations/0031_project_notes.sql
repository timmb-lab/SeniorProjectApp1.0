PRAGMA foreign_keys = ON;

-- Project notes are shared, author-attributed updates that live with a project.
-- They are never hard-deleted. Archiving is reversible and keeps the audit trail.
CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1200),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  archived_at TEXT,
  archived_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  CHECK (
    (status = 'active' AND archived_at IS NULL AND archived_by IS NULL)
    OR
    (status = 'archived' AND archived_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_status_time
  ON project_notes(project_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_notes_author_time
  ON project_notes(author_user_id, updated_at DESC);
