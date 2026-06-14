import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "./auth.ts";
import { randomId } from "./crypto.ts";
import { json, requirePost } from "./http.ts";
import {
  cleanId,
  isReadOnlyViewer,
  resolveSiteSelection,
  type SiteScopeContext,
  type SiteRow,
} from "./site-scope.ts";
import {
  canManageMentorAssignments,
  canViewMentorAssignments,
  canViewSiteStudentDetail,
  canViewStudentDirectory,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "./permissions.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const STATUS_VALUES = ["active", "unassigned", "all"];
const RISK_VALUES = ["any", "high", "medium", "low", "stale", "no_mentor"];
const STORY_VALUES = ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"];
const OVERLOADED_ASSIGNMENT_COUNT = 12;

interface CountRow {
  count: number;
}

interface SummaryRow {
  students_total: number;
  students_with_active_mentor: number;
  students_without_active_mentor: number;
  active_mentors: number;
  overloaded_mentors: number;
  active_assignments: number;
}

interface MentorRow {
  mentor_user_id: string;
  mentor_name: string;
  email: string;
  site_id: string;
  site_name: string;
  active_assignment_count: number;
}

interface AssignmentStudentRow {
  student_id: string;
  display_name: string;
  email: string;
  site_id: string;
  site_name: string;
  program_id: string | null;
  program_name: string | null;
  cohort_id: string | null;
  cohort_name: string | null;
  assignment_id: string | null;
  mentor_user_id: string | null;
  mentor_name: string | null;
  assignment_active: number | null;
  assigned_at: string | null;
  latest_submission_status: string | null;
  latest_submission_updated_at: string | null;
  story_bucket: string;
  has_active_mentor: number;
  stale_flag: number;
  risk_score: number;
}

interface AssignmentRow {
  assignment_id: string;
  student_id: string;
  student_name: string;
  mentor_user_id: string;
  mentor_name: string;
  program_id: string | null;
  program_name: string | null;
  active: number;
  assigned_at: string;
}

interface AssignmentFilters {
  programId: string;
  mentorUserId: string;
  studentSearch: string;
  status: string;
  noMentor: boolean;
  limit: number;
  offset: number;
}

interface FilterWhere {
  sql: string;
  binds: Array<string | number>;
}

type AuditContext = SiteScopeContext;

export async function handleSiteMentorAssignmentsGet({
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
    await auditMentorAssignments(env, request, null, null, "site_mentor_assignments_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!canUseMentorAssignmentRole(context.roleIds)) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "role_not_allowed_for_site_mentor_assignments",
      requestedSiteId,
      role: context.primaryRole,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (invalidRequestedSiteId) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "invalid_site_id",
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }

  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canViewMentorAssignments(env, user, siteId),
    defaultSiteRoleIds: ["platform_admin", "global_admin", "admin", "org_admin", "administration", "program_teacher"],
  });

  if (selection.kind === "denied") {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
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
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
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

  const payload = await buildMentorAssignmentPayload({
    env,
    request,
    user,
    context,
    site: selection.site,
    accessibleSites: selection.accessibleSites,
    selectionMode: selection.selectionMode,
    filters,
  });

  await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_viewed", {
    tenantId: selection.site.tenant_id,
    siteId: selection.site.id,
    filters: safeFilterSummary(filters),
    returned: payload.pagination.returned,
    filteredTotal: payload.pagination.filteredTotal,
    role: context.primaryRole,
  });

  return json(payload);
}

