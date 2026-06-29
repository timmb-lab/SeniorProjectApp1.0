import type { Env, RoleAssignment, RoleId, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import {
  cleanId,
  isReadOnlyViewer,
  resolveSiteSelection,
  type SiteScopeContext,
} from "../../_lib/site-scope.ts";
import {
  canManageMentorAssignments,
  canManagePresentationOperations,
  canManageArchiveOperations,
  canManageSecurity,
  canManageUsers,
  canViewArchiveOperations,
  canViewAuditEvents,
  canViewMentorAssignments,
  canViewPresentationOperations,
  canViewReadinessReports,
  canViewReviewQueue,
  canViewSiteDashboard,
  canViewStudentDirectory,
  getViewerRoleContext,
} from "../../_lib/permissions.ts";

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

interface RiskStudentRow {
  student_id: string;
  student_name: string;
  program_name: string | null;
  submission_status: string | null;
  evidence_count: number;
  no_mentor: number;
  presentation_pending: number;
  archive_failed: number;
  risk_score: number;
}

interface MentorCoverageRow {
  mentor_id: string;
  mentor_name: string;
  active_assignments: number;
}

interface RecentActivityRow {
  student_id: string;
  student_name: string;
  activity_type: string;
  activity_title: string | null;
  status: string | null;
  occurred_at: string | null;
}

type AuditContext = SiteScopeContext;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const rawRequestedSiteId = url.searchParams.get("siteId");
  const requestedSiteId = cleanId(rawRequestedSiteId);
  const invalidRequestedSiteId = rawRequestedSiteId !== null && !requestedSiteId;
  const user = await getCurrentUser(request, env);

  if (!user) {
    await auditSiteDashboard(env, request, null, null, "site_dashboard_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!canUseSiteDashboardRole(context.roleIds)) {
    await auditSiteDashboard(env, request, user, context, "site_dashboard_denied", {
      reason: "role_not_allowed_for_site_dashboard",
      requestedSiteId,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (invalidRequestedSiteId) {
    await auditSiteDashboard(env, request, user, context, "site_dashboard_denied", {
      reason: "invalid_site_id",
    });
    return json({
      error: "forbidden",
      reason: "invalid_site_id",
    }, { status: 403 });
  }

  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canViewSiteDashboard(env, user, siteId),
  });
  if (selection.kind === "denied") {
    await auditSiteDashboard(env, request, user, context, "site_dashboard_denied", {
      reason: selection.reason,
      requestedSiteId,
      accessibleSiteCount: selection.accessibleSites.length,
    });
    return json({
      error: "forbidden",
      reason: selection.reason,
      accessibleSites: selection.accessibleSites,
    }, { status: 403 });
  }

  if (selection.kind === "selectionRequired") {
    await auditSiteDashboard(env, request, user, context, "site_dashboard_denied", {
      reason: "site_selection_required",
      accessibleSiteCount: selection.accessibleSites.length,
    });
    return json({
      ok: false,
      error: "site_selection_required",
      selectionRequired: true,
      accessibleSites: selection.accessibleSites,
    }, { status: 409 });
  }

  const site = selection.site;
  const readOnly = isReadOnlyViewer(context.roleIds);
  const [
    permissions,
    summary,
    programBreakdown,
    statusBreakdown,
    topRiskStudents,
    mentorCoverage,
    recentActivity,
    presentationSnapshot,
    archiveSnapshot,
  ] = await Promise.all([
    loadPermissions(env, user, site.id, readOnly),
    loadSiteSummary(env, site.id),
    loadProgramBreakdown(env, site.id),
    loadStatusBreakdown(env, site.id),
    loadTopRiskStudents(env, site.id),
    loadMentorCoverage(env, site.id),
    loadRecentActivity(env, site.id),
    countByStatus(env, site.id, `SELECT presentation_slots.status, COUNT(DISTINCT presentation_slots.id) AS count
      FROM presentation_slots
      JOIN site_users ON site_users.user_id = presentation_slots.student_user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      WHERE presentation_slots.status != 'cancelled'
      GROUP BY presentation_slots.status`),
    countByStatus(env, site.id, `SELECT exports.status, COUNT(DISTINCT exports.id) AS count
      FROM exports
      JOIN site_users ON site_users.user_id = exports.target_user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      GROUP BY exports.status`),
  ]);

  const needsAttention = buildNeedsAttention(summary);
  const nextActions = buildNextActions(summary, readOnly);

  await auditSiteDashboard(env, request, user, context, "site_dashboard_viewed", {
    tenantId: site.tenant_id,
    siteId: site.id,
    selectionMode: selection.selectionMode,
    summary: {
      studentsActive: summary.studentsActive,
      studentsNoMentor: summary.studentsNoMentor,
      submissionsSubmitted: summary.submissionsSubmitted,
      revisionRequested: summary.revisionRequested,
      exportsFailed: summary.exportsFailed,
    },
  });

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    scope: {
      tenantId: site.tenant_id,
      tenantName: site.tenant_name,
      siteId: site.id,
      siteName: site.name,
      schoolYear: site.school_year || "",
      role: context.primaryRole,
      readOnly,
      selectionMode: selection.selectionMode,
      accessibleSites: selection.accessibleSites,
    },
    permissions,
    summary,
    programBreakdown,
    statusBreakdown,
    needsAttention,
    topRiskStudents,
    mentorCoverage,
    recentActivity: recentActivity.map((row) => ({
      studentId: row.student_id,
      studentName: row.student_name,
      type: row.activity_type,
      title: row.activity_title || "Recent student update",
      status: row.status || "updated",
      occurredAt: row.occurred_at,
    })),
    presentationSnapshot: statusSnapshot(presentationSnapshot),
    archiveSnapshot: statusSnapshot(archiveSnapshot),
    nextActions,
  });
};

function canUseSiteDashboardRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "global_admin"
    || roleId === "admin"
    || roleId === "site_admin"
    || roleId === "administration"
  ));
}

async function loadPermissions(env: Env, user: UserAccount, siteId: string, readOnly: boolean) {
  const [
    canViewStudentDirectoryPermission,
    canViewReviewQueuePermission,
    canViewMentorAssignmentsPermission,
    canManageMentorAssignmentsPermission,
    canViewPresentationOperationsPermission,
    canManagePresentationOperationsPermission,
    canViewArchiveOperationsPermission,
    canManageArchiveOperationsPermission,
    canViewReadinessReportsPermission,
    canViewAuditEventsPermission,
    canManageUsersPermission,
    canManageSecurityPermission,
  ] = await Promise.all([
    canViewStudentDirectory(env, user, siteId),
    canViewReviewQueue(env, user, siteId),
    canViewMentorAssignments(env, user, siteId),
    canManageMentorAssignments(env, user, siteId),
    canViewPresentationOperations(env, user, siteId),
    canManagePresentationOperations(env, user, siteId),
    canViewArchiveOperations(env, user, siteId),
    canManageArchiveOperations(env, user, siteId),
    canViewReadinessReports(env, user, siteId),
    canViewAuditEvents(env, user, siteId),
    canManageUsers(env, user),
    canManageSecurity(env, user),
  ]);

  return {
    canViewStudentDirectory: canViewStudentDirectoryPermission,
    canViewStudentDetail: canViewStudentDirectoryPermission,
    canViewReviewQueue: canViewReviewQueuePermission,
    canViewMentorAssignments: canViewMentorAssignmentsPermission,
    canManageMentorAssignments: readOnly ? false : canManageMentorAssignmentsPermission,
    canViewPresentationOperations: canViewPresentationOperationsPermission,
    canManagePresentationOperations: readOnly ? false : canManagePresentationOperationsPermission,
    canViewArchiveOperations: canViewArchiveOperationsPermission,
    canManageArchiveOperations: readOnly ? false : canManageArchiveOperationsPermission,
    canViewReadinessReports: canViewReadinessReportsPermission,
    canViewAuditEvents: canViewAuditEventsPermission,
    canManageUsers: readOnly ? false : canManageUsersPermission,
    canManageSecurity: readOnly ? false : canManageSecurityPermission,
  };
}

