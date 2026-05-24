#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEMO_TENANT_ID,
  DemoSeedError,
  STAFF_DOMAIN,
  STUDENT_DOMAIN,
  assertRepoIdentity,
  introspectSchema,
} from "./seed-local-demo-workspace.mjs";
import { RemoteWranglerD1Adapter } from "./seed-remote-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const REQUIRED_TABLES = Object.freeze(["sites", "site_users", "site_programs"]);
const REQUIRED_ROLES = Object.freeze(["platform_admin", "org_admin", "site_admin", "viewer"]);
const SANDBOX_SITE_ID = "site-capstone-sandbox-main";
const READY_STATUS = "REMOTE_MIGRATION_0011_ALREADY_PRESENT";
const MISSING_STATUS = "REMOTE_MIGRATION_0011_NOT_APPLIED_SAFETY_STOP";
const READ_ACCESS_STATUS = "REMOTE_MIGRATION_0011_READ_ACCESS_REQUIRED";
const SEED_MISSING_STATUS = "HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING";
const READY_FAKE_DATA_BROWSER_PENDING = "HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING";

function parseArgs(values = process.argv.slice(2)) {
  for (const value of values) {
    if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/prove-remote-migration-0011.mjs");
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${value}`);
  }
  return {};
}

async function runRemoteMigration0011Proof(_args = {}, options = {}) {
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  const adapter = options.adapter || new RemoteWranglerD1Adapter({ repoRoot, env: options.env || process.env });
  const wranglerPresent = existsSync(path.join(repoRoot, "node_modules", "wrangler", "bin", "wrangler.js"));
  const tokenPresent = Boolean(String((options.env || process.env).CLOUDFLARE_API_TOKEN || "").trim());
  if (!wranglerPresent || !tokenPresent) {
    return {
      ok: true,
      proof: "remote_migration_0011",
      status: READ_ACCESS_STATUS,
      repo,
      reason: wranglerPresent
        ? "CLOUDFLARE_API_TOKEN is required for read-only remote D1 schema proof."
        : "Local Wrangler CLI is required for read-only remote D1 schema proof.",
      readOnly: true,
      remoteWritesPerformed: false,
      remoteSeedPerformed: false,
      deployPerformed: false,
    };
  }

  try {
    const schema = await introspectSchema(adapter);
    const missingTables = REQUIRED_TABLES.filter((table) => !schema.tableNames.has(table));
    const roleRows = schema.tableNames.has("roles")
      ? await adapter.query(`SELECT id FROM roles WHERE id IN (${REQUIRED_ROLES.map(sqlString).join(", ")}) ORDER BY id;`)
      : [];
    const roleIds = new Set(roleRows.map((row) => row.id));
    const missingRoles = REQUIRED_ROLES.filter((role) => !roleIds.has(role));
    if (missingTables.length > 0 || missingRoles.length > 0) {
      return {
        ok: true,
        proof: "remote_migration_0011",
        status: MISSING_STATUS,
        repo,
        remoteSchema0011Ready: false,
        missingTables,
        missingRoles,
        readOnly: true,
        remoteWritesPerformed: false,
        remoteSeedPerformed: false,
        deployPerformed: false,
        nextGate: "13B_remote_migration_0011_fix.txt",
      };
    }

    const [sandboxRows, siteProgramRows, activeProgramRows, duplicateRoleRows, foreignKeyRows] = await adapter.queryBatch([
      `SELECT id, tenant_id, status, school_year FROM sites WHERE id = ${sqlString(SANDBOX_SITE_ID)};`,
      `SELECT COUNT(*) AS count FROM site_programs WHERE site_id = ${sqlString(SANDBOX_SITE_ID)} AND active = 1;`,
      "SELECT COUNT(*) AS count FROM programs WHERE active = 1;",
      "SELECT id, COUNT(*) AS count FROM roles GROUP BY id HAVING COUNT(*) > 1;",
      "PRAGMA foreign_key_check;",
    ]);
    const remoteDemoSeed = await readRemoteDemoSeedSummary(adapter, schema);
    const activePrograms = firstCount(activeProgramRows);
    const sandboxSitePrograms = firstCount(siteProgramRows);
    const schemaReady = sandboxRows.length === 1
      && sandboxRows[0].status === "active"
      && sandboxSitePrograms === activePrograms
      && activePrograms > 0
      && duplicateRoleRows.length === 0
      && foreignKeyRows.length === 0;

    return {
      ok: true,
      proof: "remote_migration_0011",
      status: schemaReady ? READY_STATUS : MISSING_STATUS,
      repo,
      remoteSchema0011Ready: schemaReady,
      tables: Object.fromEntries(REQUIRED_TABLES.map((table) => [table, true])),
      roles: roleRows.map((row) => row.id),
      sandboxSite: sandboxRows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        status: row.status,
        schoolYear: row.school_year,
      })),
      sandboxSitePrograms,
      activePrograms,
      duplicateRoleIds: duplicateRoleRows.length,
      foreignKeyViolations: foreignKeyRows.length,
      remoteDemoSeedStatus: remoteDemoSeed.present ? "REMOTE_DEMO_SEED_PRESENT" : "REMOTE_DEMO_SEED_NOT_RUN",
      hostedProofStatus: remoteDemoSeed.present
        ? READY_FAKE_DATA_BROWSER_PENDING
        : SEED_MISSING_STATUS,
      remoteDemoSeed,
      readOnly: true,
      remoteWritesPerformed: false,
      remoteSeedPerformed: false,
      deployPerformed: false,
      nextGate: remoteDemoSeed.present
        ? "14_hosted_browser_proof_and_screenshot_gate.txt"
        : "13C_remote_demo_seed_gate.txt",
    };
  } catch (error) {
    return {
      ok: true,
      proof: "remote_migration_0011",
      status: READ_ACCESS_STATUS,
      repo,
      reason: error instanceof DemoSeedError || error instanceof Error ? error.message : String(error),
      classification: error?.classification || READ_ACCESS_STATUS,
      readOnly: true,
      remoteWritesPerformed: false,
      remoteSeedPerformed: false,
      deployPerformed: false,
    };
  }
}

async function readRemoteDemoSeedSummary(adapter, schema) {
  const requiredSeedTables = ["tenants", "user_accounts", "user_roles", "sites", "site_users"];
  const missingSeedTables = requiredSeedTables.filter((table) => !schema.tableNames.has(table));
  if (missingSeedTables.length > 0) {
    return {
      present: false,
      missingSeedTables,
      summary: {
        demoTenantRows: 0,
        demoStudents: 0,
        demoStaff: 0,
        demoSites: 0,
        demoSiteStudentMemberships: 0,
      },
    };
  }
  const [tenantRows, studentRows, staffRows, siteRows, siteUserRows] = await adapter.queryBatch([
    `SELECT COUNT(*) AS count FROM tenants WHERE id = ${sqlString(DEMO_TENANT_ID)};`,
    `SELECT COUNT(*) AS count
     FROM user_accounts u
     JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student'
     WHERE u.email_norm LIKE ${sqlString(`%@${STUDENT_DOMAIN}`)};`,
    `SELECT COUNT(*) AS count
     FROM user_accounts u
     JOIN user_roles r ON r.user_id = u.id
     WHERE u.email_norm LIKE ${sqlString(`%@${STAFF_DOMAIN}`)}
       AND r.role_id IN ('admin', 'platform_admin', 'org_admin', 'site_admin', 'viewer', 'program_teacher', 'mentor');`,
    `SELECT COUNT(*) AS count FROM sites WHERE tenant_id = ${sqlString(DEMO_TENANT_ID)} AND status = 'active';`,
    `SELECT COUNT(DISTINCT su.user_id) AS count
     FROM site_users su
     JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE ${sqlString(`%@${STUDENT_DOMAIN}`)}
     JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
     WHERE su.membership_status = 'active';`,
  ]);
  const summary = {
    demoTenantRows: firstCount(tenantRows),
    demoStudents: firstCount(studentRows),
    demoStaff: firstCount(staffRows),
    demoSites: firstCount(siteRows),
    demoSiteStudentMemberships: firstCount(siteUserRows),
  };
  return {
    present: summary.demoTenantRows === 1
      && summary.demoStudents >= 370
      && summary.demoStaff > 0
      && summary.demoSites >= 3
      && summary.demoSiteStudentMemberships >= 370,
    missingSeedTables: [],
    summary,
  };
}

function firstCount(rows) {
  return Number(rows?.[0]?.count || 0);
}

function sqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runRemoteMigration0011Proof(parseArgs());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Remote migration 0011 proof failed before read-only gate: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export {
  MISSING_STATUS,
  READ_ACCESS_STATUS,
  READY_STATUS,
  SEED_MISSING_STATUS,
  parseArgs,
  runRemoteMigration0011Proof,
};
