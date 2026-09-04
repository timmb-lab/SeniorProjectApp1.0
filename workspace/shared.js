async function signOut() {
  renderAppShell("Signing out...");
  try {
    await fetch("/api/auth/logout", { method: "POST", headers: { accept: "application/json" } });
  } finally {
    currentUser = null;
    resetAccountScopedWorkspaceState();
    currentData = defaultCurrentData(currentData.authConfig);
    workspaceConnectionState = defaultWorkspaceConnectionState();
    lastAdminImportResult = null;
    lastAdminPasswordResetResult = null;
    adminPeopleView = "manage-students";
    adminCsvImportState = defaultAdminCsvImportState();
    studentRequirementDetailState = defaultStudentRequirementDetailState();
    studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
    studentSubmissionFilter = defaultStudentSubmissionFilter();
    reviewQueueState = defaultReviewQueueState();
    reviewQueueFilters = defaultReviewQueueFilters();
    viewAsStudentState = defaultViewAsStudentState();
    presentationSlotFilter = "all";
    adminArchiveExportFilter = "all";
    resetWorkspaceLandingState();
    if (typeof window !== "undefined" && window.history) {
      window.history.replaceState({}, "", window.location.pathname || "/workspace");
    }
    renderSignIn("You have signed out.", "success");
  }
}

function setFormBusy(form, isBusy) {
  form.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = isBusy;
  });
}

async function apiJson(url, options = {}) {
  const timeoutController = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = timeoutController ? setTimeout(() => timeoutController.abort(), 15000) : null;
  const workingModeHeaders = workspaceApiWorkingModeHeaders();
  try {
    const response = await fetch(url, {
      ...options,
      headers: { accept: "application/json", ...(options.headers || {}), ...workingModeHeaders },
      signal: options.signal || timeoutController?.signal,
    });
    const body = await safeJson(response);
    if (!response.ok) {
      return { ok: false, status: response.status, error: body?.error || "request_failed", body };
    }
    return { ok: true, status: response.status, body };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function workspaceApiWorkingModeHeaders() {
  if (!currentUser || !canSwitchAdminRoleMode(currentUser)) return {};
  const mode = cleanAdminRoleMode(activeAdminRoleMode);
  const siteId = mode === "site_admin" ? cleanDirectoryFilter(selectedSiteId || selectedSiteQueryValue()) : "";
  return {
    "x-capstone-admin-mode": mode,
    ...(siteId ? { "x-capstone-site-id": siteId } : {}),
  };
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

function canUseViewAsStudent(roles = roleIds(currentUser)) {
  if (!roles?.size || roles.has("student")) return false;
  return hasGlobalAdminRole(roles)
    || roles.has("site_admin")
    || roles.has("administration")
    || roles.has("program_teacher")
    || roles.has("mentor")
    || roles.has("viewer");
}

function isViewAsStudentActive() {
  return Boolean(cleanDirectoryFilter(viewAsStudentState.studentId) && canUseViewAsStudent(roleIds(currentUser)));
}

function viewAsStudentDisplayName() {
  const dashboard = unwrap(currentData.dashboard);
  const name = String(
    viewAsStudentState.studentName
      || dashboard?.student?.displayName
      || dashboard?.studentName
      || "",
  ).trim();
  return name || "Selected student";
}

function renderViewAsStudentBanner() {
  if (!isViewAsStudentActive()) return "";
  const source = studentDetailReturnCopy(viewAsStudentState.sourceSection || "students");
  const staffRole = roleLabel(primaryRoleForUser(currentUser));
  const staffName = currentUser?.displayName || currentUser?.email || "Signed-in staff";
  const readOnlyCopy = roleIds(currentUser).has("viewer")
    ? "Viewer access stays read-only while previewing the student workspace."
    : "This is a read-only staff preview of the student workspace.";
  return `
    <section class="workspace-view-as-banner" data-view-as-student-banner="true" data-view-as-student-mode="safe-preview" aria-label="View as student mode">
      <div class="workspace-view-as-banner-copy">
        <span>Viewing as: ${escapeHtml(viewAsStudentDisplayName())}</span>
        <small>You can look around. Nothing can be changed here.</small>
        <details class="workspace-view-as-safety">
          <summary>Preview safety</summary>
          <small data-view-as-student-staff-context="true">Staff account: ${escapeHtml(staffName)} (${escapeHtml(staffRole)}). Staff identity and permissions remain active behind this preview.</small>
          <div class="workspace-view-as-banner-chips" aria-label="Preview safeguards">
            <span class="workspace-view-as-chip">Read-only preview</span>
            <span class="workspace-view-as-chip">Authorized student only</span>
            <span class="workspace-view-as-chip">No student changes saved here</span>
            <span class="workspace-view-as-chip">No proof or account changes</span>
          </div>
          <small>${escapeHtml(readOnlyCopy)} Exit returns to ${escapeHtml(source.label)}.</small>
        </details>
      </div>
      <button class="workspace-button workspace-button-secondary" type="button" data-view-as-student-action="exit">
        Exit student view
      </button>
    </section>
  `;
}

function renderViewAsStudentAction(studentId, studentName = "", options = {}) {
  const normalizedStudentId = cleanDirectoryFilter(studentId || "");
  if (!normalizedStudentId || !canUseViewAsStudent(roleIds(currentUser))) return "";
  const sourceSection = cleanWorkspaceSection(options.sourceSection || activeSection) || "students";
  const label = options.label || "View as Student";
  const name = String(studentName || "").trim().slice(0, 160);
  const accessibleName = name ? `View ${name} as a read-only student preview` : "View as a read-only student preview";
  return `
    <button
      class="workspace-link-button workspace-link-button-small workspace-view-as-action"
      type="button"
      data-view-as-student-action="enter"
      data-view-as-student-id="${escapeHtml(normalizedStudentId)}"
      data-view-as-student-name="${escapeHtml(name)}"
      data-view-as-student-source-section="${escapeHtml(sourceSection)}"
      aria-label="${escapeHtml(accessibleName)}"
    >
      <span>${escapeHtml(label)}</span>
      <small>Read-only preview</small>
    </button>
  `;
}

function renderViewAsStudentReadOnlyNotice() {
  const roles = roleIds(currentUser);
  const detail = roles.has("viewer")
    ? "Viewer role remains read-only. Student proof, submissions, passwords, and review decisions cannot be changed from this preview."
    : "Staff preview is read-only by default. Use the normal staff workspace when a proven staff workflow owns a change.";
  return `
    <section class="workspace-view-as-readonly" data-view-as-student-readonly="true">
      <strong>Safe preview only</strong>
      <p>${escapeHtml(detail)}</p>
    </section>
  `;
}

function greetingForUser() {
  const roles = roleIds(currentUser);
  if (hasGlobalAdminRole(roles)) return "Global Admin workspace is ready.";
  if (roles.has("site_admin")) return "Site Admin workspace is ready.";
  if (roles.has("administration")) return "School Admin workspace is ready.";
  if (roles.has("student")) return "Your senior project is ready.";
  if (roles.has("program_teacher")) return "Program Teacher review is ready.";
  if (roles.has("mentor")) return "Mentor workspace is ready.";
  if (roles.has("viewer")) return "Viewer workspace is ready.";
  return "Workspace is ready.";
}

function nextStepText() {
  const dashboard = unwrap(currentData.dashboard);
  if (dashboard?.nextAction) return dashboard.nextAction;
  const roles = roleIds(currentUser);
  if (roles.has("student")) {
    if (dashboard) return studentSidebarNextStepText(dashboard);
    return "Open My Work to see your next Senior Project task, proof, feedback, and status.";
  }
  if (roles.has("site_admin")) return "Review site progress, student readiness, mentor coverage, presentation status, and final-file signals available to this account.";
  if (roles.has("administration")) return "Review assigned school students, readiness, presentation, progress dashboards, and access needs.";
  if (hasGlobalAdminRole(roles)) return "Review platform setup and multisite readiness available to this account.";
  if (roles.has("viewer")) return "Review assigned students in read-only mode.";
  if (roles.has("program_teacher")) return "Review work students sent in and follow up where students need feedback.";
  if (roles.has("mentor")) return "Check assigned students before mentor meetings and presentation preparation.";
  if (roles.has("misc_admin")) return "Review aggregate readiness without opening individual student records.";
  return "Ask your instructor to confirm your workspace role.";
}

function studentSidebarNextStepText(dashboard = {}) {
  const summary = studentProgressSummary(dashboard);
  const nextSteps = Array.isArray(dashboard.nextSteps) ? dashboard.nextSteps : [];
  const archiveNextAction = studentArchivePrimaryNextAction(unwrap(currentData.archiveReadiness));
  const action = studentPrimaryNextAction(summary, nextSteps, archiveNextAction);
  const title = studentInstructionCopy(action?.title || "");

  if (summary.revisionRequestedCount) {
    return title
      ? `Fix ${title} first, then turn it in again.`
      : "Fix feedback first, then turn it in again.";
  }
  if (summary.waitingForReviewCount) {
    return "Check what you turned in, then wait for your teacher before starting the next phase.";
  }
  if (summary.missingRequiredCount) {
    return title
      ? `Open My Work and finish ${title}.`
      : "Open My Work and finish the current phase item.";
  }
  if (archiveNextAction?.status) {
    return "Open Final Files to see what still needs to be saved by May 5.";
  }
  return "Open My Work and follow the first action shown at the top.";
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
  const customActionHtml = actionOptions.actionHtml || "";
  const hasSectionAction = actionSection && availableSectionIdsForAnyMode().has(actionSection);
  const hasAction = Boolean(hasSectionAction || customActionHtml);
  const action = hasSectionAction
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(actionSection)}"${actionPreset}>${escapeHtml(actionLabel)}</button>`
    : (customActionHtml || `<span class="workspace-summary-badge">Summary only</span>`);
  return `
    <article class="workspace-metric-tile ${escapeHtml(tone)} ${hasAction ? "workspace-action-metric" : "workspace-summary-only-metric"}" data-metric-behavior="${hasAction ? "action" : "summary"}">
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(safeNumber(value))}</strong>
        ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
      </div>
      ${action}
    </article>
  `;
}

function renderSummaryStrip(items = [], options = {}) {
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!rows.length) return "";
  const label = options.label || "Secondary summary";
  return `
    <div class="workspace-summary-strip ${escapeHtml(options.className || "")}" aria-label="${escapeHtml(label)}">
      ${rows.map((item) => `
        <article class="workspace-summary-strip-item ${escapeHtml(item.tone || "")}" data-summary-concept="${escapeHtml(item.concept || item.label || "summary")}">
          <span>${escapeHtml(item.label || "Summary")}</span>
          <strong>${escapeHtml(item.value ?? "")}</strong>
          ${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ""}
          ${item.actionHtml || `<span class="workspace-summary-badge">Summary only</span>`}
        </article>
      `).join("")}
    </div>
  `;
}

function renderReportBars({ id = "workspaceReportBarsTitle", kicker = "Reports", title = "Report summary", detail = "", rows = [], className = "", dataAttrs = "" } = {}) {
  const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return `
    <section class="workspace-card workspace-report-summary ${escapeHtml(className)}" ${dataAttrs} aria-labelledby="${escapeHtml(id)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(kicker)}</p>
          <h3 id="${escapeHtml(id)}">${escapeHtml(title)}</h3>
          ${detail ? `<p class="workspace-muted">${escapeHtml(detail)}</p>` : ""}
        </div>
      </div>
      ${safeRows.length ? `
        <div class="workspace-report-bars" data-report-bars="true">
          ${safeRows.map(renderReportBarRow).join("")}
        </div>
      ` : `
        ${renderIntentionalEmptyState({
          id: "report-bars-empty",
          kicker,
          title: "No report data is available for this view yet",
          detail: "Report rows appear after roster, review, or setup data loads for records this account can see.",
          reason: "No roster, review, or setup rows were returned for this report view.",
          owner: "Assigned staff",
          nextAction: "Refresh after roster, review, or setup changes; open Students when you need to inspect visible records.",
          actions: [
            { label: "Refresh workspace", problemAction: "refresh" },
            { label: "Open students", section: "students" },
          ],
        })}
      `}
    </section>
  `;
}

function renderReportBarRow(row = {}) {
  const value = safeNumber(row.value);
  const max = Math.max(safeNumber(row.max), value, 1);
  const percent = clampPercent((value / max) * 100);
  const valueLabel = row.valueLabel === undefined || row.valueLabel === null
    ? String(value)
    : String(row.valueLabel);
  const label = row.label || "Report row";
  const detail = row.detail || "";
  const ariaLabel = `${label}: ${valueLabel}${detail ? `. ${detail}` : ""}`;
  return `
    <article class="workspace-report-row workspace-admin-report-row ${escapeHtml(row.tone || "")}" data-report-row="${escapeHtml(row.id || label)}" ${row.dataAttrs || ""}>
      <div>
        <strong>${escapeHtml(label)}</strong>
        ${detail ? `<span>${escapeHtml(detail)}</span>` : ""}
      </div>
      <div class="workspace-report-value workspace-admin-report-value">
        <b>${escapeHtml(valueLabel)}</b>
        <span class="workspace-report-meter workspace-admin-report-meter" role="meter" aria-label="${escapeHtml(ariaLabel)}" aria-valuemin="0" aria-valuemax="${escapeHtml(String(max))}" aria-valuenow="${escapeHtml(String(value))}" aria-valuetext="${escapeHtml(valueLabel)}">
          ${renderProgressSvg(percent, row.tone || "")}
        </span>
      </div>
    </article>
  `;
}

function workspaceDisclosureDomId(scope, id) {
  return `workspaceDisclosure-${String(scope || "section").replace(/[^A-Za-z0-9_-]+/g, "-")}-${String(id || "details").replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

function isWorkspaceDisclosureOpen(scope, id) {
  if (scope === "student") return Boolean(studentDisclosureState[id]);
  if (scope === "usersAccess") return Boolean(usersAccessDisclosureState[id]);
  if (scope === "dashboard") return Boolean(dashboardDisclosureState[id]);
  if (scope === "mentorRow") return cleanDirectoryFilter(mentorDashboardDetailStudentId) === cleanDirectoryFilter(id);
  return false;
}

function setWorkspaceDisclosure(scope, id, open) {
  const nextOpen = Boolean(open);
  if (scope === "student") {
    studentDisclosureState = {
      ...studentDisclosureState,
      [id]: nextOpen,
    };
    return;
  }
  if (scope === "usersAccess") {
    usersAccessDisclosureState = {
      ...usersAccessDisclosureState,
      [id]: nextOpen,
    };
    return;
  }
  if (scope === "dashboard") {
    dashboardDisclosureState = {
      ...dashboardDisclosureState,
      [id]: nextOpen,
    };
    return;
  }
  if (scope === "mentorRow") {
    mentorDashboardDetailStudentId = nextOpen ? cleanDirectoryFilter(id) : "";
  }
}

function renderWorkspaceDisclosurePanel({ scope, id, kicker = "", title, summary = "", bodyHtml = "", className = "", dataAttrs = "", openLabel = "Open details", closeLabel = "Hide details" }) {
  const open = isWorkspaceDisclosureOpen(scope, id);
  const domId = workspaceDisclosureDomId(scope, id);
  return `
    <section class="workspace-dashboard-card workspace-disclosure-panel ${escapeHtml(className)}" data-workspace-disclosure-panel="${escapeHtml(`${scope}:${id}`)}" data-disclosure-state="${open ? "open" : "closed"}" ${dataAttrs}>
      <div class="workspace-card-head">
        <div>
          ${kicker ? `<p class="workspace-kicker">${escapeHtml(kicker)}</p>` : ""}
          <h2>${escapeHtml(title || "Details")}</h2>
          ${summary ? `<p class="workspace-muted">${escapeHtml(summary)}</p>` : ""}
        </div>
        <button class="workspace-button workspace-button-secondary workspace-disclosure-toggle" type="button" data-workspace-disclosure-action="toggle" data-workspace-disclosure-scope="${escapeHtml(scope)}" data-workspace-disclosure-id="${escapeHtml(id)}" aria-expanded="${open ? "true" : "false"}" aria-controls="${escapeHtml(domId)}">
          ${escapeHtml(open ? closeLabel : openLabel)}
        </button>
      </div>
      ${open ? `<div id="${escapeHtml(domId)}" class="workspace-disclosure-body">${bodyHtml}</div>` : ""}
    </section>
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

function renderDashboardKpis(items = [], options = {}) {
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!rows.length) return "";
  return `
    <div class="workspace-dashboard-kpis ${escapeHtml(options.className || "")}" aria-label="${escapeHtml(options.label || "Dashboard summary")}">
      ${rows.map((item) => `
        <article class="workspace-dashboard-kpi ${escapeHtml(item.tone || "")}">
          <span>${escapeHtml(item.label || "Metric")}</span>
          <strong>${escapeHtml(item.value ?? "")}</strong>
          ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
          ${item.actionHtml || ""}
        </article>
      `).join("")}
    </div>
  `;
}

function renderFirstUseGuide(id, title, steps = [], options = {}) {
  const safeSteps = (Array.isArray(steps) ? steps : []).filter(Boolean).slice(0, 5);
  if (!safeSteps.length) return "";
  const kicker = options.kicker || "Start here";
  const detail = options.detail || "Use these steps when you are new to this screen.";
  const badge = options.badge || `${safeSteps.length} steps`;
  return `
    <section class="workspace-first-use-guide" data-first-use-guide="${escapeHtml(id)}" aria-label="${escapeHtml(title)}">
      <div class="workspace-first-use-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(kicker)}</p>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(detail)}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(badge)}</span>
      </div>
      <ol class="workspace-first-use-steps">
        ${safeSteps.map((step, index) => {
          const label = Array.isArray(step) ? step[0] : step?.label;
          const body = Array.isArray(step) ? step[1] : step?.detail;
          return `
            <li>
              <span aria-hidden="true">${escapeHtml(index + 1)}</span>
              <div>
                <b>${escapeHtml(label || "Use this step")}</b>
                <p>${escapeHtml(body || "Follow the screen guidance before moving on.")}</p>
              </div>
            </li>
          `;
        }).join("")}
      </ol>
    </section>
  `;
}

function renderTaskFinishChecklist(id, title, items = [], options = {}) {
  const safeItems = (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .slice(0, 5);
  if (!safeItems.length) return "";
  const state = normalizeStatus(options.state || "ready") || "ready";
  return `
    <section class="workspace-task-finish-checklist" data-task-finish-checklist="${escapeHtml(id)}" data-task-finish-checklist-state="${escapeHtml(state)}" aria-label="${escapeHtml(title)}">
      <div class="workspace-task-finish-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(options.kicker || "Before you finish")}</p>
          <strong>${escapeHtml(title)}</strong>
          ${options.detail ? `<p>${escapeHtml(options.detail)}</p>` : ""}
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(options.badge || `${safeItems.length} checks`)}</span>
      </div>
      <ol class="workspace-task-finish-steps">
        ${safeItems.map((item) => {
          const label = Array.isArray(item) ? item[0] : item?.label;
          const detail = Array.isArray(item) ? item[1] : item?.detail;
          const itemState = normalizeStatus(Array.isArray(item) ? item[2] : item?.state || "check") || "check";
          const key = String(label || "check").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "check";
          return `
            <li data-task-finish-check="${escapeHtml(key)}" data-task-finish-check-state="${escapeHtml(itemState)}">
              <span aria-hidden="true"></span>
              <div>
                <b>${escapeHtml(label || "Check before continuing")}</b>
                <p>${escapeHtml(detail || "Confirm this before using the action on this screen.")}</p>
              </div>
            </li>
          `;
        }).join("")}
      </ol>
    </section>
  `;
}

function renderReadinessScoreCard(score, total = 0, title = "Readiness score", detail = "") {
  const hasData = score !== null && score !== undefined && safeNumber(total) > 0;
  const value = hasData ? clampPercent(score) : 0;
  return `
    <section class="workspace-score-card" data-readiness-score-card="true">
      <div>
        <p class="workspace-kicker">${escapeHtml(title)}</p>
        <strong>${escapeHtml(hasData ? `${value}/100` : "No score yet")}</strong>
        <p>${escapeHtml(detail || (hasData ? `${value}% readiness across ${total} visible records.` : "No visible records to summarize yet."))}</p>
      </div>
      <div class="workspace-score-meter" role="progressbar" aria-label="${escapeHtml(title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${escapeHtml(value)}">
        ${renderProgressSvg(value)}
      </div>
    </section>
  `;
}

function renderStackedDistribution(items = [], label = "Status distribution") {
  const rows = (Array.isArray(items) ? items : []).filter((item) => safeNumber(item.value) > 0);
  const total = rows.reduce((sum, item) => sum + safeNumber(item.value), 0);
  if (!rows.length || !total) return `<div class="workspace-empty">No distribution items are available for this view.</div>`;
  return `
    <div class="workspace-stacked-summary" aria-label="${escapeHtml(label)}">
      <div class="workspace-stacked-bar" aria-hidden="true">
        ${renderStackedProgressSvg(rows, total)}
      </div>
      <div class="workspace-bar-list">
        ${rows.map((item) => `
          <article class="workspace-bar-row">
            <div>
              <strong>${escapeHtml(item.label || "Status")}</strong>
              <span>${escapeHtml(metricWithPercent(item.value, total))}</span>
            </div>
            <div class="workspace-mini-meter" aria-hidden="true">${renderProgressSvg(percentOf(item.value, total), item.tone || "")}</div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function metricWithPercent(value, total) {
  const count = safeNumber(value);
  const denominator = safeNumber(total);
  if (!denominator) return `${count}`;
  return `${count} of ${denominator} (${percentOf(count, denominator)}%)`;
}

function percentOf(value, total) {
  const denominator = safeNumber(total);
  if (!denominator) return 0;
  return clampPercent((safeNumber(value) / denominator) * 100);
}

function renderProgressSvg(value, tone = "", className = "", options = {}) {
  const percent = clampPercent(value);
  const classes = ["workspace-meter-svg", className].filter(Boolean).join(" ");
  return `<svg class="${escapeHtml(classes)}" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    ${options.track ? '<rect class="workspace-meter-track" x="0" y="0" width="100" height="10"></rect>' : ""}
    <rect class="workspace-meter-fill ${escapeHtml(tone)}" x="0" y="0" width="${escapeHtml(String(percent))}" height="10"></rect>
  </svg>`;
}

function renderStackedProgressSvg(items = [], total = 0) {
  const rows = Array.isArray(items) ? items.filter((item) => safeNumber(item?.value) > 0) : [];
  const denominator = safeNumber(total) || rows.reduce((sum, item) => sum + safeNumber(item.value), 0);
  if (!rows.length || !denominator) return "";
  let offset = 0;
  const rects = rows.map((item, index) => {
    const rawWidth = (safeNumber(item.value) / denominator) * 100;
    const width = index === rows.length - 1
      ? Math.max(0, 100 - offset)
      : Math.max(0, Math.min(100 - offset, Math.round(rawWidth * 100) / 100));
    const x = offset;
    offset = Math.min(100, offset + width);
    return `<rect class="workspace-meter-fill ${escapeHtml(item.tone || "")}" x="${escapeHtml(String(x))}" y="0" width="${escapeHtml(String(width))}" height="10"></rect>`;
  }).join("");
  return `<svg class="workspace-meter-svg workspace-stacked-meter-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">${rects}</svg>`;
}

function renderIntentionalEmptyState({ id = "empty", kicker = "Nothing needs attention", title = "Nothing needs attention right now", detail = "", reason = "", owner = "", nextAction = "", actions = [] } = {}) {
  const allowedSections = availableSectionIdsForAnyMode();
  const safeActions = (Array.isArray(actions) ? actions : [])
    .filter((action) => !action.section || allowedSections.has(action.section))
    .filter((action) => !action.mode || action.mode !== "admin" || adminConsoleCapabilitiesFor(currentUser).canSee)
    .slice(0, 3);
  return `
    <section class="workspace-empty-state-card workspace-intentional-empty-state" data-intentional-empty-state="${escapeHtml(id)}">
      <p class="workspace-kicker">${escapeHtml(kicker)}</p>
      <strong>${escapeHtml(title)}</strong>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
      ${reason || owner || nextAction ? renderProblemState({ reason, owner, nextAction, actions: safeActions }) : ""}
    </section>
  `;
}

function renderNeedsAttention(items = []) {
  if (!items.length) {
    return renderIntentionalEmptyState({
      id: "needs-attention-clear",
      title: "Nothing urgent matches this view",
      detail: "Assigned staff can continue normal project follow-up without opening an unneeded task.",
      reason: "No visible student, proof, review, presentation, or final-file signal is flagged by this view.",
      owner: "Assigned staff",
      nextAction: "Use another filter or return to the dashboard when a new signal appears.",
    });
  }
  return `
    <div class="workspace-attention-list">
      ${items.map((item) => {
        const hasAction = item.actionSection && item.actionPreset && availableSectionIdsForAnyMode().has(item.actionSection);
        return `
          <article class="workspace-attention-item ${escapeHtml(item.severity || "info")}">
            <div>
              <strong>${escapeHtml(item.label || "Needs attention")}</strong>
              <p>${escapeHtml(item.detail || "Review this operational signal.")}</p>
            </div>
            <div class="workspace-row-actions">
              <span class="workspace-chip">${escapeHtml(statusText(item.severity || "info"))}</span>
              ${hasAction ? `
                <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(item.actionSection)}" data-section-preset="${escapeHtml(item.actionPreset)}">
                  ${escapeHtml(item.actionLabel || "Open")}
                </button>
              ` : `<span class="workspace-summary-badge">Summary only</span>`}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderRecentProgramActivity(rows = []) {
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "recent-program-activity-empty",
      kicker: "No recent activity",
      title: "No recent program activity is visible yet",
      detail: "New submissions, proof, and Program Teacher feedback will appear here when this account can see them.",
      reason: "No recent program activity is available for the visible school or program.",
      owner: "Program Teacher or site staff",
      nextAction: "Continue normal follow-up or open Students to inspect a specific record.",
      actions: [{ label: "Open students", section: "students" }],
    });
  }
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
              ${renderViewAsStudentAction(row.studentId, row.studentName, { sourceSection: activeSection || "students" })}
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderSiteRecentActivity(rows = []) {
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "recent-school-activity-empty",
      kicker: "No recent activity",
      title: "No recent school activity is visible yet",
      detail: "New submissions, proof, and Program Teacher feedback will appear here without exposing private details.",
      reason: "No recent activity rows are available for the selected school.",
      owner: "Assigned school staff",
      nextAction: "Use Students, Review Work, or Operations when you need to inspect a specific workflow.",
      actions: [
        { label: "Open students", section: "students" },
        { label: "Open review", section: "teacher", preset: "submitted" },
      ],
    });
  }
  return `
    <div>
      <p class="workspace-muted">Recent activity is summarized without sensitive private details. Open student detail when assigned staff need the full record.</p>
      ${renderRecentProgramActivity(rows)}
    </div>
  `;
}

