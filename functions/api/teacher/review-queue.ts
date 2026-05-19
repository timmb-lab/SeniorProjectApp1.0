import type { Env } from "../../_types";
import { getCurrentUser } from "../../_lib/auth";
import { json } from "../../_lib/http";
import { hasRole, isAdmin } from "../../_lib/permissions";

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
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const admin = await isAdmin(env, user.id);
  const programTeacher = await hasRole(env, user.id, "program_teacher");
  if (!admin && !programTeacher) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  const queue = admin
    ? await env.DB.prepare(baseQueueSql("1 = 1")).all<ReviewQueueRow>()
    : await env.DB.prepare(baseQueueSql(teacherScopePredicate())).bind(user.id).all<ReviewQueueRow>();

  return json({
    ok: true,
    viewer: {
      id: user.id,
      email: user.email,
      admin,
    },
    queue: queue.results || [],
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
          OR (teacher_role.scope_type = 'program' AND teacher_role.scope_id = COALESCE(g.program_id, ''))
          OR (teacher_role.scope_type = 'cohort' AND teacher_role.scope_id = COALESCE(g.cohort_id, ''))
        )
    )`;
}

