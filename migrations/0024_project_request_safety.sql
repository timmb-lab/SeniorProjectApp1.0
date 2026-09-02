PRAGMA foreign_keys = ON;

-- A tagged student must choose to join before staff can approve a team.
ALTER TABLE project_request_members
  ADD COLUMN invitation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (invitation_status IN ('pending', 'accepted', 'declined'));

ALTER TABLE project_request_members ADD COLUMN responded_at TEXT;

-- The student who submitted an older request already chose to join it.
UPDATE project_request_members
SET invitation_status = 'accepted',
    responded_at = COALESCE(responded_at, created_at)
WHERE requested_role = 'lead';

-- Keep a readable, request-specific history in addition to the global audit log.
CREATE TABLE IF NOT EXISTS project_request_events (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'submitted',
    'invitation_accepted',
    'invitation_declined',
    'changes_requested',
    'declined',
    'approved',
    'approval_undone'
  )),
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_project_request_events_request
  ON project_request_events(request_id, created_at, id);

-- One row per student records the exact membership replaced by an approval.
-- It is also the guardrail and recovery plan for a later undo.
CREATE TABLE IF NOT EXISTS project_request_moves (
  request_id TEXT NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  from_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  from_member_role TEXT CHECK (from_member_role IN ('lead', 'member')),
  to_project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  approved_by TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
  moved_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  reverted_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  reverted_at TEXT,
  PRIMARY KEY (request_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_request_moves_destination
  ON project_request_moves(to_project_id, reverted_at);

ALTER TABLE project_requests ADD COLUMN approval_reverted_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL;
ALTER TABLE project_requests ADD COLUMN approval_reverted_at TEXT;
ALTER TABLE project_requests ADD COLUMN approval_revert_reason TEXT;
