import type { Env, RoleId, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { isGoogleSsoEnabled, isManagedLocalAccountCreationEnabled } from "../../../_lib/auth-config.ts";
import { hashPassword, newRandomToken, normalizeEmail, randomId, validatePassword } from "../../../_lib/crypto.ts";
import {
  canActorCreateRole,
  loadEffectiveAccess,
} from "../../../_lib/effective-access.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import { cleanWorkflowText, workflowError } from "../../../_lib/workflow.ts";

type RoleScopeType = "global" | "site" | "program" | "cohort";
type IdentityInput = "local" | "sso";

interface ImportUserInput {
  email?: unknown;
  displayName?: unknown;
  fullName?: unknown;
  roleId?: unknown;
  scopeType?: unknown;
  scopeId?: unknown;
  siteId?: unknown;
  siteIds?: unknown;
  programIds?: unknown;
  studentIds?: unknown;
  identityType?: unknown;
  signInMethod?: unknown;
  globalAdminConfirmation?: unknown;
}

interface ImportUsersBody {
  reason?: unknown;
  adminNote?: unknown;
  users?: unknown;
}

interface NormalizedImportUser {
  email: string;
  emailNorm: string;
  displayName: string;
  roleId: RoleId;
  identityType: IdentityInput;
  siteIds: string[];
  programIds: string[];
  studentIds: string[];
  legacyScopeType: RoleScopeType;
  legacyScopeId: string;
  globalAdminConfirmation: boolean;
}

interface ExistingUserRow {
  id: string;
}

interface RoleExistsRow {
  id: string;
}

const MAX_IMPORT_USERS = 25;
const LOCAL_ONLY_GLOBAL_ADMIN_MESSAGE = "Global Admin must use a local login so platform access is still available if SSO is unavailable.";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const caller = await getCurrentUser(request, env);
  if (!caller) return workflowError("unauthorized", 401);
  const actorAccess = await loadEffectiveAccess(env, caller);
  if (!canUseUserImport(actorAccess)) {
    await auditRejected(env, request, caller, "forbidden", { requiredRole: "global_admin_school_admin_site_admin_or_program_teacher" });
    return workflowError("forbidden", 403);
  }

  let body: ImportUsersBody;
  try {
    body = await readJson<ImportUsersBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const adminNote = cleanWorkflowText(body.adminNote ?? body.reason, "", 500);
  if (!adminNote) return badRequest("missing_admin_note");
  if (!Array.isArray(body.users) || body.users.length === 0) return badRequest("missing_users");
  if (body.users.length > MAX_IMPORT_USERS) return badRequest("too_many_users");

  const normalizedUsers: NormalizedImportUser[] = [];
  const seenEmails = new Set<string>();
  for (const userInput of body.users) {
    const normalized = normalizeUserInput(userInput);
    if (!normalized) return badRequest("invalid_user");
    if (seenEmails.has(normalized.emailNorm)) return badRequest("duplicate_email");
    seenEmails.add(normalized.emailNorm);

    const validation = await validateUser(env, caller, normalized, adminNote);
    if (!validation.ok) {
      await auditRejected(env, request, caller, validation.error, {
        roleId: normalized.roleId,
        siteIds: normalized.siteIds,
        programIds: normalized.programIds,
        studentIds: normalized.studentIds,
      });
      return json({ ok: false, error: validation.error, message: validation.message }, { status: validation.status });
    }

    normalizedUsers.push(normalized);
  }

  const realLocalUserCount = normalizedUsers.filter((user) => (
    user.identityType === "local" && !isFakeTestEmail(user.emailNorm)
  )).length;
  if (realLocalUserCount > 0 && !isManagedLocalAccountCreationEnabled(env)) {
    await writeAudit(env, {
      actorUserId: caller.id,
      action: "user.create_rejected",
      entityType: "user_import_batch",
      entityId: null,
      request,
      metadata: {
        reason: "credential_delivery_policy_required",
        userCount: normalizedUsers.length,
        realLocalUserCount,
        temporaryCredentialDelivery: "one_time_admin_display",
        managedLocalAccountCreationEnabled: false,
      },
    });

    return json({
      ok: false,
      error: "credential_delivery_policy_required",
      message: "Real local-account creation is available only when local-account setup is enabled for this environment.",
    }, { status: 403 });
  }

  for (const user of normalizedUsers) {
    const existing = await env.DB.prepare(
      "SELECT id FROM user_accounts WHERE email_norm = ? LIMIT 1",
    ).bind(user.emailNorm).first<ExistingUserRow>();
    if (existing) return workflowError("email_already_exists", 409);

    const role = await env.DB.prepare("SELECT id FROM roles WHERE id = ? LIMIT 1")
      .bind(user.roleId)
      .first<RoleExistsRow>();
    if (!role) return workflowError("role_not_found", 404);
  }

  const imported = [];
  for (const user of normalizedUsers) {
    const userId = randomId("user");
    const temporaryPassword = user.identityType === "local" ? generateTemporaryPassword(user) : "";
    const credential = temporaryPassword
      ? await hashPassword(temporaryPassword, env.PASSWORD_PEPPER || "")
      : null;

    await env.DB.prepare(
      `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(
      userId,
      user.email,
      user.emailNorm,
      user.displayName,
      user.identityType === "local" ? "pending_reset" : "active",
    ).run();

    if (credential) {
      await env.DB.prepare(
        `INSERT INTO password_credentials (
           user_id,
           password_hash,
           password_salt,
           algorithm,
           iterations,
           requires_reset
         )
         VALUES (?, ?, ?, ?, ?, 1)`,
      ).bind(userId, credential.hash, credential.salt, credential.algorithm, credential.iterations).run();
    }

    await createRoleAndAssignments(env, {
      actorId: caller.id,
      targetUserId: userId,
      user,
    });

    await writeAudit(env, {
      actorUserId: caller.id,
      action: "user.created",
      entityType: "user_account",
      entityId: userId,
      request,
      metadata: {
        adminNote,
        roleId: user.roleId,
        identityType: user.identityType,
        siteIds: user.siteIds,
        programIds: user.programIds,
        studentIds: user.studentIds,
        temporaryCredentialReturnedOnce: Boolean(temporaryPassword),
      },
    });

    if (user.roleId === "global_admin") {
      await writeAudit(env, {
        actorUserId: caller.id,
        action: "access.global_admin_granted",
        entityType: "user_account",
        entityId: userId,
        request,
        metadata: {
          adminNote,
          identityType: user.identityType,
          localCredentialRequired: true,
        },
      });
    }

    imported.push({
      id: userId,
      email: user.email,
      displayName: user.displayName,
      status: user.identityType === "local" ? "pending_reset" : "active",
      role: roleResponse(user),
      access: accessSummary(user),
      identityType: user.identityType,
      temporaryPassword: temporaryPassword || undefined,
      delivery: temporaryPassword ? "one_time_admin_display" : "sso_first_sign_in",
      mustReset: Boolean(temporaryPassword),
      nextSteps: nextStepsFor(user),
    });
  }

  await writeAudit(env, {
    actorUserId: caller.id,
    action: "user.create_batch_completed",
    entityType: "user_import_batch",
    entityId: `batch:${imported.length}`,
    request,
    metadata: {
      adminNote,
      importedCount: imported.length,
      roleIds: Array.from(new Set(normalizedUsers.map((user) => user.roleId))),
      temporaryCredentialsReturnedOnce: imported.some((user) => Boolean(user.temporaryPassword)),
    },
  });

  return json({
    ok: true,
    importedCount: imported.length,
    users: imported,
  });
};

function canUseUserImport(actorAccess: Awaited<ReturnType<typeof loadEffectiveAccess>>): boolean {
  return actorAccess.isGlobalAdmin
    || actorAccess.canonicalRoleIds.includes("site_admin")
    || actorAccess.canonicalRoleIds.includes("administration")
    || actorAccess.canonicalRoleIds.includes("program_teacher");
}

function normalizeUserInput(value: unknown): NormalizedImportUser | null {
  if (!value || typeof value !== "object") return null;
  const input = value as ImportUserInput;
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const emailNorm = normalizeEmail(email);
  const displayName = cleanWorkflowText(input.fullName ?? input.displayName, "", 120);
  const roleId = typeof input.roleId === "string" ? cleanRoleId(input.roleId) : null;
  const identityType = cleanIdentityType(input.identityType ?? input.signInMethod);
  const legacyScopeType = cleanScopeType(input.scopeType) || "global";
  const legacyScopeId = cleanId(input.scopeId);
  const siteIds = uniqueIds([
    ...idsFrom(input.siteIds),
    cleanId(input.siteId),
    legacyScopeType === "site" ? legacyScopeId : "",
  ]);
  const programIds = uniqueIds([
    ...idsFrom(input.programIds),
    legacyScopeType === "program" ? legacyScopeId : "",
  ]);
  const studentIds = uniqueIds(input.studentIds);

  if (!isValidEmail(email) || !displayName || !roleId || !identityType) return null;

  return {
    email,
    emailNorm,
    displayName,
    roleId,
    identityType,
    siteIds,
    programIds,
    studentIds,
    legacyScopeType,
    legacyScopeId,
    globalAdminConfirmation: input.globalAdminConfirmation === true || input.globalAdminConfirmation === "true",
  };
}

async function validateUser(
  env: Env,
  caller: UserAccount,
  user: NormalizedImportUser,
  adminNote: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string; message: string }> {
  const roleId = user.roleId;
  if (user.identityType === "sso" && !isGoogleSsoEnabled(env)) {
    return reject(400, "sso_disabled", "SSO account creation is disabled. Choose Local account.");
  }

  if (roleId === "global_admin") {
    if (!await canActorCreateRole(env, caller, roleId, [])) {
      return reject(403, "global_admin_creator_forbidden", "Only a Global Admin can create another Global Admin.");
    }
    if (user.identityType !== "local") {
      return reject(400, "global_admin_requires_local_account", LOCAL_ONLY_GLOBAL_ADMIN_MESSAGE);
    }
    if (!adminNote) return reject(400, "global_admin_requires_admin_note", "Global Admin requires an admin note.");
    if (!user.globalAdminConfirmation) {
      return reject(400, "global_admin_confirmation_required", "Confirm that this account can manage every site.");
    }
    return { ok: true };
  }

  if (roleId === "site_admin" || roleId === "administration") {
    if (!user.siteIds.length) return reject(400, `${roleId}_requires_site_assignment`, "Choose at least one site for this role.");
    if (!await canActorCreateRole(env, caller, roleId, user.siteIds)) {
      return reject(403, "site_assignment_forbidden", "You can only assign users inside sites you manage.");
    }
    for (const siteId of user.siteIds) {
      if (!await activeSiteExists(env, siteId)) return reject(404, "site_not_found", "The selected site was not found.");
    }
    return { ok: true };
  }

  if (roleId === "student") {
    if (!user.siteIds.length) return reject(400, "student_requires_site_assignment", "Choose at least one site for this student.");
    if (!await canActorCreateRole(env, caller, roleId, user.siteIds)) {
      return reject(403, "student_site_assignment_forbidden", "You can only create students inside sites you manage.");
    }
    for (const siteId of user.siteIds) {
      if (!await activeSiteExists(env, siteId)) return reject(404, "site_not_found", "The selected site was not found.");
    }
    return { ok: true };
  }

  if (roleId === "program_teacher") {
    if (!user.programIds.length) return reject(400, "program_teacher_requires_program_assignment", "Choose at least one program for this Program Teacher.");
    const siteIds = await siteIdsForPrograms(env, user.programIds);
    if (!siteIds.length) return reject(404, "program_not_found", "The selected program was not found for an active site.");
    if (!await canActorCreateRole(env, caller, roleId, siteIds)) {
      return reject(403, "program_assignment_forbidden", "You can only assign programs inside sites you manage.");
    }
    return { ok: true };
  }

  if (!await canActorCreateRole(env, caller, roleId, user.siteIds)) {
    return reject(403, "role_creation_forbidden", "You do not have permission to create that role.");
  }

  for (const siteId of user.siteIds) {
    if (!await activeSiteExists(env, siteId)) return reject(404, "site_not_found", "The selected site was not found.");
  }

  for (const studentId of user.studentIds) {
    if (!await activeStudentExists(env, studentId)) return reject(404, "student_not_found", "One of the selected students was not found.");
  }

  return { ok: true };
}

async function createRoleAndAssignments(
  env: Env,
  input: {
    actorId: string;
    targetUserId: string;
    user: NormalizedImportUser;
  },
): Promise<void> {
  const { actorId, targetUserId, user } = input;
  if (user.roleId === "site_admin" || user.roleId === "administration") {
    for (const siteId of user.siteIds) {
      await insertRole(env, targetUserId, user.roleId, "site", siteId, actorId);
      await insertSiteMembership(env, siteId, targetUserId);
    }
    return;
  }

  if (user.roleId === "program_teacher") {
    for (const programId of user.programIds) {
      await insertRole(env, targetUserId, "program_teacher", "program", programId, actorId);
    }
    for (const siteId of await siteIdsForPrograms(env, user.programIds)) {
      await insertSiteMembership(env, siteId, targetUserId);
    }
    return;
  }

  await insertRole(env, targetUserId, user.roleId, "global", "", actorId);
  for (const siteId of user.siteIds) await insertSiteMembership(env, siteId, targetUserId);

  if (user.roleId === "mentor") {
    for (const studentId of user.studentIds) {
      await env.DB.prepare(
        `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(mentor_user_id, student_user_id) DO UPDATE SET active = 1, assigned_by = excluded.assigned_by`,
      ).bind(randomId("mentor_student_assignment"), targetUserId, studentId, actorId).run();
      for (const siteId of await siteIdsForStudents(env, [studentId])) await insertSiteMembership(env, siteId, targetUserId);
    }
  }

  if (user.roleId === "viewer") {
    for (const studentId of user.studentIds) {
      await env.DB.prepare(
        `INSERT INTO viewer_student_assignments (id, viewer_user_id, student_user_id, assigned_by, active)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(viewer_user_id, student_user_id) DO UPDATE SET active = 1, assigned_by = excluded.assigned_by, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ).bind(randomId("viewer_student_assignment"), targetUserId, studentId, actorId).run();
      for (const siteId of await siteIdsForStudents(env, [studentId])) await insertSiteMembership(env, siteId, targetUserId);
    }
  }
}

