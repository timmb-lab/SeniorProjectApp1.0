import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("student management supports ID usernames and tightly scoped placement changes", async () => {
  const [migration, login, reset, placement, people, actions] = await Promise.all([
    readFile("migrations/0035_login_aliases.sql", "utf8"),
    readFile("functions/api/auth/login.ts", "utf8"),
    readFile("functions/api/auth/complete-reset.ts", "utf8"),
    readFile("functions/api/site/students/[id]/placement.ts", "utf8"),
    readFile("workspace/features/review-admin.js", "utf8"),
    readFile("workspace/features/actions.js", "utf8"),
  ]);
  assert.match(migration, /alias_norm TEXT NOT NULL UNIQUE/);
  assert.match(login, /accountLookupSql/);
  assert.match(reset, /accountLookupSql/);
  assert.match(placement, /canonicalRoleIds\.some\(\(role\) => role === "site_admin" \|\| role === "administration"\)/);
  assert.match(placement, /canManageSiteUsers/);
  assert.match(placement, /student\.placement_updated/);
  assert.match(placement, /site_programs\.site_id = \?/);
  assert.match(placement, /site_id != \? AND membership_status = 'active'/);
  assert.match(placement, /UPDATE sessions SET revoked_at/);
  assert.match(people, /data-student-placement-edit/);
  assert.match(people, /Support partner \/ viewer \(optional\)/);
  assert.match(actions, /data-student-placement-form/);
});
