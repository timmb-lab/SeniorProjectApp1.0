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
  assert.equal(event.action, "user.role_changed");
  assert.equal(event.entity_type, "role_assignment");
  assert.equal(event.metadata.userId, "student-a");
  assert.equal(event.metadata.roleId, "student");
  assert.equal(event.metadata.scopeType, "global");
});

test("admin role assignments returns scope names and assigner names for site, program, and cohort grants", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("site-target"));
  fixture.db.data.userAccounts.push(buildUser("program-target"));
  fixture.db.data.userAccounts.push(buildUser("cohort-target"));
  fixture.db.data.userRoles.push({
    user_id: "site-target",
    role_id: "administration",
    scope_type: "site",
    scope_id: "site-b",
    assigned_by: "admin-a",
    assigned_at: "2026-05-20T03:00:00.000Z",
  });
  fixture.db.data.userRoles.push({
    user_id: "program-target",
    role_id: "program_teacher",
    scope_type: "program",
    scope_id: "program-biotech",
    assigned_by: "admin-a",
    assigned_at: "2026-05-20T02:00:00.000Z",
  });
  fixture.db.data.userRoles.push({
    user_id: "cohort-target",
    role_id: "program_teacher",
    scope_type: "cohort",
    scope_id: "cohort-spring-showcase",
    assigned_by: "admin-a",
    assigned_at: "2026-05-20T01:00:00.000Z",
  });
  fixture.db.data.sites.push({ id: "site-b", name: "Canyon Ridge Career Academy", status: "active" });
  fixture.db.data.programs.push({ id: "program-biotech", name: "Biotechnology" });
  fixture.db.data.cohorts.push({ id: "cohort-spring-showcase", name: "Spring Showcase Cohort" });

  const request = new Request("https://example.test/api/admin/role-assignments", {
    method: "GET",
    headers: { cookie: `sc_session=${fixture.token}` },
  });

  const response = await onRequestGet({ request, env: fixture.env, params: {} });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.assignments.some((assignment) => assignment.scopeId === "site-b" && assignment.scopeName === "Canyon Ridge Career Academy"), true);
  assert.equal(body.assignments.some((assignment) => assignment.scopeId === "program-biotech" && assignment.scopeName === "Biotechnology"), true);
  assert.equal(body.assignments.some((assignment) => assignment.scopeId === "cohort-spring-showcase" && assignment.scopeName === "Spring Showcase Cohort"), true);
  assert.equal(body.assignments.some((assignment) => assignment.scopeId === "site-b" && assignment.assignedByName === "admin-a"), true);
});

