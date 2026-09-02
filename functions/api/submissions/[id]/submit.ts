import type { Env, RoleAssignment, UserAccount } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, requirePost } from "../../../_lib/http.ts";
import { canAccessProject, getRoleAssignments, hasRole } from "../../../_lib/permissions.ts";
import { getSubmission, workflowError, writeStatusHistory, writeSubmissionVersionSnapshot } from "../../../_lib/workflow.ts";

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const submissionId = String(params?.id || "").trim();
  if (!submissionId) return badRequest("missing_submission_id");

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditSubmissionSubmit(env, request, null, "submission_submit_unauthorized", submissionId, {
      reason: "missing_session",
    });
    return workflowError("unauthorized", 401);
  }

  const submission = await getSubmission(env, submissionId);
  if (!submission) return workflowError("not_found", 404);
  let requirementScope: { work_scope: string } | null = null;
  if (submission.requirement_id) {
    try {
      requirementScope = await env.DB.prepare("SELECT work_scope FROM requirements WHERE id = ? LIMIT 1")
        .bind(submission.requirement_id).first<{ work_scope: string }>();
    } catch {
      requirementScope = { work_scope: "individual" };
    }
  }
  const isStudent = await hasRole(env, user.id, "student");
  const canSubmitProjectWork = requirementScope?.work_scope === "project"
    && Boolean(submission.project_id)
    && await canAccessProject(env, user, submission.project_id || "");
  if (!isStudent || (submission.student_id !== user.id && !canSubmitProjectWork)) {
    await auditSubmissionSubmit(env, request, user, "submission_submit_denied", submission.id, {
      reason: "student_scope_denied",
      studentId: submission.student_id,
    });
    return workflowError("forbidden", 403);
  }
  if (!["draft", "revision_requested"].includes(submission.status)) {
    return workflowError("submission_not_submittable", 409);
  }

  if (!await priorPhasesAreApproved(env, submission.student_id, submission.project_id, submission.requirement_id)) {
    await auditSubmissionSubmit(env, request, user, "submission_submit_blocked_phase_gate", submission.id, {
      reason: "prior_phase_not_approved",
      studentId: submission.student_id,
      requirementId: submission.requirement_id,
    });
    return workflowError("phase_gate_locked", 409);
  }

  const evidenceCountRow = await env.DB.prepare(
    `SELECT COUNT(id) AS evidence_count
     FROM evidence_artifacts
     WHERE submission_id = ?
       AND deleted_at IS NULL
       AND review_status != 'archived'`,
  ).bind(submission.id).first<{ evidence_count: number }>();

  const evidenceCount = Number(evidenceCountRow?.evidence_count || 0);
  const writtenResponse = await env.DB.prepare(
    `SELECT response_text
     FROM student_work_responses
     WHERE submission_id = ?
     LIMIT 1`,
  ).bind(submission.id).first<{ response_text: string }>();
  const responseText = String(writtenResponse?.response_text || "").trim();
  if ((!Number.isFinite(evidenceCount) || evidenceCount <= 0) && !responseText) {
    await auditSubmissionSubmit(env, request, user, "submission_submit_blocked_missing_evidence", submission.id, {
      reason: "missing_required_evidence",
      submissionId: submission.id,
      studentId: submission.student_id,
      status: submission.status,
      evidenceCount,
      writtenResponseLength: 0,
    });
    return workflowError("submission_missing_evidence", 409);
  }

  const nextVersion = submission.status === "revision_requested" ? submission.version + 1 : submission.version;
  await env.DB.prepare(
    `UPDATE submissions
     SET status = 'submitted',
         version = ?,
         submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(nextVersion, submission.id).run();

  await writeSubmissionVersionSnapshot(env, {
    submission,
    version: nextVersion,
    submittedBy: user.id,
    notes: submission.status === "revision_requested"
      ? "Revision resubmitted for teacher review."
      : "Initial submission for teacher review.",
  });

  if (responseText) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO student_work_response_versions (id, submission_id, version, response_text)
       VALUES (?, ?, ?, ?)`,
    ).bind(randomId("response-version"), submission.id, nextVersion, responseText).run();
  }

  await env.DB.prepare(
    `UPDATE progress_records
     SET status = 'submitted',
         updated_by = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE requirement_id = ?
       AND (
         (project_id = ? AND EXISTS (SELECT 1 FROM requirements WHERE requirements.id = progress_records.requirement_id AND requirements.work_scope = 'project'))
         OR (student_id = ? AND EXISTS (SELECT 1 FROM requirements WHERE requirements.id = progress_records.requirement_id AND requirements.work_scope = 'individual'))
         OR (? IS NULL AND student_id = ?)
       )`,
  ).bind(user.id, submission.requirement_id, submission.project_id, submission.student_id, submission.project_id, submission.student_id).run();

  await writeStatusHistory(env, {
    studentId: submission.student_id,
    entityType: "submission",
    entityId: submission.id,
    fromStatus: submission.status,
    toStatus: "submitted",
    changedBy: user.id,
    reason: "Student submitted proposal for review.",
    projectId: submission.project_id,
  });

  await auditSubmissionSubmit(env, request, user, "submission_submitted", submission.id, {
    studentId: submission.student_id,
    fromStatus: submission.status,
    toStatus: "submitted",
    version: nextVersion,
    evidenceCount,
    writtenResponseLength: responseText.length,
  });

  return json({
    ok: true,
    submission: {
      id: submission.id,
      studentId: submission.student_id,
      ...(submission.project_id ? { projectId: submission.project_id } : {}),
      status: "submitted",
      version: nextVersion,
    },
  });
};

