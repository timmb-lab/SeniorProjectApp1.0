const workspaceMain = document.querySelector("#workspaceMain");

let currentUser = null;
let currentData = {
  authConfig: null,
  dashboard: null,
  siteDashboard: null,
  sitePrograms: null,
  siteStudents: null,
  siteStudentDetail: null,
  siteStudentTimeline: null,
  adminDashboard: null,
  programTeacherDashboard: null,
  mentorDashboard: null,
  projects: null,
  projectAdults: null,
  reviewQueue: null,
  mentorAssignments: null,
  accessAssignments: null,
  operationsReadiness: null,
  mentorAssigned: null,
  presentationSlots: null,
  readiness: null,
  archiveReadiness: null,
  auditEvents: null,
};
let activeSection = "overview";
let activeWorkspaceMode = "workspace";
let blockedWorkspaceMode = "";
let blockedWorkspaceSection = "";
const workspaceModeLastSections = {
  workspace: "overview",
  admin: "overview",
};
let busy = false;
let lastAdminImportResult = null;
let lastAdminPasswordResetResult = null;
let adminPeopleView = "manage-students";
let adminCsvImportState = defaultAdminCsvImportState();
let workspaceNavCollapsed = shouldCollapseWorkspaceNavByDefault();
let selectedSiteId = "";
let siteStudentFilters = defaultSiteStudentFilters();
let siteStudentDetailState = defaultSiteStudentDetailState();
let viewAsStudentState = defaultViewAsStudentState();
let pendingSiteStudentDetailFocus = false;
let pendingStudentRequirementFocusId = "";
let pendingStudentSectionFocus = "";
let studentRequirementDetailState = defaultStudentRequirementDetailState();
let studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
let studentFeedbackFilter = defaultStudentFeedbackFilter();
let studentSubmissionFilter = defaultStudentSubmissionFilter();
let studentDisclosureState = defaultStudentDisclosureState();
let usersAccessDisclosureState = defaultUsersAccessDisclosureState();
let dashboardDisclosureState = defaultDashboardDisclosureState();
let mentorDashboardDetailStudentId = "";
let pendingStudentEvidenceSubmissionId = "";
let reviewQueueFilters = defaultReviewQueueFilters();
let reviewQueueState = defaultReviewQueueState();
let mentorAssignmentFilters = defaultMentorAssignmentFilters();
let operationsReadinessFilters = defaultOperationsReadinessFilters();
let mentorDashboardFilter = "all";
let mentorDashboardSort = "priority";
let presentationSlotFilter = "all";
let adminArchiveExportFilter = "all";
let adminAuditFilters = defaultAdminAuditFilters();
let managedProjectId = "";
let activeProjectId = "";
let projectDirectoryView = "table";
let projectDirectoryFilters = defaultProjectDirectoryFilters();
let workspaceConnectionState = defaultWorkspaceConnectionState();
let workspaceDataLoading = false;
let knownAccessibleSites = [];
const WORKSPACE_THEME_STORAGE_KEY = "senior-project-view";
const WORKSPACE_THEME_VALUES = new Set(["light", "dark"]);
const WORKSPACE_SCHOOL_THEME_VALUES = new Set(["default", "east-tech", "desert-valley", "canyon-ridge", "north-valley"]);
const WORKSPACE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const WORKSPACE_PROOF_LINK_MAX_LENGTH = 2048;
const WORKSPACE_UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
]);
const WORKSPACE_UPLOAD_ALLOWED_EXTENSIONS = new Set([".csv", ".docx", ".gif", ".jpeg", ".jpg", ".pdf", ".png", ".pptx", ".txt", ".webp", ".xlsx"]);
const WORKSPACE_UPLOAD_GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"]);
const WORKSPACE_UPLOAD_ALLOWED_MIME_TYPES_BY_EXTENSION = new Map([
  [".csv", new Set(["text/csv"])],
  [".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])],
  [".gif", new Set(["image/gif"])],
  [".jpeg", new Set(["image/jpeg"])],
  [".jpg", new Set(["image/jpeg"])],
  [".pdf", new Set(["application/pdf"])],
  [".png", new Set(["image/png"])],
  [".pptx", new Set(["application/vnd.openxmlformats-officedocument.presentationml.presentation"])],
  [".txt", new Set(["text/plain"])],
  [".webp", new Set(["image/webp"])],
  [".xlsx", new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])],
]);
const WORKSPACE_POSTURE_CHIPS = [
  "Student progress",
  "Private files",
  "Mentor coverage",
  "Review work",
  "Presentation readiness",
];
const STATUS_CLASS_BY_STATUS = {
  draft: "draft",
  not_started: "draft",
  submitted: "submitted",
  under_review: "under_review",
  reviewing: "under_review",
  revision_requested: "revision_requested",
  revision_needed: "revision_requested",
  approved: "approved",
  ready: "ready",
  configured: "configured",
  complete: "complete",
  completed: "complete",
  blocked: "blocked",
  rejected: "rejected",
  failed: "failed",
  provider_unavailable: "failed",
  drive_credentials_missing: "failed",
  setup_needed: "failed",
  expired: "expired",
  expiring_soon: "expired",
  overridden: "overridden",
  override: "overridden",
  archived: "archived",
  pending: "pending",
  pending_review: "pending",
  pending_reset: "pending",
  scheduled: "pending",
  outline_pending: "pending",
  outline_revision_needed: "revision_requested",
  missing: "blocked",
  checked_out: "under_review",
  checked_in: "complete",
  available: "ready",
  attention_required: "blocked",
  needs_staff_action: "blocked",
  in_progress: "under_review",
  needs_review: "pending",
  needs_revision: "revision_requested",
  on_track: "ready",
  behind: "blocked",
  missing_evidence: "blocked",
  missing_mentor: "blocked",
  ready_complete: "complete",
  reviewed: "configured",
  not_reviewed: "pending",
  active: "approved",
  no_active_assignments: "blocked",
  not_requested: "pending",
  policy_review_required: "pending",
  scoped: "configured",
  student_visible: "configured",
  student_and_staff: "configured",
  staff_only: "configured",
  comment_only: "configured",
};
const STATUS_LABELS = {
  draft: "Draft",
  not_started: "Not started",
  submitted: "Submitted",
  under_review: "Under review",
  reviewing: "Under review",
  revision_requested: "Revision requested",
  revision_needed: "Revision needed",
  approved: "Approved",
  blocked: "Blocked",
  rejected: "Rejected",
  overridden: "Overridden",
  override: "Overridden",
  archived: "Archived",
  pending: "Pending",
  pending_review: "Pending",
  pending_reset: "Pending reset",
  scheduled: "Scheduled",
  outline_pending: "Outline pending",
  outline_revision_needed: "Outline revision",
  checked_out: "Checked out",
  checked_in: "Checked in",
  available: "Ready",
  missing: "Missing",
  ready: "Ready",
  configured: "Configured",
  failed: "Failed",
  provider_unavailable: "Storage unavailable",
  drive_credentials_missing: "Storage unavailable",
  setup_needed: "Setup needed",
  complete: "Complete",
  completed: "Complete",
  expired: "Expired",
  expiring_soon: "Expiring soon",
  attention_required: "Blocked",
  needs_staff_action: "Needs staff action",
  in_progress: "In progress",
  needs_review: "Pending",
  needs_revision: "Needs revision",
  on_track: "On track",
  behind: "Behind",
  missing_evidence: "Missing file",
  missing_mentor: "Missing mentor",
  ready_complete: "Ready / complete",
  reviewed: "Reviewed",
  not_reviewed: "Not reviewed",
  active: "Approved",
  no_active_assignments: "Blocked",
  not_requested: "Pending",
  policy_review_required: "Pending",
  not_recorded: "Not recorded",
  missed: "Missed",
  makeup_required: "Make-up required",
  not_scheduled: "Not scheduled",
  scoped: "Visible in this detail",
  student_visible: "Student-visible",
  student_and_staff: "Student-visible",
  staff_only: "Staff-only",
  comment_only: "Comment only",
};
const STUDENT_STATUS_LABELS = {
  draft: "Draft",
  not_started: "Not started",
  submitted: "Turned in",
  under_review: "Waiting for review",
  reviewing: "Waiting for review",
  pending_review: "Waiting for review",
  pending: "Not confirmed yet",
  needs_review: "Waiting for review",
  revision_requested: "Needs changes",
  revision_needed: "Needs changes",
  needs_revision: "Needs changes",
  outline_revision_needed: "Outline needs changes",
  approved: "Approved",
  active: "Approved",
  complete: "Done",
  completed: "Done",
  ready_complete: "Ready / done",
  missing_evidence: "Missing file",
  missing: "Missing",
  blocked: "Ask for help",
  failed: "Needs help",
  provider_unavailable: "Staff setup needed",
  setup_needed: "Staff setup needed",
  needs_staff_action: "Staff help needed",
  not_requested: "Not ready yet",
  policy_review_required: "Not ready yet",
};
const STUDENT_BOOKLET_PHASE_ORDER = [
  "start",
  "phase-1",
  "phase-2a",
  "phase-2b",
  "phase-3a",
  "phase-3b",
  "phase-4",
  "finish",
];
const STUDENT_BOOKLET_PHASES = {
  start: {
    label: "Start: Setup",
    deliverable: "Project folder is ready and your Program Teacher can find it.",
    checklist: [
      "Senior Project folder exists",
      "You can sign in here",
      "Program Teacher knows where your work lives",
    ],
    guidance: "Fix setup before starting proposal work.",
    done: "You can open Phase 1 work.",
  },
  "phase-1": {
    label: "Phase 1: Kickoff and Proposal",
    deliverable: "An approved project proposal.",
    checklist: [
      "What you will make",
      "Who it helps and why it matters",
      "How you will prove it worked",
    ],
    guidance: "Do not build yet. Get this approved first.",
    done: "Program Teacher approves the proposal.",
  },
  "phase-2a": {
    label: "Phase 2A: Build",
    deliverable: "First build Google Drive link and Mentor Meeting 1 plan.",
    checklist: [
      "First build or research file",
      "Mentor Meeting 1 plan or notes",
      "Google Drive link saved on the matching item",
    ],
    guidance: "Save files or links while you work, not at the end.",
    done: "Phase 2A work is approved or ready for the next build step.",
  },
  "phase-2b": {
    label: "Phase 2B: Build Part II",
    deliverable: "Updated build Google Drive link, mentor feedback, presentation outline, and presentation time.",
    checklist: [
      "Updated build Google Drive link",
      "Mentor feedback you used",
      "Presentation outline and time choice",
    ],
    guidance: "Use mentor feedback before presentation prep.",
    done: "Outline and phase work are approved for presentation.",
  },
  "phase-3a": {
    label: "Phase 3A: Present",
    deliverable: "Completed presentation with your project Google Drive link ready to show.",
    checklist: [
      "Practice from your approved outline",
      "Show what you made or learned",
      "Complete check-out or check-in if your school uses it",
    ],
    guidance: "Presentation does not replace a missing checklist Google Drive link.",
    done: "Presentation status is complete or checked in.",
  },
  "phase-3b": {
    label: "Phase 3B: Celebrate",
    deliverable: "Celebration Day photo, display or share plan, and food info if needed.",
    checklist: [
      "Celebration photo",
      "Display or share setup",
      "Ingredients if food is shared",
    ],
    guidance: "Follow school rules for what you show or share.",
    done: "Celebration item is marked complete.",
  },
  "phase-4": {
    label: "Phase 4: Give Thanks, Reflect, Launch",
    deliverable: "Thank-you notes, reflection answers, best-work choices, and launch plan.",
    checklist: [
      "Thank-you notes",
      "Reflection answers",
      "Best work saved",
    ],
    guidance: "Write what changed because of the project.",
    done: "Reflection and saved-work items are approved.",
  },
  finish: {
    label: "Finish: Download and Keep",
    deliverable: "Final files downloaded and saved somewhere you can keep.",
    checklist: [
      "Download is ready",
      "Important files are saved",
      "Ask staff if downloads are blocked",
    ],
    guidance: "Do this before May 5.",
    done: "Download is saved outside your school account.",
  },
};
const STUDENT_BOOKLET_PHASE_ALIASES = {
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
const WORKSPACE_SECTION_IDS = new Set([
  "overview",
  "profile",
  "siteDashboard",
  "programs",
  "projects",
  "students",
  "student",
  "studentWork",
  "studentFeedback",
  "studentFinalChecklist",
  "archive",
  "mentorDashboard",
  "mentor",
  "programDashboard",
  "teacher",
  "mentorAssignments",
  "operations",
  "presentation",
  "staffReports",
  "adminDashboard",
  "readiness",
  "adminUsers",
  "adminPeople",
  "adminStudents",
  "adminAssignments",
  "adminImports",
  "adminReports",
  "audit",
  "archiveExports",
  "security",
]);
const WORKSPACE_MODES = new Set(["workspace", "admin"]);
const STUDENT_NAV_SECTION_IDS = new Set(["student", "studentWork", "studentFeedback", "studentFinalChecklist"]);
const STUDENT_PRIMARY_SECTION_IDS = new Set([...STUDENT_NAV_SECTION_IDS, "presentation", "archive"]);
const STAFF_WORKLIST_FIRST_SECTION_IDS = new Set([
  "students",
  "teacher",
  "staffReports",
  "mentorAssignments",
  "operations",
  "presentation",
  "archive",
]);
const ADMIN_ARCHIVE_EXPORT_FILTER_VALUES = new Set(["all", "failed", "in_progress", "complete"]);
const ADMIN_AUDIT_SAVED_FILTERS = [
  {
    id: "denied-access",
    label: "Denied access",
    detail: "Recent access denials.",
    action: "evidence_download_denied",
    entityType: "evidence_artifact",
  },
  {
    id: "upload-failures",
    label: "Upload failures",
    detail: "Drive upload failures that can block student files.",
    action: "google_drive_upload_failed",
    entityType: "evidence_repository",
  },
  {
    id: "blocked-file-uploads",
    label: "Blocked files",
    detail: "Executable-signature uploads blocked before storage.",
    action: "evidence_upload_blocked_signature",
    entityType: "submission",
  },
  {
    id: "blocked-proof-links",
    label: "Blocked unsafe links",
    detail: "Credential-looking links blocked before save.",
    action: "evidence_link_blocked_unsafe_url",
    entityType: "submission",
  },
  {
    id: "review-decisions",
    label: "Review decisions",
    detail: "Program Teacher approval, revision, and comment decisions.",
    action: "",
    entityType: "review",
  },
  {
    id: "account-changes",
    label: "Account changes",
    detail: "User creation, role changes, and reset-required account work.",
    action: "",
    entityType: "user_account",
  },
  {
    id: "export-failures",
    label: "Export failures",
    detail: "Final-file package generation or provider failures.",
    action: "student_archive_export_drive_upload_failed",
    entityType: "export",
  },
  {
    id: "provider-setup",
    label: "Storage setup",
    detail: "Provider unavailable events that need admin follow-up.",
    action: "student_archive_export_provider_unavailable",
    entityType: "export",
  },
];
const REVIEW_QUEUE_STATUS_VALUES = new Set(["submitted", "revision_requested", "approved"]);
const REVIEW_QUEUE_STORY_VALUES = new Set(["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"]);
const REVIEW_QUEUE_RISK_VALUES = new Set(["any", "high", "medium", "low", "stale", "no_mentor"]);
const REVIEW_QUEUE_EVIDENCE_STATUS_VALUES = new Set(["attached", "missing"]);
const STUDENT_DETAIL_TIMELINE_TYPES = [
  ["", "All activity"],
  ["review", "Reviews"],
  ["evidence", "Evidence"],
  ["mentor_meeting", "Mentor meetings"],
  ["presentation", "Presentation"],
  ["archive_export", "Archive"],
  ["submission", "Submissions"],
  ["comment", "Notes"],
  ["status_history", "Status changes"],
];
const STUDENT_DETAIL_TIMELINE_TYPE_VALUES = new Set(STUDENT_DETAIL_TIMELINE_TYPES.map(([value]) => value).filter(Boolean));
const SITE_STUDENT_STATUS_VALUES = new Set(["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"]);
const SITE_STUDENT_RISK_VALUES = new Set(["any", "high", "medium", "low", "stale", "no_mentor"]);
const SITE_STUDENT_PROGRESS_STATUS_VALUES = new Set(["on_track", "behind", "missing_mentor", "missing_evidence", "needs_review", "needs_revision", "mentor_meeting_follow_up", "ready_complete"]);
const SITE_STUDENT_EVIDENCE_STATUS_VALUES = new Set(["attached", "missing"]);
const SITE_STUDENT_REVIEW_STATUS_VALUES = new Set(["needs_review", "needs_revision", "approved", "reviewed", "not_reviewed"]);
const SITE_STUDENT_PRESENTATION_STATUS_VALUES = new Set(["any", "pending", "scheduled", "completed", "missing"]);
const SITE_STUDENT_ARCHIVE_STATUS_VALUES = new Set(["any", "ready", "complete", "failed", "missing"]);
const MENTOR_ASSIGNMENT_STATUS_VALUES = new Set(["active", "unassigned", "all"]);
const OPERATIONS_STUDENT_STATUS_VALUES = new Set(["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"]);
const OPERATIONS_RISK_VALUES = new Set(["any", "high", "medium", "low", "stale", "no_mentor"]);
const OPERATIONS_PRESENTATION_STATUS_VALUES = new Set(["ready", "pending", "scheduled", "completed", "missing", "outline_pending", "outline_revision_needed", "attention_required"]);
const OPERATIONS_ARCHIVE_STATUS_VALUES = new Set(["ready", "complete", "failed", "missing", "queued", "running", "in_progress", "expired", "expiring_soon", "provider_unavailable"]);
const OPERATIONS_READINESS_VALUES = new Set(["ready", "in_progress", "attention_required", "blocked", "missing", "complete"]);
const OPERATIONS_CATEGORY_VALUES = new Set(["archive", "risk", "mentor", "review", "presentation", "completion", "evidence", "readiness"]);
const REVIEW_QUEUE_URL_FILTER_PARAMS = [
  "status",
  "reviewStatus",
  "submissionStatus",
  "programId",
  "search",
  "story",
  "risk",
  "limit",
  "offset",
  "needsReview",
  "unassigned",
  "overdue",
  "missing",
  "evidenceStatus",
  "submissionId",
  "mentorUserId",
  "studentUserId",
  "studentId",
];
const SITE_STUDENT_URL_FILTER_PARAMS = [
  "search",
  "programId",
  "status",
  "progressStatus",
  "evidenceStatus",
  "reviewStatus",
  "noMentor",
  "risk",
  "story",
  "presentationStatus",
  "archiveStatus",
  "limit",
  "offset",
];
const MENTOR_ASSIGNMENT_URL_FILTER_PARAMS = [
  "programId",
  "mentorUserId",
  "studentSearch",
  "status",
  "noMentor",
  "limit",
  "offset",
];
const OPERATIONS_URL_FILTER_PARAMS = [
  "studentId",
  "programId",
  "status",
  "story",
  "risk",
  "presentationStatus",
  "archiveStatus",
  "readiness",
  "category",
  "needsAttention",
  "outlineAttention",
  "limit",
  "offset",
];
const MENTOR_DASHBOARD_URL_FILTER_PARAMS = ["mentorFocus", "mentorSort"];
const PRESENTATION_SCHEDULE_URL_FILTER_PARAMS = ["presentationFocus"];
const ADMIN_AUDIT_URL_FILTER_PARAMS = ["action", "entityType"];
const ADMIN_ARCHIVE_EXPORT_URL_FILTER_PARAMS = ["adminExportFilter"];
const ADMIN_PEOPLE_VIEW_VALUES = new Set(["manage-students", "add-student", "manage-staff", "add-staff", "import-students", "import-staff", "assignments"]);
const ADMIN_PEOPLE_URL_PARAMS = ["peopleView"];
const SITE_STUDENT_DETAIL_URL_SECTIONS = new Set([
  "overview",
  "adminDashboard",
  "siteDashboard",
  "projects",
  "students",
  "teacher",
  "mentorAssignments",
  "mentorDashboard",
  "programDashboard",
  "operations",
]);
const SITE_STUDENT_DETAIL_URL_PARAMS = ["detailStudentId", "detailTab", "detailTimelineType"];
const VIEW_AS_STUDENT_URL_PARAMS = ["viewAsStudentId", "viewAsReturnSection", "viewAsReturnMode"];
const WORKSPACE_HISTORY_ROUTE_KEY = "seniorProjectWorkspaceRoute";
const WORKSPACE_URL_FILTER_PARAMS = Array.from(new Set([
  ...REVIEW_QUEUE_URL_FILTER_PARAMS,
  ...SITE_STUDENT_URL_FILTER_PARAMS,
  ...MENTOR_ASSIGNMENT_URL_FILTER_PARAMS,
  ...OPERATIONS_URL_FILTER_PARAMS,
  ...MENTOR_DASHBOARD_URL_FILTER_PARAMS,
  ...PRESENTATION_SCHEDULE_URL_FILTER_PARAMS,
  ...ADMIN_AUDIT_URL_FILTER_PARAMS,
  ...ADMIN_ARCHIVE_EXPORT_URL_FILTER_PARAMS,
  ...ADMIN_PEOPLE_URL_PARAMS,
  ...SITE_STUDENT_DETAIL_URL_PARAMS,
  ...VIEW_AS_STUDENT_URL_PARAMS,
]));
let uploadState = {
  state: "idle",
  progress: 0,
  message: "Choose a file to upload.",
  fileName: "",
  fileSize: 0,
  retryReady: false,
};
let lastUploadAttempt = null;
let studentProofReceiptState = defaultStudentProofReceiptState();

async function init() {
  initializeWorkspaceUrlState();
  bindWorkspaceUrlEvents();
  await loadSession();
}

async function loadSession() {
  renderLoading("Checking your session...");
  const authConfig = await loadAuthConfig();
  try {
    const response = await fetch("/api/auth/me", { headers: { accept: "application/json" } });
    const data = await safeJson(response);
    if (!response.ok || !data?.authenticated) {
      if (currentUser && response.status >= 500) {
        workspaceConnectionState = {
          ...workspaceConnectionState,
          stale: true,
          failedKeys: ["session"],
          retrying: false,
        };
        renderAppShell();
        return;
      }
      currentUser = null;
      currentData = defaultCurrentData(authConfig);
      studentRequirementDetailState = defaultStudentRequirementDetailState();
      studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
      studentFeedbackFilter = defaultStudentFeedbackFilter();
      studentSubmissionFilter = defaultStudentSubmissionFilter();
      studentProofReceiptState = defaultStudentProofReceiptState();
      mentorDashboardFilter = "all";
      mentorDashboardSort = "priority";
      presentationSlotFilter = "all";
      adminArchiveExportFilter = "all";
      adminAuditFilters = defaultAdminAuditFilters();
      viewAsStudentState = defaultViewAsStudentState();
      renderSignIn(
        messageForSessionStateError(data?.error, response.status),
        data?.error ? "error" : "neutral",
        workspaceStateForAuthError(data?.error),
      );
      return;
    }
    const userChanged = currentUser?.id !== data.user?.id;
    if (userChanged) {
      resetAccountScopedWorkspaceState();
      workspaceConnectionState = defaultWorkspaceConnectionState();
      studentRequirementDetailState = defaultStudentRequirementDetailState();
      studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
      studentFeedbackFilter = defaultStudentFeedbackFilter();
      studentSubmissionFilter = defaultStudentSubmissionFilter();
      studentProofReceiptState = defaultStudentProofReceiptState();
      mentorDashboardFilter = "all";
      mentorDashboardSort = "priority";
      presentationSlotFilter = "all";
      adminArchiveExportFilter = "all";
      adminAuditFilters = defaultAdminAuditFilters();
      viewAsStudentState = defaultViewAsStudentState();
    }
    currentUser = data.user;
    if (userChanged && !workspaceLocationHasRoute()) {
      resetWorkspaceLandingState();
    }
    applyWorkspaceUrlState(workspaceUrlStateFromLocation(), { initial: true });
    await ensureWorkspaceModulesForSession(currentUser, activeSection);
    await loadWorkspaceData();
  } catch (error) {
    if (currentUser) {
      workspaceConnectionState = {
        ...workspaceConnectionState,
        stale: true,
        failedKeys: ["session"],
        retrying: false,
      };
      renderAppShell();
      return;
    }
    currentUser = null;
    currentData = defaultCurrentData(authConfig);
    studentRequirementDetailState = defaultStudentRequirementDetailState();
    studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
    studentFeedbackFilter = defaultStudentFeedbackFilter();
    studentSubmissionFilter = defaultStudentSubmissionFilter();
    studentProofReceiptState = defaultStudentProofReceiptState();
    mentorDashboardFilter = "all";
    mentorDashboardSort = "priority";
    presentationSlotFilter = "all";
    adminArchiveExportFilter = "all";
    adminAuditFilters = defaultAdminAuditFilters();
    viewAsStudentState = defaultViewAsStudentState();
    renderSignIn(messageForNetworkError(error), "error");
  }
}

async function loadAuthConfig() {
  const result = await settleApi(apiJson("/api/auth/config"));
  currentData.authConfig = result;
  return result;
}

function defaultCurrentData(authConfig = currentData.authConfig) {
  return {
    authConfig,
    dashboard: null,
    siteDashboard: null,
    sitePrograms: null,
    siteStudents: null,
    siteStudentDetail: null,
    siteStudentTimeline: null,
    adminDashboard: null,
    programTeacherDashboard: null,
    mentorDashboard: null,
    projects: null,
    projectAdults: null,
    reviewQueue: null,
    mentorAssignments: null,
    accessAssignments: null,
    roleAssignments: null,
    operationsReadiness: null,
    mentorAssigned: null,
    presentationSlots: null,
    readiness: null,
    archiveReadiness: null,
    auditEvents: null,
  };
}

function defaultWorkspaceConnectionState() {
  return {
    stale: false,
    failedKeys: [],
    failures: [],
    usingLastKnownKeys: [],
    lastFullSuccessAt: "",
    retrying: false,
  };
}

async function loadWorkspaceData(statusMessage = "", options = {}) {
  if (!currentUser) {
    renderSignIn();
    return;
  }

  workspaceDataLoading = true;
  workspaceConnectionState.retrying = Boolean(options.retryAttempt) || workspaceConnectionState.stale;
  renderAppShell(statusMessage || (workspaceConnectionState.retrying ? "Trying the server again..." : "Loading your workspace..."));
  const roles = roleIds(currentUser);
  const authConfig = currentData.authConfig || await loadAuthConfig();
  const lastKnownData = currentData;
  const loaders = [];

  if (roles.has("student")) loaders.push(["dashboard", apiJson("/api/student/dashboard")]);
  if (roles.has("student") || roles.has("mentor") || roles.has("viewer") || roles.has("program_teacher") || roles.has("administration") || roles.has("site_admin") || hasGlobalAdminRole(roles)) {
    loaders.push(["projects", apiJson(`/api/projects${projectDirectoryQueryString()}`)]);
  }
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || roles.has("administration") || roles.has("site_admin") || hasGlobalAdminRole(roles)) {
    loaders.push(["projectAdults", apiJson("/api/project-adults")]);
  }
  if (roles.has("student")) loaders.push(["archiveReadiness", apiJson("/api/student/archive/readiness")]);
  if (hasSiteDashboardRole(roles)) loaders.push(["siteDashboard", apiJson(`/api/site/dashboard${siteDashboardQueryString()}`)]);
  if (canUseSitePrograms(roles)) loaders.push(["sitePrograms", apiJson(`/api/site/programs${siteDashboardQueryString()}`)]);
  if (hasSiteStudentDirectoryRole(roles)) loaders.push(["siteStudents", apiJson(`/api/site/students${siteStudentQueryString()}`)]);
  if (hasSiteReviewQueueRole(roles)) loaders.push(["reviewQueue", apiJson(`/api/site/review-queue${siteReviewQueueQueryString()}`)]);
  if (hasSiteMentorAssignmentRole(roles)) loaders.push(["mentorAssignments", apiJson(`/api/site/mentor-assignments${siteMentorAssignmentQueryString()}`)]);
  if (canUseUsersAccess(roles)) loaders.push(["accessAssignments", apiJson(`/api/site/access-assignments${siteDashboardQueryString()}`)]);
  if (hasGlobalAdminRole(roles)) loaders.push(["roleAssignments", apiJson("/api/admin/role-assignments?limit=12")]);
  if (hasSiteOperationsRole(roles)) loaders.push(["operationsReadiness", apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`)]);
  if (hasGlobalAdminRole(roles)) loaders.push(["adminDashboard", apiJson("/api/admin/dashboard")]);
  if (hasGlobalAdminRole(roles)) loaders.push(["auditEvents", apiJson(`/api/admin/audit-events${adminAuditQueryString()}`)]);
  if (roles.has("program_teacher")) loaders.push(["programTeacherDashboard", apiJson(`/api/program-teacher/dashboard${siteDashboardQueryString()}`)]);
  if (roles.has("mentor") || hasGlobalAdminRole(roles)) loaders.push(["mentorDashboard", apiJson("/api/mentor/dashboard")]);
  if (roles.has("mentor")) loaders.push(["mentorAssigned", apiJson("/api/mentor/assigned")]);
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration")) {
    loaders.push(["presentationSlots", apiJson("/api/presentation-slots")]);
  }
  if (hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration") || roles.has("misc_admin")) loaders.push(["readiness", apiJson("/api/reports/readiness")]);

  const results = await Promise.all(loaders.map(async ([key, promise]) => [key, await settleApi(promise)]));
  const nextData = defaultCurrentData(authConfig);
  const failedKeys = [];
  const failures = [];
  const usingLastKnownKeys = [];
  for (const [key, result] of results) {
    if (result.ok) {
      nextData[key] = result;
      continue;
    }
    if (key === "projectAdults" && !lastKnownData?.[key]?.ok) {
      nextData[key] = result;
      continue;
    }
    failedKeys.push(key);
    failures.push({
      key,
      status: Number(result.status || 0),
      error: String(result.error || "request_failed"),
    });
    if (lastKnownData?.[key]?.ok) {
      nextData[key] = lastKnownData[key];
      usingLastKnownKeys.push(key);
    } else {
      nextData[key] = result;
    }
  }
  currentData = nextData;
  workspaceConnectionState = {
    stale: failedKeys.length > 0,
    failedKeys,
    failures,
    usingLastKnownKeys,
    lastFullSuccessAt: failedKeys.length ? workspaceConnectionState.lastFullSuccessAt : new Date().toISOString(),
    retrying: false,
  };

  if (failedKeys.length && !options.retryAttempt) {
    await loadWorkspaceData(statusMessage, { retryAttempt: 1 });
    return;
  }

  workspaceDataLoading = false;

  if (roles.has("student") && !studentRequirementDetailState.selectedRequirementId && !studentRequirementDetailState.selectedPhaseKey) {
    const currentPhase = studentRequirementPhaseKey(unwrap(currentData.dashboard)?.summary?.currentPhase || "");
    if (currentPhase) studentRequirementDetailState.selectedPhaseKey = currentPhase;
  }

  const firstAvailable = firstVisibleSection(availableSections())?.id || availableSections()[0]?.id || "overview";
  if (!availableSections().some((section) => section.id === activeSection)) {
    activeSection = firstAvailable;
  }
  const currentUrl = currentWorkspaceUrl();
  if (currentUrl && hasViewAsStudentUrlState(currentUrl.searchParams) && !canUseViewAsStudent(roles)) {
    viewAsStudentState = defaultViewAsStudentState();
    syncCurrentWorkspaceUrlState({ replace: true });
  }
  // Keep normal app navigation in browser history without exposing every
  // screen, filter, school, or selected record in the address bar.
  syncCurrentWorkspaceUrlState({ replace: true });
  if (activeSection === "teacher") {
    await restoreReviewQueueSelectionFromCurrentRows({ renderLoading: false });
  }
  if (shouldRestoreViewAsStudentFromUrlState(roles)) {
    await restoreViewAsStudentFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: statusMessage || "Student view restored.",
    });
    return;
  }
  if (shouldRestoreSiteStudentDetailFromUrlState(roles)) {
    await restoreSiteStudentDetailFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: statusMessage || "Student detail link restored.",
    });
    return;
  }
  renderAppShell(
    failedKeys.length ? statusMessage : statusMessage || readyMessageForCurrentExperience(),
    statusMessage ? "success" : failedKeys.length ? "neutral" : "success",
  );
}

function renderLoading(message) {
  workspaceMain.innerHTML = `
    <section class="workspace-loading">
      <span class="workspace-mark">SC</span>
      <p>${escapeHtml(message)}</p>
    </section>
  `;
}

function renderProductHeader(options = {}) {
  const {
    eyebrow = "School workspace",
    title = "Capstone Project Workspace",
    subtitle = "Review student progress, mentor coverage, submissions, presentations, and closeout work for your assigned school role.",
    chips = WORKSPACE_POSTURE_CHIPS,
    context = [],
    readOnly = false,
    titleId = "",
  } = options;
  const contextChips = [
    ...context.filter(Boolean),
    ...(readOnly ? ["Read-only viewer"] : []),
  ];
  return `
    <section class="workspace-product-header" aria-label="Product context">
      <div class="workspace-product-header-main">
        <div class="workspace-product-copy">
          ${eyebrow ? `<p class="workspace-product-eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
          <h1 class="workspace-product-title" ${titleId ? `id="${escapeHtml(titleId)}"` : ""}>${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="workspace-product-subtitle">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <div class="workspace-posture-chips" aria-label="Product posture">
          ${chips.map((chip) => `<span class="workspace-posture-chip">${escapeHtml(chip)}</span>`).join("")}
        </div>
      </div>
      ${contextChips.length ? `
        <div class="workspace-product-context" aria-label="Page context">
          ${contextChips.map((chip) => `<span class="workspace-posture-chip">${escapeHtml(chip)}</span>`).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function isStudentExperience(primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), viewingAsStudent = isViewAsStudentActive()) {
  return Boolean(viewingAsStudent || primaryRole === "student" || roles.has("student"));
}

function workspaceAreaName({ isAdminConsole = false, studentExperience = false } = {}) {
  if (isAdminConsole) return "Admin Console";
  if (studentExperience) return "My Capstone";
  return "Staff Workspace";
}

function workspaceShellProjectName({ studentExperience = false } = {}) {
  const projectBody = unwrap(currentData.projects) || {};
  const projects = Array.isArray(projectBody.projects) ? projectBody.projects : [];
  if (studentExperience) {
    return unwrap(currentData.dashboard)?.project?.name || projects[0]?.name || "My project";
  }
  const selected = projects.find((project) => project.projectId === activeProjectId);
  if (selected?.name) return selected.name;
  if (projects.length === 1 && projects[0]?.name) return projects[0].name;
  return "All projects";
}

function readyMessageForCurrentExperience() {
  const roles = roleIds(currentUser);
  if (isStudentExperience(primaryRoleForUser(currentUser), roles, isViewAsStudentActive())) return "My Capstone ready.";
  if (activeWorkspaceMode === "admin" && adminConsoleCapabilitiesFor(currentUser).canSee) return "Admin Console ready.";
  return "Staff Workspace ready.";
}

function shouldRenderWorkflowScreenGuidance(sectionId = activeSection, options = {}) {
  const section = cleanWorkspaceSection(sectionId) || "overview";
  if (options.isAdminConsole && section === "overview") return false;
  if (section === "overview") return false;
  if (options.studentExperience && STUDENT_NAV_SECTION_IDS.has(section)) return false;
  return true;
}

function renderWorkspaceSignInBrand() {
  return `
    <a class="workspace-brand workspace-auth-brand" href="/" aria-label="Capstone Project home">
      <span class="workspace-mark">SC</span>
      <span>Capstone Project</span>
    </a>
  `;
}

function problemStateDefaultActions() {
  if (!currentUser) return [];
  const allowed = availableSectionIdsForAnyMode();
  const actions = [{ label: "Refresh workspace", problemAction: "refresh" }];
  if (allowed.has("profile")) actions.push({ label: "Review profile", section: "profile" });
  if (allowed.has("security")) actions.push({ label: hasGlobalAdminRole(roleIds(currentUser)) ? "Open Security" : "Open Account", section: "security" });
  return actions.slice(0, 3);
}

function renderProblemStateAction(action, index) {
  const attrs = [
    'data-problem-state-action="true"',
    `data-problem-state-action-index="${index + 1}"`,
  ];
  if (action.problemAction) attrs.push(`data-problem-action="${escapeHtml(action.problemAction)}"`);
  if (action.section) attrs.push(`data-section="${escapeHtml(action.section)}"`);
  if (action.mode) attrs.push(`data-workspace-mode-target="${escapeHtml(action.mode)}"`);
  if (action.preset) attrs.push(`data-section-preset="${escapeHtml(action.preset)}"`);
  if (action.auditAction) attrs.push(`data-audit-action="${escapeHtml(action.auditAction)}"`);
  if (action.auditEntityType) attrs.push(`data-audit-entity-type="${escapeHtml(action.auditEntityType)}"`);
  return `
    <button class="workspace-button workspace-button-secondary workspace-problem-state-action" type="button" ${attrs.join(" ")}>
      ${escapeHtml(action.label || "Open")}
    </button>
  `;
}

function renderProblemStateActions(actions = problemStateDefaultActions()) {
  const usableActions = (Array.isArray(actions) ? actions : [])
    .filter((action) => action?.label && (action.problemAction || action.section || action.mode))
    .slice(0, 3);
  if (!usableActions.length) return "";
  return `
    <div class="workspace-problem-state-actions" data-problem-state-actions="true" aria-label="Recovery actions">
      <span>Try next</span>
      <div>
        ${usableActions.map((action, index) => renderProblemStateAction(action, index)).join("")}
      </div>
    </div>
  `;
}

function renderProblemState({ reason, owner, nextAction, actions } = {}) {
  return `
    <article class="workspace-problem-state">
      <div class="workspace-problem-state-grid">
        <div class="workspace-problem-state-item">
          <span class="workspace-problem-state-label">Reason</span>
          <span class="workspace-problem-state-value">${escapeHtml(reason || "The workspace needs an access or status update.")}</span>
        </div>
        <div class="workspace-problem-state-item">
          <span class="workspace-problem-state-label">Owner</span>
          <span class="workspace-problem-state-value">${escapeHtml(owner || "Project coordinator")}</span>
        </div>
        <div class="workspace-problem-state-item">
          <span class="workspace-problem-state-label">Next action</span>
          <span class="workspace-problem-state-value">${escapeHtml(nextAction || "Refresh after the assigned staff member updates the record.")}</span>
        </div>
      </div>
      ${renderProblemStateActions(actions)}
    </article>
  `;
}

function renderTeacherFirstMoreActions({ id = "more", label = "More", actions = [], className = "", dataAttrs = "", ariaLabel = "" } = {}) {
  const safeActions = (Array.isArray(actions) ? actions : [])
    .map((action) => String(action || "").trim())
    .filter(Boolean);
  if (!safeActions.length) return "";
  return `
    <details class="workspace-row-more-menu workspace-teacher-first-more-actions ${escapeHtml(className)}" data-teacher-first-component="MoreActionsMenu" data-more-actions-menu="${escapeHtml(id)}" ${dataAttrs} ${ariaLabel ? `aria-label="${escapeHtml(ariaLabel)}"` : ""}>
      <summary>${escapeHtml(label || "More")}</summary>
      <div class="workspace-row-more-menu-body">
        ${safeActions.join("")}
      </div>
    </details>
  `;
}

function renderTeacherFirstDisclosure({ id = "details", summary = "Show details", bodyHtml = "", className = "", dataAttrs = "" } = {}) {
  const body = String(bodyHtml || "").trim();
  if (!body) return "";
  return `
    <details class="workspace-teacher-first-disclosure ${escapeHtml(className)}" data-teacher-first-component="CollapsibleDetails" data-collapsible-details="${escapeHtml(id)}" ${dataAttrs}>
      <summary>${escapeHtml(summary || "Show details")}</summary>
      <div class="workspace-teacher-first-disclosure-body">
        ${body}
      </div>
    </details>
  `;
}

function renderSignIn(message = "", tone = "neutral", workspaceState = "signed-out", options = {}) {
  const authConfig = authConfigForUi();
  const urlAuthError = authErrorMessageFromLocation();
  const finalMessage = message || urlAuthError.message;
  const finalTone = message ? tone : urlAuthError.tone;
  const emailValue = escapeHtml(options.email || "");
  const showResetForm = Boolean(options.showResetForm || workspaceState === "reset-required");
  const mfaMode = options.mfaMode === "enroll" ? "enroll" : options.mfaMode === "login" ? "login" : "";
  const showMfaForm = Boolean(mfaMode && options.challengeToken);
  const recoveryCodes = Array.isArray(options.recoveryCodes) ? options.recoveryCodes.filter(Boolean) : [];
  const showSchoolSignIn = authConfig.googleSsoEnabled && authConfig.googleSsoConfigured;
  const showPasswordSignIn = authConfig.localLoginEnabled;
  workspaceMain.innerHTML = `
    <section class="workspace-auth" aria-labelledby="signInTitle" data-workspace-state="${escapeHtml(workspaceState)}">
      <header class="workspace-auth-header">
        ${renderWorkspaceSignInBrand()}
        ${renderWorkspaceThemeButton("sign-in")}
      </header>
      <div class="workspace-auth-panel">
        <div class="workspace-auth-card">
        <div class="workspace-auth-panel-heading">
          <p class="workspace-auth-eyebrow">Senior Project workspace</p>
          <h1 id="signInTitle">Welcome back</h1>
          <p>Sign in to see what to do next.</p>
        </div>
        ${finalMessage ? statusHtml(finalMessage, finalTone) : ""}
        ${renderSessionRecoveryGuide(workspaceState)}
        ${!showMfaForm && !recoveryCodes.length && showSchoolSignIn ? `
        <a class="workspace-button workspace-button-secondary workspace-school-sign-in" href="/api/auth/google/start?returnTo=/">Use school sign-in</a>
        ` : ""}
        ${!showMfaForm && !recoveryCodes.length && showSchoolSignIn && showPasswordSignIn ? `<div class="workspace-auth-divider" role="separator"><span>or use your email</span></div>` : ""}
        ${showMfaForm ? `
        <section class="workspace-reset-panel workspace-mfa-panel" data-auth-action="mfa-${escapeHtml(mfaMode)}">
          <div>
            <p class="workspace-kicker">Extra sign-in check</p>
            <h3>${mfaMode === "enroll" ? "Secure your account" : "Enter your 6-digit code"}</h3>
            <p>${mfaMode === "enroll" ? "Staff accounts need one more sign-in step." : "Open your authenticator app and use the code for Senior Project."}</p>
          </div>
          ${mfaMode === "enroll" ? `
            <ol class="workspace-auth-steps">
              <li>Open an authenticator app.</li>
              <li>Choose Enter a key.</li>
              <li>Enter this key: <code class="workspace-mfa-secret">${escapeHtml(options.mfaSecret || "")}</code></li>
              <li>Type the 6-digit code below.</li>
            </ol>
          ` : ""}
          <form id="workspaceMfaForm" class="workspace-form">
            <input name="challengeToken" type="hidden" value="${escapeHtml(options.challengeToken || "")}">
            <input name="mfaMode" type="hidden" value="${escapeHtml(mfaMode)}">
            <input name="mfaSecret" type="hidden" value="${escapeHtml(options.mfaSecret || "")}">
            <label class="workspace-label">
              ${mfaMode === "enroll" ? "6-digit code" : "6-digit code or recovery code"}
              <input class="workspace-input" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="11" required autofocus>
            </label>
            <button class="workspace-button workspace-button-primary" type="submit">${mfaMode === "enroll" ? "Finish setup" : "Finish sign in"}</button>
            <button class="workspace-link-button" type="button" data-auth-mfa-cancel="true">Back to sign in</button>
          </form>
        </section>
        ` : recoveryCodes.length ? `
        <section class="workspace-reset-panel workspace-mfa-panel" data-auth-action="mfa-recovery-codes">
          <div>
            <p class="workspace-kicker">Save once</p>
            <h3>Save your recovery codes</h3>
            <p>Keep these in a safe place. Each code works one time if you lose your phone.</p>
          </div>
          <textarea id="workspaceMfaRecoveryCodes" class="workspace-textarea" rows="8" readonly>${escapeHtml(recoveryCodes.join("\n"))}</textarea>
          <div class="workspace-row-actions">
            <button class="workspace-button workspace-button-secondary" type="button" data-copy-mfa-codes="true">Copy codes</button>
            <button class="workspace-button workspace-button-primary" id="workspaceMfaContinue" type="button">Continue to workspace</button>
          </div>
        </section>
        ` : showPasswordSignIn ? `
        <form id="workspaceLoginForm" class="workspace-form">
          <label class="workspace-label">
            Email
            <input class="workspace-input" id="workspaceEmail" name="email" type="email" autocomplete="username" value="${emailValue}" required>
          </label>
          <label class="workspace-label">
            Password
            <input class="workspace-input" id="workspacePassword" name="password" type="password" autocomplete="current-password" required>
          </label>
          <button class="workspace-button workspace-button-primary" type="submit">Sign in</button>
        </form>
        ` : showSchoolSignIn ? "" : `<div class="workspace-empty">Sign-in is not available right now. Ask your project coordinator for help.</div>`}
        ${showPasswordSignIn && !showMfaForm && !recoveryCodes.length ? `
        <details class="workspace-auth-setup" data-auth-setup-code="true" ${showResetForm ? "open" : ""}>
          <summary>${showResetForm ? "Create a new password" : "I have a setup code"}</summary>
        <div class="workspace-reset-panel" data-auth-action="complete-reset">
          <div>
            <p class="workspace-kicker">First sign-in</p>
            <h3>Create a new password</h3>
            <p>Use the setup code from your school. Then pick a password only you know.</p>
          </div>
          <form id="workspacePasswordResetForm" class="workspace-form">
            <label class="workspace-label">
              Email
              <input class="workspace-input" id="workspaceResetEmail" name="email" type="email" autocomplete="username" value="${emailValue}" required>
            </label>
            <label class="workspace-label">
              Current password or setup code
              <input class="workspace-input" name="currentPassword" type="password" autocomplete="current-password" required>
            </label>
            <label class="workspace-label">
              New password
              <input class="workspace-input" name="newPassword" type="password" autocomplete="new-password" required>
            </label>
            <label class="workspace-label">
              Confirm new password
              <input class="workspace-input" name="confirmPassword" type="password" autocomplete="new-password" required>
            </label>
            <button class="workspace-button workspace-button-secondary" type="submit">Update password</button>
          </form>
          <p class="workspace-muted">You can also use your current password here if your school asked you to change it.</p>
        </div>
        </details>
        ` : ""}
        <div class="workspace-auth-help">
          <strong>Need help signing in?</strong>
          <span>Ask your teacher or project coordinator.</span>
        </div>
        </div>
      </div>
    </section>
  `;

  document.querySelector("#workspaceLoginForm")?.addEventListener("submit", signIn);
  document.querySelector("#workspacePasswordResetForm")?.addEventListener("submit", completePasswordReset);
  document.querySelector("#workspaceMfaForm")?.addEventListener("submit", verifyMfaCode);
  document.querySelector("[data-auth-mfa-cancel]")?.addEventListener("click", () => renderSignIn("", "neutral", "signed-out", { email: options.email || "" }));
  document.querySelector("#workspaceMfaContinue")?.addEventListener("click", loadSession);
  document.querySelector("[data-copy-mfa-codes]")?.addEventListener("click", async () => {
    const codes = document.querySelector("#workspaceMfaRecoveryCodes")?.value || "";
    if (codes && globalThis.navigator?.clipboard?.writeText) await globalThis.navigator.clipboard.writeText(codes);
  });
  bindWorkspaceThemeButtons();
}

async function signIn(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.email.value.trim();
  const password = form.password.value;
  setFormBusy(form, true);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(response);
    if (response.status === 202 && data?.challengeToken) {
      renderSignIn(
        data?.error === "mfa_enrollment_required" ? "Set up the extra sign-in check to continue." : "Enter the code from your authenticator app.",
        "neutral",
        "mfa-required",
        {
          email,
          challengeToken: data.challengeToken,
          mfaMode: data?.mfa?.mode || (data?.error === "mfa_enrollment_required" ? "enroll" : "login"),
          mfaSecret: data?.mfa?.secret || "",
        },
      );
      return;
    }
    if (!response.ok) {
      renderSignIn(messageForAuthError(data?.error, response.status), "error", workspaceStateForAuthError(data?.error), {
        email,
        showResetForm: data?.error === "password_reset_required",
      });
      return;
    }
    await loadSession();
  } catch (error) {
    renderSignIn(messageForNetworkError(error), "error", "signed-out", { email });
  }
}

async function completePasswordReset(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const form = event.currentTarget;
  const email = form.email.value.trim();
  const currentPassword = form.currentPassword.value;
  const newPassword = form.newPassword.value;
  const confirmPassword = form.confirmPassword.value;

  if (newPassword !== confirmPassword) {
    busy = false;
    renderSignIn("The new passwords do not match.", "error", "reset-required", { email, showResetForm: true });
    return;
  }

  setFormBusy(form, true);
  try {
    const response = await fetch("/api/auth/complete-reset", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderSignIn(messageForPasswordResetError(data?.error, response.status), "error", "reset-required", {
        email,
        showResetForm: true,
      });
      return;
    }
    await loadSession();
  } catch (error) {
    renderSignIn(messageForNetworkError(error), "error", "reset-required", { email, showResetForm: true });
  } finally {
    busy = false;
  }
}

function renderWorkspaceConnectionBanner() {
  if (!workspaceConnectionState.stale) return "";
  const savedCount = workspaceConnectionState.usingLastKnownKeys.length;
  const failedCount = workspaceConnectionState.failedKeys.length;
  const problem = workspaceConnectionProblemCopy(workspaceConnectionState.failures, savedCount);
  return `
    <section class="workspace-connection-banner" data-workspace-stale-state="true" role="status" aria-live="polite">
      <div>
        <strong>${escapeHtml(problem.title)}</strong>
        <p>${escapeHtml(problem.detail)}</p>
        <small>${workspaceConnectionState.lastFullSuccessAt
          ? `Last full update: ${escapeHtml(formatDate(workspaceConnectionState.lastFullSuccessAt))}.`
          : `${failedCount} ${pluralize(failedCount, "part")} could not load.`}</small>
      </div>
      <button class="workspace-button workspace-button-secondary" type="button" data-problem-action="refresh">
        ${workspaceConnectionState.retrying ? "Trying again..." : escapeHtml(problem.action)}
      </button>
    </section>
  `;
}

async function verifyMfaCode(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const form = event.currentTarget;
  const challengeToken = form.challengeToken.value;
  const code = form.code.value.trim();
  const mfaMode = form.mfaMode.value;
  const mfaSecret = form.mfaSecret.value;
  setFormBusy(form, true);
  try {
    const response = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ challengeToken, code }),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderSignIn(messageForMfaError(data?.error, response.status), "error", "mfa-required", {
        challengeToken,
        mfaMode,
        mfaSecret,
      });
      return;
    }
    if (Array.isArray(data?.recoveryCodes) && data.recoveryCodes.length) {
      renderSignIn("Extra sign-in is ready.", "success", "mfa-recovery", { recoveryCodes: data.recoveryCodes });
      return;
    }
    await loadSession();
  } catch (error) {
    renderSignIn(messageForNetworkError(error), "error", "mfa-required", { challengeToken, mfaMode, mfaSecret });
  } finally {
    busy = false;
  }
}

