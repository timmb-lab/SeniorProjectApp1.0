import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canAccessStudent, getRoleAssignments, hasRole } from "../../_lib/permissions.ts";

interface ProgressRow {
  id: string;
  requirement_id: string | null;
  phase: string;
  status: string;
  updated_at: string;
  requirement_title: string | null;
}

interface SubmissionSummaryRow {
  id: string;
  requirement_id: string | null;
  status: string;
  version: number;
  submitted_at: string | null;
  updated_at: string;
  requirement_title: string | null;
}

interface EvidenceSummaryRow {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  external_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
}

interface EvidenceSummary {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
  fileBytesReady: boolean;
  downloadUrl: string | null;
  externalUrl: string | null;
  storageIdentifiersRedacted: true;
}

interface FeedbackRow {
  id: string;
  submission_id: string;
  requirement_title: string | null;
  decision: string;
  feedback: string | null;
  created_at: string;
  reviewer_name: string | null;
}

interface StudentFeedback {
  id: string;
  kind: "review";
  submissionId: string;
  requirementTitle: string;
  status: string;
  message: string;
  authorName: string;
  createdAt: string;
}

interface RequirementRow {
  id: string;
  program_id: string | null;
  phase: string;
  title: string;
  required: number;
  sort_order: number;
}

interface MentorSupportRow {
  mentor_name: string | null;
  created_at: string | null;
}

interface StudentProgressSummary {
  requirementsTotal: number;
  requirementsComplete: number;
  completionPercent: number;
  phasesTotal: number;
  phasesComplete: number;
  submittedRequiredCount: number;
  missingRequiredCount: number;
  waitingForReviewCount: number;
  revisionRequestedCount: number;
  currentPhase: string;
  currentPhaseLabel: string;
  currentStatus: string;
  lastUpdatedAt: string | null;
  mentor: {
    assigned: boolean;
    name: string | null;
    message: string;
  };
  dueDatesAvailable: false;
}

