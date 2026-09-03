import type { Env, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "../_lib/auth.ts";
import { randomId, sha256Hex } from "../_lib/crypto.ts";
import { getViewerAssignedStudentIds } from "../_lib/effective-access.ts";
import { json, readJson, requirePost } from "../_lib/http.ts";
import {
  adultAssignmentEventStatement,
  assignmentResponse,
  canManageProjectAdultTarget,
  loadProjectAdultAssignments,
  mentorSyncStatements,
  notificationStatement,
  projectAdultSetup,
  type ProjectAdultAssignmentRow,
  validateEligibleProjectAdult,
} from "../_lib/project-adults.ts";
import {
  canAccessSite,
  canAccessProject,
  canAccessStudent,
  canManageProject,
  canViewReviewQueue,
  getAccessibleSiteIds,
  getMentorAssignedStudentIds,
  getProgramTeacherScopedStudentIds,
  getViewerRoleContext,
} from "../_lib/permissions.ts";
import { loadSiteBrandThemesByIds } from "../_lib/site-scope.ts";

const DEFAULT_PROJECT_PAGE_SIZE = 25;
const MAX_PROJECT_PAGE_SIZE = 50;
const MAX_PROJECT_SEARCH_LENGTH = 80;

type ProjectDirectoryFilter = "all" | "review" | "changes" | "working" | "team" | "individual";

interface ProjectDirectoryQuery {
  search: string;
  filter: ProjectDirectoryFilter;
  page: number;
  pageSize: number;
}

interface ProjectAccessFilter {
  broad: boolean;
  studentIds: string[];
}

interface ProjectSummaryRow {
  total: number;
  teams: number;
  individual: number;
  waiting_for_review: number;
  needs_changes: number;
  missing_mentor: number;
  missing_program_teacher: number;
  missing_required_adult: number;
  adults_ready: number;
}

interface ProjectRow {
  id: string;
  site_id: string;
  site_name: string;
  brand_theme?: string | null;
  program_id: string | null;
  program_name: string | null;
  cohort_id: string | null;
  cohort_name: string | null;
  name: string;
  summary: string | null;
  drive_folder_url: string | null;
  drive_folder_updated_at: string | null;
  drive_folder_check_status: string;
  drive_folder_checked_at: string | null;
  status: string;
  current_phase: string;
  updated_at: string;
  submitted_count: number;
  revision_count: number;
  approved_count: number;
  next_submission_id: string | null;
}

interface ProjectMemberRow {
  project_id: string;
  student_user_id: string;
  display_name: string;
  email: string;
  member_role: string;
}

interface ProjectMentorRow {
  project_id: string;
  mentor_user_id: string;
  display_name: string;
}

interface ProjectNoteRow {
  id: string;
  project_id: string;
  author_user_id: string | null;
  author_name: string;
  body: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by_name: string | null;
}

interface CreateProjectBody {
  action?: string;
  siteId?: string;
  projectId?: string;
  requestId?: string;
  name?: string;
  summary?: string;
  folderUrl?: string;
  templateId?: string;
  templateUrl?: string;
  phase?: string;
  description?: string;
  programId?: string;
  mentorUserId?: string;
  programTeacherUserId?: string;
  studentIds?: string[];
  feedback?: string;
  changeReason?: unknown;
  confirmImpact?: unknown;
  confirmLinkOpened?: unknown;
  approvalToken?: unknown;
  noteId?: string;
  noteBody?: string;
}

interface ProjectRequestRow {
  id: string;
  site_id: string;
  site_name: string;
  program_id: string | null;
  submitted_by_student_id: string;
  submitted_by_name: string;
  proposed_name: string;
  summary: string | null;
  status: string;
  staff_feedback: string | null;
  approved_project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectRequestMemberRow {
  request_id: string;
  student_user_id: string;
  display_name: string;
  requested_role: string;
  invitation_status: string;
  responded_at: string | null;
  current_project_id: string | null;
  current_project_name: string | null;
  current_member_role: string | null;
  submission_count: number;
  progress_count: number;
  evidence_count: number;
  history_count: number;
  meeting_count: number;
  presentation_count: number;
}

interface ProjectRequestEventRow {
  request_id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  action: string;
  detail_json: string;
  created_at: string;
}

interface ActiveProjectMembership {
  project_id: string;
  student_user_id: string;
  member_role: string;
}

interface StudentOptionRow {
  id: string;
  display_name: string;
  email: string;
  program_name: string | null;
  cohort_label: string | null;
}

interface ProjectAdultOptionRow {
  id: string;
  display_name: string;
  email: string;
  role_id: "mentor" | "program_teacher";
  scope_id: string;
}

interface ProjectTemplateRow {
  id: string;
  site_id: string;
  program_id: string | null;
  phase: string;
  title: string;
  description: string | null;
  template_url: string;
  link_check_status: string;
  link_checked_at: string | null;
  active: number;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const requestedSiteId = cleanId(url.searchParams.get("siteId"));
  if (url.searchParams.has("siteId") && !requestedSiteId) {
    return json({ error: "invalid_site_id" }, { status: 400 });
  }

  const siteIds = requestedSiteId
    ? await canAccessSite(env, user, requestedSiteId) ? [requestedSiteId] : []
    : await getAccessibleSiteIds(env, user);
  if (!siteIds.length) return json({ error: "forbidden" }, { status: 403 });

  const context = await getViewerRoleContext(env, user);
  const isStudent = context.roleIds.includes("student");
  const broadProjectAccess = context.isGlobalAdmin
    || context.roleIds.includes("site_admin")
    || context.roleIds.includes("administration");
  const scopedStudentIds = new Set<string>();
  if (context.roleIds.includes("program_teacher")) {
    for (const studentId of (await getProgramTeacherScopedStudentIds(env, user)).studentIds) scopedStudentIds.add(studentId);
  }
  if (context.roleIds.includes("mentor")) {
    for (const studentId of await getMentorAssignedStudentIds(env, user)) scopedStudentIds.add(studentId);
  }
  if (context.roleIds.includes("viewer")) {
    for (const studentId of await getViewerAssignedStudentIds(env, user.id)) scopedStudentIds.add(studentId);
  }
  if (isStudent) scopedStudentIds.add(user.id);

  const directoryQuery = parseProjectDirectoryQuery(url);
  const accessFilter: ProjectAccessFilter = {
    broad: broadProjectAccess,
    studentIds: Array.from(scopedStudentIds),
  };
  const summaryRow = await loadProjectSummary(env, siteIds, accessFilter);
  const filteredTotal = await countProjects(env, siteIds, accessFilter, directoryQuery);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / directoryQuery.pageSize));
  const page = Math.min(directoryQuery.page, totalPages);
  const projectsPage = await loadProjects(env, siteIds, accessFilter, {
    ...directoryQuery,
    page,
  });

  const projectIds = projectsPage.map((project) => project.id);
  const members = await loadProjectMembers(env, projectIds);
  const mentors = await loadProjectMentors(env, projectIds);
  const projectAdultRows = await loadProjectAdultAssignments(env, projectIds, []);
  const projectNoteRows = await loadProjectNotes(env, projectIds);
  const membersByProject = groupRows(members, (row) => row.project_id);
  const mentorsByProject = groupRows(mentors, (row) => row.project_id);
  const adultsByProject = groupRows(projectAdultRows, (row) => row.project_id || "");
  const notesByProject = groupRows(projectNoteRows, (row) => row.project_id);
  const manageableSiteIds: string[] = [];
  for (const siteId of siteIds) {
    if (await canManageProject(env, user, siteId)) manageableSiteIds.push(siteId);
  }

  const projects = projectsPage.map((project) => projectResponse(
    project,
    membersByProject.get(project.id) || [],
    mentorsByProject.get(project.id) || [],
    adultsByProject.get(project.id) || [],
    notesByProject.get(project.id) || [],
    context.primaryRole,
    user.id,
    manageableSiteIds.includes(project.site_id),
    canContributeProjectNote(context.roleIds),
  ));

  const requestAccess = {
    broad: broadProjectAccess,
    studentIds: Array.from(scopedStudentIds),
    adultUserId: context.roleIds.includes("mentor") || context.roleIds.includes("program_teacher") ? user.id : "",
  };
  const requestRows = await loadProjectRequests(env, siteIds, requestAccess);
  const submittedRequestCount = await countSubmittedProjectRequests(
    env,
    siteIds,
    requestAccess,
  );
  const requestMemberRows = await loadProjectRequestMembers(env, requestRows.map((row) => row.id));
  const requestMembersByRequest = groupRows(requestMemberRows, (row) => row.request_id);
  const requestAdultRows = await loadProjectAdultAssignments(env, [], requestRows.map((row) => row.id));
  const adultsByRequest = groupRows(requestAdultRows, (row) => row.request_id || "");
  const requestEventRows = await loadProjectRequestEvents(env, requestRows.map((row) => row.id));
  const requestEventsByRequest = groupRows(requestEventRows, (row) => row.request_id);
  const requests = await Promise.all(requestRows.map(async (row) => {
    const rawMembers = requestMembersByRequest.get(row.id) || [];
    const rawAdults = adultsByRequest.get(row.id) || [];
    const approvalPreview = await buildProjectRequestImpactPreview(row.id, rawMembers, rawAdults);
    return {
      requestId: row.id,
      siteId: row.site_id,
      siteName: row.site_name,
      programId: row.program_id || "",
      submittedByStudentId: row.submitted_by_student_id,
      submittedByName: row.submitted_by_name,
      name: row.proposed_name,
      summary: row.summary || "",
      status: row.status,
      staffFeedback: row.staff_feedback || "",
      approvedProjectId: row.approved_project_id || "",
      members: rawMembers.map(projectRequestMemberResponse),
      adultSetup: projectAdultSetup(rawAdults),
      adultAssignments: rawAdults.map(assignmentResponse),
      approvalPreview,
      history: (requestEventsByRequest.get(row.id) || []).map(projectRequestEventResponse),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }));

  const optionSiteId = requestedSiteId || siteIds[0] || "";
  const mayChooseStudents = isStudent || manageableSiteIds.includes(optionSiteId);
  const optionRows = optionSiteId && mayChooseStudents ? await loadAvailableSiteStudents(env, optionSiteId) : [];
  const templateRows = optionSiteId
    ? await loadProjectTemplates(env, optionSiteId, manageableSiteIds.includes(optionSiteId))
    : [];
  const adultOptionRows = optionSiteId && (isStudent || manageableSiteIds.includes(optionSiteId))
    ? await loadAvailableProjectAdultsForSite(env, optionSiteId)
    : [];
  const canOpenReviewQueue = optionSiteId
    ? await canViewReviewQueue(env, user, optionSiteId)
    : false;
  const canMakeReviewDecision = canOpenReviewQueue
    && (context.roleIds.includes("program_teacher") || context.roleIds.includes("mentor"));
  const availableStudents: StudentOptionRow[] = [];
  for (const candidate of optionRows) {
    if (isStudent || manageableSiteIds.includes(optionSiteId) || await canAccessStudent(env, user, candidate.id)) {
      availableStudents.push(candidate);
    }
  }

  await safeAudit(env, request, user, "project_directory_viewed", requestedSiteId, {
    returned: projects.length,
    role: context.primaryRole,
  });

  return json({
    ok: true,
    siteId: requestedSiteId || null,
    projects,
    requests,
    availableStudents: availableStudents.map((student) => ({
      studentId: student.id,
      displayName: student.display_name,
      email: student.email,
      programName: student.program_name || "",
      cohortLabel: student.cohort_label || "",
    })),
    templates: templateRows.map(projectTemplateResponse),
    availableProjectAdults: {
      mentors: adultOptionRows
        .filter((adult) => adult.role_id === "mentor")
        .map(projectAdultOptionResponse),
      programTeachers: adultOptionRows
        .filter((adult) => adult.role_id === "program_teacher")
        .map(projectAdultOptionResponse),
    },
    summary: {
      total: Number(summaryRow.total || 0),
      teams: Number(summaryRow.teams || 0),
      individual: Number(summaryRow.individual || 0),
      waitingForReview: Number(summaryRow.waiting_for_review || 0),
      needsChanges: Number(summaryRow.needs_changes || 0),
      missingMentor: Number(summaryRow.missing_mentor || 0),
      missingProgramTeacher: Number(summaryRow.missing_program_teacher || 0),
      missingRequiredAdult: Number(summaryRow.missing_required_adult || 0),
      adultsReady: Number(summaryRow.adults_ready || 0),
      studentIdeas: submittedRequestCount,
    },
    pagination: {
      page,
      pageSize: directoryQuery.pageSize,
      total: filteredTotal,
      totalPages,
      returned: projects.length,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      search: directoryQuery.search,
      filter: directoryQuery.filter,
    },
    permissions: {
      canCreate: manageableSiteIds.includes(optionSiteId),
      canManage: manageableSiteIds.includes(optionSiteId),
      canSubmitRequest: isStudent,
      canManageTemplates: manageableSiteIds.includes(optionSiteId),
      canOpenReviewQueue,
      canMakeReviewDecision,
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  let body: CreateProjectBody;
  try {
    body = await readJson<CreateProjectBody>(request);
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const context = await getViewerRoleContext(env, user);
  const action = cleanId(body.action) || (context.roleIds.includes("student") ? "submit_request" : "create_project");

  if (action === "submit_request") {
    if (!context.roleIds.includes("student")) return json({ error: "student_role_required" }, { status: 403 });
    return submitStudentProjectRequest(env, request, user, body);
  }

  if (["accept_project_invitation", "decline_project_invitation"].includes(action)) {
    if (!context.roleIds.includes("student")) return json({ error: "student_role_required" }, { status: 403 });
    return respondToProjectInvitation(env, request, user, body, action);
  }

  if (action === "set_folder_link") {
    return setProjectFolderLink(env, request, user, body);
  }

  if (["create_note", "edit_note", "archive_note", "restore_note"].includes(action)) {
    return mutateProjectNote(env, request, user, context.roleIds, body, action);
  }

  if (action === "save_template") {
    return saveProjectTemplate(env, request, user, body);
  }

  if (action === "archive_template") {
    return archiveProjectTemplate(env, request, user, body);
  }

  if (action === "restore_template") {
    return restoreProjectTemplate(env, request, user, body);
  }

  if (["approve_request", "request_changes", "decline_request"].includes(action)) {
    return decideProjectRequest(env, request, user, body, action);
  }

  if (action === "undo_project_approval") {
    return undoProjectRequestApproval(env, request, user, body);
  }

  if (!["create_project", "update_project"].includes(action)) {
    return json({ error: "invalid_project_action" }, { status: 400 });
  }

  const siteId = cleanId(body.siteId);
  const projectId = cleanId(body.projectId);
  const name = cleanText(body.name, 120);
  const summary = cleanText(body.summary, 500);
  const studentIds = uniqueIds(body.studentIds);
  if (!siteId || !name) return json({ error: "site_and_name_required" }, { status: 400 });
  if (action === "update_project" && !projectId) return json({ error: "project_id_required" }, { status: 400 });
  if (projectId && !await canManageProject(env, user, projectId)) return json({ error: "forbidden" }, { status: 403 });
  if (projectId) {
    const existingProject = await env.DB.prepare(
      "SELECT site_id, status FROM projects WHERE id = ? LIMIT 1",
    ).bind(projectId).first<{ site_id: string; status: string }>();
    if (!existingProject || existingProject.status === "archived") return json({ error: "project_not_found" }, { status: 404 });
    if (existingProject.site_id !== siteId) return json({ error: "project_site_mismatch" }, { status: 400 });
    const adultSetup = projectAdultSetup(await loadProjectAdultAssignments(env, [projectId], []));
    if (!adultSetup.ready) {
      return json({
        error: "project_adults_not_ready",
        message: "Confirm the Mentor and Program Teacher before changing this project team.",
        adultSetup,
      }, { status: 409 });
    }
  }
  const validationError = await validateManagedProjectStudents(env, user, siteId, studentIds);
  if (validationError) return validationError;
  let requiredAdults: { mentorUserId: string; programTeacherUserId: string } | undefined;
  if (!projectId) {
    const mentorUserId = cleanId(body.mentorUserId);
    const programTeacherUserId = cleanId(body.programTeacherUserId);
    if (!mentorUserId || !programTeacherUserId) {
      return json({
        error: "project_adults_required",
        message: "Choose a Mentor and Program Teacher before you create this project.",
      }, { status: 400 });
    }
    const academicScope = await loadStudentAcademicScope(env, studentIds[0], siteId);
    if (!academicScope.programId) return json({ error: "student_program_required" }, { status: 409 });
    const target = {
      projectId: "",
      requestId: "",
      siteId,
      programId: academicScope.programId,
      name,
    };
    const mentor = await validateEligibleProjectAdult(env, target, "mentor", mentorUserId);
    if (!mentor) return json({ error: "mentor_not_eligible" }, { status: 409 });
    const programTeacher = await validateEligibleProjectAdult(env, target, "program_teacher", programTeacherUserId);
    if (!programTeacher) return json({ error: "program_teacher_not_eligible" }, { status: 409 });
    requiredAdults = { mentorUserId, programTeacherUserId };
  }

  const result = await createOrRegroupProject(env, user, {
    siteId,
    projectId: projectId || undefined,
    name,
    summary,
    studentIds,
    requiredAdults,
  });
  await safeAudit(env, request, user, projectId ? "project_updated" : "project_created", result.projectId, {
    siteId,
    studentIds,
    movedFromProjectIds: result.oldProjectIds,
    removedStudentIds: result.removedStudentIds,
  });

  return json({
    ok: true,
    projectId: result.projectId,
    message: projectId
      ? "Project name and team saved."
      : studentIds.length === 1
        ? "The student now has an individual project."
        : `The ${studentIds.length} students now share one project.`,
  }, { status: projectId ? 200 : 201 });
};

async function mutateProjectNote(
  env: Env,
  request: Request,
  user: UserAccount,
  roleIds: string[],
  body: CreateProjectBody,
  action: string,
) {
  const projectId = cleanId(body.projectId);
  if (!projectId) return json({ error: "project_id_required" }, { status: 400 });
  if (!await canAccessProject(env, user, projectId)) return json({ error: "project_not_found" }, { status: 404 });

  const canManage = await canManageProject(env, user, projectId);
  if (!canManage && !canContributeProjectNote(roleIds)) return json({ error: "forbidden" }, { status: 403 });

  if (action === "create_note") {
    const noteBody = cleanNoteBody(body.noteBody);
    if (!noteBody) return json({ error: "project_note_required" }, { status: 400 });
    const noteId = randomId("project-note");
    await env.DB.prepare(
      `INSERT INTO project_notes (id, project_id, author_user_id, body)
       VALUES (?, ?, ?, ?)`,
    ).bind(noteId, projectId, user.id, noteBody).run();
    await safeAudit(env, request, user, "project_note_created", projectId, { noteId, characterCount: noteBody.length });
    return json({ ok: true, noteId, message: "Note added to the project." }, { status: 201 });
  }

  const noteId = cleanId(body.noteId);
  if (!noteId) return json({ error: "project_note_id_required" }, { status: 400 });
  const note = await env.DB.prepare(
    `SELECT id, author_user_id, status
     FROM project_notes
     WHERE id = ? AND project_id = ?
     LIMIT 1`,
  ).bind(noteId, projectId).first<{ id: string; author_user_id: string | null; status: string }>();
  if (!note) return json({ error: "project_note_not_found" }, { status: 404 });
  if (!canManage && note.author_user_id !== user.id) return json({ error: "forbidden" }, { status: 403 });

  if (action === "edit_note") {
    if (note.status !== "active") return json({ error: "restore_note_before_editing" }, { status: 409 });
    const noteBody = cleanNoteBody(body.noteBody);
    if (!noteBody) return json({ error: "project_note_required" }, { status: 400 });
    await env.DB.prepare(
      `UPDATE project_notes
       SET body = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND project_id = ? AND status = 'active'`,
    ).bind(noteBody, noteId, projectId).run();
    await safeAudit(env, request, user, "project_note_edited", projectId, { noteId, characterCount: noteBody.length });
    return json({ ok: true, noteId, message: "Note updated." });
  }

  if (action === "archive_note") {
    if (note.status === "archived") return json({ ok: true, noteId, message: "This note is already archived." });
    await env.DB.prepare(
      `UPDATE project_notes
       SET status = 'archived', archived_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           archived_by = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND project_id = ? AND status = 'active'`,
    ).bind(user.id, noteId, projectId).run();
    await safeAudit(env, request, user, "project_note_archived", projectId, { noteId });
    return json({ ok: true, noteId, message: "Note archived. You can restore it later." });
  }

  if (note.status === "active") return json({ ok: true, noteId, message: "This note is already active." });
  await env.DB.prepare(
    `UPDATE project_notes
     SET status = 'active', archived_at = NULL, archived_by = NULL,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ? AND project_id = ? AND status = 'archived'`,
  ).bind(noteId, projectId).run();
  await safeAudit(env, request, user, "project_note_restored", projectId, { noteId });
  return json({ ok: true, noteId, message: "Note restored." });
}

function canContributeProjectNote(roleIds: string[]): boolean {
  return roleIds.some((roleId) => [
    "student",
    "mentor",
    "program_teacher",
    "site_admin",
    "administration",
    "admin",
    "platform_admin",
    "global_admin",
  ].includes(roleId));
}

async function submitStudentProjectRequest(env: Env, request: Request, user: UserAccount, body: CreateProjectBody) {
  const siteId = cleanId(body.siteId);
  const name = cleanText(body.name, 120);
  const summary = cleanText(body.summary, 500);
  const taggedStudentIds = uniqueIds(body.studentIds).filter((studentId) => studentId !== user.id);
  const studentIds = [user.id, ...taggedStudentIds];
  if (!siteId || !name || !summary) return json({ error: "name_goal_and_school_required" }, { status: 400 });
  if (studentIds.length > 5) return json({ error: "project_needs_one_to_five_students" }, { status: 400 });
  if (!await canAccessSite(env, user, siteId)) return json({ error: "forbidden" }, { status: 403 });
  const students = await loadActiveSiteStudents(env, siteId, studentIds);
  if (students.length !== studentIds.length) return json({ error: "tagged_student_not_in_your_school" }, { status: 404 });
  const academicScope = await loadStudentAcademicScope(env, user.id, siteId);
  if (!academicScope.programId) return json({ error: "student_program_required" }, { status: 409 });
  for (const teammateId of taggedStudentIds) {
    const teammateScope = await loadStudentAcademicScope(env, teammateId, siteId);
    if (teammateScope.programId !== academicScope.programId) {
      return json({ error: "tagged_students_need_same_program" }, { status: 409 });
    }
  }
  const existing = await env.DB.prepare(
    "SELECT id FROM project_requests WHERE submitted_by_student_id = ? AND status = 'submitted' LIMIT 1",
  ).bind(user.id).first<{ id: string }>();
  if (existing) return json({ error: "project_request_already_waiting" }, { status: 409 });

  const requestId = randomId("project-request");
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO project_requests (
         id, site_id, program_id, submitted_by_student_id, proposed_name, summary, status
       ) VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
    ).bind(requestId, siteId, academicScope.programId, user.id, name, summary),
  ];
  studentIds.forEach((studentId, index) => {
    statements.push(env.DB.prepare(
      `INSERT INTO project_request_members (
         request_id, student_user_id, requested_role, invitation_status, responded_at
       ) VALUES (?, ?, ?, ?, CASE WHEN ? = 'accepted' THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END)`,
    ).bind(requestId, studentId, index === 0 ? "lead" : "member", index === 0 ? "accepted" : "pending", index === 0 ? "accepted" : "pending"));
  });
  statements.push(projectRequestEventStatement(env, requestId, user.id, "submitted", {
    studentIds,
    invitedStudentIds: taggedStudentIds,
  }));
  await env.DB.batch(statements);
  await safeAudit(env, request, user, "project_request_submitted", requestId, { siteId, studentIds });
  return json({
    ok: true,
    requestId,
    message: taggedStudentIds.length
      ? "Project idea sent. Your teammates must join. Next, tag your Mentor and Program Teacher."
      : "Project idea sent. Next, tag your Mentor and Program Teacher.",
  }, { status: 201 });
}

async function respondToProjectInvitation(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
  action: string,
) {
  const requestId = cleanId(body.requestId);
  if (!requestId) return json({ error: "request_id_required" }, { status: 400 });
  const decision = action === "accept_project_invitation" ? "accepted" : "declined";
  const invitation = await env.DB.prepare(
    `SELECT project_requests.id, project_requests.site_id, project_requests.status,
       project_request_members.requested_role, project_request_members.invitation_status
     FROM project_requests
     JOIN project_request_members ON project_request_members.request_id = project_requests.id
     WHERE project_requests.id = ? AND project_request_members.student_user_id = ?
     LIMIT 1`,
  ).bind(requestId, user.id).first<{
    id: string;
    site_id: string;
    status: string;
    requested_role: string;
    invitation_status: string;
  }>();
  if (!invitation || !await canAccessSite(env, user, invitation.site_id)) {
    return json({ error: "project_invitation_not_found" }, { status: 404 });
  }
  if (invitation.requested_role === "lead") return json({ error: "project_owner_is_already_joined" }, { status: 409 });
  if (invitation.status !== "submitted") return json({ error: "project_request_already_decided" }, { status: 409 });
  if (invitation.invitation_status === decision) {
    return json({ ok: true, message: decision === "accepted" ? "You already joined this project idea." : "You already declined this project idea." });
  }

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE project_request_members
       SET invitation_status = ?, responded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE request_id = ? AND student_user_id = ? AND requested_role = 'member'`,
    ).bind(decision, requestId, user.id),
    projectRequestEventStatement(
      env,
      requestId,
      user.id,
      decision === "accepted" ? "invitation_accepted" : "invitation_declined",
      { studentId: user.id },
    ),
  ]);
  await safeAudit(env, request, user, `project_invitation_${decision}`, requestId, {});
  return json({
    ok: true,
    message: decision === "accepted"
      ? "You joined the project idea. A teacher can approve it after everyone joins."
      : "You said no. The project owner and teacher will see your answer.",
  });
}

async function setProjectFolderLink(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
) {
  const projectId = cleanId(body.projectId);
  if (!projectId) return json({ error: "project_id_required" }, { status: 400 });
  const folderUrl = cleanGoogleDriveFolderUrl(body.folderUrl);
  if (!folderUrl) return json({ error: "invalid_google_drive_folder_url" }, { status: 400 });

  const canManage = await canManageProject(env, user, projectId);
  const membership = canManage ? { ok: 1 } : await env.DB.prepare(
    `SELECT 1 AS ok
     FROM project_members
     WHERE project_id = ? AND student_user_id = ? AND active = 1
     LIMIT 1`,
  ).bind(projectId, user.id).first<{ ok: number }>();
  if (!membership?.ok) return json({ error: "forbidden" }, { status: 403 });
  if (body.confirmLinkOpened !== true && body.confirmLinkOpened !== "true") {
    return json({ error: "drive_folder_open_confirmation_required" }, { status: 400 });
  }

  const viewerContext = await getViewerRoleContext(env, user);
  const checkStatus = viewerContext.roleIds.includes("student") ? "student_confirmed" : "staff_confirmed";
  const result = await env.DB.prepare(
    `UPDATE projects
     SET drive_folder_url = ?,
         drive_folder_added_by = ?,
         drive_folder_check_status = ?,
         drive_folder_checked_by = ?,
         drive_folder_checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         drive_folder_updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ? AND status != 'archived'`,
  ).bind(folderUrl, user.id, checkStatus, user.id, projectId).run();
  if (!result.meta.changes) return json({ error: "project_not_found" }, { status: 404 });

  await safeAudit(env, request, user, "project_drive_folder_link_saved", projectId, {
    hostname: "drive.google.com",
    checkStatus,
  });
  return json({
    ok: true,
    projectId,
    folderUrl,
    checkStatus,
    message: "Google Drive folder link saved and marked as opened.",
  });
}

async function saveProjectTemplate(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
) {
  const siteId = cleanId(body.siteId);
  const templateId = cleanId(body.templateId);
  const templateUrl = cleanGoogleWorkUrl(body.templateUrl);
  if (!siteId || !templateUrl) {
    return json({ error: "template_fields_required" }, { status: 400 });
  }
  if (!await canManageProject(env, user, siteId)) return json({ error: "forbidden" }, { status: 403 });

  if (templateId) {
    const changeReason = cleanText(body.changeReason, 500);
    if (!changeReason) return json({ error: "template_change_reason_required" }, { status: 400 });
    if (body.confirmImpact !== true && body.confirmImpact !== "true") {
      return json({ error: "template_change_confirmation_required" }, { status: 400 });
    }
    if (body.confirmLinkOpened !== true && body.confirmLinkOpened !== "true") {
      return json({ error: "template_open_confirmation_required" }, { status: 400 });
    }
    const current = await env.DB.prepare(
      `SELECT id, site_id, program_id, phase, title, description, template_url,
              link_check_status, link_checked_at, updated_at
       FROM project_templates
       WHERE id = ? AND site_id = ? AND active = 1
       LIMIT 1`,
    ).bind(templateId, siteId).first<ProjectTemplateRow>();
    if (!current) return json({ error: "template_not_found" }, { status: 404 });

    await env.DB.prepare(
      `UPDATE project_templates
       SET template_url = ?,
           link_check_status = 'staff_confirmed',
           link_checked_by = ?,
           link_checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND site_id = ? AND active = 1`,
    ).bind(templateUrl, user.id, templateId, siteId).run();

    await safeAudit(env, request, user, "project_template_updated", templateId, {
      siteId,
      programId: current.program_id,
      phase: current.phase,
      changeType: "link_only",
      changeReason,
      previousHostname: new URL(current.template_url).hostname,
      hostname: new URL(templateUrl).hostname,
    });
    return json({
      ok: true,
      templateId,
      message: "Template link updated. Students will now open the new link.",
    });
  }

  const title = cleanText(body.name, 120);
  const description = cleanText(body.description, 300);
  const phase = cleanTemplatePhase(body.phase);
  const programId = cleanId(body.programId) || null;
  if (!title || !phase) {
    return json({ error: "template_fields_required" }, { status: 400 });
  }
  if (body.confirmLinkOpened !== true && body.confirmLinkOpened !== "true") {
    return json({ error: "template_open_confirmation_required" }, { status: 400 });
  }
  if (programId) {
    const program = await env.DB.prepare(
      `SELECT 1 AS ok
       FROM programs
       JOIN site_programs ON site_programs.program_id = programs.id
       WHERE programs.id = ? AND site_programs.site_id = ?
         AND programs.active = 1 AND site_programs.active = 1
       LIMIT 1`,
    ).bind(programId, siteId).first<{ ok: number }>();
    if (!program?.ok) return json({ error: "template_program_not_found" }, { status: 404 });
  }

  const id = randomId("template");
  await env.DB.prepare(
    `INSERT INTO project_templates (
       id, site_id, program_id, phase, title, description, template_url, active, created_by,
       link_check_status, link_checked_by, link_checked_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'staff_confirmed', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
  ).bind(id, siteId, programId, phase, title, description || null, templateUrl, user.id, user.id).run();

  await safeAudit(env, request, user, "project_template_created", id, {
    siteId,
    programId,
    phase,
    hostname: new URL(templateUrl).hostname,
  });
  return json({
    ok: true,
    templateId: id,
    message: "Template link added.",
  }, { status: 201 });
}

async function archiveProjectTemplate(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
) {
  const siteId = cleanId(body.siteId);
  const templateId = cleanId(body.templateId);
  const changeReason = cleanText(body.changeReason, 500);
  if (!siteId || !templateId) return json({ error: "template_id_required" }, { status: 400 });
  if (!await canManageProject(env, user, siteId)) return json({ error: "forbidden" }, { status: 403 });
  if (!changeReason) return json({ error: "template_remove_reason_required" }, { status: 400 });
  if (body.confirmImpact !== true && body.confirmImpact !== "true") {
    return json({ error: "template_remove_confirmation_required" }, { status: 400 });
  }
  const current = await env.DB.prepare(
    `SELECT id, site_id, program_id, phase, title, description, template_url, active, updated_at
     FROM project_templates
     WHERE id = ? AND site_id = ? AND active = 1
     LIMIT 1`,
  ).bind(templateId, siteId).first<ProjectTemplateRow>();
  if (!current) return json({ error: "template_not_found" }, { status: 404 });
  const result = await env.DB.prepare(
    `UPDATE project_templates
     SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ? AND site_id = ? AND active = 1`,
  ).bind(templateId, siteId).run();
  if (!result.meta.changes) return json({ error: "template_not_found" }, { status: 404 });
  await safeAudit(env, request, user, "project_template_archived", templateId, {
    siteId,
    phase: current.phase,
    title: current.title,
    changeReason,
    recovery: "restore_template",
  });
  return json({ ok: true, templateId, message: "Template removed from student view. You can restore it below." });
}

async function restoreProjectTemplate(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
) {
  const siteId = cleanId(body.siteId);
  const templateId = cleanId(body.templateId);
  const changeReason = cleanText(body.changeReason, 500);
  if (!siteId || !templateId) return json({ error: "template_id_required" }, { status: 400 });
  if (!await canManageProject(env, user, siteId)) return json({ error: "forbidden" }, { status: 403 });
  if (!changeReason) return json({ error: "template_restore_reason_required" }, { status: 400 });
  if (body.confirmImpact !== true && body.confirmImpact !== "true") {
    return json({ error: "template_restore_confirmation_required" }, { status: 400 });
  }
  const current = await env.DB.prepare(
    `SELECT id, site_id, program_id, phase, title, description, template_url, active, updated_at
     FROM project_templates
     WHERE id = ? AND site_id = ? AND active = 0
     LIMIT 1`,
  ).bind(templateId, siteId).first<ProjectTemplateRow>();
  if (!current) return json({ error: "template_not_found" }, { status: 404 });
  const result = await env.DB.prepare(
    `UPDATE project_templates
     SET active = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ? AND site_id = ? AND active = 0`,
  ).bind(templateId, siteId).run();
  if (!result.meta.changes) return json({ error: "template_not_found" }, { status: 404 });
  await safeAudit(env, request, user, "project_template_restored", templateId, {
    siteId,
    phase: current.phase,
    title: current.title,
    changeReason,
  });
  return json({ ok: true, templateId, message: "Template restored. Students can use it again." });
}

async function decideProjectRequest(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
  action: string,
) {
  const requestId = cleanId(body.requestId);
  const feedback = cleanText(body.feedback, 500);
  if (!requestId) return json({ error: "request_id_required" }, { status: 400 });
  const projectRequest = await env.DB.prepare(
    `SELECT id, site_id, program_id, proposed_name, summary, status
     FROM project_requests WHERE id = ? LIMIT 1`,
  ).bind(requestId).first<{ id: string; site_id: string; program_id: string | null; proposed_name: string; summary: string | null; status: string }>();
  if (!projectRequest) return json({ error: "project_request_not_found" }, { status: 404 });
  if (!await canManageProjectAdultTarget(env, user, {
    projectId: "",
    requestId: projectRequest.id,
    siteId: projectRequest.site_id,
    programId: projectRequest.program_id || "",
    name: projectRequest.proposed_name,
  })) return json({ error: "forbidden" }, { status: 403 });
  if (projectRequest.status !== "submitted") return json({ error: "project_request_already_decided" }, { status: 409 });
  if (action === "request_changes" && !feedback) return json({ error: "feedback_required" }, { status: 400 });

  if (action === "approve_request") {
    const memberRows = await loadProjectRequestMembers(env, [requestId]);
    const adultRows = await loadProjectAdultAssignments(env, [], [requestId]);
    const preview = await buildProjectRequestImpactPreview(requestId, memberRows, adultRows);
    if (!preview.teammatesReady) return json({ error: "project_teammates_not_ready", approvalPreview: preview }, { status: 409 });
    if (!preview.adultSetup.ready) return json({
      error: "project_adults_not_ready",
      message: "A Mentor and Program Teacher must both accept before this project can be approved.",
      adultSetup: preview.adultSetup,
      approvalPreview: preview,
    }, { status: 409 });
    if (body.confirmImpact !== true && body.confirmImpact !== "true") {
      return json({ error: "project_approval_confirmation_required", approvalPreview: preview }, { status: 400 });
    }
    if (!cleanApprovalToken(body.approvalToken) || cleanApprovalToken(body.approvalToken) !== preview.approvalToken) {
      return json({ error: "project_approval_preview_changed", approvalPreview: preview }, { status: 409 });
    }
    const studentIds = memberRows.map((row) => row.student_user_id);
    const validationError = await validateManagedProjectStudents(env, user, projectRequest.site_id, studentIds);
    if (validationError) return validationError;
    const result = await createOrRegroupProject(env, user, {
      siteId: projectRequest.site_id,
      name: projectRequest.proposed_name,
      summary: projectRequest.summary || "",
      studentIds,
      approval: {
        requestId,
        feedback: feedback || "Approved. Your team can start working.",
      },
    });
    await safeAudit(env, request, user, "project_request_approved", requestId, {
      projectId: result.projectId,
      studentIds,
      approvalPreview: preview,
    });
    return json({ ok: true, projectId: result.projectId, message: "Project approved. The team can start working." });
  }

  const status = action === "request_changes" ? "changes_requested" : "declined";
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE project_requests
       SET status = ?, staff_feedback = ?, reviewed_by = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).bind(status, feedback || (status === "declined" ? "This project idea was not approved." : "Please update this idea."), user.id, requestId),
    projectRequestEventStatement(env, requestId, user.id, status === "declined" ? "declined" : "changes_requested", {
      feedback: feedback || "",
    }),
  ]);
  await safeAudit(env, request, user, `project_request_${status}`, requestId, {});
  return json({ ok: true, message: status === "declined" ? "Project idea declined." : "The student can now read what to change." });
}

