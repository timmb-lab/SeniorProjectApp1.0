#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_SEED,
  DEMO_ADDABLE_PROGRAMS,
  DEMO_MARKER,
  DEMO_SITES,
  DEMO_TENANT_ID,
  PROGRAMS,
  STORY_BUCKETS,
  STAFF_DOMAIN,
  STUDENT_DOMAIN,
  DemoSeedError,
  assertRepoIdentity,
  buildDeletePlan,
  buildDemoDataset,
  buildSeedSql,
  introspectSchema,
  loadLookups,
  siteStudentCounts,
  storyBucketCounts,
  validateSchemaCapabilities,
} from "./seed-local-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const DEFAULT_REMOTE_SEED = "capstone-remote-demo-2026-v1";
const CONFIRMATION = "SEED_REMOTE_DEMO";
const DEFAULT_REMOTE_DEMO_URL = "https://senior-capstone-app.pages.dev/workspace.html";
const KNOWN_BRYAN_EMAILS = Object.freeze([
  "bryan@learntechonline.com",
  "bryan.timm89@gmail.com",
  "bryan@thecapstoneapp.com",
]);
const FORBIDDEN_REAL_DOMAIN_PATTERNS = Object.freeze([
  "%@nv.ccsd.net",
  "%@gmail.com",
  "%@thecapstoneapp.com",
  "%@learntechonline.com",
]);

class RemoteWranglerD1Adapter {
  constructor({ repoRoot = REPO_ROOT, env = process.env } = {}) {
    this.repoRoot = repoRoot;
    this.env = env;
  }

  targetFlag() {
    return "--remote";
  }

  assertWrangler() {
    if (!existsSync(WRANGLER_JS)) {
      throw new DemoSeedError("WRANGLER_NOT_FOUND", "Local Wrangler CLI is missing. Run npm install before seeding remote D1.");
    }
  }

  assertRemoteToken() {
    if (!String(this.env.CLOUDFLARE_API_TOKEN || "").trim()) {
      throw new DemoSeedError("REMOTE_D1_BLOCKED_NO_TOKEN", "CLOUDFLARE_API_TOKEN is required for remote D1 access.");
    }
  }

  async query(sql) {
    const [rows] = await this.queryBatch([sql]);
    return rows || [];
  }

  async queryBatch(statements) {
    this.assertWrangler();
    this.assertRemoteToken();
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, this.targetFlag(), "--json", "--command", statements.join("\n")], {
      cwd: this.repoRoot,
      encoding: "utf8",
      env: this.safeEnv(),
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new DemoSeedError("REMOTE_D1_QUERY_FAILED", "Remote D1 query failed.", {
        status: result.status,
        statementCount: statements.length,
        output: redact(`${result.stdout || ""}\n${result.stderr || ""}`),
      });
    }
    return normalizeBatchResultRows(extractJson(`${result.stdout || ""}\n${result.stderr || ""}`));
  }

  async executeScript(sqlText, { label = "remote-demo-workspace-seed", repoRoot = this.repoRoot } = {}) {
    this.assertWrangler();
    this.assertRemoteToken();
    const tempFile = path.join(repoRoot, ".secrets", `${label}-${Date.now()}.sql`);
    assertSecretPath(repoRoot, tempFile);
    assertGitIgnored(repoRoot, ".secrets/");
    assertGitIgnored(repoRoot, path.relative(repoRoot, tempFile));
    mkdirSync(path.dirname(tempFile), { recursive: true });
    writeFileSync(tempFile, sqlText, "utf8");
    try {
      const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, this.targetFlag(), "--file", tempFile], {
        cwd: repoRoot,
        encoding: "utf8",
        env: this.safeEnv(),
        windowsHide: true,
      });
      if (result.status !== 0) {
        throw new DemoSeedError("REMOTE_D1_WRITE_FAILED", "Remote D1 write failed.", {
          status: result.status,
          output: redact(`${result.stdout || ""}\n${result.stderr || ""}`),
        });
      }
    } finally {
      rmSync(tempFile, { force: true });
    }
  }

  safeEnv() {
    const env = { ...process.env, ...this.env, CI: "1" };
    if (!String(env.CLOUDFLARE_ACCOUNT_ID || "").trim()) {
      const accountId = readConfiguredCloudflareAccountId(this.repoRoot);
      if (accountId) env.CLOUDFLARE_ACCOUNT_ID = accountId;
    }
    return env;
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    target: "",
    mode: "",
    reset: false,
    seed: DEFAULT_REMOTE_SEED,
    confirm: "",
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--remote") {
      if (parsed.target) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose exactly one target: --remote.");
      parsed.target = "remote";
    } else if (value === "--local") {
      throw new DemoSeedError("LOCAL_REFUSED", "The remote demo seeder only accepts --remote.");
    } else if (value === "--dry-run" || value === "--write") {
      if (parsed.mode) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose exactly one mode: --dry-run or --write.");
      parsed.mode = value === "--dry-run" ? "dryrun" : "write";
    } else if (value === "--reset") {
      parsed.reset = true;
    } else if (value === "--seed") {
      parsed.seed = values[index + 1] || "";
      index += 1;
    } else if (value === "--confirm") {
      parsed.confirm = values[index + 1] || "";
      index += 1;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/seed-remote-demo-workspace.mjs --remote --dry-run|--write [--reset] [--seed value] [--confirm SEED_REMOTE_DEMO]");
      process.exit(0);
    } else {
      throw new DemoSeedError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  if (parsed.target !== "remote") throw new DemoSeedError("INVALID_ARGUMENTS", "Choose --remote.");
  if (!parsed.mode) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose --dry-run or --write.");
  if (!parsed.seed) throw new DemoSeedError("INVALID_ARGUMENTS", "--seed cannot be empty.");
  if (parsed.mode === "write" && parsed.confirm !== CONFIRMATION) {
    throw new DemoSeedError("REMOTE_WRITE_CONFIRMATION_REQUIRED", `Remote write requires --confirm ${CONFIRMATION}.`);
  }
  return parsed;
}

