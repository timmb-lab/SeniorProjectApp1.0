#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const EXPECTED = {
  accountId: "539e8f7c55e7b1472013626ad72f4c7f",
  projectName: "senior-capstone-app",
  pagesOutputDir: ".",
  d1Binding: "DB",
  d1DatabaseName: "senior-capstone-db",
  d1DatabaseId: "3141d9ac-08b7-49c1-92ba-bbf50c1a611f",
  migrationsDir: "./migrations",
  foundationMigration: "0001_foundation.sql",
};

const args = new Set(process.argv.slice(2));
const liveRequired = args.has("--live-required");
const liveRequested = liveRequired || args.has("--live");
const staticOnly = args.has("--static-only");
const repoRoot = process.cwd();
const failures = [];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
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

function readJsonc(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  const raw = readFileSync(fullPath, "utf8");
  return { raw, data: JSON.parse(stripJsonComments(raw)) };
}

function configuredSecretValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized
      && !normalized.startsWith("pending")
      && !normalized.startsWith("replace-with")
      && normalized !== "undefined"
      && normalized !== "null",
  );
}

function collectSecretFindings(value, location = "wrangler.jsonc") {
  if (!isRecord(value)) return [];

  const findings = [];
  const secretKeyPattern = /(secret|token|password|pepper|private_key|client_secret|credential)/i;
  for (const [key, property] of Object.entries(value)) {
    const propertyPath = `${location}.${key}`;
    if (secretKeyPattern.test(key) && configuredSecretValue(property)) {
      findings.push(propertyPath);
    }
    if (isRecord(property)) {
      findings.push(...collectSecretFindings(property, propertyPath));
    } else if (Array.isArray(property)) {
      for (const [index, item] of property.entries()) {
        findings.push(...collectSecretFindings(item, `${propertyPath}[${index}]`));
      }
    }
  }
  return findings;
}

function check(condition, message) {
  if (condition) {
    console.log(`PASS static: ${message}`);
    return;
  }
  failures.push(message);
  console.error(`FAIL static: ${message}`);
}

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/\/+$/g, "");
}

function stringField(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function collectRecords(value, depth = 0) {
  if (depth > 8) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRecords(item, depth + 1));
  }
  if (!isRecord(value)) return [];
  return [
    value,
    ...Object.values(value).flatMap((item) => collectRecords(item, depth + 1)),
  ];
}

function redactKnownSecrets(text) {
  let sanitized = String(text || "").replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
  const secretValues = [
    process.env.CLOUDFLARE_API_TOKEN,
  ]
    .map((value) => String(value || "").trim())
    .filter((value) => value.length >= 8);

  for (const secret of secretValues) {
    sanitized = sanitized.split(secret).join("[REDACTED]");
  }

  return sanitized;
}

function summarizeCommandOutput(output) {
  return redactKnownSecrets(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/Logs were written/i.test(line))
    .slice(0, 5)
    .join(" | ");
}

function looksLikeGenericHelp(output) {
  return /\bCOMMANDS\b/.test(output)
    && /\bGLOBAL FLAGS\b/.test(output)
    && /^wrangler\b/m.test(output);
}