async function loadSiteSummary(env: Env, siteId: string) {
  const [
    studentsTotal,
    studentsActive,
    studentsNoMentor,
    programsTotal,
    programTeachers,
    mentors,
    submissionCounts,
    evidenceArtifacts,
    mentorAssignmentsActive,
    presentationCounts,
    archiveCounts,
    recentActivityCount,
  ] = await Promise.all([
    count(env, siteId, siteStudentCountSql(false)),
    count(env, siteId, siteStudentCountSql(true)),
    count(env, siteId, `SELECT COUNT(DISTINCT student.id) AS count
      FROM site_users
      JOIN user_accounts student ON student.id = site_users.user_id
       AND student.status = 'active'
      JOIN user_roles student_role ON student_role.user_id = student.id
       AND student_role.role_id = 'student'
      LEFT JOIN mentor_assignments ON mentor_assignments.student_user_id = student.id
       AND mentor_assignments.active = 1
      WHERE site_users.site_id = ?
       AND site_users.membership_status = 'active'
       AND mentor_assignments.id IS NULL`),
    count(env, siteId, `SELECT COUNT(DISTINCT program_id) AS count
      FROM site_programs
      WHERE site_id = ?
       AND active = 1`),
    count(env, siteId, `SELECT COUNT(DISTINCT user_roles.user_id) AS count
      FROM user_roles
      JOIN user_accounts ON user_accounts.id = user_roles.user_id
       AND user_accounts.status = 'active'
      JOIN site_users ON site_users.user_id = user_roles.user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      WHERE user_roles.role_id = 'program_teacher'`),
    count(env, siteId, `SELECT COUNT(DISTINCT user_roles.user_id) AS count
      FROM user_roles
      JOIN user_accounts ON user_accounts.id = user_roles.user_id
       AND user_accounts.status = 'active'
      JOIN site_users ON site_users.user_id = user_roles.user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      WHERE user_roles.role_id = 'mentor'`),
    countByStatus(env, siteId, `SELECT submissions.status, COUNT(DISTINCT submissions.id) AS count
      FROM submissions
      JOIN site_users ON site_users.user_id = submissions.student_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      GROUP BY submissions.status`),
    count(env, siteId, `SELECT COUNT(DISTINCT evidence_artifacts.id) AS count
      FROM evidence_artifacts
      JOIN site_users ON site_users.user_id = evidence_artifacts.student_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      WHERE evidence_artifacts.deleted_at IS NULL`),
    count(env, siteId, `SELECT COUNT(DISTINCT mentor_assignments.id) AS count
      FROM mentor_assignments
      JOIN site_users ON site_users.user_id = mentor_assignments.student_user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      WHERE mentor_assignments.active = 1`),
    countByStatus(env, siteId, `SELECT presentation_slots.status, COUNT(DISTINCT presentation_slots.id) AS count
      FROM presentation_slots
      JOIN site_users ON site_users.user_id = presentation_slots.student_user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      WHERE presentation_slots.status != 'cancelled'
      GROUP BY presentation_slots.status`),
    countByStatus(env, siteId, `SELECT exports.status, COUNT(DISTINCT exports.id) AS count
      FROM exports
      JOIN site_users ON site_users.user_id = exports.target_user_id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
      GROUP BY exports.status`),
    countRecentActivity(env, siteId),
  ]);

  return {
    studentsTotal,
    studentsActive,
    studentsNoMentor,
    programsTotal,
    programTeachers,
    mentors,
    submissionsDraft: submissionCounts.draft || 0,
    submissionsSubmitted: submissionCounts.submitted || 0,
    revisionRequested: submissionCounts.revision_requested || 0,
    approved: submissionCounts.approved || 0,
    completedOrArchived: submissionCounts.archived || 0,
    evidenceArtifacts,
    mentorAssignmentsActive,
    presentationsScheduled: presentationCounts.scheduled || 0,
    presentationsPending: (presentationCounts.scheduled || 0) + (presentationCounts.checked_out || 0) + (presentationCounts.checked_in || 0),
    archiveReady: archiveCounts.complete || 0,
    exportsQueued: archiveCounts.queued || 0,
    exportsRunning: archiveCounts.running || 0,
    exportsComplete: archiveCounts.complete || 0,
    exportsFailed: archiveCounts.failed || 0,
    recentActivityCount,
  };
}

