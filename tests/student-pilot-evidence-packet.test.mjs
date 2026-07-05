import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const files = {
  packet: "docs/demo/student-pilot-evidence-packet.md",
  archive: "docs/demo/student-archive-export-scope-decision.md",
  gate: "docs/demo/real-student-pilot-go-no-go-gate.md",
  runbook: "docs/demo/real-student-pilot-readiness-runbook.md",
  dataSummary: "docs/demo/student-data-handling-summary.md",
  proofPlan: "docs/sales/real-student-pilot-proof-plan.md",
  gap: "docs/sales/real-student-pilot-readiness-gap-analysis.md",
};

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("student pilot evidence packet exists and preserves policy-pending no-go status", () => {
  for (const file of Object.values(files)) assert.equal(existsSync(file), true, file);
  const packet = read(files.packet);

  for (const heading of [
    "Current Decision",
    "Required Owners",
    "Privacy Review Checklist",
    "Support Plan",
    "Data Retention And Deletion",
    "Account Provisioning",
    "Account Deprovisioning",
    "Credential Delivery Plan",
    "Staff Onboarding",
    "Student Onboarding",
    "Draft School/Parent Communication",
    "Required Evidence Before GO",
  ]) {
    assert.match(packet, new RegExp(`## ${escapeRegex(heading)}`));
  }

  for (const phrase of [
    "POLICY REVIEW PACKET READY FOR ADMINISTRATOR REVIEW",
    "real-student pilot remains NO-GO",
    "not legal advice",
    "not FERPA certification",
    "Path A: Google Workspace SSO",
    "Path B: Approved Managed-Local Credentials",
    "Global Admin remains local-account-only",
    "Do not send this message until the pilot owner and policy owner approve it",
  ]) {
    assert.match(packet, new RegExp(escapeRegex(phrase), "i"));
  }
});

test("evidence packet names all required manual manifests and owners", () => {
  const packet = read(files.packet);
  for (const evidence of [
    "real-student-pilot-role-scope-proof.json",
    "real-student-pilot-backup-restore-rehearsal-evidence.json",
    "real-student-pilot-roster-validation-evidence.json",
    "real-student-pilot-privacy-support-retention-approval.json",
    "real-student-pilot-credential-delivery-approval.json",
    "real-student-pilot-archive-download-evidence.json",
  ]) {
    assert.match(packet, new RegExp(escapeRegex(evidence)));
  }

  for (const owner of [
    "Pilot owner",
    "School/admin decision owner",
    "Privacy/data owner",
    "Support owner",
    "Technical owner",
    "Roster owner",
    "School IT / credential owner",
  ]) {
    assert.match(packet, new RegExp(escapeRegex(owner)));
  }
});

test("archive export decision keeps first pilot archive download deferred", () => {
  const archive = read(files.archive);
  for (const phrase of [
    "FUTURE PILOT ITEM",
    "exclude student archive manifest download from the first real-student pilot by default",
    "student_archive_manifest_download",
    "FUTURE_PILOT_ITEM",
    "real-student-pilot-archive-download-evidence.json",
    "Keep archive/download out of the first real-student pilot",
  ]) {
    assert.match(archive, new RegExp(escapeRegex(phrase), "i"));
  }
  assert.doesNotMatch(archive, /^Archive download is ready\b/im);
});

test("pilot packet surfaces link evidence packet and archive decision", () => {
  const requiredLinks = [files.packet, files.archive];
  for (const file of [files.gate, files.runbook, files.dataSummary, files.proofPlan, files.gap, "README.md"]) {
    const text = read(file);
    for (const link of requiredLinks) assert.match(text, new RegExp(escapeRegex(link)), `${file} links ${link}`);
  }
});

test("policy packet avoids real-student approval overclaims", () => {
  const combined = Object.values(files).map(read).join("\n\n");
  assert.doesNotMatch(combined, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student/i);
  assert.doesNotMatch(combined, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
  assert.doesNotMatch(combined, /approved for real student data/i);
});
