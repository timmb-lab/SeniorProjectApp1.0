import type { Env } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { badRequest, json, requirePost } from "../../../_lib/http.ts";
import { hasRole } from "../../../_lib/permissions.ts";
import { getSubmission, workflowError, writeStatusHistory, writeSubmissionVersionSnapshot } from "../../../_lib/workflow.ts";

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
      action: "submission_submit_denied",
      entityType: "submission",
      entityId: submissionId,
      request,
      metadata: { studentId: submission.student_id },
    });
    return workflowError("forbidden", 403);
  }
  if (!["draft", "revision_requested"].includes(submission.status)) {
    return workflowError("submission_not_submittable", 409);
  }

  const evidenceCountRow = await env.DB.prepare(
    `SELECT COUNT(id) AS evidence_count
     FROM evidence_artifacts
     WHERE submission_id = ?
       AND deleted_at IS NULL
       AND review_status != 'archived'`,
  ).bind(submission.id).first<{ evidence_count: number }>();

  const evidenceCount = Number(evidenceCountRow?.evidence_count || 0);
  if (!Number.isFinite(evidenceCount) || evidenceCount <= 0) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "submission_submit_blocked_missing_evidence",
      entityType: "submission",
      entityId: submission.id,
      request,
      metadata: {
        submissionId: submission.id,
        studentId: submission.student_id,
        status: submission.status,
        evidenceCount,
      },
    });
    return workflowError("submission_missing_evidence", 409);
  }

  const nextVersion = submission.status === "revision_requested" ? submission.version + 1 : submission.version;
  await env.DB.prepare(
    `UPDATE submissions
     SET status = 'submitted',
         version = ?,
         submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(nextVersion, submission.id).run();

  await writeSubmissionVersionSnapshot(env, {
    submission,
    version: nextVersion,
    submittedBy: user.id,
    notes: submission.status === "revision_requested"
      ? "Revision resubmitted for teacher review."
      : "Initial submission for teacher review.",
  });

  await env.DB.prepare(
    `UPDATE progress_records
     SET status = 'submitted',
         updated_by = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE student_id = ? AND requirement_id = ?`,
  ).bind(user.id, submission.student_id, submission.requirement_id).run();

  await writeStatusHistory(env, {
    studentId: submission.student_id,
    entityType: "submission",
    entityId: submission.id,
    fromStatus: submission.status,
    toStatus: "submitted",
    changedBy: user.id,
    reason: "Student submitted proposal for review.",
  });

  await writeAudit(env, {
    actorUserId: user.id,
    action: "submission_submitted",
    entityType: "submission",
    entityId: submission.id,
    request,
    metadata: {
      fromStatus: submission.status,
      toStatus: "submitted",
      version: nextVersion,
    },
  });

  return json({
    ok: true,
    submission: {
      id: submission.id,
      studentId: submission.student_id,
      status: "submitted",
      version: nextVersion,
    },
  });
};