function messageForMfaError(error, status) {
  if (error === "invalid_mfa_code") return "That code did not work. Check the code and try again.";
  if (error === "mfa_challenge_expired") return "This sign-in check expired. Go back and sign in again.";
  if (error === "mfa_challenge_locked" || status === 429) return "Too many codes were tried. Go back and sign in again.";
  if (error === "mfa_setup_required") return "Extra sign-in setup needs to start again.";
  return "The extra sign-in check is unavailable. Go back and try again.";
}

function workspaceConnectionProblemCopy(failures = [], savedCount = 0) {
  const safeFailures = Array.isArray(failures) ? failures : [];
  const statuses = new Set(safeFailures.map((failure) => Number(failure?.status || 0)));
  const errors = new Set(safeFailures.map((failure) => String(failure?.error || "")));
  if (statuses.has(401) || errors.has("unauthorized") || errors.has("session_expired")) {
    return {
      title: "Your sign-in needs to be refreshed.",
      detail: "Use the account menu to sign out, then sign in again. Your saved work is not removed.",
      action: "Check sign-in again",
    };
  }
  if (statuses.has(403) || errors.has("forbidden")) {
    return {
      title: "One part is not available for this account.",
      detail: "Choose a school this account can use. If the school is correct, ask a school admin to check access.",
      action: "Reload access",
    };
  }
  if (statuses.has(409)) {
    return {
      title: "One part needs setup before it can open.",
      detail: "Check the school, project people, or account setup shown on this page, then try again.",
      action: "Check setup again",
    };
  }
  if (statuses.has(429)) {
    return {
      title: "Please wait before trying again.",
      detail: "Too many requests were made in a short time. Wait one minute, then try again.",
      action: "Try again",
    };
  }
  if (statuses.has(404)) {
    return {
      title: "One saved item could not be found.",
      detail: "Return to the list and choose the item again. Ask school staff for help if it is still missing.",
      action: "Reload the list",
    };
  }
  return {
    title: "The server did not answer.",
    detail: savedCount
      ? "You can still view the last saved information. Do not make changes until this message clears."
      : "You can still use the menu, school picker, and account menu. Some pages may be empty until the server is back.",
    action: "Try again",
  };
}

function renderAppShell(statusMessage = "", tone = "neutral") {
  if (!currentUser) {
    renderSignIn();
    return;
  }

  ensureActiveWorkspaceModeAndSection();
  const consoleCapabilities = adminConsoleCapabilitiesFor(currentUser);
  const isAdminConsole = activeWorkspaceMode === "admin" && consoleCapabilities.canSee;
  const sections = availableSections({ mode: activeWorkspaceMode });
  const primaryRole = primaryRoleForUser(currentUser);
  const roles = roleIds(currentUser);
  const viewingAsStudent = isViewAsStudentActive();
  const studentExperience = isStudentExperience(primaryRole, roles, viewingAsStudent);
  const experience = isAdminConsole ? "admin-console" : studentExperience ? "student" : "staff-workspace";
  const areaName = workspaceAreaName({ isAdminConsole, studentExperience });
  const guidancePrimaryRole = viewingAsStudent ? "student" : primaryRole;
  const guidanceRoles = viewingAsStudent ? new Set(["student"]) : roles;
  const siteContext = currentSiteWorkspaceContext();
  applyWorkspaceSchoolTheme(siteContext);
  const shellProjectName = workspaceShellProjectName({ studentExperience });
  const headerTitle = isAdminConsole
    ? "Admin Console"
    : studentExperience ? "My Capstone" : "Staff Workspace";
  const headerSubtitle = isAdminConsole
    ? adminConsoleSubtitle(consoleCapabilities)
    : studentExperience ? "What to do next" : workspaceHeaderSubtitle(primaryRole, siteContext);
  const headerContext = isAdminConsole
    ? adminConsoleHeaderContext(consoleCapabilities)
    : workspaceHeaderContext(primaryRole, siteContext);
  const roleFirstOverview = !isAdminConsole && activeSection === "overview";
  const studentFirstWorkspace = !isAdminConsole && studentExperience && STUDENT_PRIMARY_SECTION_IDS.has(activeSection);
  const staffWorklistFirst = !isAdminConsole && !studentExperience && STAFF_WORKLIST_FIRST_SECTION_IDS.has(activeSection);
  const activeSectionFirst = roleFirstOverview || studentFirstWorkspace || staffWorklistFirst;
  const modeUnavailableNotice = blockedWorkspaceMode === "admin" && !isAdminConsole
    ? renderAdminConsoleUnavailableNotice()
    : "";
  const sectionUnavailableNotice = blockedWorkspaceSection
    ? renderWorkspaceSectionUnavailableNotice(blockedWorkspaceSection)
    : "";
  const renderBlockedSectionOnly = Boolean(sectionUnavailableNotice);
  const screenGuidance = renderBlockedSectionOnly || !shouldRenderWorkflowScreenGuidance(activeSection, { isAdminConsole, studentExperience })
    ? ""
    : renderScreenGuidance(activeSection, guidancePrimaryRole, guidanceRoles, sections);
  const activeSectionMarkup = renderBlockedSectionOnly
    ? ""
    : isAdminConsole ? renderAdminConsoleActiveSection() : renderActiveSection();
  const shellReadOnlyBanner = !isAdminConsole
    && activeSection !== "students"
    && typeof renderReadOnlyBanner === "function"
    ? renderReadOnlyBanner()
    : "";
  const defaultReadyMessage = readyMessageForCurrentExperience();
  const statusMarkup = statusMessage && !(tone === "success" && statusMessage === defaultReadyMessage)
    ? statusHtml(statusMessage, tone)
    : "";
  const topbarContextControls = renderWorkspaceTopbarContextControls([
    renderSiteSwitcherControl(),
    renderWorkspaceStudentSearchControl(roles),
    renderWorkspaceModeSwitch(consoleCapabilities),
  ], { isAdminConsole });
  const programTeacherPrimarySection = !renderBlockedSectionOnly
    && !isAdminConsole
    && roles.has("program_teacher")
    && ["overview", "students", "teacher", "programDashboard", "staffReports"].includes(activeSection);
  const mentorPrimarySection = !renderBlockedSectionOnly
    && !isAdminConsole
    && roles.has("mentor")
    && ["overview", "mentor", "mentorDashboard", "teacher", "staffReports"].includes(activeSection);
  const adminConsolePrimarySection = !renderBlockedSectionOnly
    && isAdminConsole
    && ["overview", "adminPeople", "adminStudents", "adminAssignments", "programs", "adminImports", "adminReports", "audit"].includes(activeSection);
  const viewerPrimarySection = !renderBlockedSectionOnly
    && !isAdminConsole
    && roles.has("viewer")
    && ["overview", "students", "staffReports"].includes(activeSection);
  const staffAdminPrimarySection = !renderBlockedSectionOnly
    && !isAdminConsole
    && (roles.has("administration") || roles.has("site_admin") || hasGlobalAdminRole(roles))
    && ["overview", "students", "teacher", "staffReports"].includes(activeSection);
  const studentPrimarySection = !renderBlockedSectionOnly
    && studentExperience
    && STUDENT_PRIMARY_SECTION_IDS.has(activeSection);
  const projectPrimarySection = !renderBlockedSectionOnly
    && !isAdminConsole
    && activeSection === "projects";
  const operationalPrimarySection = !renderBlockedSectionOnly
    && !isAdminConsole
    && !studentExperience
    && ["siteDashboard", "mentorAssignments", "operations", "presentation", "readiness", "archiveExports"].includes(activeSection);
  const detailSourceSection = cleanWorkspaceSection(siteStudentDetailState?.sourceSection || "");
  const siteStudentDetailPrimarySection = !renderBlockedSectionOnly
    && Boolean(siteStudentDetailState?.studentId)
    && detailSourceSection === activeSection
    && activeSection === "students";
  const adminStudentSearchPrimarySection = !renderBlockedSectionOnly
    && isAdminConsole
    && activeSection === "students";
  const primarySectionKind = projectPrimarySection
    ? "projects"
    : studentPrimarySection
    ? activeSection === "student"
      ? "student"
      : activeSection === "studentWork"
        ? "student-work"
        : activeSection === "studentFeedback"
          ? "student-feedback"
          : activeSection === "studentFinalChecklist"
            ? "student-final-checklist"
            : activeSection === "presentation"
              ? "student-presentation"
              : "student-final-files"
    : siteStudentDetailPrimarySection
      ? isAdminConsole ? "admin-student-detail" : "student-detail"
    : adminStudentSearchPrimarySection
      ? "admin-student-search"
    : adminConsolePrimarySection
      ? `admin-${activeSection}`
    : operationalPrimarySection
      ? `operations-${activeSection}`
    : mentorPrimarySection
      ? activeSection === "mentor"
        ? "mentor-students"
        : activeSection === "teacher"
          ? "mentor-reviews"
          : activeSection === "staffReports"
            ? "mentor-reports"
            : "mentor"
      : viewerPrimarySection
        ? activeSection === "students"
          ? "viewer-students"
          : activeSection === "staffReports"
            ? "viewer-reports"
            : "viewer"
        : staffAdminPrimarySection
          ? activeSection === "students"
            ? "staff-students"
            : activeSection === "teacher"
              ? "staff-reviews"
              : activeSection === "staffReports"
                ? "staff-reports"
                : "staff-admin"
          : programTeacherPrimarySection
            ? activeSection === "students"
              ? "program-teacher-students"
              : activeSection === "teacher"
              ? "teacher"
              : activeSection === "programDashboard"
                ? "program-teacher-dashboard"
                : activeSection === "staffReports"
                  ? "program-teacher-reports"
                  : "program-teacher"
            : "";
  const primarySectionMarkup = primarySectionKind
    ? `${activeSectionMarkup}${operationalPrimarySection ? screenGuidance : ""}`
    : "";
  const supportMarkup = renderV2SupportPanel({
    activeSectionMarkup: primarySectionMarkup ? "" : activeSectionMarkup,
    primarySectionVisible: Boolean(primarySectionMarkup),
    screenGuidance,
    shellReadOnlyBanner,
    isAdminConsole,
    consoleCapabilities,
    sections,
    renderBlockedSectionOnly,
  });
  workspaceMain.innerHTML = `
    <section class="workspace-app workspace-v2-app" data-flow-frame="v2-from-scratch" data-primary-role="${escapeHtml(primaryRole)}" data-app-mode="${escapeHtml(activeWorkspaceMode)}" data-experience="${escapeHtml(experience)}" data-nav-state="${workspaceNavCollapsed ? "collapsed" : "expanded"}" data-view-as-student="${viewingAsStudent ? "active" : "inactive"}" data-workspace-data-state="${workspaceConnectionState.stale ? "stale" : "current"}">
      <header class="workspace-topbar workspace-v2-topbar" data-topbar-density="compact">
        <div class="workspace-topbar-start workspace-v2-brandline">
          <button class="workspace-menu-toggle workspace-v2-menu-toggle" id="workspaceMenuToggle" type="button" aria-controls="workspaceNavigationRail" aria-expanded="${workspaceNavCollapsed ? "false" : "true"}" aria-pressed="${workspaceNavCollapsed ? "false" : "true"}" aria-label="${workspaceNavCollapsed ? "Open menu" : "Close menu"}">
            <span class="workspace-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="workspace-menu-toggle-label">Menu</span>
          </button>
          <a class="workspace-brand workspace-v2-brand" href="/">
            <span class="workspace-mark">SC</span>
            <span>${escapeHtml(studentExperience ? "My Capstone" : "Capstone")}</span>
          </a>
          <div class="workspace-topbar-area workspace-v2-current" aria-label="Current project and area">
            <strong>${escapeHtml(isAdminConsole ? areaName : shellProjectName)}</strong>
            <span>${escapeHtml(isAdminConsole ? sectionLabelForTopbar(sections, activeSection) : `${sectionLabelForTopbar(sections, activeSection)} / ${roleIdentityFor(primaryRole).label}`)}</span>
          </div>
        </div>
        <div class="workspace-user workspace-v2-user">
          <details class="workspace-v2-tools" data-v2-tools="true" data-workspace-topbar-tools="true">
            <summary aria-label="Open workspace tools">Tools</summary>
            <div class="workspace-topbar-center workspace-v2-tools-panel">
              ${topbarContextControls}
            </div>
          </details>
          ${studentExperience ? "" : renderActiveRoleBadge(primaryRole, { readOnly: viewingAsStudent || roles.has("viewer") || Boolean(isAdminConsole && consoleCapabilities.readOnly) })}
          ${renderWorkspaceAccountMenu(areaName)}
        </div>
      </header>
      <main class="workspace-v2-stage" data-v2-stage="${escapeHtml(activeSection)}">
        <aside class="workspace-rail workspace-v2-drawer ${isAdminConsole ? "workspace-admin-console-rail" : ""}" id="workspaceNavigationRail" aria-label="${escapeHtml(areaName)} navigation" ${workspaceNavCollapsed ? 'hidden aria-hidden="true"' : ""}>
          <a class="workspace-v2-sidebar-brand" href="/" aria-label="Capstone Project home">
            <span class="workspace-mark">SC</span>
            <span>
              <strong>${escapeHtml(studentExperience ? "My Capstone" : "Capstone")}</strong>
              <small>${escapeHtml(areaName)}</small>
            </span>
          </a>
          <div class="workspace-v2-sidebar-context">
            <span aria-hidden="true"></span>
            <strong>${escapeHtml(isAdminConsole ? "School administration" : shellProjectName)}</strong>
          </div>
          <div class="workspace-rail-drawer-header workspace-v2-drawer-header" data-workspace-rail-drawer-header="true">
            <strong>${escapeHtml(`Go to ${areaName}`)}</strong>
            <button class="workspace-button workspace-button-secondary workspace-button-small workspace-rail-close" id="workspaceRailClose" type="button">Close</button>
          </div>
          <nav class="workspace-tabs workspace-v2-drawer-list" aria-label="${escapeHtml(`${areaName} sections`)}">
            ${renderV2Navigation(sections, { compact: false, studentExperience, isAdminConsole })}
          </nav>
          <div class="workspace-v2-sidebar-account" aria-label="Signed-in account">
            <span class="workspace-account-avatar" aria-hidden="true">${escapeHtml(accountInitials(currentUser?.displayName || "", currentUser?.email || ""))}</span>
            <span>
              <strong>${escapeHtml(currentUser?.displayName || "Signed in")}</strong>
              <small>${escapeHtml(roleIdentityFor(primaryRole).label)}</small>
            </span>
          </div>
        </aside>
        <nav class="workspace-v2-switcher" aria-label="${escapeHtml(`${areaName} screens`)}">
          ${renderV2Navigation(sections, { compact: true, studentExperience, isAdminConsole })}
        </nav>
        ${renderViewAsStudentBanner()}
        ${renderWorkspaceConnectionBanner()}
        ${renderProjectAdultNotices()}
        ${statusMarkup}
        ${modeUnavailableNotice}
        ${sectionUnavailableNotice}
        ${renderV2ActiveScreen({
          isAdminConsole,
          studentExperience,
          activeSection,
          sections,
          primaryRole,
          roles,
          blocked: renderBlockedSectionOnly,
          supportMarkup,
          primarySectionMarkup,
          primarySectionKind,
        })}
      </main>
    </section>
  `;

  document.querySelector("#workspaceMenuToggle")?.addEventListener("click", toggleWorkspaceMenu);
  document.querySelector("#workspaceRailClose")?.addEventListener("click", closeWorkspaceMenu);
  document.removeEventListener?.("keydown", handleWorkspaceKeydown);
  document.addEventListener?.("keydown", handleWorkspaceKeydown);
  window.removeEventListener?.("resize", syncWorkspaceDrawerOffset);
  window.addEventListener?.("resize", syncWorkspaceDrawerOffset);
  syncWorkspaceDrawerOffset();
  document.querySelector("#workspaceSiteSelect")?.addEventListener("change", (event) => selectWorkspaceSite(event.currentTarget?.value || ""));
  document.querySelectorAll("[data-site-switch-id]").forEach((button) => {
    button.addEventListener("click", () => selectWorkspaceSite(button.dataset.siteSwitchId || ""));
  });
  document.querySelectorAll("[data-workspace-mode-target]").forEach((button) => {
    button.addEventListener("click", () => switchWorkspaceMode(button));
  });
  document.querySelector("#workspaceRefresh")?.addEventListener("click", () => loadWorkspaceData("Workspace refreshed."));
  document.querySelector("#workspaceLogout")?.addEventListener("click", signOut);
  bindWorkspaceThemeButtons();
  document.querySelectorAll("[data-workspace-disclosure-action]").forEach((button) => {
    button.addEventListener("click", handleWorkspaceDisclosureToggle);
  });
  document.querySelectorAll("[data-v2-support-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.querySelector("[data-v2-support-panel]");
      panel?.setAttribute("open", "");
      panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => openWorkspaceSection(button));
  });
  document.querySelectorAll("[data-role-assignment-action]").forEach((button) => {
    button.addEventListener("click", handleRoleAssignmentAction);
  });
  document.querySelectorAll("[data-problem-action]").forEach((button) => {
    button.addEventListener("click", () => handleProblemStateAction(button));
  });
  document.querySelectorAll("[data-users-access-focus]").forEach((button) => {
    button.addEventListener("click", () => handleUsersAccessFocusAction(button));
  });
  if (typeof workspaceMain?.addEventListener === "function") {
    if (!workspaceMain.dataset.peopleViewNavigationBound) {
      workspaceMain.dataset.peopleViewNavigationBound = "true";
      workspaceMain.addEventListener("click", (event) => {
        const button = event.target?.closest?.("[data-people-view-target]");
        if (button && workspaceMain.contains(button)) handlePeopleViewAction(button);
      });
    }
  } else {
    document.querySelectorAll("[data-people-view-target]").forEach((button) => {
      button.addEventListener("click", () => handlePeopleViewAction(button));
    });
  }
  document.querySelectorAll("[data-security-focus]").forEach((button) => {
    button.addEventListener("click", () => handleSecurityFocusAction(button));
  });
  bindWorkspaceForms();
  bindAdminDirectorySearches();
  flushPendingSiteStudentDetailFocus();
  flushPendingStudentRequirementFocus();
  flushPendingStudentSectionFocus();
  flushPendingStudentEvidenceFocus();
}

function renderProjectAdultNotices() {
  const body = unwrap(currentData.projectAdults);
  if (!body || typeof body !== "object") return "";
  const invitations = Array.isArray(body.invitations) ? body.invitations : [];
  const notices = (Array.isArray(body.notifications) ? body.notifications : []).filter((notice) => notice?.read !== true);
  if (!invitations.length && !notices.length) return "";
  return `
    <section class="workspace-project-adult-notices" aria-labelledby="projectAdultNoticeTitle" data-project-adult-notices="true">
      <div>
        <p class="workspace-kicker">Project people</p>
        <h2 id="projectAdultNoticeTitle">${invitations.length ? "A project needs your answer" : "Project update"}</h2>
      </div>
      ${invitations.map((invite) => `
        <article>
          <div>
            <strong>${escapeHtml(`${invite.adultRole === "mentor" ? "Mentor" : "Program Teacher"} invite: ${invite.targetName || "Senior Project"}`)}</strong>
            <p>${escapeHtml(invite.requestId ? "A student project idea needs your answer." : "A project needs your answer.")}</p>
          </div>
          <form data-project-adult-response-form="true">
            <input type="hidden" name="assignmentId" value="${escapeHtml(invite.assignmentId || "")}">
            <button class="workspace-button workspace-button-primary workspace-button-small" type="submit" name="action" value="accept_adult_invitation">Accept</button>
            <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit" name="action" value="decline_adult_invitation">Decline</button>
          </form>
        </article>
      `).join("")}
      ${notices.slice(0, 2).map((notice) => `
        <p class="workspace-project-adult-notice-line"><strong>${escapeHtml(notice.title || "Project update")}</strong> ${escapeHtml(notice.message || "")}</p>
      `).join("")}
      ${notices.length ? `<button class="workspace-link-button" type="button" data-project-adult-notices-read="true">Mark updates read</button>` : ""}
    </section>
  `;
}