async function undoProjectRequestApproval(
  env: Env,
  request: Request,
  user: UserAccount,
  body: CreateProjectBody,
) {
  const requestId = cleanId(body.requestId);
  const reason = cleanText(body.changeReason, 500);
  if (!requestId) return json({ error: "request_id_required" }, { status: 400 });
  if (!reason) return json({ error: "project_undo_reason_required" }, { status: 400 });
  if (body.confirmImpact !== true && body.confirmImpact !== "true") {
    return json({ error: "project_undo_confirmation_required" }, { status: 400 });
  }
  const projectRequest = await env.DB.prepare(
    `SELECT id, site_id, program_id, proposed_name, status, approved_project_id
     FROM project_requests WHERE id = ? LIMIT 1`,
  ).bind(requestId).first<{
    id: string;
    site_id: string;
    program_id: string | null;
    proposed_name: string;
    status: string;
    approved_project_id: string | null;
  }>();
  if (!projectRequest) return json({ error: "project_request_not_found" }, { status: 404 });
  if (!await canManageProjectAdultTarget(env, user, {
    projectId: projectRequest.approved_project_id || "",
    requestId: projectRequest.id,
    siteId: projectRequest.site_id,
    programId: projectRequest.program_id || "",
    name: projectRequest.proposed_name,
  })) return json({ error: "forbidden" }, { status: 403 });
  if (projectRequest.status !== "approved" || !projectRequest.approved_project_id) {
    return json({ error: "project_approval_cannot_be_undone" }, { status: 409 });
  }

  const moveRows = await env.DB.prepare(
    `SELECT request_id, student_user_id, from_project_id, from_member_role, to_project_id, reverted_at
     FROM project_request_moves
     WHERE request_id = ?
     ORDER BY student_user_id`,
  ).bind(requestId).all<{
    request_id: string;
    student_user_id: string;
    from_project_id: string | null;
    from_member_role: string | null;
    to_project_id: string;
    reverted_at: string | null;
  }>();
  const moves = moveRows.results || [];
  if (!moves.length || moves.some((move) => !move.from_project_id || move.reverted_at)) {
    return json({ error: "project_rollback_missing_recovery_point" }, { status: 409 });
  }
  const activeMemberships = await loadActiveMemberships(env, moves.map((move) => move.student_user_id));
  const currentByStudent = groupRows(activeMemberships, (membership) => membership.student_user_id);
  const canUndo = moves.every((move) => {
    const current = currentByStudent.get(move.student_user_id) || [];
    return current.length === 1 && current[0].project_id === move.to_project_id;
  });
  if (!canUndo) {
    return json({ error: "project_rollback_membership_changed" }, { status: 409 });
  }

  const statements: D1PreparedStatement[] = [];
  const restoredProjectIds = new Set<string>();
  for (const move of moves) {
    const fromProjectId = move.from_project_id as string;
    restoredProjectIds.add(fromProjectId);
    statements.push(
      env.DB.prepare(
        `UPDATE project_members SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE student_user_id = ? AND active = 1`,
      ).bind(move.student_user_id),
      env.DB.prepare(
        `UPDATE projects SET status = 'active', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND site_id = ?`,
      ).bind(fromProjectId, projectRequest.site_id),
      env.DB.prepare(
        `INSERT INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(project_id, student_user_id) DO UPDATE SET
           member_role = excluded.member_role,
           active = 1,
           assigned_by = excluded.assigned_by,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ).bind(fromProjectId, move.student_user_id, move.from_member_role || "member", user.id),
      ...studentProjectMoveStatements(env, fromProjectId, move.student_user_id),
    );
  }
  statements.push(
    env.DB.prepare(
      `UPDATE projects SET status = 'archived', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND NOT EXISTS (
         SELECT 1 FROM project_members WHERE project_members.project_id = projects.id AND project_members.active = 1
       )`,
    ).bind(projectRequest.approved_project_id),
    env.DB.prepare(
      `UPDATE project_request_moves
       SET reverted_by = ?, reverted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE request_id = ? AND reverted_at IS NULL`,
    ).bind(user.id, requestId),
    env.DB.prepare(
      `UPDATE project_requests
       SET status = 'cancelled', approval_reverted_by = ?,
           approval_reverted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           approval_revert_reason = ?, staff_feedback = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND status = 'approved'`,
    ).bind(user.id, reason, `Approval undone: ${reason}`, requestId),
    projectRequestEventStatement(env, requestId, user.id, "approval_undone", {
      reason,
      archivedProjectId: projectRequest.approved_project_id,
      restoredProjectIds: Array.from(restoredProjectIds),
      studentIds: moves.map((move) => move.student_user_id),
    }),
  );
  await env.DB.batch(statements);
  await safeAudit(env, request, user, "project_request_approval_undone", requestId, {
    reason,
    archivedProjectId: projectRequest.approved_project_id,
    restoredProjectIds: Array.from(restoredProjectIds),
  });
  return json({ ok: true, message: "Approval undone. Each student is back in the project they had before." });
}

async function validateManagedProjectStudents(
  env: Env,
  user: UserAccount,
  siteId: string,
  studentIds: string[],
): Promise<Response | null> {
  if (!siteId || !await canManageProject(env, user, siteId)) return json({ error: "forbidden" }, { status: 403 });
  if (studentIds.length < 1 || studentIds.length > 5) return json({ error: "project_needs_one_to_five_students" }, { status: 400 });
  const students = await loadActiveSiteStudents(env, siteId, studentIds);
  if (students.length !== studentIds.length) return json({ error: "student_not_in_selected_school" }, { status: 404 });
  for (const studentId of studentIds) {
    if (!await canAccessStudent(env, user, studentId)) return json({ error: "student_outside_your_scope" }, { status: 403 });
  }
  const scopes = await Promise.all(studentIds.map((studentId) => loadStudentAcademicScope(env, studentId, siteId)));
  if (scopes.some((scope) => !scope.programId)) return json({ error: "student_program_required" }, { status: 409 });
  if (new Set(scopes.map((scope) => scope.programId)).size !== 1) {
    return json({ error: "project_students_need_same_program" }, { status: 409 });
  }
  return null;
}

async function createOrRegroupProject(
  env: Env,
  user: UserAccount,
  input: {
    siteId: string;
    projectId?: string;
    name: string;
    summary: string;
    studentIds: string[];
    requiredAdults?: { mentorUserId: string; programTeacherUserId: string };
    approval?: { requestId: string; feedback: string };
  },
) {
  const { siteId, name, summary, studentIds } = input;
  const projectId = input.projectId || randomId("project");
  const firstStudentId = studentIds[0];
  const academicScope = await loadStudentAcademicScope(env, firstStudentId, siteId);
  const existingMembers = input.projectId
    ? await env.DB.prepare(
      "SELECT student_user_id FROM project_members WHERE project_id = ? AND active = 1",
    ).bind(projectId).all<{ student_user_id: string }>()
    : { results: [] as Array<{ student_user_id: string }> };
  const existingAdultAssignments = input.projectId
    ? await loadProjectAdultAssignments(env, [projectId], [])
    : [];
  const removedStudentIds = (existingMembers.results || [])
    .map((row) => row.student_user_id)
    .filter((studentId) => !studentIds.includes(studentId));
  const oldMemberships = await loadActiveMemberships(env, studentIds);
  const oldProjectIds = [...new Set(oldMemberships.map((row) => row.project_id).filter((id) => id !== projectId))];
  const priorFolder = !input.projectId && firstStudentId
    ? await env.DB.prepare(
      `SELECT projects.drive_folder_url, projects.drive_folder_added_by, projects.drive_folder_updated_at,
              projects.drive_folder_check_status, projects.drive_folder_checked_by, projects.drive_folder_checked_at
       FROM project_members
       JOIN projects ON projects.id = project_members.project_id
       WHERE project_members.student_user_id = ? AND project_members.active = 1
       ORDER BY projects.updated_at DESC
       LIMIT 1`,
    ).bind(firstStudentId).first<{
      drive_folder_url: string | null;
      drive_folder_added_by: string | null;
      drive_folder_updated_at: string | null;
      drive_folder_check_status: string;
      drive_folder_checked_by: string | null;
      drive_folder_checked_at: string | null;
    }>()
    : null;
  const approvedAdultAssignments = input.approval
    ? await loadProjectAdultAssignments(env, [], [input.approval.requestId])
    : [];
  const statements: D1PreparedStatement[] = [];

  if (input.projectId) {
    statements.push(env.DB.prepare(
      `UPDATE projects
       SET name = ?, summary = ?, program_id = ?, cohort_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND site_id = ?`,
    ).bind(name, summary || "A shared Senior Project workspace.", academicScope.programId, academicScope.cohortId, projectId, siteId));
  } else {
    statements.push(env.DB.prepare(
      `INSERT INTO projects (
         id, site_id, program_id, cohort_id, name, summary, status, current_phase, created_by,
         drive_folder_url, drive_folder_added_by, drive_folder_updated_at,
         drive_folder_check_status, drive_folder_checked_by, drive_folder_checked_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'active', 'start', ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      projectId,
      siteId,
      academicScope.programId,
      academicScope.cohortId,
      name,
      summary || "A shared Senior Project workspace.",
      user.id,
      priorFolder?.drive_folder_url || null,
      priorFolder?.drive_folder_added_by || null,
      priorFolder?.drive_folder_updated_at || null,
      priorFolder?.drive_folder_check_status || "not_checked",
      priorFolder?.drive_folder_checked_by || null,
      priorFolder?.drive_folder_checked_at || null,
    ));
  }

  for (const removedStudentId of removedStudentIds) {
    const personalProjectId = randomId("project");
    const personalScope = await loadStudentAcademicScope(env, removedStudentId, siteId);
    const displayName = await studentDisplayName(env, removedStudentId);
    statements.push(
      env.DB.prepare(
        `UPDATE project_members SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE student_user_id = ? AND active = 1`,
      ).bind(removedStudentId),
      env.DB.prepare(
        `INSERT INTO projects (id, site_id, program_id, cohort_id, name, summary, status, current_phase, created_by)
         VALUES (?, ?, ?, ?, ?, 'Your Senior Project workspace.', 'active', 'start', ?)`,
      ).bind(personalProjectId, siteId, personalScope.programId, personalScope.cohortId, `${displayName} Project`, user.id),
      env.DB.prepare(
        `INSERT INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
         VALUES (?, ?, 'lead', 1, ?)`,
      ).bind(personalProjectId, removedStudentId, user.id),
      ...studentProjectMoveStatements(env, personalProjectId, removedStudentId),
    );
    for (const adult of existingAdultAssignments.filter((row) => row.status === "accepted" && row.assignee_user_id)) {
      const copiedAssignmentId = randomId("project-adult");
      statements.push(
        env.DB.prepare(
          `INSERT INTO project_adult_assignments (
             id, project_id, site_id, program_id, adult_role, assignee_user_id,
             invited_name, invited_email, status, nominated_by, responded_by, responded_at, staff_reason
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?)`,
        ).bind(
          copiedAssignmentId,
          personalProjectId,
          siteId,
          personalScope.programId,
          adult.adult_role,
          adult.assignee_user_id,
          adult.assignee_name || adult.invited_name,
          adult.assignee_email || adult.invited_email,
          user.id,
          user.id,
          "Kept when the student moved to an individual project.",
        ),
        adultAssignmentEventStatement(env, copiedAssignmentId, user.id, "accepted", {
          copiedFromProjectId: projectId,
          teamChanged: true,
        }),
      );
      if (adult.adult_role === "mentor" && adult.assignee_user_id) {
        statements.push(...mentorSyncStatements(env, personalProjectId, adult.assignee_user_id, user.id));
      }
    }
  }

  for (const studentId of studentIds) {
    statements.push(
      env.DB.prepare(
        `UPDATE project_members SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE student_user_id = ? AND active = 1`,
      ).bind(studentId),
      env.DB.prepare(
        `INSERT INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(project_id, student_user_id) DO UPDATE SET
           member_role = excluded.member_role,
           active = 1,
           assigned_by = excluded.assigned_by,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ).bind(projectId, studentId, studentId === firstStudentId ? "lead" : "member", user.id),
      ...studentProjectMoveStatements(env, projectId, studentId),
    );
  }

  if (!input.projectId && input.requiredAdults) {
    const mentorAssignmentId = randomId("project-adult");
    const teacherAssignmentId = randomId("project-adult");
    statements.push(
      env.DB.prepare(
        `INSERT INTO project_adult_assignments (
           id, project_id, site_id, program_id, adult_role, assignee_user_id,
           status, nominated_by, responded_by, responded_at
         ) VALUES (?, ?, ?, ?, 'mentor', ?, 'accepted', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      ).bind(
        mentorAssignmentId,
        projectId,
        siteId,
        academicScope.programId,
        input.requiredAdults.mentorUserId,
        user.id,
        user.id,
      ),
      adultAssignmentEventStatement(env, mentorAssignmentId, user.id, "accepted", { directAssignment: true }),
      env.DB.prepare(
        `INSERT INTO project_adult_assignments (
           id, project_id, site_id, program_id, adult_role, assignee_user_id,
           status, nominated_by, responded_by, responded_at
         ) VALUES (?, ?, ?, ?, 'program_teacher', ?, 'accepted', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      ).bind(
        teacherAssignmentId,
        projectId,
        siteId,
        academicScope.programId,
        input.requiredAdults.programTeacherUserId,
        user.id,
        user.id,
      ),
      adultAssignmentEventStatement(env, teacherAssignmentId, user.id, "accepted", { directAssignment: true }),
      notificationStatement(
        env,
        input.requiredAdults.mentorUserId,
        "project_adult_accepted",
        `You were added to ${name}`,
        "You are the confirmed Mentor for this project.",
        projectId,
      ),
      notificationStatement(
        env,
        input.requiredAdults.programTeacherUserId,
        "project_adult_accepted",
        `You were added to ${name}`,
        "You are the confirmed Program Teacher for this project.",
        projectId,
      ),
      ...mentorSyncStatements(env, projectId, input.requiredAdults.mentorUserId, user.id),
    );
  }

  if (!input.requiredAdults) {
    statements.push(env.DB.prepare(
      `INSERT OR IGNORE INTO project_mentor_assignments (
         id, project_id, mentor_user_id, active, assigned_by, created_at, updated_at
       )
       SELECT 'project-mentor-' || lower(hex(randomblob(16))), ?, mentor_user_id, 1, ?,
         strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       FROM mentor_assignments
       WHERE student_user_id IN (${studentIds.map(() => "?").join(", ")}) AND active = 1`,
    ).bind(projectId, user.id, ...studentIds));
  }

  for (const oldProjectId of oldProjectIds) {
    statements.push(env.DB.prepare(
      `UPDATE projects SET status = 'archived', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND NOT EXISTS (
         SELECT 1 FROM project_members WHERE project_members.project_id = projects.id AND project_members.active = 1
       )`,
    ).bind(oldProjectId));
  }
  if (input.approval) {
    const membershipsByStudent = new Map(oldMemberships.map((membership) => [membership.student_user_id, membership]));
    for (const studentId of studentIds) {
      const oldMembership = membershipsByStudent.get(studentId);
      statements.push(env.DB.prepare(
        `INSERT INTO project_request_moves (
           request_id, student_user_id, from_project_id, from_member_role, to_project_id, approved_by
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(
        input.approval.requestId,
        studentId,
        oldMembership?.project_id || null,
        oldMembership?.member_role || null,
        projectId,
        user.id,
      ));
    }
    for (const adult of approvedAdultAssignments) {
      statements.push(
        env.DB.prepare(
          `UPDATE project_adult_assignments
           SET project_id = ?, request_id = NULL, site_id = ?, program_id = ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ? AND request_id = ?`,
        ).bind(projectId, siteId, academicScope.programId, adult.id, input.approval.requestId),
        adultAssignmentEventStatement(env, adult.id, user.id, "moved_to_project", { projectId }),
      );
    }
    const acceptedMentor = approvedAdultAssignments.find(
      (adult) => adult.adult_role === "mentor" && adult.status === "accepted" && adult.assignee_user_id,
    );
    if (acceptedMentor?.assignee_user_id) {
      statements.push(...mentorSyncStatements(env, projectId, acceptedMentor.assignee_user_id, user.id));
    }
    statements.push(
      env.DB.prepare(
        `UPDATE project_requests
         SET status = 'approved', staff_feedback = ?, reviewed_by = ?,
             reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), approved_project_id = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND status = 'submitted'`,
      ).bind(input.approval.feedback, user.id, projectId, input.approval.requestId),
      projectRequestEventStatement(env, input.approval.requestId, user.id, "approved", {
        projectId,
        studentIds,
        movedFromProjectIds: oldProjectIds,
      }),
    );
  }
  await env.DB.batch(statements);
  return { projectId, oldProjectIds, removedStudentIds };
}

function studentProjectMoveStatements(env: Env, projectId: string, studentId: string): D1PreparedStatement[] {
  return [
    env.DB.prepare("UPDATE submissions SET project_id = ? WHERE student_id = ?").bind(projectId, studentId),
    env.DB.prepare("UPDATE progress_records SET project_id = ? WHERE student_id = ?").bind(projectId, studentId),
    env.DB.prepare("UPDATE evidence_artifacts SET project_id = ? WHERE student_id = ?").bind(projectId, studentId),
    env.DB.prepare("UPDATE status_history SET project_id = ? WHERE student_id = ?").bind(projectId, studentId),
    env.DB.prepare("UPDATE mentor_meetings SET project_id = ? WHERE student_user_id = ?").bind(projectId, studentId),
    env.DB.prepare("UPDATE presentation_slots SET project_id = ? WHERE student_user_id = ?").bind(projectId, studentId),
  ];
}

function projectSubmissionMatchSql(alias = "submissions"): string {
  return `(${alias}.project_id = projects.id OR (
    ${alias}.project_id IS NULL AND EXISTS (
      SELECT 1 FROM project_members submission_members
      WHERE submission_members.project_id = projects.id
        AND submission_members.student_user_id = ${alias}.student_id
        AND submission_members.active = 1
    )
  ))`;
}

async function loadProjectSummary(
  env: Env,
  siteIds: string[],
  access: ProjectAccessFilter,
): Promise<ProjectSummaryRow> {
  const where = projectWhere(siteIds, access);
  const row = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN (
         SELECT COUNT(*) FROM project_members
         WHERE project_members.project_id = projects.id AND project_members.active = 1
       ) > 1 THEN 1 ELSE 0 END), 0) AS teams,
       COALESCE(SUM(CASE WHEN (
         SELECT COUNT(*) FROM project_members
         WHERE project_members.project_id = projects.id AND project_members.active = 1
       ) = 1 THEN 1 ELSE 0 END), 0) AS individual,
       COALESCE(SUM(CASE WHEN EXISTS (
         SELECT 1 FROM submissions
         WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'submitted'
       ) THEN 1 ELSE 0 END), 0) AS waiting_for_review,
       COALESCE(SUM(CASE WHEN EXISTS (
         SELECT 1 FROM submissions
         WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'revision_requested'
       ) THEN 1 ELSE 0 END), 0) AS needs_changes,
       COALESCE(SUM(CASE WHEN NOT EXISTS (
         SELECT 1 FROM project_adult_assignments
         WHERE project_adult_assignments.project_id = projects.id
           AND project_adult_assignments.adult_role = 'mentor'
           AND project_adult_assignments.status = 'accepted'
       ) THEN 1 ELSE 0 END), 0) AS missing_mentor,
       COALESCE(SUM(CASE WHEN NOT EXISTS (
         SELECT 1 FROM project_adult_assignments
         WHERE project_adult_assignments.project_id = projects.id
           AND project_adult_assignments.adult_role = 'program_teacher'
           AND project_adult_assignments.status = 'accepted'
       ) THEN 1 ELSE 0 END), 0) AS missing_program_teacher,
       COALESCE(SUM(CASE WHEN
         NOT EXISTS (
           SELECT 1 FROM project_adult_assignments
           WHERE project_adult_assignments.project_id = projects.id
             AND project_adult_assignments.adult_role = 'mentor'
             AND project_adult_assignments.status = 'accepted'
         )
         OR NOT EXISTS (
           SELECT 1 FROM project_adult_assignments
           WHERE project_adult_assignments.project_id = projects.id
             AND project_adult_assignments.adult_role = 'program_teacher'
             AND project_adult_assignments.status = 'accepted'
         )
       THEN 1 ELSE 0 END), 0) AS missing_required_adult,
       COALESCE(SUM(CASE WHEN
         EXISTS (
           SELECT 1 FROM project_adult_assignments
           WHERE project_adult_assignments.project_id = projects.id
             AND project_adult_assignments.adult_role = 'mentor'
             AND project_adult_assignments.status = 'accepted'
         )
         AND EXISTS (
           SELECT 1 FROM project_adult_assignments
           WHERE project_adult_assignments.project_id = projects.id
             AND project_adult_assignments.adult_role = 'program_teacher'
             AND project_adult_assignments.status = 'accepted'
         )
       THEN 1 ELSE 0 END), 0) AS adults_ready
     FROM projects
     JOIN sites ON sites.id = projects.site_id AND sites.status = 'active'
     WHERE ${where.sql}`,
  ).bind(...where.bindings).first<ProjectSummaryRow>();
  return row || {
    total: 0,
    teams: 0,
    individual: 0,
    waiting_for_review: 0,
    needs_changes: 0,
    missing_mentor: 0,
    missing_program_teacher: 0,
    missing_required_adult: 0,
    adults_ready: 0,
  };
}

async function countProjects(
  env: Env,
  siteIds: string[],
  access: ProjectAccessFilter,
  query: ProjectDirectoryQuery,
): Promise<number> {
  const where = projectWhere(siteIds, access, query);
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS total
     FROM projects
     JOIN sites ON sites.id = projects.site_id AND sites.status = 'active'
     LEFT JOIN programs ON programs.id = projects.program_id
     LEFT JOIN cohorts ON cohorts.id = projects.cohort_id
     WHERE ${where.sql}`,
  ).bind(...where.bindings).first<{ total: number }>();
  return Number(row?.total || 0);
}

