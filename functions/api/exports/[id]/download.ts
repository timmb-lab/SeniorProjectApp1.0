import type { Env } from "../../../_types";
import { getCurrentUser, writeAudit } from "../../../_lib/auth";
import { json } from "../../../_lib/http";
import { canAccessStudent, isAdmin } from "../../../_lib/permissions";
import { workflowError } from "../../../_lib/workflow";

interface ExportRow {
  id: string;
  export_type: string;
  requested_by: string | null;
  target_user_id: string | null;
  drive_file_id: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const exportId = String(params?.id || "").trim();
  if (!exportId) return workflowError("missing_export_id", 400);

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  const row = await env.DB.prepare(
    `SELECT id, export_type, requested_by, target_user_id, drive_file_id, status, created_at, completed_at
     FROM exports
     WHERE id = ?`,
  ).bind(exportId).first<ExportRow>();
  if (!row) return workflowError("not_found", 404);

  const admin = await isAdmin(env, user.id);
  const canAccessTarget = row.target_user_id ? await canAccessStudent(env, user, row.target_user_id) : false;
  if (!admin && !canAccessTarget) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "export_download_denied",
      entityType: "export",
      entityId: row.id,
      request,
      metadata: { targetUserId: row.target_user_id },
    });
    return workflowError("forbidden", 403);
  }

  await writeAudit(env, {
    actorUserId: user.id,
    action: "export_download_checked",
    entityType: "export",
    entityId: row.id,
    request,
    metadata: {
      status: row.status,
      signedDownloadReady: Boolean(row.drive_file_id && row.status === "complete"),
    },
  });

  return json({
    ok: true,
    export: {
      id: row.id,
      exportType: row.export_type,
      targetUserId: row.target_user_id,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    },
    download: {
      signedDownloadReady: Boolean(row.drive_file_id && row.status === "complete"),
      url: null,
      message: row.drive_file_id && row.status === "complete"
        ? "Signed download generation is not enabled in this test-account MVP yet."
        : "Archive is not complete yet; signed download remains pending.",
    },
  });
};

