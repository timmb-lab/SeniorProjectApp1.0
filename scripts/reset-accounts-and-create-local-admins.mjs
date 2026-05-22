#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hashPassword, newRandomToken, normalizeEmail, randomId, validatePassword } from "../functions/_lib/crypto.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_ROOT = path.resolve("C:/SeniorProjectApp1.0");
const EXPECTED_BRANCH = "main";
const EXPECTED_REMOTE = "https://github.com/timmb-lab/SeniorProjectApp1.0.git";
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const DATABASE_NAME = "senior-capstone-db";
const DATABASE_BINDING = "DB";
const DEFAULT_ACCOUNT_ID = "539e8f7c55e7b1472013626ad72f4c7f";
const DEFAULT_BASE_URL = "https://senior-capstone-app.pages.dev";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const CONFIRM_TEXT = "RESET_ALL_ACCOUNTS";

const APPROVED_ADMINS = Object.freeze([
  Object.freeze({
    label: "master_local_admin",
    email: "bryan@learntechonline.com",
    displayName: "Bryan Timm",
    roleId: "admin",
    scopeType: "global",
    scopeId: "",
  }),
  Object.freeze({
    label: "break_glass_local_admin",
    email: "bryan.timm89@gmail.com",
    displayName: "Bryan Timm",
    roleId: "admin",
    scopeType: "global",
    scopeId: "",
  }),
]);

const REQUIRED_SCHEMA_TABLES = [
  "user_accounts",
  "password_credentials",
  "sessions",
  "login_attempts",
  "roles",
  "user_roles",
  "audit_events",
  "tenant_users",
  "auth_identities",
  "oauth_states",
];

const RESET_TABLE_REASONS = Object.freeze({
  user_accounts: "all accounts are being replaced by the two approved local admins",
  password_credentials: "password hashes and salts are user-bound and must not survive account reset",
  sessions: "sessions must be invalidated for a clean account reset",
  login_attempts: "login history is account/auth state",
  user_roles: "role grants are account-bound and recreated only for the approved admins",
  group_memberships: "membership rows are account-bound",
  mentor_assignments: "mentor/student rows are account-bound workflow data",
  progress_records: "student progress rows are account-bound workflow data",
  status_history: "student status rows are account-bound workflow data",
  submissions: "student submission rows are account-bound workflow data",
  submission_versions: "submission snapshots are account-bound workflow data",
  reviews: "review rows are account-bound workflow data",
  comments: "comments are user-generated workflow data",
  evidence_artifacts: "D1 evidence metadata is account-bound; Drive files are not deleted here",
  mentor_meetings: "mentor meeting rows are account-bound workflow data",
  presentation_slots: "presentation schedule rows are student/account-bound workflow data",
  exports: "exports are requested-by or target-user scoped",
  export_artifacts: "export artifacts are generated from user-scoped exports",
  announcements: "announcements are user-generated operational rows",
  audit_events: "old audit rows are cleared, then reset audit events are recreated without secrets",
  tenant_users: "tenant memberships are account-bound and should not bind the new local admins",
  auth_identities: "SSO/local auth identity links are user-bound and rebuilt only if required",
  oauth_states: "OAuth state rows are transient auth state",
});

const PRESERVE_TABLE_REASONS = Object.freeze({
  roles: "lookup roles are preserved",
  programs: "program lookup/config rows are preserved",
  cohorts: "cohort lookup/config rows are preserved",
  groups: "group lookup/config rows are preserved while memberships are cleared",
  requirements: "requirements are preserved",
  requirement_sections: "requirement structure is preserved",
  requirement_credit_owners: "requirement metadata is preserved",
  requirement_student_evidence: "requirement metadata is preserved",
  requirement_dashboard_signals: "requirement metadata is preserved",
  requirement_review_gates: "requirement metadata is preserved",
  quality_checks: "quality checks are preserved",
  deadlines: "deadlines are preserved",
  app_settings: "non-user-specific app settings are preserved",
  evidence_repositories: "Google Drive repository config is preserved",
  tenants: "tenant config is preserved",
  tenant_domains: "tenant domain config is preserved",
  identity_providers: "identity-provider config is preserved",
});

const SYSTEM_TABLE_PREFIXES = ["sqlite_", "_cf_"];
const LOCAL_PASSWORD_AUTH_IDENTITIES_REQUIRED = false;

