import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestGet as onMentorMeetingsGet, onRequestPost as onMentorMeetingsPost } from "../functions/api/mentor/meetings.ts";

test("mentor meetings endpoint enforces auth, assignment scope, and audit logging", async () => {
  const fixture = await createFixture();

  // GET requires auth
  {
    const response = await onMentorMeetingsGet({
      request: new Request("https://example.test/api/mentor/meetings"),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
  }

  // GET requires mentor role
  {
    const response = await onMentorMeetingsGet({
      request: buildAuthedRequest("https://example.test/api/mentor/meetings", fixture.studentToken),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
  }

  // POST denies mentors not assigned to the student + audits
  {
    const response = await onMentorMeetingsPost({
      request: buildAuthedJsonRequest("https://example.test/api/mentor/meetings", fixture.mentorToken, {
        studentId: "student-b",
        status: "held",
        notes: "Tried to record a meeting for an unassigned student.",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.mentorMeetings.length, 0);
    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "mentor_meeting_denied");
    assert.deepEqual(JSON.parse(fixture.db.data.auditEvents[0].metadata_json).studentId, "student-b");
  }

  // POST succeeds for assigned student + writes meeting row and audit row
  let createdMeetingId = null;
  {
    const response = await onMentorMeetingsPost({
      request: buildAuthedJsonRequest("https://example.test/api/mentor/meetings", fixture.mentorToken, {
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
    createdMeetingId = body.meeting.id;

    assert.equal(fixture.db.data.mentorMeetings.length, 1);
    assert.equal(fixture.db.data.mentorMeetings[0].id, createdMeetingId);
    assert.equal(fixture.db.data.auditEvents.filter((row) => row.action === "mentor_meeting_held").length, 1);
  }

  // GET returns the meeting with student identity fields
  {
    const response = await onMentorMeetingsGet({
      request: buildAuthedRequest("https://example.test/api/mentor/meetings", fixture.mentorToken),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.meetings.length, 1);
    assert.equal(body.meetings[0].id, createdMeetingId);
    assert.equal(body.meetings[0].studentId, "student-a");
    assert.equal(body.meetings[0].studentName, "Student A");
  }
});

async function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    mentorMeetings: [],
    auditEvents: [],
  });

  const env = {
    DB: db,
    SESSION_PEPPER: "",
  };

  db.data.userAccounts.push(buildUser("mentor-a", "Mentor A"));
  db.data.userAccounts.push(buildUser("student-a", "Student A"));
  db.data.userAccounts.push(buildUser("student-b", "Student B"));

  db.data.userRoles.push({ user_id: "mentor-a", role_id: "mentor", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "student-b", role_id: "student", scope_type: "global", scope_id: "" });

  db.data.mentorAssignments.push({
    id: "assign-1",
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    active: 1,
  });

  const mentorToken = "token-mentor-a";
  const studentToken = "token-student-a";

  db.data.sessions.push({
    id: "sess-mentor-a",
    user_id: "mentor-a",
    token_hash: await sha256Hex(`${env.SESSION_PEPPER}${mentorToken}`),
    expires_at: "2099-01-01T00:00:00.000Z",
    revoked_at: null,
  });

  db.data.sessions.push({
    id: "sess-student-a",
    user_id: "student-a",
    token_hash: await sha256Hex(`${env.SESSION_PEPPER}${studentToken}`),
    expires_at: "2099-01-01T00:00:00.000Z",
    revoked_at: null,
  });

  return {
    env,
    db,
    mentorToken,
    studentToken,
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

function buildAuthedRequest(url, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("cf-connecting-ip", "203.0.113.120");
  headers.set("user-agent", "integration-test");
  if (token) {
    headers.set("cookie", `sc_session=${token}`);
  }
  return new Request(url, { ...init, headers });
}

function buildAuthedJsonRequest(url, token, body) {
  return buildAuthedRequest(url, token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

    if (sql.includes("from mentor_assignments") && sql.includes("where mentor_user_id = ?") && sql.includes("student_user_id = ?")) {
      const [mentorUserId, studentUserId] = this.params;
      const row = this.db.data.mentorAssignments.find(
        (entry) => entry.mentor_user_id === mentorUserId && entry.student_user_id === studentUserId && Number(entry.active) === 1,
      );
      return row ? { id: row.id } : null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    const sql = this.normalizedSql();

    if (sql.includes("from mentor_meetings") && sql.includes("join user_accounts student")) {
      const [mentorUserId] = this.params;
      const results = this.db.data.mentorMeetings
        .filter((row) => row.mentor_user_id === mentorUserId)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .map((row) => {
          const student = this.db.data.userAccounts.find((u) => u.id === row.student_user_id);
          return {
            id: row.id,
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
