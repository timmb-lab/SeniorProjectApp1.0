import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const auditPath = "docs/functionality-language-audit.md";
const promptPath = "automation/prompts/functionality-ux-upgrade-hourly.md";
const verifierPath = "scripts/verify-functionality-language.mjs";
const dashboardActionVerifierPath = "scripts/verify-dashboard-actions.mjs";
const packagePath = "package.json";

const audit = await readFile(auditPath, "utf8");
const prompt = await readFile(promptPath, "utf8");
const verifier = await readFile(verifierPath, "utf8");
const dashboardActionVerifier = await readFile(dashboardActionVerifierPath, "utf8");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

test("functionality and language audit artifacts exist", () => {
  assert.equal(existsSync(auditPath), true);
  assert.equal(existsSync(promptPath), true);
  assert.equal(existsSync(verifierPath), true);
  assert.equal(existsSync(dashboardActionVerifierPath), true);
});

test("functionality and language audit includes required sections and enough repo-grounded findings", () => {
  for (const heading of [
    "## 1. Repository Identity",
    "## 3. Role Map",
    "## 4. Route Map",
    "## 5. Home Screen Language Review",
    "## 6. User-Facing Language Issues Found",
    "## 12. Improvement Table",
    "## 13. Top 20 Immediate Fixes",
    "## 14. Top 20 Functionality Upgrades",
    "## 15. Do-Not-Automate Items",
    "## 16. Testing Strategy",
    "## 17. Automation Backlog",
    "## 18. Completed Slices",
  ]) {
    assert.match(audit, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const improvementRows = audit
    .split(/\r?\n/)
    .filter((line) => /^\| [0-9]+ \|/.test(line));
  assert.equal(improvementRows.length >= 75, true, "audit should keep at least 75 concrete improvement rows");
  assert.match(audit, /Summary counts: 54 functionality\/workflow items and 26 language\/navigation\/clarity items\./);
});

test("functionality UX automation prompt is bounded and safety-focused", () => {
  assert.match(prompt, /Functionality UX Upgrade/);
  assert.match(prompt, /functionality-ux-upgrade-hourly/);
  assert.match(prompt, /complete exactly one bounded repo-grounded improvement/);
  assert.match(prompt, /Candidate Scoring Rubric/);
  assert.match(prompt, /Growth Ledger And State Rules/);
  assert.match(prompt, /Preserve authentication, authorization, tenant isolation, site isolation/);
  assert.match(prompt, /Do not fake metrics, records, routes, buttons, links, or workflow completion/);
  assert.match(prompt, /Do not push unless the triggering prompt explicitly asks for push/);
  assert.doesNotMatch(prompt, /seed:demo:remote|db:migrate:remote|reset:accounts:remote|npm run deploy/);
});

test("dashboard action verifier is registered and guards route-backed actions", () => {
  assert.equal(
    packageJson.scripts["verify:dashboard-actions"],
    "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/verify-dashboard-actions.mjs",
  );
  assert.match(dashboardActionVerifier, /href=\(\['"\]\)#/);
  assert.match(dashboardActionVerifier, /unsupported dashboard action preset/);
  assert.match(dashboardActionVerifier, /mentor-workload/);
  assert.match(dashboardActionVerifier, /program drill-down/);
  assert.match(dashboardActionVerifier, /openSiteStudentDetail/);
  assert.match(dashboardActionVerifier, /Read-only workspace/);
});

test("functionality language verifier is registered and avoids credential exposure", () => {
  assert.equal(
    packageJson.scripts["verify:functionality-language"],
    "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/verify-functionality-language.mjs",
  );
  assert.match(verifier, /Database-backed MVP/);
  assert.match(verifier, /Cloudflare target/);
  assert.match(verifier, /workspace\.js/);
  assert.doesNotMatch(`${audit}\n${prompt}\n${verifier}\n${dashboardActionVerifier}`, /BEGIN PRIVATE KEY|client_secret["':=]|refresh_token["':=]|access_token["':=]|temporaryPassword|password_hash|password_salt/i);
});