function renderProgramBreakdown(rows = []) {
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "program-breakdown-empty",
      kicker: "Programs",
      title: "No program records are visible for this school",
      detail: "Program counts appear after the school has active program mappings and visible students.",
      reason: "The selected school does not currently return program summary rows for this account.",
      owner: "Site Admin or Global Admin",
      nextAction: "Open Programs in Admin Console if the school should have program mappings.",
      actions: [{ label: "Open Programs", mode: "admin", section: "programs" }],
    });
  }
  return `
    <div class="workspace-program-breakdown">
      ${rows.map((row) => `
        <article class="workspace-program-row">
          <div>
            <strong>${escapeHtml(cleanDemoSeedDisplay(row.programName, "Program"))}</strong>
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
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "review-queue-clear",
      kicker: "Review workload",
      title: "No submitted or revision-requested work needs review right now",
      detail: "This does not approve work by itself. It only means the queue has no rows for the current school, program, or assigned-student list.",
      reason: "The review queue returned no submitted or revision-requested rows.",
      owner: "Program Teacher",
      nextAction: "Open Review Work after new submissions arrive, or open Students if you need to inspect a specific visible record.",
      actions: [
        { label: "Open Review Work", section: "teacher", preset: "submitted" },
        { label: "Open students", section: "students" },
      ],
    });
  }
  const allowStudentDetail = Boolean(options.allowStudentDetail && availableSectionIdsForAnyMode().has("students"));
  return `
    <div class="workspace-list">
      ${rows.slice(0, 8).map((item) => {
        const studentId = item.studentId || item.student_id || "";
        const studentName = item.studentName || item.student_name || "Student";
        const detailAction = allowStudentDetail && studentId
          ? `
            <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(studentId)}">View student detail</button>
            ${renderViewAsStudentAction(studentId, studentName, { sourceSection: "adminDashboard" })}
          `
          : "";
        return `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(studentName)}</strong>
              <p>${escapeHtml(item.requirementTitle || item.requirement_title || "Senior Project work")} / ${safeNumber(item.evidenceCount ?? item.evidence_count)} proof item${safeNumber(item.evidenceCount ?? item.evidence_count) === 1 ? "" : "s"}</p>
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
  const mentorEmpty = !rows.length ? renderIntentionalEmptyState({
    id: "mentor-coverage-clear",
    kicker: "Mentor coverage",
    title: noMentor ? "No mentor assignments are visible yet" : "No mentor coverage gaps are visible right now",
    detail: noMentor
      ? "The summary shows students without mentors, but this panel did not receive the matching assignments."
      : "This means the mentor coverage panel has no students to review for this school or assigned-student list.",
    reason: noMentor
      ? "Mentor coverage data is incomplete for the selected view."
      : "The mentor coverage list returned no assignments.",
    owner: "Site staff",
    nextAction: noMentor
      ? "Open mentor assignments or the missing-mentor student filter before adding broad access."
      : "Refresh after assignment changes or open Students when checking a specific student.",
    actions: [
      { label: "Open coverage", section: "mentorAssignments", preset: noMentor ? "no-mentor" : "" },
      { label: "View students", section: "students", preset: "missing-mentors" },
    ],
  }) : "";
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
      `).join("") : mentorEmpty}
    </div>
  `;
}

function renderStatusBreakdown(rows = []) {
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "student-status-empty",
      kicker: "Student status",
      title: "No student status rows are available yet",
      detail: "Status rows appear after visible student records load for the selected school or program.",
      reason: "The status breakdown returned no rows this account can see.",
      owner: "Assigned school staff",
      nextAction: "Open Students to confirm the visible roster before treating the status view as quiet.",
      actions: [{ label: "Open students", section: "students" }],
    });
  }
  const canOpenStudents = availableSectionIdsForAnyMode().has("students");
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
  if (!rows.length) {
    const snapshotLabel = type === "presentation"
      ? "Presentation snapshot"
      : type === "archive"
        ? "Final-file snapshot"
        : "Status snapshot";
    return renderIntentionalEmptyState({
      id: `${type || "status"}-snapshot-empty`,
      kicker: snapshotLabel,
      title: "No status rows are available yet",
      detail: "Snapshot rows appear after presentation, final-file, or operations data loads for this school or assigned-student list.",
      reason: `The ${snapshotLabel.toLowerCase()} returned no rows.`,
      owner: "Assigned staff",
      nextAction: "Open Operations when you need the detailed worklist, or refresh after new presentation or final-file activity.",
      actions: [
        { label: "Open operations", section: "operations" },
        { label: "Refresh workspace", problemAction: "refresh" },
      ],
    });
  }
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
        Review work
      </button>
    `;
  }
  if (type === "archive" && ["queued", "running", "complete", "failed", "expired", "expiring_soon", "provider_unavailable"].includes(status)) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="archive-snapshot" data-archive-status="${escapeHtml(status)}">
        Review work
      </button>
    `;
  }
  return "";
}

