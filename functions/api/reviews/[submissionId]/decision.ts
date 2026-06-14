import type { Env, RoleAssignment, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import { cleanId } from "../../../_lib/site-scope.ts";
import {
  canAccessSite,
  getProgramTeacherScopedStudentIds,
  getRoleAssignments,
  hasRole,
} from "../../../_lib/permissions.ts";
import {
  canReviewSubmission,
  cleanWorkflowText,
  countActiveEvidenceForSubmission,
  getSubmission,
  type SubmissionRow,
  type SubmissionDecision,
  workflowError,
  writeStatusHistory,
} from "../../../_lib/workflow.ts";

interface ReviewDecisionBody {
  decision?: SubmissionDecision;
  feedback?: string;
  siteId?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const submissionId = String(params?.submissionId || "").trim();
  if (!submissionId) return badRequest("missing_submission_id");

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditReviewDecisionAccess(env, request, null, "review_decision_unauthorized", submissionId, {
      reason: "missing_session",
    });
    return workflowError("unauthorized", 401);
  }

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
  const rawSiteId = new URL(request.url).searchParams.get("siteId") || body.siteId || null;
  const siteId = cleanId(rawSiteId);
  if (rawSiteId !== null && !siteId) {
    await auditReviewDecisionAccess(env, request, user, "review_decision_denied", submissionId, {
      reason: "invalid_site_id",
      decision,
    });
    return workflowError("forbidden", 403);
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);

  if (siteId) {
    const siteScopedAccess = await canReviewSubmissionForSite(env, user, submission, siteId);
    if (!siteScopedAccess.ok) {
      await auditReviewDecisionAccess(env, request, user, "review_decision_denied", submission.id, {
        reason: siteScopedAccess.reason,
        siteId,
        studentId: siteScopedAccess.includeStudent ? submission.student_id : undefined,
        decision,
      });
      return workflowError(siteScopedAccess.error, siteScopedAccess.status);
    }
  } else if (!await canReviewSubmission(env, user, submission)) {
    await auditReviewDecisionAccess(env, request, user, "review_decision_denied", submission.id, {
      reason: "scope_denied",
      studentId: submission.student_id,
      decision,
    });
    return workflowError("forbidden", 403);
  }
  if (submission.status !== "submitted") {
    return workflowError("submission_not_in_review", 409);
  }

  if (decision === "approved") {
    const evidenceCount = await countActiveEvidenceForSubmission(env, submission.id);
    if (evidenceCount <= 0) {
      await auditReviewDecisionAccess(env, request, user, "review_decision_blocked_missing_evidence", submission.id, {
        reason: "missing_required_evidence",
        studentId: submission.student_id,
        siteId: siteId || undefined,
        decision,
        evidenceCount,
      });
      return workflowError("submission_missing_evidence", 409);
    }
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
      siteId: siteId || undefined,
      fromStatus: submission.status,
      toStatus: statusChanged ? decision : submission.status,
      statusChanged,
      actorRoleScopes: serializeRoleScopes(await getRoleAssignments(env, user.id)),
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

async function canReviewSubmissionForSite(
  env: Env,
  user: UserAccount,
  submission: SubmissionRow,
  siteId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string; reason: string; includeStudent: boolean }> {
  if (!await studentHasActiveSite(env, submission.student_id, siteId)) {
    return { ok: false, status: 404, error: "not_found", reason: "submission_not_in_selected_site", includeStudent: false };
  }

  if (!await canAccessSite(env, user, siteId)) {
    return { ok: false, status: 403, error: "forbidden", reason: "site_not_accessible", includeStudent: false };
  }

  if (!await hasRole(env, user.id, "program_teacher")) {
    return { ok: false, status: 403, error: "forbidden", reason: "role_not_allowed_for_site_review_decision", includeStudent: true };
  }

  const teacherScope = await getProgramTeacherScopedStudentIds(env, user);
  if (!teacherScope.valid || !teacherScope.studentIds.includes(submission.student_id)) {
    return { ok: false, status: 404, error: "not_found", reason: "submission_not_in_program_teacher_scope", includeStudent: false };
  }

  return { ok: true };
}

async function studentHasActiveSite(env: Env, studentId: string, siteId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     WHERE site_users.user_id = ?
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(studentId, siteId).first();
  return Boolean(row);
}

async function auditReviewDecisionAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  submissionId: string,
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
    entityType: "submission",
    entityId: submissionId,
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
