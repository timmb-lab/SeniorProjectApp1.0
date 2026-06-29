import type { Env, RoleAssignment, RoleId, SiteUser, TenantUser, UserAccount } from "../_types.ts";
import {
  GLOBAL_ADMIN_ROLE_IDS,
  getViewerAssignedStudentIds,
  loadEffectiveAccess,
} from "./effective-access.ts";

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

export async function hasAnyRole(env: Env, userId: string, roleIdsToCheck: RoleId[]): Promise<boolean> {
  for (const roleId of roleIdsToCheck) {
    if (await hasRole(env, userId, roleId)) return true;
  }
  return false;
}

export async function isLegacyAdmin(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "admin");
}

export async function isGlobalAdmin(env: Env, userId: string): Promise<boolean> {
  return hasAnyRole(env, userId, GLOBAL_ADMIN_ROLE_IDS);
}

export async function isPlatformAdmin(env: Env, userId: string): Promise<boolean> {
  return isGlobalAdmin(env, userId);
}

export async function isAdmin(env: Env, userId: string): Promise<boolean> {
  return isLegacyAdmin(env, userId);
}

export function roleIds(assignments: RoleAssignment[]): Set<RoleId> {
  return new Set(assignments.map((assignment) => assignment.role_id));
}

export async function isMiscAdmin(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "misc_admin");
}

export async function isSiteAdmin(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "site_admin");
}

export async function isAdministration(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "administration");
}

export async function isViewer(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "viewer");
}

export async function isProgramTeacher(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "program_teacher");
}

export async function isMentor(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "mentor");
}

export async function isStudent(env: Env, userId: string): Promise<boolean> {
  return hasRole(env, userId, "student");
}

export async function getViewerRoleContext(env: Env, viewer: UserAccount): Promise<{
  roles: RoleAssignment[];
  roleIds: RoleId[];
  primaryRole: RoleId | "role_pending";
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  isMiscAdmin: boolean;
  isGlobalAdmin: boolean;
}> {
  const access = await loadEffectiveAccess(env, viewer);
  const roles = access.roles;
  const ids = access.roleIds;
  return {
    roles,
    roleIds: ids,
    primaryRole: access.primaryRole,
    isAdmin: ids.includes("admin"),
    isPlatformAdmin: access.isGlobalAdmin,
    isMiscAdmin: ids.includes("misc_admin"),
    isGlobalAdmin: access.isGlobalAdmin,
  };
}

export async function canViewAdminDashboard(env: Env, viewer: UserAccount): Promise<boolean> {
  return isGlobalAdmin(env, viewer.id);
}

export async function canViewAggregateReadiness(env: Env, viewer: UserAccount): Promise<boolean> {
  return await isGlobalAdmin(env, viewer.id)
    || await isSiteAdmin(env, viewer.id)
    || await isAdministration(env, viewer.id)
    || await isMiscAdmin(env, viewer.id);
}

export async function canViewProgramTeacherDashboard(env: Env, viewer: UserAccount): Promise<boolean> {
  if (await isGlobalAdmin(env, viewer.id)) return true;
  const assignments = await getRoleAssignments(env, viewer.id);
  return hasValidProgramTeacherScope(assignments);
}

export async function canViewMentorDashboard(env: Env, viewer: UserAccount): Promise<boolean> {
  return await isGlobalAdmin(env, viewer.id) || await hasRole(env, viewer.id, "mentor");
}

export async function canViewStudentDetail(env: Env, viewer: UserAccount, studentId: string): Promise<boolean> {
  return canAccessStudent(env, viewer, studentId);
}

export async function canViewStudentEvidence(env: Env, viewer: UserAccount, studentId: string): Promise<boolean> {
  return canAccessStudent(env, viewer, studentId);
}

export async function canReviewSubmission(env: Env, viewer: UserAccount, submissionId: string): Promise<boolean> {
  if (await isGlobalAdmin(env, viewer.id)) return true;
  if (!await hasRole(env, viewer.id, "program_teacher")) return false;
  const submission = await env.DB.prepare(
    "SELECT student_id FROM submissions WHERE id = ? LIMIT 1",
  ).bind(submissionId).first<{ student_id: string }>();
  return submission ? canAccessStudent(env, viewer, submission.student_id) : false;
}

