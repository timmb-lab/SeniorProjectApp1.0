import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex, validatePassword, verifyPassword } from "../functions/_lib/crypto.ts";
import { onRequestPost } from "../functions/api/admin/users/import.ts";
import { onRequest as onCompleteReset } from "../functions/api/auth/complete-reset.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";

test("admin users import returns 401 when session is missing", async () => {
  const { env } = createFixture();

  const response = await onRequestPost({
    request: buildJsonRequest("https://example.test/api/admin/users/import", {
      reason: "Initial pilot roster import.",
      users: [studentInput()],
    }),
    env,
    params: {},
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("admin users import returns 403 when caller is not admin", async () => {
  const fixture = await createFixtureWithSession({ userId: "mentor-a", roleId: "mentor" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [studentInput()],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "admin_users_import_denied");
  assert.equal(fixture.db.data.auditEvents[0].actor_user_id, "mentor-a");
  assert.deepEqual(fixture.db.data.auditEvents[0].metadata, {
    reason: "forbidden",
    requiredRole: "admin",
  });
});

test("admin users import validates json, reason, users, duplicate emails, and role scopes", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  {
    const response = await onRequestPost({
      request: new Request("https://example.test/api/admin/users/import", {
        method: "POST",
        headers: { cookie: `sc_session=${fixture.token}`, "content-type": "application/json" },
        body: "{not json",
      }),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_json" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        { reason: " ", users: [studentInput()] },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "missing_reason" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        { reason: "Initial pilot roster import.", users: [] },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "missing_users" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ email: "dupe@senior-capstone.test" }), studentInput({ email: "DUPE@senior-capstone.test" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "duplicate_email" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ roleId: "student", scopeType: "program", scopeId: "it" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_role_scope" });
  }
});

test("admin users import rejects existing emails and unknown role or scope records before mutation", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("existing-a", "existing@senior-capstone.test", "Existing A"));

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ email: "EXISTING@senior-capstone.test" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "email_already_exists", ok: false });
  }

  {
    const missingRoleFixture = await createFixtureWithSession({
      userId: "admin-b",
      roleId: "admin",
      roles: ["admin"],
    });
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ email: "student-b@senior-capstone.test" })],
        },
        { cookie: `sc_session=${missingRoleFixture.token}` },
      ),
      env: missingRoleFixture.env,
      params: {},
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "role_not_found", ok: false });
    assert.equal(missingRoleFixture.db.data.userAccounts.length, 1);
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [teacherInput({ scopeId: "missing-program" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "program_not_found", ok: false });
  }
});

test("admin users import creates pending-reset users, role assignments, credentials, and redacted audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [
          studentInput({ email: "Student.New@senior-capstone.test", displayName: "Student New" }),
          teacherInput({ email: "teacher.new@senior-capstone.test", displayName: "Teacher New" }),
        ],
      },
      {
        cookie: `sc_session=${fixture.token}`,
        "cf-connecting-ip": "203.0.113.91",
        "user-agent": "integration-test",
      },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.importedCount, 2);
  assert.equal(body.users.length, 2);

  const [student, teacher] = body.users;
  assert.equal(student.email, "Student.New@senior-capstone.test");
  assert.equal(student.status, "pending_reset");
  assert.equal(student.mustReset, true);
  assert.equal(student.delivery, "one_time_admin_display");
  assert.deepEqual(student.role, { roleId: "student", scopeType: "global", scopeId: "" });
  assert.equal(validatePassword(student.temporaryPassword, { email: student.email, displayName: student.displayName }).length, 0);
  assert.equal(validatePassword(teacher.temporaryPassword, { email: teacher.email, displayName: teacher.displayName }).length, 0);
  assert.notEqual(student.temporaryPassword, teacher.temporaryPassword);
  assert.match(student.id, /^user_/);

  const createdStudent = fixture.db.data.userAccounts.find((row) => row.id === student.id);
  const createdTeacher = fixture.db.data.userAccounts.find((row) => row.id === teacher.id);
  assert.equal(createdStudent.status, "pending_reset");
  assert.equal(createdStudent.email_norm, "student.new@senior-capstone.test");
  assert.equal(createdTeacher.status, "pending_reset");

  const studentCredential = fixture.db.data.passwordCredentials.find((row) => row.user_id === student.id);
  assert.equal(studentCredential.requires_reset, 1);
  assert.equal(studentCredential.password_version, 1);
  assert.equal(await verifyPassword(student.temporaryPassword, studentCredential.password_hash, studentCredential.password_salt, ""), true);

  assert.equal(
    fixture.db.data.userRoles.some(
      (row) => row.user_id === student.id && row.role_id === "student" && row.scope_type === "global" && row.scope_id === "",
    ),
    true,
  );
  assert.equal(
    fixture.db.data.userRoles.some(
      (row) => row.user_id === teacher.id && row.role_id === "program_teacher" && row.scope_type === "program" && row.scope_id === "it",
    ),
    true,
  );

  assert.equal(fixture.db.data.auditEvents.length, 3);
  assert.equal(fixture.db.data.auditEvents[0].action, "admin_user_imported");
  assert.equal(fixture.db.data.auditEvents[1].action, "admin_user_imported");
  assert.equal(fixture.db.data.auditEvents[2].action, "admin_users_import_completed");

  const auditJson = JSON.stringify(fixture.db.data.auditEvents);
  assert.equal(auditJson.includes(student.temporaryPassword), false);
  assert.equal(auditJson.includes(teacher.temporaryPassword), false);
  assert.equal(fixture.db.data.auditEvents[0].metadata.credentialPolicy, "temporary_password_requires_reset");
  assert.equal(fixture.db.data.auditEvents[2].metadata.importedCount, 2);
});

