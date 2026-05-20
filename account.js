const TEST_ACCOUNTS = [
  {
    key: "student",
    label: "Student",
    email: "maya.student@senior-capstone.test",
    expected: "Can sign in and access own alpha evidence fixture.",
    expectedRole: "student",
    expectedScopeType: "global",
    expectedScopeId: "",
    expectedEvidenceAccess: "allowed",
    expectation: "Should pass the protected evidence check for Maya's own alpha fixture.",
  },
  {
    key: "program_teacher",
    label: "Program Teacher",
    email: "chen.teacher@senior-capstone.test",
    expected: "Can sign in and access the IT program alpha evidence fixture.",
    expectedRole: "program_teacher",
    expectedScopeType: "program",
    expectedScopeId: "it",
    expectedEvidenceAccess: "allowed",
    expectation: "Should pass because the fixture belongs to the IT program scope.",
  },
  {
    key: "mentor",
    label: "Mentor",
    email: "rivera.mentor@senior-capstone.test",
    expected: "Can sign in and access the assigned student's alpha evidence fixture.",
    expectedRole: "mentor",
    expectedScopeType: "global",
    expectedScopeId: "",
    expectedEvidenceAccess: "allowed",
    expectation: "Should pass because this mentor is assigned to Maya's alpha project.",
  },
  {
    key: "admin",
    label: "Admin",
    email: "lee.admin@senior-capstone.test",
    expected: "Can sign in and access protected alpha evidence through global admin scope.",
    expectedRole: "admin",
    expectedScopeType: "global",
    expectedScopeId: "",
    expectedEvidenceAccess: "allowed",
    expectation: "Should pass protected evidence checks through the fake global admin role.",
  },
  {
    key: "misc_admin",
    label: "Misc Admin",
    email: "reporting.miscadmin@senior-capstone.test",
    expected: "Can sign in but should be denied protected student evidence by default.",
    expectedRole: "misc_admin",
    expectedScopeType: "reporting",
    expectedScopeId: "alpha-readiness",
    expectedEvidenceAccess: "denied",
    expectation: "Should receive a 403 on protected student evidence while health/session checks still work.",
  },
];

const ALPHA_EVIDENCE_ID = "evidence-alpha-maya-category-map";
const ALPHA_SUBMISSION_ID = "submission-alpha-maya-proposal";
const MAX_DRIVE_UPLOAD_BYTES = 5 * 1024 * 1024;

const loginForm = document.querySelector("#loginForm");
const accountSelect = document.querySelector("#accountSelect");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const accountStatus = document.querySelector("#accountStatus");
const sessionPanel = document.querySelector("#sessionPanel");
const evidencePanel = document.querySelector("#evidencePanel");
const healthPanel = document.querySelector("#healthPanel");
const drivePanel = document.querySelector("#drivePanel");
const selectedExpectation = document.querySelector("#selectedExpectation");
const smokeChecklist = document.querySelector("#smokeChecklist");
const testAccountList = document.querySelector("#testAccountList");
const refreshSession = document.querySelector("#refreshSession");
const logoutButton = document.querySelector("#logoutButton");
const checkEvidence = document.querySelector("#checkEvidence");
const checkHealth = document.querySelector("#checkHealth");
const driveUploadForm = document.querySelector("#driveUploadForm");
const driveFileInput = document.querySelector("#driveFileInput");
const driveTitleInput = document.querySelector("#driveTitleInput");
const driveArtifactType = document.querySelector("#driveArtifactType");
const driveEvidenceIdInput = document.querySelector("#driveEvidenceIdInput");
const uploadDriveFile = document.querySelector("#uploadDriveFile");
const downloadDriveFile = document.querySelector("#downloadDriveFile");
const clearDriveEvidence = document.querySelector("#clearDriveEvidence");
const copyUserSummary = document.querySelector("#copyUserSummary");
const runSmokeSequence = document.querySelector("#runSmokeSequence");

let currentSession = null;
let lastDriveEvidenceId = "";
let driveObjectUrl = "";
let smokeState = {
  evidence: { status: "waiting", detail: "Run protected evidence access after sign-in." },
  health: { status: "waiting", detail: "Run backend health check." },
  driveUpload: { status: "waiting", detail: "Upload a Drive file evidence as the student account." },
  driveDownload: { status: "waiting", detail: "Download a Drive evidence file after uploading." },
};

