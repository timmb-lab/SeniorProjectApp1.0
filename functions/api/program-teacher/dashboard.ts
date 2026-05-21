import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import {
  canViewProgramTeacherDashboard,
  getAllActiveStudentIds,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "../../_lib/permissions.ts";

interface CountRow {
  count: number;
}

interface StudentSummaryRow {
  student_id: string;
  student_name: string;
  submission_status: string | null;
  evidence_count: number;
  no_mentor: number;
  updated_at: string | null;
}

interface NeedsReviewRow {
  submission_id: string;
  student_id: string;
  student_name: string;
  requirement_title: string | null;
  status: string;
  evidence_count: number;
  updated_at: string;
}

interface ProgramBreakdownRow {
  program_id: string | null;
  program_name: string | null;
  student_count: number;
  submitted: number;
  revision_requested: number;
  approved: number;
  no_mentor: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  if (!await canViewProgramTeacherDashboard(env, user)) {
    await auditProgramDashboard(env, request, user, "program_teacher_dashboard_denied", {
      reason: "missing_or_invalid_program_teacher_scope",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const context = await getViewerRoleContext(env, user);
  const admin = context.isAdmin;
  const teacherScope = admin
    ? { valid: true, invalidScopeCount: 0, studentIds: await getAllActiveStudentIds(env), scopeSummary: [{ scopeType: "global", scopeId: "" }] }
    : await getProgramTeacherScopedStudentIds(env, user);

  if (!teacherScope.valid) {
    await auditProgramDashboard(env, request, user, "program_teacher_dashboard_denied", {
      reason: "invalid_program_teacher_scope",
      invalidScopeCount: teacherScope.invalidScopeCount,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const studentIds = teacherScope.studentIds;
  const scope = {
    role: admin ? "admin" as const : "program_teacher" as const,
    scopeType: scopeTypeSummary(teacherScope.scopeSummary),
    scopeId: scopeIdSummary(teacherScope.scopeSummary),
  };

  const summary = studentIds.length
    ? await loadScopedSummary(env, studentIds)
    : emptySummary();
  const [students, needsReview, programBreakdown] = studentIds.length
    ? await Promise.all([
        loadStudents(env, studentIds),
        loadNeedsReview(env, studentIds),
        loadProgramBreakdown(env, studentIds),
      ])
    : [[], [], []] as [StudentSummaryRow[], NeedsReviewRow[], ProgramBreakdownRow[]];

  const needsAttention = buildNeedsAttention(summary);

  await auditProgramDashboard(env, request, user, "program_teacher_dashboard_viewed", {
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    resultCount: studentIds.length,
  });

  return json({
    ok: true,
    scope,
    summary,
    students: students.map((row) => ({
      studentId: row.student_id,
      studentName: row.student_name,
      submissionStatus: row.submission_status || "not_started",
      evidenceCount: Number(row.evidence_count || 0),
      noMentor: Number(row.no_mentor || 0) === 1,
      updatedAt: row.updated_at,
    })),
    needsReview: needsReview.map((row) => ({
      submissionId: row.submission_id,
      studentId: row.student_id,
      studentName: row.student_name,
      requirementTitle: row.requirement_title || "Senior Project submission",
      status: row.status,
      evidenceCount: Number(row.evidence_count || 0),
      updatedAt: row.updated_at,
    })),
    needsAttention,
    programBreakdown: programBreakdown.map((row) => ({
      programId: row.program_id || "unassigned",
      programName: row.program_name || "Unassigned",
      studentCount: Number(row.student_count || 0),
      submitted: Number(row.submitted || 0),
      revisionRequested: Number(row.revision_requested || 0),
      approved: Number(row.approved || 0),
      noMentor: Number(row.no_mentor || 0),
    })),
  });
};

async function loadScopedSummary(env: Env, studentIds: string[]) {
  const scopedStudents = studentIds.length;
  const [
    submitted,
    revisionRequested,
    approved,
    evidenceArtifacts,
    noMentor,
    meetingsMakeupRequired,
    presentationsPending,
  ] = await Promise.all([
    countForStudents(env, studentIds, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'submitted' AND student_id IN (__IDS__)"),
    countForStudents(env, studentIds, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'revision_requested' AND student_id IN (__IDS__)"),
    countForStudents(env, studentIds, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'approved' AND student_id IN (__IDS__)"),
    countForStudents(env, studentIds, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE deleted_at IS NULL AND student_id IN (__IDS__)"),
    countForStudents(env, studentIds, `SELECT COUNT(DISTINCT user_accounts.id) AS count
      FROM user_accounts
      LEFT JOIN mentor_assignments
        ON mentor_assignments.student_user_id = user_accounts.id
       AND mentor_assignments.active = 1
      WHERE user_accounts.id IN (__IDS__)
        AND mentor_assignments.id IS NULL`),
    countForStudents(env, studentIds, `SELECT COUNT(*) AS count
      FROM mentor_meetings
      WHERE student_user_id IN (__IDS__)
        AND status IN ('missed', 'makeup_required')`),
    countForStudents(env, studentIds, `SELECT COUNT(*) AS count
      FROM presentation_slots
      WHERE student_user_id IN (__IDS__)
        AND status IN ('scheduled', 'checked_out', 'checked_in')
        AND outline_status != 'approved'`),
  ]);

  return {
    scopedStudents,
    submitted,
    revisionRequested,
    approved,
    evidenceArtifacts,
    noMentor,
    meetingsMakeupRequired,
    presentationsPending,
  };
}

function emptySummary() {
  return {
    scopedStudents: 0,
    submitted: 0,
    revisionRequested: 0,
    approved: 0,
    evidenceArtifacts: 0,
    noMentor: 0,
    meetingsMakeupRequired: 0,
    presentationsPending: 0,
  };
}

async function loadStudents(env: Env, studentIds: string[]): Promise<StudentSummaryRow[]> {
  const query = bindStudentIds(
    `SELECT
       user_accounts.id AS student_id,
       user_accounts.display_name AS student_name,
       (
         SELECT submissions.status
         FROM submissions
         WHERE submissions.student_id = user_accounts.id
         ORDER BY submissions.updated_at DESC
         LIMIT 1
       ) AS submission_status,
       (
         SELECT submissions.updated_at
         FROM submissions
         WHERE submissions.student_id = user_accounts.id
         ORDER BY submissions.updated_at DESC
         LIMIT 1
       ) AS updated_at,
       (
         SELECT COUNT(*)
         FROM evidence_artifacts
         WHERE evidence_artifacts.student_id = user_accounts.id
           AND evidence_artifacts.deleted_at IS NULL
       ) AS evidence_count,
       CASE WHEN EXISTS (
         SELECT 1 FROM mentor_assignments
         WHERE mentor_assignments.student_user_id = user_accounts.id
           AND mentor_assignments.active = 1
       ) THEN 0 ELSE 1 END AS no_mentor
     FROM user_accounts
     WHERE user_accounts.id IN (__IDS__)
     ORDER BY user_accounts.display_name ASC
     LIMIT 100`,
    studentIds,
  );
  const rows = await env.DB.prepare(query.sql).bind(...query.binds).all<StudentSummaryRow>();
  return rows.results || [];
}

async function loadNeedsReview(env: Env, studentIds: string[]): Promise<NeedsReviewRow[]> {
  const query = bindStudentIds(
    `SELECT
       submissions.id AS submission_id,
       submissions.student_id,
       user_accounts.display_name AS student_name,
       requirements.title AS requirement_title,
       submissions.status,
       submissions.updated_at,
       COUNT(evidence_artifacts.id) AS evidence_count
     FROM submissions
     JOIN user_accounts ON user_accounts.id = submissions.student_id
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     LEFT JOIN evidence_artifacts
       ON evidence_artifacts.submission_id = submissions.id
      AND evidence_artifacts.deleted_at IS NULL
     WHERE submissions.student_id IN (__IDS__)
       AND submissions.status IN ('submitted', 'revision_requested')
     GROUP BY submissions.id, submissions.student_id, user_accounts.display_name, requirements.title, submissions.status, submissions.updated_at
     ORDER BY submissions.updated_at DESC
     LIMIT 25`,
    studentIds,
  );
  const rows = await env.DB.prepare(query.sql).bind(...query.binds).all<NeedsReviewRow>();
  return rows.results || [];
}

async function loadProgramBreakdown(env: Env, studentIds: string[]): Promise<ProgramBreakdownRow[]> {
  const query = bindStudentIds(
    `SELECT
       programs.id AS program_id,
       programs.name AS program_name,
       COUNT(DISTINCT user_accounts.id) AS student_count,
       COUNT(DISTINCT CASE WHEN submissions.status = 'submitted' THEN submissions.id END) AS submitted,
       COUNT(DISTINCT CASE WHEN submissions.status = 'revision_requested' THEN submissions.id END) AS revision_requested,
       COUNT(DISTINCT CASE WHEN submissions.status = 'approved' THEN submissions.id END) AS approved,
       COUNT(DISTINCT CASE
         WHEN mentor_assignments.id IS NULL THEN user_accounts.id
       END) AS no_mentor
     FROM user_accounts
     LEFT JOIN group_memberships ON group_memberships.user_id = user_accounts.id
     LEFT JOIN groups ON groups.id = group_memberships.group_id
     LEFT JOIN programs ON programs.id = groups.program_id
     LEFT JOIN submissions ON submissions.student_id = user_accounts.id
     LEFT JOIN mentor_assignments
       ON mentor_assignments.student_user_id = user_accounts.id
      AND mentor_assignments.active = 1
     WHERE user_accounts.id IN (__IDS__)
     GROUP BY programs.id, programs.name
     ORDER BY programs.name`,
    studentIds,
  );
  const rows = await env.DB.prepare(query.sql).bind(...query.binds).all<ProgramBreakdownRow>();
  return rows.results || [];
}

async function countForStudents(env: Env, studentIds: string[], sql: string): Promise<number> {
  const query = bindStudentIds(sql, studentIds);
  const row = await env.DB.prepare(query.sql).bind(...query.binds).first<CountRow>();
  return Number(row?.count || 0);
}

function bindStudentIds(sql: string, studentIds: string[]): { sql: string; binds: string[] } {
  const placeholders = studentIds.map(() => "?").join(", ");
  return {
    sql: sql.replace("__IDS__", placeholders),
    binds: studentIds,
  };
}

function buildNeedsAttention(summary: ReturnType<typeof emptySummary>) {
  const items = [];
  if (summary.noMentor > 0) {
    items.push({
      type: "mentor_coverage",
      label: "Students without active mentors",
      detail: `${summary.noMentor} scoped student record(s) need mentor assignment review.`,
      severity: "urgent",
    });
  }
  if (summary.revisionRequested > 0) {
    items.push({
      type: "revision_loop",
      label: "Revision loop active",
      detail: `${summary.revisionRequested} scoped submission(s) are waiting on revisions.`,
      severity: "warning",
    });
  }
  if (summary.meetingsMakeupRequired > 0) {
    items.push({
      type: "mentor_meeting",
      label: "Mentor meeting follow-up",
      detail: `${summary.meetingsMakeupRequired} scoped meeting record(s) need follow-up.`,
      severity: "warning",
    });
  }
  if (summary.presentationsPending > 0) {
    items.push({
      type: "presentation",
      label: "Presentation readiness pending",
      detail: `${summary.presentationsPending} scoped presentation slot(s) need outline readiness.`,
      severity: "info",
    });
  }
  return items;
}

async function auditProgramDashboard(
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
    entityType: "program_teacher_dashboard",
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

function scopeTypeSummary(scopes: Array<{ scopeType: string; scopeId: string }>): string {
  if (scopes.length === 1) return scopes[0].scopeType;
  return "multiple";
}

function scopeIdSummary(scopes: Array<{ scopeType: string; scopeId: string }>): string {
  if (scopes.length === 1) return scopes[0].scopeId;
  return scopes.map((scope) => scope.scopeId || scope.scopeType).join(",");
}
