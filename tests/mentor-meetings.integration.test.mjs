import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestGet as onMentorMeetingsGet, onRequestPost as onMentorMeetingsPost } from "../functions/api/mentor/meetings.ts";

test("mentor meetings endpoint audits scoped read access across roles", async () => {
  const fixture = await createFixture();

  // GET requires auth and writes an unauthenticated access audit.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings?studentId=student-a"),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
    assert.equal(fixture.db.data.auditEvents.at(-1).actor_user_id, null);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meetings_unauthorized");
    assert.equal(fixture.db.data.auditEvents.at(-1).entity_id, "student-a");
    assert.deepEqual(readAuditMetadata(fixture), { reason: "missing_session" });
  }

  // Misc-admin broad access is denied and audited with role scope.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings", fixture.tokens.misc),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meetings_denied");
    assert.deepEqual(readAuditMetadata(fixture), {
      reason: "missing_meeting_view_role",
      actorRoleScopes: [{ roleId: "misc_admin", scopeType: "reporting", scopeId: "alpha-readiness" }],
    });
  }

  // Student self-view returns only own meeting rows and no other student record.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings", fixture.tokens.studentA),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.meetings.map((meeting) => meeting.studentId), ["student-a"]);
    assert.equal(body.meetings[0].mentorId, "mentor-a");
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meetings_viewed");
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "student", scopeType: "global", scopeId: "" },
    ]);
  }

  // Student cannot request another student's meeting records.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings?studentId=student-b", fixture.tokens.studentA),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meetings_denied");
    assert.deepEqual(readAuditMetadata(fixture), {
      reason: "student_scope_denied",
      actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
    });
  }

  // Assigned mentor can view only assigned student meetings.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings", fixture.tokens.mentorA),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.meetings.map((meeting) => meeting.studentId), ["student-a"]);
    assert.equal(body.meetings[0].studentName, "Student A");
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meetings_viewed");
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "mentor", scopeType: "global", scopeId: "" },
    ]);
  }

  // Inactive mentor assignments are denied for targeted readback.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings?studentId=student-a", fixture.tokens.inactiveMentor),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meetings_denied");
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "mentor", scopeType: "global", scopeId: "" },
    ]);
  }

  // Program teacher scopes are honored, and empty scopes default deny.
  {
    const allowedResponse = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings", fixture.tokens.teacherIt),
      env: fixture.env,
    });
    assert.equal(allowedResponse.status, 200);
    const body = await allowedResponse.json();
    assert.deepEqual(body.meetings.map((meeting) => meeting.studentId), ["student-a"]);
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "program_teacher", scopeType: "program", scopeId: "it" },
    ]);

    const deniedResponse = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings?studentId=student-a", fixture.tokens.teacherEmpty),
      env: fixture.env,
    });
    assert.equal(deniedResponse.status, 403);
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "program_teacher", scopeType: "program", scopeId: "" },
    ]);
  }

  // Admin can inspect across programs.
  {
    const response = await onMentorMeetingsGet({
      request: buildRequest("https://example.test/api/mentor/meetings", fixture.tokens.admin),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.meetings.map((meeting) => meeting.studentId).sort(), ["student-a", "student-b"]);
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "admin", scopeType: "global", scopeId: "" },
    ]);
  }
});

