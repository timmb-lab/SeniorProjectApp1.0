#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  realpathSync,
  statSync,
} from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_VERSION = "1.0.0";
const STATE_SCHEMA_VERSION = 1;
const PROJECT_LOCK_RELATIVE = "automation/qol/project-lock.json";
const ORCHESTRATOR_RELATIVE_PATH = "automation/qol/hourly-orchestrator.mjs";
const INVOCATION_ADAPTER_RELATIVE_PATH = "scripts/run-automation.ps1";
const NPM_ADAPTER_RELATIVE_PATH = "scripts/run-npm-script.ps1";
const GUI_ALLOWED_COMMAND_DOC_RELATIVE = "automation/qol/GUI_ALLOWED_COMMANDS.md";
const SCHEDULED_GUI_CANARY_RELATIVE = "automation/qol/SCHEDULED_GUI_CANARY.md";
const FIGMA_ORCHESTRATOR_RELATIVE_PATH = "automation/figma/hourly-figma-orchestrator.mjs";
const FIGMA_REPORT_RELATIVE_PATH = "automation/figma/reports/latest.md";
const DEFAULT_REGISTRY_EVIDENCE_RELATIVE = "automation/qol/state/automation-registry-evidence.json";
const EXPECTED_GUI_DOCTOR_COMMAND =
  "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-automation.ps1 qol:hourly";
const EXPECTED_GUI_ORCHESTRATOR_COMMAND =
  "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\\scripts\\run-automation.ps1 qol:hourly";
const SCHEDULED_GUI_CANARY_PENDING = "PENDING_NEXT_TOP_OF_HOUR";
const DEFAULT_MAX_TOTAL_RUNTIME_MS = 8 * 60 * 1000;
const DEFAULT_COMMAND_TIMEOUT_MS = 60 * 1000;
const DEFAULT_STALE_LOCK_MS = 90 * 60 * 1000;
const DEFAULT_RUN_HISTORY_LIMIT = 80;
const DEFAULT_REPORT_LIMIT = 120;
const DEFAULT_LOG_LIMIT = 120;
const EXIT_CODES = {
  ok: 0,
  alreadyRunning: 0,
  wrongProject: 20,
  preflightFailed: 21,
  runFailed: 1,
};

const SAFE_STATUSES = new Set([
  "pending",
  "ready",
  "running",
  "blocked",
  "skipped",
  "completed",
  "recurring",
  "needs-review",
  "failed",
  "deferred",
]);

const CATEGORY_COMMANDS = new Map([
  [
    "backend-security-data",
    {
      label: "account seed test",
      command: process.execPath,
      args: ["--test", "tests/test-account-seed.test.mjs"],
      requiredFiles: ["tests/test-account-seed.test.mjs"],
    },
  ],
  [
    "student-workflow-evidence",
    {
      label: "alpha flow test",
      command: process.execPath,
      args: ["--test", "tests/alpha-flow.test.mjs"],
      requiredFiles: ["tests/alpha-flow.test.mjs"],
    },
  ],
  [
    "staff-review-mentor",
    {
      label: "alpha flow test",
      command: process.execPath,
      args: ["--test", "tests/alpha-flow.test.mjs"],
      requiredFiles: ["tests/alpha-flow.test.mjs"],
    },
  ],
  [
    "admin-ops-reporting",
    {
      label: "account seed test",
      command: process.execPath,
      args: ["--test", "tests/test-account-seed.test.mjs"],
      requiredFiles: ["tests/test-account-seed.test.mjs"],
    },
  ],
  [
    "deployment-qa",
    {
      label: "alpha syntax check",
      command: process.execPath,
      args: ["--check", "alpha.js"],
      requiredFiles: ["alpha.js"],
    },
  ],
]);

const PLAN_DERIVED_QOL_SECTIONS = [
  "Hourly Master-Plan Orchestrator",
  "Logging Requirements",
  "Anti-Drift Rules",
  "Master Source Order",
];

const HIGH_RISK_IDS = new Map([
  ["MVP-006", 120],
  ["MVP-014", 120],
  ["MVP-013", 110],
  ["MVP-009", 105],
  ["MVP-015", 95],
  ["MVP-016", 95],
  ["MVP-017", 95],
  ["MVP-018", 95],
  ["MVP-004", 90],
  ["MVP-026", 85],
]);

const RECURRING_IDS = new Set([
  "MVP-001",
  "MVP-003",
  "MVP-025",
  "MVP-026",
  "MVP-027",
  "MVP-030",
  "QOL-HOURLY-MASTER-PLAN-ORCHESTRATOR",
  "QOL-LOGGING-REQUIREMENTS",
  "QOL-ANTI-DRIFT-RULES",
  "QOL-MASTER-SOURCE-ORDER",
]);

const LEGACY_SENIOR_CAPSTONE_AUTOMATION_IDS = new Set([
  "senior-capstone-public-site-refresh",
  "senior-capstone-weekly-script-audit",
  "senior-capstone-qol-source-framework-seed-2",
  "senior-capstone-qol-source-framework-seed-slot-2",
  "senior-capstone-qol-source-framework-seed-slot-3",
  "senior-capstone-qol-drive-upload-oauth-2",
  "senior-capstone-qol-drive-upload-oauth-slot-2",
  "senior-capstone-qol-drive-upload-oauth-slot-3",
  "senior-capstone-qol-protected-evidence-tests-2",
  "senior-capstone-qol-protected-evidence-tests-slot-2",
  "senior-capstone-qol-protected-evidence-tests-slot-3",
  "senior-capstone-qol-teacher-review-endpoints-2",
  "senior-capstone-qol-teacher-review-endpoints-slot-2",
  "senior-capstone-qol-teacher-review-endpoints-slot-3",
  "senior-capstone-qol-immutable-review-history-2",
  "senior-capstone-qol-immutable-review-history-slot-2",
  "senior-capstone-qol-immutable-review-history-slot-3",
  "senior-capstone-qol-mentor-presentation-flow-2",
  "senior-capstone-qol-mentor-presentation-flow-slot-2",
  "senior-capstone-qol-mentor-presentation-flow-slot-3",
  "senior-capstone-qol-admin-ops-endpoints-2",
  "senior-capstone-qol-admin-ops-endpoints-slot-2",
  "senior-capstone-qol-admin-ops-endpoints-slot-3",
  "senior-capstone-qol-announcements-2",
  "senior-capstone-qol-announcements-slot-2",
  "senior-capstone-qol-announcements-slot-3",
  "senior-capstone-qol-account-lifecycle-2",
  "senior-capstone-qol-account-lifecycle-slot-2",
  "senior-capstone-qol-account-lifecycle-slot-3",
  "senior-capstone-qol-cloudflare-verification-2",
  "senior-capstone-qol-cloudflare-verification-slot-2",
  "senior-capstone-qol-cloudflare-verification-slot-3",
]);

function getProjectRootFromScript() {
  const scriptPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptPath), "..", "..");
}

function normalizePathForCompare(value) {
  const normalized = path.resolve(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isInsidePath(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function assertInsideProjectRoot(projectRoot, candidatePath, options = {}) {
  const resolved = path.isAbsolute(candidatePath)
    ? path.resolve(candidatePath)
    : path.resolve(projectRoot, candidatePath);
  if (!isInsidePath(projectRoot, resolved)) {
    throw new Error(`Path escapes project root: ${candidatePath}`);
  }

  if (existsSync(resolved)) {
    const realRoot = realpathSync.native(projectRoot);
    const realCandidate = realpathSync.native(resolved);
    if (!isInsidePath(realRoot, realCandidate)) {
      throw new Error(`Real path escapes project root: ${candidatePath}`);
    }
  } else if (options.mustExist) {
    throw new Error(`Required project-local path is missing: ${candidatePath}`);
  } else {
    const parent = path.dirname(resolved);
    if (existsSync(parent)) {
      const realRoot = realpathSync.native(projectRoot);
      const realParent = realpathSync.native(parent);
      if (!isInsidePath(realRoot, realParent)) {
        throw new Error(`Parent path escapes project root: ${candidatePath}`);
      }
    }
  }

  return resolved;
}

function safeJoin(projectRoot, ...segments) {
  return assertInsideProjectRoot(projectRoot, path.join(...segments));
}

async function readText(projectRoot, relativePath) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath, { mustExist: true });
  return fs.readFile(absolutePath, "utf8");
}

function stripJsonComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

async function readJson(projectRoot, relativePath) {
  const text = await readText(projectRoot, relativePath);
  return JSON.parse(stripJsonComments(text));
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function makeRunId(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const suffix = crypto.randomBytes(4).toString("hex");
  return `${stamp}-${suffix}`;
}

function redactSensitiveValues(value) {
  if (value == null) return value;
  let text = String(value);
  if (os.homedir()) {
    text = text.replaceAll(os.homedir(), "%USERPROFILE%");
  }
  text = text.replace(
    /\b(authorization|cookie|set-cookie)\s*[:=]\s*([^\r\n]+)/gi,
    "$1: [REDACTED]",
  );
  text = text.replace(
    /\b(api[_-]?key|token|secret|password|passwd|pwd|private[_-]?key|session[_-]?pepper|password[_-]?pepper)\b\s*[:=]\s*["']?[^"'\s,;]+/gi,
    "$1=[REDACTED]",
  );
  text = text.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g, "Bearer [REDACTED]");
  text = text.replace(
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    "[REDACTED PRIVATE KEY]",
  );
  text = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
  return text;
}

function toLogText(value, maxLength = 12000) {
  const redacted = redactSensitiveValues(value ?? "");
  return redacted.length > maxLength ? `${redacted.slice(0, maxLength)}\n[truncated]` : redacted;
}

function runGit(projectRoot, args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
    windowsHide: true,
  });
  return {
    command: `git ${args.join(" ")}`,
    status: result.status ?? (result.error ? 1 : 0),
    stdout: toLogText(result.stdout ?? ""),
    stderr: toLogText(result.stderr ?? result.error?.message ?? ""),
  };
}

async function ensureDir(projectRoot, relativePath) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
  await fs.mkdir(absolutePath, { recursive: true });
  return absolutePath;
}

async function writeJsonAtomic(projectRoot, relativePath, data, changedFiles, options = {}) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (existsSync(absolutePath)) {
    const current = await fs.readFile(absolutePath, "utf8");
    if (current === text) return false;
    if (options.backup) {
      const backupPath = `${absolutePath}.${new Date().toISOString().replace(/[:.]/g, "-")}.bak`;
      await fs.copyFile(absolutePath, backupPath);
      changedFiles?.add(path.relative(projectRoot, backupPath).replaceAll("\\", "/"));
    }
  }
  const tempPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
  const handle = await fs.open(tempPath, "w");
  try {
    await handle.writeFile(text, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tempPath, absolutePath);
  changedFiles?.add(path.relative(projectRoot, absolutePath).replaceAll("\\", "/"));
  return true;
}

