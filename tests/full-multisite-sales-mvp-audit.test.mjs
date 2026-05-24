import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const auditPath = "docs/audits/2026-05-24-full-multisite-sales-mvp-audit.md";
const summaryPath = "docs/audits/2026-05-24-full-multisite-sales-mvp-audit-summary.md";
const audit = await readFile(auditPath, "utf8");
const summary = await readFile(summaryPath, "utf8");
const combined = `${audit}\n${summary}`;

test("full multisite sales MVP audit docs exist", () => {
  assert.equal(existsSync(auditPath), true);
  assert.equal(existsSync(summaryPath), true);
});

test("full audit includes all required major sections", () => {
  const headings = [
    "## 1. Executive Summary",
    "## 2. Phase Ledger",
    "## 3. Current Product Architecture",
    "## 4. Role and Permission State",
    "## 5. Data Model and Migration Audit",
    "## 6. Seed and Proof Audit",
    "## 7. UX / Visual / Figma Audit Synthesis",
    "## 8. Sales Demo Readiness",
    "## 9. Technical Risk Register",
    "## 10. Security / Privacy / FERPA-Adjacent Review",
    "## 11. Testing and Validation Review",
    "## 12. Remote / Deployment / Cloudflare Readiness",
    "## 13. Product Scope and Non-Goals",
    "## 14. Recommended Next Path",
    "## 15. Phase 7 Readiness Requirements",
    "## 16. MVP Backlog",
    "## 17. Final Go / No-Go Decision",
  ];

  for (const heading of headings) {
    assert.match(audit, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("full audit includes Phase 1 through Phase 6.5 ledger", () => {
  const phases = [
    "Phase 1 contract",
    "Phase 2 schema/site/roles",
    "Phase 3 announcements removal",
    "Phase 4 site-aware permission helpers",
    "Phase 5A local multisite seed/proof",
    "Phase 6 Figma token/design foundation",
    "Phase 6.5 UX visual audit",
  ];

  for (const phase of phases) {
    assert.match(audit, new RegExp(phase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("full audit includes go/no-go decisions and next prompt", () => {
  assert.match(audit, /Go\/no-go for Phase 7:/);
  assert.match(audit, /Go\/no-go for remote migration `0011`:/);
  assert.match(audit, /Go\/no-go for remote seed 5B:/);
  assert.match(audit, /Go\/no-go for sales demo:/);
  assert.match(combined, /06\.6_design_cleanup_before_dashboard\.txt/);
});

test("full audit includes Figma UX findings and remote D1 blocker", () => {
  assert.match(audit, /z4t4tFPAKrMDh6pIYOeEw6/);
  assert.match(audit, /Senior Capstone Product Control Center/);
  assert.match(audit, /dark product header/i);
  assert.match(audit, /gold eyebrow/i);
  assert.match(audit, /Remote D1 needs migration `0011`/);
  assert.match(audit, /remote D1 was missing the `sites` table/i);
});

test("full audit does not contain credential or storage identifier values", () => {
  assert.doesNotMatch(
    combined,
    /BEGIN PRIVATE KEY|client_secret["':=]|refresh_token["':=]|access_token["':=]|password_hash|password_salt|temporaryPassword|GOOGLE_DRIVE_PRIVATE_KEY|drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId/i,
  );
});
