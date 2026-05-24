import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

const workspaceHtml = await readFile("workspace.html", "utf8");
const workspaceJs = await readFile("workspace.js", "utf8");
const workspaceCss = await readFile("workspace.css", "utf8");
const productionSurfaceCheck = await readFile("scripts/check-production-surfaces.mjs", "utf8");

test("workspace route is a real authenticated app surface", () => {
  assert.match(workspaceHtml, /Capstone Project Workspace/);
  assert.match(workspaceHtml, /workspace\.js/);
  assert.match(workspaceHtml, /workspace\.css/);
  assert.match(workspaceJs, /\/api\/auth\/me/);
  assert.match(workspaceJs, /\/api\/auth\/config/);
  assert.match(workspaceJs, /\/api\/auth\/google\/start\?returnTo=\/workspace\.html/);
  assert.match(workspaceJs, /\/api\/auth\/login/);
  assert.match(workspaceJs, /\/api\/auth\/change-password/);
  assert.match(workspaceJs, /\/api\/auth\/complete-reset/);
  assert.match(workspaceJs, /\/api\/auth\/logout/);
  assert.match(workspaceJs, /\/api\/admin\/users\/import/);
  assert.match(workspaceJs, /\/api\/site\/dashboard/);
  assert.match(workspaceJs, /\/api\/site\/students/);
  assert.match(workspaceJs, /\/api\/admin\/dashboard/);
  assert.match(workspaceJs, /\/api\/program-teacher\/dashboard/);
  assert.match(workspaceJs, /\/api\/mentor\/dashboard/);
  assert.match(workspaceJs, /\/api\/student\/dashboard/);
  assert.match(workspaceJs, /\/api\/student\/archive\/readiness/);
  assert.match(workspaceJs, /\/api\/teacher\/review-queue/);
  assert.match(workspaceJs, /\/api\/mentor\/assigned/);
  assert.match(workspaceJs, /\/api\/presentation-slots/);
  assert.match(workspaceJs, /\/api\/presentation-slots\/\$\{encodeURIComponent\(slotId\)\}\/\$\{actionPath\}/);
  assert.match(workspaceJs, /\/api\/reports\/readiness/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(values\.submissionId\)\}\/evidence/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(attempt\.submissionId\)\}\/evidence\/upload/);
  assert.match(workspaceJs, /\/api\/evidence\/\$\{encodeURIComponent\(row\.id\)\}\/download|data-evidence-download="file"/);
  assert.match(workspaceJs, /data-evidence-link="external"/);
  assert.match(workspaceJs, /Sign in to continue/);
  assert.match(workspaceJs, /data-auth-action="complete-reset"/);
  assert.match(workspaceJs, /data-auth-action="change-password"/);
  assert.match(workspaceJs, /data-admin-action="import-users"/);
  assert.match(workspaceJs, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(workspaceJs, /credential_delivery_policy_required/);
  assert.match(workspaceJs, /Real-user import is blocked until the credential delivery policy is approved/);
  assert.match(workspaceJs, /Create a new password/);
  assert.match(workspaceJs, /Password And Sessions/);
  assert.match(workspaceJs, /Your file was received/);
  assert.match(workspaceJs, /storage is not configured for this environment/);
  assert.match(workspaceJs, /XMLHttpRequest/);
  assert.match(workspaceJs, /data-upload-state/);
  assert.match(workspaceJs, /data-upload-progress/);
  assert.match(workspaceJs, /data-upload-message/);
  assert.match(workspaceJs, /data-upload-action="select-file"/);
  assert.match(workspaceJs, /data-upload-action="retry"/);
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
  assert.match(workspaceJs, /function renderAdminOverviewSection/);
  assert.match(workspaceJs, /function renderSiteDashboardSection/);
  assert.match(workspaceJs, /function renderSiteStudentDirectorySection/);
  assert.match(workspaceJs, /function renderProgramTeacherDashboardSection/);
  assert.match(workspaceJs, /function renderMentorDashboardSection/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(selectedStudentId\)\}/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(siteStudentDetailState\.studentId\)\}\/timeline/);
  assert.match(workspaceJs, /Continue with Google Workspace/);
  assert.match(workspaceJs, /Google Workspace sign-in is not configured for this environment yet/);
  assert.match(workspaceJs, /Local account sign in/);
  assert.doesNotMatch(workspaceJs, /\/api\/announcements/);
  assert.doesNotMatch(workspaceJs, /announcements:\s*null/);
  assert.doesNotMatch(workspaceJs, /Current Updates|No current announcements|workspace-kicker">Announcements/i);
  assert.match(workspaceJs, /Role-Safe Priorities/);
  assert.match(workspaceCss, /--abc-red/);
  assert.match(workspaceCss, /--abc-blue/);
  assert.match(workspaceCss, /\.workspace-app\[data-primary-role="admin"\]/);
  assert.match(workspaceCss, /\.workspace-command-center/);
  assert.match(workspaceCss, /\.workspace-metric-tile/);
  assert.match(workspaceCss, /\.workspace-abc-motif/);
  assert.doesNotMatch(workspaceJs, /data-section="studentDirectory"/);
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

test("workspace exposes Figma-aligned design tokens and future site patterns", () => {
  for (const token of [
    "--color-ink: #172026",
    "--color-muted: #596871",
    "--color-paper: #fbfaf7",
    "--color-surface: #ffffff",
    "--color-blue: #2463a6",
    "--color-green: #22734d",
    "--color-amber: #a65f00",
    "--color-red: #b82f2f",
    "--color-teal: #047b83",
    "--color-violet: #6c4aa3",
    "--color-coral: #c6553d",
    "--color-gold: #d9a441",
    "--color-border: #dce4e5",
    "--color-header: #22303a",
    "--abc-violet: #6c4aa3",
    "--abc-gold: #d9a441",
  ]) {
    assert.ok(workspaceCss.includes(token), `missing exact Figma token alias ${token}`);
  }

  for (const token of [
    "--color-primary",
    "--color-primary-strong",
    "--color-primary-soft",
    "--color-accent",
    "--color-success",
    "--color-warning",
    "--color-danger",
    "--color-info",
    "--surface-page",
    "--surface-card",
    "--border-soft",
    "--shadow-card",
    "--radius-card",
    "--focus-ring",
  ]) {
    assert.ok(workspaceCss.includes(token), `missing workspace token ${token}`);
  }

  for (const className of [
    ".workspace-read-only-banner",
    ".workspace-product-header",
    ".workspace-product-eyebrow",
    ".workspace-product-title",
    ".workspace-product-subtitle",
    ".workspace-posture-chips",
    ".workspace-posture-chip",
    ".workspace-problem-state",
    ".workspace-problem-state-grid",
    ".workspace-problem-state-item",
    ".workspace-problem-state-label",
    ".workspace-problem-state-value",
    ".workspace-site-switcher",
    ".workspace-site-context-badge",
    ".workspace-student-directory",
    ".workspace-filter-bar",
    ".workspace-student-row",
    ".workspace-student-card",
    ".workspace-detail-drawer",
    ".workspace-detail-panel",
    ".workspace-story-chip",
    ".workspace-risk-chip",
    ".workspace-empty-state-card",
  ]) {
    assert.ok(workspaceCss.includes(className), `missing workspace pattern ${className}`);
  }

  assert.match(workspaceJs, /function renderReadOnlyBanner/);
  assert.match(workspaceJs, /data-workspace-mode="read-only"/);
  assert.match(workspaceJs, /site_admin: "Administration"/);
  assert.match(workspaceJs, /platform_admin: "Platform Admin"/);
  assert.match(workspaceJs, /org_admin: "Organization Admin"/);
  assert.match(workspaceJs, /viewer: "Viewer"/);
  assert.match(workspaceJs, /"platform_admin",\s+"admin",\s+"org_admin",\s+"site_admin"/);
  assert.doesNotMatch(`${workspaceHtml}\n${workspaceJs}\n${workspaceCss}`, /client_secret|refresh_token|access_token|private_key|drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|PASSWORD_PEPPER/i);
});

test("workspace uses Phase 6.6 Figma cleanup patterns in real render paths", () => {
  for (const copy of [
    "Database-backed MVP",
    "No student messaging",
    "Cloudflare target",
    "Private evidence",
    "Audit-sensitive admin",
    "Senior Capstone Product",
  ]) {
    assert.ok(workspaceJs.includes(copy), `missing product header copy ${copy}`);
  }

  const signInBlock = workspaceJs.match(/function renderSignIn[\s\S]*?async function signIn/)?.[0] || "";
  const appShellBlock = workspaceJs.match(/function renderAppShell[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(workspaceJs, /function renderProductHeader\(options = \{\}\)/);
  assert.match(signInBlock, /renderProductHeader\(\{\s*titleId: "signInTitle"\s*\}\)/);
  assert.match(appShellBlock, /renderProductHeader\(\{[\s\S]*context: headerContext,[\s\S]*readOnly: roles\.has\("viewer"\)/);
  assert.match(workspaceJs, /chips = WORKSPACE_POSTURE_CHIPS/);

  for (const status of [
    "draft",
    "submitted",
    "under_review",
    "revision_requested",
    "approved",
    "blocked",
    "rejected",
    "overridden",
    "archived",
    "pending",
    "failed",
    "complete",
  ]) {
    assert.match(workspaceJs, new RegExp(`${status}: "${status === "complete" ? "complete" : status}"|${status}: "`));
  }
  assert.match(workspaceJs, /under_review: "Under review"/);
  assert.match(workspaceJs, /revision_requested: "Revision requested"/);
  assert.match(workspaceJs, /function statusClassFor\(status\)/);
  assert.match(workspaceJs, /STATUS_CLASS_BY_STATUS\[normalized\]/);
  assert.match(workspaceJs, /function normalizeStatus\(value\)/);
  assert.match(workspaceJs, /statusClassFor\(status\)/);
  assert.ok((workspaceJs.match(/statusPill\(/g) || []).length > 10, "status helper must be used by existing status surfaces");
  for (const className of [
    ".workspace-status-pill.submitted",
    ".workspace-status-pill.under_review",
    ".workspace-status-pill.approved",
    ".workspace-status-pill.revision_requested",
    ".workspace-status-pill.pending",
    ".workspace-status-pill.draft",
    ".workspace-status-pill.archived",
    ".workspace-status-pill.blocked",
    ".workspace-status-pill.rejected",
    ".workspace-status-pill.failed",
    ".workspace-status-pill.expired",
    ".workspace-status-pill.overridden",
  ]) {
    assert.ok(workspaceCss.includes(className), `missing status CSS ${className}`);
  }

  assert.match(workspaceJs, /function renderProblemState\(\{ reason, owner, nextAction \}\)/);
  assert.match(workspaceJs, /workspace-problem-state/);
  assert.match(workspaceJs, /Reason/);
  assert.match(workspaceJs, /Owner/);
  assert.match(workspaceJs, /Next action/);
  assert.ok((workspaceJs.match(/renderProblemState\(/g) || []).length >= 5, "problem-state helper must be used by multiple real states");
  assert.match(workspaceJs, /data-workspace-state="role-pending"[\s\S]*renderProblemState\(/);
  assert.match(workspaceJs, /data-workspace-state="no-active-assignment"[\s\S]*renderProblemState\(/);
  assert.match(workspaceJs, /data-workspace-state="permission-denied"[\s\S]*renderProblemState\(/);

  assert.match(appShellBlock, /readOnly: roles\.has\("viewer"\)/);
  assert.match(workspaceJs, /data-workspace-mode="read-only"/);
  assert.match(workspaceJs, /Read-only workspace/);
  assert.doesNotMatch(workspaceJs, /\/api\/announcements|\/api\/admin\/announcements|workspace-kicker">Announcements/i);
});

test("workspace renders route-connected site dashboard with Figma product-system patterns", async () => {
  const body = siteDashboardFixture({ readOnly: false });
  const siteDashboard = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-a",
          email: "site.admin@example.edu",
          displayName: "Site Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body,
    },
  }, "siteDashboard");

  assert.match(siteDashboard, /Site Dashboard/);
  assert.match(siteDashboard, /School-wide capstone health/);
  assert.match(siteDashboard, /Desert Valley High School/);
  assert.match(siteDashboard, /Desert Valley School District/);
  assert.match(siteDashboard, /workspace-product-header/);
  assert.match(siteDashboard, /Senior Capstone Product/);
  assert.match(siteDashboard, /Database-backed MVP/);
  assert.match(siteDashboard, /No student messaging/);
  assert.match(siteDashboard, /workspace-site-context-badge/);
  assert.match(siteDashboard, /workspace-metric-tile/);
  assert.match(siteDashboard, /Students/);
  assert.match(siteDashboard, /No Mentor/);
  assert.match(siteDashboard, /Submitted/);
  assert.match(siteDashboard, /Needs Revision/);
  assert.match(siteDashboard, /Evidence/);
  assert.match(siteDashboard, /Presentations/);
  assert.match(siteDashboard, /Archive \/ Exports/);
  assert.match(siteDashboard, /Private evidence/);
  assert.match(siteDashboard, /Role scoped views/);
  assert.match(siteDashboard, /Audited changes/);
  assert.match(siteDashboard, /Teacher intervention/);
  assert.match(siteDashboard, /workspace-status-pill/);
  assert.match(siteDashboard, /workspace-risk-chip/);
  assert.doesNotMatch(siteDashboard, /data-section="studentDirectory"|\/api\/site\/students/);

  const viewer = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-a",
          email: "viewer.site@example.edu",
          displayName: "Site Viewer",
          roles: [{ role_id: "viewer", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true }),
    },
  }, "siteDashboard");
  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only workspace/);
  assert.match(viewer, /Read-only viewer/);
  assert.match(viewer, /This dashboard is scoped to Desert Valley High School only/);

  const selectionRequired = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "org-admin-a",
          email: "org.admin@example.edu",
          displayName: "Org Admin",
          roles: [{ role_id: "org_admin", scope_type: "tenant", scope_id: "tenant-desert-valley" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 409,
      body: {
        ok: false,
        error: "site_selection_required",
        selectionRequired: true,
        accessibleSites: [
          { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
          { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
        ],
      },
    },
  }, "siteDashboard");
  assert.match(selectionRequired, /data-workspace-state="site-selection-required"/);
  assert.match(selectionRequired, /workspace-problem-state/);
  assert.match(selectionRequired, /Reason/);
  assert.match(selectionRequired, /Owner/);
  assert.match(selectionRequired, /Next action/);
});

test("workspace renders route-connected student directory with filters and real detail action", async () => {
  const directoryBody = siteStudentsFixture();
  const siteAdmin = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-students",
          email: "site.students@example.edu",
          displayName: "Site Students Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false }),
    },
    "/api/site/students": {
      status: 200,
      body: directoryBody,
    },
  }, "students");

  assert.match(siteAdmin, /data-section="students"/);
  assert.match(siteAdmin, /Search and filter capstone progress/);
  assert.match(siteAdmin, /workspace-student-directory/);
  assert.match(siteAdmin, /workspace-filter-bar/);
  assert.match(siteAdmin, /workspace-directory-summary/);
  assert.match(siteAdmin, /Showing 2 of 250/);
  assert.match(siteAdmin, /250 total in scope/);
  assert.match(siteAdmin, /workspace-student-row/);
  assert.match(siteAdmin, /workspace-student-card/);
  assert.match(siteAdmin, /Missing Mentor Demo 001/);
  assert.match(siteAdmin, /workspace-story-chip/);
  assert.match(siteAdmin, /Missing mentor/);
  assert.match(siteAdmin, /workspace-risk-chip/);
  assert.match(siteAdmin, /No mentor/);
  assert.match(siteAdmin, /workspace-status-pill revision_requested/);
  assert.match(siteAdmin, /Private evidence/);
  assert.match(siteAdmin, /Role scoped views/);
  assert.match(siteAdmin, /Audited changes/);
  assert.match(siteAdmin, /Teacher intervention/);
  assert.match(siteAdmin, /No student messaging/);
  assert.match(siteAdmin, /View detail/);
  assert.match(siteAdmin, /data-site-student-action="view-detail"/);
  assert.match(siteAdmin, /data-student-detail-id="demo-student-101"/);
  assert.doesNotMatch(siteAdmin, /Detail view coming soon|data-student-detail-disabled="phase-9"|href="[^"]*\/api\/site\/students\/|data-section="studentDetail"|data-section="studentDirectory"/);

  const viewer = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-students",
          email: "viewer.students@example.edu",
          displayName: "Student Directory Viewer",
          roles: [{ role_id: "viewer", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: true }),
    },
  }, "students");
  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only workspace/);
  assert.match(viewer, /Read-only/);
  assert.doesNotMatch(viewer, /Assign mentor|Archive retry|Review action/);

  const teacher = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-students",
          email: "teacher.students@example.edu",
          displayName: "Program Teacher",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 45 }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 3 }, students: [], programBreakdown: [] },
    },
    "/api/teacher/review-queue": {
      status: 200,
      body: { ok: true, queue: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "students");
  assert.match(teacher, /Program Teacher/);
  assert.match(teacher, /45 total in scope/);
  assert.match(teacher, />Information Technology \(45\)</);
  assert.doesNotMatch(teacher, /Culinary/);

  const empty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-empty-students",
          email: "site.empty@example.edu",
          displayName: "Site Empty Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ filteredTotal: 0, students: [] }),
    },
  }, "students");
  assert.match(empty, /data-student-directory-empty="true"/);
  assert.match(empty, /workspace-problem-state/);
  assert.match(empty, /No student records match these filters/);
  assert.match(empty, /Reason/);
  assert.match(empty, /Owner/);
  assert.match(empty, /Next action/);
});

