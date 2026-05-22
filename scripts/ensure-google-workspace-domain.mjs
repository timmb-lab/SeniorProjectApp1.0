#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeEmail, randomId } from "../functions/_lib/crypto.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const DATABASE_NAME = "senior-capstone-db";
const DEFAULT_ACCOUNT_ID = "539e8f7c55e7b1472013626ad72f4c7f";

const DOMAIN_POLICIES = {
  "learntechonline.org": {
    autoProvisionUsers: 0,
    owner: {
      email: "bryan@learntechonline.org",
      displayName: "Bryan Timm",
      roleId: "admin",
      scopeType: "global",
      scopeId: "",
    },
  },
};

class GoogleWorkspaceDomainEnsureError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "GoogleWorkspaceDomainEnsureError";
    this.classification = classification;
    this.details = details;
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    target: "",
    domain: "",
    tenantSlug: "",
    mode: "",
    userEmail: "",
    displayName: "",
    roleId: "",
    noUser: false,
    noAdminRole: false,
    autoProvisionUsers: null,
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--remote") {
      if (parsed.target) throw usageError("Choose exactly one target. This script currently supports --remote.");
      parsed.target = "remote";
    } else if (value === "--domain") {
      parsed.domain = cleanDomain(values[index + 1] || "");
      index += 1;
    } else if (value === "--tenant-slug") {
      parsed.tenantSlug = cleanSlug(values[index + 1] || "");
      index += 1;
    } else if (value === "--dry-run") {
      if (parsed.mode) throw usageError("Choose exactly one mode: --dry-run or --write.");
      parsed.mode = "dry-run";
    } else if (value === "--write") {
      if (parsed.mode) throw usageError("Choose exactly one mode: --dry-run or --write.");
      parsed.mode = "write";
    } else if (value === "--user-email") {
      parsed.userEmail = normalizeEmail(values[index + 1] || "");
      index += 1;
    } else if (value === "--display-name") {
      parsed.displayName = cleanDisplayName(values[index + 1] || "");
      index += 1;
    } else if (value === "--role") {
      parsed.roleId = cleanRole(values[index + 1] || "");
      index += 1;
    } else if (value === "--auto-provision-users") {
      parsed.autoProvisionUsers = parseBooleanNumber(values[index + 1] || "");
      index += 1;
    } else if (value === "--no-user") {
      parsed.noUser = true;
    } else if (value === "--no-admin-role") {
      parsed.noAdminRole = true;
    } else if (value === "--help" || value === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw usageError(`Unknown argument: ${value}`);
    }
  }

  if (parsed.target !== "remote") throw usageError("Pass --remote.");
  if (!parsed.domain) throw usageError("Pass --domain <workspace-domain>.");
  if (!parsed.mode) throw usageError("Choose --dry-run or --write.");
  if (parsed.noUser && (parsed.userEmail || parsed.displayName || parsed.roleId || parsed.noAdminRole)) {
    throw usageError("--no-user cannot be combined with user or role options.");
  }

  return parsed;
}

function usageError(message) {
  return new GoogleWorkspaceDomainEnsureError("INVALID_ARGUMENTS", message);
}

function printUsage() {
  console.log([
    "Usage:",
    "  node scripts/ensure-google-workspace-domain.mjs --remote --domain learntechonline.org --dry-run",
    "  node scripts/ensure-google-workspace-domain.mjs --remote --domain learntechonline.org --write",
    "",
    "Optional:",
    "  --tenant-slug <slug>              Use a specific active tenant.",
    "  --auto-provision-users 0|1        Override the repo policy default for the identity provider.",
    "  --user-email <email>              Ensure a pre-provisioned account when auto-provisioning is disabled.",
    "  --display-name <name>             Display name for a newly-created user.",
    "  --role <role-id>                  Assign a global role to the ensured user.",
    "  --no-user                        Only repair domain/provider records.",
    "  --no-admin-role                  Ensure the user without assigning a role.",
  ].join("\n"));
}

function assertRepoIdentity() {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new GoogleWorkspaceDomainEnsureError("IDENTITY_GUARD_FAILED", "Unexpected package name.");
  }
}

