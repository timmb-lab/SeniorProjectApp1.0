import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessStudent,
  canViewAdminDashboard,
  canViewAggregateReadiness,
  canViewMentorDashboard,
  canViewProgramTeacherDashboard,
  canViewStudentDetail,
  getViewerRoleContext,
  getRoleAssignments,
  hasRole,
  isAdmin,
  isLegacyAdmin,
  isPlatformAdmin,
} from "../functions/_lib/permissions.ts";

test("permission helpers enforce default-deny student access rules", async () => {
  const { env, users } = createFixture();

  assert.equal(await canAccessStudent(env, users.studentA, users.studentA.id), true);
  assert.equal(await canAccessStudent(env, users.studentA, users.studentB.id), false);
  assert.equal(await canAccessStudent(env, users.miscAdmin, users.studentA.id), false);
});

test("permission helpers allow admins to access any student", async () => {
  const { env, users } = createFixture();
  assert.equal(await canAccessStudent(env, users.admin, users.studentA.id), true);
  assert.equal(await canAccessStudent(env, users.admin, users.studentB.id), true);
});

test("permission helpers allow mentors only when the assignment is active", async () => {
  const { env, users } = createFixture();

  assert.equal(await canAccessStudent(env, users.mentorActive, users.studentA.id), true);
  assert.equal(await canAccessStudent(env, users.mentorInactive, users.studentA.id), false);
});

test("permission helpers deny mentor assignments when the mentor role is missing", async () => {
  const { env, users } = createFixture();
  assert.equal(await canAccessStudent(env, users.mentorNoRole, users.studentA.id), false);
});

test("permission helpers allow program teachers with global scope", async () => {
  const { env, users } = createFixture();
  assert.equal(await canAccessStudent(env, users.teacherGlobal, users.studentA.id), true);
  assert.equal(await canAccessStudent(env, users.teacherGlobal, users.studentB.id), true);
});

test("permission helpers allow program teachers scoped to student program", async () => {
  const { env, users } = createFixture();

  assert.equal(await canAccessStudent(env, users.teacherProgramIT, users.studentA.id), true);
  assert.equal(await canAccessStudent(env, users.teacherProgramIT, users.studentB.id), false);
});

test("permission helpers allow program teachers scoped to student cohort", async () => {
  const { env, users } = createFixture();

  assert.equal(await canAccessStudent(env, users.teacherCohortA, users.studentA.id), true);
  assert.equal(await canAccessStudent(env, users.teacherCohortA, users.studentB.id), false);
});

test("permission helpers deny program teachers with empty scope ids (no null/empty matching)", async () => {
  const { env, users } = createFixture();
  assert.equal(await canAccessStudent(env, users.teacherProgramEmpty, users.studentCohortOnly.id), false);
});

test("role assignment helpers return stable role/scope records", async () => {
  const { env, users } = createFixture();

  assert.equal(await hasRole(env, users.studentA.id, "student"), true);
  assert.equal(await isLegacyAdmin(env, users.admin.id), true);
  assert.equal(await isAdmin(env, users.admin.id), true);
  assert.equal(await isPlatformAdmin(env, users.admin.id), true);
  assert.equal(await isPlatformAdmin(env, users.platformAdmin.id), true);
  assert.equal(await isAdmin(env, users.platformAdmin.id), false);
  assert.equal(await isAdmin(env, users.studentA.id), false);
  assert.equal(await isPlatformAdmin(env, users.miscAdmin.id), false);

  const assignments = await getRoleAssignments(env, users.teacherProgramIT.id);
  assert.deepEqual(assignments, [
    { role_id: "program_teacher", scope_type: "program", scope_id: "it" },
  ]);
});