export async function canManageAssignments(env: Env, viewer: UserAccount): Promise<boolean> {
  return isGlobalAdmin(env, viewer.id);
}

export async function canManageTenant(env: Env, viewer: UserAccount, _tenantId?: string): Promise<boolean> {
  return isGlobalAdmin(env, viewer.id);
}

export async function getTenantMemberships(env: Env, userId: string): Promise<TenantUser[]> {
  const rows = await env.DB.prepare(
    `SELECT tenant_users.tenant_id, tenant_users.user_id, tenant_users.membership_status
     FROM tenant_users
     JOIN tenants ON tenants.id = tenant_users.tenant_id
     WHERE tenant_users.user_id = ?
       AND tenant_users.membership_status = 'active'
       AND tenants.status = 'active'
     ORDER BY tenant_users.tenant_id ASC`,
  ).bind(userId).all<TenantUser>();
  return rows.results || [];
}

export async function getSiteMemberships(env: Env, userId: string): Promise<SiteUser[]> {
  const rows = await env.DB.prepare(
    `SELECT site_users.site_id, site_users.user_id, site_users.membership_status
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
     WHERE site_users.user_id = ?
       AND site_users.membership_status = 'active'
       AND sites.status = 'active'
     ORDER BY site_users.site_id ASC`,
  ).bind(userId).all<SiteUser>();
  return rows.results || [];
}

export async function getAccessibleTenantIds(env: Env, viewer: UserAccount): Promise<string[]> {
  if (await isPlatformAdmin(env, viewer.id)) return allActiveTenantIds(env);

  const output = new Set<string>();

  for (const siteId of await getAccessibleSiteIds(env, viewer)) {
    const tenantId = await activeTenantIdForSite(env, siteId);
    if (tenantId) output.add(tenantId);
  }

  return Array.from(output).sort();
}

export async function getAccessibleSiteIds(env: Env, viewer: UserAccount): Promise<string[]> {
  if (await isPlatformAdmin(env, viewer.id)) return allActiveSiteIds(env);

  const assignments = await getRoleAssignments(env, viewer.id);
  const ids = roleIds(assignments);
  const output = new Set<string>();

  if (ids.has("site_admin") || ids.has("administration")) {
    for (const siteId of scopedIds(assignments, "site_admin", ["site"])) {
      if (await activeSiteExists(env, siteId)) output.add(siteId);
    }
    for (const siteId of scopedIds(assignments, "administration", ["site"])) {
      if (await activeSiteExists(env, siteId)) output.add(siteId);
    }
    for (const membership of await getSiteMemberships(env, viewer.id)) output.add(membership.site_id);
  }

  if (ids.has("viewer")) {
    for (const siteId of await siteIdsForViewerAssignments(env, viewer.id)) output.add(siteId);
  }

  if (ids.has("student")) {
    for (const membership of await getSiteMemberships(env, viewer.id)) output.add(membership.site_id);
  }

  if (ids.has("mentor")) {
    for (const siteId of await siteIdsForMentorAssignments(env, viewer.id)) output.add(siteId);
  }

  if (ids.has("program_teacher")) {
    for (const siteId of await siteIdsForProgramTeacherScopes(env, assignments)) output.add(siteId);
  }

  return Array.from(output).sort();
}

export async function canAccessTenant(env: Env, viewer: UserAccount, tenantId: string): Promise<boolean> {
  const normalizedTenantId = normalizeScopeId(tenantId);
  if (!normalizedTenantId || !await activeTenantExists(env, normalizedTenantId)) return false;
  if (await isPlatformAdmin(env, viewer.id)) return true;
  return (await getAccessibleTenantIds(env, viewer)).includes(normalizedTenantId);
}

export async function canAccessSite(env: Env, viewer: UserAccount, siteId: string): Promise<boolean> {
  const normalizedSiteId = normalizeScopeId(siteId);
  if (!normalizedSiteId || !await activeSiteExists(env, normalizedSiteId)) return false;
  if (await isPlatformAdmin(env, viewer.id)) return true;
  return (await getAccessibleSiteIds(env, viewer)).includes(normalizedSiteId);
}

