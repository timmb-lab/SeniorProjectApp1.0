import type { Env, RoleAssignment, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "../_lib/auth.ts";
import { randomId } from "../_lib/crypto.ts";
import {
  GOOGLE_DRIVE_FOLDER_MIME_TYPE,
  getGoogleDriveAccessToken,
  googleDriveCredentialParts,
  parseGoogleDriveFolderUrl,
  probeGoogleDriveProgramFolder,
} from "../_lib/google-drive.ts";
import { badRequest, json, readJson, requirePost } from "../_lib/http.ts";
import { canAccessSite, getRoleAssignments, hasAnyRole, isGlobalAdmin } from "../_lib/permissions.ts";

type ProgramStorageAction = "configure" | "verify" | "disconnect";

interface ProgramStorageBody {
  action?: unknown;
  siteId?: unknown;
  programId?: unknown;
  folderUrl?: unknown;
  confirmedSharedWithApp?: unknown;
}

interface ProgramStorageRow {
  id: string;
  site_id: string;
  site_name: string;
  program_id: string;
  program_name: string;
  provider: string;
  ownership_mode: string;
  folder_url: string;
  folder_id: string;
  folder_name: string | null;
  status: string;
  revision: number;
  configured_by: string;
  verified_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const siteId = cleanId(url.searchParams.get("siteId"));
  const programId = cleanId(url.searchParams.get("programId"));
  if (!siteId || !programId) return badRequest("missing_storage_scope");

  const roles = await getRoleAssignments(env, user.id);
  if (!await canViewProgramStorage(env, user, roles, siteId, programId)) {
    await auditProgramStorage(env, request, user, roles, "program_storage_view_denied", siteId, programId);
    return json({ error: "forbidden" }, { status: 403 });
  }

  const scope = await loadProgramScope(env, siteId, programId);
  if (!scope) return json({ error: "program_scope_not_found" }, { status: 404 });
  const config = await loadProgramStorage(env, siteId, programId);
  const credentialParts = googleDriveCredentialParts(env);
  const canManage = await canManageProgramStorage(env, user, roles, siteId, programId);

  await auditProgramStorage(env, request, user, roles, "program_storage_viewed", siteId, programId, {
    configured: Boolean(config),
    status: config?.status || "not_configured",
  });

  return json({
    ok: true,
    scope,
    storage: safeProgramStorage(config, canManage),
    setup: {
      canManage,
      uploadMode: env.EVIDENCE_STORAGE_PROVIDER === "google_drive" ? "program_drive" : "link_only",
      appStorageConnectionReady: credentialParts.clientEmail && credentialParts.privateKey,
      shareWithEmail: canManage && credentialParts.clientEmail
        ? String(env.GOOGLE_DRIVE_CLIENT_EMAIL || "").trim()
        : "",
      steps: [
        "Create a folder inside a school Google Shared Drive.",
        "Share that folder with the app storage account as an Editor.",
        "Paste the folder link here and verify it before students upload files.",
      ],
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  let body: ProgramStorageBody;
  try {
    body = await readJson<ProgramStorageBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const action = cleanAction(body.action);
  const siteId = cleanId(body.siteId);
  const programId = cleanId(body.programId);
  if (!action || !siteId || !programId) return badRequest("missing_fields");

  const roles = await getRoleAssignments(env, user.id);
  if (!await canManageProgramStorage(env, user, roles, siteId, programId)) {
    await auditProgramStorage(env, request, user, roles, "program_storage_change_denied", siteId, programId, { action });
    return json({ error: "forbidden" }, { status: 403 });
  }
  if (!await loadProgramScope(env, siteId, programId)) return json({ error: "program_scope_not_found" }, { status: 404 });

  const existing = await loadProgramStorage(env, siteId, programId);
  if (action === "disconnect") {
    if (!existing) return json({ error: "storage_not_configured" }, { status: 404 });
    const nextRevision = Number(existing.revision || 0) + 1;
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE program_storage_configs
         SET status = 'disconnected', revision = ?, disconnected_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      ).bind(nextRevision, existing.id),
      storageHistoryStatement(env, existing.id, nextRevision, "disconnected", existing, user.id, "disconnected"),
    ]);
    await auditProgramStorage(env, request, user, roles, "program_storage_disconnected", siteId, programId, {
      revision: nextRevision,
      existingEvidencePreserved: true,
    });
    return json({ ok: true, storage: { status: "disconnected", revision: nextRevision }, existingEvidencePreserved: true });
  }

  const candidateUrl = action === "verify" ? existing?.folder_url : body.folderUrl;
  const parsedFolder = parseGoogleDriveFolderUrl(candidateUrl);
  if (!parsedFolder.ok || !parsedFolder.folderId || !parsedFolder.canonicalUrl) {
    return badRequest("invalid_google_drive_folder_url");
  }
  if (action === "configure" && body.confirmedSharedWithApp !== true) {
    return badRequest("drive_folder_share_confirmation_required");
  }

  const credentials = googleDriveCredentialParts(env);
  if (!credentials.clientEmail || !credentials.privateKey) {
    return json({ error: "drive_credentials_missing" }, { status: 503 });
  }

  let folderProbe;
  try {
    const token = await getGoogleDriveAccessToken(env);
    folderProbe = await probeGoogleDriveProgramFolder(token.accessToken, parsedFolder.folderId);
  } catch {
    return json({ error: "drive_provider_error" }, { status: 502 });
  }
  if (!folderProbe.ok) {
    await auditProgramStorage(env, request, user, roles, "program_storage_verification_failed", siteId, programId, {
      action,
      providerStatus: folderProbe.status,
    });
    return json({ error: "drive_folder_not_accessible" }, { status: 409 });
  }
  if (folderProbe.mimeType !== GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
    return badRequest("google_drive_folder_required");
  }
  if (!folderProbe.sharedDrive || !folderProbe.canAddChildren) {
    return badRequest("writable_shared_drive_folder_required");
  }

  const configId = existing?.id || randomId("program-storage");
  const revision = Number(existing?.revision || 0) + 1;
  const historyAction = action === "verify" ? "verified" : existing ? "replaced" : "configured";
  const nextRow = {
    folder_url: parsedFolder.canonicalUrl,
    folder_id: parsedFolder.folderId,
    folder_name: folderProbe.name || "Program files",
  };

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO program_storage_configs (
         id, site_id, program_id, folder_url, folder_id, folder_name, status, revision,
         configured_by, verified_by, verified_at, disconnected_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL)
       ON CONFLICT(site_id, program_id) DO UPDATE SET
         folder_url = excluded.folder_url,
         folder_id = excluded.folder_id,
         folder_name = excluded.folder_name,
         status = 'ready',
         revision = excluded.revision,
         configured_by = excluded.configured_by,
         verified_by = excluded.verified_by,
         verified_at = excluded.verified_at,
         disconnected_at = NULL,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    ).bind(
      configId,
      siteId,
      programId,
      nextRow.folder_url,
      nextRow.folder_id,
      nextRow.folder_name,
      revision,
      user.id,
      user.id,
    ),
    storageHistoryStatement(env, configId, revision, historyAction, nextRow, user.id, "ready"),
  ]);

  await auditProgramStorage(env, request, user, roles, `program_storage_${historyAction}`, siteId, programId, {
    revision,
    folderVerified: true,
    previousEvidencePreserved: Boolean(existing),
  });
  return json({
    ok: true,
    storage: {
      provider: "google_drive",
      ownershipMode: "teacher_managed_shared_folder",
      folderUrl: nextRow.folder_url,
      folderName: nextRow.folder_name,
      status: "ready",
      revision,
      verifiedAt: new Date().toISOString(),
    },
    previousEvidencePreserved: Boolean(existing),
  });
};

