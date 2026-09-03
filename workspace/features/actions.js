function bindWorkspaceForms() {
  document.querySelector("#createProjectForm")?.addEventListener("submit", submitCreateProject);
  document.querySelectorAll("[data-manage-project-form]").forEach((form) => {
    form.addEventListener("submit", submitManageProject);
  });
  document.querySelectorAll("[data-project-request-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectRequestDecision);
  });
  document.querySelectorAll("[data-student-project-request-form]").forEach((form) => {
    form.addEventListener("submit", submitStudentProjectRequest);
  });
  document.querySelectorAll("[data-project-invitation-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectInvitationResponse);
  });
  document.querySelectorAll("[data-project-adult-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectAdultChoice);
  });
  document.querySelectorAll("[data-project-adult-response-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectAdultResponse);
  });
  document.querySelectorAll("[data-project-adult-cancel-form]").forEach((form) => {
    form.addEventListener("submit", cancelProjectAdultInvite);
  });
  document.querySelectorAll("[data-project-adult-link-form]").forEach((form) => {
    form.addEventListener("submit", linkProjectAdultAccount);
  });
  document.querySelector("[data-project-adult-notices-read]")?.addEventListener("click", markProjectAdultNoticesRead);
  document.querySelectorAll("[data-project-approval-undo-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectApprovalUndo);
  });
  document.querySelectorAll("[data-project-folder-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectFolderLink);
  });
  document.querySelectorAll("[data-project-note-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectNote);
  });
  document.querySelectorAll("[data-project-template-form]").forEach((form) => {
    form.addEventListener("submit", submitProjectTemplate);
  });
  document.querySelectorAll("[data-project-template-remove-form]").forEach((form) => {
    form.addEventListener("submit", removeProjectTemplate);
  });
  document.querySelectorAll("[data-project-action]").forEach((button) => {
    button.addEventListener("click", handleProjectAction);
  });
  document.querySelector("[data-project-directory-filter-form]")?.addEventListener("submit", submitProjectDirectoryFilters);
  document.querySelectorAll("[data-project-team-picker]").forEach((picker) => {
    bindProjectTeamPicker(picker);
  });
  document.querySelector("#workspaceChangePasswordForm")?.addEventListener("submit", changeOwnPassword);
  document.querySelector("#workspaceStudentSearchForm")?.addEventListener("submit", submitWorkspaceStudentSearch);
  const adminImportForm = document.querySelector("#workspaceAdminImportForm");
  adminImportForm?.addEventListener("submit", submitAdminUserImport);
  adminImportForm?.querySelector?.('[name="roleId"]')?.addEventListener("change", updateAdminImportScopeFields);
  adminImportForm?.querySelector?.('[name="identityType"]')?.addEventListener("change", updateAdminImportScopeFields);
  adminImportForm?.querySelectorAll?.("[data-admin-role-pick]")?.forEach((button) => {
    button.addEventListener("click", handleAdminRolePick);
  });
  adminImportForm?.querySelectorAll?.('[name="siteIds"], [name="programIds"], [name="studentIds"]')?.forEach((field) => {
    field.addEventListener("change", () => renderAdminAccessPreview(adminImportForm));
  });
  updateAdminImportScopeFields(adminImportForm);
  document.querySelectorAll("[data-admin-add-person-form]").forEach((form) => {
    form.addEventListener("submit", submitAdminPersonForm);
    form.querySelector?.('[name="roleId"]')?.addEventListener("change", () => updateAdminImportScopeFields(form));
    form.querySelectorAll?.("[data-admin-role-pick]")?.forEach((button) => {
      button.addEventListener("click", handleAdminRolePick);
    });
    form.querySelectorAll?.('[name="siteIds"], [name="programIds"], [name="studentIds"]')?.forEach((field) => {
      field.addEventListener("change", () => renderAdminAccessPreview(form));
    });
    updateAdminImportScopeFields(form);
  });
  document.querySelectorAll("[data-csv-import-form]").forEach((form) => {
    form.addEventListener("submit", submitAdminCsvPreview);
  });
  document.querySelectorAll("[data-admin-csv-confirm]").forEach((button) => {
    button.addEventListener("click", () => confirmAdminCsvImport(button));
  });
  document.querySelectorAll("[data-csv-file-input]").forEach((input) => {
    input.addEventListener("change", handleAdminCsvFileSelected);
  });
  document.querySelectorAll("[data-site-access-assignment-form]").forEach((form) => {
    form.addEventListener("submit", submitSiteAccessAssignment);
  });
  document.querySelectorAll("[data-admin-account-remove-form]").forEach((form) => {
    form.addEventListener("submit", submitAdminAccountRemoval);
  });
  document.querySelectorAll("[data-admin-password-reset-form]").forEach((form) => {
    form.addEventListener("submit", submitAdminPasswordReset);
  });
  document.querySelectorAll("[data-site-program-form]").forEach((form) => {
    form.addEventListener("submit", submitSiteProgramChange);
  });
  document.querySelectorAll("[data-copy-secret]").forEach((button) => {
    button.addEventListener("click", copySecretFromButton);
  });
  document.querySelectorAll("[data-review-queue-share-link]").forEach((button) => {
    button.addEventListener("click", copyReviewQueueLink);
  });
  document.querySelector("#workspaceEvidenceLinkForm")?.addEventListener("submit", attachEvidenceLink);
  const uploadForm = document.querySelector("#workspaceFileUploadForm");
  uploadForm?.addEventListener("submit", uploadEvidenceFile);
  uploadForm?.querySelector?.('[data-upload-action="select-file"]')?.addEventListener("change", handleUploadFileSelected);
  bindStudentProofGuideSelects();
  bindUploadRetryButton();
  document.querySelectorAll("[data-student-storage-focus]").forEach((button) => {
    button.addEventListener("click", handleStudentStorageFocusAction);
  });
  document.querySelectorAll("[data-student-proof-receipt-action]").forEach((button) => {
    button.addEventListener("click", handleStudentProofReceiptAction);
  });
  document.querySelectorAll("[data-presentation-action]").forEach((button) => {
    button.addEventListener("click", updatePresentationSlot);
  });
  document.querySelectorAll("[data-presentation-filter-action]").forEach((button) => {
    button.addEventListener("click", handlePresentationFilterAction);
  });
  document.querySelectorAll("[data-student-feedback-action]").forEach((button) => {
    button.addEventListener("click", handleStudentFeedbackAction);
  });
  document.querySelectorAll("[data-student-final-check-action]").forEach((button) => {
    button.addEventListener("click", handleStudentFinalChecklistAction);
  });
  document.querySelectorAll("[data-student-requirement-action]").forEach((button) => {
    button.addEventListener("click", handleStudentRequirementAction);
  });
  document.querySelectorAll("[data-student-guided-draft-form]").forEach((form) => {
    form.addEventListener("submit", submitStudentGuidedDraft);
    form.querySelector("textarea[name='responseText']")?.addEventListener("input", updateStudentDraftWordCount);
  });
  document.querySelectorAll("[data-student-draft-action='add-starter']").forEach((button) => {
    button.addEventListener("click", addStudentDraftStarter);
  });
  document.querySelectorAll("[data-student-submission-action]").forEach((button) => {
    button.addEventListener("click", handleStudentSubmissionAction);
  });
  document.querySelectorAll("[data-student-support-action]").forEach((button) => {
    button.addEventListener("click", handleStudentSupportAction);
  });
  document.querySelector("#siteStudentFilterForm")?.addEventListener("submit", applySiteStudentFilters);
  document.querySelectorAll("[data-site-student-remove-form]").forEach((form) => {
    form.addEventListener("submit", submitSiteStudentRemoval);
  });
  document.querySelectorAll("[data-site-student-action]").forEach((button) => {
    button.addEventListener("click", handleSiteStudentAction);
  });
  document.querySelectorAll("[data-view-as-student-action]").forEach((button) => {
    button.addEventListener("click", handleViewAsStudentAction);
  });
  document.querySelectorAll("[data-student-detail-tab]").forEach((button) => {
    button.addEventListener("click", selectSiteStudentDetailTab);
  });
  document.querySelectorAll("[data-student-detail-timeline-type]").forEach((button) => {
    button.addEventListener("click", selectSiteStudentTimelineType);
  });
  document.querySelectorAll("[data-student-detail-action]").forEach((button) => {
    button.addEventListener("click", handleSiteStudentDetailAction);
  });
  document.querySelectorAll("[data-student-requirement-phase-action]").forEach((button) => {
    button.addEventListener("click", handleStudentRequirementPhaseAction);
  });
  document.querySelector("#mentorMeetingForm")?.addEventListener("submit", submitMentorMeeting);
  document.querySelector("#reviewQueueFilterForm")?.addEventListener("submit", applyReviewQueueFilters);
  document.querySelectorAll("[data-review-queue-action]").forEach((button) => {
    button.addEventListener("click", handleReviewQueueAction);
  });
  document.querySelector("#reviewDecisionForm")?.addEventListener("submit", submitReviewDecision);
  document.querySelector("#mentorAssignmentFilterForm")?.addEventListener("submit", applyMentorAssignmentFilters);
  document.querySelectorAll("[data-mentor-assignment-action]").forEach((button) => {
    button.addEventListener("click", handleMentorAssignmentAction);
  });
  document.querySelectorAll("[data-mentor-dashboard-action]").forEach((button) => {
    button.addEventListener("click", handleMentorDashboardAction);
  });
  document.querySelector("#mentorAssignmentForm")?.addEventListener("submit", submitMentorAssignment);
  document.querySelector("#operationsReadinessFilterForm")?.addEventListener("submit", applyOperationsReadinessFilters);
  document.querySelectorAll("[data-operations-action]").forEach((button) => {
    button.addEventListener("click", handleOperationsReadinessAction);
  });
}

function bindUploadRetryButton() {
  document.querySelector('[data-upload-action="retry"]')?.addEventListener("click", retryEvidenceUpload);
}
function bindStudentProofGuideSelects() {
  document.querySelectorAll("[data-student-proof-submission-select]").forEach((select) => {
    select.addEventListener("change", () => updateStudentProofGuideForSelect(select));
    updateStudentProofGuideForSelect(select);
  });
}

function updateStudentProofGuideForSelect(select) {
  const selectedSubmissionId = cleanDirectoryFilter(select?.value || "");
  const form = select?.closest?.("form");
  const guideList = form?.querySelector?.("[data-student-proof-guide-list]");
  if (!guideList) return;
  guideList.dataset.selectedSubmissionId = selectedSubmissionId;
  guideList.querySelectorAll("[data-student-proof-guide]").forEach((guide) => {
    const isSelected = cleanDirectoryFilter(guide?.dataset?.studentProofGuide || "") === selectedSubmissionId;
    guide.hidden = !isSelected;
    guide.setAttribute("data-student-proof-guide-selected", isSelected ? "true" : "false");
  });
}

function handleStudentStorageFocusAction(event) {
  const target = cleanDirectoryFilter(event?.currentTarget?.dataset?.studentStorageFocus || "");
  const selectors = {
    "link-form": "#workspaceEvidenceLinkForm",
    "file-form": "#workspaceFileUploadForm",
    "upload-status": "#workspaceUploadStatus",
    "proof-guide": '[data-student-proof-guide="true"]',
    support: '[data-student-support-box="true"]',
  };
  const selector = selectors[target];
  if (!selector) return;
  const element = document.querySelector(selector);
  if (!element) return;
  if (!element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
  }
  element.scrollIntoView?.({ block: "start", behavior: "smooth" });
  try {
    element.focus?.({ preventScroll: true });
  } catch {
    element.focus?.();
  }
}

function handleStudentProofReceiptAction(event) {
  const action = cleanDirectoryFilter(event?.currentTarget?.dataset?.studentProofReceiptAction || "");
  const receipt = studentProofReceiptState || defaultStudentProofReceiptState();
  const submissionId = cleanDirectoryFilter(receipt.submissionId || "");
  const requirementId = cleanDirectoryFilter(receipt.requirementId || studentSubmissionForReceipt(submissionId)?.requirement_id || studentSubmissionForReceipt(submissionId)?.requirementId || "");
  activeSection = "studentWork";
  if (action === "open-checklist" && requirementId) {
    studentDisclosureState = {
      ...studentDisclosureState,
      requirements: true,
    };
    requestStudentRequirementFocus(requirementId);
    renderAppShell("Opening the checklist item for this proof.", "success");
    return;
  }
  if (action === "correct-proof") {
    studentDisclosureState = {
      ...studentDisclosureState,
      evidence: true,
    };
    pendingStudentEvidenceSubmissionId = submissionId;
    requestStudentSectionFocus("evidence");
    renderAppShell("Proof tools opened. Add the corrected proof to the right item.", "success");
    return;
  }
  if (action === "open-submissions") {
    studentDisclosureState = {
      ...studentDisclosureState,
      submissions: true,
    };
    requestStudentSectionFocus("submissions");
    renderAppShell("Opening Turned in so you can turn in or check this item.", "success");
    return;
  }
  studentDisclosureState = {
    ...studentDisclosureState,
    files: true,
  };
  requestStudentSectionFocus("files");
  renderAppShell("Staying with Files and Links so you can confirm saved proof.", "success");
}

async function submitWorkspaceStudentSearch(event) {
  event?.preventDefault?.();
  const search = cleanSearchFilter(new FormData(event?.currentTarget).get("search"));
  await openWorkspaceStudentSearch(search);
}

async function openWorkspaceStudentSearch(searchValue = "") {
  if (!currentUser || busy) return;
  const roles = roleIds(currentUser);
  if (!hasSiteStudentDirectoryRole(roles)) {
    renderAppShell("Student search is not available for this account.", "error");
    return;
  }
  const accessibleSites = accessibleSitesForWorkspace();
  const currentSiteId = selectedSiteQueryValue() || currentSiteWorkspaceContext().siteId || (accessibleSites.length === 1 ? accessibleSites[0]?.siteId || "" : "");
  if (accessibleSites.length > 1 && !currentSiteId) {
    renderAppShell("Choose a site before searching students.", "error");
    return;
  }
  const search = cleanSearchFilter(searchValue);
  siteStudentFilters = {
    ...defaultSiteStudentFilters(),
    search,
  };
  siteStudentDetailState = defaultSiteStudentDetailState();
  activeSection = "students";
  syncSiteStudentUrlState({ clearFilters: !search });
  await loadWorkspaceData(search ? `Showing student search results for "${search}".` : "Showing students in the selected view.");
}

async function handleStudentFeedbackAction(event) {
  const action = event?.currentTarget?.dataset?.studentFeedbackAction;
  if (action === "set-filter") {
    setStudentFeedbackFilter(event.currentTarget?.dataset?.studentFeedbackFilter || "");
    return;
  }
  if (action !== "open-history") return;
  await openStudentFeedbackHistory(
    event.currentTarget?.dataset?.studentFeedbackSubmissionId || "",
    event.currentTarget?.dataset?.studentFeedbackOrigin || "feedback",
  );
}

function setStudentFeedbackFilter(value) {
  studentFeedbackFilter = studentFeedbackFilterKey(value);
  studentDisclosureState = {
    ...studentDisclosureState,
    feedback: true,
  };
  const feedbackRows = Array.isArray(unwrap(currentData.dashboard)?.feedback) ? unwrap(currentData.dashboard).feedback : [];
  const selectedSubmissionId = cleanDirectoryFilter(studentFeedbackHistoryState.selectedSubmissionId || "");
  if (studentFeedbackHistoryState.source === "feedback" && selectedSubmissionId) {
    const visibleRows = filterStudentFeedbackRows(feedbackRows, studentFeedbackFilter);
    if (!visibleRows.some((row) => cleanDirectoryFilter(row?.submissionId || "") === selectedSubmissionId)) {
      studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
    }
  }
  activeSection = "studentFeedback";
  const message = studentFeedbackFilter === "all"
    ? "Showing all Program Teacher feedback."
    : `Showing ${studentFeedbackFilterLabel(studentFeedbackFilter).toLowerCase()}.`;
  renderAppShell(message, "success");
}

function handleStudentRequirementAction(event) {
  const action = event?.currentTarget?.dataset?.studentRequirementAction;
  if (!["toggle-detail", "open-detail"].includes(action)) return;
  const requirementId = cleanDirectoryFilter(event.currentTarget?.dataset?.studentRequirementId || "");
  if (!requirementId) return;
  const opening = action === "open-detail" || studentRequirementDetailState.selectedRequirementId !== requirementId;
  const requirements = Array.isArray(unwrap(currentData.dashboard)?.requirements) ? unwrap(currentData.dashboard).requirements : [];
  const phaseKey = studentRequirementPhaseKeyForId(requirements, requirementId);
  const nextRequirementId = opening ? requirementId : "";
  const nextSubmissionId = studentRequirementSubmissionIdForId(requirements, nextRequirementId);
  studentRequirementDetailState = {
    selectedRequirementId: nextRequirementId,
    selectedPhaseKey: opening ? phaseKey || studentRequirementDetailState.selectedPhaseKey || "" : studentRequirementDetailState.selectedPhaseKey || "",
  };
  if (studentFeedbackHistoryState.source === "requirements"
    && cleanDirectoryFilter(studentFeedbackHistoryState.selectedSubmissionId || "")
    && cleanDirectoryFilter(studentFeedbackHistoryState.selectedSubmissionId || "") !== nextSubmissionId) {
    studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
  }
  if (opening) {
    studentDisclosureState = {
      ...studentDisclosureState,
      requirements: true,
    };
  }
  if (opening) requestStudentRequirementFocus(requirementId);
  activeSection = "studentWork";
  renderAppShell(opening ? "Item details opened." : "Item details closed.", "success");
}

