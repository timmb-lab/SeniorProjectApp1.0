import type { Env, RoleAssignment, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { badRequest, json } from "../../../_lib/http.ts";
import { canAccessStudent, getRoleAssignments } from "../../../_lib/permissions.ts";

interface EvidenceRow {
  id: string;
  student_id: string;
  submission_id: string | null;
  artifact_type: string;
  source_kind: string;
  external_url: string | null;
  title: string;
  review_status: string;
  created_at: string;
  deleted_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const evidenceId = String(params?.id || "").trim();
  if (!evidenceId) {
    return badRequest("missing_evidence_id");
  }

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditEvidenceAccess(env, request, null, "evidence_access_unauthorized", evidenceId, {
      reason: "missing_session",
    });
    return json({ error: "unauthorized", canAccess: false }, { status: 401 });
  }

  const artifact = await env.DB.prepare(
    `SELECT id, student_id, submission_id, artifact_type, source_kind, external_url, title, review_status, created_at, deleted_at
     FROM evidence_artifacts
     WHERE id = ?`,
  ).bind(evidenceId).first<EvidenceRow>();

  if (!artifact || artifact.deleted_at) {
    await auditEvidenceAccess(env, request, user, "evidence_access_missing", evidenceId, {
      reason: "not_found_or_deleted",
    });
    return json({ error: "not_found", canAccess: false }, { status: 404 });
  }

  if (!await canAccessStudent(env, user, artifact.student_id)) {
    await auditEvidenceAccess(env, request, user, "evidence_access_denied", evidenceId, {
      studentId: artifact.student_id,
      reason: "student_scope_denied",
    });
    return json({ error: "forbidden", canAccess: false }, { status: 403 });
  }

  await auditEvidenceAccess(env, request, user, "evidence_access_checked", evidenceId, {
    studentId: artifact.student_id,
    sourceKind: artifact.source_kind,
  });

  return json({
    canAccess: true,
    artifact: {
      id: artifact.id,
      title: artifact.title,
      studentId: artifact.student_id,
      submissionId: artifact.submission_id,
      artifactType: artifact.artifact_type,
      sourceKind: artifact.source_kind,
      externalUrl: artifact.source_kind === "external_link" ? artifact.external_url : null,
      reviewStatus: artifact.review_status,
      createdAt: artifact.created_at,
    },
    storage: {
      provider: "google_drive",
      fileBytesReady: artifact.source_kind === "google_drive_file",
      signedRetrievalReady: false,
    },
  });
};

async function auditEvidenceAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  evidenceId: string,
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
    entityType: "evidence_artifact",
    entityId: evidenceId,
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
