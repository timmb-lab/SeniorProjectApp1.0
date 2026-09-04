ALTER TABLE evidence_artifacts ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'unknown'
  CHECK (availability_status IN ('unknown', 'available', 'missing_or_inaccessible', 'access_lost', 'provider_error'));
ALTER TABLE evidence_artifacts ADD COLUMN availability_checked_at TEXT;
ALTER TABLE evidence_artifacts ADD COLUMN availability_error_code TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_availability
  ON evidence_artifacts(availability_status, availability_checked_at);