function handleStudentFinalChecklistAction(event) {
  const button = event?.currentTarget;
  const action = cleanDirectoryFilter(button?.dataset?.studentFinalCheckAction || "");
  if (!action) return;
  if (action === "feedback") {
    activeSection = "studentFeedback";
    renderAppShell("Feedback opened.", "success");
    return;
  }
  if (action === "links") {
    activeSection = "studentWork";
    renderAppShell("Google Drive links opened.", "success");
    const openLinks = () => {
      const panel = document.querySelector('[data-student-work-section="evidence-files"]');
      if (!panel) return;
      panel.open = true;
      panel.scrollIntoView?.({ block: "start", behavior: "auto" });
      panel.querySelector?.("summary")?.focus?.();
    };
    if (typeof setTimeout === "function") setTimeout(openLinks, 0);
    else openLinks();
    return;
  }
  const requirements = Array.isArray(unwrap(currentData.dashboard)?.requirements) ? unwrap(currentData.dashboard).requirements : [];
  const phaseKey = studentRequirementPhaseKey(button?.dataset?.studentFinalCheckPhase || "");
  const requestedRequirementId = cleanDirectoryFilter(button?.dataset?.studentFinalCheckRequirementId || "");
  const phaseRows = phaseKey
    ? requirements.filter((row) => studentRequirementPhaseKey(row?.phase || row?.phaseLabel || "") === phaseKey)
    : requirements;
  const targetRequirement = requirements.find((row) => studentRequirementId(row) === requestedRequirementId)
    || phaseRows.find((row) => !isStudentRequirementComplete(row?.status))
    || phaseRows[0]
    || null;
  const requirementId = studentRequirementId(targetRequirement);
  studentRequirementDetailState = {
    selectedPhaseKey: phaseKey || studentRequirementPhaseKey(targetRequirement?.phase || targetRequirement?.phaseLabel || ""),
    selectedRequirementId: requirementId,
  };
  activeSection = "studentWork";
  if (requirementId) requestStudentRequirementFocus(requirementId);
  renderAppShell(requirementId ? "Next project item opened." : "Project phase opened.", "success");
}

function updateStudentDraftWordCount(event) {
  const textarea = event?.currentTarget;
  const counter = textarea?.closest?.("[data-student-guided-draft-form]")?.querySelector?.("[data-student-draft-count]");
  if (counter) counter.textContent = `${studentWordCount(textarea.value)} words`;
}

function addStudentDraftStarter(event) {
  const button = event?.currentTarget;
  const form = button?.closest?.("[data-student-guided-draft-form]");
  const textarea = form?.querySelector?.("textarea[name='responseText']");
  const starter = String(button?.dataset?.studentDraftStarter || "").trim();
  if (!textarea || !starter) return;
  if (!textarea.value.trim()) textarea.value = starter;
  else if (!textarea.value.includes(starter)) textarea.value = `${textarea.value.trim()}\n\n${starter}`;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

async function submitStudentGuidedDraft(event) {
  event?.preventDefault?.();
  if (busy || isViewAsStudentActive()) return;
  const form = event?.currentTarget;
  const requirementId = cleanDirectoryFilter(form?.dataset?.requirementId || "");
  const responseText = String(new FormData(form).get("responseText") || "").trim();
  if (!requirementId || !responseText) {
    renderAppShell("Write at least one sentence before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  const result = await settleApi(apiJson(`/api/student/requirements/${encodeURIComponent(requirementId)}/draft`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ responseText }),
  }));
  busy = false;
  if (!result.ok) {
    renderAppShell(messageForStudentDraftError(result.body?.error || result.error, result.status), "error");
    return;
  }
  studentRequirementDetailState.selectedRequirementId = requirementId;
  requestStudentRequirementFocus(requirementId);
  await loadWorkspaceData("Draft saved. Keep writing, add a file if needed, or turn it in when it is ready.");
}

function messageForStudentDraftError(error, status) {
  if (error === "response_text_required") return "Write at least one sentence before saving.";
  if (error === "response_text_too_long") return "This answer is too long. Keep it under 6,000 letters and spaces.";
  if (error === "draft_not_editable") return "This work is being checked. Wait for feedback before changing it.";
  if (error === "requirement_not_found" || status === 404) return "This item is not assigned to you. Refresh and ask your teacher for help.";
  if (status === 401) return "Your sign-in ended. Sign in again, then save your draft.";
  return "Your draft did not save. Try again.";
}

function handleStudentSupportAction(event) {
  const action = event?.currentTarget?.dataset?.studentSupportAction;
  if (action === "focus-feedback") {
    requestStudentSectionFocus("feedback");
    setStudentFeedbackFilter(event?.currentTarget?.dataset?.studentSupportFilter || "all");
    return;
  }
  if (action === "focus-submissions") {
    requestStudentSectionFocus("submissions");
    setStudentSubmissionFilter(event?.currentTarget?.dataset?.studentSupportFilter || "all");
    return;
  }
  if (action === "focus-deadlines") {
    requestStudentSectionFocus("deadlines");
    activeSection = "studentWork";
    renderAppShell("Showing upcoming deadlines.", "success");
    return;
  }
  if (action === "focus-requirements") {
    requestStudentSectionFocus("requirements");
    studentDisclosureState = {
      ...studentDisclosureState,
      requirements: true,
    };
    activeSection = "studentWork";
    renderAppShell("Showing your required work.", "success");
  }
}

function handleStudentRequirementPhaseAction(event) {
  const action = event?.currentTarget?.dataset?.studentRequirementPhaseAction;
  if (action !== "set-phase") return;
  const requirements = Array.isArray(unwrap(currentData.dashboard)?.requirements) ? unwrap(currentData.dashboard).requirements : [];
  const requestedPhaseKey = studentRequirementPhaseKey(event.currentTarget?.dataset?.studentRequirementPhaseKey || "");
  const activePhaseKey = activeStudentRequirementPhaseKey(groupStudentRequirementsByPhase(requirements), studentRequirementDetailState);
  const nextPhaseKey = requestedPhaseKey && requestedPhaseKey === activePhaseKey ? "" : requestedPhaseKey;
  const selectedRequirementId = cleanDirectoryFilter(studentRequirementDetailState.selectedRequirementId || "");
  const selectedRequirementPhaseKey = studentRequirementPhaseKeyForId(requirements, selectedRequirementId);
  const nextSelectedRequirementId = nextPhaseKey && selectedRequirementId && selectedRequirementPhaseKey !== nextPhaseKey
    ? ""
    : selectedRequirementId;
  studentRequirementDetailState = {
    selectedRequirementId: nextSelectedRequirementId,
    selectedPhaseKey: nextPhaseKey,
  };
  const nextSubmissionId = studentRequirementSubmissionIdForId(requirements, nextSelectedRequirementId);
  if (studentFeedbackHistoryState.source === "requirements"
    && cleanDirectoryFilter(studentFeedbackHistoryState.selectedSubmissionId || "")
    && cleanDirectoryFilter(studentFeedbackHistoryState.selectedSubmissionId || "") !== nextSubmissionId) {
    studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
  }
  studentDisclosureState = {
    ...studentDisclosureState,
    requirements: true,
  };
  activeSection = "studentWork";
  renderAppShell(nextPhaseKey ? "Requirement phase focus updated." : "Showing all project phases.", "success");
}

async function handleStudentSubmissionAction(event) {
  const button = event?.currentTarget;
  const action = button?.dataset?.studentSubmissionAction || "";
  if (action === "set-filter") {
    setStudentSubmissionFilter(button?.dataset?.studentSubmissionFilter || "");
    return;
  }
  if (action === "focus-draft") {
    const requirementId = cleanDirectoryFilter(button?.dataset?.studentRequirementId || "");
    if (!requirementId) return;
    const requirements = Array.isArray(unwrap(currentData.dashboard)?.requirements) ? unwrap(currentData.dashboard).requirements : [];
    studentRequirementDetailState = {
      selectedRequirementId: requirementId,
      selectedPhaseKey: studentRequirementPhaseKeyForId(requirements, requirementId),
    };
    requestStudentRequirementFocus(requirementId);
    activeSection = "studentWork";
    renderAppShell("Write your answer or add a file.");
    return;
  }
  const submissionId = cleanDirectoryFilter(button?.dataset?.studentSubmissionId || "");
  if (!submissionId) return;
  if (action === "focus-evidence") {
    focusEvidenceFormsForSubmission(submissionId);
    return;
  }
  if (isViewAsStudentActive()) {
    renderAppShell("Student preview is read-only. Exit student view to return to staff workflows.", "error");
    return;
  }
  if (action !== "submit" || busy) return;
  busy = true;
  button.disabled = true;
  renderAppShell("Sending your work to your teacher for review...");
  const result = await settleApi(apiJson(`/api/submissions/${encodeURIComponent(submissionId)}/submit`, {
    method: "POST",
  }));
  busy = false;
  if (!result.ok) {
    renderAppShell(messageForStudentSubmissionError(result.body?.error || result.error, result.status), "error");
    return;
  }
  await loadWorkspaceData("Your work was turned in. Wait for your teacher before the next step.");
}

function setStudentSubmissionFilter(value) {
  studentSubmissionFilter = studentSubmissionFilterKey(value);
  studentDisclosureState = {
    ...studentDisclosureState,
    submissions: true,
  };
  const submissionRows = Array.isArray(unwrap(currentData.dashboard)?.submissions) ? unwrap(currentData.dashboard).submissions : [];
  const selectedSubmissionId = cleanDirectoryFilter(studentFeedbackHistoryState.selectedSubmissionId || "");
  if (studentFeedbackHistoryState.source === "submissions" && selectedSubmissionId) {
    const visibleRows = filterStudentSubmissionRows(submissionRows, studentSubmissionFilter);
    if (!visibleRows.some((row) => cleanDirectoryFilter(row?.id || "") === selectedSubmissionId)) {
      studentFeedbackHistoryState = defaultStudentFeedbackHistoryState();
    }
  }
  activeSection = "studentWork";
  const message = studentSubmissionFilter === "all"
    ? "Showing all turned-in work."
    : `Showing ${studentSubmissionFilterLabel(studentSubmissionFilter)}.`;
  renderAppShell(message, "success");
}

function focusEvidenceFormsForSubmission(submissionId) {
  const normalizedSubmissionId = cleanDirectoryFilter(submissionId || "");
  if (!normalizedSubmissionId) return;
  studentDisclosureState = {
    ...studentDisclosureState,
    evidence: true,
  };
  pendingStudentEvidenceSubmissionId = normalizedSubmissionId;
  requestStudentSectionFocus("evidence");
  activeSection = "studentWork";
    renderAppShell("File tools opened.", "success");
}

