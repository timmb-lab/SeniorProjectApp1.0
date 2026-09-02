import type { Env } from "../../_types.ts";
import { createSession, getCurrentUser, securityFingerprint, sessionCookie, writeAudit } from "../../_lib/auth.ts";
import { hashPassword, randomId, validatePassword, verifyPassword } from "../../_lib/crypto.ts";
import { badRequest, getClientIp, json, readJson, requirePost } from "../../_lib/http.ts";
import { authSecretsConfigured } from "../../_lib/auth-config.ts";

interface ChangePasswordBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

interface CredentialRow {
  user_id: string;
  email: string;
  display_name: string;
  status: string;
  password_hash: string;
  password_salt: string;
  algorithm: string;
  iterations: number;
  password_version: number;
  requires_reset: number;
}

const CHANGE_WINDOW_MINUTES = 15;
const MAX_CHANGE_FAILURES = 10;
const MAX_CHANGE_IP_FAILURES = 30;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;
  if (!authSecretsConfigured(env, { password: true })) return json({ error: "auth_not_configured" }, { status: 503 });

  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const identifierHash = await securityFingerprint(env, `password-change:${user.id}`);
  const ipHash = await securityFingerprint(env, `ip:${getClientIp(request)}`);
  const [recentFailures, recentIpFailures] = await Promise.all([
    countRecentChangeFailures(env, "identifier_hash", identifierHash),
    countRecentChangeFailures(env, "ip_hash", ipHash),
  ]);
  if (recentFailures >= MAX_CHANGE_FAILURES || recentIpFailures >= MAX_CHANGE_IP_FAILURES) {
    await recordChangeAttempt(env, identifierHash, ipHash, false, "rate_limited");
    return json({ error: "rate_limited" }, { status: 429 });
  }

  let body: ChangePasswordBody;
  try {
    body = await readJson<ChangePasswordBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!currentPassword || !newPassword) {
    return badRequest("invalid_password_change_payload");
  }

  const row = await env.DB.prepare(
    `SELECT
       u.id AS user_id,
       u.email,
       u.display_name,
       u.status,
       c.password_hash,
       c.password_salt,
       c.algorithm,
       c.iterations,
       c.password_version,
       c.requires_reset
     FROM user_accounts u
     JOIN password_credentials c ON c.user_id = u.id
     WHERE u.id = ?`,
  ).bind(user.id).first<CredentialRow>();

  if (!row || row.status !== "active") {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  if (Number(row.requires_reset || 0) === 1) {
    return json({ error: "password_reset_required" }, { status: 403 });
  }

  const currentPasswordValid = row.algorithm === "PBKDF2-SHA-256" && await verifyPassword(
    currentPassword,
    row.password_hash,
    row.password_salt,
    env.PASSWORD_PEPPER || "",
    Number(row.iterations),
  );
  if (!currentPasswordValid) {
    await recordChangeAttempt(env, identifierHash, ipHash, false, "invalid_current_password");
    await writeAudit(env, {
      actorUserId: row.user_id,
      action: "password_change_denied",
      entityType: "user_account",
      entityId: row.user_id,
      request,
      metadata: { denialReason: "invalid_current_password" },
    });
    return json({ error: "invalid_current_password" }, { status: 401 });
  }

  const passwordErrors = validatePassword(newPassword, { email: row.email, displayName: row.display_name });
  if (passwordErrors.length > 0) {
    return json({ error: "invalid_password", passwordErrors }, { status: 400 });
  }

  const matchesCurrentPassword = await verifyPassword(
    newPassword,
    row.password_hash,
    row.password_salt,
    env.PASSWORD_PEPPER || "",
    Number(row.iterations),
  );
  if (matchesCurrentPassword) {
    return json({ error: "password_must_change" }, { status: 400 });
  }

  const activeSessionCount = await countActiveSessions(env, row.user_id);
  const credential = await hashPassword(newPassword, env.PASSWORD_PEPPER || "");

  await env.DB.prepare(
    `UPDATE password_credentials
     SET password_hash = ?,
         password_salt = ?,
         algorithm = ?,
         iterations = ?,
         password_version = password_version + 1,
         requires_reset = 0,
         password_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?`,
  ).bind(credential.hash, credential.salt, credential.algorithm, credential.iterations, row.user_id).run();

  await env.DB.prepare(
    `UPDATE sessions
     SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?
       AND revoked_at IS NULL`,
  ).bind(row.user_id).run();

  const session = await createSession(request, env, row.user_id);
  await recordChangeAttempt(env, identifierHash, ipHash, true, null);
  await writeAudit(env, {
    actorUserId: row.user_id,
    action: "password_changed_by_user",
    entityType: "user_account",
    entityId: row.user_id,
    request,
    metadata: {
      activeSessionsRevoked: activeSessionCount,
      previousPasswordVersion: Number(row.password_version || 1),
    },
  });

  return json(
    {
      ok: true,
      activeSessionsRevoked: activeSessionCount,
      expiresAt: session.expiresAt,
    },
    { headers: { "set-cookie": sessionCookie(session.token, env) } },
  );
};

async function countRecentChangeFailures(
  env: Env,
  column: "identifier_hash" | "ip_hash",
  value: string,
): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM login_attempts
     WHERE ${column} = ?
       AND success = 0
       AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
  ).bind(value, `-${CHANGE_WINDOW_MINUTES} minutes`).first<{ count: number }>();
  return Number(row?.count || 0);
}

async function recordChangeAttempt(
  env: Env,
  identifierHash: string,
  ipHash: string,
  success: boolean,
  reason: string | null,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO login_attempts (id, identifier_hash, ip_hash, success, reason)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(randomId("password_change"), identifierHash, ipHash, success ? 1 : 0, reason).run();
}

async function countActiveSessions(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM sessions
     WHERE user_id = ?
       AND revoked_at IS NULL
       AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(userId).first<{ count: number }>();
  return Number(row?.count || 0);
}
