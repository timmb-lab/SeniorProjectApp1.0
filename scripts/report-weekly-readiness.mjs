import { spawnSync } from "node:child_process";

const fullMode = process.argv.includes("--full");
const startedAt = new Date();
const nodeCommand = process.execPath;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const localGates = [
  ["Permission role matrix", [nodeCommand, ["scripts/verify-permission-role-matrix.mjs"], "node"]],
  ["Mutation origin coverage", [nodeCommand, ["scripts/verify-mutation-origin-coverage.mjs"], "node"]],
  ["Workspace URL state", [nodeCommand, ["scripts/verify-workspace-url-state.mjs"], "node"]],
  ["Workspace accessibility contract", [nodeCommand, ["scripts/check-workspace-accessibility-contract.mjs"], "node"]],
  ["Workspace error-state contract", [nodeCommand, ["scripts/check-workspace-error-state-contract.mjs"], "node"]],
  ["Workspace mobile contract", [nodeCommand, ["scripts/check-workspace-mobile-contract.mjs"], "node"]],
  ["Production surface leak scan", [nodeCommand, ["scripts/check-production-surfaces.mjs"], "node"]],
  ["Production route inventory", [nodeCommand, ["scripts/inventory-production-routes.mjs", "--check"], "node"]],
  ["Focused final-25 tests", [nodeCommand, ["--test", "tests/account-and-evidence-access.test.mjs", "tests/site-user-management.integration.test.mjs", "tests/workspace-app.test.mjs"], "node"]],
  ["Local fake-account pilot flow proof", [nodeCommand, ["scripts/prove-pilot-flow-local.mjs"], "node"]],
];

const fullGates = [
  ["TypeScript", [npmCommand, ["run", "typecheck"], "npm"]],
  ["Full test suite", [npmCommand, ["run", "test"], "npm"]],
  ["Full repo check", [npmCommand, ["run", "check"], "npm"]],
];

const hostedGates = [
  "check:workspace:hosted-permissions",
  "check:workspace:hosted-dashboard",
  "check:workspace:hosted-evidence",
  "mobile screenshot proof for student, mentor, Program Teacher, Site Dashboard, and Users & Access",
];

const pilotBlockers = [
  "Hosted browser proof requires fake .test credentials and an approved hosted runtime.",
  "Mobile screenshot proof needs a browser run after the current workspace build is served.",
  "Real-student pilot still needs school/district approval for SSO, support, retention, and data ownership.",
  "Archive retry/export mutation controls should stay hidden until the approved endpoint and reason policy exist.",
  "Large workspace bundle should be split after behavior stabilizes; this report keeps the bundle risk visible.",
];

function runGate(label, command, args, displayCommand = command) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
  const status = result.status === 0 ? "passed" : "failed";
  return {
    label,
    command: [displayCommand, ...args].join(" "),
    status,
    stdout: (result.stdout || "").trim().split(/\r?\n/).slice(-4),
    stderr: (result.stderr || "").trim().split(/\r?\n/).filter(Boolean).slice(-4),
  };
}

const gatePlan = fullMode ? [...localGates, ...fullGates] : localGates;
const results = gatePlan.map(([label, [command, args, displayCommand]]) => runGate(label, command, args, displayCommand));
const failed = results.filter((result) => result.status !== "passed");

console.log("# Weekly Readiness Report");
console.log(`Generated: ${startedAt.toISOString()}`);
console.log(`Mode: ${fullMode ? "full" : "standard local"}`);
console.log("");
console.log("## Local Gates");
for (const result of results) {
  console.log(`- ${result.status.toUpperCase()}: ${result.label} (${result.command})`);
  for (const line of result.stderr) console.log(`  error: ${line}`);
}
console.log("");
console.log("## Hosted And Browser Gates");
for (const gate of hostedGates) {
  console.log(`- SKIPPED BY DEFAULT: ${gate}`);
}
console.log("");
console.log("## Pilot Blockers");
for (const blocker of pilotBlockers) {
  console.log(`- ${blocker}`);
}

if (failed.length) {
  console.error("");
  console.error(`Weekly readiness failed: ${failed.length} local gate(s) failed.`);
  process.exit(1);
}

console.log("");
console.log("Weekly readiness local gates passed.");