interface StudentNextStep {
  title: string;
  status: string;
  detail: string;
  dueDate: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const requestedStudentId = url.searchParams.get("studentId") || null;
  const user = await getCurrentUser(request, env);
  if (!user) {
    await auditDashboardAccess(env, request, null, "student_dashboard_unauthorized", requestedStudentId, {
      reason: "missing_session",
    });
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const studentId = requestedStudentId || user.id;
  if (!await canAccessStudent(env, user, studentId)) {
    await auditDashboardAccess(env, request, user, "student_dashboard_denied", studentId, {
      reason: "student_scope_denied",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const isStudentSelf = user.id === studentId && await hasRole(env, user.id, "student");
  const progress = await env.DB.prepare(
    `SELECT
       progress.id,
       progress.requirement_id,
       progress.phase,
       progress.status,
       progress.updated_at,
       requirements.title AS requirement_title
     FROM progress_records progress
     LEFT JOIN requirements ON requirements.id = progress.requirement_id
     WHERE progress.student_id = ?
     ORDER BY progress.updated_at DESC
     LIMIT 20`,
  ).bind(studentId).all<ProgressRow>();

  const submissions = await env.DB.prepare(
    `SELECT
       submissions.id,
       submissions.requirement_id,
       submissions.status,
       submissions.version,
       submissions.submitted_at,
       submissions.updated_at,
       requirements.title AS requirement_title
     FROM submissions
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE submissions.student_id = ?
     ORDER BY submissions.updated_at DESC
     LIMIT 20`,
  ).bind(studentId).all<SubmissionSummaryRow>();

  const evidence = await env.DB.prepare(
    `SELECT id, title, artifact_type, source_kind, external_url, mime_type, size_bytes, review_status, created_at
     FROM evidence_artifacts
     WHERE student_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 20`,
  ).bind(studentId).all<EvidenceSummaryRow>();

  const requirements = await loadRequiredRequirements(env, studentId);
  const mentor = await loadActiveMentor(env, studentId);

  const progressRows = progress.results || [];
  const submissionRows = submissions.results || [];
  const evidenceRows = evidence.results || [];
  const requirementRows = requirements.results || [];
  const feedback = await loadStudentVisibleFeedback(env, studentId);
  const summary = buildStudentProgressSummary(requirementRows, progressRows, submissionRows, evidenceRows, mentor);
  const nextSteps = buildStudentNextSteps(requirementRows, progressRows, submissionRows, summary);

  await auditDashboardAccess(env, request, user, "student_dashboard_viewed", studentId, {
    self: isStudentSelf,
    progressCount: progressRows.length,
    submissionCount: submissionRows.length,
    evidenceCount: evidenceRows.length,
  });

  return json({
    ok: true,
    studentId,
    viewer: {
      id: user.id,
      email: user.email,
      self: isStudentSelf,
    },
    nextAction: nextSteps[0]?.detail || deriveNextAction(submissionRows, evidenceRows),
    summary,
    nextSteps,
    progress: progressRows,
    submissions: submissionRows,
    evidence: evidenceRows.map(summarizeEvidence),
    feedback,
  });
};

function loadRequiredRequirements(env: Env, studentId: string) {
  return env.DB.prepare(
    `SELECT
       requirements.id,
       requirements.program_id,
       requirements.phase,
       requirements.title,
       requirements.required,
       requirements.sort_order
     FROM requirements
     WHERE requirements.required = 1
       AND (
         requirements.program_id IS NULL
         OR requirements.program_id IN (
           SELECT DISTINCT groups.program_id
           FROM group_memberships
           JOIN groups ON groups.id = group_memberships.group_id
           WHERE group_memberships.user_id = ?
             AND groups.program_id IS NOT NULL
             AND groups.program_id != ''
         )
       )
     ORDER BY requirements.sort_order ASC, requirements.title ASC`,
  ).bind(studentId).all<RequirementRow>();
}

async function loadActiveMentor(env: Env, studentId: string): Promise<MentorSupportRow | null> {
  return await env.DB.prepare(
    `SELECT
       mentor.display_name AS mentor_name,
       mentor_assignments.created_at
     FROM mentor_assignments
     JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id
      AND mentor.status = 'active'
     JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
      AND mentor_role.role_id = 'mentor'
     WHERE mentor_assignments.student_user_id = ?
       AND mentor_assignments.active = 1
     ORDER BY mentor_assignments.created_at DESC
     LIMIT 1`,
  ).bind(studentId).first<MentorSupportRow>();
}

async function loadStudentVisibleFeedback(env: Env, studentId: string): Promise<StudentFeedback[]> {
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
     LIMIT 5`,
  ).bind(studentId).all<FeedbackRow>();

  return (rows.results || []).map((row) => ({
    id: row.id,
    kind: "review",
    submissionId: row.submission_id,
    requirementTitle: safeStudentText(row.requirement_title, "Senior Project submission", 180),
    status: studentFeedbackStatus(row.decision),
    message: safeStudentText(row.feedback, "Teacher feedback was recorded for this submission.", 420),
    authorName: safeStudentText(row.reviewer_name, "Program teacher", 120),
    createdAt: row.created_at,
  }));
}

function buildStudentProgressSummary(
  requirements: RequirementRow[],
  progressRows: ProgressRow[],
  submissions: SubmissionSummaryRow[],
  evidence: EvidenceSummaryRow[],
  mentor: MentorSupportRow | null,
): StudentProgressSummary {
  const requiredIds = new Set(requirements.map((requirement) => requirement.id));
  const progressByRequirement = latestByRequirement(progressRows);
  const submissionsByRequirement = latestByRequirement(submissions);
  const completedStatuses = new Set(["approved", "archived"]);
  const submittedStatuses = new Set(["submitted", "revision_requested", "approved", "archived"]);
  const requirementsComplete = requirements.filter((requirement) =>
    completedStatuses.has(progressByRequirement.get(requirement.id)?.status || ""),
  ).length;
  const submittedRequiredCount = requirements.filter((requirement) =>
    submittedStatuses.has(submissionsByRequirement.get(requirement.id)?.status || ""),
  ).length;
  const missingRequiredCount = Math.max(0, requirements.length - submittedRequiredCount);
  const waitingForReviewCount = submissions.filter((submission) => submission.status === "submitted").length;
  const revisionRequestedCount = submissions.filter((submission) => submission.status === "revision_requested").length;
  const phases = [...new Set(requirements.map((requirement) => requirement.phase).filter(Boolean))];
  const phasesComplete = phases.filter((phase) => {
    const phaseRequirements = requirements.filter((requirement) => requirement.phase === phase);
    return phaseRequirements.length > 0 && phaseRequirements.every((requirement) =>
      completedStatuses.has(progressByRequirement.get(requirement.id)?.status || ""),
    );
  }).length;
  const currentRequirement = requirements.find((requirement) =>
    !completedStatuses.has(progressByRequirement.get(requirement.id)?.status || ""),
  ) || requirements[requirements.length - 1] || null;
  const currentPhase = currentRequirement?.phase || progressRows[0]?.phase || "";
  const completionPercent = requirements.length > 0
    ? Math.round((requirementsComplete / requirements.length) * 100)
    : 0;
  const lastUpdatedAt = latestTimestamp([
    ...progressRows.map((row) => row.updated_at),
    ...submissions.map((row) => row.updated_at || row.submitted_at),
    ...evidence.map((row) => row.created_at),
    mentor?.created_at || null,
  ]);

  return {
    requirementsTotal: requirements.length,
    requirementsComplete,
    completionPercent,
    phasesTotal: phases.length,
    phasesComplete,
    submittedRequiredCount,
    missingRequiredCount,
    waitingForReviewCount,
    revisionRequestedCount,
    currentPhase,
    currentPhaseLabel: currentPhase ? phaseLabel(currentPhase) : "Not available yet",
    currentStatus: deriveProgressStatus({
      requirementsTotal: requirements.length,
      requirementsComplete,
      completionPercent,
      waitingForReviewCount,
      revisionRequestedCount,
      hasStarted: progressRows.length > 0 || submissions.length > 0 || evidence.length > 0,
    }),
    lastUpdatedAt,
    mentor: {
      assigned: Boolean(mentor?.mentor_name),
      name: mentor?.mentor_name || null,
      message: mentor?.mentor_name
        ? `${mentor.mentor_name} can help with project questions.`
        : "No mentor assigned yet.",
    },
    dueDatesAvailable: false,
  };
}

function buildStudentNextSteps(
  requirements: RequirementRow[],
  progressRows: ProgressRow[],
  submissions: SubmissionSummaryRow[],
  summary: StudentProgressSummary,
): StudentNextStep[] {
  const progressByRequirement = latestByRequirement(progressRows);
  const submissionsByRequirement = latestByRequirement(submissions);
  const output: StudentNextStep[] = [];
  const seen = new Set<string>();
  const addStep = (requirement: RequirementRow | null, status: string, detail: string) => {
    if (!requirement || seen.has(requirement.id)) return;
    seen.add(requirement.id);
    output.push({
      title: requirement.title || "Senior Project requirement",
      status,
      detail,
      dueDate: null,
    });
  };

  for (const submission of submissions.filter((row) => row.status === "revision_requested")) {
    addStep(
      requirementFor(requirements, submission.requirement_id),
      "Needs Revision",
      `Revise ${submission.requirement_title || "this submission"} and send it back for review.`,
    );
  }

  for (const requirement of requirements) {
    const submission = submissionsByRequirement.get(requirement.id);
    if (!submission || submission.status === "draft") {
      addStep(requirement, "Missing", `Start or finish ${requirement.title}.`);
    }
  }

  for (const requirement of requirements.filter((row) => row.phase === summary.currentPhase)) {
    const progress = progressByRequirement.get(requirement.id);
    if (progress && ["not_started", "in_progress"].includes(progress.status)) {
      addStep(requirement, statusTextForStudent(progress.status), `Keep working on ${requirement.title}.`);
    }
  }

  for (const submission of submissions.filter((row) => row.status === "submitted")) {
    addStep(
      requirementFor(requirements, submission.requirement_id),
      "Waiting for Review",
      `${submission.requirement_title || "This submission"} is waiting for teacher review.`,
    );
  }

  if (output.length === 0 && summary.requirementsTotal > 0 && summary.requirementsComplete < summary.requirementsTotal) {
    addStep(
      requirements.find((requirement) => !["approved", "archived"].includes(progressByRequirement.get(requirement.id)?.status || "")) || null,
      "Next",
      "Continue the next senior project requirement.",
    );
  }

  return output.slice(0, 5);
}

function latestByRequirement<T extends { requirement_id: string | null; updated_at?: string | null; submitted_at?: string | null }>(rows: T[]): Map<string, T> {
  const output = new Map<string, T>();
  for (const row of rows) {
    if (!row.requirement_id) continue;
    const existing = output.get(row.requirement_id);
    if (!existing || timestampValue(row.updated_at || row.submitted_at) > timestampValue(existing.updated_at || existing.submitted_at)) {
      output.set(row.requirement_id, row);
    }
  }
  return output;
}

function requirementFor(requirements: RequirementRow[], requirementId: string | null): RequirementRow | null {
  if (!requirementId) return null;
  return requirements.find((requirement) => requirement.id === requirementId) || null;
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  const valid = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => timestampValue(b) - timestampValue(a));
  return valid[0] || null;
}

function timestampValue(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function deriveProgressStatus(input: {
  requirementsTotal: number;
  requirementsComplete: number;
  completionPercent: number;
  waitingForReviewCount: number;
  revisionRequestedCount: number;
  hasStarted: boolean;
}): string {
  if (input.requirementsTotal === 0) return "Not Started";
  if (input.revisionRequestedCount > 0) return "Needs Revision";
  if (input.waitingForReviewCount > 0) return "Waiting for Review";
  if (input.requirementsComplete >= input.requirementsTotal) return "Complete";
  if (input.completionPercent >= 80) return "Almost Done";
  if (input.hasStarted) return input.requirementsComplete > 0 ? "In Progress" : "Getting Started";
  return "Not Started";
}

function phaseLabel(value: string): string {
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function statusTextForStudent(value: string): string {
  if (value === "not_started") return "Not Started";
  if (value === "in_progress") return "In Progress";
  if (value === "revision_requested") return "Needs Revision";
  if (value === "submitted") return "Waiting for Review";
  if (value === "approved" || value === "archived") return "Complete";
  return phaseLabel(value);
}

function studentFeedbackStatus(value: string): string {
  if (value === "revision_requested") return "revision_requested";
  if (value === "approved") return "approved";
  if (value === "comment_only") return "under_review";
  return "under_review";
}

function safeStudentText(value: string | null | undefined, fallback: string, maxLength: number): string {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  const output = normalized || fallback;
  return output.length > maxLength ? `${output.slice(0, Math.max(0, maxLength - 1)).trim()}...` : output;
}

function deriveNextAction(submissions: SubmissionSummaryRow[], evidence: EvidenceSummaryRow[]): string {
  const current = submissions[0];
  if (!current) return "Start the proposal requirement.";
  if (evidence.length === 0) return "Attach at least one evidence artifact.";
  if (current.status === "draft") return "Submit the proposal for teacher review.";
  if (current.status === "revision_requested") return "Revise and resubmit the proposal.";
  if (current.status === "submitted") return "Wait for teacher review.";
  if (current.status === "approved") return "Move into build evidence and mentor preparation.";
  return "Review the current capstone status.";
}

function summarizeEvidence(row: EvidenceSummaryRow): EvidenceSummary {
  const isDriveFile = row.source_kind === "google_drive_file";
  const isExternalLink = row.source_kind === "external_link";

  return {
    id: row.id,
    title: row.title,
    artifact_type: row.artifact_type,
    source_kind: row.source_kind,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    review_status: row.review_status,
    created_at: row.created_at,
    fileBytesReady: isDriveFile,
    downloadUrl: isDriveFile ? `/api/evidence/${encodeURIComponent(row.id)}/download` : null,
    externalUrl: isExternalLink ? row.external_url : null,
    storageIdentifiersRedacted: true,
  };
}

async function auditDashboardAccess(
  env: Env,
  request: Request,
  user: UserAccount | null,
  action: string,
  studentId: string | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  const auditMetadata = user
    ? {
        ...metadata,
        actorRoleScopes: serializeRoleScopes(await getRoleAssignments(env, user.id)),
      }
    : metadata;

  await writeAudit(env, {
    actorUserId: user?.id || null,
    action,
    entityType: "student_dashboard",
    entityId: studentId,
    request,
    metadata: auditMetadata,
  });
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
