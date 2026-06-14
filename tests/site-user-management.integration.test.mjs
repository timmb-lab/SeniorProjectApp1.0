import assert from "node:assert/strict";
import test from "node:test";

import { onRequestDelete as onRemoveAccount } from "../functions/api/admin/users/[id].ts";
import { onRequestDelete as onRemoveStudent } from "../functions/api/site/students/[studentId].ts";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

const TEST_SITE_ID = "site-test-high-school";
const EAST_SITE_ID = "site-east-career-technical-academy";

test("account and student removal reject cross-origin deletes before mutation", async () => {
  const { db, env, tokens } = await createManagementFixture();

  const accountResponse = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/mentor-local-a", tokens.siteAdmin, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
      },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Cross-origin account removal should stop before mutation.",
      }),
    }),
    env,
    params: { id: "mentor-local-a" },
  });

  assert.equal(accountResponse.status, 403);
  assert.deepEqual(await accountResponse.json(), { error: "cross_origin_post_denied" });

  const studentResponse = await onRemoveStudent({
    request: buildRequest(`https://local.capstone.test/api/site/students/student-local-a?siteId=${TEST_SITE_ID}`, tokens.siteAdmin, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
      },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Cross-origin student removal should stop before mutation.",
      }),
    }),
    env,
    params: { studentId: "student-local-a" },
  });

  assert.equal(studentResponse.status, 403);
  assert.deepEqual(await studentResponse.json(), { error: "cross_origin_post_denied" });

  const mentor = await db.prepare("SELECT status FROM user_accounts WHERE id = 'mentor-local-a'").first();
  const student = await db.prepare("SELECT status FROM user_accounts WHERE id = 'student-local-a'").first();
  assert.equal(mentor.status, "active");
  assert.equal(student.status, "active");
});

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

test("School Admin account removal includes mentors and Program Teachers but not Site Admins", async () => {
  const { db, env, tokens } = await createManagementFixture();

  const removedTeacher = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/program-teacher-target", tokens.schoolAdmin, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Program teacher is no longer assigned to this test school.",
      }),
    }),
    env,
    params: { id: "program-teacher-target" },
  });

  assert.equal(removedTeacher.status, 200);
  assert.equal((await removedTeacher.json()).disabled, true);
  const teacherMembership = await db.prepare(
    "SELECT membership_status FROM site_users WHERE site_id = ? AND user_id = 'program-teacher-target'",
  ).bind(TEST_SITE_ID).first();
  assert.equal(teacherMembership.membership_status, "archived");

  const removedMentor = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/mentor-local-a", tokens.schoolAdmin, {
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

  assert.equal(removedMentor.status, 200);
  assert.equal((await removedMentor.json()).disabled, true);

  const blocked = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/site-admin-peer", tokens.schoolAdmin, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "School Admin should not remove Site Admin access.",
      }),
    }),
    env,
    params: { id: "site-admin-peer" },
  });
  assert.equal(blocked.status, 403);
});

test("Program Teacher account removal includes students and mentors only", async () => {
  const { db, env, tokens } = await createManagementFixture();

  const removedStudent = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/student-local-a", tokens.programTeacher, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Student is no longer in this program roster.",
      }),
    }),
    env,
    params: { id: "student-local-a" },
  });

  assert.equal(removedStudent.status, 200);
  assert.equal((await removedStudent.json()).disabled, true);
  const studentMembership = await db.prepare(
    "SELECT membership_status FROM site_users WHERE site_id = ? AND user_id = 'student-local-a'",
  ).bind(TEST_SITE_ID).first();
  assert.equal(studentMembership.membership_status, "archived");

  const removedMentor = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/mentor-local-a", tokens.programTeacher, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Mentor is no longer in this program roster.",
      }),
    }),
    env,
    params: { id: "mentor-local-a" },
  });

  assert.equal(removedMentor.status, 200);
  assert.equal((await removedMentor.json()).disabled, true);

  const blocked = await onRemoveAccount({
    request: buildRequest("https://local.capstone.test/api/admin/users/program-teacher-target", tokens.programTeacher, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: TEST_SITE_ID,
        adminNote: "Program Teacher should not remove another Program Teacher.",
      }),
    }),
    env,
    params: { id: "program-teacher-target" },
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
  await seedUser(db, { id: "school-admin-local", roleId: "administration", scopeType: "site", scopeId: TEST_SITE_ID });
  await seedUser(db, { id: "program-teacher-local", roleId: "program_teacher", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "program-teacher-target", roleId: "program_teacher", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "student-local-a", roleId: "student" });
  await seedUser(db, { id: "mentor-local-a", roleId: "mentor" });
  await seedUser(db, { id: "viewer-local-a", roleId: "viewer" });

  await db.prepare(
    `INSERT OR IGNORE INTO site_programs (site_id, program_id, active)
     VALUES (?, 'it', 1)`,
  ).bind(TEST_SITE_ID).run();

  await db.prepare(
    `INSERT INTO site_users (site_id, user_id, membership_status)
     VALUES
       (?, 'site-admin-local', 'active'),
       (?, 'site-admin-peer', 'active'),
       (?, 'school-admin-local', 'active'),
       (?, 'program-teacher-local', 'active'),
       (?, 'program-teacher-target', 'active'),
       (?, 'student-local-a', 'active'),
       (?, 'mentor-local-a', 'active'),
       (?, 'viewer-local-a', 'active'),
       (?, 'viewer-local-a', 'active')`,
  ).bind(TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, TEST_SITE_ID, EAST_SITE_ID).run();

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
    schoolAdmin: await seedSession(db, env, "school-admin-local", "management-school-admin"),
    programTeacher: await seedSession(db, env, "program-teacher-local", "management-program-teacher"),
  };

  return { db, env, tokens };
}
