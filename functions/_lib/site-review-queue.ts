import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "./auth.ts";
import { json } from "./http.ts";
import {
  cleanId,
  isReadOnlyViewer,
  resolveSiteSelection,
  type SiteScopeContext,
} from "./site-scope.ts";
import {
  canManageSecurity,
  canManageUsers,
  canViewReviewQueue,
  getMentorAssignedStudentIds,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "./permissions.ts";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const REVIEW_STATUS_VALUES = ["submitted", "revision_requested", "approved"];
const CANONICAL_STORY_VALUES = ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"];
const RISK_VALUES = ["any", "high", "medium", "low", "stale", "no_mentor"];
const EVIDENCE_STATUS_VALUES = ["attached", "missing"];

interface CountRow {
  count: number;
}

interface SummaryRow {
  submitted: number;
  revision_requested: number;
  ready_to_review: number;
  overdue_or_stale: number;
  evidence_attached: number;
  evidence_missing: number;
  high_risk: number;
  no_mentor: number;
}

interface ProgramOptionRow {
  program_id: string;
  program_name: string;
  queue_count: number;
}

interface QueueRow {
  submission_id: string;
  project_id: string | null;
  project_name: string | null;
  project_member_count: number;
  project_member_names: string | null;
  student_id: string;
  student_name: string;
  site_id: string;
  site_name: string;
  program_id: string | null;
  program_name: string | null;
  cohort_id: string | null;
  cohort_name: string | null;
  requirement_id: string | null;
  requirement_title: string | null;
  status: string;
  version: number;
  submitted_at: string | null;
  updated_at: string;
  evidence_count: number;
  written_response_length: number;
  written_response_text: string | null;
  review_count: number;
  comment_count: number;
  story_bucket: string;
  has_active_mentor: number;
  stale_flag: number;
  risk_score: number;
}

interface ReviewQueueFilters {
  status: string;
  programId: string;
  search: string;
  story: string;
  risk: string;
  evidenceStatus: string;
  limit: number;
  offset: number;
}

interface FilterWhere {
  sql: string;
  binds: Array<string | number>;
}

type AuditContext = SiteScopeContext;

export async function handleSiteReviewQueueRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const url = new URL(request.url);
  const rawRequestedSiteId = url.searchParams.get("siteId");
  const requestedSiteId = cleanId(rawRequestedSiteId);
  const invalidRequestedSiteId = rawRequestedSiteId !== null && !requestedSiteId;
  const filters = parseFilters(url.searchParams);
  const user = await getCurrentUser(request, env);

  if (!user) {
    await auditReviewQueue(env, request, null, null, "review_queue_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!canUseSiteReviewQueueRole(context.roleIds)) {
    await auditReviewQueue(env, request, user, context, "review_queue_denied", {
      reason: "role_not_allowed_for_site_review_queue",
      requestedSiteId,
      role: context.primaryRole,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (invalidRequestedSiteId) {
    await auditReviewQueue(env, request, user, context, "review_queue_denied", {
      reason: "invalid_site_id",
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }

  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canViewReviewQueue(env, user, siteId),
    defaultSiteRoleIds: ["platform_admin", "global_admin", "admin", "program_teacher", "mentor"],
  });

  if (selection.kind === "denied") {
    await auditReviewQueue(env, request, user, context, "review_queue_denied", {
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
    await auditReviewQueue(env, request, user, context, "review_queue_denied", {
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
  const mentorStudentIds = context.roleIds.includes("mentor")
    ? await getMentorAssignedStudentIds(env, user)
    : null;
  if (teacherScope && !teacherScope.valid) {
    await auditReviewQueue(env, request, user, context, "review_queue_denied", {
      reason: "invalid_program_teacher_scope",
      siteId: site.id,
      invalidScopeCount: teacherScope.invalidScopeCount,
    });
    return json({ error: "forbidden", reason: "invalid_program_teacher_scope" }, { status: 403 });
  }

  const reviewStudentIds = teacherScope?.valid ? teacherScope.studentIds : mentorStudentIds;
  const canReview = Boolean(teacherScope?.valid || mentorStudentIds);
  const readOnly = isReadOnlyViewer(context.roleIds) || !canReview;
  const scopeSql = buildQueueScopeSql(site.id, reviewStudentIds || null);
  const baseWhere = defaultQueueWhere();
  const filterWhere = buildFilterWhere(filters);
  const [total, filteredTotal] = await Promise.all([
    countQueue(env, scopeSql, baseWhere),
    countQueue(env, scopeSql, filterWhere),
  ]);
  const [summary, queue, programs, permissions] = await Promise.all([
    loadSummary(env, scopeSql, baseWhere),
    loadQueue(env, scopeSql, filterWhere, filters.limit, filters.offset),
    loadProgramOptions(env, scopeSql, baseWhere),
    loadPermissions(env, user, site.id, readOnly, canReview),
  ]);

  await auditReviewQueue(env, request, user, context, "review_queue_viewed", {
    tenantId: site.tenant_id,
    siteId: site.id,
    filters: safeFilterSummary(filters),
    returned: queue.length,
    filteredTotal,
    role: context.primaryRole,
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
      accessibleSites: teacherScope
        ? selection.accessibleSites.filter((accessibleSite) => accessibleSite.siteId === site.id)
        : selection.accessibleSites,
    },
    filters: responseFilters(filters),
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      returned: queue.length,
      total,
      filteredTotal,
    },
    summary,
    queue: queue.map(queueResponse),
    filterOptions: {
      programs: programs.map((row) => ({
        programId: row.program_id,
        programName: row.program_name,
        queueCount: Number(row.queue_count || 0),
      })),
      statuses: REVIEW_STATUS_VALUES,
      storyBuckets: CANONICAL_STORY_VALUES,
      risks: RISK_VALUES,
      evidenceStatuses: EVIDENCE_STATUS_VALUES,
    },
    permissions,
    emptyState: filteredTotal === 0 ? {
      reason: "No submitted or revision-requested work matches the current review filters.",
      owner: "Assigned review staff.",
      nextAction: "Clear or adjust filters to return to submitted work this view can access.",
    } : null,
  });
}

function canUseSiteReviewQueueRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "global_admin"
    || roleId === "admin"
    || roleId === "site_admin"
    || roleId === "program_teacher"
    || roleId === "mentor"
  ));
}

async function loadPermissions(env: Env, user: UserAccount, siteId: string, readOnly: boolean, canReview: boolean) {
  const [canViewQueue, canManageUsersPermission, canManageSecurityPermission] = await Promise.all([
    canViewReviewQueue(env, user, siteId),
    canManageUsers(env, user),
    canManageSecurity(env, user),
  ]);

  const mutationAllowed = canReview && !readOnly;
  return {
    canReview: mutationAllowed,
    canApprove: mutationAllowed,
    canRequestRevision: mutationAllowed,
    canCommentOnly: mutationAllowed,
    canViewStudentDetail: canViewQueue,
    canViewStudentEvidence: canViewQueue,
    canManageUsers: false && canManageUsersPermission,
    canManageSecurity: false && canManageSecurityPermission,
  };
}

function buildQueueScopeSql(siteId: string, scopedStudentIds: string[] | null) {
  const submissionScopeClause = scopedStudentIds
    ? scopedStudentIds.length
      ? `AND (
          scoped_students.student_id IN (SELECT value FROM json_each(?))
          OR submissions.project_id IN (
            SELECT project_members.project_id
            FROM project_members
            WHERE project_members.student_user_id IN (SELECT value FROM json_each(?))
              AND project_members.active = 1
          )
        )`
      : "AND 1 = 0"
    : "";
  const binds = scopedStudentIds
    ? scopedStudentIds.length
      ? [siteId, JSON.stringify(scopedStudentIds), JSON.stringify(scopedStudentIds)]
      : [siteId]
    : [siteId];
  return {
    binds,
    sql: `
      WITH scoped_students AS (
        SELECT DISTINCT
          student.id AS student_id,
          student.display_name,
          student.email,
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
      ),
      queue_rows AS (
        SELECT
          submissions.id AS submission_id,
          submissions.project_id,
          projects.name AS project_name,
          COALESCE((
            SELECT COUNT(*)
            FROM project_members
            WHERE project_members.project_id = submissions.project_id
              AND project_members.active = 1
          ), 1) AS project_member_count,
          COALESCE((
            SELECT GROUP_CONCAT(member.display_name, ', ')
            FROM project_members
            JOIN user_accounts member ON member.id = project_members.student_user_id
            WHERE project_members.project_id = submissions.project_id
              AND project_members.active = 1
          ), scoped_students.display_name) AS project_member_names,
          scoped_students.student_id,
          scoped_students.display_name AS student_name,
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
          requirements.id AS requirement_id,
          requirements.title AS requirement_title,
          submissions.status,
          submissions.version,
          submissions.submitted_at,
          submissions.updated_at,
          (
            SELECT COUNT(*)
            FROM evidence_artifacts
            WHERE evidence_artifacts.submission_id = submissions.id
             AND evidence_artifacts.deleted_at IS NULL
             AND evidence_artifacts.review_status != 'archived'
          ) AS evidence_count,
          COALESCE((
            SELECT LENGTH(TRIM(student_work_responses.response_text))
            FROM student_work_responses
            WHERE student_work_responses.submission_id = submissions.id
            LIMIT 1
          ), 0) AS written_response_length,
          (
            SELECT student_work_responses.response_text
            FROM student_work_responses
            WHERE student_work_responses.submission_id = submissions.id
            LIMIT 1
          ) AS written_response_text,
          (
            SELECT COUNT(*)
            FROM reviews
            WHERE reviews.submission_id = submissions.id
          ) AS review_count,
          (
            SELECT COUNT(*)
            FROM comments
            WHERE comments.entity_type = 'submission'
             AND comments.entity_id = submissions.id
             AND comments.deleted_at IS NULL
          ) AS comment_count,
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
          CASE WHEN EXISTS (
            SELECT 1
            FROM project_mentor_assignments
            WHERE project_mentor_assignments.project_id = submissions.project_id
              AND project_mentor_assignments.active = 1
          ) OR EXISTS (
            SELECT 1 FROM mentor_assignments
            WHERE mentor_assignments.student_user_id = scoped_students.student_id
              AND mentor_assignments.active = 1
          ) THEN 1 ELSE 0 END AS has_active_mentor,
          CASE
            WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 1
            WHEN julianday('now') - julianday(COALESCE(submissions.updated_at, 'now')) > 14 THEN 1
            ELSE 0
          END AS stale_flag,
          (
            CASE WHEN NOT EXISTS (
              SELECT 1 FROM project_mentor_assignments
              WHERE project_mentor_assignments.project_id = submissions.project_id
                AND project_mentor_assignments.active = 1
            ) AND NOT EXISTS (
              SELECT 1 FROM mentor_assignments
              WHERE mentor_assignments.student_user_id = scoped_students.student_id
                AND mentor_assignments.active = 1
            ) THEN 4 ELSE 0 END
            + CASE WHEN submissions.status = 'revision_requested' THEN 3 ELSE 0 END
            + CASE WHEN submissions.status = 'submitted' THEN 2 ELSE 0 END
            + CASE WHEN NOT EXISTS (
              SELECT 1 FROM evidence_artifacts
              WHERE evidence_artifacts.submission_id = submissions.id
               AND evidence_artifacts.deleted_at IS NULL
               AND evidence_artifacts.review_status != 'archived'
            ) AND NOT EXISTS (
              SELECT 1 FROM student_work_responses
              WHERE student_work_responses.submission_id = submissions.id
               AND LENGTH(TRIM(student_work_responses.response_text)) > 0
            ) THEN 2 ELSE 0 END
            + CASE WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 2 ELSE 0 END
            + CASE WHEN julianday('now') - julianday(COALESCE(submissions.updated_at, 'now')) > 14 THEN 1 ELSE 0 END
          ) AS risk_score
        FROM submissions
        JOIN scoped_students ON scoped_students.student_id = submissions.student_id
        LEFT JOIN projects ON projects.id = submissions.project_id
        LEFT JOIN requirements ON requirements.id = submissions.requirement_id
        WHERE 1 = 1
        ${submissionScopeClause}
      )
    `,
  };
}

async function countQueue(env: Env, scopeSql: ReturnType<typeof buildQueueScopeSql>, filterWhere: FilterWhere): Promise<number> {
  const row = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT COUNT(*) AS count
     FROM queue_rows
     ${filterWhere.sql}`,
  ).bind(...scopeSql.binds, ...filterWhere.binds).first<CountRow>();
  return Number(row?.count || 0);
}

async function loadSummary(env: Env, scopeSql: ReturnType<typeof buildQueueScopeSql>, filterWhere: FilterWhere) {
  const row = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT
       SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
       SUM(CASE WHEN status = 'revision_requested' THEN 1 ELSE 0 END) AS revision_requested,
       SUM(CASE WHEN status = 'submitted' AND (evidence_count > 0 OR written_response_length > 0) THEN 1 ELSE 0 END) AS ready_to_review,
       SUM(CASE WHEN stale_flag = 1 THEN 1 ELSE 0 END) AS overdue_or_stale,
       SUM(CASE WHEN evidence_count > 0 OR written_response_length > 0 THEN 1 ELSE 0 END) AS evidence_attached,
       SUM(CASE WHEN evidence_count = 0 AND written_response_length = 0 THEN 1 ELSE 0 END) AS evidence_missing,
       SUM(CASE WHEN risk_score >= 7 THEN 1 ELSE 0 END) AS high_risk,
       SUM(CASE WHEN has_active_mentor = 0 THEN 1 ELSE 0 END) AS no_mentor
     FROM queue_rows
     ${filterWhere.sql}`,
  ).bind(...scopeSql.binds, ...filterWhere.binds).first<SummaryRow>();

  return {
    submitted: Number(row?.submitted || 0),
    revisionRequested: Number(row?.revision_requested || 0),
    readyToReview: Number(row?.ready_to_review || 0),
    overdueOrStale: Number(row?.overdue_or_stale || 0),
    evidenceAttached: Number(row?.evidence_attached || 0),
    evidenceMissing: Number(row?.evidence_missing || 0),
    highRisk: Number(row?.high_risk || 0),
    noMentor: Number(row?.no_mentor || 0),
  };
}

async function loadQueue(
  env: Env,
  scopeSql: ReturnType<typeof buildQueueScopeSql>,
  filterWhere: FilterWhere,
  limit: number,
  offset: number,
): Promise<QueueRow[]> {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT *
     FROM queue_rows
     ${filterWhere.sql}
     ORDER BY
       CASE WHEN status = 'submitted' THEN 0 ELSE 1 END ASC,
       updated_at DESC,
       student_name ASC,
       submission_id ASC
     LIMIT ? OFFSET ?`,
  ).bind(...scopeSql.binds, ...filterWhere.binds, limit, offset).all<QueueRow>();
  return rows.results || [];
}

async function loadProgramOptions(
  env: Env,
  scopeSql: ReturnType<typeof buildQueueScopeSql>,
  filterWhere: FilterWhere,
): Promise<ProgramOptionRow[]> {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT
       COALESCE(program_id, 'unassigned') AS program_id,
       COALESCE(program_name, 'Unassigned') AS program_name,
       COUNT(*) AS queue_count
     FROM queue_rows
     ${filterWhere.sql}
     GROUP BY COALESCE(program_id, 'unassigned'), COALESCE(program_name, 'Unassigned')
     ORDER BY program_name ASC`,
  ).bind(...scopeSql.binds, ...filterWhere.binds).all<ProgramOptionRow>();
  return rows.results || [];
}

function defaultQueueWhere(): FilterWhere {
  return {
    sql: "WHERE status IN ('submitted', 'revision_requested')",
    binds: [],
  };
}

function parseFilters(params: URLSearchParams): ReviewQueueFilters {
  return {
    status: canonical(params.get("status"), REVIEW_STATUS_VALUES),
    programId: cleanId(params.get("programId")),
    search: cleanSearch(params.get("search")),
    story: canonical(params.get("story"), CANONICAL_STORY_VALUES),
    risk: canonical(params.get("risk"), RISK_VALUES, "any"),
    evidenceStatus: canonical(params.get("evidenceStatus"), EVIDENCE_STATUS_VALUES),
    limit: clampNumber(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: clampNumber(params.get("offset"), 0, 0, 100000),
  };
}

function buildFilterWhere(filters: ReviewQueueFilters): FilterWhere {
  const clauses: string[] = [];
  const binds: Array<string | number> = [];

  if (filters.status) {
    clauses.push("status = ?");
    binds.push(filters.status);
  } else {
    clauses.push("status IN ('submitted', 'revision_requested')");
  }

  if (filters.programId) {
    clauses.push("program_id = ?");
    binds.push(filters.programId);
  }

  if (filters.search) {
    const like = `%${escapeLike(filters.search.toLowerCase())}%`;
    clauses.push(`(
      lower(student_name) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(requirement_title, '')) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(program_name, '')) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(project_name, '')) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(project_member_names, '')) LIKE ? ESCAPE '\\'
    )`);
    binds.push(like, like, like, like, like);
  }

  if (filters.story) {
    clauses.push("story_bucket = ?");
    binds.push(filters.story);
  }

  if (filters.risk && filters.risk !== "any") {
    if (filters.risk === "high") clauses.push("risk_score >= 7");
    if (filters.risk === "medium") clauses.push("risk_score BETWEEN 4 AND 6");
    if (filters.risk === "low") clauses.push("risk_score BETWEEN 1 AND 3");
    if (filters.risk === "stale") clauses.push("stale_flag = 1");
    if (filters.risk === "no_mentor") clauses.push("has_active_mentor = 0");
  }

  if (filters.evidenceStatus === "attached") {
    clauses.push("(evidence_count > 0 OR written_response_length > 0)");
  }
  if (filters.evidenceStatus === "missing") {
    clauses.push("(evidence_count = 0 AND written_response_length = 0)");
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    binds,
  };
}

function queueResponse(row: QueueRow) {
  const riskFlags = riskFlagsFor(row);
  const evidenceCount = Number(row.evidence_count || 0);
  const writtenResponseLength = Number(row.written_response_length || 0);
  const decisionAvailability = decisionAvailabilityForQueue(row.status, evidenceCount, writtenResponseLength);
  return {
    submissionId: row.submission_id,
    projectId: row.project_id || "",
    projectName: row.project_name || `${row.student_name} Project`,
    projectMemberCount: Number(row.project_member_count || 1),
    projectMemberNames: String(row.project_member_names || row.student_name),
    studentId: row.student_id,
    studentName: row.student_name,
    siteId: row.site_id,
    siteName: row.site_name,
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    cohortId: row.cohort_id || "",
    cohortName: row.cohort_name || "",
    requirementId: row.requirement_id || "",
    requirementTitle: row.requirement_title || "Capstone Project submission",
    status: row.status,
    version: Number(row.version || 0),
    submittedAt: row.submitted_at || "",
    updatedAt: row.updated_at || "",
    evidenceCount,
    writtenResponseLength,
    hasWrittenResponse: writtenResponseLength > 0,
    writtenResponseText: writtenResponseLength > 0 ? String(row.written_response_text || "") : "",
    reviewCount: Number(row.review_count || 0),
    commentCount: Number(row.comment_count || 0),
    storyBucket: row.story_bucket || "",
    riskScore: Number(row.risk_score || 0),
    riskFlags,
    decisionState: decisionAvailability.state,
    approvalBlockedReason: decisionAvailability.approvalBlockedReason,
    availableDecisions: decisionAvailability.availableDecisions,
    decisionGuidance: decisionAvailability.guidance,
    nextAction: nextActionForQueue(row.status, evidenceCount, writtenResponseLength, riskFlags),
  };
}

function riskFlagsFor(row: QueueRow): string[] {
  const flags: string[] = [];
  if (Number(row.has_active_mentor || 0) === 0) flags.push("no_mentor");
  if (row.status === "revision_requested") flags.push("revision_requested");
  if (row.status === "submitted") flags.push("awaiting_review");
  if (Number(row.evidence_count || 0) === 0 && Number(row.written_response_length || 0) === 0) flags.push("missing_evidence");
  if (Number(row.stale_flag || 0) === 1) flags.push("stale");
  if (Number(row.risk_score || 0) >= 7) flags.push("high");
  return flags;
}

function nextActionForQueue(status: string, evidenceCount: number, writtenResponseLength: number, riskFlags: string[]): string {
  if (status === "submitted" && (evidenceCount > 0 || writtenResponseLength > 0)) return "Read the student's work, then accept it or ask for changes.";
  if (status === "submitted") return "Ask the student to add their work before accepting it.";
  if (status === "revision_requested") return "Wait for student revision before recording another decision.";
  if (riskFlags.includes("high")) return "Prioritize teacher follow-up.";
  return "Review status and student detail context.";
}

function decisionAvailabilityForQueue(status: string, evidenceCount: number, writtenResponseLength: number) {
  if (status === "submitted" && (evidenceCount > 0 || writtenResponseLength > 0)) {
    return {
      state: "decision-ready",
      approvalBlockedReason: "",
      availableDecisions: {
        approved: true,
        revision_requested: true,
        comment_only: true,
      },
      guidance: "Read the work, then accept it or ask for changes.",
    };
  }
  if (status === "submitted") {
    return {
      state: "proof-missing",
      approvalBlockedReason: "missing_evidence",
      availableDecisions: {
        approved: false,
        revision_requested: true,
        comment_only: true,
      },
      guidance: "Accept is locked because no work was sent. Ask the student to add their work.",
    };
  }
  if (status === "revision_requested") {
    return {
      state: "student-revision",
      approvalBlockedReason: "not_submitted",
      availableDecisions: {
        approved: false,
        revision_requested: false,
        comment_only: false,
      },
      guidance: "Student action needed: wait for the revised submission before recording another Program Teacher decision.",
    };
  }
  return {
    state: "context",
    approvalBlockedReason: "not_in_review",
    availableDecisions: {
      approved: false,
      revision_requested: false,
      comment_only: false,
    },
    guidance: "Context only: open submitted work when a Program Teacher decision is needed.",
  };
}

function responseFilters(filters: ReviewQueueFilters) {
  return {
    status: filters.status,
    programId: filters.programId,
    search: filters.search,
    story: filters.story,
    risk: filters.risk,
    evidenceStatus: filters.evidenceStatus,
    limit: filters.limit,
    offset: filters.offset,
  };
}

function safeFilterSummary(filters: ReviewQueueFilters) {
  return {
    status: filters.status,
    programId: filters.programId,
    hasSearch: Boolean(filters.search),
    story: filters.story,
    risk: filters.risk,
    evidenceStatus: filters.evidenceStatus,
    limit: filters.limit,
    offset: filters.offset,
  };
}

async function auditReviewQueue(
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
      entityType: "site_review_queue",
      entityId: cleanId(String(metadata.siteId || metadata.requestedSiteId || "")) || null,
      request,
      metadata: {
        ...metadata,
        role: context?.primaryRole || null,
        actorRoleScopes: context ? serializeRoleScopes(context.roles) : undefined,
      },
    });
  } catch {
    // A read-only queue response should not fail only because audit storage is unavailable.
  }
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

function canonical(value: string | null, allowed: string[], fallback = ""): string {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function cleanSearch(value: string | null): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function clampNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