init();

function init() {
  renderAccountChoices();
  renderTestAccountList();
  renderSelectedExpectation();
  renderSmokeChecklist();
  renderDrivePanel();
  bindEvents();
  checkSession();
}

function bindEvents() {
  accountSelect.addEventListener("change", () => {
    const account = getSelectedAccount();
    emailInput.value = account.email;
    resetSmokeResults();
    renderSelectedExpectation();
    renderSmokeChecklist();
    evidencePanel.innerHTML = "Selected expectation updated. Sign in as this fake account, then run the access check.";
    if (currentSession?.email && currentSession.email.toLowerCase() !== account.email.toLowerCase()) {
      setStatus(`Selected ${account.label}. Sign in to switch the active session from ${currentSession.email}.`, "neutral");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await signIn();
  });

  refreshSession.addEventListener("click", checkSession);
  logoutButton.addEventListener("click", signOut);
  checkEvidence.addEventListener("click", checkEvidenceAccess);
  checkHealth.addEventListener("click", checkBackendHealth);

  if (driveUploadForm) {
    driveUploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await uploadDriveEvidenceFile();
    });
  }
  if (downloadDriveFile) {
    downloadDriveFile.addEventListener("click", downloadDriveEvidenceFile);
  }
  if (clearDriveEvidence) {
    clearDriveEvidence.addEventListener("click", clearDriveEvidenceState);
  }
  if (driveFileInput && driveTitleInput) {
    driveFileInput.addEventListener("change", () => {
      const file = driveFileInput.files?.[0];
      if (file && !driveTitleInput.value.trim()) {
        driveTitleInput.value = file.name.slice(0, 160);
      }
    });
  }

  copyUserSummary.addEventListener("click", copyCurrentUserSummary);
  runSmokeSequence.addEventListener("click", runAccountSmokeSequence);
}

function renderAccountChoices() {
  accountSelect.innerHTML = TEST_ACCOUNTS
    .map((account) => `<option value="${account.key}">${account.label} - ${account.email}</option>`)
    .join("");
  emailInput.value = TEST_ACCOUNTS[0].email;
}

function renderTestAccountList() {
  testAccountList.innerHTML = TEST_ACCOUNTS
    .map((account) => `
      <div class="account-row">
        <div>
          <strong>${account.label}</strong>
          <span>${account.email}</span>
          <small>${account.expected}</small>
        </div>
        <span class="account-role">${account.key.replace(/_/g, " ")}</span>
      </div>
    `)
    .join("");
}

function renderSelectedExpectation() {
  const account = getSelectedAccount();
  const evidenceTone = account.expectedEvidenceAccess === "allowed" ? "Expected allowed" : "Expected denied";
  selectedExpectation.innerHTML = `
    <div>
      <strong>${escapeHtml(account.label)} review path</strong>
      <span>${escapeHtml(account.expectation)}</span>
      <span>${escapeHtml(formatExpectedRole(account))}</span>
    </div>
    <span class="account-role">${escapeHtml(evidenceTone)}</span>
  `;
}

function renderSmokeChecklist() {
  const selected = getSelectedAccount();
  const sessionAccount = getAccountForCurrentSession();
  const hasSession = Boolean(currentSession);
  const selectedMatchesSession = hasSession && currentSession.email?.toLowerCase() === selected.email.toLowerCase();
  const roleMatch = hasSession && hasExpectedRole(currentSession, sessionAccount);

  const checks = [
    {
      label: "Fake account selected",
      status: selected.email.endsWith(".test") ? "pass" : "fail",
      detail: selected.email,
    },
    {
      label: "Session active",
      status: hasSession ? "pass" : "waiting",
      detail: hasSession ? currentSession.email : "Sign in or check session.",
    },
    {
      label: "Selected account matches session",
      status: !hasSession ? "waiting" : selectedMatchesSession ? "pass" : "fail",
      detail: !hasSession ? "No active session yet." : selectedMatchesSession ? "Selection and cookie session agree." : `Selection is ${selected.email}; session is ${currentSession.email}.`,
    },
    {
      label: "Expected role scope returned",
      status: !hasSession ? "waiting" : roleMatch ? "pass" : "fail",
      detail: !hasSession ? formatExpectedRole(selected) : roleMatch ? formatExpectedRole(sessionAccount) : `Missing ${formatExpectedRole(sessionAccount)}.`,
    },
    {
      label: "Protected evidence outcome",
      status: smokeState.evidence.status,
      detail: smokeState.evidence.detail,
    },
    {
      label: "Backend readiness",
      status: smokeState.health.status,
      detail: smokeState.health.detail,
    },
    {
      label: "Drive file upload",
      status: smokeState.driveUpload.status,
      detail: smokeState.driveUpload.detail,
    },
    {
      label: "Drive file download",
      status: smokeState.driveDownload.status,
      detail: smokeState.driveDownload.detail,
    },
  ];

  smokeChecklist.innerHTML = checks.map((check) => `
    <div class="account-check check-${escapeHtml(check.status)}">
      <span class="account-check-dot" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(check.label)}</strong>
        <span>${escapeHtml(check.detail)}</span>
      </div>
      <span class="account-role">${escapeHtml(check.status)}</span>
    </div>
  `).join("");
}

