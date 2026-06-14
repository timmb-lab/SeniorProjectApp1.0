import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, normalizeEmail, sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost as onChangePassword } from "../functions/api/auth/change-password.ts";
import { onRequest as onCompleteReset } from "../functions/api/auth/complete-reset.ts";
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

  // explicit cross-origin browser POSTs are blocked before session or attempt work
  {
    const response = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.activeUser.email,
        password: fixture.password,
      }, { origin: "https://attacker.test" }),
      env: fixture.env,
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "cross_origin_post_denied" });
    assert.equal(fixture.db.data.sessions.length, 1);
    assert.equal(fixture.db.data.loginAttempts.length, 1);
  }

  // same-origin browser POSTs continue to work
  {
    const sameOriginFixture = await createFixture();
    const response = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: sameOriginFixture.activeUser.email,
        password: sameOriginFixture.password,
      }, { origin: "https://example.test" }),
      env: sameOriginFixture.env,
    });
    assert.equal(response.status, 200);
    assert.equal(sameOriginFixture.db.data.sessions.length, 1);
    assert.equal(sameOriginFixture.db.data.loginAttempts.length, 1);
  }

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

  // reset completion rejects invalid current password before rotating credentials
  {
    const response = await onCompleteReset({
      request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
        email: fixture.pendingResetUser.email,
        currentPassword: "wrong-password",
        newPassword: fixture.newPassword,
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.error, "invalid_credentials");
  }

  // reset completion rejects weak or unchanged replacement passwords
  {
    const weak = await onCompleteReset({
      request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
        email: fixture.pendingResetUser.email,
        currentPassword: fixture.password,
        newPassword: "short",
      }),
      env: fixture.env,
    });
    assert.equal(weak.status, 400);
    assert.equal((await weak.json()).error, "invalid_password");

    const unchanged = await onCompleteReset({
      request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
        email: fixture.pendingResetUser.email,
        currentPassword: fixture.password,
        newPassword: fixture.password,
      }),
      env: fixture.env,
    });
    assert.equal(unchanged.status, 400);
    assert.equal((await unchanged.json()).error, "password_must_change");
  }

  // reset-required users can rotate credentials, clear reset state, and receive a fresh session
  {
    const oldSessionCookie = await fixture.seedSessionForUser(fixture.pendingResetUser.id, { id: "sess-pending-before-reset" });
    const response = await onCompleteReset({
      request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
        email: fixture.pendingResetUser.email,
        currentPassword: fixture.password,
        newPassword: fixture.newPassword,
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.user.email, fixture.pendingResetUser.email);
    const resetCookie = response.headers.get("set-cookie");
    assert.ok(resetCookie);
    assert.equal(fixture.pendingResetUser.status, "active");
    const pendingCredential = fixture.db.data.passwordCredentials.find((row) => row.user_id === fixture.pendingResetUser.id);
    assert.equal(pendingCredential.requires_reset, 0);
    assert.equal(pendingCredential.password_version, 2);
    assert.notEqual(pendingCredential.password_hash, fixture.originalCredentialHashes.pendingReset);
    assert.equal(fixture.db.data.sessions.some((row) => row.id === "sess-pending-before-reset" && row.revoked_at), true);
    assert.equal(fixture.db.data.auditEvents.some((row) => row.action === "password_reset_completed"), true);

    const staleSession = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: oldSessionCookie } }),
      env: fixture.env,
    });
    assert.equal(staleSession.status, 401);
    assert.equal((await staleSession.json()).error, "session_expired");

    const meAfterReset = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: resetCookie.split(";")[0] } }),
      env: fixture.env,
    });
    assert.equal(meAfterReset.status, 200);
    assert.equal((await meAfterReset.json()).authenticated, true);
  }

  // old password is no longer valid and the new password signs in normally
  {
    const oldPassword = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.pendingResetUser.email,
        password: fixture.password,
      }),
      env: fixture.env,
    });
    assert.equal(oldPassword.status, 401);

    const newCookie = await loginAndExtractCookie({
      env: fixture.env,
      email: fixture.pendingResetUser.email,
      password: fixture.newPassword,
    });
    assert.match(newCookie, /^sc_session=/);
  }

  // users without reset-required state cannot use the reset completion endpoint as normal login
  {
    const response = await onCompleteReset({
      request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
        email: fixture.activeUser.email,
        currentPassword: fixture.password,
        newPassword: fixture.newPassword,
      }),
      env: fixture.env,
    });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "password_reset_not_required");
  }

  // signed-in active users can rotate their own password and close existing sessions
  {
    const changeCookie = await loginAndExtractCookie({
      env: fixture.env,
      email: fixture.activeUser.email,
      password: fixture.password,
    });
    const oldSessionCookie = await fixture.seedSessionForUser(fixture.activeUser.id, { id: "sess-active-before-change" });

    const invalidCurrent = await onChangePassword({
      request: buildJsonRequest(
        "https://example.test/api/auth/change-password",
        { currentPassword: "wrong-password", newPassword: fixture.newPassword },
        { cookie: changeCookie },
      ),
      env: fixture.env,
    });
    assert.equal(invalidCurrent.status, 401);
    assert.equal((await invalidCurrent.json()).error, "invalid_current_password");
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "password_change_denied");

    const weak = await onChangePassword({
      request: buildJsonRequest(
        "https://example.test/api/auth/change-password",
        { currentPassword: fixture.password, newPassword: "short" },
        { cookie: changeCookie },
      ),
      env: fixture.env,
    });
    assert.equal(weak.status, 400);
    assert.equal((await weak.json()).error, "invalid_password");

    const unchanged = await onChangePassword({
      request: buildJsonRequest(
        "https://example.test/api/auth/change-password",
        { currentPassword: fixture.password, newPassword: fixture.password },
        { cookie: changeCookie },
      ),
      env: fixture.env,
    });
    assert.equal(unchanged.status, 400);
    assert.equal((await unchanged.json()).error, "password_must_change");

    const response = await onChangePassword({
      request: buildJsonRequest(
        "https://example.test/api/auth/change-password",
        { currentPassword: fixture.password, newPassword: fixture.newPassword },
        { cookie: changeCookie },
      ),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.activeSessionsRevoked, 2);
    const rotatedCookie = response.headers.get("set-cookie")?.split(";")[0];
    assert.ok(rotatedCookie);

    const activeCredential = fixture.db.data.passwordCredentials.find((row) => row.user_id === fixture.activeUser.id);
    assert.equal(activeCredential.password_version, 2);
    assert.notEqual(activeCredential.password_hash, fixture.originalCredentialHashes.active);
    assert.equal(fixture.db.data.sessions.some((row) => row.id === "sess-active-before-change" && row.revoked_at), true);
    assert.equal(fixture.db.data.auditEvents.at(-1).action, "password_changed_by_user");

    const staleSession = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: oldSessionCookie } }),
      env: fixture.env,
    });
    assert.equal(staleSession.status, 401);
    assert.equal((await staleSession.json()).error, "session_expired");

    const meAfterChange = await onMe({
      request: new Request("https://example.test/api/auth/me", { headers: { cookie: rotatedCookie } }),
      env: fixture.env,
    });
    assert.equal(meAfterChange.status, 200);
    assert.equal((await meAfterChange.json()).authenticated, true);

    const oldPassword = await onLogin({
      request: buildJsonRequest("https://example.test/api/auth/login", {
        email: fixture.activeUser.email,
        password: fixture.password,
      }),
      env: fixture.env,
    });
    assert.equal(oldPassword.status, 401);

    const newCookie = await loginAndExtractCookie({
      env: fixture.env,
      email: fixture.activeUser.email,
      password: fixture.newPassword,
    });
    assert.match(newCookie, /^sc_session=/);
  }
});

