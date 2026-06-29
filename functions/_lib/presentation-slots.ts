import type { Env, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "./auth.ts";
import { json, requirePost } from "./http.ts";
import { canAccessStudent, hasAnyRole, hasRole, isAdmin } from "./permissions.ts";
import { workflowError } from "./workflow.ts";

type PresentationSlotTransition = "check_out" | "check_in";

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

interface TransitionContext {
  request: Request;
  env: Env;
  params: {
    id?: unknown;
  };
}

const TRANSITIONS = {
  check_out: {
    requiredStatus: "scheduled",
    nextStatus: "checked_out",
    timestampColumn: "checked_out_at",
    successAction: "presentation_slot_checked_out",
    deniedAction: "presentation_slot_check_out_denied",
    unauthorizedAction: "presentation_slot_check_out_unauthorized",
    responseField: "checked_out_at",
  },
  check_in: {
    requiredStatus: "checked_out",
    nextStatus: "checked_in",
    timestampColumn: "checked_in_at",
    successAction: "presentation_slot_checked_in",
    deniedAction: "presentation_slot_check_in_denied",
    unauthorizedAction: "presentation_slot_check_in_unauthorized",
    responseField: "checked_in_at",
  },
} as const;

export async function handlePresentationSlotTransition(
  context: TransitionContext,
  transition: PresentationSlotTransition,
): Promise<Response> {
  const { request, env, params } = context;
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const slotId = String(params.id || "").trim();
  if (!slotId) return workflowError("presentation_slot_not_found", 404);

  const config = TRANSITIONS[transition];
  const user = await getCurrentUser(request, env);
  if (!user) {
    await writeAudit(env, {
      actorUserId: null,
      action: config.unauthorizedAction,
      entityType: "presentation_slot",
      entityId: slotId,
      request,
      metadata: { reason: "missing_session", action: transition },
    });
    return workflowError("unauthorized", 401);
  }

  const slot = await getPresentationSlot(env, slotId);
  if (!slot) return workflowError("presentation_slot_not_found", 404);

  const permissionError = await authorizeSlotManager(env, request, user, slot, config.deniedAction, transition);
  if (permissionError) return permissionError;

  if (transition === "check_out" && slot.status === "scheduled" && slot.outline_status !== "approved") {
    await writeAudit(env, {
      actorUserId: user.id,
      action: config.deniedAction,
      entityType: "presentation_slot",
      entityId: slot.id,
      request,
      metadata: {
        studentId: slot.student_id,
        status: slot.status,
        outlineStatus: slot.outline_status,
        reason: "outline_not_approved",
      },
    });
    return json({
      ok: false,
      error: "presentation_slot_outline_not_ready",
      status: slot.status,
      outlineStatus: slot.outline_status,
    }, { status: 409 });
  }

  if (slot.status !== config.requiredStatus) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: config.deniedAction,
      entityType: "presentation_slot",
      entityId: slot.id,
      request,
      metadata: { studentId: slot.student_id, status: slot.status, reason: "invalid_status" },
    });
    return json({
      ok: false,
      error: "presentation_slot_invalid_status",
      status: slot.status,
    }, { status: 409 });
  }

  const transitionedAt = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE presentation_slots
     SET status = ?,
         ${config.timestampColumn} = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  ).bind(config.nextStatus, transitionedAt, slot.id).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: config.successAction,
    entityType: "presentation_slot",
    entityId: slot.id,
    request,
    metadata: {
      studentId: slot.student_id,
      scheduledFor: slot.scheduled_for,
      location: slot.location,
      checkedOutAt: transition === "check_out" ? transitionedAt : slot.checked_out_at,
      checkedInAt: transition === "check_in" ? transitionedAt : slot.checked_in_at,
    },
  });

  return json({
    ok: true,
    slot: formatSlot({
      ...slot,
      status: config.nextStatus,
      [config.responseField]: transitionedAt,
    }),
  });
}

async function authorizeSlotManager(
  env: Env,
  request: Request,
  user: UserAccount,
  slot: PresentationSlotRow,
  deniedAction: string,
  transition: PresentationSlotTransition,
): Promise<Response | null> {
  const legacyAdmin = await isAdmin(env, user.id);
  const presentationManager = legacyAdmin || await hasAnyRole(env, user.id, [
    "global_admin",
    "platform_admin",
    "site_admin",
    "program_teacher",
  ]);
  if (!presentationManager) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: deniedAction,
      entityType: "presentation_slot",
      entityId: slot.id,
      request,
      metadata: { studentId: slot.student_id, reason: "role_not_allowed", action: transition },
    });
    return workflowError("forbidden", 403);
  }

  if (!await canAccessStudent(env, user, slot.student_id)) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: deniedAction,
      entityType: "presentation_slot",
      entityId: slot.id,
      request,
      metadata: { studentId: slot.student_id, reason: "student_scope", action: transition },
    });
    return workflowError("forbidden", 403);
  }

  return null;
}

async function getPresentationSlot(env: Env, slotId: string): Promise<PresentationSlotRow | null> {
  return env.DB.prepare(
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
     WHERE presentation_slots.id = ?
       AND presentation_slots.status != 'cancelled'
     LIMIT 1`,
  ).bind(slotId).first<PresentationSlotRow>();
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