test("admin users import enforces reset-first login and keeps credential values out of audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  const newPassword = "Ready-For-Capstone-2026!";

  const importResponse = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [studentInput({ email: "reset.first@senior-capstone.test", displayName: "Reset First" })],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(importResponse.status, 200);
  assert.equal(importResponse.headers.get("cache-control"), "no-store");
  const importBody = await importResponse.json();
  const importedUser = importBody.users[0];
  assert.equal(importedUser.status, "pending_reset");
  assert.equal(importedUser.mustReset, true);
  assert.equal(importedUser.delivery, "one_time_admin_display");

  const createdUser = fixture.db.data.userAccounts.find((row) => row.id === importedUser.id);
  const credential = fixture.db.data.passwordCredentials.find((row) => row.user_id === importedUser.id);
  assert.equal(createdUser.status, "pending_reset");
  assert.equal(credential.requires_reset, 1);
  assert.equal(await verifyPassword(importedUser.temporaryPassword, credential.password_hash, credential.password_salt, ""), true);

  const resetRequiredLogin = await onLogin({
    request: buildJsonRequest("https://example.test/api/auth/login", {
      email: importedUser.email,
      password: importedUser.temporaryPassword,
    }),
    env: fixture.env,
  });
  assert.equal(resetRequiredLogin.status, 403);
  assert.deepEqual(await resetRequiredLogin.json(), { error: "password_reset_required" });

  const resetResponse = await onCompleteReset({
    request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
      email: importedUser.email,
      currentPassword: importedUser.temporaryPassword,
      newPassword,
    }),
    env: fixture.env,
  });
  assert.equal(resetResponse.status, 200);
  const resetCookie = resetResponse.headers.get("set-cookie")?.split(";")[0];
  assert.ok(resetCookie);
  assert.equal(createdUser.status, "active");
  assert.equal(credential.requires_reset, 0);
  assert.equal(credential.password_version, 2);
  assert.equal(await verifyPassword(newPassword, credential.password_hash, credential.password_salt, ""), true);

  const oldTemporaryPasswordLogin = await onLogin({
    request: buildJsonRequest("https://example.test/api/auth/login", {
      email: importedUser.email,
      password: importedUser.temporaryPassword,
    }),
    env: fixture.env,
  });
  assert.equal(oldTemporaryPasswordLogin.status, 401);

  const normalLoginCookie = await loginAndExtractCookie({
    env: fixture.env,
    email: importedUser.email,
    password: newPassword,
  });
  assert.match(normalLoginCookie, /^sc_session=/);

  const meResponse = await onMe({
    request: new Request("https://example.test/api/auth/me", { headers: { cookie: resetCookie } }),
    env: fixture.env,
  });
  assert.equal(meResponse.status, 200);
  const meBody = await meResponse.json();
  assert.equal(meBody.authenticated, true);
  assert.equal(meBody.user.email, importedUser.email);
  assert.equal(meBody.user.roles.some((row) => row.role_id === "student"), true);

  const auditJson = JSON.stringify(fixture.db.data.auditEvents);
  assert.equal(auditJson.includes(importedUser.temporaryPassword), false);
  assert.equal(auditJson.includes(newPassword), false);
  assert.equal(fixture.db.data.auditEvents.some((row) => row.action === "password_reset_completed"), true);
});

function studentInput(overrides = {}) {
  return {
    email: "student-a@senior-capstone.test",
    displayName: "Student A",
    roleId: "student",
    scopeType: "global",
    scopeId: "",
    ...overrides,
  };
}

function teacherInput(overrides = {}) {
  return {
    email: "teacher-a@senior-capstone.test",
    displayName: "Teacher A",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
    ...overrides,
  };
}

function buildJsonRequest(url, data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(data),
  });
}

async function loginAndExtractCookie({ env, email, password }) {
  const response = await onLogin({
    request: buildJsonRequest("https://example.test/api/auth/login", { email, password }),
    env,
  });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  return setCookie.split(";")[0];
}

function createFixture(options = {}) {
  const db = new MockD1Database({
    userAccounts: [],
    passwordCredentials: [],
    loginAttempts: [],
    sessions: [],
    userRoles: [],
    roles: (options.roles ?? ["student", "mentor", "program_teacher", "admin", "misc_admin"]).map((id) => ({ id })),
    programs: [{ id: "it" }],
    cohorts: [{ id: "cohort-a" }],
    auditEvents: [],
  });

  return { env: { DB: db, SESSION_PEPPER: "", PASSWORD_PEPPER: "" }, db };
}

