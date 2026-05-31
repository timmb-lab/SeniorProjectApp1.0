import type { Env, RoleAssignment, RoleId, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "./auth.ts";
import { json } from "./http.ts";
import {
  cleanId,
  isReadOnlyViewer,
  loadSite,
  loadSitesByIds,
  resolveSiteSelection,
  siteResponse,
  type SiteResponse,
  type SiteRow,
  type SiteScopeContext,
} from "./site-scope.ts";
import {
  canAccessSite,
  canAddStaffNote,
  canDownloadStudentEvidence,
  canManageArchiveOperations,
  canManageMentorAssignments,
  canManagePresentationOperations,
  canManageSecurity,
  canManageUsers,
  canMutateReviewDecision,
  canViewArchiveOperations,
  canViewPresentationOperations,
  canViewReviewQueue,
  canViewSiteStudentDetail,
  canViewSiteStudentEvidence,
  getAccessibleSiteIds,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "./permissions.ts";

const DETAIL_LIMITS = {
  submissions: 5,
  evidence: 10,
  reviews: 10,
  comments: 10,
  statusHistory: 10,
  mentorAssignmentHistory: 5,
  mentorMeetings: 5,
  timelinePreview: 10,
};
const TIMELINE_DEFAULT_LIMIT = 50;
const TIMELINE_MAX_LIMIT = 100;
const TIMELINE_QUERY_WINDOW_MAX = 250;
const CANONICAL_STATUS_VALUES = ["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"];
const CANONICAL_STORY_VALUES = ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"];
const CANONICAL_PRESENTATION_VALUES = ["pending", "scheduled", "completed", "missing"];
const CANONICAL_ARCHIVE_VALUES = ["ready", "complete", "failed", "missing"];

type AuditContext = SiteScopeContext;

type DetailSiteSelection =
  | { kind: "ok"; site: SiteRow; accessibleSites: SiteResponse[]; selectionMode: string }
  | { kind: "denied"; reason: string; accessibleSites: SiteResponse[] }
  | { kind: "selectionRequired"; accessibleSites: SiteResponse[] }
  | { kind: "notFound"; accessibleSites: SiteResponse[] };

interface DetailStudentRow {
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
  mentor_assigned_at: string | null;
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

interface CountRow {
  count: number;
}

interface ProgressCountRow {
  requirements_total: number;
  requirements_complete: number;
  current_stage: string | null;
}

interface SubmissionRow {
  id: string;
  requirement_id: string | null;
  requirement_title: string | null;
  status: string;
  version: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  evidence_count: number;
}

interface EvidenceRow {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  external_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
  created_by_name: string | null;
}

interface ReviewRow {
  id: string;
  submission_id: string;
  requirement_title: string | null;
  decision: string;
  feedback: string | null;
  created_at: string;
  reviewer_name: string | null;
}

interface CommentRow {
  id: string;
  entity_type: string;
  entity_id: string;
  visibility: string;
  body: string;
  created_at: string;
  author_name: string | null;
}

interface StatusHistoryRow {
  id: string;
  entity_type: string;
  entity_id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: string;
  actor_name: string | null;
}

interface MentorMeetingRow {
  id: string;
  mentor_user_id: string;
  mentor_name: string | null;
  submission_id: string | null;
  requirement_title: string | null;
  submission_status: string | null;
  submission_version: number | null;
  status: string;
  scheduled_for: string | null;
  held_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MentorAssignmentHistoryRow {
  id: string;
  mentor_user_id: string;
  mentor_name: string | null;
  assigned_by_name: string | null;
  active: number;
  created_at: string;
}

interface PresentationRow {
  id: string;
  submission_id: string | null;
  scheduled_for: string;
  duration_minutes: number;
  location: string;
  status: string;
  outline_status: string;
  checked_out_at: string | null;
  checked_in_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ExportRow {
  id: string;
  export_type: string;
  requested_by_name: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  artifact_count: number;
}

interface VisibilityPolicy {
  mode: "admin_operational" | "viewer_read_only" | "program_teacher_scoped" | "mentor_support";
  includeStaffOnlyComments: boolean;
  includeAdminContext: boolean;
  includeFullStatusReasons: boolean;
}

interface TimelineEvent {
  id: string;
  type: string;
  occurredAt: string;
  title: string;
  summary: string;
  actorName: string;
  status: string;
  reason: string;
  owner: string;
  nextAction: string;
}

export async function handleSiteStudentDetailRequest({
  request,
  env,
  params,
}: {
  request: Request;
  env: Env;
  params?: Record<string, string | string[]>;
}): Promise<Response> {
  const url = new URL(request.url);
  const studentId = cleanId(routeParam(params, "studentId"));
  const rawRequestedSiteId = url.searchParams.get("siteId");
  const requestedSiteId = cleanId(rawRequestedSiteId);
  const invalidRequestedSiteId = rawRequestedSiteId !== null && !requestedSiteId;
  const user = await getCurrentUser(request, env);

  if (!user) {
    await auditSiteStudent(env, request, null, null, "site_student_detail_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
      studentId,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!studentId) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "invalid_student_id",
      requestedSiteId,
    });
    return genericNotFound();
  }

  if (!canUseDetailRole(context.roleIds)) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "role_not_allowed_for_site_student_detail",
      requestedSiteId,
      studentId,
      role: context.primaryRole,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (invalidRequestedSiteId) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "invalid_site_id",
      studentId,
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }

  const selection = await resolveDetailSelection({
    env,
    user,
    context,
    studentId,
    requestedSiteId,
  });

  if (selection.kind === "denied") {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: selection.reason,
      requestedSiteId,
      accessibleSiteCount: selection.accessibleSites.length,
      studentId,
    });
    return json({
      error: "forbidden",
      reason: selection.reason,
      accessibleSites: selection.accessibleSites,
    }, { status: 403 });
  }

  if (selection.kind === "selectionRequired") {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "site_selection_required",
      accessibleSiteCount: selection.accessibleSites.length,
      studentId,
    });
    return json({
      ok: false,
      error: "site_selection_required",
      selectionRequired: true,
      accessibleSites: selection.accessibleSites,
    }, { status: 409 });
  }

  if (selection.kind === "notFound") {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "student_not_in_accessible_site",
      requestedSiteId,
      studentId,
      accessibleSiteCount: selection.accessibleSites.length,
    });
    return genericNotFound();
  }

  const site = selection.site;
  const teacherScope = context.roleIds.includes("program_teacher")
    ? await getProgramTeacherScopedStudentIds(env, user)
    : null;
  if (teacherScope && !teacherScope.valid) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "invalid_program_teacher_scope",
      siteId: site.id,
      studentId,
      invalidScopeCount: teacherScope.invalidScopeCount,
    });
    return json({ error: "forbidden", reason: "invalid_program_teacher_scope" }, { status: 403 });
  }

  if (teacherScope && !teacherScope.studentIds.includes(studentId)) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "student_not_in_program_teacher_scope",
      siteId: site.id,
      studentId,
    });
    return genericNotFound();
  }

  const studentRow = await loadDetailStudent(env, site.id, studentId);
  if (!studentRow) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "student_not_in_selected_site",
      siteId: site.id,
      studentId,
    });
    return genericNotFound();
  }

  if (!await canViewSiteStudentDetail(env, user, studentId, site.id)) {
    await auditSiteStudent(env, request, user, context, "site_student_detail_denied", {
      reason: "student_scope_denied",
      siteId: site.id,
      studentId,
      role: context.primaryRole,
    });
    return genericNotFound();
  }

  const readOnly = isReadOnlyViewer(context.roleIds);
  const visibility = visibilityPolicyFor(context.roleIds);
  const [
    permissions,
    mentor,
    progress,
    submissions,
    evidence,
    reviews,
    comments,
    statusHistory,
    mentorAssignmentHistory,
    mentorMeetings,
    presentation,
    archive,
    timelinePreview,
  ] = await Promise.all([
    loadDetailPermissions(env, user, site.id, studentId, studentRow.latest_submission_id, readOnly, context.roleIds),
    loadMentorSummary(env, studentRow),
    loadProgress(env, studentId, studentRow.program_id),
    loadSubmissions(env, studentId, DETAIL_LIMITS.submissions),
    loadEvidence(env, studentId, DETAIL_LIMITS.evidence),
    loadReviews(env, studentId, DETAIL_LIMITS.reviews, visibility),
    loadComments(env, studentId, DETAIL_LIMITS.comments, visibility),
    loadStatusHistory(env, studentId, DETAIL_LIMITS.statusHistory, visibility),
    loadMentorAssignmentHistory(env, studentId, DETAIL_LIMITS.mentorAssignmentHistory, visibility),
    loadMentorMeetings(env, studentId, DETAIL_LIMITS.mentorMeetings, visibility),
    loadPresentation(env, studentId),
    loadArchive(env, studentId, studentRow.archive_status),
    loadTimelineEvents(env, studentId, visibility, { perTypeLimit: DETAIL_LIMITS.timelinePreview }),
  ]);

  const preview = timelinePreview.slice(0, DETAIL_LIMITS.timelinePreview);
  await auditSiteStudent(env, request, user, context, "site_student_detail_viewed", {
    tenantId: site.tenant_id,
    siteId: site.id,
    studentId,
    role: context.primaryRole,
    sectionsIncluded: ["student", "mentor", "progress", "submissions", "evidence", "reviews", "comments", "statusHistory", "mentorAssignmentHistory", "mentorMeetings", "presentation", "archive", "timelinePreview"],
    timelineReturnedCount: preview.length,
    limits: DETAIL_LIMITS,
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
      studentId,
      accessibleSites: teacherScope
        ? selection.accessibleSites.filter((accessibleSite) => accessibleSite.siteId === site.id)
        : selection.accessibleSites,
    },
    student: detailStudentResponse(studentRow),
    mentor,
    progress,
    submissions,
    evidence,
    reviews,
    comments,
    statusHistory,
    mentorAssignmentHistory,
    mentorMeetings,
    presentation,
    archive,
    timelinePreview: preview,
    timeline: {
      strategy: "separate_route_with_preview",
      route: `/api/site/students/${encodeURIComponent(studentId)}/timeline`,
      previewLimit: DETAIL_LIMITS.timelinePreview,
    },
    permissions,
    visibility: visibilityResponse(visibility),
    canonicalValues: {
      statuses: CANONICAL_STATUS_VALUES,
      storyBuckets: CANONICAL_STORY_VALUES,
      presentationStatuses: CANONICAL_PRESENTATION_VALUES,
      archiveStatuses: CANONICAL_ARCHIVE_VALUES,
    },
    limits: DETAIL_LIMITS,
  });
}

