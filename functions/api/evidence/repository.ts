import type { Env } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canManageSecurity } from "../../_lib/permissions.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  if (!await canManageSecurity(env, user)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "evidence_repository_read_denied",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { reason: "security_admin_required" },
    });
    return json({ error: "forbidden" }, { status: 403 });
  }
  const repository = await env.DB.prepare(
    `SELECT id, provider, title, root_folder_id, index_sheet_id, owner_email, status
     FROM evidence_repositories
     WHERE id = 'default-google-drive'`,
  ).first();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "evidence_repository_read",
    entityType: "evidence_repository",
    entityId: "default-google-drive",
    request,
  });

  return json({
    repository,
    configuredRootFolderId: env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID || null,
    indexSheetId: env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID || null,
  });
};