async function writeTextAtomic(projectRoot, relativePath, text, changedFiles) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const safeText = text.endsWith("\n") ? text : `${text}\n`;
  if (existsSync(absolutePath)) {
    const current = await fs.readFile(absolutePath, "utf8");
    if (current === safeText) return false;
  }
  const tempPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
  const handle = await fs.open(tempPath, "w");
  try {
    await handle.writeFile(safeText, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tempPath, absolutePath);
  changedFiles?.add(path.relative(projectRoot, absolutePath).replaceAll("\\", "/"));
  return true;
}

async function loadProjectLock(projectRoot) {
  const lock = await readJson(projectRoot, PROJECT_LOCK_RELATIVE);
  if (!lock.uniqueProjectMarker || !lock.expectedRepositoryRootBasename) {
    throw new Error("Project lock is missing required identity fields.");
  }
  return lock;
}

function normalizeAutomationStatus(status) {
  return String(status ?? "").trim().replace(/^"|"$/g, "").toUpperCase();
}

function getAllowedActiveAutomationIds(projectLock) {
  const fromLock = Array.isArray(projectLock.allowedActiveAutomationIds)
    ? projectLock.allowedActiveAutomationIds
    : [];
  return new Set([projectLock.automationId, ...fromLock].filter(Boolean));
}

function normalizeRegistryAutomationEntries(rawEvidence) {
  if (Array.isArray(rawEvidence?.automations)) return rawEvidence.automations;
  if (rawEvidence?.automations && typeof rawEvidence.automations === "object") {
    return Object.entries(rawEvidence.automations).map(([id, value]) => ({
      id,
      ...(typeof value === "object" && value !== null ? value : { status: value }),
    }));
  }
  return [];
}

function evaluateAutomationRegistryEvidence(rawEvidence, source, projectLock) {
  const allowedActiveIds = getAllowedActiveAutomationIds(projectLock);
  const entries = normalizeRegistryAutomationEntries(rawEvidence);
  const seniorCapstoneEntries = entries.filter((entry) =>
    String(entry.id ?? "").startsWith("senior-capstone"),
  );
  const activeSeniorCapstone = seniorCapstoneEntries.filter(
    (entry) => normalizeAutomationStatus(entry.status) === "ACTIVE",
  );
  const activeLegacy = activeSeniorCapstone.filter((entry) =>
    LEGACY_SENIOR_CAPSTONE_AUTOMATION_IDS.has(String(entry.id)),
  );
  const unexpectedActive = activeSeniorCapstone.filter(
    (entry) => !allowedActiveIds.has(String(entry.id)),
  );
  const failureReasons = [];
  if (activeSeniorCapstone.length > 1) {
    failureReasons.push(
      `Expected exactly one active Senior Capstone automation, found ${activeSeniorCapstone.length}.`,
    );
  }
  if (activeLegacy.length > 0) {
    failureReasons.push(
      `Legacy Senior Capstone automations are active: ${activeLegacy.map((entry) => entry.id).join(", ")}.`,
    );
  }
  if (unexpectedActive.length > 0) {
    failureReasons.push(
      `Unexpected active Senior Capstone automations: ${unexpectedActive.map((entry) => entry.id).join(", ")}.`,
    );
  }
  return {
    automation_registry_inspectable: true,
    registryEvidenceSource: source,
    active_senior_capstone_automation_count: activeSeniorCapstone.length,
    active_senior_capstone_automation_ids: activeSeniorCapstone.map((entry) => entry.id),
    legacy_automation_count_active: activeLegacy.length,
    legacy_automation_ids_active: activeLegacy.map((entry) => entry.id),
    safety_status: failureReasons.length === 0 ? "PASS" : "FAIL",
    failure_reason: failureReasons.join(" "),
  };
}

async function inspectAutomationRegistry(projectRoot, projectLock, options = {}) {
  const relativePath =
    options.registryEvidencePath ??
    projectLock.expectedAutomationRegistryEvidencePath ??
    DEFAULT_REGISTRY_EVIDENCE_RELATIVE;
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return {
      automation_registry_inspectable: false,
      registryEvidenceSource: relativePath,
      active_senior_capstone_automation_count: null,
      active_senior_capstone_automation_ids: [],
      legacy_automation_count_active: null,
      legacy_automation_ids_active: [],
      safety_status: "UNKNOWN_REGISTRY_UNINSPECTABLE",
      failure_reason:
        `No repo-local automation registry evidence found at ${relativePath}; external GUI registry health was not verified.`,
    };
  }
  const rawEvidence = JSON.parse(await fs.readFile(absolutePath, "utf8"));
  return evaluateAutomationRegistryEvidence(
    rawEvidence,
    path.relative(projectRoot, absolutePath).replaceAll("\\", "/"),
    projectLock,
  );
}

function normalizeCommandForCompare(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("/", "\\")
    .replace(/\s+/g, " ");
}

function hasExpectedCommandLine(text, expectedCommand) {
  const expected = normalizeCommandForCompare(expectedCommand);
  return text
    .split(/\r?\n/)
    .some((line) => normalizeCommandForCompare(line) === expected);
}