class AccountResetError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "AccountResetError";
    this.classification = classification;
    this.details = details;
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    target: "",
    mode: "",
    confirm: "",
    baseUrl: DEFAULT_BASE_URL,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--local" || value === "--remote") {
      if (parsed.target) {
        throw new AccountResetError("INVALID_ARGUMENTS", "Choose exactly one target: --local or --remote.");
      }
      parsed.target = value.slice(2);
    } else if (value === "--dry-run" || value === "--write") {
      if (parsed.mode) {
        throw new AccountResetError("INVALID_ARGUMENTS", "Choose exactly one mode: --dry-run or --write.");
      }
      parsed.mode = value.slice(2).replace("-", "");
    } else if (value === "--confirm") {
      parsed.confirm = values[index + 1] || "";
      index += 1;
    } else if (value === "--base-url") {
      parsed.baseUrl = values[index + 1] || "";
      index += 1;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/reset-accounts-and-create-local-admins.mjs --local|--remote --dry-run|--write [--confirm RESET_ALL_ACCOUNTS] [--base-url URL]");
      process.exit(0);
    } else {
      throw new AccountResetError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  if (!parsed.target) {
    throw new AccountResetError("INVALID_ARGUMENTS", "Choose exactly one target: --local or --remote.");
  }
  if (!parsed.mode) {
    throw new AccountResetError("INVALID_ARGUMENTS", "Choose exactly one mode: --dry-run or --write.");
  }
  if (parsed.mode === "write" && parsed.confirm !== CONFIRM_TEXT) {
    throw new AccountResetError("CONFIRMATION_REQUIRED", `Destructive writes require --confirm ${CONFIRM_TEXT}.`);
  }
  if (!parsed.baseUrl) {
    throw new AccountResetError("INVALID_ARGUMENTS", "--base-url cannot be empty.");
  }
  return parsed;
}

function assertApprovedAccounts(accounts = APPROVED_ADMINS) {
  const approvedEmails = new Set(APPROVED_ADMINS.map((account) => normalizeEmail(account.email)));
  for (const account of accounts) {
    const emailNorm = normalizeEmail(account.email || "");
    if (!approvedEmails.has(emailNorm)) {
      throw new AccountResetError("ADMIN_ALLOWLIST_REFUSED", "Reset refuses to create an admin outside the approved allowlist.", {
        refusedEmail: emailNorm,
      });
    }
    if (account.displayName !== "Bryan Timm" || account.roleId !== "admin" || account.scopeType !== "global" || account.scopeId !== "") {
      throw new AccountResetError("ADMIN_ALLOWLIST_REFUSED", "Approved admin objects must keep Bryan Timm global-admin local-auth shape.");
    }
  }
}

function validateWriteSafety(args, env = process.env) {
  if (args.mode !== "write") {
    return {
      confirmationUsed: false,
      remoteEnvironmentGateUsed: false,
      tokenRequired: args.target === "remote",
      pepperRequired: false,
    };
  }
  if (args.confirm !== CONFIRM_TEXT) {
    throw new AccountResetError("CONFIRMATION_REQUIRED", `Destructive writes require --confirm ${CONFIRM_TEXT}.`);
  }
  if (args.target === "remote") {
    if (env.ALLOW_REMOTE_ACCOUNT_RESET !== "true") {
      throw new AccountResetError("REMOTE_ENV_GATE_REQUIRED", "Remote account reset requires ALLOW_REMOTE_ACCOUNT_RESET=true.");
    }
    if (!env.CLOUDFLARE_API_TOKEN) {
      throw new AccountResetError("REMOTE_TOKEN_REQUIRED", "Remote account reset requires CLOUDFLARE_API_TOKEN.");
    }
    if (!env.PASSWORD_PEPPER) {
      throw new AccountResetError("REMOTE_PASSWORD_PEPPER_REQUIRED", "Remote account reset requires PASSWORD_PEPPER.");
    }
    return {
      confirmationUsed: true,
      remoteEnvironmentGateUsed: true,
      tokenRequired: true,
      pepperRequired: true,
    };
  }
  return {
    confirmationUsed: true,
    remoteEnvironmentGateUsed: false,
    tokenRequired: false,
    pepperRequired: false,
  };
}

function validateRemoteReadSafety(args, env = process.env) {
  if (args.target !== "remote") {
    return;
  }
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new AccountResetError("REMOTE_TOKEN_REQUIRED", "Remote dry-run/read access requires CLOUDFLARE_API_TOKEN.");
  }
}

function runGit(args, repoRoot = REPO_ROOT) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new AccountResetError("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed.`, { status: result.status });
  }
  return String(result.stdout || "").trim();
}

function normalizePathForCompare(value) {
  return path.resolve(value).replaceAll("\\", "/").toLowerCase();
}

function assertRepoIdentity(repoRoot = REPO_ROOT) {
  const root = runGit(["rev-parse", "--show-toplevel"], repoRoot);
  const branch = runGit(["branch", "--show-current"], repoRoot);
  const remotes = runGit(["remote", "-v"], repoRoot);
  const head = runGit(["rev-parse", "HEAD"], repoRoot);
  const status = runGit(["status", "--short", "--branch"], repoRoot);
  const originFetch = remotes
    .split(/\r?\n/)
    .find((line) => line.startsWith("origin") && line.includes("(fetch)"));
  const remote = originFetch?.split(/\s+/)[1] || "";

  if (normalizePathForCompare(root) !== normalizePathForCompare(EXPECTED_ROOT)) {
    throw new AccountResetError("REPO_IDENTITY_FAILED", "Reset script is restricted to C:\\SeniorProjectApp1.0.", { root });
  }
  if (branch !== EXPECTED_BRANCH) {
    throw new AccountResetError("REPO_IDENTITY_FAILED", "Reset script must run from main.", { branch });
  }
  if (remote !== EXPECTED_REMOTE) {
    throw new AccountResetError("REPO_IDENTITY_FAILED", "Unexpected origin remote.", { remote });
  }
  for (const requiredPath of [
    "package.json",
    "wrangler.jsonc",
    "migrations/0001_foundation.sql",
    "migrations/0010_tenant_google_sso.sql",
  ]) {
    if (!existsSync(path.join(repoRoot, requiredPath))) {
      throw new AccountResetError("REPO_IDENTITY_FAILED", `Missing required repo file: ${requiredPath}.`);
    }
  }
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new AccountResetError("REPO_IDENTITY_FAILED", "Unexpected package name.", { packageName: pkg.name });
  }
  return { root, branch, remote, head, status };
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

