import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const proofPath = "docs/progress/runs/2026-07-05-student-ready-final-proof.md";
const proofFile = "2026-07-05-student-ready-final-proof.md";

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("student-ready final proof exists and preserves honest no-go status", () => {
  assert.equal(existsSync(proofPath), true);
  const proof = read(proofPath);

  for (const heading of [
    "Executive Summary",
    "Starting SHA",
    "Commits Created In This Run",
    "Tests And Checks Run",
    "Local Proof Results",
    "Hosted Proof Results",
    "Screenshot Artifacts",
    "Student Language Improvements",
    "Role-Scoped Pilot Account Proof Status",
    "Synthetic Roster Validation Status",
    "Backup/Restore Rehearsal Status",
    "Privacy/Support/Retention Evidence Packet Status",
    "Credential Delivery Plan Status",
    "Student Archive/Export Scope Status",
    "Real-Student Pilot Readiness Status",
    "Final Recommendation",
  ]) {
    assert.match(proof, new RegExp(`## ${escapeRegex(heading)}`));
  }

  for (const phrase of [
    "d2ecce830433dfc1490e8d337452c088d3924af7",
    "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF",
    "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF",
    "NO_GO_REAL_STUDENT_PILOT",
    "Real-student pilot remains **NO-GO**",
    "`C:\\Curriculum` was not touched.",
  ]) {
    assert.match(proof, new RegExp(escapeRegex(phrase), "i"));
  }

  assert.doesNotMatch(proof, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
  assert.doesNotMatch(proof, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student/i);
});

test("student-ready final proof lists expected run commits and manual blockers", () => {
  const proof = read(proofPath);
  for (const commit of ["22ce8e47", "86522011", "371d0ed9", "bd40dd79", "28745162"]) {
    assert.match(proof, new RegExp(escapeRegex(commit)));
  }

  for (const blocker of [
    "role_scoped_pilot_account_proof",
    "backup_restore_rehearsal_evidence",
    "real_roster_validation_evidence",
    "privacy_support_retention_approval",
    "sso_or_managed_local_credential_delivery",
    "archive_manifest_download_acceptance",
  ]) {
    assert.match(proof, new RegExp(escapeRegex(blocker)));
  }
});

test("student-ready final proof is linked from the proof indexes", () => {
  const rootReadme = read("README.md");
  const runsReadme = read("docs/progress/runs/README.md");

  assert.match(rootReadme, new RegExp(escapeRegex(proofPath)));
  assert.match(runsReadme, new RegExp(escapeRegex(proofFile)));
});
