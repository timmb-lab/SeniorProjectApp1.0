import type { Env, RoleAssignment, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { json } from "../../../_lib/http.ts";
import { getRoleAssignments } from "../../../_lib/permissions.ts";
import { canViewSubmission, getSubmission, workflowError } from "../../../_lib/workflow.ts";

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

interface SubmissionVersionRow {
  id: string;
  version: number;
  status: string;
  submitted_at: string;
  submitted_by_name: string | null;
  evidence_snapshot_json: string;
  notes: string | null;
}

interface CommentHistoryRow {
  id: string;
  body: string;
  visibility: string;
  created_at: string;
  author_name: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const submissionId = String(params?.submissionId || "").trim();
  if (!submissionId) return workflowError("missing_submission_id", 400);

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditReviewHistoryAccess(env, request, null, "review_history_unauthorized", submissionId, {
      reason: "missing_session",
    });
    return workflowError("unauthorized", 401);
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);
  if (!await canViewSubmission(env, user, submission)) {
    await auditReviewHistoryAccess(env, request, user, "review_history_denied", submission.id, {
      reason: "scope_denied",
      studentId: submission.student_id,
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

  const versions = await env.DB.prepare(
    `SELECT
       submission_versions.id,
       submission_versions.version,
       submission_versions.status,
       submission_versions.submitted_at,
       submitted_by.display_name AS submitted_by_name,
       submission_versions.evidence_snapshot_json,
       submission_versions.notes
     FROM submission_versions
     LEFT JOIN user_accounts submitted_by ON submitted_by.id = submission_versions.submitted_by
     WHERE submission_versions.submission_id = ?
     ORDER BY submission_versions.version DESC
     LIMIT 20`,
  ).bind(submission.id).all<SubmissionVersionRow>();

  const comments = await env.DB.prepare(
    `SELECT
       comments.id,
       comments.body,
       comments.visibility,
       comments.created_at,
       author.display_name AS author_name
     FROM comments
     LEFT JOIN user_accounts author ON author.id = comments.author_user_id
     WHERE comments.entity_type = 'submission'
       AND comments.entity_id = ?
       AND comments.deleted_at IS NULL
     ORDER BY comments.created_at DESC
     LIMIT 30`,
  ).bind(submission.id).all<CommentHistoryRow>();

  await auditReviewHistoryAccess(env, request, user, "review_history_viewed", submission.id, {
    studentId: submission.student_id,
    reviewCount: (reviews.results || []).length,
    statusHistoryCount: (statusHistory.results || []).length,
    versionCount: (versions.results || []).length,
    commentCount: (comments.results || []).length,
  });

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
    versions: (versions.results || []).map(formatVersion),
    comments: comments.results || [],
  });
};

function formatVersion(row: SubmissionVersionRow) {
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    submittedAt: row.submitted_at,
    submittedByName: row.submitted_by_name,
    notes: row.notes,
    evidence: parseEvidenceSnapshot(row.evidence_snapshot_json),
  };
}

async function auditReviewHistoryAccess(
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

function parseEvidenceSnapshot(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
