import type { Env, RoleId } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { hashPassword, newRandomToken, normalizeEmail, randomId, validatePassword } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import { isAdmin } from "../../../_lib/permissions.ts";
import { cleanWorkflowText, workflowError } from "../../../_lib/workflow.ts";

type RoleScopeType = "global" | "program" | "cohort";

interface ImportUserInput {
  email?: unknown;
  displayName?: unknown;
  roleId?: unknown;
  scopeType?: unknown;
  scopeId?: unknown;
}

interface ImportUsersBody {
  reason?: unknown;
  users?: unknown;
}

interface NormalizedImportUser {
  email: string;
  emailNorm: string;
  displayName: string;
  roleId: RoleId;
  scopeType: RoleScopeType;
  scopeId: string;
}

interface ExistingUserRow {
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

const MAX_IMPORT_USERS = 25;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const caller = await getCurrentUser(request, env);
  if (!caller) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, caller.id)) return workflowError("forbidden", 403);

  let body: ImportUsersBody;
  try {
    body = await readJson<ImportUsersBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const reason = cleanWorkflowText(body.reason, "", 500);
  if (!reason) return badRequest("missing_reason");
  if (!Array.isArray(body.users) || body.users.length === 0) return badRequest("missing_users");
  if (body.users.length > MAX_IMPORT_USERS) return badRequest("too_many_users");

  const normalizedUsers: NormalizedImportUser[] = [];
  const seenEmails = new Set<string>();
  for (const userInput of body.users) {
    const normalized = normalizeUserInput(userInput);
    if (!normalized) return badRequest("invalid_user");
    if (seenEmails.has(normalized.emailNorm)) return badRequest("duplicate_email");
    seenEmails.add(normalized.emailNorm);
    if (!isValidScope(normalized.roleId, normalized.scopeType, normalized.scopeId)) {
      return badRequest("invalid_role_scope");
    }
    normalizedUsers.push(normalized);
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

    if (user.roleId === "program_teacher" && user.scopeType === "program") {
      const program = await env.DB.prepare("SELECT id FROM programs WHERE id = ? LIMIT 1")
        .bind(user.scopeId)
        .first<ProgramExistsRow>();
      if (!program) return workflowError("program_not_found", 404);
    }

    if (user.roleId === "program_teacher" && user.scopeType === "cohort") {
      const cohort = await env.DB.prepare("SELECT id FROM cohorts WHERE id = ? LIMIT 1")
        .bind(user.scopeId)
        .first<CohortExistsRow>();
      if (!cohort) return workflowError("cohort_not_found", 404);
    }
  }

  const imported = [];
  for (const user of normalizedUsers) {
    const userId = randomId("user");
    const temporaryPassword = generateTemporaryPassword(user);
    const credential = await hashPassword(temporaryPassword, env.PASSWORD_PEPPER || "");

    await env.DB.prepare(
      `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
       VALUES (?, ?, ?, ?, 'pending_reset')`,
    ).bind(userId, user.email, user.emailNorm, user.displayName).run();

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

    await env.DB.prepare(
      `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(userId, user.roleId, user.scopeType, user.scopeId, caller.id).run();

    await writeAudit(env, {
      actorUserId: caller.id,
      action: "admin_user_imported",
      entityType: "user_account",
      entityId: userId,
      request,
      metadata: {
        reason,
        roleId: user.roleId,
        scopeType: user.scopeType,
        scopeId: user.scopeId,
        credentialPolicy: "temporary_password_requires_reset",
        temporaryCredentialReturnedOnce: true,
      },
    });

    imported.push({
      id: userId,
      email: user.email,
      displayName: user.displayName,
      status: "pending_reset",
      role: {
        roleId: user.roleId,
        scopeType: user.scopeType,
        scopeId: user.scopeId,
      },
      temporaryPassword,
      delivery: "one_time_admin_display",
      mustReset: true,
    });
  }

  await writeAudit(env, {
    actorUserId: caller.id,
    action: "admin_users_import_completed",
    entityType: "user_import_batch",
    entityId: `batch:${imported.length}`,
    request,
    metadata: {
      reason,
      importedCount: imported.length,
      roleIds: Array.from(new Set(normalizedUsers.map((user) => user.roleId))),
      temporaryCredentialsReturnedOnce: true,
    },
  });

  return json({
    ok: true,
    importedCount: imported.length,
    users: imported,
  });
};

function normalizeUserInput(value: unknown): NormalizedImportUser | null {
  if (!value || typeof value !== "object") return null;
  const input = value as ImportUserInput;
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const emailNorm = normalizeEmail(email);
  const displayName = cleanWorkflowText(input.displayName, "", 120);
  const roleId = typeof input.roleId === "string" ? cleanRoleId(input.roleId) : null;
  const scopeType = typeof input.scopeType === "string" ? cleanScopeType(input.scopeType) : null;
  const scopeId = typeof input.scopeId === "string" ? cleanScopeId(input.scopeId) : "";

  if (!isValidEmail(email) || !displayName || !roleId || !scopeType) return null;

  return {
    email,
    emailNorm,
    displayName,
    roleId,
    scopeType,
    scopeId,
  };
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

function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidScope(roleId: RoleId, scopeType: RoleScopeType, scopeId: string): boolean {
  if (roleId !== "program_teacher") {
    return scopeType === "global" && scopeId === "";
  }
  if (scopeType === "global") return scopeId === "";
  return scopeId !== "";
}

function cleanRoleId(value: string): RoleId | null {
  const trimmed = value.trim();
  return ["student", "mentor", "program_teacher", "admin", "misc_admin"].includes(trimmed) ? (trimmed as RoleId) : null;
}

function cleanScopeType(value: string): RoleScopeType | null {
  const trimmed = value.trim();
  return ["global", "program", "cohort"].includes(trimmed) ? (trimmed as RoleScopeType) : null;
}

function cleanScopeId(value: string): string {
  const trimmed = value.trim();
  return trimmed && /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : "";
}
