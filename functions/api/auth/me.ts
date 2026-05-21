import type { Env } from "../../_types.ts";
import { getSessionToken } from "../../_lib/auth.ts";
import { sha256Hex } from "../../_lib/crypto.ts";
import { json } from "../../_lib/http.ts";

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
}

interface SessionUserRow {
  id: string;
  email: string;
  email_norm: string;
  display_name: string;
  status: string;
  requires_reset: number | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = getSessionToken(request, env);
  if (!token) {
    return json({ authenticated: false }, { status: 401 });
  }

  const tokenHash = await sha256Hex(`${env.SESSION_PEPPER || ""}${token}`);
  const session = await env.DB.prepare(
    `SELECT id, user_id, expires_at, revoked_at
     FROM sessions
     WHERE token_hash = ?`,
  ).bind(tokenHash).first<SessionRow>();

  if (!session || session.revoked_at || sessionExpired(session.expires_at)) {
    return json({ authenticated: false, error: "session_expired" }, { status: 401 });
  }

  const user = await env.DB.prepare(
    `SELECT
       user_accounts.id,
       user_accounts.email,
       user_accounts.email_norm,
       user_accounts.display_name,
       user_accounts.status,
       password_credentials.requires_reset
     FROM user_accounts
     LEFT JOIN password_credentials ON password_credentials.user_id = user_accounts.id
     WHERE user_accounts.id = ?`,
  ).bind(session.user_id).first<SessionUserRow>();

  if (!user) {
    return json({ authenticated: false, error: "session_expired" }, { status: 401 });
  }

  if (user.status === "disabled") {
    return json({ authenticated: false, error: "account_disabled" }, { status: 403 });
  }

  if (user.status === "pending_reset" || Number(user.requires_reset || 0) === 1) {
    return json({ authenticated: false, error: "password_reset_required" }, { status: 403 });
  }

  if (user.status !== "active") {
    return json({ authenticated: false, error: "session_expired" }, { status: 401 });
  }

  await env.DB.prepare(
    "UPDATE sessions SET last_seen_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
  ).bind(session.id).run();

  const roles = await env.DB.prepare(
    "SELECT role_id, scope_type, scope_id FROM user_roles WHERE user_id = ?",
  ).bind(user.id).all();

  return json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      roles: roles.results || [],
    },
  });
};

function sessionExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt);
  return !Number.isFinite(timestamp) || timestamp <= Date.now();
}
