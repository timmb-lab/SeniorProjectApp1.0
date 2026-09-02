import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getSessionToken, securityFingerprint, sessionCookie } from "../functions/_lib/auth.ts";
import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequest as onBootstrap } from "../functions/api/auth/bootstrap.ts";
import { onRequestGet as onHealth } from "../functions/api/health.ts";
import { seedSession } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("production is link-only and legacy Drive access uses the narrow scope", async () => {
  const [config, driveSource, uploadSource, archiveSource, archiveProviderSource] = await Promise.all([
    readFile("wrangler.jsonc", "utf8"),
    readFile("functions/_lib/google-drive.ts", "utf8"),
    readFile("functions/api/submissions/[id]/evidence/upload.ts", "utf8"),
    readFile("functions/api/admin/exports/student-archive.ts", "utf8"),
    readFile("functions/_lib/archive-export.ts", "utf8"),
  ]);
  assert.match(config, /"EVIDENCE_STORAGE_PROVIDER":\s*"link_only"/);
  assert.match(driveSource, /auth\/drive\.file/);
  assert.doesNotMatch(driveSource, /auth\/drive"/);
  assert.match(uploadSource, /EVIDENCE_STORAGE_PROVIDER === "link_only"/);
  assert.match(uploadSource, /use_google_drive_link/);
  assert.ok(
    uploadSource.indexOf("use_google_drive_link") < uploadSource.indexOf("request.formData()"),
    "Link-only mode must stop before a multipart body is parsed.",
  );
  assert.match(archiveProviderSource, /EVIDENCE_STORAGE_PROVIDER === "link_only"/);
  assert.match(archiveSource, /if \(!linkOnly\) drivePackage = await uploadStudentArchiveDrivePackage/);
});

test("security fingerprints are keyed and change when the key rotates", async () => {
  const value = "ip:203.0.113.7";
  const first = await securityFingerprint({ AUDIT_FINGERPRINT_KEY: "first-key" }, value);
  const second = await securityFingerprint({ AUDIT_FINGERPRINT_KEY: "second-key" }, value);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.notEqual(first, await sha256Hex(value));
});

test("production sessions use the browser-enforced Host cookie prefix", () => {
  const productionEnv = { APP_ENV: "production", SESSION_COOKIE_NAME: "sc_session" };
  const cookie = sessionCookie("secret-token", productionEnv);
  assert.match(cookie, /^__Host-sc_session=secret-token;/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.doesNotMatch(cookie, /Domain=/i);
  const request = new Request("https://example.test/workspace", {
    headers: { cookie: "__Host-sc_session=secret-token" },
  });
  assert.equal(getSessionToken(request, productionEnv), "secret-token");
});

test("public health is minimal while a security admin can read readiness", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    AUTH_MODE: "hardened_username_password",
    EVIDENCE_STORAGE_PROVIDER: "link_only",
    SESSION_COOKIE_NAME: "sc_session",
    SESSION_PEPPER: "session-pepper",
    PASSWORD_PEPPER: "password-pepper",
  };
  const publicResponse = await onHealth({ request: new Request("https://example.test/api/health"), env });
  assert.deepEqual(await publicResponse.json(), { ok: true });

  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES ('security-admin', 'admin@senior-capstone.test', 'admin@senior-capstone.test', 'Security Admin', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES ('security-admin', 'global_admin', 'global', '')`,
  ).run();
  const token = await seedSession(db, env, "security-admin");
  const adminResponse = await onHealth({
    request: new Request("https://example.test/api/health", { headers: { cookie: `sc_session=${token}` } }),
    env,
  });
  const body = await adminResponse.json();
  assert.equal(body.ok, true);
  assert.equal(body.readiness.databaseReady, true);
  assert.equal(body.readiness.studentRosterProfilesReady, true);
  assert.equal(body.readiness.evidenceStorageProvider, "link_only");
});

test("only one concurrent first-admin request can claim bootstrap", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    AUTH_MODE: "hardened_username_password",
    EVIDENCE_STORAGE_PROVIDER: "link_only",
    BOOTSTRAP_SETUP_KEY: "one-time-setup-key",
    SESSION_PEPPER: "session-pepper",
    PASSWORD_PEPPER: "password-pepper",
  };
  const body = {
    setupKey: env.BOOTSTRAP_SETUP_KEY,
    email: "first-admin@senior-capstone.test",
    displayName: "First Admin",
    password: "Safe-River-Password-2048!",
  };
  const call = () => onBootstrap({
    request: new Request("https://example.test/api/auth/bootstrap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
  });
  const responses = await Promise.all([call(), call()]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  const users = await db.prepare("SELECT COUNT(*) AS count FROM user_accounts").first();
  const credentials = await db.prepare("SELECT COUNT(*) AS count FROM password_credentials").first();
  const roles = await db.prepare("SELECT COUNT(*) AS count FROM user_roles WHERE role_id = 'global_admin'").first();
  assert.equal(users.count, 1);
  assert.equal(credentials.count, 1);
  assert.equal(roles.count, 1);
});