function readWranglerDatabaseInfo(repoRoot = REPO_ROOT) {
  const raw = readFileSync(path.join(repoRoot, "wrangler.jsonc"), "utf8").replace(/^\uFEFF/, "");
  const config = JSON.parse(stripJsonComments(raw));
  const binding = (config.d1_databases || []).find((item) => (
    item.binding === DATABASE_BINDING && item.database_name === DATABASE_NAME
  ));
  if (!binding?.database_id) {
    throw new AccountResetError("D1_BINDING_NOT_FOUND", "Expected D1 binding was not found in wrangler.jsonc.");
  }
  return {
    binding: binding.binding,
    databaseName: binding.database_name,
    databaseId: binding.database_id,
    migrationsDir: binding.migrations_dir || "./migrations",
  };
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

function normalizeResultRows(payload) {
  if (Array.isArray(payload)) return payload[0]?.results || [];
  if (Array.isArray(payload?.result)) return payload.result[0]?.results || [];
  return payload?.result?.results || [];
}

class WranglerD1Adapter {
  constructor({ repoRoot = REPO_ROOT, target }) {
    this.repoRoot = repoRoot;
    this.target = target;
  }

  targetFlag() {
    return this.target === "remote" ? "--remote" : "--local";
  }

  assertWrangler() {
    if (!existsSync(WRANGLER_JS)) {
      throw new AccountResetError("WRANGLER_NOT_FOUND", "Local Wrangler CLI is missing. Run npm install before D1 reset.");
    }
  }

  async query(sql) {
    const [rows] = await this.queryBatch([sql]);
    return rows || [];
  }

  async queryBatch(statements) {
    this.assertWrangler();
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, this.targetFlag(), "--json", "--command", statements.join("\n")], {
      cwd: this.repoRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "1" },
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new AccountResetError("D1_QUERY_FAILED", `${this.target} D1 query failed.`, { status: result.status });
    }
    return normalizeBatchResultRows(extractJson(`${result.stdout || ""}\n${result.stderr || ""}`));
  }

  async executeScript(sqlText, { repoRoot = this.repoRoot, assertIgnored = assertGitIgnored, label = "account-reset" } = {}) {
    this.assertWrangler();
    const tempFile = path.join(repoRoot, ".secrets", `${label}-${this.target}-${Date.now()}.sql`);
    assertSecretPath(repoRoot, tempFile);
    assertIgnored(repoRoot, ".secrets/");
    assertIgnored(repoRoot, path.relative(repoRoot, tempFile));
    mkdirSync(path.dirname(tempFile), { recursive: true });
    writeFileSync(tempFile, sqlText, "utf8");
    try {
      const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, this.targetFlag(), "--file", tempFile], {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, CI: "1" },
        windowsHide: true,
      });
      if (result.status !== 0) {
        throw new AccountResetError("D1_WRITE_FAILED", `${this.target} D1 write failed.`, { status: result.status });
      }
    } finally {
      rmSync(tempFile, { force: true });
    }
  }
}

class RemoteD1ApiAdapter {
  constructor({ accountId, databaseId, token }) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.token = token;
  }

  async query(sql) {
    const [rows] = await this.queryBatch([sql]);
    return rows || [];
  }

  async queryBatch(statements) {
    if (!this.token) {
      throw new AccountResetError("REMOTE_TOKEN_REQUIRED", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
    }
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ batch: statements.map((sql) => ({ sql })) }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success !== true) {
      throw new AccountResetError("REMOTE_D1_QUERY_FAILED", "Remote D1 query failed.", {
        status: response.status,
        errorCodes: Array.isArray(body?.errors) ? body.errors.map((error) => error.code) : [],
      });
    }
    return normalizeBatchResultRows(body);
  }

  async executeScript(sqlText) {
    await this.queryBatch(splitSqlStatements(sqlText));
  }
}

async function queryBatch(adapter, statements) {
  if (!statements.length) return [];
  if (typeof adapter.queryBatch === "function") {
    return adapter.queryBatch(statements);
  }
  const output = [];
  for (const statement of statements) {
    output.push(await adapter.query(statement));
  }
  return output;
}

