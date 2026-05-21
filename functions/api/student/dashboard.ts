import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canAccessStudent, getRoleAssignments, hasRole } from "../../_lib/permissions.ts";

interface ProgressRow {
  id: string;
  requirement_id: string | null;
  phase: string;
  status: string;
  updated_at: string;
  requirement_title: string | null;
}

interface SubmissionSummaryRow {
  id: string;
  requirement_id: string | null;
  status: string;
  version: number;
  submitted_at: string | null;
  updated_at: string;
  requirement_title: string | null;
}

interface EvidenceSummaryRow {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  external_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
}

interface EvidenceSummary {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
  fileBytesReady: boolean;
  downloadUrl: string | null;
  externalUrl: string | null;
  storageIdentifiersRedacted: true;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const requestedStudentId = url.searchParams.get("studentId") || null;
  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditDashboardAccess(env, request, null, "student_dashboard_unauthorized", requestedStudentId, {
      reason: "missing_session",
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const studentId = requestedStudentId || user.id;
  if (!await canAccessStudent(env, user, studentId)) {
    await auditDashboardAccess(env, request, user, "student_dashboard_denied", studentId, {
      reason: "student_scope_denied",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const isStudentSelf = user.id === studentId && await hasRole(env, user.id, "student");
  const progress = await env.DB.prepare(
    `SELECT
       progress.id,
       progress.requirement_id,
       progress.phase,
       progress.status,
       progress.updated_at,
       requirements.title AS requirement_title
     FROM progress_records progress
     LEFT JOIN requirements ON requirements.id = progress.requirement_id
     WHERE progress.student_id = ?
     ORDER BY progress.updated_at DESC
     LIMIT 20`,
  ).bind(studentId).all<ProgressRow>();

  const submissions = await env.DB.prepare(
    `SELECT
       submissions.id,
       submissions.requirement_id,
       submissions.status,
       submissions.version,
       submissions.submitted_at,
       submissions.updated_at,
       requirements.title AS requirement_title
     FROM submissions
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE submissions.student_id = ?
     ORDER BY submissions.updated_at DESC
     LIMIT 20`,
  ).bind(studentId).all<SubmissionSummaryRow>();

  const evidence = await env.DB.prepare(
    `SELECT id, title, artifact_type, source_kind, external_url, mime_type, size_bytes, review_status, created_at
     FROM evidence_artifacts
     WHERE student_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 20`,
  ).bind(studentId).all<EvidenceSummaryRow>();

  const progressRows = progress.results || [];
  const submissionRows = submissions.results || [];
  const evidenceRows = evidence.results || [];

  await auditDashboardAccess(env, request, user, "student_dashboard_viewed", studentId, {
    self: isStudentSelf,
    progressCount: progressRows.length,
    submissionCount: submissionRows.length,
    evidenceCount: evidenceRows.length,
  });

  return json({
    ok: true,
    studentId,
    viewer: {
      id: user.id,
      email: user.email,
      self: isStudentSelf,
    },
    nextAction: deriveNextAction(submissionRows, evidenceRows),
    progress: progressRows,
    submissions: submissionRows,
    evidence: evidenceRows.map(summarizeEvidence),
  });
};

function deriveNextAction(submissions: SubmissionSummaryRow[], evidence: EvidenceSummaryRow[]): string {
  const current = submissions[0];
  if (!current) return "Start the proposal requirement.";
  if (evidence.length === 0) return "Attach at least one evidence artifact.";
  if (current.status === "draft") return "Submit the proposal for teacher review.";
  if (current.status === "revision_requested") return "Revise and resubmit the proposal.";
  if (current.status === "submitted") return "Wait for teacher review.";
  if (current.status === "approved") return "Move into build evidence and mentor preparation.";
  return "Review the current capstone status.";
}

function summarizeEvidence(row: EvidenceSummaryRow): EvidenceSummary {
  const isDriveFile = row.source_kind === "google_drive_file";
  const isExternalLink = row.source_kind === "external_link";

  return {
    id: row.id,
    title: row.title,
    artifact_type: row.artifact_type,
    source_kind: row.source_kind,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    review_status: row.review_status,
    created_at: row.created_at,
    fileBytesReady: isDriveFile,
    downloadUrl: isDriveFile ? `/api/evidence/${encodeURIComponent(row.id)}/download` : null,
    externalUrl: isExternalLink ? row.external_url : null,
    storageIdentifiersRedacted: true,
  };
}

async function auditDashboardAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  studentId: string | null,
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
    entityType: "student_dashboard",
    entityId: studentId,
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
