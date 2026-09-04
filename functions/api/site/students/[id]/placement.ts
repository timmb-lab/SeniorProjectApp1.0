import type { Env, UserAccount } from "../../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../../_lib/auth.ts";
import { loadEffectiveAccess } from "../../../../_lib/effective-access.ts";
import { badRequest, json, readJson, requirePost } from "../../../../_lib/http.ts";
import { canManageSiteUsers } from "../../../../_lib/permissions.ts";
import { randomId } from "../../../../_lib/crypto.ts";
import { cleanId } from "../../../../_lib/site-scope.ts";

interface PlacementBody {
  siteId?: unknown;
  programId?: unknown;
  mentorUserId?: unknown;
  viewerUserId?: unknown;
  status?: unknown;
  adminNote?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;
  const actor = await getCurrentUser(request, env);
  if (!actor) return json({ error: "unauthorized" }, { status: 401 });
  const access = await loadEffectiveAccess(env, actor);
  if (!access.isGlobalAdmin && !access.canonicalRoleIds.some((role) => role === "site_admin" || role === "administration")) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  let body: PlacementBody;
  try { body = await readJson<PlacementBody>(request); } catch { return badRequest("invalid_json"); }
  const studentId = cleanId(routeParam(params as Record<string, string | string[]> | undefined, "id"));
  const siteId = cleanId(typeof body.siteId === "string" ? body.siteId : "");
  const programId = cleanId(typeof body.programId === "string" ? body.programId : "");
  const mentorUserId = cleanId(typeof body.mentorUserId === "string" ? body.mentorUserId : "");
  const viewerUserId = cleanId(typeof body.viewerUserId === "string" ? body.viewerUserId : "");
  const status = String(body.status || "active").trim() === "inactive" ? "inactive" : "active";
  const adminNote = String(body.adminNote || "").trim().slice(0, 500);
  if (!studentId || !siteId || !programId || !adminNote) return badRequest("missing_fields");
  if (!await canManageSiteUsers(env, actor, siteId)) return json({ error: "forbidden" }, { status: 403 });
  if (!await activeSiteStudent(env, siteId, studentId)) return json({ error: "student_not_found" }, { status: 404 });
  if (!await activeSiteProgram(env, siteId, programId)) return json({ error: "program_not_found" }, { status: 404 });
  if (mentorUserId && !await activeSiteRole(env, siteId, mentorUserId, "mentor")) return json({ error: "mentor_not_found" }, { status: 404 });
  if (viewerUserId && !await activeSiteRole(env, siteId, viewerUserId, "viewer")) return json({ error: "viewer_not_found" }, { status: 404 });

  const groupId = await ensureProgramGroup(env, programId);
  await env.DB.prepare(
    `DELETE FROM group_memberships
     WHERE user_id = ? AND group_id IN (
       SELECT id FROM groups WHERE group_type = 'program' AND program_id IS NOT NULL
     )`,
  ).bind(studentId).run();
  await env.DB.prepare(
    `INSERT INTO group_memberships (group_id, user_id, membership_role)
     VALUES (?, ?, 'member')
     ON CONFLICT(group_id, user_id) DO UPDATE SET membership_role = 'member'`,
  ).bind(groupId, studentId).run();
  await env.DB.prepare(
    `UPDATE projects SET program_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE site_id = ? AND id IN (SELECT project_id FROM project_members WHERE student_user_id = ? AND active = 1)`,
  ).bind(programId, siteId, studentId).run();

