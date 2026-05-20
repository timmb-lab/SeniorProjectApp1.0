import type { Env } from "../_types.ts";
import { getCurrentUser, writeAudit } from "../_lib/auth.ts";
import { randomId } from "../_lib/crypto.ts";
import { badRequest, json, readJson, requirePost } from "../_lib/http.ts";
import { canAccessStudent, hasRole, isAdmin } from "../_lib/permissions.ts";
import { cleanWorkflowText, workflowError } from "../_lib/workflow.ts";

interface PresentationSlotRow {
  id: string;
  student_id: string;
  student_name: string;
  submission_id: string | null;
  requirement_id: string | null;
  scheduled_for: string;
  duration_minutes: number;
  location: string;
  status: string;
  outline_status: string;
  checked_out_at: string | null;
  checked_in_at: string | null;
  notes: string | null;
  created_at: string;
}

interface CreatePresentationSlotBody {
  studentId?: unknown;
  submissionId?: unknown;
  requirementId?: unknown;
  scheduledFor?: unknown;
  durationMinutes?: unknown;
  location?: unknown;
  outlineStatus?: unknown;
  notes?: unknown;
}

const ALLOWED_OUTLINE_STATUSES = new Set(["pending", "approved", "revision_needed"]);
const CONFLICT_STATUSES = new Set(["scheduled", "checked_out", "checked_in", "completed"]);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const rows = await env.DB.prepare(
    `SELECT
       presentation_slots.id,
       presentation_slots.student_user_id AS student_id,
       student.display_name AS student_name,
       presentation_slots.submission_id,
       presentation_slots.requirement_id,
       presentation_slots.scheduled_for,
       presentation_slots.duration_minutes,
       presentation_slots.location,
       presentation_slots.status,
       presentation_slots.outline_status,
       presentation_slots.checked_out_at,
       presentation_slots.checked_in_at,
       presentation_slots.notes,
       presentation_slots.created_at
     FROM presentation_slots
     JOIN user_accounts student ON student.id = presentation_slots.student_user_id
     WHERE presentation_slots.status != 'cancelled'
     ORDER BY presentation_slots.scheduled_for ASC
     LIMIT 100`,
  ).all<PresentationSlotRow>();

  const slots = [];
  for (const row of rows.results || []) {
    if (await canAccessStudent(env, user, row.student_id)) {
      slots.push(formatSlot(row));
    }
  }

  return json({
    ok: true,
    slots,
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  let body: CreatePresentationSlotBody;
  try {
    body = await readJson<CreatePresentationSlotBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  const admin = await isAdmin(env, user.id);
  const teacher = await hasRole(env, user.id, "program_teacher");
  if (!admin && !teacher) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "presentation_slot_denied",
      entityType: "presentation_slot",
      entityId: null,
      request,
      metadata: { reason: "role_not_allowed" },
    });
    return workflowError("forbidden", 403);
  }

  const studentId = cleanWorkflowText(body.studentId, "", 160);
  if (!studentId) return badRequest("missing_student_id");

  const student = await env.DB.prepare(
    "SELECT id FROM user_accounts WHERE id = ? AND status = 'active'",
  ).bind(studentId).first<{ id: string }>();
  if (!student || !await hasRole(env, studentId, "student")) return workflowError("student_not_found", 404);

  if (!await canAccessStudent(env, user, studentId)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "presentation_slot_denied",
      entityType: "presentation_slot",
      entityId: null,
      request,
      metadata: { studentId, reason: "student_scope" },
    });
    return workflowError("forbidden", 403);
  }

  const scheduledFor = normalizeScheduledFor(body.scheduledFor);
  if (!scheduledFor) return badRequest("invalid_scheduled_for");

  const durationMinutes = normalizeDuration(body.durationMinutes);
  if (!durationMinutes) return badRequest("invalid_duration_minutes");

  const location = cleanWorkflowText(body.location, "Main presentation room", 160);
  const outlineStatus = cleanWorkflowText(body.outlineStatus, "pending", 80);
  if (!ALLOWED_OUTLINE_STATUSES.has(outlineStatus)) return badRequest("invalid_outline_status");

  const submissionId = cleanWorkflowText(body.submissionId, "", 160) || null;
  const requirementId = cleanWorkflowText(body.requirementId, "", 160) || null;
  if (submissionId) {
    const submission = await env.DB.prepare(
      "SELECT id, student_id, requirement_id FROM submissions WHERE id = ?",
    ).bind(submissionId).first<{ id: string; student_id: string; requirement_id: string | null }>();
    if (!submission || submission.student_id !== studentId) return workflowError("submission_not_found", 404);
  }

  const conflict = await findPresentationConflict(env, {
    location,
    scheduledFor,
    durationMinutes,
  });
  if (conflict) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "presentation_slot_conflict",
      entityType: "presentation_slot",
      entityId: conflict.id,
      request,
      metadata: {
        studentId,
        location,
        scheduledFor,
        durationMinutes,
        conflictingSlotId: conflict.id,
      },
    });
    return json({
      ok: false,
      error: "presentation_slot_conflict",
      conflict: formatConflict(conflict),
    }, { status: 409 });
  }

  const notes = cleanWorkflowText(body.notes, "", 1200) || null;
  const slotId = randomId("presentation-slot");
  await env.DB.prepare(
    `INSERT INTO presentation_slots (
       id,
       student_user_id,
       submission_id,
       requirement_id,
       scheduled_for,
       duration_minutes,
       location,
       status,
       outline_status,
       notes,
       created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)`,
  ).bind(
    slotId,
    studentId,
    submissionId,
    requirementId,
    scheduledFor,
    durationMinutes,
    location,
    outlineStatus,
    notes,
    user.id,
  ).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "presentation_slot_scheduled",
    entityType: "presentation_slot",
    entityId: slotId,
    request,
    metadata: {
      studentId,
      submissionId,
      requirementId,
      scheduledFor,
      durationMinutes,
      location,
      outlineStatus,
    },
  });

  return json({
    ok: true,
    slot: {
      id: slotId,
      studentId,
      submissionId,
      requirementId,
      scheduledFor,
      durationMinutes,
      location,
      status: "scheduled",
      outlineStatus,
      notes,
    },
  });
};

