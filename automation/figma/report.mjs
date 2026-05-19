import path from "node:path";
import {
  ORCHESTRATOR_RELATIVE_PATH,
  redactSensitiveValues,
  SCRIPT_VERSION,
  writeJsonAtomic,
  writeTextAtomic,
} from "./plan.mjs";

export function buildFigmaReport(result) {
  const lines = [];
  lines.push("# Figma Hourly Evolution Report");
  lines.push("");
  lines.push(`- run_id: \`${result.run_id}\``);
  lines.push(`- started_at: \`${result.started_at}\``);
  lines.push(`- completed_at: \`${result.completed_at ?? null}\``);
  lines.push(`- script_version: \`${SCRIPT_VERSION}\``);
  lines.push(`- orchestrator_path: \`${ORCHESTRATOR_RELATIVE_PATH}\``);
  lines.push(`- invoked_by: \`${result.invoked_by ?? null}\``);
  lines.push(`- cwd: \`${redactSensitiveValues(result.cwd, result.redactionSecrets)}\``);
  lines.push(`- figma_lane_enabled: \`${result.figma_lane_enabled}\``);
  lines.push(`- figma_mode: \`${result.figma_mode}\``);
  lines.push(`- figma_integration_status: \`${result.figma_integration_status}\``);
  lines.push(`- figma_tool_reachable: \`${result.figma_tool_reachable}\``);
  lines.push(`- figma_file_key_present: \`${result.figma_file_key_present}\``);
  lines.push(`- figma_target_page: \`${redactSensitiveValues(result.figma_target_page)}\``);
  lines.push(`- figma_target_frame: \`${redactSensitiveValues(result.figma_target_frame)}\``);
  lines.push(`- selected_design_task: \`${result.selected_design_task ?? null}\``);
  lines.push(`- planned_change_summary: \`${redactSensitiveValues(result.planned_change_summary ?? null, result.redactionSecrets)}\``);
  lines.push(`- applied_change_summary: \`${redactSensitiveValues(result.applied_change_summary ?? null, result.redactionSecrets)}\``);
  lines.push(`- dry_run: \`${result.dry_run}\``);
  lines.push(`- patch_proposal_path: \`${result.patch_proposal_path ?? null}\``);
  lines.push(`- state_written: \`${result.state_written}\``);
  lines.push(`- log_written: \`${result.log_written}\``);
  lines.push(`- report_written: \`${result.report_written}\``);
  lines.push(`- lock_acquired: \`${result.lock_acquired}\``);
  lines.push(`- lock_released: \`${result.lock_released}\``);
  lines.push(`- safety_status: \`${result.safety_status}\``);
  lines.push(`- failure_reason: \`${redactSensitiveValues(result.failure_reason ?? null, result.redactionSecrets)}\``);
  lines.push("");
  lines.push("## Plan");
  lines.push(result.plan_text ? redactSensitiveValues(result.plan_text, result.redactionSecrets) : "- No plan was applied.");
  lines.push("");
  lines.push("## Safety");
  for (const item of result.safety_notes ?? []) {
    lines.push(`- ${redactSensitiveValues(item, result.redactionSecrets)}`);
  }
  if ((result.safety_notes ?? []).length === 0) lines.push("- No additional safety notes.");
  return lines.join("\n");
}

export function publicSummary(result) {
  return {
    figma_lane_enabled: result.figma_lane_enabled,
    figma_run_id: result.run_id,
    figma_report_path: result.report_path,
    figma_integration_status: result.figma_integration_status,
    figma_safety_status: result.safety_status,
    figma_selected_design_task: result.selected_design_task,
    figma_dry_run: result.dry_run,
    figma_lock_released: result.lock_released,
  };
}

export async function writeFigmaOutputs(projectRoot, config, result, runLog, changedFiles) {
  const reportName = `${result.run_id}.md`;
  const logName = `${result.run_id}.json`;
  result.report_path = path.join(config.reportDir, "latest.md").replaceAll("\\", "/");
  result.report_written = true;
  result.log_written = true;
  const report = buildFigmaReport(result);
  await writeTextAtomic(projectRoot, path.join(config.reportDir, reportName).replaceAll("\\", "/"), report, changedFiles);
  await writeTextAtomic(projectRoot, result.report_path, report, changedFiles);
  runLog.result = publicSummary(result);
  runLog.audit = {
    run_id: result.run_id,
    selected_design_task: result.selected_design_task,
    dry_run: result.dry_run,
    safety_status: result.safety_status,
    integration_status: result.figma_integration_status,
    lock_released: result.lock_released,
  };
  await writeJsonAtomic(projectRoot, path.join(config.logDir, logName).replaceAll("\\", "/"), runLog, changedFiles);
  return report;
}
