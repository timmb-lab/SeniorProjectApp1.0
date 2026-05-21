CREATE TABLE IF NOT EXISTS export_artifacts (
  id TEXT PRIMARY KEY,
  export_id TEXT NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/json',
  byte_length INTEGER NOT NULL DEFAULT 0,
  content_sha256 TEXT NOT NULL,
  body_json TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_export_artifacts_export
  ON export_artifacts(export_id, artifact_type, created_at);
