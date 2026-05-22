#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";
import { onRequestGet as onAdminDashboard } from "../functions/api/admin/dashboard.ts";
import { onRequestGet as onProgramTeacherDashboard } from "../functions/api/program-teacher/dashboard.ts";
import { onRequestGet as onMentorDashboard } from "../functions/api/mentor/dashboard.ts";
import { onRequestGet as onTeacherReviewQueue } from "../functions/api/teacher/review-queue.ts";
import { onRequestGet as onReadinessReport } from "../functions/api/reports/readiness.ts";
import { onRequestGet as onMentorAssigned } from "../functions/api/mentor/assigned.ts";
import { runLocalAdminLoginProof } from "./prove-local-admin-logins.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_ROOT = path.resolve("C:/SeniorProjectApp1.0");
const EXPECTED_BRANCH = "main";
const EXPECTED_REMOTE = "https://github.com/timmb-lab/SeniorProjectApp1.0.git";
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

const PROGRAM_EXPECTATIONS = Object.freeze({
  it: 45,
  culinary: 35,
  "sports-medicine": 35,
});

class DemoProofError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "DemoProofError";
    this.classification = classification;
    this.details = details;
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    credentialFile: "",
    runAdminProof: false,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--credential-file") {
      parsed.credentialFile = values[index + 1] || "";
      index += 1;
    } else if (value === "--remote") {
      throw new DemoProofError("REMOTE_REFUSED", "The demo proof is local-only and refuses --remote.");
    } else if (value === "--run-admin-proof") {
      parsed.runAdminProof = true;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/prove-local-demo-workspace.mjs [--credential-file .secrets/demo-staff-logins-YYYYMMDD-HHMMSS.json] [--run-admin-proof]");
      process.exit(0);
    } else {
      throw new DemoProofError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  return parsed;
}

function runGit(args, repoRoot = REPO_ROOT) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new DemoProofError("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed.`, { status: result.status });
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
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Demo proof is restricted to C:\\SeniorProjectApp1.0.", { root });
  }
  if (branch !== EXPECTED_BRANCH) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Demo proof must run from main.", { branch });
  }
  if (remote !== EXPECTED_REMOTE) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Unexpected origin remote.", { remote });
  }
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Unexpected package name.", { packageName: pkg.name });
  }
  return { root, branch, remote, head, status };
}

function findNewestMatchingFile(repoRoot, patternPrefix) {
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `if (Test-Path -LiteralPath .secrets) { Get-ChildItem -LiteralPath .secrets -Filter '${patternPrefix}*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName }`,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  const found = String(result.stdout || "").trim();
  return found ? path.resolve(found) : null;
}

function assertInsideSecrets(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new DemoProofError("SECRET_PATH_UNSAFE", "Credential paths must stay inside the repo .secrets folder.");
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
    throw new DemoProofError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function readJsonSecret(repoRoot, file) {
  assertInsideSecrets(repoRoot, file);
  assertGitIgnored(repoRoot, path.relative(repoRoot, file));
  return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function jsonRequest(url, data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", accept: "application/json", ...headers },
    body: JSON.stringify(data),
  });
}

function authedRequest(url, cookie) {
  return new Request(url, {
    headers: {
      accept: "application/json",
      cookie,
      "cf-connecting-ip": "203.0.113.44",
      "user-agent": "local-demo-proof",
    },
  });
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromResponse(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0] || "";
}

async function login(env, account) {
  const response = await onLogin({
    request: jsonRequest("https://local.capstone.test/api/auth/login", {
      email: account.email,
      password: account.password || account.workingPassword,
    }, {
      "cf-connecting-ip": "203.0.113.44",
      "user-agent": "local-demo-proof",
    }),
    env,
  });
  if (response.status !== 200) {
    throw new DemoProofError("LOGIN_FAILED", "Local auth login failed for a proof account.", {
      email: account.email,
      status: response.status,
    });
  }
  const cookie = cookieFromResponse(response);
  if (!cookie) {
    throw new DemoProofError("SESSION_COOKIE_MISSING", "Login did not return a session cookie.", { email: account.email });
  }
  return cookie;
}