function isDirectNodeScheduledCommand(line) {
  const normalized = String(line ?? "").trim();
  return /^(?:[`>\s-]*)?(?:\.\\)?node(?:\.exe)?\s+automation[\\/]+qol[\\/]+(?:doctor|hourly-orchestrator)\.mjs\b/i.test(
    normalized,
  );
}

function findLegacyAutomationReferences(text) {
  const references = new Set();
  for (const legacyId of LEGACY_SENIOR_CAPSTONE_AUTOMATION_IDS) {
    if (text.includes(legacyId)) references.add(legacyId);
  }
  const legacyPromptPathMatches = text.match(/docs[\\/]+automation-prompts[\\/]+senior-capstone-[\w.-]+/gi) ?? [];
  for (const match of legacyPromptPathMatches) references.add(match);
  return Array.from(references).sort();
}

async function inspectGuiInvocationContract(projectRoot, options = {}) {
  const docRelative = options.guiAllowedCommandsPath ?? GUI_ALLOWED_COMMAND_DOC_RELATIVE;
  const checks = [];
  const findings = [];
  const addCheck = (name, status, detail) => {
    checks.push({ name, status, detail });
    if (status === "fail") findings.push(detail);
  };

  const wrapperPath = assertInsideProjectRoot(projectRoot, INVOCATION_ADAPTER_RELATIVE_PATH);
  addCheck(
    "run-automation-wrapper",
    existsSync(wrapperPath) ? "pass" : "fail",
    existsSync(wrapperPath)
      ? INVOCATION_ADAPTER_RELATIVE_PATH
      : `Missing required wrapper: ${INVOCATION_ADAPTER_RELATIVE_PATH}`,
  );

  const npmWrapperPath = assertInsideProjectRoot(projectRoot, NPM_ADAPTER_RELATIVE_PATH);
  addCheck(
    "run-npm-wrapper",
    existsSync(npmWrapperPath) ? "pass" : "fail",
    existsSync(npmWrapperPath)
      ? NPM_ADAPTER_RELATIVE_PATH
      : `Missing required wrapper: ${NPM_ADAPTER_RELATIVE_PATH}`,
  );

  const docPath = assertInsideProjectRoot(projectRoot, docRelative);
  if (!existsSync(docPath)) {
    addCheck("gui-allowed-command-doc", "fail", `Missing GUI allowed command doc: ${docRelative}`);
    return {
      status: "fail",
      documentPath: docRelative,
      invocationAdapter: INVOCATION_ADAPTER_RELATIVE_PATH,
      expectedDoctorCommand: EXPECTED_GUI_DOCTOR_COMMAND,
      expectedOrchestratorCommand: EXPECTED_GUI_ORCHESTRATOR_COMMAND,
      directNodeExecutionAllowed: false,
      wrapperRequired: true,
      checks,
      findings,
    };
  }

  addCheck("gui-allowed-command-doc", "pass", docRelative);
  const text = await fs.readFile(docPath, "utf8");
  addCheck(
    "gui-doctor-wrapper-command",
    hasExpectedCommandLine(text, EXPECTED_GUI_DOCTOR_COMMAND) ? "pass" : "fail",
    hasExpectedCommandLine(text, EXPECTED_GUI_DOCTOR_COMMAND)
      ? "approved wrapper doctor command present"
      : `Missing exact approved wrapper doctor command: ${EXPECTED_GUI_DOCTOR_COMMAND}`,
  );
  addCheck(
    "gui-hourly-wrapper-command",
    hasExpectedCommandLine(text, EXPECTED_GUI_ORCHESTRATOR_COMMAND) ? "pass" : "fail",
    hasExpectedCommandLine(text, EXPECTED_GUI_ORCHESTRATOR_COMMAND)
      ? "approved wrapper hourly command present"
      : `Missing exact approved wrapper hourly command: ${EXPECTED_GUI_ORCHESTRATOR_COMMAND}`,
  );

  const directNodeLines = text
    .split(/\r?\n/)
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => isDirectNodeScheduledCommand(line));
  addCheck(
    "no-direct-node-scheduled-command",
    directNodeLines.length === 0 ? "pass" : "fail",
    directNodeLines.length === 0
      ? "scheduled GUI path does not call node.exe directly"
      : `Direct node scheduled command found on line(s): ${directNodeLines.map((item) => item.number).join(", ")}`,
  );

  const legacyReferences = findLegacyAutomationReferences(text);
  addCheck(
    "no-legacy-fleet-references",
    legacyReferences.length === 0 ? "pass" : "fail",
    legacyReferences.length === 0
      ? "no legacy Senior Capstone automation IDs or prompt paths referenced"
      : `Legacy Senior Capstone automation references found: ${legacyReferences.join(", ")}`,
  );

  return {
    status: findings.length === 0 ? "pass" : "fail",
    documentPath: docRelative,
    invocationAdapter: INVOCATION_ADAPTER_RELATIVE_PATH,
    expectedDoctorCommand: EXPECTED_GUI_DOCTOR_COMMAND,
    expectedOrchestratorCommand: EXPECTED_GUI_ORCHESTRATOR_COMMAND,
    directNodeExecutionAllowed: false,
    wrapperRequired: true,
    checks,
    findings,
  };
}

async function verifyProjectIdentity(projectRoot, projectLock, options = {}) {
  const cwd = path.resolve(options.cwdOverride ?? process.cwd());
  const evidence = {
    projectRoot,
    cwd,
    checks: [],
    git: { isRepo: false, topLevel: null, remoteMatched: false },
    packageName: null,
    wranglerName: null,
  };
  const pass = (name, detail) => evidence.checks.push({ name, status: "pass", detail });
  const fail = (name, detail) => {
    evidence.checks.push({ name, status: "fail", detail });
    throw Object.assign(new Error(detail), { evidence, checkName: name });
  };

  if (!isInsidePath(projectRoot, cwd)) {
    fail("cwd-inside-project", `Current working directory is outside this project root: ${cwd}`);
  }
  pass("cwd-inside-project", cwd);

  const basename = path.basename(projectRoot);
  if (basename !== projectLock.expectedRepositoryRootBasename) {
    evidence.checks.push({
      name: "repo-basename",
      status: "warn",
      detail: `Repository root basename '${basename}' differs from '${projectLock.expectedRepositoryRootBasename}', which is allowed for Codex worktrees when stronger identity markers pass.`,
    });
  } else {
    pass("repo-basename", basename);
  }

  const lockPath = assertInsideProjectRoot(projectRoot, PROJECT_LOCK_RELATIVE, { mustExist: true });
  const lockText = await fs.readFile(lockPath, "utf8");
  if (!lockText.includes(projectLock.uniqueProjectMarker)) {
    fail("unique-marker", "Project lock does not contain the expected unique project marker.");
  }
  pass("unique-marker", projectLock.uniqueProjectMarker);

  const packageJson = await readJson(projectRoot, "package.json");
  evidence.packageName = packageJson.name;
  if (packageJson.name !== projectLock.expectedPackageName) {
    fail(
      "package-name",
      `package.json name '${packageJson.name}' does not match '${projectLock.expectedPackageName}'.`,
    );
  }
  pass("package-name", packageJson.name);

  const wrangler = await readJson(projectRoot, "wrangler.jsonc");
  evidence.wranglerName = wrangler.name;
  if (wrangler.name !== projectLock.expectedWranglerName) {
    fail(
      "wrangler-name",
      `wrangler name '${wrangler.name}' does not match '${projectLock.expectedWranglerName}'.`,
    );
  }
  pass("wrangler-name", wrangler.name);

  const masterPlanPath = assertInsideProjectRoot(projectRoot, projectLock.expectedMasterPlanPath, {
    mustExist: true,
  });
  pass("master-plan-path", path.relative(projectRoot, masterPlanPath).replaceAll("\\", "/"));

  assertInsideProjectRoot(projectRoot, projectLock.expectedRequirementCatalogPath, { mustExist: true });
  assertInsideProjectRoot(projectRoot, projectLock.expectedAutomationStateDir);
  assertInsideProjectRoot(projectRoot, projectLock.expectedAutomationLogDir);
  assertInsideProjectRoot(projectRoot, projectLock.expectedAutomationReportDir);
  pass("project-local-automation-paths", "state, logs, and reports resolve under the project root");

  const gitTop = runGit(projectRoot, ["rev-parse", "--show-toplevel"]);
  if (gitTop.status === 0) {
    evidence.git.isRepo = true;
    evidence.git.topLevel = gitTop.stdout.trim();
    const expected = normalizePathForCompare(projectRoot);
    const actual = normalizePathForCompare(evidence.git.topLevel);
    if (actual !== expected) {
      fail("git-top-level", `Git top-level '${evidence.git.topLevel}' does not match '${projectRoot}'.`);
    }
    pass("git-top-level", evidence.git.topLevel);

    const remotes = runGit(projectRoot, ["remote", "-v"]);
    const remoteText = remotes.stdout;
    const remoteHashMatched = remoteText
      .split(/\r?\n/)
      .some((line) => sha256(line.replace(/^origin\s+/, "").replace(/\s+\((fetch|push)\)$/, "")) === projectLock.expectedGitRemoteSha256);
    if (
      !remoteText.includes(projectLock.expectedGitRemoteSubstring) &&
      !remoteHashMatched
    ) {
      fail("git-remote", "Git remote metadata does not match the project lock.");
    }
    evidence.git.remoteMatched = true;
    pass("git-remote", projectLock.expectedGitRemoteSubstring);
  } else {
    evidence.git.isRepo = false;
    pass("git-optional", "No Git repository detected; package and project markers were used.");
  }

  return evidence;
}

async function acquireLock(projectRoot, projectLock, runContext, options = {}) {
  const stateDir = await ensureDir(projectRoot, projectLock.expectedAutomationStateDir);
  const lockDir = path.join(stateDir, "lock");
  assertInsideProjectRoot(projectRoot, lockDir);
  const staleMs = options.staleMs ?? DEFAULT_STALE_LOCK_MS;

  const metadata = {
    runId: runContext.runId,
    token: crypto.randomBytes(12).toString("hex"),
    pid: process.pid,
    timestamp: runContext.startedAt,
    projectRootBasename: path.basename(projectRoot),
    uniqueProjectMarker: projectLock.uniqueProjectMarker,
    scriptVersion: SCRIPT_VERSION,
  };

  try {
    await fs.mkdir(lockDir);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existingPath = path.join(lockDir, "metadata.json");
    let existing = null;
    try {
      existing = JSON.parse(await fs.readFile(existingPath, "utf8"));
    } catch {
      existing = { unreadable: true };
    }
    const timestamp = Date.parse(existing.timestamp ?? 0);
    const ageMs = Number.isFinite(timestamp) ? Date.now() - timestamp : Number.POSITIVE_INFINITY;
    if (ageMs < staleMs) {
      return {
        acquired: false,
        lockDir,
        existing,
        reason: `Another QoL run is active (${Math.round(ageMs / 60000)} minutes old).`,
      };
    }
    if (
      existing.uniqueProjectMarker &&
      existing.uniqueProjectMarker !== projectLock.uniqueProjectMarker
    ) {
      throw new Error("Existing lock metadata belongs to a different project marker.");
    }
    const staleName = `lock.stale-${new Date().toISOString().replace(/[:.]/g, "-")}-${runContext.runId}`;
    const stalePath = path.join(stateDir, staleName);
    assertInsideProjectRoot(projectRoot, stalePath);
    await fs.rename(lockDir, stalePath);
    await fs.mkdir(lockDir);
    metadata.recoveredStaleLock = {
      previous: existing,
      movedTo: path.relative(projectRoot, stalePath).replaceAll("\\", "/"),
    };
  }

  await fs.writeFile(path.join(lockDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  return { acquired: true, lockDir, metadata };
}

async function releaseLock(projectRoot, lockHandle) {
  if (!lockHandle?.acquired) return;
  const metadataPath = path.join(lockHandle.lockDir, "metadata.json");
  assertInsideProjectRoot(projectRoot, metadataPath);
  let metadata = null;
  try {
    metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
  } catch {
    return;
  }
  if (metadata.runId !== lockHandle.metadata.runId || metadata.token !== lockHandle.metadata.token) {
    return;
  }
  assertInsideProjectRoot(projectRoot, lockHandle.lockDir);
  await fs.rm(lockHandle.lockDir, { recursive: true, force: false });
}

function splitMarkdownTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((part) => part.trim());
}

function slugify(text) {
  return text
    .toUpperCase()
    .replace(/`/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapPlanStatus(rawStatus, recurring = false) {
  const value = String(rawStatus ?? "").replace(/`/g, "").trim().toLowerCase();
  if (recurring) return "recurring";
  if (["mvp ready", "resolved", "complete", "completed", "done"].includes(value)) return "completed";
  if (["mvp blocked", "blocked"].includes(value)) return "blocked";
  if (["not started", "open"].includes(value)) return "pending";
  if (["designed", "foundation started", "alpha active", "in-progress", "in progress"].includes(value)) {
    return "ready";
  }
  return "pending";
}

function priorityForTask(id, status, category, acceptance) {
  if (HIGH_RISK_IDS.has(id)) return HIGH_RISK_IDS.get(id);
  const cleanStatus = String(status ?? "").toLowerCase();
  if (cleanStatus.includes("blocked")) return 100;
  if (cleanStatus.includes("not started")) return 85;
  if (category === "deployment-qa") return 75;
  if (acceptance && acceptance.length > 80) return 65;
  return 50;
}

function extractHeadings(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line, index) => {
      const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
      if (!match) return null;
      return { level: match[1].length, title: match[2].trim(), line: index + 1 };
    })
    .filter(Boolean);
}

function parseCatalogTasks(catalogText) {
  const tasks = [];
  for (const line of catalogText.split(/\r?\n/)) {
    if (!/^\|\s*MVP-\d+/.test(line)) continue;
    const columns = splitMarkdownTableRow(line);
    if (columns.length < 6) continue;
    const [id, title, categoryRaw, evidence, acceptance, statusRaw] = columns;
    const category = categoryRaw.replace(/`/g, "");
    const recurring = RECURRING_IDS.has(id);
    const status = statusRaw.replace(/`/g, "");
    const dependencies = Array.from(new Set(`${title} ${evidence} ${acceptance}`.match(/\b(?:MVP|SC)-\d+\b/g) ?? []))
      .filter((dependency) => dependency !== id);
    tasks.push({
      id,
      title,
      section: category,
      category,
      priority: priorityForTask(id, status, category, acceptance),
      planStatus: status,
      state: mapPlanStatus(status, recurring),
      dependencies,
      cadence: recurring ? "recurring" : "one-shot",
      riskLevel: HIGH_RISK_IDS.has(id) ? "high" : "normal",
      commands: CATEGORY_COMMANDS.has(category) ? [CATEGORY_COMMANDS.get(category).label] : [],
      acceptanceCriteria: acceptance,
      evidence,
      blockers: status.toLowerCase().includes("blocked") ? [acceptance] : [],
      recurring,
      source: "docs/mvp-requirements-catalog.md",
    });
  }
  return tasks;
}

function parseBacklogTasks(backlogText) {
  const tasks = [];
  const chunks = backlogText.split(/\r?\n(?=###\s+SC-\d+)/);
  for (const chunk of chunks) {
    const idMatch = /^###\s+(SC-\d+)/m.exec(chunk);
    if (!idMatch) continue;
    const id = idMatch[1];
    const field = (name) => {
      const match = new RegExp("- `" + name + "`:\\s*(.+)", "i").exec(chunk);
      return match ? match[1].trim() : "";
    };
    const severity = field("severity");
    const status = field("status") || "open";
    const nextAction = field("next action");
    const affectedArea = field("affected area");
    const title = affectedArea ? `${id}: ${affectedArea}` : `${id}: backlog item`;
    tasks.push({
      id,
      title,
      section: "automation-backlog",
      category: "requirements-audit",
      priority: severity === "P0" ? 115 : severity === "P1" ? 90 : 55,
      planStatus: status,
      state: mapPlanStatus(status),
      dependencies: Array.from(new Set(chunk.match(/\bMVP-\d+\b/g) ?? [])),
      cadence: "one-shot",
      riskLevel: severity || "normal",
      commands: [],
      acceptanceCriteria: nextAction,
      evidence: field("evidence"),
      blockers: status.toLowerCase() === "blocked" ? [nextAction] : [],
      recurring: false,
      source: "docs/automation-backlog.md",
    });
  }
  return tasks;
}

function parseQolSectionTasks(masterPlanText) {
  const headings = extractHeadings(masterPlanText);
  const tasks = [];
  for (const section of PLAN_DERIVED_QOL_SECTIONS) {
    const heading = headings.find((item) => item.title === section);
    if (!heading) continue;
    const id = `QOL-${slugify(section)}`;
    tasks.push({
      id,
      title: `Maintain ${section}`,
      section,
      category: "qol-automation",
      priority: section === "Hourly Master-Plan Orchestrator" ? 125 : 80,
      planStatus: "recurring",
      state: "recurring",
      dependencies: [],
      cadence: section === "Hourly Master-Plan Orchestrator" ? "hourly" : "daily",
      riskLevel: "automation-safety",
      commands: [],
      acceptanceCriteria: `Keep ${section} enforceable inside project-local automation.`,
      evidence: `docs/master-plan.md:${heading.line}`,
      blockers: [],
      recurring: true,
      source: "docs/master-plan.md",
    });
  }
  return tasks;
}

async function loadMasterPlan(projectRoot, projectLock) {
  const masterPlanText = await readText(projectRoot, projectLock.expectedMasterPlanPath);
  const catalogText = await readText(projectRoot, projectLock.expectedRequirementCatalogPath);
  let backlogText = "";
  const backlogPath = "docs/automation-backlog.md";
  if (existsSync(assertInsideProjectRoot(projectRoot, backlogPath))) {
    backlogText = await readText(projectRoot, backlogPath);
  }
  const tasks = [
    ...parseCatalogTasks(catalogText),
    ...parseBacklogTasks(backlogText),
    ...parseQolSectionTasks(masterPlanText),
  ];
  const uniqueTasks = Array.from(new Map(tasks.map((task) => [task.id, task])).values());
  return {
    path: projectLock.expectedMasterPlanPath,
    text: masterPlanText,
    checksum: sha256(masterPlanText),
    catalogChecksum: sha256(catalogText),
    headings: extractHeadings(masterPlanText),
    tasks: uniqueTasks,
  };
}

function defaultState(projectLock) {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    projectIdentity: {
      projectSlug: projectLock.projectSlug,
      automationId: projectLock.automationId,
      uniqueProjectMarker: projectLock.uniqueProjectMarker,
    },
    masterPlanChecksum: null,
    requirementCatalogChecksum: null,
    knownTasks: {},
    lastRunId: null,
    runHistory: [],
    coverage: {
      bySection: {},
      byCategory: {},
    },
    lastSelectedTaskId: null,
    lastSelectedCategory: null,
    pendingContinuation: null,
    lastValidationResults: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function loadState(projectRoot, projectLock, options = {}) {
  const statePath = path.join(projectLock.expectedAutomationStateDir, "state.json");
  const absolutePath = assertInsideProjectRoot(projectRoot, statePath);
  if (!existsSync(absolutePath)) {
    return { state: defaultState(projectLock), initialized: true };
  }
  try {
    const state = JSON.parse(await fs.readFile(absolutePath, "utf8"));
    if (state.schemaVersion !== STATE_SCHEMA_VERSION) {
      throw new Error(`Unsupported state schema version ${state.schemaVersion}`);
    }
    if (state.projectIdentity?.uniqueProjectMarker !== projectLock.uniqueProjectMarker) {
      throw new Error("State project marker does not match project lock.");
    }
    return { state, initialized: false };
  } catch (error) {
    if (options.readOnly) throw error;
    const backupPath = `${absolutePath}.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}.bak`;
    await fs.copyFile(absolutePath, backupPath);
    throw new Error(`State file is corrupt or invalid; backed up to ${path.relative(projectRoot, backupPath)}. ${error.message}`);
  }
}

function reconcilePlanWithState(plan, state, nowIso) {
  const seen = new Set();
  for (const task of plan.tasks) {
    seen.add(task.id);
    const current = state.knownTasks[task.id] ?? {};
    const currentStatus = SAFE_STATUSES.has(current.status) ? current.status : task.state;
    state.knownTasks[task.id] = {
      id: task.id,
      title: task.title,
      category: task.category,
      section: task.section,
      source: task.source,
      planStatus: task.planStatus,
      status: current.status === "running" ? "deferred" : currentStatus,
      recurring: task.recurring,
      cadence: task.cadence,
      priority: task.priority,
      firstSeenAt: current.firstSeenAt ?? nowIso,
      lastSeenAt: nowIso,
      lastAttemptAt: current.lastAttemptAt ?? null,
      lastSuccessAt: current.lastSuccessAt ?? null,
      failureCount: Number(current.failureCount ?? 0),
      blockerReason: current.blockerReason ?? null,
      cooldownUntil: current.cooldownUntil ?? null,
      lastSelectionReason: current.lastSelectionReason ?? null,
      dependencies: task.dependencies,
    };
    if (task.state === "blocked" && current.status !== "completed") {
      state.knownTasks[task.id].status = "blocked";
      state.knownTasks[task.id].blockerReason = task.blockers[0] ?? "Master plan marks this task blocked.";
    } else if (task.state === "completed" && !task.recurring) {
      state.knownTasks[task.id].status = "completed";
    } else if (task.recurring && state.knownTasks[task.id].status === "completed") {
      state.knownTasks[task.id].status = "recurring";
    } else if (state.knownTasks[task.id].status === "blocked" && task.state !== "blocked") {
      state.knownTasks[task.id].status = task.state;
      state.knownTasks[task.id].blockerReason = null;
    }
  }
  for (const [id, taskState] of Object.entries(state.knownTasks)) {
    if (!seen.has(id)) {
      taskState.status = taskState.status === "completed" ? "completed" : "deferred";
      taskState.lastSeenAt = taskState.lastSeenAt ?? nowIso;
    }
  }
}

function dependencySatisfied(state, dependencyId) {
  const dependency = state.knownTasks[dependencyId];
  if (!dependency) return true;
  return ["completed", "recurring", "ready"].includes(dependency.status);
}

function hoursSince(iso, nowMs) {
  if (!iso) return 9999;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 9999;
  return Math.max(0, (nowMs - then) / 36e5);
}

function isRecurringDue(taskState, nowMs) {
  if (!taskState.recurring) return true;
  const sinceSuccess = hoursSince(taskState.lastSuccessAt, nowMs);
  const sinceAttempt = hoursSince(taskState.lastAttemptAt, nowMs);
  if (taskState.cadence === "hourly") return sinceAttempt >= 0.75;
  if (taskState.cadence === "daily") return sinceSuccess >= 20;
  return sinceSuccess >= 6 || sinceAttempt >= 6;
}

function failureCooldownUntil(taskState, nowMs) {
  const failureCount = Number(taskState.failureCount ?? 0);
  if (failureCount <= 0 || !taskState.lastAttemptAt) return null;
  const cooldownHours = Math.min(24, 2 ** Math.min(failureCount, 5));
  const until = Date.parse(taskState.lastAttemptAt) + cooldownHours * 36e5;
  return until > nowMs ? new Date(until).toISOString() : null;
}

function scoreTasks(plan, state, preflight) {
  const nowMs = Date.now();
  const scored = [];
  const planById = new Map(plan.tasks.map((task) => [task.id, task]));
  for (const task of plan.tasks) {
    const taskState = state.knownTasks[task.id];
    if (!taskState) continue;
    if (taskState.status === "completed" && !task.recurring) continue;
    if (taskState.status === "blocked" && task.planStatus.toLowerCase() === "blocked") continue;
    if (!task.dependencies.every((dependency) => dependencySatisfied(state, dependency))) continue;
    const cooldownUntil = failureCooldownUntil(taskState, nowMs);
    if (cooldownUntil) continue;
    if (!isRecurringDue(taskState, nowMs)) continue;

    const categoryCoverage = state.coverage.byCategory[task.category] ?? {};
    const sectionCoverage = state.coverage.bySection[task.section] ?? {};
    const categoryStaleness = hoursSince(categoryCoverage.lastTouchedAt, nowMs);
    const sectionStaleness = hoursSince(sectionCoverage.lastTouchedAt, nowMs);
    let score = task.priority;
    score += Math.min(40, categoryStaleness / 2);
    score += Math.min(20, sectionStaleness / 4);
    score += Math.min(25, hoursSince(taskState.lastAttemptAt, nowMs) / 3);
    if (task.category === state.lastSelectedCategory) score -= 30;
    if (task.id === state.lastSelectedTaskId) score -= 35;
    if (task.acceptanceCriteria && task.acceptanceCriteria.length > 40) score += 10;
    if (task.commands.length > 0) score += 8;
    if (task.recurring) score += 5;
    if (taskState.status === "failed") score -= 15;
    if (preflight.gitDirty) score += task.category === "qol-automation" ? 20 : -10;
    if (planById.has("QOL-HOURLY-MASTER-PLAN-ORCHESTRATOR") && task.category === "qol-automation") {
      score += 4;
    }
    scored.push({
      task,
      taskState,
      score: Math.round(score * 100) / 100,
      reason: [
        `priority ${task.priority}`,
        `category staleness ${Math.round(categoryStaleness)}h`,
        `section staleness ${Math.round(sectionStaleness)}h`,
        task.category === state.lastSelectedCategory ? "same category penalty" : "category rotation eligible",
        preflight.gitDirty ? "dirty worktree favors automation-only checks" : "worktree clean enough for selected check",
      ],
    });
  }
  scored.sort((a, b) => b.score - a.score || a.task.id.localeCompare(b.task.id));
  return scored;
}

function selectWorkSlice(scoredTasks) {
  return scoredTasks[0] ?? null;
}

function runCommandSafely(projectRoot, commandSpec, runLog) {
  for (const required of commandSpec.requiredFiles ?? []) {
    assertInsideProjectRoot(projectRoot, required, { mustExist: true });
  }
  if (path.isAbsolute(commandSpec.command) && !existsSync(commandSpec.command)) {
    throw new Error(`Command does not exist: ${commandSpec.command}`);
  }
  for (const arg of commandSpec.args) {
    if (/^\.\.?[\\/]/.test(arg) || /^[\w.-]+[\\/]/.test(arg)) {
      assertInsideProjectRoot(projectRoot, arg, { mustExist: true });
    }
  }
  const startedAt = new Date().toISOString();
  const result = spawnSync(commandSpec.command, commandSpec.args, {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: commandSpec.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
    windowsHide: true,
  });
  const finishedAt = new Date().toISOString();
  const commandRecord = {
    label: commandSpec.label,
    command: toLogText([commandSpec.command, ...commandSpec.args].join(" "), 4000),
    startedAt,
    finishedAt,
    status: result.status ?? (result.error ? 1 : 0),
    stdout: toLogText(result.stdout ?? ""),
    stderr: toLogText(result.stderr ?? result.error?.message ?? ""),
  };
  runLog.commands.push(commandRecord);
  return commandRecord;
}

function createRunAudit(projectRoot, runContext, registryInspection, options = {}) {
  const guiDocRelative = options.guiAllowedCommandsPath ?? GUI_ALLOWED_COMMAND_DOC_RELATIVE;
  const wrapperPath = assertInsideProjectRoot(projectRoot, INVOCATION_ADAPTER_RELATIVE_PATH);
  return {
    run_id: runContext.runId,
    started_at: runContext.startedAt,
    completed_at: null,
    orchestrator_path: ORCHESTRATOR_RELATIVE_PATH,
    invocation_adapter: INVOCATION_ADAPTER_RELATIVE_PATH,
    invocation_command_expected: EXPECTED_GUI_ORCHESTRATOR_COMMAND,
    direct_node_execution_allowed: false,
    wrapper_required: true,
    wrapper_detected: existsSync(wrapperPath),
    node_access_denied_known_issue: true,
    gui_allowed_command_doc: guiDocRelative,
    scheduled_gui_canary_status: SCHEDULED_GUI_CANARY_PENDING,
    cwd: path.resolve(process.cwd()),
    selected_mvp: null,
    tests_run: 0,
    tests_passed: 0,
    state_written: false,
    log_written: false,
    report_written: false,
    lock_acquired: false,
    lock_released: false,
    active_senior_capstone_automation_count:
      registryInspection.active_senior_capstone_automation_count,
    legacy_automation_count_active: registryInspection.legacy_automation_count_active,
    automation_registry_inspectable: registryInspection.automation_registry_inspectable,
    safety_status: registryInspection.safety_status,
    failure_reason: registryInspection.failure_reason || null,
    registry_evidence_source: registryInspection.registryEvidenceSource,
    repo_local_orchestrator_health: "UNKNOWN",
    external_gui_registry_health: registryInspection.safety_status,
  };
}

function figmaLaneEnabled(env = process.env) {
  return String(env.FIGMA_EVOLUTION_ENABLED ?? "").trim().toLowerCase() === "true";
}

function skippedFigmaLaneSummary(env = process.env) {
  const enabled = figmaLaneEnabled(env);
  return {
    figma_lane_enabled: enabled,
    figma_run_id: null,
    figma_report_path: FIGMA_REPORT_RELATIVE_PATH,
    figma_integration_status: enabled ? "FIGMA_PLUGIN_PAYLOAD_ONLY" : "FIGMA_UNAVAILABLE_DRY_RUN",
    figma_safety_status: enabled ? "DRY_RUN_ONLY" : "SKIPPED_DISABLED",
    figma_selected_design_task: null,
    figma_patch_proposal_path: null,
    figma_applied_change_summary: enabled
      ? "Figma lane was not run by this QoL invocation."
      : "Figma lane skipped because FIGMA_EVOLUTION_ENABLED is not true.",
    figma_dry_run: true,
    figma_lock_released: true,
  };
}

function runFigmaLane(projectRoot, runLog) {
  if (!figmaLaneEnabled()) return skippedFigmaLaneSummary();
  const scriptPath = assertInsideProjectRoot(projectRoot, FIGMA_ORCHESTRATOR_RELATIVE_PATH, {
    mustExist: true,
  });
  const startedAt = new Date().toISOString();
  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      "--quiet",
      "--summary-json",
      "--invoked-by",
      ORCHESTRATOR_RELATIVE_PATH,
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: DEFAULT_COMMAND_TIMEOUT_MS,
      windowsHide: true,
      env: process.env,
    },
  );
  const finishedAt = new Date().toISOString();
  const commandRecord = {
    label: "figma hourly lane",
    command: toLogText(
      `${process.execPath} ${FIGMA_ORCHESTRATOR_RELATIVE_PATH} --quiet --summary-json --invoked-by ${ORCHESTRATOR_RELATIVE_PATH}`,
      4000,
    ),
    startedAt,
    finishedAt,
    status: result.status ?? (result.error ? 1 : 0),
    stdout: toLogText(result.stdout ?? ""),
    stderr: toLogText(result.stderr ?? result.error?.message ?? ""),
  };
  runLog.commands.push(commandRecord);

  let summary = {
    ...skippedFigmaLaneSummary(),
    figma_lane_enabled: true,
    figma_integration_status: "FIGMA_UNAVAILABLE_DRY_RUN",
    figma_safety_status: commandRecord.status === 0 ? "DRY_RUN_ONLY" : "FAIL",
    figma_lock_released: false,
  };
  try {
    const jsonStart = commandRecord.stdout.lastIndexOf("{");
    if (jsonStart !== -1) {
      summary = { ...summary, ...JSON.parse(commandRecord.stdout.slice(jsonStart)) };
    }
  } catch (error) {
    summary.figma_safety_status = "FAIL";
    summary.figma_failure_reason = redactSensitiveValues(error.message);
  }
  if (commandRecord.status !== 0 && summary.figma_safety_status !== "FAIL") {
    summary.figma_safety_status = "FAIL";
    summary.figma_failure_reason =
      commandRecord.stderr || `Figma lane exited ${commandRecord.status}.`;
  }
  return summary;
}

function commandLooksLikeTest(command) {
  return /\s--test\s|^--test\s|node(?:\.exe)?\s+--test\s/i.test(command.command ?? "");
}

function updateRunAuditFromExecution(audit, selection, execution, changedFiles) {
  audit.completed_at = new Date().toISOString();
  audit.selected_mvp = selection?.task?.id?.startsWith("MVP-") ? selection.task.id : null;
  const testCommands = (execution.commands ?? []).filter(commandLooksLikeTest);
  audit.tests_run = testCommands.length;
  audit.tests_passed = testCommands.filter((command) => command.status === 0).length;
  audit.state_written = Array.from(changedFiles).some((file) =>
    file === "automation/qol/state/state.json",
  );
  audit.log_written = Array.from(changedFiles).some((file) =>
    /^automation\/qol\/logs\/.+\.json$/.test(file),
  );
  audit.report_written = Array.from(changedFiles).some((file) =>
    file === "automation/qol/reports/latest.md",
  );
  audit.repo_local_orchestrator_health = execution.status === "failed" ? "FAIL" : "PASS";
  if (execution.status === "failed") {
    audit.safety_status = "FAIL";
    audit.failure_reason =
      audit.failure_reason ?? execution.validation?.join("; ") ?? "Repo-local execution failed.";
  } else if (audit.safety_status !== "FAIL" && audit.automation_registry_inspectable === false) {
    audit.safety_status = "UNKNOWN_REGISTRY_UNINSPECTABLE";
  } else if (audit.safety_status !== "FAIL") {
    audit.safety_status = "PASS";
  }
}

function validatePlanCompleteness(plan) {
  const findings = [];
  for (const task of plan.tasks) {
    if (!task.planStatus) findings.push(`${task.id} has no status.`);
    if (!task.acceptanceCriteria) findings.push(`${task.id} has no acceptance or next action text.`);
  }
  return findings;
}

async function projectScopeAudit(projectRoot, projectLock) {
  const findings = [];
  const expectedPaths = [
    projectLock.expectedMasterPlanPath,
    projectLock.expectedRequirementCatalogPath,
    projectLock.expectedAutomationStateDir,
    projectLock.expectedAutomationLogDir,
    projectLock.expectedAutomationReportDir,
  ];
  for (const relativePath of expectedPaths) {
    try {
      assertInsideProjectRoot(projectRoot, relativePath);
    } catch (error) {
      findings.push(error.message);
    }
  }
  const lockText = await readText(projectRoot, PROJECT_LOCK_RELATIVE);
  if (/C:\\|\/Users\//i.test(lockText)) {
    findings.push("Project lock contains an absolute machine path.");
  }
  return findings;
}

function designAssetAudit(projectRoot) {
  const required = [
    "docs/design/figma-first-pass-product-system.md",
    "docs/design/figma-product-preview-state-variants.md",
    "docs/visual-assets/canva-asset-specs.md",
  ];
  return required
    .filter((relativePath) => !existsSync(assertInsideProjectRoot(projectRoot, relativePath)))
    .map((relativePath) => `Missing design handoff file: ${relativePath}`);
}

async function executeWorkSlice(projectRoot, projectLock, plan, selection, runContext, options, runLog) {
  if (!selection) {
    return {
      status: "skipped",
      summary: "No eligible task was ready after dependency, blocker, and cooldown checks.",
      validation: ["No task selected."],
      commands: [],
    };
  }

  const { task } = selection;
  const validation = [];
  const workPerformed = [];
  if (options.explain) {
    return {
      status: "skipped",
      summary: `Explain mode selected ${task.id} but did not execute it.`,
      validation: selection.reason,
      commands: [],
    };
  }
  if (options.dryRun) {
    return {
      status: "skipped",
      summary: `Dry run selected ${task.id} but made no project changes.`,
      validation: selection.reason,
      commands: [],
    };
  }

  const planFindings = validatePlanCompleteness(plan);
  if (task.category === "requirements-audit") {
    validation.push(
      planFindings.length === 0
        ? "All parsed plan tasks include status and acceptance or next action text."
        : `${planFindings.length} plan completeness finding(s) need review.`,
    );
    workPerformed.push("Checked parsed master-plan/catalog task completeness.");
  } else if (task.category === "qol-automation") {
    const findings = await projectScopeAudit(projectRoot, projectLock);
    validation.push(
      findings.length === 0
        ? "Project-local QoL paths and lock metadata stayed inside this project."
        : `${findings.length} project-scope finding(s) need review.`,
    );
    workPerformed.push("Audited project-only QoL automation guard paths.");
  } else if (task.category === "design-assets-handoff") {
    const findings = designAssetAudit(projectRoot);
    validation.push(
      findings.length === 0
        ? "Design and visual-asset handoff docs required by the selected plan area exist."
        : findings.join("; "),
    );
    workPerformed.push("Checked design/asset handoff files without calling external design tools.");
  } else {
    const commandSpec = CATEGORY_COMMANDS.get(task.category);
    if (commandSpec) {
      const commandResult = runCommandSafely(projectRoot, commandSpec, runLog);
      validation.push(
        commandResult.status === 0
          ? `${commandSpec.label} passed.`
          : `${commandSpec.label} failed with exit ${commandResult.status}.`,
      );
      workPerformed.push(`Ran bounded validation command: ${commandSpec.label}.`);
    } else {
      validation.push("No safe project-local command is mapped for this category; recorded next action only.");
      workPerformed.push("Recorded selected plan slice without running an unmapped command.");
    }
  }

  const commandFailed = runLog.commands.some((command) => command.status !== 0);
  const hasFinding = validation.some((item) => /finding|failed|missing/i.test(item));
  return {
    status: commandFailed ? "failed" : hasFinding ? "needs-review" : task.recurring ? "recurring" : "completed",
    summary: `${task.id}: ${task.title}`,
    validation,
    workPerformed,
    commands: runLog.commands,
  };
}

function updateStateAfterRun(state, plan, selection, execution, runContext, changedFiles) {
  const nowIso = new Date().toISOString();
  state.masterPlanChecksum = plan.checksum;
  state.requirementCatalogChecksum = plan.catalogChecksum;
  state.lastRunId = runContext.runId;
  state.updatedAt = nowIso;
  state.lastValidationResults = execution.validation ?? [];

  if (selection) {
    const task = state.knownTasks[selection.task.id];
    task.lastAttemptAt = nowIso;
    task.lastSelectionReason = selection.reason.join("; ");
    if (execution.status === "failed") {
      task.status = "failed";
      task.failureCount = Number(task.failureCount ?? 0) + 1;
      const cooldownHours = Math.min(24, 2 ** Math.min(task.failureCount, 5));
      task.cooldownUntil = new Date(Date.now() + cooldownHours * 36e5).toISOString();
      task.blockerReason = execution.validation.join("; ");
    } else if (execution.status === "needs-review") {
      task.status = "needs-review";
      task.lastSuccessAt = nowIso;
      task.blockerReason = execution.validation.join("; ");
      task.cooldownUntil = null;
    } else if (execution.status === "completed" || execution.status === "recurring") {
      task.status = selection.task.recurring ? "recurring" : "completed";
      task.lastSuccessAt = nowIso;
      task.failureCount = 0;
      task.blockerReason = null;
      task.cooldownUntil = null;
    }
    state.lastSelectedTaskId = selection.task.id;
    state.lastSelectedCategory = selection.task.category;
    state.coverage.byCategory[selection.task.category] = {
      lastTouchedAt: nowIso,
      count: Number(state.coverage.byCategory[selection.task.category]?.count ?? 0) + 1,
    };
    state.coverage.bySection[selection.task.section] = {
      lastTouchedAt: nowIso,
      count: Number(state.coverage.bySection[selection.task.section]?.count ?? 0) + 1,
    };
  }

  state.runHistory.push({
    runId: runContext.runId,
    timestamp: nowIso,
    selectedTaskId: selection?.task.id ?? null,
    selectedCategory: selection?.task.category ?? null,
    status: execution.status,
    changedFiles: Array.from(changedFiles),
  });
  state.runHistory = state.runHistory.slice(-DEFAULT_RUN_HISTORY_LIMIT);
}

async function runPreflight(projectRoot, projectLock) {
  const gitStatus = runGit(projectRoot, ["status", "--short", "--branch"]);
  const branch = runGit(projectRoot, ["branch", "--show-current"]);
  const commit = runGit(projectRoot, ["rev-parse", "HEAD"]);
  const dirtyLines = gitStatus.stdout
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("##"));
  const nodeVersion = process.version;
  const checks = [
    { name: "node-runtime", status: "pass", detail: nodeVersion },
    {
      name: "master-plan",
      status: existsSync(assertInsideProjectRoot(projectRoot, projectLock.expectedMasterPlanPath)) ? "pass" : "fail",
      detail: projectLock.expectedMasterPlanPath,
    },
    {
      name: "state-dir",
      status: "pass",
      detail: projectLock.expectedAutomationStateDir,
    },
  ];
  return {
    gitStatus,
    gitDirty: dirtyLines.length > 0,
    dirtyLines,
    branch: branch.stdout.trim(),
    commit: commit.stdout.trim(),
    checks,
  };
}

function nextRecommendedSlice(scoredTasks, selection) {
  const next = scoredTasks.find((item) => item.task.id !== selection?.task.id);
  if (!next) return "No eligible follow-up task is ready.";
  return `${next.task.id} (${next.task.category}) after ${Math.round(next.score)} score: ${next.task.title}`;
}

function buildRunReport({
  runContext,
  identity,
  projectLock,
  plan,
  preflight,
  selection,
  execution,
  scoredTasks,
  changedFiles,
  state,
  audit,
  alreadyRunning,
  figmaLane,
}) {
  const selected = selection?.task;
  const lines = [];
  lines.push(`# QoL Hourly Orchestrator Report`);
  lines.push("");
  lines.push(`- Run ID: \`${runContext.runId}\``);
  lines.push(`- Timestamp: \`${runContext.startedAt}\``);
  if (audit?.completed_at) lines.push(`- Completed at: \`${audit.completed_at}\``);
  lines.push(`- Script version: \`${SCRIPT_VERSION}\``);
  lines.push(`- Status: \`${alreadyRunning ? "already-running" : execution.status}\``);
  lines.push(`- Safety status: \`${audit?.safety_status ?? "UNKNOWN_REGISTRY_UNINSPECTABLE"}\``);
  lines.push("");
  lines.push("## Audit Fields");
  const auditFields = audit ?? {};
  const auditFieldOrder = [
    "run_id",
    "started_at",
    "completed_at",
    "orchestrator_path",
    "invocation_adapter",
    "invocation_command_expected",
    "direct_node_execution_allowed",
    "wrapper_required",
    "wrapper_detected",
    "node_access_denied_known_issue",
    "gui_allowed_command_doc",
    "scheduled_gui_canary_status",
    "cwd",
    "selected_mvp",
    "tests_run",
    "tests_passed",
    "state_written",
    "log_written",
    "report_written",
    "lock_acquired",
    "lock_released",
    "active_senior_capstone_automation_count",
    "legacy_automation_count_active",
    "automation_registry_inspectable",
    "safety_status",
    "failure_reason",
  ];
  for (const field of auditFieldOrder) {
    const value = auditFields[field] ?? null;
    lines.push(`- ${field}: \`${redactSensitiveValues(value)}\``);
  }
  lines.push("");
  lines.push("## Health Boundaries");
  lines.push(`- repo_local_orchestrator_health: \`${audit?.repo_local_orchestrator_health ?? "UNKNOWN"}\``);
  lines.push(`- external_gui_registry_health: \`${audit?.external_gui_registry_health ?? "UNKNOWN_REGISTRY_UNINSPECTABLE"}\``);
  lines.push(`- registry_evidence_source: \`${audit?.registry_evidence_source ?? "none"}\``);
  lines.push("");
  lines.push("## Figma Lane");
  const figma = figmaLane ?? skippedFigmaLaneSummary();
  const figmaFields = [
    "figma_lane_enabled",
    "figma_run_id",
    "figma_report_path",
    "figma_integration_status",
    "figma_safety_status",
    "figma_selected_design_task",
    "figma_patch_proposal_path",
    "figma_applied_change_summary",
    "figma_dry_run",
    "figma_lock_released",
  ];
  for (const field of figmaFields) {
    lines.push(`- ${field}: \`${redactSensitiveValues(figma[field] ?? null)}\``);
  }
  if (figma.figma_failure_reason) {
    lines.push(`- figma_failure_reason: \`${redactSensitiveValues(figma.figma_failure_reason)}\``);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(
    alreadyRunning
      ? alreadyRunning.reason
      : execution.summary ?? "Hourly QoL run completed without a selected task.",
  );
  lines.push("");
  lines.push("## Project Identity Result");
  lines.push(`- Project slug: \`${projectLock.projectSlug}\``);
  lines.push(`- Project root basename: \`${path.basename(identity.projectRoot)}\``);
  lines.push(`- Git top-level: \`${identity.git.topLevel ?? "not a git repo"}\``);
  lines.push(`- Marker: \`${projectLock.uniqueProjectMarker}\``);
  lines.push(
    `- Checks: ${identity.checks.map((check) => `${check.name}=${check.status}`).join(", ")}`,
  );
  lines.push("");
  lines.push("## Master Plan Path");
  lines.push(`- \`${plan?.path ?? projectLock.expectedMasterPlanPath}\``);
  lines.push("");
  lines.push("## Selected Task");
  lines.push(
    selected
      ? `- \`${selected.id}\` ${selected.title}`
      : "- No task selected.",
  );
  if (selected) {
    lines.push(`- Category: \`${selected.category}\``);
    lines.push(`- Section: \`${selected.section}\``);
    lines.push(`- Plan status: \`${selected.planStatus}\``);
  }
  lines.push("");
  lines.push("## Reason Selected");
  if (selection) {
    for (const reason of selection.reason) lines.push(`- ${reason}`);
    lines.push(`- Score: \`${selection.score}\``);
  } else {
    lines.push("- No eligible task passed readiness, dependency, blocker, and cooldown checks.");
  }
  lines.push("");
  lines.push("## Work Performed");
  for (const item of execution.workPerformed ?? []) lines.push(`- ${item}`);
  if ((execution.workPerformed ?? []).length === 0) lines.push("- None.");
  lines.push("");
  lines.push("## Commands Run");
  if ((execution.commands ?? []).length === 0) {
    lines.push("- None.");
  } else {
    for (const command of execution.commands) {
      lines.push(`- \`${redactSensitiveValues(command.command)}\` -> exit ${command.status}`);
    }
  }
  lines.push("");
  lines.push("## Files Changed");
  if (changedFiles.size === 0) {
    lines.push("- None.");
  } else {
    for (const file of Array.from(changedFiles).sort()) lines.push(`- \`${file}\``);
  }
  lines.push("");
  lines.push("## Verification");
  for (const item of execution.validation ?? []) lines.push(`- ${redactSensitiveValues(item)}`);
  lines.push(`- Git dirty before run: \`${preflight.gitDirty}\``);
  lines.push("");
  lines.push("## State Updates");
  lines.push(`- Known tasks: \`${Object.keys(state?.knownTasks ?? {}).length}\``);
  lines.push(`- Last selected category: \`${state?.lastSelectedCategory ?? "none"}\``);
  lines.push("");
  lines.push("## Blockers");
  const blockers = Object.values(state?.knownTasks ?? {}).filter((task) => task.status === "blocked" || task.status === "failed");
  if (blockers.length === 0) {
    lines.push("- None recorded by this orchestrator state.");
  } else {
    for (const blocker of blockers.slice(0, 8)) {
      lines.push(`- \`${blocker.id}\`: ${redactSensitiveValues(blocker.blockerReason ?? blocker.status)}`);
    }
  }
  lines.push("");
  lines.push("## Next Recommended Slice");
  lines.push(`- ${nextRecommendedSlice(scoredTasks ?? [], selection)}`);
  lines.push("");
  lines.push("## User Review");
  lines.push(execution.status === "needs-review" || execution.status === "failed"
    ? "- Review is needed before retrying this selected slice."
    : "- No user review required for the bounded QoL automation slice.");
  return lines.join("\n");
}

async function pruneOldFiles(projectRoot, relativeDir, keepCount, pattern) {
  const dir = assertInsideProjectRoot(projectRoot, relativeDir);
  if (!existsSync(dir)) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => {
      const absolutePath = path.join(dir, entry.name);
      return { name: entry.name, absolutePath, mtimeMs: statSync(absolutePath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const file of files.slice(keepCount)) {
    assertInsideProjectRoot(projectRoot, file.absolutePath);
    await fs.rm(file.absolutePath, { force: false });
  }
}

async function writePlanIndex(projectRoot, projectLock, plan, changedFiles) {
  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    masterPlanPath: projectLock.expectedMasterPlanPath,
    masterPlanChecksum: plan.checksum,
    requirementCatalogPath: projectLock.expectedRequirementCatalogPath,
    requirementCatalogChecksum: plan.catalogChecksum,
    taskCount: plan.tasks.length,
    tasks: plan.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      category: task.category,
      section: task.section,
      state: task.state,
      priority: task.priority,
      cadence: task.cadence,
      source: task.source,
    })),
  };
  await writeJsonAtomic(projectRoot, path.join(projectLock.expectedAutomationStateDir, "plan-index.json"), index, changedFiles);
}

async function writeRunOutputs(projectRoot, projectLock, runContext, report, runLog, changedFiles) {
  const reportName = `${runContext.runId}.md`;
  const logName = `${runContext.runId}.json`;
  await writeTextAtomic(projectRoot, path.join(projectLock.expectedAutomationReportDir, reportName), report, changedFiles);
  await writeTextAtomic(projectRoot, path.join(projectLock.expectedAutomationReportDir, "latest.md"), report, changedFiles);
  await writeJsonAtomic(projectRoot, path.join(projectLock.expectedAutomationLogDir, logName), runLog, changedFiles);
  await pruneOldFiles(projectRoot, projectLock.expectedAutomationReportDir, DEFAULT_REPORT_LIMIT, /^\d{8}T.*\.md$/);
  await pruneOldFiles(projectRoot, projectLock.expectedAutomationLogDir, DEFAULT_LOG_LIMIT, /^\d{8}T.*\.json$/);
}

async function runDoctor(projectRoot, projectLock, options = {}) {
  const identity = await verifyProjectIdentity(projectRoot, projectLock, options);
  const preflight = await runPreflight(projectRoot, projectLock);
  const plan = await loadMasterPlan(projectRoot, projectLock);
  const registryInspection = await inspectAutomationRegistry(projectRoot, projectLock, options);
  const guiInvocationContract = await inspectGuiInvocationContract(projectRoot, options);
  let stateStatus = "pass";
  let stateDetail = "state loaded or can be initialized";
  try {
    await loadState(projectRoot, projectLock, { readOnly: true });
  } catch (error) {
    if (/ENOENT/.test(error.message)) {
      stateStatus = "pass";
      stateDetail = "state does not exist yet and can be initialized";
    } else {
      stateStatus = "fail";
      stateDetail = error.message;
    }
  }
  const projectLockFindings = await projectScopeAudit(projectRoot, projectLock);
  const registryFailure = registryInspection.safety_status === "FAIL";
  const guiInvocationFailure = guiInvocationContract.status === "fail";
  const result = {
    status:
      stateStatus === "pass" &&
      projectLockFindings.length === 0 &&
      !registryFailure &&
      !guiInvocationFailure
        ? "pass"
        : "fail",
    safety_status: registryInspection.safety_status,
    scriptVersion: SCRIPT_VERSION,
    projectRoot,
    identity,
    preflight,
    masterPlanPath: projectLock.expectedMasterPlanPath,
    parsedTaskCount: plan.tasks.length,
    state: { status: stateStatus, detail: stateDetail },
    projectScopeFindings: projectLockFindings,
    guiInvocationContract,
    automationRegistry: registryInspection,
  };
  if (!options.quiet) {
    console.log(JSON.stringify(result, null, 2));
  }
  return result.status === "pass" ? EXIT_CODES.ok : EXIT_CODES.preflightFailed;
}

async function runSelfTests(projectRoot, projectLock) {
  const failures = [];
  let checksRun = 0;
  const check = async (name, fn) => {
    try {
      await fn();
      checksRun += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      console.error(`FAIL ${name}: ${error.message}`);
    }
  };

  await check("wrong project detection fails closed", async () => {
    let failed = false;
    try {
      await verifyProjectIdentity(projectRoot, projectLock, { cwdOverride: path.dirname(projectRoot) });
    } catch {
      failed = true;
    }
    if (!failed) throw new Error("wrong cwd was accepted");
  });

  await check("project root detection", async () => {
    if (normalizePathForCompare(projectRoot) !== normalizePathForCompare(getProjectRootFromScript())) {
      throw new Error("script root did not resolve to project root");
    }
  });

  await check("path escape prevention", async () => {
    let failed = false;
    try {
      assertInsideProjectRoot(projectRoot, "..");
    } catch {
      failed = true;
    }
    if (!failed) throw new Error("parent path was accepted");
  });

  await check("master plan parsing", async () => {
    const plan = await loadMasterPlan(projectRoot, projectLock);
    if (!plan.tasks.some((task) => task.id === "MVP-001")) {
      throw new Error("MVP-001 was not parsed");
    }
    if (!plan.tasks.some((task) => task.id.startsWith("QOL-"))) {
      throw new Error("QoL plan sections were not parsed");
    }
  });

  await check("state load/save", async () => {
    const tempRoot = await fs.mkdtemp(path.join(assertInsideProjectRoot(projectRoot, projectLock.expectedAutomationStateDir), "tmp-state-"));
    const relativeState = path.relative(projectRoot, tempRoot).replaceAll("\\", "/");
    const tempLock = { ...projectLock, expectedAutomationStateDir: relativeState };
    const changed = new Set();
    const state = defaultState(projectLock);
    await writeJsonAtomic(projectRoot, path.join(relativeState, "state.json"), state, changed);
    const loaded = await loadState(projectRoot, tempLock);
    if (loaded.state.projectIdentity.uniqueProjectMarker !== projectLock.uniqueProjectMarker) {
      throw new Error("saved state marker did not round-trip");
    }
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  await check("lock acquisition/release", async () => {
    const tempRoot = await fs.mkdtemp(path.join(assertInsideProjectRoot(projectRoot, projectLock.expectedAutomationStateDir), "tmp-lock-"));
    const relativeState = path.relative(projectRoot, tempRoot).replaceAll("\\", "/");
    const tempLock = { ...projectLock, expectedAutomationStateDir: relativeState };
    const runContext = { runId: "self-test-lock", startedAt: new Date().toISOString() };
    const lock = await acquireLock(projectRoot, tempLock, runContext, { staleMs: 1 });
    if (!lock.acquired) throw new Error("lock was not acquired");
    await releaseLock(projectRoot, lock);
    if (existsSync(path.join(tempRoot, "lock"))) throw new Error("lock was not released");
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  await check("stale lock handling", async () => {
    const tempRoot = await fs.mkdtemp(path.join(assertInsideProjectRoot(projectRoot, projectLock.expectedAutomationStateDir), "tmp-stale-"));
    const relativeState = path.relative(projectRoot, tempRoot).replaceAll("\\", "/");
    const tempLock = { ...projectLock, expectedAutomationStateDir: relativeState };
    const lockDir = path.join(tempRoot, "lock");
    await fs.mkdir(lockDir);
    await fs.writeFile(
      path.join(lockDir, "metadata.json"),
      JSON.stringify({
        runId: "old",
        timestamp: "2000-01-01T00:00:00.000Z",
        projectRootBasename: projectLock.expectedRepositoryRootBasename,
      }),
    );
    const lock = await acquireLock(
      projectRoot,
      tempLock,
      { runId: "self-test-stale", startedAt: new Date().toISOString() },
      { staleMs: 1 },
    );
    if (!lock.acquired || !lock.metadata.recoveredStaleLock) {
      throw new Error("stale lock was not recovered");
    }
    await releaseLock(projectRoot, lock);
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  await check("task scoring skips blocked tasks", async () => {
    const plan = await loadMasterPlan(projectRoot, projectLock);
    const state = defaultState(projectLock);
    reconcilePlanWithState(plan, state, new Date().toISOString());
    const blocked = plan.tasks.find((task) => task.id === "MVP-001") ?? plan.tasks[0];
    blocked.planStatus = "blocked";
    blocked.state = "blocked";
    state.knownTasks[blocked.id].status = "blocked";
    const scored = scoreTasks(plan, state, { gitDirty: false });
    if (scored.some((item) => item.task.id === blocked.id)) {
      throw new Error("blocked task was selected");
    }
  });

  await check("redaction", async () => {
    const redacted = redactSensitiveValues(
      `${"Authori"}${"zation"}: ${"Bea"}${"rer"} abcdefghijklmnopqrstuvwxyz123456 password=example-value`,
    );
    if (/abcdefghijklmnopqrstuvwxyz|example-value/.test(redacted)) {
      throw new Error("secret-looking values were not redacted");
    }
  });

  await check("dry-run makes no project-local writes", async () => {
    const watchedDirs = [
      projectLock.expectedAutomationStateDir,
      projectLock.expectedAutomationLogDir,
      projectLock.expectedAutomationReportDir,
    ];
    const snapshot = async () => {
      const entries = [];
      for (const relativeDir of watchedDirs) {
        const absoluteDir = assertInsideProjectRoot(projectRoot, relativeDir);
        if (!existsSync(absoluteDir)) continue;
        const names = await fs.readdir(absoluteDir);
        entries.push(...names.map((name) => `${relativeDir}/${name}`));
      }
      return entries.sort().join("\n");
    };
    const before = await snapshot();
    const code = await runHourly(projectRoot, projectLock, {
      dryRun: true,
      quiet: true,
      runId: "self-test-dry-run",
    });
    const after = await snapshot();
    if (code !== EXIT_CODES.ok) throw new Error(`dry run returned ${code}`);
    if (before !== after) throw new Error("dry run changed state/log/report directory entries");
  });

  await check("report rendering", async () => {
    const state = defaultState(projectLock);
    const text = buildRunReport({
      runContext: { runId: "self-test", startedAt: new Date().toISOString() },
      identity: { projectRoot, git: {}, checks: [] },
      projectLock,
      plan: { path: projectLock.expectedMasterPlanPath },
      preflight: { gitDirty: false },
      selection: null,
      execution: { status: "skipped", validation: [], workPerformed: [], commands: [] },
      scoredTasks: [],
      changedFiles: new Set(),
      state,
    });
    if (!text.includes("QoL Hourly Orchestrator Report")) throw new Error("report missing title");
  });

  if (failures.length > 0) {
    console.error(JSON.stringify({ status: "failed", failures }, null, 2));
    return EXIT_CODES.runFailed;
  }
  console.log(JSON.stringify({ status: "passed", checks: checksRun }, null, 2));
  return EXIT_CODES.ok;
}

async function runHourly(projectRoot, projectLock, options = {}) {
  const startedAt = new Date().toISOString();
  const runContext = {
    runId: options.runId ?? makeRunId(new Date(startedAt)),
    startedAt,
    maxTotalRuntimeMs: DEFAULT_MAX_TOTAL_RUNTIME_MS,
  };
  const changedFiles = new Set();
  const runLog = {
    schemaVersion: 1,
    runId: runContext.runId,
    timestamp: startedAt,
    scriptVersion: SCRIPT_VERSION,
    commands: [],
    events: [],
  };

  let identity;
  let lockHandle;
  let state = defaultState(projectLock);
  let plan = null;
  let preflight = { gitDirty: false, checks: [] };
  let selection = null;
  let scoredTasks = [];
  let audit = null;
  let registryInspection = null;
  let figmaLane = skippedFigmaLaneSummary();
  let execution = {
    status: "failed",
    summary: "Run did not complete.",
    validation: [],
    workPerformed: [],
    commands: [],
  };

  try {
    identity = await verifyProjectIdentity(projectRoot, projectLock);
    if (options.doctorOnly) {
      return runDoctor(projectRoot, projectLock, { quiet: options.quiet });
    }
    if (options.smoke) {
      return runSelfTests(projectRoot, projectLock);
    }
    registryInspection = await inspectAutomationRegistry(projectRoot, projectLock, options);
    audit = createRunAudit(projectRoot, runContext, registryInspection, options);

    if (!options.dryRun && !options.explain) {
      lockHandle = await acquireLock(projectRoot, projectLock, runContext);
      if (!lockHandle.acquired) {
        audit.failure_reason = lockHandle.reason;
        plan = { path: projectLock.expectedMasterPlanPath };
        updateRunAuditFromExecution(audit, selection, { status: "skipped", validation: [], workPerformed: [], commands: [] }, changedFiles);
        const report = buildRunReport({
          runContext,
          identity,
          projectLock,
          plan,
          preflight,
          selection,
          execution: { status: "skipped", validation: [], workPerformed: [], commands: [] },
          scoredTasks,
          changedFiles,
          state,
          audit,
          alreadyRunning: lockHandle,
          figmaLane,
        });
        if (!options.quiet) console.log(report);
        return EXIT_CODES.alreadyRunning;
      }
      audit.lock_acquired = true;
    }

    preflight = await runPreflight(projectRoot, projectLock);
    plan = await loadMasterPlan(projectRoot, projectLock);
    const loaded = await loadState(projectRoot, projectLock, { readOnly: options.dryRun || options.explain });
    state = loaded.state;
    reconcilePlanWithState(plan, state, new Date().toISOString());
    scoredTasks = scoreTasks(plan, state, preflight);
    selection = selectWorkSlice(scoredTasks);
    execution = await executeWorkSlice(projectRoot, projectLock, plan, selection, runContext, options, runLog);

    if (options.explain || options.dryRun) {
      updateRunAuditFromExecution(audit, selection, execution, changedFiles);
      const report = buildRunReport({
        runContext,
        identity,
        projectLock,
        plan,
        preflight,
        selection,
        execution,
        scoredTasks,
        changedFiles,
        state,
        audit,
        figmaLane,
      });
      if (!options.quiet) console.log(report);
      return EXIT_CODES.ok;
    }

    await writePlanIndex(projectRoot, projectLock, plan, changedFiles);
    updateStateAfterRun(state, plan, selection, execution, runContext, changedFiles);
    await writeJsonAtomic(
      projectRoot,
      path.join(projectLock.expectedAutomationStateDir, "state.json"),
      state,
      changedFiles,
      { backup: true },
    );
    await pruneOldFiles(projectRoot, projectLock.expectedAutomationStateDir, 5, /^state\.json\..*\.bak$/);
    changedFiles.add(`${projectLock.expectedAutomationReportDir}/${runContext.runId}.md`);
    changedFiles.add(`${projectLock.expectedAutomationReportDir}/latest.md`);
    changedFiles.add(`${projectLock.expectedAutomationLogDir}/${runContext.runId}.json`);
    await releaseLock(projectRoot, lockHandle);
    audit.lock_released = Boolean(lockHandle?.acquired);
    lockHandle = null;
    figmaLane = runFigmaLane(projectRoot, runLog);
    if (figmaLane.figma_lane_enabled && figmaLane.figma_report_path) {
      changedFiles.add(figmaLane.figma_report_path);
    }
    updateRunAuditFromExecution(audit, selection, execution, changedFiles);
    const report = buildRunReport({
      runContext,
      identity,
      projectLock,
      plan,
      preflight,
      selection,
      execution,
      scoredTasks,
      changedFiles,
      state,
      audit,
      figmaLane,
    });
    runLog.selection = selection
      ? {
          taskId: selection.task.id,
          title: selection.task.title,
          category: selection.task.category,
          score: selection.score,
          reason: selection.reason,
        }
      : null;
    runLog.execution = execution;
    runLog.figmaLane = figmaLane;
    runLog.audit = audit;
    runLog.changedFiles = Array.from(changedFiles).sort();
    await writeRunOutputs(projectRoot, projectLock, runContext, report, runLog, changedFiles);
    audit.log_written = true;
    audit.report_written = true;
    if (!options.quiet) console.log(report);
    return execution.status === "failed" ? EXIT_CODES.runFailed : EXIT_CODES.ok;
  } catch (error) {
    const evidence = error.evidence;
    if (evidence) {
      console.error(JSON.stringify({ status: "wrong-project", error: error.message, evidence }, null, 2));
      return EXIT_CODES.wrongProject;
    }
    if (lockHandle?.acquired) {
      await releaseLock(projectRoot, lockHandle);
      if (audit) audit.lock_released = true;
      lockHandle = null;
    }
    if (identity && audit) {
      execution = {
        status: "failed",
        summary: "Run failed before completing the selected slice.",
        validation: [redactSensitiveValues(error.message)],
        workPerformed: [],
        commands: runLog.commands,
      };
      audit.failure_reason = redactSensitiveValues(error.message);
      updateRunAuditFromExecution(audit, selection, execution, changedFiles);
      const failurePlan = plan ?? { path: projectLock.expectedMasterPlanPath };
      changedFiles.add(`${projectLock.expectedAutomationReportDir}/${runContext.runId}.md`);
      changedFiles.add(`${projectLock.expectedAutomationReportDir}/latest.md`);
      changedFiles.add(`${projectLock.expectedAutomationLogDir}/${runContext.runId}.json`);
      const report = buildRunReport({
        runContext,
        identity,
        projectLock,
        plan: failurePlan,
        preflight,
        selection,
        execution,
        scoredTasks,
        changedFiles,
        state,
        audit,
        figmaLane,
      });
      runLog.execution = execution;
      runLog.audit = audit;
      runLog.changedFiles = Array.from(changedFiles).sort();
      await writeRunOutputs(projectRoot, projectLock, runContext, report, runLog, changedFiles);
      if (!options.quiet) console.log(report);
    }
    console.error(redactSensitiveValues(error.stack ?? error.message));
    return EXIT_CODES.runFailed;
  } finally {
    await releaseLock(projectRoot, lockHandle);
  }
}

function parseArgs(args) {
  const options = {
    dryRun: false,
    explain: false,
    doctorOnly: false,
    smoke: false,
    quiet: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--explain") options.explain = true;
    else if (arg === "--doctor") options.doctorOnly = true;
    else if (arg === "--smoke") options.smoke = true;
    else if (arg === "--quiet") options.quiet = true;
    else if (arg === "--registry-evidence") {
      const value = args[index + 1];
      if (!value) throw new Error("--registry-evidence requires a project-local path.");
      options.registryEvidencePath = value;
      index += 1;
    }
    else if (arg === "--gui-allowed-commands") {
      const value = args[index + 1];
      if (!value) throw new Error("--gui-allowed-commands requires a project-local Markdown path.");
      options.guiAllowedCommandsPath = value;
      index += 1;
    }
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node automation/qol/hourly-orchestrator.mjs [--dry-run|--explain|--doctor|--smoke] [--registry-evidence <project-local-json>] [--gui-allowed-commands <project-local-md>]

Modes:
  default     Run the bounded hourly QoL orchestration slice.
  --dry-run   Verify identity, parse plan, select work, and print a report without writes.
  --explain   Print selected task and scoring reasons without writes.
  --doctor    Verify project identity, plan, state, and preflight health.
  --smoke     Run project-local orchestrator self-checks.

Registry evidence:
  --registry-evidence  Read a project-local JSON fixture/evidence file. If omitted and
                       automation/qol/state/automation-registry-evidence.json is absent,
                       registry health is reported as UNKNOWN_REGISTRY_UNINSPECTABLE.

GUI command contract:
  --gui-allowed-commands  Read a project-local Markdown command contract. The default is
                          automation/qol/GUI_ALLOWED_COMMANDS.md.
`);
}

export async function runCli(args = process.argv.slice(2)) {
  const projectRoot = getProjectRootFromScript();
  const options = parseArgs(args);
  if (options.help) {
    printHelp();
    return EXIT_CODES.ok;
  }
  const projectLock = await loadProjectLock(projectRoot);
  if (options.doctorOnly) {
    return runDoctor(projectRoot, projectLock, options);
  }
  return runHourly(projectRoot, projectLock, options);
}

export {
  assertInsideProjectRoot,
  evaluateAutomationRegistryEvidence,
  inspectGuiInvocationContract,
  inspectAutomationRegistry,
  loadMasterPlan,
  loadState,
  redactSensitiveValues,
  scoreTasks,
  verifyProjectIdentity,
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(redactSensitiveValues(error.stack ?? error.message));
      process.exitCode = EXIT_CODES.runFailed;
    });
}
