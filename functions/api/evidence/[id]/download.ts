import type { Env, RoleAssignment, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { badRequest } from "../../../_lib/http.ts";
import {
  downloadGoogleDriveFileMedia,
  exportGoogleDriveWorkspaceDocument,
  getGoogleDriveAccessToken,
  googleDriveCredentialParts,
  googleWorkspaceExportPlan,
} from "../../../_lib/google-drive.ts";
import { canAccessStudent, getRoleAssignments } from "../../../_lib/permissions.ts";
import { workflowError } from "../../../_lib/workflow.ts";

interface EvidenceRow {
  id: string;
  student_id: string;
  source_kind: string;
  drive_file_id: string | null;
  mime_type: string | null;
  title: string;
  deleted_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const evidenceId = String(params?.id || "").trim();
  if (!evidenceId) return badRequest("missing_evidence_id");

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditEvidenceAccess(env, request, null, "evidence_download_unauthorized", evidenceId, {
      reason: "missing_session",
    });
    return workflowError("unauthorized", 401);
  }

  const artifact = await env.DB.prepare(
    `SELECT id, student_id, source_kind, drive_file_id, mime_type, title, deleted_at
     FROM evidence_artifacts
     WHERE id = ?`,
  ).bind(evidenceId).first<EvidenceRow>();

  if (!artifact || artifact.deleted_at) {
    await auditEvidenceAccess(env, request, user, "evidence_download_missing", evidenceId, {
      reason: "not_found_or_deleted",
    });
    return workflowError("not_found", 404);
  }

  if (!await canAccessStudent(env, user, artifact.student_id)) {
    await auditEvidenceAccess(env, request, user, "evidence_download_denied", evidenceId, {
      studentId: artifact.student_id,
      reason: "student_scope_denied",
    });
    return workflowError("forbidden", 403);
  }

  if (artifact.source_kind !== "google_drive_file" || !artifact.drive_file_id) {
    await auditEvidenceAccess(env, request, user, "evidence_download_invalid_source", evidenceId, {
      studentId: artifact.student_id,
      sourceKind: artifact.source_kind,
    });
    return workflowError("not_a_drive_file", 409);
  }

  const workspaceExport = googleWorkspaceExportPlan(artifact.mime_type);
  if (workspaceExport.native && !workspaceExport.supported) {
    await auditEvidenceAccess(env, request, user, "evidence_download_google_workspace_export_unsupported", evidenceId, {
      studentId: artifact.student_id,
      sourceKind: artifact.source_kind,
      sourceMimeType: workspaceExport.sourceMimeType,
      exportStatus: workspaceExport.status,
    });
    return workflowError("unsupported_google_workspace_export", 409);
  }

  const credentialParts = googleDriveCredentialParts(env);
  if (!credentialParts.clientEmail || !credentialParts.privateKey) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_download_missing_credentials",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { credentialParts },
    });
    return workflowError("drive_credentials_missing", 503);
  }

  let accessToken: string;
  try {
    const tokenResult = await getGoogleDriveAccessToken(env);
    accessToken = tokenResult.accessToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_download_token_exchange_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { message },
    });
    return workflowError("drive_token_exchange_failed", 502);
  }

  let driveResponse: Response;
  const usesWorkspaceExport = workspaceExport.native && workspaceExport.supported && workspaceExport.exportMimeType;
  try {
    driveResponse = usesWorkspaceExport
      ? await exportGoogleDriveWorkspaceDocument(accessToken, artifact.drive_file_id, workspaceExport.exportMimeType || undefined)
      : await downloadGoogleDriveFileMedia(accessToken, artifact.drive_file_id);
  } catch {
    await writeAudit(env, {
      actorUserId: user.id,
      action: usesWorkspaceExport ? "google_drive_docs_export_request_failed" : "google_drive_download_request_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: {
        reason: "provider_request_failed",
        ...(usesWorkspaceExport
          ? {
              sourceMimeType: workspaceExport.sourceMimeType,
              exportMimeType: workspaceExport.exportMimeType,
            }
          : {}),
      },
    });
    return workflowError("drive_provider_error", 502);
  }

  if (!driveResponse.ok) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: usesWorkspaceExport ? "google_drive_docs_export_failed" : "google_drive_download_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: {
        status: driveResponse.status,
        ...(usesWorkspaceExport
          ? {
              sourceMimeType: workspaceExport.sourceMimeType,
              exportMimeType: workspaceExport.exportMimeType,
            }
          : {}),
      },
    });
    await auditEvidenceAccess(env, request, user, "evidence_download_failed", evidenceId, {
      studentId: artifact.student_id,
      sourceKind: artifact.source_kind,
      driveStatus: driveResponse.status,
      ...(usesWorkspaceExport
        ? {
            sourceMimeType: workspaceExport.sourceMimeType,
            exportMimeType: workspaceExport.exportMimeType,
          }
        : {}),
    });
    return workflowError(usesWorkspaceExport ? "google_docs_export_failed" : "drive_download_failed", 502);
  }

  await auditEvidenceAccess(env, request, user, "evidence_downloaded", evidenceId, {
    studentId: artifact.student_id,
    sourceKind: artifact.source_kind,
    ...(usesWorkspaceExport
      ? {
          sourceMimeType: workspaceExport.sourceMimeType,
          exportMimeType: workspaceExport.exportMimeType,
          delivery: "google_workspace_export",
        }
      : {}),
  });

  const headers = new Headers();
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");

  const contentType = usesWorkspaceExport
    ? workspaceExport.exportMimeType || "application/pdf"
    : driveResponse.headers.get("content-type") || artifact.mime_type || "application/octet-stream";
  headers.set("content-type", contentType);
  headers.set("content-disposition", contentDispositionAttachment(artifact.title, contentType));

  return new Response(driveResponse.body, { status: 200, headers });
};

async function auditEvidenceAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  evidenceId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const auditMetadata = user
    ? {
        ...metadata,
        actorRoleScopes: serializeRoleScopes(await getRoleAssignments(env, user.id)),
      }
    : metadata;

  await writeAudit(env, {
    actorUserId: user?.id || null,
    action,
    entityType: "evidence_artifact",
    entityId: evidenceId,
    request,
    metadata: auditMetadata,
  });
}

function serializeRoleScopes(assignments: RoleAssignment[]): Array<{
  roleId: string;
  scopeType: string;
  scopeId: string;
}> {
  return assignments.map((assignment) => ({
    roleId: assignment.role_id,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id,
  }));
}

function contentDispositionAttachment(title: string, contentType: string): string {
  const safeTitle = String(title || "evidence")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\w.\- ()]/g, "_")
    .trim()
    .slice(0, 120) || "evidence";

  const extension = guessExtension(contentType);
  const fileName = extension && !safeTitle.toLowerCase().endsWith(`.${extension}`) ? `${safeTitle}.${extension}` : safeTitle;
  return `attachment; filename=\"${fileName.replace(/\"/g, "")}\"`;
}

function guessExtension(contentType: string): string {
  const normalized = String(contentType || "").toLowerCase().split(";")[0].trim();
  if (normalized === "application/pdf") return "pdf";
  if (normalized === "image/png") return "png";
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "text/plain") return "txt";
  if (normalized === "text/csv") return "csv";
  return "";
}
