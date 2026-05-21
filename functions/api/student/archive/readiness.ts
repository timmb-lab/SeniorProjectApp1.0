import type { Env } from "../../../_types.ts";
import { archiveArtifactExpiresSoon, archiveArtifactExpired, getArchiveProviderConfiguration, getArchiveRetentionPolicy } from "../../../_lib/archive-export.ts";
import { getCurrentUser, writeAudit } from "../../../_lib/auth.ts";
import { json } from "../../../_lib/http.ts";
import { canAccessStudent, getRoleAssignments } from "../../../_lib/permissions.ts";
import { cleanWorkflowText, workflowError } from "../../../_lib/workflow.ts";

interface ProgressRow {
  requirement_id: string | null;
  phase: string;
  status: string;
  updated_at: string;
  requirement_title: string | null;
}

interface EvidenceRow {
  artifact_type: string;
  source_kind: string;
  title: string;
  review_status: string;
  created_at: string;
  requirement_id: string | null;
}

interface ExportRow {
  id: string;
  status: string;
  drive_file_id: string | null;
  created_at: string;
  completed_at: string | null;
  artifact_id: string | null;
  artifact_expires_at: string | null;
}

interface StudentRow {
  id: string;
  display_name: string;
}

interface ArchiveCheckDefinition {
  id: string;
  label: string;
  requirementIds: string[];
  evidenceTerms: string[];
  minEvidence: number;
  minReadyRequirements?: number;
  attentionMessage?: string;
}

const REFLECTION_REQUIREMENTS = [
  "req-reflection-best-work",
  "req-reflection-senior-project",
  "req-reflection-tenet-mastery",
  "req-reflection-project-based-learning",
  "req-reflection-next-year-plan",
];