export async function handleSiteMentorAssignmentsPost({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditMentorAssignments(env, request, null, null, "site_mentor_assignments_unauthorized", {
      reason: "missing_session",
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!canUseMentorAssignmentRole(context.roleIds)) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "role_not_allowed_for_site_mentor_assignments",
      role: context.primaryRole,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  let body: { siteId?: string; studentId?: string; mentorUserId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json", ok: false }, { status: 400 });
  }

  const url = new URL(request.url);
  const rawSiteId = body.siteId || url.searchParams.get("siteId") || null;
  const requestedSiteId = cleanId(rawSiteId);
  const studentId = cleanId(body.studentId || null);
  const mentorUserId = cleanId(body.mentorUserId || null);
  const reason = cleanReason(body.reason || "");

  if (rawSiteId !== null && !requestedSiteId) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "invalid_site_id",
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }
  if (!studentId || !mentorUserId) {
    return json({ error: "missing_assignment_target", ok: false }, { status: 400 });
  }
  if (!reason) {
    return json({ error: "reason_required", ok: false }, { status: 400 });
  }

  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canManageMentorAssignments(env, user, siteId),
    defaultSiteRoleIds: ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration", "program_teacher"],
  });

  if (selection.kind === "denied") {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: selection.reason,
      requestedSiteId,
      studentId,
      mentorUserId,
      accessibleSiteCount: selection.accessibleSites.length,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (selection.kind === "selectionRequired") {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "site_selection_required",
      studentId,
      mentorUserId,
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
  if (!await canManageMentorAssignments(env, user, site.id)) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "missing_manage_permission",
      siteId: site.id,
      studentId,
      mentorUserId,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const [student, mentor] = await Promise.all([
    loadActiveSiteStudent(env, site.id, studentId),
    loadActiveSiteMentor(env, site.id, mentorUserId),
  ]);

  if (!student || !mentor) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignments_denied", {
      reason: "assignment_target_not_in_selected_site",
      siteId: site.id,
      studentId,
      mentorUserId,
    });
    return json({ error: "not_found", ok: false }, { status: 404 });
  }

  const duplicate = await activeAssignmentForStudent(env, site.id, studentId);
  if (duplicate) {
    await auditMentorAssignments(env, request, user, context, "site_mentor_assignment_conflict", {
      tenantId: site.tenant_id,
      siteId: site.id,
      studentId,
      mentorUserId,
      assignmentId: duplicate.assignment_id,
      action: "assign",
      reason: "student_already_has_active_mentor",
    });
    return json({ error: "active_assignment_exists", ok: false }, { status: 409 });
  }

  const existingPair = await env.DB.prepare(
    `SELECT id
     FROM mentor_assignments
     WHERE mentor_user_id = ?
      AND student_user_id = ?
     LIMIT 1`,
  ).bind(mentorUserId, studentId).first<{ id: string }>();

  const assignmentId = existingPair?.id || randomId("site_mentor_assignment");
  if (existingPair) {
    await env.DB.prepare(
      `UPDATE mentor_assignments
       SET active = 1,
           assigned_by = ?
       WHERE id = ?`,
    ).bind(user.id, assignmentId).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
       VALUES (?, ?, ?, ?, 1)`,
    ).bind(assignmentId, mentorUserId, studentId, user.id).run();
  }

  const assignment = await loadAssignmentById(env, site.id, assignmentId);
  if (!assignment) {
    return json({ error: "assignment_write_failed", ok: false }, { status: 500 });
  }

  await auditMentorAssignments(env, request, user, context, "site_mentor_assignment_created", {
    tenantId: site.tenant_id,
    siteId: site.id,
    studentId,
    mentorUserId,
    assignmentId,
    action: existingPair ? "reactivate" : "assign",
    role: context.primaryRole,
    reasonSummary: reasonSummary(reason),
  });

  const summary = await loadSummary(env, buildScopeSql(site.id, null));
  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    assignment: assignmentResponse(assignment),
    summary,
  });
}

function canUseMentorAssignmentRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "admin"
    || roleId === "global_admin"
    || roleId === "org_admin"
    || roleId === "site_admin"
    || roleId === "administration"
    || roleId === "program_teacher"
  ));
}

async function buildMentorAssignmentPayload({
  env,
  user,
  context,
  site,
  accessibleSites,
  selectionMode,
  filters,
}: {
  env: Env;
  request: Request;
  user: UserAccount;
  context: SiteScopeContext;
  site: SiteRow;
  accessibleSites: Array<{ tenantId: string; tenantName: string; siteId: string; siteName: string; schoolYear: string }>;
  selectionMode: string;
  filters: AssignmentFilters;
}) {
  const teacherScope = context.roleIds.includes("program_teacher")
    ? await getProgramTeacherScopedStudentIds(env, user)
    : null;
  if (teacherScope && !teacherScope.valid) {
    return {
      ok: false,
      error: "invalid_program_teacher_scope",
      generatedAt: new Date().toISOString(),
      scope: scopeResponse(site, context, true, selectionMode, accessibleSites),
      filters: responseFilters(filters, site.id),
      pagination: { limit: filters.limit, offset: filters.offset, returned: 0, total: 0, filteredTotal: 0 },
      summary: emptySummary(),
      mentors: [],
      unassignedStudents: [],
      assignments: [],
      permissions: emptyPermissions(),
    };
  }

  const programTeacherScoped = Boolean(teacherScope);
  const readOnly = isReadOnlyViewer(context.roleIds);
  const scopeSql = buildScopeSql(site.id, teacherScope ? teacherScope.studentIds : null);
  const filterWhere = buildFilterWhere(filters);
  const [total, filteredTotal] = await Promise.all([
    countStudents(env, scopeSql, emptyFilterWhere()),
    countStudents(env, scopeSql, filterWhere),
  ]);
  const [summary, mentors, page, permissions] = await Promise.all([
    loadSummary(env, scopeSql),
    loadMentors(env, scopeSql, site.id),
    loadStudentPage(env, scopeSql, filterWhere, filters.limit, filters.offset),
    loadPermissions(env, user, site.id, readOnly, programTeacherScoped),
  ]);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    scope: {
      ...scopeResponse(site, context, readOnly, selectionMode, programTeacherScoped
        ? accessibleSites.filter((accessibleSite) => accessibleSite.siteId === site.id)
        : accessibleSites),
      studentScope: programTeacherScoped ? "program_teacher" : "site",
    },
    filters: responseFilters(filters, site.id),
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      returned: page.length,
      total,
      filteredTotal,
    },
    summary,
    mentors: mentors.map(mentorResponse),
    unassignedStudents: page.filter((row) => Number(row.has_active_mentor || 0) === 0).map(unassignedStudentResponse),
    assignments: page.filter((row) => row.assignment_id).map(assignmentStudentResponse),
    filterOptions: {
      programs: await loadProgramOptions(env, scopeSql),
      mentors: mentors.map((row) => ({
        mentorUserId: row.mentor_user_id,
        mentorName: row.mentor_name,
        activeAssignmentCount: Number(row.active_assignment_count || 0),
      })),
      statuses: STATUS_VALUES,
      risks: RISK_VALUES,
      storyBuckets: STORY_VALUES,
    },
    permissions,
    emptyState: filteredTotal === 0 ? {
      reason: "No mentor coverage records for this school match these filters.",
      owner: "Site administration.",
      nextAction: "Adjust filters or review missing mentor students in the student directory.",
    } : null,
  };
}

function buildScopeSql(siteId: string, scopedStudentIds: string[] | null) {
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
      student_rows AS (
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
          mentor_assignments.id AS assignment_id,
          mentor_assignments.mentor_user_id,
          mentor.display_name AS mentor_name,
          mentor_assignments.active AS assignment_active,
          mentor_assignments.created_at AS assigned_at,
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
          CASE WHEN mentor_assignments.id IS NOT NULL THEN 1 ELSE 0 END AS has_active_mentor,
          CASE
            WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 1
            WHEN julianday('now') - julianday(COALESCE((
              SELECT submissions.updated_at
              FROM submissions
              WHERE submissions.student_id = scoped_students.student_id
              ORDER BY submissions.updated_at DESC
              LIMIT 1
            ), 'now')) > 14 THEN 1
            ELSE 0
          END AS stale_flag,
          (
            CASE WHEN mentor_assignments.id IS NULL THEN 4 ELSE 0 END
            + CASE WHEN (
              SELECT submissions.status
              FROM submissions
              WHERE submissions.student_id = scoped_students.student_id
              ORDER BY submissions.updated_at DESC
              LIMIT 1
            ) = 'revision_requested' THEN 3 ELSE 0 END
            + CASE WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 2 ELSE 0 END
          ) AS risk_score
        FROM scoped_students
        LEFT JOIN mentor_assignments ON mentor_assignments.student_user_id = scoped_students.student_id
         AND mentor_assignments.active = 1
        LEFT JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
      )
    `,
  };
}