test("role hierarchy helpers expose primary context and protected dashboard access", async () => {
  const { env, users } = createFixture();

  const adminContext = await getViewerRoleContext(env, users.admin);
  assert.equal(adminContext.primaryRole, "admin");
  assert.equal(adminContext.isAdmin, true);
  assert.equal(adminContext.isPlatformAdmin, true);
  assert.equal(await canViewAdminDashboard(env, users.admin), true);
  assert.equal(await canViewAggregateReadiness(env, users.admin), true);

  const platformContext = await getViewerRoleContext(env, users.platformAdmin);
  assert.equal(platformContext.primaryRole, "platform_admin");
  assert.equal(platformContext.isAdmin, false);
  assert.equal(platformContext.isPlatformAdmin, true);
  assert.equal(await canViewAdminDashboard(env, users.platformAdmin), false);

  assert.equal((await getViewerRoleContext(env, users.orgAdmin)).primaryRole, "org_admin");
  assert.equal((await getViewerRoleContext(env, users.siteAdmin)).primaryRole, "site_admin");
  assert.equal((await getViewerRoleContext(env, users.viewer)).primaryRole, "viewer");

  assert.equal(await canViewProgramTeacherDashboard(env, users.teacherProgramIT), true);
  assert.equal(await canViewProgramTeacherDashboard(env, users.teacherProgramEmpty), false);
  assert.equal(await canViewMentorDashboard(env, users.mentorActive), true);
  assert.equal(await canViewStudentDetail(env, users.mentorActive, users.studentA.id), true);
  assert.equal(await canViewStudentDetail(env, users.mentorInactive, users.studentA.id), false);
  assert.equal(await canViewStudentDetail(env, users.studentA, users.studentA.id), true);
  assert.equal(await canViewStudentDetail(env, users.studentA, users.studentB.id), false);
  assert.equal(await canViewStudentDetail(env, users.miscAdmin, users.studentA.id), false);
  assert.equal(await canViewAggregateReadiness(env, users.miscAdmin), true);

  const pendingContext = await getViewerRoleContext(env, users.rolePending);
  assert.equal(pendingContext.primaryRole, "role_pending");
  assert.equal(await canViewAdminDashboard(env, users.rolePending), false);
  assert.equal(await canViewAggregateReadiness(env, users.rolePending), false);
  assert.equal(await canViewProgramTeacherDashboard(env, users.rolePending), false);
  assert.equal(await canViewMentorDashboard(env, users.rolePending), false);
});

