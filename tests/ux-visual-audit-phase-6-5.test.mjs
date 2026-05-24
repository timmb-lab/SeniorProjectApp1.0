import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const auditPath = "docs/design/ux-visual-audit-phase-6-5.md";
const audit = await readFile(auditPath, "utf8");
const workspaceHtml = await readFile("workspace.html", "utf8");
const workspaceJs = await readFile("workspace.js", "utf8");
const workspaceCss = await readFile("workspace.css", "utf8");

test("Phase 6.5 UX visual audit documents live Figma source context", () => {
  assert.equal(existsSync(auditPath), true);
  assert.match(audit, /Figma file key \| `z4t4tFPAKrMDh6pIYOeEw6`/);
  assert.match(audit, /Page inspected \| `0:1`, `00 Master Plan \+ Foundations`/);
  assert.match(audit, /Main node inspected \| `2:5`, `Senior Capstone Product Control Center`/);
  assert.match(audit, /Live Figma was edited: no/);
});

test("Phase 6.5 UX visual audit includes the required Figma color palette", () => {
  for (const hex of [
    "#172026",
    "#596871",
    "#fbfaf7",
    "#ffffff",
    "#2463a6",
    "#22734d",
    "#a65f00",
    "#b82f2f",
    "#047b83",
    "#6c4aa3",
    "#c6553d",
    "#d9a441",
    "#dce4e5",
  ]) {
    assert.match(audit, new RegExp(hex.replace("#", "#"), "i"), `missing palette color ${hex}`);
  }
});

test("Phase 6.5 UX visual audit includes required audit sections", () => {
  for (const heading of [
    "## 4. Figma Pattern Gap Matrix",
    "## 5. Color and Token Fidelity Audit",
    "## 6. Screen-by-Screen UX Findings",
    "## 10. Design Acceptance Checklist",
  ]) {
    assert.match(audit, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Phase 6.5 UX visual audit tracks required Figma patterns and status rules", () => {
  for (const phrase of [
    "dark product header",
    "gold eyebrow",
    "Header chips",
    "North Star Workflow cards",
    "Permission and data rule cards",
    "No student messaging",
    "reason, owner, and next action",
    "Private evidence",
    "Audit-sensitive admin",
  ]) {
    assert.match(audit, new RegExp(phrase, "i"));
  }
});

test("workspace remains announcement-free and avoids secret/storage identifiers in client assets", () => {
  const workspaceAssets = `${workspaceHtml}\n${workspaceJs}\n${workspaceCss}`;
  assert.doesNotMatch(workspaceAssets, /\/api\/announcements|announcements:\s*null|Current Updates|No current announcements|workspace-kicker">Announcements/i);
  assert.doesNotMatch(workspaceAssets, /client_secret|refresh_token|access_token|private_key|drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|PASSWORD_PEPPER/i);
});