function readWranglerConfig() {
  const raw = readFileSync(path.join(REPO_ROOT, "wrangler.jsonc"), "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(stripJsonComments(raw));
}

function stripJsonComments(text) {
  let output = "";
  let inString = false;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        output += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) inString = false;
      continue;
    }
    if (char === "\"" || char === "'") {
      inString = true;
      quote = char;
      output += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }
    output += char;
  }
  return output;
}

function databaseIdFromWrangler(config) {
  const binding = (config.d1_databases || []).find((item) => item.binding === "DB" && item.database_name === DATABASE_NAME);
  if (!binding?.database_id) {
    throw new GoogleWorkspaceDomainEnsureError("IDENTITY_GUARD_FAILED", "Expected D1 binding was not found in wrangler.jsonc.");
  }
  return binding.database_id;
}

class RemoteD1 {
  constructor({ accountId, databaseId, token }) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.token = token;
  }

  async query(sql, params = []) {
    if (!this.token) {
      throw new GoogleWorkspaceDomainEnsureError("REMOTE_D1_BLOCKED_NO_TOKEN", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
    }
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success !== true) {
      throw new GoogleWorkspaceDomainEnsureError("REMOTE_D1_QUERY_FAILED", "Remote D1 query failed.", cloudflareErrorDetails(response, body));
    }
    return normalizeResultRows(body);
  }

  async batch(statements) {
    if (!this.token) {
      throw new GoogleWorkspaceDomainEnsureError("REMOTE_D1_BLOCKED_NO_TOKEN", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
    }
    for (const statement of statements) {
      await this.query(statement.sql, statement.params || []);
    }
  }
}

function cloudflareErrorDetails(response, body) {
  return {
    status: response.status,
    errorCodes: Array.isArray(body?.errors) ? body.errors.map((error) => error.code) : [],
    errorMessages: Array.isArray(body?.errors) ? body.errors.map((error) => safeErrorText(error.message)) : [],
  };
}

function normalizeResultRows(payload) {
  if (Array.isArray(payload)) return payload[0]?.results || [];
  if (Array.isArray(payload?.result)) return payload.result[0]?.results || [];
  return payload?.result?.results || [];
}

async function ensureGoogleWorkspaceDomain(args) {
  assertRepoIdentity();
  const config = readWranglerConfig();
  const adapter = new RemoteD1({
    accountId: envValue("CLOUDFLARE_ACCOUNT_ID") || DEFAULT_ACCOUNT_ID,
    databaseId: databaseIdFromWrangler(config),
    token: envValue("CLOUDFLARE_API_TOKEN"),
  });

  await assertRequiredSchema(adapter);

  const policy = policyForDomain(args.domain, args);
  const tenant = await chooseTenant(adapter, {
    domain: args.domain,
    tenantSlug: args.tenantSlug,
  });
  const before = await readDomainState(adapter, args.domain, policy.owner?.email);
  const plan = await buildPlan(adapter, { args, tenant, policy, before });

  if (args.mode === "write") {
    await adapter.batch(plan.statements);
  }

  const after = args.mode === "write"
    ? await readDomainState(adapter, args.domain, policy.owner?.email)
    : before;
  const verification = verifyState({ args, tenant, policy, state: after, mode: args.mode });

  return {
    ok: true,
    target: "remote",
    mode: args.mode,
    domain: args.domain,
    tenant: publicTenant(tenant),
    policy: {
      autoProvisionUsers: policy.autoProvisionUsers,
      preProvisionUser: policy.owner ? {
        email: policy.owner.email,
        displayName: policy.owner.displayName,
        roleId: policy.owner.roleId || null,
        scopeType: policy.owner.scopeType || null,
        scopeId: policy.owner.scopeId,
      } : null,
    },
    before: publicState(before),
    operations: plan.operations,
    after: publicState(after),
    verification,
  };
}

async function assertRequiredSchema(adapter) {
  const required = [
    "tenants",
    "tenant_domains",
    "identity_providers",
    "auth_identities",
    "user_accounts",
    "tenant_users",
    "user_roles",
    "roles",
    "audit_events",
  ];
  const rows = await adapter.query(
    `SELECT name FROM sqlite_master
     WHERE type = 'table'
       AND name IN (${required.map(() => "?").join(", ")})
     ORDER BY name`,
    required,
  );
  const found = new Set(rows.map((row) => row.name));
  const missing = required.filter((name) => !found.has(name));
  if (missing.length > 0) {
    throw new GoogleWorkspaceDomainEnsureError("REMOTE_SCHEMA_INCOMPLETE", "Remote D1 is missing required SSO tables.", { missing });
  }
}

