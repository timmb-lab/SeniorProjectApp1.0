import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onConfig } from "../functions/api/auth/config.ts";
import { onRequestGet as onCallback } from "../functions/api/auth/google/callback.ts";
import { onRequestGet as onStart } from "../functions/api/auth/google/start.ts";
import { seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("auth config keeps Google SSO disabled unless required env is complete", async () => {
  const disabled = await onConfig({
    env: {
      AUTH_MODE: "hardened_username_password",
      EVIDENCE_STORAGE_PROVIDER: "google_drive",
      AUTH_GOOGLE_SSO_ENABLED: "true",
    },
  });
  assert.equal(disabled.status, 200);
  assert.deepEqual(await disabled.json(), {
    ok: true,
    authMode: "hardened_username_password",
    googleSsoEnabled: false,
    googleSsoConfigured: false,
    localLoginEnabled: true,
    googleWorkspaceLabel: "Use your school Google Workspace account",
  });

  const enabled = await onConfig({
    env: {
      AUTH_MODE: "hybrid_google_workspace_local",
      EVIDENCE_STORAGE_PROVIDER: "google_drive",
      AUTH_GOOGLE_SSO_ENABLED: "true",
      GOOGLE_OAUTH_CLIENT_ID: "client-id",
      GOOGLE_OAUTH_CLIENT_SECRET: "client-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://app.thecapstoneapp.com/api/auth/google/callback",
    },
  });
  assert.equal((await enabled.json()).googleSsoEnabled, true);
});

test("Google SSO start fails closed when disabled and stores hashed state when enabled", async () => {
  {
    const { env } = await createFixture({ enabled: false });
    const response = await onStart({
      request: new Request("https://example.test/api/auth/google/start"),
      env,
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "sso_not_configured");
  }

  const { env, db, jwks, restoreFetch } = await createFixture();
  globalThis.fetch = mockGoogleFetch({ jwks });
  try {
    const response = await onStart({
      request: new Request("https://example.test/api/auth/google/start?returnTo=/workspace.html&domain=senior-capstone.test"),
      env,
    });
    assert.equal(response.status, 302);
    const location = response.headers.get("location");
    assert.match(location, /^https:\/\/accounts\.google\.test\/auth/);
    const authUrl = new URL(location);
    const state = authUrl.searchParams.get("state");
    const nonce = authUrl.searchParams.get("nonce");
    assert.ok(state);
    assert.ok(nonce);
    assert.equal(authUrl.searchParams.get("scope"), "openid email profile");
    assert.equal(authUrl.searchParams.get("hd"), "senior-capstone.test");

    const rows = await db.prepare("SELECT state_hash, nonce_hash FROM oauth_states").all();
    assert.equal(rows.results.length, 1);
    assert.notEqual(rows.results[0].state_hash, state);
    assert.notEqual(rows.results[0].nonce_hash, nonce);
    assert.match(rows.results[0].state_hash, /^[a-f0-9]{64}$/);
    assert.match(rows.results[0].nonce_hash, /^[a-f0-9]{64}$/);
  } finally {
    restoreFetch();
  }
});

test("Google SSO callback rejects invalid states, OAuth errors, replay, and unsafe claims", async () => {
  {
    const { env } = await createFixture();
    const response = await onCallback({
      request: jsonRequest("https://example.test/api/auth/google/callback"),
      env,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "sso_invalid_state");
  }

  {
    const fixture = await createFixture();
    const started = await startSso(fixture);
    const response = await onCallback({
      request: jsonRequest(`https://example.test/api/auth/google/callback?error=access_denied&state=${started.state}`, started.cookie),
      env: fixture.env,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "sso_token_exchange_failed");
    fixture.restoreFetch();
  }

  for (const [label, claimOverrides, expectedError] of [
    ["wrong audience", { aud: "wrong-client" }, "sso_invalid_id_token"],
    ["expired token", { exp: Math.floor(Date.now() / 1000) - 1000 }, "sso_invalid_id_token"],
    ["unverified email", { email_verified: false }, "sso_email_not_verified"],
    ["missing hosted domain", { hd: undefined }, "sso_domain_not_allowed"],
    ["mismatched hosted domain", { hd: "other-school.test" }, "sso_domain_not_allowed"],
  ]) {
    const fixture = await createFixture();
    const started = await startSso(fixture, { claims: claimOverrides });
    const response = await onCallback({
      request: jsonRequest(`https://example.test/api/auth/google/callback?code=code-${label}&state=${started.state}`, started.cookie),
      env: fixture.env,
    });
    assert.equal(response.status, 400, label);
    assert.equal((await response.json()).error, expectedError, label);
    fixture.restoreFetch();
  }

  {
    const fixture = await createFixture({ suspendedTenant: true });
    await seedUser(fixture.db, {
      id: "google-user",
      displayName: "Google User",
      email: "google.user@senior-capstone.test",
      roleId: "student",
    });
    const started = await startSso(fixture);
    const response = await onCallback({
      request: jsonRequest(`https://example.test/api/auth/google/callback?code=suspended&state=${started.state}`, started.cookie),
      env: fixture.env,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "sso_tenant_inactive");
    fixture.restoreFetch();
  }

  {
    const fixture = await createFixture();
    const started = await startSso(fixture);
    const response = await onCallback({
      request: jsonRequest(`https://example.test/api/auth/google/callback?code=unprovisioned&state=${started.state}`, started.cookie),
      env: fixture.env,
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "sso_account_not_provisioned");
    fixture.restoreFetch();
  }

  {
    const fixture = await createFixture();
    await seedUser(fixture.db, {
      id: "google-user",
      displayName: "Google User",
      email: "google.user@senior-capstone.test",
      roleId: "student",
    });
    const started = await startSso(fixture);
    const first = await onCallback({
      request: jsonRequest(`https://example.test/api/auth/google/callback?code=success&state=${started.state}`, started.cookie),
      env: fixture.env,
    });
    assert.equal(first.status, 302);
    assert.match(first.headers.get("set-cookie") || "", /sc_session=/);
    const identities = await fixture.db.prepare("SELECT provider, provider_subject, email_norm FROM auth_identities").all();
    assert.equal(identities.results.length, 1);
    assert.equal(identities.results[0].provider, "google_workspace");
    const sessions = await fixture.db.prepare("SELECT id FROM sessions WHERE user_id = 'google-user'").all();
    assert.equal(sessions.results.length, 1);

    const replay = await onCallback({
      request: jsonRequest(`https://example.test/api/auth/google/callback?code=replay&state=${started.state}`, started.cookie),
      env: fixture.env,
    });
    assert.equal(replay.status, 400);
    assert.equal((await replay.json()).error, "sso_invalid_state");
    fixture.restoreFetch();
  }
});

async function createFixture({ enabled = true, suspendedTenant = false } = {}) {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "",
    AUTH_MODE: enabled ? "hybrid_google_workspace_local" : "hardened_username_password",
    AUTH_GOOGLE_SSO_ENABLED: enabled ? "true" : "false",
    AUTH_LOCAL_LOGIN_ENABLED: "true",
    GOOGLE_OAUTH_CLIENT_ID: enabled ? "google-client-id" : "",
    GOOGLE_OAUTH_CLIENT_SECRET: enabled ? "google-client-secret" : "",
    GOOGLE_OAUTH_REDIRECT_URI: enabled ? "https://app.thecapstoneapp.com/api/auth/google/callback" : "",
    GOOGLE_OAUTH_ALLOWED_HOSTED_DOMAINS: "senior-capstone.test",
    EVIDENCE_STORAGE_PROVIDER: "google_drive",
  };

  await db.prepare(
    "UPDATE identity_providers SET status = 'configured', client_id = ? WHERE hosted_domain = 'senior-capstone.test'",
  ).bind(env.GOOGLE_OAUTH_CLIENT_ID).run();
  if (suspendedTenant) {
    await db.prepare("UPDATE tenants SET status = 'suspended' WHERE id = 'tenant-capstone-sandbox'").run();
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const jwks = { keys: [{ ...publicJwk, kid: "test-key", alg: "RS256", use: "sig" }] };
  const originalFetch = globalThis.fetch;

  return {
    env,
    db,
    keyPair,
    jwks,
    restoreFetch() {
      globalThis.fetch = originalFetch;
    },
  };
}

async function startSso(fixture, { claims = {} } = {}) {
  globalThis.fetch = mockGoogleFetch({ jwks: fixture.jwks });
  const startResponse = await onStart({
    request: new Request("https://example.test/api/auth/google/start?returnTo=/workspace.html&domain=senior-capstone.test"),
    env: fixture.env,
  });
  assert.equal(startResponse.status, 302);
  const location = new URL(startResponse.headers.get("location"));
  const state = location.searchParams.get("state");
  const nonce = location.searchParams.get("nonce");
  const cookie = startResponse.headers.get("set-cookie").split(";")[0];
  const idToken = await signIdToken(fixture, {
    iss: "https://accounts.google.com",
    aud: fixture.env.GOOGLE_OAUTH_CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    sub: "google-subject-1",
    email: "google.user@senior-capstone.test",
    email_verified: true,
    hd: "senior-capstone.test",
    nonce,
    name: "Google User",
    ...claims,
  });
  globalThis.fetch = mockGoogleFetch({ jwks: fixture.jwks, idToken });
  return { state, nonce, cookie, idToken };
}

function mockGoogleFetch({ jwks, idToken = "unused-id-token" }) {
  return async (url) => {
    const href = String(url);
    if (href === "https://accounts.google.com/.well-known/openid-configuration") {
      return jsonResponse({
        authorization_endpoint: "https://accounts.google.test/auth",
        token_endpoint: "https://oauth2.google.test/token",
        jwks_uri: "https://www.googleapis.test/oauth2/v3/certs",
      });
    }
    if (href === "https://oauth2.google.test/token") {
      return jsonResponse({ id_token: idToken });
    }
    if (href === "https://www.googleapis.test/oauth2/v3/certs") {
      return jsonResponse(jwks);
    }
    return new Response("not found", { status: 404 });
  };
}

async function signIdToken(fixture, claims) {
  const header = { alg: "RS256", kid: "test-key", typ: "JWT" };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(claims)}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    fixture.keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;
}

function jsonRequest(url, cookie = "") {
  const headers = new Headers({ accept: "application/json" });
  if (cookie) headers.set("cookie", cookie);
  return new Request(url, { headers });
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  });
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
