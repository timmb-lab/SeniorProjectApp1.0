import crypto from "node:crypto";
import { existsSync, realpathSync, statSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCRIPT_VERSION = "0.1.0";
export const ORCHESTRATOR_RELATIVE_PATH = "automation/figma/hourly-figma-orchestrator.mjs";
export const DEFAULT_TARGET_PAGE = "Senior Capstone Automation Lab";
export const DEFAULT_TARGET_FRAME = "Hourly Figma Evolution";
export const DEFAULT_ACTIVE_FIGMA_LABEL = "Senior Capstone App - Product UI System Recreated";
export const DEFAULT_STALE_LOCK_MS = 60 * 60 * 1000;

export const INTEGRATION_STATUSES = {
  mcpWriteAvailable: "FIGMA_MCP_WRITE_AVAILABLE",
  authorizedButUnreachable: "FIGMA_AUTHORIZED_BUT_TOOL_UNREACHABLE",
  restReadOnly: "FIGMA_REST_READONLY_AVAILABLE",
  pluginPayloadOnly: "FIGMA_PLUGIN_PAYLOAD_ONLY",
  unavailableDryRun: "FIGMA_UNAVAILABLE_DRY_RUN",
};

export const SAFETY_STATUSES = {
  pass: "PASS",
  dryRunOnly: "DRY_RUN_ONLY",
  skippedDisabled: "SKIPPED_DISABLED",
  fail: "FAIL",
  unknownUnconfigured: "UNKNOWN_FIGMA_UNCONFIGURED",
  authorizedButUnreachable: "FIGMA_AUTHORIZED_BUT_TOOL_UNREACHABLE",
};

export const ALLOWED_ACTIONS = new Set([
  "create_or_update_sandbox_page",
  "create_or_update_lab_frame",
  "add_screen_from_template",
  "add_component_instance_reference",
  "add_design_note",
  "add_status_panel",
  "add_error_empty_loading_state",
  "add_accessibility_annotation",
  "add_responsive_annotation",
  "refine_spacing_in_sandbox_frame",
  "create_design_backlog_status",
  "create_test_account_scenario",
  "create_patch_proposal",
]);

const DISALLOWED_PATTERNS = [
  /\bdelete\b/i,
  /\bdestroy\b/i,
  /\boverwrite\s+(an?\s+)?entire\b/i,
  /\bmodify\s+production\b/i,
  /\bproduction\s+page\b/i,
  /\brename\s+large\b/i,
  /\bdetach\b/i,
  /\bbroad\s+explor/i,
  /\bmore\s+than\s+one\s+design\s+task\b/i,
  /\bfree\s+self[- ]building\b/i,
];

export const DEFAULT_BACKLOG = {
  schemaVersion: 1,
  description:
    "Bounded safe backlog for repo-local hourly Figma evolution. The lane selects at most one task per run.",
  tasks: [
    {
      id: "FIGMA-001",
      title: "Create Senior Capstone Automation Lab page/frame.",
      template: "automation_lab_frame",
      allowed_actions: ["create_or_update_sandbox_page", "create_or_update_lab_frame"],
      status: "ready",
    },
    {
      id: "FIGMA-002",
      title: "Add Account Seed screen concept.",
      template: "account_seed_screen",
      allowed_actions: ["add_screen_from_template", "create_test_account_scenario"],
      status: "ready",
    },
    {
      id: "FIGMA-003",
      title: "Add Dashboard empty-state concept.",
      template: "dashboard_empty_state",
      allowed_actions: ["add_error_empty_loading_state", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-004",
      title: "Add Onboarding checklist concept.",
      template: "onboarding_checklist",
      allowed_actions: ["add_screen_from_template", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-005",
      title: "Add QoL automation status panel.",
      template: "qol_status_panel",
      allowed_actions: ["add_status_panel", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-006",
      title: "Add latest run report panel.",
      template: "latest_run_report_panel",
      allowed_actions: ["add_status_panel", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-007",
      title: "Add lock/failure state visualization.",
      template: "lock_failure_state",
      allowed_actions: ["add_error_empty_loading_state", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-008",
      title: "Add test-account scenario annotations.",
      template: "test_account_annotations",
      allowed_actions: ["create_test_account_scenario", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-009",
      title: "Add accessibility checklist annotations.",
      template: "accessibility_checklist",
      allowed_actions: ["add_accessibility_annotation", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-010",
      title: "Add responsive layout checklist annotations.",
      template: "responsive_layout_checklist",
      allowed_actions: ["add_responsive_annotation", "add_design_note"],
      status: "ready",
    },
    {
      id: "FIGMA-011",
      title: "Add MVP progress timeline frame.",
      template: "mvp_progress_timeline",
      allowed_actions: ["add_screen_from_template", "add_status_panel"],
      status: "ready",
    },
    {
      id: "FIGMA-012",
      title: "Add error recovery state screen.",
      template: "error_recovery_state",
      allowed_actions: ["add_error_empty_loading_state", "add_design_note"],
      status: "ready",
    },
  ],
};

export function getProjectRootFromScript() {
  const scriptPath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(scriptPath), "..", "..");
}

export function normalizePathForCompare(value) {
  const normalized = path.resolve(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

export function isInsidePath(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function assertInsideProjectRoot(projectRoot, candidatePath, options = {}) {
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

export function toProjectRelative(projectRoot, absolutePath) {
  return path.relative(projectRoot, absolutePath).replaceAll("\\", "/");
}

export async function ensureDir(projectRoot, relativeDir) {
  const absoluteDir = assertInsideProjectRoot(projectRoot, relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });
  return absoluteDir;
}

export async function readJson(projectRoot, relativePath) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath, { mustExist: true });
  const text = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(text);
}

export async function writeJsonAtomic(projectRoot, relativePath, data, changedFiles) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (existsSync(absolutePath)) {
    const current = await fs.readFile(absolutePath, "utf8");
    if (current === text) return false;
  }
  const tempPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, text, "utf8");
  await fs.rename(tempPath, absolutePath);
  changedFiles?.add(toProjectRelative(projectRoot, absolutePath));
  return true;
}

export async function writeTextAtomic(projectRoot, relativePath, text, changedFiles) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const safeText = text.endsWith("\n") ? text : `${text}\n`;
  if (existsSync(absolutePath)) {
    const current = await fs.readFile(absolutePath, "utf8");
    if (current === safeText) return false;
  }
  const tempPath = `${absolutePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, safeText, "utf8");
  await fs.rename(tempPath, absolutePath);
  changedFiles?.add(toProjectRelative(projectRoot, absolutePath));
  return true;
}

export function redactSensitiveValues(value, extraSecrets = []) {
  if (value == null) return value;
  let text = String(value);
  const secrets = [
    process.env.FIGMA_FILE_KEY,
    process.env.FIGMA_TOKEN,
    process.env.FIGMA_ACCESS_TOKEN,
    ...extraSecrets,
  ].filter(Boolean);
  for (const secret of secrets) {
    if (secret.length >= 4) text = text.replaceAll(secret, "[REDACTED]");
  }
  if (os.homedir()) text = text.replaceAll(os.homedir(), "%USERPROFILE%");
  text = text.replace(
    /\b(api[_-]?key|token|secret|password|passwd|pwd|private[_-]?key|session[_-]?pepper)\b\s*[:=]\s*["']?[^"'\s,;]+/gi,
    "$1=[REDACTED]",
  );
  text = text.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g, "Bearer [REDACTED]");
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

export function makeRunId(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const suffix = crypto.randomBytes(4).toString("hex");
  return `${stamp}-${suffix}`;
}

function envBool(env, name) {
  return String(env[name] ?? "").trim().toLowerCase() === "true";
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(projectRoot, env = process.env) {
  const stateDir = env.FIGMA_STATE_DIR || "automation/figma/state";
  const logDir = env.FIGMA_LOG_DIR || "automation/figma/logs";
  const reportDir = env.FIGMA_REPORT_DIR || "automation/figma/reports";
  const patchDir = env.FIGMA_PATCH_DIR || "automation/figma/patches";
  const fixtureDir = env.FIGMA_FIXTURE_DIR || "automation/figma/fixtures";
  const mode = String(env.FIGMA_MODE || "mcp").trim().toLowerCase();
  const fileKey = env.FIGMA_FILE_KEY || "";
  const maxTasksPerRun = Math.min(1, positiveInt(env.FIGMA_MAX_TASKS_PER_RUN, 1));

  for (const relativeDir of [stateDir, logDir, reportDir, patchDir, fixtureDir]) {
    assertInsideProjectRoot(projectRoot, relativeDir);
  }

  const writerPath = env.FIGMA_MCP_WRITER_PATH || "";
  if (writerPath) assertInsideProjectRoot(projectRoot, writerPath, { mustExist: true });

  return {
    enabled: envBool(env, "FIGMA_EVOLUTION_ENABLED"),
    mode,
    fileKey,
    fileKeyPresent: Boolean(fileKey),
    fileKeyRequired: envBool(env, "FIGMA_EVOLUTION_ENABLED") && mode !== "mock",
    fileKeySource: env.FIGMA_FILE_KEY ? "env" : "missing",
    targetPage: env.FIGMA_TARGET_PAGE || DEFAULT_TARGET_PAGE,
    targetFrame: env.FIGMA_TARGET_FRAME || DEFAULT_TARGET_FRAME,
    allowProductionMutation: envBool(env, "FIGMA_ALLOW_PRODUCTION_MUTATION"),
    maxTasksPerRun,
    stateDir,
    logDir,
    reportDir,
    patchDir,
    fixtureDir,
    backlogPath: path.join(stateDir, "backlog.json").replaceAll("\\", "/"),
    statePath: path.join(stateDir, "state.json").replaceAll("\\", "/"),
    writerPath,
    simulateFailure: env.FIGMA_SIMULATE_FAILURE || "",
  };
}

export async function bootstrapFigmaDirs(projectRoot, config) {
  for (const relativeDir of [
    config.stateDir,
    config.logDir,
    config.reportDir,
    config.patchDir,
    config.fixtureDir,
  ]) {
    await ensureDir(projectRoot, relativeDir);
  }
  if (!existsSync(assertInsideProjectRoot(projectRoot, config.backlogPath))) {
    await writeJsonAtomic(projectRoot, config.backlogPath, DEFAULT_BACKLOG);
  }
  if (!existsSync(assertInsideProjectRoot(projectRoot, config.statePath))) {
    await writeJsonAtomic(projectRoot, config.statePath, defaultState());
  }
}

export function defaultState() {
  return {
    schemaVersion: 1,
    completed_design_tasks: [],
    proposed_design_tasks: [],
    last_selected_task: null,
    last_successful_run_id: null,
    last_dry_run_id: null,
    current_design_focus: "safe sandbox design evolution",
    known_figma_target_label: `${DEFAULT_TARGET_PAGE} / ${DEFAULT_TARGET_FRAME}`,
    last_report_path: "automation/figma/reports/latest.md",
    total_figma_mutations_attempted: 0,
    total_figma_mutations_applied: 0,
    total_dry_runs: 0,
    last_integration_status: null,
    last_safety_status: null,
    updated_at: null,
  };
}

export async function loadBacklog(projectRoot, config) {
  const backlog = await readJson(projectRoot, config.backlogPath);
  if (!Array.isArray(backlog.tasks)) {
    throw new Error("Figma backlog file must contain a tasks array.");
  }
  return backlog;
}

export async function loadState(projectRoot, config) {
  if (!existsSync(assertInsideProjectRoot(projectRoot, config.statePath))) return defaultState();
  return { ...defaultState(), ...(await readJson(projectRoot, config.statePath)) };
}

export function selectDesignTask(backlog, state) {
  const completed = new Set(state.completed_design_tasks ?? []);
  const proposed = new Set(state.proposed_design_tasks ?? []);
  const readyTasks = backlog.tasks.filter((task) => String(task.status ?? "ready") === "ready");
  return (
    readyTasks.find((task) => !completed.has(task.id) && !proposed.has(task.id)) ??
    readyTasks.find((task) => !completed.has(task.id)) ??
    null
  );
}

function operationForTask(task, config, runContext) {
  const itemName = `${task.id} / ${task.title.replace(/\.$/, "")}`;
  const metadata = {
    generatedBy: ORCHESTRATOR_RELATIVE_PATH,
    runId: runContext.runId,
    taskId: task.id,
    timestamp: runContext.startedAt,
  };
  const common = {
    targetPage: config.targetPage,
    targetFrame: config.targetFrame,
    itemName,
    metadata,
  };
  if (task.id === "FIGMA-001") {
    return {
      type: "create_or_update_sandbox_page_frame",
      ...common,
      detail:
        "Create or refresh the sandbox automation lab page and main frame with auditable metadata.",
    };
  }
  return {
    type: "add_or_update_sandbox_note",
    ...common,
    detail: `Add one bounded sandbox design note for ${task.title}`,
  };
}

export function validateTaskSafety(task) {
  const actions = task.allowed_actions ?? [];
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new Error(`Design task ${task.id ?? "(unknown)"} has no allowed actions.`);
  }
  for (const action of actions) {
    if (!ALLOWED_ACTIONS.has(action)) {
      throw new Error(`Design task ${task.id ?? "(unknown)"} uses disallowed action: ${action}`);
    }
  }
  const taskText = JSON.stringify(task);
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(taskText)) {
      throw new Error(`Design task ${task.id ?? "(unknown)"} contains a destructive action.`);
    }
  }
}

export function validatePlanSafety(plan, config) {
  if (!plan || !Array.isArray(plan.operations)) throw new Error("Figma plan is missing operations.");
  if (plan.operations.length !== 1) {
    throw new Error("Figma lane may apply exactly one design operation per run.");
  }
  if (config.maxTasksPerRun !== 1) {
    throw new Error("FIGMA_MAX_TASKS_PER_RUN must remain 1 for the bounded lane.");
  }
  if (config.allowProductionMutation) {
    throw new Error("Production Figma mutation is not approved for this lane.");
  }
  const planText = JSON.stringify(plan);
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(planText)) {
      throw new Error("Figma plan contains a destructive or production-scoped action.");
    }
  }
  for (const operation of plan.operations) {
    if (operation.targetPage !== config.targetPage || operation.targetFrame !== config.targetFrame) {
      throw new Error("Figma plan target escaped the configured sandbox page/frame.");
    }
  }
}

export function planDesignTask(task, config, runContext) {
  validateTaskSafety(task);
  const operation = operationForTask(task, config, runContext);
  const plan = {
    schemaVersion: 1,
    runId: runContext.runId,
    task: {
      id: task.id,
      title: task.title,
      template: task.template,
      allowed_actions: task.allowed_actions,
    },
    operations: [operation],
    planned_change_summary: `${task.id}: ${operation.detail}`,
  };
  validatePlanSafety(plan, config);
  return plan;
}

function jsString(value) {
  return JSON.stringify(String(value ?? ""));
}

export function buildFigmaMcpCode(plan) {
  const operation = plan.operations[0];
  const noteLines = [
    operation.itemName,
    operation.detail,
    `Generated by: ${operation.metadata.generatedBy}`,
    `Run ID: ${operation.metadata.runId}`,
    `Task ID: ${operation.metadata.taskId}`,
    `Timestamp: ${operation.metadata.timestamp}`,
  ];

  return `
const pageName = ${jsString(operation.targetPage)};
const frameName = ${jsString(operation.targetFrame)};
const itemName = ${jsString(operation.itemName)};
const noteLines = ${JSON.stringify(noteLines)};
const metadata = ${JSON.stringify(operation.metadata)};

await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

let page = figma.root.children.find((child) => child.type === "PAGE" && child.name === pageName);
if (!page) {
  page = figma.createPage();
  page.name = pageName;
}
await figma.setCurrentPageAsync(page);

let labFrame = page.children.find((child) => child.type === "FRAME" && child.name === frameName);
if (!labFrame) {
  labFrame = figma.createFrame();
  labFrame.name = frameName;
  labFrame.resize(1440, 900);
  labFrame.x = 0;
  labFrame.y = 0;
  labFrame.fills = [{ type: "SOLID", color: { r: 0.984, g: 0.98, b: 0.961 } }];
  labFrame.layoutMode = "VERTICAL";
  labFrame.primaryAxisSizingMode = "AUTO";
  labFrame.counterAxisSizingMode = "FIXED";
  labFrame.itemSpacing = 16;
  labFrame.paddingTop = 40;
  labFrame.paddingRight = 40;
  labFrame.paddingBottom = 40;
  labFrame.paddingLeft = 40;
  page.appendChild(labFrame);
}

let itemFrame = labFrame.children.find((child) => child.type === "FRAME" && child.name === itemName);
if (!itemFrame) {
  itemFrame = figma.createFrame();
  itemFrame.name = itemName;
  itemFrame.resize(640, 220);
  itemFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  itemFrame.strokes = [{ type: "SOLID", color: { r: 0.863, g: 0.894, b: 0.898 } }];
  itemFrame.cornerRadius = 8;
  itemFrame.layoutMode = "VERTICAL";
  itemFrame.primaryAxisSizingMode = "AUTO";
  itemFrame.counterAxisSizingMode = "FIXED";
  itemFrame.itemSpacing = 8;
  itemFrame.paddingTop = 18;
  itemFrame.paddingRight = 18;
  itemFrame.paddingBottom = 18;
  itemFrame.paddingLeft = 18;
  labFrame.appendChild(itemFrame);
}

for (const [index, line] of noteLines.entries()) {
  const nodeName = "Automation note / " + index;
  let text = itemFrame.children.find((child) => child.type === "TEXT" && child.name === nodeName);
  if (!text) {
    text = figma.createText();
    text.name = nodeName;
    itemFrame.appendChild(text);
  }
  text.characters = line;
  text.fontName = { family: "Inter", style: index === 0 ? "Semi Bold" : "Regular" };
  text.fontSize = index === 0 ? 18 : 12;
  text.fills = [{ type: "SOLID", color: index === 0 ? { r: 0.09, g: 0.125, b: 0.149 } : { r: 0.349, g: 0.408, b: 0.443 } }];
  text.resize(604, text.height);
}

itemFrame.setSharedPluginData("senior_capstone_figma_hourly", "lastRun", JSON.stringify(metadata));
figma.viewport.scrollAndZoomIntoView([itemFrame]);

return {
  pageName,
  frameName,
  itemName,
  taskId: metadata.taskId,
  runId: metadata.runId,
  changedNodeId: itemFrame.id,
  mutation: "sandbox_note_upsert"
};
`.trim();
}

export async function writePatchProposal(projectRoot, config, plan, runContext, changedFiles) {
  const relative = path
    .join(config.patchDir, `${runContext.runId}-${plan.task.id}.json`)
    .replaceAll("\\", "/");
  const proposal = {
    schemaVersion: 1,
    run_id: runContext.runId,
    task_id: plan.task.id,
    target_file_key_required: true,
    target_file_key_source: config.fileKeySource,
    target_file_key_redacted: true,
    target_page: config.targetPage,
    target_frame: config.targetFrame,
    mcp_tool: "mcp__codex_apps__figma._use_figma",
    description: plan.planned_change_summary,
    use_figma_payload: {
      description: plan.planned_change_summary,
      skillNames: "figma-use",
      code: buildFigmaMcpCode(plan),
    },
    safety_notes: [
      "Sandbox page/frame only.",
      "No delete operations.",
      "No production page mutation.",
      "Exactly one design task.",
    ],
  };
  await writeJsonAtomic(projectRoot, relative, proposal, changedFiles);
  return relative;
}

export async function inspectLock(projectRoot, config) {
  const lockDir = assertInsideProjectRoot(projectRoot, path.join(config.stateDir, "lock"));
  if (!existsSync(lockDir)) return { present: false, stale: false, ageMs: null };
  const metadataPath = path.join(lockDir, "metadata.json");
  let metadata = null;
  try {
    metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
  } catch {
    metadata = { unreadable: true };
  }
  const timestamp = Date.parse(metadata.timestamp ?? 0);
  const ageMs = Number.isFinite(timestamp) ? Date.now() - timestamp : null;
  return {
    present: true,
    stale: ageMs == null || ageMs > DEFAULT_STALE_LOCK_MS,
    ageMs,
    metadata,
  };
}

export async function acquireLock(projectRoot, config, runContext) {
  const stateDir = await ensureDir(projectRoot, config.stateDir);
  const lockDir = path.join(stateDir, "lock");
  const metadata = {
    runId: runContext.runId,
    token: crypto.randomBytes(12).toString("hex"),
    pid: process.pid,
    timestamp: runContext.startedAt,
    orchestratorPath: ORCHESTRATOR_RELATIVE_PATH,
  };
  try {
    await fs.mkdir(lockDir);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const inspection = await inspectLock(projectRoot, config);
    if (!inspection.stale) {
      return {
        acquired: false,
        reason: `Figma lane lock is already active for run ${inspection.metadata?.runId ?? "unknown"}.`,
        lockDir,
        metadata: inspection.metadata,
      };
    }
    const stalePath = `${lockDir}.stale-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    await fs.rename(lockDir, stalePath);
    await fs.mkdir(lockDir);
    metadata.recoveredStaleLock = toProjectRelative(projectRoot, stalePath);
  }
  await fs.writeFile(path.join(lockDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return { acquired: true, lockDir, metadata };
}

export async function releaseLock(lockHandle) {
  if (!lockHandle?.acquired) return false;
  const metadataPath = path.join(lockHandle.lockDir, "metadata.json");
  try {
    const existing = JSON.parse(await fs.readFile(metadataPath, "utf8"));
    if (existing.token !== lockHandle.metadata.token) return false;
  } catch {
    return false;
  }
  await fs.rm(lockHandle.lockDir, { recursive: true, force: true });
  return true;
}

export function mtimeOrNull(projectRoot, relativePathValue) {
  const absolutePath = assertInsideProjectRoot(projectRoot, relativePathValue);
  return existsSync(absolutePath) ? statSync(absolutePath).mtimeMs : null;
}
