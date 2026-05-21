const workspaceMain = document.querySelector("#workspaceMain");

let currentUser = null;
let currentData = {
  authConfig: null,
  announcements: null,
  dashboard: null,
  adminDashboard: null,
  programTeacherDashboard: null,
  mentorDashboard: null,
  reviewQueue: null,
  mentorAssigned: null,
  presentationSlots: null,
  readiness: null,
  archiveReadiness: null,
  auditEvents: null,
};
let activeSection = "overview";
let busy = false;
let lastAdminImportResult = null;
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
    announcements: null,
    dashboard: null,
    adminDashboard: null,
    programTeacherDashboard: null,
    mentorDashboard: null,
    reviewQueue: null,
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
  const loaders = [
    ["announcements", apiJson("/api/announcements")],
  ];

  if (roles.has("student")) loaders.push(["dashboard", apiJson("/api/student/dashboard")]);
  if (roles.has("student")) loaders.push(["archiveReadiness", apiJson("/api/student/archive/readiness")]);
  if (roles.has("admin")) loaders.push(["adminDashboard", apiJson("/api/admin/dashboard")]);
  if (roles.has("program_teacher")) loaders.push(["programTeacherDashboard", apiJson("/api/program-teacher/dashboard")]);
  if (roles.has("program_teacher") || roles.has("admin")) loaders.push(["reviewQueue", apiJson("/api/teacher/review-queue")]);
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
        <div>
          <p class="workspace-kicker">Capstone Project workspace</p>
          <h1 id="signInTitle">Capstone Project Workspace</h1>
          <p>
            Review your project status, attach evidence, follow teacher feedback, and keep the
            required Capstone Project artifacts in one place.
          </p>
        </div>
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
  workspaceMain.innerHTML = `
    <section class="workspace-app" data-primary-role="${escapeHtml(primaryRole)}">
      <header class="workspace-topbar">
        <a class="workspace-brand" href="index.html">
          <span class="workspace-mark">SC</span>
          <span class="workspace-abc-motif" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>Capstone Project Workspace</span>
        </a>
        <div class="workspace-user">
          <div class="workspace-user-text">
            <strong>${escapeHtml(currentUser.displayName || "Signed in")}</strong>
            <span>${escapeHtml(currentUser.email || "")}</span>
          </div>
          <button class="workspace-button" id="workspaceRefresh" type="button">Refresh</button>
          <button class="workspace-button workspace-button-secondary" id="workspaceLogout" type="button">Sign out</button>
        </div>
      </header>
      <div class="workspace-content">
        <aside class="workspace-rail" aria-label="Workspace navigation">
          <section class="workspace-rail-card">
            <p class="workspace-kicker">Your access</p>
            <div class="workspace-role-banner">
              <strong>${escapeHtml(statusText(primaryRole))}</strong>
              <span>${escapeHtml(roleScopeSummary(currentUser))}</span>
            </div>
            <div class="workspace-chip-row">
              ${roleChips(currentUser)}
            </div>
          </section>
          <nav class="workspace-tabs" aria-label="Workspace sections">
            ${sections.map((section) => `
              <button class="workspace-tab ${section.id === activeSection ? "is-active" : ""}" data-section="${escapeHtml(section.id)}" type="button" ${section.id === activeSection ? 'aria-current="page"' : ""}>
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
          ${renderActiveSection()}
        </div>
      </div>
    </section>
  `;

  document.querySelector("#workspaceRefresh")?.addEventListener("click", () => loadWorkspaceData("Workspace refreshed."));
  document.querySelector("#workspaceLogout")?.addEventListener("click", signOut);
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      activeSection = button.dataset.section;
      renderAppShell();
    });
  });
  bindWorkspaceForms();
}

function availableSections() {
  const roles = roleIds(currentUser);
  const sections = [{ id: "overview", label: "Overview", detail: "Announcements and current priorities" }];
  if (roles.has("student")) sections.push({ id: "student", label: "Student Workspace", detail: "Progress, submissions, and evidence" });
  if (roles.has("student")) sections.push({ id: "archive", label: "Archive", detail: "Closeout and May 5 package" });
  if (roles.has("mentor")) sections.push({ id: "mentorDashboard", label: "Mentor Dashboard", detail: "Assigned student risks" });
  if (roles.has("mentor")) sections.push({ id: "mentor", label: "Assigned Students", detail: "Assigned students and evidence counts" });
  if (roles.has("program_teacher")) sections.push({ id: "programDashboard", label: "Program Dashboard", detail: "Scoped cohort and review risks" });
  if (roles.has("program_teacher") || roles.has("admin")) sections.push({ id: "teacher", label: "Teacher Review", detail: "Review queue and submitted work" });
  if (roles.has("student") || roles.has("mentor") || roles.has("program_teacher") || roles.has("admin")) {
    sections.push({ id: "presentation", label: "Presentation", detail: "Schedule, outline, and day-of status" });
  }
  if (roles.has("admin")) sections.push({ id: "mentorAssignments", label: "Mentors / Assignments", detail: "Coverage and assignment signals" });
  if (roles.has("admin") || roles.has("misc_admin")) sections.push({ id: "readiness", label: "Readiness", detail: "Aggregate project readiness" });
  if (roles.has("admin")) sections.push({ id: "adminUsers", label: "Users & Access", detail: "Import accounts and setup access" });
  if (roles.has("admin")) sections.push({ id: "audit", label: "Audit", detail: "Recent protected-record activity" });
  if (roles.has("admin")) sections.push({ id: "archiveExports", label: "Archive / Exports", detail: "Closeout package status" });
  sections.push({ id: "security", label: "Security", detail: "Password and session controls" });
  return sections;
}

function renderActiveSection() {
  if (activeSection === "security") return renderSecuritySection();
  if (activeSection === "student") return renderStudentSection();
  if (activeSection === "programDashboard") return renderProgramTeacherDashboardSection();
  if (activeSection === "teacher") return renderTeacherSection();
  if (activeSection === "mentorDashboard") return renderMentorDashboardSection();
  if (activeSection === "mentor") return renderMentorSection();
  if (activeSection === "presentation") return renderPresentationSection();
  if (activeSection === "archive") return renderArchiveSection();
  if (activeSection === "adminUsers") return renderAdminUsersSection();
  if (activeSection === "mentorAssignments") return renderAdminMentorAssignmentsSection();
  if (activeSection === "audit") return renderAdminAuditSection();
  if (activeSection === "archiveExports") return renderAdminArchiveExportsSection();
  if (activeSection === "readiness") return renderReadinessSection();
  return renderOverviewSection();
}

function renderOverviewSection() {
  const primaryRole = primaryRoleForUser(currentUser);
  if (primaryRole === "admin") return renderAdminOverviewSection();
  if (primaryRole === "program_teacher") return renderProgramTeacherDashboardSection();
  if (primaryRole === "mentor") return renderMentorDashboardSection();
  if (primaryRole === "student") return renderStudentSection();
  if (primaryRole === "misc_admin") return renderReadinessSection();
  const announcements = unwrap(currentData.announcements)?.announcements || [];
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
          <p class="workspace-kicker">Announcements</p>
          <h2>Current Updates</h2>
        </div>
      </div>
      ${renderApiNotice(currentData.announcements)}
      <div class="workspace-list">
        ${announcements.length ? announcements.map((item) => `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.body)}</p>
            </div>
            <span class="workspace-chip">${escapeHtml(formatDate(item.createdAt))}</span>
          </article>
        `).join("") : `<div class="workspace-empty">No current announcements are posted for your role.</div>`}
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
      <h2>Workspace assignment is not active yet</h2>
      <p>
        Your account has a workspace role, but there are no active student assignments for
        ${escapeHtml(noAssignmentSections.join(", "))}. Ask the project coordinator to confirm the assignment.
      </p>
    </section>
    ` : ""}
    ${deniedSections.length ? `
    <section class="workspace-card workspace-error-card" data-workspace-state="permission-denied">
      <p class="workspace-kicker">Permission denied</p>
      <h2>Some workspace sections need different access</h2>
      <p>
        Your account is signed in, but the role or scope on this account does not permit the
        requested section.
      </p>
      <ul class="workspace-compact-list">
        ${deniedSections.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
    </section>
    ` : ""}
  `;
}

function deniedWorkspaceSections() {
  return [
    ["dashboard", "Student workspace"],
    ["adminDashboard", "Admin command center"],
    ["programTeacherDashboard", "Program dashboard"],
    ["mentorDashboard", "Mentor dashboard"],
    ["reviewQueue", "Teacher review"],
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
        ${renderMetricTile("Students", summary.studentsActive, `${safeNumber(summary.studentsNoMentor)} without active mentor`, "admin", "mentorAssignments")}
        ${renderMetricTile("Submitted", summary.submissionsSubmitted, "Ready for review", "teacher", "teacher")}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Open revision loops", "warning", "teacher")}
        ${renderMetricTile("Approved", summary.approved, "Accepted submissions", "student")}
        ${renderMetricTile("Evidence", summary.evidenceArtifacts, "Persisted artifacts", "mentor")}
        ${renderMetricTile("Presentations", summary.presentationScheduled, "Scheduled slots", "teacher", "presentation")}
        ${renderMetricTile("Exports", summary.exportsQueued, exportsAttention, safeNumber(summary.exportsFailed) ? "danger" : "admin", "archiveExports")}
        ${renderMetricTile("Audit", summary.recentAuditEvents, "Recent protected activity", "admin", "audit")}
      </div>
      ${renderDashboardCard("Needs Attention", "Operational risks", renderNeedsAttention(dashboard.needsAttention))}
      ${renderDashboardCard("Program Breakdown", "Scoped source records", renderProgramBreakdown(dashboard.programBreakdown))}
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
        ${renderMetricTile("Evidence", summary.evidenceArtifacts, "Attached artifacts", "mentor")}
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
      ${assigned.length ? renderDashboardCard("Assigned Students", "Active mentor scope", renderMentorStudentCards(assigned)) : `
        <section class="workspace-dashboard-card workspace-empty" data-workspace-state="no-active-assignment">
          <strong>Workspace assignment is not active yet</strong>
          <span>Mentor students</span>
          No students are assigned to this mentor account yet.
        </section>
      `}
    </section>
  `;
}

