PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_mfa_totp (
  user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
  secret_ciphertext TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_used_step INTEGER,
  enrolled_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS auth_mfa_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('enroll', 'login')),
  secret_ciphertext TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_mfa_challenges_user_expires
  ON auth_mfa_challenges(user_id, expires_at, consumed_at);

CREATE TABLE IF NOT EXISTS auth_mfa_recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, code_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_mfa_recovery_codes_user_unused
  ON auth_mfa_recovery_codes(user_id, used_at);
