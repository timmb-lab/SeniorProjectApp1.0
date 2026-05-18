const alphaRoot = document.querySelector("#alphaRoot");

let initialState = null;
let state = null;
let selectedPersonaId = "student";
let selectedRouteId = "student";

const defaultRouteByPersona = {
  student: "student",
  program_teacher: "teacher",
  mentor: "mentor",
  admin: "admin",
  misc_admin: "admin",
};

const statusLabels = {
  complete: "Complete",
  in_progress: "In progress",
  revision_requested: "Revision requested",
  blocked: "Blocked",
  pending_review: "Pending review",
  submitted: "Submitted",
  draft: "Draft",
  approved: "Approved",
  needs_revision: "Needs revision",
  make_up_required: "Make-up required",
  not_ready: "Not ready",
  not_started: "Not started",
  at_risk: "At risk",
};

async function loadAlphaState() {
  const sources = ["/api/alpha/state", "data/alpha-demo-state.json"];
  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Alpha state request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Alpha state could not load.");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeStatus(value) {
  return String(value || "not_started").replaceAll("_", "-");
}

function labelStatus(value) {
  return statusLabels[value] || String(value || "Not started").replaceAll("_", " ");
}

function currentPersona() {
  return state.personas.find((persona) => persona.id === selectedPersonaId) || state.personas[0];
}

function canAccess(routeId) {
  return currentPersona().allowedRoutes.includes(routeId);
}

function routeButton(route) {
  const active = selectedRouteId === route.id;
  const disabled = !canAccess(route.id);
  return `
    <button
      class="alpha-route-button${active ? " is-active" : ""}"
      type="button"
      data-route="${esc(route.id)}"
      aria-pressed="${active}"
      ${disabled ? "disabled" : ""}
    >
      <span>${esc(route.label)}</span>
      <small>${esc(route.path)}</small>
    </button>
  `;
}

function personaButton(persona) {
  const active = persona.id === selectedPersonaId;
  return `
    <button
      class="alpha-persona-button${active ? " is-active" : ""}"
      type="button"
      data-persona="${esc(persona.id)}"
      aria-pressed="${active}"
    >
      <span>${esc(persona.label)}</span>
      <small>${esc(persona.name)}</small>
    </button>
  `;
}

function statCard(label, value, meta = "") {
  return `
    <article class="alpha-stat">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
      ${meta ? `<small>${esc(meta)}</small>` : ""}
    </article>
  `;
}

function statusPill(status) {
  return `<span class="alpha-pill status-${esc(normalizeStatus(status))}">${esc(labelStatus(status))}</span>`;
}

function renderDeadlines() {
  return state.deadlines
    .map(
      (deadline) => `
        <li>
          <span>${esc(deadline.label)}</span>
          <strong>${esc(deadline.due)}</strong>
          ${statusPill(deadline.status)}
        </li>
      `,
    )
    .join("");
}

