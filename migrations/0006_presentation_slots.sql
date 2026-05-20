PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS presentation_slots (
  id TEXT PRIMARY KEY,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  requirement_id TEXT REFERENCES requirements(id) ON DELETE SET NULL,
  scheduled_for TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (duration_minutes BETWEEN 5 AND 120),
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_out', 'checked_in', 'completed', 'cancelled')),
  outline_status TEXT NOT NULL DEFAULT 'pending' CHECK (outline_status IN ('pending', 'approved', 'revision_needed')),
  checked_out_at TEXT,
  checked_in_at TEXT,
  notes TEXT,
  created_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_presentation_slots_student_time
  ON presentation_slots(student_user_id, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_presentation_slots_location_time
  ON presentation_slots(location, scheduled_for, status);
