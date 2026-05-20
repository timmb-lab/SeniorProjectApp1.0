-- Framework seed support tables (MVP-009 / SC-001)
-- These tables store structured curriculum framework metadata extracted into
-- data/capstone-framework.json. Seed logic lives in scripts/framework-seed.mjs.

CREATE TABLE IF NOT EXISTS requirement_sections (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_requirement_sections_requirement
  ON requirement_sections(requirement_id, active, sort_order);

CREATE TABLE IF NOT EXISTS requirement_credit_owners (
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  owner_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (requirement_id, owner_label)
);

CREATE TABLE IF NOT EXISTS requirement_student_evidence (
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  evidence_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (requirement_id, evidence_text)
);

CREATE TABLE IF NOT EXISTS requirement_dashboard_signals (
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  signal_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (requirement_id, signal_text)
);

CREATE TABLE IF NOT EXISTS requirement_review_gates (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  required INTEGER NOT NULL DEFAULT 1,
  reviewer_roles_json TEXT NOT NULL,
  approval_meaning TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_review_gates_requirement
  ON requirement_review_gates(requirement_id);

CREATE TABLE IF NOT EXISTS quality_checks (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  requirement_section_id TEXT REFERENCES requirement_sections(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'nudge' CHECK (severity IN ('blocker', 'warning', 'nudge')),
  prompt TEXT NOT NULL,
  check_type TEXT NOT NULL DEFAULT 'nudge' CHECK (check_type IN (
    'nudge',
    'required_field',
    'evidence_required',
    'human_review',
    'rubric_prompt',
    'automated_heuristic',
    'source_count'
  )),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_quality_checks_requirement
  ON quality_checks(requirement_id, active, sort_order);