export async function handleSiteStudentTimelineRequest({
  request,
  env,
  params,
}: {
  request: Request;
  env: Env;
  params?: Record<string, string | string[]>;
}): Promise<Response> {
  const url = new URL(request.url);
  const studentId = cleanId(routeParam(params, "studentId"));
  const rawRequestedSiteId = url.searchParams.get("siteId");
  const requestedSiteId = cleanId(rawRequestedSiteId);
  const invalidRequestedSiteId = rawRequestedSiteId !== null && !requestedSiteId;
  const typeFilter = cleanTimelineType(url.searchParams.get("type"));
  const limit = clampNumber(url.searchParams.get("limit"), TIMELINE_DEFAULT_LIMIT, 1, TIMELINE_MAX_LIMIT);
  const offset = clampNumber(url.searchParams.get("offset"), 0, 0, 100000);
  const user = await getCurrentUser(request, env);

  if (!user) {
    await auditSiteStudent(env, request, null, null, "site_student_timeline_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
      studentId,
      limit,
      offset,
      type: typeFilter,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!studentId) {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "invalid_student_id",
      requestedSiteId,
    });
    return genericNotFound();
  }
  if (!canUseDetailRole(context.roleIds)) {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "role_not_allowed_for_site_student_timeline",
      requestedSiteId,
      studentId,
      role: context.primaryRole,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }
  if (invalidRequestedSiteId) {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "invalid_site_id",
      studentId,
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }

  const selection = await resolveDetailSelection({
    env,
    user,
    context,
    studentId,
    requestedSiteId,
  });
  if (selection.kind === "denied") {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: selection.reason,
      requestedSiteId,
      accessibleSiteCount: selection.accessibleSites.length,
      studentId,
    });
    return json({
      error: "forbidden",
      reason: selection.reason,
      accessibleSites: selection.accessibleSites,
    }, { status: 403 });
  }
  if (selection.kind === "selectionRequired") {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "site_selection_required",
      accessibleSiteCount: selection.accessibleSites.length,
      studentId,
    });
    return json({
      ok: false,
      error: "site_selection_required",
      selectionRequired: true,
      accessibleSites: selection.accessibleSites,
    }, { status: 409 });
  }
  if (selection.kind === "notFound") {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "student_not_in_accessible_site",
      requestedSiteId,
      studentId,
      accessibleSiteCount: selection.accessibleSites.length,
    });
    return genericNotFound();
  }

  const site = selection.site;
  const teacherScope = context.roleIds.includes("program_teacher")
    ? await getProgramTeacherScopedStudentIds(env, user)
    : null;
  if (teacherScope && !teacherScope.valid) {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "invalid_program_teacher_scope",
      siteId: site.id,
      studentId,
      invalidScopeCount: teacherScope.invalidScopeCount,
    });
    return json({ error: "forbidden", reason: "invalid_program_teacher_scope" }, { status: 403 });
  }
  if (teacherScope && !teacherScope.studentIds.includes(studentId)) {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "student_not_in_program_teacher_scope",
      siteId: site.id,
      studentId,
    });
    return genericNotFound();
  }
  const studentRow = await loadDetailStudent(env, site.id, studentId);
  if (!studentRow || !await canViewSiteStudentDetail(env, user, studentId, site.id)) {
    await auditSiteStudent(env, request, user, context, "site_student_timeline_denied", {
      reason: "student_scope_denied",
      siteId: site.id,
      studentId,
      role: context.primaryRole,
    });
    return genericNotFound();
  }

  const visibility = visibilityPolicyFor(context.roleIds);
  const perTypeLimit = Math.min(TIMELINE_QUERY_WINDOW_MAX, offset + limit + 1);
  const allEvents = await loadTimelineEvents(env, studentId, visibility, { perTypeLimit, typeFilter });
  const page = allEvents.slice(offset, offset + limit);

  await auditSiteStudent(env, request, user, context, "site_student_timeline_viewed", {
    tenantId: site.tenant_id,
    siteId: site.id,
    studentId,
    role: context.primaryRole,
    returned: page.length,
    limit,
    offset,
    type: typeFilter,
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
      readOnly: isReadOnlyViewer(context.roleIds),
      selectionMode: selection.selectionMode,
      studentId,
    },
    pagination: {
      limit,
      offset,
      returned: page.length,
      hasMore: allEvents.length > offset + limit,
    },
    filters: {
      type: typeFilter,
    },
    events: page,
    limits: {
      defaultLimit: TIMELINE_DEFAULT_LIMIT,
      maxLimit: TIMELINE_MAX_LIMIT,
    },
    visibility: visibilityResponse(visibility),
  });
}

function canUseDetailRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => (
    roleId === "platform_admin"
    || roleId === "global_admin"
    || roleId === "admin"
    || roleId === "org_admin"
    || roleId === "site_admin"
    || roleId === "administration"
    || roleId === "viewer"
    || roleId === "program_teacher"
    || roleId === "mentor"
    || roleId === "student"
  ));
}

