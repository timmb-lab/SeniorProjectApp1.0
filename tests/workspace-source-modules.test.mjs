import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { workspaceCssFiles, workspaceJavaScriptFiles } from "../scripts/lib/workspace-sources.mjs";

test("workspace loads a small shell first and lazy-loads role features", async () => {
  const html = await readFile("workspace.html", "utf8");
  const loader = await readFile("workspace/loader.js", "utf8");
  assert.match(html, /workspace\/loader\.js/);
  assert.match(html, /workspace\/shared\.js/);
  assert.match(html, /workspace\/core\.js/);
  assert.match(html, /workspace\/bootstrap\.js/);
  assert.doesNotMatch(html, /type="module" src="workspace\.js/);
  assert.match(loader, /ensureWorkspaceModulesForSession/);
  assert.match(loader, /studentOnly/);
  assert.match(loader, /document\.createElement\("script"\)/);
  assert.match(loader, /workspace\/features\/projects\.js/);
  assert.match(loader, /workspace\/features\/student\.js/);
  assert.match(loader, /workspace\/features\/review-admin\.js/);
  assert.match(loader, /student: "workspace\/features\/student\.js"/);
  assert.match(loader, /projects: "workspace\/features\/projects\.js"/);
  assert.doesNotMatch(html, /\?v=/, "source HTML must not carry a hand-maintained release label");
  assert.doesNotMatch(loader, /WORKSPACE_FEATURE_VERSION/, "feature versions must come from file content at build time");
});

test("workspace JavaScript and CSS modules stay inside source budgets", async () => {
  for (const file of workspaceJavaScriptFiles) {
    assert.ok((await stat(file)).size <= 525_000, `${file} exceeds 525 KB`);
  }
  for (const file of workspaceCssFiles) {
    assert.ok((await stat(file)).size <= 125_000, `${file} exceeds 125 KB`);
  }
});

test("the production build copies the workspace source directory", async () => {
  const build = await readFile("scripts/build-app-deploy.mjs", "utf8");
  assert.match(build, /"workspace"/);
  assert.match(build, /workspaceEntry[\s\S]*join\(outDir, "index\.html"\)/);
  assert.doesNotMatch(build, /readdir\(repoRoot/);
  assert.match(build, /createHash\("sha256"\)/);
  assert.match(build, /asset-manifest\.json/);
});

test("the production build versions every loaded workspace layer from its content", async () => {
  const result = spawnSync(process.execPath, ["scripts/build-app-deploy.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const [html, css, loader, manifestSource] = await Promise.all([
    readFile(".deploy-app/index.html", "utf8"),
    readFile(".deploy-app/workspace.css", "utf8"),
    readFile(".deploy-app/workspace/loader.js", "utf8"),
    readFile(".deploy-app/asset-manifest.json", "utf8"),
  ]);
  const manifest = JSON.parse(manifestSource);
  for (const file of ["styles.css", "workspace.css", "workspace/loader.js", "workspace/shared.js", "workspace/core.js", "workspace/bootstrap.js"]) {
    assert.match(manifest.assets[file].hash, /^[a-f0-9]{12}$/);
    assert.ok(html.includes(manifest.assets[file].url), `${file} must use its generated content version`);
  }
  for (const file of workspaceCssFiles) {
    assert.match(css, new RegExp(`${file.replaceAll("/", "\\/")}\\?v=[a-f0-9]{12}`));
  }
  for (const file of ["projects", "staff", "student", "review-admin", "actions"]) {
    assert.match(loader, new RegExp(`workspace/features/${file}\\.js\\?v=[a-f0-9]{12}`));
  }
  assert.match(css.trimEnd(), /06-visual-polish\.css\?v=[a-f0-9]{12}"\);$/);
  for (const fontFile of [
    "barlow-semi-condensed-latin-600-normal-5.3.0.woff2",
    "barlow-semi-condensed-latin-700-normal-5.3.0.woff2",
    "BARLOW-SEMI-CONDENSED-OFL.txt",
  ]) {
    await stat(`.deploy-app/assets/fonts/${fontFile}`);
  }
});

test("workspace HTML uses revalidation while generated assets may be cached", async () => {
  const headers = await readFile("_headers", "utf8");
  assert.match(headers, /(?:^|\n)\/\r?\n\s+Cache-Control: no-cache/);
  assert.match(headers, /\/index\.html\r?\n\s+Cache-Control: no-cache/);
  assert.match(headers, /\/assets\/\*\r?\n\s+Cache-Control: public, max-age=604800/);
});

test("workspace bars avoid inline styles so the CSP can block style attributes", async () => {
  const [headers, ...sources] = await Promise.all([
    readFile("_headers", "utf8"),
    ...workspaceJavaScriptFiles.map((file) => readFile(file, "utf8")),
  ]);
  assert.match(headers, /style-src-attr 'none'/);
  assert.doesNotMatch(headers, /style-src-attr 'unsafe-inline'/);
  assert.doesNotMatch(sources.join("\n"), /\sstyle\s*=/i);
  assert.match(sources.join("\n"), /function renderProgressSvg\(/);
});

test("the shell does not call lazy feature helpers before their modules load", async () => {
  const [core, shared, student, actions, staff] = await Promise.all([
    readFile("workspace/core.js", "utf8"),
    readFile("workspace/shared.js", "utf8"),
    readFile("workspace/features/student.js", "utf8"),
    readFile("workspace/features/actions.js", "utf8"),
    readFile("workspace/features/staff.js", "utf8"),
  ]);
  assert.match(core, /typeof renderReadOnlyBanner === "function"/);
  assert.doesNotMatch(core, /hasStaffAdminWorkspaceRole/);
  assert.match(shared, /function clampPercent\(/);
  assert.match(shared, /function studentBookletPhaseInfo\(/);
  assert.match(shared, /function studentPhaseShortLabel\(/);
  assert.match(shared, /function cleanPresentationSlotFilter\(/);
  assert.match(shared, /function cleanAdminArchiveExportFilter\(/);
  assert.match(shared, /function renderDashboardKpis\(/);
  assert.match(shared, /function renderReadinessScoreCard\(/);
  assert.match(shared, /function renderStackedDistribution\(/);
  assert.match(shared, /function metricWithPercent\(/);
  assert.match(shared, /function percentOf\(/);
  assert.match(shared, /function renderFirstUseGuide\(/);
  assert.match(shared, /function renderTaskFinishChecklist\(/);
  assert.doesNotMatch(student, /function studentPhaseShortLabel\(/);
  assert.doesNotMatch(actions, /function cleanPresentationSlotFilter\(/);
  assert.doesNotMatch(staff, /function cleanAdminArchiveExportFilter\(/);
  assert.doesNotMatch(staff, /function renderDashboardKpis\(/);
  assert.doesNotMatch(staff, /function renderReadinessScoreCard\(/);
  assert.doesNotMatch(staff, /function renderStackedDistribution\(/);
  assert.doesNotMatch(staff, /function renderFirstUseGuide\(/);
  assert.doesNotMatch(staff, /function renderTaskFinishChecklist\(/);
});

test("admin mutations return to the visible tiered admin screen", async () => {
  const [shared, actions] = await Promise.all([
    readFile("workspace/shared.js", "utf8"),
    readFile("workspace/features/actions.js", "utf8"),
  ]);
  assert.doesNotMatch(`${shared}\n${actions}`, /activeSection = "adminUsers"/);
  assert.match(shared, /activeSection = "adminAssignments";[\s\S]*Access assignment saved\./);
  assert.match(shared, /activeSection = "adminImports";[\s\S]*CSV imported\./);
});

test("workspace requests time out instead of leaving the page loading forever", async () => {
  const shared = await readFile("workspace/shared.js", "utf8");
  assert.match(shared, /new AbortController\(\)/);
  assert.match(shared, /setTimeout\(\(\) => timeoutController\.abort\(\), 15000\)/);
  assert.match(shared, /signal: options\.signal \|\| timeoutController\?\.signal/);
  assert.match(shared, /clearTimeout\(timeoutId\)/);
});
