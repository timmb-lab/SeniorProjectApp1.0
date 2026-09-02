CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts(ip_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_action_ip_time
  ON audit_events(action, ip_hash, created_at);
