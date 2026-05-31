const workspaceMain = document.querySelector("#workspaceMain");

let currentUser = null;
let currentData = {
  authConfig: null,
  dashboard: null,
  siteDashboard: null,
  siteStudents: null,
  siteStudentDetail: null,
  siteStudentTimeline: null,
  adminDashboard: null,
  programTeacherDashboard: null,
  mentorDashboard: null,
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
let busy = false;
let lastAdminImportResult = null;
let workspaceNavCollapsed = false;
let selectedSiteId = "";
let siteStudentFilters = defaultSiteStudentFilters();
let siteStudentDetailState = defaultSiteStudentDetailState();
let pendingSiteStudentDetailFocus = false;
let pendingStudentRequirementFocusId = "";
let studentRequirementDetailState = defaultStudentRequirementDetailState();
let studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
let reviewQueueFilters = defaultReviewQueueFilters();
let reviewQueueState = defaultReviewQueueState();
let mentorAssignmentFilters = defaultMentorAssignmentFilters();
let operationsReadinessFilters = defaultOperationsReadinessFilters();
let mentorDashboardFilter = "all";
let presentationSlotFilter = "all";
const WORKSPACE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const WORKSPACE_UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const WORKSPACE_UPLOAD_ALLOWED_EXTENSIONS = [".pdf", ".txt", ".csv", ".docx", ".pptx", ".xlsx"];
const WORKSPACE_POSTURE_CHIPS = [
  "Student progress",
  "Private evidence",
  "Mentor coverage",
  "Review queue",
  "Presentation readiness",
];
const STATUS_CLASS_BY_STATUS = {
  draft: "draft",
  not_started: "draft",
  submitted: "submitted",
  under_review: "under_review",
  reviewing: "under_review",
  revision_requested: "revision_requested",
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
  missing: "archived",
  checked_out: "under_review",
  checked_in: "complete",
  available: "ready",
  attention_required: "blocked",
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
};
const STATUS_LABELS = {
  draft: "Draft",
  not_started: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  reviewing: "Under review",
  revision_requested: "Revision requested",
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
  complete: "Complete",
  completed: "Complete",
  expired: "Expired",
  expiring_soon: "Expiring soon",
  attention_required: "Blocked",
  in_progress: "In progress",
  needs_review: "Pending",
  needs_revision: "Needs revision",
  on_track: "On track",
  behind: "Behind",
  missing_evidence: "Missing evidence",
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
};
const WORKSPACE_SECTION_IDS = new Set([
  "overview",
  "siteDashboard",
  "students",
  "student",
  "archive",
  "mentorDashboard",
  "mentor",
  "programDashboard",
  "teacher",
  "mentorAssignments",
  "operations",
  "presentation",
  "adminDashboard",
  "readiness",
  "adminUsers",
  "audit",
  "archiveExports",
  "security",
]);
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
const SITE_STUDENT_PROGRESS_STATUS_VALUES = new Set(["on_track", "behind", "missing_mentor", "missing_evidence", "needs_review", "needs_revision", "ready_complete"]);
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
const WORKLIST_URL_FILTER_PARAMS = Array.from(new Set([
  ...REVIEW_QUEUE_URL_FILTER_PARAMS,
  ...SITE_STUDENT_URL_FILTER_PARAMS,
  ...MENTOR_ASSIGNMENT_URL_FILTER_PARAMS,
  ...OPERATIONS_URL_FILTER_PARAMS,
]));
let uploadState = {
  state: "idle",
  progress: 0,
  message: "Choose a file to upload evidence.",
  fileName: "",
  fileSize: 0,
  retryReady: false,
};
let lastUploadAttempt = null;

init();

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
      currentUser = null;
      currentData = defaultCurrentData(authConfig);
      studentRequirementDetailState = defaultStudentRequirementDetailState();
      studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
      mentorDashboardFilter = "all";
      presentationSlotFilter = "all";
      renderSignIn(
        messageForSessionStateError(data?.error, response.status),
        data?.error ? "error" : "neutral",
        workspaceStateForAuthError(data?.error),
      );
      return;
    }
    if (currentUser?.id !== data.user?.id) {
      studentRequirementDetailState = defaultStudentRequirementDetailState();
      studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
      mentorDashboardFilter = "all";
      presentationSlotFilter = "all";
    }
    currentUser = data.user;
    await loadWorkspaceData();
  } catch (error) {
    currentUser = null;
    currentData = defaultCurrentData(authConfig);
    studentRequirementDetailState = defaultStudentRequirementDetailState();
    studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
    mentorDashboardFilter = "all";
    presentationSlotFilter = "all";
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
    siteStudents: null,
    siteStudentDetail: null,
    siteStudentTimeline: null,
    adminDashboard: null,
    programTeacherDashboard: null,
    mentorDashboard: null,
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
}

async function loadWorkspaceData(statusMessage = "") {
  if (!currentUser) {
    renderSignIn();
    return;
  }

  renderAppShell(statusMessage || "Loading your workspace...");
  const roles = roleIds(currentUser);
  const authConfig = currentData.authConfig || await loadAuthConfig();
  const loaders = [];

  if (roles.has("student")) loaders.push(["dashboard", apiJson("/api/student/dashboard")]);
  if (roles.has("student")) loaders.push(["archiveReadiness", apiJson("/api/student/archive/readiness")]);
  if (hasSiteDashboardRole(roles)) loaders.push(["siteDashboard", apiJson(`/api/site/dashboard${siteDashboardQueryString()}`)]);
  if (hasSiteStudentDirectoryRole(roles)) loaders.push(["siteStudents", apiJson(`/api/site/students${siteStudentQueryString()}`)]);
  if (hasSiteReviewQueueRole(roles)) loaders.push(["reviewQueue", apiJson(`/api/site/review-queue${siteReviewQueueQueryString()}`)]);
  if (hasSiteMentorAssignmentRole(roles)) loaders.push(["mentorAssignments", apiJson(`/api/site/mentor-assignments${siteMentorAssignmentQueryString()}`)]);
  if (canUseUsersAccess(roles)) loaders.push(["accessAssignments", apiJson(`/api/site/access-assignments${siteDashboardQueryString()}`)]);
  if (hasSiteOperationsRole(roles)) loaders.push(["operationsReadiness", apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`)]);
  if (hasGlobalAdminRole(roles)) loaders.push(["adminDashboard", apiJson("/api/admin/dashboard")]);
  if (roles.has("program_teacher")) loaders.push(["programTeacherDashboard", apiJson("/api/program-teacher/dashboard")]);
  if (roles.has("mentor") || hasGlobalAdminRole(roles)) loaders.push(["mentorDashboard", apiJson("/api/mentor/dashboard")]);
  if (roles.has("mentor")) loaders.push(["mentorAssigned", apiJson("/api/mentor/assigned")]);
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration")) {
    loaders.push(["presentationSlots", apiJson("/api/presentation-slots")]);
  }
  if (hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration") || roles.has("misc_admin")) loaders.push(["readiness", apiJson("/api/reports/readiness")]);

  const results = await Promise.all(loaders.map(async ([key, promise]) => [key, await settleApi(promise)]));
  currentData = defaultCurrentData(authConfig);

  for (const [key, result] of results) {
    currentData[key] = result;
  }

  const firstAvailable = availableSections()[0]?.id || "overview";
  if (!availableSections().some((section) => section.id === activeSection)) {
    activeSection = firstAvailable;
  }
  if (activeSection === "teacher") {
    await restoreReviewQueueSelectionFromCurrentRows({ renderLoading: false });
  }
  renderAppShell(statusMessage || "Workspace ready.", "success");
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
      <p class="workspace-product-eyebrow">${escapeHtml(eyebrow)}</p>
      <h1 class="workspace-product-title" ${titleId ? `id="${escapeHtml(titleId)}"` : ""}>${escapeHtml(title)}</h1>
      <p class="workspace-product-subtitle">${escapeHtml(subtitle)}</p>
      <div class="workspace-posture-chips" aria-label="Product posture">
        ${chips.map((chip) => `<span class="workspace-posture-chip">${escapeHtml(chip)}</span>`).join("")}
      </div>
      ${contextChips.length ? `
        <div class="workspace-product-context" aria-label="Workspace role context">
          ${contextChips.map((chip) => `<span class="workspace-posture-chip">${escapeHtml(chip)}</span>`).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function renderProblemState({ reason, owner, nextAction }) {
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
    </article>
  `;
}

function renderSignIn(message = "", tone = "neutral", workspaceState = "signed-out", options = {}) {
  const authConfig = authConfigForUi();
  const urlAuthError = authErrorMessageFromLocation();
  const finalMessage = message || urlAuthError.message;
  const finalTone = message ? tone : urlAuthError.tone;
  const emailValue = escapeHtml(options.email || "");
  const showResetForm = Boolean(options.showResetForm || workspaceState === "reset-required");
  const showGooglePanel = authConfig.googleSsoEnabled || !authConfig.googleSsoConfigured;
  const showLocalLogin = authConfig.localLoginEnabled;
  workspaceMain.innerHTML = `
    <section class="workspace-auth" aria-labelledby="signInTitle" data-workspace-state="${escapeHtml(workspaceState)}">
      <div class="workspace-auth-intro">
        <a class="workspace-brand" href="index.html">
          <span class="workspace-mark">SC</span>
          <span class="workspace-abc-motif" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>Capstone Project</span>
        </a>
        ${renderProductHeader({ titleId: "signInTitle" })}
      </div>
      <div class="workspace-auth-panel">
        <div>
          <p class="workspace-kicker">Account access</p>
          <h2>Sign in to continue</h2>
        </div>
        ${finalMessage ? statusHtml(finalMessage, finalTone) : ""}
        ${showGooglePanel ? `
        <section class="workspace-sso-panel">
          <div>
            <p class="workspace-kicker">Google Workspace</p>
            <h3>School account sign in</h3>
            <p>${escapeHtml(authConfig.googleWorkspaceLabel || "Use your school Google Workspace account.")}</p>
          </div>
          ${authConfig.googleSsoEnabled ? `
            <a class="workspace-button workspace-button-primary" href="/api/auth/google/start?returnTo=/workspace.html">Continue with Google Workspace</a>
          ` : `
            <div class="workspace-status">Google Workspace sign-in is not configured for this environment yet.</div>
          `}
        </section>
        ` : ""}
        ${showGooglePanel && showLocalLogin ? `<div class="workspace-auth-divider" role="separator"><span>or</span></div>` : ""}
        ${showLocalLogin ? `
        <section class="workspace-local-login-panel">
          <div>
            <p class="workspace-kicker">Local account sign in</p>
            <h3>Approved fallback access</h3>
          </div>
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
          <p class="workspace-muted">Local account access is available for approved fallback and local validation.</p>
        </section>
        ` : `<div class="workspace-empty">Local account sign in is not enabled for this environment.</div>`}
        ${showResetForm ? `
        <div class="workspace-reset-panel" data-auth-action="complete-reset">
          <div>
            <p class="workspace-kicker">Password reset</p>
            <h3>Create a new password</h3>
          </div>
          <form id="workspacePasswordResetForm" class="workspace-form">
            <label class="workspace-label">
              Email
              <input class="workspace-input" id="workspaceResetEmail" name="email" type="email" autocomplete="username" value="${emailValue}" required>
            </label>
            <label class="workspace-label">
              Current password
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
          <p class="workspace-muted">Use your current password once, then choose a new one before opening the workspace.</p>
        </div>
        ` : ""}
        <p class="workspace-muted">
          Need access or a password reset? Contact your instructor or project coordinator.
        </p>
        <a class="workspace-link-button" href="index.html">Return to the guide</a>
      </div>
    </section>
  `;

  document.querySelector("#workspaceLoginForm")?.addEventListener("submit", signIn);
  document.querySelector("#workspacePasswordResetForm")?.addEventListener("submit", completePasswordReset);
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

function renderAppShell(statusMessage = "", tone = "neutral") {
  if (!currentUser) {
    renderSignIn();
    return;
  }

  const sections = availableSections();
  const primaryRole = primaryRoleForUser(currentUser);
  const roles = roleIds(currentUser);
  const headerContext = [roleLabel(primaryRole), roleScopeSummary(currentUser)];
  workspaceMain.innerHTML = `
    <section class="workspace-app" data-primary-role="${escapeHtml(primaryRole)}" data-nav-state="${workspaceNavCollapsed ? "collapsed" : "expanded"}">
      <header class="workspace-topbar">
        <div class="workspace-topbar-start">
          <button class="workspace-menu-toggle" id="workspaceMenuToggle" type="button" aria-controls="workspaceNavigationRail" aria-expanded="${workspaceNavCollapsed ? "false" : "true"}" aria-label="${workspaceNavCollapsed ? "Open menu" : "Close menu"}">
            <span class="workspace-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="workspace-menu-toggle-label">${workspaceNavCollapsed ? "Open menu" : "Close menu"}</span>
          </button>
          <a class="workspace-brand" href="index.html">
            <span class="workspace-mark">SC</span>
            <span class="workspace-abc-motif" aria-hidden="true"><span></span><span></span><span></span></span>
            <span>Capstone Project Workspace</span>
          </a>
        </div>
        <div class="workspace-user">
          ${renderSiteSwitcherControl()}
          <div class="workspace-user-text">
            <strong>${escapeHtml(currentUser.displayName || "Signed in")}</strong>
            <span>${escapeHtml(currentUser.email || "")}</span>
          </div>
          <button class="workspace-button" id="workspaceRefresh" type="button">Refresh</button>
          <button class="workspace-button workspace-button-secondary" id="workspaceLogout" type="button">Sign out</button>
        </div>
      </header>
      <div class="workspace-content">
        <aside class="workspace-rail" id="workspaceNavigationRail" aria-label="Workspace navigation" ${workspaceNavCollapsed ? 'hidden aria-hidden="true"' : ""}>
          <section class="workspace-rail-card">
            <p class="workspace-kicker">Your access</p>
            <div class="workspace-role-banner">
              <strong>${escapeHtml(roleLabel(primaryRole))}</strong>
              <span>${escapeHtml(roleScopeSummary(currentUser))}</span>
            </div>
            <div class="workspace-chip-row">
              ${roleChips(currentUser)}
            </div>
          </section>
          <nav class="workspace-tabs" aria-label="Workspace sections">
            ${sections.map((section) => `
              <button class="workspace-tab ${section.id === activeSection ? "is-active" : ""}" data-section="${escapeHtml(section.id)}" type="button" title="${escapeHtml(section.label)}" aria-label="${escapeHtml(`${section.label}: ${section.detail}`)}" ${section.id === activeSection ? 'aria-current="page"' : ""}>
                <span class="workspace-tab-short" aria-hidden="true">${escapeHtml(sectionShortLabel(section))}</span>
                <strong>${escapeHtml(section.label)}</strong>
                <span>${escapeHtml(section.detail)}</span>
              </button>
            `).join("")}
          </nav>
          <section class="workspace-rail-card">
            <p class="workspace-kicker">Next step</p>
            <p>${escapeHtml(nextStepText())}</p>
          </section>
        </aside>
        <div class="workspace-main">
          ${statusMessage ? statusHtml(statusMessage, tone) : ""}
          ${primaryRole === "student" ? "" : renderProductHeader({
            context: headerContext,
            readOnly: roles.has("viewer"),
          })}
          ${renderReadOnlyBanner()}
          ${renderActiveSection()}
        </div>
      </div>
    </section>
  `;

  document.querySelector("#workspaceMenuToggle")?.addEventListener("click", toggleWorkspaceMenu);
  document.removeEventListener?.("keydown", handleWorkspaceKeydown);
  document.addEventListener?.("keydown", handleWorkspaceKeydown);
  document.querySelector("#workspaceSiteSelect")?.addEventListener("change", (event) => selectWorkspaceSite(event.currentTarget?.value || ""));
  document.querySelectorAll("[data-site-switch-id]").forEach((button) => {
    button.addEventListener("click", () => selectWorkspaceSite(button.dataset.siteSwitchId || ""));
  });
  document.querySelector("#workspaceRefresh")?.addEventListener("click", () => loadWorkspaceData("Workspace refreshed."));
  document.querySelector("#workspaceLogout")?.addEventListener("click", signOut);
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => openWorkspaceSection(button));
  });
  bindWorkspaceForms();
  flushPendingSiteStudentDetailFocus();
  flushPendingStudentRequirementFocus();
}

function requestSiteStudentDetailFocus() {
  pendingSiteStudentDetailFocus = true;
}

function requestStudentRequirementFocus(requirementId) {
  pendingStudentRequirementFocusId = cleanDirectoryFilter(requirementId);
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

function toggleWorkspaceMenu() {
  workspaceNavCollapsed = !workspaceNavCollapsed;
  renderAppShell(workspaceNavCollapsed ? "Menu closed." : "Menu opened.", "success");
}

function handleWorkspaceKeydown(event) {
  if (event?.key !== "Escape" || workspaceNavCollapsed) return;
  workspaceNavCollapsed = true;
  renderAppShell("Menu closed.", "success");
}

function sectionShortLabel(section) {
  const labels = {
    overview: "Home",
    siteDashboard: "Dash",
    students: "Students",
    student: "My Work",
    archive: "Archive",
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
  const currentSiteId = selectedSiteId || context.siteId || (sites.length === 1 ? sites[0].siteId : "");
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

function canUseSiteSwitcher(roles) {
  return roles.has("platform_admin")
    || roles.has("global_admin")
    || roles.has("admin")
    || roles.has("org_admin")
    || roles.has("site_admin")
    || roles.has("administration");
}

function currentSiteWorkspaceContext() {
  const candidates = [
    unwrap(currentData.siteDashboard)?.scope,
    unwrap(currentData.siteStudents)?.scope,
    unwrap(currentData.reviewQueue)?.scope,
    unwrap(currentData.mentorAssignments)?.scope,
    unwrap(currentData.operationsReadiness)?.scope,
  ].filter(Boolean);
  return candidates.find((scope) => scope?.siteId) || {};
}

function accessibleSitesForWorkspace() {
  const siteRows = [];
  const sources = [
    unwrap(currentData.siteDashboard)?.scope?.accessibleSites,
    currentData.siteDashboard?.body?.accessibleSites,
    unwrap(currentData.siteStudents)?.scope?.accessibleSites,
    currentData.siteStudents?.body?.accessibleSites,
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
  return siteRows;
}

async function selectWorkspaceSite(siteId) {
  const nextSiteId = cleanDirectoryFilter(siteId);
  if (!nextSiteId) return;
  selectedSiteId = nextSiteId;
  siteStudentFilters = defaultSiteStudentFilters();
  siteStudentDetailState = defaultSiteStudentDetailState();
  reviewQueueFilters = defaultReviewQueueFilters();
  reviewQueueState = defaultReviewQueueState();
  mentorAssignmentFilters = defaultMentorAssignmentFilters();
  operationsReadinessFilters = defaultOperationsReadinessFilters();
  syncCurrentWorkspaceUrlState({ clearFilters: true, replace: true });
  await loadWorkspaceData("Current site updated.");
}

async function openWorkspaceSection(button) {
  const section = button?.dataset?.section;
  if (!section) return;
  if (!availableSectionIds().has(section)) {
    renderAppShell("This workspace section is not available for your account.", "error");
    return;
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
    await loadWorkspaceData("Showing students ready for archive closeout.");
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
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      status: "submitted",
    };
    reviewQueueState = defaultReviewQueueState();
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Showing submitted work ready for review.");
    return;
  }
  if (section === "teacher" && button.dataset.sectionPreset === "revision-requested") {
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      status: "revision_requested",
    };
    reviewQueueState = defaultReviewQueueState();
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
    await loadOperationsReadinessResult("Showing archive packages being prepared.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-expiring-soon") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "expiring_soon",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing archive packages with download windows ending soon.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-expired") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "expired",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing archive packages with expired download windows.");
    return;
  }
  if (section === "operations" && button.dataset.sectionPreset === "archive-provider-unavailable") {
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      archiveStatus: "provider_unavailable",
    };
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing archive rows waiting on storage setup.");
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
    await loadOperationsReadinessResult(`Showing ${statusText(archiveStatus).toLowerCase()} archive rows.`);
    return;
  }
  activeSection = section;
  renderAppShell();
}

function availableSections() {
  const roles = roleIds(currentUser);
  const sections = [{ id: "overview", label: "Overview", detail: "Workspace priorities and access" }];
  if (hasSiteDashboardRole(roles)) sections.push({ id: "siteDashboard", label: "Site Dashboard", detail: "School-wide capstone health" });
  if (hasSiteStudentDirectoryRole(roles)) sections.push({ id: "students", label: "Students", detail: "Search and filter capstone progress" });
  if (roles.has("student")) sections.push({ id: "student", label: "Student Workspace", detail: "Progress, submissions, and evidence" });
  if (roles.has("student")) sections.push({ id: "archive", label: "Archive", detail: "Closeout and May 5 package" });
  if (roles.has("mentor")) sections.push({ id: "mentorDashboard", label: "Mentor Dashboard", detail: "Assigned student risks" });
  if (roles.has("mentor")) sections.push({ id: "mentor", label: "Assigned Students", detail: "Assigned students and evidence counts" });
  if (roles.has("program_teacher")) sections.push({ id: "programDashboard", label: "Program Dashboard", detail: "Scoped cohort and review risks" });
  if (hasSiteReviewQueueRole(roles)) sections.push({ id: "teacher", label: "Review Queue", detail: "Teacher review and submitted work" });
  if (hasSiteMentorAssignmentRole(roles)) sections.push({ id: "mentorAssignments", label: "Mentor Assignments", detail: "Coverage and assignment workflow" });
  if (hasSiteOperationsRole(roles)) sections.push({ id: "operations", label: "Operations", detail: "Presentation, archive, and readiness" });
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration")) {
    sections.push({ id: "presentation", label: "Presentation", detail: "Schedule, outline, and day-of status" });
  }
  if (hasGlobalAdminRole(roles)) sections.push({ id: "adminDashboard", label: "Admin Command Center", detail: "Platform operations" });
  if (hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration") || roles.has("misc_admin")) sections.push({ id: "readiness", label: "Readiness", detail: "Aggregate project readiness" });
  if (canUseUsersAccess(roles)) sections.push({ id: "adminUsers", label: "Users & Access", detail: "Create users and manage access" });
  if (hasGlobalAdminRole(roles)) sections.push({ id: "audit", label: "Audit", detail: "Recent protected-record activity" });
  if (hasGlobalAdminRole(roles)) sections.push({ id: "archiveExports", label: "Archive / Exports", detail: "Closeout package status" });
  sections.push(hasGlobalAdminRole(roles)
    ? { id: "security", label: "Security", detail: "Password and session controls" }
    : { id: "security", label: "Account", detail: "Password and sessions" });
  return sections;
}

function renderActiveSection() {
  if (activeSection === "security") return renderSecuritySection();
  if (activeSection === "siteDashboard") return renderSiteDashboardSection();
  if (activeSection === "students") return renderSiteStudentDirectorySection();
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

function renderOverviewSection() {
  const primaryRole = primaryRoleForUser(currentUser);
  if (["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration"].includes(primaryRole)) return renderSiteDashboardSection();
  if (primaryRole === "viewer") return renderSiteStudentDirectorySection();
  if (primaryRole === "program_teacher") return renderProgramTeacherDashboardSection();
  if (primaryRole === "mentor") return renderMentorDashboardSection();
  if (primaryRole === "student") return renderStudentSection();
  if (primaryRole === "misc_admin") return renderReadinessSection();
  return `
    <section class="workspace-card workspace-hero-card">
      <p class="workspace-kicker">Signed in</p>
      <h1>${escapeHtml(greetingForUser())}</h1>
      <p>${escapeHtml(nextStepText())}</p>
    </section>
    ${renderAccessBoundarySummary()}
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Workspace</p>
          <h2>Your workspace priorities</h2>
        </div>
      </div>
      <div class="workspace-list">
        <article class="workspace-row">
          <div>
            <strong>Capstone status</strong>
            <p>Review the progress, submission, and evidence records available to this account.</p>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Review and mentor work</strong>
            <p>Open assigned review or mentor sections when this account has access.</p>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Presentation and archive readiness</strong>
            <p>Track presentation operations and closeout status where your role grants visibility.</p>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderAccessBoundarySummary() {
  const roles = roleIds(currentUser);
  if (!roles.size) {
    return `
      <section class="workspace-card workspace-access-card" data-workspace-state="role-pending">
        <p class="workspace-kicker">Role pending</p>
        <h2>Workspace access is pending</h2>
        <p>
          Your account is signed in, but no workspace role is assigned yet. Ask your instructor
          or project coordinator to assign the right access before using protected project sections.
        </p>
        ${renderProblemState({
          reason: "This signed-in account does not have an active workspace role.",
          owner: "Project coordinator or site administrator.",
          nextAction: "Assign the correct role, then refresh the workspace.",
        })}
      </section>
    `;
  }

  const deniedSections = deniedWorkspaceSections();
  const noAssignmentSections = noAssignmentWorkspaceSections();
  if (!deniedSections.length && !noAssignmentSections.length) return "";

  return `
    ${noAssignmentSections.length ? `
    <section class="workspace-card workspace-access-card" data-workspace-state="no-active-assignment">
      <p class="workspace-kicker">No active assignment</p>
      <h2>No students are assigned to you yet</h2>
      <p>
        Your account is signed in, but there are no active student assignments for
        ${escapeHtml(noAssignmentSections.join(", "))}. Ask the project coordinator to confirm your student list.
      </p>
      ${renderProblemState({
        reason: "No active students are assigned to this account yet.",
        owner: "Assigned staff or site administrator.",
        nextAction: "Confirm the assignment, then refresh this workspace.",
      })}
    </section>
    ` : ""}
    ${deniedSections.length ? `
    <section class="workspace-card workspace-error-card" data-workspace-state="permission-denied">
      <p class="workspace-kicker">Access needed</p>
      <h2>Some workspace sections need different access</h2>
      <p>
        Your account is signed in, but this account does not have access to the
        requested section for this school.
      </p>
      <ul class="workspace-compact-list">
        ${deniedSections.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
      ${renderProblemState({
        reason: "The current account does not include every requested workspace section.",
        owner: "Project coordinator or site administrator.",
        nextAction: "Use an assigned account or ask the project coordinator for access to this school.",
      })}
    </section>
    ` : ""}
  `;
}

function renderReadOnlyBanner() {
  const roles = roleIds(currentUser);
  if (!roles.has("viewer")) return "";
  return `
    <section class="workspace-read-only-banner" data-workspace-mode="read-only" aria-label="Viewer read-only mode">
      <span class="workspace-chip workspace-role-chip" data-role-id="viewer">Viewer</span>
      <p>Read-only workspace. You can open assigned student records for context. Site-wide dashboards, approvals, assignment changes, and account updates stay with authorized staff.</p>
    </section>
  `;
}

function renderViewerMonitoringOverview(dashboard = {}) {
  const summary = dashboard.summary || {};
  const reviewFollowUp = safeNumber(summary.submissionsSubmitted) + safeNumber(summary.revisionRequested);
  const noMentor = safeNumber(summary.studentsNoMentor);
  const operationsAttention = safeNumber(summary.presentationsPending) + safeNumber(summary.exportsFailed);
  const reviewPreset = safeNumber(summary.revisionRequested) > 0 ? "revision-requested" : "submitted";
  const operationsPreset = safeNumber(summary.exportsFailed) > 0 ? "archive-failed" : "presentation-pending";

  return `
    <section class="workspace-card" data-viewer-monitoring-overview="true" aria-label="Read-only monitoring priorities">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Viewer priorities</p>
          <h2>Read-only monitoring queue</h2>
          <p class="workspace-muted">Open the exact school worklists for context; assigned staff handle approvals, assignments, account changes, and status updates.</p>
        </div>
        <span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>
      </div>
      <div class="workspace-list">
        <article class="workspace-row">
          <div>
            <strong>Review work to monitor</strong>
            <p>${escapeHtml(reviewFollowUp)} submitted or revision records may need teacher follow-up.</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(reviewFollowUp ? "pending" : "ready")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="teacher" data-section-preset="${escapeHtml(reviewPreset)}">
              Open review queue
            </button>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Mentor coverage to monitor</strong>
            <p>${escapeHtml(noMentor)} ${escapeHtml(pluralize(noMentor, "student"))} currently lack active mentor coverage.</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(noMentor ? "attention_required" : "ready")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="missing-mentors">
              View students
            </button>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Operations to monitor</strong>
            <p>${escapeHtml(operationsAttention)} presentation or archive records need school follow-up.</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(operationsAttention ? "attention_required" : "ready")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="${escapeHtml(operationsPreset)}">
              Open operations
            </button>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderSiteDashboardSection() {
  if (!hasSiteDashboardRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Site dashboard", "assigned site dashboard records");
  }
  const result = currentData.siteDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Site dashboard", "records for this assigned school");
  }
  if (result?.status === 409 && result.body?.selectionRequired) {
    return renderSiteSelectionRequired(result.body);
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Site dashboard</p>
        <h2>School dashboard unavailable</h2>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "The school dashboard could not load for the assigned site.",
          owner: "Administration or platform support.",
          nextAction: "Refresh after the site assignment is confirmed.",
        })}
      </section>
    `;
  }

  const summary = dashboard.summary || {};
  const scope = dashboard.scope || {};
  const readOnly = Boolean(scope.readOnly);
  const canOpenAudit = availableSectionIds().has("audit");
  const presentationsTotal = safeNumber(summary.presentationsScheduled) + safeNumber(summary.presentationsPending);
  const archiveTotal = safeNumber(summary.exportsQueued)
    + safeNumber(summary.exportsRunning)
    + safeNumber(summary.exportsComplete)
    + safeNumber(summary.exportsFailed);

  return `
    <section class="workspace-command-center" aria-labelledby="siteDashboardTitle">
      ${renderSiteContextBlock(dashboard)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">School dashboard</p>
          <h1 id="siteDashboardTitle">${escapeHtml(scope.siteName || "Site Dashboard")}</h1>
          <p>
            School-wide capstone health for this site, with student progress,
            mentor coverage, submitted work, and presentation readiness.
          </p>
        </div>
        <div class="workspace-command-hero-grid">
          ${statusPill(readOnly ? "configured" : "approved")}
          <span class="workspace-chip">${escapeHtml(statusText(scope.selectionMode || "current_school"))}</span>
        </div>
      </div>
      ${readOnly ? renderViewerMonitoringOverview(dashboard) : ""}
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students", summary.studentsActive, `${safeNumber(summary.studentsTotal)} visible at this site`, "admin", "students", { label: "Open", preset: "all-students" })}
        ${renderMetricTile("No Mentor", summary.studentsNoMentor, "Students missing active mentor assignments", safeNumber(summary.studentsNoMentor) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-mentors" })}
        ${renderMetricTile("Submitted", summary.submissionsSubmitted, "Awaiting teacher review", "teacher", "teacher", { label: "Review", preset: "submitted" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Teacher follow-up needed", safeNumber(summary.revisionRequested) ? "warning" : "student", "teacher", { label: "Review", preset: "revision-requested" })}
        ${renderMetricTile("Evidence", summary.evidenceArtifacts, "Summary only; open student detail for evidence records", "mentor")}
        ${renderMetricTile("Presentations", presentationsTotal, `${safeNumber(summary.presentationsPending)} pending readiness`, "teacher", "operations", { label: "Review", preset: "presentation-pending" })}
        ${renderMetricTile("Archive / Exports", archiveTotal, `${safeNumber(summary.exportsFailed)} failed`, safeNumber(summary.exportsFailed) ? "danger" : "admin", "operations", { label: "Review", preset: "archive-failed" })}
        ${renderMetricTile("Recent Activity", summary.recentActivityCount, canOpenAudit ? "Recent site activity" : "Summary only; recent activity count is shown here", "admin", canOpenAudit ? "audit" : "")}
      </div>
      ${siteStudentDetailState?.sourceSection === "siteDashboard" ? renderSiteStudentDetailSurface({
        students: (dashboard.topRiskStudents || []).map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
        scope,
      }) : ""}
      ${renderSitePermissionRules(dashboard)}
      ${renderDashboardCard("Needs Attention", "Teacher follow-up and operations", renderNeedsAttention(dashboard.needsAttention))}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
        ${renderDashboardCard("Status Breakdown", "Student status", renderStatusBreakdown(dashboard.statusBreakdown))}
        ${renderDashboardCard("Top Risk Students", "Priority student signals", renderSiteTopRiskStudents(dashboard.topRiskStudents))}
        ${renderDashboardCard("Mentor Coverage", "Mentor assignment load", renderMentorCoverage(dashboard.mentorCoverage, summary))}
        ${renderDashboardCard("Presentation Snapshot", "Readiness and day-of status", renderSnapshotRows(dashboard.presentationSnapshot, "presentation"))}
        ${renderDashboardCard("Archive / Export Snapshot", "Closeout package status", renderSnapshotRows(dashboard.archiveSnapshot, "archive"))}
        ${renderDashboardCard("Next Actions", "Recommended follow-up", renderSiteNextActions(dashboard.nextActions, readOnly))}
      </div>
    </section>
  `;
}

function renderSiteStudentDirectorySection() {
  const result = currentData.siteStudents;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Students", "assigned site student records");
  }
  if (result?.status === 409 && result.body?.selectionRequired) {
    return renderSiteDirectorySelectionRequired(result.body);
  }
  const directory = unwrap(result);
  if (!directory) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Students</p>
        <h2>Student directory unavailable</h2>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "The student directory could not load for the assigned site.",
          owner: "Administration or platform support.",
          nextAction: "Refresh after the site assignment is confirmed.",
        })}
      </section>
    `;
  }

  const scope = directory.scope || {};
  const summary = directory.summary || {};
  const pagination = directory.pagination || {};
  const students = Array.isArray(directory.students) ? directory.students : [];
  const filters = directory.filters || {};
  const readOnly = Boolean(scope.readOnly);

  return `
    <section class="workspace-command-center workspace-student-directory" aria-labelledby="siteStudentsTitle">
      ${renderSiteContextBlock(directory)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Student Directory</p>
          <h1 id="siteStudentsTitle">Students</h1>
          <p>
            Search and filter assigned student records by program, mentor coverage, progress status,
            risk, presentation readiness, and archive state without exposing private-evidence storage details.
          </p>
        </div>
        <div class="workspace-command-hero-grid">
          ${statusPill(readOnly ? "configured" : "approved")}
          <span class="workspace-chip">Assigned records only</span>
        </div>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students", summary.studentsTotal, `${safeNumber(pagination.returned)} shown now`, "admin")}
        ${renderMetricTile("No Mentor", summary.noMentor, "Needs mentor coverage", safeNumber(summary.noMentor) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-mentors" })}
        ${renderMetricTile("Submitted", summary.submitted, "Teacher review queue signal", "teacher", "students", { label: "View students", preset: "submitted-students" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Teacher follow-up", safeNumber(summary.revisionRequested) ? "warning" : "student", "students", { label: "View students", preset: "revision-students" })}
        ${renderMetricTile("Presentation Pending", summary.presentationPending, "Readiness follow-up", "teacher", "students", { label: "View students", preset: "presentation-pending-students" })}
        ${renderMetricTile("Archive Ready", summary.archiveReady, "Closeout candidates", "mentor", "students", { label: "View students", preset: "archive-ready-students" })}
        ${renderMetricTile("Archive Failed", summary.archiveFailed, "Export follow-up", safeNumber(summary.archiveFailed) ? "danger" : "admin", "students", { label: "View students", preset: "archive-failed-students" })}
        ${renderMetricTile("High Risk", summary.highRisk, "Prioritize outreach", safeNumber(summary.highRisk) ? "danger" : "admin", "students", { label: "View students", preset: "high-risk-students" })}
      </div>
      ${renderStudentDirectoryOperatingPosture(readOnly)}
      ${renderStudentDirectoryFilterBar(directory)}
      ${renderStudentDirectoryActiveFilters(filters, directory.filterOptions || {})}
      ${renderStudentDirectoryResultSummary(directory)}
      ${renderSiteStudentDetailSurface(directory)}
      ${students.length ? renderStudentRows(students, readOnly) : renderStudentDirectoryEmptyState(directory)}
    </section>
  `;
}

function renderSiteDirectorySelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="student-directory-site-selection-required">
      <p class="workspace-kicker">Students</p>
      <h2>Select a site before opening the student directory</h2>
      <p>This account can view more than one site. Choose the school workspace before opening student records.</p>
      <div class="workspace-chip-row">
        ${sites.map((site) => `
          <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
            ${escapeHtml(site.siteName || site.siteId)}
          </button>
        `).join("")}
      </div>
      ${renderProblemState({
        reason: "Multiple assigned schools are available.",
        owner: "School administration.",
        nextAction: "Choose a site from the Current site menu or one of the buttons above.",
      })}
    </section>
  `;
}

function renderStudentDirectoryOperatingPosture(readOnly) {
  return `
    <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
      <article class="workspace-empty-state-card">
        <strong>Private evidence</strong>
        <span>Rows show evidence counts while storage details remain hidden.</span>
        ${statusPill("configured")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Assigned records only</strong>
        <span>${readOnly ? "Viewer access is read-only for assigned site records." : "This view is limited to assigned site or program records."}</span>
        ${statusPill(readOnly ? "configured" : "approved")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Protected access</strong>
        <span>Directory access is reviewed without exposing private file details.</span>
        ${statusPill("approved")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Teacher follow-up</strong>
        <span>No student messaging is provided; follow-up stays with assigned staff workflows.</span>
        ${statusPill("pending")}
      </article>
    </div>
  `;
}

function renderStudentDirectoryFilterBar(directory) {
  const filters = directory.filters || {};
  const options = directory.filterOptions || {};
  return `
    <form class="workspace-filter-bar" id="siteStudentFilterForm" data-student-directory-filters="active">
      <label class="workspace-label">
        <span>Search</span>
        <input class="workspace-input" name="search" value="${escapeHtml(filters.search || "")}" autocomplete="off" maxlength="80">
      </label>
      <label class="workspace-label">
        <span>Program</span>
        <select class="workspace-select" name="programId">
          ${renderProgramFilterOptions(options.programs, filters.programId)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Status</span>
        <select class="workspace-select" name="status">
          ${renderValueOptions(options.statuses || [], filters.status || "", "Any status", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Progress</span>
        <select class="workspace-select" name="progressStatus">
          ${renderValueOptions(options.progressStatuses || [], filters.progressStatus || "", "Any progress", progressStatusFilterLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Evidence</span>
        <select class="workspace-select" name="evidenceStatus">
          ${renderValueOptions(options.evidenceStatuses || [], filters.evidenceStatus || "", "Any evidence", evidenceStatusFilterLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Review</span>
        <select class="workspace-select" name="reviewStatus">
          ${renderValueOptions(options.reviewStatuses || [], filters.reviewStatus || "", "Any review", reviewStatusFilterLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Risk</span>
        <select class="workspace-select" name="risk">
          ${renderValueOptions(options.risks || [], filters.risk || "any", "Any risk", riskLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Story bucket</span>
        <select class="workspace-select" name="story">
          ${renderValueOptions(options.storyBuckets || [], filters.story || "", "Any story", storyLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Presentation</span>
        <select class="workspace-select" name="presentationStatus">
          ${renderValueOptions(options.presentationStatuses || [], filters.presentationStatus || "any", "Any presentation", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Archive</span>
        <select class="workspace-select" name="archiveStatus">
          ${renderValueOptions(options.archiveStatuses || [], filters.archiveStatus || "any", "Any archive", statusText)}
        </select>
      </label>
      <label class="workspace-label workspace-checkbox-label">
        <input name="noMentor" type="checkbox" value="true" ${filters.noMentor ? "checked" : ""}>
        <span>No mentor</span>
      </label>
      <input name="offset" type="hidden" value="${escapeHtml(filters.offset || 0)}">
      <input name="limit" type="hidden" value="${escapeHtml(filters.limit || 50)}">
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-primary" type="submit">Apply filters</button>
        <button class="workspace-button workspace-button-secondary" type="button" data-site-student-action="reset-filters">Clear filters</button>
      </div>
    </form>
  `;
}

function renderStudentDirectoryActiveFilters(filters = {}, options = {}) {
  const chips = [];
  if (filters.search) chips.push(activeFilterChip("Search", filters.search));
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.status) chips.push(activeFilterChip("Status", statusText(filters.status)));
  if (filters.progressStatus) chips.push(activeFilterChip("Progress", progressStatusFilterLabel(filters.progressStatus)));
  if (filters.evidenceStatus) chips.push(activeFilterChip("Evidence", evidenceStatusFilterLabel(filters.evidenceStatus)));
  if (filters.reviewStatus) chips.push(activeFilterChip("Review", reviewStatusFilterLabel(filters.reviewStatus)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Risk", riskLabel(filters.risk)));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.presentationStatus && filters.presentationStatus !== "any") chips.push(activeFilterChip("Presentation", statusText(filters.presentationStatus)));
  if (filters.archiveStatus && filters.archiveStatus !== "any") chips.push(activeFilterChip("Archive", statusText(filters.archiveStatus)));
  if (filters.noMentor) chips.push(activeFilterChip("Mentor", "Missing mentor assignment"));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Student directory", chips, 'data-site-student-action="reset-filters"', filters.noMentor
    || filters.progressStatus === "missing_mentor"
    ? {
        heading: "Showing students missing mentors",
        note: "Only students without an active mentor assignment are listed.",
      }
    : {});
}

function renderStudentDirectoryResultSummary(directory) {
  const pagination = directory.pagination || {};
  const filters = directory.filters || {};
  const limit = safeNumber(pagination.limit || filters.limit || 50);
  const offset = safeNumber(pagination.offset || filters.offset || 0);
  const returned = safeNumber(pagination.returned);
  const filteredTotal = safeNumber(pagination.filteredTotal);
  const total = safeNumber(pagination.total);
  return `
    <section class="workspace-card workspace-directory-summary" aria-label="Student directory results">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Results</p>
          <h2>${filters.noMentor
            ? `Showing ${escapeHtml(returned)} of ${escapeHtml(filteredTotal)} students missing mentors`
            : `Showing ${escapeHtml(returned)} of ${escapeHtml(filteredTotal)}`}</h2>
          <p class="workspace-muted">${filters.noMentor
            ? "The list is filtered to students without active mentor assignments in the current school."
            : "Returned rows respect pagination; total and filtered totals stay tied to the selected school or program."}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(total)} total available</span>
      </div>
      <div class="workspace-directory-pagination">
        <button class="workspace-button workspace-button-secondary" type="button" data-site-student-action="previous-page" ${offset <= 0 ? "disabled" : ""}>Previous</button>
        <span class="workspace-muted">Offset ${escapeHtml(offset)} / Limit ${escapeHtml(limit)}</span>
        <button class="workspace-button workspace-button-secondary" type="button" data-site-student-action="next-page" ${(offset + returned) >= filteredTotal ? "disabled" : ""}>Next</button>
      </div>
    </section>
  `;
}

function renderStudentRows(students = [], readOnly = false) {
  return `
    <div class="workspace-student-list" aria-label="Student directory rows">
      ${students.map((student) => renderStudentRow(student, readOnly)).join("")}
    </div>
  `;
}

function renderStudentRow(student, readOnly = false) {
  const riskFlags = Array.isArray(student.riskFlags) ? student.riskFlags : [];
  return `
    <article class="workspace-student-row workspace-student-card">
      <div>
        <strong>${escapeHtml(student.displayName || "Student")}</strong>
        <p>${escapeHtml(student.email || "")}</p>
        <p class="workspace-muted">${escapeHtml(student.programName || "Unassigned")} / ${escapeHtml(student.cohortName || "No cohort")}</p>
        <div class="workspace-chip-row">
          ${student.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(student.storyBucket))}</span>` : `<span class="workspace-story-chip">Standard monitoring</span>`}
          ${riskFlags.length
            ? riskFlags.map((flag) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(flag))}</span>`).join("")
            : `<span class="workspace-risk-chip">Low risk</span>`}
        </div>
      </div>
      <div>
        <span class="workspace-muted">Mentor</span>
        <strong>${escapeHtml(student.hasActiveMentor ? (student.mentorName || "Assigned") : "No mentor")}</strong>
        <p>${escapeHtml(student.nextAction || "Continue normal capstone monitoring.")}</p>
      </div>
      <div>
        <span class="workspace-muted">Progress</span>
        <strong>${escapeHtml(safeNumber(student.progressPercent))}%</strong>
        <p>${escapeHtml(progressStatusFilterLabel(student.progressStatus || ""))}</p>
        <p class="workspace-muted">Last activity ${escapeHtml(formatDate(student.lastActivityAt))}</p>
      </div>
      <div class="workspace-row-actions">
        ${statusPill(student.latestSubmissionStatus || "draft")}
        ${statusPill(student.evidenceStatus || "missing")}
        ${statusPill(student.reviewStatus || "not_reviewed")}
        ${statusPill(student.presentationStatus || "missing")}
        ${statusPill(student.archiveStatus || "missing")}
      </div>
      <div class="workspace-row-actions">
        <span class="workspace-site-context-badge">${escapeHtml(safeNumber(student.evidenceCount))} evidence</span>
        <span class="workspace-site-context-badge">${escapeHtml(safeNumber(student.reviewCount))} reviews</span>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(student.studentId || "")}">
          View detail
        </button>
        ${readOnly ? `<span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>` : ""}
      </div>
    </article>
  `;
}

function renderStudentDirectoryEmptyState(directory) {
  const emptyState = directory.emptyState || {};
  const filters = directory.filters || {};
  const options = directory.filterOptions || {};
  const copy = studentDirectoryEmptyStateCopy(filters, options, emptyState);
  return `
    <section class="workspace-empty-state-card" data-student-directory-empty="true">
      <strong>${escapeHtml(copy.heading)}</strong>
      ${renderProblemState({
        reason: copy.reason,
        owner: copy.owner,
        nextAction: copy.nextAction,
      })}
    </section>
  `;
}

function hasActiveStudentDirectoryFilters(filters = {}) {
  return Boolean(
    filters.search
    || filters.programId
    || filters.status
    || filters.progressStatus
    || filters.evidenceStatus
    || filters.reviewStatus
    || filters.noMentor
    || (filters.risk && filters.risk !== "any")
    || filters.story
    || (filters.presentationStatus && filters.presentationStatus !== "any")
    || (filters.archiveStatus && filters.archiveStatus !== "any")
  );
}

function studentDirectoryEmptyStateCopy(filters = {}, options = {}, emptyState = {}) {
  const owner = emptyState.owner || "Assigned staff or site administrator.";
  if (!hasActiveStudentDirectoryFilters(filters)) {
    return {
      heading: "No student records are visible right now",
      reason: emptyState.reason || "No student records are visible in this view.",
      owner,
      nextAction: emptyState.nextAction || "Check the assigned school or program.",
    };
  }
  if (filters.noMentor) {
    return {
      heading: "No matching students need mentors",
      reason: "No students without active mentor assignments match these filters for this school.",
      owner,
      nextAction: "Clear filters or review active mentor coverage.",
    };
  }
  if (filters.progressStatus === "on_track") {
    return {
      heading: "No matching on-track students",
      reason: "No students without urgent support signals match these filters.",
      owner,
      nextAction: "Clear filters or review the full student list.",
    };
  }
  if (filters.progressStatus === "behind") {
    return {
      heading: "No matching support list",
      reason: "No students with high-risk or stale-activity signals match these filters.",
      owner,
      nextAction: "Clear filters or check Missing Evidence and Missing Mentor separately.",
    };
  }
  if (filters.evidenceStatus === "missing" || filters.progressStatus === "missing_evidence") {
    return {
      heading: "No matching missing-evidence students",
      reason: "No students without attached evidence match these filters.",
      owner,
      nextAction: "Clear filters or check the Review Queue for submitted work.",
    };
  }
  if (filters.reviewStatus === "needs_review" || filters.progressStatus === "needs_review") {
    return {
      heading: "No matching students need review",
      reason: "No students with submitted work awaiting review match these filters.",
      owner,
      nextAction: "Clear filters or open the Review Queue.",
    };
  }
  if (filters.status === "submitted") {
    return {
      heading: "No matching submitted work",
      reason: "No students with submitted work match these filters.",
      owner,
      nextAction: "Clear filters or check the Review Queue for broader review work.",
    };
  }
  if (filters.status === "revision_requested") {
    return {
      heading: "No matching revision follow-up",
      reason: "No students needing revision follow-up match these filters.",
      owner,
      nextAction: "Clear filters or check the Review Queue for current revision work.",
    };
  }
  if (filters.risk === "high") {
    return {
      heading: "No matching high-risk students",
      reason: "No high-risk students match these filters for this school.",
      owner,
      nextAction: "Clear filters or continue monitoring the full student list.",
    };
  }
  if (filters.presentationStatus === "pending") {
    return {
      heading: "No matching presentation follow-up",
      reason: "No students with pending presentation readiness match these filters.",
      owner,
      nextAction: "Clear filters or open Operations for broader presentation work.",
    };
  }
  if (filters.archiveStatus === "ready") {
    return {
      heading: "No matching archive-ready students",
      reason: "No students ready for archive closeout match these filters.",
      owner,
      nextAction: "Clear filters or open Operations for broader archive work.",
    };
  }
  if (filters.archiveStatus === "failed") {
    return {
      heading: "No matching archive follow-up",
      reason: "No students with archive export follow-up match these filters.",
      owner,
      nextAction: "Clear filters or open Operations for archive readiness work.",
    };
  }
  if (filters.programId) {
    const label = programLabel(options.programs, filters.programId);
    return {
      heading: "No matching students in this program",
      reason: `No visible students in ${label} match these filters.`,
      owner,
      nextAction: "Clear filters or choose another visible program.",
    };
  }
  if (filters.search) {
    return {
      heading: "No matching student search results",
      reason: "No visible students match this search and filter set.",
      owner,
      nextAction: "Clear filters or try a different student name or email.",
    };
  }
  return {
    heading: "No matching student records",
    reason: "No students match these filters for this school.",
    owner,
    nextAction: "Clear filters to see all students you can access.",
  };
}

function renderSiteStudentDetailSurface(directory) {
  const state = siteStudentDetailState || defaultSiteStudentDetailState();
  if (!state.studentId) return "";
  const selectedRow = (directory.students || []).find((student) => student.studentId === state.studentId);
  const title = selectedRow?.displayName || "Student detail";

  if (state.loading) {
    return `
      <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="loading" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2 id="siteStudentDetailTitle">${escapeHtml(title)}</h2>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">Close</button>
          </div>
          ${renderProblemState({
            reason: "Loading the student record for this school.",
            owner: "Assigned staff workspace.",
            nextAction: "Keep this worklist open while the detail response returns.",
          })}
        </div>
      </aside>
    `;
  }

  const detail = unwrap(state.result);
  if (!detail) {
    return `
      <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="error" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2 id="siteStudentDetailTitle">${escapeHtml(title)}</h2>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">Close</button>
          </div>
          ${renderApiNotice(state.result)}
          ${renderProblemState({
            reason: "This student detail is unavailable for the current school assignment.",
            owner: "Administration or platform support.",
            nextAction: "Use the visible rows or confirm the selected site assignment.",
          })}
        </div>
      </aside>
    `;
  }

  const scope = detail.scope || {};
  const student = detail.student || {};
  const activeTab = state.activeTab || "summary";
  const riskFlags = Array.isArray(student.riskFlags) ? student.riskFlags : [];
  return `
    <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="ready" data-student-detail-id="${escapeHtml(student.studentId || state.studentId)}" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
      <div class="workspace-detail-panel">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Student detail</p>
            <h2 id="siteStudentDetailTitle">${escapeHtml(student.displayName || title)}</h2>
            <p class="workspace-muted">${escapeHtml(student.email || "")}</p>
          </div>
          <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">Close</button>
        </div>
        <div class="workspace-chip-row">
          <span class="workspace-site-context-badge">${escapeHtml(scope.siteName || directory.scope?.siteName || "Selected school")}</span>
          <span class="workspace-site-context-badge">${escapeHtml(student.programName || "Unassigned")}</span>
          <span class="workspace-site-context-badge">${escapeHtml(student.cohortName || "No cohort")}</span>
          ${scope.readOnly ? `<span class="workspace-chip" data-workspace-mode="read-only">Read-only viewer</span>` : ""}
        </div>
        <div class="workspace-chip-row">
          ${statusPill(student.status || "draft")}
          ${statusPill(student.presentationStatus || "missing")}
          ${statusPill(student.archiveStatus || "missing")}
          ${student.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(student.storyBucket))}</span>` : ""}
          ${riskFlags.length ? riskFlags.map((flag) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(flag))}</span>`).join("") : `<span class="workspace-risk-chip">Low risk</span>`}
        </div>
        ${renderStudentDetailTabs(activeTab)}
        ${renderStudentDetailTab(detail, activeTab, state)}
      </div>
    </aside>
  `;
}

function renderStudentDetailTabs(activeTab) {
  const tabs = [
    ["summary", "Summary"],
    ["progress", "Progress"],
    ["submissions", "Submissions"],
    ["evidence", "Evidence"],
    ["reviews", "Reviews & Comments"],
    ["mentor", "Mentor"],
    ["presentation", "Presentation"],
    ["archive", "Archive"],
    ["timeline", "Timeline"],
  ];
  return `
    <div class="workspace-detail-tabs" role="tablist" aria-label="Student detail sections">
      ${tabs.map(([id, label]) => `
        <button class="workspace-detail-tab ${activeTab === id ? "is-active" : ""}" type="button" role="tab" data-student-detail-tab="${escapeHtml(id)}" ${activeTab === id ? 'aria-selected="true"' : ""}>
          ${escapeHtml(label)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderStudentDetailTab(detail, activeTab, state) {
  if (activeTab === "progress") return renderStudentDetailProgress(detail);
  if (activeTab === "submissions") return renderStudentDetailSubmissions(detail);
  if (activeTab === "evidence") return renderStudentDetailEvidence(detail);
  if (activeTab === "reviews") return renderStudentDetailReviews(detail);
  if (activeTab === "mentor") return renderStudentDetailMentor(detail);
  if (activeTab === "presentation") return renderStudentDetailPresentation(detail);
  if (activeTab === "archive") return renderStudentDetailArchive(detail);
  if (activeTab === "timeline") return renderStudentDetailTimeline(detail, state);
  return renderStudentDetailSummary(detail);
}

function renderStudentDetailSummary(detail) {
  const student = detail.student || {};
  const mentor = detail.mentor || {};
  const progress = detail.progress || {};
  const latestFeedback = latestStudentDetailFeedback(detail);
  return `
    <section class="workspace-detail-section" data-student-detail-section="summary">
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Current Story", "Assigned record view", `
          <p>${escapeHtml(student.nextAction || "Continue normal capstone monitoring.")}</p>
          <div class="workspace-chip-row">
            <span class="workspace-site-context-badge">${escapeHtml(safeNumber(student.evidenceCount))} evidence</span>
            <span class="workspace-site-context-badge">${escapeHtml(safeNumber(student.reviewCount))} reviews</span>
            <span class="workspace-site-context-badge">${escapeHtml(safeNumber(student.commentCount))} comments</span>
          </div>
        `)}
        ${renderDashboardCard("Mentor", mentor.active ? "Assigned student support" : "Coverage needed", `
          <strong>${escapeHtml(mentor.active ? mentor.mentorName || "Assigned mentor" : "No active mentor")}</strong>
          <p>${escapeHtml(mentor.nextAction || "Continue mentor support.")}</p>
          ${statusPill(mentor.active ? "approved" : "blocked")}
        `)}
        ${renderDashboardCard("Latest Feedback", latestFeedback.kind, `
          <div data-student-detail-feedback="latest">
            <strong>${escapeHtml(latestFeedback.title)}</strong>
            <p>${escapeHtml(latestFeedback.text)}</p>
            <p class="workspace-muted">${escapeHtml(latestFeedback.meta)}</p>
            ${statusPill(latestFeedback.status)}
          </div>
        `)}
        ${renderDashboardCard("Progress", "Progress summary", `
          <p>${escapeHtml(safeNumber(progress.requirementsComplete))} of ${escapeHtml(safeNumber(progress.requirementsTotal))} requirements complete.</p>
          <p>${escapeHtml(safeNumber(progress.percentComplete))}% complete / ${escapeHtml(progress.currentStage || "proposal")}</p>
          ${statusPill(progress.blockedReasons?.length ? "blocked" : "ready")}
        `)}
        ${renderDashboardCard("Visibility", "Protected student record", `
          <p>Details are limited to this school assignment and private file identifiers stay hidden.</p>
          <p class="workspace-muted">Review workflow controls remain in the teacher queue.</p>
          ${statusPill("configured")}
        `)}
      </div>
    </section>
  `;
}

function latestStudentDetailFeedback(detail) {
  const reviews = Array.isArray(detail.reviews) ? detail.reviews : [];
  const comments = Array.isArray(detail.comments) ? detail.comments : [];
  const items = [
    ...reviews.map((row) => ({
      kind: "Teacher review",
      title: row.requirementTitle || "Senior Project submission",
      text: row.feedback || row.nextAction || "Review recorded.",
      actor: row.reviewerName || "Reviewer",
      occurredAt: row.createdAt || "",
      status: row.decision || "under_review",
    })),
    ...comments.map((row) => ({
      kind: "Visible note",
      title: row.authorName || "Staff",
      text: row.body || "Comment recorded.",
      actor: row.authorName || "Staff",
      occurredAt: row.createdAt || "",
      status: row.visibility || "configured",
    })),
  ];

  items.sort((left, right) => {
    const leftTime = Date.parse(left.occurredAt || "");
    const rightTime = Date.parse(right.occurredAt || "");
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  });

  const item = items[0];
  if (!item) {
    return {
      kind: "Visible feedback",
      title: "No feedback recorded yet",
      text: "No visible review or comment has been recorded for this student yet.",
      meta: "Use the timeline or review queue when new feedback is added.",
      status: "configured",
    };
  }

  return {
    kind: item.kind,
    title: item.title,
    text: item.text,
    meta: `${item.actor} / ${formatDate(item.occurredAt)}`,
    status: item.status,
  };
}

function renderStudentDetailProgress(detail) {
  const progress = detail.progress || {};
  const blockedReasons = Array.isArray(progress.blockedReasons) ? progress.blockedReasons : [];
  return `
    <section class="workspace-detail-section" data-student-detail-section="progress">
      ${renderDashboardCard("Progress", "Current stage and next action", `
        <p>${escapeHtml(safeNumber(progress.requirementsComplete))} of ${escapeHtml(safeNumber(progress.requirementsTotal))} requirements complete.</p>
        <p>${escapeHtml(progress.nextAction || "Continue the next capstone milestone.")}</p>
        <div class="workspace-chip-row">
          <span class="workspace-site-context-badge">${escapeHtml(progress.currentStage || "proposal")}</span>
          <span class="workspace-site-context-badge">${escapeHtml(safeNumber(progress.percentComplete))}% complete</span>
        </div>
      `)}
      ${blockedReasons.length ? `
        <div class="workspace-empty-state-card">
          <strong>Blocked reasons</strong>
          <div class="workspace-chip-row">${blockedReasons.map((reason) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(reason))}</span>`).join("")}</div>
        </div>
      ` : ""}
    </section>
  `;
}

function renderStudentDetailSubmissions(detail) {
  const rows = detail.submissions || [];
  return renderStudentDetailList("Submissions", "Newest submitted work", rows, "No submissions are available for this student.", (row) => `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(row.requirementTitle || "Senior Project submission")}</strong>
        <p>Version ${escapeHtml(row.version || 1)} / ${escapeHtml(row.evidenceCount || 0)} evidence item${safeNumber(row.evidenceCount) === 1 ? "" : "s"}</p>
        <p class="workspace-muted">${escapeHtml(row.nextAction || "")}</p>
      </div>
      ${statusPill(row.status || "draft")}
    </article>
  `);
}

function renderStudentDetailEvidence(detail) {
  const rows = detail.evidence || [];
  return renderStudentDetailList("Evidence", "Evidence details", rows, "No evidence records are available for this student.", (row) => `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(row.title || "Evidence")}</strong>
        <p>${escapeHtml(row.artifactType || "evidence")} / ${escapeHtml(statusText(row.sourceKind || "evidence"))}</p>
        <p class="workspace-muted">${row.externalUrl ? escapeHtml(row.externalUrl) : "File details are protected."}</p>
      </div>
      <div class="workspace-row-actions">
        <span class="workspace-site-context-badge">Protected file details</span>
        ${statusPill(row.reviewStatus || "pending_review")}
      </div>
    </article>
  `);
}

function renderStudentDetailReviews(detail) {
  const reviews = detail.reviews || [];
  const comments = detail.comments || [];
  return `
    <section class="workspace-detail-section" data-student-detail-section="reviews">
      ${renderStudentDetailList("Reviews", "Teacher feedback history", reviews, "No review records are available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.requirementTitle || "Senior Project submission")}</strong>
            <p>${escapeHtml(row.feedback || "Review recorded.")}</p>
            <p class="workspace-muted">${escapeHtml(row.reviewerName || "Reviewer")} / ${escapeHtml(formatDate(row.createdAt))}</p>
          </div>
          ${statusPill(row.decision || "under_review")}
        </article>
      `)}
      ${renderStudentDetailList("Comments", "Visible notes", comments, "No visible notes are available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.authorName || "Staff")}</strong>
            <p>${escapeHtml(row.body || "Comment recorded.")}</p>
            <p class="workspace-muted">${escapeHtml(formatDate(row.createdAt))}</p>
          </div>
          ${statusPill(row.visibility || "configured")}
        </article>
      `)}
    </section>
  `;
}

function renderStudentDetailMentor(detail) {
  const mentor = detail.mentor || {};
  const history = detail.mentorAssignmentHistory || [];
  const meetings = detail.mentorMeetings || [];
  return `
    <section class="workspace-detail-section" data-student-detail-section="mentor">
      ${renderDashboardCard("Mentor", mentor.active ? "Assigned support" : "Coverage needed", `
        <strong>${escapeHtml(mentor.active ? mentor.mentorName || "Assigned mentor" : "No active mentor")}</strong>
        <p>${escapeHtml(mentor.nextAction || "Continue mentor support.")}</p>
        <div class="workspace-chip-row">
          <span class="workspace-site-context-badge">${escapeHtml(safeNumber(mentor.meetingCount))} meeting${safeNumber(mentor.meetingCount) === 1 ? "" : "s"}</span>
          ${statusPill(mentor.latestMeetingStatus || (mentor.active ? "approved" : "blocked"))}
        </div>
      `)}
      ${renderMentorMeetingForm(detail, mentor)}
      ${renderStudentDetailList("Mentor Coverage History", "Assignment timeline", history, "No mentor assignment history is available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${escapeHtml(row.nextAction || (row.active ? "Current mentor coverage is active." : "Previous mentor assignment."))}</p>
            <p class="workspace-muted">Assigned ${escapeHtml(formatDate(row.assignedAt))}${row.assignedByName ? ` by ${escapeHtml(row.assignedByName)}` : ""}</p>
          </div>
          ${statusPill(row.active ? "approved" : "configured")}
        </article>
      `)}
      ${renderStudentDetailList("Mentor Meetings", "Support timeline", meetings, "No mentor meetings are available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${escapeHtml(row.notes || row.nextAction || "Meeting recorded.")}</p>
            ${renderMentorMeetingLinkedWork(row)}
            <p class="workspace-muted">${escapeHtml(formatDate(row.heldAt || row.scheduledFor || row.createdAt))}</p>
          </div>
          ${statusPill(row.status || "pending")}
        </article>
      `)}
    </section>
  `;
}

function renderMentorMeetingForm(detail, mentor = {}) {
  if (!canRecordMentorMeeting(detail, mentor)) return "";
  const student = detail.student || {};
  const studentId = student.studentId || "";
  return `
    <form id="mentorMeetingForm" class="workspace-review-feedback" data-mentor-meeting-form="true">
      <input type="hidden" name="studentId" value="${escapeHtml(studentId)}">
      <label>
        Meeting result
        <select class="workspace-select" name="status" required>
          <option value="held" selected>Held</option>
          <option value="missed">Missed</option>
          <option value="makeup_required">Make-up required</option>
        </select>
      </label>
      <label>
        Meeting notes
        <textarea name="notes" rows="4" maxlength="1200" required></textarea>
      </label>
      <p class="workspace-muted">Only actively assigned mentors can record meetings for their assigned students.</p>
      <button class="workspace-button workspace-button-primary" type="submit" data-mentor-meeting-action="record">Record meeting</button>
    </form>
  `;
}

function canRecordMentorMeeting(detail, mentor = {}) {
  const roles = roleIds(currentUser);
  const studentId = detail?.student?.studentId || "";
  return roles.has("mentor")
    && Boolean(studentId)
    && Boolean(mentor.active)
    && Boolean(mentor.mentorUserId)
    && mentor.mentorUserId === currentUser?.id;
}

function renderMentorMeetingLinkedWork(row) {
  const title = String(row?.submissionTitle || "").trim();
  if (!title) return "";
  const version = safeNumber(row?.submissionVersion);
  const status = String(row?.submissionStatus || "").trim();
  const details = [];
  if (version > 0) details.push(`version ${version}`);
  if (status) details.push(statusText(status));
  const suffix = details.length ? ` (${details.join(", ")})` : "";
  return `<p class="workspace-muted">Linked work: ${escapeHtml(title)}${escapeHtml(suffix)}</p>`;
}

function renderStudentDetailPresentation(detail) {
  const presentation = detail.presentation || {};
  const permissions = detail.permissions || {};
  const studentId = detail.student?.studentId || detail.scope?.studentId || "";
  return `
    <section class="workspace-detail-section" data-student-detail-section="presentation">
      ${renderDashboardCard("Presentation", "Readiness and day-of status", `
        <p>${escapeHtml(presentation.nextAction || "Confirm presentation readiness when appropriate.")}</p>
        <div class="workspace-chip-row">
          <span class="workspace-site-context-badge">${escapeHtml(presentation.room || "No room")}</span>
          <span class="workspace-site-context-badge">${escapeHtml(formatDate(presentation.scheduledAt))}</span>
        </div>
        <div class="workspace-chip-row">
          ${statusPill(presentation.status || "missing")}
          ${statusPill(presentation.outlineStatus || "pending")}
          ${statusPill(presentation.checkInStatus || "missing")}
        </div>
        ${permissions.canViewPresentationOperations ? studentDetailOperationsButton(studentId) : ""}
      `)}
    </section>
  `;
}

function renderStudentDetailArchive(detail) {
  const archive = detail.archive || {};
  const permissions = detail.permissions || {};
  const studentId = detail.student?.studentId || detail.scope?.studentId || "";
  return `
    <section class="workspace-detail-section" data-student-detail-section="archive">
      ${renderDashboardCard("Archive", "Closeout package status", `
        <p>${escapeHtml(archive.nextAction || "Prepare archive readiness checks when the student reaches closeout.")}</p>
        <div class="workspace-chip-row">
          ${statusPill(archive.status || "missing")}
          ${statusPill(archive.exportStatus || "not_requested")}
          <span class="workspace-site-context-badge">Protected file details</span>
        </div>
        <p class="workspace-muted">${escapeHtml(safeNumber(archive.artifactCount))} file record${safeNumber(archive.artifactCount) === 1 ? "" : "s"} in the latest archive summary.</p>
        ${permissions.canViewArchiveOperations ? studentDetailOperationsButton(studentId) : ""}
      `)}
    </section>
  `;
}

function studentDetailOperationsButton(studentId) {
  return studentId ? `
    <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="open-operations" data-student-detail-operations-student-id="${escapeHtml(studentId)}">
      Open operations for this student
    </button>
  ` : "";
}

function renderStudentDetailTimeline(detail, state) {
  const timelineBody = unwrap(state.timelineResult);
  const events = timelineBody?.events || detail.timelinePreview || [];
  const title = timelineBody ? "Timeline" : "Timeline Preview";
  const selectedType = cleanStudentDetailTimelineType(state.timelineType || "");
  return `
    <section class="workspace-detail-section" data-student-detail-section="timeline">
      ${renderStudentDetailTimelineFilters(selectedType, Boolean(timelineBody))}
      ${state.loadingTimeline ? `
        <div class="workspace-empty-state-card">
          <strong>Loading full timeline</strong>
          ${renderProblemState({
            reason: "The full timeline is loading.",
            owner: "Assigned staff workspace.",
            nextAction: "Keep the detail panel open while events return.",
          })}
        </div>
      ` : ""}
      ${state.timelineResult && !timelineBody ? `
        <div class="workspace-empty-state-card">
          <strong>Timeline unavailable</strong>
          ${renderApiNotice(state.timelineResult)}
          ${renderProblemState({
            reason: "The full timeline could not be loaded for this account and school assignment.",
            owner: "Administration or platform support.",
            nextAction: "Use the preview or confirm the site assignment.",
          })}
        </div>
      ` : ""}
      ${renderStudentDetailList(title, "Recent activity", events, "No timeline events are available for this student.", (event) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(event.title || statusText(event.type))}</strong>
            <p>${escapeHtml(event.summary || "Timeline event recorded.")}</p>
            <p class="workspace-muted">${escapeHtml(statusText(event.type || "timeline"))} / ${escapeHtml(formatDate(event.occurredAt))}</p>
          </div>
          ${statusPill(event.status || "configured")}
        </article>
      `)}
    </section>
  `;
}

function renderStudentDetailTimelineFilters(selectedType = "", loaded = false) {
  return `
    <div class="workspace-active-filter-summary" data-student-detail-timeline-filters="true">
      <div>
        <strong>${escapeHtml(selectedType ? `Showing ${studentDetailTimelineTypeLabel(selectedType).toLowerCase()}` : "Showing all activity")}</strong>
        <p>${escapeHtml(loaded ? "Timeline filters use the authorized student timeline route." : "Open a filter to load matching student activity.")}</p>
      </div>
      <div class="workspace-quick-actions" role="group" aria-label="Timeline filters">
        ${STUDENT_DETAIL_TIMELINE_TYPES.map(([value, label]) => `
          <button class="workspace-link-button workspace-link-button-small ${value === selectedType ? "is-active" : ""}" type="button" data-student-detail-timeline-type="${escapeHtml(value)}" aria-pressed="${value === selectedType ? "true" : "false"}">
            ${escapeHtml(label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderStudentDetailList(title, detail, rows, emptyText, rowRenderer) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `
    <section class="workspace-dashboard-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(detail)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(safeNumber(safeRows.length))} shown</span>
      </div>
      ${safeRows.length ? `<div class="workspace-list">${safeRows.map(rowRenderer).join("")}</div>` : `
        <div class="workspace-empty-state-card">
          <strong>${escapeHtml(emptyText)}</strong>
          ${renderProblemState({
            reason: "This section has no records for the selected student.",
            owner: "Assigned staff workspace.",
            nextAction: "Use another detail section or return to the directory.",
          })}
        </div>
      `}
    </section>
  `;
}

function renderProgramFilterOptions(programs = [], selected = "") {
  const rows = Array.isArray(programs) ? programs : [];
  return `
    <option value="">All visible programs</option>
    ${rows.map((program) => {
      const value = program.programId || "";
      const label = `${program.programName || value || "Program"}${program.studentCount != null ? ` (${safeNumber(program.studentCount)})` : ""}`;
      return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("")}
  `;
}

function renderValueOptions(values = [], selected = "", anyLabel = "Any", labeler = statusText) {
  const rawRows = Array.isArray(values) ? values : [];
  const rows = rawRows.includes("any") ? rawRows : ["any", ...rawRows];
  return rows.map((value) => {
    const optionValue = value === "any" ? "" : value;
    const isSelected = selected === value || selected === optionValue || (!selected && value === "any");
    const label = value === "any" ? anyLabel : labeler(value);
    return `<option value="${escapeHtml(optionValue)}" ${isSelected ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function renderActiveFilterSummary(label, chips = [], resetAttribute = "", options = {}) {
  if (!chips.length) return "";
  const heading = options.heading || "Active filters";
  const note = options.note || "Reload or share this view with the current browser URL.";
  return `
    <section class="workspace-active-filters" data-active-filters="true" aria-label="${escapeHtml(label)} active filters">
      <div>
        <strong>${escapeHtml(heading)}</strong>
        <span class="workspace-active-filter-note">${escapeHtml(note)}</span>
        <div class="workspace-active-filter-chip-row">${chips.join("")}</div>
      </div>
      <button class="workspace-button workspace-button-secondary" type="button" ${resetAttribute}>Clear filters</button>
    </section>
  `;
}

function activeFilterChip(label, value) {
  return `
    <span class="workspace-active-filter-chip">
      <strong>${escapeHtml(label)}</strong>
      ${escapeHtml(value || "Selected")}
    </span>
  `;
}

function programLabel(programs = [], programId = "") {
  const match = (Array.isArray(programs) ? programs : []).find((program) => program.programId === programId);
  return match?.programName || programId || "Selected program";
}

function mentorLabel(mentors = [], mentorUserId = "") {
  const match = (Array.isArray(mentors) ? mentors : []).find((mentor) => mentor.mentorUserId === mentorUserId);
  return match?.mentorName || mentorUserId || "Selected mentor";
}

function renderSiteSelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="site-selection-required">
      <p class="workspace-kicker">Site selection required</p>
      <h2>Select a site before viewing school-wide health</h2>
      <p>This account can view more than one site. Choose the school workspace to review.</p>
      <div class="workspace-chip-row">
        ${sites.map((site) => `
          <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
            ${escapeHtml(site.siteName || site.siteId)}
          </button>
        `).join("")}
      </div>
      ${renderProblemState({
        reason: "Multiple assigned schools are available.",
        owner: "School administration.",
        nextAction: "Choose a site from the Current site menu or one of the buttons above.",
      })}
    </section>
  `;
}

function renderSiteContextBlock(dashboard) {
  const scope = dashboard.scope || {};
  const accessibleSites = scope.accessibleSites || [];
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Current site</p>
          <h2>${escapeHtml(scope.siteName || "Assigned school")} / ${escapeHtml(scope.schoolYear || "School year")}</h2>
        </div>
        ${statusPill(scope.readOnly ? "configured" : "approved")}
      </div>
      <div class="workspace-chip-row">
        <span class="workspace-site-context-badge">${escapeHtml(scope.tenantName || "School organization")}</span>
        <span class="workspace-site-context-badge">${escapeHtml(roleLabel(scope.role || primaryRoleForUser(currentUser)))}</span>
        <span class="workspace-site-context-badge">${escapeHtml(scope.readOnly ? "Read-only viewer" : "Administration access")}</span>
        <span class="workspace-site-context-badge">No student messaging</span>
      </div>
      ${accessibleSites.length > 1 ? `
        <p class="workspace-muted">
          ${safeNumber(accessibleSites.length)} accessible site${accessibleSites.length === 1 ? "" : "s"} are available.
          This view shows ${escapeHtml(scope.siteName || "the current school")} only.
        </p>
      ` : ""}
    </section>
  `;
}

function renderSitePermissionRules(dashboard) {
  const permissions = dashboard.permissions || {};
  const readOnly = Boolean(dashboard.scope?.readOnly);
  const studentRecordCopy = permissions.canViewStudentDirectory
      ? readOnly
        ? "You can open assigned student records for context; changes stay with authorized staff."
      : "This account can view assigned student records."
    : "This account is limited to dashboard review.";
  const reviewQueueCopy = permissions.canViewReviewQueue
    ? readOnly
      ? "You can review submitted work context; decisions stay with assigned program teachers."
      : "Review queue visibility is available for this site."
    : "Review queue action remains with assigned staff.";
  return `
    <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
      <article class="workspace-empty-state-card">
        <strong>Private evidence</strong>
        <span>Evidence counts are visible without exposing private file details.</span>
        ${statusPill("configured")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Assigned student records</strong>
        <span>${studentRecordCopy}</span>
        ${statusPill(permissions.canViewStudentDirectory ? "approved" : "blocked")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Protected access</strong>
        <span>Workspace access is reviewed without exposing private file details.</span>
        ${statusPill("approved")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Teacher follow-up</strong>
        <span>${reviewQueueCopy}</span>
        ${statusPill(permissions.canViewReviewQueue ? "submitted" : "pending")}
      </article>
    </div>
  `;
}

function renderSiteTopRiskStudents(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No high-risk records match this site view right now.</div>`;
  return `
    <div class="workspace-list">
      ${rows.map((row) => {
        const reasons = Array.isArray(row.riskReasons) ? row.riskReasons : [];
        return `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(row.studentName || "Student")}</strong>
              <p>${escapeHtml(row.programName || "Program")} / ${safeNumber(row.evidenceCount)} evidence</p>
              <div class="workspace-chip-row">
                ${reasons.length
                  ? reasons.map((reason) => `<span class="workspace-risk-chip">${escapeHtml(reason)}</span>`).join("")
                  : `<span class="workspace-story-chip">No critical reason</span>`}
              </div>
            </div>
            <div class="workspace-row-actions">
              ${statusPill(row.submissionStatus || "draft")}
              ${row.studentId ? `
                <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(row.studentId)}">
                  View detail
                </button>
              ` : ""}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderSiteNextActions(actions = [], readOnly = false) {
  if (!actions.length) {
    return `
      <div class="workspace-empty-state-card">
        <strong>${readOnly ? "Review only" : "No immediate action"}</strong>
        <span>No site dashboard actions are currently required.</span>
        ${statusPill(readOnly ? "configured" : "ready")}
      </div>
    `;
  }
  return `
    <div class="workspace-list">
      ${actions.map((action) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(action.label || "Next action")}</strong>
            <p>${escapeHtml(action.detail || "Review this site-level signal.")}</p>
          </div>
          ${statusPill(action.status || "pending")}
        </article>
      `).join("")}
    </div>
  `;
}

function deniedWorkspaceSections() {
  return [
    ["dashboard", "Student workspace"],
    ["siteDashboard", "Site dashboard"],
    ["siteStudents", "Students"],
    ["adminDashboard", "Admin command center"],
    ["programTeacherDashboard", "Program dashboard"],
    ["mentorDashboard", "Mentor dashboard"],
    ["reviewQueue", "Teacher review"],
    ["mentorAssignments", "Mentor assignments"],
    ["mentorAssigned", "Mentor students"],
    ["presentationSlots", "Presentation schedule"],
    ["archiveReadiness", "Archive readiness"],
    ["readiness", "Readiness report"],
  ]
    .filter(([key]) => currentData[key]?.status === 403)
    .map(([, label]) => label);
}

function noAssignmentWorkspaceSections() {
  const labels = [];
  const roles = roleIds(currentUser);
  const mentorAssigned = (unwrap(currentData.mentorDashboard)?.assignedStudents || unwrap(currentData.mentorAssigned)?.assignedStudents);
  if (roles.has("mentor") && Array.isArray(mentorAssigned) && mentorAssigned.length === 0) {
    labels.push("Mentor students");
  }
  return labels;
}

function renderAdminOverviewSection() {
  const result = currentData.adminDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Admin command center", "school-wide operational records");
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Admin command center</p>
        <h2>Admin dashboard unavailable</h2>
        ${renderApiNotice(result)}
        <p>School-wide dashboard data is unavailable right now.</p>
      </section>
    `;
  }

  const summary = dashboard.summary || {};
  const exportsAttention = safeNumber(summary.exportsFailed) > 0
    ? `${safeNumber(summary.exportsFailed)} failed`
    : `${safeNumber(summary.exportsComplete)} complete`;
  return `
    <section class="workspace-command-center" aria-labelledby="adminCommandTitle">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Admin Command Center</p>
          <h1 id="adminCommandTitle">School-Wide Operations</h1>
          <p>School-wide progress, review workload, mentor coverage, presentation readiness, and audit activity.</p>
        </div>
        <div class="workspace-command-hero-grid">
          <span class="workspace-chip">Global admin</span>
          <span class="workspace-chip">${escapeHtml(formatDate(dashboard.generatedAt))}</span>
        </div>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students", summary.studentsActive, `${safeNumber(summary.studentsNoMentor)} without active mentor`, "admin", "students", { label: "Open", preset: "all-students" })}
        ${renderMetricTile("Submitted", summary.submissionsSubmitted, "Ready for review", "teacher", "teacher", { label: "Review", preset: "submitted" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Open revision loops", "warning", "teacher", { label: "Review", preset: "revision-requested" })}
        ${renderMetricTile("Approved", summary.approved, "Accepted submissions", "student")}
        ${renderMetricTile("Evidence", summary.evidenceArtifacts, "Summary only; open student detail for evidence records", "mentor")}
        ${renderMetricTile("Presentations", summary.presentationScheduled, "Scheduled slots", "teacher", "operations", { label: "Review", preset: "presentation-pending" })}
        ${renderMetricTile("Exports", summary.exportsQueued, exportsAttention, safeNumber(summary.exportsFailed) ? "danger" : "admin", "archiveExports")}
        ${renderMetricTile("Audit", summary.recentAuditEvents, "Recent protected activity", "admin", "audit")}
      </div>
      ${renderDashboardCard("Needs Attention", "Operational risks", renderNeedsAttention(dashboard.needsAttention))}
      ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Review Workload", "Submitted and revision records", renderReviewQueueSummary(dashboard.reviewQueue))}
        ${renderDashboardCard("Mentor Coverage", "Active assignment load", renderMentorCoverage(dashboard.mentorCoverage, summary))}
        ${renderDashboardCard("Presentation Snapshot", "Day-of readiness", renderSnapshotRows(dashboard.presentationSnapshot))}
        ${renderDashboardCard("Archive / Export Snapshot", "Closeout package status", renderSnapshotRows(dashboard.archiveSnapshot))}
        ${renderDashboardCard("Recent Audit", "Protected activity", renderAuditSummary(dashboard.recentAudit))}
        ${renderDashboardCard("Quick Actions", "Admin tools", renderQuickActions([
          { label: "Teacher Review", detail: "Open submitted work", section: "teacher" },
          { label: "Presentation", detail: "Review schedule", section: "presentation" },
          { label: "Reports", detail: "Open readiness", section: "readiness" },
          { label: "Users & Access", detail: "Create users", section: "adminUsers" },
          { label: "Audit", detail: "Review activity", section: "audit" },
          { label: "Archive / Exports", detail: "Check packages", section: "archiveExports" },
        ]))}
      </div>
    </section>
  `;
}

function renderProgramTeacherDashboardSection() {
  const result = currentData.programTeacherDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Program dashboard", "assigned program or cohort records");
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Program dashboard</p>
        <h2>Program dashboard unavailable</h2>
        ${renderApiNotice(result)}
      </section>
    `;
  }
  const summary = dashboard.summary || {};
  const scopeTypeLabel = programDashboardScopeTypeLabel(dashboard.scope);
  const scopeIdLabel = programDashboardScopeIdLabel(dashboard.scope);
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Program Dashboard</p>
          <h1>Program Teacher Dashboard</h1>
          <p>Track student progress, review evidence, and find students who need support in your assigned program or cohort.</p>
        </div>
        <div class="workspace-command-hero-grid">
          <span class="workspace-chip">${escapeHtml(scopeTypeLabel)}</span>
          <span class="workspace-chip">${escapeHtml(scopeIdLabel)}</span>
        </div>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Total Students", summary.totalStudents ?? summary.scopedStudents, "Students in your program view", "teacher", "students", { label: "View students", preset: "all-students" })}
        ${renderMetricTile("On Track", summary.onTrack, "No urgent support signal", "student", "students", { label: "View students", preset: "on-track-students" })}
        ${renderMetricTile("Behind / Needs Support", summary.behindSupport, "Risk or stale activity signals", safeNumber(summary.behindSupport) ? "danger" : "admin", "students", { label: "View students", preset: "behind-students" })}
        ${renderMetricTile("Missing Evidence", summary.missingEvidence, "Students without attached evidence", safeNumber(summary.missingEvidence) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-evidence-students" })}
        ${renderMetricTile("Needs Review", summary.needsReview ?? summary.submitted, "Submitted work awaiting teacher review", "teacher", "teacher", { label: "Review", preset: "submitted" })}
        ${renderMetricTile("Missing Mentor", summary.missingMentor ?? summary.noMentor, "Needs mentor coverage", safeNumber(summary.missingMentor ?? summary.noMentor) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-mentors" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Returned work needing follow-up", safeNumber(summary.revisionRequested) ? "warning" : "student", "teacher", { label: "Review", preset: "revision-requested" })}
      </div>
      ${siteStudentDetailState?.sourceSection === "programDashboard" ? renderSiteStudentDetailSurface({
        students: (dashboard.students || []).map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
      }) : ""}
      ${renderDashboardCard("Needs Attention", "Priority follow-up", renderNeedsAttention(dashboard.needsAttention))}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Needs Review", "Submitted and revision records", renderReviewQueueSummary(dashboard.needsReview, { allowStudentDetail: true }))}
        ${renderDashboardCard("Recent Activity", "Latest student updates", renderRecentProgramActivity(dashboard.recentActivity))}
        ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
        ${renderDashboardCard("Students", "Assigned student list", renderScopedStudentList(dashboard.students))}
      </div>
    </section>
  `;
}

function programDashboardScopeTypeLabel(scope = {}) {
  const scopeType = String(scope?.scopeType || "").toLowerCase();
  if (scopeType === "program") return "Program assignment";
  if (scopeType === "cohort") return "Cohort assignment";
  if (scopeType === "global") return "All assigned students";
  return "Assigned students";
}

function programDashboardScopeIdLabel(scope = {}) {
  const scopeId = String(scope?.scopeId || "").trim();
  if (!scopeId || scopeId === "global") return "Current student group";
  return statusText(scopeId);
}

function renderMentorDashboardSection() {
  const result = currentData.mentorDashboard?.ok
    ? currentData.mentorDashboard
    : currentData.mentorAssigned || currentData.mentorDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Mentor dashboard", "actively assigned student records");
  }
  const body = unwrap(result);
  if (!body) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Mentor dashboard</p>
        <h2>Assigned-student dashboard unavailable</h2>
        ${renderApiNotice(result)}
      </section>
    `;
  }
  const assigned = prioritizeMentorDashboardStudents(body.assignedStudents || []);
  const summary = body.summary || {
    assignedCount: assigned.length,
    needsRevision: assigned.filter((student) => student.submissionStatus === "revision_requested").length,
    missingMeeting: 0,
    presentationPending: 0,
  };
  const activeFilter = cleanMentorDashboardFilter(mentorDashboardFilter);
  const filteredAssigned = filterMentorDashboardStudents(assigned, activeFilter);
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Mentor Dashboard</p>
          <h1>Assigned Student Focus</h1>
          <p>Only actively assigned students appear here, with evidence, meeting, and presentation signals.</p>
        </div>
        <div class="workspace-command-hero-grid">
          <span class="workspace-chip">${escapeHtml(statusText(body.scope || "mentor_assigned"))}</span>
          <span class="workspace-chip">${safeNumber(summary.assignedCount)} assigned</span>
        </div>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Assigned", summary.assignedCount, "Active student assignments", "mentor")}
        ${renderMetricTile("Needs Revision", summary.needsRevision, "Revision follow-up", "warning")}
        ${renderMetricTile("Meetings", summary.missingMeeting, "Need meeting attention", "warning")}
        ${renderMetricTile("Presentations", summary.presentationPending, "Pending readiness", "teacher", "presentation")}
      </div>
      ${assigned.length ? renderMentorDashboardFilters(assigned, activeFilter) : ""}
      ${siteStudentDetailState?.sourceSection === "mentorDashboard" ? renderSiteStudentDetailSurface({
        students: assigned.map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
      }) : ""}
      ${assigned.length && filteredAssigned.length ? `
        ${renderDashboardCard("Assigned Students", mentorDashboardFilterKicker(activeFilter), renderMentorStudentCards(filteredAssigned))}
      ` : assigned.length ? `
        ${renderDashboardCard("Assigned Students", mentorDashboardFilterKicker(activeFilter), renderMentorDashboardFilterEmptyState(activeFilter))}
      ` : `
        <section class="workspace-dashboard-card workspace-empty" data-workspace-state="no-active-assignment">
          <strong>No students are assigned to you yet</strong>
          <span>Mentor students</span>
          No students are assigned to this mentor account yet.
          ${renderProblemState({
            reason: "No active students are assigned to this account yet.",
            owner: "Project coordinator or site administrator.",
            nextAction: "Confirm the mentor assignment, then refresh this workspace.",
          })}
        </section>
      `}
    </section>
  `;
}

function renderMentorAssignmentsSection() {
  if (!hasSiteMentorAssignmentRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Mentor assignments", "assigned site mentor coverage records");
  }
  const result = currentData.mentorAssignments;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Mentor assignments", "assigned site mentor coverage records");
  }
  if (result?.status === 409 && result.body?.selectionRequired) {
    return renderMentorAssignmentSelectionRequired(result.body);
  }
  const body = unwrap(result);
  if (!body) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Mentor assignments</p>
        <h2>Mentor coverage unavailable</h2>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "Mentor coverage could not load for the assigned site.",
          owner: "Site administration or platform support.",
          nextAction: "Refresh after the site assignment is confirmed.",
        })}
      </section>
    `;
  }

  const scope = body.scope || {};
  const summary = body.summary || {};
  const permissions = body.permissions || {};
  const mentors = body.mentors || [];
  const unassignedStudents = body.unassignedStudents || [];
  const assignments = body.assignments || [];
  const pagination = body.pagination || {};
  const canManage = Boolean(permissions.canManageMentorAssignments);
  const readOnly = Boolean(scope.readOnly || !canManage);
  const hasActiveUnassignedFilters = hasActiveMentorAssignmentFilters(mentorAssignmentFiltersForBody(body));
  return `
    <section class="workspace-command-center workspace-mentor-assignments" aria-labelledby="mentorAssignmentsTitle">
      ${renderSiteContextBlock(body)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Mentor coverage</p>
          <h1 id="mentorAssignmentsTitle">Mentor Assignments</h1>
          <p>
            Resolve mentor coverage for this school with assigned records,
            protected evidence boundaries, and teacher follow-up signals. No student messaging.
          </p>
        </div>
        <div class="workspace-command-hero-grid">
          ${statusPill(canManage ? "approved" : "configured")}
          <span class="workspace-chip">${escapeHtml(canManage ? "Assignment controls enabled" : "Read-only")}</span>
        </div>
      </div>
      ${renderApiNotice(result)}
      ${readOnly ? `
        <section class="workspace-read-only-banner" data-mentor-assignment-read-only="true">
          <strong>Read-only mentor coverage</strong>
          <p>This view is for coverage monitoring. Assignment changes stay with authorized site operations.</p>
        </section>
      ` : ""}
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students With Mentors", summary.studentsWithActiveMentor, "Active mentor coverage", "mentor", "mentorAssignments", { label: "View assignments", preset: "active-assignments" })}
        ${renderMetricTile("Missing Mentors", summary.studentsWithoutActiveMentor, "Needs assignment follow-up", safeNumber(summary.studentsWithoutActiveMentor) ? "warning" : "mentor", "mentorAssignments", { label: "View students", preset: "no-mentor" })}
        ${renderMetricTile("Active Mentors", summary.activeMentors, "Current mentor pool", "admin")}
        ${renderMetricTile("Overloaded Mentors", summary.overloadedMentors, "Review load before assigning", safeNumber(summary.overloadedMentors) ? "danger" : "admin")}
      </div>
      ${renderMentorAssignmentFilters(body)}
      ${renderMentorAssignmentActiveFilters(mentorAssignmentFiltersForBody(body), body?.filterOptions || {})}
      ${siteStudentDetailState?.sourceSection === "mentorAssignments" ? renderSiteStudentDetailSurface({
        students: [
          ...unassignedStudents.map((row) => ({
            studentId: row.studentId,
            displayName: row.displayName,
          })),
          ...assignments.map((row) => ({
            studentId: row.studentId,
            displayName: row.studentName,
          })),
        ],
      }) : ""}
      <div class="workspace-mentor-assignment-layout">
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Coverage queue</p>
              <h2>Unassigned students</h2>
              <p>${safeNumber(unassignedStudents.length)} shown of ${safeNumber(pagination.filteredTotal)} matching students at this school.</p>
            </div>
            <span class="workspace-site-context-badge">${safeNumber(pagination.total)} assigned records</span>
          </div>
          ${unassignedStudents.length ? renderMentorUnassignedStudents(unassignedStudents, permissions) : `
            <section class="workspace-empty-state-card" data-mentor-assignments-empty="true">
              <h2>${hasActiveUnassignedFilters ? "No matching students need mentors" : "No students need mentors right now"}</h2>
              ${renderProblemState(body.emptyState || {
                reason: hasActiveUnassignedFilters
                  ? "No students without active mentors match these filters at this school."
                  : "Every visible student at this school has active mentor coverage.",
                owner: "Site administration.",
                nextAction: hasActiveUnassignedFilters
                  ? "Clear filters or review active assignments."
                  : "Keep monitoring coverage and review active assignments as students change programs or status.",
              })}
            </section>
          `}
          ${renderMentorAssignmentPagination(pagination)}
        </section>
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">${canManage ? "Assign mentor" : "Coverage context"}</p>
              <h2>${canManage ? "Assign Mentor" : "Assignment Changes"}</h2>
              <p>${canManage ? "Assign one mentor to one currently unassigned student at this school." : "Use this panel to see why changes are unavailable for this account."}</p>
            </div>
          </div>
          ${canManage ? renderMentorAssignmentForm(body) : `
            <section class="workspace-empty-state-card" data-mentor-assignment-controls-hidden="true">
              <h2>Assignment changes unavailable</h2>
              ${renderProblemState({
                reason: "This workspace is read-only for mentor coverage.",
                owner: "Authorized site administrator.",
                nextAction: "Use this section for coverage context, or ask a site administrator to assign mentors.",
              })}
            </section>
          `}
        </section>
      </div>
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Mentor Coverage", "Mentor workload at this school", renderMentorCoverageRows(mentors))}
        ${renderDashboardCard("Active Assignments", "Current assignments", renderMentorActiveAssignments(assignments, permissions))}
      </div>
    </section>
  `;
}

function renderMentorAssignmentSelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="mentor-assignment-site-selection-required">
      <p class="workspace-kicker">Mentor assignments</p>
      <h2>Select a site before viewing mentor coverage</h2>
      <p>This account can view more than one site. Choose the school workspace before reviewing mentor coverage.</p>
      <div class="workspace-chip-row">
        ${sites.map((site) => `
          <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
            ${escapeHtml(site.siteName || site.siteId)}
          </button>
        `).join("")}
      </div>
      ${renderProblemState({
        reason: "Multiple assigned schools are available.",
        owner: "School administration.",
        nextAction: "Choose a site from the Current site menu or one of the buttons above.",
      })}
    </section>
  `;
}

function renderMentorAssignmentFilters(body) {
  const filters = body?.filters || mentorAssignmentFilters || defaultMentorAssignmentFilters();
  const options = body?.filterOptions || {};
  const mentors = options.mentors || body?.mentors || [];
  return `
    <form id="mentorAssignmentFilterForm" class="workspace-filter-bar" data-mentor-assignment-filters="true">
      <label class="workspace-label">
        <span>Program</span>
        <select class="workspace-select" name="programId">
          ${renderProgramFilterOptions(options.programs, filters.programId)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Mentor</span>
        <select class="workspace-select" name="mentorUserId">
          <option value="" ${!filters.mentorUserId ? "selected" : ""}>All mentors</option>
          ${mentors.map((mentor) => {
            const mentorId = mentor.mentorUserId || "";
            const count = mentor.activeAssignmentCount != null ? ` (${safeNumber(mentor.activeAssignmentCount)})` : "";
            return `<option value="${escapeHtml(mentorId)}" ${filters.mentorUserId === mentorId ? "selected" : ""}>${escapeHtml((mentor.mentorName || "Mentor") + count)}</option>`;
          }).join("")}
        </select>
      </label>
      <label class="workspace-label">
        <span>Status</span>
        <select class="workspace-select" name="status">
          <option value="" ${!filters.status ? "selected" : ""}>All coverage</option>
          ${(options.statuses || ["active", "unassigned", "all"]).map((status) => `
            <option value="${escapeHtml(status)}" ${filters.status === status ? "selected" : ""}>${escapeHtml(statusText(status))}</option>
          `).join("")}
        </select>
      </label>
      <label class="workspace-label">
        <span>Student search</span>
        <input class="workspace-input" name="studentSearch" type="search" value="${escapeHtml(filters.studentSearch || "")}" autocomplete="off" maxlength="80">
      </label>
      <label class="workspace-label workspace-checkbox-label">
        <input name="noMentor" type="checkbox" value="true" ${filters.noMentor ? "checked" : ""}>
        <span>No mentor</span>
      </label>
      <input name="offset" type="hidden" value="${escapeHtml(filters.offset || 0)}">
      <input name="limit" type="hidden" value="${escapeHtml(filters.limit || 50)}">
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-primary" type="submit">Apply filters</button>
        <button class="workspace-button workspace-button-secondary" type="button" data-mentor-assignment-action="reset-filters">Clear filters</button>
      </div>
    </form>
  `;
}

function mentorAssignmentFiltersForBody(body = {}) {
  return body?.filters || mentorAssignmentFilters || defaultMentorAssignmentFilters();
}

function renderMentorAssignmentActiveFilters(filters = {}, options = {}) {
  const chips = [];
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.mentorUserId) chips.push(activeFilterChip("Mentor", mentorLabel(options.mentors, filters.mentorUserId)));
  if (filters.status) chips.push(activeFilterChip("Coverage", statusText(filters.status)));
  if (filters.studentSearch) chips.push(activeFilterChip("Student search", filters.studentSearch));
  if (filters.noMentor) chips.push(activeFilterChip("Mentor", "No active mentor"));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Mentor assignments", chips, 'data-mentor-assignment-action="reset-filters"');
}

function hasActiveMentorAssignmentFilters(filters = {}) {
  return Boolean(
    filters.programId
    || filters.mentorUserId
    || filters.status
    || filters.studentSearch
    || filters.noMentor
    || safeNumber(filters.limit) !== 50
    || safeNumber(filters.offset) > 0,
  );
}

function renderMentorUnassignedStudents(students = [], permissions = {}) {
  return `
    <div class="workspace-list" data-mentor-unassigned-list="true">
      ${students.map((student) => `
        <article class="workspace-student-row workspace-student-card">
          <div>
            <strong>${escapeHtml(student.displayName || "Student")}</strong>
            <p>${escapeHtml(student.email || "")}</p>
            <p class="workspace-muted">${escapeHtml(student.programName || "Unassigned")} / ${escapeHtml(student.cohortName || "No cohort")}</p>
            <div class="workspace-chip-row">
              ${student.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(student.storyBucket))}</span>` : `<span class="workspace-story-chip">Coverage follow-up</span>`}
              ${renderRiskChips(student.riskFlags || [])}
            </div>
          </div>
          <div class="workspace-row-meta">
            ${statusPill(student.latestSubmissionStatus || "draft")}
            <span class="workspace-site-context-badge">${safeNumber(student.riskScore)} risk</span>
          </div>
          <div class="workspace-row-actions">
            <p>${escapeHtml(student.nextAction || "Assign a mentor for this school.")}</p>
            ${permissions.canViewStudentDetail ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="open-student" data-mentor-student-id="${escapeHtml(student.studentId || "")}">
                View student detail
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMentorAssignmentForm(body) {
  const students = body?.unassignedStudents || [];
  const mentors = body?.mentors || [];
  return students.length && mentors.length ? `
    <form id="mentorAssignmentForm" class="workspace-review-feedback" data-mentor-assignment-form="true">
      <label>
        <span>Student</span>
        <select class="workspace-select" name="studentId" required>
          ${students.map((student) => `<option value="${escapeHtml(student.studentId || "")}">${escapeHtml(student.displayName || "Student")} / ${escapeHtml(student.programName || "Unassigned")}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Mentor</span>
        <select class="workspace-select" name="mentorUserId" required>
          ${mentors.map((mentor) => `<option value="${escapeHtml(mentor.mentorUserId || "")}">${escapeHtml(mentorAssignmentOptionLabel(mentor))}</option>`).join("")}
        </select>
      </label>
      ${renderMentorAssignmentLoadGuidance(mentors)}
      <label>
        <span>Reason</span>
        <textarea name="reason" rows="4" maxlength="240" required></textarea>
      </label>
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-primary" type="submit" data-mentor-assignment-action="assign">Assign mentor</button>
      </div>
      <p class="workspace-muted">Assignments stay within the current school and do not create users or credentials.</p>
    </form>
  ` : `
    <section class="workspace-empty-state-card" data-mentor-assignment-form-empty="true">
      <h2>No assignment can be made right now</h2>
      ${renderProblemState({
        reason: students.length ? "No active mentors are available at this school." : "No currently unassigned students are visible in this page.",
        owner: "Site administration.",
        nextAction: "Adjust filters or confirm active mentor and student memberships for this school.",
      })}
    </section>
  `;
}

function mentorAssignmentOptionLabel(mentor = {}) {
  return `${mentor.mentorName || "Mentor"} / ${safeNumber(mentor.activeAssignmentCount)} active / ${mentorLoadStatusLabel(mentor.loadStatus)}`;
}

function mentorLoadStatusLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "available") return "Available";
  if (normalized === "steady") return "Steady load";
  if (normalized === "overloaded") return "High load";
  return statusText(value || "available");
}

function renderMentorAssignmentLoadGuidance(mentors = []) {
  const rows = Array.isArray(mentors) ? mentors : [];
  if (!rows.length) return "";
  const lightest = [...rows].sort((left, right) => {
    const leftCount = safeNumber(left.activeAssignmentCount);
    const rightCount = safeNumber(right.activeAssignmentCount);
    if (leftCount !== rightCount) return leftCount - rightCount;
    return String(left.mentorName || "").localeCompare(String(right.mentorName || ""));
  })[0];
  const overloadedCount = rows.filter((mentor) => normalizeStatus(mentor.loadStatus) === "overloaded").length;
  return `
    <section class="workspace-empty-state-card" data-mentor-assignment-load-guidance="true">
      <strong>Mentor load is shown before assignment</strong>
      <p>Review active assignment counts and load labels before saving a new mentor assignment.</p>
      <div class="workspace-chip-row">
        <span class="workspace-chip">Lightest visible mentor: ${escapeHtml(mentorAssignmentOptionLabel(lightest))}</span>
        ${overloadedCount ? `<span class="workspace-chip">${escapeHtml(overloadedCount)} high-load mentor${overloadedCount === 1 ? "" : "s"}</span>` : ""}
      </div>
    </section>
  `;
}

function renderMentorAssignmentPagination(pagination = {}) {
  const limit = safeNumber(pagination.limit || mentorAssignmentFilters.limit || 50);
  const offset = safeNumber(pagination.offset || mentorAssignmentFilters.offset || 0);
  const returned = safeNumber(pagination.returned);
  const filteredTotal = safeNumber(pagination.filteredTotal);
  return `
    <div class="workspace-directory-pagination" aria-label="Mentor assignment pagination">
      <button class="workspace-button workspace-button-secondary" type="button" data-mentor-assignment-action="previous-page" ${offset <= 0 ? "disabled" : ""}>Previous</button>
      <span class="workspace-muted">Offset ${escapeHtml(offset)} / Limit ${escapeHtml(limit)}</span>
      <button class="workspace-button workspace-button-secondary" type="button" data-mentor-assignment-action="next-page" ${(offset + returned) >= filteredTotal ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function renderMentorCoverageRows(mentors = []) {
  return mentors.length ? `
    <div class="workspace-list" data-mentor-coverage-list="true">
      ${mentors.map((mentor) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(mentor.mentorName || "Mentor")}</strong>
            <p>${escapeHtml(mentor.email || "")}</p>
            <p class="workspace-muted">${escapeHtml(mentor.siteName || "Selected school")} / ${safeNumber(mentor.activeAssignmentCount)} active assignment${safeNumber(mentor.activeAssignmentCount) === 1 ? "" : "s"}</p>
          </div>
          <div class="workspace-row-meta">
            ${statusPill(mentor.loadStatus || "available")}
            ${mentor.mentorUserId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="filter-mentor" data-mentor-id="${escapeHtml(mentor.mentorUserId || "")}">
                View assignments
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No mentors at this school match these filters.</div>`;
}

function renderMentorActiveAssignments(assignments = [], permissions = {}) {
  return assignments.length ? `
    <div class="workspace-list" data-mentor-active-assignments="true">
      ${assignments.map((assignment) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(assignment.studentName || "Student")}</strong>
            <p>${escapeHtml(assignment.mentorName || "Mentor")} / ${escapeHtml(assignment.programName || "Unassigned")}</p>
            <p class="workspace-muted">Assigned ${escapeHtml(formatDate(assignment.assignedAt))}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(assignment.active ? "active" : "blocked")}
            ${permissions.canViewStudentDetail ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="open-student" data-mentor-student-id="${escapeHtml(assignment.studentId || "")}">
                View student detail
              </button>
            ` : ""}
            ${assignment.mentorUserId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="filter-mentor" data-mentor-id="${escapeHtml(assignment.mentorUserId || "")}">
                View mentor load
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No active assignments match these filters.</div>`;
}

function renderOperationsReadinessSection() {
  if (!hasSiteOperationsRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Operations readiness", "site presentation, archive, and readiness worklists");
  }
  const result = currentData.operationsReadiness;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Operations readiness", "site presentation, archive, and readiness worklists");
  }
  if (result?.status === 409 && result.body?.selectionRequired) {
    return renderOperationsSelectionRequired(result.body);
  }
  const body = unwrap(result);
  if (!body) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Operations</p>
        <h2>Operations readiness unavailable</h2>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "Operations readiness could not load for the current site.",
          owner: "Site administration or platform support.",
          nextAction: "Refresh after the site assignment is confirmed.",
        })}
      </section>
    `;
  }

  const scope = body.scope || {};
  const summary = body.summary || {};
  const presentation = body.presentation || {};
  const archive = body.archive || {};
  const readiness = body.readiness || {};
  const permissions = body.permissions || {};
  const pagination = body.pagination || {};
  const readOnly = Boolean(scope.readOnly);
  return `
    <section class="workspace-command-center workspace-operations-readiness" aria-labelledby="operationsReadinessTitle">
      ${renderSiteContextBlock(body)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Presentation readiness / Archive readiness</p>
          <h1 id="operationsReadinessTitle">Operations</h1>
          <p>
            Worklists for presentation readiness, archive readiness, protected evidence,
            assigned records, and teacher follow-up. No student messaging.
          </p>
        </div>
        <div class="workspace-command-hero-grid">
          ${statusPill(readOnly ? "configured" : "ready")}
          <span class="workspace-chip">${escapeHtml(readOnly ? "Read-only worklists" : "Operations ready")}</span>
        </div>
      </div>
      ${renderApiNotice(result)}
      <section class="workspace-read-only-banner" data-operations-read-only="true">
        <strong>Read-only operations worklists</strong>
        <p>These worklists are monitoring-only. Open student detail for blocker context; status changes stay with authorized staff.</p>
      </section>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Presentation Ready", summary.presentationReady, "Ready or complete signals", "teacher")}
        ${renderMetricTile("Presentation Pending", summary.presentationPending, "Outline or schedule attention", safeNumber(summary.presentationPending) ? "warning" : "teacher", "operations", { label: "Review rows", preset: "presentation-pending" })}
        ${renderMetricTile("Check-In Needed", presentation.summary?.attentionRequired, "Presentation checked out but not checked in", safeNumber(presentation.summary?.attentionRequired) ? "danger" : "teacher", "operations", { label: "Review rows", preset: "presentation-attention" })}
        ${renderMetricTile("Outline Pending", summary.outlinePending, "Needs outline approval", safeNumber(summary.outlinePending) ? "warning" : "teacher", "operations", { label: "Review rows", preset: "outline-pending" })}
        ${renderMetricTile("Archive Ready", summary.archiveReady, "Ready or complete package state", "mentor")}
        ${renderMetricTile("Archive In Progress", summary.archiveInProgress, "Packages being prepared", safeNumber(summary.archiveInProgress) ? "warning" : "admin", "operations", { label: "Review rows", preset: "archive-in-progress" })}
        ${renderMetricTile("Archive Expiring Soon", summary.archiveExpiringSoon, "Download windows ending soon", safeNumber(summary.archiveExpiringSoon) ? "warning" : "admin", "operations", { label: "Review rows", preset: "archive-expiring-soon" })}
        ${renderMetricTile("Archive Expired", summary.archiveExpired, "Download windows expired", safeNumber(summary.archiveExpired) ? "danger" : "admin", "operations", { label: "Review rows", preset: "archive-expired" })}
        ${renderMetricTile("Archive Failed", summary.archiveFailed, "Needs archive follow-up", safeNumber(summary.archiveFailed) ? "danger" : "admin", "operations", { label: "Review rows", preset: "archive-failed" })}
        ${renderMetricTile("Storage Setup Needed", archive.summary?.providerUnavailable, "Archive package setup blocked", safeNumber(archive.summary?.providerUnavailable) ? "danger" : "admin", "operations", { label: "Review rows", preset: "archive-provider-unavailable" })}
        ${renderMetricTile("Needs Attention", summary.needsAttention, "Blocked, missing, or high-risk rows", safeNumber(summary.needsAttention) ? "danger" : "admin", "operations", { label: "Review rows", preset: "needs-attention" })}
        ${renderMetricTile("Stale Activity", summary.staleActivity, "No recent student progress", safeNumber(summary.staleActivity) ? "warning" : "admin", "operations", { label: "Review rows", preset: "stale-activity" })}
        ${renderMetricTile("Evidence Missing", summary.evidenceMissing, "Evidence or submission progress missing", safeNumber(summary.evidenceMissing) ? "warning" : "mentor", "operations", { label: "Review rows", preset: "evidence-missing" })}
      </div>
      ${renderOperationsFilters(body)}
      ${renderOperationsActiveFilters(body?.filters || operationsReadinessFilters || defaultOperationsReadinessFilters(), body?.filterOptions || {})}
      ${renderSiteStudentDetailSurface({ students: operationRowsForDetail(body) })}
      <section class="workspace-card workspace-directory-summary" aria-label="Operations readiness results">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Results</p>
            <h2>Showing ${safeNumber(pagination.returned)} of ${safeNumber(pagination.filteredTotal)}</h2>
            <p class="workspace-muted">Rows are limited to the current school and sorted with blocked or pending attention first.</p>
          </div>
          <span class="workspace-site-context-badge">${safeNumber(pagination.total)} total available</span>
        </div>
        ${renderOperationsPagination(pagination)}
      </section>
      <div class="workspace-operations-layout">
        ${renderDashboardCard("Presentation", "Schedule, outline, and day-of readiness", renderPresentationWorklistRows(presentation.rows || [], permissions, body.filters || operationsReadinessFilters))}
        ${renderDashboardCard("Archive", "Package readiness and export failures", renderArchiveWorklistRows(archive.rows || [], permissions, body.filters || operationsReadinessFilters))}
        ${renderDashboardCard("Readiness", "Attention rows and next actions", renderReadinessAttentionRows(readiness.attentionRows || [], permissions, body.filters || operationsReadinessFilters))}
      </div>
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Program Breakdown", "Readiness by visible program", renderOperationsProgramBreakdown(readiness.filteredProgramBreakdown || readiness.programBreakdown || []))}
        ${renderDashboardCard("Next Actions", "Grouped staff follow-up", renderOperationsNextActions(readiness.nextActions || []))}
      </div>
    </section>
  `;
}

function renderOperationsSelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="operations-site-selection-required">
      <p class="workspace-kicker">Operations</p>
      <h2>Select a site before viewing operations readiness</h2>
      <p>This account can view more than one site. Choose the school workspace before reviewing operations worklists.</p>
      <div class="workspace-chip-row">
        ${sites.map((site) => `
          <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
            ${escapeHtml(site.siteName || site.siteId)}
          </button>
        `).join("")}
      </div>
      ${renderProblemState({
        reason: "Multiple assigned schools are available.",
        owner: "School administration.",
        nextAction: "Choose a site from the Current site menu or one of the buttons above.",
      })}
    </section>
  `;
}

function renderOperationsFilters(body) {
  const filters = body?.filters || operationsReadinessFilters || defaultOperationsReadinessFilters();
  const options = body?.filterOptions || {};
  return `
    <form id="operationsReadinessFilterForm" class="workspace-filter-bar" data-operations-readiness-filters="true">
      <label class="workspace-label">
        <span>Program</span>
        <select class="workspace-select" name="programId">
          ${renderProgramFilterOptions(options.programs, filters.programId)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Submission</span>
        <select class="workspace-select" name="status">
          ${renderValueOptions(options.statuses || [], filters.status || "", "Any submission", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Presentation</span>
        <select class="workspace-select" name="presentationStatus">
          ${renderValueOptions(options.presentationStatuses || [], filters.presentationStatus || "", "Any presentation", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Archive</span>
        <select class="workspace-select" name="archiveStatus">
          ${renderValueOptions(options.archiveStatuses || [], filters.archiveStatus || "", "Any archive", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Readiness</span>
        <select class="workspace-select" name="readiness">
          ${renderValueOptions(options.readiness || [], filters.readiness || "", "Any readiness", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Category</span>
        <select class="workspace-select" name="category">
          ${renderValueOptions(options.categories || [], filters.category || "", "Any category", categoryLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Story bucket</span>
        <select class="workspace-select" name="story">
          ${renderValueOptions(options.storyBuckets || [], filters.story || "", "Any story", storyLabel)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Risk</span>
        <select class="workspace-select" name="risk">
          ${renderValueOptions(options.risks || [], filters.risk || "any", "Any risk", riskLabel)}
        </select>
      </label>
      <input name="offset" type="hidden" value="${escapeHtml(filters.offset || 0)}">
      <input name="limit" type="hidden" value="${escapeHtml(filters.limit || 50)}">
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-primary" type="submit">Apply filters</button>
        <button class="workspace-button workspace-button-secondary" type="button" data-operations-action="reset-filters">Clear filters</button>
      </div>
    </form>
  `;
}

function renderOperationsActiveFilters(filters = {}, options = {}) {
  const chips = [];
  if (filters.studentId) chips.push(activeFilterChip("Student", "This student"));
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.status) chips.push(activeFilterChip("Submission", statusText(filters.status)));
  if (filters.presentationStatus) chips.push(activeFilterChip("Presentation", statusText(filters.presentationStatus)));
  if (filters.archiveStatus) chips.push(activeFilterChip("Archive", statusText(filters.archiveStatus)));
  if (filters.readiness) chips.push(activeFilterChip("Readiness", statusText(filters.readiness)));
  if (filters.category) chips.push(activeFilterChip("Category", categoryLabel(filters.category)));
  if (filters.needsAttention) chips.push(activeFilterChip("Needs attention", "Blocked, missing, or high-risk rows"));
  if (filters.outlineAttention) chips.push(activeFilterChip("Outline", "Pending approval or needs revision"));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Risk", riskLabel(filters.risk)));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Operations readiness", chips, 'data-operations-action="reset-filters"');
}

function hasActiveOperationsFilters(filters = {}) {
  const active = filters || {};
  return Boolean(
    active.studentId
      || active.programId
      || active.status
      || active.presentationStatus
      || active.archiveStatus
      || active.readiness
      || active.category
      || active.needsAttention
      || active.outlineAttention
      || active.story
      || (active.risk && active.risk !== "any")
  );
}

function renderPresentationWorklistRows(rows = [], permissions = {}, filters = {}) {
  const filtered = hasActiveOperationsFilters(filters);
  const emptyState = operationsPresentationEmptyStateCopy(filters, filtered);
  return rows.length ? `
    <div class="workspace-list" data-operations-presentation-rows="true">
      ${rows.map((row) => `
        <article class="workspace-student-row workspace-student-card">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${escapeHtml(row.programName || "Unassigned")} / ${escapeHtml(row.cohortName || "No cohort")}</p>
            <div class="workspace-chip-row">
              ${row.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(row.storyBucket))}</span>` : `<span class="workspace-story-chip">Presentation readiness</span>`}
              ${renderRiskChips(row.riskFlags || [])}
            </div>
          </div>
          <div>
            <span class="workspace-muted">Presentation</span>
            <strong>${escapeHtml(row.scheduledFor ? formatDate(row.scheduledFor) : "No schedule")}</strong>
            <p>${escapeHtml(row.location || row.reason || "Presentation readiness pending.")}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(row.presentationStatus || "missing")}
            ${statusPill(row.outlineStatus || "pending")}
            ${statusPill(row.checkInStatus || "missing")}
          </div>
          <div class="workspace-row-actions">
            <p>${escapeHtml(row.nextAction || "Open student detail for blocker context.")}</p>
            ${operationsDetailButton(row.studentId, permissions)}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `
    <section class="workspace-empty-state-card" data-operations-presentation-empty="true">
      <h2>${escapeHtml(emptyState.heading)}</h2>
      ${renderProblemState(emptyState)}
    </section>
  `;
}

function operationsPresentationEmptyStateCopy(filters = {}, filtered = false) {
  const owner = "Site administration.";
  if (!filtered) {
    return {
      heading: "No presentation work waiting",
      reason: "No presentation readiness work is waiting in this view.",
      owner,
      nextAction: "Continue monitoring presentation readiness.",
    };
  }
  if (filters.studentId) {
    return {
      heading: "No presentation work for this student",
      reason: "This student has no presentation readiness rows matching these Operations filters.",
      owner,
      nextAction: "Clear the student filter or return to student detail for Presentation context.",
    };
  }
  return {
    heading: "No matching presentation work",
    reason: "No presentation readiness work matches these filters for this school.",
    owner,
    nextAction: "Clear filters or review the student directory.",
  };
}

function renderArchiveWorklistRows(rows = [], permissions = {}, filters = {}) {
  const filtered = hasActiveOperationsFilters(filters);
  const emptyState = operationsArchiveEmptyStateCopy(filters, filtered);
  return rows.length ? `
    <div class="workspace-list" data-operations-archive-rows="true">
      ${rows.map((row) => `
        <article class="workspace-student-row workspace-student-card">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${escapeHtml(row.programName || "Unassigned")} / ${escapeHtml(archiveProviderStatusText(row.providerStatus))}</p>
            <div class="workspace-chip-row">
              ${row.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(row.storyBucket))}</span>` : `<span class="workspace-story-chip">Archive readiness</span>`}
              ${renderRiskChips(row.riskFlags || [])}
            </div>
          </div>
          <div>
            <span class="workspace-muted">Archive</span>
            <strong>${escapeHtml(row.reason || "Archive status")}</strong>
            <p>${escapeHtml(archiveWorklistSupportText(row))}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(row.archiveStatus || "missing")}
            ${statusPill(row.exportStatus || "not_requested")}
            <span class="workspace-site-context-badge">Private evidence</span>
          </div>
          <div class="workspace-row-actions">
            <p>${escapeHtml(row.nextAction || "Open student detail for archive context.")}</p>
            ${operationsDetailButton(row.studentId, permissions)}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `
    <section class="workspace-empty-state-card" data-operations-archive-empty="true">
      <h2>${escapeHtml(emptyState.heading)}</h2>
      ${renderProblemState(emptyState)}
    </section>
  `;
}

function archiveWorklistSupportText(row = {}) {
  const archiveStatus = normalizeStatus(row.archiveStatus);
  if (archiveStatus === "provider_unavailable") return "Storage setup is needed before archive packages can be prepared.";
  if (archiveStatus === "expired") return "Download window expired.";
  if (archiveStatus === "expiring_soon" || row.downloadExpiresSoon) return "Download window expiring soon.";
  if (archiveStatus === "queued" || archiveStatus === "running") return "Archive package is being prepared.";
  if (archiveStatus === "complete" && row.downloadReady) return "Scoped download is available.";
  if (archiveStatus === "failed") return "Archive export needs staff follow-up.";
  if (archiveStatus === "ready") return "Ready for archive package preparation.";
  return "File details are protected.";
}

function operationsArchiveEmptyStateCopy(filters = {}, filtered = false) {
  const archiveStatus = normalizeStatus(filters.archiveStatus);
  const owner = "Site administration.";
  if (!filtered) {
    return {
      heading: "No archive work waiting",
      reason: "No archive readiness or export failures are waiting in this view.",
      owner,
      nextAction: "Continue monitoring archive readiness.",
    };
  }
  if (filters.studentId) {
    return {
      heading: "No archive work for this student",
      reason: "This student has no archive readiness rows matching these Operations filters.",
      owner,
      nextAction: "Clear the student filter or return to student detail for Archive context.",
    };
  }
  if (archiveStatus === "provider_unavailable") {
    return {
      heading: "No storage setup blockers match",
      reason: "No archive rows waiting on storage setup match these filters for this school.",
      owner,
      nextAction: "Clear filters or review archive failures for broader closeout blockers.",
    };
  }
  if (archiveStatus === "expired") {
    return {
      heading: "No expired archive downloads match",
      reason: "No archive rows with expired download windows match these filters for this school.",
      owner,
      nextAction: "Clear filters or review expiring archive downloads for active follow-up.",
    };
  }
  if (archiveStatus === "expiring_soon") {
    return {
      heading: "No expiring archive downloads match",
      reason: "No archive rows with download windows ending soon match these filters for this school.",
      owner,
      nextAction: "Clear filters or review completed archive packages.",
    };
  }
  if (archiveStatus === "in_progress" || archiveStatus === "queued" || archiveStatus === "running") {
    return {
      heading: "No archive packages in progress match",
      reason: "No queued or running archive packages match these filters for this school.",
      owner,
      nextAction: "Clear filters or review archive-ready students.",
    };
  }
  if (archiveStatus === "failed") {
    return {
      heading: "No matching archive follow-up",
      reason: "No students with archive export follow-up match these filters.",
      owner,
      nextAction: "Clear filters or review storage setup blockers.",
    };
  }
  if (archiveStatus === "ready") {
    return {
      heading: "No archive-ready students match",
      reason: "No archive-ready students match these filters for this school.",
      owner,
      nextAction: "Clear filters or review broader archive readiness work.",
    };
  }
  return {
    heading: "No matching archive work",
    reason: "No archive readiness work matches these filters for this school.",
    owner,
    nextAction: "Clear filters or open student detail from the directory.",
  };
}

function renderReadinessAttentionRows(rows = [], permissions = {}, filters = {}) {
  const filtered = hasActiveOperationsFilters(filters);
  const emptyState = operationsReadinessEmptyStateCopy(filters, filtered);
  return rows.length ? `
    <div class="workspace-list" data-operations-readiness-rows="true">
      ${rows.map((row) => `
        <article class="workspace-row workspace-attention-item">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${escapeHtml(row.programName || "Unassigned")} / ${escapeHtml(row.owner || "Site administration")}</p>
            <p class="workspace-muted">${escapeHtml(row.reason || "Needs readiness review.")}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(row.status || "attention_required")}
            <span class="workspace-site-context-badge">${escapeHtml(statusText(row.category || "readiness"))}</span>
            ${operationsDetailButton(row.studentId, permissions)}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `
    <section class="workspace-empty-state-card" data-operations-readiness-empty="true">
      <h2>${escapeHtml(emptyState.heading)}</h2>
      ${renderProblemState(emptyState)}
    </section>
  `;
}

function operationsReadinessEmptyStateCopy(filters = {}, filtered = false) {
  const owner = "Site administration.";
  if (!filtered) {
    return {
      heading: "No operations attention waiting",
      reason: "No blocked, missing, or attention-required work is waiting right now.",
      owner,
      nextAction: "Continue monitoring ready and in-progress work.",
    };
  }
  if (filters.studentId) {
    return {
      heading: "No operations attention for this student",
      reason: "This student has no blocked, missing, or attention-required rows matching these Operations filters.",
      owner,
      nextAction: "Clear the student filter or return to student detail for broader context.",
    };
  }
  return {
    heading: "No matching operations attention",
    reason: "No blocked, missing, or attention-required readiness work matches these filters.",
    owner,
    nextAction: "Clear filters or continue monitoring ready work.",
  };
}

function renderOperationsProgramBreakdown(rows = []) {
  return rows.length ? `
    <div class="workspace-list" data-operations-program-breakdown="true">
      ${rows.map((row) => `
        <article class="workspace-program-row">
          <strong>${escapeHtml(row.programName || "Program")}</strong>
          <span>${safeNumber(row.studentsTotal)} students</span>
          <span>${safeNumber(row.presentationPending)} presentation</span>
          <span>${safeNumber(row.archiveFailed)} archive failed</span>
          <span>${safeNumber(row.needsAttention)} attention</span>
          ${row.programId ? `
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="program-breakdown" data-program-id="${escapeHtml(row.programId)}">
              View program rows
            </button>
          ` : ""}
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No program breakdown is available for these filters.</div>`;
}

function renderOperationsNextActions(rows = []) {
  return rows.length ? `
    <div class="workspace-list" data-operations-next-actions="true">
      ${rows.map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.nextAction || "Review student detail")}</strong>
            <p>${escapeHtml(row.owner || "Site administration")} / ${escapeHtml(categoryLabel(row.category || "readiness"))}</p>
          </div>
          <div class="workspace-row-actions">
            <span class="workspace-site-context-badge">${safeNumber(row.count)} row${safeNumber(row.count) === 1 ? "" : "s"}</span>
            ${row.category ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-operations-action="filter-category" data-operations-category="${escapeHtml(row.category)}">
                View ${escapeHtml(categoryLabel(row.category).toLowerCase())} rows
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No grouped next actions for the current filters.</div>`;
}

function renderOperationsPagination(pagination = {}) {
  const limit = safeNumber(pagination.limit || operationsReadinessFilters.limit || 50);
  const offset = safeNumber(pagination.offset || operationsReadinessFilters.offset || 0);
  const returned = safeNumber(pagination.returned);
  const filteredTotal = safeNumber(pagination.filteredTotal);
  return `
    <div class="workspace-directory-pagination" aria-label="Operations pagination">
      <button class="workspace-button workspace-button-secondary" type="button" data-operations-action="previous-page" ${offset <= 0 ? "disabled" : ""}>Previous</button>
      <span class="workspace-muted">Offset ${escapeHtml(offset)} / Limit ${escapeHtml(limit)}</span>
      <button class="workspace-button workspace-button-secondary" type="button" data-operations-action="next-page" ${(offset + returned) >= filteredTotal ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function operationsDetailButton(studentId, permissions = {}) {
  return permissions.canViewStudentDetail ? `
    <button class="workspace-link-button workspace-link-button-small" type="button" data-operations-action="open-student" data-operations-student-id="${escapeHtml(studentId || "")}">
      View student detail
    </button>
  ` : "";
}

function operationRowsForDetail(body = {}) {
  const rows = [
    ...((body.presentation || {}).rows || []),
    ...((body.archive || {}).rows || []),
    ...((body.readiness || {}).attentionRows || []),
  ];
  const seen = new Set();
  return rows
    .filter((row) => row?.studentId && !seen.has(row.studentId) && seen.add(row.studentId))
    .map((row) => ({
      studentId: row.studentId,
      displayName: row.studentName || "Student detail",
    }));
}

function renderAdminAuditSection() {
  const dashboard = unwrap(currentData.adminDashboard);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Audit</p>
        <h2>Audit summary unavailable</h2>
        ${renderApiNotice(currentData.adminDashboard)}
      </section>
    `;
  }
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Audit</p>
          <h1>Recent Protected Activity</h1>
          <p>Recent activity is summarized without sensitive private details.</p>
        </div>
        <span class="workspace-chip">${safeNumber(dashboard.summary?.recentAuditEvents)} recent event${safeNumber(dashboard.summary?.recentAuditEvents) === 1 ? "" : "s"}</span>
      </div>
      ${renderDashboardCard("Recent Audit", "Redacted activity list", renderAuditSummary(dashboard.recentAudit))}
    </section>
  `;
}

function renderAdminArchiveExportsSection() {
  const dashboard = unwrap(currentData.adminDashboard);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Archive / exports</p>
        <h2>Export summary unavailable</h2>
        ${renderApiNotice(currentData.adminDashboard)}
      </section>
    `;
  }
  const summary = dashboard.summary || {};
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Archive / Exports</p>
          <h1>Closeout Package Status</h1>
          <p>Export status counts come from persisted package requests and archive rows.</p>
        </div>
        <span class="workspace-chip">${safeNumber(summary.exportsFailed)} failed</span>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Queued", summary.exportsQueued, "Waiting to run", "teacher")}
        ${renderMetricTile("Running", summary.exportsRunning, "Currently processing", "mentor")}
        ${renderMetricTile("Complete", summary.exportsComplete, "Ready or delivered", "student")}
        ${renderMetricTile("Failed", summary.exportsFailed, "Needs review", safeNumber(summary.exportsFailed) ? "danger" : "admin")}
      </div>
      ${renderDashboardCard("Export Snapshot", "Package status", renderSnapshotRows(dashboard.archiveSnapshot))}
    </section>
  `;
}

function renderStudentSection() {
  const result = currentData.dashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Student workspace", "student project records");
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <h2>Student workspace unavailable</h2>
        <p>We could not load your project progress.</p>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "Your project records did not load.",
          owner: "Program teacher",
          nextAction: "Refresh this page. Ask your program teacher for help if this keeps happening.",
        })}
      </section>
    `;
  }

  const submissions = dashboard.submissions || [];
  const evidence = dashboard.evidence || [];
  const summary = studentProgressSummary(dashboard);
  const nextSteps = Array.isArray(dashboard.nextSteps) ? dashboard.nextSteps : [];
  return `
    <section class="workspace-card workspace-hero-card workspace-student-progress-hero" aria-labelledby="studentProgressTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Student home</p>
          <h2 id="studentProgressTitle">Your Senior Project</h2>
          <p>Track what is complete, what is missing, and what to do next.</p>
        </div>
        ${studentStatusBadge(summary.currentStatus)}
      </div>
      <div class="workspace-student-progress-layout">
        <div class="workspace-student-progress-number">
          <strong>${escapeHtml(summary.completionPercent)}%</strong>
          <span>overall complete</span>
        </div>
        <div class="workspace-student-progress-main">
          <div class="workspace-student-progress-meter" role="progressbar" aria-label="Overall senior project completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${escapeHtml(summary.completionPercent)}">
            <span style="width: ${escapeHtml(summary.completionPercent)}%"></span>
          </div>
          <p>${escapeHtml(summary.requirementsTotal ? `${summary.requirementsComplete} of ${summary.requirementsTotal} requirements are complete.` : "Your teacher has not added project requirements yet.")}</p>
        </div>
      </div>
      <div class="workspace-student-summary-grid">
        ${renderStudentSummaryTile("Project Phases", `${summary.phasesComplete} of ${summary.phasesTotal || 0} complete`, summary.phasesTotal ? "Progress is grouped by senior project phase." : "Project phases are not available yet.", "student")}
        ${renderStudentSummaryTile("Required Submissions", `${summary.submittedRequiredCount} of ${summary.requirementsTotal || 0} submitted`, summary.requirementsTotal ? `${summary.missingRequiredCount} still missing or in draft.` : "No required submissions are assigned yet.", summary.missingRequiredCount ? "warning" : "student")}
        ${renderStudentSummaryTile("Review Status", reviewMetric(summary), reviewExplanation(summary), summary.revisionRequestedCount ? "danger" : summary.waitingForReviewCount ? "warning" : "student")}
        ${renderStudentSummaryTile("Mentor / Support", summary.mentor.assigned ? `Mentor: ${summary.mentor.name}` : "No mentor assigned yet", summary.mentor.assigned ? "Ask your mentor or program teacher if something looks wrong." : "Ask your program teacher who can help with mentor questions.", summary.mentor.assigned ? "mentor" : "warning")}
      </div>
    </section>
    ${renderStudentPrimaryNextAction(summary, nextSteps)}
    ${renderStudentNextSteps(nextSteps, summary)}
    ${renderStudentRequirementPanel(dashboard.requirements || [], summary, dashboard.feedback || [], studentRequirementDetailState)}
    ${renderStudentFeedbackPanel(dashboard.feedback || [], summary, studentFeedbackHistoryState)}
    ${renderStudentProgressDetails(summary, dashboard)}
    <section class="workspace-card" data-student-evidence-panel="true">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Add your work</p>
          <h2>Submit Evidence</h2>
        </div>
      </div>
      ${submissions.length ? renderEvidenceForms(submissions) : `<div class="workspace-empty">No active submission is ready for evidence yet. Check back after your teacher adds a requirement.</div>`}
    </section>
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Submissions</p>
          <h2>Your Submitted Work</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${submissions.length ? submissions.map((submission) => renderSubmissionRow(submission, dashboard.feedback || [])).join("") : `<div class="workspace-empty">No submissions have been started yet.</div>`}
      </div>
    </section>
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Evidence and files</p>
          <h2>Uploaded And Linked Work</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${evidence.length ? evidence.map(renderEvidenceRow).join("") : `<div class="workspace-empty">Evidence will appear here after you attach a link or upload a file.</div>`}
      </div>
    </section>
  `;
}

function renderStudentPrimaryNextAction(summary, nextSteps = []) {
  const action = studentPrimaryNextAction(summary, nextSteps);
  const actionButtons = renderStudentStepButtons(action);
  return `
    <section class="workspace-dashboard-card workspace-student-primary-action" aria-labelledby="studentPrimaryNextActionTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Do this next</p>
          <h2 id="studentPrimaryNextActionTitle">${escapeHtml(action.title)}</h2>
          <p>${escapeHtml(action.detail)}</p>
        </div>
        ${statusPill(action.status)}
      </div>
      <div class="workspace-student-action-focus">
        <strong>${escapeHtml(action.owner)}</strong>
        <span>${escapeHtml(action.when)}</span>
      </div>
      ${actionButtons ? `<div class="workspace-row-actions">${actionButtons}</div>` : ""}
    </section>
  `;
}

function studentPrimaryNextAction(summary, nextSteps = []) {
  const firstStep = Array.isArray(nextSteps) ? nextSteps[0] : null;
  if (firstStep) {
    return {
      requirementId: firstStep.requirementId || null,
      submissionId: firstStep.submissionId || null,
      submissionStatus: firstStep.submissionStatus || null,
      evidenceCount: safeNumber(firstStep.evidenceCount),
      title: firstStep.title || "Continue your next requirement",
      detail: firstStep.detail || "Open the requirement in the list below and continue your project work.",
      status: firstStep.status || "pending",
      owner: "Your action",
      when: studentDueText(firstStep, "Use the next-steps list below."),
    };
  }
  if (summary.revisionRequestedCount) {
    return {
      requirementId: null,
      submissionId: null,
      submissionStatus: null,
      evidenceCount: 0,
      title: "Revise submitted work",
      detail: "Review the item marked Needs Revision and update your evidence or submission before moving forward.",
      status: "revision_requested",
      owner: "Your action",
      when: "Start with the submission list below.",
    };
  }
  if (summary.missingRequiredCount) {
    return {
      requirementId: null,
      submissionId: null,
      submissionStatus: null,
      evidenceCount: 0,
      title: "Finish a missing submission",
      detail: "Choose a draft or missing requirement and attach the work your teacher requested.",
      status: "draft",
      owner: "Your action",
      when: "Use Submit Evidence after choosing the requirement.",
    };
  }
  if (summary.waitingForReviewCount) {
    return {
      requirementId: null,
      submissionId: null,
      submissionStatus: null,
      evidenceCount: 0,
      title: "Wait for teacher review",
      detail: "Your submitted work is waiting for review. Check back for feedback before changing direction.",
      status: "submitted",
      owner: "Teacher review",
      when: "No extra upload is needed right now.",
    };
  }
  return {
    requirementId: null,
    submissionId: null,
    submissionStatus: null,
    evidenceCount: 0,
    title: "Keep your project moving",
    detail: "Review your progress details and ask your mentor or program teacher if anything looks missing.",
    status: summary.requirementsTotal ? "ready" : "pending",
    owner: summary.mentor.assigned ? "You and your mentor" : "You and your program teacher",
    when: summary.lastUpdatedAt ? `Last updated ${formatDate(summary.lastUpdatedAt)}` : "Check back after requirements are added.",
  };
}

function studentProgressSummary(dashboard) {
  const fallback = {
    requirementsTotal: 0,
    requirementsComplete: 0,
    completionPercent: 0,
    phasesTotal: 0,
    phasesComplete: 0,
    submittedRequiredCount: 0,
    missingRequiredCount: 0,
    waitingForReviewCount: 0,
    revisionRequestedCount: 0,
    currentPhase: "",
    currentPhaseLabel: "Not available yet",
    currentStatus: "Not Started",
    lastUpdatedAt: null,
    mentor: {
      assigned: false,
      name: null,
      message: "No mentor assigned yet.",
    },
    dueDatesAvailable: false,
  };
  const summary = dashboard?.summary || {};
  const completionPercent = clampPercent(summary.completionPercent);
  return {
    ...fallback,
    ...summary,
    completionPercent,
    requirementsTotal: safeNumber(summary.requirementsTotal),
    requirementsComplete: safeNumber(summary.requirementsComplete),
    phasesTotal: safeNumber(summary.phasesTotal),
    phasesComplete: safeNumber(summary.phasesComplete),
    submittedRequiredCount: safeNumber(summary.submittedRequiredCount),
    missingRequiredCount: safeNumber(summary.missingRequiredCount),
    waitingForReviewCount: safeNumber(summary.waitingForReviewCount),
    revisionRequestedCount: safeNumber(summary.revisionRequestedCount),
    mentor: {
      ...fallback.mentor,
      ...(summary.mentor || {}),
    },
  };
}

function clampPercent(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function studentStatusBadge(status) {
  const normalized = String(status || "Not Started").trim() || "Not Started";
  const statusKey = normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `<span class="workspace-student-status-badge" data-student-progress-status="${escapeHtml(statusKey)}">${escapeHtml(normalized)}</span>`;
}

function renderStudentSummaryTile(title, metricText, explanation, tone = "") {
  return `
    <article class="workspace-metric-tile workspace-student-summary-tile ${escapeHtml(tone)}">
      <div>
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(metricText)}</strong>
        <p>${escapeHtml(explanation)}</p>
      </div>
    </article>
  `;
}

function reviewMetric(summary) {
  if (summary.revisionRequestedCount) return `${summary.revisionRequestedCount} needs revision`;
  if (summary.waitingForReviewCount) return `${summary.waitingForReviewCount} waiting for review`;
  return "No review action";
}

function reviewExplanation(summary) {
  if (summary.revisionRequestedCount) return "Revise these items before moving forward.";
  if (summary.waitingForReviewCount) return "Your teacher has work to review.";
  return "Nothing is waiting for review right now.";
}

function renderStudentNextSteps(nextSteps, summary) {
  const rows = nextSteps.length ? nextSteps : [];
  return `
    <section class="workspace-dashboard-card workspace-student-next-steps" aria-labelledby="studentNextStepsTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Next steps</p>
          <h2 id="studentNextStepsTitle">What to Work On Next</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${rows.length ? rows.map(renderStudentNextStepRow).join("") : `
          <article class="workspace-empty-state-card">
            <strong>You are caught up right now.</strong>
            <p>${escapeHtml(summary.waitingForReviewCount ? "Check back after your teacher reviews your work." : "Check back after your teacher adds or reviews project requirements.")}</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderStudentNextStepRow(item) {
  const stepButtons = renderStudentStepButtons(item);
  return `
    <article class="workspace-row workspace-student-next-step">
      <div>
        <strong>${escapeHtml(item.title || "Senior Project requirement")}</strong>
        <p>${escapeHtml(item.detail || "Review this requirement and continue your next step.")}</p>
        <p class="workspace-muted" data-student-next-step-due="true">${escapeHtml(studentDueText(item))}</p>
      </div>
      <div class="workspace-row-actions">
        ${stepButtons}
        ${statusPill(item.status || "not_started")}
      </div>
    </article>
  `;
}

function renderStudentStepButtons(item, openLabel = "Open requirement") {
  const openRequirementButton = renderStudentRequirementOpenButton(item, openLabel);
  const submissionActionButton = renderStudentSubmissionActionButton(item);
  return `${openRequirementButton}${submissionActionButton}`;
}

function renderStudentRequirementPanel(requirements = [], summary = {}, feedback = [], detailState = defaultStudentRequirementDetailState()) {
  const rows = Array.isArray(requirements) ? requirements : [];
  const phaseGroups = groupStudentRequirementsByPhase(rows);
  return `
    <section class="workspace-dashboard-card workspace-student-requirements-panel" data-student-requirements-panel="true" data-student-requirements-count="${escapeHtml(rows.length)}" aria-labelledby="studentRequirementChecklistTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Requirement checklist</p>
          <h2 id="studentRequirementChecklistTitle">Your Required Work</h2>
          <p>${escapeHtml(rows.length ? "Review each project phase, requirement, and next step." : "Required work will appear after your teacher adds project requirements.")}</p>
        </div>
      </div>
      <div class="workspace-list">
        ${phaseGroups.length ? phaseGroups.map((group) => renderStudentRequirementPhaseGroup(group, feedback, detailState)).join("") : `
          <article class="workspace-empty-state-card" data-student-requirements-empty="true">
            <strong>No project requirements yet.</strong>
            <p>${escapeHtml(summary.waitingForReviewCount ? "Check back after your teacher updates your project requirements." : "Ask your program teacher when your project requirements will be ready.")}</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function groupStudentRequirementsByPhase(rows) {
  const groups = [];
  const byPhase = new Map();
  for (const row of rows) {
    const key = String(row?.phase || row?.phaseLabel || "unassigned");
    if (!byPhase.has(key)) {
      const group = {
        key,
        label: row?.phaseLabel || (row?.phase ? statusText(row.phase) : "Other required work"),
        rows: [],
      };
      byPhase.set(key, group);
      groups.push(group);
    }
    byPhase.get(key).rows.push(row);
  }
  return groups;
}

function renderStudentRequirementPhaseGroup(group, feedback = [], detailState = defaultStudentRequirementDetailState()) {
  const rows = Array.isArray(group?.rows) ? group.rows : [];
  const completeCount = rows.filter((row) => isStudentRequirementComplete(row?.status)).length;
  const remainingCount = Math.max(0, rows.length - completeCount);
  const phaseSummary = rows.length
    ? `${completeCount} of ${rows.length} complete${remainingCount ? ` / ${remainingCount} still need work` : ""}`
    : "No requirements in this phase yet.";
  return `
    <section class="workspace-student-requirement-phase" data-student-requirement-phase="true" data-student-requirement-phase-key="${escapeHtml(group?.key || "unassigned")}" data-student-requirement-phase-total="${escapeHtml(rows.length)}" data-student-requirement-phase-complete="${escapeHtml(completeCount)}">
      <div class="workspace-student-requirement-phase-head">
        <div>
          <h3>${escapeHtml(group?.label || "Other required work")}</h3>
          <p class="workspace-muted">${escapeHtml(phaseSummary)}</p>
        </div>
      </div>
      <div class="workspace-list">
        ${rows.map((row) => renderStudentRequirementRow(row, feedback, detailState)).join("")}
      </div>
    </section>
  `;
}

function isStudentRequirementComplete(status) {
  return ["approved", "archived", "complete", "completed"].includes(normalizeStatus(status));
}

function renderStudentRequirementRow(item, feedback = [], detailState = defaultStudentRequirementDetailState()) {
  const version = safeNumber(item?.submissionVersion);
  const updatedAt = item?.lastUpdatedAt ? formatDate(item.lastUpdatedAt) : "Not available yet";
  const description = String(item?.description || "").trim();
  const qualityPrompt = String(item?.qualityPrompt || "").trim();
  const submissionId = String(item?.submissionId || "").trim();
  const evidenceCount = safeNumber(item?.evidenceCount);
  const requirementId = studentRequirementId(item);
  const detailDomId = studentRequirementDetailDomId(requirementId);
  const selected = requirementId && detailState?.selectedRequirementId === requirementId;
  const latestFeedback = latestFeedbackForRequirement(item, feedback);
  return `
    <article class="workspace-row workspace-student-requirement-row" data-student-requirement-row="true" data-student-requirement-id="${escapeHtml(requirementId)}" data-student-requirement-submission-id="${escapeHtml(submissionId)}" data-student-requirement-evidence-count="${escapeHtml(evidenceCount)}">
      <div>
        <strong>${escapeHtml(item?.title || "Senior Project requirement")}</strong>
        ${description ? `<p class="workspace-student-requirement-guidance" data-student-requirement-description="true">${escapeHtml(description)}</p>` : ""}
        ${qualityPrompt ? `<p class="workspace-muted workspace-student-requirement-nudge" data-student-requirement-quality="true">Try this: ${escapeHtml(qualityPrompt)}</p>` : ""}
        <p>${escapeHtml(item?.phaseLabel || "Not available yet")} / Last updated ${escapeHtml(updatedAt)}</p>
        <p class="workspace-muted" data-student-requirement-due="true">${escapeHtml(studentDueText(item))}</p>
        <p class="workspace-muted" data-student-requirement-next="true">${escapeHtml(item?.nextAction || "Ask your program teacher what to do next.")}</p>
      </div>
      <div class="workspace-row-actions">
        ${submissionId ? `<span class="workspace-site-context-badge" data-student-requirement-evidence="true">${escapeHtml(evidenceCount)} evidence</span>` : ""}
        ${version > 0 ? `<span class="workspace-site-context-badge" data-student-requirement-version="true">Version ${escapeHtml(version)}</span>` : ""}
        ${requirementId ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-requirement-action="toggle-detail" data-student-requirement-id="${escapeHtml(requirementId)}" aria-expanded="${selected ? "true" : "false"}" aria-controls="${escapeHtml(detailDomId)}">${escapeHtml(selected ? "Hide details" : "Review details")}</button>` : ""}
        ${renderStudentRequirementAction(item, evidenceCount)}
        ${statusPill(item?.status || "missing")}
      </div>
      ${selected ? renderStudentRequirementDetail(item, latestFeedback) : ""}
    </article>
  `;
}

function studentRequirementId(item) {
  return cleanDirectoryFilter(item?.requirementId || item?.requirement_id || item?.id || item?.title || "");
}

function studentRequirementDetailDomId(requirementId) {
  return `studentRequirementDetail-${String(requirementId || "item").replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

function latestFeedbackForRequirement(item, feedback = []) {
  const submissionId = String(item?.submissionId || "").trim();
  if (!submissionId) return null;
  return latestFeedbackForSubmission({ id: submissionId }, feedback);
}

function renderStudentRequirementDetail(item, latestFeedback = null) {
  const requirementId = studentRequirementId(item);
  const detailDomId = studentRequirementDetailDomId(requirementId);
  const evidenceCount = safeNumber(item?.evidenceCount);
  const version = safeNumber(item?.submissionVersion);
  const status = statusText(item?.status || "missing");
  const submissionStatus = item?.submissionStatus ? statusText(item.submissionStatus) : status;
  const progressStatus = item?.progressStatus ? statusText(item.progressStatus) : "Not started";
  return `
    <section id="${escapeHtml(detailDomId)}" class="workspace-student-requirement-detail" data-student-requirement-detail="true">
      <div>
        <h4>Requirement details</h4>
        <p class="workspace-muted">Use this summary to check the status, due date, feedback, and next action for this requirement.</p>
      </div>
      <div class="workspace-student-requirement-detail-grid">
        ${renderStudentRequirementDetailFact("Status", status)}
        ${renderStudentRequirementDetailFact("Due date", studentDueText(item))}
        ${renderStudentRequirementDetailFact("Evidence", `${evidenceCount} ${pluralize(evidenceCount, "item")} attached`)}
        ${renderStudentRequirementDetailFact("Submission", version > 0 ? `Version ${version} / ${submissionStatus}` : "No submitted version yet")}
        ${renderStudentRequirementDetailFact("Progress", progressStatus)}
        ${renderStudentRequirementDetailFact("Next action", item?.nextAction || "Ask your program teacher what to do next.")}
      </div>
      ${latestFeedback ? `
        <article class="workspace-mini-row" data-student-requirement-feedback="true">
          <span>Latest teacher feedback</span>
          <small>${escapeHtml(latestFeedback.message || "Teacher feedback was recorded for this submission.")}</small>
          <small>${escapeHtml(latestFeedback.authorName || "Program teacher")} / ${escapeHtml(formatDate(latestFeedback.createdAt))}</small>
        </article>
      ` : `
        <article class="workspace-mini-row" data-student-requirement-feedback-empty="true">
          <span>No teacher feedback for this requirement yet.</span>
          <small>Feedback meant for you will appear after your teacher reviews or comments on this work.</small>
        </article>
      `}
    </section>
  `;
}

function renderStudentRequirementDetailFact(label, value) {
  return `
    <article class="workspace-mini-row" data-student-requirement-detail-fact="true">
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(value || "Not available yet")}</small>
    </article>
  `;
}

function renderStudentRequirementAction(item, evidenceCount = 0) {
  return renderStudentSubmissionActionButton({
    submissionId: item?.submissionId || "",
    submissionStatus: item?.submissionStatus || item?.status || "",
    evidenceCount,
  });
}

function renderStudentRequirementOpenButton(item, label = "Open requirement") {
  const requirementId = cleanDirectoryFilter(item?.requirementId || "");
  if (!requirementId) return "";
  return `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-requirement-action="open-detail" data-student-requirement-id="${escapeHtml(requirementId)}">${escapeHtml(label)}</button>`;
}

function renderStudentSubmissionActionButton(item) {
  const submissionId = String(item?.submissionId || "").trim();
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  const evidenceCount = safeNumber(item?.evidenceCount);
  if (!submissionId || !["draft", "revision_requested"].includes(status)) return "";
  if (evidenceCount <= 0) {
    return `<button class="workspace-button workspace-button-small workspace-button-secondary" type="button" data-student-submission-action="focus-evidence" data-student-submission-id="${escapeHtml(submissionId)}">Add evidence</button>`;
  }
  const label = status === "revision_requested" ? "Send revision" : "Send for review";
  return `<button class="workspace-button workspace-button-small workspace-button-primary" type="button" data-student-submission-action="submit" data-student-submission-id="${escapeHtml(submissionId)}">${escapeHtml(label)}</button>`;
}

function studentDueText(item, fallback = "Due date: Not available yet") {
  const label = String(item?.dueLabel || "").trim();
  if (label) return /^due\b/i.test(label) ? label : `Due ${label}`;
  if (item?.dueDate) return `Due ${formatDate(item.dueDate)}`;
  return fallback;
}

function renderStudentFeedbackPanel(feedback = [], summary = {}, historyState = defaultStudentFeedbackHistoryState()) {
  const rows = Array.isArray(feedback) ? feedback : [];
  const countLabel = `${rows.length} teacher note${rows.length === 1 ? "" : "s"}`;
  return `
    <section class="workspace-dashboard-card workspace-student-feedback-panel" data-student-feedback-panel="true" data-student-feedback-history="true" data-student-feedback-count="${escapeHtml(rows.length)}" aria-labelledby="studentFeedbackTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Teacher feedback</p>
          <h2 id="studentFeedbackTitle">Feedback History</h2>
          <p>${escapeHtml(rows.length ? `Showing the latest ${countLabel} meant for you.` : "Teacher review notes meant for you will appear here.")}</p>
        </div>
      </div>
      <div class="workspace-list">
        ${rows.length ? rows.map((row) => renderStudentFeedbackRow(row, historyState)).join("") : `
          <article class="workspace-empty-state-card" data-student-feedback-empty="true">
            <strong>${escapeHtml(summary.revisionRequestedCount ? "No feedback details are available here yet." : "No teacher feedback yet.")}</strong>
            <p>${escapeHtml(summary.revisionRequestedCount ? "Check the submission list below and ask your program teacher what to revise." : "Feedback will appear here after your teacher reviews or comments on your work.")}</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderStudentFeedbackRow(item, historyState = defaultStudentFeedbackHistoryState()) {
  const submissionMeta = studentFeedbackSubmissionMeta(item);
  const submissionId = cleanDirectoryFilter(item?.submissionId);
  const isSelected = submissionId && historyState?.selectedSubmissionId === submissionId;
  return `
    <article class="workspace-row workspace-student-feedback-row" data-student-feedback-item="${escapeHtml(item.id || "")}">
      <div>
        <strong>${escapeHtml(item.requirementTitle || "Senior Project submission")}</strong>
        <p>${escapeHtml(item.message || "Teacher feedback was recorded for this submission.")}</p>
        ${submissionMeta ? `<p class="workspace-muted" data-student-feedback-context="true">${escapeHtml(submissionMeta)}</p>` : ""}
        <p class="workspace-muted">${escapeHtml(item.authorName || "Program teacher")} / ${escapeHtml(formatDate(item.createdAt))}</p>
      </div>
      <div class="workspace-row-actions">
        ${submissionId ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-feedback-action="open-history" data-student-feedback-submission-id="${escapeHtml(submissionId)}">${escapeHtml(isSelected ? "Refresh timeline" : "View timeline")}</button>` : ""}
        ${statusPill(item.status || "under_review")}
      </div>
      ${isSelected ? renderStudentFeedbackTimeline(historyState) : ""}
    </article>
  `;
}

function studentFeedbackSubmissionMeta(item) {
  const parts = [];
  const version = safeNumber(item?.submissionVersion);
  if (version > 0) parts.push(`Version ${version}`);
  if (item?.submissionStatus) parts.push(`Current status: ${statusText(item.submissionStatus)}`);
  return parts.join(" / ");
}

function renderStudentFeedbackTimeline(historyState = defaultStudentFeedbackHistoryState()) {
  if (historyState.loading) {
    return `
      <section class="workspace-student-feedback-timeline" data-student-feedback-timeline-loading="true">
        <h3>Submission timeline</h3>
        <p class="workspace-muted">Loading the review timeline for this submission.</p>
      </section>
    `;
  }
  if (historyState.result && !historyState.result.ok) {
    return `
      <section class="workspace-empty-state-card workspace-student-feedback-timeline" data-student-feedback-timeline-error="true">
        <h3>Submission timeline unavailable</h3>
        ${renderProblemState({
          reason: "We could not load this feedback timeline right now.",
          owner: "Program teacher",
          nextAction: "Try again later or ask your teacher which version to update.",
        })}
      </section>
    `;
  }
  const history = unwrap(historyState.result);
  if (!history) return "";
  const reviews = Array.isArray(history.reviews) ? history.reviews : [];
  const versions = Array.isArray(history.versions) ? history.versions : [];
  const statusHistory = Array.isArray(history.statusHistory) ? history.statusHistory : [];
  const comments = Array.isArray(history.comments) ? history.comments : [];
  const hasTimeline = reviews.length || versions.length || statusHistory.length || comments.length;
  return `
    <section class="workspace-student-feedback-timeline" data-student-feedback-timeline="true">
      <div>
        <h3>Submission timeline</h3>
        <p class="workspace-muted">Only feedback meant for you is shown here.</p>
      </div>
      ${hasTimeline ? `
        <div class="workspace-student-feedback-timeline-grid">
          ${renderStudentTimelineList("Versions", versions, "No submitted versions are listed yet.", renderStudentVersionTimelineItem)}
          ${renderStudentTimelineList("Status changes", statusHistory, "No status changes are listed yet.", renderStudentStatusTimelineItem)}
          ${renderStudentTimelineList("Teacher notes", [...reviews, ...comments], "No teacher notes are listed yet.", renderStudentNoteTimelineItem)}
        </div>
      ` : `<div class="workspace-empty">No timeline entries are available for this submission yet.</div>`}
    </section>
  `;
}

function renderStudentTimelineList(title, rows, emptyText, renderer) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `
    <div class="workspace-student-feedback-timeline-list">
      <strong>${escapeHtml(title)}</strong>
      ${safeRows.length ? safeRows.slice(0, 5).map(renderer).join("") : `<p class="workspace-muted">${escapeHtml(emptyText)}</p>`}
    </div>
  `;
}

function renderStudentVersionTimelineItem(row) {
  const version = safeNumber(row?.version);
  return `
    <article class="workspace-mini-row" data-student-feedback-version="${escapeHtml(version || "")}">
      <span>${escapeHtml(version ? `Version ${version} submitted` : "Version submitted")}</span>
      <small>${escapeHtml(statusText(row?.status || "submitted"))} / ${escapeHtml(formatDate(row?.submittedAt || row?.submitted_at))}</small>
    </article>
  `;
}

function renderStudentStatusTimelineItem(row) {
  return `
    <article class="workspace-mini-row" data-student-feedback-status-change="true">
      <span>${escapeHtml(statusText(row?.to_status || row?.toStatus || "under_review"))}</span>
      <small>${escapeHtml(row?.reason || "Status updated.")} / ${escapeHtml(formatDate(row?.created_at || row?.createdAt))}</small>
    </article>
  `;
}

function renderStudentNoteTimelineItem(row) {
  const message = row?.feedback || row?.body || "Teacher note recorded.";
  const author = row?.reviewer_name || row?.reviewerName || row?.author_name || row?.authorName || "Program teacher";
  const createdAt = row?.created_at || row?.createdAt;
  return `
    <article class="workspace-mini-row" data-student-feedback-note="true">
      <span>${escapeHtml(message)}</span>
      <small>${escapeHtml(author)} / ${escapeHtml(formatDate(createdAt))}</small>
    </article>
  `;
}

function renderStudentProgressDetails(summary, dashboard) {
  const progress = dashboard.progress || [];
  const submissions = dashboard.submissions || [];
  const evidence = dashboard.evidence || [];
  const archiveFact = studentArchiveProgressFact(unwrap(currentData.archiveReadiness));
  return `
    <section class="workspace-dashboard-card workspace-student-progress-details" aria-labelledby="studentProgressDetailsTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Progress details</p>
          <h2 id="studentProgressDetailsTitle">Progress Details</h2>
        </div>
      </div>
      <details class="workspace-student-details-panel" open>
        <summary>View your project progress details</summary>
        <div class="workspace-student-details-grid">
          ${renderStudentDetailFact("Current phase", summary.currentPhaseLabel || "Not available yet")}
          ${renderStudentDetailFact("Completed requirements", `${summary.requirementsComplete} of ${summary.requirementsTotal || 0}`)}
          ${renderStudentDetailFact("Missing submissions", summary.missingRequiredCount ? `${summary.missingRequiredCount} to finish` : "None right now")}
          ${renderStudentDetailFact("Waiting for review", summary.waitingForReviewCount ? `${summary.waitingForReviewCount} submitted` : "Nothing waiting")}
          ${renderStudentDetailFact("Needs revision", summary.revisionRequestedCount ? `${summary.revisionRequestedCount} item${summary.revisionRequestedCount === 1 ? "" : "s"}` : "Nothing right now")}
          ${renderStudentDetailFact("Last updated", summary.lastUpdatedAt ? formatDate(summary.lastUpdatedAt) : "Not available yet")}
          ${renderStudentDetailFact("Evidence added", `${evidence.length} item${evidence.length === 1 ? "" : "s"}`)}
          ${renderStudentDetailFact("Teacher feedback", summary.revisionRequestedCount ? "Review the item marked Needs Revision." : "You do not have feedback that needs action right now.")}
          ${archiveFact ? renderStudentDetailFact("May 5 archive", archiveFact) : ""}
        </div>
      </details>
      <div class="workspace-student-support-box">
        <strong>Need help?</strong>
        <p>${escapeHtml(summary.mentor.message || "Ask your mentor or program teacher if something looks wrong.")}</p>
        <p class="workspace-muted">${escapeHtml(submissions.length || progress.length ? "Use the submission list below to attach work or check review status." : "Your teacher has not added project requirements yet.")}</p>
      </div>
    </section>
  `;
}

function renderStudentDetailFact(label, value) {
  return `
    <article class="workspace-student-detail-fact">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderEvidenceForms(submissions) {
  const options = submissions.map((submission) => `
    <option value="${escapeHtml(submission.id)}">${escapeHtml(submission.requirement_title || "Capstone Project submission")} - ${escapeHtml(statusText(submission.status))}</option>
  `).join("");

  return `
    <div class="workspace-panel">
      <h3>Attach a link</h3>
      <form id="workspaceEvidenceLinkForm" class="workspace-form">
        <div class="workspace-form-grid">
          <label class="workspace-label">
            Submission
            <select class="workspace-select" name="submissionId" required>${options}</select>
          </label>
          <label class="workspace-label">
            Work type
            <select class="workspace-select" name="artifactType">
              ${artifactTypeOptions()}
            </select>
          </label>
          <label class="workspace-label workspace-label-wide">
            Evidence title
            <input class="workspace-input" name="title" autocomplete="off" maxlength="160" required>
          </label>
          <label class="workspace-label workspace-label-wide">
            Evidence link
            <input class="workspace-input" name="url" type="url" inputmode="url" autocomplete="off" required>
          </label>
        </div>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Attach link</button>
        </div>
      </form>
    </div>
    <div class="workspace-panel">
      <h3>Upload a file</h3>
      <form id="workspaceFileUploadForm" class="workspace-form">
        <div class="workspace-form-grid">
          <label class="workspace-label">
            Submission
            <select class="workspace-select" name="submissionId" required>${options}</select>
          </label>
          <label class="workspace-label">
            Work type
            <select class="workspace-select" name="artifactType">
              ${artifactTypeOptions()}
            </select>
          </label>
          <label class="workspace-label workspace-label-wide">
            File title
            <input class="workspace-input" name="title" autocomplete="off" maxlength="160" required>
          </label>
          <label class="workspace-label workspace-label-wide">
            File
            <input class="workspace-input" name="file" type="file" accept="image/*,.pdf,.txt,.csv,.docx,.pptx,.xlsx,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-upload-action="select-file" required>
          </label>
        </div>
        <p class="workspace-muted">Files up to 20 MB can be uploaded when file storage is available.</p>
        ${renderUploadStatus()}
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Upload file</button>
        </div>
      </form>
    </div>
  `;
}

function renderUploadStatus() {
  const state = uploadState.state || "idle";
  const progress = clampUploadProgress(uploadState.progress);
  const message = uploadState.message || uploadMessageForState(state);
  const fileSummary = uploadState.fileName
    ? `<span class="workspace-upload-file">${escapeHtml(uploadState.fileName)}${uploadState.fileSize ? ` (${formatBytes(uploadState.fileSize)})` : ""}</span>`
    : "";
  const retryButton = uploadState.retryReady && lastUploadAttempt
    ? `<button class="workspace-button workspace-button-secondary" type="button" data-upload-action="retry">Retry upload</button>`
    : "";

  return `
    <div id="workspaceUploadStatus" class="workspace-upload-status workspace-upload-status-${escapeHtml(state)}" data-upload-state="${escapeHtml(state)}" data-upload-progress="${progress}" role="status" aria-live="polite">
      <div class="workspace-upload-status-head">
        <span class="workspace-upload-status-label">${escapeHtml(uploadLabelForState(state))}</span>
        <span class="workspace-upload-status-percent">${progress}%</span>
      </div>
      <div class="workspace-upload-meter" role="progressbar" aria-label="Evidence upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" data-upload-progress="${progress}">
        <span style="width: ${progress}%"></span>
      </div>
      <p class="workspace-upload-message" data-upload-message>${escapeHtml(message)}</p>
      ${fileSummary}
      ${retryButton ? `<div class="workspace-upload-actions">${retryButton}</div>` : ""}
    </div>
  `;
}

function uploadLabelForState(state) {
  if (state === "selected") return "Ready";
  if (state === "preparing") return "Preparing";
  if (state === "uploading") return "Uploading";
  if (state === "verifying") return "Checking";
  if (state === "complete") return "Uploaded";
  if (state === "failed") return "Needs attention";
  return "Waiting";
}

function uploadMessageForState(state) {
  if (state === "selected") return "File selected. Press Upload file when you are ready.";
  if (state === "preparing") return "Preparing your file for upload.";
  if (state === "uploading") return "Uploading your evidence file.";
  if (state === "verifying") return "Checking that the upload finished safely.";
  if (state === "complete") return "Your file was received and added to your evidence.";
  if (state === "failed") return "The upload did not finish. Review the message and try again if available.";
  return "Choose a file to upload evidence.";
}

function clampUploadProgress(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function formatBytes(bytes) {
  const numberValue = Number(bytes);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "0 bytes";
  if (numberValue < 1024) return `${numberValue} bytes`;
  if (numberValue < 1024 * 1024) return `${(numberValue / 1024).toFixed(1)} KB`;
  return `${(numberValue / (1024 * 1024)).toFixed(1)} MB`;
}

function renderTeacherSection() {
  if (!hasSiteReviewQueueRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Teacher review queue", "submitted student work");
  }
  const result = currentData.reviewQueue;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Teacher review queue", "submitted student work");
  }
  const body = unwrap(result);
  const queue = body?.queue || [];
  const scope = body?.scope || {};
  const summary = body?.summary || {};
  const pagination = body?.pagination || {};
  const permissions = body?.permissions || {};
  const filters = body?.filters || reviewQueueFilters || defaultReviewQueueFilters();
  const selectedId = reviewQueueState.selectedSubmissionId;
  const selected = queue.find((item) => item.submissionId === selectedId) || null;
  const readOnly = scope.readOnly || !permissions.canReview;
  const emptyState = queue.length ? null : reviewQueueEmptyState(body, filters);
  return `
    <section class="workspace-command-center workspace-review-queue" aria-labelledby="reviewQueueTitle">
      <div class="workspace-section-heading">
        <div>
          <p class="workspace-kicker">Teacher review queue</p>
          <h1 id="reviewQueueTitle">Review Queue</h1>
          <p>
            Submitted work, revision follow-up, protected evidence, and teacher review for assigned records.
            No student messaging.
          </p>
        </div>
        <div class="workspace-site-context">
          <span class="workspace-site-context-badge">${escapeHtml(scope.siteName || "Selected school")}</span>
          <span class="workspace-site-context-badge">${escapeHtml(scope.schoolYear || "School year")}</span>
          ${readOnly ? `<span class="workspace-site-context-badge">Read-only</span>` : `<span class="workspace-site-context-badge">Teacher decisions enabled</span>`}
        </div>
      </div>
      ${renderApiNotice(result)}
      ${readOnly ? `
        <section class="workspace-read-only-banner" data-review-queue-read-only="true">
          <strong>Read-only review queue</strong>
          <p>This view is for review context. Approval, revision request, and comment decisions stay with assigned program teachers.</p>
        </section>
      ` : ""}
      <div class="workspace-metric-grid">
        ${renderMetricTile("Submitted", summary.submitted, "Ready for teacher review", "teacher")}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Open revision loops", "warning")}
        ${renderMetricTile("Evidence Attached", summary.evidenceAttached, "Private evidence summaries", "admin", "teacher", { label: "Review rows", preset: "evidence-attached-review" })}
        ${renderMetricTile("Evidence Missing", summary.evidenceMissing, "Confirm evidence before approval", safeNumber(summary.evidenceMissing) ? "warning" : "mentor", "teacher", { label: "Review rows", preset: "evidence-missing-review" })}
        ${renderMetricTile("High Risk", summary.highRisk, "Prioritize follow-up", safeNumber(summary.highRisk) ? "danger" : "admin", "teacher", { label: "Review rows", preset: "high-risk" })}
        ${renderMetricTile("Stale Activity", summary.overdueOrStale, "Check-ins may be needed", safeNumber(summary.overdueOrStale) ? "warning" : "admin", "teacher", { label: "Review rows", preset: "stale-review" })}
        ${renderMetricTile("Missing Mentor", summary.noMentor, "Needs mentor coverage", safeNumber(summary.noMentor) ? "warning" : "mentor", "teacher", { label: "Review rows", preset: "missing-mentor-review" })}
      </div>
      ${renderReviewQueueFilters(body)}
      ${renderReviewQueueActiveFilters(filters, body?.filterOptions || {})}
      ${siteStudentDetailState?.sourceSection === "teacher" ? renderSiteStudentDetailSurface({
        students: queue.map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
        scope,
      }) : ""}
      <div class="workspace-review-layout">
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <h2>Submitted work</h2>
              <p>${safeNumber(pagination.returned)} shown of ${safeNumber(pagination.filteredTotal)} matching records</p>
            </div>
            <span class="workspace-chip">${safeNumber(pagination.total)} available</span>
          </div>
          ${queue.length ? `
            <div class="workspace-list">
              ${queue.map((item) => renderReviewQueueRow(item, selectedId, permissions)).join("")}
            </div>
            <div class="workspace-directory-pagination" aria-label="Review queue pagination">
              <button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="previous-page" ${safeNumber(pagination.offset) <= 0 ? "disabled" : ""}>Previous</button>
              <span>${safeNumber(pagination.offset) + 1}-${safeNumber(pagination.offset) + safeNumber(pagination.returned)} of ${safeNumber(pagination.filteredTotal)}</span>
              <button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="next-page" ${(safeNumber(pagination.offset) + safeNumber(pagination.returned)) >= safeNumber(pagination.filteredTotal) ? "disabled" : ""}>Next</button>
            </div>
          ` : `
            <section class="workspace-empty-state-card" data-review-queue-empty="true">
              <h2>${escapeHtml(emptyState?.heading || (hasActiveReviewQueueFilters(filters) ? "No matching review work" : "No review work waiting"))}</h2>
              ${renderProblemState(emptyState)}
            </section>
          `}
        </section>
        ${renderReviewSubmissionPanel(selected, body)}
      </div>
    </section>
  `;
}

function renderReviewQueueFilters(body) {
  const filters = body?.filters || reviewQueueFilters || defaultReviewQueueFilters();
  const options = body?.filterOptions || {};
  const programs = options.programs || [];
  return `
    <form id="reviewQueueFilterForm" class="workspace-filter-bar" data-review-queue-filters="true">
      <label>
        <span>Status</span>
        <select name="status">
          <option value="" ${!filters.status ? "selected" : ""}>Submitted and revision</option>
          ${(options.statuses || ["submitted", "revision_requested", "approved"]).map((status) => `
            <option value="${escapeHtml(status)}" ${filters.status === status ? "selected" : ""}>${escapeHtml(statusText(status))}</option>
          `).join("")}
        </select>
      </label>
      <label>
        <span>Program</span>
        <select name="programId">
          <option value="" ${!filters.programId ? "selected" : ""}>All visible programs</option>
          ${programs.map((program) => `
            <option value="${escapeHtml(program.programId)}" ${filters.programId === program.programId ? "selected" : ""}>
              ${escapeHtml(program.programName)} (${safeNumber(program.queueCount)})
            </option>
          `).join("")}
        </select>
      </label>
      <label>
        <span>Story</span>
        <select name="story">
          <option value="" ${!filters.story ? "selected" : ""}>Any story</option>
          ${(options.storyBuckets || []).map((story) => `
            <option value="${escapeHtml(story)}" ${filters.story === story ? "selected" : ""}>${escapeHtml(storyLabel(story))}</option>
          `).join("")}
        </select>
      </label>
      <label>
        <span>Risk</span>
        <select name="risk">
          ${(options.risks || ["any", "high", "medium", "low", "stale", "no_mentor"]).map((risk) => `
            <option value="${escapeHtml(risk)}" ${(filters.risk || "any") === risk ? "selected" : ""}>${escapeHtml(riskLabel(risk))}</option>
          `).join("")}
        </select>
      </label>
      <label>
        <span>Evidence</span>
        <select name="evidenceStatus">
          <option value="" ${!filters.evidenceStatus ? "selected" : ""}>Any evidence status</option>
          ${(options.evidenceStatuses || ["attached", "missing"]).map((status) => `
            <option value="${escapeHtml(status)}" ${filters.evidenceStatus === status ? "selected" : ""}>${escapeHtml(evidenceStatusFilterLabel(status))}</option>
          `).join("")}
        </select>
      </label>
      <label>
        <span>Search</span>
        <input name="search" type="search" value="${escapeHtml(filters.search || "")}">
      </label>
      <label>
        <span>Page size</span>
        <select name="limit">
          ${[25, 50, 100].map((limit) => `<option value="${limit}" ${safeNumber(filters.limit) === limit ? "selected" : ""}>${limit}</option>`).join("")}
        </select>
      </label>
      <button class="workspace-button workspace-button-primary" type="submit">Apply filters</button>
      <button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="reset-filters">Clear filters</button>
    </form>
  `;
}

function renderReviewQueueActiveFilters(filters = {}, options = {}) {
  const chips = [];
  if (filters.status) chips.push(activeFilterChip("Status", statusText(filters.status)));
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Risk", riskLabel(filters.risk)));
  if (filters.evidenceStatus) chips.push(activeFilterChip("Evidence", evidenceStatusFilterLabel(filters.evidenceStatus)));
  if (filters.search) chips.push(activeFilterChip("Search", filters.search));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Review queue", chips, 'data-review-queue-action="reset-filters"');
}

function reviewQueueEmptyState(body, filters = {}) {
  const hasFilters = hasActiveReviewQueueFilters(filters);
  if (hasFilters) {
    const filteredCopy = reviewQueueFilteredEmptyStateCopy(filters, body?.filterOptions || {});
    return {
      heading: filteredCopy.heading,
      reason: filteredCopy.reason,
      owner: "Assigned review staff.",
      nextAction: filteredCopy.nextAction,
    };
  }
  return {
    heading: "No review work waiting",
    reason: "No submitted or revision-requested work is waiting in this review queue right now.",
    owner: "Assigned review staff.",
    nextAction: "Open Students for context or keep monitoring new submissions.",
  };
}

function reviewQueueFilteredEmptyStateCopy(filters = {}, options = {}) {
  if (filters.evidenceStatus === "missing") {
    return {
      heading: "No matching evidence follow-up",
      reason: "No submitted or revision-requested work without attached evidence matches these filters.",
      nextAction: "Clear the evidence filter or check Operations Evidence Missing for broader readiness follow-up.",
    };
  }
  if (filters.evidenceStatus === "attached") {
    return {
      heading: "No matching evidence-ready reviews",
      reason: "No submitted or revision-requested work with attached evidence matches these filters.",
      nextAction: "Clear the evidence filter or adjust status and risk filters.",
    };
  }
  if (filters.status === "submitted") {
    return {
      heading: "No matching submitted work",
      reason: "No submitted work waiting for teacher review matches these filters.",
      nextAction: "Clear filters or check Needs Revision for work already returned to students.",
    };
  }
  if (filters.status === "revision_requested") {
    return {
      heading: "No matching revision follow-up",
      reason: "No work needing revision follow-up matches these filters.",
      nextAction: "Clear filters or check Submitted for newly sent work.",
    };
  }
  if (filters.status === "approved") {
    return {
      heading: "No matching approved work",
      reason: "No approved review records match these filters.",
      nextAction: "Clear filters to return to submitted and revision work.",
    };
  }
  if (filters.risk && filters.risk !== "any") {
    return {
      heading: `No matching ${riskLabel(filters.risk).toLowerCase()} review work`,
      reason: `No ${riskLabel(filters.risk).toLowerCase()} review work matches these filters.`,
      nextAction: "Clear the risk filter or adjust status, evidence, and program filters.",
    };
  }
  if (filters.programId) {
    return {
      heading: "No matching program review work",
      reason: `No review work in ${programLabel(options.programs, filters.programId)} matches these filters.`,
      nextAction: "Clear the program filter or choose another visible program.",
    };
  }
  if (filters.story) {
    return {
      heading: "No matching story review work",
      reason: `No ${storyLabel(filters.story).toLowerCase()} review work matches these filters.`,
      nextAction: "Clear the story filter or adjust status and risk filters.",
    };
  }
  if (filters.search) {
    return {
      heading: "No matching review search results",
      reason: "No visible review work matches this search and filter set.",
      nextAction: "Try a student name, requirement title, or program name from this school.",
    };
  }
  return {
    heading: "No matching review work",
    reason: "No submitted or revision-requested work matches these filters.",
    nextAction: "Clear filters to return to review work assigned to this view.",
  };
}

function hasActiveReviewQueueFilters(filters = {}) {
  return Boolean(
    filters.status
    || filters.programId
    || filters.search
    || filters.story
    || (filters.risk && filters.risk !== "any")
    || filters.evidenceStatus
    || safeNumber(filters.offset) > 0
    || safeNumber(filters.limit) !== 50
  );
}

function renderReviewQueueRow(item, selectedId, permissions = {}) {
  const selected = item.submissionId === selectedId;
  return `
    <article class="workspace-student-row ${selected ? "is-selected" : ""}" data-review-submission-id="${escapeHtml(item.submissionId || "")}">
      <div class="workspace-student-card">
        <div>
          <strong>${escapeHtml(item.studentName || "Student")}</strong>
          <p>${escapeHtml(item.requirementTitle || "Capstone Project submission")}</p>
          <p class="workspace-muted">${escapeHtml(item.programName || "Unassigned")} / version ${safeNumber(item.version)} / updated ${escapeHtml(formatDate(item.updatedAt))}</p>
        </div>
        <div class="workspace-row-meta">
          ${statusPill(item.status)}
          ${item.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(item.storyBucket))}</span>` : ""}
          ${renderRiskChips(item.riskFlags || [])}
          <span>${safeNumber(item.evidenceCount)} evidence</span>
          <span>${safeNumber(item.reviewCount)} reviews</span>
          <span>${safeNumber(item.commentCount)} comments</span>
        </div>
      </div>
      <div class="workspace-row-actions">
        <p>${escapeHtml(item.nextAction || "Review status and context.")}</p>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-review-queue-action="select" data-review-submission-id="${escapeHtml(item.submissionId || "")}">
          ${permissions.canReview ? "Review" : "View"}
        </button>
      </div>
    </article>
  `;
}

function renderRiskChips(flags = []) {
  return flags.length
    ? flags.map((flag) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(flag))}</span>`).join("")
    : `<span class="workspace-risk-chip">Low risk</span>`;
}

function renderReviewSubmissionPanel(selected, body) {
  const permissions = body?.permissions || {};
  const historyResult = reviewQueueState.historyResult;
  const history = unwrap(historyResult);
  const selectionNotice = String(reviewQueueState.selectionNotice || "").trim();
  if (reviewQueueState.loadingHistory) {
    return `
      <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="loading">
        <h2>Loading submission</h2>
        ${renderProblemState({
          reason: "Review history is loading.",
          owner: "Review queue.",
          nextAction: "Keep the selected row open.",
        })}
      </section>
    `;
  }
  if (!selected) {
    if (selectionNotice) {
      return `
        <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="selection-unavailable">
          <h2>Shared submission not visible</h2>
          ${renderProblemState({
            reason: selectionNotice,
            owner: "Assigned review staff.",
            nextAction: "Clear filters or select a visible review row. Protected history loads only after the row appears in this scoped queue.",
          })}
        </section>
      `;
    }
    return `
      <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="empty">
        <h2>Select a submission</h2>
        ${renderProblemState({
          reason: "No review row is selected.",
          owner: "Assigned review staff.",
          nextAction: "Select a submitted or revision row to view evidence summaries, protected history, and available teacher decisions.",
        })}
      </section>
    `;
  }
  const canDecide = permissions.canReview && selected.status === "submitted";
  return `
    <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="ready" data-review-selected-submission="${escapeHtml(selected.submissionId || "")}">
      <div class="workspace-card-head">
        <div>
          <h2>${escapeHtml(selected.studentName || "Student")}</h2>
          <p>${escapeHtml(selected.requirementTitle || "Capstone Project submission")}</p>
        </div>
        ${statusPill(selected.status)}
      </div>
      <div class="workspace-detail-grid">
        <span class="workspace-site-context-badge">${escapeHtml(selected.programName || "Unassigned")}</span>
        <span class="workspace-site-context-badge">${safeNumber(selected.evidenceCount)} private evidence</span>
        <span class="workspace-site-context-badge">${safeNumber(selected.reviewCount)} reviews</span>
        <span class="workspace-site-context-badge">${safeNumber(selected.commentCount)} comments</span>
      </div>
      <p>${escapeHtml(selected.nextAction || "Review evidence and history.")}</p>
      <div class="workspace-row-actions">
        <button class="workspace-link-button workspace-link-button-small" type="button" data-review-queue-action="open-student" data-review-student-id="${escapeHtml(selected.studentId || "")}">
          View student detail
        </button>
      </div>
      ${renderReviewHistorySummary(historyResult, history)}
      ${canDecide ? renderReviewDecisionForm(selected) : `
        <section class="workspace-empty-state-card" data-review-mutation-disabled="true">
          <h2>No teacher decision available for this row</h2>
          ${renderProblemState({
            reason: permissions.canReview ? "Teacher decisions are only available while work is submitted for review." : "This workspace is read-only for review decisions.",
            owner: permissions.canReview ? "Assigned program teacher." : "Assigned review staff.",
            nextAction: permissions.canReview ? "Use the history and student detail for context, or select submitted work from this teacher list." : "Use this queue for context; assigned program teachers handle decisions.",
          })}
        </section>
      `}
    </section>
  `;
}

function renderReviewHistorySummary(historyResult, history) {
  if (historyResult && !historyResult.ok) {
    return `
      <section class="workspace-empty-state-card" data-review-history-error="true">
        <h2>Review history unavailable</h2>
        ${renderProblemState({
          reason: "The review history could not load for this submission.",
          owner: "Review queue.",
          nextAction: "Refresh the queue or confirm this submission still belongs to your assigned review list.",
        })}
      </section>
    `;
  }
  const reviews = history?.reviews || [];
  const comments = history?.comments || [];
  return `
    <section class="workspace-detail-section" data-review-history-section="true">
      <h3>Review history</h3>
      ${reviews.length ? `
        <div class="workspace-list">
          ${reviews.slice(0, 5).map((row) => `
            <article class="workspace-row">
              <div>
                <strong>${escapeHtml(statusText(row.decision || "under_review"))}</strong>
                <p>${escapeHtml(row.feedback || "Feedback recorded.")}</p>
                <p class="workspace-muted">${escapeHtml(row.reviewer_name || row.reviewerName || "Reviewer")} / ${escapeHtml(formatDate(row.created_at || row.createdAt))}</p>
              </div>
              ${statusPill(row.decision || "under_review")}
            </article>
          `).join("")}
        </div>
      ` : `<div class="workspace-empty" data-review-history-empty="true">No review decisions recorded yet.</div>`}
      ${renderReviewCommentVisibilitySummary(comments)}
    </section>
  `;
}

function renderReviewCommentVisibilitySummary(comments = []) {
  if (!comments.length) {
    return `<p class="workspace-muted">No protected comments recorded for this submission yet.</p>`;
  }

  const counts = comments.reduce((summary, row) => {
    const visibility = String(row.visibility || "").toLowerCase();
    if (visibility === "staff_only") {
      summary.staffOnly += 1;
    } else if (visibility === "student_and_staff" || visibility === "student_visible") {
      summary.studentVisible += 1;
    } else {
      summary.protectedOnly += 1;
    }
    return summary;
  }, { studentVisible: 0, staffOnly: 0, protectedOnly: 0 });

  const badges = [
    counts.studentVisible
      ? `<span class="workspace-site-context-badge" data-review-comment-visibility="student-visible">Student-visible comments: ${safeNumber(counts.studentVisible)}</span>`
      : "",
    counts.staffOnly
      ? `<span class="workspace-site-context-badge" data-review-comment-visibility="staff-only">Staff-only comments: ${safeNumber(counts.staffOnly)}</span>`
      : "",
    counts.protectedOnly
      ? `<span class="workspace-site-context-badge" data-review-comment-visibility="protected">Protected comments: ${safeNumber(counts.protectedOnly)}</span>`
      : "",
  ].filter(Boolean).join("");

  return `
    <div class="workspace-review-comment-summary" data-review-comment-visibility-summary="true">
      <p class="workspace-muted">Comment visibility</p>
      <div class="workspace-detail-grid">${badges}</div>
      <p class="workspace-muted">Only counts are shown here; teacher note text stays protected.</p>
    </div>
  `;
}

function renderReviewDecisionForm(selected) {
  return `
    <form id="reviewDecisionForm" class="workspace-review-feedback" data-review-decision-form="true">
      <label>
        <span>Feedback</span>
        <textarea name="feedback" rows="5" maxlength="800"></textarea>
      </label>
      <div class="workspace-row-actions">
        <button class="workspace-button workspace-button-primary" type="submit" name="decision" value="approved" data-review-decision="approved">Approve</button>
        <button class="workspace-button workspace-button-secondary" type="submit" name="decision" value="revision_requested" data-review-decision="revision_requested">Request revision</button>
        <button class="workspace-button workspace-button-secondary" type="submit" name="decision" value="comment_only" data-review-decision="comment_only">Add comment only</button>
      </div>
      <p class="workspace-muted">Saved decisions refresh this queue.</p>
      <input type="hidden" name="submissionId" value="${escapeHtml(selected.submissionId || "")}">
    </form>
  `;
}

function renderMentorSection() {
  const result = currentData.mentorAssigned;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Mentor students", "assigned student records");
  }
  const body = unwrap(result);
  const assigned = body?.assignedStudents || [];
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Mentor view</p>
          <h2>Assigned Students</h2>
        </div>
        <span class="workspace-chip">${assigned.length} assigned</span>
      </div>
      ${renderApiNotice(result)}
      <div class="workspace-list">
        ${assigned.length ? assigned.map((item) => `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(item.studentName || "Student")}</strong>
              <p>${escapeHtml(item.evidenceCount || 0)} evidence item${Number(item.evidenceCount || 0) === 1 ? "" : "s"} attached.</p>
            </div>
            ${statusPill(item.submissionStatus || "not_started")}
          </article>
        `).join("") : `<div class="workspace-empty workspace-assignment-empty" data-workspace-state="no-active-assignment">No students are assigned to this mentor account yet.</div>`}
      </div>
    </section>
  `;
}

function renderReadinessSection() {
  const result = currentData.readiness;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Readiness report", "aggregate readiness reporting");
  }
  const body = unwrap(result);
  const report = body?.report || body?.metrics || {};
  const scopeLabel = readinessScopeLabel(body?.scope);
  return `
    <section class="workspace-card" data-readiness-report="aggregate">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Readiness reporting</p>
          <h2>Aggregate Project Readiness</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(scopeLabel)}</span>
      </div>
      ${renderApiNotice(result)}
      <p class="workspace-muted">This report shows aggregate project activity only. It does not open individual student records; school staff handle student follow-up in their assigned workspaces.</p>
      <div class="workspace-grid">
        ${metric("Submitted", report.submitted || 0, "Work waiting for teacher review")}
        ${metric("Needs Revision", report.revisionRequested || 0, "Follow-up requested by reviewers")}
        ${metric("Approved", report.approved || 0, "Work marked complete")}
        ${metric("Evidence", report.evidence || 0, "Attached project evidence")}
        ${metric("Archive Packages Queued", report.exportsQueued || 0, "Closeout packages waiting to finish")}
      </div>
    </section>
  `;
}

function readinessScopeLabel(scope) {
  const normalized = normalizeStatus(scope);
  if (normalized === "aggregate_only") return "Aggregate reporting only";
  if (normalized === "all_programs") return "All programs";
  if (!normalized || normalized === "aggregate") return "Aggregate reporting";
  return statusText(normalized);
}

function renderSecuritySection() {
  const globalAdmin = hasGlobalAdminRole(roleIds(currentUser));
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${globalAdmin ? "Account security" : "Account settings"}</p>
          <h2>Password And Sessions</h2>
        </div>
        <span class="workspace-chip">Signed in</span>
      </div>
      <p>${globalAdmin
        ? "Update your password from this workspace when you know the current password."
        : "Update your own password and close other active sessions without access to admin security tools."}</p>
      <form id="workspaceChangePasswordForm" class="workspace-form" data-auth-action="change-password" data-auth-endpoint="/api/auth/change-password">
        <div class="workspace-form-grid">
          <label class="workspace-label">
            Current password
            <input class="workspace-input" name="currentPassword" type="password" autocomplete="current-password" required>
          </label>
          <label class="workspace-label">
            New password
            <input class="workspace-input" name="newPassword" type="password" autocomplete="new-password" required>
          </label>
          <label class="workspace-label workspace-label-wide">
            Confirm new password
            <input class="workspace-input" name="confirmPassword" type="password" autocomplete="new-password" required>
          </label>
        </div>
        <p class="workspace-muted">After a password change, other active sessions for this account are closed.</p>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Change password</button>
        </div>
      </form>
    </section>
  `;
}

function renderAdminUsersSection() {
  const roles = roleIds(currentUser);
  if (!canUseUsersAccess(roles)) {
    return renderPermissionDeniedSection("Users & Access", "account provisioning records");
  }
  const canCreateGlobal = hasGlobalAdminRole(roles);

  return `
    <section class="workspace-card" data-admin-section="users">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Users & Access</p>
          <h2>Add User</h2>
        </div>
        <span class="workspace-chip">${canCreateGlobal ? "Global Admin" : "Site Admin"}</span>
      </div>
      <form id="workspaceAdminImportForm" class="workspace-form" data-admin-action="import-users" data-admin-endpoint="/api/admin/users/import" data-admin-cache="no-store-response">
        <div class="workspace-form-section">
          <p class="workspace-kicker">User details</p>
          <div class="workspace-form-grid">
            <label class="workspace-label">
              Email
              <input class="workspace-input" name="email" type="email" autocomplete="off" required>
            </label>
            <label class="workspace-label">
              Full name
              <input class="workspace-input" name="fullName" autocomplete="off" maxlength="120" required>
            </label>
            <label class="workspace-label workspace-label-wide">
              Sign-in method
              <select class="workspace-select" name="identityType" required>
                <option value="local">Local account</option>
                <option value="sso">SSO account</option>
              </select>
            </label>
          </div>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">Role</p>
          <div class="workspace-form-grid">
            <label class="workspace-label">
              Role
              <select class="workspace-select" name="roleId" required>
                ${adminRoleOptions(canCreateGlobal)}
              </select>
            </label>
            <div class="workspace-access-preview" data-admin-role-copy aria-live="polite"></div>
          </div>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">Access / assignment</p>
          <div class="workspace-form-grid">
            <label class="workspace-label" data-access-group="site">
              Site
              <select class="workspace-select" name="siteIds" multiple size="4">
                ${siteOptionsForAdminForm()}
              </select>
            </label>
            <label class="workspace-label" data-access-group="program">
              Program
              <select class="workspace-select" name="programIds" multiple size="4">
                ${programOptionsForAdminForm()}
              </select>
            </label>
            <label class="workspace-label workspace-label-wide" data-access-group="student">
              Specific access
              <select class="workspace-select" name="studentIds" multiple size="6">
                ${studentOptionsForAdminForm()}
              </select>
            </label>
          </div>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">Access preview</p>
          <div class="workspace-access-preview" data-admin-access-preview aria-live="polite"></div>
          <label class="workspace-checkbox" data-access-group="global-confirmation">
            <input type="checkbox" name="globalAdminConfirmation" value="true">
            <span>I understand this account can manage every site.</span>
          </label>
        </div>
        <div class="workspace-form-grid">
          <label class="workspace-label workspace-label-wide">
            Admin note
            <textarea class="workspace-textarea" name="adminNote" maxlength="500" required></textarea>
            <span class="workspace-muted">This note is saved in the audit log and is only visible to admins.</span>
          </label>
        </div>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Create account</button>
        </div>
      </form>
    </section>
    ${renderAdminImportResult()}
    ${renderAdminAccessAssignmentPanel()}
  `;
}

function renderAdminImportResult() {
  const users = Array.isArray(lastAdminImportResult?.users) ? lastAdminImportResult.users : [];
  if (!users.length) return "";

  return `
    <section class="workspace-card" data-admin-import-result="one-time-setup-passwords">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Account created</p>
          <h2>Account created</h2>
        </div>
        <span class="workspace-chip">${users.length} account${users.length === 1 ? "" : "s"}</span>
      </div>
      <div class="workspace-list">
        ${users.map((user) => `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(user.displayName || user.email || "Created account")}</strong>
              <p>${escapeHtml(user.email || "")}</p>
              <p class="workspace-muted">${escapeHtml(roleLabel(user.role?.roleId || "role"))} / ${escapeHtml(user.access || scopeLabel(user.role))}</p>
              ${user.temporaryPassword ? `
                <span class="workspace-secret-output" data-admin-import-credential="setup-password">${escapeHtml(user.temporaryPassword || "")}</span>
                <p class="workspace-muted">This password is shown once. The user will create a new password at first sign-in.</p>
                <button class="workspace-button workspace-button-secondary" type="button" data-copy-secret="${escapeHtml(user.temporaryPassword || "")}">Copy temporary password</button>
              ` : `<p class="workspace-muted">SSO account. The user signs in through the approved school identity provider.</p>`}
              ${Array.isArray(user.nextSteps) && user.nextSteps.length ? `<p class="workspace-muted">${escapeHtml(user.nextSteps.join(" "))}</p>` : ""}
            </div>
            ${statusPill(user.status || "pending_reset")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminAccessAssignmentPanel() {
  const result = currentData.accessAssignments;
  if (!result) return "";
  if (result.status === 403) return renderPermissionDeniedSection("Assignment management", "site user assignment records");
  const body = unwrap(result);
  if (!body?.ok) return renderApiNotice(result);
  const users = body.users || {};
  const permissions = body.permissions || {};
  const programs = Array.isArray(body.programs) ? body.programs : [];
  const students = Array.isArray(users.students) ? users.students : [];
  const assignments = body.assignments || {};
  return `
    <section class="workspace-card" data-admin-section="site-assignments">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Site Admin management</p>
          <h2>Manage Site Access</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(body.scope?.siteName || "Current site")}</span>
      </div>
      ${renderApiNotice(result)}
      ${renderSiteAccessAssignmentSummary(users, programs, assignments, permissions)}
      ${renderSiteAccessAssignmentHistory(body.history, users, programs)}
      <div class="workspace-assignment-tabs">
        ${renderAccessAssignmentForm("mentor_student", "Mentors", users.mentors, students, "mentorUserId", "studentId")}
        ${renderAccessAssignmentForm("viewer_student", "Viewers", users.viewers, students, "viewerUserId", "studentId")}
        ${renderProgramTeacherAssignmentForm(users.programTeachers, programs)}
        ${renderSiteRoleAssignmentForm("administration_site", "Administration", users.administration, body.scope?.siteId)}
        ${permissions.canAssignSiteAdmins ? renderSiteRoleAssignmentForm("site_admin_site", "Site Admins", users.siteAdmins, body.scope?.siteId) : ""}
      </div>
    </section>
  `;
}

function renderSiteAccessAssignmentSummary(users = {}, programs = [], assignments = {}, permissions = {}) {
  const labels = accessAssignmentLabels(users, programs);
  const sections = [
    renderAccessAssignmentSummaryRows({
      title: "Mentor student coverage",
      rows: assignments.mentorStudent,
      empty: "No mentor-student assignments are active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.mentorUserId),
        labels.student(row.studentId),
        "Mentor can view this assigned student's progress and support context.",
      ),
    }),
    renderAccessAssignmentSummaryRows({
      title: "Viewer student access",
      rows: assignments.viewerStudent,
      empty: "No viewer-student access is active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.viewerUserId),
        labels.student(row.studentId),
        "Viewer access is read-only and limited to this student.",
      ),
    }),
    renderAccessAssignmentSummaryRows({
      title: "Program teacher access",
      rows: assignments.programTeacherProgram,
      empty: "No program teacher program access is active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.programTeacherUserId),
        labels.program(row.programId),
        "Program teachers can review assigned program records.",
      ),
    }),
    renderAccessAssignmentSummaryRows({
      title: "Administration access",
      rows: assignments.administrationSite,
      empty: "No administration access is active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.userId),
        labels.site(row.siteId),
        "Leadership visibility is read-only for this school.",
      ),
    }),
  ];
  if (permissions.canAssignSiteAdmins || Array.isArray(assignments.siteAdminSite)) {
    sections.push(renderAccessAssignmentSummaryRows({
      title: "Site admin access",
      rows: assignments.siteAdminSite,
      empty: "No site admin access is active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.userId),
        labels.site(row.siteId),
        "Site admins can manage users and assignments inside this school.",
      ),
    }));
  }

  return `
    <div class="workspace-assignment-summary" data-site-access-assignment-summary="true">
      <div>
        <p class="workspace-kicker">Current access</p>
        <h3>Active Assignments</h3>
        <p class="workspace-muted">Use these rows to confirm current access before saving changes below.</p>
      </div>
      <div class="workspace-assignment-summary-grid">
        ${sections.join("")}
      </div>
    </div>
  `;
}

function renderSiteAccessAssignmentHistory(rows = [], users = {}, programs = []) {
  const history = Array.isArray(rows) ? rows : [];
  const labels = accessAssignmentLabels(users, programs);
  return `
    <div class="workspace-assignment-summary" data-site-access-history="true">
      <div>
        <p class="workspace-kicker">Recorded changes</p>
        <h3>Recent access changes</h3>
        <p class="workspace-muted">Review the latest access assignments and removals for this school. Admin note text stays hidden here.</p>
      </div>
      ${history.length ? `
        <div class="workspace-list">
          ${history.map((row) => renderSiteAccessHistoryRow(row, labels)).join("")}
        </div>
      ` : `<div class="workspace-empty">No recorded access changes are available for this school yet.</div>`}
    </div>
  `;
}

function renderSiteAccessHistoryRow(row = {}, labels) {
  return `
    <article class="workspace-row" data-site-access-history-row="${escapeHtml(row.historyId || "history")}">
      <div>
        <strong>${escapeHtml(siteAccessHistoryTitle(row))}</strong>
        <p>${escapeHtml(siteAccessHistorySubject(row, labels))}</p>
        <p class="workspace-muted">${escapeHtml(row.actorName || "System")} / ${escapeHtml(formatDate(row.createdAt))}</p>
      </div>
      ${siteAccessHistoryStatusPill(row.action)}
    </article>
  `;
}

function siteAccessHistoryTitle(row = {}) {
  const label = {
    mentor_student: "Mentor access",
    viewer_student: "Viewer access",
    program_teacher_program: "Program teacher access",
    administration_site: "Administration access",
    site_admin_site: "Site admin access",
  }[row.assignmentType] || "Access";
  return `${label} ${row.action === "remove" ? "removed" : "assigned"}`;
}

function siteAccessHistorySubject(row = {}, labels) {
  if (row.assignmentType === "mentor_student" || row.assignmentType === "viewer_student") {
    return `${labels.user(row.targetUserId)} / ${labels.student(row.studentId)}`;
  }
  if (row.assignmentType === "program_teacher_program") {
    return `${labels.user(row.targetUserId)} / ${labels.program(row.programId)}`;
  }
  return `${labels.user(row.targetUserId)} / ${labels.site(row.siteId)}`;
}

function siteAccessHistoryStatusPill(action = "assign") {
  if (action === "remove") {
    return `<span class="workspace-status-pill archived" data-status="removed">Removed</span>`;
  }
  return `<span class="workspace-status-pill approved" data-status="assigned">Assigned</span>`;
}

function renderAccessAssignmentSummaryRows({ title, rows = [], empty, renderRow }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `
    <section class="workspace-assignment-summary-group">
      <h4>${escapeHtml(title)}</h4>
      ${safeRows.length ? `
        <div class="workspace-list">
          ${safeRows.map(renderRow).join("")}
        </div>
      ` : `<div class="workspace-empty">${escapeHtml(empty)}</div>`}
    </section>
  `;
}

function accessAssignmentRow(primary, secondary, detail) {
  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(primary)}</strong>
        <p>${escapeHtml(secondary)}</p>
        <p class="workspace-muted">${escapeHtml(detail)}</p>
      </div>
      ${activeAccessPill()}
    </article>
  `;
}

function activeAccessPill() {
  return `<span class="workspace-status-pill configured" data-status="active">Active</span>`;
}

function accessAssignmentLabels(users = {}, programs = []) {
  const userLookup = new Map();
  for (const group of Object.values(users || {})) {
    if (!Array.isArray(group)) continue;
    for (const user of group) {
      const id = user.userId || user.studentId || user.id || "";
      if (!id || userLookup.has(id)) continue;
      const name = user.displayName || user.studentName || user.email || id;
      userLookup.set(id, name);
    }
  }
  const programLookup = new Map((Array.isArray(programs) ? programs : []).map((program) => [
    program.programId,
    program.programName || program.programId,
  ]));
  const siteLookup = new Map((accessibleSitesForWorkspace() || []).map((site) => [
    site.siteId,
    site.siteName || site.siteId,
  ]));
  return {
    user: (id) => userLookup.get(id) || id || "Selected user",
    student: (id) => userLookup.get(id) || id || "Selected student",
    program: (id) => programLookup.get(id) || id || "Selected program",
    site: (id) => siteLookup.get(id) || id || "Current school",
  };
}

function renderAccessAssignmentForm(type, title, targets = [], students = []) {
  return `
    <form class="workspace-form workspace-assignment-form" data-site-access-assignment-form data-assignment-type="${escapeHtml(type)}">
      <input type="hidden" name="siteId" value="${escapeHtml(currentAccessSiteId())}">
      <input type="hidden" name="assignmentType" value="${escapeHtml(type)}">
      <p class="workspace-kicker">${escapeHtml(title)}</p>
      <div class="workspace-form-grid">
        <label class="workspace-label">
          User
          <select class="workspace-select" name="targetUserId" required>
            ${userOptions(targets)}
          </select>
        </label>
        <label class="workspace-label">
          Student
          <select class="workspace-select" name="studentId" required>
            ${userOptions(students)}
          </select>
        </label>
        ${assignmentActionSelect()}
        ${assignmentNoteField()}
      </div>
      ${assignmentActionGuidance(type)}
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-secondary" type="submit">Save access change</button>
      </div>
    </form>
  `;
}

function renderProgramTeacherAssignmentForm(targets = [], programs = []) {
  return `
    <form class="workspace-form workspace-assignment-form" data-site-access-assignment-form data-assignment-type="program_teacher_program">
      <input type="hidden" name="siteId" value="${escapeHtml(currentAccessSiteId())}">
      <input type="hidden" name="assignmentType" value="program_teacher_program">
      <p class="workspace-kicker">Program Teachers</p>
      <div class="workspace-form-grid">
        <label class="workspace-label">
          User
          <select class="workspace-select" name="targetUserId" required>
            ${userOptions(targets)}
          </select>
        </label>
        <label class="workspace-label">
          Program
          <select class="workspace-select" name="programId" required>
            ${programs.map((program) => `<option value="${escapeHtml(program.programId)}">${escapeHtml(program.programName || program.programId)}</option>`).join("")}
          </select>
        </label>
        ${assignmentActionSelect()}
        ${assignmentNoteField()}
      </div>
      ${assignmentActionGuidance("program_teacher_program")}
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-secondary" type="submit">Save access change</button>
      </div>
    </form>
  `;
}

function renderSiteRoleAssignmentForm(type, title, targets = [], siteId = "") {
  return `
    <form class="workspace-form workspace-assignment-form" data-site-access-assignment-form data-assignment-type="${escapeHtml(type)}">
      <input type="hidden" name="siteId" value="${escapeHtml(siteId || currentAccessSiteId())}">
      <input type="hidden" name="assignmentType" value="${escapeHtml(type)}">
      <p class="workspace-kicker">${escapeHtml(title)}</p>
      <div class="workspace-form-grid">
        <label class="workspace-label">
          User
          <select class="workspace-select" name="targetUserId" required>
            ${userOptions(targets)}
          </select>
        </label>
        ${assignmentActionSelect()}
        ${assignmentNoteField()}
      </div>
      ${assignmentActionGuidance(type)}
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-secondary" type="submit">Save access change</button>
      </div>
    </form>
  `;
}

function adminRoleOptions(canCreateGlobal) {
  const roles = [
    ["student", "Student"],
    ["mentor", "Mentor"],
    ["viewer", "Viewer"],
    ["program_teacher", "Program Teacher"],
    ["administration", "Administration"],
    ["site_admin", "Site Admin"],
  ];
  if (canCreateGlobal) roles.push(["global_admin", "Global Admin"]);
  return roles.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function siteOptionsForAdminForm() {
  const sites = accessibleSitesForWorkspace();
  const context = currentSiteWorkspaceContext();
  if (!sites.length && context.siteId) {
    sites.push({ siteId: context.siteId, siteName: context.siteName || context.siteId });
  }
  return sites.map((site) => `<option value="${escapeHtml(site.siteId)}">${escapeHtml(site.siteName || site.siteId)}</option>`).join("");
}

function programOptionsForAdminForm() {
  const access = unwrap(currentData.accessAssignments);
  const programs = Array.isArray(access?.programs) ? access.programs : [];
  return programs.map((program) => `<option value="${escapeHtml(program.programId)}">${escapeHtml(program.programName || program.programId)}</option>`).join("");
}

function studentOptionsForAdminForm() {
  const access = unwrap(currentData.accessAssignments);
  const students = Array.isArray(access?.users?.students) ? access.users.students : [];
  return userOptions(students);
}

function userOptions(users = []) {
  if (!Array.isArray(users) || users.length === 0) return `<option value="">No available records</option>`;
  return users.map((user) => {
    const value = user.userId || user.studentId || user.id || "";
    const label = user.displayName || user.studentName || user.email || value;
    const detail = user.email && user.email !== label ? ` (${user.email})` : "";
    return `<option value="${escapeHtml(value)}">${escapeHtml(label + detail)}</option>`;
  }).join("");
}

function assignmentActionSelect() {
  return `
    <label class="workspace-label">
      Action
      <select class="workspace-select" name="action">
        <option value="assign">Assign</option>
        <option value="remove">Remove</option>
      </select>
    </label>
  `;
}

function assignmentNoteField() {
  return `
    <label class="workspace-label workspace-label-wide">
      Admin note
      <textarea class="workspace-textarea" name="adminNote" maxlength="500" required></textarea>
    </label>
  `;
}

function assignmentActionGuidance(type) {
  const copy = {
    mentor_student: "Choose Assign to grant or reactivate mentor access for one student. Choose Remove only for a current row shown above; it is recorded for review and does not delete the account or student work.",
    viewer_student: "Choose Assign to grant or reactivate read-only viewer access for one student. Choose Remove only for a current row shown above; it is recorded for review and does not delete the account or student work.",
    program_teacher_program: "Choose Assign to grant or reactivate program teacher access for this school. Choose Remove only for a current row shown above; it is recorded for review and does not delete the account or program records.",
    administration_site: "Choose Assign to grant or reactivate administration access for this school. Choose Remove only for a current row shown above; it is recorded for review and does not delete the account or school records.",
    site_admin_site: "Choose Assign to grant or reactivate site admin access for this school. Choose Remove only for a current row shown above; it is recorded for review and does not delete the account or school records.",
  };
  return `<p class="workspace-muted" data-site-access-action-guidance="${escapeHtml(type || "site_access")}">${escapeHtml(copy[type] || "Choose Assign to grant access. Choose Remove only for a current row shown above; it is recorded for review and does not delete accounts or records.")}</p>`;
}

function currentAccessSiteId() {
  return unwrap(currentData.accessAssignments)?.scope?.siteId || currentSiteWorkspaceContext()?.siteId || selectedSiteId || "";
}

function bindWorkspaceForms() {
  document.querySelector("#workspaceChangePasswordForm")?.addEventListener("submit", changeOwnPassword);
  const adminImportForm = document.querySelector("#workspaceAdminImportForm");
  adminImportForm?.addEventListener("submit", submitAdminUserImport);
  adminImportForm?.querySelector?.('[name="roleId"]')?.addEventListener("change", updateAdminImportScopeFields);
  adminImportForm?.querySelector?.('[name="identityType"]')?.addEventListener("change", updateAdminImportScopeFields);
  adminImportForm?.querySelectorAll?.('[name="siteIds"], [name="programIds"], [name="studentIds"]')?.forEach((field) => {
    field.addEventListener("change", () => renderAdminAccessPreview(adminImportForm));
  });
  updateAdminImportScopeFields();
  document.querySelectorAll("[data-site-access-assignment-form]").forEach((form) => {
    form.addEventListener("submit", submitSiteAccessAssignment);
  });
  document.querySelectorAll("[data-copy-secret]").forEach((button) => {
    button.addEventListener("click", copySecretFromButton);
  });
  document.querySelector("#workspaceEvidenceLinkForm")?.addEventListener("submit", attachEvidenceLink);
  const uploadForm = document.querySelector("#workspaceFileUploadForm");
  uploadForm?.addEventListener("submit", uploadEvidenceFile);
  uploadForm?.querySelector?.('[data-upload-action="select-file"]')?.addEventListener("change", handleUploadFileSelected);
  bindUploadRetryButton();
  document.querySelectorAll("[data-presentation-action]").forEach((button) => {
    button.addEventListener("click", updatePresentationSlot);
  });
  document.querySelectorAll("[data-presentation-filter-action]").forEach((button) => {
    button.addEventListener("click", handlePresentationFilterAction);
  });
  document.querySelectorAll("[data-student-feedback-action]").forEach((button) => {
    button.addEventListener("click", handleStudentFeedbackAction);
  });
  document.querySelectorAll("[data-student-requirement-action]").forEach((button) => {
    button.addEventListener("click", handleStudentRequirementAction);
  });
  document.querySelectorAll("[data-student-submission-action]").forEach((button) => {
    button.addEventListener("click", handleStudentSubmissionAction);
  });
  document.querySelector("#siteStudentFilterForm")?.addEventListener("submit", applySiteStudentFilters);
  document.querySelectorAll("[data-site-student-action]").forEach((button) => {
    button.addEventListener("click", handleSiteStudentAction);
  });
  document.querySelectorAll("[data-student-detail-tab]").forEach((button) => {
    button.addEventListener("click", selectSiteStudentDetailTab);
  });
  document.querySelectorAll("[data-student-detail-timeline-type]").forEach((button) => {
    button.addEventListener("click", selectSiteStudentTimelineType);
  });
  document.querySelectorAll("[data-student-detail-action]").forEach((button) => {
    button.addEventListener("click", handleSiteStudentDetailAction);
  });
  document.querySelector("#mentorMeetingForm")?.addEventListener("submit", submitMentorMeeting);
  document.querySelector("#reviewQueueFilterForm")?.addEventListener("submit", applyReviewQueueFilters);
  document.querySelectorAll("[data-review-queue-action]").forEach((button) => {
    button.addEventListener("click", handleReviewQueueAction);
  });
  document.querySelector("#reviewDecisionForm")?.addEventListener("submit", submitReviewDecision);
  document.querySelector("#mentorAssignmentFilterForm")?.addEventListener("submit", applyMentorAssignmentFilters);
  document.querySelectorAll("[data-mentor-assignment-action]").forEach((button) => {
    button.addEventListener("click", handleMentorAssignmentAction);
  });
  document.querySelectorAll("[data-mentor-dashboard-action]").forEach((button) => {
    button.addEventListener("click", handleMentorDashboardAction);
  });
  document.querySelector("#mentorAssignmentForm")?.addEventListener("submit", submitMentorAssignment);
  document.querySelector("#operationsReadinessFilterForm")?.addEventListener("submit", applyOperationsReadinessFilters);
  document.querySelectorAll("[data-operations-action]").forEach((button) => {
    button.addEventListener("click", handleOperationsReadinessAction);
  });
}

function bindUploadRetryButton() {
  document.querySelector('[data-upload-action="retry"]')?.addEventListener("click", retryEvidenceUpload);
}

async function handleStudentFeedbackAction(event) {
  const action = event?.currentTarget?.dataset?.studentFeedbackAction;
  if (action !== "open-history") return;
  await openStudentFeedbackHistory(event.currentTarget?.dataset?.studentFeedbackSubmissionId || "");
}

function handleStudentRequirementAction(event) {
  const action = event?.currentTarget?.dataset?.studentRequirementAction;
  if (!["toggle-detail", "open-detail"].includes(action)) return;
  const requirementId = cleanDirectoryFilter(event.currentTarget?.dataset?.studentRequirementId || "");
  if (!requirementId) return;
  const opening = action === "open-detail" || studentRequirementDetailState.selectedRequirementId !== requirementId;
  studentRequirementDetailState = {
    selectedRequirementId: opening ? requirementId : "",
  };
  if (opening) requestStudentRequirementFocus(requirementId);
  activeSection = "student";
  renderAppShell(opening ? "Requirement details opened." : "Requirement details closed.", "success");
}

async function handleStudentSubmissionAction(event) {
  const button = event?.currentTarget;
  const action = button?.dataset?.studentSubmissionAction || "";
  const submissionId = cleanDirectoryFilter(button?.dataset?.studentSubmissionId || "");
  if (!submissionId) return;
  if (action === "focus-evidence") {
    focusEvidenceFormsForSubmission(submissionId);
    return;
  }
  if (action !== "submit" || busy) return;
  busy = true;
  button.disabled = true;
  renderAppShell("Sending your work for teacher review...");
  const result = await settleApi(apiJson(`/api/submissions/${encodeURIComponent(submissionId)}/submit`, {
    method: "POST",
  }));
  busy = false;
  if (!result.ok) {
    renderAppShell(messageForStudentSubmissionError(result.body?.error || result.error, result.status), "error");
    return;
  }
  await loadWorkspaceData("Your work was sent for teacher review.");
}

function focusEvidenceFormsForSubmission(submissionId) {
  let matched = false;
  document.querySelectorAll('#workspaceEvidenceLinkForm select[name="submissionId"], #workspaceFileUploadForm select[name="submissionId"]').forEach((select) => {
    const hasOption = Array.from(select.options || []).some((option) => option.value === submissionId);
    if (hasOption) {
      select.value = submissionId;
      matched = true;
    }
  });
  const panel = document.querySelector('[data-student-evidence-panel="true"]');
  if (matched) panel?.setAttribute("data-selected-submission-id", submissionId);
  panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  document.querySelector('#workspaceEvidenceLinkForm input[name="title"]')?.focus?.();
}

async function openStudentFeedbackHistory(submissionId) {
  const selectedSubmissionId = cleanDirectoryFilter(submissionId);
  if (!selectedSubmissionId) return;
  studentFeedbackHistoryState = {
    ...defaultStudentFeedbackHistoryState(),
    selectedSubmissionId,
    loading: true,
  };
  activeSection = "student";
  renderAppShell("Loading feedback timeline...");
  const historyResult = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(selectedSubmissionId)}/history`));
  studentFeedbackHistoryState = {
    ...studentFeedbackHistoryState,
    loading: false,
    result: historyResult,
  };
  renderAppShell(historyResult.ok ? "Feedback timeline loaded." : "Feedback timeline unavailable.", historyResult.ok ? "success" : "error");
}

async function applySiteStudentFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  siteStudentFilters = {
    search: cleanDirectoryFilter(data.get("search")),
    programId: cleanDirectoryFilter(data.get("programId")),
    status: cleanDirectoryFilter(data.get("status")),
    progressStatus: cleanDirectoryFilter(data.get("progressStatus")),
    evidenceStatus: cleanDirectoryFilter(data.get("evidenceStatus")),
    reviewStatus: cleanDirectoryFilter(data.get("reviewStatus")),
    noMentor: data.get("noMentor") === "true",
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    story: cleanDirectoryFilter(data.get("story")),
    presentationStatus: cleanDirectoryFilter(data.get("presentationStatus")) || "any",
    archiveStatus: cleanDirectoryFilter(data.get("archiveStatus")) || "any",
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  activeSection = "students";
  syncSiteStudentUrlState();
  await loadWorkspaceData("Student directory filters applied.");
}

async function applyReviewQueueFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  reviewQueueFilters = {
    status: cleanDirectoryFilter(data.get("status")),
    programId: cleanDirectoryFilter(data.get("programId")),
    search: cleanDirectoryFilter(data.get("search")),
    story: cleanDirectoryFilter(data.get("story")),
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    evidenceStatus: cleanDirectoryFilter(data.get("evidenceStatus")),
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  reviewQueueState = defaultReviewQueueState();
  activeSection = "teacher";
  syncReviewQueueUrlState();
  await loadReviewQueueResult("Review queue filters applied.");
}

async function applyMentorAssignmentFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  mentorAssignmentFilters = {
    programId: cleanDirectoryFilter(data.get("programId")),
    mentorUserId: cleanDirectoryFilter(data.get("mentorUserId")),
    studentSearch: cleanDirectoryFilter(data.get("studentSearch")),
    status: cleanDirectoryFilter(data.get("status")),
    noMentor: data.get("noMentor") === "true",
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  activeSection = "mentorAssignments";
  syncMentorAssignmentUrlState();
  await loadMentorAssignmentsResult("Mentor assignment filters applied.");
}

async function applyOperationsReadinessFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  operationsReadinessFilters = {
    studentId: "",
    programId: cleanDirectoryFilter(data.get("programId")),
    status: cleanDirectoryFilter(data.get("status")),
    story: cleanDirectoryFilter(data.get("story")),
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    presentationStatus: cleanDirectoryFilter(data.get("presentationStatus")),
    archiveStatus: cleanDirectoryFilter(data.get("archiveStatus")),
    readiness: cleanDirectoryFilter(data.get("readiness")),
    category: cleanDirectoryFilter(data.get("category")),
    needsAttention: false,
    outlineAttention: false,
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  activeSection = "operations";
  syncOperationsReadinessUrlState();
  await loadOperationsReadinessResult("Operations filters applied.");
}

async function handleOperationsReadinessAction(event) {
  const action = event?.currentTarget?.dataset?.operationsAction;
  if (!action) return;
  if (action === "open-student") {
    activeSection = "operations";
    await openSiteStudentDetail(event.currentTarget?.dataset?.operationsStudentId || "", { sourceSection: "operations" });
    return;
  }
  if (action === "reset-filters") {
    operationsReadinessFilters = defaultOperationsReadinessFilters();
    activeSection = "operations";
    syncOperationsReadinessUrlState({ clearFilters: true });
    await loadOperationsReadinessResult("Operations filters reset.");
    return;
  }
  if (action === "filter-category") {
    const category = canonicalReviewQueueValue(event.currentTarget?.dataset?.operationsCategory, OPERATIONS_CATEGORY_VALUES);
    if (!category) return;
    operationsReadinessFilters = {
      ...operationsReadinessFilters,
      category,
      offset: 0,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult(`Showing ${categoryLabel(category).toLowerCase()} operations rows.`);
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const body = unwrap(currentData.operationsReadiness);
    const pagination = body?.pagination || {};
    const limit = safeNumber(pagination.limit || operationsReadinessFilters.limit || 50);
    const offset = safeNumber(pagination.offset || operationsReadinessFilters.offset || 0);
    operationsReadinessFilters = {
      ...operationsReadinessFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Operations page updated.");
  }
}

async function handleMentorAssignmentAction(event) {
  const action = event?.currentTarget?.dataset?.mentorAssignmentAction;
  if (!action) return;
  if (action === "open-student") {
    activeSection = "mentorAssignments";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorStudentId || "", { sourceSection: "mentorAssignments" });
    return;
  }
  if (action === "filter-mentor") {
    const mentorUserId = cleanDirectoryFilter(event.currentTarget?.dataset?.mentorId);
    if (!mentorUserId) return;
    mentorAssignmentFilters = {
      ...defaultMentorAssignmentFilters(),
      mentorUserId,
      status: "active",
    };
    activeSection = "mentorAssignments";
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Showing active assignments for this mentor.");
    return;
  }
  if (action === "reset-filters") {
    mentorAssignmentFilters = defaultMentorAssignmentFilters();
    activeSection = "mentorAssignments";
    syncMentorAssignmentUrlState({ clearFilters: true });
    await loadMentorAssignmentsResult("Mentor assignment filters reset.");
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const body = unwrap(currentData.mentorAssignments);
    const pagination = body?.pagination || {};
    const limit = safeNumber(pagination.limit || mentorAssignmentFilters.limit || 50);
    const offset = safeNumber(pagination.offset || mentorAssignmentFilters.offset || 0);
    mentorAssignmentFilters = {
      ...mentorAssignmentFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    activeSection = "mentorAssignments";
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Mentor assignment page updated.");
  }
}

async function handleMentorDashboardAction(event) {
  const action = event?.currentTarget?.dataset?.mentorDashboardAction;
  if (!action) return;
  if (action === "filter") {
    mentorDashboardFilter = cleanMentorDashboardFilter(event.currentTarget?.dataset?.mentorDashboardFilter || "all");
    activeSection = "mentorDashboard";
    renderAppShell(mentorDashboardFilter === "all" ? "Showing all assigned students." : "Mentor dashboard filter applied.", "success");
    return;
  }
  if (action === "open-student") {
    activeSection = "mentorDashboard";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorDashboardStudentId || "", { sourceSection: "mentorDashboard" });
    return;
  }
  if (action === "open-meetings") {
    activeSection = "mentorDashboard";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorDashboardStudentId || "", {
      sourceSection: "mentorDashboard",
      activeTab: "mentor",
    });
  }
}

async function handleReviewQueueAction(event) {
  const action = event?.currentTarget?.dataset?.reviewQueueAction;
  if (!action) return;
  if (action === "select") {
    await openReviewSubmission(event.currentTarget?.dataset?.reviewSubmissionId || "");
    return;
  }
  if (action === "open-student") {
    activeSection = "teacher";
    await openSiteStudentDetail(event.currentTarget?.dataset?.reviewStudentId || "", { sourceSection: "teacher" });
    return;
  }
  if (action === "reset-filters") {
    reviewQueueFilters = defaultReviewQueueFilters();
    reviewQueueState = defaultReviewQueueState();
    activeSection = "teacher";
    syncReviewQueueUrlState({ clearFilters: true });
    await loadReviewQueueResult("Review queue filters reset.");
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const queue = unwrap(currentData.reviewQueue);
    const pagination = queue?.pagination || {};
    const limit = safeNumber(pagination.limit || reviewQueueFilters.limit || 50);
    const offset = safeNumber(pagination.offset || reviewQueueFilters.offset || 0);
    reviewQueueFilters = {
      ...reviewQueueFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    reviewQueueState = defaultReviewQueueState();
    activeSection = "teacher";
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Review queue page updated.");
  }
}

async function openReviewSubmission(submissionId) {
  const selectedSubmissionId = cleanDirectoryFilter(submissionId);
  if (!selectedSubmissionId) return;
  const rows = unwrap(currentData.reviewQueue)?.queue || [];
  if (rows.length && !rows.some((row) => row.submissionId === selectedSubmissionId)) {
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectionNotice: "The selected submission is not visible in the current review queue.",
    };
    syncReviewQueueUrlState();
    renderAppShell("Select a visible review row.", "error");
    return;
  }
  reviewQueueState = {
    ...defaultReviewQueueState(),
    selectedSubmissionId,
  };
  syncReviewQueueUrlState();
  await loadSelectedReviewHistory(selectedSubmissionId, { renderLoading: true });
}

async function submitReviewDecision(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const submissionId = cleanDirectoryFilter(data.get("submissionId"));
  const decision = cleanDirectoryFilter(event.submitter?.value || data.get("decision"));
  const feedback = String(data.get("feedback") || "").trim();
  if (!submissionId || !["approved", "revision_requested", "comment_only"].includes(decision)) {
    renderAppShell("Choose a review decision before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  const queue = unwrap(currentData.reviewQueue);
  const selected = (queue?.queue || []).find((item) => item.submissionId === submissionId) || null;
  const siteId = queue?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  try {
    const result = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(submissionId)}/decision${query}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, feedback }),
    }));
    reviewQueueState = {
      ...reviewQueueState,
      decisionResult: result,
    };
    if (!result.ok) {
      renderAppShell(messageForReviewDecisionError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await refreshSelectedStudentDetailAfterReview(selected);
    await loadReviewQueueResult("Review decision saved.");
  } finally {
    busy = false;
  }
}

async function loadReviewQueueResult(message = "", options = {}) {
  const result = await settleApi(apiJson(`/api/site/review-queue${siteReviewQueueQueryString()}`));
  currentData.reviewQueue = result;
  const rows = unwrap(result)?.queue || [];
  const selectedSubmissionId = cleanDirectoryFilter(reviewQueueState.selectedSubmissionId);
  if (selectedSubmissionId && !rows.some((row) => row.submissionId === selectedSubmissionId)) {
    reviewQueueState = {
      ...reviewQueueState,
      selectedSubmissionId: "",
      historyResult: null,
      loadingHistory: false,
      selectionNotice: "The shared submission is not visible in this review queue with the current filters.",
    };
  } else if (options.restoreSelection !== false) {
    await restoreReviewQueueSelectionFromCurrentRows({ renderLoading: false });
  }
  activeSection = "teacher";
  if (options.syncUrl !== false) syncReviewQueueUrlState({ replace: Boolean(options.replaceUrl) });
  renderAppShell(result.ok ? (message || "Review queue loaded.") : "Review queue unavailable.", result.ok ? "success" : "error");
}

async function restoreReviewQueueSelectionFromCurrentRows(options = {}) {
  const selectedSubmissionId = cleanDirectoryFilter(reviewQueueState.selectedSubmissionId);
  if (!selectedSubmissionId || reviewQueueState.historyResult || reviewQueueState.loadingHistory) return;
  const rows = unwrap(currentData.reviewQueue)?.queue || [];
  if (!rows.some((row) => row.submissionId === selectedSubmissionId)) {
    reviewQueueState = {
      ...reviewQueueState,
      selectedSubmissionId: "",
      historyResult: null,
      loadingHistory: false,
      selectionNotice: "The shared submission is not visible in this review queue with the current filters.",
    };
    syncReviewQueueUrlState({ replace: true });
    return;
  }
  await loadSelectedReviewHistory(selectedSubmissionId, options);
}

async function loadSelectedReviewHistory(selectedSubmissionId, options = {}) {
  const queue = unwrap(currentData.reviewQueue);
  const siteId = selectedSiteQueryValue() || queue?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  reviewQueueState = {
    ...reviewQueueState,
    selectedSubmissionId,
    loadingHistory: true,
  };
  activeSection = "teacher";
  if (options.renderLoading) renderAppShell("Loading review history...");
  const historyResult = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(selectedSubmissionId)}/history${query}`));
  reviewQueueState = {
    ...reviewQueueState,
    loadingHistory: false,
    historyResult,
  };
  if (options.renderLoading) {
    renderAppShell(historyResult.ok ? "Review history loaded." : "Review history unavailable.", historyResult.ok ? "success" : "error");
  }
}

async function refreshSelectedStudentDetailAfterReview(selected) {
  if (!selected?.studentId || siteStudentDetailState.studentId !== selected.studentId) return;
  const siteId = unwrap(currentData.reviewQueue)?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const result = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(selected.studentId)}${query}`));
  if (result.ok) {
    siteStudentDetailState = {
      ...siteStudentDetailState,
      result,
      timelineResult: null,
    };
    currentData.siteStudentDetail = result;
  }
}

async function submitMentorAssignment(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const studentId = cleanDirectoryFilter(data.get("studentId"));
  const mentorUserId = cleanDirectoryFilter(data.get("mentorUserId"));
  const reason = String(data.get("reason") || "").trim();
  const body = unwrap(currentData.mentorAssignments);
  const siteId = body?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  if (!siteId || !studentId || !mentorUserId || !reason) {
    renderAppShell("Choose a student, mentor, and assignment reason before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/site/mentor-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, studentId, mentorUserId, reason }),
    }));
    if (!result.ok) {
      activeSection = "mentorAssignments";
      renderAppShell(messageForMentorAssignmentError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await refreshConnectedSurfacesAfterMentorAssignment(studentId, siteId);
    await loadMentorAssignmentsResult("Mentor assignment saved.");
  } finally {
    busy = false;
  }
}

async function submitMentorMeeting(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const studentId = cleanDirectoryFilter(data.get("studentId"));
  const status = cleanDirectoryFilter(data.get("status")) || "held";
  const notes = String(data.get("notes") || "").trim().slice(0, 1200);
  if (!studentId || !["held", "missed", "makeup_required"].includes(status) || !notes) {
    renderAppShell("Choose a meeting result and add notes before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/mentor/meetings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, status, notes }),
    }));
    if (!result.ok) {
      renderAppShell(messageForMentorMeetingError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await refreshConnectedSurfacesAfterMentorMeeting(studentId);
    siteStudentDetailState = {
      ...siteStudentDetailState,
      activeTab: "mentor",
    };
    renderAppShell("Mentor meeting recorded.", "success");
  } finally {
    busy = false;
  }
}

async function loadMentorAssignmentsResult(message = "") {
  const result = await settleApi(apiJson(`/api/site/mentor-assignments${siteMentorAssignmentQueryString()}`));
  currentData.mentorAssignments = result;
  activeSection = "mentorAssignments";
  renderAppShell(result.ok ? (message || "Mentor assignments loaded.") : "Mentor assignments unavailable.", result.ok ? "success" : "error");
}

async function loadOperationsReadinessResult(message = "") {
  const result = await settleApi(apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`));
  currentData.operationsReadiness = result;
  activeSection = "operations";
  renderAppShell(result.ok ? (message || "Operations readiness loaded.") : "Operations readiness unavailable.", result.ok ? "success" : "error");
}

async function refreshConnectedSurfacesAfterMentorMeeting(studentId) {
  const detail = unwrap(siteStudentDetailState.result);
  const siteId = selectedSiteQueryValue()
    || detail?.scope?.siteId
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const refreshes = [];
  if (studentId) {
    refreshes.push(settleApi(apiJson(`/api/site/students/${encodeURIComponent(studentId)}${query}`)).then((result) => {
      if (result.ok) {
        siteStudentDetailState = {
          ...siteStudentDetailState,
          studentId,
          result,
          timelineResult: null,
        };
        currentData.siteStudentDetail = result;
      }
    }));
  }
  if (currentData.mentorDashboard) {
    refreshes.push(settleApi(apiJson("/api/mentor/dashboard")).then((result) => {
      currentData.mentorDashboard = result;
    }));
  }
  if (currentData.mentorAssigned) {
    refreshes.push(settleApi(apiJson("/api/mentor/assigned")).then((result) => {
      currentData.mentorAssigned = result;
    }));
  }
  await Promise.all(refreshes);
}

async function refreshConnectedSurfacesAfterMentorAssignment(studentId, siteId) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const refreshes = [];
  if (currentData.siteDashboard) {
    refreshes.push(settleApi(apiJson(`/api/site/dashboard${query}`)).then((result) => {
      currentData.siteDashboard = result;
    }));
  }
  if (currentData.siteStudents) {
    refreshes.push(settleApi(apiJson(`/api/site/students${siteStudentQueryString()}`)).then((result) => {
      currentData.siteStudents = result;
    }));
  }
  if (siteStudentDetailState.studentId === studentId || unwrap(currentData.siteStudentDetail)?.scope?.studentId === studentId) {
    refreshes.push(settleApi(apiJson(`/api/site/students/${encodeURIComponent(studentId)}${query}`)).then((result) => {
      if (result.ok) {
        siteStudentDetailState = {
          ...siteStudentDetailState,
          result,
          timelineResult: null,
        };
        currentData.siteStudentDetail = result;
      }
    }));
  }
  if (currentData.operationsReadiness) {
    refreshes.push(settleApi(apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`)).then((result) => {
      currentData.operationsReadiness = result;
    }));
  }
  await Promise.all(refreshes);
}

async function handleSiteStudentAction(event) {
  const action = event?.currentTarget?.dataset?.siteStudentAction;
  if (!action) return;
  if (action === "view-detail") {
    const sourceSection = activeSection === "programDashboard" || activeSection === "siteDashboard" ? activeSection : "students";
    await openSiteStudentDetail(event.currentTarget?.dataset?.studentDetailId || "", { sourceSection });
    return;
  }
  if (action === "reset-filters") {
    siteStudentFilters = defaultSiteStudentFilters();
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState({ clearFilters: true });
    await loadWorkspaceData("Student directory filters reset.");
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const directory = unwrap(currentData.siteStudents);
    const pagination = directory?.pagination || {};
    const limit = safeNumber(pagination.limit || siteStudentFilters.limit || 50);
    const offset = safeNumber(pagination.offset || siteStudentFilters.offset || 0);
    siteStudentFilters = {
      ...siteStudentFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Student directory page updated.");
  }
}

async function openSiteStudentDetail(studentId, options = {}) {
  const selectedStudentId = cleanDirectoryFilter(studentId);
  if (!selectedStudentId) return;
  const directory = unwrap(currentData.siteStudents);
  const sourceSection = cleanWorkspaceSection(options.sourceSection) || "students";
  const requestedTab = cleanStudentDetailTab(options.activeTab);
  const siteId = selectedSiteQueryValue()
    || directory?.scope?.siteId
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  siteStudentDetailState = {
    ...defaultSiteStudentDetailState(),
    studentId: selectedStudentId,
    sourceSection,
    activeTab: requestedTab || "summary",
    loading: true,
  };
  activeSection = sourceSection;
  requestSiteStudentDetailFocus();
  renderAppShell("Loading student detail...");
  const result = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(selectedStudentId)}${query}`));
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loading: false,
    result,
  };
  currentData.siteStudentDetail = result;
  requestSiteStudentDetailFocus();
  renderAppShell(result.ok ? "Student detail loaded." : "Student detail unavailable.", result.ok ? "success" : "error");
}

async function handleSiteStudentDetailAction(event) {
  const action = event?.currentTarget?.dataset?.studentDetailAction;
  if (action === "close") {
    const sourceSection = cleanWorkspaceSection(siteStudentDetailState.sourceSection) || "students";
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = sourceSection;
    renderAppShell();
    return;
  }
  if (action === "open-operations") {
    const studentId = cleanDirectoryFilter(event?.currentTarget?.dataset?.studentDetailOperationsStudentId || siteStudentDetailState.studentId);
    if (!studentId) return;
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      studentId,
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing operations rows for this student.");
  }
}

function cleanStudentDetailTab(value) {
  const requested = String(value || "").trim();
  const allowedTabs = new Set(["summary", "progress", "submissions", "evidence", "reviews", "mentor", "presentation", "archive", "timeline"]);
  return allowedTabs.has(requested) ? requested : "";
}

function cleanStudentDetailTimelineType(value) {
  const requested = normalizeStatus(value);
  return STUDENT_DETAIL_TIMELINE_TYPE_VALUES.has(requested) ? requested : "";
}

function studentDetailTimelineTypeLabel(value) {
  const normalized = cleanStudentDetailTimelineType(value);
  const match = STUDENT_DETAIL_TIMELINE_TYPES.find(([type]) => type === normalized);
  return match?.[1] || "All activity";
}

async function selectSiteStudentDetailTab(event) {
  const tab = cleanStudentDetailTab(event?.currentTarget?.dataset?.studentDetailTab);
  if (!tab || !siteStudentDetailState.studentId) return;
  siteStudentDetailState = {
    ...siteStudentDetailState,
    activeTab: tab,
  };
  if (tab !== "timeline" || siteStudentDetailState.timelineResult || siteStudentDetailState.loadingTimeline) {
    renderAppShell();
    return;
  }
  await loadSiteStudentTimeline();
}

async function selectSiteStudentTimelineType(event) {
  if (!siteStudentDetailState.studentId) return;
  const timelineType = cleanStudentDetailTimelineType(event?.currentTarget?.dataset?.studentDetailTimelineType || "");
  if (siteStudentDetailState.activeTab === "timeline" && siteStudentDetailState.timelineType === timelineType && siteStudentDetailState.timelineResult) return;
  siteStudentDetailState = {
    ...siteStudentDetailState,
    activeTab: "timeline",
    timelineType,
    timelineResult: null,
  };
  await loadSiteStudentTimeline();
}

async function loadSiteStudentTimeline() {
  if (!siteStudentDetailState.studentId || siteStudentDetailState.loadingTimeline) {
    renderAppShell();
    return;
  }
  const detail = unwrap(siteStudentDetailState.result);
  const siteId = selectedSiteQueryValue() || detail?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  const params = new URLSearchParams();
  if (siteId) params.set("siteId", siteId);
  const timelineType = cleanStudentDetailTimelineType(siteStudentDetailState.timelineType || "");
  if (timelineType) params.set("type", timelineType);
  const query = params.toString() ? `?${params.toString()}` : "";
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loadingTimeline: true,
  };
  renderAppShell("Loading student timeline...");
  const timelineResult = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(siteStudentDetailState.studentId)}/timeline${query}`));
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loadingTimeline: false,
    timelineResult,
  };
  currentData.siteStudentTimeline = timelineResult;
  renderAppShell(timelineResult.ok ? "Student timeline loaded." : "Student timeline unavailable.", timelineResult.ok ? "success" : "error");
}

function renderPresentationSection() {
  const result = currentData.presentationSlots;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Presentation schedule", "presentation day records");
  }
  const body = unwrap(result);
  const slots = body?.slots || [];
  const activeFilter = cleanPresentationSlotFilter(presentationSlotFilter);
  const filteredSlots = filterPresentationSlots(slots, activeFilter);
  const roles = roleIds(currentUser);
  const canManage = roles.has("program_teacher") || hasGlobalAdminRole(roles) || roles.has("site_admin");
  return `
    <section class="workspace-card" data-presentation-schedule="true" data-presentation-filter="${escapeHtml(activeFilter)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Presentation day</p>
          <h2>Schedule And Check-In</h2>
          <p>Review scheduled presentations, outline follow-up, and day-of check-in state from scoped presentation records.</p>
        </div>
        <span class="workspace-chip">${filteredSlots.length} of ${slots.length} slot${slots.length === 1 ? "" : "s"}</span>
      </div>
      ${renderApiNotice(result)}
      ${renderPresentationSlotFilters(slots, activeFilter)}
      <div class="workspace-list">
        ${filteredSlots.length ? filteredSlots.map((slot) => renderPresentationSlotRow(slot, canManage)).join("") : renderPresentationSlotsEmptyState(slots.length, activeFilter)}
      </div>
    </section>
  `;
}

function renderPresentationSlotFilters(slots = [], activeFilter = "all") {
  const filters = [
    ["all", "All", slots.length],
    ["scheduled", "Ready for check-out", slots.filter((slot) => slot.status === "scheduled").length],
    ["checked_out", "Checked out", slots.filter((slot) => slot.status === "checked_out").length],
    ["checked_in", "Checked in", slots.filter((slot) => slot.status === "checked_in" || slot.status === "completed").length],
    ["outline_follow_up", "Outline follow-up", slots.filter((slot) => ["pending", "revision_needed"].includes(String(slot.outlineStatus || ""))).length],
  ];
  return `
    <div class="workspace-filter-bar workspace-presentation-filters" data-presentation-filters="true" aria-label="Presentation schedule filters">
      ${filters.map(([filter, label, count]) => `
        <button class="workspace-button ${activeFilter === filter ? "workspace-button-primary" : "workspace-button-secondary"}" type="button" data-presentation-filter-action="${escapeHtml(filter)}" aria-pressed="${activeFilter === filter ? "true" : "false"}">
          ${escapeHtml(label)} (${escapeHtml(count)})
        </button>
      `).join("")}
    </div>
  `;
}

function filterPresentationSlots(slots = [], activeFilter = "all") {
  const filter = cleanPresentationSlotFilter(activeFilter);
  if (filter === "all") return slots;
  return slots.filter((slot) => presentationSlotMatchesFilter(slot, filter));
}

function presentationSlotMatchesFilter(slot, filter) {
  if (filter === "scheduled") return slot?.status === "scheduled";
  if (filter === "checked_out") return slot?.status === "checked_out";
  if (filter === "checked_in") return slot?.status === "checked_in" || slot?.status === "completed";
  if (filter === "outline_follow_up") return ["pending", "revision_needed"].includes(String(slot?.outlineStatus || ""));
  return true;
}

function cleanPresentationSlotFilter(value) {
  const filter = normalizeStatus(value);
  return ["all", "scheduled", "checked_out", "checked_in", "outline_follow_up"].includes(filter) ? filter : "all";
}

function renderPresentationSlotsEmptyState(totalSlots, activeFilter) {
  if (safeNumber(totalSlots) > 0 && activeFilter !== "all") {
    return `
      <section class="workspace-empty-state-card" data-presentation-state="filter-empty">
        <strong>No presentation slots match this filter.</strong>
        <p>Clear the filter to review the full presentation schedule for this account.</p>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-presentation-filter-action="all">Show all slots</button>
      </section>
    `;
  }
  return `
    <section class="workspace-empty-state-card" data-presentation-state="empty">
      <strong>No presentation slots scheduled yet.</strong>
      <p>Presentation slots will appear here after authorized staff schedule them for visible students.</p>
    </section>
  `;
}

function renderArchiveSection() {
  const result = currentData.archiveReadiness;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Archive readiness", "student archive records");
  }
  const body = unwrap(result);
  if (!body) {
    return `
      <section class="workspace-card workspace-error-card">
        <h2>Archive readiness unavailable</h2>
        ${renderApiNotice(result)}
      </section>
    `;
  }

  const checks = body.checks || [];
  const summary = body.summary || {};
  const archive = body.archive || {};
  const storage = body.storage || {};
  const retention = body.retention || {};
  const scopedDownloadReady = Boolean(archive.scopedDownloadReady || archive.signedDownloadReady);
  const drivePackageStatus = archive.drivePackageReady || storage.drivePackageReady ? "ready" : "pending";
  const downloadMessage = studentArchiveDownloadStatusCopy(archive, storage);
  return `
    <section class="workspace-card workspace-hero-card" data-archive-status="${escapeHtml(archive.status || "unknown")}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Closeout and archive</p>
          <h2>May 5 Package Readiness</h2>
        </div>
        ${statusPill(summary.archiveAvailableToRequest ? "ready" : archive.status || "not_requested")}
      </div>
      <p>${escapeHtml(archive.message || "Review your closeout evidence before requesting an archive package.")}</p>
      <div class="workspace-grid">
        ${metric("Ready Checks", summary.readyChecks || 0)}
        ${metric("Needs Action", summary.missingChecks || 0)}
        ${metric("Total Checks", summary.totalChecks || checks.length)}
      </div>
    </section>
    ${renderStudentArchiveGuidance(body)}
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Archive checklist</p>
          <h2>Closeout Requirements</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(body.source || "persisted rows")}</span>
      </div>
      ${renderApiNotice(result)}
      <div class="workspace-list">
        ${checks.length ? checks.map(renderArchiveCheckRow).join("") : `<div class="workspace-empty">Archive checks will appear after closeout requirements are assigned.</div>`}
      </div>
    </section>
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Storage</p>
          <h2>Archive Download</h2>
        </div>
        ${statusPill(storage.credentialsConfigured ? "configured" : "provider_unavailable")}
      </div>
      <div class="workspace-list">
        <article class="workspace-row">
          <div>
            <strong>Download status</strong>
            <p>${escapeHtml(downloadMessage)}</p>
            ${scopedDownloadReady && archive.downloadUrl ? `<a class="workspace-link-button" data-archive-download="manifest" href="${escapeHtml(archive.downloadUrl)}">Download archive manifest</a>` : ""}
          </div>
          ${statusPill(archive.status || "not_requested")}
        </article>
        <article class="workspace-row">
          <div>
            <strong>Privacy guard</strong>
            <p>Private file details stay hidden from this workspace.</p>
          </div>
          ${statusPill(storage.storageIdentifiersRedacted ? "ready" : "needs_review")}
        </article>
        <article class="workspace-row" data-archive-drive-package="${escapeHtml(drivePackageStatus)}">
          <div>
            <strong>Archive package file</strong>
            <p>${escapeHtml(drivePackageStatus === "ready" ? "Archive package file is stored for protected download." : "Archive package file will appear after staff prepares it and storage is ready.")}</p>
          </div>
          ${statusPill(drivePackageStatus)}
        </article>
        <article class="workspace-row" data-archive-retention-status="${escapeHtml(retention.policyStatus || "unknown")}">
          <div>
            <strong>Retention window</strong>
            <p>${escapeHtml(retention.policyReviewRequired ? "Retention policy needs school review before archive packages are used broadly." : `Archive downloads stay available for ${retention.downloadWindowDays || 14} days.`)}</p>
          </div>
          ${statusPill(retention.downloadExpiresSoon ? "expiring_soon" : retention.policyStatus || "policy_review_required")}
        </article>
      </div>
    </section>
  `;
}

function studentArchiveDownloadStatusCopy(archive = {}, storage = {}) {
  const archiveStatus = String(archive.status || "not_requested");
  const scopedDownloadReady = Boolean(archive.scopedDownloadReady || archive.signedDownloadReady);
  if (archive.downloadExpired) return "The previous archive download window expired. Ask staff to generate a fresh package.";
  if (scopedDownloadReady) {
    return archive.downloadExpiresAt
      ? `Your archive download is ready until ${formatDate(archive.downloadExpiresAt)}.`
      : "Your archive download is ready.";
  }
  if (archive.downloadExpiresSoon) return "The archive download window is ending soon, but the download is not available in this view.";
  if (archiveStatus === "queued" || archiveStatus === "running") return "Staff are preparing your archive package.";
  if (archiveStatus === "failed") return "Archive package preparation needs staff follow-up.";
  if (storage.credentialsConfigured === false || (storage.providerStatus && storage.providerStatus !== "ready" && storage.providerStatus !== "configured")) {
    return "Storage setup is needed before archive package downloads are ready.";
  }
  return "Your archive download is not ready yet.";
}

function renderStudentArchiveGuidance(body) {
  const guidance = studentArchiveGuidance(body);
  return `
    <section class="workspace-dashboard-card workspace-student-archive-guidance" data-archive-guidance="true" data-archive-guidance-status="${escapeHtml(guidance.status)}" aria-labelledby="studentArchiveGuidanceTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Archive next step</p>
          <h2 id="studentArchiveGuidanceTitle">${escapeHtml(guidance.title)}</h2>
          <p>${escapeHtml(guidance.detail)}</p>
        </div>
        ${statusPill(guidance.status)}
      </div>
      <div class="workspace-student-action-focus">
        <strong>${escapeHtml(guidance.owner)}</strong>
        <span>${escapeHtml(guidance.when)}</span>
      </div>
    </section>
  `;
}

function studentArchiveProgressFact(body) {
  const checks = archiveReadinessChecks(body);
  const summary = body?.summary || {};
  if (!checks.length && !safeNumber(summary.totalChecks)) return "";
  const guidance = studentArchiveGuidance(body);
  return `${guidance.title}. ${guidance.when}`;
}

function studentArchiveGuidance(body) {
  const checks = archiveReadinessChecks(body);
  const summary = body?.summary || {};
  const archive = body?.archive || {};
  const storage = body?.storage || {};
  const totalChecks = safeNumber(summary.totalChecks || checks.length);
  const readyChecks = safeNumber(summary.readyChecks);
  const progressText = totalChecks
    ? `${readyChecks} of ${totalChecks} closeout checks ready.`
    : "Closeout checks will appear after they are assigned.";
  const archiveStatus = String(archive.status || "not_requested");
  const scopedDownloadReady = Boolean(archive.scopedDownloadReady || archive.signedDownloadReady);

  if (archive.downloadExpired) {
    return {
      status: "expired",
      title: "Ask for a fresh archive package",
      detail: "The previous download window expired. Ask your program teacher or administrator to generate a fresh package.",
      owner: "Staff support",
      when: "No new evidence is needed unless a check below changed.",
    };
  }

  if (scopedDownloadReady) {
    return {
      status: "ready",
      title: "Your archive package is ready",
      detail: "Use the download link below before the window expires.",
      owner: "Your action",
      when: archive.downloadExpiresAt ? `Download by ${formatDate(archive.downloadExpiresAt)}.` : "Download when you are ready.",
    };
  }

  if (archiveStatus === "queued" || archiveStatus === "running") {
    return {
      status: archiveStatus,
      title: "Staff are preparing your archive package",
      detail: `${progressText} No extra upload is needed right now.`,
      owner: "Staff support",
      when: "Check back after the package finishes.",
    };
  }

  const blockingCheck = firstArchiveBlockingCheck(checks);
  if (blockingCheck) {
    return {
      status: blockingCheck.status || "missing",
      title: `Finish ${blockingCheck.label || "a closeout requirement"}`,
      detail: `${progressText} ${archiveGuidanceDetailForCheck(blockingCheck)}`,
      owner: blockingCheck.status === "attention_required" ? "Ask your program teacher" : "Your action",
      when: `Evidence matched: ${safeNumber(blockingCheck.evidenceCount)}`,
    };
  }

  if (archiveStatus === "failed") {
    return {
      status: "failed",
      title: "Staff need to review your archive package",
      detail: `${progressText} Archive package preparation did not finish. Your checklist can still be reviewed while staff follow up.`,
      owner: "Staff support",
      when: "No retry action is needed from you right now.",
    };
  }

  if (summary.archiveAvailableToRequest) {
    return {
      status: "ready",
      title: "Closeout checks are ready",
      detail: `${progressText} Ask your program teacher or administrator to generate your May 5 archive package.`,
      owner: "Staff support",
      when: "Your checklist is ready for staff review.",
    };
  }

  if (storage.credentialsConfigured === false || (storage.providerStatus && storage.providerStatus !== "ready" && storage.providerStatus !== "configured")) {
    return {
      status: "provider_unavailable",
      title: "Staff setup is needed before download",
      detail: `${progressText} Your checklist can still be reviewed, but archive package downloads are not ready yet.`,
      owner: "Staff support",
      when: "Keep finishing the checklist below.",
    };
  }

  return {
    status: archiveStatus,
    title: "Review your closeout checklist",
    detail: `${progressText} Use the checklist below to see what is ready and what still needs evidence or teacher review.`,
    owner: "Your action",
    when: "Start with any check that is not ready.",
  };
}

function archiveReadinessChecks(body) {
  return Array.isArray(body?.checks) ? body.checks : [];
}

function firstArchiveBlockingCheck(checks) {
  for (const status of ["missing", "in_progress", "attention_required"]) {
    const match = checks.find((check) => check?.status === status);
    if (match) return match;
  }
  return null;
}

function archiveGuidanceDetailForCheck(check) {
  const message = check.message || "Review this archive requirement.";
  if (check.status === "attention_required") {
    return `${message} Ask your program teacher whether this applies to your project.`;
  }
  if (check.status === "in_progress") {
    return `${message} Add or update evidence if your teacher asked for more.`;
  }
  return `${message} Add the missing work or ask your program teacher what to attach.`;
}

function renderArchiveCheckRow(check) {
  return `
    <article class="workspace-row" data-archive-check="${escapeHtml(check.id)}" data-archive-check-status="${escapeHtml(check.status || "unknown")}">
      <div>
        <strong>${escapeHtml(check.label || "Archive check")}</strong>
        <p>${escapeHtml(check.message || "Review this archive requirement.")}</p>
        <p class="workspace-muted">${escapeHtml(check.evidenceCount || 0)} evidence item${Number(check.evidenceCount || 0) === 1 ? "" : "s"} matched.</p>
      </div>
      ${statusPill(check.status)}
    </article>
  `;
}

function renderPresentationSlotRow(slot, canManage) {
  const status = String(slot.status || "unknown");
  return `
    <article class="workspace-row workspace-presentation-row" data-presentation-state="${escapeHtml(status)}">
      <div>
        <strong>${escapeHtml(slot.studentName || "Your presentation")}</strong>
        <p>${escapeHtml(formatDate(slot.scheduledFor))} / ${escapeHtml(slot.durationMinutes || 15)} min / ${escapeHtml(slot.location || "Location pending")}</p>
        <p class="workspace-muted">Outline ${escapeHtml(statusText(slot.outlineStatus || "pending"))}${presentationTimestampSummary(slot)}</p>
      </div>
      <div class="workspace-presentation-actions">
        ${statusPill(status)}
        ${renderPresentationAction(slot, canManage)}
      </div>
    </article>
  `;
}

function presentationTimestampSummary(slot) {
  const parts = [];
  if (slot.checkedOutAt) parts.push(`checked out ${formatDate(slot.checkedOutAt)}`);
  if (slot.checkedInAt) parts.push(`checked in ${formatDate(slot.checkedInAt)}`);
  return parts.length ? ` / ${parts.join(" / ")}` : "";
}

function renderPresentationAction(slot, canManage) {
  if (!canManage) return "";
  if (slot.status === "scheduled") {
    return `<button class="workspace-button workspace-button-primary" type="button" data-presentation-action="check-out" data-slot-id="${escapeHtml(slot.id)}">Check out</button>`;
  }
  if (slot.status === "checked_out") {
    return `<button class="workspace-button workspace-button-secondary" type="button" data-presentation-action="check-in" data-slot-id="${escapeHtml(slot.id)}">Check in</button>`;
  }
  return "";
}

function handlePresentationFilterAction(event) {
  presentationSlotFilter = cleanPresentationSlotFilter(event?.currentTarget?.dataset?.presentationFilterAction || "all");
  activeSection = "presentation";
  renderAppShell();
}

function renderPermissionDeniedSection(title, detail) {
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="permission-denied">
      <p class="workspace-kicker">Access needed</p>
      <h2>${escapeHtml(title)} unavailable</h2>
      <p>
        You do not have access to this section with the current school assignment.
        Use another assigned account or ask the project coordinator to adjust access.
      </p>
      ${renderProblemState({
        reason: `This account is not assigned to ${detail}.`,
        owner: "Project coordinator or site administrator.",
        nextAction: "Request the correct role or open the workspace with an assigned account.",
      })}
    </section>
  `;
}

async function attachEvidenceLink(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  setFormBusy(form, true);

  try {
    const response = await fetch(`/api/submissions/${encodeURIComponent(values.submissionId)}/evidence`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        title: values.title,
        url: values.url,
        artifactType: values.artifactType,
      }),
    });
    const body = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForEvidenceError(body?.error, response.status), "error");
      return;
    }
    await loadWorkspaceData("Evidence link attached. Your teacher can now review it.");
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    busy = false;
  }
}

async function uploadEvidenceFile(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const attempt = buildUploadAttemptFromForm(form);
  const validationMessage = validateUploadAttempt(attempt);

  if (validationMessage) {
    lastUploadAttempt = null;
    updateUploadState({
      state: "failed",
      progress: 0,
      message: validationMessage,
      fileName: attempt.file?.name || "",
      fileSize: attempt.file?.size || 0,
      retryReady: false,
    });
    return;
  }

  lastUploadAttempt = attempt;
  await runEvidenceUploadAttempt(attempt, form);
}

function handleUploadFileSelected(event) {
  const file = event.currentTarget?.files?.[0] || null;
  if (!file) {
    lastUploadAttempt = null;
    updateUploadState({
      state: "idle",
      progress: 0,
      message: "Choose a file to upload evidence.",
      fileName: "",
      fileSize: 0,
      retryReady: false,
    });
    return;
  }

  const validationMessage = validateWorkspaceUploadFile(file);
  updateUploadState({
    state: validationMessage ? "failed" : "selected",
    progress: 0,
    message: validationMessage || `${file.name || "Selected file"} is ready to upload.`,
    fileName: file.name || "Selected file",
    fileSize: file.size || 0,
    retryReady: false,
  });
}

async function retryEvidenceUpload() {
  if (busy) return;
  if (!lastUploadAttempt?.file) {
    updateUploadState({
      state: "failed",
      progress: 0,
      message: "Choose the file again, then upload it.",
      retryReady: false,
    });
    return;
  }
  await runEvidenceUploadAttempt(lastUploadAttempt, null);
}

async function runEvidenceUploadAttempt(attempt, form) {
  busy = true;
  if (form) setFormBusy(form, true);
  updateUploadState({
    state: "preparing",
    progress: 5,
    message: "Preparing your file for upload.",
    fileName: attempt.file.name || "Selected file",
    fileSize: attempt.file.size || 0,
    retryReady: false,
  });

  try {
    const response = await uploadEvidenceWithProgress(
      `/api/submissions/${encodeURIComponent(attempt.submissionId)}/evidence/upload`,
      formDataForUploadAttempt(attempt),
      (progressEvent) => {
        const progress = progressEvent.lengthComputable && progressEvent.total > 0
          ? Math.max(8, Math.min(92, Math.round((progressEvent.loaded / progressEvent.total) * 92)))
          : Math.max(uploadState.progress || 0, 35);
        updateUploadState({
          state: "uploading",
          progress,
          message: progressEvent.lengthComputable
            ? `Uploading ${attempt.file.name || "your file"} (${progress}%).`
            : `Uploading ${attempt.file.name || "your file"}.`,
          retryReady: false,
        });
      },
    );

    updateUploadState({
      state: "verifying",
      progress: 95,
      message: "Checking that the upload finished safely.",
      retryReady: false,
    });

    const body = response.body;
    if (!response.ok) {
      updateUploadState({
        state: "failed",
        progress: 0,
        message: messageForUploadError(body?.error, response.status),
        fileName: attempt.file.name || "Selected file",
        fileSize: attempt.file.size || 0,
        retryReady: canRetryUploadFailure(body?.error, response.status),
      });
      return;
    }
    updateUploadState({
      state: "complete",
      progress: 100,
      message: "Your file was received and added to your evidence.",
      fileName: attempt.file.name || "Selected file",
      fileSize: attempt.file.size || 0,
      retryReady: false,
    });
    await loadWorkspaceData("Your file was received and added to your Capstone Project evidence.");
  } catch (error) {
    updateUploadState({
      state: "failed",
      progress: 0,
      message: messageForNetworkError(error),
      fileName: attempt.file.name || "Selected file",
      fileSize: attempt.file.size || 0,
      retryReady: true,
    });
  } finally {
    if (form) setFormBusy(form, false);
    busy = false;
  }
}

function buildUploadAttemptFromForm(form) {
  const formData = new FormData(form);
  return {
    submissionId: String(formData.get("submissionId") || ""),
    artifactType: String(formData.get("artifactType") || "reflection"),
    title: String(formData.get("title") || ""),
    file: formData.get("file"),
  };
}

function formDataForUploadAttempt(attempt) {
  const formData = new FormData();
  formData.set("title", attempt.title);
  formData.set("artifactType", attempt.artifactType);
  formData.set("file", attempt.file, attempt.file.name || "evidence-upload");
  return formData;
}

function validateUploadAttempt(attempt) {
  if (!attempt.submissionId) return "Choose the submission this file belongs to.";
  if (!attempt.title.trim()) return "Add a short title for this file.";
  return validateWorkspaceUploadFile(attempt.file);
}

function validateWorkspaceUploadFile(file) {
  if (!file || typeof file !== "object" || !Number.isFinite(file.size)) {
    return "Choose a file before uploading.";
  }
  if (file.size <= 0) {
    return "The selected file is empty. Choose a file with content and try again.";
  }
  if (file.size > WORKSPACE_UPLOAD_MAX_BYTES) {
    return "This file is larger than the current 20 MB limit. Choose a smaller file or ask your instructor for help.";
  }
  if (!workspaceUploadFileSupported(file)) {
    return "Choose a PDF, image, text file, spreadsheet, presentation, or document for this upload.";
  }
  return "";
}

function workspaceUploadFileSupported(file) {
  const mimeType = String(file?.type || "").toLowerCase().split(";")[0].trim();
  if (mimeType.startsWith("image/") || WORKSPACE_UPLOAD_ALLOWED_MIME_TYPES.has(mimeType)) return true;
  const fileName = String(file?.name || "").toLowerCase();
  return WORKSPACE_UPLOAD_ALLOWED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

function canRetryUploadFailure(error, status) {
  if (error === "drive_token_exchange_failed" || error === "drive_provider_error" || error === "drive_upload_failed") return true;
  if (status === 0 || status === 502) return true;
  return false;
}

function updateUploadState(nextState) {
  uploadState = {
    ...uploadState,
    ...nextState,
    progress: clampUploadProgress(nextState.progress ?? uploadState.progress),
  };
  refreshUploadStatusPanel();
}

function refreshUploadStatusPanel() {
  const panel = document.querySelector("#workspaceUploadStatus");
  if (!panel) return;
  panel.outerHTML = renderUploadStatus();
  bindUploadRetryButton();
}

function uploadEvidenceWithProgress(url, formData, onProgress) {
  if (typeof XMLHttpRequest !== "function") {
    return fetch(url, {
      method: "POST",
      headers: { accept: "application/json" },
      body: formData,
    }).then(async (response) => ({
      ok: response.ok,
      status: response.status,
      body: await safeJson(response),
    }));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("accept", "application/json");
    xhr.responseType = "text";
    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        onProgress({
          lengthComputable: event.lengthComputable,
          loaded: event.loaded,
          total: event.total,
        });
      };
    }
    xhr.onload = () => {
      let body = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = null;
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        body,
      });
    };
    xhr.onerror = () => reject(new Error("network_error"));
    xhr.onabort = () => reject(new Error("upload_cancelled"));
    xhr.send(formData);
  });
}

async function updatePresentationSlot(event) {
  if (busy) return;
  busy = true;
  const button = event.currentTarget;
  const slotId = button.dataset.slotId || "";
  const action = button.dataset.presentationAction || "";
  const actionPath = action === "check-in" ? "check-in" : "check-out";
  button.disabled = true;

  try {
    const response = await fetch(`/api/presentation-slots/${encodeURIComponent(slotId)}/${actionPath}`, {
      method: "POST",
      headers: { accept: "application/json" },
    });
    const body = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForPresentationActionError(body?.error, response.status), "error");
      return;
    }
    await loadWorkspaceData(actionPath === "check-in" ? "Presentation check-in recorded." : "Presentation check-out recorded.");
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    busy = false;
  }
}

async function changeOwnPassword(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const form = event.currentTarget;
  const currentPassword = form.currentPassword.value;
  const newPassword = form.newPassword.value;
  const confirmPassword = form.confirmPassword.value;

  if (newPassword !== confirmPassword) {
    busy = false;
    activeSection = "security";
    renderAppShell("The new passwords do not match.", "error");
    return;
  }

  setFormBusy(form, true);
  try {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await safeJson(response);
    if (!response.ok) {
      activeSection = "security";
      renderAppShell(messageForChangePasswordError(body?.error, response.status), "error");
      return;
    }
    activeSection = "security";
    await loadWorkspaceData("Password changed. Other sessions for this account were closed.");
  } catch (error) {
    activeSection = "security";
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    busy = false;
  }
}

async function submitAdminUserImport(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const form = event.currentTarget;
  const importBody = buildAdminImportBody(form);

  if (!importBody.ok) {
    busy = false;
    lastAdminImportResult = null;
    activeSection = "adminUsers";
    renderAppShell(importBody.message, "error");
    return;
  }

  setFormBusy(form, true);
  try {
    const response = await fetch("/api/admin/users/import", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(importBody.body),
    });
    const body = await safeJson(response);
    if (!response.ok) {
      lastAdminImportResult = null;
      activeSection = "adminUsers";
      renderAppShell(messageForAdminImportError(body?.error, response.status), "error");
      return;
    }
    lastAdminImportResult = body;
    activeSection = "adminUsers";
    await loadWorkspaceData("Account created.");
  } catch (error) {
    lastAdminImportResult = null;
    activeSection = "adminUsers";
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

async function signOut() {
  renderAppShell("Signing out...");
  try {
    await fetch("/api/auth/logout", { method: "POST", headers: { accept: "application/json" } });
  } finally {
    currentUser = null;
    currentData = defaultCurrentData(currentData.authConfig);
    lastAdminImportResult = null;
    studentRequirementDetailState = defaultStudentRequirementDetailState();
    studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
    presentationSlotFilter = "all";
    renderSignIn("You have signed out.", "success");
  }
}

function setFormBusy(form, isBusy) {
  form.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = isBusy;
  });
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, { headers: { accept: "application/json", ...(options.headers || {}) }, ...options });
  const body = await safeJson(response);
  if (!response.ok) {
    return { ok: false, status: response.status, error: body?.error || "request_failed", body };
  }
  return { ok: true, status: response.status, body };
}

async function settleApi(promise) {
  try {
    return await promise;
  } catch (error) {
    return { ok: false, status: 0, error: "network_error", message: messageForNetworkError(error), body: null };
  }
}

function unwrap(result) {
  return result?.ok ? result.body : null;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function renderApiNotice(result) {
  if (!result || result.ok) return "";
  return statusHtml(messageForApiError(result.error, result.status), result.status === 503 ? "neutral" : "error");
}

function statusHtml(message, tone = "neutral") {
  return `<div class="workspace-status ${tone === "success" || tone === "error" ? tone : ""}">${escapeHtml(message)}</div>`;
}

function greetingForUser() {
  const roles = roleIds(currentUser);
  if (hasGlobalAdminRole(roles)) return "Global Admin workspace is ready.";
  if (roles.has("org_admin")) return "Organization workspace is ready.";
  if (roles.has("site_admin")) return "Site Admin workspace is ready.";
  if (roles.has("administration")) return "Administration workspace is ready.";
  if (roles.has("student")) return "Your senior project is ready.";
  if (roles.has("program_teacher")) return "Teacher review is ready.";
  if (roles.has("mentor")) return "Mentor workspace is ready.";
  if (roles.has("viewer")) return "Viewer workspace is ready.";
  return "Workspace is ready.";
}

function nextStepText() {
  const dashboard = unwrap(currentData.dashboard);
  if (dashboard?.nextAction) return dashboard.nextAction;
  const roles = roleIds(currentUser);
  if (roles.has("site_admin")) return "Review site progress, student readiness, mentor coverage, presentation status, and archive signals available to this account.";
  if (roles.has("administration")) return "Review assigned site students, readiness, presentation, and progress dashboards.";
  if (roles.has("org_admin")) return "Review assigned organization and site summaries available to this account.";
  if (hasGlobalAdminRole(roles)) return "Review platform setup and multisite readiness available to this account.";
  if (roles.has("viewer")) return "Review assigned students in read-only mode.";
  if (roles.has("program_teacher")) return "Review submitted work and follow up where students need feedback.";
  if (roles.has("mentor")) return "Check assigned students before mentor meetings and presentation preparation.";
  if (roles.has("misc_admin")) return "Review aggregate readiness without opening individual student records.";
  return "Ask your instructor to confirm your workspace role.";
}

function metric(label, value, detail = "") {
  return `
    <article class="workspace-metric">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </article>
  `;
}

function renderMetricTile(label, value, detail = "", tone = "", actionSection = "", actionOptions = {}) {
  const actionLabel = actionOptions.label || "Open";
  const actionPreset = actionOptions.preset
    ? ` data-section-preset="${escapeHtml(actionOptions.preset)}"`
    : "";
  const action = actionSection && availableSectionIds().has(actionSection)
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(actionSection)}"${actionPreset}>${escapeHtml(actionLabel)}</button>`
    : `<span class="workspace-summary-badge">Summary only</span>`;
  return `
    <article class="workspace-metric-tile ${escapeHtml(tone)}">
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(safeNumber(value))}</strong>
        ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
      </div>
      ${action}
    </article>
  `;
}

function renderDashboardCard(title, kicker, bodyHtml) {
  return `
    <section class="workspace-dashboard-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(kicker)}</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
      </div>
      ${bodyHtml}
    </section>
  `;
}

function renderQuickActions(actions) {
  return `
    <div class="workspace-quick-action-grid">
      ${actions.map((action) => `
        <button class="workspace-quick-action" type="button" data-section="${escapeHtml(action.section)}">
          <strong>${escapeHtml(action.label)}</strong>
          <span>${escapeHtml(action.detail)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderNeedsAttention(items = []) {
  if (!items.length) {
    return `<div class="workspace-empty">No urgent records match this view right now. Assigned staff can continue normal project follow-up.</div>`;
  }
  return `
    <div class="workspace-attention-list">
      ${items.map((item) => `
        <article class="workspace-attention-item ${escapeHtml(item.severity || "info")}">
          <div>
            <strong>${escapeHtml(item.label || "Needs attention")}</strong>
            <p>${escapeHtml(item.detail || "Review this operational signal.")}</p>
          </div>
          <div class="workspace-row-actions">
            <span class="workspace-chip">${escapeHtml(statusText(item.severity || "info"))}</span>
            ${item.actionSection && item.actionPreset ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(item.actionSection)}" data-section-preset="${escapeHtml(item.actionPreset)}">
                ${escapeHtml(item.actionLabel || "Open")}
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderRecentProgramActivity(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No recent program activity is visible yet. New submissions, evidence, and teacher feedback will appear here.</div>`;
  return `
    <div class="workspace-list">
      ${rows.slice(0, 8).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${escapeHtml(row.title || "Capstone activity")}</p>
            <p class="workspace-muted">${escapeHtml(statusText(row.type || "activity"))} / ${escapeHtml(formatDate(row.occurredAt))}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(row.status || "updated")}
            ${row.studentId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(row.studentId)}">
                View detail
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderProgramBreakdown(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No program records are available for this school view.</div>`;
  return `
    <div class="workspace-program-breakdown">
      ${rows.map((row) => `
        <article class="workspace-program-row">
          <div>
            <strong>${escapeHtml(row.programName || "Program")}</strong>
            <span>${safeNumber(row.studentCount)} ${escapeHtml(pluralize(row.studentCount, "student"))}</span>
          </div>
          <span>${safeNumber(row.submitted)} submitted</span>
          <span>${safeNumber(row.revisionRequested)} revision</span>
          <span>${safeNumber(row.approved)} approved</span>
          <span>${safeNumber(row.noMentor)} no mentor</span>
          ${row.programId ? `
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="program" data-program-id="${escapeHtml(row.programId)}">
              View students
            </button>
          ` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function renderReviewQueueSummary(rows = [], options = {}) {
  if (!rows.length) return `<div class="workspace-empty">No submitted or revision-requested records need teacher review right now.</div>`;
  const allowStudentDetail = Boolean(options.allowStudentDetail && availableSectionIds().has("students"));
  return `
    <div class="workspace-list">
      ${rows.slice(0, 8).map((item) => {
        const studentId = item.studentId || item.student_id || "";
        const detailAction = allowStudentDetail && studentId
          ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(studentId)}">View student detail</button>`
          : "";
        return `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(item.studentName || item.student_name || "Student")}</strong>
              <p>${escapeHtml(item.requirementTitle || item.requirement_title || "Capstone Project submission")} / ${safeNumber(item.evidenceCount ?? item.evidence_count)} evidence</p>
            </div>
            <div class="workspace-row-actions">
              ${statusPill(item.status)}
              ${detailAction}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderMentorCoverage(rows = [], summary = {}) {
  const noMentor = safeNumber(summary.studentsNoMentor || summary.noMentor);
  return `
    <div class="workspace-list">
      ${noMentor ? `
        <article class="workspace-row">
          <div>
            <strong>Students without active mentors</strong>
            <p>${noMentor} ${escapeHtml(pluralize(noMentor, "student"))} need coverage.</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill("attention_required")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="missing-mentors">
              View students
            </button>
          </div>
        </article>
      ` : ""}
      ${rows.length ? rows.slice(0, 8).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${safeNumber(row.activeAssignments)} active ${escapeHtml(pluralize(row.activeAssignments, "assignment"))}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(safeNumber(row.activeAssignments) ? "active" : "no_active_assignments")}
            ${row.mentorId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="mentorAssignments" data-section-preset="mentor-workload" data-mentor-id="${escapeHtml(row.mentorId)}">
                View load
              </button>
            ` : ""}
          </div>
        </article>
      `).join("") : `<div class="workspace-empty">No mentor coverage records are available yet.</div>`}
    </div>
  `;
}

function renderStatusBreakdown(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No student status rows are available yet.</div>`;
  const canOpenStudents = availableSectionIds().has("students");
  return `
    <div class="workspace-list">
      ${rows.map((row) => {
        const status = normalizeStatus(row.status);
        const canFilter = canOpenStudents && SITE_STUDENT_STATUS_VALUES.has(status);
        return `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(statusText(status))}</strong>
              <p>${safeNumber(row.count)} ${escapeHtml(pluralize(row.count, "student"))}</p>
            </div>
            <div class="workspace-row-actions">
              ${statusPill(status)}
              ${canFilter ? `
                <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="status-breakdown" data-status-filter="${escapeHtml(status)}">
                  View students
                </button>
              ` : `<span class="workspace-summary-badge">Summary only</span>`}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderSnapshotRows(rows = [], type = "") {
  if (!rows.length) return `<div class="workspace-empty">No status rows are available yet.</div>`;
  return `
    <div class="workspace-list">
      ${rows.map((row) => renderSnapshotRow(row, type)).join("")}
    </div>
  `;
}

function renderSnapshotRow(row = {}, type = "") {
  const action = snapshotRowAction(row, type);
  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(statusText(row.status))}</strong>
        <p>${safeNumber(row.count)} ${escapeHtml(pluralize(row.count, "record"))}</p>
      </div>
      <div class="workspace-row-actions">
        ${statusPill(row.status)}
        ${action || `<span class="workspace-summary-badge">Summary only</span>`}
      </div>
    </article>
  `;
}

function snapshotRowAction(row = {}, type = "") {
  const status = normalizeStatus(row.status);
  if (type === "presentation" && ["scheduled", "completed"].includes(status)) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="presentation-snapshot" data-presentation-status="${escapeHtml(status)}">
        Review rows
      </button>
    `;
  }
  if (type === "archive" && ["queued", "running", "complete", "failed", "expired", "expiring_soon", "provider_unavailable"].includes(status)) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="archive-snapshot" data-archive-status="${escapeHtml(status)}">
        Review rows
      </button>
    `;
  }
  return "";
}

function renderAuditSummary(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No recent audit rows are available for this view.</div>`;
  return `
    <div class="workspace-list">
      ${rows.slice(0, 8).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(statusText(row.action))}</strong>
            <p>${escapeHtml(statusText(row.entityType))} / ${escapeHtml(row.actorDisplayName || "System")} / ${escapeHtml(formatDate(row.createdAt))}</p>
          </div>
          <span class="workspace-chip">Audit</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderScopedStudentList(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No students are currently visible for this school view.</div>`;
  return `
    <div class="workspace-list">
      ${rows.slice(0, 12).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${safeNumber(row.evidenceCount)} evidence / ${row.noMentor ? "mentor needed" : "mentor assigned"}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(row.submissionStatus || "not_started")}
            ${row.studentId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(row.studentId)}">
                View detail
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMentorStudentCards(rows = []) {
  return `
    <div class="workspace-list">
      ${rows.map((row) => {
        const attention = Array.isArray(row.needsAttention) ? row.needsAttention : [];
        const meetingStatus = row.mentorMeetingStatus || "not_recorded";
        const presentationStatus = row.presentationStatus || "not_scheduled";
        const outlineStatus = row.outlineStatus || "pending";
        return `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(row.studentName || "Student")}</strong>
              <div class="workspace-mentor-signal-grid" data-mentor-dashboard-signals="true">
                ${renderMentorDashboardSignal("Meeting", statusText(meetingStatus))}
                ${renderMentorDashboardSignal("Presentation", statusText(presentationStatus))}
                ${renderMentorDashboardSignal("Outline", statusText(outlineStatus))}
                ${renderMentorDashboardSignal("Evidence", `${safeNumber(row.evidenceCount)} item${safeNumber(row.evidenceCount) === 1 ? "" : "s"}`)}
              </div>
              <p class="workspace-muted" data-mentor-dashboard-next-step="true">${escapeHtml(mentorDashboardNextStep(row, attention))}</p>
              ${attention.length ? `<p class="workspace-muted">${escapeHtml(attention.map(statusText).join(", "))}</p>` : ""}
            </div>
            <div class="workspace-row-actions">
              ${statusPill(row.submissionStatus || "not_started")}
              ${row.studentId ? `
                <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(row.studentId)}">
                  Open meeting history
                </button>
                <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="open-student" data-mentor-dashboard-student-id="${escapeHtml(row.studentId)}">
                  View detail
                </button>
              ` : ""}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderMentorDashboardFilters(rows = [], activeFilter = "all") {
  const filters = [
    ["all", "All", rows.length],
    ["revision", "Needs revision", rows.filter(isMentorDashboardRevisionRow).length],
    ["meeting", "Meeting attention", rows.filter(isMentorDashboardMeetingRow).length],
    ["presentation", "Presentation follow-up", rows.filter(isMentorDashboardPresentationRow).length],
  ];
  return `
    <div class="workspace-filter-bar workspace-mentor-dashboard-filters" data-mentor-dashboard-filters="true" aria-label="Mentor dashboard filters">
      ${filters.map(([filter, label, count]) => `
        <button class="workspace-button ${activeFilter === filter ? "workspace-button-primary" : "workspace-button-secondary"}" type="button" data-mentor-dashboard-action="filter" data-mentor-dashboard-filter="${escapeHtml(filter)}" aria-pressed="${activeFilter === filter ? "true" : "false"}">
          ${escapeHtml(label)} (${safeNumber(count)})
        </button>
      `).join("")}
    </div>
  `;
}

function filterMentorDashboardStudents(rows = [], filter = "all") {
  const activeFilter = cleanMentorDashboardFilter(filter);
  if (activeFilter === "revision") return rows.filter(isMentorDashboardRevisionRow);
  if (activeFilter === "meeting") return rows.filter(isMentorDashboardMeetingRow);
  if (activeFilter === "presentation") return rows.filter(isMentorDashboardPresentationRow);
  return rows;
}

function cleanMentorDashboardFilter(value) {
  const filter = String(value || "").trim();
  return ["all", "revision", "meeting", "presentation"].includes(filter) ? filter : "all";
}

function isMentorDashboardRevisionRow(row = {}) {
  return row.submissionStatus === "revision_requested" || (Array.isArray(row.needsAttention) && row.needsAttention.includes("revision_requested"));
}

function isMentorDashboardMeetingRow(row = {}) {
  const status = row.mentorMeetingStatus || "not_recorded";
  return ["not_recorded", "missed", "makeup_required"].includes(status) || (Array.isArray(row.needsAttention) && row.needsAttention.includes("mentor_meeting"));
}

function isMentorDashboardPresentationRow(row = {}) {
  return row.presentationStatus === "not_scheduled"
    || row.outlineStatus !== "approved"
    || (Array.isArray(row.needsAttention) && row.needsAttention.includes("presentation"));
}

function mentorDashboardFilterKicker(filter = "all") {
  if (filter === "revision") return "Revision follow-up";
  if (filter === "meeting") return "Meeting attention";
  if (filter === "presentation") return "Presentation follow-up";
  return "Attention-needed assignments first";
}

function renderMentorDashboardFilterEmptyState(filter = "all") {
  const copy = {
    revision: {
      heading: "No assigned students need revision follow-up",
      reason: "No assigned student has a revision request in this mentor view.",
      nextAction: "Show all assigned students or keep monitoring meeting and presentation readiness.",
    },
    meeting: {
      heading: "No meeting follow-up is needed",
      reason: "Assigned students in this mentor view have no missed or make-up meeting signal right now.",
      nextAction: "Show all assigned students or review presentation readiness.",
    },
    presentation: {
      heading: "No presentation follow-up is needed",
      reason: "Assigned students in this mentor view do not have open outline or presentation readiness signals.",
      nextAction: "Show all assigned students or continue regular check-ins.",
    },
  }[filter] || {
    heading: "No assigned students match this filter",
    reason: "This mentor view has assigned students, but none match the selected focus.",
    nextAction: "Show all assigned students.",
  };
  return `
    <section class="workspace-empty-state-card" data-mentor-dashboard-state="filter-empty">
      <strong>${escapeHtml(copy.heading)}</strong>
      ${renderProblemState({
        reason: copy.reason,
        owner: "Assigned mentor.",
        nextAction: copy.nextAction,
      })}
      <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="filter" data-mentor-dashboard-filter="all">Show all assigned students</button>
    </section>
  `;
}

function prioritizeMentorDashboardStudents(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return [...safeRows].sort((left, right) => {
    const leftRank = mentorDashboardAttentionRank(left);
    const rightRank = mentorDashboardAttentionRank(right);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return String(left?.studentName || "").localeCompare(String(right?.studentName || ""));
  });
}

function mentorDashboardAttentionRank(row = {}) {
  const attention = Array.isArray(row.needsAttention) ? row.needsAttention : [];
  if (attention.includes("revision_requested") || row.submissionStatus === "revision_requested") return 0;
  if (attention.includes("mentor_meeting")) return 1;
  if (attention.includes("presentation") || row.presentationStatus === "not_scheduled" || row.outlineStatus !== "approved") return 2;
  return 3;
}

function renderMentorDashboardSignal(label, value) {
  return `
    <span>
      <strong>${escapeHtml(label)}</strong>
      ${escapeHtml(String(value || "Not available"))}
    </span>
  `;
}

function mentorDashboardNextStep(row = {}, attention = []) {
  if (attention.includes("mentor_meeting")) {
    return "Update the mentor meeting plan or make-up status before the next check-in.";
  }
  if (attention.includes("presentation")) {
    return "Check outline and presentation readiness with this student.";
  }
  if (row.submissionStatus === "revision_requested") {
    return "Review the revision request before the next mentor check-in.";
  }
  return "Keep monitoring progress and open detail when you need more context.";
}

function safeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function cleanDirectoryFilter(value) {
  return String(value || "").trim().slice(0, 100);
}

function clampDirectoryNumber(value, defaultValue, min, max) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, min), max);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return safeNumber(count) === 1 ? singular : plural;
}

function renderSubmissionRow(submission, feedback = []) {
  const latestFeedback = latestFeedbackForSubmission(submission, feedback);
  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(submission.requirement_title || "Capstone Project submission")}</strong>
        <p>Version ${escapeHtml(submission.version || 1)}. Updated ${escapeHtml(formatDate(submission.updated_at))}.</p>
        ${latestFeedback ? `<p class="workspace-muted" data-submission-feedback="true">Latest teacher feedback: ${escapeHtml(latestFeedback.message || "Teacher feedback was recorded for this submission.")}</p>` : ""}
      </div>
      ${statusPill(submission.status)}
    </article>
  `;
}

function latestFeedbackForSubmission(submission, feedback = []) {
  const submissionId = String(submission?.id || "");
  if (!submissionId || !Array.isArray(feedback)) return null;
  return feedback.find((item) => item?.submissionId === submissionId) || null;
}

function renderEvidenceRow(item) {
  const actions = [];
  if (item.source_kind === "google_drive_file" && item.downloadUrl) {
    actions.push(`<a class="workspace-link-button workspace-link-button-small" data-evidence-download="file" href="${escapeHtml(item.downloadUrl)}">Download file</a>`);
  }
  if (item.source_kind === "external_link" && item.externalUrl) {
    actions.push(`<a class="workspace-link-button workspace-link-button-small" data-evidence-link="external" href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noreferrer">Open link</a>`);
  }

  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(item.title || "Evidence")}</strong>
        <p>${escapeHtml(evidenceSourceLabel(item.source_kind))} / ${escapeHtml(statusText(item.artifact_type || "evidence"))}</p>
      </div>
      <div class="workspace-row-actions">
        ${actions.join("")}
        ${statusPill(item.review_status || "pending_review")}
      </div>
    </article>
  `;
}

function evidenceSourceLabel(value) {
  if (value === "google_drive_file") return "Uploaded file";
  if (value === "external_link") return "Linked work";
  if (value === "generated_export") return "Exported package";
  return "Evidence";
}

function statusPill(status) {
  const normalized = normalizeStatus(status);
  const statusClass = statusClassFor(status);
  return `<span class="workspace-status-pill ${escapeHtml(statusClass)}" data-status="${escapeHtml(normalized)}">${escapeHtml(statusText(status))}</span>`;
}

function statusClassFor(status) {
  const normalized = normalizeStatus(status);
  return STATUS_CLASS_BY_STATUS[normalized] || normalized;
}

function statusText(value) {
  const normalized = normalizeStatus(value);
  return STATUS_LABELS[normalized] || String(value || "Unknown").replace(/_/g, " ");
}

function archiveProviderStatusText(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "ready") return "Storage ready";
  if (normalized === "drive_config_missing" || normalized === "drive_credentials_missing") return "Storage setup needed";
  if (normalized === "drive_token_exchange_failed" || normalized === "drive_provider_error" || normalized === "drive_access_denied") return "Storage unavailable";
  return "Storage status not available";
}

function storyLabel(value) {
  const labels = {
    model_excellent: "Model excellent",
    missing_mentor: "Missing mentor",
    awaiting_review: "Awaiting review",
    revision_requested: "Revision requested",
    presentation_pending: "Presentation pending",
    archive_ready: "Archive ready",
    archive_failed: "Archive failed",
    high_risk: "High risk",
    rich_timeline: "Rich timeline",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || statusText(value);
}

function riskLabel(value) {
  const labels = {
    any: "Any risk",
    high: "High risk",
    medium: "Medium risk",
    low: "Low risk",
    stale: "Stale activity",
    no_mentor: "No mentor",
    awaiting_review: "Awaiting review",
    revision_requested: "Revision requested",
    presentation_pending: "Presentation pending",
    archive_failed: "Archive failed",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || statusText(value);
}

function evidenceStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "attached") return "Evidence attached";
  if (normalized === "missing") return "Evidence missing";
  return statusText(value || "Any evidence status");
}

function reviewStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "needs_review") return "Needs review";
  if (normalized === "needs_revision") return "Needs revision";
  if (normalized === "approved") return "Approved";
  if (normalized === "reviewed") return "Reviewed";
  if (normalized === "not_reviewed") return "Not reviewed";
  return statusText(value || "Any review status");
}

function progressStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "on_track") return "On track";
  if (normalized === "behind") return "Behind / needs support";
  if (normalized === "missing_mentor") return "Missing mentor";
  if (normalized === "missing_evidence") return "Missing evidence";
  if (normalized === "needs_review") return "Needs review";
  if (normalized === "needs_revision") return "Needs revision";
  if (normalized === "ready_complete") return "Ready / complete";
  return statusText(value || "Any progress");
}

function categoryLabel(value) {
  const labels = {
    archive: "Archive",
    risk: "Risk",
    mentor: "Mentor coverage",
    review: "Review",
    presentation: "Presentation",
    completion: "Completion",
    evidence: "Evidence",
    readiness: "Readiness",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || statusText(value);
}

function normalizeStatus(value) {
  return String(value || "unknown").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "unknown";
}

const ROLE_LABELS = {
  platform_admin: "Global Admin",
  global_admin: "Global Admin",
  admin: "Global Admin",
  org_admin: "Organization Admin",
  site_admin: "Site Admin",
  administration: "Administration",
  program_teacher: "Program Teacher",
  mentor: "Mentor",
  viewer: "Viewer",
  student: "Student",
  misc_admin: "Legacy Reporting Admin",
  role_pending: "Role pending",
};

function roleLabel(roleId) {
  return ROLE_LABELS[roleId] || statusText(roleId);
}

function roleIds(user) {
  return new Set((user?.roles || []).map((role) => role.role_id));
}

function hasGlobalAdminRole(roles) {
  return roles.has("global_admin") || roles.has("admin") || roles.has("platform_admin");
}

function canUseUsersAccess(roles) {
  return hasGlobalAdminRole(roles) || roles.has("site_admin");
}

function hasSiteDashboardRole(roles) {
  return ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration"].some((role) => roles.has(role));
}

function hasSiteStudentDirectoryRole(roles) {
  return ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration", "viewer", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteReviewQueueRole(roles) {
  return ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteMentorAssignmentRole(roles) {
  return ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteOperationsRole(roles) {
  return ["platform_admin", "global_admin", "admin", "org_admin", "site_admin", "administration", "program_teacher"].some((role) => roles.has(role));
}

function defaultSiteStudentFilters() {
  return {
    search: "",
    programId: "",
    status: "",
    progressStatus: "",
    evidenceStatus: "",
    reviewStatus: "",
    noMentor: false,
    risk: "any",
    story: "",
    presentationStatus: "any",
    archiveStatus: "any",
    limit: 50,
    offset: 0,
  };
}

function defaultMentorAssignmentFilters() {
  return {
    programId: "",
    mentorUserId: "",
    studentSearch: "",
    status: "",
    noMentor: false,
    limit: 50,
    offset: 0,
  };
}

function defaultReviewQueueFilters() {
  return {
    status: "",
    programId: "",
    search: "",
    story: "",
    risk: "any",
    evidenceStatus: "",
    limit: 50,
    offset: 0,
  };
}

function defaultOperationsReadinessFilters() {
  return {
    studentId: "",
    programId: "",
    status: "",
    story: "",
    risk: "any",
    presentationStatus: "",
    archiveStatus: "",
    readiness: "",
    category: "",
    needsAttention: false,
    outlineAttention: false,
    limit: 50,
    offset: 0,
  };
}

function defaultSiteStudentDetailState() {
  return {
    studentId: "",
    sourceSection: "students",
    activeTab: "summary",
    loading: false,
    loadingTimeline: false,
    timelineType: "",
    result: null,
    timelineResult: null,
  };
}

function defaultStudentRequirementDetailState() {
  return {
    selectedRequirementId: "",
  };
}

function defaultStudentFeedbackHistoryState() {
  return {
    selectedSubmissionId: "",
    loading: false,
    result: null,
  };
}

function defaultReviewQueueState() {
  return {
    selectedSubmissionId: "",
    historyResult: null,
    loadingHistory: false,
    decisionResult: null,
    selectionNotice: "",
  };
}

function initializeWorkspaceUrlState() {
  applyWorkspaceUrlState(workspaceUrlStateFromLocation(), { initial: true });
}

function bindWorkspaceUrlEvents() {
  if (typeof window === "undefined" || !window.addEventListener) return;
  window.addEventListener("popstate", () => {
    handleWorkspaceUrlPopState();
  });
}

async function handleWorkspaceUrlPopState() {
  const state = workspaceUrlStateFromLocation();
  applyWorkspaceUrlState(state);
  const roles = roleIds(currentUser);
  if (state.hasReviewQueueState && currentUser && hasSiteReviewQueueRole(roles)) {
    await loadReviewQueueResult("Review queue link restored.", { syncUrl: false });
    return;
  }
  if (state.hasSiteStudentState && currentUser && hasSiteStudentDirectoryRole(roles)) {
    siteStudentDetailState = defaultSiteStudentDetailState();
    await loadWorkspaceData("Student directory link restored.");
    return;
  }
  if (state.hasMentorAssignmentState && currentUser && hasSiteMentorAssignmentRole(roles)) {
    await loadMentorAssignmentsResult("Mentor assignment link restored.");
    return;
  }
  if (state.hasOperationsReadinessState && currentUser && hasSiteOperationsRole(roles)) {
    await loadOperationsReadinessResult("Operations readiness link restored.");
    return;
  }
  renderAppShell();
}

function applyWorkspaceUrlState(state, options = {}) {
  if (!state) return;
  if (state.siteId) selectedSiteId = state.siteId;
  if (state.section && (options.initial || availableSectionIds().has(state.section))) {
    activeSection = state.section;
  }
  if (state.hasReviewQueueState) {
    reviewQueueFilters = state.reviewQueueFilters;
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId: state.reviewQueueSelectedSubmissionId,
    };
    if (!state.section) activeSection = "teacher";
  }
  if (state.hasSiteStudentState) {
    siteStudentFilters = state.siteStudentFilters;
    siteStudentDetailState = defaultSiteStudentDetailState();
    if (!state.section) activeSection = "students";
  }
  if (state.hasMentorAssignmentState) {
    mentorAssignmentFilters = state.mentorAssignmentFilters;
    if (!state.section) activeSection = "mentorAssignments";
  }
  if (state.hasOperationsReadinessState) {
    operationsReadinessFilters = state.operationsReadinessFilters;
    if (!state.section) activeSection = "operations";
  }
}

function workspaceUrlStateFromLocation() {
  const url = currentWorkspaceUrl();
  if (!url) return null;
  const params = url.searchParams;
  const requestedSection = cleanWorkspaceSection(params.get("section"));
  const requestedView = cleanDirectoryFilter(params.get("view"));
  const reviewQueueViewRequested = requestedSection === "teacher" || requestedView === "reviewQueue" || requestedView === "review-queue";
  const studentDirectoryViewRequested = requestedSection === "students" || requestedView === "students" || requestedView === "studentDirectory" || requestedView === "student-directory";
  const mentorAssignmentsViewRequested = requestedSection === "mentorAssignments" || requestedView === "mentorAssignments" || requestedView === "mentor-assignments";
  const operationsReadinessViewRequested = requestedSection === "operations" || requestedView === "operations" || requestedView === "operationsReadiness" || requestedView === "operations-readiness";
  const hasReviewQueueState = reviewQueueViewRequested || (!requestedSection && !requestedView && hasReviewQueueFilterParams(params));
  const hasSiteStudentState = studentDirectoryViewRequested;
  const hasMentorAssignmentState = mentorAssignmentsViewRequested;
  const hasOperationsReadinessState = operationsReadinessViewRequested;
  return {
    section: reviewQueueViewRequested
      ? "teacher"
      : studentDirectoryViewRequested
        ? "students"
        : mentorAssignmentsViewRequested
          ? "mentorAssignments"
          : operationsReadinessViewRequested
            ? "operations"
            : requestedSection,
    siteId: cleanDirectoryFilter(params.get("siteId")),
    hasReviewQueueState,
    reviewQueueFilters: hasReviewQueueState ? reviewQueueFiltersFromSearchParams(params) : defaultReviewQueueFilters(),
    reviewQueueSelectedSubmissionId: hasReviewQueueState ? reviewQueueSelectionFromSearchParams(params) : "",
    hasSiteStudentState,
    siteStudentFilters: hasSiteStudentState ? siteStudentFiltersFromSearchParams(params) : defaultSiteStudentFilters(),
    hasMentorAssignmentState,
    mentorAssignmentFilters: hasMentorAssignmentState ? mentorAssignmentFiltersFromSearchParams(params) : defaultMentorAssignmentFilters(),
    hasOperationsReadinessState,
    operationsReadinessFilters: hasOperationsReadinessState ? operationsReadinessFiltersFromSearchParams(params) : defaultOperationsReadinessFilters(),
  };
}

function currentWorkspaceUrl() {
  if (typeof window === "undefined" || !window.location?.href) return null;
  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

function hasReviewQueueFilterParams(params) {
  return [
    "status",
    "reviewStatus",
    "submissionStatus",
    "programId",
    "search",
    "story",
    "risk",
    "evidenceStatus",
    "limit",
    "offset",
    "submissionId",
    "needsReview",
    "unassigned",
    "overdue",
  ].some((param) => params.has(param));
}

function reviewQueueFiltersFromSearchParams(params) {
  const filters = defaultReviewQueueFilters();
  const rawStatus = params.get("status") || params.get("reviewStatus") || params.get("submissionStatus");
  filters.status = canonicalReviewQueueValue(rawStatus, REVIEW_QUEUE_STATUS_VALUES);
  if (!filters.status && booleanQueryValue(params.get("needsReview"))) filters.status = "submitted";
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.search = cleanSearchFilter(params.get("search"));
  filters.story = canonicalReviewQueueValue(params.get("story"), REVIEW_QUEUE_STORY_VALUES);
  filters.risk = canonicalReviewQueueValue(params.get("risk"), REVIEW_QUEUE_RISK_VALUES, "any");
  filters.evidenceStatus = canonicalReviewQueueValue(params.get("evidenceStatus"), REVIEW_QUEUE_EVIDENCE_STATUS_VALUES);
  if (booleanQueryValue(params.get("unassigned"))) filters.risk = "no_mentor";
  if (booleanQueryValue(params.get("overdue"))) filters.risk = "stale";
  filters.limit = clampDirectoryNumber(params.get("limit"), 50, 1, 100);
  filters.offset = clampDirectoryNumber(params.get("offset"), 0, 0, 100000);
  return filters;
}

function reviewQueueSelectionFromSearchParams(params) {
  return cleanDirectoryFilter(params.get("submissionId"));
}

function siteStudentFiltersFromSearchParams(params) {
  const filters = defaultSiteStudentFilters();
  filters.search = cleanSearchFilter(params.get("search"));
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.status = canonicalReviewQueueValue(params.get("status"), SITE_STUDENT_STATUS_VALUES);
  filters.progressStatus = canonicalReviewQueueValue(params.get("progressStatus"), SITE_STUDENT_PROGRESS_STATUS_VALUES);
  filters.evidenceStatus = canonicalReviewQueueValue(params.get("evidenceStatus"), SITE_STUDENT_EVIDENCE_STATUS_VALUES);
  filters.reviewStatus = canonicalReviewQueueValue(params.get("reviewStatus"), SITE_STUDENT_REVIEW_STATUS_VALUES);
  filters.noMentor = booleanQueryValue(params.get("noMentor"));
  filters.risk = canonicalReviewQueueValue(params.get("risk"), SITE_STUDENT_RISK_VALUES, "any");
  filters.story = canonicalReviewQueueValue(params.get("story"), REVIEW_QUEUE_STORY_VALUES);
  filters.presentationStatus = canonicalReviewQueueValue(params.get("presentationStatus"), SITE_STUDENT_PRESENTATION_STATUS_VALUES, "any");
  filters.archiveStatus = canonicalReviewQueueValue(params.get("archiveStatus"), SITE_STUDENT_ARCHIVE_STATUS_VALUES, "any");
  filters.limit = clampDirectoryNumber(params.get("limit"), 50, 1, 100);
  filters.offset = clampDirectoryNumber(params.get("offset"), 0, 0, 100000);
  return filters;
}

function mentorAssignmentFiltersFromSearchParams(params) {
  const filters = defaultMentorAssignmentFilters();
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.mentorUserId = cleanDirectoryFilter(params.get("mentorUserId"));
  filters.studentSearch = cleanSearchFilter(params.get("studentSearch"));
  filters.noMentor = booleanQueryValue(params.get("noMentor"));
  filters.status = filters.noMentor
    ? "unassigned"
    : canonicalReviewQueueValue(params.get("status"), MENTOR_ASSIGNMENT_STATUS_VALUES);
  filters.limit = clampDirectoryNumber(params.get("limit"), 50, 1, 100);
  filters.offset = clampDirectoryNumber(params.get("offset"), 0, 0, 100000);
  return filters;
}

function operationsReadinessFiltersFromSearchParams(params) {
  const filters = defaultOperationsReadinessFilters();
  filters.studentId = cleanDirectoryFilter(params.get("studentId"));
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.status = canonicalReviewQueueValue(params.get("status"), OPERATIONS_STUDENT_STATUS_VALUES);
  filters.story = canonicalReviewQueueValue(params.get("story"), REVIEW_QUEUE_STORY_VALUES);
  filters.risk = canonicalReviewQueueValue(params.get("risk"), OPERATIONS_RISK_VALUES, "any");
  filters.presentationStatus = canonicalReviewQueueValue(params.get("presentationStatus"), OPERATIONS_PRESENTATION_STATUS_VALUES);
  filters.archiveStatus = canonicalReviewQueueValue(params.get("archiveStatus"), OPERATIONS_ARCHIVE_STATUS_VALUES);
  filters.readiness = canonicalReviewQueueValue(params.get("readiness"), OPERATIONS_READINESS_VALUES);
  filters.category = canonicalReviewQueueValue(params.get("category"), OPERATIONS_CATEGORY_VALUES);
  filters.needsAttention = booleanQueryValue(params.get("needsAttention"));
  filters.outlineAttention = booleanQueryValue(params.get("outlineAttention"));
  filters.limit = clampDirectoryNumber(params.get("limit"), 50, 1, 100);
  filters.offset = clampDirectoryNumber(params.get("offset"), 0, 0, 100000);
  return filters;
}

function syncReviewQueueUrlState(options = {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  const filters = reviewQueueFilters || defaultReviewQueueFilters();
  for (const param of WORKLIST_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  url.searchParams.set("section", "teacher");
  const siteId = selectedSiteQueryValue() || unwrap(currentData.reviewQueue)?.scope?.siteId || "";
  if (siteId) url.searchParams.set("siteId", siteId);
  if (!options.clearFilters) {
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.programId) url.searchParams.set("programId", filters.programId);
    if (filters.search) url.searchParams.set("search", filters.search);
    if (filters.story) url.searchParams.set("story", filters.story);
    if (filters.risk && filters.risk !== "any") url.searchParams.set("risk", filters.risk);
    if (filters.evidenceStatus) url.searchParams.set("evidenceStatus", filters.evidenceStatus);
    if (reviewQueueState.selectedSubmissionId) url.searchParams.set("submissionId", reviewQueueState.selectedSubmissionId);
    if (safeNumber(filters.limit) !== 50) url.searchParams.set("limit", String(filters.limit));
    if (safeNumber(filters.offset) > 0) url.searchParams.set("offset", String(filters.offset));
  }
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentPath = `${window.location.pathname || url.pathname}${window.location.search || ""}${window.location.hash || ""}`;
  if (nextUrl === currentPath) return;
  const method = options.replace ? "replaceState" : "pushState";
  window.history[method]?.({ section: "teacher" }, "", nextUrl);
}

function syncCurrentWorkspaceUrlState(options = {}) {
  if (activeSection === "teacher") {
    syncReviewQueueUrlState(options);
    return;
  }
  if (activeSection === "students") {
    syncSiteStudentUrlState(options);
    return;
  }
  if (activeSection === "mentorAssignments") {
    syncMentorAssignmentUrlState(options);
    return;
  }
  if (activeSection === "operations") {
    syncOperationsReadinessUrlState(options);
    return;
  }
  syncWorkspaceSectionOnlyUrlState(activeSection, options);
}

function syncSiteStudentUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("students", siteStudentFilters || defaultSiteStudentFilters(), options, (url, filters) => {
    if (filters.search) url.searchParams.set("search", filters.search);
    if (filters.programId) url.searchParams.set("programId", filters.programId);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.progressStatus) url.searchParams.set("progressStatus", filters.progressStatus);
    if (filters.evidenceStatus) url.searchParams.set("evidenceStatus", filters.evidenceStatus);
    if (filters.reviewStatus) url.searchParams.set("reviewStatus", filters.reviewStatus);
    if (filters.noMentor) url.searchParams.set("noMentor", "true");
    if (filters.risk && filters.risk !== "any") url.searchParams.set("risk", filters.risk);
    if (filters.story) url.searchParams.set("story", filters.story);
    if (filters.presentationStatus && filters.presentationStatus !== "any") url.searchParams.set("presentationStatus", filters.presentationStatus);
    if (filters.archiveStatus && filters.archiveStatus !== "any") url.searchParams.set("archiveStatus", filters.archiveStatus);
    if (safeNumber(filters.limit) !== 50) url.searchParams.set("limit", String(filters.limit));
    if (safeNumber(filters.offset) > 0) url.searchParams.set("offset", String(filters.offset));
  });
}

function syncMentorAssignmentUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("mentorAssignments", mentorAssignmentFilters || defaultMentorAssignmentFilters(), options, (url, filters) => {
    if (filters.programId) url.searchParams.set("programId", filters.programId);
    if (filters.mentorUserId) url.searchParams.set("mentorUserId", filters.mentorUserId);
    if (filters.studentSearch) url.searchParams.set("studentSearch", filters.studentSearch);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.noMentor) url.searchParams.set("noMentor", "true");
    if (safeNumber(filters.limit) !== 50) url.searchParams.set("limit", String(filters.limit));
    if (safeNumber(filters.offset) > 0) url.searchParams.set("offset", String(filters.offset));
  });
}

function syncOperationsReadinessUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("operations", operationsReadinessFilters || defaultOperationsReadinessFilters(), options, (url, filters) => {
    if (filters.studentId) url.searchParams.set("studentId", filters.studentId);
    if (filters.programId) url.searchParams.set("programId", filters.programId);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.story) url.searchParams.set("story", filters.story);
    if (filters.risk && filters.risk !== "any") url.searchParams.set("risk", filters.risk);
    if (filters.presentationStatus) url.searchParams.set("presentationStatus", filters.presentationStatus);
    if (filters.archiveStatus) url.searchParams.set("archiveStatus", filters.archiveStatus);
    if (filters.readiness) url.searchParams.set("readiness", filters.readiness);
    if (filters.category) url.searchParams.set("category", filters.category);
    if (filters.needsAttention) url.searchParams.set("needsAttention", "true");
    if (filters.outlineAttention) url.searchParams.set("outlineAttention", "true");
    if (safeNumber(filters.limit) !== 50) url.searchParams.set("limit", String(filters.limit));
    if (safeNumber(filters.offset) > 0) url.searchParams.set("offset", String(filters.offset));
  });
}

function syncFilteredWorkspaceUrlState(section, filters, options = {}, writeFilters = () => {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  for (const param of WORKLIST_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  url.searchParams.set("section", section);
  const siteId = selectedSiteQueryValue()
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || "";
  if (siteId) url.searchParams.set("siteId", siteId);
  if (!options.clearFilters) writeFilters(url, filters || {});
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentPath = `${window.location.pathname || url.pathname}${window.location.search || ""}${window.location.hash || ""}`;
  if (nextUrl === currentPath) return;
  const method = options.replace ? "replaceState" : "pushState";
  window.history[method]?.({ section }, "", nextUrl);
}

function syncWorkspaceSectionOnlyUrlState(section, options = {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  for (const param of WORKLIST_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  const sectionId = cleanWorkspaceSection(section) || "overview";
  url.searchParams.set("section", sectionId);
  const siteId = selectedSiteQueryValue();
  if (siteId) url.searchParams.set("siteId", siteId);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentPath = `${window.location.pathname || url.pathname}${window.location.search || ""}${window.location.hash || ""}`;
  if (nextUrl === currentPath) return;
  const method = options.replace ? "replaceState" : "pushState";
  window.history[method]?.({ section: sectionId }, "", nextUrl);
}

function cleanWorkspaceSection(value) {
  const section = cleanDirectoryFilter(value);
  return WORKSPACE_SECTION_IDS.has(section) ? section : "";
}

function availableSectionIds() {
  return new Set(availableSections().map((section) => section.id));
}

function canonicalReviewQueueValue(value, allowed, fallback = "") {
  const cleaned = cleanDirectoryFilter(value);
  return allowed.has(cleaned) ? cleaned : fallback;
}

function booleanQueryValue(value) {
  return ["1", "true", "yes", "y"].includes(String(value || "").trim().toLowerCase());
}

function cleanSearchFilter(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function selectedSiteQueryValue() {
  return cleanDirectoryFilter(selectedSiteId);
}

function siteDashboardQueryString() {
  const params = new URLSearchParams();
  const siteId = selectedSiteQueryValue();
  if (siteId) params.set("siteId", siteId);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function siteStudentQueryString() {
  const params = new URLSearchParams();
  const filters = siteStudentFilters || defaultSiteStudentFilters();
  const siteId = selectedSiteQueryValue();
  if (siteId) params.set("siteId", siteId);
  if (filters.search) params.set("search", filters.search);
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.status) params.set("status", filters.status);
  if (filters.progressStatus) params.set("progressStatus", filters.progressStatus);
  if (filters.evidenceStatus) params.set("evidenceStatus", filters.evidenceStatus);
  if (filters.reviewStatus) params.set("reviewStatus", filters.reviewStatus);
  if (filters.noMentor) params.set("noMentor", "true");
  if (filters.risk && filters.risk !== "any") params.set("risk", filters.risk);
  if (filters.story) params.set("story", filters.story);
  if (filters.presentationStatus && filters.presentationStatus !== "any") params.set("presentationStatus", filters.presentationStatus);
  if (filters.archiveStatus && filters.archiveStatus !== "any") params.set("archiveStatus", filters.archiveStatus);
  if (safeNumber(filters.limit) !== 50) params.set("limit", String(filters.limit));
  if (safeNumber(filters.offset) > 0) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function siteReviewQueueQueryString() {
  const params = new URLSearchParams();
  const filters = reviewQueueFilters || defaultReviewQueueFilters();
  const siteId = selectedSiteQueryValue() || unwrap(currentData.reviewQueue)?.scope?.siteId || "";
  if (siteId) params.set("siteId", siteId);
  if (filters.status) params.set("status", filters.status);
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.search) params.set("search", filters.search);
  if (filters.story) params.set("story", filters.story);
  if (filters.risk && filters.risk !== "any") params.set("risk", filters.risk);
  if (filters.evidenceStatus) params.set("evidenceStatus", filters.evidenceStatus);
  if (safeNumber(filters.limit) !== 50) params.set("limit", String(filters.limit));
  if (safeNumber(filters.offset) > 0) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function siteMentorAssignmentQueryString() {
  const params = new URLSearchParams();
  const filters = mentorAssignmentFilters || defaultMentorAssignmentFilters();
  const siteId = selectedSiteQueryValue()
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || "";
  if (siteId) params.set("siteId", siteId);
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.mentorUserId) params.set("mentorUserId", filters.mentorUserId);
  if (filters.studentSearch) params.set("studentSearch", filters.studentSearch);
  if (filters.status) params.set("status", filters.status);
  if (filters.noMentor) params.set("noMentor", "true");
  if (safeNumber(filters.limit) !== 50) params.set("limit", String(filters.limit));
  if (safeNumber(filters.offset) > 0) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function siteOperationsReadinessQueryString() {
  const params = new URLSearchParams();
  const filters = operationsReadinessFilters || defaultOperationsReadinessFilters();
  const siteId = selectedSiteQueryValue()
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || "";
  if (siteId) params.set("siteId", siteId);
  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.status) params.set("status", filters.status);
  if (filters.story) params.set("story", filters.story);
  if (filters.risk && filters.risk !== "any") params.set("risk", filters.risk);
  if (filters.presentationStatus) params.set("presentationStatus", filters.presentationStatus);
  if (filters.archiveStatus) params.set("archiveStatus", filters.archiveStatus);
  if (filters.readiness) params.set("readiness", filters.readiness);
  if (filters.category) params.set("category", filters.category);
  if (filters.needsAttention) params.set("needsAttention", "true");
  if (filters.outlineAttention) params.set("outlineAttention", "true");
  if (safeNumber(filters.limit) !== 50) params.set("limit", String(filters.limit));
  if (safeNumber(filters.offset) > 0) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function primaryRoleForUser(user) {
  const roles = roleIds(user);
  for (const role of [
    "global_admin",
    "platform_admin",
    "admin",
    "org_admin",
    "site_admin",
    "administration",
    "program_teacher",
    "mentor",
    "viewer",
    "student",
    "misc_admin",
  ]) {
    if (roles.has(role)) return role;
  }
  return "role_pending";
}

function roleScopeSummary(user) {
  const primary = primaryRoleForUser(user);
  if (primary === "role_pending") return "Awaiting workspace role";
  const role = (user?.roles || []).find((assignment) => assignment.role_id === primary);
  if (!role) return "Assigned workspace";
  return assignmentScopeLabel(role);
}

function assignmentScopeLabel(role) {
  const roleId = String(role?.role_id || "");
  const scopeType = normalizeStatus(role?.scope_type || "global");
  const scopeId = String(role?.scope_id || "").trim();
  const siteName = siteNameForAssignment(role);
  const tenantName = tenantNameForWorkspace();

  if (roleId === "student") return "Own student workspace";
  if (roleId === "mentor") return "Assigned students";
  if (roleId === "viewer") return "Assigned students";
  if (roleId === "misc_admin") return "Legacy readiness reporting";
  if (roleId === "global_admin" || roleId === "admin" || roleId === "platform_admin") return "Entire platform";

  if (scopeType === "site") {
    return siteName ? `Assigned school: ${siteName}` : "Assigned school";
  }
  if (scopeType === "tenant") {
    return tenantName ? `Assigned organization: ${tenantName}` : "Assigned organization";
  }
  if (scopeType === "program") {
    const label = scopeIdDisplay(scopeId);
    return label ? `Assigned program: ${label}` : "Assigned program";
  }
  if (scopeType === "cohort") {
    const label = scopeIdDisplay(scopeId);
    return label ? `Assigned cohort: ${label}` : "Assigned cohort";
  }
  if (scopeType === "reporting") return "Readiness reporting";
  if (scopeType === "global") {
    if (roleId === "program_teacher") return "Assigned programs";
    return "All assigned records";
  }
  return "Assigned workspace";
}

function siteNameForAssignment(role) {
  const siteId = String(role?.scope_id || "").trim();
  const sites = accessibleSitesForWorkspace();
  const match = siteId ? sites.find((site) => site.siteId === siteId) : null;
  if (match?.siteName) return match.siteName;
  const context = currentSiteWorkspaceContext();
  if (context.siteName && (!siteId || context.siteId === siteId)) return context.siteName;
  return "";
}

function tenantNameForWorkspace() {
  return currentSiteWorkspaceContext()?.tenantName || "";
}

function scopeIdDisplay(scopeId) {
  const value = String(scopeId || "").trim();
  if (!value) return "";
  if (/^[a-z]{2,4}$/i.test(value)) return value.toUpperCase();
  return statusText(value);
}

function authConfigForUi() {
  const config = unwrap(currentData.authConfig) || {};
  return {
    authMode: config.authMode || "hardened_username_password",
    googleSsoEnabled: Boolean(config.googleSsoEnabled),
    googleSsoConfigured: Boolean(config.googleSsoConfigured),
    localLoginEnabled: config.localLoginEnabled !== false,
    googleWorkspaceLabel: config.googleWorkspaceLabel || "Use your school Google Workspace account.",
  };
}

function authErrorMessageFromLocation() {
  if (typeof window === "undefined" || !window.location?.href) {
    return { message: "", tone: "neutral" };
  }
  const code = new URL(window.location.href).searchParams.get("authError");
  return code ? { message: messageForSsoError(code), tone: "error" } : { message: "", tone: "neutral" };
}

function roleChips(user) {
  const roles = user?.roles || [];
  if (!roles.length) return `<span class="workspace-chip">Role pending</span>`;
  return roles.map((role) => {
    return `<span class="workspace-chip workspace-role-chip" data-role-id="${escapeHtml(role.role_id)}">${escapeHtml(roleLabel(role.role_id))} / ${escapeHtml(assignmentScopeLabel(role))}</span>`;
  }).join("");
}

function scopeLabel(role) {
  if (!role) return "global";
  return role.scopeId ? `${role.scopeType || "global"}:${role.scopeId}` : role.scopeType || "global";
}

function updateAdminImportScopeFields() {
  const form = document.querySelector("#workspaceAdminImportForm");
  const roleSelect = form?.querySelector?.('[name="roleId"]');
  const identitySelect = form?.querySelector?.('[name="identityType"]');
  if (!roleSelect || !identitySelect) return;

  const roleId = roleSelect.value;
  const showSite = roleId === "administration" || roleId === "site_admin";
  const showProgram = roleId === "program_teacher";
  const showStudent = roleId === "mentor" || roleId === "viewer";
  const showGlobal = roleId === "global_admin";

  form.querySelectorAll("[data-access-group]").forEach((element) => {
    const group = element.dataset.accessGroup;
    const visible = (group === "site" && showSite)
      || (group === "program" && showProgram)
      || (group === "student" && showStudent)
      || (group === "global-confirmation" && showGlobal);
    element.hidden = !visible;
    element.querySelectorAll("select, input, textarea").forEach((input) => {
      input.disabled = !visible;
      if (!visible && input.type === "checkbox") input.checked = false;
    });
  });

  if (showGlobal) identitySelect.value = "local";
  identitySelect.querySelector('option[value="sso"]')?.toggleAttribute("disabled", showGlobal);
  renderAdminAccessPreview(form);
}

function buildAdminImportBody(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const adminNote = String(values.adminNote || "").trim();
  const email = String(values.email || "").trim();
  const fullName = String(values.fullName || "").trim();
  const roleId = String(values.roleId || "").trim();
  const identityType = String(values.identityType || "local").trim();
  const siteIds = formValues(form, "siteIds");
  const programIds = formValues(form, "programIds");
  const studentIds = formValues(form, "studentIds");
  const globalAdminConfirmation = Boolean(values.globalAdminConfirmation);

  if (!adminNote) return { ok: false, message: "Add the admin note for this account." };
  if (!email || !fullName || !roleId) return { ok: false, message: "Add the person's email, name, and role." };
  if (!["student", "mentor", "viewer", "program_teacher", "administration", "site_admin", "global_admin"].includes(roleId)) {
    return { ok: false, message: "Choose a supported workspace role." };
  }
  if (roleId === "global_admin" && identityType !== "local") {
    return { ok: false, message: "Global Admin must use a local login so platform access is still available if SSO is unavailable." };
  }
  if ((roleId === "administration" || roleId === "site_admin") && siteIds.length === 0) {
    return { ok: false, message: "Choose at least one site for this role." };
  }
  if (roleId === "program_teacher" && programIds.length === 0) {
    return { ok: false, message: "Choose at least one program for this Program Teacher." };
  }
  if (roleId === "global_admin" && !globalAdminConfirmation) {
    return { ok: false, message: "Confirm that this account can manage every site." };
  }

  return {
    ok: true,
    body: {
      adminNote,
      users: [{ email, fullName, roleId, identityType, siteIds, programIds, studentIds, globalAdminConfirmation }],
    },
  };
}

function formValues(form, name) {
  const field = form?.querySelector?.(`[name="${name}"]`);
  if (field?.selectedOptions) {
    return Array.from(field.selectedOptions).map((option) => option.value).filter(Boolean);
  }
  return Array.from(new FormData(form).getAll(name)).map((value) => String(value || "").trim()).filter(Boolean);
}

function renderAdminAccessPreview(form) {
  const roleId = form?.querySelector?.('[name="roleId"]')?.value || "student";
  const identityType = form?.querySelector?.('[name="identityType"]')?.value || "local";
  const preview = form?.querySelector?.("[data-admin-access-preview]");
  const roleCopy = form?.querySelector?.("[data-admin-role-copy]");
  if (!preview || !roleCopy) return;

  const copy = {
    student: "Self only. Can view their own dashboard, work, evidence, feedback, and readiness.",
    mentor: "Assigned students only. Can view assigned student progress and feedback workflows.",
    viewer: "Assigned students only. Read-only.",
    program_teacher: "Assigned program. Can view all students in selected program records.",
    administration: "Assigned site. Leadership visibility over students and dashboards; no user or security management.",
    site_admin: "Assigned site. Can manage users and assignments inside the selected site.",
    global_admin: "Entire platform. Local account only and can manage every site.",
  }[roleId] || "Assigned records";
  roleCopy.textContent = copy;

  const siteCount = formValues(form, "siteIds").length;
  const programCount = formValues(form, "programIds").length;
  const studentCount = formValues(form, "studentIds").length;
  const access = roleId === "global_admin"
    ? "Entire platform"
    : siteCount
      ? `${siteCount} site${siteCount === 1 ? "" : "s"}`
      : programCount
        ? `${programCount} program${programCount === 1 ? "" : "s"}`
        : studentCount
          ? `${studentCount} student${studentCount === 1 ? "" : "s"}`
          : roleId === "student"
            ? "Self only"
            : "Assignment required";
  preview.innerHTML = `
    <strong>${escapeHtml(roleLabel(roleId))}</strong>
    <p>Sign-in method: ${escapeHtml(identityType === "sso" ? "SSO account" : "Local account")}</p>
    <p>Access: ${escapeHtml(access)}</p>
    <p>${escapeHtml(copy)}</p>
  `;
}

function copySecretFromButton(event) {
  const value = event.currentTarget?.dataset?.copySecret || "";
  if (!value || !navigator?.clipboard) return;
  navigator.clipboard.writeText(value).then(() => {
    renderAppShell("Temporary password copied.", "success");
  }).catch(() => {
    renderAppShell("Copy failed. Select the password text instead.", "error");
  });
}

async function submitSiteAccessAssignment(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());
  busy = true;
  setFormBusy(form, true);
  try {
    const response = await fetch("/api/site/access-assignments", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForAdminImportError(data?.error, response.status), "error");
      return;
    }
    activeSection = "adminUsers";
    await loadWorkspaceData("Access assignment saved.");
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

function artifactTypeOptions() {
  return [
    ["planning_document", "Planning document"],
    ["reflection", "Reflection"],
    ["rubric", "Rubric"],
    ["photo", "Photo"],
    ["celebration_photo", "Celebration photo"],
    ["ingredient_list", "Ingredient list"],
    ["thank_you_letter", "Thank-you letter"],
    ["mentor_note", "Mentor note"],
    ["portfolio", "Portfolio"],
    ["presentation", "Presentation"],
    ["other", "Other"],
  ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function messageForAuthError(error, status) {
  if (error === "invalid_credentials") return "We could not sign you in with that email and password.";
  if (error === "password_reset_required") return "This account needs a new password before the workspace can open.";
  if (error === "rate_limited" || status === 429) return "Too many sign-in attempts. Wait a few minutes and try again.";
  return "Sign-in is unavailable right now. Try again or contact your instructor.";
}

function messageForSsoError(error) {
  if (error === "sso_not_configured") return "Google Workspace sign-in is not configured for this environment yet.";
  if (error === "sso_invalid_state") return "The Google Workspace sign-in session expired. Start sign-in again.";
  if (error === "sso_email_not_verified") return "This Google account does not have a verified email address.";
  if (error === "sso_domain_not_allowed") return "This Google Workspace domain is not allowed for this workspace.";
  if (error === "sso_tenant_inactive") return "This school workspace is not active. Contact the project coordinator.";
  if (error === "sso_account_not_provisioned") return "This Google account is not provisioned for the Capstone Project workspace yet.";
  return "Google Workspace sign-in could not be completed. Try again or use approved fallback access.";
}

function messageForPasswordResetError(error, status) {
  if (error === "invalid_credentials") return "We could not verify the current password for this account.";
  if (error === "invalid_password") return "Choose a stronger new password before opening the workspace.";
  if (error === "password_must_change") return "Choose a new password that is different from the current password.";
  if (error === "password_reset_not_required") return "This account is not marked for password reset. Sign in normally.";
  if (error === "rate_limited" || status === 429) return "Too many reset attempts. Wait a few minutes and try again.";
  return "Password reset is unavailable right now. Try again or contact your instructor.";
}

function messageForChangePasswordError(error, status) {
  if (error === "invalid_current_password") return "We could not verify the current password for this account.";
  if (error === "invalid_password") return "Choose a stronger new password before saving this change.";
  if (error === "password_must_change") return "Choose a new password that is different from the current password.";
  if (error === "password_reset_required") return "Complete the required password reset before using the workspace.";
  if (status === 401) return "Sign in again before changing your password.";
  return "Password change is unavailable right now. Try again or contact your instructor.";
}

function messageForAdminImportError(error, status) {
  if (status === 401) return "Sign in again before creating accounts.";
  if (error === "credential_delivery_policy_required") {
    return "Real local-account creation is blocked until the credential delivery policy is approved. Use SSO or the approved proof account flow.";
  }
  if (status === 403) return "This account cannot create or change that access.";
  if (error === "missing_admin_note" || error === "missing_reason") return "Add the admin note for this change.";
  if (error === "invalid_user") return "Check the email, name, role, sign-in method, and access before creating the account.";
  if (error === "duplicate_email" || error === "email_already_exists") return "That email is already included or already has an account.";
  if (error === "invalid_role_scope") return "That role and scope combination is not available.";
  if (error === "program_not_found") return "That program was not found for the selected site.";
  if (error === "site_not_found") return "That site was not found.";
  if (error === "student_not_found") return "That student was not found.";
  if (error === "global_admin_requires_local_account") return "Global Admin must use a local login so platform access is still available if SSO is unavailable.";
  if (error === "last_active_local_global_admin") return "At least one active local Global Admin must remain.";
  if (error === "too_many_users") return "Create fewer accounts in one request.";
  return "Account creation is unavailable right now. Check the details and try again.";
}

function messageForReviewDecisionError(error, status) {
  if (error === "submission_not_in_review") return "This submission is no longer in a submitted review state.";
  if (error === "not_found") return "This submission is outside the current school or assigned teacher list.";
  if (status === 401) return "Sign in again before saving review feedback.";
  if (status === 403) return "This role cannot save review decisions for this submission.";
  return "Review feedback could not be saved right now.";
}

function messageForMentorAssignmentError(error, status) {
  if (error === "active_assignment_exists") return "This student already has an active mentor assignment.";
  if (error === "reason_required") return "Add a reason before assigning a mentor.";
  if (error === "not_found") return "That student or mentor is outside the selected school assignment.";
  if (status === 401) return "Sign in again before assigning a mentor.";
  if (status === 403) return "This role cannot change mentor assignments for this site.";
  return "Mentor assignment could not be saved right now.";
}

function messageForMentorMeetingError(error, status) {
  if (error === "invalid_status") return "Choose a supported meeting result before saving.";
  if (error === "missing_student_id") return "Open an assigned student before recording a meeting.";
  if (error === "submission_scope_denied") return "The linked work is outside this student's record.";
  if (status === 401) return "Sign in again before recording a mentor meeting.";
  if (status === 403) return "Only the actively assigned mentor can record a meeting for this student.";
  return "Mentor meeting could not be saved right now.";
}

function messageForSessionStateError(error, status) {
  if (error === "session_expired") return "Your session has ended. Sign in again to continue.";
  if (error === "account_disabled") return "This account is not active. Contact your instructor or project coordinator.";
  if (error === "password_reset_required") return "This account needs a password reset. Contact your instructor or project coordinator.";
  return "";
}

function workspaceStateForAuthError(error) {
  if (error === "session_expired") return "session-expired";
  if (error === "account_disabled") return "account-disabled";
  if (error === "password_reset_required") return "reset-required";
  return "signed-out";
}

function messageForEvidenceError(error, status) {
  if (error === "invalid_https_evidence_url") return "Use a full HTTPS link for evidence, beginning with https://.";
  if (error === "missing_submission_id" || status === 404) return "We could not find that submission. Refresh and try again.";
  if (status === 403) return "This account does not have permission to add evidence to that submission.";
  if (status === 401) return "Sign in again before adding evidence.";
  return "We could not attach that evidence link. Check the information and try again.";
}

function messageForStudentSubmissionError(error, status) {
  if (error === "submission_missing_evidence") return "Attach evidence before sending this work for teacher review.";
  if (error === "submission_not_submittable" || status === 409) return "This work is not ready to send right now.";
  if (error === "missing_submission_id" || status === 404) return "We could not find that submission. Refresh and try again.";
  if (status === 403) return "This account cannot send that submission for review.";
  if (status === 401) return "Sign in again before sending work for review.";
  return "We could not send this work for review. Try again or ask your program teacher for help.";
}

function messageForUploadError(error, status) {
  if (error === "drive_config_missing" || error === "drive_credentials_missing" || status === 503) {
    return "We could not upload this file yet because storage is not configured for this environment. Try an evidence link or contact your instructor.";
  }
  if (error === "missing_file") return "Choose a file before uploading.";
  if (error === "empty_file") return "The selected file is empty. Choose a file with content and try again.";
  if (error === "file_too_large") return "This file is larger than the current upload limit. Choose a smaller file or ask your instructor for help.";
  if (error === "unsupported_file_type") return "Choose a PDF, image, text file, spreadsheet, presentation, or document for this upload.";
  if (error === "drive_token_exchange_failed" || error === "drive_provider_error" || error === "drive_upload_failed" || status === 502) {
    return "The storage provider could not receive the file. Try again or contact your instructor.";
  }
  if (status === 403) return "This account does not have permission to upload for that submission.";
  if (status === 401) return "Sign in again before uploading evidence.";
  return "We could not upload this file. Try again or contact your instructor.";
}

function messageForPresentationActionError(error, status) {
  if (status === 401) return "Sign in again before updating a presentation slot.";
  if (status === 403) return "This account cannot update that presentation slot.";
  if (status === 404) return "That presentation slot is no longer available.";
  if (error === "presentation_slot_invalid_status" || status === 409) {
    return "This presentation slot is not in the right status for that action.";
  }
  return "We could not update the presentation slot. Try again or contact your instructor.";
}

function messageForApiError(error, status) {
  if (status === 401) return "Sign in again to view this section.";
  if (status === 403) return "This account does not have access to this section.";
  if (error === "network_error") return "This section could not reach the server.";
  return "This section is unavailable right now.";
}

function messageForNetworkError(error) {
  const detail = error instanceof Error ? error.message : String(error || "");
  if (/failed to fetch|network/i.test(detail)) {
    return "The workspace could not reach the server. Open the hosted workspace and try again.";
  }
  return "The workspace could not complete that request. Try again or contact your instructor.";
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