function renderAdminMentorAssignmentsSection() {
  const dashboard = unwrap(currentData.adminDashboard);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Mentors / assignments</p>
        <h2>Coverage data unavailable</h2>
        ${renderApiNotice(currentData.adminDashboard)}
      </section>
    `;
  }
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Mentors / Assignments</p>
          <h1>Coverage Snapshot</h1>
          <p>Active assignments and no-mentor counts are derived from the current assignment table.</p>
        </div>
        <span class="workspace-chip">${safeNumber(dashboard.summary?.mentorAssignmentsActive)} active assignments</span>
      </div>
      ${renderDashboardCard("Mentor Coverage", "Active assignment load", renderMentorCoverage(dashboard.mentorCoverage, dashboard.summary || {}))}
      ${renderDashboardCard("Needs Attention", "Coverage risks", renderNeedsAttention((dashboard.needsAttention || []).filter((item) => item.type === "mentor_coverage" || item.type === "mentor_meetings")))}
    </section>
  `;
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
          <p>Recent activity is summarized without sensitive metadata.</p>
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
        ${renderApiNotice(result)}
      </section>
    `;
  }

  const submissions = dashboard.submissions || [];
  const evidence = dashboard.evidence || [];
  const progress = dashboard.progress || [];
  return `
    <section class="workspace-card workspace-hero-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Student workspace</p>
          <h2>Current Project Status</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(dashboard.viewer?.self ? "Own record" : "Scoped view")}</span>
      </div>
      <p>${escapeHtml(dashboard.nextAction || "Review your current Capstone Project status.")}</p>
      <div class="workspace-grid">
        ${metric("Submissions", submissions.length)}
        ${metric("Evidence", evidence.length)}
        ${metric("Progress Items", progress.length)}
      </div>
    </section>
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Required artifacts</p>
          <h2>Submit Evidence</h2>
        </div>
      </div>
      ${submissions.length ? renderEvidenceForms(submissions) : `<div class="workspace-empty">No active submission is ready for evidence yet.</div>`}
    </section>
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Submissions</p>
          <h2>Teacher Review Status</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${submissions.length ? submissions.map(renderSubmissionRow).join("") : `<div class="workspace-empty">No submissions have been started yet.</div>`}
      </div>
    </section>
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Evidence</p>
          <h2>Uploaded And Linked Work</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${evidence.length ? evidence.map(renderEvidenceRow).join("") : `<div class="workspace-empty">Evidence will appear here after you attach a link or upload a file.</div>`}
      </div>
    </section>
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
            Artifact type
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
            Artifact type
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
        <p class="workspace-muted">Files up to 20 MB are accepted when storage is configured for this environment.</p>
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
    return renderPermissionDeniedSection("Teacher review", "submitted student work");
  }
  const body = unwrap(result);
  const queue = body?.queue || [];
  return `
    <section class="workspace-card">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Teacher review</p>
          <h2>Submitted Work</h2>
        </div>
        <span class="workspace-chip">${queue.length} item${queue.length === 1 ? "" : "s"}</span>
      </div>
      ${renderApiNotice(result)}
      <div class="workspace-table">
        ${queue.length ? queue.map((item) => `
          <article class="workspace-table-row">
            <div>
              <strong>${escapeHtml(item.student_name || "Student")}</strong>
              <span class="workspace-muted">${escapeHtml(item.requirement_title || "Capstone Project submission")}</span>
            </div>
            <span>${escapeHtml(item.evidence_count || 0)} evidence item${Number(item.evidence_count || 0) === 1 ? "" : "s"}</span>
            ${statusPill(item.status)}
          </article>
        `).join("") : `<div class="workspace-empty">No submissions are waiting for review right now.</div>`}
      </div>
    </section>
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
}

function bindUploadRetryButton() {
  document.querySelector('[data-upload-action="retry"]')?.addEventListener("click", retryEvidenceUpload);
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
            <p>Private storage identifiers stay hidden from this workspace.</p>
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
      <p class="workspace-kicker">Permission denied</p>
      <h2>${escapeHtml(title)} unavailable</h2>
      <p>
        Some workspace sections need different access.
        This signed-in account does not have the role or scope required for ${escapeHtml(detail)}.
        Use another assigned account or ask the project coordinator to adjust access.
      </p>
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
  if (roles.has("student")) return "Your senior project is ready.";
  if (roles.has("program_teacher")) return "Teacher review is ready.";
  if (roles.has("mentor")) return "Mentor workspace is ready.";
  if (roles.has("admin")) return "Admin overview is ready.";
  return "Workspace is ready.";
}

function nextStepText() {
  const dashboard = unwrap(currentData.dashboard);
  if (dashboard?.nextAction) return dashboard.nextAction;
  const roles = roleIds(currentUser);
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

function renderMetricTile(label, value, detail = "", tone = "", actionSection = "") {
  const action = actionSection
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(actionSection)}">Open</button>`
    : "";
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
    return `<div class="workspace-empty">No dashboard risks need attention right now.</div>`;
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
  if (!rows.length) return `<div class="workspace-empty">No program records are available in this scope.</div>`;
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
        </article>
      `).join("")}
    </div>
  `;
}

