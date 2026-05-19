let alphaState = null;
let activePersona = "student";
let busy = false;

const personaTabs = document.querySelector("#personaTabs");
const alphaRoot = document.querySelector("#alphaRoot");
const alphaStatus = document.querySelector("#alphaStatus");
const workspaceTitle = document.querySelector("#workspaceTitle");
const copyAlphaSummary = document.querySelector("#copyAlphaSummary");

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
  updateTopbarActions();
  alphaRoot.innerHTML = `
    <div class="alpha-column">
      ${renderMetrics()}
      ${renderNextStepCard()}
      ${renderReviewerChecklist()}
      ${renderPersonaPanel(activePersona)}
    </div>
    <div class="alpha-column">
      ${renderWalkthroughCard()}
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
      class="alpha-persona-tab ${alphaState.nextStep?.personaId === persona.id && alphaState.nextStep?.status !== "complete" ? "is-next-persona" : ""}"
      type="button"
      data-persona="${escapeHtml(persona.id)}"
      aria-selected="${persona.id === activePersona ? "true" : "false"}"
    >
      <strong>${escapeHtml(persona.label)}</strong>
      <span>${escapeHtml(persona.scope)}</span>
      ${alphaState.nextStep?.personaId === persona.id && alphaState.nextStep?.status !== "complete" ? `<em class="alpha-persona-next">Next</em>` : ""}
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

function renderNextStepCard() {
  const next = alphaState.nextStep || {};
  const complete = next.status === "complete";
  const owner = next.personaLabel || getPersona(next.personaId).label;
  return `
    <section class="alpha-card alpha-next-card ${complete ? "is-complete" : ""}">
      <div>
        <p class="alpha-kicker">Act next</p>
        <h3>${escapeHtml(next.label || "Next alpha step")}</h3>
      </div>
      <p>${escapeHtml(next.detail || "Follow the next ready workflow step.")}</p>
      <div class="alpha-next-meta">
        <span class="alpha-chip">${escapeHtml(owner)}</span>
        <span class="alpha-chip">${escapeHtml(complete ? "Complete" : "Ready now")}</span>
      </div>
      <div class="alpha-next-actions">
        ${renderNextStepControls(next)}
      </div>
    </section>
  `;
}

function renderNextStepControls(next) {
  if (!next?.action && next?.personaId && next.personaId !== activePersona) {
    return `<button class="alpha-button alpha-button-primary" data-persona-switch="${escapeHtml(next.personaId)}" type="button">Switch to ${escapeHtml(next.personaLabel)}</button>`;
  }
  if (!next?.action) {
    return `<span class="alpha-action-hint">Use the matching form on this workspace to continue.</span>`;
  }
  if (next.personaId && next.personaId !== activePersona) {
    return `<button class="alpha-button alpha-button-primary" data-persona-switch="${escapeHtml(next.personaId)}" type="button">Switch to ${escapeHtml(next.personaLabel)}</button>`;
  }
  return actionButton(next.action, next.actionLabel || "Run Next Step", {
    primary: true,
    danger: next.action === "reset_alpha",
  });
}

function renderReviewerChecklist() {
  const steps = Array.isArray(alphaState.walkthrough) ? alphaState.walkthrough : [];
  const provider = alphaState.evidenceProvider || {};
  const readySteps = steps.filter((step) => step.status === "ready").length;
  const lockedSteps = steps.filter((step) => step.status === "locked").length;
  const checks = [
    {
      label: "Server state",
      status: alphaState.lastUpdated ? "pass" : "waiting",
      detail: alphaState.lastUpdated ? `Updated ${formatTime(alphaState.lastUpdated)}` : "Waiting for D1-backed state.",
    },
    {
      label: "Demo boundary",
      status: /seeded demo personas/i.test(alphaState.alphaBoundary || "") ? "pass" : "fail",
      detail: "No production accounts or real student records.",
    },
    {
      label: "Next action",
      status: alphaState.nextStep?.id ? "pass" : "waiting",
      detail: alphaState.nextStep?.status === "complete" ? "Walkthrough complete; reset to replay." : `${alphaState.nextStep?.personaLabel || "Reviewer"} owns ${alphaState.nextStep?.label || "the next step"}.`,
    },
    {
      label: "Evidence metadata",
      status: alphaState.evidence?.length > 0 ? "pass" : "waiting",
      detail: `${alphaState.evidence?.length || 0} evidence item${alphaState.evidence?.length === 1 ? "" : "s"} linked.`,
    },
    {
      label: "Upload hardening",
      status: provider.fileBytesReady ? "pass" : "waiting",
      detail: provider.fileBytesReady ? "File uploads are marked ready." : "File-byte upload remains explicitly pending.",
    },
    {
      label: "Audit trail",
      status: alphaState.audit?.length > 0 ? "pass" : "waiting",
      detail: `${alphaState.audit?.length || 0} activity event${alphaState.audit?.length === 1 ? "" : "s"} recorded.`,
    },
  ];

  return `
    <section class="alpha-card">
      <div class="alpha-card-heading-row">
        <h3>Reviewer Checks</h3>
        <span class="alpha-chip">${readySteps} ready / ${lockedSteps} locked</span>
      </div>
      <div class="alpha-check-list">
        ${checks.map((check) => `
          <article class="alpha-check check-${escapeHtml(check.status)}">
            <span class="alpha-check-dot" aria-hidden="true"></span>
            <div>
              <strong>${escapeHtml(check.label)}</strong>
              <p>${escapeHtml(check.detail)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
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
        ${actionButton("save_draft", "Save Draft")}
        ${actionButton("submit_proposal", "Submit", { primary: true })}
        ${actionButton("resubmit_revision", "Resubmit Revision")}
      </div>
      ${renderActionHint(["save_draft", "submit_proposal", "resubmit_revision"])}
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
        ${actionButton("request_revision", "Request Revision")}
        ${actionButton("approve_submission", "Approve", { primary: true })}
      </div>
      ${renderActionHint(["request_revision", "approve_submission"])}
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
        ${actionButton("mark_meeting_held", "Mark Held", { primary: true })}
        ${actionButton("flag_presentation_risk", "Flag Slot Risk")}
      </div>
      ${renderActionHint(["mark_meeting_held", "flag_presentation_risk"])}
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
        ${actionButton("queue_archive_export", "Queue Archive Export", { primary: true })}
        ${actionButton("add_deadline_notice", "Add Deadline Notice", { title: "Proposal revisions due Friday" })}
      </div>
      ${renderActionHint(["queue_archive_export", "add_deadline_notice"])}
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
        ${actionButton("run_readiness_report", "Run Readiness Report", { primary: true })}
        ${actionButton("approve_submission", "Try Restricted Approval", { allowPermissionProbe: true })}
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
  const reason = clientActionBlockReason("add_evidence_link");
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
        <button class="alpha-button alpha-button-primary" type="submit" ${reason || busy ? "disabled" : ""} ${reason ? `title="${escapeHtml(reason)}"` : ""}>Attach Evidence Link</button>
      </form>
      ${reason ? `<p class="alpha-action-hint">${escapeHtml(reason)}</p>` : ""}
    </section>
  `;
}

function renderWalkthroughCard() {
  const steps = Array.isArray(alphaState.walkthrough) ? alphaState.walkthrough : [];
  const doneCount = steps.filter((step) => step.status === "done").length;
  const completion = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  return `
    <section class="alpha-card">
      <div class="alpha-card-heading-row">
        <h3>Walkthrough Progress</h3>
        <span class="alpha-chip">${completion}% - ${doneCount}/${steps.length || 8} done</span>
      </div>
      <div class="alpha-walkthrough-list">
        ${steps.map((step, index) => `
          <article class="alpha-walkthrough-step status-${escapeHtml(step.status)} ${alphaState.nextStep?.id === step.id ? "is-next" : ""}" ${alphaState.nextStep?.id === step.id ? `aria-current="step"` : ""}>
            <span class="alpha-walkthrough-number">${index + 1}</span>
            <div>
              <strong>${escapeHtml(step.label)}</strong>
              <p>${escapeHtml(step.detail)}</p>
            </div>
            <span class="alpha-chip">${escapeHtml(step.status)}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderEvidenceCard() {
  return `
    <section class="alpha-card">
      <h3>Evidence</h3>
      ${renderEvidenceProviderStatus()}
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

function renderEvidenceProviderStatus() {
  const provider = alphaState.evidenceProvider || {};
  return `
    <div class="alpha-provider-card" aria-label="Evidence provider readiness">
      <div>
        <strong>${escapeHtml((provider.provider || "google_drive").replace(/_/g, " "))}</strong>
        <p>${escapeHtml(provider.message || "Evidence metadata is available for alpha review.")}</p>
      </div>
      <div class="alpha-provider-pills">
        ${provider.metadataReady ? `<span class="alpha-chip">Metadata ready</span>` : `<span class="alpha-chip status-revision_requested">Metadata pending</span>`}
        ${provider.fileBytesReady ? `<span class="alpha-chip status-approved">Uploads ready</span>` : `<span class="alpha-chip status-draft">File upload pending</span>`}
        ${provider.signedRetrievalReady ? `<span class="alpha-chip status-approved">Retrieval ready</span>` : `<span class="alpha-chip status-draft">Signed retrieval pending</span>`}
      </div>
    </div>
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
  copyAlphaSummary.addEventListener("click", copyCurrentAlphaSummary);
}

function bindRenderedActions() {
  alphaRoot.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => runAction(button.dataset.action, topbarPayload(button)));
  });
  alphaRoot.querySelectorAll("[data-persona-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      activePersona = button.dataset.personaSwitch;
      render();
      setStatus(`Switched to ${getPersona(activePersona).label} for the next alpha step.`, "neutral");
    });
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
  if (action === "reset_alpha" && !confirmAlphaReset()) {
    setStatus("Reset canceled. Current alpha state was left unchanged.", "neutral");
    return;
  }
  busy = true;
  updateTopbarActions();
  setRenderedButtonsBusy(true);
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
    render();
  }
}

