import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rawBaseUrl = process.env.WORKSPACE_SMOKE_BASE_URL;
const baseUrl = rawBaseUrl ? new URL(rawBaseUrl) : null;
const credentialsFile = process.env.WORKSPACE_SMOKE_CREDENTIALS_FILE;
const smokeCredentials = credentialsFile ? readSmokeCredentials(credentialsFile) : null;

const forbiddenProductionCopy = [
  /\bCodex\b/i,
  /\bprompt\b/i,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bplaceholder\b/i,
  /\blorem\b/i,
  /\bmock(?:ed)?\b/i,
  /\bfake\b/i,
  /\bfixture\b/i,
  /\bdev only\b/i,
  /\bdevelopment only\b/i,
  /\bdebug\b/i,
  /\bscaffold\b/i,
  /\bprototype copy\b/i,
  /\bsample student\b/i,
  /\bsample upload\b/i,
  /\bpretend\b/i,
  /\bdummy\b/i,
  /\bnot implemented\b/i,
  /\bunder construction\b/i,
  /\binternal QA\b/i,
  /\bwireframe\b/i,
];

test("workspace route signed-out smoke over local HTTP", { skip: !baseUrl }, async () => {
  const htmlResponse = await fetchFromBase("/workspace.html");
  assert.equal(htmlResponse.status, 200);
  assert.ok(htmlResponse.url.endsWith("/workspace") || htmlResponse.url.endsWith("/workspace.html"));
  assert.equal(htmlResponse.headers.get("content-type")?.includes("text/html"), true);

  const html = await htmlResponse.text();
  assert.match(html, /<title>Senior Project Workspace<\/title>/);
  assert.match(html, /workspaceMain/);
  assert.match(html, /workspace\.css/);
  assert.match(html, /workspace\.js/);
  assertSafeProductionCopy("workspace.html", html);

  const script = await fetchTextAsset("/workspace.js");
  assert.match(script, /<h1 id="signInTitle">Senior Project Workspace<\/h1>/);
  assert.match(script, /<h2>Sign in to continue<\/h2>/);
  assert.match(script, /Sign in to continue/);
  assert.match(script, /workspaceEmail/);
  assert.match(script, /workspacePassword/);
  assert.match(script, /data-auth-action="change-password"/);
  assert.match(script, /data-auth-action="complete-reset"/);
  assert.match(script, /data-admin-action="import-users"/);
  assert.match(script, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(script, /Create a new password/);
  assert.match(script, /Return to the guide/);
  assert.match(script, /\/api\/auth\/login/);
  assert.match(script, /\/api\/auth\/change-password/);
  assert.match(script, /\/api\/auth\/complete-reset/);
  assert.match(script, /\/api\/admin\/users\/import/);
  assert.match(script, /\/api\/auth\/me/);
  assert.match(script, /\/api\/auth\/logout/);
  assert.match(script, /\/api\/student\/archive\/readiness/);
  assert.match(script, /\/api\/presentation-slots/);
  assert.match(script, /data-presentation-state/);
  assert.match(script, /data-presentation-action="check-out"/);
  assert.match(script, /data-presentation-action="check-in"/);
  assert.match(script, /data-archive-check-status/);
  assert.match(script, /data-archive-retention-status/);
  assert.match(script, /\/api\/submissions\/\$\{encodeURIComponent\(values\.submissionId\)\}\/evidence/);
  assert.match(script, /\/api\/submissions\/\$\{encodeURIComponent\(attempt\.submissionId\)\}\/evidence\/upload/);
  assert.match(script, /XMLHttpRequest/);
  assert.match(script, /data-upload-state/);
  assert.match(script, /data-upload-progress/);
  assert.match(script, /data-upload-message/);
  assert.match(script, /data-upload-action="retry"/);
  assert.match(script, /data-upload-action="select-file"/);
  assert.match(script, /data-evidence-download="file"/);
  assert.match(script, /data-evidence-link="external"/);
  assert.match(script, /storage is not configured for this environment/);
  assert.match(script, /data-workspace-state="role-pending"/);
  assert.match(script, /data-workspace-state="permission-denied"/);
  assert.match(script, /data-workspace-state="\$\{escapeHtml\(workspaceState\)\}"/);
  assert.match(script, /"session-expired"/);
  assert.match(script, /"account-disabled"/);
  assert.match(script, /"reset-required"/);
  assert.match(script, /data-workspace-state="no-active-assignment"/);
  assert.match(script, /Workspace access is pending/);
  assert.match(script, /Some workspace sections need different access/);
  assert.match(script, /Workspace assignment is not active yet/);
  assert.doesNotMatch(script, /Your file was received[^.]*storage is not configured/i);
  assertSafeProductionCopy("workspace.js", script);

  const styles = await fetchTextAsset("/workspace.css");
  assert.match(styles, /\.workspace-auth/);
  assert.match(styles, /\.workspace-app/);
  assertSafeProductionCopy("workspace.css", styles);

  const meResponse = await fetchFromBase("/api/auth/me", {
    headers: { accept: "application/json" },
  });
  assert.equal(meResponse.status, 401);
  assert.deepEqual(await meResponse.json(), { authenticated: false });

  const logoutResponse = await fetchFromBase("/api/auth/logout", {
    method: "POST",
    headers: { accept: "application/json" },
  });
  assert.equal(logoutResponse.status, 200);
  assert.deepEqual(await logoutResponse.json(), { ok: true });
});

test("workspace route credential-backed student smoke over local HTTP", {
  skip: !baseUrl || !smokeCredentials?.student,
}, async () => {
  const client = new SessionClient();
  const student = smokeCredentials.student;

  const login = await client.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: student.email, password: student.password }),
  });
  assert.equal(login.response.status, 200, "student login status");
  assert.equal(login.body.ok, true);
  assert.equal(login.body.user.email, student.email);
  assert.ok(client.hasCookie("sc_session"), "student login set a session cookie");

  const me = await client.fetchJson("/api/auth/me");
  assert.equal(me.response.status, 200, "student me status");
  assert.equal(me.body.authenticated, true);
  assert.equal(me.body.user.email, student.email);
  assert.deepEqual(roleIds(me.body.user.roles), ["student"]);

  const htmlResponse = await client.fetch("/workspace.html");
  assert.equal(htmlResponse.status, 200, "authenticated workspace reload status");
  assert.match(await htmlResponse.text(), /Senior Project Workspace/);

  const restored = await client.fetchJson("/api/auth/me");
  assert.equal(restored.response.status, 200, "student session restore status");
  assert.equal(restored.body.authenticated, true);

  const dashboard = await client.fetchJson("/api/student/dashboard");
  assert.equal(dashboard.response.status, 200, "student dashboard status");
  assert.equal(dashboard.body.ok, true);
  assert.equal(dashboard.body.viewer.email, student.email);
  assert.ok(Array.isArray(dashboard.body.submissions));
  assert.ok(dashboard.body.submissions.length > 0, "student has a seeded submission");
  assert.ok(Array.isArray(dashboard.body.evidence));
  assert.ok(
    dashboard.body.progress.some((item) => typeof item.requirement_title === "string" && item.requirement_title.length > 0),
    "student dashboard includes a requirement title",
  );

  const submissionId = dashboard.body.submissions[0].id;
  const link = await client.fetchJson(`/api/submissions/${encodeURIComponent(submissionId)}/evidence`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Local credential-backed smoke evidence link",
      url: "https://example.test/evidence/local-smoke-student",
      artifactType: "planning_document",
    }),
  });
  assert.equal(link.response.status, 200, "evidence link status");
  assert.equal(link.body.ok, true);
  assert.equal(link.body.evidence.sourceKind, "external_link");
  assert.equal(link.body.storage.fileBytesReady, false);

  const refreshedDashboard = await client.fetchJson("/api/student/dashboard");
  assert.equal(refreshedDashboard.response.status, 200, "refreshed dashboard status");
  assert.ok(
    refreshedDashboard.body.evidence.some((item) => item.id === link.body.evidence.id),
    "evidence link appears after refresh",
  );

  const presentationSlots = await client.fetchJson("/api/presentation-slots");
  assert.equal(presentationSlots.response.status, 200, "student presentation slot status");
  assert.equal(presentationSlots.body.ok, true);
  assert.ok(Array.isArray(presentationSlots.body.slots));
  assert.ok(
    presentationSlots.body.slots.some((slot) => slot.studentId === login.body.user.id),
    "student can see own presentation slot",
  );

  const archiveReadiness = await client.fetchJson("/api/student/archive/readiness");
  assert.equal(archiveReadiness.response.status, 200, "student archive readiness status");
  assert.equal(archiveReadiness.body.ok, true);
  assert.equal(archiveReadiness.body.viewer.self, true);
  assert.ok(Array.isArray(archiveReadiness.body.checks));
  assert.doesNotMatch(JSON.stringify(archiveReadiness.body), /drive_file_id|driveFileId/i);

  const allowedFile = new FormData();
  allowedFile.set("title", "Local credential-backed smoke upload");
  allowedFile.set("artifactType", "planning_document");
  allowedFile.set("file", new Blob(["local smoke upload"], { type: "text/plain" }), "local-smoke.txt");
  const upload = await client.fetchJson(`/api/submissions/${encodeURIComponent(submissionId)}/evidence/upload`, {
    method: "POST",
    body: allowedFile,
  });
  if (upload.response.status === 200) {
    assert.equal(upload.body.ok, true);
    assert.equal(upload.body.evidence.sourceKind, "google_drive_file");
    assert.equal(upload.body.storage.fileBytesReady, true);
  } else {
    assert.equal(upload.response.status, 503, "allowed upload should only fail for missing Drive configuration locally");
    assert.ok(
      ["drive_config_missing", "drive_credentials_missing"].includes(upload.body.error),
      `unexpected upload blocker: ${upload.body.error}`,
    );
    assert.notEqual(upload.body.ok, true);
  }

  const unsupportedFile = new FormData();
  unsupportedFile.set("title", "Unsupported local credential-backed smoke upload");
  unsupportedFile.set("artifactType", "planning_document");
  unsupportedFile.set("file", new Blob(["MZ"], { type: "application/x-msdownload" }), "local-smoke.exe");
  const unsupported = await client.fetchJson(`/api/submissions/${encodeURIComponent(submissionId)}/evidence/upload`, {
    method: "POST",
    body: unsupportedFile,
  });
  assert.equal(unsupported.response.status, 400, "unsupported upload status");
  assert.equal(unsupported.body.error, "unsupported_file_type");

  const logout = await client.fetchJson("/api/auth/logout", { method: "POST" });
  assert.equal(logout.response.status, 200, "student logout status");
  assert.equal(logout.body.ok, true);
  assert.equal(client.hasCookie("sc_session"), false, "student logout clears the session cookie");

  const signedOutMe = await client.fetchJson("/api/auth/me");
  assert.equal(signedOutMe.response.status, 401, "signed-out me status after logout");
  assert.deepEqual(signedOutMe.body, { authenticated: false });
});

