PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_password_setup_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_password_setup_tokens_user_expires
  ON auth_password_setup_tokens(user_id, expires_at, used_at);
