#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const DEFAULT_BASE_URL = "https://senior-capstone-app.pages.dev";
const DEFAULT_CREDENTIALS_FILE = ".secrets/test-accounts-2026-05-18.json";
const DEFAULT_SITE_ID = "site-test-high-school";

class WorkspacePermissionCheckError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "WorkspacePermissionCheckError";
    this.classification = classification;
    this.details = details;
  }
}

class SessionClient {
  #cookies = new Map();

  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (this.#cookies.size > 0 && !headers.has("cookie")) headers.set("cookie", this.#cookieHeader());
    const response = await fetch(new URL(pathname, this.baseUrl), { ...init, headers });
    this.#storeCookies(response.headers);
    return response;
  }

  async fetchJson(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.fetch(pathname, { ...init, headers });
    const body = await response.json().catch(() => null);
    return { response, body };
  }

  #cookieHeader() {
    return Array.from(this.#cookies, ([name, value]) => `${name}=${value}`).join("; ");
  }

  #storeCookies(headers) {
    const values = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];
    for (const value of values) {
      const [nameValue, ...attributes] = value.split(";");
      const equalsIndex = nameValue.indexOf("=");
      if (equalsIndex === -1) continue;
      const name = nameValue.slice(0, equalsIndex).trim();
      const cookieValue = nameValue.slice(equalsIndex + 1).trim();
      const lowerAttributes = attributes.map((attribute) => attribute.trim().toLowerCase());
      if (!cookieValue || lowerAttributes.includes("max-age=0")) this.#cookies.delete(name);
      else this.#cookies.set(name, cookieValue);
    }
  }
}

function containsForbiddenStorageLeak(value) {
  return /drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|access_token|refresh_token|BEGIN PRIVATE KEY|GOOGLE_DRIVE_PRIVATE_KEY/i
    .test(JSON.stringify(value));
}

function assertNoStorageLeak(value, label) {
  if (containsForbiddenStorageLeak(value)) {
    throw new WorkspacePermissionCheckError(
      "storage_id_leak",
      `${label} exposed a forbidden storage identifier or secret marker.`,
    );
  }
}

function archiveManifestDownloadCheck(status, reason) {
  return {
    name: "student_archive_manifest_download",
    status,
    readinessCategory: "future_pilot_item",
    requiredForHostedFakeAccountDemoDay: false,
    liveDemoBlocker: false,
    reason,
  };
}