async function openStudentFeedbackHistory(submissionId, source = "feedback") {
  const selectedSubmissionId = cleanDirectoryFilter(submissionId);
  if (!selectedSubmissionId) return;
  const sourceValue = String(source || "feedback").trim();
  const sourceKey = sourceValue === "submissions"
    ? "submissions"
    : sourceValue === "requirements"
      ? "requirements"
      : "feedback";
  studentDisclosureState = {
    ...studentDisclosureState,
    feedback: sourceKey === "feedback" ? true : studentDisclosureState.feedback,
    submissions: sourceKey === "submissions" ? true : studentDisclosureState.submissions,
    requirements: sourceKey === "requirements" ? true : studentDisclosureState.requirements,
  };
  studentFeedbackHistoryState = {
    ...defaultStudentFeedbackHistoryState(),
    selectedSubmissionId,
    source: sourceKey,
    loading: true,
  };
  activeSection = sourceKey === "feedback" ? "studentFeedback" : "studentWork";
  renderAppShell("Loading work history...");
  const historyResult = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(selectedSubmissionId)}/history`));
  studentFeedbackHistoryState = {
    ...studentFeedbackHistoryState,
    loading: false,
    result: historyResult,
  };
  renderAppShell(historyResult.ok ? "Work history loaded." : "Work history unavailable.", historyResult.ok ? "success" : "error");
}

async function applySiteStudentFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  siteStudentFilters = {
    search: cleanDirectoryFilter(data.get("search")),
    programId: cleanDirectoryFilter(data.get("programId")),
    cohortId: cleanDirectoryFilter(data.get("cohortId")),
    status: cleanDirectoryFilter(data.get("status")),
    progressStatus: cleanDirectoryFilter(data.get("progressStatus")),
    evidenceStatus: cleanDirectoryFilter(data.get("evidenceStatus")),
    reviewStatus: cleanDirectoryFilter(data.get("reviewStatus")),
    noMentor: data.get("noMentor") === "true",
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    story: cleanDirectoryFilter(data.get("story")),
    presentationStatus: cleanDirectoryFilter(data.get("presentationStatus")) || "any",
    archiveStatus: cleanDirectoryFilter(data.get("archiveStatus")) || "any",
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  activeSection = "students";
  syncSiteStudentUrlState();
  await loadWorkspaceData("Student directory filters applied.");
}

async function applyReviewQueueFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  reviewQueueFilters = {
    status: cleanDirectoryFilter(data.get("status")),
    programId: cleanDirectoryFilter(data.get("programId")),
    search: cleanDirectoryFilter(data.get("search")),
    story: cleanDirectoryFilter(data.get("story")),
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    evidenceStatus: cleanDirectoryFilter(data.get("evidenceStatus")),
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  reviewQueueState = defaultReviewQueueState();
  activeSection = "teacher";
  syncReviewQueueUrlState();
  await loadReviewQueueResult("Review work filters applied.");
}

async function applyMentorAssignmentFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  mentorAssignmentFilters = {
    programId: cleanDirectoryFilter(data.get("programId")),
    mentorUserId: cleanDirectoryFilter(data.get("mentorUserId")),
    studentSearch: cleanDirectoryFilter(data.get("studentSearch")),
    status: cleanDirectoryFilter(data.get("status")),
    noMentor: data.get("noMentor") === "true",
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  activeSection = "mentorAssignments";
  syncMentorAssignmentUrlState();
  await loadMentorAssignmentsResult("Mentor assignment filters applied.");
}

async function applyOperationsReadinessFilters(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  operationsReadinessFilters = {
    studentId: "",
    programId: cleanDirectoryFilter(data.get("programId")),
    status: cleanDirectoryFilter(data.get("status")),
    story: cleanDirectoryFilter(data.get("story")),
    risk: cleanDirectoryFilter(data.get("risk")) || "any",
    presentationStatus: cleanDirectoryFilter(data.get("presentationStatus")),
    archiveStatus: cleanDirectoryFilter(data.get("archiveStatus")),
    readiness: cleanDirectoryFilter(data.get("readiness")),
    category: cleanDirectoryFilter(data.get("category")),
    needsAttention: false,
    outlineAttention: false,
    limit: clampDirectoryNumber(data.get("limit"), 50, 1, 100),
    offset: 0,
  };
  activeSection = "operations";
  syncOperationsReadinessUrlState();
  await loadOperationsReadinessResult("Operations filters applied.");
}

async function handleViewAsStudentAction(event) {
  const button = event?.currentTarget;
  const action = button?.dataset?.viewAsStudentAction || "";
  if (action === "exit") {
    exitViewAsStudent("Exited student view.");
    return;
  }
  if (action !== "enter") return;
  await enterViewAsStudent(button?.dataset?.viewAsStudentId || "", {
    studentName: button?.dataset?.viewAsStudentName || "",
    sourceSection: button?.dataset?.viewAsStudentSourceSection || activeSection,
  });
}

async function enterViewAsStudent(studentId, options = {}) {
  await ensureWorkspaceFeatureModules(["student"]);
  const selectedStudentId = cleanDirectoryFilter(studentId || "");
  if (!selectedStudentId) return;
  if (!canUseViewAsStudent(roleIds(currentUser))) {
    renderAppShell("Student preview is not available for this account.", "error");
    return;
  }
  const sourceSection = cleanWorkspaceSection(options.sourceSection || activeSection) || "students";
  const sourceMode = cleanWorkspaceMode(activeWorkspaceMode) || "workspace";
  const studentName = String(options.studentName || "").trim().slice(0, 160);
  viewAsStudentState = {
    ...defaultViewAsStudentState(),
    studentId: selectedStudentId,
    studentName,
    sourceSection,
    sourceMode,
    loading: true,
  };
  activeWorkspaceMode = "workspace";
  activeSection = "student";
  currentData.dashboard = null;
  currentData.archiveReadiness = null;
  syncViewAsStudentUrlState();
  renderAppShell("Loading student view...");
  await loadViewAsStudentPreview("Student view opened.");
}

async function restoreViewAsStudentFromUrlState(options = {}) {
  await ensureWorkspaceFeatureModules(["student"]);
  if (!shouldRestoreViewAsStudentFromUrlState(roleIds(currentUser))) return false;
  activeWorkspaceMode = "workspace";
  activeSection = "student";
  viewAsStudentState = {
    ...viewAsStudentState,
    loading: true,
  };
  currentData.dashboard = null;
  currentData.archiveReadiness = null;
  if (options.renderLoading !== false) renderAppShell("Loading student view...");
  return loadViewAsStudentPreview(options.message || "Student view restored.", {
    errorMessage: options.errorMessage,
    syncUrl: options.syncUrl,
  });
}

async function loadViewAsStudentPreview(message = "Student view opened.", options = {}) {
  const studentId = cleanDirectoryFilter(viewAsStudentState.studentId || "");
  if (!studentId || !canUseViewAsStudent(roleIds(currentUser))) {
    exitViewAsStudent(options.errorMessage || "Student preview is not available for this account.", "error", { replaceUrl: true });
    return false;
  }
  const dashboardResult = await settleApi(apiJson(`/api/student/dashboard?studentId=${encodeURIComponent(studentId)}`));
  if (!dashboardResult.ok) {
    const reason = dashboardResult.status === 403
      ? "Student view is not available for this account."
      : "Student view unavailable.";
    exitViewAsStudent(options.errorMessage || reason, "error", { replaceUrl: true });
    return false;
  }
  const archiveResult = await settleApi(apiJson(`/api/student/archive/readiness?studentId=${encodeURIComponent(studentId)}`));
  const dashboard = unwrap(dashboardResult) || {};
  viewAsStudentState = {
    ...viewAsStudentState,
    loading: false,
    result: dashboardResult,
    archiveResult,
    studentName: String(dashboard.student?.displayName || dashboard.studentName || viewAsStudentState.studentName || "").trim().slice(0, 160),
  };
  currentData.dashboard = dashboardResult;
  currentData.archiveReadiness = archiveResult;
  activeWorkspaceMode = "workspace";
  activeSection = "student";
  if (options.syncUrl !== false) syncViewAsStudentUrlState({ replace: Boolean(options.replaceUrl) });
  renderAppShell(message, "success");
  return true;
}

function exitViewAsStudent(message = "Exited student view.", tone = "success", options = {}) {
  const sourceSection = cleanWorkspaceSection(viewAsStudentState.sourceSection) || "students";
  const sourceMode = cleanWorkspaceMode(viewAsStudentState.sourceMode) || "workspace";
  viewAsStudentState = defaultViewAsStudentState();
  currentData.dashboard = null;
  currentData.archiveReadiness = null;
  activeWorkspaceMode = sourceMode;
  const allowedIds = availableSectionIds(activeWorkspaceMode);
  activeSection = allowedIds.has(sourceSection) ? sourceSection : defaultSectionForMode(activeWorkspaceMode);
  syncCurrentWorkspaceUrlState({ replace: options.replaceUrl !== false });
  renderAppShell(message, tone);
}

async function handleOperationsReadinessAction(event) {
  const action = event?.currentTarget?.dataset?.operationsAction;
  if (!action) return;
  if (action === "open-student") {
    activeSection = "operations";
    await openSiteStudentDetail(event.currentTarget?.dataset?.operationsStudentId || "", { sourceSection: "operations" });
    return;
  }
  if (action === "reset-filters") {
    operationsReadinessFilters = defaultOperationsReadinessFilters();
    activeSection = "operations";
    syncOperationsReadinessUrlState({ clearFilters: true });
    await loadOperationsReadinessResult("Operations filters reset.");
    return;
  }
  if (action === "filter-category") {
    const category = canonicalReviewQueueValue(event.currentTarget?.dataset?.operationsCategory, OPERATIONS_CATEGORY_VALUES);
    if (!category) return;
    operationsReadinessFilters = {
      ...operationsReadinessFilters,
      category,
      offset: 0,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult(`Showing ${categoryLabel(category).toLowerCase()} operations rows.`);
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const body = unwrap(currentData.operationsReadiness);
    const pagination = body?.pagination || {};
    const limit = safeNumber(pagination.limit || operationsReadinessFilters.limit || 50);
    const offset = safeNumber(pagination.offset || operationsReadinessFilters.offset || 0);
    operationsReadinessFilters = {
      ...operationsReadinessFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Operations page updated.");
  }
}

async function handleMentorAssignmentAction(event) {
  const action = event?.currentTarget?.dataset?.mentorAssignmentAction;
  if (!action) return;
  if (action === "open-student") {
    activeSection = "mentorAssignments";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorStudentId || "", { sourceSection: "mentorAssignments" });
    return;
  }
  if (action === "filter-mentor") {
    const mentorUserId = cleanDirectoryFilter(event.currentTarget?.dataset?.mentorId);
    if (!mentorUserId) return;
    mentorAssignmentFilters = {
      ...defaultMentorAssignmentFilters(),
      mentorUserId,
      status: "active",
    };
    activeSection = "mentorAssignments";
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Showing active assignments for this mentor.");
    return;
  }
  if (action === "reset-filters") {
    mentorAssignmentFilters = defaultMentorAssignmentFilters();
    activeSection = "mentorAssignments";
    syncMentorAssignmentUrlState({ clearFilters: true });
    await loadMentorAssignmentsResult("Mentor assignment filters reset.");
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const body = unwrap(currentData.mentorAssignments);
    const pagination = body?.pagination || {};
    const limit = safeNumber(pagination.limit || mentorAssignmentFilters.limit || 50);
    const offset = safeNumber(pagination.offset || mentorAssignmentFilters.offset || 0);
    mentorAssignmentFilters = {
      ...mentorAssignmentFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    activeSection = "mentorAssignments";
    syncMentorAssignmentUrlState();
    await loadMentorAssignmentsResult("Mentor assignment page updated.");
  }
}

async function handleMentorDashboardAction(event) {
  const action = event?.currentTarget?.dataset?.mentorDashboardAction;
  if (!action) return;
  if (action === "filter") {
    mentorDashboardFilter = cleanMentorDashboardFilter(event.currentTarget?.dataset?.mentorDashboardFilter || "all");
    const assigned = prioritizeMentorDashboardStudents(unwrap(currentData.mentorDashboard)?.assignedStudents || unwrap(currentData.mentorAssigned)?.assignedStudents || [], mentorDashboardSort);
    const filteredAssigned = filterMentorDashboardStudents(assigned, mentorDashboardFilter);
    if (mentorDashboardDetailStudentId && !filteredAssigned.some((row) => cleanDirectoryFilter(row.studentId || "") === cleanDirectoryFilter(mentorDashboardDetailStudentId))) {
      mentorDashboardDetailStudentId = "";
    }
    activeSection = "mentorDashboard";
    syncMentorDashboardUrlState({ clearFilters: mentorDashboardFilter === "all" && mentorDashboardSort === "priority" });
    renderAppShell(mentorDashboardFilter === "all" ? "Showing all assigned students." : "Mentor dashboard filter applied.", "success");
    return;
  }
  if (action === "sort") {
    mentorDashboardSort = cleanMentorDashboardSort(event.currentTarget?.dataset?.mentorDashboardSort || "priority");
    activeSection = "mentorDashboard";
    syncMentorDashboardUrlState({ clearFilters: mentorDashboardFilter === "all" && mentorDashboardSort === "priority" });
    renderAppShell(`Mentor dashboard sorted by ${mentorDashboardSortLabel(mentorDashboardSort).toLowerCase()}.`, "success");
    return;
  }
  if (action === "open-student") {
    activeSection = "mentorDashboard";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorDashboardStudentId || "", { sourceSection: "mentorDashboard" });
    return;
  }
  if (action === "open-meetings") {
    activeSection = "mentorDashboard";
    await openSiteStudentDetail(event.currentTarget?.dataset?.mentorDashboardStudentId || "", {
      sourceSection: "mentorDashboard",
      activeTab: "work",
    });
  }
}

async function handleReviewQueueAction(event) {
  const action = event?.currentTarget?.dataset?.reviewQueueAction;
  if (!action) return;
  if (action === "select") {
    await openReviewSubmission(event.currentTarget?.dataset?.reviewSubmissionId || "");
    return;
  }
  if (action === "clear-selection") {
    reviewQueueState = defaultReviewQueueState();
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "teacher";
    syncReviewQueueUrlState({ replace: true });
    renderAppShell();
    return;
  }
  if (action === "open-student") {
    activeSection = "teacher";
    await openSiteStudentDetail(event.currentTarget?.dataset?.reviewStudentId || "", { sourceSection: "teacher" });
    return;
  }
  if (action === "reset-filters") {
    reviewQueueFilters = defaultReviewQueueFilters();
    reviewQueueState = defaultReviewQueueState();
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "teacher";
    syncReviewQueueUrlState({ clearFilters: true });
    await loadReviewQueueResult("Review work filters reset.");
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const queue = unwrap(currentData.reviewQueue);
    const pagination = queue?.pagination || {};
    const limit = safeNumber(pagination.limit || reviewQueueFilters.limit || 10);
    const offset = safeNumber(pagination.offset || reviewQueueFilters.offset || 0);
    reviewQueueFilters = {
      ...reviewQueueFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    reviewQueueState = defaultReviewQueueState();
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "teacher";
    syncReviewQueueUrlState();
    await loadReviewQueueResult("Review work page updated.");
  }
}

async function openReviewSubmission(submissionId) {
  const selectedSubmissionId = cleanDirectoryFilter(submissionId);
  if (!selectedSubmissionId) return;
  const rows = unwrap(currentData.reviewQueue)?.queue || [];
  if (rows.length && !rows.some((row) => row.submissionId === selectedSubmissionId)) {
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectionNotice: "The selected submission is not visible in the current review queue.",
    };
    syncReviewQueueUrlState();
    renderAppShell("Select a visible review row.", "error");
    return;
  }
  reviewQueueState = {
    ...defaultReviewQueueState(),
    selectedSubmissionId,
  };
  syncReviewQueueUrlState();
  await loadSelectedReviewHistory(selectedSubmissionId, { renderLoading: true });
}

async function submitReviewDecision(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const submissionId = cleanDirectoryFilter(data.get("submissionId"));
  const decision = cleanDirectoryFilter(event.submitter?.value || data.get("decision"));
  const feedback = String(data.get("feedback") || "").trim();
  if (!submissionId || !["approved", "revision_requested", "comment_only"].includes(decision)) {
    renderAppShell("Choose a review decision before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  const queue = unwrap(currentData.reviewQueue);
  const selected = (queue?.queue || []).find((item) => item.submissionId === submissionId) || null;
  const siteId = queue?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  try {
    const result = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(submissionId)}/decision${query}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, feedback }),
    }));
    reviewQueueState = {
      ...reviewQueueState,
      decisionResult: result,
    };
    if (!result.ok) {
      renderAppShell(messageForReviewDecisionError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await refreshSelectedStudentDetailAfterReview(selected);
    reviewQueueState = defaultReviewQueueState();
    await loadReviewQueueResult(reviewDecisionSuccessMessage(decision));
  } finally {
    busy = false;
  }
}

function reviewDecisionSuccessMessage(decision = "") {
  const normalized = normalizeStatus(decision);
  if (normalized === "approved") return "Accepted. The student's next step is now open.";
  if (normalized === "revision_requested") return "Changes requested. The student can see what to fix.";
  if (normalized === "comment_only") return "Note saved. The student's step did not change.";
  return "Review decision saved.";
}

async function loadReviewQueueResult(message = "", options = {}) {
  const result = await settleApi(apiJson(`/api/site/review-queue${siteReviewQueueQueryString()}`));
  currentData.reviewQueue = result;
  const rows = unwrap(result)?.queue || [];
  const selectedSubmissionId = cleanDirectoryFilter(reviewQueueState.selectedSubmissionId);
  if (selectedSubmissionId && !rows.some((row) => row.submissionId === selectedSubmissionId)) {
    reviewQueueState = {
      ...reviewQueueState,
      selectedSubmissionId: "",
      historyResult: null,
      loadingHistory: false,
      selectionNotice: "The shared submission is not visible in this review queue with the current filters.",
    };
  } else if (options.restoreSelection !== false) {
    await restoreReviewQueueSelectionFromCurrentRows({ renderLoading: false });
  }
  activeSection = "teacher";
  if (options.syncUrl !== false) syncReviewQueueUrlState({ replace: Boolean(options.replaceUrl) });
  if (shouldRestoreSiteStudentDetailFromUrlState(roleIds(currentUser), "teacher")) {
    await restoreSiteStudentDetailFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: message || "Student detail link restored.",
    });
    return;
  }
  renderAppShell(result.ok ? (message || "Review work loaded.") : "Review work unavailable.", result.ok ? "success" : "error");
}

async function restoreReviewQueueSelectionFromCurrentRows(options = {}) {
  const selectedSubmissionId = cleanDirectoryFilter(reviewQueueState.selectedSubmissionId);
  if (!selectedSubmissionId || reviewQueueState.historyResult || reviewQueueState.loadingHistory) return;
  const rows = unwrap(currentData.reviewQueue)?.queue || [];
  if (!rows.some((row) => row.submissionId === selectedSubmissionId)) {
    reviewQueueState = {
      ...reviewQueueState,
      selectedSubmissionId: "",
      historyResult: null,
      loadingHistory: false,
      selectionNotice: "The shared submission is not visible in this review queue with the current filters.",
    };
    syncReviewQueueUrlState({ replace: true });
    return;
  }
  await loadSelectedReviewHistory(selectedSubmissionId, options);
}

async function loadSelectedReviewHistory(selectedSubmissionId, options = {}) {
  const queue = unwrap(currentData.reviewQueue);
  const siteId = selectedSiteQueryValue() || queue?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  reviewQueueState = {
    ...reviewQueueState,
    selectedSubmissionId,
    loadingHistory: true,
  };
  activeSection = "teacher";
  if (options.renderLoading) renderAppShell("Loading review history...");
  const historyResult = await settleApi(apiJson(`/api/reviews/${encodeURIComponent(selectedSubmissionId)}/history${query}`));
  reviewQueueState = {
    ...reviewQueueState,
    loadingHistory: false,
    historyResult,
  };
  if (options.renderLoading) {
    if (historyResult.ok) {
      renderAppShell();
    } else {
      renderAppShell("Review history unavailable.", "error");
    }
  }
}

async function refreshSelectedStudentDetailAfterReview(selected) {
  if (!selected?.studentId || siteStudentDetailState.studentId !== selected.studentId) return;
  const siteId = unwrap(currentData.reviewQueue)?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const result = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(selected.studentId)}${query}`));
  if (result.ok) {
    siteStudentDetailState = {
      ...siteStudentDetailState,
      result,
      timelineResult: null,
    };
    currentData.siteStudentDetail = result;
  }
}

