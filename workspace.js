const workspaceMain = document.querySelector("#workspaceMain");

let currentUser = null;
let currentData = {
  announcements: null,
  dashboard: null,
  reviewQueue: null,
  mentorAssigned: null,
  readiness: null,
};
let activeSection = "overview";
let busy = false;

init();

async function init() {
  await loadSession();
}

async function loadSession() {
  renderLoading("Checking your session...");
  try {
    const response = await fetch("/api/auth/me", { headers: { accept: "application/json" } });
    const data = await safeJson(response);
    if (!response.ok || !data?.authenticated) {
      currentUser = null;
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
    renderSignIn(messageForNetworkError(error), "error");
  }
}

async function loadWorkspaceData(statusMessage = "") {
  if (!currentUser) {
    renderSignIn();
    return;
  }

  renderAppShell(statusMessage || "Loading your workspace...");
  const roles = roleIds(currentUser);
  const loaders = [
    ["announcements", apiJson("/api/announcements")],
  ];

  if (roles.has("student")) loaders.push(["dashboard", apiJson("/api/student/dashboard")]);
  if (roles.has("program_teacher") || roles.has("admin")) loaders.push(["reviewQueue", apiJson("/api/teacher/review-queue")]);
  if (roles.has("mentor")) loaders.push(["mentorAssigned", apiJson("/api/mentor/assigned")]);
  if (roles.has("admin") || roles.has("misc_admin")) loaders.push(["readiness", apiJson("/api/reports/readiness")]);

  const results = await Promise.all(loaders.map(async ([key, promise]) => [key, await settleApi(promise)]));
  currentData = {
    announcements: null,
    dashboard: null,
    reviewQueue: null,
    mentorAssigned: null,
    readiness: null,
  };

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

function renderSignIn(message = "", tone = "neutral", workspaceState = "signed-out") {
  workspaceMain.innerHTML = `
    <section class="workspace-auth" aria-labelledby="signInTitle" data-workspace-state="${escapeHtml(workspaceState)}">
      <div class="workspace-auth-intro">
        <a class="workspace-brand" href="index.html">
          <span class="workspace-mark">SC</span>
          <span>Senior Capstone</span>
        </a>
        <div>
          <p class="workspace-kicker">Senior Project Workspace</p>
          <h1 id="signInTitle">Senior Project Workspace</h1>
          <p>
            Review your project status, attach evidence, follow teacher feedback, and keep the
            required Senior Project artifacts in one place.
          </p>
        </div>
      </div>
      <div class="workspace-auth-panel">
        <div>
          <p class="workspace-kicker">Account access</p>
          <h2>Sign in to continue</h2>
        </div>
        ${message ? statusHtml(message, tone) : ""}
        <form id="workspaceLoginForm" class="workspace-form">
          <label class="workspace-label">
            Email
            <input class="workspace-input" id="workspaceEmail" name="email" type="email" autocomplete="username" required>
          </label>
          <label class="workspace-label">
            Password
            <input class="workspace-input" id="workspacePassword" name="password" type="password" autocomplete="current-password" required>
          </label>
          <button class="workspace-button workspace-button-primary" type="submit">Sign in</button>
        </form>
        <p class="workspace-muted">
          Need access or a password reset? Contact your instructor or Senior Project coordinator.
        </p>
        <a class="workspace-link-button" href="index.html">Return to the guide</a>
      </div>
    </section>
  `;

  document.querySelector("#workspaceLoginForm")?.addEventListener("submit", signIn);
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
      renderSignIn(messageForAuthError(data?.error, response.status), "error", workspaceStateForAuthError(data?.error));
      document.querySelector("#workspaceEmail").value = email;
      return;
    }
    await loadSession();
  } catch (error) {
    renderSignIn(messageForNetworkError(error), "error");
    document.querySelector("#workspaceEmail").value = email;
  }
}

function renderAppShell(statusMessage = "", tone = "neutral") {
  if (!currentUser) {
    renderSignIn();
    return;
  }

  const sections = availableSections();
  workspaceMain.innerHTML = `
    <section class="workspace-app">
      <header class="workspace-topbar">
        <a class="workspace-brand" href="index.html">
          <span class="workspace-mark">SC</span>
          <span>Senior Project Workspace</span>
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
            <div class="workspace-chip-row">
              ${roleChips(currentUser)}
            </div>
          </section>
          <nav class="workspace-tabs" aria-label="Workspace sections">
            ${sections.map((section) => `
              <button class="workspace-tab ${section.id === activeSection ? "is-active" : ""}" data-section="${escapeHtml(section.id)}" type="button">
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
  if (roles.has("program_teacher") || roles.has("admin")) sections.push({ id: "teacher", label: "Teacher Review", detail: "Review queue and submitted work" });
  if (roles.has("mentor")) sections.push({ id: "mentor", label: "Mentor Students", detail: "Assigned students and evidence counts" });
  if (roles.has("admin") || roles.has("misc_admin")) sections.push({ id: "readiness", label: "Readiness", detail: "Aggregate project readiness" });
  return sections;
}

function renderActiveSection() {
  if (activeSection === "student") return renderStudentSection();
  if (activeSection === "teacher") return renderTeacherSection();
  if (activeSection === "mentor") return renderMentorSection();
  if (activeSection === "readiness") return renderReadinessSection();
  return renderOverviewSection();
}

