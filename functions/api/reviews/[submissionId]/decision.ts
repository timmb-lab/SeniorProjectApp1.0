import type { Env } from "../../../_types";
import { getCurrentUser, writeAudit } from "../../../_lib/auth";
import { randomId } from "../../../_lib/crypto";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http";
import {
  canReviewSubmission,
  cleanWorkflowText,
  getSubmission,
  type SubmissionDecision,
  workflowError,
  writeStatusHistory,
} from "../../../_lib/workflow";

interface ReviewDecisionBody {
  decision?: SubmissionDecision;
  feedback?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const submissionId = String(params?.submissionId || "").trim();
  if (!submissionId) return badRequest("missing_submission_id");

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  let body: ReviewDecisionBody;
  try {
    body = await readJson<ReviewDecisionBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  if (!body.decision || !["approved", "revision_requested"].includes(body.decision)) {
    return badRequest("invalid_review_decision");
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);
  if (!await canReviewSubmission(env, user, submission)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "review_decision_denied",
      entityType: "submission",
      entityId: submission.id,
      request,
      metadata: {
        studentId: submission.student_id,
        decision: body.decision,
      },
    });
    return workflowError("forbidden", 403);
  }
  if (submission.status !== "submitted") {
    return workflowError("submission_not_in_review", 409);
  }

  const feedback = cleanWorkflowText(
    body.feedback,
    body.decision === "approved"
      ? "Approved for the next capstone phase."
      : "Revision requested before approval.",
  );
  const reviewId = randomId("review");

  await env.DB.prepare(
    `INSERT INTO reviews (id, submission_id, reviewer_user_id, decision, feedback)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(reviewId, submission.id, user.id, body.decision, feedback).run();

  await env.DB.prepare(
    `UPDATE submissions
     SET status = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(body.decision, submission.id).run();

  await env.DB.prepare(
    `UPDATE progress_records
     SET status = ?,
         updated_by = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE student_id = ? AND requirement_id = ?`,
  ).bind(body.decision, user.id, submission.student_id, submission.requirement_id).run();

  await writeStatusHistory(env, {
    studentId: submission.student_id,
    entityType: "submission",
    entityId: submission.id,
    fromStatus: submission.status,
    toStatus: body.decision,
    changedBy: user.id,
    reason: feedback,
  });

  await writeAudit(env, {
    actorUserId: user.id,
    action: body.decision === "approved" ? "submission_approved" : "submission_revision_requested",
    entityType: "submission",
    entityId: submission.id,
    request,
    metadata: {
      reviewId,
      studentId: submission.student_id,
      fromStatus: submission.status,
      toStatus: body.decision,
    },
  });

  return json({
    ok: true,
    review: {
      id: reviewId,
      submissionId: submission.id,
      decision: body.decision,
      feedback,
    },
    submission: {
      id: submission.id,
      studentId: submission.student_id,
      status: body.decision,
      version: submission.version,
    },
  });
};
