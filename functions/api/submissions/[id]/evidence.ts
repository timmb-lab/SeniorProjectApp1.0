import type { Env } from "../../../_types";
import { getCurrentUser, writeAudit } from "../../../_lib/auth";
import { randomId } from "../../../_lib/crypto";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http";
import { hasRole } from "../../../_lib/permissions";
import { cleanHttpsUrl, cleanWorkflowText, getSubmission, workflowError } from "../../../_lib/workflow";

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
  if (!user) return workflowError("unauthorized", 401);

  let body: EvidenceLinkBody;
  try {
    body = await readJson<EvidenceLinkBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);
  if (submission.student_id !== user.id || !await hasRole(env, user.id, "student")) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "evidence_attach_denied",
      entityType: "submission",
      entityId: submission.id,
      request,
      metadata: { studentId: submission.student_id },
    });
    return workflowError("forbidden", 403);
  }

  const externalUrl = cleanHttpsUrl(body.url);
  if (!externalUrl) return badRequest("invalid_https_evidence_url");

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

  await writeAudit(env, {
    actorUserId: user.id,
    action: "evidence_link_attached",
    entityType: "evidence_artifact",
    entityId: evidenceId,
    request,
    metadata: {
      submissionId: submission.id,
      studentId: submission.student_id,
      sourceKind: "external_link",
    },
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