function renderOverviewSection() {
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
          or Senior Project coordinator to assign the right access before using protected project sections.
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
        ${escapeHtml(noAssignmentSections.join(", "))}. Ask the Senior Project coordinator to confirm the assignment.
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
    ["reviewQueue", "Teacher review"],
    ["mentorAssigned", "Mentor students"],
    ["readiness", "Readiness report"],
  ]
    .filter(([key]) => currentData[key]?.status === 403)
    .map(([, label]) => label);
}

function noAssignmentWorkspaceSections() {
  const labels = [];
  const roles = roleIds(currentUser);
  const mentorAssigned = unwrap(currentData.mentorAssigned)?.assignedStudents;
  if (roles.has("mentor") && Array.isArray(mentorAssigned) && mentorAssigned.length === 0) {
    labels.push("Mentor students");
  }
  return labels;
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
      <p>${escapeHtml(dashboard.nextAction || "Review your current Senior Project status.")}</p>
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
    <option value="${escapeHtml(submission.id)}">${escapeHtml(submission.requirement_title || "Senior Project submission")} - ${escapeHtml(statusText(submission.status))}</option>
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
            <input class="workspace-input" name="file" type="file" accept="image/*,.pdf,.txt,.csv,.docx,.pptx,.xlsx,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required>
          </label>
        </div>
        <p class="workspace-muted">Files up to 20 MB are accepted when storage is configured for this environment.</p>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Upload file</button>
        </div>
      </form>
    </div>
  `;
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
              <span class="workspace-muted">${escapeHtml(item.requirement_title || "Senior Project submission")}</span>
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

function bindWorkspaceForms() {
  document.querySelector("#workspaceEvidenceLinkForm")?.addEventListener("submit", attachEvidenceLink);
  document.querySelector("#workspaceFileUploadForm")?.addEventListener("submit", uploadEvidenceFile);
}

function renderPermissionDeniedSection(title, detail) {
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="permission-denied">
      <p class="workspace-kicker">Permission denied</p>
      <h2>${escapeHtml(title)} unavailable</h2>
      <p>
        This signed-in account does not have the role or scope required for ${escapeHtml(detail)}.
        Use another assigned account or ask the Senior Project coordinator to adjust access.
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
  busy = true;
  const form = event.currentTarget;
  const formData = new FormData(form);
  const file = formData.get("file");
  const submissionId = String(formData.get("submissionId") || "");
  setFormBusy(form, true);

  if (!file || typeof file !== "object" || !Number.isFinite(file.size)) {
    busy = false;
    renderAppShell("Choose a file before uploading.", "error");
    return;
  }
  if (file.size <= 0) {
    busy = false;
    renderAppShell("The selected file is empty. Choose a file with content and try again.", "error");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    busy = false;
    renderAppShell("This file is larger than the current 20 MB limit. Choose a smaller file or ask your instructor for help.", "error");
    return;
  }

  try {
    const response = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}/evidence/upload`, {
      method: "POST",
      headers: { accept: "application/json" },
      body: formData,
    });
    const body = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForUploadError(body?.error, response.status), response.status === 503 ? "neutral" : "error");
      return;
    }
    await loadWorkspaceData("Your file was received and added to your Senior Project evidence.");
  } catch (error) {
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
    currentData = {};
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

function renderSubmissionRow(submission) {
  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(submission.requirement_title || "Senior Project submission")}</strong>
        <p>Version ${escapeHtml(submission.version || 1)}. Updated ${escapeHtml(formatDate(submission.updated_at))}.</p>
      </div>
      ${statusPill(submission.status)}
    </article>
  `;
}

function renderEvidenceRow(item) {
  return `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(item.title || "Evidence")}</strong>
        <p>${escapeHtml(statusText(item.source_kind || "evidence"))} / ${escapeHtml(item.artifact_type || "artifact")}</p>
      </div>
      ${statusPill(item.review_status || "pending_review")}
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

function roleChips(user) {
  const roles = user?.roles || [];
  if (!roles.length) return `<span class="workspace-chip">Role pending</span>`;
  return roles.map((role) => {
    const scope = role.scope_id ? `${role.scope_type}:${role.scope_id}` : role.scope_type || "global";
    return `<span class="workspace-chip">${escapeHtml(statusText(role.role_id))} / ${escapeHtml(scope)}</span>`;
  }).join("");
}

function artifactTypeOptions() {
  return [
    ["planning_document", "Planning document"],
    ["reflection", "Reflection"],
    ["rubric", "Rubric"],
    ["photo", "Photo"],
    ["presentation", "Presentation"],
    ["other", "Other"],
  ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function messageForAuthError(error, status) {
  if (error === "invalid_credentials") return "We could not sign you in with that email and password.";
  if (error === "password_reset_required") return "This account needs a password reset. Contact your instructor or Senior Project coordinator.";
  if (error === "rate_limited" || status === 429) return "Too many sign-in attempts. Wait a few minutes and try again.";
  return "Sign-in is unavailable right now. Try again or contact your instructor.";
}

function messageForSessionStateError(error, status) {
  if (error === "session_expired") return "Your session has ended. Sign in again to continue.";
  if (error === "account_disabled") return "This account is not active. Contact your instructor or Senior Project coordinator.";
  if (error === "password_reset_required") return "This account needs a password reset. Contact your instructor or Senior Project coordinator.";
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