async function canManageProgramStorage(
  env: Env,
  user: UserAccount,
  roles: RoleAssignment[],
  siteId: string,
  programId: string,
): Promise<boolean> {
  if (await isGlobalAdmin(env, user.id)) return true;
  const exactProgramAssignment = roles.some((role) => (
    role.role_id === "program_teacher"
    && role.scope_type === "program"
    && role.scope_id === programId
  ));
  if (!exactProgramAssignment || !await canAccessSite(env, user, siteId)) return false;
  const siteMembership = await env.DB.prepare(
    `SELECT 1 FROM site_users
     WHERE site_id = ? AND user_id = ? AND membership_status = 'active'
     LIMIT 1`,
  ).bind(siteId, user.id).first();
  return Boolean(siteMembership);
}

async function canViewProgramStorage(
  env: Env,
  user: UserAccount,
  roles: RoleAssignment[],
  siteId: string,
  programId: string,
): Promise<boolean> {
  if (await canManageProgramStorage(env, user, roles, siteId, programId)) return true;
  return await hasAnyRole(env, user.id, ["site_admin", "administration"])
    && await canAccessSite(env, user, siteId);
}

async function loadProgramScope(env: Env, siteId: string, programId: string) {
  const row = await env.DB.prepare(
    `SELECT sites.id AS site_id, sites.name AS site_name, programs.id AS program_id, programs.name AS program_name
     FROM site_programs
     JOIN sites ON sites.id = site_programs.site_id AND sites.status = 'active'
     JOIN programs ON programs.id = site_programs.program_id AND programs.active = 1
     WHERE site_programs.site_id = ? AND site_programs.program_id = ? AND site_programs.active = 1
     LIMIT 1`,
  ).bind(siteId, programId).first<{ site_id: string; site_name: string; program_id: string; program_name: string }>();
  return row ? { siteId: row.site_id, siteName: row.site_name, programId: row.program_id, programName: row.program_name } : null;
}

