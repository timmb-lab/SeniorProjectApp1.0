import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, normalizeEmail, sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";
import { onRequest as onLogout } from "../functions/api/auth/logout.ts";

test("auth login/me/logout covers active, disabled, reset-required, invalid, and expired-session states", async () => {
  const fixture = await createFixture();

  // active login succeeds + sets a session cookie
  const activeCookie = await loginAndExtractCookie({
    env: fixture.env,
    email: fixture.activeUser.email,
    password: fixture.password,
  });

  assert.equal(fixture.db.data.sessions.length, 1);
  assert.equal(fixture.db.data.loginAttempts.length, 1);
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "login");

  // /me authenticates and returns roles
  {
    const response = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: activeCookie } }),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.authenticated, true);
    assert.equal(body.user.email, fixture.activeUser.email);
    assert.equal(body.user.roles.length, 1);
    assert.equal(body.user.roles[0].role_id, "student");
  }

  // invalid password returns 401
  {
    const response = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.activeUser.email,
        password: "wrong-password",
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.error, "invalid_credentials");
  }

  // disabled users cannot log in
  {
    const response = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.disabledUser.email,
        password: fixture.password,
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.error, "invalid_credentials");
  }

  // reset-required users cannot log in (pending_reset status)
  {
    const response = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.pendingResetUser.email,
        password: fixture.password,
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, "password_reset_required");
  }

  // reset-required users cannot log in (requires_reset credential flag)
  {
    const response = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.requiresResetUser.email,
        password: fixture.password,
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, "password_reset_required");
  }

  // expired session cookie does not authenticate
  {
    const expiredCookie = await fixture.seedExpiredSession();
    const response = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: expiredCookie } }),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.authenticated, false);
    assert.equal(body.error, "session_expired");
  }

  // disabled account sessions return a specific account-state blocker for the workspace
  {
    const disabledCookie = await fixture.seedSessionForUser(fixture.disabledUser.id);
    const response = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: disabledCookie } }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.authenticated, false);
    assert.equal(body.error, "account_disabled");
  }

  // reset-required account sessions return a specific account-state blocker for the workspace
  {
    const pendingResetCookie = await fixture.seedSessionForUser(fixture.pendingResetUser.id);
    const response = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: pendingResetCookie } }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.authenticated, false);
    assert.equal(body.error, "password_reset_required");
  }

  // reset-required credential flags are also treated as workspace blockers
  {
    const requiresResetCookie = await fixture.seedSessionForUser(fixture.requiresResetUser.id);
    const response = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: requiresResetCookie } }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.authenticated, false);
    assert.equal(body.error, "password_reset_required");
  }

  // logout revokes session + clears cookie
  {
    const response = await onLogout({
      request: new Request("https://example.test/api/auth/logout", {
        method: "POST",
        headers: { cookie: activeCookie },
      }),
      env: fixture.env,
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") || "", /Max-Age=0/);
    assert.equal(fixture.db.data.sessions.filter((row) => row.revoked_at).length, 1);
    assert.equal(fixture.db.data.auditEvents.some((row) => row.action === "logout"), true);
  }
});

function buildJsonRequest(url, data) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
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

