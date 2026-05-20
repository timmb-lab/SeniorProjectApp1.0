import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessStudent,
  getRoleAssignments,
  hasRole,
  isAdmin,
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

test("role assignment helpers return stable role/scope records", async () => {
  const { env, users } = createFixture();

  assert.equal(await hasRole(env, users.studentA.id, "student"), true);
  assert.equal(await isAdmin(env, users.admin.id), true);
  assert.equal(await isAdmin(env, users.studentA.id), false);

  const assignments = await getRoleAssignments(env, users.teacherProgramIT.id);
  assert.deepEqual(assignments, [
    { role_id: "program_teacher", scope_type: "program", scope_id: "it" },
  ]);
});

function createFixture() {
  const groups = [
    { id: "group-a", program_id: "it", cohort_id: "cohort-a" },
    { id: "group-b", program_id: "culinary", cohort_id: "cohort-b" },
  ];

  const groupMemberships = [
    { user_id: "student-a", group_id: "group-a" },
    { user_id: "student-b", group_id: "group-b" },
  ];

  const userRoles = [
    { user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" },
    { user_id: "student-b", role_id: "student", scope_type: "global", scope_id: "" },
    { user_id: "admin", role_id: "admin", scope_type: "global", scope_id: "" },
    { user_id: "misc-admin", role_id: "misc_admin", scope_type: "global", scope_id: "" },
    { user_id: "mentor-active", role_id: "mentor", scope_type: "global", scope_id: "" },
    { user_id: "mentor-inactive", role_id: "mentor", scope_type: "global", scope_id: "" },
    { user_id: "teacher-global", role_id: "program_teacher", scope_type: "global", scope_id: "" },
    { user_id: "teacher-program-it", role_id: "program_teacher", scope_type: "program", scope_id: "it" },
    { user_id: "teacher-cohort-a", role_id: "program_teacher", scope_type: "cohort", scope_id: "cohort-a" },
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
    admin: buildUser("admin"),
    miscAdmin: buildUser("misc-admin"),
    mentorActive: buildUser("mentor-active"),
    mentorInactive: buildUser("mentor-inactive"),
    mentorNoRole: buildUser("mentor-no-role"),
    teacherGlobal: buildUser("teacher-global"),
    teacherProgramIT: buildUser("teacher-program-it"),
    teacherCohortA: buildUser("teacher-cohort-a"),
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

  const studentProgramIds = studentGroups.map((group) => group.program_id ?? "");
  const studentCohortIds = studentGroups.map((group) => group.cohort_id ?? "");

  const allowed = teacherAssignments.some((assignment) => {
    if (assignment.scope_type === "global") return true;
    if (assignment.scope_type === "program") {
      return studentProgramIds.includes(String(assignment.scope_id ?? ""));
    }
    if (assignment.scope_type === "cohort") {
      return studentCohortIds.includes(String(assignment.scope_id ?? ""));
    }
    return false;
  });

  return allowed ? { ok: 1 } : null;
}
