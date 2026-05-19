import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, rm } from "node:fs/promises";
import test from "node:test";
import { loadConfig, planDesignTask } from "../automation/figma/plan.mjs";

const projectRoot = process.cwd();

function mergedEnv(overrides = {}) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) delete env[key];
    else env[key] = value;
  }
  return env;
}

function runNode(args, env = {}) {
  return spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    env: mergedEnv(env),
  });
}

function parseJson(stdout) {
  const start = stdout.indexOf("{");
  assert.notEqual(start, -1, `Expected JSON in stdout, got: ${stdout}`);
  return JSON.parse(stdout.slice(start));
}

async function caseEnv(name, extra = {}) {
  const base = `automation/figma/fixtures/test-output/${name}`;
  await rm(base, { recursive: true, force: true });
  return {
    base,
    env: {
      FIGMA_STATE_DIR: `${base}/state`,
      FIGMA_LOG_DIR: `${base}/logs`,
      FIGMA_REPORT_DIR: `${base}/reports`,
      FIGMA_PATCH_DIR: `${base}/patches`,
      FIGMA_FIXTURE_DIR: `${base}/fixtures`,
      ...extra,
    },
  };
}

async function readLatest(base) {
  return readFile(`${base}/reports/latest.md`, "utf8");
}

test("Figma doctor reports SKIPPED_DISABLED when FIGMA_EVOLUTION_ENABLED is not true", () => {
  const result = runNode(["automation/figma/doctor.mjs"], {
    FIGMA_EVOLUTION_ENABLED: "",
  });
  assert.equal(result.status, 0, result.stderr);
  const json = parseJson(result.stdout);
  assert.equal(json.safety_status, "SKIPPED_DISABLED");
  assert.equal(json.figma_lane_enabled, false);
});

test("Figma doctor reports reachable and unreachable integration honestly", () => {
  const reachable = runNode(["automation/figma/doctor.mjs"], {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mock",
  });
  assert.equal(reachable.status, 0, reachable.stderr);
  const reachableJson = parseJson(reachable.stdout);
  assert.equal(reachableJson.figma_tool_reachable, true);
  assert.equal(reachableJson.figma_integration_status, "FIGMA_MCP_WRITE_AVAILABLE");

  const unreachable = runNode(["automation/figma/doctor.mjs"], {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mcp",
    FIGMA_MCP_WRITER_PATH: null,
  });
  assert.equal(unreachable.status, 0, unreachable.stderr);
  const unreachableJson = parseJson(unreachable.stdout);
  assert.equal(unreachableJson.figma_tool_reachable, false);
  assert.equal(unreachableJson.figma_integration_status, "FIGMA_AUTHORIZED_BUT_TOOL_UNREACHABLE");
});

test("Figma hourly orchestrator writes automation/figma/reports/latest.md", async () => {
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], {
    FIGMA_EVOLUTION_ENABLED: "",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync("automation/figma/reports/latest.md"));
  const report = await readFile("automation/figma/reports/latest.md", "utf8");
  assert.match(report, /orchestrator_path: `automation\/figma\/hourly-figma-orchestrator\.mjs`/);
});

