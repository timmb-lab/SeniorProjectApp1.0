import assert from "node:assert/strict";
import test from "node:test";

import {
  onRequestGet as onSiteMentorAssignments,
  onRequestPost as onSiteMentorAssignmentsPost,
} from "../functions/api/site/mentor-assignments.ts";
import { onRequestGet as onSiteDashboard } from "../functions/api/site/dashboard.ts";
import { onRequestGet as onSiteStudents } from "../functions/api/site/students.ts";
import { onRequestGet as onSiteStudentDetail } from "../functions/api/site/students/[studentId].ts";
import {
  DirectD1Adapter,
  runDemoSeed,
} from "../scripts/seed-local-demo-workspace.mjs";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
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
];

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const FORBIDDEN_RESPONSE_FIELDS = /drive_file_id|drive_parent_folder_id|root_folder_id|index_sheet_id|storage_key|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key|content_sha256|body_json|PASSWORD_PEPPER|temporaryPassword|setupPassword/i;
const MUTATION_PERMISSION_KEYS = ["canManageMentorAssignments", "canManageUsers", "canManageSecurity"];

test("site mentor assignment route is scoped, mutable for school ops and Program Teachers, audited, and redacted", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();
  const missingPrimary = await findMissingMentorStudents(env, PRIMARY_SITE_ID, 3);
  const missingCanyon = await findMissingMentorStudents(env, CANYON_SITE_ID, 1);
  const primaryMentor = await findActiveSiteMentor(env, PRIMARY_SITE_ID);
  const canyonMentor = await findActiveSiteMentor(env, CANYON_SITE_ID);

  {
    const { response, body } = await routeAssignments(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const platform = await expectAssignments(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(platform.scope.role, "global_admin");
  assert.equal(platform.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(platform.summary.studentsTotal, 250);
  assert.equal(platform.summary.studentsWithoutActiveMentor > 0, true);
  assert.equal(platform.pagination.total, 250);
  assert.equal(platform.pagination.returned <= 50, true);
  assert.equal(platform.unassignedStudents.every((row) => row.studentId.startsWith("demo-student-")), true);

  const legacy = await expectAssignments(env, tokens.legacyAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(legacy.scope.role, "global_admin");
  assert.equal(legacy.permissions.canManageMentorAssignments, true);

  const schoolAdmin = await expectAssignments(env, tokens.orgAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(schoolAdmin.scope.role, "administration");
  assert.equal(schoolAdmin.permissions.canManageMentorAssignments, true);

  const siteAdmin = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdmin.scope.role, "site_admin");
  assert.equal(siteAdmin.permissions.canManageMentorAssignments, true);
  assert.equal(siteAdmin.mentors.some((mentor) => mentor.mentorUserId === primaryMentor.id), true);
  assert.equal(siteAdmin.emptyState, null);
  assert.equal(siteAdmin.mentors.some((mentor) => mentor.nextAction === "Available for mentor support at this school."), true);
  assert.equal(siteAdmin.unassignedStudents.some((row) => row.nextAction === "Assign a mentor before the next follow-up checkpoint."), true);
  assert.doesNotMatch(JSON.stringify(siteAdmin), /selected-site|intervention checkpoint/i);
  const siteAdminDenied = await routeAssignments(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(siteAdminDenied.response.status, 403);
  assert.doesNotMatch(JSON.stringify(siteAdminDenied.body), /Canyon|site-canyon-ridge-career/i);

  const viewer = await routeAssignments(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.response.status, 403);
  assert.deepEqual(viewer.body, { error: "forbidden" });

  const teacher = await expectAssignments(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&limit=100`);
  assert.equal(teacher.scope.role, "program_teacher");
  assert.equal(teacher.scope.readOnly, false);
  assert.equal(teacher.scope.studentScope, "program_teacher");
  assert.equal(teacher.permissions.canManageMentorAssignments, true);
  assert.equal(teacher.pagination.total < platform.pagination.total, true);
  assert.equal([...teacher.unassignedStudents, ...teacher.assignments].every((row) => row.programId === "it"), true);

  for (const [label, token] of [
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc", tokens.miscAdmin],
  ]) {
    const denied = await routeAssignments(env, token, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, label);
    assert.deepEqual(denied.body, { error: "forbidden" }, label);
  }

  const noMentor = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&noMentor=true&limit=100`);
  assert.equal(noMentor.unassignedStudents.length > 0, true);
  assert.equal(noMentor.assignments.length, 0);
  assert.equal(noMentor.unassignedStudents.every((row) => row.riskFlags.includes("no_mentor")), true);
  assert.equal(noMentor.unassignedStudents.some((row) => /^Missing Mentor Demo/i.test(row.displayName)), true);

  const paged = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&limit=2`);
  const offset = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&limit=2&offset=2`);
  assert.equal(paged.pagination.limit, 2);
  assert.equal(paged.pagination.returned <= 2, true);
  assert.notEqual(offset.unassignedStudents[0]?.studentId || offset.assignments[0]?.studentId, paged.unassignedStudents[0]?.studentId || paged.assignments[0]?.studentId);

  const searched = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&studentSearch=${encodeURIComponent("Missing Mentor Demo")}&limit=100`);
  assert.equal(searched.unassignedStudents.every((row) => /Missing Mentor Demo/i.test(row.displayName)), true);
  const programFiltered = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&programId=it&limit=100`);
  assert.equal([...programFiltered.unassignedStudents, ...programFiltered.assignments].every((row) => row.programId === "it"), true);
  const mentorFiltered = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&mentorUserId=${primaryMentor.id}&limit=100`);
  assert.equal(mentorFiltered.assignments.every((row) => row.mentorUserId === primaryMentor.id), true);
  const emptyFiltered = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&studentSearch=${encodeURIComponent("No Match Student")}&limit=20`);
  assert.equal(emptyFiltered.pagination.filteredTotal, 0);
  assert.deepEqual(emptyFiltered.emptyState, {
    reason: "No mentor coverage records for this school match these filters.",
    owner: "Site administration.",
    nextAction: "Adjust filters or review missing mentor students in the student directory.",
  });

  const beforeDashboard = await expectDashboard(env, tokens.siteAdminPrimary);
  const beforeNoMentor = beforeDashboard.summary.studentsNoMentor;
  const created = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    studentId: missingPrimary[0].id,
    mentorUserId: primaryMentor.id,
    reason: "Assign mentor for intervention checkpoint.\nFollow up this week.",
  });
  assert.equal(created.response.status, 200);
  assert.equal(created.body.ok, true);
  assert.equal(created.body.assignment.studentId, missingPrimary[0].id);
  assert.equal(created.body.assignment.mentorUserId, primaryMentor.id);
  assert.equal(created.body.assignment.active, true);
  assert.doesNotMatch(JSON.stringify(created.body), FORBIDDEN_RESPONSE_FIELDS);

  const duplicate = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    studentId: missingPrimary[0].id,
    mentorUserId: primaryMentor.id,
    reason: "Duplicate assignment should be rejected.",
  });
  assert.equal(duplicate.response.status, 409);
  assert.deepEqual(duplicate.body, { error: "active_assignment_exists", ok: false });

  const refreshedNoMentor = await expectAssignments(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&noMentor=true&studentSearch=${encodeURIComponent(missingPrimary[0].display_name)}&limit=100`);
  assert.equal(refreshedNoMentor.pagination.filteredTotal, 0);
  assert.equal(refreshedNoMentor.unassignedStudents.length, 0);

  const detail = await routeStudentDetail(env, tokens.siteAdminPrimary, missingPrimary[0].id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.mentor.active, true);
  assert.equal(detail.body.mentor.mentorUserId, primaryMentor.id);

  const directory = await routeStudents(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&search=${encodeURIComponent(missingPrimary[0].display_name)}&limit=10`);
  assert.equal(directory.response.status, 200);
  assert.equal(directory.body.students[0].studentId, missingPrimary[0].id);
  assert.equal(directory.body.students[0].hasActiveMentor, true);
  assert.equal(directory.body.students[0].mentorUserId, primaryMentor.id);

  const afterDashboard = await expectDashboard(env, tokens.siteAdminPrimary);
  assert.equal(afterDashboard.summary.studentsNoMentor, beforeNoMentor - 1);

  const teacherAssignable = teacher.unassignedStudents.find(
    (row) => ![missingPrimary[0].id, missingPrimary[1].id, missingPrimary[2].id].includes(row.studentId),
  );
  assert.ok(teacherAssignable, "expected a Program Teacher scoped student without a mentor");
  const teacherCreated = await routeAssignmentPost(env, tokens.programTeacher, {
    siteId: PRIMARY_SITE_ID,
    studentId: teacherAssignable.studentId,
    mentorUserId: primaryMentor.id,
    reason: "Program Teacher assigns mentor coverage for a scoped student.",
  });
  assert.equal(teacherCreated.response.status, 200);
  assert.equal(teacherCreated.body.ok, true);

  const schoolAdminAssignable = teacher.unassignedStudents.find(
    (row) => ![
      missingPrimary[0].id,
      missingPrimary[1].id,
      missingPrimary[2].id,
      teacherAssignable.studentId,
    ].includes(row.studentId),
  );
  assert.ok(schoolAdminAssignable, "expected another scoped student for School Admin assignment");
  const schoolAdminCreated = await routeAssignmentPost(env, tokens.orgAdmin, {
    siteId: PRIMARY_SITE_ID,
    studentId: schoolAdminAssignable.studentId,
    mentorUserId: primaryMentor.id,
    reason: "School Admin assigns mentor coverage for an assigned school student.",
  });
  assert.equal(schoolAdminCreated.response.status, 200);
  assert.equal(schoolAdminCreated.body.ok, true);

  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES (?, 'site_admin', 'site', ?)`,
  ).bind("demo-site-admin-desert-valley-high", CANYON_SITE_ID).run();

  const inferredSite = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    studentId: missingPrimary[2].id,
    mentorUserId: primaryMentor.id,
    reason: "Assign mentor from the default site without posting siteId.",
  });
  assert.equal(inferredSite.response.status, 200);
  assert.equal(inferredSite.body.ok, true);
  assert.equal(inferredSite.body.assignment.studentId, missingPrimary[2].id);
  assert.equal(inferredSite.body.assignment.mentorUserId, primaryMentor.id);
  assert.equal(inferredSite.body.assignment.active, true);
  assert.doesNotMatch(JSON.stringify(inferredSite.body), FORBIDDEN_RESPONSE_FIELDS);

  const crossSiteMentor = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    studentId: missingPrimary[1].id,
    mentorUserId: canyonMentor.id,
    reason: "Cross-site mentor should not assign.",
  });
  assert.equal(crossSiteMentor.response.status, 404);
  assert.deepEqual(crossSiteMentor.body, { error: "not_found", ok: false });
  assert.doesNotMatch(JSON.stringify(crossSiteMentor.body), /Canyon|site-canyon-ridge-career/i);

  const crossSiteStudent = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    studentId: missingCanyon[0].id,
    mentorUserId: primaryMentor.id,
    reason: "Cross-site student should not assign.",
  });
  assert.equal(crossSiteStudent.response.status, 404);
  assert.deepEqual(crossSiteStudent.body, { error: "not_found", ok: false });

  const nonMentor = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    studentId: missingPrimary[1].id,
    mentorUserId: "demo-site-admin-desert-valley-high",
    reason: "A site admin is not a mentor.",
  });
  assert.equal(nonMentor.response.status, 404);

  const missingReason = await routeAssignmentPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    studentId: missingPrimary[1].id,
    mentorUserId: primaryMentor.id,
    reason: "  ",
  });
  assert.equal(missingReason.response.status, 400);
  assert.deepEqual(missingReason.body, { error: "reason_required", ok: false });

  for (const [label, token] of [
    ["viewer", tokens.viewerPrimary],
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc", tokens.miscAdmin],
  ]) {
    const denied = await routeAssignmentPost(env, token, {
      siteId: PRIMARY_SITE_ID,
      studentId: missingPrimary[1].id,
      mentorUserId: primaryMentor.id,
      reason: "Should not mutate.",
    });
    assert.equal(denied.response.status, 403, label);
  }

  for (const body of [platform, legacy, schoolAdmin, siteAdmin, teacher, noMentor, paged, offset, searched, programFiltered, mentorFiltered]) {
    assert.doesNotMatch(JSON.stringify(body), FORBIDDEN_RESPONSE_FIELDS);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_mentor_assignments_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_mentor_assignments_denied"), true);
  assert.equal(audits.some((event) => event.action === "site_mentor_assignments_unauthorized"), true);
  assert.equal(audits.some((event) => event.action === "site_mentor_assignment_created"), true);
  assert.equal(audits.some((event) => event.action === "site_mentor_assignment_conflict"), true);
  assert.doesNotMatch(JSON.stringify(audits), FORBIDDEN_RESPONSE_FIELDS);
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

  await seedUser(db, {
    id: "misc-mentor-assignment-user",
    displayName: "Misc Mentor Assignment User",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "readiness",
  });

  const tokens = {
    platformAdmin: await seedSession(db, env, "demo-platform-admin-001", "site-mentor-platform"),
    legacyAdmin: await seedSession(db, env, "protected-admin-primary", "site-mentor-legacy"),
    orgAdmin: await seedSession(db, env, "demo-administration-desert-valley-high", "site-mentor-org"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-mentor-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-mentor-viewer"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-mentor-teacher"),
    mentor: await seedSession(db, env, "demo-mentor-001", "site-mentor-mentor"),
    student: await seedSession(db, env, "demo-student-001", "site-mentor-student"),
    miscAdmin: await seedSession(db, env, "misc-mentor-assignment-user", "site-mentor-misc"),
  };

  return { db, env, tokens };
}

async function expectAssignments(env, token, query = "") {
  const { response, body } = await routeAssignments(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site mentor assignment success");
  assert.equal(body.ok, true);
  return body;
}

async function routeAssignments(env, token, query = "") {
  const response = await onSiteMentorAssignments({
    request: buildRequest(`https://local.capstone.test/api/site/mentor-assignments${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