async function runRemoteDemoSeed(args, options = {}) {
  if (args.target !== "remote") {
    throw new DemoSeedError("LOCAL_REFUSED", "The remote demo seeder only accepts remote D1 targets.");
  }
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  const adapter = options.adapter || new RemoteWranglerD1Adapter({ repoRoot, env: options.env || process.env });
  if (args.mode === "write" && typeof adapter.assertRemoteToken === "function") adapter.assertRemoteToken();

  const schema = await introspectSchema(adapter);
  const { capabilities, skippedSlices } = validateSchemaCapabilities(schema);
  const lookups = await loadLookups(adapter);
  const preservedBefore = await snapshotPreservedRemoteState(adapter, schema);
  const deletePlanBefore = await buildDeletePlan(adapter, schema);
  const dataset = await buildRemoteDataset({
    capabilities,
    lookups,
    seed: args.seed || DEFAULT_REMOTE_SEED,
    passwordPepper: options.passwordPepper ?? process.env.PASSWORD_PEPPER ?? "",
  });
  assertDatasetUsesOnlyAllowedDomains(dataset);

  const base = {
    ok: true,
    target: "remote",
    mode: args.mode,
    resetRequested: Boolean(args.reset),
    confirmationRequiredForWrite: CONFIRMATION,
    repo,
    protectedStateBefore: preservedBefore.public,
    deletePlan: {
      demoRowsFoundBeforeReset: deletePlanBefore.counts,
      totalDemoRowsFoundBeforeReset: deletePlanBefore.total,
    },
    generatedCounts: dataset.generatedCounts,
    programDistribution: dataset.programDistribution,
    siteDistribution: dataset.siteDistribution,
    stageDistribution: dataset.stageDistribution,
    storyBuckets: dataset.storyBuckets,
    skippedSlices,
    credentialPath: null,
    credentialsPrinted: false,
    credentialValuesCommitted: false,
    remoteSafety: {
      demoStudentDomain: STUDENT_DOMAIN,
      demoStaffDomain: STAFF_DOMAIN,
      fakeDomainsOnly: true,
      physicalDriveFilesCreated: false,
      evidenceUsesExampleComOnly: true,
      replacesOnlyDemoOwnedRows: true,
      preservesRealUsers: true,
      preservesBryanAdmins: true,
      preservesTenantDomainProviderAndDriveConfig: true,
    },
    finalVerification: null,
    protectedStateAfter: null,
  };
  if (args.mode === "dryrun") return base;

  let writeDataset = dataset;
  let hostedStaffProvisioning = null;
  if (options.provisionStaffWithHostedApp === true) {
    await adapter.executeScript(buildRemoteCleanupSql(schema), { label: "remote-demo-workspace-cleanup", repoRoot });
    await forceDeleteRemainingDemoAccounts(adapter);
    await waitForDemoAccountsDeleted(adapter);
    await delay(30000);
    hostedStaffProvisioning = await provisionHostedStaffAccounts({
      repoRoot,
      adapter,
      dataset,
      baseUrl: options.baseUrl || DEFAULT_REMOTE_DEMO_URL,
    });
    writeDataset = remapDatasetForProvisionedStaff(dataset, hostedStaffProvisioning.idMap);
  }
  const sqlText = buildRemoteSeedSql(writeDataset, schema, { includeDeletes: options.provisionStaffWithHostedApp !== true });
  await adapter.executeScript(sqlText, { label: "remote-demo-workspace-seed", repoRoot });
  const preservedAfter = await snapshotPreservedRemoteState(adapter, schema);
  assertPreservedRemoteState(preservedBefore, preservedAfter);
  const deletePlanAfter = await buildDeletePlan(adapter, schema);
  const finalVerification = await verifyRemoteSeedState(adapter, schema);
  const credentialPath = options.writeCredentials === false
    ? null
    : writeRemoteCredentialFile({
        repoRoot,
        credentials: dataset.credentials,
        now: options.now || new Date(),
        assertIgnored: options.assertIgnored || assertGitIgnored,
      });

  return {
    ...base,
    credentialPath,
    protectedStateAfter: preservedAfter.public,
    hostedStaffProvisioning: hostedStaffProvisioning
      ? {
          importedStaffAccounts: hostedStaffProvisioning.importedStaffAccounts,
          activatedStaffAccounts: hostedStaffProvisioning.activatedStaffAccounts,
          credentialsHashedByHostedApp: true,
        }
      : null,
    deletePlan: {
      ...base.deletePlan,
      demoRowsDeleted: deletePlanBefore.counts,
      demoRowsInserted: deletePlanAfter.counts,
      totalDemoRowsAfterSeed: deletePlanAfter.total,
    },
    finalVerification,
  };
}

