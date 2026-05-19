import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const source = await readFile("functions/api/admin/test-accounts.ts", "utf8");

test("test account seed endpoint is admin-only and fake-data only", () => {
  assert.match(source, /getCurrentUser/);
  assert.match(source, /isAdmin/);
  assert.match(source, /test_accounts_seeded/);
  assert.match(source, /senior-capstone\.test/);
  assert.doesNotMatch(source, /@gmail\.com|@nv\.ccsd\.net|@ccsd\.net/);
});

test("test account seed endpoint covers the alpha roles and fixtures", () => {
  for (const role of ["student", "program_teacher", "mentor", "admin", "misc_admin"]) {
    assert.match(source, new RegExp(`key: "${role}"`));
  }
  assert.match(source, /lee\.admin@senior-capstone\.test/);
  assert.match(source, /roleId: "admin"/);
  for (const fixture of [
    "alpha-2026",
    "group-alpha-it-2026",
    "mentor-alpha-rivera-maya",
    "req-alpha-proposal",
    "submission-alpha-maya-proposal",
    "evidence-alpha-maya-category-map",
  ]) {
    assert.match(source, new RegExp(fixture));
  }
});