async function routeAssignmentPost(env, token, body) {
  const response = await onSiteMentorAssignmentsPost({
    request: buildRequest("https://local.capstone.test/api/site/mentor-assignments", token, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
  });
  const responseBody = await response.json();
  return { response, body: responseBody };
}

async function routeStudentDetail(env, token, studentId, query = "") {
  const response = await onSiteStudentDetail({
    request: buildRequest(`https://local.capstone.test/api/site/students/${encodeURIComponent(studentId)}${query}`, token),
    env,
    params: { studentId },
  });
  const body = await response.json();
  return { response, body };
}

async function routeStudents(env, token, query = "") {
  const response = await onSiteStudents({
    request: buildRequest(`https://local.capstone.test/api/site/students${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

async function expectDashboard(env, token) {
  const response = await onSiteDashboard({
    request: buildRequest(`https://local.capstone.test/api/site/dashboard?siteId=${PRIMARY_SITE_ID}`, token),
    env,
  });
  const body = await response.json();
  assert.equal(response.status, 200, body?.error || "expected site dashboard success");
  return body;
}

async function findMissingMentorStudents(env, siteId, limit) {
  const rows = await env.DB.prepare(
    `SELECT student.id, student.display_name
     FROM site_users
     JOIN user_accounts student ON student.id = site_users.user_id
      AND student.status = 'active'
     JOIN user_roles student_role ON student_role.user_id = student.id
      AND student_role.role_id = 'student'
     LEFT JOIN mentor_assignments ON mentor_assignments.student_user_id = student.id
      AND mentor_assignments.active = 1
     WHERE site_users.site_id = ?
      AND site_users.membership_status = 'active'
      AND mentor_assignments.id IS NULL
     ORDER BY
      CASE WHEN student.display_name LIKE 'Missing Mentor Demo%' THEN 0 ELSE 1 END,
      student.display_name ASC
     LIMIT ?`,
  ).bind(siteId, limit).all();
  assert.equal((rows.results || []).length >= limit, true, `missing ${limit} no-mentor students for ${siteId}`);
  return rows.results || [];
}

async function findActiveSiteMentor(env, siteId) {
  const row = await env.DB.prepare(
    `SELECT mentor.id, mentor.display_name
     FROM site_users
     JOIN user_accounts mentor ON mentor.id = site_users.user_id
      AND mentor.status = 'active'
     JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
      AND mentor_role.role_id = 'mentor'
     WHERE site_users.site_id = ?
      AND site_users.membership_status = 'active'
     ORDER BY mentor.display_name ASC
     LIMIT 1`,
  ).bind(siteId).first();
  assert.ok(row, `missing active mentor for ${siteId}`);
  return row;
}
