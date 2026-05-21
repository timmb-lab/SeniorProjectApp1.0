#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hashPassword, newRandomToken, normalizeEmail, randomId, validatePassword } from "../functions/_lib/crypto.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_CWD = path.resolve("C:/SeniorProjectApp1.0");
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const OWNER_EMAIL = "bryan.timm89@gmail.com";
const OWNER_DISPLAY_NAME = "Bryan Timm";
const DATABASE_NAME = "senior-capstone-db";
const ACCOUNT_ID = "539e8f7c55e7b1472013626ad72f4c7f";
const DEFAULT_BASE_URL = "https://senior-capstone-app.pages.dev";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

class OwnerAdminEnsureError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "OwnerAdminEnsureError";
    this.classification = classification;
    this.details = details;
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = { target: "", baseUrl: DEFAULT_BASE_URL };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--local" || value === "--remote") {
      if (parsed.target) {
        throw new OwnerAdminEnsureError("INVALID_ARGUMENTS", "Choose exactly one target: --local or --remote.");
      }
      parsed.target = value.slice(2);
    } else if (value === "--base-url") {
      parsed.baseUrl = values[index + 1] || "";
      index += 1;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/ensure-owner-admin-account.mjs --remote|--local [--base-url https://senior-capstone-app.pages.dev]");
      process.exit(0);
    } else {
      throw new OwnerAdminEnsureError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  if (!parsed.target) {
    throw new OwnerAdminEnsureError("INVALID_ARGUMENTS", "Choose exactly one target: --local or --remote.");
  }
  return parsed;
}

function assertRepoIdentity(cwd = process.cwd()) {
  const actual = path.resolve(cwd);
  if (actual.toLowerCase() !== EXPECTED_CWD.toLowerCase()) {
    throw new OwnerAdminEnsureError("IDENTITY_GUARD_FAILED", "This script only runs from C:\\SeniorProjectApp1.0.");
  }
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new OwnerAdminEnsureError("IDENTITY_GUARD_FAILED", "Unexpected package name.");
  }
}

function ownerConfigFromEnv(env = process.env) {
  const email = normalizeEmail(env.OWNER_ADMIN_EMAIL || OWNER_EMAIL);
  const displayName = String(env.OWNER_ADMIN_DISPLAY_NAME || OWNER_DISPLAY_NAME).trim();
  if (email !== OWNER_EMAIL || displayName !== OWNER_DISPLAY_NAME) {
    throw new OwnerAdminEnsureError(
      "OWNER_ADMIN_SCOPE_REFUSED",
      "This owner-admin ensure path is restricted to Bryan Timm only.",
      { emailAllowed: email === OWNER_EMAIL, displayNameAllowed: displayName === OWNER_DISPLAY_NAME },
    );
  }
  return { email, displayName };
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
    throw new OwnerAdminEnsureError("IDENTITY_GUARD_FAILED", "Expected D1 binding was not found in wrangler.jsonc.");
  }
  return binding.database_id;
}

function sqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function assertIgnored(relativePath) {
  const result = spawnSync("git", ["check-ignore", "-q", relativePath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new OwnerAdminEnsureError("SECRET_PATH_NOT_IGNORED", `${relativePath} is not ignored by git.`);
  }
}

function credentialFilePath(now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  return path.join(REPO_ROOT, ".secrets", `bryan-admin-setup-${stamp}.json`);
}

function assertInsideRepo(candidate) {
  const relative = path.relative(REPO_ROOT, path.resolve(candidate));
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new OwnerAdminEnsureError("SECRET_PATH_UNSAFE", "Generated credential path must stay inside the repo.");
  }
}

