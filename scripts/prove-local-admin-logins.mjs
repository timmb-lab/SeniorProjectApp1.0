#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { onRequest as onCompleteReset } from "../functions/api/auth/complete-reset.ts";
import { onRequestGet as onAuthConfig } from "../functions/api/auth/config.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";
import { onRequestGet as onAdminDashboard } from "../functions/api/admin/dashboard.ts";
import { newRandomToken, normalizeEmail, validatePassword } from "../functions/_lib/crypto.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_ROOT = path.resolve("C:/SeniorProjectApp1.0");
const EXPECTED_BRANCH = "main";
const EXPECTED_REMOTE = "https://github.com/timmb-lab/SeniorProjectApp1.0.git";
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const EXACT_SETUP_CREDENTIAL_PATH = ".secrets/local-admin-reset-20260522-002030.json";

const APPROVED_ADMINS = Object.freeze([
  Object.freeze({
    email: "bryan@learntechonline.com",
    displayName: "Bryan Timm",
    label: "master_local_admin",
  }),
  Object.freeze({
    email: "bryan.timm89@gmail.com",
    displayName: "Bryan Timm",
    label: "break_glass_local_admin",
  }),
]);

class LocalAdminProofError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "LocalAdminProofError";
    this.classification = classification;
    this.details = details;
  }
}

function runGit(args, repoRoot = REPO_ROOT) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new LocalAdminProofError("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed.`, { status: result.status });
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
  const originFetch = remotes.split(/\r?\n/).find((line) => line.startsWith("origin") && line.includes("(fetch)"));
  const remote = originFetch?.split(/\s+/)[1] || "";

  if (normalizePathForCompare(root) !== normalizePathForCompare(EXPECTED_ROOT)) {
    throw new LocalAdminProofError("REPO_IDENTITY_FAILED", "Proof script is restricted to C:\\SeniorProjectApp1.0.", { root });
  }
  if (branch !== EXPECTED_BRANCH) {
    throw new LocalAdminProofError("REPO_IDENTITY_FAILED", "Proof script must run from main.", { branch });
  }
  if (remote !== EXPECTED_REMOTE) {
    throw new LocalAdminProofError("REPO_IDENTITY_FAILED", "Unexpected origin remote.", { remote });
  }
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new LocalAdminProofError("REPO_IDENTITY_FAILED", "Unexpected package name.", { packageName: pkg.name });
  }
  return { root, branch, remote, head, status };
}

function assertInsideSecrets(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new LocalAdminProofError("SECRET_PATH_UNSAFE", "Credential paths must stay inside the repo .secrets folder.");
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
    throw new LocalAdminProofError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function timestampForFile(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function findNewestMatchingFile(repoRoot, patternPrefix) {
  const secretsRoot = path.join(repoRoot, ".secrets");
  if (!existsSync(secretsRoot)) return null;
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `Get-ChildItem -LiteralPath .secrets -Filter '${patternPrefix}*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName`,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  const found = String(result.stdout || "").trim();
  return found ? path.resolve(found) : null;
}

function findSetupCredentialFile(repoRoot = REPO_ROOT) {
  const newest = findNewestMatchingFile(repoRoot, "local-admin-reset-");
  if (newest) return newest;
  const exact = path.join(repoRoot, EXACT_SETUP_CREDENTIAL_PATH);
  if (existsSync(exact)) return exact;
  throw new LocalAdminProofError("SETUP_CREDENTIAL_FILE_MISSING", "No local admin setup credential file was found under .secrets/.");
}

function findWorkingCredentialFile(repoRoot = REPO_ROOT) {
  return findNewestMatchingFile(repoRoot, "local-admin-working-logins-");
}

function approvedEmailSet() {
  return new Set(APPROVED_ADMINS.map((account) => normalizeEmail(account.email)));
}

function assertApprovedAccountEmails(accounts) {
  const approved = approvedEmailSet();
  const actual = new Set(accounts.map((account) => normalizeEmail(account.email || "")));
  if (actual.size !== approved.size || [...actual].some((email) => !approved.has(email))) {
    throw new LocalAdminProofError("ADMIN_ALLOWLIST_REFUSED", "Proof accepts only the two approved local admin emails.");
  }
}

function readSetupCredentials(file, repoRoot = REPO_ROOT) {
  assertInsideSecrets(repoRoot, file);
  const payload = JSON.parse(readFileSync(file, "utf8"));
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  assertApprovedAccountEmails(accounts);
  for (const account of accounts) {
    if (account.displayName !== "Bryan Timm" || typeof account.setupPassword !== "string" || !account.setupPassword) {
      throw new LocalAdminProofError("SETUP_CREDENTIAL_FILE_INVALID", "Setup credential file does not match the approved account shape.");
    }
  }
  return new Map(accounts.map((account) => [normalizeEmail(account.email), account]));
}

function readWorkingCredentials(file, repoRoot = REPO_ROOT) {
  if (!file) return null;
  assertInsideSecrets(repoRoot, file);
  const payload = JSON.parse(readFileSync(file, "utf8"));
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  assertApprovedAccountEmails(accounts);
  for (const account of accounts) {
    if (account.displayName !== "Bryan Timm" || typeof account.workingPassword !== "string" || !account.workingPassword) {
      throw new LocalAdminProofError("WORKING_CREDENTIAL_FILE_INVALID", "Working credential file does not match the approved account shape.");
    }
  }
  return new Map(accounts.map((account) => [normalizeEmail(account.email), account]));
}

function generateWorkingPassword(account) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const password = `LocalAdmin!${newRandomToken(24)}9zZ`;
    if (validatePassword(password, { email: account.email, displayName: account.displayName }).length === 0) {
      return password;
    }
  }
  throw new LocalAdminProofError("PASSWORD_GENERATION_FAILED", "Unable to generate a valid working local admin password.");
}

