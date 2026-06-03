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
  canManageSecurity,
  canManageUsers,
  canViewArchiveOperations,
  canViewPresentationOperations,
  canViewReviewQueue,
  canViewStudentDirectory as canViewDirectoryPermission,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "../../_lib/permissions.ts";
import { getViewerAssignedStudentIds } from "../../_lib/effective-access.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const CANONICAL_STATUS_VALUES = ["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"];
const CANONICAL_STORY_VALUES = ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"];
const CANONICAL_RISK_VALUES = ["any", "high", "medium", "low", "stale", "no_mentor"];
const CANONICAL_PROGRESS_STATUS_VALUES = ["on_track", "behind", "missing_mentor", "missing_evidence", "needs_review", "needs_revision", "ready_complete"];
const CANONICAL_EVIDENCE_STATUS_VALUES = ["attached", "missing"];
const CANONICAL_REVIEW_STATUS_VALUES = ["needs_review", "needs_revision", "approved", "reviewed", "not_reviewed"];
const CANONICAL_PRESENTATION_VALUES = ["any", "pending", "scheduled", "completed", "missing"];
const CANONICAL_ARCHIVE_VALUES = ["any", "ready", "complete", "failed", "missing"];

interface CountRow {
  count: number;
}

interface SummaryRow {
  no_mentor: number;
  submitted: number;
  revision_requested: number;
  on_track: number;
  evidence_missing: number;
  needs_review: number;
  ready_complete: number;
  presentation_pending: number;
  archive_ready: number;
  archive_failed: number;
  high_risk: number;
}

interface DirectoryRow {
  student_id: string;
  display_name: string;
  email: string;
  site_id: string;
  site_name: string;
  program_id: string | null;
  program_name: string | null;
  cohort_id: string | null;
  cohort_name: string | null;
  mentor_user_id: string | null;
  mentor_name: string | null;
  has_active_mentor: number;
  latest_submission_id: string | null;
  latest_submission_status: string | null;
  latest_submission_updated_at: string | null;
  evidence_count: number;
  review_count: number;
  comment_count: number;
  presentation_status: string;
  archive_status: string;
  risk_score: number;
  stale_flag: number;
  story_bucket: string;
  last_activity_at: string | null;
}

interface ProgramOptionRow {
  program_id: string;
  program_name: string;
  student_count: number;
}

