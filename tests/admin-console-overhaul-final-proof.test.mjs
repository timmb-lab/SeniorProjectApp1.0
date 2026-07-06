import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const reportPath = "docs/progress/runs/2026-07-06-admin-console-overhaul-final-proof.md";
const manifestPath = "docs/progress/runs/2026-07-06-admin-console-overhaul-browser-proof.json";
const screenshotDir = "docs/sales/screenshots/2026-07-06-admin-console-overhaul";

function read(file) {
  return readFileSync(path.join(repoRoot, file), "utf8");
}

test("admin console overhaul final proof preserves stage coverage and no-go status", () => {
  const report = read(reportPath);
  const readme = read("docs/progress/runs/README.md");

  for (const phrase of [
    "Admin Console Overhaul Final Proof",
    "Implemented every phase",
    "Stage 00",
    "Stage 13",
    "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF",
    "46 passed, 0 failed",
    "NO_GO_REAL_STUDENT_PILOT",
    "NOT_CLAIMED_READY",
    "This does not claim real-student pilot readiness.",
    "role_scoped_pilot_account_proof",
    "sso_or_managed_local_credential_delivery",
    "Final validation passed",
    "test: close admin console overhaul proof",
  ]) {
    assert.match(report, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${phrase} missing from report`);
  }

  assert.match(readme, /2026-07-06-admin-console-overhaul-final-proof\.md/);
  assert.match(readme, /2026-07-06-admin-console-overhaul-browser-proof\.json/);
});

test("admin console overhaul browser manifest keeps fake-account boundary and screenshot coverage", () => {
  const manifest = JSON.parse(read(manifestPath));
  assert.equal(manifest.proof, "workspace_ui_polish_local_browser");
  assert.equal(manifest.verdict, "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF");
  assert.equal(manifest.fakeDataOnly, true);
  assert.equal(manifest.realStudentProductionStatus, "NOT_CLAIMED_READY");
  assert.match(manifest.claimBoundary, /Does not prove real-student pilot readiness/);
  assert.equal(manifest.screenshotDir, screenshotDir);
  assert.equal(manifest.manifestPath, manifestPath);
  assert.equal(Array.isArray(manifest.failures), true);
  assert.equal(manifest.failures.length, 0);
  assert.equal(Array.isArray(manifest.screenshots), true);
  assert.equal(manifest.screenshots.length, 46);

  for (const screenshot of manifest.screenshots) {
    assert.equal(screenshot.checks.expectedTextPresent, true, `${screenshot.id} expected text`);
    assert.equal(screenshot.checks.noVisiblePasswordValues, true, `${screenshot.id} password values`);
    assert.equal(screenshot.checks.noSecretLikeText, true, `${screenshot.id} secret-like text`);
    assert.equal(existsSync(path.join(repoRoot, screenshot.screenshot)), true, `${screenshot.screenshot} exists`);
    assert.match(screenshot.caveat, /not real-student production pilot proof/);
  }
});