test("workspace opens real student detail, loads timeline, and preserves directory state", async () => {
  const filteredDirectory = siteStudentsFixture({
    readOnly: true,
    filteredTotal: 10,
    filters: {
      search: "Revision Loop Demo",
      programId: "it",
      status: "revision_requested",
      noMentor: false,
      risk: "any",
      story: "revision_requested",
      presentationStatus: "any",
      archiveStatus: "any",
      limit: 50,
      offset: 50,
    },
  });
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-detail",
          email: "viewer.detail@example.edu",
          displayName: "Student Detail Viewer",
          roles: [{ role_id: "viewer", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true }),
    },
    "/api/site/students": {
      status: 200,
      body: filteredDirectory,
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: true }),
    },
    "/api/site/students/demo-student-101/timeline": {
      status: 200,
      body: siteStudentTimelineFixture({ readOnly: true }),
    },
  });

  vm.runInContext('activeSection = "students"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  assert.match(workspaceRoot.innerHTML, /Offset 50 \/ Limit 50/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext('openSiteStudentDetail("demo-student-101")', context);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-panel/);
  assert.match(workspaceRoot.innerHTML, /Student detail/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
  assert.match(workspaceRoot.innerHTML, /workspace-site-context-badge/);
  assert.match(workspaceRoot.innerHTML, /workspace-story-chip/);
  assert.match(workspaceRoot.innerHTML, /workspace-risk-chip/);
  assert.match(workspaceRoot.innerHTML, /Read-only viewer/);
  assert.match(workspaceRoot.innerHTML, /Summary/);
  assert.match(workspaceRoot.innerHTML, /Progress/);
  assert.match(workspaceRoot.innerHTML, /Evidence/);
  assert.match(workspaceRoot.innerHTML, /Reviews &amp; Comments/);
  assert.match(workspaceRoot.innerHTML, /Timeline/);
  assert.match(workspaceRoot.innerHTML, /workspace-status-pill/);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  assert.match(workspaceRoot.innerHTML, /Offset 50 \/ Limit 50/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-review-decision|data-mentor-assignment|data-archive-retry|Request revision|Assign mentor|Archive retry|Download file|Download archive/);

  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "timeline" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="timeline"/);
  assert.match(workspaceRoot.innerHTML, /Timeline event/);
  assert.match(workspaceRoot.innerHTML, /Evidence added/);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  assert.match(workspaceRoot.innerHTML, /Offset 50 \/ Limit 50/);
});