async function resolveDetailSelection({
  env,
  user,
  context,
  studentId,
  requestedSiteId,
}: {
  env: Env;
  user: UserAccount;
  context: SiteScopeContext;
  studentId: string;
  requestedSiteId: string;
}): Promise<DetailSiteSelection> {
  if (requestedSiteId) {
    return resolveSiteSelection({
      env,
      user,
      context,
      requestedSiteId,
      canViewSite: (siteId) => canAccessSite(env, user, siteId),
      defaultSiteRoleIds: [],
    });
  }

  const accessibleSiteIds = await getAccessibleSiteIds(env, user);
  const accessibleSites = (await loadSitesByIds(env, accessibleSiteIds)).map(siteResponse);
  if (accessibleSites.length === 0) {
    return { kind: "denied", reason: "no_accessible_sites", accessibleSites };
  }

  const matchingSites = await loadStudentSitesWithin(env, studentId, accessibleSiteIds);
  if (matchingSites.length === 1) {
    return {
      kind: "ok",
      site: matchingSites[0],
      accessibleSites,
      selectionMode: accessibleSites.length === 1 ? "single_accessible_site" : "student_accessible_site",
    };
  }
  if (matchingSites.length > 1) {
    return { kind: "selectionRequired", accessibleSites };
  }
  return { kind: "notFound", accessibleSites };
}

