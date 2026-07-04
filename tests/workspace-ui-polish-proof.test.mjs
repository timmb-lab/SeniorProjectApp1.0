import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(".");
const scriptPath = "scripts/prove-workspace-ui-polish.mjs";
const manifestPath = "docs/progress/runs/2026-06-30-workspace-ui-polish-browser-proof.json";
const screenshotIndexPath = "docs/sales/workspace-ui-polish-screenshot-index.md";
const screenshotDir = "docs/sales/screenshots/2026-06-30-ui-polish";

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("workspace UI polish proof script and package alias exist", () => {
  assert.equal(existsSync(path.join(repoRoot, scriptPath)), true);
  const pkg = readJson("package.json");
  assert.equal(
    pkg.scripts["prove:workspace-ui-polish"],
    "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/prove-workspace-ui-polish.mjs",
  );

  const script = read(scriptPath);
  assert.match(script, /workspace_ui_polish_local_browser/);
  assert.match(script, /GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF/);
  assert.match(script, /WORKSPACE_UI_POLISH_BASE_URL/);
  assert.match(script, /admin-console-local-browser-accounts\.json/);
  assert.match(script, /realStudentProductionStatus:\s*"NOT_CLAIMED_READY"/);
  assert.match(script, /Local fake-account browser UI proof only/);
  assert.doesNotMatch(script, /seed:demo:remote|reset:accounts:remote|db:migrate:remote|deploy:preview|deploy:public-site/);
  assert.doesNotMatch(script, /password_hash\s*=|UPDATE\s+password_credentials|INSERT\s+INTO\s+password_credentials/i);
});

test("workspace UI polish manifest records durable local fake-account screenshot coverage", () => {
  assert.equal(existsSync(path.join(repoRoot, manifestPath)), true);
  const manifest = readJson(manifestPath);
  assert.equal(manifest.proof, "workspace_ui_polish_local_browser");
  assert.equal(manifest.verdict, "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF");
  assert.equal(manifest.fakeDataOnly, true);
  assert.equal(manifest.realStudentProductionStatus, "NOT_CLAIMED_READY");
  assert.match(manifest.claimBoundary, /Does not prove real-student pilot readiness/);
  assert.equal(manifest.screenshotDir, screenshotDir);
  assert.equal(manifest.manifestPath, manifestPath);
  assert.deepEqual(manifest.failures, []);
  assert.equal(Array.isArray(manifest.screenshots), true);
  const requiredIds = [
    "01-admin-console-global-admin-desktop",
    "02-workspace-site-admin-desktop",
    "03-program-teacher-workspace",
    "04-mentor-workspace",
    "05-viewer-read-only-workspace",
    "06-student-today-desktop",
    "07-student-today-phone",
    "08-staff-view-as-student-phone",
    "09-admin-console-half-screen",
    "10-workspace-half-screen",
    "11-drawer-open-phone",
    "12-drawer-open-half-screen",
    "13-site-admin-student-detail-click",
    "14-viewer-read-only-detail-click",
    "15-view-as-student-entered-desktop",
    "16-view-as-student-exited-return",
    "17-people-access-landing",
    "18-add-student-flow",
    "19-csv-import-template",
    "20-student-admin-route-blocked",
    "21-empty-student-search",
    "22-student-final-files-state",
    "24-student-my-work-desktop",
    "25-student-feedback-desktop",
    "23-student-detail-phone",
  ];
  assert.equal(manifest.screenshots.length, requiredIds.length);
  assert.deepEqual(manifest.screenshots.map((screenshot) => screenshot.id), requiredIds);

  for (const screenshot of manifest.screenshots) {
    assert.equal(typeof screenshot.persona, "string", `${screenshot.id} persona`);
    assert.equal(typeof screenshot.role, "string", `${screenshot.id} role`);
    assert.equal(typeof screenshot.accountType, "string", `${screenshot.id} account type`);
    assert.match(screenshot.accountType, /Fake \.test|read-only preview/, `${screenshot.id} fake account boundary`);
    assert.equal(typeof screenshot.viewport?.width, "number", `${screenshot.id} viewport width`);
    assert.equal(typeof screenshot.viewport?.height, "number", `${screenshot.id} viewport height`);
    assert.match(screenshot.caveat, /not real-student production pilot proof/i, `${screenshot.id} caveat`);
    assert.equal(screenshot.checks.expectedTextPresent, true, `${screenshot.id} expected text`);
    assert.equal(screenshot.checks.noUnexpectedText, true, `${screenshot.id} unexpected text`);
    assert.equal(screenshot.checks.noVisiblePasswordValues, true, `${screenshot.id} password values`);
    assert.equal(screenshot.checks.noSecretLikeText, true, `${screenshot.id} secret-like text`);
    assert.equal(screenshot.checks.noHorizontalOverflow, true, `${screenshot.id} horizontal overflow`);
    assert.equal(screenshot.checks.drawerOpenWhenRequested, true, `${screenshot.id} drawer check`);
    assert.equal(typeof screenshot.markers, "object", `${screenshot.id} markers`);
    const absoluteScreenshot = path.join(repoRoot, screenshot.screenshot);
    assert.equal(existsSync(absoluteScreenshot), true, `${screenshot.screenshot} exists`);
    assert.ok(statSync(absoluteScreenshot).size > 10_000, `${screenshot.screenshot} is not blank`);
  }
  const byId = new Map(manifest.screenshots.map((screenshot) => [screenshot.id, screenshot]));
  assert.equal(byId.get("13-site-admin-student-detail-click").markers.studentDetailPanel, true);
  assert.equal(byId.get("14-viewer-read-only-detail-click").markers.readOnlyBoundary, true);
  assert.equal(byId.get("15-view-as-student-entered-desktop").markers.viewAsBanner, true);
  assert.equal(byId.get("16-view-as-student-exited-return").markers.viewAsBanner, false);
  assert.equal(byId.get("17-people-access-landing").markers.peopleManagement, true);
  assert.equal(byId.get("19-csv-import-template").markers.csvImportStepper, true);
  assert.equal(byId.get("20-student-admin-route-blocked").markers.problemState, true);
  assert.equal(byId.get("21-empty-student-search").markers.intentionalEmptyState, true);
  assert.equal(byId.get("22-student-final-files-state").markers.finalFiles, true);
});

test("workspace UI polish screenshot index preserves fake-account and no-go caveats", () => {
  const index = read(screenshotIndexPath);
  const manifest = readJson(manifestPath);
  assert.match(index, /GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF/);
  assert.match(index, /local fake-account demo UI state only/i);
  assert.match(index, /Real-student pilot remains \*\*NO-GO\*\*/);
  assert.match(index, /student_archive_manifest_download/);
  assert.match(index, /future\/not-ready pilot item/i);
  assert.match(index, /Upload-heavy hosted evidence proof is intentionally separate/i);
  assert.match(index, /\| File \| Persona \| Role \| Account type \| Viewport \| What the screenshot proves \| Caveat \|/);
  assert.doesNotMatch(index, /\breal[- ]student production pilot readiness is ready\b/i);
  assert.doesNotMatch(index, /\bproduction\s+pilot\s+ready\b/i);

  for (const screenshot of manifest.screenshots) {
    assert.match(index, new RegExp(escapeRegex(screenshot.screenshot)), `${screenshot.id} listed in index`);
  }
});
