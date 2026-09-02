import type { Env, SessionRecord, UserAccount } from "../_types.ts";
import { getClientIp, getUserAgent } from "./http.ts";
import { hmacSha256Hex, newRandomToken, randomId, sha256Hex } from "./crypto.ts";
import { authSecretsConfigured } from "./auth-config.ts";

const SESSION_HOURS = 12;

function cookieName(env: Env): string {
  if (String(env.APP_ENV || "").trim().toLowerCase() === "production") {
    return "__Host-sc_session";
  }
  return env.SESSION_COOKIE_NAME || "sc_session";
}

export async function securityFingerprint(env: Env, value: string): Promise<string> {
  const key = String(env.AUDIT_FINGERPRINT_KEY || env.SESSION_PEPPER || env.PASSWORD_PEPPER || "local-only-fingerprint-key");
  return hmacSha256Hex(key, `senior-capstone-security-fingerprint:v1:${value}`);
}

export function getSessionToken(request: Request, env: Env): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const name = `${cookieName(env)}=`;
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(name));
  return cookie ? cookie.slice(name.length) : null;
}

export function sessionCookie(token: string, env: Env, maxAgeSeconds = SESSION_HOURS * 60 * 60): string {
  return [
    `${cookieName(env)}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

export function clearSessionCookie(env: Env): string {
  return [
    `${cookieName(env)}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

export async function createSession(
  request: Request,
  env: Env,
  userId: string,
): Promise<{ token: string; sessionId: string; expiresAt: string }> {
  if (!authSecretsConfigured(env)) {
    throw new Error("auth_configuration_invalid");
  }
  const token = newRandomToken();
  const sessionId = randomId("sess");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  const tokenHash = await sha256Hex(`${env.SESSION_PEPPER || ""}${token}`);
  const ipHash = await securityFingerprint(env, getClientIp(request));
  const userAgentHash = await securityFingerprint(env, getUserAgent(request));
  await env.DB.prepare(
    `DELETE FROM sessions
     WHERE user_id = ?
       AND (
         expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')
         OR revoked_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')
       )`,
  ).bind(userId).run();
  await env.DB.prepare(
    `UPDATE sessions
     SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id IN (
       SELECT id FROM sessions
       WHERE user_id = ? AND revoked_at IS NULL
         AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       ORDER BY created_at DESC
       LIMIT -1 OFFSET 9
     )`,
  ).bind(userId).run();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(sessionId, userId, tokenHash, expiresAt, ipHash, userAgentHash).run();
  return { token, sessionId, expiresAt };
}

export async function getCurrentUser(request: Request, env: Env): Promise<UserAccount | null> {
  if (!authSecretsConfigured(env)) return null;
  const token = getSessionToken(request, env);
  if (!token) return null;

  const tokenHash = await sha256Hex(`${env.SESSION_PEPPER || ""}${token}`);
  const session = await env.DB.prepare(
    `SELECT id, user_id, token_hash, expires_at, revoked_at
     FROM sessions
     WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(tokenHash).first<SessionRecord>();

  if (!session) return null;

  await env.DB.prepare(
    "UPDATE sessions SET last_seen_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
  ).bind(session.id).run();

  return env.DB.prepare(
    "SELECT id, email, email_norm, display_name, status FROM user_accounts WHERE id = ? AND status = 'active'",
  ).bind(session.user_id).first<UserAccount>();
}

export async function requireUser(request: Request, env: Env): Promise<UserAccount> {
  const user = await getCurrentUser(request, env);
  if (!user) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return user;
}

export async function revokeSession(request: Request, env: Env): Promise<void> {
  if (!authSecretsConfigured(env)) return;
  const token = getSessionToken(request, env);
  if (!token) return;
  const tokenHash = await sha256Hex(`${env.SESSION_PEPPER || ""}${token}`);
  await env.DB.prepare(
    "UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE token_hash = ?",
  ).bind(tokenHash).run();
}

export async function writeAudit(
  env: Env,
  input: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    request?: Request;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const ipHash = input.request ? await securityFingerprint(env, getClientIp(input.request)) : null;
  const userAgentHash = input.request ? await securityFingerprint(env, getUserAgent(input.request)) : null;
  await env.DB.prepare(
    `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, ip_hash, user_agent_hash, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    randomId("audit"),
    input.actorUserId || null,
    input.action,
    input.entityType,
    input.entityId || null,
    ipHash,
    userAgentHash,
    input.metadata ? JSON.stringify(sanitizeAuditMetadata(input.metadata)) : null,
  ).run();
}

function sanitizeAuditMetadata(value: unknown, key = "", depth = 0): unknown {
  if (depth > 6) return "[depth-limited]";
  const sensitiveKey = /token|password|secret|hash|pepper|authorization|cookie|credential|private[_-]?key|drive[_-]?file[_-]?id/i.test(key);
  if (sensitiveKey && typeof value === "string") return "[redacted]";
  if (sensitiveKey && value && typeof value === "object") {
    if (Array.isArray(value)) {
      return value.slice(0, 100).map((item) => sanitizeAuditMetadata(item, key, depth + 1));
    }
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      output[childKey] = sanitizeAuditMetadata(childValue, `${key}.${childKey}`, depth + 1);
    }
    return output;
  }
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeAuditMetadata(item, "", depth + 1));
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      output[childKey] = sanitizeAuditMetadata(childValue, childKey, depth + 1);
    }
    return output;
  }
  if (typeof value === "string") {
    if (/-----BEGIN [^-]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~-]+|(?:access_token|client_secret|password)=/i.test(value)) {
      return "[redacted]";
    }
    return value.slice(0, 2000);
  }
  return value;
}