async function loadStudentSitesWithin(env: Env, studentId: string, siteIds: string[]): Promise<SiteRow[]> {
  if (!studentId || !siteIds.length) return [];
  const placeholders = siteIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT
       sites.id,
       sites.tenant_id,
       tenants.name AS tenant_name,
       sites.name,
       sites.school_year
     FROM site_users
     JOIN sites ON sites.id = site_users.site_id
      AND sites.status = 'active'
     JOIN tenants ON tenants.id = sites.tenant_id
      AND tenants.status = 'active'
     JOIN user_accounts student ON student.id = site_users.user_id
      AND student.status = 'active'
     JOIN user_roles student_role ON student_role.user_id = student.id
      AND student_role.role_id = 'student'
     WHERE site_users.user_id = ?
      AND site_users.membership_status = 'active'
      AND site_users.site_id IN (${placeholders})
     ORDER BY sites.name`,
  ).bind(studentId, ...siteIds).all<SiteRow>();
  return rows.results || [];
}

async function loadDetailStudent(env: Env, siteId: string, studentId: string): Promise<DetailStudentRow | null> {
  return env.DB.prepare(
    `WITH scoped_student AS (
       SELECT DISTINCT
         student.id AS student_id,
         student.display_name,
         student.email,
         sites.id AS site_id,
         sites.name AS site_name
       FROM site_users
       JOIN user_accounts student ON student.id = site_users.user_id
        AND student.status = 'active'
       JOIN user_roles student_role ON student_role.user_id = student.id
        AND student_role.role_id = 'student'
       JOIN sites ON sites.id = site_users.site_id
        AND sites.status = 'active'
       WHERE site_users.site_id = ?
        AND site_users.user_id = ?
        AND site_users.membership_status = 'active'
     )
     SELECT
       scoped_student.student_id,
       scoped_student.display_name,
       scoped_student.email,
       scoped_student.site_id,
       scoped_student.site_name,
       (
         SELECT programs.id
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN programs ON programs.id = groups.program_id
         WHERE group_memberships.user_id = scoped_student.student_id
         ORDER BY programs.name ASC
         LIMIT 1
       ) AS program_id,
       (
         SELECT programs.name
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN programs ON programs.id = groups.program_id
         WHERE group_memberships.user_id = scoped_student.student_id
         ORDER BY programs.name ASC
         LIMIT 1
       ) AS program_name,
       (
         SELECT cohorts.id
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN cohorts ON cohorts.id = groups.cohort_id
         WHERE group_memberships.user_id = scoped_student.student_id
         ORDER BY cohorts.label ASC
         LIMIT 1
       ) AS cohort_id,
       (
         SELECT cohorts.label
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN cohorts ON cohorts.id = groups.cohort_id
         WHERE group_memberships.user_id = scoped_student.student_id
         ORDER BY cohorts.label ASC
         LIMIT 1
       ) AS cohort_name,
       (
         SELECT mentor_assignments.mentor_user_id
         FROM mentor_assignments
         WHERE mentor_assignments.student_user_id = scoped_student.student_id
          AND mentor_assignments.active = 1
         ORDER BY mentor_assignments.created_at DESC
         LIMIT 1
       ) AS mentor_user_id,
       (
         SELECT mentor.display_name
         FROM mentor_assignments
         JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
         WHERE mentor_assignments.student_user_id = scoped_student.student_id
          AND mentor_assignments.active = 1
         ORDER BY mentor_assignments.created_at DESC
         LIMIT 1
       ) AS mentor_name,
       (
         SELECT mentor_assignments.created_at
         FROM mentor_assignments
         WHERE mentor_assignments.student_user_id = scoped_student.student_id
          AND mentor_assignments.active = 1
         ORDER BY mentor_assignments.created_at DESC
         LIMIT 1
       ) AS mentor_assigned_at,
       CASE WHEN EXISTS (
         SELECT 1 FROM mentor_assignments
         WHERE mentor_assignments.student_user_id = scoped_student.student_id
          AND mentor_assignments.active = 1
       ) THEN 1 ELSE 0 END AS has_active_mentor,
       (
         SELECT submissions.id
         FROM submissions
         WHERE submissions.student_id = scoped_student.student_id
         ORDER BY submissions.updated_at DESC
         LIMIT 1
       ) AS latest_submission_id,
       (
         SELECT submissions.status
         FROM submissions
         WHERE submissions.student_id = scoped_student.student_id
         ORDER BY submissions.updated_at DESC
         LIMIT 1
       ) AS latest_submission_status,
       (
         SELECT submissions.updated_at
         FROM submissions
         WHERE submissions.student_id = scoped_student.student_id
         ORDER BY submissions.updated_at DESC
         LIMIT 1
       ) AS latest_submission_updated_at,
       (
         SELECT COUNT(*)
         FROM evidence_artifacts
         WHERE evidence_artifacts.student_id = scoped_student.student_id
          AND evidence_artifacts.deleted_at IS NULL
       ) AS evidence_count,
       (
         SELECT COUNT(*)
         FROM reviews
         JOIN submissions reviewed_submission ON reviewed_submission.id = reviews.submission_id
         WHERE reviewed_submission.student_id = scoped_student.student_id
       ) AS review_count,
       (
         SELECT COUNT(*)
         FROM comments
         WHERE comments.deleted_at IS NULL
          AND (
           (comments.entity_type = 'submission' AND comments.entity_id IN (
             SELECT submissions.id FROM submissions WHERE submissions.student_id = scoped_student.student_id
           ))
           OR (comments.entity_type = 'progress_record' AND comments.entity_id IN (
             SELECT progress_records.id FROM progress_records WHERE progress_records.student_id = scoped_student.student_id
           ))
           OR (comments.entity_type = 'evidence_artifact' AND comments.entity_id IN (
             SELECT evidence_artifacts.id FROM evidence_artifacts WHERE evidence_artifacts.student_id = scoped_student.student_id
           ))
          )
       ) AS comment_count,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM presentation_slots
           WHERE presentation_slots.student_user_id = scoped_student.student_id
            AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
            AND COALESCE(presentation_slots.outline_status, 'pending') != 'approved'
         ) THEN 'pending'
         WHEN EXISTS (
           SELECT 1 FROM presentation_slots
           WHERE presentation_slots.student_user_id = scoped_student.student_id
            AND presentation_slots.status = 'completed'
         ) THEN 'completed'
         WHEN EXISTS (
           SELECT 1 FROM presentation_slots
           WHERE presentation_slots.student_user_id = scoped_student.student_id
            AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
         ) THEN 'scheduled'
         ELSE 'missing'
       END AS presentation_status,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM exports
           WHERE exports.target_user_id = scoped_student.student_id
            AND exports.status = 'failed'
         ) THEN 'failed'
         WHEN scoped_student.display_name LIKE 'Archive Ready Demo%' THEN 'ready'
         WHEN EXISTS (
           SELECT 1 FROM exports
           WHERE exports.target_user_id = scoped_student.student_id
            AND exports.status = 'complete'
         ) THEN 'complete'
         ELSE 'missing'
       END AS archive_status,
       CASE
         WHEN scoped_student.display_name LIKE 'Model Excellent Demo%' THEN 'model_excellent'
         WHEN scoped_student.display_name LIKE 'Missing Mentor Demo%' THEN 'missing_mentor'
         WHEN scoped_student.display_name LIKE 'Awaiting Review Demo%' THEN 'awaiting_review'
         WHEN scoped_student.display_name LIKE 'Revision Loop Demo%' THEN 'revision_requested'
         WHEN scoped_student.display_name LIKE 'Presentation Pending Demo%' THEN 'presentation_pending'
         WHEN scoped_student.display_name LIKE 'Archive Ready Demo%' THEN 'archive_ready'
         WHEN scoped_student.display_name LIKE 'Archive Failed Demo%' THEN 'archive_failed'
         WHEN scoped_student.display_name LIKE 'High Risk Demo%' THEN 'high_risk'
         WHEN scoped_student.display_name LIKE 'Rich Timeline Demo%' THEN 'rich_timeline'
         ELSE ''
       END AS story_bucket,
       CASE
         WHEN scoped_student.display_name LIKE 'High Risk Demo%' THEN 1
         WHEN julianday('now') - julianday(COALESCE((
           SELECT submissions.updated_at
           FROM submissions
           WHERE submissions.student_id = scoped_student.student_id
           ORDER BY submissions.updated_at DESC
           LIMIT 1
         ), 'now')) > 21 THEN 1
         ELSE 0
       END AS stale_flag,
       (
         CASE WHEN NOT EXISTS (
           SELECT 1 FROM mentor_assignments
           WHERE mentor_assignments.student_user_id = scoped_student.student_id
            AND mentor_assignments.active = 1
         ) THEN 4 ELSE 0 END
         + CASE WHEN (
           SELECT submissions.status
           FROM submissions
           WHERE submissions.student_id = scoped_student.student_id
           ORDER BY submissions.updated_at DESC
           LIMIT 1
         ) = 'revision_requested' THEN 3 ELSE 0 END
         + CASE WHEN (
           SELECT submissions.status
           FROM submissions
           WHERE submissions.student_id = scoped_student.student_id
           ORDER BY submissions.updated_at DESC
           LIMIT 1
         ) = 'submitted' THEN 2 ELSE 0 END
         + CASE WHEN EXISTS (
           SELECT 1 FROM presentation_slots
           WHERE presentation_slots.student_user_id = scoped_student.student_id
            AND presentation_slots.status IN ('scheduled', 'checked_out', 'checked_in')
            AND COALESCE(presentation_slots.outline_status, 'pending') != 'approved'
         ) THEN 2 ELSE 0 END
         + CASE WHEN EXISTS (
           SELECT 1 FROM exports
           WHERE exports.target_user_id = scoped_student.student_id
            AND exports.status = 'failed'
         ) THEN 3 ELSE 0 END
         + CASE WHEN scoped_student.display_name LIKE 'High Risk Demo%' THEN 2 ELSE 0 END
       ) AS risk_score,
       COALESCE(
         (
           SELECT submissions.updated_at
           FROM submissions
           WHERE submissions.student_id = scoped_student.student_id
           ORDER BY submissions.updated_at DESC
           LIMIT 1
         ),
         (
           SELECT MAX(evidence_artifacts.created_at)
           FROM evidence_artifacts
           WHERE evidence_artifacts.student_id = scoped_student.student_id
            AND evidence_artifacts.deleted_at IS NULL
         ),
         ''
       ) AS last_activity_at
     FROM scoped_student
     LIMIT 1`,
  ).bind(siteId, studentId).first<DetailStudentRow>();
}

function detailStudentResponse(row: DetailStudentRow) {
  const latestStatus = canonicalStatus(row.latest_submission_status || "draft");
  const storyBucket = row.story_bucket || "";
  const presentationStatus = canonicalPresentationStatus(row.presentation_status);
  const archiveStatus = canonicalArchiveStatus(row.archive_status);
  const riskFlags = riskFlagsFor(row);
  return {
    studentId: row.student_id,
    displayName: row.display_name,
    email: row.email,
    status: latestStatus,
    siteId: row.site_id,
    siteName: row.site_name,
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    cohortId: row.cohort_id || "",
    cohortName: row.cohort_name || "",
    storyBucket,
    riskScore: Number(row.risk_score || 0),
    riskFlags,
    latestSubmissionId: row.latest_submission_id || "",
    latestSubmissionStatus: latestStatus,
    latestSubmissionUpdatedAt: row.latest_submission_updated_at || "",
    lastActivityAt: row.last_activity_at || "",
    evidenceCount: Number(row.evidence_count || 0),
    reviewCount: Number(row.review_count || 0),
    commentCount: Number(row.comment_count || 0),
    presentationStatus,
    archiveStatus,
    nextAction: nextActionForStudent({
      latestStatus,
      storyBucket,
      presentationStatus,
      archiveStatus,
      hasActiveMentor: Number(row.has_active_mentor || 0) === 1,
      riskFlags,
    }),
  };
}

async function loadMentorSummary(env: Env, row: DetailStudentRow) {
  const [meetingCountRow, latestMeeting] = await Promise.all([
    env.DB.prepare(
      "SELECT COUNT(*) AS count FROM mentor_meetings WHERE student_user_id = ?",
    ).bind(row.student_id).first<CountRow>(),
    env.DB.prepare(
      `SELECT
         mentor_meetings.id,
         mentor_meetings.mentor_user_id,
         mentor.display_name AS mentor_name,
         mentor_meetings.submission_id,
         mentor_meetings.status,
         mentor_meetings.scheduled_for,
         mentor_meetings.held_at,
         mentor_meetings.notes,
         mentor_meetings.created_at,
         mentor_meetings.updated_at
       FROM mentor_meetings
       LEFT JOIN user_accounts mentor ON mentor.id = mentor_meetings.mentor_user_id
       WHERE mentor_meetings.student_user_id = ?
       ORDER BY COALESCE(mentor_meetings.held_at, mentor_meetings.scheduled_for, mentor_meetings.created_at) DESC
       LIMIT 1`,
    ).bind(row.student_id).first<MentorMeetingRow>(),
  ]);
  const active = Number(row.has_active_mentor || 0) === 1;
  return {
    mentorUserId: row.mentor_user_id || "",
    mentorName: row.mentor_name || "",
    active,
    assignedAt: row.mentor_assigned_at || "",
    meetingCount: Number(meetingCountRow?.count || 0),
    latestMeetingAt: latestMeeting ? (latestMeeting.held_at || latestMeeting.scheduled_for || latestMeeting.created_at || "") : "",
    latestMeetingStatus: latestMeeting?.status || "",
    nextAction: mentorNextAction(active, latestMeeting || null),
  };
}

async function loadMentorAssignmentHistory(env: Env, studentId: string, limit: number, visibility: VisibilityPolicy) {
  const rows = await env.DB.prepare(
    `SELECT
       mentor_assignments.id,
       mentor_assignments.mentor_user_id,
       mentor.display_name AS mentor_name,
       assigned_by.display_name AS assigned_by_name,
       mentor_assignments.active,
       mentor_assignments.created_at
     FROM mentor_assignments
     LEFT JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
     LEFT JOIN user_accounts assigned_by ON assigned_by.id = mentor_assignments.assigned_by
     WHERE mentor_assignments.student_user_id = ?
     ORDER BY mentor_assignments.active DESC, mentor_assignments.created_at DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<MentorAssignmentHistoryRow>();
  return (rows.results || []).map((row) => ({
    assignmentId: row.id,
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name || "Mentor",
    active: Number(row.active || 0) === 1,
    assignedAt: row.created_at,
    assignedByName: visibility.includeAdminContext ? row.assigned_by_name || "" : "",
    nextAction: Number(row.active || 0) === 1
      ? "Current mentor coverage is active."
      : "This previous mentor assignment is inactive.",
  }));
}

