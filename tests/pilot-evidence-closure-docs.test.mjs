import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const docs = {
  roleProof: "docs/demo/role-scoped-pilot-account-proof.md",
  rosterDryRun: "docs/demo/synthetic-roster-validation-dry-run.md",
  backupRunbook: "docs/demo/backup-restore-rehearsal-runbook.md",
  gate: "docs/demo/real-student-pilot-go-no-go-gate.md",
  runbook: "docs/demo/real-student-pilot-readiness-runbook.md",
  proofPlan: "docs/sales/real-student-pilot-proof-plan.md",
  gap: "docs/sales/real-student-pilot-readiness-gap-analysis.md",
};

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("pilot evidence closure docs exist and remain no-go/manual-evidence bounded", () => {
  for (const file of Object.values(docs)) assert.equal(existsSync(file), true, file);

  const combined = Object.values(docs).map(read).join("\n\n");
  for (const phrase of [
    "real-student pilot evidence still MANUAL_PROOF_REQUIRED",
    "real roster validation still MANUAL_PROOF_REQUIRED",
    "backup/restore evidence still MANUAL_PROOF_REQUIRED",
    "This blocker is narrowed",
    "Real-student pilot remains **NO-GO**",
    "does not replace `docs/progress/runs/real-student-pilot-role-scope-proof.json`",
    "does not replace `docs/progress/runs/real-student-pilot-roster-validation-evidence.json`",
    "does not replace `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json`",
  ]) {
    assert.match(combined, new RegExp(escapeRegex(phrase), "i"));
  }

  assert.doesNotMatch(combined, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
  assert.doesNotMatch(combined, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student/i);
});

test("role-scoped pilot account proof covers every pilot role and denial class", () => {
  const roleProof = read(docs.roleProof);

  for (const role of [
    "Student",
    "Mentor",
    "Program Teacher",
    "Viewer",
    "Administration",
    "Site Admin",
    "Global Admin",
    "Unauthorized/misc",
  ]) {
    assert.match(roleProof, new RegExp(`\\| ${escapeRegex(role)} \\|`));
  }

  for (const denial of [
    "Student cannot open Admin Console or Staff Workspace",
    "Mentor cannot access an unassigned student",
    "Program Teacher cannot cross program/site scope",
    "Viewer cannot mutate",
    "View as Student cannot mutate",
    "SSO cannot create or use Global Admin",
  ]) {
    assert.match(roleProof, new RegExp(escapeRegex(denial)));
  }
});

test("synthetic roster dry-run doc matches supported CSV fields and guardrails", () => {
  const roster = read(docs.rosterDryRun);

  for (const column of [
    "first_name",
    "last_name",
    "email",
    "site",
    "program",
    "cohort",
    "graduation_year",
    "status",
    "mentor_email",
    "viewer_email",
    "assigned_student_emails",
  ]) {
    assert.match(roster, new RegExp(escapeRegex(column)));
  }

  for (const guardrail of [
    "Unsupported columns are blocked",
    "Duplicate emails in the same CSV are blocked",
    "Student users cannot be assigned as mentors or viewers",
    "CSV import cannot create Global Admin accounts",
    "credential_delivery_policy_required",
    "student_roster_profiles_migration_required",
  ]) {
    assert.match(roster, new RegExp(escapeRegex(guardrail), "i"));
  }
});

test("backup restore runbook names safe wrangler paths and forbids destructive production restore", () => {
  const backup = read(docs.backupRunbook);

  for (const phrase of [
    "npx wrangler d1 export senior-capstone-db --local",
    "npx wrangler d1 export senior-capstone-db --remote",
    "npx wrangler d1 time-travel info senior-capstone-db",
    "npx wrangler d1 time-travel restore senior-capstone-db",
    "Do not run destructive restore against production real-student data",
    "Do not commit exports",
    "isolated restore target",
    "/api/health",
    "studentRosterProfilesReady=true",
  ]) {
    assert.match(backup, new RegExp(escapeRegex(phrase), "i"));
  }
});

test("pilot packet links the new evidence docs from readiness surfaces", () => {
  const surfaces = [read(docs.gate), read(docs.runbook), read(docs.proofPlan), read(docs.gap), read("README.md")];
  for (const surface of surfaces) {
    for (const linkedDoc of [docs.roleProof, docs.rosterDryRun, docs.backupRunbook]) {
      assert.match(surface, new RegExp(escapeRegex(linkedDoc)));
    }
  }
});
