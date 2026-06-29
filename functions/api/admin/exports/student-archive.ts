import type { Env } from "../../../_types.ts";
import { buildStudentArchiveManifest, uploadStudentArchiveDrivePackage, verifyArchiveProviderReady } from "../../../_lib/archive-export.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import { canViewAdminDashboard } from "../../../_lib/permissions.ts";
import { cleanWorkflowText, workflowError } from "../../../_lib/workflow.ts";

interface StudentArchiveBody {
  studentId?: string;
  reason?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) {
    await writeAudit(env, {
      actorUserId: null,
      action: "student_archive_export_unauthorized",
      entityType: "export",
      entityId: null,
      request,
      metadata: { reason: "missing_session" },
    });
    return workflowError("unauthorized", 401);
  }
  if (!await canViewAdminDashboard(env, user)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "student_archive_export_denied",
      entityType: "export",
      entityId: null,
      request,
      metadata: { reason: "role_not_allowed" },
    });
    return workflowError("forbidden", 403);
  }

  let body: StudentArchiveBody;
  try {
    body = await readJson<StudentArchiveBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const studentId = cleanWorkflowText(body.studentId, "", 160);
  if (!studentId) return badRequest("missing_student_id");
  const reason = cleanWorkflowText(body.reason, "", 300);
  if (!reason) return badRequest("missing_reason");

  const student = await env.DB.prepare(
    "SELECT id FROM user_accounts WHERE id = ? AND status = 'active'",
  ).bind(studentId).first<{ id: string }>();
  if (!student) return workflowError("student_not_found", 404);

  const exportId = randomId("export");
  const provider = await verifyArchiveProviderReady(env);
  if (!provider.ready) {
    const completedAt = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO exports (id, export_type, requested_by, target_user_id, status, completed_at)
       VALUES (?, 'student_archive', ?, ?, 'failed', ?)`,
    ).bind(exportId, user.id, studentId, completedAt).run();

    await writeAudit(env, {
      actorUserId: user.id,
      action: "student_archive_export_provider_unavailable",
      entityType: "export",
      entityId: exportId,
      request,
      metadata: {
        targetUserId: studentId,
        reason,
        providerStatus: provider.status,
        retry: provider.retry,
        rootConfigured: provider.rootConfigured,
        indexConfigured: provider.indexConfigured,
        credentialParts: provider.credentialParts,
        signedDownloadReady: false,
        scopedDownloadReady: false,
        storageIdentifiersRedacted: true,
      },
    });

    return json({
      ok: false,
      error: provider.error,
      export: {
        id: exportId,
        exportType: "student_archive",
        targetUserId: studentId,
        status: "failed",
        completedAt,
        providerStatus: provider.status,
        retry: provider.retry,
        signedDownloadReady: false,
        scopedDownloadReady: false,
      },
      provider: {
        status: provider.status,
        message: provider.message,
        rootConfigured: provider.rootConfigured,
        indexConfigured: provider.indexConfigured,
        credentialParts: provider.credentialParts,
      },
    }, { status: provider.httpStatus });
  }

  const artifact = await buildStudentArchiveManifest(env, {
    exportId,
    studentId,
    requestedBy: user.id,
    reason,
  });
  let drivePackage;
  try {
    drivePackage = await uploadStudentArchiveDrivePackage(env, artifact);
  } catch {
    const completedAt = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO exports (id, export_type, requested_by, target_user_id, status, completed_at)
       VALUES (?, 'student_archive', ?, ?, 'failed', ?)`,
    ).bind(exportId, user.id, studentId, completedAt).run();

    await writeAudit(env, {
      actorUserId: user.id,
      action: "student_archive_export_drive_upload_failed",
      entityType: "export",
      entityId: exportId,
      request,
      metadata: {
        targetUserId: studentId,
        reason,
        providerStatus: "drive_package_upload_failed",
        retry: "retry_archive_export",
        signedDownloadReady: false,
        scopedDownloadReady: false,
        drivePackageReady: false,
        storageIdentifiersRedacted: true,
      },
    });

    return json({
      ok: false,
      error: "drive_package_upload_failed",
      export: {
        id: exportId,
        exportType: "student_archive",
        targetUserId: studentId,
        status: "failed",
        completedAt,
        providerStatus: "drive_package_upload_failed",
        retry: "retry_archive_export",
        signedDownloadReady: false,
        scopedDownloadReady: false,
        drivePackageReady: false,
      },
      provider: {
        status: "drive_package_upload_failed",
        message: "Drive package upload failed, so archive package generation should be retried after provider access is fixed.",
        rootConfigured: provider.rootConfigured,
        indexConfigured: provider.indexConfigured,
        credentialParts: provider.credentialParts,
      },
    }, { status: 502 });
  }

  await env.DB.prepare(
    `INSERT INTO exports (id, export_type, requested_by, target_user_id, drive_file_id, status, completed_at)
     VALUES (?, 'student_archive', ?, ?, ?, 'complete', ?)`,
  ).bind(exportId, user.id, studentId, drivePackage.fileId, artifact.generatedAt).run();

  await env.DB.prepare(
    `INSERT INTO export_artifacts (
       id,
       export_id,
       artifact_type,
       title,
       mime_type,
       byte_length,
       content_sha256,
       body_json,
       expires_at,
       created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    artifact.id,
    exportId,
    artifact.artifactType,
    artifact.title,
    artifact.mimeType,
    artifact.byteLength,
    artifact.contentSha256,
    artifact.bodyJson,
    artifact.expiresAt,
    artifact.generatedAt,
  ).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "student_archive_export_generated",
    entityType: "export",
    entityId: exportId,
    request,
    metadata: {
      targetUserId: studentId,
      reason,
      artifactId: artifact.id,
      artifactType: artifact.artifactType,
      byteLength: artifact.byteLength,
      contentSha256: artifact.contentSha256,
      expiresAt: artifact.expiresAt,
      itemCounts: artifact.itemCounts,
      providerStatus: provider.status,
      retention: artifact.retention,
      drivePackageReady: true,
      drivePackageName: drivePackage.name,
      drivePackageMimeType: drivePackage.mimeType,
      signedDownloadReady: false,
      scopedDownloadReady: true,
      storageIdentifiersRedacted: true,
    },
  });

  return json({
    ok: true,
    export: {
      id: exportId,
      exportType: "student_archive",
      targetUserId: studentId,
      status: "complete",
      completedAt: artifact.generatedAt,
      artifactId: artifact.id,
      artifactType: artifact.artifactType,
      packageBytes: artifact.byteLength,
      drivePackageReady: true,
      drivePackageName: drivePackage.name,
      downloadExpiresAt: artifact.expiresAt,
      retention: artifact.retention,
      signedDownloadReady: false,
      scopedDownloadReady: true,
      downloadUrl: `/api/exports/${exportId}/download`,
    },
  });
};