async function loadProjects(
  env: Env,
  siteIds: string[],
  access: ProjectAccessFilter,
  query: ProjectDirectoryQuery,
): Promise<ProjectRow[]> {
  const where = projectWhere(siteIds, access, query);
  const offset = Math.max(0, (query.page - 1) * query.pageSize);
  const rows = await env.DB.prepare(
    `SELECT
       projects.id,
       projects.site_id,
       sites.name AS site_name,
       projects.program_id,
       programs.name AS program_name,
       projects.cohort_id,
       cohorts.label AS cohort_name,
       projects.name,
       projects.summary,
       projects.drive_folder_url,
       projects.drive_folder_updated_at,
       projects.drive_folder_check_status,
       projects.drive_folder_checked_at,
       projects.status,
       projects.current_phase,
       projects.updated_at,
       (SELECT COUNT(*) FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'submitted') AS submitted_count,
       (SELECT COUNT(*) FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'revision_requested') AS revision_count,
       (SELECT COUNT(*) FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'approved') AS approved_count
       ,(
         SELECT submissions.id
         FROM submissions
         WHERE ${projectSubmissionMatchSql()}
           AND submissions.status IN ('submitted', 'revision_requested')
         ORDER BY CASE submissions.status WHEN 'submitted' THEN 0 ELSE 1 END, submissions.updated_at DESC
         LIMIT 1
       ) AS next_submission_id
     FROM projects
     JOIN sites ON sites.id = projects.site_id AND sites.status = 'active'
     LEFT JOIN programs ON programs.id = projects.program_id
     LEFT JOIN cohorts ON cohorts.id = projects.cohort_id
     WHERE ${where.sql}
     ORDER BY
       CASE WHEN EXISTS (SELECT 1 FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'submitted') THEN 0 ELSE 1 END,
       projects.updated_at DESC,
       projects.name ASC
     LIMIT ? OFFSET ?`,
  ).bind(...where.bindings, query.pageSize, offset).all<ProjectRow>();
  const projects = rows.results || [];
  const themes = await loadSiteBrandThemesByIds(env, [...new Set(projects.map((project) => project.site_id))]);
  return projects.map((project) => ({ ...project, brand_theme: themes.get(project.site_id) || "default" }));
}