export async function getRoleScopeSummary(env: Env, viewer: UserAccount): Promise<{
  roles: RoleAssignment[];
  tenantIds: string[];
  siteIds: string[];
  mentorAssignedStudentIds: string[];
}> {
  const [roles, tenantIds, siteIds, mentorAssignedStudentIds] = await Promise.all([
    getRoleAssignments(env, viewer.id),
    getAccessibleTenantIds(env, viewer),
    getAccessibleSiteIds(env, viewer),
    getMentorAssignedStudentIds(env, viewer),
  ]);
  return { roles, tenantIds, siteIds, mentorAssignedStudentIds };
}

export async function getMentorAssignedStudentIds(env: Env, viewer: UserAccount): Promise<string[]> {
  if (!await hasRole(env, viewer.id, "mentor")) return [];
  const rows = await env.DB.prepare(
    `SELECT DISTINCT ma.student_user_id AS id
     FROM mentor_assignments ma
     JOIN user_accounts student ON student.id = ma.student_user_id
      AND student.status = 'active'
     WHERE ma.mentor_user_id = ?
       AND ma.active = 1
     ORDER BY ma.student_user_id ASC`,
  ).bind(viewer.id).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

export async function canViewPlatformAdmin(env: Env, viewer: UserAccount): Promise<boolean> {
  return isPlatformAdmin(env, viewer.id);
}

export async function canManageOrganizations(env: Env, viewer: UserAccount): Promise<boolean> {
  return isPlatformAdmin(env, viewer.id);
}

export async function canManageSites(env: Env, viewer: UserAccount, tenantId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) {
    return tenantId ? activeTenantExists(env, normalizeScopeId(tenantId)) : true;
  }
  return false;
}

export async function canViewOrgDashboard(env: Env, viewer: UserAccount, tenantId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) {
    return tenantId ? activeTenantExists(env, normalizeScopeId(tenantId)) : true;
  }
  return false;
}

export async function canViewSiteDashboard(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) {
    return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  }
  if (!await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) return false;
  return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
}

export async function canViewStudentDirectory(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (siteId && !await canAccessSite(env, viewer, siteId)) return false;
  if (await isPlatformAdmin(env, viewer.id)) return true;
  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    return siteId ? true : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (await hasRole(env, viewer.id, "viewer")) {
    const assignedStudents = await getViewerAssignedStudentIds(env, viewer.id);
    return assignedStudents.length > 0 && (!siteId || await hasStudentInSite(env, assignedStudents, siteId));
  }
  if (await hasRole(env, viewer.id, "program_teacher")) {
    const teacherScope = await getProgramTeacherScopedStudentIds(env, viewer);
    if (!teacherScope.valid) return false;
    if (!siteId) return true;
    return (await siteIdsForProgramTeacherScopes(env, await getRoleAssignments(env, viewer.id))).includes(siteId);
  }
  return false;
}

export async function canViewSiteStudentDetail(env: Env, viewer: UserAccount, studentId: string, siteId?: string): Promise<boolean> {
  return canViewScopedStudentRecord(env, viewer, studentId, siteId);
}

export async function canViewStudentTimeline(env: Env, viewer: UserAccount, studentId: string, siteId?: string): Promise<boolean> {
  return canViewScopedStudentRecord(env, viewer, studentId, siteId);
}

export async function canViewSiteStudentEvidence(env: Env, viewer: UserAccount, studentId: string, siteId?: string): Promise<boolean> {
  return canViewScopedStudentRecord(env, viewer, studentId, siteId);
}

export async function canDownloadStudentEvidence(env: Env, viewer: UserAccount, studentId: string, siteId?: string): Promise<boolean> {
  return canViewScopedStudentRecord(env, viewer, studentId, siteId);
}

