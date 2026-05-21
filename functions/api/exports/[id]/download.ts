import type { Env } from "../../../_types.ts";
import { archiveArtifactExpired, STUDENT_ARCHIVE_MANIFEST_TYPE } from "../../../_lib/archive-export.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { json } from "../../../_lib/http.ts";
import { canAccessStudent, isAdmin } from "../../../_lib/permissions.ts";
import { workflowError } from "../../../_lib/workflow.ts";

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

interface ExportArtifactRow {
  id: string;
  artifact_type: string;
  title: string;
  mime_type: string;
  byte_length: number;
  content_sha256: string;
  body_json: string;
  expires_at: string | null;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const exportId = String(params?.id || "").trim();
  if (!exportId) return workflowError("missing_export_id", 400);

  const user = await getCurrentUser(request, env);
  if (!user) {
    await writeAudit(env, {
      actorUserId: null,
      action: "export_download_unauthorized",
      entityType: "export",
      entityId: exportId,
      request,
      metadata: { reason: "missing_session" },
    });
    return workflowError("unauthorized", 401);
  }

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

  if (row.status !== "complete") {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "export_download_checked",
      entityType: "export",
      entityId: row.id,
      request,
      metadata: {
        status: row.status,
        signedDownloadReady: false,
        scopedDownloadReady: false,
        drivePackageReady: Boolean(row.drive_file_id),
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
        signedDownloadReady: false,
        scopedDownloadReady: false,
        url: null,
        message: "Archive is not complete yet; scoped package download remains pending.",
      },
    });
  }

  const artifact = await env.DB.prepare(
    `SELECT id, artifact_type, title, mime_type, byte_length, content_sha256, body_json, expires_at, created_at
     FROM export_artifacts
     WHERE export_id = ?
       AND artifact_type = ?
     ORDER BY created_at DESC
     LIMIT 1`,
  ).bind(row.id, STUDENT_ARCHIVE_MANIFEST_TYPE).first<ExportArtifactRow>();

  if (!artifact) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "export_download_missing_artifact",
      entityType: "export",
      entityId: row.id,
      request,
      metadata: {
        status: row.status,
        signedDownloadReady: false,
        scopedDownloadReady: false,
        drivePackageReady: Boolean(row.drive_file_id),
      },
    });

    return workflowError("archive_artifact_missing", 409);
  }

  if (archiveArtifactExpired(artifact.expires_at)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "export_download_expired",
      entityType: "export",
      entityId: row.id,
      request,
      metadata: {
        artifactId: artifact.id,
        expiredAt: artifact.expires_at,
        signedDownloadReady: false,
        scopedDownloadReady: false,
        drivePackageReady: Boolean(row.drive_file_id),
      },
    });

    return json({
      ok: false,
      error: "archive_download_expired",
      export: {
        id: row.id,
        exportType: row.export_type,
        targetUserId: row.target_user_id,
        status: row.status,
      },
      download: {
        signedDownloadReady: false,
        scopedDownloadReady: false,
        expiredAt: artifact.expires_at,
        retry: "request_new_archive_export",
        message: "Archive package download expired. Ask an admin to generate a fresh archive package.",
      },
    }, { status: 410 });
  }

  await writeAudit(env, {
    actorUserId: user.id,
    action: "export_downloaded",
    entityType: "export",
    entityId: row.id,
    request,
    metadata: {
      status: row.status,
      artifactId: artifact.id,
      artifactType: artifact.artifact_type,
      byteLength: artifact.byte_length,
      contentSha256: artifact.content_sha256,
      expiresAt: artifact.expires_at,
      storageIdentifiersRedacted: true,
      drivePackageReady: Boolean(row.drive_file_id),
      signedDownloadReady: false,
      scopedDownloadReady: true,
    },
  });

  const headers = new Headers();
  headers.set("cache-control", "no-store");
  headers.set("content-type", artifact.mime_type || "application/json");
  headers.set("content-disposition", contentDispositionAttachment(artifact.title));
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-archive-expires-at", artifact.expires_at || "");
  headers.set("x-archive-content-sha256", artifact.content_sha256);
  headers.set("x-archive-storage-identifiers-redacted", "true");
  headers.set("x-archive-drive-package-ready", row.drive_file_id ? "true" : "false");

  return new Response(artifact.body_json, { status: 200, headers });
};

function contentDispositionAttachment(title: string): string {
  const safeTitle = String(title || "senior-project-archive")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\w.\- ()]/g, "_")
    .trim()
    .slice(0, 120) || "senior-project-archive";

  const fileName = safeTitle.toLowerCase().endsWith(".json") ? safeTitle : `${safeTitle}.json`;
  return `attachment; filename="${fileName.replace(/"/g, "")}"`;
}