function assertHostedWorkspaceSafe(text, label) {
  for (const [name, pattern] of [
    ["alpha route link", /\bhref=["'][^"']*alpha\.html\b/i],
    ["account route link", /\bhref=["'][^"']*account\.html\b/i],
    ["persona switcher", /\bpersona\s+switch/i],
    ["smoke shortcut", /\bsmoke\s+test\b/i],
    ["fake account shortcut", /\bfake\s+account\b/i],
    ["debug output", /\bdebug\s+output\b/i],
  ]) {
    if (pattern.test(text)) {
      throw new WorkspacePermissionCheckError("production_surface_leak", `${label} exposes ${name}.`);
    }
  }
  assertNoStorageLeak(text, label);
}

function readCredentialFile(relativePath) {
  const resolvedPath = path.resolve(repoRoot, relativePath);
  if (!existsSync(resolvedPath)) return [];
  const payload = JSON.parse(readFileSync(resolvedPath, "utf8").replace(/^\uFEFF/, ""));
  return Array.isArray(payload.accounts) ? payload.accounts : [];
}

function directCredential(prefix, roleId) {
  const email = process.env[`WORKSPACE_SMOKE_${prefix}_EMAIL`];
  const password = process.env[`WORKSPACE_SMOKE_${prefix}_PASSWORD`];
  return email && password ? { key: prefix.toLowerCase(), email, password, roleId } : null;
}

function credentialsByRole() {
  const credentialFile = process.env.WORKSPACE_SMOKE_CREDENTIALS_FILE
    || process.env.DRIVE_LIVE_CREDENTIALS_FILE
    || DEFAULT_CREDENTIALS_FILE;
  const accounts = readCredentialFile(credentialFile);
  for (const direct of [
    directCredential("STUDENT", "student"),
    directCredential("PROGRAM_TEACHER", "program_teacher"),
    directCredential("MENTOR", "mentor"),
    directCredential("VIEWER", "viewer"),
    directCredential("MISC_ADMIN", "misc_admin"),
    directCredential("SITE_ADMIN", "site_admin"),
    directCredential("ADMIN", "admin"),
    directCredential("RESET_REQUIRED", "reset_required"),
    directCredential("ROLE_PENDING", "role_pending"),
    directCredential("NO_ASSIGNMENT", "no_assignment"),
  ]) {
    if (direct) accounts.push(direct);
  }

  const byRole = new Map();
  for (const account of accounts) {
    if (!account?.email || !account?.password) continue;
    const roleId = normalizeRoleId(account);
    if (roleId && !byRole.has(roleId)) byRole.set(roleId, account);
  }
  return { byRole, credentialFilePresent: existsSync(path.resolve(repoRoot, credentialFile)) };
}

function normalizeRoleId(account) {
  const value = String(account.roleId || account.role_id || account.key || account.email || "").trim().toLowerCase();
  if (!value) return "";
  if (value.includes("site_admin") || value.includes("site-admin") || value.includes("site admin") || value.includes("siteadmin")) return "site_admin";
  if (value.includes("misc")) return "misc_admin";
  if (value.includes("viewer")) return "viewer";
  if (value.includes("program_teacher") || value.includes("teacher")) return "program_teacher";
  if (value.includes("mentor")) return "mentor";
  if (value.includes("admin")) return "admin";
  if (value.includes("student")) return "student";
  if (["student", "mentor", "viewer", "program_teacher", "admin", "misc_admin", "site_admin"].includes(value)) return value;
  return value;
}

function requireFakeAccount(account, roleId) {
  if (!account) return null;
  if (!String(account.email).endsWith(".test")) {
    throw new WorkspacePermissionCheckError(
      "credential_setup",
      `Hosted workspace permission proof refused a non-.test ${roleId} credential.`,
      { roleId },
    );
  }
  return account;
}

async function login(client, account, roleId) {
  const result = await client.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  if (result.response.status !== 200 || result.body?.ok !== true) {
    throw new WorkspacePermissionCheckError("auth_session", `${roleId} fake .test login failed.`, {
      roleId,
      status: result.response.status,
      error: result.body?.error || null,
    });
  }
  assertNoStorageLeak(result.body, `${roleId} login response`);
  return result.body;
}

function roleIdsFromMe(body) {
  const roles = Array.isArray(body?.user?.roles) ? body.user.roles : [];
  return roles.map((role) => role.role_id || role.roleId).filter(Boolean);
}

async function expectJson(client, pathname, expectedStatus, label, init = {}) {
  const result = await client.fetchJson(pathname, init);
  if (result.response.status !== expectedStatus) {
    throw new WorkspacePermissionCheckError("permission_scope", `${label} returned an unexpected status.`, {
      expectedStatus,
      actualStatus: result.response.status,
      error: result.body?.error || null,
    });
  }
  assertNoStorageLeak(result.body, label);
  return result.body;
}

function expectBody(condition, label, details = {}) {
  if (!condition) {
    throw new WorkspacePermissionCheckError("permission_scope", `${label} returned an unexpected body.`, details);
  }
}

async function verifyRole(baseUrl, roleId, account, context = {}) {
  const client = new SessionClient(baseUrl);
  const loginBody = await login(client, account, roleId);
  const me = await expectJson(client, "/api/auth/me", 200, `${roleId} /api/auth/me`);
  const roleIds = roleIdsFromMe(me);
  if (!roleIds.includes(roleId)) {
    throw new WorkspacePermissionCheckError("permission_scope", `${roleId} session restored without expected role.`, {
      roleId,
      roleIds,
    });
  }

  const checks = [];
  if (roleId === "student") {
    const dashboard = await expectJson(client, "/api/student/dashboard", 200, "student dashboard");
    const archiveReadiness = await expectJson(client, "/api/student/archive/readiness", 200, "student archive readiness");
    const presentationSlots = await expectJson(client, "/api/presentation-slots", 200, "student presentation slots");
    const studentId = loginBody?.user?.id || me?.user?.id || "";
    if (studentId && Array.isArray(presentationSlots.slots)) {
      const outOfScopeSlot = presentationSlots.slots.find((slot) => slot?.studentId && slot.studentId !== studentId);
      if (outOfScopeSlot) {
        throw new WorkspacePermissionCheckError("permission_scope", "Student presentation slots included another student's protected record.", {
          roleId,
          studentId,
        });
      }
    }
    checks.push({ name: "student_dashboard", status: dashboard.ok === true ? "passed" : "unexpected_body" });
    checks.push({ name: "student_archive_readiness", status: archiveReadiness.ok === true ? "passed" : "unexpected_body" });
    checks.push({ name: "student_presentation_scope", status: "passed" });
    if (archiveReadiness?.archive?.downloadUrl) {
      const archiveDownload = await client.fetch(archiveReadiness.archive.downloadUrl, {
        headers: { accept: "application/json" },
      });
      const contentType = archiveDownload.headers.get("content-type") || "";
      if (archiveDownload.status === 200 && contentType.includes("application/json")) {
        const manifest = await archiveDownload.json().catch(() => null);
        assertNoStorageLeak(manifest, "student archive manifest download");
        checks.push(archiveManifestDownloadCheck(
          "passed",
          "Scoped app archive manifest download returned redacted JSON without storage leaks.",
        ));
      } else {
        checks.push(archiveManifestDownloadCheck(
          "skipped_not_ready",
          "Future pilot item: no scoped student archive manifest download is available for this fake account yet.",
        ));
      }
    } else {
      checks.push(archiveManifestDownloadCheck(
        "skipped_not_ready",
        "Future pilot item: student archive readiness did not expose a scoped manifest download URL.",
      ));
    }
  } else if (roleId === "program_teacher") {
    await expectJson(client, "/api/teacher/review-queue", 200, "program teacher review queue");
    const presentationSlots = await expectJson(client, "/api/presentation-slots", 200, "program teacher presentation slots");
    checks.push({ name: "teacher_scope", status: "passed" });
    checks.push({ name: "teacher_presentation_dashboard", status: Array.isArray(presentationSlots.slots) ? "passed" : "unexpected_body" });
  } else if (roleId === "mentor") {
    await expectJson(client, "/api/mentor/assigned", 200, "mentor assigned students");
    const presentationSlots = await expectJson(client, "/api/presentation-slots", 200, "mentor presentation slots");
    checks.push({ name: "mentor_scope", status: "passed" });
    checks.push({ name: "mentor_presentation_dashboard", status: Array.isArray(presentationSlots.slots) ? "passed" : "unexpected_body" });
  } else if (roleId === "viewer") {
    const siteId = context.siteId || DEFAULT_SITE_ID;
    const students = await expectJson(client, `/api/site/students?siteId=${encodeURIComponent(siteId)}`, 200, "viewer site student directory");
    expectBody(students?.scope?.readOnly === true, "viewer site student directory", { roleId, siteId, expectedReadOnly: true });
    expectBody(students?.permissions?.canManageUsers === false, "viewer manage users denial", { roleId, siteId });
    expectBody(students?.permissions?.canManageSiteUsers === false, "viewer manage site users denial", { roleId, siteId });
    expectBody(students?.permissions?.canViewReviewQueue === false, "viewer review queue permission denial", { roleId, siteId });
    await expectJson(client, `/api/site/dashboard?siteId=${encodeURIComponent(siteId)}`, 403, "viewer site dashboard denial");
    await expectJson(client, `/api/site/review-queue?siteId=${encodeURIComponent(siteId)}`, 403, "viewer review queue denial");
    await expectJson(client, `/api/site/access-assignments?siteId=${encodeURIComponent(siteId)}`, 403, "viewer access assignment denial");
    await expectJson(client, "/api/presentation-slots", 403, "viewer presentation denial");
    checks.push({ name: "viewer_read_only_directory", status: "passed" });
    checks.push({ name: "viewer_mutation_denials", status: "passed" });
  } else if (roleId === "misc_admin") {
    await expectJson(client, "/api/admin/users/import", 403, "misc admin import denial", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reason: "Hosted permission proof",
        users: [
          {
            email: "hosted-denied-viewer@senior-capstone.test",
            displayName: "Hosted Denied Viewer",
            roleId: "viewer",
            identityType: "local",
            studentIds: ["test_user_student_maya"],
          },
        ],
      }),
    });
    await expectJson(client, "/api/presentation-slots", 403, "misc admin presentation denial");
    checks.push({ name: "misc_admin_denial", status: "passed" });
    checks.push({ name: "misc_admin_presentation_denial", status: "passed" });
  } else if (roleId === "admin") {
    await expectJson(client, "/api/reports/readiness", 200, "admin readiness report");
    await expectJson(client, "/api/presentation-slots", 200, "admin presentation slots");
    if (context.studentId) {
      await expectJson(
        client,
        `/api/student/archive/readiness?studentId=${encodeURIComponent(context.studentId)}`,
        200,
        "admin student archive readiness",
      );
      checks.push({ name: "admin_archive_dashboard", status: "passed" });
    }
    checks.push({ name: "admin_allowed_path", status: "passed" });
  } else if (roleId === "site_admin") {
    const siteId = context.siteId || DEFAULT_SITE_ID;
    const dashboard = await expectJson(client, `/api/site/dashboard?siteId=${encodeURIComponent(siteId)}`, 200, "site admin dashboard");
    expectBody(dashboard?.scope?.readOnly === false, "site admin dashboard", { roleId, siteId, expectedReadOnly: false });
    const students = await expectJson(client, `/api/site/students?siteId=${encodeURIComponent(siteId)}`, 200, "site admin student directory");
    expectBody(students?.permissions?.canManageSiteUsers === true, "site admin site-user permission", { roleId, siteId });
    expectBody(students?.permissions?.canManageUsers === false, "site admin global-user denial", { roleId, siteId });
    const assignments = await expectJson(client, `/api/site/access-assignments?siteId=${encodeURIComponent(siteId)}`, 200, "site admin access assignments");
    expectBody(assignments?.permissions?.canAssignViewers === true, "site admin viewer assignment permission", { roleId, siteId });
    expectBody(assignments?.permissions?.canAssignSiteAdmins === false, "site admin site-admin assignment denial", { roleId, siteId });
    expectBody(assignments?.permissions?.canCreateGlobalAdmin === false, "site admin global-admin creation denial", { roleId, siteId });
    const readiness = await expectJson(client, "/api/reports/readiness", 200, "site admin aggregate readiness report");
    expectBody(readiness?.scope === "aggregate_only", "site admin aggregate readiness report", { roleId, siteId });
    await expectJson(client, "/api/presentation-slots", 200, "site admin presentation slots");
    checks.push({ name: "site_admin_site_operations", status: "passed" });
    checks.push({ name: "site_admin_readiness_dashboard", status: "passed" });
    checks.push({ name: "site_admin_privilege_boundary", status: "passed" });
  }

  await client.fetchJson("/api/auth/logout", { method: "POST" });
  return { roleId, status: "passed", userId: loginBody?.user?.id || me?.user?.id || null, checks };
}

async function runHostedWorkspacePermissionCheck() {
  const baseUrl = new URL(process.env.WORKSPACE_SMOKE_BASE_URL || process.env.DRIVE_LIVE_BASE_URL || DEFAULT_BASE_URL);
  const { byRole, credentialFilePresent } = credentialsByRole();
  const logs = [];
  const log = (message) => {
    logs.push(message);
    console.log(message);
  };

  log(`Hosted workspace permission proof target: ${baseUrl.origin}`);

  const workspaceHtml = await fetch(new URL("/workspace.html", baseUrl));
  const workspaceJs = await fetch(new URL("/workspace.js", baseUrl));
  if (workspaceHtml.status !== 200 || workspaceJs.status !== 200) {
    throw new WorkspacePermissionCheckError("hosted_deployment_stale", "Hosted canonical workspace assets did not load.", {
      workspaceHtmlStatus: workspaceHtml.status,
      workspaceScriptStatus: workspaceJs.status,
    });
  }
  const workspaceText = `${await workspaceHtml.text()}\n${await workspaceJs.text()}`;
  assertHostedWorkspaceSafe(workspaceText, "hosted workspace assets");
  const workspaceMarkers = [
    { name: "no_assignment_state", marker: 'data-workspace-state="no-active-assignment"' },
    { name: "dynamic_auth_state", marker: 'data-workspace-state="${escapeHtml(workspaceState)}"' },
    { name: "role_pending_state", marker: '"role-pending"' },
    { name: "permission_denied_state", marker: '"permission-denied"' },
    { name: "session_expired_state", marker: '"session-expired"' },
    { name: "reset_required_state", marker: '"reset-required"' },
    { name: "presentation_state", marker: 'data-presentation-state="${escapeHtml(status)}"' },
    { name: "archive_check_status", marker: "data-archive-check-status" },
    { name: "archive_manifest_download", marker: 'data-archive-download="manifest"' },
    { name: "archive_drive_package", marker: "data-archive-drive-package" },
    { name: "admin_import", marker: 'data-admin-action="import-users"' },
  ];
  for (const { marker } of workspaceMarkers) {
    if (!workspaceText.includes(marker)) {
      throw new WorkspacePermissionCheckError("workspace_ui_bug", `Hosted workspace is missing expected marker ${marker}.`);
    }
  }
  log("PASS workspace: canonical assets loaded with production-safe role-state markers and no internal shortcuts.");

  const signedOut = new SessionClient(baseUrl);
  const me = await signedOut.fetchJson("/api/auth/me");
  if (![401, 403].includes(me.response.status) && me.body?.authenticated !== false) {
    throw new WorkspacePermissionCheckError("auth_session", "Signed-out /api/auth/me did not return a safe unauthenticated state.", {
      status: me.response.status,
    });
  }
  assertNoStorageLeak(me.body, "signed-out /api/auth/me");
  log("PASS signed-out: hosted auth state is safely unauthenticated.");

  const requiredRoles = ["student", "program_teacher", "mentor", "viewer", "misc_admin", "site_admin", "admin"];
  const roleResults = [];
  const missingRoles = requiredRoles.filter((roleId) => !byRole.has(roleId));
  if (missingRoles.length > 0) {
    throw new WorkspacePermissionCheckError(
      "credential_setup",
      "Hosted workspace permission proof requires fake .test credentials for all required roles.",
      { missingRoles, credentialFilePresent },
    );
  }
  const proofContext = { siteId: process.env.WORKSPACE_SMOKE_SITE_ID || DEFAULT_SITE_ID };
  for (const roleId of requiredRoles) {
    const account = requireFakeAccount(byRole.get(roleId), roleId);
    const roleResult = await verifyRole(baseUrl, roleId, account, proofContext);
    if (roleId === "student" && roleResult.userId) proofContext.studentId = roleResult.userId;
    roleResults.push(roleResult);
    log(`PASS role: ${roleId} hosted permission check passed.`);
  }

  return {
    ok: true,
    skipped: false,
    baseUrl: baseUrl.origin,
    credentialFilePresent,
    missingRoles,
    roleResults,
    security: {
      noSecretValuesPrinted: true,
      rawDriveIdsInBrowserOutput: false,
      realStudentDataUsed: false,
      fakeTestAccountsOnly: true,
    },
    roleStateMarkers: workspaceMarkers.map(({ name }) => ({ name, status: "asset_marker_present" })),
    logs,
  };
}

export { WorkspacePermissionCheckError, runHostedWorkspacePermissionCheck };

try {
  const result = await runHostedWorkspacePermissionCheck();
  if (result.skipped) console.log(result.message);
  console.log(JSON.stringify({
    ok: result.ok,
    skipped: result.skipped,
    baseUrl: result.baseUrl,
    credentialFilePresent: result.credentialFilePresent,
    missingRoles: result.missingRoles,
    roleResults: result.roleResults,
    roleStateMarkers: result.roleStateMarkers,
  }, null, 2));
} catch (error) {
  if (error instanceof WorkspacePermissionCheckError) {
    console.error(`Hosted workspace permission proof failed: ${error.classification}: ${error.message}`);
    if (error.details && Object.keys(error.details).length > 0) {
      console.error(`Redacted details: ${JSON.stringify(error.details)}`);
    }
  } else {
    console.error(`Hosted workspace permission proof failed: unknown: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
}
