import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(".");

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test("Phase 14 manifest records hosted browser proof caveats without remote writes", () => {
  const manifestPath = "docs/progress/runs/2026-05-24-hosted-browser-proof-screenshot-gate.json";
  assert.equal(existsSync(path.join(repoRoot, manifestPath)), true);
  const manifest = readJson(manifestPath);
  assert.equal(manifest.phase, "14");
  assert.equal(manifest.hostedStatusPreflight.hostedApiDataProofReady, true);
  assert.equal(manifest.browserProofResults.status, "HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS");
  assert.equal(manifest.credentialPathStatus, "EXISTING_FAKE_HOSTED_CREDENTIALS_USED_FOR_BROWSER_PROOF");
  assert.equal(manifest.screenshotHygiene.status, "SCREENSHOTS_GENERATED_SAFE");
  assert.equal(manifest.hostedStatusPreflight.remoteWritesPerformed, false);
  assert.equal(manifest.hostedStatusPreflight.deployPerformed, false);
  assert.equal(manifest.credentialInvestigation.credentialRepairRun, false);
});

test("screenshot index lists only existing safe screenshot artifacts", () => {
  const index = read("docs/sales/hosted-browser-proof-screenshot-index.md");
  const manifest = readJson("docs/progress/runs/2026-05-24-hosted-browser-proof-screenshot-gate.json");
  assert.match(index, /HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS/);
  assert.match(index, /SCREENSHOTS_GENERATED_SAFE/);
  assert.match(index, /No-secret confirmation/);
  assert.match(index, /Viewer read-only screenshot was not generated/);
  for (const screenshot of manifest.screenshotsGenerated.files) {
    assert.equal(existsSync(path.join(repoRoot, screenshot)), true, `${screenshot} exists`);
    assert.match(index, new RegExp(screenshot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("hosted proof docs distinguish API readiness from browser caveats", () => {
  const hostedPlan = read("docs/sales/hosted-proof-plan.md");
  const checklist = read("docs/sales/technical-proof-checklist.md");
  const preflight = read("docs/sales/demo-preflight-checklist.md");
  const remoteData = read("docs/remote-demo-data.md");
  const combined = [hostedPlan, checklist, preflight, remoteData].join("\n");
  assert.match(combined, /HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING/);
  assert.match(combined, /HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS/);
  assert.match(combined, /HOSTED_API_DATA_PROOF_READY|hosted API\/data proof is ready/i);
  assert.match(combined, /viewer browser proof/i);
  assert.doesNotMatch(combined, /current hosted proof is blocked by remote seed/i);
});

test("Phase 14 docs and scripts avoid credential leaks and readiness overclaims", () => {
  const files = [
    "README.md",
    "docs/sales/admin-demo-script.md",
    "docs/sales/admin-faq.md",
    "docs/sales/demo-preflight-checklist.md",
    "docs/sales/demo-runbook.md",
    "docs/sales/demo-screenshot-checklist.md",
    "docs/sales/hosted-browser-proof-screenshot-index.md",
    "docs/sales/hosted-proof-plan.md",
    "docs/sales/technical-proof-checklist.md",
    "docs/remote-demo-data.md",
    "docs/progress/runs/2026-05-24-hosted-browser-proof-screenshot-gate.json",
    "scripts/prove-sales-demo-hosted.mjs",
  ];
  const combined = files.map((file) => read(file)).join("\n");
  assert.doesNotMatch(combined, /CLOUDFLARE_API_TOKEN\s*=\s*[^`\s]+/);
  assert.doesNotMatch(combined, /"password"\s*:\s*"[^"]+"/i);
  assert.doesNotMatch(combined, /temporaryPassword|setupPassword/);
  assert.doesNotMatch(combined, /BEGIN PRIVATE KEY|client_secret|refresh_token|access_token/i);
  assert.doesNotMatch(combined, /\bFERPA\s+certified\b/i);
  assert.doesNotMatch(combined, /\bready\s+for\s+(a\s+)?production\s+pilot\b/i);
  assert.doesNotMatch(combined, /\bproduction\s+pilot\s+ready\b/i);
  assert.doesNotMatch(combined, /\breal\s+student\s+data\s+ready\b/i);
  assert.match(combined, /not claiming production pilot readiness/i);
  assert.match(combined, /not real student data/i);
});

test("Phase 14 did not add credential repair or remote-write aliases", () => {
  const pkg = readJson("package.json");
  const scriptEntries = Object.entries(pkg.scripts || {});
  const phase14AddedScripts = scriptEntries.filter(([name]) => /hosted:browser-demo|credential.*repair|repair.*credential/i.test(name));
  assert.deepEqual(phase14AddedScripts, []);
  const hostedScript = read("scripts/prove-sales-demo-hosted.mjs");
  assert.doesNotMatch(hostedScript, /seed:demo:remote|reset:accounts:remote|db:migrate:remote|deploy:preview|deploy:public-site/);
  assert.doesNotMatch(hostedScript, /password_hash\s*=|UPDATE\s+password_credentials|INSERT\s+INTO\s+password_credentials/i);
});
