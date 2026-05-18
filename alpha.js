let alphaState = null;
let activePersona = "student";
let busy = false;

const personaTabs = document.querySelector("#personaTabs");
const alphaRoot = document.querySelector("#alphaRoot");
const alphaStatus = document.querySelector("#alphaStatus");
const workspaceTitle = document.querySelector("#workspaceTitle");

init();

async function init() {
  bindWorkspaceActions();
  await loadState();
}

async function loadState() {
  setStatus("Loading server-owned alpha state...", "neutral");
  try {
    const response = await fetch("/api/alpha/state", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Alpha API returned ${response.status}`);
    const data = await response.json();
    alphaState = data.state;
    render();
    setStatus(alphaState.lastResult?.message || "Alpha state loaded.", "success");
  } catch (error) {
    workspaceTitle.textContent = "Alpha API unavailable";
    alphaRoot.innerHTML = `
      <section class="alpha-card alpha-denied">
        <h3>Server state is required</h3>
        <p>${escapeHtml(error.message)}. Run the app through Cloudflare Pages dev or deployment so D1 can own the demo state.</p>
      </section>
    `;
    setStatus("Alpha flow is blocked until the Pages Function API is reachable.", "error");
  }
}

function render() {
  if (!alphaState) return;
  const persona = getPersona(activePersona);
  workspaceTitle.textContent = `${persona.label} workspace`;
  renderPersonas();
  alphaRoot.innerHTML = `
    <div class="alpha-column">
      ${renderMetrics()}
      ${renderPersonaPanel(activePersona)}
    </div>
    <div class="alpha-column">
      ${renderEvidenceCard()}
      ${renderReviewsCard()}
      ${renderAuditCard()}
    </div>
  `;
  bindRenderedActions();
}

function renderPersonas() {
  personaTabs.innerHTML = alphaState.personas.map((persona) => `
    <button
      class="alpha-persona-tab"
      type="button"
      data-persona="${escapeHtml(persona.id)}"
      aria-selected="${persona.id === activePersona ? "true" : "false"}"
    >
      <strong>${escapeHtml(persona.label)}</strong>
      <span>${escapeHtml(persona.scope)}</span>
    </button>
  `).join("");
  personaTabs.querySelectorAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", () => {
      activePersona = button.dataset.persona;
      render();
    });
  });
}

function renderMetrics() {
  const metrics = alphaState.metrics || {};
  return `
    <section class="alpha-metrics" aria-label="Dashboard aggregates">
      ${metric("Submitted", metrics.submittedCount || 0)}
      ${metric("Needs Revision", metrics.revisionCount || 0)}
      ${metric("Approved", metrics.approvedCount || 0)}
      ${metric("Evidence", metrics.evidenceCount || 0)}
    </section>
  `;
}

function metric(label, value) {
  return `
    <article class="alpha-metric">
      <strong>${value}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

function renderPersonaPanel(personaId) {
  if (personaId === "student") return renderStudentPanel();
  if (personaId === "program_teacher") return renderTeacherPanel();
  if (personaId === "mentor") return renderMentorPanel();
  if (personaId === "admin") return renderAdminPanel();
  return renderMiscAdminPanel();
}

function renderStudentPanel() {
  const proposal = alphaState.proposal;
  return `
    <section class="alpha-card">
      <div class="alpha-chip-row">
        ${statusPill(proposal.status)}
        <span class="alpha-chip">Version ${proposal.version}</span>
        <span class="alpha-chip">${proposal.completeness}% complete</span>
      </div>
      <h3>${escapeHtml(alphaState.student.displayName)} - ${escapeHtml(proposal.title)}</h3>
      <p>${escapeHtml(alphaState.student.currentPhase)}. Next: ${escapeHtml(alphaState.student.nextAction)}</p>
      <div class="alpha-section-list">
        ${proposal.sections.map((section) => `
          <article class="alpha-row">
            <div>
              <strong>${escapeHtml(section.title)}</strong>
              <p>${escapeHtml(section.detail)}</p>
            </div>
            ${statusPill(section.status)}
          </article>
        `).join("")}
      </div>
      <div class="alpha-actions">
        <button class="alpha-button" data-action="save_draft" type="button">Save Draft</button>
        <button class="alpha-button alpha-button-primary" data-action="submit_proposal" type="button">Submit</button>
        <button class="alpha-button" data-action="resubmit_revision" type="button">Resubmit Revision</button>
      </div>
    </section>
    ${renderEvidenceForm()}
  `;
}

function renderTeacherPanel() {
  return `
    <section class="alpha-card">
      <div class="alpha-chip-row">
        ${statusPill(alphaState.proposal.status)}
        <span class="alpha-chip">${alphaState.evidence.length} evidence item${alphaState.evidence.length === 1 ? "" : "s"}</span>
      </div>
      <h3>IT Review Queue</h3>
      <p>${escapeHtml(alphaState.student.displayName)} is ready for feedback when the proposal is submitted or resubmitted.</p>
      <div class="alpha-row">
        <div>
          <strong>${escapeHtml(alphaState.proposal.title)}</strong>
          <p>Program: ${escapeHtml(alphaState.student.program)}. Completeness: ${alphaState.proposal.completeness}%.</p>
        </div>
        ${statusPill(alphaState.proposal.status)}
      </div>
      <div class="alpha-actions">
        <button class="alpha-button" data-action="request_revision" type="button">Request Revision</button>
        <button class="alpha-button alpha-button-primary" data-action="approve_submission" type="button">Approve</button>
      </div>
    </section>
  `;
}

function renderMentorPanel() {
  const meeting = alphaState.meeting;
  const presentation = alphaState.presentation;
  return `
    <section class="alpha-card">
      <div class="alpha-chip-row">
        ${statusPill(meeting.status)}
        ${statusPill(presentation.slotStatus)}
      </div>
      <h3>Mentor Meeting + Presentation Prep</h3>
      <p>Assigned student: ${escapeHtml(alphaState.student.displayName)}. Next: ${escapeHtml(meeting.nextAction)}</p>
      <div class="alpha-row">
        <div>
          <strong>Meeting attendance</strong>
          <p>${escapeHtml(meeting.notes || "Attendance has not been captured yet.")}</p>
        </div>
        ${statusPill(meeting.attendance)}
      </div>
      <div class="alpha-actions">
        <button class="alpha-button alpha-button-primary" data-action="mark_meeting_held" type="button">Mark Held</button>
        <button class="alpha-button" data-action="flag_presentation_risk" type="button">Flag Slot Risk</button>
      </div>
    </section>
  `;
}

function renderAdminPanel() {
  return `
    <section class="alpha-card">
      <div class="alpha-chip-row">
        ${statusPill(alphaState.exportRequest.status)}
        <span class="alpha-chip">${alphaState.audit.length} audit events</span>
      </div>
      <h3>Admin Operations</h3>
      <p>Program overview, deadline notice, archive/export, and audit history are wired into the same alpha record.</p>
      <div class="alpha-actions">
        <button class="alpha-button alpha-button-primary" data-action="queue_archive_export" type="button">Queue Archive Export</button>
        <button class="alpha-button" data-action="add_deadline_notice" data-title="Proposal revisions due Friday" type="button">Add Deadline Notice</button>
      </div>
      ${alphaState.announcements.length ? `
        <div class="alpha-section-list">
          ${alphaState.announcements.map((notice) => `
            <article class="alpha-row">
              <div>
                <strong>${escapeHtml(notice.title)}</strong>
                <p>${escapeHtml(notice.audience)} - ${formatTime(notice.createdAt)}</p>
              </div>
              <span class="alpha-chip">Notice</span>
            </article>
          `).join("")}
        </div>
      ` : `<div class="alpha-empty">No admin notices have been created in this alpha state yet.</div>`}
    </section>
  `;
}

function renderMiscAdminPanel() {
  return `
    <section class="alpha-card alpha-denied">
      <div class="alpha-chip-row">
        <span class="alpha-chip">Narrow Scope</span>
        <span class="alpha-chip">Read Only</span>
      </div>
      <h3>Misc Admin Reporting</h3>
      <p>This persona can run a readiness report but cannot approve submissions or change student records.</p>
      <div class="alpha-actions">
        <button class="alpha-button alpha-button-primary" data-action="run_readiness_report" type="button">Run Readiness Report</button>
        <button class="alpha-button" data-action="approve_submission" type="button">Try Restricted Approval</button>
      </div>
      ${alphaState.reportRuns.length ? `
        <div class="alpha-section-list">
          ${alphaState.reportRuns.map((report) => `
            <article class="alpha-row">
              <div>
                <strong>${escapeHtml(report.summary)}</strong>
                <p>${formatTime(report.generatedAt)}</p>
              </div>
              <span class="alpha-chip">Report</span>
            </article>
          `).join("")}
        </div>
      ` : `<div class="alpha-empty">No readiness report has been run yet.</div>`}
    </section>
  `;
}

function renderEvidenceForm() {
  return `
    <section class="alpha-form-panel">
      <h3>Add Evidence Metadata</h3>
      <p>Alpha supports access-controlled metadata/link flow. Real Drive file-byte upload is still post-alpha hardening.</p>
      <form id="evidenceForm" class="alpha-form">
        <label>
          Evidence title
          <input name="title" value="Revised research source notes" autocomplete="off">
        </label>
        <label>
          Evidence HTTPS URL
          <input name="url" value="https://example.com/revised-research-notes" autocomplete="off">
        </label>
        <button class="alpha-button alpha-button-primary" type="submit">Attach Evidence Link</button>
      </form>
    </section>
  `;
}

function renderEvidenceCard() {
  return `
    <section class="alpha-card">
      <h3>Evidence</h3>
      <div class="alpha-evidence-list">
        ${alphaState.evidence.length ? alphaState.evidence.map((item) => `
          <article class="alpha-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.url || "Drive file metadata pending")}</p>
            </div>
            ${statusPill(item.status)}
          </article>
        `).join("") : `<div class="alpha-empty">Evidence is empty. Student submit will be blocked.</div>`}
      </div>
    </section>
  `;
}

function renderReviewsCard() {
  return `
    <section class="alpha-card">
      <h3>Review History</h3>
      <div class="alpha-review-list">
        ${alphaState.reviews.length ? alphaState.reviews.map((review) => `
          <article class="alpha-row">
            <div>
              <strong>${escapeHtml(review.reviewer)} - ${escapeHtml(review.decision.replace(/_/g, " "))}</strong>
              <p>${escapeHtml(review.feedback)}</p>
            </div>
            <span class="alpha-audit-time">${formatTime(review.createdAt)}</span>
          </article>
        `).join("") : `<div class="alpha-empty">No review decisions yet.</div>`}
      </div>
    </section>
  `;
}

function renderAuditCard() {
  return `
    <section class="alpha-card">
      <h3>Audit + Activity</h3>
      <div class="alpha-audit-list">
        ${alphaState.audit.slice(0, 8).map((event) => `
          <article class="alpha-row">
            <span class="alpha-audit-time">${formatTime(event.at)}</span>
            <div>
              <strong>${escapeHtml(event.actor)} - ${escapeHtml(event.action.replace(/_/g, " "))}</strong>
              <p>${escapeHtml(event.summary)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function bindWorkspaceActions() {
  document.querySelectorAll(".alpha-topbar [data-action]").forEach((button) => {
    button.addEventListener("click", () => runAction(button.dataset.action, topbarPayload(button)));
  });
}

function bindRenderedActions() {
  alphaRoot.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => runAction(button.dataset.action, topbarPayload(button)));
  });
  const evidenceForm = document.querySelector("#evidenceForm");
  if (evidenceForm) {
    evidenceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(evidenceForm);
      runAction("add_evidence_link", {
        title: formData.get("title"),
        url: formData.get("url"),
      });
    });
  }
}

