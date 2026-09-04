import type { Env, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { applyApiSecurityHeaders, badRequest } from "../../../_lib/http.ts";
import { canAccessStudent } from "../../../_lib/permissions.ts";
import { workflowError } from "../../../_lib/workflow.ts";

interface OpenEvidenceRow {
  id: string;
  student_id: string;
  source_kind: string;
  drive_file_id: string | null;
  deleted_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const evidenceId = String(params?.id || "").trim();
  if (!evidenceId) return badRequest("missing_evidence_id");

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditOpen(env, request, null, "evidence_drive_open_unauthorized", evidenceId);
    return workflowError("unauthorized", 401);
  }

  const artifact = await env.DB.prepare(
    `SELECT id, student_id, source_kind, drive_file_id, deleted_at
     FROM evidence_artifacts WHERE id = ?`,
  ).bind(evidenceId).first<OpenEvidenceRow>();
  if (!artifact || artifact.deleted_at) {
    await auditOpen(env, request, user, "evidence_drive_open_missing", evidenceId);
    return workflowError("not_found", 404);
  }
  if (!await canAccessStudent(env, user, artifact.student_id)) {
    await auditOpen(env, request, user, "evidence_drive_open_denied", evidenceId);
    return workflowError("forbidden", 403);
  }
  if (artifact.source_kind !== "google_drive_file" || !artifact.drive_file_id) {
    return workflowError("not_a_drive_file", 409);
  }

  await auditOpen(env, request, user, "evidence_drive_opened", evidenceId);
  const destination = new URL("https://drive.google.com/open");
  destination.searchParams.set("id", artifact.drive_file_id);
  const headers = new Headers({ location: destination.toString() });
  applyApiSecurityHeaders(headers);
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("referrer-policy", "no-referrer");
  return new Response(null, { status: 302, headers });
};

async function auditOpen(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  evidenceId: string,
) {
  await writeAudit(env, {
    actorUserId: user?.id || null,
    action,
    entityType: "evidence_artifact",
    entityId: evidenceId,
    request,
    metadata: {},
  });
}
