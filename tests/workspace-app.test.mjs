import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

const workspaceHtml = await readFile("workspace.html", "utf8");
const workspaceJs = await readFile("workspace.js", "utf8");
const workspaceCss = await readFile("workspace.css", "utf8");
const productionSurfaceCheck = await readFile("scripts/check-production-surfaces.mjs", "utf8");

test("workspace route is a real authenticated app surface", () => {
  assert.match(workspaceHtml, /Senior Project Workspace/);
  assert.match(workspaceHtml, /workspace\.js/);
  assert.match(workspaceHtml, /workspace\.css/);
  assert.match(workspaceJs, /\/api\/auth\/me/);
  assert.match(workspaceJs, /\/api\/auth\/login/);
  assert.match(workspaceJs, /\/api\/auth\/change-password/);
  assert.match(workspaceJs, /\/api\/auth\/complete-reset/);
  assert.match(workspaceJs, /\/api\/auth\/logout/);
  assert.match(workspaceJs, /\/api\/admin\/users\/import/);
  assert.match(workspaceJs, /\/api\/student\/dashboard/);
  assert.match(workspaceJs, /\/api\/student\/archive\/readiness/);
  assert.match(workspaceJs, /\/api\/teacher\/review-queue/);
  assert.match(workspaceJs, /\/api\/mentor\/assigned/);
  assert.match(workspaceJs, /\/api\/presentation-slots/);
  assert.match(workspaceJs, /\/api\/presentation-slots\/\$\{encodeURIComponent\(slotId\)\}\/\$\{actionPath\}/);
  assert.match(workspaceJs, /\/api\/reports\/readiness/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(values\.submissionId\)\}\/evidence/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(submissionId\)\}\/evidence\/upload/);
  assert.match(workspaceJs, /Sign in to continue/);
  assert.match(workspaceJs, /data-auth-action="complete-reset"/);
  assert.match(workspaceJs, /data-auth-action="change-password"/);
  assert.match(workspaceJs, /data-admin-action="import-users"/);
  assert.match(workspaceJs, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(workspaceJs, /Create a new password/);
  assert.match(workspaceJs, /Password And Sessions/);
  assert.match(workspaceJs, /Your file was received/);
  assert.match(workspaceJs, /storage is not configured for this environment/);
  assert.match(workspaceJs, /data-workspace-state="\$\{escapeHtml\(workspaceState\)\}"/);
  assert.match(workspaceJs, /"session-expired"/);
  assert.match(workspaceJs, /"account-disabled"/);
  assert.match(workspaceJs, /"reset-required"/);
  assert.match(workspaceJs, /data-workspace-state="no-active-assignment"/);
  assert.match(workspaceJs, /data-presentation-state="\$\{escapeHtml\(status\)\}"/);
  assert.match(workspaceJs, /data-presentation-action="check-out"/);
  assert.match(workspaceJs, /data-presentation-action="check-in"/);
  assert.match(workspaceJs, /data-archive-check-status/);
  assert.match(workspaceJs, /data-archive-download="manifest"/);
  assert.match(workspaceJs, /data-archive-drive-package/);
  assert.doesNotMatch(workspaceJs, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotThrow(() => new Function(workspaceJs));
});

test("workspace production text avoids internal build language", () => {
  const combined = `${workspaceHtml}\n${workspaceJs}\n${workspaceCss}`;
  for (const pattern of [
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
    /\bwireframe\b/i,
  ]) {
    assert.doesNotMatch(combined, pattern);
  }
});

test("production surface checker includes the authenticated workspace", () => {
  assert.match(productionSurfaceCheck, /"workspace\.html"/);
  assert.match(productionSurfaceCheck, /"workspace\.js"/);
  assert.match(productionSurfaceCheck, /"workspace\.css"/);
});

test("workspace evidence forms capture values before disabling controls", () => {
  assert.match(
    workspaceJs,
    /const values = Object\.fromEntries\(new FormData\(form\)\.entries\(\)\);\s+setFormBusy\(form, true\);/,
  );
  assert.match(
    workspaceJs,
    /const formData = new FormData\(form\);\s+const file = formData\.get\("file"\);\s+const submissionId = String\(formData\.get\("submissionId"\) \|\| ""\);\s+setFormBusy\(form, true\);/,
  );
});