function policyForDomain(domain, args) {
  const domainPolicy = DOMAIN_POLICIES[domain] || {};
  const autoProvisionUsers = args.autoProvisionUsers ?? domainPolicy.autoProvisionUsers ?? 0;
  if (args.noUser || autoProvisionUsers === 1) {
    return { autoProvisionUsers, owner: null };
  }

  const ownerEmail = args.userEmail || domainPolicy.owner?.email || "";
  if (!ownerEmail) {
    return { autoProvisionUsers, owner: null };
  }

  const displayName = cleanDisplayName(args.displayName || domainPolicy.owner?.displayName || ownerEmail.split("@")[0]);
  const roleId = args.noAdminRole ? "" : (args.roleId || domainPolicy.owner?.roleId || "");
  return {
    autoProvisionUsers,
    owner: {
      email: ownerEmail,
      displayName,
      roleId,
      scopeType: roleId ? (domainPolicy.owner?.scopeType || "global") : "",
      scopeId: roleId ? (domainPolicy.owner?.scopeId || "") : "",
    },
  };
}

async function chooseTenant(adapter, { domain, tenantSlug }) {
  const existingDomainRows = await adapter.query(
    `SELECT td.tenant_id, td.domain, td.verified, t.name, t.slug, t.status, t.subscription_status, t.storage_mode
     FROM tenant_domains td
     JOIN tenants t ON t.id = td.tenant_id
     WHERE lower(td.domain) = ?`,
    [domain],
  );
  if (existingDomainRows.length > 0) {
    const row = existingDomainRows[0];
    if (tenantSlug && row.slug !== tenantSlug) {
      throw new GoogleWorkspaceDomainEnsureError("DOMAIN_ALREADY_ASSIGNED", "Domain is already assigned to a different tenant.", {
        domain,
        existingTenantSlug: row.slug,
        requestedTenantSlug: tenantSlug,
      });
    }
    if (row.status !== "active") {
      throw new GoogleWorkspaceDomainEnsureError("TENANT_NOT_ACTIVE", "Existing domain tenant is not active.", {
        domain,
        tenantSlug: row.slug,
        status: row.status,
      });
    }
    return tenantFromRow(row);
  }

  if (tenantSlug) {
    const rows = await adapter.query(
      `SELECT id, name, slug, status, subscription_status, storage_mode
       FROM tenants
       WHERE slug = ?`,
      [tenantSlug],
    );
    if (rows.length === 0) {
      throw new GoogleWorkspaceDomainEnsureError("TENANT_NOT_FOUND", "Requested tenant slug was not found.", { tenantSlug });
    }
    if (rows[0].status !== "active") {
      throw new GoogleWorkspaceDomainEnsureError("TENANT_NOT_ACTIVE", "Requested tenant is not active.", {
        tenantSlug,
        status: rows[0].status,
      });
    }
    return tenantFromRow(rows[0]);
  }

  const activeRows = await adapter.query(
    `SELECT id, name, slug, status, subscription_status, storage_mode
     FROM tenants
     WHERE status = 'active'
     ORDER BY slug`,
  );
  const testRows = activeRows.filter((row) => /\b(test|sandbox|demo|pilot|capstone)\b/i.test(`${row.slug} ${row.name}`));
  if (testRows.length === 1) return tenantFromRow(testRows[0]);
  if (testRows.length > 1) {
    throw new GoogleWorkspaceDomainEnsureError("TENANT_INFERENCE_AMBIGUOUS", "Multiple active test tenants match. Pass --tenant-slug.", {
      candidates: testRows.map(publicTenant),
    });
  }
  if (activeRows.length === 1) return tenantFromRow(activeRows[0]);
  throw new GoogleWorkspaceDomainEnsureError("TENANT_INFERENCE_AMBIGUOUS", "No single active test tenant could be inferred. Pass --tenant-slug.", {
    candidates: activeRows.map(publicTenant),
  });
}