async function loadProgramBreakdown(env: Env, siteId: string) {
  const rows = await safeRows<ProgramBreakdownRow>(env, siteId, `
    SELECT
      programs.id AS program_id,
      programs.name AS program_name,
      COUNT(DISTINCT CASE WHEN student.id IS NOT NULL THEN student.id END) AS student_count,
      COUNT(DISTINCT CASE WHEN student.id IS NOT NULL AND submissions.status = 'submitted' THEN submissions.id END) AS submitted,
      COUNT(DISTINCT CASE WHEN student.id IS NOT NULL AND submissions.status = 'revision_requested' THEN submissions.id END) AS revision_requested,
      COUNT(DISTINCT CASE WHEN student.id IS NOT NULL AND submissions.status = 'approved' THEN submissions.id END) AS approved,
      COUNT(DISTINCT CASE WHEN student.id IS NOT NULL THEN evidence_artifacts.id END) AS evidence_artifacts,
      COUNT(DISTINCT CASE WHEN student.id IS NOT NULL AND mentor_assignments.id IS NULL THEN student.id END) AS no_mentor
    FROM site_programs
    JOIN programs ON programs.id = site_programs.program_id
     AND programs.active = 1
    LEFT JOIN groups ON groups.program_id = programs.id
    LEFT JOIN group_memberships ON group_memberships.group_id = groups.id
    LEFT JOIN site_users ON site_users.user_id = group_memberships.user_id
     AND site_users.site_id = site_programs.site_id
     AND site_users.membership_status = 'active'
    LEFT JOIN user_accounts student ON student.id = site_users.user_id
     AND student.status = 'active'
    LEFT JOIN user_roles student_role ON student_role.user_id = student.id
     AND student_role.role_id = 'student'
    LEFT JOIN submissions ON submissions.student_id = student.id
    LEFT JOIN evidence_artifacts ON evidence_artifacts.student_id = student.id
     AND evidence_artifacts.deleted_at IS NULL
    LEFT JOIN mentor_assignments ON mentor_assignments.student_user_id = student.id
     AND mentor_assignments.active = 1
    WHERE site_programs.site_id = ?
     AND site_programs.active = 1
     AND student_role.role_id = 'student'
    GROUP BY programs.id, programs.name
    ORDER BY programs.name`);
  return rows.map((row) => ({
    programId: row.program_id,
    programName: row.program_name,
    studentCount: Number(row.student_count || 0),
    submitted: Number(row.submitted || 0),
    revisionRequested: Number(row.revision_requested || 0),
    approved: Number(row.approved || 0),
    evidenceArtifacts: Number(row.evidence_artifacts || 0),
    noMentor: Number(row.no_mentor || 0),
  }));
}

async function loadStatusBreakdown(env: Env, siteId: string) {
  const rows = await countByStatus(env, siteId, `
    SELECT COALESCE(submissions.status, 'draft') AS status, COUNT(DISTINCT student.id) AS count
    FROM site_users
    JOIN user_accounts student ON student.id = site_users.user_id
     AND student.status = 'active'
    JOIN user_roles student_role ON student_role.user_id = student.id
     AND student_role.role_id = 'student'
    LEFT JOIN submissions ON submissions.student_id = student.id
    WHERE site_users.site_id = ?
     AND site_users.membership_status = 'active'
    GROUP BY COALESCE(submissions.status, 'draft')`);
  return statusSnapshot(rows);
}

async function loadTopRiskStudents(env: Env, siteId: string) {
  const rows = await safeRows<RiskStudentRow>(env, siteId, `
    SELECT *
    FROM (
      SELECT
        student.id AS student_id,
        student.display_name AS student_name,
        (
          SELECT programs.name
          FROM group_memberships gm
          JOIN groups ON groups.id = gm.group_id
          JOIN programs ON programs.id = groups.program_id
          WHERE gm.user_id = student.id
          ORDER BY programs.name
          LIMIT 1
        ) AS program_name,
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
        CASE WHEN EXISTS (
          SELECT 1 FROM mentor_assignments
          WHERE mentor_assignments.student_user_id = student.id
           AND mentor_assignments.active = 1
        ) THEN 0 ELSE 1 END AS no_mentor,
        CASE WHEN EXISTS (
          SELECT 1 FROM presentation_slots
          WHERE presentation_slots.student_user_id = student.id
           AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
           AND COALESCE(presentation_slots.outline_status, 'pending') != 'approved'
        ) THEN 1 ELSE 0 END AS presentation_pending,
        CASE WHEN EXISTS (
          SELECT 1 FROM exports
          WHERE exports.target_user_id = student.id
           AND exports.status = 'failed'
        ) THEN 1 ELSE 0 END AS archive_failed,
        (
          CASE WHEN NOT EXISTS (
            SELECT 1 FROM mentor_assignments
            WHERE mentor_assignments.student_user_id = student.id
             AND mentor_assignments.active = 1
          ) THEN 4 ELSE 0 END
          + CASE WHEN (
            SELECT submissions.status
            FROM submissions
            WHERE submissions.student_id = student.id
            ORDER BY submissions.updated_at DESC
            LIMIT 1
          ) = 'revision_requested' THEN 3 ELSE 0 END
          + CASE WHEN (
            SELECT submissions.status
            FROM submissions
            WHERE submissions.student_id = student.id
            ORDER BY submissions.updated_at DESC
            LIMIT 1
          ) = 'submitted' THEN 2 ELSE 0 END
          + CASE WHEN EXISTS (
            SELECT 1 FROM presentation_slots
            WHERE presentation_slots.student_user_id = student.id
             AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
             AND COALESCE(presentation_slots.outline_status, 'pending') != 'approved'
          ) THEN 2 ELSE 0 END
          + CASE WHEN EXISTS (
            SELECT 1 FROM exports
            WHERE exports.target_user_id = student.id
             AND exports.status = 'failed'
          ) THEN 3 ELSE 0 END
        ) AS risk_score
      FROM site_users
      JOIN user_accounts student ON student.id = site_users.user_id
       AND student.status = 'active'
      JOIN user_roles student_role ON student_role.user_id = student.id
       AND student_role.role_id = 'student'
      WHERE site_users.site_id = ?
       AND site_users.membership_status = 'active'
    )
    WHERE risk_score > 0
    ORDER BY risk_score DESC, student_name ASC
    LIMIT 8`);

  return rows.map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    programName: row.program_name || "Unassigned",
    submissionStatus: row.submission_status || "draft",
    evidenceCount: Number(row.evidence_count || 0),
    riskScore: Number(row.risk_score || 0),
    riskReasons: riskReasons(row),
  }));
}

