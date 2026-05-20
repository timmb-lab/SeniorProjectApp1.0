import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestGet as onPresentationSlotsGet, onRequestPost as onPresentationSlotsPost } from "../functions/api/presentation-slots.ts";

test("presentation slots enforce scoped visibility, conflict checks, and audit events", async () => {
  const fixture = await createFixture();

  // GET requires auth.
  {
    const response = await onPresentationSlotsGet({
      request: new Request("https://example.test/api/presentation-slots"),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
  }

  // Mentors only see slots for assigned students.
  {
    const response = await onPresentationSlotsGet({
      request: buildAuthedRequest("https://example.test/api/presentation-slots", fixture.mentorToken),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.slots.map((slot) => slot.studentId), ["student-a"]);
    assert.equal(body.slots[0].location, "Room 101");
  }

  // Mentors can view assigned slots, but scheduling is limited to admin/program teacher staff.
  {
    const response = await onPresentationSlotsPost({
      request: buildAuthedJsonRequest("https://example.test/api/presentation-slots", fixture.mentorToken, {
        studentId: "student-a",
        scheduledFor: "2026-03-26T16:45:00.000Z",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "presentation_slot_denied");
    assert.deepEqual(JSON.parse(fixture.db.data.auditEvents.at(-1).metadata_json).reason, "role_not_allowed");
  }

  // Program teachers cannot schedule out-of-scope students.
  {
    const response = await onPresentationSlotsPost({
      request: buildAuthedJsonRequest("https://example.test/api/presentation-slots", fixture.teacherToken, {
        studentId: "student-b",
        scheduledFor: "2026-03-26T16:45:00.000Z",
        location: "Room 101",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "presentation_slot_denied");
    assert.deepEqual(JSON.parse(fixture.db.data.auditEvents.at(-1).metadata_json).reason, "student_scope");
  }

  // Same-location overlapping slot is blocked and audited.
  {
    const response = await onPresentationSlotsPost({
      request: buildAuthedJsonRequest("https://example.test/api/presentation-slots", fixture.teacherToken, {
        studentId: "student-a",
        submissionId: "submission-a",
        scheduledFor: "2026-03-26T16:10:00.000Z",
        durationMinutes: 15,
        location: "Room 101",
        outlineStatus: "approved",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 409);
    const body = await response.json();
    assert.equal(body.error, "presentation_slot_conflict");
    assert.equal(body.conflict.id, "slot-existing-a");
    assert.equal(fixture.db.data.presentationSlots.length, 2);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "presentation_slot_conflict");
  }

  // Scoped teacher can schedule a non-conflicting slot.
  let teacherSlotId = "";
  {
    const response = await onPresentationSlotsPost({
      request: buildAuthedJsonRequest("https://example.test/api/presentation-slots", fixture.teacherToken, {
        studentId: "student-a",
        submissionId: "submission-a",
        requirementId: "req-presentation-day",
        scheduledFor: "2026-03-26T16:30:00.000Z",
        durationMinutes: 15,
        location: "Room 101",
        outlineStatus: "approved",
        notes: "Confirmed outline and presentation materials.",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.slot.studentId, "student-a");
    assert.equal(body.slot.status, "scheduled");
    assert.equal(body.slot.outlineStatus, "approved");
    teacherSlotId = body.slot.id;
    assert.equal(fixture.db.data.presentationSlots.at(-1).id, teacherSlotId);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "presentation_slot_scheduled");
  }

  // Admin can schedule across programs.
  {
    const response = await onPresentationSlotsPost({
      request: buildAuthedJsonRequest("https://example.test/api/presentation-slots", fixture.adminToken, {
        studentId: "student-b",
        scheduledFor: "2026-03-26T17:00:00.000Z",
        durationMinutes: 20,
        location: "Room 103",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.slot.studentId, "student-b");
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "presentation_slot_scheduled");
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
    submissions: [],
    presentationSlots: [],
    auditEvents: [],
  });

  const env = {
    DB: db,
    SESSION_PEPPER: "",
  };

  db.data.userAccounts.push(buildUser("admin-a", "Admin A"));
  db.data.userAccounts.push(buildUser("teacher-a", "Teacher A"));
  db.data.userAccounts.push(buildUser("mentor-a", "Mentor A"));
  db.data.userAccounts.push(buildUser("student-a", "Student A"));
  db.data.userAccounts.push(buildUser("student-b", "Student B"));

  db.data.userRoles.push({ user_id: "admin-a", role_id: "admin", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "teacher-a", role_id: "program_teacher", scope_type: "program", scope_id: "it" });
  db.data.userRoles.push({ user_id: "mentor-a", role_id: "mentor", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "student-b", role_id: "student", scope_type: "global", scope_id: "" });

  db.data.groups.push({ id: "group-it", program_id: "it", cohort_id: "alpha-2026" });
  db.data.groups.push({ id: "group-culinary", program_id: "culinary", cohort_id: "alpha-2026" });
  db.data.groupMemberships.push({ group_id: "group-it", user_id: "student-a" });
  db.data.groupMemberships.push({ group_id: "group-culinary", user_id: "student-b" });

  db.data.mentorAssignments.push({
    id: "assign-1",
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    active: 1,
  });

  db.data.submissions.push({
    id: "submission-a",
    student_id: "student-a",
    requirement_id: "req-presentation-day",
  });

  db.data.presentationSlots.push(buildSlot({
    id: "slot-existing-a",
    student_user_id: "student-a",
    scheduled_for: "2026-03-26T16:00:00.000Z",
    duration_minutes: 20,
    location: "Room 101",
  }));
  db.data.presentationSlots.push(buildSlot({
    id: "slot-existing-b",
    student_user_id: "student-b",
    scheduled_for: "2026-03-26T16:00:00.000Z",
    duration_minutes: 20,
    location: "Room 102",
  }));

  const adminToken = "token-admin-a";
  const teacherToken = "token-teacher-a";
  const mentorToken = "token-mentor-a";

  for (const [userId, token] of [
    ["admin-a", adminToken],
    ["teacher-a", teacherToken],
    ["mentor-a", mentorToken],
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
    adminToken,
    teacherToken,
    mentorToken,
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

function buildSlot(overrides) {
  return {
    id: "slot",
    student_user_id: "student-a",
    submission_id: null,
    requirement_id: "req-presentation-day",
    scheduled_for: "2026-03-26T16:00:00.000Z",
    duration_minutes: 15,
    location: "Room 101",
    status: "scheduled",
    outline_status: "approved",
    checked_out_at: null,
    checked_in_at: null,
    notes: null,
    created_by: "teacher-a",
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildAuthedRequest(url, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("cf-connecting-ip", "203.0.113.121");
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

    if (sql.includes("from user_roles teacher_role") && sql.includes("join group_memberships student_group")) {
      const [studentId, teacherId] = this.params;
      const teacherRoles = this.db.data.userRoles.filter(
        (entry) => entry.user_id === teacherId && entry.role_id === "program_teacher",
      );
      const studentGroupIds = this.db.data.groupMemberships
        .filter((membership) => membership.user_id === studentId)
        .map((membership) => membership.group_id);
      const studentGroups = this.db.data.groups.filter((group) => studentGroupIds.includes(group.id));
      const allowed = teacherRoles.some((role) => {
        if (role.scope_type === "global") return true;
        if (!role.scope_id) return false;
        if (role.scope_type === "program") return studentGroups.some((group) => group.program_id === role.scope_id);
        if (role.scope_type === "cohort") return studentGroups.some((group) => group.cohort_id === role.scope_id);
        return false;
      });
      return allowed ? { ok: 1 } : null;
    }

    if (sql.startsWith("select id from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      const user = this.db.data.userAccounts.find((row) => row.id === userId && row.status === "active");
      return user ? { id: user.id } : null;
    }

    if (sql.startsWith("select id, student_id, requirement_id from submissions where id = ?")) {
      const [submissionId] = this.params;
      const submission = this.db.data.submissions.find((row) => row.id === submissionId);
      return submission
        ? {
            id: submission.id,
            student_id: submission.student_id,
            requirement_id: submission.requirement_id,
          }
        : null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    const sql = this.normalizedSql();

    if (sql.includes("from presentation_slots") && sql.includes("join user_accounts student")) {
      const locationFilter = sql.includes("where lower(presentation_slots.location) = lower(?)")
        ? String(this.params[0] || "").toLowerCase()
        : null;
      const results = this.db.data.presentationSlots
        .filter((row) => row.status !== "cancelled")
        .filter((row) => !locationFilter || String(row.location).toLowerCase() === locationFilter)
        .sort((a, b) => String(a.scheduled_for).localeCompare(String(b.scheduled_for)))
        .map((row) => {
          const student = this.db.data.userAccounts.find((user) => user.id === row.student_user_id);
          return {
            id: row.id,
            student_id: row.student_user_id,
            student_name: student?.display_name || "Unknown",
            submission_id: row.submission_id ?? null,
            requirement_id: row.requirement_id ?? null,
            scheduled_for: row.scheduled_for,
            duration_minutes: row.duration_minutes,
            location: row.location,
            status: row.status,
            outline_status: row.outline_status,
            checked_out_at: row.checked_out_at ?? null,
            checked_in_at: row.checked_in_at ?? null,
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

    if (sql.startsWith("insert into presentation_slots")) {
      const [
        id,
        studentUserId,
        submissionId,
        requirementId,
        scheduledFor,
        durationMinutes,
        location,
        outlineStatus,
        notes,
        createdBy,
      ] = this.params;
      const createdAt = this.db.nowIso();
      this.db.data.presentationSlots.push(buildSlot({
        id,
        student_user_id: studentUserId,
        submission_id: submissionId,
        requirement_id: requirementId,
        scheduled_for: scheduledFor,
        duration_minutes: durationMinutes,
        location,
        outline_status: outlineStatus,
        notes,
        created_by: createdBy,
        created_at: createdAt,
        updated_at: createdAt,
      }));
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
