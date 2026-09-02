import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "../functions/_lib/crypto.ts";
import { onRequestPost as onRequireReset } from "../functions/api/admin/users/[id]/require-password-reset.ts";
import { onRequest as onCompleteReset } from "../functions/api/auth/complete-reset.ts";
import { seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("an admin can issue a short-lived one-time setup code without exposing a password", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "setup-code-session-pepper",
    PASSWORD_PEPPER: "setup-code-password-pepper",
    AUTH_MODE: "hardened_username_password",
    EVIDENCE_STORAGE_PROVIDER: "link_only",
  };
  await seedUser(db, { id: "setup-admin", displayName: "Setup Admin", roleId: "admin" });
  await seedUser(db, { id: "setup-student", email: "setup.student@example.test", displayName: "Setup Student", roleId: "student" });
  const oldCredential = await hashPassword("Old!Password2026", env.PASSWORD_PEPPER);
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES ('setup-student', ?, ?, ?, ?, 0)`,
  ).bind(oldCredential.hash, oldCredential.salt, oldCredential.algorithm, oldCredential.iterations).run();
  const adminToken = await seedSession(db, env, "setup-admin");

  const reset = await onRequireReset({
    request: jsonRequest("https://example.test/api/admin/users/setup-student/require-password-reset", {
      reason: "The student asked for account recovery help.",
      confirmImpact: true,
    }, adminToken),
    env,
    params: { id: "setup-student" },
  });
  assert.equal(reset.status, 200);
  const resetBody = await reset.json();
  assert.match(resetBody.setupCode, /^SET-[A-Za-z0-9_-]+$/);
  assert.equal(resetBody.temporaryPassword, undefined);

  const newPassword = "Bright!Canyon2026";
  const completed = await onCompleteReset({
    request: jsonRequest("https://example.test/api/auth/complete-reset", {
      email: "setup.student@example.test",
      currentPassword: resetBody.setupCode,
      newPassword,
    }),
    env,
  });
  assert.equal(completed.status, 200);
  assert.match(completed.headers.get("set-cookie") || "", /sc_session=/);
  const user = await db.prepare("SELECT status FROM user_accounts WHERE id = 'setup-student'").first();
  assert.equal(user.status, "active");
  const credential = await db.prepare("SELECT password_hash, password_salt, iterations FROM password_credentials WHERE user_id = 'setup-student'").first();
  assert.equal(await verifyPassword(newPassword, credential.password_hash, credential.password_salt, env.PASSWORD_PEPPER, Number(credential.iterations)), true);

  await db.prepare("UPDATE user_accounts SET status = 'pending_reset' WHERE id = 'setup-student'").run();
  await db.prepare("UPDATE password_credentials SET requires_reset = 1 WHERE user_id = 'setup-student'").run();
  const replay = await onCompleteReset({
    request: jsonRequest("https://example.test/api/auth/complete-reset", {
      email: "setup.student@example.test",
      currentPassword: resetBody.setupCode,
      newPassword: "Silver!Rocket2026",
    }),
    env,
  });
  assert.equal(replay.status, 401);

  const auditRows = await db.prepare("SELECT metadata_json FROM audit_events ORDER BY created_at").all();
  assert.equal(JSON.stringify(auditRows.results).includes(resetBody.setupCode), false);
});

function jsonRequest(url, body, token = "") {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.test",
      ...(token ? { cookie: `sc_session=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