async function buildRemoteDataset({ capabilities, lookups, seed, passwordPepper }) {
  return buildDemoDataset({
    capabilities,
    lookups,
    seed,
    passwordPepper,
    programTeacherCountOverride: 1,
    mentorCount: 48,
    credentialTeacherProgramIds: PROGRAMS.map((program) => program.id),
    credentialMentorCount: 48,
    suggestedDemoUrl: DEFAULT_REMOTE_DEMO_URL,
    includeDemoAdmin: true,
    demoAdminId: "demo-admin-001",
    demoAdminEmail: `admin001@${STAFF_DOMAIN}`,
    demoAdminDisplayName: "Demo Admin",
    passwordPrefix: "Q9!vV-",
    demoLocationLabel: "remote",
  });
}

function buildRemoteSeedSql(dataset, schema, { includeDeletes = true } = {}) {
  return buildSeedSql(dataset, schema, { includeDeletes, includeTransaction: false });
}

function buildRemoteCleanupSql(schema) {
  return buildSeedSql(emptyRemoteDataset(), schema, { includeDeletes: true, includeTransaction: false });
}

function emptyRemoteDataset() {
  return {
    rows: {
      tenants: [],
      programs: [],
      sites: [],
      sitePrograms: [],
      cohorts: [],
      groups: [],
      userAccounts: [],
      passwordCredentials: [],
      userRoles: [],
      tenantUsers: [],
      siteUsers: [],
      groupMemberships: [],
      mentorAssignments: [],
      viewerStudentAssignments: [],
      studentRosterProfiles: [],
      progressRecords: [],
      submissions: [],
      statusHistory: [],
      evidenceArtifacts: [],
      reviews: [],
      comments: [],
      submissionVersions: [],
      mentorMeetings: [],
      presentationSlots: [],
      exports: [],
      exportArtifacts: [],
      auditEvents: [],
    },
  };
}

async function forceDeleteRemainingDemoAccounts(adapter) {
  await adapter.queryBatch([
    `DELETE FROM user_accounts WHERE email_norm LIKE '%@${STAFF_DOMAIN}' OR email_norm LIKE '%@${STUDENT_DOMAIN}';`,
  ]);
}

async function waitForDemoAccountsDeleted(adapter) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const rows = await adapter.query(
      `SELECT COUNT(*) AS count
       FROM user_accounts
       WHERE email_norm LIKE '%@${STAFF_DOMAIN}'
          OR email_norm LIKE '%@${STUDENT_DOMAIN}';`,
    );
    if (Number(rows[0]?.count || 0) === 0) {
      await delay(3000);
      return;
    }
    await delay(Math.min(10000, 1000 * attempt));
  }
  throw new DemoSeedError("REMOTE_DEMO_CLEANUP_INCOMPLETE", "Remote demo cleanup did not remove all demo-domain accounts before hosted staff provisioning.");
}

function assertDatasetUsesOnlyAllowedDomains(dataset) {
  const forbidden = dataset.rows.userAccounts.filter((row) => {
    const email = normalizeEmail(row.email_norm || row.email);
    if (row.id.startsWith("demo-student-")) return !email.endsWith(`@${STUDENT_DOMAIN}`);
    if (
      row.id.startsWith("demo-teacher-")
      || row.id.startsWith("demo-mentor-")
      || row.id.startsWith("demo-admin-")
      || row.id.startsWith("demo-platform-admin-")
      || row.id.startsWith("demo-administration-")
      || row.id.startsWith("demo-site-admin-")
      || row.id.startsWith("demo-viewer-")
    ) {
      return !email.endsWith(`@${STAFF_DOMAIN}`);
    }
    return row.id.startsWith("demo-");
  });
  if (forbidden.length > 0) {
    throw new DemoSeedError("DEMO_DOMAIN_GUARD_FAILED", "Remote demo dataset contains a demo user outside the approved fake domains.", {
      count: forbidden.length,
    });
  }
}

class SessionClient {
  #cookies = new Map();

  constructor(baseUrl) {
    this.baseUrl = new URL(baseUrl).origin;
  }

  async fetchJson(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept")) headers.set("accept", "application/json");
    if (this.#cookies.size > 0 && !headers.has("cookie")) headers.set("cookie", this.#cookieHeader());
    const response = await fetch(new URL(pathname, this.baseUrl), { ...init, headers });
    this.#storeCookies(response.headers);
    const body = await response.json().catch(() => null);
    return { response, body };
  }

  #cookieHeader() {
    return Array.from(this.#cookies, ([name, value]) => `${name}=${value}`).join("; ");
  }

  #storeCookies(headers) {
    const values = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];
    for (const value of values) {
      const [nameValue, ...attributes] = value.split(";");
      const equalsIndex = nameValue.indexOf("=");
      if (equalsIndex === -1) continue;
      const name = nameValue.slice(0, equalsIndex).trim();
      const cookieValue = nameValue.slice(equalsIndex + 1).trim();
      const lowerAttributes = attributes.map((attribute) => attribute.trim().toLowerCase());
      if (!cookieValue || lowerAttributes.includes("max-age=0")) this.#cookies.delete(name);
      else this.#cookies.set(name, cookieValue);
    }
  }
}