function confirmAlphaReset() {
  if (typeof window === "undefined" || typeof window.confirm !== "function") return true;
  return window.confirm("Reset the alpha walkthrough back to the seeded demo state?");
}

function setRenderedButtonsBusy(isBusy) {
  document.querySelectorAll("button").forEach((button) => {
    if (isBusy) button.disabled = true;
  });
}

function getPersona(personaId) {
  return alphaState.personas.find((persona) => persona.id === personaId) || alphaState.personas[0];
}

function statusPill(status) {
  const normalized = String(status || "unknown");
  return `<span class="alpha-status-pill status-${escapeHtml(normalized)}">${escapeHtml(normalized.replace(/_/g, " "))}</span>`;
}

function actionButton(action, label, options = {}) {
  const reason = clientActionBlockReason(action, options);
  const classes = ["alpha-button"];
  if (options.primary) classes.push("alpha-button-primary");
  if (options.danger) classes.push("alpha-button-danger");
  return `
    <button
      class="${classes.join(" ")}"
      data-action="${escapeHtml(action)}"
      ${options.title ? `data-title="${escapeHtml(options.title)}"` : ""}
      type="button"
      ${busy || reason ? "disabled" : ""}
      ${reason ? `title="${escapeHtml(reason)}"` : ""}
    >${escapeHtml(label)}</button>
  `;
}

