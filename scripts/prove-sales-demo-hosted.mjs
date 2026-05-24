#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DemoSeedError,
  DEMO_TENANT_ID,
  STAFF_DOMAIN,
  STUDENT_DOMAIN,
  assertRepoIdentity,
  introspectSchema,
} from "./seed-local-demo-workspace.mjs";
import { RemoteWranglerD1Adapter } from "./seed-remote-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const REQUIRED_0011_TABLES = Object.freeze(["sites", "site_users", "site_programs"]);
const REQUIRED_0011_ROLES = Object.freeze(["platform_admin", "org_admin", "site_admin", "viewer"]);
const BLOCKED_MISSING_0011 = "HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011";
const BLOCKED_REMOTE_SEED = "HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING";
const BLOCKED_READ_ACCESS = "HOSTED_PROOF_BLOCKED_REMOTE_D1_READ_ACCESS_REQUIRED";
const READY_FAKE_DATA_BROWSER_PENDING = "HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING";
const PHASE_14_BROWSER_MANIFEST = "docs/progress/runs/2026-05-24-hosted-browser-proof-screenshot-gate.json";

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    baseUrl: process.env.WORKSPACE_SMOKE_BASE_URL || "https://senior-capstone-app.pages.dev",
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--base-url") {
      parsed.baseUrl = values[index + 1] || "";
      index += 1;
    } else if (value === "--local") {
      throw new Error("Hosted sales demo proof is read-only remote proof and refuses --local.");
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/prove-sales-demo-hosted.mjs [--base-url https://senior-capstone-app.pages.dev]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return parsed;
}

async function runHostedSalesDemoProof(args = {}, options = {}) {
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  const adapter = options.adapter || new RemoteWranglerD1Adapter({ repoRoot, env: options.env || process.env });
  const baseUrl = new URL(args.baseUrl || "https://senior-capstone-app.pages.dev").origin;
  const wranglerPresent = existsSync(path.join(repoRoot, "node_modules", "wrangler", "bin", "wrangler.js"));
  const tokenPresent = Boolean(String((options.env || process.env).CLOUDFLARE_API_TOKEN || "").trim());

  if (!wranglerPresent || !tokenPresent) {
    return blockedOutput({
      repo,
      baseUrl,
      status: BLOCKED_READ_ACCESS,
      reason: wranglerPresent
        ? "CLOUDFLARE_API_TOKEN is required for read-only remote D1 schema proof."
        : "Local Wrangler CLI is required for read-only remote D1 schema proof.",
      readOnly: true,
    });
  }

  try {
    const schema = await introspectSchema(adapter);
    const missingTables = REQUIRED_0011_TABLES.filter((table) => !schema.tableNames.has(table));
    const roleRows = schema.tableNames.has("roles")
      ? await adapter.query(`SELECT id FROM roles WHERE id IN (${REQUIRED_0011_ROLES.map((role) => `'${role}'`).join(", ")}) ORDER BY id;`)
      : [];
    const roleIds = new Set(roleRows.map((row) => row.id));
    const missingRoles = REQUIRED_0011_ROLES.filter((role) => !roleIds.has(role));

    if (missingTables.length > 0 || missingRoles.length > 0) {
      return blockedOutput({
        repo,
        baseUrl,
        status: BLOCKED_MISSING_0011,
        reason: "Remote D1 does not have the full migration 0011 multisite site/role foundation.",
        missingTables,
        missingRoles,
        readOnly: true,
      });
    }

    const remoteDemoSeed = await readRemoteDemoSeedSummary(adapter, schema);
    if (!remoteDemoSeed.present) {
      return {
        ok: true,
        proof: "sales_demo_hosted",
        hostedProofPassed: false,
        hostedProofStatus: BLOCKED_REMOTE_SEED,
        claimStatus: "Hosted proof blocked",
        repo,
        baseUrl,
        reason: "Remote D1 has migration 0011, but the approved remote fake-data demo seed/proof has not been run.",
        remoteSchema0011Ready: true,
        remoteDemoSeedPresent: false,
        remoteDemoSeed,
        remoteWritesPerformed: false,
        remoteSeedPerformed: false,
        deployPerformed: false,
        nextGate: "13C_remote_demo_seed_gate.txt",
      };
    }

    const browserProof = readHostedBrowserProofSummary(repoRoot);
    const hostedProofStatus = browserProof.browserProofGenerated
      ? browserProof.browserProofStatus
      : READY_FAKE_DATA_BROWSER_PENDING;
    const blockedBrowserProof = /_BLOCKED_/i.test(hostedProofStatus);

    return {
      ok: true,
      proof: "sales_demo_hosted",
      hostedProofPassed: !blockedBrowserProof,
      hostedApiDataProofPassed: true,
      hostedProofStatus,
      claimStatus: browserProof.browserProofGenerated
        ? browserProof.claimStatus
        : "Hosted fake-data proof ready; browser proof pending",
      repo,
      baseUrl,
      remoteSchema0011Ready: true,
      remoteDemoSeedPresent: true,
      remoteDemoSeed,
      browserProofGenerated: browserProof.browserProofGenerated,
      screenshotProofGenerated: browserProof.screenshotProofGenerated,
      credentialPathStatus: browserProof.credentialPathStatus,
      screenshotStatus: browserProof.screenshotStatus,
      browserProofCaveats: browserProof.caveats,
      remoteWritesPerformed: false,
      remoteSeedPerformed: false,
      deployPerformed: false,
      nextGate: browserProof.nextGate,
    };
  } catch (error) {
    if (error instanceof DemoSeedError) {
      return blockedOutput({
        repo,
        baseUrl,
        status: BLOCKED_READ_ACCESS,
        reason: error.message,
        classification: error.classification,
        readOnly: true,
      });
    }
    return blockedOutput({
      repo,
      baseUrl,
      status: BLOCKED_READ_ACCESS,
      reason: error instanceof Error ? error.message : String(error),
      classification: "REMOTE_D1_READ_CHECK_FAILED",
      readOnly: true,
    });
  }
}

function readHostedBrowserProofSummary(repoRoot) {
  const manifestPath = path.join(repoRoot, PHASE_14_BROWSER_MANIFEST);
  if (!existsSync(manifestPath)) {
    return {
      browserProofGenerated: false,
      screenshotProofGenerated: false,
      browserProofStatus: READY_FAKE_DATA_BROWSER_PENDING,
      credentialPathStatus: "BROWSER_PROOF_SKIPPED_NO_SAFE_CREDENTIAL_PATH",
      screenshotStatus: "SCREENSHOTS_NOT_GENERATED_NOT_REQUESTED",
      claimStatus: "Hosted fake-data proof ready; browser proof pending",
      caveats: [],
      nextGate: "14_hosted_browser_proof_and_screenshot_gate.txt",
    };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""));
  const browserProofStatus = manifest.browserProofResults?.status
    || manifest.browserProofStatus
    || READY_FAKE_DATA_BROWSER_PENDING;
  const screenshotStatus = manifest.screenshotHygiene?.status
    || manifest.screenshotStatus
    || "SCREENSHOTS_NOT_GENERATED_NOT_REQUESTED";
  const screenshotFiles = Array.isArray(manifest.screenshotsGenerated?.files)
    ? manifest.screenshotsGenerated.files
    : [];
  const missingScreenshots = screenshotFiles.filter((file) => !existsSync(path.join(repoRoot, file)));
  const screenshotProofGenerated = screenshotStatus === "SCREENSHOTS_GENERATED_SAFE"
    && screenshotFiles.length > 0
    && missingScreenshots.length === 0;
  const browserProofGenerated = browserProofStatus !== READY_FAKE_DATA_BROWSER_PENDING;

  return {
    browserProofGenerated,
    screenshotProofGenerated,
    browserProofStatus,
    credentialPathStatus: manifest.credentialPathStatus || "BROWSER_PROOF_SKIPPED_NO_SAFE_CREDENTIAL_PATH",
    screenshotStatus,
    claimStatus: browserProofStatus === "HOSTED_BROWSER_PROOF_READY"
      ? "Hosted browser proof ready"
      : browserProofStatus === "HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS"
        ? "Hosted browser proof ready with caveats"
        : "Hosted browser proof blocked or pending",
    caveats: [
      ...(Array.isArray(manifest.blockers) ? manifest.blockers : []),
      ...missingScreenshots.map((file) => `Missing screenshot artifact: ${file}`),
    ],
    nextGate: manifest.nextRecommendedPrompt || "14_hosted_browser_proof_and_screenshot_gate.txt",
  };
}

function blockedOutput({ repo, baseUrl, status, reason, missingTables = [], missingRoles = [], classification = status, readOnly = true }) {
  return {
    ok: true,
    proof: "sales_demo_hosted",
    hostedProofPassed: false,
    hostedProofStatus: status,
    claimStatus: "Hosted proof blocked",
    repo,
    baseUrl,
    reason,
    classification,
    remoteSchema0011Ready: false,
    missingTables,
    missingRoles,
    remoteWritesPerformed: false,
    remoteSeedPerformed: false,
    deployPerformed: false,
    readOnly,
    nextGate: "13B_remote_migration_0011_gate.txt",
  };
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
    const result = await runHostedSalesDemoProof(parseArgs());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Sales demo hosted proof failed before read-only gate: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export {
  BLOCKED_MISSING_0011,
  BLOCKED_REMOTE_SEED,
  BLOCKED_READ_ACCESS,
  READY_FAKE_DATA_BROWSER_PENDING,
  readHostedBrowserProofSummary,
  parseArgs,
  runHostedSalesDemoProof,
};