async function signIn() {
  setBusy(true);
  resetSmokeResults();
  renderSmokeChecklist();
  setStatus("Signing in with the fake account...", "neutral");
  evidencePanel.innerHTML = "Sign in complete, then run the access check.";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value,
      }),
    });
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data?.error || `Login failed with ${response.status}`);
    }
    passwordInput.value = "";
    setStatus(`Signed in as ${data.user?.displayName || emailInput.value}. Checking session roles...`, "success");
    await checkSession();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function checkSession() {
  setBusy(true);
  try {
    const response = await fetch("/api/auth/me", { headers: { accept: "application/json" } });
    const data = await safeJson(response);
    if (!response.ok) {
      currentSession = null;
      smokeState.evidence = { status: "waiting", detail: "Sign in before checking protected evidence." };
      renderSession(null);
      renderSmokeChecklist();
      setStatus("No active session. Sign in with one of the fake .test accounts.", "neutral");
      return;
    }
    currentSession = data.user;
    renderSession(data.user);
    renderSmokeChecklist();
    setStatus(`Active session: ${data.user.displayName}.`, "success");
  } catch (error) {
    currentSession = null;
    renderSession(null);
    renderSmokeChecklist();
    setStatus(`${error.message}. Run this through Cloudflare Pages dev or deployment so auth functions are reachable.`, "error");
  } finally {
    setBusy(false);
  }
}