function projectWhere(
  siteIds: string[],
  access: ProjectAccessFilter,
  query?: ProjectDirectoryQuery,
): { sql: string; bindings: unknown[] } {
  const clauses = [
    `projects.site_id IN (${siteIds.map(() => "?").join(", ")})`,
    "projects.status != 'archived'",
  ];
  const bindings: unknown[] = [...siteIds];

  if (!access.broad) {
    if (!access.studentIds.length) {
      clauses.push("0 = 1");
    } else {
      clauses.push(`EXISTS (
        SELECT 1 FROM project_members visible_members
        WHERE visible_members.project_id = projects.id
          AND visible_members.active = 1
          AND visible_members.student_user_id IN (SELECT value FROM json_each(?))
      )`);
      bindings.push(JSON.stringify(access.studentIds));
    }
  }

  if (query?.search) {
    const needle = query.search.toLocaleLowerCase();
    clauses.push(`(
      instr(lower(projects.name), ?) > 0
      OR instr(lower(COALESCE(projects.summary, '')), ?) > 0
      OR instr(lower(COALESCE(programs.name, '')), ?) > 0
      OR instr(lower(COALESCE(cohorts.label, '')), ?) > 0
      OR EXISTS (
        SELECT 1
        FROM project_members search_members
        JOIN user_accounts search_students ON search_students.id = search_members.student_user_id
        WHERE search_members.project_id = projects.id
          AND search_members.active = 1
          AND instr(lower(search_students.display_name), ?) > 0
      )
    )`);
    bindings.push(needle, needle, needle, needle, needle);
  }

  if (query?.filter === "review") {
    clauses.push(`EXISTS (SELECT 1 FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'submitted')`);
    clauses.push(`NOT EXISTS (SELECT 1 FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'revision_requested')`);
  } else if (query?.filter === "changes") {
    clauses.push(`EXISTS (SELECT 1 FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status = 'revision_requested')`);
  } else if (query?.filter === "working") {
    clauses.push(`NOT EXISTS (SELECT 1 FROM submissions WHERE ${projectSubmissionMatchSql()} AND submissions.status IN ('submitted', 'revision_requested'))`);
  } else if (query?.filter === "team") {
    clauses.push("(SELECT COUNT(*) FROM project_members WHERE project_members.project_id = projects.id AND project_members.active = 1) > 1");
  } else if (query?.filter === "individual") {
    clauses.push("(SELECT COUNT(*) FROM project_members WHERE project_members.project_id = projects.id AND project_members.active = 1) = 1");
  }

  return { sql: clauses.join("\n       AND "), bindings };
}

