function renderProjectsSection() {
  const result = currentData.projects;
  if (result?.status === 403) return renderPermissionDeniedSection("Projects", "projects you are assigned to");
  const body = unwrap(result);
  if (!body) {
    if (workspaceDataLoading) {
      return `
        <section class="workspace-card workspace-loading-card" data-workspace-loading="projects" aria-live="polite">
          <p class="workspace-kicker">Projects</p>
          <h2>Loading projects…</h2>
          <p>Getting the latest project list for this school.</p>
        </section>
      `;
    }
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Projects</p>
        <h2>Projects could not load</h2>
        ${renderApiNotice(result)}
        <p>Refresh the page. If this keeps happening, ask your school admin for help.</p>
      </section>
    `;
  }

  const projects = Array.isArray(body.projects) ? body.projects : [];
  const requests = Array.isArray(body.requests) ? body.requests : [];
  const availableStudents = Array.isArray(body.availableStudents) ? body.availableStudents : [];
  const templates = Array.isArray(body.templates) ? body.templates : [];
  const availableProjectAdults = body.availableProjectAdults && typeof body.availableProjectAdults === "object"
    ? body.availableProjectAdults
    : { mentors: [], programTeachers: [] };
  const summary = body.summary || {};
  const isStudent = roleIds(currentUser).has("student");
  const canManage = Boolean(body.permissions?.canManage);
  const canOpenReviewQueue = body.permissions?.canOpenReviewQueue;
  const canMakeReviewDecision = Boolean(body.permissions?.canMakeReviewDecision);
  const accessibleSites = accessibleSitesForWorkspace();
  if (!isStudent && accessibleSites.length > 1 && !selectedSiteQueryValue()) {
    return `
      <section class="workspace-command-center workspace-project-directory" aria-labelledby="projectsTitle" data-project-directory="true">
        <div class="workspace-command-hero workspace-project-hero">
          <div>
            <p class="workspace-kicker">PROJECT WORKSPACES</p>
            <h1 id="projectsTitle">Projects</h1>
            <p>Choose one school. Then open one project.</p>
          </div>
        </div>
        ${renderProjectSiteSelection(accessibleSites)}
      </section>
    `;
  }

  const selectedProjectIndex = projects.findIndex((project) => project.projectId === activeProjectId);
  const selectedProject = selectedProjectIndex >= 0
    ? projects[selectedProjectIndex]
    : isStudent && projects.length
      ? projects[0]
      : null;
  if (selectedProject) {
    const pagination = body.pagination || {};
    const page = Math.max(1, safeNumber(pagination.page) || 1);
    const pageSize = Math.max(1, safeNumber(pagination.pageSize) || 25);
    const filteredTotal = Math.max(projects.length, safeNumber(pagination.total));
    const firstNumber = filteredTotal ? ((page - 1) * pageSize) + 1 : 1;
    const workspaceProjectIndex = selectedProjectIndex >= 0 ? selectedProjectIndex : 0;
    return renderProjectWorkspace(selectedProject, {
      projects,
      selectedProjectIndex: workspaceProjectIndex,
      position: firstNumber + workspaceProjectIndex,
      total: filteredTotal,
      availableStudents,
      canManage,
      isStudent,
      templates,
      siteId: body.siteId || selectedSiteQueryValue() || projectsFirstSiteId(projects),
      availableProjectAdults,
      canOpenReviewQueue,
      canMakeReviewDecision,
      canManageTemplates: Boolean(body.permissions?.canManageTemplates),
    });
  }

  return `
    <section class="workspace-command-center workspace-project-directory" aria-labelledby="projectsTitle" data-project-directory="true">
      <div class="workspace-command-hero workspace-project-hero">
        <div>
          <p class="workspace-kicker">${isStudent ? "YOUR SENIOR PROJECT" : "PROJECT WORKSPACES"}</p>
          <h1 id="projectsTitle">${isStudent ? "My Project" : "Projects"}</h1>
          <p>${isStudent ? "Your team, steps, files, and feedback live here." : "Open one project. See the team. Then do the next step."}</p>
        </div>
        ${body.permissions?.canCreate ? `<button class="workspace-primary-button" type="button" data-project-action="new">Create project</button>` : ""}
      </div>
        ${!isStudent ? `
          <details class="workspace-project-summary-disclosure">
            <summary>
              <span><strong>Project overview</strong><small>Counts and setup checks</small></span>
              <span class="workspace-summary-badge">${safeNumber(summary.total)} active</span>
            </summary>
            <div class="workspace-project-summary" aria-label="Project summary">
              <article><span>ACTIVE PROJECTS</span><strong>${safeNumber(summary.total)}</strong><small>At this school</small></article>
              <article><span>TEAM PROJECTS</span><strong>${safeNumber(summary.teams)}</strong><small>Two to five students</small></article>
              <article><span>WAITING REVIEW</span><strong>${safeNumber(summary.waitingForReview)}</strong><small>Teacher action needed</small></article>
              <article class="${safeNumber(summary.missingRequiredAdult) ? "workspace-project-summary-warning" : ""}"><span>PEOPLE SETUP</span><strong>${safeNumber(summary.adultsReady)}/${safeNumber(summary.total)}</strong><small>${safeNumber(summary.missingRequiredAdult) ? `${safeNumber(summary.missingRequiredAdult)} need help` : "Both adults confirmed"}</small></article>
              <article><span>STUDENT IDEAS</span><strong>${safeNumber(summary.studentIdeas)}</strong><small>Waiting for an answer</small></article>
            </div>
          </details>
        ` : ""}

      ${renderProjectDirectoryWorklist(projects, {
        availableStudents,
        canManage,
        isStudent,
        pagination: body.pagination || {},
        summary,
        availableProjectAdults,
        canOpenReviewQueue,
        canMakeReviewDecision,
      })}

      ${canManage && requests.some((request) => request.status === "submitted") ? renderProjectRequestsForStaff(requests, availableProjectAdults) : ""}

      ${renderProjectTemplateShelf(templates, {
        canManage: Boolean(body.permissions?.canManageTemplates),
        isStudent,
        siteId: body.siteId || selectedSiteQueryValue() || projectsFirstSiteId(projects),
      })}

      ${body.permissions?.canCreate ? renderCreateProjectForm(body) : ""}
      ${renderProjectStudentDatalist(availableStudents, projects)}
    </section>
  `;
}

function renderProjectWorkspace(project = {}, options = {}) {
  const rows = Array.isArray(options.projects) ? options.projects : [];
  const selectedIndex = Math.max(0, safeNumber(options.selectedProjectIndex));
  const phase = studentBookletPhaseInfo(project.currentPhase || "start");
  const state = projectDisplayState(project);
  const adults = projectAdultListNames(project.adultSetup);
  const backAction = options.isStudent
    ? '<button class="workspace-button workspace-button-secondary workspace-project-back" type="button" data-section="student">← Back to Today</button>'
    : '<button class="workspace-button workspace-button-secondary workspace-project-back" type="button" data-project-action="back-to-list">← Back to project list</button>';
  return `
    <section class="workspace-command-center workspace-project-dedicated" id="projectWorkspace" data-project-workspace="true" data-project-id="${escapeHtml(project.projectId || "")}" aria-labelledby="projectWorkspaceTitle" tabindex="-1">
      <nav class="workspace-project-detail-toolbar" aria-label="Project navigation">
        ${backAction}
        ${safeNumber(options.total) > 1 ? `<span>Project ${escapeHtml(safeNumber(options.position))} of ${escapeHtml(safeNumber(options.total))}</span>` : '<span>Project workspace</span>'}
      </nav>
      <header class="workspace-project-detail-hero">
        <div>
          <p class="workspace-kicker">PROJECT WORKSPACE</p>
          <h1 id="projectWorkspaceTitle">${escapeHtml(project.name || "Senior Project")}</h1>
          <p>${escapeHtml(cleanDemoSeedDisplay(project.programName, "Program not set"))} · ${escapeHtml(adults)}</p>
        </div>
        <div class="workspace-project-detail-status" aria-label="Project status">
          <span class="workspace-status-pill ${escapeHtml(state.tone)}">${escapeHtml(state.label)}</span>
          <span class="workspace-project-phase-pill">${escapeHtml(phase.label)}</span>
        </div>
      </header>
      <div class="workspace-project-detail-content">
        ${renderProjectCard(project, {
          open: true,
          dedicated: true,
          canManage: options.canManage,
          isStudent: options.isStudent,
          availableStudents: options.availableStudents || [],
          position: options.position,
          total: options.total,
          previousProject: rows[selectedIndex - 1] || null,
          nextProject: rows[selectedIndex + 1] || null,
          availableProjectAdults: options.availableProjectAdults || {},
          canOpenReviewQueue: options.canOpenReviewQueue,
          canMakeReviewDecision: options.canMakeReviewDecision,
        })}
      </div>
      ${renderProjectTemplateShelf(options.templates || [], {
        canManage: options.canManageTemplates,
        isStudent: options.isStudent,
        siteId: options.siteId || project.siteId || "",
      })}
      ${renderProjectStudentDatalist(options.availableStudents || [], rows)}
    </section>
  `;
}

function renderProjectDirectoryWorklist(projects = [], options = {}) {
  const rows = Array.isArray(projects) ? projects : [];
  const pagination = options.pagination || {};
  const page = Math.max(1, safeNumber(pagination.page) || 1);
  const pageSize = Math.max(1, safeNumber(pagination.pageSize) || 25);
  const filteredTotal = Math.max(0, safeNumber(pagination.total));
  const totalPages = Math.max(1, safeNumber(pagination.totalPages) || 1);
  const search = cleanSearchFilter(pagination.search ?? projectDirectoryFilters.search);
  const filter = cleanProjectDirectoryFilter(pagination.filter ?? projectDirectoryFilters.filter);
  const sort = cleanProjectDirectorySort(pagination.sort ?? projectDirectoryFilters.sort);
  const hasFilters = Boolean(search || filter !== "all" || sort !== "action");
  const firstNumber = filteredTotal ? ((page - 1) * pageSize) + 1 : 0;
  const lastNumber = filteredTotal ? Math.min(filteredTotal, firstNumber + rows.length - 1) : 0;
  if (!rows.length && !hasFilters && safeNumber(options.summary?.total) === 0) {
    return `
      <section class="workspace-card workspace-empty-card">
        <h2>No project is assigned yet</h2>
        <p>${options.isStudent ? "Ask your teacher to add you to a project." : "Create a project and add one to five students."}</p>
      </section>
    `;
  }

  return `
    <section class="workspace-project-worklist" aria-labelledby="projectListTitle">
      <div class="workspace-project-section-head">
        <div>
          <p class="workspace-kicker">Project list</p>
          <h2 id="projectListTitle" tabindex="-1">School projects</h2>
          <p>Choose one project. The list will close and that project will open.</p>
        </div>
        <div class="workspace-project-view-switch" aria-label="Project view">
          <button class="${projectDirectoryView === "table" ? "is-active" : ""}" type="button" data-project-action="view" data-project-view="table" aria-pressed="${projectDirectoryView === "table"}">List</button>
          <button class="${projectDirectoryView === "board" ? "is-active" : ""}" type="button" data-project-action="view" data-project-view="board" aria-pressed="${projectDirectoryView === "board"}">Board</button>
        </div>
      </div>
      <form class="workspace-project-directory-filters" data-project-directory-filter-form="true" role="search">
        <label class="workspace-project-search">
          <span>Project or student name</span>
          <input name="search" type="search" value="${escapeHtml(search)}" autocomplete="off" maxlength="80">
        </label>
        <label>
          <span>Show</span>
          <select name="filter">
            ${renderProjectDirectoryFilterOptions(filter)}
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select name="sort">
            ${renderProjectDirectorySortOptions(sort)}
          </select>
        </label>
        <button class="workspace-primary-button workspace-button-small" type="submit">Find projects</button>
        ${hasFilters ? `<button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-project-action="clear-filters">Clear</button>` : ""}
      </form>
      ${rows.length ? `
        <div class="workspace-project-list-pane workspace-project-directory-surface" data-project-list-only="true" data-project-view="${escapeHtml(projectDirectoryView)}">
            <div class="workspace-project-result-line" aria-live="polite">
              <strong>${filteredTotal ? `Showing ${firstNumber}–${lastNumber} of ${filteredTotal}` : "No matching projects"}</strong>
              <span>${hasFilters ? "These results use your search, filter, and sort choices." : "These are all projects this account can open."}</span>
            </div>
            ${projectDirectoryView === "board" ? renderProjectBoard(rows) : `
              <div class="workspace-project-list" data-project-list="true" data-project-view-content="table">
                <div class="workspace-project-table-head" aria-hidden="true">
                  <span>Project</span>
                  <span>Students</span>
                  <span>Phase</span>
                  <span>Status</span>
                  <span>Open</span>
                </div>
                ${rows.map((project) => renderProjectDirectoryRow(project)).join("")}
              </div>
            `}
            ${renderProjectPageNavigation({ page, totalPages, filteredTotal })}
        </div>
      ` : `
        <section class="workspace-card workspace-empty-card">
          <h3>No projects match</h3>
          <p>Clear the search or choose a different filter.</p>
          <button class="workspace-button workspace-button-secondary" type="button" data-project-action="clear-filters">Show all projects</button>
        </section>
      `}
    </section>
  `;
}

function renderProjectDirectoryFilterOptions(selected = "all") {
  return [
    ["all", "All projects"],
    ["review", "Waiting for review"],
    ["changes", "Changes needed"],
    ["working", "In progress"],
    ["team", "Team projects"],
    ["individual", "Individual projects"],
  ].map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function renderProjectDirectorySortOptions(selected = "action") {
  return [
    ["action", "Next action"],
    ["updated", "Recently updated"],
    ["name", "Project name"],
    ["phase", "Project stage"],
    ["team", "Largest team"],
  ].map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function projectDisplayState(project = {}) {
  if (project.status === "completed") return { label: "Complete", tone: "approved" };
  if (project.adultSetup?.ready === false) return { label: "People needed", tone: "revision_requested" };
  if (safeNumber(project.revisionRequestedCount) > 0) return { label: "Changes needed", tone: "revision_requested" };
  if (safeNumber(project.waitingForReviewCount) > 0) return { label: "Waiting for review", tone: "submitted" };
  return { label: "In progress", tone: "in_progress" };
}

function renderProjectDirectoryRow(project = {}, selected = false) {
  const members = Array.isArray(project.members) ? project.members : [];
  const memberNames = members.map((member) => member.displayName).join(", ") || "No students";
  const adultNames = projectAdultListNames(project.adultSetup);
  const phase = studentBookletPhaseInfo(project.currentPhase || "start");
  const state = projectDisplayState(project);
  return `
    <button class="workspace-project-directory-row ${selected ? "is-selected" : ""}" type="button" data-project-action="open-row" data-project-id="${escapeHtml(project.projectId || "")}" data-project-name="${escapeHtml(project.name || "Senior Project")}" aria-label="Open project: ${escapeHtml(project.name || "Senior Project")}">
      <span title="${escapeHtml(adultNames)}"><strong>${escapeHtml(project.name || "Senior Project")}</strong><small>${escapeHtml(project.programName || "Program not set")}</small><small>${escapeHtml(adultNames)}</small></span>
      <span title="${escapeHtml(memberNames)}">${escapeHtml(memberNames)}</span>
      <span>${escapeHtml(phase.label.replace(/^Phase\s+\d+[A-Za-z]?:\s*/i, ""))}</span>
      <span><b class="workspace-status-pill ${escapeHtml(state.tone)}">${escapeHtml(state.label)}</b></span>
      <span aria-hidden="true">›</span>
    </button>
  `;
}

function renderProjectPageNavigation({ page = 1, totalPages = 1, filteredTotal = 0 } = {}) {
  if (totalPages <= 1) return "";
  return `
    <nav class="workspace-project-pages" aria-label="Project list pages">
      <button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-project-action="page" data-project-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>Previous page</button>
      <span>Page ${page} of ${totalPages} · ${filteredTotal} projects</span>
      <button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-project-action="page" data-project-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>Next page</button>
    </nav>
  `;
}

function cleanProjectDirectoryFilter(value) {
  const filter = cleanDirectoryFilter(value);
  return ["review", "changes", "working", "team", "individual"].includes(filter) ? filter : "all";
}

function cleanProjectDirectorySort(value) {
  const sort = cleanDirectoryFilter(value);
  return ["updated", "name", "phase", "team"].includes(sort) ? sort : "action";
}

function renderProjectSiteSelection(sites = []) {
  const rows = Array.isArray(sites) ? sites : [];
  return `
    <section class="workspace-card workspace-project-site-choice" aria-labelledby="projectSiteChoiceTitle">
      <p class="workspace-kicker">Choose a school</p>
      <h2 id="projectSiteChoiceTitle">Which school do you want to see?</h2>
      <p>Projects, students, colors, and review work will match the school you choose.</p>
      <div class="workspace-project-site-choice-list">
        ${rows.map((site) => `
          <button class="workspace-button workspace-button-secondary" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
            <strong>${escapeHtml(site.siteName || "School")}</strong>
            <small>Open projects</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProjectTemplateShelf(templates = [], options = {}) {
  const rows = Array.isArray(templates) ? templates : [];
  const canManage = Boolean(options.canManage);
  const isStudent = Boolean(options.isStudent);
  if (!rows.length && !canManage) return "";
  const activeRows = rows.filter((template) => template.active !== false);
  const removedRows = canManage ? rows.filter((template) => template.active === false) : [];
  const phaseOptions = STUDENT_BOOKLET_PHASE_ORDER.map((phaseKey) => {
    const phase = studentBookletPhaseInfo(phaseKey);
    return `<option value="${escapeHtml(phaseKey)}">${escapeHtml(phase.label)}</option>`;
  }).join("");
  return `
    <section class="workspace-project-template-shelf workspace-card" data-project-template-shelf="true" aria-labelledby="projectTemplateShelfTitle">
      <details class="workspace-project-template-disclosure" ${isStudent ? "open" : ""}>
        <summary>
          <span>
            <small class="workspace-kicker">Google Drive templates</small>
            <strong id="projectTemplateShelfTitle">Templates for students</strong>
          </span>
          <span class="workspace-summary-badge">${activeRows.length} ${pluralize(activeRows.length, "template")}</span>
        </summary>
        <div class="workspace-project-template-content">
          <p>Students open your original, make a copy in their project folder, then submit their own link.</p>
      ${activeRows.length ? `
        <div class="workspace-project-template-list">
          ${activeRows.map((template) => {
            const url = cleanWorkspaceGoogleWorkUrl(template.templateUrl);
            const phase = studentBookletPhaseInfo(template.phase || "start");
            return `
              <article class="workspace-project-template-row" data-template-phase="${escapeHtml(phase.key || "start")}">
                <div>
                  <span>${escapeHtml(studentPhaseShortLabel(phase.key, phase.label))}</span>
                  <strong>${escapeHtml(template.title || "Project template")}</strong>
                  <small>${escapeHtml(template.description || "Teacher-provided Google Drive template")}</small>
                  <small class="workspace-link-check ${template.linkCheckStatus === "staff_confirmed" ? "workspace-link-check-confirmed" : "workspace-link-check-needed"}">${template.linkCheckStatus === "staff_confirmed" ? "Link opened by school staff" : "Link needs a staff check"}</small>
                </div>
                <div class="workspace-project-template-actions">
                  ${url ? `<a class="workspace-button workspace-button-secondary workspace-button-small" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open template</a>` : ""}
                  ${canManage ? `
                    <details class="workspace-project-template-remove">
                      <summary>Remove</summary>
                      <form data-project-template-remove-form="true">
                        <input type="hidden" name="action" value="archive_template">
                        <input type="hidden" name="siteId" value="${escapeHtml(options.siteId || "")}">
                        <input type="hidden" name="templateId" value="${escapeHtml(template.templateId || "")}">
                        <label>
                          <span>Why are you removing it?</span>
                          <input name="changeReason" type="text" maxlength="500" required>
                        </label>
                        ${renderDestructiveActionConfirmation({
                          id: `template-remove-${template.templateId || "current"}`,
                          label: "Hide this template from students.",
                          detail: "The link is kept so a school admin can restore it later.",
                        })}
                        <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit">Remove template</button>
                      </form>
                    </details>
                  ` : ""}
                </div>
                ${canManage ? `
                  <details class="workspace-project-template-change">
                    <summary>Change link</summary>
                    <form data-project-template-form="true">
                      <input type="hidden" name="siteId" value="${escapeHtml(options.siteId || "")}">
                      <input type="hidden" name="templateId" value="${escapeHtml(template.templateId || "")}">
                      <strong>Use a new Google link</strong>
                      <p class="workspace-muted">The template name and stage stay the same. Students will open the new link after you save.</p>
                      <label>
                        <span>New Google link</span>
                        <input name="templateUrl" type="url" inputmode="url" maxlength="2048" value="${escapeHtml(url)}" required>
                      </label>
                      <label class="workspace-checkbox-row">
                        <input name="confirmLinkOpened" type="checkbox" value="true" required>
                        <span>I opened this new link and it works.</span>
                      </label>
                      <label>
                        <span>Why are you changing it?</span>
                        <input name="changeReason" type="text" maxlength="500" aria-describedby="templateChangeReason-${escapeHtml(template.templateId || "current")}" required>
                        <small id="templateChangeReason-${escapeHtml(template.templateId || "current")}">Example: The old file was replaced.</small>
                      </label>
                      ${renderDestructiveActionConfirmation({
                        id: `template-link-${template.templateId || "current"}`,
                        label: "I checked that students should use this new link.",
                        detail: "Saving changes the link for everyone who uses this school template.",
                      })}
                      <button class="workspace-primary-button" type="submit">Save new link</button>
                    </form>
                  </details>
                ` : ""}
              </article>
            `;
          }).join("")}
        </div>
      ` : `<p class="workspace-muted">No templates are showing to students right now.</p>`}
      ${removedRows.length ? `
        <details class="workspace-project-template-removed" data-project-template-removed="true">
          <summary>Removed templates (${removedRows.length})</summary>
          <p class="workspace-muted">Restore a template if students should use it again.</p>
          <div class="workspace-project-template-list">
            ${removedRows.map((template) => `
              <article class="workspace-project-template-row">
                <div>
                  <span>REMOVED</span>
                  <strong>${escapeHtml(template.title || "Project template")}</strong>
                  <small>${escapeHtml(studentBookletPhaseInfo(template.phase || "start").label)}</small>
                </div>
                <details class="workspace-project-template-remove">
                  <summary>Restore</summary>
                  <form data-project-template-remove-form="true">
                    <input type="hidden" name="action" value="restore_template">
                    <input type="hidden" name="siteId" value="${escapeHtml(options.siteId || "")}">
                    <input type="hidden" name="templateId" value="${escapeHtml(template.templateId || "")}">
                    <label>
                      <span>Why are you restoring it?</span>
                      <input name="changeReason" type="text" maxlength="500" required>
                    </label>
                    ${renderDestructiveActionConfirmation({
                      id: `template-restore-${template.templateId || "current"}`,
                      label: "Show this template to students again.",
                      detail: "Students will see the same saved Google link.",
                    })}
                    <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit">Restore template</button>
                  </form>
                </details>
              </article>
            `).join("")}
          </div>
        </details>
      ` : ""}
      ${canManage ? `
        <details class="workspace-project-template-add" ${activeRows.length || removedRows.length ? "" : "open"}>
          <summary>Add a Google Drive template</summary>
          <form class="workspace-create-project-form" data-project-template-form="true">
            <input type="hidden" name="siteId" value="${escapeHtml(options.siteId || "")}">
            <label>
              <span>Template name</span>
              <input name="name" type="text" maxlength="120" aria-describedby="projectTemplateNameHelp" required>
              <small id="projectTemplateNameHelp">Example: Project proposal template</small>
            </label>
            <label>
              <span>Project stage</span>
              <select name="phase" required>${phaseOptions}</select>
            </label>
            <label class="workspace-label-wide">
              <span>What should students use it for?</span>
              <input name="description" type="text" maxlength="300" aria-describedby="projectTemplateDescriptionHelp">
              <small id="projectTemplateDescriptionHelp">Give one short direction. Example: Make a copy and answer the proposal questions.</small>
            </label>
            <label class="workspace-label-wide">
              <span>Google Drive, Docs, Sheets, or Slides link</span>
              <input name="templateUrl" type="url" inputmode="url" maxlength="2048" aria-describedby="projectTemplateUrlHelp" required>
              <small id="projectTemplateUrlHelp">Paste the Google link students should copy.</small>
            </label>
            <label class="workspace-checkbox-row workspace-label-wide">
              <input name="confirmLinkOpened" type="checkbox" value="true" required>
              <span>I opened this link and students can reach the template.</span>
            </label>
            <button class="workspace-primary-button" type="submit">Add template</button>
          </form>
        </details>
      ` : ""}
        </div>
      </details>
    </section>
  `;
}

function renderProjectCard(project = {}, options = {}) {
  const members = Array.isArray(project.members) ? project.members : [];
  const mentors = Array.isArray(project.mentors) ? project.mentors : [];
  const memberCount = safeNumber(project.memberCount || members.length);
  const phase = studentBookletPhaseInfo(project.currentPhase || "start");
  const state = projectDisplayState(project);
  const firstMember = members[0] || {};
  const memberNames = members.map((member) => member.displayName).join(", ") || "No students";
  const isMentor = roleIds(currentUser).has("mentor");
  const canOpenReviewQueue = options.canOpenReviewQueue === undefined
    ? hasSiteReviewQueueRole(roleIds(currentUser))
    : Boolean(options.canOpenReviewQueue);
  const canMakeReviewDecision = options.canMakeReviewDecision === undefined
    ? roleIds(currentUser).has("program_teacher") || roleIds(currentUser).has("mentor")
    : Boolean(options.canMakeReviewDecision);
  const mentorNextAction = safeNumber(project.waitingForReviewCount) > 0
    ? "Open the work. Read the student's link. Then choose the next step."
    : "Open the check-in. Ask one clear question, agree on one next step, and save it.";
  return `
    <details class="workspace-project-card ${options.dedicated ? "workspace-project-card-dedicated" : ""}" data-project-id="${escapeHtml(project.projectId || "")}" data-project-search-text="${escapeHtml(`${project.name || ""} ${memberNames} ${phase.label} ${state.label}`.toLowerCase())}" ${options.open ? "open" : ""}>
      <summary>
        <span class="workspace-project-card-title">
          <strong>${escapeHtml(project.name || "Senior Project")}</strong>
          <small>${escapeHtml(project.programName || "Program not set")}</small>
        </span>
        <span class="workspace-project-card-team" title="${escapeHtml(memberNames)}">${escapeHtml(memberNames)}</span>
        <span class="workspace-project-card-phase">${escapeHtml(phase.label.replace(/^Phase\s+\d+[A-Za-z]?:\s*/i, ""))}</span>
        <span class="workspace-status-pill ${escapeHtml(state.tone)}">${escapeHtml(state.label)}</span>
        <span class="workspace-project-card-open">Open <b aria-hidden="true">›</b></span>
      </summary>
      <div class="workspace-project-card-body">
        <div class="workspace-project-next-step">
          <span>NEXT STEP</span>
          <strong>${escapeHtml(isMentor ? mentorNextAction : project.nextAction || "Open the project and check the next step.")}</strong>
        </div>
        ${renderProjectDriveFolderForStaff(project)}
        <div class="workspace-project-facts">
          <div>
            <span>TEAM</span>
            <p>${escapeHtml(members.map((member) => member.displayName).join(", ") || "No students assigned")}</p>
          </div>
          <div>
            <span>MENTOR</span>
            <p>${escapeHtml(mentors.map((mentor) => mentor.displayName).join(", ") || "Not assigned yet")}</p>
          </div>
          <div>
            <span>PROGRAM</span>
            <p>${escapeHtml(cleanDemoSeedDisplay(project.programName, "Program not set"))}</p>
          </div>
        </div>
        <div class="workspace-project-actions">
          ${canOpenReviewQueue && project.nextSubmissionId && safeNumber(project.waitingForReviewCount) > 0 ? `
            <button class="workspace-primary-button" type="button" data-project-action="review" data-project-submission-id="${escapeHtml(project.nextSubmissionId)}" data-project-name="${escapeHtml(project.name || "Senior Project")}">${escapeHtml(canMakeReviewDecision ? "Review this project" : "Open review details")}</button>
          ` : isMentor && firstMember.studentId ? `
            <button class="workspace-primary-button" type="button" data-mentor-dashboard-action="open-meetings" data-mentor-dashboard-student-id="${escapeHtml(firstMember.studentId)}">Open check-in</button>
          ` : firstMember.studentId ? renderViewAsStudentAction(firstMember.studentId, project.name || firstMember.displayName, { sourceSection: "projects", label: "Open project" }) : ""}
          ${isMentor && firstMember.studentId ? renderViewAsStudentAction(firstMember.studentId, project.name || firstMember.displayName, { sourceSection: "projects", label: "Preview student view" }) : ""}
          ${members.length > 1 ? `<small>Shared work belongs to the team. Personal reflections still belong to each student.</small>` : `<small>This is an individual project. It uses the same steps as a team project.</small>`}
        </div>
        ${renderProjectNavigator(project, options)}
        ${renderProjectNotes(project)}
        ${renderProjectAdultSetup(project.adultSetup, project.adultAssignments, {
          projectId: project.projectId,
          programId: project.programId,
          canManage: options.canManage,
          canNominate: options.isStudent,
          availableProjectAdults: options.availableProjectAdults || {},
        })}
        ${options.canManage ? `
          <button class="workspace-button workspace-button-secondary" type="button" data-project-action="manage" data-project-id="${escapeHtml(project.projectId || "")}">
            ${managedProjectId === project.projectId ? "Close project settings" : "Manage project"}
          </button>
          ${managedProjectId === project.projectId ? renderManageProjectForm(project, options.availableStudents || []) : ""}
        ` : ""}
      </div>
    </details>
  `;
}

function renderProjectNotes(project = {}) {
  const notes = Array.isArray(project.notes) ? project.notes : [];
  const activeNotes = notes.filter((note) => note.status !== "archived");
  const archivedNotes = notes.filter((note) => note.status === "archived");
  const canCreate = Boolean(project.notePermissions?.canCreate);
  return `
    <section class="workspace-project-notes" aria-labelledby="projectNotesTitle-${escapeHtml(project.projectId || "project")}">
      <div class="workspace-project-notes-head">
        <div>
          <span>PROJECT NOTES</span>
          <h3 id="projectNotesTitle-${escapeHtml(project.projectId || "project")}">Team notes</h3>
          <p>Leave a short update, question, or next step. Everyone who can open this project can read it.</p>
        </div>
        <b>${activeNotes.length} ${pluralize(activeNotes.length, "note")}</b>
      </div>
      ${canCreate ? `
        <form class="workspace-project-note-new" data-project-note-form="true">
          <input type="hidden" name="projectId" value="${escapeHtml(project.projectId || "")}">
          <label>
            <span>Add a note</span>
            <textarea name="noteBody" maxlength="1200" rows="3" aria-describedby="projectNoteHelp-${escapeHtml(project.projectId || "project")}" required></textarea>
            <small id="projectNoteHelp-${escapeHtml(project.projectId || "project")}">What changed? What should happen next?</small>
          </label>
          <button class="workspace-primary-button workspace-button-small" type="submit" name="action" value="create_note">Add note</button>
        </form>
      ` : ""}
      <div class="workspace-project-note-list">
        ${activeNotes.length ? activeNotes.map((note) => renderProjectNote(project.projectId, note)).join("") : `
          <div class="workspace-project-note-empty">
            <strong>No notes yet</strong>
            <p>Add the first update when the team makes a decision or needs help.</p>
          </div>
        `}
      </div>
      ${archivedNotes.length ? `
        <details class="workspace-project-archived-notes">
          <summary>Archived notes (${archivedNotes.length})</summary>
          <p>Archived notes stay with the project and can be restored.</p>
          <div class="workspace-project-note-list is-archived">
            ${archivedNotes.map((note) => renderProjectNote(project.projectId, note)).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function renderProjectNote(projectId = "", note = {}) {
  const updated = note.updatedAt && note.updatedAt !== note.createdAt ? ` · Edited ${formatDate(note.updatedAt)}` : "";
  const archived = note.status === "archived";
  return `
    <article class="workspace-project-note ${archived ? "is-archived" : ""}">
      <header>
        <div>
          <strong>${escapeHtml(note.authorName || "Former user")}</strong>
          <small>${escapeHtml(formatDate(note.createdAt))}${escapeHtml(updated)}</small>
        </div>
        ${archived ? '<span class="workspace-status-pill archived">Archived</span>' : ""}
      </header>
      <p>${escapeHtml(note.body || "").replace(/\n/g, "<br>")}</p>
      ${(note.canEdit || note.canArchive || note.canRestore) ? `
        <div class="workspace-project-note-actions">
          ${note.canEdit ? `
            <details>
              <summary>Edit note</summary>
              <form data-project-note-form="true">
                <input type="hidden" name="projectId" value="${escapeHtml(projectId)}">
                <input type="hidden" name="noteId" value="${escapeHtml(note.noteId || "")}">
                <label>
                  <span>Note</span>
                  <textarea name="noteBody" maxlength="1200" rows="3" required>${escapeHtml(note.body || "")}</textarea>
                </label>
                <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit" name="action" value="edit_note">Save changes</button>
              </form>
            </details>
          ` : ""}
          ${note.canArchive ? `
            <form data-project-note-form="true">
              <input type="hidden" name="projectId" value="${escapeHtml(projectId)}">
              <input type="hidden" name="noteId" value="${escapeHtml(note.noteId || "")}">
              <button class="workspace-link-button workspace-link-button-small" type="submit" name="action" value="archive_note">Archive note</button>
            </form>
          ` : ""}
          ${note.canRestore ? `
            <form data-project-note-form="true">
              <input type="hidden" name="projectId" value="${escapeHtml(projectId)}">
              <input type="hidden" name="noteId" value="${escapeHtml(note.noteId || "")}">
              <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit" name="action" value="restore_note">Restore note</button>
            </form>
          ` : ""}
        </div>
      ` : ""}
      ${archived && note.archivedByName ? `<small>Archived by ${escapeHtml(note.archivedByName)}${note.archivedAt ? ` · ${escapeHtml(formatDate(note.archivedAt))}` : ""}</small>` : ""}
    </article>
  `;
}

function renderProjectNavigator(project = {}, options = {}) {
  if (safeNumber(options.total) <= 1) return "";
  const previous = options.previousProject || null;
  const next = options.nextProject || null;
  return `
    <nav class="workspace-item-navigator workspace-project-navigator" aria-label="Browse projects" data-project-navigator="true">
      <span>Project ${escapeHtml(safeNumber(options.position))} of ${escapeHtml(safeNumber(options.total))}</span>
      <div>
        ${previous?.projectId ? `<button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-project-action="open-row" data-project-id="${escapeHtml(previous.projectId)}" data-project-name="${escapeHtml(previous.name || "Project")}" aria-label="Open previous project: ${escapeHtml(previous.name || "project")}">Previous project</button>` : ""}
        ${next?.projectId ? `<button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-project-action="open-row" data-project-id="${escapeHtml(next.projectId)}" data-project-name="${escapeHtml(next.name || "Project")}" aria-label="Open next project: ${escapeHtml(next.name || "project")}">Next project</button>` : ""}
      </div>
    </nav>
  `;
}

function renderProjectDriveFolderForStaff(project = {}) {
  const folderUrl = cleanWorkspaceGoogleDriveFolderUrl(project.driveFolderUrl);
  return `
    <div class="workspace-project-drive-folder" data-project-drive-folder="${folderUrl ? "ready" : "missing"}">
      <div>
        <span>PROJECT FOLDER</span>
        <strong>${folderUrl ? "Google Drive folder is ready" : "No folder link yet"}</strong>
        <small>${folderUrl ? "Google controls who can open the folder." : "A student can add the folder from My Project."}</small>
      </div>
      ${folderUrl ? `<a class="workspace-button workspace-button-secondary workspace-button-small" href="${escapeHtml(folderUrl)}" target="_blank" rel="noopener noreferrer">Open Google Drive</a>` : ""}
    </div>
  `;
}

function renderProjectBoard(projects = []) {
  const rows = Array.isArray(projects) ? projects : [];
  const lanes = [
    {
      id: "review",
      title: "Needs review",
      rows: rows.filter((project) => safeNumber(project.waitingForReviewCount) > 0 && safeNumber(project.revisionRequestedCount) === 0),
    },
    {
      id: "changes",
      title: "Needs changes",
      rows: rows.filter((project) => safeNumber(project.revisionRequestedCount) > 0),
    },
    {
      id: "working",
      title: "In progress",
      rows: rows.filter((project) => project.status !== "completed" && safeNumber(project.waitingForReviewCount) === 0 && safeNumber(project.revisionRequestedCount) === 0),
    },
    {
      id: "complete",
      title: "Complete",
      rows: rows.filter((project) => project.status === "completed"),
    },
  ];
  return `
    <div class="workspace-project-board" data-project-list="true" data-project-view-content="board">
      ${lanes.map((lane) => `
        <section class="workspace-project-board-lane" data-project-board-lane="${escapeHtml(lane.id)}" aria-labelledby="projectLane-${escapeHtml(lane.id)}">
          <header>
            <h3 id="projectLane-${escapeHtml(lane.id)}">${escapeHtml(lane.title)}</h3>
            <span>${lane.rows.length}</span>
          </header>
          <div>
            ${lane.rows.length ? lane.rows.map(renderProjectBoardCard).join("") : `<p class="workspace-muted">No projects here.</p>`}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderProjectBoardCard(project = {}) {
  const members = Array.isArray(project.members) ? project.members : [];
  const memberNames = members.map((member) => member.displayName).join(", ") || "No students";
  const adultNames = projectAdultListNames(project.adultSetup);
  const phase = studentBookletPhaseInfo(project.currentPhase || "start");
  const state = project.adultSetup?.ready === false
    ? { label: "People needed", tone: "revision_requested" }
    : safeNumber(project.revisionRequestedCount) > 0
    ? { label: "Changes needed", tone: "revision_requested" }
    : safeNumber(project.waitingForReviewCount) > 0
      ? { label: "Waiting for review", tone: "submitted" }
      : { label: "In progress", tone: "in_progress" };
  return `
    <article class="workspace-project-board-card" data-project-search-text="${escapeHtml(`${project.name || ""} ${memberNames} ${adultNames} ${phase.label} ${state.label}`.toLowerCase())}">
      <span class="workspace-status-pill ${escapeHtml(state.tone)}">${escapeHtml(state.label)}</span>
      <strong>${escapeHtml(project.name || "Senior Project")}</strong>
      <small>${escapeHtml(memberNames)}</small>
      <p>${escapeHtml(adultNames)}</p>
      <p>${escapeHtml(phase.label)}</p>
      <button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-project-action="open-row" data-project-id="${escapeHtml(project.projectId || "")}" data-project-name="${escapeHtml(project.name || "Senior Project")}">Open project</button>
    </article>
  `;
}

function projectAdultListNames(setup = {}) {
  const mentor = setup?.mentor?.displayName || "Still needed";
  const programTeacher = setup?.programTeacher?.displayName || "Still needed";
  return `Mentor: ${mentor} · Program Teacher: ${programTeacher}`;
}

function renderProjectRequestsForStaff(requests = [], availableProjectAdults = {}) {
  const rows = Array.isArray(requests) ? requests : [];
  const waiting = rows.filter((request) => request.status === "submitted");
  const approved = rows.filter((request) => request.status === "approved").slice(0, 5);
  const past = rows.filter((request) => !["submitted", "approved"].includes(request.status)).slice(0, 20);
  return `
    <section class="workspace-project-requests" data-project-requests="staff" aria-labelledby="projectRequestsTitle">
      <details class="workspace-project-request-disclosure">
        <summary>
          <span>
            <small class="workspace-kicker">Student ideas</small>
            <strong id="projectRequestsTitle">${waiting.length} ${pluralize(waiting.length, "idea")} ${waiting.length === 1 ? "needs" : "need"} an answer</strong>
          </span>
          <span class="workspace-summary-badge">${waiting.length} waiting</span>
        </summary>
        <div class="workspace-project-request-content">
          <p>${waiting.length ? "Open one idea. Check the students. Then choose one answer." : "No project ideas are waiting right now."}</p>
          ${waiting.length ? `<div class="workspace-project-request-list">
            ${waiting.map((request, index) => renderStaffProjectRequest(request, index === 0, availableProjectAdults)).join("")}
          </div>` : ""}
      ${approved.length ? `
        <details class="workspace-project-request-history-panel">
          <summary>Recently approved projects (${approved.length})</summary>
          <p class="workspace-muted">Open one only if an approval must be undone.</p>
          <div class="workspace-project-request-list">
            ${approved.map(renderApprovedProjectRequest).join("")}
          </div>
        </details>
      ` : ""}
      ${past.length ? `
        <details class="workspace-project-request-history-panel">
          <summary>Past project ideas (${past.length})</summary>
          <div class="workspace-project-request-list">
            ${past.map((request) => `
              <article class="workspace-project-request-card workspace-project-approved-card">
                <div>
                  <strong>${escapeHtml(request.name || "Project idea")}</strong>
                  <p>${escapeHtml(`${projectRequestStatusLabel(request.status)} · ${request.submittedByName || "Student"}`)}</p>
                </div>
                ${request.staffFeedback ? `<p>${escapeHtml(request.staffFeedback)}</p>` : ""}
                ${renderProjectRequestHistory(request.history)}
              </article>
            `).join("")}
          </div>
        </details>
      ` : ""}
        </div>
      </details>
    </section>
  `;
}

function renderStaffProjectRequest(request = {}, open = false, availableProjectAdults = {}) {
  const members = Array.isArray(request.members) ? request.members : [];
  const preview = request.approvalPreview && typeof request.approvalPreview === "object" ? request.approvalPreview : {};
  const ready = Boolean(preview.approvalReady);
  return `
    <details class="workspace-project-request-card" data-project-request-id="${escapeHtml(request.requestId || "")}" ${open ? "open" : ""}>
      <summary>
        <span>
          <strong>${escapeHtml(request.name || "Project idea")}</strong>
          <small>${escapeHtml(`${request.submittedByName || "Student"} · ${members.length} ${pluralize(members.length, "student")}`)}</small>
        </span>
        <span class="workspace-status-pill submitted">Needs answer</span>
      </summary>
      ${renderProjectAdultSetup(request.adultSetup, request.adultAssignments, {
        requestId: request.requestId,
        programId: request.programId,
        canManage: true,
        availableProjectAdults,
      })}
      <form class="workspace-project-request-form" data-project-request-form="true">
        <input type="hidden" name="requestId" value="${escapeHtml(request.requestId || "")}">
        <div class="workspace-project-request-detail">
          <span>PROJECT GOAL</span>
          <p>${escapeHtml(request.summary || "No goal was added.")}</p>
        </div>
        <div class="workspace-project-request-detail">
          <span>STUDENTS</span>
          <div class="workspace-project-invitation-list">
            ${members.map((member) => `
              <div>
                <span>
                  <strong>${escapeHtml(member.displayName || "Student")}</strong>
                  <small>${escapeHtml(member.currentProjectName || "No current project")}</small>
                </span>
                <span class="workspace-status-pill ${escapeHtml(projectInvitationTone(member.invitationStatus))}">${escapeHtml(projectInvitationLabel(member.invitationStatus, member.role))}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="workspace-project-impact-preview" data-project-impact-preview="${escapeHtml(request.requestId || "")}">
          <div>
            <span>WHAT APPROVAL WILL DO</span>
            <strong>${escapeHtml(`${safeNumber(preview.studentCount)} ${pluralize(safeNumber(preview.studentCount), "student")} will share one project.`)}</strong>
            <p>${escapeHtml(`${safeNumber(preview.recordCount)} saved ${pluralize(safeNumber(preview.recordCount), "record")} will move with them.`)}</p>
          </div>
          ${ready
            ? `<p class="workspace-project-ready-note">Everyone joined. Review this preview, then confirm.</p>`
            : `<p class="workspace-project-wait-note">${escapeHtml(projectApprovalWaitMessage(preview))}</p>`}
          ${ready ? `
            <label class="workspace-project-impact-confirm">
              <input type="checkbox" name="confirmImpact" value="true">
              <span>I checked who and what will move.</span>
            </label>
          ` : ""}
          <details class="workspace-project-impact-breakdown">
            <summary>See exact record counts</summary>
            <ul>
              ${members.map((member) => `
                <li>
                  <strong>${escapeHtml(member.displayName || "Student")}</strong>
                  <span>${escapeHtml(projectMoveCountLine(member.moveCounts))}</span>
                </li>
              `).join("")}
            </ul>
          </details>
          <input type="hidden" name="approvalToken" value="${escapeHtml(preview.approvalToken || "")}">
        </div>
        <label>
          <span>Short note (required only when asking for changes)</span>
          <textarea name="feedback" maxlength="500" rows="2"></textarea>
        </label>
        <div class="workspace-project-request-actions">
          <button class="workspace-primary-button" type="submit" name="action" value="approve_request" ${ready ? "" : "disabled"}>Approve project</button>
          <button class="workspace-button workspace-button-secondary" type="submit" name="action" value="request_changes">Ask for changes</button>
          <button class="workspace-button workspace-button-secondary" type="submit" name="action" value="decline_request">Decline</button>
        </div>
        ${renderProjectRequestHistory(request.history)}
      </form>
    </details>
  `;
}

function renderApprovedProjectRequest(request = {}) {
  const members = Array.isArray(request.members) ? request.members : [];
  return `
    <article class="workspace-project-request-card workspace-project-approved-card">
      <div>
        <strong>${escapeHtml(request.name || "Project")}</strong>
        <p>${escapeHtml(members.map((member) => member.displayName).join(", ") || "Student")}</p>
      </div>
      <details>
        <summary>Undo this approval</summary>
        <form data-project-approval-undo-form="true">
          <input type="hidden" name="requestId" value="${escapeHtml(request.requestId || "")}">
          <label>
            <span>Why must this be undone?</span>
            <textarea name="changeReason" maxlength="500" rows="2" required></textarea>
          </label>
          <label class="workspace-project-impact-confirm">
            <input type="checkbox" name="confirmImpact" value="true" required>
            <span>Put each student and their saved work back where it was.</span>
          </label>
          <button class="workspace-button workspace-button-secondary" type="submit">Undo approval</button>
        </form>
      </details>
      ${renderProjectRequestHistory(request.history)}
    </article>
  `;
}

function renderProjectRequestHistory(history = []) {
  const rows = Array.isArray(history) ? history : [];
  if (!rows.length) return "";
  return `
    <details class="workspace-project-request-audit">
      <summary>See project idea history</summary>
      <ol>
        ${rows.map((event) => `
          <li>
            <strong>${escapeHtml(projectRequestEventLabel(event.action))}</strong>
            <span>${escapeHtml(event.actorName || "System")} · ${escapeHtml(formatDate(event.createdAt))}</span>
          </li>
        `).join("")}
      </ol>
    </details>
  `;
}

function projectInvitationLabel(status = "", role = "") {
  if (role === "lead") return "Project owner joined";
  if (status === "accepted") return "Joined";
  if (status === "declined") return "Said no";
  return "Waiting for answer";
}

function projectInvitationTone(status = "") {
  if (status === "accepted") return "approved";
  if (status === "declined") return "revision_requested";
  return "submitted";
}

function projectApprovalWaitMessage(preview = {}) {
  const declined = safeNumber(preview.declinedCount);
  const pending = safeNumber(preview.pendingCount);
  if (declined) return `${declined} ${pluralize(declined, "student")} said no. Ask the project owner to choose a different team.`;
  if (pending) return `Wait for ${pending} ${pluralize(pending, "student")} to answer the invite.`;
  const missingAdults = Array.isArray(preview.adultSetup?.missingRoles) ? preview.adultSetup.missingRoles : [];
  if (missingAdults.length) return "A Mentor and Program Teacher must both accept before you approve this project.";
  return "Check the project setup, then try again.";
}

function projectMoveCountLine(counts = {}) {
  const labels = [
    ["submissions", "work item"],
    ["progress", "progress note"],
    ["evidence", "proof link"],
    ["history", "history entry"],
    ["meetings", "mentor meeting"],
    ["presentations", "presentation"],
  ];
  const parts = labels
    .map(([key, label]) => {
      const count = safeNumber(counts?.[key]);
      return count ? `${count} ${pluralize(count, label)}` : "";
    })
    .filter(Boolean);
  return parts.join(" · ") || "No saved records";
}

function projectRequestEventLabel(action = "") {
  return ({
    submitted: "Idea sent",
    invitation_accepted: "Invite accepted",
    invitation_declined: "Invite declined",
    changes_requested: "Changes requested",
    declined: "Idea declined",
    approved: "Project approved",
    approval_undone: "Approval undone",
  })[action] || "Project idea updated";
}

function projectRequestStatusLabel(status = "") {
  return ({
    changes_requested: "Changes requested",
    declined: "Not approved",
    cancelled: "Approval undone",
  })[status] || "Closed";
}

function renderManageProjectForm(project = {}, availableStudents = []) {
  const members = Array.isArray(project.members) ? project.members : [];
  const allStudents = [...(Array.isArray(availableStudents) ? availableStudents : [])];
  members.forEach((member) => {
    if (!allStudents.some((student) => student.studentId === member.studentId)) {
      allStudents.push({ studentId: member.studentId, displayName: member.displayName });
    }
  });
  return `
    <details class="workspace-manage-project" data-manage-project-panel="true">
      <summary>Manage project and group</summary>
      <form class="workspace-create-project-form" data-manage-project-form="true">
        <input type="hidden" name="action" value="update_project">
        <input type="hidden" name="projectId" value="${escapeHtml(project.projectId || "")}">
        <input type="hidden" name="siteId" value="${escapeHtml(project.siteId || "")}">
        <label>
          <span>Project name</span>
          <input name="name" type="text" maxlength="120" value="${escapeHtml(project.name || "")}" required>
        </label>
        <label>
          <span>Short project goal</span>
          <textarea name="summary" maxlength="500" rows="3">${escapeHtml(project.summary || "")}</textarea>
        </label>
        <p>Choose one to five students. A student removed from this group will get a new individual project.</p>
        ${renderProjectTeamPicker(allStudents, members, { id: `manage-${project.projectId || "project"}` })}
        <button class="workspace-primary-button" type="submit">Save project</button>
      </form>
    </details>
  `;
}

function renderCreateProjectForm(projectBody = {}) {
  const students = Array.isArray(projectBody.availableStudents) ? projectBody.availableStudents : [];
  const adultOptions = projectBody.availableProjectAdults && typeof projectBody.availableProjectAdults === "object"
    ? projectBody.availableProjectAdults
    : {};
  const siteId = projectBody.siteId || selectedSiteQueryValue() || projectsFirstSiteId(projectBody.projects || []);
  if (!siteId) return "";
  return `
    <details class="workspace-card workspace-create-project" id="createProjectPanel" data-create-project-panel="true">
      <summary>Create or group a project</summary>
      <form id="createProjectForm" class="workspace-create-project-form" data-create-project-form="true">
        <input type="hidden" name="siteId" value="${escapeHtml(siteId)}">
        <label>
          <span>Project name</span>
          <input name="name" type="text" maxlength="120" required aria-describedby="createProjectNameHelp">
          <small id="createProjectNameHelp">Example: Community Garden</small>
        </label>
        <p>Choose one student for an individual project. Choose up to five students for a team project.</p>
        ${renderProjectTeamPicker(students, [], { id: "create" })}
        <label>
          <span>Short project goal (optional)</span>
          <textarea name="summary" maxlength="500" rows="3" aria-describedby="createProjectGoalHelp"></textarea>
          <small id="createProjectGoalHelp">What will the team make, improve, teach, or solve?</small>
        </label>
        <fieldset class="workspace-project-adult-picks">
          <legend>Required people</legend>
          <p>Choose both people now. The project cannot be created without them.</p>
          ${renderProjectAdultSelect("mentorUserId", "Mentor", adultOptions.mentors || [], "Choose a Mentor")}
          ${renderProjectAdultSelect("programTeacherUserId", "Program Teacher", adultOptions.programTeachers || [], "Choose a Program Teacher")}
        </fieldset>
        <button class="workspace-primary-button" type="submit">Create project</button>
        <small>Students can be moved from individual projects into this team project. Their saved work will stay in the system.</small>
      </form>
    </details>
  `;
}

function renderProjectTeamPicker(students = [], selectedStudents = [], options = {}) {
  const selected = uniqueProjectStudentsById(selectedStudents).slice(0, 5);
  const id = cleanDirectoryFilter(options.id || "team") || "team";
  return `
    <fieldset class="workspace-project-team-picker" data-project-team-picker="true" data-project-team-picker-id="${escapeHtml(id)}">
      <legend>Project team</legend>
      <label for="projectTeamSearch-${escapeHtml(id)}">Find a student by name or email</label>
      <div class="workspace-project-team-search-row">
        <input id="projectTeamSearch-${escapeHtml(id)}" type="search" list="projectStudentOptions" data-project-team-search="true" autocomplete="off" aria-describedby="projectTeamHelp-${escapeHtml(id)} projectTeamStatus-${escapeHtml(id)}">
        <button class="workspace-button workspace-button-secondary" type="button" data-project-team-add="true">Add student</button>
      </div>
      <small id="projectTeamHelp-${escapeHtml(id)}">Type a name or email, choose the student, then select Add student.</small>
      <p id="projectTeamStatus-${escapeHtml(id)}" class="workspace-project-team-status" data-project-team-status="true" aria-live="polite">${selected.length ? `${selected.length} ${pluralize(selected.length, "student")} selected.` : "No students selected yet."}</p>
      <ul class="workspace-project-team-selected" data-project-team-selected="true" aria-label="Selected students">
        ${selected.map(renderProjectTeamMember).join("")}
      </ul>
    </fieldset>
  `;
}

function renderProjectTeamMember(student = {}) {
  return `
    <li data-project-team-member="${escapeHtml(student.studentId || "")}">
      <input type="hidden" name="studentIds" value="${escapeHtml(student.studentId || "")}">
      <span>${escapeHtml(projectStudentOptionLabel(student))}</span>
      <button class="workspace-link-button workspace-link-button-small" type="button" data-project-team-remove="${escapeHtml(student.studentId || "")}" aria-label="Remove ${escapeHtml(student.displayName || "student")}">Remove</button>
    </li>
  `;
}

function renderProjectStudentDatalist(students = [], projects = []) {
  const members = (Array.isArray(projects) ? projects : []).flatMap((project) => Array.isArray(project.members) ? project.members : []);
  const rows = uniqueProjectStudentsById([...(Array.isArray(students) ? students : []), ...members]);
  return `
    <datalist id="projectStudentOptions">
      ${rows.map((student) => `<option value="${escapeHtml(projectStudentOptionLabel(student))}"></option>`).join("")}
    </datalist>
  `;
}

function renderProjectAdultSetup(setup = {}, assignments = [], options = {}) {
  const safeSetup = setup && typeof setup === "object" ? setup : {};
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const adultOptions = options.availableProjectAdults && typeof options.availableProjectAdults === "object"
    ? options.availableProjectAdults
    : {};
  const programId = cleanDirectoryFilter(options.programId || "");
  const targetFields = options.projectId
    ? `<input type="hidden" name="projectId" value="${escapeHtml(options.projectId)}">`
    : `<input type="hidden" name="requestId" value="${escapeHtml(options.requestId || "")}">`;
  const roles = [
    {
      key: "mentor",
      label: "Mentor",
      accepted: safeSetup.mentor || null,
      pending: safeSetup.pendingMentor || null,
      choices: Array.isArray(adultOptions.mentors) ? adultOptions.mentors : [],
    },
    {
      key: "program_teacher",
      label: "Program Teacher",
      accepted: safeSetup.programTeacher || null,
      pending: safeSetup.pendingProgramTeacher || null,
      choices: (Array.isArray(adultOptions.programTeachers) ? adultOptions.programTeachers : [])
        .filter((adult) => !programId || adult.programId === programId),
    },
  ];
  const canEdit = Boolean(options.canManage || options.canNominate);
  const ready = Boolean(safeSetup.ready);
  const pastChanges = safeAssignments
    .filter((assignment) => ["declined", "replaced", "cancelled"].includes(String(assignment?.status || "")))
    .slice(0, 8);
  return `
    <section class="workspace-project-adult-setup ${ready ? "is-ready" : "needs-action"}" data-project-adult-setup="${ready ? "ready" : "needed"}">
      <div class="workspace-project-adult-heading">
        <div>
          <p class="workspace-kicker">Required project people</p>
          <h3>${ready ? "Both people are confirmed" : "Finish project setup"}</h3>
          <p>${escapeHtml(safeSetup.nextStep || "Choose a Mentor and Program Teacher. You may keep working while they answer.")}</p>
        </div>
        <span class="workspace-status-pill ${ready ? "approved" : "revision_requested"}">${ready ? "Ready" : "Action needed"}</span>
      </div>
      <div class="workspace-project-adult-statuses">
        ${roles.map((role) => renderProjectAdultStatus(role, { ...options, targetFields })).join("")}
      </div>
      ${canEdit ? `
        <details class="workspace-project-adult-controls" ${ready ? "" : "open"}>
          <summary>${ready ? "Change a person" : "Choose the missing people"}</summary>
          <p class="workspace-muted">The person must accept before the project can move forward.</p>
          <div class="workspace-project-adult-forms">
            ${roles.map((role) => renderProjectAdultChoiceForm(role, { ...options, targetFields })).join("")}
          </div>
          ${renderExternalMentorInviteForm({ ...options, targetFields })}
        </details>
      ` : ""}
      ${options.canManage ? safeAssignments
        .filter((assignment) => assignment?.status === "pending" && assignment?.externalInvite)
        .map((assignment) => renderExternalMentorLinkForm(assignment, roles[0].choices, targetFields)).join("") : ""}
      ${pastChanges.length ? `
        <details class="workspace-project-adult-history">
          <summary>See past answers and changes (${pastChanges.length})</summary>
          <div class="workspace-project-adult-history-list">
            ${pastChanges.map(renderProjectAdultHistoryRow).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function renderProjectAdultHistoryRow(assignment = {}) {
  const role = assignment.adultRole === "program_teacher" ? "Program Teacher" : "Mentor";
  const status = String(assignment.status || "");
  const state = status === "declined"
    ? "Said no"
    : status === "replaced"
      ? "Replaced"
      : "Invite cancelled";
  const detail = assignment.staffReason
    || (status === "declined" ? "Choose and tag another person." : status === "replaced" ? "A different person now has this role." : "This invite is no longer active.");
  return `
    <article data-project-adult-history-state="${escapeHtml(status)}">
      <div>
        <span>${escapeHtml(role)}</span>
        <strong>${escapeHtml(assignment.displayName || "Past invite")}</strong>
        <small>${escapeHtml(detail)}</small>
      </div>
      <span class="workspace-status-pill ${escapeHtml(status === "declined" ? "revision_requested" : "configured")}">${escapeHtml(state)}</span>
    </article>
  `;
}

function renderProjectAdultStatus(role = {}, options = {}) {
  const accepted = role.accepted;
  const pending = role.pending;
  const assignment = accepted || pending;
  const state = accepted ? "Confirmed" : pending?.externalInvite ? "School setup needed" : pending ? "Waiting for answer" : "Still needed";
  const detail = accepted
    ? `${accepted.displayName || role.label} accepted.`
    : pending?.externalInvite
      ? `${pending.displayName || "This Mentor"} needs an account before they can answer.`
      : pending
        ? `${pending.displayName || role.label} has not answered yet.`
        : `Choose a ${role.label}.`;
  return `
    <article class="workspace-project-adult-status" data-project-adult-role="${escapeHtml(role.key)}" data-project-adult-state="${accepted ? "accepted" : pending ? "pending" : "missing"}">
      <span>${escapeHtml(role.label.toUpperCase())}</span>
      <strong>${escapeHtml(assignment?.displayName || state)}</strong>
      <small>${escapeHtml(detail)}</small>
      ${pending && (options.canManage || options.canNominate) ? `
        <form data-project-adult-cancel-form="true">
          ${options.targetFields}
          <input type="hidden" name="assignmentId" value="${escapeHtml(pending.assignmentId || "")}">
          <button class="workspace-link-button workspace-link-button-small" type="submit">${pending.externalInvite ? "Cancel request" : "Cancel invite"}</button>
        </form>
      ` : ""}
    </article>
  `;
}

function renderProjectAdultChoiceForm(role = {}, options = {}) {
  const choices = Array.isArray(role.choices) ? role.choices : [];
  if (!choices.length) {
    return `
      <div class="workspace-project-adult-empty">
        <strong>${escapeHtml(role.label)}</strong>
        <p>No eligible ${escapeHtml(role.label)} account is ready at this school. Ask a school admin for help.</p>
      </div>
    `;
  }
  const action = options.canManage ? "assign_adult" : "nominate_adult";
  return `
    <form data-project-adult-form="true">
      ${options.targetFields}
      <input type="hidden" name="action" value="${action}">
      <input type="hidden" name="adultRole" value="${escapeHtml(role.key)}">
      ${renderProjectAdultSelect("assigneeUserId", role.label, choices, `Choose a ${role.label}`)}
      ${options.canManage && role.accepted ? `
        <label>
          <span>Why are you changing this person?</span>
          <input name="reason" type="text" maxlength="300" required>
        </label>
      ` : ""}
      <button class="workspace-button ${options.canManage ? "workspace-button-secondary" : "workspace-button-primary"} workspace-button-small" type="submit">
        ${options.canManage ? `Confirm ${escapeHtml(role.label)}` : `Send ${escapeHtml(role.label)} invite`}
      </button>
    </form>
  `;
}

function renderProjectAdultSelect(name, label, choices = [], emptyLabel = "Choose a person") {
  const safeChoices = Array.isArray(choices) ? choices : [];
  const displayNameCounts = safeChoices.reduce((counts, adult) => {
    const key = String(adult?.displayName || "").trim().toLowerCase();
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}" required>
        <option value="">${escapeHtml(emptyLabel)}</option>
        ${safeChoices.map((adult) => {
          const displayName = String(adult?.displayName || adult?.email || "Adult").trim();
          const duplicateName = (displayNameCounts.get(displayName.toLowerCase()) || 0) > 1;
          const optionLabel = duplicateName && adult?.email ? `${displayName} — ${adult.email}` : displayName;
          return `<option value="${escapeHtml(adult?.userId || "")}">${escapeHtml(optionLabel)}</option>`;
        }).join("")}
      </select>
    </label>
  `;
}

function renderExternalMentorInviteForm(options = {}) {
  if (!options.canManage && !options.canNominate) return "";
  return `
    <details class="workspace-project-external-mentor">
      <summary>My Mentor is not in the list</summary>
      <form data-project-adult-form="true">
        ${options.targetFields}
        <input type="hidden" name="action" value="nominate_adult">
        <input type="hidden" name="adultRole" value="mentor">
        <label><span>Mentor name</span><input name="inviteName" type="text" maxlength="100" required></label>
        <label><span>Mentor email</span><input name="inviteEmail" type="email" maxlength="254" required></label>
        <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit">Ask school staff to add Mentor</button>
        <small>This saves a staff request. It does not email the Mentor. School staff must add and connect the account before the Mentor can accept.</small>
      </form>
    </details>
  `;
}

function renderExternalMentorLinkForm(assignment = {}, mentors = [], targetFields = "") {
  return `
    <form class="workspace-project-external-link" data-project-adult-link-form="true">
      ${targetFields}
      <input type="hidden" name="assignmentId" value="${escapeHtml(assignment.assignmentId || "")}">
      <strong>Connect requested Mentor: ${escapeHtml(assignment.displayName || "Mentor")}</strong>
      <p>Choose the Mentor account with this exact email: ${escapeHtml(assignment.email || "Email not shown")}</p>
      ${renderProjectAdultSelect("assigneeUserId", "Mentor account", mentors, "Choose the matching account")}
      <button class="workspace-button workspace-button-secondary workspace-button-small" type="submit">Connect account</button>
    </form>
  `;
}

function projectsFirstSiteId(projects = []) {
  return (Array.isArray(projects) ? projects : []).map((project) => cleanDirectoryFilter(project?.siteId || "")).find(Boolean) || "";
}

function projectStudentOptionLabel(student = {}) {
  const name = String(student.displayName || "Student").trim() || "Student";
  const details = [student.email, student.programName, cleanDemoSeedDisplay(student.cohortLabel, "")]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return details.length ? `${name} — ${details.join(" · ")}` : name;
}

function uniqueProjectStudentsById(students = []) {
  const seen = new Set();
  return (Array.isArray(students) ? students : []).filter((student) => {
    const studentId = cleanDirectoryFilter(student?.studentId || "");
    if (!studentId || seen.has(studentId)) return false;
    seen.add(studentId);
    return true;
  });
}

function uniqueProjectStudentOptions(students = []) {
  const seen = new Set();
  return (Array.isArray(students) ? students : []).filter((student) => {
    const key = projectStudentOptionLabel(student).toLocaleLowerCase();
    if (!student?.studentId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