  await replaceStudentAssignment(env, "mentor", studentId, mentorUserId, actor.id);
  await replaceStudentAssignment(env, "viewer", studentId, viewerUserId, actor.id);
  await env.DB.prepare(
    `UPDATE user_accounts SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
  ).bind(status === "active" ? "active" : "disabled", studentId).run();
  await env.DB.prepare(
    `UPDATE site_users SET membership_status = ? WHERE site_id = ? AND user_id = ?`,
  ).bind(status === "active" ? "active" : "suspended", siteId, studentId).run();
  if (status === "inactive") {
    await env.DB.prepare("UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ? AND revoked_at IS NULL")
      .bind(studentId).run();
  }

  await writeAudit(env, {
    actorUserId: actor.id,
    action: "student.placement_updated",
    entityType: "user_account",
    entityId: studentId,
    request,
    metadata: { siteId, programId, mentorAssigned: Boolean(mentorUserId), viewerAssigned: Boolean(viewerUserId), status, adminNote },
  });
  return json({ ok: true, studentId, siteId, programId, mentorUserId, viewerUserId, status });
};

async function activeSiteStudent(env: Env, siteId: string, studentId: string) {
  return Boolean(await env.DB.prepare(
    `SELECT 1 FROM site_users JOIN user_roles ON user_roles.user_id = site_users.user_id
     WHERE site_users.site_id = ? AND site_users.user_id = ? AND site_users.membership_status IN ('active','suspended')
       AND user_roles.role_id = 'student' LIMIT 1`,
  ).bind(siteId, studentId).first());
}

async function activeSiteProgram(env: Env, siteId: string, programId: string) {
  return Boolean(await env.DB.prepare(
    `SELECT 1 FROM site_programs JOIN programs ON programs.id = site_programs.program_id
     WHERE site_programs.site_id = ? AND site_programs.program_id = ? AND site_programs.active = 1 AND programs.active = 1 LIMIT 1`,
  ).bind(siteId, programId).first());
}

async function activeSiteRole(env: Env, siteId: string, userId: string, roleId: string) {
  return Boolean(await env.DB.prepare(
    `SELECT 1 FROM site_users JOIN user_accounts ON user_accounts.id = site_users.user_id
     JOIN user_roles ON user_roles.user_id = site_users.user_id AND user_roles.role_id = ?
     WHERE site_users.site_id = ? AND site_users.user_id = ? AND site_users.membership_status = 'active'
       AND user_accounts.status IN ('active','pending_reset') LIMIT 1`,
  ).bind(roleId, siteId, userId).first());
}

async function ensureProgramGroup(env: Env, programId: string): Promise<string> {
  const existing = await env.DB.prepare("SELECT id FROM groups WHERE group_type = 'program' AND program_id = ? ORDER BY created_at LIMIT 1")
    .bind(programId).first<{ id: string }>();
  if (existing?.id) return existing.id;
  const groupId = `group-program-${programId}`;
  const program = await env.DB.prepare("SELECT name FROM programs WHERE id = ?").bind(programId).first<{ name: string }>();
  await env.DB.prepare("INSERT INTO groups (id, name, group_type, program_id) VALUES (?, ?, 'program', ?)")
    .bind(groupId, `${program?.name || programId} Students`, programId).run();
  return groupId;
}

async function replaceStudentAssignment(env: Env, kind: "mentor" | "viewer", studentId: string, assigneeId: string, actorId: string) {
  const table = kind === "mentor" ? "mentor_assignments" : "viewer_student_assignments";
  const column = kind === "mentor" ? "mentor_user_id" : "viewer_user_id";
  await env.DB.prepare(`UPDATE ${table} SET active = 0 WHERE student_user_id = ? AND active = 1`).bind(studentId).run();
  if (!assigneeId) return;
  const updatedAt = kind === "viewer" ? ", updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')" : "";
  await env.DB.prepare(
    `INSERT INTO ${table} (id, ${column}, student_user_id, assigned_by, active)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(${column}, student_user_id) DO UPDATE SET active = 1, assigned_by = excluded.assigned_by${updatedAt}`,
  ).bind(randomId(`${kind}_student_assignment`), assigneeId, studentId, actorId).run();
}

function routeParam(params: Record<string, string | string[]> | undefined, key: string): string {
  const value = params?.[key];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}
