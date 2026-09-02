function renderStudentSection(options = {}) {
  const result = currentData.dashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("My Capstone", "your project records");
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <h2>My Capstone is unavailable</h2>
        <p>We could not load your project progress.</p>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "Your project records did not load.",
          owner: "Program Teacher",
            nextAction: "Refresh this page. Ask your Program Teacher for help if this keeps happening.",
        })}
      </section>
    `;
  }

  const requirements = dashboard.requirements || [];
  const submissions = dashboard.submissions || [];
  const evidence = dashboard.evidence || [];
  const feedback = dashboard.feedback || [];
  const summary = studentProgressSummary(dashboard);
  const nextSteps = Array.isArray(dashboard.nextSteps) ? dashboard.nextSteps : [];
  const project = dashboard.project || null;
  const archiveNextAction = studentArchivePrimaryNextAction(unwrap(currentData.archiveReadiness));
  const activeSubmissionFilter = studentSubmissionFilterKey(studentSubmissionFilter);
  const filteredSubmissions = filterStudentSubmissionRows(submissions, activeSubmissionFilter);
  const previewingStudent = isViewAsStudentActive();
  const context = {
    dashboard,
    requirements,
    submissions,
    evidence,
    feedback,
    summary,
    nextSteps,
    project,
    archiveNextAction,
    activeSubmissionFilter,
    filteredSubmissions,
    previewingStudent,
  };
  const view = studentSectionView(options);
  if (view === "work") return renderStudentMyWorkScreen(context);
  if (view === "feedback") return renderStudentFeedbackScreen(context);
  if (view === "final-checklist") return renderStudentFinalChecklistScreen(context);
  return renderStudentTodayScreen(context);
}
function studentSectionView(options = {}) {
  const value = cleanDirectoryFilter(options?.view || "");
  if (value === "work") return "work";
  if (value === "feedback") return "feedback";
  if (value === "final-checklist") return "final-checklist";
  if (studentDisclosureState?.feedback) return "feedback";
  if (
    studentDisclosureState?.requirements
    || studentDisclosureState?.evidence
    || studentDisclosureState?.submissions
    || studentDisclosureState?.files
    || studentRequirementDetailState?.selectedRequirementId
    || studentFeedbackHistoryState?.source === "submissions"
  ) {
    return "work";
  }
  return "today";
}

function renderStudentTodayScreen(context = {}) {
  const { summary = {}, requirements = [], feedback = [], nextSteps = [], project = null, archiveNextAction = null, previewingStudent = false } = context;
  const action = studentPrimaryNextAction(summary, nextSteps, archiveNextAction);
  return `
    <section class="workspace-student-screen workspace-student-screen-today" data-student-screen="today" data-student-view-mode="${previewingStudent ? "staff-preview" : "self"}" aria-labelledby="studentTodayTitle">
      ${renderStudentTodayActionSection(action, summary)}
      ${previewingStudent ? renderViewAsStudentReadOnlyNotice() : ""}
      ${renderStudentProjectTeam(project)}
      ${renderStudentTodaySupportDetails({ summary, requirements, feedback, nextSteps })}
    </section>
  `;
}

function renderStudentMyWorkScreen(context = {}) {
  const {
    dashboard = {},
    summary = {},
    requirements = [],
    submissions = [],
    evidence = [],
    feedback = [],
    filteredSubmissions = [],
    activeSubmissionFilter = "all",
    project = null,
    previewingStudent = false,
  } = context;
  return `
    <section class="workspace-student-screen workspace-student-screen-work" data-student-screen="work" data-student-view-mode="${previewingStudent ? "staff-preview" : "self"}" aria-labelledby="studentMyWorkTitle">
      ${renderStudentScreenHeader({
        kicker: "My Project",
        title: project?.name || "My Project",
        titleId: "studentMyWorkTitle",
        question: "Pick one step. Do the work. Turn it in.",
        badgeHtml: studentStatusBadge(summary.currentStatus),
        primaryHtml: renderStudentRouteButton("student", "Back to Today", "workspace-button-secondary", "data-student-primary-action=\"back-to-today\""),
      })}
      <section class="workspace-student-section" data-student-work-section="current" aria-labelledby="studentCurrentWorkTitle">
        <div class="workspace-student-section-head">
          <div>
            <p class="workspace-kicker">Do this next</p>
            <h2 id="studentCurrentWorkTitle">Project work</h2>
            <p>${escapeHtml(requirements.length ? "Open the first unfinished item. Add the Google Drive link it asks for. Turn it in when it is ready." : "Your teacher has not added work yet.")}</p>
          </div>
        </div>
        ${renderStudentRequirementPanelBody(requirements, summary, feedback, studentRequirementDetailState, evidence, studentFeedbackHistoryState)}
      </section>
      <details class="workspace-student-project-tools">
        <summary>
          <span><small>Project tools</small><strong>Team, Drive folder, and templates</strong></span>
          <span aria-hidden="true">+</span>
        </summary>
        <div class="workspace-student-project-tools-body">
          <div class="workspace-student-project-overview-grid">
            ${previewingStudent ? renderViewAsStudentReadOnlyNotice() : ""}
            ${renderStudentProjectTeam(project, { expanded: true })}
            ${previewingStudent ? renderStudentProjectFolder(project, { readOnly: true }) : renderStudentProjectFolder(project)}
          </div>
          ${renderStudentTemplateShelf(dashboard.templates)}
        </div>
      </details>
      ${previewingStudent ? "" : renderStudentProjectRequestPanel(unwrap(currentData.projects), project)}
      <details class="workspace-student-section workspace-student-secondary-section" data-student-work-section="submitted">
        <summary>
          <span>
            <small>Past work</small>
            <strong>Turned in</strong>
          </span>
          <b>${submissions.length}</b>
        </summary>
        <div class="workspace-student-secondary-body">
          <div class="workspace-student-section-head">
          <div>
            <p class="workspace-kicker">Turned in</p>
            <h2>Turned in</h2>
            <p>${escapeHtml(submissions.length ? "See work you started, work waiting for review, and work you need to fix." : "Work you turn in will appear here.")}</p>
          </div>
          </div>
          ${renderStudentSubmissionsPanelBody(submissions, filteredSubmissions, feedback, activeSubmissionFilter)}
        </div>
      </details>
      <details class="workspace-student-section workspace-student-secondary-section" data-student-work-section="evidence-files">
        <summary>
          <span>
            <small>Proof</small>
            <strong>Drive links</strong>
          </span>
          <b>${evidence.length}</b>
        </summary>
        <div class="workspace-student-secondary-body">
          <div class="workspace-student-section-head">
          <div>
            <p class="workspace-kicker">Files</p>
            <h2>Google Drive links</h2>
            <p>${escapeHtml(evidence.length ? "Check the Google Drive links that show your work." : "Add a Google Drive link when your work asks for it.")}</p>
          </div>
          </div>
          ${submissions.length ? renderEvidenceForms(submissions, requirements) : renderStudentEvidenceEmptyState()}
          ${renderStudentFilesPanelBody(evidence)}
        </div>
      </details>
      ${renderStudentResourceLinks(context)}
    </section>
  `;
}

function renderStudentProjectTeam(project = null, options = {}) {
  if (!project) {
    return `
      <section class="workspace-student-project-team workspace-empty-state-card" data-student-project-team="missing">
        <h2>No project is assigned yet</h2>
        <p>Ask your teacher to add you to an individual or team project.</p>
      </section>
    `;
  }
  const members = Array.isArray(project.members) ? project.members : [];
  const adultSetup = project.adultSetup && typeof project.adultSetup === "object" ? project.adultSetup : {};
  const adultOptions = unwrap(currentData.projects)?.availableProjectAdults || {};
  return `
    <section class="workspace-student-project-team" data-student-project-team="ready">
      <div>
        <p class="workspace-kicker">${members.length > 1 ? "Your team" : "Your project"}</p>
        <h2>${escapeHtml(project.name || "Senior Project")}</h2>
        <p>${escapeHtml(members.map((member) => member.displayName).join(", ") || "Your name will appear here.")}</p>
      </div>
      <div class="workspace-student-project-team-help">
        <span>${members.length} ${pluralize(members.length, "student")}</span>
        <span>${adultSetup.mentor ? `Mentor: ${adultSetup.mentor.displayName}` : "Mentor still needed"}</span>
        <span>${adultSetup.programTeacher ? `Teacher: ${adultSetup.programTeacher.displayName}` : "Program Teacher still needed"}</span>
        ${cleanWorkspaceGoogleDriveFolderUrl(project.driveFolderUrl) ? `<a href="${escapeHtml(cleanWorkspaceGoogleDriveFolderUrl(project.driveFolderUrl))}" target="_blank" rel="noopener noreferrer">Open project folder</a>` : ""}
      </div>
      ${options.expanded && members.length > 1 ? `<p class="workspace-muted">Team steps, files, and reviews are shared. Your reflections are only yours.</p>` : ""}
      ${options.expanded ? renderProjectAdultSetup(adultSetup, project.adultAssignments, {
        projectId: project.projectId,
        programId: project.programId,
        canNominate: true,
        availableProjectAdults: adultOptions,
      }) : !adultSetup.ready ? `<p class="workspace-project-wait-note">Finish the people setup in My Work. You can keep working while they answer.</p>` : ""}
    </section>
  `;
}

function renderStudentProjectFolder(project = null, options = {}) {
  if (!project?.projectId) return "";
  const folderUrl = cleanWorkspaceGoogleDriveFolderUrl(project.driveFolderUrl);
  const readOnly = Boolean(options.readOnly);
  const formHtml = `
    <form class="workspace-form" data-project-folder-form="true">
      <input type="hidden" name="projectId" value="${escapeHtml(project.projectId)}">
      <label class="workspace-label">
        Google Drive folder link
        <input class="workspace-input" name="folderUrl" type="url" inputmode="url" autocomplete="off" maxlength="2048" value="${escapeHtml(folderUrl)}" aria-describedby="studentProjectFolderLinkHelp" required>
        <small id="studentProjectFolderLinkHelp">Paste the link to your Google Drive project folder.</small>
      </label>
      <label class="workspace-checkbox-row">
        <input name="confirmLinkOpened" type="checkbox" value="true" required>
        <span>I opened this folder in Google Drive.</span>
      </label>
      <button class="workspace-button workspace-button-primary" type="submit">Save folder link</button>
    </form>
  `;
  return `
    <section class="workspace-student-project-folder workspace-card" data-student-project-folder="${folderUrl ? "ready" : "missing"}">
      <div class="workspace-student-project-folder-copy">
        <p class="workspace-kicker">Project folder</p>
        <h2>${folderUrl ? "Your Google Drive folder" : "Add your Google Drive folder"}</h2>
        ${folderUrl ? `
          <p>Your team keeps the real files in Google Drive. This app saves only the folder link.</p>
          <p class="workspace-link-check workspace-link-check-confirmed"><b>Link checked:</b> ${project.driveFolderCheckStatus === "staff_confirmed" ? "A staff member opened it." : "A project member opened it."}</p>
        ` : `
          <ol>
            <li>Make one project folder in Google Drive.</li>
            <li>Share it with your team and teacher.</li>
            <li>Copy the folder link. Paste it here.</li>
          </ol>
        `}
        <p class="workspace-muted">This app cannot open, list, copy, or manage files inside your folder. Google controls access.</p>
      </div>
      ${folderUrl ? `<a class="workspace-primary-button" href="${escapeHtml(folderUrl)}" target="_blank" rel="noopener noreferrer">Open Google Drive</a>` : ""}
      ${readOnly ? "" : folderUrl ? `
        <details class="workspace-student-project-folder-form" ${folderUrl ? "" : "open"}>
          <summary>Change folder link</summary>
          ${formHtml}
        </details>
      ` : `<div class="workspace-student-project-folder-form workspace-student-project-folder-form-open">${formHtml}</div>`}
    </section>
  `;
}

function renderStudentTemplateShelf(templates = []) {
  const rows = (Array.isArray(templates) ? templates : [])
    .map((template) => ({ ...template, templateUrl: cleanWorkspaceGoogleWorkUrl(template.templateUrl) }))
    .filter((template) => template.title && template.templateUrl);
  if (!rows.length) return "";
  return `
    <section class="workspace-student-template-shelf workspace-card" data-student-template-shelf="true" aria-labelledby="studentTemplateShelfTitle">
      <div class="workspace-student-template-head">
        <div>
          <p class="workspace-kicker">Start with a template</p>
          <h2 id="studentTemplateShelfTitle">Templates from your teacher</h2>
          <p>Open one only when the matching project step asks for it.</p>
        </div>
        <ol aria-label="How to use a template">
          <li><b>1</b> Open</li>
          <li><b>2</b> Make a copy</li>
          <li><b>3</b> Submit your link</li>
        </ol>
      </div>
      <div class="workspace-student-template-list">
        ${rows.map((template) => {
          const phase = studentBookletPhaseInfo(template.phase || "start");
          return `
            <article class="workspace-student-template-card" data-template-phase="${escapeHtml(phase.key || "start")}">
              <span>${escapeHtml(studentPhaseShortLabel(phase.key, phase.label))}</span>
              <strong>${escapeHtml(template.title)}</strong>
              <p>${escapeHtml(template.description || "Make your own copy and save it in your project folder.")}</p>
              <small class="workspace-link-check workspace-link-check-confirmed">Checked by school staff</small>
              <a class="workspace-button workspace-button-secondary workspace-button-small" href="${escapeHtml(template.templateUrl)}" target="_blank" rel="noopener noreferrer">Use template</a>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderStudentProjectRequestPanel(projectBody = {}, project = null) {
  if (!roleIds(currentUser).has("student")) return "";
  projectBody = projectBody && typeof projectBody === "object" ? projectBody : {};
  const requests = Array.isArray(projectBody.requests) ? projectBody.requests : [];
  const invitations = requests.filter((request) => (
    request.status === "submitted"
    && request.submittedByStudentId !== currentUser?.id
    && (request.members || []).some((member) => member.studentId === currentUser?.id)
  ));
  const invitationPanels = invitations.map(renderStudentProjectInvitation).join("");
  const pastOwn = requests.filter((request) => (
    request.submittedByStudentId === currentUser?.id
    && !["submitted", "changes_requested"].includes(request.status)
  ));
  const pastOwnPanel = renderStudentPastProjectIdeas(pastOwn);
  const waiting = requests.find((request) => request.status === "submitted" && request.submittedByStudentId === currentUser?.id);
  const needsChanges = requests.find((request) => request.status === "changes_requested" && request.submittedByStudentId === currentUser?.id);
  if (waiting) {
    return `
      ${invitationPanels}
      ${pastOwnPanel}
      <section class="workspace-student-project-request workspace-card" data-student-project-request="waiting">
        <p class="workspace-kicker">New project idea</p>
        <h2>Your idea is waiting for a teacher</h2>
        <p><strong>${escapeHtml(waiting.name || "Project idea")}</strong></p>
        <div class="workspace-project-invitation-list">
          ${(waiting.members || []).map((member) => `
            <div>
              <strong>${escapeHtml(member.displayName || "Student")}</strong>
              <span class="workspace-status-pill ${escapeHtml(projectInvitationTone(member.invitationStatus))}">${escapeHtml(projectInvitationLabel(member.invitationStatus, member.role))}</span>
            </div>
          `).join("")}
        </div>
        ${renderProjectAdultSetup(waiting.adultSetup, waiting.adultAssignments, {
          requestId: waiting.requestId,
          programId: waiting.programId,
          canNominate: true,
          availableProjectAdults: projectBody.availableProjectAdults || {},
        })}
        <p class="workspace-muted">A teacher can approve the idea after every teammate joins and both adults accept. Keep working in your current project while you wait.</p>
      </section>
    `;
  }
  const students = uniqueProjectStudentOptions(Array.isArray(projectBody.availableStudents) ? projectBody.availableStudents : [])
    .filter((student) => student.studentId && student.studentId !== currentUser?.id);
  const siteId = projectBody.siteId
    || project?.siteId
    || (Array.isArray(projectBody.projects) ? projectBody.projects[0]?.siteId : "")
    || selectedSiteQueryValue()
    || "";
  if (!siteId) return "";
  const priorTeammates = (Array.isArray(needsChanges?.members) ? needsChanges.members : [])
    .filter((member) => member.studentId && member.studentId !== currentUser?.id);
  const peerOptions = students.map((student) => `
    <option value="${escapeHtml(projectStudentOptionLabel(student))}"></option>
  `).join("");
  return `
    ${invitationPanels}
    ${pastOwnPanel}
    <details class="workspace-student-project-request workspace-card" data-student-project-request="form">
      <summary>${needsChanges ? "Update my project idea" : "Submit a new project idea"}</summary>
      <form class="workspace-create-project-form" data-student-project-request-form="true">
        <input type="hidden" name="siteId" value="${escapeHtml(siteId)}">
        ${needsChanges?.staffFeedback ? `
          <div class="workspace-project-request-feedback">
            <span>YOUR TEACHER SAID</span>
            <p>${escapeHtml(needsChanges.staffFeedback)}</p>
          </div>
        ` : ""}
        <p>Tell us the idea. You may invite up to four students from your school. A teacher must approve the new team.</p>
        <label>
          <span>Project name</span>
          <input name="name" type="text" maxlength="120" value="${escapeHtml(needsChanges?.name || "")}" required>
        </label>
        <label>
          <span>What will you make, improve, teach, or solve?</span>
          <textarea name="summary" maxlength="500" rows="4" required>${escapeHtml(needsChanges?.summary || "")}</textarea>
        </label>
        <datalist id="studentProjectPeerOptions">
          ${peerOptions}
        </datalist>
        <div class="workspace-project-student-pickers">
          ${[1, 2, 3, 4].map((number) => `
            <label>
              <span>Find teammate ${number} (optional)</span>
              <input
                name="studentLabel${number}"
                type="search"
                list="studentProjectPeerOptions"
                value="${escapeHtml(projectStudentOptionLabel(priorTeammates[number - 1] || {}).replace(/^Student$/, ""))}"
                aria-describedby="studentProjectPeerHelp${number}"
                autocomplete="off"
              >
              <small id="studentProjectPeerHelp${number}">Start typing a name. Then choose the student.</small>
            </label>
          `).join("")}
        </div>
        <button class="workspace-primary-button" type="submit">Send idea to my teacher</button>
        <small>No one will be moved into your group until a teacher approves it.</small>
      </form>
    </details>
  `;
}

function renderStudentPastProjectIdeas(requests = []) {
  const rows = Array.isArray(requests) ? requests : [];
  if (!rows.length) return "";
  return `
    <details class="workspace-student-project-request workspace-card workspace-project-request-history-panel">
      <summary>My past project ideas (${rows.length})</summary>
      <div class="workspace-project-request-list">
        ${rows.map((request) => `
          <article>
            <strong>${escapeHtml(request.name || "Project idea")}</strong>
            <p>${escapeHtml(projectRequestStatusLabel(request.status))}</p>
            ${request.staffFeedback ? `<p class="workspace-muted">${escapeHtml(request.staffFeedback)}</p>` : ""}
            ${renderProjectRequestHistory(request.history)}
          </article>
        `).join("")}
      </div>
    </details>
  `;
}

function renderStudentProjectInvitation(request = {}) {
  const members = Array.isArray(request.members) ? request.members : [];
  const me = members.find((member) => member.studentId === currentUser?.id) || {};
  const teammateNames = members.filter((member) => member.studentId !== currentUser?.id).map((member) => member.displayName).join(", ");
  const status = me.invitationStatus || "pending";
  return `
    <section class="workspace-student-project-request workspace-card workspace-project-invitation" data-student-project-invitation="${escapeHtml(request.requestId || "")}">
      <p class="workspace-kicker">Project invite</p>
      <h2>${escapeHtml(request.submittedByName || "A student")} invited you</h2>
      <p><strong>${escapeHtml(request.name || "Project idea")}</strong></p>
      <p>${escapeHtml(request.summary || "No project goal was added.")}</p>
      <p class="workspace-muted">Team: ${escapeHtml(teammateNames || request.submittedByName || "Student")}</p>
      ${status === "accepted"
        ? `<p class="workspace-project-ready-note">You joined. Keep using your current project until a teacher approves the new team.</p>`
        : status === "declined"
          ? `<p class="workspace-project-wait-note">You said no. You can change your answer while the idea is still waiting.</p>`
          : `<p>Do you want to join this project?</p>`}
      <form class="workspace-project-invitation-actions" data-project-invitation-form="true">
        <input type="hidden" name="requestId" value="${escapeHtml(request.requestId || "")}">
        ${status !== "accepted" ? `<button class="workspace-primary-button" type="submit" name="action" value="accept_project_invitation">Yes, join</button>` : ""}
        ${status !== "declined" ? `<button class="workspace-button workspace-button-secondary" type="submit" name="action" value="decline_project_invitation">No, do not join</button>` : ""}
      </form>
      ${renderProjectRequestHistory(request.history)}
    </section>
  `;
}

function renderStudentFeedbackScreen(context = {}) {
  const { summary = {}, feedback = [], previewingStudent = false } = context;
  const rows = Array.isArray(feedback) ? feedback : [];
  const activeFilter = studentFeedbackFilterKey(studentFeedbackFilter);
  const filteredRows = filterStudentFeedbackRows(rows, activeFilter);
  const revisionRows = rows.filter((row) => ["revision_requested", "needs_revision"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
  const pastRows = rows.filter((row) => ["approved", "complete", "completed", "archived"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
  const recentRows = rows.filter((row) => !revisionRows.includes(row) && !pastRows.includes(row)).slice(0, 5);
  return `
    <section class="workspace-student-screen workspace-student-screen-feedback" data-student-screen="feedback" data-student-view-mode="${previewingStudent ? "staff-preview" : "self"}" aria-labelledby="studentFeedbackScreenTitle">
      ${renderStudentScreenHeader({
        kicker: "Feedback",
        title: "Feedback",
        titleId: "studentFeedbackScreenTitle",
        question: "Read feedback. Fix work if asked.",
        badgeHtml: studentStatusPill(summary.revisionRequestedCount ? "revision_requested" : rows.length ? "under_review" : "pending"),
        primaryHtml: renderStudentRouteButton("studentWork", summary.revisionRequestedCount ? "Fix Work" : "View Work", "workspace-button-primary", "data-student-primary-action=\"open-feedback-work\""),
      })}
      ${previewingStudent ? renderViewAsStudentReadOnlyNotice() : ""}
      ${rows.length > 1 ? renderStudentFeedbackFilters(rows, activeFilter) : ""}
      ${activeFilter !== "all"
        ? renderStudentFeedbackLane("filtered", studentFeedbackFilterLabel(activeFilter), filteredRows, "No feedback matches this filter.")
        : `
          ${renderStudentFeedbackLane("needs-revision", "Needs changes", revisionRows, "No feedback needs changes right now.")}
          ${renderStudentFeedbackLane("recent", "New feedback", recentRows, "No feedback yet. When your teacher reviews your work, it will appear here.")}
          ${renderStudentFeedbackLane("past", "Old feedback", pastRows, "Old feedback appears here after reviews are done.")}
        `}
    </section>
  `;
}

function renderStudentFinalChecklistScreen(context = {}) {
  const { summary = {}, requirements = [], submissions = [], evidence = [], feedback = [], archiveNextAction = null, previewingStudent = false } = context;
  const rows = studentFinalChecklistRows({ summary, requirements, submissions, evidence, feedback, archiveNextAction });
  const nextMissing = rows.find((row) => row.status !== "Complete");
  const nextActionSection = nextMissing?.actionSection === "studentFeedback" ? "studentFeedback" : "studentWork";
  const nextActionLabel = nextMissing?.actionSection === "studentFeedback" ? "View Feedback" : "Continue My Project";
  return `
    <section class="workspace-student-screen workspace-student-screen-final" data-student-screen="final-checklist" data-student-view-mode="${previewingStudent ? "staff-preview" : "self"}" aria-labelledby="studentFinalChecklistTitle">
      ${renderStudentScreenHeader({
        kicker: "Final Checklist",
        title: "Final Checklist",
        titleId: "studentFinalChecklistTitle",
        question: "What is done? What still needs work?",
        badgeHtml: studentStatusPill(nextMissing ? "needs_review" : "complete"),
        primaryHtml: renderStudentRouteButton(nextMissing ? nextActionSection : "studentWork", nextMissing ? nextActionLabel : "View Work", "workspace-button-primary", "data-student-primary-action=\"open-next-missing\""),
      })}
      ${previewingStudent ? renderViewAsStudentReadOnlyNotice() : ""}
      <section class="workspace-student-section" data-student-final-checklist="true" aria-labelledby="studentFinalChecklistRowsTitle">
        <div class="workspace-student-section-head">
          <div>
            <p class="workspace-kicker">Finish checks</p>
            <h2 id="studentFinalChecklistRowsTitle">Finish checks</h2>
            <p>These rows show what is done and what still needs work.</p>
          </div>
        </div>
        <div class="workspace-list workspace-student-final-list">
          ${rows.map(renderStudentFinalChecklistRow).join("")}
        </div>
      </section>
    </section>
  `;
}

function renderStudentScreenHeader({ kicker = "", title = "My Capstone", titleId = "", question = "", badgeHtml = "", primaryHtml = "" } = {}) {
  return `
    <header class="workspace-student-screen-header">
      <div>
        ${kicker ? `<p class="workspace-kicker">${escapeHtml(kicker)}</p>` : ""}
        <h1 id="${escapeHtml(titleId || "studentScreenTitle")}">${escapeHtml(title)}</h1>
        ${question ? `<p class="workspace-student-screen-question">${escapeHtml(question)}</p>` : ""}
      </div>
      <div class="workspace-student-screen-actions">
        ${badgeHtml || ""}
        ${primaryHtml || ""}
      </div>
    </header>
  `;
}

function renderStudentRouteButton(section, label, className = "workspace-button-secondary", extraAttrs = "") {
  return `<button class="workspace-button ${escapeHtml(className)}" type="button" data-section="${escapeHtml(section)}" ${extraAttrs}>${escapeHtml(label)}</button>`;
}

function studentPrimaryRouteLabel(action = {}) {
  const status = normalizeStatus(action?.submissionStatus || action?.status);
  if (status === "revision_requested") return "Fix Work";
  if (["submitted", "under_review", "pending_review"].includes(status)) return "View Work";
  if (status === "missing" || status === "not_started") return "Start";
  return "Continue";
}

function renderStudentTodayActionSection(action = {}, summary = {}) {
  const map = studentTodayMapModel(action, summary);
  const checklist = map.lanes.slice(0, 3);
  return `
    <section class="workspace-student-section workspace-student-next-action workspace-student-next-action-hero" data-student-today-section="next-action" aria-labelledby="studentTodayTitle">
      <div class="workspace-student-focus-layout" data-student-next-action-card="true">
        <div class="workspace-student-focus-copy">
          <div class="workspace-student-focus-meta">
            <p class="workspace-kicker">Your next step</p>
            ${studentStatusPill(action.status || action.submissionStatus || "pending")}
          </div>
          <h1 id="studentTodayTitle">${escapeHtml(action.itemTitle || action.title || summary.currentPhaseLabel || "Your project work")}</h1>
          <p class="workspace-student-focus-command">${escapeHtml(studentPrimaryCommandCopy(action, summary))}</p>
          <p class="workspace-muted" data-student-next-action-path="true">${escapeHtml(studentNextActionPathCopy(action))}</p>
          <div class="workspace-row-actions workspace-student-focus-action">
            ${renderStudentTodayPrimaryAction(action, summary)}
          </div>
        </div>
        <ol class="workspace-student-focus-checklist" data-student-today-map="true" data-student-today-map-state="${escapeHtml(map.state)}" aria-label="Three steps for this item">
          ${checklist.map((step, index) => `
            <li data-student-today-map-lane="${escapeHtml(step.id)}">
              <span>${escapeHtml(index + 1)}</span>
              <div>
                <strong>${escapeHtml(step.title)}</strong>
                <small>${escapeHtml(step.detail)}</small>
              </div>
            </li>
          `).join("")}
        </ol>
      </div>
    </section>
  `;
}

function renderStudentTodayPrimaryAction(action = {}, summary = {}) {
  const status = normalizeStatus(action.status || action.submissionStatus);
  if (status === "revision_requested") {
    return renderStudentRouteButton("studentFeedback", "Read feedback", "workspace-button-primary", "data-student-primary-action=\"read-feedback\"");
  }
  if (["submitted", "under_review", "pending_review"].includes(status)) {
    return renderStudentRouteButton("studentWork", "View what I sent", "workspace-button-primary", "data-student-primary-action=\"view-sent-work\"");
  }
  const requirementId = cleanDirectoryFilter(action.requirementId || "");
  if (requirementId) {
    const label = studentPrimaryRouteLabel(action) === "Start" ? "Start this step" : "Continue this step";
    return `<button class="workspace-button workspace-button-primary" type="button" data-student-primary-action="open-current-item" data-student-requirement-action="open-detail" data-student-requirement-id="${escapeHtml(requirementId)}" aria-label="${escapeHtml(`${label}: ${studentRequirementActionLabel(action)}`)}">${escapeHtml(label)}</button>`;
  }
  if (!safeNumber(summary.requirementsTotal)) {
    return renderStudentRouteButton("studentWork", "Check My Project", "workspace-button-primary", "data-student-primary-action=\"check-project\"");
  }
  return renderStudentRouteButton("studentWork", studentPrimaryRouteLabel(action), "workspace-button-primary", "data-student-primary-action=\"continue-work\"");
}

function renderStudentTodaySupportDetails({ summary = {}, requirements = [], feedback = [], nextSteps = [] } = {}) {
  return `
    <details class="workspace-student-today-support" data-student-today-support-details="true">
      <summary>
        <span>Show progress, feedback, and checklist</span>
        <small>${escapeHtml(studentTodaySupportSummary(summary))}</small>
      </summary>
      <div class="workspace-student-today-support-stack">
        ${renderStudentProgressTracker(summary, requirements)}
        ${renderStudentTodayFeedbackSummary(feedback, summary)}
        ${renderStudentTodayUpcomingItems(nextSteps, requirements, summary)}
      </div>
    </details>
  `;
}

function studentTodaySupportSummary(summary = {}) {
  if (summary.revisionRequestedCount) return `${summary.revisionRequestedCount} feedback ${pluralize(summary.revisionRequestedCount, "item")} need changes.`;
  if (summary.waitingForReviewCount) return `${summary.waitingForReviewCount} ${pluralize(summary.waitingForReviewCount, "item")} waiting for teacher review.`;
  if (summary.missingRequiredCount) return `${summary.missingRequiredCount} ${pluralize(summary.missingRequiredCount, "item")} still need work.`;
  if (summary.requirementsTotal) return `${summary.requirementsComplete} of ${summary.requirementsTotal} checklist ${pluralize(summary.requirementsTotal, "item")} done.`;
  return "Checklist details appear after work is assigned.";
}

function studentConservativeStatusText(value, fallback = "Not confirmed yet") {
  const normalized = normalizeStatus(value);
  if (!normalized || normalized === "unknown") return fallback;
  if (normalized === "not_started") return "Not started";
  return studentStatusText(normalized);
}

function studentNextActionPathCopy(action = {}) {
  const status = normalizeStatus(action.status || action.submissionStatus);
  if (status === "revision_requested") return "Read your feedback. Fix your work. Turn it in again.";
  if (["submitted", "under_review", "pending_review"].includes(status)) return "View what you sent. Wait for your teacher.";
  if (["failed", "provider_unavailable", "expired", "expiring_soon"].includes(status)) return "Ask for help before changing final-file work.";
  if (action?.requirementId || action?.submissionId) return "Open the matching item in My Project.";
  return "Use My Project before starting anything new.";
}

function studentTodayMapState(action = {}, summary = {}) {
  const status = normalizeStatus(action.submissionStatus || action.status);
  if (status === "revision_requested" || safeNumber(summary.revisionRequestedCount)) return "needs-changes";
  if (["submitted", "under_review", "pending_review"].includes(status) || safeNumber(summary.waitingForReviewCount)) return "waiting-review";
  if (!safeNumber(summary.requirementsTotal) && !action.requirementId && !action.submissionId && !safeNumber(summary.missingRequiredCount)) return "no-work-yet";
  if (["draft", "missing", "not_started", "pending"].includes(status) || safeNumber(summary.missingRequiredCount)) return "needs-work";
  if (
    safeNumber(summary.requirementsTotal)
    && safeNumber(summary.requirementsComplete) >= safeNumber(summary.requirementsTotal)
    && !safeNumber(summary.revisionRequestedCount)
    && !safeNumber(summary.waitingForReviewCount)
    && !safeNumber(summary.missingRequiredCount)
  ) {
    return "caught-up";
  }
  return "needs-work";
}

function studentTodayMapModel(action = {}, summary = {}) {
  const state = studentTodayMapState(action, summary);
  if (state === "needs-changes") {
    return {
      state,
      title: "Read feedback, then fix the item",
      detail: "Start with the teacher note before changing the work or its Drive link.",
      lanes: [
        {
          id: "read-feedback",
          label: "First",
          title: "Read feedback first",
          detail: "Find the note that asks for changes.",
          actionsHtml: renderStudentRouteButton("studentFeedback", "Open Feedback", "workspace-button-secondary"),
        },
        {
          id: "fix-work",
          label: "Next",
          title: "Fix the item",
          detail: "Open the matching item in My Work and update only that work.",
          actionsHtml: renderStudentRouteButton("studentWork", "Fix Work", "workspace-button-primary"),
        },
        {
          id: "turn-in-again",
          label: "Done when",
          title: "Turn it in again",
          detail: "Stop when the item is back with your teacher.",
          actionsHtml: "",
        },
      ],
    };
  }
  if (state === "waiting-review") {
    return {
      state,
      title: "Your teacher is reviewing this",
      detail: "Check what you sent once, then wait for feedback or approval before starting the next item.",
      lanes: [
        {
          id: "view-sent-work",
          label: "Check",
          title: "View what you sent",
          detail: "Use My Project if you need to confirm the Google Drive link.",
          actionsHtml: renderStudentRouteButton("studentWork", "View Work", "workspace-button-secondary"),
        },
        {
          id: "wait",
          label: "Then",
          title: "Wait for your teacher",
          detail: "Do not upload another copy unless your teacher asks.",
          actionsHtml: "",
        },
        {
          id: "watch-feedback",
          label: "Later",
          title: "Check feedback later",
          detail: "If changes appear, come back and fix only the item named there.",
          actionsHtml: renderStudentRouteButton("studentFeedback", "Open Feedback", "workspace-button-secondary"),
        },
      ],
    };
  }
  if (state === "caught-up") {
    return {
      state,
      title: "You are caught up for now",
      detail: "Use this time to check feedback, final checklist items, or ask if something seems missing.",
      lanes: [
        {
          id: "check-feedback",
          label: "Check",
          title: "Check feedback",
          detail: "Make sure no note asks for changes.",
          actionsHtml: renderStudentRouteButton("studentFeedback", "Open Feedback", "workspace-button-secondary"),
        },
        {
          id: "check-finish",
          label: "Finish",
          title: "Check final readiness",
          detail: "Use the final checklist only after required work is handled.",
          actionsHtml: renderStudentRouteButton("studentFinalChecklist", "Open Final Checklist", "workspace-button-secondary"),
        },
        {
          id: "ask-if-missing",
          label: "If unsure",
          title: "Ask your teacher",
          detail: "Ask before starting a new phase that does not appear in My Work.",
          actionsHtml: "",
        },
      ],
    };
  }
  if (state === "no-work-yet") {
    return {
      state,
      title: "Wait for your teacher to add work",
      detail: "Your first assigned item will appear in My Work before you start.",
      lanes: [
        {
          id: "open-work",
          label: "Check",
          title: "Check My Work",
          detail: "Open My Work to see whether an item has been added.",
          actionsHtml: renderStudentRouteButton("studentWork", "Open My Work", "workspace-button-secondary"),
        },
        {
          id: "ask-teacher",
          label: "Ask",
          title: "Ask what comes first",
          detail: "Ask your teacher which project item should appear here.",
          actionsHtml: "",
        },
        {
          id: "do-not-skip",
          label: "Wait",
          title: "Do not skip ahead",
          detail: "Start a new phase only when it appears in My Work.",
          actionsHtml: "",
        },
      ],
    };
  }
  return {
    state,
    title: "Start the listed item",
    detail: "Open the item, add its Google Drive link if asked, then turn it in when ready.",
    lanes: [
      {
        id: "open-item",
        label: "Start",
        title: "Open My Work",
        detail: "Use the item named at the top before opening anything else.",
        actionsHtml: renderStudentRouteButton("studentWork", "Open My Work", "workspace-button-primary"),
      },
      {
        id: "add-file",
        label: "Then",
        title: "Add what it asks for",
        detail: "Add the Google Drive link that matches the item.",
        actionsHtml: "",
      },
      {
        id: "turn-in",
        label: "Done when",
        title: "Turn it in",
        detail: "Stop when the item says it is waiting for teacher review.",
        actionsHtml: "",
      },
    ],
  };
}

function renderStudentTodayMap(action = {}, summary = {}) {
  const model = studentTodayMapModel(action, summary);
  return `
    <section class="workspace-student-today-map" data-student-today-map="true" data-student-today-map-state="${escapeHtml(model.state)}" aria-labelledby="studentTodayMapTitle">
      <div class="workspace-student-today-map-head">
        <span>Next step map</span>
        <h2 id="studentTodayMapTitle">${escapeHtml(model.title)}</h2>
        <p>${escapeHtml(model.detail)}</p>
      </div>
      <div class="workspace-student-today-map-lanes">
        ${model.lanes.map((lane) => `
          <article class="workspace-student-today-map-lane" data-student-today-map-lane="${escapeHtml(lane.id)}">
            <span>${escapeHtml(lane.label)}</span>
            <strong>${escapeHtml(lane.title)}</strong>
            <p>${escapeHtml(lane.detail)}</p>
            ${lane.actionsHtml ? `<div class="workspace-row-actions">${lane.actionsHtml}</div>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStudentProgressTracker(summary = {}, requirements = []) {
  return `
    <section class="workspace-student-section workspace-student-progress-tracker" data-student-today-section="progress" aria-labelledby="studentProgressTrackerTitle">
      <div class="workspace-student-section-head">
        <div>
          <p class="workspace-kicker">Progress</p>
          <h2 id="studentProgressTrackerTitle">Progress</h2>
          <p>${escapeHtml(summary.requirementsTotal ? `${summary.requirementsComplete} of ${summary.requirementsTotal} capstone items are complete.` : "Your teacher has not added capstone work yet.")}</p>
        </div>
        <div class="workspace-student-progress-number">
          <strong>${escapeHtml(summary.completionPercent)}%</strong>
          <span>complete</span>
        </div>
      </div>
      <div class="workspace-student-progress-meter" role="progressbar" aria-label="Overall capstone completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${escapeHtml(summary.completionPercent)}">
        ${renderProgressSvg(summary.completionPercent)}
      </div>
      <div class="workspace-student-summary-grid">
        ${renderStudentSummaryTile("Done", `${summary.requirementsComplete} of ${summary.requirementsTotal || 0}`, summary.requirementsTotal ? "Items your teacher marked done." : "No checklist items yet.", "student")}
        ${renderStudentSummaryTile("Waiting", `${summary.waitingForReviewCount}`, summary.waitingForReviewCount ? "Your teacher is checking this work." : "Nothing is waiting right now.", summary.waitingForReviewCount ? "teacher" : "student")}
        ${renderStudentSummaryTile("Needs changes", `${summary.revisionRequestedCount + summary.missingRequiredCount}`, summary.revisionRequestedCount ? "Read feedback. Fix the work." : summary.missingRequiredCount ? "Finish missing work." : "Nothing needs changes right now.", summary.revisionRequestedCount ? "danger" : summary.missingRequiredCount ? "warning" : "student")}
      </div>
      ${renderStudentPhasePath(summary, requirements)}
    </section>
  `;
}

function renderStudentTodayFeedbackSummary(feedback = [], summary = {}) {
  const rows = Array.isArray(feedback) ? feedback : [];
  const revisionRows = rows.filter((row) => ["revision_requested", "needs_revision"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
  const label = revisionRows.length ? "Needs changes" : "New feedback";
  const visibleRows = revisionRows.length ? revisionRows.slice(0, 2) : rows.slice(0, 2);
  return `
    <section class="workspace-student-section" data-student-today-section="feedback" aria-labelledby="studentTodayFeedbackTitle">
      <div class="workspace-student-section-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(label)}</p>
          <h2 id="studentTodayFeedbackTitle">${escapeHtml(label)}</h2>
          <p>${escapeHtml(revisionRows.length ? "Read your feedback. Then fix your work." : rows.length ? "New notes appear here. Open Feedback to read more." : "No feedback yet. When your teacher reviews your work, it will appear here.")}</p>
        </div>
        ${renderStudentRouteButton("studentFeedback", "Open Feedback", "workspace-button-secondary")}
      </div>
      <div class="workspace-list workspace-student-compact-list">
        ${visibleRows.length ? visibleRows.map((row) => renderStudentCompactFeedbackRow(row)).join("") : `
          <article class="workspace-empty-state-card" data-student-feedback-empty="true">
            <strong>No feedback yet.</strong>
            <p>When your teacher reviews your work, it will appear here.</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderStudentTodayUpcomingItems(nextSteps = [], requirements = [], summary = {}) {
  const includedIds = new Set();
  const rows = [
    ...(Array.isArray(nextSteps) ? nextSteps : []),
    ...(Array.isArray(requirements) ? requirements : []).filter((row) => !isStudentRequirementComplete(row?.status)),
  ].filter((row) => {
    const key = cleanDirectoryFilter(row?.requirementId || row?.requirement_id || row?.title || row?.requirementTitle || "");
    if (key && includedIds.has(key)) return false;
    if (key) includedIds.add(key);
    return true;
  }).slice(0, 4);
  return `
    <section class="workspace-student-section" data-student-today-section="upcoming" aria-labelledby="studentUpcomingItemsTitle">
      <div class="workspace-student-section-head">
        <div>
          <p class="workspace-kicker">Missing work</p>
          <h2 id="studentUpcomingItemsTitle">Missing work</h2>
          <p>${escapeHtml(rows.length ? "Open one item at a time. Turn it in only when its Google Drive link matches." : summary.waitingForReviewCount ? "No missing work is listed. Wait for your teacher." : "You are caught up right now.")}</p>
        </div>
        ${renderStudentRouteButton("studentFinalChecklist", "Open Final Checklist", "workspace-button-secondary")}
      </div>
      <div class="workspace-list workspace-student-compact-list">
        ${rows.length ? rows.map(renderStudentUpcomingRow).join("") : `
          <article class="workspace-empty-state-card">
            <strong>You are caught up right now.</strong>
            <p>Ask your teacher if you think an item is missing.</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderStudentMissingWorkSection(requirements = [], summary = {}) {
  const missingRows = (Array.isArray(requirements) ? requirements : [])
    .filter((row) => !isStudentRequirementComplete(row?.status))
    .slice(0, 4);
  return `
      <section class="workspace-student-section" data-student-work-section="missing" aria-labelledby="studentMissingWorkTitle">
        <div class="workspace-student-section-head">
          <div>
            <p class="workspace-kicker">Missing work</p>
            <h2 id="studentMissingWorkTitle">Missing work</h2>
            <p>${escapeHtml(missingRows.length ? "Start with the first item. Ask your teacher if you are not sure." : "You are caught up right now.")}</p>
          </div>
        </div>
        <div class="workspace-list workspace-student-compact-list">
          ${missingRows.length ? missingRows.map((row) => `
            <article class="workspace-row workspace-student-missing-row" data-student-missing-work-row="true">
              <div>
                <strong>${escapeHtml(row?.title || row?.requirementTitle || "Capstone work")}</strong>
                <p>${escapeHtml(studentInstructionCopy(row?.nextAction || row?.detail || "Open this item and continue your work."))}</p>
                <p class="workspace-muted">${escapeHtml(studentDueText(row, "Due date not listed"))}</p>
              </div>
              <div class="workspace-row-actions">
                ${renderStudentStepButtons(row, "Open")}
                ${studentStatusPill(row?.submissionStatus || row?.status || "missing")}
              </div>
            </article>
          `).join("") : `
            <article class="workspace-empty-state-card" data-student-missing-work-empty="true">
              <strong>You are caught up right now.</strong>
              <p>${escapeHtml(summary.waitingForReviewCount ? "Wait for your teacher to review your work." : "Ask your teacher if you think something is missing.")}</p>
            </article>
          `}
        </div>
      </section>
  `;
}

function renderStudentUpcomingRow(item = {}) {
  const status = item?.submissionStatus || item?.status || "missing";
  return `
    <article class="workspace-row workspace-student-upcoming-row" data-student-upcoming-row="true">
      <div>
        <strong>${escapeHtml(item.title || item.requirementTitle || item.requirement_title || "Capstone item")}</strong>
        <p>${escapeHtml(studentInstructionCopy(item.detail || item.nextAction || "Open this item and continue your work."))}</p>
        <p class="workspace-muted">${escapeHtml(studentDueText(item, "Due date not listed"))}</p>
      </div>
      <div class="workspace-row-actions">
        ${renderStudentStepButtons(item, "Open item")}
        ${studentStatusPill(status)}
      </div>
    </article>
  `;
}

function renderStudentCompactFeedbackRow(item = {}) {
  const status = item?.submissionStatus || item?.status || "under_review";
  return `
    <article class="workspace-row workspace-student-feedback-row" data-student-feedback-compact-row="true">
      <div>
        <strong>${escapeHtml(item.requirementTitle || "Capstone feedback")}</strong>
        <p>${escapeHtml(item.message || "Feedback was recorded for this work.")}</p>
        <p class="workspace-muted">${escapeHtml(item.authorName || "Program Teacher")} / ${escapeHtml(formatDate(item.createdAt || item.created_at))}</p>
      </div>
      <div class="workspace-row-actions">
        ${studentStatusPill(status)}
      </div>
    </article>
  `;
}

function renderStudentFeedbackLane(id, title, rows = [], emptyText = "") {
  const safeRows = Array.isArray(rows) ? rows : [];
  return `
    <section class="workspace-student-section" data-student-feedback-lane="${escapeHtml(id)}" aria-labelledby="studentFeedbackLane${escapeHtml(id)}">
      <div class="workspace-student-section-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(title)}</p>
          <h2 id="studentFeedbackLane${escapeHtml(id)}">${escapeHtml(title)}</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${safeRows.length ? safeRows.map((row) => renderStudentFeedbackRow(row, studentFeedbackHistoryState)).join("") : `
          <article class="workspace-empty-state-card" data-student-feedback-empty="true">
            <strong>${escapeHtml(title === "New feedback" ? "No feedback yet." : `No ${title.toLowerCase()} right now.`)}</strong>
            <p>${escapeHtml(emptyText || "Feedback appears after review.")}</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderStudentResourceLinks(context = {}) {
  const { dashboard = {} } = context;
  const resources = Array.isArray(dashboard.resources) ? dashboard.resources : [];
  const safeLinks = resources
    .map((resource) => ({
      title: String(resource?.title || resource?.label || "").trim(),
      url: cleanWorkspaceHttpsUrl(resource?.url || resource?.href || ""),
      detail: String(resource?.detail || resource?.description || "").trim(),
    }))
    .filter((resource) => resource.title && resource.url)
    .slice(0, 4);
  if (!safeLinks.length) return "";
  return `
    <section class="workspace-student-section" data-student-work-section="resources" aria-labelledby="studentResourcesTitle">
      <div class="workspace-student-section-head">
        <div>
          <p class="workspace-kicker">Resources / Links</p>
          <h2 id="studentResourcesTitle">Resources / Links</h2>
        </div>
      </div>
      <div class="workspace-list">
        ${safeLinks.map((resource) => `
          <article class="workspace-row" data-student-resource-row="true">
            <div>
              <strong>${escapeHtml(resource.title)}</strong>
              ${resource.detail ? `<p>${escapeHtml(resource.detail)}</p>` : ""}
            </div>
            <div class="workspace-row-actions">
              <a class="workspace-link-button workspace-link-button-small" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Open link</a>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function studentFinalChecklistRows({ summary = {}, requirements = [], submissions = [], evidence = [], feedback = [], archiveNextAction = null } = {}) {
  const requirementRows = Array.isArray(requirements) ? requirements : [];
  const submissionRows = Array.isArray(submissions) ? submissions : [];
  const evidenceRows = Array.isArray(evidence) ? evidence : [];
  const feedbackRows = Array.isArray(feedback) ? feedback : [];
  const rowForPhase = (phaseKey, label, fallbackDetail) => {
    const phaseRows = requirementRows.filter((row) => studentRequirementPhaseKey(row?.phase || row?.phaseLabel || "") === phaseKey);
    const complete = phaseRows.length && phaseRows.every((row) => isStudentRequirementComplete(row?.status));
    const submitted = phaseRows.some((row) => ["submitted", "under_review", "pending_review"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
    const needsWork = phaseRows.some((row) => ["revision_requested", "needs_revision", "missing", "draft", "not_started", "blocked"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
    return {
      id: phaseKey,
      label,
      detail: phaseRows.length ? `${phaseRows.filter((row) => isStudentRequirementComplete(row?.status)).length} of ${phaseRows.length} item${phaseRows.length === 1 ? "" : "s"} complete in this phase.` : fallbackDetail,
      status: complete ? "Complete" : submitted ? "Submitted" : needsWork ? "Needs work" : phaseRows.length ? "Needs work" : "Not confirmed yet",
      actionSection: "studentWork",
    };
  };
  const proofComplete = evidenceRows.length > 0 && safeNumber(summary.requirementsTotal) > 0;
  const allAssignedComplete = safeNumber(summary.requirementsTotal) > 0
    && safeNumber(summary.requirementsComplete) >= safeNumber(summary.requirementsTotal)
    && !safeNumber(summary.revisionRequestedCount)
    && !safeNumber(summary.missingRequiredCount)
    && !safeNumber(summary.waitingForReviewCount);
  const revisionRows = feedbackRows.filter((row) => ["revision_requested", "needs_revision"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
  const waitingRows = submissionRows.filter((row) => ["submitted", "under_review", "pending_review"].includes(normalizeStatus(row?.status)));
  return [
    rowForPhase("phase-1", "Proposal done", "Proposal work has not been checked in My Work yet."),
    rowForPhase("phase-2a", "Build file started", "Build file is not started yet."),
    rowForPhase("phase-2b", "Build update and presentation plan", "Build update or presentation plan is not confirmed yet."),
    rowForPhase("phase-3a", "Presentation practice ready", "Presentation practice is not confirmed yet."),
    rowForPhase("phase-4", "Reflection and portfolio complete", "Reflection or portfolio work is not confirmed yet."),
    {
      id: "evidence",
      label: "Drive links",
      detail: evidenceRows.length ? `${evidenceRows.length} file${evidenceRows.length === 1 ? "" : "s"} saved.` : "No files have been uploaded yet.",
      status: proofComplete ? "Submitted" : "Not confirmed yet",
      actionSection: "studentWork",
    },
    {
      id: "feedback",
      label: "Feedback resolved",
      detail: revisionRows.length ? `${revisionRows.length} feedback item${revisionRows.length === 1 ? "" : "s"} still need changes.` : waitingRows.length ? `${waitingRows.length} sent item${waitingRows.length === 1 ? "" : "s"} still waiting for review.` : "No feedback needs changes right now.",
      status: revisionRows.length ? "Needs work" : waitingRows.length ? "Submitted" : feedbackRows.length || allAssignedComplete ? "Complete" : "Not confirmed yet",
      actionSection: revisionRows.length ? "studentFeedback" : "studentWork",
    },
    {
      id: "final-review",
      label: "Final review complete",
      detail: allAssignedComplete ? "Assigned work is complete and no review blocker is visible." : "The app does not yet show every required item as complete and clear.",
      status: allAssignedComplete ? "Complete" : archiveNextAction?.status ? "Needs work" : "Not confirmed yet",
      actionSection: "studentFinalChecklist",
    },
  ];
}

function renderStudentFinalChecklistRow(row = {}) {
  const actionLabel = row.actionSection === "studentFeedback" ? "View Feedback" : "View Work";
  return `
    <article class="workspace-row workspace-student-final-check-row" data-student-final-check-row="${escapeHtml(row.id || "check")}" data-student-final-check-status="${escapeHtml(normalizeStatus(row.status || "not_confirmed"))}">
      <div>
        <strong>${escapeHtml(row.label || "Final checklist item")}</strong>
        <p>${escapeHtml(row.detail || "Status is not confirmed yet.")}</p>
      </div>
      <div class="workspace-row-actions">
        <span class="workspace-student-final-status">${escapeHtml(studentFinalChecklistStatusText(row.status || "Not confirmed yet"))}</span>
        ${row.actionSection ? renderStudentRouteButton(row.actionSection, actionLabel, "workspace-button-secondary") : ""}
      </div>
    </article>
  `;
}

function studentFinalChecklistStatusText(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "complete") return "Done";
  if (normalized === "submitted") return "Ask your teacher";
  if (normalized === "needs_work") return "Not done";
  if (normalized === "not_confirmed_yet") return "Not checked yet";
  return studentStatusText(status);
}

function renderStudentSetupGuide(summary = {}, requirements = []) {
  if (safeNumber(summary?.requirementsTotal) || (Array.isArray(requirements) && requirements.length)) return "";
  const steps = [
    {
      id: "not-behind",
      title: "You are not behind yet",
      detail: "No Senior Project item is assigned, so there is nothing to send or revise from this page right now.",
      tone: "student",
    },
    {
      id: "ask-first-item",
      title: "Ask for the first item",
      detail: "Ask your Program Teacher which Senior Project phase or checklist item should appear first.",
      tone: "warning",
    },
    {
      id: "wait-proof",
      title: "Wait to upload proof",
      detail: "Proof must attach to an exact assigned item. Do not upload random files before the item appears.",
      tone: "quiet",
    },
  ];
  return `
    <section class="workspace-student-setup-guide" data-student-setup-guide="true" aria-labelledby="studentSetupGuideTitle">
      <div class="workspace-student-setup-guide-head">
        <div>
          <p class="workspace-kicker">Before work appears</p>
          <h2 id="studentSetupGuideTitle">Nothing is assigned yet</h2>
          <p>Use this state to know what is normal and what to ask for next.</p>
        </div>
      </div>
      <div class="workspace-student-setup-guide-grid">
        ${steps.map((step) => `
          <article class="workspace-student-setup-step ${escapeHtml(step.tone)}" data-student-setup-step="${escapeHtml(step.id)}">
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.detail)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStudentPhasePath(summary = {}, requirements = []) {
  const countsByPhase = studentRequirementCountsByPhase(requirements);
  const currentPhaseKey = studentRequirementPhaseKey(summary?.currentPhase || summary?.currentPhaseLabel || "");
  const currentRank = studentBookletPhaseRank(currentPhaseKey);
  const phases = STUDENT_BOOKLET_PHASE_ORDER.map((key) => {
    const phase = studentBookletPhaseInfo(key);
    const counts = countsByPhase.get(key) || { total: 0, complete: 0 };
    return studentPhasePathStep(phase, counts, currentPhaseKey, currentRank);
  });
  return `
    <section class="workspace-student-phase-path" data-student-phase-path="true" aria-labelledby="studentPhasePathTitle">
      <div class="workspace-student-phase-path-head">
        <div>
          <p class="workspace-kicker">Capstone path</p>
          <h3 id="studentPhasePathTitle">Where you are</h3>
          <p>See the whole Senior Project path: done, now, needs work, and later.</p>
        </div>
      </div>
      <ol class="workspace-student-phase-path-list" aria-label="Senior Project phase path">
        ${phases.map((step) => `
          <li class="workspace-student-phase-step ${escapeHtml(step.state)}" data-student-phase-step="${escapeHtml(step.key)}" data-student-phase-state="${escapeHtml(step.state)}" ${step.current ? 'data-student-phase-current="true"' : ""}>
            <span>${escapeHtml(step.indexLabel)}</span>
            <strong>${escapeHtml(step.title)}</strong>
            <small>${escapeHtml(step.statusLabel)}</small>
            <p>${escapeHtml(step.detail)}</p>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function studentPhasePathStep(phase = {}, counts = {}, currentPhaseKey = "", currentRank = STUDENT_BOOKLET_PHASE_ORDER.length) {
  const key = phase.key || "";
  const total = safeNumber(counts.total);
  const complete = safeNumber(counts.complete);
  const remaining = Math.max(0, total - complete);
  const current = Boolean(key && key === currentPhaseKey);
  const phaseRank = studentBookletPhaseRank(key);
  const assignedDetail = total
    ? `${complete} of ${total} ${pluralize(total, "item")} done here.`
    : "No checklist item is listed here yet.";

  if (current) {
    return {
      key,
      current,
      state: remaining ? "current" : "done",
      indexLabel: studentPhasePathLabel(phase),
      title: "Now",
      statusLabel: remaining ? `${remaining} to finish` : "Done",
      detail: phase.deliverable || assignedDetail,
    };
  }
  if (total && complete >= total) {
    return {
      key,
      current,
      state: "done",
      indexLabel: studentPhasePathLabel(phase),
      title: "Done",
      statusLabel: `${complete} of ${total}`,
      detail: assignedDetail,
    };
  }
  if (total && remaining) {
    return {
      key,
      current,
      state: phaseRank < currentRank ? "needs_work" : "later",
      indexLabel: studentPhasePathLabel(phase),
      title: phaseRank < currentRank ? "Check" : "Later",
      statusLabel: `${remaining} to finish`,
      detail: phaseRank < currentRank ? "Ask your teacher what still needs attention here." : "Wait until this phase is the next step.",
    };
  }
  return {
    key,
    current,
    state: phaseRank < currentRank ? "done" : "later",
    indexLabel: studentPhasePathLabel(phase),
    title: phaseRank < currentRank ? "Past" : "Later",
    statusLabel: phaseRank < currentRank ? "Check if needed" : "Not yet",
    detail: phaseRank < currentRank ? "No open checklist item is listed here." : "Wait until this phase appears in My Work.",
  };
}

function studentPhasePathLabel(phase = {}) {
  const label = String(phase.label || "Phase").split(":")[0].trim();
  return label || "Phase";
}

function renderStudentMissionBoard(summary = {}, nextSteps = [], submissions = [], evidence = [], feedback = [], requirements = [], archiveNextAction = null) {
  const action = studentPrimaryNextAction(summary, nextSteps, archiveNextAction);
  const attention = studentAttentionMission(summary, requirements, archiveNextAction);
  const proof = studentProofMission(summary, submissions, evidence);
  const recent = studentRecentMission(summary, submissions, evidence, feedback);
  return `
    <section class="workspace-student-mission-board" data-student-mission-board="true" aria-labelledby="studentMissionBoardTitle">
      <div class="workspace-student-mission-head">
        <div>
          <p class="workspace-kicker">Today at a glance</p>
          <h2 id="studentMissionBoardTitle">Start here</h2>
          <p>Use these four cards to decide what to open first.</p>
        </div>
      </div>
      <div class="workspace-student-mission-grid">
        ${renderStudentMissionCard({
          id: "today",
          tone: normalizeStatus(action.status) === "revision_requested" ? "danger" : "student",
          label: "Today",
          title: action.title,
          detail: studentPrimaryCommandCopy(action, summary),
          meta: action.when,
          actionsHtml: renderStudentStepButtons(action, "Open item"),
        })}
        ${renderStudentMissionCard(attention)}
        ${renderStudentMissionCard(proof)}
        ${renderStudentMissionCard(recent)}
      </div>
    </section>
  `;
}

function renderStudentCompletionLanes(summary = {}, archiveNextAction = null) {
  const revisionCount = safeNumber(summary.revisionRequestedCount);
  const waitingCount = safeNumber(summary.waitingForReviewCount);
  const missingCount = safeNumber(summary.missingRequiredCount);
  const doneCount = safeNumber(summary.requirementsComplete);
  const totalCount = safeNumber(summary.requirementsTotal);
  const archiveStatus = normalizeStatus(archiveNextAction?.status || "");
  const archiveNeedsStaff = ["failed", "provider_unavailable", "setup_needed", "attention_required"].includes(archiveStatus);
  const lanes = [
    {
      id: "do-now",
      label: "Do now",
      value: revisionCount ? `${revisionCount} to fix` : missingCount ? `${missingCount} to finish` : "Keep going",
      detail: revisionCount
        ? "Fix teacher feedback before new phase work."
        : missingCount
          ? "Open the current checklist item and add a matching file when needed."
          : "No urgent student action is listed right now.",
      status: revisionCount ? "needs_revision" : missingCount ? "pending" : "ready",
    },
    {
      id: "waiting",
      label: "Waiting",
      value: waitingCount ? `${waitingCount} in review` : "Nothing waiting",
      detail: waitingCount
        ? "Your teacher owns the next decision for work you turned in."
        : "Turned-in work that needs a teacher decision will appear here.",
      status: waitingCount ? "under_review" : "ready",
    },
    {
      id: "done",
      label: "Ready / done",
      value: totalCount ? `${doneCount} of ${totalCount}` : "Not assigned",
      detail: totalCount
        ? "Approved or complete work supports the next Senior Project step."
        : "Your teacher adds assigned work before this lane fills in.",
      status: totalCount && doneCount >= totalCount ? "complete" : "configured",
    },
    {
      id: "final-files",
      label: "Final files",
      value: archiveNextAction?.title || "Check later",
      detail: archiveNextAction?.when || "Final-file status appears when closeout checks exist.",
      status: archiveNeedsStaff ? "needs_staff_action" : archiveStatus || "pending",
    },
  ];
  return `
    <section class="workspace-student-completion-lanes" data-student-completion-lanes="true" aria-label="Student completion lanes">
      ${lanes.map((lane) => `
        <article class="workspace-student-completion-lane" data-student-completion-lane="${escapeHtml(lane.id)}" data-student-completion-state="${escapeHtml(normalizeStatus(lane.status))}">
          <span>${escapeHtml(lane.label)}</span>
          <strong>${escapeHtml(lane.value)}</strong>
          <p>${escapeHtml(lane.detail)}</p>
          ${studentStatusPill(lane.status)}
        </article>
      `).join("")}
    </section>
  `;
}

function renderStudentMissionCard(card = {}) {
  return `
    <article class="workspace-student-mission-card ${escapeHtml(card.tone || "student")}" data-student-mission-card="${escapeHtml(card.id || "mission")}">
      <div>
        <span>${escapeHtml(card.label || "Next")}</span>
        <strong>${escapeHtml(card.title || "Check your next step")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
        ${card.meta ? `<small>${escapeHtml(card.meta)}</small>` : ""}
      </div>
      ${card.actionsHtml ? `<div class="workspace-row-actions">${card.actionsHtml}</div>` : ""}
    </article>
  `;
}

function studentAttentionMission(summary = {}, requirements = [], archiveNextAction = null) {
  const overdueCount = studentOverdueRequirementCount(requirements);
  if (summary.revisionRequestedCount) {
    return {
      id: "attention",
      tone: "danger",
      label: "Needs attention",
      title: `${summary.revisionRequestedCount} revision ${summary.revisionRequestedCount === 1 ? "item" : "items"}`,
      detail: "Fix work that needs changes before starting new phase work.",
      meta: overdueCount ? `${overdueCount} overdue item${overdueCount === 1 ? "" : "s"} also need attention.` : "Start with Feedback.",
    };
  }
  if (overdueCount) {
    return {
      id: "attention",
      tone: "danger",
      label: "Needs attention",
      title: `${overdueCount} overdue item${overdueCount === 1 ? "" : "s"}`,
      detail: "Open the overdue checklist item. Add its Google Drive link. Turn it in.",
      meta: "Overdue work comes before lower-priority tasks.",
    };
  }
  if (summary.missingRequiredCount) {
    return {
      id: "attention",
      tone: "warning",
      label: "Needs attention",
      title: `${summary.missingRequiredCount} item${summary.missingRequiredCount === 1 ? "" : "s"} not finished`,
      detail: "Open the checklist and finish the current phase item.",
      meta: "Files and teacher checks still matter.",
    };
  }
  if (summary.waitingForReviewCount) {
    return {
      id: "attention",
      tone: "teacher",
      label: "Needs attention",
      title: "Waiting for review",
      detail: "Your teacher owns the next decision.",
      meta: `${summary.waitingForReviewCount} turned-in item${summary.waitingForReviewCount === 1 ? "" : "s"} waiting.`,
    };
  }
  if (archiveNextAction?.status) {
    return {
      id: "attention",
      tone: "warning",
      label: "Needs attention",
      title: archiveNextAction.title || "Final files need attention",
      detail: archiveNextAction.detail || "Read Final Files before closeout.",
      meta: archiveNextAction.when || "Ask your teacher if this is unclear.",
    };
  }
  return {
    id: "attention",
    tone: "ready",
    label: "Needs attention",
    title: "No urgent issue",
    detail: "Keep following the next approved checklist item.",
    meta: "Ask before skipping ahead.",
  };
}

function studentProofMission(summary = {}, submissions = [], evidence = []) {
  const submissionRows = Array.isArray(submissions) ? submissions : [];
  const proofRows = Array.isArray(evidence) ? evidence : [];
  const draftCount = submissionRows.filter((row) => ["draft", "not_started"].includes(normalizeStatus(row?.status))).length;
  const revisionCount = submissionRows.filter((row) => ["revision_requested", "needs_revision"].includes(normalizeStatus(row?.status))).length;
  const waitingCount = submissionRows.filter((row) => ["submitted", "under_review", "reviewing", "pending_review"].includes(normalizeStatus(row?.status))).length;
  if (revisionCount) {
    return {
      id: "proof",
      tone: "warning",
      label: "Files",
      title: `${proofRows.length} file${proofRows.length === 1 ? "" : "s"}`,
      detail: "Corrected files or links belong on the item that needs changes.",
      meta: `${revisionCount} item${revisionCount === 1 ? " needs" : "s need"} to be turned in again.`,
    };
  }
  if (draftCount || summary.missingRequiredCount) {
    return {
      id: "proof",
      tone: "student",
      label: "Files",
      title: `${proofRows.length} file${proofRows.length === 1 ? "" : "s"}`,
      detail: "Add a link or upload only after choosing the exact checklist item.",
      meta: draftCount ? `${draftCount} draft item${draftCount === 1 ? "" : "s"} can still be finished.` : "Use a file when the checklist asks for it.",
    };
  }
  return {
    id: "proof",
    tone: waitingCount ? "teacher" : "ready",
    label: "Files",
    title: `${proofRows.length} file${proofRows.length === 1 ? "" : "s"}`,
    detail: waitingCount ? "Files are waiting with turned-in work." : "Files appear here after links or uploads are added.",
    meta: waitingCount ? `${waitingCount} turned-in item${waitingCount === 1 ? "" : "s"} waiting for review.` : "Keep files matched to the correct item.",
  };
}

function studentRecentMission(summary = {}, submissions = [], evidence = [], feedback = []) {
  const newest = latestStudentActivity(summary, submissions, evidence, feedback);
  return {
    id: "recent",
    tone: "quiet",
    label: "Recent",
    title: newest.title,
    detail: newest.detail,
    meta: newest.when,
  };
}

function latestStudentActivity(summary = {}, submissions = [], evidence = [], feedback = []) {
  const rows = [
    {
      kind: "Progress update",
      label: summary.currentPhaseLabel || "Project progress",
      when: summary.lastUpdatedAt,
      detail: "Your project summary was updated.",
    },
    ...(Array.isArray(submissions) ? submissions : []).map((row) => ({
      kind: "Turned in",
      label: studentSubmissionRequirementTitle(row),
      when: row?.updated_at || row?.updatedAt,
      detail: "Work status changed or was updated.",
    })),
    ...(Array.isArray(evidence) ? evidence : []).map((row) => ({
      kind: "File added",
      label: row?.title || row?.requirementTitle || "File item",
      when: row?.created_at || row?.createdAt,
      detail: "A Google Drive link was saved.",
    })),
    ...(Array.isArray(feedback) ? feedback : []).map((row) => ({
      kind: "Teacher feedback",
      label: row?.requirementTitle || "Teacher note",
      when: row?.createdAt || row?.created_at,
      detail: row?.message || "Program Teacher feedback was recorded.",
    })),
  ]
    .map((row) => ({ ...row, time: Date.parse(String(row.when || "")) }))
    .filter((row) => Number.isFinite(row.time))
    .sort((left, right) => right.time - left.time);
  const newest = rows[0];
  if (!newest) {
    return {
      title: "No activity yet",
      detail: "Activity appears after work, proof, or feedback is saved.",
      when: "Check back after your Program Teacher adds work.",
    };
  }
  return {
    title: newest.kind,
    detail: newest.label ? `${newest.label}: ${studentInstructionCopy(newest.detail)}` : studentInstructionCopy(newest.detail),
    when: `Updated ${formatDate(newest.when)}`,
  };
}

function studentOverdueRequirementCount(requirements = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (Array.isArray(requirements) ? requirements : []).filter((item) => {
    if (isStudentRequirementComplete(item?.status)) return false;
    const dueTime = Date.parse(item?.dueDate || "");
    if (!Number.isFinite(dueTime)) return false;
    const due = new Date(dueTime);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  }).length;
}

function renderStudentWorkspaceDisclosurePanels(dashboard, summary, submissions, evidence, filteredSubmissions, activeSubmissionFilter) {
  const requirements = dashboard.requirements || [];
  const feedback = dashboard.feedback || [];
  const requirementCount = Array.isArray(requirements) ? requirements.length : 0;
  const feedbackCount = Array.isArray(feedback) ? feedback.length : 0;
  const submissionCount = Array.isArray(submissions) ? submissions.length : 0;
  const evidenceCount = Array.isArray(evidence) ? evidence.length : 0;
  return `
    ${renderStudentPanelMap({
      requirements,
      feedback,
      summary,
      submissions,
      evidence,
    })}
    <div class="workspace-disclosure-stack" data-student-secondary-stack="true">
      ${renderWorkspaceDisclosurePanel({
        scope: "student",
        id: "requirements",
        kicker: "All required work",
        title: "Senior Project Checklist",
        summary: requirementCount ? `${requirementCount} work item${requirementCount === 1 ? "" : "s"} listed by booklet phase.` : "Assigned work will appear here after your Program Teacher adds the first Senior Project item.",
        openLabel: "Open checklist",
        closeLabel: "Hide checklist",
        dataAttrs: 'data-student-requirements-panel="true" tabindex="-1"',
        bodyHtml: renderStudentRequirementPanelBody(requirements, summary, feedback, studentRequirementDetailState, evidence, studentFeedbackHistoryState),
      })}
      ${renderWorkspaceDisclosurePanel({
        scope: "student",
        id: "feedback",
        kicker: "Teacher notes",
        title: "Teacher feedback",
        summary: `${feedbackCount} teacher note${feedbackCount === 1 ? "" : "s"} available. Notes that need action stay first.`,
        openLabel: "Open feedback",
        closeLabel: "Hide feedback",
        dataAttrs: `data-student-feedback-panel="true" data-student-feedback-history="true" data-student-feedback-count="${escapeHtml(feedbackCount)}" tabindex="-1"`,
        bodyHtml: renderStudentFeedbackPanelBody(feedback, summary, studentFeedbackHistoryState),
      })}
      ${renderWorkspaceDisclosurePanel({
        scope: "student",
        id: "progress",
        kicker: "Support and details",
        title: "Project Details",
        summary: "Current phase, final-file status, and help links stay here.",
        openLabel: "Open details",
        closeLabel: "Hide details",
        dataAttrs: 'data-student-progress-details-panel="true" tabindex="-1"',
        bodyHtml: renderStudentProgressDetailsBody(summary, dashboard),
      })}
      ${renderWorkspaceDisclosurePanel({
        scope: "student",
        id: "evidence",
        kicker: "Add your work",
        title: "Add a Drive Link",
        summary: submissionCount ? "Add a Google Drive link to work you already started." : "Link tools appear after work is ready.",
        openLabel: "Open link tools",
        closeLabel: "Hide link tools",
        dataAttrs: 'data-student-evidence-panel="true" tabindex="-1"',
        bodyHtml: submissions.length ? renderEvidenceForms(submissions, requirements) : renderStudentEvidenceEmptyState(),
      })}
      ${renderWorkspaceDisclosurePanel({
        scope: "student",
        id: "submissions",
        kicker: "Work history",
        title: "Turned in",
        summary: submissionCount ? `${submissionCount} started item${submissionCount === 1 ? "" : "s"} available. Open this to show drafts, waiting work, work to fix, or done work.` : "Turned-in work appears after you start project work.",
        openLabel: "Open turned-in work",
        closeLabel: "Hide turned-in work",
        dataAttrs: 'data-student-submissions-panel="true" tabindex="-1"',
        bodyHtml: renderStudentSubmissionsPanelBody(submissions, filteredSubmissions, feedback, activeSubmissionFilter),
      })}
      ${renderWorkspaceDisclosurePanel({
        scope: "student",
        id: "files",
        kicker: "Saved work links",
        title: "Drive Links",
        summary: `${evidenceCount} Google Drive ${pluralize(evidenceCount, "link")} available when you need the full list.`,
        openLabel: "Open links",
        closeLabel: "Hide links",
        dataAttrs: 'data-student-files-panel="true" tabindex="-1"',
        bodyHtml: renderStudentFilesPanelBody(evidence),
      })}
    </div>
  `;
}

function renderStudentPanelMap({ requirements = [], feedback = [], summary = {}, submissions = [], evidence = [] } = {}) {
  const rows = studentPanelMapItems({ requirements, feedback, summary, submissions, evidence });
  if (!rows.length) return "";
  return `
    <section class="workspace-student-panel-map" data-student-panel-map="true" aria-labelledby="studentPanelMapTitle">
      <div class="workspace-student-panel-map-head">
        <div>
          <p class="workspace-kicker">Where to work</p>
          <h2 id="studentPanelMapTitle">Choose where to work</h2>
          <p class="workspace-muted">Open the one section that matches what you need right now.</p>
        </div>
      </div>
      <div class="workspace-student-panel-map-grid">
        ${rows.map(renderStudentPanelMapCard).join("")}
      </div>
    </section>
  `;
}

function studentPanelMapItems({ requirements = [], feedback = [], summary = {}, submissions = [], evidence = [] } = {}) {
  const requirementRows = Array.isArray(requirements) ? requirements : [];
  const feedbackRows = Array.isArray(feedback) ? feedback : [];
  const submissionRows = Array.isArray(submissions) ? submissions : [];
  const proofRows = Array.isArray(evidence) ? evidence : [];
  const revisionNotes = feedbackRows.filter((row) => ["revision_requested", "needs_revision"].includes(normalizeStatus(row?.submissionStatus || row?.status))).length;
  const draftSubmissions = submissionRows.filter((row) => normalizeStatus(row?.status) === "draft").length;
  const waitingSubmissions = submissionRows.filter((row) => ["submitted", "under_review", "pending_review"].includes(normalizeStatus(row?.status))).length;
  const missingItems = safeNumber(summary?.missingRequiredCount);
  const currentPhase = summary?.currentPhaseLabel || "Current phase";
  return [
    {
      id: "requirements",
      label: "Checklist",
      value: requirementRows.length ? `${safeNumber(summary.requirementsComplete)} of ${safeNumber(summary.requirementsTotal || requirementRows.length)} done` : "Not set up",
      detail: revisionNotes ? "Open first for the item that needs revision." : missingItems ? "Open for the next unfinished booklet item." : "Open when you need the full booklet list.",
      tone: revisionNotes ? "danger" : missingItems ? "warning" : "student",
      action: "Open checklist",
    },
    {
      id: "feedback",
      label: "Feedback",
      value: revisionNotes ? `${revisionNotes} fix` : `${feedbackRows.length} note${feedbackRows.length === 1 ? "" : "s"}`,
      detail: revisionNotes ? "Read this before changing work or updating its Drive link." : "Open when you want teacher notes.",
      tone: revisionNotes ? "danger" : feedbackRows.length ? "teacher" : "quiet",
      action: "Open feedback",
    },
    {
      id: "progress",
      label: "Progress",
      value: currentPhase,
      detail: "Open for phase status, May 5 file checks, and help guidance.",
      tone: "student",
      action: "Open details",
    },
    {
      id: "evidence",
      label: "Add Drive Link",
      value: submissionRows.length ? `${submissionRows.length} item${submissionRows.length === 1 ? "" : "s"}` : "Locked",
      detail: draftSubmissions || revisionNotes ? "Open when you are ready to add a Google Drive link to one selected item." : "Link tools appear after work exists.",
      tone: draftSubmissions || revisionNotes ? "warning" : "quiet",
      action: "Open link tools",
    },
    {
      id: "submissions",
      label: "Turned in",
      value: waitingSubmissions ? `${waitingSubmissions} waiting` : `${submissionRows.length} started`,
      detail: waitingSubmissions ? "Open to confirm what your teacher is checking." : "Open to review drafts, work to fix, done work, or turned-in items.",
      tone: waitingSubmissions ? "teacher" : submissionRows.length ? "student" : "quiet",
      action: "Open turned-in work",
    },
    {
      id: "files",
      label: "Drive Links",
      value: `${proofRows.length} ${pluralize(proofRows.length, "link")}`,
      detail: proofRows.length ? "Open to confirm each Google Drive link is on the right work item." : "Links appear here after you save one.",
      tone: proofRows.length ? "mentor" : "quiet",
      action: "Open links",
    },
  ];
}

function renderStudentPanelMapCard(item = {}) {
  const open = isWorkspaceDisclosureOpen("student", item.id);
  const domId = workspaceDisclosureDomId("student", item.id);
  return `
    <article class="workspace-student-panel-map-card ${escapeHtml(item.tone || "student")}" data-student-panel-map-card="${escapeHtml(item.id || "")}" data-panel-state="${open ? "open" : "closed"}">
      <div>
        <span>${escapeHtml(item.label || "Panel")}</span>
        <strong>${escapeHtml(item.value || "")}</strong>
        <p>${escapeHtml(item.detail || "")}</p>
      </div>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-workspace-disclosure-action="toggle" data-workspace-disclosure-scope="student" data-workspace-disclosure-id="${escapeHtml(item.id || "")}" aria-expanded="${open ? "true" : "false"}" aria-controls="${escapeHtml(domId)}">
        ${escapeHtml(open ? "Hide" : item.action || "Open")}
      </button>
    </article>
  `;
}

function renderStudentPrimaryNextAction(summary, nextSteps = [], archiveNextAction = null) {
  const action = studentPrimaryNextAction(summary, nextSteps, archiveNextAction);
  const actionButtons = renderStudentStepButtons(action);
  const command = studentPrimaryCommandCopy(action, summary);
  return `
    <section class="workspace-dashboard-card workspace-student-primary-action" data-student-command-card="true" data-student-command-state="${escapeHtml(normalizeStatus(action.status) || "pending")}" aria-labelledby="studentPrimaryNextActionTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Do this next</p>
          <h2 id="studentPrimaryNextActionTitle">${escapeHtml(action.title)}</h2>
          <p>${escapeHtml(action.detail)}</p>
        </div>
        ${studentStatusPill(action.status)}
      </div>
      <div class="workspace-student-action-focus">
        <strong>${escapeHtml(action.owner)}</strong>
        <span>${escapeHtml(action.when)}</span>
      </div>
      <p class="workspace-student-command-line" data-student-command-line="true"><strong>Do this now:</strong> ${escapeHtml(command)}</p>
      ${renderStudentActionPath(action, summary)}
      ${renderTaskFinishChecklist("student-next-action", "Before you act on this item", studentPrimaryActionChecklist(action, summary), {
        detail: "Use these checks before opening a panel, uploading proof, sending work, or deciding to wait.",
        badge: "Student checks",
        state: action.status,
      })}
      ${actionButtons ? `<div class="workspace-row-actions">${actionButtons}</div>` : ""}
    </section>
  `;
}

function renderStudentActionPath(action = {}, summary = {}) {
  const steps = studentActionPathSteps(action, summary);
  if (!steps.length) return "";
  return `
    <section class="workspace-student-action-path" data-student-action-path="true" aria-labelledby="studentActionPathTitle">
      <div class="workspace-student-action-path-head">
        <p class="workspace-kicker">What to click next</p>
        <h3 id="studentActionPathTitle">Use these clicks in order</h3>
        <p>Open the right item, check proof and feedback, then send or wait.</p>
      </div>
      <ol class="workspace-student-action-path-steps">
        ${steps.map((step, index) => `
          <li class="workspace-student-action-step ${escapeHtml(step.tone || "student")}" data-student-action-step="${escapeHtml(step.id)}">
            <span aria-hidden="true">${escapeHtml(index + 1)}</span>
            <div>
              <strong>${escapeHtml(step.title)}</strong>
              <p>${escapeHtml(step.detail)}</p>
              ${step.actionsHtml ? `<div class="workspace-row-actions">${step.actionsHtml}</div>` : ""}
            </div>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function studentActionPathSteps(action = {}, summary = {}) {
  const status = normalizeStatus(action.submissionStatus || action.status);
  const actionTitle = studentInstructionCopy(action.itemTitle || action.requirementTitle || action.title || "your current Senior Project item");
  const openItemButton = renderStudentRequirementOpenButton(action, "Open exact item")
    || renderStudentDisclosureOpenButton("requirements", "Open checklist");
  const feedbackButton = renderStudentDisclosureOpenButton("feedback", "Open feedback");
  const proofButton = renderStudentDisclosureOpenButton("evidence", "Open files");
  const sentWorkButton = renderStudentDisclosureOpenButton("submissions", "Open Turned in");
  const submitButton = renderStudentSubmissionActionButton(action);
  const canSend = Boolean(submitButton) && studentSubmissionActionState(action).canSubmit;
  const waitingCount = safeNumber(summary?.waitingForReviewCount);

  if (status === "revision_requested") {
    return [
      {
        id: "open-item",
        tone: "danger",
        title: "Open exact item",
        detail: `Work on ${actionTitle}, not a different checklist item.`,
        actionsHtml: openItemButton,
      },
      {
        id: "check-feedback-proof",
        tone: "warning",
        title: "Check feedback and files",
        detail: "Read the teacher note. Then update the file on this same item.",
        actionsHtml: `${feedbackButton}${proofButton}`,
      },
      {
        id: "send",
        tone: canSend ? "student" : "warning",
        title: canSend ? "Turn in again" : "Add link first",
        detail: canSend ? "Turn it in only after the work and Drive link match the note." : "Add the corrected Drive link before turning this in again.",
        actionsHtml: submitButton || proofButton,
      },
    ];
  }

  if (["submitted", "under_review", "pending_review"].includes(status)) {
    return [
      {
        id: "open-sent-work",
        tone: "teacher",
        title: "Open turned-in work",
        detail: `Confirm what your teacher is reviewing for ${actionTitle}.`,
        actionsHtml: sentWorkButton,
      },
      {
        id: "check-feedback-proof",
        tone: "student",
        title: "Check feedback and files",
        detail: "Use feedback only if a teacher note asks for a change.",
        actionsHtml: `${feedbackButton}${proofButton}`,
      },
      {
        id: "wait",
        tone: "quiet",
        title: "Wait for approval",
        detail: "Stay in this phase until your teacher approves it.",
        actionsHtml: "",
      },
    ];
  }

  if (submitButton) {
    return [
      {
        id: "open-item",
        tone: "student",
        title: "Open exact item",
        detail: `Start with ${actionTitle} and check what counts as done.`,
        actionsHtml: openItemButton,
      },
      {
        id: "add-proof",
        tone: "warning",
        title: "Add Drive link",
        detail: "Add the Google Drive link that shows this exact work.",
        actionsHtml: proofButton,
      },
      {
        id: "send",
        tone: canSend ? "student" : "quiet",
        title: canSend ? "Turn in" : "Turn in after link",
        detail: canSend ? "Turn it in to your teacher. Then wait." : "The Turn in button unlocks after a Google Drive link is added.",
        actionsHtml: submitButton,
      },
    ];
  }

  return [
    {
      id: "open-item",
      tone: "student",
      title: "Open exact item",
      detail: `Check ${actionTitle} before starting anything new.`,
      actionsHtml: openItemButton,
    },
    {
      id: "check-status",
      tone: waitingCount ? "teacher" : "quiet",
      title: waitingCount ? "Check turned-in work" : "Check files and feedback",
      detail: waitingCount ? "Confirm what is already waiting for your teacher." : "Use Files and Feedback when there is an assigned item.",
      actionsHtml: waitingCount ? sentWorkButton : `${proofButton}${feedbackButton}`,
    },
    {
      id: "wait",
      tone: "quiet",
      title: "Wait for the next clear step",
      detail: "Ask your Program Teacher if My Work does not show what to open next.",
      actionsHtml: "",
    },
  ];
}

function renderStudentDisclosureOpenButton(id, label) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return "";
  const open = isWorkspaceDisclosureOpen("student", cleanId);
  const domId = workspaceDisclosureDomId("student", cleanId);
  return `<button class="workspace-link-button workspace-link-button-small" type="button" data-workspace-disclosure-action="open" data-workspace-disclosure-scope="student" data-workspace-disclosure-id="${escapeHtml(cleanId)}" aria-expanded="${open ? "true" : "false"}" aria-controls="${escapeHtml(domId)}">${escapeHtml(label || "Open")}</button>`;
}

function studentPrimaryActionChecklist(action = {}, summary = {}) {
  const title = studentInstructionCopy(action.title || "the item named above");
  const status = normalizeStatus(action.submissionStatus || action.status);
  if (status === "revision_requested") {
    return [
      ["Open the exact item", `Use the checklist or feedback panel for ${title}; do not work from memory.`, "ready"],
      ["Read the teacher note", "Find the exact change before adding a new file.", "ready"],
      ["Add the corrected file", "Add the revised link or file to the matching work item only.", "needs_review"],
      ["Turn it in when it matches", "Turn it in again. Then wait for your teacher.", "blocked"],
    ];
  }
  if (["submitted", "under_review", "pending_review"].includes(status)) {
    return [
      ["Check what you turned in", `Use Turned in for ${title} if you need to confirm it.`, "context"],
      ["Do not change direction", "The next phase waits for your teacher.", "blocked"],
      ["Watch for feedback", "If changes are requested, fix only that item and turn it in again.", "context"],
    ];
  }
  if (["failed", "provider_unavailable", "expired", "expiring_soon"].includes(status)) {
    return [
      ["Read the blocker", "Use the final-files message to see whether this needs staff help, download setup, or a fresh window.", "needs_staff_action"],
      ["Do not upload random files", "Only add a file when a final check below asks for it.", "context"],
      ["Ask the listed owner", "Use the owner shown above before assuming the download is ready.", "blocked"],
    ];
  }
  if (summary?.missingRequiredCount || status === "draft" || status === "missing" || status === "pending") {
    return [
      ["Match the checklist item", `Start with ${title} or the first missing item in the current phase.`, "ready"],
      ["Add a Drive link", "Paste the Google Drive link for the work your teacher asked for.", "needs_review"],
      ["Turn in when ready", "Turn it in only after the file and title match the work.", "context"],
      ["Wait after turning it in", "Your teacher approves the next phase.", "blocked"],
    ];
  }
  return [
    ["Confirm the next listed item", "Use the checklist instead of guessing the next phase.", "ready"],
    ["Keep files matched", "Attach links or files only to the correct work item.", "context"],
    ["Ask before skipping", "If the next move is unclear, ask your Program Teacher before moving ahead.", "needs_review"],
  ];
}

function renderStudentApprovalGateBanner(summary = {}) {
  const gate = studentApprovalGateBannerCopy(summary);
  return `
    <section class="workspace-dashboard-card workspace-student-approval-banner" data-student-approval-gate-banner="true" data-student-approval-gate-state="${escapeHtml(gate.state)}" aria-labelledby="studentApprovalGateTitle">
      <div>
        <p class="workspace-kicker">Manual checkpoint</p>
        <h2 id="studentApprovalGateTitle">${escapeHtml(gate.title)}</h2>
        <p>${escapeHtml(gate.detail)}</p>
      </div>
      <span class="workspace-site-context-badge">${escapeHtml(gate.badge)}</span>
    </section>
  `;
}

function studentApprovalGateBannerCopy(summary = {}) {
  if (!summary.requirementsTotal) {
    return {
      state: "setup",
      title: "Wait for your teacher to add work",
      detail: "Your first project step will appear here before you start.",
      badge: "Setup needed",
    };
  }
  if (summary.revisionRequestedCount) {
    return {
      state: "revision",
      title: "Fix work before new work",
      detail: "Read your teacher feedback. Fix the work. Turn it in again before moving ahead.",
      badge: "Student action",
    };
  }
  if (summary.waitingForReviewCount) {
    return {
      state: "waiting",
      title: "Do not start the next phase yet",
      detail: "Your work is with your teacher. Wait before starting the next phase.",
      badge: "Teacher check",
    };
  }
  if (summary.missingRequiredCount) {
    return {
      state: "working",
      title: "Finish the current item, then ask for review",
      detail: "Complete the assigned work. Add a Google Drive link if needed. Turn it in for review.",
      badge: "Work in order",
    };
  }
  return {
    state: "approved",
    title: "Use the approved next step",
    detail: "Approved items are your signal to continue with the next assigned Senior Project work.",
    badge: "Approved signal",
  };
}

function renderStudentStagePlaybook(summary, nextSteps = []) {
  const playbook = studentStagePlaybook(summary, nextSteps);
  return `
    <section class="workspace-dashboard-card workspace-student-stage-guide" data-student-stage-playbook="true" aria-labelledby="studentStageGuideTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Stage guide</p>
          <h2 id="studentStageGuideTitle">${escapeHtml(playbook.title)}</h2>
          <p>${escapeHtml(playbook.summary)}</p>
        </div>
        ${studentStatusPill(playbook.status)}
      </div>
      <ol class="workspace-student-stage-steps">
        ${playbook.steps.map((step, index) => `
          <li data-student-stage-step="true">
            <span aria-hidden="true">${escapeHtml(index + 1)}</span>
            <div>
              <strong>${escapeHtml(step.title)}</strong>
              <p>${escapeHtml(step.detail)}</p>
            </div>
          </li>
        `).join("")}
      </ol>
      <div class="workspace-student-approval-checkpoint" data-student-manual-approval="true">
        <strong>Ask your teacher before the next phase</strong>
        <p>${escapeHtml("Start the next phase only after your teacher marks this phase done. Mentor check-ins can help, but your teacher opens the next step.")}</p>
      </div>
    </section>
  `;
}

function renderStudentPhaseDeliverableGuide(summary = {}, requirements = []) {
  const currentPhaseKey = studentRequirementPhaseKey(summary?.currentPhase || summary?.currentPhaseLabel || "");
  const countsByPhase = studentRequirementCountsByPhase(requirements);
  const phases = STUDENT_BOOKLET_PHASE_ORDER.map((key) => studentBookletPhaseInfo(key));
  return `
    <section class="workspace-dashboard-card workspace-student-phase-guide" data-student-phase-deliverables="true" aria-labelledby="studentPhaseDeliverablesTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Phase goals</p>
          <h2 id="studentPhaseDeliverablesTitle">What to finish in each phase</h2>
          <p>Each phase has one main thing to finish. Work on the current phase first, then stop when this page says to wait for your teacher.</p>
        </div>
      </div>
      <div class="workspace-student-phase-grid">
        ${phases.map((phase) => renderStudentPhaseDeliverableCard(phase, currentPhaseKey, countsByPhase.get(phase.key))).join("")}
      </div>
    </section>
  `;
}

function studentRequirementCountsByPhase(requirements = []) {
  const counts = new Map();
  (Array.isArray(requirements) ? requirements : []).forEach((row) => {
    const key = studentRequirementPhaseKey(row?.phase || row?.phaseLabel || "");
    if (!key) return;
    const entry = counts.get(key) || { total: 0, complete: 0 };
    entry.total += 1;
    if (isStudentRequirementComplete(row?.status)) entry.complete += 1;
    counts.set(key, entry);
  });
  return counts;
}

function renderStudentPhaseDeliverableCard(phase = {}, currentPhaseKey = "", counts = null, options = {}) {
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  const isCurrent = phase.key && phase.key === currentPhaseKey;
  const currentLabel = String(options.currentLabel || "Current phase").trim();
  const hideCount = Boolean(options.hideCount);
  const total = safeNumber(counts?.total);
  const complete = safeNumber(counts?.complete);
  const assignedCopy = total
    ? `${complete} of ${total} checklist ${pluralize(total, "item")} done here.`
    : "No checklist item from this phase is listed yet.";
  return `
    <article class="workspace-student-phase-card ${isCurrent ? "is-current" : ""}" data-student-phase-deliverable-card="${escapeHtml(phase.key || "")}" ${isCurrent ? 'data-student-phase-deliverable-current="true"' : ""}>
      <div class="workspace-student-phase-card-head">
        <span>${escapeHtml(phase.label || "Project phase")}</span>
        ${isCurrent ? `<b>${escapeHtml(currentLabel || "Current phase")}</b>` : ""}
      </div>
      <div class="workspace-student-phase-main">
        <strong>Main thing to finish</strong>
        <p data-student-phase-deliverable-main="true">${escapeHtml(phase.deliverable || "Finish the work your teacher lists for this phase.")}</p>
      </div>
      ${checklist.length ? `
        <div class="workspace-student-phase-include" data-student-phase-deliverable-list="true">
          <strong>Include</strong>
          <ul>
            ${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
      <p class="workspace-student-phase-done" data-student-phase-deliverable-done="true"><strong>Done when:</strong> ${escapeHtml(phase.done || "Your teacher marks the listed work done.")}</p>
      <p class="workspace-muted" data-student-phase-deliverable-help="true"><strong>Helpful move:</strong> ${escapeHtml(phase.guidance || "Open the matching checklist item and follow the next step.")}</p>
      ${hideCount ? "" : `<p class="workspace-muted" data-student-phase-deliverable-count="true">${escapeHtml(assignedCopy)}</p>`}
    </article>
  `;
}

function renderStudentPhaseDeliverableSnapshot(phaseKey = "", options = {}) {
  const phase = studentBookletPhaseInfo(phaseKey);
  const safeId = cleanDirectoryFilter(options.id || `student-phase-snapshot-${phase.key || "phase"}`);
  const extraAttrs = String(options.dataAttrs || "").trim();
  return `
    <section class="workspace-dashboard-card workspace-student-phase-guide workspace-student-phase-snapshot" data-student-phase-snapshot="${escapeHtml(phase.key || "")}" ${extraAttrs} aria-labelledby="${escapeHtml(safeId)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(options.kicker || "Phase deliverable")}</p>
          <h2 id="${escapeHtml(safeId)}">${escapeHtml(options.title || "What this screen helps you finish")}</h2>
          <p>${escapeHtml(options.detail || "Use this screen for this phase deliverable, then wait for the approval or status shown here.")}</p>
        </div>
      </div>
      <div class="workspace-student-phase-grid">
        ${renderStudentPhaseDeliverableCard(phase, phase.key, null, {
          hideCount: true,
          currentLabel: options.currentLabel || "This screen",
        })}
      </div>
    </section>
  `;
}

function studentStagePlaybook(summary = {}, nextSteps = []) {
  const phaseLabel = summary.currentPhaseLabel || "your current phase";
  const firstStep = Array.isArray(nextSteps) ? nextSteps[0] : null;
  const nextTitle = firstStep?.title || "the current item";
  if (!summary.requirementsTotal) {
    return {
      title: "Wait for your project setup",
      summary: "Your teacher has not added the first work yet.",
      status: "pending",
      steps: [
        { title: "Check this page", detail: "Work will appear here when your teacher is ready for you to start." },
        { title: "Ask your teacher", detail: "If you think work is missing, ask your teacher which phase you should be in." },
        { title: "Do not skip ahead", detail: "Start the first phase only after your teacher has added it here." },
      ],
    };
  }
  if (summary.revisionRequestedCount) {
    return {
      title: "Fix this phase, then turn it in again",
      summary: `Current phase: ${phaseLabel}. Fix teacher feedback before any new phase work.`,
      status: "revision_requested",
      steps: [
        { title: "Open teacher feedback", detail: `Read the note for ${nextTitle} and find exactly what needs to change.` },
        { title: "Fix the work and link", detail: "Update the work and its Google Drive link. Turn it in again." },
        { title: "Wait for review", detail: "Stay in this phase until your teacher marks it done." },
      ],
    };
  }
  if (summary.waitingForReviewCount) {
    return {
      title: "Wait for approval before moving on",
      summary: `Current phase: ${phaseLabel}. Your teacher has work to review before the next phase starts.`,
      status: "submitted",
      steps: [
        { title: "Check what you turned in", detail: "Use Turned in to confirm the right work and Drive link are waiting." },
        { title: "Hold the next phase", detail: "Do not change direction or start the next phase until your teacher approves it." },
        { title: "Use the decision", detail: "If it is approved, follow the next phase. If changes are requested, fix and turn it in again." },
      ],
    };
  }
  if (summary.missingRequiredCount) {
    return {
      title: "Finish the current phase in order",
      summary: `Current phase: ${phaseLabel}. Do the listed work first, then ask for review.`,
      status: "draft",
      steps: [
        { title: "Open the current item", detail: `Start with ${nextTitle} or the first missing item in this phase.` },
        { title: "Add the link", detail: "Save the Google Drive link that shows this exact work." },
        { title: "Turn it in", detail: "After the Google Drive link is added, turn in the item and wait for your teacher." },
      ],
    };
  }
  return {
    title: "Use the approved next step",
    summary: `Current phase: ${phaseLabel}. Keep following the phase your teacher marked done.`,
    status: "approved",
    steps: [
      { title: "Check done work", detail: "Use Feedback or the checklist to confirm what is done." },
      { title: "Follow the next listed item", detail: "Open the next item shown on this page and complete it in order." },
      { title: "Ask before skipping", detail: "If the next phase is unclear, ask your teacher before moving ahead." },
    ],
  };
}

function studentPrimaryNextAction(summary, nextSteps = [], archiveNextAction = null) {
  const steps = Array.isArray(nextSteps) ? nextSteps : [];
  const firstStep = steps[0] || null;
  const revisionStep = steps.find((step) => normalizeStatus(step?.submissionStatus || step?.status) === "revision_requested") || null;
  const waitingStep = steps.find((step) => ["submitted", "under_review", "pending_review"].includes(normalizeStatus(step?.submissionStatus || step?.status))) || null;
  const missingStep = steps.find((step) => !isStudentRequirementComplete(step?.status) && normalizeStatus(step?.submissionStatus || step?.status) !== "submitted") || null;
  if (summary.revisionRequestedCount) {
    return studentPrimaryActionFromStep(revisionStep || firstStep, {
      title: revisionStep?.title ? `Fix ${revisionStep.title} and turn it in again` : "Fix and turn in again",
      detail: revisionStep?.detail || "Open the item marked Needs changes. Make the changes. Turn it in again.",
      status: "revision_requested",
      owner: "Your action",
      when: "Start with Turned in below.",
    });
  }
  if (summary.waitingForReviewCount) {
    return studentPrimaryActionFromStep(waitingStep || firstStep, {
      title: waitingStep?.title ? `Wait for teacher review on ${waitingStep.title}` : "Wait for teacher approval",
      detail: "Your work is with your teacher. Check what you turned in once. Then wait.",
      status: "submitted",
      owner: "Teacher review",
      when: "Done for now. Do not upload another copy unless your teacher asks.",
    });
  }
  if (archiveNextAction?.status) {
    return {
      requirementId: null,
      submissionId: null,
      submissionStatus: null,
      evidenceCount: 0,
      ...archiveNextAction,
    };
  }
  if (firstStep) {
    return studentPrimaryActionFromStep(firstStep, {
      title: firstStep.title || "Keep working on the next item",
      detail: firstStep.detail || "Open the item in the list below and keep working.",
      status: firstStep.status || "pending",
      owner: "Your action",
      when: studentDueText(firstStep, "Use the next-steps list below."),
    });
  }
  if (summary.missingRequiredCount) {
    return studentPrimaryActionFromStep(missingStep, {
      title: missingStep?.title ? `Finish ${missingStep.title}` : "Finish work that is missing",
      detail: missingStep?.detail || "Choose a draft or missing item and add the work your Program Teacher asked for.",
      status: "draft",
      owner: "Your action",
      when: "Use Add Proof or Links after choosing the item.",
    });
  }
  return {
    requirementId: null,
    submissionId: null,
    submissionStatus: null,
      evidenceCount: 0,
      title: "Keep your project moving",
      detail: "Check your checklist and ask your mentor or Program Teacher if anything looks missing.",
      status: summary.requirementsTotal ? "ready" : "pending",
    owner: summary.mentor.assigned ? "You and your mentor" : "You and your Program Teacher",
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
  const currentPhase = studentBookletPhaseInfo(summary.currentPhase || summary.currentPhaseLabel || "");
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
    currentPhase: currentPhase.key || "",
    currentPhaseLabel: currentPhase.key ? currentPhase.label : (summary.currentPhaseLabel || fallback.currentPhaseLabel),
    mentor: {
      ...fallback.mentor,
      ...(summary.mentor || {}),
      message: studentInstructionCopy((summary.mentor || {}).message || fallback.mentor.message),
    },
  };
}

function clampPercent(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function studentStatusBadge(status) {
  const normalized = normalizeStatus(status || "not_started");
  const statusKey = normalized.replace(/[^a-z0-9]+/g, "-");
  return `<span class="workspace-student-status-badge" data-student-progress-status="${escapeHtml(statusKey)}">${escapeHtml(studentStatusText(status || "not_started"))}</span>`;
}

function renderStudentSummaryTile(title, metricText, explanation, tone = "") {
  return `
    <article class="workspace-metric-tile workspace-student-summary-tile ${escapeHtml(tone)}">
      <div>
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(metricText)}</strong>
        <p>${escapeHtml(studentInstructionCopy(explanation))}</p>
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
  if (summary.revisionRequestedCount) return "Fix these items, then wait for your teacher.";
  if (summary.waitingForReviewCount) return "Your teacher has work to review.";
  return "Nothing is waiting for teacher review right now.";
}

function renderStudentNextSteps(nextSteps, summary) {
  const allRows = nextSteps.length ? nextSteps : [];
  const rows = allRows.slice(0, 3);
  const hiddenCount = Math.max(0, allRows.length - rows.length);
  return `
    <section class="workspace-dashboard-card workspace-student-next-steps" aria-labelledby="studentNextStepsTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Next steps</p>
          <h2 id="studentNextStepsTitle">What to Work On Next</h2>
          ${hiddenCount ? `<p class="workspace-muted">${escapeHtml(`${hiddenCount} more step${hiddenCount === 1 ? "" : "s"} are in the checklist.`)}</p>` : ""}
        </div>
      </div>
      <div class="workspace-list">
        ${rows.length ? rows.map(renderStudentNextStepRow).join("") : `
          <article class="workspace-empty-state-card">
            <strong>You are caught up right now.</strong>
            <p>${escapeHtml(summary.waitingForReviewCount ? "Check back after your teacher reviews your work." : "Check back after your teacher adds or checks project work.")}</p>
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
        <strong>${escapeHtml(studentInstructionCopy(item.title || "Senior Project work"))}</strong>
        <p>${escapeHtml(studentInstructionCopy(item.detail || "Review this item and continue your next step."))}</p>
        <p class="workspace-muted" data-student-next-step-due="true">${escapeHtml(studentDueText(item))}</p>
      </div>
      <div class="workspace-row-actions">
        ${stepButtons}
        ${studentStatusPill(item.status || "not_started")}
      </div>
    </article>
  `;
}

function renderStudentDeadlinePanel(requirements = [], summary = {}) {
  const rows = studentUpcomingDeadlineRows(requirements);
  const countLabel = rows.length
    ? `${rows.length} due soon`
    : summary?.dueDatesAvailable
      ? "No remaining due dates"
      : "Dates not assigned";
  const emptyTitle = summary?.dueDatesAvailable
    ? "No due dates need work right now."
    : "No due dates have been assigned yet.";
  const emptyDetail = summary?.dueDatesAvailable
    ? "Keep using the checklist below for any work that is still waiting on review or a file."
    : "Keep using What to Work On Next and the project checklist. Ask your teacher if a deadline seems missing.";
  return `
    <section class="workspace-dashboard-card workspace-student-deadlines-panel" data-student-deadlines-panel="true" data-student-deadlines-count="${escapeHtml(rows.length)}" aria-labelledby="studentDeadlinesTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Due soon</p>
          <h2 id="studentDeadlinesTitle">Upcoming deadlines</h2>
          <p>${escapeHtml(rows.length ? "Start with the nearest due date when you need a time-first view." : emptyDetail)}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(countLabel)}</span>
      </div>
      ${rows.length ? renderStudentDeadlineStatusGuide(rows) : ""}
      <div class="workspace-list">
        ${rows.length ? rows.map((item) => renderStudentDeadlineRow(item, summary)).join("") : `
          <article class="workspace-empty-state-card" data-student-deadlines-empty="true">
            <strong>${escapeHtml(emptyTitle)}</strong>
            <p>${escapeHtml(emptyDetail)}</p>
          </article>
        `}
      </div>
    </section>
  `;
}

function renderStudentDeadlineStatusGuide(rows = []) {
  const deadlineRows = Array.isArray(rows)
    ? rows.map((item) => ({ item, urgency: studentDeadlineUrgency(item) }))
    : [];
  const guideRows = [
    {
      key: "overdue",
      title: "Overdue",
      detail: "Do this first. Open the item. Add or fix the file. Turn it in for review. Ask your teacher what is blocking it if you cannot finish it.",
      actionLabel: "Open overdue item",
    },
    {
      key: "due-soon",
      title: "Due soon",
      detail: "Open the item and add the file before the date. Finish this before lower-priority work.",
      actionLabel: "Open due-soon item",
    },
    {
      key: "scheduled",
      title: "Later or no exact date",
      detail: "Plan this after urgent items. Stay in the approved phase and do not skip ahead.",
      actionLabel: "Open later item",
    },
  ];
  return `
    <div class="workspace-student-deadline-guide" data-student-deadline-guide="true">
      <div>
        <p class="workspace-kicker">Deadline guide</p>
        <h3>What deadline timing means</h3>
        <p>Use this to decide what to open first. Overdue work comes before later phase work.</p>
      </div>
      <div class="workspace-student-deadline-guide-grid">
        ${guideRows.map((guide) => {
          const matchingRows = deadlineRows.filter((row) => row.urgency.state === guide.key);
          const focusItem = matchingRows[0]?.item || null;
          return `
            <article class="workspace-student-deadline-guide-card" data-student-deadline-guide-status="${escapeHtml(guide.key)}">
              <span>${escapeHtml(matchingRows.length)} item${matchingRows.length === 1 ? "" : "s"}</span>
              <strong>${escapeHtml(guide.title)}</strong>
              <p>${escapeHtml(guide.detail)}</p>
              ${focusItem ? renderStudentRequirementOpenButton(focusItem, guide.actionLabel) : ""}
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function studentUpcomingDeadlineRows(requirements = []) {
  const rows = Array.isArray(requirements) ? requirements : [];
  return rows
    .map((item, index) => ({
      ...item,
      dueSortValue: studentDueSortValue(item),
      originalIndex: index,
    }))
    .filter((item) => !isStudentRequirementComplete(item?.status) && item.dueSortValue !== null)
    .sort((left, right) => {
      if (left.dueSortValue !== right.dueSortValue) return left.dueSortValue - right.dueSortValue;
      return left.originalIndex - right.originalIndex;
    })
    .slice(0, 3);
}

function studentDueSortValue(item) {
  if (item?.dueDate) {
    const parsed = Date.parse(item.dueDate);
    if (Number.isFinite(parsed)) return parsed;
  }
  const label = String(item?.dueLabel || "").trim();
  return label ? Number.MAX_SAFE_INTEGER : null;
}

function renderStudentDeadlineRow(item, summary = {}) {
  const actionButtons = renderStudentStepButtons(item);
  const phase = studentBookletPhaseInfo(item?.phase || item?.phaseLabel || "", item?.phaseLabel || "Project phase");
  const phaseLabel = phase.label || "Project phase";
  const currentPhaseKey = studentRequirementPhaseKey(summary?.currentPhase || summary?.currentPhaseLabel || "");
  const itemPhaseKey = studentRequirementPhaseKey(item?.phase || item?.phaseLabel || "");
  const phaseContext = itemPhaseKey && itemPhaseKey === currentPhaseKey ? `${phaseLabel} / Current phase` : phaseLabel;
  const urgency = studentDeadlineUrgency(item);
  return `
    <article class="workspace-row workspace-student-deadline-row" data-student-deadline-row="true" data-student-deadline-urgency="${escapeHtml(urgency.state)}" data-student-deadline-requirement-id="${escapeHtml(studentRequirementId(item))}">
      <div>
        <strong>${escapeHtml(item?.title || "Senior Project work")}</strong>
        <p class="workspace-muted" data-student-deadline-phase="true">${escapeHtml(phaseContext)}</p>
        <p data-student-deadline-due="true">${escapeHtml(studentDueText(item))}</p>
        <p class="workspace-student-deadline-urgency" data-student-deadline-danger="true">${escapeHtml(urgency.copy)}</p>
        <p class="workspace-muted" data-student-deadline-next="true">${escapeHtml(studentInstructionCopy(item?.nextAction || "Open this item and keep moving."))}</p>
      </div>
      <div class="workspace-row-actions">
        ${actionButtons}
        ${studentStatusPill(item?.status || "missing")}
      </div>
    </article>
  `;
}

function studentDeadlineUrgency(item = {}) {
  const dueTime = Date.parse(item?.dueDate || "");
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  const isRevision = status === "revision_requested";
  if (!Number.isFinite(dueTime)) {
    return {
      state: "scheduled",
      copy: isRevision ? "Revision work should be fixed before this deadline." : "Use this due date to decide what to open first.",
    };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueTime);
  due.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (daysUntil < 0) {
    return {
      state: "overdue",
      copy: isRevision ? "Overdue: fix this and turn it in again before new phase work." : "Overdue: open this item, add the file, and turn it in.",
    };
  }
  if (daysUntil <= 3) {
    return {
      state: "due-soon",
      copy: isRevision ? "Due soon: revise this before starting anything new." : "Due soon: finish this item before lower-priority work.",
    };
  }
  return {
    state: "scheduled",
    copy: isRevision ? "Revision work is scheduled; keep it ahead of new phase work." : "Scheduled: keep this on deck after urgent items.",
  };
}

function renderStudentStepButtons(item, openLabel = "Open item") {
  const openRequirementButton = renderStudentRequirementOpenButton(item, openLabel);
  const submissionActionButton = renderStudentSubmissionActionButton(item);
  return `${openRequirementButton}${submissionActionButton}`;
}

function renderStudentRequirementPanel(requirements = [], summary = {}, feedback = [], detailState = defaultStudentRequirementDetailState(), evidence = [], historyState = defaultStudentFeedbackHistoryState()) {
  const rows = Array.isArray(requirements) ? requirements : [];
  return `
    <section class="workspace-dashboard-card workspace-student-requirements-panel" data-student-requirements-panel="true" data-student-requirements-count="${escapeHtml(rows.length)}" aria-labelledby="studentRequirementChecklistTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Booklet checklist</p>
          <h2 id="studentRequirementChecklistTitle">Your Project Checklist</h2>
          <p>${escapeHtml(rows.length ? "Work one stage at a time. Open the current stage. Finish the item. Add its Google Drive link. Turn it in." : "Your teacher has not added the first project item yet.")}</p>
        </div>
      </div>
      ${renderStudentRequirementPanelBody(requirements, summary, feedback, detailState, evidence, historyState)}
    </section>
  `;
}

function renderStudentRequirementPanelBody(requirements = [], summary = {}, feedback = [], detailState = defaultStudentRequirementDetailState(), evidence = [], historyState = defaultStudentFeedbackHistoryState()) {
  const rows = Array.isArray(requirements) ? requirements : [];
  const phaseGroups = groupStudentRequirementsByPhase(rows);
  const activePhaseKey = activeStudentRequirementPhaseKey(phaseGroups, detailState);
  const visiblePhaseGroups = activePhaseKey
    ? phaseGroups.filter((group) => group.key === activePhaseKey)
    : phaseGroups;
  return `
      ${phaseGroups.length > 1 ? renderStudentRequirementPhaseFilters(phaseGroups, summary, detailState) : ""}
      <div class="workspace-list">
        ${visiblePhaseGroups.length ? visiblePhaseGroups.map((group) => renderStudentRequirementPhaseGroup(group, feedback, detailState, evidence, historyState, rows)).join("") : `
          <article class="workspace-empty-state-card" data-student-requirements-empty="true">
            <strong>Your teacher has not added work yet.</strong>
            <p>${escapeHtml(summary.waitingForReviewCount ? "Your teacher is checking the work you turned in. Stay on Turned in until feedback appears." : "Ask your teacher which project item should be added first. Do not start a new phase until it appears here.")}</p>
          </article>
        `}
      </div>
  `;
}

function groupStudentRequirementsByPhase(rows) {
  const groups = [];
  const byPhase = new Map();
  rows.forEach((row, index) => {
    const phase = studentBookletPhaseInfo(row?.phase || row?.phaseLabel || "unassigned", row?.phaseLabel || "");
    const key = phase.key || "unassigned";
    if (!byPhase.has(key)) {
      const group = {
        key,
        label: phase.label || row?.phaseLabel || (row?.phase ? statusText(row.phase) : "Other required work"),
        guidance: phase.guidance || "Use this phase to check the listed work, files, and next step.",
        deliverable: phase.deliverable || "Finish the work your teacher lists for this phase.",
        done: phase.done || "Your teacher marks the listed work done.",
        checklist: Array.isArray(phase.checklist) ? phase.checklist : [],
        rows: [],
        completeCount: 0,
        remainingCount: 0,
        originalIndex: index,
      };
      byPhase.set(key, group);
      groups.push(group);
    }
    byPhase.get(key).rows.push(row);
  });
  groups.forEach((group) => {
    group.completeCount = group.rows.filter((row) => isStudentRequirementComplete(row?.status)).length;
    group.remainingCount = Math.max(0, group.rows.length - group.completeCount);
  });
  return groups.sort((left, right) => {
    const phaseDelta = studentBookletPhaseRank(left.key) - studentBookletPhaseRank(right.key);
    if (phaseDelta !== 0) return phaseDelta;
    return left.originalIndex - right.originalIndex;
  });
}

function studentRequirementPhaseKey(value) {
  return cleanDirectoryFilter(studentBookletPhaseKey(value || "unassigned"));
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

function studentPrimaryActionFromStep(step = null, overrides = {}) {
  return {
    requirementId: step?.requirementId || null,
    submissionId: step?.submissionId || null,
    submissionStatus: step?.submissionStatus || null,
    evidenceCount: safeNumber(step?.evidenceCount),
    itemTitle: studentInstructionCopy(overrides.itemTitle || step?.title || "your current Senior Project item"),
    title: studentInstructionCopy(overrides.title || step?.title || "Keep working on the next item"),
    detail: studentInstructionCopy(overrides.detail || step?.detail || "Open the item in the list below and keep working."),
    status: overrides.status || step?.status || "pending",
    owner: studentInstructionCopy(overrides.owner || "Your action"),
    when: studentInstructionCopy(overrides.when || studentDueText(step, "Use the next-steps list below.")),
  };
}

function studentPrimaryCommandCopy(action = {}, summary = {}) {
  const status = normalizeStatus(action.status || action.submissionStatus);
  if (status === "revision_requested") return "Read your feedback. Fix your work. Turn it in again.";
  if (["submitted", "under_review", "pending_review"].includes(status)) return "View what you turned in. Wait for your teacher.";
  if (status === "draft" || status === "missing" || summary?.missingRequiredCount) return "Open this item. Finish the work. Add a Google Drive link if needed.";
  if (["provider_unavailable", "failed", "expired", "expiring_soon"].includes(status)) return studentInstructionCopy(action.detail || "Ask staff for final-file help.");
  if (summary?.requirementsTotal && !summary?.missingRequiredCount && !summary?.waitingForReviewCount && !summary?.revisionRequestedCount) return "You are caught up right now.";
  return "Check your work. Ask your teacher before skipping ahead.";
}

function studentArchivePrimaryNextAction(body = null) {
  if (!body) return null;
  const guidance = studentArchiveGuidance(body);
  if (!guidance?.status) return null;
  if (["provider_unavailable", "failed", "expired", "expiring_soon"].includes(normalizeStatus(guidance.status))) {
    return {
      title: guidance.title || "Check final files",
      detail: studentInstructionCopy(guidance.detail || "Final-file closeout needs attention before download."),
      status: guidance.status,
      owner: "Program staff",
      when: studentInstructionCopy(guidance.when || "Ask your Program Teacher for the next closeout step."),
    };
  }
  return null;
}

function studentBookletPhaseRank(value) {
  const key = studentBookletPhaseKey(value);
  const index = STUDENT_BOOKLET_PHASE_ORDER.indexOf(key);
  return index === -1 ? STUDENT_BOOKLET_PHASE_ORDER.length : index;
}

function activeStudentRequirementPhaseKey(phaseGroups = [], detailState = defaultStudentRequirementDetailState()) {
  const selectedPhaseKey = studentRequirementPhaseKey(detailState?.selectedPhaseKey || "");
  if (!selectedPhaseKey) return "";
  return phaseGroups.some((group) => group.key === selectedPhaseKey) ? selectedPhaseKey : "";
}

function renderStudentRequirementPhaseFilters(phaseGroups = [], summary = {}, detailState = defaultStudentRequirementDetailState()) {
  const activePhaseKey = activeStudentRequirementPhaseKey(phaseGroups, detailState);
  const activeGroup = phaseGroups.find((group) => group.key === activePhaseKey) || null;
  const currentPhaseKey = studentRequirementPhaseKey(summary?.currentPhase || summary?.currentPhaseLabel || "");
  const currentGroup = phaseGroups.find((group) => group.key === currentPhaseKey) || null;
  const note = activeGroup
    ? `${activeGroup.label}: ${activeGroup.completeCount} of ${activeGroup.rows.length} done${activeGroup.remainingCount ? `, ${activeGroup.remainingCount} still need work.` : ". Everything in this phase is done."}`
    : currentGroup
      ? `Current phase: ${currentGroup.label}. Show one phase if the full checklist feels too long.`
      : "Focus one project phase at a time if you want a shorter checklist.";
  const currentIndex = Math.max(0, phaseGroups.findIndex((group) => group.key === currentPhaseKey));
  const progressPercent = phaseGroups.length > 1 ? Math.round((currentIndex / (phaseGroups.length - 1)) * 100) : 0;
  return `
    <section class="workspace-phase-progress" data-student-requirement-phase-focus="true">
      <div class="workspace-phase-progress-head">
        <div>
          <strong>Project timeline</strong>
          <span>Choose a stage to see its work.</span>
        </div>
        <p class="workspace-active-filter-note">${escapeHtml(note)}</p>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-student-requirement-phase-action="set-phase" data-student-requirement-phase-key="" aria-pressed="${!activePhaseKey ? "true" : "false"}">
          Show all
        </button>
      </div>
      <div class="workspace-phase-timeline" role="group" aria-label="Senior Project timeline">
        ${renderProgressSvg(progressPercent, "", "workspace-phase-timeline-meter", { track: true })}
        ${phaseGroups.map((group, index) => {
          const isComplete = group.rows.length > 0 && group.completeCount >= group.rows.length;
          const isCurrent = group.key === currentPhaseKey;
          const isSelected = group.key === activePhaseKey;
          const state = isComplete ? "complete" : isCurrent ? "current" : index < currentIndex ? "past" : "future";
          return `
          <button class="workspace-phase-stop is-${escapeHtml(state)} ${isSelected ? "is-selected" : ""}" type="button" data-student-requirement-phase-action="set-phase" data-student-requirement-phase-key="${escapeHtml(group.key)}" data-phase-key="${escapeHtml(group.key)}" aria-label="${escapeHtml(`${group.label}. ${isCurrent ? "Current stage." : isComplete ? "Complete." : `${group.remainingCount} item${group.remainingCount === 1 ? "" : "s"} left.`}`)}" aria-pressed="${isSelected ? "true" : "false"}">
            <span class="workspace-phase-stop-dot" aria-hidden="true">${isComplete ? "✓" : escapeHtml(index + 1)}</span>
            <strong>${escapeHtml(studentPhaseShortLabel(group.key, group.label))}</strong>
            <small>${isCurrent ? "Now" : isComplete ? "Done" : ""}</small>
          </button>
        `; }).join("")}
      </div>
    </section>
  `;
}

function renderStudentRequirementPhaseGroup(group, feedback = [], detailState = defaultStudentRequirementDetailState(), evidence = [], historyState = defaultStudentFeedbackHistoryState(), navigationRows = []) {
  const rows = Array.isArray(group?.rows) ? group.rows : [];
  const completeCount = safeNumber(group?.completeCount);
  const remainingCount = safeNumber(group?.remainingCount);
  const guidance = String(group?.guidance || "").trim();
  const deliverable = String(group?.deliverable || "").trim();
  const done = String(group?.done || "").trim();
  const phaseSummary = rows.length
    ? `${completeCount} of ${rows.length} done${remainingCount ? ` / ${remainingCount} still need work` : ""}`
    : "No work in this phase yet.";
  return `
    <section class="workspace-student-requirement-phase" data-student-requirement-phase="true" data-student-requirement-phase-key="${escapeHtml(group?.key || "unassigned")}" data-student-requirement-phase-total="${escapeHtml(rows.length)}" data-student-requirement-phase-complete="${escapeHtml(completeCount)}">
      <div class="workspace-student-requirement-phase-head">
        <div>
          <h3>${escapeHtml(group?.label || "Other required work")}</h3>
          ${guidance ? `<p data-student-requirement-phase-guidance="true">${escapeHtml(guidance)}</p>` : ""}
          ${deliverable ? `<p class="workspace-student-phase-goal" data-student-requirement-phase-deliverable="true"><strong>Main thing to finish:</strong> ${escapeHtml(deliverable)}</p>` : ""}
          ${done ? `<p class="workspace-muted" data-student-requirement-phase-done="true"><strong>Done when:</strong> ${escapeHtml(done)}</p>` : ""}
          <p class="workspace-muted">${escapeHtml(phaseSummary)}</p>
        </div>
      </div>
      <div class="workspace-list">
        ${rows.map((row) => {
          const allRows = Array.isArray(navigationRows) ? navigationRows : [];
          const rowId = studentRequirementId(row);
          const index = allRows.findIndex((item) => studentRequirementId(item) === rowId);
          return renderStudentRequirementRow(row, feedback, detailState, evidence, historyState, {
            position: index >= 0 ? index + 1 : 0,
            total: allRows.length,
            previous: index > 0 ? allRows[index - 1] : null,
            next: index >= 0 && index < allRows.length - 1 ? allRows[index + 1] : null,
          });
        }).join("")}
      </div>
    </section>
  `;
}

function isStudentRequirementComplete(status) {
  return ["approved", "archived", "complete", "completed"].includes(normalizeStatus(status));
}

function studentRequirementApprovalGateText(item = {}) {
  const status = normalizeStatus(item?.submissionStatus || item?.status || item?.progressStatus);
  if (["approved", "archived", "complete", "completed"].includes(status)) {
    return "Done. Continue with the next assigned item.";
  }
  if (["submitted", "under_review", "pending_review"].includes(status)) {
    return "Wait here. Your teacher checks this item before next steps.";
  }
  if (status === "revision_requested") {
    return "Fix this item. Turn it in again. Wait for your teacher.";
  }
  if (status === "blocked") {
    return "Ask your teacher what to fix before you keep going.";
  }
  return "Do this item. Add a Google Drive link if needed. Turn it in for review.";
}

function renderStudentRequirementRow(item, feedback = [], detailState = defaultStudentRequirementDetailState(), evidence = [], historyState = defaultStudentFeedbackHistoryState(), navigation = {}) {
  const version = safeNumber(item?.submissionVersion);
  const updatedAt = item?.lastUpdatedAt ? formatDate(item.lastUpdatedAt) : "Not available yet";
  const description = String(item?.description || "").trim();
  const qualityPrompt = String(item?.qualityPrompt || "").trim();
  const approvalGate = studentRequirementApprovalGateText(item);
  const submissionId = String(item?.submissionId || "").trim();
  const evidenceCount = safeNumber(item?.evidenceCount);
  const requirementId = studentRequirementId(item);
  const phase = studentBookletPhaseInfo(item?.phase || item?.phaseLabel || "", item?.phaseLabel || "");
  const detailDomId = studentRequirementDetailDomId(requirementId);
  const selected = requirementId && detailState?.selectedRequirementId === requirementId;
  const detailActionLabel = selected ? "Hide details" : "Check details";
  const latestFeedback = latestFeedbackForRequirement(item, feedback);
  const relatedEvidence = matchingEvidenceForRequirement(item, evidence);
  const phaseMeta = [phase.label || "Phase not set", `Updated ${updatedAt}`].filter(Boolean).join(" / ");
  const requirementState = normalizeStatus(item?.submissionStatus || item?.status || "missing");
  return `
    <article class="workspace-row workspace-student-requirement-row ${selected ? "is-selected" : ""}" data-student-requirement-row="true" data-student-requirement-state="${escapeHtml(requirementState)}" data-student-requirement-selected="${selected ? "true" : "false"}" data-student-requirement-id="${escapeHtml(requirementId)}" data-student-requirement-submission-id="${escapeHtml(submissionId)}" data-student-requirement-evidence-count="${escapeHtml(evidenceCount)}">
      <div>
        <strong>${escapeHtml(item?.title || "Senior Project work")}</strong>
        ${renderStudentRequirementDeliverableCue(item, phase)}
        ${description ? `<p class="workspace-student-requirement-guidance" data-student-requirement-description="true">${escapeHtml(description)}</p>` : ""}
        ${qualityPrompt ? `<p class="workspace-muted workspace-student-requirement-nudge" data-student-requirement-quality="true">Try this: ${escapeHtml(qualityPrompt)}</p>` : ""}
        <p>${escapeHtml(phaseMeta)}</p>
        <p class="workspace-muted" data-student-requirement-due="true">${escapeHtml(studentDueText(item))}</p>
        <p class="workspace-muted" data-student-requirement-next="true">${escapeHtml(studentInstructionCopy(item?.nextAction || "Ask your teacher what to do next."))}</p>
        <p class="workspace-student-requirement-gate" data-student-requirement-approval-gate="true">${escapeHtml(approvalGate)}</p>
      </div>
      <div class="workspace-row-actions">
        ${submissionId ? `<span class="workspace-site-context-badge" data-student-requirement-evidence="true">${escapeHtml(evidenceCount)} Drive ${pluralize(evidenceCount, "link")}</span>` : ""}
        ${version > 0 ? `<span class="workspace-site-context-badge" data-student-requirement-version="true">Turned in #${escapeHtml(version)}</span>` : ""}
        ${requirementId ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-requirement-action="toggle-detail" data-student-requirement-id="${escapeHtml(requirementId)}" aria-expanded="${selected ? "true" : "false"}" aria-controls="${escapeHtml(detailDomId)}" aria-label="${escapeHtml(`${detailActionLabel}: ${studentRequirementActionLabel(item)}`)}">${escapeHtml(detailActionLabel)}</button>` : ""}
        ${renderStudentRequirementAction(item, evidenceCount)}
        ${studentStatusPill(item?.status || "missing")}
      </div>
      ${selected ? renderStudentRequirementDetail(item, latestFeedback, relatedEvidence, historyState, navigation) : ""}
    </article>
  `;
}

function renderStudentRequirementDeliverableCue(item = {}, phase = {}) {
  const deliverable = String(phase?.deliverable || "").trim();
  const done = String(phase?.done || "").trim();
  if (!deliverable && !done) return "";
  return `
    <div class="workspace-student-requirement-deliverable" data-student-requirement-deliverable="true">
      ${deliverable ? `<p><strong>This item helps finish:</strong> ${escapeHtml(deliverable)}</p>` : ""}
      ${done ? `<p><strong>Done when:</strong> ${escapeHtml(done)}</p>` : ""}
    </div>
  `;
}

function studentRequirementId(item) {
  return cleanDirectoryFilter(item?.requirementId || item?.requirement_id || item?.id || item?.title || "");
}

function studentRequirementPhaseKeyForId(requirements = [], requirementId = "") {
  const normalizedRequirementId = cleanDirectoryFilter(requirementId);
  if (!normalizedRequirementId) return "";
  const match = requirements.find((row) => studentRequirementId(row) === normalizedRequirementId);
  return studentRequirementPhaseKey(match?.phase || match?.phaseLabel || "");
}

function studentRequirementDetailDomId(requirementId) {
  return `studentRequirementDetail-${String(requirementId || "item").replace(/[^A-Za-z0-9_-]+/g, "-")}`;
}

function latestFeedbackForRequirement(item, feedback = []) {
  const submissionId = String(item?.submissionId || "").trim();
  if (!submissionId) return null;
  return latestFeedbackForSubmission({ id: submissionId }, feedback);
}

function matchingEvidenceForRequirement(item, evidence = []) {
  const requirementId = cleanDirectoryFilter(item?.requirementId || "");
  const submissionId = cleanDirectoryFilter(item?.submissionId || "");
  return (Array.isArray(evidence) ? evidence : []).filter((row) => {
    const rowRequirementId = cleanDirectoryFilter(row?.requirementId || "");
    const rowSubmissionId = cleanDirectoryFilter(row?.submissionId || "");
    return (requirementId && rowRequirementId === requirementId) || (submissionId && rowSubmissionId === submissionId);
  });
}

function renderStudentRequirementDetail(item, latestFeedback = null, evidenceRows = [], historyState = defaultStudentFeedbackHistoryState(), navigation = {}) {
  const requirementId = studentRequirementId(item);
  const detailDomId = studentRequirementDetailDomId(requirementId);
  const submissionId = cleanDirectoryFilter(item?.submissionId || "");
  const evidenceCount = safeNumber(item?.evidenceCount);
  const version = safeNumber(item?.submissionVersion);
  const status = studentStatusText(item?.status || "missing");
  const submissionStatus = item?.submissionStatus ? studentStatusText(item.submissionStatus) : status;
  const timelineSelected = studentFeedbackSelectionMatches(historyState, submissionId, "requirements");
  return `
    <section id="${escapeHtml(detailDomId)}" class="workspace-student-requirement-detail" data-student-requirement-detail="true">
      <div>
        <h4>Open item</h4>
        <p class="workspace-muted">Write your answer here. Add a Google Drive link only when it helps show the work.</p>
      </div>
      ${renderStudentGuidedDraft(item)}
      <div class="workspace-student-requirement-detail-grid">
        ${renderStudentRequirementDetailFact("Status", status)}
        ${renderStudentRequirementDetailFact("Due date", studentDueText(item))}
        ${renderStudentRequirementDetailFact("Drive links", `${evidenceCount} ${pluralize(evidenceCount, "link")} saved`)}
        ${renderStudentRequirementDetailFact("Turned in", version > 0 ? `#${version}: ${submissionStatus}` : "Not turned in yet")}
        ${renderStudentRequirementDetailFact("Next step", studentInstructionCopy(item?.nextAction || "Ask your Program Teacher what to do next."))}
      </div>
      <details class="workspace-student-turnin-check">
        <summary>Check before turning in</summary>
        ${renderStudentRequirementSendPath(item, latestFeedback, evidenceRows)}
        ${renderStudentRequirementReadyChecklist(item, latestFeedback, evidenceRows)}
      </details>
      ${latestFeedback ? `
        <article class="workspace-mini-row" data-student-requirement-feedback="true">
          <span>Latest teacher feedback</span>
          <small>${escapeHtml(latestFeedback.message || "Program Teacher feedback was recorded for this work.")}</small>
          <small>${escapeHtml(latestFeedback.authorName || "Program Teacher")} / ${escapeHtml(formatDate(latestFeedback.createdAt))}</small>
        </article>
      ` : ""}
      ${submissionId ? `
        <div class="workspace-row-actions" data-student-requirement-timeline-actions="true">
          <button class="workspace-link-button workspace-link-button-small" type="button" data-student-feedback-action="open-history" data-student-feedback-origin="requirements" data-student-feedback-submission-id="${escapeHtml(submissionId)}">
            ${escapeHtml(timelineSelected ? "Refresh work history" : "View work history")}
          </button>
        </div>
      ` : ""}
      ${timelineSelected ? `<div data-student-requirement-timeline="true">${renderStudentFeedbackTimeline(historyState)}</div>` : ""}
      ${evidenceRows.length ? `
        <div>
          <h4>Google Drive links already added</h4>
          <p class="workspace-muted">These links show this work.</p>
        </div>
        <div class="workspace-list" data-student-requirement-evidence-list="true">
          ${evidenceRows.map(renderStudentRequirementEvidenceRow).join("")}
        </div>
      ` : ""}
      ${renderStudentRequirementNavigator(item, navigation)}
    </section>
  `;
}

function renderStudentRequirementNavigator(item = {}, navigation = {}) {
  if (safeNumber(navigation.total) <= 1) return "";
  const previous = navigation.previous || null;
  const next = navigation.next || null;
  const currentId = studentRequirementId(item);
  return `
    <nav class="workspace-item-navigator workspace-student-item-navigator" aria-label="Browse project checklist items" data-student-item-navigator="true">
      <span>Item ${escapeHtml(safeNumber(navigation.position))} of ${escapeHtml(safeNumber(navigation.total))}</span>
      <div>
        ${previous ? `<button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-student-requirement-action="open-detail" data-student-requirement-id="${escapeHtml(studentRequirementId(previous))}" aria-label="Open previous item: ${escapeHtml(studentRequirementActionLabel(previous))}">Previous item</button>` : ""}
        <button class="workspace-link-button workspace-link-button-small" type="button" data-student-requirement-action="toggle-detail" data-student-requirement-id="${escapeHtml(currentId)}">Back to checklist</button>
        ${next ? `<button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-student-requirement-action="open-detail" data-student-requirement-id="${escapeHtml(studentRequirementId(next))}" aria-label="Open next item: ${escapeHtml(studentRequirementActionLabel(next))}">Next item</button>` : ""}
      </div>
    </nav>
  `;
}

function renderStudentGuidedDraft(item = {}) {
  const requirementId = studentRequirementId(item);
  if (!requirementId) return "";
  const model = studentGuidedWritingModel(item);
  const draftText = String(item?.draftText || "");
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  const readOnly = isViewAsStudentActive() || ["submitted", "approved", "archived", "complete", "completed"].includes(status);
  const futurePhase = studentRequirementIsFuturePhase(item);
  const sharedWithTeam = item?.workScope === "project";
  const textareaId = `studentDraft-${requirementId.replace(/[^A-Za-z0-9_-]+/g, "-")}`;
  return `
    <section class="workspace-guided-draft" data-student-guided-draft="${escapeHtml(requirementId)}" data-work-ahead="${futurePhase ? "true" : "false"}">
      <div class="workspace-guided-draft-head">
        <div>
          <p class="workspace-kicker">Write it here</p>
          <h4>${escapeHtml(model.title)}</h4>
          <p>${escapeHtml(model.detail)}</p>
        </div>
        <div class="workspace-row-actions">
          ${futurePhase ? '<span class="workspace-chip">Work ahead</span>' : ""}
          <span class="workspace-chip">${sharedWithTeam ? "Shared team answer" : "Your own answer"}</span>
        </div>
      </div>
      <ol class="workspace-guided-prompts">
        ${model.prompts.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}
      </ol>
      ${readOnly ? `
        <div class="workspace-guided-response" data-student-guided-response-readonly="true">
          ${draftText ? escapeHtml(draftText).replace(/\n/g, "<br>") : "No writing was saved for this item."}
        </div>
        <p class="workspace-muted">${escapeHtml(isViewAsStudentActive() ? "Preview is read-only." : "This writing is locked while your work is being checked.")}</p>
      ` : `
        <form class="workspace-guided-draft-form" data-student-guided-draft-form="true" data-requirement-id="${escapeHtml(requirementId)}">
          <label class="workspace-label" for="${escapeHtml(textareaId)}">Your answer</label>
          <textarea class="workspace-textarea" id="${escapeHtml(textareaId)}" name="responseText" rows="9" maxlength="6000" required>${escapeHtml(draftText)}</textarea>
          <p class="workspace-muted">${escapeHtml(model.hint)}</p>
          <div class="workspace-guided-draft-actions">
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-draft-action="add-starter" data-student-draft-starter="${escapeHtml(model.starter)}">Add a starter</button>
            <span class="workspace-muted" data-student-draft-count="true">${escapeHtml(studentWordCount(draftText))} words</span>
            <button class="workspace-button workspace-button-primary" type="submit">Save draft</button>
          </div>
          <p class="workspace-muted">${escapeHtml(sharedWithTeam ? "Everyone on your project shares this answer. Save only changes your team wants to keep." : "This answer belongs to you, even when you work on a team.")}</p>
          <p class="workspace-muted">${escapeHtml(futurePhase ? "You can save this now. You can turn it in after the earlier phase is approved." : "Save as often as you want. Your teacher will not see it as turned in until you press Turn in.")}</p>
        </form>
      `}
    </section>
  `;
}

function studentGuidedWritingModel(item = {}) {
  const id = studentRequirementId(item).toLowerCase();
  const title = String(item?.title || "this project item").toLowerCase();
  const phase = studentRequirementPhaseKey(item?.phase || item?.phaseLabel || "");
  if (id.includes("proposal") || title.includes("proposal")) {
    return {
      title: "Build your proposal",
      detail: "Answer three short questions. Full sentences are enough.",
      prompts: ["What will you make or do?", "Who will this help, and why?", "How will you know your project worked?"],
      hint: "Write a short paragraph for each question.",
      starter: "My project will...\n\nThis matters because...\n\nI will know it worked when...",
    };
  }
  if (id.includes("mentor") || title.includes("mentor")) {
    return {
      title: "Plan your mentor check-in",
      detail: "Write the questions you want to ask and the help you need.",
      prompts: ["What do you want your mentor to look at?", "What question will you ask?", "What will you do after the meeting?"],
      hint: "Write a few sentences about your meeting plan.",
      starter: "I want my mentor to look at...\n\nMy main question is...\n\nAfter we meet, I will...",
    };
  }
  if (["phase-2a", "phase-2b"].includes(phase)) {
    return {
      title: "Add to your build journal",
      detail: "Save a short note about this work day.",
      prompts: ["What did you work on?", "What proof did you save?", "What problem or next step do you have?"],
      hint: "A few clear sentences are enough.",
      starter: "Today I worked on...\n\nI saved... as proof.\n\nA problem or next step is...",
    };
  }
  if (["phase-3a", "phase-3b"].includes(phase) || title.includes("presentation")) {
    return {
      title: "Plan what you will share",
      detail: "Use your project proof to tell one clear story.",
      prompts: ["What should people understand first?", "What proof will you show?", "What question may people ask?"],
      hint: "Write notes you can use when you practice.",
      starter: "First, I want people to understand...\n\nI will show...\n\nPeople may ask...",
    };
  }
  if (id.includes("reflection") || title.includes("reflection") || title.includes("thanks")) {
    return {
      title: "Write your reflection",
      detail: "Tell what happened in your own words.",
      prompts: ["What did you do?", "What did you learn?", "What will you do next?"],
      hint: "Write one short paragraph for each question.",
      starter: "I worked on...\n\nI learned...\n\nNext, I will...",
    };
  }
  if (phase === "finish" || title.includes("resume") || title.includes("portfolio")) {
    return {
      title: "Save what you learned",
      detail: "Turn your project into proof you can use later.",
      prompts: ["What skill did you use?", "What result can you show?", "How will this help after high school?"],
      hint: "Use short, strong sentences.",
      starter: "I used...\n\nThe result was...\n\nThis will help me...",
    };
  }
  return {
    title: "Write about this work",
    detail: "Use the questions to make a clear short answer.",
    prompts: ["What did you do?", "What proof or example can you share?", "What is your next step?"],
    hint: "Write your answer here.",
    starter: "I did...\n\nOne example is...\n\nMy next step is...",
  };
}

function studentWordCount(value = "") {
  const words = String(value || "").trim().match(/\S+/g);
  return words ? words.length : 0;
}

function studentRequirementIsFuturePhase(item = {}) {
  const currentPhase = studentRequirementPhaseKey(unwrap(currentData.dashboard)?.summary?.currentPhase || "");
  const itemPhase = studentRequirementPhaseKey(item?.phase || item?.phaseLabel || "");
  return Boolean(currentPhase && itemPhase && studentBookletPhaseRank(itemPhase) > studentBookletPhaseRank(currentPhase));
}

function renderStudentRequirementSendPath(item = {}, latestFeedback = null, evidenceRows = []) {
  const actionState = studentSubmissionActionState(item);
  const evidenceCount = Math.max(safeNumber(item?.evidenceCount), Array.isArray(evidenceRows) ? evidenceRows.length : 0);
  const hasWrittenResponse = Boolean(item?.hasWrittenResponse || String(item?.draftText || "").trim());
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  const phase = studentBookletPhaseInfo(item?.phase || item?.phaseLabel || "", item?.phaseLabel || "");
  const phaseGoal = phase.deliverable || "the current phase deliverable";
  const needsRevision = ["revision_requested", "needs_revision"].includes(status);
  const waitingForReview = ["submitted", "under_review", "reviewing", "pending_review"].includes(status);
  const approved = ["approved", "archived", "complete", "completed"].includes(status);
  const cards = [
    {
      id: "finish",
      title: needsRevision ? "Fix the note first" : "Finish this item",
      detail: needsRevision
        ? (latestFeedback?.message || "Read the teacher note and make the exact change.")
        : `This item helps finish ${phaseGoal}. Finish the work described here before sending it.`,
      tone: needsRevision ? "warning" : "student",
    },
    {
      id: "proof",
      title: hasWrittenResponse ? "Writing saved" : evidenceCount ? "Drive link added" : "Add your work",
      detail: hasWrittenResponse
        ? `${studentWordCount(item?.draftText || "")} words are saved in this item.`
        : evidenceCount
          ? `${evidenceCount} ${pluralize(evidenceCount, "Drive link")} is saved on this item.`
          : "Write your answer here, or add the Google Drive link that shows this work.",
      tone: hasWrittenResponse || evidenceCount ? "ready" : "warning",
    },
    {
      id: "send",
      title: approved ? "Done" : waitingForReview ? "Ask your teacher" : actionState.canSubmit ? actionState.label : "Not ready",
      detail: approved
        ? "Use this approval to continue with the next assigned item."
        : waitingForReview
          ? "Your teacher is checking this work. Do not turn it in again unless they ask."
          : actionState.canSubmit
            ? "Turn it in only after the work and Drive link match this item."
            : actionState.reason,
      tone: approved || actionState.canSubmit ? "ready" : waitingForReview ? "teacher" : "quiet",
    },
  ];
  return `
    <section class="workspace-student-send-path" data-student-send-path="true" aria-label="Before you send this item">
      <div>
        <strong>Before you turn it in</strong>
        <p>${escapeHtml(`Stay on this item until the work, Drive link, and teacher note all match. Goal: ${phaseGoal}`)}</p>
      </div>
      <div class="workspace-student-send-path-grid">
        ${cards.map((card) => `
          <article class="workspace-student-send-path-card ${escapeHtml(card.tone)}" data-student-send-path-card="${escapeHtml(card.id)}">
            <span>${escapeHtml(card.title)}</span>
            <p>${escapeHtml(card.detail)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStudentRequirementReadyChecklist(item = {}, latestFeedback = null, evidenceRows = []) {
  const actionState = studentSubmissionActionState(item);
  const evidenceCount = Math.max(safeNumber(item?.evidenceCount), Array.isArray(evidenceRows) ? evidenceRows.length : 0);
  const hasWrittenResponse = Boolean(item?.hasWrittenResponse || String(item?.draftText || "").trim());
  const hasWork = hasWrittenResponse || evidenceCount > 0;
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  const needsRevision = status === "revision_requested";
  const checks = [
    {
      label: "Right item selected",
      detail: item?.submissionId ? "This Drive link is tied to this work item." : "Start or select this work item before adding a Drive link.",
      state: item?.submissionId ? "ready" : "blocked",
    },
    {
      label: "Work added",
      detail: hasWrittenResponse
        ? `${studentWordCount(item?.draftText || "")} written words saved.`
        : evidenceCount
          ? `${evidenceCount} ${pluralize(evidenceCount, "Drive link")} saved.`
          : "Write your answer here or add a Google Drive link before turning in this work.",
      state: hasWork ? "ready" : "blocked",
    },
    {
      label: "Teacher feedback checked",
      detail: needsRevision
        ? (latestFeedback?.message || "Open Feedback and check the exact change.")
        : "No feedback to fix is blocking this item right now.",
      state: needsRevision && !latestFeedback ? "needs_review" : "ready",
    },
    {
      label: "Ready to turn in",
      detail: actionState.canSubmit ? `Use ${actionState.label} when the Drive link matches this item.` : actionState.reason,
      state: actionState.canSubmit ? "ready" : "blocked",
    },
  ];
  return `
    <section class="workspace-student-ready-checklist" data-student-ready-checklist="true" data-student-ready-checklist-state="${escapeHtml(actionState.canSubmit ? "ready" : "blocked")}">
      <strong>Ready to turn in?</strong>
      <div>
        ${checks.map((check) => `
          <article data-student-ready-check="${escapeHtml(check.state)}">
            <span>${escapeHtml(check.label)}</span>
            <small>${escapeHtml(check.detail)}</small>
          </article>
        `).join("")}
      </div>
      ${actionState.canSubmit ? "" : `<p class="workspace-muted" data-student-submit-disabled-reason="true">${escapeHtml(actionState.reason)}</p>`}
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
    hasWrittenResponse: Boolean(item?.hasWrittenResponse || String(item?.draftText || "").trim()),
    requirementId: item?.requirementId || "",
    phase: item?.phase || item?.phaseLabel || "",
  });
}

function renderStudentRequirementOpenButton(item, label = "Open item") {
  const requirementId = cleanDirectoryFilter(item?.requirementId || "");
  if (!requirementId) return "";
  const actionLabel = studentRequirementActionLabel(item);
  return `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-requirement-action="open-detail" data-student-requirement-id="${escapeHtml(requirementId)}" aria-label="${escapeHtml(`${label}: ${actionLabel}`)}">${escapeHtml(label)}</button>`;
}

function studentRequirementActionLabel(item = {}) {
  const label = String(item.title || item.requirementTitle || item.requirement_title || "requirement").trim().replace(/\s+/g, " ");
  return label ? label.slice(0, 120) : "requirement";
}

function renderEvidenceActions(item, options = {}) {
  const includeRequirementAction = options.includeRequirementAction !== false;
  const actions = [];
  const actionLabel = evidenceActionLabel(item);
  if (includeRequirementAction && item.requirementId) {
    actions.push(renderStudentRequirementOpenButton(item));
  }
  const downloadUrl = item.source_kind === "google_drive_file" ? cleanWorkspaceEvidenceDownloadUrl(item.downloadUrl) : "";
  if (downloadUrl) {
    actions.push(`<a class="workspace-link-button workspace-link-button-small" data-evidence-download="file" href="${escapeHtml(downloadUrl)}" aria-label="Download file: ${escapeHtml(actionLabel)}">Download file</a>`);
  }
  const externalUrl = item.source_kind === "external_link" ? cleanWorkspaceHttpsUrl(item.externalUrl) : "";
  if (externalUrl) {
    actions.push(`<a class="workspace-link-button workspace-link-button-small" data-evidence-link="external" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open work link: ${escapeHtml(actionLabel)}">Open work link</a>`);
  }
  return actions;
}

function evidenceActionLabel(item = {}) {
  const label = String(item.title || item.requirementTitle || "file").trim().replace(/\s+/g, " ");
  return label ? label.slice(0, 120) : "file";
}

function cleanWorkspaceEvidenceDownloadUrl(value) {
  const trimmed = String(value || "").trim();
  return /^\/api\/evidence\/[^/?#]+\/download$/.test(trimmed) ? trimmed : "";
}

function renderStudentRequirementEvidenceRow(item) {
  const actions = renderEvidenceActions(item, { includeRequirementAction: false });
  const createdAt = item?.created_at ? formatDate(item.created_at) : "Added recently";
  const reviewStatus = item.review_status || "pending_review";
  return `
    <article class="workspace-mini-row" data-student-requirement-evidence-item="true">
      <span>${escapeHtml(item.title || "File or link")}</span>
      <small>${escapeHtml(evidenceSourceLabel(item.source_kind))} / ${escapeHtml(statusText(item.artifact_type || "file"))}</small>
      <small data-proof-review-status="true">${escapeHtml(createdAt)} / ${escapeHtml(studentEvidenceReviewStatusCopy(reviewStatus))}</small>
      ${actions.length ? `<div class="workspace-row-actions">${actions.join("")}</div>` : ""}
    </article>
  `;
}

function renderStudentSubmissionActionButton(item) {
  const actionState = studentSubmissionActionState(item);
  if (!actionState.visible) return "";
  if (isViewAsStudentActive()) {
    return `<span class="workspace-summary-badge" data-view-as-student-submit-disabled="true">Preview only</span>`;
  }
  if (!actionState.canSubmit) {
    if (actionState.reasonCode === "phase_locked") {
      return `<button class="workspace-button workspace-button-small workspace-button-secondary" type="button" disabled title="${escapeHtml(actionState.reason)}">${escapeHtml(actionState.label)}</button>`;
    }
    return `<button class="workspace-button workspace-button-small workspace-button-secondary" type="button" data-student-submission-action="focus-draft" data-student-requirement-id="${escapeHtml(actionState.requirementId)}" data-student-submission-id="${escapeHtml(actionState.submissionId)}">${escapeHtml(actionState.label)}</button>`;
  }
  return `<button class="workspace-button workspace-button-small workspace-button-primary" type="button" data-student-submission-action="submit" data-student-submission-id="${escapeHtml(actionState.submissionId)}">${escapeHtml(actionState.label)}</button>`;
}

function studentSubmissionActionState(item = {}) {
  const submissionId = String(item?.submissionId || "").trim();
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  const evidenceCount = safeNumber(item?.evidenceCount);
  const hasWrittenResponse = Boolean(item?.hasWrittenResponse || String(item?.draftText || "").trim());
  const requirementId = cleanDirectoryFilter(item?.requirementId || "");
  if (!submissionId || !["draft", "revision_requested"].includes(status)) {
    return {
      visible: false,
      canSubmit: false,
      submissionId,
      label: "",
      reason: "This item is not open for student sending right now.",
      reasonCode: "not_open",
      requirementId,
    };
  }
  if (studentRequirementIsFuturePhase(item)) {
    return {
      visible: true,
      canSubmit: false,
      submissionId,
      requirementId,
      label: "Finish earlier phase first",
      reason: "You can save this draft now. Turn it in after the earlier phase is approved.",
      reasonCode: "phase_locked",
    };
  }
  if (evidenceCount <= 0 && !hasWrittenResponse) {
    return {
      visible: true,
      canSubmit: false,
      submissionId,
      requirementId,
      label: "Add your work",
      reason: "Write an answer here or add a file before turning in this item.",
      reasonCode: "work_required",
    };
  }
  const label = status === "revision_requested" ? "Turn in again" : "Turn in";
  return {
    visible: true,
    canSubmit: true,
    submissionId,
    label,
    reason: "",
    reasonCode: "",
    requirementId,
  };
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
          <p class="workspace-kicker">Feedback</p>
          <h2 id="studentFeedbackTitle">Feedback</h2>
          <p>${escapeHtml(rows.length ? `Showing the latest ${countLabel}. Open a note to see what to do next.` : "Teacher notes will appear here.")}</p>
        </div>
      </div>
      ${renderStudentFeedbackPanelBody(feedback, summary, historyState)}
    </section>
  `;
}

function renderStudentFeedbackPanelBody(feedback = [], summary = {}, historyState = defaultStudentFeedbackHistoryState()) {
  const rows = Array.isArray(feedback) ? feedback : [];
  const activeFilter = studentFeedbackFilterKey(studentFeedbackFilter);
  const filteredRows = filterStudentFeedbackRows(rows, activeFilter);
  return `
      ${renderStudentFeedbackInboxGuide(rows, summary)}
      ${renderStudentRevisionLane(rows)}
      ${rows.length > 1 ? renderStudentFeedbackFilters(rows, activeFilter) : ""}
      <div class="workspace-list">
        ${filteredRows.length
          ? filteredRows.map((row) => renderStudentFeedbackRow(row, historyState)).join("")
          : renderStudentFeedbackEmptyState(summary, activeFilter, rows.length)}
      </div>
  `;
}

function renderStudentRevisionLane(rows = []) {
  const revisionRows = (Array.isArray(rows) ? rows : [])
    .filter((row) => ["revision_requested", "needs_revision"].includes(normalizeStatus(row?.submissionStatus || row?.status)));
  if (!revisionRows.length) return "";
  const first = revisionRows[0] || {};
  return `
    <section class="workspace-student-revision-lane" data-student-revision-lane="true" data-student-revision-lane-count="${escapeHtml(revisionRows.length)}">
      <div>
        <strong>Fix changes first</strong>
        <p>${escapeHtml(`Start with ${first.requirementTitle || "the first item that needs changes"}. Wait for approval before new phase work.`)}</p>
      </div>
      <ol>
        <li>Read the teacher note.</li>
        <li>Fix the matching work and file.</li>
        <li>Turn it in again. Then wait for your teacher.</li>
      </ol>
    </section>
  `;
}

function renderStudentFeedbackInboxGuide(rows = [], summary = {}) {
  const counts = studentFeedbackInboxCounts(rows);
  const headline = counts.revisionRequested
    ? `${counts.revisionRequested} note${counts.revisionRequested === 1 ? "" : "s"} ${counts.revisionRequested === 1 ? "needs" : "need"} your action first.`
    : counts.waiting
      ? "Read teacher notes. Then wait."
      : counts.approved
        ? "Approved notes show what is done and can be used next."
        : "Program Teacher feedback will appear here after review.";
  const nextMove = counts.revisionRequested
    ? "Open the matching work. Make the requested change. Add a corrected file if needed."
    : summary?.waitingForReviewCount
      ? "You are done for now on waiting items. Your teacher checks them next."
      : summary?.missingRequiredCount
        ? "Use the checklist for your next unfinished item."
        : "Check the checklist or ask your Program Teacher before starting a new phase.";
  return `
    <section class="workspace-student-feedback-inbox-guide" data-student-feedback-inbox-guide="true">
      <div>
        <strong>${escapeHtml(headline)}</strong>
        <p>${escapeHtml(nextMove)}</p>
      </div>
      <div class="workspace-student-feedback-inbox-counts" aria-label="Feedback inbox counts">
        <span><b>${escapeHtml(counts.revisionRequested)}</b> action</span>
        <span><b>${escapeHtml(counts.waiting)}</b> new note</span>
        <span><b>${escapeHtml(counts.approved)}</b> approved</span>
      </div>
    </section>
  `;
}

function studentFeedbackInboxCounts(rows = []) {
  return (Array.isArray(rows) ? rows : []).reduce((counts, row) => {
    const status = studentFeedbackFilterKey(row?.status);
    if (status === "revision_requested") counts.revisionRequested += 1;
    else if (status === "approved") counts.approved += 1;
    else counts.waiting += 1;
    return counts;
  }, { revisionRequested: 0, waiting: 0, approved: 0 });
}

function renderStudentFeedbackFilters(rows = [], activeFilter = "all") {
  const options = studentFeedbackFilterOptions(rows);
  return `
    <div class="workspace-active-filters" data-student-feedback-filters="true" data-student-feedback-active-filter="${escapeHtml(activeFilter)}">
      ${options.map((option) => `
        <button class="workspace-detail-tab ${option.value === activeFilter ? "is-active" : ""}" type="button" data-student-feedback-action="set-filter" data-student-feedback-filter="${escapeHtml(option.value)}" aria-pressed="${option.value === activeFilter ? "true" : "false"}">
          ${escapeHtml(`${option.label} (${option.count})`)}
        </button>
      `).join("")}
    </div>
  `;
}

function studentFeedbackFilterOptions(rows = []) {
  const counts = {
    all: Array.isArray(rows) ? rows.length : 0,
    revision_requested: 0,
    under_review: 0,
    approved: 0,
  };
  for (const row of Array.isArray(rows) ? rows : []) {
    const status = studentFeedbackFilterKey(row?.status);
    if (status !== "all") counts[status] += 1;
  }
  return [
    { value: "all", label: "All notes", count: counts.all },
    { value: "revision_requested", label: "Needs changes", count: counts.revision_requested },
    { value: "under_review", label: "New feedback", count: counts.under_review },
    { value: "approved", label: "Approved", count: counts.approved },
  ];
}

function studentFeedbackFilterKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "revision_requested") return "revision_requested";
  if (normalized === "approved") return "approved";
  if (normalized === "under_review") return "under_review";
  return "all";
}

function studentFeedbackFilterLabel(value) {
  if (value === "revision_requested") return "Needs changes";
  if (value === "under_review") return "New feedback";
  if (value === "approved") return "Old feedback";
  return "All feedback";
}

function filterStudentFeedbackRows(rows = [], filterKey = "all") {
  const activeFilter = studentFeedbackFilterKey(filterKey);
  const safeRows = Array.isArray(rows) ? rows : [];
  if (activeFilter === "all") return safeRows;
  return safeRows.filter((row) => studentFeedbackFilterKey(row?.status) === activeFilter);
}

function renderStudentFeedbackEmptyState(summary = {}, filterKey = "all", totalRows = 0) {
  if (!totalRows) {
    return `
      <article class="workspace-empty-state-card" data-student-feedback-empty="true">
        <strong>${escapeHtml(summary.revisionRequestedCount ? "No feedback details are available here yet." : "No feedback yet.")}</strong>
        <p>${escapeHtml(summary.revisionRequestedCount ? "Check Turned in and ask your teacher what to fix." : "Feedback will appear here after your teacher reviews your work.")}</p>
      </article>
    `;
  }
  const activeFilter = studentFeedbackFilterKey(filterKey);
  const copy = {
    revision_requested: {
      title: "No feedback needs changes right now.",
      detail: "Show all notes or check Turned in for anything still waiting for review.",
    },
    under_review: {
      title: "No new feedback is listed right now.",
      detail: "Show all feedback or old feedback.",
    },
    approved: {
      title: "No approved feedback is listed yet.",
      detail: "Old feedback appears after your teacher marks work done.",
    },
    all: {
      title: "No feedback yet.",
      detail: "Feedback will appear here after your teacher reviews your work.",
    },
  };
  const selectedCopy = copy[activeFilter] || copy.all;
  return `
    <article class="workspace-empty-state-card" data-student-feedback-empty="true" data-student-feedback-empty-filter="${escapeHtml(activeFilter)}">
      <strong>${escapeHtml(selectedCopy.title)}</strong>
      <p>${escapeHtml(selectedCopy.detail)}</p>
    </article>
  `;
}

function renderStudentFeedbackRow(item, historyState = defaultStudentFeedbackHistoryState()) {
  const submissionMeta = studentFeedbackSubmissionMeta(item);
  const submissionId = cleanDirectoryFilter(item?.submissionId);
  const approvalGate = studentFeedbackApprovalGateText(item);
  const isSelected = studentFeedbackSelectionMatches(historyState, submissionId, "feedback");
  const needsRevision = ["revision_requested", "needs_revision"].includes(normalizeStatus(item?.submissionStatus || item?.status));
  return `
    <article class="workspace-row workspace-student-feedback-row" data-student-feedback-item="${escapeHtml(item.id || "")}">
      <div>
        <strong>${escapeHtml(item.requirementTitle || "Senior Project work")}</strong>
        <p>${escapeHtml(item.message || "Your teacher left feedback for this work.")}</p>
        ${submissionMeta ? `<p class="workspace-muted" data-student-feedback-context="true">${escapeHtml(submissionMeta)}</p>` : ""}
        <p class="workspace-student-feedback-gate" data-student-feedback-approval-gate="true">${escapeHtml(approvalGate)}</p>
        <p class="workspace-muted">${escapeHtml(item.authorName || "Program Teacher")} / ${escapeHtml(formatDate(item.createdAt))}</p>
      </div>
      <div class="workspace-row-actions">
        ${submissionId ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-feedback-action="open-history" data-student-feedback-origin="feedback" data-student-feedback-submission-id="${escapeHtml(submissionId)}">${escapeHtml(isSelected ? "Refresh work history" : "View work history")}</button>` : ""}
        ${needsRevision ? `<button class="workspace-button workspace-button-small workspace-button-secondary" type="button" data-student-support-action="focus-submissions" data-student-support-filter="revision_requested">Fix work</button>` : ""}
        ${studentStatusPill(item.status || "under_review")}
      </div>
      ${renderStudentRevisionHelper(item)}
      ${isSelected ? renderStudentFeedbackTimeline(historyState) : ""}
    </article>
  `;
}

function renderStudentRevisionHelper(item = {}) {
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  if (!["revision_requested", "needs_revision"].includes(status)) return "";
  const checklist = studentRevisionChecklist(item?.message);
  return `
    <section class="workspace-student-revision-helper" data-student-revision-helper="true">
      <div>
        <strong>Teacher asked</strong>
        <p>${escapeHtml(item?.message || "Read the teacher feedback for this item.")}</p>
      </div>
      <div>
        <strong>Your fix list</strong>
        <ol>
          ${checklist.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    </section>
  `;
}

function studentRevisionChecklist(message = "") {
  const note = String(message || "").trim().replace(/\s+/g, " ");
  const firstStep = note
    ? `Fix this note: ${note.slice(0, 140)}${note.length > 140 ? "..." : ""}`
    : "Read the teacher note. Find the exact change.";
  return [
    firstStep,
    "Update the matching work and file.",
    "Turn it in again. Then wait for your teacher.",
  ];
}

function studentFeedbackApprovalGateText(item = {}) {
  const status = normalizeStatus(item?.submissionStatus || item?.status);
  if (["approved", "archived", "complete", "completed"].includes(status)) {
    return "Done. Use this approval for the next assigned item.";
  }
  if (["submitted", "under_review", "reviewing", "pending_review"].includes(status)) {
    return "Wait here. Your teacher checks this work before next steps.";
  }
  if (["revision_requested", "needs_revision"].includes(status)) {
    return "Fix this work. Turn it in again. Then wait for your teacher.";
  }
  return "Read this note. Update your work if needed. Ask your teacher before skipping ahead.";
}

function studentFeedbackSelectionMatches(historyState, submissionId, source = "feedback") {
  const selectedSubmissionId = cleanDirectoryFilter(historyState?.selectedSubmissionId || "");
  const selectedSource = String(historyState?.source || "feedback").trim() || "feedback";
  return Boolean(selectedSubmissionId && selectedSubmissionId === cleanDirectoryFilter(submissionId) && selectedSource === source);
}

function studentRequirementSubmissionIdForId(requirements = [], requirementId = "") {
  const normalizedRequirementId = cleanDirectoryFilter(requirementId);
  if (!normalizedRequirementId) return "";
  const match = requirements.find((row) => studentRequirementId(row) === normalizedRequirementId);
  return cleanDirectoryFilter(match?.submissionId || "");
}

function studentFeedbackSubmissionMeta(item) {
  const parts = [];
  const version = safeNumber(item?.submissionVersion);
  if (version > 0) parts.push(`Turned in #${version}`);
  if (item?.submissionStatus) parts.push(`Now: ${studentStatusText(item.submissionStatus)}`);
  return parts.join(" / ");
}

function renderStudentFeedbackTimeline(historyState = defaultStudentFeedbackHistoryState()) {
  if (historyState.loading) {
    return `
      <section class="workspace-student-feedback-timeline" data-student-feedback-timeline-loading="true">
        <h3>Work history</h3>
        <p class="workspace-muted">Loading what happened with this work.</p>
      </section>
    `;
  }
  if (historyState.result && !historyState.result.ok) {
    return `
      <section class="workspace-empty-state-card workspace-student-feedback-timeline" data-student-feedback-timeline-error="true">
        <h3>Work history unavailable</h3>
        ${renderProblemState({
          reason: "We could not load this work history right now.",
          owner: "Teacher",
          nextAction: "Try again later or ask your teacher which turn-in to update.",
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
  const noteRows = studentFeedbackTimelineNotes(reviews, comments);
  const hasTimeline = reviews.length || versions.length || statusHistory.length || comments.length;
  return `
    <section class="workspace-student-feedback-timeline" data-student-feedback-timeline="true">
      <div>
        <h3>Work history</h3>
        <p class="workspace-muted">Only feedback meant for you is shown here.</p>
      </div>
      ${renderStudentFeedbackTimelineSummary(history, versions, statusHistory, noteRows)}
      ${renderStudentTimelineActionGuide(history, versions, statusHistory, noteRows)}
      ${renderStudentVersionCompare(versions, history.submission?.version)}
      ${hasTimeline ? `
        <div class="workspace-student-feedback-timeline-grid">
          ${renderStudentTimelineList("Turned in", versions, "No turned-in work is listed yet.", (row) => renderStudentVersionTimelineItem(row, history.submission?.version))}
          ${renderStudentTimelineList("What changed", statusHistory, "No changes are listed yet.", renderStudentStatusTimelineItem)}
          ${renderStudentTimelineList("Teacher notes", noteRows, "No teacher notes are listed yet.", renderStudentNoteTimelineItem)}
        </div>
      ` : `<div class="workspace-empty">No work history is available for this item yet.</div>`}
    </section>
  `;
}

function renderStudentTimelineActionGuide(history = {}, versions = [], statusHistory = [], noteRows = []) {
  const currentStatus = normalizeStatus(history?.submission?.status || statusHistory[0]?.to_status || statusHistory[0]?.toStatus || "");
  const teacherAsked = noteRows[0]?.feedback || noteRows[0]?.body || "No teacher note is listed yet.";
  const latestVersion = latestStudentTimelineVersion(versions);
  const changedText = latestVersion
    ? `Latest turn-in: #${safeNumber(latestVersion.version)} with ${studentTimelineEvidenceCount(latestVersion)} Drive ${pluralize(studentTimelineEvidenceCount(latestVersion), "link")}.`
    : "No turned-in work is listed yet.";
  const nextMove = studentTimelineNextMove(currentStatus);
  return `
    <section class="workspace-student-timeline-guide" data-student-timeline-guide="true">
      <article>
        <strong>Teacher asked</strong>
        <p>${escapeHtml(teacherAsked)}</p>
      </article>
      <article>
        <strong>I changed</strong>
        <p>${escapeHtml(changedText)}</p>
      </article>
      <article>
        <strong>Now</strong>
        <p>${escapeHtml(nextMove)}</p>
      </article>
    </section>
  `;
}

function renderStudentVersionCompare(versions = [], currentVersion = 0) {
  const current = currentStudentTimelineVersion(versions, currentVersion);
  if (!current) return "";
  const previous = previousStudentTimelineVersion(versions, current.version);
  return `
    <section class="workspace-student-version-compare" data-student-version-compare="true">
      <strong>Turned-in work check</strong>
      <div>
        <span>Newest turned-in work: ${escapeHtml(studentTimelineVersionSummary(current))}</span>
        <span>Previous: ${escapeHtml(previous ? studentTimelineVersionSummary(previous) : "No previous turn-in listed")}</span>
      </div>
    </section>
  `;
}

function currentStudentTimelineVersion(versions = [], currentVersion = 0) {
  const rows = Array.isArray(versions) ? versions : [];
  const selectedVersion = safeNumber(currentVersion);
  if (selectedVersion > 0) {
    const match = rows.find((row) => safeNumber(row?.version) === selectedVersion);
    if (match) return match;
  }
  return latestStudentTimelineVersion(rows);
}

function previousStudentTimelineVersion(versions = [], currentVersion = 0) {
  const selectedVersion = safeNumber(currentVersion);
  return [...(Array.isArray(versions) ? versions : [])]
    .filter((row) => safeNumber(row?.version) > 0 && safeNumber(row?.version) < selectedVersion)
    .sort((left, right) => safeNumber(right?.version) - safeNumber(left?.version))[0] || null;
}

function latestStudentTimelineVersion(versions = []) {
  return [...(Array.isArray(versions) ? versions : [])]
    .filter((row) => safeNumber(row?.version) > 0)
    .sort((left, right) => safeNumber(right?.version) - safeNumber(left?.version))[0] || null;
}

function studentTimelineVersionSummary(row = {}) {
  const version = safeNumber(row?.version);
  const evidenceCount = studentTimelineEvidenceCount(row);
  const submittedAt = row?.submittedAt || row?.submitted_at;
  return `${version ? `#${version}` : "Turn-in"} / ${evidenceCount} Drive ${pluralize(evidenceCount, "link")} / ${formatDate(submittedAt)}`;
}

function studentTimelineEvidenceCount(row = {}) {
  return Array.isArray(row?.evidence) ? row.evidence.length : 0;
}

function studentTimelineNextMove(status = "") {
  const normalized = normalizeStatus(status);
  if (["revision_requested", "needs_revision"].includes(normalized)) return "Fix the teacher note. Turn in your updated work. Then wait.";
  if (["submitted", "under_review", "reviewing", "pending_review"].includes(normalized)) return "Wait here. Your teacher checks it next.";
  if (["approved", "complete", "completed", "archived"].includes(normalized)) return "Done for next steps. Use the next assigned item.";
  return "Use the newest teacher note. Ask your teacher before skipping ahead.";
}

function renderStudentFeedbackTimelineSummary(history = {}, versions = [], statusHistory = [], noteRows = []) {
  const currentVersion = safeNumber(history?.submission?.version);
  const facts = [];
  if (currentVersion > 0) facts.push({ label: "Newest turn-in", value: `#${currentVersion}` });
  facts.push({ label: "Turned in", value: `${versions.length}` });
  facts.push({ label: "Teacher notes", value: `${noteRows.length}` });
  facts.push({ label: "What changed", value: `${statusHistory.length}` });
  return `
    <div class="workspace-student-feedback-timeline-summary" data-student-feedback-timeline-summary="true">
      ${facts.map((fact) => `
        <span class="workspace-student-feedback-timeline-fact">
          <strong>${escapeHtml(fact.label)}</strong>
          <small>${escapeHtml(fact.value)}</small>
        </span>
      `).join("")}
    </div>
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

function renderStudentVersionTimelineItem(row, currentVersion = 0) {
  const version = safeNumber(row?.version);
  const evidenceCount = Array.isArray(row?.evidence) ? row.evidence.length : 0;
  const isCurrentVersion = version > 0 && version === safeNumber(currentVersion);
  const detailParts = [
    statusText(row?.status || "submitted"),
    evidenceCount ? `${evidenceCount} Drive ${pluralize(evidenceCount, "link")}` : "No Drive link saved",
    formatDate(row?.submittedAt || row?.submitted_at),
  ];
  if (isCurrentVersion) detailParts.push("Newest turned-in work");
  return `
    <article class="workspace-mini-row" data-student-feedback-version="${escapeHtml(version || "")}" data-student-feedback-current-version="${isCurrentVersion ? "true" : "false"}">
      <span>${escapeHtml(version ? `Turned in #${version}` : "Turned in")}</span>
      <small>${escapeHtml(detailParts.join(" / "))}</small>
    </article>
  `;
}

function renderStudentStatusTimelineItem(row) {
  const status = row?.to_status || row?.toStatus || "under_review";
  return `
    <article class="workspace-mini-row" data-student-feedback-status-change="true">
      <span>${escapeHtml(statusText(status))}</span>
      <small>${escapeHtml(row?.reason || "Status updated.")} / ${escapeHtml(formatDate(row?.created_at || row?.createdAt))}</small>
      <small data-student-status-history-explanation="true">${escapeHtml(studentTimelineNextMove(status))}</small>
    </article>
  `;
}

function renderStudentNoteTimelineItem(row) {
  const message = row?.feedback || row?.body || "Teacher note saved.";
  const author = row?.reviewer_name || row?.reviewerName || row?.author_name || row?.authorName || "Teacher";
  const createdAt = row?.created_at || row?.createdAt;
  const noteType = studentFeedbackTimelineNoteType(row);
  return `
    <article class="workspace-mini-row" data-student-feedback-note="true" data-student-feedback-note-type="${escapeHtml(noteType)}">
      <span>${escapeHtml(message)}</span>
      <small>${escapeHtml(studentFeedbackTimelineNoteLabel(row))} / ${escapeHtml(author)} / ${escapeHtml(formatDate(createdAt))}</small>
    </article>
  `;
}

function studentFeedbackTimelineNotes(reviews = [], comments = []) {
  return [
    ...(Array.isArray(reviews) ? reviews : []),
    ...(Array.isArray(comments) ? comments : []),
  ].sort((left, right) => studentFeedbackTimelineTimestamp(right) - studentFeedbackTimelineTimestamp(left));
}

function studentFeedbackTimelineTimestamp(row) {
  const value = row?.created_at || row?.createdAt || row?.submittedAt || row?.submitted_at || "";
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function studentFeedbackTimelineNoteType(row = {}) {
  return row?.decision ? "review" : "comment";
}

function studentFeedbackTimelineNoteLabel(row = {}) {
  if (row?.decision) return `Teacher review: ${statusText(row.decision)}`;
  return "Teacher note";
}

function renderStudentProgressDetails(summary, dashboard) {
  return `
    <section class="workspace-dashboard-card workspace-student-progress-details" aria-labelledby="studentProgressDetailsTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Project details</p>
          <h2 id="studentProgressDetailsTitle">Project Details</h2>
        </div>
      </div>
      ${renderStudentProgressDetailsBody(summary, dashboard)}
    </section>
  `;
}

function renderStudentProgressDetailsBody(summary, dashboard) {
  const progress = dashboard.progress || [];
  const evidence = dashboard.evidence || [];
  const archiveFact = studentArchiveProgressFact(unwrap(currentData.archiveReadiness));
  return `
      <div class="workspace-student-details-panel">
        <div class="workspace-student-details-grid">
          ${renderStudentDetailFact("Current phase", summary.currentPhaseLabel || "Not available yet")}
          ${renderStudentDetailFact("Work done", `${summary.requirementsComplete} of ${summary.requirementsTotal || 0}`)}
          ${renderStudentDetailFact("Work still missing", summary.missingRequiredCount ? `${summary.missingRequiredCount} to finish` : "None right now")}
          ${renderStudentDetailFact("Waiting for review", summary.waitingForReviewCount ? `${summary.waitingForReviewCount} sent` : "Nothing waiting")}
          ${renderStudentDetailFact("Needs changes", summary.revisionRequestedCount ? `${summary.revisionRequestedCount} item${summary.revisionRequestedCount === 1 ? "" : "s"}` : "Nothing right now")}
          ${renderStudentDetailFact("Last updated", summary.lastUpdatedAt ? formatDate(summary.lastUpdatedAt) : "Not available yet")}
          ${renderStudentDetailFact("Proof added", `${evidence.length} item${evidence.length === 1 ? "" : "s"}`)}
          ${renderStudentDetailFact("Program Teacher feedback", summary.revisionRequestedCount ? "Review the item marked Needs Changes." : "You do not have feedback that needs action right now.")}
          ${archiveFact ? renderStudentDetailFact("Final files due May 5", archiveFact) : ""}
        </div>
      </div>
      <div class="workspace-student-support-box" data-student-support-box="true">
        <strong>Need help with this?</strong>
        <p>${escapeHtml(studentInstructionCopy(summary.mentor.message || "Ask your mentor or Program Teacher if something looks wrong."))}</p>
        <p class="workspace-muted">${escapeHtml(studentSupportGuidance(summary, dashboard))}</p>
        ${renderStudentSupportMap(summary, dashboard)}
        ${renderStudentSupportActions(summary, dashboard)}
      </div>
  `;
}

function renderStudentSupportMap(summary = {}, dashboard = {}) {
  const mentorAssigned = Boolean(summary?.mentor?.assigned);
  const revisionCount = safeNumber(summary?.revisionRequestedCount);
  const waitingCount = safeNumber(summary?.waitingForReviewCount);
  const missingCount = safeNumber(summary?.missingRequiredCount);
  const cards = [
    {
      id: "program-teacher",
      title: "Ask your teacher",
      detail: revisionCount
        ? "Use this when feedback asks for changes, a phase is blocked, or you are not sure what to fix first."
        : missingCount
          ? "Use this when an assigned item, phase, or deadline seems missing or unclear."
          : "Use this when My Work does not show the next Senior Project step.",
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-support-action="focus-feedback" data-student-support-filter="${escapeHtml(revisionCount ? "revision_requested" : "all")}">${escapeHtml(revisionCount ? "Review feedback" : "Open feedback")}</button>`,
      tone: revisionCount ? "warning" : "student",
    },
    {
      id: "mentor",
      title: mentorAssigned ? "Ask your mentor" : "Ask who can mentor you",
      detail: mentorAssigned
        ? "Use mentor help for ideas, practice, and project thinking. Your teacher still controls phase movement."
        : "Ask your teacher who can help with mentor questions until a mentor is listed here.",
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-support-action="focus-requirements">${escapeHtml(mentorAssigned ? "Open checklist" : "Open required work")}</button>`,
      tone: mentorAssigned ? "mentor" : "quiet",
    },
    {
      id: "account",
      title: "Use Account for sign-in only",
      detail: waitingCount && !revisionCount
        ? "Do not change files while work is waiting for review unless your teacher asks."
        : "Password or sign-in problems belong in Account. Files, feedback, and deadlines stay in My Work.",
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="security">Open Account</button>`,
      tone: "quiet",
    },
  ];
  return `
    <section class="workspace-student-support-map" data-student-support-map="true" aria-label="Who to ask for help">
      ${cards.map((card) => `
        <article class="workspace-student-support-map-card ${escapeHtml(card.tone)}" data-student-support-map-card="${escapeHtml(card.id)}">
          <strong>${escapeHtml(card.title)}</strong>
          <p>${escapeHtml(card.detail)}</p>
          <div class="workspace-row-actions">${card.actionHtml}</div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderStudentSubmissionsPanelBody(submissions = [], filteredSubmissions = [], feedback = [], activeSubmissionFilter = "all") {
  return `
    <div>
      <p class="workspace-muted">${escapeHtml(submissions.length ? `Showing the latest ${submissions.length} item${submissions.length === 1 ? "" : "s"} you have started or turned in.` : "Your turned-in work will appear here after you start project work.")}</p>
      ${renderStudentSubmissionActionSummary(submissions)}
      ${renderStudentSubmissionStatusGuide(submissions, activeSubmissionFilter)}
      ${submissions.length > 1 || activeSubmissionFilter !== "all" ? renderStudentSubmissionFilters(submissions, activeSubmissionFilter) : ""}
      <div class="workspace-list">
        ${filteredSubmissions.length
          ? filteredSubmissions.map((submission) => renderSubmissionRow(submission, feedback, studentFeedbackHistoryState)).join("")
          : renderStudentSubmissionEmptyState(activeSubmissionFilter, submissions.length)}
      </div>
    </div>
  `;
}

function renderStudentSubmissionStatusGuide(submissions = [], activeSubmissionFilter = "all") {
  const rows = Array.isArray(submissions) ? submissions : [];
  if (!rows.length) return "";
  const counts = studentSubmissionStatusCounts(rows);
  const active = studentSubmissionFilterKey(activeSubmissionFilter);
  const cards = [
    {
      id: "draft",
      title: "Draft",
      detail: counts.draft
        ? "Finish this work. Add the matching Google Drive link. Turn it in for review."
        : "No draft work is waiting for you right now.",
      tone: counts.draft ? "student" : "quiet",
      count: counts.draft,
      action: "Show drafts",
    },
    {
      id: "submitted",
      title: "Waiting for review",
      detail: counts.waiting
        ? "Your teacher checks this next. Do not turn in another version unless they ask."
        : "Nothing is waiting for teacher review right now.",
      tone: counts.waiting ? "teacher" : "quiet",
      count: counts.waiting,
      action: "Show waiting work",
    },
    {
      id: "revision_requested",
      title: "Needs changes",
      detail: counts.revision
        ? "Read the teacher note. Fix the work. Update the matching Google Drive link if needed. Turn it in again."
        : "No work to fix is waiting for you right now.",
      tone: counts.revision ? "warning" : "quiet",
      count: counts.revision,
      action: "Show work to fix",
    },
    {
      id: "approved",
      title: "Approved",
      detail: counts.approved
        ? "This work is complete for now. Use it for the next assigned item, presentation, or final files."
        : "Done work appears here after your teacher checks it.",
      tone: counts.approved ? "ready" : "quiet",
      count: counts.approved,
      action: "Show approved work",
    },
  ];
  return `
    <section class="workspace-student-submission-status-guide" data-student-submission-status-guide="true" aria-label="What turned-in statuses mean">
      <div>
        <strong>What Turned in labels mean</strong>
        <p>${escapeHtml("Use these cards to decide whether to keep working, wait, fix work, or move on.")}</p>
      </div>
      <div class="workspace-student-submission-status-grid">
        ${cards.map((card) => `
          <article class="workspace-student-submission-status-card ${escapeHtml(card.tone)}" data-student-submission-status-card="${escapeHtml(card.id)}">
            <div>
              <span>${escapeHtml(card.title)}</span>
              <b>${escapeHtml(card.count)} ${escapeHtml(card.count === 1 ? "item" : "items")}</b>
              <p>${escapeHtml(card.detail)}</p>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-submission-action="set-filter" data-student-submission-filter="${escapeHtml(card.id)}" aria-pressed="${active === card.id ? "true" : "false"}">
              ${escapeHtml(active === card.id ? "Viewing" : card.action)}
            </button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStudentSubmissionActionSummary(submissions = []) {
  const rows = Array.isArray(submissions) ? submissions : [];
  const counts = studentSubmissionStatusCounts(rows);
  const guidance = counts.revision
    ? "Do work that needs changes first. Update the work and its Google Drive link. Turn it in again."
    : counts.waiting
      ? "Done for now on waiting items. Your teacher checks them next."
    : counts.draft
      ? "Finish draft items. Add their Google Drive links. Turn them in for review."
    : counts.approved
      ? "Approved work shows what is complete and ready to use for next steps."
      : "Started work will appear here after your teacher adds it.";
  return `
    <section class="workspace-student-submission-summary" data-student-submission-summary="true">
      <strong>${escapeHtml(guidance)}</strong>
      <div class="workspace-student-submission-counts" aria-label="Turned in status counts">
        <span><b>${escapeHtml(counts.revision)}</b> fix</span>
        <span><b>${escapeHtml(counts.waiting)}</b> wait</span>
        <span><b>${escapeHtml(counts.draft)}</b> draft</span>
        <span><b>${escapeHtml(counts.approved)}</b> approved</span>
      </div>
      ${counts.approved ? `
        <div class="workspace-row-actions">
          <button class="workspace-link-button workspace-link-button-small" type="button" data-student-submission-action="set-filter" data-student-submission-filter="approved">
            Show approved work
          </button>
        </div>
      ` : ""}
    </section>
  `;
}

function studentSubmissionStatusCounts(rows = []) {
  return (Array.isArray(rows) ? rows : []).reduce((summary, row) => {
    const status = studentSubmissionFilterKey(row?.status);
    if (status === "revision_requested") summary.revision += 1;
    else if (status === "submitted") summary.waiting += 1;
    else if (status === "approved") summary.approved += 1;
    else if (status === "draft") summary.draft += 1;
    return summary;
  }, { revision: 0, waiting: 0, approved: 0, draft: 0 });
}

function renderStudentFilesPanelBody(evidence = []) {
  const rows = Array.isArray(evidence) ? evidence : [];
  const groups = groupStudentEvidenceByRequirement(rows);
  return `
    <div class="workspace-student-files-panel" data-student-files-panel="true">
      ${renderStudentFilesReviewGuide(rows)}
      ${renderStudentProofReceipt(rows)}
      ${groups.length
        ? groups.map(renderStudentEvidenceGroup).join("")
        : `<div class="workspace-empty">Google Drive links will appear here after you add them to your work.</div>`}
    </div>
  `;
}

function renderStudentFilesReviewGuide(evidence = []) {
  const rows = Array.isArray(evidence) ? evidence : [];
  if (!rows.length) return "";
  const waitingCount = rows.filter((row) => !["approved", "complete", "completed", "revision_requested", "needs_revision", "rejected", "blocked"].includes(normalizeStatus(row?.review_status))).length;
  const approvedCount = rows.filter((row) => ["approved", "complete", "completed"].includes(normalizeStatus(row?.review_status))).length;
  const needsFixCount = rows.filter((row) => ["revision_requested", "needs_revision", "rejected", "blocked"].includes(normalizeStatus(row?.review_status))).length;
  const unmatchedCount = rows.filter((row) => !cleanDirectoryFilter(row?.requirementId || "") && !cleanDirectoryFilter(row?.submissionId || "")).length;
  const firstMatched = rows.find((row) => cleanDirectoryFilter(row?.requirementId || ""));
  const checklistAction = firstMatched
    ? renderStudentRequirementOpenButton({
      requirementId: firstMatched.requirementId,
      title: firstMatched.requirementTitle || firstMatched.title || "proof item",
    }, "Open checklist item")
    : renderStudentDisclosureOpenButton("requirements", "Open checklist");
  const reviewTitle = needsFixCount
    ? "Drive link needs changes"
    : waitingCount
      ? "Waiting for review"
      : approvedCount
        ? "Drive link is approved"
        : "Check review status";
  const reviewDetail = needsFixCount
    ? `${needsFixCount} Google Drive ${pluralize(needsFixCount, "link")} ${needsFixCount === 1 ? "needs" : "need"} changes from your teacher.`
    : waitingCount
      ? `${waitingCount} Google Drive ${pluralize(waitingCount, "link")} saved. Wait for your teacher.`
      : approvedCount
        ? `${approvedCount} Google Drive ${pluralize(approvedCount, "link")} approved. Keep using the next assigned item.`
        : "Use the row status below to see what your teacher has reviewed.";
  const cards = [
    {
      id: "match",
      title: "Match link to work",
      detail: unmatchedCount
        ? `${unmatchedCount} Google Drive ${pluralize(unmatchedCount, "link")} ${unmatchedCount === 1 ? "is" : "are"} not matched to work yet. Ask your teacher before using ${unmatchedCount === 1 ? "it" : "them"}.`
        : `${rows.length} Google Drive ${pluralize(rows.length, "link")} grouped by work item.`,
      actionHtml: checklistAction,
      tone: unmatchedCount ? "warning" : "ready",
    },
    {
      id: "review",
      title: reviewTitle,
      detail: reviewDetail,
      actionHtml: needsFixCount ? renderStudentDisclosureOpenButton("feedback", "Open feedback") : "",
      tone: needsFixCount ? "warning" : waitingCount ? "teacher" : "ready",
    },
    {
      id: "correct",
      title: "Need to change a link?",
      detail: "Save the corrected Google Drive link on the right item. Tell your teacher which old link to ignore.",
      actionHtml: renderStudentDisclosureOpenButton("evidence", "Add link"),
      tone: "student",
    },
  ];
  return `
    <section class="workspace-student-files-review" data-student-files-review="true" aria-label="How to check saved Google Drive links">
      <div>
        <strong>Check saved links</strong>
        <p>${escapeHtml("Google Drive links show your work. They are not approval. Check that each link is on the right item.")}</p>
      </div>
      <div class="workspace-student-files-review-grid">
        ${cards.map((card) => `
          <article class="workspace-student-files-review-card ${escapeHtml(card.tone)}" data-student-files-review-card="${escapeHtml(card.id)}">
            <div>
              <span>${escapeHtml(card.title)}</span>
              <p>${escapeHtml(card.detail)}</p>
            </div>
            ${card.actionHtml ? `<div class="workspace-row-actions">${card.actionHtml}</div>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStudentProofReceipt(evidence = []) {
  const receipt = studentProofReceiptState || defaultStudentProofReceiptState();
  if (!receipt.visible) return "";
  const matchedEvidence = studentProofReceiptMatchedEvidence(receipt, evidence);
  const matchedTitle = matchedEvidence?.requirementTitle || receipt.requirementTitle || "selected checklist item";
  const requirementId = cleanDirectoryFilter(receipt.requirementId || matchedEvidence?.requirementId || "");
  const proofLabel = receipt.proofKind === "link" ? "Work link" : "Uploaded file";
  const fileLabel = receipt.fileName || receipt.title || "File";
  const savedAt = receipt.savedAt ? formatDate(receipt.savedAt) : "just now";
  return `
    <section class="workspace-student-proof-receipt" data-student-proof-receipt="true" data-student-proof-receipt-kind="${escapeHtml(receipt.proofKind || "proof")}" data-student-proof-receipt-matched="${matchedEvidence ? "true" : "pending"}" data-student-proof-receipt-submission-id="${escapeHtml(receipt.submissionId || "")}" data-student-proof-receipt-requirement-id="${escapeHtml(requirementId)}">
      <div class="workspace-student-proof-receipt-head">
        <div>
          <span>File saved</span>
          <strong>Confirm it is on the right checklist item</strong>
          <p>${escapeHtml(`${proofLabel} saved for ${matchedTitle}.`)}</p>
          <p class="workspace-muted">${escapeHtml(`${fileLabel} / ${savedAt}`)}</p>
        </div>
        ${studentStatusPill(matchedEvidence ? "ready" : "needs_review")}
      </div>
      <div class="workspace-student-proof-receipt-map" data-student-proof-receipt-map="true">
        ${renderStudentProofReceiptCard({
          id: "matching-item",
          owner: "Student check",
          title: "Open the matching work",
          detail: "Confirm this file appears on the work item you meant to update.",
          action: "Open work",
          actionType: requirementId ? "open-checklist" : "open-files",
          tone: "ready",
        })}
        ${renderStudentProofReceiptCard({
          id: "wrong-item",
          owner: "Correction path",
          title: "Wrong item? Add the right file",
          detail: "Leave this file alone. Add the correct file to the right item. Tell your teacher which one to ignore.",
          action: "Upload",
          actionType: "correct-proof",
          tone: "warning",
        })}
        ${renderStudentProofReceiptCard({
          id: "send-review",
          owner: "Next step",
          title: "Turn in the work",
          detail: "Use Turned in or the work item when all required files are attached.",
          action: "View turned in",
          actionType: "open-submissions",
          tone: "student",
        })}
        ${renderStudentProofReceiptCard({
          id: "approval-gate",
          owner: "Program Teacher",
          title: "Approval still comes later",
          detail: "The file is saved. Wait for your teacher before next steps.",
          action: "Stay in Files",
          actionType: "open-files",
          tone: "teacher",
        })}
      </div>
      <div class="workspace-student-proof-receipt-footer">
        <p class="workspace-muted" data-student-proof-receipt-gate="true">The file is saved. This item is not done until your teacher reviews it.</p>
        <div class="workspace-student-proof-receipt-checks">
          <span>1. Confirm this file is on the right item.</span>
          <span>2. If it is wrong, add the file to the correct item.</span>
          <span>3. Turn in the item when all required files are attached.</span>
          <span>4. Wait for your teacher before the next step.</span>
        </div>
      </div>
    </section>
  `;
}

function renderStudentProofReceiptCard(card = {}) {
  return `
    <article class="workspace-student-proof-receipt-card ${escapeHtml(card.tone || "quiet")}" data-student-proof-receipt-card="${escapeHtml(card.id || "receipt")}">
      <div>
        <span>${escapeHtml(card.owner || "Next")}</span>
        <strong>${escapeHtml(card.title || "Check proof")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-student-proof-receipt-action="${escapeHtml(card.actionType || "open-files")}">
        ${escapeHtml(card.action || "Open")}
      </button>
    </article>
  `;
}

function studentProofReceiptMatchedEvidence(receipt = {}, evidence = []) {
  const submissionId = cleanDirectoryFilter(receipt.submissionId || "");
  const title = String(receipt.title || "").trim().toLowerCase();
  return (Array.isArray(evidence) ? evidence : []).find((row) => {
    const rowSubmissionId = cleanDirectoryFilter(row?.submissionId || "");
    const rowTitle = String(row?.title || "").trim().toLowerCase();
    return (submissionId && rowSubmissionId === submissionId) || (title && rowTitle === title);
  }) || null;
}

function groupStudentEvidenceByRequirement(rows = []) {
  const groups = [];
  const byKey = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const requirementId = cleanDirectoryFilter(row?.requirementId || "");
    const submissionId = cleanDirectoryFilter(row?.submissionId || "");
  const title = String(row?.requirementTitle || "").trim() || "File not matched to a work item";
    const key = requirementId || submissionId || `unassigned:${title}`;
    if (!byKey.has(key)) {
      const group = { key, title, rows: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).rows.push(row);
  }
  return groups;
}

function renderStudentEvidenceGroup(group = {}) {
  const rows = Array.isArray(group?.rows) ? group.rows : [];
  return `
    <section class="workspace-student-file-group" data-student-file-group="true" data-student-file-group-title="${escapeHtml(group?.title || "Files")}" data-student-file-group-count="${escapeHtml(rows.length)}">
      <div class="workspace-student-file-group-head">
        <div>
          <h3>${escapeHtml(group?.title || "Files")}</h3>
          <p class="workspace-muted">${escapeHtml(`${rows.length} ${pluralize(rows.length, "Google Drive link")} saved for this work.`)}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(rows.length)} file${rows.length === 1 ? "" : "s"}</span>
      </div>
      <p class="workspace-muted" data-student-proof-recovery="true">Wrong item? Add the corrected file to the right item. Then tell your teacher.</p>
      <div class="workspace-list">
        ${rows.map(renderEvidenceRow).join("")}
      </div>
    </section>
  `;
}

function studentSupportGuidance(summary, dashboard) {
  const progress = Array.isArray(dashboard?.progress) ? dashboard.progress : [];
  const feedback = Array.isArray(dashboard?.feedback) ? dashboard.feedback : [];
  const submissions = Array.isArray(dashboard?.submissions) ? dashboard.submissions : [];
  const requirements = Array.isArray(dashboard?.requirements) ? dashboard.requirements : [];
  if (summary?.revisionRequestedCount && feedback.length) {
    return "Start with the feedback notes that still need fixes, then update the matching work.";
  }
  if (summary?.waitingForReviewCount && submissions.length) {
    return "Your Program Teacher is reviewing work you sent in. Use Work Sent In to confirm what is waiting right now.";
  }
  if (summary?.missingRequiredCount && requirements.length) {
    return "Open the next checklist item to see what is still missing and which step comes next.";
  }
  if (!summary?.mentor?.assigned) {
    return "Keep using your next steps and checklist while your Program Teacher helps with mentor questions.";
  }
  if (summary?.dueDatesAvailable) {
    return "Use Upcoming deadlines or Your Project Checklist when you want a shorter path through the work below.";
  }
  return progress.length || submissions.length || requirements.length
    ? "Use the work list, feedback notes, or checklist below to keep your project moving."
    : "Your Program Teacher has not added project work yet.";
}

function renderStudentSupportActions(summary, dashboard) {
  const feedback = Array.isArray(dashboard?.feedback) ? dashboard.feedback : [];
  const submissions = Array.isArray(dashboard?.submissions) ? dashboard.submissions : [];
  const requirements = Array.isArray(dashboard?.requirements) ? dashboard.requirements : [];
  const buttons = [];
  if (feedback.length) {
    const feedbackFilter = summary?.revisionRequestedCount ? "revision_requested" : "all";
    buttons.push(`
      <button class="workspace-link-button workspace-link-button-small" type="button" data-student-support-action="focus-feedback" data-student-support-filter="${escapeHtml(feedbackFilter)}">
        ${escapeHtml(summary?.revisionRequestedCount ? "Review feedback" : "Open feedback")}
      </button>
    `);
  }
  if (submissions.length) {
    const submissionFilter = summary?.revisionRequestedCount
      ? "revision_requested"
      : summary?.waitingForReviewCount
        ? "submitted"
        : summary?.missingRequiredCount
          ? "draft"
          : "all";
    buttons.push(`
      <button class="workspace-link-button workspace-link-button-small" type="button" data-student-support-action="focus-submissions" data-student-support-filter="${escapeHtml(submissionFilter)}">
        ${escapeHtml(summary?.revisionRequestedCount ? "Open Turned in" : summary?.waitingForReviewCount ? "Check Turned in" : "Show Turned in")}
      </button>
    `);
  }
  const focusItem = studentSupportRequirementItem(dashboard);
  if (focusItem?.requirementId) {
    buttons.push(renderStudentRequirementOpenButton(focusItem, "Open next item"));
  } else if (requirements.length) {
    const action = summary?.dueDatesAvailable ? "focus-deadlines" : "focus-requirements";
    const label = summary?.dueDatesAvailable ? "Show deadlines" : "Open required work";
    buttons.push(`
      <button class="workspace-link-button workspace-link-button-small" type="button" data-student-support-action="${escapeHtml(action)}">
        ${escapeHtml(label)}
      </button>
    `);
  }
  return buttons.length ? `
    <div class="workspace-student-support-actions">
      ${buttons.join("")}
    </div>
  ` : "";
}

function studentSupportRequirementItem(dashboard) {
  const nextSteps = Array.isArray(dashboard?.nextSteps) ? dashboard.nextSteps : [];
  const nextStepMatch = nextSteps.find((item) => cleanDirectoryFilter(item?.requirementId || ""));
  if (nextStepMatch) return nextStepMatch;
  const requirements = Array.isArray(dashboard?.requirements) ? dashboard.requirements : [];
  const deadlineMatch = studentUpcomingDeadlineRows(requirements).find((item) => cleanDirectoryFilter(item?.requirementId || ""));
  if (deadlineMatch) return deadlineMatch;
  return requirements.find((item) => !isStudentRequirementComplete(item?.status) && cleanDirectoryFilter(item?.requirementId || "")) || null;
}

function renderStudentDetailFact(label, value) {
  return `
    <article class="workspace-student-detail-fact">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderEvidenceForms(submissions, requirements = []) {
  const rows = Array.isArray(submissions) ? submissions : [];
  const archiveBody = unwrap(currentData.archiveReadiness);
  if (isViewAsStudentActive()) {
    return renderViewAsStudentProofPreview(rows, requirements, archiveBody);
  }
  const linkGuideId = "workspaceProofGuideLink";
  const options = rows.map((submission) => `
    <option value="${escapeHtml(studentSubmissionId(submission))}">${escapeHtml(studentSubmissionRequirementTitle(submission))} - ${escapeHtml(studentStatusText(submission.status))}</option>
  `).join("");

  return `
    <section class="workspace-student-proof-guide" data-student-proof-guide="true">
      <strong>Link Google Drive work</strong>
      <ol>
        <li>Choose the exact work item.</li>
        <li>Add a clear title.</li>
        <li>Paste the Google Drive, Docs, Sheets, or Slides link.</li>
        <li>Open the matching item. Turn it in when it is ready.</li>
      </ol>
      <p class="workspace-muted">This app stores the link only. It does not read or copy your Google Drive files.</p>
    </section>
    <div class="workspace-panel">
      <h3>Add a Google Drive link</h3>
      <form id="workspaceEvidenceLinkForm" class="workspace-form">
        <div class="workspace-form-grid">
          <label class="workspace-label">
            Work item
            <select class="workspace-select" name="submissionId" data-student-proof-submission-select="true" aria-describedby="${linkGuideId}" required>${options}</select>
          </label>
          ${renderStudentProofGuideList(rows, requirements, "link", linkGuideId)}
          <input type="hidden" name="artifactType" value="document">
          <label class="workspace-label workspace-label-wide">
            What is this work?
            <input class="workspace-input" name="title" autocomplete="off" maxlength="160" required>
          </label>
          <label class="workspace-label workspace-label-wide">
            Google Drive link
            <input class="workspace-input" name="url" type="url" inputmode="url" autocomplete="off" maxlength="${WORKSPACE_PROOF_LINK_MAX_LENGTH}" aria-describedby="workspaceProofLinkHelp" required>
            <span id="workspaceProofLinkHelp" class="workspace-muted">Copy the share link from Google Drive, Docs, Sheets, or Slides. Google sharing controls who can open it.</span>
          </label>
        </div>
        <div class="workspace-form-actions">
          <button class="workspace-button workspace-button-primary" type="submit">Save Drive link</button>
        </div>
      </form>
    </div>
  `;
}

function renderViewAsStudentProofPreview(submissions = [], requirements = []) {
  const rows = Array.isArray(submissions) ? submissions : [];
  return `
    <section class="workspace-view-as-proof-preview" data-view-as-student-proof-preview="true">
      <strong>Drive link tools hidden in preview</strong>
      <p>Students see Google Drive link tools here. Staff preview keeps those controls hidden so no work state can change.</p>
      ${rows.length ? `
        <div class="workspace-list">
          ${rows.slice(0, 5).map((submission) => {
            const guide = studentProofGuideForSubmission(submission, requirements);
            return `
              <article class="workspace-mini-row">
                <span>${escapeHtml(guide.title)}</span>
                <small>${escapeHtml(guide.statusLabel)} / ${escapeHtml(guide.nextAction)}</small>
              </article>
            `;
          }).join("")}
        </div>
      ` : `<div class="workspace-empty">No student file tools are available because no started work is visible.</div>`}
    </section>
  `;
}

function renderStudentStorageFallbackMap(submissions = [], archiveBody = null) {
  const rows = Array.isArray(submissions) ? submissions : [];
  const storageState = studentStorageFallbackState(archiveBody, uploadState);
  const uploadStatus = uploadState.state || "idle";
  const uploadProgress = clampUploadProgress(uploadState.progress);
  const cards = [
    {
      id: "select-work",
      owner: "Student",
      metric: rows.length ? `${rows.length} item${rows.length === 1 ? "" : "s"}` : "No item",
      title: "Choose the exact work item",
      detail: "A Google Drive link only helps when it is saved on the matching work item.",
      tone: "student",
      action: "Show proof guide",
      focus: "proof-guide",
    },
    {
      id: "link-first",
      owner: "If uploads are blocked",
      metric: "Link first",
      title: "Use a secure link first",
      detail: "If uploads are not working, add a secure HTTPS link so your teacher can still review.",
      tone: storageState.status === "ready" ? "link" : "warning",
      action: "Open link form",
      focus: "link-form",
    },
    {
      id: "file-upload",
      owner: "File uploads",
      metric: storageState.label,
      title: "Upload only when files are working",
      detail: storageState.detail,
      tone: storageState.tone,
      action: "Open upload form",
      focus: "file-form",
    },
    {
      id: "upload-status",
      owner: "Upload status",
      metric: uploadStatus === "idle" ? "Waiting" : `${uploadLabelForState(uploadStatus)} / ${uploadProgress}%`,
      title: "Read upload status",
      detail: "If upload status turns red, add a secure link before trying again.",
      tone: uploadStatus === "failed" ? "danger" : uploadStatus === "complete" ? "ready" : "quiet",
      action: "Show status",
      focus: "upload-status",
    },
    {
      id: "program-teacher",
      owner: "Program Teacher",
      metric: "Tell staff",
      title: "Tell your Program Teacher what happened",
      detail: "If storage blocks the file, share the link and explain that the file upload did not finish.",
      tone: "teacher",
      action: "Open help",
      focus: "support",
    },
    {
      id: "final-files",
      owner: "Staff support",
      metric: "Final files",
      title: "Staff handle final-file downloads",
      detail: "Staff fix download setup problems. Keep finishing work with links or files already saved.",
      tone: storageState.status === "provider_unavailable" ? "warning" : "staff",
      action: "Open final files",
      section: "archive",
    },
  ];

  return `
    <section class="workspace-student-storage-fallback-map" data-student-storage-fallback-map="true" data-student-storage-state="${escapeHtml(storageState.status)}" aria-labelledby="studentStorageFallbackTitle">
      <div class="workspace-student-storage-fallback-head">
        <div>
          <span>File options</span>
          <h3 id="studentStorageFallbackTitle">Add files without getting stuck</h3>
          <p>${escapeHtml(storageState.summary)}</p>
        </div>
        ${studentStatusPill(storageState.status === "provider_unavailable" ? "needs_staff_action" : storageState.status)}
      </div>
      <div class="workspace-student-storage-fallback-grid">
        ${cards.map(renderStudentStorageFallbackCard).join("")}
      </div>
    </section>
  `;
}

function studentStorageFallbackState(archiveBody = null, upload = uploadState) {
  const storage = archiveBody?.storage || {};
  const providerStatus = String(storage.providerStatus || "").trim().toLowerCase();
  const credentialsMissing = storage.credentialsConfigured === false;
  const storageUnavailable = credentialsMissing || (providerStatus && providerStatus !== "ready" && providerStatus !== "configured");
  if (storageUnavailable) {
    return {
      status: "provider_unavailable",
      label: "Staff setup needed",
      tone: "warning",
      summary: "Use a secure link first when uploads or final-file downloads are not ready.",
      detail: "File uploads and final downloads may not be ready here. Use secure links while staff fixes download setup.",
    };
  }
  if ((upload?.state || "") === "failed") {
    return {
      status: "failed",
      label: "Upload problem",
      tone: "danger",
      summary: "The last upload needs attention. Save a reviewable link before retrying.",
      detail: "The last file upload needs attention. Add a link before retrying so review can continue.",
    };
  }
  if (!archiveBody) {
    return {
      status: "checking",
      label: "Checking uploads",
      tone: "quiet",
      summary: "Links work while this screen checks whether uploads are ready.",
      detail: "Upload status is still loading. Start with a secure link if you need to keep moving.",
    };
  }
  return {
    status: "ready",
    label: "Uploads ready",
    tone: "ready",
    summary: "Use the link form for online work and the upload form for files.",
    detail: "File uploads are ready. Use uploads for files. Use secure links when the work already lives online.",
  };
}

function renderStudentStorageFallbackCard(card = {}) {
  return `
    <article class="workspace-student-storage-fallback-card ${escapeHtml(card.tone || "quiet")}" data-student-storage-card="${escapeHtml(card.id || "storage")}">
      <div>
        <span>${escapeHtml(card.owner || "Next step")}</span>
        <strong>${escapeHtml(card.title || "Review proof path")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      <div class="workspace-student-storage-fallback-card-foot">
        <b>${escapeHtml(card.metric || "")}</b>
        ${renderStudentStorageFallbackButton(card)}
      </div>
    </article>
  `;
}

function renderStudentStorageFallbackButton(card = {}) {
  if (card.section) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(card.section)}">
        ${escapeHtml(card.action || "Open")}
      </button>
    `;
  }
  if (card.focus) {
    return `
      <button class="workspace-link-button workspace-link-button-small" type="button" data-student-storage-focus="${escapeHtml(card.focus)}">
        ${escapeHtml(card.action || "Show")}
      </button>
    `;
  }
  return "";
}

function studentSubmissionId(submission = {}) {
  return cleanDirectoryFilter(submission?.id || submission?.submissionId || "");
}

function studentSubmissionRequirementId(submission = {}) {
  return cleanDirectoryFilter(submission?.requirement_id || submission?.requirementId || "");
}

function studentSubmissionRequirementTitle(submission = {}) {
  const title = String(submission?.requirement_title || submission?.requirementTitle || submission?.title || "").trim();
  return title || "Senior Project work";
}

function studentRequirementMatchForSubmission(submission = {}, requirements = []) {
  const requirementId = studentSubmissionRequirementId(submission);
  const title = studentSubmissionRequirementTitle(submission).toLowerCase();
  return (Array.isArray(requirements) ? requirements : []).find((requirement) => {
    const rowId = cleanDirectoryFilter(requirement?.requirementId || requirement?.requirement_id || requirement?.id || "");
    const rowSubmissionId = cleanDirectoryFilter(requirement?.submissionId || requirement?.submission_id || "");
    const rowTitle = String(requirement?.title || requirement?.requirementTitle || requirement?.requirement_title || "").trim().toLowerCase();
    return (requirementId && rowId === requirementId)
      || (studentSubmissionId(submission) && rowSubmissionId === studentSubmissionId(submission))
      || (title && rowTitle === title);
  }) || null;
}

function studentProofGuideForSubmission(submission = {}, requirements = []) {
  const requirement = studentRequirementMatchForSubmission(submission, requirements);
  const title = studentSubmissionRequirementTitle(submission);
  const description = String(requirement?.description || submission?.description || "").trim();
  const qualityPrompt = String(requirement?.qualityPrompt || requirement?.quality_prompt || submission?.qualityPrompt || "").trim();
  const phase = studentBookletPhaseInfo(requirement?.phase || requirement?.phaseLabel || "", requirement?.phaseLabel || "");
  const nextAction = studentInstructionCopy(requirement?.nextAction || submission?.nextAction || "Add the Google Drive link that matches this work item.");
  return {
    title,
    description: description || `Use a Google Drive link that clearly shows the work for ${title} is ready for review.`,
    qualityPrompt,
    phaseLabel: phase.label || "Current work",
    phaseGoal: phase.deliverable || "Finish the work your teacher lists for this phase.",
    phaseDone: phase.done || "Your teacher marks the listed work approved.",
    phaseChecklist: Array.isArray(phase.checklist) ? phase.checklist : [],
    statusLabel: studentStatusText(submission?.status || requirement?.submissionStatus || requirement?.status || "draft"),
    nextAction,
  };
}

function renderStudentProofGuideList(submissions = [], requirements = [], kind = "link", id = "") {
  const rows = Array.isArray(submissions) ? submissions : [];
  const selectedSubmissionId = studentSubmissionId(rows[0] || {});
  if (!rows.length) return "";
  return `
    <div id="${escapeHtml(id)}" class="workspace-student-proof-guide-list" data-student-proof-guide-list="${escapeHtml(kind)}" data-selected-submission-id="${escapeHtml(selectedSubmissionId)}" aria-live="polite">
      ${rows.map((submission) => renderStudentProofGuide(submission, requirements, selectedSubmissionId)).join("")}
    </div>
  `;
}

function renderStudentProofGuide(submission = {}, requirements = [], selectedSubmissionId = "") {
  const submissionId = studentSubmissionId(submission);
  const guide = studentProofGuideForSubmission(submission, requirements);
  const selected = submissionId === selectedSubmissionId;
  return `
    <article class="workspace-student-proof-guide" data-student-proof-guide="${escapeHtml(submissionId)}" data-student-proof-guide-selected="${selected ? "true" : "false"}" ${selected ? "" : "hidden"}>
      <div class="workspace-student-proof-guide-head">
        <span>What to add</span>
        <strong>${escapeHtml(`What Google Drive link to add for ${guide.title}`)}</strong>
      </div>
      <p class="workspace-student-proof-phase-goal" data-student-proof-phase-goal="true"><strong>This file should help finish:</strong> ${escapeHtml(guide.phaseGoal)}</p>
      <p>${escapeHtml(guide.description)}</p>
      ${guide.phaseChecklist.length ? `<p class="workspace-muted" data-student-proof-phase-include="true"><strong>Include:</strong> ${escapeHtml(guide.phaseChecklist.join("; "))}</p>` : ""}
      ${guide.qualityPrompt ? `<p class="workspace-muted" data-student-proof-guide-quality="true">Before you add it: ${escapeHtml(studentInstructionCopy(guide.qualityPrompt))}</p>` : ""}
      <div class="workspace-student-proof-guide-facts">
        <span><b>Phase</b>${escapeHtml(guide.phaseLabel)}</span>
        <span><b>Status</b>${escapeHtml(guide.statusLabel)}</span>
        <span><b>Done when</b>${escapeHtml(guide.phaseDone)}</span>
        <span><b>Next step</b>${escapeHtml(guide.nextAction)}</span>
      </div>
    </article>
  `;
}

function renderStudentEvidenceEmptyState() {
  return `
    <article class="workspace-empty-state-card" data-student-evidence-empty="true">
      <strong>No file can be uploaded yet.</strong>
      <p>First open Current work and start the item your teacher assigned. Upload tools appear here after that item exists.</p>
      <p class="workspace-muted">If no item appears, ask your teacher which Senior Project step should be assigned before you upload a file.</p>
    </article>
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
  const linkFallback = state === "failed"
    ? `<p class="workspace-muted" data-upload-link-fallback="true" data-upload-fallback-priority="link-first">Need to keep moving? Add the work as a secure link above first. Then tell your teacher the file upload did not finish. Retry only if staff says file uploads are ready.</p>`
    : "";

  return `
    <div id="workspaceUploadStatus" class="workspace-upload-status workspace-upload-status-${escapeHtml(state)}" data-upload-state="${escapeHtml(state)}" data-upload-progress="${progress}" role="status" aria-live="polite">
      <div class="workspace-upload-status-head">
        <span class="workspace-upload-status-label">${escapeHtml(uploadLabelForState(state))}</span>
        <span class="workspace-upload-status-percent">${progress}%</span>
      </div>
      <div class="workspace-upload-meter" role="progressbar" aria-label="File upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" data-upload-progress="${progress}">
        ${renderProgressSvg(progress)}
      </div>
      <p class="workspace-upload-message" data-upload-message>${escapeHtml(message)}</p>
      ${fileSummary}
      ${linkFallback}
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
  if (state === "uploading") return "Uploading your file.";
  if (state === "verifying") return "Checking that the upload finished safely.";
  if (state === "complete") return "Your file was received and added to your work.";
  if (state === "failed") return "The upload did not finish. Review the message and try again if available.";
  return "Choose a file to upload.";
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
