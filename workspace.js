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
let reviewQueueFilters = defaultReviewQueueFilters();
let reviewQueueState = defaultReviewQueueState();
let mentorAssignmentFilters = defaultMentorAssignmentFilters();
let operationsReadinessFilters = defaultOperationsReadinessFilters();
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
  active: "Approved",
  no_active_assignments: "Blocked",
  not_requested: "Pending",
  policy_review_required: "Pending",
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
const SITE_STUDENT_STATUS_VALUES = new Set(["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"]);
const SITE_STUDENT_RISK_VALUES = new Set(["any", "high", "medium", "low", "stale", "no_mentor"]);
const SITE_STUDENT_PRESENTATION_STATUS_VALUES = new Set(["any", "pending", "scheduled", "completed", "missing"]);
const SITE_STUDENT_ARCHIVE_STATUS_VALUES = new Set(["any", "ready", "complete", "failed", "missing"]);
const MENTOR_ASSIGNMENT_STATUS_VALUES = new Set(["active", "unassigned", "all"]);
const OPERATIONS_STUDENT_STATUS_VALUES = new Set(["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"]);
const OPERATIONS_RISK_VALUES = new Set(["any", "high", "medium", "low", "stale", "no_mentor"]);
const OPERATIONS_PRESENTATION_STATUS_VALUES = new Set(["ready", "pending", "scheduled", "completed", "missing", "outline_pending", "outline_revision_needed", "attention_required"]);
const OPERATIONS_ARCHIVE_STATUS_VALUES = new Set(["ready", "complete", "failed", "missing", "queued", "running", "expired", "expiring_soon", "provider_unavailable"]);
const OPERATIONS_READINESS_VALUES = new Set(["ready", "in_progress", "attention_required", "blocked", "missing", "complete"]);
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
  "mentorUserId",
  "studentUserId",
  "studentId",
];
const SITE_STUDENT_URL_FILTER_PARAMS = [
  "search",
  "programId",
  "status",
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
  "programId",
  "status",
  "story",
  "risk",
  "presentationStatus",
  "archiveStatus",
  "readiness",
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
      renderSignIn(
        messageForSessionStateError(data?.error, response.status),
        data?.error ? "error" : "neutral",
        workspaceStateForAuthError(data?.error),
      );
      return;
    }
    currentUser = data.user;
    await loadWorkspaceData();
  } catch (error) {
    currentUser = null;
    currentData = defaultCurrentData(authConfig);
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
  if (hasSiteOperationsRole(roles)) loaders.push(["operationsReadiness", apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`)]);
  if (roles.has("admin")) loaders.push(["adminDashboard", apiJson("/api/admin/dashboard")]);
  if (roles.has("program_teacher")) loaders.push(["programTeacherDashboard", apiJson("/api/program-teacher/dashboard")]);
  if (roles.has("mentor") || roles.has("admin")) loaders.push(["mentorDashboard", apiJson("/api/mentor/dashboard")]);
  if (roles.has("mentor")) loaders.push(["mentorAssigned", apiJson("/api/mentor/assigned")]);
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || roles.has("admin")) {
    loaders.push(["presentationSlots", apiJson("/api/presentation-slots")]);
  }
  if (roles.has("admin") || roles.has("misc_admin")) loaders.push(["readiness", apiJson("/api/reports/readiness")]);

  const results = await Promise.all(loaders.map(async ([key, promise]) => [key, await settleApi(promise)]));
  currentData = defaultCurrentData(authConfig);

  for (const [key, result] of results) {
    currentData[key] = result;
  }

  const firstAvailable = availableSections()[0]?.id || "overview";
  if (!availableSections().some((section) => section.id === activeSection)) {
    activeSection = firstAvailable;
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
    security: "Security",
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
    || roles.has("admin")
    || roles.has("org_admin")
    || roles.has("site_admin");
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
  if (section === "students" && button.dataset.sectionPreset === "missing-mentors") {
    siteStudentFilters = {
      ...defaultSiteStudentFilters(),
      noMentor: true,
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Showing students missing mentors.");
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
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || roles.has("admin")) {
    sections.push({ id: "presentation", label: "Presentation", detail: "Schedule, outline, and day-of status" });
  }
  if (roles.has("admin")) sections.push({ id: "adminDashboard", label: "Admin Command Center", detail: "Legacy global operations" });
  if (roles.has("admin") || roles.has("misc_admin")) sections.push({ id: "readiness", label: "Readiness", detail: "Aggregate project readiness" });
  if (roles.has("admin")) sections.push({ id: "adminUsers", label: "Users & Access", detail: "Import accounts and setup access" });
  if (roles.has("admin")) sections.push({ id: "audit", label: "Audit", detail: "Recent protected-record activity" });
  if (roles.has("admin")) sections.push({ id: "archiveExports", label: "Archive / Exports", detail: "Closeout package status" });
  sections.push({ id: "security", label: "Security", detail: "Password and session controls" });
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
  if (["platform_admin", "admin", "org_admin", "site_admin", "viewer"].includes(primaryRole)) return renderSiteDashboardSection();
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
            <p>Open assigned review or mentor sections when this account has scoped access.</p>
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
        Your account is signed in, but the role or scope on this account does not permit the
        requested section.
      </p>
      <ul class="workspace-compact-list">
        ${deniedSections.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
      ${renderProblemState({
        reason: "The current role does not include every requested workspace section.",
        owner: "Project coordinator or site administrator.",
        nextAction: "Use an assigned account or request access for this site and role.",
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
      <p>Read-only workspace. You can review assigned site information and private-evidence status, but changes stay with authorized staff.</p>
    </section>
  `;
}

function renderSiteDashboardSection() {
  const result = currentData.siteDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Site dashboard", "assigned site operating records");
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
          <span class="workspace-chip">${escapeHtml(statusText(scope.selectionMode || "site_scope"))}</span>
        </div>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students", summary.studentsActive, `${safeNumber(summary.studentsTotal)} visible at this site`, "admin", "students", { label: "Open", preset: "all-students" })}
        ${renderMetricTile("No Mentor", summary.studentsNoMentor, "Students missing active mentor assignments", safeNumber(summary.studentsNoMentor) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-mentors" })}
        ${renderMetricTile("Submitted", summary.submissionsSubmitted, "Awaiting teacher review", "teacher", "teacher", { label: "Review", preset: "submitted" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Teacher follow-up needed", safeNumber(summary.revisionRequested) ? "warning" : "student", "teacher", { label: "Review", preset: "revision-requested" })}
        ${renderMetricTile("Evidence", summary.evidenceArtifacts, "Summary only; open student detail for evidence records", "mentor")}
        ${renderMetricTile("Presentations", presentationsTotal, `${safeNumber(summary.presentationsPending)} pending readiness`, "teacher", "operations", { label: "Review", preset: "presentation-pending" })}
        ${renderMetricTile("Archive / Exports", archiveTotal, `${safeNumber(summary.exportsFailed)} failed`, safeNumber(summary.exportsFailed) ? "danger" : "admin", "operations", { label: "Review", preset: "archive-failed" })}
        ${renderMetricTile("Recent Activity", summary.recentActivityCount, "Recent site activity", "admin", "audit")}
      </div>
      ${renderSitePermissionRules(dashboard)}
      ${renderDashboardCard("Needs Attention", "Teacher follow-up and operations", renderNeedsAttention(dashboard.needsAttention))}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
        ${renderDashboardCard("Status Breakdown", "Student status", renderStatusBreakdown(dashboard.statusBreakdown))}
        ${renderDashboardCard("Top Risk Students", "Priority student signals", renderSiteTopRiskStudents(dashboard.topRiskStudents))}
        ${renderDashboardCard("Mentor Coverage", "Mentor assignment load", renderMentorCoverage(dashboard.mentorCoverage, summary))}
        ${renderDashboardCard("Presentation Snapshot", "Readiness and day-of status", renderSnapshotRows(dashboard.presentationSnapshot))}
        ${renderDashboardCard("Archive / Export Snapshot", "Closeout package status", renderSnapshotRows(dashboard.archiveSnapshot))}
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
        ${renderMetricTile("No Mentor", summary.noMentor, "Needs mentor coverage", safeNumber(summary.noMentor) ? "warning" : "mentor")}
        ${renderMetricTile("Submitted", summary.submitted, "Teacher review queue signal", "teacher")}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Teacher follow-up", safeNumber(summary.revisionRequested) ? "warning" : "student")}
        ${renderMetricTile("Presentation Pending", summary.presentationPending, "Readiness follow-up", "teacher")}
        ${renderMetricTile("Archive Ready", summary.archiveReady, "Closeout candidates", "mentor")}
        ${renderMetricTile("Archive Failed", summary.archiveFailed, "Export follow-up", safeNumber(summary.archiveFailed) ? "danger" : "admin")}
        ${renderMetricTile("High Risk", summary.highRisk, "Prioritize outreach", safeNumber(summary.highRisk) ? "danger" : "admin")}
      </div>
      ${renderStudentDirectoryOperatingPosture(readOnly)}
      ${renderStudentDirectoryFilterBar(directory)}
      ${renderStudentDirectoryActiveFilters(filters, directory.filterOptions || {})}
      ${renderStudentDirectoryResultSummary(directory)}
      ${students.length ? renderStudentRows(students, readOnly) : renderStudentDirectoryEmptyState(directory)}
      ${renderSiteStudentDetailSurface(directory)}
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
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Risk", riskLabel(filters.risk)));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.presentationStatus && filters.presentationStatus !== "any") chips.push(activeFilterChip("Presentation", statusText(filters.presentationStatus)));
  if (filters.archiveStatus && filters.archiveStatus !== "any") chips.push(activeFilterChip("Archive", statusText(filters.archiveStatus)));
  if (filters.noMentor) chips.push(activeFilterChip("Mentor", "Missing mentor assignment"));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Student directory", chips, 'data-site-student-action="reset-filters"', filters.noMentor
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
            ? "The list is filtered to students without active mentor assignments in the current school scope."
            : "Returned rows respect pagination; total and filtered totals stay tied to the selected site or program scope."}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(total)} total in scope</span>
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
      <div class="workspace-row-actions">
        ${statusPill(student.latestSubmissionStatus || "draft")}
        ${statusPill(student.presentationStatus || "missing")}
        ${statusPill(student.archiveStatus || "missing")}
      </div>
      <div class="workspace-row-actions">
        <span class="workspace-site-context-badge">${escapeHtml(safeNumber(student.evidenceCount))} evidence</span>
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
  const filtered = Boolean(
    filters.search
    || filters.programId
    || filters.status
    || filters.noMentor
    || (filters.risk && filters.risk !== "any")
    || filters.story
    || (filters.presentationStatus && filters.presentationStatus !== "any")
    || (filters.archiveStatus && filters.archiveStatus !== "any")
  );
  return `
    <section class="workspace-empty-state-card" data-student-directory-empty="true">
      <strong>No student records match these filters</strong>
      ${renderProblemState({
        reason: filtered ? "No students match these filters." : emptyState.reason || "No student records are visible in this view.",
        owner: emptyState.owner || "Assigned staff or site administrator.",
        nextAction: filtered ? "Clear filters to see all students you can access." : emptyState.nextAction || "Check the assigned site or program scope.",
      })}
    </section>
  `;
}

function renderSiteStudentDetailSurface(directory) {
  const state = siteStudentDetailState || defaultSiteStudentDetailState();
  if (!state.studentId) return "";
  const selectedRow = (directory.students || []).find((student) => student.studentId === state.studentId);
  const title = selectedRow?.displayName || "Student detail";

  if (state.loading) {
    return `
      <aside class="workspace-detail-drawer" data-student-detail-state="loading" aria-label="Student detail">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2>${escapeHtml(title)}</h2>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">Close</button>
          </div>
          ${renderProblemState({
            reason: "Loading the site-scoped student record.",
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
      <aside class="workspace-detail-drawer" data-student-detail-state="error" aria-label="Student detail">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2>${escapeHtml(title)}</h2>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">Close</button>
          </div>
          ${renderApiNotice(state.result)}
          ${renderProblemState({
            reason: "This student detail is unavailable for the current site and role scope.",
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
    <aside class="workspace-detail-drawer" data-student-detail-state="ready" data-student-detail-id="${escapeHtml(student.studentId || state.studentId)}" aria-labelledby="siteStudentDetailTitle">
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
          <span class="workspace-site-context-badge">${escapeHtml(scope.siteName || directory.scope?.siteName || "Selected site")}</span>
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
      ${renderStudentDetailList("Mentor Meetings", "Support timeline", meetings, "No mentor meetings are available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${escapeHtml(row.notes || row.nextAction || "Meeting recorded.")}</p>
            <p class="workspace-muted">${escapeHtml(formatDate(row.heldAt || row.scheduledFor || row.createdAt))}</p>
          </div>
          ${statusPill(row.status || "pending")}
        </article>
      `)}
    </section>
  `;
}

function renderStudentDetailPresentation(detail) {
  const presentation = detail.presentation || {};
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
      `)}
    </section>
  `;
}

function renderStudentDetailArchive(detail) {
  const archive = detail.archive || {};
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
      `)}
    </section>
  `;
}

function renderStudentDetailTimeline(detail, state) {
  const timelineBody = unwrap(state.timelineResult);
  const events = timelineBody?.events || detail.timelinePreview || [];
  const title = timelineBody ? "Timeline" : "Timeline Preview";
  return `
    <section class="workspace-detail-section" data-student-detail-section="timeline">
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
            reason: "The full timeline could not be loaded for this role and site scope.",
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
          <h2>${escapeHtml(scope.siteName || "Assigned site")} / ${escapeHtml(scope.schoolYear || "School year")}</h2>
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
          This view is scoped to ${escapeHtml(scope.siteName || "the current site")} only.
        </p>
      ` : ""}
    </section>
  `;
}