function renderAuditSummary(rows = [], options = {}) {
  const emptyMessage = options.emptyMessage || "No recent audit rows are available for this view.";
  const allowAuditDrillDown = Boolean(options.allowAuditDrillDown && availableSectionIdsForAnyMode().has("audit"));
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "audit-summary-empty",
      kicker: "Audit",
      title: emptyMessage,
      detail: "Audit summaries use redacted events only. Empty does not prove that no changes happened outside the visible result.",
      reason: "The audit summary returned no rows for this view.",
      owner: "Global admin",
      nextAction: "Open Audit or refresh after access, account, import, or review changes.",
      actions: [
        { label: "Open audit", section: "audit" },
        { label: "Refresh workspace", problemAction: "refresh" },
      ],
    });
  }
  return `
    <div class="workspace-list">
      ${rows.slice(0, 8).map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(statusText(row.action))}</strong>
            <p>${escapeHtml(statusText(row.entityType))} / ${escapeHtml(row.actorDisplayName || row.actorName || "System")} / ${escapeHtml(formatDate(row.createdAt))}</p>
          </div>
          <div class="workspace-row-actions">
            <span class="workspace-chip">Audit</span>
            ${allowAuditDrillDown && row.action && row.entityType ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="audit" data-audit-action="${escapeHtml(row.action)}" data-audit-entity-type="${escapeHtml(row.entityType)}">
                Review in audit
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderScopedStudentList(rows = []) {
  if (!rows.length) {
    return renderIntentionalEmptyState({
      id: "scoped-student-list-empty",
      kicker: "Students",
      title: "No students are currently visible for this school view",
      detail: "This screen only shows students assigned to this account.",
      reason: "The student list returned no visible rows.",
      owner: "Assigned school staff",
      nextAction: "Open Students to confirm site, program, and filter choices before changing access.",
      actions: [{ label: "Open students", section: "students", preset: "all-students" }],
    });
  }
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

function renderMentorDashboardFocusedStudent(row = {}, activeFilter = "all", totalAssigned = 0) {
  const attention = Array.isArray(row.needsAttention) ? row.needsAttention : [];
  const priority = mentorDashboardPriority(row, attention);
  const question = mentorDashboardSuggestedQuestion(row, attention);
  const nextStep = mentorDashboardNextStep(row, attention);
  const studentId = cleanDirectoryFilter(row.studentId || "");
  const filterLabel = mentorDashboardFilterKicker(activeFilter);
  const projectName = row.projectName || `${row.studentName || "Student"}'s project`;
  return `
    <section class="workspace-dashboard-card workspace-mentor-focus-flow" data-mentor-dashboard-focus-flow="true" data-mentor-dashboard-active-queue="${escapeHtml(activeFilter)}">
      <div class="workspace-card-head workspace-mentor-focus-head">
        <div>
          <p class="workspace-kicker">Start here · ${escapeHtml(row.studentName || "Assigned student")}</p>
          <h2>${escapeHtml(projectName)}</h2>
          <p>${escapeHtml(priority.detail)}</p>
        </div>
        <div class="workspace-row-actions">
          <span class="workspace-chip">${escapeHtml(filterLabel)}</span>
          <span class="workspace-chip">${escapeHtml(totalAssigned)} assigned</span>
        </div>
      </div>
      <div class="workspace-mentor-checkin-layout">
        <ol class="workspace-mentor-checkin-steps" aria-label="Next mentor check-in plan">
          <li>
            <span>1</span>
            <div><small>Ask</small><strong data-mentor-dashboard-question="true">${escapeHtml(question)}</strong></div>
          </li>
          <li>
            <span>2</span>
            <div><small>Help</small><strong data-mentor-dashboard-next-step="true">${escapeHtml(nextStep)}</strong></div>
          </li>
          <li>
            <span>3</span>
            <div><small>Record</small><strong>${escapeHtml(isMentorDashboardMeetingRow(row) ? "Update the meeting or make-up status." : "Save the next check-in after the student answers.")}</strong></div>
          </li>
        </ol>
        ${studentId ? `
          <div class="workspace-mentor-focus-primary">
            <button class="workspace-button workspace-button-primary" type="button" data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(studentId)}">
              Open check-in
            </button>
            <small>Meeting notes and project work open together.</small>
          </div>
        ` : ""}
      </div>
      <details class="workspace-mentor-focus-context" data-mentor-dashboard-focus-context="true">
        <summary>More about this project</summary>
        <div class="workspace-chip-row workspace-mentor-compact-chips" data-mentor-dashboard-compact-signals="true">
          ${statusPill(row.submissionStatus || "not_started")}
          ${attention.slice(0, 3).map((item) => `<span class="workspace-story-chip">${escapeHtml(mentorDashboardAttentionLabel(item))}</span>`).join("")}
          ${safeNumber(row.evidenceCount) ? `<span class="workspace-site-context-badge">${escapeHtml(safeNumber(row.evidenceCount))} work ${pluralize(safeNumber(row.evidenceCount), "link")}</span>` : ""}
        </div>
        ${isMentorDashboardRevisionSinceLastMeeting(row) ? `<p class="workspace-muted" data-mentor-revision-since-meeting="true">Revision since last meeting: compare the teacher's request with the newest work link before the next check-in.</p>` : ""}
        ${studentId ? `
          <div class="workspace-row-actions workspace-mentor-focus-actions">
            <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="open-student" data-mentor-dashboard-student-id="${escapeHtml(studentId)}">Open student details</button>
            ${renderViewAsStudentAction(studentId, row.studentName, { sourceSection: "mentorDashboard", label: "Preview student view" })}
          </div>
          <p class="workspace-muted workspace-mentor-preview-note" data-mentor-dashboard-preview-boundary="true">Student preview is read-only.</p>
        ` : ""}
      </details>
    </section>
  `;
}

function renderMentorStudentCards(rows = []) {
  return `
    <div class="workspace-list">
      ${rows.map((row) => {
        const attention = Array.isArray(row.needsAttention) ? row.needsAttention : [];
        const priority = mentorDashboardPriority(row, attention);
        const meetingStatus = row.mentorMeetingStatus || "not_recorded";
        const presentationStatus = row.presentationStatus || "not_scheduled";
        const outlineStatus = row.outlineStatus || "pending";
        const recentActivity = mentorDashboardRecentActivity(row);
        const studentId = cleanDirectoryFilter(row.studentId || "");
        const detailOpen = isWorkspaceDisclosureOpen("mentorRow", studentId);
        const detailDomId = workspaceDisclosureDomId("mentorRow", studentId || "student");
        return `
          <article class="workspace-row workspace-mentor-student-row" data-mentor-dashboard-row="${escapeHtml(studentId || "student")}" data-mentor-dashboard-queue-kind="${escapeHtml(priority.key)}" data-disclosure-state="${detailOpen ? "open" : "closed"}">
            <div>
              <strong>${escapeHtml(row.studentName || "Student")}</strong>
              <p class="workspace-muted workspace-mentor-priority" data-mentor-dashboard-priority="true"><b>${escapeHtml(priority.label)}</b>: ${escapeHtml(priority.detail)}</p>
              ${!detailOpen && isMentorDashboardRevisionSinceLastMeeting(row) ? `<p class="workspace-mentor-collapsed-alert" data-mentor-dashboard-collapsed-revision="true">Details include revision changes since the last mentor check-in.</p>` : ""}
              ${priority.key === "steady" ? `<p class="workspace-muted" data-mentor-dashboard-no-action-today="true">No action needed today beyond regular check-ins.</p>` : ""}
              <p class="workspace-muted" data-mentor-dashboard-summary="true">${escapeHtml(mentorDashboardCompactSummary(row, attention))}</p>
              <div class="workspace-chip-row workspace-mentor-compact-chips" data-mentor-dashboard-compact-signals="true">
                ${statusPill(row.submissionStatus || "not_started")}
                ${attention.slice(0, 2).map((item) => `<span class="workspace-story-chip">${escapeHtml(mentorDashboardAttentionLabel(item))}</span>`).join("")}
                ${safeNumber(row.evidenceCount) ? `<span class="workspace-site-context-badge">${escapeHtml(safeNumber(row.evidenceCount))} work ${pluralize(safeNumber(row.evidenceCount), "link")}</span>` : ""}
              </div>
            </div>
            <div class="workspace-row-actions">
              ${row.studentId ? `
                <button class="workspace-button workspace-button-small workspace-button-primary" type="button" data-mentor-dashboard-action="open-student" data-mentor-dashboard-student-id="${escapeHtml(row.studentId)}">
                  View detail
                </button>
                ${renderViewAsStudentAction(row.studentId, row.studentName, { sourceSection: "mentorDashboard" })}
                <button class="workspace-link-button workspace-link-button-small" type="button" data-workspace-disclosure-action="toggle" data-workspace-disclosure-scope="mentorRow" data-workspace-disclosure-id="${escapeHtml(studentId)}" aria-expanded="${detailOpen ? "true" : "false"}" aria-controls="${escapeHtml(detailDomId)}">
                  ${detailOpen ? "Hide details" : "Details"}
                </button>
              ` : ""}
            </div>
            ${detailOpen ? renderMentorDashboardRowDetails(row, attention, recentActivity, meetingStatus, presentationStatus, outlineStatus, detailDomId) : ""}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderMentorDashboardActionMap(rows = [], filteredRows = [], activeFilter = "all") {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return "";
  const activeRows = Array.isArray(filteredRows) && filteredRows.length ? filteredRows : safeRows;
  const focus = activeRows[0] || safeRows[0] || {};
  const attention = Array.isArray(focus.needsAttention) ? focus.needsAttention : [];
  const revisionRows = safeRows.filter(isMentorDashboardRevisionRow);
  const revisionSinceMeetingRows = safeRows.filter(isMentorDashboardRevisionSinceLastMeeting);
  const meetingRows = safeRows.filter(isMentorDashboardMeetingRow);
  const presentationRows = safeRows.filter(isMentorDashboardPresentationRow);
  const steadyRows = safeRows.filter((row) => mentorDashboardPriority(row, Array.isArray(row.needsAttention) ? row.needsAttention : []).key === "steady");
  const cards = [
    {
      id: "focus",
      label: "Next conversation",
      value: focus.studentName || "Assigned student",
      detail: `Ask next: ${mentorDashboardSuggestedQuestion(focus, attention)}`,
      tone: mentorDashboardPriority(focus, attention).key,
      action: "open-meetings",
      actionLabel: "Open meeting plan",
      studentId: focus.studentId,
    },
    {
      id: "revision",
      label: "Revision follow-up",
      value: `${revisionRows.length} ${pluralize(revisionRows.length, "student")}`,
      detail: revisionSinceMeetingRows.length
        ? "Compare the teacher's request with the work link added after the last check-in."
        : "Open when Program Teacher feedback says the student must fix work.",
      tone: revisionRows.length ? "revision" : "quiet",
      filter: "revision",
      actionLabel: "Focus revisions",
    },
    {
      id: "meeting",
      label: "Meeting follow-up",
      value: `${meetingRows.length} due`,
      detail: meetingRows.length ? "Use this when a check-in is missed, make-up, or not recorded." : "No meeting follow-up is flagged right now.",
      tone: meetingRows.length ? "meeting" : "quiet",
      filter: "meeting",
      actionLabel: "Focus meetings",
    },
    {
      id: "presentation",
      label: "Presentation readiness",
      value: `${presentationRows.length} risk`,
      detail: presentationRows.length ? "Open for outline approval, scheduling, or presentation practice risk." : "No presentation risk is flagged right now.",
      tone: presentationRows.length ? "presentation" : "quiet",
      filter: "presentation",
      actionLabel: "Focus presentations",
    },
    {
      id: "steady",
      label: "Regular support",
      value: `${steadyRows.length} steady`,
      detail: steadyRows.length ? "Keep calm check-ins visible without mixing them into urgent work." : "Urgent signals are taking the whole mentor list today.",
      tone: steadyRows.length ? "steady" : "quiet",
      filter: "all",
      actionLabel: "Show all",
    },
  ];
  return `
    <section class="workspace-mentor-action-map" data-mentor-action-map="true" data-mentor-action-map-active-filter="${escapeHtml(activeFilter)}" aria-labelledby="mentorActionMapTitle">
      <div class="workspace-mentor-action-map-head">
        <div>
          <p class="workspace-kicker">Where to help next</p>
          <h2 id="mentorActionMapTitle">Choose one mentor action</h2>
          <p class="workspace-muted">Use this map before scanning every assigned student row.</p>
        </div>
      </div>
      <div class="workspace-mentor-action-map-grid">
        ${cards.map((card) => renderMentorDashboardActionMapCard(card, activeFilter)).join("")}
      </div>
    </section>
  `;
}

function renderMentorDashboardActionMapCard(card = {}, activeFilter = "all") {
  const isActiveFilter = card.filter ? cleanMentorDashboardFilter(activeFilter) === cleanMentorDashboardFilter(card.filter) : false;
  const actionAttrs = card.action === "open-meetings" && card.studentId
    ? `data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(card.studentId)}"`
    : card.filter
      ? `data-mentor-dashboard-action="filter" data-mentor-dashboard-filter="${escapeHtml(card.filter)}" aria-pressed="${isActiveFilter ? "true" : "false"}"`
      : "";
  return `
    <article class="workspace-mentor-action-map-card ${escapeHtml(card.tone || "quiet")}" data-mentor-action-map-card="${escapeHtml(card.id || "")}" data-current-filter="${isActiveFilter ? "true" : "false"}">
      <div>
        <span>${escapeHtml(card.label || "Mentor action")}</span>
        <strong>${escapeHtml(card.value || "")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      ${actionAttrs ? `
        <button class="workspace-link-button workspace-link-button-small" type="button" ${actionAttrs}>
          ${escapeHtml(isActiveFilter && card.filter ? "Viewing" : card.actionLabel || "Open")}
        </button>
      ` : ""}
    </article>
  `;
}

function renderMentorDashboardQueueGuide(rows = [], activeFilter = "all") {
  const revisionRows = rows.filter(isMentorDashboardRevisionRow);
  const revisionSinceMeetingRows = rows.filter(isMentorDashboardRevisionSinceLastMeeting);
  const meetingRows = rows.filter(isMentorDashboardMeetingRow);
  const presentationRows = rows.filter(isMentorDashboardPresentationRow);
  const filteredLabel = mentorDashboardFilterKicker(activeFilter);
  const revisionCount = revisionSinceMeetingRows.length || revisionRows.length;
  const revisionLabel = revisionSinceMeetingRows.length ? "revision since check-in" : "revision follow-up";
  const nextMove = activeFilter === "revision"
    ? "Start with students whose work changed after the last mentor touchpoint."
    : activeFilter === "meeting"
      ? "Start with missed, make-up, or not-recorded mentor meetings."
      : activeFilter === "presentation"
        ? "Start with outline approval and presentation scheduling risk."
        : "Start with revision follow-up, then meeting due, then presentation risk.";
  return `
    <section class="workspace-mentor-queue-guide" data-mentor-dashboard-queue-guide="true" data-mentor-dashboard-active-queue="${escapeHtml(activeFilter)}">
      <div>
        <strong>${escapeHtml(`Today's mentor queue: ${filteredLabel}`)}</strong>
        <p>${escapeHtml(nextMove)}</p>
      </div>
      <div class="workspace-mentor-queue-counts" aria-label="Mentor queue counts">
        <span><b>${escapeHtml(revisionCount)}</b> ${escapeHtml(revisionLabel)}</span>
        <span><b>${escapeHtml(meetingRows.length)}</b> no recent meeting</span>
        <span><b>${escapeHtml(presentationRows.length)}</b> presentation risk</span>
      </div>
      ${revisionSinceMeetingRows.length ? `
        <p class="workspace-muted" data-mentor-revision-since-meeting="true">Revision since last meeting: compare the teacher's request with the newest work link before the next check-in.</p>
      ` : ""}
    </section>
  `;
}

function renderMentorNextMeetingPlan(rows = [], activeFilter = "all") {
  const safeRows = Array.isArray(rows) ? rows : [];
  const focus = safeRows[0] || null;
  if (!focus) return "";
  const attention = Array.isArray(focus.needsAttention) ? focus.needsAttention : [];
  const priority = mentorDashboardPriority(focus, attention);
  const question = mentorDashboardSuggestedQuestion(focus, attention);
  const nextStep = mentorDashboardNextStep(focus, attention);
  return `
    <section class="workspace-dashboard-card workspace-mentor-next-meeting-plan" data-mentor-next-meeting-plan="true" data-mentor-next-meeting-plan-filter="${escapeHtml(activeFilter)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Next meeting plan</p>
          <h2>${escapeHtml(focus.studentName || "Assigned student")}</h2>
          <p>${escapeHtml(`${priority.label}: ${priority.detail}`)}</p>
        </div>
        ${statusPill(focus.submissionStatus || focus.mentorMeetingStatus || "mentor")}
      </div>
      <div class="workspace-mentor-plan-grid">
        <article>
          <span>1. Start with</span>
          <strong>${escapeHtml(question)}</strong>
        </article>
        <article>
          <span>2. Then do</span>
          <strong>${escapeHtml(nextStep)}</strong>
        </article>
        <article>
          <span>3. Record</span>
          <strong>${escapeHtml(isMentorDashboardMeetingRow(focus) ? "Update meeting or make-up status." : "Record the next check-in after the student answers.")}</strong>
        </article>
      </div>
      ${focus.studentId ? `
        <div class="workspace-row-actions">
          <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(focus.studentId)}">Open meeting history</button>
        </div>
      ` : ""}
    </section>
  `;
}

function mentorDashboardPriority(row = {}, attention = []) {
  if (isMentorDashboardRevisionRow(row)) {
    const changedAfterMeeting = isMentorDashboardRevisionSinceLastMeeting(row);
    return {
      key: "revision",
      label: "Needs me first",
      detail: changedAfterMeeting
        ? "Revision changed since the last mentor check-in. Compare the teacher's request with the new work link."
        : "Revision is open. Check what changed since the last mentor conversation.",
    };
  }
  if (attention.includes("mentor_meeting") || isMentorDashboardMeetingRow(row)) {
    return {
      key: "meeting",
      label: "Meeting due",
      detail: "A check-in is missing, missed, or needs make-up status.",
    };
  }
  if (attention.includes("presentation") || isMentorDashboardPresentationRow(row)) {
    return {
      key: "presentation",
      label: "Presentation risk",
      detail: "Outline or presentation scheduling still needs mentor attention.",
    };
  }
  return {
    key: "steady",
    label: "Regular support",
    detail: "No urgent mentor signal is open right now.",
  };
}

function mentorDashboardCompactSummary(row = {}, attention = []) {
  if (isMentorDashboardRevisionRow(row)) return "Revision follow-up is the current priority.";
  if (attention.includes("mentor_meeting") || isMentorDashboardMeetingRow(row)) return "Meeting follow-up needs attention.";
  if (attention.includes("presentation") || isMentorDashboardPresentationRow(row)) return "Presentation readiness needs a check.";
  return "On track for regular mentor support.";
}

function renderMentorDashboardRowDetails(row = {}, attention = [], recentActivity = "", meetingStatus = "not_recorded", presentationStatus = "not_scheduled", outlineStatus = "pending", detailDomId = "") {
  const priority = mentorDashboardPriority(row, attention);
  return `
    <div id="${escapeHtml(detailDomId)}" class="workspace-mentor-row-detail" data-mentor-dashboard-row-detail="true">
      <div class="workspace-mentor-signal-grid" data-mentor-dashboard-signals="true">
        ${renderMentorDashboardSignal("Meeting", statusText(meetingStatus))}
        ${renderMentorDashboardSignal("Presentation", statusText(presentationStatus))}
        ${renderMentorDashboardSignal("Outline", statusText(outlineStatus))}
        ${renderMentorDashboardSignal("Work links", `${safeNumber(row.evidenceCount)} item${safeNumber(row.evidenceCount) === 1 ? "" : "s"}`)}
      </div>
      <p class="workspace-muted" data-mentor-dashboard-detail-priority="true">${escapeHtml(`${priority.label}: ${priority.detail}`)}</p>
      ${isMentorDashboardRevisionSinceLastMeeting(row) ? `
        <section class="workspace-mentor-revision-followup" data-mentor-revision-followup="true">
          <strong>Revision since the last mentor meeting</strong>
          <p>Read the teacher note. Check the newest work link. Write what the student will fix before the next review.</p>
        </section>
      ` : ""}
      ${recentActivity ? `<p class="workspace-muted" data-mentor-dashboard-activity="true">${escapeHtml(recentActivity)}</p>` : ""}
      <p class="workspace-muted" data-mentor-dashboard-next-step="true">${escapeHtml(mentorDashboardNextStep(row, attention))}</p>
      <p class="workspace-muted" data-mentor-dashboard-question="true"><strong>Ask next:</strong> ${escapeHtml(mentorDashboardSuggestedQuestion(row, attention))}</p>
      ${attention.length ? `<p class="workspace-muted">${escapeHtml(attention.map(mentorDashboardAttentionLabel).join(", "))}</p>` : ""}
      ${row.studentId ? `
        <div class="workspace-row-actions workspace-density-action-row">
          <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(row.studentId)}">
            Open meeting history
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function renderMentorDashboardFilters(rows = [], activeFilter = "all") {
  const filters = [
    ["all", "Needs me first", rows.length],
    ["revision", "Revision since check-in", rows.filter(isMentorDashboardRevisionRow).length],
    ["meeting", "Meeting due", rows.filter(isMentorDashboardMeetingRow).length],
    ["presentation", "Presentation risk", rows.filter(isMentorDashboardPresentationRow).length],
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

function renderMentorDashboardSortControls(rows = [], activeSort = "priority") {
  const sort = cleanMentorDashboardSort(activeSort);
  const sorts = [
    ["priority", "Priority", "Revision, meeting, presentation"],
    ["revision", "Needs revision", `${rows.filter(isMentorDashboardRevisionRow).length} revision`],
    ["meeting", "Meeting due", `${rows.filter(isMentorDashboardMeetingRow).length} meeting`],
    ["presentation", "Presentation risk", `${rows.filter(isMentorDashboardPresentationRow).length} presentation`],
    ["newest", "Newest activity", "Latest update first"],
  ];
  return `
    <div class="workspace-filter-bar workspace-mentor-dashboard-sorts" data-mentor-dashboard-sort-controls="true" aria-label="Mentor dashboard sort order">
      ${sorts.map(([value, label, detail]) => `
        <button class="workspace-button ${sort === value ? "workspace-button-primary" : "workspace-button-secondary"}" type="button" data-mentor-dashboard-action="sort" data-mentor-dashboard-sort="${escapeHtml(value)}" aria-pressed="${sort === value ? "true" : "false"}">
          ${escapeHtml(label)} <span>${escapeHtml(detail)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderMentorDashboardMetricAction(filter = "all", label = "Focus list") {
  const safeFilter = cleanMentorDashboardFilter(filter);
  return `<button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="filter" data-mentor-dashboard-filter="${escapeHtml(safeFilter)}">${escapeHtml(label)}</button>`;
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

function cleanMentorDashboardSort(value) {
  const sort = String(value || "").trim();
  return ["priority", "revision", "meeting", "presentation", "newest"].includes(sort) ? sort : "priority";
}

function cleanPresentationSlotFilter(value) {
  const filter = normalizeStatus(value);
  return ["all", "scheduled", "checked_out", "checked_in", "outline_follow_up"].includes(filter) ? filter : "all";
}

function cleanAdminArchiveExportFilter(value) {
  const normalized = normalizeStatus(value || "all") || "all";
  return ADMIN_ARCHIVE_EXPORT_FILTER_VALUES.has(normalized) ? normalized : "all";
}

function mentorDashboardSortLabel(value) {
  const sort = cleanMentorDashboardSort(value);
  if (sort === "revision") return "Needs revision";
  if (sort === "meeting") return "Meeting due";
  if (sort === "presentation") return "Presentation risk";
  if (sort === "newest") return "Newest activity";
  return "Priority";
}

function isMentorDashboardRevisionRow(row = {}) {
  return normalizeStatus(row.submissionStatus) === "revision_requested" || (Array.isArray(row.needsAttention) && row.needsAttention.some((item) => normalizeStatus(item) === "revision_requested"));
}

function isMentorDashboardRevisionSinceLastMeeting(row = {}) {
  if (!isMentorDashboardRevisionRow(row)) return false;
  const submissionTime = Date.parse(String(row.latestSubmissionUpdatedAt || ""));
  if (!Number.isFinite(submissionTime)) return false;
  const meetingTime = Date.parse(String(row.latestMentorMeetingAt || ""));
  return !Number.isFinite(meetingTime) || submissionTime > meetingTime;
}

function isMentorDashboardMeetingRow(row = {}) {
  const status = normalizeStatus(row.mentorMeetingStatus || "not_recorded");
  return ["not_recorded", "missed", "makeup_required"].includes(status) || (Array.isArray(row.needsAttention) && row.needsAttention.includes("mentor_meeting"));
}

function isMentorDashboardPresentationRow(row = {}) {
  return normalizeStatus(row.presentationStatus) === "not_scheduled"
    || normalizeStatus(row.outlineStatus) !== "approved"
    || (Array.isArray(row.needsAttention) && row.needsAttention.includes("presentation"));
}

function mentorDashboardFilterKicker(filter = "all") {
  if (filter === "revision") return "Revision since check-in";
  if (filter === "meeting") return "Meeting due";
  if (filter === "presentation") return "Presentation risk";
  return "Needs me first";
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

function prioritizeMentorDashboardStudents(rows = [], sort = "priority") {
  const safeRows = Array.isArray(rows) ? rows : [];
  const activeSort = cleanMentorDashboardSort(sort);
  return [...safeRows].sort((left, right) => {
    if (activeSort === "revision") return mentorDashboardSortByFlag(left, right, isMentorDashboardRevisionRow);
    if (activeSort === "meeting") return mentorDashboardSortByFlag(left, right, isMentorDashboardMeetingRow);
    if (activeSort === "presentation") return mentorDashboardSortByFlag(left, right, isMentorDashboardPresentationRow);
    if (activeSort === "newest") {
      const leftTime = mentorDashboardLatestActivityTime(left);
      const rightTime = mentorDashboardLatestActivityTime(right);
      if (leftTime !== rightTime) return rightTime - leftTime;
    }
    const leftRank = mentorDashboardAttentionRank(left);
    const rightRank = mentorDashboardAttentionRank(right);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return String(left?.studentName || "").localeCompare(String(right?.studentName || ""));
  });
}

function mentorDashboardSortByFlag(left = {}, right = {}, predicate = () => false) {
  const leftMatch = predicate(left) ? 0 : 1;
  const rightMatch = predicate(right) ? 0 : 1;
  if (leftMatch !== rightMatch) return leftMatch - rightMatch;
  const leftRank = mentorDashboardAttentionRank(left);
  const rightRank = mentorDashboardAttentionRank(right);
  if (leftRank !== rightRank) return leftRank - rightRank;
  return String(left?.studentName || "").localeCompare(String(right?.studentName || ""));
}

function mentorDashboardLatestActivityTime(row = {}) {
  const values = [
    row.latestSubmissionUpdatedAt,
    row.latestMentorMeetingAt,
    row.latestPresentationScheduledFor,
  ].map((value) => Date.parse(String(value || ""))).filter(Number.isFinite);
  return values.length ? Math.max(...values) : 0;
}

function mentorDashboardAttentionRank(row = {}) {
  const attention = Array.isArray(row.needsAttention) ? row.needsAttention : [];
  if (isMentorDashboardRevisionRow(row)) return 0;
  if (attention.includes("mentor_meeting")) return 1;
  if (attention.includes("presentation") || normalizeStatus(row.presentationStatus) === "not_scheduled" || normalizeStatus(row.outlineStatus) !== "approved") return 2;
  return 3;
}

function mentorDashboardAttentionLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "mentor_meeting") return "Check-in due";
  if (normalized === "presentation") return "Presentation not ready";
  if (normalized === "revision_requested" || normalized === "revision") return "Teacher changes";
  return statusText(value);
}

function renderMentorDashboardSignal(label, value) {
  return `
    <span>
      <strong>${escapeHtml(label)}</strong>
      ${escapeHtml(String(value || "Not available"))}
    </span>
  `;
}

function mentorDashboardRecentActivity(row = {}) {
  const facts = [];
  if (row.latestSubmissionUpdatedAt) {
    facts.push(`Work updated ${formatDate(row.latestSubmissionUpdatedAt)}`);
  }
  if (row.latestMentorMeetingAt) {
    facts.push(`Meeting activity ${formatDate(row.latestMentorMeetingAt)}`);
  }
  if (row.latestPresentationScheduledFor) {
    facts.push(`Presentation ${formatDate(row.latestPresentationScheduledFor)}`);
  }
  return facts.join(" / ");
}

function mentorDashboardNextStep(row = {}, attention = []) {
  if (isMentorDashboardRevisionRow(row)) {
    return "Open the student details. Read the teacher's note and the newest work link. Then plan the next check-in.";
  }
  if (attention.includes("mentor_meeting")) {
    return "Update the mentor meeting plan or make-up status before the next check-in.";
  }
  if (attention.includes("presentation")) {
    return "Check outline and presentation readiness with this student.";
  }
  return "Open the student details when you need to plan the next check-in.";
}

function mentorDashboardSuggestedQuestion(row = {}, attention = []) {
  if (isMentorDashboardRevisionRow(row)) {
    return "What did your teacher ask you to change, and which work link shows the fix?";
  }
  if (attention.includes("mentor_meeting") || isMentorDashboardMeetingRow(row)) {
    return "When is your next mentor check-in, and what decision do you need from it?";
  }
  if (attention.includes("presentation") || isMentorDashboardPresentationRow(row)) {
    return "Is your outline approved, and what still needs to be scheduled before presentation practice?";
  }
  return "What is the next project item your teacher said you can start?";
}

function safeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function workspaceWordCount(value = "") {
  const words = String(value || "").trim().match(/\S+/g);
  return words ? words.length : 0;
}

function clampPercent(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function studentBookletPhaseKey(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  if (!normalized) return "";
  return STUDENT_BOOKLET_PHASE_ALIASES[normalized] || normalized;
}

function studentBookletPhaseInfo(value, fallbackLabel = "") {
  const key = studentBookletPhaseKey(value || fallbackLabel || "");
  const known = STUDENT_BOOKLET_PHASES[key];
  if (known) return { key, ...known };
  const label = String(fallbackLabel || value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
  return {
    key,
    label: label || "Other required work",
    guidance: "Use this phase to check the listed work, file, and next step.",
    deliverable: "Finish the work your teacher lists for this phase.",
    checklist: [
      "Open the listed item",
      "Add the Google Drive link that matches it",
      "Wait for your teacher",
    ],
    done: "Your teacher marks the listed work done.",
  };
}

// Shared by both student pages and staff-facing project templates. Keep this
// helper in the always-loaded bundle so staff views do not depend on loading
// the student-only feature module first.
function studentPhaseShortLabel(key, fallback = "") {
  const labels = {
    start: "Setup",
    "phase-1": "Proposal",
    "phase-2a": "Build I",
    "phase-2b": "Build II",
    "phase-3a": "Present",
    "phase-3b": "Celebrate",
    "phase-4": "Reflect",
    finish: "Finish",
  };
  return labels[key] || String(fallback || "Stage").replace(/^Phase\s+\d+[A-Za-z]?:\s*/i, "").slice(0, 14);
}

function studentInstructionCopy(value, fallback = "") {
  let text = String(value || fallback || "").trim();
  if (!text) return "";
  return text
    .replace(/\bsent work\b/gi, "turned-in work")
    .replace(/\bsend your updated work\b/gi, "turn it in again")
    .replace(/\bsend it back\b/gi, "turn it in again")
    .replace(/\bsend it for\b/gi, "turn it in for")
    .replace(/\bsend them for\b/gi, "turn them in for")
    .replace(/\bsend this work for\b/gi, "turn this work in for")
    .replace(/\bsend work for\b/gi, "turn in work for")
    .replace(/\bsend work\b/gi, "turn in work")
    .replace(/\bsend it\b/gi, "turn it in")
    .replace(/\bsend them\b/gi, "turn them in")
    .replace(/\badd or link proof\b/gi, "add a Google Drive link")
    .replace(/\badd the work or proof\b/gi, "add the work or Google Drive link")
    .replace(/\battach corrected proof\b/gi, "add a corrected file or link")
    .replace(/\battach matching proof\b/gi, "add a matching file or link")
    .replace(/\battach the ([^,.]+?) proof\b/gi, "add the $1 file or link")
    .replace(/\battach proof\b/gi, "add a file or link")
    .replace(/\badd proof\b/gi, "add a file or link")
    .replace(/\bproof link\b/gi, "work link")
    .replace(/\bproof links\b/gi, "work links")
    .replace(/\bproof files\b/gi, "files")
    .replace(/\bproof file\b/gi, "file")
    .replace(/\bproof\b/gi, "file or link")
    .replace(/\byour program teachers\b/gi, "your teachers")
    .replace(/\byour program teacher\b/gi, "your teacher")
    .replace(/\bprogram teachers\b/gi, "teachers")
    .replace(/\bprogram teacher\b/gi, "teacher");
}

function studentSavedWorkVersionText(version, status, fallback = "Not turned in yet") {
  const normalized = normalizeStatus(status);
  if (normalized === "draft") return "Draft saved";
  const safeVersion = safeNumber(version);
  if (safeVersion > 0) return `Turned in #${safeVersion}`;
  return fallback;
}

function replaceStandaloneTeacherPhrase(text, phrase, replacement) {
  const pattern = new RegExp(`\\b${phrase}\\b`, "gi");
  return String(text || "").replace(pattern, (match, offset, fullText) => {
    const before = fullText.slice(Math.max(0, offset - "Program ".length), offset).toLowerCase();
    return before === "program " ? match : replacement;
  });
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

function renderSubmissionRow(submission, feedback = [], historyState = defaultStudentFeedbackHistoryState()) {
  const latestFeedback = latestFeedbackForSubmission(submission, feedback);
  const submissionId = cleanDirectoryFilter(submission?.id || "");
  const approvalGate = studentSubmissionApprovalGateText(submission);
  const isSelected = studentFeedbackSelectionMatches(historyState, submissionId, "submissions");
  const owner = studentSubmissionNextOwner(submission);
  const savedWorkText = studentSavedWorkVersionText(submission?.version, submission?.status, "Work not turned in yet");
  return `
    <article class="workspace-row workspace-student-submission-row" data-student-submission-row="${escapeHtml(submissionId || "true")}">
      <div>
        <strong>${escapeHtml(submission.requirement_title || "Senior Project work")}</strong>
        <p>${escapeHtml(savedWorkText)}. Updated ${escapeHtml(formatDate(submission.updated_at))}.</p>
        ${latestFeedback ? `<p class="workspace-muted" data-submission-feedback="true">Latest teacher feedback: ${escapeHtml(latestFeedback.message || "Your teacher left feedback for this work.")}</p>` : ""}
        <p class="workspace-muted" data-student-submission-next-owner="true">Next move: ${escapeHtml(owner)}</p>
        <p class="workspace-student-submission-gate" data-student-submission-approval-gate="true">${escapeHtml(approvalGate)}</p>
      </div>
      <div class="workspace-row-actions">
        ${submissionId ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-feedback-action="open-history" data-student-feedback-origin="submissions" data-student-feedback-submission-id="${escapeHtml(submissionId)}">${escapeHtml(isSelected ? "Refresh work history" : "View work history")}</button>` : ""}
        ${studentStatusPill(submission.status)}
      </div>
      ${isSelected ? `<div data-student-submission-timeline="true">${renderStudentFeedbackTimeline(historyState)}</div>` : ""}
    </article>
  `;
}

function studentSubmissionNextOwner(submission = {}) {
  const status = studentSubmissionFilterKey(submission?.status);
  if (status === "revision_requested") return "Fix this item, then turn it in again.";
  if (status === "submitted") return "Your teacher checks it next.";
  if (status === "approved") return "Approved for next steps. Keep this as completed work.";
  if (status === "draft") return "You finish the work and add its Google Drive link.";
  return "Ask your teacher what should happen next.";
}

function studentSubmissionApprovalGateText(submission = {}) {
  const status = normalizeStatus(submission?.status);
  if (["approved", "archived", "complete", "completed"].includes(status)) {
    return "Done. Use this approval to continue with the next assigned item.";
  }
  if (["submitted", "under_review", "reviewing", "pending_review"].includes(status)) {
    return "Wait here. Your teacher checks this work before next steps.";
  }
  if (["revision_requested", "needs_revision"].includes(status)) {
    return "Fix this work. Turn it in again. Then wait for your teacher.";
  }
  return "Finish this work. Add its Google Drive link if needed. Then turn it in.";
}

function renderStudentSubmissionFilters(rows = [], activeFilter = "all") {
  const options = studentSubmissionFilterOptions(rows);
  return `
    <div class="workspace-active-filters" data-student-submission-filters="true" data-student-submission-active-filter="${escapeHtml(activeFilter)}">
      ${options.map((option) => `
        <button class="workspace-detail-tab ${option.value === activeFilter ? "is-active" : ""}" type="button" data-student-submission-action="set-filter" data-student-submission-filter="${escapeHtml(option.value)}" aria-pressed="${option.value === activeFilter ? "true" : "false"}">
          ${escapeHtml(`${option.label} (${option.count})`)}
        </button>
      `).join("")}
    </div>
  `;
}

function studentSubmissionFilterOptions(rows = []) {
  const counts = {
    all: Array.isArray(rows) ? rows.length : 0,
    draft: 0,
    submitted: 0,
    revision_requested: 0,
    approved: 0,
  };
  for (const row of Array.isArray(rows) ? rows : []) {
    const status = studentSubmissionFilterKey(row?.status);
    if (status !== "all") counts[status] += 1;
  }
  return [
    { value: "all", label: "All work", count: counts.all },
    { value: "draft", label: "Drafts", count: counts.draft },
    { value: "submitted", label: "Waiting for review", count: counts.submitted },
    { value: "revision_requested", label: "Needs changes", count: counts.revision_requested },
    { value: "approved", label: "Approved", count: counts.approved },
  ];
}

function studentSubmissionFilterKey(value) {
  const normalized = normalizeStatus(value);
  if (["draft", "not_started"].includes(normalized)) return "draft";
  if (["submitted", "under_review", "reviewing", "pending_review"].includes(normalized)) return "submitted";
  if (["revision_requested", "needs_revision"].includes(normalized)) return "revision_requested";
  if (["approved", "archived", "complete", "completed"].includes(normalized)) return "approved";
  return "all";
}

function studentSubmissionFilterLabel(value) {
  if (value === "draft") return "draft work";
  if (value === "submitted") return "work waiting for review";
  if (value === "revision_requested") return "work that needs changes";
  if (value === "approved") return "approved work";
  return "all turned-in work";
}

function filterStudentSubmissionRows(rows = [], filterKey = "all") {
  const activeFilter = studentSubmissionFilterKey(filterKey);
  const safeRows = Array.isArray(rows) ? rows : [];
  if (activeFilter === "all") return safeRows;
  return safeRows.filter((row) => studentSubmissionFilterKey(row?.status) === activeFilter);
}

function renderStudentSubmissionEmptyState(filterKey = "all", totalRows = 0) {
  if (!totalRows) {
    return `
      <article class="workspace-empty-state-card" data-student-submission-empty="true" data-student-submission-empty-filter="none">
        <strong>No work has been started yet.</strong>
        <p>Next person responsible: your teacher adds the first work item. You start when it appears here.</p>
      </article>
    `;
  }
  const activeFilter = studentSubmissionFilterKey(filterKey);
  const copy = {
    draft: {
      title: "No draft work is listed right now.",
      detail: "Show waiting work, work to fix, or approved work.",
    },
    submitted: {
      title: "No work is waiting for review right now.",
      detail: "Show drafts, work to fix, or approved work.",
    },
    revision_requested: {
      title: "No work to fix is listed right now.",
      detail: "Show drafts, waiting work, or approved work.",
    },
    approved: {
      title: "No approved work is listed yet.",
      detail: "Done work will appear here after your teacher checks it.",
    },
    all: {
      title: "No work has been started yet.",
      detail: "Your work history will appear here after you start project work.",
    },
  };
  const selectedCopy = copy[activeFilter] || copy.all;
  return `
    <article class="workspace-empty-state-card" data-student-submission-empty="true" data-student-submission-empty-filter="${escapeHtml(activeFilter)}">
      <strong>${escapeHtml(selectedCopy.title)}</strong>
      <p>${escapeHtml(selectedCopy.detail)}</p>
    </article>
  `;
}

function latestFeedbackForSubmission(submission, feedback = []) {
  const submissionId = String(submission?.id || "");
  if (!submissionId || !Array.isArray(feedback)) return null;
  return feedback.find((item) => item?.submissionId === submissionId) || null;
}

function renderEvidenceRow(item) {
  const actions = renderEvidenceActions(item);
  const reviewStatus = item.review_status || "pending_review";
  const reviewCopy = studentEvidenceReviewStatusCopy(reviewStatus);

  return `
    <article class="workspace-row" data-student-proof-row="true">
      <div>
        <strong>${escapeHtml(item.title || "File or link")}</strong>
        <p>${escapeHtml(evidenceSourceLabel(item.source_kind))} / ${escapeHtml(statusText(item.artifact_type || "file"))}</p>
        ${item.requirementTitle ? `<p class="workspace-muted">Checklist item: ${escapeHtml(item.requirementTitle)}</p>` : ""}
        <p class="workspace-muted" data-proof-review-status="true">${escapeHtml(reviewCopy)}</p>
        ${renderEvidenceAvailabilityStatus(item)}
        ${renderEvidencePreviewStatus(item)}
      </div>
      <div class="workspace-row-actions">
        ${actions.join("")}
        ${studentStatusPill(reviewStatus)}
      </div>
    </article>
  `;
}

function studentEvidenceReviewStatusCopy(status) {
  const normalized = normalizeStatus(status);
  if (["approved", "complete", "completed"].includes(normalized)) return "Teacher review: approved file.";
  if (["revision_requested", "needs_revision"].includes(normalized)) return "Teacher review: file needs changes.";
  if (["rejected", "blocked"].includes(normalized)) return "Teacher review: ask what to replace before using this file.";
  return "Teacher review: waiting.";
}

function evidenceSourceLabel(value) {
  if (value === "google_drive_file") return "Uploaded file";
  if (value === "external_link") return "Linked work";
  if (value === "generated_export") return "Exported package";
  return "File or link";
}

function statusPill(status) {
  const normalized = normalizeStatus(status);
  const statusClass = statusClassFor(status);
  return `<span class="workspace-status-pill ${escapeHtml(statusClass)}" data-status="${escapeHtml(normalized)}">${escapeHtml(statusText(status))}</span>`;
}

function studentStatusPill(status) {
  const normalized = normalizeStatus(status);
  const statusClass = statusClassFor(status);
  return `<span class="workspace-status-pill ${escapeHtml(statusClass)}" data-status="${escapeHtml(normalized)}">${escapeHtml(studentStatusText(status))}</span>`;
}

function statusClassFor(status) {
  const normalized = normalizeStatus(status);
  return STATUS_CLASS_BY_STATUS[normalized] || normalized;
}

function statusText(value) {
  const normalized = normalizeStatus(value);
  return STATUS_LABELS[normalized] || String(value || "Unknown").replace(/_/g, " ");
}

function studentStatusText(value) {
  const normalized = normalizeStatus(value);
  return STUDENT_STATUS_LABELS[normalized] || statusText(value);
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
    archive_ready: "Final files ready",
    archive_failed: "Final files failed",
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
    missing_evidence: "Missing proof",
    mentor_meeting: "Mentor meetings",
    awaiting_review: "Awaiting review",
    revision_requested: "Revision requested",
    presentation_pending: "Presentation pending",
    archive_failed: "Final files failed",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || statusText(value);
}

function riskFilterLabel(value) {
  const labels = {
    any: "Any help need",
    high: "Needs help soon",
    medium: "May need help",
    low: "Doing okay",
    stale: "No recent activity",
    no_mentor: "Missing mentor",
    missing_evidence: "Missing work",
    mentor_meeting: "Mentor meeting",
    awaiting_review: "Waiting for review",
    revision_requested: "Needs changes",
    presentation_pending: "Presentation pending",
    archive_failed: "Final files need help",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || statusText(value);
}

function riskExplanation(value) {
  const labels = {
    high: "Progress has multiple blockers or a strong risk signal.",
    medium: "Progress signals need a closer check.",
    low: "No urgent risk signal is active right now.",
    stale: "Recent activity has slowed and may need staff follow-up.",
    no_mentor: "No active mentor is assigned yet.",
    missing_evidence: "Proof still needs to be attached.",
    awaiting_review: "Submitted work is still waiting for Program Teacher review.",
    revision_requested: "Revision feedback is still open.",
    presentation_pending: "Presentation readiness is still incomplete.",
    archive_failed: "Final-file closeout hit a failure that needs staff review.",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || `${riskLabel(value)} needs follow-up.`;
}

function evidenceStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "attached") return "Proof attached";
  if (normalized === "missing") return "Proof missing";
  return statusText(value || "Any proof status");
}

function studentWorkStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "attached") return "Work attached";
  if (normalized === "missing") return "Missing work";
  return statusText(value || "Any work");
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
  if (normalized === "missing_evidence") return "Missing proof";
  if (normalized === "needs_review") return "Needs review";
  if (normalized === "needs_revision") return "Needs revision";
  if (normalized === "mentor_meeting_follow_up") return "Mentor meeting follow-up";
  if (normalized === "ready_complete") return "Ready / complete";
  return statusText(value || "Any progress");
}

function presentationStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "any") return "Any presentation";
  if (normalized === "pending") return "Ready to present";
  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "completed") return "Presented";
  if (normalized === "missing") return "Missing presentation";
  return statusText(value || "Any presentation");
}

function archiveStatusFilterLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "any") return "Any final files";
  if (normalized === "ready") return "Ready to finish";
  if (normalized === "complete") return "Finished";
  if (normalized === "failed") return "Final files need help";
  if (normalized === "missing") return "Missing final files";
  return statusText(value || "Any final files");
}

function categoryLabel(value) {
  const labels = {
    archive: "Files",
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
  site_admin: "Site Admin",
  administration: "School Admin",
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

const ROLE_PROFILE_ALIASES = {
  platform_admin: "global_admin",
  admin: "global_admin",
};

const ROLE_WORKING_PROFILES = {
  student: {
    title: "Student guide",
    job: "Finish your Senior Project one step at a time. See your goal, what to turn in, notes to fix, talk details, and files to save.",
    quickStart: [
      {
        id: "next",
        step: "1",
        tone: "student",
        title: "Start with Do this next",
        detail: "Open My Work and follow the first action shown at the top. That is the safest next move.",
        section: "student",
        action: "Open My Work",
      },
      {
        id: "phase",
        step: "2",
        tone: "checklist",
        title: "Finish the current phase deliverable",
        detail: "Use the phase goal card to see what must be complete before you move on.",
        section: "student",
        action: "Open phase goals",
      },
      {
        id: "proof",
        step: "3",
        tone: "proof",
        title: "Add files to the exact item",
        detail: "Use a Google Drive link only on the checklist item it belongs to.",
        section: "student",
        action: "Open files",
      },
      {
        id: "wait",
        step: "4",
        tone: "teacher",
        title: "Wait after turning in work",
        detail: "Your teacher opens the next step. If changes are requested, fix that item first.",
        section: "student",
        action: "Open Turned in",
      },
    ],
    see: [
      "Your checklist, due dates, current phase goal, and next step.",
      "Your sent work, proof, Program Teacher feedback, mentor information, presentation status, and May 5 file-saving checks.",
      "Only your own Senior Project work.",
    ],
    do: [
      "Open My Work to follow the current phase goal and work on the next item.",
      "Add a Google Drive link when your teacher asks for it.",
      "Read feedback, fix work, send it again, prepare for presentation, and save final files by May 5.",
    ],
    limits: [
      "You do not review other students.",
      "You do not manage accounts, mentors, schedules for other people, or staff-only reports.",
    ],
    actions: [
      { section: "student", label: "Open My Work", detail: "Current phase goal, next item, feedback, and files." },
      { section: "presentation", label: "Open Presentation", detail: "Time, room, outline status, and what to bring." },
      { section: "archive", label: "Open Final Files", detail: "What to finish and what to save by May 5." },
      { section: "security", label: "Open Account", detail: "Your password and signed-in sessions." },
    ],
  },
  mentor: {
    title: "Mentor guide",
    job: "Support the students assigned to you by checking their progress, meeting status, evidence, feedback needs, and presentation readiness.",
    quickStart: [
      {
        id: "risks",
        step: "1",
        tone: "warning",
        title: "Open students with risks",
        detail: "Start with revision, meeting, presentation, or stale-progress signals before your next check-in.",
        section: "mentorDashboard",
        action: "Open Mentor Dashboard",
      },
      {
        id: "assigned",
        step: "2",
        tone: "student",
        title: "Open one assigned student",
        detail: "Use Assigned Students when you already know which student needs meeting or proof context.",
        section: "mentor",
        action: "Open Assigned Students",
      },
      {
        id: "presentation",
        step: "3",
        tone: "quiet",
        title: "Check presentation context",
        detail: "Confirm schedule, outline, and day-of status for students you support.",
        section: "presentation",
        action: "Open Presentation",
      },
    ],
    see: [
      "Only students actively assigned to you.",
      "Progress signals, proof counts, mentor meeting status, presentation status, and student detail context for assigned students.",
      "Student records needed for mentoring, without account-management tools.",
    ],
    do: [
      "Use Mentor Dashboard to find assigned students who need help first.",
      "Open Assigned Students to review each student before meetings or presentation preparation.",
      "Record mentor meeting notes where the workspace allows it.",
    ],
    limits: [
      "You do not approve Program Teacher review work.",
      "You do not manage users, roles, mentor assignments, audit records, or school-wide settings.",
    ],
    actions: [
      { section: "mentorDashboard", label: "Open Mentor Dashboard", detail: "Assigned-student risks and focus filters." },
      { section: "mentor", label: "Open Assigned Students", detail: "Student cards and proof counts." },
      { section: "presentation", label: "Open Presentation", detail: "Presentation status for assigned work." },
      { section: "security", label: "Open Account", detail: "Password and session controls." },
    ],
  },
  viewer: {
    title: "Viewer guide",
    job: "Read assigned student records for context without changing student work, reviews, assignments, accounts, or school operations.",
    quickStart: [
      {
        id: "read-only",
        step: "1",
        tone: "quiet",
        title: "Open assigned students",
        detail: "Start with the read-only student list and open only records assigned to this account.",
        section: "students",
        action: "Open Students",
      },
      {
        id: "share-context",
        step: "2",
        tone: "student",
        title: "Share context with the owner",
        detail: "When a student seems stuck, tell the Program Teacher or site staff what you saw instead of changing the record.",
        section: "students",
        action: "Review context",
      },
    ],
    see: [
      "Only the student records assigned to you.",
      "Student detail, progress signals, proof summaries, and status history that your assignment allows.",
      "Read-only context for support conversations.",
    ],
    do: [
      "Search assigned students and open the student detail page.",
      "Review progress, feedback, proof counts, and readiness context.",
      "Use the information to support students outside the app when appropriate.",
    ],
    limits: [
      "You do not submit work, review work, approve work, manage mentors, change schedules, or manage accounts.",
      "You do not see school-wide tools unless another assigned role grants them.",
    ],
    actions: [
      { section: "students", label: "Open Students", detail: "Search assigned student records." },
      { section: "security", label: "Open Account", detail: "Password and session controls." },
    ],
  },
  program_teacher: {
    title: "Program Teacher first steps",
    job: "If you teach a CTE class, start here. Review student work. Find students who are stuck. Leave a clear next step.",
    quickStart: [
      {
        id: "review",
        step: "1",
        title: "Review work students turned in",
        detail: "Open this first when students are waiting for approval, revision notes, or comment-only feedback.",
        section: "teacher",
        preset: "submitted",
        action: "Open Review Work",
        tone: "primary",
      },
      {
        id: "stuck",
        step: "2",
        title: "Find who needs help",
        detail: "Use this when you want a short list of students missing proof, behind, or waiting on a next move.",
        section: "programDashboard",
        action: "Open Program Dashboard",
        tone: "warning",
      },
      {
        id: "student",
        step: "3",
        title: "Look up one student",
        detail: "Use this when you already know the student's name and want their checklist, proof, or feedback history.",
        section: "students",
        action: "Open Students",
        tone: "student",
      },
      {
        id: "later",
        step: "Later",
        title: "Check event or final-file blockers",
        detail: "Use this after review work if presentations, mentor coverage, or final files need staff follow-up.",
        section: "operations",
        action: "Open Operations",
        tone: "quiet",
      },
    ],
    see: [
      "Your assigned students, such as the IT, construction, culinary, or shop class roster.",
      "Work students turned in for your review.",
      "Student proof, mentor, presentation, and final-file signals when they affect your students.",
    ],
    do: [
      "Start with Review Work when students have turned in work.",
      "Use Program Dashboard when you want the shortest list of students who need help.",
      "Open Students when you know the student's name.",
      "Use People and Assignments only when the student or mentor roster is wrong.",
    ],
    limits: [
      "You do not run district, platform, or security setup.",
      "You do not manage other teacher, School Admin, Site Admin, or Global Admin accounts.",
    ],
    actions: [
      { section: "teacher", preset: "submitted", label: "Open Review Work", detail: "Approve work, request revision, or leave feedback." },
      { section: "programDashboard", label: "Open Program Dashboard", detail: "Students who need your attention first." },
      { section: "students", label: "Open Students", detail: "Search one student by name." },
      { section: "operations", label: "Open Operations", detail: "Presentation, mentor, and final-file blockers." },
    ],
  },
  administration: {
    title: "School Admin guide",
    job: "Help the schools assigned to you. Manage who can see or help with student work. Watch for work that needs help.",
    quickStart: [
      {
        id: "school",
        step: "1",
        tone: "school",
        title: "Check school status",
        detail: "Open Site Dashboard first to see progress, review load, mentor coverage, and student follow-up needs.",
        section: "siteDashboard",
        action: "Open Site Dashboard",
      },
      {
        id: "operations",
        step: "2",
        tone: "warning",
        title: "Open blockers",
        detail: "Use Operations when presentation, final-file, mentor, or readiness work needs staff follow-up.",
        section: "operations",
        action: "Open Operations",
      },
      {
        id: "access",
        step: "3",
        tone: "primary",
        title: "Fix roster access in Admin Console",
        detail: "Use People and Access for student, mentor, viewer, and Program Teacher roster corrections.",
        section: "adminUsers",
        action: "Open People and Assignments",
      },
    ],
    see: [
      "Assigned school dashboard, student directory, mentor coverage, site access records, operations readiness, presentation status, and aggregate readiness.",
      "Student detail context for leadership follow-up.",
      "School health and progress signals for the schools assigned to you.",
    ],
    do: [
      "Review the Site Dashboard for school-wide status.",
      "Open People and Assignments to add or remove students, mentors, viewers, and Program Teachers for assigned schools.",
      "Open Students, Operations, Presentation, and Readiness to find who needs staff follow-up.",
    ],
    limits: [
      "You do not create or remove Global Admin or Site Admin access.",
      "You do not use global platform tools or change platform security setup.",
    ],
    actions: [
      { section: "siteDashboard", label: "Open Site Dashboard", detail: "School-wide progress and needs." },
      { section: "adminUsers", label: "Open People and Assignments", detail: "Students, mentors, viewers, and Program Teachers." },
      { section: "mentorAssignments", label: "Open Mentor Assignments", detail: "Coverage and assignment workflow." },
      { section: "students", label: "Open Students", detail: "Student directory and follow-up filters." },
      { section: "operations", label: "Open Operations", detail: "Presentation, final-file, and readiness blockers." },
      { section: "presentation", label: "Open Presentation", detail: "Schedule and day-of status." },
      { section: "readiness", label: "Open Readiness", detail: "Aggregate school readiness." },
    ],
  },
  site_admin: {
    title: "Site Admin guide",
    job: "Run the assigned school's capstone setup and operations: students, programs, mentor coverage, site access, readiness, presentations, and closeout follow-up.",
    quickStart: [
      {
        id: "site",
        step: "1",
        tone: "school",
        title: "Review the selected school",
        detail: "Start with Site Dashboard to confirm student progress, review load, and mentor coverage.",
        section: "siteDashboard",
        action: "Open Site Dashboard",
      },
      {
        id: "people",
        step: "2",
        tone: "primary",
        title: "Fix People and Access",
        detail: "Use Admin Console when staff, viewer, mentor, Program Teacher, or student access needs correction.",
        section: "adminUsers",
        action: "Open People and Assignments",
      },
      {
        id: "programs",
        step: "3",
        tone: "checklist",
        title: "Confirm site programs",
        detail: "Use Programs only for the selected school before changing roster or review expectations.",
        section: "programs",
        action: "Open Programs",
      },
    ],
    see: [
      "Assigned school dashboards, student directory, review context, mentor coverage, operations readiness, presentation status, and site access records.",
      "User and assignment tools limited to the assigned school.",
      "Readiness and final-file signals needed for local follow-up.",
    ],
    do: [
      "Choose the current school, review Site Dashboard, and open priority student records.",
      "Manage site programs, site users, viewer access, mentors, and mentor assignments where allowed.",
      "Coordinate presentation, final-file, and readiness follow-up for the school.",
    ],
    limits: [
      "You do not manage every school unless assigned to them.",
      "You do not create or remove Global Admin access.",
    ],
    actions: [
      { section: "siteDashboard", label: "Open Site Dashboard", detail: "School-wide progress and needs." },
      { section: "adminUsers", label: "Open People and Assignments", detail: "Site users and role assignments." },
      { section: "mentorAssignments", label: "Open Mentor Assignments", detail: "Coverage and assignment workflow." },
      { section: "programs", label: "Open Programs", detail: "Programs active at the school." },
      { section: "students", label: "Open Students", detail: "Student detail and filters." },
      { section: "operations", label: "Open Operations", detail: "Readiness and closeout blockers." },
    ],
  },
  global_admin: {
    title: "Global Admin guide",
    job: "Operate the full platform: all schools, users, site access, audit visibility, final-file export follow-up, readiness, and high-level workflow health.",
    quickStart: [
      {
        id: "command",
        step: "1",
        tone: "primary",
        title: "Open the command center",
        detail: "Start in Admin Console to see cross-site risk, review load, mentor coverage, and final-file status.",
        section: "adminDashboard",
        action: "Open Command Center",
      },
      {
        id: "access",
        step: "2",
        tone: "school",
        title: "Confirm access changes",
        detail: "Use People and Access for platform, site, staff, viewer, mentor, and student account work.",
        section: "adminUsers",
        action: "Open People and Assignments",
      },
      {
        id: "audit",
        step: "3",
        tone: "quiet",
        title: "Check audit activity",
        detail: "Use Audit and Security only when the question needs elevated account or activity context.",
        section: "audit",
        action: "Open Audit",
      },
    ],
    see: [
      "All platform schools and the global command center.",
      "Student directory, review queue, site dashboards, mentor coverage, operations, readiness, audit activity, and final-file export status.",
      "User and access tools needed to keep the system running.",
    ],
    do: [
      "Use Admin Command Center to watch platform risks and open the right worklist.",
      "Manage users and access, inspect audit activity, and follow final-file export failures.",
      "Use the site switcher to review one school at a time when a route needs site context.",
    ],
    limits: [
      "Use global access carefully because it can affect every school.",
      "Open student records only for real operational need.",
    ],
    actions: [
      { section: "adminDashboard", label: "Open Command Center", detail: "Platform risks and quick actions." },
      { section: "siteDashboard", label: "Open Site Dashboard", detail: "Selected school progress and needs." },
      { section: "adminUsers", label: "Open People and Assignments", detail: "Create users and manage access." },
      { section: "audit", label: "Open Audit", detail: "Protected activity review." },
      { section: "archiveExports", label: "Open Final Files", detail: "Closeout package status." },
      { section: "readiness", label: "Open Readiness", detail: "Aggregate readiness reports." },
    ],
  },
  misc_admin: {
    title: "Reporting Admin guide",
    job: "Review aggregate readiness reporting without opening individual student records or changing operational data.",
    quickStart: [
      {
        id: "readiness",
        step: "1",
        tone: "quiet",
        title: "Open aggregate readiness",
        detail: "Start with the summary report and keep follow-up routed to authorized school staff.",
        section: "readiness",
        action: "Open Readiness",
      },
    ],
    see: [
      "Aggregate readiness signals available to the legacy reporting role.",
      "Summary counts and high-level readiness status.",
      "Account settings for your own sign-in.",
    ],
    do: [
      "Open Readiness to review aggregate project status.",
      "Share summary follow-up needs with authorized school staff.",
    ],
    limits: [
      "You do not open individual student records.",
      "You do not manage users, reviews, mentor assignments, presentation operations, audit activity, or final-file packages.",
    ],
    actions: [
      { section: "readiness", label: "Open Readiness", detail: "Aggregate project readiness." },
      { section: "security", label: "Open Account", detail: "Password and session controls." },
    ],
  },
  role_pending: {
    title: "Role pending profile",
    job: "Wait for the project coordinator or site administrator to assign the correct workspace role before using protected project tools.",
    see: [
      "Your signed-in account state.",
      "The account page for password and session controls.",
    ],
    do: [
      "Ask the project coordinator or site administrator to assign the right role.",
      "Refresh the workspace after access is assigned.",
    ],
    limits: [
      "You cannot open student, staff, site, review, mentor, readiness, or admin work until a role is assigned.",
    ],
    actions: [
      { section: "security", label: "Open Account", detail: "Password and session controls." },
    ],
  },
};

function roleProfileKey(roleId) {
  const normalized = normalizeStatus(roleId || "role_pending");
  return ROLE_PROFILE_ALIASES[normalized] || normalized;
}

function workingProfileForRole(roleId) {
  return ROLE_WORKING_PROFILES[roleProfileKey(roleId)] || ROLE_WORKING_PROFILES.role_pending;
}

function renderRoleProfileSection(options = {}) {
  const primaryRole = primaryRoleForUser(currentUser);
  const profileKey = roleProfileKey(primaryRole);
  const profile = workingProfileForRole(primaryRole);
  const compact = Boolean(options.compact);
  const titleId = compact ? "roleProfileOverviewTitle" : "roleProfileTitle";
  return `
    <section class="workspace-role-profile" data-role-profile="${escapeHtml(primaryRole)}" data-role-profile-key="${escapeHtml(profileKey)}" aria-labelledby="${escapeHtml(titleId)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${compact ? "Help" : "Role guide"}</p>
          <h2 id="${escapeHtml(titleId)}">${escapeHtml(profile.title)}</h2>
          <p class="workspace-muted">${escapeHtml(profile.job)}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(roleLabel(primaryRole))}</span>
      </div>
      ${renderRoleProfileQuickStart(profile.quickStart, { studentView: profileKey === "student" })}
      <div class="workspace-role-profile-grid">
        ${renderRoleProfileBlock("What you can see", profile.see)}
        ${renderRoleProfileBlock("What you do here", profile.do)}
        ${renderRoleProfileBlock("What stays out of this role", profile.limits)}
      </div>
      ${renderRoleProfileActions(profile.actions)}
      ${compact ? "" : renderRoleProfileScopeSummary()}
      ${compact || profileKey !== "program_teacher" ? "" : renderProgramStorageSettings()}
    </section>
  `;
}

function renderProgramStorageSettings() {
  const result = currentData.programStorage;
  if (!result) {
    return `
      <section class="workspace-card workspace-role-profile-storage" data-program-storage-settings="choose-scope">
        <p class="workspace-kicker">Program file storage</p>
        <h3>Connect your program’s Google Shared Drive folder</h3>
        <p class="workspace-muted">Choose your school in Tools first if you work at more than one school.</p>
      </section>
    `;
  }
  if (!result.ok) {
    return `
      <section class="workspace-card workspace-role-profile-storage" data-program-storage-settings="error">
        <p class="workspace-kicker">Program file storage</p>
        <h3>Storage settings could not load</h3>
        <p class="workspace-muted">Refresh this page. If it still fails, ask a Site Admin to check your program assignment.</p>
      </section>
    `;
  }
  const data = result.body || {};
  const storage = data.storage || {};
  const setup = data.setup || {};
  const programOptions = programStorageProgramOptions();
  const connected = storage.configured && storage.status === "ready";
  const shareEmail = String(setup.shareWithEmail || "").trim();
  return `
    <section class="workspace-card workspace-role-profile-storage" data-program-storage-settings="${escapeHtml(storage.status || "not_configured")}" aria-labelledby="programStorageTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Program file storage</p>
          <h3 id="programStorageTitle">${connected ? "Student uploads are connected" : "Connect your program’s Google Shared Drive folder"}</h3>
          <p class="workspace-muted">${escapeHtml(data.scope?.programName || "Your program")} / ${escapeHtml(data.scope?.siteName || "Your school")}</p>
        </div>
        <span class="workspace-summary-badge">${connected ? "Ready" : storage.status === "disconnected" ? "Disconnected" : "Setup needed"}</span>
      </div>
      <div class="workspace-role-profile-grid">
        <article class="workspace-role-profile-block"><h3>1. Make the folder</h3><p>Create a dedicated folder here, or choose one inside a school Google Shared Drive. Your school keeps control of the files.</p></article>
        <article class="workspace-role-profile-block"><h3>2. Share it with the app</h3><p>${shareEmail ? `Give <strong>${escapeHtml(shareEmail)}</strong> Editor access.` : "Ask a Global Admin to finish the app’s Google Drive connection."}</p></article>
        <article class="workspace-role-profile-block"><h3>3. Paste and verify</h3><p>Paste the folder link below. Students can then upload PDF and DOCX proof here.</p></article>
      </div>
      ${programOptions.length > 1 ? `
        <label class="workspace-program-storage-picker">
          <span>Program file settings</span>
          <select data-program-storage-program aria-label="Choose a program for file settings">
            ${programOptions.map((program) => `<option value="${escapeHtml(program.programId)}" ${program.programId === data.scope?.programId ? "selected" : ""}>${escapeHtml(program.programName)}</option>`).join("")}
          </select>
          <small>Each program keeps its own folder and connection history.</small>
        </label>
      ` : ""}
      ${connected ? `
        <div class="workspace-mini-row" data-program-storage-current="true">
          <span><strong>${escapeHtml(storage.folderName || "Program files")}</strong></span>
          <small>Verified connection / revision ${escapeHtml(String(storage.revision || 1))}</small>
          <div class="workspace-row-actions">
            <a class="workspace-link-button workspace-link-button-small" href="${escapeHtml(storage.openUrl || "")}" target="_blank" rel="noopener noreferrer">Open folder</a>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-program-storage-action="verify">Check connection</button>
          </div>
        </div>
      ` : ""}
      ${setup.canManage ? `
        ${!connected && setup.canCreateManagedFolder ? `
          <div class="workspace-mini-row" data-program-storage-create="true">
            <span><strong>Fast setup</strong><small>Create a dedicated folder inside your school’s connected Shared Drive.</small></span>
            <button class="workspace-button workspace-button-primary" type="button" data-program-storage-action="create">Create my program folder</button>
          </div>
          <p class="workspace-muted">Already have a folder? Connect it below instead.</p>
        ` : ""}
        <form id="programStorageForm" class="workspace-form" data-program-storage-form="configure">
          <label><span>${connected ? "Replace the connected folder" : "Google Drive folder link"}</span><input name="folderUrl" type="url" inputmode="url" required maxlength="2048" aria-describedby="programStorageLinkHelp"><small id="programStorageLinkHelp">Example: https://drive.google.com/drive/folders/...</small></label>
          <label class="workspace-check-row"><input name="confirmedSharedWithApp" type="checkbox" required><span>I shared this folder with the app storage account as an Editor.</span></label>
          <p class="workspace-muted">A new folder changes only future uploads. Existing files keep their original folder revision.</p>
          <div class="workspace-row-actions">
            <button class="workspace-button workspace-button-primary" type="submit">${connected ? "Verify and replace folder" : "Verify and connect folder"}</button>
            ${connected ? '<button class="workspace-button workspace-button-secondary" type="button" data-program-storage-action="disconnect">Disconnect future uploads</button>' : ""}
          </div>
        </form>
      ` : '<p class="workspace-muted">Only the assigned Program Teacher or a Global Admin can change this connection.</p>'}
    </section>
  `;
}

function renderRoleProfileQuickStart(steps = [], options = {}) {
  const sectionIds = availableSectionIdsForAnyMode();
  const visibleSteps = (Array.isArray(steps) ? steps : []).filter((step) => step?.section && sectionIds.has(step.section));
  if (!visibleSteps.length) return "";
  const studentView = Boolean(options.studentView);
  return `
    <section class="workspace-role-profile-start" data-role-profile-start="true" aria-labelledby="roleProfileStartTitle">
      <div>
        <span>Start here today</span>
        <strong id="roleProfileStartTitle">Most days, use these in order.</strong>
        <p>${escapeHtml(studentView ? "Do not scan every menu first. Start with Do this next, then check the current phase goal." : "Do not scan every menu first. Start with the card that matches the student problem in front of you.")}</p>
      </div>
      <div class="workspace-role-profile-start-grid">
        ${visibleSteps.map((step) => renderRoleProfileStartCard(step)).join("")}
      </div>
    </section>
  `;
}

function renderRoleProfileStartCard(step = {}) {
  return `
    <article class="workspace-role-profile-start-card ${escapeHtml(step.tone || "quiet")}" data-role-profile-start-card="${escapeHtml(step.id || step.section || "step")}">
      <div>
        <span>${escapeHtml(step.step || "Next")}</span>
        <strong>${escapeHtml(step.title || "Open the next workspace")}</strong>
        <p>${escapeHtml(step.detail || "")}</p>
      </div>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(step.section)}" ${step.preset ? `data-section-preset="${escapeHtml(step.preset)}"` : ""}>
        ${escapeHtml(step.action || "Open")}
      </button>
    </article>
  `;
}

function renderRoleProfileBlock(title, items = []) {
  return `
    <article class="workspace-role-profile-block">
      <h3>${escapeHtml(title)}</h3>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderRoleProfileActions(actions = []) {
  const sectionIds = availableSectionIdsForAnyMode();
  const visibleActions = actions.filter((action) => action.section && sectionIds.has(action.section));
  if (!visibleActions.length) {
    return `
      <div class="workspace-empty" data-role-profile-actions="none">
        No workspace sections are open for this role yet. Ask the project coordinator to confirm access.
      </div>
    `;
  }
  return `
    <div class="workspace-role-profile-actions" data-role-profile-actions="${escapeHtml(String(visibleActions.length))}">
      ${visibleActions.map((action) => `
        <button class="workspace-quick-action" type="button" data-section="${escapeHtml(action.section)}" ${action.preset ? `data-section-preset="${escapeHtml(action.preset)}"` : ""} data-profile-action-section="${escapeHtml(action.section)}">
          <strong>${escapeHtml(action.label || "Open section")}</strong>
          <span>${escapeHtml(action.detail || "Open this workspace section.")}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderRoleProfileScopeSummary() {
  const roles = currentUser?.roles || [];
  return `
    <section class="workspace-role-profile-scope" aria-label="Workspace assignments">
      <p class="workspace-kicker">Workspace assignments</p>
      <div class="workspace-chip-row">
        ${roles.length ? roleChips(currentUser) : `<span class="workspace-chip">Role pending</span>`}
      </div>
    </section>
  `;
}

function assignedRoleIds(user) {
  return new Set((user?.roles || []).map((role) => role.role_id));
}

function canSwitchAdminRoleMode(user = currentUser) {
  return hasGlobalAdminRole(assignedRoleIds(user));
}

function roleIds(user) {
  const assignedRoles = assignedRoleIds(user);
  if (user === currentUser && canSwitchAdminRoleMode(user) && activeAdminRoleMode === "site_admin") {
    return new Set(["site_admin"]);
  }
  return assignedRoles;
}

function hasGlobalAdminRole(roles) {
  return roles.has("global_admin") || roles.has("admin") || roles.has("platform_admin");
}

function isReadOnlyAdministrationUser(user) {
  return false;
}

function canUseUsersAccess(roles) {
  return hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration") || roles.has("program_teacher");
}

function canUseStaffAccessManagement(roles) {
  return hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration");
}

function canUseSitePrograms(roles) {
  return hasGlobalAdminRole(roles) || roles.has("site_admin");
}

function hasSiteDashboardRole(roles) {
  return ["platform_admin", "global_admin", "admin", "site_admin", "administration"].some((role) => roles.has(role));
}

function hasSiteStudentDirectoryRole(roles) {
  return ["platform_admin", "global_admin", "admin", "site_admin", "administration", "viewer", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteReviewQueueRole(roles) {
  return ["platform_admin", "global_admin", "admin", "site_admin", "program_teacher", "mentor"].some((role) => roles.has(role));
}

function hasSiteMentorAssignmentRole(roles) {
  return ["platform_admin", "global_admin", "admin", "site_admin", "administration", "program_teacher"].some((role) => roles.has(role));
}

function hasSiteOperationsRole(roles) {
  return ["platform_admin", "global_admin", "admin", "site_admin", "administration", "program_teacher"].some((role) => roles.has(role));
}

function hasStaffReportsSection(roles) {
  return hasSiteStudentDirectoryRole(roles)
    || hasSiteReviewQueueRole(roles)
    || hasSiteOperationsRole(roles)
    || roles.has("mentor")
    || roles.has("misc_admin");
}

function adminConsoleCapabilitiesFor(user = currentUser) {
  const roles = roleIds(user);
  const globalAdmin = hasGlobalAdminRole(roles);
  const writableStaff = globalAdmin
    || roles.has("site_admin")
    || roles.has("administration")
    || roles.has("program_teacher");
  const canSee = globalAdmin
    || roles.has("site_admin")
    || roles.has("administration")
    || roles.has("program_teacher");
  const readOnly = roles.has("viewer") && !writableStaff;
  const scope = adminConsoleScopeForRoles(roles);
  const sections = canSee ? adminConsoleSectionsForRoles(roles) : [];
  return {
    canSee,
    readOnly,
    scope,
    sections,
    sectionIds: new Set(sections.map((section) => section.id)),
    actions: {
      students: {
        visible: sections.some((section) => ["students", "mentorDashboard", "mentor"].includes(section.id)),
        writable: false,
      },
      review: {
        visible: sections.some((section) => section.id === "teacher"),
        writable: roles.has("program_teacher"),
      },
      peopleAccess: {
        visible: sections.some((section) => section.id === "adminUsers"),
        writable: !readOnly && canUseUsersAccess(roles),
      },
      programs: {
        visible: sections.some((section) => section.id === "programs"),
        writable: !readOnly && canUseSitePrograms(roles),
      },
      settings: {
        visible: sections.some((section) => section.id === "security"),
        writable: globalAdmin,
      },
    },
  };
}

function adminConsoleScopeForRoles(roles) {
  if (hasGlobalAdminRole(roles)) {
    return { key: "global", label: "Global", detail: "All schools where the current APIs allow access." };
  }
  if (roles.has("site_admin")) {
    return { key: "site", label: "Site", detail: "Assigned site only." };
  }
  if (roles.has("administration")) {
    return { key: "site", label: "School", detail: "Assigned school oversight." };
  }
  if (roles.has("program_teacher")) {
    return { key: "program", label: "Program", detail: "Assigned program students and review work." };
  }
  if (roles.has("mentor")) {
    return { key: "assigned_students", label: "Assigned students", detail: "Students actively assigned to this mentor." };
  }
  if (roles.has("viewer")) {
    return { key: "read_only", label: "Read-only", detail: "Assigned student records only." };
  }
  return { key: "none", label: "Workspace", detail: "No staff console access is assigned." };
}

function adminConsoleSectionsForRoles(roles) {
  const sections = [];
  const programTeacherOnly = roles.has("program_teacher")
    && !hasGlobalAdminRole(roles)
    && !roles.has("site_admin")
    && !roles.has("administration");
  const add = (id, label, detail, options = {}) => {
    if (!sections.some((section) => section.id === id)) sections.push({ id, label, detail, ...options });
  };
  add("overview", "Overview", "Setup issues and quick actions");

  if (canUseUsersAccess(roles)) {
    if (!programTeacherOnly) {
      add("adminPeople", "People", "Staff and account setup");
      add("adminStudents", "Students", "Student roster setup");
    }
    add("adminAssignments", programTeacherOnly ? "Mentors" : "Assignments", programTeacherOnly ? "Mentor coverage for your students" : "Mentor, viewer, and program coverage");
  }
  if (canUseSitePrograms(roles)) {
    add("programs", "Programs", "Site program management");
  }
  if (canUseUsersAccess(roles)) {
    if (!programTeacherOnly) {
      add("adminImports", "Imports", "CSV templates and preview");
      add("adminUsers", "People & Access", "Legacy people and access renderer", { hidden: true });
    }
  }

  if (hasSiteStudentDirectoryRole(roles)) {
    add("students", "Student Directory", "Browse the students in this scope");
  }
  if (hasSiteReviewQueueRole(roles)) {
    add("teacher", "Review / Evidence", "Open submitted work and evidence");
  }
  if (hasSiteMentorAssignmentRole(roles)) {
    add("mentorAssignments", "Mentor Assignments", "Review and fix mentor coverage");
  }
  if (hasSiteOperationsRole(roles)) {
    add("operations", "Operations", "Open the readiness worklist");
  }
  if (roles.has("administration") || roles.has("site_admin") || hasGlobalAdminRole(roles)) {
    add("presentation", "Presentation", "Schedule and day-of status");
    add("readiness", "Readiness", "Project readiness details");
    add("adminReports", "Reports", "Roster and operational health");
  }
  if (hasGlobalAdminRole(roles)) {
    add("adminDashboard", "Global Overview", "All-schools overview");
    add("siteDashboard", "Site Overview", "Current-site health");
    add("archiveExports", "Final Files", "Closeout package status");
    add("audit", "Audit", "Access review and recent changes");
    add("security", "Settings / Security", "Account and session controls");
  } else if (roles.has("site_admin") || roles.has("administration")) {
    add("siteDashboard", "Site Overview", "Site or school health");
  }

  return sections;
}

function defaultSiteStudentFilters() {
  return {
    search: "",
    programId: "",
    cohortId: "",
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

function defaultProjectDirectoryFilters() {
  return {
    search: "",
    filter: "all",
    sort: "action",
    page: 1,
    pageSize: 25,
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
    submissionId: "",
    search: "",
    story: "",
    risk: "any",
    evidenceStatus: "",
    limit: 10,
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

function defaultAdminAuditFilters() {
  return {
    action: "",
    entityType: "",
    limit: 50,
  };
}

function defaultSiteStudentDetailState() {
  return {
    studentId: "",
    sourceSection: "students",
    activeTab: "overview",
    loading: false,
    loadingTimeline: false,
    timelineType: "",
    result: null,
    timelineResult: null,
  };
}

function defaultViewAsStudentState() {
  return {
    studentId: "",
    studentName: "",
    sourceSection: "students",
    sourceMode: "workspace",
    loading: false,
    result: null,
    archiveResult: null,
  };
}

function defaultStudentRequirementDetailState() {
  return {
    selectedRequirementId: "",
    selectedPhaseKey: "",
  };
}

function defaultStudentFeedbackFilter() {
  return "all";
}

function defaultStudentSubmissionFilter() {
  return "all";
}

function defaultStudentFeedbackHistoryState() {
  return {
    selectedSubmissionId: "",
    source: "feedback",
    loading: false,
    result: null,
  };
}

function defaultStudentDisclosureState() {
  return {
    requirements: false,
    feedback: false,
    progress: false,
    evidence: false,
    submissions: false,
    files: false,
    projectTools: false,
  };
}

function defaultStudentProofReceiptState() {
  return {
    visible: false,
    proofKind: "",
    submissionId: "",
    requirementId: "",
    title: "",
    fileName: "",
    requirementTitle: "",
    savedAt: "",
  };
}

function defaultUsersAccessDisclosureState() {
  return {
    history: false,
    guidance: false,
  };
}

function defaultAdminCsvImportState() {
  return {
    students: defaultAdminCsvImportKindState("students"),
    staff: defaultAdminCsvImportKindState("staff"),
  };
}

function defaultAdminCsvImportKindState(kind = "students") {
  return {
    kind,
    csvText: "",
    fileName: "",
    previewed: false,
    confirmed: false,
    rows: [],
    validRows: [],
    errors: [],
    summary: defaultAdminCsvSummary(),
  };
}

function defaultAdminCsvSummary() {
  return {
    rowsDetected: 0,
    validRows: 0,
    rowsWithErrors: 0,
    newRecords: 0,
    existingRecords: 0,
    mentorAssignmentsCreated: 0,
    mentorAssignmentsSkipped: 0,
    projectMentorsCreated: 0,
    projectProgramTeachersCreated: 0,
    viewerAssignmentsCreated: 0,
    viewerAssignmentsSkipped: 0,
  };
}

function defaultDashboardDisclosureState() {
  return {
    siteDashboard: false,
    adminDashboard: false,
    programDashboard: false,
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
  const previousAdminRoleMode = activeAdminRoleMode;
  applyWorkspaceUrlState(state);
  if (currentUser && previousAdminRoleMode !== activeAdminRoleMode) {
    clearWorkspaceDataForSiteChange();
    ensureActiveWorkspaceModeAndSection();
    if (workspaceRoleModeNeedsSiteSelection()) {
      renderAppShell("Site Admin mode restored. Choose a school in Tools to load school-scoped records.", "success");
      return;
    }
    await loadWorkspaceData(activeAdminRoleMode === "site_admin" ? "Site Admin mode restored." : "Global Admin mode restored.");
    return;
  }
  const roles = roleIds(currentUser);
  if (state.hasViewAsStudentState && currentUser && canUseViewAsStudent(roles)) {
    await restoreViewAsStudentFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: "Student view link restored.",
      errorMessage: "Student view is not available for this account.",
    });
    return;
  }
  if (state.hasReviewQueueState && currentUser && hasSiteReviewQueueRole(roles)) {
    await loadReviewQueueResult(state.hasSiteStudentDetailState ? "Student detail link restored." : "Review work link restored.", { syncUrl: false });
    return;
  }
  if (state.hasSiteStudentState && currentUser && hasSiteStudentDirectoryRole(roles)) {
    await loadWorkspaceData(state.hasSiteStudentDetailState ? "Student detail link restored." : "Student directory link restored.");
    return;
  }
  if (state.hasMentorAssignmentState && currentUser && hasSiteMentorAssignmentRole(roles)) {
    await loadMentorAssignmentsResult(state.hasSiteStudentDetailState ? "Student detail link restored." : "Mentor assignment link restored.");
    return;
  }
  if (state.hasOperationsReadinessState && currentUser && hasSiteOperationsRole(roles)) {
    await loadOperationsReadinessResult(state.hasSiteStudentDetailState ? "Student detail link restored." : "Operations readiness link restored.");
    return;
  }
  if (state.hasMentorDashboardState && currentUser && (roles.has("mentor") || hasGlobalAdminRole(roles))) {
    if (state.hasSiteStudentDetailState && shouldRestoreSiteStudentDetailFromUrlState(roles, "mentorDashboard")) {
      await restoreSiteStudentDetailFromUrlState({
        renderLoading: false,
        syncUrl: false,
        message: "Student detail link restored.",
      });
      return;
    }
    renderAppShell(mentorDashboardFilter === "all" ? "Mentor dashboard link restored." : "Mentor dashboard focus restored.", "success");
    return;
  }
  if (state.hasPresentationScheduleState && currentUser && availableSectionIdsForAnyMode().has("presentation")) {
    renderAppShell(presentationSlotFilter === "all" ? "Presentation schedule link restored." : "Presentation schedule focus restored.", "success");
    return;
  }
  if (state.hasAdminAuditState && currentUser && availableSectionIdsForAnyMode().has("audit")) {
    await loadAdminAuditEventsResult(adminAuditFilters.action || adminAuditFilters.entityType
      ? "Protected activity link restored."
      : "Audit link restored.");
    return;
  }
  if (state.hasAdminArchiveExportState && currentUser && availableSectionIdsForAnyMode().has("archiveExports")) {
    renderAppShell(adminArchiveExportFilter === "all"
      ? "Final Files link restored."
      : `${adminArchiveExportFilterLabel(adminArchiveExportFilter)} archive filter restored.`, "success");
    return;
  }
  if (state.hasAdminPeopleState && currentUser && availableSectionIdsForAnyMode().has("adminUsers")) {
    renderAppShell("People link restored.", "success");
    return;
  }
  if (state.hasSiteStudentDetailState && currentUser && shouldRestoreSiteStudentDetailFromUrlState(roles, state.siteStudentDetailState?.sourceSection || state.section)) {
    await restoreSiteStudentDetailFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: "Student detail link restored.",
    });
    return;
  }
  renderAppShell();
}

function applyWorkspaceUrlState(state, options = {}) {
  if (!state) return;
  activeAdminRoleMode = cleanAdminRoleMode(state.adminRoleMode) || "global_admin";
  if (currentUser && !canSwitchAdminRoleMode(currentUser)) activeAdminRoleMode = "global_admin";
  if (state.siteId) selectedSiteId = state.siteId;
  const roles = roleIds(currentUser);
  const canRestoreViewAs = state.hasViewAsStudentState && canUseViewAsStudent(roles);
  if (canRestoreViewAs) {
    viewAsStudentState = {
      ...defaultViewAsStudentState(),
      ...state.viewAsStudentState,
    };
    activeWorkspaceMode = "workspace";
    blockedWorkspaceMode = "";
  } else if (!state.hasViewAsStudentState) {
    viewAsStudentState = defaultViewAsStudentState();
  } else if (currentUser) {
    viewAsStudentState = defaultViewAsStudentState();
  }
  const requestedMode = cleanWorkspaceMode(state.mode);
  if (requestedMode === "admin") {
    if (adminConsoleCapabilitiesFor(currentUser).canSee) {
      activeWorkspaceMode = "admin";
      blockedWorkspaceMode = "";
    } else {
      activeWorkspaceMode = "workspace";
      blockedWorkspaceMode = "admin";
    }
  } else if (requestedMode === "workspace") {
    activeWorkspaceMode = "workspace";
    blockedWorkspaceMode = "";
  } else if (state.section) {
    const inferredMode = modeForAvailableSection(state.section);
    if (inferredMode) activeWorkspaceMode = inferredMode;
    blockedWorkspaceMode = "";
  } else {
    blockedWorkspaceMode = "";
  }
  if (state.section && availableSectionIds(activeWorkspaceMode).has(state.section)) {
    activeSection = state.section;
    workspaceModeLastSections[activeWorkspaceMode] = state.section;
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
  if (state.hasMentorDashboardState) {
    mentorDashboardFilter = state.mentorDashboardFilter;
    mentorDashboardSort = state.mentorDashboardSort;
    if (!state.section) activeSection = "mentorDashboard";
  }
  if (state.hasPresentationScheduleState) {
    presentationSlotFilter = state.presentationSlotFilter;
    if (!state.section) activeSection = "presentation";
  }
  if (state.hasAdminAuditState) {
    adminAuditFilters = state.adminAuditFilters;
    if (!state.section) activeSection = "audit";
  }
  if (state.hasAdminArchiveExportState) {
    adminArchiveExportFilter = state.adminArchiveExportFilter;
    if (!state.section) activeSection = "archiveExports";
  }
  if (state.hasAdminPeopleState) {
    adminPeopleView = state.adminPeopleView || "manage-students";
    if (!state.section) activeSection = adminSectionForPeopleView(adminPeopleView, "adminUsers");
  }
  if (state.hasSiteStudentDetailState) {
    siteStudentDetailState = {
      ...defaultSiteStudentDetailState(),
      ...state.siteStudentDetailState,
    };
    currentData.siteStudentDetail = null;
    currentData.siteStudentTimeline = null;
  } else {
    siteStudentDetailState = defaultSiteStudentDetailState();
    currentData.siteStudentDetail = null;
    currentData.siteStudentTimeline = null;
  }
}

function workspaceUrlStateFromLocation() {
  const url = currentWorkspaceUrl();
  if (!url) return null;
  const params = url.searchParams;
  const requestedMode = cleanWorkspaceMode(params.get("mode"));
  const requestedSection = cleanWorkspaceSection(params.get("section"));
  const requestedView = cleanDirectoryFilter(params.get("view"));
  const reviewQueueViewRequested = requestedSection === "teacher" || requestedView === "reviewQueue" || requestedView === "review-queue";
  const studentDirectoryViewRequested = requestedSection === "students" || requestedView === "students" || requestedView === "studentDirectory" || requestedView === "student-directory";
  const mentorAssignmentsViewRequested = requestedSection === "mentorAssignments" || requestedView === "mentorAssignments" || requestedView === "mentor-assignments";
  const operationsReadinessViewRequested = requestedSection === "operations" || requestedView === "operations" || requestedView === "operationsReadiness" || requestedView === "operations-readiness";
  const mentorDashboardViewRequested = requestedSection === "mentorDashboard" || requestedView === "mentorDashboard" || requestedView === "mentor-dashboard";
  const presentationViewRequested = requestedSection === "presentation" || requestedView === "presentation";
  const resolvedSection = reviewQueueViewRequested
    ? "teacher"
    : studentDirectoryViewRequested
      ? "students"
      : mentorAssignmentsViewRequested
        ? "mentorAssignments"
        : operationsReadinessViewRequested
          ? "operations"
          : mentorDashboardViewRequested
            ? "mentorDashboard"
            : presentationViewRequested
              ? "presentation"
            : requestedSection;
  const hasReviewQueueState = reviewQueueViewRequested || (!requestedSection && !requestedView && hasReviewQueueFilterParams(params));
  const hasSiteStudentState = studentDirectoryViewRequested;
  const hasMentorAssignmentState = mentorAssignmentsViewRequested;
  const hasOperationsReadinessState = operationsReadinessViewRequested;
  const hasMentorDashboardState = mentorDashboardViewRequested || (!requestedSection && !requestedView && hasMentorDashboardFilterParams(params));
  const hasPresentationScheduleState = presentationViewRequested || (!requestedSection && !requestedView && hasPresentationScheduleFilterParams(params));
  const hasAdminAuditState = requestedSection === "audit" || (!requestedSection && !requestedView && hasAdminAuditFilterParams(params));
  const hasAdminArchiveExportState = requestedSection === "archiveExports" || (!requestedSection && !requestedView && hasAdminArchiveExportFilterParams(params));
  const hasAdminPeopleState = ["adminUsers", "adminPeople", "adminStudents", "adminAssignments", "adminImports"].includes(requestedSection) || params.has("peopleView");
  const hasSiteStudentDetailState = hasSiteStudentDetailUrlState(params, resolvedSection);
  const hasViewAsStudentState = hasViewAsStudentUrlState(params);
  return {
    mode: requestedMode,
    adminRoleMode: cleanAdminRoleMode(params.get("adminRoleMode")),
    section: hasViewAsStudentState ? "student" : resolvedSection,
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
    hasMentorDashboardState,
    mentorDashboardFilter: hasMentorDashboardState ? mentorDashboardFilterFromSearchParams(params) : "all",
    mentorDashboardSort: hasMentorDashboardState ? mentorDashboardSortFromSearchParams(params) : "priority",
    hasPresentationScheduleState,
    presentationSlotFilter: hasPresentationScheduleState ? presentationSlotFilterFromSearchParams(params) : "all",
    hasAdminAuditState,
    adminAuditFilters: hasAdminAuditState ? adminAuditFiltersFromSearchParams(params) : defaultAdminAuditFilters(),
    hasAdminArchiveExportState,
    adminArchiveExportFilter: hasAdminArchiveExportState ? adminArchiveExportFilterFromSearchParams(params) : "all",
    hasAdminPeopleState,
    adminPeopleView: hasAdminPeopleState ? adminPeopleViewFromSearchParams(params) : "manage-students",
    hasSiteStudentDetailState,
    siteStudentDetailState: hasSiteStudentDetailState
      ? siteStudentDetailUrlStateFromSearchParams(params, resolvedSection)
      : defaultSiteStudentDetailState(),
    hasViewAsStudentState,
    viewAsStudentState: hasViewAsStudentState
      ? viewAsStudentUrlStateFromSearchParams(params)
      : defaultViewAsStudentState(),
  };
}

function currentWorkspaceUrl() {
  if (typeof window === "undefined" || !window.location?.href) return null;
  try {
    const url = new URL(window.location.href);
    const storedRoute = String(window.history?.state?.[WORKSPACE_HISTORY_ROUTE_KEY] || "");
    if (!url.search && storedRoute.startsWith("?")) {
      url.search = storedRoute;
    }
    return url;
  } catch {
    return null;
  }
}

function writeWorkspaceHistoryState(url, options = {}, state = {}) {
  if (!url || typeof window === "undefined" || !window.history) return;
  url.searchParams.delete("adminRoleMode");
  if (canSwitchAdminRoleMode(currentUser) && activeAdminRoleMode === "site_admin") {
    url.searchParams.set("adminRoleMode", "site_admin");
  }
  const routeSearch = String(url.search || "");
  const canonicalPath = String(window.location?.pathname || url.pathname || "/workspace");
  const visiblePath = `${window.location?.pathname || canonicalPath}${window.location?.search || ""}${window.location?.hash || ""}`;
  const currentState = window.history.state && typeof window.history.state === "object"
    ? window.history.state
    : {};
  const currentRouteSearch = String(currentState[WORKSPACE_HISTORY_ROUTE_KEY] || "");
  if (visiblePath === canonicalPath && currentRouteSearch === routeSearch) return;
  const method = options.replace ? "replaceState" : "pushState";
  const currentDepth = Math.max(0, safeNumber(currentState[WORKSPACE_HISTORY_DEPTH_KEY]));
  const sourceMode = cleanWorkspaceMode(currentState.mode || activeWorkspaceMode) || activeWorkspaceMode;
  const sourceSection = cleanWorkspaceSection(currentState.section || activeSection) || defaultSectionForMode(sourceMode);
  const nextDepth = method === "pushState" ? currentDepth + 1 : currentDepth;
  window.history[method]?.({
    ...currentState,
    ...state,
    [WORKSPACE_HISTORY_ROUTE_KEY]: routeSearch,
    [WORKSPACE_HISTORY_DEPTH_KEY]: nextDepth,
    [WORKSPACE_HISTORY_BACK_MODE_KEY]: method === "pushState" ? sourceMode : currentState[WORKSPACE_HISTORY_BACK_MODE_KEY],
    [WORKSPACE_HISTORY_BACK_SECTION_KEY]: method === "pushState" ? sourceSection : currentState[WORKSPACE_HISTORY_BACK_SECTION_KEY],
  }, "", canonicalPath);
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

function hasMentorDashboardFilterParams(params) {
  return MENTOR_DASHBOARD_URL_FILTER_PARAMS.some((param) => params.has(param));
}

function hasPresentationScheduleFilterParams(params) {
  return PRESENTATION_SCHEDULE_URL_FILTER_PARAMS.some((param) => params.has(param));
}

function hasAdminAuditFilterParams(params) {
  return ADMIN_AUDIT_URL_FILTER_PARAMS.some((param) => params.has(param));
}

function hasAdminArchiveExportFilterParams(params) {
  return ADMIN_ARCHIVE_EXPORT_URL_FILTER_PARAMS.some((param) => params.has(param));
}

function hasSiteStudentDetailUrlState(params, section) {
  const studentId = cleanDirectoryFilter(params.get("detailStudentId"));
  const sourceSection = cleanWorkspaceSection(section) || "students";
  return Boolean(studentId && SITE_STUDENT_DETAIL_URL_SECTIONS.has(sourceSection));
}

function hasViewAsStudentUrlState(params) {
  return Boolean(cleanDirectoryFilter(params.get("viewAsStudentId")));
}

function viewAsStudentUrlStateFromSearchParams(params) {
  return {
    ...defaultViewAsStudentState(),
    studentId: cleanDirectoryFilter(params.get("viewAsStudentId")),
    sourceSection: cleanWorkspaceSection(params.get("viewAsReturnSection")) || "students",
    sourceMode: cleanWorkspaceMode(params.get("viewAsReturnMode")) || "workspace",
  };
}

function siteStudentDetailUrlStateFromSearchParams(params, section) {
  const sourceSection = cleanWorkspaceSection(section) || "students";
  const activeTab = cleanStudentDetailTab(params.get("detailTab")) || "overview";
  return {
    ...defaultSiteStudentDetailState(),
    studentId: cleanDirectoryFilter(params.get("detailStudentId")),
    sourceSection,
    activeTab,
    timelineType: activeTab === "timeline"
      ? cleanStudentDetailTimelineType(params.get("detailTimelineType"))
      : "",
  };
}

function reviewQueueFiltersFromSearchParams(params) {
  const filters = defaultReviewQueueFilters();
  const rawStatus = params.get("status") || params.get("reviewStatus") || params.get("submissionStatus");
  filters.status = canonicalReviewQueueValue(rawStatus, REVIEW_QUEUE_STATUS_VALUES);
  if (!filters.status && booleanQueryValue(params.get("needsReview"))) filters.status = "submitted";
  filters.programId = cleanDirectoryFilter(params.get("programId"));
  filters.submissionId = cleanDirectoryFilter(params.get("submissionId"));
  filters.search = cleanSearchFilter(params.get("search"));
  filters.story = canonicalReviewQueueValue(params.get("story"), REVIEW_QUEUE_STORY_VALUES);
  filters.risk = canonicalReviewQueueValue(params.get("risk"), REVIEW_QUEUE_RISK_VALUES, "any");
  filters.evidenceStatus = canonicalReviewQueueValue(params.get("evidenceStatus"), REVIEW_QUEUE_EVIDENCE_STATUS_VALUES);
  if (booleanQueryValue(params.get("unassigned"))) filters.risk = "no_mentor";
  if (booleanQueryValue(params.get("overdue"))) filters.risk = "stale";
  filters.limit = clampDirectoryNumber(params.get("limit"), 10, 1, 50);
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
  filters.cohortId = cleanDirectoryFilter(params.get("cohortId"));
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

function mentorDashboardFilterFromSearchParams(params) {
  return cleanMentorDashboardFilter(params.get("mentorFocus"));
}

function mentorDashboardSortFromSearchParams(params) {
  return cleanMentorDashboardSort(params.get("mentorSort"));
}

function presentationSlotFilterFromSearchParams(params) {
  return cleanPresentationSlotFilter(params.get("presentationFocus"));
}

function adminAuditFiltersFromSearchParams(params) {
  return {
    ...defaultAdminAuditFilters(),
    action: cleanAdminAuditFilter(params.get("action")),
    entityType: cleanAdminAuditFilter(params.get("entityType")),
  };
}

function adminArchiveExportFilterFromSearchParams(params) {
  return cleanAdminArchiveExportFilter(params.get("adminExportFilter") || "all");
}

function adminPeopleViewFromSearchParams(params) {
  return cleanAdminPeopleView(params.get("peopleView")) || "manage-students";
}

function adminAuditQueryString() {
  const filters = adminAuditFilters || defaultAdminAuditFilters();
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (safeNumber(filters.limit) && safeNumber(filters.limit) !== 50) params.set("limit", String(filters.limit));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function cleanAdminAuditFilter(value) {
  return value && /^[a-zA-Z0-9_.:-]+$/.test(value) ? value : "";
}

function adminAuditFilterLabel(filters = {}) {
  const parts = [];
  if (filters.entityType) parts.push(statusText(filters.entityType));
  if (filters.action) parts.push(statusText(filters.action));
  return parts.length ? parts.join(" / ") : "recent activity";
}

function syncReviewQueueUrlState(options = {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  const filters = reviewQueueFilters || defaultReviewQueueFilters();
  for (const param of WORKSPACE_URL_FILTER_PARAMS) {
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
    if (safeNumber(filters.limit) !== 10) url.searchParams.set("limit", String(filters.limit));
    if (safeNumber(filters.offset) > 0) url.searchParams.set("offset", String(filters.offset));
    appendSiteStudentDetailUrlState(url, "teacher");
  }
  writeWorkspaceHistoryState(url, options, { section: "teacher" });
}

function syncCurrentWorkspaceUrlState(options = {}) {
  if (isViewAsStudentActive()) {
    syncViewAsStudentUrlState(options);
    return;
  }
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
  if (activeSection === "mentorDashboard") {
    syncMentorDashboardUrlState(options);
    return;
  }
  if (activeSection === "presentation") {
    syncPresentationScheduleUrlState(options);
    return;
  }
  if (activeSection === "audit") {
    syncAdminAuditUrlState(options);
    return;
  }
  if (activeSection === "archiveExports") {
    syncAdminArchiveExportUrlState(options);
    return;
  }
  if (["adminUsers", "adminPeople", "adminStudents", "adminAssignments", "adminImports"].includes(activeSection)) {
    syncAdminPeopleUrlState(options);
    return;
  }
  syncWorkspaceSectionOnlyUrlState(activeSection, options);
}

function syncViewAsStudentUrlState(options = {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  const studentId = cleanDirectoryFilter(viewAsStudentState.studentId || "");
  if (!studentId || !canUseViewAsStudent(roleIds(currentUser))) return;
  for (const param of WORKSPACE_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  url.searchParams.set("mode", "workspace");
  url.searchParams.set("section", "student");
  const siteId = selectedSiteQueryValue()
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || "";
  if (siteId) url.searchParams.set("siteId", siteId);
  url.searchParams.set("viewAsStudentId", studentId);
  const sourceSection = cleanWorkspaceSection(viewAsStudentState.sourceSection) || "students";
  const sourceMode = cleanWorkspaceMode(viewAsStudentState.sourceMode) || "workspace";
  url.searchParams.set("viewAsReturnSection", sourceSection);
  if (sourceMode !== "workspace") url.searchParams.set("viewAsReturnMode", sourceMode);
  writeWorkspaceHistoryState(url, options, { section: "student", viewAsStudentId: studentId });
}

function syncSiteStudentUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("students", siteStudentFilters || defaultSiteStudentFilters(), options, (url, filters) => {
    if (filters.search) url.searchParams.set("search", filters.search);
    if (filters.programId) url.searchParams.set("programId", filters.programId);
    if (filters.cohortId) url.searchParams.set("cohortId", filters.cohortId);
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

function syncMentorDashboardUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("mentorDashboard", {
    mentorFocus: cleanMentorDashboardFilter(mentorDashboardFilter),
    mentorSort: cleanMentorDashboardSort(mentorDashboardSort),
  }, options, (url, filters) => {
    if (filters.mentorFocus && filters.mentorFocus !== "all") {
      url.searchParams.set("mentorFocus", filters.mentorFocus);
    }
    if (filters.mentorSort && filters.mentorSort !== "priority") {
      url.searchParams.set("mentorSort", filters.mentorSort);
    }
  });
}

function syncPresentationScheduleUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("presentation", { presentationFocus: cleanPresentationSlotFilter(presentationSlotFilter) }, options, (url, filters) => {
    if (filters.presentationFocus && filters.presentationFocus !== "all") {
      url.searchParams.set("presentationFocus", filters.presentationFocus);
    }
  });
}

function syncAdminAuditUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("audit", adminAuditFilters || defaultAdminAuditFilters(), options, (url, filters) => {
    if (filters.action) url.searchParams.set("action", filters.action);
    if (filters.entityType) url.searchParams.set("entityType", filters.entityType);
  });
}

function syncAdminArchiveExportUrlState(options = {}) {
  syncFilteredWorkspaceUrlState("archiveExports", { adminExportFilter: cleanAdminArchiveExportFilter(adminArchiveExportFilter) }, options, (url, filters) => {
    if (filters.adminExportFilter && filters.adminExportFilter !== "all") {
      url.searchParams.set("adminExportFilter", filters.adminExportFilter);
    }
  });
}

function syncAdminPeopleUrlState(options = {}) {
  const view = cleanAdminPeopleView(adminPeopleView) || "manage-students";
  const visibleSection = adminSectionForPeopleView(view, activeSection);
  const section = cleanWorkspaceSection(activeSection) === "adminUsers" ? "adminUsers" : visibleSection;
  const defaultViewForSection = {
    adminPeople: "manage-staff",
    adminStudents: "manage-students",
    adminAssignments: "assignments",
    adminImports: "import-students",
    adminUsers: "manage-students",
  }[section] || "manage-students";
  syncFilteredWorkspaceUrlState(section, { peopleView: view }, options, (url, filters) => {
    if (filters.peopleView && filters.peopleView !== defaultViewForSection) {
      url.searchParams.set("peopleView", filters.peopleView);
    }
  });
}

function syncFilteredWorkspaceUrlState(section, filters, options = {}, writeFilters = () => {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  for (const param of WORKSPACE_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  url.searchParams.set("mode", cleanWorkspaceMode(activeWorkspaceMode) || "workspace");
  url.searchParams.set("section", section);
  const siteId = selectedSiteQueryValue()
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || "";
  if (siteId) url.searchParams.set("siteId", siteId);
  if (!options.clearFilters) {
    writeFilters(url, filters || {});
    appendSiteStudentDetailUrlState(url, section);
  }
  writeWorkspaceHistoryState(url, options, { section });
}

function syncWorkspaceSectionOnlyUrlState(section, options = {}) {
  const url = currentWorkspaceUrl();
  if (!url || typeof window === "undefined" || !window.history) return;
  for (const param of WORKSPACE_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  url.searchParams.set("mode", cleanWorkspaceMode(activeWorkspaceMode) || "workspace");
  const sectionId = cleanWorkspaceSection(section) || "overview";
  url.searchParams.set("section", sectionId);
  const siteId = selectedSiteQueryValue();
  if (siteId) url.searchParams.set("siteId", siteId);
  appendSiteStudentDetailUrlState(url, sectionId);
  writeWorkspaceHistoryState(url, options, { section: sectionId });
}

function cleanWorkspaceSection(value) {
  const section = cleanDirectoryFilter(value);
  return WORKSPACE_SECTION_IDS.has(section) ? section : "";
}

function canUseSiteStudentDetailUrlState(section, roles = roleIds(currentUser)) {
  const sourceSection = cleanWorkspaceSection(section);
  if (!SITE_STUDENT_DETAIL_URL_SECTIONS.has(sourceSection) || !roles?.size) return false;
  if (sourceSection === "overview") return hasStaffReportsSection(roles);
  if (sourceSection === "adminDashboard") return hasGlobalAdminRole(roles);
  if (sourceSection === "siteDashboard") return hasSiteDashboardRole(roles);
  if (sourceSection === "projects") return Boolean(unwrap(currentData.projects));
  if (sourceSection === "students") return hasSiteStudentDirectoryRole(roles);
  if (sourceSection === "teacher") return hasSiteReviewQueueRole(roles);
  if (sourceSection === "mentorAssignments") return hasSiteMentorAssignmentRole(roles);
  if (sourceSection === "mentorDashboard") return roles.has("mentor") || hasGlobalAdminRole(roles);
  if (sourceSection === "programDashboard") return roles.has("program_teacher");
  if (sourceSection === "operations") return hasSiteOperationsRole(roles);
  return false;
}

function shouldRestoreViewAsStudentFromUrlState(roles = roleIds(currentUser)) {
  return Boolean(cleanDirectoryFilter(viewAsStudentState.studentId || "") && canUseViewAsStudent(roles));
}

function shouldRestoreSiteStudentDetailFromUrlState(roles = roleIds(currentUser), section = activeSection) {
  const studentId = cleanDirectoryFilter(siteStudentDetailState.studentId);
  const sourceSection = cleanWorkspaceSection(siteStudentDetailState.sourceSection);
  const expectedSection = cleanWorkspaceSection(section) || sourceSection;
  return Boolean(studentId && sourceSection && sourceSection === expectedSection && canUseSiteStudentDetailUrlState(sourceSection, roles));
}

async function restoreSiteStudentDetailFromUrlState(options = {}) {
  if (!shouldRestoreSiteStudentDetailFromUrlState(roleIds(currentUser), options.section || activeSection)) return false;
  const accessContext = captureWorkspaceAccessContext();
  const sourceSection = cleanWorkspaceSection(siteStudentDetailState.sourceSection) || "students";
  const studentId = cleanDirectoryFilter(siteStudentDetailState.studentId);
  const requestedTab = cleanStudentDetailTab(siteStudentDetailState.activeTab) || "overview";
  const requestedTimelineType = requestedTab === "timeline"
    ? cleanStudentDetailTimelineType(siteStudentDetailState.timelineType || "")
    : "";
  const siteId = selectedSiteQueryValue()
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  siteStudentDetailState = {
    ...defaultSiteStudentDetailState(),
    studentId,
    sourceSection,
    activeTab: requestedTab,
    timelineType: requestedTimelineType,
    loading: true,
  };
  currentData.siteStudentDetail = null;
  currentData.siteStudentTimeline = null;
  activeSection = sourceSection;
  requestSiteStudentDetailFocus();
  if (options.renderLoading !== false) renderAppShell("Loading student detail...");
  const result = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(studentId)}${query}`));
  if (!workspaceAccessContextIsCurrent(accessContext)) return false;
  if (!result.ok) {
    siteStudentDetailState = defaultSiteStudentDetailState();
    currentData.siteStudentDetail = null;
    currentData.siteStudentTimeline = null;
    activeSection = sourceSection;
    if (options.syncUrl !== false) syncCurrentWorkspaceUrlState({ replace: true });
    renderAppShell(options.errorMessage || "Student detail unavailable.", "error");
    return false;
  }
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loading: false,
    result,
  };
  currentData.siteStudentDetail = result;
  requestSiteStudentDetailFocus();
  if (requestedTab === "timeline") {
    await loadSiteStudentTimeline({
      renderLoading: false,
      successMessage: options.message || "Student detail link restored.",
      errorMessage: options.errorMessage || "Student timeline unavailable.",
    });
    return true;
  }
  renderAppShell(options.message || "Student detail link restored.", "success");
  return true;
}

function appendSiteStudentDetailUrlState(url, section) {
  const sourceSection = cleanWorkspaceSection(section);
  if (!sourceSection || !canUseSiteStudentDetailUrlState(sourceSection)) return;
  const detailStudentId = cleanDirectoryFilter(siteStudentDetailState.studentId);
  const detailSourceSection = cleanWorkspaceSection(siteStudentDetailState.sourceSection) || sourceSection;
  if (!detailStudentId || detailSourceSection !== sourceSection) return;
  url.searchParams.set("detailStudentId", detailStudentId);
  const activeTab = cleanStudentDetailTab(siteStudentDetailState.activeTab) || "overview";
  if (activeTab !== "overview") url.searchParams.set("detailTab", activeTab);
  const timelineType = activeTab === "timeline"
    ? cleanStudentDetailTimelineType(siteStudentDetailState.timelineType || "")
    : "";
  if (timelineType) url.searchParams.set("detailTimelineType", timelineType);
}

function availableSectionIds(mode = activeWorkspaceMode) {
  return new Set(availableSections({ mode }).map((section) => section.id));
}

function firstVisibleSection(sections = []) {
  return sections.find((section) => !section.hidden) || sections[0] || null;
}

function availableSectionIdsForAnyMode() {
  return new Set([
    ...availableSectionIds("workspace"),
    ...availableSectionIds("admin"),
  ]);
}

function modeForAvailableSection(section) {
  const sectionId = cleanWorkspaceSection(section);
  if (!sectionId) return "";
  if (availableSectionIds(activeWorkspaceMode).has(sectionId)) return activeWorkspaceMode;
  if (availableSectionIds("admin").has(sectionId)) return "admin";
  if (availableSectionIds("workspace").has(sectionId)) return "workspace";
  return "";
}

function defaultSectionForMode(mode = activeWorkspaceMode) {
  const sectionIds = availableSectionIds(mode);
  if (sectionIds.has(workspaceModeLastSections[mode])) {
    const remembered = availableSections({ mode }).find((section) => section.id === workspaceModeLastSections[mode]);
    if (remembered && !remembered.hidden) return remembered.id;
  }
  const sections = availableSections({ mode });
  return firstVisibleSection(sections)?.id || "overview";
}

function rememberCurrentModeSection() {
  const mode = cleanWorkspaceMode(activeWorkspaceMode) || "workspace";
  if (availableSectionIds(mode).has(activeSection)) {
    workspaceModeLastSections[mode] = activeSection;
  }
}

function ensureActiveWorkspaceModeAndSection() {
  blockedWorkspaceSection = "";
  const requestedMode = cleanWorkspaceMode(activeWorkspaceMode) || "workspace";
  const capabilities = adminConsoleCapabilitiesFor(currentUser);
  if (requestedMode === "admin" && !capabilities.canSee) {
    activeWorkspaceMode = "workspace";
  } else {
    activeWorkspaceMode = requestedMode;
  }
  let allowedIds = availableSectionIds(activeWorkspaceMode);
  if (allowedIds.has(activeSection)) {
    rememberCurrentModeSection();
    return;
  }
  const sectionMode = modeForAvailableSection(activeSection);
  if (sectionMode && sectionMode !== activeWorkspaceMode) {
    activeWorkspaceMode = sectionMode;
    allowedIds = availableSectionIds(activeWorkspaceMode);
  }
  if (!allowedIds.has(activeSection)) {
    const attemptedSection = cleanWorkspaceSection(activeSection);
    if (attemptedSection) blockedWorkspaceSection = attemptedSection;
    activeSection = defaultSectionForMode(activeWorkspaceMode);
  }
  rememberCurrentModeSection();
}

function cleanWorkspaceMode(value) {
  const mode = cleanDirectoryFilter(value);
  return WORKSPACE_MODES.has(mode) ? mode : "";
}

function cleanAdminRoleMode(value) {
  const mode = cleanDirectoryFilter(value);
  return ADMIN_ROLE_MODES.has(mode) ? mode : "";
}

function cleanAdminPeopleView(value) {
  const view = cleanDirectoryFilter(value);
  return ADMIN_PEOPLE_VIEW_VALUES.has(view) ? view : "";
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
  if (filters.cohortId) params.set("cohortId", filters.cohortId);
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
  if (filters.submissionId) params.set("submissionId", filters.submissionId);
  if (filters.search) params.set("search", filters.search);
  if (filters.story) params.set("story", filters.story);
  if (filters.risk && filters.risk !== "any") params.set("risk", filters.risk);
  if (filters.evidenceStatus) params.set("evidenceStatus", filters.evidenceStatus);
  if (safeNumber(filters.limit) !== 10) params.set("limit", String(filters.limit));
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
  if (primary === "site_admin" && canSwitchAdminRoleMode(user) && activeAdminRoleMode === "site_admin") {
    const selectedSite = accessibleSitesForWorkspace().find((site) => site.siteId === selectedSiteQueryValue());
    return selectedSite?.siteName || "Selected school";
  }
  const role = (user?.roles || []).find((assignment) => assignment.role_id === primary);
  if (!role) return "Assigned workspace";
  return assignmentScopeLabel(role);
}

function projectDirectoryQueryString() {
  const params = new URLSearchParams();
  const filters = projectDirectoryFilters || defaultProjectDirectoryFilters();
  const siteId = selectedSiteQueryValue();
  if (siteId) params.set("siteId", siteId);
  if (filters.search) params.set("search", cleanSearchFilter(filters.search));
  if (["review", "changes", "working", "team", "individual"].includes(filters.filter)) {
    params.set("filter", filters.filter);
  }
  if (["updated", "name", "phase", "team"].includes(filters.sort)) {
    params.set("sort", filters.sort);
  }
  if (safeNumber(filters.page) > 1) params.set("page", String(filters.page));
  if (safeNumber(filters.pageSize) !== 25) params.set("limit", String(filters.pageSize));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function assignmentScopeLabel(role) {
  const roleId = String(role?.role_id || "");
  const scopeType = normalizeStatus(role?.scope_type || "global");
  const scopeId = String(role?.scope_id || "").trim();
  const siteName = siteNameForAssignment(role);
  const tenantName = tenantNameForWorkspace();

  if (roleId === "student") return "Your project";
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

function updateAdminImportScopeFields(targetForm = null) {
  const form = targetForm?.querySelector ? targetForm : document.querySelector("#workspaceAdminImportForm");
  const roleSelect = form?.querySelector?.('[name="roleId"]');
  const identitySelect = form?.querySelector?.('[name="identityType"]');
  if (!roleSelect || !identitySelect) return;

  const roleId = roleSelect.value;
  syncAdminRoleQuickPicks(form, roleId);
  const showSite = roleId === "student" || roleId === "mentor" || roleId === "viewer" || roleId === "administration" || roleId === "site_admin";
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

function handleAdminRolePick(event) {
  const roleId = event?.currentTarget?.dataset?.adminRolePick || "";
  const form = event?.currentTarget?.closest?.("form") || document.querySelector("#workspaceAdminImportForm");
  const roleSelect = form?.querySelector?.('[name="roleId"]');
  if (!roleId || !roleSelect) return;
  roleSelect.value = roleId;
  updateAdminImportScopeFields(form);
}

function syncAdminRoleQuickPicks(form, roleId) {
  form?.querySelectorAll?.("[data-admin-role-pick]")?.forEach((button) => {
    const selected = button?.dataset?.adminRolePick === roleId;
    button.classList?.toggle?.("is-active", selected);
    button.setAttribute?.("aria-pressed", selected ? "true" : "false");
  });
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
  const deliveryConfirmation = Boolean(values.deliveryConfirmation);

  if (!adminNote) return { ok: false, message: "Add the admin note for this account." };
  if (!deliveryConfirmation) return { ok: false, message: "Confirm the account access and setup-password delivery process before creating this account." };
  if (!email || !fullName || !roleId) return { ok: false, message: "Add the person's email, name, and role." };
  if (!["student", "mentor", "viewer", "program_teacher", "administration", "site_admin", "global_admin"].includes(roleId)) {
    return { ok: false, message: "Choose a supported workspace role." };
  }
  if (roleId === "global_admin" && identityType !== "local") {
    return { ok: false, message: "Global Admin accounts use email and password so an administrator can still sign in during a school sign-in outage." };
  }
  if ((roleId === "administration" || roleId === "site_admin") && siteIds.length === 0) {
    return { ok: false, message: "Choose at least one site for this role." };
  }
  if (roleId === "student" && siteIds.length === 0) {
    return { ok: false, message: "Choose at least one site for this student." };
  }
  if ((roleId === "mentor" || roleId === "viewer") && siteIds.length === 0 && studentIds.length === 0) {
    return { ok: false, message: `Choose at least one site or student for this ${roleLabel(roleId)}.` };
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
    student: "Assigned school. Can view their own dashboard, work, evidence, feedback, and readiness.",
    mentor: "Assigned students only. Can view assigned student progress and feedback workflows.",
    viewer: "Assigned students only. Read-only.",
    program_teacher: "Assigned program. Can review assigned program records and manage student and mentor accounts.",
    administration: "Assigned school. Can manage students, mentors, viewers, and Program Teachers for that school.",
    site_admin: "Assigned site. Can manage users and assignments inside the current school.",
    global_admin: "Entire platform. Can manage every school and program.",
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
    <p>Sign-in: ${escapeHtml(identityType === "sso" ? "School sign-in" : "Email and password")}</p>
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

function copyReviewQueueLink(event) {
  const relativeHref = String(event.currentTarget?.dataset?.reviewQueueShareHref || "");
  if (!relativeHref || !navigator?.clipboard || typeof window === "undefined") {
    renderAppShell("This browser could not copy the link. Try again.", "error");
    return;
  }
  let value = relativeHref;
  try {
    value = new URL(relativeHref, window.location?.origin || window.location?.href || "https://workspace.invalid").href;
  } catch {
    renderAppShell("This browser could not copy the link. Try again.", "error");
    return;
  }
  navigator.clipboard.writeText(value).then(() => {
    renderAppShell("Queue link copied. The browser address stayed the same.", "success");
  }).catch(() => {
    renderAppShell("The link did not copy. Try again.", "error");
  });
}

async function submitAdminPersonForm(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const returnSection = cleanDirectoryFilter(form?.dataset?.personKind || "") === "student"
    ? "adminStudents"
    : "adminPeople";
  const importBody = buildAdminPersonImportBody(form);

  if (!importBody.ok) {
    lastAdminImportResult = null;
    activeSection = returnSection;
    renderAppShell(importBody.message, "error");
    return;
  }

  busy = true;
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
      activeSection = returnSection;
      renderAppShell(messageForAdminImportError(body?.error, response.status), "error");
      return;
    }
    lastAdminImportResult = body;
    activeSection = returnSection;
    await loadWorkspaceData(importBody.successMessage || "Account created.");
  } catch (error) {
    lastAdminImportResult = null;
    activeSection = returnSection;
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

function buildAdminPersonImportBody(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const kind = cleanDirectoryFilter(form?.dataset?.personKind || "");
  const firstName = String(values.firstName || "").trim();
  const lastName = String(values.lastName || "").trim();
  const email = String(values.email || "").trim();
  const roleId = kind === "student" ? "student" : String(values.roleId || "").trim();
  const status = cleanAdminImportStatus(values.status || "active");
  const adminNote = String(values.adminNote || "").trim();
  const deliveryConfirmation = Boolean(values.deliveryConfirmation);
  const siteIds = formValues(form, "siteIds");
  const programIds = formValues(form, "programIds");
  const studentIds = formValues(form, "studentIds");
  const cohort = String(values.cohort || "").trim();
  const graduationYear = String(values.graduationYear || values.graduation_year || "").trim();
  const mentorUserId = cleanDirectoryFilter(values.mentorUserId || values.mentor_user_id || "");
  const viewerUserId = cleanDirectoryFilter(values.viewerUserId || values.viewer_user_id || "");
  const globalAdminConfirmation = Boolean(values.globalAdminConfirmation);
  const allowedRoleIds = new Set(adminRoleChoicesForRoles(roleIds(currentUser)).map((role) => role.value));

  if (!firstName || !lastName) return { ok: false, message: "Add first and last name." };
  if (!isUsableEmail(email)) return { ok: false, message: "Add a usable email or login identifier." };
  if (!adminNote) return { ok: false, message: "Add the admin note for this account." };
  if (!deliveryConfirmation) return { ok: false, message: "Confirm the account access and setup-password delivery process before creating this account." };
  if (!status) return { ok: false, message: "Choose active or inactive status." };
  if (!allowedRoleIds.has(roleId)) return { ok: false, message: "This role cannot create that account type." };
  if (kind === "student" && !siteIds.length) return { ok: false, message: "Choose the student's site or school." };
  if (kind === "student" && !programIds.length) return { ok: false, message: "Choose the student's program." };
  if (kind === "student" && graduationYear && !/^\d{4}$/.test(graduationYear)) return { ok: false, message: "Use a four-digit graduation year." };
  if ((roleId === "administration" || roleId === "site_admin") && !siteIds.length) return { ok: false, message: "Choose at least one site for this role." };
  if (roleId === "program_teacher" && !programIds.length) return { ok: false, message: "Choose at least one program for this Program Teacher." };
  if ((roleId === "mentor" || roleId === "viewer") && !siteIds.length && !studentIds.length) {
    return { ok: false, message: `Choose at least one site or assigned student for this ${roleLabel(roleId)}.` };
  }
  if (roleId === "global_admin" && !globalAdminConfirmation) {
    return { ok: false, message: "Confirm that this Global Admin can manage every site." };
  }

  const user = {
    email,
    fullName: `${firstName} ${lastName}`.trim(),
    roleId,
    status,
    identityType: "local",
    siteIds,
    programIds,
    studentIds,
    globalAdminConfirmation,
  };
  if (kind === "student") {
    user.cohort = cohort;
    user.graduationYear = graduationYear;
    user.mentorUserId = mentorUserId;
    user.viewerUserId = viewerUserId;
  }

  return {
    ok: true,
    successMessage: kind === "student"
      ? (mentorUserId || viewerUserId ? "Student account and assignments saved." : "Student account created.")
      : "Staff account created.",
    body: {
      adminNote,
      users: [user],
    },
  };
}

function cleanAdminImportStatus(value) {
  const status = String(value || "active").trim().toLowerCase();
  if (["active", "inactive"].includes(status)) return status;
  if (status === "disabled") return "inactive";
  return "";
}

function isUsableEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function submitAdminCsvPreview(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const kind = cleanDirectoryFilter(form?.dataset?.csvImportKind || "") === "staff" ? "staff" : "students";
  const text = String(new FormData(form).get("csvText") || adminCsvImportState[kind]?.csvText || "").trim();
  if (!text) {
    adminCsvImportState[kind] = {
      ...defaultAdminCsvImportKindState(kind),
      previewed: true,
      errors: [{ rowNumber: 1, message: "Choose a CSV file or paste CSV text before preview." }],
      summary: { ...defaultAdminCsvSummary(), rowsWithErrors: 1 },
    };
    activeSection = adminCsvPreviewReturnSection();
    renderAppShell("CSV preview needs a file or pasted CSV text.", "error");
    return;
  }
  adminCsvImportState[kind] = validateAdminCsvImport(kind, text, { fileName: adminCsvImportState[kind]?.fileName || "" });
  activeSection = adminCsvPreviewReturnSection();
  renderAppShell(adminCsvImportState[kind].errors.length ? "CSV preview found rows to fix." : "CSV preview is ready for confirmation.", adminCsvImportState[kind].errors.length ? "error" : "success");
}

function adminCsvPreviewReturnSection() {
  if (activeWorkspaceMode === "admin" && availableSectionIdsForAnyMode().has("adminImports")) return "adminImports";
  return "adminUsers";
}

function handleAdminCsvFileSelected(event) {
  const input = event.currentTarget;
  const kind = cleanDirectoryFilter(input?.dataset?.csvFileInput || "") === "staff" ? "staff" : "students";
  const file = input?.files?.[0];
  if (!file) return;
  if (!String(file.name || "").toLowerCase().endsWith(".csv")) {
    adminCsvImportState[kind] = {
      ...defaultAdminCsvImportKindState(kind),
      previewed: true,
      fileName: file.name || "",
      errors: [{ rowNumber: 1, message: "Upload a .csv file." }],
      summary: { ...defaultAdminCsvSummary(), rowsWithErrors: 1 },
    };
    activeSection = adminCsvPreviewReturnSection();
    renderAppShell("Upload a .csv file.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    adminCsvImportState[kind] = {
      ...defaultAdminCsvImportKindState(kind),
      fileName: file.name || "",
      csvText: String(reader.result || ""),
    };
    activeSection = adminCsvPreviewReturnSection();
    renderAppShell("CSV loaded. Preview before importing.", "success");
  };
  reader.onerror = () => {
    renderAppShell("Could not read that CSV file.", "error");
  };
  reader.readAsText(file);
}

async function confirmAdminCsvImport(button) {
  if (busy) return;
  const kind = cleanDirectoryFilter(button?.dataset?.adminCsvConfirm || "") === "staff" ? "staff" : "students";
  const state = adminCsvImportState[kind] || defaultAdminCsvImportKindState(kind);
  const form = document.querySelector(`[data-csv-import-form][data-csv-import-kind="${kind}"]`);
  const adminNote = form ? String(new FormData(form).get("adminNote") || "").trim() : "";
  if (!state.previewed || !state.validRows.length) {
    renderAppShell("Preview a CSV with valid rows before importing.", "error");
    return;
  }
  if (state.errors.length) {
    renderAppShell("Fix row errors before final import.", "error");
    return;
  }
  if (!adminNote) {
    renderAppShell("Add the admin note before final import.", "error");
    return;
  }

  busy = true;
  setFormBusy(form, true);
  try {
    const response = await fetch("/api/admin/users/import", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ adminNote, users: state.validRows.map((row) => row.user) }),
    });
    const body = await safeJson(response);
    if (!response.ok) {
      lastAdminImportResult = null;
      renderAppShell(messageForAdminImportError(body?.error, response.status), "error");
      return;
    }
    const previewSummary = state.summary || defaultAdminCsvSummary();
    lastAdminImportResult = {
      ...body,
      summary: {
        ...defaultAdminCsvSummary(),
        ...(body?.summary || {}),
        studentsCreated: body?.summary?.studentsCreated ?? (kind === "students" ? body?.importedCount || 0 : 0),
        studentsSkipped: previewSummary.existingRecords,
        invalidRowsBlocked: previewSummary.rowsWithErrors,
      },
    };
    adminCsvImportState[kind] = defaultAdminCsvImportKindState(kind);
    activeSection = "adminImports";
    adminPeopleView = kind === "staff" ? "manage-staff" : "manage-students";
    await loadWorkspaceData(`${kind === "staff" ? "Staff" : "Student"} CSV imported.`);
  } catch (error) {
    lastAdminImportResult = null;
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

function validateAdminCsvImport(kind = "students", text = "", options = {}) {
  const rows = parseCsv(text);
  const state = {
    ...defaultAdminCsvImportKindState(kind),
    csvText: text,
    fileName: options.fileName || "",
    previewed: true,
  };
  if (!rows.length) {
    state.errors.push({ rowNumber: 1, message: "CSV needs a header row and at least one data row." });
    state.summary = { ...defaultAdminCsvSummary(), rowsWithErrors: 1 };
    return state;
  }
  const [headers, ...dataRows] = rows;
  const normalizedHeaders = headers.map(normalizeCsvColumn);
  const rowObjects = dataRows
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row, index) => ({
      rowNumber: index + 2,
      values: Object.fromEntries(normalizedHeaders.map((header, cellIndex) => [header, String(row[cellIndex] || "").trim()])),
    }));
  const headerErrors = validateCsvImportHeaders(kind, normalizedHeaders);
  if (headerErrors.length) {
    state.errors.push(...headerErrors.map((message) => ({ rowNumber: 1, message })));
    state.summary.rowsDetected = rowObjects.length;
    state.summary.rowsWithErrors = headerErrors.length;
    return state;
  }
  const context = adminCsvValidationContext();
  const seenEmails = new Set();
  const existingEmails = context.existingEmails;
  for (const row of rowObjects) {
    const validation = kind === "staff"
      ? validateStaffCsvRow(row, context, seenEmails, existingEmails)
      : validateStudentCsvRow(row, context, seenEmails, existingEmails);
    state.rows.push(validation);
    if (validation.ok && validation.user) {
      if (validation.existing) {
        state.summary.existingRecords += 1;
      } else {
        state.validRows.push(validation);
        state.summary.newRecords += 1;
        state.summary.mentorAssignmentsCreated += Number(validation.assignmentPreview?.mentorAssignmentsCreated || 0);
        state.summary.projectMentorsCreated += Number(validation.assignmentPreview?.projectMentorsCreated || 0);
        state.summary.projectProgramTeachersCreated += Number(validation.assignmentPreview?.projectProgramTeachersCreated || 0);
        state.summary.viewerAssignmentsCreated += Number(validation.assignmentPreview?.viewerAssignmentsCreated || 0);
      }
    } else {
      state.errors.push({ rowNumber: row.rowNumber, message: validation.message });
    }
  }
  state.summary.rowsDetected = rowObjects.length;
  state.summary.validRows = state.rows.filter((validatedRow) => validatedRow.ok).length;
  state.summary.rowsWithErrors = state.errors.length;
  return state;
}

function parseCsv(text = "") {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeCsvColumn(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function validateCsvImportHeaders(kind = "students", normalizedHeaders = []) {
  const contract = csvTemplateContractForKind(kind);
  const required = new Set(contract.required);
  const supported = new Set(csvTemplateColumnsForKind(kind));
  const present = new Set(normalizedHeaders.filter(Boolean));
  const missing = [...required].filter((column) => !present.has(column));
  const unsupported = [...present].filter((column) => !supported.has(column));
  const duplicates = [...present].filter((column) => normalizedHeaders.filter((header) => header === column).length > 1);
  const errors = [];
  if (missing.length) errors.push(`Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
  if (unsupported.length) errors.push(`Unsupported column${unsupported.length === 1 ? "" : "s"}: ${unsupported.join(", ")}. Use only the supported ${contract.kind} CSV template columns.`);
  if (duplicates.length) errors.push(`Duplicate column${duplicates.length === 1 ? "" : "s"}: ${Array.from(new Set(duplicates)).join(", ")}.`);
  return errors;
}

function adminCsvValidationContext() {
  const access = unwrap(currentData.accessAssignments) || {};
  const users = access.users || {};
  const sites = accessibleSitesForWorkspace();
  const programs = Array.isArray(access.programs) ? access.programs : [];
  const students = Array.isArray(users.students) ? users.students : [];
  const allAccounts = siteAccountRows(users);
  const roleChoices = adminRoleChoicesForRoles(roleIds(currentUser));
  return {
    roleIds: new Set(roleChoices.map((role) => role.value)),
    sitesByKey: lookupMap(sites, (site) => [site.siteId, site.siteName]),
    programsByKey: lookupMap(programs, (program) => [program.programId, program.programName]),
    studentsByEmail: lookupMap(students, (student) => [student.email, student.displayName, student.studentName, student.userId, student.studentId]),
    mentorsByEmail: lookupMap(users.mentors || [], (mentor) => [mentor.email, mentor.displayName, mentor.userId, mentor.id]),
    programTeachersByEmail: lookupMap(users.programTeachers || [], (teacher) => [teacher.email, teacher.displayName, teacher.userId, teacher.id]),
    viewersByEmail: lookupMap(users.viewers || [], (viewer) => [viewer.email, viewer.displayName, viewer.userId, viewer.id]),
    existingEmails: new Set(allAccounts.map((account) => String(account.email || "").trim().toLowerCase()).filter(Boolean)),
  };
}

function lookupMap(rows = [], keysForRow = () => []) {
  const map = new Map();
  for (const row of rows) {
    for (const key of keysForRow(row)) {
      const normalized = normalizeLookupKey(key);
      if (normalized && !map.has(normalized)) map.set(normalized, row);
    }
  }
  return map;
}

function normalizeLookupKey(value) {
  return String(value || "").trim().toLowerCase();
}

function validateStudentCsvRow(row, context, seenEmails, existingEmails) {
  const values = row.values || {};
  const firstName = values.first_name || "";
  const lastName = values.last_name || "";
  const email = values.email || "";
  const site = context.sitesByKey.get(normalizeLookupKey(values.site));
  const program = context.programsByKey.get(normalizeLookupKey(values.program));
  const status = cleanAdminImportStatus(values.status || "active");
  const graduationYear = String(values.graduation_year || values.graduationYear || "").trim();
  const mentorKey = normalizeLookupKey(values.mentor_email);
  const programTeacherKey = normalizeLookupKey(values.program_teacher_email);
  const viewerKey = normalizeLookupKey(values.viewer_email);
  const mentor = mentorKey ? context.mentorsByEmail.get(mentorKey) : null;
  const programTeacher = programTeacherKey ? context.programTeachersByEmail.get(programTeacherKey) : null;
  const viewer = viewerKey ? context.viewersByEmail.get(viewerKey) : null;
  const emailKey = normalizeLookupKey(email);
  if (!firstName || !lastName || !email || !values.site || !values.program) return csvInvalid(row, "Missing required first_name, last_name, email, site, or program.");
  if (!isUsableEmail(email)) return csvInvalid(row, "Email/login identifier is not usable.");
  if (seenEmails.has(emailKey)) return csvInvalid(row, "Duplicate email appears more than once in this CSV.");
  seenEmails.add(emailKey);
  if (existingEmails.has(emailKey)) return csvValid(row, null, true);
  if (!site) return csvInvalid(row, "School is not available to this account.");
  if (!program) return csvInvalid(row, "Program is not available to this account.");
  if (!status) return csvInvalid(row, "Status must be active or inactive.");
  if (graduationYear && !/^\d{4}$/.test(graduationYear)) return csvInvalid(row, "graduation_year must be a four-digit year.");
  if (mentorKey && context.studentsByEmail.has(mentorKey)) return csvInvalid(row, "Student users cannot be assigned as mentors.");
  if (viewerKey && context.studentsByEmail.has(viewerKey)) return csvInvalid(row, "Student users cannot be assigned as viewers.");
  if (values.mentor_email && !mentor) {
    return csvInvalid(row, "Mentor email must already exist in the current roster before automatic assignment.");
  }
  if (values.program_teacher_email && !programTeacher) {
    return csvInvalid(row, "Program Teacher email must already exist in the current roster before automatic assignment.");
  }
  if (programTeacher && Array.isArray(programTeacher.programIds) && programTeacher.programIds.length && !programTeacher.programIds.includes(program.programId)) {
    return csvInvalid(row, "Program Teacher must be assigned to the student's program.");
  }
  if (values.viewer_email && !viewer) {
    return csvInvalid(row, "Viewer email must already exist in the current roster before automatic assignment.");
  }
  return csvValid(row, {
    email,
    fullName: `${firstName} ${lastName}`.trim(),
    roleId: "student",
    identityType: "local",
    status,
    siteIds: [site.siteId],
    programIds: [program.programId],
    studentIds: [],
    cohort: String(values.cohort || "").trim(),
    graduationYear,
    mentorUserId: mentor?.userId || mentor?.id || "",
    programTeacherUserId: programTeacher?.userId || programTeacher?.id || "",
    viewerUserId: viewer?.userId || viewer?.id || "",
    globalAdminConfirmation: false,
  }, false, {
    mentorAssignmentsCreated: mentor ? 1 : 0,
    projectMentorsCreated: mentor ? 1 : 0,
    projectProgramTeachersCreated: programTeacher ? 1 : 0,
    viewerAssignmentsCreated: viewer ? 1 : 0,
  });
}

function validateStaffCsvRow(row, context, seenEmails, existingEmails) {
  const values = row.values || {};
  const firstName = values.first_name || "";
  const lastName = values.last_name || "";
  const email = values.email || "";
  const roleId = normalizeStaffCsvRole(values.role);
  const site = values.site ? context.sitesByKey.get(normalizeLookupKey(values.site)) : null;
  const program = values.program ? context.programsByKey.get(normalizeLookupKey(values.program)) : null;
  const status = cleanAdminImportStatus(values.status || "active");
  const emailKey = normalizeLookupKey(email);
  if (!firstName || !lastName || !email || !values.role) return csvInvalid(row, "Missing required first_name, last_name, email, or role.");
  if (!isUsableEmail(email)) return csvInvalid(row, "Email/login identifier is not usable.");
  if (seenEmails.has(emailKey)) return csvInvalid(row, "Duplicate email appears more than once in this CSV.");
  seenEmails.add(emailKey);
  if (existingEmails.has(emailKey)) return csvValid(row, null, true);
  if (!roleId || roleId === "global_admin") return csvInvalid(row, "CSV import cannot create Global Admin accounts.");
  if (roleId === "student") return csvInvalid(row, "Use Import Students for student rows.");
  if (!context.roleIds.has(roleId)) return csvInvalid(row, "This role is not allowed for your current account.");
  if (!status) return csvInvalid(row, "Status must be active or inactive.");
  if (values.site && !site) return csvInvalid(row, "School is not available to this account.");
  if (values.program && !program) return csvInvalid(row, "Program is not available to this account.");
  const siteIds = site ? [site.siteId] : [];
  const programIds = program ? [program.programId] : [];
  const assignedStudentEmails = splitCsvList(values.assigned_student_emails);
  const studentIds = [];
  for (const studentEmail of assignedStudentEmails) {
    const student = context.studentsByEmail.get(normalizeLookupKey(studentEmail));
    if (!student) return csvInvalid(row, `Assigned student ${studentEmail} is not available to this account.`);
    studentIds.push(student.userId || student.studentId || student.id);
  }
  if ((roleId === "administration" || roleId === "site_admin") && !siteIds.length) return csvInvalid(row, "Site Admin and Administration rows need a site.");
  if (roleId === "program_teacher" && !programIds.length) return csvInvalid(row, "Program Teacher rows need a program.");
  if ((roleId === "mentor" || roleId === "viewer") && !siteIds.length && !studentIds.length) return csvInvalid(row, "Mentor and Viewer rows need a site or assigned students.");
  return csvValid(row, {
    email,
    fullName: `${firstName} ${lastName}`.trim(),
    roleId,
    identityType: "local",
    status,
    siteIds,
    programIds,
    studentIds: Array.from(new Set(studentIds.filter(Boolean))),
    globalAdminConfirmation: false,
  });
}

function normalizeStaffCsvRole(value) {
  const role = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    school_admin: "administration",
    admin: "global_admin",
    global_admin: "global_admin",
    site_admin: "site_admin",
    administration: "administration",
    program_teacher: "program_teacher",
    mentor: "mentor",
    viewer: "viewer",
    student: "student",
  };
  return aliases[role] || "";
}

function splitCsvList(value) {
  return String(value || "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvInvalid(row, message) {
  return { ok: false, rowNumber: row.rowNumber, message };
}

function csvValid(row, user, existing = false, assignmentPreview = {}) {
  return { ok: true, rowNumber: row.rowNumber, user, existing, assignmentPreview };
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
    activeSection = "adminAssignments";
    await loadWorkspaceData("Access assignment saved.");
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

async function submitAdminAccountRemoval(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const userId = cleanDirectoryFilter(form?.dataset?.adminAccountId || "");
  const body = Object.fromEntries(new FormData(form).entries());
  if (!userId || !String(body.adminNote || "").trim()) {
    renderAppShell("Add the admin note before removing this account.", "error");
    return;
  }
  if (body.confirmImpact !== "true") {
    renderAppShell("Confirm that you reviewed what account removal does before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForAccountRemovalError(data?.error, response.status), "error");
      return;
    }
    if (!["adminPeople", "adminStudents", "adminAssignments"].includes(activeSection)) activeSection = "adminPeople";
    await loadWorkspaceData(data?.disabled ? "Account removed and sign-in disabled." : "Account removed from this school.");
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

async function submitAdminPasswordReset(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const userId = cleanDirectoryFilter(form?.dataset?.adminAccountId || "");
  const body = Object.fromEntries(new FormData(form).entries());
  if (!userId || !String(body.reason || "").trim()) {
    renderAppShell("Write why this person needs a new password.", "error");
    return;
  }
  if (body.confirmImpact !== "true") {
    renderAppShell("Check the box to confirm this person will be signed out.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/require-password-reset`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForAdminPasswordResetError(data?.error, response.status), "error");
      return;
    }
    lastAdminPasswordResetResult = data?.setupCode ? {
      userId,
      displayName: data?.user?.displayName || "This person",
      setupCode: data.setupCode,
      expiresInMinutes: safeNumber(data.setupCodeExpiresInMinutes) || 30,
    } : null;
    if (!["adminPeople", "adminStudents", "adminAssignments"].includes(activeSection)) activeSection = "adminPeople";
    await loadWorkspaceData(data?.setupCode
      ? "One-time setup code created. Copy it now and share it privately."
      : data?.alreadyRequired
        ? "This person already needs to make a new password."
        : "Password reset required. The person was signed out.");
    const setupCode = document.querySelector?.("[data-admin-password-setup-code]");
    setupCode?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    setupCode?.querySelector?.("[data-copy-secret]")?.focus?.();
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

async function submitSiteStudentRemoval(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const studentId = cleanDirectoryFilter(form?.dataset?.siteStudentId || "");
  const body = Object.fromEntries(new FormData(form).entries());
  if (!studentId || !String(body.adminNote || "").trim()) {
    renderAppShell("Add the admin note before removing this student.", "error");
    return;
  }
  if (body.confirmImpact !== "true") {
    renderAppShell("Confirm that you reviewed what student removal does before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const response = await fetch(`/api/site/students/${encodeURIComponent(studentId)}`, {
      method: "DELETE",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForStudentRemovalError(data?.error, response.status), "error");
      return;
    }
    activeSection = "students";
    siteStudentDetailState = defaultSiteStudentDetailState();
    await loadWorkspaceData(data?.disabled ? "Student removed and sign-in disabled." : "Student removed from this school.");
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

async function submitSiteProgramChange(event) {
  event.preventDefault();
  if (busy) return;
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());
  busy = true;
  setFormBusy(form, true);
  try {
    const response = await fetch("/api/site/programs", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForSiteProgramError(data?.error, response.status), "error");
      return;
    }
    activeSection = "programs";
    await loadWorkspaceData(body.action === "remove"
      ? "Site program removed."
      : body.action === "update_branding"
        ? "School look saved."
        : "Site program added.");
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
  if (error === "invalid_credentials") return "That email or password did not work. If you have a setup code, open that step below.";
  if (error === "password_reset_required") return "This account needs a new password before the workspace can open.";
  if (error === "rate_limited" || status === 429) return "Too many sign-in attempts. Wait a few minutes and try again.";
  return "Sign-in is unavailable right now. Try again or contact your instructor.";
}

function messageForSsoError(error) {
  if (error === "sso_not_configured") return "That sign-in option is not available right now. Ask your project coordinator for help.";
  if (error === "sso_invalid_state") return "Your sign-in link expired. Start again.";
  if (error === "sso_email_not_verified") return "This account could not be verified. Ask your project coordinator for help.";
  if (error === "sso_domain_not_allowed") return "This account does not have access to this workspace.";
  if (error === "sso_tenant_inactive") return "This school workspace is not active. Contact the project coordinator.";
  if (error === "sso_account_not_provisioned") return "This account does not have access yet. Ask your project coordinator for help.";
  return "Sign-in could not be completed. Try again or ask your project coordinator for help.";
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
    return "Local-account creation is not enabled for this environment yet.";
  }
  if (error === "pilot_approval_required") return "Real accounts stay blocked until the school privacy, support, retention, and data-owner checks are approved.";
  if (error === "sso_disabled") return "That sign-in option is not available. Choose Email and password.";
  if (status === 403) return "This account cannot create or change that access.";
  if (error === "missing_admin_note" || error === "missing_reason") return "Add the admin note for this change.";
  if (error === "invalid_user") return "Check the email, name, role, sign-in method, and access before creating the account.";
  if (error === "duplicate_email" || error === "email_already_exists") return "That email is already included or already has an account.";
  if (error === "invalid_role_scope") return "That role and access combination is not available.";
  if (error === "program_not_found") return "That program was not found for the current school.";
  if (error === "site_not_found") return "That site was not found.";
  if (error === "student_not_found") return "That student was not found.";
  if (error === "student_requires_site_assignment") return "Choose at least one site for this student.";
  if (error === "global_admin_requires_local_account") return "Global Admin accounts must use email and password so an administrator can still sign in during an outage.";
  if (error === "last_active_local_global_admin") return "At least one active Global Admin with a password must remain.";
  if (error === "too_many_users") return "Create fewer accounts in one request.";
  return "Account creation is unavailable right now. Check the details and try again.";
}

function messageForAccountRemovalError(error, status) {
  if (status === 401) return "Sign in again before removing accounts.";
  if (error === "missing_admin_note") return "Add the admin note before removing this account.";
  if (error === "cannot_remove_self") return "You cannot remove the account you are currently using.";
  if (error === "last_active_local_global_admin") return "At least one active Global Admin with a password must remain.";
  if (error === "user_not_in_site" || error === "user_not_found" || status === 404) return "That account is not active in this school.";
  if (status === 403) return "This account cannot remove that user.";
  return "Account removal could not be saved right now.";
}

function messageForAdminPasswordResetError(error, status) {
  if (status === 401) return "Sign in again before resetting a password.";
  if (error === "missing_reason") return "Write why this person needs a new password.";
  if (error === "missing_confirmation") return "Check the box to confirm this person will be signed out.";
  if (error === "self_reset_not_allowed") return "You cannot reset the password for the account you are using.";
  if (error === "account_disabled") return "This account is disabled. Restore its access before resetting the password.";
  if (error === "password_credential_missing") return "This person uses school sign-in, so their password is managed by the school.";
  if (error === "user_not_in_site" || error === "user_not_found" || status === 404) return "That person is not active in this school.";
  if (status === 403) return "You cannot reset this person’s password. Ask a higher-level admin for help.";
  return "The password reset was not saved. Try again.";
}

function messageForStudentRemovalError(error, status) {
  if (status === 401) return "Sign in again before removing students.";
  if (error === "missing_admin_note") return "Add the admin note before removing this student.";
  if (error === "student_not_found" || status === 404) return "That student is not active in this school.";
  if (status === 403) return "This account cannot remove students for that school.";
  return "Student removal could not be saved right now.";
}

function messageForSiteProgramError(error, status) {
  if (status === 401) return "Sign in again before updating site programs.";
  if (status === 403) return "This account cannot change programs for that school.";
  if (error === "missing_admin_note") return "Add the admin note before saving this program change.";
  if (error === "missing_fields" || error === "invalid_json") return "Choose a program and add the admin note before saving.";
  if (error === "program_not_found" || status === 404) return "That active program is not available for this school right now.";
  if (error === "program_not_assigned") return "Choose a current site program before removing it.";
  return "Programs setup could not be updated right now. Check the details and try again.";
}

function messageForReviewDecisionError(error, status) {
  if (error === "submission_not_in_review") return "This submission is no longer in a submitted review state.";
  if (error === "project_adults_not_ready") return "Confirm the project Mentor and Program Teacher before accepting this work.";
  if (error === "not_found") return "This submission is outside the current school or assigned Program Teacher list.";
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
  if (error === "invalid_https_evidence_url") return "Use a full HTTPS link, beginning with https://, under 2,048 characters, and without usernames or passwords.";
  if (error === "unsafe_evidence_url") return "Use a direct work link, not a sign-in, password, verification, or credential collection page.";
  if (error === "google_drive_link_required") return "Paste a Google Drive, Docs, Sheets, or Slides link.";
  if (error === "missing_submission_id" || status === 404) return "We could not find that work. Refresh and try again.";
  if (status === 403) return "This account cannot add a link to that work.";
  if (status === 401) return "Sign in again before adding a Google Drive link.";
  return "We could not save that link. Check the information and try again.";
}

function messageForStudentSubmissionError(error, status) {
  if (error === "submission_missing_evidence") return "Write your answer here or add one Google Drive link. Then press Turn in again.";
  if (error === "phase_gate_locked") return "You can keep this draft. Finish the earlier phase and get it approved before you turn this in.";
  if (error === "submission_not_submittable" || status === 409) return "This work is not ready to turn in. Open the matching item, follow the next step shown there, then try again.";
  if (error === "missing_submission_id" || status === 404) return "We could not find that work. Refresh and try again.";
  if (status === 403) return "This account cannot turn in that work.";
  if (status === 401) return "Sign in again before turning in work.";
  return "We could not turn in this work. Try again or ask your teacher for help.";
}

function messageForUploadError(error, status) {
  if (error === "drive_config_missing" || error === "drive_credentials_missing" || status === 503) {
    return "We could not upload this file yet because file uploads are not ready here. Try a secure link or contact your teacher.";
  }
  if (error === "missing_file") return "Choose a file before uploading.";
  if (error === "empty_file") return "The selected file is empty. Choose a file with content and try again.";
  if (error === "file_too_large") return "This file is larger than the current upload limit. Choose a smaller file or ask your instructor for help.";
  if (error === "blocked_file_signature") return workspaceUploadBlockedSignatureMessage();
  if (error === "file_content_mismatch") return "This file's contents do not match its name or type. Export it again in the correct format, then retry.";
  if (error === "unsupported_file_type") return workspaceUploadTypeMessage();
  if (error === "drive_token_exchange_failed" || error === "drive_provider_error" || error === "drive_upload_failed" || status === 502) {
    return "The upload service could not receive the file. Try again or contact your instructor.";
  }
  if (error === "rate_limited" || status === 429) return "Too many file uploads happened in a short time. Wait a few minutes, then try again or use a secure link.";
  if (status === 403) return "This account cannot upload for that work.";
  if (status === 401) return "Sign in again before uploading a file.";
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
  if (status === 404) return "That record was not found or is no longer available. Refresh the workspace and choose the item again.";
  if (status === 409) return "This section needs a current selection or refreshed record before it can open.";
  if (status === 429) return "Too many requests happened in a short time. Wait a few minutes, then try again.";
  if (status === 502 || status === 503) return "A storage or provider service is not ready right now. Use the fallback guidance on this page or contact your project coordinator.";
  if (status >= 500) return "The workspace hit a server problem. Refresh once, then contact your project coordinator if it continues.";
  if (error === "network_error") return "This section could not reach the server.";
  return "The workspace could not complete that request. Refresh once, then contact your project coordinator if it continues.";
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