const CHECKS: ArchiveCheckDefinition[] = [
  {
    id: "celebration_evidence",
    label: "Celebration Day evidence",
    requirementIds: ["req-celebration-day"],
    evidenceTerms: ["celebration", "display", "setup", "photo", "ingredient"],
    minEvidence: 1,
  },
  {
    id: "thank_you_and_mentor_note",
    label: "Thank-you letter and mentor note",
    requirementIds: ["req-thanks-and-thanks"],
    evidenceTerms: ["thank", "letter", "mentor_note", "mentor note"],
    minEvidence: 1,
  },
  {
    id: "reflection_portfolio",
    label: "Reflections and portfolio",
    requirementIds: REFLECTION_REQUIREMENTS,
    evidenceTerms: ["reflection", "portfolio", "best work", "final product"],
    minEvidence: 5,
    minReadyRequirements: 5,
  },
  {
    id: "ingredient_list_if_needed",
    label: "Ingredient list if food is shared",
    requirementIds: ["req-celebration-day"],
    evidenceTerms: ["ingredient", "food", "allergen", "menu"],
    minEvidence: 1,
    attentionMessage: "Needed when food is part of the Celebration Day display.",
  },
];

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);

  const url = new URL(request.url);
  const requestedStudentId = cleanWorkflowText(url.searchParams.get("studentId"), user.id, 160);
  const roleAssignments = await getRoleAssignments(env, user.id);
  const accessAllowed = await canAccessStudent(env, user, requestedStudentId);

  if (!accessAllowed) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "student_archive_readiness_denied",
      entityType: "student_archive_readiness",
      entityId: requestedStudentId,
      request,
      metadata: {
        actorRoleScopes: safeRoleScopes(roleAssignments),
      },
    });
    return workflowError("forbidden", 403);
  }

  const student = await env.DB.prepare(
    "SELECT id, display_name FROM user_accounts WHERE id = ? AND status = 'active'",
  ).bind(requestedStudentId).first<StudentRow>();
  if (!student) return workflowError("student_not_found", 404);

  const [progress, evidence, exports] = await Promise.all([
    env.DB.prepare(
      `SELECT
         progress.requirement_id,
         progress.phase,
         progress.status,
         progress.updated_at,
         requirements.title AS requirement_title
       FROM progress_records progress
       LEFT JOIN requirements ON requirements.id = progress.requirement_id
       WHERE progress.student_id = ?
         AND (
           progress.phase = 'reflection-and-archive'
           OR progress.requirement_id IN (
             'req-celebration-day',
             'req-thanks-and-thanks',
             'req-personal-archive-export',
             'req-reflection-best-work',
             'req-reflection-senior-project',
             'req-reflection-tenet-mastery',
             'req-reflection-project-based-learning',
             'req-reflection-next-year-plan'
           )
         )
       ORDER BY progress.updated_at DESC`,
    ).bind(requestedStudentId).all<ProgressRow>(),
    env.DB.prepare(
      `SELECT
         evidence.artifact_type,
         evidence.source_kind,
         evidence.title,
         evidence.review_status,
         evidence.created_at,
         submissions.requirement_id
       FROM evidence_artifacts evidence
       LEFT JOIN submissions ON submissions.id = evidence.submission_id
       WHERE evidence.student_id = ?
         AND evidence.deleted_at IS NULL
         AND evidence.review_status != 'archived'
       ORDER BY evidence.created_at DESC`,
    ).bind(requestedStudentId).all<EvidenceRow>(),
    env.DB.prepare(
      `SELECT
         exports.id,
         exports.status,
         exports.drive_file_id,
         exports.created_at,
         exports.completed_at,
         artifact.id AS artifact_id,
         artifact.expires_at AS artifact_expires_at
       FROM exports
       LEFT JOIN export_artifacts artifact
         ON artifact.export_id = exports.id
        AND artifact.artifact_type = 'student_archive_manifest_json'
       WHERE exports.export_type = 'student_archive'
         AND exports.target_user_id = ?
       ORDER BY exports.created_at DESC
       LIMIT 5`,
    ).bind(requestedStudentId).all<ExportRow>(),
  ]);

  const progressRows = progress.results || [];
  const evidenceRows = evidence.results || [];
  const exportRows = exports.results || [];
  const checks = CHECKS.map((definition) => archiveCheck(definition, progressRows, evidenceRows));
  const latestExport = exportRows[0] || null;
  const provider = getArchiveProviderConfiguration(env);
  const retention = getArchiveRetentionPolicy(env);
  const signedDownloadsEnabled = false;
  const drivePackageReady = Boolean(latestExport?.status === "complete" && latestExport.drive_file_id);
  const scopedDownloadReady = Boolean(
    latestExport?.status === "complete" &&
    latestExport.artifact_id &&
    !archiveArtifactExpired(latestExport.artifact_expires_at),
  );
  const downloadExpiresSoon = archiveArtifactExpiresSoon(latestExport?.artifact_expires_at, {
    warningDays: retention.expiryWarningDays,
  });
  const exportStatus = latestExport?.status || "not_requested";
  const readyChecks = checks.filter((check) => check.status === "ready").length;
  const missingChecks = checks.filter((check) => check.status === "missing").length;
  const archiveAvailableToRequest = missingChecks === 0 && provider.ready && !["queued", "running"].includes(exportStatus);

  await writeAudit(env, {
    actorUserId: user.id,
    action: "student_archive_readiness_viewed",
    entityType: "student_archive_readiness",
    entityId: requestedStudentId,
    request,
    metadata: {
      readyChecks,
      missingChecks,
      exportStatus,
      scopedDownloadReady,
      drivePackageReady,
      providerStatus: provider.status,
      viewerScope: viewerScope(env, user, requestedStudentId, roleAssignments),
    },
  });

  return json({
    ok: true,
    studentId: requestedStudentId,
    studentName: student.display_name,
    source: "persisted_rows",
    viewer: {
      id: user.id,
      self: user.id === requestedStudentId,
      scope: viewerScope(env, user, requestedStudentId, roleAssignments),
    },
    storage: {
      provider: "google_drive",
      providerStatus: provider.status,
      providerMessage: provider.message,
      rootConfigured: provider.rootConfigured,
      indexConfigured: provider.indexConfigured,
      credentialsConfigured: provider.credentialParts.clientEmail && provider.credentialParts.privateKey,
      signedDownloadsEnabled,
      scopedPackageDownloadsEnabled: true,
      drivePackageReady,
      storageIdentifiersRedacted: true,
    },
    retention: {
      downloadWindowDays: retention.downloadWindowDays,
      expiryWarningDays: retention.expiryWarningDays,
      policyStatus: retention.policyStatus,
      policyReviewRequired: retention.policyReviewRequired,
      downloadExpiresSoon,
    },
    summary: {
      readyChecks,
      totalChecks: checks.length,
      missingChecks,
      archiveAvailableToRequest,
    },
    checks,
    archive: {
      status: exportStatus,
      latestExportId: latestExport?.id || null,
      requestedAt: latestExport?.created_at || null,
      completedAt: latestExport?.completed_at || null,
      scopedDownloadReady,
      drivePackageReady,
      downloadUrl: scopedDownloadReady ? `/api/exports/${latestExport?.id}/download` : null,
      downloadExpiresAt: latestExport?.artifact_expires_at || null,
      downloadExpired: Boolean(
        latestExport?.artifact_id &&
        archiveArtifactExpired(latestExport.artifact_expires_at),
      ),
      downloadExpiresSoon,
      signedDownloadReady: Boolean(
        signedDownloadsEnabled &&
        latestExport?.drive_file_id &&
        latestExport.status === "complete"
      ),
      message: archiveMessage(
        exportStatus,
        provider.ready,
        signedDownloadsEnabled,
        scopedDownloadReady,
        Boolean(latestExport?.artifact_id && archiveArtifactExpired(latestExport.artifact_expires_at)),
        downloadExpiresSoon,
      ),
    },
    guardrails: [
      "Archive readiness is derived from D1 progress, evidence, and export rows.",
      "Private Drive storage identifiers are not returned.",
      "Archive readiness views and denied access are audited.",
    ],
  });
};

