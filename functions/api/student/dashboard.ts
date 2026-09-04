import type { Env, RoleAssignment, UserAccount } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canAccessStudent, getRoleAssignments, hasRole } from "../../_lib/permissions.ts";
import {
  assignmentResponse,
  loadProjectAdultAssignments,
  projectAdultSetup,
} from "../../_lib/project-adults.ts";
import { loadSiteBrandTheme } from "../../_lib/site-scope.ts";

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
  evidence_count: number;
  response_text: string | null;
  response_updated_at: string | null;
}

interface EvidenceSummaryRow {
  id: string;
  submission_id: string | null;
  title: string;
  artifact_type: string;
  source_kind: string;
  external_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
  preview_status: string;
  preview_kind: string;
  availability_status: string;
  availability_checked_at: string | null;
}

interface StudentAccountRow {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface EvidenceSummary {
  id: string;
  submissionId: string | null;
  requirementId: string | null;
  requirementTitle: string | null;
  title: string;
  artifact_type: string;
  source_kind: string;
  mime_type: string | null;
  size_bytes: number | null;
  review_status: string;
  created_at: string;
  fileBytesReady: boolean;
  downloadUrl: string | null;
  openInDriveUrl: string | null;
  externalUrl: string | null;
  previewUrl: string | null;
  previewStatus: string;
  availabilityStatus: string;
  availabilityCheckedAt: string | null;
  storageIdentifiersRedacted: true;
}

interface FeedbackRow {
  id: string;
  submission_id: string;
  requirement_title: string | null;
  submission_status: string;
  submission_version: number;
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
  submissionStatus: string;
  submissionVersion: number;
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
  description: string | null;
  required: number;
  sort_order: number;
  work_scope: "project" | "individual";
  due_at: string | null;
  due_label: string | null;
  quality_prompt: string | null;
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
  dueDatesAvailable: boolean;
}

interface StudentNextStep {
  title: string;
  status: string;
  detail: string;
  dueDate: string | null;
  dueLabel: string | null;
  requirementId: string | null;
  submissionId: string | null;
  submissionStatus: string | null;
  evidenceCount: number;
}

interface StudentRequirementDetail {
  requirementId: string;
  submissionId: string | null;
  title: string;
  description: string | null;
  phase: string;
  phaseLabel: string;
  status: string;
  progressStatus: string | null;
  submissionStatus: string | null;
  submissionVersion: number | null;
  evidenceCount: number;
  dueDate: string | null;
  dueLabel: string | null;
  qualityPrompt: string | null;
  lastUpdatedAt: string | null;
  nextAction: string;
  draftText: string;
  draftWordCount: number;
  hasWrittenResponse: boolean;
  workScope: "project" | "individual";
}

interface StudentProjectRow {
  project_id: string;
  site_id: string;
  project_name: string;
  project_summary: string | null;
  drive_folder_url: string | null;
  drive_folder_updated_at: string | null;
  drive_folder_check_status: string;
  drive_folder_checked_at: string | null;
  current_phase: string;
  program_id: string | null;
  program_name: string | null;
  student_user_id: string;
  member_name: string;
  member_role: string;
}

interface StudentProjectMentorRow {
  mentor_user_id: string;
  mentor_name: string;
}

interface StudentProjectTemplateRow {
  id: string;
  phase: string;
  title: string;
  description: string | null;
  template_url: string;
  link_check_status: string;
  link_checked_at: string | null;
}

const BOOKLET_PHASE_LABELS: Record<string, string> = {
  start: "Start: Setup",
  "phase-1": "Phase 1: Kickoff and Proposal",
  "phase-2a": "Phase 2A: Build",
  "phase-2b": "Phase 2B: Build Part II",
  "phase-3a": "Phase 3A: Present",
  "phase-3b": "Phase 3B: Celebrate",
  "phase-4": "Phase 4: Give Thanks, Reflect, Launch",
  finish: "Finish: Download and Keep",
};

const BOOKLET_PHASE_ORDER = [
  "start",
  "phase-1",
  "phase-2a",
  "phase-2b",
  "phase-3a",
  "phase-3b",
  "phase-4",
  "finish",
];

const BOOKLET_PHASE_ALIASES: Record<string, string> = {
  setup: "start",
  purpose: "start",
  proposal: "phase-1",
  "proposal-and-research": "phase-1",
  "mentor-checkpoints": "phase-2a",
  "mentor-meetings": "phase-2a",
  presentation: "phase-3a",
  "presentation-day": "phase-3a",
  "presentation-and-celebration": "phase-3a",
  "celebration-day": "phase-3b",
  portfolio: "phase-4",
  "reflection-and-archive": "phase-4",
  "wrap-up": "finish",
};

const BOOKLET_PHASE_BY_REQUIREMENT_ID: Record<string, string> = {
  "req-senior-project-workspace": "start",
  "req-resume": "start",
  "req-proposal-draft": "phase-1",
  "req-approved-proposal": "phase-1",
  "req-research-proposal-challenge": "phase-1",
  "req-mentor-meeting-one-plan": "phase-2a",
  "req-mentor-meeting-two-outline": "phase-2b",
  "req-presentation-day": "phase-3a",
  "req-celebration-day": "phase-3b",
  "req-thanks-and-thanks": "phase-4",
  "req-reflection-best-work": "phase-4",
  "req-reflection-senior-project": "phase-4",
  "req-reflection-tenet-mastery": "phase-4",
  "req-reflection-project-based-learning": "phase-4",
  "req-reflection-next-year-plan": "phase-4",
  "req-personal-archive-export": "finish",
};

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