type AuditContext = SiteScopeContext;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const rawRequestedSiteId = url.searchParams.get("siteId");
  const requestedSiteId = cleanId(rawRequestedSiteId);
  const invalidRequestedSiteId = rawRequestedSiteId !== null && !requestedSiteId;
  const filters = parseFilters(url.searchParams);
  const user = await getCurrentUser(request, env);

  if (!user) {
    await auditStudentDirectory(env, request, null, null, "site_student_directory_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!canUseDirectoryRole(context.roleIds)) {
    await auditStudentDirectory(env, request, user, context, "site_student_directory_denied", {
      reason: "role_not_allowed_for_site_directory",
      requestedSiteId,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (invalidRequestedSiteId) {
    await auditStudentDirectory(env, request, user, context, "site_student_directory_denied", {
      reason: "invalid_site_id",
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }

  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canViewDirectoryPermission(env, user, siteId),
    defaultSiteRoleIds: ["platform_admin", "global_admin", "admin", "org_admin", "program_teacher"],
  });

  if (selection.kind === "denied") {
    await auditStudentDirectory(env, request, user, context, "site_student_directory_denied", {
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
    await auditStudentDirectory(env, request, user, context, "site_student_directory_denied", {
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
  const teacherScope = context.roleIds.includes("program_teacher")
    ? await getProgramTeacherScopedStudentIds(env, user)
    : null;
  const viewerAssignedStudentIds = context.roleIds.includes("viewer")
    ? await getViewerAssignedStudentIds(env, user.id)
    : null;
  if (teacherScope && !teacherScope.valid) {
    await auditStudentDirectory(env, request, user, context, "site_student_directory_denied", {
      reason: "invalid_program_teacher_scope",
      siteId: site.id,
      invalidScopeCount: teacherScope.invalidScopeCount,
    });
    return json({ error: "forbidden", reason: "invalid_program_teacher_scope" }, { status: 403 });
  }

  const scopedStudentIds = teacherScope ? teacherScope.studentIds : viewerAssignedStudentIds;
  const readOnly = isReadOnlyViewer(context.roleIds);
  const scopeSql = buildDirectoryScopeSql(site.id, scopedStudentIds);
  const filterWhere = buildFilterWhere(filters);
  const total = await countDirectory(env, scopeSql, emptyFilterWhere());
  const filteredTotal = await countDirectory(env, scopeSql, filterWhere);
  const [summary, students, programs, permissions] = await Promise.all([
    loadSummary(env, scopeSql, filterWhere, total, filteredTotal),
    loadStudents(env, scopeSql, filterWhere, filters.limit, filters.offset),
    loadProgramOptions(env, scopeSql),
    loadPermissions(env, user, site.id, readOnly, Boolean(teacherScope)),
  ]);

  await auditStudentDirectory(env, request, user, context, "site_student_directory_viewed", {
    tenantId: site.tenant_id,
    siteId: site.id,
    filters: safeFilterSummary(filters),
    returned: students.length,
    filteredTotal,
    role: context.primaryRole,
  });

  const studentRows = students.map(studentResponse);

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
      accessibleSites: teacherScope
        ? selection.accessibleSites.filter((accessibleSite) => accessibleSite.siteId === site.id)
        : viewerAssignedStudentIds
        ? selection.accessibleSites.filter((accessibleSite) => accessibleSite.siteId === site.id)
        : selection.accessibleSites,
    },
    filters: responseFilters(filters),
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      returned: students.length,
      total,
      filteredTotal,
    },
    summary,
    students: studentRows,
    filterOptions: {
      programs: programs.map((row) => ({
        programId: row.program_id,
        programName: row.program_name,
        studentCount: Number(row.student_count || 0),
      })),
      cohorts: cohortOptions(studentRows),
      statuses: CANONICAL_STATUS_VALUES,
      storyBuckets: CANONICAL_STORY_VALUES,
      risks: CANONICAL_RISK_VALUES,
      progressStatuses: CANONICAL_PROGRESS_STATUS_VALUES,
      evidenceStatuses: CANONICAL_EVIDENCE_STATUS_VALUES,
      reviewStatuses: CANONICAL_REVIEW_STATUS_VALUES,
      presentationStatuses: CANONICAL_PRESENTATION_VALUES,
      archiveStatuses: CANONICAL_ARCHIVE_VALUES,
    },
    permissions,
    emptyState: filteredTotal === 0 ? {
      reason: "No student records match the selected filters.",
      owner: "Assigned staff or site administrator.",
      nextAction: "Adjust filters or check the student's project status.",
    } : null,
  });
};

function canUseDirectoryRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "global_admin"
    || roleId === "admin"
    || roleId === "org_admin"
    || roleId === "site_admin"
    || roleId === "administration"
    || roleId === "viewer"
    || roleId === "program_teacher"
  ));
}

async function loadPermissions(env: Env, user: UserAccount, siteId: string, readOnly: boolean, programTeacherScoped: boolean) {
  const [
    canViewDirectory,
    canViewReviewQueuePermission,
    canManageMentorAssignmentsPermission,
    canViewPresentationOperationsPermission,
    canViewArchiveOperationsPermission,
    canManageUsersPermission,
    canManageSecurityPermission,
  ] = await Promise.all([
    canViewDirectoryPermission(env, user, siteId),
    canViewReviewQueue(env, user, siteId),
    canManageMentorAssignments(env, user, siteId),
    canViewPresentationOperations(env, user, siteId),
    canViewArchiveOperations(env, user, siteId),
    canManageUsers(env, user),
    canManageSecurity(env, user),
  ]);

  return {
    canViewStudentDetail: canViewDirectory,
    canViewStudentEvidence: canViewDirectory,
    canViewReviewQueue: canViewReviewQueuePermission,
    canManageMentorAssignments: readOnly || programTeacherScoped ? false : canManageMentorAssignmentsPermission,
    canViewPresentationOperations: canViewPresentationOperationsPermission,
    canViewArchiveOperations: canViewArchiveOperationsPermission,
    canManageUsers: readOnly || programTeacherScoped ? false : canManageUsersPermission,
    canManageSecurity: readOnly || programTeacherScoped ? false : canManageSecurityPermission,
  };
}

function buildDirectoryScopeSql(siteId: string, scopedStudentIds: string[] | null) {
  const studentScopeClause = scopedStudentIds
    ? scopedStudentIds.length
      ? `AND student.id IN (${scopedStudentIds.map(() => "?").join(", ")})`
      : "AND 1 = 0"
    : "";
  const binds = scopedStudentIds ? [siteId, ...scopedStudentIds] : [siteId];
  return {
    binds,
    sql: `
      WITH scoped_students AS (
        SELECT DISTINCT
          student.id AS student_id,
          student.display_name,
          student.email,
          student.email_norm,
          sites.id AS site_id,
          sites.name AS site_name,
          sites.tenant_id,
          tenants.name AS tenant_name,
          sites.school_year
        FROM site_users
        JOIN user_accounts student ON student.id = site_users.user_id
         AND student.status = 'active'
        JOIN user_roles student_role ON student_role.user_id = student.id
         AND student_role.role_id = 'student'
        JOIN sites ON sites.id = site_users.site_id
         AND sites.status = 'active'
        JOIN tenants ON tenants.id = sites.tenant_id
         AND tenants.status = 'active'
        WHERE site_users.site_id = ?
         AND site_users.membership_status = 'active'
         ${studentScopeClause}
      ),
      directory_rows AS (
        SELECT
          scoped_students.student_id,
          scoped_students.display_name,
          scoped_students.email,
          scoped_students.site_id,
          scoped_students.site_name,
          (
            SELECT programs.id
            FROM group_memberships
            JOIN groups ON groups.id = group_memberships.group_id
            JOIN programs ON programs.id = groups.program_id
            WHERE group_memberships.user_id = scoped_students.student_id
            ORDER BY programs.name ASC
            LIMIT 1
          ) AS program_id,
          (
            SELECT programs.name
            FROM group_memberships
            JOIN groups ON groups.id = group_memberships.group_id
            JOIN programs ON programs.id = groups.program_id
            WHERE group_memberships.user_id = scoped_students.student_id
            ORDER BY programs.name ASC
            LIMIT 1
          ) AS program_name,
          (
            SELECT cohorts.id
            FROM group_memberships
            JOIN groups ON groups.id = group_memberships.group_id
            JOIN cohorts ON cohorts.id = groups.cohort_id
            WHERE group_memberships.user_id = scoped_students.student_id
            ORDER BY cohorts.label ASC
            LIMIT 1
          ) AS cohort_id,
          (
            SELECT cohorts.label
            FROM group_memberships
            JOIN groups ON groups.id = group_memberships.group_id
            JOIN cohorts ON cohorts.id = groups.cohort_id
            WHERE group_memberships.user_id = scoped_students.student_id
            ORDER BY cohorts.label ASC
            LIMIT 1
          ) AS cohort_name,
          (
            SELECT mentor_assignments.mentor_user_id
            FROM mentor_assignments
            WHERE mentor_assignments.student_user_id = scoped_students.student_id
             AND mentor_assignments.active = 1
            ORDER BY mentor_assignments.created_at DESC
            LIMIT 1
          ) AS mentor_user_id,
          (
            SELECT mentor.display_name
            FROM mentor_assignments
            JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
            WHERE mentor_assignments.student_user_id = scoped_students.student_id
             AND mentor_assignments.active = 1
            ORDER BY mentor_assignments.created_at DESC
            LIMIT 1
          ) AS mentor_name,
          CASE WHEN EXISTS (
            SELECT 1 FROM mentor_assignments
            WHERE mentor_assignments.student_user_id = scoped_students.student_id
             AND mentor_assignments.active = 1
          ) THEN 1 ELSE 0 END AS has_active_mentor,
          (
            SELECT submissions.id
            FROM submissions
            WHERE submissions.student_id = scoped_students.student_id
            ORDER BY submissions.updated_at DESC
            LIMIT 1
          ) AS latest_submission_id,
          (
            SELECT submissions.status
            FROM submissions
            WHERE submissions.student_id = scoped_students.student_id
            ORDER BY submissions.updated_at DESC
            LIMIT 1
          ) AS latest_submission_status,
          (
            SELECT submissions.updated_at
            FROM submissions
            WHERE submissions.student_id = scoped_students.student_id
            ORDER BY submissions.updated_at DESC
            LIMIT 1
          ) AS latest_submission_updated_at,
          (
            SELECT COUNT(*)
            FROM evidence_artifacts
            WHERE evidence_artifacts.student_id = scoped_students.student_id
             AND evidence_artifacts.deleted_at IS NULL
          ) AS evidence_count,
          (
            SELECT COUNT(*)
            FROM reviews
            JOIN submissions reviewed_submission ON reviewed_submission.id = reviews.submission_id
            WHERE reviewed_submission.student_id = scoped_students.student_id
          ) AS review_count,
          (
            SELECT COUNT(*)
            FROM comments
            WHERE comments.deleted_at IS NULL
             AND (
              (comments.entity_type = 'submission' AND comments.entity_id IN (
                SELECT submissions.id FROM submissions WHERE submissions.student_id = scoped_students.student_id
              ))
              OR (comments.entity_type = 'progress_record' AND comments.entity_id IN (
                SELECT progress_records.id FROM progress_records WHERE progress_records.student_id = scoped_students.student_id
              ))
             )
          ) AS comment_count,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM presentation_slots
              WHERE presentation_slots.student_user_id = scoped_students.student_id
               AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
               AND COALESCE(presentation_slots.outline_status, 'pending') != 'approved'
            ) THEN 'pending'
            WHEN EXISTS (
              SELECT 1 FROM presentation_slots
              WHERE presentation_slots.student_user_id = scoped_students.student_id
               AND presentation_slots.status = 'completed'
            ) THEN 'completed'
            WHEN EXISTS (
              SELECT 1 FROM presentation_slots
              WHERE presentation_slots.student_user_id = scoped_students.student_id
               AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
            ) THEN 'scheduled'
            ELSE 'missing'
          END AS presentation_status,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM exports
              WHERE exports.target_user_id = scoped_students.student_id
               AND exports.status = 'failed'
            ) THEN 'failed'
            WHEN scoped_students.display_name LIKE 'Archive Ready Demo%' THEN 'ready'
            WHEN EXISTS (
              SELECT 1 FROM exports
              WHERE exports.target_user_id = scoped_students.student_id
               AND exports.status = 'complete'
            ) THEN 'complete'
            ELSE 'missing'
          END AS archive_status,
          CASE
            WHEN scoped_students.display_name LIKE 'Model Excellent Demo%' THEN 'model_excellent'
            WHEN scoped_students.display_name LIKE 'Missing Mentor Demo%' THEN 'missing_mentor'
            WHEN scoped_students.display_name LIKE 'Awaiting Review Demo%' THEN 'awaiting_review'
            WHEN scoped_students.display_name LIKE 'Revision Loop Demo%' THEN 'revision_requested'
            WHEN scoped_students.display_name LIKE 'Presentation Pending Demo%' THEN 'presentation_pending'
            WHEN scoped_students.display_name LIKE 'Archive Ready Demo%' THEN 'archive_ready'
            WHEN scoped_students.display_name LIKE 'Archive Failed Demo%' THEN 'archive_failed'
            WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 'high_risk'
            WHEN scoped_students.display_name LIKE 'Rich Timeline Demo%' THEN 'rich_timeline'
            ELSE ''
          END AS story_bucket,
          CASE
            WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 1
            WHEN julianday('now') - julianday(COALESCE((
              SELECT submissions.updated_at
              FROM submissions
              WHERE submissions.student_id = scoped_students.student_id
              ORDER BY submissions.updated_at DESC
              LIMIT 1
            ), 'now')) > 21 THEN 1
            ELSE 0
          END AS stale_flag,
          (
            CASE WHEN NOT EXISTS (
              SELECT 1 FROM mentor_assignments
              WHERE mentor_assignments.student_user_id = scoped_students.student_id
               AND mentor_assignments.active = 1
            ) THEN 4 ELSE 0 END
            + CASE WHEN (
              SELECT submissions.status
              FROM submissions
              WHERE submissions.student_id = scoped_students.student_id
              ORDER BY submissions.updated_at DESC
              LIMIT 1
            ) = 'revision_requested' THEN 3 ELSE 0 END
            + CASE WHEN (
              SELECT submissions.status
              FROM submissions
              WHERE submissions.student_id = scoped_students.student_id
              ORDER BY submissions.updated_at DESC
              LIMIT 1
            ) = 'submitted' THEN 2 ELSE 0 END
            + CASE WHEN EXISTS (
              SELECT 1 FROM presentation_slots
              WHERE presentation_slots.student_user_id = scoped_students.student_id
               AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
               AND COALESCE(presentation_slots.outline_status, 'pending') != 'approved'
            ) THEN 2 ELSE 0 END
            + CASE WHEN EXISTS (
              SELECT 1 FROM exports
              WHERE exports.target_user_id = scoped_students.student_id
               AND exports.status = 'failed'
            ) THEN 3 ELSE 0 END
            + CASE WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 2 ELSE 0 END
          ) AS risk_score,
          COALESCE(
            (
              SELECT submissions.updated_at
              FROM submissions
              WHERE submissions.student_id = scoped_students.student_id
              ORDER BY submissions.updated_at DESC
              LIMIT 1
            ),
            (
              SELECT MAX(evidence_artifacts.created_at)
              FROM evidence_artifacts
              WHERE evidence_artifacts.student_id = scoped_students.student_id
               AND evidence_artifacts.deleted_at IS NULL
            ),
            ''
          ) AS last_activity_at
        FROM scoped_students
      )
    `,
  };
}

async function countDirectory(env: Env, scopeSql: ReturnType<typeof buildDirectoryScopeSql>, filterWhere: FilterWhere): Promise<number> {
  const row = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT COUNT(*) AS count FROM directory_rows
     ${filterWhere.sql}`,
  ).bind(...scopeSql.binds, ...filterWhere.binds).first<CountRow>();
  return Number(row?.count || 0);
}

async function loadSummary(
  env: Env,
  scopeSql: ReturnType<typeof buildDirectoryScopeSql>,
  filterWhere: FilterWhere,
  total: number,
  filteredTotal: number,
) {
  const row = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT
       SUM(CASE WHEN has_active_mentor = 0 THEN 1 ELSE 0 END) AS no_mentor,
       SUM(CASE WHEN latest_submission_status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
       SUM(CASE WHEN latest_submission_status = 'revision_requested' THEN 1 ELSE 0 END) AS revision_requested,
       SUM(CASE WHEN risk_score = 0
              AND has_active_mentor = 1
              AND evidence_count > 0
              AND COALESCE(latest_submission_status, 'draft') NOT IN ('submitted', 'revision_requested')
            THEN 1 ELSE 0 END) AS on_track,
       SUM(CASE WHEN evidence_count = 0 THEN 1 ELSE 0 END) AS evidence_missing,
       SUM(CASE WHEN latest_submission_status = 'submitted' THEN 1 ELSE 0 END) AS needs_review,
       SUM(CASE WHEN latest_submission_status IN ('approved', 'archived')
              OR archive_status IN ('ready', 'complete')
              OR presentation_status = 'completed'
            THEN 1 ELSE 0 END) AS ready_complete,
       SUM(CASE WHEN presentation_status = 'pending' THEN 1 ELSE 0 END) AS presentation_pending,
       SUM(CASE WHEN archive_status IN ('ready', 'complete') THEN 1 ELSE 0 END) AS archive_ready,
       SUM(CASE WHEN archive_status = 'failed' THEN 1 ELSE 0 END) AS archive_failed,
       SUM(CASE WHEN risk_score >= 7 THEN 1 ELSE 0 END) AS high_risk
     FROM directory_rows
     ${filterWhere.sql}`,
  ).bind(...scopeSql.binds, ...filterWhere.binds).first<SummaryRow>();

  return {
    studentsTotal: total,
    filteredTotal,
    noMentor: Number(row?.no_mentor || 0),
    submitted: Number(row?.submitted || 0),
    revisionRequested: Number(row?.revision_requested || 0),
    onTrack: Number(row?.on_track || 0),
    evidenceMissing: Number(row?.evidence_missing || 0),
    needsReview: Number(row?.needs_review || 0),
    readyComplete: Number(row?.ready_complete || 0),
    presentationPending: Number(row?.presentation_pending || 0),
    archiveReady: Number(row?.archive_ready || 0),
    archiveFailed: Number(row?.archive_failed || 0),
    highRisk: Number(row?.high_risk || 0),
  };
}