function renderV2Navigation(sections = [], options = {}) {
  const compact = Boolean(options.compact);
  const visibleSections = (sections || []).filter((section) => !section.hidden);
  if (!compact && !options.studentExperience) {
    return renderTieredStaffNavigation(visibleSections, { isAdminConsole: Boolean(options.isAdminConsole) });
  }
  return visibleSections.map((section, index) => {
    const active = section.id === activeSection;
    return `
      <button class="workspace-tab workspace-v2-step ${active ? "is-active" : ""}" data-section="${escapeHtml(section.id)}" data-v2-nav-index="${escapeHtml(String(index + 1))}" type="button" title="${escapeHtml(section.label)}" aria-label="${escapeHtml(`${section.label}: ${section.detail}`)}" ${active ? 'aria-current="page"' : ""}>
        <span class="workspace-tab-short workspace-v2-step-number" aria-hidden="true">${escapeHtml(String(index + 1))}</span>
        <strong>${escapeHtml(section.label)}</strong>
        ${compact ? "" : `<span>${escapeHtml(section.detail || "Open this screen.")}</span>`}
      </button>
    `;
  }).join("");
}

function renderTieredStaffNavigation(sections = [], options = {}) {
  const definitions = options.isAdminConsole
    ? [
        ["Start", ["overview"]],
        ["People", ["adminPeople", "adminStudents", "adminAssignments"]],
        ["School setup", ["programs", "adminImports"]],
        ["Check", ["adminReports", "audit"]],
        ["Account", ["profile", "security"]],
      ]
    : [
        ["Projects", ["projects"]],
        ["Work queue", ["overview", "teacher", "mentorDashboard", "programDashboard"]],
        ["People", ["students", "mentor", "mentorAssignments"]],
        ["Milestones", ["operations", "presentation"]],
        ["Reports", ["staffReports", "readiness", "archive", "archiveExports"]],
        ["Account", ["profile", "security"]],
      ];
  const used = new Set();
  const groups = definitions.map(([label, ids]) => {
    const rows = ids.map((id) => sections.find((section) => section.id === id)).filter(Boolean);
    rows.forEach((row) => used.add(row.id));
    return { label, rows };
  }).filter((group) => group.rows.length);
  const remaining = sections.filter((section) => !used.has(section.id));
  if (remaining.length) groups.push({ label: "More", rows: remaining });

  return groups.map((group) => {
    const primary = group.rows[0];
    const activeGroup = group.rows.some((section) => section.id === activeSection);
    return `
      <section class="workspace-staff-nav-group ${activeGroup ? "is-active" : ""}" data-staff-nav-group="${escapeHtml(group.label)}">
        <button class="workspace-staff-nav-major ${primary.id === activeSection ? "is-active" : ""}" type="button" data-section="${escapeHtml(primary.id)}" ${primary.id === activeSection ? 'aria-current="page"' : ""} aria-label="${escapeHtml(`Open ${primary.label}`)}">
          <strong>${escapeHtml(group.label)}</strong>
          <small>${escapeHtml(primary.label)}</small>
          <span aria-hidden="true">›</span>
        </button>
        ${group.rows.length > 1 ? `
          <div class="workspace-staff-nav-minor" aria-label="${escapeHtml(`${group.label} screens`)}">
            ${group.rows.slice(1).map((section) => `
              <button class="${section.id === activeSection ? "is-active" : ""}" type="button" data-section="${escapeHtml(section.id)}" ${section.id === activeSection ? 'aria-current="page"' : ""}>
                ${escapeHtml(section.label)}
              </button>
            `).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }).join("");
}

function renderV2SupportPanel({
  activeSectionMarkup = "",
  primarySectionVisible = false,
  screenGuidance = "",
  shellReadOnlyBanner = "",
  isAdminConsole = false,
  consoleCapabilities = adminConsoleCapabilitiesFor(currentUser),
  sections = availableSections(),
  renderBlockedSectionOnly = false,
} = {}) {
  const roles = roleIds(currentUser);
  if (primarySectionVisible && !renderBlockedSectionOnly) {
    return "";
  }
  const focusedTeacherScreen = activeSection === "teacher"
    || (activeSection === "overview" && roles.has("program_teacher"));
  if (focusedTeacherScreen && !activeSectionMarkup && !isAdminConsole && !renderBlockedSectionOnly) {
    return "";
  }
  const supportTitle = renderBlockedSectionOnly
    ? "View access message"
    : isAdminConsole ? "Open setup tools" : "Open supporting details";
  const adminHeader = isAdminConsole && !renderBlockedSectionOnly
    ? renderAdminConsoleHeader(consoleCapabilities, sections)
    : "";
  return `
    <details class="workspace-v2-support" data-v2-support-panel="true">
      <summary>
        <span>${escapeHtml(supportTitle)}</span>
        <small>${escapeHtml(isAdminConsole ? "Forms, lists, and audit details stay here until needed." : "Extra details stay closed until they help the next step.")}</small>
      </summary>
      <div class="workspace-v2-support-body">
        ${adminHeader}
        ${activeSectionMarkup}
        ${shellReadOnlyBanner}
        ${screenGuidance}
      </div>
    </details>
  `;
}

function renderV2ActiveScreen({
  isAdminConsole = false,
  studentExperience = false,
  activeSection: sectionId = activeSection,
  sections = availableSections(),
  primaryRole = primaryRoleForUser(currentUser),
  roles = roleIds(currentUser),
  blocked = false,
  supportMarkup = "",
  primarySectionMarkup = "",
  primarySectionKind = "",
} = {}) {
  if (blocked) {
    return `
      <section class="workspace-v2-screen" data-v2-screen="blocked">
        <div class="workspace-v2-hero">
          <p class="workspace-v2-kicker">Not available</p>
          <h1>This screen is not open for this account</h1>
          <p>Use the available screens above. Access rules are unchanged.</p>
        </div>
        ${supportMarkup}
      </section>
    `;
  }
  if (primarySectionKind === "projects") {
    return `
      <section class="workspace-v2-screen workspace-v2-projects-screen" data-v2-screen="projects" aria-label="Projects">
        <div class="workspace-v2-primary-surface" data-v2-primary-surface="projects">
          ${primarySectionMarkup}
        </div>
      </section>
    `;
  }
  const directRoleSurface = Boolean(primarySectionMarkup) && (
    primarySectionKind.startsWith("student")
    || primarySectionKind.startsWith("operations-")
    || ["mentor", "mentor-students", "mentor-reviews", "mentor-reports", "program-teacher", "program-teacher-students", "program-teacher-dashboard", "program-teacher-reports", "teacher"].includes(primarySectionKind)
  );
  if (directRoleSurface) {
    return `
      <section class="workspace-v2-screen workspace-v2-role-screen" data-v2-screen="${escapeHtml(primarySectionKind)}" aria-label="${escapeHtml(sectionLabelForTopbar(sections, sectionId))}">
        <div class="workspace-v2-primary-surface" data-v2-primary-surface="${escapeHtml(primarySectionKind)}">
          ${primarySectionMarkup}
        </div>
      </section>
    `;
  }
  const model = v2ScreenModel({ isAdminConsole, studentExperience, sectionId, sections, primaryRole, roles, primarySectionKind });
  const primarySurfaceMarkup = primarySectionMarkup ? `
    <div class="workspace-v2-primary-surface" data-v2-primary-surface="${escapeHtml(primarySectionKind || "primary")}">
      ${primarySectionMarkup}
    </div>
  ` : "";
  const secondarySupportMarkup = supportMarkup;
  return `
    <section class="workspace-v2-screen" data-v2-screen="${escapeHtml(model.id)}" aria-labelledby="workspaceV2Title">
      <div class="workspace-v2-hero">
        <p class="workspace-v2-kicker">${escapeHtml(model.kicker)}</p>
        <h1 id="workspaceV2Title">${escapeHtml(model.title)}</h1>
        <p>${escapeHtml(model.detail)}</p>
        <div class="workspace-v2-primary-row">
          ${model.primaryAction}
          <span>${escapeHtml(model.primaryHint)}</span>
        </div>
      </div>
      ${primarySurfaceMarkup}
      ${renderV3StartState(model)}
      ${renderV5FlowBoard(model)}
      <div class="workspace-v2-path" aria-label="${escapeHtml(model.pathLabel)}">
        ${model.steps.map((step, index) => `
          <article data-v2-path-step="${escapeHtml(String(index + 1))}" class="${escapeHtml(index === 0 ? "current" : step.tone || "next")}">
            <span>${escapeHtml(String(index + 1))}</span>
            <strong>${escapeHtml(step.title)}</strong>
            <small>${escapeHtml(step.detail)}</small>
          </article>
        `).join("")}
      </div>
      ${model.focusHtml}
      ${secondarySupportMarkup}
    </section>
  `;
}

function v2ScreenModel({ isAdminConsole = false, studentExperience = false, sectionId = activeSection, sections = [], primaryRole = "student", roles = new Set(), primarySectionKind = "" } = {}) {
  if (studentExperience) return v2StudentScreenModel(sectionId);
  if (primarySectionKind === "admin-student-detail" || primarySectionKind === "student-detail") {
    return v2StudentDetailScreenModel({ isAdminConsole });
  }
  if (primarySectionKind === "admin-student-search") return v2AdminStudentSearchScreenModel();
  if (isAdminConsole) return v2AdminScreenModel(sectionId, sections);
  if (roles.has("mentor") || sectionId === "mentorDashboard" || sectionId === "mentor") return v2MentorScreenModel(sectionId);
  if (roles.has("program_teacher") || sectionId === "teacher" || sectionId === "programDashboard") return v2TeacherScreenModel(sectionId);
  if (roles.has("viewer")) return v2ViewerScreenModel(sectionId);
  return v2StaffScreenModel(sectionId, primaryRole);
}

function v2StudentDetailScreenModel({ isAdminConsole = false } = {}) {
  return {
    id: isAdminConsole ? "admin-student-detail" : "student-detail",
    kicker: "Student detail",
    title: "Review this student record",
    detail: "Start with this student's status, feedback, work, and timeline before opening broader tools.",
    primaryAction: v2PrimaryButton("Open feedback", 'data-student-detail-tab="feedback" data-student-detail-primary-action="hero-feedback"'),
    primaryHint: isAdminConsole ? "Record before setup" : "Record before lists",
    pathLabel: "Student detail path",
    steps: v2PathSteps("Read the next need", "Open the matching tab", "Return to the filtered list"),
    startState: {
      job: isAdminConsole ? "admin-student-detail-record" : "staff-student-detail-record",
      action: "What this student needs next",
      reason: "Student-detail routes should lead with the record instead of generic setup guidance.",
      now: "Use the current status, feedback, and support owner to choose the next action.",
      empty: "If the record is unavailable, return to the filtered student list and open another student.",
      confirm: "Stop when the next support owner, feedback item, or work tab is clear.",
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>This student stays ahead of broader tools.</strong>
        <span>Use setup, reports, or lists only after the record shows what follow-up is needed.</span>
      </section>
    `,
  };
}

function v2AdminStudentSearchScreenModel() {
  const directory = unwrap(currentData.siteStudents);
  const filters = directory?.filters || {};
  const hasFilters = Boolean(filters.search || filters.programId || filters.status || filters.progressStatus || filters.evidenceStatus || filters.reviewStatus || filters.presentationStatus || filters.archiveStatus || filters.story || filters.noMentor);
  return {
    id: "admin-student-search",
    kicker: "Student search",
    title: hasFilters ? "Review filtered students" : "Review student records",
    detail: "Use the selected school's student list before opening broader roster setup tools.",
    primaryAction: hasFilters
      ? v2PrimaryButton("Clear filters", 'data-site-student-action="reset-filters"')
      : v2SupportButton("Open student tools"),
    primaryHint: hasFilters ? "Filtered student list" : "School-scoped students",
    pathLabel: "Student search path",
    steps: v2PathSteps("Check current filters", "Open one student", "Return to roster setup if needed"),
    startState: {
      job: "admin-student-search",
      action: hasFilters ? "Review the filtered results." : "Review one student record.",
      reason: "Hidden student-search routes should show the student list or empty state instead of generic setup guidance.",
      now: hasFilters ? "Confirm whether the search found a student at this school." : "Choose the student record that needs review.",
      empty: "Clear filters or try another search before changing roster setup.",
      confirm: "Stop when the student is found, filters are cleared, or setup work belongs in Admin Students.",
    },
    flowBoard: {
      id: "admin-student-search-flow",
      label: "Student search flow",
      title: "Search before setup",
      detail: "Student search stays tied to the selected school and avoids roster changes until the visible result is clear.",
      lanes: [
        {
          label: "Search",
          target: hasFilters ? "student-directory-filters" : "support-panel",
          title: "Check the current filters",
          detail: "Use the visible search, saved filters, and result count before opening setup tools.",
          actions: [hasFilters ? v5AttributeAction("Clear filters", 'data-site-student-action="reset-filters"', true) : v5SupportAction("Open student tools", true)],
        },
        {
          label: "Open",
          title: "Open one student record",
          detail: "Use a visible row when a student matches the selected school and filters.",
          actions: [v5SupportAction("Open student list")],
        },
        {
          label: "Setup",
          title: "Use roster setup only after search",
          detail: "Move to Admin Students only when the student record needs roster or access setup.",
          actions: [v5SectionAction("Open Admin Students", "adminStudents")],
        },
      ],
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Search results lead before roster setup.</strong>
        <span>Keep student search, empty states, and recovery actions visible before changing records.</span>
      </section>
    `,
  };
}

function v2PrimaryButton(label, attrs = "") {
  return `<button class="workspace-button workspace-v2-primary" type="button" ${attrs}>${escapeHtml(label)}</button>`;
}

function v2SupportButton(label) {
  return v2PrimaryButton(label, 'data-v2-support-open="true"');
}

function v2SectionButton(label, sectionId) {
  return v2PrimaryButton(label, `data-section="${escapeHtml(sectionId)}"`);
}

function v2PathSteps(first = "Choose the item", second = "Do the work", third = "Confirm the result") {
  return [
    { title: first, detail: "Start with one item only.", tone: "current" },
    { title: second, detail: "Use the focused tool for that item.", tone: "next" },
    { title: third, detail: "Return here when the saved result is visible.", tone: "done" },
  ];
}

function v5SectionAction(label, sectionId, primary = false) {
  return { label, sectionId, primary };
}

function v5SupportAction(label, primary = false) {
  return { label, support: true, primary };
}

function v5AttributeAction(label, attrs = "", primary = false) {
  return { label, attrs, primary };
}

function renderV5FlowAction(action = {}) {
  const attrs = action.attrs
    ? action.attrs
    : action.sectionId
    ? `data-section="${escapeHtml(action.sectionId)}"`
    : 'data-v2-support-open="true"';
  const primaryClass = action.primary ? " is-primary" : "";
  return `<button class="workspace-button workspace-v5-flow-action${primaryClass}" type="button" ${attrs}>${escapeHtml(action.label || "Open")}</button>`;
}

function renderV5FlowBoard(model = {}) {
  const board = model.flowBoard || {};
  const lanes = Array.isArray(board.lanes) ? board.lanes.filter(Boolean) : [];
  if (!lanes.length) return "";
  const boardId = board.id || `${model.id || "screen"}-flow`;
  const titleId = `workspaceV5FlowTitle-${boardId}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `
    <section class="workspace-v5-flow-board" data-v5-flow-board="${escapeHtml(boardId)}" aria-labelledby="${escapeHtml(titleId)}">
      <div class="workspace-v5-flow-lead">
        <span>${escapeHtml(board.label || "Next flow")}</span>
        <h2 id="${escapeHtml(titleId)}">${escapeHtml(board.title || "Choose the next action")}</h2>
        <p>${escapeHtml(board.detail || "Start with one routed action, then use supporting details only when needed.")}</p>
      </div>
      <div class="workspace-v5-flow-lanes">
        ${lanes.map((lane, index) => {
          const actions = Array.isArray(lane.actions) ? lane.actions.filter(Boolean) : [];
          const target = lane.target || actions.find((action) => action.sectionId)?.sectionId || (actions.length ? "support-panel" : "none");
          return `
            <article class="workspace-v5-flow-lane" data-v5-flow-lane="${escapeHtml(String(index + 1))}" data-v5-flow-target="${escapeHtml(target)}">
              <span>${escapeHtml(lane.label || `Step ${index + 1}`)}</span>
              <strong>${escapeHtml(lane.title || "Open the focused work")}</strong>
              <p>${escapeHtml(lane.detail || "Use this action before scanning the rest of the page.")}</p>
              ${actions.length ? `<div class="workspace-v5-flow-actions">${actions.map(renderV5FlowAction).join("")}</div>` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderV3StartState(model = {}) {
  const state = model.startState || {};
  const rows = [
    ["Right now", state.now || ""],
    ["If empty", state.empty || ""],
    ["Finish by", state.confirm || ""],
  ].filter(([, value]) => value);
  if (!rows.length) return "";
  const job = state.job || model.id || "focused-screen";
  return `
    <section class="workspace-v3-start-state" data-v3-start-state="true" data-v3-one-job="${escapeHtml(job)}" aria-labelledby="workspaceV3StartTitle">
      <div class="workspace-v3-start-lead">
        <span>${escapeHtml(state.label || "Start here")}</span>
        <strong id="workspaceV3StartTitle">${escapeHtml(state.action || model.primaryHint || "Open the focused work.")}</strong>
        <p>${escapeHtml(state.reason || "Use one screen, one action, and one confirmation before moving on.")}</p>
      </div>
      <div class="workspace-v3-start-grid">
        ${rows.map(([label, value]) => `
          <article data-v3-start-cue="${escapeHtml(label.toLowerCase().replace(/\s+/g, "-"))}">
            <span>${escapeHtml(label)}</span>
            <p>${escapeHtml(value)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function v2StudentScreenModel(sectionId = activeSection) {
  const isWork = sectionId === "studentWork";
  const isFeedback = sectionId === "studentFeedback";
  const isFinal = sectionId === "studentFinalChecklist";
  const isPresentation = sectionId === "presentation";
  const isArchive = sectionId === "archive";
  const title = isWork
    ? "Finish one item"
    : isFeedback
      ? "Fix one feedback note"
      : isFinal
        ? "Check the final package"
        : isPresentation
          ? "Know your presentation plan"
          : isArchive
            ? "Save final files"
            : "What do I do next?";
  const detail = isWork
    ? "Work on one requirement at a time. Extra progress details stay closed."
    : isFeedback
      ? "Start with feedback that asks for action, then return to the matching work item."
      : isFinal
        ? "Use this only when the required work and evidence are ready."
        : isPresentation
          ? "Check your time, outline, and what to bring before presentation day."
          : isArchive
            ? "Check readiness and save downloads only when final files are ready."
            : "Start with the next action, then use feedback or checklist only when it applies.";
  const primaryAction = isWork
    ? v2SupportButton("Open current item")
    : isFeedback
      ? v2SupportButton("Open feedback")
      : isFinal
        ? v2SupportButton("Open final checklist")
        : isPresentation
          ? v2SupportButton("Open presentation details")
          : isArchive
            ? v2SupportButton("Open final files details")
            : v2SectionButton("Open My Project", "studentWork");
  const primaryHint = isWork
    ? "One item at a time"
    : isFeedback
      ? "Action notes first"
      : isFinal
        ? "Final readiness only"
        : isPresentation
          ? "Time and outline first"
          : isArchive
            ? "Download readiness only"
            : "Starts the next required step";
  const startAction = isWork
    ? "Open the current item."
    : isFeedback
      ? "Open feedback that asks for action."
      : isFinal
        ? "Check final readiness."
        : isPresentation
          ? "Check presentation time and outline."
          : isArchive
            ? "Check final-file readiness."
            : "Open My Project first.";
  const startNow = isWork
    ? "Work on the requirement named at the top of the details."
    : isFeedback
      ? "Read the teacher note, then fix one matching item."
      : isFinal
        ? "Confirm presentation and final-file readiness only after required work is done."
        : isPresentation
          ? "Confirm when, where, and what outline status still needs attention."
          : isArchive
            ? "Check whether downloads are ready, blocked, expired, or waiting for staff."
            : "Start with one thing now, then use feedback or checklist only if needed.";
  const startEmpty = isPresentation
    ? "No presentation row yet? Keep My Project current and check back when staff posts the schedule."
    : isArchive
      ? "No download yet? Finish missing work or ask staff what is blocking final files."
      : "Nothing needs your attention right now? Check feedback, then the final checklist.";
  const startConfirm = isFinal
    ? "Stop when the checklist shows what is ready and what still needs work."
    : isPresentation
      ? "Stop when you know your time, room, outline status, and after-presentation check."
      : isArchive
        ? "Stop when files are saved somewhere you can keep or the blocker is clear."
        : "Stop when the item is submitted, revised, or waiting for teacher review.";
  const flowTitle = isWork
    ? "Keep one requirement in focus"
    : isFeedback
      ? "Fix one action note"
      : isFinal
        ? "Use the checklist after required work"
        : isPresentation
          ? "Prepare without replacing missing work"
          : isArchive
            ? "Save files only when ready"
            : "Your next capstone move";
  const flowLanes = isPresentation
    ? [
        {
          label: "Before",
          title: "Know time and outline",
          detail: "Check the scheduled time, room, and outline status before presentation day.",
          actions: [v5SectionAction("Open Presentation", "presentation", true)],
        },
        {
          label: "During",
          title: "Show finished work",
          detail: "Presentation helps you show work. It does not replace missing checklist Drive links.",
          actions: [v5SectionAction("Open My Project", "studentWork", false)],
        },
        {
          label: "After",
          title: "Check final files",
          detail: "After presenting, confirm final-file readiness and save downloads when ready.",
          actions: [v5SectionAction("Open Final Files", "archive", false)],
        },
      ]
    : isArchive
      ? [
          {
            label: "Check",
            title: "Read readiness",
            detail: "Confirm whether final files are ready, blocked, expired, or waiting for staff.",
            actions: [v5SectionAction("Open Final Files", "archive", true)],
          },
          {
            label: "Save",
            title: "Keep a copy",
            detail: "Download and save final files somewhere you can keep when the download is ready.",
            actions: [v5SectionAction("Open Final Checklist", "studentFinalChecklist", false)],
          },
          {
            label: "Ask",
            title: "Use blocker text",
            detail: "If downloads are blocked or failed, use the listed reason when asking staff for help.",
            actions: [v5SectionAction("Open My Project", "studentWork", false)],
          },
        ]
      : [
          {
            label: "Do first",
            title: isWork ? "Continue the current item" : "Start your next step",
            detail: isWork ? "Stay on the requirement named in the project area before opening other panels." : "Open My Project to see the next requirement, files, and submission state.",
            actions: [v5SectionAction("Open My Project", "studentWork", !isFeedback && !isFinal)],
          },
          {
            label: "If marked",
            title: "Check feedback",
            detail: "Use feedback only when a note asks for changes or explains what the teacher reviewed.",
            actions: [v5SectionAction("Open Feedback", "studentFeedback", isFeedback)],
          },
          {
            label: "After work",
            title: "Check final readiness",
            detail: "Use the final checklist after the required work and evidence have been handled.",
            actions: [v5SectionAction("Open Final Checklist", "studentFinalChecklist", isFinal)],
          },
        ];
  return {
    id: `student-${sectionId}`,
    kicker: "Student path",
    title,
    detail,
    primaryAction,
    primaryHint,
    pathLabel: "Student capstone path",
    steps: v2PathSteps("Find the next action", "Open one item", "Submit or revise"),
    startState: {
      job: isWork ? "student-current-work" : isFeedback ? "student-feedback" : isFinal ? "student-final-checklist" : isPresentation ? "student-presentation" : isArchive ? "student-final-files" : "student-next-step",
      action: startAction,
      reason: "My Project stays first, with staff language and older details out of the way.",
      now: startNow,
      empty: startEmpty,
      confirm: startConfirm,
    },
    flowBoard: {
      id: isWork ? "student-current-work-flow" : isFeedback ? "student-feedback-flow" : isFinal ? "student-final-checklist-flow" : isPresentation ? "student-presentation-flow" : isArchive ? "student-final-files-flow" : "student-next-step-flow",
      label: "Student next-step flow",
      title: flowTitle,
      detail: "The student path separates work, feedback, and final checks so the first screen does not feel like a staff tool.",
      lanes: flowLanes,
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Progress, rubrics, and older notes stay out of the way.</strong>
        <span>Open supporting details only when the next action needs them.</span>
      </section>
    `,
  };
}

function v2MentorScreenModel(sectionId = activeSection) {
  return {
    id: `mentor-${sectionId}`,
    kicker: "Mentor flow",
    title: sectionId === "mentor" ? "Work with one assigned student" : "Choose the student who needs you next",
    detail: "Start with the assigned-student list, then open one detail view and record one follow-up.",
    primaryAction: sectionId === "mentor" ? v2SupportButton("Open student detail") : v2SectionButton("Open assigned students", "mentor"),
    primaryHint: "Assigned students only",
    pathLabel: "Mentor support path",
    steps: v2PathSteps("Choose one student", "Review their latest work", "Record the next follow-up"),
    startState: {
      job: sectionId === "mentor" ? "mentor-student-detail" : "mentor-assigned-student-start",
      action: sectionId === "mentor" ? "Open one assigned student detail." : "Open assigned students.",
      reason: "Mentor work should feel like student support, not a broad dashboard scan.",
      now: "Pick one assigned student who needs help or a meeting follow-up.",
      empty: "Nothing needs your attention right now. Check presentation prep only if you have a planned meeting.",
      confirm: "Stop when the next follow-up is clear or recorded for that student.",
    },
    flowBoard: {
      id: sectionId === "mentor" ? "mentor-student-detail-flow" : "mentor-assigned-student-flow",
      label: "Mentor support flow",
      title: "Assigned-student focus",
      detail: "The mentor start path narrows the screen to one assigned student, one coaching question, and one follow-up.",
      lanes: [
        {
          label: "Choose",
          title: "Pick the assigned student",
          detail: "Start with the student who has a meeting, stalled work, or a recent teacher note.",
          actions: [v5SectionAction("Open assigned students", "mentor", sectionId !== "mentor")],
        },
        {
          label: "Support",
          title: "Review the latest work",
          detail: "Use the selected student detail before scanning every table row or report.",
          actions: [v5SupportAction("Open student detail", sectionId === "mentor")],
        },
        {
          label: "Preview",
          title: "Use safe student preview",
          detail: "Preview helps explain the student view while staying read-only and staff-only.",
          actions: [v5SupportAction("Open preview tools")],
        },
      ],
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Mentor view shows assigned students only.</strong>
        <span>Meeting history and notes stay behind the selected student detail.</span>
      </section>
    `,
  };
}

function v2TeacherScreenModel(sectionId = activeSection) {
  return {
    id: `teacher-${sectionId}`,
    kicker: "Teacher review",
    title: sectionId === "teacher" ? "Review one project submission" : "Pick the project that needs attention",
    detail: "Start with the next submitted project, read the work, then save a decision.",
    primaryAction: sectionId === "teacher" ? v2SupportButton("Open selected work") : v2SectionButton("Open review queue", "teacher"),
    primaryHint: "Review queue first",
    pathLabel: "Teacher decision path",
    steps: v2PathSteps("Pick the next review", "Read the student's work", "Approve or request revision"),
    startState: {
      job: sectionId === "teacher" ? "teacher-review-decision" : "teacher-review-start",
      action: sectionId === "teacher" ? "Open selected work." : "Open the review queue.",
      reason: "Review decisions come before summaries.",
      now: "Choose one submitted item and decide what the student needs next.",
      empty: "Nothing is waiting for review. Look for stuck students before opening reports.",
      confirm: "Stop when the student has an approval, a revision request, or a clear next step.",
    },
    flowBoard: {
      id: sectionId === "teacher" ? "teacher-review-decision-flow" : "teacher-review-flow",
      label: "Program Teacher review flow",
      title: "Review queue before reports",
      detail: "Keep the first move on student work that needs a decision.",
      lanes: [
        {
          label: "Open",
          title: "Open waiting work",
          detail: "Start with one submitted item instead of metrics or exports.",
          actions: [v5SectionAction("Open review queue", "teacher", sectionId !== "teacher")],
        },
        {
          label: "Decide",
          title: "Approve or request changes",
          detail: "Read the work, use the rubric, and choose the student-facing next step.",
          actions: [v5SupportAction("Open selected work", sectionId === "teacher")],
        },
        {
          label: "Check",
          title: "Use reports after the queue",
          detail: "Reports answer which students are stuck after review decisions are handled.",
          actions: [v5SectionAction("Open reports", "staffReports")],
        },
      ],
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Decision work stays centered on one submission.</strong>
        <span>Filters and history are supporting details, not the first screen.</span>
      </section>
    `,
  };
}

function v2ViewerScreenModel(sectionId = activeSection) {
  const isStudents = sectionId === "students";
  const isReports = sectionId === "staffReports" || sectionId === "readiness";
  return {
    id: `viewer-${sectionId}`,
    kicker: isReports ? "Read-only report" : "Read-only view",
    title: isReports ? "Answer one report question" : isStudents ? "Open one assigned student" : "Check one student or report",
    detail: isReports
      ? "Viewer reports stay read-only and scoped to assigned students."
      : "Use read-only views to review students and reports without showing edit controls.",
    primaryAction: isStudents ? v2SupportButton("Open student list") : isReports ? v2SupportButton("Open report") : v2SectionButton("Open students", "students"),
    primaryHint: isReports ? "Report-safe fields" : "No edit actions",
    pathLabel: isReports ? "Viewer report path" : "Viewer path",
    steps: isReports
      ? v2PathSteps("Pick one report question", "Review the scoped summary", "Share follow-up outside the app")
      : v2PathSteps("Choose a student or report", "Review current status", "Share follow-up outside the app"),
    startState: {
      job: isReports ? "viewer-read-only-report" : "viewer-read-only-review",
      action: isStudents ? "Open the student list." : isReports ? "Open one report question." : "Open assigned students.",
      reason: "Viewer screens show status and context without change controls.",
      now: isReports ? "Use the first report question that matches the concern." : "Review one assigned student or report.",
      empty: "Nothing has been added yet for this view.",
      confirm: "Stop when you know what to share with the Program Teacher or site team.",
    },
    flowBoard: {
      id: isReports ? "viewer-read-only-report-flow" : "viewer-read-only-flow",
      label: "Viewer review flow",
      title: isReports ? "Read-only report path" : "Read-only review path",
      detail: "Viewer work stays useful without exposing edit, setup, or admin controls.",
      lanes: [
        {
          label: "Open",
          title: isReports ? "Pick a report question" : "Choose one student",
          detail: isReports ? "Start with the scoped report question instead of returning to the student list first." : "Start with the assigned student list or the one report you were asked to review.",
          actions: [isReports ? v5SupportAction("Open report", true) : v5SectionAction("Open students", "students", !isStudents)],
        },
        {
          label: "Read",
          title: isReports ? "Review report-safe fields" : "Review current status",
          detail: isReports ? "Use summary rows and export boundaries without exposing setup or edit controls." : "Look for progress, deadlines, and feedback without changing the record.",
          actions: [isReports ? v5SectionAction("Open students if needed", "students") : v5SupportAction("Open read-only detail", isStudents)],
        },
        {
          label: "Share",
          title: "Follow up outside the app",
          detail: "Use what you learned to brief the teacher or site team through the approved channel.",
          actions: [v5SectionAction("Open reports", "staffReports")],
        },
      ],
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Read-only boundary stays visible.</strong>
        <span>Controls that change records remain unavailable for this role.</span>
      </section>
    `,
  };
}

function v2StaffScreenModel(sectionId = activeSection, primaryRole = "staff") {
  const isStudents = sectionId === "students";
  const isReports = sectionId === "staffReports" || sectionId === "readiness";
  const roleName = roleLabel(primaryRole);
  return {
    id: `staff-${sectionId}`,
    kicker: roleName,
    title: isStudents ? "Open one student record" : isReports ? "Check one report question" : "Start with the worklist",
    detail: "Start with one student group, one student record, or one report question before opening supporting details.",
    primaryAction: isStudents ? v2SupportButton("Open student list") : isReports ? v2SupportButton("Open report") : v2SectionButton("Open students", "students"),
    primaryHint: "One focused task",
    pathLabel: "Staff work path",
    steps: v2PathSteps("Choose the next item", "Open the focused screen", "Take the allowed action"),
    startState: {
      job: isStudents ? "staff-student-record" : isReports ? "staff-report-question" : "staff-worklist-start",
      action: isStudents ? "Open the student list." : isReports ? "Open one report." : "Open students.",
      reason: "Daily staff work should start with the visible student need, not setup tools.",
      now: isStudents ? "Pick one student record." : isReports ? "Answer one report question." : "Choose one student group that needs attention.",
      empty: "Nothing needs your attention right now. Leave setup and access work in Admin Console.",
      confirm: "Stop when the allowed action is done or the next staff follow-up is clear.",
    },
    flowBoard: {
      id: isStudents ? "staff-student-record-flow" : isReports ? "staff-report-question-flow" : "staff-worklist-flow",
      label: `${roleName} flow`,
      title: isReports ? "Reports start with one question" : isStudents ? "Open the right student first" : "Daily student support path",
      detail: "The workspace path keeps daily student support separate from setup and access administration.",
      lanes: [
        {
          label: "Start",
          title: isReports ? "Pick a report question" : "Choose the student group",
          detail: isReports ? "Use reports to answer one operational question at a time." : "Start from students who need review, feedback, or follow-up.",
          actions: [isReports ? v5SupportAction("Open report", true) : v5SectionAction("Open students", "students", !isStudents)],
        },
        {
          label: "Open",
          title: "Open one student record",
          detail: "Move into one student before scanning summaries or unrelated queues.",
          actions: [isStudents ? v5SupportAction("Open student list", true) : v5SectionAction("Open students", "students")],
        },
        {
          label: "Confirm",
          title: "Use reports only for a question",
          detail: "Open reports after you know what you are trying to confirm or fix.",
          actions: [v5SectionAction("Open reports", "staffReports", isReports)],
        },
      ],
    },
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Daily work stays separate from setup tools.</strong>
        <span>Use Tools only for school switching, search, or changing mode.</span>
      </section>
    `,
  };
}

function v5AdminFlowBoard(sectionId = activeSection, config = {}) {
  const isReports = sectionId === "adminReports";
  const isAudit = sectionId === "audit";
  const isImports = sectionId === "adminImports";
  const job = config.startState?.job || `admin-${sectionId || "task"}`;
  return {
    id: `${job}-flow`,
    label: isReports ? "Admin report flow" : isAudit ? "Audit review flow" : isImports ? "CSV preview flow" : "Guided setup flow",
    title: isReports ? "Reports answer one operations question" : isAudit ? "Audit starts with one trail" : isImports ? "Template, preview, confirmation" : "Issue, fix, confirmation",
    detail: isImports ? "Imports stay blocked until template, preview, and valid-row confirmation are visible." : "Admin Console stays focused on the selected setup job and keeps broader tools behind the active screen.",
    lanes: [
      {
        label: isImports ? "Template" : "Issue",
        title: isReports ? "Pick the question" : isAudit ? "Choose the trail" : isImports ? "Download the right template" : "Start with the blocker",
        detail: config.startState?.now || "Choose one admin item before opening forms or reports.",
        actions: [v5SupportAction(config.hint || "Open focused tools", true)],
      },
      {
        label: isImports ? "Preview" : "Fix",
        title: isImports ? "Preview before saving" : "Open the matching tools",
        detail: config.detail || "Use the one screen tied to the visible issue.",
        actions: [v5SupportAction(config.actionLabel || "Open tools")],
      },
      {
        label: "Confirm",
        title: isAudit ? "Document follow-up" : isImports ? "Confirm only valid rows" : "Check the result",
        detail: config.startState?.confirm || "Return here and confirm the visible result changed.",
        actions: [isReports ? v5SectionAction("Open setup", "overview") : v5SupportAction("Open confirmation")],
      },
    ],
  };
}

function v2AdminScreenModel(sectionId = activeSection, sections = []) {
  const configs = {
    overview: {
      title: "Fix the first setup blocker",
      detail: "Start with the next setup issue, then open the exact fix and confirm it cleared.",
      action: availableSectionIdsForAnyMode().has("adminAssignments") ? v2SectionButton("Open first fix", "adminAssignments") : v2SupportButton("Open setup tools"),
      hint: "Issue to fix to confirmation",
      steps: v2PathSteps("Find first blocker", "Open the matching fix", "Confirm it disappeared"),
      startState: {
        job: "admin-first-setup-blocker",
        action: "Open the first setup blocker.",
        reason: "Console pages should move from issue to fix to confirmation.",
        now: "Start with the first setup issue, not a broad operations scan.",
        empty: "No setup blocker is visible. Open reports or audit only for a real question.",
        confirm: "Return here and confirm the issue is gone or clearly still blocked.",
      },
    },
    adminPeople: {
      title: "Fix one staff account",
      detail: "Add or update one staff, mentor, viewer, teacher, or admin record for the selected school.",
      action: v2SupportButton("Open staff tools"),
      hint: "One account at a time",
      steps: v2PathSteps("Choose staff record", "Make the allowed change", "Confirm access"),
      startState: {
        job: "admin-staff-account",
        action: "Open one staff record.",
        reason: "People work is safer when one account is changed and checked.",
        now: "Choose the staff row with the clearest setup need.",
        empty: "No staff setup issue is visible. Use Add Staff only when a real person is missing.",
        confirm: "Stop when the role, school, and allowed actions match the intended staff job.",
      },
    },
    adminStudents: {
      title: "Fix one student record",
      detail: "Start with one roster issue, then confirm the student appears in the right school and program.",
      action: v2SupportButton("Open roster tools"),
      hint: "Student setup only",
      steps: v2PathSteps("Choose student", "Update roster details", "Confirm placement"),
      startState: {
        job: "admin-student-record",
        action: "Open one student record.",
        reason: "Roster changes should be narrow and easy to verify.",
        now: "Choose the student with the clearest roster, program, mentor, or viewer gap.",
        empty: "No roster issue is visible. Use import only when a real roster batch is ready.",
        confirm: "Stop when the student appears in the right school and program.",
      },
    },
    adminAssignments: {
      title: "Assign missing coverage",
      detail: "Handle mentor coverage first, then viewer access, then Program Teacher coverage.",
      action: v2SupportButton("Open assignment tools"),
      hint: "Coverage before broad grants",
      steps: v2PathSteps("Find the first coverage gap", "Use the matching assignment form", "Refresh and confirm"),
      startState: {
        job: "admin-coverage-assignment",
        action: "Open the first coverage gap.",
        reason: "Coverage work should grant only the relationship the student needs.",
        now: "Start with missing mentor, viewer, or Program Teacher coverage.",
        empty: "No coverage gap is visible. Do not add broad access just to fill the page.",
        confirm: "Stop when the assignment appears and the student remains in the correct school or program.",
      },
    },
    programs: {
      title: "Set up one school program",
      detail: "Add, remove, or confirm one program mapping before reviewing Program Teacher access.",
      action: v2SupportButton("Open program tools"),
      hint: "One program mapping",
      steps: v2PathSteps("Confirm school", "Choose one program", "Confirm teacher coverage"),
      startState: {
        job: "admin-program-mapping",
        action: "Open one program mapping.",
        reason: "Program setup should confirm school, program, and teacher coverage together.",
        now: "Choose the one program mapping that needs review.",
        empty: "No program issue is visible. Leave this screen without changing access.",
        confirm: "Stop when the program and Program Teacher coverage are visible together.",
      },
    },
    adminImports: {
      title: "Preview one CSV before saving",
      detail: "Download the right template, preview validation, fix rows, then confirm only valid records.",
      action: v2SupportButton("Open CSV checklist"),
      hint: "Preview before import",
      actionLabel: "Preview rows",
      steps: v2PathSteps("Choose template", "Preview rows", "Confirm valid records"),
      startState: {
        job: "admin-csv-preview",
        action: "Preview one CSV file.",
        reason: "Imports should show row problems before anything is saved.",
        now: "Choose the correct template, then preview rows.",
        empty: "No CSV is selected. Download a template before preparing a batch.",
        confirm: "Stop when valid rows are confirmed or problem rows are fixed outside the app.",
      },
    },
    adminReports: {
      title: "Answer one operations question",
      detail: "Reports are used after setup blockers are understood, not as the starting dashboard.",
      action: v2SupportButton("Open report"),
      hint: "Question first",
      steps: v2PathSteps("Pick the question", "Review the matching report", "Open the fix if needed"),
      startState: {
        job: "admin-report-question",
        action: "Open one report question.",
        reason: "Reports should answer a specific operations question.",
        now: "Pick the question before opening export or detail controls.",
        empty: "No report question is active. Return to setup before browsing summaries.",
        confirm: "Stop when you know which setup item, student list, or audit trail should open next.",
      },
    },
    audit: {
      title: "Review one change trail",
      detail: "Audit starts with a single change or actor, then expands only when more context is needed.",
      action: v2SupportButton("Open audit trail"),
      hint: "One trail at a time",
      steps: v2PathSteps("Choose change trail", "Review details", "Confirm no follow-up"),
      startState: {
        job: "admin-audit-trail",
        action: "Open one change trail.",
        reason: "Audit work should inspect one actor, change, or concern at a time.",
        now: "Choose the change trail tied to the current concern.",
        empty: "No audit concern is visible. Do not invent a follow-up.",
        confirm: "Stop when the follow-up is documented or no action is needed.",
      },
    },
  };
  const config = configs[sectionId] || {
    title: `Open ${sectionLabelForTopbar(sections, sectionId)}`,
    detail: "Use this setup item for one focused admin task.",
    action: v2SupportButton("Open tools"),
    hint: "Focused admin task",
    steps: v2PathSteps(),
    startState: {
      job: `admin-${sectionId || "focused-task"}`,
      action: "Open the focused tools.",
      reason: "Keep the admin task narrow before changing records.",
      now: "Choose one admin item.",
      empty: "Nothing needs your attention right now.",
      confirm: "Stop when the visible result matches the change you intended.",
    },
  };
  return {
    id: `admin-${sectionId}`,
    kicker: "Admin flow",
    title: config.title,
    detail: config.detail,
    primaryAction: config.action,
    primaryHint: config.hint,
    pathLabel: "Admin setup path",
    steps: config.steps,
    startState: config.startState,
    flowBoard: v5AdminFlowBoard(sectionId, config),
    focusHtml: `
      <section class="workspace-v2-focus-strip">
        <strong>Setup work moves issue, fix, confirmation.</strong>
        <span>Reports, forms, and full lists stay closed until this screen needs them.</span>
      </section>
    `,
  };
}

function sectionLabelForTopbar(sections = [], sectionId = activeSection) {
  const section = sections.find((item) => item.id === sectionId && !item.hidden);
  if (!section) return "Ready";
  return section.label || sectionShortLabel(section);
}

function renderWorkspaceTopbarContextControls(controls = [], options = {}) {
  const items = controls.filter(Boolean);
  if (!items.length) return "";
  return items.join("");
}

function renderWorkspaceModeSwitch(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (!capabilities.canSee) return "";
  const modes = [
    ["workspace", "Workspace"],
    ["admin", "Admin Console"],
  ];
  return `
    <nav class="workspace-mode-switch" aria-label="Protected app mode" data-workspace-mode-switch="true">
      ${modes.map(([mode, label]) => `
        <button class="workspace-mode-button ${activeWorkspaceMode === mode ? "is-active" : ""}" type="button" data-workspace-mode-target="${escapeHtml(mode)}" ${activeWorkspaceMode === mode ? 'aria-current="page"' : ""}>
          ${escapeHtml(label)}
        </button>
      `).join("")}
    </nav>
  `;
}

function renderWorkspaceNavigation(sections, options = {}) {
  sections = Array.isArray(sections) ? sections : [];
  const isAdminConsole = Boolean(options.isAdminConsole);
  const visibleSections = sections.filter((section) => !section.hidden);
  let lastGroup = "";
  return visibleSections.map((section) => {
    const group = workspaceNavGroupFor(section.id, { isAdminConsole });
    const groupLabel = group && group !== lastGroup
      ? `<p class="workspace-tab-group-label" data-workspace-nav-group="${escapeHtml(group)}">${escapeHtml(group)}</p>`
      : "";
    lastGroup = group || lastGroup;
    return `
      ${groupLabel}
      <button class="workspace-tab ${section.id === activeSection ? "is-active" : ""}" data-section="${escapeHtml(section.id)}" data-nav-group="${escapeHtml(group || "General")}" type="button" title="${escapeHtml(section.label)}" aria-label="${escapeHtml(`${section.label}: ${section.detail}`)}" ${section.id === activeSection ? 'aria-current="page"' : ""}>
        <span class="workspace-tab-short" aria-hidden="true">${escapeHtml(sectionShortLabel(section))}</span>
        <strong>${escapeHtml(section.label)}</strong>
        <span>${escapeHtml(section.detail)}</span>
      </button>
    `;
  }).join("");
}

function workspaceNavGroupFor(sectionId = "", options = {}) {
  const isAdminConsole = Boolean(options.isAdminConsole);
  if (STUDENT_NAV_SECTION_IDS.has(sectionId)) return "";
  if (["overview", "students", "teacher", "staffReports"].includes(sectionId) && !isAdminConsole) return "";
  if (["adminPeople", "adminStudents", "adminAssignments", "adminImports", "adminReports", "programs", "audit"].includes(sectionId) && isAdminConsole) return "";
  if (sectionId === "overview" || sectionId === "profile" || sectionId === "student") return "Daily Work";
  if (["siteDashboard", "adminDashboard", "programDashboard", "mentorDashboard", "readiness"].includes(sectionId)) {
    return isAdminConsole ? "Operations" : "Dashboards";
  }
  if (["students", "mentor"].includes(sectionId)) return "Students";
  if (["teacher", "mentorAssignments", "operations", "presentation", "archive", "archiveExports"].includes(sectionId)) return "Review / Work";
  if (["adminUsers", "programs"].includes(sectionId)) return "People & Access";
  if (["audit", "security"].includes(sectionId)) return "Settings / Security";
  return "General";
}

function renderActiveRoleBadge(primaryRole = primaryRoleForUser(currentUser), options = {}) {
  const identity = roleIdentityFor(primaryRole);
  const readOnly = Boolean(options.readOnly);
  return `
    <span class="workspace-active-role-badge" data-active-role-badge="true" data-role-identity="${escapeHtml(identity.key)}" data-role-read-only="${readOnly ? "true" : "false"}" aria-label="Active role: ${escapeHtml(identity.label)}${readOnly ? ", read-only" : ""}">
      <b>${escapeHtml(identity.label)}</b>
      <small>${escapeHtml(readOnly ? "Read-only" : "Role")}</small>
    </span>
  `;
}

function renderWorkspaceAccountMenu(areaName = workspaceAreaName()) {
  const displayName = currentUser?.displayName || "Signed in";
  const email = currentUser?.email || "";
  return `
    <details class="workspace-account-menu" data-account-menu="true">
      <summary class="workspace-account-summary" aria-label="${escapeHtml(`${displayName} account menu`)}">
        <span class="workspace-account-avatar" aria-hidden="true">${escapeHtml(accountInitials(displayName, email))}</span>
        <span class="workspace-user-text">
          <strong>${escapeHtml(displayName)}</strong>
          <span>${escapeHtml(email)}</span>
        </span>
        <span class="workspace-account-caret" aria-hidden="true"></span>
      </summary>
      <div class="workspace-topbar-actions" aria-label="${escapeHtml(areaName)} account actions">
        ${renderWorkspaceThemeButton("account")}
        <button class="workspace-button workspace-button-small" id="workspaceRefresh" type="button">Refresh</button>
        <button class="workspace-button workspace-button-secondary workspace-button-small" id="workspaceLogout" type="button">Sign out</button>
      </div>
    </details>
  `;
}

function initializeWorkspaceTheme() {
  if (typeof document === "undefined" || !document.documentElement?.dataset) return;
  let savedTheme = "";
  try {
    savedTheme = String(window.localStorage?.getItem(WORKSPACE_THEME_STORAGE_KEY) || "").trim().toLowerCase();
  } catch {
    savedTheme = "";
  }
  const systemTheme = typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  document.documentElement.dataset.theme = WORKSPACE_THEME_VALUES.has(savedTheme) ? savedTheme : systemTheme;
}

function currentWorkspaceTheme() {
  const theme = String(document?.documentElement?.dataset?.theme || "").trim().toLowerCase();
  return WORKSPACE_THEME_VALUES.has(theme) ? theme : "light";
}

function renderWorkspaceThemeButton(location = "workspace") {
  const nextTheme = currentWorkspaceTheme() === "dark" ? "light" : "dark";
  const nextLabel = nextTheme === "dark" ? "Dark view" : "Light view";
  const accessibleLabel = nextTheme === "dark" ? "Switch to dark view" : "Switch to light view";
  return `
    <button class="workspace-theme-toggle" type="button" data-workspace-theme-toggle="${escapeHtml(location)}" aria-label="${escapeHtml(accessibleLabel)}">
      <span aria-hidden="true">${nextTheme === "dark" ? "☾" : "☀"}</span>
      <strong>${escapeHtml(nextLabel)}</strong>
    </button>
  `;
}

function bindWorkspaceThemeButtons() {
  document.querySelectorAll("[data-workspace-theme-toggle]").forEach((button) => {
    button.addEventListener("click", toggleWorkspaceTheme);
  });
}

function toggleWorkspaceTheme() {
  if (typeof document === "undefined" || !document.documentElement?.dataset) return;
  const nextTheme = currentWorkspaceTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  try {
    window.localStorage?.setItem(WORKSPACE_THEME_STORAGE_KEY, nextTheme);
  } catch {
    // A blocked preference store should not block the view change.
  }
  if (currentUser) renderAppShell();
  else renderSignIn();
}

function applyWorkspaceSchoolTheme(siteContext = currentSiteWorkspaceContext()) {
  if (typeof document === "undefined" || !document.documentElement?.dataset) return;
  const sites = accessibleSitesForWorkspace();
  const studentProject = unwrap(currentData.dashboard)?.project || {};
  const selectedProject = (unwrap(currentData.projects)?.projects || []).find((project) => project.projectId === activeProjectId) || {};
  const siteId = cleanDirectoryFilter(selectedSiteId || siteContext?.siteId || studentProject.siteId || selectedProject.siteId || (sites.length === 1 ? sites[0]?.siteId : "") || "");
  const site = sites.find((row) => row.siteId === siteId) || {};
  const requestedTheme = String(siteContext?.brandTheme || site.brandTheme || studentProject.brandTheme || selectedProject.brandTheme || "default").trim();
  const schoolTheme = WORKSPACE_SCHOOL_THEME_VALUES.has(requestedTheme) ? requestedTheme : "default";
  document.documentElement.dataset.schoolTheme = schoolTheme;
}

function workspaceLocationHasRoute() {
  const url = currentWorkspaceUrl();
  if (!url) return false;
  return Boolean(url.searchParams.get("mode") || url.searchParams.get("section") || url.searchParams.get("view"));
}

function resetWorkspaceLandingState() {
  activeWorkspaceMode = "workspace";
  blockedWorkspaceMode = "";
  blockedWorkspaceSection = "";
  const workspaceSections = availableWorkspaceSections();
  const projectFirstSection = roleIds(currentUser).has("student")
    ? "student"
    : workspaceSections.some((section) => section.id === "projects")
      ? "projects"
      : firstVisibleSection(workspaceSections)?.id || "overview";
  workspaceModeLastSections.workspace = projectFirstSection;
  workspaceModeLastSections.admin = "overview";
  activeSection = projectFirstSection;
}

function resetAccountScopedWorkspaceState() {
  lastAdminPasswordResetResult = null;
  selectedSiteId = "";
  siteStudentFilters = defaultSiteStudentFilters();
  siteStudentDetailState = defaultSiteStudentDetailState();
  reviewQueueFilters = defaultReviewQueueFilters();
  reviewQueueState = defaultReviewQueueState();
  mentorAssignmentFilters = defaultMentorAssignmentFilters();
  operationsReadinessFilters = defaultOperationsReadinessFilters();
  projectDirectoryFilters = defaultProjectDirectoryFilters();
  projectDirectoryView = "table";
  activeProjectId = "";
  managedProjectId = "";
  workspaceDataLoading = false;
  knownAccessibleSites = [];
}

function accountInitials(displayName = "", email = "") {
  const source = String(displayName || email || "A").trim();
  const words = source.split(/[\s._@-]+/).filter(Boolean);
  const letters = words.length > 1
    ? `${words[0][0] || ""}${words[1][0] || ""}`
    : source.slice(0, 2);
  return letters.toUpperCase() || "A";
}

function renderWorkspaceRailAccessSummary({ isAdminConsole = false, primaryRole = primaryRoleForUser(currentUser), consoleCapabilities = adminConsoleCapabilitiesFor(currentUser) } = {}) {
  if (isAdminConsole) {
    const identity = roleIdentityFor(primaryRole);
    return `
      <section class="workspace-rail-card workspace-rail-access-summary workspace-rail-access-compact" data-rail-access-summary="compact">
        <p class="workspace-kicker">Access</p>
        <div class="workspace-role-banner">
          <strong>${escapeHtml(identity.label)}</strong>
          <span>${escapeHtml(adminConsoleCompactScopeLabel(consoleCapabilities))}</span>
        </div>
        <small>${escapeHtml(adminConsoleRailNote(consoleCapabilities))}</small>
      </section>
    `;
  }
  return `
    <section class="workspace-rail-card workspace-rail-access-summary" data-rail-access-summary="full">
      <p class="workspace-kicker">Your access</p>
      <div class="workspace-role-banner">
        <strong>${escapeHtml(roleLabel(primaryRole))}</strong>
        <span>${escapeHtml(roleScopeSummary(currentUser))}</span>
      </div>
      <small>${escapeHtml(workspaceRailAccessNote(primaryRole, roleIds(currentUser)))}</small>
    </section>
  `;
}

function workspaceRailAccessNote(primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  if (primaryRole === "student" || roles.has("student")) return "Only your own project work and feedback are visible here.";
  if (roles.has("viewer")) return "Assigned students only. Change controls stay hidden.";
  if (roles.has("mentor")) return "Start with assigned students, meetings, and presentation prep.";
  if (roles.has("program_teacher")) return "Review work and student support stay inside your assigned program.";
  if (roles.has("administration")) return "School monitoring only. Elevated account and security work stays limited.";
  if (roles.has("site_admin")) return "Site tools stay tied to the selected or assigned school.";
  if (hasGlobalAdminRole(roles)) return "Platform tools live in Admin Console; daily Workspace stays calm.";
  if (roles.has("misc_admin")) return "Aggregate readiness only; student-level operations stay hidden.";
  return "Ask a coordinator to confirm this account's workspace role.";
}

function roleIdentityFor(roleId) {
  const normalized = roleId === "admin" || roleId === "platform_admin" ? "global_admin" : String(roleId || "role_pending");
  const labels = {
    student: "Student",
    viewer: "Viewer",
    mentor: "Mentor",
    program_teacher: "Program Teacher",
    administration: "School Admin",
    site_admin: "Site Admin",
    global_admin: "Global Admin",
    misc_admin: "Reporting Admin",
    role_pending: "Role pending",
  };
  return {
    key: labels[normalized] ? normalized : "role_pending",
    label: labels[normalized] || "Role pending",
  };
}

function renderWorkspaceRoleCommandStrip(options = {}) {
  const primaryRole = options.primaryRole || primaryRoleForUser(currentUser);
  const roles = options.roles || roleIds(currentUser);
  const isAdminConsole = Boolean(options.isAdminConsole);
  const viewingAsStudent = Boolean(options.viewingAsStudent);
  const consoleCapabilities = options.consoleCapabilities || adminConsoleCapabilitiesFor(currentUser);
  const identity = roleIdentityFor(primaryRole);
  const mode = viewingAsStudent ? "student-preview" : isAdminConsole ? "admin" : "workspace";
  const modeLabel = viewingAsStudent ? "Student preview" : isAdminConsole ? "Admin Console" : "Workspace";
  const readOnly = viewingAsStudent || roles.has("viewer") || Boolean(isAdminConsole && consoleCapabilities.readOnly);
  const scopeText = viewingAsStudent
    ? `Previewing ${viewAsStudentDisplayName()}`
    : isAdminConsole ? adminConsoleCompactScopeLabel(consoleCapabilities) : roleScopeSummary(currentUser);
  const next = roleCommandNextAction(primaryRole, roles, isAdminConsole, viewingAsStudent, consoleCapabilities);
  const confidenceItems = roleCommandConfidenceItems(primaryRole, roles, isAdminConsole, viewingAsStudent, consoleCapabilities);
  const items = [
    {
      id: "identity",
      label: "Account",
      value: currentUser.displayName || currentUser.email || "Signed in",
      detail: currentUser.email || roleLabel(primaryRole),
    },
    {
      id: "mode",
      label: "Area",
      value: `${identity.label} / ${modeLabel}`,
      detail: scopeText,
    },
    {
      id: "next",
      label: "Do next",
      value: next.title,
      detail: next.detail,
      action: next,
    },
    {
      id: "safety",
      label: "Safety",
      value: readOnly ? "Read-only access" : "Allowed actions",
      detail: roleCommandSafetyText(primaryRole, roles, isAdminConsole, viewingAsStudent, consoleCapabilities),
    },
  ];
  if (isAdminConsole) {
    return renderCompactAccessSummary({
      identity,
      mode,
      readOnly,
      scopeText,
      next,
      items,
      confidenceItems,
    });
  }
  return `
    <section class="workspace-role-command-strip" data-role-command-strip="true" data-role-command-role="${escapeHtml(identity.key)}" data-role-command-mode="${escapeHtml(mode)}" data-role-command-read-only="${readOnly ? "true" : "false"}" aria-labelledby="roleCommandStripTitle">
      <div class="workspace-role-command-intro">
        <p class="workspace-kicker">Context</p>
        <h2 id="roleCommandStripTitle">${escapeHtml(identity.label)} ${viewingAsStudent ? "student preview" : isAdminConsole ? "admin console" : "workspace"}</h2>
        <p>${escapeHtml(roleCommandSummary(primaryRole, roles, isAdminConsole, viewingAsStudent, consoleCapabilities))}</p>
      </div>
      <div class="workspace-role-command-grid">
        ${items.map((item) => renderRoleCommandItem(item)).join("")}
      </div>
      ${renderRoleActionTrail(primaryRole, roles, isAdminConsole, viewingAsStudent, consoleCapabilities)}
      <div class="workspace-role-confidence-row" data-role-confidence-strip="true" aria-label="Access summary">
        ${confidenceItems.map((item) => renderRoleConfidenceItem(item)).join("")}
      </div>
    </section>
  `;
}

function renderCompactAccessSummary({ identity, mode, readOnly = false, scopeText = "", next = {}, items = [], confidenceItems = [] } = {}) {
  const label = identity?.label || "Role";
  const key = identity?.key || "role_pending";
  return `
    <details class="workspace-role-command-strip workspace-access-summary" data-role-command-strip="true" data-access-summary="compact" data-role-command-role="${escapeHtml(key)}" data-role-command-mode="${escapeHtml(mode || "admin")}" data-role-command-read-only="${readOnly ? "true" : "false"}" aria-labelledby="accessSummaryTitle">
      <summary class="workspace-access-summary-head">
        <span class="workspace-kicker">Access summary</span>
        <strong id="accessSummaryTitle">${escapeHtml(label)}</strong>
        <small>${escapeHtml(scopeText || "Limited role access")}</small>
        <b>${escapeHtml(next?.title || "Open the needed source screen")}</b>
      </summary>
      <div class="workspace-access-summary-body">
        <div class="workspace-role-command-grid">
          ${items.map((item) => renderRoleCommandItem(item)).join("")}
        </div>
        ${renderRoleActionTrail(key, roleIds(currentUser), mode === "admin", isViewAsStudentActive(), adminConsoleCapabilitiesFor(currentUser))}
        <div class="workspace-role-confidence-row" data-role-confidence-strip="true" aria-label="Access summary">
          ${confidenceItems.map((item) => renderRoleConfidenceItem(item)).join("")}
        </div>
      </div>
    </details>
  `;
}

function renderRoleCommandItem(item = {}) {
  return `
    <article class="workspace-role-command-item" data-role-command-item="${escapeHtml(item.id || "item")}">
      <span>${escapeHtml(item.label || "Context")}</span>
      <strong>${escapeHtml(item.value || "")}</strong>
      <p>${escapeHtml(item.detail || "")}</p>
      ${item.id === "next" ? renderRoleCommandActionButton(item.action) : ""}
    </article>
  `;
}

function renderRoleCommandActionButton(action = {}) {
  if (!action || !action.label) return "";
  if (action.viewAsAction) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-view-as-student-action="${escapeHtml(action.viewAsAction)}" data-role-command-primary-action="true" data-role-action-exit-preview="true">
        ${escapeHtml(action.label)}
      </button>
    `;
  }
  if (action.mode) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-workspace-mode-target="${escapeHtml(action.mode)}" data-role-command-primary-action="true">
        ${escapeHtml(action.label)}
      </button>
    `;
  }
  if (action.section) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(action.section)}" ${action.preset ? `data-section-preset="${escapeHtml(action.preset)}"` : ""} data-role-command-primary-action="true">
        ${escapeHtml(action.label)}
      </button>
    `;
  }
  return "";
}

function renderRoleActionTrail(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const allowedSections = availableSectionIdsForAnyMode();
  const items = roleCommandTrailItems(primaryRole, roles, isAdminConsole, viewingAsStudent, capabilities)
    .filter((item) => !item.section || allowedSections.has(item.section) || item.section === "overview")
    .filter((item) => !item.mode || (item.mode === "admin" ? capabilities.canSee : true))
    .slice(0, 4);
  if (!items.length) return "";
  return `
    <section class="workspace-role-action-trail" data-role-action-trail="true" aria-label="Role action path">
      <div class="workspace-role-action-trail-head">
        <strong>${escapeHtml(isAdminConsole ? "Console path" : viewingAsStudent ? "Preview path" : "Daily path")}</strong>
        <span>${escapeHtml(isAdminConsole ? "Open the source screen before changing records." : "Start with one clear move, then confirm the result.")}</span>
      </div>
      <ol class="workspace-role-action-trail-list">
        ${items.map((item, index) => renderRoleActionTrailItem(item, index)).join("")}
      </ol>
    </section>
  `;
}

function renderRoleActionTrailItem(item = {}, index = 0) {
  const step = item.step || String(index + 1);
  const action = item.actionLabel
    ? renderRoleCommandActionButton({
        label: item.actionLabel,
        section: item.section,
        mode: item.mode,
        preset: item.preset,
        viewAsAction: item.viewAsAction,
      })
    : "";
  return `
    <li class="workspace-role-action-trail-item ${escapeHtml(item.tone || "quiet")}" data-role-action-step="${escapeHtml(step)}">
      <span>${escapeHtml(step)}</span>
      <div>
        <strong>${escapeHtml(item.title || "Open the next screen")}</strong>
        <p>${escapeHtml(item.detail || "")}</p>
        ${action}
      </div>
    </li>
  `;
}

function roleCommandTrailItems(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const studentSection = consoleStudentSectionId(capabilities) || "students";
  if (viewingAsStudent) {
    return [
      { step: "1", title: "Confirm the banner", detail: "Make sure Viewing as names the authorized student and this preview stays read-only.", section: "student", actionLabel: "Open student view", tone: "student" },
      { step: "2", title: "Read the next step", detail: "Use the student's Do this next card for context only.", section: "student", actionLabel: "Check My Work", tone: "ready" },
      { step: "3", title: "Return to staff work", detail: "Exit before switching personas, opening staff tools, or changing records.", viewAsAction: "exit", actionLabel: "Exit student view", tone: "warning" },
    ];
  }
  if (isAdminConsole) {
    const items = [
      { step: "1", title: "Confirm access", detail: "Confirm the current role, school, and visible records before using a console section.", section: "overview", actionLabel: "Open overview", tone: "ready" },
    ];
    if (capabilities.sectionIds.has("adminUsers")) {
      items.push({ step: "2", title: "Fix people or access", detail: "Use People & Access for Add Student, Add Staff, CSV preview, and limited assignments.", section: "adminUsers", actionLabel: "Open access", tone: "student" });
    }
    if (studentSection) {
      items.push({ step: "3", title: "Open student work", detail: "Use the student list or review queue before acting on one record.", section: capabilities.sectionIds.has("teacher") ? "teacher" : studentSection, preset: capabilities.sectionIds.has("teacher") ? "submitted" : "", actionLabel: capabilities.sectionIds.has("teacher") ? "Open review" : "Open students", tone: "teacher" });
    }
    if (capabilities.sectionIds.has("audit") || capabilities.sectionIds.has("security")) {
      items.push({ step: "4", title: "Check safety last", detail: "Use Audit or Security only when the question needs elevated context.", section: capabilities.sectionIds.has("audit") ? "audit" : "security", actionLabel: capabilities.sectionIds.has("audit") ? "Open audit" : "Open security", tone: "quiet" });
    }
    return items;
  }
  if (primaryRole === "student" || roles.has("student")) {
    return [
      { step: "1", title: "Read Do this next", detail: "Start with the top card before opening every panel.", section: "student", actionLabel: "Open My Work", tone: "student" },
      { step: "2", title: "Open the named item", detail: "Use the current checklist, file, feedback, or Turned in item.", section: "student", actionLabel: "Open item", tone: "ready" },
      { step: "3", title: "Wait for teacher check", detail: "Wait when your teacher owns the next decision.", section: "student", actionLabel: "Check review", tone: "teacher" },
    ];
  }
  if (roles.has("viewer")) {
    return [
      { step: "1", title: "Open assigned students", detail: "Start from records this account is assigned to monitor.", section: "students", actionLabel: "Open students", tone: "student" },
      { step: "2", title: "Read detail only", detail: "Use detail and history for context without changing records.", section: "students", actionLabel: "View details", tone: "ready" },
      { step: "3", title: "Share with staff", detail: "Send concerns to the Program Teacher or site team outside this read-only role.", tone: "quiet" },
    ];
  }
  if (roles.has("mentor")) {
    return [
      { step: "1", title: "Open assigned students", detail: "Start with students already assigned to this mentor.", section: "mentorDashboard", actionLabel: "Open dashboard", tone: "mentor" },
      { step: "2", title: "Check meeting needs", detail: "Open one assigned student before planning or recording support.", section: "mentor", actionLabel: "Open assigned", tone: "student" },
      { step: "3", title: "Watch presentation prep", detail: "Use presentation signals for students you support.", section: "presentation", actionLabel: "Open presentation", tone: "teacher" },
    ];
  }
  if (roles.has("program_teacher")) {
    return [
      { step: "1", title: "Review work students sent in", detail: "Open waiting work or work that needs changes before browsing lower-priority summaries.", section: "teacher", preset: "submitted", actionLabel: "Open review", tone: "teacher" },
      { step: "2", title: "Find stuck students", detail: "Use Program Dashboard to locate proof, mentor, changes, or readiness blockers.", section: "programDashboard", actionLabel: "Open program", tone: "warning" },
      { step: "3", title: "Fix roster gaps only when needed", detail: "Use Admin Console People & Access when the student or mentor roster is wrong.", mode: "admin", actionLabel: "Open console", tone: "quiet" },
    ];
  }
  if (roles.has("administration") || roles.has("site_admin") || hasGlobalAdminRole(roles)) {
    const globalAdmin = hasGlobalAdminRole(roles);
    return [
      { step: "1", title: globalAdmin ? "Check platform status" : "Check school status", detail: "Start with the dashboard before opening setup tools.", section: globalAdmin ? "" : "siteDashboard", mode: globalAdmin ? "admin" : "", actionLabel: globalAdmin ? "Open console" : "Open dashboard", tone: "ready" },
      { step: "2", title: "Open the source list", detail: "Use Students, Review, or Operations for the exact records that need follow-up.", section: "students", actionLabel: "Open students", tone: "student" },
      { step: "3", title: "Move setup to Admin Console", detail: "Keep people, access, program, audit, and security work in the protected console.", mode: "admin", actionLabel: "Open console", tone: "quiet" },
    ];
  }
  return [
    { step: "1", title: "Review your profile", detail: "Confirm what this account can see before asking for access changes.", section: "profile", actionLabel: "Open profile", tone: "quiet" },
  ];
}

function renderRoleConfidenceItem(item = {}) {
  return `
    <article class="workspace-role-confidence-item" data-role-confidence-item="${escapeHtml(item.id || "confidence")}">
      <span>${escapeHtml(item.label || "Confidence")}</span>
      <strong>${escapeHtml(item.value || "")}</strong>
      <p>${escapeHtml(item.detail || "")}</p>
    </article>
  `;
}

function roleCommandSummary(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) return "You are looking at an authorized student workspace for context only. Exit returns to the staff worklist.";
  if (isAdminConsole && capabilities.readOnly) return "Admin Console is open for read-only monitoring. Edit, review, assignment, and setup controls stay hidden.";
  if (isAdminConsole) return "Admin Console is open for protected staff work. Normal Workspace stays focused on day-to-day student support.";
  if (primaryRole === "student" || roles.has("student")) return "Student Workspace shows your own next step, phase goal, proof, feedback, presentation, and final files.";
  if (roles.has("viewer")) return "Viewer Workspace shows assigned student context without change controls.";
  return "Workspace keeps the first staff move clear while management tools stay in Admin Console.";
}

function roleCommandNextAction(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) {
    return {
      title: "Check the student next step",
      detail: "Use this view for context only, then exit back to the staff workflow.",
      section: "student",
      label: "Open student view",
    };
  }
  if (isAdminConsole) {
    const studentSection = consoleStudentSectionId(capabilities);
    if (capabilities.readOnly) {
      return {
        title: "Monitor assigned students",
        detail: "Open the student list; edit controls stay hidden.",
        section: studentSection || "overview",
        label: studentSection ? "Open students" : "Open overview",
      };
    }
    if (capabilities.sectionIds.has("adminUsers")) {
      return {
        title: "Open People and Access",
        detail: "Add Staff, Add Student, CSV Import, and assignments live here when the role allows them.",
        section: "adminUsers",
        label: "Open access",
      };
    }
    if (capabilities.sectionIds.has("programs")) {
      return {
        title: "Open Programs",
        detail: "Add, remove, or restore programs only inside the selected school.",
        section: "programs",
        label: "Open programs",
      };
    }
    return {
      title: "Open assigned students",
      detail: "Use the visible console sections for records this role can access.",
      section: studentSection || "overview",
      label: studentSection ? "Open students" : "Open overview",
    };
  }
  if (primaryRole === "student" || roles.has("student")) {
    return {
      title: "Open My Work",
      detail: "Start with Do this next, then check the current phase goal.",
      section: "student",
      label: "Open My Work",
    };
  }
  if (roles.has("program_teacher")) {
    return {
      title: "Review work students sent in",
      detail: "Open Review Work first when students are waiting on feedback.",
      section: "teacher",
      preset: "submitted",
      label: "Open Review Work",
    };
  }
  if (roles.has("mentor")) {
    return {
      title: "Open assigned students",
      detail: "Start with assigned-student risks before meetings or presentation prep.",
      section: "mentorDashboard",
      label: "Open Mentor Dashboard",
    };
  }
  if (roles.has("viewer")) {
    return {
      title: "Open assigned students",
      detail: "Read assigned student context without changing records.",
      section: "students",
      label: "Open students",
    };
  }
  if (hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration")) {
    return {
      title: "Use Admin Console for setup",
      detail: "Keep user, access, program, and elevated tools out of the regular Workspace.",
      mode: "admin",
      label: "Open Admin Console",
    };
  }
  return {
    title: "Open your role profile",
    detail: "Use the profile guide to confirm what this account can see and do.",
    section: "profile",
    label: "Open profile",
  };
}

function roleCommandSafetyText(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) return "Preview cannot submit, upload, review, assign, import, or change account records.";
  if (roles.has("viewer")) return "Viewer remains read-only; edit and decision controls stay hidden.";
  if (primaryRole === "student" || roles.has("student")) return "Students see only their own workspace and never see staff preview or staff management tools.";
  if (isAdminConsole && hasGlobalAdminRole(roles)) return "Global Admin is local-account-only; audit and security tools stay separated from student work.";
  if (isAdminConsole && capabilities.readOnly) return "This console is monitoring-only for the records assigned to the account.";
  if (isAdminConsole) return "Changes stay limited to the visible console section, selected school or program, and current role.";
  return "Student records, proof, and staff actions stay limited to the signed-in account's authorized records.";
}

function roleCommandConfidenceItems(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  return [
    {
      id: "demo",
      label: "Account type",
      value: isTrainingAccount(currentUser) ? "Training account" : "School account",
      detail: isTrainingAccount(currentUser)
        ? "Use training records for walkthroughs and keep real student data out of practice flows."
        : "Use this account only for records this school has assigned to you.",
    },
    {
      id: "scope",
      label: "What you can see",
      value: roleCommandScopeTitle(primaryRole, roles, isAdminConsole, viewingAsStudent, capabilities),
      detail: roleCommandScopeDetail(primaryRole, roles, isAdminConsole, viewingAsStudent, capabilities),
    },
    {
      id: "boundary",
      label: "Cannot do here",
      value: roleCommandBoundaryTitle(primaryRole, roles, isAdminConsole, viewingAsStudent, capabilities),
      detail: roleCommandBoundaryText(primaryRole, roles, isAdminConsole, viewingAsStudent, capabilities),
    },
  ];
}

function isTrainingAccount(user = currentUser) {
  const email = String(user?.email || "").trim().toLowerCase();
  const id = String(user?.id || "").trim().toLowerCase();
  return email.endsWith(".test") || email.includes(".capstone.test") || id.startsWith("demo-");
}

function roleCommandScopeTitle(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) return "Authorized student";
  if (isAdminConsole) return capabilities.scope.label || "Allowed records";
  if (primaryRole === "student" || roles.has("student")) return "Own project only";
  if (roles.has("viewer")) return "Assigned records";
  if (roles.has("mentor")) return "Assigned students";
  if (roles.has("program_teacher")) return "Assigned program";
  if (roles.has("administration")) return "Assigned school";
  if (roles.has("site_admin")) return "Assigned site";
  if (hasGlobalAdminRole(roles)) return "Platform access";
  if (roles.has("misc_admin")) return "Aggregate only";
  return "Role pending";
}

function roleCommandScopeDetail(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) return `Previewing ${viewAsStudentDisplayName()} from an authorized staff route.`;
  if (isAdminConsole) return capabilities.scope.detail || "Only records allowed by this role are visible.";
  if (primaryRole === "student" || roles.has("student")) return "No other student records, staff lists, preview controls, or management tools are visible.";
  if (roles.has("viewer")) return "Viewer sees assigned student context and read-only history only.";
  if (roles.has("mentor")) return "Mentor routes stay limited to active assigned students and presentation context.";
  if (roles.has("program_teacher")) return "Program Teacher routes focus on assigned program students, review, and blockers.";
  if (roles.has("administration")) return "School Admin routes stay tied to the assigned school and visible students.";
  if (roles.has("site_admin")) return "Site Admin routes stay tied to the selected or assigned school.";
  if (hasGlobalAdminRole(roles)) return "Global routes stay in Admin Console when setup, audit, or access work is elevated.";
  if (roles.has("misc_admin")) return "Reporting routes show summary readiness without individual student records.";
  return "Ask a coordinator or site administrator to assign the correct role.";
}

function roleCommandBoundaryTitle(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) return "Preview cannot save";
  if (roles.has("viewer")) return "Read-only role";
  if (primaryRole === "student" || roles.has("student")) return "No staff tools";
  if (isAdminConsole && capabilities.readOnly) return "Monitor only";
  if (isAdminConsole && hasGlobalAdminRole(roles)) return "Separated security";
  if (isAdminConsole) return "Limited edits";
  return "No hidden elevation";
}

function roleCommandBoundaryText(primaryRole, roles = roleIds(currentUser), isAdminConsole = false, viewingAsStudent = false, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (viewingAsStudent) return "No proof, submission, password, review, import, account, or assignment changes can be saved from View as Student.";
  if (roles.has("viewer")) return "Approve, import, assignment, schedule, review, and account controls stay hidden.";
  if (primaryRole === "student" || roles.has("student")) return "Students cannot open staff dashboards, staff preview tools, management consoles, or other student records.";
  if (isAdminConsole && capabilities.readOnly) return "Console rows are for monitoring only; edit controls stay hidden.";
  if (isAdminConsole && hasGlobalAdminRole(roles)) return "Local Global Admin security remains separated from school SSO and student workspace activity.";
  if (isAdminConsole) return "Writable controls stay limited to the selected school or program and this role's allowed section.";
  return "Workspace support actions stay limited to assigned students, school, program, or account settings.";
}

function switchWorkspaceMode(button) {
  const nextMode = cleanWorkspaceMode(button?.dataset?.workspaceModeTarget || "");
  if (!nextMode || nextMode === activeWorkspaceMode) return;
  const capabilities = adminConsoleCapabilitiesFor(currentUser);
  rememberCurrentModeSection();
  if (nextMode === "admin" && !capabilities.canSee) {
    blockedWorkspaceMode = "admin";
    activeWorkspaceMode = "workspace";
    activeSection = defaultSectionForMode("workspace");
    syncCurrentWorkspaceUrlState({ replace: true });
    renderAppShell("Admin Console is not available for this account.", "error");
    return;
  }
  blockedWorkspaceMode = "";
  activeWorkspaceMode = nextMode;
  activeSection = defaultSectionForMode(nextMode);
  syncCurrentWorkspaceUrlState();
  renderAppShell(nextMode === "admin" ? "Admin Console opened." : "Workspace opened.", "success");
}

function renderAdminConsoleActiveSection() {
  const capabilities = adminConsoleCapabilitiesFor(currentUser);
  if (!capabilities.canSee) return renderAdminConsoleUnavailableNotice();
  if (activeSection === "overview") return renderAdminConsoleOverviewSection(capabilities);
  if (activeSection === "students") return renderSiteStudentDirectorySection();
  if (!availableSectionIds("admin").has(activeSection)) {
    return renderPermissionDeniedSection("Admin Console", "a console section available to this role");
  }
  if (activeSection === "adminPeople") return renderAdminUsersSectionForView("manage-staff");
  if (activeSection === "adminStudents") return renderAdminUsersSectionForView("manage-students");
  if (activeSection === "adminAssignments") return renderAdminUsersSectionForView("assignments");
  if (activeSection === "adminImports") return renderAdminUsersSectionForView("import-students");
  if (activeSection === "adminReports") return renderAdminReportsSection();
  return renderActiveSection();
}

function renderAdminConsoleHeader(capabilities = adminConsoleCapabilitiesFor(currentUser), sections = availableSections({ mode: "admin" })) {
  const active = sections.find((section) => section.id === activeSection) || sections[0] || {};
  const title = active.label || "Overview";
  const detail = active.detail || adminConsoleSubtitle(capabilities);
  return `
    <section class="workspace-admin-console-header" aria-labelledby="adminConsoleTitle" data-admin-console-header="true" data-admin-console-shell-header="compact" data-admin-console-active-section="${escapeHtml(active.id || "")}">
      <div>
        <p class="workspace-kicker">Admin Console</p>
        <h1 id="adminConsoleTitle">${escapeHtml(title)}</h1>
        <p>${escapeHtml(detail)}</p>
      </div>
    </section>
  `;
}

function adminConsoleSubtitle(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (capabilities.readOnly) {
    return "Monitor assigned student records without edit, review, assignment, program, import, or account actions.";
  }
  return "Set up people, assignments, imports, programs, reports, and access review inside this account's allowed area.";
}

function adminConsoleHeaderContext(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  return [
    capabilities.scope.detail,
    capabilities.readOnly ? "Read-only" : "Limited actions",
  ].filter(Boolean);
}

function adminConsoleRailNote(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (capabilities.readOnly) return "Read-only monitoring. Edit controls stay hidden.";
  if (capabilities.scope.key === "global") return "Global view. Use site selection when a section needs a school.";
  if (capabilities.scope.key === "site") return "School tools for the assigned school.";
  if (capabilities.scope.key === "program") return "Program monitoring and review.";
  if (capabilities.scope.key === "assigned_students") return "Assigned-student monitoring only.";
  return "Limited console tools.";
}

function adminConsoleCompactScopeLabel(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (capabilities?.scope?.key === "global") return "Entire platform";
  return capabilities?.scope?.label || "Allowed records";
}

function renderAdminConsoleUnavailableNotice() {
  return `
    <section class="workspace-card workspace-error-card" data-admin-console-unavailable="true" data-workspace-state="permission-denied">
      <p class="workspace-kicker">Admin Console</p>
      <h2>Admin Console is not available for this account</h2>
      <p>Students use My Capstone only. Staff console sections appear only for accounts assigned to monitor or manage school work.</p>
      ${renderProblemState({
        reason: "This account is not assigned to monitor or manage school work.",
        owner: "Project coordinator or site administrator.",
        nextAction: "Use My Capstone or ask a school coordinator to check your account.",
      })}
    </section>
  `;
}

function renderWorkspaceSectionUnavailableNotice(sectionId = "") {
  const title = workspaceSectionTitle(sectionId);
  const details = {
    teacher: "work students sent in",
    operations: "site presentation, final-file, and readiness worklists",
    mentorAssignments: "assigned site mentor coverage records",
    students: "student directory records",
    siteDashboard: "assigned site dashboard records",
    programs: "site program management records",
    adminUsers: "account and access management records",
    audit: "protected audit records",
    archiveExports: "final-file export records",
  };
  return renderPermissionDeniedSection(title, details[sectionId] || `${title.toLowerCase()} records`);
}

function workspaceSectionTitle(sectionId = "") {
  const labels = {
    overview: "Overview",
    profile: "Profile",
    siteDashboard: "Site Dashboard",
    programs: "Programs",
    students: "Students",
    student: "My Project",
    studentWork: "My Project",
    studentFeedback: "Feedback",
    studentFinalChecklist: "Final Checklist",
    archive: "Final Files",
    mentorDashboard: "Mentor Dashboard",
    mentor: "Mentor students",
    programDashboard: "Program dashboard",
    teacher: "Review Work",
    mentorAssignments: "Mentor assignments",
    operations: "Operations readiness",
    presentation: "Presentation schedule",
    staffReports: "Reports",
    adminDashboard: "Admin command center",
    readiness: "Readiness report",
    adminUsers: "Users & Access",
    adminPeople: "People",
    adminStudents: "Students",
    adminAssignments: "Assignments",
    adminImports: "Imports",
    adminReports: "Reports",
    audit: "Audit",
    archiveExports: "Final files",
    security: hasGlobalAdminRole(roleIds(currentUser)) ? "Security" : "Account",
  };
  return labels[sectionId] || "Workspace section";
}

function renderAdminConsoleOverviewSection(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const model = adminConsoleOperationsModel(capabilities);
  const programTeacherView = capabilities.scope?.key === "program";
  return `
    <section class="workspace-admin-console-overview" data-admin-console-overview="true" data-admin-console-read-only="${escapeHtml(String(capabilities.readOnly))}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Admin Console</p>
          <h2>Admin Overview</h2>
          <p class="workspace-muted">${escapeHtml(programTeacherView
            ? "Check students, project adults, and mentor coverage for your program."
            : "What setup, people, assignments, imports, programs, reports, or access issues need attention?")}</p>
        </div>
        ${capabilities.readOnly ? `<span class="workspace-read-only-chip">Read-only</span>` : `<span class="workspace-site-context-badge">${escapeHtml(capabilities.scope.label)}</span>`}
      </div>
      <div class="workspace-admin-console-overview-layout">
        ${renderAdminSetupFirstPanel(model, capabilities)}
        ${renderAdminSetupIssues(model.setupIssues)}
        ${renderAdminSetupReadinessPanel(model.setupReadiness)}
        ${renderAdminHealthSummary(model.health)}
        ${renderAdminQuickActions(model.quickActions)}
        ${renderAdminRecentActivity(model.recentActivity)}
      </div>
    </section>
  `;
}

function renderAdminSetupFirstPanel(model = {}, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const setupIssues = Array.isArray(model.setupIssues) ? model.setupIssues : [];
  const readinessRows = Array.isArray(model.setupReadiness) ? model.setupReadiness : [];
  const nextIssue = setupIssues[0] || null;
  const fallbackSection = capabilities.sectionIds?.has("adminReports") ? "adminReports" : "overview";
  const action = nextIssue
    ? { label: nextIssue.action || "Open setup", section: nextIssue.section || "overview" }
    : { label: fallbackSection === "adminReports" ? "Review reports" : "Review overview", section: fallbackSection };
  const state = nextIssue ? nextIssue.tone || "warning" : "ready";
  const nextTitle = nextIssue?.title || "No setup blocker is first in line";
  const nextDetail = nextIssue?.detail || "Current roster, assignment, program, import, and report signals do not show a first setup issue.";
  const verificationRows = readinessRows
    .slice()
    .sort((a, b) => safeNumber(b.count) - safeNumber(a.count))
    .slice(0, 4);
  return `
    <section class="workspace-card workspace-admin-setup-first" data-admin-setup-first-panel="true" data-admin-setup-first-state="${escapeHtml(state)}" aria-labelledby="adminSetupFirstTitle">
      <div class="workspace-admin-setup-first-head">
        <div>
          <p class="workspace-kicker">Start Here</p>
          <h3 id="adminSetupFirstTitle">Do this first</h3>
          <p class="workspace-muted">${escapeHtml(capabilities.readOnly ? "Read-only accounts can inspect the setup state without changing records." : "Open the first setup blocker before using broader reports or exports.")}</p>
        </div>
        <span class="workspace-summary-badge">${escapeHtml(capabilities.scope?.label || "Allowed records")}</span>
      </div>
      <article class="workspace-admin-next-setup-action ${escapeHtml(state)}" data-admin-next-setup-action="${escapeHtml(nextIssue?.id || "clear")}">
        <div>
          <span>${escapeHtml(nextIssue ? "Next setup move" : "Current setup state")}</span>
          <strong>${escapeHtml(nextTitle)}</strong>
          <p>${escapeHtml(nextDetail)}</p>
        </div>
        ${renderAdminActionControl(action, "workspace-button workspace-button-primary workspace-button-small", "setup-first")}
      </article>
      <p class="workspace-muted" data-admin-setup-confirmation-cue="true">After that setup item is fixed, return here and refresh. This item leaves the list when current records confirm it.</p>
      <details class="workspace-admin-supporting-disclosure" data-admin-setup-first-lanes-disclosure="true">
        <summary>Show setup checklist</summary>
        <div class="workspace-admin-setup-first-grid" data-admin-setup-first-lanes="true">
          ${verificationRows.map((row, index) => `
            <article data-admin-setup-first-lane="${escapeHtml(row.id || `lane-${index + 1}`)}" data-admin-setup-first-lane-state="${escapeHtml(row.tone || "ready")}">
              <span>${escapeHtml(`Step ${index + 1}`)}</span>
              <strong>${escapeHtml(row.label || "Setup lane")}</strong>
              <p>${escapeHtml(row.detail || "Review this setup lane.")}</p>
              <small>${escapeHtml(safeNumber(row.count) ? `${safeNumber(row.count)} to resolve` : "No active blocker")}</small>
              ${row.section ? renderAdminActionControl({ label: row.action || "Open", section: row.section }, "workspace-link-button workspace-link-button-small", "setup-lane") : ""}
            </article>
          `).join("")}
        </div>
      </details>
    </section>
  `;
}

function adminConsoleOperationsModel(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const roles = roleIds(currentUser);
  const programTeacherOnly = roles.has("program_teacher")
    && !hasGlobalAdminRole(roles)
    && !roles.has("site_admin")
    && !roles.has("administration");
  const access = unwrap(currentData.accessAssignments) || {};
  const users = access.users || {};
  const assignments = access.assignments || {};
  const siteStudents = unwrap(currentData.siteStudents) || {};
  const siteDashboard = unwrap(currentData.siteDashboard) || {};
  const sitePrograms = unwrap(currentData.sitePrograms) || {};
  const dashboard = unwrap(currentData.adminDashboard) || {};
  const projectDirectory = unwrap(currentData.projects) || {};
  const projectSummary = projectDirectory.summary || {};
  const audit = unwrap(currentData.auditEvents) || {};
  const summary = {
    ...(siteDashboard.summary || {}),
    ...(siteStudents.summary || {}),
  };
  const directoryStudents = Array.isArray(siteStudents.students) ? siteStudents.students : [];
  const students = programTeacherOnly ? directoryStudents : Array.isArray(users.students) ? users.students : [];
  const scopedStudentIds = new Set(students.map((student) => adminStudentId(student)).filter(Boolean));
  const staffRows = programTeacherOnly ? [] : siteAccountRows(users).filter((row) => !row.roleIds.includes("student"));
  const accessPrograms = Array.isArray(access.programs) ? access.programs : [];
  const activePrograms = Array.isArray(sitePrograms.activePrograms) && sitePrograms.activePrograms.length ? sitePrograms.activePrograms : accessPrograms;
  const availablePrograms = Array.isArray(sitePrograms.availablePrograms) ? sitePrograms.availablePrograms : [];
  const allMentorAssignments = Array.isArray(assignments.mentorStudent) ? assignments.mentorStudent : [];
  const mentorAssignments = programTeacherOnly
    ? allMentorAssignments.filter((row) => scopedStudentIds.has(row.studentId))
    : allMentorAssignments;
  const viewerAssignments = programTeacherOnly ? [] : Array.isArray(assignments.viewerStudent) ? assignments.viewerStudent : [];
  const programTeacherAssignments = programTeacherOnly ? [] : Array.isArray(assignments.programTeacherProgram) ? assignments.programTeacherProgram : [];
  const studentSetupRows = adminStudentSetupRows(students, assignments);
  const staffSetupRows = adminStaffSetupRows(staffRows, assignments);
  const importSetupRows = adminImportSetupRows(adminCsvImportState);
  const studentTotal = safeNumber(summary.studentsTotal ?? siteStudents.pagination?.total ?? students.length) || adminConsoleStudentCount();
  const scopedStudentCount = studentTotal || students.length;
  const rosterIncomplete = studentSetupRows.filter((row) => row.flagIds.includes("profile") || row.flagIds.includes("email")).length;
  const missingProgramStudents = studentSetupRows.filter((row) => row.flagIds.includes("program")).length;
  const missingMentors = Math.max(
    safeNumber(summary.studentsNoMentor),
    safeNumber(summary.noMentor),
    studentSetupRows.filter((row) => row.flagIds.includes("mentor")).length,
  );
  const missingViewers = studentSetupRows.filter((row) => row.flagIds.includes("viewer")).length;
  const missingProgramTeacherCoverage = Math.max(0, activePrograms.length - programTeacherAssignments.length);
  const projectsMissingMentor = safeNumber(projectSummary.missingMentor);
  const projectsMissingProgramTeacher = safeNumber(projectSummary.missingProgramTeacher);
  const projectsMissingRequiredAdult = safeNumber(projectSummary.missingRequiredAdult);
  const projectsAdultsReady = safeNumber(projectSummary.adultsReady);
  const visibleProjectCount = safeNumber(projectSummary.total);
  const staffScopeGaps = staffSetupRows.length;
  const importIssueCount = importSetupRows.reduce((sum, row) => sum + safeNumber(row.count), 0);
  const reviewFollowUp = safeNumber(summary.submissionsSubmitted) + safeNumber(summary.submitted) + safeNumber(summary.revisionRequested);
  const exportFailures = safeNumber(summary.exportsFailed) + safeNumber(summary.archiveFailed);
  const setupIssues = [
    projectsMissingRequiredAdult ? {
      id: "project-adult-ownership",
      title: "Projects need required adults",
      detail: `${projectsMissingRequiredAdult} ${pluralize(projectsMissingRequiredAdult, "project")} need a confirmed Mentor, Program Teacher, or both.`,
      count: projectsMissingRequiredAdult,
      tone: "danger",
      section: capabilities.sectionIds.has("projects") ? "projects" : "overview",
      action: "Open projects",
    } : null,
    missingMentors ? {
      id: "mentor-coverage",
      title: "Mentor coverage missing",
      detail: `${missingMentors} ${pluralize(missingMentors, "student")} need active mentor coverage.`,
      count: missingMentors,
      tone: "warning",
      section: capabilities.sectionIds.has("adminAssignments") ? "adminAssignments" : consoleStudentSectionId(capabilities),
      action: capabilities.sectionIds.has("adminAssignments") ? "Open assignments" : "Open students",
    } : null,
    rosterIncomplete ? {
      id: "roster-profile",
      title: "Roster profile incomplete",
      detail: `${rosterIncomplete} ${pluralize(rosterIncomplete, "student")} need cohort, graduation year, or email cleanup.`,
      count: rosterIncomplete,
      tone: "warning",
      section: capabilities.sectionIds.has("adminStudents") ? "adminStudents" : consoleStudentSectionId(capabilities),
      action: "Open students",
    } : null,
    missingProgramStudents ? {
      id: "student-program",
      title: "Student program missing",
      detail: `${missingProgramStudents} ${pluralize(missingProgramStudents, "student")} need a program before program views can be trusted.`,
      count: missingProgramStudents,
      tone: "warning",
      section: capabilities.sectionIds.has("adminStudents") ? "adminStudents" : consoleStudentSectionId(capabilities),
      action: "Open students",
    } : null,
    !programTeacherOnly && missingViewers ? {
      id: "viewer-coverage",
      title: "Viewer access unassigned",
      detail: `${missingViewers} ${pluralize(missingViewers, "student")} have no read-only viewer listed in the visible roster.`,
      count: missingViewers,
      tone: "quiet",
      section: capabilities.sectionIds.has("adminAssignments") ? "adminAssignments" : "overview",
      action: "Open assignments",
    } : null,
    !programTeacherOnly && missingProgramTeacherCoverage ? {
      id: "program-teacher-coverage",
      title: "Program Teacher coverage gap",
      detail: `${missingProgramTeacherCoverage} active ${pluralize(missingProgramTeacherCoverage, "program")} need Program Teacher access confirmed.`,
      count: missingProgramTeacherCoverage,
      tone: "warning",
      section: capabilities.sectionIds.has("adminAssignments") ? "adminAssignments" : "programs",
      action: "Open assignments",
    } : null,
    !programTeacherOnly && staffScopeGaps ? {
      id: "staff-scope",
      title: "Staff access needs confirmation",
      detail: `${staffScopeGaps} staff ${pluralize(staffScopeGaps, "row")} need role, email, or assignment access review.`,
      count: staffScopeGaps,
      tone: "warning",
      section: capabilities.sectionIds.has("adminPeople") ? "adminPeople" : "adminAssignments",
      action: "Open people",
    } : null,
    !programTeacherOnly && !activePrograms.length && capabilities.sectionIds.has("programs") ? {
      id: "program-setup",
      title: "No active programs mapped",
      detail: "Add an active program for this school before relying on program views.",
      count: availablePrograms.length,
      tone: "warning",
      section: "programs",
      action: "Open programs",
    } : null,
    !programTeacherOnly && importIssueCount ? {
      id: "csv-import",
      title: "CSV preview needs fixes",
      detail: `${importIssueCount} CSV ${pluralize(importIssueCount, "row")} need correction before import confirmation.`,
      count: importIssueCount,
      tone: "warning",
      section: capabilities.sectionIds.has("adminImports") ? "adminImports" : "adminPeople",
      action: "Open imports",
    } : null,
    !programTeacherOnly && exportFailures ? {
      id: "final-files",
      title: "Final-file follow-up",
      detail: `${exportFailures} final-file or export ${pluralize(exportFailures, "record")} need review.`,
      count: exportFailures,
      tone: "danger",
      section: capabilities.sectionIds.has("adminReports") ? "adminReports" : "overview",
      action: "Open reports",
    } : null,
  ].filter(Boolean);
  const quickActions = [
    capabilities.sectionIds.has("adminStudents") ? { id: "add-student", title: programTeacherOnly ? "View Students" : "Add Student", detail: programTeacherOnly ? "Check students in your assigned program." : "Create one student in the current school.", section: "adminStudents", peopleView: programTeacherOnly ? "manage-students" : "add-student", tone: "students" } : null,
    capabilities.sectionIds.has("adminPeople") ? { id: "add-staff", title: "Add Staff", detail: "Create one mentor, viewer, Program Teacher, or admin account.", section: "adminPeople", peopleView: "add-staff", tone: "access" } : null,
    capabilities.sectionIds.has("adminAssignments") ? { id: "assign-coverage", title: programTeacherOnly ? "Assign Mentor" : "Assign Coverage", detail: programTeacherOnly ? "Connect a mentor to a student in your program." : "Manage mentor, viewer, Program Teacher, and admin coverage.", section: "adminAssignments", tone: "assignments" } : null,
    capabilities.sectionIds.has("adminImports") ? { id: "import-roster", title: "Import CSV", detail: "Download student or staff templates and preview rows.", section: "adminImports", peopleView: "import-students", tone: "imports" } : null,
    capabilities.sectionIds.has("programs") ? { id: "programs", title: "Programs", detail: "Confirm active school program mappings.", section: "programs", tone: "programs" } : null,
    capabilities.sectionIds.has("adminReports") ? { id: "reports", title: "Reports", detail: "Review roster, coverage, progress, and setup counts.", section: "adminReports", tone: "reports" } : null,
    capabilities.sectionIds.has("audit") ? { id: "audit", title: "Audit", detail: "Review access, roles, changes, and potential issues.", section: "audit", tone: "audit" } : null,
  ].filter(Boolean);
  const mentorCoveragePercent = scopedStudentCount
    ? clampPercent(((scopedStudentCount - missingMentors) / scopedStudentCount) * 100)
    : null;
  const viewerCoveragePercent = students.length
    ? clampPercent(((students.length - missingViewers) / students.length) * 100)
    : null;
  const programCoveragePercent = activePrograms.length
    ? clampPercent(((activePrograms.length - missingProgramTeacherCoverage) / activePrograms.length) * 100)
    : null;
  const rosterCompletenessPercent = students.length
    ? clampPercent(((students.length - rosterIncomplete) / students.length) * 100)
    : null;
  const health = [
    { id: "students", label: "Students", value: scopedStudentCount, detail: `${students.length || scopedStudentCount} visible in roster setup`, tone: "students" },
    !programTeacherOnly ? { id: "staff", label: "Staff", value: staffRows.length, detail: "Staff and support accounts visible", tone: "access" } : null,
    !programTeacherOnly ? { id: "programs", label: "Programs", value: activePrograms.length || safeNumber(summary.programsTotal), detail: "Active program mappings", tone: "programs" } : null,
    { id: "mentor-coverage", label: "Mentor Coverage", value: percentLabel(mentorCoveragePercent), detail: `${mentorAssignments.length} active mentor assignments`, tone: missingMentors ? "warning" : "ready" },
    { id: "project-adults", label: "Project Adults", value: visibleProjectCount ? `${projectsAdultsReady}/${visibleProjectCount}` : "No projects", detail: projectsMissingRequiredAdult ? `${projectsMissingRequiredAdult} projects need a Mentor or Program Teacher` : "Every visible project has both adults", tone: projectsMissingRequiredAdult ? "danger" : "ready" },
    !programTeacherOnly ? { id: "viewer-coverage", label: "Viewer Coverage", value: percentLabel(viewerCoveragePercent), detail: `${viewerAssignments.length} active viewer assignments`, tone: missingViewers ? "warning" : "ready" } : null,
    { id: "roster-complete", label: "Roster Completeness", value: percentLabel(rosterCompletenessPercent), detail: `${rosterIncomplete} profile ${pluralize(rosterIncomplete, "gap")}`, tone: rosterIncomplete ? "warning" : "ready" },
    !programTeacherOnly ? { id: "staff-scope", label: "Staff Access", value: staffScopeGaps, detail: "Staff role, email, or assignment gaps", tone: staffScopeGaps ? "warning" : "ready" } : null,
    { id: "setup-issues", label: "Setup Issues", value: setupIssues.length, detail: "Prioritized issues above", tone: setupIssues.length ? "warning" : "ready" },
  ].filter(Boolean);
  const accessHistory = Array.isArray(access.history)
    ? access.history.filter((row) => !programTeacherOnly || (row.assignmentType === "mentor_student" && scopedStudentIds.has(row.studentId)))
    : [];
  const recentRows = [
    ...accessHistory.map((row) => ({
      id: row.historyId,
      title: siteAccessHistoryTitle(row),
      detail: `${row.actorName || "Admin"} / ${formatDate(row.createdAt)}`,
      type: "access",
    })),
    ...(!programTeacherOnly && Array.isArray(dashboard.recentAudit) ? dashboard.recentAudit.map((row) => ({
      id: row.id || row.auditId,
      title: statusText(row.action || row.title || "Recent admin event"),
      detail: `${row.actorName || row.actor || "Admin"} / ${formatDate(row.createdAt || row.occurredAt)}`,
      type: "audit",
    })) : []),
    ...(!programTeacherOnly && Array.isArray(audit.events) ? audit.events.map((row) => ({
      id: row.id || row.auditId,
      title: statusText(row.action || "Recent change"),
      detail: `${row.actorName || "Admin"} / ${formatDate(row.createdAt)}`,
      type: "audit",
    })) : []),
  ].filter((row) => row.title).slice(0, 5);
  return {
    setupIssues,
    quickActions,
    recentActivity: recentRows,
    health,
      report: {
      studentTotal: scopedStudentCount,
      loadedStudentRows: students.length,
      staffTotal: staffRows.length,
      activePrograms: activePrograms.length || safeNumber(summary.programsTotal),
      activeProgramRows: activePrograms.length,
      mentorCoverageDenominator: scopedStudentCount,
      viewerCoverageDenominator: students.length,
      rosterCompletenessDenominator: students.length,
      programCoverageDenominator: activePrograms.length,
      rosterCompletenessPercent,
      mentorCoveragePercent,
      viewerCoveragePercent,
      programCoveragePercent,
      reviewFollowUp,
        setupIssueCount: setupIssues.length,
        visibleProjectCount,
        projectsAdultsReady,
        projectsMissingRequiredAdult,
        projectsMissingMentor,
        projectsMissingProgramTeacher,
      importIssueCount,
      staffScopeGaps,
      studentProgramGaps: missingProgramStudents,
    },
    setupReadiness: adminSetupReadinessRows({
      studentSetupRows,
      staffSetupRows,
      importSetupRows,
      students,
      staffRows,
      activePrograms,
      missingMentors,
      missingViewers,
      missingProgramTeacherCoverage,
      rosterIncomplete,
      missingProgramStudents,
      importIssueCount,
    }).filter((row) => !programTeacherOnly || row.id === "students").map((row) => capabilities.sectionIds.has(row.section) ? row : {
      ...row,
      section: "overview",
      action: "Open overview",
    }),
  };
}

function adminStudentId(student = {}) {
  return student.userId || student.studentId || student.id || "";
}

function adminStudentProgramValue(student = {}) {
  return String(student.programName || student.program || student.programId || student.pathway || "").trim();
}

function cleanDemoSeedDisplay(value = "", fallback = "") {
  const cleaned = String(value || "")
    .replace(/\s*(?:[-/|]\s*)?\bDEMO[_\s-]*SEED\b\s*(?::\s*)?/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-/|]\s*$/g, "")
    .trim();
  return cleaned || fallback;
}

function studentProgramDisplay(student = {}, fallback = "Unassigned") {
  return cleanDemoSeedDisplay(student.programName || student.program || student.programId || "", fallback);
}

function studentCohortDisplay(student = {}, fallback = "No cohort") {
  return cleanDemoSeedDisplay(student.cohortName || student.cohort || student.rosterCohort || "", fallback);
}

function studentProgramCohortDisplay(student = {}, fallback = "Assigned program or cohort") {
  const parts = [
    studentProgramDisplay(student, ""),
    studentCohortDisplay(student, ""),
  ].filter(Boolean);
  return parts.join(" / ") || fallback;
}

function adminStudentCohortValue(student = {}) {
  return String(student.cohort || student.rosterCohort || "").trim();
}

function adminStudentGraduationValue(student = {}) {
  return String(student.graduationYear || student.graduation_year || student.graduation_year_label || "").trim();
}

function adminStudentSetupFlags(student = {}, assignments = {}) {
  const studentId = adminStudentId(student);
  const mentorStudentIds = new Set((assignments.mentorStudent || []).map((row) => row.studentId).filter(Boolean));
  const viewerStudentIds = new Set((assignments.viewerStudent || []).map((row) => row.studentId).filter(Boolean));
  const flags = [];
  if (!String(student.email || "").trim()) {
    flags.push({ id: "email", label: "Missing email" });
  }
  if (!adminStudentProgramValue(student)) {
    flags.push({ id: "program", label: "Missing program" });
  }
  if (!adminStudentCohortValue(student) || !adminStudentGraduationValue(student)) {
    flags.push({ id: "profile", label: "Missing cohort/year" });
  }
  if (!student.mentorUserId && !student.mentorName && student.hasActiveMentor !== true && !mentorStudentIds.has(studentId)) {
    flags.push({ id: "mentor", label: "No mentor" });
  }
  if (!student.viewerUserId && !student.viewerName && !viewerStudentIds.has(studentId)) {
    flags.push({ id: "viewer", label: "No viewer" });
  }
  return flags;
}

function adminStudentSetupRows(students = [], assignments = {}) {
  return (Array.isArray(students) ? students : [])
    .map((student) => {
      const flags = adminStudentSetupFlags(student, assignments);
      return {
        id: adminStudentId(student),
        label: student.displayName || student.studentName || student.email || "Student",
        flags,
        flagIds: flags.map((flag) => flag.id),
      };
    })
    .filter((row) => row.flags.length);
}

function adminStaffSetupFlags(staff = {}, assignments = {}) {
  const userId = staff.userId || staff.id || "";
  const roleIds = Array.isArray(staff.roleIds) ? staff.roleIds : [];
  const mentorIds = new Set((assignments.mentorStudent || []).map((row) => row.mentorUserId).filter(Boolean));
  const viewerIds = new Set((assignments.viewerStudent || []).map((row) => row.viewerUserId).filter(Boolean));
  const programTeacherIds = new Set((assignments.programTeacherProgram || []).map((row) => row.programTeacherUserId).filter(Boolean));
  const administrationIds = new Set((assignments.administrationSite || []).map((row) => row.userId).filter(Boolean));
  const siteAdminIds = new Set((assignments.siteAdminSite || []).map((row) => row.userId).filter(Boolean));
  const flags = [];
  if (!String(staff.email || "").trim()) {
    flags.push({ id: "email", label: "Missing email" });
  }
  if (!roleIds.length) {
    flags.push({ id: "role", label: "Missing role" });
  }
  if (roleIds.includes("mentor") && !mentorIds.has(userId)) {
    flags.push({ id: "mentor-scope", label: "No mentor students" });
  }
  if (roleIds.includes("viewer") && !viewerIds.has(userId)) {
    flags.push({ id: "viewer-scope", label: "No viewer students" });
  }
  if (roleIds.includes("program_teacher") && !programTeacherIds.has(userId)) {
    flags.push({ id: "program-scope", label: "No program" });
  }
  if (roleIds.includes("administration") && !administrationIds.has(userId)) {
    flags.push({ id: "site-scope", label: "No school access row" });
  }
  if (roleIds.includes("site_admin") && !siteAdminIds.has(userId)) {
    flags.push({ id: "site-admin-scope", label: "No Site Admin row" });
  }
  return flags;
}

function adminStaffSetupRows(staffRows = [], assignments = {}) {
  return (Array.isArray(staffRows) ? staffRows : [])
    .map((staff) => {
      const flags = adminStaffSetupFlags(staff, assignments);
      return {
        id: staff.userId || staff.id || "",
        label: staff.displayName || staff.email || "Staff account",
        flags,
        flagIds: flags.map((flag) => flag.id),
      };
    })
    .filter((row) => row.flags.length);
}

function adminImportSetupRows(state = adminCsvImportState) {
  return ["students", "staff"].map((kind) => {
    const importState = state[kind] || defaultAdminCsvImportKindState(kind);
    const errors = Array.isArray(importState.errors) ? importState.errors : [];
    const summary = importState.summary || {};
    return {
      id: kind,
      label: kind === "staff" ? "Staff CSV" : "Student CSV",
      count: errors.length,
      detail: importState.previewed
        ? `${safeNumber(summary.validRows)} valid / ${safeNumber(summary.rowsWithErrors || errors.length)} to fix`
        : "No preview run in this browser session",
    };
  }).filter((row) => row.count);
}

function adminSetupReadinessRows({
  studentSetupRows = [],
  staffSetupRows = [],
  importSetupRows = [],
  students = [],
  staffRows = [],
  activePrograms = [],
  missingMentors = 0,
  missingViewers = 0,
  missingProgramTeacherCoverage = 0,
  rosterIncomplete = 0,
  missingProgramStudents = 0,
  importIssueCount = 0,
} = {}) {
  const studentIssueCount = Math.max(studentSetupRows.length, rosterIncomplete, missingProgramStudents, missingMentors, missingViewers);
  return [
    {
      id: "students",
      label: "Student roster setup",
      count: studentIssueCount,
      detail: studentIssueCount
        ? `${rosterIncomplete} profile, ${missingProgramStudents} program, ${missingMentors} mentor, ${missingViewers} viewer gaps.`
        : `${students.length} student rows have setup fields visible here.`,
      sample: studentSetupRows.slice(0, 2).map(adminSetupSampleText),
      section: "adminStudents",
      action: "Open students",
      tone: studentIssueCount ? "warning" : "ready",
    },
    {
      id: "staff",
      label: "Staff role and access",
      count: staffSetupRows.length,
      detail: staffSetupRows.length
        ? "Staff rows need an email, role, or assignment coverage before handoff."
        : `${staffRows.length} staff rows have role and assignment coverage visible here.`,
      sample: staffSetupRows.slice(0, 2).map(adminSetupSampleText),
      section: "adminPeople",
      action: "Open people",
      tone: staffSetupRows.length ? "warning" : "ready",
    },
    {
      id: "coverage",
      label: "Program coverage",
      count: missingProgramTeacherCoverage,
      detail: missingProgramTeacherCoverage
        ? `${missingProgramTeacherCoverage} active ${pluralize(missingProgramTeacherCoverage, "program")} need Program Teacher coverage.`
        : `${activePrograms.length} active ${pluralize(activePrograms.length, "program")} have Program Teacher coverage or no active gap in this view.`,
      sample: [],
      section: "adminAssignments",
      action: "Open assignments",
      tone: missingProgramTeacherCoverage ? "warning" : "ready",
    },
    {
      id: "imports",
      label: "CSV import preview",
      count: importIssueCount,
      detail: importIssueCount
        ? `${importIssueCount} preview ${pluralize(importIssueCount, "error")} must be fixed before import.`
        : "Student and staff templates match the current preview validators.",
      sample: importSetupRows.slice(0, 2).map((row) => `${row.label}: ${row.detail}`),
      section: "adminImports",
      action: "Open imports",
      tone: importIssueCount ? "warning" : "ready",
    },
  ];
}

function adminSetupSampleText(row = {}) {
  const labels = (row.flags || []).map((flag) => flag.label).filter(Boolean).join(", ");
  return `${row.label || "Row"}: ${labels || "Review setup"}`;
}

function percentLabel(value) {
  return value === null || value === undefined ? "n/a" : `${Math.round(value)}%`;
}

function renderAdminSetupIssues(issues = []) {
  return `
    <section class="workspace-card workspace-admin-setup-list" data-admin-console-setup-list="true" data-admin-needs-setup-list="true" aria-labelledby="adminSetupIssuesTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Needs Setup</p>
          <h3 id="adminSetupIssuesTitle">What to fix first</h3>
        </div>
        <span class="workspace-summary-badge">${escapeHtml(String(issues.length))} issue${issues.length === 1 ? "" : "s"}</span>
      </div>
      ${issues.length ? `
        <details class="workspace-admin-issue-disclosure" data-admin-issue-list-disclosure="true">
          <summary>Show all setup issues</summary>
          <div class="workspace-list">
            ${issues.map((issue) => renderAdminIssueRow(issue)).join("")}
          </div>
        </details>
      ` : `
        <article class="workspace-empty-state-card" data-admin-console-setup-empty="true">
          <strong>No setup issues found.</strong>
          <p>Roster, coverage, programs, imports, and recent admin activity do not show a current setup issue in this view.</p>
          ${renderProblemState({
            reason: "This admin view has no setup issues that need action.",
            owner: "Site admin",
            nextAction: "Refresh after roster, program, or import changes before treating this view as still clear.",
            actions: [
              { label: "Refresh workspace", problemAction: "refresh" },
              availableSectionIdsForAnyMode().has("adminReports") ? { label: "Open reports", section: "adminReports" } : null,
              availableSectionIdsForAnyMode().has("adminImports") ? { label: "Open imports", section: "adminImports" } : null,
            ].filter(Boolean),
          })}
        </article>
      `}
    </section>
  `;
}

function renderAdminIssueRow(issue = {}) {
  const count = safeNumber(issue.count);
  const detailsId = `admin-issue-${cleanDirectoryFilter(issue.id || "issue") || "issue"}`;
  return `
    <article class="workspace-admin-setup-row workspace-admin-issue-row ${escapeHtml(issue.tone || "quiet")}" data-admin-console-setup-issue="${escapeHtml(issue.id || "issue")}" data-admin-issue-row="true" data-admin-issue-count="${escapeHtml(String(count))}">
      <div>
        <strong>${escapeHtml(issue.title || "Setup issue")}</strong>
        <p>${escapeHtml(issue.detail || "Review this setup issue.")}</p>
        <details class="workspace-admin-issue-details" data-admin-issue-details="${escapeHtml(issue.id || "issue")}" id="${escapeHtml(detailsId)}">
          <summary>Show details</summary>
          <div>
            <p>${escapeHtml(issue.longDetail || issue.detail || "Review this setup issue, then open the linked setup item.")}</p>
            <span class="workspace-muted">${escapeHtml(count ? `${count} ${pluralize(count, "record")} to check` : "No active records to check")}</span>
          </div>
        </details>
      </div>
      <div class="workspace-row-actions">
        ${statusPill(issue.tone === "danger" ? "failed" : "needs_review")}
        ${issue.section ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(issue.section)}">${escapeHtml(issue.action || "Fix setup")}</button>` : ""}
      </div>
    </article>
  `;
}

function renderAdminHealthSummary(rows = []) {
  return `
    <section class="workspace-card workspace-admin-health-summary" data-admin-console-health="true" data-admin-report-summary-strip="true" aria-labelledby="adminHealthTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Health Summary</p>
          <h3 id="adminHealthTitle">Current setup health</h3>
        </div>
      </div>
      <div class="workspace-admin-health-grid">
        ${rows.map((row) => `
          <article class="workspace-admin-health-card ${escapeHtml(row.tone || "quiet")}" data-admin-health-card="${escapeHtml(row.id || row.label || "health")}">
            <span>${escapeHtml(row.label || "Metric")}</span>
            <strong>${escapeHtml(String(row.value ?? 0))}</strong>
            <small>${escapeHtml(row.detail || "")}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminSetupReadinessPanel(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `
    <section class="workspace-card workspace-admin-setup-readiness" data-admin-setup-readiness="true" aria-labelledby="adminSetupReadinessTitle">
      <details class="workspace-admin-supporting-disclosure" data-admin-setup-readiness-disclosure="true">
        <summary>
          <span class="workspace-kicker">Setup Checklist</span>
          <strong id="adminSetupReadinessTitle">Setup work to review</strong>
        </summary>
        <div class="workspace-admin-setup-readiness-list">
          ${safeRows.map((row) => `
            <article class="workspace-admin-setup-readiness-row ${escapeHtml(row.tone || "quiet")}" data-admin-setup-readiness-row="${escapeHtml(row.id || "row")}">
              <div>
                <span>${escapeHtml(row.label || "Setup item")}</span>
                <strong>${escapeHtml(String(safeNumber(row.count)))}</strong>
                <p>${escapeHtml(row.detail || "Review this setup item.")}</p>
                ${row.sample?.length ? `<small>${escapeHtml(row.sample.join(" / "))}</small>` : ""}
              </div>
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(row.section || "adminDashboard")}">
                ${escapeHtml(row.action || "Open")}
              </button>
            </article>
          `).join("")}
        </div>
      </details>
    </section>
  `;
}

function renderAdminQuickActions(actions = []) {
  return `
    <section class="workspace-card workspace-admin-quick-actions" data-admin-console-quick-actions="true" aria-labelledby="adminQuickActionsTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Quick Actions</p>
          <h3 id="adminQuickActionsTitle">Open the exact setup item</h3>
        </div>
      </div>
      <div class="workspace-admin-quick-action-grid">
        ${actions.map((action) => `
          <button class="workspace-admin-quick-action ${escapeHtml(action.tone || "default")}" type="button" data-section="${escapeHtml(action.section || "overview")}" ${action.peopleView ? `data-admin-people-view="${escapeHtml(action.peopleView)}"` : ""} data-admin-console-quick-action="${escapeHtml(action.id || action.section || "action")}">
            <strong>${escapeHtml(action.title || "Open")}</strong>
            <span>${escapeHtml(action.detail || "Open this admin screen.")}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminRecentActivity(rows = []) {
  return `
    <section class="workspace-card workspace-admin-recent-activity" data-admin-console-recent-activity="true" aria-labelledby="adminRecentActivityTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Recent Admin Activity</p>
          <h3 id="adminRecentActivityTitle">Latest changes in this view</h3>
        </div>
        ${availableSectionIdsForAnyMode().has("audit") ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="audit">Open audit</button>` : ""}
      </div>
      ${rows.length ? `
        <div class="workspace-list">
          ${rows.map((row) => `
            <article class="workspace-mini-row" data-admin-recent-activity-row="${escapeHtml(row.id || row.type || "activity")}">
              <span>${escapeHtml(row.title || "Recent change")}</span>
              <small>${escapeHtml(row.detail || "Recent admin activity")}</small>
            </article>
          `).join("")}
        </div>
      ` : `
        <article class="workspace-empty-state-card" data-admin-recent-activity-empty="true">
          <strong>No recent admin activity found.</strong>
          <p>No redacted admin changes are available for this view yet.</p>
          ${renderProblemState({
            reason: "The recent activity feed has no activity rows.",
            owner: "Site admin",
            nextAction: "Refresh after staff, roster, import, or access changes; open Audit if this role can review older rows.",
            actions: [
              { label: "Refresh workspace", problemAction: "refresh" },
              availableSectionIdsForAnyMode().has("audit") ? { label: "Open audit", section: "audit" } : null,
            ].filter(Boolean),
          })}
        </article>
      `}
    </section>
  `;
}

function renderAdminConsoleMetrics(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const studentCount = adminConsoleStudentCount();
  const reviewCount = adminConsoleReviewCount();
  const operationsCount = adminConsoleOperationsCount();
  return [
    renderMetricTile("Students shown", studentCount, capabilities.scope.label, "", consoleStudentSectionId(capabilities), { label: "Open students" }),
    renderMetricTile("Review / work", reviewCount, "Submitted or review-related rows", "", capabilities.sectionIds.has("teacher") ? "teacher" : "", { label: "Open review" }),
    renderMetricTile("Setup work", operationsCount, "Presentation, mentor, or final-file follow-up", "", capabilities.sectionIds.has("operations") ? "operations" : "", { label: "Open operations" }),
    renderMetricTile("Console tools", capabilities.sections.length, capabilities.readOnly ? "Read-only tools only" : "Available tools", "", "overview"),
  ].join("");
}

function consoleStudentSectionId(capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  if (capabilities.sectionIds.has("students")) return "students";
  if (capabilities.sectionIds.has("mentorDashboard")) return "mentorDashboard";
  if (capabilities.sectionIds.has("mentor")) return "mentor";
  return "";
}

function adminConsoleStudentCount() {
  const siteStudents = unwrap(currentData.siteStudents) || {};
  const siteSummary = siteStudents.summary || {};
  const programDashboard = unwrap(currentData.programTeacherDashboard) || {};
  const mentorDashboard = unwrap(currentData.mentorDashboard) || {};
  const mentorAssigned = unwrap(currentData.mentorAssigned) || {};
  const candidates = [
    siteStudents.pagination?.total,
    siteSummary.studentsTotal,
    siteSummary.total,
    programDashboard.summary?.studentsTotal,
    programDashboard.summary?.studentCount,
    Array.isArray(programDashboard.students) ? programDashboard.students.length : 0,
    mentorDashboard.summary?.assignedCount,
    Array.isArray(mentorDashboard.assignedStudents) ? mentorDashboard.assignedStudents.length : 0,
    Array.isArray(mentorAssigned.assignedStudents) ? mentorAssigned.assignedStudents.length : 0,
  ].map((value) => safeNumber(value)).filter((value) => value > 0);
  return candidates.length ? candidates[0] : 0;
}

function adminConsoleReviewCount() {
  const reviewQueue = unwrap(currentData.reviewQueue) || {};
  const programDashboard = unwrap(currentData.programTeacherDashboard) || {};
  const candidates = [
    reviewQueue.summary?.submitted,
    reviewQueue.summary?.needsReview,
    reviewQueue.pagination?.total,
    Array.isArray(reviewQueue.queue) ? reviewQueue.queue.length : 0,
    Array.isArray(programDashboard.needsReview) ? programDashboard.needsReview.length : 0,
  ].map((value) => safeNumber(value)).filter((value) => value > 0);
  return candidates.length ? candidates[0] : 0;
}

function adminConsoleOperationsCount() {
  const operations = unwrap(currentData.operationsReadiness) || {};
  const siteDashboard = unwrap(currentData.siteDashboard) || {};
  const candidates = [
    operations.summary?.needsAttention,
    operations.summary?.attentionRequired,
    Array.isArray(operations.rows) ? operations.rows.length : 0,
    Array.isArray(siteDashboard.needsAttention) ? siteDashboard.needsAttention.length : 0,
  ].map((value) => safeNumber(value)).filter((value) => value > 0);
  return candidates.length ? candidates[0] : 0;
}

function handleProblemStateAction(button) {
  const action = button?.dataset?.problemAction || "";
  if (action === "refresh") {
    return loadWorkspaceData("Refreshing workspace...");
  }
}

function handleUsersAccessFocusAction(button) {
  const target = cleanDirectoryFilter(button?.dataset?.usersAccessFocus || "");
  const selectors = {
    create: "#workspaceAdminImportForm",
    preflight: "[data-admin-import-preflight='true']",
    "current-access": "[data-site-access-assignment-summary='true']",
    "assignment-forms": "[data-site-access-assignment-form]",
    removal: "[data-site-access-removal-warning='true']",
    accounts: "[data-site-account-management='true']",
  };
  const selector = selectors[target];
  if (!selector) return;
  const element = document.querySelector(selector);
  if (!element) return;
  if (!element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
  }
  element.scrollIntoView?.({ block: "start", behavior: "smooth" });
  element.focus?.({ preventScroll: true });
}

function handlePeopleViewAction(button) {
  const view = cleanAdminPeopleView(button?.dataset?.peopleViewTarget || "");
  if (!view || !canUsePeopleManagementScreens(roleIds(currentUser))) return;
  adminPeopleView = view;
  activeSection = adminSectionForPeopleView(view, activeSection);
  syncAdminPeopleUrlState();
  renderAppShell(`${peopleViewLabel(view)} opened.`, "success");
}

function peopleViewLabel(view) {
  const match = peopleManagementScreensForRoles(roleIds(currentUser)).find((screen) => screen.id === view);
  return match?.label || "People";
}

function adminSectionForPeopleView(view, fallbackSection = "adminUsers") {
  const sectionIds = availableSectionIdsForAnyMode();
  if (view === "manage-staff" || view === "add-staff") {
    return sectionIds.has("adminPeople") ? "adminPeople" : "adminUsers";
  }
  if (view === "manage-students" || view === "add-student") {
    return sectionIds.has("adminStudents") ? "adminStudents" : "adminUsers";
  }
  if (view === "assignments") {
    return sectionIds.has("adminAssignments") ? "adminAssignments" : "adminUsers";
  }
  if (view === "import-students" || view === "import-staff") {
    return sectionIds.has("adminImports") ? "adminImports" : "adminUsers";
  }
  const cleanFallback = cleanWorkspaceSection(fallbackSection);
  return sectionIds.has(cleanFallback) ? cleanFallback : "adminUsers";
}

function handleSecurityFocusAction(button) {
  const target = cleanDirectoryFilter(button?.dataset?.securityFocus || "");
  const selectors = {
    "password-form": "[data-security-password-form='true']",
    "password-checklist": "[data-task-finish-checklist='password-change']",
    "session-impact": "[data-security-session-impact='true']",
    "sign-in-mode": "[data-security-signin-mode='true']",
    support: "[data-security-support-guide='true']",
  };
  const selector = selectors[target];
  if (!selector) return;
  const element = document.querySelector(selector);
  if (!element) return;
  if (!element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
  }
  element.scrollIntoView?.({ block: "start", behavior: "smooth" });
  element.focus?.({ preventScroll: true });
}

function renderSessionRecoveryGuide(workspaceState = "signed-out") {
  if (workspaceState !== "session-expired") return "";
  return `
    <section class="workspace-session-recovery" data-session-recovery-guide="true">
      <strong>Your session expired.</strong>
      <ol>
        <li>Sign in again with your approved workspace account.</li>
        <li>Reopen the section you were using from the left navigation.</li>
        <li>If a form was open, check the record before submitting again.</li>
      </ol>
    </section>
  `;
}

function requestSiteStudentDetailFocus() {
  pendingSiteStudentDetailFocus = true;
}

function requestStudentRequirementFocus(requirementId) {
  pendingStudentRequirementFocusId = cleanDirectoryFilter(requirementId);
}

function requestStudentSectionFocus(section) {
  const normalized = String(section || "").trim().toLowerCase();
  pendingStudentSectionFocus = ["deadlines", "requirements", "feedback", "evidence", "submissions", "files"].includes(normalized)
    ? normalized
    : "";
}

function flushPendingSiteStudentDetailFocus() {
  if (!pendingSiteStudentDetailFocus) return;
  pendingSiteStudentDetailFocus = false;
  const focusPanel = () => {
    const panel = document.querySelector('[data-student-detail-panel="true"]');
    if (!panel) return;
    panel.scrollIntoView?.({ block: "start", behavior: "auto" });
    try {
      panel.focus?.({ preventScroll: true });
    } catch {
      panel.focus?.();
    }
  };
  if (typeof setTimeout === "function") {
    setTimeout(focusPanel, 0);
  } else if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(focusPanel);
  } else {
    focusPanel();
  }
}

function flushPendingStudentRequirementFocus() {
  const requirementId = pendingStudentRequirementFocusId;
  if (!requirementId) return;
  pendingStudentRequirementFocusId = "";
  const focusRequirement = () => {
    const detailDomId = studentRequirementDetailDomId(requirementId);
    const detail = document.querySelector(`[id="${escapeHtml(detailDomId)}"]`);
    const row = detail?.closest?.("[data-student-requirement-row]") || document.querySelector(`[data-student-requirement-id="${escapeHtml(requirementId)}"]`);
    (detail || row)?.scrollIntoView?.({ block: "start", behavior: "auto" });
    row?.querySelector?.('[data-student-requirement-action="toggle-detail"]')?.focus?.();
  };
  if (typeof setTimeout === "function") {
    setTimeout(focusRequirement, 0);
  } else if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(focusRequirement);
  } else {
    focusRequirement();
  }
}

function flushPendingStudentSectionFocus() {
  const section = pendingStudentSectionFocus;
  if (!section) return;
  pendingStudentSectionFocus = "";
  const selectors = {
    deadlines: '[data-student-deadlines-panel="true"]',
    requirements: '[data-student-requirements-panel="true"]',
    feedback: '[data-student-feedback-panel="true"]',
    evidence: '[data-student-evidence-panel="true"]',
    submissions: '[data-student-submissions-panel="true"]',
    files: '[data-student-files-panel="true"]',
  };
  const focusPanel = () => {
    const panel = document.querySelector(selectors[section] || "");
    if (!panel) return;
    panel.scrollIntoView?.({ block: "start", behavior: "auto" });
    try {
      panel.focus?.({ preventScroll: true });
    } catch {
      panel.focus?.();
    }
  };
  if (typeof setTimeout === "function") {
    setTimeout(focusPanel, 0);
  } else if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(focusPanel);
  } else {
    focusPanel();
  }
}

function flushPendingStudentEvidenceFocus() {
  const submissionId = cleanDirectoryFilter(pendingStudentEvidenceSubmissionId || "");
  if (!submissionId) return;
  pendingStudentEvidenceSubmissionId = "";
  const focusEvidence = () => {
    let matched = false;
    document.querySelectorAll('#workspaceEvidenceLinkForm select[name="submissionId"], #workspaceFileUploadForm select[name="submissionId"]').forEach((select) => {
      const hasOption = Array.from(select.options || []).some((option) => option.value === submissionId);
      if (hasOption) {
        select.value = submissionId;
        updateStudentProofGuideForSelect(select);
        matched = true;
      }
    });
    const panel = document.querySelector('[data-student-evidence-panel="true"]');
    if (matched) panel?.setAttribute("data-selected-submission-id", submissionId);
    panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    document.querySelector('#workspaceEvidenceLinkForm input[name="title"]')?.focus?.();
  };
  if (typeof setTimeout === "function") {
    setTimeout(focusEvidence, 0);
  } else if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(focusEvidence);
  } else {
    focusEvidence();
  }
}

function handleWorkspaceDisclosureToggle(event) {
  const button = event?.currentTarget;
  const scope = button?.dataset?.workspaceDisclosureScope || "";
  const id = button?.dataset?.workspaceDisclosureId || "";
  if (!scope || !id) return;
  const requestedAction = button?.dataset?.workspaceDisclosureAction || "toggle";
  const opening = requestedAction === "open" ? true : !isWorkspaceDisclosureOpen(scope, id);
  setWorkspaceDisclosure(scope, id, opening);
  if (scope === "student") activeSection = "student";
  renderAppShell(opening ? "Details opened." : "Details collapsed.", "success");
}

function shouldCollapseWorkspaceNavByDefault() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(max-width: 900px)").matches;
}

function toggleWorkspaceMenu() {
  workspaceNavCollapsed = !workspaceNavCollapsed;
  renderAppShell(workspaceNavCollapsed ? "Menu closed." : "Menu opened.", "success");
}

function closeWorkspaceMenu() {
  if (workspaceNavCollapsed) return;
  workspaceNavCollapsed = true;
  renderAppShell("Menu closed.", "success");
}

function handleWorkspaceKeydown(event) {
  if (event?.key !== "Escape" || workspaceNavCollapsed) return;
  closeWorkspaceMenu();
}

function syncWorkspaceDrawerOffset() {
  const app = document.querySelector?.(".workspace-app");
  const topbar = document.querySelector?.(".workspace-topbar");
  if (!app || !topbar) return;
  const rect = topbar.getBoundingClientRect?.();
  const height = Number(rect?.bottom || topbar.offsetHeight || 0);
  if (!Number.isFinite(height) || height <= 0) return;
  app.style?.setProperty?.("--workspace-drawer-top", `calc(${Math.ceil(height + 8)}px + env(safe-area-inset-top))`);
}

function renderScreenGuidance(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const body = `
    ${renderScreenOrientation(sectionId, primaryRole, roles, sections)}
    ${renderScreenLanguageGuide(sectionId, primaryRole, roles, sections)}
    ${renderScreenActionImpactGuide(sectionId, primaryRole, roles, sections)}
    ${renderScreenVisibilityGuide(sectionId, primaryRole, roles, sections)}
    ${renderScreenStartGuide(sectionId, primaryRole, roles, sections)}
    ${renderScreenDoneGuide(sectionId, primaryRole, roles, sections)}
  `;
  if (!body.trim()) return "";
  return `
    <details class="workspace-screen-guide-panel" data-screen-guide-panel="${escapeHtml(activeId)}">
      <summary>
        <span>Screen guide</span>
        <strong>${escapeHtml(orientation.title)}</strong>
        <small>Terms, click effects, visibility, start checks, and done signals</small>
      </summary>
      <div class="workspace-screen-guide-body">
        ${body}
      </div>
    </details>
  `;
}

function sectionShortLabel(section) {
  const labels = {
    overview: "Home",
    profile: "Profile",
    siteDashboard: "Dash",
    students: "Students",
    student: "My Project",
    archive: "Files",
    mentorDashboard: "Mentor",
    mentor: "Assigned",
    programDashboard: "Program",
    teacher: "Review",
    mentorAssignments: "Coverage",
    operations: "Ops",
    presentation: "Present",
    adminDashboard: "Admin",
    readiness: "Ready",
    adminUsers: "Users",
    audit: "Audit",
    archiveExports: "Exports",
    security: section?.label === "Account" ? "Account" : "Security",
  };
  return labels[section.id] || section.label || "Open";
}

function renderSiteSwitcherControl() {
  if (!currentUser || !canUseSiteSwitcher(roleIds(currentUser))) return "";
  const context = currentSiteWorkspaceContext();
  const sites = accessibleSitesForWorkspace();
  const currentSiteId = selectedSiteId || (sites.length === 1 ? sites[0].siteId : "");
  const currentSite = sites.find((site) => site.siteId === currentSiteId) || (context.siteId ? {
    siteId: context.siteId,
    siteName: context.siteName || "Current site",
  } : null);

  if (sites.length > 1) {
    return `
      <label class="workspace-site-switcher workspace-site-switcher-select">
        <span>Current site</span>
        <select id="workspaceSiteSelect" aria-label="Choose site">
          <option value="" ${currentSiteId ? "" : "selected"}>Choose site</option>
          ${sites.map((site) => `
            <option value="${escapeHtml(site.siteId)}" ${site.siteId === currentSiteId ? "selected" : ""}>
              ${escapeHtml(site.siteName || site.siteId)}
            </option>
          `).join("")}
        </select>
      </label>
    `;
  }

  if (currentSite) {
    return `
      <div class="workspace-site-switcher" aria-label="Current site">
        <span>Current site</span>
        <strong>${escapeHtml(currentSite.siteName || currentSite.siteId)}</strong>
        ${sites.length === 1 ? `<em>Only one site</em>` : ""}
      </div>
    `;
  }

  return "";
}

function renderWorkspaceStudentSearchControl(roles = roleIds(currentUser)) {
  if (!roles?.size || !availableSectionIds(activeWorkspaceMode).has("students")) return "";
  const accessibleSites = accessibleSitesForWorkspace();
  const currentSiteId = selectedSiteQueryValue() || currentSiteWorkspaceContext().siteId || (accessibleSites.length === 1 ? accessibleSites[0]?.siteId || "" : "");
  const searchValue = cleanSearchFilter(siteStudentFilters?.search || "");
  const disabled = accessibleSites.length > 1 && !currentSiteId;
  return `
    <form class="workspace-topbar-search" id="workspaceStudentSearchForm" data-workspace-student-search="true">
      <label for="workspaceStudentSearchInput">Find a student</label>
      <div class="workspace-topbar-search-row">
        <input
          class="workspace-input"
          id="workspaceStudentSearchInput"
          name="search"
          type="search"
          value="${escapeHtml(searchValue)}"
          aria-label="${escapeHtml(disabled ? "Choose a site before searching students" : "Search the current student view")}"
          autocomplete="off"
          maxlength="80"
          ${disabled ? "disabled" : ""}
        >
        <button class="workspace-button workspace-button-secondary" type="submit" ${disabled ? "disabled" : ""}>Open students</button>
      </div>
      <small>${escapeHtml(disabled ? "Choose a site first to search student records." : "Uses the current Student Directory filters and access.")}</small>
    </form>
  `;
}

function canUseSiteSwitcher(roles) {
  return roles.has("platform_admin")
    || roles.has("global_admin")
    || roles.has("admin")
    || roles.has("site_admin")
    || roles.has("administration")
    || roles.has("program_teacher")
    || roles.has("mentor")
    || roles.has("viewer")
    || roles.has("misc_admin");
}

function currentSiteWorkspaceContext() {
  const candidates = [
    unwrap(currentData.siteDashboard)?.scope,
    unwrap(currentData.sitePrograms)?.scope,
    unwrap(currentData.siteStudents)?.scope,
    unwrap(currentData.reviewQueue)?.scope,
    unwrap(currentData.mentorAssignments)?.scope,
    unwrap(currentData.operationsReadiness)?.scope,
  ].filter(Boolean);
  return candidates.find((scope) => scope?.siteId) || {};
}

function workspaceHeaderSubtitle(primaryRole, siteContext = {}) {
  const subtitleParts = [roleLabel(primaryRole)];
  if (siteContext.siteName) {
    subtitleParts.push(siteContext.siteName);
  } else {
    subtitleParts.push(roleScopeSummary(currentUser));
  }
  return subtitleParts.filter(Boolean).join(" / ");
}

function workspaceHeaderContext(primaryRole, siteContext = {}) {
  const context = [];
  if (siteContext.tenantName) context.push(siteContext.tenantName);
  if (siteContext.schoolYear) context.push(siteContext.schoolYear);
  if (!siteContext.siteName || primaryRole === "platform_admin" || primaryRole === "global_admin" || primaryRole === "admin") {
    context.push(roleScopeSummary(currentUser));
  }
  return context.filter(Boolean);
}

function accessibleSitesForWorkspace() {
  const siteRows = [];
  const sources = [
    knownAccessibleSites,
    currentUser?.accessibleSites,
    unwrap(currentData.siteDashboard)?.scope?.accessibleSites,
    currentData.siteDashboard?.body?.accessibleSites,
    unwrap(currentData.siteStudents)?.scope?.accessibleSites,
    currentData.siteStudents?.body?.accessibleSites,
    unwrap(currentData.sitePrograms)?.scope?.accessibleSites,
    currentData.sitePrograms?.body?.accessibleSites,
    unwrap(currentData.reviewQueue)?.scope?.accessibleSites,
    currentData.reviewQueue?.body?.accessibleSites,
    unwrap(currentData.mentorAssignments)?.scope?.accessibleSites,
    currentData.mentorAssignments?.body?.accessibleSites,
    unwrap(currentData.accessAssignments)?.scope?.accessibleSites,
    currentData.accessAssignments?.body?.accessibleSites,
    unwrap(currentData.operationsReadiness)?.scope?.accessibleSites,
    currentData.operationsReadiness?.body?.accessibleSites,
  ];
  for (const rows of sources) {
    if (!Array.isArray(rows)) continue;
    for (const site of rows) {
      if (!site?.siteId || siteRows.some((existing) => existing.siteId === site.siteId)) continue;
      siteRows.push(site);
    }
  }
  const context = currentSiteWorkspaceContext();
  if (context.siteId && !siteRows.some((site) => site.siteId === context.siteId)) {
    siteRows.push({
      siteId: context.siteId,
      siteName: context.siteName || "Current site",
      tenantName: context.tenantName || "",
      schoolYear: context.schoolYear || "",
    });
  }
  if (siteRows.length) knownAccessibleSites = siteRows.map((site) => ({ ...site }));
  return siteRows;
}

async function selectWorkspaceSite(siteId) {
  const nextSiteId = cleanDirectoryFilter(siteId);
  if (!nextSiteId) return;
  const siteChanged = nextSiteId !== selectedSiteId;
  selectedSiteId = nextSiteId;
  if (siteChanged) clearWorkspaceDataForSiteChange();
  siteStudentFilters = defaultSiteStudentFilters();
  siteStudentDetailState = defaultSiteStudentDetailState();
  reviewQueueFilters = defaultReviewQueueFilters();
  reviewQueueState = defaultReviewQueueState();
  mentorAssignmentFilters = defaultMentorAssignmentFilters();
  operationsReadinessFilters = defaultOperationsReadinessFilters();
  activeProjectId = "";
  managedProjectId = "";
  syncCurrentWorkspaceUrlState({ clearFilters: true, replace: true });
  await loadWorkspaceData("Current site updated.");
}

function clearWorkspaceDataForSiteChange() {
  const authConfig = currentData.authConfig;
  currentData = defaultCurrentData(authConfig);
  workspaceConnectionState = defaultWorkspaceConnectionState();
}

async function handleRoleAssignmentAction(event) {
  const button = event?.currentTarget;
  const action = button?.dataset?.roleAssignmentAction || "";
  const siteId = cleanDirectoryFilter(button?.dataset?.roleAssignmentSiteId || "");
  if (!siteId) return;
  const nextFilters = defaultSiteStudentFilters();
  let successMessage = "";
  if (action === "open-program-students") {
    const programId = cleanDirectoryFilter(button?.dataset?.roleAssignmentProgramId || "");
    if (!programId) return;
    nextFilters.programId = programId;
    successMessage = "Showing students in the assigned program.";
  } else if (action === "open-cohort-students") {
    const cohortId = cleanDirectoryFilter(button?.dataset?.roleAssignmentCohortId || "");
    if (!cohortId) return;
    nextFilters.cohortId = cohortId;
    successMessage = "Showing students in the assigned cohort.";
  } else {
    return;
  }
  const siteChanged = siteId !== selectedSiteId;
  selectedSiteId = siteId;
  if (siteChanged) clearWorkspaceDataForSiteChange();
  siteStudentFilters = nextFilters;
  siteStudentDetailState = defaultSiteStudentDetailState();
  activeSection = "students";
  syncSiteStudentUrlState();
  await loadWorkspaceData(successMessage);
}

function resetWorkspaceScrollPosition() {
  const scrollingElement = document.scrollingElement || document.documentElement;
  if (scrollingElement) {
    scrollingElement.scrollTop = 0;
    scrollingElement.scrollLeft = 0;
  }
  if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
  const stage = document.querySelector?.(".workspace-v2-stage");
  if (stage && typeof stage.scrollTo === "function") stage.scrollTo(0, 0);
}

function bindAdminDirectorySearches() {
  document.querySelectorAll?.("[data-admin-directory-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const directory = input.closest?.("[data-admin-directory]");
      if (!directory) return;
      const query = String(input.value || "").trim().toLowerCase();
      const rows = Array.from(directory.querySelectorAll?.("[data-admin-directory-row]") || []);
      let visible = 0;
      rows.forEach((row) => {
        const matches = !query || String(row.textContent || "").toLowerCase().includes(query);
        row.hidden = !matches;
        if (matches) visible += 1;
      });
      const count = directory.querySelector?.("[data-admin-directory-search-count]");
      if (count) count.textContent = query
        ? `${visible} of ${rows.length} accounts shown`
        : `${rows.length} accounts shown`;
    });
  });
}

async function openWorkspaceSection(button) {
  const requestedSection = button?.dataset?.section;
  if (!requestedSection) return;
  const requestedAdminPeopleView = cleanAdminPeopleView(button?.dataset?.adminPeopleView || "");
  const section = requestedSection === "adminUsers"
    ? adminSectionForPeopleView(requestedAdminPeopleView || "manage-students", "adminUsers")
    : requestedSection;
  resetWorkspaceScrollPosition();
  await ensureWorkspaceModulesForSection(section, currentUser);
  const sectionMode = modeForAvailableSection(section);
  if (!sectionMode) {
    renderAppShell("This workspace section is not available for your account.", "error");
    return;
  }
  activeWorkspaceMode = sectionMode;
  blockedWorkspaceMode = "";
  if (requestedAdminPeopleView) {
    adminPeopleView = requestedAdminPeopleView;
  }
  if (section === "mentorAssignments" && button.dataset.sectionPreset === "no-mentor") {
    mentorAssignmentFilters = {
      ...defaultMentorAssignmentFilters(),
      status: "unassigned",
      noMentor: true,
    };
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Showing students without mentors.");
    return;
  }
  if (section === "mentorAssignments" && button.dataset.sectionPreset === "active-assignments") {
    mentorAssignmentFilters = {
      ...defaultMentorAssignmentFilters(),
      status: "active",
    };
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Showing students with active mentor coverage.");
    return;
  }
  if (section === "mentorAssignments" && button.dataset.sectionPreset === "mentor-workload") {
    const mentorUserId = cleanDirectoryFilter(button.dataset.mentorId);
    if (!mentorUserId) return;
    mentorAssignmentFilters = {
      ...defaultMentorAssignmentFilters(),
      mentorUserId,
      status: "active",
    };
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Showing this mentor's active student load.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "all-students") {
    siteStudentFilters = defaultSiteStudentFilters();
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState({ clearFilters: true });
    await loadWorkspaceData("Showing all students in this school workspace.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "on-track-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      progressStatus: "on_track",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students currently on track.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "behind-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      progressStatus: "behind",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students who need support.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "mentor-meeting-follow-up-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      progressStatus: "mentor_meeting_follow_up",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students with mentor meeting follow-up.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "missing-mentors") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      noMentor: true,
      progressStatus: "missing_mentor",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students missing mentors.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "missing-evidence-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      evidenceStatus: "missing",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students missing evidence.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "needs-review-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      reviewStatus: "needs_review",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students with work needing review.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "submitted-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      status: "submitted",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students with submitted work.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "revision-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      status: "revision_requested",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students who need revision follow-up.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "high-risk-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      risk: "high",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing high-risk students.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "presentation-pending-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      presentationStatus: "pending",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students with presentation follow-up.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "archive-ready-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      archiveStatus: "ready",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students ready for final-file closeout.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "archive-failed-students") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      archiveStatus: "failed",
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students needing archive follow-up.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "program") {
    const programId = cleanDirectoryFilter(button.dataset.programId);
    if (!programId) return;
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      programId,
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students in the selected program.");
    return;
  }
  if (section === "students" && button.dataset.sectionPreset === "status-breakdown") {
    const status = canonicalReviewQueueValue(normalizeStatus(button.dataset.statusFilter), SITE_STUDENT_STATUS_VALUES);
    if (!status) return;
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      status,
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData(`Showing ${statusText(status)} students.`);
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "submitted") {
    const selectedSubmissionId = cleanDirectoryFilter(button.dataset.reviewSubmissionId || "");
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      status: "submitted",
    };
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId,
    };
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing submitted work ready for review.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "revision-requested") {
    const selectedSubmissionId = cleanDirectoryFilter(button.dataset.reviewSubmissionId || "");
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      status: "revision_requested",
    };
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId,
    };
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing revision follow-up.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "high-risk") {
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      risk: "high",
    };
    reviewQueueState = defaultReviewQueueState();
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing high-risk review work.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "stale-review") {
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      risk: "stale",
    };
    reviewQueueState = defaultReviewQueueState();
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing review work with stale activity.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "missing-mentor-review") {
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      risk: "no_mentor",
    };
    reviewQueueState = defaultReviewQueueState();
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing review work for students missing mentor coverage.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "evidence-attached-review") {
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      evidenceStatus: "attached",
    };
    reviewQueueState = defaultReviewQueueState();
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing review work with evidence attached.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "evidence-missing-review") {
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      evidenceStatus: "missing",
    };
    reviewQueueState = defaultReviewQueueState();
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing review work missing evidence.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "presentation-pending") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      presentationStatus: "pending",
      readiness: "attention_required",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing presentation readiness follow-up.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "presentation-attention") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      presentationStatus: "attention_required",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing presentation check-in follow-up.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-failed") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "failed",
      readiness: "blocked",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing archive follow-up.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-in-progress") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "in_progress",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing final-file packages being prepared.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-expiring-soon") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "expiring_soon",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing final-file packages with download windows ending soon.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-expired") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "expired",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing final-file packages with expired download windows.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-provider-unavailable") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "provider_unavailable",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing final-file rows waiting on storage setup.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "needs-attention") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      needsAttention: true,
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing operations rows that need attention.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "stale-activity") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      risk: "stale",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing students with stale activity.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "outline-pending") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      outlineAttention: true,
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing presentation outline follow-up.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "evidence-missing") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      readiness: "missing",
      category: "evidence",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing students missing evidence or submission progress.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "program-breakdown") {
    const programId = cleanDirectoryFilter(button.dataset.programId);
    if (!programId) return;
    operationsReadinessFilters = {
      ...operationsReadinessFilters,
      programId,
      offset: 0,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing operations rows for the selected program.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "presentation-snapshot") {
    const presentationStatus = canonicalReviewQueueValue(button.dataset.presentationStatus, OPERATIONS_PRESENTATION_STATUS_VALUES);
    if (!presentationStatus) return;
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      presentationStatus,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult(`Showing ${statusText(presentationStatus).toLowerCase()} presentation rows.`);
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-snapshot") {
    const archiveStatus = canonicalReviewQueueValue(button.dataset.archiveStatus, OPERATIONS_ARCHIVE_STATUS_VALUES);
    if (!archiveStatus) return;
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult(`Showing ${statusText(archiveStatus).toLowerCase()} final-file rows.`);
    return;
  }
  if (section === "archiveExports") {
    if (button.dataset.sectionPreset) {
      const presetMap = {
        "all-exports": "all",
        "failed-exports": "failed",
        "in-progress-exports": "in_progress",
        "complete-exports": "complete",
      };
      adminArchiveExportFilter = cleanAdminArchiveExportFilter(presetMap[button.dataset.sectionPreset] || button.dataset.sectionPreset || "all");
    }
    activeSection = "archiveExports";
    syncAdminArchiveExportUrlState({ clearFilters: adminArchiveExportFilter === "all" });
    renderAppShell();
    return;
  }
  if (section === "audit") {
    adminAuditFilters = {
      ...defaultAdminAuditFilters(),
      action: cleanAdminAuditFilter(button.dataset.auditAction),
      entityType: cleanAdminAuditFilter(button.dataset.auditEntityType),
    };
    activeSection = "audit";
    syncAdminAuditUrlState({ clearFilters: !adminAuditFilters.action && !adminAuditFilters.entityType });
    await loadAdminAuditEventsResult(adminAuditFilters.action || adminAuditFilters.entityType
      ? "Showing matching audit activity."
      : "Showing recent audit activity.");
    return;
  }
  if (section === "presentation" && button.dataset.sectionPreset) {
    const presetMap = {
      "ready-for-check-out": "scheduled",
      "checked-out": "checked_out",
      "checked-in": "checked_in",
      "outline-follow-up": "outline_follow_up",
    };
    presentationSlotFilter = cleanPresentationSlotFilter(presetMap[button.dataset.sectionPreset] || button.dataset.sectionPreset || "all");
    activeSection = "presentation";
    syncPresentationScheduleUrlState({ clearFilters: presentationSlotFilter === "all" });
    renderAppShell();
    return;
  }
  activeSection = section;
  syncCurrentWorkspaceUrlState();
  renderAppShell();
}

function screenOrientationFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const orientations = {
    overview: {
      title: "Overview",
      useFor: "See the highest-priority student work for your access.",
      start: primaryRole === "student" ? "Read Profile, then open My Work." : "Open the first action that matches your job today.",
      notFor: "Do not treat a summary count as a saved record change.",
    },
    profile: {
      title: "Profile",
      useFor: "Learn what your role can see and do.",
      start: "Read the three columns, then choose a role action.",
      notFor: "Do not change student, account, or review records here.",
    },
    siteDashboard: {
      title: "Site Dashboard",
      useFor: "School-wide health and urgent follow-up.",
      start: "Use urgent tiles and first-day setup before expanding details.",
      notFor: "Do not edit records from summary-only rows.",
    },
    programs: {
      title: "Programs",
      useFor: "Choose which programs are active for the selected school.",
      start: "Check Active programs before adding another program.",
      notFor: "Do not create user accounts or mentor assignments here.",
    },
    students: {
      title: "Students",
      useFor: "Find student records you are allowed to view.",
      start: "Search or pick a saved filter, then open one student.",
      notFor: "Do not make Program Teacher review decisions here.",
    },
    student: {
      title: primaryRole === "student" ? "My Work" : "Student Workspace",
      useFor: primaryRole === "student" ? "See what to do next, what this phase must finish, and what file or feedback needs action." : "Follow the student's Senior Project checklist.",
      start: primaryRole === "student" ? "Read Do this next, then open the current phase item." : "Read Do this next before opening every panel.",
      notFor: primaryRole === "student" ? "Do not start the next phase until your teacher says it is ready." : "Do not start a new phase before Program Teacher approval.",
    },
    archive: {
      title: "Final Files",
      useFor: "Check May 5 final-file readiness and downloads.",
      start: "Read the issue or ready state before downloading.",
      notFor: primaryRole === "student" ? "Do not assume files are ready until this screen says your download is ready." : "Do not assume files are ready while staff prep is failed or pending.",
    },
    mentorDashboard: {
      title: "Mentor Dashboard",
      useFor: "Find the assigned student who needs mentor support first.",
      start: "Use focus filters, then open the suggested meeting plan.",
      notFor: "Do not review Program Teacher submissions here.",
    },
    mentor: {
      title: "Assigned Students",
      useFor: "Review assigned students and meeting context.",
      start: "Open one assigned student card and record the next check-in.",
      notFor: "Do not manage mentor assignments here.",
    },
    programDashboard: {
      title: "Program Dashboard",
      useFor: "Find your students who need Program Teacher attention.",
      start: "Start with students who turned in work or are missing files.",
      notFor: "Do not manage global or school account access here.",
    },
    teacher: {
      title: "Review Work",
      useFor: "Review work students sent in.",
      start: "Start with waiting work, then open one student row.",
      notFor: "Do not approve missing work or handle several students at once.",
    },
    mentorAssignments: {
      title: "Mentor Assignments",
      useFor: "Assign one mentor to one student when coverage is missing.",
      start: "Use the guided assignment form after confirming the student row.",
      notFor: "Do not grant broad account roles here.",
    },
    operations: {
      title: "Operations",
      useFor: "Triage presentation, final-file, and readiness issues.",
      start: "Use the ranked actions before opening longer worklists.",
      notFor: "Do not mark completion from this summary.",
    },
    presentation: {
      title: "Presentation",
      useFor: primaryRole === "student" ? "Check your presentation time, room, outline status, and check-in status." : "Manage presentation schedule, outline, and day-of status.",
      start: primaryRole === "student" ? "Read your time, room, and outline status before presentation day." : "Filter to the day or status you are working now.",
      notFor: primaryRole === "student" ? "Do not use Presentation as checklist approval; missing Drive links stay in My Project." : "Do not make Program Teacher review decisions here.",
    },
    adminDashboard: {
      title: "Admin Command Center",
      useFor: "Watch platform-level health and risky work queues.",
      start: "Open the highest-risk card, then drill into the source screen.",
      notFor: "Do not change school data from summary counts alone.",
    },
    readiness: {
      title: "Readiness",
      useFor: "Review aggregate readiness without exposing private files.",
      start: "Check issue labels before sharing a summary.",
      notFor: "Do not use aggregate rows as student-detail evidence.",
    },
    adminUsers: {
      title: "Users & Access",
      useFor: "Create or change access only after school access is clear.",
      start: "Review current access and preflight checks before saving.",
      notFor: "Do not create real accounts without approved setup-password delivery.",
    },
    audit: {
      title: "Audit",
      useFor: "Review access, roles, assignments, and recent changes while staying redacted.",
      start: "Open saved filters and anomaly cards first.",
      notFor: "Do not expose private notes, file links, tokens, or Drive identifiers.",
    },
    archiveExports: {
      title: "Final Files",
      useFor: "Track final-file package requests and failures.",
      start: "Filter failed, pending, or complete rows before follow-up.",
      notFor: "Do not promise readiness until a package is complete.",
    },
    security: {
      title: hasGlobalAdminRole(roles) ? "Security" : "Account",
      useFor: primaryRole === "student" ? "Change your own password and understand what signs out." : "Manage your own password and session.",
      start: primaryRole === "student" ? "Make sure this is your account, then use the password form only if you know the current password." : "Change your password or sign out when the session needs attention.",
      notFor: "Do not manage other users from this screen.",
    },
  };
  return orientations[sectionId] || orientations.overview;
}

