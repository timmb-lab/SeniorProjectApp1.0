import assert from "node:assert/strict";
import test from "node:test";

import {
  canRemoveGlobalAdminGrant,
  countActiveLocalGlobalAdmins,
  getViewerAssignedStudentIds,
  loadEffectiveAccess,
} from "../functions/_lib/effective-access.ts";
import {
  canAccessStudent,
  canManageSitePrograms,
  canManageSiteUsers,
  canManageUsers,
  canViewMentorAssignments,
  canViewPresentationOperations,
  canViewReadinessReports,
  canViewReviewQueue,
  canViewSiteDashboard,
  canViewStudentDirectory,
  getProgramTeacherScopedStudentIds,
} from "../functions/_lib/permissions.ts";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";
import { seedUser } from "./helpers/auth-fixtures.mjs";

test("V5 protects the last active local Global Admin", async () => {
  const { env, db, users } = await createV5Fixture();

  await seedUser(db, { id: "global-sso", roleId: "global_admin" });
  assert.equal(await countActiveLocalGlobalAdmins(env), 1);
  assert.equal(await canRemoveGlobalAdminGrant(env, users.globalOne.id), false);

  await seedUser(db, { id: "global-two", roleId: "global_admin" });
  await seedLocalCredential(db, "global-two");
  assert.equal(await countActiveLocalGlobalAdmins(env), 2);
  assert.equal(await canRemoveGlobalAdminGrant(env, users.globalOne.id), true);

  const localAccess = await loadEffectiveAccess(env, users.globalOne);
  assert.equal(localAccess.isGlobalAdmin, true);
  assert.equal(localAccess.isLocalGlobalAdmin, true);

  const ssoAccess = await loadEffectiveAccess(env, buildUser("global-sso"));
  assert.equal(ssoAccess.isGlobalAdmin, true);
  assert.equal(ssoAccess.isLocalGlobalAdmin, false);
});

test("V5 viewer access is limited to explicitly assigned students", async () => {
  const { env, users } = await createV5Fixture();

  assert.deepEqual(await getViewerAssignedStudentIds(env, users.viewer.id), ["student-a"]);
  assert.equal(await canAccessStudent(env, users.viewer, "student-a"), true);
  assert.equal(await canAccessStudent(env, users.viewer, "student-b"), false);
  assert.equal(await canViewStudentDirectory(env, users.viewer, "site-a"), true);
  assert.equal(await canViewSiteDashboard(env, users.viewer, "site-a"), false);
  assert.equal(await canViewReviewQueue(env, users.viewer, "site-a"), false);
  assert.equal(await canViewMentorAssignments(env, users.viewer, "site-a"), false);
  assert.equal(await canViewPresentationOperations(env, users.viewer, "site-a"), false);
  assert.equal(await canViewReadinessReports(env, users.viewer, "site-a"), false);
  assert.equal(await canManageUsers(env, users.viewer), false);
});

test("V5 distinguishes School Admin school access from Site Admin program management", async () => {
  const { env, users } = await createV5Fixture();

  assert.equal(await canViewSiteDashboard(env, users.administration, "site-a"), true);
  assert.equal(await canViewReadinessReports(env, users.administration, "site-a"), true);
  assert.equal(await canViewMentorAssignments(env, users.administration, "site-a"), true);
  assert.equal(await canManageSiteUsers(env, users.administration, "site-a"), true);
  assert.equal(await canManageSitePrograms(env, users.administration, "site-a"), false);
  assert.equal(await canViewReviewQueue(env, users.administration, "site-a"), false);

  assert.equal(await canViewSiteDashboard(env, users.siteAdmin, "site-a"), true);
  assert.equal(await canManageSiteUsers(env, users.siteAdmin, "site-a"), true);
  assert.equal(await canManageSitePrograms(env, users.siteAdmin, "site-a"), true);
  assert.equal(await canViewReviewQueue(env, users.siteAdmin, "site-a"), true);
});

test("V5 rejects unsafe global Program Teacher scope", async () => {
  const { env, users } = await createV5Fixture();

  const teacherScope = await getProgramTeacherScopedStudentIds(env, users.teacherGlobal);
  assert.equal(teacherScope.valid, false);
  assert.equal(teacherScope.invalidScopeCount, 1);
  assert.deepEqual(teacherScope.studentIds, []);
  assert.equal(await canAccessStudent(env, users.teacherGlobal, "student-a"), false);
});

async function createV5Fixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = { DB: db };

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, subscription_status, storage_mode)
     VALUES ('tenant-a', 'Tenant A', 'tenant-a', 'active', 'trial', 'app_managed_google_drive')`,
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, status)
     VALUES ('site-a', 'tenant-a', 'Site A', 'site-a', 'active')`,
  ).run();
  await db.prepare("INSERT INTO site_programs (site_id, program_id, active) VALUES ('site-a', 'it', 1)").run();

  await seedUser(db, { id: "global-one", roleId: "global_admin" });
  await seedLocalCredential(db, "global-one");
  await seedUser(db, { id: "viewer", roleId: "viewer" });
  await seedUser(db, { id: "administration", roleId: "administration", scopeType: "site", scopeId: "site-a" });
  await seedUser(db, { id: "site-admin", roleId: "site_admin", scopeType: "site", scopeId: "site-a" });
  await seedUser(db, { id: "teacher-global", roleId: "program_teacher", scopeType: "global", scopeId: "" });
  await seedUser(db, { id: "student-a", roleId: "student" });
  await seedUser(db, { id: "student-b", roleId: "student" });

  await db.prepare(
    `INSERT INTO site_users (site_id, user_id)
     VALUES
       ('site-a', 'viewer'),
       ('site-a', 'administration'),
       ('site-a', 'site-admin'),
       ('site-a', 'teacher-global'),
       ('site-a', 'student-a'),
       ('site-a', 'student-b')`,
  ).run();
  await db.prepare(
    `INSERT INTO viewer_student_assignments (id, viewer_user_id, student_user_id, active)
     VALUES ('viewer-student-a', 'viewer', 'student-a', 1)`,
  ).run();

  const users = Object.fromEntries([
    "global-one",
    "viewer",
    "administration",
    "site-admin",
    "teacher-global",
  ].map((id) => [camelKey(id), buildUser(id)]));

  return { env, db, users };
}

async function seedLocalCredential(db, userId) {
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES (?, 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0)`,
  ).bind(userId).run();
}

function buildUser(id) {
  return {
    id,
    email: `${id}@capstone.test`,
    email_norm: `${id}@capstone.test`,
    display_name: id,
    status: "active",
  };
}

function camelKey(id) {
  return id.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}
