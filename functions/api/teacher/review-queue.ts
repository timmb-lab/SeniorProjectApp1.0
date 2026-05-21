import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { getRoleAssignments, hasRole, isAdmin } from "../../_lib/permissions.ts";

interface ReviewQueueRow {
  submission_id: string;
  student_id: string;
  student_name: string;
  requirement_title: string | null;
  status: string;
  version: number;
  submitted_at: string | null;
  updated_at: string;
  evidence_count: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditReviewQueueAccess(env, request, null, "review_queue_unauthorized", {
      reason: "missing_session",
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = await isAdmin(env, user.id);
  const programTeacher = await hasRole(env, user.id, "program_teacher");
  if (!admin && !programTeacher) {
    await auditReviewQueueAccess(env, request, user, "review_queue_denied", {
      reason: "missing_staff_role",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const queue = admin
    ? await env.DB.prepare(baseQueueSql("1 = 1")).all<ReviewQueueRow>()
    : await env.DB.prepare(baseQueueSql(teacherScopePredicate())).bind(user.id).all<ReviewQueueRow>();
  const queueRows = queue.results || [];

  await auditReviewQueueAccess(env, request, user, "review_queue_viewed", {
    admin,
    queueCount: queueRows.length,
  });

  return json({
    ok: true,
    viewer: {
      id: user.id,
      email: user.email,
      admin,
    },
    queue: queueRows,
  });
};

function baseQueueSql(scopePredicate: string): string {
  return `
    SELECT
      submissions.id AS submission_id,
      submissions.student_id,
      student.display_name AS student_name,
      requirements.title AS requirement_title,
      submissions.status,
      submissions.version,
      submissions.submitted_at,
      submissions.updated_at,
      COUNT(evidence.id) AS evidence_count
    FROM submissions
    JOIN user_accounts student ON student.id = submissions.student_id
    LEFT JOIN requirements ON requirements.id = submissions.requirement_id
    LEFT JOIN evidence_artifacts evidence
      ON evidence.submission_id = submissions.id
     AND evidence.deleted_at IS NULL
    WHERE submissions.status IN ('submitted', 'revision_requested')
      AND (${scopePredicate})
    GROUP BY submissions.id
    ORDER BY submissions.updated_at DESC
    LIMIT 50`;
}

function teacherScopePredicate(): string {
  return `
    EXISTS (
      SELECT 1
      FROM user_roles teacher_role
      JOIN group_memberships student_group ON student_group.user_id = submissions.student_id
      JOIN groups g ON g.id = student_group.group_id
      WHERE teacher_role.user_id = ?
        AND teacher_role.role_id = 'program_teacher'
        AND (
        teacher_role.scope_type = 'global'
        OR (
          teacher_role.scope_type = 'program'
          AND teacher_role.scope_id <> ''
          AND g.program_id IS NOT NULL
          AND g.program_id <> ''
          AND teacher_role.scope_id = g.program_id
        )
        OR (
          teacher_role.scope_type = 'cohort'
          AND teacher_role.scope_id <> ''
          AND g.cohort_id IS NOT NULL
          AND g.cohort_id <> ''
          AND teacher_role.scope_id = g.cohort_id
        )
      )
    )`;
}

async function auditReviewQueueAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
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
    entityType: "teacher_review_queue",
    entityId: null,
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
