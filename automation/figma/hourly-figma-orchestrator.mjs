#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { applyPlan, detectFigmaIntegration } from "./apply.mjs";
import {
  bootstrapFigmaDirs,
  getProjectRootFromScript,
  loadBacklog,
  loadConfig,
  loadState,
  makeRunId,
  planDesignTask,
  redactSensitiveValues,
  releaseLock,
  acquireLock,
  selectDesignTask,
  SAFETY_STATUSES,
  writeJsonAtomic,
  writePatchProposal,
} from "./plan.mjs";
import { publicSummary, writeFigmaOutputs } from "./report.mjs";

const EXIT_CODES = {
  ok: 0,
  failed: 1,
};

function parseArgs(args) {
  const options = {
    quiet: false,
    summaryJson: false,
    invokedBy: null,
    runId: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--quiet") options.quiet = true;
    else if (arg === "--summary-json") options.summaryJson = true;
    else if (arg === "--invoked-by") {
      options.invokedBy = args[index + 1] ?? null;
      if (!options.invokedBy) throw new Error("--invoked-by requires a value.");
      index += 1;
    } else if (arg === "--run-id") {
      options.runId = args[index + 1] ?? null;
      if (!options.runId) throw new Error("--run-id requires a value.");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node automation/figma/hourly-figma-orchestrator.mjs [--quiet] [--summary-json] [--invoked-by <path>]

Runs one bounded repo-local Figma evolution step. Defaults to SKIPPED_DISABLED
unless FIGMA_EVOLUTION_ENABLED=true. Direct Figma mutation requires a verified
repo-local writer adapter or mock mode; otherwise a dry-run patch proposal is
written under automation/figma/patches/.
`);
}

function baseResult(projectRoot, config, runContext, options) {
  return {
    run_id: runContext.runId,
    started_at: runContext.startedAt,
    completed_at: null,
    invoked_by: options.invokedBy ?? null,
    cwd: path.resolve(process.cwd()),
    figma_lane_enabled: config.enabled,
    figma_mode: config.mode,
    figma_integration_status: null,
    figma_tool_reachable: false,
    figma_file_key_present: config.fileKeyPresent,
    figma_target_page: config.targetPage,
    figma_target_frame: config.targetFrame,
    selected_design_task: null,
    planned_change_summary: null,
    applied_change_summary: null,
    dry_run: true,
    patch_proposal_path: null,
    state_written: false,
    log_written: false,
    report_written: false,
    lock_acquired: false,
    lock_released: false,
    safety_status: SAFETY_STATUSES.dryRunOnly,
    failure_reason: null,
    plan_text: null,
    report_path: path.join(config.reportDir, "latest.md").replaceAll("\\", "/"),
    redactionSecrets: [config.fileKey],
    safety_notes: [
      "Figma lane is repo-local and invoked only from automation/qol/hourly-orchestrator.mjs when enabled.",
      "The lane selects at most one bounded design task per run.",
      "Direct Figma mutation is refused unless a reachable adapter is verified first.",
      "No delete, production-page, broad exploratory, or external automation-registry action is allowed.",
    ],
  };
}

function mergeUnique(list, value) {
  if (!value) return list;
  return list.includes(value) ? list : [...list, value];
}

async function persistState(projectRoot, config, state, result, changedFiles) {
  state.last_integration_status = result.figma_integration_status;
  state.last_safety_status = result.safety_status;
  state.known_figma_target_label = `${config.targetPage} / ${config.targetFrame}`;
  state.last_report_path = result.report_path;
  state.updated_at = new Date().toISOString();
  await writeJsonAtomic(projectRoot, config.statePath, state, changedFiles);
  result.state_written = true;
}

function applyStateOutcome(state, result, applyOutcome) {
  if (!result.selected_design_task) return;
  state.last_selected_task = result.selected_design_task;
  state.current_design_focus = result.planned_change_summary;
  if (applyOutcome.dryRun) {
    state.last_dry_run_id = result.run_id;
    state.total_dry_runs = Number(state.total_dry_runs ?? 0) + 1;
    state.proposed_design_tasks = mergeUnique(
      state.proposed_design_tasks ?? [],
      result.selected_design_task,
    );
    return;
  }
  state.last_successful_run_id = result.run_id;
  state.completed_design_tasks = mergeUnique(
    state.completed_design_tasks ?? [],
    result.selected_design_task,
  );
  state.total_figma_mutations_attempted = Number(state.total_figma_mutations_attempted ?? 0) + 1;
  if (applyOutcome.applied) {
    state.total_figma_mutations_applied = Number(state.total_figma_mutations_applied ?? 0) + 1;
  }
}

export async function runHourly(options = {}) {
  const projectRoot = options.projectRoot ?? getProjectRootFromScript();
  const env = options.env ?? process.env;
  const config = loadConfig(projectRoot, env);
  const startedAt = new Date().toISOString();
  const runContext = {
    runId: options.runId ?? env.FIGMA_RUN_ID ?? makeRunId(new Date(startedAt)),
    startedAt,
  };
  const changedFiles = new Set();
  const result = baseResult(projectRoot, config, runContext, options);
  const runLog = {
    schemaVersion: 1,
    runId: runContext.runId,
    startedAt,
    events: [],
    changedFiles: [],
  };
  let lockHandle = null;
  let state = null;

  try {
    await bootstrapFigmaDirs(projectRoot, config);
    state = await loadState(projectRoot, config);
    lockHandle = await acquireLock(projectRoot, config, runContext);
    result.lock_acquired = Boolean(lockHandle.acquired);
    if (!lockHandle.acquired) {
      result.safety_status = SAFETY_STATUSES.fail;
      result.failure_reason = lockHandle.reason;
      result.applied_change_summary = "No Figma canvas mutation was applied.";
    } else {
      try {
        if (config.simulateFailure === "after-lock") {
          throw new Error("Simulated Figma lane failure after lock acquisition.");
        }

        const integration = detectFigmaIntegration(projectRoot, config, env);
        result.figma_integration_status = integration.status;
        result.figma_tool_reachable = integration.toolReachable;

        if (!config.enabled) {
          result.safety_status = SAFETY_STATUSES.skippedDisabled;
          result.dry_run = true;
          result.applied_change_summary = "Figma lane skipped because FIGMA_EVOLUTION_ENABLED is not true.";
          result.plan_text = "- Disabled by configuration; no design task selected.";
        } else {
          const backlog = await loadBacklog(projectRoot, config);
          const task = options.selectedTask ?? selectDesignTask(backlog, state);
          if (!task) {
            result.safety_status = SAFETY_STATUSES.pass;
            result.dry_run = true;
            result.applied_change_summary = "No eligible Figma backlog task remains.";
            result.plan_text = "- No eligible bounded design task was selected.";
          } else {
            const plan = planDesignTask(task, config, runContext);
            result.selected_design_task = task.id;
            result.planned_change_summary = plan.planned_change_summary;
            result.plan_text = `- ${plan.planned_change_summary}`;
            let applyOutcome;
            if (!integration.reachable) {
              result.patch_proposal_path = await writePatchProposal(
                projectRoot,
                config,
                plan,
                runContext,
                changedFiles,
              );
              applyOutcome = {
                dryRun: true,
                applied: false,
                mockApplied: false,
                appliedChangeSummary: "No Figma canvas mutation was applied.",
              };
              result.safety_status =
                integration.status === "FIGMA_AUTHORIZED_BUT_TOOL_UNREACHABLE"
                  ? SAFETY_STATUSES.authorizedButUnreachable
                  : SAFETY_STATUSES.dryRunOnly;
            } else {
              applyOutcome = applyPlan(projectRoot, plan, config, integration, runContext);
              result.safety_status = SAFETY_STATUSES.pass;
            }
            result.dry_run = Boolean(applyOutcome.dryRun);
            result.applied_change_summary = applyOutcome.appliedChangeSummary;
            applyStateOutcome(state, result, applyOutcome);
          }
        }
      } catch (error) {
        result.safety_status = SAFETY_STATUSES.fail;
        result.failure_reason = redactSensitiveValues(error.message, [config.fileKey]);
        result.applied_change_summary = "No Figma canvas mutation was applied.";
        result.dry_run = true;
        runLog.events.push({ level: "error", message: result.failure_reason });
      } finally {
        result.lock_released = await releaseLock(lockHandle);
        lockHandle = null;
      }
    }

    if (!result.figma_integration_status) {
      const integration = detectFigmaIntegration(projectRoot, config, env);
      result.figma_integration_status = integration.status;
      result.figma_tool_reachable = integration.toolReachable;
    }
    await persistState(projectRoot, config, state, result, changedFiles);
  } catch (error) {
    if (lockHandle?.acquired) {
      result.lock_released = await releaseLock(lockHandle);
      lockHandle = null;
    }
    result.safety_status = SAFETY_STATUSES.fail;
    result.failure_reason = redactSensitiveValues(error.message, [config.fileKey]);
    result.applied_change_summary = "No Figma canvas mutation was applied.";
    result.dry_run = true;
    runLog.events.push({ level: "error", message: result.failure_reason });
  }

  result.completed_at = new Date().toISOString();
  runLog.changedFiles = Array.from(changedFiles).sort();
  const report = await writeFigmaOutputs(projectRoot, config, result, runLog, changedFiles);
  if (options.summaryJson) {
    console.log(JSON.stringify(publicSummary(result)));
  } else if (!options.quiet) {
    console.log(report);
  }
  return result.safety_status === SAFETY_STATUSES.fail ? EXIT_CODES.failed : EXIT_CODES.ok;
}

export async function runCli(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    printHelp();
    return EXIT_CODES.ok;
  }
  return runHourly(options);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(redactSensitiveValues(error.stack ?? error.message));
      process.exitCode = EXIT_CODES.failed;
    });
}
