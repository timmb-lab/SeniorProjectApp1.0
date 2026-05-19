import type { Env } from "../../_types";
import { getCurrentUser } from "../../_lib/auth";
import { json } from "../../_lib/http";
import { canAccessStudent, hasRole } from "../../_lib/permissions";

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
  review_status: string;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedStudentId = url.searchParams.get("studentId") || user.id;
  if (!await canAccessStudent(env, user, requestedStudentId)) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  const isStudentSelf = user.id === requestedStudentId && await hasRole(env, user.id, "student");
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
  ).bind(requestedStudentId).all<ProgressRow>();

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
  ).bind(requestedStudentId).all<SubmissionSummaryRow>();

  const evidence = await env.DB.prepare(
    `SELECT id, title, artifact_type, source_kind, review_status, created_at
     FROM evidence_artifacts
     WHERE student_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 20`,
  ).bind(requestedStudentId).all<EvidenceSummaryRow>();

  return json({
    ok: true,
    studentId: requestedStudentId,
    viewer: {
      id: user.id,
      email: user.email,
      self: isStudentSelf,
    },
    nextAction: deriveNextAction(submissions.results || [], evidence.results || []),
    progress: progress.results || [],
    submissions: submissions.results || [],
    evidence: evidence.results || [],
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
