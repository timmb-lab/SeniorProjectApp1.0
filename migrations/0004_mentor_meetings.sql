PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mentor_meetings (
  id TEXT PRIMARY KEY,
  mentor_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'held', 'missed', 'makeup_required')),
  scheduled_for TEXT,
  held_at TEXT,
  notes TEXT,
  created_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_mentor_meetings_mentor_created
  ON mentor_meetings(mentor_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_mentor_meetings_student_created
  ON mentor_meetings(student_user_id, created_at);