async function createFixtureWithSession({ userId, roleId, roles }) {
  const base = createFixture({ roles });
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push(buildUser(userId, `${userId}@senior-capstone.test`, userId));
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

function buildUser(id, email = `${id}@senior-capstone.test`, displayName = id, status = "active") {
  return {
    id,
    email,
    email_norm: email.trim().toLowerCase(),
    display_name: displayName,
    status,
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

  nowIso() {
    return new Date().toISOString();
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
    if (this.sql.startsWith("select count(*) as count from login_attempts")) {
      const [identifierHash] = this.params;
      const count = this.data.loginAttempts.filter(
        (row) => row.identifier_hash === identifierHash && row.success === 0,
      ).length;
      return { count };
    }

    if (this.sql.includes("from user_accounts u join password_credentials c")) {
      const [emailNorm] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.email_norm === emailNorm);
      if (!user) return null;
      const credential = this.data.passwordCredentials.find((row) => row.user_id === user.id);
      if (!credential) return null;
      return {
        user_id: user.id,
        email: user.email,
        email_norm: user.email_norm,
        display_name: user.display_name,
        status: user.status,
        password_hash: credential.password_hash,
        password_salt: credential.password_salt,
        password_version: credential.password_version ?? 1,
        requires_reset: credential.requires_reset ?? 0,
      };
    }

    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params.map(String);
      return this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at) ?? null;
    }

    if (this.sql.startsWith("select id, user_id, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params.map(String);
      return this.data.sessions.find((row) => row.token_hash === tokenHash) ?? null;
    }

    if (this.sql.includes("from user_accounts left join password_credentials")) {
      const [userId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === userId);
      const credential = this.data.passwordCredentials.find((row) => row.user_id === userId);
      return user
        ? {
            id: user.id,
            email: user.email,
            email_norm: user.email_norm,
            display_name: user.display_name,
            status: user.status,
            requires_reset: credential?.requires_reset ?? 0,
          }
        : null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params.map(String);
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params.map(String);
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id from user_accounts where email_norm = ? limit 1")) {
      const [emailNorm] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.email_norm === emailNorm);
      return user ? { id: user.id } : null;
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

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params.map(String);
      return {
        results: this.data.userRoles.filter((row) => row.user_id === userId),
      };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("insert into login_attempts")) {
      const [id, identifierHash, ipHash, success, reason] = this.params;
      this.data.loginAttempts.push({
        id: String(id),
        identifier_hash: String(identifierHash),
        ip_hash: String(ipHash),
        success: Number(success),
        reason,
        created_at: new Date().toISOString(),
      });
      return { success: true };
    }

    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      return { success: true };
    }

    if (this.sql.startsWith("insert into sessions")) {
      const [id, userId, tokenHash, expiresAt, ipHash, userAgentHash] = this.params;
      this.data.sessions.push({
        id: String(id),
        user_id: String(userId),
        token_hash: String(tokenHash),
        expires_at: String(expiresAt),
        revoked_at: null,
        ip_hash: String(ipHash),
        user_agent_hash: String(userAgentHash),
      });
      return { success: true };
    }

    if (this.sql.startsWith("update password_credentials set password_hash = ?")) {
      const [passwordHash, passwordSalt, algorithm, iterations, userId] = this.params;
      const credential = this.data.passwordCredentials.find((row) => row.user_id === String(userId));
      if (credential) {
        credential.password_hash = String(passwordHash);
        credential.password_salt = String(passwordSalt);
        credential.algorithm = String(algorithm);
        credential.iterations = Number(iterations);
        credential.password_version = Number(credential.password_version || 1) + 1;
        credential.requires_reset = 0;
        credential.password_changed_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (this.sql.startsWith("update user_accounts set status = 'active'")) {
      const [userId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === userId);
      if (user) {
        user.status = "active";
        user.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (this.sql.startsWith("update sessions set revoked_at = strftime") && this.sql.includes("where user_id = ?")) {
      const [userId] = this.params.map(String);
      for (const session of this.data.sessions) {
        if (session.user_id === userId && !session.revoked_at) {
          session.revoked_at = new Date().toISOString();
        }
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into user_accounts")) {
      const [id, email, emailNorm, displayName] = this.params.map(String);
      this.data.userAccounts.push({
        id,
        email,
        email_norm: emailNorm,
        display_name: displayName,
        status: "pending_reset",
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into password_credentials")) {
      const [userId, passwordHash, passwordSalt, algorithm, iterations] = this.params;
      this.data.passwordCredentials.push({
        user_id: String(userId),
        password_hash: String(passwordHash),
        password_salt: String(passwordSalt),
        algorithm: String(algorithm),
        iterations: Number(iterations),
        password_version: 1,
        requires_reset: 1,
      });
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
        assigned_at: "2026-05-21T00:00:00.000Z",
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into audit_events")) {
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
      this.data.auditEvents.push({
        id,
        actor_user_id: actorUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        metadata: metadataJson ? JSON.parse(metadataJson) : null,
      });
      return { success: true };
    }

    throw new Error(`Unmocked D1 run() query: ${this.sql}`);
  }
}
