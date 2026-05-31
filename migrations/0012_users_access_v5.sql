PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO roles (id, label, description) VALUES
  ('global_admin', 'Global Admin', 'Platform-level administration across every site. Requires local credentials.'),
  ('administration', 'Administration', 'Assigned-site leadership visibility over students and programs.'),
  ('viewer', 'Viewer', 'Read-only visibility for specifically assigned students.'),
  ('site_admin', 'Site Admin', 'Operational user and assignment administration for assigned sites.');

UPDATE roles
SET label = 'Global Admin',
    description = 'Legacy platform-level administration across every site. New grants should use global_admin.'
WHERE id = 'admin';

UPDATE roles
SET label = 'Global Admin',
    description = 'Platform/system administration across organizations and sites. New grants should use global_admin.'
WHERE id = 'platform_admin';

UPDATE roles
SET label = 'Site Admin',
    description = 'Operational user and assignment administration for assigned sites.'
WHERE id = 'site_admin';

UPDATE roles
SET label = 'Administration',
    description = 'Assigned-site leadership visibility over students and programs.'
WHERE id = 'administration';

UPDATE roles
SET label = 'Legacy Reporting Admin',
    description = 'Legacy reporting-only access. Hidden from the Users & Access GUI.'
WHERE id = 'misc_admin';

CREATE TABLE IF NOT EXISTS viewer_student_assignments (
  id TEXT PRIMARY KEY,
  viewer_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  assigned_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (viewer_user_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_viewer_student_assignments_viewer
  ON viewer_student_assignments(viewer_user_id, active);

CREATE INDEX IF NOT EXISTS idx_viewer_student_assignments_student
  ON viewer_student_assignments(student_user_id, active);

-- Legacy full-platform admins become explicit Global Admins only when a
-- local password credential exists. SSO-only legacy admins are reported by
-- V5 verification tests instead of being silently over-permissioned.
INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
SELECT user_roles.user_id, 'global_admin', 'global', '', user_roles.assigned_by
FROM user_roles
JOIN password_credentials ON password_credentials.user_id = user_roles.user_id
WHERE user_roles.role_id IN ('admin', 'platform_admin')
  AND user_roles.scope_type = 'global';

-- Legacy site admins that already have active site membership receive
-- explicit site-scoped Site Admin grants while the old row remains for
-- compatibility with pre-V5 code paths.
INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
SELECT user_roles.user_id, 'site_admin', 'site', site_users.site_id, user_roles.assigned_by
FROM user_roles
JOIN site_users ON site_users.user_id = user_roles.user_id
 AND site_users.membership_status = 'active'
WHERE user_roles.role_id = 'site_admin'
  AND user_roles.scope_type = 'global';

-- Legacy misc_admin was narrow reporting access. Only users that already
-- have an active site membership are mapped to Administration for that site.
INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
SELECT user_roles.user_id, 'administration', 'site', site_users.site_id, user_roles.assigned_by
FROM user_roles
JOIN site_users ON site_users.user_id = user_roles.user_id
 AND site_users.membership_status = 'active'
WHERE user_roles.role_id = 'misc_admin';