test("workspace renders role-pending and permission-denied access states", async () => {
  const expiredSession = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 401,
      body: { authenticated: false, error: "session_expired" },
    },
  });
  assert.match(expiredSession, /data-workspace-state="session-expired"/);
  assert.match(expiredSession, /Your session has ended/);

  const disabledAccount = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 403,
      body: { authenticated: false, error: "account_disabled" },
    },
  });
  assert.match(disabledAccount, /data-workspace-state="account-disabled"/);
  assert.match(disabledAccount, /This account is not active/);

  const resetRequired = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 403,
      body: { authenticated: false, error: "password_reset_required" },
    },
  });
  assert.match(resetRequired, /data-workspace-state="reset-required"/);
  assert.match(resetRequired, /This account needs a password reset/);
  assert.match(resetRequired, /data-auth-action="complete-reset"/);
  assert.match(resetRequired, /Create a new password/);
  assert.match(resetRequired, /Update password/);

  const pending = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "user-without-role",
          email: "pending.person@example.edu",
          displayName: "Pending Person",
          roles: [],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
  });
  assert.match(pending, /data-workspace-state="role-pending"/);
  assert.match(pending, /Workspace access is pending/);
  assert.match(pending, /no workspace role is assigned yet/);

  const denied = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-without-scope",
          email: "student.scope@example.edu",
          displayName: "Scoped Student",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/student/dashboard": {
      status: 403,
      body: { error: "forbidden" },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  });
  assert.match(denied, /data-workspace-state="permission-denied"/);
  assert.match(denied, /Some workspace sections need different access/);
  assert.match(denied, /Student workspace/);

  const noAssignment = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "mentor-without-assignment",
          email: "mentor.assignment@example.edu",
          displayName: "Unassigned Mentor",
          roles: [{ role_id: "mentor", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/mentor/assigned": {
      status: 200,
      body: { ok: true, assignedStudents: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  });
  assert.match(noAssignment, /data-workspace-state="no-active-assignment"/);
  assert.match(noAssignment, /Workspace assignment is not active yet/);
  assert.match(noAssignment, /Mentor students/);
});

test("workspace renders self-service password rotation controls", async () => {
  const security = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-security",
          email: "student.security@example.edu",
          displayName: "Security Student",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/student/dashboard": {
      status: 200,
      body: { ok: true, viewer: { self: true }, progress: [], submissions: [], evidence: [] },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: { ok: true, checks: [], summary: {}, archive: {}, storage: {}, retention: {} },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "security");

  assert.match(security, /Password And Sessions/);
  assert.match(security, /data-auth-action="change-password"/);
  assert.match(security, /\/api\/auth\/change-password/);
  assert.match(security, /other active sessions for this account are closed/);
});

test("workspace renders admin import controls and one-time setup output", async () => {
  const adminUsers = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "admin-users",
          email: "admin.users@example.edu",
          displayName: "Admin User",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/teacher/review-queue": {
      status: 200,
      body: { ok: true, queue: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  }, "adminUsers", `
    lastAdminImportResult = {
      users: [
        {
          email: "new.student@example.edu",
          displayName: "New Student",
          status: "pending_reset",
          temporaryPassword: "N9!aA-setup-zZ",
          role: { roleId: "student", scopeType: "global", scopeId: "" }
        }
      ]
    };
  `);

  assert.match(adminUsers, /data-admin-section="users"/);
  assert.match(adminUsers, /data-admin-action="import-users"/);
  assert.match(adminUsers, /data-admin-endpoint="\/api\/admin\/users\/import"/);
  assert.match(adminUsers, /data-admin-cache="no-store-response"/);
  assert.match(adminUsers, /Import Account/);
  assert.match(adminUsers, /Import reason/);
  assert.match(adminUsers, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(adminUsers, /N9!aA-setup-zZ/);
  assert.match(adminUsers, /pending reset/i);
  assert.match(adminUsers, /must create a new password at first sign-in/i);
});