async function loadProgramStorage(env: Env, siteId: string, programId: string): Promise<ProgramStorageRow | null> {
  return env.DB.prepare(
    `SELECT program_storage_configs.*, sites.name AS site_name, programs.name AS program_name
     FROM program_storage_configs
     JOIN sites ON sites.id = program_storage_configs.site_id
     JOIN programs ON programs.id = program_storage_configs.program_id
     WHERE program_storage_configs.site_id = ? AND program_storage_configs.program_id = ?
     LIMIT 1`,
  ).bind(siteId, programId).first<ProgramStorageRow>();
}

function safeProgramStorage(row: ProgramStorageRow | null, canManage: boolean) {
  if (!row) return { configured: false, status: "not_configured" };
  return {
    configured: true,
    provider: row.provider,
    ownershipMode: row.ownership_mode,
    folderUrl: canManage ? row.folder_url : "",
    folderName: row.folder_name || "Program files",
    status: row.status,
    revision: Number(row.revision || 1),
    verifiedAt: row.verified_at || "",
    disconnectedAt: row.disconnected_at || "",
    updatedAt: row.updated_at,
  };
}

function storageHistoryStatement(
  env: Env,
  configId: string,
  revision: number,
  action: "configured" | "replaced" | "verified" | "disconnected",
  row: { folder_url: string; folder_id: string; folder_name: string | null },
  userId: string,
  status: "ready" | "needs_attention" | "disconnected",
) {
  return env.DB.prepare(
    `INSERT INTO program_storage_history (
       id, storage_config_id, revision, action, folder_url, folder_id, folder_name, status, changed_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    randomId("program-storage-history"),
    configId,
    revision,
    action,
    row.folder_url,
    row.folder_id,
    row.folder_name,
    status,
    userId,
  );
}

async function auditProgramStorage(
  env: Env,
  request: Request,
  user: UserAccount,
  roles: RoleAssignment[],
  action: string,
  siteId: string,
  programId: string,
  metadata: Record<string, unknown> = {},
) {
  await writeAudit(env, {
    actorUserId: user.id,
    action,
    entityType: "program_storage",
    entityId: `${siteId}:${programId}`,
    request,
    metadata: {
      ...metadata,
      siteId,
      programId,
      actorRoleScopes: roles.map((role) => ({ roleId: role.role_id, scopeType: role.scope_type, scopeId: role.scope_id })),
    },
  });
}

function cleanAction(value: unknown): ProgramStorageAction | "" {
  const action = String(value || "").trim();
  return action === "configure" || action === "verify" || action === "disconnect" ? action : "";
}

function cleanId(value: unknown): string {
  const id = typeof value === "string" ? value.trim() : "";
  return /^[a-zA-Z0-9_-]{1,120}$/.test(id) ? id : "";
}