const PHASE_ORDER = ["start", "phase-1", "phase-2a", "phase-2b", "phase-3a", "phase-3b", "phase-4", "finish"];

async function priorPhasesAreApproved(env: Env, studentId: string, projectId: string | null, requirementId: string | null): Promise<boolean> {
  if (!requirementId) return true;
  if (!projectId) return priorPhasesAreApprovedForLegacyStudent(env, studentId, requirementId);
  const current = await env.DB.prepare(
    "SELECT phase, work_scope FROM requirements WHERE id = ? LIMIT 1",
  ).bind(requirementId).first<{ phase: string; work_scope: string }>();
  const currentRank = phaseRank(current?.phase || "");
  if (currentRank <= 0) return true;

  const rows = await env.DB.prepare(
    `SELECT
       requirements.id,
       requirements.phase,
       (
         SELECT progress_records.status
         FROM progress_records
         WHERE progress_records.requirement_id = requirements.id
           AND (
             (requirements.work_scope = 'project' AND progress_records.project_id = ?)
             OR (requirements.work_scope = 'individual' AND progress_records.student_id = ?)
           )
         ORDER BY progress_records.updated_at DESC
         LIMIT 1
       ) AS progress_status
     FROM requirements
     WHERE requirements.required = 1
       AND (
         requirements.program_id IS NULL
         OR requirements.program_id IN (
           SELECT DISTINCT groups.program_id
           FROM group_memberships
           JOIN groups ON groups.id = group_memberships.group_id
           WHERE group_memberships.user_id = ?
             AND groups.program_id IS NOT NULL
             AND groups.program_id != ''
         )
       )`,
  ).bind(projectId || "", studentId, studentId).all<{ id: string; phase: string; progress_status: string | null }>();

  return (rows.results || [])
    .filter((row) => phaseRank(row.phase) < currentRank)
    .every((row) => ["approved", "archived"].includes(row.progress_status || ""));
}

async function priorPhasesAreApprovedForLegacyStudent(env: Env, studentId: string, requirementId: string): Promise<boolean> {
  const current = await env.DB.prepare(
    "SELECT phase FROM requirements WHERE id = ? LIMIT 1",
  ).bind(requirementId).first<{ phase: string }>();
  const currentRank = phaseRank(current?.phase || "");
  if (currentRank <= 0) return true;
  const rows = await env.DB.prepare(
    `SELECT
       requirements.id,
       requirements.phase,
       (
         SELECT progress_records.status
         FROM progress_records
         WHERE progress_records.student_id = ?
           AND progress_records.requirement_id = requirements.id
         ORDER BY progress_records.updated_at DESC
         LIMIT 1
       ) AS progress_status
     FROM requirements
     WHERE requirements.required = 1
       AND (
         requirements.program_id IS NULL
         OR requirements.program_id IN (
           SELECT DISTINCT groups.program_id
           FROM group_memberships
           JOIN groups ON groups.id = group_memberships.group_id
           WHERE group_memberships.user_id = ?
             AND groups.program_id IS NOT NULL
             AND groups.program_id != ''
         )
       )`,
  ).bind(studentId, studentId).all<{ id: string; phase: string; progress_status: string | null }>();
  return (rows.results || [])
    .filter((row) => phaseRank(row.phase) < currentRank)
    .every((row) => ["approved", "archived"].includes(row.progress_status || ""));
}

function phaseRank(value: string): number {
  const normalized = String(value || "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    setup: "start",
    purpose: "start",
    proposal: "phase-1",
    "proposal-and-research": "phase-1",
    "mentor-checkpoints": "phase-2a",
    "mentor-meetings": "phase-2a",
    presentation: "phase-3a",
    "presentation-day": "phase-3a",
    "presentation-and-celebration": "phase-3a",
    "celebration-day": "phase-3b",
    portfolio: "phase-4",
    "reflection-and-archive": "phase-4",
    "wrap-up": "finish",
  };
  const key = aliases[normalized] || normalized;
  const rank = PHASE_ORDER.indexOf(key);
  return rank === -1 ? PHASE_ORDER.length : rank;
}

async function auditSubmissionSubmit(
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
