import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const docPath = "docs/sales/real-student-pilot-readiness-gap-analysis.md";
const proofPlanPath = "docs/sales/real-student-pilot-proof-plan.md";
const preflightPath = "scripts/check-real-student-pilot-readiness.mjs";
const manifestPath = "docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json";

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseSummary(stdout) {
  const markerIndex = stdout.indexOf("{");
  assert.notEqual(markerIndex, -1, stdout);
  return JSON.parse(stdout.slice(markerIndex));
}

test("real-student pilot readiness matrix preserves no-go and exact proof categories", () => {
  assert.equal(existsSync(docPath), true);
  assert.equal(existsSync(proofPlanPath), true);
  const doc = read(docPath);
  const proofPlan = read(proofPlanPath);

  assert.match(doc, /NO-GO for real-student production pilot readiness/);
  assert.match(doc, /Hosted fake-account click-around demo readiness is green/);
  assert.match(doc, /Local\/demo readiness/);
  assert.match(doc, /Real-student pilot readiness/);
  assert.match(doc, /Full production readiness/);
  assert.match(doc, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(doc, /HOSTED_FAKE_ACCOUNT_PILOT_GREEN/);
  assert.match(doc, /NOT_CLAIMED_READY/);
  assert.match(doc, /student_archive_manifest_download/);
  assert.match(doc, /skipped_not_ready/);
  assert.match(doc, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(doc, /0016_student_roster_profiles\.sql/);
  assert.match(doc, /studentRosterProfilesReady=true/);
  assert.match(doc, /student_roster_profiles_migration_required/);
  assert.match(doc, /credential_delivery_policy_required/);
  assert.match(doc, /viewer_student_forbidden/);
  assert.match(doc, /SSO or approved managed-local credential delivery/);
  assert.match(doc, /privacy, support, retention, and data ownership/);
  assert.match(doc, /real roster validation/);
  assert.match(doc, /backup\/restore rehearsal/);
  assert.match(doc, /role-scoped pilot-account proof/);
  assert.match(doc, /fake `\.test` proof limitations/);

  assert.match(
    doc,
    /\| Area \| Current state \| Evidence \| Real-student blocker\? \| Acceptance criteria \| Proof command or manual proof needed \| Owner\/dependency if known \|/,
  );

  for (const row of [
    "Hosted app availability",
    "Local/demo readiness",
    "Hosted fake-account demo readiness",
    "Real-student pilot decision",
    "Full production readiness",
    "Database health",
    "Migration health, including 0016",
    "Google SSO or approved managed-local credential delivery",
    "Local Global Admin account model",
    "Test/fake accounts",
    "Real staff account onboarding",
    "Real student account onboarding",
    "Add Student",
    "Student CSV Import",
    "Staff CSV Import, if present",
    "Student roster profiles",
    "Mentor assignment",
    "Viewer assignment",
    "Program Teacher scope",
    "Administration/Admin scope",
    "Site Admin scope",
    "Global Admin scope",
    "View as Student",
    "Viewer read-only",
    "Student dashboard",
    "Student detail",
    "Program management",
    "Audit/logging",
    "Error handling",
    "Data export/archive/download",
    "Backup/restore rehearsal",
    "Real roster validation",
    "Privacy/data separation",
    "Tenant/school separation",
    "Hosted proof screenshots",
    "Known skipped items, including `student_archive_manifest_download`",
    "Legacy synthetic hosted sales-demo seed",
  ]) {
    assert.match(doc, new RegExp(`\\| ${escapeRegex(row)} \\|`));
  }

  for (let item = 1; item <= 15; item += 1) {
    assert.match(doc, new RegExp(`^${item}\\. `, "m"), `acceptance criterion ${item}`);
  }

  for (const phrase of [
    "Role-Scoped Pilot Account Proof Plan",
    "Student cannot access admin/staff surfaces",
    "Mentor cannot access unassigned students",
    "Program Teacher cannot cross program/site scope",
    "Viewer cannot mutate",
    "SSO cannot create or use Global Admin",
    "View as Student cannot mutate",
    "Global Admin local account",
    "Backup/Restore Rehearsal Checklist",
    "D1 export",
    "restore rehearsal",
    "non-real data",
    "Real-Roster Validation Checklist",
    "approved source of truth",
    "required fields",
    "cohort",
    "graduation year",
    "program/site mapping",
    "mentor/viewer assignment",
    "duplicate handling",
    "deactivation/archive handling",
    "fake/synthetic rows only",
    "Archive/Download Acceptance Criteria",
    "no raw Drive IDs",
    "audit/logging",
  ]) {
    assert.match(proofPlan, new RegExp(escapeRegex(phrase)));
  }

  assert.doesNotMatch(doc, /\bproduction\s+pilot\s+ready\b/i);
  assert.doesNotMatch(doc, /\breal\s+student\s+data\s+ready\b/i);
  assert.doesNotMatch(doc, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student production/i);
  assert.doesNotMatch(doc, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
});

test("pilot readiness preflight is exposed, non-mutating, and reports all status categories", () => {
  assert.equal(existsSync(preflightPath), true);
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["check:pilot-readiness"],
    "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/check-real-student-pilot-readiness.mjs",
  );

  const runner = read("scripts/run-npm-script.ps1");
  assert.match(runner, /"check:pilot-readiness"/);
  assert.match(runner, /scripts\\check-real-student-pilot-readiness\.mjs/);

  const preflight = read(preflightPath);
  for (const forbidden of [
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /\bspawnSync\s*\(/,
    /\bexecFileSync\s*\(/,
    /\bexecSync\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
  ]) {
    assert.doesNotMatch(preflight, forbidden);
  }

  for (const status of [
    "PASS",
    "BLOCKED",
    "NON_BLOCKING_DEMO_ONLY",
    "FUTURE_PILOT_ITEM",
    "MANUAL_PROOF_REQUIRED",
  ]) {
    assert.match(preflight, new RegExp(escapeRegex(status)));
  }

  const result = spawnSync(process.execPath, [preflightPath], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PILOT_READINESS_PREFLIGHT_COMPLETE_NO_GO/);
  const summary = parseSummary(result.stdout);

  assert.equal(summary.scriptStatus, "PASS");
  assert.equal(summary.finalDecision.status, "BLOCKED");
  assert.equal(summary.finalDecision.decision, "NO_GO_REAL_STUDENT_PILOT");
  assert.equal(summary.finalDecision.hostedFakeAccountDemo, "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF");
  assert.equal(summary.finalDecision.realStudentProductionStatus, "NOT_CLAIMED_READY");
  assert.equal(summary.nonMutating, true);
  assert.equal(summary.statusCounts.PASS > 0, true);
  assert.equal(summary.statusCounts.BLOCKED > 0, true);
  assert.equal(summary.statusCounts.NON_BLOCKING_DEMO_ONLY > 0, true);
  assert.equal(summary.statusCounts.FUTURE_PILOT_ITEM > 0, true);
  assert.equal(summary.statusCounts.MANUAL_PROOF_REQUIRED > 0, true);
  assert.deepEqual(
    summary.missingRequiredManualProofIds,
    [
      "role_scoped_pilot_account_proof",
      "backup_restore_rehearsal_evidence",
      "real_roster_validation_evidence",
      "privacy_support_retention_approval",
      "sso_or_managed_local_credential_delivery",
    ],
  );
  assert.equal(
    summary.expectedEvidenceManifests.some((item) =>
      item.id === "backup_restore_rehearsal_evidence"
        && item.present === false
        && item.statusWhenMissing === "MANUAL_PROOF_REQUIRED"
    ),
    true,
  );
  assert.equal(
    summary.checks.some((item) =>
      item.id === "student_archive_manifest_download"
        && item.status === "FUTURE_PILOT_ITEM"
        && item.requiredForRealStudentPilot === false
    ),
    true,
  );
});

test("current hosted proof remains fake-account evidence only", () => {
  const manifest = JSON.parse(read(manifestPath));
  assert.equal(manifest.verdict, "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF");
  assert.equal(manifest.realStudentProductionStatus, "NOT_CLAIMED_READY");
  assert.equal(manifest.health.databaseReady, true);
  assert.equal(manifest.health.studentRosterProfilesReady, true);

  const hostedPlan = read("docs/sales/hosted-proof-plan.md");
  assert.match(hostedPlan, /0016_student_roster_profiles\.sql/);
  assert.match(hostedPlan, /already-applied Health signal/i);
  assert.match(hostedPlan, /Future Pilot Item: Archive Manifest Download/);
  assert.match(hostedPlan, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);

  const hostedPermissions = read("scripts/check-hosted-workspace-permissions.mjs");
  assert.match(hostedPermissions, /name: "student_archive_manifest_download"/);
  assert.match(hostedPermissions, /readinessCategory: "future_pilot_item"/);
  assert.match(hostedPermissions, /requiredForHostedFakeAccountDemoDay: false/);
  assert.match(hostedPermissions, /liveDemoBlocker: false/);
});