export async function canViewReviewQueue(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (await hasAnyRole(env, viewer.id, ["site_admin"])) {
    return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (!await hasRole(env, viewer.id, "program_teacher")) return false;
  if (siteId && !await canAccessSite(env, viewer, siteId)) return false;
  return (await getProgramTeacherScopedStudentIds(env, viewer)).valid;
}

export async function canMutateReviewDecision(env: Env, viewer: UserAccount, submissionId: string): Promise<boolean> {
  const studentId = await studentIdForSubmission(env, submissionId);
  if (!studentId) return false;
  if (await isPlatformAdmin(env, viewer.id)) return true;
  if (await hasAnyRole(env, viewer.id, ["site_admin"])) {
    return canViewScopedStudentRecord(env, viewer, studentId);
  }
  if (!await hasRole(env, viewer.id, "program_teacher")) return false;
  return canAccessStudent(env, viewer, studentId);
}

export async function canAddStaffNote(env: Env, viewer: UserAccount, studentId: string, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? studentHasActiveSite(env, studentId, siteId) : studentExists(env, studentId);
  if (await hasAnyRole(env, viewer.id, ["site_admin"])) {
    return canViewScopedStudentRecord(env, viewer, studentId, siteId);
  }
  if (await hasRole(env, viewer.id, "program_teacher")) return canViewScopedStudentRecord(env, viewer, studentId, siteId);
  if (await hasRole(env, viewer.id, "mentor")) return canViewScopedStudentRecord(env, viewer, studentId, siteId);
  return false;
}

export async function canViewMentorAssignments(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (await hasRole(env, viewer.id, "program_teacher")) return siteId ? canAccessSite(env, viewer, siteId) : (await getProgramTeacherScopedStudentIds(env, viewer)).valid;
  if (await hasRole(env, viewer.id, "mentor")) return siteId ? canAccessSite(env, viewer, siteId) : (await getMentorAssignedStudentIds(env, viewer)).length > 0;
  return false;
}

export async function canManageMentorAssignments(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (!await hasAnyRole(env, viewer.id, ["site_admin", "administration", "program_teacher"])) return false;
  return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
}

export async function canViewPresentationOperations(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (await hasRole(env, viewer.id, "program_teacher")) return siteId ? canAccessSite(env, viewer, siteId) : (await getProgramTeacherScopedStudentIds(env, viewer)).valid;
  if (await hasRole(env, viewer.id, "mentor")) return siteId ? canAccessSite(env, viewer, siteId) : (await getMentorAssignedStudentIds(env, viewer)).length > 0;
  if (await hasRole(env, viewer.id, "student")) return siteId ? canAccessSite(env, viewer, siteId) : true;
  return false;
}

export async function canManagePresentationOperations(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (await hasAnyRole(env, viewer.id, ["site_admin"])) {
    return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (await hasRole(env, viewer.id, "program_teacher")) return siteId ? canAccessSite(env, viewer, siteId) : (await getProgramTeacherScopedStudentIds(env, viewer)).valid;
  return false;
}

export async function canViewArchiveOperations(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (await hasRole(env, viewer.id, "program_teacher")) return siteId ? canAccessSite(env, viewer, siteId) : (await getProgramTeacherScopedStudentIds(env, viewer)).valid;
  if (await hasRole(env, viewer.id, "mentor")) return siteId ? canAccessSite(env, viewer, siteId) : (await getMentorAssignedStudentIds(env, viewer)).length > 0;
  if (await hasRole(env, viewer.id, "student")) return siteId ? canAccessSite(env, viewer, siteId) : true;
  return false;
}

export async function canManageArchiveOperations(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (!await hasAnyRole(env, viewer.id, ["site_admin"])) return false;
  return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
}

export async function canViewReadinessReports(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id) || await isMiscAdmin(env, viewer.id)) return true;
  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
  }
  if (await hasRole(env, viewer.id, "program_teacher")) return siteId ? canAccessSite(env, viewer, siteId) : (await getProgramTeacherScopedStudentIds(env, viewer)).valid;
  if (await hasRole(env, viewer.id, "mentor")) return siteId ? canAccessSite(env, viewer, siteId) : (await getMentorAssignedStudentIds(env, viewer)).length > 0;
  if (await hasRole(env, viewer.id, "student")) return siteId ? canAccessSite(env, viewer, siteId) : true;
  return false;
}

export async function canViewAuditEvents(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (!await hasAnyRole(env, viewer.id, ["site_admin"])) return false;
  return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
}

export async function canManageSecurity(env: Env, viewer: UserAccount): Promise<boolean> {
  return isPlatformAdmin(env, viewer.id);
}