function topbarPayload(button) {
  return button.dataset.title ? { title: button.dataset.title } : {};
}

async function runAction(action, payload = {}) {
  if (busy) return;
  busy = true;
  setButtonsDisabled(true);
  setStatus(`Running ${action.replace(/_/g, " ")}...`, "neutral");
  try {
    const response = await fetch("/api/alpha/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        action,
        personaId: activePersona,
        payload,
      }),
    });
    const data = await response.json();
    if (data.state) {
      alphaState = data.state;
      render();
    }
    const result = data.result || { ok: response.ok, message: data.error || "Action completed." };
    setStatus(result.message, result.ok ? "success" : "error");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    busy = false;
    setButtonsDisabled(false);
  }
}

function setButtonsDisabled(disabled) {
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function getPersona(personaId) {
  return alphaState.personas.find((persona) => persona.id === personaId) || alphaState.personas[0];
}

function statusPill(status) {
  const normalized = String(status || "unknown");
  return `<span class="alpha-status-pill status-${escapeHtml(normalized)}">${escapeHtml(normalized.replace(/_/g, " "))}</span>`;
}

function setStatus(message, tone) {
  alphaStatus.textContent = message;
  alphaStatus.className = `alpha-status-line ${tone === "error" ? "error" : tone === "success" ? "success" : ""}`.trim();
}

function formatTime(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
