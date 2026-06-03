import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canViewAdminDashboard, getViewerRoleContext } from "../../_lib/permissions.ts";

interface CountRow {
  count: number;
}

interface StatusCountRow {
  status: string;
  count: number;
}

interface ProgramBreakdownRow {
  program_id: string;
  program_name: string;
  student_count: number;
  submitted: number;
  revision_requested: number;
  approved: number;
  evidence_artifacts: number;
  no_mentor: number;
}

interface ReviewQueueRow {
  submission_id: string;
  student_id: string;
  student_name: string;
  requirement_title: string | null;
  status: string;
  evidence_count: number;
  updated_at: string;
}

interface MentorCoverageRow {
  mentor_id: string;
  mentor_name: string;
  active_assignments: number;
}

interface RecentAuditRow {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  actor_display_name: string | null;
}

interface RecentExportRow {
  id: string;
  export_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  target_student_name: string | null;
  requester_display_name: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  if (!await canViewAdminDashboard(env, user)) {
    await auditAdminDashboard(env, request, user, "admin_dashboard_denied", {
      reason: "missing_admin_role",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const [
    studentsTotal,
    studentsActive,
    studentsNoMentor,
    programsTotal,
    cohortsTotal,
    submissionCounts,
    evidenceArtifacts,
    mentorAssignmentsActive,
    mentorMeetingCounts,
    presentationCounts,
    exportsCounts,
    recentAuditEvents,
    presentationOutlinePending,
    programBreakdown,
    reviewQueue,
    mentorCoverage,
    recentAudit,
    recentExports,
  ] = await Promise.all([
    count(env, `SELECT COUNT(DISTINCT user_accounts.id) AS count
      FROM user_accounts
      JOIN user_roles ON user_roles.user_id = user_accounts.id
       AND user_roles.role_id = 'student'`),
    count(env, `SELECT COUNT(DISTINCT user_accounts.id) AS count
      FROM user_accounts
      JOIN user_roles ON user_roles.user_id = user_accounts.id
       AND user_roles.role_id = 'student'
      WHERE user_accounts.status = 'active'`),
    count(env, `SELECT COUNT(DISTINCT user_accounts.id) AS count
      FROM user_accounts
      JOIN user_roles ON user_roles.user_id = user_accounts.id
       AND user_roles.role_id = 'student'
      LEFT JOIN mentor_assignments
        ON mentor_assignments.student_user_id = user_accounts.id
       AND mentor_assignments.active = 1
      WHERE user_accounts.status = 'active'
        AND mentor_assignments.id IS NULL`),
    count(env, "SELECT COUNT(*) AS count FROM programs WHERE active = 1"),
    count(env, "SELECT COUNT(*) AS count FROM cohorts WHERE active = 1"),
    countByStatus(env, "SELECT status, COUNT(*) AS count FROM submissions GROUP BY status"),
    count(env, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE deleted_at IS NULL"),
    count(env, "SELECT COUNT(*) AS count FROM mentor_assignments WHERE active = 1"),
    countByStatus(env, "SELECT status, COUNT(*) AS count FROM mentor_meetings GROUP BY status"),
    countByStatus(env, "SELECT status, COUNT(*) AS count FROM presentation_slots GROUP BY status"),
    countByStatus(env, "SELECT status, COUNT(*) AS count FROM exports GROUP BY status"),
    count(env, `SELECT COUNT(*) AS count
      FROM audit_events
      WHERE created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`),
    count(env, "SELECT COUNT(*) AS count FROM presentation_slots WHERE outline_status = 'pending' AND status != 'cancelled'"),
    safeRows<ProgramBreakdownRow>(env, programBreakdownSql()),
    safeRows<ReviewQueueRow>(env, reviewQueueSql()),
    safeRows<MentorCoverageRow>(env, mentorCoverageSql()),
    recentAuditRows(env),
    recentExportRows(env),
  ]);

  const summary = {
    studentsTotal,
    studentsActive,
    studentsNoMentor,
    programsTotal,
    cohortsTotal,
    submissionsDraft: submissionCounts.draft || 0,
    submissionsSubmitted: submissionCounts.submitted || 0,
    revisionRequested: submissionCounts.revision_requested || 0,
    approved: submissionCounts.approved || 0,
    evidenceArtifacts,
    mentorAssignmentsActive,
    mentorMeetingsScheduled: mentorMeetingCounts.scheduled || 0,
    mentorMeetingsHeld: mentorMeetingCounts.held || 0,
    mentorMeetingsMissed: mentorMeetingCounts.missed || 0,
    mentorMeetingsMakeupRequired: mentorMeetingCounts.makeup_required || 0,
    presentationScheduled: presentationCounts.scheduled || 0,
    presentationCheckedOut: presentationCounts.checked_out || 0,
    presentationCheckedIn: presentationCounts.checked_in || 0,
    presentationCompleted: presentationCounts.completed || 0,
    presentationOutlinePending,
    exportsQueued: exportsCounts.queued || 0,
    exportsRunning: exportsCounts.running || 0,
    exportsComplete: exportsCounts.complete || 0,
    exportsFailed: exportsCounts.failed || 0,
    recentAuditEvents,
  };

  await auditAdminDashboard(env, request, user, "admin_dashboard_viewed", {
    scope: "admin_global",
    summaryCountsOnly: true,
  });

  return json({
    ok: true,
    scope: "admin_global",
    generatedAt: new Date().toISOString(),
    summary,
    programBreakdown: programBreakdown.map((row) => ({
      programId: row.program_id,
      programName: row.program_name,
      studentCount: Number(row.student_count || 0),
      submitted: Number(row.submitted || 0),
      revisionRequested: Number(row.revision_requested || 0),
      approved: Number(row.approved || 0),
      evidenceArtifacts: Number(row.evidence_artifacts || 0),
      noMentor: Number(row.no_mentor || 0),
    })),
    reviewQueue: reviewQueue.map((row) => ({
      submissionId: row.submission_id,
      studentId: row.student_id,
      studentName: row.student_name,
      requirementTitle: row.requirement_title || "Senior Project submission",
      status: row.status,
      evidenceCount: Number(row.evidence_count || 0),
      updatedAt: row.updated_at,
    })),
    mentorCoverage: mentorCoverage.map((row) => ({
      mentorId: row.mentor_id,
      mentorName: row.mentor_name,
      activeAssignments: Number(row.active_assignments || 0),
    })),
    presentationSnapshot: statusSnapshot(presentationCounts),
    archiveSnapshot: statusSnapshot(exportsCounts),
    needsAttention: buildNeedsAttention(summary),
    recentAudit: recentAudit.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      createdAt: row.created_at,
      actorDisplayName: row.actor_display_name || undefined,
    })),
    recentExports: recentExports.map((row) => ({
      exportId: row.id,
      exportType: row.export_type,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
      studentName: row.target_student_name || "Student archive",
      requestedBy: row.requester_display_name || undefined,
    })),
    notConnected: [],
  });
};

async function count(env: Env, sql: string): Promise<number> {
  const row = await env.DB.prepare(sql).first<CountRow>();
  return Number(row?.count || 0);
}

async function countByStatus(env: Env, sql: string): Promise<Record<string, number>> {
  const rows = await env.DB.prepare(sql).all<StatusCountRow>();
  const counts: Record<string, number> = {};
  for (const row of rows.results || []) {
    counts[row.status] = Number(row.count || 0);
  }
  return counts;
}

async function safeRows<T>(env: Env, sql: string): Promise<T[]> {
  const rows = await env.DB.prepare(sql).all<T>();
  return rows.results || [];
}

async function recentAuditRows(env: Env): Promise<RecentAuditRow[]> {
  const rows = await env.DB.prepare(
    `SELECT
       audit_events.id,
       audit_events.action,
       audit_events.entity_type,
       audit_events.created_at,
       actor.display_name AS actor_display_name
     FROM audit_events
     LEFT JOIN user_accounts actor ON actor.id = audit_events.actor_user_id
     WHERE lower(audit_events.action) NOT LIKE '%token%'
       AND lower(audit_events.action) NOT LIKE '%secret%'
       AND lower(audit_events.action) NOT LIKE '%password%'
     ORDER BY audit_events.created_at DESC
     LIMIT 10`,
  ).all<RecentAuditRow>();
  return rows.results || [];
}

async function recentExportRows(env: Env): Promise<RecentExportRow[]> {
  const rows = await env.DB.prepare(
    `SELECT
       exports.id,
       exports.export_type,
       exports.status,
       exports.created_at,
       exports.completed_at,
       target.display_name AS target_student_name,
       requester.display_name AS requester_display_name
     FROM exports
     LEFT JOIN user_accounts target ON target.id = exports.target_user_id
     LEFT JOIN user_accounts requester ON requester.id = exports.requested_by
     ORDER BY CASE
       WHEN exports.status = 'failed' THEN 0
       WHEN exports.status IN ('queued', 'running') THEN 1
       WHEN exports.status = 'complete' THEN 2
       ELSE 3
     END,
     exports.created_at DESC
     LIMIT 12`,
  ).all<RecentExportRow>();
  return rows.results || [];
}

function programBreakdownSql(): string {
  return `
    SELECT
      programs.id AS program_id,
      programs.name AS program_name,
      COUNT(DISTINCT CASE WHEN student_role.role_id IS NOT NULL THEN group_memberships.user_id END) AS student_count,
      COUNT(DISTINCT CASE WHEN submissions.status = 'submitted' THEN submissions.id END) AS submitted,
      COUNT(DISTINCT CASE WHEN submissions.status = 'revision_requested' THEN submissions.id END) AS revision_requested,
      COUNT(DISTINCT CASE WHEN submissions.status = 'approved' THEN submissions.id END) AS approved,
      COUNT(DISTINCT evidence_artifacts.id) AS evidence_artifacts,
      COUNT(DISTINCT CASE
        WHEN student_role.role_id IS NOT NULL
         AND user_accounts.status = 'active'
         AND mentor_assignments.id IS NULL
        THEN user_accounts.id END) AS no_mentor
    FROM programs
    LEFT JOIN groups ON groups.program_id = programs.id
    LEFT JOIN group_memberships ON group_memberships.group_id = groups.id
    LEFT JOIN user_accounts ON user_accounts.id = group_memberships.user_id
    LEFT JOIN user_roles student_role
      ON student_role.user_id = group_memberships.user_id
     AND student_role.role_id = 'student'
    LEFT JOIN submissions ON submissions.student_id = group_memberships.user_id
    LEFT JOIN evidence_artifacts
      ON evidence_artifacts.student_id = group_memberships.user_id
     AND evidence_artifacts.deleted_at IS NULL
    LEFT JOIN mentor_assignments
      ON mentor_assignments.student_user_id = group_memberships.user_id
     AND mentor_assignments.active = 1
    WHERE programs.active = 1
    GROUP BY programs.id, programs.name
    ORDER BY programs.name`;
}

function reviewQueueSql(): string {
  return `
    SELECT
      submissions.id AS submission_id,
      submissions.student_id,
      user_accounts.display_name AS student_name,
      COALESCE(requirements.title, 'Senior Project submission') AS requirement_title,
      submissions.status,
      submissions.updated_at,
      COUNT(evidence_artifacts.id) AS evidence_count
    FROM submissions
    JOIN user_accounts ON user_accounts.id = submissions.student_id
    LEFT JOIN requirements ON requirements.id = submissions.requirement_id
    LEFT JOIN evidence_artifacts
      ON evidence_artifacts.submission_id = submissions.id
     AND evidence_artifacts.deleted_at IS NULL
    WHERE submissions.status IN ('submitted', 'revision_requested')
    GROUP BY submissions.id, submissions.student_id, user_accounts.display_name, requirements.title, submissions.status, submissions.updated_at
    ORDER BY submissions.updated_at DESC
    LIMIT 10`;
}

function mentorCoverageSql(): string {
  return `
    SELECT
      user_accounts.id AS mentor_id,
      user_accounts.display_name AS mentor_name,
      COUNT(mentor_assignments.id) AS active_assignments
    FROM user_accounts
    JOIN user_roles mentor_role
      ON mentor_role.user_id = user_accounts.id
     AND mentor_role.role_id = 'mentor'
    LEFT JOIN mentor_assignments
      ON mentor_assignments.mentor_user_id = user_accounts.id
     AND mentor_assignments.active = 1
    WHERE user_accounts.status = 'active'
    GROUP BY user_accounts.id, user_accounts.display_name
    ORDER BY user_accounts.display_name
    LIMIT 50`;
}

function statusSnapshot(counts: Record<string, number>): Array<{ status: string; count: number }> {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, statusCount]) => ({ status, count: statusCount }));
}

