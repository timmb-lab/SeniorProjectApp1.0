import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost } from "../functions/api/admin/mentor-assignments.ts";

test("admin mentor assignments returns 401 when session is missing", async () => {
  const { env } = createFixture();

  const request = new Request("https://example.test/api/admin/mentor-assignments", {
    method: "POST",
  });

  const response = await onRequestPost({ request, env, params: {} });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("admin mentor assignments returns 403 when caller is not admin", async () => {
  const { env, token } = await createFixtureWithSession({ userId: "mentor-a", roleId: "mentor" });

  const request = new Request("https://example.test/api/admin/mentor-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ mentorUserId: "mentor-b", studentUserId: "student-a" }),
  });

  const response = await onRequestPost({ request, env, params: {} });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
});

test("admin mentor assignments returns 409 and audits when mentor role is missing", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("mentor-a"), buildUser("student-a"));
  fixture.db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });

  const request = new Request("https://example.test/api/admin/mentor-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.20",
      "user-agent": "integration-test",
    },
    body: JSON.stringify({ mentorUserId: "mentor-a", studentUserId: "student-a" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "mentor_role_required", ok: false });

  const [event] = fixture.db.data.auditEvents;
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, "admin-a");
  assert.equal(event.action, "mentor_assignment_denied");
  assert.equal(event.entity_type, "mentor_assignment");
  assert.equal(event.entity_id, null);
  assert.deepEqual(event.metadata, {
    mentorUserId: "mentor-a",
    studentUserId: "student-a",
    reason: "mentor_role_required",
  });
});

test("admin mentor assignments returns 409 and audits when student role is missing", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("mentor-a"), buildUser("student-a"));
  fixture.db.data.userRoles.push({ user_id: "mentor-a", role_id: "mentor", scope_type: "global", scope_id: "" });

  const request = new Request("https://example.test/api/admin/mentor-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.21",
      "user-agent": "integration-test",
    },
    body: JSON.stringify({ mentorUserId: "mentor-a", studentUserId: "student-a" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "student_role_required", ok: false });

  const [event] = fixture.db.data.auditEvents;
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, "admin-a");
  assert.equal(event.action, "mentor_assignment_denied");
  assert.equal(event.entity_type, "mentor_assignment");
  assert.equal(event.entity_id, null);
  assert.deepEqual(event.metadata, {
    mentorUserId: "mentor-a",
    studentUserId: "student-a",
    reason: "student_role_required",
  });
});

test("admin mentor assignments creates assignment and audits on success", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("mentor-a"), buildUser("student-a"));
  fixture.db.data.userRoles.push(
    { user_id: "mentor-a", role_id: "mentor", scope_type: "global", scope_id: "" },
    { user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" },
  );

  const request = new Request("https://example.test/api/admin/mentor-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.22",
      "user-agent": "integration-test",
    },
    body: JSON.stringify({ mentorUserId: "mentor-a", studentUserId: "student-a" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.assignment.mentorUserId, "mentor-a");
  assert.equal(body.assignment.studentUserId, "student-a");
  assert.equal(body.assignment.active, true);
  assert.ok(body.assignment.id);

  assert.equal(fixture.db.data.mentorAssignments.length, 1);
  assert.equal(fixture.db.data.mentorAssignments[0].mentor_user_id, "mentor-a");
  assert.equal(fixture.db.data.mentorAssignments[0].student_user_id, "student-a");
  assert.equal(Number(fixture.db.data.mentorAssignments[0].active), 1);
  assert.equal(fixture.db.data.mentorAssignments[0].assigned_by, "admin-a");

  const [event] = fixture.db.data.auditEvents;
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, "admin-a");
  assert.equal(event.action, "mentor_assignment_created");
  assert.equal(event.entity_type, "mentor_assignment");
  assert.equal(event.entity_id, body.assignment.id);
  assert.deepEqual(event.metadata, {
    mentorUserId: "mentor-a",
    studentUserId: "student-a",
  });
});

test("admin mentor assignments returns ok and audits duplicates without inserting twice", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("mentor-a"), buildUser("student-a"));
  fixture.db.data.userRoles.push(
    { user_id: "mentor-a", role_id: "mentor", scope_type: "global", scope_id: "" },
    { user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" },
  );
  fixture.db.data.mentorAssignments.push({
    id: "assignment-existing",
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    assigned_by: "admin-a",
    active: 1,
  });

  const request = new Request("https://example.test/api/admin/mentor-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.23",
      "user-agent": "integration-test",
    },
    body: JSON.stringify({ mentorUserId: "mentor-a", studentUserId: "student-a" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.assignment.id, "assignment-existing");

  assert.equal(fixture.db.data.mentorAssignments.length, 1);
  const [event] = fixture.db.data.auditEvents;
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(event.action, "mentor_assignment_duplicate");
  assert.equal(event.entity_id, "assignment-existing");
});

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    auditEvents: [],
  });

  return { env: { DB: db, SESSION_PEPPER: "" }, db };
}

async function createFixtureWithSession({ userId, roleId }) {
  const base = createFixture();
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push(buildUser(userId));
  base.db.data.sessions.push({
    id: `sess-${userId}`,
    user_id: userId,
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });
  base.db.data.userRoles.push({
    user_id: userId,
    role_id: roleId,
    scope_type: "global",
    scope_id: "",
  });

  return { ...base, token };
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
    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params;
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params;
      const session = this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at);
      return session ?? null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    if (this.sql.startsWith("select id from user_accounts where id = ? and status = 'active' limit 1")) {
      const [userId] = this.params;
      const row = this.data.userAccounts.find((account) => account.id === userId && account.status === "active");
      return row ? { id: row.id } : null;
    }

    if (this.sql.startsWith("select id, active from mentor_assignments where mentor_user_id = ? and student_user_id = ? limit 1")) {
      const [mentorUserId, studentUserId] = this.params;
      const row = this.data.mentorAssignments.find(
        (assignment) => assignment.mentor_user_id === mentorUserId && assignment.student_user_id === studentUserId,
      );
      return row ? { id: row.id, active: row.active } : null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      return { success: true };
    }

    if (this.sql.startsWith("insert into mentor_assignments")) {
      const [id, mentorUserId, studentUserId, assignedBy] = this.params;
      this.data.mentorAssignments.push({
        id,
        mentor_user_id: mentorUserId,
        student_user_id: studentUserId,
        assigned_by: assignedBy,
        active: 1,
      });
      return { success: true };
    }

    if (this.sql.startsWith("update mentor_assignments set active = 1, assigned_by = ? where id = ?")) {
      const [assignedBy, id] = this.params;
      const row = this.data.mentorAssignments.find((assignment) => assignment.id === id);
      if (row) {
        row.active = 1;
        row.assigned_by = assignedBy;
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into audit_events")) {
      const [
        _id,
        actorUserId,
        action,
        entityType,
        entityId,
        _ipHash,
        _userAgentHash,
        metadataJson,
      ] = this.params;
      this.data.auditEvents.push({
        actor_user_id: actorUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadataJson ? JSON.parse(metadataJson) : null,
      });
      return { success: true };
    }

    throw new Error(`Unmocked D1 run() query: ${this.sql}`);
  }
}

