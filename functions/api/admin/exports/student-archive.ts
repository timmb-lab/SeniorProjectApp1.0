import type { Env } from "../../../_types";
import { getCurrentUser, writeAudit } from "../../../_lib/auth";
import { randomId } from "../../../_lib/crypto";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http";
import { isAdmin } from "../../../_lib/permissions";
import { cleanWorkflowText, workflowError } from "../../../_lib/workflow";

interface StudentArchiveBody {
  studentId?: string;
  reason?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, user.id)) return workflowError("forbidden", 403);

  let body: StudentArchiveBody;
  try {
    body = await readJson<StudentArchiveBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const studentId = cleanWorkflowText(body.studentId, "", 160);
  if (!studentId) return badRequest("missing_student_id");

  const student = await env.DB.prepare(
    "SELECT id FROM user_accounts WHERE id = ? AND status = 'active'",
  ).bind(studentId).first<{ id: string }>();
  if (!student) return workflowError("student_not_found", 404);

  const exportId = randomId("export");
  await env.DB.prepare(
    `INSERT INTO exports (id, export_type, requested_by, target_user_id, status)
     VALUES (?, 'student_archive', ?, ?, 'queued')`,
  ).bind(exportId, user.id, studentId).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "student_archive_export_queued",
    entityType: "export",
    entityId: exportId,
    request,
    metadata: {
      targetUserId: studentId,
      reason: cleanWorkflowText(body.reason, "Test-account archive queue.", 300),
      signedDownloadReady: false,
    },
  });

  return json({
    ok: true,
    export: {
      id: exportId,
      exportType: "student_archive",
      targetUserId: studentId,
      status: "queued",
      signedDownloadReady: false,
    },
  });
};

