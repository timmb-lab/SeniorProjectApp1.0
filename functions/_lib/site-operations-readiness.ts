import type { Env, RoleId, UserAccount } from "../_types.ts";
import { archiveArtifactExpired, archiveArtifactExpiresSoon, getArchiveProviderConfiguration, getArchiveRetentionPolicy } from "./archive-export.ts";
import { getCurrentUser, writeAudit } from "./auth.ts";
import { json } from "./http.ts";
import {
  cleanId,
  resolveSiteSelection,
  type SiteRow,
  type SiteScopeContext,
} from "./site-scope.ts";
import {
  canManageSecurity,
  canManageUsers,
  canViewArchiveOperations,
  canViewPresentationOperations,
  canViewReadinessReports,
  canViewSiteStudentDetail,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "./permissions.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const STUDENT_STATUS_VALUES = ["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"];
const STORY_VALUES = ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"];
const RISK_VALUES = ["high", "medium", "low", "stale", "no_mentor"];
const PRESENTATION_STATUS_VALUES = ["ready", "pending", "scheduled", "completed", "missing", "outline_pending", "outline_revision_needed", "attention_required"];
const ARCHIVE_STATUS_VALUES = ["ready", "complete", "failed", "missing", "queued", "running", "in_progress", "expired", "expiring_soon", "provider_unavailable"];
const READINESS_VALUES = ["ready", "in_progress", "attention_required", "blocked", "missing", "complete"];
const CATEGORY_VALUES = ["archive", "risk", "mentor", "review", "presentation", "completion", "evidence", "readiness"];

interface RawOperationRow {
  student_id: string;
  display_name: string;
  email: string;
  site_id: string;
  site_name: string;
  program_id: string | null;
  program_name: string | null;
  cohort_id: string | null;
  cohort_name: string | null;
  has_active_mentor: number;
  latest_submission_status: string | null;
  latest_submission_updated_at: string | null;
  evidence_count: number;
  progress_total: number;
  progress_complete: number;
  presentation_status_raw: string | null;
  presentation_outline_status_raw: string | null;
  presentation_scheduled_for: string | null;
  presentation_location: string | null;
  presentation_checked_out_at: string | null;
  presentation_checked_in_at: string | null;
  latest_export_status: string | null;
  latest_export_created_at: string | null;
  latest_export_completed_at: string | null;
  latest_export_artifact_expires_at: string | null;
  story_bucket: string;
  stale_flag: number;
  risk_score: number;
}

interface OperationFilters {
  studentId: string;
  programId: string;
  status: string;
  story: string;
  risk: string;
  presentationStatus: string;
  archiveStatus: string;
  readiness: string;
  category: string;
  needsAttention: boolean;
  outlineAttention: boolean;
  limit: number;
  offset: number;
}

interface OperationStudentRow {
  studentId: string;
  studentName: string;
  email: string;
  siteId: string;
  siteName: string;
  programId: string;
  programName: string;
  cohortId: string;
  cohortName: string;
  storyBucket: string;
  riskScore: number;
  riskFlags: string[];
  latestSubmissionStatus: string;
  latestActivityAt: string;
  hasActiveMentor: boolean;
  evidenceCount: number;
  presentationStatus: string;
  scheduledFor: string;
  location: string;
  outlineStatus: string;
  checkInStatus: string;
  archiveStatus: string;
  exportStatus: string;
  providerStatus: string;
  downloadReady: boolean;
  downloadExpiresSoon: boolean;
  readinessStatus: string;
  readinessCategory: string;
  reason: string;
  owner: string;
  nextAction: string;
}

interface ProgramBreakdownRow {
  programId: string;
  programName: string;
  studentsTotal: number;
  presentationPending: number;
  archiveReady: number;
  archiveFailed: number;
  needsAttention: number;
}

type AuditContext = SiteScopeContext;

export async function handleSiteOperationsReadinessGet({
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
    await auditOperations(env, request, null, null, "site_operations_readiness_unauthorized", {
      reason: "missing_session",
      requestedSiteId,
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const context = await getViewerRoleContext(env, user);
  if (!canUseOperationsRole(context.roleIds)) {
    await auditOperations(env, request, user, context, "site_operations_readiness_denied", {
      reason: "role_not_allowed_for_site_operations",
      requestedSiteId,
      role: context.primaryRole,
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (invalidRequestedSiteId) {
    await auditOperations(env, request, user, context, "site_operations_readiness_denied", {
      reason: "invalid_site_id",
    });
    return json({ error: "forbidden", reason: "invalid_site_id" }, { status: 403 });
  }

  const selection = await resolveSiteSelection({
    env,
    user,
    context,
    requestedSiteId,
    canViewSite: (siteId) => canViewOperationsSite(env, user, siteId),
    defaultSiteRoleIds: ["platform_admin", "global_admin", "admin", "org_admin", "program_teacher"],
  });

  if (selection.kind === "denied") {
    await auditOperations(env, request, user, context, "site_operations_readiness_denied", {
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
    await auditOperations(env, request, user, context, "site_operations_readiness_denied", {
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

  const payload = await buildOperationsPayload({
    env,
    user,
    context,
    site: selection.site,
    accessibleSites: selection.accessibleSites,
    selectionMode: selection.selectionMode,
    filters,
  });

  await auditOperations(env, request, user, context, "site_operations_readiness_viewed", {
    tenantId: selection.site.tenant_id,
    siteId: selection.site.id,
    filters: safeFilterSummary(filters),
    returned: payload.pagination.returned,
    filteredTotal: payload.pagination.filteredTotal,
    role: context.primaryRole,
  });

  return json(payload);
}

async function buildOperationsPayload({
  env,
  user,
  context,
  site,
  accessibleSites,
  selectionMode,
  filters,
}: {
  env: Env;
  user: UserAccount;
  context: AuditContext;
  site: SiteRow;
  accessibleSites: Array<{ tenantId: string; tenantName: string; siteId: string; siteName: string; schoolYear: string }>;
  selectionMode: string;
  filters: OperationFilters;
}) {
  const studentScope = await visibleStudentScope(env, user, context, site.id);
  const provider = getArchiveProviderConfiguration(env);
  const retention = getArchiveRetentionPolicy(env);
  const rawRows = await loadOperationRows(env, site.id, studentScope.studentIds);
  const rows = rawRows.map((row) => formatOperationRow(row, {
    providerStatus: provider.status,
    archiveProviderReady: provider.ready,
    expiryWarningDays: retention.expiryWarningDays,
  }));

  const filteredRows = rows.filter((row) => matchesFilters(row, filters));
  const sortedRows = filteredRows.sort(compareOperationRows);
  const pageRows = sortedRows.slice(filters.offset, filters.offset + filters.limit);
  const summary = summarizeRows(rows);
  const filteredSummary = summarizeRows(filteredRows);
  const presentationRows = pageRows.filter((row) => shouldShowPresentationRow(row));
  const archiveRows = pageRows.filter((row) => shouldShowArchiveRow(row));
  const attentionRows = pageRows.filter((row) => shouldShowAttentionRow(row));
  const permissions = await loadPermissions(env, user, site.id);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    scope: {
      tenantId: site.tenant_id,
      tenantName: site.tenant_name,
      siteId: site.id,
      siteName: site.name,
      schoolYear: site.school_year || "",
      role: context.primaryRole,
      readOnly: true,
      selectedBy: selectionMode,
      studentScope: studentScope.label,
      accessibleSites,
    },
    filters: {
      siteId: site.id,
      studentId: filters.studentId,
      programId: filters.programId,
      status: filters.status,
      story: filters.story,
      risk: filters.risk,
      presentationStatus: filters.presentationStatus,
      archiveStatus: filters.archiveStatus,
      readiness: filters.readiness,
      category: filters.category,
      needsAttention: filters.needsAttention,
      outlineAttention: filters.outlineAttention,
      limit: filters.limit,
      offset: filters.offset,
    },
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      returned: pageRows.length,
      total: rows.length,
      filteredTotal: filteredRows.length,
    },
    summary: {
      studentsTotal: rows.length,
      presentationReady: summary.presentation.ready,
      presentationPending: summary.presentation.pending + summary.presentation.outlinePending + summary.presentation.outlineRevisionNeeded + summary.presentation.attentionRequired,
      presentationScheduled: summary.presentation.scheduled,
      outlinePending: summary.presentation.outlinePending + summary.presentation.outlineRevisionNeeded,
      archiveReady: summary.archive.ready + summary.archive.complete + summary.archive.expiringSoon,
      archiveInProgress: summary.archive.queued + summary.archive.running,
      archiveExpiringSoon: summary.archive.expiringSoon,
      archiveExpired: summary.archive.expired,
      archiveFailed: summary.archive.failed + summary.archive.providerUnavailable,
      archiveMissing: summary.archive.missing,
      evidenceMissing: summary.evidenceMissing,
      highRisk: summary.highRisk,
      staleActivity: summary.staleActivity,
      needsAttention: summary.needsAttention,
    },
    presentation: {
      summary: summary.presentation,
      filteredSummary: filteredSummary.presentation,
      rows: presentationRows.map(presentationResponse),
    },
    archive: {
      summary: summary.archive,
      filteredSummary: filteredSummary.archive,
      rows: archiveRows.map(archiveResponse),
    },
    readiness: {
      summary: summary.readiness,
      programBreakdown: programBreakdown(rows),
      filteredProgramBreakdown: programBreakdown(filteredRows),
      attentionRows: attentionRows.map(attentionResponse),
      nextActions: nextActions(filteredRows),
    },
    permissions,
    filterOptions: {
      programs: programBreakdown(rows).map((row) => ({ programId: row.programId, programName: row.programName })),
      statuses: STUDENT_STATUS_VALUES,
      storyBuckets: STORY_VALUES,
      risks: RISK_VALUES,
      presentationStatuses: PRESENTATION_STATUS_VALUES,
      archiveStatuses: ARCHIVE_STATUS_VALUES,
      readiness: READINESS_VALUES,
      categories: CATEGORY_VALUES,
    },
    limits: {
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
      presentationRows: filters.limit,
      archiveRows: filters.limit,
      attentionRows: filters.limit,
    },
  };
}

async function visibleStudentScope(env: Env, user: UserAccount, context: AuditContext, siteId: string): Promise<{
  label: "selected_site" | "program_teacher";
  studentIds: string[] | null;
}> {
  if (context.roleIds.includes("program_teacher") && !hasAnyAdminLikeRole(context.roleIds)) {
    const teacherScope = await getProgramTeacherScopedStudentIds(env, user);
    if (!teacherScope.valid) return { label: "program_teacher", studentIds: [] };
    const selectedRows = await env.DB.prepare(
      `SELECT DISTINCT site_users.user_id AS id
       FROM site_users
       JOIN user_accounts student ON student.id = site_users.user_id
        AND student.status = 'active'
       JOIN user_roles student_role ON student_role.user_id = student.id
        AND student_role.role_id = 'student'
       WHERE site_users.site_id = ?
        AND site_users.membership_status = 'active'`,
    ).bind(siteId).all<{ id: string }>();
    const selected = new Set((selectedRows.results || []).map((row) => row.id));
    return {
      label: "program_teacher",
      studentIds: teacherScope.studentIds.filter((studentId) => selected.has(studentId)),
    };
  }
  return { label: "selected_site", studentIds: null };
}

async function loadOperationRows(env: Env, siteId: string, visibleStudentIds: string[] | null): Promise<RawOperationRow[]> {
  const scope = buildStudentScopeSql(siteId, visibleStudentIds);
  const rows = await env.DB.prepare(
    `${scope.sql}
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
       CASE WHEN EXISTS (
         SELECT 1 FROM mentor_assignments
         WHERE mentor_assignments.student_user_id = scoped_students.student_id
          AND mentor_assignments.active = 1
       ) THEN 1 ELSE 0 END AS has_active_mentor,
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
         FROM progress_records
         WHERE progress_records.student_id = scoped_students.student_id
       ) AS progress_total,
       (
         SELECT COUNT(*)
         FROM progress_records
         WHERE progress_records.student_id = scoped_students.student_id
          AND progress_records.status IN ('approved', 'archived')
       ) AS progress_complete,
       (
         SELECT presentation_slots.status
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = scoped_students.student_id
          AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC, presentation_slots.created_at DESC
         LIMIT 1
       ) AS presentation_status_raw,
       (
         SELECT presentation_slots.outline_status
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = scoped_students.student_id
          AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC, presentation_slots.created_at DESC
         LIMIT 1
       ) AS presentation_outline_status_raw,
       (
         SELECT presentation_slots.scheduled_for
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = scoped_students.student_id
          AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC, presentation_slots.created_at DESC
         LIMIT 1
       ) AS presentation_scheduled_for,
       (
         SELECT presentation_slots.location
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = scoped_students.student_id
          AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC, presentation_slots.created_at DESC
         LIMIT 1
       ) AS presentation_location,
       (
         SELECT presentation_slots.checked_out_at
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = scoped_students.student_id
          AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC, presentation_slots.created_at DESC
         LIMIT 1
       ) AS presentation_checked_out_at,
       (
         SELECT presentation_slots.checked_in_at
         FROM presentation_slots
         WHERE presentation_slots.student_user_id = scoped_students.student_id
          AND presentation_slots.status != 'cancelled'
         ORDER BY presentation_slots.scheduled_for DESC, presentation_slots.created_at DESC
         LIMIT 1
       ) AS presentation_checked_in_at,
       (
         SELECT exports.status
         FROM exports
         WHERE exports.export_type IN ('student_archive', 'student_archive_manifest')
          AND exports.target_user_id = scoped_students.student_id
         ORDER BY exports.created_at DESC
         LIMIT 1
       ) AS latest_export_status,
       (
         SELECT exports.created_at
         FROM exports
         WHERE exports.export_type IN ('student_archive', 'student_archive_manifest')
          AND exports.target_user_id = scoped_students.student_id
         ORDER BY exports.created_at DESC
         LIMIT 1
       ) AS latest_export_created_at,
       (
         SELECT exports.completed_at
         FROM exports
         WHERE exports.export_type IN ('student_archive', 'student_archive_manifest')
          AND exports.target_user_id = scoped_students.student_id
         ORDER BY exports.created_at DESC
         LIMIT 1
       ) AS latest_export_completed_at,
       (
         SELECT export_artifacts.expires_at
         FROM export_artifacts
         WHERE export_artifacts.export_id = (
           SELECT exports.id
           FROM exports
           WHERE exports.export_type IN ('student_archive', 'student_archive_manifest')
            AND exports.target_user_id = scoped_students.student_id
           ORDER BY exports.created_at DESC
           LIMIT 1
         )
          AND export_artifacts.artifact_type = 'student_archive_manifest_json'
         ORDER BY export_artifacts.created_at DESC
         LIMIT 1
       ) AS latest_export_artifact_expires_at,
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
           WHERE exports.export_type IN ('student_archive', 'student_archive_manifest')
            AND exports.target_user_id = scoped_students.student_id
            AND exports.status = 'failed'
         ) THEN 3 ELSE 0 END
         + CASE WHEN scoped_students.display_name LIKE 'High Risk Demo%' THEN 2 ELSE 0 END
       ) AS risk_score
     FROM scoped_students
     ORDER BY scoped_students.display_name ASC, scoped_students.student_id ASC`,
  ).bind(...scope.binds).all<RawOperationRow>();
  return rows.results || [];
}

function buildStudentScopeSql(siteId: string, visibleStudentIds: string[] | null): { sql: string; binds: string[] } {
  const binds = [siteId];
  let visibleClause = "";
  if (visibleStudentIds) {
    if (visibleStudentIds.length === 0) {
      visibleClause = "AND 1 = 0";
    } else {
      visibleClause = `AND student.id IN (${visibleStudentIds.map(() => "?").join(", ")})`;
      binds.push(...visibleStudentIds);
    }
  }

  return {
    sql: `WITH scoped_students AS (
       SELECT DISTINCT
        site_users.site_id,
        sites.name AS site_name,
        student.id AS student_id,
        student.display_name,
        student.email
       FROM site_users
       JOIN sites ON sites.id = site_users.site_id
        AND sites.status = 'active'
       JOIN user_accounts student ON student.id = site_users.user_id
        AND student.status = 'active'
       JOIN user_roles student_role ON student_role.user_id = student.id
        AND student_role.role_id = 'student'
       WHERE site_users.site_id = ?
        AND site_users.membership_status = 'active'
        ${visibleClause}
     )`,
    binds,
  };
}

function formatOperationRow(
  row: RawOperationRow,
  options: {
    providerStatus: string;
    archiveProviderReady: boolean;
    expiryWarningDays: number;
  },
): OperationStudentRow {
  const latestStatus = canonicalStudentStatus(row.latest_submission_status || "draft");
  const riskScore = Number(row.risk_score || 0);
  const riskFlags = riskFlagsFor(row);
  const presentationStatus = presentationStatusFor(row, latestStatus);
  const archiveStatus = archiveStatusFor(row, options);
  const readiness = readinessFor(row, latestStatus, presentationStatus, archiveStatus, riskScore, riskFlags);
  const downloadReady = Boolean(
    row.latest_export_status === "complete"
    && row.latest_export_artifact_expires_at
    && !archiveArtifactExpired(row.latest_export_artifact_expires_at),
  );
  const downloadExpiresSoon = archiveArtifactExpiresSoon(row.latest_export_artifact_expires_at, {
    warningDays: options.expiryWarningDays,
  });

  return {
    studentId: row.student_id,
    studentName: safeText(row.display_name, 160),
    email: row.email,
    siteId: row.site_id,
    siteName: row.site_name,
    programId: row.program_id || "unassigned",
    programName: row.program_name || "Unassigned",
    cohortId: row.cohort_id || "",
    cohortName: row.cohort_name || "",
    storyBucket: row.story_bucket || "",
    riskScore,
    riskFlags,
    latestSubmissionStatus: latestStatus,
    latestActivityAt: row.latest_submission_updated_at || "",
    hasActiveMentor: Number(row.has_active_mentor || 0) === 1,
    evidenceCount: Number(row.evidence_count || 0),
    presentationStatus,
    scheduledFor: row.presentation_scheduled_for || "",
    location: row.presentation_location || "",
    outlineStatus: canonicalOutlineStatus(row.presentation_outline_status_raw),
    checkInStatus: checkInStatusFor(row),
    archiveStatus,
    exportStatus: row.latest_export_status || "not_requested",
    providerStatus: options.providerStatus,
    downloadReady,
    downloadExpiresSoon,
    readinessStatus: readiness.status,
    readinessCategory: readiness.category,
    reason: readiness.reason,
    owner: readiness.owner,
    nextAction: readiness.nextAction,
  };
}

function presentationStatusFor(row: RawOperationRow, latestStatus: string): string {
  const rawStatus = String(row.presentation_status_raw || "");
  const outline = canonicalOutlineStatus(row.presentation_outline_status_raw);
  if (rawStatus === "completed") return "completed";
  if (rawStatus === "checked_out" && !row.presentation_checked_in_at) return "attention_required";
  if (["scheduled", "checked_out", "checked_in"].includes(rawStatus) && outline === "revision_needed") return "outline_revision_needed";
  if (["scheduled", "checked_out", "checked_in"].includes(rawStatus) && outline === "pending") return "outline_pending";
  if (["scheduled", "checked_out", "checked_in"].includes(rawStatus)) return "scheduled";
  if (latestStatus === "approved" || latestStatus === "archived" || latestStatus === "complete") return "ready";
  if (row.story_bucket === "presentation_pending") return "pending";
  return "missing";
}

function archiveStatusFor(
  row: RawOperationRow,
  options: { archiveProviderReady: boolean; expiryWarningDays: number },
): string {
  const exportStatus = String(row.latest_export_status || "");
  if (exportStatus === "failed") return "failed";
  if (exportStatus === "queued") return "queued";
  if (exportStatus === "running") return "running";
  if (exportStatus === "complete") {
    if (archiveArtifactExpired(row.latest_export_artifact_expires_at)) return "expired";
    if (archiveArtifactExpiresSoon(row.latest_export_artifact_expires_at, { warningDays: options.expiryWarningDays })) return "expiring_soon";
    return "complete";
  }
  if (row.story_bucket === "archive_ready" && !options.archiveProviderReady) return "provider_unavailable";
  if (row.story_bucket === "archive_ready") return "ready";
  return "missing";
}

function readinessFor(
  row: RawOperationRow,
  latestStatus: string,
  presentationStatus: string,
  archiveStatus: string,
  riskScore: number,
  riskFlags: string[],
) {
  if (archiveStatus === "failed" || archiveStatus === "provider_unavailable") {
    return {
      status: "blocked",
      category: "archive",
      reason: "Archive export failed or provider setup is unavailable.",
      owner: "Archive operations",
      nextAction: "Review archive failure details before completion.",
    };
  }
  if (riskScore >= 7 || riskFlags.includes("stale")) {
    return {
      status: "attention_required",
      category: "risk",
      reason: "High risk or stale capstone activity needs staff follow-up.",
      owner: "Site administration",
      nextAction: "Open student detail and confirm the current blocker.",
    };
  }
  if (!Number(row.has_active_mentor || 0)) {
    return {
      status: "attention_required",
      category: "mentor",
      reason: "Student does not have an active mentor assignment.",
      owner: "Site administration",
      nextAction: "Assign or confirm mentor coverage.",
    };
  }
  if (latestStatus === "submitted") {
    return {
      status: "attention_required",
      category: "review",
      reason: "Submitted work is waiting for teacher review.",
      owner: "Program teacher",
      nextAction: "Review the submission in the teacher review queue.",
    };
  }
  if (latestStatus === "revision_requested") {
    return {
      status: "attention_required",
      category: "review",
      reason: "Revision feedback is open.",
      owner: "Program teacher",
      nextAction: "Check revision feedback and next student action.",
    };
  }
  if (["outline_pending", "outline_revision_needed", "attention_required", "pending"].includes(presentationStatus)) {
    return {
      status: "attention_required",
      category: "presentation",
      reason: "Presentation readiness needs outline, schedule, or check-in follow-up.",
      owner: "Site administration",
      nextAction: "Review presentation readiness before completion.",
    };
  }
  if (["ready", "complete", "expiring_soon"].includes(archiveStatus) && ["completed", "scheduled", "ready"].includes(presentationStatus)) {
    return {
      status: archiveStatus === "complete" && presentationStatus === "completed" ? "complete" : "ready",
      category: "completion",
      reason: "Presentation and archive readiness are in a completion-ready state.",
      owner: "Site administration",
      nextAction: archiveStatus === "expiring_soon" ? "Confirm archive download window before it expires." : "Continue closeout monitoring.",
    };
  }
  if (latestStatus === "draft" && Number(row.evidence_count || 0) === 0) {
    return {
      status: "missing",
      category: "evidence",
      reason: "Evidence or submission progress is missing.",
      owner: "Student",
      nextAction: "Check student progress and evidence requirements.",
    };
  }
  return {
    status: "in_progress",
    category: "readiness",
    reason: "Student is still progressing toward presentation and archive closeout.",
    owner: "Site administration",
    nextAction: "Continue normal capstone monitoring.",
  };
}

function matchesFilters(row: OperationStudentRow, filters: OperationFilters): boolean {
  if (filters.studentId && row.studentId !== filters.studentId) return false;
  if (filters.programId && row.programId !== filters.programId) return false;
  if (filters.status && row.latestSubmissionStatus !== filters.status) return false;
  if (filters.story && row.storyBucket !== filters.story) return false;
  if (filters.risk && !matchesRisk(row, filters.risk)) return false;
  if (filters.presentationStatus && !matchesPresentationStatus(row.presentationStatus, filters.presentationStatus)) return false;
  if (filters.archiveStatus && !matchesArchiveStatus(row.archiveStatus, filters.archiveStatus)) return false;
  if (filters.readiness && row.readinessStatus !== filters.readiness) return false;
  if (filters.category && row.readinessCategory !== filters.category) return false;
  if (filters.needsAttention && !shouldShowAttentionRow(row)) return false;
  if (filters.outlineAttention && !shouldShowOutlineAttentionRow(row)) return false;
  return true;
}

function matchesRisk(row: OperationStudentRow, risk: string): boolean {
  if (risk === "high") return row.riskScore >= 7 || row.riskFlags.includes("high");
  if (risk === "medium") return row.riskScore >= 4 && row.riskScore <= 6;
  if (risk === "low") return row.riskScore >= 1 && row.riskScore <= 3;
  if (risk === "stale") return row.riskFlags.includes("stale");
  if (risk === "no_mentor") return row.riskFlags.includes("no_mentor");
  return true;
}

function matchesPresentationStatus(actual: string, filter: string): boolean {
  if (filter === "pending") return ["pending", "outline_pending", "outline_revision_needed", "attention_required"].includes(actual);
  return actual === filter;
}

function matchesArchiveStatus(actual: string, filter: string): boolean {
  if (filter === "failed") return ["failed", "provider_unavailable"].includes(actual);
  if (filter === "ready") return ["ready", "complete", "expiring_soon"].includes(actual);
  if (filter === "in_progress") return ["queued", "running"].includes(actual);
  return actual === filter;
}

function compareOperationRows(left: OperationStudentRow, right: OperationStudentRow): number {
  const rank = (row: OperationStudentRow) => {
    if (row.readinessStatus === "blocked") return 0;
    if (row.readinessStatus === "attention_required") return 1;
    if (row.presentationStatus === "outline_revision_needed" || row.archiveStatus === "failed") return 2;
    if (row.readinessStatus === "missing") return 3;
    if (row.readinessStatus === "ready") return 4;
    if (row.readinessStatus === "complete") return 5;
    return 6;
  };
  const rankDiff = rank(left) - rank(right);
  if (rankDiff !== 0) return rankDiff;
  const riskDiff = right.riskScore - left.riskScore;
  if (riskDiff !== 0) return riskDiff;
  return left.studentName.localeCompare(right.studentName) || left.studentId.localeCompare(right.studentId);
}

function summarizeRows(rows: OperationStudentRow[]) {
  const presentation = {
    ready: 0,
    scheduled: 0,
    pending: 0,
    completed: 0,
    missing: 0,
    outlinePending: 0,
    outlineRevisionNeeded: 0,
    attentionRequired: 0,
  };
  const archive = {
    ready: 0,
    missing: 0,
    failed: 0,
    complete: 0,
    queued: 0,
    running: 0,
    expired: 0,
    expiringSoon: 0,
    providerUnavailable: 0,
  };
  const readiness = {
    ready: 0,
    inProgress: 0,
    attentionRequired: 0,
    blocked: 0,
    missing: 0,
    complete: 0,
  };

  for (const row of rows) {
    if (row.presentationStatus === "ready") presentation.ready++;
    else if (row.presentationStatus === "scheduled") presentation.scheduled++;
    else if (row.presentationStatus === "pending") presentation.pending++;
    else if (row.presentationStatus === "completed") presentation.completed++;
    else if (row.presentationStatus === "outline_pending") presentation.outlinePending++;
    else if (row.presentationStatus === "outline_revision_needed") presentation.outlineRevisionNeeded++;
    else if (row.presentationStatus === "attention_required") presentation.attentionRequired++;
    else presentation.missing++;

    if (row.archiveStatus === "ready") archive.ready++;
    else if (row.archiveStatus === "complete") archive.complete++;
    else if (row.archiveStatus === "failed") archive.failed++;
    else if (row.archiveStatus === "queued") archive.queued++;
    else if (row.archiveStatus === "running") archive.running++;
    else if (row.archiveStatus === "expired") archive.expired++;
    else if (row.archiveStatus === "expiring_soon") archive.expiringSoon++;
    else if (row.archiveStatus === "provider_unavailable") archive.providerUnavailable++;
    else archive.missing++;

    if (row.readinessStatus === "ready") readiness.ready++;
    else if (row.readinessStatus === "attention_required") readiness.attentionRequired++;
    else if (row.readinessStatus === "blocked") readiness.blocked++;
    else if (row.readinessStatus === "missing") readiness.missing++;
    else if (row.readinessStatus === "complete") readiness.complete++;
    else readiness.inProgress++;
  }

  return {
    presentation,
    archive,
    readiness,
    highRisk: rows.filter((row) => row.riskScore >= 7 || row.riskFlags.includes("high")).length,
    staleActivity: rows.filter((row) => row.riskFlags.includes("stale")).length,
    evidenceMissing: rows.filter((row) => row.readinessCategory === "evidence" && row.readinessStatus === "missing").length,
    needsAttention: rows.filter((row) => ["blocked", "attention_required", "missing"].includes(row.readinessStatus)).length,
  };
}

function programBreakdown(rows: OperationStudentRow[]): ProgramBreakdownRow[] {
  const byProgram = new Map<string, ProgramBreakdownRow>();
  for (const row of rows) {
    const key = row.programId || "unassigned";
    const entry = byProgram.get(key) || {
      programId: row.programId,
      programName: row.programName,
      studentsTotal: 0,
      presentationPending: 0,
      archiveReady: 0,
      archiveFailed: 0,
      needsAttention: 0,
    };
    entry.studentsTotal++;
    if (["pending", "outline_pending", "outline_revision_needed", "attention_required"].includes(row.presentationStatus)) entry.presentationPending++;
    if (["ready", "complete", "expiring_soon"].includes(row.archiveStatus)) entry.archiveReady++;
    if (["failed", "provider_unavailable"].includes(row.archiveStatus)) entry.archiveFailed++;
    if (["blocked", "attention_required", "missing"].includes(row.readinessStatus)) entry.needsAttention++;
    byProgram.set(key, entry);
  }
  return Array.from(byProgram.values()).sort((left, right) => left.programName.localeCompare(right.programName));
}

function nextActions(rows: OperationStudentRow[]) {
  const byAction = new Map<string, { owner: string; nextAction: string; count: number; category: string }>();
  for (const row of rows.filter(shouldShowAttentionRow)) {
    const key = `${row.readinessCategory}:${row.nextAction}`;
    const entry = byAction.get(key) || {
      owner: row.owner,
      nextAction: row.nextAction,
      count: 0,
      category: row.readinessCategory,
    };
    entry.count++;
    byAction.set(key, entry);
  }
  return Array.from(byAction.values()).sort((left, right) => right.count - left.count).slice(0, 8);
}

function presentationResponse(row: OperationStudentRow) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programId: row.programId,
    programName: row.programName,
    cohortId: row.cohortId,
    cohortName: row.cohortName,
    storyBucket: row.storyBucket,
    riskScore: row.riskScore,
    riskFlags: row.riskFlags,
    presentationStatus: row.presentationStatus,
    scheduledFor: row.scheduledFor,
    location: row.location,
    outlineStatus: row.outlineStatus,
    checkInStatus: row.checkInStatus,
    reason: presentationReason(row),
    owner: row.owner,
    nextAction: row.nextAction,
  };
}

function archiveResponse(row: OperationStudentRow) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programId: row.programId,
    programName: row.programName,
    storyBucket: row.storyBucket,
    riskScore: row.riskScore,
    riskFlags: row.riskFlags,
    archiveStatus: row.archiveStatus,
    exportStatus: row.exportStatus,
    ready: ["ready", "complete", "expiring_soon"].includes(row.archiveStatus),
    failed: ["failed", "provider_unavailable"].includes(row.archiveStatus),
    providerStatus: row.providerStatus,
    downloadReady: row.downloadReady,
    downloadExpiresSoon: row.downloadExpiresSoon,
    storageIdentifiersRedacted: true,
    reason: archiveReason(row),
    owner: row.owner,
    nextAction: row.nextAction,
  };
}

function attentionResponse(row: OperationStudentRow) {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    programId: row.programId,
    programName: row.programName,
    category: row.readinessCategory,
    status: row.readinessStatus,
    reason: row.reason,
    owner: row.owner,
    nextAction: row.nextAction,
  };
}

function shouldShowPresentationRow(row: OperationStudentRow): boolean {
  return row.presentationStatus !== "missing" || ["presentation_pending", "high_risk", "rich_timeline"].includes(row.storyBucket);
}

function shouldShowArchiveRow(row: OperationStudentRow): boolean {
  return row.archiveStatus !== "missing" || ["archive_ready", "archive_failed", "rich_timeline"].includes(row.storyBucket);
}

function shouldShowAttentionRow(row: OperationStudentRow): boolean {
  return ["blocked", "attention_required", "missing"].includes(row.readinessStatus);
}

function shouldShowOutlineAttentionRow(row: OperationStudentRow): boolean {
  return ["outline_pending", "outline_revision_needed"].includes(row.presentationStatus);
}

function riskFlagsFor(row: RawOperationRow): string[] {
  const flags = [];
  if (!Number(row.has_active_mentor || 0)) flags.push("no_mentor");
  if (row.latest_submission_status === "revision_requested") flags.push("revision_requested");
  if (row.latest_submission_status === "submitted") flags.push("awaiting_review");
  if (row.presentation_outline_status_raw === "pending" || row.presentation_outline_status_raw === "revision_needed") flags.push("presentation_pending");
  if (row.latest_export_status === "failed") flags.push("archive_failed");
  if (Number(row.stale_flag || 0) === 1) flags.push("stale");
  if (Number(row.risk_score || 0) >= 7) flags.push("high");
  return flags;
}

function presentationReason(row: OperationStudentRow): string {
  if (row.presentationStatus === "outline_revision_needed") return "Presentation outline needs revision.";
  if (row.presentationStatus === "outline_pending") return "Presentation outline is pending approval.";
  if (row.presentationStatus === "attention_required") return "Presentation check-in/check-out needs staff attention.";
  if (row.presentationStatus === "ready") return "Student appears ready to schedule presentation.";
  if (row.presentationStatus === "scheduled") return "Presentation is scheduled.";
  if (row.presentationStatus === "completed") return "Presentation is complete.";
  return "No active presentation slot is recorded.";
}

function archiveReason(row: OperationStudentRow): string {
  if (row.archiveStatus === "failed") return "Archive export failed and needs staff follow-up.";
  if (row.archiveStatus === "provider_unavailable") return "Archive provider setup is unavailable.";
  if (row.archiveStatus === "expiring_soon") return "Archive package is ready, but its download window is expiring soon.";
  if (row.archiveStatus === "expired") return "Archive package download window expired.";
  if (row.archiveStatus === "complete") return "Archive package is complete and scoped download is available when permitted.";
  if (row.archiveStatus === "ready") return "Student is archive-ready based on closeout story/progress.";
  if (row.archiveStatus === "queued" || row.archiveStatus === "running") return "Archive package is in progress.";
  return "Archive package has not been requested or readiness is still missing.";
}

function checkInStatusFor(row: RawOperationRow): string {
  if (row.presentation_status_raw === "completed") return "completed";
  if (row.presentation_checked_in_at) return "checked_in";
  if (row.presentation_checked_out_at) return "checked_out";
  return row.presentation_status_raw || "missing";
}

function canonicalStudentStatus(status: string): string {
  if (status === "archived") return "archived";
  if (STUDENT_STATUS_VALUES.includes(status)) return status;
  return "draft";
}

function canonicalOutlineStatus(status: string | null): string {
  if (status === "approved" || status === "revision_needed") return status;
  return "pending";
}

function parseFilters(params: URLSearchParams): OperationFilters {
  return {
    studentId: cleanId(params.get("studentId")),
    programId: cleanId(params.get("programId")),
    status: canonical(params.get("status"), STUDENT_STATUS_VALUES),
    story: canonical(params.get("story"), STORY_VALUES),
    risk: canonical(params.get("risk"), RISK_VALUES),
    presentationStatus: canonical(params.get("presentationStatus"), PRESENTATION_STATUS_VALUES),
    archiveStatus: canonical(params.get("archiveStatus"), ARCHIVE_STATUS_VALUES),
    readiness: canonical(params.get("readiness"), READINESS_VALUES),
    category: canonical(params.get("category"), CATEGORY_VALUES),
    needsAttention: booleanFilter(params.get("needsAttention")),
    outlineAttention: booleanFilter(params.get("outlineAttention")),
    limit: clampNumber(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: clampNumber(params.get("offset"), 0, 0, 100000),
  };
}

async function loadPermissions(env: Env, user: UserAccount, siteId: string) {
  return {
    canViewPresentationOperations: await canViewPresentationOperations(env, user, siteId),
    canManagePresentationOperations: false,
    canViewArchiveOperations: await canViewArchiveOperations(env, user, siteId),
    canManageArchiveOperations: false,
    canViewReadinessReports: await canViewReadinessReports(env, user, siteId),
    canViewStudentDetail: true,
    canManageUsers: await canManageUsers(env, user),
    canManageSecurity: await canManageSecurity(env, user),
  };
}

async function canViewOperationsSite(env: Env, user: UserAccount, siteId: string): Promise<boolean> {
  return await canViewPresentationOperations(env, user, siteId)
    && await canViewArchiveOperations(env, user, siteId)
    && await canViewReadinessReports(env, user, siteId);
}

function canUseOperationsRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration", "program_teacher"].includes(roleId));
}

function hasAnyAdminLikeRole(roleIds: RoleId[]): boolean {
  return roleIds.some((roleId) => ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration"].includes(roleId));
}

function canonical(value: string | null, allowed: string[]): string {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : "";
}

function clampNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function booleanFilter(value: string | null): boolean {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function safeText(value: string | null | undefined, maxLength: number): string {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeFilterSummary(filters: OperationFilters) {
  return {
    studentId: filters.studentId,
    programId: filters.programId,
    status: filters.status,
    story: filters.story,
    risk: filters.risk,
    presentationStatus: filters.presentationStatus,
    archiveStatus: filters.archiveStatus,
    readiness: filters.readiness,
    category: filters.category,
    needsAttention: filters.needsAttention,
    outlineAttention: filters.outlineAttention,
    limit: filters.limit,
    offset: filters.offset,
  };
}

async function auditOperations(
  env: Env,
  request: Request,
  user: UserAccount | null,
  context: AuditContext | null,
  action: string,
  metadata: Record<string, unknown>,
) {
  try {
    await writeAudit(env, {
      actorUserId: user?.id || null,
      action,
      entityType: "site_operations_readiness",
      entityId: typeof metadata.siteId === "string" ? metadata.siteId : null,
      request,
      metadata: {
        ...metadata,
        role: context?.primaryRole || null,
        roleScopes: context?.roles.map((role) => ({
          roleId: role.role_id,
          scopeType: role.scope_type,
          scopeId: role.scope_id || "",
        })) || [],
      },
    });
  } catch {
    // Audit failure should not block read-only operations worklists.
  }
}
