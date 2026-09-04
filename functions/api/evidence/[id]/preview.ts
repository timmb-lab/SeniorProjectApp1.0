import type { Env, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { applyApiSecurityHeaders, badRequest } from "../../../_lib/http.ts";
import {
  downloadGoogleDriveFileMedia,
  exportGoogleDriveWorkspaceDocument,
  getGoogleDriveAccessToken,
  googleDriveCredentialParts,
} from "../../../_lib/google-drive.ts";
import { canAccessStudent } from "../../../_lib/permissions.ts";
import { workflowError } from "../../../_lib/workflow.ts";

interface PreviewEvidenceRow {
  id: string;
  student_id: string;
  source_kind: string;
  drive_file_id: string | null;
  preview_drive_file_id: string | null;
  preview_kind: string;
  preview_status: string;
  mime_type: string | null;
  title: string;
  deleted_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const evidenceId = String(params?.id || "").trim();
  if (!evidenceId) return badRequest("missing_evidence_id");
  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditPreview(env, request, null, "evidence_preview_unauthorized", evidenceId);
    return workflowError("unauthorized", 401);
  }

  const artifact = await env.DB.prepare(
    `SELECT id, student_id, source_kind, drive_file_id, preview_drive_file_id,
            preview_kind, preview_status, mime_type, title, deleted_at
     FROM evidence_artifacts WHERE id = ?`,
  ).bind(evidenceId).first<PreviewEvidenceRow>();
  if (!artifact || artifact.deleted_at) {
    await auditPreview(env, request, user, "evidence_preview_missing", evidenceId);
    return workflowError("not_found", 404);
  }
  if (!await canAccessStudent(env, user, artifact.student_id)) {
    await auditPreview(env, request, user, "evidence_preview_denied", evidenceId);
    return workflowError("forbidden", 403);
  }
  if (artifact.source_kind !== "google_drive_file" || artifact.preview_status !== "ready") {
    return workflowError(artifact.preview_status === "failed" ? "preview_failed" : "preview_unavailable", 409);
  }

  const credentials = googleDriveCredentialParts(env);
  if (!credentials.clientEmail || !credentials.privateKey) return workflowError("drive_credentials_missing", 503);

  let accessToken: string;
  try {
    accessToken = (await getGoogleDriveAccessToken(env)).accessToken;
  } catch {
    return workflowError("drive_token_exchange_failed", 502);
  }

  let providerResponse: Response;
  try {
    if (artifact.preview_kind === "inline_pdf" && artifact.drive_file_id) {
      providerResponse = await downloadGoogleDriveFileMedia(accessToken, artifact.drive_file_id);
    } else if (artifact.preview_kind === "converted_pdf" && artifact.preview_drive_file_id) {
      providerResponse = await exportGoogleDriveWorkspaceDocument(accessToken, artifact.preview_drive_file_id, "application/pdf");
    } else {
      return workflowError("preview_unavailable", 409);
    }
  } catch {
    return workflowError("drive_provider_error", 502);
  }
  if (!providerResponse.ok || !providerResponse.body) {
    await auditPreview(env, request, user, "evidence_preview_failed", evidenceId, { providerStatus: providerResponse.status });
    return workflowError("preview_provider_failed", 502);
  }

  await auditPreview(env, request, user, "evidence_previewed", evidenceId, { previewKind: artifact.preview_kind });
  const headers = new Headers();
  applyApiSecurityHeaders(headers);
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", `inline; filename="${safePreviewName(artifact.title)}.pdf"`);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("content-security-policy", "default-src 'none'; frame-ancestors 'self'; sandbox");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("x-content-type-options", "nosniff");
  return new Response(providerResponse.body, { status: 200, headers });
};

function safePreviewName(value: string): string {
  return (String(value || "evidence-preview").replace(/[^a-zA-Z0-9._ -]+/g, "_").trim() || "evidence-preview").slice(0, 100);
}

async function auditPreview(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  evidenceId: string,
  metadata: Record<string, unknown> = {},
) {
  await writeAudit(env, {
    actorUserId: user?.id || null,
    action,
    entityType: "evidence_artifact",
    entityId: evidenceId,
    request,
    metadata,
  });
}
