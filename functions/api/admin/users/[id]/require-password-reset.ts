import type { Env } from "../../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../../_lib/auth.ts";
import { badRequest, json, readJson, requirePost } from "../../../../_lib/http.ts";
import { isAdmin } from "../../../../_lib/permissions.ts";
import { cleanWorkflowText, workflowError } from "../../../../_lib/workflow.ts";

interface RequirePasswordResetBody {
  reason?: unknown;
}

interface TargetUserRow {
  id: string;
  email: string;
  display_name: string;
  status: "active" | "disabled" | "pending_reset";
  credential_user_id: string | null;
  requires_reset: number | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const caller = await getCurrentUser(request, env);
  if (!caller) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, caller.id)) return workflowError("forbidden", 403);

  const targetUserId = cleanId(params.id);
  if (!targetUserId) return badRequest("invalid_user_id");

  let body: RequirePasswordResetBody;
  try {
    body = await readJson<RequirePasswordResetBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const reason = cleanWorkflowText(body.reason, "", 500);
  if (!reason) return badRequest("missing_reason");

  if (targetUserId === caller.id) {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "self_reset", reason);
    return workflowError("self_reset_not_allowed", 409);
  }

  const target = await env.DB.prepare(
    `SELECT
       u.id,
       u.email,
       u.display_name,
       u.status,
       c.user_id AS credential_user_id,
       c.requires_reset
     FROM user_accounts u
     LEFT JOIN password_credentials c ON c.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
  ).bind(targetUserId).first<TargetUserRow>();

  if (!target) return workflowError("user_not_found", 404);

  if (target.status === "disabled") {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "account_disabled", reason);
    return workflowError("account_disabled", 409);
  }

  if (!target.credential_user_id) {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "password_credential_missing", reason);
    return workflowError("password_credential_missing", 409);
  }

  const activeSessionCount = await countActiveSessions(env, targetUserId);
  const alreadyRequired = target.status === "pending_reset" || Number(target.requires_reset || 0) === 1;

  await env.DB.prepare(
    `UPDATE password_credentials
     SET requires_reset = 1
     WHERE user_id = ?`,
  ).bind(targetUserId).run();

  await env.DB.prepare(
    `UPDATE user_accounts
     SET status = 'pending_reset',
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(targetUserId).run();

  await env.DB.prepare(
    `UPDATE sessions
     SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?
       AND revoked_at IS NULL`,
  ).bind(targetUserId).run();

  await writeAudit(env, {
    actorUserId: caller.id,
    action: "password_reset_required_by_admin",
    entityType: "user_account",
    entityId: targetUserId,
    request,
    metadata: {
      reason,
      previousStatus: target.status,
      previousRequiresReset: Number(target.requires_reset || 0) === 1,
      alreadyRequired,
      activeSessionsRevoked: activeSessionCount,
    },
  });

  return json({
    ok: true,
    resetRequired: true,
    alreadyRequired,
    activeSessionsRevoked: activeSessionCount,
    user: {
      id: target.id,
      email: target.email,
      displayName: target.display_name,
      status: "pending_reset",
    },
  });
};

async function countActiveSessions(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM sessions
     WHERE user_id = ?
       AND revoked_at IS NULL`,
  ).bind(userId).first<{ count: number }>();
  return Number(row?.count || 0);
}

async function writeDeniedAudit(
  env: Env,
  request: Request,
  actorUserId: string,
  targetUserId: string,
  denialReason: string,
  reason: string,
): Promise<void> {
  await writeAudit(env, {
    actorUserId,
    action: "password_reset_request_denied",
    entityType: "user_account",
    entityId: targetUserId,
    request,
    metadata: {
      denialReason,
      reason,
    },
  });
}

function cleanId(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : "";
}
