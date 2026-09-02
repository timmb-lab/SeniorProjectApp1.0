import type { Env, UserAccount } from "../_types.ts";
import { randomId } from "./crypto.ts";
import { canAccessProject, canAccessSite, canManageProject, getViewerRoleContext } from "./permissions.ts";

export type ProjectAdultRole = "mentor" | "program_teacher";
export type ProjectAdultStatus = "pending" | "accepted" | "declined" | "cancelled" | "replaced";

export interface ProjectAdultAssignmentRow {
  id: string;
  project_id: string | null;
  request_id: string | null;
  site_id: string;
  program_id: string | null;
  adult_role: ProjectAdultRole;
  assignee_user_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  invited_name: string | null;
  invited_email: string | null;
  status: ProjectAdultStatus;
  nominated_by: string;
  nominator_name: string | null;
  responded_by: string | null;
  responded_at: string | null;
  replacement_for_id: string | null;
  staff_reason: string | null;
  created_at: string;
  updated_at: string;
  target_name?: string | null;
}

export interface ProjectAdultTarget {
  projectId: string;
  requestId: string;
  siteId: string;
  programId: string;
  name: string;
}

export interface ProjectAdultSetup {
  ready: boolean;
  mentor: ReturnType<typeof assignmentResponse> | null;
  programTeacher: ReturnType<typeof assignmentResponse> | null;
  pendingMentor: ReturnType<typeof assignmentResponse> | null;
  pendingProgramTeacher: ReturnType<typeof assignmentResponse> | null;
  missingRoles: ProjectAdultRole[];
  nextStep: string;
}

export function cleanProjectAdultRole(value: unknown): ProjectAdultRole | "" {
  const role = String(value || "").trim().toLowerCase();
  return role === "mentor" || role === "program_teacher" ? role : "";
}

export function cleanInviteEmail(value: unknown): string {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : "";
}

export async function loadProjectAdultTarget(
  env: Env,
  projectId: string,
  requestId: string,
): Promise<ProjectAdultTarget | null> {
  if (projectId) {
    const row = await env.DB.prepare(
      `SELECT id, site_id, program_id, name
       FROM projects
       WHERE id = ? AND status != 'archived'
       LIMIT 1`,
    ).bind(projectId).first<{ id: string; site_id: string; program_id: string | null; name: string }>();
    return row ? {
      projectId: row.id,
      requestId: "",
      siteId: row.site_id,
      programId: row.program_id || "",
      name: row.name,
    } : null;
  }
  if (requestId) {
    const row = await env.DB.prepare(
      `SELECT id, site_id, program_id, proposed_name
       FROM project_requests
       WHERE id = ? AND status IN ('submitted', 'changes_requested')
       LIMIT 1`,
    ).bind(requestId).first<{ id: string; site_id: string; program_id: string | null; proposed_name: string }>();
    return row ? {
      projectId: "",
      requestId: row.id,
      siteId: row.site_id,
      programId: row.program_id || "",
      name: row.proposed_name,
    } : null;
  }
  return null;
}

export async function canManageProjectAdultTarget(
  env: Env,
  user: UserAccount,
  target: ProjectAdultTarget,
): Promise<boolean> {
  if (!await canManageProject(env, user, target.projectId || target.siteId)) return false;
  const context = await getViewerRoleContext(env, user);
  if (context.isGlobalAdmin || context.roleIds.includes("site_admin") || context.roleIds.includes("administration")) return true;
  if (!context.roleIds.includes("program_teacher") || !target.programId) return false;
  if (!await canAccessSite(env, user, target.siteId)) return false;
  return context.roles.some((role) => (
    role.role_id === "program_teacher"
    && role.scope_type === "program"
    && role.scope_id === target.programId
  ));
}

export async function canStudentManageProjectAdultTarget(
  env: Env,
  user: UserAccount,
  target: ProjectAdultTarget,
): Promise<boolean> {
  if (target.projectId) {
    const row = await env.DB.prepare(
      `SELECT 1 FROM project_members
       WHERE project_id = ? AND student_user_id = ? AND active = 1
       LIMIT 1`,
    ).bind(target.projectId, user.id).first();
    return Boolean(row);
  }
  const row = await env.DB.prepare(
    `SELECT 1 FROM project_request_members
     WHERE request_id = ? AND student_user_id = ? AND invitation_status = 'accepted'
     LIMIT 1`,
  ).bind(target.requestId, user.id).first();
  return Boolean(row);
}

