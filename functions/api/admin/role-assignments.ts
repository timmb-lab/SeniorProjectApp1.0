import type { Env, RoleId } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { badRequest, json, readJson, requirePost } from "../../_lib/http.ts";
import {
  canActorCreateRole,
  canRemoveGlobalAdminGrant,
  hasLocalCredential,
  isElevatedRole,
  isGlobalAdminRole,
} from "../../_lib/effective-access.ts";
import { workflowError } from "../../_lib/workflow.ts";

type RoleScopeType = "global" | "site" | "program" | "cohort";

interface RoleAssignmentBody {
  userId?: unknown;
  roleId?: unknown;
  scopeType?: unknown;
  scopeId?: unknown;
  adminNote?: unknown;
}

interface UserExistsRow {
  id: string;
}

interface RoleExistsRow {
  id: string;
}

interface ProgramExistsRow {
  id: string;
}

interface CohortExistsRow {
  id: string;
}

interface RoleAssignmentListRow {
  user_id: string;
  user_name: string | null;
  role_id: RoleId;
  scope_type: string;
  scope_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await canActorCreateRole(env, user, "viewer", [])) return workflowError("forbidden", 403);

  const url = new URL(request.url);
  const userId = cleanId(url.searchParams.get("userId"));
  const roleId = cleanRoleId(url.searchParams.get("roleId"));
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 250);

  const filters: string[] = [];
  const binds: (string | number)[] = [];

  if (userId) {
    filters.push("user_roles.user_id = ?");
    binds.push(userId);
  }
  if (roleId) {
    filters.push("user_roles.role_id = ?");
    binds.push(roleId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = await env.DB.prepare(
    `SELECT
       user_roles.user_id,
       user.display_name AS user_name,
       user_roles.role_id,
       user_roles.scope_type,
       user_roles.scope_id,
       user_roles.assigned_by,
       user_roles.assigned_at
     FROM user_roles
     JOIN user_accounts user ON user.id = user_roles.user_id
     ${whereClause}
     ORDER BY user_roles.assigned_at DESC
     LIMIT ?`,
  ).bind(...binds, limit).all<RoleAssignmentListRow>();

  return json({
    ok: true,
    assignments: (rows.results || []).map((row) => ({
      userId: row.user_id,
      userName: row.user_name,
      roleId: row.role_id,
      scopeType: row.scope_type,
      scopeId: row.scope_id,
      assignedBy: row.assigned_by,
      assignedAt: row.assigned_at,
    })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const caller = await getCurrentUser(request, env);
  if (!caller) return workflowError("unauthorized", 401);
  if (!await canActorCreateRole(env, caller, "viewer", [])) return workflowError("forbidden", 403);

  let body: RoleAssignmentBody;
  try {
    body = await readJson<RoleAssignmentBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const userId = typeof body.userId === "string" ? cleanId(body.userId) : "";
  const roleId = typeof body.roleId === "string" ? cleanRoleId(body.roleId) : null;
  const scopeType = typeof body.scopeType === "string" ? cleanScopeType(body.scopeType) : null;
  const scopeId = typeof body.scopeId === "string" ? cleanScopeId(body.scopeId) : "";
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : "";

  if (!userId || !roleId || !scopeType) return badRequest("missing_fields");

  if (!isValidScope(roleId, scopeType, scopeId)) {
    return badRequest("invalid_role_scope");
  }

  if (isElevatedRole(roleId) && !adminNote) return badRequest("missing_admin_note");

  if (!await canActorCreateRole(env, caller, roleId, scopeType === "site" ? [scopeId] : [])) {
    await writeAudit(env, {
      actorUserId: caller.id,
      action: "access.scope_validation_rejected",
      entityType: "role_assignment",
      entityId: `${userId}:${roleId}:${scopeType}:${scopeId || "global"}`,
      request,
      metadata: {
        result: "rejected",
        reason: "assignment_outside_actor_scope",
        userId,
        roleId,
        scopeType,
        scopeId,
      },
    });
    return workflowError("forbidden", 403);
  }

  const userExists = await env.DB.prepare(
    "SELECT id FROM user_accounts WHERE id = ? AND status = 'active' LIMIT 1",
  ).bind(userId).first<UserExistsRow>();
  if (!userExists) return workflowError("user_not_found", 404);

  const roleExists = await env.DB.prepare(
    "SELECT id FROM roles WHERE id = ? LIMIT 1",
  ).bind(roleId).first<RoleExistsRow>();
  if (!roleExists) return workflowError("role_not_found", 404);

  if (roleId === "program_teacher" && scopeType !== "global") {
    if (scopeType === "program") {
      const program = await env.DB.prepare("SELECT id FROM programs WHERE id = ? LIMIT 1")
        .bind(scopeId)
        .first<ProgramExistsRow>();
      if (!program) return workflowError("program_not_found", 404);
    } else if (scopeType === "cohort") {
      const cohort = await env.DB.prepare("SELECT id FROM cohorts WHERE id = ? LIMIT 1")
        .bind(scopeId)
        .first<CohortExistsRow>();
      if (!cohort) return workflowError("cohort_not_found", 404);
    }
  }

  if (roleId === "site_admin" || roleId === "administration") {
    const site = await env.DB.prepare("SELECT id FROM sites WHERE id = ? AND status = 'active' LIMIT 1")
      .bind(scopeId)
      .first<{ id: string }>();
    if (!site) return workflowError("site_not_found", 404);
  }

  if (isGlobalAdminRole(roleId) && !await hasLocalCredential(env, userId)) {
    await writeAudit(env, {
      actorUserId: caller.id,
      action: "access.scope_validation_rejected",
      entityType: "role_assignment",
      entityId: `${userId}:${roleId}:global`,
      request,
      metadata: {
        result: "rejected",
        reason: "global_admin_requires_local_account",
        userId,
        roleId,
      },
    });
    return json({
      ok: false,
      error: "global_admin_requires_local_account",
      message: "Global Admin must use a local login so platform access is still available if SSO is unavailable.",
    }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    `SELECT 1
     FROM user_roles
     WHERE user_id = ?
       AND role_id = ?
       AND scope_type = ?
       AND scope_id = ?
     LIMIT 1`,
  ).bind(userId, roleId, scopeType, scopeId).first();

  const created = !existing;
  if (created) {
    await env.DB.prepare(
      `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(userId, roleId, scopeType, scopeId, caller.id).run();
  }

  await writeAudit(env, {
    actorUserId: caller.id,
    action: created ? "user.role_changed" : "user.role_change_duplicate",
    entityType: "role_assignment",
    entityId: `${userId}:${roleId}:${scopeType}:${scopeId || "global"}`,
    request,
    metadata: {
      userId,
      roleId,
      scopeType,
      scopeId,
      adminNote,
    },
  });

  if (scopeType === "site" && (roleId === "site_admin" || roleId === "administration")) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO site_users (site_id, user_id, membership_status)
       VALUES (?, ?, 'active')`,
    ).bind(scopeId, userId).run();
  }

  return json({
    ok: true,
    created,
    assignment: {
      userId,
      roleId,
      scopeType,
      scopeId,
    },
  });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const caller = await getCurrentUser(request, env);
  if (!caller) return workflowError("unauthorized", 401);
  if (!await canActorCreateRole(env, caller, "viewer", [])) return workflowError("forbidden", 403);

  let body: RoleAssignmentBody;
  try {
    body = await readJson<RoleAssignmentBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const userId = typeof body.userId === "string" ? cleanId(body.userId) : "";
  const roleId = typeof body.roleId === "string" ? cleanRoleId(body.roleId) : null;
  const scopeType = typeof body.scopeType === "string" ? cleanScopeType(body.scopeType) : null;
  const scopeId = typeof body.scopeId === "string" ? cleanScopeId(body.scopeId) : "";

  if (!userId || !roleId || !scopeType) return badRequest("missing_fields");
  if (!isValidScope(roleId, scopeType, scopeId)) return badRequest("invalid_role_scope");

  if (!await canActorCreateRole(env, caller, roleId, scopeType === "site" ? [scopeId] : [])) {
    return workflowError("forbidden", 403);
  }

  if (isGlobalAdminRole(roleId) && !await canRemoveGlobalAdminGrant(env, userId)) {
    return json({
      ok: false,
      error: "last_active_local_global_admin",
      message: "At least one active local Global Admin must remain.",
    }, { status: 409 });
  }

  const existing = await env.DB.prepare(
    `SELECT 1
     FROM user_roles
     WHERE user_id = ?
       AND role_id = ?
       AND scope_type = ?
       AND scope_id = ?
     LIMIT 1`,
  ).bind(userId, roleId, scopeType, scopeId).first();

  if (!existing) return workflowError("assignment_not_found", 404);

  await env.DB.prepare(
    `DELETE FROM user_roles
     WHERE user_id = ?
       AND role_id = ?
       AND scope_type = ?
       AND scope_id = ?`,
  ).bind(userId, roleId, scopeType, scopeId).run();

  await writeAudit(env, {
    actorUserId: caller.id,
    action: "user.role_changed",
    entityType: "role_assignment",
    entityId: `${userId}:${roleId}:${scopeType}:${scopeId || "global"}`,
    request,
    metadata: {
      userId,
      roleId,
      scopeType,
      scopeId,
      removed: true,
    },
  });

  return json({
    ok: true,
    assignment: {
      userId,
      roleId,
      scopeType,
      scopeId,
    },
  });
};

function isValidScope(roleId: RoleId, scopeType: RoleScopeType, scopeId: string): boolean {
  if (roleId === "global_admin" || roleId === "admin" || roleId === "platform_admin") {
    return scopeType === "global" && scopeId === "";
  }
  if (roleId === "site_admin" || roleId === "administration") {
    return scopeType === "site" && scopeId !== "";
  }
  if (roleId !== "program_teacher") {
    return scopeType === "global" && scopeId === "";
  }
  if (scopeType === "global") return false;
  return scopeId !== "";
}

function cleanId(value: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : "";
}

function cleanRoleId(value: string | null): RoleId | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "admin" || trimmed === "platform_admin") return "global_admin";
  return [
    "student",
    "mentor",
    "viewer",
    "program_teacher",
    "administration",
    "site_admin",
    "platform_admin",
    "admin",
    "global_admin",
  ].includes(trimmed) ? (trimmed as RoleId) : null;
}

function cleanScopeType(value: string | null): RoleScopeType | null {
  if (!value) return null;
  const trimmed = value.trim();
  return ["global", "site", "program", "cohort"].includes(trimmed) ? (trimmed as RoleScopeType) : null;
}

function cleanScopeId(value: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed && /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : "";
}