test("Figma hourly orchestrator records lock release", async () => {
  const { base, env } = await caseEnv("lock-release", {
    FIGMA_EVOLUTION_ENABLED: "",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const report = await readLatest(base);
  assert.match(report, /- lock_acquired: `true`/);
  assert.match(report, /- lock_released: `true`/);
  assert.equal(existsSync(`${base}/state/lock`), false);
  await rm(base, { recursive: true, force: true });
});

test("Figma lock release is recorded even on simulated failure", async () => {
  const { base, env } = await caseEnv("simulated-failure", {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_SIMULATE_FAILURE: "after-lock",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 1);
  const report = await readLatest(base);
  assert.match(report, /- lock_released: `true`/);
  assert.match(report, /- safety_status: `FAIL`/);
  assert.equal(existsSync(`${base}/state/lock`), false);
  await rm(base, { recursive: true, force: true });
});

test("Dry-run mode never claims that Figma was mutated", async () => {
  const { base, env } = await caseEnv("dry-run", {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mcp",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const report = await readLatest(base);
  assert.match(report, /- dry_run: `true`/);
  assert.match(report, /No Figma canvas mutation was applied/);
  assert.doesNotMatch(report, /Applied one sandbox operation/);
  await rm(base, { recursive: true, force: true });
});

test("Selected design task advances state", async () => {
  const { base, env } = await caseEnv("state-advances", {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mcp",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(await readFile(`${base}/state/state.json`, "utf8"));
  assert.equal(state.last_selected_task, "FIGMA-001");
  assert.ok(state.proposed_design_tasks.includes("FIGMA-001"));
  assert.equal(state.total_dry_runs, 1);
  await rm(base, { recursive: true, force: true });
});

test("The main QoL latest report includes Figma lane status", async () => {
  const result = runNode([
    "automation/qol/hourly-orchestrator.mjs",
    "--registry-evidence",
    "tests/fixtures/qol-registry-single-active.json",
  ], {
    FIGMA_EVOLUTION_ENABLED: "",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = await readFile("automation/qol/reports/latest.md", "utf8");
  assert.match(report, /## Figma Lane/);
  assert.match(report, /- figma_lane_enabled: `false`/);
  assert.match(report, /- figma_safety_status: `SKIPPED_DISABLED`/);
});

test("Secrets are never printed in Figma reports or logs", async () => {
  const secret = "figma-secret-value-should-not-print";
  const { base, env } = await caseEnv("secrets", {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mcp",
    FIGMA_FILE_KEY: secret,
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const report = await readLatest(base);
  const logs = await readdir(`${base}/logs`);
  const logText = await readFile(`${base}/logs/${logs.find((name) => name.endsWith(".json"))}`, "utf8");
  assert.doesNotMatch(report, new RegExp(secret));
  assert.doesNotMatch(logText, new RegExp(secret));
  await rm(base, { recursive: true, force: true });
});

test("Report includes orchestrator_path: automation/figma/hourly-figma-orchestrator.mjs", async () => {
  const { base, env } = await caseEnv("orchestrator-path", {
    FIGMA_EVOLUTION_ENABLED: "",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const report = await readLatest(base);
  assert.match(report, /orchestrator_path: `automation\/figma\/hourly-figma-orchestrator\.mjs`/);
  await rm(base, { recursive: true, force: true });
});

test("Disabled lane reports SKIPPED_DISABLED", async () => {
  const { base, env } = await caseEnv("disabled", {
    FIGMA_EVOLUTION_ENABLED: "",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const report = await readLatest(base);
  assert.match(report, /- safety_status: `SKIPPED_DISABLED`/);
  await rm(base, { recursive: true, force: true });
});

test("Mock enabled lane produces deterministic applied_change_summary without touching real Figma", async () => {
  const { base, env } = await caseEnv("mock", {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mock",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const report = await readLatest(base);
  assert.match(
    report,
    /Mock Figma writer accepted one sandbox operation for FIGMA-001 on Senior Capstone Automation Lab \/ Hourly Figma Evolution; no real Figma file was touched/,
  );
  await rm(base, { recursive: true, force: true });
});

test("Only one design task is selected per run", async () => {
  const { base, env } = await caseEnv("one-task", {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mock",
  });
  const result = runNode(["automation/figma/hourly-figma-orchestrator.mjs"], env);
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(await readFile(`${base}/state/state.json`, "utf8"));
  assert.deepEqual(state.completed_design_tasks, ["FIGMA-001"]);
  await rm(base, { recursive: true, force: true });
});

test("Disallowed destructive actions are rejected by the planner layer", () => {
  const config = loadConfig(projectRoot, {
    FIGMA_EVOLUTION_ENABLED: "true",
    FIGMA_MODE: "mcp",
  });
  assert.throws(
    () =>
      planDesignTask(
        {
          id: "BAD-001",
          title: "Delete production page",
          template: "bad",
          allowed_actions: ["delete_page"],
          status: "ready",
        },
        config,
        { runId: "test", startedAt: "2026-05-19T00:00:00.000Z" },
      ),
    /disallowed|destructive/i,
  );
});
