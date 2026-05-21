import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost } from "../functions/api/admin/users/[id]/require-password-reset.ts";

test("admin password reset returns 401 when session is missing", async () => {
  const { env } = createFixture();

  const response = await onRequestPost({
    request: buildJsonRequest("https://example.test/api/admin/users/student-a/require-password-reset", {
      reason: "Teacher reported account recovery need.",
    }),
    env,
    params: { id: "student-a" },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("admin password reset returns 403 when caller is not admin", async () => {
  const fixture = await createFixtureWithSession({ userId: "mentor-a", roleId: "mentor" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/student-a/require-password-reset",
      { reason: "Teacher reported account recovery need." },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: { id: "student-a" },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
});

test("admin password reset validates target id, json, and reason", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  {
    const response = await onRequestPost({
      request: buildJsonRequest("https://example.test/api/admin/users/%5Bbad%5D/require-password-reset", {
        reason: "Teacher reported account recovery need.",
      }, { cookie: `sc_session=${fixture.token}` }),
      env: fixture.env,
      params: { id: "[bad]" },
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_user_id" });
  }

  {
    const response = await onRequestPost({
      request: new Request("https://example.test/api/admin/users/student-a/require-password-reset", {
        method: "POST",
        headers: { cookie: `sc_session=${fixture.token}`, "content-type": "application/json" },
        body: "{not valid json",
      }),
      env: fixture.env,
      params: { id: "student-a" },
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_json" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/student-a/require-password-reset",
        { reason: "   " },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: { id: "student-a" },
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "missing_reason" });
  }
});

test("admin password reset rejects missing, disabled, credentialless, and self targets", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/missing-user/require-password-reset",
        { reason: "Teacher reported account recovery need." },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: { id: "missing-user" },
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "user_not_found", ok: false });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/disabled-a/require-password-reset",
        { reason: "Teacher reported account recovery need." },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: { id: "disabled-a" },
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "account_disabled", ok: false });
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "password_reset_request_denied");
    assert.equal(fixture.db.data.auditEvents.at(-1).metadata.denialReason, "account_disabled");
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/no-credential-a/require-password-reset",
        { reason: "Teacher reported account recovery need." },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: { id: "no-credential-a" },
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "password_credential_missing", ok: false });
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "password_reset_request_denied");
    assert.equal(fixture.db.data.auditEvents.at(-1).metadata.denialReason, "password_credential_missing");
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/admin-a/require-password-reset",
        { reason: "Administrative self-test should be blocked." },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: { id: "admin-a" },
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "self_reset_not_allowed", ok: false });
    assert.equal(fixture.db.data.auditEvents.at(-1).metadata.denialReason, "self_reset");
  }
});

test("admin password reset marks active users pending-reset, revokes sessions, and audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  await fixture.seedSessionForUser("student-a", "student-active-session");

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/student-a/require-password-reset",
      { reason: "Teacher reported account recovery need." },
      {
        cookie: `sc_session=${fixture.token}`,
        "cf-connecting-ip": "203.0.113.77",
        "user-agent": "integration-test",
      },
    ),
    env: fixture.env,
    params: { id: "student-a" },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.resetRequired, true);
  assert.equal(body.alreadyRequired, false);
  assert.equal(body.activeSessionsRevoked, 1);
  assert.deepEqual(body.user, {
    id: "student-a",
    email: "student-a@senior-capstone.test",
    displayName: "Student A",
    status: "pending_reset",
  });

  const target = fixture.db.data.userAccounts.find((row) => row.id === "student-a");
  const credential = fixture.db.data.passwordCredentials.find((row) => row.user_id === "student-a");
  const targetSession = fixture.db.data.sessions.find((row) => row.id === "sess-student-a");
  const adminSession = fixture.db.data.sessions.find((row) => row.id === "sess-admin-a");
  assert.equal(target.status, "pending_reset");
  assert.equal(credential.requires_reset, 1);
  assert.ok(targetSession.revoked_at);
  assert.equal(adminSession.revoked_at, null);

  assert.equal(fixture.db.data.auditEvents.length, 1);
  const [event] = fixture.db.data.auditEvents;
  assert.equal(event.actor_user_id, "admin-a");
  assert.equal(event.action, "password_reset_required_by_admin");
  assert.equal(event.entity_type, "user_account");
  assert.equal(event.entity_id, "student-a");
  assert.deepEqual(event.metadata, {
    reason: "Teacher reported account recovery need.",
    previousStatus: "active",
    previousRequiresReset: false,
    alreadyRequired: false,
    activeSessionsRevoked: 1,
  });
});