async function handleProjectAction(event) {
  const button = event?.currentTarget;
  const action = button?.dataset?.projectAction || "";
  if (action === "new") {
    const panel = document.querySelector("#createProjectPanel");
    if (!panel) {
      renderAppShell("Project setup is not available for this account.", "error");
      return;
    }
    panel?.setAttribute("open", "");
    panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    panel?.querySelector?.('[name="name"]')?.focus?.();
    return;
  }
  if (action === "view") {
    const view = button.dataset.projectView === "board" ? "board" : "table";
    projectDirectoryView = view;
    renderAppShell();
    document.querySelector("[data-project-directory-filter-form] [name=search]")?.focus?.();
    return;
  }
  if (action === "page") {
    const nextPage = Math.max(1, safeNumber(button.dataset.projectPage));
    if (!nextPage || button.disabled) return;
    projectDirectoryFilters = { ...projectDirectoryFilters, page: nextPage };
    activeProjectId = "";
    managedProjectId = "";
    await loadProjectsResult("Project page updated.");
    document.querySelector("#projectListTitle")?.focus?.();
    return;
  }
  if (action === "clear-filters") {
    projectDirectoryFilters = defaultProjectDirectoryFilters();
    activeProjectId = "";
    managedProjectId = "";
    await loadProjectsResult("Showing all projects.");
    document.querySelector("[data-project-directory-filter-form] [name=search]")?.focus?.();
    return;
  }
  if (action === "open-row") {
    const projectId = cleanDirectoryFilter(button.dataset.projectId || "");
    if (!projectId) {
      renderAppShell("This project could not be opened. Choose a project from the list.", "error");
      return;
    }
    activeProjectId = projectId;
    managedProjectId = "";
    renderAppShell();
    const card = document.querySelector(`details.workspace-project-card[data-project-id="${projectId}"]`);
    if (!card) {
      activeProjectId = "";
      renderAppShell("This project is no longer in the list. Refresh and choose another project.", "error");
      return;
    }
    card?.setAttribute("open", "");
    document.querySelector("[data-project-focused-detail]")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    card?.querySelector?.("summary")?.focus?.();
    return;
  }
  if (action === "manage") {
    const projectId = cleanDirectoryFilter(button.dataset.projectId || "");
    if (!projectId) {
      renderAppShell("Project settings could not open. Choose a project from the list.", "error");
      return;
    }
    activeProjectId = projectId;
    managedProjectId = managedProjectId === projectId ? "" : projectId;
    renderAppShell();
    if (managedProjectId) {
      const card = document.querySelector(`details.workspace-project-card[data-project-id="${managedProjectId}"]`);
      card?.setAttribute("open", "");
      card?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
    return;
  }
  if (action !== "review") return;
  const submissionId = cleanDirectoryFilter(button.dataset.projectSubmissionId || "");
  const projectName = String(button.dataset.projectName || "").trim().slice(0, 120);
  if (!submissionId) {
    renderAppShell("No work from this project is waiting for review right now.", "error");
    return;
  }
  reviewQueueFilters = {
    ...defaultReviewQueueFilters(),
    search: projectName,
  };
  reviewQueueState = defaultReviewQueueState();
  activeSection = "teacher";
  await loadReviewQueueResult("Opening this project for review.");
  await openReviewSubmission(submissionId);
}

async function submitProjectDirectoryFilters(event) {
  event?.preventDefault?.();
  if (busy) return;
  const data = new FormData(event?.currentTarget);
  projectDirectoryFilters = {
    ...defaultProjectDirectoryFilters(),
    search: cleanSearchFilter(data.get("search")),
    filter: cleanProjectDirectoryFilter(data.get("filter")),
  };
  activeProjectId = "";
  managedProjectId = "";
  await loadProjectsResult("Project list updated.");
  document.querySelector("[data-project-directory-filter-form] [name=search]")?.focus?.();
}

async function loadProjectsResult(statusMessage = "") {
  if (!currentUser || busy) return;
  busy = true;
  try {
    const result = await settleApi(apiJson(`/api/projects${projectDirectoryQueryString()}`));
    currentData.projects = result;
    if (result.ok) {
      const pagination = unwrap(result)?.pagination || {};
      projectDirectoryFilters = {
        search: cleanSearchFilter(pagination.search),
        filter: cleanProjectDirectoryFilter(pagination.filter),
        page: Math.max(1, safeNumber(pagination.page) || 1),
        pageSize: Math.max(10, safeNumber(pagination.pageSize) || 25),
      };
      const projects = Array.isArray(unwrap(result)?.projects) ? unwrap(result).projects : [];
      if (activeProjectId && !projects.some((project) => project.projectId === activeProjectId)) activeProjectId = "";
      if (managedProjectId && !projects.some((project) => project.projectId === managedProjectId)) managedProjectId = "";
    }
    renderAppShell(result.ok ? statusMessage : "Projects could not load. Try again.", result.ok ? "success" : "error");
  } finally {
    busy = false;
  }
}

function bindProjectTeamPicker(picker) {
  const search = picker?.querySelector?.("[data-project-team-search]");
  const addButton = picker?.querySelector?.("[data-project-team-add]");
  addButton?.addEventListener("click", () => addProjectTeamMember(picker));
  search?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addProjectTeamMember(picker);
  });
  picker?.addEventListener("click", (event) => {
    const removeButton = event.target?.closest?.("[data-project-team-remove]");
    if (!removeButton) return;
    removeButton.closest("[data-project-team-member]")?.remove?.();
    updateProjectTeamPickerStatus(picker, "Student removed.");
    search?.focus?.();
  });
}

function addProjectTeamMember(picker) {
  const search = picker?.querySelector?.("[data-project-team-search]");
  const label = String(search?.value || "").trim();
  const student = projectStudentOptionForLabel(label);
  const selected = Array.from(picker?.querySelectorAll?.("[data-project-team-member]") || []);
  if (!student) {
    updateProjectTeamPickerStatus(picker, "Choose a student from the name list.", true);
    search?.focus?.();
    return;
  }
  if (selected.some((row) => row.dataset.projectTeamMember === student.studentId)) {
    updateProjectTeamPickerStatus(picker, "That student is already on this team.", true);
    search?.focus?.();
    return;
  }
  if (selected.length >= 5) {
    updateProjectTeamPickerStatus(picker, "A project can have no more than five students.", true);
    search?.focus?.();
    return;
  }

  const list = picker.querySelector("[data-project-team-selected]");
  const row = document.createElement("li");
  row.dataset.projectTeamMember = student.studentId;
  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = "studentIds";
  hidden.value = student.studentId;
  const name = document.createElement("span");
  name.textContent = projectStudentOptionLabel(student);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "workspace-link-button workspace-link-button-small";
  remove.dataset.projectTeamRemove = student.studentId;
  remove.setAttribute("aria-label", `Remove ${student.displayName || "student"}`);
  remove.textContent = "Remove";
  row.append(hidden, name, remove);
  list?.append?.(row);
  search.value = "";
  updateProjectTeamPickerStatus(picker, `${student.displayName || "Student"} added.`);
  search.focus?.();
}

function updateProjectTeamPickerStatus(picker, message = "", isError = false) {
  const status = picker?.querySelector?.("[data-project-team-status]");
  if (!status) return;
  const count = picker.querySelectorAll("[data-project-team-member]").length;
  status.textContent = `${message ? `${message} ` : ""}${count} ${pluralize(count, "student")} selected.`;
  status.classList.toggle("is-error", Boolean(isError));
}

function projectStudentOptionForLabel(label = "") {
  const wanted = String(label || "").trim().toLocaleLowerCase();
  if (!wanted) return null;
  const body = unwrap(currentData.projects);
  const members = (Array.isArray(body?.projects) ? body.projects : []).flatMap((project) => Array.isArray(project.members) ? project.members : []);
  const students = uniqueProjectStudentsById([...(Array.isArray(body?.availableStudents) ? body.availableStudents : []), ...members]);
  return students.find((student) => projectStudentOptionLabel(student).toLocaleLowerCase() === wanted) || null;
}

async function submitCreateProject(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const siteId = cleanDirectoryFilter(data.get("siteId"));
  const name = String(data.get("name") || "").trim();
  const summary = String(data.get("summary") || "").trim();
  const studentIds = projectFormStudentIds(data, 5);
  const mentorUserId = cleanDirectoryFilter(data.get("mentorUserId"));
  const programTeacherUserId = cleanDirectoryFilter(data.get("programTeacherUserId"));
  if (!siteId || !name || studentIds.length < 1 || !mentorUserId || !programTeacherUserId) {
    renderAppShell("Add a project name, choose the students, and choose both required people.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, name, summary, studentIds, mentorUserId, programTeacherUserId }),
    }));
    if (!result.ok) {
      renderAppShell(messageForCreateProjectError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "projects";
    await loadWorkspaceData(result.body?.message || "Project created. The team can start working here.");
  } finally {
    busy = false;
  }
}

async function submitManageProject(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const siteId = cleanDirectoryFilter(data.get("siteId"));
  const projectId = cleanDirectoryFilter(data.get("projectId"));
  const name = String(data.get("name") || "").trim();
  const summary = String(data.get("summary") || "").trim();
  const studentIds = projectFormStudentIds(data, 5);
  if (!siteId || !projectId || !name || !studentIds.length) {
    renderAppShell("Add a project name and choose at least one student.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "update_project", siteId, projectId, name, summary, studentIds }),
    }));
    if (!result.ok) {
      renderAppShell(messageForCreateProjectError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "projects";
    await loadWorkspaceData(result.body?.message || "Project name and team saved.");
  } finally {
    busy = false;
  }
}

async function submitProjectNote(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const action = cleanDirectoryFilter(event?.submitter?.value || data.get("action"));
  const projectId = cleanDirectoryFilter(data.get("projectId"));
  const noteId = cleanDirectoryFilter(data.get("noteId"));
  const noteBody = String(data.get("noteBody") || "").trim();
  if (!projectId || !["create_note", "edit_note", "archive_note", "restore_note"].includes(action)) return;
  if (["create_note", "edit_note"].includes(action) && !noteBody) {
    renderAppShell("Write a note before saving it.", "error");
    return;
  }

  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, projectId, noteId, noteBody }),
    }));
    if (!result.ok) {
      const messages = {
        project_note_required: "Write a note before saving it.",
        project_note_not_found: "That note is no longer here. Refresh and try again.",
        restore_note_before_editing: "Restore this note before editing it.",
        forbidden: "You do not have permission to change this note.",
      };
      renderAppShell(messages[result.body?.error || result.error] || "The note could not be saved. Try again.", "error");
      return;
    }
    activeProjectId = projectId;
    await loadProjectsResult(result.body?.message || "Project note saved.");
  } finally {
    busy = false;
  }
}

async function submitStudentProjectRequest(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const siteId = cleanDirectoryFilter(data.get("siteId"));
  const name = String(data.get("name") || "").trim();
  const summary = String(data.get("summary") || "").trim();
  const peerLabels = [1, 2, 3, 4]
    .map((number) => String(data.get(`studentLabel${number}`) || "").trim())
    .filter(Boolean);
  const studentIds = [...new Set(peerLabels.map(projectStudentIdForOptionLabel).filter(Boolean))];
  if (!siteId || !name || !summary) {
    renderAppShell("Add a project name and a short goal before sending your idea.", "error");
    return;
  }
  if (studentIds.length !== peerLabels.length) {
    renderAppShell("Choose each teammate from the name list. Do not choose the same person twice.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "submit_request", siteId, name, summary, studentIds }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectRequestError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "studentWork";
    await loadWorkspaceData(result.body?.message || "Project idea sent. Your teacher will review it.");
  } finally {
    busy = false;
  }
}

async function submitProjectAdultChoice(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form || busy) return;
  const data = new FormData(form);
  const payload = projectAdultTargetPayload(data);
  payload.action = cleanDirectoryFilter(data.get("action")) || "nominate_adult";
  payload.adultRole = cleanDirectoryFilter(data.get("adultRole"));
  payload.assigneeUserId = cleanDirectoryFilter(data.get("assigneeUserId"));
  payload.inviteName = String(data.get("inviteName") || "").trim();
  payload.inviteEmail = String(data.get("inviteEmail") || "").trim();
  payload.reason = String(data.get("reason") || "").trim();
  if (!payload.adultRole || (!payload.assigneeUserId && (!payload.inviteName || !payload.inviteEmail))) {
    renderAppShell("Choose a person, or add the Mentor name and email.", "error");
    return;
  }
  await saveProjectAdultAction(form, payload, "Invite saved. The person must accept before the project can move forward.");
}

async function submitProjectAdultResponse(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form || busy) return;
  const data = new FormData(form);
  const action = cleanDirectoryFilter(event?.submitter?.value || data.get("action"));
  const assignmentId = cleanDirectoryFilter(data.get("assignmentId"));
  if (!assignmentId || !["accept_adult_invitation", "decline_adult_invitation"].includes(action)) return;
  await saveProjectAdultAction(
    form,
    { action, assignmentId },
    action === "accept_adult_invitation" ? "You accepted the project role." : "You declined the project role.",
  );
}

async function cancelProjectAdultInvite(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form || busy) return;
  const data = new FormData(form);
  const assignmentId = cleanDirectoryFilter(data.get("assignmentId"));
  if (!assignmentId) return;
  await saveProjectAdultAction(form, { action: "cancel_adult_invitation", assignmentId }, "Invite cancelled. Choose another person when you are ready.");
}

async function linkProjectAdultAccount(event) {
  event?.preventDefault?.();
  const form = event?.currentTarget;
  if (!form || busy) return;
  const data = new FormData(form);
  const assignmentId = cleanDirectoryFilter(data.get("assignmentId"));
  const assigneeUserId = cleanDirectoryFilter(data.get("assigneeUserId"));
  if (!assignmentId || !assigneeUserId) {
    renderAppShell("Choose the matching Mentor account.", "error");
    return;
  }
  await saveProjectAdultAction(form, { action: "link_external_mentor", assignmentId, assigneeUserId }, "Mentor account connected. The Mentor can now accept.");
}

async function markProjectAdultNoticesRead(event) {
  event?.preventDefault?.();
  if (busy) return;
  await saveProjectAdultAction(null, { action: "mark_notifications_read" }, "Project updates marked as read.");
}

function projectAdultTargetPayload(data) {
  const projectId = cleanDirectoryFilter(data.get("projectId"));
  const requestId = cleanDirectoryFilter(data.get("requestId"));
  return projectId ? { projectId } : requestId ? { requestId } : {};
}

async function saveProjectAdultAction(form, payload, successMessage) {
  busy = true;
  if (form) setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/project-adults", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectAdultError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await loadWorkspaceData(result.body?.message || successMessage);
  } finally {
    busy = false;
  }
}

async function submitProjectFolderLink(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const projectId = cleanDirectoryFilter(data.get("projectId"));
  const folderUrl = cleanWorkspaceGoogleDriveFolderUrl(data.get("folderUrl"));
  const confirmLinkOpened = data.get("confirmLinkOpened") === "true";
  if (!projectId || !folderUrl) {
    renderAppShell("Paste a Google Drive folder link. Open the folder in Drive, then copy its link.", "error");
    return;
  }
  if (!confirmLinkOpened) {
    renderAppShell("Open the folder in Google Drive, then check the box before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "set_folder_link", projectId, folderUrl, confirmLinkOpened }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectFolderError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "studentWork";
    await loadWorkspaceData(result.body?.message || "Google Drive folder link saved.");
  } finally {
    busy = false;
  }
}

async function submitProjectTemplate(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const siteId = cleanDirectoryFilter(data.get("siteId"));
  const templateId = cleanDirectoryFilter(data.get("templateId"));
  const name = String(data.get("name") || "").trim();
  const phase = cleanDirectoryFilter(data.get("phase"));
  const description = String(data.get("description") || "").trim();
  const templateUrl = cleanWorkspaceGoogleWorkUrl(data.get("templateUrl"));
  const changeReason = String(data.get("changeReason") || "").trim();
  const confirmImpact = data.get("confirmImpact") === "true";
  const confirmLinkOpened = data.get("confirmLinkOpened") === "true";
  if (templateId && (!siteId || !templateUrl || !changeReason)) {
    renderAppShell("Paste the new Google link and write why it is changing.", "error");
    return;
  }
  if (templateId && !confirmImpact) {
    renderAppShell("Check the box to confirm students should use the new link.", "error");
    return;
  }
  if (!templateId && (!siteId || !name || !phase || !templateUrl)) {
    renderAppShell("Add a name, choose a stage, and paste a Google Drive, Docs, Sheets, or Slides link.", "error");
    return;
  }
  if (!confirmLinkOpened) {
    renderAppShell("Open the Google link, then check the box to show that it works.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save_template",
        siteId,
        templateId,
        name,
        phase,
        description,
        templateUrl,
        changeReason,
        confirmImpact,
        confirmLinkOpened,
      }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectTemplateError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "projects";
    await loadWorkspaceData(result.body?.message || (templateId ? "Template link updated." : "Template link added."));
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}
async function removeProjectTemplate(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const action = cleanDirectoryFilter(data.get("action")) || "archive_template";
  const siteId = cleanDirectoryFilter(data.get("siteId"));
  const templateId = cleanDirectoryFilter(data.get("templateId"));
  const changeReason = String(data.get("changeReason") || "").trim();
  const confirmImpact = data.get("confirmImpact") === "true";
  if (!siteId || !templateId) return;
  if (!changeReason || !confirmImpact) {
    renderAppShell(
      action === "restore_template"
        ? "Write why, then check the box before restoring this template."
        : "Write why, then check the box before removing this template.",
      "error",
    );
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, siteId, templateId, changeReason, confirmImpact }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectTemplateError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "projects";
    await loadWorkspaceData(result.body?.message || (action === "restore_template" ? "Template restored." : "Template removed."));
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}

function messageForProjectFolderError(error, status) {
  if (error === "invalid_google_drive_folder_url") return "Paste a Google Drive folder link. A file or document link will not work here.";
  if (error === "drive_folder_open_confirmation_required") return "Open the folder in Google Drive, then check the box before saving.";
  if (error === "project_not_found") return "This project is no longer active. Refresh the page and try again.";
  if (status === 403) return "Only a student on this project or an allowed project manager can change the folder link.";
  if (status === 401) return "Your sign-in ended. Sign in again, then save the folder link.";
  return "The folder link was not saved. Check the link and try again.";
}

function messageForProjectTemplateError(error, status) {
  if (error === "template_fields_required") return "Add a template name, stage, and Google Drive link.";
  if (error === "template_open_confirmation_required") return "Open the Google link, then check the box to show that it works.";
  if (error === "template_program_not_found") return "That program is not part of this school.";
  if (error === "template_not_found") return "That template is no longer available. Refresh the page.";
  if (error === "template_change_reason_required") return "Write why the template link is changing.";
  if (error === "template_change_confirmation_required") return "Check the box to confirm students should use the new link.";
  if (error === "template_remove_reason_required") return "Write why this template is being removed.";
  if (error === "template_remove_confirmation_required") return "Check the box before removing this template.";
  if (error === "template_restore_reason_required") return "Write why this template is being restored.";
  if (error === "template_restore_confirmation_required") return "Check the box before restoring this template.";
  if (status === 403) return "This account cannot manage templates for this school.";
  if (status === 401) return "Your sign-in ended. Sign in again, then try once more.";
  return "The template link was not saved. Check the link and try again.";
}

function projectStudentIdForOptionLabel(label = "") {
  const wanted = String(label || "").trim().toLocaleLowerCase();
  if (!wanted) return "";
  const body = unwrap(currentData.projects);
  const students = uniqueProjectStudentOptions(Array.isArray(body?.availableStudents) ? body.availableStudents : []);
  return cleanDirectoryFilter(students.find((student) => projectStudentOptionLabel(student).toLocaleLowerCase() === wanted)?.studentId || "");
}

async function submitProjectRequestDecision(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  const action = cleanDirectoryFilter(event?.submitter?.value || "");
  if (!form || !["approve_request", "request_changes", "decline_request"].includes(action)) return;
  const data = new FormData(form);
  const requestId = cleanDirectoryFilter(data.get("requestId"));
  const feedback = String(data.get("feedback") || "").trim();
  const confirmImpact = data.get("confirmImpact") === "true";
  const approvalToken = String(data.get("approvalToken") || "").trim();
  if (action === "request_changes" && !feedback) {
    renderAppShell("Write a short note that tells the student what to change.", "error");
    return;
  }
  if (action === "approve_request" && !confirmImpact) {
    renderAppShell("Check the box after you review who and what will move.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, requestId, feedback, confirmImpact, approvalToken }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectRequestError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "projects";
    await loadWorkspaceData(result.body?.message || "Project idea updated.");
  } finally {
    busy = false;
  }
}

async function submitProjectInvitationResponse(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  const action = cleanDirectoryFilter(event?.submitter?.value || "");
  if (!form || !["accept_project_invitation", "decline_project_invitation"].includes(action)) return;
  const data = new FormData(form);
  const requestId = cleanDirectoryFilter(data.get("requestId"));
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, requestId }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectRequestError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "studentWork";
    await loadWorkspaceData(result.body?.message || "Your answer was saved.");
  } finally {
    busy = false;
  }
}

async function submitProjectApprovalUndo(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const requestId = cleanDirectoryFilter(data.get("requestId"));
  const changeReason = String(data.get("changeReason") || "").trim();
  const confirmImpact = data.get("confirmImpact") === "true";
  if (!changeReason || !confirmImpact) {
    renderAppShell("Write why, then check the box before undoing this approval.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "undo_project_approval", requestId, changeReason, confirmImpact }),
    }));
    if (!result.ok) {
      renderAppShell(messageForProjectRequestError(result.body?.error || result.error, result.status), "error");
      return;
    }
    activeSection = "projects";
    await loadWorkspaceData(result.body?.message || "Approval undone.");
  } finally {
    busy = false;
  }
}