export async function canViewProjectAdultTarget(
  env: Env,
  user: UserAccount,
  target: ProjectAdultTarget,
): Promise<boolean> {
  if (await canManageProjectAdultTarget(env, user, target)) return true;
  if (await canStudentManageProjectAdultTarget(env, user, target)) return true;
  if (target.projectId && await canAccessProject(env, user, target.projectId)) return true;
  const assignment = await env.DB.prepare(
    `SELECT 1 FROM project_adult_assignments
     WHERE request_id = ? AND assignee_user_id = ? AND status IN ('pending', 'accepted')
     LIMIT 1`,
  ).bind(target.requestId, user.id).first();
  return Boolean(assignment);
}

export async function loadProjectAdultAssignments(
  env: Env,
  projectIds: string[] = [],
  requestIds: string[] = [],
): Promise<ProjectAdultAssignmentRow[]> {
  if (!projectIds.length && !requestIds.length) return [];
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  if (projectIds.length) {
    clauses.push("project_adult_assignments.project_id IN (SELECT value FROM json_each(?))");
    bindings.push(JSON.stringify(projectIds));
  }
  if (requestIds.length) {
    clauses.push("project_adult_assignments.request_id IN (SELECT value FROM json_each(?))");
    bindings.push(JSON.stringify(requestIds));
  }
  const rows = await env.DB.prepare(
    `SELECT
       project_adult_assignments.*,
       assignee.display_name AS assignee_name,
       assignee.email AS assignee_email,
       nominator.display_name AS nominator_name
     FROM project_adult_assignments
     LEFT JOIN user_accounts assignee ON assignee.id = project_adult_assignments.assignee_user_id
     LEFT JOIN user_accounts nominator ON nominator.id = project_adult_assignments.nominated_by
     WHERE (${clauses.join(" OR ")})
     ORDER BY
       CASE project_adult_assignments.status WHEN 'accepted' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
       project_adult_assignments.updated_at DESC`,
  ).bind(...bindings).all<ProjectAdultAssignmentRow>();
  return rows.results || [];
}

export function projectAdultSetup(rows: ProjectAdultAssignmentRow[]): ProjectAdultSetup {
  const acceptedMentor = rows.find((row) => row.adult_role === "mentor" && row.status === "accepted") || null;
  const acceptedTeacher = rows.find((row) => row.adult_role === "program_teacher" && row.status === "accepted") || null;
  const pendingMentor = rows.find((row) => row.adult_role === "mentor" && row.status === "pending") || null;
  const pendingTeacher = rows.find((row) => row.adult_role === "program_teacher" && row.status === "pending") || null;
  const missingRoles: ProjectAdultRole[] = [];
  if (!acceptedMentor) missingRoles.push("mentor");
  if (!acceptedTeacher) missingRoles.push("program_teacher");
  const ready = missingRoles.length === 0;
  return {
    ready,
    mentor: acceptedMentor ? assignmentResponse(acceptedMentor) : null,
    programTeacher: acceptedTeacher ? assignmentResponse(acceptedTeacher) : null,
    pendingMentor: pendingMentor ? assignmentResponse(pendingMentor) : null,
    pendingProgramTeacher: pendingTeacher ? assignmentResponse(pendingTeacher) : null,
    missingRoles,
    nextStep: ready
      ? "The project's Mentor and Program Teacher are confirmed."
      : pendingMentor || pendingTeacher
        ? "One or more adults still need to accept. You may keep working ahead."
        : "Tag a Mentor and Program Teacher. You may keep working ahead while they accept.",
  };
}

