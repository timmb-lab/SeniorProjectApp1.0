import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  assertInsideProjectRoot,
  buildFigmaMcpCode,
  INTEGRATION_STATUSES,
  redactSensitiveValues,
  SAFETY_STATUSES,
} from "./plan.mjs";

export function detectFigmaIntegration(projectRoot, config, env = process.env) {
  if (!config.enabled) {
    return {
      status: INTEGRATION_STATUSES.unavailableDryRun,
      reachable: false,
      toolReachable: false,
      adapter: null,
      safetyStatus: SAFETY_STATUSES.skippedDisabled,
      detail: "FIGMA_EVOLUTION_ENABLED is not true.",
    };
  }

  if (config.mode === "mock" || String(env.FIGMA_MOCK_REACHABLE ?? "").toLowerCase() === "true") {
    return {
      status: INTEGRATION_STATUSES.mcpWriteAvailable,
      reachable: true,
      toolReachable: true,
      adapter: "mock",
      safetyStatus: SAFETY_STATUSES.pass,
      detail: "Mock Figma writer is reachable for local tests; no real Figma file will be touched.",
    };
  }

  if (config.writerPath) {
    const absoluteWriter = assertInsideProjectRoot(projectRoot, config.writerPath, { mustExist: true });
    const health = spawnSync(process.execPath, [absoluteWriter, "--health"], {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
      env: {
        ...process.env,
        FIGMA_FILE_KEY: config.fileKey,
        FIGMA_TARGET_PAGE: config.targetPage,
        FIGMA_TARGET_FRAME: config.targetFrame,
      },
    });
    if ((health.status ?? 1) === 0) {
      return {
        status: INTEGRATION_STATUSES.mcpWriteAvailable,
        reachable: true,
        toolReachable: true,
        adapter: "writer",
        writerPath: config.writerPath,
        safetyStatus: SAFETY_STATUSES.pass,
        detail: "Project-local Figma writer adapter passed health check.",
      };
    }
    return {
      status: INTEGRATION_STATUSES.authorizedButUnreachable,
      reachable: false,
      toolReachable: false,
      adapter: "writer",
      writerPath: config.writerPath,
      safetyStatus: SAFETY_STATUSES.authorizedButUnreachable,
      detail: redactSensitiveValues(
        `Configured Figma writer adapter failed health check: ${health.stderr || health.stdout}`,
        [config.fileKey],
      ),
    };
  }

  if (config.mode === "mcp" && config.fileKeyPresent) {
    return {
      status: INTEGRATION_STATUSES.authorizedButUnreachable,
      reachable: false,
      toolReachable: false,
      adapter: null,
      safetyStatus: SAFETY_STATUSES.authorizedButUnreachable,
      detail:
        "Figma MCP may be authorized in Codex, but no repo-local MCP writer adapter is reachable from this Node process.",
    };
  }

  return {
    status: INTEGRATION_STATUSES.unavailableDryRun,
    reachable: false,
    toolReachable: false,
    adapter: null,
    safetyStatus: SAFETY_STATUSES.dryRunOnly,
    detail: "No Figma write integration was detectable from the repo process.",
  };
}

export function buildApplyPayload(plan, config, runContext) {
  return {
    schemaVersion: 1,
    runId: runContext.runId,
    taskId: plan.task.id,
    targetFileKeyPresent: config.fileKeyPresent,
    targetPage: config.targetPage,
    targetFrame: config.targetFrame,
    description: plan.planned_change_summary,
    useFigmaCode: buildFigmaMcpCode(plan),
  };
}

export function applyMockPlan(plan, config, runContext) {
  return {
    dryRun: false,
    applied: false,
    mockApplied: true,
    changedNodeId: `mock:${runContext.runId}:${plan.task.id}`,
    appliedChangeSummary:
      `Mock Figma writer accepted one sandbox operation for ${plan.task.id} on ` +
      `${config.targetPage} / ${config.targetFrame}; no real Figma file was touched.`,
  };
}

export function applyWriterPlan(projectRoot, plan, config, runContext) {
  const absoluteWriter = assertInsideProjectRoot(projectRoot, config.writerPath, { mustExist: true });
  const payload = JSON.stringify(buildApplyPayload(plan, config, runContext));
  const result = spawnSync(process.execPath, [absoluteWriter], {
    cwd: projectRoot,
    input: payload,
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true,
    env: {
      ...process.env,
      FIGMA_FILE_KEY: config.fileKey,
      FIGMA_TARGET_PAGE: config.targetPage,
      FIGMA_TARGET_FRAME: config.targetFrame,
    },
  });
  const status = result.status ?? (result.error ? 1 : 0);
  if (status !== 0) {
    throw new Error(
      redactSensitiveValues(
        `Figma writer adapter failed with exit ${status}: ${result.stderr || result.stdout || result.error?.message}`,
        [config.fileKey],
      ),
    );
  }
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    parsed = { raw: redactSensitiveValues(result.stdout, [config.fileKey]) };
  }
  return {
    dryRun: false,
    applied: true,
    mockApplied: false,
    changedNodeId: parsed.changedNodeId ?? null,
    appliedChangeSummary:
      parsed.appliedChangeSummary ??
      `Applied one sandbox operation for ${plan.task.id} through ${path.basename(config.writerPath)}.`,
  };
}

export function applyPlan(projectRoot, plan, config, integration, runContext) {
  if (!integration.reachable) {
    return {
      dryRun: true,
      applied: false,
      mockApplied: false,
      changedNodeId: null,
      appliedChangeSummary: "No Figma canvas mutation was applied.",
    };
  }
  if (integration.adapter === "mock") return applyMockPlan(plan, config, runContext);
  if (integration.adapter === "writer") return applyWriterPlan(projectRoot, plan, config, runContext);
  throw new Error("Figma integration was marked reachable but no safe adapter was selected.");
}