function parseFilters(params: URLSearchParams): AssignmentFilters {
  const noMentor = params.get("noMentor") === "true";
  return {
    programId: cleanId(params.get("programId")),
    mentorUserId: cleanId(params.get("mentorUserId")),
    studentSearch: cleanSearch(params.get("studentSearch")),
    status: noMentor ? "unassigned" : canonical(params.get("status"), STATUS_VALUES),
    noMentor,
    limit: clampNumber(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: clampNumber(params.get("offset"), 0, 0, 100000),
  };
}

function buildFilterWhere(filters: AssignmentFilters): FilterWhere {
  const clauses: string[] = [];
  const binds: Array<string | number> = [];

  if (filters.programId) {
    clauses.push("program_id = ?");
    binds.push(filters.programId);
  }
  if (filters.mentorUserId) {
    clauses.push("mentor_user_id = ?");
    binds.push(filters.mentorUserId);
  }
  if (filters.studentSearch) {
    const like = `%${escapeLike(filters.studentSearch.toLowerCase())}%`;
    clauses.push(`(
      lower(display_name) LIKE ? ESCAPE '\\'
      OR lower(email) LIKE ? ESCAPE '\\'
      OR lower(COALESCE(program_name, '')) LIKE ? ESCAPE '\\'
    )`);
    binds.push(like, like, like);
  }
  if (filters.status === "active") clauses.push("has_active_mentor = 1");
  if (filters.status === "unassigned" || filters.noMentor) clauses.push("has_active_mentor = 0");

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    binds,
  };
}

