import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { badRequest, json, readJson, requirePost } from "../../_lib/http.ts";
import { canAccessStudent, getRoleAssignments, hasRole, isAdmin } from "../../_lib/permissions.ts";
import { randomId } from "../../_lib/crypto.ts";
import { cleanWorkflowText, workflowError } from "../../_lib/workflow.ts";

interface MeetingRow {
  id: string;
  mentor_id: string;
  mentor_name: string;
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
  const url = new URL(request.url);
  const requestedStudentId = cleanWorkflowText(url.searchParams.get("studentId"), "", 160) || null;
  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditMentorMeetingsAccess(env, request, null, "mentor_meetings_unauthorized", requestedStudentId, {
      reason: "missing_session",
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = await isAdmin(env, user.id);
  const mentor = await hasRole(env, user.id, "mentor");
  const student = await hasRole(env, user.id, "student");
  const programTeacher = await hasRole(env, user.id, "program_teacher");
  if (!admin && !mentor && !student && !programTeacher) {
    await auditMentorMeetingsAccess(env, request, user, "mentor_meetings_denied", requestedStudentId, {
      reason: "missing_meeting_view_role",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (requestedStudentId && !await canAccessStudent(env, user, requestedStudentId)) {
    await auditMentorMeetingsAccess(env, request, user, "mentor_meetings_denied", requestedStudentId, {
      reason: "student_scope_denied",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const { where, binds } = meetingListScope({ user, requestedStudentId, admin, mentor, student, programTeacher });
  const statement = env.DB.prepare(meetingListSql(where));
  const rows = binds.length
    ? await statement.bind(...binds).all<MeetingRow>()
    : await statement.all<MeetingRow>();

  const meetings = [];
  for (const row of rows.results || []) {
    if (await canAccessStudent(env, user, row.student_id)) {
      meetings.push(formatMeeting(row));
    }
  }

  await auditMentorMeetingsAccess(env, request, user, "mentor_meetings_viewed", requestedStudentId, {
    admin,
    requestedStudentId,
    meetingCount: meetings.length,
  });

  return json({
    ok: true,
    mentorId: mentor ? user.id : null,
    viewer: {
      id: user.id,
      email: user.email,
      admin,
    },
    meetings,
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
  if (!user) {
    await auditMentorMeetingsAccess(env, request, null, "mentor_meeting_unauthorized", studentId, {
      reason: "missing_session",
      studentId,
      status,
    });
    return workflowError("unauthorized", 401);
  }
  if (!await hasRole(env, user.id, "mentor")) {
    await auditMentorMeetingsAccess(env, request, user, "mentor_meeting_denied", studentId, {
      reason: "missing_mentor_role",
      studentId,
      status,
    });
    return workflowError("forbidden", 403);
  }

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
      metadata: {
        studentId,
        status,
        actorRoleScopes: serializeRoleScopes(await getRoleAssignments(env, user.id)),
      },
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
      actorRoleScopes: serializeRoleScopes(await getRoleAssignments(env, user.id)),
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

function meetingListScope(input: {
  user: UserAccount;
  requestedStudentId: string | null;
  admin: boolean;
  mentor: boolean;
  student: boolean;
  programTeacher: boolean;
}): { where: string; binds: string[] } {
  if (input.requestedStudentId) {
    if (input.mentor && !input.admin && !input.programTeacher && !input.student) {
      return {
        where: "mentor_meetings.student_user_id = ? AND mentor_meetings.mentor_user_id = ?",
        binds: [input.requestedStudentId, input.user.id],
      };
    }
    return {
      where: "mentor_meetings.student_user_id = ?",
      binds: [input.requestedStudentId],
    };
  }

  if (input.admin || input.programTeacher) {
    return { where: "1 = 1", binds: [] };
  }

  if (input.mentor) {
    return {
      where: "mentor_meetings.mentor_user_id = ?",
      binds: [input.user.id],
    };
  }

  return {
    where: "mentor_meetings.student_user_id = ?",
    binds: [input.user.id],
  };
}

function meetingListSql(where: string): string {
  return `SELECT
       mentor_meetings.id,
       mentor_meetings.mentor_user_id AS mentor_id,
       mentor.display_name AS mentor_name,
       mentor_meetings.student_user_id AS student_id,
       student.display_name AS student_name,
       mentor_meetings.status,
       mentor_meetings.scheduled_for,
       mentor_meetings.held_at,
       mentor_meetings.notes,
       mentor_meetings.created_at
     FROM mentor_meetings
     JOIN user_accounts student ON student.id = mentor_meetings.student_user_id
     JOIN user_accounts mentor ON mentor.id = mentor_meetings.mentor_user_id
     WHERE ${where}
     ORDER BY mentor_meetings.created_at DESC
     LIMIT 50`;
}

function formatMeeting(row: MeetingRow) {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    mentorName: row.mentor_name,
    studentId: row.student_id,
    studentName: row.student_name,
    status: row.status,
    scheduledFor: row.scheduled_for,
    heldAt: row.held_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function auditMentorMeetingsAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  studentId: string | null,
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
    entityType: "mentor_meeting",
    entityId: studentId,
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