function renderSitePermissionRules(dashboard) {
  const permissions = dashboard.permissions || {};
  return `
    <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
      <article class="workspace-empty-state-card">
        <strong>Private evidence</strong>
        <span>Evidence counts are visible without exposing private file details.</span>
        ${statusPill("configured")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Assigned student records</strong>
        <span>${permissions.canViewStudentDirectory ? "This role can view assigned student records." : "This role is limited to dashboard review."}</span>
        ${statusPill(permissions.canViewStudentDirectory ? "approved" : "blocked")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Protected access</strong>
        <span>Workspace access is reviewed without exposing private file details.</span>
        ${statusPill("approved")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Teacher follow-up</strong>
        <span>${permissions.canViewReviewQueue ? "Review queue visibility is available for this site." : "Review queue action remains with assigned staff."}</span>
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
          { label: "Users & Access", detail: "Import accounts", section: "adminUsers" },
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
    return renderPermissionDeniedSection("Program dashboard", "scoped program or cohort records");
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Program dashboard</p>
        <h2>Scoped dashboard unavailable</h2>
        ${renderApiNotice(result)}
      </section>
    `;
  }
  const summary = dashboard.summary || {};
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Program Dashboard</p>
          <h1>Scoped Student Progress</h1>
          <p>Review workload, mentor coverage, evidence activity, and presentation readiness for the students in your assigned scope.</p>
        </div>
        <div class="workspace-command-hero-grid">
          <span class="workspace-chip">${escapeHtml(statusText(dashboard.scope?.scopeType || "scope"))}</span>
          <span class="workspace-chip">${escapeHtml(dashboard.scope?.scopeId || "global")}</span>
        </div>
      </div>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Scoped Students", summary.scopedStudents, "Visible in this role scope", "teacher")}
        ${renderMetricTile("Submitted", summary.submitted, "Ready for review", "teacher", "teacher")}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Follow-up needed", "warning", "teacher")}
        ${renderMetricTile("Approved", summary.approved, "Accepted submissions", "student")}
        ${renderMetricTile("Evidence", summary.evidenceArtifacts, "Evidence records", "mentor")}
        ${renderMetricTile("Presentations", summary.presentationsPending, "Pending readiness", "warning", "presentation")}
      </div>
      ${renderDashboardCard("Needs Attention", "Scoped risks", renderNeedsAttention(dashboard.needsAttention))}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Needs Review", "Submitted and revision records", renderReviewQueueSummary(dashboard.needsReview))}
        ${renderDashboardCard("Program Breakdown", "Source record counts", renderProgramBreakdown(dashboard.programBreakdown))}
        ${renderDashboardCard("Students", "Scoped student list", renderScopedStudentList(dashboard.students))}
      </div>
    </section>
  `;
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
  const assigned = body.assignedStudents || [];
  const summary = body.summary || {
    assignedCount: assigned.length,
    needsRevision: assigned.filter((student) => student.submissionStatus === "revision_requested").length,
    missingMeeting: 0,
    presentationPending: 0,
  };
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
      ${assigned.length ? `
        ${renderDashboardCard("Assigned Students", "Active mentor scope", renderMentorStudentCards(assigned))}
        ${siteStudentDetailState?.sourceSection === "mentorDashboard" ? renderSiteStudentDetailSurface({
          students: assigned.map((row) => ({
            studentId: row.studentId,
            displayName: row.studentName,
          })),
        }) : ""}
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
          <p>This role can inspect mentor coverage for this school, but assignment changes stay with authorized site operations.</p>
        </section>
      ` : ""}
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students With Mentors", summary.studentsWithActiveMentor, "Active mentor coverage", "mentor")}
        ${renderMetricTile("Missing Mentors", summary.studentsWithoutActiveMentor, "Needs assignment follow-up", safeNumber(summary.studentsWithoutActiveMentor) ? "warning" : "mentor")}
        ${renderMetricTile("Active Mentors", summary.activeMentors, "Current mentor pool", "admin")}
        ${renderMetricTile("Overloaded Mentors", summary.overloadedMentors, "Review load before assigning", safeNumber(summary.overloadedMentors) ? "danger" : "admin")}
      </div>
      ${renderMentorAssignmentFilters(body)}
      ${renderMentorAssignmentActiveFilters(mentorAssignmentFiltersForBody(body), body?.filterOptions || {})}
      <div class="workspace-mentor-assignment-layout">
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Coverage queue</p>
              <h2>Unassigned students</h2>
              <p>${safeNumber(unassignedStudents.length)} shown of ${safeNumber(pagination.filteredTotal)} matching students at this school.</p>
            </div>
            <span class="workspace-site-context-badge">${safeNumber(pagination.total)} scoped</span>
          </div>
          ${unassignedStudents.length ? renderMentorUnassignedStudents(unassignedStudents, permissions) : `
            <section class="workspace-empty-state-card" data-mentor-assignments-empty="true">
              <h2>No missing mentor rows match</h2>
              ${renderProblemState(body.emptyState || {
                reason: "No students without active mentors match these filters at this school.",
                owner: "Site administration.",
                nextAction: "Adjust filters or review active assignments.",
              })}
            </section>
          `}
          ${renderMentorAssignmentPagination(pagination)}
        </section>
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Assignment action</p>
              <h2>${canManage ? "Assign Mentor" : "Assignment Controls"}</h2>
              <p>${canManage ? "Assign one mentor to one currently unassigned student at this school." : "Assignment controls are hidden for this role."}</p>
            </div>
          </div>
          ${canManage ? renderMentorAssignmentForm(body) : `
            <section class="workspace-empty-state-card" data-mentor-assignment-controls-hidden="true">
              <h2>Assignment changes unavailable</h2>
              ${renderProblemState({
                reason: "This role has a read-only mentor coverage view.",
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
          ${mentors.map((mentor) => `<option value="${escapeHtml(mentor.mentorUserId || "")}">${escapeHtml(mentor.mentorName || "Mentor")} / ${safeNumber(mentor.activeAssignmentCount)} active</option>`).join("")}
        </select>
      </label>
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
      <h2>Assignment form unavailable</h2>
      ${renderProblemState({
        reason: students.length ? "No active mentors are available at this school." : "No currently unassigned students are visible in this page.",
        owner: "Site administration.",
        nextAction: "Adjust filters or confirm mentor and student site memberships.",
      })}
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
            <p class="workspace-muted">${escapeHtml(mentor.siteName || "Selected site")} / ${safeNumber(mentor.activeAssignmentCount)} active assignment${safeNumber(mentor.activeAssignmentCount) === 1 ? "" : "s"}</p>
          </div>
          ${statusPill(mentor.loadStatus || "available")}
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
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No active assignments match these filters.</div>`;
}

function renderOperationsReadinessSection() {
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
        <p>This view is for monitoring and follow-up. Open student detail for blocker context.</p>
      </section>
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Presentation Ready", summary.presentationReady, "Ready or complete signals", "teacher")}
        ${renderMetricTile("Presentation Pending", summary.presentationPending, "Outline or schedule attention", safeNumber(summary.presentationPending) ? "warning" : "teacher")}
        ${renderMetricTile("Outline Pending", summary.outlinePending, "Needs outline approval", safeNumber(summary.outlinePending) ? "warning" : "teacher")}
        ${renderMetricTile("Archive Ready", summary.archiveReady, "Ready or complete package state", "mentor")}
        ${renderMetricTile("Archive Failed", summary.archiveFailed, "Needs archive follow-up", safeNumber(summary.archiveFailed) ? "danger" : "admin")}
        ${renderMetricTile("Needs Attention", summary.needsAttention, "Blocked, missing, or high-risk rows", safeNumber(summary.needsAttention) ? "danger" : "admin")}
      </div>
      ${renderOperationsFilters(body)}
      ${renderOperationsActiveFilters(body?.filters || operationsReadinessFilters || defaultOperationsReadinessFilters(), body?.filterOptions || {})}
      <section class="workspace-card workspace-directory-summary" aria-label="Operations readiness results">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Results</p>
            <h2>Showing ${safeNumber(pagination.returned)} of ${safeNumber(pagination.filteredTotal)}</h2>
            <p class="workspace-muted">Rows are limited to the current school and sorted with blocked or pending attention first.</p>
          </div>
          <span class="workspace-site-context-badge">${safeNumber(pagination.total)} total in scope</span>
        </div>
        ${renderOperationsPagination(pagination)}
      </section>
      <div class="workspace-operations-layout">
        ${renderDashboardCard("Presentation", "Schedule, outline, and day-of readiness", renderPresentationWorklistRows(presentation.rows || [], permissions))}
        ${renderDashboardCard("Archive", "Package readiness and export failures", renderArchiveWorklistRows(archive.rows || [], permissions))}
        ${renderDashboardCard("Readiness", "Attention rows and next actions", renderReadinessAttentionRows(readiness.attentionRows || [], permissions))}
      </div>
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
        ${renderDashboardCard("Program Breakdown", "Readiness by visible program", renderOperationsProgramBreakdown(readiness.filteredProgramBreakdown || readiness.programBreakdown || []))}
        ${renderDashboardCard("Next Actions", "Grouped staff follow-up", renderOperationsNextActions(readiness.nextActions || []))}
      </div>
      ${renderSiteStudentDetailSurface({ students: operationRowsForDetail(body) })}
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
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.status) chips.push(activeFilterChip("Submission", statusText(filters.status)));
  if (filters.presentationStatus) chips.push(activeFilterChip("Presentation", statusText(filters.presentationStatus)));
  if (filters.archiveStatus) chips.push(activeFilterChip("Archive", statusText(filters.archiveStatus)));
  if (filters.readiness) chips.push(activeFilterChip("Readiness", statusText(filters.readiness)));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Risk", riskLabel(filters.risk)));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Operations readiness", chips, 'data-operations-action="reset-filters"');
}

function renderPresentationWorklistRows(rows = [], permissions = {}) {
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
      <h2>No presentation rows match</h2>
      ${renderProblemState({
        reason: "No presentation readiness rows match the current filters at this school.",
        owner: "Site administration.",
        nextAction: "Adjust filters or review the student directory.",
      })}
    </section>
  `;
}

function renderArchiveWorklistRows(rows = [], permissions = {}) {
  return rows.length ? `
    <div class="workspace-list" data-operations-archive-rows="true">
      ${rows.map((row) => `
        <article class="workspace-student-row workspace-student-card">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${escapeHtml(row.programName || "Unassigned")} / ${escapeHtml(row.providerStatus || "archive provider")}</p>
            <div class="workspace-chip-row">
              ${row.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(row.storyBucket))}</span>` : `<span class="workspace-story-chip">Archive readiness</span>`}
              ${renderRiskChips(row.riskFlags || [])}
            </div>
          </div>
          <div>
            <span class="workspace-muted">Archive</span>
            <strong>${escapeHtml(row.reason || "Archive status")}</strong>
            <p>${escapeHtml(row.downloadExpiresSoon ? "Download window expiring soon." : "File details are protected.")}</p>
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
      <h2>No archive rows match</h2>
      ${renderProblemState({
        reason: "No archive readiness rows match the current filters at this school.",
        owner: "Site administration.",
        nextAction: "Adjust filters or open student detail from the directory.",
      })}
    </section>
  `;
}

function renderReadinessAttentionRows(rows = [], permissions = {}) {
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
      <h2>No attention rows match</h2>
      ${renderProblemState({
        reason: "No blocked, missing, or attention-required readiness rows match the current filters.",
        owner: "Site administration.",
        nextAction: "Adjust filters or continue monitoring ready rows.",
      })}
    </section>
  `;
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
            <p>${escapeHtml(row.owner || "Site administration")} / ${escapeHtml(statusText(row.category || "readiness"))}</p>
          </div>
          <span class="workspace-site-context-badge">${safeNumber(row.count)} row${safeNumber(row.count) === 1 ? "" : "s"}</span>
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
    ${renderStudentProgressDetails(summary, dashboard)}
    <section class="workspace-card">
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
        ${submissions.length ? submissions.map(renderSubmissionRow).join("") : `<div class="workspace-empty">No submissions have been started yet.</div>`}
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
    </section>
  `;
}

function studentPrimaryNextAction(summary, nextSteps = []) {
  const firstStep = Array.isArray(nextSteps) ? nextSteps[0] : null;
  if (firstStep) {
    return {
      title: firstStep.title || "Continue your next requirement",
      detail: firstStep.detail || "Open the requirement in the list below and continue your project work.",
      status: firstStep.status || "pending",
      owner: "Your action",
      when: firstStep.dueDate ? `Due ${formatDate(firstStep.dueDate)}` : "Use the next-steps list below.",
    };
  }
  if (summary.revisionRequestedCount) {
    return {
      title: "Revise submitted work",
      detail: "Review the item marked Needs Revision and update your evidence or submission before moving forward.",
      status: "revision_requested",
      owner: "Your action",
      when: "Start with the submission list below.",
    };
  }
  if (summary.missingRequiredCount) {
    return {
      title: "Finish a missing submission",
      detail: "Choose a draft or missing requirement and attach the work your teacher requested.",
      status: "draft",
      owner: "Your action",
      when: "Use Submit Evidence after choosing the requirement.",
    };
  }
  if (summary.waitingForReviewCount) {
    return {
      title: "Wait for teacher review",
      detail: "Your submitted work is waiting for review. Check back for feedback before changing direction.",
      status: "submitted",
      owner: "Teacher review",
      when: "No extra upload is needed right now.",
    };
  }
  return {
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
  return `
    <article class="workspace-row workspace-student-next-step">
      <div>
        <strong>${escapeHtml(item.title || "Senior Project requirement")}</strong>
        <p>${escapeHtml(item.detail || "Review this requirement and continue your next step.")}</p>
        <p class="workspace-muted">Due date: ${escapeHtml(item.dueDate ? formatDate(item.dueDate) : "Not available yet")}</p>
      </div>
      ${statusPill(item.status || "not_started")}
    </article>
  `;
}

function renderStudentProgressDetails(summary, dashboard) {
  const progress = dashboard.progress || [];
  const submissions = dashboard.submissions || [];
  const evidence = dashboard.evidence || [];
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
          <span class="workspace-site-context-badge">${escapeHtml(scope.siteName || "Selected site")}</span>
          <span class="workspace-site-context-badge">${escapeHtml(scope.schoolYear || "School year")}</span>
          ${readOnly ? `<span class="workspace-site-context-badge">Read-only</span>` : `<span class="workspace-site-context-badge">Teacher decisions enabled</span>`}
        </div>
      </div>
      ${renderApiNotice(result)}
      ${readOnly ? `
        <section class="workspace-read-only-banner" data-review-queue-read-only="true">
          <strong>Read-only review queue</strong>
          <p>This role can inspect submitted work and review context, but approve, revision, and comment-only decisions stay with scoped program teachers.</p>
        </section>
      ` : ""}
      <div class="workspace-metric-grid">
        ${renderMetricTile("Submitted", summary.submitted, "Ready for teacher review", "teacher")}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Open revision loops", "warning")}
        ${renderMetricTile("Evidence Attached", summary.evidenceAttached, "Private evidence summaries", "admin")}
        ${renderMetricTile("High Risk", summary.highRisk, "Prioritize follow-up", safeNumber(summary.highRisk) ? "danger" : "admin")}
      </div>
      ${renderReviewQueueFilters(body)}
      ${renderReviewQueueActiveFilters(filters, body?.filterOptions || {})}
      <div class="workspace-review-layout">
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <h2>Submitted work</h2>
              <p>${safeNumber(pagination.returned)} shown of ${safeNumber(pagination.filteredTotal)} matching records</p>
            </div>
            <span class="workspace-chip">${safeNumber(pagination.total)} scoped</span>
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
              <h2>No review rows match</h2>
              ${renderProblemState(reviewQueueEmptyState(body, filters))}
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
  if (filters.search) chips.push(activeFilterChip("Search", filters.search));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Review queue", chips, 'data-review-queue-action="reset-filters"');
}

function reviewQueueEmptyState(body, filters = {}) {
  const hasFilters = hasActiveReviewQueueFilters(filters);
  if (hasFilters) {
    return {
      reason: "No review items match these filters.",
      owner: "Program teacher or site staff.",
      nextAction: "Clear filters to see submitted and revision-requested work you can access.",
    };
  }
  return body?.emptyState || {
    reason: "No submitted or revision-requested records are available for this site and role scope.",
    owner: "Program teacher or site staff.",
    nextAction: "Check the student directory or continue monitoring new submissions.",
  };
}

function hasActiveReviewQueueFilters(filters = {}) {
  return Boolean(
    filters.status
    || filters.programId
    || filters.search
    || filters.story
    || (filters.risk && filters.risk !== "any")
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
  if (reviewQueueState.loadingHistory) {
    return `
      <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="loading">
        <h2>Loading submission</h2>
        ${renderProblemState({
          reason: "Review history is loading.",
          owner: "Teacher review queue",
          nextAction: "Keep the selected row open.",
        })}
      </section>
    `;
  }
  if (!selected) {
    return `
      <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="empty">
        <h2>Select a submission</h2>
        ${renderProblemState({
          reason: "No review row is selected.",
          owner: "Program teacher or site staff",
          nextAction: "Open a submitted row to view evidence summaries, history, and available teacher decisions.",
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
          <h2>Review actions unavailable</h2>
          ${renderProblemState({
            reason: permissions.canReview ? "Status-changing reviews are limited to submitted work." : "This role has a read-only review queue view.",
            owner: "Scoped program teacher",
            nextAction: "Use the queue for context or wait for a submitted item assigned to this teacher scope.",
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
          owner: "Teacher review queue",
          nextAction: "Refresh the queue or check role scope.",
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
      ` : `<div class="workspace-empty">No review history is loaded yet.</div>`}
      <p class="workspace-muted">${safeNumber(comments.length)} comment${safeNumber(comments.length) === 1 ? "" : "s"} available for this submission.</p>
    </section>
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
    return renderPermissionDeniedSection("Readiness report", "aggregate project reporting");
  }
  const body = unwrap(result);
  const report = body?.report || {};
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Readiness</p>
          <h2>Project Snapshot</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(body?.scope || "aggregate")}</span>
      </div>
      ${renderApiNotice(result)}
      <div class="workspace-grid">
        ${metric("Submitted", report.submitted || 0)}
        ${metric("Needs Revision", report.revisionRequested || 0)}
        ${metric("Approved", report.approved || 0)}
        ${metric("Evidence", report.evidence || 0)}
        ${metric("Exports Queued", report.exportsQueued || 0)}
      </div>
    </section>
  `;
}

function renderSecuritySection() {
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Account security</p>
          <h2>Password And Sessions</h2>
        </div>
        <span class="workspace-chip">Signed in</span>
      </div>
      <p>Update your password from this workspace when you know the current password.</p>
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
  if (!roleIds(currentUser).has("admin")) {
    return renderPermissionDeniedSection("User import", "account provisioning records");
  }

  return `
    <section class="workspace-card" data-admin-section="users">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Admin users</p>
          <h2>Import Account</h2>
        </div>
        <span class="workspace-chip">Admin only</span>
      </div>
      <form id="workspaceAdminImportForm" class="workspace-form" data-admin-action="import-users" data-admin-endpoint="/api/admin/users/import" data-admin-cache="no-store-response">
        <label class="workspace-label">
          Import reason
          <textarea class="workspace-textarea" name="reason" maxlength="500" required></textarea>
        </label>
        <div class="workspace-form-grid">
          <label class="workspace-label">
            Email
            <input class="workspace-input" name="email" type="email" autocomplete="off" required>
          </label>
          <label class="workspace-label">
            Display name
            <input class="workspace-input" name="displayName" autocomplete="off" maxlength="120" required>
          </label>
          <label class="workspace-label">
            Role
            <select class="workspace-select" name="roleId" required>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="program_teacher">Program teacher</option>
              <option value="admin">Admin</option>
              <option value="misc_admin">Misc admin</option>
            </select>
          </label>
          <label class="workspace-label">
            Scope type
            <select class="workspace-select" name="scopeType">
              <option value="global">Global</option>
              <option value="program">Program</option>
              <option value="cohort">Cohort</option>
            </select>
          </label>
          <label class="workspace-label workspace-label-wide">
            Scope id
            <input class="workspace-input" name="scopeId" autocomplete="off" pattern="[A-Za-z0-9_-]*">
          </label>
        </div>
        <p class="workspace-muted">Imported accounts must create a new password at first sign-in. Setup passwords are shown once.</p>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Import account</button>
        </div>
      </form>
    </section>
    ${renderAdminImportResult()}
  `;
}

function renderAdminImportResult() {
  const users = Array.isArray(lastAdminImportResult?.users) ? lastAdminImportResult.users : [];
  if (!users.length) return "";

  return `
    <section class="workspace-card" data-admin-import-result="one-time-setup-passwords">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Imported accounts</p>
          <h2>Setup Access</h2>
        </div>
        <span class="workspace-chip">${users.length} account${users.length === 1 ? "" : "s"}</span>
      </div>
      <div class="workspace-list">
        ${users.map((user) => `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(user.displayName || user.email || "Imported account")}</strong>
              <p>${escapeHtml(user.email || "")}</p>
              <p class="workspace-muted">${escapeHtml(statusText(user.role?.roleId || "role"))} / ${escapeHtml(scopeLabel(user.role))}</p>
              <span class="workspace-secret-output" data-admin-import-credential="setup-password">${escapeHtml(user.temporaryPassword || "")}</span>
              <p class="workspace-muted">Share through the approved school process. This person must create a new password at first sign-in.</p>
            </div>
            ${statusPill(user.status || "pending_reset")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function bindWorkspaceForms() {
  document.querySelector("#workspaceChangePasswordForm")?.addEventListener("submit", changeOwnPassword);
  const adminImportForm = document.querySelector("#workspaceAdminImportForm");
  adminImportForm?.addEventListener("submit", submitAdminUserImport);
  adminImportForm?.querySelector?.('[name="roleId"]')?.addEventListener("change", updateAdminImportScopeFields);
  adminImportForm?.querySelector?.('[name="scopeType"]')?.addEventListener("change", updateAdminImportScopeFields);
  updateAdminImportScopeFields();
  document.querySelector("#workspaceEvidenceLinkForm")?.addEventListener("submit", attachEvidenceLink);
  const uploadForm = document.querySelector("#workspaceFileUploadForm");
  uploadForm?.addEventListener("submit", uploadEvidenceFile);
  uploadForm?.querySelector?.('[data-upload-action="select-file"]')?.addEventListener("change", handleUploadFileSelected);
  bindUploadRetryButton();
  document.querySelectorAll("[data-presentation-action]").forEach((button) => {
    button.addEventListener("click", updatePresentationSlot);
  });
  document.querySelector("#siteStudentFilterForm")?.addEventListener("submit", applySiteStudentFilters);
  document.querySelectorAll("[data-site-student-action]").forEach((button) => {
    button.addEventListener("click", handleSiteStudentAction);
  });
  document.querySelectorAll("[data-student-detail-tab]").forEach((button) => {
    button.addEventListener("click", selectSiteStudentDetailTab);
  });
  document.querySelectorAll("[data-student-detail-action]").forEach((button) => {
    button.addEventListener("click", handleSiteStudentDetailAction);
  });
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

async function applySiteStudentFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  siteStudentFilters = {
    search: cleanDirectoryFilter(data.get("search")),
    programId: cleanDirectoryFilter(data.get("programId")),
    status: cleanDirectoryFilter(data.get("status")),
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
    programId: cleanDirectoryFilter(data.get("programId")),
    status: cleanDirectoryFilter(data.get("status")),
    story: cleanDirectoryFilter(data.get("story")),
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    presentationStatus: cleanDirectoryFilter(data.get("presentationStatus")),
    archiveStatus: cleanDirectoryFilter(data.get("archiveStatus")),
    readiness: cleanDirectoryFilter(data.get("readiness")),
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
    activeSection = "students";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorStudentId || "");
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
  if (action === "open-student") {
    activeSection = "mentorDashboard";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorDashboardStudentId || "", { sourceSection: "mentorDashboard" });
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
    activeSection = "students";
    await openSiteStudentDetail(event.currentTarget?.dataset?.reviewStudentId || "");
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
  const queue = unwrap(currentData.reviewQueue);
  const siteId = selectedSiteQueryValue() || queue?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  reviewQueueState = {
    ...defaultReviewQueueState(),
    selectedSubmissionId,
    loadingHistory: true,
  };
  activeSection = "teacher";
  renderAppShell("Loading review history...");
  const historyResult = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(selectedSubmissionId)}/history${query}`));
  reviewQueueState = {
    ...reviewQueueState,
    loadingHistory: false,
    historyResult,
  };
  renderAppShell(historyResult.ok ? "Review history loaded." : "Review history unavailable.", historyResult.ok ? "success" : "error");
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
  if (!rows.some((row) => row.submissionId === reviewQueueState.selectedSubmissionId)) {
    reviewQueueState = {
      ...reviewQueueState,
      selectedSubmissionId: "",
      historyResult: null,
      loadingHistory: false,
    };
  }
  activeSection = "teacher";
  if (options.syncUrl !== false) syncReviewQueueUrlState({ replace: Boolean(options.replaceUrl) });
  renderAppShell(result.ok ? (message || "Review queue loaded.") : "Review queue unavailable.", result.ok ? "success" : "error");
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
    await openSiteStudentDetail(event.currentTarget?.dataset?.studentDetailId || "");
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
  const siteId = selectedSiteQueryValue()
    || directory?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  siteStudentDetailState = {
    ...defaultSiteStudentDetailState(),
    studentId: selectedStudentId,
    sourceSection,
    loading: true,
  };
  activeSection = sourceSection;
  renderAppShell("Loading student detail...");
  const result = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(selectedStudentId)}${query}`));
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loading: false,
    result,
  };
  currentData.siteStudentDetail = result;
  renderAppShell(result.ok ? "Student detail loaded." : "Student detail unavailable.", result.ok ? "success" : "error");
}

function handleSiteStudentDetailAction(event) {
  const action = event?.currentTarget?.dataset?.studentDetailAction;
  if (action === "close") {
    const sourceSection = cleanWorkspaceSection(siteStudentDetailState.sourceSection) || "students";
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = sourceSection;
    renderAppShell();
  }
}

async function selectSiteStudentDetailTab(event) {
  const tab = event?.currentTarget?.dataset?.studentDetailTab;
  if (!tab || !siteStudentDetailState.studentId) return;
  siteStudentDetailState = {
    ...siteStudentDetailState,
    activeTab: tab,
  };
  if (tab !== "timeline" || siteStudentDetailState.timelineResult || siteStudentDetailState.loadingTimeline) {
    renderAppShell();
    return;
  }
  const detail = unwrap(siteStudentDetailState.result);
  const siteId = selectedSiteQueryValue() || detail?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
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
  const roles = roleIds(currentUser);
  const canManage = roles.has("program_teacher") || roles.has("admin");
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Presentation day</p>
          <h2>Schedule And Check-In</h2>
        </div>
        <span class="workspace-chip">${slots.length} slot${slots.length === 1 ? "" : "s"}</span>
      </div>
      ${renderApiNotice(result)}
      <div class="workspace-list">
        ${slots.length ? slots.map((slot) => renderPresentationSlotRow(slot, canManage)).join("") : `
          <div class="workspace-empty" data-presentation-state="empty">
            Presentation slots will appear here after they are scheduled.
          </div>
        `}
      </div>
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
  const downloadMessage = scopedDownloadReady
    ? `Scoped archive manifest is ready${archive.downloadExpiresAt ? ` until ${formatDate(archive.downloadExpiresAt)}` : ""}.`
    : archive.downloadExpired
      ? "Archive package download expired. Ask staff to generate a fresh package."
      : "Scoped archive download is not ready yet.";
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
          <h2>Archive Package Access</h2>
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
            <strong>Drive package file</strong>
            <p>${escapeHtml(drivePackageStatus === "ready" ? "Drive-backed archive package is stored for scoped app delivery." : "Drive package file is pending until staff generates the archive after storage is ready.")}</p>
          </div>
          ${statusPill(drivePackageStatus)}
        </article>
        <article class="workspace-row" data-archive-retention-status="${escapeHtml(retention.policyStatus || "unknown")}">
          <div>
            <strong>Retention window</strong>
            <p>${escapeHtml(retention.policyReviewRequired ? "Retention policy needs school review before pilot archives." : `Archive downloads stay available for ${retention.downloadWindowDays || 14} days.`)}</p>
          </div>
          ${statusPill(retention.downloadExpiresSoon ? "expiring_soon" : retention.policyStatus || "policy_review_required")}
        </article>
      </div>
    </section>
  `;
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
    await loadWorkspaceData("Imported account setup is ready.");
  } catch (error) {
    lastAdminImportResult = null;
    activeSection = "adminUsers";
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
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
  if (roles.has("platform_admin")) return "Platform workspace is ready.";
  if (roles.has("org_admin")) return "Organization workspace is ready.";
  if (roles.has("site_admin")) return "Administration workspace is ready.";
  if (roles.has("student")) return "Your senior project is ready.";
  if (roles.has("program_teacher")) return "Teacher review is ready.";
  if (roles.has("mentor")) return "Mentor workspace is ready.";
  if (roles.has("viewer")) return "Viewer workspace is ready.";
  if (roles.has("admin")) return "Admin overview is ready.";
  return "Workspace is ready.";
}