async function createFixture() {
  const password = "Correct-Horse-Battery-Staple-123!";
  const env = {
    AUTH_MODE: "hardened_username_password",
    EVIDENCE_STORAGE_PROVIDER: "google_drive",
    PASSWORD_PEPPER: "pepper",
    SESSION_PEPPER: "sessionpepper",
  };

  const credentialActive = await hashPassword(password, env.PASSWORD_PEPPER);
  const credentialDisabled = await hashPassword(password, env.PASSWORD_PEPPER);
  const credentialPendingReset = await hashPassword(password, env.PASSWORD_PEPPER);
  const credentialRequiresReset = await hashPassword(password, env.PASSWORD_PEPPER);

  const activeUser = {
    id: "user-active",
    email: "active.user@senior-capstone.test",
    email_norm: normalizeEmail("active.user@senior-capstone.test"),
    display_name: "Active User",
    status: "active",
  };
  const disabledUser = {
    id: "user-disabled",
    email: "disabled.user@senior-capstone.test",
    email_norm: normalizeEmail("disabled.user@senior-capstone.test"),
    display_name: "Disabled User",
    status: "disabled",
  };
  const pendingResetUser = {
    id: "user-pending-reset",
    email: "pending.reset@senior-capstone.test",
    email_norm: normalizeEmail("pending.reset@senior-capstone.test"),
    display_name: "Pending Reset",
    status: "pending_reset",
  };
  const requiresResetUser = {
    id: "user-requires-reset",
    email: "requires.reset@senior-capstone.test",
    email_norm: normalizeEmail("requires.reset@senior-capstone.test"),
    display_name: "Requires Reset",
    status: "active",
  };

  const db = new MockD1Database({
    userAccounts: [activeUser, disabledUser, pendingResetUser, requiresResetUser],
    passwordCredentials: [
      {
        user_id: activeUser.id,
        password_hash: credentialActive.hash,
        password_salt: credentialActive.salt,
        requires_reset: 0,
      },
      {
        user_id: disabledUser.id,
        password_hash: credentialDisabled.hash,
        password_salt: credentialDisabled.salt,
        requires_reset: 0,
      },
      {
        user_id: pendingResetUser.id,
        password_hash: credentialPendingReset.hash,
        password_salt: credentialPendingReset.salt,
        requires_reset: 0,
      },
      {
        user_id: requiresResetUser.id,
        password_hash: credentialRequiresReset.hash,
        password_salt: credentialRequiresReset.salt,
        requires_reset: 1,
      },
    ],
    loginAttempts: [],
    sessions: [],
    userRoles: [
      { user_id: activeUser.id, role_id: "student", scope_type: "global", scope_id: "" },
    ],
    auditEvents: [],
  });

  const fixtureEnv = { ...env, DB: db };

  async function seedExpiredSession() {
    return seedSessionForUser(activeUser.id, { token: "expired-session-token", expiresAt: "2000-01-01T00:00:00.000Z" });
  }

  async function seedSessionForUser(userId, options = {}) {
    const token = options.token || `session-token-${userId}`;
    const tokenHash = await sha256Hex(`${fixtureEnv.SESSION_PEPPER}${token}`);
    db.data.sessions.push({
      id: options.id || `sess-${userId}`,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: options.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      revoked_at: null,
    });
    return `sc_session=${token}`;
  }

  return {
    password,
    env: fixtureEnv,
    db,
    activeUser,
    disabledUser,
    pendingResetUser,
    requiresResetUser,
    seedExpiredSession,
    seedSessionForUser,
  };
}

class MockD1Database {
  constructor(data) {
    this.data = data;
  }

  prepare(sql) {
    return new MockD1PreparedStatement(this, sql);
  }

  nowIso() {
    return new Date().toISOString();
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

    if (sql.startsWith("select count(*) as count from login_attempts")) {
      const [identifierHash] = this.params;
      const count = this.db.data.loginAttempts.filter(
        (row) => row.identifier_hash === identifierHash && row.success === 0,
      ).length;
      return { count };
    }

    if (sql.includes("from user_accounts u join password_credentials c")) {
      const [emailNorm] = this.params;
      const user = this.db.data.userAccounts.find((row) => row.email_norm === emailNorm);
      if (!user) return null;
      const credential = this.db.data.passwordCredentials.find((row) => row.user_id === user.id);
      if (!credential) return null;
      return {
        user_id: user.id,
        email: user.email,
        email_norm: user.email_norm,
        display_name: user.display_name,
        status: user.status,
        password_hash: credential.password_hash,
        password_salt: credential.password_salt,
        requires_reset: credential.requires_reset ?? 0,
      };
    }

    if (sql.startsWith("select id, user_id") && sql.includes("from sessions") && sql.includes("where token_hash = ?")) {
      const [tokenHash] = this.params;
      const session = this.db.data.sessions.find((row) => {
        if (row.token_hash !== tokenHash) return false;
        if (!sql.includes("revoked_at is null")) return true;
        return !row.revoked_at && String(row.expires_at) > this.db.nowIso();
      });
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

    if (sql.includes("from user_accounts left join password_credentials")) {
      const [userId] = this.params;
      const user = this.db.data.userAccounts.find((row) => row.id === userId);
      const credential = this.db.data.passwordCredentials.find((row) => row.user_id === userId);
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

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    const sql = this.normalizedSql();

    if (sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params;
      return {
        results: this.db.data.userRoles.filter((row) => row.user_id === userId),
      };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    const sql = this.normalizedSql();

    if (sql.startsWith("insert into login_attempts")) {
      const [id, identifierHash, ipHash, success, reason] = this.params;
      this.db.data.loginAttempts.push({
        id,
        identifier_hash: identifierHash,
        ip_hash: ipHash,
        success: Number(success),
        reason,
        created_at: this.db.nowIso(),
      });
      return { success: true, results: [] };
    }

    if (sql.startsWith("insert into sessions")) {
      const [id, userId, tokenHash, expiresAt, ipHash, userAgentHash] = this.params;
      this.db.data.sessions.push({
        id,
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked_at: null,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
      });
      return { success: true, results: [] };
    }

    if (sql.startsWith("update sessions set last_seen_at = strftime")) {
      return { success: true, results: [] };
    }

    if (sql.startsWith("update sessions set revoked_at = strftime")) {
      const [tokenHash] = this.params;
      const session = this.db.data.sessions.find((row) => row.token_hash === tokenHash);
      if (session) {
        session.revoked_at = this.db.nowIso();
      }
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
