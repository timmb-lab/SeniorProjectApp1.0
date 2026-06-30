import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const DOC_FILES = [
  "README.md",
  "docs/remote-demo-data.md",
  "docs/sales/hosted-proof-plan.md",
  "docs/sales/technical-proof-checklist.md",
  "docs/sales/demo-runbook.md",
  "docs/sales/demo-preflight-checklist.md",
  "docs/progress/run-log.md",
];

const combinedDocs = DOC_FILES.map(read).join("\n\n");

test("remote demo docs distinguish historical seed gate from current fake-account browser proof", () => {
  assert.match(combinedDocs, /Phase 13C/i);
  assert.match(combinedDocs, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(combinedDocs, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(combinedDocs, /HOSTED_FAKE_ACCOUNT_PILOT_GREEN/);
  assert.match(combinedDocs, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(combinedDocs, /non-blocking compatibility Caveat/i);
  assert.doesNotMatch(combinedDocs, /real-student production readiness (is )?(complete|ready|approved)/i);

  const phase13Manifest = JSON.parse(read("docs/progress/runs/2026-05-24-remote-demo-seed-gate.json"));
  assert.equal(phase13Manifest.screenshotStatus.screenshotsGenerated, false);
  assert.equal(phase13Manifest.screenshotStatus.browserProofGenerated, false);
  assert.equal(phase13Manifest.nextRecommendedPrompt, "14_hosted_browser_proof_and_screenshot_gate.txt");
});

test("hosted proof plan distinguishes schema ready, missing legacy seed, and fake-account browser proof", () => {
  const hosted = read("docs/sales/hosted-proof-plan.md");
  assert.match(hosted, /REMOTE_MIGRATION_0011_ALREADY_PRESENT/);
  assert.match(hosted, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(hosted, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(hosted, /HOSTED_FAKE_ACCOUNT_PILOT_GREEN/);
  assert.match(hosted, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(hosted, /student_archive_manifest_download/);
  assert.match(hosted, /Future Pilot Item: Archive Manifest Download/);
  assert.match(hosted, /already-applied Health signal/i);
});

test("remote proof scripts stay away from reset, deploy, and config commands", () => {
  const scripts = [
    read("scripts/prove-remote-demo-workspace.mjs"),
    read("scripts/prove-sales-demo-hosted.mjs"),
    read("scripts/prove-remote-migration-0011.mjs"),
  ].join("\n\n");

  assert.match(scripts, /remoteWritesPerformed:\s*false/);
  assert.match(scripts, /deployPerformed:\s*false/);
  assert.doesNotMatch(scripts, /seed:demo:remote:reset/);
  assert.doesNotMatch(scripts, /reset:accounts:remote/);
  assert.doesNotMatch(scripts, /pages\s+deploy/i);
  assert.doesNotMatch(scripts, /wrangler\s+pages\s+secret/i);
  assert.doesNotMatch(scripts, /migrations\s+apply/i);
  assert.doesNotMatch(scripts, /d1[^"\n]+execute[^"\n]+--file/i);
});

test("remote demo docs avoid credentials, secret material, and real-readiness overclaims", () => {
  for (const pattern of [
    /BEGIN PRIVATE KEY/i,
    /AIza[0-9A-Za-z_-]{20,}/,
    /sk-[0-9A-Za-z_-]{20,}/,
    /"password"\s*:/i,
    /"workingPassword"\s*:/i,
    /access_token\s*[:=]\s*["'][^"']+/i,
    /refresh_token\s*[:=]\s*["'][^"']+/i,
    /password_hash\s*[:=]\s*["'][^"']+/i,
    /password_salt\s*[:=]\s*["'][^"']+/i,
    /drive_file_id\s*[:=]\s*["'][^"']+/i,
    /drive_parent_folder_id\s*[:=]\s*["'][^"']+/i,
  ]) {
    assert.doesNotMatch(combinedDocs, pattern);
  }

  assert.doesNotMatch(combinedDocs, /FERPA (certification|certified|compliance) (is )?(complete|ready|approved)/i);
  assert.doesNotMatch(combinedDocs, /production pilot readiness (is )?(complete|ready|approved)/i);
  assert.doesNotMatch(combinedDocs, /real student data (is )?(ready for use|approved for use|seeded into the demo|included)/i);
});

function read(file) {
  return readFileSync(file, "utf8");
}
