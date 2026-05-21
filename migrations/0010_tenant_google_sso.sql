PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  storage_mode TEXT NOT NULL DEFAULT 'app_managed_google_drive'
    CHECK (storage_mode IN ('app_managed_google_drive', 'tenant_owned_google_drive', 'pending')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tenant_domains (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, domain),
  UNIQUE (domain)
);

CREATE TABLE IF NOT EXISTS identity_providers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_workspace')),
  client_id TEXT,
  hosted_domain TEXT,
  status TEXT NOT NULL DEFAULT 'configured'
    CHECK (status IN ('configured', 'disabled', 'needs_config')),
  auto_provision_users INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tenant_id, provider, hosted_domain)
);

CREATE TABLE IF NOT EXISTS tenant_users (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  membership_status TEXT NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'suspended', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_workspace', 'local_password')),
  provider_subject TEXT NOT NULL,
  email_norm TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_login_at TEXT,
  UNIQUE (provider, provider_subject),
  UNIQUE (provider, email_norm)
);

CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,
  state_hash TEXT NOT NULL UNIQUE,
  nonce_hash TEXT NOT NULL,
  tenant_hint TEXT,
  return_to TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user
  ON tenant_users(user_id, membership_status);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user
  ON auth_identities(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires
  ON oauth_states(expires_at, used_at);

INSERT OR IGNORE INTO tenants (id, name, slug, status, subscription_status, storage_mode)
VALUES ('tenant-capstone-sandbox', 'Capstone Sandbox Tenant', 'capstone-sandbox', 'active', 'trial', 'app_managed_google_drive');

INSERT OR IGNORE INTO tenant_domains (id, tenant_id, domain, verified)
VALUES ('tenant-domain-senior-capstone-test', 'tenant-capstone-sandbox', 'senior-capstone.test', 1);

INSERT OR IGNORE INTO identity_providers (id, tenant_id, provider, hosted_domain, status, auto_provision_users)
VALUES ('idp-capstone-sandbox-google', 'tenant-capstone-sandbox', 'google_workspace', 'senior-capstone.test', 'needs_config', 0);