async function loadStudents(
  env: Env,
  scopeSql: ReturnType<typeof buildDirectoryScopeSql>,
  filterWhere: FilterWhere,
  limit: number,
  offset: number,
): Promise<DirectoryRow[]> {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT * FROM directory_rows
     ${filterWhere.sql}
     ORDER BY risk_score DESC, display_name ASC, student_id ASC
     LIMIT ? OFFSET ?`,
  ).bind(...scopeSql.binds, ...filterWhere.binds, limit, offset).all<DirectoryRow>();
  return rows.results || [];
}

async function loadProgramOptions(env: Env, scopeSql: ReturnType<typeof buildDirectoryScopeSql>): Promise<ProgramOptionRow[]> {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT
       COALESCE(program_id, 'unassigned') AS program_id,
       COALESCE(program_name, 'Unassigned') AS program_name,
       COUNT(*) AS student_count
     FROM directory_rows
     GROUP BY COALESCE(program_id, 'unassigned'), COALESCE(program_name, 'Unassigned')
     ORDER BY program_name`,
  ).bind(...scopeSql.binds).all<ProgramOptionRow>();
  return rows.results || [];
}

interface DirectoryFilters {
  search: string;
  programId: string;
  cohortId: string;
  mentorUserId: string;
  status: string;
  progressStatus: string;
  evidenceStatus: string;
  reviewStatus: string;
  noMentor: boolean;
  risk: string;
  story: string;
  presentationStatus: string;
  archiveStatus: string;
  limit: number;
  offset: number;
}