function renderActionHint(actions) {
  const available = actions.filter((action) => !clientActionBlockReason(action, { skipPermission: true }));
  if (available.length > 0) {
    return `<p class="alpha-action-hint">Available now: ${available.map((action) => escapeHtml(action.replace(/_/g, " "))).join(", ")}.</p>`;
  }
  return `<p class="alpha-action-hint">No workflow action is available at this state; switch personas or reset the alpha to replay the path.</p>`;
}

function updateTopbarActions() {
  document.querySelectorAll(".alpha-topbar [data-action]").forEach((button) => {
    const reason = clientActionBlockReason(button.dataset.action);
    button.disabled = busy || Boolean(reason);
    button.title = reason || "";
  });
}

async function copyCurrentAlphaSummary() {
  if (!alphaState) {
    setStatus("No alpha state summary is available yet.", "neutral");
    return;
  }

  const summary = alphaSummaryText();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
      setStatus("Alpha walkthrough summary copied to clipboard.", "success");
      return;
    }
  } catch {
    // Clipboard access can be blocked in local preview contexts.
  }
  setStatus(summary, "success");
}

function alphaSummaryText() {
  const metrics = alphaState.metrics || {};
  const next = alphaState.nextStep || {};
  return [
    `Alpha status: ${alphaState.proposal?.status || "unknown"}`,
    `Next: ${next.personaLabel || "Reviewer"} - ${next.label || "No next step"}`,
    `Metrics: submitted ${metrics.submittedCount || 0}, revision ${metrics.revisionCount || 0}, approved ${metrics.approvedCount || 0}, evidence ${metrics.evidenceCount || 0}`,
    `Audit events: ${alphaState.audit?.length || 0}`,
    "Boundary: seeded demo personas only; no real student data.",
  ].join(" | ");
}