test("workspace gates student directory visibility by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const directoryRoleHelperBlock = workspaceJs.match(/function hasSiteStudentDirectoryRole[\s\S]*?function defaultSiteStudentFilters/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteStudentDirectoryRole\(roles\)/);
  assert.match(workspaceJs, /"platform_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"viewer",\s+"program_teacher"/);
  assert.match(availableSectionsBlock, /id: "students", label: "Students", detail: "Search and filter capstone progress"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteStudentDirectoryRole\(roles\).*\/api\/site\/students/s);
  assert.doesNotMatch(directoryRoleHelperBlock, /"mentor"|"student"|"misc_admin"/);
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
    /const attempt = buildUploadAttemptFromForm\(form\);\s+const validationMessage = validateUploadAttempt\(attempt\);/,
  );
  assert.match(workspaceJs, /function buildUploadAttemptFromForm\(form\)[\s\S]*new FormData\(form\)/);
  assert.match(workspaceJs, /function formDataForUploadAttempt\(attempt\)[\s\S]*formData\.set\("file", attempt\.file/);
});

test("workspace renders upload progress, validation, completion, and retry states safely", async () => {
  const routes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-upload",
          email: "student.upload@senior-capstone.test",
          displayName: "Student Upload",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/student/dashboard": {
      status: 200,
      body: {
        ok: true,
        viewer: { self: true },
        progress: [],
        submissions: [
          {
            id: "submission-upload",
            requirement_title: "Reflection",
            status: "draft",
          },
        ],
        evidence: [],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: { ok: true, checks: [], summary: {}, archive: {}, storage: {}, retention: {} },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  };

  const uploading = await renderWorkspaceWithFetch(routes, "student", `
    uploadState = {
      state: "uploading",
      progress: 64,
      message: "Uploading progress-proof.txt (64%).",
      fileName: "progress-proof.txt",
      fileSize: 2048,
      retryReady: false
    };
  `);
  assert.match(uploading, /data-upload-state="uploading"/);
  assert.match(uploading, /data-upload-progress="64"/);
  assert.match(uploading, /role="progressbar"/);
  assert.match(uploading, /aria-live="polite"/);
  assert.match(uploading, /progress-proof\.txt/);
  assert.match(uploading, /workspace-product-header/);
  assert.match(uploading, /Senior Capstone Product/);
  assert.match(uploading, /No student messaging/);

  const failed = await renderWorkspaceWithFetch(routes, "student", `
    lastUploadAttempt = {
      submissionId: "submission-upload",
      artifactType: "reflection",
      title: "Progress proof",
      file: { name: "progress-proof.txt", size: 2048, type: "text/plain" }
    };
    uploadState = {
      state: "failed",
      progress: 0,
      message: "The storage provider could not receive the file. Try again or contact your instructor.",
      fileName: "progress-proof.txt",
      fileSize: 2048,
      retryReady: true
    };
  `);
  assert.match(failed, /data-upload-state="failed"/);
  assert.match(failed, /data-upload-action="retry"/);
  assert.match(failed, /Retry upload/);
  assert.match(failed, /storage provider could not receive the file/i);

  const complete = await renderWorkspaceWithFetch(routes, "student", `
    uploadState = {
      state: "complete",
      progress: 100,
      message: "Your file was received and added to your evidence.",
      fileName: "progress-proof.txt",
      fileSize: 2048,
      retryReady: false
    };
  `);
  assert.match(complete, /data-upload-state="complete"/);
  assert.match(complete, /data-upload-progress="100"/);
  assert.match(complete, /Your file was received and added to your evidence/);

  assert.match(workspaceJs, /unsupported_file_type/);
  assert.match(workspaceJs, /selected file is empty/i);
  assert.match(workspaceJs, /20 MB limit/);
  assert.doesNotMatch(`${uploading}\n${failed}\n${complete}`, /drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|access_token|refresh_token/i);
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
  });
  assert.match(pending, /data-workspace-state="role-pending"/);
  assert.match(pending, /Workspace access is pending/);
  assert.match(pending, /no workspace role is assigned yet/);
  assert.match(pending, /workspace-problem-state/);
  assert.match(pending, /Reason/);
  assert.match(pending, /Owner/);
  assert.match(pending, /Next action/);

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
  assert.match(denied, /workspace-problem-state/);

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
  assert.match(noAssignment, /No active student records match this assigned view/);

  const viewer = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-read-only",
          email: "viewer.readonly@example.edu",
          displayName: "Readonly Viewer",
          roles: [{ role_id: "viewer", scope_type: "site", scope_id: "west" }],
        },
      },
    },
  });
  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only workspace/);
  assert.match(viewer, /Read-only viewer/);
  assert.match(viewer, /Private evidence/);
});