function buildJsonRequest(url, data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
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
  const newPassword = "Updated-Horse-Battery-Staple-456!";
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
        password_version: 1,
        requires_reset: 0,
      },
      {
        user_id: disabledUser.id,
        password_hash: credentialDisabled.hash,
        password_salt: credentialDisabled.salt,
        password_version: 1,
        requires_reset: 0,
      },
      {
        user_id: pendingResetUser.id,
        password_hash: credentialPendingReset.hash,
        password_salt: credentialPendingReset.salt,
        password_version: 1,
        requires_reset: 0,
      },
      {
        user_id: requiresResetUser.id,
        password_hash: credentialRequiresReset.hash,
        password_salt: credentialRequiresReset.salt,
        password_version: 1,
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
    newPassword,
    env: fixtureEnv,
    db,
    activeUser,
    disabledUser,
    pendingResetUser,
    requiresResetUser,
    originalCredentialHashes: {
      active: credentialActive.hash,
      disabled: credentialDisabled.hash,
      pendingReset: credentialPendingReset.hash,
      requiresReset: credentialRequiresReset.hash,
    },
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
      const [lookupValue] = this.params;
      const lookupByUserId = sql.includes("where u.id = ?");
      const user = this.db.data.userAccounts.find((row) => (
        lookupByUserId ? row.id === lookupValue : row.email_norm === lookupValue
      ));
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
        password_version: credential.password_version ?? 1,
        requires_reset: credential.requires_reset ?? 0,
      };
    }

    if (sql.startsWith("select count(*) as count from sessions where user_id = ?")) {
      const [userId] = this.params;
      return {
        count: this.db.data.sessions.filter((row) => (
          row.user_id === userId && !row.revoked_at && String(row.expires_at) > this.db.nowIso()
        )).length,
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

    if (sql.startsWith("update sessions set revoked_at = strftime") && sql.includes("where token_hash = ?")) {
      const [tokenHash] = this.params;
      const session = this.db.data.sessions.find((row) => row.token_hash === tokenHash);
      if (session) {
        session.revoked_at = this.db.nowIso();
      }
      return { success: true, results: [] };
    }

    if (sql.startsWith("update password_credentials set password_hash = ?")) {
      const [passwordHash, passwordSalt, algorithm, iterations, userId] = this.params;
      const credential = this.db.data.passwordCredentials.find((row) => row.user_id === userId);
      if (credential) {
        credential.password_hash = passwordHash;
        credential.password_salt = passwordSalt;
        credential.algorithm = algorithm;
        credential.iterations = iterations;
        credential.password_version = Number(credential.password_version || 1) + 1;
        credential.requires_reset = 0;
        credential.password_changed_at = this.db.nowIso();
      }
      return { success: true, results: [] };
    }

    if (sql.startsWith("update user_accounts set status = 'active'")) {
      const [userId] = this.params;
      const user = this.db.data.userAccounts.find((row) => row.id === userId);
      if (user) {
        user.status = "active";
        user.updated_at = this.db.nowIso();
      }
      return { success: true, results: [] };
    }

    if (sql.startsWith("update sessions set revoked_at = strftime") && sql.includes("where user_id = ?")) {
      const [userId] = this.params;
      for (const session of this.db.data.sessions) {
        if (session.user_id === userId && !session.revoked_at) {
          session.revoked_at = this.db.nowIso();
        }
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
