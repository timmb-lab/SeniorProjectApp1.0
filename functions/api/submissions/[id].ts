import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { getRoleAssignments } from "../../_lib/permissions.ts";
import { canViewSubmission, getSubmission, workflowError } from "../../_lib/workflow.ts";

interface EvidenceSummaryRow {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  review_status: string;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const submissionId = String(params?.id || "").trim();
  if (!submissionId) return workflowError("missing_submission_id", 400);

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditSubmissionDetail(env, request, null, "submission_detail_unauthorized", submissionId, {
      reason: "missing_session",
    });
    return workflowError("unauthorized", 401);
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);

  if (!await canViewSubmission(env, user, submission)) {
    await auditSubmissionDetail(env, request, user, "submission_detail_denied", submission.id, {
      reason: "scope_denied",
      studentId: submission.student_id,
    });
    return workflowError("forbidden", 403);
  }

  const evidence = await env.DB.prepare(
    `SELECT id, title, artifact_type, source_kind, review_status, created_at
     FROM evidence_artifacts
     WHERE submission_id = ?
       AND deleted_at IS NULL
       AND review_status != 'archived'
     ORDER BY created_at ASC
     LIMIT 50`,
  ).bind(submission.id).all<EvidenceSummaryRow>();

  const evidenceRows = evidence.results || [];
  await auditSubmissionDetail(env, request, user, "submission_detail_viewed", submission.id, {
    studentId: submission.student_id,
    requirementId: submission.requirement_id,
    status: submission.status,
    evidenceCount: evidenceRows.length,
  });

  return json({
    ok: true,
    submission: {
      id: submission.id,
      studentId: submission.student_id,
      requirementId: submission.requirement_id,
      status: submission.status,
      version: submission.version,
    },
    evidence: evidenceRows.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      artifactType: artifact.artifact_type,
      sourceKind: artifact.source_kind,
      reviewStatus: artifact.review_status,
      createdAt: artifact.created_at,
    })),
    storage: {
      provider: "google_drive",
      storageIdentifiersRedacted: true,
    },
  });
};

async function auditSubmissionDetail(
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