async function loadProjectTemplates(env: Env, siteId: string, includeInactive = false): Promise<ProjectTemplateRow[]> {
  const rows = await env.DB.prepare(
    `SELECT id, site_id, program_id, phase, title, description, template_url,
            link_check_status, link_checked_at, active, updated_at
     FROM project_templates
     WHERE site_id = ? AND (active = 1 OR ? = 1)
     ORDER BY
       active DESC,
       CASE phase
         WHEN 'start' THEN 0 WHEN 'phase-1' THEN 1 WHEN 'phase-2a' THEN 2 WHEN 'phase-2b' THEN 3
         WHEN 'phase-3a' THEN 4 WHEN 'phase-3b' THEN 5 WHEN 'phase-4' THEN 6 WHEN 'finish' THEN 7 ELSE 8
       END,
       title ASC
     LIMIT 100`,
  ).bind(siteId, includeInactive ? 1 : 0).all<ProjectTemplateRow>();
  return rows.results || [];
}

async function loadProjectMembers(env: Env, projectIds: string[]): Promise<ProjectMemberRow[]> {
  if (!projectIds.length) return [];
  const rows = await env.DB.prepare(
    `SELECT
       project_members.project_id,
       project_members.student_user_id,
       user_accounts.display_name,
       user_accounts.email,
       project_members.member_role
     FROM project_members
     JOIN user_accounts ON user_accounts.id = project_members.student_user_id
     WHERE project_members.project_id IN (SELECT value FROM json_each(?))
       AND project_members.active = 1
     ORDER BY project_members.project_id, CASE project_members.member_role WHEN 'lead' THEN 0 ELSE 1 END, user_accounts.display_name`,
  ).bind(JSON.stringify(projectIds)).all<ProjectMemberRow>();
  return rows.results || [];
}