async function provisionHostedStaffAccounts({ repoRoot, adapter, dataset, baseUrl }) {
  const adminCredential = readHostedAdminCredential(repoRoot);
  const adminClient = new SessionClient(baseUrl);
  await hostedLogin(adminClient, adminCredential, "seed_admin");

  const staffAccounts = staffAccountsForHostedImport(dataset);
  const temporaryPasswordsByEmail = new Map();
  for (const batch of chunks(staffAccounts, 25)) {
    const result = await hostedJsonWithRetry(() => adminClient.fetchJson("/api/admin/users/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adminNote: "Remote DEMO_SEED staff provisioning",
        users: batch.map((account) => account.importUser),
      }),
    }), "hosted staff import", { retryStatuses: [409, 429, 500, 502, 503, 504] });
    if (result.response.status !== 200 || result.body?.ok !== true) {
      throw new DemoSeedError("HOSTED_STAFF_IMPORT_FAILED", "Hosted fake staff import failed.", {
        status: result.response.status,
        error: result.body?.error || null,
      });
    }
    for (const user of result.body.users || []) {
      if (user.email && user.temporaryPassword) {
        temporaryPasswordsByEmail.set(normalizeEmail(user.email), user.temporaryPassword);
      }
    }
  }

  let activatedStaffAccounts = 0;
  for (const account of staffAccounts) {
    const temporaryPassword = temporaryPasswordsByEmail.get(normalizeEmail(account.email));
    if (!temporaryPassword) {
      throw new DemoSeedError("HOSTED_STAFF_IMPORT_MISSING_TEMP_PASSWORD", "Hosted fake staff import did not return a temporary credential for one generated staff account.", {
        role: account.role,
      });
    }
    const resetClient = new SessionClient(baseUrl);
    const reset = await hostedJsonWithRetry(() => resetClient.fetchJson("/api/auth/complete-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: account.email,
        currentPassword: temporaryPassword,
        newPassword: account.password,
      }),
    }), "hosted staff reset");
    if (reset.response.status !== 200 || reset.body?.ok !== true) {
      throw new DemoSeedError("HOSTED_STAFF_RESET_FAILED", "Hosted fake staff credential activation failed.", {
        status: reset.response.status,
        role: account.role,
        error: reset.body?.error || null,
      });
    }
    activatedStaffAccounts += 1;
    await delay(500);
  }

  const importedRows = await adapter.query(
    `SELECT id, email_norm
     FROM user_accounts
     WHERE email_norm LIKE '%@${STAFF_DOMAIN}'
     ORDER BY email_norm;`,
  );
  const importedIdsByEmail = new Map(importedRows.map((row) => [normalizeEmail(row.email_norm), row.id]));
  const idMap = new Map();
  for (const row of dataset.rows.userAccounts) {
    const emailNorm = normalizeEmail(row.email_norm || row.email);
    if (!emailNorm.endsWith(`@${STAFF_DOMAIN}`)) continue;
    const importedId = importedIdsByEmail.get(emailNorm);
    if (!importedId) {
      throw new DemoSeedError("HOSTED_STAFF_ID_MAP_FAILED", "Could not map a hosted generated staff account back to its imported D1 id.", {
        role: roleForSeedUserId(row.id),
      });
    }
    idMap.set(row.id, importedId);
  }
  if (idMap.size !== staffAccounts.length) {
    throw new DemoSeedError("HOSTED_STAFF_ID_MAP_INCOMPLETE", "Hosted staff id map did not cover every generated staff account.", {
      expected: staffAccounts.length,
      actual: idMap.size,
    });
  }
  return {
    importedStaffAccounts: staffAccounts.length,
    activatedStaffAccounts,
    idMap,
  };
}

function staffAccountsForHostedImport(dataset) {
  const credentials = [
    ...(dataset.credentials.adminLogins || []),
    ...(dataset.credentials.programTeacherLogins || []),
    ...(dataset.credentials.mentorLogins || []),
  ];
  return credentials.map((account) => {
    const role = account.role;
    const scope = hostedImportScope(account);
    return {
      ...account,
      importUser: {
        email: account.email,
        displayName: account.displayName,
        roleId: role,
        identityType: "local",
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        globalAdminConfirmation: role === "global_admin" || role === "admin" || role === "platform_admin",
      },
    };
  });
}

function hostedImportScope(account) {
  if (account.role === "program_teacher") {
    const scopeId = String(account.scope || "").replace(/^program:/, "");
    return { scopeType: "program", scopeId };
  }
  if ((account.role === "site_admin" || account.role === "viewer") && String(account.scope || "").startsWith("site:")) {
    return { scopeType: "site", scopeId: String(account.scope || "").replace(/^site:/, "") };
  }
  return { scopeType: "global", scopeId: "" };
}

