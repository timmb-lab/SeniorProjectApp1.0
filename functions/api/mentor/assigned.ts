import type { Env } from "../../_types.ts";
import { getCurrentUser } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { hasRole } from "../../_lib/permissions.ts";

interface AssignedStudentRow {
  student_id: string;
  student_name: string;
  assignment_id: string;
  submission_status: string | null;
  submission_id: string | null;
  evidence_count: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  if (!await hasRole(env, user.id, "mentor")) return json({ error: "forbidden" }, { status: 403 });

  const rows = await env.DB.prepare(
    `SELECT
       student.id AS student_id,
       student.display_name AS student_name,
       mentor_assignments.id AS assignment_id,
       submissions.id AS submission_id,
       submissions.status AS submission_status,
       COUNT(evidence.id) AS evidence_count
     FROM mentor_assignments
     JOIN user_accounts student ON student.id = mentor_assignments.student_user_id
     LEFT JOIN submissions ON submissions.student_id = student.id
     LEFT JOIN evidence_artifacts evidence
       ON evidence.student_id = student.id
      AND evidence.deleted_at IS NULL
     WHERE mentor_assignments.mentor_user_id = ?
       AND mentor_assignments.active = 1
     GROUP BY mentor_assignments.id, submissions.id
     ORDER BY student.display_name ASC`,
  ).bind(user.id).all<AssignedStudentRow>();

  return json({
    ok: true,
    mentorId: user.id,
    assignedStudents: (rows.results || []).map((row) => ({
      studentId: row.student_id,
      studentName: row.student_name,
      assignmentId: row.assignment_id,
      submissionId: row.submission_id,
      submissionStatus: row.submission_status,
      evidenceCount: row.evidence_count,
    })),
  });
};
