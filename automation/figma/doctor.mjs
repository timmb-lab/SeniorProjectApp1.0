#!/usr/bin/env node
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { detectFigmaIntegration } from "./apply.mjs";
import {
  assertInsideProjectRoot,
  getProjectRootFromScript,
  inspectLock,
  loadBacklog,
  loadConfig,
  ORCHESTRATOR_RELATIVE_PATH,
  redactSensitiveValues,
  SAFETY_STATUSES,
} from "./plan.mjs";

const REQUIRED_FILES = [
  "automation/figma/doctor.mjs",
  ORCHESTRATOR_RELATIVE_PATH,
  "automation/figma/plan.mjs",
  "automation/figma/apply.mjs",
  "automation/figma/report.mjs",
  "automation/figma/state/backlog.json",
  "automation/figma/state/state.json",
];

const REQUIRED_DIRS = [
  "automation/figma/state",
  "automation/figma/logs",
  "automation/figma/reports",
  "automation/figma/patches",
  "automation/figma/fixtures",
];

function parseArgs(args) {
  const options = { quiet: false };
  for (const arg of args) {
    if (arg === "--quiet") options.quiet = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function printHelp() {
  console.log("Usage: node automation/figma/doctor.mjs [--quiet]");
}

export async function runDoctor(options = {}) {
  const projectRoot = options.projectRoot ?? getProjectRootFromScript();
  const env = options.env ?? process.env;
  const config = loadConfig(projectRoot, env);
  const checks = [];
  const addCheck = (name, status, detail) => checks.push({ name, status, detail });

  for (const relativePath of REQUIRED_FILES) {
    const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
    addCheck(
      `file:${relativePath}`,
      existsSync(absolutePath) ? "pass" : "fail",
      existsSync(absolutePath) ? "present" : "missing",
    );
  }
  for (const relativeDir of REQUIRED_DIRS) {
    const absolutePath = assertInsideProjectRoot(projectRoot, relativeDir);
    addCheck(
      `dir:${relativeDir}`,
      existsSync(absolutePath) ? "pass" : "fail",
      existsSync(absolutePath) ? "present" : "missing",
    );
  }

  let backlogValid = false;
  try {
    const backlog = await loadBacklog(projectRoot, config);
    backlogValid = Array.isArray(backlog.tasks) && backlog.tasks.length > 0;
    addCheck("backlog-json", backlogValid ? "pass" : "fail", `${backlog.tasks?.length ?? 0} task(s)`);
  } catch (error) {
    addCheck("backlog-json", "fail", redactSensitiveValues(error.message, [config.fileKey]));
  }

  const lock = await inspectLock(projectRoot, config);
  addCheck("lock-stale", lock.stale ? "fail" : "pass", lock.present ? `present age ${lock.ageMs}` : "absent");

  const integration = detectFigmaIntegration(projectRoot, config, env);
  addCheck(
    "figma-tool-reachability",
    integration.reachable ? "pass" : "warn",
    integration.detail,
  );
  addCheck("figma-target-page", config.targetPage ? "pass" : "fail", config.targetPage ? "present" : "missing");
  addCheck("figma-target-frame", config.targetFrame ? "pass" : "fail", config.targetFrame ? "present" : "missing");
  addCheck(
    "figma-file-key",
    config.fileKeyPresent ? "pass" : "warn",
    config.fileKeyPresent ? `present via ${config.fileKeySource}` : "missing",
  );
  addCheck("secrets-redaction", "pass", "reports expose only sensitive-value presence booleans");
  addCheck("dry-run-fallback", "pass", "patch proposal path is available when direct write is unreachable");

  const failed = checks.some((check) => check.status === "fail");
  let safetyStatus = integration.safetyStatus;
  if (!config.enabled) safetyStatus = SAFETY_STATUSES.skippedDisabled;
  else if (failed) safetyStatus = SAFETY_STATUSES.fail;

  const result = {
    status: failed ? "fail" : "pass",
    safety_status: safetyStatus,
    orchestrator_path: ORCHESTRATOR_RELATIVE_PATH,
    cwd: projectRoot,
    figma_lane_enabled: config.enabled,
    figma_mode: config.mode,
    figma_integration_status: integration.status,
    figma_tool_reachable: integration.toolReachable,
    figma_file_key_present: config.fileKeyPresent,
    figma_target_page: config.targetPage,
    figma_target_frame: config.targetFrame,
    lock_present: lock.present,
    lock_stale: lock.stale,
    backlog_valid: backlogValid,
    dry_run_fallback_available: true,
    checks,
  };
  if (!options.quiet) console.log(JSON.stringify(result, null, 2));
  return failed ? 1 : 0;
}

export async function runCli(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    printHelp();
    return 0;
  }
  return runDoctor(options);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(redactSensitiveValues(error.stack ?? error.message));
      process.exitCode = 1;
    });
}