async function loadMentorCoverage(env: Env, siteId: string) {
  const rows = await safeRows<MentorCoverageRow>(env, siteId, `
    SELECT
      mentor.id AS mentor_id,
      mentor.display_name AS mentor_name,
      COUNT(DISTINCT mentor_assignments.id) AS active_assignments
    FROM site_users mentor_site
    JOIN user_accounts mentor ON mentor.id = mentor_site.user_id
     AND mentor.status = 'active'
    JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
     AND mentor_role.role_id = 'mentor'
    LEFT JOIN mentor_assignments ON mentor_assignments.mentor_user_id = mentor.id
     AND mentor_assignments.active = 1
     AND mentor_assignments.student_user_id IN (
       SELECT student_site.user_id
       FROM site_users student_site
       JOIN user_roles student_role ON student_role.user_id = student_site.user_id
        AND student_role.role_id = 'student'
       WHERE student_site.site_id = ?
        AND student_site.membership_status = 'active'
     )
    WHERE mentor_site.site_id = ?
     AND mentor_site.membership_status = 'active'
    GROUP BY mentor.id, mentor.display_name
    ORDER BY mentor.display_name
    LIMIT 50`, [siteId, siteId]);
  return rows.map((row) => ({
    mentorId: row.mentor_id,
    mentorName: row.mentor_name,
    activeAssignments: Number(row.active_assignments || 0),
  }));
}

async function loadRecentActivity(env: Env, siteId: string): Promise<RecentActivityRow[]> {
  const rows = await safeRows<RecentActivityRow>(env, siteId, `
    WITH site_students AS (
      SELECT user_accounts.id, user_accounts.display_name
      FROM site_users
      JOIN user_accounts ON user_accounts.id = site_users.user_id
      JOIN user_roles ON user_roles.user_id = user_accounts.id
       AND user_roles.role_id = 'student'
      WHERE site_users.site_id = ?
       AND site_users.membership_status = 'active'
       AND user_accounts.status = 'active'
    ),
    activity AS (
      SELECT
        submissions.student_id,
        site_students.display_name AS student_name,
        'submission' AS activity_type,
        COALESCE(requirements.title, 'Senior Project submission') AS activity_title,
        submissions.status,
        COALESCE(submissions.updated_at, submissions.submitted_at, submissions.created_at) AS occurred_at
      FROM submissions
      JOIN site_students ON site_students.id = submissions.student_id
      LEFT JOIN requirements ON requirements.id = submissions.requirement_id
      UNION ALL
      SELECT
        evidence_artifacts.student_id,
        site_students.display_name AS student_name,
        'evidence' AS activity_type,
        'Evidence added' AS activity_title,
        evidence_artifacts.review_status AS status,
        evidence_artifacts.created_at AS occurred_at
      FROM evidence_artifacts
      JOIN site_students ON site_students.id = evidence_artifacts.student_id
      WHERE evidence_artifacts.deleted_at IS NULL
      UNION ALL
      SELECT
        submissions.student_id,
        site_students.display_name AS student_name,
        'review' AS activity_type,
        COALESCE(requirements.title, 'Teacher review') AS activity_title,
        reviews.decision AS status,
        reviews.created_at AS occurred_at
      FROM reviews
      JOIN submissions ON submissions.id = reviews.submission_id
      JOIN site_students ON site_students.id = submissions.student_id
      LEFT JOIN requirements ON requirements.id = submissions.requirement_id
    )
    SELECT *
    FROM activity
    WHERE occurred_at IS NOT NULL
    ORDER BY occurred_at DESC
    LIMIT 8`);
  return rows;
}

