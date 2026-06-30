PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_roster_profiles (
  student_user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
  cohort TEXT NOT NULL DEFAULT '',
  graduation_year TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_student_roster_profiles_graduation_year
  ON student_roster_profiles(graduation_year);