test("workspace route credential-backed role route coverage over local HTTP", {
  skip: !baseUrl || !smokeCredentials || process.env.WORKSPACE_SMOKE_SKIP_ROLE_COVERAGE === "1",
}, async () => {
  await assertRoleRoute("program_teacher", ["program_teacher"], "/api/teacher/review-queue", (body) => {
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.queue));
  });

  await assertRoleRoute("program_teacher", ["program_teacher"], "/api/presentation-slots", (body) => {
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.slots));
    assert.ok(body.slots.some((slot) => slot.location === "Room 101"));
  });

  await assertRoleRoute("mentor", ["mentor"], "/api/mentor/assigned", (body) => {
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.assignedStudents));
    assert.ok(body.assignedStudents.some((student) => student.submissionId));
  });

  await assertRoleRoute("mentor", ["mentor"], "/api/presentation-slots", (body) => {
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.slots));
    assert.ok(body.slots.some((slot) => slot.studentName));
  });

  if (smokeCredentials.mentor_no_assignment) {
    await assertRoleRoute("mentor_no_assignment", ["mentor"], "/api/mentor/assigned", (body) => {
      assert.equal(body.ok, true);
      assert.deepEqual(body.assignedStudents, []);
    });
  }

  await assertRoleRoute("admin", ["admin"], "/api/reports/readiness", (body) => {
    assert.equal(body.ok, true);
    assert.equal(body.scope, "aggregate_only");
  });

  await assertRoleRoute("misc_admin", ["misc_admin"], "/api/reports/readiness", (body) => {
    assert.equal(body.ok, true);
    assert.equal(body.scope, "aggregate_only");
  });

  await assertRoleRoute("no_role", [], "/api/student/dashboard", (body, response) => {
    assert.equal(response.status, 403);
    assert.equal(body.error, "forbidden");
  });
});

