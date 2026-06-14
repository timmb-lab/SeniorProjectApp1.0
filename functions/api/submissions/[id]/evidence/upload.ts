import type { Env } from "../../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../../_lib/auth.ts";
import { randomId } from "../../../../_lib/crypto.ts";
import { badRequest, json, requirePost } from "../../../../_lib/http.ts";
import {
  getGoogleDriveAccessToken,
  googleDriveCredentialParts,
  uploadGoogleDriveFile,
  uploadGoogleDriveFileResumable,
} from "../../../../_lib/google-drive.ts";
import { hasRole } from "../../../../_lib/permissions.ts";
import { cleanWorkflowText, getSubmission, workflowError } from "../../../../_lib/workflow.ts";

const MULTIPART_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".csv",
  ".docx",
  ".gif",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".pptx",
  ".txt",
  ".webp",
  ".xlsx",
]);
const GENERIC_UPLOAD_MIME_TYPES = new Set(["", "application/octet-stream"]);
const ALLOWED_UPLOAD_MIME_TYPES_BY_EXTENSION = new Map([
  [".csv", new Set(["text/csv"])],
  [".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])],
  [".gif", new Set(["image/gif"])],
  [".jpeg", new Set(["image/jpeg"])],
  [".jpg", new Set(["image/jpeg"])],
  [".pdf", new Set(["application/pdf"])],
  [".png", new Set(["image/png"])],
  [".pptx", new Set(["application/vnd.openxmlformats-officedocument.presentationml.presentation"])],
  [".txt", new Set(["text/plain"])],
  [".webp", new Set(["image/webp"])],
  [".xlsx", new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])],
]);

type UploadedFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function isUploadedFile(value: unknown): value is UploadedFile {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.name === "string"
    && typeof record.type === "string"
    && typeof record.size === "number"
    && typeof record.arrayBuffer === "function";
}

function fileExtension(name: string): string {
  const match = /\.[a-z0-9]+$/i.exec(String(name || "").trim());
  return match ? match[0].toLowerCase() : "";
}

function safeStorageFileName(name: string): string {
  const segment = String(name || "").split(/[\\/]+/).filter(Boolean).pop() || "";
  const extension = fileExtension(segment);
  const stem = extension ? segment.slice(0, -extension.length) : segment;
  const safeStem = stem
    .trim()
    .replace(/[\x00-\x1f\x7f]+/g, " ")
    .replace(/[^a-zA-Z0-9._ -]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/_+/g, "_")
    .replace(/^[.\s_-]+|[.\s_-]+$/g, "");
  const safeExtension = ALLOWED_UPLOAD_EXTENSIONS.has(extension) ? extension : "";
  const maxStemLength = Math.max(1, 120 - safeExtension.length);
  return `${(safeStem || "evidence-upload").slice(0, maxStemLength)}${safeExtension}`;
}

function isAllowedUploadFile(file: UploadedFile): boolean {
  const type = String(file.type || "").trim().toLowerCase();
  const extension = fileExtension(file.name);
  if (GENERIC_UPLOAD_MIME_TYPES.has(type)) {
    return ALLOWED_UPLOAD_EXTENSIONS.has(extension);
  }
  if (!extension) {
    return ALLOWED_UPLOAD_MIME_TYPES.has(type);
  }
  return ALLOWED_UPLOAD_MIME_TYPES_BY_EXTENSION.get(extension)?.has(type) === true;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const submissionId = String(params?.id || "").trim();
  if (!submissionId) return badRequest("missing_submission_id");

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);

  if (submission.student_id !== user.id || !await hasRole(env, user.id, "student")) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "evidence_upload_denied",
      entityType: "submission",
      entityId: submission.id,
      request,
      metadata: { studentId: submission.student_id },
    });
    return workflowError("forbidden", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("invalid_form_data");
  }

  const fileField = formData.get("file");
  const file = isUploadedFile(fileField) ? fileField : null;
  if (!file) return badRequest("missing_file");

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return badRequest("empty_file");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return badRequest("file_too_large");
  }
  if (!isAllowedUploadFile(file)) {
    return badRequest("unsupported_file_type");
  }

  const rootFolderId = String(env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID || "").trim();
  if (!rootFolderId) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_upload_missing_config",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { rootConfigured: Boolean(rootFolderId) },
    });
    return workflowError("drive_config_missing", 503);
  }

  const credentialParts = googleDriveCredentialParts(env);
  if (!credentialParts.clientEmail || !credentialParts.privateKey) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_upload_missing_credentials",
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
      action: "google_drive_upload_token_exchange_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { message },
    });
    return workflowError("drive_token_exchange_failed", 502);
  }

  const artifactType = cleanWorkflowText(formData.get("artifactType"), "file_upload", 80).replace(/[^a-z0-9_-]/gi, "_");
  const evidenceTitle = cleanWorkflowText(formData.get("title"), file.name || "Evidence upload", 160);
  const evidenceId = randomId("evidence");
  const driveFileName = `${evidenceId}-${safeStorageFileName(file.name)}`;
  const mimeType = file.type || "application/octet-stream";
  const bytes = new Uint8Array(await file.arrayBuffer());

  let uploadResult;
  try {
    uploadResult = file.size > MULTIPART_UPLOAD_MAX_BYTES
      ? await uploadGoogleDriveFileResumable(accessToken, {
        name: driveFileName,
        mimeType,
        parentFolderId: rootFolderId,
      }, bytes)
      : await uploadGoogleDriveFile(accessToken, {
        name: driveFileName,
        mimeType,
        parentFolderId: rootFolderId,
      }, bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_upload_request_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { message },
    });
    return workflowError("drive_provider_error", 502);
  }

  if (!uploadResult.ok || !uploadResult.fileId) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_upload_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { status: uploadResult.status },
    });
    return workflowError("drive_upload_failed", 502);
  }

  await env.DB.prepare(
    `INSERT INTO evidence_artifacts (
       id,
       repository_id,
       student_id,
       submission_id,
       artifact_type,
       source_kind,
       drive_file_id,
       drive_parent_folder_id,
       title,
       mime_type,
       size_bytes,
       review_status,
       created_by
     )
     VALUES (?, 'default-google-drive', ?, ?, ?, 'google_drive_file', ?, ?, ?, ?, ?, 'pending_review', ?)`,
  ).bind(
    evidenceId,
    submission.student_id,
    submission.id,
    artifactType,
    uploadResult.fileId,
    rootFolderId,
    evidenceTitle,
    mimeType,
    file.size,
    user.id,
  ).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "evidence_file_uploaded",
    entityType: "evidence_artifact",
    entityId: evidenceId,
    request,
    metadata: {
      submissionId: submission.id,
      studentId: submission.student_id,
      sourceKind: "google_drive_file",
    },
  });

  return json({
    ok: true,
    evidence: {
      id: evidenceId,
      submissionId: submission.id,
      studentId: submission.student_id,
      title: evidenceTitle,
      artifactType,
      sourceKind: "google_drive_file",
      reviewStatus: "pending_review",
    },
    storage: {
      provider: "google_drive",
      metadataReady: true,
      fileBytesReady: true,
      signedRetrievalReady: false,
    },
  });
};