async function loadProjectMentors(env: Env, projectIds: string[]): Promise<ProjectMentorRow[]> {
  if (!projectIds.length) return [];
  const rows = await env.DB.prepare(
    `SELECT
       project_mentor_assignments.project_id,
       project_mentor_assignments.mentor_user_id,
       user_accounts.display_name
     FROM project_mentor_assignments
     JOIN user_accounts ON user_accounts.id = project_mentor_assignments.mentor_user_id
     WHERE project_mentor_assignments.project_id IN (SELECT value FROM json_each(?))
       AND project_mentor_assignments.active = 1
     ORDER BY project_mentor_assignments.project_id, user_accounts.display_name`,
  ).bind(JSON.stringify(projectIds)).all<ProjectMentorRow>();
  return rows.results || [];
}

async function loadProjectNotes(env: Env, projectIds: string[]): Promise<ProjectNoteRow[]> {
  if (!projectIds.length) return [];
  const rows = await env.DB.prepare(
    `SELECT
       project_notes.id,
       project_notes.project_id,
       project_notes.author_user_id,
       COALESCE(author.display_name, 'Former user') AS author_name,
       project_notes.body,
       project_notes.status,
       project_notes.created_at,
       project_notes.updated_at,
       project_notes.archived_at,
       archived_by.display_name AS archived_by_name
     FROM project_notes
     LEFT JOIN user_accounts author ON author.id = project_notes.author_user_id
     LEFT JOIN user_accounts archived_by ON archived_by.id = project_notes.archived_by
     WHERE project_notes.project_id IN (SELECT value FROM json_each(?))
     ORDER BY project_notes.project_id, project_notes.status, project_notes.updated_at DESC, project_notes.id DESC`,
  ).bind(JSON.stringify(projectIds)).all<ProjectNoteRow>();
  return rows.results || [];
}