function projectFormStudentIds(data, count = 5) {
  const selected = data.getAll("studentIds").map(cleanDirectoryFilter).filter(Boolean);
  const legacy = Array.from({ length: count }, (_, index) => cleanDirectoryFilter(data.get(`student${index + 1}`))).filter(Boolean);
  return [...new Set([...selected, ...legacy])].slice(0, count);
}

function messageForProjectRequestError(error, status) {
  if (error === "project_request_already_waiting") return "Your project idea is already waiting for a teacher.";
  if (error === "tagged_student_not_in_your_school") return "One teammate is not in your school. Choose another student.";
  if (error === "feedback_required") return "Write a short note that tells the student what to change.";
  if (error === "project_request_already_decided") return "Another staff member already answered this idea. Refresh the page.";
  if (error === "project_teammates_not_ready") return "Wait until every teammate joins before approving this project.";
  if (error === "project_adults_not_ready") return "Wait until the Mentor and Program Teacher both accept before approving this project.";
  if (error === "student_program_required") return "Your school must add your program before this project idea can be sent.";
  if (error === "tagged_students_need_same_program") return "Choose teammates from the same program for this project.";
  if (error === "project_approval_confirmation_required") return "Check the box after you review who and what will move.";
  if (error === "project_approval_preview_changed") return "Something changed. Review the new move summary, then approve again.";
  if (error === "project_invitation_not_found") return "This project invite is no longer available.";
  if (error === "project_owner_is_already_joined") return "You already joined because you sent this project idea.";
  if (error === "project_undo_reason_required") return "Write why this approval must be undone.";
  if (error === "project_undo_confirmation_required") return "Check the box before undoing this approval.";
  if (error === "project_rollback_membership_changed") return "This cannot be undone here because a student's project changed later. Ask a site admin to review it.";
  if (error === "project_rollback_missing_recovery_point") return "The old project record is missing, so this approval cannot be safely undone here.";
  if (error === "project_approval_cannot_be_undone") return "This approval was already changed and cannot be undone again.";
  if (status === 403) return "This account cannot change that project or group.";
  if (status === 401) return "Your sign-in ended. Sign in again, then try once more.";
  return "That project idea was not saved. Check the information and try again.";
}

function messageForCreateProjectError(error, status) {
  if (error === "project_needs_one_to_five_students") return "Choose one to five different students.";
  if (error === "project_adults_required") return "Choose a Mentor and Program Teacher before creating the project.";
  if (error === "mentor_not_eligible") return "Choose a Mentor who is active at this school.";
  if (error === "program_teacher_not_eligible") return "Choose a Program Teacher for this school and program.";
  if (error === "student_program_required") return "Add each student to a program before creating the project.";
  if (error === "project_students_need_same_program") return "Choose students from the same program for one project.";
  if (error === "project_adults_not_ready") return "Confirm the Mentor and Program Teacher before changing this project team.";
  if (error === "student_not_in_selected_school") return "One student is not in this school. Refresh the student list and try again.";
  if (error === "student_outside_your_scope" || status === 403) return "You cannot move one of these students. Ask a school admin for help.";
  if (status === 401) return "Your sign-in ended. Sign in again, then create the project.";
  return "The project was not created. Check the name and students, then try again.";
}

function messageForProjectAdultError(error, status) {
  if (status === 401) return "Your sign-in ended. Sign in again, then try once more.";
  if (status === 403) return "This account cannot change the people for that project.";
  if (error === "mentor_not_eligible" || error === "mentor_account_needs_school_mentor_access") return "Choose a Mentor who is active at this school.";
  if (error === "program_teacher_not_eligible") return "Choose the Program Teacher assigned to this project program.";
  if (error === "adult_already_confirmed") return "That person is already confirmed for this project.";
  if (error === "adult_invitation_already_waiting") return "That person already has an invite waiting.";
  if (error === "replacement_reason_required") return "Write why this confirmed person is being changed.";
  if (error === "mentor_name_and_email_required") return "Add the Mentor name and email.";
  if (error === "mentor_email_does_not_match_invite") return "Choose the Mentor account with the same email as the invite.";
  if (error === "adult_role_or_scope_changed") return "Your school role changed. Ask a school admin to check this invite.";
  if (error === "adult_invitation_already_answered") return "This invite was already answered. Refresh the page.";
  if (error === "project_or_request_not_found" || status === 404) return "This project setup is no longer available. Refresh the page.";
  return "The project people change was not saved. Check the choice and try again.";
}

async function submitMentorAssignment(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const studentId = cleanDirectoryFilter(data.get("studentId"));
  const mentorUserId = cleanDirectoryFilter(data.get("mentorUserId"));
  const reason = String(data.get("reason") || "").trim();
  const body = unwrap(currentData.mentorAssignments);
  const siteId = body?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  if (!siteId || !studentId || !mentorUserId || !reason) {
    renderAppShell("Choose a student, mentor, and assignment reason before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const result = await settleApi(apiJson("/api/site/mentor-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, studentId, mentorUserId, reason }),
    }));
    if (!result.ok) {
      activeSection = "mentorAssignments";
      renderAppShell(messageForMentorAssignmentError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await refreshConnectedSurfacesAfterMentorAssignment(studentId, siteId);
    await loadMentorAssignmentsResult(mentorAssignmentSuccessMessage());
  } finally {
    busy = false;
  }
}

function mentorAssignmentSuccessMessage() {
  return "Mentor assignment saved. Coverage list refreshed; confirm the student row now shows the active mentor.";
}

async function submitMentorMeeting(event) {
  event?.preventDefault?.();
  if (busy) return;
  const form = event?.currentTarget;
  if (!form) return;
  const data = new FormData(form);
  const studentId = cleanDirectoryFilter(data.get("studentId"));
  const status = cleanDirectoryFilter(data.get("status")) || "held";
  const purpose = data.get("purpose") ? cleanMentorMeetingPurpose(data.get("purpose")) : "";
  const notes = String(data.get("notes") || "").trim().slice(0, 1200);
  if (!studentId || !["held", "missed", "makeup_required"].includes(status) || !notes) {
    renderAppShell("Choose a meeting result and add notes before saving.", "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);
  try {
    const payload = { studentId, status, notes };
    if (purpose) payload.purpose = purpose;
    const result = await settleApi(apiJson("/api/mentor/meetings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
    if (!result.ok) {
      renderAppShell(messageForMentorMeetingError(result.body?.error || result.error, result.status), "error");
      return;
    }
    await refreshConnectedSurfacesAfterMentorMeeting(studentId);
    siteStudentDetailState = {
      ...siteStudentDetailState,
      activeTab: "work",
    };
    renderAppShell(mentorMeetingSuccessMessage(status), "success");
  } finally {
    busy = false;
  }
}

function mentorMeetingSuccessMessage(status = "") {
  const normalized = normalizeStatus(status);
  if (normalized === "missed") {
    return "Mentor meeting saved as missed. Student detail refreshed; schedule the make-up plan next.";
  }
  if (normalized === "makeup_required") {
    return "Make-up required saved. Student detail refreshed; confirm the new check-in plan with the student.";
  }
  return "Mentor meeting saved as held. Student detail refreshed; use the note for the next check-in.";
}

async function loadMentorAssignmentsResult(message = "") {
  const result = await settleApi(apiJson(`/api/site/mentor-assignments${siteMentorAssignmentQueryString()}`));
  currentData.mentorAssignments = result;
  activeSection = "mentorAssignments";
  if (shouldRestoreSiteStudentDetailFromUrlState(roleIds(currentUser), "mentorAssignments")) {
    await restoreSiteStudentDetailFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: message || "Student detail link restored.",
    });
    return;
  }
  renderAppShell(result.ok ? (message || "Mentor assignments loaded.") : "Mentor assignments unavailable.", result.ok ? "success" : "error");
}

async function loadOperationsReadinessResult(message = "") {
  const result = await settleApi(apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`));
  currentData.operationsReadiness = result;
  activeSection = "operations";
  if (shouldRestoreSiteStudentDetailFromUrlState(roleIds(currentUser), "operations")) {
    await restoreSiteStudentDetailFromUrlState({
      renderLoading: false,
      syncUrl: false,
      message: message || "Student detail link restored.",
    });
    return;
  }
  renderAppShell(result.ok ? (message || "Operations readiness loaded.") : "Operations readiness unavailable.", result.ok ? "success" : "error");
}

async function loadAdminAuditEventsResult(message = "") {
  const result = await settleApi(apiJson(`/api/admin/audit-events${adminAuditQueryString()}`));
  currentData.auditEvents = result;
  activeSection = "audit";
  renderAppShell(result.ok ? (message || "Audit loaded.") : "Audit unavailable.", result.ok ? "success" : "error");
}

async function refreshConnectedSurfacesAfterMentorMeeting(studentId) {
  const detail = unwrap(siteStudentDetailState.result);
  const siteId = selectedSiteQueryValue()
    || detail?.scope?.siteId
    || unwrap(currentData.siteStudents)?.scope?.siteId
    || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const refreshes = [];
  if (studentId) {
    refreshes.push(settleApi(apiJson(`/api/site/students/${encodeURIComponent(studentId)}${query}`)).then((result) => {
      if (result.ok) {
        siteStudentDetailState = {
          ...siteStudentDetailState,
          studentId,
          result,
          timelineResult: null,
        };
        currentData.siteStudentDetail = result;
      }
    }));
  }
  if (currentData.mentorDashboard) {
    refreshes.push(settleApi(apiJson("/api/mentor/dashboard")).then((result) => {
      currentData.mentorDashboard = result;
    }));
  }
  if (currentData.mentorAssigned) {
    refreshes.push(settleApi(apiJson("/api/mentor/assigned")).then((result) => {
      currentData.mentorAssigned = result;
    }));
  }
  await Promise.all(refreshes);
}

async function refreshConnectedSurfacesAfterMentorAssignment(studentId, siteId) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  const refreshes = [];
  if (currentData.siteDashboard) {
    refreshes.push(settleApi(apiJson(`/api/site/dashboard${query}`)).then((result) => {
      currentData.siteDashboard = result;
    }));
  }
  if (currentData.siteStudents) {
    refreshes.push(settleApi(apiJson(`/api/site/students${siteStudentQueryString()}`)).then((result) => {
      currentData.siteStudents = result;
    }));
  }
  if (siteStudentDetailState.studentId === studentId || unwrap(currentData.siteStudentDetail)?.scope?.studentId === studentId) {
    refreshes.push(settleApi(apiJson(`/api/site/students/${encodeURIComponent(studentId)}${query}`)).then((result) => {
      if (result.ok) {
        siteStudentDetailState = {
          ...siteStudentDetailState,
          result,
          timelineResult: null,
        };
        currentData.siteStudentDetail = result;
      }
    }));
  }
  if (currentData.operationsReadiness) {
    refreshes.push(settleApi(apiJson(`/api/site/operations-readiness${siteOperationsReadinessQueryString()}`)).then((result) => {
      currentData.operationsReadiness = result;
    }));
  }
  await Promise.all(refreshes);
}

async function handleSiteStudentAction(event) {
  const action = event?.currentTarget?.dataset?.siteStudentAction;
  if (!action) return;
  if (action === "view-detail") {
    const requestedSource = cleanWorkspaceSection(event.currentTarget?.dataset?.studentDetailSourceSection || "");
    const sourceSection = requestedSource || (activeSection === "adminDashboard" || activeSection === "programDashboard" || activeSection === "siteDashboard" || activeSection === "overview"
      ? activeSection
      : "students");
    await openSiteStudentDetail(event.currentTarget?.dataset?.studentDetailId || "", { sourceSection });
    return;
  }
  if (action === "reset-filters") {
    siteStudentFilters = defaultSiteStudentFilters();
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "students";
    syncSiteStudentUrlState({ clearFilters: true });
    await loadWorkspaceData("Student directory filters reset.");
    return;
  }
  if (action === "previous-page" || action === "next-page") {
    const directory = unwrap(currentData.siteStudents);
    const pagination = directory?.pagination || {};
    const limit = safeNumber(pagination.limit || siteStudentFilters.limit || 50);
    const offset = safeNumber(pagination.offset || siteStudentFilters.offset || 0);
    siteStudentFilters = {
      ...siteStudentFilters,
      limit,
      offset: action === "previous-page" ? Math.max(0, offset - limit) : offset + limit,
    };
    activeSection = "students";
    syncSiteStudentUrlState();
    await loadWorkspaceData("Student directory page updated.");
  }
}

async function openSiteStudentDetail(studentId, options = {}) {
  const selectedStudentId = cleanDirectoryFilter(studentId);
  if (!selectedStudentId) return;
  const directory = unwrap(currentData.siteStudents);
  const sourceSection = cleanWorkspaceSection(options.sourceSection) || "students";
  const requestedTab = cleanStudentDetailTab(options.activeTab);
  const siteId = selectedSiteQueryValue()
    || directory?.scope?.siteId
    || unwrap(currentData.siteDashboard)?.scope?.siteId
    || unwrap(currentData.operationsReadiness)?.scope?.siteId
    || unwrap(currentData.mentorAssignments)?.scope?.siteId
    || unwrap(currentData.reviewQueue)?.scope?.siteId
    || "";
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
  siteStudentDetailState = {
    ...defaultSiteStudentDetailState(),
    studentId: selectedStudentId,
    sourceSection,
    activeTab: requestedTab || "overview",
    loading: true,
  };
  activeSection = sourceSection;
  syncCurrentWorkspaceUrlState();
  requestSiteStudentDetailFocus();
  renderAppShell("Loading student detail...");
  const result = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(selectedStudentId)}${query}`));
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loading: false,
    result,
  };
  currentData.siteStudentDetail = result;
  requestSiteStudentDetailFocus();
  renderAppShell(result.ok ? "Student detail opened." : "Student detail unavailable.", result.ok ? "success" : "error");
}

