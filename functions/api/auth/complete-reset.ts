import type { Env } from "../../_types.ts";
import { createSession, securityFingerprint, sessionCookie, writeAudit } from "../../_lib/auth.ts";
import { hashPassword, normalizeEmail, randomId, sha256Hex, validatePassword, verifyPassword } from "../../_lib/crypto.ts";
import { badRequest, getClientIp, json, readJson, requirePost } from "../../_lib/http.ts";
import { authSecretsConfigured } from "../../_lib/auth-config.ts";

interface CompleteResetBody {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface CredentialRow {
  user_id: string;
  email: string;
  email_norm: string;
  display_name: string;
  status: string;
  password_hash: string;
  password_salt: string;
  algorithm: string;
  iterations: number;
  requires_reset: number;
}

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;
const MAX_IP_FAILURES = 30;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;
  if (!authSecretsConfigured(env, { password: true })) return json({ error: "auth_not_configured" }, { status: 503 });

  let body: CompleteResetBody;
  try {
    body = await readJson<CompleteResetBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const emailNorm = normalizeEmail(body.email || "");
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  if (!emailNorm || !currentPassword || !newPassword) {
    return badRequest("invalid_reset_payload");
  }

  const identifierHash = await securityFingerprint(env, `login-id:${emailNorm}`);
  const ipHash = await securityFingerprint(env, `ip:${getClientIp(request)}`);
  const [recentFailures, recentIpFailures] = await Promise.all([
    countRecentFailures(env, identifierHash),
    countRecentIpFailures(env, ipHash),
  ]);
  if (recentFailures >= MAX_FAILURES || recentIpFailures >= MAX_IP_FAILURES) {
    await recordAttempt(env, identifierHash, ipHash, false, "rate_limited");
    return json({ error: "rate_limited" }, { status: 429 });
  }

  const row = await env.DB.prepare(
    `SELECT u.id AS user_id, u.email, u.email_norm, u.display_name, u.status, c.password_hash, c.password_salt, c.algorithm, c.iterations, c.requires_reset
     FROM user_accounts u
     JOIN password_credentials c ON c.user_id = u.id
     WHERE u.email_norm = ?`,
  ).bind(emailNorm).first<CredentialRow>();

  const currentPasswordValid = row && row.algorithm === "PBKDF2-SHA-256"
    ? await verifyPassword(currentPassword, row.password_hash, row.password_salt, env.PASSWORD_PEPPER || "", Number(row.iterations))
    : false;

  const setupCodeHash = row && !currentPasswordValid
    ? await sha256Hex(`${env.SESSION_PEPPER || ""}:password-setup:${currentPassword}`)
    : "";
  const setupToken = row && !currentPasswordValid ? await env.DB.prepare(
    `SELECT id FROM auth_password_setup_tokens
     WHERE user_id = ? AND token_hash = ? AND used_at IS NULL
       AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     LIMIT 1`,
  ).bind(row.user_id, setupCodeHash).first<{ id: string }>() : null;
  const setupCodeValid = Boolean(setupToken?.id);

  if (!row || (!currentPasswordValid && !setupCodeValid) || row.status === "disabled") {
    await recordAttempt(env, identifierHash, ipHash, false, "invalid_credentials");
    return json({ error: "invalid_credentials" }, { status: 401 });
  }

  const resetRequired = row.status === "pending_reset" || Number(row.requires_reset || 0) === 1;
  if (!resetRequired) {
    return json({ error: "password_reset_not_required" }, { status: 409 });
  }

  const passwordErrors = validatePassword(newPassword, { email: row.email, displayName: row.display_name });
  if (passwordErrors.length > 0) {
    return json({ error: "invalid_password", passwordErrors }, { status: 400 });
  }

  const matchesCurrentPassword = await verifyPassword(newPassword, row.password_hash, row.password_salt, env.PASSWORD_PEPPER || "", Number(row.iterations));
  if (matchesCurrentPassword) {
    return json({ error: "password_must_change" }, { status: 400 });
  }

  const credential = await hashPassword(newPassword, env.PASSWORD_PEPPER || "");
  await env.DB.prepare(
    `UPDATE password_credentials
     SET password_hash = ?, password_salt = ?, algorithm = ?, iterations = ?, password_version = password_version + 1, requires_reset = 0, password_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?`,
  ).bind(credential.hash, credential.salt, credential.algorithm, credential.iterations, row.user_id).run();
  await env.DB.prepare(
    "UPDATE user_accounts SET status = 'active', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
  ).bind(row.user_id).run();
  if (setupToken?.id) {
    await env.DB.prepare(
      "UPDATE auth_password_setup_tokens SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
    ).bind(setupToken.id).run();
  }
  await env.DB.prepare(
    "UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ? AND revoked_at IS NULL",
  ).bind(row.user_id).run();

  await recordAttempt(env, identifierHash, ipHash, true, null);
  const session = await createSession(request, env, row.user_id);
  await writeAudit(env, {
    actorUserId: row.user_id,
    action: "password_reset_completed",
    entityType: "user_account",
    entityId: row.user_id,
    request,
    metadata: {
      resetRequiredStatus: row.status === "pending_reset",
      resetRequiredCredential: Number(row.requires_reset || 0) === 1,
      usedOneTimeSetupCode: setupCodeValid,
    },
  });

  return json(
    {
      ok: true,
      user: {
        id: row.user_id,
        email: row.email,
        displayName: row.display_name,
      },
      expiresAt: session.expiresAt,
    },
    { headers: { "set-cookie": sessionCookie(session.token, env) } },
  );
};

async function countRecentFailures(env: Env, identifierHash: string): Promise<number> {
  const recentFailures = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM login_attempts
     WHERE identifier_hash = ?
       AND success = 0
       AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
  ).bind(identifierHash, `-${WINDOW_MINUTES} minutes`).first<{ count: number }>();
  return recentFailures?.count || 0;
}

async function countRecentIpFailures(env: Env, ipHash: string): Promise<number> {
  const recentFailures = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM login_attempts
     WHERE ip_hash = ?
       AND success = 0
       AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
  ).bind(ipHash, `-${WINDOW_MINUTES} minutes`).first<{ count: number }>();
  return recentFailures?.count || 0;
}

async function recordAttempt(
  env: Env,
  identifierHash: string,
  ipHash: string,
  success: boolean,
  reason: string | null,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO login_attempts (id, identifier_hash, ip_hash, success, reason)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(randomId("login"), identifierHash, ipHash, success ? 1 : 0, reason).run();
}
