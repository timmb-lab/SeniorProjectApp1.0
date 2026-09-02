function renderOverviewSection() {
  const primaryRole = primaryRoleForUser(currentUser);
  if (["platform_admin", "global_admin", "admin", "site_admin"].includes(primaryRole)) return renderStaffWorkspaceTodaySection();
  if (primaryRole === "administration") return renderStaffWorkspaceTodaySection();
  if (primaryRole === "viewer") return renderStaffWorkspaceTodaySection();
  if (primaryRole === "program_teacher") return renderProgramTeacherDashboardSection();
  if (primaryRole === "mentor") return renderMentorDashboardSection();
  if (primaryRole === "student") return renderStudentSection();
  if (primaryRole === "misc_admin") return renderStaffReportsSection();
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
            <p>Review the progress, sent-work, and file records available to this account.</p>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Review and mentor work</strong>
            <p>Open assigned review or mentor sections when this account has access.</p>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Presentation and final-file readiness</strong>
            <p>Track presentation operations and closeout status where your role grants visibility.</p>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderStaffWorkspaceTodaySection() {
  const model = staffWorkspaceAttentionModel();
  if (model.roles?.has("program_teacher")) {
    return `
      <section class="workspace-workflow-landing workspace-staff-today workspace-program-teacher-simple-today" data-staff-workspace-today="true" data-staff-attention-model="true" aria-labelledby="programTeacherPlanTitle">
        ${renderProgramTeacherTodayPlan(model)}
        ${siteStudentDetailState?.sourceSection === "overview" ? renderSiteStudentDetailSurface({
          students: model.detailRows,
          scope: model.scope,
        }) : ""}
      </section>
    `;
  }
  const todayTitle = staffWorkspaceTitle(model);
  const primaryQueue = staffWorkspacePrimaryQueue(model);
  const rolePlanHtml = [
    model.roles?.has("mentor") ? renderMentorTodayPlan(model) : "",
    model.roles?.has("program_teacher") ? renderProgramTeacherTodayPlan(model) : "",
    model.roles?.has("viewer") ? renderViewerReadOnlyTodayPlan(model) : "",
    hasStaffAdminWorkspaceRole(model.roles) ? renderStaffAdminTodayPlan(model) : "",
  ].filter(Boolean).join("");
  const leadWithRolePlan = Boolean(rolePlanHtml);
  return `
    <section class="workspace-workflow-landing workspace-staff-today" data-staff-workspace-today="true" data-staff-attention-model="true" aria-labelledby="staffWorkspaceTodayTitle">
      ${leadWithRolePlan ? rolePlanHtml : ""}
      <div class="workspace-card-head workspace-staff-today-head">
        <div>
          <p class="workspace-kicker">Staff Workspace</p>
          <h2 id="staffWorkspaceTodayTitle">${escapeHtml(todayTitle)}</h2>
          <p class="workspace-muted">Start with one group, then open one student.</p>
        </div>
        <div class="workspace-row-actions">
          ${renderStaffPrimaryAction(model)}
        </div>
      </div>
      ${leadWithRolePlan ? "" : rolePlanHtml}
      ${renderStaffWorkspaceStartHere(model, primaryQueue)}
      ${renderStaffNoAssignmentState(model)}
      <div class="workspace-staff-attention-layout workspace-staff-flow-layout" data-staff-flow-layout="true">
        <div class="workspace-staff-attention-grid workspace-staff-primary-list" data-staff-primary-list="true" aria-label="Main staff worklist">
          ${renderStaffAttentionQueue(model, primaryQueue, { primary: true, limit: 6 })}
        </div>
      </div>
      ${renderStaffWorkspaceSecondaryDetails(model, primaryQueue)}
      ${siteStudentDetailState?.sourceSection === "overview" ? renderSiteStudentDetailSurface({
        students: model.detailRows,
        scope: model.scope,
      }) : ""}
    </section>
  `;
}

function hasStaffAdminWorkspaceRole(roles = roleIds(currentUser)) {
  return Boolean(roles?.has?.("administration") || roles?.has?.("site_admin") || hasGlobalAdminRole(roles));
}

function renderMentorTodayPlan(model = {}) {
  const rows = Array.isArray(model.rows) ? model.rows : [];
  const rowCountWithFlag = (flagKey) => rows.filter((row) => Array.isArray(row.attention) && row.attention.some((flag) => flag.key === flagKey)).length;
  const sections = availableSectionIdsForAnyMode();
  const total = safeNumber(model.counts?.total);
  const supportCount = safeNumber(model.counts?.needsHelp);
  const meetingCount = rowCountWithFlag("meeting");
  const presentationCount = rowCountWithFlag("presentation");
  const cards = [
    {
      id: "assigned-student",
      title: "Open the assigned-student focus",
      value: supportCount || total,
      detail: "Start with assigned students who have meeting, stale-progress, presentation, or teacher-note signals.",
      section: sections.has("mentorDashboard") ? "mentorDashboard" : "mentor",
      action: sections.has("mentorDashboard") ? "Open Mentor Dashboard" : "Open Students",
      tone: supportCount ? "mentor" : "ready",
    },
    {
      id: "student-list",
      title: "Open one assigned student",
      value: total,
      detail: "Use Assigned Students when you already know who needs meeting or proof context.",
      section: "mentor",
      action: "Open Students",
      tone: "mentor",
    },
    {
      id: "meeting-follow-up",
      title: "Check meeting follow-up",
      value: meetingCount,
      detail: "Use meeting signals to decide which assigned student needs the next check-in.",
      section: "mentor",
      action: meetingCount ? "Open meeting rows" : "Open Students",
      tone: meetingCount ? "warning" : "ready",
    },
    {
      id: "presentation",
      title: "Check presentation context",
      value: presentationCount,
      detail: "Confirm schedule, outline, and day-of status for students you support.",
      section: "presentation",
      action: presentationCount ? "Open presentation" : "Check presentation",
      tone: presentationCount ? "warning" : "quiet",
    },
    {
      id: "reports",
      title: "Use reports after check-ins",
      value: total,
      detail: "Use Reports only after the next assigned-student check is clear.",
      section: "staffReports",
      action: "Open Reports",
      tone: "quiet",
    },
  ];
  return `
    <section class="workspace-mentor-today-plan" data-mentor-today-plan="true" aria-labelledby="mentorTodayPlanTitle">
      <div class="workspace-mentor-today-plan-head">
        <div>
          <p class="workspace-kicker">Mentor plan</p>
          <h3 id="mentorTodayPlanTitle">Choose one assigned student first</h3>
          <p>Pick one assigned student, then use meetings, presentation details, or reports only when that student needs it.</p>
        </div>
        <span class="workspace-summary-badge">${escapeHtml(total)} assigned students</span>
      </div>
      ${renderTodayPrimaryStep(cards, sections, {
        label: "Assigned-student path",
        dataAttrs: 'data-mentor-primary-step="true"',
      })}
      <div class="workspace-mentor-today-plan-grid">
        ${todaySecondaryCards(cards, sections).map((card) => renderMentorTodayPlanCard(card, sections)).join("")}
      </div>
    </section>
  `;
}

function renderMentorTodayPlanCard(card = {}, sections = availableSectionIdsForAnyMode()) {
  const section = card.section || "";
  const actionHtml = section && sections.has(section)
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}" ${card.preset ? `data-section-preset="${escapeHtml(card.preset)}"` : ""}>${escapeHtml(card.action || "Open")}</button>`
    : `<span class="workspace-summary-badge">Assigned only</span>`;
  return `
    <article class="workspace-mentor-today-plan-card ${escapeHtml(card.tone || "quiet")}" data-mentor-today-plan-card="${escapeHtml(card.id || "plan")}">
      <div>
        <span>${escapeHtml(String(card.value ?? 0))}</span>
        <strong>${escapeHtml(card.title || "Mentor step")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      ${actionHtml}
    </article>
  `;
}

function renderStaffAdminTodayPlan(model = {}) {
  const sections = availableSectionIdsForAnyMode();
  const counts = model.counts || {};
  const reviewCount = safeNumber(counts.needsReview);
  const supportCount = safeNumber(counts.needsHelp);
  const setupCount = safeNumber(counts.missingSetup);
  const total = safeNumber(counts.total);
  const firstStudentPreset = supportCount ? "behind-students" : reviewCount ? "submitted-students" : "all-students";
  const cards = [
    {
      id: "student-group",
      title: "Choose one student group",
      value: reviewCount + supportCount || total,
      detail: "Start with visible students who need review, feedback, setup, or follow-up.",
      section: "students",
      preset: firstStudentPreset,
      action: "Open students",
      tone: reviewCount || supportCount ? "warning" : "ready",
    },
    {
      id: "review-work",
      title: "Review work",
      value: reviewCount,
      detail: "Open Review Work only when this role can see review work for the selected school.",
      section: "teacher",
      preset: "submitted",
      action: "Open reviews",
      tone: reviewCount ? "teacher" : "quiet",
    },
    {
      id: "setup-access",
      title: "Fix setup and access",
      value: setupCount,
      detail: "Use account, mentor, viewer, or final-file setup work after the daily student need is clear.",
      section: "adminUsers",
      action: "Open setup",
      tone: setupCount ? "danger" : "ready",
    },
    {
      id: "reports",
      title: "Use reports for a question",
      value: total,
      detail: "Open reports after you know which count you need to confirm or export.",
      section: "staffReports",
      action: "Open reports",
      tone: "ready",
    },
  ];
  return `
    <section class="workspace-staff-admin-plan" data-staff-admin-today-plan="true" aria-labelledby="staffAdminPlanTitle">
      <div class="workspace-staff-admin-plan-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(staffWorkspaceAdminPlanKicker(model.roles))}</p>
          <h3 id="staffAdminPlanTitle">Daily support before setup work</h3>
          <p>Open one student group first, then use reviews, setup, or reports only when that path answers the current problem.</p>
        </div>
        <span class="workspace-summary-badge">${escapeHtml(total)} visible students</span>
      </div>
      ${renderTodayPrimaryStep(cards, sections, {
        label: "Student support path",
        dataAttrs: 'data-staff-admin-primary-step="true"',
      })}
      <div class="workspace-staff-admin-plan-grid">
        ${todaySecondaryCards(cards, sections).map((card) => renderStaffAdminTodayPlanCard(card, sections)).join("")}
      </div>
    </section>
  `;
}

function staffWorkspaceAdminPlanKicker(roles = roleIds(currentUser)) {
  if (hasGlobalAdminRole(roles)) return "Global Admin plan";
  if (roles?.has?.("site_admin")) return "Site Admin plan";
  if (roles?.has?.("administration")) return "School Admin plan";
  return "Staff plan";
}

function renderStaffAdminTodayPlanCard(card = {}, sections = availableSectionIdsForAnyMode()) {
  const section = card.section || "";
  const actionHtml = section && sections.has(section)
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}" ${card.preset ? `data-section-preset="${escapeHtml(card.preset)}"` : ""}>${escapeHtml(card.action || "Open")}</button>`
    : `<span class="workspace-summary-badge">Use allowed screen</span>`;
  return `
    <article class="workspace-staff-admin-plan-card ${escapeHtml(card.tone || "quiet")}" data-staff-admin-plan-card="${escapeHtml(card.id || "plan")}">
      <div>
        <span>${escapeHtml(String(card.value ?? 0))}</span>
        <strong>${escapeHtml(card.title || "Staff step")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      ${actionHtml}
    </article>
  `;
}

function renderTodayPrimaryStep(cards = [], sections = availableSectionIdsForAnyMode(), options = {}) {
  const card = todayPrimaryCard(cards, sections);
  if (!card) return "";
  const canOpen = todayCardCanOpen(card, sections);
  const actionHtml = canOpen
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(card.section)}" ${card.preset ? `data-section-preset="${escapeHtml(card.preset)}"` : ""}>${escapeHtml(card.action || "Open")}</button>`
    : `<span class="workspace-summary-badge">${escapeHtml(options.unavailableLabel || "Summary only")}</span>`;
  return `
    <article class="workspace-today-primary-step ${escapeHtml(card.tone || "quiet")}" ${options.dataAttrs || ""} data-today-primary-step="${escapeHtml(card.id || "primary")}">
      <div>
        <span>${escapeHtml(options.label || "First path")}</span>
        <strong>${escapeHtml(card.title || "Open the next item")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      <small>${escapeHtml(String(card.value ?? ""))}</small>
      ${actionHtml}
    </article>
  `;
}

function todayPrimaryCard(cards = [], sections = availableSectionIdsForAnyMode()) {
  const safeCards = (Array.isArray(cards) ? cards : []).filter(Boolean);
  return safeCards.find((candidate) => todayCardCanOpen(candidate, sections) && safeNumber(candidate.value) > 0)
    || safeCards.find((candidate) => todayCardCanOpen(candidate, sections))
    || safeCards[0]
    || null;
}

function todaySecondaryCards(cards = [], sections = availableSectionIdsForAnyMode()) {
  const safeCards = (Array.isArray(cards) ? cards : []).filter(Boolean);
  const primary = todayPrimaryCard(safeCards, sections);
  return primary ? safeCards.filter((card) => card !== primary) : safeCards;
}

function todayCardCanOpen(card = {}, sections = availableSectionIdsForAnyMode()) {
  return Boolean(card?.section && sections.has(card.section));
}

function renderViewerReadOnlyTodayPlan(model = {}) {
  const rows = Array.isArray(model.rows) ? model.rows : [];
  const rowCountWithFlag = (flagKey) => rows.filter((row) => Array.isArray(row.attention) && row.attention.some((flag) => flag.key === flagKey)).length;
  const sections = availableSectionIdsForAnyMode();
  const reviewCount = safeNumber(model.counts?.needsReview) + rowCountWithFlag("revision");
  const supportCount = safeNumber(model.counts?.needsHelp);
  const total = safeNumber(model.counts?.total);
  const cards = [
    {
      id: "assigned-student",
      title: "Open one assigned student",
      value: total,
      detail: "Read the student's current status, files, feedback, presentation, and final-file context.",
      section: "students",
      preset: "all-students",
      action: "Open students",
      tone: "viewer",
    },
    {
      id: "review-follow-up",
      title: "Monitor teacher follow-up",
      value: reviewCount,
      detail: "Use review signals to know when a Program Teacher or site team should act.",
      section: "students",
      preset: reviewCount ? "submitted-students" : "all-students",
      action: reviewCount ? "Open review signals" : "Open roster",
      tone: reviewCount ? "warning" : "ready",
    },
    {
      id: "support-blockers",
      title: "Watch support blockers",
      value: supportCount,
      detail: "Look for stuck students, mentor gaps, presentation needs, or final-file blockers.",
      section: "students",
      preset: supportCount ? "behind-students" : "all-students",
      action: supportCount ? "Open support rows" : "Open roster",
      tone: supportCount ? "warning" : "ready",
    },
    {
      id: "boundary",
      title: "Share, do not edit",
      value: "Read-only",
      detail: "Use the student name and context in the approved staff channel. This role does not change records.",
      tone: "quiet",
    },
  ];
  return `
    <section class="workspace-viewer-readonly-plan" data-viewer-readonly-plan="true" aria-labelledby="viewerReadOnlyPlanTitle">
      <div class="workspace-viewer-readonly-plan-head">
        <div>
          <p class="workspace-kicker">Viewer plan</p>
          <h3 id="viewerReadOnlyPlanTitle">Read one record, then share outside the app</h3>
          <p>Viewer work stays useful by narrowing to assigned students and keeping every action read-only.</p>
        </div>
        <span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>
      </div>
      ${renderTodayPrimaryStep(cards, sections, {
        label: "Read-only path",
        dataAttrs: 'data-viewer-readonly-primary-step="true"',
        unavailableLabel: "No edit action",
      })}
      <div class="workspace-viewer-readonly-plan-grid">
        ${todaySecondaryCards(cards, sections).map((card) => renderViewerReadOnlyTodayPlanCard(card, sections)).join("")}
      </div>
    </section>
  `;
}

function renderViewerReadOnlyTodayPlanCard(card = {}, sections = availableSectionIdsForAnyMode()) {
  const section = card.section || "";
  const actionHtml = section && sections.has(section)
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}" ${card.preset ? `data-section-preset="${escapeHtml(card.preset)}"` : ""}>${escapeHtml(card.action || "Open")}</button>`
    : `<span class="workspace-summary-badge">No edit action</span>`;
  return `
    <article class="workspace-viewer-readonly-plan-card ${escapeHtml(card.tone || "quiet")}" data-viewer-readonly-plan-card="${escapeHtml(card.id || "plan")}">
      <div>
        <span>${escapeHtml(String(card.value ?? 0))}</span>
        <strong>${escapeHtml(card.title || "Viewer step")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      ${actionHtml}
    </article>
  `;
}

function renderProgramTeacherTodayPlan(model = {}) {
  const rows = Array.isArray(model.rows) ? model.rows : [];
  const rowCountWithFlag = (flagKey) => rows.filter((row) => Array.isArray(row.attention) && row.attention.some((flag) => flag.key === flagKey)).length;
  const sections = availableSectionIdsForAnyMode();
  const reviewCount = safeNumber(model.counts?.needsReview);
  const revisionCount = rowCountWithFlag("revision");
  const missingWorkCount = rowCountWithFlag("evidence");
  const supportCount = safeNumber(model.counts?.needsHelp);
  const cards = [
    {
      id: "review",
      title: "Review the next project",
      value: reviewCount,
      detail: "Read one project's work. Then accept it or ask for changes.",
      section: "teacher",
      preset: "submitted",
      action: "Start review",
      tone: "teacher",
    },
    {
      id: "revision",
      title: "Students fixing changes",
      value: revisionCount,
      detail: "Read revision feedback and wait for the next student submission before approving.",
      section: "teacher",
      preset: "revision-requested",
      action: "Read revisions",
      tone: "warning",
    },
    {
      id: "missing-work",
      title: "Missing proof",
      value: missingWorkCount,
      detail: "Find students who need the exact file or link before approval is possible.",
      section: "students",
      preset: "missing-evidence-students",
      action: "Find proof gaps",
      tone: "danger",
    },
    {
      id: "support",
      title: "Student support",
      value: supportCount,
      detail: "Use the roster after review work is clear or when a student is stuck.",
      section: "students",
      preset: supportCount ? "behind-students" : "all-students",
      action: supportCount ? "Help students" : "Open roster",
      tone: supportCount ? "warning" : "ready",
    },
  ];
  return `
    <section class="workspace-program-teacher-plan" data-program-teacher-today-plan="true" aria-labelledby="programTeacherPlanTitle">
      <div class="workspace-program-teacher-plan-head">
        <div>
          <p class="workspace-kicker">Do this first</p>
          <h2 id="programTeacherPlanTitle">Review one project</h2>
          <p>Open the next project. Read the work. Accept it or ask for changes.</p>
        </div>
        <span class="workspace-summary-badge">${escapeHtml(reviewCount)} waiting</span>
      </div>
      ${renderTodayPrimaryStep(cards, sections, {
        label: "One next step",
        dataAttrs: 'data-program-teacher-primary-step="true"',
      })}
      <details class="workspace-program-teacher-more" data-program-teacher-more="true">
        <summary>See other teacher tasks</summary>
        <div class="workspace-program-teacher-plan-grid">
          ${todaySecondaryCards(cards, sections).map((card) => renderProgramTeacherTodayPlanCard(card, sections)).join("")}
        </div>
      </details>
    </section>
  `;
}

function renderProgramTeacherTodayPlanCard(card = {}, sections = availableSectionIdsForAnyMode()) {
  const section = card.section || "";
  const actionHtml = section && sections.has(section)
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}" ${card.preset ? `data-section-preset="${escapeHtml(card.preset)}"` : ""}>${escapeHtml(card.action || "Open")}</button>`
    : `<span class="workspace-summary-badge">Summary only</span>`;
  return `
    <article class="workspace-program-teacher-plan-card ${escapeHtml(card.tone || "quiet")}" data-program-teacher-plan-card="${escapeHtml(card.id || "plan")}">
      <div>
        <span>${escapeHtml(String(card.value ?? 0))}</span>
        <strong>${escapeHtml(card.title || "Program Teacher step")}</strong>
        <p>${escapeHtml(card.detail || "")}</p>
      </div>
      ${actionHtml}
    </article>
  `;
}

function staffWorkspaceTitle(model = {}) {
  const roles = model.roles || roleIds(currentUser);
  if (hasGlobalAdminRole(roles)) return "Global Admin Workspace";
  if (roles.has("site_admin")) return "Site Admin Workspace";
  if (roles.has("administration")) return "School Admin Workspace";
  if (roles.has("program_teacher")) return "Program Teacher Workspace";
  if (roles.has("mentor")) return "Mentor Workspace";
  if (roles.has("viewer")) return "Viewer Workspace / Read-only";
  return "Staff Workspace";
}

function staffWorkspaceAttentionModel() {
  const roles = roleIds(currentUser);
  const directory = unwrap(currentData.siteStudents) || {};
  const programDashboard = unwrap(currentData.programTeacherDashboard) || {};
  const mentorResult = currentData.mentorDashboard?.ok
    ? currentData.mentorDashboard
    : currentData.mentorAssigned || currentData.mentorDashboard;
  const mentorDashboard = unwrap(mentorResult) || {};
  const directoryRows = staffWorkspaceRowsFromSiteStudents(directory);
  const programRows = roles.has("program_teacher") ? staffWorkspaceRowsFromProgramDashboard(programDashboard) : [];
  const mentorRows = roles.has("mentor") ? staffWorkspaceRowsFromMentorDashboard(mentorDashboard) : [];
  const rows = staffWorkspaceMergeRows([...directoryRows, ...programRows, ...mentorRows])
    .map((row) => {
      const attention = staffStudentAttentionFlags(row);
      return {
        ...row,
        attention,
        queueKeys: staffStudentQueueKeys(row, attention),
      };
    });
  const scope = roles.has("mentor")
    ? {
      role: "mentor",
      readOnly: false,
      siteName: mentorDashboard.scope?.siteName || directory.scope?.siteName || "Assigned students",
    }
    : directory.scope || {};
  const readOnly = Boolean(scope.readOnly || roles.has("viewer"));
  const detailRows = rows.map((row) => ({
    studentId: row.studentId,
    displayName: row.displayName,
    email: row.email,
  })).filter((row) => row.studentId);
  const queueCounts = staffWorkspaceQueueDefinitions().reduce((counts, queue) => {
    counts[queue.id] = staffWorkspaceQueueRows(rows, queue.id).length;
    return counts;
  }, {});
  const reviewFallback = adminConsoleReviewCount();
  const setupFallback = adminConsoleOperationsCount();
  const totalFallback = adminConsoleStudentCount();
  return {
    roles,
    rows,
    detailRows,
    scope,
    readOnly,
    scopeLabel: staffWorkspaceScopeLabel(roles, scope),
    counts: {
      needsReview: Math.max(safeNumber(queueCounts["needs-review"]), safeNumber(reviewFallback)),
      needsHelp: safeNumber(queueCounts["needs-help"]),
      missingSetup: Math.max(safeNumber(queueCounts["missing-setup"]), safeNumber(setupFallback)),
      recent: safeNumber(queueCounts.recent),
      total: Math.max(rows.length, safeNumber(totalFallback)),
    },
  };
}

function staffWorkspaceRowsFromSiteStudents(directory = {}) {
  const students = Array.isArray(directory.students) ? directory.students : [];
  return students.map((student) => ({
    studentId: student.studentId || "",
    displayName: student.displayName || student.studentName || "Student",
    email: student.email || "",
    siteName: student.siteName || directory.scope?.siteName || "",
    programName: studentProgramDisplay(student, ""),
    cohortName: studentCohortDisplay(student, ""),
    mentorName: student.mentorName || "",
    viewerName: student.viewerName || "",
    hasActiveMentor: student.hasActiveMentor,
    mentorMeetingStatus: student.mentorMeetingStatus || "",
    latestSubmissionStatus: student.latestSubmissionStatus || student.status || "",
    evidenceStatus: student.evidenceStatus || "",
    reviewStatus: student.reviewStatus || "",
    presentationStatus: student.presentationStatus || "",
    archiveStatus: student.archiveStatus || "",
    riskFlags: Array.isArray(student.riskFlags) ? student.riskFlags : [],
    progressStatus: student.progressStatus || "",
    progressPercent: student.progressPercent,
    lastActivityAt: student.lastActivityAt || student.latestSubmissionUpdatedAt || "",
    nextAction: student.nextAction || "",
    evidenceCount: student.evidenceCount,
    reviewCount: student.reviewCount,
    commentCount: student.commentCount,
    storyBucket: student.storyBucket || "",
    source: "students",
  }));
}

function staffWorkspaceRowsFromProgramDashboard(dashboard = {}) {
  const rows = [
    ...(Array.isArray(dashboard.needsReview) ? dashboard.needsReview : []),
    ...(Array.isArray(dashboard.needsAttention) ? dashboard.needsAttention : []),
    ...(Array.isArray(dashboard.students) ? dashboard.students : []),
  ];
  return rows.map((row) => ({
    studentId: row.studentId || "",
    displayName: row.displayName || row.studentName || "Student",
    email: row.email || "",
    siteName: row.siteName || dashboard.scope?.siteName || "",
    programName: studentProgramDisplay(row, ""),
    cohortName: studentCohortDisplay(row, ""),
    mentorName: row.mentorName || "",
    hasActiveMentor: row.hasActiveMentor,
    latestSubmissionStatus: row.latestSubmissionStatus || row.submissionStatus || row.status || "",
    evidenceStatus: row.evidenceStatus || (safeNumber(row.evidenceCount || row.proofCount) ? "attached" : ""),
    reviewStatus: row.reviewStatus || (normalizeStatus(row.status || row.submissionStatus) === "submitted" ? "needs_review" : ""),
    presentationStatus: row.presentationStatus || "",
    archiveStatus: row.archiveStatus || "",
    riskFlags: Array.isArray(row.riskFlags) ? row.riskFlags : [],
    progressStatus: row.progressStatus || "",
    progressPercent: row.progressPercent,
    lastActivityAt: row.updatedAt || row.submittedAt || row.lastActivityAt || "",
    nextAction: row.nextAction || row.decisionGuidance || "",
    evidenceCount: row.evidenceCount || row.proofCount,
    reviewCount: row.reviewCount,
    commentCount: row.commentCount,
    storyBucket: row.storyBucket || "",
    source: "programDashboard",
  }));
}

function staffWorkspaceRowsFromMentorDashboard(body = {}) {
  const assigned = Array.isArray(body.assignedStudents)
    ? prioritizeMentorDashboardStudents(body.assignedStudents, cleanMentorDashboardSort(mentorDashboardSort))
    : [];
  return assigned.map((row) => {
    const attention = Array.isArray(row.needsAttention) ? row.needsAttention : [];
    return {
      studentId: row.studentId || "",
      displayName: row.displayName || row.studentName || "Student",
      email: row.email || "",
      siteName: row.siteName || body.scope?.siteName || "",
      programName: studentProgramDisplay(row, ""),
      cohortName: studentCohortDisplay(row, ""),
      mentorName: currentUser?.displayName || "Assigned mentor",
      hasActiveMentor: true,
      mentorMeetingStatus: row.mentorMeetingStatus || "",
      latestSubmissionStatus: row.latestSubmissionStatus || row.submissionStatus || "",
      evidenceStatus: row.evidenceStatus || (safeNumber(row.evidenceCount) ? "attached" : ""),
      reviewStatus: row.reviewStatus || "",
      presentationStatus: row.presentationStatus || "",
      archiveStatus: row.archiveStatus || "",
      riskFlags: Array.isArray(row.riskFlags) ? row.riskFlags : attention,
      progressStatus: row.progressStatus || "",
      progressPercent: row.progressPercent,
      lastActivityAt: row.lastActivityAt || row.updatedAt || row.latestActivityAt || "",
      nextAction: mentorDashboardNextStep(row, attention),
      evidenceCount: row.evidenceCount,
      reviewCount: row.reviewCount,
      commentCount: row.commentCount,
      storyBucket: row.storyBucket || "",
      source: "mentorDashboard",
    };
  });
}

function staffWorkspaceMergeRows(rows = []) {
  const merged = new Map();
  for (const row of rows.filter(Boolean)) {
    const key = cleanDirectoryFilter(row.studentId || "") || `row:${String(row.displayName || "").toLowerCase()}:${String(row.email || "").toLowerCase()}`;
    if (!key) continue;
    const previous = merged.get(key) || {};
    merged.set(key, {
      ...previous,
      ...Object.fromEntries(Object.entries(row).filter(([, value]) => value !== "" && value !== null && value !== undefined)),
      riskFlags: Array.from(new Set([...(previous.riskFlags || []), ...(row.riskFlags || [])])),
    });
  }
  return Array.from(merged.values());
}

function staffStudentAttentionFlags(row = {}) {
  const flags = [];
  const riskFlags = Array.isArray(row.riskFlags) ? row.riskFlags.map(normalizeStatus) : [];
  const submission = normalizeStatus(row.latestSubmissionStatus || row.submissionStatus || row.status || "");
  const review = normalizeStatus(row.reviewStatus || "");
  const progress = normalizeStatus(row.progressStatus || "");
  const evidence = normalizeStatus(row.evidenceStatus || "");
  const meeting = normalizeStatus(row.mentorMeetingStatus || "");
  const presentation = normalizeStatus(row.presentationStatus || "");
  const archive = normalizeStatus(row.archiveStatus || "");
  const noMentor = row.hasActiveMentor === false || riskFlags.includes("no_mentor") || progress === "missing_mentor";

  if (submission === "submitted" || submission === "under_review" || review === "needs_review" || riskFlags.includes("awaiting_review")) {
    flags.push({ key: "review", queue: "needs-review", label: "Review waiting", detail: "Program Teacher feedback is the next staff move." });
  }
  if (submission === "revision_requested" || review === "needs_revision" || progress === "needs_revision" || riskFlags.includes("revision_requested")) {
    flags.push({ key: "revision", queue: "needs-help", label: "Revision support", detail: "Student needs help closing a requested revision." });
  }
  if (riskFlags.includes("high") || riskFlags.includes("stale") || normalizeStatus(row.riskLevel || "") === "high") {
    flags.push({ key: "risk", queue: "needs-help", label: "Needs help", detail: "Student may need a check before routine rows." });
  }
  if (noMentor) {
    flags.push({ key: "mentor", queue: "missing-setup", label: "No mentor", detail: "Mentor coverage needs to be confirmed." });
  }
  if (evidence === "missing" || progress === "missing_evidence") {
    flags.push({ key: "evidence", queue: "missing-setup", label: "Evidence missing", detail: "Evidence is missing for the current work." });
  }
  if (meeting === "not_recorded" || meeting === "missed" || meeting === "makeup_required" || progress === "mentor_meeting_follow_up") {
    flags.push({ key: "meeting", queue: "needs-help", label: "Meeting follow-up", detail: "Mentor meeting status needs a check." });
  }
  if (["pending", "missing", "outline_pending", "outline_revision_needed", "attention_required"].includes(presentation)) {
    flags.push({ key: "presentation", queue: "needs-help", label: "Presentation readiness", detail: "Presentation readiness needs staff attention." });
  }
  if (["failed", "expired", "provider_unavailable"].includes(archive)) {
    flags.push({ key: "archive", queue: "missing-setup", label: "Final-file help", detail: "Final-file status needs follow-up." });
  }
  return flags;
}

function staffStudentQueueKeys(row = {}, attention = []) {
  const keys = Array.from(new Set(attention.map((flag) => flag.queue).filter(Boolean)));
  if (staffStudentIsRecent(row)) keys.push("recent");
  if (!keys.length) keys.push("on-track");
  return Array.from(new Set(keys));
}

function staffStudentIsRecent(row = {}) {
  const timestamp = Date.parse(row.lastActivityAt || row.updatedAt || row.submittedAt || "");
  if (!Number.isFinite(timestamp)) return false;
  const now = Date.now();
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  return timestamp > now - thirtyDays || now < timestamp;
}

function staffWorkspaceQueueDefinitions() {
  return [
    { id: "needs-review", title: "Needs Review", detail: "Open submitted work and feedback decisions first.", empty: "No submitted work is waiting for this account." },
    { id: "needs-help", title: "Needs Help", detail: "Changes, meetings, or presentation checks.", empty: "No student needs extra help right now." },
    { id: "missing-setup", title: "Missing Setup", detail: "Mentor coverage, missing work, and final-file follow-up.", empty: "No setup work is visible for this account." },
    { id: "recent", title: "Recently Updated", detail: "Fresh activity worth a quick scan.", empty: "No recent student activity is visible." },
    { id: "on-track", title: "On Track", detail: "Regular monitoring rows after urgent groups are clear.", empty: "No routine rows are visible yet." },
  ];
}

function staffWorkspaceQueueRows(rows = [], queueId = "") {
  return rows.filter((row) => Array.isArray(row.queueKeys) && row.queueKeys.includes(queueId));
}

function staffWorkspaceScopeLabel(roles, scope = {}) {
  if (roles.has("mentor")) return "Assigned mentor students";
  if (roles.has("program_teacher")) return cleanDemoSeedDisplay(scope.programName, scope.siteName || "Assigned program");
  if (roles.has("viewer")) return scope.siteName ? `${scope.siteName} read-only` : "Assigned read-only students";
  if (hasGlobalAdminRole(roles)) return "All accessible schools";
  return scope.siteName || "Assigned school";
}

function renderStaffSummaryMetric(label, value, detail, key) {
  return `
    <article class="workspace-staff-summary-metric" data-staff-summary-metric="${escapeHtml(key)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(safeNumber(value))}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function renderStaffCompactSummaryStrip(model = {}) {
  const counts = model.counts || {};
  const items = [
    { label: "Needs Review", value: counts.needsReview, detail: "Waiting for feedback", key: "needs-review" },
    { label: "Needs Help", value: counts.needsHelp, detail: "Changes, meetings, or presentation", key: "needs-help" },
    { label: "Missing Setup", value: counts.missingSetup, detail: "Mentor, work, or final files", key: "missing-setup" },
    { label: "Recently Updated", value: counts.recent, detail: "Latest activity you can see", key: "recent" },
  ].filter((item) => safeNumber(item.value) > 0);
  items.push({ label: "Visible Students", value: counts.total, detail: model.scopeLabel, key: "total" });
  return `
    <div class="workspace-staff-summary-strip workspace-compact-summary-strip" data-teacher-first-component="CompactSummaryStrip" data-staff-workspace-summary="true">
      ${items.map((item) => renderStaffSummaryMetric(item.label, item.value, item.detail, item.key)).join("")}
    </div>
  `;
}

function staffWorkspacePrimaryQueue(model = {}) {
  const definitions = staffWorkspaceQueueDefinitions();
  const urgentQueue = definitions.find((queue) => queue.id !== "on-track" && staffWorkspaceQueueRows(model.rows || [], queue.id).length > 0);
  if (urgentQueue) return urgentQueue;
  return definitions.find((queue) => staffWorkspaceQueueRows(model.rows || [], queue.id).length > 0)
    || definitions.find((queue) => queue.id === "on-track")
    || definitions[0];
}

function staffWorkspaceStartActionForQueue(model = {}, queue = {}) {
  const actions = staffWorkspaceStartHereActions(model);
  const queueToAction = {
    "needs-review": "review-work",
    "needs-help": "needs-changes",
    "missing-setup": "missing-work",
    recent: "all-students",
    "on-track": "all-students",
  };
  const preferredActionId = queueToAction[queue.id] || "all-students";
  return actions.find((action) => action.id === preferredActionId)
    || actions.find((action) => action.alwaysShow)
    || actions[0]
    || null;
}

function staffWorkspaceStartLabelForQueue(queue = {}, action = {}) {
  if (!action?.alwaysShow || queue.id === "on-track") return action?.label || queue.title || "Open students";
  return {
    "needs-review": "Open students to review",
    "needs-help": "Open students needing help",
    "missing-setup": "Open missing setup",
    recent: "Open recent students",
  }[queue.id] || action.label || queue.title || "Open students";
}

function staffWorkspaceStartHereActions(model = {}) {
  const counts = model.counts || {};
  const sections = availableSectionIdsForAnyMode();
  const actions = [
    {
      id: "review-work",
      label: "Review work waiting for you",
      detail: "Start with student work that needs feedback.",
      count: counts.needsReview,
      section: "teacher",
      preset: "submitted",
      action: "Review",
      visible: sections.has("teacher"),
    },
    {
      id: "needs-changes",
      label: "Help students who need changes",
      detail: "Open students who may need a quick teacher check.",
      count: counts.needsHelp,
      section: "students",
      preset: "revision-students",
      action: "Help student",
      visible: sections.has("students"),
    },
    {
      id: "missing-work",
      label: "Check missing work",
      detail: "Find students who still need to add reviewable work.",
      count: counts.missingSetup,
      section: "students",
      preset: "missing-evidence-students",
      action: "Find students",
      visible: sections.has("students"),
    },
    {
      id: "all-students",
      label: "Open all students",
      detail: "Use the roster when you need a specific student.",
      count: counts.total,
      section: sections.has("students") ? "students" : "mentor",
      preset: "all-students",
      action: "Open",
      visible: sections.has("students") || sections.has("mentor"),
      alwaysShow: true,
    },
  ];
  return actions.filter((action) => action.visible && (action.alwaysShow || safeNumber(action.count) > 0)).slice(0, 4);
}

function renderStaffWorkspaceStartHere(model = {}, primaryQueue = staffWorkspacePrimaryQueue(model)) {
  const action = staffWorkspaceStartActionForQueue(model, primaryQueue);
  const primaryRows = staffWorkspaceQueueRows(model.rows || [], primaryQueue.id);
  const caughtUp = !staffWorkspaceQueueDefinitions().some((queue) => queue.id !== "on-track" && staffWorkspaceQueueRows(model.rows || [], queue.id).length > 0);
  const title = caughtUp ? "You are caught up for now" : `Start with ${primaryQueue.title.toLowerCase()}`;
  const detail = caughtUp
    ? "No urgent group is open in this view. Use Students when you need a specific student."
    : "Open one student from the list below before changing filters or checking reports.";
  return `
    <section class="workspace-staff-start-here" data-teacher-first-component="StartHerePanel" data-staff-start-here="true" aria-labelledby="staffStartHereTitle">
      <div class="workspace-staff-start-here-head">
        <div>
          <p class="workspace-kicker">Start Here</p>
          <h3 id="staffStartHereTitle">${escapeHtml(title)}</h3>
          <p>${escapeHtml(detail)}</p>
        </div>
      </div>
      ${action ? `
        <div class="workspace-staff-start-here-list">
          <article class="workspace-staff-start-here-row workspace-staff-start-here-row-primary" data-staff-start-action="${escapeHtml(action.id)}" data-staff-primary-start-action="true">
            <div>
              <strong>${escapeHtml(staffWorkspaceStartLabelForQueue(primaryQueue, action))}</strong>
              <p>${escapeHtml(primaryQueue.detail || action.detail)}</p>
            </div>
            <span>${escapeHtml(primaryRows.length || safeNumber(action.count))}</span>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(action.section)}" ${action.preset ? `data-section-preset="${escapeHtml(action.preset)}"` : ""}>
              ${escapeHtml(action.action)}
            </button>
          </article>
        </div>
      ` : ""}
    </section>
  `;
}

function renderStaffPrimaryAction(model = {}) {
  const focus = model.rows?.find((row) => row.studentId && row.queueKeys?.some((key) => key !== "on-track"))
    || model.rows?.find((row) => row.studentId);
  if (focus?.studentId) {
    return `
      <button class="workspace-button workspace-button-primary" type="button" data-staff-primary-action="open-student" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(focus.studentId)}" data-student-detail-source-section="overview">
        Open Student
      </button>
    `;
  }
  if (availableSectionIdsForAnyMode().has("students")) {
    return `<button class="workspace-button workspace-button-primary" type="button" data-section="students" data-section-preset="all-students">Open Students</button>`;
  }
  if (availableSectionIdsForAnyMode().has("mentor")) {
    return `<button class="workspace-button workspace-button-primary" type="button" data-section="mentor">Open Students</button>`;
  }
  return `<span class="workspace-summary-badge">No student rows yet</span>`;
}

function renderStaffNoAssignmentState(model = {}) {
  if (!model.roles?.has("mentor") || safeNumber(model.counts?.total) > 0) return "";
  return `
    <section class="workspace-card workspace-empty" data-workspace-state="no-active-assignment">
      <strong>No students are assigned to you yet</strong>
      <span>Mentor students</span>
      <p>No active students are assigned to this account yet.</p>
      ${renderProblemState({
        reason: "No active students are assigned to this account yet.",
        owner: "Project coordinator or site administrator.",
        nextAction: "Confirm the assignment, then refresh this workspace.",
      })}
    </section>
  `;
}

function renderStaffAttentionQueue(model = {}, queue = {}, options = {}) {
  const rows = staffWorkspaceQueueRows(model.rows || [], queue.id);
  if (!rows.length && queue.id !== "on-track") return "";
  const limit = Math.max(1, safeNumber(options.limit || 4));
  const visibleRows = rows.slice(0, limit);
  return `
    <section class="workspace-staff-queue ${options.primary ? "workspace-staff-queue-primary" : "workspace-staff-queue-secondary"}" data-staff-attention-queue="${escapeHtml(queue.id)}" ${options.primary ? `data-staff-primary-queue="${escapeHtml(queue.id)}"` : `data-staff-secondary-queue="${escapeHtml(queue.id)}"`} aria-labelledby="staffQueue-${escapeHtml(queue.id)}">
      <div class="workspace-staff-queue-head">
        <div>
          <h3 id="staffQueue-${escapeHtml(queue.id)}">${escapeHtml(queue.title)}</h3>
          <p>${escapeHtml(queue.detail)}</p>
        </div>
        <span class="workspace-summary-badge">${escapeHtml(rows.length)}</span>
      </div>
      <div class="workspace-staff-queue-list">
        ${rows.length
          ? visibleRows.map((row) => renderStaffQueueStudentRow(row, queue.id, model)).join("")
          : `<article class="workspace-staff-queue-empty"><strong>${escapeHtml(queue.empty)}</strong></article>`}
      </div>
      ${rows.length > limit ? `<p class="workspace-muted">${escapeHtml(rows.length - limit)} more ${escapeHtml(queue.title.toLowerCase())} rows remain in Students.</p>` : ""}
    </section>
  `;
}

function renderStaffWorkspaceSecondaryDetails(model = {}, primaryQueue = staffWorkspacePrimaryQueue(model)) {
  const otherQueues = staffWorkspaceQueueDefinitions()
    .filter((queue) => queue.id !== primaryQueue.id)
    .filter((queue) => staffWorkspaceQueueRows(model.rows || [], queue.id).length > 0)
    .map((queue) => renderStaffAttentionQueue(model, queue, { limit: 2 }))
    .join("");
  const bodyHtml = `
    <div class="workspace-staff-secondary-flow" data-staff-secondary-details="true">
      ${renderStaffCompactSummaryStrip(model)}
      ${renderStaffTodayScopePanel(model)}
      ${otherQueues ? `<div class="workspace-staff-secondary-queues" aria-label="Other student groups">${otherQueues}</div>` : ""}
    </div>
  `;
  return renderTeacherFirstDisclosure({
    id: "staff-counts-and-groups",
    summary: "Show counts and other groups",
    bodyHtml,
    className: "workspace-staff-secondary-disclosure",
    dataAttrs: 'data-staff-secondary-flow="true"',
  });
}

function renderStaffQueueStudentRow(row = {}, queueId = "", model = {}) {
  const flags = (Array.isArray(row.attention) ? row.attention : []).filter((flag) => flag.queue === queueId);
  const primaryFlag = flags[0] || row.attention?.[0] || { label: queueId === "on-track" ? "On track" : "Attention", detail: row.nextAction || "Open student detail for context." };
  const supportingText = row.nextAction || primaryFlag.detail || "Open student detail for the current status.";
  const studentName = row.displayName || row.studentName || "Student";
  const context = studentProgramCohortDisplay(row, model.scopeLabel || "Assigned program or cohort");
  const casePlan = studentDirectoryRowGuidance(row, Boolean(model.readOnly));
  const moreMenu = row.studentId ? renderTeacherFirstMoreActions({
    id: `staff-${row.studentId || queueId}`,
    actions: [renderViewAsStudentAction(row.studentId, studentName, { sourceSection: "overview" })],
    dataAttrs: 'data-staff-row-more-menu="true"',
    ariaLabel: `More actions for ${studentName}`,
  }) : "";
  return `
    <article class="workspace-staff-student-row" data-staff-queue-student-row="true" data-staff-queue-kind="${escapeHtml(queueId)}" data-student-id="${escapeHtml(row.studentId || "")}">
      <div>
        <strong>${escapeHtml(studentName)}</strong>
        <p class="workspace-muted">${escapeHtml(context)}</p>
        <p>${escapeHtml(supportingText)}</p>
        <div class="workspace-owner-action workspace-owner-action-inline" data-staff-row-case-plan="true" data-staff-row-helper="${escapeHtml(casePlan.owner)}">
          <span>Who can help: ${escapeHtml(casePlan.owner)}</span>
          <small>Next step: ${escapeHtml(casePlan.nextAction)}</small>
        </div>
      </div>
      <div class="workspace-staff-student-signals">
        <span class="workspace-story-chip">${escapeHtml(primaryFlag.label)}</span>
        ${statusPill(row.latestSubmissionStatus || row.reviewStatus || row.progressStatus || "configured")}
        ${row.mentorName ? `<span class="workspace-site-context-badge">Mentor: ${escapeHtml(row.mentorName)}</span>` : ""}
        ${model.readOnly ? `<span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>` : ""}
      </div>
      <div class="workspace-row-actions">
        ${row.studentId ? `
          <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(row.studentId)}" data-student-detail-source-section="overview">
            Open Student
          </button>
          ${moreMenu}
        ` : `<span class="workspace-summary-badge">No detail route</span>`}
      </div>
    </article>
  `;
}

function renderStaffTodayScopePanel(model = {}) {
  const reportsButton = hasStaffReportsSection(model.roles) && availableSectionIdsForAnyMode().has("staffReports")
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="staffReports">Open Reports</button>`
    : `<span class="workspace-summary-badge">Reports unavailable</span>`;
  const studentsButton = availableSectionIdsForAnyMode().has("students")
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="all-students">Open Students</button>`
    : "";
  return `
    <aside class="workspace-staff-scope-panel" aria-label="Current staff view">
      <p class="workspace-kicker">Current view</p>
      <h3>${escapeHtml(model.scopeLabel)}</h3>
      <p>Start with the first populated group, open one student, then use Students or Reports only when the urgent rows are clear.</p>
      <div class="workspace-chip-row">
        <span class="workspace-site-context-badge">${escapeHtml(roleLabel(primaryRoleForUser(currentUser)))}</span>
        ${model.readOnly ? `<span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>` : statusPill("configured")}
      </div>
      <div class="workspace-row-actions">
        ${studentsButton}
        ${reportsButton}
      </div>
    </aside>
  `;
}

function renderStaffReportQuestionAction(question = {}) {
  const section = question.section || "";
  const canOpen = section && availableSectionIdsForAnyMode().has(section);
  if (!canOpen) return `<span class="workspace-summary-badge">Summary only</span>`;
  const preset = question.preset ? ` data-section-preset="${escapeHtml(question.preset)}"` : "";
  return `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}"${preset}>${escapeHtml(question.actionLabel || "Open")}</button>`;
}

function renderStaffReportQuestionRow(question = {}, index = 0) {
  return `
    <article class="workspace-admin-report-choice-row ${index === 0 ? "primary" : ""}" data-staff-report-question="${escapeHtml(question.id || "question")}">
      <div>
        <span>${escapeHtml(question.kicker || "Report question")}</span>
        <strong>${escapeHtml(question.title || "Choose one report question")}</strong>
        <p>${escapeHtml(question.detail || "Use this summary to decide the next step.")}</p>
        <small>${escapeHtml(question.valueLabel || "No value available")}</small>
      </div>
      <div class="workspace-admin-report-choice-actions">
        ${renderStaffReportQuestionAction(question)}
      </div>
    </article>
  `;
}

function renderStaffReportQuestionFlow(questions = []) {
  const safeQuestions = (Array.isArray(questions) ? questions : []).filter(Boolean);
  if (!safeQuestions.length) return "";
  return `
    <section class="workspace-admin-report-choice-flow workspace-staff-report-question-flow" data-staff-report-question-flow="true" aria-labelledby="staffReportQuestionTitle">
      <div class="workspace-admin-report-choice-head">
        <div>
          <p class="workspace-kicker">Start here</p>
          <h3 id="staffReportQuestionTitle">Answer one report question</h3>
          <p>Pick the question that matches the current problem before scanning charts or exports.</p>
        </div>
      </div>
      <div class="workspace-admin-report-choice-list">
        ${safeQuestions.map(renderStaffReportQuestionRow).join("")}
      </div>
    </section>
  `;
}

function staffReportAttentionCount() {
  const operations = unwrap(currentData.operationsReadiness) || {};
  const siteDashboard = unwrap(currentData.siteDashboard) || {};
  const summary = {
    ...(siteDashboard.summary || {}),
    ...(operations.summary || {}),
  };
  const explicitCounts = [
    summary.needsAttention,
    summary.attentionRequired,
    summary.studentsNeedingAttention,
    summary.studentsBehind,
    summary.studentsNoMentor,
    summary.noMentor,
    summary.missingMentor,
    summary.missingEvidence,
    summary.archiveFailed,
    summary.exportsFailed,
  ].map((value) => safeNumber(value)).filter((value) => value > 0);
  if (explicitCounts.length) return explicitCounts[0];
  const rows = [
    ...(Array.isArray(operations.rows) ? operations.rows : []),
    ...(Array.isArray(siteDashboard.needsAttention) ? siteDashboard.needsAttention : []),
  ];
  return rows.filter((row) => {
    const flags = [
      row?.queue,
      row?.status,
      row?.readiness,
      row?.state,
      row?.progressStatus,
      ...(Array.isArray(row?.riskFlags) ? row.riskFlags : []),
      ...(Array.isArray(row?.flags) ? row.flags : []),
    ].map((value) => normalizeStatus(value)).join(" ");
    return /\b(needs|attention|required|blocked|missing|failed|revision|behind)\b/.test(flags);
  }).length;
}

function staffReportQuestions({ roles, visibleStudents, reviewCount, setupSignalCount, report }) {
  const canOpenStudents = hasSiteStudentDirectoryRole(roles);
  const canOpenReviewQueue = hasSiteReviewQueueRole(roles);
  const canOpenOperations = hasSiteOperationsRole(roles);
  const mentorCoverage = report?.mentorCoveragePercent;
  const mentorDenominator = safeNumber(report?.mentorCoverageDenominator || visibleStudents);
  const onTrackCount = Math.max(safeNumber(visibleStudents) - safeNumber(reviewCount) - safeNumber(setupSignalCount), 0);
  return [
    {
      id: "students-needing-attention",
      kicker: "Students needing attention",
      title: safeNumber(setupSignalCount) ? `${safeNumber(setupSignalCount)} signals to check` : "No attention group is visible",
      detail: "Use the worklist to confirm which presentation, mentor, final-file, or setup signals need action.",
      valueLabel: `${safeNumber(setupSignalCount)} visible attention ${pluralize(setupSignalCount, "signal")}`,
      section: canOpenOperations ? "operations" : canOpenStudents ? "students" : "",
      preset: canOpenOperations ? "needs-attention" : "behind-students",
      actionLabel: canOpenOperations ? "Open worklist" : "Open students",
    },
    {
      id: "work-waiting-for-review",
      kicker: "Work waiting for review",
      title: safeNumber(reviewCount) ? `${safeNumber(reviewCount)} review ${pluralize(reviewCount, "item")}` : "No review queue is waiting",
      detail: "Submitted or revision work should be handled in Review Work before report browsing.",
      valueLabel: `${safeNumber(reviewCount)} waiting ${pluralize(reviewCount, "row")}`,
      section: canOpenReviewQueue ? "teacher" : "",
      preset: "submitted",
      actionLabel: "Open review queue",
    },
    {
      id: "mentor-coverage",
      kicker: "Mentor coverage",
      title: `Mentor coverage is ${percentLabel(mentorCoverage)}`,
      detail: mentorDenominator
        ? `${mentorDenominator} visible ${pluralize(mentorDenominator, "student")} counted for coverage.`
        : "Coverage percentage appears after student and mentor data load.",
      valueLabel: "Private mentor notes are not shown in reports.",
      section: canOpenStudents ? "students" : "",
      preset: "missing-mentors",
      actionLabel: "Find missing mentors",
    },
    {
      id: "on-track",
      kicker: "On track",
      title: `${onTrackCount} look clear right now`,
      detail: "This is a simple visible-count check, not a promise that every final requirement is complete.",
      valueLabel: "Unknown states are not counted as complete.",
      section: canOpenStudents ? "students" : "",
      preset: "on-track-students",
      actionLabel: "View on track",
    },
  ];
}

function renderStaffReportsSection() {
  const roles = roleIds(currentUser);
  const visibleStudents = adminConsoleStudentCount();
  const reviewCount = adminConsoleReviewCount();
  const setupSignalCount = staffReportAttentionCount();
  const operationsModel = adminConsoleOperationsModel();
  const report = operationsModel.report || {};
  const reportMax = Math.max(visibleStudents, reviewCount, setupSignalCount, 1);
  const reportRows = [
    {
      id: "visible-students",
      label: "Visible students",
      value: visibleStudents,
      max: reportMax,
      detail: "Students available to this role.",
      tone: "student",
      dataAttrs: `data-staff-report-row="visible-students"`,
    },
    {
      id: "needs-review",
      label: "Needs Review",
      value: reviewCount,
      max: reportMax,
      detail: "Submitted or revision rows waiting for staff follow-up.",
      tone: reviewCount ? "warning" : "ready",
      dataAttrs: `data-staff-report-row="needs-review"`,
    },
    {
      id: "missing-work-setup",
      label: "Missing work/setup",
      value: setupSignalCount,
      max: reportMax,
      detail: "Presentation, mentor, or final-file follow-up in this view.",
      tone: setupSignalCount ? "warning" : "ready",
      dataAttrs: `data-staff-report-row="missing-work-setup"`,
    },
    {
      id: "project-adults",
      label: "Projects with both adults",
      value: safeNumber(report.projectsAdultsReady),
      max: Math.max(safeNumber(report.visibleProjectCount), 1),
      valueLabel: safeNumber(report.visibleProjectCount) ? `${safeNumber(report.projectsAdultsReady)} of ${safeNumber(report.visibleProjectCount)}` : "No projects",
      detail: safeNumber(report.projectsMissingRequiredAdult)
        ? `${safeNumber(report.projectsMissingRequiredAdult)} projects need a confirmed Mentor, Program Teacher, or both.`
        : "Every visible project has both required adults.",
      tone: safeNumber(report.projectsMissingRequiredAdult) ? "danger" : "ready",
      dataAttrs: `data-staff-report-row="project-adults"`,
    },
    {
      id: "mentor-coverage",
      label: "Mentor coverage",
      value: report.mentorCoveragePercent,
      max: 100,
      valueLabel: percentLabel(report.mentorCoveragePercent),
      detail: `Students counted: ${safeNumber(report.mentorCoverageDenominator || visibleStudents)} visible students.`,
      tone: "mentor",
      dataAttrs: `data-staff-report-row="mentor-coverage"`,
    },
  ];
  return `
    <section class="workspace-command-center workspace-staff-reports" data-staff-reports="true" aria-labelledby="staffReportsTitle">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Reports</p>
          <h1 id="staffReportsTitle">Student Progress Reports</h1>
          <p>Use simple counts to spot review, setup, and readiness work inside this account's allowed area.</p>
        </div>
      </div>
      ${renderStaffReportQuestionFlow(staffReportQuestions({ roles, visibleStudents, reviewCount, setupSignalCount, report }))}
      <div class="workspace-admin-console-metrics" data-staff-report-metrics="true">
        ${renderMetricTile("Visible Students", adminConsoleStudentCount(), "Rows available to this role", "student", hasSiteStudentDirectoryRole(roles) ? "students" : "", { label: "Open Students" })}
        ${renderMetricTile("Needs Review", adminConsoleReviewCount(), "Submitted or review-related rows", safeNumber(adminConsoleReviewCount()) ? "warning" : "teacher", hasSiteReviewQueueRole(roles) ? "teacher" : "", { label: "Open Reviews", preset: "submitted" })}
        ${renderMetricTile("Setup Work", adminConsoleOperationsCount(), "Presentation, mentor, or final-file follow-up", safeNumber(adminConsoleOperationsCount()) ? "warning" : "mentor", hasSiteOperationsRole(roles) ? "operations" : "", { label: "Open Worklist", preset: "needs-attention" })}
      </div>
      ${renderReportBars({
        id: "staffReportBarTitle",
        kicker: "Staff reports",
        title: "Visible students by status",
        detail: "The bars show class work and setup work. Each bar also has a number. Work with no status stays separate.",
        rows: reportRows,
        className: "workspace-staff-report-summary",
        dataAttrs: `data-staff-report-bars="true"`,
      })}
      ${renderReportExportPanel({
        id: "staff",
        title: "CSV downloads",
        detail: "Downloads use only rows visible to this role and leave out passwords, private notes, and file links.",
        exports: staffReportExportSpecs(),
      })}
      ${availableSectionIdsForAnyMode().has("readiness") ? renderReadinessSection() : ""}
    </section>
  `;
}

function renderAdminUsersSectionForView(view = "manage-students") {
  const fallbackView = cleanAdminPeopleView(view) || "manage-students";
  const currentView = cleanAdminPeopleView(adminPeopleView);
  const currentViewSection = currentView ? adminSectionForPeopleView(currentView, activeSection) : "";
  adminPeopleView = currentView && currentViewSection === activeSection ? currentView : fallbackView;
  if (activeWorkspaceMode === "admin") {
    if (activeSection === "adminPeople") return renderAdminConsolePeopleSection();
    if (activeSection === "adminStudents") return renderAdminConsoleStudentsSection();
    if (activeSection === "adminAssignments") return renderAdminConsoleAssignmentsSection();
    if (activeSection === "adminImports") return renderAdminConsoleImportsSection();
  }
  return renderAdminUsersSection();
}

function renderAdminReportsSection() {
  const capabilities = adminConsoleCapabilitiesFor(currentUser);
  const model = adminConsoleOperationsModel(capabilities);
  const exports = adminReportExportSpecs(model);
  return `
    <section class="workspace-admin-reports" data-admin-reports="true" aria-labelledby="adminReportsTitle">
      ${renderAdminSectionHeader({
        kicker: "Reports",
        title: "Choose one report",
        id: "adminReportsTitle",
        detail: "Start with one report, then open setup work only when the numbers point to it.",
        badge: "Report-safe fields",
      })}
      ${renderAdminReportChoiceFlow(model, capabilities, exports)}
      <details class="workspace-admin-supporting-disclosure workspace-admin-report-supporting" data-admin-report-supporting="numbers">
        <summary>
          <span class="workspace-kicker">Supporting details</span>
          <strong>Show access, setup, and coverage numbers</strong>
        </summary>
        ${renderAdminReportScopeNotice(model.report, capabilities)}
        <div class="workspace-admin-console-metrics workspace-admin-report-metrics" data-admin-report-metrics="true">
          ${renderAdminConsoleMetrics(capabilities)}
        </div>
        ${renderAdminSetupReadinessPanel(model.setupReadiness)}
        ${renderAdminOperationalReportSummary(model.report)}
      </details>
      ${availableSectionIdsForAnyMode().has("readiness") ? renderReadinessSection() : ""}
    </section>
  `;
}

function renderAdminReportChoiceFlow(model = adminConsoleOperationsModel(), capabilities = adminConsoleCapabilitiesFor(currentUser), exports = []) {
  const safeExports = (Array.isArray(exports) ? exports : []).filter(Boolean);
  return `
    <section class="workspace-admin-report-choice-flow" data-admin-report-choice-flow="true" data-report-export-panel="admin" aria-labelledby="adminReportChoiceTitle">
      <div class="workspace-admin-report-choice-head">
        <div>
          <p class="workspace-kicker">Report path</p>
          <h3 id="adminReportChoiceTitle">Pick the report you need now</h3>
          <p>Use roster completeness first. If a number needs follow-up, move to setup issues or the linked setup item.</p>
        </div>
      </div>
      <p class="workspace-report-confidence-note" data-report-confidence-note="admin">
        Percentages say which students are counted, zero-row exports stay disabled, and unknown states are not counted as complete.
      </p>
      <div class="workspace-admin-report-choice-list" data-admin-report-choice-list="true">
        ${safeExports.map((spec, index) => renderAdminReportChoiceRow(spec, index, model, capabilities)).join("")}
      </div>
    </section>
  `;
}

function renderAdminReportChoiceRow(spec = {}, index = 0, model = adminConsoleOperationsModel(), capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const id = spec.id || "report";
  const title = spec.title || "Report export";
  const count = Array.isArray(spec.rows) ? spec.rows.length : 0;
  const isPrimary = index === 0;
  const setupIssues = safeNumber(model?.report?.setupIssueCount) + safeNumber(model?.report?.importIssueCount);
  const helper = id === "admin-roster-completeness"
    ? `${safeNumber(model?.report?.loadedStudentRows || model?.report?.studentTotal)} students visible to this admin role.`
    : id === "admin-setup-issues"
      ? `${setupIssues} setup or import issue${setupIssues === 1 ? "" : "s"} need review.`
      : "Appears after a CSV preview or import result exists.";
  const linkedAction = id === "admin-setup-issues" && availableSectionIdsForAnyMode().has("overview")
    ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="overview">View setup issues</button>`
    : "";
  return `
    <article class="workspace-admin-report-choice-row ${isPrimary ? "primary" : ""}" data-admin-report-choice="${escapeHtml(id)}" data-report-export-card="${escapeHtml(id)}">
      <div>
        <span>${escapeHtml(isPrimary ? "Start here" : "Then choose")}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(spec.detail || "Download this report CSV.")}</p>
        <small>${escapeHtml(helper)}</small>
        <small data-report-export-boundary="${escapeHtml(id)}">${escapeHtml(reportExportBoundaryText(spec, "Download includes only records visible to this account."))}</small>
      </div>
      <div class="workspace-admin-report-choice-actions">
        <span class="workspace-summary-badge">${escapeHtml(String(count))} record${count === 1 ? "" : "s"}</span>
        ${renderAdminReportChoiceAction(spec, isPrimary)}
        ${linkedAction}
      </div>
    </article>
  `;
}

function renderAdminReportChoiceAction(spec = {}, primary = false) {
  const headers = Array.isArray(spec.headers) ? spec.headers : [];
  const rows = Array.isArray(spec.rows) ? spec.rows : [];
  const hasRows = headers.length && rows.length > 0;
  const filename = spec.filename || `${spec.id || "report"}.csv`;
  const label = primary ? "Download roster CSV" : "Download CSV";
  if (!hasRows) {
    return `<span class="workspace-summary-badge" data-report-export-empty="${escapeHtml(spec.id || "report")}">Awaiting report data</span>`;
  }
  return `<a class="workspace-button ${primary ? "workspace-button-primary" : "workspace-button-secondary"} workspace-button-small" data-report-export="${escapeHtml(spec.id || "report")}" href="${escapeHtml(csvDataHref(csvFromRows(headers, rows)))}" download="${escapeHtml(filename)}" aria-label="${escapeHtml(`Download ${spec.title || "report"} CSV`)}">${escapeHtml(label)}</a>`;
}

function renderAdminReportScopeNotice(report = {}, capabilities = adminConsoleCapabilitiesFor(currentUser)) {
  const rows = [
    ["Current access", capabilities.scope?.label || "Allowed records", capabilities.scope?.detail || "Only records this account can already load."],
    ["Students counted", safeNumber(report.studentTotal || report.loadedStudentRows), `${safeNumber(report.loadedStudentRows)} roster row${safeNumber(report.loadedStudentRows) === 1 ? "" : "s"} visible here.`],
    ["Export safety", "Report-safe", "Downloads leave out passwords, private notes, file links, and rows outside this account's access."],
    ["Unknowns", "Not complete", "Unknown states are not counted as complete in coverage percentages."],
  ];
  return `
    <section class="workspace-admin-report-scope" data-admin-report-scope-notice="true" aria-label="Report access and export safety">
      ${rows.map(([label, value, detail]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
          <small>${escapeHtml(detail)}</small>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAdminConsolePeopleSection() {
  const roles = roleIds(currentUser);
  if (!canUseUsersAccess(roles)) return renderPermissionDeniedSection("People", "staff account setup records");
  const canCreateGlobal = hasGlobalAdminRole(roles);
  const roleChoices = adminRoleChoicesForRoles(roles);
  const options = {
    canCreateGlobal,
    localAccountsOnly: !authConfigForUi().googleSsoEnabled,
  };
  const screens = peopleManagementScreensForRoles(roles);
  adminPeopleView = ["add-staff", "manage-staff"].includes(cleanAdminPeopleView(adminPeopleView)) ? adminPeopleView : "manage-staff";
  return `
    <section class="workspace-admin-operations-section" data-admin-operations-section="people" aria-labelledby="adminPeopleTitle">
      ${renderAdminSectionHeader({
        kicker: "People",
        title: "Staff Directory",
        id: "adminPeopleTitle",
        detail: "Add people who help with projects. Give each person the right school job. You will only see schools you can manage.",
        badge: options.canCreateGlobal ? "Global people access" : "School people access",
      })}
      ${renderPeopleManagementNav(screens.filter((screen) => screen.group === "Staff" || screen.id === "assignments"), adminPeopleView)}
      ${renderPeopleManagementScopeSummary(roleChoices, options)}
      ${renderPeopleManagementScreen(adminPeopleView, roleChoices, options)}
      ${renderAdminImportResult()}
    </section>
  `;
}

function renderAdminConsoleStudentsSection() {
  const roles = roleIds(currentUser);
  if (!canUseUsersAccess(roles)) return renderPermissionDeniedSection("Students", "student roster setup records");
  const roleChoices = adminRoleChoicesForRoles(roles);
  const options = {
    canCreateGlobal: hasGlobalAdminRole(roles),
    localAccountsOnly: !authConfigForUi().googleSsoEnabled,
  };
  const screens = peopleManagementScreensForRoles(roles);
  adminPeopleView = ["add-student", "manage-students"].includes(cleanAdminPeopleView(adminPeopleView)) ? adminPeopleView : "manage-students";
  return `
    <section class="workspace-admin-operations-section" data-admin-operations-section="students" aria-labelledby="adminStudentsTitle">
      ${renderAdminSectionHeader({
        kicker: "Students",
        title: "Student Roster Setup",
        id: "adminStudentsTitle",
        detail: "Review roster profile, school/program placement, mentor and viewer signals, then add one student when needed.",
        badge: "Roster setup",
      })}
      ${renderPeopleManagementNav(screens.filter((screen) => screen.group === "Students" || screen.id === "assignments"), adminPeopleView)}
      ${renderPeopleManagementScopeSummary(roleChoices, options)}
      ${renderPeopleManagementScreen(adminPeopleView, roleChoices, options)}
      ${renderAdminImportResult()}
    </section>
  `;
}

function renderAdminConsoleAssignmentsSection() {
  const roles = roleIds(currentUser);
  if (!canUseUsersAccess(roles)) return renderPermissionDeniedSection("Assignments", "student and staff assignment records");
  const coverage = adminAssignmentCoverageModel();
  adminPeopleView = "assignments";
  return `
    <section class="workspace-admin-operations-section" data-admin-operations-section="assignments" aria-labelledby="adminAssignmentsTitle">
      ${renderAdminSectionHeader({
        kicker: "Assignments",
        title: "Coverage and Access Assignments",
        id: "adminAssignmentsTitle",
        detail: "Put missing coverage first, then use the assignment forms already allowed for this role.",
        badge: "Limited forms",
      })}
      ${renderAdminAssignmentCoverageSummary(coverage)}
      ${renderAdminAssignmentFlowPanel(coverage)}
      ${renderAssignmentsPeopleScreen()}
      ${renderAdminAccessAssignmentPanel()}
    </section>
  `;
}

function renderAdminConsoleImportsSection() {
  const roles = roleIds(currentUser);
  if (!canUseUsersAccess(roles)) return renderPermissionDeniedSection("Imports", "student and staff import records");
  const view = cleanAdminPeopleView(adminPeopleView);
  adminPeopleView = view === "import-staff" ? "import-staff" : "import-students";
  return `
    <section class="workspace-admin-operations-section" data-admin-operations-section="imports" aria-labelledby="adminImportsTitle">
      ${renderAdminSectionHeader({
        kicker: "Imports",
        title: "Student and Staff Imports",
        id: "adminImportsTitle",
        detail: "Download the supported CSV template, preview validation, fix errors, then confirm only valid rows.",
        badge: "CSV preview",
      })}
      ${renderAdminImportTemplateShelf()}
      ${renderPeopleManagementNav(peopleManagementScreensForRoles(roles).filter((screen) => screen.group === "Imports"), adminPeopleView)}
      ${renderCsvImportScreen(adminPeopleView === "import-staff" ? "staff" : "students", {
        canCreateGlobal: hasGlobalAdminRole(roles),
        localAccountsOnly: !authConfigForUi().googleSsoEnabled,
      })}
      ${renderAdminImportResult()}
    </section>
  `;
}

function renderAdminSectionHeader({ kicker = "Admin Console", title = "Section", id = "", detail = "", badge = "" } = {}) {
  const primary = adminPrimaryActionForSection(activeSection);
  const actions = adminActionsForSection(activeSection);
  return renderAdminPageHeader({ kicker, title, id, detail, badge, primary, actions });
}

function renderAdminPageHeader({ kicker = "Admin Console", title = "Section", id = "", detail = "", badge = "", primary = null, actions = [] } = {}) {
  return `
    <div class="workspace-admin-section-header workspace-admin-page-header" data-admin-page-header="true" data-admin-page-section="${escapeHtml(activeSection || "overview")}">
      <div>
        <p class="workspace-kicker">${escapeHtml(kicker)}</p>
        <h2 ${id ? `id="${escapeHtml(id)}"` : ""}>${escapeHtml(title)}</h2>
        <p>${escapeHtml(detail)}</p>
      </div>
      <div class="workspace-admin-page-header-actions">
        ${badge ? `<span class="workspace-site-context-badge">${escapeHtml(badge)}</span>` : ""}
        ${primary ? renderAdminActionControl(primary, "workspace-button workspace-button-primary workspace-button-small", "primary") : ""}
        ${renderAdminActionMenu({ id: activeSection || "overview", actions, label: adminActionMenuLabelForSection(activeSection) })}
      </div>
    </div>
  `;
}

function adminActionMenuLabelForSection(section = activeSection) {
  const map = {
    adminPeople: "More people actions",
    adminStudents: "More student actions",
    adminAssignments: "More assignment actions",
    adminImports: "More import actions",
    adminReports: "More report actions",
    audit: "More audit actions",
    programs: "More program actions",
  };
  return map[section] || "More actions";
}

function adminPrimaryActionForSection(section = activeSection) {
  const sections = availableSectionIdsForAnyMode();
  const map = {
    adminPeople: sections.has("adminPeople") ? { label: "Add staff", section: "adminPeople", peopleView: "add-staff" } : null,
    adminStudents: sections.has("adminStudents") ? { label: "Add student", section: "adminStudents", peopleView: "add-student" } : null,
    adminAssignments: { label: "Assign mentor", section: "adminAssignments" },
    adminImports: { label: "Upload CSV", section: "adminImports", peopleView: "import-students" },
    adminReports: { label: "View setup issues", section: "overview" },
    audit: { label: "Review access", section: "audit" },
    programs: { label: "Manage program", section: "programs" },
  };
  return map[section] || null;
}

function adminActionsForSection(section = activeSection) {
  const sections = availableSectionIdsForAnyMode();
  const canImports = sections.has("adminImports");
  const canReports = sections.has("adminReports");
  const canAudit = sections.has("audit");
  const canPrograms = sections.has("programs");
  const studentTemplate = csvTemplateForKind("students");
  const staffTemplate = csvTemplateForKind("staff");
  const studentTemplateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(studentTemplate)}`;
  const staffTemplateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(staffTemplate)}`;
  const common = [
    canReports ? { label: "View reports", section: "adminReports" } : null,
    canAudit ? { label: "Review access", section: "audit" } : null,
  ];
  const map = {
    adminPeople: [
      canImports ? { label: "Import staff", section: "adminImports", peopleView: "import-staff" } : null,
      { label: "Download staff template", href: staffTemplateHref, download: "capstone-staff-template.csv" },
      ...common,
    ],
    adminStudents: [
      canImports ? { label: "Import students", section: "adminImports", peopleView: "import-students" } : null,
      { label: "Download student template", href: studentTemplateHref, download: "capstone-students-template.csv" },
      sections.has("adminAssignments") ? { label: "Assign mentor", section: "adminAssignments" } : null,
      ...common,
    ],
    adminAssignments: [
      canReports ? { label: "Review missing coverage", section: "adminReports" } : null,
      canAudit ? { label: "View access review", section: "audit" } : null,
      canPrograms ? { label: "Manage programs", section: "programs" } : null,
    ],
    adminImports: [
      { label: "Download student template", href: studentTemplateHref, download: "capstone-students-template.csv" },
      { label: "Download staff template", href: staffTemplateHref, download: "capstone-staff-template.csv" },
      { label: "Import students", section: "adminImports", peopleView: "import-students" },
      { label: "Import staff", section: "adminImports", peopleView: "import-staff" },
      ...common,
    ],
    adminReports: [
      { label: "Review roster summary", section: "adminReports" },
      { label: "Review setup issues", section: "overview" },
      canAudit ? { label: "View audit", section: "audit" } : null,
    ],
    audit: [
      canReports ? { label: "View reports", section: "adminReports" } : null,
      sections.has("adminPeople") ? { label: "Open People", section: "adminPeople" } : null,
      sections.has("adminAssignments") ? { label: "Open Assignments", section: "adminAssignments" } : null,
    ],
    programs: [
      sections.has("adminAssignments") ? { label: "View program teacher gaps", section: "adminAssignments" } : null,
      canReports ? { label: "Review programs summary", section: "adminReports" } : null,
      canAudit ? { label: "View audit", section: "audit" } : null,
    ],
  };
  return (map[section] || common).filter(Boolean);
}

function renderAdminActionMenu({ id = "admin", actions = [], label = "Actions" } = {}) {
  const safeActions = (Array.isArray(actions) ? actions : []).filter(Boolean);
  if (!safeActions.length) return "";
  const adminActionMenuLabel = `${label} menu for ${workspaceSectionTitle(id)}`;
  return `
    <details class="workspace-admin-action-menu" data-admin-action-menu="${escapeHtml(id)}">
      <summary aria-label="${escapeHtml(adminActionMenuLabel)}">${escapeHtml(label)}</summary>
      <div class="workspace-admin-action-menu-body">
        ${safeActions.map((action) => renderAdminActionControl(action, "workspace-admin-action-menu-item", "menu")).join("")}
      </div>
    </details>
  `;
}

function renderAdminActionControl(action = {}, className = "workspace-button workspace-button-secondary", location = "menu") {
  if (action.html) return action.html;
  const label = action.label || "Open";
  const dataAttrs = [
    `data-admin-action-menu-item="${escapeHtml(location)}"`,
    action.id ? `data-admin-action-id="${escapeHtml(action.id)}"` : "",
    action.peopleView ? `data-admin-people-view="${escapeHtml(action.peopleView)}"` : "",
    action.focus ? `data-users-access-focus="${escapeHtml(action.focus)}"` : "",
  ].filter(Boolean).join(" ");
  if (action.href) {
    return `<a class="${escapeHtml(className)}" href="${escapeHtml(action.href)}" ${action.download ? `download="${escapeHtml(action.download)}"` : ""} ${dataAttrs}>${escapeHtml(label)}</a>`;
  }
  if (action.section) {
    return `<button class="${escapeHtml(className)}" type="button" data-section="${escapeHtml(action.section)}" ${dataAttrs}>${escapeHtml(label)}</button>`;
  }
  if (action.peopleView) {
    return `<button class="${escapeHtml(className)}" type="button" data-people-view-target="${escapeHtml(action.peopleView)}" ${dataAttrs}>${escapeHtml(label)}</button>`;
  }
  return `<span class="workspace-summary-badge" ${dataAttrs}>${escapeHtml(label)}</span>`;
}

function renderAdminFilterBar({ id = "admin", searchLabel = "Search", filters = [], moreFilters = [], resetAction = null } = {}) {
  const safeFilters = (Array.isArray(filters) ? filters : []).filter(Boolean);
  const safeMoreFilters = (Array.isArray(moreFilters) ? moreFilters : []).filter(Boolean);
  return `
    <form class="workspace-filter-bar workspace-admin-filter-bar" data-admin-filter-bar="${escapeHtml(id)}" aria-label="${escapeHtml(`${searchLabel} filters`)}">
      <label class="workspace-label">
        ${escapeHtml(searchLabel)}
        <input class="workspace-input" name="search" type="search" autocomplete="off" aria-label="${escapeHtml(searchLabel)}">
      </label>
      ${safeFilters.map(renderAdminFilterSelect).join("")}
      ${safeMoreFilters.length ? `
        <details class="workspace-advanced-filters workspace-admin-advanced-filters" data-admin-advanced-filters="${escapeHtml(id)}">
          <summary>More filters</summary>
          <div class="workspace-admin-more-filter-grid">
            ${safeMoreFilters.map(renderAdminFilterSelect).join("")}
          </div>
        </details>
      ` : ""}
      <div class="workspace-filter-actions">
        ${resetAction ? renderAdminActionControl(resetAction, "workspace-button workspace-button-secondary workspace-button-small", "filter-reset") : `<button class="workspace-button workspace-button-secondary workspace-button-small" type="reset">Reset</button>`}
      </div>
    </form>
  `;
}

function renderAdminFilterSelect(filter = {}) {
  const options = Array.isArray(filter.options) ? filter.options : [];
  return `
    <label class="workspace-label">
      ${escapeHtml(filter.label || "Filter")}
      <select class="workspace-select" name="${escapeHtml(filter.name || "filter")}" data-admin-filter-select="${escapeHtml(filter.name || "filter")}">
        ${options.map((option) => `<option value="${escapeHtml(option.value ?? option)}">${escapeHtml(option.label ?? option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderAdminMoreMenu({ id = "row", actions = [], label = "More", contextLabel = "" } = {}) {
  const safeActions = (Array.isArray(actions) ? actions : []).filter(Boolean);
  if (!safeActions.length) return "";
  const safeContext = String(contextLabel || id || "row").replace(/[-_]+/g, " ").trim();
  const adminMoreMenuLabel = `${label} actions for ${safeContext || "row"}`;
  return `
    <details class="workspace-row-more-menu workspace-admin-more-menu" data-admin-more-menu="${escapeHtml(id)}">
      <summary aria-label="${escapeHtml(adminMoreMenuLabel)}">${escapeHtml(label)}</summary>
      <div class="workspace-row-more-menu-body">
        ${safeActions.map((action) => renderAdminActionControl(action, "workspace-link-button workspace-link-button-small", "row-more")).join("")}
      </div>
    </details>
  `;
}

function adminAssignmentCoverageModel() {
  const access = unwrap(currentData.accessAssignments) || {};
  const users = access.users || {};
  const assignments = access.assignments || {};
  const students = Array.isArray(users.students) ? users.students : [];
  const programs = Array.isArray(access.programs) ? access.programs : [];
  const mentorAssignments = Array.isArray(assignments.mentorStudent) ? assignments.mentorStudent : [];
  const viewerAssignments = Array.isArray(assignments.viewerStudent) ? assignments.viewerStudent : [];
  const programTeacherAssignments = Array.isArray(assignments.programTeacherProgram) ? assignments.programTeacherProgram : [];
  const studentIdsWithMentors = new Set(mentorAssignments.map((row) => row.studentId).filter(Boolean));
  const studentIdsWithViewers = new Set(viewerAssignments.map((row) => row.studentId).filter(Boolean));
  const programsWithTeachers = new Set(programTeacherAssignments.map((row) => row.programId).filter(Boolean));
  const missingMentorStudents = students.filter((student) => !studentIdsWithMentors.has(student.userId || student.studentId || student.id || "") && !student.mentorUserId && !student.mentorName);
  const missingViewerStudents = students.filter((student) => !studentIdsWithViewers.has(student.userId || student.studentId || student.id || "") && !student.viewerUserId && !student.viewerName);
  const missingTeacherPrograms = programs.filter((program) => !programsWithTeachers.has(program.programId || program.id || ""));
  return {
    assignments,
    mentorAssignments,
    viewerAssignments,
    programTeacherAssignments,
    missingMentorStudents,
    missingViewerStudents,
    missingTeacherPrograms,
  };
}

function renderAdminAssignmentCoverageSummary(model = adminAssignmentCoverageModel()) {
  const assignments = model.assignments || {};
  const mentorAssignments = Array.isArray(model.mentorAssignments) ? model.mentorAssignments : [];
  const viewerAssignments = Array.isArray(model.viewerAssignments) ? model.viewerAssignments : [];
  const programTeacherAssignments = Array.isArray(model.programTeacherAssignments) ? model.programTeacherAssignments : [];
  const missingMentorStudents = Array.isArray(model.missingMentorStudents) ? model.missingMentorStudents : [];
  const missingViewerStudents = Array.isArray(model.missingViewerStudents) ? model.missingViewerStudents : [];
  const missingTeacherPrograms = Array.isArray(model.missingTeacherPrograms) ? model.missingTeacherPrograms : [];
  const cards = [
    { id: "mentor", label: "Missing Mentor Coverage", value: missingMentorStudents.length, detail: `${mentorAssignments.length} active mentor assignments`, tone: missingMentorStudents.length ? "warning" : "ready" },
    { id: "viewer", label: "Missing Viewer Access", value: missingViewerStudents.length, detail: `${viewerAssignments.length} active viewer assignments`, tone: missingViewerStudents.length ? "warning" : "ready" },
    { id: "program-teacher", label: "Program Teacher Gaps", value: missingTeacherPrograms.length, detail: `${programTeacherAssignments.length} active Program Teacher assignments`, tone: missingTeacherPrograms.length ? "warning" : "ready" },
    { id: "admin", label: "School Admin Grants", value: safeNumber((assignments.administrationSite || []).length) + safeNumber((assignments.siteAdminSite || []).length), detail: "Administration and Site Admin access grants", tone: "quiet" },
  ];
  return `
    <section class="workspace-admin-coverage-summary" data-admin-assignment-coverage-summary="true" aria-label="Assignment coverage summary">
      ${cards.map((card) => `
        <article class="${escapeHtml(card.tone)}" data-admin-assignment-coverage="${escapeHtml(card.id)}">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(String(card.value))}</strong>
          <small>${escapeHtml(card.detail)}</small>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAdminAssignmentFlowPanel(model = adminAssignmentCoverageModel()) {
  const lanes = [
    {
      id: "mentor",
      title: "Assign mentor coverage",
      count: safeNumber(model.missingMentorStudents?.length),
      detail: "Start here when students have no active mentor in the visible roster.",
      tone: safeNumber(model.missingMentorStudents?.length) ? "warning" : "ready",
      action: "Open mentor form",
    },
    {
      id: "viewer",
      title: "Assign viewer access",
      count: safeNumber(model.missingViewerStudents?.length),
      detail: "Confirm read-only viewer coverage after mentor coverage is clear.",
      tone: safeNumber(model.missingViewerStudents?.length) ? "warning" : "ready",
      action: "Open viewer form",
    },
    {
      id: "program-teacher",
      title: "Confirm Program Teacher coverage",
      count: safeNumber(model.missingTeacherPrograms?.length),
      detail: "Program worklists need an active Program Teacher assignment for each active program.",
      tone: safeNumber(model.missingTeacherPrograms?.length) ? "warning" : "ready",
      action: "Open program form",
    },
    {
      id: "school-access",
      title: "Review school grants",
      count: usersAccessActiveAssignmentCount(model.assignments || {}),
      detail: "Check Administration and Site Admin grants before adding broader school access.",
      tone: "quiet",
      action: "Review grants",
    },
  ];
  const firstLane = lanes.find((lane) => lane.count > 0) || lanes[0];
  return `
    <section class="workspace-admin-assignment-flow" data-admin-assignment-flow="true" data-admin-assignment-flow-first="${escapeHtml(firstLane.id)}" aria-labelledby="adminAssignmentFlowTitle">
      <div class="workspace-admin-assignment-flow-head">
        <div>
          <p class="workspace-kicker">Coverage Flow</p>
          <h3 id="adminAssignmentFlowTitle">Fix coverage in order</h3>
          <p class="workspace-muted">Use the matching assignment form for the first nonzero gap, then refresh the summary before moving to broader grants.</p>
        </div>
        <button class="workspace-button workspace-button-secondary workspace-button-small" type="button" data-users-access-focus="assignment-forms">Open forms</button>
      </div>
      <div class="workspace-admin-assignment-flow-grid">
        ${lanes.map((lane, index) => `
          <article class="${escapeHtml(lane.tone)}" data-admin-assignment-flow-lane="${escapeHtml(lane.id)}">
            <span>${escapeHtml(`Step ${index + 1}`)}</span>
            <strong>${escapeHtml(lane.title)}</strong>
            <p>${escapeHtml(lane.detail)}</p>
            <small>${escapeHtml(lane.count ? `${lane.count} to review` : "No active gap")}</small>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-users-access-focus="assignment-forms">${escapeHtml(lane.action)}</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminImportTemplateShelf() {
  const templates = [
    csvTemplateContractForKind("students"),
    csvTemplateContractForKind("staff"),
  ];
  return `
    <section class="workspace-admin-template-shelf" data-admin-import-template-shelf="true" aria-label="CSV templates">
      ${templates.map((template) => {
        const csv = csvTemplateForKind(template.kind);
        const href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        return `
          <article data-admin-import-template="${escapeHtml(template.kind)}">
            <div>
              <strong>${escapeHtml(template.title)}</strong>
              <p>${escapeHtml(template.detail)}</p>
              ${renderCsvTemplateColumnGroups(template.kind)}
              ${renderCsvTemplateExample(template.kind)}
              <p class="workspace-muted">${escapeHtml(template.scopeNote)}</p>
            </div>
            <div class="workspace-row-actions">
              <button class="workspace-link-button workspace-link-button-small" type="button" data-people-view-target="${escapeHtml(template.kind === "staff" ? "import-staff" : "import-students")}">
                Preview ${escapeHtml(template.kind)}
              </button>
              <a class="workspace-button workspace-button-secondary" href="${href}" download="${escapeHtml(template.kind === "staff" ? "capstone-staff-template.csv" : "capstone-students-template.csv")}" data-csv-template-download="${escapeHtml(template.kind)}">Download template</a>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderAdminOperationalReportSummary(report = {}) {
  const rows = [
    { id: "roster", label: "Roster completeness", value: report.rosterCompletenessPercent, max: 100, valueLabel: percentLabel(report.rosterCompletenessPercent), detail: `Students counted: ${safeNumber(report.rosterCompletenessDenominator)} roster rows`, tone: "student", dataAttrs: `data-admin-report-row="roster"` },
    { id: "mentor", label: "Mentor coverage", value: report.mentorCoveragePercent, max: 100, valueLabel: percentLabel(report.mentorCoveragePercent), detail: `Students counted: ${safeNumber(report.mentorCoverageDenominator)} visible students`, tone: "mentor", dataAttrs: `data-admin-report-row="mentor"` },
    { id: "project-adults", label: "Projects with both adults", value: safeNumber(report.projectsAdultsReady), max: Math.max(safeNumber(report.visibleProjectCount), 1), valueLabel: safeNumber(report.visibleProjectCount) ? `${safeNumber(report.projectsAdultsReady)} of ${safeNumber(report.visibleProjectCount)}` : "No projects", detail: safeNumber(report.projectsMissingRequiredAdult) ? `${safeNumber(report.projectsMissingRequiredAdult)} need a Mentor, Program Teacher, or both` : "Every visible project has both adults", tone: safeNumber(report.projectsMissingRequiredAdult) ? "danger" : "ready", dataAttrs: `data-admin-report-row="project-adults"` },
    { id: "viewer", label: "Viewer coverage", value: report.viewerCoveragePercent, max: 100, valueLabel: percentLabel(report.viewerCoveragePercent), detail: `Students counted: ${safeNumber(report.viewerCoverageDenominator)} roster rows`, tone: "ready", dataAttrs: `data-admin-report-row="viewer"` },
    { id: "program", label: "Program coverage", value: report.programCoveragePercent, max: 100, valueLabel: percentLabel(report.programCoveragePercent), detail: `Programs counted: ${safeNumber(report.programCoverageDenominator)} active programs`, tone: "teacher", dataAttrs: `data-admin-report-row="program"` },
    { id: "progress", label: "Progress follow-up", value: safeNumber(report.reviewFollowUp), max: Math.max(safeNumber(report.studentTotal), safeNumber(report.reviewFollowUp), 1), detail: "Submitted and revision-requested records", tone: safeNumber(report.reviewFollowUp) ? "warning" : "ready", dataAttrs: `data-admin-report-row="progress"` },
    { id: "issues", label: "Setup/import issues", value: safeNumber(report.setupIssueCount) + safeNumber(report.importIssueCount), max: Math.max(safeNumber(report.studentTotal), safeNumber(report.setupIssueCount) + safeNumber(report.importIssueCount), 1), detail: "Setup list and CSV preview issues", tone: safeNumber(report.setupIssueCount) + safeNumber(report.importIssueCount) ? "warning" : "ready", dataAttrs: `data-admin-report-row="issues"` },
  ];
  return renderReportBars({
    id: "adminReportSummaryTitle",
    kicker: "Reports",
    title: "Operational coverage summary",
    detail: "Roster completeness, mentor/viewer/program coverage, review status, setup, and import issues for this allowed view.",
    rows,
    className: "workspace-admin-report-summary",
    dataAttrs: `data-admin-report-summary="true"`,
  });
}

function renderReportExportPanel({ id = "reports", title = "CSV downloads", detail = "", exports = [] } = {}) {
  const safeExports = (Array.isArray(exports) ? exports : []).filter(Boolean);
  if (!safeExports.length) return "";
  const titleId = `${id}ReportExportsTitle`;
  return `
    <section class="workspace-card workspace-report-export-panel" data-report-export-panel="${escapeHtml(id)}" aria-labelledby="${escapeHtml(titleId)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Exports</p>
          <h3 id="${escapeHtml(titleId)}">${escapeHtml(title)}</h3>
          ${detail ? `<p class="workspace-muted">${escapeHtml(detail)}</p>` : ""}
        </div>
      </div>
      <p class="workspace-report-confidence-note" data-report-confidence-note="${escapeHtml(id)}">
        Percentages say which students are counted, zero-row exports stay disabled, and unknown states are not counted as complete.
      </p>
      <div class="workspace-report-export-grid">
        ${safeExports.map(renderReportExportRow).join("")}
      </div>
    </section>
  `;
}

function renderReportExportRow(spec = {}) {
  const headers = Array.isArray(spec.headers) ? spec.headers : [];
  const rows = Array.isArray(spec.rows) ? spec.rows : [];
  const rowCount = rows.length;
  const filename = spec.filename || `${spec.id || "report"}.csv`;
  const hasRows = headers.length && rowCount > 0;
  const href = hasRows ? csvDataHref(csvFromRows(headers, rows)) : "";
  return `
    <article class="workspace-report-export-row" data-report-export-card="${escapeHtml(spec.id || "report")}">
      <div>
        <strong>${escapeHtml(spec.title || "Report export")}</strong>
        <p>${escapeHtml(spec.detail || "Download this report CSV.")}</p>
        <small data-report-export-fields="${escapeHtml(spec.id || "report")}">Fields: ${escapeHtml(headers.join(", "))}</small>
        <small data-report-export-boundary="${escapeHtml(spec.id || "report")}">${escapeHtml(reportExportBoundaryText(spec, "Download includes only rows visible to this account."))}</small>
      </div>
      <div class="workspace-row-actions">
        <span class="workspace-summary-badge">${escapeHtml(String(rowCount))} row${rowCount === 1 ? "" : "s"}</span>
        ${hasRows
          ? `<a class="workspace-button workspace-button-secondary workspace-button-small" data-report-export="${escapeHtml(spec.id || "report")}" href="${escapeHtml(href)}" download="${escapeHtml(filename)}" aria-label="${escapeHtml(`Download ${spec.title || "report"} CSV`)}">Download CSV</a>`
          : `<span class="workspace-summary-badge" data-report-export-empty="${escapeHtml(spec.id || "report")}">Awaiting report data</span>`}
      </div>
    </article>
  `;
}

function reportExportBoundaryText(spec = {}, fallback = "Download includes only rows this role can already load.") {
  return String(spec.boundary || fallback).trim() || fallback;
}

function staffReportExportSpecs() {
  const visibleStudentRows = staffVisibleStudentExportRows();
  const reviewRows = staffPendingReviewExportRows();
  const projectAdultRows = visibleProjectAdultExportRows();
  return [
    {
      id: "staff-project-adults",
      title: "Project adult ownership",
      detail: "Mentor and Program Teacher setup for projects visible to this role.",
      filename: "capstone-project-adults.csv",
      headers: ["Project", "Students", "Mentor", "Mentor status", "Program Teacher", "Program Teacher status", "Setup state", "Next step"],
      rows: projectAdultRows,
      boundary: "Includes only projects visible to this account; no private notes or invite tokens.",
    },
    {
      id: "staff-visible-students",
      title: "Visible students",
      detail: "Current Student Directory rows visible to this role and site.",
      filename: "capstone-visible-students.csv",
      headers: ["Student name", "Program", "Latest submission", "Review status", "Evidence status", "Presentation", "Final files", "Next action"],
      rows: visibleStudentRows,
      boundary: "Includes only students visible to this account; no passwords, private notes, or file links.",
    },
    {
      id: "staff-pending-reviews",
      title: "Pending reviews",
      detail: "Review queue rows this role can already open.",
      filename: "capstone-pending-reviews.csv",
      headers: ["Student name", "Requirement", "Status", "Evidence count", "Updated", "Next action"],
      rows: reviewRows,
      boundary: "Includes only review work this role can already open.",
    },
  ];
}

function adminReportExportSpecs(model = adminConsoleOperationsModel()) {
  const rosterRows = adminRosterCompletenessExportRows();
  const projectAdultRows = visibleProjectAdultExportRows();
  const setupIssueRows = (model.setupIssues || []).map((issue) => [
    reportCell(issue.title, "Setup issue"),
    reportCell(issue.detail, "Review this setup issue."),
    String(safeNumber(issue.count)),
    reportCell(issue.action, "Open linked section"),
  ]);
  const importRows = adminImportResultExportRows();
  return [
    {
      id: "admin-project-adults",
      title: "Project adult ownership",
      detail: "Shows whether each visible project has its required Mentor and Program Teacher.",
      filename: "capstone-admin-project-adults.csv",
      headers: ["Project", "Students", "Mentor", "Mentor status", "Program Teacher", "Program Teacher status", "Setup state", "Next step"],
      rows: projectAdultRows,
      boundary: "Uses only projects visible to this admin role; no private notes or invite tokens.",
    },
    {
      id: "admin-roster-completeness",
      title: "Roster completeness",
      detail: "Student setup fields visible to this admin role.",
      filename: "capstone-admin-roster-completeness.csv",
      headers: ["Student name", "Program", "Cohort", "Graduation year", "Mentor coverage", "Viewer coverage", "Setup flags"],
      rows: rosterRows,
      boundary: "Uses only rows visible to this admin role; no passwords, private notes, or file links.",
    },
    {
      id: "admin-setup-issues",
      title: "Setup issues",
      detail: "Prioritized setup/import issue list visible to this admin role.",
      filename: "capstone-admin-setup-issues.csv",
      headers: ["Issue", "Detail", "Count", "Action"],
      rows: setupIssueRows,
      boundary: "Includes only setup and import issue summaries visible to this admin role.",
    },
    {
      id: "admin-import-result",
      title: "Latest import summary",
      detail: "One-time import summary only; credentials and admin notes are never exported.",
      filename: "capstone-admin-import-summary.csv",
      headers: ["Metric", "Value"],
      rows: importRows,
      boundary: "Includes import counts only; credentials, row notes, and setup passwords are never exported.",
    },
  ];
}

function staffVisibleStudentExportRows() {
  const body = unwrap(currentData.siteStudents) || {};
  const students = Array.isArray(body.students) ? body.students : [];
  return students.map((student) => [
    reportCell(student.displayName || student.studentName, "Student"),
    reportCell(studentProgramDisplay(student, "Not confirmed"), "Not confirmed"),
    statusText(student.latestSubmissionStatus || student.submissionStatus || student.status || "unknown"),
    statusText(student.reviewStatus || student.latestReviewStatus || "unknown"),
    statusText(student.evidenceStatus || "unknown"),
    statusText(student.presentationStatus || "unknown"),
    statusText(student.archiveStatus || "unknown"),
    reportCell(student.nextAction, "Not confirmed"),
  ]);
}

function staffPendingReviewExportRows() {
  const body = unwrap(currentData.reviewQueue) || {};
  const rows = Array.isArray(body.queue) ? body.queue : [];
  return rows.map((row) => [
    reportCell(row.studentName, "Student"),
    reportCell(row.requirementTitle, "Requirement not confirmed"),
    statusText(row.status || "unknown"),
    String(safeNumber(row.evidenceCount)),
    formatDate(row.updatedAt || row.submittedAt),
    reportCell(row.nextAction, "Not confirmed"),
  ]);
}

function visibleProjectAdultExportRows() {
  const body = unwrap(currentData.projects) || {};
  const projects = Array.isArray(body.projects) ? body.projects : [];
  return projects.map((project) => {
    const setup = project.adultSetup || {};
    const mentor = setup.mentor || {};
    const teacher = setup.programTeacher || {};
    const students = (Array.isArray(project.members) ? project.members : [])
      .map((member) => member.displayName || member.studentName || "Student")
      .join("; ");
    return [
      reportCell(project.name, "Project"),
      students || "No active students",
      reportCell(mentor.assigneeName || mentor.inviteeName, "Missing"),
      statusText(mentor.status || "missing"),
      reportCell(teacher.assigneeName || teacher.inviteeName, "Missing"),
      statusText(teacher.status || "missing"),
      setup.ready ? "Ready" : "Needs people",
      reportCell(setup.nextStep, "Confirm both required adults."),
    ];
  });
}

function adminRosterCompletenessExportRows() {
  const access = unwrap(currentData.accessAssignments) || {};
  const assignments = access.assignments || {};
  const students = Array.isArray(access.users?.students) ? access.users.students : [];
  return students.map((student) => {
    const flags = adminStudentSetupFlags(student, assignments);
    const flagLabels = flags.map((flag) => flag.label).filter(Boolean);
    return [
      reportCell(student.displayName || student.studentName, "Student"),
      reportCell(adminStudentProgramValue(student), "Not confirmed"),
      reportCell(adminStudentCohortValue(student), "Not confirmed"),
      reportCell(adminStudentGraduationValue(student), "Not confirmed"),
      flagLabels.includes("No mentor") ? "Missing" : "Confirmed",
      flagLabels.includes("No viewer") ? "Missing" : "Confirmed",
      flagLabels.length ? flagLabels.join("; ") : "No setup flags",
    ];
  });
}

function adminImportResultExportRows() {
  const summary = lastAdminImportResult?.summary || null;
  if (!summary) return [];
  return [
    ["Students created", String(safeNumber(summary.studentsCreated))],
    ["Students skipped", String(safeNumber(summary.studentsSkipped))],
    ["Invalid rows blocked", String(safeNumber(summary.invalidRowsBlocked))],
    ["Mentor assignments created", String(safeNumber(summary.mentorAssignmentsCreated))],
    ["Project Mentors created", String(safeNumber(summary.projectMentorsCreated))],
    ["Project Teachers created", String(safeNumber(summary.projectProgramTeachersCreated))],
    ["Mentor assignments skipped", String(safeNumber(summary.mentorAssignmentsSkipped))],
    ["Viewer assignments created", String(safeNumber(summary.viewerAssignmentsCreated))],
    ["Viewer assignments skipped", String(safeNumber(summary.viewerAssignmentsSkipped))],
  ];
}

function reportCell(value, fallback = "Not confirmed") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function csvDataHref(csv = "") {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function csvFromRows(headers = [], rows = []) {
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  return [
    safeHeaders,
    ...safeRows.map((row) => Array.isArray(row) ? row : []),
  ].map(csvLine).join("\n");
}

function csvLine(cells = []) {
  return (Array.isArray(cells) ? cells : []).map(csvCell).join(",");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function renderViewerOverviewSection() {
  const siteStudents = unwrap(currentData.siteStudents) || {};
  const summary = siteStudents.summary || {};
  const scope = siteStudents.scope || {};
  return `
    ${renderReadOnlyMonitoringOverview(summary, scope)}
    ${renderSiteStudentDirectorySection()}
  `;
}

function renderWorkspaceAdminConsoleHandoff() {
  const capabilities = adminConsoleCapabilitiesFor(currentUser);
  if (!capabilities.canSee) return renderAccessBoundarySummary();
  const primaryAction = capabilities.readOnly ? "Open read-only console" : "Open Admin Console";
  return `
    <section class="workspace-card workspace-console-handoff" data-workspace-admin-console-handoff="true" aria-labelledby="workspaceConsoleHandoffTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Admin Console</p>
          <h2 id="workspaceConsoleHandoffTitle">Open operations console</h2>
          <p class="workspace-muted">Open Admin Console for People, Students, Assignments, Programs, Imports, Reports, and Audit sections available to this account.</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(capabilities.scope.label)}</span>
      </div>
      <div class="workspace-console-handoff-actions">
        <button class="workspace-button workspace-button-primary" type="button" data-workspace-mode-target="admin">
          ${escapeHtml(primaryAction)}
        </button>
        <button class="workspace-button workspace-button-secondary" type="button" data-section="students">
          Open Students
        </button>
      </div>
      <div class="workspace-admin-console-matrix" data-workspace-admin-console-preview="true">
        ${capabilities.sections.filter((section) => section.id !== "overview").slice(0, 5).map((section) => `
          <article class="workspace-empty-state-card">
            <strong>${escapeHtml(section.label)}</strong>
            <span>${escapeHtml(section.detail)}</span>
            ${statusPill(capabilities.readOnly ? "read_only" : "configured")}
          </article>
        `).join("")}
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
        Your account is signed in, but this account does not have access to the
        requested section for this school.
      </p>
      <ul class="workspace-compact-list">
        ${deniedSections.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
      </ul>
      ${renderProblemState({
        reason: "The current account does not include every requested workspace section.",
        owner: "Project coordinator or site administrator.",
        nextAction: "Use an assigned account or ask the project coordinator for access to this school.",
      })}
    </section>
    ` : ""}
  `;
}

function renderReadOnlyBanner({ includeEscalation = true } = {}) {
  const roles = roleIds(currentUser);
  if (roles.has("viewer")) {
    return `
      <section class="workspace-read-only-banner" data-workspace-mode="read-only" aria-label="Viewer read-only mode">
        <span class="workspace-chip workspace-role-chip" data-role-id="viewer">Viewer</span>
        <div>
          <p>Read-only workspace. You can open assigned student records for context, then share concerns with the Program Teacher or site staff.</p>
          <dl class="workspace-read-only-boundary-list" data-read-only-boundary-list="viewer">
            <div>
              <dt>You can</dt>
              <dd>Open assigned student records and read status, files, presentation, and final-file context.</dd>
            </div>
            <div>
              <dt>You cannot</dt>
              <dd>Edit records, approve work, assign mentors, import accounts, schedule presentations, or change access.</dd>
            </div>
          </dl>
        </div>
      </section>
      ${includeEscalation ? renderReadOnlyEscalationGuide("viewer") : ""}
    `;
  }
  if (!isReadOnlyAdministrationUser(currentUser)) return "";
  return `
    <section class="workspace-read-only-banner" data-workspace-mode="read-only" aria-label="School Admin read-only mode">
      <span class="workspace-chip workspace-role-chip" data-role-id="administration">School Admin</span>
      <p>Read-only monitoring workspace. You can review assigned student records, presentation readiness, and closeout status for this school. Ask a Global Admin to confirm this account's school access if account-management controls are missing.</p>
    </section>
    ${includeEscalation ? renderReadOnlyEscalationGuide("administration") : ""}
  `;
}

function renderReadOnlyEscalationGuide(audience = "viewer") {
  const administration = audience === "administration";
  const rows = administration
    ? [
        ["Program Teacher approval needed", "Notify the assigned Program Teacher and share the submitted or revision student list.", "students", "submitted-students"],
        ["Account or access issue", "Notify a Global Admin and share Users & Access context if your account cannot open it.", "adminUsers", ""],
        ["Final-file or presentation blocker", "Notify site staff and share the Operations worklist row.", "operations", "needs-attention"],
      ]
    : [
        ["Student seems stuck", "Notify the student's Program Teacher and share the assigned student detail.", "students", "behind-students"],
        ["Mentor or meeting question", "Notify the project coordinator; viewers cannot assign mentors or record meetings.", "students", "mentor-meeting-follow-up-students"],
        ["Access looks wrong", "Notify the site administrator with the student name and this read-only role.", "students", "all-students"],
      ];
  return `
    <section class="workspace-read-only-escalation" data-read-only-escalation-guide="${escapeHtml(audience)}" aria-label="Read-only escalation guide">
      <strong>${escapeHtml(administration ? "When monitoring finds a problem" : "When you need someone to act")}</strong>
      <div class="workspace-read-only-escalation-grid">
        ${rows.map(([label, detail, section, preset]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
            ${availableSectionIdsForAnyMode().has(section) ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}"${preset ? ` data-section-preset="${escapeHtml(preset)}"` : ""}>
                Share this worklist
              </button>
            ` : `<span class="workspace-summary-badge">Tell assigned staff</span>`}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function siteReadOnlyAudience(scope = {}) {
  const role = normalizeStatus(scope.role || primaryRoleForUser(currentUser));
  if (role === "administration" || isReadOnlyAdministrationUser(currentUser)) {
    return "administration";
  }
  return "viewer";
}

function siteAccessModeLabel(scope = {}) {
  if (!scope.readOnly) return "School access";
  return siteReadOnlyAudience(scope) === "administration"
    ? "Leadership monitoring"
    : "Read-only viewer";
}

function readOnlyMonitoringOverviewCopy(scope = {}) {
  if (siteReadOnlyAudience(scope) === "administration") {
    return {
      kicker: "Leadership priorities",
      title: "School Admin monitoring queue",
      detail: "Open the student lists you can see. Teachers and school staff handle reviews, accounts, and safety settings.",
      operationsTitle: "School follow-up to monitor",
      operationsDetail: "presentation or archive records need staff follow-up.",
    };
  }
  return {
    kicker: "Viewer priorities",
    title: "Read-only monitoring queue",
    detail: "Open the exact assigned-student lists you can already monitor here; assigned staff handle approvals, assignments, account changes, and status updates.",
    operationsTitle: "Operations to monitor",
    operationsDetail: "presentation or archive records need school follow-up.",
  };
}

function renderReadOnlyMonitoringOverview(summary = {}, scope = {}) {
  const reviewFollowUp = safeNumber(summary.submitted) + safeNumber(summary.revisionRequested);
  const noMentor = safeNumber(summary.noMentor);
  const operationsAttention = safeNumber(summary.presentationPending) + safeNumber(summary.archiveFailed);
  const reviewPreset = safeNumber(summary.revisionRequested) > 0 ? "revision-students" : "submitted-students";
  const operationsPreset = safeNumber(summary.archiveFailed) > 0 ? "archive-failed-students" : "presentation-pending-students";
  const copy = readOnlyMonitoringOverviewCopy(scope);

  return `
    <section class="workspace-card" data-viewer-monitoring-overview="true" aria-label="Read-only monitoring priorities">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">${escapeHtml(copy.kicker)}</p>
          <h2>${escapeHtml(copy.title)}</h2>
          <p class="workspace-muted">${escapeHtml(copy.detail)}</p>
        </div>
        <span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>
      </div>
      <div class="workspace-list">
        <article class="workspace-row">
          <div>
            <strong>Review work to monitor</strong>
            <p>${escapeHtml(reviewFollowUp)} submitted or revision records may need Program Teacher follow-up.</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(reviewFollowUp ? "pending" : "ready")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="${escapeHtml(reviewPreset)}">
              Open students
            </button>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>Mentor coverage to monitor</strong>
            <p>${escapeHtml(noMentor)} ${escapeHtml(pluralize(noMentor, "student"))} currently lack active mentor coverage.</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(noMentor ? "attention_required" : "ready")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="missing-mentors">
              View students
            </button>
          </div>
        </article>
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(copy.operationsTitle)}</strong>
            <p>${escapeHtml(operationsAttention)} ${escapeHtml(copy.operationsDetail)}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(operationsAttention ? "attention_required" : "ready")}
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="${escapeHtml(operationsPreset)}">
              Open students
            </button>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderSiteDashboardSection() {
  if (!hasSiteDashboardRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Site dashboard", "assigned site dashboard records");
  }
  const result = currentData.siteDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Site dashboard", "records for this assigned school");
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
          owner: "School Admin or platform support.",
          nextAction: "Refresh after the site assignment is confirmed.",
        })}
      </section>
    `;
  }

  const summary = dashboard.summary || {};
  const scope = dashboard.scope || {};
  const readOnly = Boolean(scope.readOnly);
  const canOpenAudit = availableSectionIdsForAnyMode().has("audit");
  const presentationsTotal = safeNumber(summary.presentationsScheduled) + safeNumber(summary.presentationsPending);
  const archiveTotal = safeNumber(summary.exportsQueued)
    + safeNumber(summary.exportsRunning)
    + safeNumber(summary.exportsComplete)
    + safeNumber(summary.exportsFailed);

  return `
    <section class="workspace-command-center" aria-labelledby="siteDashboardTitle">
      ${renderSiteDashboardSummary(dashboard)}
      ${renderSiteAdminFirstDayChecklist(dashboard)}
      ${renderFirstUseGuide("site-dashboard", readOnly ? "Monitor the school without changing records" : "Run the school workspace from this overview", [
        ["Check first-day setup", "Confirm students, mentors, submitted work, and programs before using the rest of the school workspace."],
        ["Open the most urgent tile", "Use No Mentor, Submitted, Presentations, or Final Files to jump to the exact worklist."],
        ["Use details for context", "Open details only after the first-screen counts tell you where to look."],
        ["Choose the right team", readOnly ? "Share the matching student or operations list with authorized staff." : "Send review work to Program Teachers, mentor gaps to assignment staff, and final-file problems to site staff."],
      ], {
        detail: readOnly ? "This view helps leadership monitor without exposing edit controls." : "This view turns school-level counts into the next staff action.",
        badge: readOnly ? "Monitor path" : "Site path",
      })}
      ${readOnly ? renderReadOnlyMonitoringOverview(dashboard.summary || {}, scope) : ""}
      ${renderSiteDashboardActionMap(dashboard, readOnly)}
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students", summary.studentsActive, `${safeNumber(summary.studentsTotal)} visible at this site`, "admin", "students", { label: "Open", preset: "all-students" })}
        ${renderMetricTile("No Mentor", summary.studentsNoMentor, "Students missing active mentor assignments", safeNumber(summary.studentsNoMentor) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-mentors" })}
        ${renderMetricTile("Submitted", summary.submissionsSubmitted, "Awaiting Program Teacher review", "teacher", "teacher", { label: "Review", preset: "submitted" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Program Teacher follow-up needed", safeNumber(summary.revisionRequested) ? "warning" : "student", "teacher", { label: "Review", preset: "revision-requested" })}
        ${renderMetricTile("Presentations", presentationsTotal, `${safeNumber(summary.presentationsPending)} pending readiness`, "teacher", "operations", { label: "Review", preset: "presentation-pending" })}
        ${renderMetricTile("Final Files", archiveTotal, `${safeNumber(summary.exportsFailed)} failed`, safeNumber(summary.exportsFailed) ? "danger" : "admin", "operations", { label: "Review", preset: "archive-failed" })}
      </div>
      ${renderSummaryStrip([
        { label: "Files", value: safeNumber(summary.evidenceArtifacts), detail: "Summary only; open student detail for file records.", tone: "mentor", concept: "Missing Work" },
        {
          label: "Recent Activity",
          value: safeNumber(summary.recentActivityCount),
          detail: canOpenAudit ? "Latest updates are listed below. Audit destination available." : "Latest updates are listed below.",
          tone: "admin",
          concept: "Recent Activity",
          actionHtml: canOpenAudit
            ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="audit">Open audit</button>`
            : "",
        },
      ], { label: "Site dashboard summary-only metrics" })}
      ${siteStudentDetailState?.sourceSection === "siteDashboard" ? renderSiteStudentDetailSurface({
        students: (dashboard.topRiskStudents || []).map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
        scope,
      }) : ""}
      ${renderDashboardCard("Needs Attention", "Program Teacher follow-up and operations", renderNeedsAttention(dashboard.needsAttention))}
      ${renderWorkspaceDisclosurePanel({
        scope: "dashboard",
        id: "siteDashboard",
        kicker: "Dashboard details",
        title: "More School Details",
        summary: "Program, status, mentor, presentation, final-file, and access details stay available without crowding the first screen.",
        openLabel: "Show details",
        closeLabel: "Hide details",
        bodyHtml: `
          ${renderSitePermissionRules(dashboard)}
          <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-secondary-grid">
            ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
            ${renderDashboardCard("Status Breakdown", "Student status", renderStatusBreakdown(dashboard.statusBreakdown))}
            ${renderDashboardCard("Students Needing Help", "Priority students", renderSiteTopRiskStudents(dashboard.topRiskStudents))}
            ${renderDashboardCard("Mentor Coverage", "Mentor assignment load", renderMentorCoverage(dashboard.mentorCoverage, summary))}
            ${renderDashboardCard("Recent Activity", "Latest student updates", renderSiteRecentActivity(dashboard.recentActivity))}
            ${renderDashboardCard("Presentation Snapshot", "Readiness and day-of status", renderSnapshotRows(dashboard.presentationSnapshot, "presentation"))}
            ${renderDashboardCard("Archive / Export Snapshot", "Closeout package status", renderSnapshotRows(dashboard.archiveSnapshot, "archive"))}
            ${renderDashboardCard("Next Actions", "Recommended follow-up", renderSiteNextActions(dashboard.nextActions, readOnly))}
          </div>
        `,
      })}
    </section>
  `;
}

function renderSiteDashboardActionMap(dashboard = {}, readOnly = false) {
  const summary = dashboard.summary || {};
  const scope = dashboard.scope || {};
  const programCount = Array.isArray(dashboard.programBreakdown) ? dashboard.programBreakdown.length : 0;
  const riskCount = Array.isArray(dashboard.topRiskStudents) ? dashboard.topRiskStudents.length : 0;
  const noMentor = safeNumber(summary.studentsNoMentor);
  const activeStudents = safeNumber(summary.studentsActive || summary.studentsTotal);
  const submitted = safeNumber(summary.submissionsSubmitted);
  const revisions = safeNumber(summary.revisionRequested);
  const reviewTotal = submitted + revisions;
  const presentationPending = safeNumber(summary.presentationsPending);
  const failedExports = safeNumber(summary.exportsFailed);
  const operationsTotal = presentationPending + failedExports;
  const setupGaps = [];

  if (!activeStudents) {
    setupGaps.push({
      label: "student roster",
      section: "students",
      preset: "all-students",
      actionLabel: "Open students",
    });
  }
  if (!programCount) {
    setupGaps.push({
      label: "program list",
      section: "programs",
      actionLabel: "Open programs",
    });
  }
  if (noMentor) {
    setupGaps.push({
      label: "mentor coverage",
      section: availableSectionIdsForAnyMode().has("mentorAssignments") ? "mentorAssignments" : "students",
      preset: availableSectionIdsForAnyMode().has("mentorAssignments") ? "no-mentor" : "missing-mentors",
      actionLabel: availableSectionIdsForAnyMode().has("mentorAssignments") ? "Assign mentors" : "View students",
    });
  }
  if (!safeNumber(summary.programTeachers)) {
    setupGaps.push({
      label: "Program Teacher coverage",
      section: "adminUsers",
      actionLabel: "Review access",
    });
  }

  const setupGap = setupGaps[0];
  const reviewAction = readOnly
    ? {
      section: "students",
      preset: revisions ? "revision-students" : "submitted-students",
      actionLabel: revisions ? "Monitor revisions" : "Monitor submitted",
    }
    : {
      section: "teacher",
      preset: revisions ? "revision-requested" : "submitted",
      actionLabel: revisions ? "Open revisions" : "Open submitted",
    };
  const blockerCount = setupGaps.length + reviewTotal + operationsTotal + riskCount;
  const allClear = blockerCount === 0;
  const cards = [
    {
      id: "setup",
      tone: setupGaps.length ? "warning" : "ready",
      owner: "School team",
      count: setupGaps.length ? `${setupGaps.length} setup` : "Ready",
      title: setupGaps.length ? "Fix the first setup gap" : "Setup is ready",
      detail: setupGaps.length
        ? `Start with ${setupGap.label}; finish setup before trusting the rest of the dashboard.`
        : "Roster, programs, Program Teacher coverage, and mentor coverage are present.",
      source: `${scope.siteName || "Current school"} setup`,
      actionSection: setupGap?.section || "students",
      actionPreset: setupGap?.preset || "all-students",
      actionLabel: setupGap?.actionLabel || "Open roster",
    },
    {
      id: "mentor",
      tone: noMentor ? "mentor" : "ready",
      owner: "Site staff",
      count: noMentor ? `${noMentor} missing` : "Covered",
      title: noMentor ? "Assign mentor coverage" : "Mentor coverage looks current",
      detail: noMentor
        ? `${noMentor} ${pluralize(noMentor, "student")} ${noMentor === 1 ? "needs" : "need"} an active mentor before normal check-ins can work.`
        : "No missing-mentor count is visible on this dashboard.",
      source: "Mentor assignment source",
      actionSection: availableSectionIdsForAnyMode().has("mentorAssignments") ? "mentorAssignments" : "students",
      actionPreset: availableSectionIdsForAnyMode().has("mentorAssignments") ? "no-mentor" : "missing-mentors",
      actionLabel: noMentor ? "Open coverage" : "View coverage",
    },
    {
      id: "review",
      tone: reviewTotal ? "review" : "ready",
      owner: "Program Teacher",
      count: reviewTotal ? `${reviewTotal} review` : "Clear",
      title: reviewTotal ? "Review work" : "No review work waiting",
      detail: reviewTotal
        ? `${submitted} submitted and ${revisions} revision ${pluralize(revisions, "record")} need Program Teacher attention.`
        : "No submitted or revision-requested count is waiting in the school summary.",
      source: readOnly ? "Monitoring list" : "Review Work",
      actionSection: reviewAction.section,
      actionPreset: reviewAction.preset,
      actionLabel: reviewTotal ? reviewAction.actionLabel : "Open Review Work",
    },
    {
      id: "proof",
      tone: riskCount ? "danger" : "proof",
      owner: "Student and teacher",
      count: riskCount ? `${riskCount} need help` : `${safeNumber(summary.evidenceArtifacts)} files`,
      title: riskCount ? "Check students needing help" : "Files stay summary-safe",
      detail: riskCount
        ? `${riskCount} high-priority ${pluralize(riskCount, "student")} need staff to confirm work, status, and the next helper.`
        : "Private files are counted here without exposing details; use the student list only when file follow-up is needed.",
      source: "Private file summary",
      actionSection: "students",
      actionPreset: riskCount ? "high-risk-students" : "missing-evidence-students",
      actionLabel: riskCount ? "Open high priority" : "Find missing work",
    },
    {
      id: "operations",
      tone: failedExports ? "danger" : (operationsTotal ? "operations" : "ready"),
      owner: "Site staff",
      count: operationsTotal ? `${operationsTotal} ops` : "Clear",
      title: operationsTotal ? "Finish operations follow-up" : "Operations look clear",
      detail: operationsTotal
        ? `${presentationPending} presentation ${pluralize(presentationPending, "item")} and ${failedExports} final-file ${pluralize(failedExports, "failure")} need site follow-up.`
        : "No presentation-pending or final-file failure count is visible.",
      source: "Operations source",
      actionSection: "operations",
      actionPreset: failedExports ? "archive-failed" : "presentation-pending",
      actionLabel: failedExports ? "Open failures" : "Open operations",
    },
    {
      id: "all-clear",
      tone: allClear ? "ready" : "quiet",
      owner: "School team",
      count: allClear ? "All clear" : `${blockerCount} ${pluralize(blockerCount, "item")}`,
      title: allClear ? "All clear for routine follow-up" : "Return here after the first issue",
      detail: allClear
        ? "No setup, mentor, review, file, presentation, or final-file problem is visible right now."
        : "Handle the strongest item first, then come back before expanding details.",
      source: `${scope.siteName || "Current school"} / ${scope.schoolYear || "school year"}`,
      actionSection: "students",
      actionPreset: "all-students",
      actionLabel: allClear ? "Open roster" : "Review roster",
    },
  ];

  return `
    <section class="workspace-site-action-map" data-site-action-map="true" aria-label="School start list">
      <div class="workspace-site-action-map-head">
        <div>
          <p class="workspace-kicker">${readOnly ? "Monitoring list" : "School start list"}</p>
          <h2>Where to start at this school</h2>
          <p>Pick one item before opening the longer details.</p>
        </div>
        <span class="workspace-chip">Current school: ${escapeHtml(scope.siteName || "Assigned school")}</span>
      </div>
      <div class="workspace-site-action-map-grid">
        ${cards.map((card) => renderSiteDashboardActionMapCard(card)).join("")}
      </div>
    </section>
  `;
}

function renderSiteDashboardActionMapCard(card = {}) {
  const hasAction = card.actionSection && availableSectionIdsForAnyMode().has(card.actionSection);
  const actionPreset = card.actionPreset
    ? ` data-section-preset="${escapeHtml(card.actionPreset)}"`
    : "";
  return `
    <article class="workspace-site-action-map-card ${escapeHtml(card.tone || "quiet")}" data-site-action-map-card="${escapeHtml(card.id || "action")}" data-site-action-team="${escapeHtml(card.owner || "School team")}">
      <div>
        <div class="workspace-site-action-map-meta">
          <span>${escapeHtml(card.owner || "School team")}</span>
          <b>${escapeHtml(card.count || "0")}</b>
        </div>
        <strong>${escapeHtml(card.title || "Review this item")}</strong>
        <p>${escapeHtml(card.detail || "Use the source screen before taking action.")}</p>
        ${card.source ? `<small>${escapeHtml(card.source)}</small>` : ""}
      </div>
      ${hasAction ? `
        <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(card.actionSection)}"${actionPreset}>
          ${escapeHtml(card.actionLabel || "Open")}
        </button>
      ` : `<span class="workspace-summary-badge">Summary only</span>`}
    </article>
  `;
}

function renderSiteAdminFirstDayChecklist(dashboard = {}) {
  const summary = dashboard.summary || {};
  const programCount = Array.isArray(dashboard.programBreakdown) ? dashboard.programBreakdown.length : 0;
  const rows = [
    {
      label: "1. Confirm active students",
      detail: safeNumber(summary.studentsActive || summary.studentsTotal)
        ? `${safeNumber(summary.studentsActive || summary.studentsTotal)} active student ${pluralize(summary.studentsActive || summary.studentsTotal, "record")} visible.`
        : "Open Students and confirm the current school roster is visible.",
      state: safeNumber(summary.studentsActive || summary.studentsTotal) ? "ready" : "needs_review",
      action: `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="all-students">Open students</button>`,
    },
    {
      label: "2. Check mentor coverage",
      detail: safeNumber(summary.studentsNoMentor)
        ? `${safeNumber(summary.studentsNoMentor)} ${pluralize(summary.studentsNoMentor, "student")} ${safeNumber(summary.studentsNoMentor) === 1 ? "needs" : "need"} a mentor assignment.`
        : "No missing mentor count is visible right now.",
      state: safeNumber(summary.studentsNoMentor) ? "blocked" : "ready",
      action: availableSectionIdsForAnyMode().has("mentorAssignments")
        ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="mentorAssignments" data-section-preset="no-mentor">Assign mentors</button>`
        : `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="missing-mentors">View missing mentors</button>`,
    },
    {
      label: "3. Review work",
      detail: safeNumber(summary.submissionsSubmitted)
        ? `${safeNumber(summary.submissionsSubmitted)} submitted ${pluralize(summary.submissionsSubmitted, "item")} waiting for Program Teacher review.`
        : "No submitted work is waiting in the dashboard summary.",
      state: safeNumber(summary.submissionsSubmitted) ? "needs_review" : "ready",
      action: availableSectionIdsForAnyMode().has("teacher")
        ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="teacher" data-section-preset="submitted">Open review queue</button>`
        : `<span class="workspace-summary-badge">Summary only</span>`,
    },
    {
      label: "4. Confirm programs",
      detail: programCount
        ? `${programCount} program ${pluralize(programCount, "group")} visible in this school dashboard.`
        : "Open Programs and confirm which programs run at this school.",
      state: programCount ? "ready" : "needs_review",
      action: availableSectionIdsForAnyMode().has("programs")
        ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="programs">Open programs</button>`
        : `<span class="workspace-summary-badge">Summary only</span>`,
    },
  ];
  return `
    <section class="workspace-site-first-day-checklist" data-site-admin-first-day-checklist="true">
      <div>
        <strong>First-day setup checklist</strong>
        <p>Do these in order before trusting the school workspace for live students.</p>
      </div>
      <div class="workspace-site-first-day-grid">
        ${rows.map((row) => `
          <article data-site-admin-first-day-state="${escapeHtml(row.state)}">
            <div>
              <span>${escapeHtml(row.label)}</span>
              <small>${escapeHtml(row.detail)}</small>
            </div>
            ${row.action}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSiteProgramsSection() {
  if (!canUseSitePrograms(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Programs", "site program records");
  }
  const result = currentData.sitePrograms;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Programs", "records for this assigned school");
  }
  if (result?.status === 409 && result.body?.selectionRequired) {
    return renderSiteProgramsSelectionRequired(result.body);
  }
  const body = unwrap(result);
  if (!body) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Programs</p>
        <h2>Programs setup unavailable</h2>
        ${renderApiNotice(result)}
        ${renderProblemState({
          reason: "The programs setup view could not load for the assigned school.",
          owner: "Site administration or platform support.",
          nextAction: "Refresh after the school assignment is confirmed.",
        })}
      </section>
    `;
  }

  const activePrograms = Array.isArray(body.activePrograms) ? body.activePrograms : [];
  const availablePrograms = Array.isArray(body.availablePrograms) ? body.availablePrograms : [];

  return `
    <section class="workspace-card" data-site-programs-section="true">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Programs</p>
          <h2>Programs at ${escapeHtml(body.scope?.siteName || "this school")}</h2>
        </div>
        <span class="workspace-chip">${escapeHtml(body.scope?.siteName || "Current site")}</span>
      </div>
      ${renderApiNotice(result)}
      ${renderSiteBrandingPanel(body)}
      <p class="workspace-muted">Manage which active programs belong to this school. Removing a program here turns off the school mapping only and keeps historical student and assignment records intact.</p>
      ${renderAdminProgramsCoveragePanel(activePrograms, body)}
      ${renderSiteProgramsSetupFlow(activePrograms, availablePrograms, body)}
      <div class="workspace-assignment-summary">
        <div>
          <p class="workspace-kicker">Current programs</p>
          <h3>Active site programs</h3>
          <p class="workspace-muted">Program Teacher access and school-level worklists use these active program mappings.</p>
        </div>
        ${activePrograms.length ? `
          <div class="workspace-list">
            ${activePrograms.map((program) => `
              <article class="workspace-row" data-site-program-row="${escapeHtml(program.programId || "")}">
                <div>
                  <strong>${escapeHtml(cleanDemoSeedDisplay(program.programName, "Program"))}</strong>
                  <p>${escapeHtml(program.assignedAt ? `Added ${formatDate(program.assignedAt)}` : "Active at this school")}</p>
                </div>
                ${activeAccessPill()}
              </article>
            `).join("")}
          </div>
        ` : `
          <article class="workspace-empty-state-card" data-site-programs-empty="active">
            <strong>No programs are active for this school yet.</strong>
            <p>Add an active program below so this school can use program worklists and assignments.</p>
          </article>
        `}
      </div>
      <div class="workspace-assignment-summary">
        <div>
          <p class="workspace-kicker">Available next</p>
          <h3>Programs you can add</h3>
          <p class="workspace-muted">Only active programs can be added here. Previously removed mappings can be restored from the add form.</p>
        </div>
        ${availablePrograms.length ? `
          <div class="workspace-list">
            ${availablePrograms.map((program) => `
              <article class="workspace-row">
                <div>
                  <strong>${escapeHtml(cleanDemoSeedDisplay(program.programName, "Program"))}</strong>
                  <p>${escapeHtml(program.previouslyRemoved ? "Previously removed from this school. Add it again to restore the school mapping." : "Available to add to this school.")}</p>
                </div>
                <span class="workspace-status-pill pending" data-status="available">${escapeHtml(program.previouslyRemoved ? "Restore" : "Available")}</span>
              </article>
            `).join("")}
          </div>
        ` : `
          <article class="workspace-empty-state-card" data-site-programs-empty="available">
            <strong>No more active programs are waiting to be added.</strong>
            <p>Every active program is already mapped to this school.</p>
          </article>
        `}
      </div>
      <div class="workspace-assignment-tabs">
        ${renderSiteProgramForm("assign", "Add program", availablePrograms, {
          emptyTitle: "No active programs are available to add right now.",
          emptyDetail: "If a new active program is created later, it will appear here for this school.",
          guidance: "Choose Add to activate a program for this school. If the program was removed earlier, this restores the existing school mapping without creating a duplicate.",
          submitLabel: "Add program",
        })}
        ${renderSiteProgramForm("remove", "Remove program", activePrograms, {
          emptyTitle: "No active programs can be removed right now.",
          emptyDetail: "Add a program first if this school needs program setup.",
          guidance: "Choose Remove only for a current program listed above. This turns off the school mapping and keeps historical records intact.",
          submitLabel: "Remove program",
        })}
      </div>
    </section>
  `;
}

function renderSiteBrandingPanel(body = {}) {
  const theme = ["default", "east-tech", "desert-valley", "canyon-ridge", "north-valley"].includes(body.scope?.brandTheme)
    ? body.scope.brandTheme
    : "default";
  const options = [
    ["default", "Capstone neutral"],
    ["east-tech", "East Tech Titans"],
    ["desert-valley", "Desert Valley"],
    ["canyon-ridge", "Canyon Ridge"],
    ["north-valley", "North Valley"],
  ];
  return `
    <section class="workspace-assignment-summary" data-site-branding-panel="true">
      <div>
        <p class="workspace-kicker">School look</p>
        <h3>Colors and headings</h3>
        <p class="workspace-muted">Choose the school look used by students and staff. This changes colors and heading type, not project data.</p>
      </div>
      <form class="workspace-form workspace-assignment-form" data-site-program-form data-site-branding-form="true">
        <input type="hidden" name="action" value="update_branding">
        <input type="hidden" name="siteId" value="${escapeHtml(body.scope?.siteId || "")}">
        <label>
          School look
          <select name="brandTheme" required>
            ${options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === theme ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
        <button class="workspace-button workspace-button-primary" type="submit">Save school look</button>
      </form>
    </section>
  `;
}

function renderSiteProgramsSetupFlow(activePrograms = [], availablePrograms = [], body = {}) {
  const activeCount = Array.isArray(activePrograms) ? activePrograms.length : 0;
  const availableCount = Array.isArray(availablePrograms) ? availablePrograms.length : 0;
  const rows = [
    ["1. Confirm school", body?.scope?.siteName || "Current site", activeCount || availableCount ? "ready" : "context"],
    ["2. Add missing program", availableCount ? `${availableCount} active program ${pluralize(availableCount, "option")} can be added.` : "No additional active programs are waiting.", availableCount ? "needs_review" : "ready"],
    ["3. Confirm Program Teacher access", "Use Users & Access after the program mapping is correct.", availableSectionIdsForAnyMode().has("adminUsers") ? "ready" : "context"],
    ["4. Review before save", "Add or remove one school mapping at a time. Historical student and assignment records stay intact.", "configured"],
  ];
  return `
    <section class="workspace-site-programs-setup-flow" data-site-programs-setup-flow="true">
      <div>
        <strong>Program setup order</strong>
        <p>Do this before using program review queues, student lists, or Program Teacher access.</p>
      </div>
      <div class="workspace-site-programs-setup-grid">
        ${rows.map(([label, detail, state]) => `
          <article data-site-programs-setup-state="${escapeHtml(state)}">
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminProgramsCoveragePanel(activePrograms = [], body = {}) {
  const access = unwrap(currentData.accessAssignments) || {};
  const assignments = access.assignments || {};
  const availablePrograms = Array.isArray(body.availablePrograms) ? body.availablePrograms : [];
  const programTeacherAssignments = Array.isArray(assignments.programTeacherProgram) ? assignments.programTeacherProgram : [];
  const assignedProgramIds = new Set(programTeacherAssignments.map((row) => row.programId).filter(Boolean));
  const gaps = activePrograms.filter((program) => !assignedProgramIds.has(program.programId || program.id || ""));
  const firstAction = gaps.length && availableSectionIdsForAnyMode().has("adminAssignments")
    ? { label: "Open assignments", section: "adminAssignments" }
    : availablePrograms.length
      ? { label: "Review add form", section: "programs" }
      : { label: "Review reports", section: availableSectionIdsForAnyMode().has("adminReports") ? "adminReports" : "programs" };
  return `
    <section class="workspace-admin-program-coverage" data-admin-program-coverage="true" aria-label="Program coverage">
      <article>
        <span>School context</span>
        <strong>${escapeHtml(body.scope?.siteName || "Current school")}</strong>
        <small>${escapeHtml(body.scope?.schoolYear || "Current school year")}</small>
      </article>
      <article>
        <span>Active programs</span>
        <strong>${escapeHtml(String(activePrograms.length))}</strong>
        <small>${escapeHtml(`${programTeacherAssignments.length} Program Teacher ${pluralize(programTeacherAssignments.length, "assignment")}`)}</small>
      </article>
      <article class="${availablePrograms.length ? "warning" : "ready"}">
        <span>Available to add</span>
        <strong>${escapeHtml(String(availablePrograms.length))}</strong>
        <small>${escapeHtml(availablePrograms.length ? "Add only programs that belong to this school." : "Every available active program is already mapped.")}</small>
      </article>
      <article class="${gaps.length ? "warning" : "ready"}">
        <span>Coverage issues</span>
        <strong>${escapeHtml(String(gaps.length))}</strong>
        <small>${escapeHtml(gaps.length ? "Confirm Program Teacher access in Assignments." : "No Program Teacher gaps in current assignments.")}</small>
      </article>
      <article class="workspace-admin-program-first-action ${gaps.length || availablePrograms.length ? "warning" : "ready"}" data-admin-program-first-action="${escapeHtml(gaps[0]?.programId || gaps[0]?.id || availablePrograms[0]?.programId || "clear")}">
        <span>First program action</span>
        <strong>${escapeHtml(gaps.length ? "Confirm Program Teacher coverage" : availablePrograms.length ? "Review available program mappings" : "Program setup is clear")}</strong>
        <small>${escapeHtml(gaps.length
          ? `${cleanDemoSeedDisplay(gaps[0]?.programName, "A program")} needs Program Teacher access confirmed.`
          : availablePrograms.length
            ? `${availablePrograms.length} active ${pluralize(availablePrograms.length, "program")} can be added if they belong to this school.`
            : "No active program mapping or Program Teacher coverage issue is first in line.")}</small>
        ${renderAdminActionControl(firstAction, "workspace-link-button workspace-link-button-small", "program-first")}
      </article>
    </section>
  `;
}

function renderSiteProgramsSelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="site-programs-selection-required">
      <p class="workspace-kicker">Programs</p>
      <h2>Select a site before managing school programs</h2>
      <p>This account can manage more than one school. Choose the school workspace before reviewing active program mappings or saving program changes.</p>
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
          owner: "School Admin or platform support.",
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
  const scopeLabel = studentDirectoryScopeLabel(scope, readOnly);
  const detailSource = cleanWorkspaceSection(siteStudentDetailState?.sourceSection || "") || "students";
  const showFocusedStudentDetail = Boolean(siteStudentDetailState?.studentId) && detailSource === "students";
  const directoryFilterContent = `
    ${renderStudentDirectorySavedFilterChips(directory)}
    ${renderStudentDirectoryFilterBar(directory)}
    ${renderStudentDirectoryActiveFilters(filters, directory.filterOptions || {})}
    ${renderStudentDirectoryResultSummary(directory)}
  `;
  const directoryRowsContent = `
    ${renderSiteStudentDetailSurface(directory)}
    ${students.length ? renderStudentRows(students, readOnly, directory.permissions || {}, scope) : renderStudentDirectoryEmptyState(directory)}
  `;
  const directoryListContent = `
    ${renderStudentDirectoryStartHere(directory)}
    ${directoryFilterContent}
    ${directoryRowsContent}
  `;

  if (showFocusedStudentDetail) {
    return `
      <section class="workspace-command-center workspace-student-directory workspace-student-detail-screen" data-student-directory-detail-screen="true" aria-label="Student detail">
        ${renderSiteStudentDetailSurface(directory)}
        <details class="workspace-student-directory-return-list" data-student-directory-return-controls="true">
          <summary>Show student list</summary>
          ${readOnly ? renderReadOnlyBanner() : ""}
          ${directoryListContent}
        </details>
      </section>
    `;
  }

  if (readOnly) {
    return `
      <section class="workspace-command-center workspace-student-directory workspace-viewer-directory-flow" data-viewer-directory-flow="true" aria-labelledby="siteStudentsTitle">
        <div class="workspace-command-hero workspace-viewer-directory-hero">
          <div>
            <p class="workspace-kicker">Students</p>
            <h1 id="siteStudentsTitle">Students</h1>
            <p>Find a student by picking one group, then open one record to read context.</p>
          </div>
          <div class="workspace-command-hero-grid">
            <span class="workspace-chip">Read-only</span>
            <span class="workspace-chip">${escapeHtml(scope.siteName || "Assigned school")}</span>
          </div>
        </div>
        ${renderStudentDirectoryStartHere(directory)}
        ${directoryRowsContent}
        <details class="workspace-viewer-readonly-rules" data-viewer-readonly-rules="true">
          <summary>Read-only rules</summary>
          ${renderReadOnlyBanner({ includeEscalation: false })}
        </details>
        <details class="workspace-student-directory-return-list" data-student-directory-secondary-controls="true">
          <summary>Search and filters</summary>
          ${directoryFilterContent}
        </details>
      </section>
    `;
  }

  return `
    <section class="workspace-command-center workspace-student-directory" aria-labelledby="siteStudentsTitle">
      ${renderSiteContextBlock(directory)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Students</p>
          <h1 id="siteStudentsTitle">Students</h1>
          <p>Find a student or start with work that needs attention.</p>
        </div>
        <div class="workspace-command-hero-grid">
          ${statusPill(readOnly ? "configured" : "approved")}
          <span class="workspace-chip">${escapeHtml(scopeLabel)}</span>
        </div>
      </div>
      ${directoryListContent}
    </section>
  `;
}

function studentDirectoryScopeLabel(scope = {}, readOnly = false) {
  const role = normalizeStatus(scope.role || "");
  if (readOnly) return "Read-only view.";
  if (role === "program_teacher") return "Only students in your program are shown.";
  if (role === "mentor" || role === "viewer") return "Only your students are shown.";
  if (scope.siteName) return "Only students at this school are shown.";
  return "Only students you can view are shown.";
}

function renderStudentDirectoryStartHere(directory = {}) {
  const summary = directory.summary || {};
  const students = Array.isArray(directory.students) ? directory.students : [];
  const filters = directory.filters || {};
  const permissions = directory.permissions || {};
  const canSeeSetup = Boolean(permissions.canManageMentorAssignments);
  const actions = [
    {
      id: "review",
      label: "Review work waiting for you",
      count: studentDirectoryMapCount(summary, students, ["needsReview", "submitted"], (student) => normalizeStatus(student?.reviewStatus) === "needs_review" || normalizeStatus(student?.latestSubmissionStatus) === "submitted"),
      detail: "Open students whose work is ready for a teacher decision.",
      preset: "needs-review-students",
      tone: "teacher",
    },
    {
      id: "changes",
      label: "Help students who need changes",
      count: studentDirectoryMapCount(summary, students, ["revisionRequested", "needsRevision"], (student) => normalizeStatus(student?.latestSubmissionStatus) === "revision_requested" || normalizeStatus(student?.reviewStatus) === "needs_revision"),
      detail: "Find students who need to fix and send work again.",
      preset: "revision-students",
      tone: "warning",
    },
    {
      id: "missing-work",
      label: "Find students missing work",
      count: studentDirectoryMapCount(summary, students, ["evidenceMissing", "missingEvidence"], (student) => normalizeStatus(student?.evidenceStatus) === "missing"),
      detail: "Open students who need to add the work a teacher must review.",
      preset: "missing-evidence-students",
      tone: "evidence",
    },
    {
      id: "presentation",
      label: "Check students ready for presentation",
      count: studentDirectoryMapCount(summary, students, ["presentationPending"], (student) => normalizeStatus(student?.presentationStatus) === "pending"),
      detail: "See who needs help before presentation day.",
      preset: "presentation-pending-students",
      tone: "presentation",
    },
    {
      id: "missing-mentor",
      label: "Find students missing a mentor",
      count: canSeeSetup ? studentDirectoryMapCount(summary, students, ["noMentor", "missingMentor", "studentsNoMentor"], (student) => Boolean(student?.hasActiveMentor) === false || !cleanDirectoryFilter(student?.mentorUserId || "")) : 0,
      detail: "Assign or confirm mentor support.",
      preset: "missing-mentors",
      tone: "mentor",
    },
    {
      id: "final-files-help",
      label: "Help with final files",
      count: studentDirectoryMapCount(summary, students, ["archiveFailed"], (student) => normalizeStatus(student?.archiveStatus) === "failed"),
      detail: "Open students whose final files need staff help.",
      preset: "archive-failed-students",
      tone: "blocked",
    },
    {
      id: "ready",
      label: "Ready for final review",
      count: studentDirectoryMapCount(summary, students, ["archiveReady", "readyComplete"], (student) => normalizeStatus(student?.archiveStatus) === "ready" || normalizeStatus(student?.progressStatus) === "ready_complete"),
      detail: "See students who are close to done.",
      preset: "archive-ready-students",
      tone: "ready",
    },
    {
      id: "needs-help-soon",
      label: "Needs help soon",
      count: studentDirectoryMapCount(summary, students, ["highRisk"], (student) => normalizeStatus(student?.risk) === "high" || normalizeStatus(student?.riskLevel) === "high" || (Array.isArray(student?.riskFlags) && student.riskFlags.includes("high"))),
      detail: "Start with students who need staff attention soon.",
      preset: "high-risk-students",
      tone: "danger",
    },
  ];
  const nonzeroActions = actions.filter((action) => safeNumber(action.count) > 0);
  const activeAction = actions.find((action) => studentDirectoryPresetMatchesFilters(action.preset, filters));
  const visibleActions = [
    ...(activeAction && safeNumber(activeAction.count) > 0 ? [activeAction] : []),
    ...nonzeroActions.filter((action) => action.id !== activeAction?.id),
  ].slice(0, 3);
  const hasActions = visibleActions.length > 0;
  return `
    <section class="workspace-student-directory-start" data-student-directory-start-here="true" aria-labelledby="studentDirectoryStartTitle">
      <div class="workspace-student-directory-start-head">
        <div>
          <strong id="studentDirectoryStartTitle">Start Here</strong>
          <p>${hasActions ? "Pick one group, then open the first student who needs attention." : "No students need attention right now."}</p>
        </div>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="all-students">
          View all students
        </button>
      </div>
      ${hasActions ? `
        <div class="workspace-student-directory-start-list">
          ${visibleActions.map((action) => {
            const active = studentDirectoryPresetMatchesFilters(action.preset, filters);
            return `
              <article class="workspace-student-directory-start-row" data-student-directory-start-action="${escapeHtml(action.id)}" data-tone="${escapeHtml(action.tone)}" data-current-filter="${active ? "true" : "false"}">
                <div class="workspace-student-directory-start-card-head">
                  <strong>${escapeHtml(action.label)}</strong>
                  <span>${safeNumber(action.count)}</span>
                </div>
                <p>${escapeHtml(action.detail)}</p>
                <button class="workspace-button workspace-button-small" type="button" data-section="students" data-section-preset="${escapeHtml(action.preset)}" aria-pressed="${active ? "true" : "false"}">
                  ${active ? "Viewing this group" : "View students"}
                </button>
              </article>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="workspace-student-directory-caught-up" data-student-directory-caught-up="true">
          <strong>You are caught up.</strong>
          <p>Search for a student or view the full list when you need someone specific.</p>
        </div>
      `}
    </section>
  `;
}

function renderStudentDirectorySavedFilterChips(directory = {}) {
  const summary = directory.summary || {};
  const filters = directory.filters || {};
  const permissions = directory.permissions || {};
  const canSeeSetup = Boolean(permissions.canManageMentorAssignments);
  const simpleFilters = [
    {
      label: "All",
      detail: `${safeNumber(summary.studentsTotal ?? directory.pagination?.total ?? directory.pagination?.filteredTotal)} students`,
      preset: "all-students",
    },
    {
      label: "Needs Review",
      detail: safeNumber(summary.needsReview ?? summary.submitted) ? `${safeNumber(summary.needsReview ?? summary.submitted)} waiting` : "Waiting for review",
      preset: "needs-review-students",
    },
    {
      label: "Needs Changes",
      detail: safeNumber(summary.revisionRequested ?? summary.needsRevision) ? `${safeNumber(summary.revisionRequested ?? summary.needsRevision)} students` : "Needs changes",
      preset: "revision-students",
    },
    {
      label: "Missing Work",
      detail: safeNumber(summary.evidenceMissing ?? summary.missingEvidence) ? `${safeNumber(summary.evidenceMissing ?? summary.missingEvidence)} students` : "Missing work",
      preset: "missing-evidence-students",
    },
    {
      label: "Ready",
      detail: safeNumber(summary.archiveReady ?? summary.readyComplete) ? `${safeNumber(summary.archiveReady ?? summary.readyComplete)} students` : "Ready for review",
      preset: "archive-ready-students",
    },
    ...(canSeeSetup ? [{
      label: "Missing Mentor",
      detail: safeNumber(summary.noMentor ?? summary.missingMentor) ? `${safeNumber(summary.noMentor ?? summary.missingMentor)} students` : "Needs mentor",
      preset: "missing-mentors",
    }] : []),
  ];
  return `
    <section class="workspace-saved-filter-chips" data-student-directory-saved-filters="true" aria-label="Simple student filters">
      <strong>Simple filters</strong>
      <div class="workspace-chip-row">
        ${simpleFilters.map((filter) => {
          const active = studentDirectoryPresetMatchesFilters(filter.preset, filters);
          return `
            <button class="workspace-link-button workspace-link-button-small" type="button" data-section="students" data-section-preset="${escapeHtml(filter.preset)}" aria-pressed="${active ? "true" : "false"}">
              ${escapeHtml(filter.label)} <span>${escapeHtml(filter.detail)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderStudentDirectoryFilterBar(directory) {
  const filters = directory.filters || {};
  const options = directory.filterOptions || {};
  return `
    <form class="workspace-filter-bar workspace-student-directory-filter-bar" id="siteStudentFilterForm" data-student-directory-filters="active" data-teacher-first-component="DropdownFilterBar">
      <label class="workspace-label">
        <span>Search students</span>
        <input class="workspace-input" name="search" value="${escapeHtml(filters.search || "")}" autocomplete="off" maxlength="80">
      </label>
      <label class="workspace-label">
        <span>Status</span>
        <select class="workspace-select" name="status">
          ${renderValueOptions(options.statuses || [], filters.status || "", "Any status", statusText)}
        </select>
      </label>
      <label class="workspace-label">
        <span>Program</span>
        <select class="workspace-select" name="programId">
          ${renderProgramFilterOptions(options.programs, filters.programId)}
        </select>
      </label>
      <details class="workspace-advanced-filters" data-student-directory-advanced-filters="true" data-teacher-first-component="AdvancedFiltersDrawer">
        <summary>More filters</summary>
        <div class="workspace-review-more-filter-grid workspace-student-directory-more-filter-grid">
        <label class="workspace-label">
          <span>Progress</span>
          <select class="workspace-select" name="progressStatus">
            ${renderValueOptions(options.progressStatuses || [], filters.progressStatus || "", "Any progress", progressStatusFilterLabel)}
          </select>
        </label>
        <label class="workspace-label">
          <span>Work</span>
          <select class="workspace-select" name="evidenceStatus">
            ${renderValueOptions(options.evidenceStatuses || [], filters.evidenceStatus || "", "Any work", studentWorkStatusFilterLabel)}
          </select>
        </label>
        <label class="workspace-label">
          <span>Review</span>
          <select class="workspace-select" name="reviewStatus">
            ${renderValueOptions(options.reviewStatuses || [], filters.reviewStatus || "", "Any review", reviewStatusFilterLabel)}
          </select>
        </label>
        <label class="workspace-checkbox-label">
          <input type="checkbox" name="noMentor" value="true" ${filters.noMentor ? "checked" : ""}>
          Missing mentor
        </label>
        <label class="workspace-label">
          <span>Needs help</span>
          <select class="workspace-select" name="risk">
            ${renderValueOptions(options.risks || [], filters.risk || "any", "Any help need", riskFilterLabel)}
          </select>
        </label>
        <label class="workspace-label">
          <span>Story</span>
          <select class="workspace-select" name="story">
            ${renderValueOptions(options.storyBuckets || [], filters.story || "", "Any story", storyLabel)}
          </select>
        </label>
        <label class="workspace-label">
          <span>Presentation</span>
          <select class="workspace-select" name="presentationStatus">
            ${renderValueOptions(options.presentationStatuses || [], filters.presentationStatus || "any", "Any presentation", presentationStatusFilterLabel)}
          </select>
        </label>
        <label class="workspace-label">
          <span>Final files</span>
          <select class="workspace-select" name="archiveStatus">
            ${renderValueOptions(options.archiveStatuses || [], filters.archiveStatus || "any", "Any final files", archiveStatusFilterLabel)}
          </select>
        </label>
        </div>
      </details>
      ${filters.cohortId ? `<input name="cohortId" type="hidden" value="${escapeHtml(filters.cohortId)}">` : ""}
      <input name="offset" type="hidden" value="${escapeHtml(filters.offset || 0)}">
      <input name="limit" type="hidden" value="${escapeHtml(filters.limit || 50)}">
      <div class="workspace-row-actions workspace-filter-actions">
        <button class="workspace-button workspace-button-primary" type="submit">Apply filters</button>
        <button class="workspace-button workspace-button-secondary" type="button" data-site-student-action="reset-filters">Clear filters</button>
      </div>
    </form>
  `;
}

function studentDirectoryRowStatus(student = {}) {
  const flags = Array.isArray(student.riskFlags) ? student.riskFlags.map(normalizeStatus) : [];
  const progress = normalizeStatus(student.progressStatus || "");
  const submission = normalizeStatus(student.latestSubmissionStatus || student.status || "");
  const review = normalizeStatus(student.reviewStatus || "");
  const proof = normalizeStatus(student.evidenceStatus || "");
  const presentation = normalizeStatus(student.presentationStatus || "");
  const archive = normalizeStatus(student.archiveStatus || "");
  if (student.hasActiveMentor === false || flags.includes("no_mentor") || progress === "missing_mentor") return "Missing mentor.";
  if (submission === "submitted" || review === "needs_review") return "Work is waiting for review.";
  if (submission === "revision_requested" || review === "needs_revision") return "Needs changes.";
  if (proof === "missing" || progress === "missing_evidence") return "Missing work.";
  if (presentation === "pending") return "Ready for presentation check.";
  if (archive === "failed" || archive === "provider_unavailable") return "Final files need help.";
  if (archive === "ready" || progress === "ready_complete") return "Ready for final review.";
  if (flags.includes("high")) return "Needs help soon.";
  return "On track.";
}

function studentDirectoryRowHelperLabel(helper = "") {
  const value = String(helper || "").trim();
  if (!value) return "Assigned staff";
  return value
    .replace(/^Site Admin\b/g, "Site staff")
    .replace(/\bProgram Teacher\b/g, "teacher")
    .replace(/\bAssigned staff\b/g, "assigned staff")
    .replace(/\bStudent\b/g, "student");
}

function studentDirectoryRowNextStep(action = "") {
  return String(action || "")
    .replace(/\bOpen Mentor Assignments and assign coverage before the next check-in\./g, "Assign a mentor before the next check-in.")
    .replace(/\bOpen Review Work, check proof and history, then record one decision\./g, "Review the work and leave one decision.")
    .replace(/\bOpen Review Work, check work and history, then record one decision\./g, "Review the work and leave one decision.")
    .replace(/\bStudent revises the matching item; Program Teacher reviews only after it is sent again\./g, "Ask the student to fix the work and send it again.")
    .replace(/\bStudent adds proof to the matching checklist item before review can move forward\./g, "Ask the student to add the missing work.")
    .replace(/\bStudent adds work to the matching checklist item before review can move forward\./g, "Ask the student to add the missing work.")
    .replace(/\bOpen Operations or Presentation readiness and confirm the outline or schedule blocker\./g, "Check the presentation plan or schedule.")
    .replace(/\bOpen Operations final-file rows and resolve the export or storage blocker\./g, "Fix the final file problem before closeout.")
    .replace(/\brecord\b/gi, "profile")
    .replace(/\bblocker\b/gi, "problem");
}

function studentDirectoryMapCount(summary = {}, students = [], keys = [], predicate = null) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(summary, key)) return safeNumber(summary[key]);
  }
  if (typeof predicate !== "function") return 0;
  return students.filter(predicate).length;
}

function studentDirectoryPresetMatchesFilters(preset, filters = {}) {
  if (preset === "all-students") return !hasActiveSiteStudentDirectoryFilter(filters);
  if (preset === "missing-mentors") return Boolean(filters.noMentor) || normalizeStatus(filters.progressStatus) === "missing_mentor";
  if (preset === "missing-evidence-students") return normalizeStatus(filters.evidenceStatus) === "missing";
  if (preset === "needs-review-students") return normalizeStatus(filters.reviewStatus) === "needs_review";
  if (preset === "revision-students") return normalizeStatus(filters.status) === "revision_requested";
  if (preset === "high-risk-students") return normalizeStatus(filters.risk) === "high";
  if (preset === "mentor-meeting-follow-up-students") return normalizeStatus(filters.progressStatus) === "mentor_meeting_follow_up";
  if (preset === "presentation-pending-students") return normalizeStatus(filters.presentationStatus) === "pending";
  if (preset === "archive-ready-students") return normalizeStatus(filters.archiveStatus) === "ready";
  if (preset === "archive-failed-students") return normalizeStatus(filters.archiveStatus) === "failed";
  return false;
}

function hasActiveSiteStudentDirectoryFilter(filters = {}) {
  const directKeys = ["search", "programId", "cohortId", "status", "progressStatus", "evidenceStatus", "reviewStatus", "story"];
  if (directKeys.some((key) => cleanDirectoryFilter(filters[key] || ""))) return true;
  if (Boolean(filters.noMentor)) return true;
  if (normalizeStatus(filters.risk || "any") !== "any") return true;
  if (normalizeStatus(filters.presentationStatus || "any") !== "any") return true;
  if (normalizeStatus(filters.archiveStatus || "any") !== "any") return true;
  return false;
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

function renderStudentRows(students = [], readOnly = false, permissions = {}, scope = {}) {
  return `
    <div class="workspace-student-list" aria-label="Student directory rows">
      ${students.map((student) => renderStudentRow(student, readOnly, permissions, scope)).join("")}
    </div>
  `;
}

function renderStudentRow(student, readOnly = false, permissions = {}, scope = {}) {
  const canRemoveStudent = !readOnly && permissions.canManageSiteUsers && student.studentId && scope.siteId;
  const guidance = studentDirectoryRowGuidance(student, readOnly);
  const helper = studentDirectoryRowHelperLabel(guidance.owner);
  const nextStep = studentDirectoryRowNextStep(guidance.nextAction);
  const moreMenu = renderStudentDirectoryRowMoreMenu(student, readOnly, canRemoveStudent, scope);
  const programCohort = studentProgramCohortDisplay(student, "Unassigned / No cohort");
  return `
    <article class="workspace-student-row" data-staff-student-row="true">
      <div>
        <strong>${escapeHtml(student.displayName || "Student")}</strong>
        <p>${escapeHtml(studentDirectoryRowStatus(student))}</p>
        <p class="workspace-muted">${escapeHtml(programCohort)}</p>
      </div>
      <div>
        <span class="workspace-muted">Last update</span>
        <strong>${escapeHtml(formatDate(student.lastActivityAt))}</strong>
        <p class="workspace-muted">Mentor: ${escapeHtml(student.hasActiveMentor ? (student.mentorName || "Assigned") : "Missing mentor")}</p>
      </div>
      <div class="workspace-owner-action" data-student-directory-row-guidance="true" data-student-directory-helper="${escapeHtml(guidance.owner)}">
        <span>Who can help: ${escapeHtml(helper)}</span>
        <small>Next step: ${escapeHtml(nextStep)}</small>
      </div>
      <div class="workspace-row-actions">
        <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(student.studentId || "")}" data-student-detail-source-section="students">
          Open Student
        </button>
        ${moreMenu}
        ${readOnly ? `<span class="workspace-chip" data-workspace-mode="read-only">Read-only</span>` : ""}
      </div>
    </article>
  `;
}

function renderStudentDirectoryRowMoreMenu(student, readOnly = false, canRemoveStudent = false, scope = {}) {
  const viewAsStudentAction = renderViewAsStudentAction(student.studentId, student.displayName, { sourceSection: "students" });
  const removalForm = canRemoveStudent ? `
        <form class="workspace-inline-action-form" data-site-student-remove-form="true" data-site-student-id="${escapeHtml(student.studentId || "")}">
          <input type="hidden" name="siteId" value="${escapeHtml(scope.siteId || "")}">
          ${renderDestructiveActionConfirmation({
            id: "student-remove",
            label: "I reviewed what student removal does for this student.",
            detail: "This archives the school membership, keeps project history, and may disable sign-in if no other school access remains.",
          })}
          <label class="workspace-label">
            Admin note
            <input class="workspace-input" name="adminNote" maxlength="500" required>
          </label>
          <button class="workspace-button workspace-button-secondary" type="submit">Remove student</button>
        </form>
      ` : "";
  const actions = [viewAsStudentAction, removalForm].filter((action) => String(action || "").trim());
  if (!actions.length) return "";
  return renderTeacherFirstMoreActions({
    id: `student-row-${student.studentId || "student"}`,
    actions,
    dataAttrs: 'data-student-row-more-menu="true"',
    ariaLabel: `More actions for ${student.displayName || "student"}`,
  });
}

function studentDirectoryRowGuidance(student = {}, readOnly = false) {
  const flags = Array.isArray(student.riskFlags) ? student.riskFlags.map(normalizeStatus) : [];
  const progress = normalizeStatus(student.progressStatus || "");
  const submission = normalizeStatus(student.latestSubmissionStatus || student.status || "");
  const review = normalizeStatus(student.reviewStatus || "");
  const proof = normalizeStatus(student.evidenceStatus || "");
  const presentation = normalizeStatus(student.presentationStatus || "");
  const archive = normalizeStatus(student.archiveStatus || "");
  const fallback = String(student.nextAction || "").trim() || "Open student detail and confirm the current problem.";
  if (readOnly) {
    return {
      owner: "Assigned staff",
      nextAction: "Use this row for context, then share the student name with authorized staff.",
    };
  }
  if (student.hasActiveMentor === false || flags.includes("no_mentor") || progress === "missing_mentor") {
    return {
      owner: "Site Admin or Program Teacher",
      nextAction: "Open Mentor Assignments and assign coverage before the next check-in.",
    };
  }
  if (submission === "submitted" || review === "needs_review") {
    return {
      owner: "Program Teacher",
      nextAction: "Open Review Work, check work and history, then record one decision.",
    };
  }
  if (submission === "revision_requested" || review === "needs_revision") {
    return {
      owner: "Student with Program Teacher support",
      nextAction: "Student revises the matching item; Program Teacher reviews only after it is sent again.",
    };
  }
  if (proof === "missing" || progress === "missing_evidence") {
    return {
      owner: "Student",
      nextAction: "Student adds work to the matching checklist item before review can move forward.",
    };
  }
  if (presentation === "pending" || presentation === "missing") {
    return {
      owner: "Program Teacher or site staff",
      nextAction: "Open Operations or Presentation readiness and confirm the outline or schedule blocker.",
    };
  }
  if (archive === "failed" || archive === "provider_unavailable") {
    return {
      owner: "Site Admin",
      nextAction: "Open Operations final-file rows and resolve the export or storage blocker.",
    };
  }
  return {
    owner: "Assigned staff",
    nextAction: fallback,
  };
}
function renderStudentDirectoryActiveFilters(filters = {}, options = {}) {
  const chips = [];
  if (filters.search) chips.push(activeFilterChip("Search", filters.search));
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.cohortId) chips.push(activeFilterChip("Cohort", cohortLabel(options.cohorts, filters.cohortId)));
  if (filters.status) chips.push(activeFilterChip("Status", statusText(filters.status)));
  if (filters.progressStatus) chips.push(activeFilterChip("Progress", progressStatusFilterLabel(filters.progressStatus)));
  if (filters.evidenceStatus) chips.push(activeFilterChip("Evidence", evidenceStatusFilterLabel(filters.evidenceStatus)));
  if (filters.reviewStatus) chips.push(activeFilterChip("Review", reviewStatusFilterLabel(filters.reviewStatus)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Needs help", riskFilterLabel(filters.risk)));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.presentationStatus && filters.presentationStatus !== "any") chips.push(activeFilterChip("Presentation", statusText(filters.presentationStatus)));
  if (filters.archiveStatus && filters.archiveStatus !== "any") chips.push(activeFilterChip("Final files", archiveStatusFilterLabel(filters.archiveStatus)));
  if (filters.noMentor) chips.push(activeFilterChip("Mentor", "Missing mentor assignment"));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Student directory", chips, 'data-site-student-action="reset-filters"', filters.noMentor
    || filters.progressStatus === "missing_mentor"
    ? {
        heading: "Showing students missing mentors",
        note: "Only students without an active mentor assignment are listed.",
      }
    : filters.progressStatus === "mentor_meeting_follow_up"
    ? {
        heading: "Showing mentor meeting follow-up",
        note: "Only students with missed or make-up-required mentor meetings are listed.",
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
  const noResults = returned === 0;
  return `
    <section class="workspace-card workspace-directory-summary" aria-label="Student directory results">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Results</p>
          <h2>${noResults
            ? "No students match those filters"
            : filters.noMentor
            ? `Showing ${escapeHtml(returned)} of ${escapeHtml(filteredTotal)} students missing mentors`
            : `${escapeHtml(returned)} of ${escapeHtml(filteredTotal)} students shown`}</h2>
          <p class="workspace-muted">${noResults
            ? "Clear filters or try another search to see students this account can access."
            : filters.noMentor
            ? "The list is filtered to students without active mentor assignments in the current school."
            : "Returned rows respect pagination; total and filtered totals stay tied to the selected school or program."}</p>
        </div>
        <span class="workspace-site-context-badge">${escapeHtml(total)} total available</span>
      </div>
      <div class="workspace-directory-pagination">
        <button class="workspace-button workspace-button-secondary" type="button" data-site-student-action="previous-page" ${offset <= 0 ? "disabled" : ""}>Previous</button>
        <span class="workspace-muted">Offset ${escapeHtml(offset)} / Limit ${escapeHtml(limit)}</span>
        <button class="workspace-button workspace-button-secondary" type="button" data-site-student-action="next-page" ${(offset + returned) >= filteredTotal ? "disabled" : ""}>Next</button>
      </div>
    </section>
  `;
}

function renderStudentDirectoryEmptyState(directory) {
  const emptyState = directory.emptyState || {};
  const filters = directory.filters || {};
  const options = directory.filterOptions || {};
  const copy = studentDirectoryEmptyStateCopy(filters, options, emptyState);
  return `
    <section class="workspace-empty-state-card" data-student-directory-empty="true">
      <strong>${escapeHtml(copy.heading)}</strong>
      <div class="workspace-problem-state workspace-student-directory-empty-guidance">
        <span>Why: ${escapeHtml(copy.reason)}</span>
        <span>Who can help: ${escapeHtml(studentDirectoryRowHelperLabel(copy.owner))}</span>
        <span>Next step: ${escapeHtml(studentDirectoryRowNextStep(copy.nextAction))}</span>
      </div>
    </section>
  `;
}

function hasActiveStudentDirectoryFilters(filters = {}) {
  return Boolean(
    filters.search
    || filters.programId
    || filters.cohortId
    || filters.status
    || filters.progressStatus
    || filters.evidenceStatus
    || filters.reviewStatus
    || filters.noMentor
    || (filters.risk && filters.risk !== "any")
    || filters.story
    || (filters.presentationStatus && filters.presentationStatus !== "any")
    || (filters.archiveStatus && filters.archiveStatus !== "any")
  );
}

function studentDirectoryEmptyStateCopy(filters = {}, options = {}, emptyState = {}) {
  const owner = emptyState.owner || "Assigned staff or site administrator.";
  if (!hasActiveStudentDirectoryFilters(filters)) {
    return {
      heading: "No students need attention right now",
      reason: emptyState.reason || "No students are currently in this list.",
      owner,
      nextAction: emptyState.nextAction || "View all students or check the school or program assignment.",
    };
  }
  if (filters.noMentor) {
    return {
      heading: "No matching students need mentors",
      reason: "No students without active mentor assignments match these filters for this school.",
      owner,
      nextAction: "Clear filters or review active mentor coverage.",
    };
  }
  if (filters.progressStatus === "on_track") {
    return {
      heading: "No matching on-track students",
      reason: "No students without urgent help needs match these filters.",
      owner,
      nextAction: "Clear filters or review the full student list.",
    };
  }
  if (filters.progressStatus === "behind") {
    return {
      heading: "No matching support list",
      reason: "No students who need help soon or have stale activity match these filters.",
      owner,
      nextAction: "Clear filters or check Missing Proof and Missing Mentor separately.",
    };
  }
  if (filters.progressStatus === "mentor_meeting_follow_up") {
    return {
      heading: "No matching mentor meeting follow-up",
      reason: "No students with missed or make-up-required mentor meetings match these filters.",
      owner,
      nextAction: "Clear filters or open student detail from another visible worklist.",
    };
  }
  if (filters.evidenceStatus === "missing" || filters.progressStatus === "missing_evidence") {
    return {
      heading: "No students are missing work here",
      reason: "No students with missing work match these filters.",
      owner,
      nextAction: "Clear filters or check Review Work for submitted work.",
    };
  }
  if (filters.reviewStatus === "needs_review" || filters.progressStatus === "needs_review") {
    return {
      heading: "No matching students need review",
      reason: "No students with submitted work awaiting review match these filters.",
      owner,
      nextAction: "Clear filters or open Review Work.",
    };
  }
  if (filters.status === "submitted") {
    return {
      heading: "No matching submitted work",
      reason: "No students with submitted work match these filters.",
      owner,
      nextAction: "Clear filters or check Review Work for broader review work.",
    };
  }
  if (filters.status === "revision_requested") {
    return {
      heading: "No matching revision follow-up",
      reason: "No students needing revision follow-up match these filters.",
      owner,
      nextAction: "Clear filters or check Review Work for current revision work.",
    };
  }
  if (filters.risk === "high") {
    return {
      heading: "No students need help soon here",
      reason: "No students in this group need urgent help.",
      owner,
      nextAction: "Clear filters or continue monitoring the full student list.",
    };
  }
  if (filters.presentationStatus === "pending") {
    return {
      heading: "No matching presentation follow-up",
      reason: "No students with pending presentation readiness match these filters.",
      owner,
      nextAction: "Clear filters or open Operations for broader presentation work.",
    };
  }
  if (filters.archiveStatus === "ready") {
    return {
      heading: "No matching final-file-ready students",
      reason: "No students ready for final-file closeout match these filters.",
      owner,
      nextAction: "Clear filters or open Operations for broader final-file work.",
    };
  }
  if (filters.archiveStatus === "failed") {
    return {
      heading: "No matching final-file follow-up",
      reason: "No students with final-file export follow-up match these filters.",
      owner,
      nextAction: "Clear filters or open Operations for final-file readiness work.",
    };
  }
  if (filters.programId) {
    const label = programLabel(options.programs, filters.programId);
    return {
      heading: "No matching students in this program",
      reason: `No visible students in ${label} match these filters.`,
      owner,
      nextAction: "Clear filters or choose another visible program.",
    };
  }
  if (filters.cohortId) {
    const label = cohortLabel(options.cohorts, filters.cohortId);
    return {
      heading: "No matching students in this cohort",
      reason: `No visible students in ${label} match these filters.`,
      owner,
      nextAction: "Clear filters or return to the broader student list.",
    };
  }
  if (filters.search) {
    return {
      heading: "No matching student search results",
      reason: "No visible students match this search and filter set.",
      owner,
      nextAction: "Clear filters or try a different student name or email.",
    };
  }
  return {
    heading: "No matching student records",
    reason: "No students match these filters for this school.",
    owner,
    nextAction: "Clear filters to see all students you can access.",
  };
}

function renderSiteStudentDetailSurface(directory) {
  const state = siteStudentDetailState || defaultSiteStudentDetailState();
  if (!state.studentId) return "";
  const selectedRow = (directory.students || []).find((student) => student.studentId === state.studentId);
  const title = selectedRow?.displayName || "Student detail";
  const returnCopy = studentDetailReturnCopy(state.sourceSection);

  if (state.loading) {
    return `
      <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="loading" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2 id="siteStudentDetailTitle">${escapeHtml(title)}</h2>
              <p class="workspace-muted" data-student-detail-return-context="${escapeHtml(returnCopy.sectionId)}">${escapeHtml(returnCopy.hint)}</p>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">${escapeHtml(returnCopy.buttonLabel)}</button>
          </div>
          ${renderProblemState({
            reason: "Loading the student record for this school.",
            owner: "Assigned staff workspace.",
            nextAction: "Keep this worklist open while the detail response returns.",
          })}
        </div>
      </aside>
    `;
  }

  if (state.result?.status === 409 && state.result.body?.selectionRequired) {
    const accessibleSites = Array.isArray(state.result.body?.accessibleSites) ? state.result.body.accessibleSites : [];
    return `
      <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="site-selection-required" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2 id="siteStudentDetailTitle">${escapeHtml(title)}</h2>
              <p class="workspace-muted" data-student-detail-return-context="${escapeHtml(returnCopy.sectionId)}">${escapeHtml(returnCopy.hint)}</p>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">${escapeHtml(returnCopy.buttonLabel)}</button>
          </div>
          <section class="workspace-empty-state-card">
            <strong>Select a site before opening student detail</strong>
            <p>This student record is protected by school access. Choose the school workspace before opening the full detail drawer.</p>
            <div class="workspace-chip-row">
              ${accessibleSites.map((site) => `
                <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
                  ${escapeHtml(site.siteName || site.siteId)}
                </button>
              `).join("")}
            </div>
          </section>
          ${renderProblemState({
            reason: "More than one assigned school is available for this protected student detail.",
            owner: "School administration or platform support.",
            nextAction: "Choose a site from the Current site menu or one of the buttons above, then reopen the student record.",
          })}
        </div>
      </aside>
    `;
  }

  if (state.result?.status === 403 && state.sourceSection === "mentorDashboard") {
    return `
      <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="mentor-unassigned" data-mentor-unassigned-denial="true" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2 id="siteStudentDetailTitle">${escapeHtml(title)}</h2>
              <p class="workspace-muted" data-student-detail-return-context="${escapeHtml(returnCopy.sectionId)}">${escapeHtml(returnCopy.hint)}</p>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">${escapeHtml(returnCopy.buttonLabel)}</button>
          </div>
          <section class="workspace-empty-state-card">
            <strong>This student is not assigned to your mentor account</strong>
            <p>Mentors can open full detail only for students with an active mentor assignment. This protects private proof, Program Teacher feedback, and school records.</p>
            ${renderProblemState({
              reason: "The requested student is not assigned to your active mentor roster.",
              owner: "Site administration or Program Teacher.",
              nextAction: "Return to Mentor Dashboard and choose an assigned student, or ask the site team to update mentor coverage.",
            })}
          </section>
        </div>
      </aside>
    `;
  }

  const detail = unwrap(state.result);
  if (!detail) {
    return `
      <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="error" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
        <div class="workspace-detail-panel">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Student detail</p>
              <h2 id="siteStudentDetailTitle">${escapeHtml(title)}</h2>
              <p class="workspace-muted" data-student-detail-return-context="${escapeHtml(returnCopy.sectionId)}">${escapeHtml(returnCopy.hint)}</p>
            </div>
            <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">${escapeHtml(returnCopy.buttonLabel)}</button>
          </div>
          ${renderApiNotice(state.result)}
          ${renderProblemState({
            reason: "This student detail is unavailable for the current school assignment.",
            owner: "School Admin or platform support.",
            nextAction: "Use the visible rows or confirm the current school assignment.",
          })}
        </div>
      </aside>
    `;
  }

  const scope = detail.scope || {};
  const student = detail.student || {};
  const activeTab = cleanStudentDetailTab(state.activeTab) || "overview";
  const riskFlags = Array.isArray(student.riskFlags) ? student.riskFlags : [];
  const plan = studentDetailCasePlan(detail, scope);
  const plainStatus = studentDetailPlainStatus(detail, plan);
  const primaryAction = studentDetailPrimaryAction(detail, scope, plainStatus);
  const programName = studentProgramDisplay(student);
  const cohortName = studentCohortDisplay(student);
  const profileFacts = `
    <span class="workspace-site-context-badge" data-student-detail-site="${escapeHtml(scope.siteName || directory.scope?.siteName || "Selected school")}">${escapeHtml(scope.siteName || directory.scope?.siteName || "Selected school")}</span>
    <span class="workspace-site-context-badge" data-student-detail-program="${escapeHtml(programName)}">${escapeHtml(programName)}</span>
    <span class="workspace-site-context-badge" data-student-detail-cohort="${escapeHtml(cohortName)}">${escapeHtml(cohortName)}</span>
    <span class="workspace-site-context-badge" data-student-detail-year="${escapeHtml(student.graduationYear || "")}">${escapeHtml(studentRosterProfileText(student))}</span>
    ${scope.readOnly ? `<span class="workspace-chip" data-workspace-mode="read-only">Read-only viewer</span>` : ""}
  `;
  return `
    <aside id="siteStudentDetailPanel" class="workspace-detail-drawer" data-student-detail-panel="true" data-student-detail-state="ready" data-student-detail-id="${escapeHtml(student.studentId || state.studentId)}" aria-labelledby="siteStudentDetailTitle" tabindex="-1">
      <div class="workspace-detail-panel">
        <div class="workspace-card-head workspace-student-detail-header" data-student-detail-header="true">
          <div>
            <p class="workspace-kicker">Student</p>
            <h2 id="siteStudentDetailTitle">${escapeHtml(student.displayName || title)}</h2>
            <p class="workspace-muted" data-student-detail-context-line="true">${escapeHtml(studentDetailContextLine(student, scope, directory))}</p>
            ${student.email ? `<p class="workspace-muted">${escapeHtml(student.email)}</p>` : ""}
            <p class="workspace-muted" data-student-detail-return-context="${escapeHtml(returnCopy.sectionId)}">${escapeHtml(returnCopy.hint)}</p>
            <div class="workspace-student-detail-status-row" data-student-detail-status-summary="true">
              <span class="workspace-student-detail-status ${escapeHtml(plainStatus.tone)}" data-student-detail-simple-status="${escapeHtml(plainStatus.state)}">${escapeHtml(plainStatus.label)}</span>
              <span>${escapeHtml(plainStatus.detail)}</span>
            </div>
          </div>
          <div class="workspace-row-actions workspace-student-detail-actions">
            <button class="workspace-button workspace-button-primary workspace-button-small" type="button" data-student-detail-tab="${escapeHtml(primaryAction.tab)}" data-student-detail-primary-action="${escapeHtml(primaryAction.id)}">
              ${escapeHtml(primaryAction.label)}
            </button>
            ${renderTeacherFirstMoreActions({
              id: `student-detail-${student.studentId || state.studentId || "selected"}`,
              className: "workspace-student-detail-more-actions",
              actions: [
                renderViewAsStudentAction(student.studentId || state.studentId, student.displayName || title, { sourceSection: state.sourceSection || "students" }),
                `<button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="close">${escapeHtml(returnCopy.buttonLabel)}</button>`,
              ],
              dataAttrs: 'data-student-detail-more-actions="true"',
              ariaLabel: `More actions for ${student.displayName || title}`,
            })}
          </div>
        </div>
        ${renderStudentDetailMoreContext(detail, scope, riskFlags, profileFacts)}
        ${renderStudentDetailCasePlan(detail, scope, plan)}
        ${scope.readOnly ? `
          <section class="workspace-read-only-banner" data-student-detail-read-only="true" data-workspace-mode="read-only">
            <span class="workspace-chip workspace-role-chip">Read-only viewer</span>
            <p>You can view this student for context, but approvals, assignments, evidence changes, and access changes stay with authorized staff.</p>
          </section>
        ` : ""}
        ${renderStudentDetailTabs(activeTab)}
        ${renderStudentDetailTab(detail, activeTab, state)}
      </div>
    </aside>
  `;
}

function renderStudentDetailTabs(activeTab) {
  const tabs = [
    ["overview", "Overview"],
    ["work", "Work"],
    ["feedback", "Feedback"],
    ["evidence", "Evidence"],
    ["timeline", "Timeline"],
  ];
  return `
    <div class="workspace-detail-tabs" role="tablist" aria-label="Student detail sections">
      ${tabs.map(([id, label]) => {
        const selected = activeTab === id;
        return `
        <button id="${escapeHtml(studentDetailTabId(id))}" class="workspace-detail-tab ${selected ? "is-active" : ""}" type="button" role="tab" data-student-detail-tab="${escapeHtml(id)}" aria-selected="${selected ? "true" : "false"}" aria-controls="${escapeHtml(studentDetailPanelId(id))}">
          ${escapeHtml(label)}
        </button>
      `;
      }).join("")}
    </div>
  `;
}

function studentDetailTabId(tabId = "overview") {
  return `studentDetailTab-${tabId}`;
}

function studentDetailPanelId(tabId = "overview") {
  return `studentDetailPanel-${tabId}`;
}

function studentDetailPanelAttrs(tabId = "overview", alias = "") {
  const aliasAttr = alias ? ` data-student-detail-alias="${escapeHtml(alias)}"` : "";
  return `id="${escapeHtml(studentDetailPanelId(tabId))}" role="tabpanel" aria-labelledby="${escapeHtml(studentDetailTabId(tabId))}" tabindex="0" data-student-detail-section="${escapeHtml(tabId)}"${aliasAttr}`;
}

function studentDetailContextLine(student = {}, scope = {}, directory = {}) {
  const parts = [
    studentProgramDisplay(student, ""),
    studentCohortDisplay(student, ""),
    student.graduationYear ? `Class of ${student.graduationYear}` : "",
  ].map((part) => String(part || "").trim()).filter(Boolean);
  if (parts.length) return parts.join(" - ");
  return scope.siteName || directory.scope?.siteName || "Selected school";
}

function studentDetailPlainStatus(detail = {}, plan = null) {
  const student = detail.student || {};
  const progress = detail.progress || {};
  const latestSubmission = latestStudentDetailSubmission(detail);
  const latestReview = latestStudentDetailReview(detail);
  const decision = normalizeStatus(latestReview?.decision || latestReview?.status || student.reviewStatus || "");
  const status = normalizeStatus(latestSubmission?.status || student.latestSubmissionStatus || student.status || progress.status || "");
  const flags = studentDetailAttentionFlags(detail);
  if (decision === "revision_requested" || status === "revision_requested") {
    return {
      state: "needs_changes",
      label: "Needs changes",
      detail: "Student should read feedback, fix the work, and send it again.",
      tone: "warning",
    };
  }
  if (status === "submitted" || status === "under_review" || decision === "under_review") {
    return {
      state: "needs_review",
      label: "Needs review",
      detail: "Work is waiting for a Program Teacher decision.",
      tone: "review",
    };
  }
  if (flags.some((flag) => ["missing_evidence", "evidence_missing", "missing_work"].includes(flag.key)) || normalizeStatus(student.evidenceStatus) === "missing") {
    return {
      state: "missing_work",
      label: "Missing work",
      detail: "Student needs to add the missing file or proof.",
      tone: "danger",
    };
  }
  if (status === "approved" || status === "complete" || decision === "approved") {
    return {
      state: "on_track",
      label: "On track",
      detail: "No urgent review item is open right now.",
      tone: "ready",
    };
  }
  const fallback = plan?.currentStatus || statusText(status || "pending");
  return {
    state: "no_status",
    label: fallback === "Pending" ? "No status yet" : fallback,
    detail: "No current review status is confirmed yet.",
    tone: "quiet",
  };
}

function studentDetailPrimaryAction(detail = {}, scope = {}, plainStatus = {}) {
  if (scope.readOnly) return { id: "view-work", label: "View work", tab: "work" };
  if (plainStatus.state === "needs_changes") return { id: "open-feedback", label: "Open feedback", tab: "feedback" };
  if (plainStatus.state === "needs_review") return { id: "open-work", label: "Open work", tab: "work" };
  if (plainStatus.state === "missing_work") return { id: "check-files", label: "Check files", tab: "evidence" };
  return { id: "view-work", label: "View work", tab: "work" };
}

function renderStudentDetailMoreContext(detail = {}, scope = {}, riskFlags = [], profileFacts = "") {
  const student = detail.student || {};
  const presentation = detail.presentation || {};
  const archive = detail.archive || {};
  const chips = [
    student.mentorName ? `<span class="workspace-site-context-badge">Mentor: ${escapeHtml(student.mentorName)}</span>` : "",
    student.viewerName ? `<span class="workspace-site-context-badge">Viewer: ${escapeHtml(student.viewerName)}</span>` : "",
    statusPill(student.status || "draft"),
    statusPill(presentation.status || student.presentationStatus || "missing"),
    statusPill(archive.status || student.archiveStatus || "missing"),
    student.storyBucket ? `<span class="workspace-story-chip">${escapeHtml(storyLabel(student.storyBucket))}</span>` : "",
    riskFlags.length ? riskFlags.map((flag) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(flag))}</span>`).join("") : `<span class="workspace-risk-chip">No urgent risk shown</span>`,
  ].filter(Boolean).join("");
  return `
    <details class="workspace-student-detail-more-context" data-student-detail-more-context="true">
      <summary>Student details</summary>
      ${profileFacts ? `<div class="workspace-chip-row workspace-student-detail-facts" data-student-detail-facts="true">${profileFacts}</div>` : ""}
      <div class="workspace-chip-row">${chips}</div>
    </details>
  `;
}

function renderStudentDetailTab(detail, activeTab, state) {
  if (activeTab === "work") return renderStudentDetailWork(detail);
  if (activeTab === "evidence") return renderStudentDetailEvidence(detail);
  if (activeTab === "feedback") return renderStudentDetailReviews(detail);
  if (activeTab === "timeline") return renderStudentDetailTimeline(detail, state);
  return renderStudentDetailSummary(detail);
}

function renderStudentDetailSummary(detail) {
  const student = detail.student || {};
  const mentor = detail.mentor || {};
  const progress = detail.progress || {};
  const latestFeedback = latestStudentDetailFeedback(detail);
  const progressFacts = studentDetailProgressFacts(progress);
  const plan = studentDetailCasePlan(detail, detail.scope || {});
  const approval = studentDetailPhaseApprovalStatus(detail);
  return `
    <section class="workspace-detail-section workspace-student-detail-overview-screen" ${studentDetailPanelAttrs("overview", "summary")}>
      <details class="workspace-student-detail-supporting-details" data-student-detail-overview="true">
        <summary>Show current step, recent update, and progress</summary>
        <div class="workspace-student-detail-overview">
        ${renderStudentDetailOverviewItem("next", "Start here", "What this student needs next", plan.nextAction || student.nextAction || "Open Work and check the current step.", plan.owner)}
        ${renderStudentDetailOverviewItem("step", "Current step", plan.currentStep || "Current step not confirmed yet", approval.detail, approval.label)}
        ${renderStudentDetailOverviewItem("feedback", "Recent update", latestFeedback.title, latestFeedback.text, latestFeedback.meta, { attrs: 'data-student-detail-feedback="latest"', status: latestFeedback.status })}
        ${renderStudentDetailOverviewItem("support", "Staff support", mentor.active ? mentor.mentorName || "Assigned mentor" : "No active mentor", mentor.nextAction || "Check whether this student needs staff support.", mentor.active ? "Mentor assigned" : "Coverage needed", { status: mentor.active ? "approved" : "blocked" })}
        ${renderStudentDetailOverviewItem("progress", "Progress", progressFacts.workItemsText, `${progressFacts.percentText} / ${progressFacts.stageText}`, "", { status: progress.blockedReasons?.length ? "blocked" : progressFacts.hasConfirmedTotals ? "ready" : "pending" })}
        </div>
      </details>
    </section>
  `;
}

function renderStudentDetailOverviewItem(id, kicker, title, detail = "", meta = "", options = {}) {
  return `
    <article class="workspace-student-detail-overview-item" data-student-detail-overview-item="${escapeHtml(id)}" ${options.attrs || ""}>
      <span>${escapeHtml(kicker)}</span>
      <strong>${escapeHtml(title || "Not confirmed yet")}</strong>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
      ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
      ${options.status ? statusPill(options.status) : ""}
    </article>
  `;
}

function studentDetailProgressFacts(progress = {}) {
  const total = safeNumber(progress.requirementsTotal);
  const complete = safeNumber(progress.requirementsComplete);
  const rawPercent = Number(progress.percentComplete);
  const hasPercent = Number.isFinite(rawPercent);
  const stage = String(progress.currentStage || "").trim();
  return {
    hasConfirmedTotals: total > 0,
    workItemsText: total > 0
      ? `${Math.min(complete, total)} of ${total} work items done.`
      : "Work item total is not confirmed yet.",
    percentText: hasPercent ? `${clampPercent(rawPercent)}% complete` : "Progress percent not confirmed yet",
    stageText: stage || "Current stage not confirmed yet",
  };
}

function studentDetailDateLabel(value) {
  return value ? formatDate(value) : "Date not available";
}

function studentDetailFileTypeLabel(value) {
  const normalized = normalizeStatus(value || "file");
  if (!normalized || normalized.includes("artifact") || normalized === "evidence") return "File";
  return statusText(normalized);
}

function renderStudentDetailApprovalStatusCard(detail = {}) {
  const approval = studentDetailPhaseApprovalStatus(detail);
  return renderDashboardCard("Next-step approval", "Program Teacher check", `
    <div data-student-detail-phase-approval="true" data-student-detail-phase-approval-state="${escapeHtml(approval.state)}">
      <strong>${escapeHtml(approval.label)}</strong>
      <p>${escapeHtml(approval.detail)}</p>
      <p class="workspace-muted">${escapeHtml(approval.nextAction)}</p>
      ${statusPill(approval.state)}
    </div>
  `);
}

function studentDetailPhaseApprovalStatus(detail = {}) {
  const student = detail.student || {};
  const progress = detail.progress || {};
  const latestSubmission = latestStudentDetailSubmission(detail);
  const latestReview = latestStudentDetailReview(detail);
  const status = normalizeStatus(latestSubmission?.status || student.status || progress.status || "");
  const decision = normalizeStatus(latestReview?.decision || latestReview?.status || "");
  const stage = progress.currentStage || student.currentPhase || latestSubmission?.phaseLabel || latestSubmission?.requirementTitle || "current phase";
  if (decision === "approved" || status === "approved" || status === "complete") {
    return {
      state: "approved",
      label: "Approved for next steps",
      detail: `${stage} has Program Teacher approval.`,
      nextAction: "Student can move to the next approved step after Program Teacher approval is saved.",
    };
  }
  if (decision === "revision_requested" || status === "revision_requested") {
    return {
      state: "revision_requested",
      label: "Revision required before moving on",
      detail: latestReview?.feedback || latestSubmission?.nextAction || "Program Teacher feedback is waiting for the student to fix and resubmit.",
      nextAction: "Do not move phases until the revision is submitted and approved.",
    };
  }
  if (status === "submitted" || status === "under_review") {
    return {
      state: "under_review",
      label: "Waiting for Program Teacher approval",
      detail: latestSubmission?.requirementTitle || `${stage} work has been sent in.`,
      nextAction: "Program Teacher reviews the submitted work, then approves next steps or requests revision.",
    };
  }
  return {
    state: "missing",
    label: "Not ready for next-step approval",
    detail: latestSubmission?.requirementTitle || "No submitted phase work is waiting for approval.",
    nextAction: latestSubmission?.nextAction || "Student should finish the current assigned work, attach proof when required, and send it for review.",
  };
}

function latestStudentDetailSubmission(detail = {}) {
  const rows = Array.isArray(detail.submissions) ? detail.submissions : [];
  return [...rows].sort((left, right) => {
    const leftTime = Date.parse(left?.updatedAt || left?.createdAt || left?.submittedAt || "");
    const rightTime = Date.parse(right?.updatedAt || right?.createdAt || right?.submittedAt || "");
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  })[0] || null;
}

function latestStudentDetailReview(detail = {}) {
  const rows = Array.isArray(detail.reviews) ? detail.reviews : [];
  return [...rows].sort((left, right) => {
    const leftTime = Date.parse(left?.createdAt || left?.updatedAt || "");
    const rightTime = Date.parse(right?.createdAt || right?.updatedAt || "");
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  })[0] || null;
}

function latestStudentDetailFeedback(detail) {
  const reviews = Array.isArray(detail.reviews) ? detail.reviews : [];
  const comments = Array.isArray(detail.comments) ? detail.comments : [];
  const items = [
    ...reviews.map((row) => ({
      kind: "Program Teacher review",
      title: row.requirementTitle || "Senior Project work",
      text: row.feedback || row.nextAction || "Feedback saved.",
      actor: row.reviewerName || "Reviewer",
      occurredAt: row.createdAt || "",
      status: row.decision || "under_review",
    })),
    ...comments.map((row) => ({
      kind: studentDetailCommentKind(row.visibility),
      title: row.authorName || "Staff",
      text: row.body || "Comment saved.",
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
      title: "No feedback yet",
      text: "No visible review or comment has been saved for this student yet.",
      meta: "Use Timeline or Review Work when new feedback is added.",
      status: "configured",
    };
  }

  return {
    kind: item.kind,
    title: item.title,
    text: item.text,
    meta: `${item.actor} / ${studentDetailDateLabel(item.occurredAt)}`,
    status: item.status,
  };
}

function renderStudentDetailWork(detail) {
  return `
    <section class="workspace-detail-section" ${studentDetailPanelAttrs("work", "progress submissions mentor presentation archive")}>
      ${renderStudentDetailProgress(detail)}
      ${renderStudentDetailMissingWork(detail)}
      ${renderStudentDetailSubmissions(detail)}
      ${renderStudentDetailMentor(detail)}
      <div class="workspace-detail-grid">
        ${renderStudentDetailPresentation(detail)}
        ${renderStudentDetailArchive(detail)}
      </div>
    </section>
  `;
}

function renderStudentDetailProgress(detail) {
  const progress = detail.progress || {};
  const blockedReasons = Array.isArray(progress.blockedReasons) ? progress.blockedReasons : [];
  const progressFacts = studentDetailProgressFacts(progress);
  return `
    <section class="workspace-detail-section" data-student-detail-section="progress">
      ${renderDashboardCard("Current work", "Current step and next action", `
        <p>${escapeHtml(progressFacts.workItemsText)}</p>
        <p>${escapeHtml(progress.nextAction || "Continue the next capstone milestone.")}</p>
        <div class="workspace-chip-row">
          <span class="workspace-site-context-badge">${escapeHtml(progressFacts.stageText)}</span>
          <span class="workspace-site-context-badge">${escapeHtml(progressFacts.percentText)}</span>
        </div>
      `)}
      ${blockedReasons.length ? `
        <div class="workspace-empty-state-card">
          <strong>What is getting in the way</strong>
          <div class="workspace-chip-row">${blockedReasons.map((reason) => `<span class="workspace-risk-chip">${escapeHtml(riskLabel(reason))}</span>`).join("")}</div>
        </div>
      ` : ""}
    </section>
  `;
}

function renderStudentDetailMissingWork(detail) {
  const flags = studentDetailAttentionFlags(detail).filter((flag) => ["missing_evidence", "evidence_missing", "missing_work", "behind"].includes(flag.key));
  const rows = flags.length ? flags : [{
    label: "No missing work shown right now",
    detail: "Open Feedback or Timeline if you need more context.",
  }];
  return renderStudentDetailList("Missing work", "Files or work still needed", rows, "No missing work shown right now.", (row) => `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(row.label || "Missing work")}</strong>
        <p>${escapeHtml(row.detail || "Check the current work and feedback before following up.")}</p>
      </div>
      ${statusPill(flags.length ? "blocked" : "ready")}
    </article>
  `, { sectionId: "missing-work" });
}

function renderStudentDetailSubmissions(detail) {
  const rows = Array.isArray(detail.submissions) ? detail.submissions : [];
  return renderStudentDetailList("Submitted work", "Newest work students sent in", rows, "No submitted work is available for this student yet.", (row) => `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(row.requirementTitle || "Senior Project work")}</strong>
        <p>Version ${escapeHtml(row.version || 1)} / ${escapeHtml(row.evidenceCount || 0)} Google Drive ${pluralize(safeNumber(row.evidenceCount), "link")} saved</p>
        <p class="workspace-muted">${escapeHtml(row.nextAction || "")}</p>
      </div>
      ${statusPill(row.status || "draft")}
    </article>
  `);
}

function renderStudentDetailEvidence(detail) {
  const rows = Array.isArray(detail.evidence) ? detail.evidence : [];
  return `
    <section class="workspace-detail-section" ${studentDetailPanelAttrs("evidence")}>
      ${renderStudentDetailList("Files uploaded", "Files and review status", rows, "No files are uploaded for this student yet.", (row) => `
    <article class="workspace-row">
      <div>
        <strong>${escapeHtml(row.title || "Uploaded file")}</strong>
        <p>${escapeHtml(studentDetailFileTypeLabel(row.artifactType))} / ${escapeHtml(studentDetailFileTypeLabel(row.sourceKind))}</p>
        <p class="workspace-muted">${row.externalUrl ? escapeHtml(row.externalUrl) : "File details are protected."}</p>
      </div>
      <div class="workspace-row-actions">
        <span class="workspace-site-context-badge">Protected file details</span>
        ${statusPill(row.reviewStatus || "pending_review")}
      </div>
    </article>
      `)}
    </section>
  `;
}

function renderStudentDetailCasePlan(detail = {}, scope = {}, preparedPlan = null) {
  const plan = preparedPlan || studentDetailCasePlan(detail, scope);
  return `
    <section class="workspace-student-detail-next-action" data-student-detail-next-action="true" aria-label="Student next step">
      <div>
        <p class="workspace-kicker">Start here</p>
        <h3>What this student needs next</h3>
        <p>${escapeHtml(plan.nextAction || "Open Work and check the current step.")}</p>
        ${plan.owner ? `<small>${escapeHtml(plan.owner)}</small>` : ""}
      </div>
    </section>
    <details class="workspace-student-detail-case-details" data-student-detail-case-details="true">
      <summary>Show plan details</summary>
      <div class="workspace-student-detail-case-plan" data-student-detail-case-plan="true" data-student-detail-case-read-only="${plan.readOnly ? "true" : "false"}" aria-label="Student next steps">
        ${renderStudentDetailCasePlanItem("Status", plan.currentStatus, "status")}
        ${renderStudentDetailCasePlanItem("Current step", plan.currentStep, "step")}
        ${renderStudentDetailCasePlanItem("Staff support", plan.coverage, "coverage")}
        ${renderStudentDetailCasePlanItem("Next step", plan.nextAction, "action", plan.owner)}
      </div>
    </details>
  `;
}

function renderStudentDetailCasePlanItem(label, value, key, meta = "") {
  return `
    <article class="workspace-student-detail-case-item" data-student-detail-case-item="${escapeHtml(key)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "Not confirmed yet")}</strong>
      ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
    </article>
  `;
}

function studentDetailCasePlan(detail = {}, scope = {}) {
  const student = detail.student || {};
  const progress = detail.progress || {};
  const mentor = detail.mentor || {};
  const latestSubmission = latestStudentDetailSubmission(detail);
  const latestReview = latestStudentDetailReview(detail);
  const flags = studentDetailAttentionFlags(detail);
  const rowLikeStudent = {
    ...student,
    hasActiveMentor: mentor.active,
    mentorName: mentor.mentorName || student.mentorName,
    mentorMeetingStatus: mentor.latestMeetingStatus || student.mentorMeetingStatus,
    latestSubmissionStatus: latestSubmission?.status || student.latestSubmissionStatus || student.status,
    reviewStatus: latestReview?.decision || student.reviewStatus,
    progressStatus: progress.status || student.progressStatus,
    evidenceStatus: student.evidenceStatus || (safeNumber(student.evidenceCount) ? "attached" : ""),
    riskFlags: Array.from(new Set([...(Array.isArray(student.riskFlags) ? student.riskFlags : []), ...flags.map((flag) => flag.key)])),
    nextAction: student.nextAction || progress.nextAction || latestSubmission?.nextAction || latestReview?.feedback,
  };
  const guidance = studentDirectoryRowGuidance(rowLikeStudent, Boolean(scope.readOnly));
  const currentStatus = statusText(latestSubmission?.status || student.latestSubmissionStatus || latestReview?.decision || student.status || progress.status || "pending");
  const currentStep = progress.currentStage || latestSubmission?.requirementTitle || student.currentPhase || "Current step not confirmed yet";
  const coverage = mentor.active === true
    ? mentor.mentorName || student.mentorName || "Assigned mentor"
    : mentor.active === false
    ? "No active mentor"
    : student.mentorName || "Mentor coverage not confirmed yet";
  const attention = flags[0]?.label || (student.storyBucket ? storyLabel(student.storyBucket) : "Routine monitoring");
  return {
    currentStatus,
    currentStep,
    coverage,
    attention,
    owner: guidance.owner,
    nextAction: guidance.nextAction,
    access: scope.readOnly ? "Read-only context" : "Authorized staff context",
    readOnly: Boolean(scope.readOnly),
  };
}

function studentDetailAttentionFlags(detail = {}) {
  const student = detail.student || {};
  const progress = detail.progress || {};
  const mentor = detail.mentor || {};
  const presentation = detail.presentation || {};
  const archive = detail.archive || {};
  const latestSubmission = latestStudentDetailSubmission(detail);
  const latestReview = latestStudentDetailReview(detail);
  return staffStudentAttentionFlags({
    ...student,
    hasActiveMentor: mentor.active,
    mentorMeetingStatus: mentor.latestMeetingStatus || student.mentorMeetingStatus,
    latestSubmissionStatus: latestSubmission?.status || student.latestSubmissionStatus || student.status,
    reviewStatus: latestReview?.decision || latestReview?.status || student.reviewStatus,
    progressStatus: progress.status || student.progressStatus,
    evidenceStatus: student.evidenceStatus || (safeNumber(student.evidenceCount) ? "attached" : ""),
    presentationStatus: presentation.status || student.presentationStatus,
    archiveStatus: archive.status || student.archiveStatus,
    riskFlags: Array.isArray(student.riskFlags) ? student.riskFlags : [],
  });
}

function renderStudentDetailReviews(detail) {
  const reviews = Array.isArray(detail.reviews) ? detail.reviews : [];
  const comments = Array.isArray(detail.comments) ? detail.comments : [];
  const commentMode = studentDetailCommentVisibilityMode(detail);
  const needsChanges = reviews.filter((row) => normalizeStatus(row.decision || row.status) === "revision_requested");
  const otherReviews = reviews.filter((row) => normalizeStatus(row.decision || row.status) !== "revision_requested");
  const orderedReviews = [...needsChanges, ...otherReviews];
  return `
    <section class="workspace-detail-section" ${studentDetailPanelAttrs("feedback", "reviews")}>
      ${renderStudentDetailList("Recent feedback", needsChanges.length ? "Needs changes first" : "Program Teacher feedback", orderedReviews, "No feedback yet for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.requirementTitle || "Senior Project work")}</strong>
            <p>${escapeHtml(row.feedback || "Feedback saved.")}</p>
            <p class="workspace-muted">${escapeHtml(row.reviewerName || "Reviewer")} / ${escapeHtml(studentDetailDateLabel(row.createdAt))}</p>
          </div>
          ${statusPill(row.decision || "under_review")}
        </article>
      `)}
      ${renderStudentDetailCommentVisibilitySummary(detail, comments)}
      ${renderStudentDetailList("Comments", studentDetailCommentListDetail(commentMode), comments, studentDetailCommentEmptyMessage(commentMode), (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.authorName || "Staff")}</strong>
            <p>${escapeHtml(row.body || "Comment saved.")}</p>
            <p class="workspace-muted">${escapeHtml(studentDetailDateLabel(row.createdAt))}</p>
          </div>
          ${statusPill(row.visibility || "configured")}
        </article>
      `)}
    </section>
  `;
}

function renderStudentDetailMentor(detail) {
  const mentor = detail.mentor || {};
  const history = Array.isArray(detail.mentorAssignmentHistory) ? detail.mentorAssignmentHistory : [];
  const meetings = Array.isArray(detail.mentorMeetings) ? detail.mentorMeetings : [];
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
      ${renderStudentDetailMentorWorkContext(detail)}
      ${renderMentorMeetingForm(detail, mentor)}
      ${renderStudentDetailList("Mentor Coverage History", "Assignment timeline", history, "No mentor assignment history is available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${escapeHtml(row.nextAction || (row.active ? "Current mentor coverage is active." : "Previous mentor assignment."))}</p>
            <p class="workspace-muted">Assigned ${escapeHtml(studentDetailDateLabel(row.assignedAt))}${row.assignedByName ? ` by ${escapeHtml(row.assignedByName)}` : ""}</p>
          </div>
          ${statusPill(row.active ? "approved" : "configured")}
        </article>
      `)}
      ${renderStudentDetailList("Mentor Meetings", "Support timeline", meetings, "No mentor meetings are available for this student.", (row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.mentorName || "Mentor")}</strong>
            <p>${escapeHtml(row.notes || row.nextAction || "Meeting saved.")}</p>
            ${renderMentorMeetingLinkedWork(row)}
            <p class="workspace-muted">${escapeHtml(studentDetailDateLabel(row.heldAt || row.scheduledFor || row.createdAt))}</p>
          </div>
          ${statusPill(row.status || "pending")}
        </article>
      `)}
    </section>
  `;
}

function renderStudentDetailMentorWorkContext(detail = {}) {
  const latestSubmission = latestStudentDetailSubmission(detail);
  const latestReview = latestStudentDetailReview(detail);
  const approval = studentDetailPhaseApprovalStatus(detail);
  return `
    <section class="workspace-student-mentor-work-context" data-student-detail-mentor-work-context="true" data-student-detail-phase-approval="true" data-student-detail-phase-approval-state="${escapeHtml(approval.state)}">
      <strong>Work context for the next mentor conversation</strong>
      <div class="workspace-mentor-plan-grid">
        <article>
          <span>1. Current checkpoint</span>
          <b>${escapeHtml(approval.label)}</b>
        </article>
        <article>
          <span>2. Linked work</span>
          <b>${escapeHtml(latestSubmission?.requirementTitle || "No submitted work yet")}</b>
        </article>
        <article>
          <span>3. Ask about</span>
          <b>${escapeHtml(latestReview?.feedback || latestSubmission?.nextAction || approval.nextAction)}</b>
        </article>
      </div>
    </section>
  `;
}

function renderMentorMeetingForm(detail, mentor = {}) {
  if (!canRecordMentorMeeting(detail, mentor)) return "";
  const student = detail.student || {};
  const studentId = student.studentId || "";
  return `
    <form id="mentorMeetingForm" class="workspace-review-feedback" data-mentor-meeting-form="true">
      <input type="hidden" name="studentId" value="${escapeHtml(studentId)}">
      <label>
        Meeting result
        <select class="workspace-select" name="status" required>
          <option value="held" selected>Held</option>
          <option value="missed">Missed</option>
          <option value="makeup_required">Make-up required</option>
        </select>
      </label>
      <label>
        Meeting purpose
        <select class="workspace-select" name="purpose" required>
          ${mentorMeetingPurposeOptions()}
        </select>
      </label>
      <label>
        Meeting notes
        <textarea name="notes" rows="4" maxlength="1200" required></textarea>
      </label>
      <p class="workspace-muted" data-mentor-meeting-purpose-guide="true">Choose the purpose first, then write the exact follow-up the student agreed to. Only actively assigned mentors can save meetings for their assigned students.</p>
      <button class="workspace-button workspace-button-primary" type="submit" data-mentor-meeting-action="record">Save meeting</button>
    </form>
  `;
}

function mentorMeetingPurposeOptions(selected = "check_in") {
  const safeSelected = cleanMentorMeetingPurpose(selected);
  return [
    ["check_in", "Regular check-in"],
    ["revision", "Revision support"],
    ["proof", "Proof or file help"],
    ["presentation", "Presentation practice"],
    ["next_step", "Next-step planning"],
  ].map(([value, label]) => `<option value="${escapeHtml(value)}" ${safeSelected === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function cleanMentorMeetingPurpose(value) {
  const cleaned = cleanDirectoryFilter(value);
  return ["check_in", "revision", "proof", "presentation", "next_step"].includes(cleaned) ? cleaned : "check_in";
}

function canRecordMentorMeeting(detail, mentor = {}) {
  const roles = roleIds(currentUser);
  const studentId = detail?.student?.studentId || "";
  return roles.has("mentor")
    && Boolean(studentId)
    && Boolean(mentor.active)
    && Boolean(mentor.mentorUserId)
    && mentor.mentorUserId === currentUser?.id;
}

function renderMentorMeetingLinkedWork(row) {
  const title = String(row?.submissionTitle || "").trim();
  if (!title) return "";
  const version = safeNumber(row?.submissionVersion);
  const status = String(row?.submissionStatus || "").trim();
  const details = [];
  if (version > 0) details.push(`version ${version}`);
  if (status) details.push(statusText(status));
  const suffix = details.length ? ` (${details.join(", ")})` : "";
  return `<p class="workspace-muted">Linked work: ${escapeHtml(title)}${escapeHtml(suffix)}</p>`;
}

function renderStudentDetailPresentation(detail) {
  const presentation = detail.presentation || {};
  const permissions = detail.permissions || {};
  const studentId = detail.student?.studentId || detail.scope?.studentId || "";
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
        ${permissions.canViewPresentationOperations ? studentDetailOperationsButton(studentId) : ""}
      `)}
    </section>
  `;
}

function studentDetailCommentKind(visibility) {
  const normalized = normalizeStatus(visibility);
  if (normalized === "staff_only") return "Staff-only note";
  if (normalized === "student_visible" || normalized === "student_and_staff") return "Student-visible note";
  if (normalized === "scoped") return "Staff follow-up note";
  return "Visible note";
}

function studentDetailCommentVisibilityMode(detail) {
  const visibility = detail?.visibility || {};
  if (visibility.adminContext === "included_when_scoped") return "admin_detailed";
  if (visibility.staffOnlyComments === "included_when_scoped") return "scoped_staff";
  return "student_visible_only";
}

function studentDetailCommentListDetail(mode) {
  if (mode === "admin_detailed") return "Student-visible and staff-only notes";
  if (mode === "scoped_staff") return "Staff follow-up notes";
  return "Student-visible notes";
}

function studentDetailCommentEmptyMessage(mode) {
  if (mode === "admin_detailed") return "No student-visible or staff-only notes are available for this student.";
  if (mode === "scoped_staff") return "No staff follow-up notes are available for this student.";
  return "No student-visible notes are available for this student.";
}

function renderStudentDetailCommentVisibilitySummary(detail, comments = []) {
  const mode = studentDetailCommentVisibilityMode(detail);
  const safeComments = Array.isArray(comments) ? comments : [];
  const total = safeNumber(safeComments.length);

  if (mode === "admin_detailed") {
    const counts = safeComments.reduce((summary, row) => {
      const visibility = normalizeStatus(row.visibility);
      if (visibility === "staff_only") {
        summary.staffOnly += 1;
      } else if (visibility === "student_visible" || visibility === "student_and_staff") {
        summary.studentVisible += 1;
      } else {
        summary.protectedOnly += 1;
      }
      return summary;
    }, { studentVisible: 0, staffOnly: 0, protectedOnly: 0 });
    const badges = [
      `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="student-visible">Student-visible notes: ${safeNumber(counts.studentVisible)}</span>`,
      `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="staff-only">Staff-only notes: ${safeNumber(counts.staffOnly)}</span>`,
      counts.protectedOnly
        ? `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="protected">Protected notes: ${safeNumber(counts.protectedOnly)}</span>`
        : "",
    ].filter(Boolean).join("");
    return `
      <div class="workspace-review-comment-summary" data-student-detail-comment-visibility-summary="true">
        <p class="workspace-muted">Note visibility</p>
        <div class="workspace-detail-grid">${badges}</div>
        <p class="workspace-muted">Student-visible notes can be shared with the student. Staff-only planning notes stay inside authorized detail.</p>
      </div>
    `;
  }

  const scopedBadges = mode === "scoped_staff"
    ? [
        `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="scoped">Staff follow-up notes: ${escapeHtml(total)}</span>`,
        `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="staff-scope">Staff follow-up included</span>`,
        `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="admin-hidden">Admin-only context hidden</span>`,
      ]
    : [
        `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="student-visible-only">Student-visible notes: ${escapeHtml(total)}</span>`,
        `<span class="workspace-site-context-badge" data-student-detail-comment-visibility="staff-hidden">Staff-only notes hidden</span>`,
      ];
  const helpText = mode === "scoped_staff"
    ? "This detail includes the notes visible to the current assigned staff role. Admin-only context stays hidden."
    : "Only notes that can be shared with the student appear in this detail.";
  return `
    <div class="workspace-review-comment-summary" data-student-detail-comment-visibility-summary="true">
      <p class="workspace-muted">Note visibility</p>
      <div class="workspace-detail-grid">${scopedBadges.join("")}</div>
      <p class="workspace-muted">${escapeHtml(helpText)}</p>
    </div>
  `;
}

function renderStudentDetailArchive(detail) {
  const archive = detail.archive || {};
  const permissions = detail.permissions || {};
  const studentId = detail.student?.studentId || detail.scope?.studentId || "";
  return `
    <section class="workspace-detail-section" data-student-detail-section="archive">
      ${renderDashboardCard("Final files", "Closeout file status", `
        <p>${escapeHtml(archive.nextAction || "Prepare final-file readiness checks when the student reaches closeout.")}</p>
        <div class="workspace-chip-row">
          ${statusPill(archive.status || "missing")}
          ${statusPill(archive.exportStatus || "not_requested")}
          <span class="workspace-site-context-badge">Protected file details</span>
        </div>
        <p class="workspace-muted">${escapeHtml(safeNumber(archive.artifactCount))} final file${safeNumber(archive.artifactCount) === 1 ? "" : "s"} in the latest summary.</p>
        ${permissions.canViewArchiveOperations ? studentDetailOperationsButton(studentId) : ""}
      `)}
    </section>
  `;
}

function studentDetailOperationsButton(studentId) {
  return studentId ? `
    <button class="workspace-link-button workspace-link-button-small" type="button" data-student-detail-action="open-operations" data-student-detail-operations-student-id="${escapeHtml(studentId)}">
      Open operations for this student
    </button>
  ` : "";
}

function renderStudentDetailTimeline(detail, state) {
  const timelineBody = unwrap(state.timelineResult);
  const events = Array.isArray(timelineBody?.events)
    ? timelineBody.events
    : Array.isArray(detail.timelinePreview)
      ? detail.timelinePreview
      : [];
  const title = timelineBody ? "Recent activity" : "Recent activity preview";
  const selectedType = cleanStudentDetailTimelineType(state.timelineType || "");
  return `
    <section class="workspace-detail-section" ${studentDetailPanelAttrs("timeline")}>
      ${renderStudentDetailTimelineFilters(selectedType, Boolean(timelineBody))}
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
            reason: "The full timeline could not be loaded for this account and school assignment.",
            owner: "School Admin or platform support.",
            nextAction: "Use the preview or confirm the site assignment.",
          })}
        </div>
      ` : ""}
      ${renderStudentDetailList(title, "Newest updates first", events, "No activity yet for this student.", (event) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(event.title || (event.type ? statusText(event.type) : "Activity update"))}</strong>
            <p>${escapeHtml(event.summary || "Activity saved.")}</p>
            <p class="workspace-muted">${escapeHtml(event.type ? statusText(event.type) : "Activity")} / ${escapeHtml(studentDetailDateLabel(event.occurredAt))}</p>
          </div>
          ${statusPill(event.status || "configured")}
        </article>
      `)}
    </section>
  `;
}

function renderStudentDetailTimelineFilters(selectedType = "", loaded = false) {
  return `
    <div class="workspace-active-filter-summary" data-student-detail-timeline-filters="true">
      <div>
        <strong>${escapeHtml(selectedType ? `Showing ${studentDetailTimelineTypeLabel(selectedType).toLowerCase()}` : "Showing all activity")}</strong>
        <p>${escapeHtml(loaded ? "These filters use the authorized student activity route." : "Open a filter to load matching student activity.")}</p>
      </div>
      <div class="workspace-quick-actions" role="group" aria-label="Timeline filters">
        ${STUDENT_DETAIL_TIMELINE_TYPES.map(([value, label]) => `
          <button class="workspace-link-button workspace-link-button-small ${value === selectedType ? "is-active" : ""}" type="button" data-student-detail-timeline-type="${escapeHtml(value)}" aria-pressed="${value === selectedType ? "true" : "false"}">
            ${escapeHtml(label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderStudentDetailList(title, detail, rows, emptyText, rowRenderer, options = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const sectionAttr = options.sectionId ? ` data-student-detail-section="${escapeHtml(options.sectionId)}"` : "";
  return `
    <section class="workspace-dashboard-card"${sectionAttr}>
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
      const label = `${cleanDemoSeedDisplay(program.programName, value || "Program")}${program.studentCount != null ? ` (${safeNumber(program.studentCount)})` : ""}`;
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
  const note = options.note || "Back and Forward keep your recent views. The browser address stays clean.";
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
  return cleanDemoSeedDisplay(match?.programName, programId || "Selected program");
}

function cohortLabel(cohorts = [], cohortId = "") {
  const match = (Array.isArray(cohorts) ? cohorts : []).find((cohort) => cohort.cohortId === cohortId);
  return cleanDemoSeedDisplay(match?.cohortName, cohortId || "Selected cohort");
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
    <section class="workspace-card workspace-current-site-summary" data-current-site-summary="true">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Current site</p>
          <h2>${escapeHtml(scope.siteName || "Assigned school")} / ${escapeHtml(scope.schoolYear || "School year")}</h2>
        </div>
        ${statusPill(scope.readOnly ? "configured" : "approved")}
      </div>
      <div class="workspace-chip-row">
        <span class="workspace-site-context-badge">${escapeHtml(scope.tenantName || "School organization")}</span>
        <span class="workspace-site-context-badge">${escapeHtml(roleLabel(scope.role || primaryRoleForUser(currentUser)))}</span>
        <span class="workspace-site-context-badge">${escapeHtml(siteAccessModeLabel(scope))}</span>
        <span class="workspace-site-context-badge">No student messaging</span>
      </div>
      <p class="workspace-muted" data-site-selection-persistence="true">This selected school carries across Dashboard, Students, Review Work, Mentor Assignments, Operations, Programs, and Users & Access when your role can open them.</p>
      ${accessibleSites.length > 1 ? `
        <p class="workspace-muted">
          ${safeNumber(accessibleSites.length)} accessible site${accessibleSites.length === 1 ? "" : "s"} are available.
          This view shows ${escapeHtml(scope.siteName || "the current school")} only.
        </p>
      ` : ""}
    </section>
  `;
}

function renderSitePermissionRules(dashboard) {
  const permissions = dashboard.permissions || {};
  const readOnly = Boolean(dashboard.scope?.readOnly);
  const studentRecordCopy = permissions.canViewStudentDirectory
      ? readOnly
        ? "You can open assigned student records for context; changes stay with authorized staff."
      : "This account can view assigned student records."
    : "This account is limited to dashboard review.";
  const reviewQueueCopy = permissions.canViewReviewQueue
    ? readOnly
      ? "You can review submitted work context; decisions stay with assigned Program Teachers."
      : "Review work visibility is available for this site."
    : "Review work action remains with assigned staff.";
  return `
    <div class="workspace-dashboard-grid workspace-dashboard-grid-two">
      <article class="workspace-empty-state-card">
        <strong>Private proof</strong>
        <span>Proof counts are visible without exposing private file details.</span>
        ${statusPill("configured")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Assigned student records</strong>
        <span>${studentRecordCopy}</span>
        ${statusPill(permissions.canViewStudentDirectory ? "approved" : "blocked")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Protected access</strong>
        <span>Workspace access is reviewed without exposing private file details.</span>
        ${statusPill("approved")}
      </article>
      <article class="workspace-empty-state-card">
        <strong>Program Teacher follow-up</strong>
        <span>${reviewQueueCopy}</span>
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
              <p>${escapeHtml(cleanDemoSeedDisplay(row.programName, "Program"))} / ${safeNumber(row.evidenceCount)} evidence</p>
              <div class="workspace-chip-row">
                ${reasons.length
                  ? reasons.map((reason) => `<span class="workspace-risk-chip">${escapeHtml(reason)}</span>`).join("")
                  : `<span class="workspace-story-chip">No critical reason</span>`}
              </div>
              ${renderRiskExplanation(reasons, { includeLow: false })}
            </div>
            <div class="workspace-row-actions">
              ${statusPill(row.submissionStatus || "draft")}
              ${row.studentId ? `
                <button class="workspace-link-button workspace-link-button-small" type="button" data-site-student-action="view-detail" data-student-detail-id="${escapeHtml(row.studentId)}">
                  View detail
                </button>
                ${renderViewAsStudentAction(row.studentId, row.studentName, { sourceSection: "siteDashboard" })}
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
      ${actions.map((action) => {
        const canOpenAction = Boolean(action.actionSection && action.actionPreset && availableSectionIdsForAnyMode().has(action.actionSection));
        return `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(action.label || "Next action")}</strong>
            <p>${escapeHtml(action.detail || "Review this site-level signal.")}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(action.status || "pending")}
            ${canOpenAction ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(action.actionSection)}" data-section-preset="${escapeHtml(action.actionPreset)}">
                ${escapeHtml(action.actionLabel || "Open")}
              </button>
            ` : `<span class="workspace-summary-badge">Summary only</span>`}
          </div>
        </article>
      `;
      }).join("")}
    </div>
  `;
}

function deniedWorkspaceSections() {
  return [
    ["dashboard", "My Work"],
    ["siteDashboard", "Site dashboard"],
    ["siteStudents", "Students"],
    ["adminDashboard", "Admin command center"],
    ["programTeacherDashboard", "Program dashboard"],
    ["mentorDashboard", "Mentor dashboard"],
    ["reviewQueue", "Program Teacher review"],
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
    <section class="workspace-command-center workspace-admin-command-center" data-admin-command-center="true" aria-labelledby="adminCommandTitle">
      <div class="workspace-command-hero workspace-admin-command-hero">
        <div>
          <p class="workspace-kicker">Admin Console</p>
          <h1 id="adminCommandTitle">School-Wide Operations</h1>
          <p>School-wide progress, review workload, mentor coverage, presentation readiness, and audit activity.</p>
          <small>Updated ${escapeHtml(formatDate(dashboard.generatedAt))}</small>
        </div>
        ${renderAdminOperationsFlowVisual(summary)}
      </div>
      <div class="workspace-dashboard-grid workspace-admin-operations-grid" data-admin-operations-grid="true">
        ${renderMetricTile("Students", summary.studentsActive, `${safeNumber(summary.studentsNoMentor)} without active mentor`, "admin", "students", { label: "Open", preset: "all-students" })}
        ${renderMetricTile("Submitted", summary.submissionsSubmitted, "Ready for review", "teacher", "teacher", { label: "Review", preset: "submitted" })}
        ${renderMetricTile("Needs Revision", summary.revisionRequested, "Open revision loops", "warning", "teacher", { label: "Review", preset: "revision-requested" })}
        ${renderMetricTile("Presentations", summary.presentationScheduled, "Scheduled slots", "teacher", "operations", { label: "Review", preset: "presentation-pending" })}
        ${renderMetricTile("Exports", summary.exportsQueued, exportsAttention, safeNumber(summary.exportsFailed) ? "danger" : "admin", "archiveExports")}
        ${renderMetricTile("Audit", summary.recentAuditEvents, "Recent audit activity", "admin", "audit")}
      </div>
      ${siteStudentDetailState?.sourceSection === "adminDashboard" ? renderSiteStudentDetailSurface({
        students: (dashboard.reviewQueue || []).map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
      }) : ""}
      ${renderDashboardCard("Needs Attention", "Operational risks", renderNeedsAttention(dashboard.needsAttention))}
      ${renderWorkspaceDisclosurePanel({
        scope: "dashboard",
        id: "adminDashboard",
        kicker: "Dashboard details",
        title: "School-Wide Detail Panels",
        summary: "Review, mentor, presentation, final-file, audit, and quick-action panels stay available after the summary.",
        openLabel: "Open dashboard details",
        closeLabel: "Hide dashboard details",
        bodyHtml: `
          ${renderSummaryStrip([
            { label: "Approved", value: safeNumber(summary.approved), detail: "Accepted submissions.", tone: "student", concept: "Submitted / Approved" },
            { label: "Proof", value: safeNumber(summary.evidenceArtifacts), detail: "Summary only; open student detail for proof records.", tone: "mentor", concept: "Missing Proof" },
          ], { label: "Admin dashboard summary-only metrics", className: "workspace-admin-secondary-summary" })}
          ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
          <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-secondary-grid">
            ${renderDashboardCard("Review Workload", "Submitted and revision records", renderReviewQueueSummary(dashboard.reviewQueue, { allowStudentDetail: true }))}
            ${renderDashboardCard("Mentor Coverage", "Active assignment load", renderMentorCoverage(dashboard.mentorCoverage, summary))}
            ${renderDashboardCard("Presentation Snapshot", "Day-of readiness", renderSnapshotRows(dashboard.presentationSnapshot))}
            ${renderDashboardCard("Archive / Export Snapshot", "Closeout package status", renderSnapshotRows(dashboard.archiveSnapshot))}
            ${renderDashboardCard("Recent Audit", "Protected activity", renderAuditSummary(dashboard.recentAudit, { allowAuditDrillDown: true }))}
            ${renderDashboardCard("Quick Actions", "Admin tools", renderQuickActions([
              { label: "Programs", detail: "Update school programs", section: "programs" },
              { label: "Teacher Review", detail: "Open submitted work", section: "teacher" },
              { label: "Presentation", detail: "Review schedule", section: "presentation" },
              { label: "Reports", detail: "Open readiness", section: "readiness" },
              { label: "Users & Access", detail: "Create users", section: "adminUsers" },
              { label: "Audit", detail: "Review activity", section: "audit" },
              { label: "Final Files", detail: "Check packages", section: "archiveExports" },
            ]))}
          </div>
        `,
      })}
    </section>
  `;
}

function renderAdminOperationsFlowVisual(summary = {}) {
  const steps = [
    {
      id: "students",
      label: "Students",
      value: safeNumber(summary.studentsActive),
      detail: "Active",
    },
    {
      id: "review",
      label: "Review",
      value: safeNumber(summary.submissionsSubmitted) + safeNumber(summary.revisionRequested),
      detail: "Open loops",
    },
    {
      id: "mentor",
      label: "Mentors",
      value: safeNumber(summary.studentsNoMentor),
      detail: "Need coverage",
    },
    {
      id: "closeout",
      label: "Closeout",
      value: safeNumber(summary.exportsFailed) || safeNumber(summary.exportsQueued),
      detail: safeNumber(summary.exportsFailed) ? "Failed" : "Queued",
    },
  ];
  return `
    <div class="workspace-admin-flow" data-admin-operations-flow="true" aria-label="School-wide operations flow">
      ${steps.map((step) => `
        <article class="workspace-admin-flow-step" data-admin-flow-step="${escapeHtml(step.id)}">
          <span>${escapeHtml(step.label)}</span>
          <strong>${escapeHtml(String(step.value))}</strong>
          <small>${escapeHtml(step.detail)}</small>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAccessAssignmentSelectionRequired(body = {}) {
  const sites = body.accessibleSites || [];
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="access-assignment-site-selection-required">
      <p class="workspace-kicker">Users &amp; Access</p>
      <h2>Select a site before managing school access</h2>
      <p>This account can manage more than one school. Choose the school workspace before reviewing user assignments or saving access changes.</p>
      <div class="workspace-chip-row">
        ${sites.map((site) => `
          <button class="workspace-link-button workspace-link-button-small" type="button" data-site-switch-id="${escapeHtml(site.siteId || "")}">
            ${escapeHtml(site.siteName || site.siteId)}
          </button>
        `).join("")}
      </div>
      ${renderProblemState({
        reason: "Multiple manageable schools are available.",
        owner: "School administration or platform support.",
        nextAction: "Choose a site from the Current site menu or one of the buttons above.",
      })}
    </section>
  `;
}

function renderProgramTeacherDashboardSection() {
  const result = currentData.programTeacherDashboard;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Program dashboard", "assigned program records");
  }
  const dashboard = unwrap(result);
  if (!dashboard) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Program dashboard</p>
        <h2>Program dashboard unavailable</h2>
        ${renderApiNotice(result)}
      </section>
    `;
  }
  const summary = dashboard.summary || {};
  const scopeTypeLabel = programDashboardScopeTypeLabel(dashboard.scope);
  const scopeIdLabel = programDashboardScopeIdLabel(dashboard.scope);
  return `
    <section class="workspace-command-center">
      <div class="workspace-command-hero workspace-role-focus-hero">
        <div>
          <p class="workspace-kicker">Program Teacher</p>
          <h1>Projects that need you</h1>
          <p>Review one project. Make one decision. The student will see what to do next.</p>
        </div>
        <div class="workspace-command-hero-grid">
          <span class="workspace-chip">${escapeHtml(scopeTypeLabel)}</span>
          <span class="workspace-chip">${escapeHtml(scopeIdLabel)}</span>
        </div>
      </div>
      ${renderProgramTeacherReviewFirstList(dashboard)}
      ${renderSummaryStrip([
        { label: "Waiting", value: safeNumber(summary.needsReview ?? summary.submitted), detail: "Ready for your decision.", tone: "teacher", concept: "Needs Review" },
        { label: "Needs changes", value: safeNumber(summary.revisionRequested), detail: "Students are fixing work.", tone: "warning", concept: "Needs Revision" },
        { label: "Needs support", value: safeNumber(summary.behindSupport), detail: "Students may be stuck.", tone: safeNumber(summary.behindSupport) ? "danger" : "admin", concept: "Behind / Needs Support" },
        { label: "No mentor", value: safeNumber(summary.missingMentor ?? summary.noMentor), detail: "Projects need a mentor.", tone: safeNumber(summary.missingMentor ?? summary.noMentor) ? "warning" : "mentor", concept: "Missing Mentor" },
      ], { label: "Program work summary", className: "workspace-role-summary-strip" })}
      ${siteStudentDetailState?.sourceSection === "programDashboard" ? renderSiteStudentDetailSurface({
        students: (dashboard.students || []).map((row) => ({
          studentId: row.studentId,
          displayName: row.studentName,
        })),
      }) : ""}
      ${renderWorkspaceDisclosurePanel({
        scope: "dashboard",
        id: "programDashboard",
        kicker: "More tools",
        title: "Program list and reports",
        summary: "Open this when you need all students, totals, activity, or program reports.",
        openLabel: "Show program details",
        closeLabel: "Hide program details",
        bodyHtml: `
          <div class="workspace-dashboard-grid">
            ${renderMetricTile("Total Students", summary.totalStudents ?? summary.scopedStudents, "Students in your program", "teacher", "students", { label: "View students", preset: "all-students" })}
            ${renderMetricTile("On Track", summary.onTrack, "No urgent support signal", "student", "students", { label: "View students", preset: "on-track-students" })}
            ${renderMetricTile("Missing Proof", summary.missingEvidence, "Students without a work link", safeNumber(summary.missingEvidence) ? "warning" : "mentor", "students", { label: "View students", preset: "missing-evidence-students" })}
          </div>
          ${renderDashboardCard("Needs Attention", "Priority follow-up", renderNeedsAttention(dashboard.needsAttention))}
          <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-secondary-grid">
            ${renderDashboardCard("Needs Review", "Submitted and revision records", renderReviewQueueSummary(dashboard.needsReview, { allowStudentDetail: true }))}
            ${renderDashboardCard("Recent Activity", "Latest student updates", renderRecentProgramActivity(dashboard.recentActivity))}
            ${renderDashboardCard("Program Breakdown", "Students by program", renderProgramBreakdown(dashboard.programBreakdown))}
            ${renderDashboardCard("Students", "Assigned student list", renderScopedStudentList(dashboard.students))}
          </div>
        `,
      })}
    </section>
  `;
}

function renderProgramTeacherReviewFirstList(dashboard = {}) {
  const rows = Array.isArray(dashboard.needsReview) ? dashboard.needsReview : [];
  const attentionRows = Array.isArray(dashboard.needsAttention) ? dashboard.needsAttention : [];
  const focusRows = rows.length ? rows : attentionRows.filter((row) => normalizeStatus(row.status || row.submissionStatus) === "submitted");
  const focus = focusRows[0] || null;
  const waitingCount = safeNumber(dashboard?.summary?.needsReview ?? dashboard?.summary?.submitted ?? focusRows.length);
  return `
    <section class="workspace-dashboard-card workspace-program-review-first" data-program-review-first="true">
      <div class="workspace-program-review-focus">
        <div>
          <p class="workspace-kicker">Start here</p>
          <h2>${escapeHtml(focus ? focus.projectName || `${focus.studentName || "Student"}'s project` : "No work is waiting")}</h2>
          <p>${escapeHtml(focus ? `${focus.studentName || "Student"} turned in ${focus.requirementTitle || focus.title || "project work"}.` : "Students can keep working. Check the support list only if someone needs help.")}</p>
        </div>
        <div class="workspace-program-review-focus-action">
          <span class="workspace-chip">${escapeHtml(waitingCount)} waiting</span>
          ${focus ? statusPill(focus.status || focus.submissionStatus || "submitted") : statusPill("ready")}
          ${waitingCount && availableSectionIdsForAnyMode().has("teacher") ? `<button class="workspace-button workspace-button-primary" type="button" data-section="teacher" data-section-preset="submitted">${focus ? "Review this project" : "Open review queue"}</button>` : ""}
          ${safeNumber(dashboard?.summary?.revisionRequested) && availableSectionIdsForAnyMode().has("teacher") ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="teacher" data-section-preset="revision-requested">Check revisions</button>` : ""}
        </div>
      </div>
      ${focus ? renderProgramTeacherReviewFirstRow(focus) : `<p class="workspace-muted" data-program-review-first-empty="true">You are caught up with reviews.</p>`}
    </section>
  `;
}

function renderProgramTeacherReviewFirstRow(row = {}) {
  const status = normalizeStatus(row.status || row.submissionStatus || "submitted");
  const proofCount = safeNumber(row.evidenceCount || row.proofCount);
  const name = row.studentName || row.displayName || "Student";
  const title = row.requirementTitle || row.title || "Senior Project work";
  const decision = status === "submitted" && proofCount > 0
    ? "Decide: approve next steps or request revision."
    : status === "submitted"
      ? "Hold approval until proof is attached or clarified."
      : "Follow up without changing phase approval.";
  return `
    <article class="workspace-program-review-brief" data-program-review-first-row="true" data-program-review-first-state="${escapeHtml(status)}">
      <div>
        <span>Student</span>
        <strong>${escapeHtml(name)}</strong>
      </div>
      <div>
        <span>Work</span>
        <strong>${escapeHtml(title)}</strong>
      </div>
      <div>
        <span>Check</span>
        <strong>${escapeHtml(proofCount ? `${proofCount} work ${pluralize(proofCount, "link")}` : "No work link yet")}</strong>
        <small>${escapeHtml(decision)}</small>
      </div>
    </article>
  `;
}

function renderSiteDashboardSummary(dashboard) {
  const scope = dashboard.scope || {};
  const accessibleSites = Array.isArray(scope.accessibleSites) ? scope.accessibleSites : [];
  const selectionBadge = scope.selectionMode === "single_accessible_site"
    ? "Default site"
    : statusText(scope.selectionMode || "current_school");
  return `
    <section class="workspace-dashboard-summary" aria-labelledby="siteDashboardTitle">
      <div class="workspace-dashboard-summary-main">
        <div>
          <p class="workspace-kicker">School dashboard</p>
          <h1 id="siteDashboardTitle">${escapeHtml(scope.siteName || "Assigned school")} / ${escapeHtml(scope.schoolYear || "School year")}</h1>
          ${accessibleSites.length > 1 ? `
            <p class="workspace-dashboard-summary-note">
              Showing ${escapeHtml(scope.siteName || "the current school")} only across ${escapeHtml(safeNumber(accessibleSites.length))} accessible sites.
            </p>
          ` : ""}
        </div>
      </div>
      <div class="workspace-dashboard-summary-badges">
        <span class="workspace-site-context-badge">${escapeHtml(scope.tenantName || "School organization")} / site</span>
        <span class="workspace-site-context-badge">${escapeHtml(roleLabel(scope.role || primaryRoleForUser(currentUser)))}</span>
        <span class="workspace-site-context-badge">${escapeHtml(siteAccessModeLabel(scope))}</span>
        ${statusPill(scope.readOnly ? "configured" : "approved")}
        <span class="workspace-site-context-badge">${escapeHtml(selectionBadge)}</span>
        <span class="workspace-site-context-badge">No student messaging</span>
      </div>
    </section>
  `;
}

function programDashboardScopeTypeLabel(scope = {}) {
  const scopeType = String(scope?.scopeType || "").toLowerCase();
  if (scopeType === "program") return "Program assignment";
  if (scopeType === "cohort") return "Cohort assignment";
  if (scopeType === "global") return "All assigned students";
  return "Assigned students";
}

function programDashboardScopeIdLabel(scope = {}) {
  const scopeId = String(scope?.scopeId || "").trim();
  if (!scopeId || scopeId === "global") return "Current student group";
  return statusText(scopeId);
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
  const activeSort = cleanMentorDashboardSort(mentorDashboardSort);
  const assigned = prioritizeMentorDashboardStudents(body.assignedStudents || [], activeSort);
  const summary = body.summary || {
    assignedCount: assigned.length,
    needsRevision: assigned.filter((student) => student.submissionStatus === "revision_requested").length,
    missingMeeting: 0,
    presentationPending: 0,
  };
  const activeFilter = cleanMentorDashboardFilter(mentorDashboardFilter);
  const filteredAssigned = filterMentorDashboardStudents(assigned, activeFilter);
  const visibleAssigned = filteredAssigned.length ? filteredAssigned : assigned;
  const focusStudent = visibleAssigned[0] || null;
  const mentorDetailDirectory = {
    students: assigned.map((row) => ({
      studentId: row.studentId,
      displayName: row.studentName,
    })),
  };
  const mentorDetailSurface = siteStudentDetailState?.sourceSection === "mentorDashboard"
    ? renderSiteStudentDetailSurface(mentorDetailDirectory)
    : "";
  const mentorSecondaryContent = assigned.length ? `
    ${renderMentorDashboardFilters(assigned, activeFilter)}
    ${renderMentorDashboardSortControls(assigned, activeSort)}
    ${renderMentorDashboardQueueGuide(assigned, activeFilter)}
    ${filteredAssigned.length ? `
      ${renderDashboardCard("Assigned Students", mentorDashboardFilterKicker(activeFilter), renderMentorStudentCards(filteredAssigned))}
    ` : `
      ${renderDashboardCard("Assigned Students", mentorDashboardFilterKicker(activeFilter), renderMentorDashboardFilterEmptyState(activeFilter))}
    `}
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
  `;
  const mentorSummaryMetrics = `
    <div class="workspace-dashboard-grid workspace-mentor-dashboard-metrics" data-mentor-dashboard-summary-metrics="true">
      ${renderMetricTile("Assigned", summary.assignedCount || assigned.length, "Students assigned to this mentor", "mentor", "", { actionHtml: renderMentorDashboardMetricAction("all", "Show all") })}
      ${renderMetricTile("Needs Revision", summary.needsRevision, "Students with teacher changes to discuss", safeNumber(summary.needsRevision) ? "warning" : "ready", "", { actionHtml: renderMentorDashboardMetricAction("revision", "Focus list") })}
      ${renderMetricTile("Meetings", summary.missingMeeting, "Check-ins missing, missed, or needing make-up", safeNumber(summary.missingMeeting) ? "warning" : "ready", "", { actionHtml: renderMentorDashboardMetricAction("meeting", "Focus list") })}
      ${renderMetricTile("Presentations", summary.presentationPending, "Outline or presentation readiness to confirm", safeNumber(summary.presentationPending) ? "warning" : "ready", "", { actionHtml: renderMentorDashboardMetricAction("presentation", "Focus list") })}
    </div>
  `;

  if (mentorDetailSurface) {
    return `
      <section class="workspace-command-center workspace-mentor-dashboard workspace-mentor-detail-screen" data-mentor-dashboard-detail-screen="true">
        ${mentorDetailSurface}
        <details class="workspace-mentor-dashboard-secondary" data-mentor-dashboard-secondary="true">
          <summary>Show assigned students</summary>
          ${mentorSecondaryContent}
        </details>
      </section>
    `;
  }

  return `
    <section class="workspace-command-center workspace-mentor-dashboard" data-mentor-dashboard-flow="true">
      <div class="workspace-command-hero workspace-role-focus-hero">
        <div>
          <p class="workspace-kicker">Mentor</p>
          <h1>Your next check-in</h1>
          <p>Help one student move one project step forward.</p>
        </div>
        <div class="workspace-command-hero-grid">
          <span class="workspace-chip">${escapeHtml(statusText(body.scope || "mentor_assigned"))}</span>
          <span class="workspace-chip">${safeNumber(summary.assignedCount)} assigned</span>
        </div>
      </div>
      ${focusStudent ? renderMentorDashboardFocusedStudent(focusStudent, activeFilter, assigned.length) : mentorSecondaryContent}
      ${assigned.length ? renderSummaryStrip([
        { label: "Assigned", value: safeNumber(summary.assignedCount || assigned.length), detail: "Students you mentor.", tone: "mentor", concept: "Assigned" },
        { label: "Needs help", value: safeNumber(summary.needsRevision), detail: "Work needs changes.", tone: safeNumber(summary.needsRevision) ? "warning" : "ready", concept: "Needs Revision" },
        { label: "Check-in due", value: safeNumber(summary.missingMeeting), detail: "Meetings need follow-up.", tone: safeNumber(summary.missingMeeting) ? "warning" : "ready", concept: "Meetings" },
      ], { label: "Mentor work summary", className: "workspace-role-summary-strip" }) : ""}
      ${assigned.length ? `
        <details class="workspace-mentor-dashboard-secondary" data-mentor-dashboard-secondary="true">
          <summary>Show filters and other students</summary>
          ${mentorSummaryMetrics}
          ${mentorSecondaryContent}
        </details>
      ` : ""}
    </section>
  `;
}

function renderMentorAssignmentsSection() {
  if (!hasSiteMentorAssignmentRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Mentor assignments", "assigned site mentor coverage records");
  }
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
  const hasActiveUnassignedFilters = hasActiveMentorAssignmentFilters(mentorAssignmentFiltersForBody(body));
  return `
    <section class="workspace-command-center workspace-mentor-assignments" aria-labelledby="mentorAssignmentsTitle">
      ${renderSiteContextBlock(body)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Mentor coverage</p>
          <h1 id="mentorAssignmentsTitle">Mentor Assignments</h1>
          <p>
            Resolve mentor coverage for this school with assigned records,
            protected proof boundaries, and Program Teacher follow-up signals. No student messaging.
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
          <p>This view is for coverage monitoring. Assignment changes stay with authorized site operations.</p>
        </section>
      ` : ""}
      <div class="workspace-dashboard-grid">
        ${renderMetricTile("Students With Mentors", summary.studentsWithActiveMentor, "Active mentor coverage", "mentor", "mentorAssignments", { label: "View assignments", preset: "active-assignments" })}
        ${renderMetricTile("Missing Mentors", summary.studentsWithoutActiveMentor, "Needs assignment follow-up", safeNumber(summary.studentsWithoutActiveMentor) ? "warning" : "mentor", "mentorAssignments", { label: "View students", preset: "no-mentor" })}
        ${renderMetricTile("Active Mentors", summary.activeMentors, "Current mentor pool", "admin")}
        ${renderMetricTile("Overloaded Mentors", summary.overloadedMentors, "Review load before assigning", safeNumber(summary.overloadedMentors) ? "danger" : "admin")}
      </div>
      ${renderMentorAssignmentFilters(body)}
      ${renderMentorAssignmentActiveFilters(mentorAssignmentFiltersForBody(body), body?.filterOptions || {})}
      ${renderMentorAssignmentGuidedWizard(body, canManage)}
      ${siteStudentDetailState?.sourceSection === "mentorAssignments" ? renderSiteStudentDetailSurface({
        students: [
          ...unassignedStudents.map((row) => ({
            studentId: row.studentId,
            displayName: row.displayName,
          })),
          ...assignments.map((row) => ({
            studentId: row.studentId,
            displayName: row.studentName,
          })),
        ],
      }) : ""}
      <div class="workspace-mentor-assignment-layout">
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">Coverage queue</p>
              <h2>Unassigned students</h2>
              <p>${safeNumber(unassignedStudents.length)} shown of ${safeNumber(pagination.filteredTotal)} matching students at this school.</p>
            </div>
            <span class="workspace-site-context-badge">${safeNumber(pagination.total)} assigned records</span>
          </div>
          ${unassignedStudents.length ? renderMentorUnassignedStudents(unassignedStudents, permissions) : `
            <section class="workspace-empty-state-card" data-mentor-assignments-empty="true">
              <h2>${hasActiveUnassignedFilters ? "No matching students need mentors" : "No students need mentors right now"}</h2>
              ${renderProblemState(body.emptyState || {
                reason: hasActiveUnassignedFilters
                  ? "No students without active mentors match these filters at this school."
                  : "Every visible student at this school has active mentor coverage.",
                owner: "Site administration.",
                nextAction: hasActiveUnassignedFilters
                  ? "Clear filters or review active assignments."
                  : "Keep monitoring coverage and review active assignments as students change programs or status.",
              })}
            </section>
          `}
          ${renderMentorAssignmentPagination(pagination)}
        </section>
        <section class="workspace-dashboard-card">
          <div class="workspace-card-head">
            <div>
              <p class="workspace-kicker">${canManage ? "Assign mentor" : "Coverage context"}</p>
              <h2>${canManage ? "Assign Mentor" : "Assignment Changes"}</h2>
              <p>${canManage ? "Assign one mentor to one currently unassigned student at this school." : "Use this panel to see why changes are unavailable for this account."}</p>
            </div>
          </div>
          ${canManage ? renderMentorAssignmentForm(body) : `
            <section class="workspace-empty-state-card" data-mentor-assignment-controls-hidden="true">
              <h2>Assignment changes unavailable</h2>
              ${renderProblemState({
                reason: "This workspace is read-only for mentor coverage.",
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

function renderMentorAssignmentGuidedWizard(body = {}, canManage = false) {
  if (!canManage) return "";
  const students = Array.isArray(body.unassignedStudents) ? body.unassignedStudents : [];
  const mentors = Array.isArray(body.mentors) ? body.mentors : [];
  if (!students.length || !mentors.length) return "";
  const student = students[0] || {};
  const suggestedMentor = [...mentors].sort((left, right) => {
    const leftCount = safeNumber(left.activeAssignmentCount);
    const rightCount = safeNumber(right.activeAssignmentCount);
    if (leftCount !== rightCount) return leftCount - rightCount;
    return String(left.mentorName || "").localeCompare(String(right.mentorName || ""));
  })[0] || {};
  return `
    <section class="workspace-mentor-assignment-wizard" data-mentor-assignment-wizard="true">
      <div>
        <strong>Assign one student at a time</strong>
        <p>Use this order so coverage changes are deliberate before you save.</p>
      </div>
      <div class="workspace-mentor-plan-grid">
        <article>
          <span>1. Start with</span>
          <b>${escapeHtml(student.displayName || "First unassigned student")}</b>
        </article>
        <article>
          <span>2. Compare mentor load</span>
          <b>${escapeHtml(suggestedMentor.mentorName ? mentorAssignmentOptionLabel(suggestedMentor) : "Choose an active mentor")}</b>
        </article>
        <article>
          <span>3. Review before save</span>
          <b>Confirm the selected student, mentor, and reason in the Assign Mentor form.</b>
        </article>
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

function hasActiveMentorAssignmentFilters(filters = {}) {
  return Boolean(
    filters.programId
    || filters.mentorUserId
    || filters.status
    || filters.studentSearch
    || filters.noMentor
    || safeNumber(filters.limit) !== 50
    || safeNumber(filters.offset) > 0,
  );
}

function renderMentorUnassignedStudents(students = [], permissions = {}) {
  return `
    <div class="workspace-list" data-mentor-unassigned-list="true">
      ${students.map((student) => `
        <article class="workspace-student-row workspace-student-card">
          <div>
            <strong>${escapeHtml(student.displayName || "Student")}</strong>
            <p>${escapeHtml(student.email || "")}</p>
            <p class="workspace-muted">${escapeHtml(studentProgramCohortDisplay(student, "Unassigned / No cohort"))}</p>
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
              ${renderViewAsStudentAction(student.studentId, student.displayName, { sourceSection: "mentorAssignments" })}
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
          ${students.map((student) => `<option value="${escapeHtml(student.studentId || "")}">${escapeHtml(student.displayName || "Student")} / ${escapeHtml(studentProgramDisplay(student))}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Mentor</span>
        <select class="workspace-select" name="mentorUserId" required>
          ${mentors.map((mentor) => `<option value="${escapeHtml(mentor.mentorUserId || "")}">${escapeHtml(mentorAssignmentOptionLabel(mentor))}</option>`).join("")}
        </select>
      </label>
      ${renderMentorAssignmentLoadGuidance(mentors)}
      ${renderTaskFinishChecklist("mentor-assignment-save", "Before assigning this mentor", [
        ["Student still needs coverage", "Confirm the selected student is in the unassigned queue for this school.", "ready"],
        ["Mentor load checked", "Use the active assignment count and load label before choosing a mentor.", "ready"],
        ["School-only assignment", "This assignment does not create an account, change a role, or message the student.", "context"],
        ["Reason is specific", "Write why this mentor is the right coverage before saving.", "needs_review"],
      ], {
        detail: "Use these checks before saving a mentor assignment.",
        badge: "Assignment checks",
      })}
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
      <h2>No assignment can be made right now</h2>
      ${renderProblemState({
        reason: students.length ? "No active mentors are available at this school." : "No currently unassigned students are visible in this page.",
        owner: "Site administration.",
        nextAction: "Adjust filters or confirm active mentor and student memberships for this school.",
      })}
    </section>
  `;
}

function mentorAssignmentOptionLabel(mentor = {}) {
  return `${mentor.mentorName || "Mentor"} / ${safeNumber(mentor.activeAssignmentCount)} active / ${mentorLoadStatusLabel(mentor.loadStatus)}`;
}

function mentorLoadStatusLabel(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "available") return "Available";
  if (normalized === "steady") return "Steady load";
  if (normalized === "overloaded") return "High load";
  return statusText(value || "available");
}

function renderMentorAssignmentLoadGuidance(mentors = []) {
  const rows = Array.isArray(mentors) ? mentors : [];
  if (!rows.length) return "";
  const lightest = [...rows].sort((left, right) => {
    const leftCount = safeNumber(left.activeAssignmentCount);
    const rightCount = safeNumber(right.activeAssignmentCount);
    if (leftCount !== rightCount) return leftCount - rightCount;
    return String(left.mentorName || "").localeCompare(String(right.mentorName || ""));
  })[0];
  const overloadedCount = rows.filter((mentor) => normalizeStatus(mentor.loadStatus) === "overloaded").length;
  return `
    <section class="workspace-empty-state-card" data-mentor-assignment-load-guidance="true">
      <strong>Mentor load is shown before assignment</strong>
      <p>Review active assignment counts and load labels before saving a new mentor assignment.</p>
      <div class="workspace-chip-row">
        <span class="workspace-chip">Lightest visible mentor: ${escapeHtml(mentorAssignmentOptionLabel(lightest))}</span>
        ${overloadedCount ? `<span class="workspace-chip">${escapeHtml(overloadedCount)} high-load mentor${overloadedCount === 1 ? "" : "s"}</span>` : ""}
      </div>
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
            <p class="workspace-muted">${escapeHtml(mentor.siteName || "Selected school")} / ${safeNumber(mentor.activeAssignmentCount)} active assignment${safeNumber(mentor.activeAssignmentCount) === 1 ? "" : "s"}</p>
          </div>
          <div class="workspace-row-meta">
            ${statusPill(mentor.loadStatus || "available")}
            ${mentor.mentorUserId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="filter-mentor" data-mentor-id="${escapeHtml(mentor.mentorUserId || "")}">
                View assignments
              </button>
            ` : ""}
          </div>
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
            <p>${escapeHtml(assignment.mentorName || "Mentor")} / ${escapeHtml(cleanDemoSeedDisplay(assignment.programName, "Unassigned"))}</p>
            <p class="workspace-muted">Assigned ${escapeHtml(formatDate(assignment.assignedAt))}</p>
          </div>
          <div class="workspace-row-actions">
            ${statusPill(assignment.active ? "active" : "blocked")}
            ${permissions.canViewStudentDetail ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="open-student" data-mentor-student-id="${escapeHtml(assignment.studentId || "")}">
                View student detail
              </button>
              ${renderViewAsStudentAction(assignment.studentId, assignment.studentName, { sourceSection: "mentorAssignments" })}
            ` : ""}
            ${assignment.mentorUserId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-mentor-assignment-action="filter-mentor" data-mentor-id="${escapeHtml(assignment.mentorUserId || "")}">
                View mentor load
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No active assignments match these filters.</div>`;
}

function renderOperationsReadinessSection() {
  if (!hasSiteOperationsRole(roleIds(currentUser))) {
    return renderPermissionDeniedSection("Operations readiness", "site presentation, final-file, and readiness worklists");
  }
  const result = currentData.operationsReadiness;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Operations readiness", "site presentation, final-file, and readiness worklists");
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
  const dashboard = operationsDashboardModel(body);
  const copy = operationsSectionCopy(scope);
  return `
    <section class="workspace-command-center workspace-operations-readiness" aria-labelledby="operationsReadinessTitle">
      ${renderSiteContextBlock(body)}
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Operations</p>
          <h1 id="operationsReadinessTitle">Operations</h1>
          <p>${escapeHtml(copy.heroDescription)}</p>
        </div>
        <div class="workspace-command-hero-grid">
          ${statusPill(readOnly ? "configured" : "ready")}
          <span class="workspace-chip">${escapeHtml(dashboard.total ? `${dashboard.total} visible rows` : "No visible rows")}</span>
        </div>
      </div>
      ${renderApiNotice(result)}
      <section class="workspace-read-only-banner" data-operations-read-only="true">
        <strong>${escapeHtml(copy.bannerTitle)}</strong>
        <p>${escapeHtml(copy.bannerBody)}</p>
      </section>
      ${renderOperationsActionMap(body, dashboard)}
      ${renderOperationsSummaryDeck(dashboard)}
      ${renderOperationsRoleActionGuide(body, dashboard)}
      <div class="workspace-operations-insight-grid">
        ${renderReadinessScoreCard(dashboard.score, dashboard.total, "Overall readiness score", dashboard.scoreDetail)}
        ${renderDashboardCard("Stage distribution", "Presentation, archive, and readiness items", renderStackedDistribution(dashboard.stageDistribution, "Operations stage distribution"))}
        ${renderDashboardCard("Top issue categories", "Counts include totals and percent", renderHorizontalBars(dashboard.blockers, dashboard.total, { emptyLabel: "No issues found in visible rows." }))}
      </div>
      ${renderDashboardCard("Top next actions", "Ranked staff follow-up", renderRankedNextActions(dashboard.nextActions, { emptyLabel: "No issue-driven follow-up is waiting in this view." }))}
      ${renderOperationsFilters(body)}
      ${renderOperationsActiveFilters(body?.filters || operationsReadinessFilters || defaultOperationsReadinessFilters(), body?.filterOptions || {})}
      ${renderSiteStudentDetailSurface({ students: operationRowsForDetail(body) })}
      <section class="workspace-card workspace-directory-summary" aria-label="Operations readiness results">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Results</p>
            <h2>Showing ${safeNumber(pagination.returned)} of ${safeNumber(pagination.filteredTotal)}</h2>
            <p class="workspace-muted">Rows are limited to the current school and sorted with urgent or pending attention first.</p>
          </div>
          <span class="workspace-site-context-badge">${safeNumber(pagination.total)} total available</span>
        </div>
        ${renderOperationsPagination(pagination)}
      </section>
      ${renderDashboardCard("Priority worklist", "Student, program, area, issue, severity, and action", renderOperationsCompactWorklist(dashboard.worklistRows, permissions, body.filters || operationsReadinessFilters))}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderDashboardCard("Program risk", "Readiness by visible program", renderOperationsProgramBreakdown(readiness.filteredProgramBreakdown || readiness.programBreakdown || [], dashboard.total))}
        ${renderDashboardCard("Action groups", "Existing filters and review targets", renderOperationsNextActions(dashboard.groupedActions, scope))}
      </div>
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
        <span>Category</span>
        <select class="workspace-select" name="category">
          ${renderValueOptions(options.categories || [], filters.category || "", "Any category", categoryLabel)}
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
  if (filters.studentId) chips.push(activeFilterChip("Student", "This student"));
  if (filters.programId) chips.push(activeFilterChip("Program", programLabel(options.programs, filters.programId)));
  if (filters.status) chips.push(activeFilterChip("Submission", statusText(filters.status)));
  if (filters.presentationStatus) chips.push(activeFilterChip("Presentation", statusText(filters.presentationStatus)));
  if (filters.archiveStatus) chips.push(activeFilterChip("Archive", statusText(filters.archiveStatus)));
  if (filters.readiness) chips.push(activeFilterChip("Readiness", statusText(filters.readiness)));
  if (filters.category) chips.push(activeFilterChip("Category", categoryLabel(filters.category)));
  if (filters.needsAttention) chips.push(activeFilterChip("Needs attention", "Blocked, missing, or high-risk work"));
  if (filters.outlineAttention) chips.push(activeFilterChip("Outline", "Pending approval or needs revision"));
  if (filters.story) chips.push(activeFilterChip("Story", storyLabel(filters.story)));
  if (filters.risk && filters.risk !== "any") chips.push(activeFilterChip("Risk", riskLabel(filters.risk)));
  if (safeNumber(filters.limit) !== 50) chips.push(activeFilterChip("Page size", filters.limit));
  if (safeNumber(filters.offset) > 0) chips.push(activeFilterChip("Offset", filters.offset));
  return renderActiveFilterSummary("Operations readiness", chips, 'data-operations-action="reset-filters"');
}

function renderOperationsActionMap(body = {}, dashboard = {}) {
  const summary = body.summary || {};
  const presentationSummary = body.presentation?.summary || {};
  const archiveSummary = body.archive?.summary || {};
  const scope = body.scope || {};
  const sourceDetail = `${scope.siteName || "Current school"} / ${scope.schoolYear || "school year"}`;
  const failedExports = safeNumber(summary.archiveFailed || archiveSummary.failed);
  const storageSetup = safeNumber(archiveSummary.providerUnavailable);
  const missingWork = safeNumber(summary.evidenceMissing);
  const presentationFollowUp = safeNumber(summary.presentationPending)
    + safeNumber(summary.outlinePending)
    + safeNumber(presentationSummary.attentionRequired);
  const staffAction = safeNumber(summary.needsAttention) || safeNumber(dashboard.nextActions?.[0]?.count);
  const staleActivity = safeNumber(summary.staleActivity);
  const readySignals = safeNumber(dashboard.readySignals);
  const totalItems = failedExports + storageSetup + missingWork + presentationFollowUp + staffAction + staleActivity;
  const cards = [
    {
      id: "final-files",
      tone: failedExports ? "danger" : "ready",
      owner: "Site Admin",
      count: failedExports ? `${failedExports} failed` : "Clear",
      title: failedExports ? "Fix failed final files first" : "Final-file failures clear",
      detail: failedExports
        ? "Failed exports can stop closeout; confirm student detail before promising downloads."
        : "No failed final-file export count is visible in this operations view.",
      source: "Final Files source",
      preset: "archive-failed",
      actionLabel: failedExports ? "Open failures" : "Review final files",
    },
    {
      id: "storage",
      tone: storageSetup ? "danger" : "ready",
      owner: "Site Admin",
      count: storageSetup ? `${storageSetup} setup` : "Configured",
      title: storageSetup ? "Confirm storage setup" : "Storage setup clear",
      detail: storageSetup
        ? "Storage setup must be ready before final-file packages or download promises are useful."
        : "No provider-unavailable final-file problem is visible right now.",
      source: "Archive provider source",
      preset: "archive-provider-unavailable",
      actionLabel: storageSetup ? "Open setup issues" : "Review setup",
    },
    {
      id: "proof",
      tone: missingWork ? "warning" : "ready",
      owner: "Student and Program Teacher",
      count: missingWork ? `${missingWork} missing` : "Attached",
      title: missingWork ? "Find missing work" : "Work files attached",
      detail: missingWork
        ? "Tell the student exactly which file or link belongs with the current phase before any approval promise."
        : "No missing-work count is visible in this view.",
      source: "Work readiness source",
      preset: "evidence-missing",
      actionLabel: missingWork ? "Open missing work" : "Review work",
    },
    {
      id: "presentation",
      tone: presentationFollowUp ? "presentation" : "ready",
      owner: "Program Teacher or site staff",
      count: presentationFollowUp ? `${presentationFollowUp} follow-up` : "Ready",
      title: presentationFollowUp ? "Clarify presentation readiness" : "Presentation setup clear",
      detail: presentationFollowUp
        ? "Check schedule, outline, and check-in state before marking presentation readiness complete."
        : "No pending presentation, outline, or check-in problem is visible.",
      source: "Presentation source",
      preset: safeNumber(presentationSummary.attentionRequired) ? "presentation-attention" : "presentation-pending",
      actionLabel: presentationFollowUp ? "Open presentation" : "Review presentations",
    },
    {
      id: "staff-action",
      tone: staffAction ? "attention" : "ready",
      owner: "Assigned staff",
      count: staffAction ? `${staffAction} action` : "Clear",
      title: staffAction ? "Work ranked staff actions" : "No ranked staff action",
      detail: staffAction
        ? "Use this item for high-priority work when the next helper must be confirmed in student detail."
        : "No staff-action row is waiting in the current operations summary.",
      source: "Ranked worklist source",
      preset: "needs-attention",
      actionLabel: staffAction ? "Open actions" : "Review actions",
    },
    {
      id: "source-screens",
      tone: totalItems ? "quiet" : "ready",
      owner: "School team",
      count: totalItems ? `${totalItems} ${pluralize(totalItems, "item")}` : `${readySignals} ready`,
      title: totalItems ? "Return after the first issue" : "Routine monitoring",
      detail: totalItems
        ? "Open one filtered list, finish that item, then return before scanning every row."
        : "No major operations problem is visible; keep monitoring ready, in-progress, and expiring items.",
      source: sourceDetail,
      preset: staleActivity ? "stale-activity" : "archive-in-progress",
      actionLabel: totalItems ? "Open stale work" : "Review in progress",
    },
  ];

  return `
    <section class="workspace-operations-action-map" data-operations-action-map="true" aria-label="Operations start list">
      <div class="workspace-operations-action-map-head">
        <div>
          <p class="workspace-kicker">Operations start list</p>
          <h2>Work one setup item first</h2>
          <p>Pick the strongest issue, open the filtered rows, then return here before expanding every detail panel.</p>
        </div>
        <span class="workspace-chip">${escapeHtml(sourceDetail)}</span>
      </div>
      <div class="workspace-operations-action-map-grid">
        ${cards.map((card) => renderOperationsActionMapCard(card)).join("")}
      </div>
    </section>
  `;
}

function renderOperationsActionMapCard(card = {}) {
  return `
    <article class="workspace-operations-action-map-card ${escapeHtml(card.tone || "quiet")}" data-operations-action-map-card="${escapeHtml(card.id || "action")}" data-operations-action-team="${escapeHtml(card.owner || "Assigned staff")}">
      <div>
        <div class="workspace-operations-action-map-meta">
          <span>${escapeHtml(card.owner || "Assigned staff")}</span>
          <b>${escapeHtml(card.count || "0")}</b>
        </div>
        <strong>${escapeHtml(card.title || "Review operations item")}</strong>
        <p>${escapeHtml(card.detail || "Open the matching source rows before changing any status.")}</p>
        ${card.source ? `<small>${escapeHtml(card.source)}</small>` : ""}
      </div>
      ${card.preset ? operationsPresetButton(card.preset, card.actionLabel || "Review work") : `<span class="workspace-summary-badge">Summary only</span>`}
    </article>
  `;
}

function renderOperationsRoleActionGuide(body = {}, dashboard = {}) {
  const roles = roleIds(currentUser);
  const isProgramTeacher = roles.has("program_teacher") && !hasGlobalAdminRole(roles) && !roles.has("site_admin") && !roles.has("administration");
  const summary = body.summary || {};
  const actions = isProgramTeacher
    ? [
        ["Review work", "Approve next steps or request changes in Review Work.", "teacher", "submitted"],
        ["Find missing work", "Tell the student exactly which file or link belongs with the current phase work.", "operations", "evidence-missing"],
        ["Clarify presentation readiness", "Use presentation and outline status for staff follow-up.", "operations", "presentation-pending"],
      ]
    : [
        ["Assign coverage", "Use Mentor Assignments when students have no active mentor.", "mentorAssignments", "no-mentor"],
        ["Fix final-file blockers", "Use Operations when exports fail or storage setup is unavailable.", "operations", "archive-failed"],
        ["Check account access", "Use Users & Access before removing accounts or changing school roles.", "adminUsers", ""],
      ];
  return `
    <section class="workspace-operations-role-guide" data-operations-role-action-guide="true" data-operations-role-guide="${escapeHtml(isProgramTeacher ? "program-teacher" : "site-admin")}">
      <div>
        <strong>${escapeHtml(isProgramTeacher ? "Program Teacher actions" : "Site Admin actions")}</strong>
        <p>${escapeHtml(isProgramTeacher
          ? "Focus on issues you can solve through feedback, approval, files, and presentation guidance."
          : "Focus on school setup, mentor coverage, accounts, final-file storage, and escalation paths.")}</p>
      </div>
      <div class="workspace-operations-role-grid">
        ${actions.map(([label, detail, section, preset]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
            ${availableSectionIdsForAnyMode().has(section) ? `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="${escapeHtml(section)}"${preset ? ` data-section-preset="${escapeHtml(preset)}"` : ""}>Open</button>` : `<span class="workspace-summary-badge">Summary only</span>`}
          </article>
        `).join("")}
      </div>
      <p class="workspace-muted">Visible issues: ${escapeHtml(safeNumber(dashboard.total || summary.studentsTotal || summary.studentsActive))} rows.</p>
    </section>
  `;
}

function hasActiveOperationsFilters(filters = {}) {
  const active = filters || {};
  return Boolean(
    active.studentId
      || active.programId
      || active.status
      || active.presentationStatus
      || active.archiveStatus
      || active.readiness
      || active.category
      || active.needsAttention
      || active.outlineAttention
      || active.story
      || (active.risk && active.risk !== "any")
  );
}

function operationsDashboardModel(body = {}) {
  const summary = body.summary || {};
  const presentation = body.presentation || {};
  const archive = body.archive || {};
  const readiness = body.readiness || {};
  const pagination = body.pagination || {};
  const total = operationsVisibleTotal(summary, pagination);
  const score = operationsReadinessScore(summary, presentation.summary || {}, archive.summary || {}, total);
  const readySignals = Math.max(
    safeNumber(summary.presentationReady),
    safeNumber(summary.archiveReady),
    safeNumber(presentation.summary?.completed),
    safeNumber(archive.summary?.complete),
  );
  const scoreDetail = total
    ? "100 minus weighted issues across visible rows."
    : "No visible records to summarize yet.";
  const blockers = operationsBlockerBars(summary, presentation.summary || {}, archive.summary || {}, total);
  const nextActions = operationsRankedNextActions(summary, presentation.summary || {}, archive.summary || {}, total);
  return {
    total,
    score,
    scoreDetail,
    readySignals,
    blockers,
    nextActions,
    groupedActions: readiness.nextActions || [],
    stageDistribution: operationsStageDistribution(summary, presentation.summary || {}, archive.summary || {}),
    worklistRows: operationsCompactRows(body),
  };
}

function operationsVisibleTotal(summary = {}, pagination = {}) {
  const explicitTotal = safeNumber(summary.studentsTotal || pagination.total || pagination.filteredTotal);
  if (explicitTotal) return explicitTotal;
  return Math.max(
    safeNumber(summary.presentationReady),
    safeNumber(summary.presentationPending),
    safeNumber(summary.archiveReady),
    safeNumber(summary.archiveMissing),
    safeNumber(summary.needsAttention),
    safeNumber(pagination.returned),
  );
}

function operationsReadinessScore(summary = {}, presentationSummary = {}, archiveSummary = {}, total = 0) {
  const denominator = safeNumber(total);
  if (!denominator) return null;
  const weightedBlockers =
    (safeNumber(summary.archiveFailed) * 2)
    + (safeNumber(archiveSummary.providerUnavailable) * 2)
    + (safeNumber(summary.archiveExpired) * 1.5)
    + (safeNumber(summary.evidenceMissing) * 1.4)
    + safeNumber(summary.needsAttention)
    + (safeNumber(summary.staleActivity) * 0.6)
    + (safeNumber(summary.presentationPending) * 0.5)
    + (safeNumber(summary.outlinePending) * 0.5)
    + (safeNumber(presentationSummary.attentionRequired) * 1.2)
    + (safeNumber(summary.archiveInProgress) * 0.25)
    + (safeNumber(summary.archiveExpiringSoon) * 0.5);
  return clampPercent(100 - Math.round((weightedBlockers / denominator) * 100));
}

function operationsStageDistribution(summary = {}, presentationSummary = {}, archiveSummary = {}) {
  return [
    { label: "Presentation ready", value: safeNumber(summary.presentationReady || presentationSummary.ready), tone: "teacher" },
    { label: "Presentation pending", value: safeNumber(summary.presentationPending || presentationSummary.pending) + safeNumber(summary.outlinePending), tone: "warning" },
    { label: "Final files ready", value: safeNumber(summary.archiveReady || archiveSummary.ready || archiveSummary.complete), tone: "mentor" },
    { label: "Final files in progress", value: safeNumber(summary.archiveInProgress) + safeNumber(archiveSummary.queued) + safeNumber(archiveSummary.running), tone: "admin" },
    { label: "Needs help or failed", value: safeNumber(summary.archiveFailed) + safeNumber(archiveSummary.providerUnavailable) + safeNumber(summary.archiveExpired), tone: "danger" },
    { label: "Stale or missing", value: safeNumber(summary.staleActivity) + safeNumber(summary.evidenceMissing), tone: "warning" },
  ].filter((item) => safeNumber(item.value) > 0);
}

function operationsBlockerBars(summary = {}, presentationSummary = {}, archiveSummary = {}, total = 0) {
  return [
    { label: "Needs staff action", value: safeNumber(summary.needsAttention), tone: "danger", detail: "Missing, failed, or high-priority rows", preset: "needs-attention" },
    { label: "Stale activity", value: safeNumber(summary.staleActivity), tone: "warning", detail: "No recent student progress", preset: "stale-activity" },
    { label: "Missing work", value: safeNumber(summary.evidenceMissing), tone: "warning", detail: "File, link, or sent-work progress missing", preset: "evidence-missing" },
    { label: "Final-file issues", value: safeNumber(summary.archiveFailed), tone: "danger", detail: "Final-file follow-up needed", preset: "archive-failed" },
    { label: "Storage setup needed", value: safeNumber(archiveSummary.providerUnavailable), tone: "danger", detail: "Final-file package setup needed", preset: "archive-provider-unavailable" },
    { label: "Check-in needed", value: safeNumber(presentationSummary.attentionRequired), tone: "warning", detail: "Checked out but not checked in", preset: "presentation-attention" },
  ].filter((item) => safeNumber(item.value) > 0 || safeNumber(total) === 0);
}

function operationsRankedNextActions(summary = {}, presentationSummary = {}, archiveSummary = {}, total = 0) {
  const actions = [
    { label: "Review final-file issues", count: safeNumber(summary.archiveFailed), why: "Failed exports stop final-file package readiness.", preset: "archive-failed", tone: "danger" },
    { label: "Confirm storage setup", count: safeNumber(archiveSummary.providerUnavailable), why: "Storage setup must be ready before final-file packages can run.", preset: "archive-provider-unavailable", tone: "danger" },
    { label: "Refresh expired downloads", count: safeNumber(summary.archiveExpired), why: "Expired windows need staff follow-up before downloads are useful.", preset: "archive-expired", tone: "danger" },
    { label: "Find missing work rows", count: safeNumber(summary.evidenceMissing), why: "Missing work affects readiness and final-file confidence.", preset: "evidence-missing", tone: "warning" },
    { label: "Review staff-action rows", count: safeNumber(summary.needsAttention), why: "These are the highest-priority readiness issues.", preset: "needs-attention", tone: "danger" },
    { label: "Check stale activity rows", count: safeNumber(summary.staleActivity), why: "Stale records need current staff context.", preset: "stale-activity", tone: "warning" },
    { label: "Review pending outlines", count: safeNumber(summary.outlinePending), why: "Outline status can hold up presentation readiness.", preset: "outline-pending", tone: "warning" },
    { label: "Confirm final-file packages in progress", count: safeNumber(summary.archiveInProgress), why: "Queued or running packages should finish cleanly.", preset: "archive-in-progress", tone: "admin" },
    { label: "Review presentation follow-up", count: safeNumber(summary.presentationPending) + safeNumber(presentationSummary.attentionRequired), why: "Schedule, outline, and check-in issues affect day-of readiness.", preset: "presentation-pending", tone: "teacher" },
    { label: "Watch expiring downloads", count: safeNumber(summary.archiveExpiringSoon), why: "Download windows should not quietly expire.", preset: "archive-expiring-soon", tone: "warning" },
  ].filter((action) => safeNumber(action.count) > 0);
  if (!actions.length && safeNumber(total)) {
    return [{ label: "No issues found", count: 0, why: "All visible issue counts are clear.", tone: "mentor" }];
  }
  return actions;
}

function renderOperationsSummaryDeck(dashboard = {}) {
  return renderDashboardKpis([
    {
      label: "Readiness score",
      value: dashboard.score === null ? "No score yet" : `${dashboard.score}/100`,
      detail: dashboard.score === null ? "No visible records" : dashboard.scoreDetail,
      tone: dashboard.score !== null && dashboard.score < 70 ? "warning" : "mentor",
    },
    {
      label: "Needs staff action",
      value: metricWithPercent(dashboard.blockers.find((item) => item.label === "Needs staff action")?.value || 0, dashboard.total),
      detail: "Missing, failed, or high-priority rows",
      tone: "danger",
      actionHtml: operationsPresetButton("needs-attention"),
    },
    {
      label: "Final-file issues",
      value: metricWithPercent(dashboard.blockers.find((item) => ["final_file_issues", "archive_failed"].includes(normalizeStatus(item.label)))?.value || 0, dashboard.total),
      detail: "Final-file follow-up",
      tone: "danger",
      actionHtml: operationsPresetButton("archive-failed"),
    },
    {
      label: "Missing work",
      value: metricWithPercent(dashboard.blockers.find((item) => ["missing_work", "evidence_missing"].includes(normalizeStatus(item.label)))?.value || 0, dashboard.total),
      detail: "File, link, or progress missing",
      tone: "warning",
      actionHtml: operationsPresetButton("evidence-missing"),
    },
    {
      label: "Stale activity",
      value: metricWithPercent(dashboard.blockers.find((item) => item.label === "Stale activity")?.value || 0, dashboard.total),
      detail: "No recent student progress",
      tone: "warning",
      actionHtml: operationsPresetButton("stale-activity"),
    },
    {
      label: "Ready items",
      value: metricWithPercent(dashboard.readySignals, dashboard.total),
      detail: "Best available ready/complete count",
      tone: "mentor",
    },
  ], { label: "Operations top summary", className: "workspace-operations-kpis" });
}

function operationsSectionCopy(scope = {}) {
  const role = String(scope.role || "");
  if (role === "program_teacher") {
    return {
      heroDescription: "Check talks, final files, and work that needs help. Open a student. Plan the next step with school staff.",
      bannerTitle: "Program follow-up worklists",
      bannerBody: "These worklists stay within your assigned students. Open student detail for context; scheduling, final-file package changes, and account updates stay with site staff.",
      emptyOwner: "Assigned Program Teacher and site administration.",
      emptyUnfilteredNextAction: "Keep monitoring assigned-student presentation and final-file milestones.",
      emptyFilteredNextAction: "Clear filters or return to the Program Dashboard for broader assigned-student context.",
      nextActionsEmpty: "No grouped follow-up is waiting in the current program filters.",
    };
  }
  if (role === "administration" || role === "viewer") {
    return {
      heroDescription: "Read-only operations. Open student detail for context; status changes stay with authorized staff.",
      bannerTitle: "Read-only operations worklists",
      bannerBody: "These worklists are monitoring-only across protected files, assigned students, and Program Teacher follow-up. Open student detail for context; status changes stay with authorized staff.",
      emptyOwner: "Site administration.",
      emptyUnfilteredNextAction: "Continue monitoring ready and in-progress work for this school.",
      emptyFilteredNextAction: "Clear filters or return to the current school overview for broader context.",
      nextActionsEmpty: "No grouped monitoring follow-up is waiting for the current filters.",
    };
  }
  return {
    heroDescription: "School operations. Review presentation, final-file, and readiness issues across this school, then use student detail and linked worklists to coordinate follow-up.",
    bannerTitle: "School follow-up worklists",
    bannerBody: "These worklists highlight protected student issues across files, presentations, and final-file readiness. Open student detail for context and choose the right next helper.",
    emptyOwner: "Site administration.",
    emptyUnfilteredNextAction: "Continue monitoring ready, scheduled, and in-progress work across this school.",
    emptyFilteredNextAction: "Clear filters or open student detail for broader school context.",
    nextActionsEmpty: "No grouped school follow-up is waiting for the current filters.",
  };
}

function renderHorizontalBars(items = [], denominator = 0, options = {}) {
  const rows = (Array.isArray(items) ? items : []).filter((item) => safeNumber(item.value) > 0);
  const total = safeNumber(denominator) || rows.reduce((sum, item) => sum + safeNumber(item.value), 0);
  if (!rows.length) return `<div class="workspace-empty">${escapeHtml(options.emptyLabel || "No summary rows are available yet.")}</div>`;
  return `
    <div class="workspace-bar-list ${escapeHtml(options.className || "")}" aria-label="${escapeHtml(options.label || "Ranked counts")}">
      ${rows.map((item) => `
        <article class="workspace-bar-row ${escapeHtml(item.tone || "")}">
          <div>
            <strong>${escapeHtml(item.label || "Summary")}</strong>
            <span>${escapeHtml(metricWithPercent(item.value, total))}</span>
          </div>
          <div class="workspace-mini-meter" role="img" aria-label="${escapeHtml(`${item.label || "Summary"}: ${metricWithPercent(item.value, total)}`)}">
            ${renderProgressSvg(percentOf(item.value, total), item.tone || "")}
          </div>
          ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
          ${item.preset ? operationsPresetButton(item.preset) : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function renderRankedNextActions(actions = [], options = {}) {
  const rows = (Array.isArray(actions) ? actions : []).filter(Boolean);
  if (!rows.length) return `<div class="workspace-empty">${escapeHtml(options.emptyLabel || "No next actions are waiting right now.")}</div>`;
  return `
    <ol class="workspace-ranked-list" data-operations-ranked-actions="true">
      ${rows.map((action) => `
        <li class="${escapeHtml(action.tone || "")}">
          <div>
            <strong>${escapeHtml(action.count ? `${action.label} (${action.count})` : action.label)}</strong>
            <p>${escapeHtml(action.why || "Review this operations item.")}</p>
            <p class="workspace-owner-action workspace-owner-action-inline" data-operations-ranked-owner="true">
              <span>Who can help: ${escapeHtml(operationsRankedActionOwner(action))}</span>
              <small>Next step: ${escapeHtml(operationsRankedActionNextStep(action))}</small>
            </p>
          </div>
          ${action.preset ? operationsPresetButton(action.preset) : `<span class="workspace-summary-badge">Summary only</span>`}
        </li>
      `).join("")}
    </ol>
  `;
}

function operationsRankedActionOwner(action = {}) {
  const preset = normalizeStatus(action.preset || "");
  if (["archive_failed", "archive_provider_unavailable", "archive_expired", "archive_expiring_soon", "archive_in_progress"].includes(preset)) return "Site Admin";
  if (["presentation_pending", "presentation_attention", "outline_pending"].includes(preset)) return "Program Teacher or site staff";
  if (preset === "evidence_missing") return "Student with Program Teacher follow-up";
  if (preset === "stale_activity" || preset === "needs_attention") return "Assigned staff";
  return "Site administration";
}

function operationsRankedActionNextStep(action = {}) {
  const preset = normalizeStatus(action.preset || "");
  if (preset === "archive_provider_unavailable") return "Confirm storage setup before asking students to use final-file downloads.";
  if (preset === "archive_failed") return "Open failed final-file rows, check student detail, then use the approved export flow.";
  if (preset === "archive_expired") return "Review the expired download window before promising a package is ready.";
  if (preset === "evidence_missing") return "Tell the student exactly which file or link belongs with the current phase work.";
  if (preset === "outline_pending") return "Confirm the outline decision before presentation readiness is marked complete.";
  if (preset === "presentation_pending" || preset === "presentation_attention") return "Confirm schedule, outline, and check-in state in the presentation workflow.";
  if (preset === "stale_activity") return "Open student detail and verify whether the student, mentor, or Program Teacher should take the next step.";
  return "Open the filtered operations rows and send each issue to the right helper.";
}

function operationsPresetButton(preset, label = "Review work") {
  if (!preset || !availableSectionIdsForAnyMode().has("operations")) return "";
  return `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="${escapeHtml(preset)}">${escapeHtml(label)}</button>`;
}

function operationsCompactRows(body = {}) {
  const presentationRows = ((body.presentation || {}).rows || []).map((row) => ({
    ...row,
    area: "Presentation",
    owner: operationsRowOwner(row, "Presentation"),
    issue: row.reason || row.nextAction || "Presentation readiness pending.",
    nextAction: operationsRowNextAction(row, "Presentation"),
    severity: operationsPresentationSeverity(row),
    context: row.scheduledFor ? `${formatDate(row.scheduledFor)} / ${row.location || "Location pending"}` : row.location || "Schedule pending",
    sort: operationsSeverityRank(operationsPresentationSeverity(row)),
  }));
  const archiveRows = ((body.archive || {}).rows || []).map((row) => ({
    ...row,
    area: "Archive",
    owner: operationsRowOwner(row, "Archive"),
    issue: archiveCompactIssue(row),
    nextAction: operationsRowNextAction(row, "Archive"),
    severity: operationsArchiveSeverity(row),
    context: archiveProviderStatusText(row.providerStatus),
    sort: operationsSeverityRank(operationsArchiveSeverity(row)),
  }));
  const readinessRows = ((body.readiness || {}).attentionRows || []).map((row) => ({
    ...row,
    area: categoryLabel(row.category || "readiness"),
    owner: operationsRowOwner(row, row.category || "readiness"),
    issue: row.reason || row.nextAction || "Needs readiness review.",
    nextAction: operationsRowNextAction(row, row.category || "readiness"),
    severity: row.status || "attention_required",
    context: row.owner || "Site administration",
    sort: operationsSeverityRank(row.status || "attention_required"),
  }));
  return [...presentationRows, ...archiveRows, ...readinessRows]
    .sort((a, b) => safeNumber(a.sort) - safeNumber(b.sort))
    .slice(0, 16);
}

function operationsRowOwner(row = {}, area = "") {
  const explicitOwner = String(row.owner || row.ownerName || "").trim();
  if (explicitOwner) return explicitOwner;
  const normalizedArea = normalizeStatus(area);
  if (normalizedArea === "archive") return "Site Admin";
  if (normalizedArea === "mentor") return "Site Admin";
  if (normalizedArea === "presentation") return "Program Teacher";
  if (normalizedArea === "review" || normalizedArea === "evidence") return "Program Teacher";
  if (normalizeStatus(row.archiveStatus || row.exportStatus) === "provider_unavailable") return "Site Admin";
  return "Assigned staff";
}

function operationsRowNextAction(row = {}, area = "") {
  const explicitAction = String(row.nextAction || "").trim();
  if (explicitAction) return explicitAction;
  const normalizedArea = normalizeStatus(area);
  const archiveStatus = normalizeStatus(row.archiveStatus || row.exportStatus || row.providerStatus);
  const presentationStatus = normalizeStatus(row.presentationStatus || row.outlineStatus);
  if (normalizedArea === "archive" && archiveStatus === "failed") return "Open the student detail, confirm final-file requirements, then retry or escalate the export.";
  if (normalizedArea === "archive" && archiveStatus === "provider_unavailable") return "Confirm storage provider setup before students depend on final-file downloads.";
  if (normalizedArea === "presentation" && ["pending", "missing", "outline_pending"].includes(presentationStatus)) return "Confirm the outline or schedule issue, then update the presentation readiness row.";
  if (normalizedArea === "evidence") return "Tell the student exactly which file or link is missing before approving next steps.";
  if (normalizedArea === "mentor") return "Assign or confirm mentor coverage before the next student check-in.";
  return "Open student detail, confirm the issue, then save the next staff action in the matching workflow.";
}

function archiveCompactIssue(row = {}) {
  const support = archiveWorklistSupportText(row);
  if (!row.reason || row.reason === support) return support;
  return `${row.reason} ${support}`;
}

function operationsPresentationSeverity(row = {}) {
  const status = normalizeStatus(row.presentationStatus);
  if (status === "attention_required" || normalizeStatus(row.checkInStatus) === "missing") return "needs_review";
  if (["outline_pending", "outline_revision_needed", "pending", "missing"].includes(status) || ["pending", "revision_needed"].includes(normalizeStatus(row.outlineStatus))) return "needs_staff_action";
  return "in_progress";
}

function operationsArchiveSeverity(row = {}) {
  const status = normalizeStatus(row.archiveStatus || row.exportStatus);
  if (status === "failed") return "failed";
  if (status === "provider_unavailable") return "setup_needed";
  if (status === "expired") return "expired";
  if (status === "expiring_soon") return "expiring_soon";
  if (["queued", "running", "in_progress"].includes(status)) return "in_progress";
  if (["complete", "ready"].includes(status)) return "ready";
  return status || "needs_review";
}

function operationsSeverityRank(status) {
  const normalized = normalizeStatus(status);
  const ranks = {
    failed: 1,
    setup_needed: 2,
    blocked: 3,
    expired: 4,
    attention_required: 5,
    needs_staff_action: 5,
    needs_review: 6,
    missing: 7,
    stale: 8,
    expiring_soon: 9,
    in_progress: 10,
    ready: 20,
    complete: 20,
  };
  return ranks[normalized] || 12;
}

function renderOperationsCompactWorklist(rows = [], permissions = {}, filters = {}) {
  const filtered = hasActiveOperationsFilters(filters);
  if (!rows.length) {
    const empty = operationsCompactEmptyStateCopy(filters, filtered);
    return `
      <section class="workspace-empty-state-card" data-operations-compact-worklist-empty="true">
        <h2>${escapeHtml(empty.heading || "No visible records to summarize yet.")}</h2>
        ${renderProblemState(empty)}
      </section>
    `;
  }
  return `
    <div class="workspace-worklist" data-operations-compact-worklist="true">
      <div class="workspace-worklist-head" aria-hidden="true">
        <span>Student</span>
        <span>Program</span>
        <span>Area</span>
        <span>Owner</span>
        <span>Issue</span>
        <span>Do this next</span>
        <span>Severity</span>
        <span>Action</span>
      </div>
      ${rows.map((row) => `
        <article class="workspace-worklist-row" data-operations-worklist-area="${escapeHtml(normalizeStatus(row.area || "readiness"))}">
          <div>
            <span class="workspace-worklist-label">Student</span>
            <strong>${escapeHtml(row.studentName || "Student")}</strong>
            <small>${escapeHtml(row.context || "Current context unavailable")}</small>
          </div>
          <div>
            <span class="workspace-worklist-label">Program</span>
            <span>${escapeHtml(cleanDemoSeedDisplay(row.programName, "Unassigned"))}</span>
          </div>
          <div>
            <span class="workspace-worklist-label">Area</span>
            <span>${escapeHtml(row.area || "Readiness")}</span>
          </div>
          <div data-operations-owner="true">
            <span class="workspace-worklist-label">Owner</span>
            <span>${escapeHtml(row.owner || operationsRowOwner(row, row.area))}</span>
          </div>
          <div>
            <span class="workspace-worklist-label">Issue</span>
            <span>${escapeHtml(row.issue || "Review this row.")}</span>
          </div>
          <div data-operations-row-next-action="true">
            <span class="workspace-worklist-label">Do this next</span>
            <span>${escapeHtml(row.nextAction || operationsRowNextAction(row, row.area))}</span>
          </div>
          <div>
            <span class="workspace-worklist-label">Severity</span>
            ${statusPill(row.severity || row.status || "needs_review")}
          </div>
          <div class="workspace-worklist-action">
            ${operationsDetailButton(row.studentId, permissions) || `<span class="workspace-summary-badge">Summary only</span>`}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function operationsCompactEmptyStateCopy(filters = {}, filtered = false) {
  if (filters.archiveStatus) return operationsArchiveEmptyStateCopy(filters, filtered);
  if (filters.presentationStatus || filters.outlineAttention) return operationsPresentationEmptyStateCopy(filters, filtered);
  return operationsReadinessEmptyStateCopy(filters, filtered);
}

function operationsPresentationEmptyStateCopy(filters = {}, filtered = false) {
  const owner = "Site administration.";
  if (!filtered) {
    return {
      heading: "No presentation work waiting",
      reason: "No presentation readiness work is waiting in this view.",
      owner,
      nextAction: "Continue monitoring presentation readiness.",
    };
  }
  if (filters.studentId) {
    return {
      heading: "No presentation work for this student",
      reason: "This student has no presentation readiness rows matching these Operations filters.",
      owner,
      nextAction: "Clear the student filter or return to student detail for Presentation context.",
    };
  }
  return {
    heading: "No matching presentation work",
    reason: "No presentation readiness work matches these filters for this school.",
    owner,
    nextAction: "Clear filters or review the student directory.",
  };
}

function archiveWorklistSupportText(row = {}) {
  const archiveStatus = normalizeStatus(row.archiveStatus);
  if (archiveStatus === "provider_unavailable") return "Storage setup is needed before final-file packages can be prepared.";
  if (archiveStatus === "expired") return "Download window expired.";
  if (archiveStatus === "expiring_soon" || row.downloadExpiresSoon) return "Download window expiring soon.";
  if (archiveStatus === "queued" || archiveStatus === "running") return "Final-file package is being prepared.";
  if (archiveStatus === "complete" && row.downloadReady) return "Download is available.";
  if (archiveStatus === "failed") return "Final-file export needs staff follow-up.";
  if (archiveStatus === "ready") return "Ready for final-file package preparation.";
  return "File details are protected.";
}

function operationsArchiveEmptyStateCopy(filters = {}, filtered = false) {
  const archiveStatus = normalizeStatus(filters.archiveStatus);
  const owner = "Site administration.";
  if (!filtered) {
    return {
      heading: "No final-file work waiting",
      reason: "No final-file readiness or export failures are waiting in this view.",
      owner,
      nextAction: "Continue monitoring final-file readiness.",
    };
  }
  if (filters.studentId) {
    return {
      heading: "No final-file work for this student",
      reason: "This student has no final-file readiness rows matching these Operations filters.",
      owner,
      nextAction: "Clear the student filter or return to student detail for Final Files context.",
    };
  }
  if (archiveStatus === "provider_unavailable") {
    return {
      heading: "No storage setup blockers match",
      reason: "No final-file rows waiting on storage setup match these filters for this school.",
      owner,
      nextAction: "Clear filters or review final-file failures for broader closeout blockers.",
    };
  }
  if (archiveStatus === "expired") {
    return {
      heading: "No expired downloads match",
      reason: "No final-file rows with expired download windows match these filters for this school.",
      owner,
      nextAction: "Clear filters or review expiring final-file downloads for active follow-up.",
    };
  }
  if (archiveStatus === "expiring_soon") {
    return {
      heading: "No expiring downloads match",
      reason: "No final-file rows with download windows ending soon match these filters for this school.",
      owner,
      nextAction: "Clear filters or review completed final-file packages.",
    };
  }
  if (archiveStatus === "in_progress" || archiveStatus === "queued" || archiveStatus === "running") {
    return {
      heading: "No final-file packages in progress match",
      reason: "No queued or running final-file packages match these filters for this school.",
      owner,
      nextAction: "Clear filters or review final-file-ready students.",
    };
  }
  if (archiveStatus === "failed") {
    return {
      heading: "No matching final-file follow-up",
      reason: "No students with final-file export follow-up match these filters.",
      owner,
      nextAction: "Clear filters or review storage setup blockers.",
    };
  }
  if (archiveStatus === "ready") {
    return {
      heading: "No final-file-ready students match",
      reason: "No final-file-ready students match these filters for this school.",
      owner,
      nextAction: "Clear filters or review broader final-file readiness work.",
    };
  }
  return {
    heading: "No matching final-file work",
    reason: "No final-file readiness work matches these filters for this school.",
    owner,
    nextAction: "Clear filters or open student detail from the directory.",
  };
}

function operationsReadinessEmptyStateCopy(filters = {}, filtered = false) {
  const copy = operationsSectionCopy(unwrap(currentData.operationsReadiness)?.scope || {});
  const owner = copy.emptyOwner;
  if (!filtered) {
    return {
      heading: "No operations attention waiting",
      reason: "No blocked, missing, or attention-required work is waiting right now.",
      owner,
      nextAction: copy.emptyUnfilteredNextAction,
    };
  }
  if (filters.studentId) {
    return {
      heading: "No operations attention for this student",
      reason: "This student has no blocked, missing, or attention-required rows matching these Operations filters.",
      owner,
      nextAction: "Clear the student filter or return to student detail for broader context.",
    };
  }
  return {
    heading: "No matching operations attention",
    reason: "No blocked, missing, or attention-required readiness work matches these filters.",
    owner,
    nextAction: copy.emptyFilteredNextAction,
  };
}

function renderOperationsProgramBreakdown(rows = [], denominator = 0) {
  return rows.length ? `
    <div class="workspace-bar-list" data-operations-program-breakdown="true">
      ${rows.map((row) => `
        <article class="workspace-bar-row">
          <div>
            <strong>${escapeHtml(cleanDemoSeedDisplay(row.programName, "Program"))}</strong>
            <span>${escapeHtml(metricWithPercent(row.needsAttention || row.archiveFailed || row.presentationPending || 0, row.studentsTotal || denominator))} with risk signals</span>
          </div>
          <div class="workspace-mini-meter" role="img" aria-label="${escapeHtml(`${cleanDemoSeedDisplay(row.programName, "Program")} risk: ${metricWithPercent(row.needsAttention || row.archiveFailed || row.presentationPending || 0, row.studentsTotal || denominator)}`)}">
            ${renderProgressSvg(percentOf(row.needsAttention || row.archiveFailed || row.presentationPending || 0, row.studentsTotal || denominator), safeNumber(row.archiveFailed) ? "danger" : safeNumber(row.needsAttention) ? "warning" : "mentor")}
          </div>
          <div class="workspace-chip-row">
            <span class="workspace-site-context-badge">${safeNumber(row.presentationPending)} presentation</span>
            <span class="workspace-site-context-badge">${safeNumber(row.archiveFailed)} archive failed</span>
            <span class="workspace-site-context-badge">${safeNumber(row.needsAttention)} attention</span>
            ${row.programId ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="operations" data-section-preset="program-breakdown" data-program-id="${escapeHtml(row.programId)}">
                View program list
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">No program breakdown is available for these filters.</div>`;
}

function renderOperationsNextActions(rows = [], scope = {}) {
  const copy = operationsSectionCopy(scope);
  return rows.length ? `
    <div class="workspace-list" data-operations-next-actions="true">
      ${rows.map((row) => `
        <article class="workspace-row">
          <div>
            <strong>${escapeHtml(row.nextAction || "Review student detail")}</strong>
            <p>${escapeHtml(row.owner || "Site administration")} / ${escapeHtml(categoryLabel(row.category || "readiness"))}</p>
          </div>
          <div class="workspace-row-actions">
            <span class="workspace-site-context-badge">${safeNumber(row.count)} item${safeNumber(row.count) === 1 ? "" : "s"}</span>
            ${row.category ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-operations-action="filter-category" data-operations-category="${escapeHtml(row.category)}">
                View ${escapeHtml(categoryLabel(row.category).toLowerCase())} list
              </button>
            ` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  ` : `<div class="workspace-empty">${escapeHtml(copy.nextActionsEmpty)}</div>`;
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
    ${renderViewAsStudentAction(studentId, "", { sourceSection: "operations" })}
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

function renderAdminAuditEmptyState(hasFilters = false, filterLabel = "") {
  return `
    <article class="workspace-empty-state-card" data-admin-audit-empty-state="true">
      <strong>${escapeHtml(hasFilters ? "No audit events match this filter." : "No audit events found.")}</strong>
      <p>${escapeHtml(hasFilters
        ? `No redacted audit events match ${filterLabel || "the selected filter"} in this result.`
        : "No redacted audit events are available in this result yet.")}</p>
      ${renderProblemState({
        reason: hasFilters ? "The selected audit filter returned no rows." : "The audit request succeeded but returned no event rows.",
        owner: "Global admin",
        nextAction: hasFilters
          ? "Show recent activity or choose a different filter before drawing conclusions."
          : "Refresh after access, account, import, or review changes before treating the audit view as quiet.",
        actions: [
          { label: "Refresh workspace", problemAction: "refresh" },
          hasFilters ? { label: "Show recent activity", section: "audit" } : null,
        ].filter(Boolean),
      })}
    </article>
  `;
}

function renderAdminAuditSection() {
  const result = currentData.auditEvents;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Audit", "audit activity records");
  }
  const auditEvents = unwrap(result);
  if (!auditEvents) {
    return `
      <section class="workspace-card workspace-error-card">
        <p class="workspace-kicker">Audit</p>
        <h2>Audit summary unavailable</h2>
        ${renderApiNotice(result)}
      </section>
    `;
  }
  const events = Array.isArray(auditEvents.events) ? auditEvents.events : [];
  const hasFilters = Boolean(adminAuditFilters.action || adminAuditFilters.entityType);
  const filterLabel = adminAuditFilterLabel(adminAuditFilters);
  return `
    <section class="workspace-command-center workspace-admin-audit-flow" data-admin-audit-flow="true">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Audit</p>
          <h1>Choose one audit check</h1>
          <p>${escapeHtml(hasFilters
            ? `Showing recent changes for ${filterLabel}.`
            : "Start with the latest redacted events, then open one saved check only if the pattern needs follow-up.")}</p>
        </div>
        <span class="workspace-chip">${safeNumber(events.length)} recent event${safeNumber(events.length) === 1 ? "" : "s"}</span>
      </div>
      ${renderAdminAuditStartFlow(events, adminAuditFilters)}
      <details class="workspace-admin-supporting-disclosure workspace-admin-audit-supporting" data-admin-audit-supporting="details">
        <summary>
          <span class="workspace-kicker">Supporting details</span>
          <strong>Show audit counts, filters, and recent rows</strong>
        </summary>
        ${renderAdminAuditOperationsSummary(events)}
        ${renderAdminAuditAccessReviewPanel(events, adminAuditFilters)}
        <div class="workspace-filter-bar" data-admin-audit-filters="true" aria-label="Audit filters">
          <span class="workspace-muted">${escapeHtml(hasFilters ? `Filtered by ${filterLabel}` : "Showing the latest redacted audit activity.")}</span>
          ${hasFilters ? `
            <button class="workspace-button workspace-button-secondary" type="button" data-section="audit">
              Show recent activity
            </button>
          ` : ""}
        </div>
        ${events.length ? "" : renderAdminAuditEmptyState(hasFilters, filterLabel)}
        ${renderAdminAuditActionMap(events, adminAuditFilters)}
        ${renderAdminAuditSavedFilters(events, adminAuditFilters)}
        ${renderAdminAuditAnomalyView(events)}
        ${renderDashboardCard("Recent Audit", hasFilters ? "Filtered redacted activity rows" : "Redacted activity list", renderAuditSummary(events, {
          allowAuditDrillDown: true,
          emptyMessage: hasFilters
            ? "No recent changes match this filter right now."
            : "No recent audit rows are available for this view.",
        }))}
      </details>
    </section>
  `;
}

function renderAdminAuditStartFlow(events = [], activeFilters = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const anomalyById = new Map(adminAuditAnomalyRows(safeEvents).map((row) => [row.id, row]));
  const reviewCount = safeEvents.filter((event) => /review/i.test(event.entityType || "") || /review/i.test(event.action || "")).length;
  const rows = [
    {
      id: "recent",
      step: "Start here",
      title: "Start with latest changes",
      detail: "Use the newest redacted events before changing filters or widening access.",
      count: `${safeNumber(safeEvents.length)} ${pluralize(safeEvents.length, "event")}`,
      actionLabel: "Show recent",
      action: "",
      entityType: "",
    },
    {
      id: "denied-access",
      step: "Then check",
      title: "Check denied access first",
      detail: "Confirm the current school, program, or student before adding access.",
      count: `${safeNumber(anomalyById.get("denied-access")?.count)} ${pluralize(anomalyById.get("denied-access")?.count, "denial", "denials")}`,
      actionLabel: "Open denials",
      action: "evidence_download_denied",
      entityType: "evidence_artifact",
    },
    {
      id: "review-decisions",
      step: "Then check",
      title: "Confirm review decisions",
      detail: "Use review events to verify approvals, revisions, and comments without opening private files here.",
      count: `${reviewCount} ${pluralize(reviewCount, "decision")}`,
      actionLabel: "Open reviews",
      action: "",
      entityType: "review",
    },
  ];
  return `
    <section class="workspace-admin-audit-start-flow" data-admin-audit-start-flow="true" aria-labelledby="adminAuditStartTitle">
      <div class="workspace-admin-audit-start-head">
        <div>
          <p class="workspace-kicker">Audit path</p>
          <h2 id="adminAuditStartTitle">Pick one redacted check</h2>
          <p>Audit is for triage. Open one pattern, confirm the source area, then decide whether access or setup needs follow-up.</p>
        </div>
        <span class="workspace-chip">Redacted events only</span>
      </div>
      <div class="workspace-admin-audit-start-list">
        ${rows.map((row, index) => renderAdminAuditStartRow(row, activeFilters, index === 0)).join("")}
      </div>
    </section>
  `;
}

function renderAdminAuditStartRow(row = {}, activeFilters = {}, primary = false) {
  const isActive = primary
    ? !activeFilters.action && !activeFilters.entityType
    : String(activeFilters.action || "") === String(row.action || "")
      && String(activeFilters.entityType || "") === String(row.entityType || "");
  return `
    <article class="workspace-admin-audit-start-row ${primary ? "primary" : ""}" data-admin-audit-start-row="${escapeHtml(row.id || "audit-check")}" data-current-filter="${isActive ? "true" : "false"}">
      <div>
        <span>${escapeHtml(row.step || "Check")}</span>
        <strong>${escapeHtml(row.title || "Review audit rows")}</strong>
        <p>${escapeHtml(row.detail || "Open this audit check before changing access.")}</p>
      </div>
      <div class="workspace-admin-audit-start-actions">
        <span class="workspace-summary-badge">${escapeHtml(row.count || "0")}</span>
        <button class="workspace-button ${primary ? "workspace-button-primary" : "workspace-button-secondary"} workspace-button-small" type="button" data-section="audit" data-audit-action="${escapeHtml(row.action || "")}" data-audit-entity-type="${escapeHtml(row.entityType || "")}" aria-pressed="${isActive ? "true" : "false"}">
          ${escapeHtml(isActive ? "Viewing" : row.actionLabel || "Open audit")}
        </button>
      </div>
    </article>
  `;
}

function renderAdminAuditAccessReviewPanel(events = [], activeFilters = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const hasFilters = Boolean(activeFilters.action || activeFilters.entityType);
  const anomalyCount = adminAuditAnomalyRows(safeEvents).reduce((sum, row) => sum + safeNumber(row.count), 0);
  const cards = [
    ["Redaction", "Always on", "Audit events stay redacted; use them for triage, not private note or file inspection."],
    ["Current filter", hasFilters ? adminAuditFilterLabel(activeFilters) : "Recent activity", hasFilters ? "Clear filters before declaring the audit view quiet." : "Start with saved filters when investigating a specific problem."],
    ["Potential issues", anomalyCount, "Anomaly cards group repeated denied access, blocked proof, session, or storage signals."],
    ["Next move", safeEvents.length ? "Review first event" : "Refresh later", safeEvents.length ? "Open the relevant saved filter or event group before changing access." : "No redacted events are visible in this audit view."],
  ];
  return `
    <section class="workspace-admin-audit-access-review" data-admin-audit-access-review="true" aria-label="Audit access review guidance">
      ${cards.map(([label, value, detail]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
          <small>${escapeHtml(detail)}</small>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAdminAuditOperationsSummary(events = []) {
  const safeEvents = Array.isArray(events) ? events : [];
  const countWhere = (pattern) => safeEvents.filter((event) => pattern.test(`${event.action || ""} ${event.entityType || ""}`)).length;
  const cards = [
    {
      id: "access-review",
      title: "Access Review",
      value: countWhere(/denied|unauthorized|access|assignment/i),
      detail: "Denied access, assignment, and school/program change events.",
    },
    {
      id: "role-assignments",
      title: "Role Assignments",
      value: countWhere(/role|user_account|site_access_assignment/i),
      detail: "Account, role, and school access changes.",
    },
    {
      id: "recent-changes",
      title: "Recent Changes",
      value: safeEvents.length,
      detail: "Visible redacted events in this audit view.",
    },
    {
      id: "potential-issues",
      title: "Potential Issues",
      value: adminAuditAnomalyRows(safeEvents).reduce((sum, row) => sum + safeNumber(row.count), 0),
      detail: "Events that may need support, setup, or access follow-up.",
    },
  ];
  return `
    <section class="workspace-admin-audit-overview" data-admin-audit-overview="true" aria-label="Audit overview">
      ${cards.map((card) => `
        <article data-admin-audit-overview-card="${escapeHtml(card.id)}">
          <span>${escapeHtml(card.title)}</span>
          <strong>${escapeHtml(String(card.value))}</strong>
          <small>${escapeHtml(card.detail)}</small>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAdminAuditActionMap(events = [], activeFilters = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const anomalyRows = adminAuditAnomalyRows(safeEvents);
  const anomalyById = new Map(anomalyRows.map((row) => [row.id, row]));
  const eventCount = safeEvents.length;
  const filterCount = (filter) => safeEvents.filter((event) => adminAuditEventMatchesFilter(event, filter)).length;
  const reviewCount = safeEvents.filter((event) => /review/i.test(event.entityType || "") || /review/i.test(event.action || "")).length;
  const accountCount = safeEvents.filter((event) => /user|account|role|access|reset/i.test(`${event.entityType || ""} ${event.action || ""}`)).length;
  const providerCount = filterCount({ action: "student_archive_export_provider_unavailable", entityType: "export" });
  const cards = [
    {
      id: "recent",
      tone: "ready",
      owner: "Global admin",
      count: `${eventCount} ${pluralize(eventCount, "event")}`,
      title: "Start with latest changes",
      detail: "Use the unfiltered redacted log when you need the newest pattern before choosing a filter.",
      source: "Recent audit rows",
      actionLabel: "Show recent",
    },
    {
      id: "denied-access",
      tone: anomalyById.get("denied-access")?.count ? "danger" : "quiet",
      owner: "Access admin",
      count: `${safeNumber(anomalyById.get("denied-access")?.count)} ${pluralize(anomalyById.get("denied-access")?.count, "denial", "denials")}`,
      title: "Check denied access first",
      detail: "Confirm the current school, program, or student before widening access.",
      source: "Access denials",
      action: "evidence_download_denied",
      entityType: "evidence_artifact",
      actionLabel: "Open denials",
    },
    {
      id: "storage",
      tone: anomalyById.get("failed-uploads")?.count ? "warning" : "quiet",
      owner: "Storage admin",
      count: `${safeNumber(anomalyById.get("failed-uploads")?.count)} ${pluralize(anomalyById.get("failed-uploads")?.count, "failure")}`,
      title: "Separate storage setup from student error",
      detail: "Review provider failures before asking students to retry the same upload.",
      source: "Upload failures",
      action: "google_drive_upload_failed",
      entityType: "evidence_repository",
      actionLabel: "Open uploads",
    },
    {
      id: "blocked-evidence",
      tone: anomalyById.get("blocked-evidence-attempts")?.count ? "warning" : "quiet",
      owner: "Program Teacher or security admin",
      count: `${safeNumber(anomalyById.get("blocked-evidence-attempts")?.count)} ${pluralize(anomalyById.get("blocked-evidence-attempts")?.count, "item")}`,
      title: "Review file upload issues safely",
      detail: "Decide whether the student needs file/link help or the pattern needs security follow-up.",
      source: "File and link checks",
      action: "evidence_upload_blocked_signature",
      entityType: "submission",
      actionLabel: "Open blocks",
    },
    {
      id: "review-decisions",
      tone: reviewCount ? "review" : "quiet",
      owner: "Program Teacher lead",
      count: `${reviewCount} ${pluralize(reviewCount, "decision")}`,
      title: "Confirm review decisions",
      detail: "Use review events to verify approvals, revisions, and comments without opening private files here.",
      source: "Review events",
      action: "",
      entityType: "review",
      actionLabel: "Open reviews",
    },
    {
      id: "account-changes",
      tone: accountCount ? "role" : "quiet",
      owner: "Access admin",
      count: `${accountCount} ${pluralize(accountCount, "change")}`,
      title: "Audit account changes",
      detail: "Compare account work with current Users & Access rows before adding broader access.",
      source: "Account and role rows",
      action: "",
      entityType: "user_account",
      actionLabel: "Open accounts",
    },
    {
      id: "export-failures",
      tone: anomalyById.get("export-failures")?.count ? "danger" : "quiet",
      owner: "Site Admin",
      count: `${safeNumber(anomalyById.get("export-failures")?.count)} ${pluralize(anomalyById.get("export-failures")?.count, "failure")}`,
      title: "Check final-file handoff risk",
      detail: "Confirm package status before telling students a final-file download is ready.",
      source: "Export failures",
      action: "student_archive_export_drive_upload_failed",
      entityType: "export",
      actionLabel: "Open exports",
    },
    {
      id: "provider-setup",
      tone: providerCount ? "warning" : "quiet",
      owner: "Platform setup",
      count: `${providerCount} ${pluralize(providerCount, "setup row")}`,
      title: "Find provider setup issues",
      detail: "Use this when final-file or student file work is waiting because storage is unavailable.",
      source: "Provider setup rows",
      action: "student_archive_export_provider_unavailable",
      entityType: "export",
      actionLabel: "Open setup",
    },
    {
      id: "session-pressure",
      tone: anomalyById.get("login-rate")?.count ? "history" : "quiet",
      owner: "Account support",
      count: `${safeNumber(anomalyById.get("login-rate")?.count)} ${pluralize(anomalyById.get("login-rate")?.count, "item")}`,
      title: "Watch sign-in pressure",
      detail: "Treat repeated failures as support or abuse triage before resetting access.",
      source: "Login and rate-limit rows",
      action: "",
      entityType: "",
      actionLabel: "Summary only",
    },
  ];

  return `
    <section class="workspace-admin-audit-action-map" data-admin-audit-action-map="true" aria-label="Audit quick filters">
      <div class="workspace-admin-audit-action-map-head">
        <div>
          <p class="workspace-kicker">Audit quick filters</p>
          <h2>Choose one audit filter</h2>
          <p>Pick the pattern, open the matching redacted filter, then fix the issue in the source area.</p>
        </div>
        <span class="workspace-chip">${escapeHtml(adminAuditFilterLabel(activeFilters))}</span>
      </div>
      <div class="workspace-admin-audit-action-map-grid">
        ${cards.map((card) => renderAdminAuditActionMapCard(card, activeFilters)).join("")}
      </div>
    </section>
  `;
}

function renderAdminAuditActionMapCard(card = {}, activeFilters = {}) {
  const isRecentCard = card.id === "recent";
  const hasCardFilter = Boolean(card.action || card.entityType);
  const isActive = isRecentCard
    ? !activeFilters.action && !activeFilters.entityType
    : hasCardFilter
      && String(activeFilters.action || "") === String(card.action || "")
      && String(activeFilters.entityType || "") === String(card.entityType || "");
  return `
    <article class="workspace-admin-audit-action-map-card ${escapeHtml(card.tone || "quiet")}" data-admin-audit-action-map-card="${escapeHtml(card.id || "audit-lane")}" data-admin-audit-action-owner="${escapeHtml(card.owner || "Global admin")}" data-current-filter="${isActive ? "true" : "false"}">
      <div>
        <div class="workspace-admin-audit-action-map-meta">
          <span>${escapeHtml(card.owner || "Global admin")}</span>
          <b>${escapeHtml(card.count || "0")}</b>
        </div>
        <strong>${escapeHtml(card.title || "Review activity")}</strong>
        <p>${escapeHtml(card.detail || "Use the matching redacted filter before investigating the source area.")}</p>
        ${card.source ? `<small>${escapeHtml(card.source)}</small>` : ""}
      </div>
      ${renderAdminAuditActionMapButton(card, isActive)}
    </article>
  `;
}

function renderAdminAuditActionMapButton(card = {}, isActive = false) {
  if (card.id === "session-pressure") {
    return `<span class="workspace-summary-badge">Summary only</span>`;
  }
  return `
    <button class="workspace-link-button workspace-link-button-small" type="button" data-section="audit" data-audit-action="${escapeHtml(card.action || "")}" data-audit-entity-type="${escapeHtml(card.entityType || "")}" aria-pressed="${isActive ? "true" : "false"}">
      ${escapeHtml(isActive ? "Viewing" : card.actionLabel || "Open audit")}
    </button>
  `;
}

function renderAdminAuditSavedFilters(events = [], activeFilters = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  return `
    <section class="workspace-admin-audit-saved-filters" data-admin-audit-saved-filters="true" aria-label="Saved audit filters">
      <div>
        <strong>Saved audit filters</strong>
        <p>Open the exact redacted activity view before investigating. These links reuse the current audit endpoint.</p>
      </div>
      <div class="workspace-admin-audit-filter-grid">
        ${ADMIN_AUDIT_SAVED_FILTERS.map((filter) => {
          const active = adminAuditSavedFilterIsActive(filter, activeFilters);
          const count = safeEvents.filter((event) => adminAuditEventMatchesFilter(event, filter)).length;
          return `
            <button class="workspace-button ${active ? "workspace-button-primary" : "workspace-button-secondary"}" type="button" data-section="audit" data-admin-audit-saved-filter="${escapeHtml(filter.id)}" data-audit-action="${escapeHtml(filter.action || "")}" data-audit-entity-type="${escapeHtml(filter.entityType || "")}" aria-pressed="${active ? "true" : "false"}">
              <span>${escapeHtml(filter.label)}</span>
              <small>${escapeHtml(count ? `${count} in this view` : filter.detail)}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function adminAuditSavedFilterIsActive(filter = {}, activeFilters = {}) {
  return String(activeFilters.action || "") === String(filter.action || "")
    && String(activeFilters.entityType || "") === String(filter.entityType || "");
}

function adminAuditEventMatchesFilter(event = {}, filter = {}) {
  if (filter.action && event.action !== filter.action) return false;
  if (filter.entityType && event.entityType !== filter.entityType) return false;
  return true;
}

function renderAdminAuditAnomalyView(events = []) {
  const rows = adminAuditAnomalyRows(events);
  return `
    <section class="workspace-admin-audit-anomalies" data-admin-audit-anomaly-view="true" aria-label="Audit anomaly review">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Potential issues</p>
          <h2>Events to check</h2>
          <p class="workspace-muted">This view summarizes the visible redacted audit events. It does not expose private notes, file links, tokens, or Drive identifiers.</p>
        </div>
        <span class="workspace-chip">${safeNumber(rows.reduce((sum, row) => sum + row.count, 0))} signal${rows.reduce((sum, row) => sum + row.count, 0) === 1 ? "" : "s"}</span>
      </div>
      <div class="workspace-admin-audit-anomaly-grid">
        ${rows.map((row) => `
          <article data-admin-audit-anomaly="${escapeHtml(row.id)}" data-admin-audit-anomaly-state="${escapeHtml(row.count ? "needs-review" : "quiet")}">
            <div>
              <span>${escapeHtml(row.label)}</span>
              <strong>${escapeHtml(row.count)}</strong>
            </div>
            <p>${escapeHtml(row.count ? row.reviewCopy : row.quietCopy)}</p>
            <div class="workspace-owner-action" data-admin-audit-anomaly-owner="true">
              <span>Who can help: ${escapeHtml(row.owner)}</span>
              <small>Next step: ${escapeHtml(row.nextAction)}</small>
            </div>
            ${row.action || row.entityType ? `
              <button class="workspace-link-button workspace-link-button-small" type="button" data-section="audit" data-audit-action="${escapeHtml(row.action || "")}" data-audit-entity-type="${escapeHtml(row.entityType || "")}">
                Open matching audit
              </button>
            ` : `<span class="workspace-summary-badge">Current rows only</span>`}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function adminAuditAnomalyRows(events = []) {
  const safeEvents = Array.isArray(events) ? events : [];
  const countWhere = (predicate) => safeEvents.filter(predicate).length;
  return [
    {
      id: "denied-access",
      label: "Denied access",
      count: countWhere((event) => /denied|unauthorized/i.test(event.action || "")),
      reviewCopy: "Check whether a role, site, or student assignment is wrong before expanding access.",
      quietCopy: "No denied-access events are visible in this audit view.",
      owner: "Access admin",
      nextAction: "Confirm the current school, program, or student assignment before changing access.",
      action: "evidence_download_denied",
      entityType: "evidence_artifact",
    },
    {
      id: "failed-uploads",
      label: "Failed uploads",
      count: countWhere((event) => /upload.*failed|missing_config|missing_credentials/i.test(event.action || "")),
      reviewCopy: "Use storage setup and student fallback language before asking students to upload again.",
      quietCopy: "No upload-failure rows are visible in this audit view.",
      owner: "Storage admin",
      nextAction: "Check storage readiness, then tell students to use the secure link fallback if needed.",
      action: "google_drive_upload_failed",
      entityType: "evidence_repository",
    },
    {
      id: "blocked-evidence-attempts",
      label: "Blocked evidence attempts",
      count: countWhere((event) => /evidence_(upload_blocked_signature|link_blocked_unsafe_url)/i.test(event.action || "")),
      reviewCopy: "Check whether students need help attaching evidence safely or whether the pattern looks malicious.",
      quietCopy: "No blocked file or link attempts are visible in this audit view.",
      owner: "Program Teacher or security admin",
      nextAction: "Help the student attach evidence safely, or escalate repeated unsafe patterns.",
      action: "",
      entityType: "",
    },
    {
      id: "login-rate",
      label: "Repeated login failures",
      count: countWhere((event) => /rate_limited|invalid_credentials|login_failed/i.test(event.action || "")),
      reviewCopy: "Confirm whether this looks like a user support issue or an abuse pattern.",
      quietCopy: "Login failure details stay in the auth attempt table unless a route writes an audit row.",
      owner: "Account support",
      nextAction: "Confirm the user is using the approved sign-in path before resetting access.",
      action: "",
      entityType: "",
    },
    {
      id: "import-attempts",
      label: "Import attempts",
      count: countWhere((event) => /user\.create|scope_validation|import/i.test(event.action || "")),
      reviewCopy: "Review role, school, and program access, plus whether real local accounts were blocked by policy.",
      quietCopy: "No account-import attempts are visible in this audit view.",
      owner: "Access admin",
      nextAction: "Check role access and setup-password delivery before retrying account creation.",
      action: "",
      entityType: "user_account",
    },
    {
      id: "role-changes",
      label: "Role changes",
      count: countWhere((event) => /access\.|role|assignment/i.test(event.action || "")),
      reviewCopy: "Confirm this access change was intentional and limited to the smallest useful role.",
      quietCopy: "No role or access change rows are visible in this audit view.",
      owner: "Access admin",
      nextAction: "Compare the change with current assignments before adding broader access.",
      action: "",
      entityType: "site_access_assignment",
    },
    {
      id: "export-failures",
      label: "Export failures",
      count: countWhere((event) => /archive_export.*failed|provider_unavailable|drive_upload_failed/i.test(event.action || "")),
      reviewCopy: "Check final-file package status before telling students a download is ready.",
      quietCopy: "No final-file export failures are visible in this audit view.",
      owner: "Site Admin",
      nextAction: "Open final-file or Operations rows and confirm package status before student handoff.",
      action: "student_archive_export_drive_upload_failed",
      entityType: "export",
    },
  ];
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
  const exportRows = [
    { label: "Queued", value: safeNumber(summary.exportsQueued), tone: "warning" },
    { label: "Running", value: safeNumber(summary.exportsRunning), tone: "admin" },
    { label: "Complete", value: safeNumber(summary.exportsComplete), tone: "mentor" },
    { label: "Failed", value: safeNumber(summary.exportsFailed), tone: "danger" },
  ];
  const recentExports = Array.isArray(dashboard.recentExports) ? dashboard.recentExports : [];
  const activeFilter = cleanAdminArchiveExportFilter(adminArchiveExportFilter);
  const filteredExports = filterAdminArchiveExportRows(recentExports, activeFilter);
  const totalExports = exportRows.reduce((sum, row) => sum + safeNumber(row.value), 0);
  const archiveScore = totalExports ? clampPercent((safeNumber(summary.exportsComplete) / totalExports) * 100) : null;
  return `
    <section class="workspace-command-center workspace-admin-archive-dashboard">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Final files</p>
          <h1>Final Files</h1>
          <p>Package readiness, export failures, storage setup, and closeout delivery from persisted package requests.</p>
        </div>
        <span class="workspace-chip">${safeNumber(summary.exportsFailed)} failed</span>
      </div>
      ${renderDashboardKpis([
        { label: "Final files ready", value: metricWithPercent(summary.exportsComplete, totalExports), detail: "Complete package requests", tone: "mentor" },
        { label: "In progress", value: safeNumber(summary.exportsQueued) + safeNumber(summary.exportsRunning), detail: "Queued or running packages", tone: "warning" },
        { label: "Failed", value: safeNumber(summary.exportsFailed), detail: "Needs export follow-up", tone: safeNumber(summary.exportsFailed) ? "danger" : "mentor" },
        { label: "Total packages", value: totalExports, detail: "Persisted package requests", tone: "admin" },
      ], { label: "Final-file export summary", className: "workspace-archive-kpis" })}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderReadinessScoreCard(archiveScore, totalExports, "Final-file completion score", totalExports ? `${safeNumber(summary.exportsComplete)} of ${totalExports} package requests are complete.` : "No package requests to summarize yet.")}
        ${renderDashboardCard("Final-file distribution", "Ready, in progress, and failed packages", renderStackedDistribution(exportRows, "Final-file export distribution"))}
      </div>
      ${renderAdminArchiveStorageReadinessPanel(dashboard)}
      ${renderAdminArchiveFailureGuide(recentExports, summary)}
      ${renderAdminArchiveFinishChecklist(dashboard, recentExports)}
      ${renderAdminArchiveExportFilters(recentExports, activeFilter)}
      ${renderDashboardCard("Current package requests", "Real final-file export rows for follow-up", renderAdminArchiveExportRows(filteredExports, activeFilter, recentExports.length))}
      ${renderDashboardCard("Export Snapshot", "Package status", renderSnapshotRows(dashboard.archiveSnapshot))}
    </section>
  `;
}

function adminArchiveExportFilterLabel(value) {
  if (value === "failed") return "Failed";
  if (value === "in_progress") return "In progress";
  if (value === "complete") return "Complete";
  return "All requests";
}

function adminArchiveExportRowFilterKey(row = {}) {
  const status = normalizeStatus(row.status);
  if (status === "queued" || status === "running") return "in_progress";
  return cleanAdminArchiveExportFilter(status);
}

function filterAdminArchiveExportRows(rows = [], activeFilter = "all") {
  const filter = cleanAdminArchiveExportFilter(activeFilter);
  const safeRows = Array.isArray(rows) ? rows : [];
  if (filter === "all") return safeRows;
  return safeRows.filter((row) => adminArchiveExportRowFilterKey(row) === filter);
}

function renderAdminArchiveExportFilters(rows = [], activeFilter = "all") {
  const safeRows = Array.isArray(rows) ? rows : [];
  const counts = {
    all: safeRows.length,
    failed: safeRows.filter((row) => adminArchiveExportRowFilterKey(row) === "failed").length,
    in_progress: safeRows.filter((row) => adminArchiveExportRowFilterKey(row) === "in_progress").length,
    complete: safeRows.filter((row) => adminArchiveExportRowFilterKey(row) === "complete").length,
  };
  return `
    <div class="workspace-filter-bar" data-admin-archive-export-filters="true" aria-label="Final-file export filters">
      ${[
        ["all", "all-exports"],
        ["failed", "failed-exports"],
        ["in_progress", "in-progress-exports"],
        ["complete", "complete-exports"],
      ].map(([filter, preset]) => `
        <button class="workspace-button ${activeFilter === filter ? "workspace-button-primary" : "workspace-button-secondary"}" type="button" data-section="archiveExports" data-section-preset="${preset}" data-admin-archive-export-filter="${filter}" aria-pressed="${activeFilter === filter ? "true" : "false"}">
          ${escapeHtml(adminArchiveExportFilterLabel(filter))} (${safeNumber(counts[filter])})
        </button>
      `).join("")}
    </div>
  `;
}

function renderAdminArchiveExportRows(rows = [], activeFilter = "all", totalRows = 0) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    const heading = cleanAdminArchiveExportFilter(activeFilter) === "all"
      ? "No final-file package requests are available right now."
      : `No ${adminArchiveExportFilterLabel(activeFilter).toLowerCase()} final-file package requests are available right now.`;
    const nextAction = cleanAdminArchiveExportFilter(activeFilter) === "failed"
      ? "Review the full final-file summary or switch filters to check in-progress and completed requests."
      : "Switch filters to review another export status or return later after final-file package requests are created.";
    return `
      <section class="workspace-empty-state-card" data-admin-archive-export-empty="${escapeHtml(cleanAdminArchiveExportFilter(activeFilter))}">
        <strong>${escapeHtml(heading)}</strong>
        <p>${escapeHtml(totalRows ? nextAction : "Final-file package requests will appear here after staff start or finish final-file delivery work.")}</p>
      </section>
    `;
  }
  return `
    <div class="workspace-list" data-admin-archive-export-list="${escapeHtml(cleanAdminArchiveExportFilter(activeFilter))}">
      ${safeRows.map((row) => {
        const status = normalizeStatus(row.status) || "pending";
        const requestedBy = row.requestedBy ? `Requested by ${row.requestedBy}` : "Requested by staff";
        const timing = row.completedAt
          ? `Completed ${formatDate(row.completedAt)}`
          : `Requested ${formatDate(row.createdAt)}`;
        const nextAction = status === "failed"
          ? "Review provider setup and student detail before rerunning this package from an approved admin flow."
          : status === "complete"
            ? "Package request is complete."
            : "Package request is still in progress.";
        return `
          <article class="workspace-worklist-row" data-admin-archive-export-row="${escapeHtml(row.exportId || "export")}" data-admin-archive-export-status="${escapeHtml(adminArchiveExportRowFilterKey(row))}">
            <div>
              <span class="workspace-worklist-label">Student</span>
              <strong>${escapeHtml(row.studentName || "Student archive")}</strong>
              <small>${escapeHtml(requestedBy)}</small>
            </div>
            <div>
              <span class="workspace-worklist-label">Package</span>
              <span>${escapeHtml(row.exportType === "student_archive" ? "Student archive" : statusText(row.exportType || "archive"))}</span>
            </div>
            <div>
              <span class="workspace-worklist-label">Timing</span>
              <span>${escapeHtml(timing)}</span>
            </div>
            <div>
              <span class="workspace-worklist-label">Next step</span>
              <span data-admin-archive-export-next-action="true">${escapeHtml(nextAction)}</span>
            </div>
            <div>
              <span class="workspace-worklist-label">Status</span>
              ${statusPill(status)}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderAdminArchiveStorageReadinessPanel(dashboard = {}) {
  const summary = dashboard.summary || {};
  const totalExports = safeNumber(summary.exportsQueued) + safeNumber(summary.exportsRunning) + safeNumber(summary.exportsComplete) + safeNumber(summary.exportsFailed);
  const failed = safeNumber(summary.exportsFailed);
  const inProgress = safeNumber(summary.exportsQueued) + safeNumber(summary.exportsRunning);
  const snapshot = Array.isArray(dashboard.archiveSnapshot) ? dashboard.archiveSnapshot : [];
  const providerUnavailable = snapshot.some((row) => normalizeStatus(row.status) === "provider_unavailable");
  const rows = [
    ["Package queue", inProgress ? `${inProgress} package request${inProgress === 1 ? "" : "s"} still running or queued.` : "No package request is currently queued or running.", inProgress ? "in_progress" : "ready"],
    ["Failed packages", failed ? `${failed} failed package request${failed === 1 ? "" : "s"} need staff review.` : "No failed package requests are reported in this summary.", failed ? "failed" : "ready"],
    ["Storage provider", providerUnavailable ? "At least one snapshot row reports storage setup unavailable." : "No provider-unavailable snapshot row is visible here.", providerUnavailable ? "provider_unavailable" : "configured"],
    ["Secrets and IDs", "Drive file IDs, root folder IDs, and signed URL internals stay out of this UI.", "configured"],
    ["Retention", "Students see download windows; admins review expired or expiring packages before handoff.", "policy_review_required"],
  ];
  return `
    <section class="workspace-admin-storage-readiness" data-admin-storage-readiness="true" data-admin-storage-export-total="${escapeHtml(totalExports)}">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Storage readiness</p>
          <h2>Final-file storage check</h2>
          <p class="workspace-muted">Use this before telling students a package is ready. It summarizes queue, failure, provider, privacy, and retention state without exposing private file details.</p>
        </div>
        ${statusPill(failed || providerUnavailable ? "needs_staff_action" : "configured")}
      </div>
      <div class="workspace-admin-storage-grid">
        ${rows.map(([label, detail, status]) => `
          <article data-admin-storage-check="${escapeHtml(normalizeStatus(label))}" data-admin-storage-check-status="${escapeHtml(status)}">
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAdminArchiveFailureGuide(rows = [], summary = {}) {
  const failedRows = (Array.isArray(rows) ? rows : []).filter((row) => adminArchiveExportRowFilterKey(row) === "failed");
  const failedCount = Math.max(safeNumber(summary.exportsFailed), failedRows.length);
  if (!failedCount) {
    return `
      <section class="workspace-admin-archive-failure-guide" data-admin-archive-failure-guide="quiet">
        <strong>No failed final-file packages in this summary</strong>
        <p>Keep watching queued and running requests. Failed packages will appear here with staff follow-up guidance.</p>
      </section>
    `;
  }
  return `
    <section class="workspace-admin-archive-failure-guide" data-admin-archive-failure-guide="failed">
      <div>
        <strong>Failed package follow-up</strong>
        <p>${escapeHtml(`${failedCount} final-file package request${failedCount === 1 ? "" : "s"} need review before handoff.`)}</p>
      </div>
      <ol>
        <li>Open the failed filter and identify the affected student package.</li>
        <li>Check provider setup and student detail before starting a new package request.</li>
        <li>Do not tell the student to download until a complete package row or protected download is visible.</li>
      </ol>
      <p class="workspace-muted">No inactive retry control is shown here. Use the approved archive export flow when a real rerun is allowed.</p>
    </section>
  `;
}

function renderAdminArchiveFinishChecklist(dashboard = {}, rows = []) {
  const summary = dashboard.summary || {};
  const safeRows = Array.isArray(rows) ? rows : [];
  const failedCount = Math.max(safeNumber(summary.exportsFailed), safeRows.filter((row) => adminArchiveExportRowFilterKey(row) === "failed").length);
  const inProgressCount = safeNumber(summary.exportsQueued) + safeNumber(summary.exportsRunning);
  const completeCount = safeNumber(summary.exportsComplete);
  return renderTaskFinishChecklist("admin-final-file-handoff", "Before final-file handoff", [
    ["Failed packages reviewed", failedCount ? `${failedCount} failed package ${pluralize(failedCount, "request")} still need staff follow-up.` : "No failed package requests are visible in this summary.", failedCount ? "blocked" : "ready"],
    ["In-progress packages not promised", inProgressCount ? `${inProgressCount} package ${pluralize(inProgressCount, "request")} still queued or running.` : "No queued or running package requests are visible.", inProgressCount ? "context" : "ready"],
    ["Complete row visible", completeCount ? `${completeCount} complete package ${pluralize(completeCount, "request")} can support handoff.` : "Do not promise readiness until a complete package row is visible.", completeCount ? "ready" : "needs_review"],
    ["Private file details stay hidden", "Use package status and protected download surfaces; do not expose Drive IDs, tokens, or private proof details.", "ready"],
  ], {
    detail: "Use these checks before telling a student or school staff member that final files are ready.",
    badge: "Handoff checks",
    state: failedCount ? "failed" : inProgressCount ? "pending" : "ready",
  });
}