function emptyFilterWhere(): FilterWhere {
  return { sql: "", binds: [] };
}

async function countStudents(env: Env, scopeSql: ReturnType<typeof buildScopeSql>, filterWhere: FilterWhere): Promise<number> {
  const row = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT COUNT(*) AS count
     FROM student_rows
     ${filterWhere.sql}`,
  ).bind(...scopeSql.binds, ...filterWhere.binds).first<CountRow>();
  return Number(row?.count || 0);
}

async function loadSummary(env: Env, scopeSql: ReturnType<typeof buildScopeSql>) {
  const row = await env.DB.prepare(
    `${scopeSql.sql},
      site_mentors AS (
        SELECT DISTINCT mentor.id AS mentor_user_id
        FROM site_users
        JOIN user_accounts mentor ON mentor.id = site_users.user_id
         AND mentor.status = 'active'
        JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
         AND mentor_role.role_id = 'mentor'
        WHERE site_users.site_id = ?
         AND site_users.membership_status = 'active'
      ),
      mentor_load AS (
        SELECT
          site_mentors.mentor_user_id,
          COUNT(DISTINCT student_rows.assignment_id) AS assignment_count
        FROM site_mentors
        LEFT JOIN student_rows ON student_rows.mentor_user_id = site_mentors.mentor_user_id
        GROUP BY site_mentors.mentor_user_id
      )
     SELECT
       COUNT(DISTINCT student_rows.student_id) AS students_total,
       COUNT(DISTINCT CASE WHEN student_rows.has_active_mentor = 1 THEN student_rows.student_id END) AS students_with_active_mentor,
       COUNT(DISTINCT CASE WHEN student_rows.has_active_mentor = 0 THEN student_rows.student_id END) AS students_without_active_mentor,
       (SELECT COUNT(*) FROM site_mentors) AS active_mentors,
       (SELECT COUNT(*) FROM mentor_load WHERE assignment_count > ?) AS overloaded_mentors,
       COUNT(DISTINCT student_rows.assignment_id) AS active_assignments
     FROM student_rows`,
  ).bind(...scopeSql.binds, scopeSql.binds[0], OVERLOADED_ASSIGNMENT_COUNT).first<SummaryRow>();

  const activeMentors = Number(row?.active_mentors || 0);
  const activeAssignments = Number(row?.active_assignments || 0);
  return {
    studentsTotal: Number(row?.students_total || 0),
    studentsWithActiveMentor: Number(row?.students_with_active_mentor || 0),
    studentsWithoutActiveMentor: Number(row?.students_without_active_mentor || 0),
    activeMentors,
    overloadedMentors: Number(row?.overloaded_mentors || 0),
    averageAssignedPerMentor: activeMentors ? Number((activeAssignments / activeMentors).toFixed(1)) : 0,
  };
}

async function loadMentors(env: Env, scopeSql: ReturnType<typeof buildScopeSql>, siteId: string): Promise<MentorRow[]> {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT
       mentor.id AS mentor_user_id,
       mentor.display_name AS mentor_name,
       mentor.email,
       sites.id AS site_id,
       sites.name AS site_name,
       COUNT(DISTINCT student_rows.assignment_id) AS active_assignment_count
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     JOIN user_accounts mentor ON mentor.id = site_users.user_id
      AND mentor.status = 'active'
     JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
      AND mentor_role.role_id = 'mentor'
     LEFT JOIN student_rows ON student_rows.mentor_user_id = mentor.id
     WHERE site_users.site_id = ?
      AND site_users.membership_status = 'active'
     GROUP BY mentor.id, mentor.display_name, mentor.email, sites.id, sites.name
     ORDER BY active_assignment_count ASC, mentor.display_name ASC
     LIMIT 100`,
  ).bind(...scopeSql.binds, siteId).all<MentorRow>();
  return rows.results || [];
}

