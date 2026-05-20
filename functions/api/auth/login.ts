import type { Env } from "../../_types.ts";
import { createSession, sessionCookie, writeAudit } from "../../_lib/auth.ts";
import { normalizeEmail, randomId, sha256Hex, verifyPassword } from "../../_lib/crypto.ts";
import { badRequest, getClientIp, json, readJson, requirePost } from "../../_lib/http.ts";

interface LoginBody {
  email?: string;
  password?: string;
}

interface CredentialRow {
  user_id: string;
  email: string;
  email_norm: string;
  display_name: string;
  status: string;
  password_hash: string;
  password_salt: string;
  requires_reset: number;
}

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  let body: LoginBody;
  try {
    body = await readJson<LoginBody>(request);
  } catch {
    return badRequest("invalid_json");
  }
  const emailNorm = normalizeEmail(body.email || "");
  const password = body.password || "";
  const identifierHash = await sha256Hex(emailNorm);
  const ipHash = await sha256Hex(getClientIp(request));

  const recentFailures = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM login_attempts
     WHERE identifier_hash = ?
       AND success = 0
       AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
  ).bind(identifierHash, `-${WINDOW_MINUTES} minutes`).first<{ count: number }>();

  if ((recentFailures?.count || 0) >= MAX_FAILURES) {
    await recordAttempt(env, identifierHash, ipHash, false, "rate_limited");
    return json({ error: "rate_limited" }, { status: 429 });
  }

  const row = await env.DB.prepare(
    `SELECT u.id AS user_id, u.email, u.email_norm, u.display_name, u.status, c.password_hash, c.password_salt, c.requires_reset
     FROM user_accounts u
     JOIN password_credentials c ON c.user_id = u.id
     WHERE u.email_norm = ?`,
  ).bind(emailNorm).first<CredentialRow>();

  const valid = row
    ? await verifyPassword(password, row.password_hash, row.password_salt, env.PASSWORD_PEPPER || "")
    : false;

  if (!row || !valid) {
    await recordAttempt(env, identifierHash, ipHash, false, "invalid_credentials");
    return json({ error: "invalid_credentials" }, { status: 401 });
  }

  if (row.status === "pending_reset" || Number(row.requires_reset || 0) === 1) {
    await recordAttempt(env, identifierHash, ipHash, false, "password_reset_required");
    return json({ error: "password_reset_required" }, { status: 403 });
  }

  if (row.status !== "active") {
    await recordAttempt(env, identifierHash, ipHash, false, "invalid_credentials");
    return json({ error: "invalid_credentials" }, { status: 401 });
  }

  await recordAttempt(env, identifierHash, ipHash, true, null);
  const session = await createSession(request, env, row.user_id);
  await writeAudit(env, {
    actorUserId: row.user_id,
    action: "login",
    entityType: "session",
    entityId: session.sessionId,
    request,
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