function normalizeBatchResultRows(payload) {
  const results = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.result)
      ? payload.result
      : [payload?.result || payload];
  return results.map((item) => {
    if (item?.success === false) {
      throw new AccountResetError("D1_QUERY_FAILED", "One D1 batch query failed.");
    }
    return item?.results || [];
  });
}

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = "";
  let inString = false;
  for (let index = 0; index < sqlText.length; index += 1) {
    const char = sqlText[index];
    const next = sqlText[index + 1];
    current += char;
    if (char === "'" && inString && next === "'") {
      current += next;
      index += 1;
      continue;
    }
    if (char === "'") {
      inString = !inString;
      continue;
    }
    if (char === ";" && !inString) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
    }
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function verifyCloudflareTokenAndD1({ env = process.env, databaseInfo, accountId = env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID }) {
  const token = env.CLOUDFLARE_API_TOKEN || "";
  if (!token) {
    throw new AccountResetError("REMOTE_TOKEN_REQUIRED", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
  }
  const verifyResponse = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    headers: { authorization: `Bearer ${token}` },
  });
  const verifyBody = await verifyResponse.json().catch(() => null);
  if (!verifyResponse.ok || verifyBody?.success !== true || verifyBody?.result?.status !== "active") {
    throw new AccountResetError("REMOTE_TOKEN_VERIFY_FAILED", "Cloudflare token verification failed.", {
      status: verifyResponse.status,
      active: verifyBody?.result?.status === "active",
      errorCodes: Array.isArray(verifyBody?.errors) ? verifyBody.errors.map((error) => error.code) : [],
    });
  }

  const d1Response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseInfo.databaseId}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  const d1Body = await d1Response.json().catch(() => null);
  if (!d1Response.ok || d1Body?.success !== true) {
    throw new AccountResetError("REMOTE_D1_VERIFY_FAILED", "Cloudflare D1 database verification failed.", {
      status: d1Response.status,
      errorCodes: Array.isArray(d1Body?.errors) ? d1Body.errors.map((error) => error.code) : [],
    });
  }
  return {
    tokenVerifiedActive: true,
    d1DatabaseIdConfirmed: d1Body?.result?.uuid === databaseInfo.databaseId || d1Body?.result?.id === databaseInfo.databaseId,
    d1DatabaseName: d1Body?.result?.name || null,
    accountId,
  };
}

function quoteIdent(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new AccountResetError("UNSAFE_SQL_IDENTIFIER", "Unsafe SQL identifier refused.");
  }
  return `"${identifier}"`;
}

function sqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function firstNumber(rows) {
  const first = rows[0] || {};
  const value = first.count ?? first.COUNT ?? first["COUNT(*)"] ?? Object.values(first)[0] ?? 0;
  return Number(value || 0);
}