const CLIENT_PERMISSIONS = {
  add_evidence_link: ["student"],
  submit_proposal: ["student"],
  save_draft: ["student"],
  resubmit_revision: ["student"],
  request_revision: ["program_teacher"],
  approve_submission: ["program_teacher"],
  mark_meeting_held: ["mentor"],
  flag_presentation_risk: ["mentor"],
  queue_archive_export: ["admin"],
  add_deadline_notice: ["admin"],
  run_readiness_report: ["misc_admin", "admin"],
  reset_alpha: ["admin"],
};

function clientActionBlockReason(action, options = {}) {
  if (!alphaState) return "";
  if (!options.skipPermission && !options.allowPermissionProbe && CLIENT_PERMISSIONS[action] && !CLIENT_PERMISSIONS[action].includes(activePersona)) {
    return `${getPersona(activePersona).label} cannot run ${action.replace(/_/g, " ")} in the alpha permission model.`;
  }

  const proposalStatus = alphaState.proposal?.status || "draft";
  if (action === "save_draft" && proposalStatus === "approved") return "Draft save is locked after approval. Reset the alpha if you need to replay the draft path.";
  if (action === "submit_proposal" && proposalStatus !== "draft") return "Submit is only available while the proposal is still a draft.";
  if (action === "submit_proposal" && (!Array.isArray(alphaState.evidence) || alphaState.evidence.length === 0)) return "Submit blocked until at least one evidence link or upload metadata record is attached.";
  if (action === "request_revision" && proposalStatus !== "submitted") return "Teacher revision requests are only available after the student submits.";
  if (action === "approve_submission" && proposalStatus !== "submitted") return "Teacher approval is only available for a submitted proposal.";
  if (action === "resubmit_revision" && proposalStatus !== "revision_requested") return "Resubmit Revision unlocks after the teacher requests a revision.";
  if (action === "mark_meeting_held" && proposalStatus !== "approved") return "Mentor meeting attendance unlocks after the proposal is approved.";
  if (action === "mark_meeting_held" && alphaState.meeting?.status === "held") return "Mentor meeting attendance has already been recorded.";
  if (action === "flag_presentation_risk" && alphaState.meeting?.status !== "held") return "Presentation slot risk can be flagged after the mentor meeting is recorded.";
  if (action === "flag_presentation_risk" && alphaState.presentation?.conflict) return "Presentation slot risk is already flagged.";
  if (action === "queue_archive_export" && proposalStatus !== "approved") return "Archive export queue unlocks after proposal approval.";
  if (action === "queue_archive_export" && alphaState.exportRequest?.status === "queued") return "Archive export is already queued for this alpha record.";
  return "";
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
