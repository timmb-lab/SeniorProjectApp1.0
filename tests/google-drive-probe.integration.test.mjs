import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestGet } from "../functions/api/evidence/drive-probe.ts";

test("drive probe returns 401 when session is missing", async () => {
  const { env } = createFixture();
  const response = await onRequestGet({
    request: new Request("https://example.test/api/evidence/drive-probe"),
    env,
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("drive probe returns 503 and audits when Drive config is missing", async () => {
  const { env, db, token } = await createFixtureWithSession({ userId: "admin-a" });
  env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID = "";
  env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID = "";

  const response = await onRequestGet({
    request: new Request("https://example.test/api/evidence/drive-probe", {
      headers: { cookie: `sc_session=${token}`, "cf-connecting-ip": "203.0.113.30", "user-agent": "integration-test" },
    }),
    env,
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "drive_config_missing", ok: false });

  assert.equal(db.data.auditEvents.length, 1);
  assert.equal(db.data.auditEvents[0].action, "google_drive_probe_missing_config");
});

test("drive probe returns 503 and audits when Drive credentials are missing", async () => {
  const { env, db, token } = await createFixtureWithSession({ userId: "admin-a" });
  env.GOOGLE_DRIVE_CLIENT_EMAIL = "";
  env.GOOGLE_DRIVE_PRIVATE_KEY = "";

  const response = await onRequestGet({
    request: new Request("https://example.test/api/evidence/drive-probe", {
      headers: { cookie: `sc_session=${token}`, "cf-connecting-ip": "203.0.113.31", "user-agent": "integration-test" },
    }),
    env,
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "drive_credentials_missing", ok: false });

  assert.equal(db.data.auditEvents.length, 1);
  assert.equal(db.data.auditEvents[0].action, "google_drive_probe_missing_credentials");
});

test("drive probe returns 502 and audits when token exchange fails", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a" });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      assert.equal(String(init.method || "GET").toUpperCase(), "POST");
      return new Response("token failure", { status: 500, headers: { "content-type": "text/plain" } });
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onRequestGet({
      request: new Request("https://example.test/api/evidence/drive-probe", {
        headers: { cookie: `sc_session=${fixture.token}`, "cf-connecting-ip": "203.0.113.32", "user-agent": "integration-test" },
      }),
      env: fixture.env,
    });

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "drive_token_exchange_failed", ok: false });

    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "google_drive_probe_token_exchange_failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("drive probe returns 502 and audits when Drive API access is denied", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a" });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      assert.equal(String(init.method || "GET").toUpperCase(), "POST");
      return jsonResponse({ access_token: "test-token", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.startsWith("https://www.googleapis.com/drive/v3/files/")) {
      return jsonResponse({ error: { message: "forbidden" } }, 403);
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onRequestGet({
      request: new Request("https://example.test/api/evidence/drive-probe", {
        headers: { cookie: `sc_session=${fixture.token}`, "cf-connecting-ip": "203.0.113.33", "user-agent": "integration-test" },
      }),
      env: fixture.env,
    });

    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.error, "drive_access_denied");
    assert.equal(body.ok, false);
    assert.deepEqual(body.drive.root, { ok: false, status: 403, mimeType: null, name: null });
    assert.deepEqual(body.drive.indexSheet, { ok: false, status: 403, mimeType: null, name: null });

    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "google_drive_probe_access_denied");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("drive probe returns 200 and audits when Drive token + probes succeed", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a" });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      assert.equal(String(init.method || "GET").toUpperCase(), "POST");
      assert.match(String(init.headers?.["content-type"] || init.headers?.get?.("content-type") || ""), /application\/x-www-form-urlencoded/i);
      assert.match(String(init.body || ""), /grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer/);
      assert.match(String(init.body || ""), /assertion=/);
      return jsonResponse({ access_token: "test-token", expires_in: 3600, token_type: "Bearer" });
    }

    if (url.startsWith("https://www.googleapis.com/drive/v3/files/")) {
      const fileId = url.split("/drive/v3/files/")[1].split("?")[0];
      if (fileId === fixture.env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID) {
        return jsonResponse({ id: fileId, name: "Evidence Root", mimeType: "application/vnd.google-apps.folder" });
      }
      if (fileId === fixture.env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID) {
        return jsonResponse({ id: fileId, name: "Evidence Index", mimeType: "application/vnd.google-apps.spreadsheet" });
      }
      return jsonResponse({ error: { message: "not found" } }, 404);
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onRequestGet({
      request: new Request("https://example.test/api/evidence/drive-probe", {
        headers: { cookie: `sc_session=${fixture.token}`, "cf-connecting-ip": "203.0.113.34", "user-agent": "integration-test" },
      }),
      env: fixture.env,
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.drive.root.ok, true);
    assert.equal(body.drive.indexSheet.ok, true);

    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "google_drive_probe_success");
    assert.doesNotMatch(JSON.stringify(body), /GOOGLE_DRIVE_PRIVATE_KEY|PRIVATE KEY|access_token/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function resolveFetchUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input === "object" && typeof input.url === "string") return input.url;
  return String(input);
}

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    auditEvents: [],
  });

  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  return {
    env: {
      DB: db,
      SESSION_PEPPER: "",
      GOOGLE_DRIVE_EVIDENCE_ROOT_ID: "root-123",
      GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID: "sheet-456",
      GOOGLE_DRIVE_CLIENT_EMAIL: "service-account@example.test",
      GOOGLE_DRIVE_PRIVATE_KEY: privateKey,
    },
    db,
  };
}

async function createFixtureWithSession({ userId }) {
  const base = createFixture();
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push({
    id: userId,
    email: `${userId}@senior-capstone.test`,
    email_norm: `${userId}@senior-capstone.test`,
    display_name: userId,
    status: "active",
  });
  base.db.data.sessions.push({
    id: `sess-${userId}`,
    user_id: userId,
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });

  return { ...base, token };
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
    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params;
      const session = this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at);
      return session ?? null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
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