async function loadProgress(env: Env, studentId: string, programId: string | null) {
  const row = await env.DB.prepare(
    `SELECT
       (
         SELECT COUNT(*)
         FROM requirements
         WHERE (? = '' OR requirements.program_id = ? OR requirements.program_id IS NULL)
       ) AS requirements_total,
       (
         SELECT COUNT(DISTINCT progress_records.requirement_id)
         FROM progress_records
         WHERE progress_records.student_id = ?
          AND progress_records.status IN ('submitted', 'approved', 'archived')
       ) AS requirements_complete,
       (
         SELECT progress_records.phase
         FROM progress_records
         WHERE progress_records.student_id = ?
         ORDER BY progress_records.updated_at DESC
         LIMIT 1
       ) AS current_stage`,
  ).bind(programId || "", programId || "", studentId, studentId).first<ProgressCountRow>();
  const requirementsTotal = Number(row?.requirements_total || 0);
  const requirementsComplete = Math.min(Number(row?.requirements_complete || 0), requirementsTotal || Number(row?.requirements_complete || 0));
  const percentComplete = requirementsTotal > 0 ? Math.round((requirementsComplete / requirementsTotal) * 100) : 0;
  const blockedReasons = await loadBlockedReasons(env, studentId);
  return {
    requirementsTotal,
    requirementsComplete,
    percentComplete,
    currentStage: row?.current_stage || "proposal",
    blockedReasons,
    nextAction: blockedReasons.length ? "Resolve the visible blockers before closeout." : "Continue the next capstone milestone.",
  };
}

async function loadBlockedReasons(env: Env, studentId: string): Promise<string[]> {
  const row = await loadDetailStudentForAnySite(env, studentId);
  if (!row) return [];
  const flags = riskFlagsFor(row);
  return flags.filter((flag) => ["no_mentor", "revision_requested", "archive_failed", "presentation_pending", "stale", "high"].includes(flag));
}

async function loadDetailStudentForAnySite(env: Env, studentId: string): Promise<DetailStudentRow | null> {
  const siteRow = await env.DB.prepare(
    `SELECT site_id
     FROM site_users
     WHERE user_id = ? AND membership_status = 'active'
     ORDER BY site_id
     LIMIT 1`,
  ).bind(studentId).first<{ site_id: string }>();
  return siteRow ? loadDetailStudent(env, siteRow.site_id, studentId) : null;
}

