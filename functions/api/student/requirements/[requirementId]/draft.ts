import type { Env, RoleAssignment, UserAccount } from "../../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../../_lib/auth.ts";
import { randomId } from "../../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../../_lib/http.ts";
import { getRoleAssignments, hasRole } from "../../../../_lib/permissions.ts";
import { workflowError } from "../../../../_lib/workflow.ts";

interface DraftBody {
  responseText?: string;
}

interface RequirementRow {
  id: string;
  phase: string;
  title: string;
  work_scope: "project" | "individual";
}

interface SubmissionRow {
  id: string;
  status: string;
  version: number;
}

const MAX_RESPONSE_LENGTH = 6000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const requirementId = String(params?.requirementId || "").trim();
  if (!requirementId) return badRequest("missing_requirement_id");

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await hasRole(env, user.id, "student")) return workflowError("forbidden", 403);

  let body: DraftBody;
  try {
    body = await readJson<DraftBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const responseText = typeof body.responseText === "string" ? body.responseText.replace(/\r\n/g, "\n").trim() : "";
  if (!responseText) return badRequest("response_text_required");
  if (responseText.length > MAX_RESPONSE_LENGTH) return badRequest("response_text_too_long");

  const requirement = await assignedRequirement(env, user.id, requirementId);
  if (!requirement) return workflowError("requirement_not_found", 404);
  const projectId = await activeProjectId(env, user.id) || "";

  let submission = await env.DB.prepare(
    `SELECT id, status, version
     FROM submissions
     WHERE requirement_id = ?
       AND (
         (? = 'project' AND ((? != '' AND project_id = ?) OR (? = '' AND student_id = ?)))
         OR (? = 'individual' AND student_id = ?)
       )
     ORDER BY updated_at DESC
     LIMIT 1`,
  ).bind(requirement.id, requirement.work_scope, projectId, projectId, projectId, user.id, requirement.work_scope, user.id).first<SubmissionRow>();

  if (submission && ["submitted", "approved", "archived"].includes(submission.status)) {
    return workflowError("draft_not_editable", 409);
  }

  const submissionId = submission?.id || randomId("submission");
  const responseId = randomId("response");
  const statements = [];

  if (!submission) {
    statements.push(env.DB.prepare(
      `INSERT INTO submissions (id, student_id, requirement_id, status, version, project_id)
       VALUES (?, ?, ?, 'draft', 1, ?)`,
    ).bind(submissionId, user.id, requirement.id, projectId || null));
    submission = { id: submissionId, status: "draft", version: 1 };
  }

  statements.push(env.DB.prepare(
    `INSERT INTO student_work_responses (id, submission_id, student_id, requirement_id, response_text)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(submission_id) DO UPDATE SET
       student_id = excluded.student_id,
       response_text = excluded.response_text,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(responseId, submissionId, user.id, requirement.id, responseText));

  const progress = await env.DB.prepare(
    `SELECT id, status FROM progress_records
     WHERE requirement_id = ?
       AND (
         (? = 'project' AND ((? != '' AND project_id = ?) OR (? = '' AND student_id = ?)))
         OR (? = 'individual' AND student_id = ?)
       )
     ORDER BY updated_at DESC LIMIT 1`,
  ).bind(requirement.id, requirement.work_scope, projectId, projectId, projectId, user.id, requirement.work_scope, user.id).first<{ id: string; status: string }>();

  if (!progress) {
    statements.push(env.DB.prepare(
      `INSERT INTO progress_records (id, student_id, requirement_id, phase, status, updated_by, project_id)
       VALUES (?, ?, ?, ?, 'in_progress', ?, ?)`,
    ).bind(randomId("progress"), user.id, requirement.id, requirement.phase, user.id, projectId || null));
  } else if (["not_started", "in_progress"].includes(progress.status)) {
    statements.push(env.DB.prepare(
      `UPDATE progress_records
       SET status = 'in_progress', updated_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).bind(user.id, progress.id));
  }

  await env.DB.batch(statements);
  await writeAudit(env, {
    actorUserId: user.id,
    action: "student_guided_draft_saved",
    entityType: "submission",
    entityId: submissionId,
    request,
    metadata: {
      requirementId: requirement.id,
      projectId,
      workScope: requirement.work_scope,
      responseLength: responseText.length,
      actorRoleScopes: serializeRoleScopes(await getRoleAssignments(env, user.id)),
    },
  });

  return json({
    ok: true,
    submission: {
      id: submissionId,
      requirementId: requirement.id,
      status: submission.status,
      version: submission.version,
    },
    response: {
      text: responseText,
      length: responseText.length,
    },
  });
};

function assignedRequirement(env: Env, studentId: string, requirementId: string) {
  return env.DB.prepare(
    `SELECT requirements.id, requirements.phase, requirements.title, requirements.work_scope
     FROM requirements
     WHERE requirements.id = ?
       AND requirements.required = 1
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
       )
     LIMIT 1`,
  ).bind(requirementId, studentId).first<RequirementRow>();
}

async function activeProjectId(env: Env, studentId: string): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT project_members.project_id
     FROM project_members
     JOIN projects ON projects.id = project_members.project_id
       AND projects.status = 'active'
     WHERE project_members.student_user_id = ?
       AND project_members.active = 1
     LIMIT 1`,
  ).bind(studentId).first<{ project_id: string }>();
  return row?.project_id || null;
}

function serializeRoleScopes(assignments: RoleAssignment[]): Array<{ roleId: string; scopeType: string; scopeId: string }> {
  return assignments.map((assignment) => ({
    roleId: assignment.role_id,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id,
  }));
}
