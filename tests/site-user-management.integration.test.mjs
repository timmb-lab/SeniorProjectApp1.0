import assert from "node:assert/strict";
import test from "node:test";

import { onRequestDelete as onRemoveAccount } from "../functions/api/admin/users/[id].ts";
import { onRequestDelete as onRemoveStudent } from "../functions/api/site/students/[studentId].ts";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

const TEST_SITE_ID = "site-test-high-school";
const EAST_SITE_ID = "site-east-career-technical-academy";

test("site student removal archives the school membership, disables orphaned student sign-in, and audits the action", async () => {
  const { db, env, tokens } = await createManagementFixture();

  const response = await onRemoveStudent({
    request: buildRequest(`https://local.capstone.test/api/site/students/student-local-a?siteId=${TEST_SITE_ID}`, tokens.siteAdmin, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Student left this test school.",
      }),
    }),
    env,
    params: { studentId: "student-local-a" },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.disabled, true);

  const membership = await db.prepare(
    "SELECT membership_status FROM site_users WHERE site_id = ? AND user_id = ?",
  ).bind(TEST_SITE_ID, "student-local-a").first();
  assert.equal(membership.membership_status, "archived");

  const student = await db.prepare("SELECT status FROM user_accounts WHERE id = 'student-local-a'").first();
  assert.equal(student.status, "disabled");

  const mentorAssignment = await db.prepare("SELECT active FROM mentor_assignments WHERE id = 'mentor-student-local-a'").first();
  assert.equal(Number(mentorAssignment.active), 0);
  const viewerAssignment = await db.prepare("SELECT active FROM viewer_student_assignments WHERE id = 'viewer-student-local-a'").first();
  assert.equal(Number(viewerAssignment.active), 0);

  const audits = await readAuditActions(db);
  const removalAudit = audits.find((event) => event.action === "site_student_removed" && event.metadata.studentId === "student-local-a");
  assert.ok(removalAudit);
  assert.equal(removalAudit.metadata.adminNote, "Student left this test school.");
});

test("site admin account removal archives ordinary site accounts but cannot remove elevated peers", async () => {
  const { db, env, tokens } = await createManagementFixture();

  const removed = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/mentor-local-a", tokens.siteAdmin, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Mentor is no longer active for this test school.",
      }),
    }),
    env,
    params: { id: "mentor-local-a" },
  });

  assert.equal(removed.status, 200);
  const body = await removed.json();
  assert.equal(body.ok, true);
  assert.equal(body.disabled, true);

  const mentor = await db.prepare("SELECT status FROM user_accounts WHERE id = 'mentor-local-a'").first();
  assert.equal(mentor.status, "disabled");
  const membership = await db.prepare(
    "SELECT membership_status FROM site_users WHERE site_id = ? AND user_id = ?",
  ).bind(TEST_SITE_ID, "mentor-local-a").first();
  assert.equal(membership.membership_status, "archived");

  const blocked = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/site-admin-peer", tokens.siteAdmin, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Attempt to remove another site admin.",
      }),
    }),
    env,
    params: { id: "site-admin-peer" },
  });
  assert.equal(blocked.status, 403);
});

test("global admin can disable an ordinary account across schools and leaves at least one local global admin", async () => {
  const { db, env, tokens } = await createManagementFixture();

  const removed = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/viewer-local-a", tokens.globalAdmin, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adminNote: "Viewer account is no longer needed.",
      }),
    }),
    env,
    params: { id: "viewer-local-a" },
  });

  assert.equal(removed.status, 200);
  const body = await removed.json();
  assert.equal(body.ok, true);
  assert.equal(body.disabled, true);

  const viewer = await db.prepare("SELECT status FROM user_accounts WHERE id = 'viewer-local-a'").first();
  assert.equal(viewer.status, "disabled");
  const memberships = await db.prepare(
    "SELECT COUNT(*) AS count FROM site_users WHERE user_id = 'viewer-local-a' AND membership_status = 'active'",
  ).first();
  assert.equal(Number(memberships.count), 0);
});

async function createManagementFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    SESSION_COOKIE_NAME: "sc_session",
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
  };

  await seedUser(db, { id: "global-admin-local", roleId: "global_admin" });
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES ('global-admin-local', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0)`,
  ).run();

  await seedUser(db, { id: "site-admin-local", roleId: "site_admin", scopeType: "site", scopeId: TEST_SITE_ID });
  await seedUser(db, { id: "site-admin-peer", roleId: "site_admin", scopeType: "site", scopeId: TEST_SITE_ID });
  await seedUser(db, { id: "student-local-a", roleId: "student" });
  await seedUser(db, { id: "mentor-local-a", roleId: "mentor" });
  await seedUser(db, { id: "viewer-local-a", roleId: "viewer" });

  await db.prepare(
    `INSERT INTO site_users (site_id, user_id, membership_status)
     VALUES
       (?, 'site-admin-local', 'active'),
       (?, 'site-admin-peer', 'active'),
       (?, 'student-local-a', 'active'),
       (?, 'mentor-local-a', 'active'),
       (?, 'viewer-local-a', 'active'),
       (?, 'viewer-local-a', 'active')`,
  ).bind(TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, EAST_SITE_ID).run();

  await db.prepare(
    `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, active)
     VALUES ('mentor-student-local-a', 'mentor-local-a', 'student-local-a', 1)`,
  ).run();
  await db.prepare(
    `INSERT INTO viewer_student_assignments (id, viewer_user_id, student_user_id, active)
     VALUES ('viewer-student-local-a', 'viewer-local-a', 'student-local-a', 1)`,
  ).run();

  const tokens = {
    globalAdmin: await seedSession(db, env, "global-admin-local", "management-global"),
    siteAdmin: await seedSession(db, env, "site-admin-local", "management-site-admin"),
  };

  return { db, env, tokens };
}