  if (!requestedStudentId && !await hasRole(env, user.id, "student")) {
    await auditDashboardAccess(env, request, user, "student_dashboard_denied", null, {
      reason: "student_id_required_for_staff_view",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const studentId = requestedStudentId || user.id;
  if (!await canAccessStudent(env, user, studentId)) {
    await auditDashboardAccess(env, request, user, "student_dashboard_denied", studentId, {
      reason: "student_scope_denied",
    });
    return json({ error: "forbidden" }, { status: 403 });
  }

  const student = await loadStudentAccountSummary(env, studentId);
  const isStudentSelf = user.id === studentId && await hasRole(env, user.id, "student");
  const project = await loadStudentProject(env, studentId);
  const projectId = project?.projectId || "";
  const templates = project ? await loadStudentProjectTemplates(env, project.siteId, project.programId) : [];
  const progress = projectId ? await env.DB.prepare(
    `SELECT
       progress.id,
       progress.requirement_id,
       progress.phase,
       progress.status,
       progress.updated_at,
       requirements.title AS requirement_title
     FROM progress_records progress
     LEFT JOIN requirements ON requirements.id = progress.requirement_id
     WHERE (
       requirements.work_scope = 'project' AND progress.project_id = ?
     ) OR (
       COALESCE(requirements.work_scope, 'individual') = 'individual' AND progress.student_id = ?
     ) OR (
       ? = '' AND progress.student_id = ?
     )
     ORDER BY progress.updated_at DESC
     LIMIT 20`,
  ).bind(projectId, studentId, projectId, studentId).all<ProgressRow>() : await env.DB.prepare(
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

  const submissions = projectId ? await env.DB.prepare(
    `SELECT
       submissions.id,
       submissions.requirement_id,
       submissions.status,
       submissions.version,
       submissions.submitted_at,
       submissions.updated_at,
       requirements.title AS requirement_title,
       (
         SELECT COUNT(evidence_artifacts.id)
         FROM evidence_artifacts
         WHERE evidence_artifacts.submission_id = submissions.id
           AND evidence_artifacts.deleted_at IS NULL
           AND evidence_artifacts.review_status != 'archived'
       ) AS evidence_count,
       (
         SELECT student_work_responses.response_text
         FROM student_work_responses
         WHERE student_work_responses.submission_id = submissions.id
         LIMIT 1
       ) AS response_text,
       (
         SELECT student_work_responses.updated_at
         FROM student_work_responses
         WHERE student_work_responses.submission_id = submissions.id
         LIMIT 1
       ) AS response_updated_at
     FROM submissions
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE (
       requirements.work_scope = 'project' AND submissions.project_id = ?
     ) OR (
       COALESCE(requirements.work_scope, 'individual') = 'individual' AND submissions.student_id = ?
     ) OR (
       ? = '' AND submissions.student_id = ?
     )
     ORDER BY submissions.updated_at DESC
     LIMIT 20`,
  ).bind(projectId, studentId, projectId, studentId).all<SubmissionSummaryRow>() : await env.DB.prepare(
    `SELECT
       submissions.id,
       submissions.requirement_id,
       submissions.status,
       submissions.version,
       submissions.submitted_at,
       submissions.updated_at,
       requirements.title AS requirement_title,
       (
         SELECT COUNT(evidence_artifacts.id)
         FROM evidence_artifacts
         WHERE evidence_artifacts.submission_id = submissions.id
           AND evidence_artifacts.deleted_at IS NULL
           AND evidence_artifacts.review_status != 'archived'
       ) AS evidence_count,
       (
         SELECT student_work_responses.response_text
         FROM student_work_responses
         WHERE student_work_responses.submission_id = submissions.id
         LIMIT 1
       ) AS response_text,
       (
         SELECT student_work_responses.updated_at
         FROM student_work_responses
         WHERE student_work_responses.submission_id = submissions.id
         LIMIT 1
       ) AS response_updated_at
     FROM submissions
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE submissions.student_id = ?
     ORDER BY submissions.updated_at DESC
     LIMIT 20`,
  ).bind(studentId).all<SubmissionSummaryRow>();

  const evidence = projectId
    ? await env.DB.prepare(
      `SELECT
       evidence_artifacts.id,
       evidence_artifacts.submission_id,
       evidence_artifacts.title,
       evidence_artifacts.artifact_type,
       evidence_artifacts.source_kind,
       evidence_artifacts.external_url,
       evidence_artifacts.mime_type,
       evidence_artifacts.size_bytes,
       evidence_artifacts.review_status,
       evidence_artifacts.created_at
       ,evidence_artifacts.preview_status
       ,evidence_artifacts.preview_kind
       ,evidence_artifacts.availability_status
       ,evidence_artifacts.availability_checked_at
     FROM evidence_artifacts
     LEFT JOIN submissions ON submissions.id = evidence_artifacts.submission_id
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     WHERE evidence_artifacts.deleted_at IS NULL
       AND (
         (requirements.work_scope = 'project' AND COALESCE(evidence_artifacts.project_id, submissions.project_id) = ?)
         OR (COALESCE(requirements.work_scope, 'individual') = 'individual' AND evidence_artifacts.student_id = ?)
         OR (? = '' AND evidence_artifacts.student_id = ?)
       )
     ORDER BY evidence_artifacts.created_at DESC
     LIMIT 20`,
    ).bind(projectId, studentId, projectId, studentId).all<EvidenceSummaryRow>()
    : await env.DB.prepare(
      `SELECT id, submission_id, title, artifact_type, source_kind, external_url, mime_type, size_bytes, review_status, created_at, preview_status, preview_kind
       FROM evidence_artifacts
       WHERE student_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 20`,
    ).bind(studentId).all<EvidenceSummaryRow>();

  const requirements = await loadRequiredRequirements(env, studentId);
  const mentor = await loadActiveMentor(env, studentId, projectId);

  const progressRows = progress.results || [];
  const submissionRows = submissions.results || [];
  const evidenceRows = evidence.results || [];
  const requirementRows = requirements.results || [];
  const feedback = await loadStudentVisibleFeedback(env, studentId, projectId);
  const summary = buildStudentProgressSummary(requirementRows, progressRows, submissionRows, evidenceRows, mentor);
  const nextSteps = buildStudentNextSteps(requirementRows, progressRows, submissionRows, summary);
  const requirementDetails = buildStudentRequirementDetails(requirementRows, progressRows, submissionRows);

  await auditDashboardAccess(env, request, user, "student_dashboard_viewed", studentId, {
    self: isStudentSelf,
    progressCount: progressRows.length,
    submissionCount: submissionRows.length,
    evidenceCount: evidenceRows.length,
  });

  return json({
    ok: true,
    studentId,
    student: {
      studentId,
      displayName: safeStudentText(student?.display_name, "Selected student", 160),
      email: safeStudentText(student?.email, "", 240) || null,
    },
    project,
    templates: templates.map((template) => ({
      templateId: template.id,
      phase: template.phase,
      title: template.title,
      description: template.description || "",
      templateUrl: template.template_url,
      linkCheckStatus: template.link_check_status || "not_checked",
      linkCheckedAt: template.link_checked_at || "",
    })),
    viewer: {
      id: user.id,
      email: user.email,
      self: isStudentSelf,
    },
    nextAction: nextSteps[0]?.detail || deriveNextAction(submissionRows, evidenceRows),
    summary,
    nextSteps,
    requirements: requirementDetails,
    progress: progressRows,
    submissions: submissionRows.map((row) => ({
      ...row,
      requirement_title: studentRequirementDisplayTitle(row.requirement_id, row.requirement_title),
    })),
    evidence: evidenceRows.map((row) => summarizeEvidence(row, submissionRows)),
    feedback,
  });
};

function loadStudentAccountSummary(env: Env, studentId: string) {
  return env.DB.prepare(
    "SELECT id, display_name, email FROM user_accounts WHERE id = ? LIMIT 1",
  ).bind(studentId).first<StudentAccountRow>();
}

async function loadStudentProject(env: Env, studentId: string) {
  let rows;
  try {
    rows = await env.DB.prepare(
    `SELECT
       projects.id AS project_id,
       projects.site_id,
       projects.name AS project_name,
       projects.summary AS project_summary,
       projects.drive_folder_url,
       projects.drive_folder_updated_at,
       projects.drive_folder_check_status,
       projects.drive_folder_checked_at,
       projects.current_phase,
       projects.program_id,
       programs.name AS program_name,
       all_members.student_user_id,
       member.display_name AS member_name,
       all_members.member_role
     FROM project_members
     JOIN projects ON projects.id = project_members.project_id
       AND projects.status = 'active'
     JOIN project_members all_members ON all_members.project_id = projects.id
       AND all_members.active = 1
     JOIN user_accounts member ON member.id = all_members.student_user_id
     LEFT JOIN programs ON programs.id = projects.program_id
     WHERE project_members.student_user_id = ?
       AND project_members.active = 1
     ORDER BY CASE all_members.member_role WHEN 'lead' THEN 0 ELSE 1 END, member.display_name ASC`,
    ).bind(studentId).all<StudentProjectRow>();
  } catch {
    return null;
  }
  const projectRows = rows.results || [];
  if (!projectRows.length) return null;
  const projectId = projectRows[0].project_id;
  const brandTheme = await loadSiteBrandTheme(env, projectRows[0].site_id);
  const mentors = await env.DB.prepare(
    `SELECT
       project_mentor_assignments.mentor_user_id,
       user_accounts.display_name AS mentor_name
     FROM project_mentor_assignments
     JOIN user_accounts ON user_accounts.id = project_mentor_assignments.mentor_user_id
     WHERE project_mentor_assignments.project_id = ?
       AND project_mentor_assignments.active = 1
     ORDER BY user_accounts.display_name ASC`,
  ).bind(projectId).all<StudentProjectMentorRow>();
  const adultAssignments = await loadProjectAdultAssignments(env, [projectId], []);
  return {
    projectId,
    siteId: projectRows[0].site_id,
    brandTheme,
    name: projectRows[0].project_name,
    summary: projectRows[0].project_summary || "",
    driveFolderUrl: projectRows[0].drive_folder_url || "",
    driveFolderUpdatedAt: projectRows[0].drive_folder_updated_at || "",
    driveFolderCheckStatus: projectRows[0].drive_folder_check_status || "not_checked",
    driveFolderCheckedAt: projectRows[0].drive_folder_checked_at || "",
    currentPhase: projectRows[0].current_phase,
    programId: projectRows[0].program_id || "",
    programName: projectRows[0].program_name || "Program not set",
    memberCount: projectRows.length,
    members: projectRows.map((row) => ({
      studentId: row.student_user_id,
      displayName: row.member_name,
      role: row.member_role,
      isCurrentStudent: row.student_user_id === studentId,
    })),
    mentors: (mentors.results || []).map((row) => ({
      mentorId: row.mentor_user_id,
      displayName: row.mentor_name,
    })),
    adultSetup: projectAdultSetup(adultAssignments),
    adultAssignments: adultAssignments.map(assignmentResponse),
  };
}

async function loadStudentProjectTemplates(env: Env, siteId: string, programId: string) {
  const rows = await env.DB.prepare(
    `SELECT id, phase, title, description, template_url, link_check_status, link_checked_at
     FROM project_templates
     WHERE site_id = ?
       AND active = 1
       AND (program_id IS NULL OR program_id = ?)
     ORDER BY
       CASE phase
         WHEN 'start' THEN 0 WHEN 'phase-1' THEN 1 WHEN 'phase-2a' THEN 2 WHEN 'phase-2b' THEN 3
         WHEN 'phase-3a' THEN 4 WHEN 'phase-3b' THEN 5 WHEN 'phase-4' THEN 6 WHEN 'finish' THEN 7 ELSE 8
       END,
       title ASC
     LIMIT 50`,
  ).bind(siteId, programId || "").all<StudentProjectTemplateRow>();
  return rows.results || [];
}

function loadRequiredRequirements(env: Env, studentId: string) {
  return env.DB.prepare(
    `SELECT
       requirements.id,
       requirements.program_id,
       requirements.phase,
       requirements.title,
       requirements.description,
       requirements.required,
       requirements.sort_order,
       requirements.work_scope,
       (
         SELECT candidate.due_at
         FROM deadlines candidate
         WHERE candidate.requirement_id = requirements.id
           AND candidate.active = 1
           AND (
             candidate.program_id IS NULL
             OR candidate.program_id IN (
               SELECT DISTINCT groups.program_id
               FROM group_memberships
               JOIN groups ON groups.id = group_memberships.group_id
               WHERE group_memberships.user_id = ?
                 AND groups.program_id IS NOT NULL
                 AND groups.program_id != ''
             )
           )
           AND (
             candidate.cohort_id IS NULL
             OR candidate.cohort_id IN (
               SELECT DISTINCT groups.cohort_id
               FROM group_memberships
               JOIN groups ON groups.id = group_memberships.group_id
               WHERE group_memberships.user_id = ?
                 AND groups.cohort_id IS NOT NULL
                 AND groups.cohort_id != ''
             )
           )
         ORDER BY candidate.due_at ASC, candidate.title ASC
         LIMIT 1
       ) AS due_at,
       (
         SELECT candidate.title
         FROM deadlines candidate
         WHERE candidate.requirement_id = requirements.id
           AND candidate.active = 1
           AND (
             candidate.program_id IS NULL
             OR candidate.program_id IN (
               SELECT DISTINCT groups.program_id
               FROM group_memberships
               JOIN groups ON groups.id = group_memberships.group_id
               WHERE group_memberships.user_id = ?
                 AND groups.program_id IS NOT NULL
                 AND groups.program_id != ''
             )
           )
           AND (
             candidate.cohort_id IS NULL
             OR candidate.cohort_id IN (
               SELECT DISTINCT groups.cohort_id
               FROM group_memberships
               JOIN groups ON groups.id = group_memberships.group_id
               WHERE group_memberships.user_id = ?
                 AND groups.cohort_id IS NOT NULL
                 AND groups.cohort_id != ''
             )
           )
         ORDER BY candidate.due_at ASC, candidate.title ASC
         LIMIT 1
      ) AS due_label,
      (
        SELECT candidate.prompt
        FROM quality_checks candidate
        WHERE candidate.requirement_id = requirements.id
          AND candidate.active = 1
        ORDER BY candidate.sort_order ASC, candidate.id ASC
        LIMIT 1
      ) AS quality_prompt
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
  ).bind(studentId, studentId, studentId, studentId, studentId).all<RequirementRow>();
}

async function loadActiveMentor(env: Env, studentId: string, projectId: string): Promise<MentorSupportRow | null> {
  const projectMentor = projectId ? await env.DB.prepare(
    `SELECT
       mentor.display_name AS mentor_name,
       project_mentor_assignments.created_at
     FROM project_mentor_assignments
     JOIN user_accounts mentor ON mentor.id = project_mentor_assignments.mentor_user_id
      AND mentor.status = 'active'
     JOIN user_roles mentor_role ON mentor_role.user_id = mentor.id
      AND mentor_role.role_id = 'mentor'
     WHERE project_mentor_assignments.project_id = ?
       AND project_mentor_assignments.active = 1
     ORDER BY project_mentor_assignments.created_at DESC
     LIMIT 1`,
  ).bind(projectId).first<MentorSupportRow>() : null;
  if (projectMentor) return projectMentor;
  return env.DB.prepare(
    `SELECT mentor.display_name AS mentor_name, mentor_assignments.created_at
     FROM mentor_assignments
     JOIN user_accounts mentor ON mentor.id = mentor_assignments.mentor_user_id AND mentor.status = 'active'
     WHERE mentor_assignments.student_user_id = ? AND mentor_assignments.active = 1
     ORDER BY mentor_assignments.created_at DESC
     LIMIT 1`,
  ).bind(studentId).first<MentorSupportRow>();
}

async function loadStudentVisibleFeedback(env: Env, studentId: string, projectId: string): Promise<StudentFeedback[]> {
  const rows = projectId ? await env.DB.prepare(
    `SELECT
       reviews.id,
       reviews.submission_id,
       requirements.title AS requirement_title,
       submissions.status AS submission_status,
       submissions.version AS submission_version,
       reviews.decision,
       reviews.feedback,
       reviews.created_at,
       reviewer.display_name AS reviewer_name
     FROM reviews
     JOIN submissions ON submissions.id = reviews.submission_id
     LEFT JOIN requirements ON requirements.id = submissions.requirement_id
     LEFT JOIN user_accounts reviewer ON reviewer.id = reviews.reviewer_user_id
     WHERE (
       requirements.work_scope = 'project' AND submissions.project_id = ?
     ) OR (
       COALESCE(requirements.work_scope, 'individual') = 'individual' AND submissions.student_id = ?
     ) OR (
       ? = '' AND submissions.student_id = ?
     )
     ORDER BY reviews.created_at DESC
     LIMIT 5`,
  ).bind(projectId, studentId, projectId, studentId).all<FeedbackRow>() : await env.DB.prepare(
    `SELECT
       reviews.id,
       reviews.submission_id,
       requirements.title AS requirement_title,
       submissions.status AS submission_status,
       submissions.version AS submission_version,
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
    requirementTitle: safeStudentText(row.requirement_title, "Senior Project work", 180),
    submissionStatus: row.submission_status,
    submissionVersion: row.submission_version || 1,
    status: studentFeedbackStatus(row.decision),
    message: safeStudentText(row.feedback, "Teacher feedback was recorded for this work.", 420),
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
  const orderedRequirements = sortRequirementsByBookletPhase(requirements);
  const requiredIds = new Set(requirements.map((requirement) => requirement.id));
  const progressByRequirement = latestByRequirement(progressRows);
  const submissionsByRequirement = latestByRequirement(submissions);
  const completedStatuses = new Set(["approved", "archived"]);
  const submittedStatuses = new Set(["submitted", "revision_requested", "approved", "archived"]);
  const requirementsComplete = orderedRequirements.filter((requirement) =>
    completedStatuses.has(progressByRequirement.get(requirement.id)?.status || ""),
  ).length;
  const submittedRequiredCount = orderedRequirements.filter((requirement) =>
    submittedStatuses.has(submissionsByRequirement.get(requirement.id)?.status || ""),
  ).length;
  const missingRequiredCount = Math.max(0, orderedRequirements.length - submittedRequiredCount);
  const waitingForReviewCount = submissions.filter((submission) => submission.status === "submitted").length;
  const revisionRequestedCount = submissions.filter((submission) => submission.status === "revision_requested").length;
  const phaseByRequirement = new Map(orderedRequirements.map((requirement) => [requirement.id, studentBookletPhaseKey(requirement)]));
  const phases = sortBookletPhaseKeys([...new Set(orderedRequirements.map((requirement) => phaseByRequirement.get(requirement.id)).filter(Boolean))]);
  const phasesComplete = phases.filter((phase) => {
    const phaseRequirements = orderedRequirements.filter((requirement) => phaseByRequirement.get(requirement.id) === phase);
    return phaseRequirements.length > 0 && phaseRequirements.every((requirement) =>
      completedStatuses.has(progressByRequirement.get(requirement.id)?.status || ""),
    );
  }).length;
  const currentRequirement = orderedRequirements.find((requirement) =>
    !completedStatuses.has(progressByRequirement.get(requirement.id)?.status || ""),
  ) || orderedRequirements[orderedRequirements.length - 1] || null;
  const currentPhase = currentRequirement
    ? studentBookletPhaseKey(currentRequirement)
    : studentBookletPhaseKeyForValue(progressRows[0]?.phase || "");
  const completionPercent = orderedRequirements.length > 0
    ? Math.round((requirementsComplete / orderedRequirements.length) * 100)
    : 0;
  const lastUpdatedAt = latestTimestamp([
    ...progressRows.map((row) => row.updated_at),
    ...submissions.map((row) => row.updated_at || row.submitted_at),
    ...evidence.map((row) => row.created_at),
    mentor?.created_at || null,
  ]);

  return {
    requirementsTotal: orderedRequirements.length,
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
      requirementsTotal: orderedRequirements.length,
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
    dueDatesAvailable: orderedRequirements.some((requirement) => Boolean(requirement.due_at || requirement.due_label)),
  };
}

function buildStudentNextSteps(
  requirements: RequirementRow[],
  progressRows: ProgressRow[],
  submissions: SubmissionSummaryRow[],
  summary: StudentProgressSummary,
): StudentNextStep[] {
  const orderedRequirements = sortRequirementsByBookletPhase(requirements);
  const progressByRequirement = latestByRequirement(progressRows);
  const submissionsByRequirement = latestByRequirement(submissions);
  const output: StudentNextStep[] = [];
  const seen = new Set<string>();
  const addStep = (requirement: RequirementRow | null, status: string, detail: string) => {
    if (!requirement || seen.has(requirement.id)) return;
    const submission = submissionsByRequirement.get(requirement.id) || null;
    const displayTitle = studentRequirementDisplayTitle(requirement.id, requirement.title);
    seen.add(requirement.id);
    output.push({
      title: displayTitle,
      status,
      detail,
      dueDate: requirement.due_at || null,
      dueLabel: safeStudentText(requirement.due_label, "", 80) || null,
      requirementId: requirement.id,
      submissionId: submission?.id || null,
      submissionStatus: submission?.status || null,
      evidenceCount: safeNumber(submission?.evidence_count),
    });
  };

  for (const submission of submissions.filter((row) => row.status === "revision_requested")) {
    const requirement = requirementFor(requirements, submission.requirement_id);
    addStep(
      requirement,
      "Needs Revision",
      `Open teacher feedback for ${studentRequirementDisplayTitle(requirement?.id, submission.requirement_title || "this work")}, make the requested changes, then turn it in again.`,
    );
  }

  for (const requirement of orderedRequirements) {
    const submission = submissionsByRequirement.get(requirement.id);
    if (!submission || submission.status === "draft") {
      const title = studentRequirementDisplayTitle(requirement.id, requirement.title);
      addStep(requirement, "Missing", `Open ${phaseLabel(studentBookletPhaseKey(requirement))} and finish ${title}. Add a Google Drive link if it helps show the work. Then turn it in for review.`);
    }
  }

  for (const requirement of orderedRequirements.filter((row) => studentBookletPhaseKey(row) === summary.currentPhase)) {
    const progress = progressByRequirement.get(requirement.id);
    if (progress && ["not_started", "in_progress"].includes(progress.status)) {
      const title = studentRequirementDisplayTitle(requirement.id, requirement.title);
      addStep(requirement, statusTextForStudent(progress.status), `Keep working on ${title}. Check the due date, your saved work, and your teacher's tip.`);
    }
  }

  for (const submission of submissions.filter((row) => row.status === "submitted")) {
    const requirement = requirementFor(requirements, submission.requirement_id);
    addStep(
      requirement,
      "Waiting for Review",
      `${studentRequirementDisplayTitle(requirement?.id, submission.requirement_title || "This work")} is waiting for teacher review. No extra file or link is needed unless your teacher asks.`,
    );
  }

  if (output.length === 0 && summary.requirementsTotal > 0 && summary.requirementsComplete < summary.requirementsTotal) {
    addStep(
      orderedRequirements.find((requirement) => !["approved", "archived"].includes(progressByRequirement.get(requirement.id)?.status || "")) || null,
      "Next",
      "Open the next project phase, read the short directions, and keep moving.",
    );
  }

  return output.slice(0, 5);
}

function buildStudentRequirementDetails(
  requirements: RequirementRow[],
  progressRows: ProgressRow[],
  submissions: SubmissionSummaryRow[],
): StudentRequirementDetail[] {
  const progressByRequirement = latestByRequirement(progressRows);
  const submissionsByRequirement = latestByRequirement(submissions);
  return sortRequirementsByBookletPhase(requirements).map((requirement) => {
    const progress = progressByRequirement.get(requirement.id) || null;
    const submission = submissionsByRequirement.get(requirement.id) || null;
    const status = studentRequirementStatus(progress, submission);
    const evidenceCount = safeNumber(submission?.evidence_count);
    const draftText = safeStudentDraftText(submission?.response_text);
    const phase = studentBookletPhaseKey(requirement);
    return {
      requirementId: requirement.id,
      submissionId: submission?.id || null,
      title: studentRequirementDisplayTitle(requirement.id, requirement.title),
      description: studentRequirementDisplayDescription(requirement.id, requirement.description),
      phase,
      phaseLabel: phase ? phaseLabel(phase) : "Not available yet",
      status,
      progressStatus: progress?.status || null,
      submissionStatus: submission?.status || null,
      submissionVersion: submission?.version || null,
      evidenceCount,
      dueDate: requirement.due_at || null,
      dueLabel: safeStudentText(requirement.due_label, "", 80) || null,
      qualityPrompt: studentRequirementDisplayPrompt(requirement.id, requirement.quality_prompt),
      lastUpdatedAt: latestTimestamp([
        progress?.updated_at || null,
        submission?.updated_at || null,
        submission?.submitted_at || null,
        submission?.response_updated_at || null,
      ]),
      nextAction: studentRequirementNextAction(requirement, progress, submission, status, evidenceCount),
      draftText,
      draftWordCount: wordCount(draftText),
      hasWrittenResponse: Boolean(draftText),
      workScope: requirement.work_scope,
    };
  });
}

function safeStudentDraftText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").slice(0, 6000) : "";
}

function wordCount(value: string): number {
  const words = value.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function studentRequirementStatus(
  progress: ProgressRow | null,
  submission: SubmissionSummaryRow | null,
): string {
  if (submission?.status === "revision_requested") return "revision_requested";
  if (submission?.status === "submitted") return "submitted";
  if (progress?.status === "approved" || progress?.status === "archived") return progress.status;
  if (submission?.status) return submission.status;
  if (progress?.status) return progress.status;
  return "missing";
}

function studentRequirementNextAction(
  requirement: RequirementRow,
  progress: ProgressRow | null,
  submission: SubmissionSummaryRow | null,
  status: string,
  evidenceCount: number,
): string {
  const title = studentRequirementDisplayTitle(
    requirement.id,
    requirement.title || submission?.requirement_title || progress?.requirement_title,
  );
  if (status === "revision_requested") {
    return evidenceCount > 0
      ? `Read teacher feedback, revise ${title}, then turn it in again.`
      : `Add the updated Google Drive link for ${title}, then turn it in again.`;
  }
  if (status === "submitted") return `${title} is waiting for teacher review. No extra file or link is needed unless your teacher asks.`;
  if (status === "approved" || status === "archived") return `${title} is complete for now. Keep it for your final files.`;
  if (status === "draft") {
    return evidenceCount > 0
      ? `Turn ${title} in for teacher review.`
      : `Add the Google Drive link your teacher asked for, if needed. Then turn ${title} in for review.`;
  }
  if (status === "in_progress") return `Keep working on ${title}. Check the due date, your saved work, and your teacher's tip.`;
  if (status === "missing") return `Open ${phaseLabel(studentBookletPhaseKey(requirement))} and start ${title}. Add a Google Drive link if it helps show the work.`;
  return `Review ${title} and ask your program teacher what to do next.`;
}

function studentRequirementDisplayTitle(requirementId: string | null | undefined, title: string | null | undefined): string {
  const friendlyTitles: Record<string, string> = {
    "req-senior-project-workspace": "Set up your project folder",
    "req-approved-proposal": "Get your project proposal approved",
    "req-thanks-and-thanks": "Thank your project helpers",
    "req-personal-archive-export": "Save personal copies of your project",
  };
  return friendlyTitles[String(requirementId || "").trim()]
    || safeStudentText(title, "Senior Project work", 180);
}

function studentRequirementDisplayDescription(requirementId: string | null | undefined, description: string | null | undefined): string | null {
  const descriptions: Record<string, string> = {
    "req-senior-project-workspace": "Create one Google Drive folder for your project and save its link here.",
    "req-resume": "Make a resume that shows your skills, experience, and project work.",
    "req-proposal-draft": "Write your first project proposal. Explain the problem, your plan, and who it will help.",
    "req-approved-proposal": "Use teacher feedback to finish the proposal your team will follow.",
    "req-research-proposal-challenge": "Explain what you learned from research and how it made your project plan stronger.",
    "req-mentor-meeting-one-plan": "Plan your first mentor meeting. Bring questions and choose what help you need.",
    "req-mentor-meeting-two-outline": "Plan your second mentor meeting and make an outline for your presentation.",
    "req-thanks-and-thanks": "Write a thank-you note to someone who helped your project.",
    "req-presentation-day": "Get ready to share your project story, work, and results.",
    "req-celebration-day": "Plan a clear display that helps visitors understand your project.",
    "req-reflection-best-work": "Choose your best project work and explain what it shows.",
    "req-reflection-senior-project": "Look back on a challenge, what you changed, and what you learned.",
    "req-reflection-tenet-mastery": "Choose one school goal or skill and show how your project proves your growth.",
    "req-reflection-project-based-learning": "Explain how planning, feedback, and changes made your project better.",
    "req-reflection-next-year-plan": "Choose one next-year goal, a first step, help you can use, and a backup plan.",
    "req-personal-archive-export": "Save personal copies of your important project files before your school account closes.",
  };
  const friendly = descriptions[String(requirementId || "").trim()];
  return friendly || safeStudentText(description, "", 240) || null;
}

function studentRequirementDisplayPrompt(requirementId: string | null | undefined, prompt: string | null | undefined): string | null {
  const prompts: Record<string, string> = {
    "req-senior-project-workspace": "Check that every teammate can open the folder link.",
    "req-resume": "Show one skill and one real example that proves it.",
    "req-approved-proposal": "Make the goal clear, doable, and easy to check.",
    "req-research-proposal-challenge": "Name the strongest fact you found and how it changed your plan.",
    "req-mentor-meeting-one-plan": "Bring your proposal and three questions for your mentor.",
    "req-mentor-meeting-two-outline": "Make sure your outline shows the problem, your work, the result, and what you learned.",
    "req-presentation-day": "Use your slides to support your story. Do not read every word from them.",
    "req-celebration-day": "Show what you made, why it mattered, and how you know it worked.",
    "req-reflection-best-work": "Choose one exact example that shows growth, skill, effort, or impact.",
    "req-reflection-senior-project": "Name one setback and explain what you changed after it.",
    "req-reflection-tenet-mastery": "Name the skill and prove it with one project moment or choice.",
    "req-reflection-project-based-learning": "Tell how feedback changed the work and made the result better.",
    "req-reflection-next-year-plan": "Give your first step a date and name one person who can help.",
    "req-personal-archive-export": "Open your copies without your school sign-in to make sure they work.",
  };
  const friendly = prompts[String(requirementId || "").trim()];
  return friendly || safeStudentText(prompt, "", 240) || null;
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const normalized = studentBookletPhaseKeyForValue(value);
  if (BOOKLET_PHASE_LABELS[normalized]) return BOOKLET_PHASE_LABELS[normalized];
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function studentBookletPhaseKey(requirement: RequirementRow): string {
  const requirementId = String(requirement?.id || "").trim();
  if (BOOKLET_PHASE_BY_REQUIREMENT_ID[requirementId]) return BOOKLET_PHASE_BY_REQUIREMENT_ID[requirementId];
  return studentBookletPhaseKeyForValue(requirement?.phase || "");
}

function sortRequirementsByBookletPhase(requirements: RequirementRow[]): RequirementRow[] {
  return [...requirements].sort((left, right) => {
    const phaseDelta = bookletPhaseRank(studentBookletPhaseKey(left)) - bookletPhaseRank(studentBookletPhaseKey(right));
    if (phaseDelta !== 0) return phaseDelta;
    const sortDelta = safeNumber(left.sort_order) - safeNumber(right.sort_order);
    if (sortDelta !== 0) return sortDelta;
    return String(left.title || left.id || "").localeCompare(String(right.title || right.id || ""));
  });
}

function sortBookletPhaseKeys(phases: Array<string | undefined>): string[] {
  return phases
    .filter((phase): phase is string => Boolean(phase))
    .sort((left, right) => bookletPhaseRank(left) - bookletPhaseRank(right));
}

function bookletPhaseRank(value: string): number {
  const key = studentBookletPhaseKeyForValue(value);
  const index = BOOKLET_PHASE_ORDER.indexOf(key);
  return index === -1 ? BOOKLET_PHASE_ORDER.length : index;
}

function studentBookletPhaseKeyForValue(value: string): string {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  if (!normalized) return "";
  return BOOKLET_PHASE_ALIASES[normalized] || normalized;
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
  if (!current) return "Open My Project and start the first item.";
  if (current.status === "draft") return evidence.length
    ? "Finish the draft, check its Google Drive link, and turn it in."
    : "Finish the draft. Add a Google Drive link only if it helps show the work. Then turn it in.";
  if (current.status === "revision_requested") return "Read the teacher note, fix the work, and turn it in again.";
  if (current.status === "submitted") return "Wait for teacher review.";
  if (current.status === "approved") return "Open My Project and start the next item.";
  return "Open My Project and check the next step.";
}

function summarizeEvidence(row: EvidenceSummaryRow, submissions: SubmissionSummaryRow[]): EvidenceSummary {
  const isDriveFile = row.source_kind === "google_drive_file";
  const isExternalLink = row.source_kind === "external_link";
  const submissionId = row.submission_id || null;
  const linkedSubmission = submissionId
    ? submissions.find((submission) => submission.id === submissionId) || null
    : null;

  return {
    id: row.id,
    submissionId,
    requirementId: linkedSubmission?.requirement_id || null,
    requirementTitle: linkedSubmission?.requirement_title
      ? studentRequirementDisplayTitle(linkedSubmission.requirement_id, linkedSubmission.requirement_title)
      : null,
    title: row.title,
    artifact_type: row.artifact_type,
    source_kind: row.source_kind,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    review_status: row.review_status,
    created_at: row.created_at,
    fileBytesReady: isDriveFile,
    downloadUrl: isDriveFile ? `/api/evidence/${encodeURIComponent(row.id)}/download` : null,
    openInDriveUrl: isDriveFile ? `/api/evidence/${encodeURIComponent(row.id)}/open` : null,
    previewUrl: isDriveFile && row.preview_status === "ready"
      ? `/api/evidence/${encodeURIComponent(row.id)}/preview`
      : null,
    previewStatus: row.preview_status || "not_requested",
    availabilityStatus: row.availability_status || "unknown",
    availabilityCheckedAt: row.availability_checked_at || null,
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