function writeCredentialFile({ file, email, displayName, baseUrl, setupPassword }) {
  assertInsideRepo(file);
  assertIgnored(".secrets/");
  assertIgnored(path.relative(REPO_ROOT, file));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({
    email,
    displayName,
    generatedAt: new Date().toISOString(),
    baseUrl,
    setupPassword,
    instructions: "Local ignored owner-admin setup file. Do not commit, print, paste, screenshot, or move this credential into tracked docs. Complete reset on first use, then delete or archive securely.",
  }, null, 2)}\n`, "utf8");
}

function generateSetupPassword(owner) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const password = `OwnerAdmin!${newRandomToken(24)}9zZ`;
    if (validatePassword(password, { email: owner.email, displayName: owner.displayName }).length === 0) {
      return password;
    }
  }
  throw new OwnerAdminEnsureError("PASSWORD_GENERATION_FAILED", "Unable to generate a valid owner-admin setup password.");
}

function normalizeResultRows(payload) {
  if (Array.isArray(payload)) return payload[0]?.results || [];
  if (Array.isArray(payload?.result)) return payload.result[0]?.results || [];
  return payload?.result?.results || [];
}

function extractJson(output) {
  const trimmed = String(output || "").trim();
  const startCandidates = [trimmed.indexOf("["), trimmed.indexOf("{")].filter((index) => index >= 0);
  if (!startCandidates.length) throw new Error("No JSON payload found.");
  const start = Math.min(...startCandidates);
  const end = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
  if (end <= start) throw new Error("No complete JSON payload found.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

class LocalD1 {
  async query(sql) {
    if (!existsSync(WRANGLER_JS)) {
      throw new OwnerAdminEnsureError("LOCAL_D1_BLOCKED_NO_WRANGLER", "Local Wrangler CLI is missing.");
    }
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, "--local", "--json", "--command", sql], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, CI: "1" },
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new OwnerAdminEnsureError("LOCAL_D1_QUERY_FAILED", "Local D1 query failed.", { status: result.status });
    }
    return normalizeResultRows(extractJson(`${result.stdout || ""}\n${result.stderr || ""}`));
  }

  async runSqlFile(statements) {
    if (!existsSync(WRANGLER_JS)) {
      throw new OwnerAdminEnsureError("LOCAL_D1_BLOCKED_NO_WRANGLER", "Local Wrangler CLI is missing.");
    }
    const tempFile = path.join(REPO_ROOT, ".secrets", `owner-admin-local-${Date.now()}.sql`);
    assertInsideRepo(tempFile);
    assertIgnored(".secrets/");
    mkdirSync(path.dirname(tempFile), { recursive: true });
    writeFileSync(tempFile, `${statements.join("\n\n")}\n`, "utf8");
    try {
      const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, "--local", "--file", tempFile], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: { ...process.env, CI: "1" },
        windowsHide: true,
      });
      if (result.status !== 0) {
        throw new OwnerAdminEnsureError("LOCAL_D1_WRITE_FAILED", "Local D1 owner-admin write failed.", { status: result.status });
      }
    } finally {
      rmSync(tempFile, { force: true });
    }
  }
}

class RemoteD1 {
  constructor({ accountId, databaseId, token }) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.token = token;
  }

  async query(sql, params = []) {
    if (!this.token) {
      throw new OwnerAdminEnsureError("REMOTE_D1_BLOCKED_NO_TOKEN", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
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
      throw new OwnerAdminEnsureError("REMOTE_D1_QUERY_FAILED", "Remote D1 query failed.", {
        status: response.status,
        errorCodes: Array.isArray(body?.errors) ? body.errors.map((error) => error.code) : [],
      });
    }
    return normalizeResultRows(body);
  }

  async batch(statements) {
    if (!this.token) {
      throw new OwnerAdminEnsureError("REMOTE_D1_BLOCKED_NO_TOKEN", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
    }
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(statements.map(({ sql, params = [] }) => ({ sql, params }))),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success !== true) {
      throw new OwnerAdminEnsureError("REMOTE_D1_WRITE_FAILED", "Remote D1 owner-admin write failed.", {
        status: response.status,
        errorCodes: Array.isArray(body?.errors) ? body.errors.map((error) => error.code) : [],
      });
    }
  }
}

async function readOwnerState(adapter, owner, target) {
  const rows = target === "remote"
    ? await adapter.query(
      `SELECT u.id, u.email_norm, u.display_name, u.status, c.requires_reset, ur.role_id, ur.scope_type, ur.scope_id
       FROM user_accounts u
       LEFT JOIN password_credentials c ON c.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email_norm = ?
       ORDER BY ur.role_id`,
      [owner.email],
    )
    : await adapter.query(
      `SELECT u.id, u.email_norm, u.display_name, u.status, c.requires_reset, ur.role_id, ur.scope_type, ur.scope_id
       FROM user_accounts u
       LEFT JOIN password_credentials c ON c.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email_norm = ${sqlString(owner.email)}
       ORDER BY ur.role_id;`,
    );
  return {
    exists: rows.length > 0,
    userId: rows[0]?.id || null,
    emailNorm: rows[0]?.email_norm || null,
    displayName: rows[0]?.display_name || null,
    status: rows[0]?.status || null,
    requiresReset: Number(rows[0]?.requires_reset || 0),
    roles: rows
      .filter((row) => row.role_id)
      .map((row) => ({ roleId: row.role_id, scopeType: row.scope_type, scopeId: row.scope_id })),
  };
}

async function adminRoleExists(adapter, target) {
  const rows = target === "remote"
    ? await adapter.query("SELECT id FROM roles WHERE id = ?", ["admin"])
    : await adapter.query("SELECT id FROM roles WHERE id = 'admin';");
  return rows.some((row) => row.id === "admin");
}

function hasGlobalAdmin(state) {
  return state.roles.some((role) => role.roleId === "admin" && role.scopeType === "global" && role.scopeId === "");
}

function publicState(state) {
  return {
    emailNorm: state.emailNorm,
    displayName: state.displayName,
    status: state.status,
    requiresReset: state.requiresReset,
    roles: state.roles,
  };
}

async function createOwnerAdmin({ adapter, target, owner, baseUrl }) {
  const passwordPepper = process.env.PASSWORD_PEPPER || "";
  if (!passwordPepper && target === "remote") {
    throw new OwnerAdminEnsureError(
      "REMOTE_D1_BLOCKED_PASSWORD_PEPPER_REQUIRED",
      "PASSWORD_PEPPER is required locally before creating a remote password credential.",
    );
  }
  const userId = randomId("user");
  const setupPassword = generateSetupPassword(owner);
  const credential = await hashPassword(setupPassword, passwordPepper);
  const file = credentialFilePath();
  writeCredentialFile({ file, email: owner.email, displayName: owner.displayName, baseUrl, setupPassword });

  const auditMetadata = JSON.stringify({
    policy: "bryan_owner_admin_exception_only",
    roleId: "admin",
    scopeType: "global",
    scopeId: "",
    credentialState: "pending_reset",
    setupCredentialStored: "ignored_local_file",
  });

  try {
    if (target === "remote") {
      await adapter.batch([
        {
          sql: `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
                VALUES (?, ?, ?, ?, 'pending_reset')`,
          params: [userId, owner.email, owner.email, owner.displayName],
        },
        {
          sql: `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
                VALUES (?, ?, ?, ?, ?, 1)`,
          params: [userId, credential.hash, credential.salt, credential.algorithm, credential.iterations],
        },
        {
          sql: `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
                VALUES (?, 'admin', 'global', '', NULL)`,
          params: [userId],
        },
        {
          sql: `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
                VALUES (?, NULL, 'owner_admin_account_created', 'user_account', ?, ?)`,
          params: [randomId("audit"), userId, auditMetadata],
        },
      ]);
    } else {
      await adapter.runSqlFile([
        `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
         VALUES (${sqlString(userId)}, ${sqlString(owner.email)}, ${sqlString(owner.email)}, ${sqlString(owner.displayName)}, 'pending_reset');`,
        `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
         VALUES (${sqlString(userId)}, ${sqlString(credential.hash)}, ${sqlString(credential.salt)}, ${sqlString(credential.algorithm)}, ${credential.iterations}, 1);`,
        `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
         VALUES (${sqlString(userId)}, 'admin', 'global', '', NULL);`,
        `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
         VALUES (${sqlString(randomId("audit"))}, NULL, 'owner_admin_account_created', 'user_account', ${sqlString(userId)}, ${sqlString(auditMetadata)});`,
      ]);
    }
  } catch (error) {
    rmSync(file, { force: true });
    throw error;
  }

  return path.relative(REPO_ROOT, file).replaceAll("\\", "/");
}

async function repairAdminRole({ adapter, target, userId }) {
  const auditMetadata = JSON.stringify({
    policy: "bryan_owner_admin_exception_only",
    roleId: "admin",
    scopeType: "global",
    scopeId: "",
  });
  if (target === "remote") {
    await adapter.batch([
      {
        sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
              VALUES (?, 'admin', 'global', '', NULL)`,
        params: [userId],
      },
      {
        sql: `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
              VALUES (?, NULL, 'owner_admin_role_repaired', 'user_account', ?, ?)`,
        params: [randomId("audit"), userId, auditMetadata],
      },
    ]);
  } else {
    await adapter.runSqlFile([
      `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
       VALUES (${sqlString(userId)}, 'admin', 'global', '', NULL);`,
      `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
       VALUES (${sqlString(randomId("audit"))}, NULL, 'owner_admin_role_repaired', 'user_account', ${sqlString(userId)}, ${sqlString(auditMetadata)});`,
    ]);
  }
}

