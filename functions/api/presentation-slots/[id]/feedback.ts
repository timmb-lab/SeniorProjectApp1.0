import type { Env } from "../../../_types.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { randomId } from "../../../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../../../_lib/http.ts";
import { canAccessStudent, hasAnyRole, isAdmin } from "../../../_lib/permissions.ts";
import { cleanWorkflowText, workflowError } from "../../../_lib/workflow.ts";

interface FeedbackBody {
  clarityScore?: unknown;
  evidenceScore?: unknown;
  organizationScore?: unknown;
  readinessScore?: unknown;
  notes?: unknown;
}

interface SlotRow { id: string; student_user_id: string }

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;
  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  const slotId = String(params.id || "").trim();
  if (!slotId) return workflowError("presentation_slot_not_found", 404);
  const slot = await env.DB.prepare(
    "SELECT id, student_user_id FROM presentation_slots WHERE id = ? AND status != 'cancelled' LIMIT 1",
  ).bind(slotId).first<SlotRow>();
  if (!slot) return workflowError("presentation_slot_not_found", 404);

  const canCoach = await isAdmin(env, user.id) || await hasAnyRole(env, user.id, [
    "global_admin", "platform_admin", "site_admin", "administration", "program_teacher", "mentor",
  ]);
  if (!canCoach || !await canAccessStudent(env, user, slot.student_user_id)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "presentation_practice_feedback_denied",
      entityType: "presentation_slot",
      entityId: slotId,
      request,
      metadata: { studentId: slot.student_user_id, reason: canCoach ? "student_scope" : "role_not_allowed" },
    });
    return workflowError("forbidden", 403);
  }

  let body: FeedbackBody;
  try { body = await readJson<FeedbackBody>(request); } catch { return badRequest("invalid_json"); }
  const scores = [body.clarityScore, body.evidenceScore, body.organizationScore, body.readinessScore].map(scoreValue);
  if (scores.some((score) => score === null)) return badRequest("invalid_rubric_score");
  const rubricScores = scores as number[];
  const notes = cleanWorkflowText(body.notes, "", 4000);
  const feedbackId = randomId("presentation-feedback");

  await env.DB.prepare(
    `INSERT INTO presentation_practice_feedback (
       id, presentation_slot_id, author_user_id, clarity_score, evidence_score,
       organization_score, readiness_score, notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(presentation_slot_id, author_user_id) DO UPDATE SET
       clarity_score = excluded.clarity_score,
       evidence_score = excluded.evidence_score,
       organization_score = excluded.organization_score,
       readiness_score = excluded.readiness_score,
       notes = excluded.notes,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(feedbackId, slotId, user.id, rubricScores[0], rubricScores[1], rubricScores[2], rubricScores[3], notes).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "presentation_practice_feedback_saved",
    entityType: "presentation_slot",
    entityId: slotId,
    request,
    metadata: { studentId: slot.student_user_id, rubricTotal: rubricScores.reduce((sum, score) => sum + score, 0) },
  });
  return json({ ok: true });
};

function scoreValue(value: unknown): number | null {
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 4 ? score : null;
}