async function getMe(env, cookie, expectedEmail, expectedRole) {
  const response = await onMe({
    request: authedRequest("https://local.capstone.test/api/auth/me", cookie),
    env,
  });
  const body = await responseJson(response);
  const roles = Array.isArray(body.user?.roles) ? body.user.roles : [];
  const ok = response.status === 200
    && body.authenticated === true
    && normalizeEmail(body.user?.email || "") === normalizeEmail(expectedEmail)
    && roles.some((role) => role.role_id === expectedRole);
  if (!ok) {
    throw new DemoProofError("AUTH_ME_FAILED", "/api/auth/me did not expose the expected user role.", {
      email: expectedEmail,
      status: response.status,
      expectedRole,
    });
  }
  return body;
}

async function runDemoProof(args = {}, options = {}) {
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  assertGitIgnored(repoRoot, ".secrets/");

  const localAdminProof = !(args.runAdminProof || options.runAdminLoginProof)
    ? { ok: true, skipped: true, workingCredentialPath: options.adminCredentialFile || null, accounts: [] }
    : await runLocalAdminLoginProof({
        repoRoot,
        verifyRepo: options.verifyRepo !== false,
        db: options.db || undefined,
      });

  const demoCredentialFile = args.credentialFile
    ? path.resolve(repoRoot, args.credentialFile)
    : findNewestMatchingFile(repoRoot, "demo-staff-logins-");
  if (!demoCredentialFile || !existsSync(demoCredentialFile)) {
    throw new DemoProofError("DEMO_CREDENTIAL_FILE_MISSING", "No demo staff credential file was found under .secrets/.");
  }
  const demoCredentials = readJsonSecret(repoRoot, demoCredentialFile);
  const adminCredentialFile = localAdminProof.workingCredentialPath
    ? path.resolve(repoRoot, localAdminProof.workingCredentialPath)
    : options.adminCredentialFile
      ? path.resolve(repoRoot, options.adminCredentialFile)
      : findNewestMatchingFile(repoRoot, "local-admin-working-logins-");
  if (!adminCredentialFile || !existsSync(adminCredentialFile)) {
    throw new DemoProofError("ADMIN_WORKING_CREDENTIAL_FILE_MISSING", "No local admin working credential file was found under .secrets/.");
  }
  const adminCredentials = readJsonSecret(repoRoot, adminCredentialFile);
  const adminAccount = adminCredentials.accounts?.[0];
  if (!adminAccount?.workingPassword) {
    throw new DemoProofError("ADMIN_WORKING_CREDENTIAL_FILE_INVALID", "Local admin working credential file is missing a working password.");
  }

  const env = {
    AUTH_MODE: "hardened_username_password",
    AUTH_LOCAL_LOGIN_ENABLED: "true",
    AUTH_GOOGLE_SSO_ENABLED: "false",
    SESSION_COOKIE_NAME: "sc_session",
    PASSWORD_PEPPER: options.passwordPepper ?? process.env.PASSWORD_PEPPER ?? "",
    SESSION_PEPPER: options.sessionPepper ?? process.env.SESSION_PEPPER ?? "",
    ...(options.env || {}),
    DB: options.db || new LocalSqliteD1(locateLocalD1Sqlite(repoRoot)),
  };

  const adminCookie = await login(env, { email: adminAccount.email, password: adminAccount.workingPassword });
  const adminMe = await getMe(env, adminCookie, adminAccount.email, "admin");
  const adminDashboard = await routeJson(onAdminDashboard, env, adminCookie, "https://local.capstone.test/api/admin/dashboard");
  const adminReviewQueue = await routeJson(onTeacherReviewQueue, env, adminCookie, "https://local.capstone.test/api/teacher/review-queue");
  const readiness = await routeJson(onReadinessReport, env, adminCookie, "https://local.capstone.test/api/reports/readiness");

  const adminChecks = {
    authMe: adminMe.authenticated === true,
    dashboardStudents250: Number(adminDashboard.summary?.studentsTotal || 0) === 250,
    programBreakdownNinePrograms: Array.isArray(adminDashboard.programBreakdown) && adminDashboard.programBreakdown.length === 9,
    mentorCoveragePopulated: Array.isArray(adminDashboard.mentorCoverage) && adminDashboard.mentorCoverage.length >= 25,
    reviewQueuePopulated: Array.isArray(adminDashboard.reviewQueue) && adminDashboard.reviewQueue.length > 0 && Array.isArray(adminReviewQueue.queue) && adminReviewQueue.queue.length > 0,
    readinessPopulated: Number(readiness.report?.submitted || 0) > 0
      && Number(readiness.report?.revisionRequested || 0) > 0
      && Number(readiness.report?.approved || 0) > 0
      && Number(readiness.report?.evidence || 0) > 0,
  };
  assertChecks("ADMIN_API_PROOF_FAILED", adminChecks);

  const teacherProofs = [];
  for (const programId of Object.keys(PROGRAM_EXPECTATIONS)) {
    const loginAccount = (demoCredentials.programTeacherLogins || []).find((account) => account.scope === `program:${programId}`);
    if (!loginAccount) {
      throw new DemoProofError("DEMO_TEACHER_LOGIN_MISSING", `Missing demo teacher credential for ${programId}.`);
    }
    const cookie = await login(env, loginAccount);
    const me = await getMe(env, cookie, loginAccount.email, "program_teacher");
    const dashboard = await routeJson(onProgramTeacherDashboard, env, cookie, "https://local.capstone.test/api/program-teacher/dashboard");
    const reviewQueue = await routeJson(onTeacherReviewQueue, env, cookie, "https://local.capstone.test/api/teacher/review-queue");
    const expectedCount = PROGRAM_EXPECTATIONS[programId];
    const programRow = (dashboard.programBreakdown || []).find((row) => row.programId === programId);
    const nonEmpty = Number(dashboard.summary?.scopedStudents || 0) === expectedCount
      && Array.isArray(dashboard.students)
      && dashboard.students.length > 0
      && Array.isArray(dashboard.programBreakdown)
      && Number(programRow?.studentCount || 0) === expectedCount
      && Array.isArray(reviewQueue.queue);
    if (!nonEmpty) {
      throw new DemoProofError("PROGRAM_TEACHER_API_PROOF_FAILED", "Program teacher dashboard was not scoped as expected.", {
        programId,
        expectedCount,
        actualScopedStudents: dashboard.summary?.scopedStudents,
      });
    }
    teacherProofs.push({
      email: loginAccount.email,
      programId,
      scopedStudents: Number(dashboard.summary.scopedStudents || 0),
      authMe: me.authenticated === true,
      dashboardNonEmpty: true,
      reviewQueueRows: reviewQueue.queue.length,
    });
  }

  const mentorProofs = [];
  for (const loginAccount of (demoCredentials.mentorLogins || []).slice(0, 3)) {
    const cookie = await login(env, loginAccount);
    const me = await getMe(env, cookie, loginAccount.email, "mentor");
    const mentorId = me.user.id;
    const dashboard = await routeJson(onMentorDashboard, env, cookie, "https://local.capstone.test/api/mentor/dashboard");
    const assigned = await routeJson(onMentorAssigned, env, cookie, "https://local.capstone.test/api/mentor/assigned");
    const expectedAssigned = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM mentor_assignments WHERE mentor_user_id = ? AND active = 1",
    ).bind(mentorId).first();
    const assignedCount = Number(expectedAssigned?.count || 0);
    const ok = assignedCount > 0
      && Number(dashboard.summary?.assignedCount || 0) === assignedCount
      && Array.isArray(dashboard.assignedStudents)
      && dashboard.assignedStudents.length === assignedCount
      && Array.isArray(assigned.assignedStudents)
      && assigned.assignedStudents.length === assignedCount;
    if (!ok) {
      throw new DemoProofError("MENTOR_API_PROOF_FAILED", "Mentor dashboard did not return exactly assigned students.", {
        email: loginAccount.email,
        assignedCount,
        dashboardCount: dashboard.summary?.assignedCount,
      });
    }
    mentorProofs.push({
      email: loginAccount.email,
      assignedCount,
      authMe: me.authenticated === true,
      dashboardAssignedOnly: true,
    });
  }
  if (mentorProofs.length !== 3) {
    throw new DemoProofError("MENTOR_LOGIN_COUNT_FAILED", "Expected three demo mentor login proofs.");
  }

  return {
    ok: true,
    repo,
    method: "direct_route_handler",
    localOnly: true,
    credentialPath: path.relative(repoRoot, demoCredentialFile).replaceAll("\\", "/"),
    credentialValuesPrinted: false,
    credentialValuesCommitted: false,
    localAdminProof: {
      ok: localAdminProof.ok === true,
      workingCredentialPath: localAdminProof.workingCredentialPath,
      accounts: (localAdminProof.accounts || []).map((account) => ({
        email: account.email,
        loginVerified: account.loginVerified,
        meVerified: account.meVerified,
        globalAdminVerified: account.globalAdminVerified,
      })),
    },
    admin: {
      email: adminAccount.email,
      checks: adminChecks,
      studentsTotal: Number(adminDashboard.summary.studentsTotal || 0),
      programBreakdownCount: adminDashboard.programBreakdown.length,
      mentorCoverageCount: adminDashboard.mentorCoverage.length,
      reviewQueueCount: adminReviewQueue.queue.length,
      readinessReport: readiness.report,
    },
    programTeachers: teacherProofs,
    mentors: mentorProofs,
    googleSsoRequired: false,
  };
}

