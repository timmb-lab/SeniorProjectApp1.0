import type { Env, SessionRecord, UserAccount } from "../_types.ts";
import { getClientIp, getUserAgent } from "./http.ts";
import { newRandomToken, randomId, sha256Hex } from "./crypto.ts";

const SESSION_HOURS = 12;

function cookieName(env: Env): string {
  return env.SESSION_COOKIE_NAME || "sc_session";
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
  const token = newRandomToken();
  const sessionId = randomId("sess");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  const tokenHash = await sha256Hex(`${env.SESSION_PEPPER || ""}${token}`);
  const ipHash = await sha256Hex(getClientIp(request));
  const userAgentHash = await sha256Hex(getUserAgent(request));
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_hash, user_agent_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(sessionId, userId, tokenHash, expiresAt, ipHash, userAgentHash).run();
  return { token, sessionId, expiresAt };
}

export async function getCurrentUser(request: Request, env: Env): Promise<UserAccount | null> {
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
  const ipHash = input.request ? await sha256Hex(getClientIp(input.request)) : null;
  const userAgentHash = input.request ? await sha256Hex(getUserAgent(input.request)) : null;
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
    input.metadata ? JSON.stringify(input.metadata) : null,
  ).run();
}