test("workspace keeps admin import setup output memory-only and gates non-admin import UI", async () => {
  const adminRoutes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "admin-memory-only",
          email: "admin.memory@example.edu",
          displayName: "Admin Memory",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/teacher/review-queue": {
      status: 200,
      body: { ok: true, queue: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  };
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(adminRoutes);

  vm.runInContext(`
    activeSection = "adminUsers";
    lastAdminImportResult = {
      users: [
        {
          email: "memory.only@example.edu",
          displayName: "Memory Only",
          status: "pending_reset",
          temporaryPassword: "Setup-Display-Only-2026!Aa9",
          role: { roleId: "student", scopeType: "global", scopeId: "" }
        }
      ]
    };
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(workspaceRoot.innerHTML, /Setup-Display-Only-2026!Aa9/);

  vm.runInContext(`
    lastAdminImportResult = null;
    renderAppShell("Workspace refreshed.", "success");
  `, context);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-admin-import-result="one-time-setup-passwords"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Setup-Display-Only-2026!Aa9/);

  const nonAdminImport = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "misc-import-denied",
          email: "misc.import@example.edu",
          displayName: "Misc Import",
          roles: [{ role_id: "misc_admin", scope_type: "reporting", scope_id: "alpha-readiness" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "aggregate_only", metrics: {} },
    },
  }, "adminUsers");

  assert.match(nonAdminImport, /data-workspace-state="permission-denied"/);
  assert.match(nonAdminImport, /User import unavailable/);
  assert.doesNotMatch(nonAdminImport, /data-admin-action="import-users"/);
});

test("workspace renders presentation schedule and day-of actions", async () => {
  const presentation = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-a",
          email: "teacher.presentation@example.edu",
          displayName: "Presentation Teacher",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/teacher/review-queue": {
      status: 200,
      body: { ok: true, queue: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [
          {
            id: "slot-scheduled",
            studentName: "Maya Student",
            scheduledFor: "2026-03-26T16:00:00.000Z",
            durationMinutes: 20,
            location: "Room 101",
            status: "scheduled",
            outlineStatus: "approved",
            checkedOutAt: null,
            checkedInAt: null,
          },
          {
            id: "slot-checked-out",
            studentName: "Jordan Student",
            scheduledFor: "2026-03-26T16:30:00.000Z",
            durationMinutes: 15,
            location: "Room 102",
            status: "checked_out",
            outlineStatus: "approved",
            checkedOutAt: "2026-03-26T16:28:00.000Z",
            checkedInAt: null,
          },
        ],
      },
    },
  }, "presentation");

  assert.match(presentation, /data-presentation-state="scheduled"/);
  assert.match(presentation, /data-presentation-state="checked_out"/);
  assert.match(presentation, /Maya Student/);
  assert.match(presentation, /Room 101/);
  assert.match(presentation, /Outline approved/);
  assert.match(presentation, /data-presentation-action="check-out"/);
  assert.match(presentation, /data-presentation-action="check-in"/);
});

test("workspace renders archive readiness from persisted rows", async () => {
  const archive = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-a",
          email: "student.archive@example.edu",
          displayName: "Archive Student",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/announcements": {
      status: 200,
      body: { ok: true, announcements: [] },
    },
    "/api/student/dashboard": {
      status: 200,
      body: {
        ok: true,
        nextAction: "Review archive package readiness.",
        viewer: { self: true },
        progress: [],
        submissions: [],
        evidence: [],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: {
        ok: true,
        source: "persisted_rows",
        summary: {
          readyChecks: 2,
          missingChecks: 1,
          totalChecks: 4,
          archiveAvailableToRequest: false,
        },
        checks: [
          {
            id: "celebration_evidence",
            label: "Celebration Day evidence",
            status: "ready",
            evidenceCount: 2,
            message: "Ready for archive review.",
          },
          {
            id: "ingredient_list_if_needed",
            label: "Ingredient list if food is shared",
            status: "attention_required",
            evidenceCount: 0,
            message: "Needed when food is part of the Celebration Day display.",
          },
        ],
        archive: {
          status: "complete",
          scopedDownloadReady: true,
          signedDownloadReady: false,
          drivePackageReady: true,
          downloadUrl: "/api/exports/export-ready/download",
          downloadExpiresAt: "2026-05-05T16:00:00.000Z",
          message: "Archive package manifest is ready for scoped download.",
        },
        storage: {
          providerStatus: "drive_credentials_missing",
          credentialsConfigured: false,
          drivePackageReady: true,
          storageIdentifiersRedacted: true,
        },
        retention: {
          downloadWindowDays: 14,
          expiryWarningDays: 3,
          policyStatus: "policy_review_required",
          policyReviewRequired: true,
          downloadExpiresSoon: true,
        },
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "archive");

  assert.match(archive, /May 5 Package Readiness/);
  assert.match(archive, /data-archive-check-status="ready"/);
  assert.match(archive, /data-archive-check-status="attention_required"/);
  assert.match(archive, /Celebration Day evidence/);
  assert.match(archive, /data-archive-download="manifest"/);
  assert.match(archive, /Download archive manifest/);
  assert.match(archive, /Private storage identifiers stay hidden/);
  assert.match(archive, /data-archive-drive-package="ready"/);
  assert.match(archive, /Drive-backed archive package is stored/);
  assert.match(archive, /data-archive-retention-status="policy_review_required"/);
  assert.match(archive, /Retention policy needs school review before pilot archives/);
  assert.match(archive, /expiring soon/i);
});

async function renderWorkspaceWithFetch(routes, section = "", beforeSectionScript = "") {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(routes);
  if (section || beforeSectionScript) {
    vm.runInContext(`${beforeSectionScript}\nactiveSection = ${JSON.stringify(section || "overview")}; renderAppShell();`, context);
  }
  return workspaceRoot.innerHTML;
}

async function createWorkspaceContextWithFetch(routes) {
  const workspaceRoot = {
    innerHTML: "",
    querySelectorAll: () => [],
  };
  const inertElement = {
    addEventListener: () => {},
    querySelectorAll: () => [],
    value: "",
  };
  const context = vm.createContext({
    Blob,
    FormData,
    Headers,
    Intl,
    URL,
    clearTimeout,
    console,
    document: {
      querySelector(selector) {
        if (selector === "#workspaceMain") return workspaceRoot;
        return inertElement;
      },
      querySelectorAll: () => [],
    },
    encodeURIComponent,
    fetch: async (url) => {
      const pathname = typeof url === "string" ? url : url?.pathname;
      const route = routes[pathname];
      if (!route) throw new Error(`Unexpected workspace fetch: ${pathname}`);
      return {
        ok: route.status >= 200 && route.status < 300,
        status: route.status,
        json: async () => route.body,
      };
    },
    setTimeout,
  });

  vm.runInContext(workspaceJs, context);
  for (let index = 0; index < 8; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return { context, workspaceRoot };
}
