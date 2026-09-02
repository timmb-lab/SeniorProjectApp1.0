import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const importRoute = readFileSync("functions/api/admin/users/import.ts", "utf8");
const wrangler = readFileSync("wrangler.jsonc", "utf8");
const gate = readFileSync("docs/security/real-user-operating-gates.md", "utf8");
const rehearsal = JSON.parse(readFileSync("docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json", "utf8"));

test("production blocks real account creation until the explicit operating approval flag is set", () => {
  assert.match(importRoute, /env\.APP_ENV === "production"/);
  assert.match(importRoute, /env\.REAL_STUDENT_PILOT_APPROVED !== "true"/);
  assert.match(importRoute, /pilot_approval_required/);
  assert.doesNotMatch(wrangler, /"REAL_STUDENT_PILOT_APPROVED"\s*:\s*"true"/);
});

test("operating gate names every non-technical approval and keeps SSO disabled", () => {
  for (const phrase of [
    "Student privacy",
    "Support",
    "Retention",
    "Incident response",
    "Data ownership",
    "Roster",
    "Account delivery",
    "DISABLED_NOT_APPROVED",
  ]) assert.match(gate, new RegExp(phrase, "i"));
});

test("local backup and restore evidence is honest and production-free", () => {
  assert.equal(rehearsal.result, "PASS");
  assert.equal(rehearsal.remoteD1Queries, 0);
  assert.equal(rehearsal.productionDataTouched, false);
  assert.equal(rehearsal.integrityCheck, "ok");
  assert.equal(rehearsal.markerRecovered, true);
  assert.equal(rehearsal.limitations.length >= 3, true);
});