function extractJson(output) {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error("empty JSON output");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf("{");
    const arrayStart = trimmed.indexOf("[");
    const starts = [objectStart, arrayStart].filter((index) => index >= 0);
    if (starts.length === 0) throw new Error("no JSON object or array found");
    const start = Math.min(...starts);
    const objectEnd = trimmed.lastIndexOf("}");
    const arrayEnd = trimmed.lastIndexOf("]");
    const end = Math.max(objectEnd, arrayEnd);
    if (end <= start) throw new Error("no complete JSON payload found");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function runWrangler(wranglerJs, wranglerArgs, description) {
  const env = { ...process.env, CI: "1" };
  if (!String(env.CLOUDFLARE_ACCOUNT_ID || "").trim() && EXPECTED.accountId) {
    env.CLOUDFLARE_ACCOUNT_ID = EXPECTED.accountId;
  }

  const result = spawnSync(process.execPath, [wranglerJs, ...wranglerArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    env,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if (looksLikeGenericHelp(output)) {
    throw new Error(`${description} returned generic Wrangler help output instead of verification`);
  }
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit ${result.status}: ${summarizeCommandOutput(output)}`);
  }
  return output;
}

function runWranglerJson(wranglerJs, wranglerArgs, description) {
  const output = runWrangler(wranglerJs, wranglerArgs, description);
  try {
    return extractJson(output);
  } catch (error) {
    throw new Error(`${description} did not return parseable JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function findPagesProject(value) {
  return collectRecords(value).find((record) => (
    stringField(record, ["name", "project_name", "projectName", "Project Name"]) === EXPECTED.projectName
  ));
}

function findD1Database(value) {
  return collectRecords(value).find((record) => {
    const name = stringField(record, ["name", "database_name", "databaseName", "Database Name"]);
    const id = stringField(record, ["uuid", "id", "database_id", "databaseId", "Database ID", "Database UUID"]);
    return name === EXPECTED.d1DatabaseName || id === EXPECTED.d1DatabaseId;
  });
}

function verifyD1Identity(record, source) {
  const name = stringField(record, ["name", "database_name", "databaseName", "Database Name"]);
  const id = stringField(record, ["uuid", "id", "database_id", "databaseId", "Database ID", "Database UUID"]);
  if (name && name !== EXPECTED.d1DatabaseName) {
    throw new Error(`${source} returned D1 database name '${name}', expected '${EXPECTED.d1DatabaseName}'`);
  }
  if (id && id !== EXPECTED.d1DatabaseId) {
    throw new Error(`${source} returned D1 database id '${id}', expected '${EXPECTED.d1DatabaseId}'`);
  }
}

function verifyStaticConfig() {
  const wranglerPath = path.join(repoRoot, "wrangler.jsonc");
  check(existsSync(wranglerPath), "wrangler.jsonc exists");
  if (!existsSync(wranglerPath)) return null;

  let parsed;
  try {
    parsed = readJsonc("wrangler.jsonc");
  } catch (error) {
    failures.push(`wrangler.jsonc parses as JSONC: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAIL static: wrangler.jsonc parses as JSONC`);
    return null;
  }

  const { raw, data } = parsed;
  check(data.name === EXPECTED.projectName, `Wrangler project name is ${EXPECTED.projectName}`);
  check(typeof data.compatibility_date === "string" && data.compatibility_date.length > 0, "compatibility_date exists");
  check(data.pages_build_output_dir === EXPECTED.pagesOutputDir, `Pages output directory is ${EXPECTED.pagesOutputDir}`);

  const d1Databases = Array.isArray(data.d1_databases) ? data.d1_databases : [];
  const d1Binding = d1Databases.find((database) => isRecord(database) && database.binding === EXPECTED.d1Binding);
  check(Boolean(d1Binding), `D1 binding ${EXPECTED.d1Binding} exists`);
  if (isRecord(d1Binding)) {
    check(d1Binding.database_name === EXPECTED.d1DatabaseName, `D1 database_name is ${EXPECTED.d1DatabaseName}`);
    check(d1Binding.database_id === EXPECTED.d1DatabaseId, `D1 database_id is ${EXPECTED.d1DatabaseId}`);
    check(normalizePath(d1Binding.migrations_dir) === EXPECTED.migrationsDir, `D1 migrations_dir is ${EXPECTED.migrationsDir}`);
  }

  const migrationsPath = path.join(repoRoot, "migrations");
  check(existsSync(migrationsPath), "migrations directory exists");
  check(existsSync(path.join(migrationsPath, EXPECTED.foundationMigration)), `${EXPECTED.foundationMigration} exists`);

  const secretFindings = collectSecretFindings(data);
  check(secretFindings.length === 0, "wrangler.jsonc has no obvious secret-bearing keys");
  check(!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(raw), "wrangler.jsonc has no PEM private key material");
  check(!/\bCLOUDFLARE_API_TOKEN\b/.test(raw), "wrangler.jsonc does not contain CLOUDFLARE_API_TOKEN");

  if (secretFindings.length > 0) {
    for (const finding of secretFindings) {
      console.error(`Secret-like key found in wrangler config: ${finding}`);
    }
  }

  return data;
}

function verifyWranglerCli() {
  const wranglerJs = path.join(repoRoot, "node_modules", "wrangler", "bin", "wrangler.js");
  check(existsSync(wranglerJs), "local Wrangler CLI is installed");
  if (!existsSync(wranglerJs)) return null;

  try {
    const versionOutput = runWrangler(wranglerJs, ["--version"], "wrangler --version");
    const version = versionOutput.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
    check(/^\d+\.\d+\.\d+/.test(version), `Wrangler version detected (${version || "unknown"})`);
    return { wranglerJs, version };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(message);
    console.error(`FAIL wrangler: ${message}`);
    return null;
  }
}

function cloudflareErrors(data) {
  if (!Array.isArray(data?.errors) || data.errors.length === 0) return "";
  return data.errors
    .map((error) => {
      if (!isRecord(error)) return "";
      const code = error.code ? String(error.code) : "";
      const message = stringField(error, ["message"]);
      return [code, message].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join("; ");
}

async function verifyCloudflareApiToken() {
  const token = String(process.env.CLOUDFLARE_API_TOKEN || "").trim();
  const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Cloudflare token verify returned HTTP ${response.status} with non-JSON output`);
  }

  if (!response.ok || data.success !== true) {
    const errors = cloudflareErrors(data);
    throw new Error(`Cloudflare token verify failed with HTTP ${response.status}${errors ? `: ${errors}` : ""}`);
  }

  const status = stringField(isRecord(data.result) ? data.result : {}, ["status"]);
  if (status && status !== "active") {
    throw new Error(`Cloudflare token verify returned token status '${status}', expected 'active'`);
  }

  console.log("PASS live: Cloudflare API token is valid and active");
}

function classifyLiveFailure(message) {
  if (/Pages project '.+' was not found/i.test(message)) return "PAGES_PROJECT_NOT_VISIBLE";
  if (/D1 database '.+' \(.+\) was not found/i.test(message)) return "D1_DATABASE_NOT_VISIBLE";
  if (/returned D1 database id '.+', expected/i.test(message)) return "D1_DATABASE_ID_MISMATCH";
  if (/pages project list/i.test(message) && /permission|unauthorized|forbidden|not authorized|authentication/i.test(message)) {
    return "MISSING_CLOUDFLARE_PAGES_PERMISSION";
  }
  if (/d1/i.test(message) && /permission|unauthorized|forbidden|not authorized|authentication/i.test(message)) {
    return "MISSING_D1_PERMISSION";
  }
  if (/generic Wrangler help|did not return parseable JSON|returned generic Wrangler help/i.test(message)) {
    return "WRANGLER_PAGES_D1_COMMAND_COMPATIBILITY_ISSUE";
  }
  return "UNKNOWN";
}

async function verifyLiveCloudflare(wranglerJs) {
  console.log("Cloudflare live verification: CLOUDFLARE_API_TOKEN is present; running read-only Pages/D1 checks.");
  await verifyCloudflareApiToken();

  if (!String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim() && EXPECTED.accountId) {
    console.log("INFO live: using configured Cloudflare account id for scoped-token Wrangler checks");
  }

  try {
    runWranglerJson(wranglerJs, ["whoami", "--json"], "wrangler whoami --json");
    console.log("PASS live: Wrangler whoami succeeded");
  } catch (error) {
    const message = redactKnownSecrets(error instanceof Error ? error.message : String(error));
    console.log("WARN live: wrangler whoami failed, but token verify passed; continuing Pages/D1 checks");
    if (/generic Wrangler help|did not return parseable JSON/i.test(message)) {
      console.log(`WARN live: ${message}`);
    }
  }

  const pagesProjects = runWranglerJson(wranglerJs, ["pages", "project", "list", "--json"], "wrangler pages project list --json");
  const pagesProject = findPagesProject(pagesProjects);
  if (!pagesProject) {
    throw new Error(`Pages project '${EXPECTED.projectName}' was not found`);
  }
  console.log(`PASS live: Pages project ${EXPECTED.projectName} exists`);

  const d1List = runWranglerJson(wranglerJs, ["d1", "list", "--json"], "wrangler d1 list --json");
  const d1Database = findD1Database(d1List);
  if (!d1Database) {
    throw new Error(`D1 database '${EXPECTED.d1DatabaseName}' (${EXPECTED.d1DatabaseId}) was not found`);
  }
  verifyD1Identity(d1Database, "wrangler d1 list --json");
  console.log(`PASS live: D1 database ${EXPECTED.d1DatabaseName} exists in list output`);

  const d1Info = runWranglerJson(wranglerJs, ["d1", "info", EXPECTED.d1DatabaseName, "--json"], "wrangler d1 info --json");
  const d1InfoRecord = findD1Database(d1Info) || (isRecord(d1Info) ? d1Info : null);
  if (!d1InfoRecord) {
    throw new Error(`D1 info for '${EXPECTED.d1DatabaseName}' did not include a database record`);
  }
  verifyD1Identity(d1InfoRecord, "wrangler d1 info --json");
  console.log(`PASS live: D1 database ${EXPECTED.d1DatabaseName} identity matches config`);
}

verifyStaticConfig();
const wrangler = verifyWranglerCli();

if (failures.length > 0) {
  console.error(`Cloudflare static verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("Cloudflare static verification passed: Wrangler config, D1 binding, migrations, and local CLI are valid.");
if (wrangler?.version) {
  console.log(`Wrangler version: ${wrangler.version}`);
}

const hasToken = Boolean(process.env.CLOUDFLARE_API_TOKEN);
if (staticOnly) {
  console.log("Cloudflare live verification skipped: --static-only was requested.");
  process.exit(0);
}

if (!liveRequested) {
  console.log("Cloudflare live verification skipped: static check only. Run check:cloudflare:live for read-only Pages/D1 verification.");
  process.exit(0);
}

if (!hasToken) {
  const message = "LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN: Cloudflare live verification blocked because CLOUDFLARE_API_TOKEN is not set. GitHub-connected Pages deployment may still run after pushes, but this local Codex/Wrangler session cannot inspect remote Pages/D1 state without Cloudflare API auth. Static Wrangler configuration passed; live Pages/D1 existence was not verified.";
  if (liveRequired) {
    console.error(message);
    process.exit(1);
  }
  console.log(message);
  process.exit(0);
}

try {
  await verifyLiveCloudflare(wrangler.wranglerJs);
  console.log("Cloudflare live verification passed: Pages project and D1 database were verified read-only.");
} catch (error) {
  const message = redactKnownSecrets(error instanceof Error ? error.message : String(error));
  console.error(`Cloudflare live verification failed: ${classifyLiveFailure(message)}: ${message}`);
  process.exit(1);
}