async function loadProgramOptions(env: Env, scopeSql: ReturnType<typeof buildScopeSql>) {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT
       COALESCE(program_id, 'unassigned') AS programId,
       COALESCE(program_name, 'Unassigned') AS programName,
       COUNT(*) AS studentCount
     FROM student_rows
     GROUP BY COALESCE(program_id, 'unassigned'), COALESCE(program_name, 'Unassigned')
     ORDER BY programName ASC`,
  ).bind(...scopeSql.binds).all<{ programId: string; programName: string; studentCount: number }>();
  return rows.results || [];
}

async function loadStudentPage(
  env: Env,
  scopeSql: ReturnType<typeof buildScopeSql>,
  filterWhere: FilterWhere,
  limit: number,
  offset: number,
): Promise<AssignmentStudentRow[]> {
  const rows = await env.DB.prepare(
    `${scopeSql.sql}
     SELECT *
     FROM student_rows
     ${filterWhere.sql}
     ORDER BY
       has_active_mentor ASC,
       risk_score DESC,
       display_name ASC,
       student_id ASC
     LIMIT ? OFFSET ?`,
  ).bind(...scopeSql.binds, ...filterWhere.binds, limit, offset).all<AssignmentStudentRow>();
  return rows.results || [];
}

async function loadPermissions(env: Env, user: UserAccount, siteId: string, readOnly: boolean, programTeacherScoped: boolean) {
  const [
    canManageAssignmentsPermission,
    canViewDetail,
    canViewDirectory,
  ] = await Promise.all([
    canManageMentorAssignments(env, user, siteId),
    canViewSiteStudentDetail(env, user, "", siteId),
    canViewStudentDirectory(env, user, siteId),
  ]);
  return {
    canManageMentorAssignments: readOnly ? false : canManageAssignmentsPermission,
    canViewStudentDetail: canViewDetail || canViewDirectory,
    canViewStudentDirectory: canViewDirectory,
    canManageUsers: false,
    canManageSecurity: false,
  };
}

async function loadActiveSiteStudent(env: Env, siteId: string, studentId: string) {
  return env.DB.prepare(
    `SELECT student.id, student.display_name
     FROM site_users
     JOIN user_accounts student ON student.id = site_users.user_id
      AND student.status = 'active'
     JOIN user_roles student_role ON student_role.user_id = student.id
      AND student_role.role_id = 'student'
     WHERE site_users.site_id = ?
      AND site_users.user_id = ?
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(siteId, studentId).first<{ id: string; display_name: string }>();
}

