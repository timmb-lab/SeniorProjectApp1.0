import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("evidence previews stay inside an accessible responsive dialog with safe fallbacks", async () => {
  const [student, actions, styles, shared] = await Promise.all([
    readFile("workspace/features/student.js", "utf8"),
    readFile("workspace/features/actions.js", "utf8"),
    readFile("workspace/styles/07-project-tabs.css", "utf8"),
    readFile("workspace/shared.js", "utf8"),
  ]);
  assert.match(student, /data-evidence-preview-url=/);
  assert.match(student, />Preview here<\/button>/);
  assert.match(actions, /dialog\.showModal\(\)/);
  assert.match(actions, /aria-labelledby.*workspaceEvidencePreviewTitle/);
  assert.match(actions, /Project evidence preview/);
  assert.match(actions, /Open preview in a new tab/);
  assert.match(styles, /workspace-evidence-preview-dialog::backdrop/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*workspace-evidence-preview-frame/);
  assert.match(shared, /file_content_mismatch/);
});