function remapDatasetForProvisionedStaff(dataset, idMap) {
  const staffIds = new Set(idMap.keys());
  const rows = structuredClone(dataset.rows);
  rows.userAccounts = rows.userAccounts.filter((row) => !staffIds.has(row.id));
  rows.passwordCredentials = rows.passwordCredentials.filter((row) => !staffIds.has(row.user_id));
  rows.userRoles = rows.userRoles.filter((row) => !staffIds.has(row.user_id));
  for (const rowList of Object.values(rows)) {
    for (const row of rowList) {
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "string" && idMap.has(value)) row[key] = idMap.get(value);
      }
    }
  }
  return {
    ...dataset,
    rows,
  };
}

async function hostedLogin(client, account, roleId) {
  const result = await hostedJsonWithRetry(() => client.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  }), "hosted seed admin login");
  if (result.response.status !== 200 || result.body?.ok !== true) {
    throw new DemoSeedError("HOSTED_ADMIN_LOGIN_FAILED", "Hosted fake admin login failed before remote demo staff provisioning.", {
      roleId,
      email: account.email,
      status: result.response.status,
      error: result.body?.error || null,
    });
  }
}

async function hostedJsonWithRetry(operation, label, { retryStatuses = [429, 500, 502, 503, 504] } = {}) {
  let lastResult = null;
  let lastError = null;
  for (let attempt = 1; attempt <= 16; attempt += 1) {
    try {
      const result = await operation();
      lastResult = result;
      if (!retryStatuses.includes(result.response.status)) return result;
    } catch (error) {
      lastError = error;
    }
    await delay(Math.min(30000, 3000 * attempt));
  }
  if (lastResult) return lastResult;
  throw new DemoSeedError("HOSTED_PROVISIONING_RETRY_FAILED", `${label} did not return a response after retries.`, {
    error: lastError instanceof Error ? redact(lastError.message) : redact(String(lastError || "")),
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readHostedAdminCredential(repoRoot) {
  const file = path.join(repoRoot, ".secrets", "test-accounts-2026-05-18.json");
  assertSecretPath(repoRoot, file);
  assertGitIgnored(repoRoot, path.relative(repoRoot, file));
  if (!existsSync(file)) {
    throw new DemoSeedError("HOSTED_ADMIN_CREDENTIAL_MISSING", "Hosted fake admin credential file is required to hash remote demo staff credentials inside the hosted app.");
  }
  const payload = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  const admin = accounts.find((account) => String(account.key || account.roleId || "").toLowerCase().includes("admin") && !String(account.key || "").toLowerCase().includes("misc"));
  if (!admin?.email || !admin?.password || !String(admin.email).endsWith(".test")) {
    throw new DemoSeedError("HOSTED_ADMIN_CREDENTIAL_INVALID", "Hosted fake admin credential must be a fake .test account.");
  }
  return admin;
}

function chunks(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

function roleForSeedUserId(id) {
  if (String(id).startsWith("demo-admin-")) return "global_admin";
  if (String(id).startsWith("demo-platform-admin-")) return "global_admin";
  if (String(id).startsWith("demo-administration-")) return "administration";
  if (String(id).startsWith("demo-site-admin-")) return "site_admin";
  if (String(id).startsWith("demo-viewer-")) return "viewer";
  if (String(id).startsWith("demo-teacher-")) return "program_teacher";
  if (String(id).startsWith("demo-mentor-")) return "mentor";
  return "staff";
}

async function snapshotPreservedRemoteState(adapter, schema) {
  const bryanRows = await adapter.query(
    `SELECT
       u.id,
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
     WHERE u.email_norm IN (${KNOWN_BRYAN_EMAILS.map(sqlString).join(", ")})
     ORDER BY u.email_norm, ur.role_id, ur.scope_type, ur.scope_id;`,
  );
  const userCounts = await adapter.query(
    `SELECT
       COUNT(*) AS total_users,
       SUM(CASE WHEN email_norm LIKE '%@${STUDENT_DOMAIN}' OR email_norm LIKE '%@${STAFF_DOMAIN}' THEN 1 ELSE 0 END) AS demo_domain_users,
       SUM(CASE WHEN email_norm NOT LIKE '%@${STUDENT_DOMAIN}' AND email_norm NOT LIKE '%@${STAFF_DOMAIN}' THEN 1 ELSE 0 END) AS non_demo_users,
       SUM(CASE WHEN ${realDomainWhere("email_norm")} THEN 1 ELSE 0 END) AS known_real_domain_users
     FROM user_accounts;`,
  );
  const config = {};
  for (const table of ["tenants", "tenant_domains", "identity_providers", "evidence_repositories", "app_settings"]) {
    if (!schema.tableNames.has(table)) continue;
    config[table] = await tableSnapshot(adapter, table);
  }
  return {
    public: {
      bryanAdminRows: bryanRows.length,
      bryanAdminsFound: uniqueCount(bryanRows.map((row) => row.email_norm)),
      realUsersPreservedBaseline: Number(userCounts[0]?.non_demo_users || 0),
      knownRealDomainUsersBaseline: Number(userCounts[0]?.known_real_domain_users || 0),
      configurationTables: Object.fromEntries(Object.entries(config).map(([table, value]) => [table, { rows: value.count, preserved: true }])),
    },
    compare: {
      bryanRows: bryanRows.map((row) => ({
        id: row.id,
        emailNorm: row.email_norm,
        displayName: row.display_name,
        status: row.status,
        hasPasswordCredential: Number(row.has_password_credential || 0),
        requiresReset: Number(row.requires_reset || 0),
        roleId: row.role_id || "",
        scopeType: row.scope_type || "",
        scopeId: row.scope_id || "",
      })),
      userCounts: userCounts[0] || {},
      config,
    },
  };
}

async function tableSnapshot(adapter, table) {
  const where = table === "tenants" ? ` WHERE id <> ${sqlString(DEMO_TENANT_ID)}` : "";
  const rows = await adapter.query(`SELECT * FROM ${quoteIdent(table)}${where} ORDER BY ${orderByFor(table)};`);
  return {
    count: rows.length,
    digest: sha256(JSON.stringify(rows)),
  };
}

function orderByFor(table) {
  if (table === "tenant_domains") return "tenant_id, domain";
  if (table === "identity_providers") return "tenant_id, provider, hosted_domain";
  if (table === "app_settings") return "key";
  return "id";
}

function assertPreservedRemoteState(before, after) {
  if (JSON.stringify(before.compare.bryanRows) !== JSON.stringify(after.compare.bryanRows)) {
    throw new DemoSeedError("BRYAN_ADMIN_PRESERVATION_FAILED", "A Bryan admin account changed during remote demo seeding.", {
      beforeRows: before.public.bryanAdminRows,
      afterRows: after.public.bryanAdminRows,
    });
  }
  const beforeCounts = before.compare.userCounts;
  const afterCounts = after.compare.userCounts;
  for (const key of ["non_demo_users", "known_real_domain_users"]) {
    if (Number(beforeCounts[key] || 0) !== Number(afterCounts[key] || 0)) {
      throw new DemoSeedError("REAL_USER_PRESERVATION_FAILED", "Remote demo seeding changed the preserved real-user count.", {
        countName: key,
        before: Number(beforeCounts[key] || 0),
        after: Number(afterCounts[key] || 0),
      });
    }
  }
  for (const [table, snapshot] of Object.entries(before.compare.config)) {
    const afterSnapshot = after.compare.config[table];
    if (!afterSnapshot || snapshot.count !== afterSnapshot.count || snapshot.digest !== afterSnapshot.digest) {
      throw new DemoSeedError("REMOTE_CONFIG_PRESERVATION_FAILED", "Remote demo seeding changed tenant/domain/provider or Drive configuration.", {
        table,
        beforeRows: snapshot.count,
        afterRows: afterSnapshot?.count ?? null,
      });
    }
  }
}

async function verifyRemoteSeedState(adapter, schema) {
  const queries = [
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student' WHERE u.email_norm LIKE '%@demo-student.capstone.test';",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'program_teacher' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'mentor' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'global_admin' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';",
    "SELECT COUNT(*) AS count FROM mentor_assignments WHERE id LIKE 'demo-%' AND active = 1;",
    "SELECT COUNT(DISTINCT student_user_id) AS count FROM mentor_assignments WHERE id LIKE 'demo-%' AND active = 1;",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student' LEFT JOIN mentor_assignments ma ON ma.student_user_id = u.id AND ma.active = 1 WHERE u.email_norm LIKE '%@demo-student.capstone.test' AND ma.id IS NULL;",
    "SELECT COUNT(*) AS count FROM submissions WHERE id LIKE 'demo-%';",
    "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND source_kind = 'external_link' AND external_url LIKE 'https://example.com/capstone-demo/%' AND drive_file_id IS NULL AND drive_parent_folder_id IS NULL;",
    "SELECT COUNT(*) AS count FROM comments WHERE id LIKE 'demo-%';",
    "SELECT COUNT(*) AS count FROM reviews WHERE id LIKE 'demo-%';",
    `SELECT COUNT(*) AS count FROM user_accounts WHERE id LIKE 'demo-%' AND (${realDomainWhere("email_norm")});`,
    "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND (drive_file_id IS NOT NULL OR drive_parent_folder_id IS NOT NULL OR external_url NOT LIKE 'https://example.com/capstone-demo/%');",
    "SELECT COUNT(*) AS count FROM exports WHERE id LIKE 'demo-%' AND drive_file_id IS NOT NULL;",
    `SELECT COUNT(*) AS count FROM tenants WHERE id = ${sqlString(DEMO_TENANT_ID)} AND status = 'active';`,
    `SELECT COUNT(*) AS count FROM sites WHERE tenant_id = ${sqlString(DEMO_TENANT_ID)} AND status = 'active';`,
    `SELECT COUNT(*) AS count
     FROM site_users su
     JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
     JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@demo-student.capstone.test'
     WHERE su.site_id = ${sqlString(DEMO_SITES[0].id)}
       AND su.membership_status = 'active';`,
    `SELECT COUNT(*) AS count
     FROM site_users su
     JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
     JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@demo-student.capstone.test'
     WHERE su.site_id IN (${DEMO_SITES.filter((site) => !site.primary).map((site) => sqlString(site.id)).join(", ")})
       AND su.membership_status = 'active';`,
    `SELECT COUNT(*) AS count FROM site_programs WHERE site_id = ${sqlString(DEMO_SITES[0].id)} AND active = 1;`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'global_admin' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'administration' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'site_admin' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'viewer' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    "SELECT COUNT(*) AS count FROM viewer_student_assignments WHERE id LIKE 'demo-%' AND active = 1;",
    `SELECT COUNT(*) AS count FROM password_credentials WHERE user_id IN (SELECT id FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test');`,
    "SELECT COUNT(*) AS count FROM announcements WHERE id LIKE 'demo-%' OR title LIKE '%DEMO_SEED%' OR body LIKE '%DEMO_SEED%';",
    `SELECT COUNT(*) AS count
     FROM student_roster_profiles profile
     JOIN user_accounts u ON u.id = profile.student_user_id
     WHERE u.email_norm LIKE '%@demo-student.capstone.test'
       AND profile.cohort = 'Class of 2027'
       AND profile.graduation_year = '2027';`,
    "PRAGMA foreign_key_check;",
  ];
  const rows = await adapter.queryBatch(queries);
  const summary = {
    demoStudents: firstCount(rows[0]),
    demoProgramTeachers: firstCount(rows[1]),
    demoMentors: firstCount(rows[2]),
    demoAdmins: firstCount(rows[3]),
    mentorAssignments: firstCount(rows[4]),
    studentsWithMentors: firstCount(rows[5]),
    studentsWithoutMentors: firstCount(rows[6]),
    submissions: firstCount(rows[7]),
    evidenceMetadata: firstCount(rows[8]),
    comments: firstCount(rows[9]),
    reviews: firstCount(rows[10]),
    forbiddenDemoRealDomainRows: firstCount(rows[11]),
    unsafeDemoEvidenceRows: firstCount(rows[12]),
    unsafeDemoExportDriveRows: firstCount(rows[13]),
    demoTenantRows: firstCount(rows[14]),
    demoSites: firstCount(rows[15]),
    primarySiteStudents: firstCount(rows[16]),
    secondarySiteStudents: firstCount(rows[17]),
    primarySitePrograms: firstCount(rows[18]),
    globalAdmins: firstCount(rows[19]),
    administrationUsers: firstCount(rows[20]),
    siteAdmins: firstCount(rows[21]),
    viewers: firstCount(rows[22]),
    viewerStudentAssignments: firstCount(rows[23]),
    studentCredentials: firstCount(rows[24]),
    announcements: firstCount(rows[25]),
    studentRosterProfiles: firstCount(rows[26]),
    foreignKeyViolations: rows[27].length,
  };
  summary.primaryAvailablePrograms = firstCount(await adapter.query(
    `SELECT COUNT(*) AS count
     FROM programs
     LEFT JOIN site_programs
       ON site_programs.site_id = ${sqlString(DEMO_SITES[0].id)}
      AND site_programs.program_id = programs.id
      AND site_programs.active = 1
     WHERE programs.active = 1
      AND site_programs.program_id IS NULL;`,
  ));
  const optional = {};
  if (schema.tableNames.has("mentor_meetings")) optional.mentorMeetings = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM mentor_meetings WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("presentation_slots")) optional.presentationSlots = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM presentation_slots WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("exports")) optional.exports = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM exports WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("export_artifacts")) optional.exportArtifacts = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM export_artifacts WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("submission_versions")) optional.submissionVersions = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM submission_versions WHERE id LIKE 'demo-%';"));

  const secondarySiteCounts = await siteStudentCounts(adapter, DEMO_SITES.filter((site) => !site.primary).map((site) => site.id));
  const storyBuckets = await storyBucketCounts(adapter);
  const secondaryCountsOk = Object.values(secondarySiteCounts).every((count) => count >= 40 && count <= 75);
  const storyBucketsOk = STORY_BUCKETS.every((bucket) => Number(storyBuckets[bucket.id]?.count || 0) >= bucket.count);

  if (
    summary.demoStudents !== 370
    || summary.primarySiteStudents !== 250
    || !secondaryCountsOk
    || summary.demoProgramTeachers < PROGRAMS.length + 10
    || summary.demoMentors !== 64
    || summary.demoAdmins !== 2
    || summary.mentorAssignments !== 320
    || summary.studentsWithMentors !== 320
    || summary.studentsWithoutMentors !== 50
    || summary.demoTenantRows !== 1
    || summary.demoSites !== 3
    || summary.primarySitePrograms !== PROGRAMS.length
    || summary.primaryAvailablePrograms < DEMO_ADDABLE_PROGRAMS.length
    || summary.globalAdmins !== 2
    || summary.administrationUsers !== 1
    || summary.siteAdmins !== 3
    || summary.viewers !== 1
    || summary.viewerStudentAssignments !== 3
    || summary.studentCredentials !== 0
    || summary.studentRosterProfiles !== 370
    || summary.announcements !== 0
    || !storyBucketsOk
    || summary.forbiddenDemoRealDomainRows !== 0
    || summary.unsafeDemoEvidenceRows !== 0
    || summary.unsafeDemoExportDriveRows !== 0
    || summary.foreignKeyViolations !== 0
  ) {
    throw new DemoSeedError("REMOTE_SEED_VERIFY_FAILED", "Remote demo seed verification failed.", { summary, optional });
  }

  const programRows = await adapter.query(
    `SELECT programs.name, COUNT(DISTINCT gm.user_id) AS count
     FROM programs
     LEFT JOIN groups g ON g.program_id = programs.id
     LEFT JOIN group_memberships gm ON gm.group_id = g.id
     LEFT JOIN user_accounts u ON u.id = gm.user_id
     WHERE u.email_norm LIKE '%@demo-student.capstone.test'
     GROUP BY programs.id, programs.name
     ORDER BY programs.name;`,
  );
  const stageRows = await adapter.query(
    `SELECT COALESCE(s.status, 'not_started') AS status, COUNT(*) AS count
     FROM user_accounts u
     JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student'
     LEFT JOIN submissions s ON s.student_id = u.id
     WHERE u.email_norm LIKE '%@demo-student.capstone.test'
     GROUP BY COALESCE(s.status, 'not_started')
     ORDER BY status;`,
  );
  return {
    ...summary,
    ...optional,
    secondarySiteCounts,
    storyBuckets,
    programDistribution: Object.fromEntries(programRows.map((row) => [row.name, Number(row.count || 0)])),
    submissionStatusDistribution: Object.fromEntries(stageRows.map((row) => [row.status, Number(row.count || 0)])),
    demoMarker: DEMO_MARKER,
  };
}

