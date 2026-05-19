import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const projectRoot = process.cwd();

function runNode(args) {
  return spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, FIGMA_EVOLUTION_ENABLED: "" },
  });
}

function parseDoctorJson(stdout) {
  const start = stdout.indexOf("{");
  assert.notEqual(start, -1, `Expected JSON in stdout, got: ${stdout}`);
  return JSON.parse(stdout.slice(start));
}

test("doctor reports UNKNOWN_REGISTRY_UNINSPECTABLE when repo-local registry evidence is absent", () => {
  const result = runNode([
    "automation/qol/doctor.mjs",
    "--registry-evidence",
    "tests/fixtures/not-present-registry-evidence.json",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const json = parseDoctorJson(result.stdout);
  assert.equal(json.safety_status, "UNKNOWN_REGISTRY_UNINSPECTABLE");
  assert.equal(json.automationRegistry.automation_registry_inspectable, false);
  assert.equal(json.guiInvocationContract.status, "pass");
  assert.match(
    json.guiInvocationContract.expectedOrchestratorCommand,
    /scripts\\run-node-script\.ps1 automation\\qol\\hourly-orchestrator\.mjs/,
  );
});

test("doctor fails when GUI command doc schedules direct node execution", () => {
  const result = runNode([
    "automation/qol/doctor.mjs",
    "--registry-evidence",
    "tests/fixtures/not-present-registry-evidence.json",
    "--gui-allowed-commands",
    "tests/fixtures/qol-gui-allowed-commands-direct-node.md",
  ]);
  assert.equal(result.status, 21, result.stdout);
  const json = parseDoctorJson(result.stdout);
  assert.equal(json.guiInvocationContract.status, "fail");
  assert.match(
    json.guiInvocationContract.findings.join("\n"),
    /Direct node scheduled command found/,
  );
});

test("doctor fails when GUI command doc references legacy Senior Capstone automations", () => {
  const result = runNode([
    "automation/qol/doctor.mjs",
    "--registry-evidence",
    "tests/fixtures/not-present-registry-evidence.json",
    "--gui-allowed-commands",
    "tests/fixtures/qol-gui-allowed-commands-legacy.md",
  ]);
  assert.equal(result.status, 21, result.stdout);
  const json = parseDoctorJson(result.stdout);
  assert.equal(json.guiInvocationContract.status, "fail");
  assert.match(
    json.guiInvocationContract.findings.join("\n"),
    /senior-capstone-qol-source-framework-seed-2/,
  );
});

test("doctor fails when mock evidence has more than one active Senior Capstone automation", () => {
  const result = runNode([
    "automation/qol/doctor.mjs",
    "--registry-evidence",
    "tests/fixtures/qol-registry-multiple-active.json",
  ]);
  assert.equal(result.status, 21, result.stdout);
  const json = parseDoctorJson(result.stdout);
  assert.equal(json.safety_status, "FAIL");
  assert.equal(json.automationRegistry.active_senior_capstone_automation_count, 2);
  assert.match(json.automationRegistry.failure_reason, /Expected exactly one active/);
});

test("doctor fails when mock evidence has an active legacy Senior Capstone automation", () => {
  const result = runNode([
    "automation/qol/doctor.mjs",
    "--registry-evidence",
    "tests/fixtures/qol-registry-legacy-active.json",
  ]);
  assert.equal(result.status, 21, result.stdout);
  const json = parseDoctorJson(result.stdout);
  assert.equal(json.safety_status, "FAIL");
  assert.equal(json.automationRegistry.legacy_automation_count_active, 1);
  assert.match(json.automationRegistry.failure_reason, /Legacy Senior Capstone automations are active/);
});

test("orchestrator writes latest report with lock release and orchestrator path audit fields", async () => {
  const latestPath = "automation/qol/reports/latest.md";
  const beforeMtime = existsSync(latestPath) ? statSync(latestPath).mtimeMs : 0;
  const result = runNode([
    "automation/qol/hourly-orchestrator.mjs",
    "--registry-evidence",
    "tests/fixtures/qol-registry-single-active.json",
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(existsSync(latestPath), "latest.md should exist after orchestrator run");
  const afterMtime = statSync(latestPath).mtimeMs;
  assert.ok(afterMtime >= beforeMtime, "latest.md mtime should be preserved or advanced");
  const latest = await readFile(latestPath, "utf8");
  assert.match(latest, /- orchestrator_path: `automation\/qol\/hourly-orchestrator\.mjs`/);
  assert.match(latest, /- invocation_adapter: `scripts\/run-node-script\.ps1`/);
  assert.match(latest, /- wrapper_required: `true`/);
  assert.match(latest, /- direct_node_execution_allowed: `false`/);
  assert.match(latest, /- scheduled_gui_canary_status: `PENDING_NEXT_TOP_OF_HOUR`/);
  assert.match(latest, /- lock_released: `true`/);
  assert.match(latest, /- report_written: `true`/);
  assert.match(latest, /- automation_registry_inspectable: `true`/);
  assert.match(latest, /- safety_status: `PASS`/);
  assert.match(latest, /- active_senior_capstone_automation_count: `1`/);
});