function buildNeedsAttention(summary: Record<string, number>): Array<{
  type: string;
  label: string;
  detail: string;
  severity: "info" | "warning" | "urgent";
  actionSection?: string;
  actionPreset?: string;
  actionLabel?: string;
}> {
  const items = [];
  if (summary.studentsNoMentor > 0) {
    items.push({
      type: "mentor_coverage",
      label: "Students without mentors",
      detail: `${summary.studentsNoMentor} active student record(s) need mentor coverage.`,
      severity: "urgent" as const,
      actionSection: "students",
      actionPreset: "missing-mentors",
      actionLabel: "Open student list",
    });
  }
  if (summary.revisionRequested > 0) {
    items.push({
      type: "review_workload",
      label: "Revision requests open",
      detail: `${summary.revisionRequested} submission(s) need a student revision loop.`,
      severity: "warning" as const,
      actionSection: "teacher",
      actionPreset: "revision-requested",
      actionLabel: "Open review queue",
    });
  }
  if (summary.mentorMeetingsMakeupRequired > 0 || summary.mentorMeetingsMissed > 0) {
    items.push({
      type: "mentor_meetings",
      label: "Mentor meeting follow-up",
      detail: `${summary.mentorMeetingsMakeupRequired + summary.mentorMeetingsMissed} meeting record(s) need attention.`,
      severity: "warning" as const,
      actionSection: "students",
      actionPreset: "mentor-meeting-follow-up-students",
      actionLabel: "Open student list",
    });
  }
  if (summary.exportsFailed > 0) {
    items.push({
      type: "archive_exports",
      label: "Archive exports failed",
      detail: `${summary.exportsFailed} export(s) need review before handoff.`,
      severity: "urgent" as const,
      actionSection: "archiveExports",
      actionPreset: "failed-exports",
      actionLabel: "Open exports",
    });
  }
  if (summary.presentationOutlinePending > 0) {
    items.push({
      type: "presentation_readiness",
      label: "Presentation outlines pending",
      detail: `${summary.presentationOutlinePending} presentation slot(s) still have pending outline status.`,
      severity: "info" as const,
      actionSection: "presentation",
      actionPreset: "outline-follow-up",
      actionLabel: "Open schedule",
    });
  }
  return items;
}

async function auditAdminDashboard(
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
    entityType: "admin_dashboard",
    entityId: "admin_global",
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
