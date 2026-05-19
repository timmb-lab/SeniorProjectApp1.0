import type { Env } from "../../../_types";
import { getCurrentUser, writeAudit } from "../../../_lib/auth";
import { json } from "../../../_lib/http";
import { canViewSubmission, getSubmission, workflowError } from "../../../_lib/workflow";

interface ReviewHistoryRow {
  id: string;
  decision: string;
  feedback: string | null;
  created_at: string;
  reviewer_name: string | null;
}

interface StatusHistoryRow {
  id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: string;
  changed_by_name: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const submissionId = String(params?.submissionId || "").trim();
  if (!submissionId) return workflowError("missing_submission_id", 400);

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);
  if (!await canViewSubmission(env, user, submission)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "review_history_denied",
      entityType: "submission",
      entityId: submission.id,
      request,
      metadata: { studentId: submission.student_id },
    });
    return workflowError("forbidden", 403);
  }

  const reviews = await env.DB.prepare(
    `SELECT
       reviews.id,
       reviews.decision,
       reviews.feedback,
       reviews.created_at,
       reviewer.display_name AS reviewer_name
     FROM reviews
     LEFT JOIN user_accounts reviewer ON reviewer.id = reviews.reviewer_user_id
     WHERE reviews.submission_id = ?
     ORDER BY reviews.created_at DESC
     LIMIT 20`,
  ).bind(submission.id).all<ReviewHistoryRow>();

  const statusHistory = await env.DB.prepare(
    `SELECT
       status_history.id,
       status_history.from_status,
       status_history.to_status,
       status_history.reason,
       status_history.created_at,
       actor.display_name AS changed_by_name
     FROM status_history
     LEFT JOIN user_accounts actor ON actor.id = status_history.changed_by
     WHERE status_history.entity_type = 'submission'
       AND status_history.entity_id = ?
     ORDER BY status_history.created_at DESC
     LIMIT 30`,
  ).bind(submission.id).all<StatusHistoryRow>();

  return json({
    ok: true,
    submission: {
      id: submission.id,
      studentId: submission.student_id,
      status: submission.status,
      version: submission.version,
    },
    reviews: reviews.results || [],
    statusHistory: statusHistory.results || [],
  });
};