async function loadActiveSiteMentor(env: Env, siteId: string, mentorUserId: string) {
  return env.DB.prepare(
    `SELECT mentor.id, mentor.display_name
     FROM site_users
     JOIN user_accounts mentor ON mentor.id = site_users.user_id
      AND mentor.status = 'active'
     JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
      AND mentor_role.role_id = 'mentor'
     WHERE site_users.site_id = ?
      AND site_users.user_id = ?
      AND site_users.membership_status = 'active'
     LIMIT 1`,
  ).bind(siteId, mentorUserId).first<{ id: string; display_name: string }>();
}

async function activeAssignmentForStudent(env: Env, siteId: string, studentId: string): Promise<AssignmentRow | null> {
  return env.DB.prepare(
    `SELECT
       mentor_assignments.id AS assignment_id,
       mentor_assignments.student_user_id AS student_id,
       student.display_name AS student_name,
       mentor_assignments.mentor_user_id,
       mentor.display_name AS mentor_name,
       NULL AS program_id,
       NULL AS program_name,
       mentor_assignments.active,
       mentor_assignments.created_at AS assigned_at
     FROM mentor_assignments
     JOIN site_users ON site_users.user_id = mentor_assignments.student_user_id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     JOIN user_accounts student ON student.id = mentor_assignments.student_user_id
     JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
     WHERE mentor_assignments.student_user_id = ?
      AND mentor_assignments.active = 1
     LIMIT 1`,
  ).bind(siteId, studentId).first<AssignmentRow>();
}

async function loadAssignmentById(env: Env, siteId: string, assignmentId: string): Promise<AssignmentRow | null> {
  return env.DB.prepare(
    `SELECT
       mentor_assignments.id AS assignment_id,
       student.id AS student_id,
       student.display_name AS student_name,
       mentor.id AS mentor_user_id,
       mentor.display_name AS mentor_name,
       (
         SELECT programs.id
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN programs ON programs.id = groups.program_id
         WHERE group_memberships.user_id = student.id
         ORDER BY programs.name ASC
         LIMIT 1
       ) AS program_id,
       (
         SELECT programs.name
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN programs ON programs.id = groups.program_id
         WHERE group_memberships.user_id = student.id
         ORDER BY programs.name ASC
         LIMIT 1
       ) AS program_name,
       mentor_assignments.active,
       mentor_assignments.created_at AS assigned_at
     FROM mentor_assignments
     JOIN site_users student_site ON student_site.user_id = mentor_assignments.student_user_id
      AND student_site.site_id = ?
      AND student_site.membership_status = 'active'
     JOIN site_users mentor_site ON mentor_site.user_id = mentor_assignments.mentor_user_id
      AND mentor_site.site_id = student_site.site_id
      AND mentor_site.membership_status = 'active'
     JOIN user_accounts student ON student.id = mentor_assignments.student_user_id
     JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
     WHERE mentor_assignments.id = ?
     LIMIT 1`,
  ).bind(siteId, assignmentId).first<AssignmentRow>();
}

function mentorResponse(row: MentorRow) {
  const count = Number(row.active_assignment_count || 0);
  return {
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name,
    email: row.email,
    activeAssignmentCount: count,
    siteId: row.site_id,
    siteName: row.site_name,
    loadStatus: count > OVERLOADED_ASSIGNMENT_COUNT ? "overloaded" : count === 0 ? "available" : "steady",
    nextAction: count > OVERLOADED_ASSIGNMENT_COUNT
      ? "Review mentor load before assigning more students."
      : "Available for mentor support at this school.",
  };
}

function unassignedStudentResponse(row: AssignmentStudentRow) {
  const riskFlags = riskFlagsFor(row);
  return {
    studentId: row.student_id,
    displayName: row.display_name,
    email: row.email,
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    cohortId: row.cohort_id || "",
    cohortName: row.cohort_name || "",
    storyBucket: row.story_bucket || "",
    riskScore: Number(row.risk_score || 0),
    riskFlags,
    latestSubmissionStatus: row.latest_submission_status || "draft",
    nextAction: "Assign a mentor before the next follow-up checkpoint.",
  };
}