test("workspace route credential-backed admin import reset-first proof over local HTTP", {
  skip: !baseUrl || !smokeCredentials?.admin || !smokeCredentials?.misc_admin,
}, async () => {
  const admin = new SessionClient();
  const adminAccount = smokeCredentials.admin;
  const suffix = uniqueSmokeSuffix();
  const importedEmail = `imported.browser.${suffix}@senior-capstone.test`;
  const importedDisplayName = "Imported Browser Learner";
  const replacementPassword = `Reset-Aa9!${Date.now()}Zz`;

  const adminLogin = await admin.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: adminAccount.email, password: adminAccount.password }),
  });
  assert.equal(adminLogin.response.status, 200, "admin login status");
  assert.equal(adminLogin.body.ok, true);

  const validation = await admin.fetchJson("/api/admin/users/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reason: "",
      users: [adminImportStudentPayload({ email: importedEmail, displayName: importedDisplayName })],
    }),
  });
  assert.equal(validation.response.status, 400, "admin import validation status");
  assert.equal(validation.body.error, "missing_reason");

  const misc = new SessionClient();
  const miscLogin = await misc.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: smokeCredentials.misc_admin.email, password: smokeCredentials.misc_admin.password }),
  });
  assert.equal(miscLogin.response.status, 200, "misc admin login status");
  const denied = await misc.fetchJson("/api/admin/users/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reason: "Denied role import smoke.",
      users: [adminImportStudentPayload({ email: `denied.${importedEmail}`, displayName: "Denied Import" })],
    }),
  });
  assert.equal(denied.response.status, 403, "misc admin import denial status");
  assert.equal(denied.body.error, "forbidden");

  const importResult = await admin.fetchJson("/api/admin/users/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reason: "Local browser-smoke import proof.",
      users: [adminImportStudentPayload({ email: importedEmail, displayName: importedDisplayName })],
    }),
  });
  assert.equal(importResult.response.status, 200, "admin import status");
  assert.equal(importResult.response.headers.get("cache-control"), "no-store");
  assert.equal(importResult.body.ok, true);
  assert.equal(importResult.body.importedCount, 1);
  assert.equal(importResult.body.users.length, 1);
  const importedUser = importResult.body.users[0];
  assert.equal(importedUser.email, importedEmail);
  assert.equal(importedUser.status, "pending_reset");
  assert.equal(importedUser.mustReset, true);
  assert.equal(importedUser.delivery, "one_time_admin_display");
  assert.equal(importedUser.role.roleId, "student");
  assert.equal(typeof importedUser.temporaryPassword, "string");
  assert.ok(importedUser.temporaryPassword.length >= 14, "temporary setup credential is present");

  const imported = new SessionClient();
  const resetRequiredLogin = await imported.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: importedEmail, password: importedUser.temporaryPassword }),
  });
  assert.equal(resetRequiredLogin.response.status, 403, "imported user first login status");
  assert.equal(resetRequiredLogin.body.error, "password_reset_required");
  assert.equal(imported.hasCookie("sc_session"), false, "reset-required login does not create a session");

  const signedOutMe = await imported.fetchJson("/api/auth/me");
  assert.equal(signedOutMe.response.status, 401, "imported user me before reset");
  assert.deepEqual(signedOutMe.body, { authenticated: false });

  const reset = await imported.fetchJson("/api/auth/complete-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: importedEmail,
      currentPassword: importedUser.temporaryPassword,
      newPassword: replacementPassword,
    }),
  });
  assert.equal(reset.response.status, 200, "imported user complete reset status");
  assert.equal(reset.body.ok, true);
  assert.equal(imported.hasCookie("sc_session"), true, "complete reset creates an active session");

  const importedMe = await imported.fetchJson("/api/auth/me");
  assert.equal(importedMe.response.status, 200, "imported user me after reset");
  assert.equal(importedMe.body.authenticated, true);
  assert.equal(importedMe.body.user.email, importedEmail);
  assert.deepEqual(roleIds(importedMe.body.user.roles), ["student"]);

  const oldCredentialLogin = await new SessionClient().fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: importedEmail, password: importedUser.temporaryPassword }),
  });
  assert.equal(oldCredentialLogin.response.status, 401, "old setup credential is rejected after reset");

  const newCredentialLogin = await new SessionClient().fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: importedEmail, password: replacementPassword }),
  });
  assert.equal(newCredentialLogin.response.status, 200, "replacement password signs in normally");
  assert.equal(newCredentialLogin.body.ok, true);

  const audit = await admin.fetchJson("/api/admin/audit-events?limit=80");
  assert.equal(audit.response.status, 200, "admin audit readback status");
  assert.equal(audit.body.ok, true);
  assert.ok(audit.body.events.some((event) => event.action === "admin_users_import_denied"));
  assert.ok(audit.body.events.some((event) => event.action === "admin_user_imported"));
  assert.ok(audit.body.events.some((event) => event.action === "password_reset_completed"));
  assertNoCredentialLeak(audit.body, [importedUser.temporaryPassword, replacementPassword]);
});