test("admin role assignments accepts V5 global, site, administration, and viewer roles", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("global-target"));
  fixture.db.data.userAccounts.push(buildUser("site-target"));
  fixture.db.data.userAccounts.push(buildUser("administration-target"));
  fixture.db.data.userAccounts.push(buildUser("viewer-target"));
  fixture.db.data.passwordCredentials.push({
    user_id: "global-target",
    password_hash: "target-hash",
    password_salt: "target-salt",
    algorithm: "pbkdf2-sha256",
    iterations: 1,
    requires_reset: 0,
  });

  for (const [userId, roleId, scopeType, scopeId, adminNote] of [
    ["global-target", "global_admin", "global", "", "Promote local global admin"],
    ["site-target", "site_admin", "site", "site-a", "Assign site admin"],
    ["administration-target", "administration", "site", "site-a", "Assign administration"],
    ["viewer-target", "viewer", "global", "", ""],
  ]) {
    const request = new Request("https://example.test/api/admin/role-assignments", {
      method: "POST",
      headers: {
        cookie: `sc_session=${fixture.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ userId, roleId, scopeType, scopeId, adminNote }),
    });

    const response = await onRequestPost({ request, env: fixture.env, params: {} });
    assert.equal(response.status, 200);
  }

  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "global_admin" && row.scope_type === "global"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "site_admin" && row.scope_id === "site-a"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "administration" && row.scope_id === "site-a"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "viewer" && row.scope_type === "global"), true);
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
  assert.equal(fixture.db.data.auditEvents[0].action, "user.role_change_duplicate");
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
  assert.equal(fixture.db.data.auditEvents[0].action, "user.role_changed");
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
    roles: (options.roles ?? [
      "student",
      "mentor",
      "program_teacher",
      "site_admin",
      "administration",
      "global_admin",
      "viewer",
      "admin",
      "misc_admin",
    ]).map((id) => ({ id })),
    programs: [{ id: "it", name: "Information Technology" }],
    sites: [{ id: "site-a", name: "Desert Valley High School", status: "active" }],
    sitePrograms: [{ site_id: "site-a", program_id: "it", active: 1 }],
    siteUsers: [],
    passwordCredentials: [],
    authIdentities: [],
    cohorts: [{ id: "cohort-a", name: "Demo Cohort A" }],
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
  base.db.data.passwordCredentials.push({
    user_id: userId,
    password_hash: "session-hash",
    password_salt: "session-salt",
    algorithm: "pbkdf2-sha256",
    iterations: 1,
    requires_reset: 0,
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
    if (this.sql.startsWith("select 1 from password_credentials where user_id = ? limit 1")) {
      const [userId] = this.params.map(String);
      return this.data.passwordCredentials.some((row) => row.user_id === userId) ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select 1 from auth_identities where user_id = ?")) {
      const [userId] = this.params.map(String);
      return this.data.authIdentities.some((row) => row.user_id === userId && row.provider !== "local_password") ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params.map(String);
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id in (")) {
      const [userId, ...roleIds] = this.params.map(String);
      const exists = this.data.userRoles.some((row) => row.user_id === userId && roleIds.includes(row.role_id));
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

    if (this.sql.startsWith("select id from sites where id = ? and status = 'active' limit 1")) {
      const [siteId] = this.params.map(String);
      const site = this.data.sites.find((row) => row.id === siteId && row.status === "active");
      return site ? { id: site.id } : null;
    }

    if (this.sql.startsWith("select 1 from user_accounts join user_roles")) {
      const [studentId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === studentId && row.status === "active");
      const role = this.data.userRoles.find((row) => row.user_id === studentId && row.role_id === "student");
      return user && role ? { ok: 1 } : null;
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
    if (this.sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params.map(String);
      return {
        results: this.data.userRoles
          .filter((row) => row.user_id === userId)
          .map((row) => ({ role_id: row.role_id, scope_type: row.scope_type, scope_id: row.scope_id })),
      };
    }

    if (this.sql.startsWith("select id from sites where status = 'active'")) {
      return { results: this.data.sites.filter((row) => row.status === "active").map((row) => ({ id: row.id })) };
    }

    if (this.sql.startsWith("select id from programs where active = 1")) {
      return { results: this.data.programs.map((row) => ({ id: row.id })) };
    }

    if (this.sql.startsWith("select user_accounts.id from user_accounts join user_roles")) {
      return {
        results: this.data.userRoles
          .filter((row) => row.role_id === "student")
          .map((row) => ({ id: row.user_id })),
      };
    }

    if (this.sql.startsWith("select site_users.site_id as id from site_users")) {
      const [userId] = this.params.map(String);
      return {
        results: this.data.siteUsers
          .filter((row) => row.user_id === userId && row.membership_status !== "inactive")
          .map((row) => ({ id: row.site_id })),
      };
    }

    if (this.sql.startsWith("select sites.id from site_programs")) {
      const [programId] = this.params.map(String);
      return {
        results: this.data.sitePrograms
          .filter((row) => row.program_id === programId && Number(row.active) === 1)
          .map((row) => ({ id: row.site_id })),
      };
    }

    if (this.sql.startsWith("select distinct site_users.site_id as id from mentor_assignments")) {
      return { results: [] };
    }

    if (this.sql.startsWith("select distinct student_user_id as id from mentor_assignments")) {
      return { results: [] };
    }

    if (this.sql.startsWith("select distinct site_users.site_id as id from viewer_student_assignments")) {
      return { results: [] };
    }

    if (this.sql.startsWith("select distinct viewer_student_assignments.student_user_id as id")) {
      return { results: [] };
    }

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
          scope_name: resolveScopeName(this.data, row.scope_type, row.scope_id),
          assigned_by: row.assigned_by ?? null,
          assigned_by_name: resolveUserName(this.data, row.assigned_by),
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

    if (this.sql.startsWith("insert or ignore into site_users")) {
      const [siteId, userId] = this.params.map(String);
      if (!this.data.siteUsers.some((row) => row.site_id === siteId && row.user_id === userId)) {
        this.data.siteUsers.push({ site_id: siteId, user_id: userId, membership_status: "active" });
      }
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

function resolveScopeName(data, scopeType, scopeId) {
  if (scopeType === "site") {
    return data.sites.find((site) => site.id === scopeId)?.name ?? null;
  }
  if (scopeType === "program") {
    return data.programs.find((program) => program.id === scopeId)?.name ?? null;
  }
  if (scopeType === "cohort") {
    return data.cohorts.find((cohort) => cohort.id === scopeId)?.name ?? null;
  }
  return null;
}
