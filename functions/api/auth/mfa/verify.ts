import type { Env } from "../../../_types.ts";
import { createSession, sessionCookie, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import {
  decryptMfaSecret,
  generateRecoveryCodes,
  mfaTokenHash,
  normalizeMfaCode,
  recoveryCodeHash,
  verifyTotp,
} from "../../../_lib/mfa.ts";

interface VerifyBody {
  challengeToken?: unknown;
  code?: unknown;
}

interface ChallengeRow {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  challenge_type: "enroll" | "login";
  secret_ciphertext: string | null;
  attempts: number;
  mfa_secret_ciphertext: string | null;
  last_used_step: number | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  let body: VerifyBody;
  try {
    body = await readJson<VerifyBody>(request);
  } catch {
    return badRequest("invalid_json");
  }
  const challengeToken = String(body.challengeToken || "").trim();
  const code = normalizeMfaCode(body.code);
  if (!challengeToken || !code) return badRequest("mfa_code_required");

  const tokenHash = await mfaTokenHash(env, challengeToken);
  const challenge = await env.DB.prepare(
    `SELECT
       auth_mfa_challenges.id,
       auth_mfa_challenges.user_id,
       user_accounts.email,
       user_accounts.display_name,
       auth_mfa_challenges.challenge_type,
       auth_mfa_challenges.secret_ciphertext,
       auth_mfa_challenges.attempts,
       auth_mfa_totp.secret_ciphertext AS mfa_secret_ciphertext,
       auth_mfa_totp.last_used_step
     FROM auth_mfa_challenges
     JOIN user_accounts ON user_accounts.id = auth_mfa_challenges.user_id
       AND user_accounts.status = 'active'
     LEFT JOIN auth_mfa_totp ON auth_mfa_totp.user_id = auth_mfa_challenges.user_id
       AND auth_mfa_totp.status = 'active'
     WHERE auth_mfa_challenges.token_hash = ?
       AND auth_mfa_challenges.consumed_at IS NULL
       AND auth_mfa_challenges.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     LIMIT 1`,
  ).bind(tokenHash).first<ChallengeRow>();

  if (!challenge) return json({ error: "mfa_challenge_expired" }, { status: 401 });
  if (Number(challenge.attempts || 0) >= 5) {
    return json({ error: "mfa_challenge_locked" }, { status: 429 });
  }

  const secretCiphertext = challenge.challenge_type === "enroll"
    ? challenge.secret_ciphertext
    : challenge.mfa_secret_ciphertext;
  if (!secretCiphertext) return json({ error: "mfa_setup_required" }, { status: 409 });

  let usedStep: number | null = null;
  let usedRecoveryCodeId = "";
  if (challenge.challenge_type === "login" && !/^\d{6}$/.test(code)) {
    const codeHash = await recoveryCodeHash(env, code);
    const recovery = await env.DB.prepare(
      `SELECT id FROM auth_mfa_recovery_codes
       WHERE user_id = ? AND code_hash = ? AND used_at IS NULL
       LIMIT 1`,
    ).bind(challenge.user_id, codeHash).first<{ id: string }>();
    usedRecoveryCodeId = recovery?.id || "";
  } else {
    const secret = await decryptMfaSecret(env, secretCiphertext);
    usedStep = await verifyTotp(secret, code, challenge.challenge_type === "login" ? challenge.last_used_step : null);
  }

  if (usedStep === null && !usedRecoveryCodeId) {
    await env.DB.prepare(
      "UPDATE auth_mfa_challenges SET attempts = attempts + 1 WHERE id = ? AND consumed_at IS NULL",
    ).bind(challenge.id).run();
    await writeAudit(env, {
      actorUserId: challenge.user_id,
      action: "mfa_verification_failed",
      entityType: "user_account",
      entityId: challenge.user_id,
      request,
      metadata: { challengeType: challenge.challenge_type },
    });
    return json({ error: "invalid_mfa_code" }, { status: 401 });
  }

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      "UPDATE auth_mfa_challenges SET consumed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND consumed_at IS NULL",
    ).bind(challenge.id),
  ];
  let recoveryCodes: string[] = [];
  if (challenge.challenge_type === "enroll") {
    recoveryCodes = generateRecoveryCodes();
    statements.push(
      env.DB.prepare(
        `INSERT INTO auth_mfa_totp (user_id, secret_ciphertext, status, last_used_step)
         VALUES (?, ?, 'active', ?)
         ON CONFLICT(user_id) DO UPDATE SET
           secret_ciphertext = excluded.secret_ciphertext,
           status = 'active',
           last_used_step = excluded.last_used_step,
           enrolled_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ).bind(challenge.user_id, secretCiphertext, usedStep),
      env.DB.prepare("DELETE FROM auth_mfa_recovery_codes WHERE user_id = ?").bind(challenge.user_id),
    );
    for (const recoveryCode of recoveryCodes) {
      statements.push(env.DB.prepare(
        "INSERT INTO auth_mfa_recovery_codes (id, user_id, code_hash) VALUES (?, ?, ?)",
      ).bind(randomId("mfa_recovery"), challenge.user_id, await recoveryCodeHash(env, recoveryCode)));
    }
  } else if (usedRecoveryCodeId) {
    statements.push(env.DB.prepare(
      "UPDATE auth_mfa_recovery_codes SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
    ).bind(usedRecoveryCodeId));
  } else {
    statements.push(env.DB.prepare(
      `UPDATE auth_mfa_totp
       SET last_used_step = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE user_id = ? AND status = 'active'`,
    ).bind(usedStep, challenge.user_id));
  }
  await env.DB.batch(statements);

  const session = await createSession(request, env, challenge.user_id);
  await writeAudit(env, {
    actorUserId: challenge.user_id,
    action: challenge.challenge_type === "enroll" ? "mfa_enrolled" : usedRecoveryCodeId ? "mfa_recovery_code_used" : "login_mfa_verified",
    entityType: "session",
    entityId: session.sessionId,
    request,
  });
  if (challenge.challenge_type === "enroll") {
    await writeAudit(env, {
      actorUserId: challenge.user_id,
      action: "login",
      entityType: "session",
      entityId: session.sessionId,
      request,
      metadata: { mfa: true, enrolled: true },
    });
  } else {
    await writeAudit(env, {
      actorUserId: challenge.user_id,
      action: "login",
      entityType: "session",
      entityId: session.sessionId,
      request,
      metadata: { mfa: true, recoveryCode: Boolean(usedRecoveryCodeId) },
    });
  }

  return json({
    ok: true,
    enrolled: challenge.challenge_type === "enroll",
    recoveryCodes,
    user: {
      id: challenge.user_id,
      email: challenge.email,
      displayName: challenge.display_name,
    },
    expiresAt: session.expiresAt,
  }, { headers: { "set-cookie": sessionCookie(session.token, env) } });
};
