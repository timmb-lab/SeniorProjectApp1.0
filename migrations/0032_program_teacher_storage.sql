PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS program_storage_configs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google_drive' CHECK (provider IN ('google_drive')),
  ownership_mode TEXT NOT NULL DEFAULT 'teacher_managed_shared_folder'
    CHECK (ownership_mode IN ('teacher_managed_shared_folder')),
  folder_url TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  folder_name TEXT,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'needs_attention', 'disconnected')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  configured_by TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
  verified_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  verified_at TEXT,
  disconnected_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (site_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_program_storage_scope
  ON program_storage_configs(site_id, program_id, status);

CREATE TABLE IF NOT EXISTS program_storage_history (
  id TEXT PRIMARY KEY,
  storage_config_id TEXT NOT NULL REFERENCES program_storage_configs(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision > 0),
  action TEXT NOT NULL CHECK (action IN ('configured', 'replaced', 'verified', 'disconnected')),
  folder_url TEXT,
  folder_id TEXT,
  folder_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'needs_attention', 'disconnected')),
  changed_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (storage_config_id, revision, action, changed_at)
);

CREATE INDEX IF NOT EXISTS idx_program_storage_history_config
  ON program_storage_history(storage_config_id, revision DESC, changed_at DESC);

ALTER TABLE evidence_artifacts ADD COLUMN program_storage_config_id TEXT
  REFERENCES program_storage_configs(id) ON DELETE SET NULL;
ALTER TABLE evidence_artifacts ADD COLUMN program_storage_revision INTEGER;
ALTER TABLE evidence_artifacts ADD COLUMN original_file_name TEXT;
ALTER TABLE evidence_artifacts ADD COLUMN preview_kind TEXT NOT NULL DEFAULT 'none'
  CHECK (preview_kind IN ('none', 'inline_pdf', 'converted_pdf', 'text_extract'));
ALTER TABLE evidence_artifacts ADD COLUMN preview_status TEXT NOT NULL DEFAULT 'not_requested'
  CHECK (preview_status IN ('not_requested', 'ready', 'processing', 'unsupported', 'failed'));
ALTER TABLE evidence_artifacts ADD COLUMN preview_drive_file_id TEXT;
ALTER TABLE evidence_artifacts ADD COLUMN preview_generated_at TEXT;
ALTER TABLE evidence_artifacts ADD COLUMN preview_error_code TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_program_storage
  ON evidence_artifacts(program_storage_config_id, program_storage_revision, created_at DESC);