async function loadProjectRequests(
  env: Env,
  siteIds: string[],
  access: { broad: boolean; studentIds: string[]; adultUserId: string },
): Promise<ProjectRequestRow[]> {
  if (!siteIds.length) return [];
  const accessFilter = access.broad
    ? ""
    : `AND (
       EXISTS (
         SELECT 1 FROM project_request_members visible_member
         WHERE visible_member.request_id = project_requests.id
           AND visible_member.student_user_id IN (SELECT value FROM json_each(?))
       )
       OR EXISTS (
         SELECT 1 FROM project_adult_assignments visible_adult
         WHERE visible_adult.request_id = project_requests.id
           AND visible_adult.assignee_user_id = ?
           AND visible_adult.status IN ('pending', 'accepted')
       )
     )`;
  const rows = await env.DB.prepare(
    `SELECT
       project_requests.id,
       project_requests.site_id,
       project_requests.program_id,
       sites.name AS site_name,
       project_requests.submitted_by_student_id,
       user_accounts.display_name AS submitted_by_name,
       project_requests.proposed_name,
       project_requests.summary,
       project_requests.status,
       project_requests.staff_feedback,
       project_requests.approved_project_id,
       project_requests.created_at,
       project_requests.updated_at
     FROM project_requests
     JOIN sites ON sites.id = project_requests.site_id
     JOIN user_accounts ON user_accounts.id = project_requests.submitted_by_student_id
     WHERE project_requests.site_id IN (${siteIds.map(() => "?").join(", ")})
       ${accessFilter}
     ORDER BY
       CASE project_requests.status WHEN 'submitted' THEN 0 WHEN 'changes_requested' THEN 1 ELSE 2 END,
       project_requests.created_at DESC
     LIMIT 200`,
  ).bind(...siteIds, ...(access.broad ? [] : [JSON.stringify(access.studentIds), access.adultUserId])).all<ProjectRequestRow>();
  return rows.results || [];
}

async function countSubmittedProjectRequests(
  env: Env,
  siteIds: string[],
  access: { broad: boolean; studentIds: string[]; adultUserId: string },
): Promise<number> {
  if (!siteIds.length) return 0;
  const accessFilter = access.broad
    ? ""
    : `AND (
       EXISTS (
         SELECT 1 FROM project_request_members visible_member
         WHERE visible_member.request_id = project_requests.id
           AND visible_member.student_user_id IN (SELECT value FROM json_each(?))
       )
       OR EXISTS (
         SELECT 1 FROM project_adult_assignments visible_adult
         WHERE visible_adult.request_id = project_requests.id
           AND visible_adult.assignee_user_id = ?
           AND visible_adult.status IN ('pending', 'accepted')
       )
     )`;
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS total
     FROM project_requests
     WHERE site_id IN (${siteIds.map(() => "?").join(", ")})
       AND status = 'submitted'
       ${accessFilter}`,
  ).bind(...siteIds, ...(access.broad ? [] : [JSON.stringify(access.studentIds), access.adultUserId])).first<{ total: number }>();
  return Number(row?.total || 0);
}

async function loadProjectRequestMembers(env: Env, requestIds: string[]): Promise<ProjectRequestMemberRow[]> {
  if (!requestIds.length) return [];
  const rows = await env.DB.prepare(
    `SELECT
       project_request_members.request_id,
       project_request_members.student_user_id,
       user_accounts.display_name,
       project_request_members.requested_role,
       project_request_members.invitation_status,
       project_request_members.responded_at,
       current_member.project_id AS current_project_id,
       current_project.name AS current_project_name,
       current_member.member_role AS current_member_role,
       (SELECT COUNT(*) FROM submissions WHERE submissions.student_id = project_request_members.student_user_id) AS submission_count,
       (SELECT COUNT(*) FROM progress_records WHERE progress_records.student_id = project_request_members.student_user_id) AS progress_count,
       (SELECT COUNT(*) FROM evidence_artifacts WHERE evidence_artifacts.student_id = project_request_members.student_user_id) AS evidence_count,
       (SELECT COUNT(*) FROM status_history WHERE status_history.student_id = project_request_members.student_user_id) AS history_count,
       (SELECT COUNT(*) FROM mentor_meetings WHERE mentor_meetings.student_user_id = project_request_members.student_user_id) AS meeting_count,
       (SELECT COUNT(*) FROM presentation_slots WHERE presentation_slots.student_user_id = project_request_members.student_user_id) AS presentation_count
     FROM project_request_members
     JOIN user_accounts ON user_accounts.id = project_request_members.student_user_id
     LEFT JOIN project_members current_member
       ON current_member.student_user_id = project_request_members.student_user_id
      AND current_member.active = 1
     LEFT JOIN projects current_project ON current_project.id = current_member.project_id
     WHERE project_request_members.request_id IN (SELECT value FROM json_each(?))
     ORDER BY project_request_members.request_id,
       CASE project_request_members.requested_role WHEN 'lead' THEN 0 ELSE 1 END,
       user_accounts.display_name`,
  ).bind(JSON.stringify(requestIds)).all<ProjectRequestMemberRow>();
  return rows.results || [];
}

async function loadProjectRequestEvents(env: Env, requestIds: string[]): Promise<ProjectRequestEventRow[]> {
  if (!requestIds.length) return [];
  const rows = await env.DB.prepare(
    `SELECT
       project_request_events.request_id,
       project_request_events.actor_user_id,
       actor.display_name AS actor_name,
       project_request_events.action,
       project_request_events.detail_json,
       project_request_events.created_at
     FROM project_request_events
     LEFT JOIN user_accounts actor ON actor.id = project_request_events.actor_user_id
     WHERE project_request_events.request_id IN (SELECT value FROM json_each(?))
     ORDER BY project_request_events.created_at, project_request_events.id`,
  ).bind(JSON.stringify(requestIds)).all<ProjectRequestEventRow>();
  return rows.results || [];
}

async function loadAvailableSiteStudents(env: Env, siteId: string): Promise<StudentOptionRow[]> {
  const rows = await env.DB.prepare(
     `SELECT DISTINCT
       user_accounts.id,
       user_accounts.display_name,
       user_accounts.email,
       (
         SELECT programs.name
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN programs ON programs.id = groups.program_id
         WHERE group_memberships.user_id = user_accounts.id
         ORDER BY programs.name
         LIMIT 1
       ) AS program_name,
       (
         SELECT cohorts.label
         FROM group_memberships
         JOIN groups ON groups.id = group_memberships.group_id
         JOIN cohorts ON cohorts.id = groups.cohort_id
         WHERE group_memberships.user_id = user_accounts.id
         ORDER BY cohorts.school_year DESC, cohorts.label
         LIMIT 1
       ) AS cohort_label
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id AND user_roles.role_id = 'student'
     JOIN site_users ON site_users.user_id = user_accounts.id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
     WHERE user_accounts.status = 'active'
     ORDER BY user_accounts.display_name
     LIMIT 500`,
  ).bind(siteId).all<StudentOptionRow>();
  return rows.results || [];
}

async function loadAvailableProjectAdultsForSite(env: Env, siteId: string): Promise<ProjectAdultOptionRow[]> {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT
       user_accounts.id,
       user_accounts.display_name,
       user_accounts.email,
       user_roles.role_id,
       user_roles.scope_id
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id
     JOIN site_users ON site_users.user_id = user_accounts.id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE user_accounts.status = 'active'
       AND (
         user_roles.role_id = 'mentor'
         OR (
           user_roles.role_id = 'program_teacher'
           AND user_roles.scope_type = 'program'
           AND user_roles.scope_id != ''
         )
       )
     ORDER BY user_roles.role_id, user_accounts.display_name
     LIMIT 300`,
  ).bind(siteId).all<ProjectAdultOptionRow>();
  return rows.results || [];
}