export async function canManageTenantConfig(env: Env, viewer: UserAccount, tenantId?: string): Promise<boolean> {
  if (await isPlatformAdmin(env, viewer.id)) {
    return tenantId ? activeTenantExists(env, normalizeScopeId(tenantId)) : true;
  }
  return false;
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
  if (await isGlobalAdmin(env, viewer.id)) {
    return true;
  }

  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    const viewerSiteIds = await getAccessibleSiteIds(env, viewer);
    const studentSiteIds = await activeSiteIdsForStudent(env, studentId);
    if (haveOverlap(viewerSiteIds, studentSiteIds)) return true;
  }

  if (await hasRole(env, viewer.id, "viewer")) {
    return (await getViewerAssignedStudentIds(env, viewer.id)).includes(studentId);
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
         (
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
  return isGlobalAdmin(env, viewer.id);
}

export async function canManageSiteUsers(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isGlobalAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (!await hasAnyRole(env, viewer.id, ["site_admin", "administration", "program_teacher"])) return false;
  return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
}

export async function canManageSitePrograms(env: Env, viewer: UserAccount, siteId?: string): Promise<boolean> {
  if (await isGlobalAdmin(env, viewer.id)) return siteId ? activeSiteExists(env, normalizeScopeId(siteId)) : true;
  if (!await hasRole(env, viewer.id, "site_admin")) return false;
  return siteId ? canAccessSite(env, viewer, siteId) : (await getAccessibleSiteIds(env, viewer)).length > 0;
}

function primaryRoleFor(ids: RoleId[]): RoleId | "role_pending" {
  for (const roleId of [
    "platform_admin",
    "admin",
    "site_admin",
    "program_teacher",
    "mentor",
    "viewer",
    "student",
    "misc_admin",
  ] as RoleId[]) {
    if (ids.includes(roleId)) return roleId;
  }
  return "role_pending";
}

function hasValidProgramTeacherScope(assignments: RoleAssignment[]): boolean {
  return assignments.some((assignment) => assignment.role_id === "program_teacher" && isValidProgramTeacherScope(assignment));
}

function isValidProgramTeacherScope(assignment: RoleAssignment): boolean {
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

async function canViewScopedStudentRecord(env: Env, viewer: UserAccount, studentId: string, siteId?: string): Promise<boolean> {
  const normalizedStudentId = normalizeScopeId(studentId);
  const normalizedSiteId = normalizeScopeId(siteId);
  if (!normalizedStudentId || !await studentExists(env, normalizedStudentId)) return false;
  if (normalizedSiteId && !await studentHasActiveSite(env, normalizedStudentId, normalizedSiteId)) return false;

  if (viewer.id === normalizedStudentId && await hasRole(env, viewer.id, "student")) return true;
  if (await isPlatformAdmin(env, viewer.id)) return true;
  if (await hasAnyRole(env, viewer.id, ["site_admin", "administration"])) {
    if (normalizedSiteId) return canAccessSite(env, viewer, normalizedSiteId);
    return haveOverlap(await getAccessibleSiteIds(env, viewer), await activeSiteIdsForStudent(env, normalizedStudentId));
  }
  if (await hasRole(env, viewer.id, "viewer")) {
    const assignedStudentIds = await getViewerAssignedStudentIds(env, viewer.id);
    return assignedStudentIds.includes(normalizedStudentId)
      && (!normalizedSiteId || await studentHasActiveSite(env, normalizedStudentId, normalizedSiteId));
  }
  if (await hasRole(env, viewer.id, "program_teacher")) {
    if (!await canAccessStudent(env, viewer, normalizedStudentId)) return false;
    return normalizedSiteId ? canAccessSite(env, viewer, normalizedSiteId) : true;
  }
  if (await hasRole(env, viewer.id, "mentor")) return canAccessStudent(env, viewer, normalizedStudentId);
  return false;
}

async function allActiveTenantIds(env: Env): Promise<string[]> {
  const rows = await env.DB.prepare(
    "SELECT id FROM tenants WHERE status = 'active' ORDER BY id ASC",
  ).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function allActiveSiteIds(env: Env): Promise<string[]> {
  const rows = await env.DB.prepare(
    "SELECT id FROM sites WHERE status = 'active' ORDER BY id ASC",
  ).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function activeTenantExists(env: Env, tenantId: string): Promise<boolean> {
  if (!tenantId) return false;
  const row = await env.DB.prepare(
    "SELECT 1 FROM tenants WHERE id = ? AND status = 'active' LIMIT 1",
  ).bind(tenantId).first();
  return Boolean(row);
}

async function activeSiteExists(env: Env, siteId: string): Promise<boolean> {
  if (!siteId) return false;
  const row = await env.DB.prepare(
    "SELECT 1 FROM sites WHERE id = ? AND status = 'active' LIMIT 1",
  ).bind(siteId).first();
  return Boolean(row);
}

async function activeTenantIdForSite(env: Env, siteId: string): Promise<string | null> {
  const row = await env.DB.prepare(
    "SELECT tenant_id FROM sites WHERE id = ? AND status = 'active' LIMIT 1",
  ).bind(siteId).first<{ tenant_id: string }>();
  return row?.tenant_id || null;
}

async function activeSiteIdsForTenant(env: Env, tenantId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    "SELECT id FROM sites WHERE tenant_id = ? AND status = 'active' ORDER BY id ASC",
  ).bind(tenantId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function activeSiteIdsForStudent(env: Env, studentId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT site_users.site_id AS id
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
     WHERE site_users.user_id = ?
       AND site_users.membership_status = 'active'
       AND sites.status = 'active'
     ORDER BY site_users.site_id ASC`,
  ).bind(studentId).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function siteIdsForMentorAssignments(env: Env, mentorId: string): Promise<string[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT site_users.site_id AS id
     FROM mentor_assignments ma
     JOIN site_users ON site_users.user_id = ma.student_user_id
      AND site_users.membership_status = 'active'
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE ma.mentor_user_id = ?
       AND ma.active = 1
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

async function hasStudentInSite(env: Env, studentIds: string[], siteId: string): Promise<boolean> {
  const normalizedSiteId = normalizeScopeId(siteId);
  if (!normalizedSiteId || !studentIds.length) return false;
  const placeholders = studentIds.map(() => "?").join(", ");
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_users
     WHERE site_users.site_id = ?
      AND site_users.user_id IN (${placeholders})
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(normalizedSiteId, ...studentIds).first();
  return Boolean(row);
}

async function studentHasActiveSite(env: Env, studentId: string, siteId: string): Promise<boolean> {
  const normalizedSiteId = normalizeScopeId(siteId);
  if (!normalizedSiteId) return false;
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
     WHERE site_users.user_id = ?
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
       AND sites.status = 'active'
     LIMIT 1`,
  ).bind(studentId, normalizedSiteId).first();
  return Boolean(row);
}

async function studentExists(env: Env, studentId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     WHERE user_accounts.id = ?
       AND user_accounts.status = 'active'
     LIMIT 1`,
  ).bind(studentId).first();
  return Boolean(row);
}

async function studentIdForSubmission(env: Env, submissionId: string): Promise<string | null> {
  const normalizedSubmissionId = normalizeScopeId(submissionId);
  if (!normalizedSubmissionId) return null;
  const row = await env.DB.prepare(
    "SELECT student_id FROM submissions WHERE id = ? LIMIT 1",
  ).bind(normalizedSubmissionId).first<{ student_id: string }>();
  return row?.student_id || null;
}

async function siteIdsForProgramTeacherScopes(env: Env, assignments: RoleAssignment[]): Promise<string[]> {
  const output = new Set<string>();
  const scopes = assignments.filter((assignment) => assignment.role_id === "program_teacher" && isValidProgramTeacherScope(assignment));
  for (const scope of scopes) {
    if (scope.scope_type === "program") {
      const rows = await env.DB.prepare(
        `SELECT sites.id
         FROM site_programs
         JOIN sites ON sites.id = site_programs.site_id
         WHERE site_programs.program_id = ?
           AND site_programs.active = 1
           AND sites.status = 'active'
         ORDER BY sites.id ASC`,
      ).bind(scope.scope_id).all<{ id: string }>();
      for (const row of rows.results || []) output.add(row.id);
    }
  }
  return Array.from(output).sort();
}

function scopedIds(assignments: RoleAssignment[], roleId: RoleId, scopeTypes: string[]): string[] {
  return assignments
    .filter((assignment) => assignment.role_id === roleId)
    .filter((assignment) => scopeTypes.includes(assignment.scope_type))
    .map((assignment) => normalizeScopeId(assignment.scope_id))
    .filter((scopeId) => scopeId !== "");
}

function normalizeScopeId(value: string | undefined | null): string {
  return String(value || "").trim();
}

function haveOverlap(left: string[], right: string[]): boolean {
  const leftSet = new Set(left);
  return right.some((value) => leftSet.has(value));
}