function roleStartActions(primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  if (primaryRole === "student" || roles.has("student")) {
    return [
      { label: "Open My Work", section: "student" },
      { label: "Check presentation", section: "presentation" },
      { label: "Check final files", section: "archive" },
    ];
  }
  if (primaryRole === "mentor" || roles.has("mentor")) {
    return [
      { label: "Open Mentor Dashboard", section: "mentorDashboard" },
      { label: "Open Assigned Students", section: "mentor" },
      { label: "Check presentation", section: "presentation" },
    ];
  }
  if (primaryRole === "program_teacher" || roles.has("program_teacher")) {
    return [
      { label: "Open Program Dashboard", section: "programDashboard" },
      { label: "Review work", section: "teacher", preset: "submitted" },
      { label: "Find missing work", section: "students", preset: "missing-evidence-students" },
    ];
  }
  if (roles.has("viewer")) {
    return [
      { label: "Open Student Directory", section: "students", preset: "all-students" },
      { label: "Review profile", section: "profile" },
      { label: "Open Account", section: "security" },
    ];
  }
  if (roles.has("misc_admin")) {
    return [
      { label: "Open Readiness", section: "readiness" },
      { label: "Review profile", section: "profile" },
      { label: "Open Account", section: "security" },
    ];
  }
  if (hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration")) {
    return [
      { label: "Open Site Dashboard", section: "siteDashboard" },
      { label: "Find missing mentors", section: "students", preset: "missing-mentors" },
      { label: "Open Operations", section: "operations", preset: "needs-attention" },
    ];
  }
  return [
    { label: "Review profile", section: "profile" },
    { label: "Open Account", section: "security" },
  ];
}

