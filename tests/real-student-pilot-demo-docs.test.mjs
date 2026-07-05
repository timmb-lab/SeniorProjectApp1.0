import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const files = {
  runbook: "docs/demo/real-student-pilot-readiness-runbook.md",
  gate: "docs/demo/real-student-pilot-go-no-go-gate.md",
  staffChecklist: "docs/demo/staff-pilot-onboarding-checklist.md",
  studentChecklist: "docs/demo/student-pilot-onboarding-checklist.md",
  dataSummary: "docs/demo/student-data-handling-summary.md",
};

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("real-student pilot operator packet exists and preserves no-go readiness levels", () => {
  for (const file of Object.values(files)) assert.equal(existsSync(file), true, file);
  const runbook = read(files.runbook);
  const gate = read(files.gate);
  const combined = Object.values(files).map(read).join("\n\n");

  for (const phrase of [
    "Fake-Account Local Demo Readiness",
    "Hosted Fake-Account Demo Readiness",
    "Real-Student Pilot Readiness",
    "fake-account demo readiness is not real-student pilot readiness",
    "Real-student pilot remains NO-GO unless manual/policy evidence is completed",
    "No automated screenshot run can replace required approvals",
  ]) {
    assert.match(combined, new RegExp(escapeRegex(phrase), "i"));
  }

  for (const section of [
    "Pilot Scope",
    "Required Approvals",
    "Student Data Handling",
    "Account Provisioning",
    "Account Deprovisioning",
    "Pre-Pilot Checklist",
    "During-Pilot Operating Procedure",
    "Incident/Support Procedure",
    "Post-Pilot Checklist",
    "Go/No-Go Table",
  ]) {
    assert.match(runbook, new RegExp(`## ${escapeRegex(section)}`));
  }

  assert.match(gate, /Current status:\s+\*\*NO-GO for real-student pilot readiness\.\*\*/);
  assert.match(gate, /Final Go\/No-Go Decision Area/);
  assert.match(gate, /Decision \| NO-GO until all required evidence is present and reviewed/);

  assert.doesNotMatch(combined, /\bproduction\s+pilot\s+ready\b/i);
  assert.doesNotMatch(combined, /\breal\s+student\s+data\s+ready\b/i);
  assert.doesNotMatch(combined, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student production/i);
  assert.doesNotMatch(combined, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
});

test("real-student pilot packet names required manual evidence and owners", () => {
  const combined = Object.values(files).map(read).join("\n\n");

  for (const evidence of [
    "real-student-pilot-role-scope-proof.json",
    "real-student-pilot-backup-restore-rehearsal-evidence.json",
    "real-student-pilot-roster-validation-evidence.json",
    "real-student-pilot-privacy-support-retention-approval.json",
    "real-student-pilot-credential-delivery-approval.json",
    "real-student-pilot-archive-download-evidence.json",
  ]) {
    assert.match(combined, new RegExp(escapeRegex(evidence)));
  }

  for (const category of [
    "Role-scoped pilot account proof",
    "Backup/restore rehearsal evidence",
    "Real-roster validation evidence",
    "Privacy/support/retention approval",
    "SSO or managed-local credential delivery",
    "Archive/download proof",
  ]) {
    assert.match(combined, new RegExp(escapeRegex(category), "i"));
  }

  for (const owner of [
    "Pilot owner",
    "Technical owner",
    "Support owner",
    "Privacy/data owner",
    "Roster owner",
    "School IT",
  ]) {
    assert.match(combined, new RegExp(escapeRegex(owner), "i"));
  }
});

test("pilot onboarding and data handling docs keep RBAC and privacy boundaries practical", () => {
  const staff = read(files.staffChecklist);
  const student = read(files.studentChecklist);
  const data = read(files.dataSummary);
  const readme = read("README.md");

  for (const phrase of [
    "Viewer must not mutate",
    "View as Student",
    "staff-only and authorization-scoped",
    "Global Admin remains a local account",
    "Do not paste student data into public docs",
  ]) {
    assert.match(staff, new RegExp(escapeRegex(phrase), "i"));
  }

  for (const phrase of [
    "Today",
    "My Work",
    "Feedback",
    "Final Checklist",
    "If you see another student's information",
    "do not share login information",
  ]) {
    assert.match(student, new RegExp(escapeRegex(phrase), "i"));
  }

  for (const phrase of [
    "This document is an operational summary, not legal advice",
    "must be reviewed by the school/district policy owner",
    "pilot should not proceed until approved",
    "Viewer must not mutate",
    "Fake-account demo readiness is not real-student pilot readiness",
    "student_archive_manifest_download remains a future pilot item",
  ]) {
    assert.match(data, new RegExp(escapeRegex(phrase), "i"));
  }

  for (const linkedDoc of Object.values(files)) {
    assert.match(readme, new RegExp(escapeRegex(linkedDoc.replace("docs/demo/", ""))));
  }
});
