PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS submission_versions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  requirement_id TEXT REFERENCES requirements(id) ON DELETE SET NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'revision_requested', 'approved', 'archived')),
  submitted_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  evidence_snapshot_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  UNIQUE (submission_id, version)
);

CREATE INDEX IF NOT EXISTS idx_submission_versions_submission_version
  ON submission_versions(submission_id, version DESC);
