import assert from "node:assert/strict";
import test from "node:test";

import {
  onRequestGet as onSiteAccessAssignments,
  onRequestPost as onSiteAccessAssignmentsPost,
} from "../functions/api/site/access-assignments.ts";
import {
  DirectD1Adapter,
  runDemoSeed,
} from "../scripts/seed-local-demo-workspace.mjs";
import { buildRequest, readAuditActions, seedSession } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1 } from "./helpers/d1-sqlite.mjs";

const MIGRATIONS = [
  "migrations/0001_foundation.sql",
  "migrations/0002_framework_seed.sql",
  "migrations/0003_framework_seed_data.sql",
  "migrations/0004_mentor_meetings.sql",
  "migrations/0005_submission_versions.sql",
  "migrations/0006_presentation_slots.sql",
  "migrations/0007_archive_export_artifacts.sql",
  "migrations/0008_update_drive_resource_ids.sql",
  "migrations/0009_update_drive_shared_drive_root.sql",
  "migrations/0010_tenant_google_sso.sql",
  "migrations/0011_multisite_site_role_foundation.sql",
  "migrations/0012_users_access_v5.sql",
  "migrations/0015_remove_org_admin_role.sql",
  "migrations/0016_student_roster_profiles.sql",
];
const MIGRATIONS_WITHOUT_0016 = MIGRATIONS.filter(
  (migration) => !migration.includes("0016_student_roster_profiles.sql"),
);

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const FORBIDDEN_RESPONSE_FIELDS = /adminNote|actorRoleScopes|temporaryPassword|password_hash|password_salt|drive_file_id|access_token|refresh_token|Family schedule change/i;

