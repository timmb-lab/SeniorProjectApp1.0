import type { Env, RoleAssignment, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import { getRoleAssignments, hasRole } from "../../../_lib/permissions.ts";
import { cleanWorkflowText, getSubmission, validateHttpsUrl, workflowError } from "../../../_lib/workflow.ts";

interface EvidenceLinkBody {
  title?: string;
  url?: string;
  artifactType?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const submissionId = String(params?.id || "").trim();
  if (!submissionId) return badRequest("missing_submission_id");

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditEvidenceLink(env, request, null, "evidence_attach_unauthorized", "submission", submissionId, {
      reason: "missing_session",
    });
    return workflowError("unauthorized", 401);
  }

  let body: EvidenceLinkBody;
  try {
    body = await readJson<EvidenceLinkBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);
  if (submission.student_id !== user.id || !await hasRole(env, user.id, "student")) {
    await auditEvidenceLink(env, request, user, "evidence_attach_denied", "submission", submission.id, {
      reason: "student_scope_denied",
      studentId: submission.student_id,
    });
    return workflowError("forbidden", 403);
  }

  const urlValidation = validateHttpsUrl(body.url);
  const externalUrl = urlValidation.url;
  if (!externalUrl) {
    if (urlValidation.error === "unsafe_evidence_url") {
      await auditEvidenceLink(env, request, user, "evidence_link_blocked_unsafe_url", "submission", submission.id, {
        reason: urlValidation.reason,
        studentId: submission.student_id,
        hostname: urlValidation.hostname,
        urlLength: urlValidation.urlLength,
      });
    }
    return badRequest(urlValidation.error || "invalid_https_evidence_url");
  }

  const title = cleanWorkflowText(body.title, "Capstone evidence link", 160);
  const artifactType = cleanWorkflowText(body.artifactType, "planning_document", 80).replace(/[^a-z0-9_-]/gi, "_");
  const evidenceId = randomId("evidence");

  await env.DB.prepare(
    `INSERT INTO evidence_artifacts (
       id,
       repository_id,
       student_id,
       submission_id,
       artifact_type,
       source_kind,
       external_url,
       title,
       review_status,
       created_by
     )
     VALUES (?, 'default-google-drive', ?, ?, ?, 'external_link', ?, ?, 'pending_review', ?)`,
  ).bind(evidenceId, submission.student_id, submission.id, artifactType, externalUrl, title, user.id).run();

  await auditEvidenceLink(env, request, user, "evidence_link_attached", "evidence_artifact", evidenceId, {
    submissionId: submission.id,
    studentId: submission.student_id,
    sourceKind: "external_link",
  });

  return json({
    ok: true,
    evidence: {
      id: evidenceId,
      submissionId: submission.id,
      studentId: submission.student_id,
      title,
      artifactType,
      sourceKind: "external_link",
      externalUrl,
      reviewStatus: "pending_review",
    },
    storage: {
      provider: "google_drive",
      metadataReady: true,
      fileBytesReady: false,
      signedRetrievalReady: false,
    },
  });
};

async function auditEvidenceLink(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  entityType: string,
  entityId: string,
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
    entityType,
    entityId,
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
