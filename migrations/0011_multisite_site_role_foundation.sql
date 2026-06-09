PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  school_year TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS site_users (
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  membership_status TEXT NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'suspended', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (site_id, user_id)
);

CREATE TABLE IF NOT EXISTS site_programs (
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (site_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_sites_tenant_status
  ON sites(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_site_users_user_status
  ON site_users(user_id, membership_status);

CREATE INDEX IF NOT EXISTS idx_site_programs_program_active
  ON site_programs(program_id, active);

INSERT OR IGNORE INTO roles (id, label, description) VALUES
  ('platform_admin', 'Platform Admin', 'Platform/system administration across organizations and sites.'),
  ('org_admin', 'Organization Admin', 'Organization-level oversight across assigned sites.'),
  ('site_admin', 'Site Admin', 'Site-level administration/leadership visibility and operations.'),
  ('viewer', 'Viewer', 'Read-only operational visibility for assigned scope.');

INSERT OR IGNORE INTO sites (
  id,
  tenant_id,
  name,
  slug,
  status,
  school_year
) VALUES (
  'site-capstone-sandbox-main',
  'tenant-capstone-sandbox',
  'Capstone Sandbox High School',
  'capstone-sandbox-main',
  'active',
  '2026-2027'
);

INSERT OR IGNORE INTO site_programs (site_id, program_id, active)
SELECT
  'site-capstone-sandbox-main',
  id,
  1
FROM programs
WHERE active = 1;