test("site access assignments route returns scoped recent access history without admin note text", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();
  await seedAccessHistoryAuditRows(db);

  {
    const { response, body } = await routeAccessAssignments(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const siteAdmin = await expectAccessAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdmin.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(siteAdmin.permissions.canAssignMentors, true);
  assert.equal(siteAdmin.permissions.canAssignProgramTeachers, true);
  assert.equal(siteAdmin.permissions.canAssignAdministration, false);
  assert.equal(siteAdmin.permissions.canAssignSiteAdmins, false);
  assert.equal(Array.isArray(siteAdmin.history), true);
  assert.equal(siteAdmin.history.length, 2);
  assert.deepEqual(siteAdmin.history.map((entry) => entry.action), ["assign", "remove"]);
  assert.deepEqual(siteAdmin.history.map((entry) => entry.assignmentType), ["viewer_student", "program_teacher_program"]);
  assert.equal(siteAdmin.history[0].actorName, "Sam Site Admin");
  assert.equal(siteAdmin.history[0].targetUserId, "demo-viewer-desert-valley-high");
  assert.equal(siteAdmin.history[0].studentId, "demo-student-001");
  assert.equal(siteAdmin.history[0].siteId, PRIMARY_SITE_ID);
  assert.equal(siteAdmin.history[1].actorName, "Bryan Timm");
  assert.equal(siteAdmin.history[1].targetUserId, "demo-teacher-it-01");
  assert.equal(siteAdmin.history[1].programId, "it");

  const forbiddenSite = await routeAccessAssignments(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(forbiddenSite.response.status, 403);
  assert.doesNotMatch(JSON.stringify(forbiddenSite.body), /Canyon Ridge Career/i);

  const viewer = await routeAccessAssignments(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.response.status, 403);
  assert.deepEqual(viewer.body, { error: "forbidden" });

  const schoolAdmin = await expectAccessAssignments(env, tokens.schoolAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(schoolAdmin.permissions.canAssignMentors, true);
  assert.equal(schoolAdmin.permissions.canAssignViewers, true);
  assert.equal(schoolAdmin.permissions.canAssignProgramTeachers, true);
  assert.equal(schoolAdmin.permissions.canAssignAdministration, false);
  assert.equal(schoolAdmin.permissions.canAssignSiteAdmins, false);

  const programTeacher = await expectAccessAssignments(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(programTeacher.permissions.canAssignMentors, true);
  assert.equal(programTeacher.permissions.canAssignViewers, false);
  assert.equal(programTeacher.permissions.canAssignProgramTeachers, false);
  assert.equal(programTeacher.permissions.canAssignAdministration, false);
  assert.equal(programTeacher.permissions.canAssignSiteAdmins, false);

  const teacherMentorPost = await routeAccessAssignmentsPost(env, tokens.programTeacher, {
    siteId: PRIMARY_SITE_ID,
    assignmentType: "mentor_student",
    action: "assign",
    targetUserId: "demo-mentor-001",
    studentId: "demo-student-001",
    adminNote: "Program Teacher assigns mentor support for a scoped student.",
  });
  assert.equal(teacherMentorPost.response.status, 200);
  assert.equal(teacherMentorPost.body.ok, true);

  const teacherProgramPost = await routeAccessAssignmentsPost(env, tokens.programTeacher, {
    siteId: PRIMARY_SITE_ID,
    assignmentType: "program_teacher_program",
    action: "assign",
    targetUserId: "demo-teacher-it-01",
    programId: "it",
    adminNote: "Program Teacher should not assign Program Teacher access.",
  });
  assert.equal(teacherProgramPost.response.status, 403);

  const schoolAdminProgramPost = await routeAccessAssignmentsPost(env, tokens.schoolAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    assignmentType: "program_teacher_program",
    action: "assign",
    targetUserId: "demo-teacher-it-01",
    programId: "it",
    adminNote: "School Admin assigns Program Teacher access for this school.",
  });
  assert.equal(schoolAdminProgramPost.response.status, 200);
  assert.equal(schoolAdminProgramPost.body.ok, true);

  assert.doesNotMatch(JSON.stringify(siteAdmin), FORBIDDEN_RESPONSE_FIELDS);

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_access_assignments_viewed"), true);
  assert.equal(
    audits.some((event) => event.action === "security.denied_access" && event.entity_type === "site_access_assignment"),
    true,
  );
});

test("site access assignments renders student options safely before roster profile migration", async () => {
  const { env, token } = await createLegacyRosterFixture();

  const body = await expectAccessAssignments(env, token, "?siteId=site-legacy-roster");

  assert.equal(body.users.students.length, 1);
  assert.equal(body.users.students[0].userId, "legacy-roster-student");
  assert.equal(body.users.students[0].cohort, "");
  assert.equal(body.users.students[0].graduationYear, "");
  assert.equal(body.permissions.canAssignMentors, true);
});

async function createSeededDemoFixture() {
  const db = createSqliteD1({ migrations: MIGRATIONS });
  const env = {
    DB: db,
    SESSION_COOKIE_NAME: "sc_session",
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
  };

  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES
       ('protected-admin-primary', 'bryan@learntechonline.com', 'bryan@learntechonline.com', 'Bryan Timm', 'active'),
       ('protected-admin-breakglass', 'bryan.timm89@gmail.com', 'bryan.timm89@gmail.com', 'Bryan Timm', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES
       ('protected-admin-primary', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0),
       ('protected-admin-breakglass', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0)`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES
       ('protected-admin-primary', 'admin', 'global', ''),
       ('protected-admin-breakglass', 'admin', 'global', '')`,
  ).run();

  await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    writeCredentials: false,
  });

  const tokens = {
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-access-site-admin"),
    schoolAdminPrimary: await seedSession(db, env, "demo-administration-desert-valley-high", "site-access-school-admin"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-access-program-teacher"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-access-viewer"),
  };

  return { db, env, tokens };
}

async function createLegacyRosterFixture() {
  const db = createSqliteD1({ migrations: MIGRATIONS_WITHOUT_0016 });
  const env = {
    DB: db,
    SESSION_COOKIE_NAME: "sc_session",
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
  };

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, subscription_status, storage_mode)
     VALUES ('tenant-legacy-roster', 'Legacy Roster District', 'legacy-roster', 'active', 'trial', 'app_managed_google_drive')`,
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, school_year, status)
     VALUES ('site-legacy-roster', 'tenant-legacy-roster', 'Legacy Roster High', 'legacy-roster-high', '2026-2027', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES
       ('legacy-roster-admin', 'legacy.roster.admin@senior-capstone.test', 'legacy.roster.admin@senior-capstone.test', 'Legacy Roster Admin', 'active'),
       ('legacy-roster-student', 'legacy.roster.student@senior-capstone.test', 'legacy.roster.student@senior-capstone.test', 'Legacy Roster Student', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES
       ('legacy-roster-admin', 'global_admin', 'global', ''),
       ('legacy-roster-student', 'student', 'global', '')`,
  ).run();
  await db.prepare(
    `INSERT INTO site_users (site_id, user_id, membership_status)
     VALUES ('site-legacy-roster', 'legacy-roster-student', 'active')`,
  ).run();

  const token = await seedSession(db, env, "legacy-roster-admin", "legacy-roster-admin-token");
  return { db, env, token };
}