function archiveCheck(definition: ArchiveCheckDefinition, progress: ProgressRow[], evidence: EvidenceRow[]) {
  const requirementProgress = progress.filter((row) => row.requirement_id && definition.requirementIds.includes(row.requirement_id));
  const matchingEvidence = evidence.filter((row) => matchesEvidence(row, definition));
  const readyRequirementCount = requirementProgress.filter((row) => readyProgressStatuses.has(row.status)).length;
  const inProgressRequirementCount = requirementProgress.filter((row) => inProgressStatuses.has(row.status)).length;
  const minReadyRequirements = definition.minReadyRequirements || 1;
  const status = readyRequirementCount >= minReadyRequirements || matchingEvidence.length >= definition.minEvidence
    ? "ready"
    : inProgressRequirementCount > 0 || matchingEvidence.length > 0
      ? "in_progress"
      : definition.attentionMessage
        ? "attention_required"
        : "missing";

  return {
    id: definition.id,
    label: definition.label,
    status,
    evidenceCount: matchingEvidence.length,
    readyRequirementCount,
    totalRequirementCount: definition.requirementIds.length,
    latestEvidenceAt: matchingEvidence[0]?.created_at || null,
    message: definition.attentionMessage || messageForCheckStatus(status),
  };
}

const readyProgressStatuses = new Set(["submitted", "approved", "archived"]);
const inProgressStatuses = new Set(["in_progress", "revision_requested"]);

function matchesEvidence(row: EvidenceRow, definition: ArchiveCheckDefinition): boolean {
  if (row.requirement_id && definition.requirementIds.includes(row.requirement_id)) return true;
  const haystack = `${row.artifact_type || ""} ${row.title || ""}`.toLowerCase();
  return definition.evidenceTerms.some((term) => haystack.includes(term));
}

function messageForCheckStatus(status: string): string {
  if (status === "ready") return "Ready for archive review.";
  if (status === "in_progress") return "Started, but final review may still be needed.";
  return "Needs evidence or staff review before the archive package is ready.";
}

function archiveMessage(
  status: string,
  providerReady: boolean,
  signedDownloadsEnabled: boolean,
  scopedDownloadReady: boolean,
  downloadExpired: boolean,
  downloadExpiresSoon: boolean,
): string {
  if (downloadExpired) return "Archive package download expired. Ask an admin to generate a fresh package.";
  if (downloadExpiresSoon && scopedDownloadReady) return "Archive package manifest is ready, but the download window is expiring soon.";
  if (scopedDownloadReady) return "Archive package manifest is ready for scoped download.";
  if (!providerReady) return "Drive provider setup is unavailable, so archive package generation cannot complete yet.";
  if (!signedDownloadsEnabled) return "Archive package checks are available; signed archive links are still disabled until export generation is wired.";
  if (status === "complete") return "Archive package is complete and ready for a scoped download link.";
  if (status === "queued" || status === "running") return "Archive package is being prepared.";
  if (status === "failed") return "Archive package failed and needs staff follow-up.";
  return "Archive package has not been requested yet.";
}

function safeRoleScopes(roleAssignments: Awaited<ReturnType<typeof getRoleAssignments>>) {
  return roleAssignments.map((role) => ({
    roleId: role.role_id,
    scopeType: role.scope_type,
    scopeId: role.scope_id,
  }));
}

function viewerScope(
  _env: Env,
  user: { id: string },
  studentId: string,
  roleAssignments: Awaited<ReturnType<typeof getRoleAssignments>>,
): string {
  if (user.id === studentId && roleAssignments.some((role) => role.role_id === "student")) {
    return "student-own archive";
  }
  if (roleAssignments.some((role) => role.role_id === "admin")) return "admin archive";
  if (roleAssignments.some((role) => role.role_id === "program_teacher")) return "program-teacher scoped archive";
  if (roleAssignments.some((role) => role.role_id === "mentor")) return "mentor assigned archive";
  return "scoped archive";
}
