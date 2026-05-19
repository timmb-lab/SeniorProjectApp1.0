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

const loginForm = document.querySelector("#loginForm");
const accountSelect = document.querySelector("#accountSelect");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const accountStatus = document.querySelector("#accountStatus");
const sessionPanel = document.querySelector("#sessionPanel");
const evidencePanel = document.querySelector("#evidencePanel");
const healthPanel = document.querySelector("#healthPanel");
const selectedExpectation = document.querySelector("#selectedExpectation");
const smokeChecklist = document.querySelector("#smokeChecklist");
const testAccountList = document.querySelector("#testAccountList");
const refreshSession = document.querySelector("#refreshSession");
const logoutButton = document.querySelector("#logoutButton");
const checkEvidence = document.querySelector("#checkEvidence");
const checkHealth = document.querySelector("#checkHealth");
const copyUserSummary = document.querySelector("#copyUserSummary");
const runSmokeSequence = document.querySelector("#runSmokeSequence");

let currentSession = null;
let smokeState = {
  evidence: { status: "waiting", detail: "Run protected evidence access after sign-in." },
  health: { status: "waiting", detail: "Run backend health check." },
};

init();

function init() {
  renderAccountChoices();
  renderTestAccountList();
  renderSelectedExpectation();
  renderSmokeChecklist();
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
  for (const control of [accountSelect, emailInput, passwordInput, refreshSession, logoutButton, checkEvidence, checkHealth, copyUserSummary, runSmokeSequence]) {
    control.disabled = isBusy;
  }
  loginForm.querySelector("button[type='submit']").disabled = isBusy;
}

function resetSmokeResults() {
  smokeState = {
    evidence: { status: "waiting", detail: "Run protected evidence access after sign-in." },
    health: { status: "waiting", detail: "Run backend health check." },
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