async function seedAccessHistoryAuditRows(db) {
  await db.prepare(
    `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
     VALUES
       (?, ?, ?, 'site_access_assignment', ?, ?, ?),
       (?, ?, ?, 'site_access_assignment', ?, ?, ?),
       (?, ?, ?, 'site_access_assignment', ?, ?, ?),
       (?, ?, ?, 'site_access_assignment', ?, ?, ?)`,
  ).bind(
    "audit-site-access-001",
    "demo-site-admin-desert-valley-high",
    "access.viewer_student_assigned",
    PRIMARY_SITE_ID,
    JSON.stringify({
      assignmentType: "viewer_student",
      action: "assign",
      siteId: PRIMARY_SITE_ID,
      targetUserId: "demo-viewer-desert-valley-high",
      studentId: "demo-student-001",
      adminNote: "Family schedule change",
    }),
    "2026-05-31T14:58:00.000Z",
    "audit-site-access-002",
    "protected-admin-primary",
    "access.program_teacher_program_removed",
    PRIMARY_SITE_ID,
    JSON.stringify({
      assignmentType: "program_teacher_program",
      action: "remove",
      siteId: PRIMARY_SITE_ID,
      targetUserId: "demo-teacher-it-01",
      programId: "it",
      adminNote: "Family schedule change",
    }),
    "2026-05-31T14:12:00.000Z",
    "audit-site-access-003",
    "demo-site-admin-canyon-ridge-career",
    "access.viewer_student_assigned",
    CANYON_SITE_ID,
    JSON.stringify({
      assignmentType: "viewer_student",
      action: "assign",
      siteId: CANYON_SITE_ID,
      targetUserId: "demo-viewer-desert-valley-high",
      studentId: "demo-student-001",
      adminNote: "Family schedule change",
    }),
    "2026-05-31T13:45:00.000Z",
    "audit-site-access-004",
    "demo-site-admin-desert-valley-high",
    "site_access_assignments_viewed",
    PRIMARY_SITE_ID,
    JSON.stringify({
      siteId: PRIMARY_SITE_ID,
    }),
    "2026-05-31T13:30:00.000Z",
  ).run();
}

async function expectAccessAssignments(env, token, query = "") {
  const { response, body } = await routeAccessAssignments(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site access assignments success");
  assert.equal(body.ok, true);
  return body;
}

async function routeAccessAssignments(env, token, query = "") {
  const response = await onSiteAccessAssignments({
    request: buildRequest(`https://local.capstone.test/api/site/access-assignments${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

async function routeAccessAssignmentsPost(env, token, body) {
  const response = await onSiteAccessAssignmentsPost({
    request: buildRequest("https://local.capstone.test/api/site/access-assignments", token, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
  });
  return { response, body: await response.json() };
}