async function handleSiteStudentDetailAction(event) {
  const action = event?.currentTarget?.dataset?.studentDetailAction;
  if (action === "close") {
    const sourceSection = cleanWorkspaceSection(siteStudentDetailState.sourceSection) || "students";
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = sourceSection;
    syncCurrentWorkspaceUrlState();
    renderAppShell();
    return;
  }
  if (action === "open-operations") {
    const studentId = cleanDirectoryFilter(event?.currentTarget?.dataset?.studentDetailOperationsStudentId || siteStudentDetailState.studentId);
    if (!studentId) return;
    operationsReadinessFilters = {
      ...defaultOperationsReadinessFilters(),
      studentId,
    };
    siteStudentDetailState = defaultSiteStudentDetailState();
    activeSection = "operations";
    syncOperationsReadinessUrlState();
    await loadOperationsReadinessResult("Showing operations rows for this student.");
  }
}

function cleanStudentDetailTab(value) {
  const requested = cleanDirectoryFilter(value);
  const aliases = {
    summary: "overview",
    progress: "work",
    submissions: "work",
    reviews: "feedback",
    mentor: "work",
    presentation: "work",
    archive: "work",
  };
  const normalized = aliases[requested] || requested;
  const allowedTabs = new Set(["overview", "work", "feedback", "evidence", "timeline"]);
  return allowedTabs.has(normalized) ? normalized : "";
}

function studentDetailReturnCopy(sourceSection) {
  const sectionId = cleanWorkspaceSection(sourceSection) || "students";
  const labels = {
    adminDashboard: "Admin Command Center",
    overview: "Today",
    siteDashboard: "Site Dashboard",
    students: "Students",
    teacher: "Review Work",
    mentorAssignments: "Mentor Assignments",
    mentorDashboard: "Mentor Dashboard",
    programDashboard: "Program Dashboard",
    operations: "Operations",
  };
  const label = labels[sectionId] || "Students";
  return {
    sectionId,
    label,
    buttonLabel: `Back to ${label}`,
    hint: sectionId === "overview"
      ? "Return to Today when you finish with this student."
      : sectionId === "students"
      ? "Return to the filtered student list when you finish with this student."
      : `Return to ${label} when you finish with this student.`,
  };
}

function cleanStudentDetailTimelineType(value) {
  const requested = normalizeStatus(value);
  return STUDENT_DETAIL_TIMELINE_TYPE_VALUES.has(requested) ? requested : "";
}

function studentDetailTimelineTypeLabel(value) {
  const normalized = cleanStudentDetailTimelineType(value);
  const match = STUDENT_DETAIL_TIMELINE_TYPES.find(([type]) => type === normalized);
  return match?.[1] || "All activity";
}

async function selectSiteStudentDetailTab(event) {
  const tab = cleanStudentDetailTab(event?.currentTarget?.dataset?.studentDetailTab);
  if (!tab || !siteStudentDetailState.studentId) return;
  siteStudentDetailState = {
    ...siteStudentDetailState,
    activeTab: tab,
    timelineType: tab === "timeline" ? siteStudentDetailState.timelineType : "",
  };
  syncCurrentWorkspaceUrlState();
  if (tab !== "timeline" || siteStudentDetailState.timelineResult || siteStudentDetailState.loadingTimeline) {
    renderAppShell();
    return;
  }
  await loadSiteStudentTimeline();
}

async function selectSiteStudentTimelineType(event) {
  if (!siteStudentDetailState.studentId) return;
  const timelineType = cleanStudentDetailTimelineType(event?.currentTarget?.dataset?.studentDetailTimelineType || "");
  if (siteStudentDetailState.activeTab === "timeline" && siteStudentDetailState.timelineType === timelineType && siteStudentDetailState.timelineResult) return;
  siteStudentDetailState = {
    ...siteStudentDetailState,
    activeTab: "timeline",
    timelineType,
    timelineResult: null,
  };
  syncCurrentWorkspaceUrlState();
  await loadSiteStudentTimeline();
}

async function loadSiteStudentTimeline(options = {}) {
  if (!siteStudentDetailState.studentId || siteStudentDetailState.loadingTimeline) {
    renderAppShell();
    return;
  }
  const detail = unwrap(siteStudentDetailState.result);
  const siteId = selectedSiteQueryValue() || detail?.scope?.siteId || unwrap(currentData.siteStudents)?.scope?.siteId || "";
  const params = new URLSearchParams();
  if (siteId) params.set("siteId", siteId);
  const timelineType = cleanStudentDetailTimelineType(siteStudentDetailState.timelineType || "");
  if (timelineType) params.set("type", timelineType);
  const query = params.toString() ? `?${params.toString()}` : "";
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loadingTimeline: true,
  };
  if (options.renderLoading !== false) renderAppShell("Loading student timeline...");
  const timelineResult = await settleApi(apiJson(`/api/site/students/${encodeURIComponent(siteStudentDetailState.studentId)}/timeline${query}`));
  siteStudentDetailState = {
    ...siteStudentDetailState,
    loadingTimeline: false,
    timelineResult,
  };
  currentData.siteStudentTimeline = timelineResult;
  renderAppShell(
    timelineResult.ok ? (options.successMessage || "Student timeline opened.") : (options.errorMessage || "Student timeline unavailable."),
    timelineResult.ok ? "success" : "error",
  );
}

function renderPresentationSection() {
  const result = currentData.presentationSlots;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Presentation schedule", "presentation day records");
  }
  const body = unwrap(result);
  const slots = body?.slots || [];
  const activeFilter = cleanPresentationSlotFilter(presentationSlotFilter);
  const filteredSlots = filterPresentationSlots(slots, activeFilter);
  const roles = roleIds(currentUser);
  const canManage = roles.has("program_teacher") || hasGlobalAdminRole(roles) || roles.has("site_admin");
  const studentView = primaryRoleForUser(currentUser) === "student";
  const dashboard = presentationDashboardModel(slots);
  return `
    <section class="workspace-command-center workspace-presentation-dashboard" data-presentation-schedule="true" data-presentation-filter="${escapeHtml(activeFilter)}" aria-labelledby="presentationDashboardTitle">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">${escapeHtml(studentView ? "Presentation plan" : "Presentation readiness")}</p>
          <h1 id="presentationDashboardTitle">${escapeHtml(studentView ? "Your Presentation" : "Presentation")}</h1>
          <p>${escapeHtml(studentView
            ? "Check your time, room, outline status, and what still needs attention before presentation day."
            : "Schedule, outline, check-in, and day-of readiness from presentation rows this account can see.")}</p>
        </div>
        <span class="workspace-chip">${filteredSlots.length} of ${slots.length} slot${slots.length === 1 ? "" : "s"}</span>
      </div>
      ${renderApiNotice(result)}
      ${renderDashboardKpis([
        { label: studentView ? "Ready to present" : "Presentation readiness", value: metricWithPercent(dashboard.ready, dashboard.total), detail: studentView ? "Scheduled with approved outline, or already checked in" : "Checked in or scheduled with approved outline", tone: "mentor" },
        { label: studentView ? "No time yet" : "Pending schedule", value: dashboard.pendingSchedule, detail: studentView ? "A presentation time is not listed yet" : "No schedule in visible slots", tone: dashboard.pendingSchedule ? "warning" : "mentor" },
        { label: studentView ? "Outline needs work" : "Outline pending", value: dashboard.outlinePending, detail: studentView ? "Outline is pending or needs revision" : "Pending or revision-needed outlines", tone: dashboard.outlinePending ? "warning" : "mentor" },
        { label: "Check-in needed", value: dashboard.checkInNeeded, detail: studentView ? "Presentation was checked out and still needs check-in" : "Checked out without check-in", tone: dashboard.checkInNeeded ? "danger" : "mentor" },
      ], { label: "Presentation top summary", className: "workspace-presentation-kpis" })}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderReadinessScoreCard(dashboard.score, dashboard.total, studentView ? "Presentation readiness" : "Presentation readiness score", dashboard.total ? `${dashboard.ready} of ${dashboard.total} presentation ${pluralize(dashboard.total, "row")} ready or complete.` : "No presentation time is listed yet.")}
        ${renderDashboardCard(studentView ? "What still needs attention" : "Presentation stage breakdown", studentView ? "Time, outline, check-in, and completion status" : "Ready, schedule, outline, check-in, and day-of status", renderStackedDistribution(dashboard.stages, studentView ? "Presentation attention breakdown" : "Presentation stage breakdown"))}
      </div>
      ${studentView ? renderStudentPresentationGuide(slots, dashboard) : ""}
      ${studentView ? renderStudentPresentationDayPlan(slots, dashboard) : ""}
      ${renderMentorPresentationPrepChecklist(slots, dashboard, roles)}
      ${renderPresentationSlotFilters(slots, activeFilter, { studentView })}
      <section class="workspace-dashboard-card">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">${escapeHtml(studentView ? "Your presentation rows" : "Needs action worklist")}</p>
            <h2>${escapeHtml(studentView ? "Time, Room, and Status" : "Schedule And Check-In")}</h2>
          </div>
        </div>
        <div class="workspace-list workspace-presentation-worklist">
        ${filteredSlots.length ? filteredSlots.map((slot) => renderPresentationSlotRow(slot, canManage, { studentView })).join("") : renderPresentationSlotsEmptyState(slots.length, activeFilter, { studentView })}
        </div>
      </section>
    </section>
  `;
}

