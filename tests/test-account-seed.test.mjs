import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const source = await readFile("functions/api/admin/test-accounts.ts", "utf8");

test("test account seed endpoint is admin-only and fake-data only", () => {
  assert.match(source, /getCurrentUser/);
  assert.match(source, /isPlatformAdmin/);
  assert.match(source, /test_accounts_seeded/);
  assert.match(source, /senior-capstone\.test/);
  assert.doesNotMatch(source, /@gmail\.com|@nv\.ccsd\.net|@ccsd\.net/);
});

test("test account seed endpoint covers the alpha roles and fixtures", () => {
  for (const role of ["student", "program_teacher", "mentor", "viewer", "site_admin", "admin", "misc_admin"]) {
    assert.match(source, new RegExp(`key: "${role}"`));
  }
  assert.match(source, /lee\.admin@senior-capstone\.test/);
  assert.match(source, /roleId: "admin"/);
  assert.match(source, /site-desert-valley-high/);
  assert.match(source, /site_users/);
  assert.match(source, /viewer_student_assignments/);
  assert.match(source, /project-test_user_student_maya/);
  assert.match(source, /project_members/);
  assert.match(source, /project_mentor_assignments/);
  for (const fixture of [
    "alpha-2026",
    "group-alpha-it-2026",
    "mentor-alpha-rivera-maya",
    "req-proposal-draft",
    "submission-alpha-maya-proposal",
    "evidence-alpha-maya-category-map",
  ]) {
    assert.match(source, new RegExp(fixture));
  }
});

test("test account repair replaces stale synthetic role grants", () => {
  const deleteIndex = source.indexOf('DELETE FROM user_roles WHERE user_id = ?');
  const insertIndex = source.indexOf('INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)');

  assert.ok(deleteIndex >= 0, "synthetic account repair must remove stale role grants");
  assert.ok(insertIndex > deleteIndex, "the one canonical role must be inserted after stale grants are removed");
  assert.doesNotMatch(source.slice(deleteIndex, insertIndex + 100), /INSERT OR IGNORE INTO user_roles/);
});