async function tableExists(adapter, tableName) {
  const rows = await adapter.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${sqlString(tableName)};`);
  return rows.some((row) => row.name === tableName);
}

function isSystemTable(tableName) {
  return SYSTEM_TABLE_PREFIXES.some((prefix) => tableName.startsWith(prefix));
}

async function introspectSchema(adapter) {
  const tableRows = await adapter.query("SELECT name, sql FROM sqlite_master WHERE type = 'table' ORDER BY name;");
  const tables = tableRows
    .map((row) => ({ name: String(row.name || ""), sql: row.sql || "" }))
    .filter((row) => row.name && !isSystemTable(row.name));
  const tableNames = new Set(tables.map((table) => table.name));
  const foreignKeys = {};
  const columns = {};
  const fkResults = await queryBatch(adapter, tables.map((table) => `PRAGMA foreign_key_list(${quoteIdent(table.name)});`));
  const columnResults = await queryBatch(adapter, tables.map((table) => `PRAGMA table_info(${quoteIdent(table.name)});`));
  for (let index = 0; index < tables.length; index += 1) {
    foreignKeys[tables[index].name] = fkResults[index] || [];
    columns[tables[index].name] = columnResults[index] || [];
  }
  return { tables, tableNames, foreignKeys, columns };
}

function validateRequiredSchema(schema) {
  const missing = REQUIRED_SCHEMA_TABLES.filter((table) => !schema.tableNames.has(table));
  if (missing.length > 0) {
    throw new AccountResetError(
      "TARGET_SCHEMA_INCOMPLETE",
      "Target schema is missing account/SSO tables. Apply repo migrations through Wrangler before destructive reset; this script will not apply migration 0010.",
      { missingTables: missing },
    );
  }
}

function classifySchema(schema) {
  const reset = [];
  const preserve = [];
  const ambiguous = [];

  for (const table of schema.tables) {
    if (RESET_TABLE_REASONS[table.name]) {
      reset.push({ table: table.name, reason: RESET_TABLE_REASONS[table.name], classification: "reset" });
      continue;
    }
    if (PRESERVE_TABLE_REASONS[table.name]) {
      preserve.push({ table: table.name, reason: PRESERVE_TABLE_REASONS[table.name], classification: "preserve" });
      continue;
    }
    const referencesUser = (schema.foreignKeys[table.name] || []).some((fk) => fk.table === "user_accounts");
    if (referencesUser) {
      reset.push({ table: table.name, reason: "table has a user_accounts foreign key and is treated as user-linked", classification: "reset" });
      continue;
    }
    preserve.push({ table: table.name, reason: "ambiguous table without user foreign key; preserved by default", classification: "preserve" });
    ambiguous.push({ table: table.name, decision: "preserved", reason: "no explicit reset rule and no user_accounts foreign key" });
  }

  return {
    reset: reset.sort((left, right) => left.table.localeCompare(right.table)),
    preserve: preserve.sort((left, right) => left.table.localeCompare(right.table)),
    ambiguous,
  };
}

function deletionOrderForResetTables(resetTables, foreignKeys) {
  const resetSet = new Set(resetTables);
  const childMap = new Map([...resetSet].map((table) => [table, new Set()]));
  for (const table of resetSet) {
    for (const fk of foreignKeys[table] || []) {
      const parent = fk.table;
      if (resetSet.has(parent)) {
        childMap.get(parent).add(table);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const output = [];
  function visit(table) {
    if (visited.has(table)) return;
    if (visiting.has(table)) {
      throw new AccountResetError("RESET_TABLE_CYCLE", "Reset table foreign-key cycle detected.", { table });
    }
    visiting.add(table);
    for (const child of [...(childMap.get(table) || [])].sort()) {
      visit(child);
    }
    visiting.delete(table);
    visited.add(table);
    output.push(table);
  }

  for (const table of [...resetSet].sort()) {
    visit(table);
  }
  return output;
}

async function countTableRows(adapter, tableNames) {
  const counts = {};
  const results = await queryBatch(adapter, tableNames.map((table) => `SELECT COUNT(*) AS count FROM ${quoteIdent(table)};`));
  for (let index = 0; index < tableNames.length; index += 1) {
    counts[tableNames[index]] = firstNumber(results[index] || []);
  }
  return counts;
}

async function collectAccountCounts(adapter, schema) {
  const specs = [
    ["users", "user_accounts", "SELECT COUNT(*) AS count FROM user_accounts;"],
    ["disabledUsers", "user_accounts", "SELECT COUNT(*) AS count FROM user_accounts WHERE status = 'disabled';"],
    ["fakeTestUsers", "user_accounts", "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%.test';"],
    ["oldBryanCapstoneAppUsers", "user_accounts", "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm = 'bryan@thecapstoneapp.com';"],
    ["admins", "user_roles", "SELECT COUNT(DISTINCT user_id) AS count FROM user_roles WHERE role_id = 'admin';"],
    ["sessions", "sessions", "SELECT COUNT(*) AS count FROM sessions;"],
    ["oauthStates", "oauth_states", "SELECT COUNT(*) AS count FROM oauth_states;"],
    ["googleAuthIdentities", "auth_identities", "SELECT COUNT(*) AS count FROM auth_identities WHERE provider = 'google_workspace';"],
    ["localPasswordAuthIdentities", "auth_identities", "SELECT COUNT(*) AS count FROM auth_identities WHERE provider = 'local_password';"],
    ["tenantUsers", "tenant_users", "SELECT COUNT(*) AS count FROM tenant_users;"],
  ];
  const present = specs.filter(([, tableName]) => schema.tableNames.has(tableName));
  const results = await queryBatch(adapter, present.map(([, , sql]) => sql));
  const counts = Object.fromEntries(specs.map(([key]) => [key, 0]));
  for (let index = 0; index < present.length; index += 1) {
    counts[present[index][0]] = firstNumber(results[index] || []);
  }
  return counts;
}

async function assertAdminRoleExists(adapter) {
  const rows = await adapter.query("SELECT id FROM roles WHERE id = 'admin';");
  if (!rows.some((row) => row.id === "admin")) {
    throw new AccountResetError("ADMIN_ROLE_MISSING", "The admin role is missing; reset refuses to create admin users without the role lookup row.");
  }
}

async function buildResetPlan(adapter) {
  const schema = await introspectSchema(adapter);
  validateRequiredSchema(schema);
  await assertAdminRoleExists(adapter);
  const classification = classifySchema(schema);
  const resetTableNames = classification.reset.map((item) => item.table);
  const deleteOrder = deletionOrderForResetTables(resetTableNames, schema.foreignKeys);
  const resetCounts = await countTableRows(adapter, resetTableNames);
  const preserveCounts = await countTableRows(adapter, classification.preserve.map((item) => item.table));
  const beforeCounts = await collectAccountCounts(adapter, schema);

  return {
    schema,
    classification,
    deleteOrder,
    resetTables: classification.reset.map((item) => ({ ...item, rowCount: resetCounts[item.table] || 0 })),
    preserveTables: classification.preserve.map((item) => ({ ...item, rowCount: preserveCounts[item.table] || 0 })),
    beforeCounts,
    localPasswordAuthIdentitiesRequired: LOCAL_PASSWORD_AUTH_IDENTITIES_REQUIRED,
  };
}

function timestampForFile(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function assertSecretPath(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AccountResetError("SECRET_PATH_UNSAFE", "Secret/backup output must stay inside the repo .secrets folder.");
  }
}

function assertGitIgnored(repoRoot, relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const result = spawnSync("git", ["check-ignore", "-q", normalized], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new AccountResetError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function writeSecretJson({ repoRoot, file, data, assertIgnored = assertGitIgnored }) {
  assertSecretPath(repoRoot, file);
  assertIgnored(repoRoot, ".secrets/");
  assertIgnored(repoRoot, path.relative(repoRoot, file));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

async function writeBackupSnapshot({ adapter, repoRoot, target, plan, now = new Date(), assertIgnored = assertGitIgnored }) {
  const stamp = timestampForFile(now);
  const file = path.join(repoRoot, ".secrets", `account-reset-backup-${target.toUpperCase()}-${stamp}.json`);
  const tables = {};
  const resetTableNames = plan.resetTables.map((item) => item.table);
  const rowsByTable = await queryBatch(adapter, resetTableNames.map((table) => `SELECT * FROM ${quoteIdent(table)};`));
  for (let index = 0; index < resetTableNames.length; index += 1) {
    const table = resetTableNames[index];
    tables[table] = {
      rowCount: plan.resetTables.find((item) => item.table === table)?.rowCount || 0,
      rows: rowsByTable[index] || [],
    };
  }
  return writeSecretJson({
    repoRoot,
    file,
    assertIgnored,
    data: {
      kind: "account_reset_backup",
      target,
      generatedAt: now.toISOString(),
      warning: "Ignored local recovery snapshot. Do not commit, print, paste, or move this file outside .secrets/.",
      resetTables: plan.resetTables,
      preserveTables: plan.preserveTables,
      beforeCounts: plan.beforeCounts,
      tables,
    },
  });
}

function generateSetupPassword(account) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const password = `Capstone!${newRandomToken(24)}9zZ`;
    if (validatePassword(password, { email: account.email, displayName: account.displayName }).length === 0) {
      return password;
    }
  }
  throw new AccountResetError("PASSWORD_GENERATION_FAILED", "Unable to generate a valid one-time setup password.");
}

async function buildApprovedAdminCredentials({ env = process.env }) {
  assertApprovedAccounts(APPROVED_ADMINS);
  const passwordPepper = env.PASSWORD_PEPPER || "";
  const credentials = [];
  for (const account of APPROVED_ADMINS) {
    const setupPassword = generateSetupPassword(account);
    const hashed = await hashPassword(setupPassword, passwordPepper);
    credentials.push({
      ...account,
      id: randomId("user"),
      emailNorm: normalizeEmail(account.email),
      setupPassword,
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
      algorithm: hashed.algorithm,
      iterations: hashed.iterations,
    });
  }
  return credentials;
}

function writeCredentialFile({ repoRoot, credentials, baseUrl, target, now = new Date(), assertIgnored = assertGitIgnored }) {
  const stamp = timestampForFile(now);
  const file = path.join(repoRoot, ".secrets", `local-admin-reset-${stamp}.json`);
  const accounts = credentials.map((credential) => ({
    label: credential.label,
    email: credential.email,
    displayName: credential.displayName,
    role: credential.roleId,
    scopeType: credential.scopeType,
    scopeId: credential.scopeId,
    status: "pending_reset",
    requiresReset: 1,
    setupPassword: credential.setupPassword,
  }));
  return writeSecretJson({
    repoRoot,
    file,
    assertIgnored,
    data: {
      kind: "local_admin_reset_setup_credentials",
      target,
      generatedAt: now.toISOString(),
      baseUrl,
      warning: "Ignored one-time setup credentials. Do not commit, print, paste, screenshot, or move this file outside .secrets/.",
      accounts,
    },
  });
}

function buildResetSql({ plan, credentials, target, backupPath, credentialPath, now = new Date() }) {
  const resetTableNames = new Set(plan.resetTables.map((item) => item.table));
  const lines = [
    "PRAGMA foreign_keys = ON;",
    "BEGIN TRANSACTION;",
  ];
  for (const table of plan.deleteOrder) {
    lines.push(`DELETE FROM ${quoteIdent(table)};`);
  }

  for (const credential of credentials) {
    if (!new Set(APPROVED_ADMINS.map((account) => normalizeEmail(account.email))).has(credential.emailNorm)) {
      throw new AccountResetError("ADMIN_ALLOWLIST_REFUSED", "Generated admin credential fell outside the approved allowlist.");
    }
    lines.push(
      `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
       VALUES (${sqlString(credential.id)}, ${sqlString(credential.email)}, ${sqlString(credential.emailNorm)}, ${sqlString(credential.displayName)}, 'pending_reset');`,
    );
    lines.push(
      `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
       VALUES (${sqlString(credential.id)}, ${sqlString(credential.passwordHash)}, ${sqlString(credential.passwordSalt)}, ${sqlString(credential.algorithm)}, ${Number(credential.iterations)}, 1);`,
    );
    lines.push(
      `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
       VALUES (${sqlString(credential.id)}, 'admin', 'global', '', NULL);`,
    );
    if (LOCAL_PASSWORD_AUTH_IDENTITIES_REQUIRED && resetTableNames.has("auth_identities")) {
      lines.push(
        `INSERT INTO auth_identities (id, user_id, tenant_id, provider, provider_subject, email_norm)
         VALUES (${sqlString(randomId("authid"))}, ${sqlString(credential.id)}, NULL, 'local_password', ${sqlString(credential.emailNorm)}, ${sqlString(credential.emailNorm)});`,
      );
    }
  }

  const safeResetTables = plan.resetTables.map((item) => item.table);
  const resetMetadata = {
    target,
    approvedEmails: APPROVED_ADMINS.map((account) => account.email),
    resetTables: safeResetTables,
    preservedTables: plan.preserveTables.map((item) => item.table),
    backupPath,
    credentialPath,
    credentialsStoredOnlyInIgnoredSecrets: true,
    credentialValuesInAudit: false,
  };
  lines.push(
    `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
     VALUES (${sqlString(randomId("audit"))}, NULL, 'account_reset_completed', 'account_reset', ${sqlString(now.toISOString())}, ${sqlString(JSON.stringify(resetMetadata))});`,
  );
  for (const credential of credentials) {
    const metadata = {
      label: credential.label,
      email: credential.email,
      role: "admin",
      scopeType: "global",
      scopeId: "",
      authType: "local_password",
      requiresReset: true,
      ssoDependency: "none",
      credentialValuesInAudit: false,
    };
    lines.push(
      `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json)
       VALUES (${sqlString(randomId("audit"))}, NULL, 'local_admin_account_recreated', 'user_account', ${sqlString(credential.id)}, ${sqlString(JSON.stringify(metadata))});`,
    );
  }
  lines.push("COMMIT;");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function verifyFinalState(adapter) {
  const userRows = await adapter.query(
    `SELECT
       u.id,
       u.email,
       u.email_norm,
       u.display_name,
       u.status,
       c.user_id IS NOT NULL AS has_password_credential,
       c.requires_reset,
       ur.role_id,
       ur.scope_type,
       ur.scope_id
     FROM user_accounts u
     LEFT JOIN password_credentials c ON c.user_id = u.id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     ORDER BY u.email_norm, ur.role_id;`,
  );
  const byEmail = new Map();
  for (const row of userRows) {
    const email = row.email_norm;
    const existing = byEmail.get(email) || {
      id: row.id,
      email: row.email,
      emailNorm: row.email_norm,
      displayName: row.display_name,
      status: row.status,
      requiresReset: Number(row.requires_reset || 0),
      localPasswordCredentialExists: Number(row.has_password_credential || 0) === 1,
      roles: [],
      ssoDependency: "none",
    };
    if (row.role_id) {
      existing.roles.push({
        role: row.role_id,
        scopeType: row.scope_type,
        scopeId: row.scope_id,
      });
    }
    byEmail.set(email, existing);
  }
  const finalAccounts = [...byEmail.values()];
  const approvedEmails = APPROVED_ADMINS.map((account) => normalizeEmail(account.email)).sort();
  const actualEmails = finalAccounts.map((account) => account.emailNorm).sort();
  const accountsValid = JSON.stringify(actualEmails) === JSON.stringify(approvedEmails)
    && finalAccounts.length === 2
    && finalAccounts.every((account) => (
      account.displayName === "Bryan Timm"
      && account.status === "pending_reset"
      && account.requiresReset === 1
      && account.localPasswordCredentialExists
      && account.roles.some((role) => role.role === "admin" && role.scopeType === "global" && role.scopeId === "")
    ));

  const counts = {
    users: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM user_accounts;")),
    sessions: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM sessions;")),
    oauthStates: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM oauth_states;")),
    fakeTestUsers: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%.test';")),
    oldBryanCapstoneAppUsers: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm = 'bryan@thecapstoneapp.com';")),
    tenantUsers: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM tenant_users;")),
    googleAuthIdentities: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM auth_identities WHERE provider = 'google_workspace';")),
    localPasswordAuthIdentities: firstNumber(await adapter.query("SELECT COUNT(*) AS count FROM auth_identities WHERE provider = 'local_password';")),
  };
  const fkViolations = await adapter.query("PRAGMA foreign_key_check;");
  const auditRows = await adapter.query("SELECT action, metadata_json FROM audit_events ORDER BY created_at, id;");
  const auditSecretLeak = auditRows.some((row) => /setupPassword|password_hash|password_salt|CLOUDFLARE_API_TOKEN|PASSWORD_PEPPER/i.test(String(row.metadata_json || "")));
  const valid = accountsValid
    && counts.users === 2
    && counts.sessions === 0
    && counts.oauthStates === 0
    && counts.fakeTestUsers === 0
    && counts.oldBryanCapstoneAppUsers === 0
    && counts.tenantUsers === 0
    && counts.googleAuthIdentities === 0
    && counts.localPasswordAuthIdentities === (LOCAL_PASSWORD_AUTH_IDENTITIES_REQUIRED ? 2 : 0)
    && fkViolations.length === 0
    && !auditSecretLeak;
  if (!valid) {
    throw new AccountResetError("FINAL_VERIFY_FAILED", "Final account reset verification failed.", {
      counts,
      actualEmails,
      fkViolationCount: fkViolations.length,
      auditSecretLeak,
    });
  }
  return {
    valid: true,
    counts,
    finalAccounts,
    authIdentities: LOCAL_PASSWORD_AUTH_IDENTITIES_REQUIRED ? "local_password rows recreated" : "cleared; local_password rows are not required by current login design",
    foreignKeyViolations: fkViolations.length,
    auditEventsContainSecrets: false,
  };
}

async function assertPreservedConfig(adapter, beforePlan, afterPlan) {
  const names = [
    "roles",
    "programs",
    "requirements",
    "deadlines",
    "quality_checks",
    "app_settings",
    "evidence_repositories",
    "tenants",
    "tenant_domains",
    "identity_providers",
  ].filter((table) => beforePlan.schema.tableNames.has(table) && afterPlan.schema.tableNames.has(table));
  const before = Object.fromEntries(beforePlan.preserveTables.filter((item) => names.includes(item.table)).map((item) => [item.table, item.rowCount]));
  const afterCounts = await countTableRows(adapter, names);
  const changed = names.filter((table) => before[table] !== afterCounts[table]);
  if (changed.length > 0) {
    throw new AccountResetError("PRESERVED_CONFIG_CHANGED", "Lookup/config table counts changed during reset.", { changed });
  }
  return { checkedTables: names, preserved: true };
}

async function runAccountReset(args, options = {}) {
  assertApprovedAccounts(APPROVED_ADMINS);
  const repoRoot = options.repoRoot || REPO_ROOT;
  const now = options.now || new Date();
  const env = options.env || process.env;
  const assertIgnored = options.assertIgnored || assertGitIgnored;
  const safety = validateWriteSafety(args, env);
  validateRemoteReadSafety(args, env);
  const repo = options.verifyRepo === false
    ? (options.repoInfo || null)
    : assertRepoIdentity(repoRoot);
  const databaseInfo = options.databaseInfo || readWranglerDatabaseInfo(repoRoot);
  const remoteSafety = args.target === "remote"
    ? await verifyCloudflareTokenAndD1({ env, databaseInfo, accountId: env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID })
    : {
      tokenVerifiedActive: false,
      d1DatabaseIdConfirmed: true,
      accountId: null,
      d1DatabaseName: null,
    };
  const adapter = options.adapter || (args.target === "remote"
    ? new RemoteD1ApiAdapter({
      accountId: env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID,
      databaseId: databaseInfo.databaseId,
      token: env.CLOUDFLARE_API_TOKEN || "",
    })
    : new WranglerD1Adapter({ repoRoot, target: args.target }));
  const plan = await buildResetPlan(adapter);

  const baseResult = {
    ok: true,
    target: args.target,
    mode: args.mode,
    repo,
    database: databaseInfo,
    safety,
    remoteSafety: {
      tokenVerifiedActive: Boolean(remoteSafety.tokenVerifiedActive),
      d1DatabaseIdConfirmed: Boolean(remoteSafety.d1DatabaseIdConfirmed),
      accountId: remoteSafety.accountId,
      d1DatabaseName: remoteSafety.d1DatabaseName,
    },
    beforeCounts: plan.beforeCounts,
    plan: {
      resetTables: plan.resetTables,
      preserveTables: plan.preserveTables,
      ambiguousTables: plan.classification.ambiguous,
      deleteOrder: plan.deleteOrder,
      localPasswordAuthIdentitiesRequired: plan.localPasswordAuthIdentitiesRequired,
      approvedAdminsToCreate: APPROVED_ADMINS.map((account) => ({
        label: account.label,
        email: account.email,
        displayName: account.displayName,
        role: account.roleId,
        scope: `${account.scopeType}:${account.scopeId}`,
        authType: "local_password",
        requiresReset: 1,
        ssoDependency: "none",
      })),
    },
    backupPath: null,
    credentialPath: null,
    credentialsPrinted: false,
    credentialValuesCommitted: false,
    backupCommitted: false,
    finalVerification: null,
  };

  if (args.mode === "dryrun") {
    return baseResult;
  }

  const backupPath = await writeBackupSnapshot({ adapter, repoRoot, target: args.target, plan, now, assertIgnored });
  const credentials = await buildApprovedAdminCredentials({ env });
  const credentialPath = writeCredentialFile({
    repoRoot,
    credentials,
    baseUrl: args.baseUrl,
    target: args.target,
    now,
    assertIgnored,
  });
  try {
    const sql = buildResetSql({ plan, credentials, target: args.target, backupPath, credentialPath, now });
    await adapter.executeScript(sql, { repoRoot, assertIgnored, label: "account-reset" });
  } catch (error) {
    rmSync(path.join(repoRoot, credentialPath), { force: true });
    throw error;
  }

  const afterPlan = await buildResetPlan(adapter);
  const preservedConfig = await assertPreservedConfig(adapter, plan, afterPlan);
  const finalVerification = await verifyFinalState(adapter);
  return {
    ...baseResult,
    backupPath,
    credentialPath,
    finalVerification: {
      ...finalVerification,
      preservedConfig,
    },
  };
}

function redactErrorDetails(details) {
  const raw = JSON.stringify(details || {});
  return JSON.parse(raw.replace(/"setupPassword"\s*:\s*"[^"]+"/gi, '"setupPassword":"[redacted]"'));
}

export {
  APPROVED_ADMINS,
  AccountResetError,
  RESET_TABLE_REASONS,
  PRESERVE_TABLE_REASONS,
  assertApprovedAccounts,
  buildResetPlan,
  classifySchema,
  deletionOrderForResetTables,
  parseArgs,
  runAccountReset,
  stripJsonComments,
  validateWriteSafety,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs();
    const result = await runAccountReset(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof AccountResetError) {
      console.error(`Account reset failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactErrorDetails(error.details))}`);
      }
    } else {
      console.error(`Account reset failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