async function insertRole(
  env: Env,
  userId: string,
  roleId: RoleId,
  scopeType: RoleScopeType,
  scopeId: string,
  assignedBy: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(userId, roleId, scopeType, scopeId, assignedBy).run();
}

async function insertSiteMembership(env: Env, siteId: string, userId: string): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO site_users (site_id, user_id, membership_status)
     VALUES (?, ?, 'active')`,
  ).bind(siteId, userId).run();
}

function generateTemporaryPassword(user: NormalizedImportUser): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const password = `N9!aA-${newRandomToken(20)}-zZ`;
    if (validatePassword(password, { email: user.email, displayName: user.displayName }).length === 0) {
      return password;
    }
  }
  return `N9!aA-${newRandomToken(32)}-zZ`;
}

function roleResponse(user: NormalizedImportUser) {
  if (user.roleId === "site_admin" || user.roleId === "administration") {
    return { roleId: user.roleId, scopeType: "site", scopeId: user.siteIds[0] || "" };
  }
  if (user.roleId === "program_teacher") {
    return { roleId: user.roleId, scopeType: "program", scopeId: user.programIds[0] || "" };
  }
  return { roleId: user.roleId, scopeType: "global", scopeId: "" };
}

function accessSummary(user: NormalizedImportUser): string {
  if (user.roleId === "global_admin") return "Entire platform";
  if (user.siteIds.length) return `${user.siteIds.length} site${user.siteIds.length === 1 ? "" : "s"}`;
  if (user.programIds.length) return `${user.programIds.length} program${user.programIds.length === 1 ? "" : "s"}`;
  if (user.studentIds.length) return `${user.studentIds.length} assigned student${user.studentIds.length === 1 ? "" : "s"}`;
  if (user.roleId === "student") return "Self only";
  return "Assignment required";
}

function nextStepsFor(user: NormalizedImportUser): string[] {
  if (user.roleId === "student") return ["Link or confirm the student profile."];
  if (user.roleId === "mentor") return user.studentIds.length ? ["Confirm mentor/student assignments."] : ["Assign students to this mentor."];
  if (user.roleId === "viewer") return user.studentIds.length ? ["Confirm read-only viewer/student assignments."] : ["Assign students this viewer can see."];
  if (user.roleId === "program_teacher") return ["Confirm program assignment."];
  if (user.roleId === "administration") return ["Confirm site access."];
  if (user.roleId === "site_admin") return ["Confirm site assignment."];
  if (user.roleId === "global_admin") return ["Store local login credentials securely."];
  return [];
}

async function activeSiteExists(env: Env, siteId: string): Promise<boolean> {
  const row = await env.DB.prepare("SELECT 1 FROM sites WHERE id = ? AND status = 'active' LIMIT 1")
    .bind(siteId)
    .first();
  return Boolean(row);
}

async function activeStudentExists(env: Env, studentId: string): Promise<boolean> {
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

async function siteIdsForPrograms(env: Env, programIds: string[]): Promise<string[]> {
  if (!programIds.length) return [];
  const placeholders = programIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT DISTINCT site_programs.site_id AS id
     FROM site_programs
     JOIN sites ON sites.id = site_programs.site_id
      AND sites.status = 'active'
     WHERE site_programs.program_id IN (${placeholders})
      AND site_programs.active = 1
     ORDER BY site_programs.site_id ASC`,
  ).bind(...programIds).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function siteIdsForStudents(env: Env, studentIds: string[]): Promise<string[]> {
  if (!studentIds.length) return [];
  const placeholders = studentIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT DISTINCT site_users.site_id AS id
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE site_users.user_id IN (${placeholders})
      AND site_users.membership_status = 'active'
     ORDER BY site_users.site_id ASC`,
  ).bind(...studentIds).all<{ id: string }>();
  return (rows.results || []).map((row) => row.id);
}

async function auditRejected(
  env: Env,
  request: Request,
  caller: UserAccount,
  reason: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await writeAudit(env, {
    actorUserId: caller.id,
    action: "access.scope_validation_rejected",
    entityType: "user_account",
    entityId: null,
    request,
    metadata: {
      reason,
      result: "rejected",
      ...metadata,
    },
  });
}

function cleanRoleId(value: string): RoleId | null {
  const trimmed = value.trim();
  if (trimmed === "admin" || trimmed === "platform_admin") return "global_admin";
  if (trimmed === "misc_admin") return null;
  return [
    "student",
    "mentor",
    "viewer",
    "program_teacher",
    "administration",
    "site_admin",
    "global_admin",
  ].includes(trimmed) ? (trimmed as RoleId) : null;
}

function cleanScopeType(value: unknown): RoleScopeType | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return ["global", "site", "program", "cohort"].includes(trimmed) ? (trimmed as RoleScopeType) : null;
}

function cleanIdentityType(value: unknown): IdentityInput | null {
  const normalized = String(value || "local").trim().toLowerCase();
  if (["local", "local_account", "password"].includes(normalized)) return "local";
  if (["sso", "sso_account", "google", "google_workspace"].includes(normalized)) return "sso";
  return null;
}

function idsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(cleanId).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(cleanId).filter(Boolean);
  return [];
}

function cleanId(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed && /^[a-zA-Z0-9_.:-]+$/.test(trimmed) ? trimmed : "";
}

function uniqueIds(values: unknown): string[] {
  const input = Array.isArray(values) ? values : [values];
  return Array.from(new Set(input.map(cleanId).filter(Boolean)));
}

function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isFakeTestEmail(emailNorm: string): boolean {
  return emailNorm.endsWith(".test");
}

function reject(status: number, error: string, message: string) {
  return { ok: false as const, status, error, message };
}
