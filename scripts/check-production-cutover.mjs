#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const runner = path.join(repoRoot, "scripts", "run-npm-script.ps1");

const commands = [
  ["check:predeploy-gate"],
  ["check:production-surfaces"],
  ["check:route-inventory"],
  ["check:generated-output-drift"],
  ["check:site-options"],
  ["check:cloudflare"],
  ["check:custom-domain-cutover", "--live-required", "--live-http"],
  ["check:alpha-account-gating"],
  ["check:workspace:hosted-dashboard"],
  ["check:workspace:hosted-permissions"],
  ["check:workspace:hosted-evidence"],
  ["check:drive:live"],
  ["typecheck"],
  ["test"],
  ["check"],
];

function redact(text) {
  return String(text || "")
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/Authorization:\s*Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Authorization: Bearer [REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{24,}/gi, "Bearer [REDACTED]")
    .replace(/(["']?(?:token|secret|client_secret|private_key|password|sc_session)["']?\s*[:=]\s*["'])[^"'\r\n]{4,}(["'])/gi, "$1[REDACTED]$2");
}

function classify(output, status) {
  if (status === 0) return "pass";
  if (/BLOCKED|NO_TOKEN|INSUFFICIENT_SCOPE|MISSING_CLOUDFLARE_PAGES_PERMISSION|DNS_OR_TLS_PENDING|CUSTOM_DOMAIN_CUTOVER_NOT_VERIFIED/i.test(output)) {
    return "block";
  }
  return "fail";
}

let failed = false;

for (const command of commands) {
  const label = `npm run ${command.join(" ")}`;
  console.log(`PRODUCTION_CUTOVER_COMMAND_START ${label}`);
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    runner,
    ...command,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });

  const output = redact(`${result.stdout || ""}\n${result.stderr || ""}`.trim());
  if (output) {
    console.log(output);
  }

  const status = typeof result.status === "number" ? result.status : 1;
  const classification = classify(output, status);
  console.log(`PRODUCTION_CUTOVER_COMMAND_${classification.toUpperCase()} ${label} exit=${status}`);
  if (classification !== "pass") {
    failed = true;
  }
}

if (failed) {
  console.error("PRODUCTION_CUTOVER_NOT_VERIFIED one or more required cutover commands failed or are blocked.");
  process.exit(1);
}

console.log("PRODUCTION_CUTOVER_VERIFIED all configured production cutover commands passed.");