function nextStepText() {
  const dashboard = unwrap(currentData.dashboard);
  if (dashboard?.nextAction) return dashboard.nextAction;
  const roles = roleIds(currentUser);
  if (roles.has("site_admin")) return "Review site progress, student readiness, mentor coverage, presentation status, and archive signals available to this account.";
  if (roles.has("org_admin")) return "Review assigned organization and site summaries available to this account.";
  if (roles.has("platform_admin")) return "Review platform setup and multisite readiness available to this account.";
  if (roles.has("viewer")) return "Review assigned site information in read-only mode.";
  if (roles.has("program_teacher") || roles.has("admin")) return "Review submitted work and follow up where students need feedback.";
  if (roles.has("mentor")) return "Check assigned students before mentor meetings and presentation preparation.";
  if (roles.has("misc_admin")) return "Review aggregate readiness without opening individual student records.";
  return "Ask your instructor to confirm your workspace role.";
}

function metric(label, value) {
  return `
    <article class="workspace-metric">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
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
          <span class="workspace-chip">${escapeHtml(statusText(item.severity || "info"))}</span>
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

function renderReviewQueueSummary(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No submitted or revision-requested records need teacher review right now.</div>`;
  return `
    <div class="workspace-list">
      ${rows.slice(0, 8).map((item) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(item.studentName || item.student_name || "Student")}</strong>
            <p>${escapeHtml(item.requirementTitle || item.requirement_title || "Capstone Project submission")} / ${safeNumber(item.evidenceCount ?? item.evidence_count)} evidence</p>
          </div>
          ${statusPill(item.status)}
        </article>
      `).join("")}
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