async function fetchTextAsset(pathname) {
  const response = await fetchFromBase(pathname);
  assert.equal(response.status, 200, `${pathname} status`);
  return response.text();
}

function fetchFromBase(pathname, init = {}) {
  return fetch(new URL(pathname, baseUrl), init);
}

function assertSafeProductionCopy(label, text) {
  for (const pattern of forbiddenProductionCopy) {
    assert.doesNotMatch(text, pattern, `${label} contains ${pattern}`);
  }
}

async function assertRoleRoute(accountKey, expectedRoles, route, assertRouteBody) {
  const account = smokeCredentials?.[accountKey];
  assert.ok(account, `${accountKey} credentials available`);
  const client = new SessionClient();

  const login = await client.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  assert.equal(login.response.status, 200, `${accountKey} login status`);

  const me = await client.fetchJson("/api/auth/me");
  assert.equal(me.response.status, 200, `${accountKey} me status`);
  assert.equal(me.body.authenticated, true);
  assert.equal(me.body.user.email, account.email);
  assert.deepEqual(roleIds(me.body.user.roles), expectedRoles);

  const routeResult = await client.fetchJson(route);
  assertRouteBody(routeResult.body, routeResult.response);

  const logout = await client.fetchJson("/api/auth/logout", { method: "POST" });
  assert.equal(logout.response.status, 200, `${accountKey} logout status`);
  assert.equal(client.hasCookie("sc_session"), false, `${accountKey} logout clears session`);
}

