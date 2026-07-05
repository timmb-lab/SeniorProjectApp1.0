import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const blueprintPath = "docs/design/next-major-round-polish-and-pilot-blueprint-2026-07-04.md";
const yugeBlueprintPath = "docs/design/yuge-max-next-round-blueprint-2026-07-05.md";

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

test("YUGE MAX blueprint preserves staged execution and readiness caveats", () => {
  assert.equal(existsSync(yugeBlueprintPath), true);
  const text = read(yugeBlueprintPath);

  for (const heading of [
    "## 1. Starting Repository State",
    "## 5. Current Implementation Audit By Area",
    "## 6. Prompt-By-Prompt Execution Plan",
    "## 8. Workstream Matrix",
    "## 11. RBAC And Security Matrix",
    "## 12. Role Matrix",
    "## 13. Pilot Readiness Evidence Matrix",
    "## 14. Stop Conditions",
    "## 16. Definition Of Done",
  ]) {
    assert.match(text, new RegExp(escapeRegex(heading)));
  }

  for (const phrase of [
    "Student = \"What do I do next?\"",
    "Staff = \"Which students need attention?\"",
    "Admin = \"What setup or operations need fixing?\"",
    "Work on `main` only.",
    "Do not touch `C:\\Curriculum`.",
    "Preserve Viewer read-only.",
    "Preserve staff-only, authorization-scoped View as Student.",
    "Preserve the Global Admin local-account requirement",
    "Real-student pilot readiness remains NO-GO",
    "Automated screenshot/browser proof cannot replace manual/policy evidence for real-student pilot readiness.",
  ]) {
    assert.match(text, new RegExp(escapeRegex(phrase), "i"));
  }

  for (const prompt of [
    "01 Header/navigation and role shell density",
    "02 Visual system, typography, spacing, and elegance",
    "03 Student product and My Capstone completion",
    "04 Staff Workspace queues, reviews, and Student Detail depth",
    "05 Admin Console operations depth",
    "06 Real-data loading, empty, error, and forbidden states",
    "07 Reports, exports, CSV templates, and analytics confidence",
    "08 Mobile, accessibility, keyboard, and visual regression sweep",
    "09 RBAC, security, View as Student, and role matrix proof",
    "10 Real-student pilot readiness gate, runbooks, and data handling",
    "11 Hosted/local proof, screenshots, and release report",
    "12 Final cleanup, docs index, repo hygiene, and push verification",
  ]) {
    assert.match(text, new RegExp(escapeRegex(prompt)));
  }

  for (const role of [
    "Student",
    "Mentor",
    "Program Teacher",
    "Viewer",
    "Administration",
    "Site Admin",
    "Global Admin",
    "Unauthorized/misc",
  ]) {
    assert.match(text, new RegExp(`\\| ${escapeRegex(role)} \\|`));
  }
});
