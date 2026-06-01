import type { Env, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { loadEffectiveAccess } from "../../_lib/effective-access.ts";
import { badRequest, json, readJson, requirePost } from "../../_lib/http.ts";
import { canManageSitePrograms } from "../../_lib/permissions.ts";
import { cleanId, resolveSiteSelection, type SiteScopeContext } from "../../_lib/site-scope.ts";

interface SiteProgramBody {
  action?: unknown;
  siteId?: unknown;
  programId?: unknown;
  adminNote?: unknown;
}

type SiteProgramAction = "assign" | "remove";

interface SiteProgramRow {
  id: string;
  name: string;
  created_at?: string;
  previously_removed?: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const context = await siteContext(env, user);
  if (!await canManageSitePrograms(env, user)) {
    await auditSitePrograms(env, request, user, context, "security.denied_access", {
      reason: "role_not_allowed_for_site_programs",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const requestedSiteId = cleanId(url.searchParams.get("siteId"));
  const selection = await resolveProgramsSelection(env, user, context, requestedSiteId);

  if (selection.kind === "denied") {
    await auditSitePrograms(env, request, user, context, "security.denied_access", {
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
  const [activePrograms, availablePrograms] = await Promise.all([
    loadActiveSitePrograms(env, siteId),
    loadAvailablePrograms(env, siteId),
  ]);

  await auditSitePrograms(env, request, user, context, "site_programs_viewed", {
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
    activePrograms: activePrograms.map(programOption),
    availablePrograms: availablePrograms.map((row) => ({
      ...programOption(row),
      previouslyRemoved: Number(row.previously_removed || 0) === 1,
    })),
    permissions: {
      canManageSitePrograms: true,
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const context = await siteContext(env, user);
  let body: SiteProgramBody;
  try {
    body = await readJson<SiteProgramBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const action = cleanProgramAction(body.action);
  const siteId = cleanId(typeof body.siteId === "string" ? body.siteId : null);
  const programId = cleanId(typeof body.programId === "string" ? body.programId : null);
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : "";

  if (!action || !siteId || !programId) return badRequest("missing_fields");
  if (!adminNote) return badRequest("missing_admin_note");
  if (!await canManageSitePrograms(env, user, siteId)) {
    await auditSitePrograms(env, request, user, context, "security.denied_access", {
      reason: "site_not_manageable",
      siteId,
      programId,
      action,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (action === "assign") {
    if (!await activeProgramExists(env, programId)) {
      return json({ error: "program_not_found", ok: false }, { status: 404 });
    }
    await upsertSiteProgram(env, siteId, programId, "assign");
  } else {
    if (!await activeSiteProgramExists(env, siteId, programId)) {
      return json({ error: "program_not_assigned", ok: false }, { status: 404 });
    }
    await upsertSiteProgram(env, siteId, programId, "remove");
  }

  await auditSitePrograms(env, request, user, context, auditActionFor(action), {
    action,
    siteId,
    programId,
    adminNote,
    result: "success",
  });

  return json({
    ok: true,
    action,
    siteId,
    programId,
  });
};

async function resolveProgramsSelection(env: Env, user: UserAccount, context: SiteScopeContext, requestedSiteId: string) {
  return resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canManageSitePrograms(env, user, siteId),
    defaultSiteRoleIds: ["global_admin", "admin", "platform_admin"],
  });
}

async function siteContext(env: Env, user: UserAccount): Promise<SiteScopeContext> {
  const access = await loadEffectiveAccess(env, user);
  return {
    roles: access.roles,
    roleIds: access.roleIds,
    primaryRole: access.primaryRole,
  };
}

async function loadActiveSitePrograms(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT programs.id, programs.name, site_programs.created_at
     FROM site_programs
     JOIN programs ON programs.id = site_programs.program_id
      AND programs.active = 1
     WHERE site_programs.site_id = ?
      AND site_programs.active = 1
     ORDER BY programs.name ASC`,
  ).bind(siteId).all<SiteProgramRow>();
  return rows.results || [];
}

async function loadAvailablePrograms(env: Env, siteId: string) {
  const rows = await env.DB.prepare(
    `SELECT
       programs.id,
       programs.name,
       CASE WHEN site_programs.program_id IS NOT NULL AND site_programs.active = 0 THEN 1 ELSE 0 END AS previously_removed
     FROM programs
     LEFT JOIN site_programs
       ON site_programs.site_id = ?
      AND site_programs.program_id = programs.id
     WHERE programs.active = 1
      AND (site_programs.program_id IS NULL OR site_programs.active = 0)
     ORDER BY programs.name ASC`,
  ).bind(siteId).all<SiteProgramRow>();
  return rows.results || [];
}

async function activeProgramExists(env: Env, programId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT 1 FROM programs WHERE id = ? AND active = 1 LIMIT 1",
  ).bind(programId).first();
  return Boolean(row);
}

async function activeSiteProgramExists(env: Env, siteId: string, programId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_programs
     WHERE site_id = ?
      AND program_id = ?
      AND active = 1
     LIMIT 1`,
  ).bind(siteId, programId).first();
  return Boolean(row);
}

async function upsertSiteProgram(env: Env, siteId: string, programId: string, action: SiteProgramAction): Promise<void> {
  if (action === "remove") {
    await env.DB.prepare(
      `UPDATE site_programs
       SET active = 0
       WHERE site_id = ?
        AND program_id = ?
        AND active = 1`,
    ).bind(siteId, programId).run();
    return;
  }
  await env.DB.prepare(
    `INSERT INTO site_programs (site_id, program_id, active)
     VALUES (?, ?, 1)
     ON CONFLICT(site_id, program_id) DO UPDATE SET active = 1`,
  ).bind(siteId, programId).run();
}

function programOption(row: SiteProgramRow) {
  return {
    programId: row.id,
    programName: row.name,
    assignedAt: row.created_at || "",
  };
}

function cleanProgramAction(value: unknown): SiteProgramAction | "" {
  const normalized = String(value || "").trim();
  return normalized === "assign" || normalized === "remove" ? normalized : "";
}

function auditActionFor(action: SiteProgramAction): string {
  return action === "remove" ? "site_program_removed" : "site_program_assigned";
}

async function auditSitePrograms(
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
    entityType: "site_program_assignment",
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