async function loadSubmissions(env: Env, studentId: string, limit: number) {
  const rows = await env.DB.prepare(
    `SELECT
       submissions.id,
       submissions.requirement_id,
       requirements.title AS requirement_title,
       submissions.status,
       submissions.version,
       submissions.submitted_at,
       submissions.created_at,
       submissions.updated_at,
       (
         SELECT COUNT(*)
         FROM evidence_artifacts
         WHERE evidence_artifacts.submission_id = submissions.id
          AND evidence_artifacts.deleted_at IS NULL
       ) AS evidence_count
     FROM submissions
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE submissions.student_id = ?
     ORDER BY submissions.updated_at DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<SubmissionRow>();
  return (rows.results || []).map((row) => ({
    submissionId: row.id,
    requirementId: row.requirement_id || "",
    requirementTitle: row.requirement_title || "Senior Project submission",
    status: canonicalStatus(row.status),
    version: Number(row.version || 1),
    submittedAt: row.submitted_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    evidenceCount: Number(row.evidence_count || 0),
    nextAction: submissionNextAction(row.status),
  }));
}

async function loadEvidence(env: Env, studentId: string, limit: number) {
  const rows = await env.DB.prepare(
    `SELECT
       evidence_artifacts.id,
       evidence_artifacts.title,
       evidence_artifacts.artifact_type,
       evidence_artifacts.source_kind,
       evidence_artifacts.external_url,
       evidence_artifacts.mime_type,
       evidence_artifacts.size_bytes,
       evidence_artifacts.review_status,
       evidence_artifacts.created_at,
       creator.display_name AS created_by_name
     FROM evidence_artifacts
     LEFT JOIN user_accounts creator ON creator.id = evidence_artifacts.created_by
     WHERE evidence_artifacts.student_id = ?
      AND evidence_artifacts.deleted_at IS NULL
     ORDER BY evidence_artifacts.created_at DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<EvidenceRow>();
  return (rows.results || []).map(safeEvidenceResponse);
}

async function loadReviews(env: Env, studentId: string, limit: number, visibility: VisibilityPolicy) {
  const rows = await env.DB.prepare(
    `SELECT
       reviews.id,
       reviews.submission_id,
       requirements.title AS requirement_title,
       reviews.decision,
       reviews.feedback,
       reviews.created_at,
       reviewer.display_name AS reviewer_name
     FROM reviews
     JOIN submissions ON submissions.id = reviews.submission_id
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     LEFT JOIN user_accounts reviewer ON reviewer.id = reviews.reviewer_user_id
     WHERE submissions.student_id = ?
     ORDER BY reviews.created_at DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<ReviewRow>();
  return (rows.results || []).map((row) => ({
    reviewId: row.id,
    submissionId: row.submission_id,
    requirementTitle: row.requirement_title || "Senior Project submission",
    decision: canonicalStatus(row.decision),
    feedback: visibility.includeFullStatusReasons ? safeText(row.feedback, 420) : safeText(row.feedback, 180),
    reviewerName: row.reviewer_name || "Reviewer",
    createdAt: row.created_at,
    nextAction: reviewNextAction(row.decision),
  }));
}

async function loadComments(env: Env, studentId: string, limit: number, visibility: VisibilityPolicy) {
  const rows = await env.DB.prepare(
    `SELECT
       comments.id,
       comments.entity_type,
       comments.entity_id,
       comments.visibility,
       comments.body,
       comments.created_at,
       author.display_name AS author_name
     FROM comments
     LEFT JOIN user_accounts author ON author.id = comments.author_user_id
     WHERE comments.deleted_at IS NULL
      AND (? = 1 OR comments.visibility != 'staff_only')
      AND (
       (comments.entity_type = 'submission' AND comments.entity_id IN (
         SELECT submissions.id FROM submissions WHERE submissions.student_id = ?
       ))
       OR (comments.entity_type = 'progress_record' AND comments.entity_id IN (
         SELECT progress_records.id FROM progress_records WHERE progress_records.student_id = ?
       ))
       OR (comments.entity_type = 'evidence_artifact' AND comments.entity_id IN (
         SELECT evidence_artifacts.id FROM evidence_artifacts WHERE evidence_artifacts.student_id = ?
       ))
      )
     ORDER BY comments.created_at DESC
     LIMIT ?`,
  ).bind(visibility.includeStaffOnlyComments ? 1 : 0, studentId, studentId, studentId, limit).all<CommentRow>();
  return (rows.results || []).map((row) => ({
    commentId: row.id,
    entityType: row.entity_type,
    visibility: visibility.includeAdminContext ? row.visibility : "scoped",
    body: safeText(row.body, visibility.includeAdminContext ? 420 : 220),
    authorName: row.author_name || "Staff",
    createdAt: row.created_at,
  }));
}

async function loadStatusHistory(env: Env, studentId: string, limit: number, visibility: VisibilityPolicy) {
  const rows = await env.DB.prepare(
    `SELECT
       status_history.id,
       status_history.entity_type,
       status_history.entity_id,
       status_history.from_status,
       status_history.to_status,
       status_history.reason,
       status_history.created_at,
       actor.display_name AS actor_name
     FROM status_history
     LEFT JOIN user_accounts actor ON actor.id = status_history.changed_by
     WHERE status_history.student_id = ?
     ORDER BY status_history.created_at DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<StatusHistoryRow>();
  return (rows.results || []).map((row) => ({
    statusHistoryId: row.id,
    entityType: row.entity_type,
    fromStatus: row.from_status ? canonicalStatus(row.from_status) : "",
    toStatus: canonicalStatus(row.to_status),
    reason: visibility.includeFullStatusReasons ? safeText(row.reason, 420) : safeStatusReason(row.reason),
    changedByName: row.actor_name || "Staff",
    createdAt: row.created_at,
    nextAction: statusNextAction(row.to_status),
  }));
}

async function loadMentorMeetings(env: Env, studentId: string, limit: number, visibility: VisibilityPolicy) {
  const rows = await env.DB.prepare(
    `SELECT
       mentor_meetings.id,
       mentor_meetings.mentor_user_id,
       mentor.display_name AS mentor_name,
       mentor_meetings.submission_id,
       requirements.title AS requirement_title,
       submissions.status AS submission_status,
       submissions.version AS submission_version,
       mentor_meetings.status,
       mentor_meetings.scheduled_for,
       mentor_meetings.held_at,
       mentor_meetings.notes,
       mentor_meetings.created_at,
       mentor_meetings.updated_at
     FROM mentor_meetings
     LEFT JOIN user_accounts mentor ON mentor.id = mentor_meetings.mentor_user_id
     LEFT JOIN submissions ON submissions.id = mentor_meetings.submission_id
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE mentor_meetings.student_user_id = ?
     ORDER BY COALESCE(mentor_meetings.held_at, mentor_meetings.scheduled_for, mentor_meetings.created_at) DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<MentorMeetingRow>();
  return (rows.results || []).map((row) => ({
    mentorMeetingId: row.id,
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name || "Mentor",
    submissionId: row.submission_id || "",
    submissionTitle: row.requirement_title || (row.submission_id ? "Senior Project submission" : ""),
    submissionStatus: row.submission_status ? canonicalStatus(row.submission_status) : "",
    submissionVersion: Number(row.submission_version || 0),
    status: canonicalStatus(row.status),
    scheduledFor: row.scheduled_for || "",
    heldAt: row.held_at || "",
    notes: safeText(row.notes, visibility.includeAdminContext ? 360 : 180),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nextAction: mentorMeetingNextAction(row.status),
  }));
}

async function loadPresentation(env: Env, studentId: string) {
  const row = await env.DB.prepare(
    `SELECT
       id,
       submission_id,
       scheduled_for,
       duration_minutes,
       location,
       status,
       outline_status,
       checked_out_at,
       checked_in_at,
       notes,
       created_at,
       updated_at
     FROM presentation_slots
     WHERE student_user_id = ?
      AND status != 'cancelled'
     ORDER BY scheduled_for DESC
     LIMIT 1`,
  ).bind(studentId).first<PresentationRow>();
  if (!row) {
    return {
      status: "missing",
      scheduledAt: "",
      room: "",
      outlineStatus: "missing",
      checkInStatus: "missing",
      nextAction: "Schedule or confirm presentation readiness when appropriate.",
    };
  }
  const status = presentationStatusFor(row);
  return {
    status,
    scheduledAt: row.scheduled_for,
    room: row.location,
    outlineStatus: row.outline_status || "pending",
    checkInStatus: row.checked_in_at ? "checked_in" : row.checked_out_at ? "checked_out" : row.status,
    durationMinutes: Number(row.duration_minutes || 15),
    nextAction: presentationNextAction(row),
  };
}

async function loadArchive(env: Env, studentId: string, archiveStatus: string) {
  const row = await env.DB.prepare(
    `SELECT
       exports.id,
       exports.export_type,
       requester.display_name AS requested_by_name,
       exports.status,
       exports.created_at,
       exports.completed_at,
       (
         SELECT COUNT(*)
         FROM export_artifacts
         WHERE export_artifacts.export_id = exports.id
       ) AS artifact_count
     FROM exports
     LEFT JOIN user_accounts requester ON requester.id = exports.requested_by
     WHERE exports.target_user_id = ?
     ORDER BY exports.created_at DESC
     LIMIT 1`,
  ).bind(studentId).first<ExportRow>();
  const status = canonicalArchiveStatus(archiveStatus);
  const exportStatus = row?.status || "not_requested";
  return {
    status,
    exportStatus,
    ready: status === "ready" || status === "complete",
    failed: status === "failed" || exportStatus === "failed",
    requestedAt: row?.created_at || "",
    completedAt: row?.completed_at || "",
    requestedByName: row?.requested_by_name || "",
    artifactCount: Number(row?.artifact_count || 0),
    storageIdentifiersRedacted: true,
    nextAction: archiveNextAction(status, exportStatus),
  };
}

async function loadDetailPermissions(
  env: Env,
  user: UserAccount,
  siteId: string,
  studentId: string,
  latestSubmissionId: string | null,
  readOnly: boolean,
  roleIds: RoleId[],
) {
  const programTeacherScoped = roleIds.includes("program_teacher");
  const mentorScoped = roleIds.includes("mentor");
  const suppressDetailMutation = readOnly || programTeacherScoped || mentorScoped;
  const [
    canViewStudentEvidencePermission,
    canDownloadStudentEvidencePermission,
    canViewReviewQueuePermission,
    canAddStaffNotePermission,
    canManageMentorAssignmentsPermission,
    canViewPresentationOperationsPermission,
    canManagePresentationOperationsPermission,
    canViewArchiveOperationsPermission,
    canManageArchiveOperationsPermission,
    canManageUsersPermission,
    canManageSecurityPermission,
    canMutateReviewDecisionPermission,
  ] = await Promise.all([
    canViewSiteStudentEvidence(env, user, studentId, siteId),
    canDownloadStudentEvidence(env, user, studentId, siteId),
    canViewReviewQueue(env, user, siteId),
    canAddStaffNote(env, user, studentId, siteId),
    canManageMentorAssignments(env, user, siteId),
    canViewPresentationOperations(env, user, siteId),
    canManagePresentationOperations(env, user, siteId),
    canViewArchiveOperations(env, user, siteId),
    canManageArchiveOperations(env, user, siteId),
    canManageUsers(env, user),
    canManageSecurity(env, user),
    latestSubmissionId ? canMutateReviewDecision(env, user, latestSubmissionId) : Promise.resolve(false),
  ]);

  return {
    canViewStudentEvidence: canViewStudentEvidencePermission,
    canDownloadStudentEvidence: readOnly ? false : canDownloadStudentEvidencePermission,
    canViewReviewQueue: canViewReviewQueuePermission,
    canMutateReviewDecision: suppressDetailMutation ? false : canMutateReviewDecisionPermission,
    canAddStaffNote: suppressDetailMutation ? false : canAddStaffNotePermission,
    canManageMentorAssignments: suppressDetailMutation ? false : canManageMentorAssignmentsPermission,
    canViewPresentationOperations: canViewPresentationOperationsPermission,
    canManagePresentationOperations: suppressDetailMutation ? false : canManagePresentationOperationsPermission,
    canViewArchiveOperations: canViewArchiveOperationsPermission,
    canManageArchiveOperations: suppressDetailMutation ? false : canManageArchiveOperationsPermission,
    canManageUsers: suppressDetailMutation ? false : canManageUsersPermission,
    canManageSecurity: suppressDetailMutation ? false : canManageSecurityPermission,
  };
}

async function loadTimelineEvents(
  env: Env,
  studentId: string,
  visibility: VisibilityPolicy,
  options: {
    perTypeLimit: number;
    typeFilter?: string;
  },
): Promise<TimelineEvent[]> {
  const perTypeLimit = Math.max(1, Math.min(TIMELINE_QUERY_WINDOW_MAX, options.perTypeLimit));
  const [
    submissions,
    evidence,
    reviews,
    comments,
    statusHistory,
    mentorMeetings,
    presentationRows,
    archiveRows,
  ] = await Promise.all([
    loadSubmissions(env, studentId, perTypeLimit),
    loadEvidence(env, studentId, perTypeLimit),
    loadReviews(env, studentId, perTypeLimit, visibility),
    loadComments(env, studentId, perTypeLimit, visibility),
    loadStatusHistory(env, studentId, perTypeLimit, visibility),
    loadMentorMeetings(env, studentId, perTypeLimit, visibility),
    loadPresentationRows(env, studentId, perTypeLimit),
    loadArchiveRows(env, studentId, perTypeLimit),
  ]);

  const events: TimelineEvent[] = [
    ...submissions.map((row: any) => ({
      id: `submission:${row.submissionId}`,
      type: "submission",
      occurredAt: row.updatedAt || row.submittedAt || row.createdAt,
      title: `Submission ${statusText(row.status)}`,
      summary: `${row.requirementTitle} version ${row.version}.`,
      actorName: "",
      status: row.status,
      reason: "",
      owner: "Student",
      nextAction: row.nextAction,
    })),
    ...evidence.map((row: any) => ({
      id: `evidence:${row.evidenceId}`,
      type: "evidence",
      occurredAt: row.createdAt,
      title: "Evidence added",
      summary: `${row.title} (${row.artifactType}); storage identifiers redacted.`,
      actorName: row.createdByName || "",
      status: row.reviewStatus,
      reason: "",
      owner: "Student",
      nextAction: "Review evidence context in the evidence section.",
    })),
    ...reviews.map((row: any) => ({
      id: `review:${row.reviewId}`,
      type: "review",
      occurredAt: row.createdAt,
      title: `Review ${statusText(row.decision)}`,
      summary: row.feedback || `${row.requirementTitle} review recorded.`,
      actorName: row.reviewerName || "",
      status: row.decision,
      reason: row.feedback || "",
      owner: "Program teacher",
      nextAction: row.nextAction,
    })),
    ...comments.map((row: any) => ({
      id: `comment:${row.commentId}`,
      type: "comment",
      occurredAt: row.createdAt,
      title: "Comment added",
      summary: row.body,
      actorName: row.authorName || "",
      status: row.visibility,
      reason: "",
      owner: "Assigned staff",
      nextAction: "Use the comment with the current review or support context.",
    })),
    ...statusHistory.map((row: any) => ({
      id: `status_history:${row.statusHistoryId}`,
      type: "status_history",
      occurredAt: row.createdAt,
      title: `Status changed to ${statusText(row.toStatus)}`,
      summary: row.reason || "Status history recorded.",
      actorName: row.changedByName || "",
      status: row.toStatus,
      reason: row.reason || "",
      owner: "Assigned staff",
      nextAction: row.nextAction,
    })),
    ...mentorMeetings.map((row: any) => ({
      id: `mentor_meeting:${row.mentorMeetingId}`,
      type: "mentor_meeting",
      occurredAt: row.heldAt || row.scheduledFor || row.createdAt,
      title: `Mentor meeting ${statusText(row.status)}`,
      summary: row.submissionTitle
        ? `${row.submissionTitle}: ${row.notes || "Mentor support event recorded."}`
        : row.notes || "Mentor support event recorded.",
      actorName: row.mentorName || "",
      status: row.status,
      reason: row.notes || "",
      owner: "Mentor",
      nextAction: row.nextAction,
    })),
    ...presentationRows.map((row) => ({
      id: `presentation:${row.id}`,
      type: "presentation",
      occurredAt: row.scheduled_for || row.updated_at || row.created_at,
      title: `Presentation ${statusText(row.status)}`,
      summary: `${row.location}; outline ${statusText(row.outline_status)}.`,
      actorName: "",
      status: presentationStatusFor(row),
      reason: safeText(row.notes, visibility.includeAdminContext ? 240 : 120),
      owner: "Site operations",
      nextAction: presentationNextAction(row),
    })),
    ...archiveRows.map((row) => ({
      id: `archive_export:${row.id}`,
      type: "archive_export",
      occurredAt: row.completed_at || row.created_at,
      title: `Archive export ${statusText(row.status)}`,
      summary: `${row.export_type} export status is ${statusText(row.status)}; storage identifiers redacted.`,
      actorName: row.requested_by_name || "",
      status: row.status,
      reason: "",
      owner: "Administration",
      nextAction: archiveNextAction(canonicalArchiveStatus(row.status), row.status),
    })),
  ];
  return events
    .filter((event) => !options.typeFilter || event.type === options.typeFilter)
    .filter((event) => event.occurredAt)
    .sort((left, right) => {
      const byDate = String(right.occurredAt || "").localeCompare(String(left.occurredAt || ""));
      if (byDate !== 0) return byDate;
      const byType = left.type.localeCompare(right.type);
      if (byType !== 0) return byType;
      return left.id.localeCompare(right.id);
    });
}

async function loadPresentationRows(env: Env, studentId: string, limit: number): Promise<PresentationRow[]> {
  const rows = await env.DB.prepare(
    `SELECT
       id,
       submission_id,
       scheduled_for,
       duration_minutes,
       location,
       status,
       outline_status,
       checked_out_at,
       checked_in_at,
       notes,
       created_at,
       updated_at
     FROM presentation_slots
     WHERE student_user_id = ?
      AND status != 'cancelled'
     ORDER BY scheduled_for DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<PresentationRow>();
  return rows.results || [];
}

async function loadArchiveRows(env: Env, studentId: string, limit: number): Promise<ExportRow[]> {
  const rows = await env.DB.prepare(
    `SELECT
       exports.id,
       exports.export_type,
       requester.display_name AS requested_by_name,
       exports.status,
       exports.created_at,
       exports.completed_at,
       (
         SELECT COUNT(*)
         FROM export_artifacts
         WHERE export_artifacts.export_id = exports.id
       ) AS artifact_count
     FROM exports
     LEFT JOIN user_accounts requester ON requester.id = exports.requested_by
     WHERE exports.target_user_id = ?
     ORDER BY exports.created_at DESC
     LIMIT ?`,
  ).bind(studentId, limit).all<ExportRow>();
  return rows.results || [];
}

function visibilityPolicyFor(roleIds: RoleId[]): VisibilityPolicy {
  if (roleIds.includes("mentor") && !roleIds.some((roleId) => ["platform_admin", "admin", "org_admin", "site_admin", "viewer", "program_teacher"].includes(roleId))) {
    return {
      mode: "mentor_support",
      includeStaffOnlyComments: false,
      includeAdminContext: false,
      includeFullStatusReasons: false,
    };
  }
  if (roleIds.includes("program_teacher")) {
    return {
      mode: "program_teacher_scoped",
      includeStaffOnlyComments: true,
      includeAdminContext: false,
      includeFullStatusReasons: true,
    };
  }
  if (isReadOnlyViewer(roleIds)) {
    return {
      mode: "viewer_read_only",
      includeStaffOnlyComments: true,
      includeAdminContext: false,
      includeFullStatusReasons: true,
    };
  }
  return {
    mode: "admin_operational",
    includeStaffOnlyComments: true,
    includeAdminContext: true,
    includeFullStatusReasons: true,
  };
}

function visibilityResponse(policy: VisibilityPolicy) {
  return {
    mode: policy.mode,
    staffOnlyComments: policy.includeStaffOnlyComments ? "included_when_scoped" : "omitted",
    adminContext: policy.includeAdminContext ? "included_when_scoped" : "omitted",
    unsafeStorageIdentifiers: "redacted",
  };
}

function safeEvidenceResponse(row: EvidenceRow) {
  const externalUrl = safeDemoUrl(row.external_url);
  return {
    evidenceId: row.id,
    title: safeText(row.title, 160),
    artifactType: safeText(row.artifact_type, 80),
    sourceKind: row.source_kind,
    mimeType: row.mime_type || "",
    sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes || 0),
    reviewStatus: canonicalStatus(row.review_status),
    createdAt: row.created_at,
    createdByName: row.created_by_name || "",
    externalUrl,
    externalUrlRedacted: Boolean(row.external_url && !externalUrl),
    storageStatus: row.source_kind === "external_link" ? "external_link_safe_or_redacted" : "private_storage_redacted",
    storageIdentifiersRedacted: true,
  };
}

function riskFlagsFor(row: DetailStudentRow): string[] {
  const flags = [];
  if (Number(row.has_active_mentor || 0) === 0) flags.push("no_mentor");
  if (row.latest_submission_status === "revision_requested") flags.push("revision_requested");
  if (row.latest_submission_status === "submitted") flags.push("awaiting_review");
  if (row.presentation_status === "pending") flags.push("presentation_pending");
  if (row.archive_status === "failed") flags.push("archive_failed");
  if (Number(row.stale_flag || 0) === 1) flags.push("stale");
  if (Number(row.risk_score || 0) >= 7) flags.push("high");
  return flags;
}

function nextActionForStudent({
  latestStatus,
  storyBucket,
  presentationStatus,
  archiveStatus,
  hasActiveMentor,
  riskFlags,
}: {
  latestStatus: string;
  storyBucket: string;
  presentationStatus: string;
  archiveStatus: string;
  hasActiveMentor: boolean;
  riskFlags: string[];
}): string {
  if (!hasActiveMentor) return "Assign or confirm mentor coverage.";
  if (latestStatus === "revision_requested") return "Check revision feedback and owner.";
  if (latestStatus === "submitted") return "Queue teacher review.";
  if (archiveStatus === "failed") return "Review archive export failure.";
  if (presentationStatus === "pending") return "Confirm presentation readiness.";
  if (storyBucket === "model_excellent" || storyBucket === "archive_ready") return "Use as a strong demo reference.";
  if (riskFlags.includes("stale")) return "Check recent activity and follow up.";
  return "Continue normal capstone monitoring.";
}

function mentorNextAction(active: boolean, latestMeeting: MentorMeetingRow | null): string {
  if (!active) return "Assign or confirm mentor coverage.";
  if (!latestMeeting) return "Schedule a mentor check-in.";
  if (latestMeeting.status === "missed" || latestMeeting.status === "makeup_required") return "Follow up on the mentor meeting.";
  return "Continue mentor support.";
}

function mentorMeetingNextAction(status: string): string {
  if (status === "missed" || status === "makeup_required") return "Follow up and reschedule support.";
  if (status === "scheduled") return "Prepare for the upcoming mentor check-in.";
  return "Use meeting notes to guide the next evidence step.";
}

function submissionNextAction(status: string): string {
  if (status === "submitted") return "Review queue follow-up is needed.";
  if (status === "revision_requested") return "Student revision is needed before approval.";
  if (status === "approved" || status === "archived") return "Continue presentation and archive readiness.";
  return "Continue student work toward submission.";
}

function reviewNextAction(decision: string): string {
  if (decision === "revision_requested") return "Track the revision loop and next student submission.";
  if (decision === "approved") return "Move forward with build, presentation, or archive readiness.";
  return "Use the comment in the next review touchpoint.";
}

function statusNextAction(status: string): string {
  if (status === "revision_requested") return "Resolve the revision feedback.";
  if (status === "submitted") return "Complete teacher review.";
  if (status === "approved") return "Continue to the next capstone milestone.";
  if (status === "archived") return "Confirm archive readiness.";
  return "Monitor the next status update.";
}

function presentationNextAction(row: PresentationRow): string {
  if (row.status === "completed") return "Confirm archive and closeout readiness.";
  if (row.outline_status !== "approved") return "Resolve outline readiness before presentation.";
  if (row.status === "checked_out") return "Complete presentation check-in.";
  return "Confirm presentation logistics and readiness.";
}

function archiveNextAction(status: string, exportStatus: string): string {
  if (status === "failed" || exportStatus === "failed") return "Review archive export failure without exposing storage identifiers.";
  if (status === "ready") return "Confirm archive package readiness.";
  if (status === "complete" || exportStatus === "complete") return "Archive package metadata is complete.";
  if (exportStatus === "queued" || exportStatus === "running") return "Monitor archive export progress.";
  return "Prepare archive readiness checks when the student reaches closeout.";
}

function presentationStatusFor(row: PresentationRow): string {
  if (row.status === "completed") return "completed";
  if (["scheduled", "checked_out", "checked_in"].includes(row.status) && row.outline_status !== "approved") return "pending";
  if (["scheduled", "checked_out", "checked_in"].includes(row.status)) return "scheduled";
  return "missing";
}

function canonicalStatus(value: string | null): string {
  const normalized = cleanStatus(value);
  if (normalized === "comment_only") return "under_review";
  if (normalized === "pending_review") return "under_review";
  if (normalized === "held") return "complete";
  if (normalized === "makeup_required" || normalized === "missed") return "blocked";
  return CANONICAL_STATUS_VALUES.includes(normalized) ? normalized : normalized || "draft";
}

function canonicalPresentationStatus(value: string | null): string {
  const normalized = cleanStatus(value);
  if (normalized === "completed") return "completed";
  return CANONICAL_PRESENTATION_VALUES.includes(normalized) ? normalized : "missing";
}

function canonicalArchiveStatus(value: string | null): string {
  const normalized = cleanStatus(value);
  if (normalized === "queued" || normalized === "running") return "missing";
  return CANONICAL_ARCHIVE_VALUES.includes(normalized) ? normalized : "missing";
}

function statusText(value: string): string {
  return cleanStatus(value).replace(/_/g, " ") || "unknown";
}

function cleanStatus(value: string | null): string {
  return String(value || "").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function safeText(value: string | null, maxLength: number): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeStatusReason(value: string | null): string {
  const text = safeText(value, 180);
  return text ? text : "Status update recorded.";
}

function safeDemoUrl(value: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" && url.hostname === "example.com") return url.toString();
  } catch {
    return "";
  }
  return "";
}

function cleanTimelineType(value: string | null): string {
  const normalized = cleanStatus(value);
  return [
    "status_history",
    "submission",
    "evidence",
    "review",
    "comment",
    "mentor_meeting",
    "presentation",
    "archive_export",
    "audit_safe",
  ].includes(normalized) ? normalized : "";
}

function clampNumber(value: string | null, defaultValue: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, min), max);
}

function routeParam(params: Record<string, string | string[]> | undefined, key: string): string {
  const value = params?.[key];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function genericNotFound(): Response {
  return json({ error: "not_found" }, { status: 404 });
}

async function auditSiteStudent(
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
      entityType: "site_student_detail",
      entityId: cleanId(String(metadata.studentId || metadata.siteId || metadata.requestedSiteId || "")) || null,
      request,
      metadata: {
        ...metadata,
        actorRoleScopes: context ? safeRoleScopes(context.roles) : [],
      },
    });
  } catch {
    // Safe read routes should not fail only because audit storage is unavailable.
  }
}

function safeRoleScopes(assignments: RoleAssignment[]) {
  return assignments.map((assignment) => ({
    roleId: assignment.role_id,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id || "",
  }));
}