async function readDomainState(adapter, domain, ownerEmail = "") {
  const [domainRows, providerRows, tenantRows, ownerRows, identityRows, membershipRows, roleRows] = await Promise.all([
    adapter.query(
      `SELECT td.id, td.tenant_id, t.slug AS tenant_slug, td.domain, td.verified
       FROM tenant_domains td
       JOIN tenants t ON t.id = td.tenant_id
       WHERE lower(td.domain) = ?`,
      [domain],
    ),
    adapter.query(
      `SELECT ip.id, ip.tenant_id, t.slug AS tenant_slug, ip.provider, ip.hosted_domain, ip.status, ip.auto_provision_users,
              CASE WHEN ip.client_id IS NULL OR ip.client_id = '' THEN 0 ELSE 1 END AS has_client_id
       FROM identity_providers ip
       JOIN tenants t ON t.id = ip.tenant_id
       WHERE ip.provider = 'google_workspace'
         AND lower(ip.hosted_domain) = ?`,
      [domain],
    ),
    adapter.query(
      `SELECT id, name, slug, status, subscription_status, storage_mode
       FROM tenants
       ORDER BY slug`,
    ),
    ownerEmail
      ? adapter.query(
        `SELECT id, email_norm, display_name, status
         FROM user_accounts
         WHERE email_norm = ?`,
        [ownerEmail],
      )
      : Promise.resolve([]),
    ownerEmail
      ? adapter.query(
        `SELECT ai.id, ai.user_id, ai.tenant_id, ai.provider, ai.email_norm, ua.email_norm AS user_email_norm
         FROM auth_identities ai
         LEFT JOIN user_accounts ua ON ua.id = ai.user_id
         WHERE ai.provider = 'google_workspace'
           AND ai.email_norm = ?`,
        [ownerEmail],
      )
      : Promise.resolve([]),
    ownerEmail
      ? adapter.query(
        `SELECT tu.tenant_id, t.slug AS tenant_slug, tu.user_id, tu.membership_status
         FROM tenant_users tu
         JOIN tenants t ON t.id = tu.tenant_id
         JOIN user_accounts ua ON ua.id = tu.user_id
         WHERE ua.email_norm = ?`,
        [ownerEmail],
      )
      : Promise.resolve([]),
    ownerEmail
      ? adapter.query(
        `SELECT ur.user_id, ur.role_id, ur.scope_type, ur.scope_id
         FROM user_roles ur
         JOIN user_accounts ua ON ua.id = ur.user_id
         WHERE ua.email_norm = ?
         ORDER BY ur.role_id, ur.scope_type, ur.scope_id`,
        [ownerEmail],
      )
      : Promise.resolve([]),
  ]);

  return {
    tenants: tenantRows.map(tenantFromRow),
    domain: domainRows[0] || null,
    provider: providerRows[0] || null,
    owner: ownerRows[0] || null,
    ownerIdentities: identityRows,
    ownerMemberships: membershipRows,
    ownerRoles: roleRows,
  };
}