function renderStudentPresentationDayPlan(slots = [], dashboard = {}) {
  const rows = Array.isArray(slots) ? slots : [];
  const focus = rows.find((slot) => slot.scheduledFor) || rows[0] || {};
  const scheduledCopy = focus.scheduledFor
    ? `${formatDate(focus.scheduledFor)}${focus.location ? ` in ${focus.location}` : ""}`
    : "Your time and room are not listed yet.";
  const outlineStatus = normalizeStatus(focus.outlineStatus || (rows.length ? "pending" : "not_scheduled"));
  const outlineReady = outlineStatus === "approved";
  const status = normalizeStatus(focus.status || "");
  const afterStatus = status === "checked_in" || status === "completed"
    ? "Presentation is marked complete."
    : dashboard.checkInNeeded
      ? "Staff still need to finish check-in for a checked-out presentation row."
      : "After presenting, check that this screen shows presented or checked in.";
  const steps = [
    {
      id: "before",
      tone: focus.scheduledFor && outlineReady ? "ready" : "warning",
      label: "Before",
      title: focus.scheduledFor ? "Know your time and outline" : "Wait for time, keep practicing",
      detail: `${scheduledCopy} Outline: ${statusText(outlineStatus)}.`,
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="student">Open My Work</button>`,
    },
    {
      id: "during",
      tone: "student",
      label: "During",
      title: "Show the work you finished",
      detail: "Use your approved outline and project Drive link from My Project. Do not use Presentation to replace missing work links.",
      actionHtml: "",
    },
    {
      id: "after",
      tone: dashboard.checkInNeeded ? "warning" : "mentor",
      label: "After",
      title: dashboard.checkInNeeded ? "Ask staff to finish check-in" : "Confirm it is recorded",
      detail: afterStatus,
      actionHtml: `<button class="workspace-link-button workspace-link-button-small" type="button" data-section="archive">Open Final Files</button>`,
    },
  ];
  return `
    <section class="workspace-student-presentation-plan" data-student-presentation-plan="true" aria-labelledby="studentPresentationDayPlanTitle">
      <div class="workspace-student-presentation-plan-head">
        <div>
          <p class="workspace-kicker">Presentation day plan</p>
          <h2 id="studentPresentationDayPlanTitle">Before, during, after</h2>
          <p>Use this order so presentation day does not turn into a guessing game.</p>
        </div>
      </div>
      <div class="workspace-student-presentation-plan-grid">
        ${steps.map((step) => `
          <article class="workspace-student-presentation-step ${escapeHtml(step.tone)}" data-student-presentation-step="${escapeHtml(step.id)}">
            <span>${escapeHtml(step.label)}</span>
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.detail)}</p>
            ${step.actionHtml ? `<div class="workspace-row-actions">${step.actionHtml}</div>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStudentPresentationGuide(slots = [], dashboard = {}) {
  const rows = Array.isArray(slots) ? slots : [];
  const focus = rows.find((slot) => slot.scheduledFor) || rows[0] || {};
  const timeCopy = focus.scheduledFor
    ? `${formatDate(focus.scheduledFor)}${focus.location ? ` in ${focus.location}` : ""}`
    : "Your time and room will appear here after staff schedule it.";
  const outlineStatus = statusText(focus.outlineStatus || (rows.length ? "pending" : "not_scheduled"));
  return `
    ${renderStudentPhaseDeliverableSnapshot("phase-3a", {
      id: "studentPresentationPhaseGoal",
      kicker: "Phase 3A deliverable",
      title: "What presentation day finishes",
      detail: "This screen helps with your presentation. It does not replace missing checklist Drive links or your teacher check.",
      currentLabel: "Presentation screen",
      dataAttrs: 'data-student-presentation-phase-goal="true"',
    })}
    ${renderTaskFinishChecklist("student-presentation", "Before presentation day", [
      ["Know when and where", timeCopy, focus.scheduledFor ? "ready" : "needs_review"],
      ["Check your outline", `Outline status: ${outlineStatus}. Fix outline feedback before presentation day.`, normalizeStatus(focus.outlineStatus) === "approved" ? "ready" : "needs_review"],
      ["Open project link", "Your approved outline and project Drive link should match the checklist work in My Project.", "context"],
      ["After you present", dashboard.checkInNeeded ? "Staff still need to finish check-in for a checked-out presentation row." : "Completion or check-in status appears here after presentation day.", dashboard.checkInNeeded ? "needs_review" : "context"],
    ], {
      detail: "Presentation is about showing your work. It does not replace missing checklist Drive links or your teacher check.",
      badge: "Presentation checks",
      state: dashboard.checkInNeeded ? "needs_review" : dashboard.outlinePending || dashboard.pendingSchedule ? "pending" : "ready",
    })}
  `;
}

function renderMentorPresentationPrepChecklist(slots = [], dashboard = {}, roles = roleIds(currentUser)) {
  if (!roles.has("mentor")) return "";
  const rows = Array.isArray(slots) ? slots : [];
  const focus = rows.find((slot) => ["pending", "revision_needed", "outline_pending", "outline_revision_needed"].includes(normalizeStatus(slot.outlineStatus)))
    || rows.find((slot) => !slot.scheduledFor)
    || rows.find((slot) => slot.status === "scheduled")
    || rows[0]
    || {};
  return `
    <section class="workspace-mentor-presentation-prep" data-mentor-presentation-prep="true">
      <div>
        <strong>Mentor presentation prep</strong>
        <p>Use this for assigned students only. Program Teachers still approve phase movement and outline readiness.</p>
      </div>
      <div class="workspace-mentor-plan-grid">
        <article>
          <span>1. Confirm outline</span>
          <b>${escapeHtml(statusText(focus.outlineStatus || "pending"))}</b>
        </article>
        <article>
          <span>2. Confirm schedule</span>
          <b>${escapeHtml(focus.scheduledFor ? formatDate(focus.scheduledFor) : "No scheduled slot yet")}</b>
        </article>
        <article>
          <span>3. Practice next</span>
          <b>${escapeHtml(dashboard.checkInNeeded ? "Check in borrowed materials or presentation status." : "Practice the approved presentation and questions.")}</b>
        </article>
      </div>
    </section>
  `;
}

function presentationDashboardModel(slots = []) {
  const rows = Array.isArray(slots) ? slots : [];
  const total = rows.length;
  const checkedIn = rows.filter((slot) => slot.status === "checked_in" || slot.status === "completed").length;
  const scheduledApproved = rows.filter(isReadyForPresentationCheckOut).length;
  const checkedOut = rows.filter((slot) => slot.status === "checked_out").length;
  const outlinePending = rows.filter((slot) => ["pending", "revision_needed", "outline_pending", "outline_revision_needed"].includes(normalizeStatus(slot.outlineStatus))).length;
  const pendingSchedule = rows.filter((slot) => !slot.scheduledFor).length;
  const ready = checkedIn + scheduledApproved;
  const score = total ? clampPercent((ready / total) * 100) : null;
  return {
    total,
    ready,
    score,
    pendingSchedule,
    outlinePending,
    checkInNeeded: checkedOut,
    stages: [
      { label: "Ready or complete", value: ready, tone: "mentor" },
      { label: "Pending schedule", value: pendingSchedule, tone: "warning" },
      { label: "Outline pending", value: outlinePending, tone: "warning" },
      { label: "Check-in needed", value: checkedOut, tone: "danger" },
      { label: "Other scheduled", value: Math.max(0, total - ready - pendingSchedule - outlinePending - checkedOut), tone: "teacher" },
    ].filter((item) => safeNumber(item.value) > 0),
  };
}

function renderPresentationSlotFilters(slots = [], activeFilter = "all", options = {}) {
  const studentView = Boolean(options.studentView);
  const filters = [
    ["all", "All", slots.length],
    ["scheduled", studentView ? "Ready to present" : "Ready for check-out", slots.filter(isReadyForPresentationCheckOut).length],
    ["checked_out", studentView ? "Checked out by staff" : "Checked out", slots.filter((slot) => slot.status === "checked_out").length],
    ["checked_in", studentView ? "Presented / checked in" : "Checked in", slots.filter((slot) => slot.status === "checked_in" || slot.status === "completed").length],
    ["outline_follow_up", studentView ? "Outline needs work" : "Outline follow-up", slots.filter((slot) => ["pending", "revision_needed"].includes(String(slot.outlineStatus || ""))).length],
  ];
  return `
    <div class="workspace-filter-bar workspace-presentation-filters" data-presentation-filters="true" aria-label="Presentation schedule filters">
      ${filters.map(([filter, label, count]) => `
        <button class="workspace-button ${activeFilter === filter ? "workspace-button-primary" : "workspace-button-secondary"}" type="button" data-presentation-filter-action="${escapeHtml(filter)}" aria-pressed="${activeFilter === filter ? "true" : "false"}">
          ${escapeHtml(label)} (${escapeHtml(count)})
        </button>
      `).join("")}
    </div>
  `;
}

function filterPresentationSlots(slots = [], activeFilter = "all") {
  const filter = cleanPresentationSlotFilter(activeFilter);
  if (filter === "all") return slots;
  return slots.filter((slot) => presentationSlotMatchesFilter(slot, filter));
}

function presentationSlotMatchesFilter(slot, filter) {
  if (filter === "scheduled") return isReadyForPresentationCheckOut(slot);
  if (filter === "checked_out") return slot?.status === "checked_out";
  if (filter === "checked_in") return slot?.status === "checked_in" || slot?.status === "completed";
  if (filter === "outline_follow_up") return ["pending", "revision_needed"].includes(String(slot?.outlineStatus || ""));
  return true;
}

function isReadyForPresentationCheckOut(slot) {
  return slot?.status === "scheduled" && normalizeStatus(slot?.outlineStatus) === "approved";
}

function renderPresentationSlotsEmptyState(totalSlots, activeFilter, options = {}) {
  const studentView = Boolean(options.studentView);
  if (safeNumber(totalSlots) > 0 && activeFilter !== "all") {
    return `
      <section class="workspace-empty-state-card" data-presentation-state="filter-empty">
        <strong>No presentation slots match this filter.</strong>
        <p>${escapeHtml(studentView ? "Clear the filter to see every presentation row listed for you." : "Clear the filter to review the full presentation schedule for this account.")}</p>
        <button class="workspace-link-button workspace-link-button-small" type="button" data-presentation-filter-action="all">${escapeHtml(studentView ? "Show all presentation rows" : "Show all slots")}</button>
      </section>
    `;
  }
  return `
    <section class="workspace-empty-state-card" data-presentation-state="empty">
      <strong>${escapeHtml(studentView ? "No presentation time is listed yet." : "No presentation slots scheduled yet.")}</strong>
      <p>${escapeHtml(studentView ? "Keep working in My Work until your Program Teacher or staff schedule your presentation." : "Presentation slots will appear here after authorized staff schedule them for visible students.")}</p>
    </section>
  `;
}

function renderArchiveSection() {
  const result = currentData.archiveReadiness;
  if (result?.status === 403) {
    return renderPermissionDeniedSection("Final files", "student final-file records");
  }
  const body = unwrap(result);
  if (!body) {
    return `
      <section class="workspace-card workspace-error-card">
        <h2>Final files unavailable</h2>
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
  const archiveDownloadUrl = scopedDownloadReady ? cleanWorkspaceArchiveDownloadUrl(archive.downloadUrl) : "";
  const drivePackageStatus = archive.drivePackageReady || storage.drivePackageReady ? "ready" : "pending";
  const downloadMessage = studentArchiveDownloadStatusCopy(archive, storage);
  const dashboard = studentArchiveDashboardModel(body);
  return `
    <section class="workspace-command-center workspace-archive-dashboard" data-archive-status="${escapeHtml(archive.status || "unknown")}" aria-labelledby="archiveDashboardTitle">
      <div class="workspace-command-hero">
        <div>
          <p class="workspace-kicker">Final files</p>
          <h1 id="archiveDashboardTitle">Download and Keep</h1>
          <p>${escapeHtml(studentFinalFilesCopy(archive.message, "Before May 5, make sure your important Senior Project files can be downloaded and kept in your personal files."))}</p>
        </div>
        ${studentStatusPill(summary.archiveAvailableToRequest ? "ready" : archive.status || "not_requested")}
      </div>
      ${renderDashboardKpis([
        { label: "Files ready", value: metricWithPercent(dashboard.readyChecks, dashboard.totalChecks), detail: "Final checks ready", tone: "mentor" },
        { label: "Needs action", value: metricWithPercent(dashboard.needsAction, dashboard.totalChecks), detail: "Checks still missing or blocked", tone: dashboard.needsAction ? "warning" : "mentor" },
        { label: "Download status", value: statusText(archive.status || "not_requested"), detail: downloadMessage, tone: archive.status === "failed" ? "danger" : "admin" },
        { label: "Staff setup", value: storage.credentialsConfigured ? "Ready" : "Setup needed", detail: storage.credentialsConfigured ? "Staff download setup is ready" : "Staff must finish download setup before downloads are ready", tone: storage.credentialsConfigured ? "mentor" : "danger" },
        { label: "Save-by window", value: retention.downloadExpiresSoon ? "Expiring soon" : `${retention.downloadWindowDays || 14} days`, detail: retention.policyReviewRequired ? "School download rule needs review" : "Time to save a ready download", tone: retention.downloadExpiresSoon ? "warning" : "admin" },
      ], { label: "Final files top summary", className: "workspace-archive-kpis" })}
      <div class="workspace-dashboard-grid workspace-dashboard-grid-two workspace-dashboard-support-grid">
        ${renderReadinessScoreCard(dashboard.score, dashboard.totalChecks, "Final files readiness score", dashboard.totalChecks ? `${dashboard.readyChecks} of ${dashboard.totalChecks} final checks are ready.` : "No final-file checks assigned yet.")}
        ${renderDashboardCard("What affects your download", "Ready checks, missing checks, staff setup, and save-by window", renderStackedDistribution(dashboard.distribution, "Final files status"))}
      </div>
      ${renderStudentPhaseDeliverableSnapshot("finish", {
        id: "studentFinalFilesPhaseGoal",
        kicker: "Finish deliverable",
        title: "What final files finishes",
        detail: "This screen helps you save your final Senior Project files somewhere you can keep after school account access changes.",
        currentLabel: "Final files screen",
        dataAttrs: 'data-student-final-files-phase-goal="true"',
      })}
      ${renderStudentArchiveGuidance(body)}
      ${renderStudentArchiveFinishChecklist(body)}
      <section class="workspace-dashboard-card">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Final checklist</p>
            <h2>What to Finish Before Download</h2>
          </div>
          <span class="workspace-chip">Final-file list</span>
        </div>
        ${renderApiNotice(result)}
        <div class="workspace-list workspace-archive-worklist">
          ${checks.length ? checks.map(renderArchiveCheckRow).join("") : `<div class="workspace-empty">Final-file checks will appear after your Program Teacher adds them.</div>`}
        </div>
      </section>
      <section class="workspace-dashboard-card">
        <div class="workspace-card-head">
          <div>
            <p class="workspace-kicker">Download setup</p>
            <h2>Download</h2>
          </div>
          ${studentStatusPill(storage.credentialsConfigured ? "configured" : "needs_staff_action")}
        </div>
        <div class="workspace-worklist workspace-archive-status-worklist">
          ${renderArchiveStatusRow("Download status", downloadMessage, archive.status || "not_requested", archiveDownloadUrl ? `<a class="workspace-link-button workspace-link-button-small" data-archive-download="manifest" href="${escapeHtml(archiveDownloadUrl)}">Download file list</a>` : "")}
          ${renderArchiveStatusRow("Privacy guard", "Private file details stay hidden from this workspace.", storage.storageIdentifiersRedacted ? "ready" : "needs_review")}
          ${renderArchiveStatusRow("Saved download file", drivePackageStatus === "ready" ? "Your final file set is stored for protected download." : "Your final file set appears after staff prepares it and download setup is ready.", drivePackageStatus, "", `data-archive-drive-package="${escapeHtml(drivePackageStatus)}"`)}
          ${renderArchiveStatusRow("Save-by window", retention.policyReviewRequired ? "School download rules still need review." : `Downloads stay available for ${retention.downloadWindowDays || 14} days.`, retention.downloadExpiresSoon ? "expiring_soon" : retention.policyStatus || "policy_review_required", "", `data-archive-retention-status="${escapeHtml(retention.policyStatus || "unknown")}"`)}
        </div>
      </section>
    </section>
  `;
}

function cleanWorkspaceArchiveDownloadUrl(value) {
  const trimmed = String(value || "").trim();
  return /^\/api\/exports\/[^/?#]+\/download$/.test(trimmed) ? trimmed : "";
}

function studentArchiveDashboardModel(body = {}) {
  const checks = archiveReadinessChecks(body);
  const summary = body.summary || {};
  const archive = body.archive || {};
  const storage = body.storage || {};
  const retention = body.retention || {};
  const totalChecks = safeNumber(summary.totalChecks || checks.length);
  const readyChecks = safeNumber(summary.readyChecks || checks.filter((check) => normalizeStatus(check.status) === "ready").length);
  const needsAction = Math.max(0, safeNumber(summary.missingChecks || totalChecks - readyChecks));
  const score = totalChecks ? clampPercent((readyChecks / totalChecks) * 100) : null;
  return {
    totalChecks,
    readyChecks,
    needsAction,
    score,
    distribution: [
      { label: "Ready checks", value: readyChecks, tone: "mentor" },
      { label: "Needs action", value: needsAction, tone: "warning" },
      { label: "Download prep failed", value: normalizeStatus(archive.status) === "failed" ? 1 : 0, tone: "danger" },
      { label: "Download prep in progress", value: ["queued", "running", "in_progress"].includes(normalizeStatus(archive.status)) ? 1 : 0, tone: "admin" },
      { label: "Staff setup needed", value: storage.credentialsConfigured === false ? 1 : 0, tone: "danger" },
      { label: "Expiring soon", value: retention.downloadExpiresSoon ? 1 : 0, tone: "warning" },
    ].filter((item) => safeNumber(item.value) > 0),
  };
}

function renderArchiveStatusRow(label, detail, status, actionHtml = "", extraAttrs = "") {
  return `
    <article class="workspace-worklist-row" ${extraAttrs}>
      <div>
        <span class="workspace-worklist-label">Final files item</span>
        <strong>${escapeHtml(label || "Final files status")}</strong>
      </div>
      <div>
        <span class="workspace-worklist-label">Context</span>
        <span>${escapeHtml(detail || "Review final files status.")}</span>
      </div>
      <div>
        <span class="workspace-worklist-label">Status</span>
        ${studentStatusPill(status)}
      </div>
      <div class="workspace-worklist-action">
        ${actionHtml || `<span class="workspace-summary-badge">Summary only</span>`}
      </div>
    </article>
  `;
}

function studentArchiveDownloadStatusCopy(archive = {}, storage = {}) {
  const archiveStatus = String(archive.status || "not_requested");
  const scopedDownloadReady = Boolean(archive.scopedDownloadReady || archive.signedDownloadReady);
  if (archive.downloadExpired) return "The previous download window expired. Ask staff to prepare a fresh download.";
  if (scopedDownloadReady) {
    return archive.downloadExpiresAt
      ? `Your download is ready until ${formatDate(archive.downloadExpiresAt)}.`
      : "Your download is ready.";
  }
  if (archive.downloadExpiresSoon) return "The download window is ending soon, but the download is not available in this view.";
  if (archiveStatus === "queued" || archiveStatus === "running") return "Staff are preparing your final files.";
  if (archiveStatus === "failed") return "Staff need to fix your final-file download.";
  if (storage.credentialsConfigured === false || (storage.providerStatus && storage.providerStatus !== "ready" && storage.providerStatus !== "configured")) {
    return "Staff setup is needed before downloads are ready.";
  }
  return "Your download is not ready yet.";
}

function studentFinalFilesCopy(value, fallback = "") {
  return String(value || fallback || "")
    .replace(/\bfinal file package\b/gi, "final-file download")
    .replace(/\bfinal-file package\b/gi, "final-file download")
    .replace(/\bpackage preparation\b/gi, "download setup")
    .replace(/\bpackage request\b/gi, "download request")
    .replace(/\bpackage\b/gi, "download");
}

function renderStudentArchiveGuidance(body) {
  const guidance = studentArchiveGuidance(body);
  return `
    <section class="workspace-dashboard-card workspace-student-archive-guidance" data-archive-guidance="true" data-archive-guidance-status="${escapeHtml(guidance.status)}" aria-labelledby="studentArchiveGuidanceTitle">
      <div class="workspace-card-head">
        <div>
          <p class="workspace-kicker">Final files next step</p>
          <h2 id="studentArchiveGuidanceTitle">${escapeHtml(guidance.title)}</h2>
          <p>${escapeHtml(guidance.detail)}</p>
        </div>
        ${studentStatusPill(guidance.status === "provider_unavailable" ? "needs_staff_action" : guidance.status)}
      </div>
      <div class="workspace-student-action-focus">
        <strong>${escapeHtml(guidance.owner)}</strong>
        <span>${escapeHtml(guidance.when)}</span>
      </div>
    </section>
  `;
}

function renderStudentArchiveFinishChecklist(body = {}) {
  const guidance = studentArchiveGuidance(body);
  const status = normalizeStatus(guidance.status);
  const downloadReady = status === "ready" && /download/i.test(guidance.title || "");
      const failedOrStorage = ["failed", "provider_unavailable", "setup_needed"].includes(status);
  const items = downloadReady
    ? [
        ["Download while the window is open", guidance.when || "Use the available download link before it expires.", "ready"],
        ["Check the file list", "Make sure the download includes the final files you expected before you leave the screen.", "context"],
        ["Keep a personal copy", "Save important Senior Project files outside your school account before account access closes.", "needs_review"],
      ]
    : failedOrStorage
      ? [
          ["Read the staff-support message", guidance.detail || "Staff need to fix your final-file download.", "needs_staff_action"],
          ["Do not retry from this screen", "This student view does not create a new download request.", "blocked"],
          ["Use the checklist below", "If a final check asks for a file, use a secure link when uploads are not working.", "context"],
        ]
      : [
          ["Start with the first missing check", "Use What to Finish Before Download before asking for final files.", "ready"],
          ["Match file to the check", "Add a file or link only when the check below says it is missing or needs attention.", "needs_review"],
          ["Wait for staff to prepare the download", "A download appears only after staff prepares the final files.", "context"],
        ];
  return renderTaskFinishChecklist("student-final-files", "Before you save final files", items, {
    detail: "Use these checks before downloading, asking staff for final files, or adding a final-file link.",
    badge: "Final-file checks",
    state: guidance.status,
  });
}

function studentArchiveProgressFact(body) {
  const checks = archiveReadinessChecks(body);
  const summary = body?.summary || {};
  if (!checks.length && !safeNumber(summary.totalChecks)) return "";
  const guidance = studentArchiveGuidance(body);
  return `${guidance.title}. ${guidance.when}`;
}

function studentArchiveGuidance(body) {
  const checks = archiveReadinessChecks(body);
  const summary = body?.summary || {};
  const archive = body?.archive || {};
  const storage = body?.storage || {};
  const totalChecks = safeNumber(summary.totalChecks || checks.length);
  const readyChecks = safeNumber(summary.readyChecks);
  const progressText = totalChecks
    ? `${readyChecks} of ${totalChecks} final checks ready.`
    : "Final checks will appear after they are assigned.";
  const archiveStatus = String(archive.status || "not_requested");
  const scopedDownloadReady = Boolean(archive.scopedDownloadReady || archive.signedDownloadReady);

  if (archive.downloadExpired) {
    return {
      status: "expired",
      title: "Ask for a fresh download",
      detail: "The previous download window expired. Ask your Program Teacher or administrator to prepare a fresh download.",
      owner: "Staff support",
      when: "No new proof is needed unless a check below changed.",
    };
  }

  if (scopedDownloadReady) {
    return {
      status: "ready",
      title: "Your download is ready",
      detail: "Use the download link below before the window expires.",
      owner: "Your action",
      when: archive.downloadExpiresAt ? `Download by ${formatDate(archive.downloadExpiresAt)}.` : "Download when you are ready.",
    };
  }

  if (archiveStatus === "queued" || archiveStatus === "running") {
    return {
      status: archiveStatus,
      title: "Staff are preparing your final files",
      detail: `${progressText} No extra file or link is needed right now.`,
      owner: "Staff support",
      when: "Check back after staff finish preparing it.",
    };
  }

  const blockingCheck = firstArchiveBlockingCheck(checks);
  if (blockingCheck) {
    return {
      status: blockingCheck.status || "missing",
      title: `Finish ${blockingCheck.label || "one final check"}`,
      detail: `${progressText} ${archiveGuidanceDetailForCheck(blockingCheck)}`,
      owner: blockingCheck.status === "attention_required" ? "Ask your Program Teacher" : "Your action",
      when: `Proof matched: ${safeNumber(blockingCheck.evidenceCount)}`,
    };
  }

  if (archiveStatus === "failed") {
    return {
      status: "failed",
      title: "Staff need to review your final files",
      detail: `${progressText} Your final-file download did not finish. Your checklist can still be reviewed while staff follow up.`,
      owner: "Staff support",
      when: "No retry action is needed from you right now.",
    };
  }

  if (summary.archiveAvailableToRequest) {
    return {
      status: "ready",
      title: "Final checks are ready",
      detail: `${progressText} Ask your teacher or school staff to prepare your May 5 download.`,
      owner: "Staff support",
      when: "Your checklist is ready for staff review.",
    };
  }

  if (storage.credentialsConfigured === false || (storage.providerStatus && storage.providerStatus !== "ready" && storage.providerStatus !== "configured")) {
    return {
      status: "provider_unavailable",
      title: "Staff need to finish download setup",
      detail: `${progressText} Downloads are not ready yet, but your checklist can still be reviewed with secure links or existing files.`,
      owner: "Staff support",
      when: "Use secure links for checklist work. Staff own download setup.",
    };
  }

  return {
    status: archiveStatus,
    title: "Review your final checklist",
    detail: `${progressText} Use the checklist below to see what is ready and what still needs a file or teacher review.`,
    owner: "Your action",
    when: "Start with any check that is not ready.",
  };
}

function archiveReadinessChecks(body) {
  return Array.isArray(body?.checks) ? body.checks : [];
}

function firstArchiveBlockingCheck(checks) {
  for (const status of ["missing", "in_progress", "attention_required"]) {
    const match = checks.find((check) => check?.status === status);
    if (match) return match;
  }
  return null;
}

function archiveGuidanceDetailForCheck(check) {
  const message = check.message || "Review this final check.";
  if (check.status === "attention_required") {
    return studentInstructionCopy(`${message} Ask your Program Teacher whether this applies to your project.`);
  }
  if (check.status === "in_progress") {
    return studentInstructionCopy(`${message} Add or update proof if your Program Teacher asked for more.`);
  }
  return studentInstructionCopy(`${message} Add the missing work or ask your teacher what to add.`);
}

function renderArchiveCheckRow(check) {
  return `
    <article class="workspace-row" data-archive-check="${escapeHtml(check.id)}" data-archive-check-status="${escapeHtml(check.status || "unknown")}">
      <div>
        <strong>${escapeHtml(check.label || "Final check")}</strong>
        <p>${escapeHtml(check.message || "Review this final check.")}</p>
        <p class="workspace-muted">${escapeHtml(check.evidenceCount || 0)} proof item${Number(check.evidenceCount || 0) === 1 ? "" : "s"} matched to this check.</p>
      </div>
      ${studentStatusPill(check.status)}
    </article>
  `;
}

function renderPresentationSlotRow(slot, canManage, options = {}) {
  const status = String(slot.status || "unknown");
  const studentView = Boolean(options.studentView);
  return `
    <article class="workspace-worklist-row workspace-presentation-row" data-presentation-state="${escapeHtml(status)}">
      <div>
        <span class="workspace-worklist-label">${escapeHtml(studentView ? "Your time" : "Student")}</span>
        <strong>${escapeHtml(slot.studentName || "Your presentation")}</strong>
        <small>${escapeHtml(formatDate(slot.scheduledFor))}</small>
      </div>
      <div>
        <span class="workspace-worklist-label">${escapeHtml(studentView ? "Room and length" : "Location")}</span>
        <span>${escapeHtml(slot.durationMinutes || 15)} min / ${escapeHtml(slot.location || "Location pending")}</span>
      </div>
      <div>
        <span class="workspace-worklist-label">Outline status</span>
        <span>${escapeHtml(statusText(slot.outlineStatus || "pending"))}</span>
      </div>
      <div>
        <span class="workspace-worklist-label">${escapeHtml(studentView ? "After presentation" : "Check-in")}</span>
        <span>${escapeHtml(presentationTimestampSummary(slot).replace(/^ \/ /, "") || (studentView ? "Check-in appears after presentation day" : "No check-in timestamp"))}</span>
      </div>
      <div>
        <span class="workspace-worklist-label">Status</span>
        ${studentView ? studentStatusPill(status) : statusPill(status)}
      </div>
      <div class="workspace-presentation-actions workspace-worklist-action">
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
  if (slot.status === "scheduled" && isReadyForPresentationCheckOut(slot)) {
    return `<button class="workspace-button workspace-button-primary" type="button" data-presentation-action="check-out" data-slot-id="${escapeHtml(slot.id)}">Check out</button>`;
  }
  if (slot.status === "scheduled") {
    return `<span class="workspace-muted" data-presentation-action-state="outline-follow-up">Outline approval needed</span>`;
  }
  if (slot.status === "checked_out") {
    return `<button class="workspace-button workspace-button-secondary" type="button" data-presentation-action="check-in" data-slot-id="${escapeHtml(slot.id)}">Check in</button>`;
  }
  return "";
}

function handlePresentationFilterAction(event) {
  presentationSlotFilter = cleanPresentationSlotFilter(event?.currentTarget?.dataset?.presentationFilterAction || "all");
  activeSection = "presentation";
  syncPresentationScheduleUrlState({ clearFilters: presentationSlotFilter === "all" });
  renderAppShell();
}

function renderPermissionDeniedSection(title, detail) {
  return `
    <section class="workspace-card workspace-error-card" data-workspace-state="permission-denied">
      <p class="workspace-kicker">Access needed</p>
      <h2>Access to ${escapeHtml(title)} is limited</h2>
      <p>
        This account cannot open this section right now.
        Use another assigned account or ask the project coordinator to update access.
      </p>
      ${renderProblemState({
        reason: `This account is not assigned to ${detail}.`,
        owner: "Project coordinator or site administrator.",
        nextAction: "Request the correct role or switch to an assigned account.",
      })}
    </section>
  `;
}

async function attachEvidenceLink(event) {
  event.preventDefault();
  if (isViewAsStudentActive()) {
    renderAppShell("Student preview is read-only. Proof links cannot be attached from this mode.", "error");
    return;
  }
  if (busy) return;
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const validationMessage = validateEvidenceLinkValues(values);
  const externalUrl = cleanWorkspaceGoogleWorkUrl(values.url);
  if (validationMessage || !externalUrl) {
    renderAppShell(validationMessage || messageForEvidenceError("google_drive_link_required"), "error");
    return;
  }
  busy = true;
  setFormBusy(form, true);

  try {
    const response = await fetch(`/api/submissions/${encodeURIComponent(values.submissionId)}/evidence`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        title: values.title,
        url: externalUrl,
        artifactType: values.artifactType,
      }),
    });
    const body = await safeJson(response);
    if (!response.ok) {
      renderAppShell(messageForEvidenceError(body?.error, response.status), "error");
      return;
    }
    await loadWorkspaceData("Work link saved. Your teacher can now review it.");
    openStudentProofReceipt("Work link saved. Files list opened so you can confirm it is on the right work item.", {
      proofKind: "link",
      submissionId: values.submissionId,
      title: values.title,
    });
  } catch (error) {
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    busy = false;
  }
}

function validateEvidenceLinkValues(values = {}) {
  if (!String(values.submissionId || "").trim()) return "Choose the work item this link belongs to.";
  if (!String(values.title || "").trim()) return "Add a short title for this link.";
  const linkProblem = evidenceLinkValidationProblem(values.url);
  if (linkProblem) return messageForEvidenceError(linkProblem);
  return "";
}

function cleanWorkspaceHttpsUrl(value) {
  const url = parseWorkspaceHttpsUrl(value);
  if (!url || workspaceProofLinkLooksUnsafe(url)) return "";
  return url.toString();
}

function evidenceLinkValidationProblem(value) {
  const url = parseWorkspaceHttpsUrl(value);
  if (!url) return "invalid_https_evidence_url";
  if (workspaceProofLinkLooksUnsafe(url)) return "unsafe_evidence_url";
  if (!isGoogleDriveWorkUrl(url)) return "google_drive_link_required";
  return "";
}

function cleanWorkspaceGoogleWorkUrl(value) {
  const url = parseWorkspaceHttpsUrl(value);
  if (!url || workspaceProofLinkLooksUnsafe(url) || !isGoogleDriveWorkUrl(url)) return "";
  return url.toString();
}

function isGoogleDriveWorkUrl(url) {
  const hostname = String(url?.hostname || "").toLowerCase();
  return hostname === "drive.google.com" || hostname === "docs.google.com";
}

function cleanWorkspaceGoogleDriveFolderUrl(value) {
  const url = parseWorkspaceHttpsUrl(value);
  if (!url || url.hostname.toLowerCase() !== "drive.google.com") return "";
  return /^\/drive\/(?:u\/\d+\/)?folders\/[A-Za-z0-9_-]+\/?$/i.test(url.pathname) ? url.toString() : "";
}

function parseWorkspaceHttpsUrl(value) {
  const trimmed = String(value || "").trim();
  if (trimmed.length > WORKSPACE_PROOF_LINK_MAX_LENGTH) return null;
  try {
    const url = new URL(trimmed);
    const normalized = url.toString();
    if (
      url.protocol !== "https:"
      || !url.hostname.includes(".")
      || url.username
      || url.password
      || normalized.length > WORKSPACE_PROOF_LINK_MAX_LENGTH
    ) return null;
    return url;
  } catch {
    return null;
  }
}

function workspaceProofLinkLooksUnsafe(url) {
  const hostname = String(url?.hostname || "").toLowerCase();
  const pathAndQuery = `${url?.pathname || ""} ${url?.search || ""}`.toLowerCase();
  const fullText = `${hostname} ${pathAndQuery}`;
  const credentialIntent = /(credential|password|passcode|login|signin|sign-in|verify|verification|reset|token|auth)/i.test(fullText);
  const targetIntent = /(google|drive|workspace|school|student|account|email|microsoft|office|dropbox|onedrive)/i.test(fullText);
  const deceptiveHost = /(google|drive|microsoft|office|dropbox|onedrive|school|student)[-_.]?(login|verify|password|account)|(?:login|verify|password|account)[-_.]?(google|drive|microsoft|office|dropbox|onedrive|school|student)/i.test(hostname);
  return Boolean(deceptiveHost || (credentialIntent && targetIntent));
}

async function uploadEvidenceFile(event) {
  event.preventDefault();
  if (isViewAsStudentActive()) {
    renderAppShell("Student preview is read-only. Files cannot be uploaded from this mode.", "error");
    return;
  }
  if (busy) return;
  const form = event.currentTarget;
  const attempt = buildUploadAttemptFromForm(form);
  let validationMessage = validateUploadAttempt(attempt);
  if (!validationMessage) {
    validationMessage = await validateWorkspaceUploadFileSignature(attempt.file);
  }

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

async function handleUploadFileSelected(event) {
  const input = event.currentTarget;
  const file = input?.files?.[0] || null;
  if (!file) {
    lastUploadAttempt = null;
    updateUploadState({
      state: "idle",
      progress: 0,
      message: "Choose a file to upload as proof.",
      fileName: "",
      fileSize: 0,
      retryReady: false,
    });
    return;
  }

  let validationMessage = validateWorkspaceUploadFile(file);
  if (!validationMessage) {
    validationMessage = await validateWorkspaceUploadFileSignature(file);
    if (input?.files?.[0] !== file) return;
  }
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
  if (isViewAsStudentActive()) {
    renderAppShell("Student preview is read-only. Files cannot be uploaded from this mode.", "error");
    return;
  }
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
      message: "Your file was received and added to your work.",
      fileName: attempt.file.name || "Selected file",
      fileSize: attempt.file.size || 0,
      retryReady: false,
    });
    await loadWorkspaceData("Your file was received and added to your work.");
    openStudentProofReceipt("Your file was received. Files list opened so you can confirm it is on the right work item.", {
      proofKind: "file",
      submissionId: attempt.submissionId,
      title: attempt.title,
      fileName: attempt.file.name || "Selected file",
    });
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

function openStudentProofReceipt(message = "File saved. Files list opened.", receipt = {}) {
  studentProofReceiptState = normalizeStudentProofReceipt(receipt);
  studentDisclosureState = {
    ...studentDisclosureState,
    evidence: true,
    files: true,
  };
  requestStudentSectionFocus("files");
  activeSection = "student";
  renderAppShell(message, "success");
}

function normalizeStudentProofReceipt(receipt = {}) {
  const submissionId = cleanDirectoryFilter(receipt.submissionId || "");
  const matchedSubmission = studentSubmissionForReceipt(submissionId);
  return {
    ...defaultStudentProofReceiptState(),
    visible: true,
    proofKind: receipt.proofKind === "link" ? "link" : "file",
    submissionId,
    requirementId: matchedSubmission?.requirement_id || matchedSubmission?.requirementId || "",
    title: String(receipt.title || "").trim().slice(0, 160),
    fileName: String(receipt.fileName || "").trim().slice(0, 160),
    requirementTitle: matchedSubmission?.requirement_title || matchedSubmission?.requirementTitle || "",
    savedAt: new Date().toISOString(),
  };
}

function studentSubmissionForReceipt(submissionId = "") {
  const dashboard = unwrap(currentData.dashboard);
  const submissions = Array.isArray(dashboard?.submissions) ? dashboard.submissions : [];
  const normalizedSubmissionId = cleanDirectoryFilter(submissionId);
  return submissions.find((row) => cleanDirectoryFilter(row?.id || row?.submissionId || "") === normalizedSubmissionId) || null;
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
  if (!attempt.submissionId) return "Choose the work item this file belongs to.";
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
    return workspaceUploadTypeMessage();
  }
  return "";
}

async function validateWorkspaceUploadFileSignature(file) {
  if (!file || typeof file !== "object") return "";
  const readable = typeof file.slice === "function" ? file.slice(0, 4) : file;
  if (!readable || typeof readable.arrayBuffer !== "function") return "";
  try {
    const bytes = new Uint8Array(await readable.arrayBuffer());
    return workspaceUploadBytesHaveDisallowedSignature(bytes) ? workspaceUploadBlockedSignatureMessage() : "";
  } catch {
    return "";
  }
}

function workspaceUploadBytesHaveDisallowedSignature(bytes) {
  if (!bytes || typeof bytes.length !== "number") return false;
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) return true;
  if (bytes.length >= 4 && bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) return true;
  if (bytes.length >= 4 && bytes[0] === 0xcf && bytes[1] === 0xfa && bytes[2] === 0xed && bytes[3] === 0xfe) return true;
  if (bytes.length >= 4 && bytes[0] === 0xfe && bytes[1] === 0xed && bytes[2] === 0xfa && bytes[3] === 0xcf) return true;
  return false;
}

function workspaceUploadFileSupported(file) {
  const mimeType = String(file?.type || "").toLowerCase().split(";")[0].trim();
  const extension = workspaceUploadFileExtension(file?.name);
  if (WORKSPACE_UPLOAD_GENERIC_MIME_TYPES.has(mimeType)) {
    return WORKSPACE_UPLOAD_ALLOWED_EXTENSIONS.has(extension);
  }
  if (!extension) {
    return WORKSPACE_UPLOAD_ALLOWED_MIME_TYPES.has(mimeType);
  }
  return WORKSPACE_UPLOAD_ALLOWED_MIME_TYPES_BY_EXTENSION.get(extension)?.has(mimeType) === true;
}

function workspaceUploadFileExtension(name) {
  const match = /\.[a-z0-9]+$/i.exec(String(name || "").trim());
  return match ? match[0].toLowerCase() : "";
}

function workspaceUploadTypeMessage() {
  return "Choose a PDF, image, text file, spreadsheet, presentation, or document. If the file was renamed, make sure its extension matches the file type.";
}

function workspaceUploadBlockedSignatureMessage() {
  return "This file cannot be uploaded safely. Choose the original PDF, image, text file, spreadsheet, presentation, or document, or attach a secure link instead.";
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
    activeSection = "adminImports";
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
      activeSection = "adminImports";
      renderAppShell(messageForAdminImportError(body?.error, response.status), "error");
      return;
    }
    lastAdminImportResult = body;
    activeSection = "adminImports";
    await loadWorkspaceData("Account created.");
  } catch (error) {
    lastAdminImportResult = null;
    activeSection = "adminImports";
    renderAppShell(messageForNetworkError(error), "error");
  } finally {
    setFormBusy(form, false);
    busy = false;
  }
}
