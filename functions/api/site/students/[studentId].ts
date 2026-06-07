import type { Env } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { badRequest, json, readJson } from "../../../_lib/http.ts";
import { canManageSiteUsers } from "../../../_lib/permissions.ts";
import { cleanId } from "../../../_lib/site-scope.ts";
import { handleSiteStudentDetailRequest } from "../../../_lib/site-student-detail.ts";

interface RemoveStudentBody {
  siteId?: unknown;
  adminNote?: unknown;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  return handleSiteStudentDetailRequest({
    request,
    env,
    params: params as Record<string, string | string[]> | undefined,
  });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const caller = await getCurrentUser(request, env);
  if (!caller) return json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const studentId = cleanId(routeParam(params as Record<string, string | string[]> | undefined, "studentId"));
  let body: RemoveStudentBody;
  try {
    body = await readOptionalJson<RemoveStudentBody>(request);
  } catch {
    return badRequest("invalid_json");
  }
  const siteId = cleanId(typeof body.siteId === "string" ? body.siteId : url.searchParams.get("siteId"));
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : "";

  if (!studentId || !siteId) return badRequest("missing_fields");
  if (!adminNote) return badRequest("missing_admin_note");
  if (!await canManageSiteUsers(env, caller, siteId)) {
    await auditStudentRemoval(env, request, caller, "site_student_remove_denied", {
      reason: "site_not_manageable",
      siteId,
      studentId,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (!await activeSiteStudent(env, siteId, studentId)) {
    return json({ error: "student_not_found", ok: false }, { status: 404 });
  }

  await archiveStudentSiteMembership(env, siteId, studentId);
  await clearStudentAssignments(env, siteId, studentId);
  const disabled = (await activeSiteMembershipCount(env, studentId)) === 0;
  if (disabled) await disableStudentAccount(env, studentId);

  await auditStudentRemoval(env, request, caller, "site_student_removed", {
    siteId,
    studentId,
    disabled,
    adminNote,
    mode: "site_membership_archived",
  });

  return json({
    ok: true,
    studentId,
    siteId,
    disabled,
  });
};

async function readOptionalJson<T>(request: Request): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) return {} as T;
  return readJson<T>(request);
}

async function activeSiteStudent(env: Env, siteId: string, studentId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_users
     JOIN user_accounts ON user_accounts.id = site_users.user_id
      AND user_accounts.status IN ('active', 'pending_reset')
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     WHERE site_users.site_id = ?
      AND site_users.user_id = ?
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(siteId, studentId).first();
  return Boolean(row);
}

async function archiveStudentSiteMembership(env: Env, siteId: string, studentId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE site_users
     SET membership_status = 'archived'
     WHERE site_id = ?
      AND user_id = ?
      AND membership_status = 'active'`,
  ).bind(siteId, studentId).run();
}

async function clearStudentAssignments(env: Env, siteId: string, studentId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE mentor_assignments
     SET active = 0
     WHERE active = 1
      AND student_user_id = ?
      AND EXISTS (
        SELECT 1 FROM site_users
        WHERE site_users.site_id = ?
         AND site_users.user_id = mentor_assignments.student_user_id
      )`,
  ).bind(studentId, siteId).run();
  await env.DB.prepare(
    `UPDATE viewer_student_assignments
     SET active = 0,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE active = 1
      AND student_user_id = ?
      AND EXISTS (
        SELECT 1 FROM site_users
        WHERE site_users.site_id = ?
         AND site_users.user_id = viewer_student_assignments.student_user_id
      )`,
  ).bind(studentId, siteId).run();
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

async function disableStudentAccount(env: Env, studentId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE user_accounts
     SET status = 'disabled',
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(studentId).run();
  await env.DB.prepare(
    `UPDATE sessions
     SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?
      AND revoked_at IS NULL`,
  ).bind(studentId).run();
}

async function auditStudentRemoval(
  env: Env,
  request: Request,
  caller: { id: string },
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await writeAudit(env, {
    actorUserId: caller.id,
    action,
    entityType: "site_student",
    entityId: cleanId(String(metadata.studentId || "")) || null,
    request,
    metadata,
  });
}

function routeParam(params: Record<string, string | string[]> | undefined, key: string): string {
  const value = params?.[key];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}
