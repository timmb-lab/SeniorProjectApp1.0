import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types.ts";

export const V5_ROLE_ORDER: RoleId[] = [
  "global_admin",
  "site_admin",
  "administration",
  "program_teacher",
  "mentor",
  "viewer",
  "student",
];

export const GLOBAL_ADMIN_ROLE_IDS: RoleId[] = ["global_admin", "admin", "platform_admin"];
export const LEGACY_ADMIN_ROLE_IDS: RoleId[] = ["admin", "platform_admin"];
export const SITE_ADMIN_ROLE_IDS: RoleId[] = ["site_admin"];
export const ADMINISTRATION_ROLE_IDS: RoleId[] = ["administration"];

export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  student: "Student",
  mentor: "Mentor",
  viewer: "Viewer",
  program_teacher: "Program Teacher",
  administration: "Administration",
  site_admin: "Site Admin",
  global_admin: "Global Admin",
  admin: "Global Admin",
  platform_admin: "Global Admin",
  org_admin: "Organization Admin",
  misc_admin: "Legacy Reporting Admin",
};

export type IdentityType = "local" | "sso" | "hybrid" | "none";

export interface EffectiveAccess {
  userId: string;
  email: string;
  roles: RoleAssignment[];
  roleIds: RoleId[];
  canonicalRoleIds: RoleId[];
  primaryRole: RoleId | "role_pending";
  identityType: IdentityType;
  hasLocalCredential: boolean;
  hasSsoIdentity: boolean;
  isGlobalAdmin: boolean;
  isLocalGlobalAdmin: boolean;
  siteIds: string[];
  programIds: string[];
  studentIds: string[];
}

export function displayRoleLabel(roleId: string): string {
  return ROLE_DISPLAY_LABELS[roleId] || humanizeRole(roleId);
}

export function canonicalRoleId(roleId: string): RoleId | null {
  if (roleId === "admin" || roleId === "platform_admin") return "global_admin";
  if (roleId === "misc_admin") return "administration";
  if ([
    "student",
    "mentor",
    "viewer",
    "program_teacher",
    "administration",
    "site_admin",
    "global_admin",
    "org_admin",
  ].includes(roleId)) {
    return roleId as RoleId;
  }
  return null;
}

export function isGlobalAdminRole(roleId: string): boolean {
  return GLOBAL_ADMIN_ROLE_IDS.includes(roleId as RoleId);
}

export function isElevatedRole(roleId: string): boolean {
  return ["global_admin", "admin", "platform_admin", "site_admin", "administration"].includes(roleId);
}

export async function loadEffectiveAccess(env: Env, user: UserAccount): Promise<EffectiveAccess> {
  const [roles, identity] = await Promise.all([
    loadRoleAssignments(env, user.id),
    loadIdentityType(env, user.id),
  ]);
  const roleIds = roles.map((role) => role.role_id);
  const canonicalRoleIds = uniqueRoleIds(roleIds.map(canonicalRoleId).filter(Boolean) as RoleId[]);
  const primaryRole = primaryRoleFor(canonicalRoleIds, roleIds);
  const isGlobalAdmin = roleIds.some((roleId) => isGlobalAdminRole(roleId));
  const isLocalGlobalAdmin = isGlobalAdmin && identity.hasLocalCredential;

  const [siteIds, programIds, studentIds] = await Promise.all([
    effectiveSiteIds(env, user, roles, isGlobalAdmin),
    effectiveProgramIds(env, roles, isGlobalAdmin),
    effectiveStudentIds(env, user, roles, isGlobalAdmin),
  ]);

  return {
    userId: user.id,
    email: user.email,
    roles,
    roleIds,
    canonicalRoleIds,
    primaryRole,
    identityType: identity.identityType,
    hasLocalCredential: identity.hasLocalCredential,
    hasSsoIdentity: identity.hasSsoIdentity,
    isGlobalAdmin,
    isLocalGlobalAdmin,
    siteIds,
    programIds,
    studentIds,
  };
}