test("workspace renders safe Google Workspace SSO and local sign-in states", async () => {
  const disabled = await renderWorkspaceWithFetch({
    "/api/auth/config": {
      status: 200,
      body: {
        ok: true,
        authMode: "hardened_username_password",
        googleSsoEnabled: false,
        googleSsoConfigured: false,
        localLoginEnabled: true,
        googleWorkspaceLabel: "Use your school Google Workspace account",
      },
    },
    "/api/auth/me": {
      status: 401,
      body: { authenticated: false },
    },
  });
  assert.match(disabled, /Google Workspace sign-in is not configured for this environment yet/);
  assert.match(disabled, /Local account sign in/);
  assert.match(disabled, /Approved fallback access/);
  assert.doesNotMatch(disabled, /Continue with Google Workspace/);

  const enabled = await renderWorkspaceWithFetch({
    "/api/auth/config": {
      status: 200,
      body: {
        ok: true,
        authMode: "hybrid_google_workspace_local",
        googleSsoEnabled: true,
        googleSsoConfigured: true,
        localLoginEnabled: true,
        googleWorkspaceLabel: "Use your school Google Workspace account",
      },
    },
    "/api/auth/me": {
      status: 401,
      body: { authenticated: false },
    },
  });
  assert.match(enabled, /Continue with Google Workspace/);
  assert.match(enabled, /href="\/api\/auth\/google\/start\?returnTo=\/workspace\.html"/);
  assert.match(enabled, /Local account sign in/);
  assert.match(enabled, /workspace-product-header/);
  assert.match(enabled, /Senior Capstone Product/);
  assert.match(enabled, /Database-backed MVP/);
  assert.match(enabled, /No student messaging/);
  assert.match(enabled, /Cloudflare target/);
  assert.match(enabled, /Private evidence/);
  assert.match(enabled, /Audit-sensitive admin/);
  assert.doesNotMatch(enabled, /client_secret|access_token|refresh_token|id_token/i);
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

test("workspace renders evidence download and external-link actions without storage ids", async () => {
  const student = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-evidence",
          email: "student.evidence@example.edu",
          displayName: "Evidence Student",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/student/dashboard": {
      status: 200,
      body: {
        ok: true,
        viewer: { self: true },
        progress: [],
        submissions: [],
        evidence: [
          {
            id: "evidence-drive",
            title: "Uploaded proposal PDF",
            artifact_type: "planning_document",
            source_kind: "google_drive_file",
            review_status: "pending_review",
            downloadUrl: "/api/evidence/evidence-drive/download",
            fileBytesReady: true,
            storageIdentifiersRedacted: true,
          },
          {
            id: "evidence-link",
            title: "Research link",
            artifact_type: "research_source",
            source_kind: "external_link",
            review_status: "pending_review",
            externalUrl: "https://example.edu/research",
            fileBytesReady: false,
            storageIdentifiersRedacted: true,
          },
        ],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: { ok: true, checks: [], summary: {}, archive: {}, storage: {}, retention: {} },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "student");

  assert.match(student, /data-evidence-download="file"/);
  assert.match(student, /href="\/api\/evidence\/evidence-drive\/download"/);
  assert.match(student, /Download file/);
  assert.match(student, /data-evidence-link="external"/);
  assert.match(student, /href="https:\/\/example\.edu\/research"/);
  assert.match(student, /Open link/);
  assert.doesNotMatch(student, /drive_file_id|driveFileId|drive-secret/i);
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
  assert.match(presentation, /Outline Approved/);
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

function siteDashboardFixture({ readOnly = false } = {}) {
  return {
    ok: true,
    generatedAt: "2026-05-24T16:00:00.000Z",
    scope: {
      tenantId: "tenant-desert-valley",
      tenantName: "Desert Valley School District",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      schoolYear: "2025-2026",
      role: readOnly ? "viewer" : "site_admin",
      readOnly,
      selectionMode: "single_accessible_site",
      accessibleSites: [
        { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
        { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
      ],
    },
    permissions: {
      canViewStudentDirectory: true,
      canViewStudentDetail: true,
      canViewReviewQueue: true,
      canViewMentorAssignments: true,
      canManageMentorAssignments: !readOnly,
      canViewPresentationOperations: true,
      canManagePresentationOperations: !readOnly,
      canViewArchiveOperations: true,
      canManageArchiveOperations: !readOnly,
      canViewReadinessReports: true,
      canViewAuditEvents: !readOnly,
      canManageUsers: false,
      canManageSecurity: false,
    },
    summary: {
      studentsTotal: 250,
      studentsActive: 250,
      studentsNoMentor: 17,
      programsTotal: 9,
      programTeachers: 18,
      mentors: 28,
      submissionsDraft: 18,
      submissionsSubmitted: 46,
      revisionRequested: 38,
      approved: 91,
      completedOrArchived: 18,
      evidenceArtifacts: 690,
      mentorAssignmentsActive: 233,
      presentationsScheduled: 32,
      presentationsPending: 14,
      archiveReady: 8,
      exportsQueued: 2,
      exportsRunning: 1,
      exportsComplete: 8,
      exportsFailed: 1,
      recentActivityCount: 12,
    },
    programBreakdown: [
      { programId: "it", programName: "IT", studentCount: 69, submitted: 14, revisionRequested: 8, approved: 31, evidenceArtifacts: 188, noMentor: 4 },
      { programId: "culinary", programName: "Culinary", studentCount: 47, submitted: 9, revisionRequested: 7, approved: 18, evidenceArtifacts: 122, noMentor: 3 },
    ],
    statusBreakdown: [
      { status: "submitted", count: 46 },
      { status: "revision_requested", count: 38 },
      { status: "approved", count: 91 },
    ],
    needsAttention: [
      {
        label: "Students without active mentors",
        detail: "17 active student records at this site need mentor coverage.",
        severity: "warning",
      },
    ],
    topRiskStudents: [
      {
        studentId: "demo-student-101",
        studentName: "Missing Mentor Demo",
        programName: "IT",
        submissionStatus: "revision_requested",
        evidenceCount: 3,
        riskReasons: ["No mentor", "Revision requested"],
      },
    ],
    mentorCoverage: [
      { mentorId: "demo-mentor-001", mentorName: "Mentor One", activeAssignments: 8 },
      { mentorId: "demo-mentor-002", mentorName: "Mentor Two", activeAssignments: 0 },
    ],
    presentationSnapshot: [
      { status: "scheduled", count: 32 },
      { status: "checked_out", count: 2 },
    ],
    archiveSnapshot: [
      { status: "complete", count: 8 },
      { status: "failed", count: 1 },
    ],
    nextActions: [
      {
        label: "Teacher intervention",
        detail: "84 submitted or revision-requested records need review posture.",
        status: "revision_requested",
      },
      {
        label: "Private evidence",
        detail: "690 private evidence artifacts are counted without exposing storage identifiers.",
        status: "configured",
      },
    ],
  };
}

function siteStudentsFixture({
  readOnly = false,
  role = readOnly ? "viewer" : "site_admin",
  total = 250,
  filteredTotal = total,
  students = null,
  filters = null,
} = {}) {
  const visibleStudents = students ?? [
    {
      studentId: "demo-student-101",
      displayName: "Missing Mentor Demo 001",
      email: "missing.mentor.001@demo-student.capstone.test",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      programId: "it",
      programName: "Information Technology",
      cohortId: "cohort-it-2026",
      cohortName: "IT 2026",
      mentorUserId: "",
      mentorName: "",
      hasActiveMentor: false,
      latestSubmissionId: "submission-101",
      latestSubmissionStatus: "revision_requested",
      latestSubmissionUpdatedAt: "2026-05-20T12:00:00.000Z",
      evidenceCount: 3,
      reviewCount: 1,
      commentCount: 2,
      presentationStatus: "pending",
      archiveStatus: "missing",
      riskScore: 8,
      riskFlags: ["no_mentor", "high"],
      storyBucket: "missing_mentor",
      lastActivityAt: "2026-05-20T12:00:00.000Z",
      nextAction: "Assign or confirm mentor coverage.",
    },
    {
      studentId: "demo-student-144",
      displayName: "Archive Failed Demo 001",
      email: "archive.failed.001@demo-student.capstone.test",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      programId: "it",
      programName: "Information Technology",
      cohortId: "cohort-it-2026",
      cohortName: "IT 2026",
      mentorUserId: "demo-mentor-001",
      mentorName: "Mentor One",
      hasActiveMentor: true,
      latestSubmissionId: "submission-144",
      latestSubmissionStatus: "approved",
      latestSubmissionUpdatedAt: "2026-05-21T12:00:00.000Z",
      evidenceCount: 5,
      reviewCount: 2,
      commentCount: 1,
      presentationStatus: "scheduled",
      archiveStatus: "failed",
      riskScore: 5,
      riskFlags: ["archive_failed"],
      storyBucket: "archive_failed",
      lastActivityAt: "2026-05-21T12:00:00.000Z",
      nextAction: "Review archive export failure.",
    },
  ];
  return {
    ok: true,
    generatedAt: "2026-05-24T16:30:00.000Z",
    scope: {
      tenantId: "tenant-desert-valley",
      tenantName: "Desert Valley School District",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      schoolYear: "2025-2026",
      role,
      readOnly,
      selectionMode: "single_accessible_site",
      accessibleSites: [
        { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      ],
    },
    filters: filters || {
      search: "",
      programId: "",
      status: "",
      noMentor: false,
      risk: "any",
      story: "",
      presentationStatus: "any",
      archiveStatus: "any",
      limit: 50,
      offset: 0,
    },
    pagination: {
      limit: 50,
      offset: 0,
      returned: visibleStudents.length,
      total,
      filteredTotal,
    },
    summary: {
      studentsTotal: total,
      filteredTotal,
      noMentor: 12,
      submitted: 18,
      revisionRequested: 10,
      presentationPending: 9,
      archiveReady: 6,
      archiveFailed: 5,
      highRisk: 7,
    },
    students: visibleStudents,
    filterOptions: {
      programs: [
        { programId: "it", programName: "Information Technology", studentCount: total },
      ],
      statuses: ["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"],
      storyBuckets: ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"],
      risks: ["any", "high", "medium", "low", "stale", "no_mentor"],
      presentationStatuses: ["any", "pending", "scheduled", "completed", "missing"],
      archiveStatuses: ["any", "ready", "complete", "failed", "missing"],
    },
    permissions: {
      canViewStudentDetail: true,
      canViewStudentEvidence: true,
      canViewReviewQueue: true,
      canManageMentorAssignments: !readOnly && role !== "program_teacher",
      canViewPresentationOperations: true,
      canViewArchiveOperations: true,
      canManageUsers: false,
      canManageSecurity: false,
    },
    emptyState: filteredTotal === 0 ? {
      reason: "No student records match the selected filters.",
      owner: "Assigned staff or site administrator.",
      nextAction: "Adjust filters or check the student's project status.",
    } : null,
  };
}

function siteStudentDetailFixture({ readOnly = false } = {}) {
  return {
    ok: true,
    generatedAt: "2026-05-24T16:45:00.000Z",
    scope: {
      tenantId: "tenant-desert-valley",
      tenantName: "Desert Valley School District",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      schoolYear: "2025-2026",
      role: readOnly ? "viewer" : "site_admin",
      readOnly,
      selectionMode: "single_accessible_site",
      studentId: "demo-student-101",
      accessibleSites: [{ siteId: "site-desert-valley-high", siteName: "Desert Valley High School" }],
    },
    student: {
      studentId: "demo-student-101",
      displayName: "Missing Mentor Demo 001",
      email: "missing.mentor.001@demo-student.capstone.test",
      status: "revision_requested",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      programId: "it",
      programName: "Information Technology",
      cohortId: "cohort-it-2026",
      cohortName: "IT 2026",
      storyBucket: "missing_mentor",
      riskScore: 8,
      riskFlags: ["no_mentor", "high"],
      latestSubmissionStatus: "revision_requested",
      lastActivityAt: "2026-05-20T12:00:00.000Z",
      evidenceCount: 3,
      reviewCount: 1,
      commentCount: 2,
      presentationStatus: "pending",
      archiveStatus: "missing",
      nextAction: "Assign or confirm mentor coverage.",
    },
    mentor: {
      mentorUserId: "",
      mentorName: "",
      active: false,
      assignedAt: "",
      meetingCount: 0,
      latestMeetingAt: "",
      latestMeetingStatus: "",
      nextAction: "Assign or confirm mentor coverage.",
    },
    progress: {
      requirementsTotal: 8,
      requirementsComplete: 3,
      percentComplete: 38,
      currentStage: "proposal",
      blockedReasons: ["no_mentor", "revision_requested"],
      nextAction: "Resolve the visible blockers before closeout.",
    },
    submissions: [
      {
        submissionId: "submission-101",
        requirementTitle: "Project proposal",
        status: "revision_requested",
        version: 2,
        updatedAt: "2026-05-20T12:00:00.000Z",
        evidenceCount: 3,
        nextAction: "Student revision is needed before approval.",
      },
    ],
    evidence: [
      {
        evidenceId: "evidence-101",
        title: "Research plan",
        artifactType: "research",
        sourceKind: "external_link",
        reviewStatus: "pending_review",
        createdAt: "2026-05-19T12:00:00.000Z",
        externalUrl: "https://example.com/capstone-demo/student101/research",
        storageIdentifiersRedacted: true,
      },
    ],
    reviews: [
      {
        reviewId: "review-101",
        requirementTitle: "Project proposal",
        decision: "revision_requested",
        feedback: "Revision requested. Add one measurable success criteria.",
        reviewerName: "Program Teacher",
        createdAt: "2026-05-20T12:00:00.000Z",
      },
    ],
    comments: [
      {
        commentId: "comment-101",
        visibility: "student_and_staff",
        body: "Use the rubric to tighten the next draft.",
        authorName: "Program Teacher",
        createdAt: "2026-05-20T12:10:00.000Z",
      },
    ],
    statusHistory: [
      {
        statusHistoryId: "status-101",
        fromStatus: "submitted",
        toStatus: "revision_requested",
        reason: "Revision requested after teacher feedback.",
        changedByName: "Program Teacher",
        createdAt: "2026-05-20T12:00:00.000Z",
      },
    ],
    mentorMeetings: [],
    presentation: {
      status: "pending",
      scheduledAt: "2026-05-28T17:00:00.000Z",
      room: "Demo Room 101",
      outlineStatus: "pending",
      checkInStatus: "scheduled",
      nextAction: "Resolve outline readiness before presentation.",
    },
    archive: {
      status: "missing",
      exportStatus: "not_requested",
      ready: false,
      failed: false,
      artifactCount: 0,
      storageIdentifiersRedacted: true,
      nextAction: "Prepare archive readiness checks when the student reaches closeout.",
    },
    timelinePreview: [
      {
        id: "timeline-101-review",
        type: "review",
        occurredAt: "2026-05-20T12:00:00.000Z",
        title: "Review Revision requested",
        summary: "Revision requested. Add one measurable success criteria.",
        status: "revision_requested",
      },
    ],
    timeline: {
      strategy: "separate_route_with_preview",
      route: "/api/site/students/demo-student-101/timeline",
      previewLimit: 10,
    },
    permissions: {
      canViewStudentEvidence: true,
      canDownloadStudentEvidence: false,
      canViewReviewQueue: true,
      canMutateReviewDecision: false,
      canAddStaffNote: false,
      canManageMentorAssignments: false,
      canViewPresentationOperations: true,
      canManagePresentationOperations: false,
      canViewArchiveOperations: true,
      canManageArchiveOperations: false,
      canManageUsers: false,
      canManageSecurity: false,
    },
    visibility: {
      mode: readOnly ? "viewer_read_only" : "admin_operational",
      staffOnlyComments: "included_when_scoped",
      adminContext: readOnly ? "omitted" : "included_when_scoped",
      unsafeStorageIdentifiers: "redacted",
    },
    limits: {
      submissions: 5,
      evidence: 10,
      reviews: 10,
      comments: 10,
      statusHistory: 10,
      mentorMeetings: 5,
      timelinePreview: 10,
    },
  };
}

function siteStudentTimelineFixture({ readOnly = false } = {}) {
  return {
    ok: true,
    generatedAt: "2026-05-24T16:46:00.000Z",
    scope: {
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      role: readOnly ? "viewer" : "site_admin",
      readOnly,
      studentId: "demo-student-101",
    },
    pagination: {
      limit: 50,
      offset: 0,
      returned: 2,
      hasMore: false,
    },
    filters: { type: "" },
    events: [
      {
        id: "timeline-101-event",
        type: "evidence",
        occurredAt: "2026-05-21T12:00:00.000Z",
        title: "Evidence added",
        summary: "Timeline event with storage identifiers redacted.",
        actorName: "Student",
        status: "pending_review",
        reason: "",
        owner: "Student",
        nextAction: "Review evidence context in the evidence section.",
      },
      {
        id: "timeline-101-review",
        type: "review",
        occurredAt: "2026-05-20T12:00:00.000Z",
        title: "Review Revision requested",
        summary: "Revision requested. Add one measurable success criteria.",
        actorName: "Program Teacher",
        status: "revision_requested",
        reason: "Revision requested. Add one measurable success criteria.",
        owner: "Program teacher",
        nextAction: "Track the revision loop and next student submission.",
      },
    ],
  };
}

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
    URLSearchParams,
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
      const rawPath = typeof url === "string" ? url : url?.pathname;
      const pathname = String(rawPath || "").startsWith("http")
        ? new URL(rawPath).pathname
        : String(rawPath || "").split("?")[0];
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