export async function loadEligibleProjectAdults(
  env: Env,
  target: ProjectAdultTarget,
): Promise<{ mentors: Array<Record<string, string>>; programTeachers: Array<Record<string, string>> }> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT
       user_accounts.id,
       user_accounts.display_name,
       user_accounts.email,
       user_roles.role_id
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
     JOIN site_users ON site_users.user_id = user_accounts.id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE user_accounts.status = 'active'
       AND (
         user_roles.role_id = 'mentor'
         OR (
           user_roles.role_id = 'program_teacher'
           AND user_roles.scope_type = 'program'
           AND user_roles.scope_id = ?
         )
       )
     ORDER BY user_roles.role_id, user_accounts.display_name
     LIMIT 200`,
  ).bind(target.siteId, target.programId || "__missing_program__").all<{
    id: string;
    display_name: string;
    email: string;
    role_id: string;
  }>();
  const mentors: Array<Record<string, string>> = [];
  const programTeachers: Array<Record<string, string>> = [];
  for (const row of rows.results || []) {
    const item = { userId: row.id, displayName: row.display_name, email: row.email };
    if (row.role_id === "mentor") mentors.push(item);
    if (row.role_id === "program_teacher") programTeachers.push(item);
  }
  return { mentors, programTeachers };
}

export async function validateEligibleProjectAdult(
  env: Env,
  target: ProjectAdultTarget,
  role: ProjectAdultRole,
  userId: string,
): Promise<{ id: string; display_name: string; email: string } | null> {
  const roleClause = role === "mentor"
    ? "user_roles.role_id = 'mentor'"
    : `user_roles.role_id = 'program_teacher'
       AND user_roles.scope_type = 'program'
       AND user_roles.scope_id = ?`;
  return env.DB.prepare(
    `SELECT DISTINCT user_accounts.id, user_accounts.display_name, user_accounts.email
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
     JOIN site_users ON site_users.user_id = user_accounts.id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE user_accounts.id = ?
       AND user_accounts.status = 'active'
       AND ${roleClause}
     LIMIT 1`,
  ).bind(...(role === "mentor"
    ? [target.siteId, userId]
    : [target.siteId, userId, target.programId || "__missing_program__"])).first<{
      id: string;
      display_name: string;
      email: string;
    }>();
}

export function adultAssignmentEventStatement(
  env: Env,
  assignmentId: string,
  actorUserId: string,
  action: string,
  detail: Record<string, unknown> = {},
): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT INTO project_adult_assignment_events (id, assignment_id, actor_user_id, action, detail_json)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(randomId("adult-event"), assignmentId, actorUserId, action, JSON.stringify(detail));
}

export function notificationStatement(
  env: Env,
  userId: string,
  kind: string,
  title: string,
  message: string,
  entityId: string,
  entityType: "project" | "project_request" = "project",
): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT INTO user_notifications (id, user_id, kind, title, message, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(randomId("notice"), userId, kind, title, message, entityType, entityId);
}

export function mentorSyncStatements(
  env: Env,
  projectId: string,
  mentorUserId: string,
  actorUserId: string,
): D1PreparedStatement[] {
  return [
    env.DB.prepare(
      "UPDATE project_mentor_assignments SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE project_id = ? AND active = 1",
    ).bind(projectId),
    env.DB.prepare(
      `INSERT INTO project_mentor_assignments (id, project_id, mentor_user_id, active, assigned_by)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(project_id, mentor_user_id) DO UPDATE SET
         active = 1,
         assigned_by = excluded.assigned_by,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    ).bind(randomId("project-mentor"), projectId, mentorUserId, actorUserId),
    env.DB.prepare(
      `UPDATE mentor_assignments
       SET active = 0
       WHERE student_user_id IN (
         SELECT student_user_id FROM project_members WHERE project_id = ? AND active = 1
       ) AND mentor_user_id != ? AND active = 1`,
    ).bind(projectId, mentorUserId),
    env.DB.prepare(
      `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
       SELECT 'mentor-project-' || lower(hex(randomblob(16))), ?, project_members.student_user_id, ?, 1
       FROM project_members
       WHERE project_members.project_id = ? AND project_members.active = 1
       ON CONFLICT(mentor_user_id, student_user_id) DO UPDATE SET
         assigned_by = excluded.assigned_by,
         active = 1`,
    ).bind(mentorUserId, actorUserId, projectId),
  ];
}

export function assignmentResponse(row: ProjectAdultAssignmentRow) {
  return {
    assignmentId: row.id,
    projectId: row.project_id || "",
    requestId: row.request_id || "",
    adultRole: row.adult_role,
    assigneeUserId: row.assignee_user_id || "",
    displayName: row.assignee_name || row.invited_name || "Invited adult",
    email: row.assignee_email || row.invited_email || "",
    status: row.status,
    nominatedBy: row.nominated_by,
    nominatedByName: row.nominator_name || "",
    respondedAt: row.responded_at || "",
    replacementForId: row.replacement_for_id || "",
    staffReason: row.staff_reason || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    externalInvite: !row.assignee_user_id,
    targetName: row.target_name || "",
  };
}

export function targetEntityId(target: ProjectAdultTarget): string {
  return target.projectId || target.requestId;
}
