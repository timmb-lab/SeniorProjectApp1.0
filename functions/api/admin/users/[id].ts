import type { Env, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { canRemoveGlobalAdminGrant, loadEffectiveAccess } from "../../../_lib/effective-access.ts";
import { badRequest, json, readJson } from "../../../_lib/http.ts";
import { canManageSiteUsers, canManageUsers } from "../../../_lib/permissions.ts";
import { cleanId } from "../../../_lib/site-scope.ts";

interface RemoveAccountBody {
  siteId?: unknown;
  adminNote?: unknown;
}

interface TargetUserRow {
  id: string;
  status: string;
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const caller = await getCurrentUser(request, env);
  if (!caller) return json({ error: "unauthorized" }, { status: 401 });

  const targetUserId = cleanId(routeParam(params as Record<string, string | string[]> | undefined, "id"));
  if (!targetUserId) return badRequest("missing_user_id");
  if (targetUserId === caller.id) {
    return json({ ok: false, error: "cannot_remove_self" }, { status: 409 });
  }

  let body: RemoveAccountBody;
  try {
    body = await readOptionalJson<RemoveAccountBody>(request);
  } catch {
    return badRequest("invalid_json");
  }
  const siteId = cleanId(typeof body.siteId === "string" ? body.siteId : "");
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : "";
  if (!adminNote) return badRequest("missing_admin_note");

  const target = await env.DB.prepare(
    "SELECT id, status FROM user_accounts WHERE id = ? LIMIT 1",
  ).bind(targetUserId).first<TargetUserRow>();
  if (!target || target.status === "disabled") return json({ error: "user_not_found", ok: false }, { status: 404 });

  const callerAccess = await loadEffectiveAccess(env, caller);
  const targetAccess = await loadEffectiveAccess(env, {
    id: target.id,
    email: "",
    email_norm: "",
    display_name: "",
    status: target.status as UserAccount["status"],
  });
  const callerCanManageAllUsers = await canManageUsers(env, caller);

  if (!callerCanManageAllUsers) {
    if (!siteId || !await canManageSiteUsers(env, caller, siteId)) {
      await auditAccountRemoval(env, request, caller, "security.denied_access", {
        reason: siteId ? "site_not_manageable" : "site_required",
        targetUserId,
        siteId,
        actorRole: callerAccess.primaryRole,
      });
      return json({ error: "forbidden" }, { status: 403 });
    }
    if (!canRemoveSiteAccount(callerAccess, targetAccess)) {
      await auditAccountRemoval(env, request, caller, "security.denied_access", {
        reason: "target_role_not_allowed",
        targetUserId,
        siteId,
        actorRole: callerAccess.primaryRole,
      });
      return json({ error: "forbidden" }, { status: 403 });
    }
    if (!await targetHasActiveSite(env, targetUserId, siteId)) {
      return json({ error: "user_not_in_site", ok: false }, { status: 404 });
    }
  }

  if (targetAccess.isGlobalAdmin && !await canRemoveGlobalAdminGrant(env, targetUserId)) {
    return json({
      ok: false,
      error: "last_active_local_global_admin",
      message: "At least one active local Global Admin must remain.",
    }, { status: 409 });
  }

  let disabled = false;
  if (siteId) {
    if (!callerCanManageAllUsers && !await canManageSiteUsers(env, caller, siteId)) {
      return json({ error: "forbidden" }, { status: 403 });
    }
    if (!await targetHasActiveSite(env, targetUserId, siteId)) {
      return json({ error: "user_not_in_site", ok: false }, { status: 404 });
    }
    await archiveSiteMembership(env, siteId, targetUserId);
    await clearSiteScopedRelationships(env, siteId, targetUserId);
    disabled = !targetAccess.isGlobalAdmin && (await activeSiteMembershipCount(env, targetUserId)) === 0;
    if (disabled) await disableUserAccount(env, targetUserId);
  } else {
    if (!callerCanManageAllUsers) return json({ error: "forbidden" }, { status: 403 });
    await archiveAllSiteMemberships(env, targetUserId);
    await clearAllRelationships(env, targetUserId);
    await disableUserAccount(env, targetUserId);
    disabled = true;
  }

  await auditAccountRemoval(env, request, caller, "user.removed", {
    targetUserId,
    siteId,
    disabled,
    adminNote,
    actorRole: callerAccess.primaryRole,
    mode: siteId ? "site_membership_archived" : "account_disabled",
  });

  return json({
    ok: true,
    userId: targetUserId,
    siteId,
    disabled,
  });
};

async function readOptionalJson<T>(request: Request): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) return {} as T;
  return readJson<T>(request);
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