test("admin password reset is idempotent for already reset-required users", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/pending-reset-a/require-password-reset",
      { reason: "Repeat reset notice after staff request." },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: { id: "pending-reset-a" },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.alreadyRequired, true);
  assert.equal(body.activeSessionsRevoked, 0);
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].metadata.previousStatus, "pending_reset");
  assert.equal(fixture.db.data.auditEvents[0].metadata.previousRequiresReset, true);
});

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

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [
      buildUser("student-a", "Student A"),
      buildUser("disabled-a", "Disabled A", "disabled"),
      buildUser("no-credential-a", "No Credential A"),
      buildUser("pending-reset-a", "Pending Reset A", "pending_reset"),
    ],
    passwordCredentials: [
      { user_id: "student-a", requires_reset: 0 },
      { user_id: "disabled-a", requires_reset: 0 },
      { user_id: "pending-reset-a", requires_reset: 1 },
    ],
    sessions: [],
    userRoles: [],
    auditEvents: [],
  });

  return {
    env: {
      DB: db,
      AUTH_MODE: "hardened_username_password",
      EVIDENCE_STORAGE_PROVIDER: "google_drive",
      SESSION_PEPPER: "",
    },
    db,
  };
}

async function createFixtureWithSession({ userId, roleId }) {
  const base = createFixture();
  base.db.data.userAccounts.push(buildUser(userId, userId === "admin-a" ? "Admin A" : "Mentor A"));
  base.db.data.userRoles.push({ user_id: userId, role_id: roleId, scope_type: "global", scope_id: "" });
  const token = await base.seedSessionForUser?.(userId, `session-${userId}`);
  if (!token) {
    const sessionToken = `session-${userId}`;
    const tokenHash = await sha256Hex(sessionToken);
    base.db.data.sessions.push({
      id: `sess-${userId}`,
      user_id: userId,
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: "2099-01-01T00:00:00.000Z",
      last_seen_at: null,
    });
    base.seedSessionForUser = async (targetUserId, sessionTokenValue = `session-${targetUserId}`) => {
      const targetTokenHash = await sha256Hex(sessionTokenValue);
      base.db.data.sessions.push({
        id: `sess-${targetUserId}`,
        user_id: targetUserId,
        token_hash: targetTokenHash,
        revoked_at: null,
        expires_at: "2099-01-01T00:00:00.000Z",
        last_seen_at: null,
      });
      return sessionTokenValue;
    };
    return { ...base, token: sessionToken };
  }
  return { ...base, token };
}

function buildUser(id, displayName = id, status = "active") {
  return {
    id,
    email: `${id}@senior-capstone.test`,
    email_norm: `${id}@senior-capstone.test`,
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
    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params.map(String);
      const session = this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at);
      return session ?? null;
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

    if (this.sql.includes("from user_accounts u left join password_credentials c")) {
      const [userId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === userId);
      if (!user) return null;
      const credential = this.data.passwordCredentials.find((row) => row.user_id === userId);
      return {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        status: user.status,
        credential_user_id: credential?.user_id ?? null,
        requires_reset: credential?.requires_reset ?? null,
      };
    }

    if (this.sql.startsWith("select count(*) as count from sessions where user_id = ?")) {
      const [userId] = this.params.map(String);
      return {
        count: this.data.sessions.filter((row) => row.user_id === userId && !row.revoked_at).length,
      };
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      const [sessionId] = this.params.map(String);
      const session = this.data.sessions.find((row) => row.id === sessionId);
      if (session) session.last_seen_at = new Date().toISOString();
      return { success: true };
    }

    if (this.sql.startsWith("update password_credentials set requires_reset = 1")) {
      const [userId] = this.params.map(String);
      const credential = this.data.passwordCredentials.find((row) => row.user_id === userId);
      if (credential) credential.requires_reset = 1;
      return { success: true };
    }

    if (this.sql.startsWith("update user_accounts set status = 'pending_reset'")) {
      const [userId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === userId);
      if (user) {
        user.status = "pending_reset";
        user.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (this.sql.startsWith("update sessions set revoked_at = strftime(")) {
      const [userId] = this.params.map(String);
      for (const session of this.data.sessions) {
        if (session.user_id === userId && !session.revoked_at) {
          session.revoked_at = new Date().toISOString();
        }
      }
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
