import type { Env } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { randomId } from "../../_lib/crypto.ts";
import { badRequest, json, readJson, requireDelete, requirePost } from "../../_lib/http.ts";
import { hasRole, isAdmin } from "../../_lib/permissions.ts";
import { workflowError } from "../../_lib/workflow.ts";

interface MentorAssignmentBody {
  mentorUserId?: unknown;
  studentUserId?: unknown;
}

interface ExistingAssignmentRow {
  id: string;
  active: number;
}

interface UserExistsRow {
  id: string;
}

interface MentorAssignmentListRow {
  id: string;
  mentor_user_id: string;
  mentor_name: string | null;
  student_user_id: string;
  student_name: string | null;
  active: number;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, user.id)) return workflowError("forbidden", 403);

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  const mentorUserId = cleanUserId(url.searchParams.get("mentorUserId"));
  const studentUserId = cleanUserId(url.searchParams.get("studentUserId"));
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

  const filters: string[] = [];
  const binds: (string | number)[] = [];

  if (!includeInactive) {
    filters.push("mentor_assignments.active = 1");
  }

  if (mentorUserId) {
    filters.push("mentor_assignments.mentor_user_id = ?");
    binds.push(mentorUserId);
  }

  if (studentUserId) {
    filters.push("mentor_assignments.student_user_id = ?");
    binds.push(studentUserId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = await env.DB.prepare(
    `SELECT
       mentor_assignments.id,
       mentor_assignments.mentor_user_id,
       mentor.display_name AS mentor_name,
       mentor_assignments.student_user_id,
       student.display_name AS student_name,
       mentor_assignments.active,
       mentor_assignments.created_at
     FROM mentor_assignments
     JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
     JOIN user_accounts student ON student.id = mentor_assignments.student_user_id
     ${whereClause}
     ORDER BY mentor_assignments.created_at DESC
     LIMIT ?`,
  ).bind(...binds, limit).all<MentorAssignmentListRow>();

  return json({
    ok: true,
    assignments: (rows.results || []).map((row) => ({
      id: row.id,
      mentorUserId: row.mentor_user_id,
      mentorName: row.mentor_name,
      studentUserId: row.student_user_id,
      studentName: row.student_name,
      active: Number(row.active) === 1,
      createdAt: row.created_at,
    })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, user.id)) return workflowError("forbidden", 403);

  let body: MentorAssignmentBody;
  try {
    body = await readJson<MentorAssignmentBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const mentorUserId = typeof body.mentorUserId === "string" ? body.mentorUserId.trim() : "";
  const studentUserId = typeof body.studentUserId === "string" ? body.studentUserId.trim() : "";
  if (!mentorUserId || !studentUserId) return badRequest("missing_user_ids");
  if (mentorUserId === studentUserId) return badRequest("same_user_ids");

  const mentorExists = await env.DB.prepare(
    "SELECT id FROM user_accounts WHERE id = ? AND status = 'active' LIMIT 1",
  ).bind(mentorUserId).first<UserExistsRow>();
  if (!mentorExists) return workflowError("mentor_not_found", 404);

  const studentExists = await env.DB.prepare(
    "SELECT id FROM user_accounts WHERE id = ? AND status = 'active' LIMIT 1",
  ).bind(studentUserId).first<UserExistsRow>();
  if (!studentExists) return workflowError("student_not_found", 404);

  if (!await hasRole(env, mentorUserId, "mentor")) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "mentor_assignment_denied",
      entityType: "mentor_assignment",
      entityId: null,
      request,
      metadata: { mentorUserId, studentUserId, reason: "mentor_role_required" },
    });
    return workflowError("mentor_role_required", 409);
  }

  if (!await hasRole(env, studentUserId, "student")) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "mentor_assignment_denied",
      entityType: "mentor_assignment",
      entityId: null,
      request,
      metadata: { mentorUserId, studentUserId, reason: "student_role_required" },
    });
    return workflowError("student_role_required", 409);
  }

  const existing = await env.DB.prepare(
    `SELECT id, active
     FROM mentor_assignments
     WHERE mentor_user_id = ?
       AND student_user_id = ?
     LIMIT 1`,
  ).bind(mentorUserId, studentUserId).first<ExistingAssignmentRow>();

  const assignmentId = existing?.id || randomId("mentor_assignment");
  const activated = !existing || Number(existing.active) !== 1;

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
       VALUES (?, ?, ?, ?, 1)`,
    ).bind(assignmentId, mentorUserId, studentUserId, user.id).run();
  } else if (Number(existing.active) !== 1) {
    await env.DB.prepare(
      `UPDATE mentor_assignments
       SET active = 1, assigned_by = ?
       WHERE id = ?`,
    ).bind(user.id, assignmentId).run();
  }

  await writeAudit(env, {
    actorUserId: user.id,
    action: activated ? "mentor_assignment_created" : "mentor_assignment_duplicate",
    entityType: "mentor_assignment",
    entityId: assignmentId,
    request,
    metadata: {
      mentorUserId,
      studentUserId,
    },
  });

  return json({
    ok: true,
    assignment: {
      id: assignmentId,
      mentorUserId,
      studentUserId,
      active: true,
    },
  });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requireDelete(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, user.id)) return workflowError("forbidden", 403);

  let body: MentorAssignmentBody;
  try {
    body = await readJson<MentorAssignmentBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const mentorUserId = typeof body.mentorUserId === "string" ? body.mentorUserId.trim() : "";
  const studentUserId = typeof body.studentUserId === "string" ? body.studentUserId.trim() : "";
  if (!mentorUserId || !studentUserId) return badRequest("missing_user_ids");
  if (mentorUserId === studentUserId) return badRequest("same_user_ids");

  const existing = await env.DB.prepare(
    `SELECT id, active
     FROM mentor_assignments
     WHERE mentor_user_id = ?
       AND student_user_id = ?
     LIMIT 1`,
  ).bind(mentorUserId, studentUserId).first<ExistingAssignmentRow>();

  if (!existing) return workflowError("assignment_not_found", 404);

  const deactivated = Number(existing.active) === 1;
  if (deactivated) {
    await env.DB.prepare(
      `UPDATE mentor_assignments
       SET active = 0
       WHERE id = ?`,
    ).bind(existing.id).run();
  }

  await writeAudit(env, {
    actorUserId: user.id,
    action: deactivated ? "mentor_assignment_deactivated" : "mentor_assignment_deactivate_duplicate",
    entityType: "mentor_assignment",
    entityId: existing.id,
    request,
    metadata: {
      mentorUserId,
      studentUserId,
    },
  });

  return json({
    ok: true,
    assignment: {
      id: existing.id,
      mentorUserId,
      studentUserId,
      active: false,
    },
  });
};

function cleanUserId(value: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : "";
}