function renderSnapshotRows(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No status rows are available yet.</div>`;
  return `
    <div class="workspace-list">
      ${rows.map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(statusText(row.status))}</strong>
            <p>${safeNumber(row.count)} ${escapeHtml(pluralize(row.count, "record"))}</p>
          </div>
          ${statusPill(row.status)}
        </article>
      `).join("")}
    </div>
  `;
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
        return `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(row.studentName || "Student")}</strong>
              <p>${safeNumber(row.evidenceCount)} evidence / meeting ${escapeHtml(statusText(row.mentorMeetingStatus || "not_recorded"))} / presentation ${escapeHtml(statusText(row.presentationStatus || "not_scheduled"))}</p>
              ${attention.length ? `<p class="workspace-muted">${escapeHtml(attention.map(statusText).join(", "))}</p>` : ""}
            </div>
            <div class="workspace-row-actions">
              ${statusPill(row.submissionStatus || "not_started")}
              ${row.studentId ? `
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

function renderSubmissionRow(submission) {
  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(submission.requirement_title || "Capstone Project submission")}</strong>
        <p>Version ${escapeHtml(submission.version || 1)}. Updated ${escapeHtml(formatDate(submission.updated_at))}.</p>
      </div>
      ${statusPill(submission.status)}
    </article>
  `;
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

function normalizeStatus(value) {
  return String(value || "unknown").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "unknown";
}

const ROLE_LABELS = {
  platform_admin: "Platform Admin",
  admin: "Platform Admin",
  org_admin: "Organization Admin",
  site_admin: "Administration",
  program_teacher: "Program Teacher",
  mentor: "Mentor",
  viewer: "Viewer",
  student: "Student",
  misc_admin: "Reporting Viewer",
  role_pending: "Role pending",
};

function roleLabel(roleId) {
  return ROLE_LABELS[roleId] || statusText(roleId);
}

function roleIds(user) {
  return new Set((user?.roles || []).map((role) => role.role_id));
}

function hasSiteDashboardRole(roles) {
  return ["platform_admin", "admin", "org_admin", "site_admin", "viewer"].some((role) => roles.has(role));
}

function hasSiteStudentDirectoryRole(roles) {
  return ["platform_admin", "admin", "org_admin", "site_admin", "viewer", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteReviewQueueRole(roles) {
  return ["platform_admin", "admin", "org_admin", "site_admin", "viewer", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteMentorAssignmentRole(roles) {
  return ["platform_admin", "admin", "org_admin", "site_admin", "viewer", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteOperationsRole(roles) {
  return ["platform_admin", "admin", "org_admin", "site_admin", "viewer", "program_teacher"].some((role) => roles.has(role));
}

function defaultSiteStudentFilters() {
  return {
    search: "",
    programId: "",
    status: "",
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
    limit: 50,
    offset: 0,
  };
}

function defaultOperationsReadinessFilters() {
  return {
    programId: "",
    status: "",
    story: "",
    risk: "any",
    presentationStatus: "",
    archiveStatus: "",
    readiness: "",
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
    result: null,
    timelineResult: null,
  };
}

function defaultReviewQueueState() {
  return {
    selectedSubmissionId: "",
    historyResult: null,
    loadingHistory: false,
    decisionResult: null,
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
    reviewQueueState = defaultReviewQueueState();
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
    reviewQueueState = defaultReviewQueueState();
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
    "limit",
    "offset",
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
  if (booleanQueryValue(params.get("unassigned"))) filters.risk = "no_mentor";
  if (booleanQueryValue(params.get("overdue"))) filters.risk = "stale";
  filters.limit = clampDirectoryNumber(params.get("limit"), 50, 1, 100);
  filters.offset = clampDirectoryNumber(params.get("offset"), 0, 0, 100000);
  return filters;
}

function siteStudentFiltersFromSearchParams(params) {
  const filters = defaultSiteStudentFilters();
  filters.search = cleanSearchFilter(params.get("search"));
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.status = canonicalReviewQueueValue(params.get("status"), SITE_STUDENT_STATUS_VALUES);
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
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.status = canonicalReviewQueueValue(params.get("status"), OPERATIONS_STUDENT_STATUS_VALUES);
  filters.story = canonicalReviewQueueValue(params.get("story"), REVIEW_QUEUE_STORY_VALUES);
  filters.risk = canonicalReviewQueueValue(params.get("risk"), OPERATIONS_RISK_VALUES, "any");
  filters.presentationStatus = canonicalReviewQueueValue(params.get("presentationStatus"), OPERATIONS_PRESENTATION_STATUS_VALUES);
  filters.archiveStatus = canonicalReviewQueueValue(params.get("archiveStatus"), OPERATIONS_ARCHIVE_STATUS_VALUES);
  filters.readiness = canonicalReviewQueueValue(params.get("readiness"), OPERATIONS_READINESS_VALUES);
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
    if (filters.programId) url.searchParams.set("programId", filters.programId);
    if (filters.status) url.searchParams.set("status", filters.status);
    if (filters.story) url.searchParams.set("story", filters.story);
    if (filters.risk && filters.risk !== "any") url.searchParams.set("risk", filters.risk);
    if (filters.presentationStatus) url.searchParams.set("presentationStatus", filters.presentationStatus);
    if (filters.archiveStatus) url.searchParams.set("archiveStatus", filters.archiveStatus);
    if (filters.readiness) url.searchParams.set("readiness", filters.readiness);
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
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.status) params.set("status", filters.status);
  if (filters.story) params.set("story", filters.story);
  if (filters.risk && filters.risk !== "any") params.set("risk", filters.risk);
  if (filters.presentationStatus) params.set("presentationStatus", filters.presentationStatus);
  if (filters.archiveStatus) params.set("archiveStatus", filters.archiveStatus);
  if (filters.readiness) params.set("readiness", filters.readiness);
  if (safeNumber(filters.limit) !== 50) params.set("limit", String(filters.limit));
  if (safeNumber(filters.offset) > 0) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function primaryRoleForUser(user) {
  const roles = roleIds(user);
  for (const role of [
    "platform_admin",
    "admin",
    "org_admin",
    "site_admin",
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
  if (!role) return "Global scope";
  const scope = role.scope_id ? `${role.scope_type}:${role.scope_id}` : role.scope_type || "global";
  return `${roleLabel(primary)} / ${scope}`;
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
    const scope = role.scope_id ? `${role.scope_type}:${role.scope_id}` : role.scope_type || "global";
    return `<span class="workspace-chip workspace-role-chip" data-role-id="${escapeHtml(role.role_id)}">${escapeHtml(roleLabel(role.role_id))} / ${escapeHtml(scope)}</span>`;
  }).join("");
}

function scopeLabel(role) {
  if (!role) return "global";
  return role.scopeId ? `${role.scopeType || "global"}:${role.scopeId}` : role.scopeType || "global";
}

function updateAdminImportScopeFields() {
  const form = document.querySelector("#workspaceAdminImportForm");
  const roleSelect = form?.querySelector?.('[name="roleId"]');
  const scopeType = form?.querySelector?.('[name="scopeType"]');
  const scopeId = form?.querySelector?.('[name="scopeId"]');
  if (!roleSelect || !scopeType || !scopeId) return;

  const scopedTeacher = roleSelect.value === "program_teacher";
  scopeType.disabled = !scopedTeacher;
  if (!scopedTeacher) {
    scopeType.value = "global";
    scopeId.value = "";
    scopeId.disabled = true;
    return;
  }

  scopeId.disabled = scopeType.value === "global";
  if (scopeType.value === "global") scopeId.value = "";
}

function buildAdminImportBody(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const reason = String(values.reason || "").trim();
  const email = String(values.email || "").trim();
  const displayName = String(values.displayName || "").trim();
  const roleId = String(values.roleId || "").trim();
  let scopeType = roleId === "program_teacher" ? String(values.scopeType || "global").trim() : "global";
  let scopeId = roleId === "program_teacher" ? String(values.scopeId || "").trim() : "";

  if (!reason) return { ok: false, message: "Add the reason for this account import." };
  if (!email || !displayName || !roleId) return { ok: false, message: "Add the person's email, name, and role." };
  if (!["student", "mentor", "program_teacher", "admin", "misc_admin"].includes(roleId)) {
    return { ok: false, message: "Choose a supported workspace role." };
  }
  if (!["global", "program", "cohort"].includes(scopeType)) scopeType = "global";
  if (roleId === "program_teacher" && scopeType !== "global" && !scopeId) {
    return { ok: false, message: "Add the program or cohort id for that teacher scope." };
  }
  if (roleId !== "program_teacher") {
    scopeType = "global";
    scopeId = "";
  }

  return {
    ok: true,
    body: {
      reason,
      users: [{ email, displayName, roleId, scopeType, scopeId }],
    },
  };
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
  if (status === 401) return "Sign in again before importing accounts.";
  if (error === "credential_delivery_policy_required") {
    return "Real-user import is blocked until the credential delivery policy is approved. Use the approved pre-pilot roster, or implement an invitation or school-approved credential delivery path before importing real users.";
  }
  if (status === 403) return "This account cannot import users.";
  if (error === "missing_reason") return "Add the reason for this account import.";
  if (error === "invalid_user") return "Check the email, name, role, and scope before importing.";
  if (error === "duplicate_email" || error === "email_already_exists") return "That email is already included or already has an account.";
  if (error === "invalid_role_scope") return "That role and scope combination is not available.";
  if (error === "program_not_found") return "That program scope was not found.";
  if (error === "cohort_not_found") return "That cohort scope was not found.";
  if (error === "too_many_users") return "Import fewer accounts in one request.";
  return "Account import is unavailable right now. Check the details and try again.";
}

function messageForReviewDecisionError(error, status) {
  if (error === "submission_not_in_review") return "This submission is no longer in a submitted review state.";
  if (error === "not_found") return "This submission is outside the current site or teacher scope.";
  if (status === 401) return "Sign in again before saving review feedback.";
  if (status === 403) return "This role cannot save review decisions for this submission.";
  return "Review feedback could not be saved right now.";
}

function messageForMentorAssignmentError(error, status) {
  if (error === "active_assignment_exists") return "This student already has an active mentor assignment.";
  if (error === "reason_required") return "Add a reason before assigning a mentor.";
  if (error === "not_found") return "That student or mentor is outside the selected site assignment scope.";
  if (status === 401) return "Sign in again before assigning a mentor.";
  if (status === 403) return "This role cannot change mentor assignments for this site.";
  return "Mentor assignment could not be saved right now.";
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
