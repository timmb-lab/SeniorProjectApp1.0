function renderTeacherSection() {
  if (!hasSiteReviewQueueRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Review Work", "work students sent in");
  }
  const result = currentData.reviewQueue;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Review Work", "work students sent in");
  }
  if (result?.status === 409 && result.body?.selectionRequired) {
    return renderReviewQueueSelectionRequired(result.body);
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
  const focusRow = queue.find((item) => normalizeStatus(item?.status) === "submitted") || queue[0] || null;
  const readOnly = scope.readOnly || !permissions.canReview;
  const emptyState = queue.length ? null : reviewQueueEmptyState(body, filters);
  const totalWaiting = safeNumber(pagination.filteredTotal || pagination.total || queue.length);
  return `
    <section class="workspace-command-center workspace-review-queue" aria-label="Review one project">
      ${selected ? "" : `
        <div class="workspace-section-heading">
          <div>
            <p class="workspace-kicker">Project work</p>
            <h1 id="reviewQueueTitle">Review one project</h1>
            <p>Open one project. Read the work. Then choose the next step.</p>
          </div>
          <div class="workspace-site-context">
            <span class="workspace-site-context-badge">${escapeHtml(scope.siteName || "Selected school")}</span>
            ${readOnly ? `<span class="workspace-site-context-badge">Read-only</span>` : ""}
          </div>
        </div>
      `}
      ${renderApiNotice(result)}
      ${readOnly ? `
        <section class="workspace-read-only-banner" data-review-queue-read-only="true">
          <strong>Read-only reviews</strong>
          <p>You can read this work, but only the assigned reviewer can save a decision.</p>
        </section>
      ` : ""}
      ${siteStudentDetailState?.sourceSection === "teacher" ? renderSiteStudentDetailSurface({
        students: queue.map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
        scope,
      }) : ""}
      ${selected ? `
        <button class="workspace-link-button workspace-review-back" type="button" data-review-queue-action="clear-selection">Back to waiting work</button>
        ${renderReviewSubmissionPanel(selected, body)}
      ` : `
        ${renderReviewQueueActiveFilters(filters, body?.filterOptions || {})}
        ${queue.length ? renderReviewQueueFocus(focusRow, permissions) : renderReviewQueueEmptyCard(emptyState, filters)}
        ${queue.length ? `
          <details class="workspace-review-all-list" data-review-all-list="true">
            <summary>See all waiting work (${totalWaiting})</summary>
            <section class="workspace-dashboard-card workspace-review-list-card">
              <div class="workspace-list">
                ${queue.map((item) => renderReviewQueueRow(item, selectedId, permissions)).join("")}
              </div>
              <div class="workspace-directory-pagination" aria-label="Review work pagination">
                <button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="previous-page" ${safeNumber(pagination.offset) <= 0 ? "disabled" : ""}>Previous</button>
                <span>${safeNumber(pagination.offset) + 1}-${safeNumber(pagination.offset) + safeNumber(pagination.returned)} of ${safeNumber(pagination.filteredTotal)}</span>
                <button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="next-page" ${(safeNumber(pagination.offset) + safeNumber(pagination.returned)) >= safeNumber(pagination.filteredTotal) ? "disabled" : ""}>Next</button>
              </div>
            </section>
          </details>
        ` : ""}
        <details class="workspace-review-quiet-tools">
          <summary>More tools</summary>
          <div>
            ${renderReviewQueueFilters(body)}
            ${renderReviewQueueShareLink(body)}
            ${focusRow ? renderViewAsStudentAction(focusRow.studentId, focusRow.studentName, { sourceSection: "teacher" }) : ""}
          </div>
        </details>
      `}
    </section>
  `;
}
function renderReviewQueueStartHere(queue = [], summary = {}, filters = {}, readOnly = false) {
  const rows = Array.isArray(queue) ? queue : [];
  const submittedRows = rows.filter((row) => normalizeStatus(row.status) === "submitted");
  const revisionRows = rows.filter((row) => normalizeStatus(row.status) === "revision_requested");
  const missingWorkRows = submittedRows.filter((row) => !reviewQueueHasWork(row));
  const highPriorityRows = rows.filter((row) => safeNumber(row.riskScore) >= 7 || (Array.isArray(row.riskFlags) && row.riskFlags.some((flag) => ["high", "stale"].includes(normalizeStatus(flag)))));
  const presentationRows = rows.filter((row) => normalizeStatus(row.storyBucket) === "presentation_pending");
  const finalReviewRows = rows.filter((row) => normalizeStatus(row.storyBucket) === "archive_ready");
  if (rows.length) {
    const waitingCount = safeNumber(summary.submitted ?? submittedRows.length);
    const changesCount = safeNumber(summary.revisionRequested ?? revisionRows.length);
    const missingCount = safeNumber(summary.evidenceMissing ?? missingWorkRows.length);
    return `
      <section class="workspace-review-start workspace-review-quick-start" data-review-work-start="true">
        <div>
          <p class="workspace-kicker">Start here</p>
          <h2>Pick the first project below</h2>
          <p>Read the work. Then accept it or ask for changes.</p>
        </div>
        <div class="workspace-review-quick-filters" aria-label="Review groups">
          <button type="button" data-section="teacher" data-section-preset="submitted" aria-pressed="${filters.status === "submitted" ? "true" : "false"}"><strong>${waitingCount}</strong><span>Waiting</span></button>
          <button type="button" data-section="teacher" data-section-preset="revision-requested" aria-pressed="${filters.status === "revision_requested" ? "true" : "false"}"><strong>${changesCount}</strong><span>Need changes</span></button>
          <button type="button" data-section="teacher" data-section-preset="evidence-missing-review" aria-pressed="${filters.evidenceStatus === "missing" ? "true" : "false"}"><strong>${missingCount}</strong><span>No work sent</span></button>
        </div>
      </section>
    `;
  }
  const actions = [
    {
      id: "waiting",
      label: "Waiting for review",
      value: safeNumber(summary.submitted ?? submittedRows.length),
      detail: readOnly ? "Work you can inspect." : "Work students sent in.",
      preset: "submitted",
      action: readOnly ? "Read feedback" : "Review",
      tone: "teacher",
    },
    {
      id: "needs-changes",
      label: "Needs changes",
      value: safeNumber(summary.revisionRequested ?? revisionRows.length),
      detail: "Students are fixing this work.",
      preset: "revision-requested",
      action: "Read feedback",
      tone: "warning",
    },
    {
      id: "missing-work",
      label: "Missing work",
      value: safeNumber(summary.evidenceMissing ?? missingWorkRows.length),
      detail: "Ask for the missing work before approving.",
      preset: "evidence-missing-review",
      action: "Show missing work",
      tone: "warning",
    },
    {
      id: "ready-to-present",
      label: "Ready to present",
      value: safeNumber(summary.presentationPending ?? presentationRows.length),
      detail: "Presentation work needs a check.",
      preset: "presentation-pending-students",
      action: "View students",
      tone: "ready",
      section: "students",
    },
    {
      id: "final-review",
      label: "Ready for final review",
      value: safeNumber(summary.archiveReady ?? finalReviewRows.length),
      detail: "Final work needs a last check.",
      preset: "archive-ready-students",
      action: "View students",
      tone: "ready",
      section: "students",
    },
    {
      id: "high-priority",
      label: "Needs help soon",
      value: safeNumber(summary.highRisk ?? highPriorityRows.length),
      detail: "Start here when a student may be stuck.",
      preset: "high-risk",
      action: "Show students",
      tone: "danger",
    },
  ];
  const activeId = reviewQueueStartActionActiveId(filters);
  const visibleActions = actions
    .filter((action) => action.value > 0 || action.id === activeId)
    .slice(0, 4);
  const totalWaiting = actions.reduce((total, action) => total + safeNumber(action.value), 0);
  const summaryLine = totalWaiting
    ? [
        `${safeNumber(summary.submitted ?? submittedRows.length)} waiting`,
        `${safeNumber(summary.revisionRequested ?? revisionRows.length)} need changes`,
        `${safeNumber(summary.evidenceMissing ?? missingWorkRows.length)} missing work`,
        `${safeNumber(summary.highRisk ?? highPriorityRows.length)} need help soon`,
      ]
    : ["You are caught up for now."];
  if (!visibleActions.length) {
    return `
      <section class="workspace-review-start workspace-review-start-caught-up" data-review-work-start="true" data-review-work-caught-up="true">
        <div>
          <p class="workspace-kicker">Start Here</p>
          <h2>No work is waiting for review right now.</h2>
          <p>You are caught up for now.</p>
        </div>
        <button class="workspace-button workspace-button-secondary" type="button" data-section="students">View students</button>
      </section>
    `;
  }
  return `
    <section class="workspace-review-start" data-review-work-start="true" data-review-work-active="${escapeHtml(activeId)}">
      <div class="workspace-review-start-head">
        <div>
          <p class="workspace-kicker">Start Here</p>
          <h2>Choose the work to review first</h2>
          <p>Pick one row from the list, then make one decision.</p>
        </div>
      </div>
      <div class="workspace-review-start-grid workspace-review-start-primary" data-review-start-primary="true">
        ${renderReviewQueueStartAction(visibleActions.find((action) => action.id === activeId) || visibleActions[0], activeId)}
      </div>
      ${visibleActions.length > 1 ? `
        <details class="workspace-review-secondary-groups" data-review-start-secondary-groups="true">
          <summary>Show other review groups</summary>
          <div class="workspace-review-summary-strip" data-review-work-summary="true">
            ${summaryLine.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
          </div>
          <div class="workspace-review-start-grid">
            ${visibleActions
              .filter((action) => action.id !== (visibleActions.find((candidate) => candidate.id === activeId) || visibleActions[0])?.id)
              .map((action) => renderReviewQueueStartAction(action, activeId))
              .join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function reviewQueueStartActionActiveId(filters = {}) {
  if (filters.risk === "high") return "high-priority";
  if (filters.evidenceStatus === "missing") return "missing-work";
  if (filters.status === "revision_requested") return "needs-changes";
  if (filters.status === "submitted") return "waiting";
  return "all";
}

function renderReviewQueueStartAction(action = {}, activeId = "all") {
  const active = activeId === action.id;
  const section = action.section || "teacher";
  return `
    <article class="workspace-review-start-action ${escapeHtml(action.tone || "quiet")}" data-review-start-action="${escapeHtml(action.id || "")}" data-current-filter="${active ? "true" : "false"}">
      <div>
        <span>${escapeHtml(action.label || "Review work")}</span>
        <strong>${escapeHtml(`${safeNumber(action.value)} ${safeNumber(action.value) === 1 ? "item" : "items"}`)}</strong>
        <p>${escapeHtml(action.detail || "")}</p>
      </div>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}" data-section-preset="${escapeHtml(action.preset || "submitted")}" aria-pressed="${active ? "true" : "false"}">
        ${escapeHtml(active ? "Viewing this group" : action.action || "Open")}
      </button>
    </article>
  `;
}

function renderReviewQueueEmptyCard(emptyState = {}, filters = {}) {
  const filtered = hasActiveReviewQueueFilters(filters);
  return `
    <section class="workspace-empty-state-card" data-review-queue-empty="true" data-review-queue-empty-guide="${filtered ? "filtered" : "all-done"}">
      <h3>${escapeHtml(emptyState?.heading || (filtered ? "No matching work" : "You're caught up"))}</h3>
      <p>${escapeHtml(emptyState?.reason || (filtered ? "No work matches these filters." : "No work is waiting for review right now."))}</p>
      <p class="workspace-muted">${escapeHtml(emptyState?.nextAction || (filtered ? "Clear filters and try again." : "New work will show here when a student turns it in."))}</p>
      <div class="workspace-row-actions">
        ${filtered ? `<button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="reset-filters">Clear filters</button>` : ""}
        <button class="workspace-button workspace-button-secondary" type="button" data-section="students">View students</button>
      </div>
    </section>
  `;
}

function renderReviewQueueDecisionGuide(queue = [], summary = {}) {
  const rows = Array.isArray(queue) ? queue : [];
  const readyRows = rows.filter((row) => row.status === "submitted" && safeNumber(row.evidenceCount) > 0);
  const missingProofRows = rows.filter((row) => row.status === "submitted" && safeNumber(row.evidenceCount) <= 0);
  const revisionRows = rows.filter((row) => normalizeStatus(row.status) === "revision_requested");
  const highRiskRows = rows.filter((row) => safeNumber(row.riskScore) >= 7 || (Array.isArray(row.riskFlags) && row.riskFlags.some((flag) => normalizeStatus(flag) === "high")));
  const nextMove = readyRows.length
    ? "Start with proof-ready submitted work. Approve only when the proof and history support next steps."
    : missingProofRows.length
      ? "Start by confirming missing proof before making approval decisions."
      : revisionRows.length
        ? "Start with revision follow-up. Students stay in the current phase until they send a revision."
        : "No manual decision is waiting in the visible queue.";
  return `
    <section class="workspace-review-decision-guide" data-review-decision-guide="true">
      <div>
        <strong>Program Teacher decision order</strong>
        <p>${escapeHtml(nextMove)}</p>
      </div>
      <div class="workspace-review-decision-counts" aria-label="Review work decision counts">
        <span><b>${escapeHtml(safeNumber(summary.readyToReview ?? readyRows.length))}</b> proof-ready</span>
        <span><b>${escapeHtml(missingProofRows.length || safeNumber(summary.evidenceMissing))}</b> missing proof</span>
        <span><b>${escapeHtml(revisionRows.length || safeNumber(summary.revisionRequested))}</b> revision follow-up</span>
        <span><b>${escapeHtml(highRiskRows.length || safeNumber(summary.highRisk))}</b> high risk</span>
      </div>
    </section>
  `;
}

function renderReviewQueueActionMap(queue = [], summary = {}, filters = {}, readOnly = false) {
  const rows = Array.isArray(queue) ? queue : [];
  const submittedRows = rows.filter((row) => normalizeStatus(row.status) === "submitted");
  const readyRows = submittedRows.filter((row) => safeNumber(row.evidenceCount) > 0);
  const missingProofRows = submittedRows.filter((row) => safeNumber(row.evidenceCount) <= 0);
  const revisionRows = rows.filter((row) => normalizeStatus(row.status) === "revision_requested");
  const highRiskRows = rows.filter((row) => safeNumber(row.riskScore) >= 7 || (Array.isArray(row.riskFlags) && row.riskFlags.some((flag) => normalizeStatus(flag) === "high")));
  const cards = [
    {
      id: "submitted",
      label: "Submitted decisions",
      value: `${safeNumber(summary.submitted ?? submittedRows.length)} waiting`,
      detail: readOnly ? "Open for review context only; assigned Program Teachers save decisions." : "Start here when work is submitted and ready for one Program Teacher decision.",
      tone: submittedRows.length ? "teacher" : "quiet",
      preset: "submitted",
      action: "Show submitted",
    },
    {
      id: "proof-ready",
      label: "Proof-ready",
      value: `${safeNumber(summary.readyToReview ?? readyRows.length)} ready`,
      detail: "Use this lane when active proof is attached and history still needs a decision.",
      tone: readyRows.length ? "ready" : "quiet",
      preset: "evidence-attached-review",
      action: "Show proof-ready",
    },
    {
      id: "missing-proof",
      label: "Missing proof",
      value: `${safeNumber(summary.evidenceMissing ?? missingProofRows.length)} hold`,
      detail: "Use this lane to request exact proof; approval stays locked until proof appears.",
      tone: safeNumber(summary.evidenceMissing ?? missingProofRows.length) ? "warning" : "quiet",
      preset: "evidence-missing-review",
      action: "Show missing proof",
    },
    {
      id: "revision",
      label: "Revision follow-up",
      value: `${safeNumber(summary.revisionRequested ?? revisionRows.length)} open`,
      detail: "Use for history and support context while the student owns the next revision.",
      tone: revisionRows.length ? "revision" : "quiet",
      preset: "revision-requested",
      action: "Show revisions",
    },
    {
      id: "high-risk",
      label: "High risk",
      value: `${safeNumber(summary.highRisk ?? highRiskRows.length)} flagged`,
      detail: "Use when review work has urgency signals before choosing the next row.",
      tone: highRiskRows.length ? "danger" : "quiet",
      preset: "high-risk",
      action: "Show high risk",
    },
  ];
  return `
    <section class="workspace-review-action-map" data-review-action-map="true" data-review-action-map-active="${escapeHtml(reviewQueueActionMapActiveId(filters))}" aria-labelledby="reviewActionMapTitle">
      <div class="workspace-review-action-map-head">
        <div>
          <p class="workspace-kicker">Where to review next</p>
          <h2 id="reviewActionMapTitle">Choose one review lane</h2>
          <p class="workspace-muted">Use this map before scanning rows or changing filters.</p>
        </div>
      </div>
      <div class="workspace-review-action-map-grid">
        ${cards.map((card) => renderReviewQueueActionMapCard(card, filters)).join("")}
      </div>
    </section>
  `;
}

function reviewQueueActionMapActiveId(filters = {}) {
  if (filters.risk === "high") return "high-risk";
  if (filters.evidenceStatus === "missing") return "missing-proof";
  if (filters.evidenceStatus === "attached") return "proof-ready";
  if (filters.status === "revision_requested") return "revision";
  if (filters.status === "submitted") return "submitted";
  return "all";
}

function renderReviewQueueActionMapCard(card = {}, filters = {}) {
  const active = reviewQueueActionMapActiveId(filters) === card.id;
  return `
    <article class="workspace-review-action-map-card ${escapeHtml(card.tone || "quiet")}" data-review-action-map-card="${escapeHtml(card.id || "")}" data-current-filter="${active ? "true" : "false"}">
      <div>
        <span>${escapeHtml(card.label || "Review lane")}</span>
        <strong>${escapeHtml(card.value || "")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="teacher" data-section-preset="${escapeHtml(card.preset || "submitted")}" aria-pressed="${active ? "true" : "false"}">
        ${escapeHtml(active ? "Viewing" : card.action || "Open")}
      </button>
    </article>
  `;
}

function renderReviewQueueSelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="review-queue-site-selection-required" data-review-queue-empty-guide="site-selection">
      <p class="workspace-kicker">Review Work</p>
      <h2>Select a school before opening Review Work</h2>
      <p>This account can review more than one school. Choose the school workspace before loading work students sent in.</p>
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

function renderReviewQueueShareLink(body = {}) {
  const href = reviewQueueShareHref(body);
  if (!href) return "";
  return `
    <details class="workspace-review-share-link" data-review-queue-share="true">
      <summary>Share</summary>
      <div>
        <strong>Share this view</strong>
        <p>Send this link to another authorized Program Teacher or school admin. They will see only work their role can access.</p>
      </div>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-review-queue-share-link="true" data-review-queue-share-href="${escapeHtml(href)}">Copy queue link</button>
    </details>
  `;
}

function reviewQueueShareHref(body = {}) {
  const url = currentWorkspaceUrl();
  if (!url) return "";
  for (const param of WORKSPACE_URL_FILTER_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.delete("view");
  url.searchParams.set("mode", cleanWorkspaceMode(activeWorkspaceMode) || "workspace");
  url.searchParams.set("section", "teacher");
  const filters = body?.filters || reviewQueueFilters || defaultReviewQueueFilters();
  const siteId = selectedSiteQueryValue() || body?.scope?.siteId || unwrap(currentData.reviewQueue)?.scope?.siteId || "";
  if (siteId) url.searchParams.set("siteId", siteId);
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
  return `${url.pathname}${url.search}${url.hash}`;
}

function renderReviewQueueEmptyGuide(emptyState = {}, filters = {}) {
  const filtered = hasActiveReviewQueueFilters(filters);
  const category = filtered ? "filtered" : "all-done";
  const steps = filtered
    ? [
        "1. Clear one filter or use Clear filters.",
        "2. Check Students if you need to find one learner.",
        "3. Return here when new work is ready to review.",
      ]
    : [
        "1. No teacher review is waiting here.",
        "2. Open Students only if you need context on a specific learner.",
        "3. New work will appear here when students send it in.",
      ];
  return `
    <section class="workspace-review-empty-guide" data-review-queue-empty-guide="${escapeHtml(category)}">
      <strong>${escapeHtml(filtered ? "No work matches these filters" : "You are caught up for now")}</strong>
      <ol>
        ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      <p class="workspace-muted">${escapeHtml(emptyState?.nextAction || "Use the next action above to continue.")}</p>
    </section>
  `;
}

function reviewQueueStatusText(value) {
  const normalized = normalizeStatus(value);
  if (["submitted", "under_review", "pending_review", "needs_review"].includes(normalized)) return "Waiting for review";
  if (["revision_requested", "revision_needed", "needs_revision"].includes(normalized)) return "Needs changes";
  if (["approved", "reviewed", "complete", "completed"].includes(normalized)) return "Done";
  return studentStatusText(value);
}

function reviewQueueStatusPill(status) {
  const normalized = normalizeStatus(status);
  const statusClass = statusClassFor(status);
  return `<span class="workspace-status-pill ${escapeHtml(statusClass)}" data-status="${escapeHtml(normalized)}">${escapeHtml(reviewQueueStatusText(status))}</span>`;
}

function reviewQueueKindLabel(value) {
  const labels = {
    model_excellent: "Strong example",
    missing_mentor: "Missing mentor",
    awaiting_review: "Waiting for review",
    revision_requested: "Needs changes",
    presentation_pending: "Ready to present",
    archive_ready: "Ready for final review",
    archive_failed: "Final files need help",
    high_risk: "Needs help soon",
    rich_timeline: "Has feedback history",
  };
  const normalized = normalizeStatus(value);
  return labels[normalized] || reviewQueueStatusText(value);
}

function renderReviewQueueFilters(body) {
  const filters = body?.filters || reviewQueueFilters || defaultReviewQueueFilters();
  const options = body?.filterOptions || {};
  const programs = options.programs || [];
  return `
    <details class="workspace-review-filter-disclosure" data-review-filter-disclosure="true">
      <summary>Filters</summary>
      <form id="reviewQueueFilterForm" class="workspace-filter-bar workspace-review-filter-bar" data-review-queue-filters="true" data-teacher-first-component="DropdownFilterBar">
        <label>
          <span>Search</span>
          <input name="search" type="search" value="${escapeHtml(filters.search || "")}">
        </label>
        <label>
          <span>Status</span>
          <select name="status">
            <option value="" ${!filters.status ? "selected" : ""}>All review work</option>
            ${(options.statuses || ["submitted", "revision_requested", "approved"]).map((status) => `
              <option value="${escapeHtml(status)}" ${filters.status === status ? "selected" : ""}>${escapeHtml(reviewQueueStatusText(status))}</option>
            `).join("")}
          </select>
        </label>
        <label>
          <span>Program</span>
          <select name="programId">
            <option value="" ${!filters.programId ? "selected" : ""}>All visible programs</option>
            ${programs.map((program) => `
              <option value="${escapeHtml(program.programId)}" ${filters.programId === program.programId ? "selected" : ""}>
                ${escapeHtml(cleanDemoSeedDisplay(program.programName, "Program"))} (${safeNumber(program.queueCount)})
              </option>
            `).join("")}
          </select>
        </label>
        <details class="workspace-advanced-filters" data-review-work-more-filters="true" data-teacher-first-component="AdvancedFiltersDrawer">
          <summary>More filters</summary>
          <div class="workspace-review-more-filter-grid">
            <label>
              <span>Kind</span>
              <select name="story">
                <option value="" ${!filters.story ? "selected" : ""}>Any kind</option>
                ${(options.storyBuckets || []).map((story) => `
                  <option value="${escapeHtml(story)}" ${filters.story === story ? "selected" : ""}>${escapeHtml(reviewQueueKindLabel(story))}</option>
                `).join("")}
              </select>
            </label>
            <label>
              <span>Needs help</span>
              <select name="risk">
                ${(options.risks || ["any", "high", "medium", "low", "stale", "no_mentor"]).map((risk) => `
                  <option value="${escapeHtml(risk)}" ${(filters.risk || "any") === risk ? "selected" : ""}>${escapeHtml(riskFilterLabel(risk))}</option>
                `).join("")}
              </select>
            </label>
            <label>
              <span>Work</span>
              <select name="evidenceStatus">
                <option value="" ${!filters.evidenceStatus ? "selected" : ""}>Any work status</option>
                ${(options.evidenceStatuses || ["attached", "missing"]).map((status) => `
                  <option value="${escapeHtml(status)}" ${filters.evidenceStatus === status ? "selected" : ""}>${escapeHtml(studentWorkStatusFilterLabel(status))}</option>
                `).join("")}
              </select>
            </label>
            <label>
              <span>Page size</span>
              <select name="limit">
                ${[10, 25, 50].map((limit) => `<option value="${limit}" ${safeNumber(filters.limit) === limit ? "selected" : ""}>${limit}</option>`).join("")}
              </select>
            </label>
          </div>
        </details>
        <button class="workspace-button workspace-button-primary" type="submit">Apply filters</button>
        <button class="workspace-button workspace-button-secondary" type="button" data-review-queue-action="reset-filters">Clear filters</button>
      </form>
    </details>
  `;
}

function renderReviewQueueActiveFilters(filters = {}, options = {}) {
  const chips = [];
  if (filters.status) chips.push(activeFilterChip("Status", reviewQueueStatusText(filters.status)));
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.story) chips.push(activeFilterChip("Kind", reviewQueueKindLabel(filters.story)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Needs help", riskFilterLabel(filters.risk)));
  if (filters.evidenceStatus) chips.push(activeFilterChip("Work", studentWorkStatusFilterLabel(filters.evidenceStatus)));
  if (filters.search) chips.push(activeFilterChip("Search", filters.search));
  if (safeNumber(filters.limit) !== 10) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Review work", chips, 'data-review-queue-action="reset-filters"');
}

function reviewQueueEmptyState(body, filters = {}) {
  const hasFilters = hasActiveReviewQueueFilters(filters);
  if (hasFilters) {
    const filteredCopy = reviewQueueFilteredEmptyStateCopy(filters, body?.filterOptions || {});
    return {
      heading: filteredCopy.heading,
      reason: filteredCopy.reason,
      owner: "Teacher review team.",
      nextAction: filteredCopy.nextAction,
    };
  }
  return {
    heading: "You're caught up",
    reason: "No work is waiting for review right now.",
    owner: "Teacher review team.",
    nextAction: "View students or wait for new work.",
  };
}

function reviewQueueFilteredEmptyStateCopy(filters = {}, options = {}) {
  if (filters.evidenceStatus === "missing") {
    return {
      heading: "No matching missing work",
      reason: "No work missing files matches these filters.",
      nextAction: "Clear the work filter or check Students for a broader search.",
    };
  }
  if (filters.evidenceStatus === "attached") {
    return {
      heading: "No matching work with files",
      reason: "No work with attached files matches these filters.",
      nextAction: "Clear the work filter or adjust status and help filters.",
    };
  }
  if (filters.status === "submitted") {
    return {
      heading: "No matching work waiting for review",
      reason: "No work waiting for review matches these filters.",
      nextAction: "Clear filters or check Needs changes.",
    };
  }
  if (filters.status === "revision_requested") {
    return {
      heading: "No matching work needing changes",
      reason: "No work needing changes matches these filters.",
      nextAction: "Clear filters or check Waiting for review.",
    };
  }
  if (filters.status === "approved") {
    return {
      heading: "No matching done work",
      reason: "No done review work matches these filters.",
      nextAction: "Clear filters to return to review work.",
    };
  }
  if (filters.risk && filters.risk !== "any") {
    return {
      heading: `No matching ${riskFilterLabel(filters.risk).toLowerCase()} work`,
      reason: `No ${riskFilterLabel(filters.risk).toLowerCase()} work matches these filters.`,
      nextAction: "Clear the help filter or adjust status, work, and program filters.",
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
      heading: "No matching kind of work",
      reason: `No ${reviewQueueKindLabel(filters.story).toLowerCase()} work matches these filters.`,
      nextAction: "Clear the kind filter or adjust status and help filters.",
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
    reason: "No review work matches these filters.",
    nextAction: "Clear filters to return to review work.",
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
    || safeNumber(filters.limit) !== 10
  );
}

function reviewQueueRowActionLabel(item, permissions = {}) {
  const status = normalizeStatus(item?.status);
  if (!permissions.canReview) return "Read feedback";
  if (status === "submitted") return "Review";
  if (status === "revision_requested" || status === "approved") return "Read feedback";
  return "Open";
}

function reviewQueueRowActionHint(item, permissions = {}) {
  const status = normalizeStatus(item?.status);
  if (!permissions.canReview) return "Open this row to read feedback and context.";
  if (status === "submitted") {
    return "Open this row to review the work and feedback history.";
  }
  if (status === "revision_requested") {
    return "Open this row to read feedback while the student fixes the work.";
  }
  return "Open this row for review context.";
}

function reviewQueueHasWork(item = {}) {
  return safeNumber(item?.evidenceCount) > 0
    || safeNumber(item?.writtenResponseLength) > 0
    || Boolean(item?.hasWrittenResponse)
    || Boolean(String(item?.writtenResponseText || "").trim());
}

function reviewQueueWorkSummary(item = {}) {
  const files = safeNumber(item?.evidenceCount);
  const text = String(item?.writtenResponseText || "").trim();
  const words = text ? studentWordCount(text) : 0;
  const parts = [];
  if (words) parts.push(`${words} ${pluralize(words, "word")} written`);
  if (files) parts.push(`${files} ${pluralize(files, "file")} attached`);
  return parts.length ? parts.join(" + ") : "No work sent";
}

function reviewQueueDecisionAvailability(item = {}) {
  const status = normalizeStatus(item?.status);
  const fallbackCanDecide = status === "submitted";
  const fallbackCanApprove = fallbackCanDecide && reviewQueueHasWork(item);
  const availableDecisions = item?.availableDecisions || item?.decisionAvailability?.availableDecisions || {};
  const state = cleanDirectoryFilter(item?.decisionState || item?.decisionAvailability?.state || (
    fallbackCanApprove
      ? "decision-ready"
      : fallbackCanDecide
        ? "proof-missing"
        : status === "revision_requested"
          ? "student-revision"
          : "context"
  )).replace(/_/g, "-");
  const approvalBlockedReason = cleanDirectoryFilter(item?.approvalBlockedReason || item?.decisionAvailability?.approvalBlockedReason || (
    fallbackCanApprove ? "" : fallbackCanDecide ? "missing_evidence" : "not_submitted"
  ));
  const guidance = String(item?.decisionGuidance || item?.decisionAvailability?.guidance || (
    fallbackCanApprove
      ? "Read the work, then accept it or ask for changes."
      : fallbackCanDecide
        ? "Approval locked: active work is missing. Request changes or add comment-only guidance until work is attached."
        : status === "revision_requested"
          ? "Student action needed: wait for the revised submission before recording another Program Teacher decision."
          : "Context only: open submitted work when a Program Teacher decision is needed."
  )).trim().slice(0, 240);
  return {
    state,
    approvalBlockedReason,
    guidance,
    availableDecisions: {
      approved: Boolean(availableDecisions.approved ?? fallbackCanApprove),
      revision_requested: Boolean(availableDecisions.revision_requested ?? fallbackCanDecide),
      comment_only: Boolean(availableDecisions.comment_only ?? fallbackCanDecide),
    },
  };
}

function reviewQueueDecisionAvailable(item = {}, decision = "") {
  const key = normalizeStatus(decision);
  return Boolean(reviewQueueDecisionAvailability(item).availableDecisions[key]);
}

function reviewQueueRowDecisionHint(item = {}, permissions = {}) {
  if (!permissions.canReview) return "Read the work and feedback.";
  const availability = reviewQueueDecisionAvailability(item);
  if (availability.approvalBlockedReason === "missing_evidence") return "Ask the student to add their work.";
  if (normalizeStatus(item?.status) === "submitted") return "Read the work. Choose a next step.";
  const status = normalizeStatus(item?.status);
  const evidenceCount = safeNumber(item?.evidenceCount);
  if (status === "submitted" && evidenceCount > 0) {
    return "Review the work, check files, then save clear feedback.";
  }
  if (status === "submitted") {
    return "Ask for the missing work before approving.";
  }
  if (status === "revision_requested") {
    return "The student needs to fix this before another review.";
  }
  if (status === "approved") {
    return "This work is done. Read feedback or open the student for context.";
  }
  if (availability.guidance) return availability.guidance;
  return "Open the row to read history before choosing the next step.";
}

function reviewQueueRowDecisionState(item = {}, permissions = {}) {
  if (!permissions.canReview) return "read-only";
  const availability = reviewQueueDecisionAvailability(item);
  if (availability.state) return availability.state;
  const status = normalizeStatus(item?.status);
  if (status === "submitted" && reviewQueueHasWork(item)) return "decision-ready";
  if (status === "submitted") return "proof-missing";
  if (status === "revision_requested") return "student-revision";
  if (status === "approved") return "approved";
  return "context";
}

function renderReviewQueueFocus(item, permissions = {}) {
  if (!item) return "";
  const hasWork = reviewQueueHasWork(item);
  const canReview = Boolean(permissions.canReview);
  const canDecide = canReview && normalizeStatus(item.status) === "submitted";
  const isRevision = normalizeStatus(item.status) === "revision_requested";
  return `
    <section class="workspace-review-focus-card" data-review-focus="true">
      <p class="workspace-kicker">Do this next</p>
      <div class="workspace-review-focus-head">
        <div>
          <h2>${escapeHtml(item.projectName || `${item.studentName || "Student"} Project`)}</h2>
          <p>${escapeHtml(item.projectMemberNames || item.studentName || "Student")} · ${escapeHtml(item.requirementTitle || "Senior Project work")}</p>
        </div>
        ${reviewQueueStatusPill(item.status)}
      </div>
      <div class="workspace-review-focus-facts">
        <span>${escapeHtml(reviewQueueWorkSummary(item))}</span>
        <span>Updated ${escapeHtml(formatDate(item.updatedAt))}</span>
      </div>
      <p class="workspace-review-focus-instruction">${escapeHtml(
        isRevision
          ? "The student is fixing this work. Open it only if you need the past feedback."
          : hasWork
          ? canDecide
            ? "Read this project's work. Then accept it or ask for changes."
            : "Read this project's work and past feedback."
          : canReview
            ? "No work was sent. Ask the student to add it."
            : "No work was sent yet.",
      )}</p>
      <button class="workspace-button workspace-button-primary" type="button" data-review-queue-action="select" data-review-submission-id="${escapeHtml(item.submissionId || "")}">
        ${escapeHtml(canDecide ? "Review this project" : isRevision ? "Open follow-up" : "Open this project")}
      </button>
    </section>
  `;
}

function renderReviewQueueRow(item, selectedId, permissions = {}) {
  const selected = item.submissionId === selectedId;
  const actionLabel = reviewQueueRowActionLabel(item, permissions);
  const decisionState = reviewQueueRowDecisionState(item, permissions);
  return `
    <article class="workspace-review-work-row ${selected ? "is-selected" : ""}" data-review-submission-id="${escapeHtml(item.submissionId || "")}" data-review-row-state="${selected ? "selected" : "available"}" data-review-decision-state="${escapeHtml(decisionState)}">
      <div class="workspace-review-work-row-main">
        <div class="workspace-review-work-identity">
          <span class="workspace-review-row-label">Project</span>
          <strong>${escapeHtml(item.projectName || `${item.studentName || "Student"} Project`)}</strong>
          <p>${escapeHtml(item.projectMemberNames || item.studentName || "Student")} · ${escapeHtml(item.requirementTitle || "Senior Project work")}</p>
          <small>${escapeHtml(cleanDemoSeedDisplay(item.programName, "Unassigned"))} · Version ${safeNumber(item.version) || 1}</small>
        </div>
        <div class="workspace-review-work-meta">
          ${reviewQueueStatusPill(item.status)}
          <span>${escapeHtml(formatDate(item.updatedAt))}</span>
          <small>${escapeHtml(reviewQueueWorkSummary(item))}</small>
        </div>
      </div>
      <div class="workspace-row-actions">
        <p class="workspace-review-row-decision" data-review-row-decision-hint="true">${escapeHtml(selected ? "Open now" : reviewQueueRowDecisionHint(item, permissions))}</p>
        <button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-review-queue-action="select" data-review-submission-id="${escapeHtml(item.submissionId || "")}" data-review-row-action-label="${escapeHtml(actionLabel.toLowerCase().replace(/\s+/g, "-"))}">
          ${escapeHtml(selected ? "Open" : actionLabel)}
        </button>
      </div>
    </article>
  `;
}

function reviewQueueRowOwnerAction(item = {}, permissions = {}) {
  const status = normalizeStatus(item.status);
  if (!permissions.canReview) {
    return {
      owner: "Assigned reviewer",
      nextAction: "Use this row for context and route the student to assigned review staff.",
    };
  }
  if (status === "submitted" && reviewQueueHasWork(item)) {
    return {
      owner: "Assigned reviewer",
      nextAction: "Read the work, then accept it or ask for changes.",
    };
  }
  if (status === "submitted") {
    return {
      owner: "Student",
      nextAction: "Hold approval and ask for the exact work before recording a next-step decision.",
    };
  }
  if (status === "revision_requested") {
    return {
      owner: "Student",
      nextAction: "Wait for the student to fix the work; use history only for support context.",
    };
  }
  if (status === "approved") {
    return {
      owner: "Assigned reviewer",
      nextAction: "Use this row as approval history; do not record another decision from this context.",
    };
  }
  return {
    owner: "Teacher review team",
    nextAction: "Open the row and confirm the status before guiding the student.",
  };
}

function renderRiskChips(flags = []) {
  return flags.length
    ? flags.map((flag) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(flag))}</span>`).join("")
    : `<span class="workspace-risk-chip">Low risk</span>`;
}

function renderRiskExplanation(flags = [], { includeLow = true, prefix = "Why this row is highlighted:" } = {}) {
  const normalized = Array.from(new Set(
    (Array.isArray(flags) ? flags : [])
      .map((flag) => normalizeStatus(flag))
      .filter((flag) => flag && flag !== "unknown"),
  ));
  if (!normalized.length) {
    return includeLow
      ? `<p class="workspace-muted" data-risk-explanation="true">${escapeHtml(`${prefix} No urgent risk signal is active right now.`)}</p>`
      : "";
  }
  const explanation = normalized
    .map((flag) => riskExplanation(flag))
    .join(" ");
  return `<p class="workspace-muted" data-risk-explanation="true">${escapeHtml(`${prefix} ${explanation}`)}</p>`;
}

function renderReviewSubmissionPanel(selected, body) {
  const permissions = body?.permissions || {};
  const historyResult = reviewQueueState.historyResult;
  const history = unwrap(historyResult);
  const selectionNotice = String(reviewQueueState.selectionNotice || "").trim();
  const queue = Array.isArray(body?.queue) ? body.queue : [];
  const firstRow = queue[0] || null;
  if (reviewQueueState.loadingHistory) {
    return `
      <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="loading">
        <h2>Loading submission</h2>
        ${renderProblemState({
          reason: "Review history is loading.",
          owner: "Review Work.",
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
            nextAction: "Clear filters or select a visible review row. Protected history loads only after the row appears in this visible review queue.",
          })}
        </section>
      `;
    }
    return `
      <section class="workspace-dashboard-card workspace-review-panel workspace-review-panel-empty" data-review-panel-state="empty">
        <p class="workspace-kicker">Next</p>
        <h2>Select one project</h2>
        <p>Open one project, review what the team sent, then save one clear decision.</p>
        ${firstRow ? `
          <button class="workspace-button workspace-button-primary" type="button" data-review-queue-action="select" data-review-submission-id="${escapeHtml(firstRow.submissionId || "")}">
            Open first work
          </button>
        ` : `
          <p class="workspace-muted">No review work is visible right now.</p>
        `}
      </section>
    `;
  }
  const canDecide = permissions.canReview && normalizeStatus(selected.status) === "submitted";
  const selectedGuidance = !permissions.canReview
    ? "This row is read-only here. Use history and student detail for context."
    : canDecide
      ? reviewQueueRowDecisionHint(selected, permissions)
      : `${reviewQueueStatusText(selected.status)} is follow-up only here. Use history and student detail for context.`;
  return `
    <section class="workspace-dashboard-card workspace-review-panel" data-review-panel-state="ready" data-review-selected-submission="${escapeHtml(selected.submissionId || "")}">
      <div class="workspace-card-head">
        <div>
          <h2>${escapeHtml(selected.projectName || `${selected.studentName || "Student"} Project`)}</h2>
          <p>${escapeHtml(selected.projectMemberNames || selected.studentName || "Student")} · ${escapeHtml(selected.requirementTitle || "Senior Project work")}</p>
        </div>
        ${reviewQueueStatusPill(selected.status)}
      </div>
      <div class="workspace-detail-grid">
        <span class="workspace-site-context-badge">${escapeHtml(cleanDemoSeedDisplay(selected.programName, "Unassigned"))}</span>
        <span class="workspace-site-context-badge">${escapeHtml(reviewQueueWorkSummary(selected))}</span>
        <span class="workspace-site-context-badge">${escapeHtml(formatDate(selected.updatedAt))}</span>
      </div>
      ${renderReviewItemNavigator(selected, queue)}
      ${renderReviewWrittenResponse(selected)}
      <div class="workspace-row-actions workspace-review-open-student-action">
        <button class="workspace-link-button workspace-link-button-small" type="button" data-review-queue-action="open-student" data-review-student-id="${escapeHtml(selected.studentId || "")}">
          Open team lead record
        </button>
        ${renderViewAsStudentAction(selected.studentId, selected.projectName || selected.studentName, { sourceSection: "teacher", label: "See project view" })}
      </div>
      ${canDecide ? renderReviewDecisionForm(selected) : `
        <section class="workspace-empty-state-card" data-review-mutation-disabled="true">
          <h2>No review action available for this row</h2>
          ${renderProblemState({
            reason: permissions.canReview ? `Review actions are only available while work is waiting for review. This row is currently ${reviewQueueStatusText(selected.status).toLowerCase()}.` : "This workspace is read-only for review decisions.",
            owner: permissions.canReview ? "Assigned reviewer." : "Review team.",
            nextAction: permissions.canReview ? "Use the history and student detail for context, or open work that is waiting for review." : "Use this queue for context; assigned reviewers handle decisions.",
          })}
        </section>
      `}
      <details class="workspace-review-more-help" data-review-more-help="true">
        <summary>Past feedback</summary>
        ${renderReviewHistorySummary(historyResult, history)}
      </details>
    </section>
  `;
}

function renderReviewItemNavigator(selected = {}, queue = []) {
  const rows = Array.isArray(queue) ? queue : [];
  if (rows.length <= 1) return "";
  const selectedId = cleanDirectoryFilter(selected?.submissionId || "");
  const index = rows.findIndex((row) => cleanDirectoryFilter(row?.submissionId || "") === selectedId);
  if (index < 0) return "";
  const previous = rows[index - 1] || null;
  const next = rows[index + 1] || null;
  return `
    <nav class="workspace-item-navigator workspace-review-item-navigator" aria-label="Browse review work" data-review-item-navigator="true">
      <span>Review ${escapeHtml(index + 1)} of ${escapeHtml(rows.length)}</span>
      <div>
        ${previous?.submissionId ? `<button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-review-queue-action="select" data-review-submission-id="${escapeHtml(previous.submissionId)}" aria-label="Open previous review: ${escapeHtml(previous.projectName || previous.studentName || "project")}">Previous review</button>` : ""}
        ${next?.submissionId ? `<button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-review-queue-action="select" data-review-submission-id="${escapeHtml(next.submissionId)}" aria-label="Open next review: ${escapeHtml(next.projectName || next.studentName || "project")}">Next review</button>` : ""}
      </div>
    </nav>
  `;
}

function renderReviewWrittenResponse(selected = {}) {
  const text = String(selected?.writtenResponseText || "").trim();
  const files = safeNumber(selected?.evidenceCount);
  if (!text) {
    return `
      <section class="workspace-review-student-work" data-review-written-response="empty">
        <p class="workspace-kicker">Student work</p>
        <h3>${files ? `${files} ${pluralize(files, "file")} attached` : "No work was sent"}</h3>
        <p>${files ? "Open the full student record to read the file." : "Ask the student to write here or add a file."}</p>
      </section>
    `;
  }
  return `
    <section class="workspace-review-student-work" data-review-written-response="ready">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Student writing</p>
          <h3>Read this before you decide</h3>
        </div>
        <span class="workspace-chip">${escapeHtml(studentWordCount(text))} ${pluralize(studentWordCount(text), "word")}</span>
      </div>
      <div class="workspace-review-written-copy">${escapeHtml(text).replace(/\r?\n/g, "<br>")}</div>
    </section>
  `;
}

function renderReviewSelectedSummary(selected = {}, canDecide = false, permissions = {}) {
  const availability = reviewQueueDecisionAvailability(selected);
  const ownerAction = reviewQueueRowOwnerAction(selected, permissions);
  return `
    <section class="workspace-review-selected-summary" data-review-selected-summary="true" data-review-selected-summary-state="${escapeHtml(availability.state || "context")}">
      <div>
        <p class="workspace-kicker">Selected row</p>
        <strong>${escapeHtml(selected.requirementTitle || "Senior Project work")}</strong>
        <span>${escapeHtml(cleanDemoSeedDisplay(selected.programName, "Unassigned"))} / version ${safeNumber(selected.version)} / ${escapeHtml(reviewQueueStatusText(selected.status))}</span>
      </div>
      <div class="workspace-review-selected-summary-facts">
        <span><b>${escapeHtml(reviewQueueWorkSummary(selected))}</b></span>
        <span><b>${safeNumber(selected.reviewCount)}</b> reviews</span>
        <span><b>${safeNumber(selected.commentCount)}</b> comments</span>
      </div>
      <p>${escapeHtml(canDecide ? "One saved decision updates the student's next step." : ownerAction.nextAction)}</p>
    </section>
  `;
}

function renderReviewProofQualityChecklist(selected = {}, history = {}, canDecide = false, permissions = {}) {
  const evidenceCount = safeNumber(selected.evidenceCount);
  const status = normalizeStatus(selected.status);
  const approvalAvailable = reviewQueueDecisionAvailable(selected, "approved");
  const historyCount = Array.isArray(history?.reviews) ? history.reviews.length : 0;
  const checks = [
    {
      label: "Correct work item",
      detail: `${selected.requirementTitle || "Senior Project work"} is the row being reviewed.`,
      state: selected.requirementTitle ? "ready" : "context",
    },
    {
      label: "Files are attached",
      detail: evidenceCount ? `${evidenceCount} Drive ${pluralize(evidenceCount, "link")} ${evidenceCount === 1 ? "is" : "are"} saved on this row.` : "No Google Drive link is saved; approval must stay locked.",
      state: evidenceCount ? "ready" : "blocked",
    },
    {
      label: "History checked",
      detail: historyCount ? `${historyCount} prior review ${pluralize(historyCount, "record")} ${historyCount === 1 ? "is" : "are"} available for comparison.` : "No prior review is recorded; write a complete first decision.",
      state: historyCount ? "context" : "needs_review",
    },
    {
      label: "Decision matches work",
      detail: permissions.canReview && canDecide && approvalAvailable
        ? "Approval, changes, and comment-only are available; choose exactly one."
        : "Use changes or comment-only context until the student sends work with a file or link.",
      state: permissions.canReview && canDecide && approvalAvailable ? "ready" : "blocked",
    },
  ];
  return `
    <section class="workspace-review-proof-quality" data-review-proof-quality-checklist="true" data-review-proof-quality-state="${escapeHtml(approvalAvailable ? "ready" : "blocked")}">
      <strong>Work check before deciding</strong>
      <div class="workspace-review-proof-quality-grid">
        ${checks.map((check) => `
          <article data-review-proof-quality-state="${escapeHtml(check.state)}">
            <span>${escapeHtml(check.label)}</span>
            <small>${escapeHtml(check.detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReviewDecisionChecklist(selected = {}, history = {}, canDecide = false, permissions = {}) {
  const evidenceCount = safeNumber(selected.evidenceCount);
  const status = normalizeStatus(selected.status);
  const approvalAvailable = reviewQueueDecisionAvailable(selected, "approved");
  const comments = reviewHistoryCommentCounts(history?.comments || []);
  const checks = [
    {
      label: "Waiting work selected",
      detail: status === "submitted" ? "This row is open for a teacher decision." : `${reviewQueueStatusText(status)} rows are context or follow-up only.`,
      state: status === "submitted" ? "ready" : "blocked",
    },
    {
      label: "Files attached",
      detail: evidenceCount ? `${evidenceCount} Drive ${pluralize(evidenceCount, "link")} visible to review.` : "Approval should stay locked until a Google Drive link or clear written response is saved.",
      state: evidenceCount ? "ready" : "blocked",
    },
    {
      label: "History checked",
      detail: history?.reviews?.length ? `${history.reviews.length} prior review ${pluralize(history.reviews.length, "record")} available.` : "No prior decision history is recorded.",
      state: "context",
    },
    {
      label: "Student note clear",
      detail: comments.studentVisible ? "Student-visible context exists; make the next saved note specific." : "Write the exact approval or change needed before saving.",
      state: comments.studentVisible ? "context" : "needs_review",
    },
  ];
  const ready = permissions.canReview && canDecide && approvalAvailable;
  return `
    <section class="workspace-review-decision-checklist" data-review-decision-checklist="true" data-review-decision-checklist-state="${escapeHtml(ready ? "ready" : "blocked")}">
      <strong>Approve next steps checklist</strong>
      <div class="workspace-review-check-grid">
        ${checks.map((check) => `
          <article data-review-check-state="${escapeHtml(check.state)}">
            <span>${escapeHtml(check.label)}</span>
            <small>${escapeHtml(check.detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReviewMissingProofHold(selected = {}, canDecide = false) {
  const availability = reviewQueueDecisionAvailability(selected);
  if (!canDecide || reviewQueueDecisionAvailable(selected, "approved") || availability.approvalBlockedReason !== "missing_evidence") return "";
  return `
    <section class="workspace-review-proof-hold" data-review-missing-proof-hold="true">
      <strong>Approval is locked because work is missing</strong>
      <p>Ask for changes or add a comment asking for the exact file or link. Do not approve next steps until the work is attached.</p>
    </section>
  `;
}

function renderReviewSubmissionRecovery(selected = {}, history = {}, permissions = {}) {
  const status = normalizeStatus(selected.status);
  const reviewCount = Array.isArray(history?.reviews) ? history.reviews.length : 0;
  const copy = status === "revision_requested"
    ? {
        state: "revision-open",
        title: "Student changes are still pending",
        detail: "Use student detail and history for context if the student is stuck. Approval waits until the student sends updated work.",
      }
    : status === "submitted" && reviewCount
      ? {
          state: "resubmitted",
          title: "New version is ready",
          detail: "Compare the latest work against the prior review before approving next steps.",
        }
      : {
          state: status || "context",
          title: permissions.canReview ? "Decision recovery path" : "Read-only recovery context",
          detail: permissions.canReview ? "Use the selected status and history to decide whether this is approval, changes, or comment-only context." : "Assigned Program Teachers handle the next saved decision.",
        };
  return `
    <section class="workspace-review-recovery" data-review-submission-recovery="true" data-review-submission-recovery-state="${escapeHtml(copy.state)}">
      <strong>${escapeHtml(copy.title)}</strong>
      <p>${escapeHtml(copy.detail)}</p>
    </section>
  `;
}

function renderReviewDecisionRubric(selected = {}, canDecide = false, permissions = {}) {
  const status = normalizeStatus(selected.status);
  const approvalAvailable = reviewQueueDecisionAvailable(selected, "approved");
  const rows = [
    ["Approve next steps", "Use only when work is attached, the work meets the phase ask, and the student can move forward.", canDecide && approvalAvailable ? "ready" : "blocked"],
    ["Request changes", "Use when the student must fix this phase before moving ahead. Say exactly what to change.", permissions.canReview && status === "submitted" ? "ready" : "context"],
    ["Add comment only", "Use for clarification or support. It does not change the student's approval step.", permissions.canReview ? "context" : "blocked"],
  ];
  return `
    <section class="workspace-review-decision-rubric" data-review-decision-rubric="true">
      <strong>Decision quality rubric</strong>
      <div class="workspace-review-rubric-grid">
        ${rows.map(([title, detail, state]) => `
          <article data-review-rubric-state="${escapeHtml(state)}">
            <span>${escapeHtml(title)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReviewDecisionReadiness(selected = {}, history = {}, canDecide = false, permissions = {}) {
  const evidenceCount = safeNumber(selected.evidenceCount);
  const reviewCount = safeNumber(selected.reviewCount);
  const commentCounts = reviewHistoryCommentCounts(history?.comments || []);
  const status = normalizeStatus(selected.status);
  const readiness = reviewDecisionReadinessCopy(selected, canDecide, permissions);
  return `
    <section class="workspace-review-readiness" data-review-decision-readiness="true" data-review-readiness-state="${escapeHtml(readiness.state)}">
      <div>
        <strong>${escapeHtml(readiness.title)}</strong>
        <p>${escapeHtml(readiness.detail)}</p>
      </div>
      <div class="workspace-review-readiness-grid">
        ${renderReviewReadinessFact("Files", evidenceCount ? `${evidenceCount} attached` : "Missing work", evidenceCount ? "ready" : "blocked")}
        ${renderReviewReadinessFact("Current status", reviewQueueStatusText(status || selected.status), status === "submitted" ? "ready" : "context")}
        ${renderReviewReadinessFact("Previous reviews", `${reviewCount}`, reviewCount ? "context" : "quiet")}
        ${renderReviewReadinessFact("Student-visible notes", `${commentCounts.studentVisible}`, commentCounts.studentVisible ? "context" : "quiet")}
        ${renderReviewReadinessFact("Staff-only notes", `${commentCounts.staffOnly}`, commentCounts.staffOnly ? "context" : "quiet")}
        ${renderReviewReadinessFact("Manual review", canDecide ? "Teacher decision controls next steps" : "Decision not available here", canDecide ? "ready" : "blocked")}
      </div>
    </section>
  `;
}

function renderReviewReadinessFact(label, value, state = "context") {
  return `
    <article class="workspace-review-readiness-fact" data-review-readiness-fact="${escapeHtml(label.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}" data-review-readiness-fact-state="${escapeHtml(state)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function reviewDecisionReadinessCopy(selected = {}, canDecide = false, permissions = {}) {
  if (!permissions.canReview) {
    return {
      state: "read-only",
      title: "Read-only context",
      detail: "Use this panel for context. Assigned Program Teachers record approval, changes, or comment decisions.",
    };
  }
  const status = normalizeStatus(selected.status);
  const availability = reviewQueueDecisionAvailability(selected);
  if (canDecide && reviewQueueDecisionAvailable(selected, "approved")) {
    return {
      state: "ready",
      title: "Ready for a manual Program Teacher decision",
      detail: "Work is attached. Check history, then approve next steps only if the work is complete enough to move forward.",
    };
  }
  if (canDecide && availability.approvalBlockedReason === "missing_evidence") {
    return {
      state: "proof-missing",
      title: "Work check needed before approval",
      detail: "This work is waiting for review, but the needed file or link is missing. Ask for changes before approving next steps.",
    };
  }
  if (status === "revision_requested") {
    return {
      state: "student-action",
      title: "Student changes are still open",
      detail: "The student owns the next change. Use student detail and history for context; approval waits for updated work.",
    };
  }
  return {
    state: "context",
    title: "Decision context",
    detail: "Use history and student detail before telling the student to move ahead.",
  };
}

function renderReviewNextStepCheckpoint(selected, canDecide, permissions = {}) {
  const status = reviewQueueStatusText(selected?.status || "submitted");
  const canReview = Boolean(permissions.canReview);
  const approvalAvailable = reviewQueueDecisionAvailable(selected, "approved");
  const steps = canDecide
    ? approvalAvailable
      ? [
        ["Check work and history", "Open the student detail if mentor, timeline, or phase context is needed before deciding."],
        ["Approve next steps only when ready", "Choose approval when this work is complete enough for the student to move forward."],
        ["Request changes to hold the phase", "Choose changes when the student should fix this phase before moving ahead."],
      ]
      : [
        ["Confirm work first", "Approval stays locked until the file or link is attached to this work."],
        ["Request changes or add a comment", "Tell the student exactly what file, link, or change is needed before approval."],
        ["Approve only after work appears", "Return to approval after this row shows attached work and it meets the phase ask."],
      ]
    : canReview
      ? [
          ["Use this as follow-up context", `${status} work is not open for a new decision from this row.`],
          ["Open waiting work for decisions", "Only work waiting for review exposes approval, changes, and comment decisions."],
          ["Keep the next step clear", "Use student detail and review history before telling the student to move ahead."],
        ]
      : [
          ["Read the review context", "This account can view the row but cannot record a Program Teacher decision here."],
          ["Send students to assigned staff", "Program Teachers record approval or change decisions from Review Work."],
          ["Keep next steps consistent", "Students should wait for recorded approval before starting the next phase."],
        ];
  return `
    <section class="workspace-review-checkpoint-guide" data-review-next-step-checkpoint="true">
      <strong>${escapeHtml(canDecide ? "Approval controls the student's next steps" : "Next-step approval context")}</strong>
      <ol>
        ${steps.map((step, index) => `
          <li>
            <span aria-hidden="true">${escapeHtml(index + 1)}</span>
            <div>
              <b>${escapeHtml(step[0])}</b>
              <p>${escapeHtml(step[1])}</p>
            </div>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderReviewStudentImpactPreview(selected = {}, canDecide = false) {
  const status = normalizeStatus(selected.status);
  const approvalAvailable = reviewQueueDecisionAvailable(selected, "approved");
  const impactRows = canDecide
    ? approvalAvailable
      ? [
        ["Approve next steps", "Student sees approved for next steps and can continue with the next assigned item.", "approved"],
        ["Request changes", "Student stays in this phase, sees the feedback, fixes the work, and sends it again.", "revision_requested"],
        ["Add comment only", "Adds context without changing the student status or approval step.", "under_review"],
      ]
      : [
        ["Approval locked", "Student still waits here because the needed work is missing.", "pending_review"],
        ["Request changes", "Student sees exactly what file, link, or change is needed before approval.", "revision_requested"],
        ["Add comment only", "Adds support context without changing the student's approval step.", "under_review"],
      ]
    : status === "revision_requested"
      ? [
          ["Current student state", "Student sees needs changes and should fix the feedback before moving ahead.", "revision_requested"],
          ["Program Teacher option here", "Use history and student detail for context until the student sends work again.", "under_review"],
          ["Next approval step", "Approval appears only after work is ready for a Program Teacher decision.", "submitted"],
        ]
      : [
          ["Current row state", `${reviewQueueStatusText(selected.status)} rows are context here.`, status || "context"],
          ["Student next step", "Use student detail and review history before giving direction outside the queue.", "under_review"],
          ["Manual review", "Recorded Program Teacher decisions keep phase movement clear for the student.", "approved"],
        ];
  return `
    <section class="workspace-review-impact-preview" data-review-student-impact-preview="true">
      <strong>What the student sees after this decision</strong>
      <div class="workspace-review-impact-grid">
        ${impactRows.map(([title, detail, state]) => `
          <article data-review-impact-state="${escapeHtml(normalizeStatus(state))}">
            ${reviewQueueStatusPill(state)}
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(detail)}</p>
          </article>
        `).join("")}
      </div>
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
          owner: "Review Work.",
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

  const counts = reviewHistoryCommentCounts(comments);

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
      <p class="workspace-muted">Only counts are shown here; Program Teacher note text stays protected.</p>
    </div>
  `;
}

function reviewHistoryCommentCounts(comments = []) {
  return (Array.isArray(comments) ? comments : []).reduce((summary, row) => {
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
}

function renderReviewDecisionForm(selected) {
  const availability = reviewQueueDecisionAvailability(selected);
  const approvalBlocked = !reviewQueueDecisionAvailable(selected, "approved");
  const revisionBlocked = !reviewQueueDecisionAvailable(selected, "revision_requested");
  const commentBlocked = !reviewQueueDecisionAvailable(selected, "comment_only");
  return `
    <form id="reviewDecisionForm" class="workspace-review-feedback" data-review-decision-form="true" data-review-approval-blocked="${approvalBlocked ? "missing-proof" : "false"}" data-review-approval-blocked-reason="${escapeHtml(approvalBlocked ? availability.approvalBlockedReason : "")}">
      <section class="workspace-review-decision-helper" data-review-decision-helper="true">
        <strong>Choose one next step</strong>
        <p>${escapeHtml(approvalBlocked ? "Ask the student to add their work before you accept it." : "Accept opens the next step. Ask for changes keeps this step open.")}</p>
      </section>
      <label>
        <span>Note for the student</span>
        <textarea name="feedback" rows="4" maxlength="800" aria-describedby="reviewDecisionFeedbackHelp"></textarea>
      </label>
      <p id="reviewDecisionFeedbackHelp" class="workspace-muted">Say what was good or what needs to change. The student will see this.</p>
      ${approvalBlocked ? `
        <section class="workspace-review-inline-proof-hold" data-review-decision-inline-proof-hold="true">
          <strong>Approval remains locked here</strong>
          <p>${escapeHtml(availability.approvalBlockedReason === "missing_evidence" ? "No work was sent. Ask the student to write here or add a file." : "This work is not ready to accept yet.")}</p>
        </section>
      ` : ""}
      <div class="workspace-row-actions">
        <button class="workspace-button workspace-button-primary" type="submit" name="decision" value="approved" data-review-decision="approved" ${approvalBlocked ? 'disabled aria-disabled="true" data-review-decision-blocked="missing-work"' : ""}>${escapeHtml(approvalBlocked ? "Work needed first" : "Accept and open next step")}</button>
        <button class="workspace-button workspace-button-secondary" type="submit" name="decision" value="revision_requested" data-review-decision="revision_requested" ${revisionBlocked ? 'disabled aria-disabled="true" data-review-decision-blocked="not-available"' : ""}>Ask for changes</button>
        <button class="workspace-button workspace-button-secondary" type="submit" name="decision" value="comment_only" data-review-decision="comment_only" ${commentBlocked ? 'disabled aria-disabled="true" data-review-decision-blocked="not-available"' : ""}>Save note only</button>
      </div>
      <p class="workspace-muted">The student sees your note right away.</p>
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
              <p>${escapeHtml(item.nextAction || "Open the student to see what help comes next.")}</p>
            </div>
            <div class="workspace-row-actions">
              ${statusPill(item.submissionStatus || "not_started")}
              <button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-mentor-dashboard-action="open-student" data-mentor-dashboard-student-id="${escapeHtml(item.studentId || "")}">Open student</button>
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(item.studentId || "")}">Meeting notes</button>
            </div>
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
  const operationsBody = unwrap(currentData.operationsReadiness);
  if (operationsBody && hasSiteOperationsRole(roleIds(currentUser))) {
    return renderSiteReadinessDashboard(operationsBody, result);
  }
  const report = body?.report || body?.metrics || {};
  const scopeLabel = readinessScopeLabel(body?.scope);
  return renderAggregateReadinessDashboard(result, report, scopeLabel);
}

function renderAggregateReadinessDashboard(result, report = {}, scopeLabel = "Aggregate reporting") {
  const submitted = safeNumber(report.submitted);
  const revisionRequested = safeNumber(report.revisionRequested);
  const approved = safeNumber(report.approved);
  const totalWork = submitted + revisionRequested + approved;
  const score = totalWork ? clampPercent((approved / totalWork) * 100) : null;
  const blockers = [
    { label: "Projects missing required adults", value: safeNumber(report.projectsMissingRequiredAdult), tone: "danger", detail: "Projects missing a confirmed Mentor, Program Teacher, or both" },
    { label: "Submitted for review", value: submitted, tone: "warning", detail: "Work waiting for Program Teacher review" },
    { label: "Needs revision", value: revisionRequested, tone: "danger", detail: "Follow-up requested by reviewers" },
    { label: "Final-file packages queued", value: safeNumber(report.exportsQueued), tone: "admin", detail: "Closeout packages waiting to finish" },
  ].filter((row) => safeNumber(row.value) > 0);
  return `
    <section class="workspace-command-center workspace-readiness-dashboard" data-readiness-report="aggregate" aria-labelledby="readinessDashboardTitle">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Readiness reporting</p>
          <h1 id="readinessDashboardTitle">Aggregate Project Readiness</h1>
          <p>This report shows aggregate project activity only. It does not open individual student records; school staff handle student follow-up in their assigned workspaces.</p>
        </div>
        <span class="workspace-chip">${escapeHtml(scopeLabel)}</span>
      </div>
      ${renderApiNotice(result)}
      ${renderAggregateReadinessActionMap(report, { score, totalWork, approved, scopeLabel })}
      ${renderDashboardKpis([
        { label: "Readiness score", value: score === null ? "No score yet" : `${score}/100`, detail: totalWork ? `${approved} of ${totalWork} reviewed items approved` : "No reviewed work to summarize yet", tone: score !== null && score < 70 ? "warning" : "mentor" },
        { label: "Submitted", value: submitted, detail: "Work waiting for Program Teacher review", tone: "warning" },
        { label: "Needs revision", value: revisionRequested, detail: "Follow-up requested by reviewers", tone: revisionRequested ? "danger" : "mentor" },
        { label: "Approved", value: approved, detail: "Work marked complete", tone: "mentor" },
        { label: "Projects with both adults", value: safeNumber(report.projects) ? `${safeNumber(report.projectsAdultsReady)} of ${safeNumber(report.projects)}` : "No projects", detail: safeNumber(report.projectsMissingRequiredAdult) ? `${safeNumber(report.projectsMissingRequiredAdult)} projects need people setup` : "Both required adults are confirmed", tone: safeNumber(report.projectsMissingRequiredAdult) ? "danger" : "mentor" },
        { label: "Evidence", value: safeNumber(report.evidence), detail: "Attached project evidence", tone: "admin" },
        { label: "Archive Packages Queued", value: safeNumber(report.exportsQueued), detail: "Closeout packages waiting to finish", tone: "warning" },
      ], { label: "Aggregate readiness summary", className: "workspace-readiness-kpis" })}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderReadinessScoreCard(score, totalWork, "Readiness score", totalWork ? `${approved} of ${totalWork} reviewed items are approved.` : "No reviewed work to summarize yet.")}
        ${renderDashboardCard("Top blockers", "Aggregate categories only", renderHorizontalBars(blockers, totalWork || blockers.reduce((sum, row) => sum + safeNumber(row.value), 0), { emptyLabel: "No aggregate blockers are currently reported." }))}
      </div>
    </section>
  `;
}

function renderSiteReadinessDashboard(operationsBody = {}, readinessResult = null) {
  const dashboard = operationsDashboardModel(operationsBody);
  const readiness = operationsBody.readiness || {};
  const permissions = operationsBody.permissions || {};
  const scope = operationsBody.scope || {};
  const administrationMonitoring = siteReadOnlyAudience(scope) === "administration";
  const heroKicker = administrationMonitoring ? "Leadership readiness" : "Aggregate project readiness";
  const heroTitle = administrationMonitoring ? "School Readiness" : "Readiness";
  const heroDetail = administrationMonitoring
    ? "Track school readiness, blocker priorities, program risk, and highest-risk students from the records you can monitor here. Teachers and site staff still handle approvals, mentor assignments, account updates, and security settings."
    : "Aggregate project readiness, blocker priorities, program risk, and highest-risk students from visible operations records.";
  return `
    <section class="workspace-command-center workspace-readiness-dashboard" data-readiness-report="site-operations" aria-labelledby="readinessDashboardTitle">
      ${renderSiteContextBlock(operationsBody)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">${escapeHtml(heroKicker)}</p>
          <h1 id="readinessDashboardTitle">${escapeHtml(heroTitle)}</h1>
          <p>${escapeHtml(heroDetail)}</p>
        </div>
        <span class="workspace-chip">${escapeHtml(dashboard.total ? `${dashboard.total} visible records` : "No visible records")}</span>
      </div>
      ${renderApiNotice(readinessResult)}
      ${renderSiteReadinessActionMap(operationsBody, dashboard, administrationMonitoring)}
      ${renderDashboardKpis([
        { label: "Readiness score", value: dashboard.score === null ? "No score yet" : `${dashboard.score}/100`, detail: dashboard.scoreDetail, tone: dashboard.score !== null && dashboard.score < 70 ? "warning" : "mentor" },
        { label: "Ready signals", value: metricWithPercent(dashboard.readySignals, dashboard.total), detail: "Best available ready/complete count", tone: "mentor" },
        { label: "Blocked/failed", value: dashboard.blockers.filter((row) => ["final_files_failed", "archive_failed", "storage_setup_needed"].includes(normalizeStatus(row.label))).reduce((sum, row) => sum + safeNumber(row.value), 0), detail: "Final-file failure and setup blockers", tone: "danger" },
        { label: "Missing proof", value: dashboard.blockers.find((row) => ["proof_missing", "evidence_missing"].includes(normalizeStatus(row.label)))?.value || 0, detail: "Proof or progress missing", tone: "warning" },
        { label: "Stale activity", value: dashboard.blockers.find((row) => row.label === "Stale activity")?.value || 0, detail: "No recent student progress", tone: "warning" },
      ], { label: "Readiness top summary", className: "workspace-readiness-kpis" })}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderReadinessScoreCard(dashboard.score, dashboard.total, "Readiness score", dashboard.scoreDetail)}
        ${renderDashboardCard("Top blockers", "Ranked categories with total-count context", renderHorizontalBars(dashboard.blockers, dashboard.total, { emptyLabel: "No blockers found in visible records." }))}
      </div>
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderDashboardCard("Program risk", "Top-risk programs in visible records", renderOperationsProgramBreakdown(readiness.filteredProgramBreakdown || readiness.programBreakdown || [], dashboard.total))}
        ${renderDashboardCard("Highest-risk students", "Compact follow-up list", renderOperationsCompactWorklist(dashboard.worklistRows, permissions, operationsBody.filters || operationsReadinessFilters))}
      </div>
    </section>
  `;
}

function renderAggregateReadinessActionMap(report = {}, options = {}) {
  const submitted = safeNumber(report.submitted);
  const revisionRequested = safeNumber(report.revisionRequested);
  const approved = safeNumber(options.approved ?? report.approved);
  const totalWork = safeNumber(options.totalWork);
  const score = options.score;
  const evidence = safeNumber(report.evidence);
  const exportsQueued = safeNumber(report.exportsQueued);
  const activeSignals = [submitted, revisionRequested, evidence, exportsQueued].filter((count) => count > 0).length;
  const cards = [
    {
      id: "score",
      tone: score !== null && score !== undefined && score < 70 ? "warning" : "ready",
      owner: "Reporting",
      count: score === null || score === undefined ? "No score yet" : `${score}/100`,
      title: "Interpret the score",
      detail: totalWork ? `${approved} of ${totalWork} reviewed items are approved. Treat this as a trend signal, not a student roster.` : "No reviewed work is visible in this aggregate report yet.",
      source: options.scopeLabel || "Aggregate report",
      summaryLabel: "Report signal",
    },
    {
      id: "submitted",
      tone: submitted ? "warning" : "quiet",
      owner: "Program Teachers",
      count: submitted,
      title: "Watch submitted work",
      detail: "Submitted counts mean review work exists somewhere in assigned school workspaces.",
      source: "Aggregate review count",
      summaryLabel: "Summary only",
    },
    {
      id: "revision",
      tone: revisionRequested ? "danger" : "quiet",
      owner: "Students and Program Teachers",
      count: revisionRequested,
      title: "Watch revision loops",
      detail: "Revision counts show follow-up pressure, but this report does not expose individual student records.",
      source: "Aggregate revision count",
      summaryLabel: "Summary only",
    },
    {
      id: "proof",
      tone: evidence ? "proof" : "quiet",
      owner: "Assigned staff",
      count: evidence,
      title: "Confirm proof volume",
      detail: "Use evidence totals to understand proof activity without opening private files or storage details.",
      source: "Aggregate proof count",
      summaryLabel: "Private proof hidden",
    },
    {
      id: "final-files",
      tone: exportsQueued ? "warning" : "quiet",
      owner: "Site Admins",
      count: exportsQueued,
      title: "Watch final-file queue",
      detail: "Queued package counts are a closeout workload signal; source work stays in site operations screens.",
      source: "Aggregate package count",
      summaryLabel: "Summary only",
    },
    {
      id: "privacy",
      tone: "privacy",
      owner: "Access boundary",
      count: "Aggregate",
      title: "Keep this report aggregate",
      detail: "Do not use this screen to infer student proof, account access, mentor coverage, or review decisions.",
      source: "No individual records",
      summaryLabel: "Guardrail",
    },
  ];
  return renderReadinessActionMap("aggregate", {
    title: "Read the report safely",
    detail: "Use these lanes to interpret aggregate readiness without leaving the privacy boundary.",
    badge: `${activeSignals} active signal${activeSignals === 1 ? "" : "s"}`,
    cards,
  });
}

function renderSiteReadinessActionMap(operationsBody = {}, dashboard = {}, administrationMonitoring = false) {
  const summary = operationsBody.summary || {};
  const presentationSummary = operationsBody.presentation?.summary || {};
  const archiveSummary = operationsBody.archive?.summary || {};
  const score = dashboard.score;
  const finalFileBlockers = safeNumber(summary.archiveFailed) + safeNumber(archiveSummary.providerUnavailable) + safeNumber(summary.archiveExpired);
  const presentationFollowUp = safeNumber(summary.presentationPending) + safeNumber(summary.outlinePending) + safeNumber(presentationSummary.attentionRequired);
  const staffActionRows = safeNumber(summary.needsAttention);
  const missingProof = safeNumber(summary.evidenceMissing);
  const staleRows = safeNumber(summary.staleActivity);
  const programBreakdown = Array.isArray(operationsBody.readiness?.filteredProgramBreakdown)
    ? operationsBody.readiness.filteredProgramBreakdown
    : Array.isArray(operationsBody.readiness?.programBreakdown)
      ? operationsBody.readiness.programBreakdown
      : [];
  const programRows = programBreakdown.length;
  const firstProgram = programBreakdown.find((program) => program?.programId) || null;
  const activeSignals = [staffActionRows, finalFileBlockers, missingProof, presentationFollowUp, staleRows].filter((count) => count > 0).length;
  const cards = [
    {
      id: "score",
      tone: score !== null && score !== undefined && score < 70 ? "warning" : "ready",
      owner: administrationMonitoring ? "School Admin" : "Site team",
      count: score === null || score === undefined ? "No score yet" : `${score}/100`,
      title: "Interpret school readiness",
      detail: dashboard.scoreDetail || "Use this score as a routing signal before opening protected details.",
      source: "Readiness score",
      summaryLabel: "Report signal",
    },
    {
      id: "staff-action",
      tone: staffActionRows ? "danger" : "quiet",
      owner: "Site Admin",
      count: staffActionRows,
      title: "Start with staff-action rows",
      detail: "Open the highest-priority rows that need staff context before students can move cleanly.",
      source: "Operations readiness",
      section: "operations",
      preset: "needs-attention",
      actionLabel: "Open rows",
    },
    {
      id: "final-files",
      tone: finalFileBlockers ? "danger" : "ready",
      owner: "Site Admin",
      count: finalFileBlockers,
      title: "Resolve final-file blockers",
      detail: "Failed exports, expired windows, or storage setup blockers can stop closeout handoff.",
      source: "Operations final-file rows",
      section: "operations",
      preset: "archive-failed",
      actionLabel: "Open final files",
    },
    {
      id: "proof",
      tone: missingProof ? "warning" : "ready",
      owner: "Students and Program Teachers",
      count: missingProof,
      title: "Find missing proof",
      detail: "Use proof-missing rows to route exact evidence follow-up without exposing private storage.",
      source: "Operations proof rows",
      section: "operations",
      preset: "evidence-missing",
      actionLabel: "Open proof rows",
    },
    {
      id: "presentation",
      tone: presentationFollowUp ? "presentation" : "ready",
      owner: "Program Teacher or site staff",
      count: presentationFollowUp,
      title: "Clarify presentation readiness",
      detail: "Check schedule, outline, and check-in state before day-of readiness is treated as complete.",
      source: "Operations presentation rows",
      section: "operations",
      preset: "presentation-pending",
      actionLabel: "Open presentations",
    },
    {
      id: "stale",
      tone: staleRows ? "warning" : "ready",
      owner: "School support team",
      count: staleRows,
      title: "Check stale activity",
      detail: "Stale work needs current staff context before readiness reports look healthy.",
      source: "Operations stale rows",
      section: "operations",
      preset: "stale-activity",
      actionLabel: "Open stale work",
    },
    {
      id: "program-risk",
      tone: programRows ? "program" : "quiet",
      owner: "Program leads",
      count: programRows || "Review",
      title: "Compare program risk",
      detail: "Use program risk to decide whether the blocker is isolated or needs a broader staff huddle.",
      source: "Program risk card",
      section: "operations",
      preset: firstProgram?.programId ? "program-breakdown" : "",
      programId: firstProgram?.programId || "",
      actionLabel: "Open programs",
    },
    {
      id: "review",
      tone: "review",
      owner: "Program Teachers",
      count: "Review",
      title: "Review work",
      detail: "Submitted and revision decisions still belong in Review Work, not this report.",
      source: "Review Work",
      section: "teacher",
      preset: "submitted",
      actionLabel: "Open reviews",
    },
    {
      id: "mentor",
      tone: "mentor",
      owner: "Site Admin or Program Teacher",
      count: "Coverage",
      title: "Check mentor coverage",
      detail: "If readiness is low because students lack support, open the coverage workflow instead of changing report data.",
      source: "Mentor Assignments",
      section: "mentorAssignments",
      preset: "no-mentor",
      actionLabel: "Open coverage",
    },
    {
      id: "school",
      tone: "school",
      owner: "School context",
      count: operationsBody.scope?.siteName ? "1 school" : "Context",
      title: "Return to school overview",
      detail: "Use the Site Dashboard when the report needs first-day setup, access, or whole-school context.",
      source: operationsBody.scope?.siteName || "Current school",
      section: "siteDashboard",
      actionLabel: "Open dashboard",
    },
  ];
  return renderReadinessActionMap("site", {
    title: administrationMonitoring ? "Choose one monitoring lane" : "Choose one readiness lane",
    detail: administrationMonitoring
      ? "Start with the safest monitoring signal, then open only the source screen that owns the next step."
      : "Start with the highest-impact blocker, then use the source screen that can actually move the work.",
    badge: `${activeSignals} active blocker${activeSignals === 1 ? "" : "s"}`,
    cards,
  });
}

function renderReadinessActionMap(kind, config = {}) {
  const cards = Array.isArray(config.cards) ? config.cards : [];
  if (!cards.length) return "";
  return `
    <section class="workspace-readiness-action-map" data-readiness-action-map="${escapeHtml(kind || "readiness")}" aria-label="Readiness action map">
      <div class="workspace-readiness-action-map-head">
        <div>
          <p class="workspace-kicker">Readiness action map</p>
          <h2>${escapeHtml(config.title || "Choose one readiness lane")}</h2>
          <p>${escapeHtml(config.detail || "Use the report as a routing surface before opening detailed worklists.")}</p>
        </div>
        <span class="workspace-chip">${escapeHtml(config.badge || `${cards.length} lanes`)}</span>
      </div>
      <div class="workspace-readiness-action-map-grid">
        ${cards.map((card) => renderReadinessActionMapCard(card)).join("")}
      </div>
    </section>
  `;
}

function renderReadinessActionMapCard(card = {}) {
  return `
    <article class="workspace-readiness-action-map-card ${escapeHtml(card.tone || "quiet")}" data-readiness-action-map-card="${escapeHtml(card.id || "readiness")}" data-readiness-action-owner="${escapeHtml(card.owner || "Readiness owner")}">
      <div>
        <div class="workspace-readiness-action-map-meta">
          <span>${escapeHtml(card.owner || "Readiness owner")}</span>
          <b>${escapeHtml(card.count ?? "0")}</b>
        </div>
        <strong>${escapeHtml(card.title || "Review readiness")}</strong>
        <p>${escapeHtml(card.detail || "Use the matching source screen before taking action.")}</p>
        ${card.source ? `<small>${escapeHtml(card.source)}</small>` : ""}
      </div>
      ${renderReadinessActionMapButton(card)}
    </article>
  `;
}

function renderReadinessActionMapButton(card = {}) {
  if (card.section && availableSectionIdsForAnyMode().has(card.section)) {
    const preset = card.preset ? ` data-section-preset="${escapeHtml(card.preset)}"` : "";
    const programId = card.programId ? ` data-program-id="${escapeHtml(card.programId)}"` : "";
    return `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(card.section)}"${preset}${programId}>${escapeHtml(card.actionLabel || "Open")}</button>`;
  }
  return `<span class="workspace-summary-badge">${escapeHtml(card.summaryLabel || "Summary only")}</span>`;
}

function readinessScopeLabel(scope) {
  const normalized = normalizeStatus(scope);
  if (normalized === "aggregate_only") return "Aggregate reporting only";
  if (normalized === "all_programs") return "All programs";
  if (!normalized || normalized === "aggregate") return "Aggregate reporting";
  return statusText(normalized);
}

function renderSecuritySection() {
  const roles = roleIds(currentUser);
  const globalAdmin = hasGlobalAdminRole(roles);
  const studentView = primaryRoleForUser(currentUser) === "student";
  const authConfig = authConfigForUi();
  return `
    ${renderSecurityActionMap({ roles, globalAdmin, authConfig })}
    ${studentView ? renderStudentAccountPath(authConfig) : ""}
    <section class="workspace-card" data-security-password-card="true">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${globalAdmin ? "Account security" : "Account settings"}</p>
          <h2>Password and Sessions</h2>
        </div>
        <span class="workspace-chip">Signed in</span>
      </div>
      <p>${globalAdmin
        ? "Update your password from this workspace when you know the current password."
        : studentView
          ? "Change your own password here. This does not change your role, class access, project work, or anyone else's account."
          : "Update your own password and close other active sessions without access to admin security tools."}</p>
      <form id="workspaceChangePasswordForm" class="workspace-form" data-security-password-form="true" data-auth-action="change-password" data-auth-endpoint="/api/auth/change-password">
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
        ${renderTaskFinishChecklist("password-change", "Before changing your password", [
          ["Current password ready", "Use the password that works for this signed-in account.", "ready"],
          ["New password typed twice", "The two new-password fields must match before the change can save.", "needs_review"],
          ["Other sessions close", "After the change, other active sessions for this account are closed.", "context"],
        ], {
          detail: "Use these checks so the password change does not interrupt your work.",
          badge: "Account checks",
        })}
        <p class="workspace-muted">After a password change, other active sessions for this account are closed.</p>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Change password</button>
        </div>
      </form>
    </section>
    ${renderSecuritySignInModePanel(authConfig, { studentView })}
    ${renderSecuritySessionImpactPanel({ globalAdmin })}
    ${renderSecuritySupportGuide({ globalAdmin, canManageUsers: canUseUsersAccess(roles), studentView })}
  `;
}

function renderStudentAccountPath(authConfig = authConfigForUi()) {
  const email = currentUser?.email || "this signed-in account";
  const steps = [
    {
      id: "confirm",
      tone: "ready",
      label: "1",
      title: "Confirm this is you",
      detail: `Password changes apply only to ${email}.`,
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="profile">Open profile</button>`,
    },
    {
      id: "change",
      tone: "warning",
      label: "2",
      title: "Change only if you know the current password",
      detail: authConfig.googleSsoEnabled
        ? "If you use Google sign-in, ask staff before changing a local password you do not use."
        : "Use this form only when you know the password that signs you into this workspace.",
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-security-focus="password-form">Open password form</button>`,
    },
    {
      id: "return",
      tone: "student",
      label: "3",
      title: "Return to project work",
      detail: "Use My Work for proof, feedback, deadlines, and Senior Project next steps.",
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="student">Open My Work</button>`,
    },
  ];
  return `
    <section class="workspace-student-account-path" data-student-account-path="true" aria-labelledby="studentAccountPathTitle">
      <div class="workspace-student-account-path-head">
        <div>
          <p class="workspace-kicker">Account path</p>
          <h2 id="studentAccountPathTitle">Use Account in this order</h2>
          <p>This screen is for sign-in only. It does not change project work, proof, feedback, roles, or school access.</p>
        </div>
      </div>
      <div class="workspace-student-account-path-grid">
        ${steps.map((step) => `
          <article class="workspace-student-account-step ${escapeHtml(step.tone)}" data-student-account-step="${escapeHtml(step.id)}">
            <span>${escapeHtml(step.label)}</span>
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.detail)}</p>
            <div class="workspace-row-actions">${step.actionHtml}</div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSecurityActionMap({ roles = roleIds(currentUser), globalAdmin = hasGlobalAdminRole(roles), authConfig = authConfigForUi() } = {}) {
  const primaryRole = primaryRoleForUser(currentUser);
  const studentView = primaryRole === "student";
  const canOpenUsersAccess = canUseUsersAccess(roles) && availableSectionIdsForAnyMode().has("adminUsers");
  const canOpenAudit = globalAdmin && availableSectionIdsForAnyMode().has("audit");
  const signInMode = securitySignInModeLabel(authConfig, { studentView });
  const email = currentUser?.email || "this signed-in account";
  const cards = [
    {
      id: "identity",
      tone: "ready",
      owner: "Signed-in account",
      count: roleLabel(primaryRole),
      title: studentView ? "Make sure this is your account" : "Confirm this is your account",
      detail: studentView ? `Password changes apply only to ${email}.` : `Password changes apply only to ${email}. Use Profile to review your role and access first.`,
      source: roleScopeSummary(currentUser),
      section: "profile",
      actionLabel: "Open profile",
    },
    {
      id: "password",
      tone: "password",
      owner: "You",
      count: "Current + new",
      title: studentView ? "Change your password" : "Change password intentionally",
      detail: studentView ? "Use your current password, then type the new password twice before saving." : "Use the current password, then type the new password twice before saving.",
      source: "Password form",
      focus: "password-form",
      actionLabel: "Open form",
    },
    {
      id: "checklist",
      tone: "checklist",
      owner: "Before saving",
      count: "3 checks",
      title: studentView ? "Check before saving" : "Run the password checks",
      detail: "Confirm current password, matching new password fields, and session impact before the save.",
      source: "Password checklist",
      focus: "password-checklist",
      actionLabel: "Open checks",
    },
    {
      id: "sessions",
      tone: "session",
      owner: "Session safety",
      count: "Other sessions",
      title: "Know what signs out",
      detail: "Changing your password closes other active sessions for this account after the change succeeds.",
      source: "Session impact",
      focus: "session-impact",
      actionLabel: "Open impact",
    },
    {
      id: "sign-in",
      tone: authConfig.googleSsoEnabled ? "signin" : "quiet",
      owner: "Sign-in method",
      count: signInMode,
      title: studentView ? "Use your school sign-in path" : "Use the approved sign-in path",
      detail: authConfig.googleSsoEnabled
        ? studentView
          ? "Google sign-in is available; local password changes only affect this app's local password."
          : "School sign-in is available. Password changes only affect accounts that use email and password."
        : "This environment uses local sign-in until the approved Google Workspace provider is ready.",
      source: "Auth configuration",
      focus: "sign-in-mode",
      actionLabel: "Open sign-in note",
    },
    {
      id: "support",
      tone: "support",
      owner: "Recovery",
      count: "Ask staff",
      title: "Know when to ask for help",
      detail: studentView ? "If your current password is missing or your account looks wrong, ask staff instead of guessing." : "If the current password is missing, the account is disabled, or SSO is expected, use the support path instead of guessing.",
      source: "Support guide",
      focus: "support",
      actionLabel: "Open support",
    },
    {
      id: "users",
      tone: canOpenUsersAccess ? "role" : "quiet",
      owner: "Other accounts",
      count: canOpenUsersAccess ? "Users & Access" : "Protected",
      title: "Use Users & Access for other people",
      detail: "This screen only changes the signed-in account. Role grants, setup passwords, and removals belong in Users & Access.",
      source: canOpenUsersAccess ? "Account management source" : "No account-management access here",
      section: canOpenUsersAccess ? "adminUsers" : "",
      actionLabel: "Open users",
      summaryLabel: "Not here",
    },
    {
      id: "audit",
      tone: canOpenAudit ? "history" : "quiet",
      owner: "Security review",
      count: canOpenAudit ? "Audit" : "Admin only",
      title: "Review audit activity elsewhere",
      detail: "Denied access, role changes, import attempts, and reset activity are reviewed from Audit, not from this account form.",
      source: canOpenAudit ? "Audit source screen" : "Admin-only audit screen",
      section: canOpenAudit ? "audit" : "",
      actionLabel: "Open audit",
      summaryLabel: "Admin only",
    },
  ];
  const visibleCards = studentView ? cards.filter((card) => !["users", "audit"].includes(card.id)) : cards;

  return `
    <section class="workspace-security-action-map" data-security-action-map="true" aria-label="Account security action map">
      <div class="workspace-security-action-map-head">
        <div>
          <p class="workspace-kicker">${globalAdmin ? "Security action map" : "Account action map"}</p>
          <h2>${escapeHtml(studentView ? "Use this only for your account" : "Keep account changes in the right place")}</h2>
          <p>${escapeHtml(studentView ? "Change your password here. Ask staff for reset, sign-in, or access problems." : "Confirm the signed-in account, change only your password here, and route other account or audit work to the source screen.")}</p>
        </div>
        <span class="workspace-chip">${escapeHtml(signInMode)}</span>
      </div>
      <div class="workspace-security-action-map-grid">
        ${visibleCards.map((card) => renderSecurityActionMapCard(card)).join("")}
      </div>
    </section>
  `;
}

function renderSecurityActionMapCard(card = {}) {
  return `
    <article class="workspace-security-action-map-card ${escapeHtml(card.tone || "quiet")}" data-security-action-map-card="${escapeHtml(card.id || "security")}" data-security-action-owner="${escapeHtml(card.owner || "Account owner")}">
      <div>
        <div class="workspace-security-action-map-meta">
          <span>${escapeHtml(card.owner || "Account owner")}</span>
          <b>${escapeHtml(card.count || "0")}</b>
        </div>
        <strong>${escapeHtml(card.title || "Review account safety")}</strong>
        <p>${escapeHtml(card.detail || "Use the source screen that owns this account step.")}</p>
        ${card.source ? `<small>${escapeHtml(card.source)}</small>` : ""}
      </div>
      ${renderSecurityActionMapButton(card)}
    </article>
  `;
}

function renderSecurityActionMapButton(card = {}) {
  if (card.section && availableSectionIdsForAnyMode().has(card.section)) {
    return `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(card.section)}">${escapeHtml(card.actionLabel || "Open")}</button>`;
  }
  if (card.focus) {
    return `<button class="workspace-link-button workspace-link-button-small" type="button" data-security-focus="${escapeHtml(card.focus)}">${escapeHtml(card.actionLabel || "Open")}</button>`;
  }
  return `<span class="workspace-summary-badge">${escapeHtml(card.summaryLabel || "Summary only")}</span>`;
}

function renderSecuritySignInModePanel(authConfig = authConfigForUi(), options = {}) {
  const studentView = Boolean(options.studentView);
  return `
    <section class="workspace-security-signin-mode" data-security-signin-mode="true">
      <strong>Approved sign-in path</strong>
      <div class="workspace-security-guide-grid">
        <article>
          <span>${escapeHtml(securitySignInModeLabel(authConfig, { studentView }))}</span>
          <small>${escapeHtml(authConfig.googleSsoEnabled
            ? studentView
              ? "Google sign-in is available. A local password change only affects this app's local password."
              : "School sign-in is available. Password changes only update accounts that use email and password."
            : "Email and password is the sign-in method for this workspace.")}</small>
        </article>
        <article>
          <span>Current account only</span>
          <small>Password updates here do not create users, grant roles, reset other people, or change school access.</small>
        </article>
      </div>
    </section>
  `;
}

function renderSecuritySessionImpactPanel({ globalAdmin = false } = {}) {
  return `
    <section class="workspace-security-session-impact" data-security-session-impact="true">
      <strong>Session impact</strong>
      <div class="workspace-security-guide-grid">
        <article>
          <span>Other sessions close</span>
          <small>After a successful password change, other active sessions for this same account are closed.</small>
        </article>
        <article>
          <span>${escapeHtml(globalAdmin ? "Admin work continues after sign-in" : "Return to your workspace")}</span>
          <small>${escapeHtml(globalAdmin
            ? "Sign in again before continuing protected admin, audit, import, or export work."
            : "Sign in again before continuing submissions, proof, meetings, reviews, or final-file work.")}</small>
        </article>
      </div>
    </section>
  `;
}

function renderSecuritySupportGuide({ globalAdmin = false, canManageUsers = false, studentView = false } = {}) {
  if (studentView) {
    return `
      <section class="workspace-security-support-guide" data-security-support-guide="true">
        <strong>When to ask for help</strong>
        <div class="workspace-security-guide-grid">
          <article>
            <span>Forgot current password</span>
            <small>Ask the approved account support person for a reset path instead of trying repeated passwords.</small>
          </article>
          <article>
            <span>My Work looks wrong</span>
            <small>Ask your Program Teacher or school account support if your project, class, role, or school access looks wrong.</small>
          </article>
          <article>
            <span>Proof or feedback issue</span>
            <small>Use My Work for project files and teacher feedback. This Account screen only changes sign-in settings.</small>
          </article>
        </div>
      </section>
    `;
  }
  return `
    <section class="workspace-security-support-guide" data-security-support-guide="true">
      <strong>When not to use this form</strong>
      <div class="workspace-security-guide-grid">
        <article>
          <span>Forgot current password</span>
          <small>Ask the approved account support person for a reset path instead of trying repeated passwords.</small>
        </article>
        <article>
          <span>${escapeHtml(canManageUsers ? "Other users need Users & Access" : "Other users need account staff")}</span>
          <small>${escapeHtml(canManageUsers
            ? "Use Users & Access for setup passwords, role changes, account removals, or school access."
            : "Ask authorized account staff for setup passwords, role changes, account removals, or school access.")}</small>
        </article>
        <article>
          <span>${escapeHtml(globalAdmin ? "Audit activity belongs in Audit" : "Security review is admin-only")}</span>
          <small>${escapeHtml(globalAdmin
            ? "Use Audit to review denied access, role changes, import attempts, reset activity, and protected-route events."
            : "This screen does not expose audit history, denied-access events, or protected security activity.")}</small>
        </article>
      </div>
    </section>
  `;
}

function securitySignInModeLabel(authConfig = authConfigForUi(), options = {}) {
  const studentView = Boolean(options.studentView);
  if (authConfig.googleSsoEnabled && authConfig.localLoginEnabled) return studentView ? "Google sign-in + local" : "SSO + local";
  if (authConfig.googleSsoEnabled) return studentView ? "Google sign-in" : "Google SSO";
  if (authConfig.localLoginEnabled) return "Local only";
  return "Sign-in configured";
}

function renderAdminUsersSection() {
  const roles = roleIds(currentUser);
  if (!canUseUsersAccess(roles)) {
    return renderPermissionDeniedSection("Users & Access", "account provisioning records");
  }
  const canCreateGlobal = hasGlobalAdminRole(roles);
  const roleChoices = adminRoleChoicesForRoles(roles);
  const authConfig = authConfigForUi();
  const localAccountsOnly = !authConfig.googleSsoEnabled;
  const peopleScreensEnabled = canUsePeopleManagementScreens(roles);

  return `
    ${renderUsersAccessActionMap(roleChoices, { canCreateGlobal, localAccountsOnly })}
    ${peopleScreensEnabled
      ? renderPeopleManagementHub(roleChoices, { canCreateGlobal, localAccountsOnly })
      : renderScopedAccountCreationForm(roleChoices, { canCreateGlobal, localAccountsOnly })}
    ${renderAdminImportResult()}
    ${renderAdminRoleAssignmentsPanel()}
    ${renderAdminAccessAssignmentPanel()}
  `;
}

function canUsePeopleManagementScreens(roles = roleIds(currentUser)) {
  return hasGlobalAdminRole(roles) || roles.has("site_admin") || roles.has("administration");
}

function renderPeopleManagementHub(roleChoices = [], options = {}) {
  const activeView = cleanAdminPeopleView(adminPeopleView) || "manage-students";
  const screens = peopleManagementScreensForRoles(roleIds(currentUser));
  const currentScreen = screens.find((screen) => screen.id === activeView) || screens[0];
  adminPeopleView = currentScreen?.id || "manage-students";
  return `
    <section class="workspace-card workspace-people-hub" data-people-management="true" data-people-view="${escapeHtml(adminPeopleView)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">People</p>
          <h2>Students, staff, imports, and assignments</h2>
          <p class="workspace-muted">Use the focused screen for the job: add one person, import a roster, confirm current access, or manage assignments.</p>
        </div>
        <span class="workspace-chip">${escapeHtml(options.canCreateGlobal ? "Global people access" : "School people access")}</span>
      </div>
      ${renderPeopleManagementNav(screens, adminPeopleView)}
      ${renderPeopleManagementScopeSummary(roleChoices, options)}
      ${renderPeopleManagementScreen(adminPeopleView, roleChoices, options)}
    </section>
  `;
}

function peopleManagementScreensForRoles(roles = roleIds(currentUser)) {
  if (!canUsePeopleManagementScreens(roles)) return [];
  return [
    { id: "manage-students", group: "Students", label: "Manage Students", detail: "Review current student accounts and open student context." },
    { id: "add-student", group: "Students", label: "Add Student", detail: "Create one student account for this school." },
    { id: "manage-staff", group: "Staff", label: "Manage Staff", detail: "Review staff, mentor, viewer, teacher, and admin accounts." },
    { id: "add-staff", group: "Staff", label: "Add Staff", detail: "Create one staff account with the smallest role." },
    { id: "import-students", group: "Imports", label: "Import Students", detail: "Preview and validate a student CSV before saving." },
    { id: "import-staff", group: "Imports", label: "Import Staff", detail: "Preview and validate a staff CSV before saving." },
    { id: "assignments", group: "Assignments", label: "Assignments", detail: "Use limited mentor, viewer, Program Teacher, and school-role grants." },
  ];
}

function renderPeopleManagementNav(screens = [], activeView = "manage-students") {
  const grouped = [];
  for (const screen of screens) {
    let group = grouped.find((item) => item.group === screen.group);
    if (!group) {
      group = { group: screen.group, screens: [] };
      grouped.push(group);
    }
    group.screens.push(screen);
  }
  return `
    <nav class="workspace-people-nav" aria-label="People screens" data-people-nav="true">
      ${grouped.map((group) => `
        <div class="workspace-people-nav-group" data-people-nav-group="${escapeHtml(group.group.toLowerCase())}">
          <span>${escapeHtml(group.group)}</span>
          <div>
            ${group.screens.map((screen) => `
              <button class="workspace-link-button workspace-link-button-small ${screen.id === activeView ? "is-active" : ""}" type="button" data-people-view-target="${escapeHtml(screen.id)}" ${screen.id === activeView ? 'aria-current="page"' : ""}>
                ${escapeHtml(screen.label)}
              </button>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </nav>
  `;
}

function renderPeopleManagementScopeSummary(roleChoices = [], options = {}) {
  const roles = roleIds(currentUser);
  const scope = unwrap(currentData.accessAssignments)?.scope || currentSiteWorkspaceContext() || {};
  const roleSummary = roleChoices.map((choice) => choice.label).join(", ");
  const rows = [
    ["Access", options.canCreateGlobal ? "All schools where the APIs allow access" : scope.siteName || "Selected school only"],
    ["Can create", roleSummary || "No role choices available"],
    ["Platform owner", hasGlobalAdminRole(roles) ? "Global Admin uses email and password" : "Required for Global Admin accounts"],
  ];
  return `
    <div class="workspace-people-scope" data-people-scope-summary="true">
      ${rows.map(([label, detail]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(detail)}</strong>
        </article>
      `).join("")}
    </div>
  `;
}

function renderPeopleManagementScreen(view = "manage-students", roleChoices = [], options = {}) {
  const screen = cleanAdminPeopleView(view) || "manage-students";
  if (screen === "add-student") return renderAddStudentScreen(options);
  if (screen === "add-staff") return renderAddStaffScreen(roleChoices, options);
  if (screen === "import-students") return renderCsvImportScreen("students", options);
  if (screen === "import-staff") return renderCsvImportScreen("staff", options);
  if (screen === "manage-staff") return renderManageStaffScreen();
  if (screen === "assignments") return renderAssignmentsPeopleScreen();
  return renderManageStudentsScreen();
}

function renderScopedAccountCreationForm(roleChoices = [], options = {}) {
  const roles = roleIds(currentUser);
  return `
    <section class="workspace-card" data-admin-section="users">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Users & Access</p>
          <h2>Add account</h2>
          <p class="workspace-muted">Create local accounts only for the roles this workspace is already allowed to manage.</p>
        </div>
        <span class="workspace-chip">${escapeHtml(options.canCreateGlobal ? "Global Admin" : canUseStaffAccessManagement(roles) ? "School staff access" : "Student and mentor access")}</span>
      </div>
      ${renderFirstUseGuide("users-access", "Create access only after school access is clear", [
        ["Choose the smallest role", "Pick Student, Mentor, Viewer, Program Teacher, or school staff only for the job this person must do."],
        ["Confirm school, program, or student access", "Do not create broad access when a school, program, or assigned-student list will work."],
        ["Write the admin note", "Record why the account or access change is needed before saving."],
        ["Use approved password delivery", "Local setup passwords appear once and must use the school's approved handoff process."],
      ], {
        detail: "This path keeps account setup understandable and prevents over-broad access.",
        badge: "Access path",
      })}
      ${renderAdminImportPreflight(roleChoices, options)}
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
                <option value="local">Email and password</option>
                ${options.localAccountsOnly ? "" : `<option value="sso">School sign-in</option>`}
              </select>
              <span class="workspace-muted">${escapeHtml(options.localAccountsOnly ? "New accounts use email and password." : "Choose how this person will sign in.")}</span>
            </label>
          </div>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">Choose account type</p>
          ${renderAdminRoleQuickPicks(roleChoices)}
          <div class="workspace-form-grid">
            <label class="workspace-label">
              Account role
              <select class="workspace-select" name="roleId" required>
                ${adminRoleOptions(roleChoices)}
              </select>
            </label>
            <div class="workspace-access-preview" data-admin-role-copy aria-live="polite"></div>
          </div>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">Access / assignment</p>
          <p class="workspace-muted">Only the fields needed for the selected account type stay open.</p>
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
        ${renderTaskFinishChecklist("account-create-save", "Before creating this account", [
          ["Smallest role chosen", "Use the lowest access level that lets the person do the job.", "ready"],
          ["Access matches the work", "Confirm site, program, cohort, or student access before saving.", "ready"],
          ["Setup handoff approved", "Use the school's approved process before creating a local setup password.", "needs_review"],
          ["Audit note explains why", "Write the reason in plain language so another admin can review it later.", "context"],
        ], {
          detail: "Use these checks before creating an account or setup password.",
          badge: "Access checks",
        })}
        ${renderDestructiveActionConfirmation({
          id: "admin-import-delivery",
          name: "deliveryConfirmation",
          label: "I reviewed the role, site/program/student access, and setup-password delivery process before creating this account.",
          detail: "Create the account only after the school has an approved way to give the one-time setup password to the user.",
        })}
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Create account</button>
        </div>
      </form>
    </section>
  `;
}

function renderManageStudentsScreen() {
  const access = unwrap(currentData.accessAssignments) || {};
  const users = access.users || {};
  const students = siteAccountRows({ students: users.students || [] }).filter((row) => row.roleIds.includes("student"));
  return `
    <section class="workspace-people-screen" data-people-screen="manage-students">
      <div class="workspace-people-screen-head">
        <div>
          <p class="workspace-kicker">Manage Students</p>
          <h3>Current student accounts</h3>
          <p class="workspace-muted">Confirm the student is available to this school before opening detail or using View as Student.</p>
        </div>
        <button class="workspace-button workspace-button-secondary" type="button" data-people-view-target="add-student">Add Student</button>
      </div>
      ${renderManageStudentSetupSummary(students, access.assignments || {})}
      ${students.length ? `
        <div class="workspace-list">
          ${students.map((student) => renderManageStudentRow(student)).join("")}
        </div>
      ` : `
        <article class="workspace-empty-state-card" data-manage-students-empty="true">
          <strong>No students are available for this school yet.</strong>
          <p>Add a student or choose a site with student access.</p>
        </article>
      `}
    </section>
  `;
}

function renderManageStudentSetupSummary(students = [], assignments = {}) {
  const rows = (Array.isArray(students) ? students : []).map((student) => ({
    student,
    flags: adminStudentSetupFlags(student, assignments),
  }));
  const issueRows = rows.filter((row) => row.flags.length);
  const programGaps = rows.filter((row) => row.flags.some((flag) => flag.id === "program")).length;
  const profileGaps = rows.filter((row) => row.flags.some((flag) => flag.id === "profile" || flag.id === "email")).length;
  const mentorGaps = rows.filter((row) => row.flags.some((flag) => flag.id === "mentor")).length;
  const viewerGaps = rows.filter((row) => row.flags.some((flag) => flag.id === "viewer")).length;
  const firstIssue = issueRows[0] || null;
  const firstLabels = firstIssue ? firstIssue.flags.map((flag) => flag.label).join(", ") : "";
  const firstHasCoverageGap = firstIssue?.flags?.some((flag) => flag.id === "mentor" || flag.id === "viewer");
  const sections = availableSectionIdsForAnyMode();
  const firstAction = firstIssue
    ? firstHasCoverageGap && sections.has("adminAssignments")
      ? { label: "Assign coverage", section: "adminAssignments" }
      : sections.has("students")
        ? { label: "Open student directory", section: "students" }
        : { label: "Review roster", peopleView: "manage-students" }
    : { label: "Review reports", section: sections.has("adminReports") ? "adminReports" : "overview" };
  return `
    <section class="workspace-admin-student-setup-summary" data-admin-student-setup-summary="true" aria-label="Student setup summary">
      <article class="workspace-admin-student-first-action ${firstIssue ? "warning" : "ready"}" data-admin-student-first-action="${escapeHtml(firstIssue?.student?.userId || "clear")}">
        <div>
          <span>${escapeHtml(firstIssue ? "Review first" : "Current roster state")}</span>
          <strong>${escapeHtml(firstIssue?.student?.displayName || "No student setup blocker is first in line")}</strong>
          <p>${escapeHtml(firstIssue ? firstLabels : "Current student rows do not show program, profile, mentor, or viewer setup gaps.")}</p>
        </div>
        ${renderAdminActionControl(firstAction, "workspace-button workspace-button-secondary workspace-button-small", "student-first")}
      </article>
      <details class="workspace-admin-supporting-disclosure workspace-admin-student-setup-details" data-admin-student-setup-details="true">
        <summary>
          <span class="workspace-kicker">Roster counts</span>
          <strong>Show setup counts</strong>
        </summary>
        <div class="workspace-admin-student-setup-cards">
          <article>
            <span>Students visible</span>
            <strong>${escapeHtml(String(rows.length))}</strong>
            <small>Roster rows available in this school view.</small>
          </article>
          <article class="${programGaps + profileGaps ? "warning" : "ready"}">
            <span>Roster fields</span>
            <strong>${escapeHtml(String(programGaps + profileGaps))}</strong>
            <small>${escapeHtml(`${profileGaps} profile, ${programGaps} program gaps.`)}</small>
          </article>
          <article class="${mentorGaps ? "warning" : "ready"}">
            <span>Mentor gaps</span>
            <strong>${escapeHtml(String(mentorGaps))}</strong>
            <small>Students without active mentor coverage.</small>
          </article>
          <article class="${viewerGaps ? "warning" : "ready"}">
            <span>Viewer gaps</span>
            <strong>${escapeHtml(String(viewerGaps))}</strong>
            <small>Students without read-only viewer coverage.</small>
          </article>
        </div>
      </details>
    </section>
  `;
}

function renderManageStudentRow(student = {}) {
  const assignments = unwrap(currentData.accessAssignments)?.assignments || {};
  const profileText = studentRosterProfileText(student);
  const assignmentText = studentAssignmentStatusText(student);
  const setupFlags = adminStudentSetupFlags(student, assignments);
  const moreActions = [
    renderViewAsStudentAction(student.userId, student.displayName, { sourceSection: "adminUsers" }) ? { html: renderViewAsStudentAction(student.userId, student.displayName, { sourceSection: "adminUsers" }) } : null,
    availableSectionIdsForAnyMode().has("adminAssignments") ? { label: "Manage assignments", section: "adminAssignments" } : null,
  ].filter(Boolean);
  return `
    <article class="workspace-row" data-manage-student-row="${escapeHtml(student.userId || "")}" data-manage-student-setup="${escapeHtml(setupFlags.length ? "needs-review" : "ready")}">
      <div>
        <strong>${escapeHtml(student.displayName || "Student")}</strong>
        <p>${escapeHtml(student.email || "")}</p>
        <p class="workspace-muted">${escapeHtml(profileText)}</p>
        <p class="workspace-muted">${escapeHtml(assignmentText)}</p>
        ${renderAdminSetupFlagChips(setupFlags)}
      </div>
      <div class="workspace-row-actions">
        ${availableSectionIdsForAnyMode().has("students") ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(student.userId || "")}">View student</button>` : ""}
        ${statusPill(setupFlags.length ? "needs_review" : "active")}
        ${renderAdminMoreMenu({
          id: `student-${student.userId || "row"}`,
          actions: moreActions,
          contextLabel: student.displayName || "Student",
        })}
      </div>
    </article>
  `;
}

function studentRosterProfileText(student = {}) {
  const cohort = studentCohortDisplay(student, "");
  const graduationYear = String(student.graduationYear || student.graduation_year || "").trim();
  if (cohort && graduationYear) return `${cohort} / Graduation ${graduationYear}`;
  if (cohort) return cohort;
  if (graduationYear) return `Graduation ${graduationYear}`;
  return "Roster profile not set";
}

function studentAssignmentStatusText(student = {}) {
  const mentorName = String(student.mentorName || "").trim();
  const viewerName = String(student.viewerName || "").trim();
  const mentorText = mentorName ? `Mentor: ${mentorName}` : "Mentor: unassigned";
  const viewerText = viewerName ? `Viewer: ${viewerName}` : "Viewer: unassigned";
  return `${mentorText} / ${viewerText}`;
}

function renderManageStaffScreen() {
  const access = unwrap(currentData.accessAssignments) || {};
  const users = access.users || {};
  const assignments = access.assignments || {};
  const accounts = siteAccountRows(users).filter((row) => !row.roleIds.includes("student"));
  return `
    <section class="workspace-people-screen" data-people-screen="manage-staff">
      <div class="workspace-people-screen-head">
        <div>
          <p class="workspace-kicker">Manage Staff</p>
          <h3>Current staff and support accounts</h3>
          <p class="workspace-muted">Review staff access before changing assignments or removing school access.</p>
        </div>
        <button class="workspace-button workspace-button-secondary" type="button" data-people-view-target="add-staff">Add Staff</button>
      </div>
      ${renderManageStaffSetupSummary(accounts, assignments)}
      ${accounts.length ? `
        <div class="workspace-list">
          ${accounts.map((account) => {
            const setupFlags = adminStaffSetupFlags(account, assignments);
            return `
            <article class="workspace-row" data-manage-staff-row="${escapeHtml(account.userId || "")}" data-manage-staff-setup="${escapeHtml(setupFlags.length ? "needs-review" : "ready")}">
              <div>
                <strong>${escapeHtml(account.displayName || "Staff account")}</strong>
                <p>${escapeHtml(account.email || "")}</p>
                <p class="workspace-muted">${escapeHtml((account.roleLabels || []).join(", ") || "Assigned staff")}</p>
                ${renderAdminSetupFlagChips(setupFlags)}
              </div>
              <div class="workspace-row-actions">
                <button class="workspace-link-button workspace-link-button-small" type="button" data-people-view-target="assignments">Manage</button>
                ${statusPill(setupFlags.length ? "needs_review" : "active")}
                ${renderAdminMoreMenu({
                  id: `staff-${account.userId || "row"}`,
                  contextLabel: account.displayName || "Staff account",
                  actions: [
                    { label: "Manage assignments", peopleView: "assignments" },
                    availableSectionIdsForAnyMode().has("audit") ? { label: "View recent changes", section: "audit" } : null,
                  ].filter(Boolean),
                })}
              </div>
            </article>
          `;
          }).join("")}
        </div>
      ` : `
        <article class="workspace-empty-state-card" data-manage-staff-empty="true">
          <strong>No staff accounts are available for this school yet.</strong>
          <p>Add staff or choose a site with staff access.</p>
        </article>
      `}
    </section>
  `;
}

function renderAdminSetupFlagChips(flags = []) {
  const safeFlags = Array.isArray(flags) ? flags : [];
  if (!safeFlags.length) return "";
  return `
    <div class="workspace-chip-row workspace-admin-setup-flags" data-admin-setup-flags="true">
      ${safeFlags.map((flag) => `<span class="workspace-risk-chip" data-admin-setup-flag="${escapeHtml(flag.id || "flag")}">${escapeHtml(flag.label || "Needs setup")}</span>`).join("")}
    </div>
  `;
}

function renderManageStaffSetupSummary(accounts = [], assignments = {}) {
  const rows = (Array.isArray(accounts) ? accounts : []).map((account) => ({
    account,
    flags: adminStaffSetupFlags(account, assignments),
  }));
  const issueRows = rows.filter((row) => row.flags.length);
  const missingEmail = rows.filter((row) => row.flags.some((flag) => flag.id === "email")).length;
  const missingMentorScope = rows.filter((row) => row.flags.some((flag) => flag.id === "mentor-scope")).length;
  const missingProgramScope = rows.filter((row) => row.flags.some((flag) => flag.id === "program-scope")).length;
  const firstIssue = issueRows[0] || null;
  const firstLabels = firstIssue ? firstIssue.flags.map((flag) => flag.label).join(", ") : "";
  const firstHasAssignmentGap = firstIssue?.flags?.some((flag) => /scope/.test(flag.id || ""));
  const firstAction = firstIssue
    ? firstHasAssignmentGap
      ? { label: "Open assignment forms", peopleView: "assignments" }
      : { label: "Review staff list", peopleView: "manage-staff" }
    : { label: "Review access", peopleView: "assignments" };
  return `
    <section class="workspace-admin-staff-setup-summary" data-admin-staff-setup-summary="true" aria-label="Staff setup summary">
      <div class="workspace-admin-staff-setup-cards">
        <article>
          <span>Staff visible</span>
          <strong>${escapeHtml(String(rows.length))}</strong>
          <small>Staff, mentors, viewers, teachers, and admins in this school view.</small>
        </article>
        <article class="${issueRows.length ? "warning" : "ready"}">
          <span>Needs setup</span>
          <strong>${escapeHtml(String(issueRows.length))}</strong>
          <small>${escapeHtml(issueRows.length ? "Review these before handoff." : "No staff setup gaps in visible rows.")}</small>
        </article>
        <article class="${missingEmail ? "warning" : "ready"}">
          <span>Missing email</span>
          <strong>${escapeHtml(String(missingEmail))}</strong>
          <small>Setup password delivery still needs an approved contact path.</small>
        </article>
        <article class="${missingMentorScope + missingProgramScope ? "warning" : "ready"}">
          <span>Coverage gaps</span>
          <strong>${escapeHtml(String(missingMentorScope + missingProgramScope))}</strong>
          <small>Mentor or Program Teacher coverage needs confirmation.</small>
        </article>
      </div>
      <article class="workspace-admin-staff-first-action ${firstIssue ? "warning" : "ready"}" data-admin-staff-first-action="${escapeHtml(firstIssue?.account?.userId || "clear")}">
        <div>
          <span>${escapeHtml(firstIssue ? "Review first" : "Current staff state")}</span>
          <strong>${escapeHtml(firstIssue?.account?.displayName || "No staff blocker is first in line")}</strong>
          <p>${escapeHtml(firstIssue ? firstLabels : "Current staff rows do not show email, role, mentor, viewer, program, or site access gaps.")}</p>
        </div>
        ${renderAdminActionControl(firstAction, "workspace-button workspace-button-secondary workspace-button-small", "staff-first")}
      </article>
    </section>
  `;
}

function renderAddStudentScreen(options = {}) {
  return `
    <section class="workspace-people-screen" data-people-screen="add-student">
      <div class="workspace-people-screen-head">
        <div>
          <p class="workspace-kicker">Add Student</p>
          <h3>Add one student</h3>
          <p class="workspace-muted">Create the student only inside a site you are already allowed to manage. Fields marked Required must be filled in before saving.</p>
        </div>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-people-view-target="manage-students">Return to Manage Students</button>
      </div>
      <form id="workspaceAddStudentForm" class="workspace-form" data-admin-add-person-form="true" data-person-kind="student">
        <input type="hidden" name="roleId" value="student">
        <input type="hidden" name="identityType" value="local">
        ${renderPersonNameEmailFields()}
        <div class="workspace-form-section">
          <p class="workspace-kicker">School and program</p>
          <div class="workspace-form-grid">
            <label class="workspace-label">
              Site / school <span class="workspace-required">Required</span>
              <select class="workspace-select" name="siteIds" required>
                ${siteOptionsForAdminForm()}
              </select>
            </label>
            <label class="workspace-label">
              Program <span class="workspace-required">Required</span>
              <select class="workspace-select" name="programIds" required>
                ${programOptionsForAdminForm()}
              </select>
            </label>
            <label class="workspace-label">
              Cohort
              <input class="workspace-input" name="cohort" autocomplete="off" aria-describedby="student-cohort-example">
              <span id="student-cohort-example" class="workspace-muted">Example: Class of 2026</span>
            </label>
            <label class="workspace-label">
              Graduation year
              <input class="workspace-input" name="graduationYear" inputmode="numeric" maxlength="4" aria-describedby="student-graduation-year-example">
              <span id="student-graduation-year-example" class="workspace-muted">Example: 2026</span>
            </label>
            <label class="workspace-label">
              Status <span class="workspace-required">Required</span>
              <select class="workspace-select" name="status" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <p class="workspace-muted">Program stays tied to this school. Cohort and graduation year save to the student's roster profile.</p>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">Optional assignments</p>
          <div class="workspace-form-grid">
            <label class="workspace-label">
              Mentor assignment
              <select class="workspace-select" name="mentorUserId">
                ${optionalUserOptions(unwrap(currentData.accessAssignments)?.users?.mentors || [], "No mentor selected")}
              </select>
            </label>
            <label class="workspace-label">
              Viewer assignment
              <select class="workspace-select" name="viewerUserId">
                ${optionalUserOptions(unwrap(currentData.accessAssignments)?.users?.viewers || [], "No viewer selected")}
              </select>
            </label>
          </div>
          <p class="workspace-muted">Selected mentor and viewer access is applied during save when the staff member is already available to this school.</p>
        </div>
        ${renderAdminPersonSaveFooter("student", options)}
      </form>
    </section>
  `;
}

function renderAddStaffScreen(roleChoices = [], options = {}) {
  const staffChoices = roleChoices.filter((role) => role.value !== "student");
  return `
    <section class="workspace-people-screen" data-people-screen="add-staff">
      <div class="workspace-people-screen-head">
        <div>
          <p class="workspace-kicker">Add Staff</p>
          <h3>Add one staff member</h3>
          <p class="workspace-muted">Choose the smallest role and only the access this person needs for school operations.</p>
        </div>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-people-view-target="manage-staff">Return to Manage Staff</button>
      </div>
      <form id="workspaceAddStaffForm" class="workspace-form" data-admin-add-person-form="true" data-person-kind="staff">
        <input type="hidden" name="identityType" value="local">
        ${renderPersonNameEmailFields()}
        <div class="workspace-form-section">
          <p class="workspace-kicker">Role and access</p>
          ${renderAdminRoleQuickPicks(staffChoices, staffChoices[0]?.value || "mentor")}
          <div class="workspace-form-grid">
            <label class="workspace-label">
              Staff role <span class="workspace-required">Required</span>
              <select class="workspace-select" name="roleId" required>
                ${adminRoleOptions(staffChoices)}
              </select>
              <span class="workspace-muted">Role choices are limited by your current access.</span>
            </label>
            <label class="workspace-label">
              Status <span class="workspace-required">Required</span>
              <select class="workspace-select" name="status" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div class="workspace-access-preview" data-admin-role-copy aria-live="polite"></div>
            <label class="workspace-label" data-access-group="site">
              Site / school
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
              Assigned students
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
        ${renderAdminPersonSaveFooter("staff", options)}
      </form>
    </section>
  `;
}

function renderPersonNameEmailFields() {
  return `
    <div class="workspace-form-section">
      <p class="workspace-kicker">Person</p>
      <div class="workspace-form-grid">
        <label class="workspace-label">
          First name <span class="workspace-required">Required</span>
          <input class="workspace-input" name="firstName" autocomplete="given-name" maxlength="60" required>
        </label>
        <label class="workspace-label">
          Last name <span class="workspace-required">Required</span>
          <input class="workspace-input" name="lastName" autocomplete="family-name" maxlength="60" required>
        </label>
        <label class="workspace-label workspace-label-wide">
          Email or login identifier <span class="workspace-required">Required</span>
          <input class="workspace-input" name="email" type="email" autocomplete="off" required>
          <span class="workspace-muted">Use the school-approved email or username for this account.</span>
        </label>
      </div>
    </div>
  `;
}

function renderAdminPersonSaveFooter(kind = "student", options = {}) {
  return `
    <div class="workspace-form-grid">
      <label class="workspace-label workspace-label-wide">
        Admin note <span class="workspace-required">Required</span>
        <textarea class="workspace-textarea" name="adminNote" maxlength="500" required></textarea>
        <span class="workspace-muted">Friendly note for future admins: why this account is being created and who approved it.</span>
      </label>
    </div>
    ${renderDestructiveActionConfirmation({
      id: `${kind}-create-delivery`,
      name: "deliveryConfirmation",
      label: "I reviewed the role, school access, and setup-password delivery process before creating this account.",
      detail: "Local setup passwords appear once and must use the school-approved handoff process.",
    })}
    <div class="workspace-form-actions">
      <button class="workspace-button workspace-button-primary" type="submit">${kind === "student" ? "Create student" : "Create staff member"}</button>
      <button class="workspace-button workspace-button-secondary" type="button" data-people-view-target="${kind === "student" ? "manage-students" : "manage-staff"}">${kind === "student" ? "Return to Manage Students" : "Return to Manage Staff"}</button>
    </div>
  `;
}

function renderAssignmentsPeopleScreen() {
  return `
    <section class="workspace-people-screen" data-people-screen="assignments">
      <div class="workspace-people-screen-head">
        <div>
          <p class="workspace-kicker">Assignments</p>
          <h3>Access assignments</h3>
          <p class="workspace-muted">Use the forms below to change who can help at this school. You will only see changes you can make.</p>
        </div>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-users-access-focus="assignment-forms">Open forms</button>
      </div>
    </section>
  `;
}

function optionalUserOptions(users = [], emptyLabel = "No selection") {
  return [`<option value="">${escapeHtml(emptyLabel)}</option>`, userOptions(users)].join("");
}

function renderCsvImportScreen(kind = "students", options = {}) {
  const safeKind = kind === "staff" ? "staff" : "students";
  const title = safeKind === "staff" ? "Import Staff" : "Import Students";
  const state = adminCsvImportState[safeKind] || defaultAdminCsvImportKindState(safeKind);
  const template = csvTemplateForKind(safeKind);
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(template)}`;
  return `
    <section class="workspace-people-screen" data-people-screen="import-${escapeHtml(safeKind)}" data-csv-import-kind="${escapeHtml(safeKind)}">
      <div class="workspace-people-screen-head">
        <div>
          <p class="workspace-kicker">CSV import</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="workspace-muted">${escapeHtml(safeKind === "staff"
            ? "Upload staff rows, preview validation, then import only valid accounts."
            : "Upload student rows, preview validation, then import only valid student accounts.")}</p>
        </div>
        <a class="workspace-button workspace-button-secondary" href="${templateHref}" download="${escapeHtml(safeKind === "staff" ? "capstone-staff-template.csv" : "capstone-students-template.csv")}" data-csv-template-download="${escapeHtml(safeKind)}">Download CSV template</a>
      </div>
      ${renderCsvImportStepper(safeKind)}
      ${renderCsvTemplateDocumentation(safeKind)}
      ${renderCsvImportReadinessPanel(safeKind, state)}
      ${state.previewed ? renderCsvPreviewNextAction(safeKind, state, state.summary || defaultAdminCsvSummary()) : ""}
      <form class="workspace-form workspace-csv-import-form" data-csv-import-form="true" data-csv-import-kind="${escapeHtml(safeKind)}">
        <div class="workspace-form-section">
          <p class="workspace-kicker">1. Upload CSV</p>
          <label class="workspace-csv-dropzone">
            <span>${escapeHtml(state.fileName || "Choose a .csv file")}</span>
            <input class="workspace-input" type="file" name="csvFile" accept=".csv,text/csv" data-csv-file-input="${escapeHtml(safeKind)}">
          </label>
          <label class="workspace-label workspace-label-wide">
            Paste CSV text for preview
            <textarea class="workspace-textarea" name="csvText" data-csv-text-input="${escapeHtml(safeKind)}" aria-label="${escapeHtml(`${title} CSV text`)}">${escapeHtml(state.csvText || "")}</textarea>
          </label>
        </div>
        <div class="workspace-form-section">
          <p class="workspace-kicker">2. Validation note</p>
          <label class="workspace-label workspace-label-wide">
            Admin note <span class="workspace-required">Required before final import</span>
            <textarea class="workspace-textarea" name="adminNote" maxlength="500"></textarea>
          </label>
          <p class="workspace-muted">Bad rows are never imported. Existing emails are shown as skipped before final import.</p>
        </div>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit" data-csv-preview-action="${escapeHtml(safeKind)}">Preview CSV</button>
          <button class="workspace-button workspace-button-secondary" type="button" data-admin-csv-confirm="${escapeHtml(safeKind)}" ${state.validRows.length ? "" : "disabled"}>Confirm import</button>
        </div>
      </form>
      ${renderCsvImportPreview(safeKind, state)}
    </section>
  `;
}

function renderCsvImportReadinessPanel(kind = "students", state = defaultAdminCsvImportKindState(kind)) {
  const safeKind = kind === "staff" ? "staff" : "students";
  const errors = Array.isArray(state.errors) ? state.errors : [];
  const summary = state.summary || defaultAdminCsvSummary();
  const status = !state.previewed ? "waiting" : errors.length ? "errors" : "ready";
  const steps = [
    ["Template", safeKind === "staff" ? "Use the staff template columns and role values." : "Use the student template columns before adding mentor or viewer emails."],
    ["Preview", errors.length ? `${errors.length} row ${pluralize(errors.length, "error")} must be fixed.` : state.previewed ? `${safeNumber(summary.validRows)} valid row${safeNumber(summary.validRows) === 1 ? "" : "s"} in the latest preview.` : "Preview has not run in this browser session."],
    ["Confirm", status === "ready" ? "Confirm imports only valid previewed rows." : "Do not confirm until errors are fixed and preview is clean."],
  ];
  return `
    <section class="workspace-csv-import-readiness ${escapeHtml(status)}" data-csv-import-readiness="${escapeHtml(safeKind)}" data-csv-import-readiness-state="${escapeHtml(status)}" aria-label="${escapeHtml(`${safeKind} import readiness`)}">
      <div>
        <p class="workspace-kicker">Import readiness</p>
        <strong>${escapeHtml(status === "waiting" ? "Preview required before import" : status === "errors" ? "Fix preview errors before import" : "Preview is ready for confirmation")}</strong>
        <p>${escapeHtml(status === "ready"
          ? "Only valid previewed rows will be saved."
          : "Preview protects the roster and accounts before any row is saved.")}</p>
      </div>
      <div class="workspace-csv-import-readiness-grid">
        ${steps.map(([label, detail]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCsvImportStepper(kind = "students") {
  const people = kind === "staff" ? "staff accounts" : "student accounts";
  const assignmentNote = kind === "staff"
    ? "Staff assignments must match an existing school, program, or assigned student in this view."
    : "Mentor and Viewer emails must already exist in the current roster before automatic assignment.";
  return `
    <section class="workspace-csv-import-stepper" data-csv-import-stepper="${escapeHtml(kind)}" aria-label="${escapeHtml(`Before you import ${kind}`)}">
      <div>
        <p class="workspace-kicker">Before you import</p>
        <strong>Preview protects the roster before anything is saved.</strong>
      </div>
      <ol>
        <li>
          <span>1</span>
          <div>
            <strong>Download the template</strong>
            <p>Use the required columns for ${escapeHtml(people)}.</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Preview validation</strong>
            <p>Fix errors, skipped rows, and access mismatches before final import.</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Confirm only valid rows</strong>
            <p>${escapeHtml(assignmentNote)}</p>
          </div>
        </li>
      </ol>
    </section>
  `;
}

function renderCsvTemplateDocumentation(kind = "students") {
  const contract = csvTemplateContractForKind(kind);
  return `
    <details class="workspace-csv-template-doc workspace-csv-help-disclosure" data-csv-template-doc="${escapeHtml(kind)}" data-csv-help-disclosure="${escapeHtml(kind)}">
      <summary>Template columns and example</summary>
      <div class="workspace-csv-help-body">
        <strong>Template columns</strong>
      ${renderCsvTemplateColumnGroups(kind)}
      ${renderCsvTemplateExample(kind)}
      <p class="workspace-muted">${escapeHtml(contract.scopeNote)} ${escapeHtml(contract.validationNote)}</p>
      </div>
    </details>
  `;
}

function renderCsvImportPreview(kind = "students", state = defaultAdminCsvImportKindState(kind)) {
  if (!state.previewed) {
    return `
      <section class="workspace-csv-preview" data-csv-preview="${escapeHtml(kind)}" data-csv-preview-state="waiting" data-csv-import-empty-state="true">
        <strong>Preview required before import</strong>
        <p class="workspace-muted">Upload or paste a CSV, then preview validation before anything is saved.</p>
        ${renderProblemState({
          reason: "No CSV preview has run in this browser session.",
          owner: "Signed-in admin using the current template",
          nextAction: "Download the template, paste or upload CSV rows, then preview before importing.",
          actions: [
            { label: "Refresh workspace", problemAction: "refresh" },
            availableSectionIdsForAnyMode().has("adminImports") ? { label: "Open imports", section: "adminImports" } : null,
          ].filter(Boolean),
        })}
      </section>
    `;
  }
  const summary = state.summary || defaultAdminCsvSummary();
  return `
    <section class="workspace-csv-preview" data-csv-preview="${escapeHtml(kind)}" data-csv-preview-state="${state.errors.length ? "errors" : "ready"}" aria-live="polite">
      <div class="workspace-csv-summary-grid">
        ${renderCsvSummaryMetric("Rows detected", summary.rowsDetected)}
        ${renderCsvSummaryMetric("Valid rows", summary.validRows)}
        ${renderCsvSummaryMetric("Rows with errors", summary.rowsWithErrors)}
        ${renderCsvSummaryMetric("New records", summary.newRecords)}
        ${renderCsvSummaryMetric("Existing records skipped", summary.existingRecords)}
        ${kind === "students" ? renderCsvSummaryMetric("Mentor assignments", summary.projectMentorsCreated) : ""}
        ${kind === "students" ? renderCsvSummaryMetric("Project Teachers", summary.projectProgramTeachersCreated) : ""}
        ${kind === "students" ? renderCsvSummaryMetric("Viewer assignments", summary.viewerAssignmentsCreated) : ""}
      </div>
      ${state.errors.length ? `
        <article class="workspace-empty-state-card" data-csv-import-error-guide="true">
          <strong>CSV preview found rows to fix.</strong>
          <p>No account or roster changes are saved from rows with errors. Fix the listed rows, preview again, and import only after valid rows are confirmed.</p>
          ${renderProblemState({
            reason: "Preview validation found fields, access, or template columns that cannot be imported safely.",
            owner: "Signed-in admin using the current template",
            nextAction: "Fix the row errors shown below, then run preview again before importing.",
            actions: [
              { label: "Refresh workspace", problemAction: "refresh" },
              availableSectionIdsForAnyMode().has("adminImports") ? { label: "Open imports", section: "adminImports" } : null,
            ].filter(Boolean),
          })}
        </article>
        <div class="workspace-list" data-csv-row-errors="true">
          ${state.errors.map((error) => `
            <article class="workspace-mini-row" data-csv-row-error="${escapeHtml(String(error.rowNumber || ""))}">
              <span>Row ${escapeHtml(String(error.rowNumber || "?"))}</span>
              <small>${escapeHtml(error.message || "Fix this row before importing.")}</small>
            </article>
          `).join("")}
        </div>
      ` : `
        <article class="workspace-empty-state-card" data-csv-ready="true">
          <strong>Ready for final confirmation.</strong>
          <p>${escapeHtml(kind === "students"
            ? "Only valid new student rows will be sent. Previewed mentor/viewer assignments are created during import."
            : "Only valid new staff rows will be saved.")}</p>
        </article>
      `}
    </section>
  `;
}

function renderCsvPreviewNextAction(kind = "students", state = defaultAdminCsvImportKindState(kind), summary = defaultAdminCsvSummary()) {
  const safeKind = kind === "staff" ? "staff" : "students";
  const errors = Array.isArray(state.errors) ? state.errors : [];
  const validRows = Array.isArray(state.validRows) ? state.validRows : [];
  const firstError = errors[0] || null;
  const firstValid = validRows[0] || null;
  const newRecords = safeNumber(summary.newRecords);
  const existingRecords = safeNumber(summary.existingRecords);
  const assignmentText = safeKind === "students"
    ? `${safeNumber(summary.mentorAssignmentsCreated)} mentor and ${safeNumber(summary.viewerAssignmentsCreated)} viewer assignment${safeNumber(summary.viewerAssignmentsCreated) === 1 ? "" : "s"} previewed. ${safeNumber(summary.projectProgramTeachersCreated)} Program Teacher project assignment${safeNumber(summary.projectProgramTeachersCreated) === 1 ? "" : "s"} previewed.`
    : `${newRecords} staff account${newRecords === 1 ? "" : "s"} ready to save.`;
  if (firstError) {
    return `
      <section class="workspace-csv-preview-next warning" data-csv-preview-next-action="${escapeHtml(safeKind)}" data-csv-preview-next-state="fix-errors" data-csv-preview-first-row="${escapeHtml(String(firstError.rowNumber || ""))}">
        <article>
          <span>Fix this row first</span>
          <strong>Row ${escapeHtml(String(firstError.rowNumber || "?"))}</strong>
          <p>${escapeHtml(firstError.message || "Fix this row before importing.")}</p>
        </article>
        <article>
          <span>Then preview again</span>
          <strong>Import stays blocked</strong>
          <p>Correct the CSV, run preview again, and confirm only after the error count is zero.</p>
        </article>
      </section>
    `;
  }
  const firstName = firstValid?.user?.fullName || firstValid?.user?.email || "";
  const noNewRows = newRecords === 0;
  return `
    <section class="workspace-csv-preview-next ${noNewRows ? "quiet" : "ready"}" data-csv-preview-next-action="${escapeHtml(safeKind)}" data-csv-preview-next-state="${escapeHtml(noNewRows ? "no-new-rows" : "confirm")}" data-csv-preview-new-records="${escapeHtml(String(newRecords))}">
      <article>
        <span>${escapeHtml(noNewRows ? "Nothing new to save" : "Confirm this import")}</span>
        <strong>${escapeHtml(noNewRows ? "All rows already exist or were skipped" : `${newRecords} new ${safeKind === "staff" ? "staff" : "student"} row${newRecords === 1 ? "" : "s"}`)}</strong>
        <p>${escapeHtml(noNewRows ? `${existingRecords} existing record${existingRecords === 1 ? "" : "s"} skipped in this preview.` : "Add the admin note, then save the valid previewed rows.")}</p>
      </article>
      <article>
        <span>${escapeHtml(safeKind === "students" ? "Coverage preview" : "First saved row")}</span>
        <strong>${escapeHtml(safeKind === "students" ? assignmentText : firstName || "Staff row ready")}</strong>
        <p>${escapeHtml(safeKind === "students" ? "Adult links are saved only for valid rows. Missing adults stay clearly marked for follow-up." : "Review the role and school access before confirming.")}</p>
      </article>
    </section>
  `;
}

function renderCsvSummaryMetric(label, value) {
  return `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(safeNumber(value)))}</strong>
    </article>
  `;
}

function csvTemplateForKind(kind = "students") {
  const contract = csvTemplateContractForKind(kind);
  return [
    csvTemplateColumnsForKind(kind).join(","),
    contract.example.join(","),
  ].join("\n");
}

function csvTemplateContractForKind(kind = "students") {
  const safeKind = kind === "staff" ? "staff" : "students";
  return {
    students: {
      kind: "students",
      title: "Student CSV template",
      detail: "Creates local student accounts with school/program placement and optional roster coverage fields.",
      required: ["first_name", "last_name", "email", "site", "program"],
      optional: ["cohort", "graduation_year", "status", "mentor_email", "program_teacher_email", "viewer_email"],
      example: ["Alex", "Student", "alex.student@senior-capstone.test", "Desert Valley High School", "Information Technology", "Class of 2026", "2026", "active", "maya.rivera@senior-capstone.test", "chen.teacher@senior-capstone.test", "viewer.one@senior-capstone.test"],
      scopeNote: "Student imports stay inside the selected school. Adult emails must already be visible staff accounts, and the Program Teacher must match the student's program.",
      validationNote: "Unsupported columns are blocked so data is not silently ignored.",
    },
    staff: {
      kind: "staff",
      title: "Staff CSV template",
      detail: "Creates local staff, mentor, viewer, Program Teacher, School Admin, or Site Admin accounts.",
      required: ["first_name", "last_name", "email", "role"],
      optional: ["site", "program", "assigned_student_emails", "status"],
      example: ["Maya", "Rivera", "maya.rivera@senior-capstone.test", "mentor", "Desert Valley High School", "", "alex.student@senior-capstone.test", "active"],
      scopeNote: "Staff imports cannot create Global Admin or student rows; roles must be allowed for the signed-in admin.",
      validationNote: "Site Admin and Administration need a site, Program Teacher needs a program, and Mentor or Viewer needs a site or assigned students.",
    },
  }[safeKind];
}

function csvTemplateColumnsForKind(kind = "students") {
  const contract = csvTemplateContractForKind(kind);
  return [...contract.required, ...contract.optional];
}

function renderCsvTemplateColumnGroups(kind = "students") {
  const contract = csvTemplateContractForKind(kind);
  const groups = [
    ["Required", contract.required, true],
    ["Optional", contract.optional, false],
  ];
  return `
    <div class="workspace-csv-template-columns" data-csv-template-columns="${escapeHtml(contract.kind)}" aria-label="${escapeHtml(`${contract.title} columns`)}">
      ${groups.map(([label, columns, required]) => `
        <div class="workspace-csv-template-column-group" data-csv-template-column-group="${escapeHtml(String(label).toLowerCase())}">
          <span>${escapeHtml(label)}</span>
          <div class="workspace-chip-row">
            ${columns.map((column) => `<code data-csv-template-column="${escapeHtml(column)}" data-csv-template-column-required="${escapeHtml(String(required))}">${escapeHtml(column)}</code>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCsvTemplateExample(kind = "students") {
  const contract = csvTemplateContractForKind(kind);
  return `
    <div class="workspace-csv-template-example" data-csv-template-example="${escapeHtml(contract.kind)}" aria-label="${escapeHtml(`${contract.title} example row`)}">
      <span>Example row</span>
      <code>${escapeHtml(contract.example.join(","))}</code>
    </div>
  `;
}

function renderUsersAccessActionMap(roleChoices = [], options = {}) {
  const accessBody = unwrap(currentData.accessAssignments) || {};
  const roleAssignmentsBody = unwrap(currentData.roleAssignments) || {};
  const users = accessBody.users || {};
  const assignments = accessBody.assignments || {};
  const permissions = accessBody.permissions || {};
  const scope = accessBody.scope || currentSiteWorkspaceContext() || {};
  const accounts = siteAccountRows(users);
  const activeAssignments = usersAccessActiveAssignmentCount(assignments);
  const historyCount = Array.isArray(accessBody.history) ? accessBody.history.length : 0;
  const roleAssignmentCount = Array.isArray(roleAssignmentsBody.assignments) ? roleAssignmentsBody.assignments.length : 0;
  const assignmentFormCount = usersAccessAssignmentFormCount(permissions);
  const removableCount = accounts.filter((account) => account.userId !== currentUser?.id && canManageSiteAccountRow(account)).length;
  const scopeLabelText = `${scope.siteName || "Current school"} / ${scope.schoolYear || "school year"}`;
  const cards = [
    {
      id: "scope",
      tone: scope.siteName ? "ready" : "warning",
      owner: "School",
      count: scope.siteName ? "1 school" : "Choose",
      title: "Confirm the current school",
      detail: "Create, assign, or remove access only after the school context matches the person.",
      source: scopeLabelText,
      section: "siteDashboard",
      actionLabel: "Review school",
    },
    {
      id: "role",
      tone: "role",
      owner: "Smallest role",
      count: `${safeNumber(roleChoices.length)} ${pluralize(roleChoices.length, "role")}`,
      title: "Pick the smallest role",
      detail: "Choose the lowest role that lets the person do the job; avoid broad access when a school or program role works.",
      source: options.canCreateGlobal ? "Global role choices" : "School role choices",
      focus: "create",
      actionLabel: "Pick role",
    },
    {
      id: "current-access",
      tone: activeAssignments ? "ready" : "warning",
      owner: "Current access",
      count: activeAssignments ? `${activeAssignments} active` : "None",
      title: "Check active access first",
      detail: "Confirm mentor, viewer, Program Teacher, and school admin rows before saving another change.",
      source: "Current access summary",
      focus: "current-access",
      actionLabel: "Review access",
    },
    {
      id: "create",
      tone: options.localAccountsOnly ? "handoff" : "role",
      owner: "Account setup",
      count: options.localAccountsOnly ? "Local" : "Local / SSO",
      title: "Create with handoff ready",
      detail: "Use approved setup-password delivery and write the admin note before account creation.",
      source: "Account creation form",
      focus: "preflight",
      actionLabel: "Open preflight",
    },
    {
      id: "assign",
      tone: assignmentFormCount ? "role" : "quiet",
      owner: "School grants",
      count: assignmentFormCount ? `${assignmentFormCount} forms` : "No forms",
      title: "Assign one area at a time",
      detail: "Use the matching assignment form for mentor, viewer, Program Teacher, School Admin, or Site Admin access.",
      source: "Assignment forms",
      focus: "assignment-forms",
      actionLabel: "Open forms",
    },
    {
      id: "remove",
      tone: removableCount ? "danger" : "quiet",
      owner: "Removal safety",
      count: removableCount ? `${removableCount} removable` : "Protected",
      title: "Read removal impact first",
      detail: "Removal changes school access only; it does not delete student work, files, programs, or audit history.",
      source: "Removal warning",
      focus: "removal",
      actionLabel: "Review warning",
    },
    {
      id: "history",
      tone: historyCount ? "history" : "quiet",
      owner: "Access history",
      count: `${historyCount} ${pluralize(historyCount, "change")}`,
      title: "Review recent changes",
      detail: "Use recent access changes to avoid repeating or undoing another admin's work.",
      source: "Recorded changes",
      disclosureScope: "usersAccess",
      disclosureId: "history",
      actionLabel: "Open changes",
    },
    {
      id: "role-history",
      tone: roleAssignmentCount ? "history" : "quiet",
      owner: "Role history",
      count: `${roleAssignmentCount} ${pluralize(roleAssignmentCount, "grant")}`,
      title: "Review role grants",
      detail: "Check recent global, school, program, and cohort grants before creating another account.",
      source: "Recent role assignments",
      disclosureScope: "usersAccess",
      disclosureId: "roleAssignments",
      actionLabel: "Open grants",
    },
  ];

  return `
    <section class="workspace-users-access-action-map" data-users-access-action-map="true" aria-label="Users and access setup steps">
      <div class="workspace-users-access-action-map-head">
        <div>
          <p class="workspace-kicker">Access setup steps</p>
          <h2>Do one safe access step first</h2>
          <p>Check the school, choose the smallest role, then use the exact form or history panel.</p>
        </div>
        <span class="workspace-chip">${escapeHtml(scopeLabelText)}</span>
      </div>
      <div class="workspace-users-access-action-map-grid">
        ${cards.map((card) => renderUsersAccessActionMapCard(card)).join("")}
      </div>
    </section>
  `;
}

function renderUsersAccessActionMapCard(card = {}) {
  return `
    <article class="workspace-users-access-action-map-card ${escapeHtml(card.tone || "quiet")}" data-users-access-action-map-card="${escapeHtml(card.id || "action")}" data-users-access-action-team="${escapeHtml(card.owner || "Account staff")}">
      <div>
        <div class="workspace-users-access-action-map-meta">
          <span>${escapeHtml(card.owner || "Account staff")}</span>
          <b>${escapeHtml(card.count || "0")}</b>
        </div>
        <strong>${escapeHtml(card.title || "Review this access step")}</strong>
        <p>${escapeHtml(card.detail || "Use the matching source section before saving access changes.")}</p>
        ${card.source ? `<small>${escapeHtml(card.source)}</small>` : ""}
      </div>
      ${renderUsersAccessActionMapButton(card)}
    </article>
  `;
}

function renderUsersAccessActionMapButton(card = {}) {
  if (card.section && availableSectionIdsForAnyMode().has(card.section)) {
    return `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(card.section)}">${escapeHtml(card.actionLabel || "Open")}</button>`;
  }
  if (card.focus) {
    return `<button class="workspace-link-button workspace-link-button-small" type="button" data-users-access-focus="${escapeHtml(card.focus)}">${escapeHtml(card.actionLabel || "Open")}</button>`;
  }
  if (card.disclosureScope && card.disclosureId) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-workspace-disclosure-action="toggle" data-workspace-disclosure-scope="${escapeHtml(card.disclosureScope)}" data-workspace-disclosure-id="${escapeHtml(card.disclosureId)}">
        ${escapeHtml(card.actionLabel || "Open")}
      </button>
    `;
  }
  return `<span class="workspace-summary-badge">Summary only</span>`;
}

function usersAccessActiveAssignmentCount(assignments = {}) {
  return [
    assignments.mentorStudent,
    assignments.viewerStudent,
    assignments.programTeacherProgram,
    assignments.administrationSite,
    assignments.siteAdminSite,
  ].reduce((total, rows) => total + (Array.isArray(rows) ? rows.length : 0), 0);
}

function usersAccessAssignmentFormCount(permissions = {}) {
  return [
    permissions.canAssignMentors,
    permissions.canAssignViewers,
    permissions.canAssignProgramTeachers,
    permissions.canAssignAdministration,
    permissions.canAssignSiteAdmins,
  ].filter(Boolean).length;
}

function renderAdminImportPreflight(roleChoices = [], options = {}) {
  const roleCount = Array.isArray(roleChoices) ? roleChoices.length : 0;
  const checks = [
    ["Role choice", `${roleCount} role ${pluralize(roleCount, "option")} available to this account.`],
    ["School access", options.canCreateGlobal ? "Global Admin can create site or global access; use the smallest access that works." : "This import stays within assigned school or program access."],
    ["Sign-in", options.localAccountsOnly ? "Email and password; one-time setup codes are shown once." : "Use school sign-in only when the school is ready."],
    ["Audit note", "Write why this account is needed before creating it."],
  ];
  return `
    <section class="workspace-admin-import-preflight" data-admin-import-preflight="true">
      <div>
        <strong>Before creating an account</strong>
        <p>Check access first, then create the account. This helps prevent over-broad access and one-time password mistakes.</p>
      </div>
      <div>
        ${checks.map(([label, detail]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
    ${renderAccountLifecyclePolicy(options)}
  `;
}

function renderAccountLifecyclePolicy(options = {}) {
  const rows = [
    ["Invite email", "Not sent from this app yet. Give setup information only through an approved school process."],
    ["Setup code", options.localAccountsOnly ? "Shown once after account creation; it expires in 30 minutes and lets the person make their own password." : "Only email-and-password accounts receive a one-time setup code."],
    ["School sign-in", options.localAccountsOnly ? "Not used in this workspace." : "Use only when the school is ready."],
    ["Real local accounts", "Creation can be blocked by environment policy until credential delivery is approved."],
  ];
  return `
    <section class="workspace-account-lifecycle-policy" data-account-lifecycle-policy="true">
      <strong>Account lifecycle policy</strong>
      <div class="workspace-account-lifecycle-grid">
        ${rows.map(([label, detail]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminImportResult() {
  const users = Array.isArray(lastAdminImportResult?.users) ? lastAdminImportResult.users : [];
  if (!users.length) return "";

  return `
    <section class="workspace-card" data-admin-import-result="one-time-setup-codes">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Account created</p>
          <h2>Account created</h2>
        </div>
        <span class="workspace-chip">${users.length} account${users.length === 1 ? "" : "s"}</span>
      </div>
      ${renderAdminImportResultSummary(lastAdminImportResult?.summary)}
      <div class="workspace-list">
        ${users.map((user) => `
          <article class="workspace-row">
            <div>
              <strong>${escapeHtml(user.displayName || user.email || "Created account")}</strong>
              <p>${escapeHtml(user.email || "")}</p>
              <p class="workspace-muted">${escapeHtml(roleLabel(user.role?.roleId || "role"))} / ${escapeHtml(user.access || scopeLabel(user.role))}</p>
              ${user.setupCode ? `
                <span class="workspace-secret-output" data-admin-import-credential="setup-code">${escapeHtml(user.setupCode || "")}</span>
                <p class="workspace-muted">This code is shown once and expires in ${escapeHtml(String(user.setupCodeExpiresInMinutes || 30))} minutes. On the sign-in page, the person chooses “I have a setup code” and makes a password.</p>
                <button class="workspace-button workspace-button-secondary" type="button" data-copy-secret="${escapeHtml(user.setupCode || "")}">Copy setup code</button>
              ` : `<p class="workspace-muted">${escapeHtml(user.status === "disabled" ? "Inactive account. Activate it only after the school is ready." : "School sign-in account. The user signs in through their school.")}</p>`}
              ${Array.isArray(user.nextSteps) && user.nextSteps.length ? `<p class="workspace-muted">${escapeHtml(user.nextSteps.join(" "))}</p>` : ""}
              ${renderAdminImportNextActions(user)}
            </div>
            ${statusPill(user.status || "pending_reset")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminImportResultSummary(summary = null) {
  if (!summary) return "";
  return `
    <div class="workspace-csv-summary-grid" data-admin-import-final-summary="true">
      ${renderCsvSummaryMetric("Students created", summary.studentsCreated)}
      ${renderCsvSummaryMetric("Students skipped", summary.studentsSkipped)}
      ${renderCsvSummaryMetric("Invalid rows blocked", summary.invalidRowsBlocked)}
      ${renderCsvSummaryMetric("Mentor assignments created", summary.mentorAssignmentsCreated)}
      ${renderCsvSummaryMetric("Mentor assignments skipped", summary.mentorAssignmentsSkipped)}
      ${renderCsvSummaryMetric("Project Mentors created", summary.projectMentorsCreated)}
      ${renderCsvSummaryMetric("Project Teachers created", summary.projectProgramTeachersCreated)}
      ${renderCsvSummaryMetric("Viewer assignments created", summary.viewerAssignmentsCreated)}
      ${renderCsvSummaryMetric("Viewer assignments skipped", summary.viewerAssignmentsSkipped)}
    </div>
  `;
}

function renderAdminImportNextActions(user = {}) {
  const roleId = user.role?.roleId || "";
  const isStudent = roleId === "student";
  const actions = isStudent
    ? [
      ["Add another student", "add-student"],
      ["Return to Manage Students", "manage-students"],
    ]
    : [
      ["Add another staff member", "add-staff"],
      ["Manage assignments", "assignments"],
      ["Return to Manage Staff", "manage-staff"],
    ];
  return `
    <div class="workspace-form-actions workspace-import-next-actions" data-admin-import-next-actions="${escapeHtml(isStudent ? "student" : "staff")}">
      ${actions.map(([label, view]) => `<button class="workspace-link-button workspace-link-button-small" type="button" data-people-view-target="${escapeHtml(view)}">${escapeHtml(label)}</button>`).join("")}
      ${isStudent && availableSectionIdsForAnyMode().has("students") ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="students">View student</button>` : ""}
      ${isStudent ? renderViewAsStudentAction(user.id, user.displayName || user.email, { sourceSection: "adminUsers" }) : ""}
    </div>
  `;
}

function renderAdminRoleAssignmentsPanel() {
  const result = currentData.roleAssignments;
  if (!result || result?.status === 403) return "";
  const body = unwrap(result);
  if (!body?.ok) {
    return `
      <section class="workspace-card" data-admin-role-assignments="true">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Global role access</p>
            <h2>Recent role assignments</h2>
          </div>
          <span class="workspace-chip">Global Admin</span>
        </div>
        ${renderApiNotice(result)}
      </section>
    `;
  }

  const assignments = Array.isArray(body.assignments) ? body.assignments : [];
  return renderWorkspaceDisclosurePanel({
    scope: "usersAccess",
    id: "roleAssignments",
    kicker: "Global role access",
    title: "Recent role assignments",
    summary: "Review recent platform, school, program, and cohort grants before changing user access.",
    openLabel: "Open recent role assignments",
    closeLabel: "Hide recent role assignments",
    dataAttrs: 'data-admin-role-assignments="true"',
    bodyHtml: renderAdminRoleAssignmentsBody(assignments),
  });
}

function renderAdminRoleAssignmentsBody(assignments = []) {
  if (!assignments.length) {
    return `<div class="workspace-empty">No recent role assignments are available right now.</div>`;
  }
  return `
    <div class="workspace-list">
      ${assignments.map((assignment) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(assignment.userName || assignment.userId || "User")}</strong>
            <p>${escapeHtml(roleLabel(assignment.roleId || "role"))} / ${escapeHtml(adminRoleAssignmentScopeText(assignment))}</p>
            ${assignment.assignedByName ? `<p class="workspace-muted">Assigned by ${escapeHtml(assignment.assignedByName)}</p>` : ""}
            <p class="workspace-muted">Assigned ${escapeHtml(formatDate(assignment.assignedAt))}</p>
          </div>
          <div class="workspace-row-actions">
            ${renderAdminRoleAssignmentAction(assignment)}
            ${statusPill(assignment.roleId || assignment.scopeType || "configured")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAdminRoleAssignmentAction(assignment = {}) {
  const scopeType = String(assignment.scopeType || "global").toLowerCase();
  if (scopeType === "site") {
    const siteId = String(assignment.scopeId || "").trim();
    if (!siteId) return "";
    const accessibleSites = accessibleSitesForWorkspace();
    if (!accessibleSites.some((site) => site.siteId === siteId)) return "";
    const currentSiteId = selectedSiteQueryValue() || currentSiteWorkspaceContext().siteId || "";
    if (currentSiteId === siteId) {
      return `<span class="workspace-chip">Current school</span>`;
    }
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(siteId)}">
        Open school access
      </button>
    `;
  }
  if (scopeType !== "program" && scopeType !== "cohort") return "";
  const mappedSiteIds = Array.isArray(assignment.scopeSiteIds)
    ? assignment.scopeSiteIds.map((siteId) => cleanDirectoryFilter(siteId)).filter(Boolean)
    : [];
  if (!mappedSiteIds.length) return "";
  const accessibleSites = accessibleSitesForWorkspace().filter((site) => mappedSiteIds.includes(site.siteId));
  if (!accessibleSites.length) return "";
  if (scopeType === "program") {
    const programId = cleanDirectoryFilter(assignment.scopeId || "");
    if (!programId) return "";
    return renderRoleAssignmentStudentActions(accessibleSites, {
      action: "open-program-students",
      actionLabel: "Open program students",
      scopeIdAttr: "role-assignment-program-id",
      scopeIdValue: programId,
    });
  }
  if (scopeType !== "cohort") return "";
  const cohortId = cleanDirectoryFilter(assignment.scopeId || "");
  if (!cohortId) return "";
  return renderRoleAssignmentStudentActions(accessibleSites, {
    action: "open-cohort-students",
    actionLabel: "Open cohort students",
    scopeIdAttr: "role-assignment-cohort-id",
    scopeIdValue: cohortId,
  });
}

function renderRoleAssignmentStudentActions(accessibleSites = [], {
  action = "",
  actionLabel = "Open students",
  scopeIdAttr = "",
  scopeIdValue = "",
} = {}) {
  const sites = Array.isArray(accessibleSites) ? accessibleSites.filter((site) => site?.siteId) : [];
  if (!sites.length || !action || !scopeIdAttr || !scopeIdValue) return "";
  if (sites.length === 1) {
    return renderRoleAssignmentStudentActionButton(sites[0], {
      action,
      label: actionLabel,
      scopeIdAttr,
      scopeIdValue,
    });
  }
  return `
    <div class="workspace-chip-row">
      <span class="workspace-summary-badge">Choose school</span>
      ${sites.map((site) => renderRoleAssignmentStudentActionButton(site, {
        action,
        label: site.siteName || site.siteId || "School",
        scopeIdAttr,
        scopeIdValue,
      })).join("")}
    </div>
  `;
}

function renderRoleAssignmentStudentActionButton(site = {}, {
  action = "",
  label = "Open",
  scopeIdAttr = "",
  scopeIdValue = "",
} = {}) {
  const siteId = cleanDirectoryFilter(site?.siteId || "");
  if (!siteId || !action || !scopeIdAttr || !scopeIdValue) return "";
  return `
    <button
      class="workspace-link-button workspace-link-button-small"
      type="button"
      data-role-assignment-action="${escapeHtml(action)}"
      data-role-assignment-site-id="${escapeHtml(siteId)}"
      data-${scopeIdAttr}="${escapeHtml(scopeIdValue)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function adminRoleAssignmentScopeText(assignment = {}) {
  const scopeType = String(assignment.scopeType || "global").toLowerCase();
  const scopeId = String(assignment.scopeId || "").trim();
  const scopeName = String(assignment.scopeName || "").trim();
  if (scopeType === "global") {
    return "All schools";
  }
  if (scopeType === "site" && scopeName) {
    return `Site access / ${scopeName}`;
  }
  if (scopeType === "program" && scopeName) {
    return `Program access / ${scopeName}`;
  }
  if (scopeType === "cohort" && scopeName) {
    return `Cohort access / ${scopeName}`;
  }

  const accessAssignments = unwrap(currentData.accessAssignments);
  const scope = accessAssignments?.scope || {};
  const programs = Array.isArray(accessAssignments?.programs) ? accessAssignments.programs : [];
  if (scopeType === "site") {
    if (scopeId && scopeId === scope.siteId && scope.siteName) {
      return `Site access / ${scope.siteName}`;
    }
    return `Site access / ${statusText(scopeId || "current_site")}`;
  }
  if (scopeType === "program") {
    const match = programs.find((program) => String(program?.programId || program?.id || "").trim() === scopeId);
    return `Program access / ${cleanDemoSeedDisplay(match?.programName || match?.name, statusText(scopeId || "current_program"))}`;
  }
  if (scopeType === "cohort") {
    return `Cohort access / ${statusText(scopeId || "current_cohort")}`;
  }
  return `${statusText(scopeType)} / ${statusText(scopeId || "current_access")}`;
}

function renderAdminAccessAssignmentPanel() {
  const result = currentData.accessAssignments;
  if (!result) return "";
  if (result.status === 403) return renderPermissionDeniedSection("Assignment management", "site user assignment records");
  if (result.status === 409 && result.body?.selectionRequired) {
    return renderAccessAssignmentSelectionRequired(result.body);
  }
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
          <p class="workspace-kicker">School access management</p>
          <h2>Manage Site Access</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(body.scope?.siteName || "Current site")}</span>
      </div>
      ${renderApiNotice(result)}
      ${renderSiteAccessSafetyNote()}
      ${renderSiteAccessRemovalWarning()}
      ${renderSiteAccountManagementPanel(users, body.scope, permissions)}
      ${renderSiteAccessAssignmentSummary(users, programs, assignments, permissions)}
      ${renderSiteAccessAssignmentHistory(body.history, users, programs)}
      ${renderSiteAccessGuidanceDisclosure()}
      <div class="workspace-assignment-tabs">
        ${permissions.canAssignMentors ? renderAccessAssignmentForm("mentor_student", "Mentors", users.mentors, students, "mentorUserId", "studentId") : ""}
        ${permissions.canAssignViewers ? renderAccessAssignmentForm("viewer_student", "Viewers", users.viewers, students, "viewerUserId", "studentId") : ""}
        ${permissions.canAssignProgramTeachers ? renderProgramTeacherAssignmentForm(users.programTeachers, programs) : ""}
        ${permissions.canAssignAdministration ? renderSiteRoleAssignmentForm("administration_site", "School Admins", users.administration, body.scope?.siteId) : ""}
        ${permissions.canAssignSiteAdmins ? renderSiteRoleAssignmentForm("site_admin_site", "Site Admins", users.siteAdmins, body.scope?.siteId) : ""}
      </div>
    </section>
  `;
}

function renderSiteAccessSafetyNote() {
  return `
    <article class="workspace-empty-state-card workspace-quiet-helper" data-site-access-safety-note="true">
      <strong>Access changes stay limited to this school.</strong>
      <span>Assign grants or restores access. Remove records an access change for review and does not delete accounts, students, programs, or school records.</span>
    </article>
  `;
}

function renderSiteAccessRemovalWarning() {
  return `
    <article class="workspace-site-access-removal-warning" data-site-access-removal-warning="true">
      <strong>Before removing access</strong>
      <ol>
        <li>Confirm this person should no longer use this school workspace.</li>
        <li>Write the reason in the admin note.</li>
        <li>Removing school access does not delete student work, proof, programs, or audit history.</li>
        <li>If the user has no other active school access, sign-in is disabled and active sessions are closed.</li>
      </ol>
    </article>
  `;
}

function renderDestructiveActionConfirmation({
  id = "destructive-confirmation",
  name = "confirmImpact",
  label = "I reviewed the impact of this change before saving.",
  detail = "This confirmation is recorded with the form request and helps prevent accidental changes.",
} = {}) {
  return `
    <section class="workspace-destructive-confirmation" data-destructive-confirmation="${escapeHtml(id)}">
      <label class="workspace-checkbox">
        <input type="checkbox" name="${escapeHtml(name)}" value="true" required>
        <span>${escapeHtml(label)}</span>
      </label>
      <p class="workspace-muted">${escapeHtml(detail)}</p>
    </section>
  `;
}

function renderSiteAccountManagementPanel(users = {}, scope = {}, permissions = {}) {
  const accounts = siteAccountRows(users);
  const canManage = canUseUsersAccess(roleIds(currentUser));
  return `
    <div class="workspace-assignment-summary" data-site-account-management="true" data-site-staff-account-management="true">
      <div>
        <p class="workspace-kicker">Add/remove school accounts</p>
        <h3>Staff, admin, Program Teacher, and student accounts</h3>
        <p class="workspace-muted">Use Reset password when a person cannot sign in. This signs them out and asks them to make a new password. Use Remove account only when the person should lose this school access.</p>
      </div>
      ${accounts.length ? `
        <div class="workspace-list">
          ${accounts.map((account) => renderSiteAccountRow(
            account,
            scope,
            canManage && permissions.canAssignMentors !== false && canManageSiteAccountRow(account),
            permissions.canRequirePasswordReset !== false && canResetSiteAccountRow(account),
          )).join("")}
        </div>
      ` : `
        <article class="workspace-empty-state-card" data-site-account-empty="true">
          <strong>No accounts are assigned to this school yet.</strong>
          <p>Create a local account above as an allowed role. It will appear here with a Remove account control after it is assigned to this school.</p>
        </article>
      `}
    </div>
  `;
}

function siteAccountRows(users = {}) {
  const groups = [
    ["students", "Student", "student"],
    ["mentors", "Mentor", "mentor"],
    ["viewers", "Viewer", "viewer"],
    ["programTeachers", "Program Teacher", "program_teacher"],
    ["administration", "School Admin", "administration"],
    ["siteAdmins", "Site Admin", "site_admin"],
  ];
  const rows = [];
  const seen = new Set();
  for (const [key, label, roleId] of groups) {
    const values = Array.isArray(users[key]) ? users[key] : [];
    for (const user of values) {
      const userId = user.userId || user.studentId || user.id || "";
      if (!userId) continue;
      const existing = rows.find((row) => row.userId === userId);
      if (existing) {
        if (!existing.roleLabels.includes(label)) existing.roleLabels.push(label);
        if (!existing.roleIds.includes(roleId)) existing.roleIds.push(roleId);
        continue;
      }
      if (seen.has(userId)) continue;
      seen.add(userId);
      rows.push({
        ...user,
        userId,
        displayName: user.displayName || user.studentName || user.email || userId,
        email: user.email || "",
        roleLabels: [label],
        roleIds: [roleId],
      });
    }
  }
  return rows.sort((left, right) => left.displayName.localeCompare(right.displayName));
}

function canManageSiteAccountRow(account = {}) {
  const roles = roleIds(currentUser);
  const targetRoles = Array.isArray(account.roleIds) ? account.roleIds : [];
  if (hasGlobalAdminRole(roles)) return true;
  if (!targetRoles.length) return false;
  if (roles.has("program_teacher")) return targetRoles.every((roleId) => ["student", "mentor"].includes(roleId));
  if (canUseStaffAccessManagement(roles)) return targetRoles.every((roleId) => ["student", "mentor", "viewer", "program_teacher"].includes(roleId));
  return false;
}

function canResetSiteAccountRow(account = {}) {
  const roles = roleIds(currentUser);
  const targetRoles = Array.isArray(account.roleIds) ? account.roleIds : [];
  if (!account.userId || account.userId === currentUser?.id || !targetRoles.length) return false;
  if (hasGlobalAdminRole(roles)) return true;
  if (!roles.has("site_admin") && !roles.has("administration")) return false;
  return targetRoles.every((roleId) => ["student", "mentor", "viewer", "program_teacher"].includes(roleId));
}

function renderSiteAccountRow(account = {}, scope = {}, canManage = false, canResetPassword = false) {
  const isSelf = account.userId && currentUser?.id === account.userId;
  const accountStatus = account.status || "active";
  const resetResult = lastAdminPasswordResetResult?.userId === account.userId ? lastAdminPasswordResetResult : null;
  return `
    <article class="workspace-row" data-site-account-row="${escapeHtml(account.userId || "")}">
      <div>
        <strong>${escapeHtml(account.displayName || "Account")}</strong>
        <p>${escapeHtml(account.email || "")}</p>
        <p class="workspace-muted">${escapeHtml((account.roleLabels || []).join(", ") || "Assigned account")}</p>
      </div>
      <div class="workspace-row-actions">
        ${statusPill(accountStatus)}
      </div>
      ${canResetPassword && !isSelf ? `
        ${resetResult ? `
          <section class="workspace-secret-card" data-admin-password-setup-code="true">
            <strong>Copy this code now</strong>
            <p>Share it with ${escapeHtml(resetResult.displayName)} in a private school-approved way. It expires in ${escapeHtml(resetResult.expiresInMinutes)} minutes. They choose “I have a setup code” on the sign-in page.</p>
            <span class="workspace-secret-output">${escapeHtml(resetResult.setupCode)}</span>
            <button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-copy-secret="${escapeHtml(resetResult.setupCode)}">Copy setup code</button>
          </section>
        ` : ""}
        <details class="workspace-account-reset" data-admin-password-reset="${escapeHtml(account.userId || "")}">
          <summary>Reset password</summary>
          <form class="workspace-inline-action-form" data-admin-password-reset-form="true" data-admin-account-id="${escapeHtml(account.userId || "")}">
            <input type="hidden" name="siteId" value="${escapeHtml(scope.siteId || currentAccessSiteId())}">
            <p class="workspace-muted">This signs the person out and makes a one-time setup code. Copy the code after you save.</p>
            ${renderDestructiveActionConfirmation({
              id: `password-reset-${account.userId || "account"}`,
              label: "I understand this signs the person out now.",
              detail: "A one-time code will be shown once. Share it privately. It expires in 30 minutes.",
            })}
            <label class="workspace-label">
              Why is this needed?
              <input class="workspace-input" name="reason" maxlength="500" aria-describedby="passwordResetReason-${escapeHtml(account.userId || "account")}" required>
              <small id="passwordResetReason-${escapeHtml(account.userId || "account")}">Example: The user asked for help signing in.</small>
            </label>
            <button class="workspace-button workspace-button-secondary" type="submit">Make setup code</button>
          </form>
        </details>
      ` : ""}
      ${canManage && !isSelf ? `
        <details class="workspace-account-remove">
          <summary>Remove access</summary>
          <form class="workspace-inline-action-form" data-admin-account-remove-form="true" data-admin-account-id="${escapeHtml(account.userId || "")}">
            <input type="hidden" name="siteId" value="${escapeHtml(scope.siteId || currentAccessSiteId())}">
            <p class="workspace-muted" data-site-account-remove-impact="true">Removes this school assignment only. It does not delete project records; orphaned sign-in is disabled automatically.</p>
            ${renderDestructiveActionConfirmation({
              id: "account-remove",
              label: "I reviewed what account removal does for this person.",
              detail: "Keep this checked only after confirming the person should lose this school access now.",
            })}
            <label class="workspace-label">
              Admin note
              <input class="workspace-input" name="adminNote" maxlength="500" required>
            </label>
            <button class="workspace-button workspace-button-secondary" type="submit">Remove account</button>
          </form>
        </details>
      ` : `<span class="workspace-chip">${isSelf ? "Signed in" : "Managed"}</span>`}
    </article>
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
      title: "Program Teacher access",
      rows: assignments.programTeacherProgram,
      empty: "No Program Teacher program access is active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.programTeacherUserId),
        labels.program(row.programId),
        "Program Teachers can review assigned program records.",
      ),
    }),
    renderAccessAssignmentSummaryRows({
      title: "School admin access",
      rows: assignments.administrationSite,
      empty: "No School Admin access is active for this school.",
      renderRow: (row) => accessAssignmentRow(
        labels.user(row.userId),
        labels.site(row.siteId),
        "School Admins can manage student, mentor, viewer, and Program Teacher access inside this school.",
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
  return renderWorkspaceDisclosurePanel({
    scope: "usersAccess",
    id: "history",
    kicker: "Recorded changes",
    title: "Recent access changes",
    summary: `${history.length} recent access change${history.length === 1 ? "" : "s"} available. Admin note text stays hidden.`,
    openLabel: "Open recent changes",
    closeLabel: "Hide recent changes",
    dataAttrs: 'data-site-access-history="true" tabindex="-1"',
    bodyHtml: renderSiteAccessAssignmentHistoryBody(history, labels),
  });
}

function renderSiteAccessAssignmentHistoryBody(history = [], labels) {
  return `
      ${history.length ? `
        <div class="workspace-list">
          ${history.map((row) => renderSiteAccessHistoryRow(row, labels)).join("")}
        </div>
      ` : `<div class="workspace-empty">No recorded access changes are available for this school yet.</div>`}
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
    program_teacher_program: "Program Teacher access",
    administration_site: "School admin access",
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
            ${programs.map((program) => `<option value="${escapeHtml(program.programId)}">${escapeHtml(cleanDemoSeedDisplay(program.programName, program.programId))}</option>`).join("")}
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

function currentProgramSiteId() {
  return unwrap(currentData.sitePrograms)?.scope?.siteId || currentSiteWorkspaceContext()?.siteId || selectedSiteId || "";
}

function renderSiteProgramForm(action, title, programs = [], options = {}) {
  const safePrograms = Array.isArray(programs) ? programs : [];
  const disabled = safePrograms.length === 0;
  return `
    <form class="workspace-form workspace-assignment-form" data-site-program-form data-site-program-action="${escapeHtml(action || "assign")}">
      <input type="hidden" name="siteId" value="${escapeHtml(currentProgramSiteId())}">
      <input type="hidden" name="action" value="${escapeHtml(action || "assign")}">
      <p class="workspace-kicker">${escapeHtml(title)}</p>
      <div class="workspace-form-grid">
        <label class="workspace-label">
          Program
          <select class="workspace-select" name="programId" ${disabled ? "disabled" : ""} required>
            ${siteProgramOptions(safePrograms, disabled ? "No available programs" : "Choose a program")}
          </select>
        </label>
        <label class="workspace-label workspace-label-wide">
          Admin note
          <textarea class="workspace-textarea" name="adminNote" maxlength="500" ${disabled ? "disabled" : ""} required></textarea>
          <span class="workspace-muted">This note is saved in the audit log and stays in admin-only history.</span>
        </label>
      </div>
      <p class="workspace-muted" data-site-program-guidance="${escapeHtml(action || "assign")}">${escapeHtml(options.guidance || "Save this change to update site program setup.")}</p>
      ${disabled ? `
        <article class="workspace-empty-state-card" data-site-programs-form-empty="${escapeHtml(action || "assign")}">
          <strong>${escapeHtml(options.emptyTitle || "No programs are available for this step right now.")}</strong>
          <p>${escapeHtml(options.emptyDetail || "Refresh later after program setup changes.")}</p>
        </article>
      ` : ""}
      <div class="workspace-form-actions">
        <button class="workspace-button workspace-button-secondary" type="submit" ${disabled ? "disabled" : ""}>${escapeHtml(options.submitLabel || "Save program change")}</button>
      </div>
    </form>
  `;
}

function siteProgramOptions(programs = [], promptLabel = "Choose a program") {
  const safePrograms = Array.isArray(programs) ? programs : [];
  if (!safePrograms.length) return `<option value="">${escapeHtml(promptLabel)}</option>`;
  return [
    `<option value="">${escapeHtml(promptLabel)}</option>`,
    ...safePrograms.map((program) => `<option value="${escapeHtml(program.programId || "")}">${escapeHtml(cleanDemoSeedDisplay(program.programName, program.programId || "Program"))}</option>`),
  ].join("");
}

function adminRoleOptions(choices = []) {
  return choices
    .map((role) => `<option value="${escapeHtml(role.value)}">${escapeHtml(role.label)}</option>`)
    .join("");
}

function adminRoleChoices(canCreateGlobal) {
  const roles = [
    { value: "student", label: "Student", detail: "Own checklist and proof." },
    { value: "mentor", label: "Mentor", detail: "Assigned students only." },
    { value: "viewer", label: "Viewer", detail: "Read-only student access." },
    { value: "program_teacher", label: "Program Teacher", detail: "Program review access." },
    { value: "administration", label: "School Admin", detail: "School account support." },
    { value: "site_admin", label: "Site Admin", detail: "Manage this school." },
  ];
  if (canCreateGlobal) roles.push({ value: "global_admin", label: "Global Admin", detail: "Manage every site." });
  return roles;
}

function adminRoleChoicesForRoles(roles) {
  const choices = adminRoleChoices(hasGlobalAdminRole(roles));
  if (hasGlobalAdminRole(roles)) return choices;
  const allowed = roles.has("program_teacher")
    ? ["student", "mentor"]
    : roles.has("site_admin")
      ? ["student", "mentor", "viewer", "program_teacher", "administration"]
      : canUseStaffAccessManagement(roles)
      ? ["student", "mentor", "viewer", "program_teacher"]
      : [];
  return choices.filter((role) => allowed.includes(role.value));
}

function renderAdminRoleQuickPicks(choices = [], selectedRoleId = choices[0]?.value || "student") {
  return `
    <div class="workspace-role-choice-grid" data-admin-role-quick-picks="true" aria-label="Account role choices">
      ${choices.map((role) => {
        const selected = role.value === selectedRoleId;
        return `
          <button class="workspace-role-choice ${selected ? "is-active" : ""}" type="button" data-admin-role-pick="${escapeHtml(role.value)}" aria-pressed="${selected ? "true" : "false"}">
            <strong>${escapeHtml(role.label)}</strong>
            <span>${escapeHtml(role.detail)}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
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
  return programs.map((program) => `<option value="${escapeHtml(program.programId)}">${escapeHtml(cleanDemoSeedDisplay(program.programName, program.programId))}</option>`).join("");
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

function renderSiteAccessGuidanceDisclosure() {
  const rows = [
    ["Mentors", "Assign grants or restores mentor access for one student. Remove should match a current mentor-student row and does not delete student work."],
    ["Viewers", "Assign grants or restores read-only viewer access for one student. Remove only changes access and keeps account and student records intact."],
    ["Program Teachers", "Assign, restore, or remove Program Teacher access for this school. Remove does not delete accounts or program records."],
    ["School Admins", "Assign grants or restores school admin access for this school. Remove only changes site access and keeps school records intact."],
    ["Site Admins", "Assign grants or restores site admin access where this account is allowed to do that. Remove is recorded for review and keeps school records intact."],
  ];
  return renderWorkspaceDisclosurePanel({
    scope: "usersAccess",
    id: "guidance",
    kicker: "Access guidance",
    title: "Assign / Remove Rules",
    summary: "Open for detailed role-by-role guidance before saving unusual access changes.",
    openLabel: "Open guidance",
    closeLabel: "Hide guidance",
    dataAttrs: 'data-site-access-guidance-panel="true"',
    bodyHtml: `
      <div class="workspace-list">
        ${rows.map(([title, detail]) => `
          <article class="workspace-mini-row">
            <span>${escapeHtml(title)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    `,
  });
}

function assignmentActionGuidance(type) {
  const copy = {
    mentor_student: "Assign or remove one student's mentor access. Full rules are in Access guidance above.",
    viewer_student: "Assign or remove one student's read-only viewer access. Full rules are in Access guidance above.",
    program_teacher_program: "Assign or remove Program Teacher access for this school. Full rules are in Access guidance above.",
    administration_site: "Assign or remove School Admin access for this school. Full rules are in Access guidance above.",
    site_admin_site: "Assign or remove site admin access for this school. Full rules are in Access guidance above.",
  };
  return `<p class="workspace-muted workspace-quiet-helper" data-site-access-action-guidance="${escapeHtml(type || "site_access")}">${escapeHtml(copy[type] || "Assign or remove access for the selected record. Full rules are in Access guidance above.")}</p>`;
}

function currentAccessSiteId() {
  return unwrap(currentData.accessAssignments)?.scope?.siteId || currentSiteWorkspaceContext()?.siteId || selectedSiteId || "";
}
