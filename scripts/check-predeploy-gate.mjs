#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageScripts = packageJson.scripts || {};
const predeployChecklist = await readFile("docs/production-predeploy-checklist.md", "utf8");
const readme = await readFile("README.md", "utf8");
const runNpmScript = await readFile("scripts/run-npm-script.ps1", "utf8");
const checkCloudflare = await readFile("scripts/check-cloudflare.mjs", "utf8");

const failures = [];

const requiredGateScripts = [
  "check:predeploy-gate",
  "check:production-surfaces",
  "check:route-inventory",
  "check:generated-output-drift",
  "check:site-options",
  "check:cloudflare",
  "test",
  "check",
];

const liveOnlyScripts = [
  "check:cloudflare:live",
];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function hasWrapperCommand(text, scriptName) {
  const escapedScript = scriptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`run-npm-script\\.ps1\\s+${escapedScript}(?:\\s|\\r?\\n|$)`, "i");
  return pattern.test(text);
}

function hasNpmCommand(text, scriptName) {
  const escapedScript = scriptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`npm\\s+run\\s+${escapedScript}(?:\\s|\\r?\\n|$)`, "i").test(text);
}

for (const scriptName of [...requiredGateScripts, ...liveOnlyScripts]) {
  assert(Boolean(packageScripts[scriptName]), `package.json is missing script '${scriptName}'`);
}

assert(
  packageScripts["check:predeploy-gate"] === "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-npm-script.ps1 check:predeploy-gate",
  "package.json check:predeploy-gate must use the project PowerShell wrapper",
);

assert(
  /Invoke-Node\s+"scripts\\check-predeploy-gate\.mjs"/.test(runNpmScript),
  "aggregate check must run scripts\\check-predeploy-gate.mjs",
);

assert(
  /"check:predeploy-gate"\s*\{[\s\S]*?Invoke-Node\s+"scripts\\check-predeploy-gate\.mjs"/.test(runNpmScript),
  "scripts/run-npm-script.ps1 must expose check:predeploy-gate",
);

for (const scriptName of requiredGateScripts) {
  assert(
    hasWrapperCommand(predeployChecklist, scriptName),
    `docs/production-predeploy-checklist.md local gate is missing wrapper command for '${scriptName}'`,
  );
}

for (const scriptName of ["check:predeploy-gate", "check:production-surfaces", "check:route-inventory", "check:generated-output-drift", "check"]) {
  assert(
    hasNpmCommand(readme, scriptName),
    `README.md predeploy gate is missing npm command for '${scriptName}'`,
  );
}

for (const scriptName of liveOnlyScripts) {
  assert(
    hasWrapperCommand(predeployChecklist, scriptName),
    `docs/production-predeploy-checklist.md live gate is missing wrapper command for '${scriptName}'`,
  );
}

const staticLivePhrases = [
  "static checks may pass locally, but live Cloudflare checks are not complete unless `CLOUDFLARE_API_TOKEN` is available",
  "Cloudflare GitHub integration may automatically deploy after pushes to `main`.",
  "That integration is Cloudflare-side and does not give the local Codex/Wrangler shell Cloudflare API credentials.",
  "The repo's static checks do not require `CLOUDFLARE_API_TOKEN`.",
  "Remote Pages/D1 verification requires `CLOUDFLARE_API_TOKEN` in the environment, plus any required account/project identifiers, or a repo-supported authenticated Cloudflare connector if a script is explicitly written to use one.",
  "If no local token/auth path is present, live verification must report `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`.",
  "Git push success is not the same as live Cloudflare verification success.",
  "Cloudflare GitHub auto-deploy success is not the same as Codex local live verification success unless the script verifies the live URL/API/D1 state.",
  "This is static proof only. It does not prove the live Pages project",
  "If the token is missing, record `LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN`. Do not claim live verification passed.",
  "Do not treat static local checks as API health proof.",
];

for (const phrase of staticLivePhrases) {
  assert(
    predeployChecklist.includes(phrase),
    `docs/production-predeploy-checklist.md is missing static/live Cloudflare guardrail phrase: ${phrase}`,
  );
}

const readmeCredentialPhrases = [
  "Cloudflare GitHub integration may automatically deploy after pushes to `main`.",
  "That integration is Cloudflare-side and does not give the local Codex/Wrangler shell Cloudflare API credentials.",
  "`check:cloudflare:live` requires `CLOUDFLARE_API_TOKEN`",
  "Git push success is not live Cloudflare verification success.",
];

for (const phrase of readmeCredentialPhrases) {
  assert(
    readme.includes(phrase),
    `README.md is missing Cloudflare credential-model phrase: ${phrase}`,
  );
}

assert(
  /const hasToken = Boolean\(process\.env\.CLOUDFLARE_API_TOKEN\)/.test(checkCloudflare),
  "check-cloudflare.mjs must gate live verification on CLOUDFLARE_API_TOKEN",
);
assert(
  /LIVE_CLOUDFLARE_BLOCKED_NO_TOKEN/.test(checkCloudflare),
  "check-cloudflare.mjs must print the missing-token live blocker code",
);
assert(
  /GitHub-connected Pages deployment may still run after pushes/.test(checkCloudflare),
  "check-cloudflare.mjs must explain GitHub-connected deployment is separate from local live verification",
);
assert(
  /local Codex\/Wrangler session cannot inspect remote Pages\/D1 state without Cloudflare API auth/.test(checkCloudflare),
  "check-cloudflare.mjs must explain local live verification needs Cloudflare API auth",
);
assert(
  /Static Wrangler configuration passed; live Pages\/D1 existence was not verified/.test(checkCloudflare),
  "check-cloudflare.mjs must say static passed while live was not verified",
);
assert(
  /if \(liveRequired\) \{[\s\S]*?process\.exit\(1\)/.test(checkCloudflare),
  "check-cloudflare.mjs must fail check:cloudflare:live when live verification is required and token is missing",
);

if (failures.length > 0) {
  console.error("Predeploy gate consistency check failed.");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Predeploy gate consistency check passed: package scripts, checklist commands, README commands, and Cloudflare static/live wording are aligned.");