async function loadActiveSiteStudents(env: Env, siteId: string, studentIds: string[]) {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT user_accounts.id
     FROM user_accounts
     JOIN user_roles ON user_roles.user_id = user_accounts.id AND user_roles.role_id = 'student'
     JOIN site_users ON site_users.user_id = user_accounts.id
       AND site_users.site_id = ?
       AND site_users.membership_status = 'active'
     WHERE user_accounts.id IN (${studentIds.map(() => "?").join(", ")})
       AND user_accounts.status = 'active'`,
  ).bind(siteId, ...studentIds).all<{ id: string }>();
  return rows.results || [];
}

async function loadActiveMemberships(env: Env, studentIds: string[]) {
  const rows = await env.DB.prepare(
    `SELECT project_id, student_user_id, member_role
     FROM project_members
     WHERE student_user_id IN (${studentIds.map(() => "?").join(", ")})
       AND active = 1`,
  ).bind(...studentIds).all<ActiveProjectMembership>();
  return rows.results || [];
}

async function loadStudentAcademicScope(env: Env, studentId: string, siteId: string) {
  const row = await env.DB.prepare(
    `SELECT
       groups.program_id,
       groups.cohort_id
     FROM group_memberships
     JOIN groups ON groups.id = group_memberships.group_id
     JOIN site_programs
       ON site_programs.program_id = groups.program_id
      AND site_programs.site_id = ?
      AND site_programs.active = 1
     WHERE group_memberships.user_id = ?
     ORDER BY groups.program_id, groups.cohort_id
     LIMIT 1`,
  ).bind(siteId, studentId).first<{ program_id: string | null; cohort_id: string | null }>();
  return { programId: row?.program_id || null, cohortId: row?.cohort_id || null };
}

async function studentDisplayName(env: Env, studentId: string): Promise<string> {
  const row = await env.DB.prepare(
    "SELECT display_name FROM user_accounts WHERE id = ? LIMIT 1",
  ).bind(studentId).first<{ display_name: string }>();
  return cleanText(row?.display_name || "Student", 100) || "Student";
}

function projectResponse(
  project: ProjectRow,
  members: ProjectMemberRow[],
  mentors: ProjectMentorRow[],
  adults: ProjectAdultAssignmentRow[],
  notes: ProjectNoteRow[],
  role: string,
  viewerUserId: string,
  canManageNotes: boolean,
  canCreateNote: boolean,
) {
  const waitingForReviewCount = Number(project.submitted_count || 0);
  const revisionRequestedCount = Number(project.revision_count || 0);
  const adultSetup = projectAdultSetup(adults);
  const nextAction = !adultSetup.ready
    ? role === "student"
      ? "Tag a Mentor and Program Teacher. You may keep working while they answer."
      : "Confirm the Mentor and Program Teacher before approving project work."
    : revisionRequestedCount > 0
    ? role === "student" ? "Open your project and fix the requested changes." : "Open this project and check the requested changes."
    : waitingForReviewCount > 0
      ? role === "student" ? "Your work is waiting for review. You may work ahead." : "Open this project and review the team's work."
      : role === "student" ? "Open your project and do the next step." : "Open this project and check its next step.";
  return {
    projectId: project.id,
    siteId: project.site_id,
    siteName: project.site_name,
    brandTheme: project.brand_theme || "default",
    programId: project.program_id,
    programName: project.program_name || "Program not set",
    cohortId: project.cohort_id,
    cohortName: project.cohort_name || "",
    name: project.name,
    summary: project.summary || "",
    driveFolderUrl: project.drive_folder_url || "",
    driveFolderUpdatedAt: project.drive_folder_updated_at || "",
    driveFolderCheckStatus: project.drive_folder_check_status || "not_checked",
    driveFolderCheckedAt: project.drive_folder_checked_at || "",
    status: project.status,
    currentPhase: project.current_phase,
    memberCount: members.length,
    members: members.map((member) => ({
      studentId: member.student_user_id,
      displayName: member.display_name,
      email: member.email,
      role: member.member_role,
    })),
    mentors: mentors.map((mentor) => ({ mentorId: mentor.mentor_user_id, displayName: mentor.display_name })),
    adultSetup,
    adultAssignments: adults.map(assignmentResponse),
    notes: notes.map((note) => ({
      noteId: note.id,
      authorUserId: note.author_user_id || "",
      authorName: note.author_name || "Former user",
      body: note.body,
      status: note.status,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      archivedAt: note.archived_at || "",
      archivedByName: note.archived_by_name || "",
      canEdit: note.status === "active" && (canManageNotes || note.author_user_id === viewerUserId),
      canArchive: note.status === "active" && (canManageNotes || note.author_user_id === viewerUserId),
      canRestore: note.status === "archived" && (canManageNotes || note.author_user_id === viewerUserId),
    })),
    notePermissions: {
      canCreate: canCreateNote || canManageNotes,
      canManage: canManageNotes,
    },
    waitingForReviewCount,
    revisionRequestedCount,
    approvedCount: Number(project.approved_count || 0),
    nextSubmissionId: project.next_submission_id || "",
    nextAction,
    updatedAt: project.updated_at,
  };
}

function projectRequestMemberResponse(member: ProjectRequestMemberRow) {
  const moveCounts = {
    submissions: Number(member.submission_count || 0),
    progress: Number(member.progress_count || 0),
    evidence: Number(member.evidence_count || 0),
    history: Number(member.history_count || 0),
    meetings: Number(member.meeting_count || 0),
    presentations: Number(member.presentation_count || 0),
  };
  return {
    studentId: member.student_user_id,
    displayName: member.display_name,
    role: member.requested_role,
    invitationStatus: member.invitation_status,
    respondedAt: member.responded_at || "",
    currentProjectId: member.current_project_id || "",
    currentProjectName: member.current_project_name || "No current project",
    currentMemberRole: member.current_member_role || "",
    moveCounts,
    recordCount: Object.values(moveCounts).reduce((total, value) => total + value, 0),
  };
}

function projectAdultOptionResponse(adult: ProjectAdultOptionRow) {
  return {
    userId: adult.id,
    displayName: adult.display_name,
    email: adult.email,
    programId: adult.role_id === "program_teacher" ? adult.scope_id : "",
  };
}

async function buildProjectRequestImpactPreview(
  requestId: string,
  members: ProjectRequestMemberRow[],
  adults: ProjectAdultAssignmentRow[] = [],
) {
  const memberDetails = members.map(projectRequestMemberResponse);
  const pendingCount = memberDetails.filter((member) => member.invitationStatus === "pending").length;
  const declinedCount = memberDetails.filter((member) => member.invitationStatus === "declined").length;
  const recordCount = memberDetails.reduce((total, member) => total + member.recordCount, 0);
  const adultSetup = projectAdultSetup(adults);
  const tokenInput = memberDetails
    .map((member) => ({
      studentId: member.studentId,
      invitationStatus: member.invitationStatus,
      currentProjectId: member.currentProjectId,
      currentMemberRole: member.currentMemberRole,
      moveCounts: member.moveCounts,
    }))
    .sort((left, right) => left.studentId.localeCompare(right.studentId));
  const adultTokenInput = adults
    .filter((adult) => adult.status === "accepted" || adult.status === "pending")
    .map((adult) => ({
      assignmentId: adult.id,
      role: adult.adult_role,
      assigneeUserId: adult.assignee_user_id || "",
      invitedEmail: adult.invited_email || "",
      status: adult.status,
      updatedAt: adult.updated_at,
    }))
    .sort((left, right) => `${left.role}:${left.assignmentId}`.localeCompare(`${right.role}:${right.assignmentId}`));
  const teammatesReady = memberDetails.length > 0 && pendingCount === 0 && declinedCount === 0;
  return {
    approvalReady: teammatesReady && adultSetup.ready,
    teammatesReady,
    adultSetup,
    studentCount: memberDetails.length,
    studentsMoving: memberDetails.filter((member) => Boolean(member.currentProjectId)).length,
    recordCount,
    pendingCount,
    declinedCount,
    approvalToken: await sha256Hex(JSON.stringify({ requestId, members: tokenInput, adults: adultTokenInput })),
    members: memberDetails,
  };
}

function projectRequestEventResponse(event: ProjectRequestEventRow) {
  let detail: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(event.detail_json || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) detail = parsed as Record<string, unknown>;
  } catch {
    detail = {};
  }
  return {
    action: event.action,
    actorUserId: event.actor_user_id || "",
    actorName: event.actor_name || "System",
    detail,
    createdAt: event.created_at,
  };
}

function projectRequestEventStatement(
  env: Env,
  requestId: string,
  actorUserId: string,
  action: string,
  detail: Record<string, unknown>,
): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT INTO project_request_events (id, request_id, actor_user_id, action, detail_json)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(randomId("project-request-event"), requestId, actorUserId, action, JSON.stringify(detail));
}

function projectTemplateResponse(template: ProjectTemplateRow) {
  return {
    templateId: template.id,
    siteId: template.site_id,
    programId: template.program_id || "",
    phase: template.phase,
    title: template.title,
    description: template.description || "",
    templateUrl: template.template_url,
    linkCheckStatus: template.link_check_status || "not_checked",
    linkCheckedAt: template.link_checked_at || "",
    active: Number(template.active) === 1,
    updatedAt: template.updated_at,
  };
}

function groupRows<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const value = key(row);
    grouped.set(value, [...(grouped.get(value) || []), row]);
  }
  return grouped;
}

function cleanId(value: unknown): string {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(normalized) ? normalized : "";
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanNoteBody(value: unknown): string {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/[ \t]+/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1200);
}

function cleanApprovalToken(value: unknown): string {
  const token = String(value || "").trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(token) ? token : "";
}

function parseProjectDirectoryQuery(url: URL): ProjectDirectoryQuery {
  const search = cleanText(url.searchParams.get("search"), MAX_PROJECT_SEARCH_LENGTH);
  const requestedFilter = String(url.searchParams.get("filter") || "all").trim().toLowerCase();
  const filter: ProjectDirectoryFilter = ["all", "review", "changes", "working", "team", "individual"].includes(requestedFilter)
    ? requestedFilter as ProjectDirectoryFilter
    : "all";
  const requestedPage = Number.parseInt(String(url.searchParams.get("page") || "1"), 10);
  const requestedPageSize = Number.parseInt(String(url.searchParams.get("limit") || DEFAULT_PROJECT_PAGE_SIZE), 10);
  return {
    search,
    filter,
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: Number.isFinite(requestedPageSize)
      ? Math.min(MAX_PROJECT_PAGE_SIZE, Math.max(10, requestedPageSize))
      : DEFAULT_PROJECT_PAGE_SIZE,
  };
}

function cleanGoogleDriveFolderUrl(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 2048) return "";
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:"
      || url.hostname.toLowerCase() !== "drive.google.com"
      || url.username
      || url.password
      || !/^\/drive\/(?:u\/\d+\/)?folders\/[A-Za-z0-9_-]+\/?$/i.test(url.pathname)
    ) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanGoogleWorkUrl(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 2048) return "";
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:"
      || !["drive.google.com", "docs.google.com"].includes(hostname)
      || url.username
      || url.password
    ) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanTemplatePhase(value: unknown): string {
  const phase = String(value || "start").trim().toLowerCase();
  return ["start", "phase-1", "phase-2a", "phase-2b", "phase-3a", "phase-3b", "phase-4", "finish"].includes(phase)
    ? phase
    : "";
}

function uniqueIds(values: unknown): string[] {
  return [...new Set((Array.isArray(values) ? values : []).map(cleanId).filter(Boolean))];
}

async function safeAudit(
  env: Env,
  request: Request,
  user: UserAccount,
  action: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
) {
  try {
    await writeAudit(env, {
      actorUserId: user.id,
      action,
      entityType: "project",
      entityId,
      request,
      metadata,
    });
  } catch {
    // Project reads and assignments should not fail only because audit storage is unavailable.
  }
}