function writeWorkingCredentialFile({ repoRoot, accounts, localUrl, now = new Date(), assertIgnored = assertGitIgnored }) {
  const file = path.join(repoRoot, ".secrets", `local-admin-working-logins-${timestampForFile(now)}.json`);
  assertInsideSecrets(repoRoot, file);
  assertIgnored(repoRoot, ".secrets/");
  assertIgnored(repoRoot, path.relative(repoRoot, file));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({
    kind: "local_admin_working_logins",
    generatedAt: now.toISOString(),
    localUrl,
    warning: "Ignored local working credentials. Do not commit, print, paste, screenshot, or move this file outside .secrets/.",
    accounts: accounts.map((account) => ({
      email: account.email,
      displayName: account.displayName,
      role: "admin",
      scopeType: "global",
      scopeId: "",
      workingPassword: account.workingPassword,
      instructions: "Use only for local Capstone Project admin login proof. Keep local, ignored, and private.",
    })),
  }, null, 2)}\n`, "utf8");
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function jsonRequest(url, data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", accept: "application/json", ...headers },
    body: JSON.stringify(data),
  });
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromResponse(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0] || "";
}

async function loginWithPassword(env, email, password) {
  return onLogin({
    request: jsonRequest("https://local.capstone.test/api/auth/login", { email, password }),
    env,
  });
}

async function completeReset(env, email, currentPassword, newPassword) {
  return onCompleteReset({
    request: jsonRequest("https://local.capstone.test/api/auth/complete-reset", {
      email,
      currentPassword,
      newPassword,
    }),
    env,
  });
}

async function verifyMe(env, cookie) {
  return onMe({
    request: new Request("https://local.capstone.test/api/auth/me", {
      headers: { accept: "application/json", cookie },
    }),
    env,
  });
}

async function verifyAdminDashboard(env, cookie) {
  return onAdminDashboard({
    request: new Request("https://local.capstone.test/api/admin/dashboard", {
      headers: { accept: "application/json", cookie },
    }),
    env,
  });
}

async function verifyAuthConfig(env) {
  return onAuthConfig({
    request: new Request("https://local.capstone.test/api/auth/config", {
      headers: { accept: "application/json" },
    }),
    env,
  });
}

function hasGlobalAdminRole(user) {
  return Array.isArray(user?.roles)
    && user.roles.some((role) => role.role_id === "admin" && role.scope_type === "global" && role.scope_id === "");
}

async function accountDbState(db, email) {
  return db.prepare(
    `SELECT u.email_norm, u.display_name, u.status, c.requires_reset, c.user_id IS NOT NULL AS has_password_credential
     FROM user_accounts u
     LEFT JOIN password_credentials c ON c.user_id = u.id
     WHERE u.email_norm = ?`,
  ).bind(normalizeEmail(email)).first();
}

async function proveAccount({ env, repoRoot, account, setupCredential, workingCredential }) {
  const stateBefore = await accountDbState(env.DB, account.email);
  if (!stateBefore || !stateBefore.has_password_credential) {
    throw new LocalAdminProofError("LOCAL_ACCOUNT_MISSING", "Approved local admin account or password credential is missing.", {
      email: account.email,
    });
  }

  const accountResult = {
    email: account.email,
    resetRequiredStateVerified: false,
    resetCompleted: false,
    loginVerified: false,
    meVerified: false,
    globalAdminVerified: false,
    workspaceReachableAfterAuth: false,
    setupCredentialInvalidAfterReset: false,
    ssoDependency: "none",
  };

  let workingPassword = workingCredential?.workingPassword || null;
  const needsReset = stateBefore.status === "pending_reset" || Number(stateBefore.requires_reset || 0) === 1;
  let workingPasswordGenerated = false;

  if (needsReset) {
    if (!setupCredential?.setupPassword) {
      throw new LocalAdminProofError("SETUP_CREDENTIAL_MISSING_FOR_ACCOUNT", "Reset-required account needs setup credential.", {
        email: account.email,
      });
    }
    const blockedLogin = await loginWithPassword(env, account.email, setupCredential.setupPassword);
    const blockedBody = await responseJson(blockedLogin);
    if (blockedLogin.status !== 403 || blockedBody.error !== "password_reset_required") {
      throw new LocalAdminProofError("RESET_REQUIRED_LOGIN_NOT_PROVEN", "Login did not return password_reset_required before reset.", {
        email: account.email,
        status: blockedLogin.status,
      });
    }
    accountResult.resetRequiredStateVerified = true;
    workingPassword = generateWorkingPassword(account);
    workingPasswordGenerated = true;

    const resetResponse = await completeReset(env, account.email, setupCredential.setupPassword, workingPassword);
    if (resetResponse.status !== 200) {
      throw new LocalAdminProofError("RESET_FLOW_FAILED", "Complete-reset route did not succeed.", {
        email: account.email,
        status: resetResponse.status,
      });
    }
    accountResult.resetCompleted = true;

    const oldSetupLogin = await loginWithPassword(env, account.email, setupCredential.setupPassword);
    accountResult.setupCredentialInvalidAfterReset = oldSetupLogin.status === 401;
  } else {
    if (!workingPassword) {
      throw new LocalAdminProofError("WORKING_CREDENTIAL_MISSING_FOR_ACTIVE_ACCOUNT", "Account is already active, but no working credential file was available.", {
        email: account.email,
      });
    }
    accountResult.resetRequiredStateVerified = true;
    accountResult.resetCompleted = true;
    accountResult.setupCredentialInvalidAfterReset = true;
  }

  const loginResponse = await loginWithPassword(env, account.email, workingPassword);
  if (loginResponse.status !== 200) {
    throw new LocalAdminProofError("LOGIN_VERIFY_FAILED", "Login with working password failed.", {
      email: account.email,
      status: loginResponse.status,
    });
  }
  accountResult.loginVerified = true;
  const cookie = cookieFromResponse(loginResponse);
  if (!cookie) {
    throw new LocalAdminProofError("SESSION_COOKIE_MISSING", "Login did not return a session cookie.", { email: account.email });
  }

  const meResponse = await verifyMe(env, cookie);
  const meBody = await responseJson(meResponse);
  if (meResponse.status !== 200 || !meBody.authenticated || normalizeEmail(meBody.user?.email || "") !== normalizeEmail(account.email)) {
    throw new LocalAdminProofError("ME_VERIFY_FAILED", "/api/auth/me did not return the authenticated local admin.", {
      email: account.email,
      status: meResponse.status,
    });
  }
  accountResult.meVerified = true;
  accountResult.globalAdminVerified = hasGlobalAdminRole(meBody.user);
  if (!accountResult.globalAdminVerified) {
    throw new LocalAdminProofError("GLOBAL_ADMIN_VERIFY_FAILED", "/api/auth/me did not expose global admin role.", { email: account.email });
  }

  const dashboardResponse = await verifyAdminDashboard(env, cookie);
  if (dashboardResponse.status !== 200) {
    throw new LocalAdminProofError("WORKSPACE_ADMIN_DATA_FAILED", "Authenticated admin overview endpoint was not reachable.", {
      email: account.email,
      status: dashboardResponse.status,
    });
  }
  accountResult.workspaceReachableAfterAuth = existsSync(path.join(repoRoot, "workspace.html"));

  return { accountResult, workingPassword, workingPasswordGenerated };
}

async function runLocalAdminLoginProof(options = {}) {
  const repoRoot = options.repoRoot || REPO_ROOT;
  const now = options.now || new Date();
  const verifyRepo = options.verifyRepo !== false;
  const assertIgnored = options.assertIgnored || assertGitIgnored;
  const repo = verifyRepo ? assertRepoIdentity(repoRoot) : null;
  assertIgnored(repoRoot, ".secrets/");

  const setupFile = options.setupCredentialFile || findSetupCredentialFile(repoRoot);
  assertInsideSecrets(repoRoot, setupFile);
  const setupCredentials = readSetupCredentials(setupFile, repoRoot);
  const existingWorkingFile = options.workingCredentialFile || findWorkingCredentialFile(repoRoot);
  const existingWorkingCredentials = existingWorkingFile ? readWorkingCredentials(existingWorkingFile, repoRoot) : null;

  const env = {
    AUTH_MODE: "hardened_username_password",
    AUTH_LOCAL_LOGIN_ENABLED: "true",
    AUTH_GOOGLE_SSO_ENABLED: "false",
    SESSION_COOKIE_NAME: "sc_session",
    PASSWORD_PEPPER: options.passwordPepper ?? process.env.PASSWORD_PEPPER ?? "",
    SESSION_PEPPER: options.sessionPepper ?? process.env.SESSION_PEPPER ?? "",
    ...(options.env || {}),
    DB: options.db || new LocalWranglerD1(),
  };

  const authConfigResponse = await verifyAuthConfig(env);
  const authConfig = await responseJson(authConfigResponse);
  if (authConfigResponse.status !== 200 || authConfig.googleSsoEnabled || !authConfig.localLoginEnabled) {
    throw new LocalAdminProofError("AUTH_CONFIG_VERIFY_FAILED", "Local auth config does not prove local login without Google SSO.");
  }

  const workingAccounts = [];
  const accounts = [];
  let generatedNewWorkingCredential = false;
  for (const approved of APPROVED_ADMINS) {
    const email = normalizeEmail(approved.email);
    const { accountResult, workingPassword, workingPasswordGenerated } = await proveAccount({
      env,
      repoRoot,
      account: approved,
      setupCredential: setupCredentials.get(email),
      workingCredential: existingWorkingCredentials?.get(email),
    });
    accounts.push(accountResult);
    generatedNewWorkingCredential = generatedNewWorkingCredential || workingPasswordGenerated;
    workingAccounts.push({ ...approved, workingPassword });
  }

  let workingCredentialPath = existingWorkingFile
    ? path.relative(repoRoot, existingWorkingFile).replaceAll("\\", "/")
    : null;
  let workingCredentialFileCreated = false;
  if (
    generatedNewWorkingCredential
    || !existingWorkingCredentials
    || accounts.some((account) => account.resetCompleted && !existingWorkingCredentials.has(normalizeEmail(account.email)))
  ) {
    workingCredentialPath = writeWorkingCredentialFile({
      repoRoot,
      accounts: workingAccounts,
      localUrl: "https://local.capstone.test/workspace.html",
      now,
      assertIgnored,
    });
    workingCredentialFileCreated = true;
  }

  return {
    ok: true,
    repo,
    method: "direct_route_handler",
    resetScriptRerun: false,
    setupCredentialPath: path.relative(repoRoot, setupFile).replaceAll("\\", "/"),
    workingCredentialPath,
    workingCredentialFileCreated,
    accounts,
    googleSsoRequired: false,
    credentialValuesPrinted: false,
    credentialValuesCommitted: false,
    secretsGitignored: true,
  };
}

function sqlLiteral(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function materializeSql(sql, params) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    if (index >= params.length) {
      throw new LocalAdminProofError("SQL_BINDING_MISMATCH", "Not enough SQL bind parameters.");
    }
    const value = params[index];
    index += 1;
    return sqlLiteral(value);
  });
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

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload[0]?.results || [];
  if (Array.isArray(payload?.result)) return payload.result[0]?.results || [];
  return payload?.result?.results || [];
}

class LocalWranglerD1 {
  prepare(sql) {
    return new LocalWranglerD1Statement(sql);
  }
}

class LocalWranglerD1Statement {
  constructor(sql) {
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  runWrangler() {
    if (!existsSync(WRANGLER_JS)) {
      throw new LocalAdminProofError("WRANGLER_NOT_FOUND", "Local Wrangler CLI is missing.");
    }
    const sql = materializeSql(this.sql, this.params);
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, "--local", "--json", "--command", sql], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, CI: "1" },
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new LocalAdminProofError("LOCAL_D1_QUERY_FAILED", "Local D1 query failed.", { status: result.status });
    }
    return normalizeRows(extractJson(`${result.stdout || ""}\n${result.stderr || ""}`));
  }

  async first() {
    return this.runWrangler()[0] || null;
  }

  async all() {
    return { results: this.runWrangler() };
  }

  async run() {
    this.runWrangler();
    return { success: true, results: [] };
  }
}

function redactDetails(details) {
  return JSON.parse(JSON.stringify(details || {}).replace(/"workingPassword"\s*:\s*"[^"]+"/g, '"workingPassword":"[redacted]"').replace(/"setupPassword"\s*:\s*"[^"]+"/g, '"setupPassword":"[redacted]"'));
}

export {
  APPROVED_ADMINS,
  LocalAdminProofError,
  assertApprovedAccountEmails,
  assertInsideSecrets,
  findSetupCredentialFile,
  generateWorkingPassword,
  readSetupCredentials,
  readWorkingCredentials,
  runLocalAdminLoginProof,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runLocalAdminLoginProof();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof LocalAdminProofError) {
      console.error(`Local admin login proof failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactDetails(error.details))}`);
      }
    } else {
      console.error(`Local admin login proof failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