async function ensureOwnerAdmin({ target, baseUrl }) {
  assertRepoIdentity();
  const owner = ownerConfigFromEnv();
  const config = readWranglerConfig();
  const adapter = target === "remote"
    ? new RemoteD1({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || ACCOUNT_ID,
      databaseId: databaseIdFromWrangler(config),
      token: process.env.CLOUDFLARE_API_TOKEN || "",
    })
    : new LocalD1();

  if (!await adminRoleExists(adapter, target)) {
    throw new OwnerAdminEnsureError("ADMIN_ROLE_MISSING", "The admin role is missing from D1.");
  }

  const before = await readOwnerState(adapter, owner, target);
  let result = "BRYAN_ADMIN_ALREADY_EXISTS";
  let created = false;
  let roleRepaired = false;
  let credentialPath = null;

  if (before.exists && before.status === "disabled") {
    throw new OwnerAdminEnsureError("BRYAN_ACCOUNT_DISABLED_NEEDS_DECISION", "Bryan's account is disabled and needs an explicit owner decision.");
  }

  if (!before.exists) {
    credentialPath = await createOwnerAdmin({ adapter, target, owner, baseUrl });
    created = true;
    result = "BRYAN_ADMIN_CREATED_PENDING_RESET";
  } else if (!hasGlobalAdmin(before)) {
    await repairAdminRole({ adapter, target, userId: before.userId });
    roleRepaired = true;
    result = "BRYAN_ADMIN_ROLE_REPAIRED";
  } else if (before.status === "pending_reset" || Number(before.requiresReset || 0) === 1) {
    result = "BRYAN_ADMIN_EXISTS_PENDING_RESET";
  }

  const after = await readOwnerState(adapter, owner, target);
  if (!after.exists || after.emailNorm !== owner.email || after.displayName !== owner.displayName || !hasGlobalAdmin(after)) {
    throw new OwnerAdminEnsureError("BRYAN_ADMIN_VERIFY_FAILED", "Owner-admin verification failed after ensure.");
  }

  return {
    ok: true,
    result,
    target,
    accountExisted: before.exists,
    accountCreated: created,
    accountRepaired: roleRepaired,
    roleRepaired,
    status: after.status,
    requiresReset: after.requiresReset,
    credentialGenerated: Boolean(credentialPath),
    credentialPath,
    credentialValuePrinted: false,
    credentialValueCommitted: false,
    verification: publicState(after),
  };
}

function redactDetails(details) {
  return JSON.parse(JSON.stringify(details || {}).replace(/"setupPassword"\s*:\s*"[^"]+"/g, '"setupPassword":"[redacted]"'));
}

export {
  OwnerAdminEnsureError,
  ensureOwnerAdmin,
  hasGlobalAdmin,
  ownerConfigFromEnv,
  parseArgs,
  stripJsonComments,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs();
    const result = await ensureOwnerAdmin(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof OwnerAdminEnsureError) {
      console.error(`Owner-admin ensure failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactDetails(error.details))}`);
      }
    } else {
      console.error(`Owner-admin ensure failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
