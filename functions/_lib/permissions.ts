import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types.ts";

export async function getRoleAssignments(env: Env, userId: string): Promise<RoleAssignment[]> {
  const rows = await env.DB.prepare(
    "SELECT role_id, scope_type, scope_id FROM user_roles WHERE user_id = ?",
  ).bind(userId).all<RoleAssignment>();
  return rows.results || [];
}

export async function hasRole(env: Env, userId: string, roleId: RoleId): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1",
  ).bind(userId, roleId).first();
  return Boolean(row);
}

export async function isAdmin(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "admin");
}

export function roleIds(assignments: RoleAssignment[]): Set<RoleId> {
  return new Set(assignments.map((assignment) => assignment.role_id));
}

export async function isMiscAdmin(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "misc_admin");
}

export async function getViewerRoleContext(env: Env, viewer: UserAccount): Promise<{
  roles: RoleAssignment[];
  roleIds: RoleId[];
  primaryRole: RoleId | "role_pending";
  isAdmin: boolean;
  isMiscAdmin: boolean;
}> {
  const roles = await getRoleAssignments(env, viewer.id);
  const ids = Array.from(roleIds(roles));
  const primaryRole = primaryRoleFor(ids);
  return {
    roles,
    roleIds: ids,
    primaryRole,
    isAdmin: ids.includes("admin"),
    isMiscAdmin: ids.includes("misc_admin"),
  };
}

export async function canViewAdminDashboard(env: Env, viewer: UserAccount): Promise<boolean> {
  return isAdmin(env, viewer.id);
}

export async function canViewAggregateReadiness(env: Env, viewer: UserAccount): Promise<boolean> {
  return await isAdmin(env, viewer.id) || await isMiscAdmin(env, viewer.id);
}

export async function canViewProgramTeacherDashboard(env: Env, viewer: UserAccount): Promise<boolean> {
  if (await isAdmin(env, viewer.id)) return true;
  const assignments = await getRoleAssignments(env, viewer.id);
  return hasValidProgramTeacherScope(assignments);
}

export async function canViewMentorDashboard(env: Env, viewer: UserAccount): Promise<boolean> {
  return await isAdmin(env, viewer.id) || await hasRole(env, viewer.id, "mentor");
}

export async function canViewStudentDetail(env: Env, viewer: UserAccount, studentId: string): Promise<boolean> {
  return canAccessStudent(env, viewer, studentId);
}

export async function canViewStudentEvidence(env: Env, viewer: UserAccount, studentId: string): Promise<boolean> {
  return canAccessStudent(env, viewer, studentId);
}

export async function canReviewSubmission(env: Env, viewer: UserAccount, submissionId: string): Promise<boolean> {
  if (await isAdmin(env, viewer.id)) return true;
  if (!await hasRole(env, viewer.id, "program_teacher")) return false;
  const submission = await env.DB.prepare(
    "SELECT student_id FROM submissions WHERE id = ? LIMIT 1",
  ).bind(submissionId).first<{ student_id: string }>();
  return submission ? canAccessStudent(env, viewer, submission.student_id) : false;
}

export async function canManageAssignments(env: Env, viewer: UserAccount): Promise<boolean> {
  return isAdmin(env, viewer.id);
}

export async function canManageTenant(env: Env, viewer: UserAccount, _tenantId?: string): Promise<boolean> {
  return isAdmin(env, viewer.id);
}

export async function getProgramTeacherScopedStudentIds(env: Env, viewer: UserAccount): Promise<{
  valid: boolean;
  invalidScopeCount: number;
  studentIds: string[];
  scopeSummary: Array<{ scopeType: string; scopeId: string }>;
}> {
  const assignments = (await getRoleAssignments(env, viewer.id))
    .filter((assignment) => assignment.role_id === "program_teacher");
  const validScopes = assignments.filter(isValidProgramTeacherScope);
  const invalidScopeCount = assignments.length - validScopes.length;
  const studentIds = new Set<string>();

  for (const scope of validScopes) {
    const rows = await studentRowsForTeacherScope(env, scope);
    for (const row of rows) studentIds.add(row.id);
  }

  return {
    valid: validScopes.length > 0,
    invalidScopeCount,
    studentIds: Array.from(studentIds),
    scopeSummary: validScopes.map((scope) => ({
      scopeType: scope.scope_type,
      scopeId: scope.scope_id || "",
    })),
  };
}

