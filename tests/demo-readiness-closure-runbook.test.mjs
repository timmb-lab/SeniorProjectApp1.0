import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const RUNBOOK = "docs/demo/2026-06-30-demo-readiness-closure-runbook.md";

test("demo readiness closure runbook records migration, proof, and role walkthrough requirements", () => {
  assert.equal(existsSync(RUNBOOK), true);
  const text = readFileSync(RUNBOOK, "utf8");

  for (const marker of [
    "fd5f0f655e45e73fe23fac9ccc1b6bf7687d9a7d",
    "0016_student_roster_profiles.sql",
    "npm run db:migrate:remote",
    "studentRosterProfilesReady=true",
    "HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016",
    "Student workspace",
    "Viewer read-only proof",
    "Mentor assigned-student proof",
    "Program Teacher scoped student proof",
    "Administration People proof",
    "Site Admin People/Assignments/Programs proof",
    "View as Student proof",
    "CSV import preview/validation proof",
    "Safe denial examples",
    "npm run prove:hosted-fake-pilot-browser",
    "Full local `npm test`: passed",
    "viewer-directory HTTP 500",
    "git diff --cached --check",
  ]) {
    assert.match(text, new RegExp(escapeRegex(marker)));
  }

  assert.match(text, /Hosted fake-account click-around demo readiness only/i);
  assert.match(text, /already-applied Health signal/i);
  assert.match(text, /not as a live-demo migration step/i);
  assert.match(text, /no migrations to apply/i);
  assert.match(text, /student_roster_profiles.*exists/i);
  assert.doesNotMatch(text, /real-student production pilot ready/i);
});

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
