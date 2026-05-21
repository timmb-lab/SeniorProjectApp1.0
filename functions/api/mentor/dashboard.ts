import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canViewMentorDashboard, getViewerRoleContext, hasRole } from "../../_lib/permissions.ts";

interface AssignedStudentRow {
  student_id: string;
  student_name: string;
  mentor_id: string;
  mentor_name: string;
  submission_status: string | null;
  evidence_count: number;
  mentor_meeting_status: string | null;
  presentation_status: string | null;
  outline_status: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  if (!await canViewMentorDashboard(env, user)) {
    await auditMentorDashboard(env, request, user, "mentor_dashboard_denied", {
      reason: "missing_mentor_role",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const context = await getViewerRoleContext(env, user);
  const url = new URL(request.url);
  const requestedMentorId = cleanId(url.searchParams.get("mentorUserId"));
  const admin = context.isAdmin;

  let rows: AssignedStudentRow[];
  let scope = "mentor_assigned";
  if (admin && requestedMentorId) {
    if (!await hasRole(env, requestedMentorId, "mentor")) {
      await auditMentorDashboard(env, request, user, "mentor_dashboard_denied", {
        reason: "mentor_not_found",
      });
      return json({ error: "mentor_not_found" }, { status: 404 });
    }
    rows = await loadAssignedStudents(env, "mentor_assignments.mentor_user_id = ?", [requestedMentorId]);
    scope = "admin_selected_mentor";
  } else if (admin) {
    rows = await loadAssignedStudents(env, "1 = 1", []);
    scope = "admin_mentor_coverage";
  } else {
    rows = await loadAssignedStudents(env, "mentor_assignments.mentor_user_id = ?", [user.id]);
  }

  const assignedStudents = rows.map((row) => {
    const attention = needsAttention(row);
    return {
      studentId: row.student_id,
      studentName: row.student_name,
      mentorId: admin ? row.mentor_id : undefined,
      mentorName: admin ? row.mentor_name : undefined,
      submissionStatus: row.submission_status || "not_started",
      evidenceCount: Number(row.evidence_count || 0),
      mentorMeetingStatus: row.mentor_meeting_status || "not_recorded",
      presentationStatus: row.presentation_status || "not_scheduled",
      outlineStatus: row.outline_status || "pending",
      needsAttention: attention,
    };
  });

  const summary = {
    assignedCount: assignedStudents.length,
    needsRevision: assignedStudents.filter((student) => student.submissionStatus === "revision_requested").length,
    missingMeeting: assignedStudents.filter((student) => ["not_recorded", "missed", "makeup_required"].includes(student.mentorMeetingStatus)).length,
    presentationPending: assignedStudents.filter((student) => (
      student.presentationStatus === "not_scheduled" || student.outlineStatus !== "approved"
    )).length,
  };

  await auditMentorDashboard(env, request, user, "mentor_dashboard_viewed", {
    scope,
    resultCount: assignedStudents.length,
  });

  return json({
    ok: true,
    scope,
    assignedStudents,
    summary,
  });
};

async function loadAssignedStudents(env: Env, whereClause: string, binds: string[]): Promise<AssignedStudentRow[]> {
  const rows = await env.DB.prepare(
    `SELECT
       student.id AS student_id,
       student.display_name AS student_name,
       mentor.id AS mentor_id,
       mentor.display_name AS mentor_name,
       (
         SELECT submissions.status
         FROM submissions
         WHERE submissions.student_id = student.id
         ORDER BY submissions.updated_at DESC
         LIMIT 1
       ) AS submission_status,
       (
         SELECT COUNT(*)
         FROM evidence_artifacts
         WHERE evidence_artifacts.student_id = student.id
           AND evidence_artifacts.deleted_at IS NULL
       ) AS evidence_count,
       (
         SELECT mentor_meetings.status
         FROM mentor_meetings
         WHERE mentor_meetings.student_user_id = student.id
           AND mentor_meetings.mentor_user_id = mentor.id
         ORDER BY mentor_meetings.created_at DESC
         LIMIT 1
       ) AS mentor_meeting_status,
       (
         SELECT presentation_slots.status
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = student.id
           AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC
         LIMIT 1
       ) AS presentation_status,
       (
         SELECT presentation_slots.outline_status
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = student.id
           AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC
         LIMIT 1
       ) AS outline_status
     FROM mentor_assignments
     JOIN user_accounts student ON student.id = mentor_assignments.student_user_id
     JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
     JOIN user_roles mentor_role
       ON mentor_role.user_id = mentor_assignments.mentor_user_id
      AND mentor_role.role_id = 'mentor'
     WHERE mentor_assignments.active = 1
       AND ${whereClause}
     ORDER BY mentor.display_name ASC, student.display_name ASC
     LIMIT 200`,
  ).bind(...binds).all<AssignedStudentRow>();
  return rows.results || [];
}

function needsAttention(row: AssignedStudentRow): string[] {
  const items = [];
  if (row.submission_status === "revision_requested") items.push("revision_requested");
  if (!row.mentor_meeting_status || ["missed", "makeup_required"].includes(row.mentor_meeting_status)) {
    items.push("mentor_meeting");
  }
  if (!row.presentation_status || row.outline_status !== "approved") items.push("presentation");
  return items;
}

async function auditMentorDashboard(
  env: Env,
  request: Request,
  user: UserAccount,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const context = await getViewerRoleContext(env, user);
  await writeAudit(env, {
    actorUserId: user.id,
    action,
    entityType: "mentor_dashboard",
    entityId: null,
    request,
    metadata: {
      ...metadata,
      actorRoleScopes: safeRoleScopes(context.roles),
    },
  });
}

function safeRoleScopes(assignments: RoleAssignment[]) {
  return assignments.map((assignment) => ({
    roleId: assignment.role_id,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id || "",
  }));
}

function cleanId(value: string | null): string {
  const trimmed = String(value || "").trim();
  return /^[a-zA-Z0-9_.:-]+$/.test(trimmed) ? trimmed : "";
}
