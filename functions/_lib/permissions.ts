import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types";

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

export async function canAccessStudent(env: Env, viewer: UserAccount, studentId: string): Promise<boolean> {
  if (viewer.id === studentId && await hasRole(env, viewer.id, "student")) {
    return true;
  }
  if (await isAdmin(env, viewer.id)) {
    return true;
  }

  const mentorRow = await env.DB.prepare(
    `SELECT 1
     FROM mentor_assignments
     WHERE mentor_user_id = ?
       AND student_user_id = ?
       AND active = 1
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
         OR (teacher_role.scope_type = 'program' AND teacher_role.scope_id = COALESCE(g.program_id, ''))
         OR (teacher_role.scope_type = 'cohort' AND teacher_role.scope_id = COALESCE(g.cohort_id, ''))
       )
     LIMIT 1`,
  ).bind(studentId, viewer.id).first();
  return Boolean(teacherRow);
}

export async function canManageUsers(env: Env, viewer: UserAccount): Promise<boolean> {
  return isAdmin(env, viewer.id);
}
