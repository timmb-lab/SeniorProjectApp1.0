#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DemoSeedError,
  assertRepoIdentity,
  introspectSchema,
} from "./seed-local-demo-workspace.mjs";
import { RemoteWranglerD1Adapter } from "./seed-remote-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const REQUIRED_0011_TABLES = Object.freeze(["sites", "site_users", "site_programs"]);
const REQUIRED_0011_ROLES = Object.freeze(["platform_admin", "org_admin", "site_admin", "viewer"]);
const BLOCKED_MISSING_0011 = "HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011";
const BLOCKED_READ_ACCESS = "HOSTED_PROOF_BLOCKED_REMOTE_D1_READ_ACCESS_REQUIRED";

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

    return {
      ok: true,
      proof: "sales_demo_hosted",
      hostedProofPassed: false,
      hostedProofStatus: "HOSTED_PROOF_SCHEMA_READY_REMOTE_SEED_AND_BROWSER_PROOF_STILL_REQUIRED",
      claimStatus: "Hosted proof blocked",
      repo,
      baseUrl,
      remoteSchema0011Ready: true,
      remoteWritesPerformed: false,
      remoteSeedPerformed: false,
      deployPerformed: false,
      nextGate: "Run an explicitly approved remote fake-data seed/proof phase before claiming hosted demo readiness.",
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
  BLOCKED_READ_ACCESS,
  parseArgs,
  runHostedSalesDemoProof,
};