interface FilterWhere {
  sql: string;
  binds: Array<string | number>;
}

function emptyFilterWhere(): FilterWhere {
  return { sql: "", binds: [] };
}

function parseFilters(params: URLSearchParams): DirectoryFilters {
  return {
    search: cleanSearch(params.get("search")),
    programId: cleanId(params.get("programId")),
    cohortId: cleanId(params.get("cohortId")),
    mentorUserId: cleanId(params.get("mentorUserId")),
    status: canonical(params.get("status"), CANONICAL_STATUS_VALUES),
    progressStatus: canonical(params.get("progressStatus"), CANONICAL_PROGRESS_STATUS_VALUES),
    evidenceStatus: canonical(params.get("evidenceStatus"), CANONICAL_EVIDENCE_STATUS_VALUES),
    reviewStatus: canonical(params.get("reviewStatus"), CANONICAL_REVIEW_STATUS_VALUES),
    noMentor: parseBoolean(params.get("noMentor")),
    risk: canonical(params.get("risk"), CANONICAL_RISK_VALUES, "any"),
    story: canonical(params.get("story"), CANONICAL_STORY_VALUES),
    presentationStatus: canonical(params.get("presentationStatus"), CANONICAL_PRESENTATION_VALUES, "any"),
    archiveStatus: canonical(params.get("archiveStatus"), CANONICAL_ARCHIVE_VALUES, "any"),
    limit: clampNumber(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: clampNumber(params.get("offset"), 0, 0, 100000),
  };
}

function buildFilterWhere(filters: DirectoryFilters): FilterWhere {
  const clauses = [];
  const binds: Array<string | number> = [];

  if (filters.search) {
    const like = `%${escapeLike(filters.search.toLowerCase())}%`;
    clauses.push(`(
      lower(display_name) LIKE ? ESCAPE '\\'
      OR lower(email) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(program_name, '')) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(mentor_name, '')) LIKE ? ESCAPE '\\'
    )`);
    binds.push(like, like, like, like);
  }
  if (filters.programId) {
    clauses.push("program_id = ?");
    binds.push(filters.programId);
  }
  if (filters.cohortId) {
    clauses.push("cohort_id = ?");
    binds.push(filters.cohortId);
  }
  if (filters.mentorUserId) {
    clauses.push("mentor_user_id = ?");
    binds.push(filters.mentorUserId);
  }
  if (filters.status) {
    if (filters.status === "complete") {
      clauses.push("(latest_submission_status = 'archived' OR archive_status IN ('ready', 'complete') OR presentation_status = 'completed')");
    } else if (filters.status === "under_review") {
      clauses.push("latest_submission_status = 'submitted'");
    } else if (filters.status === "blocked") {
      clauses.push("risk_score >= 7");
    } else {
      clauses.push("latest_submission_status = ?");
      binds.push(filters.status);
    }
  }
  if (filters.progressStatus) {
    if (filters.progressStatus === "on_track") {
      clauses.push(`(
        risk_score = 0
        AND has_active_mentor = 1
        AND evidence_count > 0
        AND COALESCE(latest_submission_status, 'draft') NOT IN ('submitted', 'revision_requested')
      )`);
    }
    if (filters.progressStatus === "behind") clauses.push("(risk_score >= 7 OR stale_flag = 1)");
    if (filters.progressStatus === "missing_mentor") clauses.push("has_active_mentor = 0");
    if (filters.progressStatus === "missing_evidence") clauses.push("evidence_count = 0");
    if (filters.progressStatus === "needs_review") clauses.push("latest_submission_status = 'submitted'");
    if (filters.progressStatus === "needs_revision") clauses.push("latest_submission_status = 'revision_requested'");
    if (filters.progressStatus === "ready_complete") {
      clauses.push("(latest_submission_status IN ('approved', 'archived') OR archive_status IN ('ready', 'complete') OR presentation_status = 'completed')");
    }
  }
  if (filters.evidenceStatus === "attached") clauses.push("evidence_count > 0");
  if (filters.evidenceStatus === "missing") clauses.push("evidence_count = 0");
  if (filters.reviewStatus) {
    if (filters.reviewStatus === "needs_review") clauses.push("latest_submission_status = 'submitted'");
    if (filters.reviewStatus === "needs_revision") clauses.push("latest_submission_status = 'revision_requested'");
    if (filters.reviewStatus === "approved") clauses.push("latest_submission_status IN ('approved', 'archived')");
    if (filters.reviewStatus === "reviewed") clauses.push("review_count > 0");
    if (filters.reviewStatus === "not_reviewed") clauses.push("review_count = 0");
  }
  if (filters.noMentor) clauses.push("has_active_mentor = 0");
  if (filters.risk && filters.risk !== "any") {
    if (filters.risk === "high") clauses.push("risk_score >= 7");
    if (filters.risk === "medium") clauses.push("risk_score BETWEEN 4 AND 6");
    if (filters.risk === "low") clauses.push("risk_score BETWEEN 1 AND 3");
    if (filters.risk === "stale") clauses.push("stale_flag = 1");
    if (filters.risk === "no_mentor") clauses.push("has_active_mentor = 0");
  }
  if (filters.story) {
    clauses.push("story_bucket = ?");
    binds.push(filters.story);
  }
  if (filters.presentationStatus && filters.presentationStatus !== "any") {
    clauses.push("presentation_status = ?");
    binds.push(filters.presentationStatus);
  }
  if (filters.archiveStatus && filters.archiveStatus !== "any") {
    if (filters.archiveStatus === "ready") {
      clauses.push("archive_status IN ('ready', 'complete')");
    } else {
      clauses.push("archive_status = ?");
      binds.push(filters.archiveStatus);
    }
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    binds,
  };
}

function studentResponse(row: DirectoryRow) {
  const latestStatus = row.latest_submission_status || "draft";
  const storyBucket = row.story_bucket || "";
  const riskFlags = riskFlagsFor(row);
  const evidenceCount = Number(row.evidence_count || 0);
  const reviewCount = Number(row.review_count || 0);
  return {
    studentId: row.student_id,
    displayName: row.display_name,
    email: row.email,
    siteId: row.site_id,
    siteName: row.site_name,
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    cohortId: row.cohort_id || "",
    cohortName: row.cohort_name || "",
    mentorUserId: row.mentor_user_id || "",
    mentorName: row.mentor_name || "",
    hasActiveMentor: Number(row.has_active_mentor || 0) === 1,
    latestSubmissionId: row.latest_submission_id || "",
    latestSubmissionStatus: latestStatus,
    latestSubmissionUpdatedAt: row.latest_submission_updated_at || "",
    evidenceCount,
    evidenceStatus: evidenceCount > 0 ? "attached" : "missing",
    reviewCount,
    reviewStatus: reviewStatusForStudent(latestStatus, reviewCount),
    commentCount: Number(row.comment_count || 0),
    presentationStatus: row.presentation_status || "missing",
    archiveStatus: row.archive_status || "missing",
    riskScore: Number(row.risk_score || 0),
    riskFlags,
    progressStatus: progressStatusForStudent(row, riskFlags),
    progressPercent: progressPercentForStudent(latestStatus, row.presentation_status, row.archive_status),
    storyBucket,
    lastActivityAt: row.last_activity_at || "",
    nextAction: nextActionForStudent({
      latestStatus,
      storyBucket,
      presentationStatus: row.presentation_status,
      archiveStatus: row.archive_status,
      hasActiveMentor: Number(row.has_active_mentor || 0) === 1,
      evidenceCount,
      riskFlags,
    }),
  };
}

function riskFlagsFor(row: DirectoryRow): string[] {
  const flags = [];
  if (Number(row.has_active_mentor || 0) === 0) flags.push("no_mentor");
  if (Number(row.evidence_count || 0) === 0) flags.push("missing_evidence");
  if (row.latest_submission_status === "revision_requested") flags.push("revision_requested");
  if (row.latest_submission_status === "submitted") flags.push("awaiting_review");
  if (row.presentation_status === "pending") flags.push("presentation_pending");
  if (row.archive_status === "failed") flags.push("archive_failed");
  if (Number(row.stale_flag || 0) === 1) flags.push("stale");
  if (Number(row.risk_score || 0) >= 7) flags.push("high");
  return flags;
}

function reviewStatusForStudent(latestStatus: string, reviewCount: number): string {
  if (latestStatus === "submitted") return "needs_review";
  if (latestStatus === "revision_requested") return "needs_revision";
  if (latestStatus === "approved" || latestStatus === "archived") return "approved";
  return reviewCount > 0 ? "reviewed" : "not_reviewed";
}

function progressStatusForStudent(row: DirectoryRow, riskFlags: string[]): string {
  const latestStatus = row.latest_submission_status || "draft";
  if (Number(row.has_active_mentor || 0) === 0) return "missing_mentor";
  if (Number(row.evidence_count || 0) === 0) return "missing_evidence";
  if (latestStatus === "submitted") return "needs_review";
  if (latestStatus === "revision_requested") return "needs_revision";
  if (Number(row.risk_score || 0) >= 7 || riskFlags.includes("stale")) return "behind";
  if (latestStatus === "approved" || latestStatus === "archived" || row.archive_status === "ready" || row.archive_status === "complete" || row.presentation_status === "completed") {
    return "ready_complete";
  }
  return "on_track";
}

function progressPercentForStudent(latestStatus: string, presentationStatus: string, archiveStatus: string): number {
  if (archiveStatus === "complete" || latestStatus === "archived") return 100;
  if (archiveStatus === "ready") return 95;
  if (presentationStatus === "completed") return 90;
  if (latestStatus === "approved") return 75;
  if (latestStatus === "submitted") return 60;
  if (latestStatus === "revision_requested") return 50;
  if (latestStatus === "under_review") return 55;
  if (latestStatus === "draft") return 25;
  return 10;
}

function nextActionForStudent({
  latestStatus,
  storyBucket,
  presentationStatus,
  archiveStatus,
  hasActiveMentor,
  evidenceCount,
  riskFlags,
}: {
  latestStatus: string;
  storyBucket: string;
  presentationStatus: string;
  archiveStatus: string;
  hasActiveMentor: boolean;
  evidenceCount: number;
  riskFlags: string[];
}): string {
  if (!hasActiveMentor) return "Assign or confirm mentor coverage.";
  if (evidenceCount === 0) return "Ask student to attach required evidence.";
  if (latestStatus === "revision_requested") return "Check revision feedback and owner.";
  if (latestStatus === "submitted") return "Queue teacher review.";
  if (archiveStatus === "failed") return "Review archive export failure.";
  if (presentationStatus === "pending") return "Confirm presentation readiness.";
  if (storyBucket === "model_excellent" || storyBucket === "archive_ready") return "Use as a strong demo reference.";
  if (riskFlags.includes("stale")) return "Check recent activity and follow up.";
  return "Continue normal capstone monitoring.";
}

function responseFilters(filters: DirectoryFilters) {
  return {
    search: filters.search,
    programId: filters.programId,
    cohortId: filters.cohortId,
    status: filters.status,
    progressStatus: filters.progressStatus,
    evidenceStatus: filters.evidenceStatus,
    reviewStatus: filters.reviewStatus,
    noMentor: filters.noMentor,
    risk: filters.risk,
    story: filters.story,
    presentationStatus: filters.presentationStatus,
    archiveStatus: filters.archiveStatus,
    limit: filters.limit,
    offset: filters.offset,
  };
}

function safeFilterSummary(filters: DirectoryFilters) {
  return {
    searchPresent: Boolean(filters.search),
    searchLength: filters.search.length,
    programId: filters.programId,
    cohortId: filters.cohortId,
    status: filters.status,
    progressStatus: filters.progressStatus,
    evidenceStatus: filters.evidenceStatus,
    reviewStatus: filters.reviewStatus,
    noMentor: filters.noMentor,
    risk: filters.risk,
    story: filters.story,
    presentationStatus: filters.presentationStatus,
    archiveStatus: filters.archiveStatus,
    limit: filters.limit,
    offset: filters.offset,
  };
}

function cohortOptions(rows: ReturnType<typeof studentResponse>[]) {
  const entries = new Map<string, { cohortId: string; cohortName: string; studentCount: number }>();
  for (const row of rows) {
    const cohortId = String(row.cohortId || "").trim();
    if (!cohortId) continue;
    const current = entries.get(cohortId);
    if (current) {
      current.studentCount += 1;
      continue;
    }
    entries.set(cohortId, {
      cohortId,
      cohortName: String(row.cohortName || "").trim() || cohortId,
      studentCount: 1,
    });
  }
  return Array.from(entries.values()).sort((left, right) => left.cohortName.localeCompare(right.cohortName));
}

function canonical(value: string | null, allowed: string[], defaultValue = ""): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return defaultValue;
  return allowed.includes(normalized) ? normalized : defaultValue;
}

function parseBoolean(value: string | null): boolean {
  return ["1", "true", "yes"].includes(String(value || "").trim().toLowerCase());
}

function clampNumber(value: string | null, defaultValue: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, min), max);
}

function cleanSearch(value: string | null): string {
  return String(value || "").replace(/[^\p{L}\p{N}\s@._'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

async function auditStudentDirectory(
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
      entityType: "site_student_directory",
      entityId: cleanId(String(metadata.siteId || metadata.requestedSiteId || "")) || null,
      request,
      metadata: {
        ...metadata,
        actorRoleScopes: context ? safeRoleScopes(context.roles) : [],
      },
    });
  } catch {
    // Directory reads should not fail solely because audit storage is unavailable.
  }
}

function safeRoleScopes(assignments: RoleAssignment[]) {
  return assignments.map((assignment) => ({
    roleId: assignment.role_id,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id || "",
  }));
}