function renderAudit(limit = state.auditEvents.length) {
  return state.auditEvents
    .slice(0, limit)
    .map(
      (event) => `
        <li class="alpha-timeline-item">
          <div>
            <strong>${esc(event.action)}</strong>
            <span>${esc(event.detail)}</span>
          </div>
          <aside>
            <span>${esc(event.actor)}</span>
            <time datetime="${esc(event.createdAt)}">${esc(formatShortDate(event.createdAt))}</time>
          </aside>
        </li>
      `,
    )
    .join("");
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function addAudit(actor, action, entity, detail) {
  const createdAt = new Date().toISOString();
  state.auditEvents.unshift({
    id: `audit-${Date.now()}`,
    actor,
    action,
    entity,
    detail,
    createdAt,
  });
  state.admin.auditEvents = state.auditEvents.length;
}

function updateQueueStatus(status, feedback) {
  state.reviewQueue = state.reviewQueue.map((item) =>
    item.id === "queue-jordan-proposal"
      ? {
          ...item,
          status,
          latestFeedback: feedback,
        }
      : item,
  );
}

function renderShell(content) {
  const persona = currentPersona();
  const runtime = state.runtime || {};
  alphaRoot.innerHTML = `
    <section class="alpha-shell">
      <header class="alpha-topbar">
        <div>
          <p class="alpha-kicker">Day 7 Alpha Workspace</p>
          <h1>Senior Capstone MVP Alpha</h1>
        </div>
        <div class="alpha-mode">
          <strong>${esc(runtime.databaseBound ? "D1 binding detected" : "Seed fallback")}</strong>
          <span>${esc(state.alphaGate.accountException)}</span>
        </div>
      </header>

      <aside class="alpha-sidebar" aria-label="Alpha persona and route controls">
        <section>
          <h2>Persona</h2>
          <div class="alpha-persona-list">${state.personas.map(personaButton).join("")}</div>
        </section>
        <section>
          <h2>Routes</h2>
          <div class="alpha-route-list">${state.routes.map(routeButton).join("")}</div>
        </section>
        <section class="alpha-scope">
          <h2>Active Scope</h2>
          <p><strong>${esc(persona.name)}</strong></p>
          <p>${esc(persona.roleScope)}</p>
          <button class="alpha-secondary" type="button" data-action="reset">Reset demo state</button>
        </section>
      </aside>

      <section class="alpha-content" aria-label="Alpha route content">
        ${content}
      </section>
    </section>
  `;

  bindControls();
}

function renderStudent() {
  const proposal = state.proposal;
  const blocked = proposal.blockedSubmitReasons.length > 0;
  const content = `
    <div class="alpha-view-heading">
      <div>
        <p class="alpha-kicker">Student Workspace</p>
        <h2>${esc(state.student.displayName)} - ${esc(state.student.capstoneTitle)}</h2>
      </div>
      ${statusPill(proposal.status)}
    </div>

    <div class="alpha-stat-grid">
      ${statCard("Program", state.student.program, state.student.cohort)}
      ${statCard("Current phase", state.student.currentPhase, `Version ${proposal.version}`)}
      ${statCard("Completeness", `${proposal.completeness}%`, "Server-owned alpha seed")}
      ${statCard("Evidence items", state.evidence.length, "Metadata only")}
    </div>

    <section class="alpha-panel">
      <div class="alpha-panel-head">
        <h3>Next Action</h3>
        <div class="alpha-action-row">
          <button type="button" data-action="save-draft">Save draft</button>
          <button type="button" data-action="submit" ${blocked ? "aria-describedby=\"blocked-reasons\"" : ""}>Submit</button>
        </div>
      </div>
      <p>${esc(state.student.nextAction)}</p>
      <ul id="blocked-reasons" class="alpha-warning-list">
        ${proposal.blockedSubmitReasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}
      </ul>
    </section>

    <section class="alpha-grid-two">
      <article class="alpha-panel">
        <h3>Guided Proposal Sections</h3>
        <div class="alpha-section-list">
          ${proposal.sections
            .map(
              (section) => `
                <article>
                  <div>
                    <strong>${esc(section.label)}</strong>
                    <p>${esc(section.body)}</p>
                  </div>
                  ${statusPill(section.state)}
                </article>
              `,
            )
            .join("")}
        </div>
      </article>

      <article class="alpha-panel">
        <h3>Evidence Metadata</h3>
        <div class="alpha-evidence-list">
          ${state.evidence
            .map(
              (item) => `
                <article>
                  <div>
                    <strong>${esc(item.title)}</strong>
                    <a href="${esc(item.url)}" target="_blank" rel="noreferrer">${esc(item.kind)}</a>
                  </div>
                  ${statusPill(item.status)}
                </article>
              `,
            )
            .join("")}
        </div>
        <form id="evidenceForm" class="alpha-form">
          <label>
            Evidence title
            <input name="title" autocomplete="off" placeholder="Mentor prep notes">
          </label>
          <label>
            Link URL
            <input name="url" type="url" placeholder="https://example.edu/demo">
          </label>
          <button type="submit">Add evidence metadata</button>
        </form>
      </article>
    </section>
  `;
  renderShell(content);
  bindEvidenceForm();
}

function renderTeacher() {
  const item = state.reviewQueue[0];
  const content = `
    <div class="alpha-view-heading">
      <div>
        <p class="alpha-kicker">Teacher Review</p>
        <h2>Program review queue</h2>
      </div>
      ${statusPill(item.status)}
    </div>

    <section class="alpha-grid-two">
      <article class="alpha-panel">
        <h3>Queue Detail</h3>
        <dl class="alpha-detail-list">
          <div><dt>Student</dt><dd>${esc(item.studentName)}</dd></div>
          <div><dt>Program</dt><dd>${esc(item.program)}</dd></div>
          <div><dt>Priority</dt><dd>${esc(item.priority)}</dd></div>
          <div><dt>Latest feedback</dt><dd>${esc(item.latestFeedback)}</dd></div>
        </dl>
      </article>
      <article class="alpha-panel">
        <h3>Review Actions</h3>
        <p>These actions update alpha state, dashboard counts, and the audit timeline without using production accounts.</p>
        <div class="alpha-action-grid">
          <button type="button" data-action="request-revision">Request revision</button>
          <button type="button" data-action="approve">Approve proposal</button>
        </div>
      </article>
    </section>

    <section class="alpha-panel">
      <h3>Recent Activity</h3>
      <ol class="alpha-timeline">${renderAudit(5)}</ol>
    </section>
  `;
  renderShell(content);
}

function renderMentor() {
  const mentor = state.mentor;
  const slot = mentor.presentationSlot;
  const content = `
    <div class="alpha-view-heading">
      <div>
        <p class="alpha-kicker">Mentor Meetings</p>
        <h2>Assigned student: ${esc(state.student.displayName)}</h2>
      </div>
      ${statusPill(mentor.meetingStatus)}
    </div>

    <section class="alpha-grid-two">
      <article class="alpha-panel">
        <h3>Meeting Contract</h3>
        <dl class="alpha-detail-list">
          <div><dt>Next make-up due</dt><dd>${esc(mentor.nextMeetingDue)}</dd></div>
          <div><dt>Outline approval</dt><dd>${esc(labelStatus(mentor.outlineApproval))}</dd></div>
          <div><dt>Scope</dt><dd>Assigned student only</dd></div>
        </dl>
        <div class="alpha-action-row">
          <button type="button" data-action="record-meeting">Record make-up complete</button>
        </div>
      </article>
      <article class="alpha-panel">
        <h3>Presentation Slot</h3>
        <dl class="alpha-detail-list">
          <div><dt>Slot</dt><dd>${esc(slot.label)}</dd></div>
          <div><dt>Starts</dt><dd>${esc(formatShortDate(slot.startsAt))}</dd></div>
          <div><dt>Conflict</dt><dd>${esc(slot.conflict ? "Yes - duplicate slot needs resolution" : "No")}</dd></div>
          <div><dt>Check-in</dt><dd>${esc(labelStatus(slot.checkIn))}</dd></div>
        </dl>
        <div class="alpha-action-row">
          <button type="button" data-action="resolve-slot">Resolve slot conflict</button>
          <button type="button" data-action="check-in">Check in</button>
        </div>
      </article>
    </section>
  `;
  renderShell(content);
}

function renderAdmin() {
  const persona = currentPersona();
  const limited = persona.id === "misc_admin";
  const content = `
    <div class="alpha-view-heading">
      <div>
        <p class="alpha-kicker">${limited ? "Misc Admin Scope" : "Admin Overview"}</p>
        <h2>${limited ? "Read-only alpha support view" : "Program, audit, and export controls"}</h2>
      </div>
      ${statusPill(limited ? "in_progress" : "submitted")}
    </div>

    <div class="alpha-stat-grid">
      ${statCard("Programs", state.admin.programsTracked, "Canonical seed")}
      ${statCard("Seeded users", state.admin.seededUsers, "Alpha personas")}
      ${statCard("Open reviews", state.admin.openReviews, "Teacher queue")}
      ${statCard("Revision requests", state.admin.revisionRequests, "Dashboard aggregate")}
      ${statCard("Audit events", state.admin.auditEvents, "Timeline")}
      ${statCard("Exports", state.admin.exportRequests, "Queued")}
    </div>

    <section class="alpha-grid-two">
      <article class="alpha-panel">
        <h3>Deadlines And Blocks</h3>
        <ul class="alpha-deadline-list">${renderDeadlines()}</ul>
      </article>
      <article class="alpha-panel">
        <h3>${limited ? "Permission Boundary" : "Admin Controls"}</h3>
        <p>
          ${
            limited
              ? "Misc admin can inspect dashboard/support signals but cannot approve, override, export, or view private evidence by default."
              : "Admin controls are represented for alpha. Production account import, exports, and private evidence access remain post-alpha hardening tasks."
          }
        </p>
        <div class="alpha-action-row">
          <button type="button" data-action="admin-note" ${limited ? "disabled" : ""}>Log admin note</button>
        </div>
      </article>
    </section>
  `;
  renderShell(content);
}

function renderActivity() {
  const content = `
    <div class="alpha-view-heading">
      <div>
        <p class="alpha-kicker">Audit Activity</p>
        <h2>Server-owned alpha timeline</h2>
      </div>
      ${statusPill("in_progress")}
    </div>
    <section class="alpha-panel">
      <ol class="alpha-timeline">${renderAudit()}</ol>
    </section>
    <section class="alpha-panel">
      <h3>Figma Contract Coverage</h3>
      <div class="alpha-source-grid">
        ${state.figmaSources
          .map(
            (source) => `
              <article>
                <strong>${esc(source.node)}</strong>
                <span>${esc(source.label)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
  renderShell(content);
}

function renderPermissionDenied() {
  renderShell(`
    <div class="alpha-view-heading">
      <div>
        <p class="alpha-kicker">Permission Boundary</p>
        <h2>Route not available for ${esc(currentPersona().label)}</h2>
      </div>
      ${statusPill("blocked")}
    </div>
    <section class="alpha-panel">
      <p>This alpha route is intentionally hidden for the selected persona. Switch persona or choose an available route.</p>
    </section>
  `);
}

function render() {
  if (!state) {
    alphaRoot.innerHTML = `<div class="alpha-loading">Loading alpha workspace...</div>`;
    return;
  }

  if (!canAccess(selectedRouteId)) {
    renderPermissionDenied();
    return;
  }

  if (selectedRouteId === "student") {
    renderStudent();
  } else if (selectedRouteId === "teacher") {
    renderTeacher();
  } else if (selectedRouteId === "mentor") {
    renderMentor();
  } else if (selectedRouteId === "admin") {
    renderAdmin();
  } else {
    renderActivity();
  }
}

function bindControls() {
  document.querySelectorAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPersonaId = button.getAttribute("data-persona") || "student";
      const persona = currentPersona();
      selectedRouteId = persona.allowedRoutes.includes(selectedRouteId)
        ? selectedRouteId
        : defaultRouteByPersona[selectedPersonaId] || persona.allowedRoutes[0];
      render();
    });
  });

  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.getAttribute("data-route") || "student";
      selectedRouteId = route;
      window.history.replaceState(null, "", `#${route}`);
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.getAttribute("data-action") || ""));
  });
}