function screenOrientationActionCandidates(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const actionsBySection = {
    overview: roleStartActions(primaryRole, roles),
    profile: roleStartActions(primaryRole, roles),
    siteDashboard: [
      { label: "Find missing mentors", section: "students", preset: "missing-mentors" },
      { label: "Review work", section: "teacher", preset: "submitted" },
      { label: "Review final-file failures", section: "operations", preset: "archive-failed" },
    ],
    programs: [
      { label: "Back to Site Dashboard", section: "siteDashboard" },
      { label: "Open Users & Access", section: "adminUsers" },
      { label: "Open Security", section: "security" },
    ],
    students: [
      { label: "Find missing mentors", section: "students", preset: "missing-mentors" },
      { label: "Find submitted work", section: "students", preset: "submitted-students" },
      { label: "Find high-risk students", section: "students", preset: "high-risk-students" },
    ],
    student: [
      { label: "Check presentation", section: "presentation" },
      { label: "Check final files", section: "archive" },
      { label: "Open Account", section: "security" },
    ],
    archive: [
      { label: primaryRole === "student" ? "Open My Work" : "Open Student Workspace", section: "student" },
      { label: "Check presentation", section: "presentation" },
      { label: "Open Account", section: "security" },
    ],
    mentorDashboard: [
      { label: "Open Assigned Students", section: "mentor" },
      { label: "Check presentation", section: "presentation" },
      { label: "Open Account", section: "security" },
    ],
    mentor: [
      { label: "Open Mentor Dashboard", section: "mentorDashboard" },
      { label: "Check presentation", section: "presentation" },
      { label: "Open Account", section: "security" },
    ],
    programDashboard: [
      { label: "Review work", section: "teacher", preset: "submitted" },
      { label: "Review revisions", section: "teacher", preset: "revision-requested" },
      { label: "Find missing work", section: "students", preset: "missing-evidence-students" },
    ],
    teacher: [
      { label: "Needs review", section: "teacher", preset: "submitted" },
      { label: "Revision follow-up", section: "teacher", preset: "revision-requested" },
      { label: "Files attached", section: "teacher", preset: "evidence-attached-review" },
    ],
    mentorAssignments: [
      { label: "Students without mentors", section: "mentorAssignments", preset: "no-mentor" },
      { label: "Active assignments", section: "mentorAssignments", preset: "active-assignments" },
      { label: "Open Student Directory", section: "students", preset: "missing-mentors" },
    ],
    operations: [
      { label: "Presentation follow-up", section: "operations", preset: "presentation-pending" },
      { label: "Final-file failures", section: "operations", preset: "archive-failed" },
      { label: "Missing work", section: "operations", preset: "evidence-missing" },
    ],
    presentation: primaryRole === "student"
      ? [
          { label: "Open My Work", section: "student" },
          { label: "Check final files", section: "archive" },
          { label: "Open Account", section: "security" },
        ]
      : [
          { label: "Outline follow-up", section: "presentation", preset: "outline-follow-up" },
          { label: "Ready for check-out", section: "presentation", preset: "ready-for-check-out" },
          { label: "Open Operations", section: "operations", preset: "presentation-pending" },
        ],
    adminDashboard: [
      { label: "Open Site Dashboard", section: "siteDashboard" },
      { label: "Open Audit", section: "audit" },
      { label: "Failed final files", section: "archiveExports", preset: "failed-exports" },
    ],
    readiness: [
      { label: "Open Operations", section: "operations", preset: "needs-attention" },
      { label: "Open Site Dashboard", section: "siteDashboard" },
      { label: "Open Student Directory", section: "students", preset: "all-students" },
    ],
    adminUsers: [
      { label: "Review current school", section: "siteDashboard" },
      { label: "Review profile", section: "profile" },
      { label: "Open Security", section: "security" },
    ],
    audit: [
      { label: "Recent activity", section: "audit" },
      { label: "Student dashboard activity", section: "audit", auditAction: "student_dashboard_viewed", auditEntityType: "student_dashboard" },
      { label: "Review work activity", section: "audit", auditAction: "review_queue_viewed", auditEntityType: "review_queue" },
    ],
    archiveExports: [
      { label: "Failed packages", section: "archiveExports", preset: "failed-exports" },
      { label: "Packages in progress", section: "archiveExports", preset: "in-progress-exports" },
      { label: "Complete packages", section: "archiveExports", preset: "complete-exports" },
    ],
    security: [
      { label: "Review profile", section: "profile" },
      { label: "Open Overview", section: "overview" },
    ],
  };
  return actionsBySection[sectionId] || roleStartActions(primaryRole, roles);
}

function screenOrientationActionsFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set([
    ...sections.map((section) => section.id),
    ...availableSectionIdsForAnyMode(),
  ]);
  const seen = new Set();
  return screenOrientationActionCandidates(sectionId, primaryRole, roles)
    .filter((action) => action?.section && allowedIds.has(action.section))
    .filter((action) => {
      const key = [action.section, action.preset || "", action.auditAction || "", action.auditEntityType || ""].join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function renderScreenOrientationAction(action, index) {
  const attrs = [
    'data-screen-orientation-action="true"',
    `data-screen-orientation-action-index="${index + 1}"`,
    `data-section="${escapeHtml(action.section)}"`,
  ];
  if (action.preset) attrs.push(`data-section-preset="${escapeHtml(action.preset)}"`);
  if (action.auditAction) attrs.push(`data-audit-action="${escapeHtml(action.auditAction)}"`);
  if (action.auditEntityType) attrs.push(`data-audit-entity-type="${escapeHtml(action.auditEntityType)}"`);
  return `
    <button class="workspace-button workspace-button-secondary workspace-screen-orientation-action" type="button" ${attrs.join(" ")}>
      ${escapeHtml(action.label)}
    </button>
  `;
}

function renderScreenOrientation(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const actions = screenOrientationActionsFor(activeId, primaryRole, roles, sections);
  return `
    <section class="workspace-screen-orientation" data-screen-orientation="true" data-screen-orientation-section="${escapeHtml(activeId)}" aria-label="${escapeHtml(`${orientation.title} screen guide`)}">
      <div class="workspace-screen-orientation-head">
        <p class="workspace-kicker">Current screen</p>
        <h2>${escapeHtml(orientation.title)}</h2>
      </div>
      <div class="workspace-screen-orientation-grid">
        <div class="workspace-screen-orientation-item">
          <span>Use this for</span>
          <strong>${escapeHtml(orientation.useFor)}</strong>
        </div>
        <div class="workspace-screen-orientation-item">
          <span>Start here</span>
          <strong>${escapeHtml(orientation.start)}</strong>
        </div>
        <div class="workspace-screen-orientation-item">
          <span>Not for</span>
          <strong>${escapeHtml(orientation.notFor)}</strong>
        </div>
      </div>
      ${actions.length ? `
        <div class="workspace-screen-orientation-actions" data-screen-orientation-actions="true" aria-label="Suggested next clicks">
          <span>Suggested next clicks</span>
          <div>
            ${actions.map((action, index) => renderScreenOrientationAction(action, index)).join("")}
          </div>
        </div>
      ` : ""}
    </section>
  `;
}

function screenLanguageTermsFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const termsBySection = {
    overview: [
      ["Signal", "A number or row that points to work. It does not save or change any record by itself."],
      ["Access", "The role and access settings that decide which students, schools, and actions you can use."],
      ["Next step", "The safest place to start from your current role today."],
    ],
    profile: [
      ["Role", "The job the app thinks you have, such as Student, Mentor, Program Teacher, Site Admin, or Viewer."],
      ["Access area", "The school, program, cohort, student, or platform area your role is allowed to see."],
      ["Read-only", "You can monitor records, but an authorized staff member must make changes."],
    ],
    siteDashboard: [
      ["Urgent tile", "A summary tile that points to student or school follow-up needing attention."],
      ["First-day setup", "The school checks that should be true before staff trust the workspace for daily use."],
      ["School-wide", "This screen summarizes one selected school, not every school unless your access says so."],
    ],
    programs: [
      ["Active program", "A program currently used at the selected school."],
      ["Available program", "A program that can be added to the selected school when the school is ready for it."],
      ["Site program", "A school-level program setting; it is separate from user roles and mentor assignments."],
    ],
    students: [
      ["Saved filter", "A ready-made view that narrows the directory to one kind of follow-up."],
      ["High risk", "A student row with multiple warning signals or stale progress that needs closer review."],
      ["Missing proof", "The student has not attached or linked the evidence needed for the listed requirement."],
    ],
    student: [
      ["Current phase deliverable", "The main thing this phase must finish before you move on."],
      ["File or link", "The file, link, or note that shows one checklist item is complete."],
      ["Teacher check", "The review step that decides whether waiting work is done or needs changes."],
    ],
    archive: [
      ["Final files", primaryRole === "student" ? "The Senior Project files you need to save before school account access closes." : "The finished Senior Project package prepared for end-of-year handoff."],
      ["Download window", primaryRole === "student" ? "The time you have to save a ready download." : "The time period when the package is available for the student to download."],
      [primaryRole === "student" ? "Download status" : "Package status", primaryRole === "student" ? "Whether your final files are ready, still being prepared, blocked, expired, or waiting for staff." : "Whether the final-file package is ready, still running, failed, expired, or waiting on setup."],
    ],
    mentorDashboard: [
      ["Focus filter", "A shortcut that shows assigned students needing the same kind of mentor attention."],
      ["Meeting plan", "A suggested check-in topic based on the student's latest signals."],
      ["Revision signal", "A reminder that the student may need support before sending corrected work again."],
    ],
    mentor: [
      ["Assigned student", "A student connected to you for mentor support."],
      ["Meeting record", "The note that captures the purpose, status, and follow-up from a mentor check-in."],
      ["Follow-up", "The next support step after the meeting, not a Program Teacher approval decision."],
    ],
    programDashboard: [
      ["Review-first list", "The Program Teacher work that should be checked before browsing wider cohort details."],
      ["Cohort", "The students grouped under your assigned program or class group."],
      ["Manual gate", "A decision point that needs Program Teacher approval before a student moves on."],
    ],
    teacher: [
      ["Sent item", "An item a student sent for Program Teacher review."],
      ["Decision", "Approve, request revision, or use the available review option after checking proof and history."],
      ["Proof history", "The files, links, versions, notes, and past decisions connected to the selected item."],
    ],
    mentorAssignments: [
      ["Coverage", "Whether a student has an active mentor assignment."],
      ["Active mentor load", "How many students a mentor is already supporting right now."],
      ["Assignment reason", "The plain-language note explaining why this student and mentor should be connected."],
    ],
    operations: [
      ["Ranked action", "A sorted follow-up recommendation for presentation, proof, readiness, or final-file blockers."],
      ["Readiness blocker", "Something that can stop a student or school from being considered ready."],
      ["Owner", "The person or role responsible for the next move."],
    ],
    presentation: [
      ["Check-out", primaryRole === "student" ? "A staff day-of status that may appear when your presentation starts." : "The day-of presentation step when a scheduled student starts or leaves for the slot."],
      ["Check-in", primaryRole === "student" ? "A staff day-of status that confirms your presentation row is finished." : "The day-of presentation step confirming the student came back or completed the slot."],
      ["Outline", primaryRole === "student" ? "Your presentation plan. Fix outline feedback before presentation day." : "The presentation plan or prep item that may still need follow-up before the slot."],
    ],
    adminDashboard: [
      ["Platform risk", "A cross-school or system-level signal that should be investigated from its source screen."],
      ["Source screen", "The workspace section where the real records and actions live."],
      ["Protected activity", "A logged event involving private student, review, account, or file-related data."],
    ],
    readiness: [
      ["Aggregate", "A summary across records; it is not a private student-detail view."],
      ["Private files", "Student files, links, notes, or protected details that should not be exposed in broad reports."],
      ["Readiness score", "A directional summary of visible completion and blocker signals."],
    ],
    adminUsers: [
      ["Smallest role", "The lowest access level that lets the person do the job."],
      ["Access area", "The exact school, program, cohort, student, or platform area tied to the access change."],
      ["Setup password", "A short-lived password that lets a person make their own password."],
    ],
    audit: [
      ["Redacted", "Private details are intentionally hidden so the event can be reviewed safely."],
      ["Anomaly", "A pattern or count that may need account, proof, review, or security follow-up."],
      ["Protected record", "Student, review, file, account, or access data that should stay private."],
    ],
    archiveExports: [
      ["Export package", "The prepared final-file package for a student."],
      ["Failed package", "A package request that did not finish and needs staff follow-up before handoff."],
      ["Complete package", "A package row that finished successfully and can be handled through protected download surfaces."],
    ],
    security: [
      ["Session", "Your current signed-in browser access."],
      ["Password change", "A personal account update that closes other active sessions when it succeeds."],
      ["Sign out", "The safe way to end your current workspace session."],
    ],
  };
  const terms = termsBySection[sectionId] || termsBySection.overview;
  if (primaryRole === "student" && sectionId === "overview") {
    return [
      ["My Work", "The main place to see your next Senior Project task, phase deliverable, proof, feedback, and approval status."],
      ...terms.slice(0, 2),
    ];
  }
  if (roles.has("viewer") && sectionId === "overview") {
    return [
      ["Monitoring", "Watching progress without changing records."],
      ...terms.slice(0, 2),
    ];
  }
  return terms;
}

function renderScreenLanguageGuide(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const terms = screenLanguageTermsFor(activeId, primaryRole, roles).filter(Boolean).slice(0, 3);
  if (!terms.length) return "";
  return `
    <details class="workspace-language-guide" data-screen-language-guide="${escapeHtml(activeId)}">
      <summary>
        <span>Words on this screen</span>
        <strong>${escapeHtml(orientation.title)}</strong>
        <small>${escapeHtml(terms.length)} plain-language terms</small>
      </summary>
      <div class="workspace-language-grid">
        ${terms.map((term) => {
          const label = Array.isArray(term) ? term[0] : term?.label;
          const detail = Array.isArray(term) ? term[1] : term?.detail;
          const key = String(label || "term").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "term";
          return `
            <article class="workspace-language-term" data-language-term="${escapeHtml(key)}">
              <span>${escapeHtml(label || "Term")}</span>
              <p>${escapeHtml(detail || "Plain-language explanation for this screen.")}</p>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function screenActionImpactsFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const impactsBySection = {
    overview: [
      ["Source-screen links", "Summary cards and suggested clicks move you to the screen where the real work happens.", "route"],
      ["Refresh", "Refresh reloads workspace data without changing student, review, account, or file records.", "safe"],
      ["Navigation", "Changing screens keeps the same clean browser address. Back and Forward still move through your recent screens.", "safe"],
    ],
    profile: [
      ["Role actions", "Buttons open workspace sections that match your access.", "route"],
      ["No record changes", "Reading this profile does not edit student, account, review, or mentor records.", "safe"],
      ["Access concern", "If what this account can see or change looks wrong, ask the account owner listed by your school process.", "context"],
    ],
    siteDashboard: [
      ["Metric buttons", "Tiles open filtered student, review, mentor, or operations screens.", "route"],
      ["Details", "Opening details reveals rows and context; it does not save changes.", "safe"],
      ["Source screens", "Assignments, reviews, accounts, and file handoff changes happen after you open the right source screen.", "context"],
    ],
    programs: [
      ["Program add form", "The add form saves a school-program setting after a current school is selected.", "changes"],
      ["Program removal", "The removal form changes the selected school's active program list.", "changes"],
      ["Not account work", "Program forms do not create users, reset passwords, or assign mentors.", "safe"],
    ],
    students: [
      ["Search and filters", "These narrow the directory without changing the browser address.", "safe"],
      ["Open student", "Opening a student loads the detail panel for one allowed record.", "route"],
      ["No review save", "Program Teacher review decisions are saved from Review Work, not from the directory list.", "context"],
    ],
    student: [
      ["Open current item", "Open the checklist item for the current phase before adding a file or link or turning in work.", "safe"],
      ["Add file or link", "Files and links are saved to the exact checklist item you selected.", "changes"],
      ["Turn in", "Turning in work moves that item to teacher review. Wait for feedback before moving on.", "changes"],
    ],
    archive: [
      ["Download", primaryRole === "student" ? "Download starts protected final-file retrieval when your download is ready." : "Download starts protected final-file retrieval when a package is ready.", "changes"],
      [primaryRole === "student" ? "Blocked downloads" : "Blocked packages", primaryRole === "student" ? "Blocked or failed states explain the issue; this student screen does not restart a download." : "Blocked or failed states explain the issue; this student screen does not retry package generation.", "safe"],
      ["Suggested clicks", primaryRole === "student" ? "My Work, Presentation, and Account clicks only change screens." : "Student Workspace, Presentation, and Account clicks only change screens.", "route"],
    ],
    mentorDashboard: [
      ["Focus filters", "Filters narrow assigned students without changing records.", "safe"],
      ["Open detail", "Detail clicks load student context you are allowed to mentor.", "route"],
      ["Meeting follow-up", "Meeting notes are saved from the meeting form, not from dashboard filters.", "context"],
    ],
    mentor: [
      ["Open assigned student", "Opening a card shows context for a student already assigned to you.", "route"],
      ["Record meeting", "Submitting the meeting form saves the mentor check-in note.", "changes"],
      ["Assignments", "This screen does not add or remove mentor assignments.", "safe"],
    ],
    programDashboard: [
      ["Review shortcuts", "Review-first rows open the queue or student detail for students this role can see.", "route"],
      ["Summary rows", "Program summary rows do not approve, reject, or request revision.", "safe"],
      ["Decision point", "Use Review Work after checking proof and history when a decision is needed.", "context"],
    ],
    teacher: [
      ["Filters", "Review filters only change which rows are visible.", "safe"],
      ["Select row", "Selecting a row opens proof, history, and the decision area for that item.", "route"],
      ["Save decision", "The decision form records the Program Teacher outcome when your role is allowed to decide.", "changes"],
    ],
    mentorAssignments: [
      ["Filters", "Coverage filters only narrow which students and mentors are visible.", "safe"],
      ["Save assignment", "The assignment form connects one active mentor to one student.", "changes"],
      ["No account changes", "Mentor assignment does not create accounts, change roles, or message families.", "safe"],
    ],
    operations: [
      ["Ranked actions", "Ranked actions open filtered worklists for the selected blocker type.", "route"],
      ["Rows", "Operations rows are monitoring and handoff context, not completion toggles.", "safe"],
      ["Owner handoff", "Use the listed owner and source screen when a saved change is needed.", "context"],
    ],
    presentation: [
      ["Schedule filters", primaryRole === "student" ? "Filters narrow your presentation rows without changing your schedule." : "Filters narrow presentation rows without changing the schedule.", "safe"],
      [primaryRole === "student" ? "Day-of status" : "Check-out or check-in", primaryRole === "student" ? "Students can read check-out and check-in status here; staff controls are not shown." : "Day-of controls change the selected presentation slot status.", primaryRole === "student" ? "safe" : "changes"],
      ["Review decisions", "Presentation actions do not approve Senior Project checklist work.", "safe"],
    ],
    adminDashboard: [
      ["Risk cards", "Cards and quick actions route you to the screen where the real records live.", "route"],
      ["Summary counts", "Command Center counts do not edit school, user, or file records.", "safe"],
      ["Protected drilldowns", "Audit and final-file follow-up stays behind role-gated source screens.", "context"],
    ],
    readiness: [
      ["Reports", "Readiness reports summarize visible records without exposing private proof.", "safe"],
      ["Open source", "Use suggested clicks to move from aggregate reporting into allowed worklists.", "route"],
      ["No direct save", "This report screen does not change student progress or review status.", "safe"],
    ],
    adminUsers: [
      ["Create or import", "Account creation and import forms save users, roles, and school, program, or student access.", "changes"],
      ["Current access", "Current access shows what exists before you edit or remove anything.", "context"],
      ["Profile and Security links", "Profile and Security clicks are safe navigation before risky account work.", "route"],
    ],
    audit: [
      ["Filters", "Audit filters narrow logged activity without changing the records.", "safe"],
      ["Events", "Events stay redacted so private notes, file links, and Drive identifiers are not exposed.", "safe"],
      ["Follow-up", "Account, access, review, storage, or package fixes happen in the source screen, not in the log.", "context"],
    ],
    archiveExports: [
      ["Package filters", "Filters narrow package rows by failed, in-progress, or complete status.", "safe"],
      ["Downloads", "Download actions use protected package surfaces when a package is complete.", "changes"],
      ["Failed rows", "Failed package rows need staff follow-up; no retry action is shown here.", "context"],
    ],
    security: [
      ["Change password", "The password form changes your signed-in account when it succeeds.", "changes"],
      ["Sign out", "Sign out ends the current browser session.", "changes"],
      ["Profile or Overview", "Profile and Overview clicks only move you to safer context screens.", "route"],
    ],
  };
  const impacts = impactsBySection[sectionId] || impactsBySection.overview;
  if (primaryRole === "student" && sectionId === "overview") {
    return [
      ["Open My Work", "This takes you to your own checklist, current phase deliverable, proof, feedback, and approval status.", "route"],
      ...impacts.slice(1, 3),
    ];
  }
  if (roles.has("viewer") && sectionId === "overview") {
    return [
      ["Monitoring clicks", "Viewer clicks open allowed monitoring screens and do not save records.", "safe"],
      ...impacts.slice(1, 3),
    ];
  }
  return impacts;
}

function renderScreenActionImpactGuide(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const impacts = screenActionImpactsFor(activeId, primaryRole, roles).filter(Boolean).slice(0, 3);
  if (!impacts.length) return "";
  return `
    <details class="workspace-action-impact-guide" data-screen-action-impact-guide="${escapeHtml(activeId)}">
      <summary>
        <span>What clicks do here</span>
        <strong>${escapeHtml(orientation.title)}</strong>
        <small>${escapeHtml(impacts.length)} click effects</small>
      </summary>
      <div class="workspace-action-impact-grid">
        ${impacts.map((impact) => {
          const label = Array.isArray(impact) ? impact[0] : impact?.label;
          const detail = Array.isArray(impact) ? impact[1] : impact?.detail;
          const state = normalizeStatus(Array.isArray(impact) ? impact[2] : impact?.state || "context") || "context";
          const key = String(label || "action").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "action";
          return `
            <article class="workspace-action-impact-item" data-action-impact="${escapeHtml(key)}" data-action-impact-state="${escapeHtml(state)}">
              <span>${escapeHtml(label || "Click effect")}</span>
              <p>${escapeHtml(detail || "This explains whether the click changes records, filters a view, or opens another screen.")}</p>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function screenVisibilityNotesFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const notesBySection = {
    overview: [
      ["Your access", "The page only offers screens your signed-in account is allowed to open.", "self"],
      ["Summary only", "Overview numbers summarize work and point to source screens before any protected detail is shown.", "context"],
      ["Private files", "Student files, links, notes, and review details stay in the allowed student or review screens.", "private"],
    ],
    profile: [
      ["You and authorized staff", "Profile details explain your account access for you and staff who manage workspace accounts.", "shared"],
      ["No student proof here", "This screen does not show student files, links, review history, or private project notes.", "private"],
      ["Access questions", "Use this page to spot access concerns before asking an authorized account owner for help.", "context"],
    ],
    siteDashboard: [
      ["School staff view", "This dashboard is for staff allowed to monitor the selected school's capstone work.", "staff"],
      ["Summary counts", "Tiles and rows summarize school follow-up without exposing full private files or notes.", "context"],
      ["Private files hidden", "Open the allowed source screen before reading student files, review detail, or final-file context.", "private"],
    ],
    programs: [
      ["School setup staff", "Program settings are visible to staff approved to manage the selected school's setup.", "staff"],
      ["Program list only", "This screen shows school-program availability, not private student progress or account details.", "context"],
      ["No account details", "User names, passwords, and mentor assignments stay on their own protected screens.", "private"],
    ],
    students: [
      ["Allowed student records", "The directory only lists students your account can monitor or support.", "staff"],
      ["Directory summaries", "Rows show progress and risk signals before private proof or review history is opened.", "context"],
      ["Private files stay protected", "Files, links, and detailed notes stay in student detail, review, or download surfaces.", "private"],
    ],
    student: [
      ["You and your teacher", "This screen is centered on your own Senior Project work and the staff who can review or support it.", "self"],
      ["File visibility", "Files and links you add are visible to you and staff who are allowed to review or support that work.", "shared"],
      ["Mentor view", "Mentors see support context only when they are assigned to you.", "staff"],
    ],
    archive: [
      ["Student download", primaryRole === "student" ? "Final-file details are centered on your own Senior Project files." : "Final-file download details are centered on the signed-in student's own package.", "self"],
      ["Staff help status", primaryRole === "student" ? "Staff may see download status so they can help you save final files." : "Authorized staff may see package readiness so they can complete end-of-year handoff.", "staff"],
      ["Private file details", "Protected file contents stay behind the final-file download process.", "private"],
    ],
    mentorDashboard: [
      ["Assigned mentor view", "Mentors see only students assigned to them plus the signals needed for support.", "staff"],
      ["Student support context", "Risk and meeting-plan details are for coaching, not Program Teacher approval.", "context"],
      ["No full directory", "The mentor dashboard does not expose every student at the school.", "private"],
    ],
    mentor: [
      ["Assigned students only", "Mentor cards and meeting tools stay limited to students assigned to that mentor.", "staff"],
      ["Meeting notes", "Meeting records are staff support notes tied to the assigned student.", "shared"],
      ["Program Teacher review separate", "Mentor notes do not replace Program Teacher feedback or approval decisions.", "context"],
    ],
    programDashboard: [
      ["Assigned students", "Program Teachers see cohort and review signals for students within their allowed program area.", "staff"],
      ["Program Teacher work", "Review work and risk lists are for school staff responsible for project approval.", "context"],
      ["No global account details", "This screen does not show password, global audit, or unrelated school account data.", "private"],
    ],
    teacher: [
      ["Program Teacher reviewers", "Review Work items are visible to Program Teachers and authorized school staff for the student.", "staff"],
      ["Student-visible feedback", "Approval and revision feedback can be read by the student after the decision is saved.", "shared"],
      ["Staff-only notes", "Internal review context stays for staff follow-up and is not a student message.", "private"],
    ],
    mentorAssignments: [
      ["Coverage staff", "Mentor assignment details are for staff approved to manage student support coverage.", "staff"],
      ["Assignment reason", "The reason explains the staff support decision and should stay tied to the assignment workflow.", "context"],
      ["No family message", "Saving an assignment does not send a family-facing message from this screen.", "private"],
    ],
    operations: [
      ["School operations staff", "Operations rows are for staff allowed to coordinate readiness, presentations, and final-file handoff.", "staff"],
      ["Private files protected", "Readiness issues summarize file or review needs without showing every private item.", "private"],
      ["Owner handoff", "Owner and next-action labels help route work to the right staff screen.", "context"],
    ],
    presentation: [
      [primaryRole === "student" ? "Your schedule" : "Schedule staff", primaryRole === "student" ? "You see presentation rows connected to your own presentation." : "Presentation rows are visible to staff and mentors allowed to support the scheduled event.", primaryRole === "student" ? "self" : "staff"],
      ["Day-of status", primaryRole === "student" ? "Check-out and check-in status helps you know whether the presentation row is still open." : "Check-out and check-in status helps the school coordinate the presentation day.", "shared"],
      ["No review feedback", "Presentation status does not expose Program Teacher review feedback or proof history.", "private"],
    ],
    adminDashboard: [
      ["Global admin view", "Command Center summaries are limited to global or organization-level administrators.", "staff"],
      ["Risk summaries", "Cards summarize system risk before private student, account, or file detail is opened.", "context"],
      ["Source screens protect details", "Use the allowed source screen when investigation needs protected records.", "private"],
    ],
    readiness: [
      ["Aggregate report", "Readiness reports are summary views across records your account is allowed to monitor.", "context"],
      ["Private files hidden", "Broad reports avoid exposing student files, links, and private review notes.", "private"],
      ["Share only summaries", "Use aggregate numbers for planning and open source screens for protected detail.", "shared"],
    ],
    adminUsers: [
      ["Authorized account staff", "Users & Access is for staff approved to manage accounts for the selected school or platform.", "staff"],
      ["Setup passwords", "Temporary setup passwords are sensitive handoffs and should only be shared through the school-approved process.", "private"],
      ["Audit trail", "Account creation, access changes, and removals are logged for later review.", "context"],
    ],
    audit: [
      ["Global admin only", "Audit details are limited to global admins and authorized security review staff.", "staff"],
      ["Redacted rows", "Events hide private student, work, account, and file details until a source area is opened with allowed access.", "redacted"],
      ["Follow-up elsewhere", "Use the source screen for fixes; the log itself is for review and triage.", "context"],
    ],
    archiveExports: [
      ["Global admin package view", "Final-file package monitoring is limited to staff approved for package follow-up.", "staff"],
      ["Protected downloads", "Download actions use protected package surfaces and should follow school handoff rules.", "private"],
      ["No raw file details", "Rows show package status without exposing raw file contents in the table.", "redacted"],
    ],
    security: [
      ["Your own account", "Password and session tools affect only the signed-in account.", "self"],
      ["Session change", "Changing a password or signing out changes access for this browser session.", "shared"],
      ["No other users", "This screen cannot edit another person's account, student work, or staff assignment.", "private"],
    ],
  };
  const notes = notesBySection[sectionId] || notesBySection.overview;
  if (primaryRole === "student" && sectionId === "overview") {
    return [
      ["Your workspace", "Overview points you toward your own Senior Project checklist, proof, feedback, and final-file status.", "self"],
      ...notes.slice(1, 3),
    ];
  }
  if (roles.has("viewer") && sectionId === "overview") {
    return [
      ["Read-only view", "Viewer access is for monitoring allowed records without changing them.", "self"],
      ...notes.slice(1, 3),
    ];
  }
  return notes;
}

function renderScreenVisibilityGuide(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const notes = screenVisibilityNotesFor(activeId, primaryRole, roles).filter(Boolean).slice(0, 3);
  if (!notes.length) return "";
  return `
    <details class="workspace-visibility-guide" data-screen-visibility-guide="${escapeHtml(activeId)}">
      <summary>
        <span>Who can see this</span>
        <strong>${escapeHtml(orientation.title)}</strong>
        <small>${escapeHtml(notes.length)} visibility notes</small>
      </summary>
      <div class="workspace-visibility-grid">
        ${notes.map((note) => {
          const label = Array.isArray(note) ? note[0] : note?.label;
          const detail = Array.isArray(note) ? note[1] : note?.detail;
          const state = normalizeStatus(Array.isArray(note) ? note[2] : note?.state || "context") || "context";
          const key = String(label || "visibility").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "visibility";
          return `
            <article class="workspace-visibility-note" data-visibility-note="${escapeHtml(key)}" data-visibility-note-state="${escapeHtml(state)}">
              <span>${escapeHtml(label || "Visibility note")}</span>
              <p>${escapeHtml(detail || "This explains who can see this screen's information and where protected details stay.")}</p>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function screenStartRequirementsFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const requirementsBySection = {
    overview: [
      ["Confirm account", "Check your name, current school, and access banner before acting from this workspace.", "check"],
      ["Pick one next step", "Use the suggested next click or the highest-priority card instead of opening every screen.", "choose"],
      ["Use source screens", "Open the source screen before saving any student, review, account, or file change.", "source"],
    ],
    profile: [
      ["Read your access", "Start with the access banner so you know which school, program, or student records are expected.", "check"],
      ["Compare sections", "Available sections show what this account can actually open today.", "context"],
      ["Bring access questions", "If access looks wrong, note the missing school, program, student, or task before asking for help.", "prepare"],
    ],
    siteDashboard: [
      ["Choose current school", "Confirm the Current site menu shows the school you intend to monitor.", "choose"],
      ["Read urgent tiles", "Start with the largest or warning-colored tile before expanding supporting details.", "check"],
      ["Open source screen", "Use the linked source screen when a row needs a saved change or owner follow-up.", "source"],
    ],
    programs: [
      ["Choose current school", "Confirm the Current site menu before changing school-program settings.", "choose"],
      ["Confirm program fit", "Know which program belongs at the selected school before using the setup form.", "prepare"],
      ["Have a setup note", "Keep the reason for the school-program change ready for staff review.", "prepare"],
    ],
    students: [
      ["Choose current school", "Confirm the current school before reading directory rows or opening student detail.", "choose"],
      ["Start with a filter", "Use search, saved filters, or summary tiles to narrow the list before opening a student.", "choose"],
      ["Open one student", "Open one allowed record when private detail, history, or support context is needed.", "source"],
    ],
    student: [
      ["Read Do this next", "Start with the action at the top of My Work before opening other panels.", "choose"],
      ["Open current phase item", "Open the checklist item that belongs to the phase deliverable you are trying to finish.", "choose"],
      ["File ready", "Have the exact file or link ready before adding it or turning in work.", "prepare"],
    ],
    archive: [
      ["Check download status", primaryRole === "student" ? "Read whether final files are ready, blocked, expired, or still being prepared." : "Read whether the final-file package is ready, blocked, failed, expired, or still running.", "check"],
      ["Confirm save timing", primaryRole === "student" ? "Use downloads only when this screen says your download is ready." : "Use downloads only when the school says the final-file package is ready for handoff.", "confirm"],
      ["Ask staff on blockers", primaryRole === "student" ? "If final files are blocked or failed, use the listed reason when asking staff for help." : "If the package is blocked or failed, use the listed reason when asking staff for help.", "prepare"],
    ],
    mentorDashboard: [
      ["Start with focus", "Choose the focus filter that matches the mentor support question you are answering.", "choose"],
      ["Open assigned student", "Open one assigned student before planning meeting support.", "source"],
      ["Use meeting tools", "Save meeting results from Assigned Students after you have the check-in outcome.", "source"],
    ],
    mentor: [
      ["Choose assigned student", "Start from one assigned student card before reading support history.", "choose"],
      ["Prepare meeting result", "Know the check-in result before saving a mentor meeting record.", "prepare"],
      ["Add follow-up note", "Write the next support step in plain language before recording the meeting.", "prepare"],
    ],
    programDashboard: [
      ["Review risks first", "Start with review and cohort risk lists before browsing lower-priority summaries.", "check"],
      ["Choose source list", "Open Review Work or Students when a row needs detail.", "source"],
      ["Use Review Work for decisions", "Save approval or revision decisions only from Review Work.", "source"],
    ],
    teacher: [
      ["Select one row", "Choose one review item before reading work, history, or the decision area.", "choose"],
      ["Work and history", "Review work and history before saving a Program Teacher decision.", "check"],
      ["Choose one outcome", "Decide whether the item is approved, needs revision, or only needs a comment before saving.", "confirm"],
    ],
    mentorAssignments: [
      ["Choose student and mentor", "Pick one student and one active mentor before using the assignment form.", "choose"],
      ["Check mentor load", "Review the mentor's current student load before saving a new assignment.", "check"],
      ["Add assignment reason", "Write why this student needs this mentor before saving coverage.", "prepare"],
    ],
    operations: [
      ["Pick issue type", "Start with the presentation, file, readiness, or final-file issue you need to resolve.", "choose"],
      ["Check next helper", "Use the helper shown on the row to decide who should take the next step.", "check"],
      ["Open source screen", "Move to the source screen before making a saved change.", "source"],
    ],
    presentation: [
      ["Set schedule filter", "Filter the schedule to the date, status, or student group you need.", "choose"],
      ["Confirm slot", "Check the student and slot before using day-of status controls.", "confirm"],
      ["Use known status", "Change check-out or check-in only when the presentation-day status is known.", "confirm"],
    ],
    adminDashboard: [
      ["Start with risk", "Open the risk card that matches the problem you are investigating.", "choose"],
      ["Keep source screen", "Use source screens for protected detail and saved fixes.", "source"],
      ["Avoid summary fixes", "Treat Command Center cards as routing and monitoring, not as direct edit forms.", "check"],
    ],
    readiness: [
      ["Choose report context", "Confirm which school, program, or aggregate view the report is summarizing.", "choose"],
      ["Use summary planning", "Use aggregate numbers for planning before opening protected detail.", "context"],
      ["Open source for detail", "Move to the source screen when a readiness issue needs action.", "source"],
    ],
    adminUsers: [
      ["Confirm person and school", "Know the exact person, school, program, cohort, or student before changing access.", "confirm"],
      ["Choose smallest role", "Choose the lowest access level that lets the person do the job.", "choose"],
      ["Handoff ready", "Have the setup handoff and admin note ready before creating or importing accounts.", "prepare"],
    ],
    audit: [
      ["Filters first", "Set action, person, or record filters before investigating the log.", "choose"],
      ["Read redacted row", "Use the redacted row to identify the pattern without exposing protected details.", "check"],
      ["Fix elsewhere", "Open the source screen when an account, review, or file issue needs a change.", "source"],
    ],
    archiveExports: [
      ["Filter package status", "Start with failed, in-progress, or complete package filters before opening rows.", "choose"],
      ["Confirm owner", "Know who owns the package follow-up before using download or handoff details.", "confirm"],
      ["Use protected download", "Use download actions only when the package is complete and handoff is approved.", "confirm"],
    ],
    security: [
      ["Know current password", "Have your current password ready before starting a password change.", "prepare"],
      ["Choose replacement", "Pick a strong new password that matches the school's account process.", "prepare"],
      ["End shared sessions", "Use Sign out when you are done on a shared or public device.", "confirm"],
    ],
  };
  const requirements = requirementsBySection[sectionId] || requirementsBySection.overview;
  if (primaryRole === "student" && sectionId === "overview") {
    return [
      ["Start with your task", "Open My Work when you need your checklist, phase deliverable, files, feedback, or approval status.", "choose"],
      ...requirements.slice(1, 3),
    ];
  }
  if (roles.has("viewer") && sectionId === "overview") {
    return [
      ["Monitor only", "Start by confirming the allowed records you are watching without changing them.", "check"],
      ...requirements.slice(1, 3),
    ];
  }
  return requirements;
}

function renderScreenStartGuide(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const requirements = screenStartRequirementsFor(activeId, primaryRole, roles).filter(Boolean).slice(0, 3);
  if (!requirements.length) return "";
  return `
    <details class="workspace-start-guide" data-screen-start-guide="${escapeHtml(activeId)}">
      <summary>
        <span>Before you start</span>
        <strong>${escapeHtml(orientation.title)}</strong>
        <small>${escapeHtml(requirements.length)} start checks</small>
      </summary>
      <div class="workspace-start-grid">
        ${requirements.map((requirement) => {
          const label = Array.isArray(requirement) ? requirement[0] : requirement?.label;
          const detail = Array.isArray(requirement) ? requirement[1] : requirement?.detail;
          const state = normalizeStatus(Array.isArray(requirement) ? requirement[2] : requirement?.state || "check") || "check";
          const key = String(label || "start").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "start";
          return `
            <article class="workspace-start-item" data-start-requirement="${escapeHtml(key)}" data-start-requirement-state="${escapeHtml(state)}">
              <span>${escapeHtml(label || "Start check")}</span>
              <p>${escapeHtml(detail || "This explains what to have ready before using this screen.")}</p>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function screenDoneSignalsFor(sectionId = "overview", primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser)) {
  const signalsBySection = {
    overview: [
      ["Next screen chosen", "You opened the source screen for the highest-priority card or suggested next click.", "route"],
      ["No silent save", "Browsing Overview does not change student, review, account, or file records.", "safe"],
      ["Fresh data checked", "Refresh confirms whether new workspace data changed your next step.", "check"],
    ],
    profile: [
      ["Access understood", "You can explain which school, program, student, or platform area this account can use.", "complete"],
      ["Concern named", "Any access concern is written as a missing school, program, student, or task.", "followup"],
      ["Next screen picked", "You know which available section to open for the actual work.", "route"],
    ],
    siteDashboard: [
      ["School confirmed", "The Current site menu still shows the school you meant to monitor.", "complete"],
      ["Owner found", "The tile or row points to a staff owner or source screen for follow-up.", "route"],
      ["Summary left unchanged", "Dashboard reading and detail expansion did not save record changes.", "safe"],
    ],
    programs: [
      ["Program setting checked", "The selected school's program list reflects the intended setup after refresh.", "complete"],
      ["Reason preserved", "The school-program reason is clear enough for staff review later.", "saved"],
      ["Account work untouched", "Program setup finished without changing users, passwords, or mentor assignments.", "safe"],
    ],
    students: [
      ["List narrowed", "Search, filters, or saved views show the student group you meant to review.", "complete"],
      ["One record opened", "A student detail panel opens when private detail or history is needed.", "route"],
      ["Decision work routed", "Review decisions remain in Review Work instead of the directory.", "safe"],
    ],
    student: [
      ["Phase item updated", "The current phase item shows the new file count, waiting review state, feedback message, or Done status.", "complete"],
      ["Next action is clear", "Do this next tells you whether to fix work, add a file, turn in work, wait, or move to another screen.", "complete"],
      ["Teacher check is clear", "If teacher review is needed, the screen says to wait before moving on.", "waiting"],
    ],
    archive: [
      ["Download status known", primaryRole === "student" ? "The screen tells you whether saving, staff follow-up, or waiting is next." : "The package status tells you whether download, staff follow-up, or waiting is next.", "complete"],
      ["Download handled", primaryRole === "student" ? "A ready download opens through the protected download link." : "A ready package opens through the protected download path when handoff is approved.", "handoff"],
      ["Blocker explained", primaryRole === "student" ? "Blocked, failed, or expired downloads show a reason to bring to staff." : "Blocked, failed, or expired packages show a reason to bring to staff.", "followup"],
    ],
    mentorDashboard: [
      ["Focus list clear", "The filter shows the assigned students who match the support question.", "complete"],
      ["Student opened", "One assigned student is opened when meeting planning needs detail.", "route"],
      ["Meeting routed", "Any saved meeting result is handled from Assigned Students.", "source"],
    ],
    mentor: [
      ["Meeting saved", "The assigned student's meeting history shows the new result or follow-up note.", "saved"],
      ["Next support named", "The follow-up note says what the mentor or student should do next.", "complete"],
      ["Review left separate", "Program Teacher approval still belongs in Review Work.", "safe"],
    ],
    programDashboard: [
      ["Risk path chosen", "Each urgent program signal has a Review Work or Students path.", "route"],
      ["Cohort checked", "You have checked the assigned student group before leaving the dashboard.", "complete"],
      ["Decision saved elsewhere", "Approval or revision work stays in Review Work.", "safe"],
    ],
    teacher: [
      ["Decision saved", "The selected review item shows the saved Program Teacher decision or follow-up message.", "saved"],
      ["Review list updated", "Filters, row status, or the selected row update after the decision is saved.", "complete"],
      ["Student next step clear", "Student-facing feedback is ready after the saved decision is visible in the selected item.", "complete"],
    ],
    mentorAssignments: [
      ["Coverage saved", "The student shows the intended active mentor assignment after the form saves.", "saved"],
      ["Reason visible", "The assignment reason explains why this mentor is supporting this student.", "complete"],
      ["Load still reasonable", "The mentor load still looks appropriate after the assignment.", "check"],
    ],
    operations: [
      ["Owner identified", "Every blocker you touched has a listed owner or source screen.", "complete"],
      ["Source opened", "Saved changes happen only after opening the source screen that owns the blocker.", "route"],
      ["Monitoring complete", "Operations rows remain a monitoring and handoff view.", "safe"],
    ],
    presentation: [
      ["Slot status updated", "The selected presentation slot shows the intended check-out, check-in, or readiness status.", "saved"],
      ["Schedule narrowed", "Filters show the date, student group, or status needed for the presentation task.", "complete"],
      ["Review untouched", "Presentation work finishes without changing Program Teacher review outcomes.", "safe"],
    ],
    adminDashboard: [
      ["Risk routed", "The command card or risk row opens the source screen that owns the issue.", "route"],
      ["Summary only", "Command Center totals remain monitoring signals, not saved edits.", "safe"],
      ["Protected detail handled", "Protected student, account, audit, or package detail stays in its source screen.", "complete"],
    ],
    readiness: [
      ["Report interpreted", "The aggregate report shows the planning signal you needed.", "complete"],
      ["Detail routed", "Any blocker needing action has a source screen to open next.", "route"],
      ["Private files hidden", "Broad reporting finishes without exposing private file detail.", "safe"],
    ],
    adminUsers: [
      ["Access row correct", "Current access shows the intended person, role, and school, program, cohort, or student.", "saved"],
      ["Handoff recorded", "Setup handoff and admin note are ready for the school's approved process.", "handoff"],
      ["Review trail exists", "Recent access changes can explain account updates later.", "complete"],
    ],
    audit: [
      ["Pattern identified", "Filters point to the action, person, or record pattern you needed to investigate.", "complete"],
      ["Source screen chosen", "You know which source screen owns any account, proof, review, or file follow-up.", "route"],
      ["Log stays redacted", "The log remains redacted while fixes happen elsewhere.", "safe"],
    ],
    archiveExports: [
      ["Package row clear", "Each package row shows whether handoff, waiting, or staff follow-up is next.", "complete"],
      ["Download approved", "Complete packages use protected downloads only when handoff is approved.", "handoff"],
      ["Failed row routed", "Failed package rows have a follow-up owner or next screen.", "followup"],
    ],
    security: [
      ["Password result clear", "The screen shows whether the password change succeeded or needs correction.", "complete"],
      ["Session ended", "Sign out returns the browser to the sign-in screen on shared devices.", "complete"],
      ["No other accounts changed", "Account/Security work finishes without changing another user's access.", "safe"],
    ],
  };
  const signals = signalsBySection[sectionId] || signalsBySection.overview;
  if (primaryRole === "student" && sectionId === "overview") {
    return [
      ["My Work opened", "You opened My Work when your checklist, phase deliverable, proof, feedback, or approval status was the task.", "route"],
      ...signals.slice(1, 3),
    ];
  }
  if (roles.has("viewer") && sectionId === "overview") {
    return [
      ["Monitoring complete", "You checked the allowed records you needed without changing them.", "complete"],
      ...signals.slice(1, 3),
    ];
  }
  return signals;
}

function renderScreenDoneGuide(sectionId = activeSection, primaryRole = primaryRoleForUser(currentUser), roles = roleIds(currentUser), sections = availableSections()) {
  const allowedIds = new Set(sections.map((section) => section.id));
  const activeId = allowedIds.has(sectionId) ? sectionId : "overview";
  const orientation = screenOrientationFor(activeId, primaryRole, roles);
  const signals = screenDoneSignalsFor(activeId, primaryRole, roles).filter(Boolean).slice(0, 3);
  if (!signals.length) return "";
  return `
    <details class="workspace-done-guide" data-screen-done-guide="${escapeHtml(activeId)}">
      <summary>
        <span>How you know you're done</span>
        <strong>${escapeHtml(orientation.title)}</strong>
        <small>${escapeHtml(signals.length)} done signals</small>
      </summary>
      <div class="workspace-done-grid">
        ${signals.map((signal) => {
          const label = Array.isArray(signal) ? signal[0] : signal?.label;
          const detail = Array.isArray(signal) ? signal[1] : signal?.detail;
          const state = normalizeStatus(Array.isArray(signal) ? signal[2] : signal?.state || "complete") || "complete";
          const key = String(label || "done").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "done";
          return `
            <article class="workspace-done-item" data-done-signal="${escapeHtml(key)}" data-done-signal-state="${escapeHtml(state)}">
              <span>${escapeHtml(label || "Done signal")}</span>
              <p>${escapeHtml(detail || "This explains what should look finished before you leave this screen.")}</p>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function availableSections(options = {}) {
  const mode = cleanWorkspaceMode(options.mode || activeWorkspaceMode) || "workspace";
  return mode === "admin" ? availableAdminConsoleSections() : availableWorkspaceSections();
}

function availableWorkspaceSections(user = currentUser) {
  const roles = roleIds(user);
  const sections = [];
  const add = (id, label, detail, options = {}) => {
    if (!sections.some((section) => section.id === id)) sections.push({ id, label, detail, ...options });
  };

  add("profile", "Profile", "Plain-language role guide", { hidden: true });

  if (isViewAsStudentActive() || roles.has("student")) {
    add("student", "Today", "What to finish next");
    add("studentWork", "My Project", "Team, stages, and Drive links");
    add("studentFeedback", "Feedback", "Feedback and work to fix");
    add("studentFinalChecklist", "Final Checklist", "Presentation and final files");
    add("presentation", "Presentation", "Schedule, outline, and day-of status", { hidden: true });
    add("archive", "Final Files", "May 5 downloads", { hidden: true });
    add("security", "Account", "Password and sessions", { hidden: true });
    return sections;
  }

  add("overview", "Today", "Students needing attention");

  if (roles.has("mentor")) {
    add("projects", "Projects", "Projects you support");
    add("mentor", "Assigned students", "Students you support");
    add("teacher", "Work to review", "Work from your students");
    add("mentorDashboard", "Mentor Dashboard", "Assigned student risks", { hidden: true });
    add("presentation", "Presentation", "Schedule, outline, and day-of status", { hidden: true });
  }
  if (roles.has("viewer")) {
    add("projects", "Projects", "Assigned read-only projects");
    add("students", "Students", "Assigned read-only student records", { hidden: true });
  }
  if (roles.has("program_teacher")) {
    add("projects", "Projects", "Program project rows");
    add("students", "Students", "Program student rows", { hidden: true });
    add("teacher", "Reviews", "Work waiting for review");
    add("programDashboard", "Program Dashboard", "Your students and review needs", { hidden: true });
    add("operations", "Operations", "Presentation, mentor, and final-file issues", { hidden: true });
    add("presentation", "Presentation", "Schedule, outline, and day-of status", { hidden: true });
  }
  if (roles.has("administration")) {
    add("projects", "Projects", "School project rows");
    add("students", "Students", "School student rows", { hidden: true });
    add("siteDashboard", "Site Dashboard", "School-wide capstone health", { hidden: true });
    add("operations", "Operations", "Presentation, final files, and readiness", { hidden: true });
    add("mentorAssignments", "Mentor Assignments", "Coverage and assignment workflow", { hidden: true });
  }
  if (roles.has("site_admin") || hasGlobalAdminRole(roles)) {
    add("projects", "Projects", "Site project rows");
    add("students", "Students", "Site student rows", { hidden: true });
    add("teacher", "Reviews", "Submitted work and follow-up");
    add("siteDashboard", "Site Dashboard", "Site-wide capstone health", { hidden: true });
    add("operations", "Operations", "Presentation, final files, and readiness", { hidden: true });
    add("mentorAssignments", "Mentor Assignments", "Coverage and assignment workflow", { hidden: true });
    add("presentation", "Presentation", "Schedule, outline, and day-of status", { hidden: true });
    add("readiness", "Readiness", "Aggregate project readiness", { hidden: true });
  } else if (roles.has("administration")) {
    add("presentation", "Presentation", "Schedule, outline, and day-of status", { hidden: true });
    add("readiness", "Readiness", "Aggregate project readiness", { hidden: true });
  }
  if (roles.has("misc_admin")) {
    add("readiness", "Readiness", "Aggregate project readiness", { hidden: true });
  }
  if (hasGlobalAdminRole(roles)) {
    add("adminDashboard", "Global Overview", "All schools overview", { hidden: true });
  }
  if (hasStaffReportsSection(roles)) add("staffReports", "Reports", "Progress and setup summary");

  add("security", hasGlobalAdminRole(roles) ? "Security" : "Account", "Password and sessions", { hidden: true });
  return sections;
}

function availableAdminConsoleSections(user = currentUser) {
  return adminConsoleCapabilitiesFor(user).sections;
}

function renderActiveSection() {
  if (activeSection === "security") return renderSecuritySection();
  if (activeSection === "profile") return renderRoleProfileSection();
  if (activeSection === "siteDashboard") return renderSiteDashboardSection();
  if (activeSection === "programs") return renderSiteProgramsSection();
  if (activeSection === "students") return renderSiteStudentDirectorySection();
  if (activeSection === "projects") return renderProjectsSection();
  if (activeSection === "studentWork") return renderStudentSection({ view: "work" });
  if (activeSection === "studentFeedback") return renderStudentSection({ view: "feedback" });
  if (activeSection === "studentFinalChecklist") return renderStudentSection({ view: "final-checklist" });
  if (activeSection === "staffReports") return renderStaffReportsSection();
  if (activeSection === "adminDashboard") return renderAdminOverviewSection();
  if (activeSection === "student") return renderStudentSection();
  if (activeSection === "programDashboard") return renderProgramTeacherDashboardSection();
  if (activeSection === "teacher") return renderTeacherSection();
  if (activeSection === "mentorDashboard") return renderMentorDashboardSection();
  if (activeSection === "mentor") return renderMentorSection();
  if (activeSection === "presentation") return renderPresentationSection();
  if (activeSection === "archive") return renderArchiveSection();
  if (activeSection === "adminUsers") return renderAdminUsersSection();
  if (activeSection === "mentorAssignments") return renderMentorAssignmentsSection();
  if (activeSection === "operations") return renderOperationsReadinessSection();
  if (activeSection === "audit") return renderAdminAuditSection();
  if (activeSection === "archiveExports") return renderAdminArchiveExportsSection();
  if (activeSection === "readiness") return renderReadinessSection();
  return renderOverviewSection();
}
