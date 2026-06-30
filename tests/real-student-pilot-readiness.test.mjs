import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const docPath = "docs/sales/real-student-pilot-readiness-gap-analysis.md";
const preflightPath = "scripts/check-real-student-pilot-readiness.mjs";
const manifestPath = "docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json";

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("real-student pilot readiness matrix exists and preserves the no-go boundary", () => {
  assert.equal(existsSync(docPath), true);
  const doc = read(docPath);

  assert.match(doc, /NO-GO for real-student production pilot readiness/);
  assert.match(doc, /Hosted fake-account click-around demo readiness is green/);
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
  assert.match(doc, /View as Student/);
  assert.match(doc, /Viewer remains read-only|Viewer read-only/i);
  assert.match(doc, /Backup\/restore/);

  assert.match(
    doc,
    /\| Capability \| Current status \| Evidence \| Demo-only\/fake-only dependency\? \| Real-student pilot risk \| Required before pilot\? \| Recommended next action \| Validation command\/proof \|/,
  );

  for (const row of [
    "Hosted app availability",
    "Database health",
    "Migration health, including 0016",
    "Google SSO",
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
    "Audit/logging, if present",
    "Error handling",
    "Data export/archive/download",
    "Backups/rollback",
    "Privacy/data separation",
    "Tenant/school separation",
    "Hosted proof screenshots",
    "No-go checks",
    "Known skipped items, including `student_archive_manifest_download`",
    "Legacy synthetic hosted sales-demo seed",
    "Real production pilot acceptance criteria",
  ]) {
    assert.match(doc, new RegExp(`\\| ${escapeRegex(row)} \\|`));
  }

  for (let item = 1; item <= 15; item += 1) {
    assert.match(doc, new RegExp(`^${item}\\. `, "m"), `acceptance criterion ${item}`);
  }

  assert.doesNotMatch(doc, /\bproduction\s+pilot\s+ready\b/i);
  assert.doesNotMatch(doc, /\breal\s+student\s+data\s+ready\b/i);
  assert.doesNotMatch(doc, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student production/i);
  assert.doesNotMatch(doc, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
});

test("pilot readiness preflight is exposed, non-mutating, and passes", () => {
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

  const result = spawnSync(process.execPath, [preflightPath], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PILOT_READINESS_PREFLIGHT_PASS/);
  assert.match(result.stdout, /NO_GO_NOT_CLAIMED/);
  assert.match(result.stdout, /student_archive_manifest_download/);
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