function bindEvidenceForm() {
  const form = document.querySelector("#evidenceForm");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const url = String(formData.get("url") || "").trim();
    if (!title || !url) {
      return;
    }

    state.evidence.unshift({
      id: `evidence-alpha-${Date.now()}`,
      title,
      kind: "external_link",
      status: "pending_review",
      owner: state.student.id,
      url,
    });
    state.proposal.completeness = Math.min(100, state.proposal.completeness + 8);
    state.proposal.blockedSubmitReasons = state.proposal.blockedSubmitReasons.filter(
      (reason) => !reason.toLowerCase().includes("source"),
    );
    addAudit("Jordan Lee", "evidence_metadata_added", state.student.id, `Added alpha evidence metadata: ${title}.`);
    render();
  });
}

function handleAction(action) {
  if (action === "reset") {
    state = clone(initialState);
    selectedPersonaId = "student";
    selectedRouteId = "student";
  }

  if (action === "save-draft") {
    state.proposal.status = "draft";
    state.student.nextAction = "Draft saved. Submit after blocked evidence and research items are cleared.";
    addAudit("Jordan Lee", "proposal_draft_saved", state.proposal.id, "Saved proposal draft in alpha state.");
  }

  if (action === "submit") {
    if (state.proposal.blockedSubmitReasons.length > 0) {
      addAudit("Jordan Lee", "submit_blocked", state.proposal.id, "Submit blocked by incomplete alpha requirements.");
    } else {
      state.proposal.status = "submitted";
      updateQueueStatus("submitted", "Student resubmitted for program-teacher review.");
      state.admin.openReviews = 1;
      state.student.nextAction = "Submission is waiting for program teacher review.";
      addAudit("Jordan Lee", "proposal_submitted", state.proposal.id, "Submitted proposal for teacher review.");
    }
  }

  if (action === "request-revision") {
    state.proposal.status = "revision_requested";
    state.proposal.version += 1;
    state.admin.revisionRequests = 1;
    state.student.nextAction = "Revise teacher feedback and resubmit the proposal.";
    updateQueueStatus("revision_requested", "Clarify CTE skill evidence and attach one more credible source.");
    addAudit("Ms. Rivera", "revision_requested", state.proposal.id, "Requested proposal revision in alpha review queue.");
  }

  if (action === "approve") {
    state.proposal.status = "approved";
    state.proposal.completeness = 100;
    state.proposal.blockedSubmitReasons = [];
    state.admin.openReviews = 0;
    state.admin.revisionRequests = 0;
    state.student.nextAction = "Proposal approved. Prepare mentor meeting evidence and presentation outline.";
    updateQueueStatus("approved", "Proposal approved for next phase.");
    addAudit("Ms. Rivera", "proposal_approved", state.proposal.id, "Approved proposal and updated dashboard aggregates.");
  }

  if (action === "record-meeting") {
    state.mentor.meetingStatus = "complete";
    state.mentor.outlineApproval = "pending_review";
    state.student.nextAction = "Mentor make-up recorded. Finish the presentation outline approval packet.";
    addAudit("Mr. Patel", "mentor_meeting_recorded", state.student.id, "Recorded mentor make-up meeting completion.");
  }

  if (action === "resolve-slot") {
    state.mentor.presentationSlot.conflict = false;
    addAudit("A. Morgan", "presentation_slot_conflict_resolved", state.mentor.presentationSlot.id, "Resolved duplicate presentation slot in alpha.");
  }

  if (action === "check-in") {
    if (state.mentor.presentationSlot.conflict) {
      addAudit("Mr. Patel", "check_in_blocked", state.mentor.presentationSlot.id, "Check-in blocked while slot conflict exists.");
    } else {
      state.mentor.presentationSlot.checkIn = "submitted";
      addAudit("Mr. Patel", "presentation_check_in", state.mentor.presentationSlot.id, "Recorded alpha presentation check-in.");
    }
  }

  if (action === "admin-note") {
    addAudit("A. Morgan", "admin_alpha_note", "day7-alpha", "Logged admin alpha note; exports remain disabled until hardening.");
  }

  render();
}

async function start() {
  try {
    initialState = await loadAlphaState();
    state = clone(initialState);
    const hashRoute = window.location.hash.replace("#", "");
    if (state.routes.some((route) => route.id === hashRoute)) {
      selectedRouteId = hashRoute;
    }
    render();
  } catch (error) {
    alphaRoot.innerHTML = `
      <section class="alpha-error">
        <h1>Alpha workspace could not load</h1>
        <p>${esc(error instanceof Error ? error.message : "Unknown loading error")}</p>
      </section>
    `;
  }
}

start();