export async function getAllActiveStudentIds(env: Env): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT user_accounts.id
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     WHERE user_accounts.status = 'active'
     ORDER BY user_accounts.display_name ASC`,
  ).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

export async function canAccessStudent(env: Env, viewer: UserAccount, studentId: string): Promise<boolean> {
  if (viewer.id === studentId && await hasRole(env, viewer.id, "student")) {
    return true;
  }
  if (await isAdmin(env, viewer.id)) {
    return true;
  }

  const mentorRow = await env.DB.prepare(
    `SELECT 1
     FROM mentor_assignments ma
     JOIN user_roles mentor_role
       ON mentor_role.user_id = ma.mentor_user_id
      AND mentor_role.role_id = 'mentor'
     WHERE ma.mentor_user_id = ?
       AND ma.student_user_id = ?
       AND ma.active = 1
     LIMIT 1`,
  ).bind(viewer.id, studentId).first();
  if (mentorRow) {
    return true;
  }

  const teacherRow = await env.DB.prepare(
    `SELECT 1
     FROM user_roles teacher_role
     JOIN group_memberships student_group ON student_group.user_id = ?
     JOIN groups g ON g.id = student_group.group_id
     WHERE teacher_role.user_id = ?
       AND teacher_role.role_id = 'program_teacher'
       AND (
         teacher_role.scope_type = 'global'
         OR (
           teacher_role.scope_type = 'program'
           AND teacher_role.scope_id <> ''
           AND g.program_id IS NOT NULL
           AND g.program_id <> ''
           AND teacher_role.scope_id = g.program_id
         )
         OR (
           teacher_role.scope_type = 'cohort'
           AND teacher_role.scope_id <> ''
           AND g.cohort_id IS NOT NULL
           AND g.cohort_id <> ''
           AND teacher_role.scope_id = g.cohort_id
         )
       )
     LIMIT 1`,
  ).bind(studentId, viewer.id).first();
  return Boolean(teacherRow);
}

export async function canManageUsers(env: Env, viewer: UserAccount): Promise<boolean> {
  return isAdmin(env, viewer.id);
}

function primaryRoleFor(ids: RoleId[]): RoleId | "role_pending" {
  for (const roleId of ["admin", "program_teacher", "mentor", "student", "misc_admin"] as RoleId[]) {
    if (ids.includes(roleId)) return roleId;
  }
  return "role_pending";
}

function hasValidProgramTeacherScope(assignments: RoleAssignment[]): boolean {
  return assignments.some((assignment) => assignment.role_id === "program_teacher" && isValidProgramTeacherScope(assignment));
}

function isValidProgramTeacherScope(assignment: RoleAssignment): boolean {
  if (assignment.scope_type === "global") return true;
  if (assignment.scope_type === "program" || assignment.scope_type === "cohort") {
    return String(assignment.scope_id || "").trim() !== "";
  }
  return false;
}

async function studentRowsForTeacherScope(env: Env, scope: RoleAssignment): Promise<Array<{ id: string }>> {
  if (scope.scope_type === "global") {
    const rows = await env.DB.prepare(
      `SELECT DISTINCT user_accounts.id
       FROM user_accounts
       JOIN user_roles ON user_roles.user_id = user_accounts.id
        AND user_roles.role_id = 'student'
       WHERE user_accounts.status = 'active'
       ORDER BY user_accounts.display_name ASC`,
    ).all<{ id: string }>();
    return rows.results || [];
  }

  if (scope.scope_type === "program") {
    const rows = await env.DB.prepare(
      `SELECT DISTINCT user_accounts.id
       FROM user_accounts
       JOIN user_roles ON user_roles.user_id = user_accounts.id
        AND user_roles.role_id = 'student'
       JOIN group_memberships ON group_memberships.user_id = user_accounts.id
       JOIN groups ON groups.id = group_memberships.group_id
       WHERE user_accounts.status = 'active'
         AND groups.program_id = ?
       ORDER BY user_accounts.display_name ASC`,
    ).bind(scope.scope_id).all<{ id: string }>();
    return rows.results || [];
  }

  const rows = await env.DB.prepare(
    `SELECT DISTINCT user_accounts.id
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     JOIN group_memberships ON group_memberships.user_id = user_accounts.id
     JOIN groups ON groups.id = group_memberships.group_id
     WHERE user_accounts.status = 'active'
       AND groups.cohort_id = ?
     ORDER BY user_accounts.display_name ASC`,
  ).bind(scope.scope_id).all<{ id: string }>();
  return rows.results || [];
}