function createFixture() {
  const groups = [
    { id: "group-a", program_id: "it", cohort_id: "cohort-a" },
    { id: "group-b", program_id: "culinary", cohort_id: "cohort-b" },
    { id: "group-cohort-only", program_id: null, cohort_id: "cohort-a" },
  ];

  const groupMemberships = [
    { user_id: "student-a", group_id: "group-a" },
    { user_id: "student-b", group_id: "group-b" },
    { user_id: "student-cohort-only", group_id: "group-cohort-only" },
  ];

  const userRoles = [
    { user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" },
    { user_id: "student-b", role_id: "student", scope_type: "global", scope_id: "" },
    { user_id: "student-cohort-only", role_id: "student", scope_type: "global", scope_id: "" },
    { user_id: "platform-admin", role_id: "platform_admin", scope_type: "global", scope_id: "" },
    { user_id: "admin", role_id: "admin", scope_type: "global", scope_id: "" },
    { user_id: "org-admin", role_id: "org_admin", scope_type: "global", scope_id: "" },
    { user_id: "site-admin", role_id: "site_admin", scope_type: "global", scope_id: "" },
    { user_id: "viewer", role_id: "viewer", scope_type: "global", scope_id: "" },
    { user_id: "misc-admin", role_id: "misc_admin", scope_type: "global", scope_id: "" },
    { user_id: "mentor-active", role_id: "mentor", scope_type: "global", scope_id: "" },
    { user_id: "mentor-inactive", role_id: "mentor", scope_type: "global", scope_id: "" },
    { user_id: "teacher-global", role_id: "program_teacher", scope_type: "global", scope_id: "" },
    { user_id: "teacher-program-it", role_id: "program_teacher", scope_type: "program", scope_id: "it" },
    { user_id: "teacher-cohort-a", role_id: "program_teacher", scope_type: "cohort", scope_id: "cohort-a" },
    { user_id: "teacher-program-empty", role_id: "program_teacher", scope_type: "program", scope_id: "" },
  ];

  const mentorAssignments = [
    { mentor_user_id: "mentor-active", student_user_id: "student-a", active: 1 },
    { mentor_user_id: "mentor-inactive", student_user_id: "student-a", active: 0 },
    { mentor_user_id: "mentor-no-role", student_user_id: "student-a", active: 1 },
  ];

  const env = {
    DB: new MockD1Database({ userRoles, mentorAssignments, groupMemberships, groups }),
  };

  const users = {
    studentA: buildUser("student-a"),
    studentB: buildUser("student-b"),
    studentCohortOnly: buildUser("student-cohort-only"),
    platformAdmin: buildUser("platform-admin"),
    admin: buildUser("admin"),
    orgAdmin: buildUser("org-admin"),
    siteAdmin: buildUser("site-admin"),
    viewer: buildUser("viewer"),
    miscAdmin: buildUser("misc-admin"),
    mentorActive: buildUser("mentor-active"),
    mentorInactive: buildUser("mentor-inactive"),
    mentorNoRole: buildUser("mentor-no-role"),
    teacherGlobal: buildUser("teacher-global"),
    teacherProgramIT: buildUser("teacher-program-it"),
    teacherCohortA: buildUser("teacher-cohort-a"),
    teacherProgramEmpty: buildUser("teacher-program-empty"),
    rolePending: buildUser("role-pending"),
  };

  return { env, users };
}

function buildUser(id) {
  return {
    id,
    email: `${id}@senior-capstone.test`,
    email_norm: `${id}@senior-capstone.test`,
    display_name: id,
    status: "active",
  };
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

class MockD1Database {
  constructor(data) {
    this.data = data;
  }

  prepare(sql) {
    return new MockPreparedStatement(sql, this.data);
  }
}

class MockPreparedStatement {
  constructor(sql, data) {
    this.sql = normalizeSql(sql);
    this.data = data;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ?")) {
      const [userId, roleId] = this.params;
      const exists = this.data.userRoles.some(
        (row) => row.user_id === userId && row.role_id === roleId,
      );
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.includes("from mentor_assignments")) {
      const [mentorId, studentId] = this.params;
      const hasMentorRole = this.data.userRoles.some(
        (row) => row.user_id === mentorId && row.role_id === "mentor",
      );
      if (!hasMentorRole) return null;
      const exists = this.data.mentorAssignments.some(
        (row) =>
          row.mentor_user_id === mentorId &&
          row.student_user_id === studentId &&
          Number(row.active) === 1,
      );
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.includes("from user_roles teacher_role")) {
      const [studentId, teacherId] = this.params;
      return resolveTeacherScopeRow(this.data, { studentId, teacherId });
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params;
      const results = this.data.userRoles
        .filter((row) => row.user_id === userId)
        .map((row) => ({
          role_id: row.role_id,
          scope_type: row.scope_type,
          scope_id: row.scope_id,
        }));
      return { results };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    throw new Error(`Unexpected D1 run() query: ${this.sql}`);
  }
}

function resolveTeacherScopeRow(data, { studentId, teacherId }) {
  const teacherAssignments = data.userRoles.filter(
    (row) => row.user_id === teacherId && row.role_id === "program_teacher",
  );
  if (teacherAssignments.length === 0) return null;

  const studentGroups = data.groupMemberships
    .filter((membership) => membership.user_id === studentId)
    .map((membership) => data.groups.find((group) => group.id === membership.group_id))
    .filter(Boolean);

  if (studentGroups.length === 0) {
    return null;
  }

  const studentProgramIds = studentGroups
    .map((group) => group.program_id)
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map((value) => String(value));

  const studentCohortIds = studentGroups
    .map((group) => group.cohort_id)
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map((value) => String(value));

  const allowed = teacherAssignments.some((assignment) => {
    if (assignment.scope_type === "global") return true;

    const scopeId = String(assignment.scope_id ?? "").trim();
    if (!scopeId) return false;

    if (assignment.scope_type === "program") {
      return studentProgramIds.includes(scopeId);
    }
    if (assignment.scope_type === "cohort") {
      return studentCohortIds.includes(scopeId);
    }
    return false;
  });

  return allowed ? { ok: 1 } : null;
}
