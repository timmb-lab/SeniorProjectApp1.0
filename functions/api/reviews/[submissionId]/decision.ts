import type { Env } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import {
  canReviewSubmission,
  cleanWorkflowText,
  getSubmission,
  type SubmissionDecision,
  workflowError,
  writeStatusHistory,
} from "../../../_lib/workflow.ts";

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

  if (!isSubmissionDecision(body.decision)) {
    return badRequest("invalid_review_decision");
  }
  const decision = body.decision;

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
        decision,
      },
    });
    return workflowError("forbidden", 403);
  }
  if (submission.status !== "submitted") {
    return workflowError("submission_not_in_review", 409);
  }

  const feedback = cleanWorkflowText(
    body.feedback,
    decision === "approved"
      ? "Approved for the next capstone phase."
      : decision === "revision_requested"
        ? "Revision requested before approval."
        : "Comment added for review.",
  );
  const reviewId = randomId("review");
  const commentId = randomId("comment");

  await env.DB.prepare(
    `INSERT INTO reviews (id, submission_id, reviewer_user_id, decision, feedback)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(reviewId, submission.id, user.id, decision, feedback).run();

  await env.DB.prepare(
    `INSERT INTO comments (id, entity_type, entity_id, author_user_id, visibility, body)
     VALUES (?, 'submission', ?, ?, 'student_and_staff', ?)`,
  ).bind(commentId, submission.id, user.id, feedback).run();

  const statusChanged = decision !== "comment_only";

  if (statusChanged) {
    await env.DB.prepare(
      `UPDATE submissions
       SET status = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).bind(decision, submission.id).run();

    await env.DB.prepare(
      `UPDATE progress_records
       SET status = ?,
           updated_by = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE student_id = ? AND requirement_id = ?`,
    ).bind(decision, user.id, submission.student_id, submission.requirement_id).run();

    await writeStatusHistory(env, {
      studentId: submission.student_id,
      entityType: "submission",
      entityId: submission.id,
      fromStatus: submission.status,
      toStatus: decision,
      changedBy: user.id,
      reason: feedback,
    });
  }

  await writeAudit(env, {
    actorUserId: user.id,
    action: reviewAuditAction(decision),
    entityType: "submission",
    entityId: submission.id,
    request,
    metadata: {
      reviewId,
      commentId,
      studentId: submission.student_id,
      fromStatus: submission.status,
      toStatus: statusChanged ? decision : submission.status,
      statusChanged,
    },
  });

  return json({
    ok: true,
    review: {
      id: reviewId,
      submissionId: submission.id,
      decision,
      feedback,
    },
    comment: {
      id: commentId,
      submissionId: submission.id,
      visibility: "student_and_staff",
      body: feedback,
    },
    submission: {
      id: submission.id,
      studentId: submission.student_id,
      status: statusChanged ? decision : submission.status,
      version: submission.version,
    },
  });
};

function isSubmissionDecision(value: unknown): value is SubmissionDecision {
  return value === "approved" || value === "revision_requested" || value === "comment_only";
}

function reviewAuditAction(decision: SubmissionDecision): string {
  if (decision === "approved") return "submission_approved";
  if (decision === "revision_requested") return "submission_revision_requested";
  return "submission_review_comment_added";
}
