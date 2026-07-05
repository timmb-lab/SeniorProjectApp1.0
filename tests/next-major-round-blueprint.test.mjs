import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const blueprintPath = "docs/design/next-major-round-polish-and-pilot-blueprint-2026-07-04.md";

function read(path) {
  return readFileSync(path, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("next major round blueprint preserves screen contracts and implementation sequence", () => {
  assert.equal(existsSync(blueprintPath), true);
  const text = read(blueprintPath);

  for (const heading of [
    "## 1. Executive Summary",
    "## 3. Guardrails",
    "## 4. Current State Audit",
    "## 5. Next Round Workstreams",
    "## 6. Screen Preservation Contract",
    "## 7. Visual Acceptance Criteria",
    "## 8. Pilot Readiness Acceptance Criteria",
    "## 9. Test And Proof Plan",
    "## 10. Implementation Sequence",
    "## 11. Risks And Stop Conditions",
  ]) {
    assert.match(text, new RegExp(escapeRegex(heading)));
  }

  for (const phrase of [
    "Student: \"What do I do next?\"",
    "Staff: \"Which students need attention?\"",
    "Admin: \"What setup or operations need fixing?\"",
    "Preserve Viewer read-only behavior",
    "Preserve staff-only, authorization-scoped View as Student behavior",
    "Preserve the Global Admin local-account requirement",
    "No normal product screen should display \"Showing 0 of 0.\"",
    "Real-student pilot remains NO-GO",
    "fake-account local demo readiness",
    "Hosted fake-account demo readiness",
  ]) {
    assert.match(text, new RegExp(escapeRegex(phrase), "i"));
  }

  for (const screen of [
    "Student Today",
    "Student My Work",
    "Student Feedback",
    "Student Final Checklist",
    "Staff Today",
    "Staff Students",
    "Staff Reviews",
    "Staff Reports",
    "Student Detail Overview",
    "Student Detail Work",
    "Student Detail Feedback",
    "Student Detail Evidence",
    "Student Detail Timeline",
    "Admin Overview",
    "Admin People",
    "Admin Students",
    "Admin Assignments",
    "Admin Programs",
    "Admin Imports",
    "Admin Reports",
    "Admin Audit",
  ]) {
    assert.match(text, new RegExp(`\\| ${escapeRegex(screen)} \\|`));
  }
});

test("README points future polish work to the next-round blueprint", () => {
  const readme = read("README.md");
  assert.match(readme, /next-major-round-polish-and-pilot-blueprint-2026-07-04\.md/);
  assert.match(readme, /Student, Staff Workspace, and Admin Console model/);
});