function assignmentStudentResponse(row: AssignmentStudentRow) {
  return {
    assignmentId: row.assignment_id || "",
    studentId: row.student_id,
    studentName: row.display_name,
    mentorUserId: row.mentor_user_id || "",
    mentorName: row.mentor_name || "Mentor",
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    active: Number(row.assignment_active || 0) === 1,
    assignedAt: row.assigned_at || "",
    nextAction: "Monitor mentor meeting cadence and student progress.",
  };
}

function assignmentResponse(row: AssignmentRow) {
  return {
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    studentName: row.student_name,
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name,
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    active: Number(row.active || 0) === 1,
    assignedAt: row.assigned_at,
    nextAction: "Refresh mentor coverage and confirm first support touchpoint.",
  };
}

function riskFlagsFor(row: AssignmentStudentRow): string[] {
  const flags = [];
  if (Number(row.has_active_mentor || 0) === 0) flags.push("no_mentor");
  if (row.latest_submission_status === "revision_requested") flags.push("revision_requested");
  if (Number(row.stale_flag || 0) === 1) flags.push("stale");
  if (Number(row.risk_score || 0) >= 7) flags.push("high");
  if (!flags.length) flags.push("low");
  return flags;
}

function scopeResponse(
  site: SiteRow,
  context: SiteScopeContext,
  readOnly: boolean,
  selectionMode: string,
  accessibleSites: Array<{ tenantId: string; tenantName: string; siteId: string; siteName: string; schoolYear: string }>,
) {
  return {
    tenantId: site.tenant_id,
    tenantName: site.tenant_name,
    siteId: site.id,
    siteName: site.name,
    schoolYear: site.school_year || "",
    role: context.primaryRole,
    readOnly,
    selectionMode,
    accessibleSites,
  };
}

function responseFilters(filters: AssignmentFilters, siteId: string) {
  return {
    siteId,
    programId: filters.programId,
    mentorUserId: filters.mentorUserId,
    studentSearch: filters.studentSearch,
    status: filters.status,
    noMentor: filters.noMentor,
    limit: filters.limit,
    offset: filters.offset,
  };
}

function safeFilterSummary(filters: AssignmentFilters) {
  return {
    programId: filters.programId,
    mentorUserId: filters.mentorUserId ? "[present]" : "",
    hasStudentSearch: Boolean(filters.studentSearch),
    status: filters.status,
    noMentor: filters.noMentor,
    limit: filters.limit,
    offset: filters.offset,
  };
}

function emptySummary() {
  return {
    studentsTotal: 0,
    studentsWithActiveMentor: 0,
    studentsWithoutActiveMentor: 0,
    activeMentors: 0,
    overloadedMentors: 0,
    averageAssignedPerMentor: 0,
  };
}

function emptyPermissions() {
  return {
    canManageMentorAssignments: false,
    canViewStudentDetail: false,
    canViewStudentDirectory: false,
    canManageUsers: false,
    canManageSecurity: false,
  };
}

async function auditMentorAssignments(
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
      entityType: "site_mentor_assignment",
      entityId: cleanId(String(metadata.assignmentId || metadata.siteId || metadata.requestedSiteId || "")) || null,
      request,
      metadata: {
        ...metadata,
        role: context?.primaryRole || null,
        actorRoleScopes: context ? serializeRoleScopes(context.roles) : undefined,
      },
    });
  } catch {
    // Assignment reads should not fail only because audit storage is unavailable.
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
    scopeId: assignment.scope_id || "",
  }));
}

function canonical(value: string | null, allowed: string[], fallback = ""): string {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function cleanSearch(value: string | null): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function cleanReason(value: string): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 240);
}

function reasonSummary(value: string): string {
  return cleanReason(value).slice(0, 120);
}

function clampNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
