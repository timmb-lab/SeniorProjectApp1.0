import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestDelete, onRequestGet, onRequestPost } from "../functions/api/admin/role-assignments.ts";

test("admin role assignments returns 401 when session is missing", async () => {
  const { env } = createFixture();

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
  });

  const response = await onRequestPost({ request, env, params: {} });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("admin role assignments returns 403 when caller is not admin", async () => {
  const fixture = await createFixtureWithSession({ userId: "mentor-a", roleId: "mentor" });

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
});

test("admin role assignments returns 400 when json is invalid", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-a"));

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: "{not valid json",
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_json" });
});

test("admin role assignments returns 400 when fields are missing", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId: "student-a" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "missing_fields" });
});

test("admin role assignments returns 404 when target user is missing", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "user_not_found", ok: false });
});

test("admin role assignments returns 404 when role is not in roles table", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin", roles: ["admin"] });
  fixture.db.data.userAccounts.push(buildUser("mentor-a"));

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId: "mentor-a", roleId: "mentor", scopeType: "global", scopeId: "" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "role_not_found", ok: false });
});

test("admin role assignments returns 400 for invalid role scopes", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-a"));

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId: "student-a", roleId: "student", scopeType: "program", scopeId: "it" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_role_scope" });
});

test("admin role assignments returns 404 when teacher program scope is unknown", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("teacher-a"));

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      userId: "teacher-a",
      roleId: "program_teacher",
      scopeType: "program",
      scopeId: "missing-program",
    }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "program_not_found", ok: false });
});

test("admin role assignments creates role assignment and audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-a"));

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.88",
      "user-agent": "integration-test",
    },
    body: JSON.stringify({ userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.created, true);
  assert.deepEqual(body.assignment, { userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" });

  assert.equal(fixture.db.data.userRoles.length, 2);
  assert.equal(
    fixture.db.data.userRoles.some(
      (row) =>
        row.user_id === "student-a" && row.role_id === "student" && row.scope_type === "global" && row.scope_id === "",
    ),
    true,
  );

  assert.equal(fixture.db.data.auditEvents.length, 1);
  const [event] = fixture.db.data.auditEvents;
  assert.equal(event.actor_user_id, "admin-a");
  assert.equal(event.action, "role_assignment_created");
  assert.equal(event.entity_type, "role_assignment");
  assert.deepEqual(event.metadata, { userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" });
});

test("admin role assignments returns created=false for duplicates and audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-a"));
  fixture.db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "POST",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" }),
  });

  const response = await onRequestPost({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.created, false);

  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "role_assignment_duplicate");
});

test("admin role assignments deletes role assignments and audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-a"));
  fixture.db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "DELETE",
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.89",
      "user-agent": "integration-test",
    },
    body: JSON.stringify({ userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" }),
  });

  const response = await onRequestDelete({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.assignment, { userId: "student-a", roleId: "student", scopeType: "global", scopeId: "" });

  assert.equal(
    fixture.db.data.userRoles.some((row) => row.user_id === "student-a" && row.role_id === "student"),
    false,
  );

  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "role_assignment_removed");
});

test("admin role assignments list shows assignments", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-a"));
  fixture.db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });

  const request = new Request("https://example.test/api/admin/role-assignments?limit=50", {
    method: "GET",
    headers: { cookie: `sc_session=${fixture.token}` },
  });

  const response = await onRequestGet({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.assignments.length >= 2, true);
  assert.equal(body.assignments.some((assignment) => assignment.userId === "student-a" && assignment.roleId === "student"), true);
});

function createFixture(options = {}) {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    roles: (options.roles ?? ["student", "mentor", "program_teacher", "admin", "misc_admin"]).map((id) => ({ id })),
    programs: [{ id: "it" }],
    cohorts: [{ id: "cohort-a" }],
    auditEvents: [],
  });

  return { env: { DB: db, SESSION_PEPPER: "" }, db };
}

async function createFixtureWithSession({ userId, roleId, roles }) {
  const base = createFixture({ roles });
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
      const [userId, roleId] = this.params.map(String);
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params.map(String);
      const session = this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at);
      return session ?? null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params.map(String);
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    if (this.sql.startsWith("select id from user_accounts where id = ? and status = 'active' limit 1")) {
      const [userId] = this.params.map(String);
      const row = this.data.userAccounts.find((account) => account.id === userId && account.status === "active");
      return row ? { id: row.id } : null;
    }

    if (this.sql.startsWith("select id from roles where id = ? limit 1")) {
      const [roleId] = this.params.map(String);
      const role = this.data.roles.find((row) => row.id === roleId);
      return role ? { id: role.id } : null;
    }

    if (this.sql.startsWith("select id from programs where id = ? limit 1")) {
      const [programId] = this.params.map(String);
      const program = this.data.programs.find((row) => row.id === programId);
      return program ? { id: program.id } : null;
    }

    if (this.sql.startsWith("select id from cohorts where id = ? limit 1")) {
      const [cohortId] = this.params.map(String);
      const cohort = this.data.cohorts.find((row) => row.id === cohortId);
      return cohort ? { id: cohort.id } : null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? and scope_type = ? and scope_id = ? limit 1")) {
      const [userId, roleId, scopeType, scopeId] = this.params.map(String);
      const exists = this.data.userRoles.some(
        (row) =>
          row.user_id === userId && row.role_id === roleId && row.scope_type === scopeType && row.scope_id === scopeId,
      );
      return exists ? { ok: 1 } : null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.includes("from user_roles join user_accounts user")) {
      const limit = Number(this.params[this.params.length - 1] ?? 100);
      const binds = this.params.slice(0, -1).map(String);

      const hasUserFilter = this.sql.includes("user_roles.user_id = ?");
      const hasRoleFilter = this.sql.includes("user_roles.role_id = ?");

      let userId = "";
      let roleId = "";
      if (hasUserFilter && hasRoleFilter) {
        [userId, roleId] = binds;
      } else if (hasUserFilter) {
        userId = binds[0] ?? "";
      } else if (hasRoleFilter) {
        roleId = binds[0] ?? "";
      }

      const results = this.data.userRoles
        .filter((row) => !userId || row.user_id === userId)
        .filter((row) => !roleId || row.role_id === roleId)
        .map((row) => ({
          user_id: row.user_id,
          user_name: resolveUserName(this.data, row.user_id),
          role_id: row.role_id,
          scope_type: row.scope_type,
          scope_id: row.scope_id,
          assigned_by: row.assigned_by ?? null,
          assigned_at: row.assigned_at ?? "2026-05-20T00:00:00.000Z",
        }))
        .slice(0, limit);

      return { results };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      return { success: true };
    }

    if (this.sql.startsWith("insert into user_roles")) {
      const [userId, roleId, scopeType, scopeId, assignedBy] = this.params.map(String);
      this.data.userRoles.push({
        user_id: userId,
        role_id: roleId,
        scope_type: scopeType,
        scope_id: scopeId,
        assigned_by: assignedBy,
        assigned_at: "2026-05-20T00:00:00.000Z",
      });
      return { success: true };
    }

    if (this.sql.startsWith("delete from user_roles")) {
      const [userId, roleId, scopeType, scopeId] = this.params.map(String);
      this.data.userRoles = this.data.userRoles.filter(
        (row) => !(row.user_id === userId && row.role_id === roleId && row.scope_type === scopeType && row.scope_id === scopeId),
      );
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

function resolveUserName(data, userId) {
  const user = data.userAccounts.find((account) => account.id === userId);
  return user ? user.display_name : null;
}