async function buildPlan(adapter, { args, tenant, policy, before }) {
  const statements = [];
  const operations = [];
  const domainId = `tenant-domain-${slugPart(args.domain)}`;
  const idpId = `idp-${slugPart(tenant.slug)}-${slugPart(args.domain)}-google`;

  if (!before.domain) {
    operations.push({ table: "tenant_domains", action: "insert", domain: args.domain, tenantSlug: tenant.slug, verified: 1 });
    statements.push({
      sql: `INSERT INTO tenant_domains (id, tenant_id, domain, verified)
            VALUES (?, ?, ?, 1)`,
      params: [domainId, tenant.id, args.domain],
    });
  } else {
    if (before.domain.tenant_id !== tenant.id) {
      throw new GoogleWorkspaceDomainEnsureError("DOMAIN_ALREADY_ASSIGNED", "Domain is already assigned to a different tenant.", {
        domain: args.domain,
        existingTenantSlug: before.domain.tenant_slug,
        selectedTenantSlug: tenant.slug,
      });
    }
    if (before.domain.domain !== args.domain || Number(before.domain.verified || 0) !== 1) {
      operations.push({ table: "tenant_domains", action: "update", domain: args.domain, tenantSlug: tenant.slug, verified: 1 });
      statements.push({
        sql: `UPDATE tenant_domains
              SET domain = ?, verified = 1
              WHERE id = ?`,
        params: [args.domain, before.domain.id],
      });
    } else {
      operations.push({ table: "tenant_domains", action: "unchanged", domain: args.domain, tenantSlug: tenant.slug, verified: 1 });
    }
  }

  if (!before.provider) {
    operations.push({
      table: "identity_providers",
      action: "insert",
      provider: "google_workspace",
      hostedDomain: args.domain,
      tenantSlug: tenant.slug,
      status: "configured",
      autoProvisionUsers: policy.autoProvisionUsers,
    });
    statements.push({
      sql: `INSERT INTO identity_providers (id, tenant_id, provider, hosted_domain, status, auto_provision_users)
            VALUES (?, ?, 'google_workspace', ?, 'configured', ?)`,
      params: [idpId, tenant.id, args.domain, policy.autoProvisionUsers],
    });
  } else {
    if (before.provider.tenant_id !== tenant.id) {
      throw new GoogleWorkspaceDomainEnsureError("IDENTITY_PROVIDER_TENANT_MISMATCH", "Identity provider is assigned to a different tenant.", {
        domain: args.domain,
        existingTenantSlug: before.provider.tenant_slug,
        selectedTenantSlug: tenant.slug,
      });
    }
    const providerNeedsUpdate =
      before.provider.hosted_domain !== args.domain ||
      before.provider.status !== "configured" ||
      Number(before.provider.auto_provision_users || 0) !== policy.autoProvisionUsers;
    if (providerNeedsUpdate) {
      operations.push({
        table: "identity_providers",
        action: "update",
        provider: "google_workspace",
        hostedDomain: args.domain,
        tenantSlug: tenant.slug,
        status: "configured",
        autoProvisionUsers: policy.autoProvisionUsers,
      });
      statements.push({
        sql: `UPDATE identity_providers
              SET hosted_domain = ?,
                  status = 'configured',
                  auto_provision_users = ?,
                  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
              WHERE id = ?`,
        params: [args.domain, policy.autoProvisionUsers, before.provider.id],
      });
    } else {
      operations.push({
        table: "identity_providers",
        action: "unchanged",
        provider: "google_workspace",
        hostedDomain: args.domain,
        tenantSlug: tenant.slug,
        status: "configured",
        autoProvisionUsers: policy.autoProvisionUsers,
      });
    }
  }

  if (policy.owner) {
    await appendOwnerPlan(adapter, { tenant, policy, before, statements, operations });
  } else if (policy.autoProvisionUsers === 1) {
    operations.push({ table: "user_accounts", action: "skipped_auto_provision_enabled" });
  } else {
    operations.push({ table: "user_accounts", action: "skipped_no_user_requested" });
  }

  if (statements.length > 0) {
    operations.push({ table: "audit_events", action: "insert", entityType: "tenant", entityId: tenant.id });
    statements.push({
      sql: `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
            VALUES (?, NULL, 'google_workspace_domain_repaired', 'tenant', ?, ?)`,
      params: [randomId("audit"), tenant.id, JSON.stringify({
        domain: args.domain,
        tenantSlug: tenant.slug,
        operations: operations
          .filter((operation) => operation.table !== "audit_events")
          .map((operation) => ({ table: operation.table, action: operation.action })),
        script: "scripts/ensure-google-workspace-domain.mjs",
      })],
    });
  }

  return { statements, operations };
}

