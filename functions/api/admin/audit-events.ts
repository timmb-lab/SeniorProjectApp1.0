import type { Env } from "../../_types";
import { getCurrentUser } from "../../_lib/auth";
import { json } from "../../_lib/http";
import { canViewAdminDashboard } from "../../_lib/permissions";

interface AuditEventRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_json: string | null;
  created_at: string;
  actor_name: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  if (!await canViewAdminDashboard(env, user)) return json({ error: "forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const entityType = cleanFilter(url.searchParams.get("entityType"));
  const action = cleanFilter(url.searchParams.get("action"));
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

  const filters: string[] = [];
  const binds: string[] = [];
  if (entityType) {
    filters.push("audit_events.entity_type = ?");
    binds.push(entityType);
  }
  if (action) {
    filters.push("audit_events.action = ?");
    binds.push(action);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const events = await env.DB.prepare(
    `SELECT
       audit_events.id,
       audit_events.actor_user_id,
       audit_events.action,
       audit_events.entity_type,
       audit_events.entity_id,
       audit_events.metadata_json,
       audit_events.created_at,
       actor.display_name AS actor_name
     FROM audit_events
     LEFT JOIN user_accounts actor ON actor.id = audit_events.actor_user_id
     ${whereClause}
     ORDER BY audit_events.created_at DESC
     LIMIT ?`,
  ).bind(...binds, limit).all<AuditEventRow>();

  return json({
    ok: true,
    events: (events.results || []).map((event) => ({
      id: event.id,
      actorUserId: event.actor_user_id,
      actorName: event.actor_name,
      action: event.action,
      entityType: event.entity_type,
      entityId: event.entity_id,
      createdAt: event.created_at,
      metadata: redactMetadata(event.metadata_json),
    })),
  });
};

function cleanFilter(value: string | null): string {
  return value && /^[a-zA-Z0-9_.:-]+$/.test(value) ? value : "";
}

function redactMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return redactAuditValue(JSON.parse(value), "", 0) as Record<string, unknown>;
  } catch {
    return { parseError: true };
  }
}

function redactAuditValue(value: unknown, key: string, depth: number): unknown {
  if (depth > 6) return "[depth-limited]";
  const sensitiveKey = /token|password|secret|hash|pepper|authorization|cookie|credential|private[_-]?key|drive[_-]?file[_-]?id/i.test(key);
  if (sensitiveKey && typeof value === "string") return "[redacted]";
  if (sensitiveKey && value && typeof value === "object") {
    if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactAuditValue(item, key, depth + 1));
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 100)
      .map(([childKey, childValue]) => [childKey, redactAuditValue(childValue, `${key}.${childKey}`, depth + 1)]));
  }
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactAuditValue(item, "", depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 100)
      .map(([childKey, childValue]) => [childKey, redactAuditValue(childValue, childKey, depth + 1)]));
  }
  if (typeof value === "string" && /-----BEGIN [^-]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~-]+|(?:access_token|client_secret|password)=/i.test(value)) {
    return "[redacted]";
  }
  return value;
}