function writeRemoteCredentialFile({ repoRoot, credentials, now = new Date(), assertIgnored = assertGitIgnored }) {
  const file = path.join(repoRoot, ".secrets", `demo-remote-staff-logins-${timestampForFile(now)}.json`);
  assertSecretPath(repoRoot, file);
  assertIgnored(repoRoot, ".secrets/");
  assertIgnored(repoRoot, path.relative(repoRoot, file));
  mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    kind: "remote_demo_staff_logins",
    generatedAt: now.toISOString(),
    warning: "Ignored remote demo staff credentials. Do not commit, print, paste, screenshot, or move this file outside .secrets/.",
    remoteDemoOnly: true,
    syntheticOnly: true,
    noRealStudentData: true,
    studentCredentialsCreated: false,
    suggestedDemoUrl: DEFAULT_REMOTE_DEMO_URL,
    adminLogins: credentials.adminLogins,
    personaLogins: credentials.personaLogins || [],
    programTeacherLogins: credentials.programTeacherLogins,
    mentorLogins: credentials.mentorLogins,
    sampleStudentLogins: [],
  };
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return path.relative(repoRoot, file).replaceAll("\\", "/");
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

function normalizeBatchResultRows(payload) {
  const results = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.result)
      ? payload.result
      : [payload?.result || payload];
  return results.map((item) => {
    if (item?.success === false) throw new DemoSeedError("REMOTE_D1_QUERY_FAILED", "One remote D1 batch query failed.");
    return item?.results || [];
  });
}

