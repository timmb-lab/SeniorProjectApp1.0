import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const core = fs.readFileSync(path.join(root, "workspace", "core.js"), "utf8");
const shared = fs.readFileSync(path.join(root, "workspace", "shared.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "workspace", "styles", "06-visual-polish.css"), "utf8");

test("secondary role screens receive one shared accessible Back control", () => {
  assert.match(core, /function renderWorkspaceContextualBack/);
  assert.match(core, /definition\?\.hidden/);
  assert.match(core, /aria-label="Back navigation"/);
  assert.match(core, /data-workspace-contextual-back="true"/);
  assert.match(core, /Back to \$\{escapeHtml\(model\.label\)\}/);
});

test("Back uses in-app history and has role-appropriate direct-link fallbacks", () => {
  assert.match(core, /window\.history\.back\(\)/);
  assert.match(core, /mode: "admin", section: "overview", label: "Admin Overview"/);
  assert.match(core, /section: "student", label: "Today"/);
  assert.match(core, /return \{ mode: "workspace", section: "overview", label: "Today" \}/);
  assert.match(shared, /WORKSPACE_HISTORY_DEPTH_KEY/);
  assert.match(shared, /WORKSPACE_HISTORY_BACK_SECTION_KEY/);
  assert.match(shared, /WORKSPACE_HISTORY_BACK_MODE_KEY/);
});

test("existing precise detail returns are not duplicated", () => {
  assert.match(core, /siteStudentDetailState\?\.studentId \|\| reviewQueueState\?\.selectedSubmissionId/);
  assert.match(core, /isViewAsStudentActive\(\)/);
});

test("Back control remains readable and full-width on narrow screens", () => {
  assert.match(styles, /\.workspace-contextual-back \{/);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /@media \(max-width: 460px\)[\s\S]*\.workspace-contextual-back \.workspace-button \{[\s\S]*width: 100%/);
});