function renderReviewQueueSummary(rows = []) {
  if (!rows.length) return `<div class="workspace-empty">No submitted or revision records are waiting right now.</div>`;
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
          ${statusPill("attention_required")}
        </article>
      ` : ""}
      ${rows.length ? rows.slice(0, 8).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${safeNumber(row.activeAssignments)} active ${escapeHtml(pluralize(row.activeAssignments, "assignment"))}</p>
          </div>
          ${statusPill(safeNumber(row.activeAssignments) ? "active" : "no_active_assignments")}
        </article>
      `).join("") : `<div class="workspace-empty">No mentor coverage records are available yet.</div>`}
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
  if (!rows.length) return `<div class="workspace-empty">No students are currently visible in this scope.</div>`;
  return `
    <div class="workspace-list">
      ${rows.slice(0, 12).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <p>${safeNumber(row.evidenceCount)} evidence / ${row.noMentor ? "mentor needed" : "mentor assigned"}</p>
          </div>
          ${statusPill(row.submissionStatus || "not_started")}
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
            ${statusPill(row.submissionStatus || "not_started")}
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
        <p>${escapeHtml(statusText(item.source_kind || "evidence"))} / ${escapeHtml(item.artifact_type || "artifact")}</p>
      </div>
      <div class="workspace-row-actions">
        ${actions.join("")}
        ${statusPill(item.review_status || "pending_review")}
      </div>
    </article>
  `;
}

function statusPill(status) {
  const normalized = String(status || "unknown").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  return `<span class="workspace-status-pill ${escapeHtml(normalized)}">${escapeHtml(statusText(status))}</span>`;
}

function statusText(value) {
  return String(value || "Unknown").replace(/_/g, " ");
}

function roleIds(user) {
  return new Set((user?.roles || []).map((role) => role.role_id));
}

function primaryRoleForUser(user) {
  const roles = roleIds(user);
  for (const role of ["admin", "program_teacher", "mentor", "student", "misc_admin"]) {
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
  return `${statusText(primary)} / ${scope}`;
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
    return `<span class="workspace-chip">${escapeHtml(statusText(role.role_id))} / ${escapeHtml(scope)}</span>`;
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
