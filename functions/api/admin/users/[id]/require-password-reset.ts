import type { Env } from "../../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../../_lib/auth.ts";
import { badRequest, json, readJson, requirePost } from "../../../../_lib/http.ts";
import { canonicalRoleId, isGlobalAdminRole } from "../../../../_lib/effective-access.ts";
import type { RoleAssignment } from "../../../../_types.ts";
import { cleanWorkflowText, workflowError } from "../../../../_lib/workflow.ts";
import { newRandomToken, randomId, sha256Hex } from "../../../../_lib/crypto.ts";

interface RequirePasswordResetBody {
  reason?: unknown;
  siteId?: unknown;
  confirmImpact?: unknown;
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
  if (body.confirmImpact !== true && body.confirmImpact !== "true") {
    return badRequest("missing_confirmation");
  }
  const siteId = cleanId(body.siteId);
  const callerRoles = await loadRoles(env, caller.id);
  const callerIsGlobalAdmin = callerRoles.some((role) => isGlobalAdminRole(role.role_id));
  const callerCanResetAtSite = siteId ? await hasSiteResetRole(env, caller.id, siteId) : false;
  if (!callerIsGlobalAdmin && !callerCanResetAtSite) {
    await writeDeniedAudit(env, request, caller.id, targetUserId, siteId ? "site_not_manageable" : "site_required", reason, siteId);
    return workflowError("forbidden", 403);
  }

  if (targetUserId === caller.id) {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "self_reset", reason, siteId);
    return workflowError("self_reset_not_allowed", 409);
  }

  if (siteId && !await targetHasActiveSite(env, targetUserId, siteId)) {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "user_not_in_site", reason, siteId);
    return workflowError("user_not_in_site", 404);
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

  if (!callerIsGlobalAdmin) {
    const targetRoles = (await loadRoles(env, targetUserId))
      .map((role) => canonicalRoleId(role.role_id))
      .filter(Boolean) as string[];
    if (!targetRoles.length || !targetRoles.every((roleId) => ["student", "mentor", "viewer", "program_teacher"].includes(roleId))) {
      await writeDeniedAudit(env, request, caller.id, targetUserId, "target_role_not_allowed", reason, siteId);
      return workflowError("forbidden", 403);
    }
  }

  if (target.status === "disabled") {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "account_disabled", reason, siteId);
    return workflowError("account_disabled", 409);
  }

  if (!target.credential_user_id) {
    await writeDeniedAudit(env, request, caller.id, targetUserId, "password_credential_missing", reason, siteId);
    return workflowError("password_credential_missing", 409);
  }

  const activeSessionCount = await countActiveSessions(env, targetUserId);
  const alreadyRequired = target.status === "pending_reset" || Number(target.requires_reset || 0) === 1;
  const setupCode = `SET-${newRandomToken(18)}`;
  const setupCodeHash = await sha256Hex(`${env.SESSION_PEPPER || ""}:password-setup:${setupCode}`);
  const setupTokenId = randomId("password_setup");

  await env.DB.prepare(
    `UPDATE password_credentials
     SET requires_reset = 1
     WHERE user_id = ?`,
  ).bind(targetUserId).run();

  await env.DB.prepare(
    `UPDATE auth_password_setup_tokens
     SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ? AND used_at IS NULL`,
  ).bind(targetUserId).run();
  await env.DB.prepare(
    `INSERT INTO auth_password_setup_tokens (id, user_id, token_hash, created_by, expires_at)
     VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+30 minutes'))`,
  ).bind(setupTokenId, targetUserId, setupCodeHash, caller.id).run();

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
      oneTimeSetupCodeIssued: true,
      siteId,
      actorRole: callerIsGlobalAdmin ? "global_admin" : callerRoles.find((role) => ["site_admin", "administration"].includes(role.role_id))?.role_id || "school_admin",
    },
  });

  return json({
    ok: true,
    resetRequired: true,
    alreadyRequired,
    activeSessionsRevoked: activeSessionCount,
    setupCode,
    setupCodeExpiresInMinutes: 30,
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

async function loadRoles(env: Env, userId: string): Promise<RoleAssignment[]> {
  const rows = await env.DB.prepare(
    "SELECT role_id, scope_type, scope_id FROM user_roles WHERE user_id = ?",
  ).bind(userId).all<RoleAssignment>();
  return rows.results || [];
}

async function hasSiteResetRole(env: Env, userId: string, siteId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM user_roles
     JOIN sites ON sites.id = user_roles.scope_id
      AND sites.status = 'active'
     WHERE user_roles.user_id = ?
      AND user_roles.role_id IN ('site_admin', 'administration')
      AND user_roles.scope_type = 'site'
      AND user_roles.scope_id = ?
     LIMIT 1`,
  ).bind(userId, siteId).first();
  return Boolean(row);
}

async function targetHasActiveSite(env: Env, userId: string, siteId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE site_users.user_id = ?
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(userId, siteId).first();
  return Boolean(row);
}

async function writeDeniedAudit(
  env: Env,
  request: Request,
  actorUserId: string,
  targetUserId: string,
  denialReason: string,
  reason: string,
  siteId = "",
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
      siteId,
    },
  });
}

function cleanId(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : "";
}
