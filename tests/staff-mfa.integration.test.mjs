import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword } from "../functions/_lib/crypto.ts";
import { totpCodeForSecret } from "../functions/_lib/mfa.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestPost as onVerifyMfa } from "../functions/api/auth/mfa/verify.ts";
import { seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("staff must enroll in MFA, can sign in with TOTP, and can use each recovery code once", async () => {
  const fixture = await createFixture();
  const enrollment = await login(fixture, fixture.teacherEmail);
  assert.equal(enrollment.status, 202);
  const enrollmentBody = await enrollment.json();
  assert.equal(enrollmentBody.error, "mfa_enrollment_required");
  assert.equal(enrollmentBody.mfa.mode, "enroll");
  assert.match(enrollmentBody.mfa.secret, /^[A-Z2-7]{32}$/);
  assert.equal(enrollment.headers.get("set-cookie"), null);

  const badCode = await verify(fixture, enrollmentBody.challengeToken, "000000");
  assert.equal(badCode.status, 401);
  assert.equal((await badCode.json()).error, "invalid_mfa_code");

  const code = await totpCodeForSecret(enrollmentBody.mfa.secret);
  const enrolled = await verify(fixture, enrollmentBody.challengeToken, code);
  assert.equal(enrolled.status, 200);
  const enrolledBody = await enrolled.json();
  assert.equal(enrolledBody.enrolled, true);
  assert.equal(enrolledBody.recoveryCodes.length, 8);
  assert.match(enrolled.headers.get("set-cookie") || "", /sc_session=/);
  assert.equal(await fixture.db.prepare("SELECT COUNT(*) AS count FROM auth_mfa_totp WHERE user_id = 'mfa-teacher' AND status = 'active'").first().then((row) => row.count), 1);

  const secondLogin = await login(fixture, fixture.teacherEmail);
  assert.equal(secondLogin.status, 202);
  const secondBody = await secondLogin.json();
  assert.equal(secondBody.error, "mfa_required");
  assert.equal(secondBody.mfa.secret, "");
  const recovered = await verify(fixture, secondBody.challengeToken, enrolledBody.recoveryCodes[0]);
  assert.equal(recovered.status, 200);
  assert.equal((await recovered.json()).enrolled, false);

  const thirdLogin = await login(fixture, fixture.teacherEmail);
  const thirdBody = await thirdLogin.json();
  const reused = await verify(fixture, thirdBody.challengeToken, enrolledBody.recoveryCodes[0]);
  assert.equal(reused.status, 401);
  assert.equal((await reused.json()).error, "invalid_mfa_code");

  const audit = await fixture.db.prepare("SELECT metadata_json FROM audit_events ORDER BY created_at").all();
  const serialized = JSON.stringify(audit.results);
  assert.equal(serialized.includes(enrollmentBody.challengeToken), false);
  assert.equal(enrolledBody.recoveryCodes.some((recoveryCode) => serialized.includes(recoveryCode)), false);
  assert.equal(serialized.includes(enrollmentBody.mfa.secret), false);
});

test("student sign-in does not require the staff MFA step", async () => {
  const fixture = await createFixture();
  const response = await login(fixture, fixture.studentEmail);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") || "", /sc_session=/);
});

async function createFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "staff-mfa-session-pepper",
    PASSWORD_PEPPER: "staff-mfa-password-pepper",
    AUTH_MODE: "hardened_username_password",
    AUTH_STAFF_MFA_REQUIRED: "true",
    EVIDENCE_STORAGE_PROVIDER: "link_only",
  };
  const password = "Strong!MfaPass2026";
  const teacherEmail = "teacher.mfa@example.test";
  const studentEmail = "student.mfa@example.test";
  await seedUser(db, { id: "mfa-teacher", email: teacherEmail, displayName: "MFA Teacher", roleId: "program_teacher", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "mfa-student", email: studentEmail, displayName: "MFA Student", roleId: "student" });
  for (const userId of ["mfa-teacher", "mfa-student"]) {
    const credential = await hashPassword(password, env.PASSWORD_PEPPER);
    await db.prepare(
      `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
       VALUES (?, ?, ?, ?, ?, 0)`,
    ).bind(userId, credential.hash, credential.salt, credential.algorithm, credential.iterations).run();
  }
  return { db, env, password, teacherEmail, studentEmail };
}

function login(fixture, email) {
  return onLogin({
    request: jsonRequest("https://example.test/api/auth/login", { email, password: fixture.password }),
    env: fixture.env,
  });
}

function verify(fixture, challengeToken, code) {
  return onVerifyMfa({
    request: jsonRequest("https://example.test/api/auth/mfa/verify", { challengeToken, code }),
    env: fixture.env,
  });
}

function jsonRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.test",
      "cf-connecting-ip": "203.0.113.55",
      "user-agent": "staff-mfa-test",
    },
    body: JSON.stringify(body),
  });
}