async function routeJson(handler, env, cookie, url) {
  const response = await handler({ request: authedRequest(url, cookie), env });
  const body = await responseJson(response);
  if (response.status !== 200 || body.ok !== true) {
    throw new DemoProofError("API_ROUTE_FAILED", "A required local demo API route failed.", { url, status: response.status, body: safeBody(body) });
  }
  return body;
}

function assertChecks(classification, checks) {
  const failed = Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key);
  if (failed.length > 0) {
    throw new DemoProofError(classification, "One or more API proof checks failed.", { failed, checks });
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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
      throw new DemoProofError("SQL_BINDING_MISMATCH", "Not enough SQL bind parameters.");
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

function locateLocalD1Sqlite(repoRoot = REPO_ROOT) {
  const d1Root = path.join(repoRoot, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  if (!existsSync(d1Root)) {
    throw new DemoProofError("LOCAL_D1_STATE_MISSING", "Local Wrangler D1 state folder was not found. Run the local demo seed first.");
  }
  const candidates = readdirSync(d1Root)
    .filter((file) => file.endsWith(".sqlite") && file !== "metadata.sqlite")
    .map((file) => path.join(d1Root, file))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  for (const candidate of candidates) {
    try {
      const sqlite = new DatabaseSync(candidate, { readOnly: true });
      const found = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_accounts'").get();
      sqlite.close();
      if (found) return candidate;
    } catch {
      // Try the next local D1 sqlite file.
    }
  }
  throw new DemoProofError("LOCAL_D1_DATABASE_NOT_FOUND", "No local D1 sqlite database containing user_accounts was found.");
}

class LocalSqliteD1 {
  constructor(file) {
    this.file = file;
    this.sqlite = new DatabaseSync(file);
    this.sqlite.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(sql) {
    return new LocalSqliteD1Statement(this.sqlite, sql);
  }
}

class LocalSqliteD1Statement {
  constructor(sqlite, sql) {
    this.sqlite = sqlite;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    return this.sqlite.prepare(this.sql).get(...this.params) || null;
  }

  async all() {
    return {
      results: this.sqlite.prepare(this.sql).all(...this.params),
    };
  }

  async run() {
    const result = this.sqlite.prepare(this.sql).run(...this.params);
    return {
      success: true,
      meta: {
        changes: result.changes,
        last_row_id: result.lastInsertRowid,
      },
      results: [],
    };
  }
}

class LocalWranglerD1 {
  constructor(repoRoot = REPO_ROOT) {
    this.repoRoot = repoRoot;
  }

  prepare(sql) {
    return new LocalWranglerD1Statement(this.repoRoot, sql);
  }
}

class LocalWranglerD1Statement {
  constructor(repoRoot, sql) {
    this.repoRoot = repoRoot;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  runWrangler() {
    if (!existsSync(WRANGLER_JS)) {
      throw new DemoProofError("WRANGLER_NOT_FOUND", "Local Wrangler CLI is missing.");
    }
    const sql = materializeSql(this.sql, this.params);
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, "--local", "--json", "--command", sql], {
      cwd: this.repoRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "1" },
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new DemoProofError("LOCAL_D1_QUERY_FAILED", "Local D1 query failed.", { status: result.status });
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

function safeBody(body) {
  return JSON.parse(redact(JSON.stringify(body || {})));
}

function redact(value) {
  return String(value || "")
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"')
    .replace(/"workingPassword"\s*:\s*"[^"]+"/gi, '"workingPassword":"[REDACTED]"');
}

function redactDetails(details) {
  return JSON.parse(redact(JSON.stringify(details || {})));
}

export {
  DemoProofError,
  LocalSqliteD1,
  LocalWranglerD1,
  assertRepoIdentity,
  locateLocalD1Sqlite,
  parseArgs,
  runDemoProof,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runDemoProof(parseArgs());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof DemoProofError) {
      console.error(`Local demo proof failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactDetails(error.details))}`);
      }
    } else {
      console.error(`Local demo proof failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