async function activeSiteMembershipCount(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE site_users.user_id = ?
      AND site_users.membership_status = 'active'`,
  ).bind(userId).first<{ count: number }>();
  return Number(row?.count || 0);
}

async function archiveSiteMembership(env: Env, siteId: string, userId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE site_users
     SET membership_status = 'archived'
     WHERE site_id = ?
      AND user_id = ?
      AND membership_status = 'active'`,
  ).bind(siteId, userId).run();
}

async function archiveAllSiteMemberships(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE site_users
     SET membership_status = 'archived'
     WHERE user_id = ?
      AND membership_status = 'active'`,
  ).bind(userId).run();
}

async function disableUserAccount(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE user_accounts
     SET status = 'disabled',
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(userId).run();
  await env.DB.prepare(
    `UPDATE sessions
     SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?
      AND revoked_at IS NULL`,
  ).bind(userId).run();
}

async function clearSiteScopedRelationships(env: Env, siteId: string, userId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE mentor_assignments
     SET active = 0
     WHERE active = 1
      AND (
        mentor_user_id = ?
        OR student_user_id = ?
      )
      AND EXISTS (
        SELECT 1 FROM site_users
        WHERE site_users.site_id = ?
         AND site_users.user_id = mentor_assignments.student_user_id
      )`,
  ).bind(userId, userId, siteId).run();
  await env.DB.prepare(
    `UPDATE viewer_student_assignments
     SET active = 0,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE active = 1
      AND (
        viewer_user_id = ?
        OR student_user_id = ?
      )
      AND EXISTS (
        SELECT 1 FROM site_users
        WHERE site_users.site_id = ?
         AND site_users.user_id = viewer_student_assignments.student_user_id
      )`,
  ).bind(userId, userId, siteId).run();
}

async function clearAllRelationships(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE mentor_assignments
     SET active = 0
     WHERE active = 1
      AND (mentor_user_id = ? OR student_user_id = ?)`,
  ).bind(userId, userId).run();
  await env.DB.prepare(
    `UPDATE viewer_student_assignments
     SET active = 0,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE active = 1
      AND (viewer_user_id = ? OR student_user_id = ?)`,
  ).bind(userId, userId).run();
}

async function auditAccountRemoval(
  env: Env,
  request: Request,
  caller: UserAccount,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await writeAudit(env, {
    actorUserId: caller.id,
    action,
    entityType: "user_account",
    entityId: cleanId(String(metadata.targetUserId || "")) || null,
    request,
    metadata,
  });
}

function canRemoveSiteAccount(
  callerAccess: Awaited<ReturnType<typeof loadEffectiveAccess>>,
  targetAccess: Awaited<ReturnType<typeof loadEffectiveAccess>>,
): boolean {
  if (callerAccess.isGlobalAdmin) return true;
  if (targetAccess.isGlobalAdmin) return false;

  const targetRoles = targetAccess.canonicalRoleIds;
  if (callerAccess.canonicalRoleIds.includes("program_teacher")) {
    return hasOnlyAllowedTargetRoles(targetRoles, ["student", "mentor"]);
  }
  if (callerAccess.canonicalRoleIds.includes("site_admin") || callerAccess.canonicalRoleIds.includes("administration")) {
    return hasOnlyAllowedTargetRoles(targetRoles, ["student", "mentor", "viewer", "program_teacher"]);
  }
  return false;
}

function hasOnlyAllowedTargetRoles(targetRoles: string[], allowedRoles: string[]): boolean {
  return targetRoles.length > 0
    && targetRoles.every((roleId) => allowedRoles.includes(roleId));
}

function routeParam(params: Record<string, string | string[]> | undefined, key: string): string {
  const value = params?.[key];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}