test("mentor meetings endpoint enforces mutation auth, assignment scope, and audit logging", async () => {
  const fixture = await createFixture();

  // POST requires auth and records the missing-session attempt.
  {
    const response = await onMentorMeetingsPost({
      request: buildJsonRequest("https://example.test/api/mentor/meetings", null, {
        studentId: "student-a",
        status: "held",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meeting_unauthorized");
    assert.deepEqual(readAuditMetadata(fixture), {
      reason: "missing_session",
      studentId: "student-a",
      status: "held",
    });
  }

  // POST requires mentor role and audits role denial with scopes.
  {
    const response = await onMentorMeetingsPost({
      request: buildJsonRequest("https://example.test/api/mentor/meetings", fixture.tokens.studentA, {
        studentId: "student-a",
        status: "held",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meeting_denied");
    assert.deepEqual(readAuditMetadata(fixture), {
      reason: "missing_mentor_role",
      studentId: "student-a",
      status: "held",
      actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
    });
  }

  // POST denies mentors not assigned to the student and audits scope metadata.
  {
    const response = await onMentorMeetingsPost({
      request: buildJsonRequest("https://example.test/api/mentor/meetings", fixture.tokens.mentorA, {
        studentId: "student-b",
        status: "held",
        notes: "Tried to record a meeting for an unassigned student.",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.mentorMeetings.length, 2);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meeting_denied");
    assert.deepEqual(readAuditMetadata(fixture), {
      studentId: "student-b",
      status: "held",
      actorRoleScopes: [{ roleId: "mentor", scopeType: "global", scopeId: "" }],
    });
  }

  // POST succeeds for assigned student and writes a meeting row plus audit row.
  {
    const response = await onMentorMeetingsPost({
      request: buildJsonRequest("https://example.test/api/mentor/meetings", fixture.tokens.mentorA, {
        studentId: "student-a",
        status: "held",
        notes: "Met to review evidence plan and presentation outline.",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.meeting.studentId, "student-a");
    assert.equal(body.meeting.status, "held");
    assert.equal(typeof body.meeting.id, "string");
    assert.equal(typeof body.meeting.heldAt, "string");

    assert.equal(fixture.db.data.mentorMeetings.length, 3);
    assert.equal(fixture.db.data.mentorMeetings.at(-1).id, body.meeting.id);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "mentor_meeting_held");
    assert.deepEqual(readAuditMetadata(fixture).actorRoleScopes, [
      { roleId: "mentor", scopeType: "global", scopeId: "" },
    ]);
  }
});

async function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    groups: [],
    groupMemberships: [],
    mentorAssignments: [],
    mentorMeetings: [],
    auditEvents: [],
  });

  const env = {
    DB: db,
    SESSION_PEPPER: "",
  };

  for (const [id, displayName] of [
    ["admin-a", "Admin A"],
    ["teacher-it", "Teacher IT"],
    ["teacher-empty", "Teacher Empty"],
    ["misc-a", "Misc A"],
    ["mentor-a", "Mentor A"],
    ["mentor-b", "Mentor B"],
    ["mentor-inactive", "Mentor Inactive"],
    ["student-a", "Student A"],
    ["student-b", "Student B"],
  ]) {
    db.data.userAccounts.push(buildUser(id, displayName));
  }

  db.data.userRoles.push({ user_id: "admin-a", role_id: "admin", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "teacher-it", role_id: "program_teacher", scope_type: "program", scope_id: "it" });
  db.data.userRoles.push({ user_id: "teacher-empty", role_id: "program_teacher", scope_type: "program", scope_id: "" });
  db.data.userRoles.push({ user_id: "misc-a", role_id: "misc_admin", scope_type: "reporting", scope_id: "alpha-readiness" });
  db.data.userRoles.push({ user_id: "mentor-a", role_id: "mentor", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "mentor-b", role_id: "mentor", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "mentor-inactive", role_id: "mentor", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "student-b", role_id: "student", scope_type: "global", scope_id: "" });

  db.data.groups.push({ id: "group-it", program_id: "it", cohort_id: "alpha-2026" });
  db.data.groups.push({ id: "group-culinary", program_id: "culinary", cohort_id: "alpha-2026" });
  db.data.groupMemberships.push({ group_id: "group-it", user_id: "student-a" });
  db.data.groupMemberships.push({ group_id: "group-culinary", user_id: "student-b" });

  db.data.mentorAssignments.push({ id: "assign-a", mentor_user_id: "mentor-a", student_user_id: "student-a", active: 1 });
  db.data.mentorAssignments.push({ id: "assign-b", mentor_user_id: "mentor-b", student_user_id: "student-b", active: 1 });
  db.data.mentorAssignments.push({ id: "assign-inactive", mentor_user_id: "mentor-inactive", student_user_id: "student-a", active: 0 });

  db.data.mentorMeetings.push(buildMeeting({
    id: "meeting-a",
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    notes: "Evidence plan ready.",
  }));
  db.data.mentorMeetings.push(buildMeeting({
    id: "meeting-b",
    mentor_user_id: "mentor-b",
    student_user_id: "student-b",
    notes: "Scope needs refinement.",
  }));

  const tokens = {
    admin: "token-admin-a",
    teacherIt: "token-teacher-it",
    teacherEmpty: "token-teacher-empty",
    misc: "token-misc-a",
    mentorA: "token-mentor-a",
    inactiveMentor: "token-mentor-inactive",
    studentA: "token-student-a",
  };

  for (const [userId, token] of [
    ["admin-a", tokens.admin],
    ["teacher-it", tokens.teacherIt],
    ["teacher-empty", tokens.teacherEmpty],
    ["misc-a", tokens.misc],
    ["mentor-a", tokens.mentorA],
    ["mentor-inactive", tokens.inactiveMentor],
    ["student-a", tokens.studentA],
  ]) {
    db.data.sessions.push({
      id: `sess-${userId}`,
      user_id: userId,
      token_hash: await sha256Hex(`${env.SESSION_PEPPER}${token}`),
      expires_at: "2099-01-01T00:00:00.000Z",
      revoked_at: null,
    });
  }

  return {
    env,
    db,
    tokens,
  };
}

function buildUser(id, displayName) {
  return {
    id,
    email: `${id}@senior-capstone.test`,
    email_norm: `${id}@senior-capstone.test`,
    display_name: displayName,
    status: "active",
  };
}

function buildMeeting(overrides) {
  return {
    id: "meeting",
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    submission_id: null,
    status: "held",
    scheduled_for: null,
    held_at: "2026-05-20T09:00:00.000Z",
    notes: null,
    created_by: "mentor-a",
    created_at: "2026-05-20T09:00:00.000Z",
    updated_at: "2026-05-20T09:00:00.000Z",
    ...overrides,
  };
}

function buildRequest(url, token = null, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("cf-connecting-ip", "203.0.113.120");
  headers.set("user-agent", "mentor-meetings-test");
  if (token) {
    headers.set("cookie", `sc_session=${token}`);
  }
  return new Request(url, { ...init, headers });
}

function buildJsonRequest(url, token, body) {
  return buildRequest(url, token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function readAuditMetadata(fixture) {
  const row = fixture.db.data.auditEvents.at(-1);
  return row?.metadata_json ? JSON.parse(row.metadata_json) : null;
}

class MockD1Database {
  constructor(data) {
    this.data = data;
    this.clockMs = new Date("2026-05-20T00:00:00.000Z").getTime();
  }

  prepare(sql) {
    return new MockD1PreparedStatement(this, sql);
  }

  nowIso() {
    this.clockMs += 1000;
    return new Date(this.clockMs).toISOString();
  }
}

class MockD1PreparedStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  normalizedSql() {
    return String(this.sql).replace(/\s+/g, " ").trim().toLowerCase();
  }

  async first() {
    const sql = this.normalizedSql();

    if (sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params;
      const nowIso = this.db.nowIso();
      const session = this.db.data.sessions.find(
        (row) => row.token_hash === tokenHash && !row.revoked_at && String(row.expires_at) > nowIso,
      );
      return session
        ? {
            id: session.id,
            user_id: session.user_id,
            token_hash: session.token_hash,
            expires_at: session.expires_at,
            revoked_at: session.revoked_at,
          }
        : null;
    }

    if (sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ?")) {
      const [userId] = this.params;
      const user = this.db.data.userAccounts.find((row) => row.id === userId && row.status === "active");
      return user
        ? {
            id: user.id,
            email: user.email,
            email_norm: user.email_norm,
            display_name: user.display_name,
            status: user.status,
          }
        : null;
    }

    if (sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ?")) {
      const [userId, roleId] = this.params;
      const row = this.db.data.userRoles.find((entry) => entry.user_id === userId && entry.role_id === roleId);
      return row ? { ok: 1 } : null;
    }

    if (sql.includes("from mentor_assignments ma") && sql.includes("join user_roles mentor_role")) {
      const [mentorUserId, studentUserId] = this.params;
      const hasMentorRole = this.db.data.userRoles.some(
        (entry) => entry.user_id === mentorUserId && entry.role_id === "mentor",
      );
      const row = this.db.data.mentorAssignments.find(
        (entry) => entry.mentor_user_id === mentorUserId && entry.student_user_id === studentUserId && Number(entry.active) === 1,
      );
      return hasMentorRole && row ? { ok: 1 } : null;
    }

    if (sql.includes("from mentor_assignments") && sql.includes("where mentor_user_id = ?") && sql.includes("student_user_id = ?")) {
      const [mentorUserId, studentUserId] = this.params;
      const row = this.db.data.mentorAssignments.find(
        (entry) => entry.mentor_user_id === mentorUserId && entry.student_user_id === studentUserId && Number(entry.active) === 1,
      );
      return row ? { id: row.id } : null;
    }

    if (sql.includes("from user_roles teacher_role") && sql.includes("join group_memberships student_group")) {
      const [studentId, teacherId] = this.params;
      return resolveTeacherScopeRow(this.db.data, { studentId, teacherId });
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    const sql = this.normalizedSql();

    if (sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params;
      return {
        results: this.db.data.userRoles
          .filter((row) => row.user_id === userId)
          .map((row) => ({
            role_id: row.role_id,
            scope_type: row.scope_type,
            scope_id: row.scope_id,
          })),
      };
    }

    if (sql.includes("from mentor_meetings") && sql.includes("join user_accounts student")) {
      const results = this.db.data.mentorMeetings
        .filter((row) => {
          if (sql.includes("mentor_meetings.student_user_id = ? and mentor_meetings.mentor_user_id = ?")) {
            const [studentId, mentorId] = this.params;
            return row.student_user_id === studentId && row.mentor_user_id === mentorId;
          }
          if (sql.includes("mentor_meetings.student_user_id = ?")) {
            const [studentId] = this.params;
            return row.student_user_id === studentId;
          }
          if (sql.includes("mentor_meetings.mentor_user_id = ?")) {
            const [mentorId] = this.params;
            return row.mentor_user_id === mentorId;
          }
          return true;
        })
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .map((row) => {
          const student = this.db.data.userAccounts.find((u) => u.id === row.student_user_id);
          const mentor = this.db.data.userAccounts.find((u) => u.id === row.mentor_user_id);
          return {
            id: row.id,
            mentor_id: row.mentor_user_id,
            mentor_name: mentor?.display_name || "Unknown",
            student_id: row.student_user_id,
            student_name: student?.display_name || "Unknown",
            status: row.status,
            scheduled_for: row.scheduled_for ?? null,
            held_at: row.held_at ?? null,
            notes: row.notes ?? null,
            created_at: row.created_at,
          };
        });
      return { results };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    const sql = this.normalizedSql();

    if (sql.startsWith("update sessions set last_seen_at = strftime")) {
      return { success: true, results: [] };
    }

    if (sql.startsWith("insert into mentor_meetings")) {
      const [
        id,
        mentorUserId,
        studentUserId,
        submissionId,
        status,
        scheduledFor,
        heldAt,
        notes,
        createdBy,
      ] = this.params;
      const createdAt = this.db.nowIso();
      this.db.data.mentorMeetings.push({
        id,
        mentor_user_id: mentorUserId,
        student_user_id: studentUserId,
        submission_id: submissionId,
        status,
        scheduled_for: scheduledFor,
        held_at: heldAt,
        notes,
        created_by: createdBy,
        created_at: createdAt,
        updated_at: createdAt,
      });
      return { success: true, results: [] };
    }

    if (sql.startsWith("insert into audit_events")) {
      const [
        id,
        actorUserId,
        action,
        entityType,
        entityId,
        ipHash,
        userAgentHash,
        metadataJson,
      ] = this.params;
      this.db.data.auditEvents.push({
        id,
        actor_user_id: actorUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        metadata_json: metadataJson,
        created_at: this.db.nowIso(),
      });
      return { success: true, results: [] };
    }

    throw new Error(`Unmocked D1 run() query: ${this.sql}`);
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

  if (studentGroups.length === 0) return null;

  const studentProgramIds = studentGroups
    .map((group) => group.program_id)
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map(String);

  const studentCohortIds = studentGroups
    .map((group) => group.cohort_id)
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map(String);

  const allowed = teacherAssignments.some((assignment) => {
    if (assignment.scope_type === "global") return true;
    const scopeId = String(assignment.scope_id ?? "").trim();
    if (!scopeId) return false;
    if (assignment.scope_type === "program") return studentProgramIds.includes(scopeId);
    if (assignment.scope_type === "cohort") return studentCohortIds.includes(scopeId);
    return false;
  });

  return allowed ? { ok: 1 } : null;
}