async function signOut() {
  setBusy(true);
  setStatus("Signing out...", "neutral");
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      const data = await safeJson(response);
      throw new Error(data?.error || `Logout failed with ${response.status}`);
    }
    currentSession = null;
    renderSession(null);
    resetSmokeResults();
    renderSmokeChecklist();
    evidencePanel.innerHTML = "Sign in, then run the access check.";
    resetDriveChecks({ preserveEvidenceId: true });
    setStatus("Signed out. Session cookie cleared.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function checkEvidenceAccess() {
  setBusy(true);
  evidencePanel.innerHTML = "Checking protected evidence access...";
  try {
    const expectedAccount = getAccountForCurrentSession();
    const response = await fetch(`/api/evidence/${ALPHA_EVIDENCE_ID}/check-access`, {
      headers: { accept: "application/json" },
    });
    const data = await safeJson(response);
    if (!response.ok) {
      const outcomeMatches = expectedAccount.expectedEvidenceAccess === "denied" && response.status === 403;
      evidencePanel.innerHTML = renderJson({
        status: response.status,
        checkedAs: currentSession?.email || "unknown",
        expectedAccount: expectedAccount.email,
        expectedEvidenceAccess: expectedAccount.expectedEvidenceAccess,
        outcomeMatches,
        ...data,
      });
      smokeState.evidence = {
        status: outcomeMatches ? "pass" : "fail",
        detail: `${response.status} ${data?.error || "denied"} for ${expectedAccount.label}.`,
      };
      renderSmokeChecklist();
      setStatus(
        `Evidence access returned ${response.status}: ${data?.error || "denied"} (${outcomeMatches ? "expected" : "unexpected"} for ${expectedAccount.label}).`,
        outcomeMatches ? "success" : "error",
      );
      return;
    }
    const outcomeMatches = expectedAccount.expectedEvidenceAccess === "allowed";
    evidencePanel.innerHTML = renderJson({
      checkedAs: currentSession?.email || "unknown",
      expectedAccount: expectedAccount.email,
      expectedEvidenceAccess: expectedAccount.expectedEvidenceAccess,
      outcomeMatches,
      ...data,
    });
    smokeState.evidence = {
      status: outcomeMatches ? "pass" : "fail",
      detail: `Allowed for ${expectedAccount.label}; expected ${expectedAccount.expectedEvidenceAccess}.`,
    };
    renderSmokeChecklist();
    setStatus(
      outcomeMatches
        ? "Protected evidence access passed without exposing Drive storage IDs."
        : `Protected evidence access was allowed unexpectedly for ${expectedAccount.label}.`,
      outcomeMatches ? "success" : "error",
    );
  } catch (error) {
    evidencePanel.innerHTML = "Evidence check could not reach the API.";
    smokeState.evidence = {
      status: "fail",
      detail: "Evidence API could not be reached.",
    };
    renderSmokeChecklist();
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return `${bytes}`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function expectedDriveUploadOutcome(account) {
  return account.key === "student" ? "allowed" : "denied";
}

function renderDrivePanel(content) {
  if (!drivePanel) return;
  if (typeof content === "string") {
    drivePanel.innerHTML = content;
    return;
  }

  const evidenceId = String(driveEvidenceIdInput?.value || lastDriveEvidenceId || "").trim();
  drivePanel.innerHTML = evidenceId
    ? `Ready to download Drive evidence <code>${escapeHtml(evidenceId)}</code>.`
    : "Sign in and upload a small file to begin.";
}

function resetDriveChecks(options = {}) {
  const preserveEvidenceId = options.preserveEvidenceId !== false;

  if (driveObjectUrl) {
    try {
      URL.revokeObjectURL(driveObjectUrl);
    } catch {
      // Ignore revoke errors.
    }
    driveObjectUrl = "";
  }

  if (!preserveEvidenceId) {
    lastDriveEvidenceId = "";
    if (driveEvidenceIdInput) driveEvidenceIdInput.value = "";
  }

  smokeState.driveUpload = { status: "waiting", detail: "Upload a Drive file evidence as the student account." };
  smokeState.driveDownload = { status: "waiting", detail: "Download a Drive evidence file after uploading." };
  renderSmokeChecklist();
  renderDrivePanel();
}

function clearDriveEvidenceState() {
  resetDriveChecks({ preserveEvidenceId: false });
  renderDrivePanel("Drive file check cleared. Upload a new file to continue.");
}

async function uploadDriveEvidenceFile() {
  setBusy(true);
  renderDrivePanel("Uploading file evidence to Google Drive...");
  try {
    const expectedAccount = getAccountForCurrentSession();
    const file = driveFileInput?.files?.[0] || null;
    if (!file) {
      smokeState.driveUpload = { status: "fail", detail: "Select a file before uploading." };
      renderSmokeChecklist();
      renderDrivePanel("No file selected yet.");
      setStatus("Select a file before uploading evidence.", "error");
      return;
    }

    if (!Number.isFinite(file.size) || file.size <= 0) {
      smokeState.driveUpload = { status: "fail", detail: "Selected file is empty." };
      renderSmokeChecklist();
      renderDrivePanel("Selected file was empty.");
      setStatus("Selected file was empty.", "error");
      return;
    }

    if (file.size > MAX_DRIVE_UPLOAD_BYTES) {
      smokeState.driveUpload = { status: "fail", detail: `Selected file exceeds ${formatBytes(MAX_DRIVE_UPLOAD_BYTES)}.` };
      renderSmokeChecklist();
      renderDrivePanel(`File too large for current MVP limit. Choose a file under ${formatBytes(MAX_DRIVE_UPLOAD_BYTES)}.`);
      setStatus("File exceeds the current 5MB upload limit.", "error");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", driveTitleInput?.value || file.name);
    formData.set("artifactType", driveArtifactType?.value || "planning_document");

    const response = await fetch(`/api/submissions/${ALPHA_SUBMISSION_ID}/evidence/upload`, {
      method: "POST",
      headers: { accept: "application/json" },
      credentials: "same-origin",
      body: formData,
    });
    const data = await safeJson(response);

    if (!response.ok) {
      const expectedOutcome = expectedDriveUploadOutcome(expectedAccount);
      const deniedOk = expectedOutcome === "denied" && response.status === 403;
      const drivePending = expectedOutcome === "allowed" && response.status === 503;
      const status = deniedOk ? "pass" : drivePending ? "waiting" : "fail";

      smokeState.driveUpload = {
        status,
        detail: `${response.status} ${data?.error || "upload failed"} (${expectedAccount.label}).`,
      };
      renderSmokeChecklist();
      renderDrivePanel(renderJson({
        status: response.status,
        checkedAs: currentSession?.email || "unknown",
        expectedAccount: expectedAccount.email,
        expectedDriveUpload: expectedOutcome,
        outcomeMatches: deniedOk,
        ...data,
      }));

      setStatus(
        deniedOk
          ? "Drive upload correctly denied for non-student scope."
          : drivePending
            ? "Drive upload is blocked until Drive secrets are configured."
            : `Drive upload failed with ${response.status}.`,
        deniedOk || drivePending ? "success" : "error",
      );
      return;
    }

    lastDriveEvidenceId = data?.evidence?.id || "";
    if (driveEvidenceIdInput && lastDriveEvidenceId) driveEvidenceIdInput.value = lastDriveEvidenceId;

    const outcomeMatches = expectedDriveUploadOutcome(expectedAccount) === "allowed";
    smokeState.driveUpload = {
      status: outcomeMatches ? "pass" : "fail",
      detail: outcomeMatches ? `Uploaded ${file.name} (${formatBytes(file.size)}).` : "Upload succeeded unexpectedly for non-student account.",
    };
    smokeState.driveDownload = { status: "waiting", detail: "Ready to download the uploaded Drive evidence file." };
    renderSmokeChecklist();

    renderDrivePanel(renderJson({
      checkedAs: currentSession?.email || "unknown",
      submissionId: ALPHA_SUBMISSION_ID,
      uploadedEvidenceId: lastDriveEvidenceId,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      ...data,
    }));

    setStatus("Drive evidence upload completed. Use Download File to verify retrieval.", "success");
  } catch (error) {
    smokeState.driveUpload = { status: "fail", detail: "Drive upload request threw an exception." };
    renderSmokeChecklist();
    renderDrivePanel("Drive upload could not reach the API.");
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function downloadDriveEvidenceFile() {
  setBusy(true);
  renderDrivePanel("Downloading evidence bytes...");
  try {
    const evidenceId = String(driveEvidenceIdInput?.value || lastDriveEvidenceId || "").trim();
    if (!evidenceId) {
      smokeState.driveDownload = { status: "fail", detail: "Provide an evidence ID before downloading." };
      renderSmokeChecklist();
      renderDrivePanel("No evidence ID is set yet. Upload first or paste an evidence ID.");
      setStatus("Provide an evidence ID before downloading.", "error");
      return;
    }

    const expectedAccount = getAccountForCurrentSession();
    const response = await fetch(`/api/evidence/${encodeURIComponent(evidenceId)}/download`, {
      headers: { accept: "*/*" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      const data = await safeJson(response);
      const statusOk = expectedAccount.expectedEvidenceAccess === "denied" && response.status === 403;
      smokeState.driveDownload = {
        status: statusOk ? "pass" : response.status === 503 ? "waiting" : "fail",
        detail: `${response.status} ${data?.error || "download failed"} (${expectedAccount.label}).`,
      };
      renderSmokeChecklist();
      renderDrivePanel(renderJson({
        status: response.status,
        checkedAs: currentSession?.email || "unknown",
        expectedAccount: expectedAccount.email,
        expectedEvidenceAccess: expectedAccount.expectedEvidenceAccess,
        outcomeMatches: statusOk,
        ...data,
      }));

      setStatus(
        statusOk
          ? "Drive download correctly denied for misc-admin scope."
          : response.status === 503
            ? "Drive download is blocked until Drive secrets are configured."
            : `Drive download failed with ${response.status}.`,
        statusOk || response.status === 503 ? "success" : "error",
      );
      return;
    }

    if (driveObjectUrl) {
      try {
        URL.revokeObjectURL(driveObjectUrl);
      } catch {
        // Ignore revoke errors.
      }
      driveObjectUrl = "";
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition") || "";
    const fileName = contentDisposition.match(/filename=\"([^\"]+)\"/i)?.[1] || `evidence-${evidenceId}`;
    driveObjectUrl = URL.createObjectURL(blob);

    smokeState.driveDownload = {
      status: expectedAccount.expectedEvidenceAccess === "allowed" ? "pass" : "fail",
      detail: `Downloaded ${formatBytes(blob.size)} for ${expectedAccount.label}.`,
    };
    renderSmokeChecklist();

    renderDrivePanel(`
      <div class="account-row">
        <div>
          <strong>${escapeHtml(fileName)}</strong>
          <span>${escapeHtml(`${formatBytes(blob.size)} · ${response.headers.get("content-type") || "application/octet-stream"}`)}</span>
          <small>${escapeHtml(evidenceId)}</small>
        </div>
        <span class="account-role">ready</span>
      </div>
      <div class="account-actions">
        <a class="account-button account-button-primary" href="${escapeHtml(driveObjectUrl)}" download="${escapeHtml(fileName)}">Save download</a>
      </div>
      <details class="account-details">
        <summary>Raw download headers</summary>
        ${renderJson({
          contentType: response.headers.get("content-type"),
          contentDisposition: response.headers.get("content-disposition"),
          cacheControl: response.headers.get("cache-control"),
        })}
      </details>
    `);

    setStatus("Drive evidence download ready. Use the Save download button.", "success");
  } catch (error) {
    smokeState.driveDownload = { status: "fail", detail: "Drive download request threw an exception." };
    renderSmokeChecklist();
    renderDrivePanel("Drive download could not reach the API.");
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function checkBackendHealth() {
  setBusy(true);
  healthPanel.innerHTML = "Checking backend health...";
  try {
    const response = await fetch("/api/health", { headers: { accept: "application/json" } });
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data?.error || `Health check failed with ${response.status}`);
    }
    healthPanel.innerHTML = renderHealthSummary(data);
    smokeState.health = {
      status: data.ok ? "pass" : "fail",
      detail: data.googleDriveCredentialsConfigured
        ? "Auth, D1, evidence metadata, and Drive credentials are reporting."
        : "Auth, D1, and evidence metadata report; Drive credential pair is still pending.",
    };
    renderSmokeChecklist();
    setStatus(
      data.googleDriveCredentialsConfigured
        ? "Backend health responded. Drive credentials are configured for the next upload slice."
        : "Backend health responded. Drive credentials are still pending, so file-byte uploads remain blocked.",
      "success",
    );
  } catch (error) {
    healthPanel.innerHTML = "Backend health could not be reached from this page.";
    smokeState.health = {
      status: "fail",
      detail: "Health API could not be reached.",
    };
    renderSmokeChecklist();
    setStatus(`${error.message}. Use Cloudflare Pages dev or deployment for API-backed smoke checks.`, "error");
  } finally {
    setBusy(false);
  }
}

async function runAccountSmokeSequence() {
  setStatus("Running account smoke sequence...", "neutral");
  await checkSession();
  await checkBackendHealth();
  await checkEvidenceAccess();
}

async function copyCurrentUserSummary() {
  if (!currentSession) {
    setStatus("No active session summary to copy.", "neutral");
    return;
  }
  const summary = currentUserSummary();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
      setStatus("Session summary copied to clipboard.", "success");
      return;
    }
  } catch {
    // Clipboard access can be blocked in local smoke contexts; the visible status still gives reviewers the summary.
  }
  setStatus(summary, "success");
}

function renderHealthSummary(data) {
  const evidenceIndexConfigured = data.evidenceIndexConfigured ?? Boolean(data.evidenceIndexSheetId);
  const checks = [
    ["API", data.ok, data.environment || "unknown environment"],
    ["Auth", Boolean(data.authMode), data.authMode || "auth mode missing"],
    ["D1 users", Number(data.userCount || 0) > 0, `${data.userCount ?? 0} active user records`],
    ["Evidence root", Boolean(data.evidenceRootConfigured), data.evidenceStorageProvider || "provider unknown"],
    ["Evidence index", Boolean(evidenceIndexConfigured), evidenceIndexConfigured ? "index configured" : "index pending"],
    ["Drive credentials", Boolean(data.googleDriveCredentialsConfigured), data.googleDriveCredentialsConfigured ? "credential pair present" : "credential pair pending"],
  ];

  return `
    <div class="account-health-grid">
      ${checks.map(([label, ok, detail]) => `
        <div class="account-check check-${ok ? "pass" : "waiting"}">
          <span class="account-check-dot" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(detail)}</span>
          </div>
        </div>
      `).join("")}
    </div>
    <details class="account-details">
      <summary>Raw health response</summary>
      ${renderJson({
        ok: data.ok,
        environment: data.environment,
        authMode: data.authMode,
        evidenceStorageProvider: data.evidenceStorageProvider,
        evidenceRootConfigured: data.evidenceRootConfigured,
        googleDriveCredentialsConfigured: data.googleDriveCredentialsConfigured,
        userCount: data.userCount,
        evidenceIndexConfigured,
      })}
    </details>
  `;
}

function renderSession(user) {
  if (!user) {
    sessionPanel.innerHTML = `<div class="account-empty">No active account session.</div>`;
    return;
  }

  const roles = Array.isArray(user.roles) ? user.roles : [];
  sessionPanel.innerHTML = `
    <div class="account-row">
      <div>
        <strong>${escapeHtml(user.displayName)}</strong>
        <span>${escapeHtml(user.email)}</span>
      </div>
      <span class="account-role">authenticated</span>
    </div>
    <div class="account-role-list" aria-label="Role scopes">
      ${roles.length ? roles.map((role) => `
        <span class="account-role">
          ${escapeHtml(role.role_id)} / ${escapeHtml(role.scope_type || "global")}${role.scope_id ? ` / ${escapeHtml(role.scope_id)}` : ""}
        </span>
      `).join("") : `<span class="account-role">No roles returned</span>`}
    </div>
  `;
}

function currentUserSummary() {
  const roles = (currentSession.roles || [])
    .map((role) => `${role.role_id}:${role.scope_type || "global"}${role.scope_id ? `=${role.scope_id}` : ""}`)
    .join(", ");
  return `${currentSession.displayName} (${currentSession.email}) roles: ${roles || "none"}.`;
}

function setStatus(message, tone) {
  accountStatus.textContent = message;
  accountStatus.className = `account-status ${tone === "success" || tone === "error" ? tone : ""}`.trim();
}

function setBusy(isBusy) {
  for (const control of [
    accountSelect,
    emailInput,
    passwordInput,
    refreshSession,
    logoutButton,
    checkEvidence,
    checkHealth,
    uploadDriveFile,
    downloadDriveFile,
    clearDriveEvidence,
    driveFileInput,
    driveTitleInput,
    driveArtifactType,
    driveEvidenceIdInput,
    copyUserSummary,
    runSmokeSequence,
  ]) {
    if (!control) continue;
    control.disabled = isBusy;
  }
  loginForm?.querySelector("button[type='submit']")?.toggleAttribute("disabled", isBusy);
}

function resetSmokeResults() {
  smokeState = {
    evidence: { status: "waiting", detail: "Run protected evidence access after sign-in." },
    health: { status: "waiting", detail: "Run backend health check." },
    driveUpload: { status: "waiting", detail: "Upload a Drive file evidence as the student account." },
    driveDownload: { status: "waiting", detail: "Download a Drive evidence file after uploading." },
  };
}

function getSelectedAccount() {
  return TEST_ACCOUNTS.find((account) => account.key === accountSelect.value) || TEST_ACCOUNTS[0];
}

function getAccountForCurrentSession() {
  const sessionEmail = currentSession?.email?.toLowerCase();
  return TEST_ACCOUNTS.find((account) => account.email.toLowerCase() === sessionEmail) || getSelectedAccount();
}

function hasExpectedRole(user, account) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return roles.some((role) => (
    role.role_id === account.expectedRole
    && (role.scope_type || "global") === account.expectedScopeType
    && (role.scope_id || "") === account.expectedScopeId
  ));
}

function formatExpectedRole(account) {
  const scope = account.expectedScopeId
    ? `${account.expectedScopeType}:${account.expectedScopeId}`
    : account.expectedScopeType;
  return `Expected role ${account.expectedRole} / ${scope}.`;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function renderJson(value) {
  return `<pre class="account-json">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