async function countRecentActivity(env: Env, siteId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(DISTINCT audit_events.id) AS count
     FROM audit_events
     LEFT JOIN submissions ON submissions.id = audit_events.entity_id
     LEFT JOIN site_users submission_site ON submission_site.user_id = submissions.student_id
      AND submission_site.site_id = ?
      AND submission_site.membership_status = 'active'
     LEFT JOIN site_users student_site ON student_site.user_id = audit_events.entity_id
      AND student_site.site_id = ?
      AND student_site.membership_status = 'active'
     WHERE audit_events.created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')
      AND (
        (audit_events.entity_type = 'site_dashboard' AND audit_events.entity_id = ?)
        OR submission_site.user_id IS NOT NULL
        OR student_site.user_id IS NOT NULL
      )`,
  ).bind(siteId, siteId, siteId).first<CountRow>();
  return Number(row?.count || 0);
}

async function count(env: Env, siteId: string, sql: string): Promise<number> {
  const row = await env.DB.prepare(sql).bind(siteId).first<CountRow>();
  return Number(row?.count || 0);
}

async function countByStatus(env: Env, siteId: string, sql: string): Promise<Record<string, number>> {
  const rows = await env.DB.prepare(sql).bind(siteId).all<StatusCountRow>();
  const counts: Record<string, number> = {};
  for (const row of rows.results || []) counts[row.status] = Number(row.count || 0);
  return counts;
}

async function safeRows<T>(env: Env, siteId: string, sql: string, binds: string[] = [siteId]): Promise<T[]> {
  const rows = await env.DB.prepare(sql).bind(...binds).all<T>();
  return rows.results || [];
}

function siteStudentCountSql(activeOnly: boolean): string {
  return `SELECT COUNT(DISTINCT user_accounts.id) AS count
    FROM site_users
    JOIN user_accounts ON user_accounts.id = site_users.user_id
    JOIN user_roles ON user_roles.user_id = user_accounts.id
     AND user_roles.role_id = 'student'
    WHERE site_users.site_id = ?
     AND site_users.membership_status = 'active'
     ${activeOnly ? "AND user_accounts.status = 'active'" : ""}`;
}

function statusSnapshot(counts: Record<string, number>): Array<{ status: string; count: number }> {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, statusCount]) => ({ status, count: Number(statusCount || 0) }));
}

function buildNeedsAttention(summary: Record<string, number>) {
  const items = [];
  if (summary.studentsNoMentor > 0) {
    items.push({
      type: "mentor_coverage",
      label: "Students without active mentors",
      detail: `${summary.studentsNoMentor} active student record(s) at this site need mentor coverage.`,
      severity: "urgent",
      owner: "School Admin",
      nextAction: "Review mentor coverage before opening student directory work.",
      actionSection: "students",
      actionPreset: "missing-mentors",
      actionLabel: "Open student list",
    });
  }
  if (summary.revisionRequested > 0) {
    items.push({
      type: "teacher_intervention",
      label: "Teacher follow-up needed",
      detail: `${summary.revisionRequested} revision-requested submission(s) need follow-up.`,
      severity: "warning",
      owner: "Program teachers",
      nextAction: "Prioritize revision follow-up and feedback checks.",
      actionSection: "teacher",
      actionPreset: "revision-requested",
      actionLabel: "Open review queue",
    });
  }
  if (summary.presentationsPending > 0) {
    items.push({
      type: "presentation_readiness",
      label: "Presentation readiness pending",
      detail: `${summary.presentationsPending} active presentation record(s) need readiness attention.`,
      severity: "info",
      owner: "Site operations",
      nextAction: "Check outline approval and day-of status.",
      actionSection: "operations",
      actionPreset: "presentation-pending",
      actionLabel: "Open operations",
    });
  }
  if (summary.exportsFailed > 0) {
    items.push({
      type: "archive_exports",
      label: "Archive exports failed",
      detail: `${summary.exportsFailed} archive export(s) need review.`,
      severity: "urgent",
      owner: "School Admin",
      nextAction: "Review private evidence and retry the export when storage is ready.",
      actionSection: "operations",
      actionPreset: "archive-failed",
      actionLabel: "Open operations",
    });
  }
  return items;
}

function buildNextActions(summary: Record<string, number>, readOnly: boolean) {
  const prefix = readOnly ? "Review" : "Act on";
  const reviewPreset = summary.revisionRequested > 0 ? "revision_requested" : "submitted";
  const reviewSection = readOnly ? "students" : "teacher";
  const reviewActionPreset = readOnly
    ? (reviewPreset === "revision_requested" ? "revision-students" : "submitted-students")
    : reviewPreset;
  const reviewActionLabel = readOnly ? "Open student list" : "Open review queue";
  const operationsPreset = summary.exportsFailed > 0 ? "archive-failed" : "presentation-pending";
  const operationsStatus = summary.exportsFailed > 0
    ? "failed"
    : (summary.presentationsPending > 0 ? "pending" : "ready");
  const operationsDetail = summary.exportsFailed > 0
    ? `${summary.exportsFailed} archive export(s) need follow-up.`
    : summary.presentationsPending > 0
      ? `${summary.presentationsPending} presentation record(s) still need readiness follow-up.`
      : "Presentation and archive follow-up is currently clear for this site.";
  const hasOperationsFollowUp = summary.exportsFailed > 0 || summary.presentationsPending > 0;

  return [
    {
      label: `${prefix} assigned site records`,
      detail: `${summary.studentsActive} active student record(s) are visible for this site.`,
      status: "ready",
      actionSection: "students",
      actionPreset: "all-students",
      actionLabel: "Open student list",
    },
    {
      label: "Teacher follow-up",
      detail: `${summary.submissionsSubmitted + summary.revisionRequested} submitted or revision-requested record(s) need teacher follow-up.`,
      status: summary.revisionRequested > 0 ? "revision_requested" : "submitted",
      actionSection: reviewSection,
      actionPreset: reviewActionPreset,
      actionLabel: reviewActionLabel,
    },
    {
      label: "Presentation and archive follow-up",
      detail: operationsDetail,
      status: operationsStatus,
      actionSection: hasOperationsFollowUp ? "operations" : "",
      actionPreset: hasOperationsFollowUp ? operationsPreset : "",
      actionLabel: hasOperationsFollowUp ? "Open operations" : "",
    },
    {
      label: "Private evidence",
      detail: `${summary.evidenceArtifacts} private evidence item(s) are counted without showing private file details.`,
      status: "configured",
    },
    {
      label: "Protected access",
      detail: "Access stays protected and reviewed for this school workspace.",
      status: "approved",
    },
  ];
}

function riskReasons(row: RiskStudentRow): string[] {
  const reasons = [];
  if (Number(row.no_mentor || 0) === 1) reasons.push("No mentor");
  if (row.submission_status === "revision_requested") reasons.push("Revision requested");
  if (row.submission_status === "submitted") reasons.push("Awaiting review");
  if (Number(row.presentation_pending || 0) === 1) reasons.push("Presentation pending");
  if (Number(row.archive_failed || 0) === 1) reasons.push("Archive failed");
  return reasons;
}

async function auditSiteDashboard(
  env: Env,
  request: Request,
  user: UserAccount | null,
  context: AuditContext | null,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await writeAudit(env, {
      actorUserId: user?.id || null,
      action,
      entityType: "site_dashboard",
      entityId: cleanId(String(metadata.siteId || metadata.requestedSiteId || "")) || null,
      request,
      metadata: {
        ...metadata,
        actorRoleScopes: context ? safeRoleScopes(context.roles) : [],
      },
    });
  } catch {
    // Existing routes generally require audit writes, but this dashboard should not fail
    // a safe read solely because audit storage is temporarily unavailable.
  }
}

function safeRoleScopes(assignments: RoleAssignment[]) {
  return assignments.map((assignment) => ({
    roleId: assignment.role_id,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id || "",
  }));
}
