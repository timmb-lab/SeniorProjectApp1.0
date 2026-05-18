import type { Env } from "../../_types";
import { getCurrentUser, writeAudit } from "../../_lib/auth";
import { json } from "../../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ error: "unauthorized" }, { status: 401 });
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