function readSmokeCredentials(rawPath) {
  const resolvedPath = path.resolve(process.cwd(), rawPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`WORKSPACE_SMOKE_CREDENTIALS_FILE does not exist: ${rawPath}`);
  }
  const payload = JSON.parse(readFileSync(resolvedPath, "utf8").replace(/^\uFEFF/, ""));
  const byKey = {};
  for (const account of payload.accounts || []) {
    if (!account?.key) continue;
    byKey[account.key] = {
      email: account.email,
      password: account.password,
      roleId: account.roleId,
    };
  }
  return byKey;
}

function roleIds(roles) {
  return (roles || []).map((role) => role.role_id).sort();
}

function uniqueSmokeSuffix() {
  return `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}

function adminImportStudentPayload({ email, displayName }) {
  return {
    email,
    displayName,
    roleId: "student",
    scopeType: "global",
    scopeId: "",
  };
}

function assertNoCredentialLeak(value, credentials) {
  const serialized = JSON.stringify(value);
  for (const credential of credentials) {
    assert.equal(serialized.includes(credential), false, "audit readback exposed a runtime credential");
  }
}

function readSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

class SessionClient {
  #cookies = new Map();

  async fetch(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (this.#cookies.size > 0 && !headers.has("cookie")) {
      headers.set("cookie", this.#cookieHeader());
    }
    const response = await fetchFromBase(pathname, { ...init, headers });
    this.#storeCookies(response.headers);
    return response;
  }

  async fetchJson(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.fetch(pathname, { ...init, headers });
    return { response, body: await response.json() };
  }

  hasCookie(name) {
    return this.#cookies.has(name);
  }

  #cookieHeader() {
    return Array.from(this.#cookies, ([name, value]) => `${name}=${value}`).join("; ");
  }

  #storeCookies(headers) {
    for (const value of readSetCookies(headers)) {
      const [nameValue, ...attributes] = value.split(";");
      const equalsIndex = nameValue.indexOf("=");
      if (equalsIndex === -1) continue;
      const name = nameValue.slice(0, equalsIndex).trim();
      const cookieValue = nameValue.slice(equalsIndex + 1).trim();
      const lowerAttributes = attributes.map((attribute) => attribute.trim().toLowerCase());
      if (!cookieValue || lowerAttributes.includes("max-age=0")) {
        this.#cookies.delete(name);
      } else {
        this.#cookies.set(name, cookieValue);
      }
    }
  }
}
