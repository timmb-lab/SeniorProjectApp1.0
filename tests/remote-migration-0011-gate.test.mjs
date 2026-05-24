import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const DOC_FILES = [
  "docs/sales/hosted-proof-plan.md",
  "docs/sales/technical-proof-checklist.md",
  "docs/remote-demo-data.md",
  "docs/progress/run-log.md",
];

test("remote migration 0011 gate docs distinguish schema and seed blockers", () => {
  const hostedPlan = read("docs/sales/hosted-proof-plan.md");
  const checklist = read("docs/sales/technical-proof-checklist.md");
  const remoteDemo = read("docs/remote-demo-data.md");

  assert.match(hostedPlan, /0011_multisite_site_role_foundation\.sql/);
  assert.match(hostedPlan, /REMOTE_MIGRATION_0011_APPLIED_REMOTE_DEMO_SEED_NOT_RUN/);
  assert.match(hostedPlan, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(hostedPlan, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011/);
  assert.match(checklist, /remote migration 0011 gate/i);
  assert.match(checklist, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(remoteDemo, /No remote demo seed was run in Phase 13B/i);
});

test("remote migration 0011 gate manifest is present", () => {
  const file = "docs/progress/runs/2026-05-24-remote-migration-0011-gate.json";
  assert.equal(existsSync(file), true, `${file} should exist`);
  const manifest = JSON.parse(read(file));
  assert.equal(manifest.phase, "13B");
  assert.equal(manifest.name, "remote-migration-0011-gate");
  assert.match(manifest.hostedProofStatusAfter.status, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING|HOSTED_PROOF_PASSED_READ_ONLY/);
  assert.equal(manifest.remoteSeedStatus, "REMOTE_DEMO_SEED_NOT_RUN");
});

test("remote migration 0011 proof script and package alias are read-only", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["prove:remote:migration-0011"],
    "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/prove-remote-migration-0011.mjs",
  );

  const script = read("scripts/prove-remote-migration-0011.mjs");
  assert.match(script, /REMOTE_MIGRATION_0011_ALREADY_PRESENT/);
  assert.match(script, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(script, /remoteWritesPerformed:\s*false/);
  assert.match(script, /remoteSeedPerformed:\s*false/);
  assert.match(script, /deployPerformed:\s*false/);
  assert.doesNotMatch(script, /migrations\s+apply/i);
  assert.doesNotMatch(script, /seed:demo:remote/);
  assert.doesNotMatch(script, /pages\s+deploy/i);
  assert.doesNotMatch(script, /d1[^"\n]+execute[^"\n]+--file/i);
});

test("hosted proof script reports the post-schema remote seed blocker", () => {
  const script = read("scripts/prove-sales-demo-hosted.mjs");
  assert.match(script, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011/);
  assert.match(script, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(script, /13C_remote_demo_seed_gate\.txt/);
  assert.match(script, /remoteWritesPerformed:\s*false/);
  assert.match(script, /remoteSeedPerformed:\s*false/);
  assert.match(script, /deployPerformed:\s*false/);
  assert.doesNotMatch(script, /migrations\s+apply/i);
  assert.doesNotMatch(script, /seed:demo:remote/);
});

test("remote migration gate docs and scripts avoid secret-looking values and hosted-pass overclaims", () => {
  const combined = [
    ...DOC_FILES.map(read),
    read("scripts/prove-remote-migration-0011.mjs"),
    read("scripts/prove-sales-demo-hosted.mjs"),
  ].join("\n\n");
  for (const pattern of [
    /BEGIN PRIVATE KEY/i,
    /AIza[0-9A-Za-z_-]{20,}/,
    /sk-[0-9A-Za-z_-]{20,}/,
    /access_token\s*[:=]\s*["'][^"']+/i,
    /refresh_token\s*[:=]\s*["'][^"']+/i,
    /password_hash\s*[:=]\s*["'][^"']+/i,
    /password_salt\s*[:=]\s*["'][^"']+/i,
    /drive_file_id\s*[:=]\s*["'][^"']+/i,
    /drive_parent_folder_id\s*[:=]\s*["'][^"']+/i,
  ]) {
    assert.doesNotMatch(combined, pattern);
  }
  assert.doesNotMatch(combined, /hosted proof passed/i);
  assert.match(combined, /remote seed was not run|remoteSeedPerformed:\s*false/i);
});

function read(file) {
  return readFileSync(file, "utf8");
}
