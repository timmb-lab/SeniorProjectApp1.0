import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(".");
const manifestPath = "docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json";
const screenshotIndexPath = "docs/sales/hosted-browser-proof-screenshot-index.md";

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test("hosted fake pilot browser manifest records green role coverage", () => {
  assert.equal(existsSync(path.join(repoRoot, manifestPath)), true);
  const manifest = readJson(manifestPath);
  assert.equal(manifest.proof, "hosted_fake_pilot_browser");
  assert.equal(manifest.baseUrl, "https://senior-capstone-app.pages.dev");
  assert.equal(manifest.verdict, "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF");
  assert.equal(manifest.realStudentProductionStatus, "NOT_CLAIMED_READY");
  assert.deepEqual(manifest.failures, []);
  if (manifest.health) {
    assert.equal(manifest.health.databaseReady, true);
    assert.equal(
      manifest.health.studentRosterProfilesReady === true
        || manifest.health.studentRosterProfilesReady === "not_reported_by_deployed_health",
      true,
    );
  }

  const roles = manifest.screenshots.map((screenshot) => screenshot.role);
  assert.deepEqual(roles, [
    "signed_out",
    "student",
    "program_teacher",
    "mentor",
    "viewer",
    "site_admin",
    "admin",
    "misc_admin",
    "student"
  ]);

  for (const screenshot of manifest.screenshots) {
    assert.equal(screenshot.checks.expectedTextPresent, true, `${screenshot.id} expected text`);
    assert.equal(screenshot.checks.noVisiblePasswordValues, true, `${screenshot.id} password values`);
    assert.equal(screenshot.checks.noSecretLikeText, true, `${screenshot.id} secret-like text`);
    assert.equal(existsSync(path.join(repoRoot, screenshot.screenshot)), true, `${screenshot.screenshot} exists`);
  }
});

test("screenshot index lists current hosted fake-account screenshot artifacts", () => {
  const index = read(screenshotIndexPath);
  const manifest = readJson(manifestPath);
  assert.match(index, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(index, /HOSTED_FAKE_ACCOUNTS_USED_FOR_BROWSER_PROOF/);
  assert.match(index, /SCREENSHOTS_GENERATED_SAFE/);
  assert.match(index, /No-secret confirmation/);
  assert.match(index, /\| File \| Persona \| Account type \| Screen \| Claim boundary \| Notes \|/);
  assert.match(index, /Fake `\.test` demo-only account/);
  assert.match(index, /Fake-account click-around proof only/);
  assert.match(index, /Safe hosted screenshot, not real-student proof/);
  assert.match(index, /Hosted fake-account click-around demo readiness only/i);
  assert.match(index, /student_archive_manifest_download/);
  assert.match(index, /Future pilot item/i);
  assert.doesNotMatch(index, /Viewer read-only screenshot was not generated/);
  assert.doesNotMatch(index, /viewer browser proof.*blocked/i);

  for (const screenshot of manifest.screenshots) {
    assert.match(index, new RegExp(screenshot.screenshot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("hosted proof docs distinguish fake-account pilot readiness from real-student production", () => {
  const files = [
    "README.md",
    "docs/remote-demo-data.md",
    "docs/sales/admin-demo-script.md",
    "docs/sales/admin-faq.md",
    "docs/sales/demo-day-operator-script.md",
    "docs/sales/demo-preflight-checklist.md",
    "docs/sales/demo-runbook.md",
    "docs/sales/demo-screenshot-checklist.md",
    "docs/sales/hosted-browser-proof-screenshot-index.md",
    "docs/sales/hosted-proof-plan.md",
    "docs/sales/technical-proof-checklist.md"
  ];
  const combined = files.map((file) => read(file)).join("\n");
  assert.match(combined, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(combined, /HOSTED_FAKE_ACCOUNT_PILOT_GREEN/);
  assert.match(combined, /Hosted fake-account click-around demo readiness/);
  assert.match(combined, /Real-student production pilot readiness/);
  assert.match(combined, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(combined, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(combined, /demo-day-operator-script\.md/);
  assert.match(combined, /studentRosterProfilesReady=true/);
  assert.match(combined, /signed-out, Student, Program Teacher, Mentor, Viewer, Site Admin, Admin, misc_admin, and mobile Student/i);
  assert.match(combined, /not Real-student production pilot readiness|not real-student production readiness|real-student production is not claimed|Real-student production pilot readiness:\s*No-go/i);
  assert.match(combined, /SSO, support, retention, data ownership/i);
  assert.match(combined, /student_archive_manifest_download/);
  assert.match(combined, /already-applied Health signal/i);
  assert.doesNotMatch(combined, /viewer browser proof.*blocked/i);
  assert.doesNotMatch(combined, /safe existing fake hosted credential file has no viewer account/i);
  assert.doesNotMatch(combined, /\bproduction\s+pilot\s+ready\b/i);
  assert.doesNotMatch(combined, /\breal\s+student\s+data\s+ready\b/i);
  assert.doesNotMatch(combined, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student production/i);
  assert.doesNotMatch(combined, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
});

test("hosted browser proof docs and script avoid credential leaks and unsafe write aliases", () => {
  const files = [
    "README.md",
    "docs/remote-demo-data.md",
    "docs/sales/admin-demo-script.md",
    "docs/sales/admin-faq.md",
    "docs/sales/demo-day-operator-script.md",
    "docs/sales/demo-preflight-checklist.md",
    "docs/sales/demo-runbook.md",
    "docs/sales/demo-screenshot-checklist.md",
    "docs/sales/hosted-browser-proof-screenshot-index.md",
    "docs/sales/hosted-proof-plan.md",
    "docs/sales/technical-proof-checklist.md",
    manifestPath,
    "scripts/prove-hosted-fake-pilot-browser.mjs"
  ];
  const combined = files.map((file) => read(file)).join("\n");
  assert.doesNotMatch(combined, /CLOUDFLARE_API_TOKEN\s*=\s*[^`\s]+/);
  assert.doesNotMatch(combined, /"password"\s*:\s*"[^"]+"/i);
  assert.doesNotMatch(combined, /temporaryPassword|setupPassword/);
  assert.doesNotMatch(combined, /-----BEGIN PRIVATE KEY-----/);
  assert.doesNotMatch(combined, /client_secret\s*[:=]\s*["'][^"']+/i);
  assert.doesNotMatch(combined, /refresh_token\s*[:=]\s*["'][^"']+/i);
  assert.doesNotMatch(combined, /access_token\s*[:=]\s*["'][^"']+/i);
  assert.doesNotMatch(combined, /\bFERPA\s+certified\b/i);

  const browserScript = read("scripts/prove-hosted-fake-pilot-browser.mjs");
  assert.match(browserScript, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016/);
  assert.match(browserScript, /studentRosterProfilesReady/);
  assert.match(browserScript, /approved deployment\/migration gate outside the live demo/);
  assert.doesNotMatch(browserScript, /seed:demo:remote|reset:accounts:remote|db:migrate:remote|deploy:preview|deploy:public-site/);
  assert.doesNotMatch(browserScript, /password_hash\s*=|UPDATE\s+password_credentials|INSERT\s+INTO\s+password_credentials/i);
});
