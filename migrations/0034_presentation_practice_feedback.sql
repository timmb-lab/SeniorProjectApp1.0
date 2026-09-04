PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS presentation_practice_feedback (
  id TEXT PRIMARY KEY,
  presentation_slot_id TEXT NOT NULL REFERENCES presentation_slots(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 1 AND 4),
  evidence_score INTEGER NOT NULL CHECK (evidence_score BETWEEN 1 AND 4),
  organization_score INTEGER NOT NULL CHECK (organization_score BETWEEN 1 AND 4),
  readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 1 AND 4),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (presentation_slot_id, author_user_id)
);

CREATE INDEX IF NOT EXISTS idx_presentation_practice_feedback_slot
  ON presentation_practice_feedback(presentation_slot_id, created_at DESC);
