import { sha256Hex } from "../../functions/_lib/crypto.ts";

export async function seedSession(db, env, userId, token = `token-${userId}`) {
  const tokenHash = await sha256Hex(`${env.SESSION_PEPPER || ""}${token}`);
  await db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(`sess-${userId}`, userId, tokenHash, "2099-01-01T00:00:00.000Z").run();
  return token;
}

export async function seedUser(db, {
  id,
  displayName,
  email = `${id}@senior-capstone.test`,
  status = "active",
  roleId = null,
  scopeType = "global",
  scopeId = "",
}) {
  await db.prepare(
    `INSERT OR IGNORE INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(id, email, email.toLowerCase(), displayName || id, status).run();
  if (roleId) {
    await db.prepare(
      `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id)
       VALUES (?, ?, ?, ?)`,
    ).bind(id, roleId, scopeType, scopeId).run();
  }
}

export function buildRequest(url, token = null, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("cf-connecting-ip", "203.0.113.44");
  headers.set("user-agent", "dashboard-route-test");
  if (token) headers.set("cookie", `sc_session=${token}`);
  return new Request(url, { ...init, headers });
}

export async function readAuditActions(db) {
  const rows = await db.prepare(
    "SELECT action, entity_type, entity_id, metadata_json FROM audit_events ORDER BY created_at ASC",
  ).all();
  return rows.results.map((row) => ({
    ...row,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
  }));
}