function normalizeScheduledFor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const time = Date.parse(trimmed);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

function normalizeDuration(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return 15;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 5 || parsed > 120) return null;
  return parsed;
}

async function findPresentationConflict(
  env: Env,
  input: {
    location: string;
    scheduledFor: string;
    durationMinutes: number;
  },
): Promise<PresentationSlotRow | null> {
  const rows = await env.DB.prepare(
    `SELECT
       presentation_slots.id,
       presentation_slots.student_user_id AS student_id,
       student.display_name AS student_name,
       presentation_slots.submission_id,
       presentation_slots.requirement_id,
       presentation_slots.scheduled_for,
       presentation_slots.duration_minutes,
       presentation_slots.location,
       presentation_slots.status,
       presentation_slots.outline_status,
       presentation_slots.checked_out_at,
       presentation_slots.checked_in_at,
       presentation_slots.notes,
       presentation_slots.created_at
     FROM presentation_slots
     JOIN user_accounts student ON student.id = presentation_slots.student_user_id
     WHERE lower(presentation_slots.location) = lower(?)
       AND presentation_slots.status != 'cancelled'
     ORDER BY presentation_slots.scheduled_for ASC
     LIMIT 100`,
  ).bind(input.location).all<PresentationSlotRow>();

  const proposedStart = Date.parse(input.scheduledFor);
  const proposedEnd = proposedStart + input.durationMinutes * 60 * 1000;
  for (const row of rows.results || []) {
    if (!CONFLICT_STATUSES.has(row.status)) continue;
    const existingStart = Date.parse(row.scheduled_for);
    if (Number.isNaN(existingStart)) continue;
    const existingEnd = existingStart + Number(row.duration_minutes || 15) * 60 * 1000;
    if (existingStart < proposedEnd && existingEnd > proposedStart) {
      return row;
    }
  }
  return null;
}

function formatSlot(row: PresentationSlotRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    submissionId: row.submission_id,
    requirementId: row.requirement_id,
    scheduledFor: row.scheduled_for,
    durationMinutes: Number(row.duration_minutes),
    location: row.location,
    status: row.status,
    outlineStatus: row.outline_status,
    checkedOutAt: row.checked_out_at,
    checkedInAt: row.checked_in_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function formatConflict(row: PresentationSlotRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    scheduledFor: row.scheduled_for,
    durationMinutes: Number(row.duration_minutes),
    location: row.location,
    status: row.status,
  };
}