export async function loadRoleAssignments(env: Env, userId: string): Promise<RoleAssignment[]> {
  const rows = await env.DB.prepare(
    "SELECT role_id, scope_type, scope_id FROM user_roles WHERE user_id = ?",
  ).bind(userId).all<RoleAssignment>();
  return rows.results || [];
}

export async function loadIdentityType(env: Env, userId: string): Promise<{
  identityType: IdentityType;
  hasLocalCredential: boolean;
  hasSsoIdentity: boolean;
}> {
  const [local, sso] = await Promise.all([
    env.DB.prepare("SELECT 1 FROM password_credentials WHERE user_id = ? LIMIT 1").bind(userId).first(),
    env.DB.prepare("SELECT 1 FROM auth_identities WHERE user_id = ? AND provider != 'local_password' LIMIT 1").bind(userId).first(),
  ]);
  const hasLocalCredential = Boolean(local);
  const hasSsoIdentity = Boolean(sso);
  const identityType = hasLocalCredential && hasSsoIdentity
    ? "hybrid"
    : hasLocalCredential
      ? "local"
      : hasSsoIdentity
        ? "sso"
        : "none";
  return { identityType, hasLocalCredential, hasSsoIdentity };
}

export async function hasLocalCredential(env: Env, userId: string): Promise<boolean> {
  const row = await env.DB.prepare("SELECT 1 FROM password_credentials WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first();
  return Boolean(row);
}

export async function countActiveLocalGlobalAdmins(env: Env, excludeUserId = ""): Promise<number> {
  const binds: string[] = [];
  let excludeClause = "";
  if (excludeUserId) {
    excludeClause = "AND user_accounts.id <> ?";
    binds.push(excludeUserId);
  }
  const row = await env.DB.prepare(
    `SELECT COUNT(DISTINCT user_accounts.id) AS count
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id IN ('global_admin', 'admin', 'platform_admin')
      AND user_roles.scope_type = 'global'
     JOIN password_credentials ON password_credentials.user_id = user_accounts.id
     WHERE user_accounts.status IN ('active', 'pending_reset')
       ${excludeClause}`,
  ).bind(...binds).first<{ count: number }>();
  return Number(row?.count || 0);
}

export async function canRemoveGlobalAdminGrant(env: Env, targetUserId: string): Promise<boolean> {
  const targetIsLocalGlobal = await env.DB.prepare(
    `SELECT 1
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id IN ('global_admin', 'admin', 'platform_admin')
      AND user_roles.scope_type = 'global'
     JOIN password_credentials ON password_credentials.user_id = user_accounts.id
     WHERE user_accounts.id = ?
       AND user_accounts.status IN ('active', 'pending_reset')
     LIMIT 1`,
  ).bind(targetUserId).first();
  if (!targetIsLocalGlobal) return true;
  return (await countActiveLocalGlobalAdmins(env, targetUserId)) >= 1;
}

export async function getViewerAssignedStudentIds(env: Env, viewerId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT viewer_student_assignments.student_user_id AS id
     FROM viewer_student_assignments
     JOIN user_accounts student ON student.id = viewer_student_assignments.student_user_id
      AND student.status = 'active'
     JOIN user_roles student_role ON student_role.user_id = student.id
      AND student_role.role_id = 'student'
     WHERE viewer_student_assignments.viewer_user_id = ?
       AND viewer_student_assignments.active = 1
     ORDER BY viewer_student_assignments.student_user_id ASC`,
  ).bind(viewerId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

export async function canActorManageSite(env: Env, actor: UserAccount, siteId: string): Promise<boolean> {
  const access = await loadEffectiveAccess(env, actor);
  if (access.isGlobalAdmin) return activeSiteExists(env, siteId);
  return access.canonicalRoleIds.includes("site_admin") && access.siteIds.includes(siteId);
}

export async function canActorCreateRole(env: Env, actor: UserAccount, roleId: RoleId, siteIds: string[]): Promise<boolean> {
  const access = await loadEffectiveAccess(env, actor);
  if (access.isGlobalAdmin) return true;
  if (!access.canonicalRoleIds.includes("site_admin")) return false;
  if (isGlobalAdminRole(roleId) || roleId === "global_admin") return false;
  if (roleId === "site_admin") return false;
  if (!siteIds.length && ["student", "mentor", "viewer", "program_teacher"].includes(roleId)) {
    return access.siteIds.length > 0;
  }
  return siteIds.every((siteId) => access.siteIds.includes(siteId));
}

async function effectiveSiteIds(
  env: Env,
  user: UserAccount,
  roles: RoleAssignment[],
  isGlobalAdmin: boolean,
): Promise<string[]> {
  if (isGlobalAdmin) return allActiveSiteIds(env);
  const output = new Set<string>();

  for (const role of roles) {
    if ((role.role_id === "site_admin" || role.role_id === "administration") && role.scope_type === "site") {
      if (await activeSiteExists(env, role.scope_id)) output.add(role.scope_id);
    }
    if (role.role_id === "org_admin" && ["tenant", "org"].includes(role.scope_type)) {
      for (const siteId of await activeSiteIdsForTenant(env, role.scope_id)) output.add(siteId);
    }
    if (role.role_id === "viewer" && role.scope_type === "site") {
      if (await activeSiteExists(env, role.scope_id)) output.add(role.scope_id);
    }
  }

  for (const membership of await activeSiteMembershipIds(env, user.id)) output.add(membership);
  for (const siteId of await siteIdsForProgramTeacherScopes(env, roles)) output.add(siteId);
  for (const siteId of await siteIdsForMentorAssignments(env, user.id)) output.add(siteId);
  for (const siteId of await siteIdsForViewerAssignments(env, user.id)) output.add(siteId);

  return Array.from(output).sort();
}

async function effectiveProgramIds(env: Env, roles: RoleAssignment[], isGlobalAdmin: boolean): Promise<string[]> {
  if (isGlobalAdmin) {
    const rows = await env.DB.prepare("SELECT id FROM programs WHERE active = 1 ORDER BY id ASC").all<{ id: string }>();
    return (rows.results || []).map((row) => row.id);
  }
  return uniqueStrings(roles
    .filter((role) => role.role_id === "program_teacher" && role.scope_type === "program" && role.scope_id)
    .map((role) => role.scope_id));
}

async function effectiveStudentIds(
  env: Env,
  user: UserAccount,
  roles: RoleAssignment[],
  isGlobalAdmin: boolean,
): Promise<string[]> {
  if (isGlobalAdmin) return allActiveStudentIds(env);
  const output = new Set<string>();
  if (roles.some((role) => role.role_id === "student")) output.add(user.id);

  for (const studentId of await studentIdsForSiteRoles(env, roles)) output.add(studentId);
  for (const studentId of await studentIdsForProgramTeacherScopes(env, roles)) output.add(studentId);
  for (const studentId of await mentorAssignedStudentIds(env, user.id)) output.add(studentId);
  for (const studentId of await getViewerAssignedStudentIds(env, user.id)) output.add(studentId);

  return Array.from(output).sort();
}

async function allActiveSiteIds(env: Env): Promise<string[]> {
  const rows = await env.DB.prepare("SELECT id FROM sites WHERE status = 'active' ORDER BY id ASC").all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function allActiveStudentIds(env: Env): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT user_accounts.id
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     WHERE user_accounts.status = 'active'
     ORDER BY user_accounts.id ASC`,
  ).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function activeSiteExists(env: Env, siteId: string): Promise<boolean> {
  if (!siteId) return false;
  const row = await env.DB.prepare("SELECT 1 FROM sites WHERE id = ? AND status = 'active' LIMIT 1")
    .bind(siteId)
    .first();
  return Boolean(row);
}

async function activeSiteIdsForTenant(env: Env, tenantId: string): Promise<string[]> {
  if (!tenantId) return [];
  const rows = await env.DB.prepare(
    "SELECT id FROM sites WHERE tenant_id = ? AND status = 'active' ORDER BY id ASC",
  ).bind(tenantId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function activeSiteMembershipIds(env: Env, userId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT site_users.site_id AS id
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE site_users.user_id = ?
       AND site_users.membership_status = 'active'
     ORDER BY site_users.site_id ASC`,
  ).bind(userId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function siteIdsForProgramTeacherScopes(env: Env, roles: RoleAssignment[]): Promise<string[]> {
  const output = new Set<string>();
  for (const role of roles.filter((row) => row.role_id === "program_teacher" && row.scope_type === "program" && row.scope_id)) {
    const rows = await env.DB.prepare(
      `SELECT sites.id
       FROM site_programs
       JOIN sites ON sites.id = site_programs.site_id
        AND sites.status = 'active'
       WHERE site_programs.program_id = ?
        AND site_programs.active = 1`,
    ).bind(role.scope_id).all<{ id: string }>();
    for (const row of rows.results || []) output.add(row.id);
  }
  return Array.from(output).sort();
}

async function siteIdsForMentorAssignments(env: Env, mentorId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT site_users.site_id AS id
     FROM mentor_assignments
     JOIN site_users ON site_users.user_id = mentor_assignments.student_user_id
      AND site_users.membership_status = 'active'
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE mentor_assignments.mentor_user_id = ?
      AND mentor_assignments.active = 1
     ORDER BY site_users.site_id ASC`,
  ).bind(mentorId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function siteIdsForViewerAssignments(env: Env, viewerId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT site_users.site_id AS id
     FROM viewer_student_assignments
     JOIN site_users ON site_users.user_id = viewer_student_assignments.student_user_id
      AND site_users.membership_status = 'active'
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE viewer_student_assignments.viewer_user_id = ?
      AND viewer_student_assignments.active = 1
     ORDER BY site_users.site_id ASC`,
  ).bind(viewerId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function studentIdsForSiteRoles(env: Env, roles: RoleAssignment[]): Promise<string[]> {
  const siteIds = uniqueStrings(roles
    .filter((role) => (role.role_id === "site_admin" || role.role_id === "administration") && role.scope_type === "site")
    .map((role) => role.scope_id));
  if (!siteIds.length) return [];
  const placeholders = siteIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT DISTINCT student.id
     FROM site_users
     JOIN user_accounts student ON student.id = site_users.user_id
      AND student.status = 'active'
     JOIN user_roles student_role ON student_role.user_id = student.id
      AND student_role.role_id = 'student'
     WHERE site_users.site_id IN (${placeholders})
      AND site_users.membership_status = 'active'
     ORDER BY student.id ASC`,
  ).bind(...siteIds).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function studentIdsForProgramTeacherScopes(env: Env, roles: RoleAssignment[]): Promise<string[]> {
  const output = new Set<string>();
  for (const role of roles.filter((row) => row.role_id === "program_teacher" && row.scope_id)) {
    if (!["program", "cohort"].includes(role.scope_type)) continue;
    const joinColumn = role.scope_type === "program" ? "groups.program_id" : "groups.cohort_id";
    const rows = await env.DB.prepare(
      `SELECT DISTINCT user_accounts.id
       FROM user_accounts
       JOIN user_roles ON user_roles.user_id = user_accounts.id
        AND user_roles.role_id = 'student'
       JOIN group_memberships ON group_memberships.user_id = user_accounts.id
       JOIN groups ON groups.id = group_memberships.group_id
       WHERE user_accounts.status = 'active'
        AND ${joinColumn} = ?
       ORDER BY user_accounts.id ASC`,
    ).bind(role.scope_id).all<{ id: string }>();
    for (const row of rows.results || []) output.add(row.id);
  }
  return Array.from(output).sort();
}

async function mentorAssignedStudentIds(env: Env, mentorId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT student_user_id AS id
     FROM mentor_assignments
     WHERE mentor_user_id = ?
      AND active = 1
     ORDER BY student_user_id ASC`,
  ).bind(mentorId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

function primaryRoleFor(canonicalRoleIds: RoleId[], rawRoleIds: RoleId[]): RoleId | "role_pending" {
  for (const roleId of V5_ROLE_ORDER) {
    if (canonicalRoleIds.includes(roleId)) return roleId;
  }
  if (rawRoleIds.includes("org_admin")) return "org_admin";
  return "role_pending";
}

function uniqueRoleIds(values: RoleId[]): RoleId[] {
  return Array.from(new Set(values));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).sort();
}

function humanizeRole(value: string): string {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim() || "Role";
}
