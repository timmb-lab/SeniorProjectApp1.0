import type { Env } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { badRequest, json, readJson, requirePost } from "../../_lib/http.ts";
import { hasRole } from "../../_lib/permissions.ts";
import { randomId } from "../../_lib/crypto.ts";
import { cleanWorkflowText, workflowError } from "../../_lib/workflow.ts";

interface MeetingRow {
  id: string;
  student_id: string;
  student_name: string;
  status: string;
  scheduled_for: string | null;
  held_at: string | null;
  notes: string | null;
  created_at: string;
}

interface CreateMeetingBody {
  studentId?: unknown;
  status?: unknown;
  scheduledFor?: unknown;
  notes?: unknown;
  submissionId?: unknown;
}

const ALLOWED_STATUSES = new Set(["scheduled", "held", "missed", "makeup_required"]);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  if (!await hasRole(env, user.id, "mentor")) return json({ error: "forbidden" }, { status: 403 });

  const rows = await env.DB.prepare(
    `SELECT
       mentor_meetings.id,
       mentor_meetings.student_user_id AS student_id,
       student.display_name AS student_name,
       mentor_meetings.status,
       mentor_meetings.scheduled_for,
       mentor_meetings.held_at,
       mentor_meetings.notes,
       mentor_meetings.created_at
     FROM mentor_meetings
     JOIN user_accounts student ON student.id = mentor_meetings.student_user_id
     WHERE mentor_meetings.mentor_user_id = ?
     ORDER BY mentor_meetings.created_at DESC
     LIMIT 50`,
  ).bind(user.id).all<MeetingRow>();

  return json({
    ok: true,
    mentorId: user.id,
    meetings: (rows.results || []).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      status: row.status,
      scheduledFor: row.scheduled_for,
      heldAt: row.held_at,
      notes: row.notes,
      createdAt: row.created_at,
    })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  let body: CreateMeetingBody;
  try {
    body = await readJson<CreateMeetingBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
  if (!studentId) return badRequest("missing_student_id");

  const status = typeof body.status === "string" ? body.status.trim() : "held";
  if (!ALLOWED_STATUSES.has(status)) return badRequest("invalid_status");

  const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor.trim() : "";
  const heldAt = status === "held" ? new Date().toISOString() : null;
  const notes = cleanWorkflowText(body.notes, "", 1200) || null;
  const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : null;

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await hasRole(env, user.id, "mentor")) return workflowError("forbidden", 403);

  const assignmentRow = await env.DB.prepare(
    `SELECT id
     FROM mentor_assignments
     WHERE mentor_user_id = ?
       AND student_user_id = ?
       AND active = 1
     LIMIT 1`,
  ).bind(user.id, studentId).first<{ id: string }>();
  if (!assignmentRow) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "mentor_meeting_denied",
      entityType: "mentor_meeting",
      entityId: null,
      request,
      metadata: { studentId, status },
    });
    return workflowError("forbidden", 403);
  }

  const meetingId = randomId("meeting");
  await env.DB.prepare(
    `INSERT INTO mentor_meetings (
       id,
       mentor_user_id,
       student_user_id,
       submission_id,
       status,
       scheduled_for,
       held_at,
       notes,
       created_by,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
  ).bind(
    meetingId,
    user.id,
    studentId,
    submissionId,
    status,
    scheduledFor || null,
    heldAt,
    notes,
    user.id,
  ).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: status === "held" ? "mentor_meeting_held" : "mentor_meeting_recorded",
    entityType: "mentor_meeting",
    entityId: meetingId,
    request,
    metadata: {
      studentId,
      status,
      heldAt,
      scheduledFor: scheduledFor || null,
      submissionId,
    },
  });

  return json({
    ok: true,
    meeting: {
      id: meetingId,
      mentorId: user.id,
      studentId,
      status,
      heldAt,
      scheduledFor: scheduledFor || null,
      notes,
      submissionId,
    },
  });
};