function assertSecretPath(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new DemoSeedError("SECRET_PATH_UNSAFE", "Remote demo credential output must stay inside the repo .secrets folder.");
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
    throw new DemoSeedError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function timestampForFile(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function sqlString(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function quoteIdent(value) {
  const text = String(value || "");
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    throw new DemoSeedError("UNSAFE_IDENTIFIER", `Unsafe SQL identifier: ${text}`);
  }
  return `"${text}"`;
}

function realDomainWhere(column) {
  return FORBIDDEN_REAL_DOMAIN_PATTERNS.map((pattern) => `${column} LIKE ${sqlString(pattern)}`).join(" OR ");
}

function firstCount(rows) {
  return Number(rows?.[0]?.count || 0);
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function redact(value) {
  let output = String(value || "")
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"')
    .replace(/"workingPassword"\s*:\s*"[^"]+"/gi, '"workingPassword":"[REDACTED]"')
    .replace(/"password_hash"\s*:\s*"[^"]+"/gi, '"password_hash":"[REDACTED]"')
    .replace(/"password_salt"\s*:\s*"[^"]+"/gi, '"password_salt":"[REDACTED]"')
    .replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"[REDACTED]"')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[REDACTED_ID]");
  for (const secret of [process.env.CLOUDFLARE_API_TOKEN, process.env.CLOUDFLARE_ACCOUNT_ID, readConfiguredCloudflareAccountId()].filter(Boolean)) {
    output = output.split(secret).join("[REDACTED]");
  }
  return output;
}

function redactErrorDetails(details) {
  return JSON.parse(redact(JSON.stringify(details || {})));
}

function readConfiguredCloudflareAccountId(repoRoot = REPO_ROOT) {
  try {
    const checker = readFileSync(path.join(repoRoot, "scripts", "check-cloudflare.mjs"), "utf8");
    const match = checker.match(/\baccountId:\s*"([^"]+)"/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

export {
  CONFIRMATION,
  DEFAULT_REMOTE_SEED,
  RemoteWranglerD1Adapter,
  parseArgs,
  runRemoteDemoSeed,
  verifyRemoteSeedState,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs();
    const result = await runRemoteDemoSeed(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof DemoSeedError) {
      console.error(`Remote demo seed failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactErrorDetails(error.details))}`);
      }
    } else {
      console.error(`Remote demo seed failed: UNKNOWN: ${error instanceof Error ? redact(error.message) : redact(String(error))}`);
    }
    process.exit(1);
  }
}