async function appendOwnerPlan(adapter, { tenant, policy, before, statements, operations }) {
  const owner = policy.owner;
  let ownerUser = before.owner;
  if (!ownerUser) {
    const userId = randomId("user");
    ownerUser = {
      id: userId,
      email_norm: owner.email,
      display_name: owner.displayName,
      status: "active",
    };
    operations.push({
      table: "user_accounts",
      action: "insert",
      email: owner.email,
      displayName: owner.displayName,
      status: "active",
    });
    statements.push({
      sql: `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
            VALUES (?, ?, ?, ?, 'active')`,
      params: [userId, owner.email, owner.email, owner.displayName],
    });
  } else if (ownerUser.status !== "active") {
    throw new GoogleWorkspaceDomainEnsureError("OWNER_ACCOUNT_NOT_ACTIVE", "The existing owner account is not active; refusing to reset or reactivate it.", {
      email: owner.email,
      status: ownerUser.status,
    });
  } else {
    operations.push({
      table: "user_accounts",
      action: "unchanged",
      email: owner.email,
      status: "active",
    });
  }

  const conflictingIdentity = before.ownerIdentities.find((identity) => identity.user_id !== ownerUser.id);
  if (conflictingIdentity) {
    throw new GoogleWorkspaceDomainEnsureError("OWNER_IDENTITY_CONFLICT", "A Google Workspace identity for the owner email points at a different user.", {
      email: owner.email,
      identityUserId: conflictingIdentity.user_id,
    });
  }

  if (before.ownerIdentities.length > 0) {
    operations.push({ table: "auth_identities", action: "unchanged", email: owner.email, linked: true });
  } else {
    operations.push({ table: "auth_identities", action: "defer_until_callback", email: owner.email, linked: false });
  }

  const existingMembership = before.ownerMemberships.find((membership) => membership.tenant_id === tenant.id);
  if (!existingMembership) {
    operations.push({ table: "tenant_users", action: "insert", email: owner.email, tenantSlug: tenant.slug, membershipStatus: "active" });
    statements.push({
      sql: `INSERT INTO tenant_users (tenant_id, user_id, membership_status)
            VALUES (?, ?, 'active')`,
      params: [tenant.id, ownerUser.id],
    });
  } else if (existingMembership.membership_status !== "active") {
    throw new GoogleWorkspaceDomainEnsureError("OWNER_TENANT_MEMBERSHIP_NOT_ACTIVE", "The existing owner tenant membership is not active; refusing to reactivate it.", {
      email: owner.email,
      tenantSlug: tenant.slug,
      membershipStatus: existingMembership.membership_status,
    });
  } else {
    operations.push({ table: "tenant_users", action: "unchanged", email: owner.email, tenantSlug: tenant.slug, membershipStatus: "active" });
  }

  if (!owner.roleId) return;

  const roleRows = await adapter.query("SELECT id FROM roles WHERE id = ?", [owner.roleId]);
  if (roleRows.length === 0) {
    throw new GoogleWorkspaceDomainEnsureError("ROLE_NOT_FOUND", "Requested role does not exist.", { roleId: owner.roleId });
  }
  const hasRole = before.ownerRoles.some((role) =>
    role.role_id === owner.roleId &&
    role.scope_type === owner.scopeType &&
    role.scope_id === owner.scopeId
  );
  if (!hasRole) {
    operations.push({
      table: "user_roles",
      action: "insert",
      email: owner.email,
      roleId: owner.roleId,
      scopeType: owner.scopeType,
      scopeId: owner.scopeId,
    });
    statements.push({
      sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
            VALUES (?, ?, ?, ?, NULL)`,
      params: [ownerUser.id, owner.roleId, owner.scopeType, owner.scopeId],
    });
  } else {
    operations.push({
      table: "user_roles",
      action: "unchanged",
      email: owner.email,
      roleId: owner.roleId,
      scopeType: owner.scopeType,
      scopeId: owner.scopeId,
    });
  }
}

function verifyState({ args, tenant, policy, state, mode }) {
  const domainReady = Boolean(
    state.domain &&
    state.domain.tenant_id === tenant.id &&
    state.domain.domain === args.domain &&
    Number(state.domain.verified || 0) === 1
  );
  const providerReady = Boolean(
    state.provider &&
    state.provider.tenant_id === tenant.id &&
    state.provider.provider === "google_workspace" &&
    state.provider.hosted_domain === args.domain &&
    state.provider.status === "configured" &&
    Number(state.provider.auto_provision_users || 0) === policy.autoProvisionUsers
  );
  const ownerReady = !policy.owner || Boolean(
    state.owner &&
    state.owner.email_norm === policy.owner.email &&
    state.owner.status === "active" &&
    state.ownerMemberships.some((membership) =>
      membership.tenant_id === tenant.id &&
      membership.membership_status === "active"
    ) &&
    (!policy.owner.roleId || state.ownerRoles.some((role) =>
      role.role_id === policy.owner.roleId &&
      role.scope_type === policy.owner.scopeType &&
      role.scope_id === policy.owner.scopeId
    ))
  );

  return {
    resolverReady: mode === "write" ? domainReady && providerReady : null,
    domainReady,
    providerReady,
    ownerReady,
    callbackWillLinkGoogleIdentity: Boolean(policy.owner && state.ownerIdentities.length === 0),
    callbackWillAutoProvisionUser: policy.autoProvisionUsers === 1 && !policy.owner,
  };
}

function publicState(state) {
  return {
    tenants: state.tenants.map(publicTenant),
    domain: state.domain ? {
      id: state.domain.id,
      tenantSlug: state.domain.tenant_slug,
      domain: state.domain.domain,
      verified: Number(state.domain.verified || 0),
    } : null,
    provider: state.provider ? {
      id: state.provider.id,
      tenantSlug: state.provider.tenant_slug,
      provider: state.provider.provider,
      hostedDomain: state.provider.hosted_domain,
      status: state.provider.status,
      autoProvisionUsers: Number(state.provider.auto_provision_users || 0),
      hasClientId: Number(state.provider.has_client_id || 0) === 1,
    } : null,
    owner: state.owner ? {
      email: state.owner.email_norm,
      displayName: state.owner.display_name,
      status: state.owner.status,
    } : null,
    ownerIdentityLinked: state.ownerIdentities.length > 0,
    ownerMemberships: state.ownerMemberships.map((membership) => ({
      tenantSlug: membership.tenant_slug,
      membershipStatus: membership.membership_status,
    })),
    ownerRoles: state.ownerRoles.map((role) => ({
      roleId: role.role_id,
      scopeType: role.scope_type,
      scopeId: role.scope_id,
    })),
  };
}

function tenantFromRow(row) {
  return {
    id: row.id || row.tenant_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    subscription_status: row.subscription_status,
    storage_mode: row.storage_mode,
  };
}

function publicTenant(tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    subscriptionStatus: tenant.subscription_status,
    storageMode: tenant.storage_mode,
  };
}

function envValue(name) {
  const processValue = String(process.env[name] || "").trim();
  if (processValue || process.platform !== "win32") return processValue;
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `[Environment]::GetEnvironmentVariable('${name}', 'User')`,
  ], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0 ? String(result.stdout || "").trim() : "";
}

function cleanDomain(value) {
  const trimmed = String(value || "").trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9.-]+$/.test(trimmed) || trimmed.includes("..") || !trimmed.includes(".")) return "";
  return trimmed;
}

function cleanSlug(value) {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(trimmed)) return "";
  return trimmed;
}

function cleanRole(value) {
  const trimmed = String(value || "").trim();
  if (!/^[a-z0-9_-]+$/.test(trimmed)) return "";
  return trimmed;
}

function cleanDisplayName(value) {
  const trimmed = String(value || "").trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 120) {
    throw new GoogleWorkspaceDomainEnsureError("INVALID_ARGUMENTS", "Display name must be 2 to 120 characters.");
  }
  return trimmed;
}

function parseBooleanNumber(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return 1;
  if (["0", "false", "no", "off"].includes(normalized)) return 0;
  throw usageError("--auto-provision-users must be 0 or 1.");
}

function slugPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function redactDetails(details) {
  return JSON.parse(JSON.stringify(details || {}).replace(/[A-Za-z0-9_-]{80,}/g, "[redacted]"));
}

function safeErrorText(value) {
  return String(value || "")
    .replace(
      /\b(client[_-]?secret|password|pepper|private[_-]?key|token|state|nonce)\b\s*[:=]\s*["']?[^"',\s;)]*/gi,
      "$1=[redacted]",
    )
    .replace(/[A-Za-z0-9_-]{80,}/g, "[redacted]")
    .slice(0, 240);
}

export {
  GoogleWorkspaceDomainEnsureError,
  ensureGoogleWorkspaceDomain,
  parseArgs,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs();
    const result = await ensureGoogleWorkspaceDomain(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof GoogleWorkspaceDomainEnsureError) {
      console.error(`Google Workspace domain ensure failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactDetails(error.details))}`);
      }
    } else {
      console.error(`Google Workspace domain ensure failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
