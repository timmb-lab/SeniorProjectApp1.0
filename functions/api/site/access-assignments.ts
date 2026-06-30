import type { Env, RoleId, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { randomId } from "../../_lib/crypto.ts";
import {
  canActorCreateRole,
  loadEffectiveAccess,
} from "../../_lib/effective-access.ts";
import { badRequest, json, readJson, requirePost } from "../../_lib/http.ts";
import { canManageSiteUsers } from "../../_lib/permissions.ts";
import {
  cleanId,
  resolveSiteSelection,
  type SiteScopeContext,
} from "../../_lib/site-scope.ts";

type AssignmentType =
  | "mentor_student"
  | "viewer_student"
  | "program_teacher_program"
  | "administration_site"
  | "site_admin_site";

interface AssignmentBody {
  assignmentType?: unknown;
  action?: unknown;
  siteId?: unknown;
  targetUserId?: unknown;
  studentId?: unknown;
  programId?: unknown;
  adminNote?: unknown;
}

interface AccessAssignmentAuditRow {
  id: string;
  action: string;
  metadata_json: string | null;
  created_at: string;
  actor_name: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const context = await siteContext(env, user);
  if (!context.roleIds.some((roleId) => ["global_admin", "admin", "platform_admin", "site_admin", "administration", "program_teacher"].includes(roleId))) {
    await auditAccessAssignments(env, request, user, context, "security.denied_access", {
      reason: "role_not_allowed_for_site_access_assignments",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const requestedSiteId = cleanId(url.searchParams.get("siteId"));
  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canManageSiteUsers(env, user, siteId),
    defaultSiteRoleIds: ["global_admin", "admin", "platform_admin", "administration", "program_teacher"],
  });

  if (selection.kind === "denied") {
    await auditAccessAssignments(env, request, user, context, "security.denied_access", {
      reason: selection.reason,
      requestedSiteId,
    });
    return json({ error: "forbidden", reason: selection.reason, accessibleSites: selection.accessibleSites }, { status: 403 });
  }
  if (selection.kind === "selectionRequired") {
    return json({
      ok: false,
      error: "site_selection_required",
      selectionRequired: true,
      accessibleSites: selection.accessibleSites,
    }, { status: 409 });
  }

  const siteId = selection.site.id;
  const [
    students,
    mentors,
    viewers,
    programTeachers,
    administrationUsers,
    siteAdmins,
    programs,
    mentorAssignments,
    viewerAssignments,
    programTeacherAssignments,
    administrationAssignments,
    siteAdminAssignments,
    history,
  ] = await Promise.all([
    loadSiteUsersByRole(env, siteId, "student"),
    loadSiteUsersByRole(env, siteId, "mentor"),
    loadSiteUsersByRole(env, siteId, "viewer"),
    loadSiteUsersByRole(env, siteId, "program_teacher"),
    loadSiteUsersByRole(env, siteId, "administration"),
    loadSiteUsersByRole(env, siteId, "site_admin"),
    loadPrograms(env, siteId),
    loadMentorAssignments(env, siteId),
    loadViewerAssignments(env, siteId),
    loadProgramTeacherAssignments(env, siteId),
    loadSiteRoleAssignments(env, siteId, "administration"),
    loadSiteRoleAssignments(env, siteId, "site_admin"),
    loadRecentAccessAssignmentHistory(env, siteId),
  ]);

  const actorAccess = await loadEffectiveAccess(env, user);

  await auditAccessAssignments(env, request, user, context, "site_access_assignments_viewed", {
    siteId,
  });

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    scope: {
      tenantId: selection.site.tenant_id,
      tenantName: selection.site.tenant_name,
      siteId,
      siteName: selection.site.name,
      schoolYear: selection.site.school_year || "",
      role: context.primaryRole,
      accessibleSites: selection.accessibleSites,
    },
    users: {
      students,
      mentors,
      viewers,
      programTeachers,
      administration: administrationUsers,
      siteAdmins,
    },
    programs,
    assignments: {
      mentorStudent: mentorAssignments,
      viewerStudent: viewerAssignments,
      programTeacherProgram: programTeacherAssignments,
      administrationSite: administrationAssignments,
      siteAdminSite: siteAdminAssignments,
    },
    history,
    permissions: {
      canAssignMentors: canManageAccessAssignmentType(actorAccess, "mentor_student"),
      canAssignViewers: canManageAccessAssignmentType(actorAccess, "viewer_student"),
      canAssignProgramTeachers: canManageAccessAssignmentType(actorAccess, "program_teacher_program"),
      canAssignAdministration: canManageAccessAssignmentType(actorAccess, "administration_site"),
      canAssignSiteAdmins: canManageAccessAssignmentType(actorAccess, "site_admin_site"),
      canCreateGlobalAdmin: actorAccess.isGlobalAdmin,
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const context = await siteContext(env, user);

  let body: AssignmentBody;
  try {
    body = await readJson<AssignmentBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const assignmentType = cleanAssignmentType(body.assignmentType);
  const action = cleanAction(body.action);
  const requestedSiteId = cleanId(typeof body.siteId === "string" ? body.siteId : null);
  const targetUserId = cleanId(typeof body.targetUserId === "string" ? body.targetUserId : null);
  const studentId = cleanId(typeof body.studentId === "string" ? body.studentId : null);
  const programId = cleanId(typeof body.programId === "string" ? body.programId : null);
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : "";

  if (!assignmentType || !action || !requestedSiteId || !targetUserId) return badRequest("missing_fields");
  if (!adminNote) return badRequest("missing_admin_note");
  if (!await canManageSiteUsers(env, user, requestedSiteId)) {
    await auditAccessAssignments(env, request, user, context, "security.denied_access", {
      reason: "site_not_manageable",
      requestedSiteId,
      assignmentType,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }
  const actorAccess = await loadEffectiveAccess(env, user);
  if (!canManageAccessAssignmentType(actorAccess, assignmentType)) {
    await auditAccessAssignments(env, request, user, context, "security.denied_access", {
      reason: "assignment_type_not_allowed",
      requestedSiteId,
      assignmentType,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (assignmentType === "site_admin_site") {
    if (!await canActorCreateRole(env, user, "site_admin", [requestedSiteId])) {
      return json({ error: "forbidden", message: "Only a Global Admin can assign Site Admin access." }, { status: 403 });
    }
  }

  const targetRole = roleForAssignmentType(assignmentType);
  if (!await activeUserHasRole(env, targetUserId, targetRole)) {
    return json({ error: "target_role_not_found", ok: false }, { status: 404 });
  }

  if (assignmentType === "mentor_student" || assignmentType === "viewer_student") {
    if (!studentId || !await activeSiteStudent(env, requestedSiteId, studentId)) {
      return json({ error: "student_not_found", ok: false }, { status: 404 });
    }
  }
  if (assignmentType === "program_teacher_program") {
    if (!programId || !await activeSiteProgram(env, requestedSiteId, programId)) {
      return json({ error: "program_not_found", ok: false }, { status: 404 });
    }
  }

  if (assignmentType === "mentor_student") {
    await upsertMentorAssignment(env, targetUserId, studentId, user.id, action);
  } else if (assignmentType === "viewer_student") {
    await upsertViewerAssignment(env, targetUserId, studentId, user.id, action);
  } else if (assignmentType === "program_teacher_program") {
    await upsertRoleAssignment(env, targetUserId, "program_teacher", "program", programId, user.id, action);
    await ensureSiteMembership(env, requestedSiteId, targetUserId);
  } else if (assignmentType === "administration_site") {
    await upsertRoleAssignment(env, targetUserId, "administration", "site", requestedSiteId, user.id, action);
    await ensureSiteMembership(env, requestedSiteId, targetUserId);
  } else if (assignmentType === "site_admin_site") {
    await upsertRoleAssignment(env, targetUserId, "site_admin", "site", requestedSiteId, user.id, action);
    await ensureSiteMembership(env, requestedSiteId, targetUserId);
  }

  await auditAccessAssignments(env, request, user, context, auditActionFor(assignmentType, action), {
    assignmentType,
    siteId: requestedSiteId,
    targetUserId,
    studentId,
    programId,
    adminNote,
    result: "success",
  });

  return json({
    ok: true,
    assignmentType,
    action,
    siteId: requestedSiteId,
    targetUserId,
    studentId,
    programId,
  });
};

async function siteContext(env: Env, user: UserAccount): Promise<SiteScopeContext> {
  const access = await loadEffectiveAccess(env, user);
  return {
    roles: access.roles,
    roleIds: access.roleIds,
    primaryRole: access.primaryRole,
  };
}

async function loadSiteUsersByRole(env: Env, siteId: string, roleId: RoleId) {
  if (roleId === "student") {
    const rows = await env.DB.prepare(
      `SELECT DISTINCT
         user_accounts.id,
         user_accounts.display_name,
         user_accounts.email,
         COALESCE(student_roster_profiles.cohort, '') AS cohort,
         COALESCE(student_roster_profiles.graduation_year, '') AS graduation_year,
         (
           SELECT mentor_assignments.mentor_user_id
           FROM mentor_assignments
           WHERE mentor_assignments.student_user_id = user_accounts.id
            AND mentor_assignments.active = 1
           ORDER BY mentor_assignments.created_at DESC
           LIMIT 1
         ) AS mentor_user_id,
         (
           SELECT mentor.display_name
           FROM mentor_assignments
           JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
           WHERE mentor_assignments.student_user_id = user_accounts.id
            AND mentor_assignments.active = 1
           ORDER BY mentor_assignments.created_at DESC
           LIMIT 1
         ) AS mentor_name,
         (
           SELECT viewer_student_assignments.viewer_user_id
           FROM viewer_student_assignments
           WHERE viewer_student_assignments.student_user_id = user_accounts.id
            AND viewer_student_assignments.active = 1
           ORDER BY viewer_student_assignments.created_at DESC
           LIMIT 1
         ) AS viewer_user_id,
         (
           SELECT viewer.display_name
           FROM viewer_student_assignments
           JOIN user_accounts viewer ON viewer.id = viewer_student_assignments.viewer_user_id
           WHERE viewer_student_assignments.student_user_id = user_accounts.id
            AND viewer_student_assignments.active = 1
           ORDER BY viewer_student_assignments.created_at DESC
           LIMIT 1
         ) AS viewer_name
       FROM site_users
       JOIN user_accounts ON user_accounts.id = site_users.user_id
        AND user_accounts.status IN ('active', 'pending_reset')
       JOIN user_roles ON user_roles.user_id = user_accounts.id
        AND user_roles.role_id = 'student'
       LEFT JOIN student_roster_profiles ON student_roster_profiles.student_user_id = user_accounts.id
       WHERE site_users.site_id = ?
        AND site_users.membership_status = 'active'
       ORDER BY user_accounts.display_name ASC
       LIMIT 200`,
    ).bind(siteId).all<{
      id: string;
      display_name: string;
      email: string;
      cohort: string | null;
      graduation_year: string | null;
      mentor_user_id: string | null;
      mentor_name: string | null;
      viewer_user_id: string | null;
      viewer_name: string | null;
    }>();
    return (rows.results || []).map(studentUserOption);
  }

  const rows = await env.DB.prepare(
    `SELECT DISTINCT user_accounts.id, user_accounts.display_name, user_accounts.email
     FROM site_users
     JOIN user_accounts ON user_accounts.id = site_users.user_id
      AND user_accounts.status IN ('active', 'pending_reset')
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = ?
     WHERE site_users.site_id = ?
      AND site_users.membership_status = 'active'
     ORDER BY user_accounts.display_name ASC
     LIMIT 200`,
  ).bind(roleId, siteId).all<{ id: string; display_name: string; email: string }>();
  return (rows.results || []).map(userOption);
}

async function loadPrograms(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT programs.id, programs.name
     FROM site_programs
     JOIN programs ON programs.id = site_programs.program_id
      AND programs.active = 1
     WHERE site_programs.site_id = ?
      AND site_programs.active = 1
     ORDER BY programs.name ASC`,
  ).bind(siteId).all<{ id: string; name: string }>();
  return (rows.results || []).map((row) => ({ programId: row.id, programName: row.name }));
}

async function loadMentorAssignments(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT mentor_assignments.id, mentor_assignments.mentor_user_id, mentor_assignments.student_user_id
     FROM mentor_assignments
     JOIN site_users ON site_users.user_id = mentor_assignments.student_user_id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE mentor_assignments.active = 1
     ORDER BY mentor_assignments.created_at DESC`,
  ).bind(siteId).all<{ id: string; mentor_user_id: string; student_user_id: string }>();
  return (rows.results || []).map((row) => ({
    assignmentId: row.id,
    mentorUserId: row.mentor_user_id,
    studentId: row.student_user_id,
  }));
}

async function loadViewerAssignments(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT viewer_student_assignments.id, viewer_student_assignments.viewer_user_id, viewer_student_assignments.student_user_id
     FROM viewer_student_assignments
     JOIN site_users ON site_users.user_id = viewer_student_assignments.student_user_id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE viewer_student_assignments.active = 1
     ORDER BY viewer_student_assignments.created_at DESC`,
  ).bind(siteId).all<{ id: string; viewer_user_id: string; student_user_id: string }>();
  return (rows.results || []).map((row) => ({
    assignmentId: row.id,
    viewerUserId: row.viewer_user_id,
    studentId: row.student_user_id,
  }));
}

async function loadProgramTeacherAssignments(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT user_roles.user_id, user_roles.scope_id AS program_id
     FROM user_roles
     JOIN site_programs ON site_programs.program_id = user_roles.scope_id
      AND site_programs.site_id = ?
      AND site_programs.active = 1
     WHERE user_roles.role_id = 'program_teacher'
      AND user_roles.scope_type = 'program'
     ORDER BY user_roles.user_id ASC`,
  ).bind(siteId).all<{ user_id: string; program_id: string }>();
  return (rows.results || []).map((row) => ({
    programTeacherUserId: row.user_id,
    programId: row.program_id,
  }));
}

async function loadSiteRoleAssignments(env: Env, siteId: string, roleId: RoleId) {
  const rows = await env.DB.prepare(
    `SELECT user_id
     FROM user_roles
     WHERE role_id = ?
      AND scope_type = 'site'
      AND scope_id = ?
     ORDER BY user_id ASC`,
  ).bind(roleId, siteId).all<{ user_id: string }>();
  return (rows.results || []).map((row) => ({ userId: row.user_id, siteId }));
}

async function loadRecentAccessAssignmentHistory(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT
       audit_events.id,
       audit_events.action,
       audit_events.metadata_json,
       audit_events.created_at,
       actor.display_name AS actor_name
     FROM audit_events
     LEFT JOIN user_accounts actor ON actor.id = audit_events.actor_user_id
     WHERE audit_events.entity_type = 'site_access_assignment'
       AND audit_events.entity_id = ?
       AND audit_events.action GLOB 'access.*'
     ORDER BY audit_events.created_at DESC
     LIMIT 12`,
  ).bind(siteId).all<AccessAssignmentAuditRow>();
  return (rows.results || [])
    .map((row) => accessAssignmentHistoryRow(row, siteId))
    .filter(Boolean);
}

function accessAssignmentHistoryRow(row: AccessAssignmentAuditRow, siteId: string) {
  let metadata: Record<string, unknown> = {};
  if (row.metadata_json) {
    try {
      metadata = JSON.parse(row.metadata_json) as Record<string, unknown>;
    } catch {
      metadata = {};
    }
  }
  const assignmentType = cleanAssignmentType(metadata.assignmentType);
  if (!assignmentType) return null;
  const action = cleanAction(metadata.action)
    || (row.action.endsWith("_removed") ? "remove" : row.action.endsWith("_assigned") ? "assign" : "");
  if (!action) return null;
  return {
    historyId: row.id,
    assignmentType,
    action,
    actorName: row.actor_name || "",
    targetUserId: cleanId(String(metadata.targetUserId || "")) || "",
    studentId: cleanId(String(metadata.studentId || "")) || "",
    programId: cleanId(String(metadata.programId || "")) || "",
    siteId,
    createdAt: row.created_at,
  };
}

async function activeUserHasRole(env: Env, userId: string, roleId: RoleId): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = ?
     WHERE user_accounts.id = ?
      AND user_accounts.status IN ('active', 'pending_reset')
     LIMIT 1`,
  ).bind(roleId, userId).first();
  return Boolean(row);
}

async function activeSiteStudent(env: Env, siteId: string, studentId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_users
     JOIN user_accounts ON user_accounts.id = site_users.user_id
      AND user_accounts.status = 'active'
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     WHERE site_users.site_id = ?
      AND site_users.user_id = ?
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(siteId, studentId).first();
  return Boolean(row);
}

async function activeSiteProgram(env: Env, siteId: string, programId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_programs
     JOIN programs ON programs.id = site_programs.program_id
      AND programs.active = 1
     WHERE site_programs.site_id = ?
      AND site_programs.program_id = ?
      AND site_programs.active = 1
     LIMIT 1`,
  ).bind(siteId, programId).first();
  return Boolean(row);
}

async function upsertMentorAssignment(env: Env, mentorId: string, studentId: string, actorId: string, action: string): Promise<void> {
  if (action === "remove") {
    await env.DB.prepare(
      "UPDATE mentor_assignments SET active = 0, assigned_by = ? WHERE mentor_user_id = ? AND student_user_id = ?",
    ).bind(actorId, mentorId, studentId).run();
    return;
  }
  await env.DB.prepare(
    `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(mentor_user_id, student_user_id) DO UPDATE SET active = 1, assigned_by = excluded.assigned_by`,
  ).bind(randomId("mentor_student_assignment"), mentorId, studentId, actorId).run();
}

async function upsertViewerAssignment(env: Env, viewerId: string, studentId: string, actorId: string, action: string): Promise<void> {
  if (action === "remove") {
    await env.DB.prepare(
      "UPDATE viewer_student_assignments SET active = 0, assigned_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE viewer_user_id = ? AND student_user_id = ?",
    ).bind(actorId, viewerId, studentId).run();
    return;
  }
  await env.DB.prepare(
    `INSERT INTO viewer_student_assignments (id, viewer_user_id, student_user_id, assigned_by, active)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(viewer_user_id, student_user_id) DO UPDATE SET active = 1, assigned_by = excluded.assigned_by, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(randomId("viewer_student_assignment"), viewerId, studentId, actorId).run();
}

async function upsertRoleAssignment(
  env: Env,
  userId: string,
  roleId: RoleId,
  scopeType: string,
  scopeId: string,
  actorId: string,
  action: string,
): Promise<void> {
  if (action === "remove") {
    await env.DB.prepare(
      "DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND scope_type = ? AND scope_id = ?",
    ).bind(userId, roleId, scopeType, scopeId).run();
    return;
  }
  await env.DB.prepare(
    `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(userId, roleId, scopeType, scopeId, actorId).run();
}

async function ensureSiteMembership(env: Env, siteId: string, userId: string): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO site_users (site_id, user_id, membership_status)
     VALUES (?, ?, 'active')`,
  ).bind(siteId, userId).run();
}

function userOption(row: { id: string; display_name: string; email: string }) {
  return {
    userId: row.id,
    displayName: row.display_name,
    email: row.email,
  };
}

function studentUserOption(row: {
  id: string;
  display_name: string;
  email: string;
  cohort: string | null;
  graduation_year: string | null;
  mentor_user_id: string | null;
  mentor_name: string | null;
  viewer_user_id: string | null;
  viewer_name: string | null;
}) {
  return {
    userId: row.id,
    displayName: row.display_name,
    email: row.email,
    cohort: row.cohort || "",
    graduationYear: row.graduation_year || "",
    mentorUserId: row.mentor_user_id || "",
    mentorName: row.mentor_name || "",
    viewerUserId: row.viewer_user_id || "",
    viewerName: row.viewer_name || "",
  };
}

function cleanAssignmentType(value: unknown): AssignmentType | "" {
  const normalized = String(value || "").trim();
  return [
    "mentor_student",
    "viewer_student",
    "program_teacher_program",
    "administration_site",
    "site_admin_site",
  ].includes(normalized) ? (normalized as AssignmentType) : "";
}

function cleanAction(value: unknown): "assign" | "remove" | "" {
  const normalized = String(value || "assign").trim();
  return normalized === "assign" || normalized === "remove" ? normalized : "";
}

function roleForAssignmentType(type: AssignmentType): RoleId {
  if (type === "mentor_student") return "mentor";
  if (type === "viewer_student") return "viewer";
  if (type === "program_teacher_program") return "program_teacher";
  if (type === "administration_site") return "administration";
  return "site_admin";
}

function canManageAccessAssignmentType(
  actorAccess: Awaited<ReturnType<typeof loadEffectiveAccess>>,
  type: AssignmentType,
): boolean {
  if (actorAccess.isGlobalAdmin) return true;
  if (actorAccess.canonicalRoleIds.includes("program_teacher")) return type === "mentor_student";
  if (actorAccess.canonicalRoleIds.includes("site_admin") || actorAccess.canonicalRoleIds.includes("administration")) {
    return type === "mentor_student"
      || type === "viewer_student"
      || type === "program_teacher_program";
  }
  return false;
}

function auditActionFor(type: AssignmentType, action: string): string {
  const suffix = action === "remove" ? "removed" : "assigned";
  if (type === "mentor_student") return `access.mentor_student_${suffix}`;
  if (type === "viewer_student") return `access.viewer_student_${suffix}`;
  if (type === "program_teacher_program") return `access.program_teacher_program_${suffix}`;
  if (type === "administration_site") return `access.administration_${suffix}`;
  return `access.site_admin_${suffix}`;
}

async function auditAccessAssignments(
  env: Env,
  request: Request,
  user: UserAccount,
  context: SiteScopeContext,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await writeAudit(env, {
    actorUserId: user.id,
    action,
    entityType: "site_access_assignment",
    entityId: cleanId(String(metadata.siteId || metadata.requestedSiteId || "")) || null,
    request,
    metadata: {
      ...metadata,
      actorRole: context.primaryRole,
      actorRoleScopes: context.roles.map((role) => ({
        roleId: role.role_id,
        scopeType: role.scope_type,
        scopeId: role.scope_id || "",
      })),
    },
  });
}
