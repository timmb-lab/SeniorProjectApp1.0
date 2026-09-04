import assert from "node:assert/strict";
import test from "node:test";

import { PROJECTS, buildResetSeedSql, parseArgs } from "../scripts/reset-project-demo-data.mjs";

test("project demo reset defines exactly one realistic, fully staffed project per phase", () => {
  assert.equal(PROJECTS.length, 8);
  assert.deepEqual([...new Set(PROJECTS.map((row) => row.phase))].sort(), [
    "finish", "phase-1", "phase-2a", "phase-2b", "phase-3a", "phase-3b", "phase-4", "start",
  ]);
  assert.deepEqual([...new Set(PROJECTS.map((row) => row.students.length))].sort(), [2, 3, 4, 5]);
  assert.ok(PROJECTS.every((row) => row.mentorId && row.teacherId));
  assert.ok(PROJECTS.every((row) => row.notes.length > 0));
  assert.equal(PROJECTS.flatMap((row) => row.notes).filter((note) => note[2] === "archived").length, 1);
});

test("project demo reset keeps identity, school, program, template, and setting tables", () => {
  const sql = buildResetSeedSql();
  for (const protectedTable of ["user_accounts", "user_roles", "sites", "programs", "project_templates", "app_settings"]) {
    assert.doesNotMatch(sql, new RegExp(`DELETE\\s+FROM\\s+${protectedTable}\\b`, "i"));
  }
  assert.match(sql, /DELETE FROM projects;/);
  assert.equal((sql.match(/INSERT INTO projects \(/g) || []).length, 8);
  assert.equal((sql.match(/INSERT INTO project_adult_assignments/g) || []).length, 16);
  assert.doesNotMatch(sql, /DELETE FROM audit_events/i);
});

test("remote project reset requires its explicit write guard", () => {
  assert.deepEqual(parseArgs(["--remote", "--dry-run"]), { mode: "dryrun", confirm: "" });
  assert.throws(() => parseArgs(["--remote", "--write"]), /RESET_PROJECT_DATA/);
  assert.deepEqual(parseArgs(["--remote", "--write", "--confirm", "RESET_PROJECT_DATA"]), {
    mode: "write",
    confirm: "RESET_PROJECT_DATA",
  });
});
