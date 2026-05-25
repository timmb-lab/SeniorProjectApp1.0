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
  assert.match(workspaceJs, /\/api\/site\/review-queue/);
  assert.match(workspaceJs, /\/api\/site\/mentor-assignments/);
  assert.match(workspaceJs, /\/api\/site\/operations-readiness/);
  assert.match(workspaceJs, /\/api\/reviews\/\$\{encodeURIComponent\(selectedSubmissionId\)\}\/history/);
  assert.match(workspaceJs, /\/api\/reviews\/\$\{encodeURIComponent\(submissionId\)\}\/decision/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(submissionId\)\}\/submit/);
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
  assert.match(workspaceJs, /data-archive-guidance="true"/);
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
  assert.match(workspaceJs, /Your workspace priorities/);
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
    ".workspace-menu-toggle",
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
    ".workspace-tab-short",
    ".workspace-site-context-badge",
    ".workspace-student-directory",
    ".workspace-filter-bar",
    ".workspace-student-row",
    ".workspace-student-card",
    ".workspace-detail-drawer",
    ".workspace-detail-panel",
    ".workspace-review-queue",
    ".workspace-review-layout",
    ".workspace-review-panel",
    ".workspace-review-feedback",
    ".workspace-mentor-assignments",
    ".workspace-mentor-assignment-layout",
    ".workspace-operations-readiness",
    ".workspace-operations-layout",
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
    "School workspace",
    "Student progress",
    "Private evidence",
    "Mentor coverage",
    "Review queue",
    "Presentation readiness",
    "Capstone Project Workspace",
  ]) {
    assert.ok(workspaceJs.includes(copy), `missing product header copy ${copy}`);
  }
  assert.doesNotMatch(workspaceJs, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);

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
  assert.match(siteDashboard, /Capstone Project Workspace/);
  assert.match(siteDashboard, /School workspace/);
  assert.match(siteDashboard, /Student progress/);
  assert.match(siteDashboard, /Mentor coverage/);
  assert.doesNotMatch(siteDashboard, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);
  assert.match(siteDashboard, /workspace-site-context-badge/);
  assert.match(siteDashboard, /workspace-metric-tile/);
  assert.match(siteDashboard, /Students/);
  assert.match(siteDashboard, /No Mentor/);
  assert.match(siteDashboard, /data-section="students" data-section-preset="missing-mentors">View students/);
  assert.match(siteDashboard, /data-section="mentorAssignments" data-section-preset="mentor-workload" data-mentor-id="demo-mentor-001"/);
  assert.match(siteDashboard, /View load/);
  assert.match(siteDashboard, /data-section="students" data-section-preset="program" data-program-id="it"/);
  assert.match(siteDashboard, /View students/);
  assert.match(siteDashboard, /data-section="students" data-section-preset="status-breakdown" data-status-filter="submitted"/);
  assert.match(siteDashboard, /data-section="students" data-section-preset="status-breakdown" data-status-filter="revision_requested"/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="submitted">Review/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="revision-requested">Review/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="presentation-pending">Review/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="archive-failed">Review/);
  assert.match(siteDashboard, /Submitted/);
  assert.match(siteDashboard, /Needs Revision/);
  assert.match(siteDashboard, /Evidence/);
  assert.match(siteDashboard, /Presentations/);
  assert.match(siteDashboard, /Archive \/ Exports/);
  assert.match(siteDashboard, /Private evidence/);
  assert.match(siteDashboard, /Assigned student records/);
  assert.match(siteDashboard, /Protected access/);
  assert.match(siteDashboard, /Teacher follow-up/);
  assert.match(siteDashboard, /Current site/);
  assert.match(siteDashboard, /workspace-site-switcher/);
  assert.match(siteDashboard, /data-site-student-action="view-detail"/);
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
  assert.match(viewer, /This view is scoped to Desert Valley High School only/);

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
  assert.match(selectionRequired, /workspace-site-switcher/);
  assert.match(selectionRequired, /id="workspaceSiteSelect"/);
  assert.match(selectionRequired, /data-site-switch-id="site-desert-valley-high"/);
  assert.match(selectionRequired, /Choose a site from the Current site menu/);
  assert.match(selectionRequired, /workspace-problem-state/);
  assert.match(selectionRequired, /Reason/);
  assert.match(selectionRequired, /Owner/);
  assert.match(selectionRequired, /Next action/);
});

test("site dashboard top-risk detail stays in dashboard context", async () => {
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-dashboard-detail",
          email: "site.dashboard.detail@example.edu",
          displayName: "Site Dashboard Detail Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false }),
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: false }),
    },
  });

  vm.runInContext('activeSection = "siteDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /Top Risk Students/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext(`
    handleSiteStudentAction({
      currentTarget: {
        dataset: {
          siteStudentAction: "view-detail",
          studentDetailId: "demo-student-101"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /Student detail loaded/);
  assert.match(workspaceRoot.innerHTML, /School-wide capstone health/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
  assert.ok(
    fetchLog.some((entry) => entry === "/api/site/students/demo-student-101?siteId=site-desert-valley-high"),
    "expected dashboard detail request to preserve the current site id",
  );
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "siteDashboard", sourceSection: "siteDashboard" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "siteDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
});

test("program teacher dashboard rows open existing student detail", async () => {
  const programTeacher = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "program-teacher-detail",
          email: "program.teacher.detail@example.edu",
          displayName: "Program Teacher Detail",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 1 }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: {
        ok: true,
        scope: { role: "program_teacher", scopeType: "program", scopeId: "it" },
        summary: {
          scopedStudents: 1,
          submitted: 1,
          revisionRequested: 0,
          approved: 0,
          evidenceArtifacts: 2,
          noMentor: 0,
          meetingsMakeupRequired: 0,
          presentationsPending: 0,
        },
        needsAttention: [],
        needsReview: [],
        programBreakdown: [],
        students: [
          {
            studentId: "demo-program-student-001",
            studentName: "Program Student One",
            submissionStatus: "submitted",
            evidenceCount: 2,
            noMentor: false,
            updatedAt: "2026-05-24T18:00:00.000Z",
          },
        ],
      },
    },
  }, "programDashboard");

  assert.match(programTeacher, /Program Dashboard/);
  assert.match(programTeacher, /Scoped student list/);
  assert.match(programTeacher, /Program Student One/);
  assert.match(programTeacher, /data-site-student-action="view-detail"/);
  assert.match(programTeacher, /data-student-detail-id="demo-program-student-001"/);
  assert.doesNotMatch(programTeacher, /href="[^"]*\/api\/site\/students\/|data-section="studentDetail"|Detail view coming soon/);
});

test("program teacher dashboard detail actions preserve program dashboard context", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "program-teacher-context",
          email: "program.teacher.context@example.edu",
          displayName: "Program Teacher Context",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 1 }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "program_teacher", readOnly: true, canManage: false }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: {
        ok: true,
        scope: { role: "program_teacher", scopeType: "program", scopeId: "it" },
        summary: {
          scopedStudents: 1,
          submitted: 1,
          revisionRequested: 0,
          approved: 0,
          evidenceArtifacts: 2,
          noMentor: 0,
          meetingsMakeupRequired: 0,
          presentationsPending: 0,
        },
        needsAttention: [],
        needsReview: [],
        programBreakdown: [],
        students: [
          {
            studentId: "demo-student-101",
            studentName: "Program Student One",
            submissionStatus: "submitted",
            evidenceCount: 2,
            noMentor: false,
            updatedAt: "2026-05-24T18:00:00.000Z",
          },
        ],
      },
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: false }),
    },
  });

  vm.runInContext('activeSection = "programDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /Program Student One/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext(`
    handleSiteStudentAction({
      currentTarget: {
        dataset: {
          siteStudentAction: "view-detail",
          studentDetailId: "demo-student-101"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /Program Dashboard/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "programDashboard", sourceSection: "programDashboard" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "programDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
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
  assert.match(siteAdmin, /Assigned records only/);
  assert.match(siteAdmin, /Protected access/);
  assert.match(siteAdmin, /Teacher follow-up/);
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
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
  assert.match(workspaceRoot.innerHTML, /Active filters/);
  assert.match(workspaceRoot.innerHTML, /Revision Loop Demo/);
  assert.match(workspaceRoot.innerHTML, /Information Technology/);
  assert.match(workspaceRoot.innerHTML, /Revision requested/);
  assert.match(workspaceRoot.innerHTML, /Clear filters/);
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
  assert.match(workspaceRoot.innerHTML, /Latest Feedback/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-feedback="latest"/);
  assert.match(workspaceRoot.innerHTML, /Visible note/);
  assert.match(workspaceRoot.innerHTML, /Use the rubric to tighten the next draft/);
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

test("workspace renders site-aware Review Queue with teacher decisions and read-only role states", async () => {
  const teacherHistory = reviewHistoryFixture();
  const teacher = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review",
          email: "teacher.review@example.edu",
          displayName: "Program Teacher Review",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 45 }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 3 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher", `
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId: "submission-review-001",
      historyResult: { ok: true, status: 200, body: ${JSON.stringify(teacherHistory)} }
    };
  `);

  assert.match(teacher, /data-section="teacher"/);
  assert.match(teacher, /Teacher review queue/);
  assert.match(teacher, /Submitted work, revision follow-up/);
  assert.match(teacher, /protected evidence/);
  assert.match(teacher, /assigned records/);
  assert.match(teacher, /teacher review/);
  assert.match(teacher, /No student messaging/);
  assert.match(teacher, /workspace-review-queue/);
  assert.match(teacher, /workspace-filter-bar/);
  assert.match(teacher, /workspace-student-row is-selected/);
  assert.match(teacher, /workspace-status-pill submitted/);
  assert.match(teacher, /workspace-story-chip/);
  assert.match(teacher, /workspace-risk-chip/);
  assert.match(teacher, /data-review-queue-action="open-student"/);
  assert.match(teacher, /data-review-history-section="true"/);
  assert.match(teacher, /data-review-decision="approved"/);
  assert.match(teacher, /data-review-decision="revision_requested"/);
  assert.match(teacher, /data-review-decision="comment_only"/);
  assert.match(teacher, /<textarea name="feedback"/);

  const viewer = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-review",
          email: "viewer.review@example.edu",
          displayName: "Review Viewer",
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "viewer", readOnly: true }),
    },
  }, "teacher", `
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId: "submission-review-001",
      historyResult: { ok: true, status: 200, body: ${JSON.stringify(teacherHistory)} }
    };
  `);
  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only review queue/);
  assert.match(viewer, /This role has a read-only review queue view/);
  assert.doesNotMatch(viewer, /data-review-decision="approved"|data-review-decision="revision_requested"|data-review-decision="comment_only"|<textarea name="feedback"/);

  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-open",
          email: "teacher.review.open@example.edu",
          displayName: "Program Teacher Review Open",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 45 }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 3 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reviews/submission-review-001/history": {
      status: 200,
      body: teacherHistory,
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: false }),
    },
  });
  await vm.runInContext('openReviewSubmission("submission-review-001")', context);
  assert.match(workspaceRoot.innerHTML, /Review history loaded/);
  assert.match(workspaceRoot.innerHTML, /Improve scope and cite the private evidence summary/);

  await vm.runInContext(`
    handleReviewQueueAction({
      currentTarget: {
        dataset: {
          reviewQueueAction: "open-student",
          reviewStudentId: "demo-student-101"
        }
      }
    });
  `, context);
  assert.match(workspaceRoot.innerHTML, /Student detail loaded/);
  assert.match(workspaceRoot.innerHTML, /workspace-review-queue/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /Submitted work/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "teacher", sourceSection: "teacher" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "teacher");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
});

test("workspace applies Review Queue URL filters safely and syncs filter URLs", async () => {
  const urlFilters = {
    status: "revision_requested",
    programId: "",
    search: "proposal scope",
    story: "",
    risk: "stale",
    limit: 100,
    offset: 0,
  };
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-url",
          email: "teacher.review.url@example.edu",
          displayName: "Program Teacher Review URL",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 45 }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher", filters: urlFilters }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 3 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, {
    url: "https://workspace.example/workspace.html?section=teacher&siteId=site-desert-valley-high&status=revision_requested&search=%20proposal%20scope%20&risk=bogus&overdue=true&limit=999&offset=-50&unknown=keep&evidenceStatus=approved",
  });

  const reviewFetch = fetchLog.find((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(reviewFetch, "expected Review Queue fetch with URL-derived filters");
  const fetched = new URL(reviewFetch, "https://workspace.example");
  assert.equal(fetched.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(fetched.searchParams.get("status"), "revision_requested");
  assert.equal(fetched.searchParams.get("search"), "proposal scope");
  assert.equal(fetched.searchParams.get("risk"), "stale");
  assert.equal(fetched.searchParams.get("limit"), "100");
  assert.equal(fetched.searchParams.has("offset"), false);
  assert.equal(fetched.searchParams.has("evidenceStatus"), false);
  assert.match(workspaceRoot.innerHTML, /data-section="teacher"/);
  assert.match(workspaceRoot.innerHTML, /Active filters/);
  assert.match(workspaceRoot.innerHTML, /Revision requested/);
  assert.match(workspaceRoot.innerHTML, /Stale activity/);
  assert.match(workspaceRoot.innerHTML, /proposal scope/);
  assert.match(workspaceRoot.innerHTML, /Clear filters/);

  await vm.runInContext('handleReviewQueueAction({ currentTarget: { dataset: { reviewQueueAction: "reset-filters" } } })', context);
  assert.match(window.location.href, /unknown=keep/);
  assert.match(window.location.href, /section=teacher/);
  assert.doesNotMatch(window.location.href, /status=|search=|risk=|limit=|offset=|evidenceStatus=/);

  vm.runInContext(`
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      status: "submitted",
      programId: "it",
      search: "senior proposal",
      risk: "high",
      limit: 25
    };
    syncReviewQueueUrlState();
  `, context);
  const synced = new URL(window.location.href);
  assert.equal(synced.searchParams.get("section"), "teacher");
  assert.equal(synced.searchParams.get("status"), "submitted");
  assert.equal(synced.searchParams.get("programId"), "it");
  assert.equal(synced.searchParams.get("search"), "senior proposal");
  assert.equal(synced.searchParams.get("risk"), "high");
  assert.equal(synced.searchParams.get("limit"), "25");
  assert.equal(synced.searchParams.get("unknown"), "keep");

  window.history.pushState({}, "", "/workspace.html?section=teacher&status=revision_requested&risk=stale&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const restored = JSON.parse(vm.runInContext("JSON.stringify(reviewQueueFilters)", context));
  assert.equal(restored.status, "revision_requested");
  assert.equal(restored.risk, "stale");
});

test("workspace applies shareable URL filters for site worklists safely", async () => {
  const baseRoutes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-worklist-url",
          email: "site.worklist.url@example.edu",
          displayName: "Site Worklist URL Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }),
    },
  };

  const studentFilters = {
    search: "Revision Loop",
    programId: "it",
    status: "revision_requested",
    noMentor: true,
    risk: "any",
    story: "missing_mentor",
    presentationStatus: "pending",
    archiveStatus: "failed",
    limit: 100,
    offset: 25,
  };
  const studentContext = await createWorkspaceContextWithFetch({
    ...baseRoutes,
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ filters: studentFilters }),
    },
  }, {
    url: "https://workspace.example/workspace.html?section=students&siteId=site-desert-valley-high&search=%20Revision%20%20Loop%20&programId=it&status=revision_requested&risk=bogus&story=missing_mentor&presentationStatus=pending&archiveStatus=failed&noMentor=true&limit=999&offset=25&unknown=keep&mentorUserId=stale",
  });
  const studentFetch = studentContext.fetchLog.find((entry) => entry.startsWith("/api/site/students?"));
  assert.ok(studentFetch, "expected Student Directory fetch with URL filters");
  const studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(studentUrl.searchParams.get("search"), "Revision Loop");
  assert.equal(studentUrl.searchParams.get("programId"), "it");
  assert.equal(studentUrl.searchParams.get("status"), "revision_requested");
  assert.equal(studentUrl.searchParams.get("story"), "missing_mentor");
  assert.equal(studentUrl.searchParams.get("presentationStatus"), "pending");
  assert.equal(studentUrl.searchParams.get("archiveStatus"), "failed");
  assert.equal(studentUrl.searchParams.get("noMentor"), "true");
  assert.equal(studentUrl.searchParams.get("limit"), "100");
  assert.equal(studentUrl.searchParams.get("offset"), "25");
  assert.equal(studentUrl.searchParams.has("risk"), false);
  assert.equal(studentUrl.searchParams.has("mentorUserId"), false);
  assert.match(studentContext.workspaceRoot.innerHTML, /data-section="students"/);
  assert.match(studentContext.workspaceRoot.innerHTML, /Showing students missing mentors/);
  assert.match(studentContext.workspaceRoot.innerHTML, /Only students without an active mentor assignment are listed/);
  assert.match(studentContext.workspaceRoot.innerHTML, /Page size/);
  assert.match(studentContext.workspaceRoot.innerHTML, /Offset/);
  await vm.runInContext('handleSiteStudentAction({ currentTarget: { dataset: { siteStudentAction: "reset-filters" } } })', studentContext.context);
  assert.match(studentContext.window.location.href, /unknown=keep/);
  assert.match(studentContext.window.location.href, /section=students/);
  assert.doesNotMatch(studentContext.window.location.href, /search=|programId=|status=|story=|presentationStatus=|archiveStatus=|noMentor=|limit=|offset=|mentorUserId=/);
  studentContext.window.history.pushState({}, "", "/workspace.html?section=students&siteId=site-desert-valley-high&view=studentDirectory&search=Old&status=submitted&unknown=keep");
  await vm.runInContext('activeSection = "students"; selectWorkspaceSite("site-canyon-ridge-career")', studentContext.context);
  const switchedStudentUrl = new URL(studentContext.window.location.href);
  assert.equal(switchedStudentUrl.searchParams.get("section"), "students");
  assert.equal(switchedStudentUrl.searchParams.get("siteId"), "site-canyon-ridge-career");
  assert.equal(switchedStudentUrl.searchParams.get("unknown"), "keep");
  assert.equal(switchedStudentUrl.searchParams.has("view"), false);
  assert.equal(switchedStudentUrl.searchParams.has("search"), false);
  assert.equal(switchedStudentUrl.searchParams.has("status"), false);

  const mentorFilters = {
    siteId: "site-desert-valley-high",
    programId: "it",
    mentorUserId: "demo-mentor-001",
    studentSearch: "Archive Demo",
    status: "unassigned",
    noMentor: true,
    limit: 25,
    offset: 50,
  };
  const mentorContext = await createWorkspaceContextWithFetch({
    ...baseRoutes,
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true, filters: mentorFilters }),
    },
  }, {
    url: "https://workspace.example/workspace.html?section=mentorAssignments&siteId=site-desert-valley-high&programId=it&mentorUserId=demo-mentor-001&studentSearch=%20Archive%20Demo%20&status=bogus&noMentor=true&limit=25&offset=50&unknown=keep&evidenceStatus=approved",
  });
  const mentorFetch = mentorContext.fetchLog.find((entry) => entry.startsWith("/api/site/mentor-assignments?"));
  assert.ok(mentorFetch, "expected Mentor Assignments fetch with URL filters");
  const mentorUrl = new URL(mentorFetch, "https://workspace.example");
  assert.equal(mentorUrl.searchParams.get("programId"), "it");
  assert.equal(mentorUrl.searchParams.get("mentorUserId"), "demo-mentor-001");
  assert.equal(mentorUrl.searchParams.get("studentSearch"), "Archive Demo");
  assert.equal(mentorUrl.searchParams.get("status"), "unassigned");
  assert.equal(mentorUrl.searchParams.get("noMentor"), "true");
  assert.equal(mentorUrl.searchParams.get("limit"), "25");
  assert.equal(mentorUrl.searchParams.get("offset"), "50");
  assert.equal(mentorUrl.searchParams.has("evidenceStatus"), false);
  assert.match(mentorContext.workspaceRoot.innerHTML, /data-section="mentorAssignments"/);
  assert.match(mentorContext.workspaceRoot.innerHTML, /Reload or share this view with the current browser URL/);
  await vm.runInContext('handleMentorAssignmentAction({ currentTarget: { dataset: { mentorAssignmentAction: "reset-filters" } } })', mentorContext.context);
  assert.match(mentorContext.window.location.href, /unknown=keep/);
  assert.match(mentorContext.window.location.href, /section=mentorAssignments/);
  assert.doesNotMatch(mentorContext.window.location.href, /programId=|mentorUserId=|studentSearch=|status=|noMentor=|limit=|offset=|evidenceStatus=/);

  const operationsFilters = {
    siteId: "site-desert-valley-high",
    programId: "it",
    status: "revision_requested",
    story: "archive_failed",
    risk: "high",
    presentationStatus: "",
    archiveStatus: "provider_unavailable",
    readiness: "blocked",
    category: "archive",
    needsAttention: true,
    outlineAttention: true,
    limit: 25,
    offset: 0,
  };
  const operationsContext = await createWorkspaceContextWithFetch({
    ...baseRoutes,
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "site_admin", filters: operationsFilters }),
    },
  }, {
    url: "https://workspace.example/workspace.html?section=operations&siteId=site-desert-valley-high&programId=it&status=revision_requested&story=archive_failed&risk=high&presentationStatus=bogus&archiveStatus=provider_unavailable&readiness=blocked&category=archive&needsAttention=true&outlineAttention=true&limit=25&offset=-4&unknown=keep&studentId=stale",
  });
  const operationsFetch = operationsContext.fetchLog.find((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(operationsFetch, "expected Operations fetch with URL filters");
  const operationsUrl = new URL(operationsFetch, "https://workspace.example");
  assert.equal(operationsUrl.searchParams.get("programId"), "it");
  assert.equal(operationsUrl.searchParams.get("status"), "revision_requested");
  assert.equal(operationsUrl.searchParams.get("story"), "archive_failed");
  assert.equal(operationsUrl.searchParams.get("risk"), "high");
  assert.equal(operationsUrl.searchParams.get("archiveStatus"), "provider_unavailable");
  assert.equal(operationsUrl.searchParams.get("readiness"), "blocked");
  assert.equal(operationsUrl.searchParams.get("category"), "archive");
  assert.equal(operationsUrl.searchParams.get("needsAttention"), "true");
  assert.equal(operationsUrl.searchParams.get("outlineAttention"), "true");
  assert.equal(operationsUrl.searchParams.get("limit"), "25");
  assert.equal(operationsUrl.searchParams.has("presentationStatus"), false);
  assert.equal(operationsUrl.searchParams.has("offset"), false);
  assert.equal(operationsUrl.searchParams.has("studentId"), false);
  assert.match(operationsContext.workspaceRoot.innerHTML, /data-section="operations"/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Any submission/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Submission/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Any category/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Category/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Needs attention/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Pending approval or needs revision/);
  assert.match(operationsContext.workspaceRoot.innerHTML, /Reload or share this view with the current browser URL/);
  await vm.runInContext('handleOperationsReadinessAction({ currentTarget: { dataset: { operationsAction: "reset-filters" } } })', operationsContext.context);
  assert.match(operationsContext.window.location.href, /unknown=keep/);
  assert.match(operationsContext.window.location.href, /section=operations/);
  assert.doesNotMatch(operationsContext.window.location.href, /programId=|status=|story=|risk=|archiveStatus=|readiness=|category=|needsAttention=|outlineAttention=|limit=|studentId=/);
});

test("workspace renders site-scoped Mentor Assignments with role-safe assignment controls", async () => {
  const siteAdmin = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-mentor-assignments",
          email: "site.mentor.assignments@example.edu",
          displayName: "Mentor Assignment Admin",
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
      body: siteStudentsFixture({ readOnly: false }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({
        role: "site_admin",
        canManage: true,
        filters: {
          siteId: "site-desert-valley-high",
          programId: "it",
          mentorUserId: "demo-mentor-001",
          studentSearch: "Archive",
          status: "active",
          noMentor: false,
          limit: 50,
          offset: 0,
        },
      }),
    },
  }, "mentorAssignments");

  assert.match(siteAdmin, /data-section="mentorAssignments"/);
  assert.match(siteAdmin, /Mentor Assignments/);
  assert.match(siteAdmin, /Mentor coverage/);
  assert.match(siteAdmin, /workspace-mentor-assignments/);
  assert.match(siteAdmin, /workspace-mentor-assignment-layout/);
  assert.match(siteAdmin, /workspace-filter-bar/);
  assert.match(siteAdmin, /Active filters/);
  assert.match(siteAdmin, /Information Technology/);
  assert.match(siteAdmin, /Mentor One/);
  assert.match(siteAdmin, /Archive/);
  assert.match(siteAdmin, /Clear filters/);
  assert.match(siteAdmin, /Students With Mentors/);
  assert.match(siteAdmin, /Missing Mentors/);
  assert.match(siteAdmin, /Active Mentors/);
  assert.match(siteAdmin, /Overloaded Mentors/);
  assert.match(siteAdmin, /Missing Mentor Demo 001/);
  assert.match(siteAdmin, /workspace-story-chip/);
  assert.match(siteAdmin, /workspace-risk-chip/);
  assert.match(siteAdmin, /data-mentor-unassigned-list="true"/);
  assert.match(siteAdmin, /data-mentor-coverage-list="true"/);
  assert.match(siteAdmin, /data-mentor-active-assignments="true"/);
  assert.match(siteAdmin, /data-mentor-assignment-form="true"/);
  assert.match(siteAdmin, /Assign mentor/);
  assert.match(siteAdmin, /Assignments stay within the current school/);
  assert.match(siteAdmin, /protected evidence boundaries/);
  assert.match(siteAdmin, /assigned records/);
  assert.match(siteAdmin, /teacher follow-up/);
  assert.match(siteAdmin, /No student messaging/);
  assert.doesNotMatch(siteAdmin, /Reassign|Deactivate|Archive retry|Download archive|data-admin-action="import-users"/i);

  const viewer = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-mentor-assignments",
          email: "viewer.mentor.assignments@example.edu",
          displayName: "Mentor Assignment Viewer",
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "viewer", readOnly: true }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "viewer", readOnly: true, canManage: false }),
    },
  }, "mentorAssignments");

  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only mentor coverage/);
  assert.match(viewer, /Assignment controls are hidden for this role/);
  assert.match(viewer, /This role has a read-only mentor coverage view/);
  assert.doesNotMatch(viewer, /data-mentor-assignment-form="true"|Assign mentor/);

  const teacher = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-mentor-assignments",
          email: "teacher.mentor.assignments@example.edu",
          displayName: "Mentor Assignment Teacher",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 45 }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "program_teacher", readOnly: true, canManage: false }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 3 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "mentorAssignments");
  assert.match(teacher, /Program Teacher/);
  assert.match(teacher, /Read-only mentor coverage/);
  assert.doesNotMatch(teacher, /data-mentor-assignment-form="true"|Assign mentor/);
});

test("mentor assignment detail actions preserve mentor assignment context", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-mentor-detail-context",
          email: "site.mentor.detail.context@example.edu",
          displayName: "Mentor Detail Context Admin",
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
      body: siteStudentsFixture({ readOnly: false }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }),
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: false }),
    },
  });

  vm.runInContext('activeSection = "mentorAssignments"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /workspace-mentor-assignments/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext(`
    handleMentorAssignmentAction({
      currentTarget: {
        dataset: {
          mentorAssignmentAction: "open-student",
          mentorStudentId: "demo-student-101"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /workspace-mentor-assignments/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "mentorAssignments", sourceSection: "mentorAssignments" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "mentorAssignments");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
});

test("workspace renders site-scoped Operations readiness worklists without mutation controls", async () => {
  const siteAdmin = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-operations",
          email: "site.operations@example.edu",
          displayName: "Operations Admin",
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
      body: siteStudentsFixture({ readOnly: false }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "site_admin" }),
    },
  }, "operations");

  assert.match(siteAdmin, /data-section="operations"/);
  assert.match(siteAdmin, /Operations/);
  assert.match(siteAdmin, /Presentation readiness/);
  assert.match(siteAdmin, /Archive readiness/);
  assert.match(siteAdmin, /workspace-operations-readiness/);
  assert.match(siteAdmin, /workspace-operations-layout/);
  assert.match(siteAdmin, /workspace-filter-bar/);
  assert.match(siteAdmin, /Presentation Ready/);
  assert.match(siteAdmin, /Presentation Pending/);
  assert.match(siteAdmin, /Outline Pending/);
  assert.match(siteAdmin, /Archive Ready/);
  assert.match(siteAdmin, /Archive Failed/);
  assert.match(siteAdmin, /Needs Attention/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="presentation-pending">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="outline-pending">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-failed">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="needs-attention">Review rows/);
  assert.match(siteAdmin, /Presentation Pending Demo 001/);
  assert.match(siteAdmin, /Archive Failed Demo 001/);
  assert.match(siteAdmin, /Archive Ready Demo 001/);
  assert.match(siteAdmin, /High Risk Demo 001/);
  assert.match(siteAdmin, /data-operations-presentation-rows="true"/);
  assert.match(siteAdmin, /data-operations-archive-rows="true"/);
  assert.match(siteAdmin, /data-operations-readiness-rows="true"/);
  assert.match(siteAdmin, /data-operations-program-breakdown="true"/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="program-breakdown" data-program-id="it"/);
  assert.match(siteAdmin, /View program rows/);
  assert.match(siteAdmin, /data-operations-next-actions="true"/);
  assert.match(siteAdmin, /data-operations-action="filter-category" data-operations-category="risk"/);
  assert.match(siteAdmin, /View risk rows/);
  assert.match(siteAdmin, /View student detail/);
  assert.match(siteAdmin, /workspace-story-chip/);
  assert.match(siteAdmin, /workspace-risk-chip/);
  assert.match(siteAdmin, /status-pill|workspace-status-pill/);
  assert.match(siteAdmin, /protected evidence/);
  assert.match(siteAdmin, /assigned records/);
  assert.match(siteAdmin, /teacher follow-up/);
  assert.match(siteAdmin, /No student messaging/);
  assert.doesNotMatch(siteAdmin, /data-presentation-action|data-archive-action|data-admin-action="import-users"|<button[^>]*>\s*(?:Archive retry|Retry archive|Schedule presentation|Check out|Check in|Export package)/i);

  const viewer = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-operations",
          email: "viewer.operations@example.edu",
          displayName: "Operations Viewer",
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "viewer", readOnly: true }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "viewer", readOnly: true, canManage: false }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "viewer", readOnly: true }),
    },
  }, "operations");

  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only operations worklists/);
  assert.doesNotMatch(viewer, /data-presentation-action|data-archive-action|<button[^>]*>\s*(?:Archive retry|Retry archive|Schedule presentation)/i);

  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-operations-detail",
          email: "site.operations.detail@example.edu",
          displayName: "Operations Detail Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: false }) },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }) },
    "/api/site/operations-readiness": { status: 200, body: siteOperationsReadinessFixture({ role: "site_admin" }) },
    "/api/site/students/demo-student-054": { status: 200, body: siteStudentDetailFixture({ readOnly: false }) },
  });
  await vm.runInContext(`
    activeSection = "operations";
    renderAppShell();
    handleOperationsReadinessAction({
      currentTarget: {
        dataset: {
          operationsAction: "open-student",
          operationsStudentId: "demo-student-054"
        }
      }
    });
  `, context);
  assert.match(workspaceRoot.innerHTML, /Student detail loaded/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /data-operations-archive-rows="true"/);
  assert.match(workspaceRoot.innerHTML, /Operations/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "operations", sourceSection: "operations" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "operations");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "program-breakdown", programId: "it" } })', context);
  const programFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(programFetch, "expected Operations fetch with selected program filter");
  const programUrl = new URL(programFetch, "https://workspace.example");
  assert.equal(programUrl.searchParams.get("programId"), "it");
  assert.equal(programUrl.searchParams.get("offset"), null);
  assert.match(window.location.href, /section=operations/);
  assert.match(window.location.href, /programId=it/);
  assert.equal(vm.runInContext("activeSection", context), "operations");

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "presentation-pending" } })', context);
  const presentationFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(presentationFetch, "expected Operations fetch with presentation filter");
  const presentationUrl = new URL(presentationFetch, "https://workspace.example");
  assert.equal(presentationUrl.searchParams.get("presentationStatus"), "pending");
  assert.equal(presentationUrl.searchParams.get("readiness"), "attention_required");
  assert.equal(presentationUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /presentationStatus=pending/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "archive-failed" } })', context);
  const archiveFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(archiveFetch, "expected Operations fetch with archive filter");
  const archiveUrl = new URL(archiveFetch, "https://workspace.example");
  assert.equal(archiveUrl.searchParams.get("archiveStatus"), "failed");
  assert.equal(archiveUrl.searchParams.get("readiness"), "blocked");
  assert.equal(archiveUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /archiveStatus=failed/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "needs-attention" } })', context);
  const attentionFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(attentionFetch, "expected Operations fetch with needs-attention filter");
  const attentionUrl = new URL(attentionFetch, "https://workspace.example");
  assert.equal(attentionUrl.searchParams.get("needsAttention"), "true");
  assert.equal(attentionUrl.searchParams.has("archiveStatus"), false);
  assert.equal(attentionUrl.searchParams.has("readiness"), false);
  assert.match(window.location.href, /needsAttention=true/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "outline-pending" } })', context);
  const outlineFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(outlineFetch, "expected Operations fetch with outline attention filter");
  const outlineUrl = new URL(outlineFetch, "https://workspace.example");
  assert.equal(outlineUrl.searchParams.get("outlineAttention"), "true");
  assert.equal(outlineUrl.searchParams.has("presentationStatus"), false);
  assert.equal(outlineUrl.searchParams.has("needsAttention"), false);
  assert.match(window.location.href, /outlineAttention=true/);

  await vm.runInContext('handleOperationsReadinessAction({ currentTarget: { dataset: { operationsAction: "filter-category", operationsCategory: "risk" } } })', context);
  const categoryFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(categoryFetch, "expected Operations fetch with readiness category filter");
  const categoryUrl = new URL(categoryFetch, "https://workspace.example");
  assert.equal(categoryUrl.searchParams.get("category"), "risk");
  assert.equal(categoryUrl.searchParams.get("offset"), null);
  assert.match(window.location.href, /category=risk/);
});

test("mentor dashboard assigned students open student detail without leaving mentor context", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "mentor-detail-user",
          email: "mentor.detail@example.edu",
          displayName: "Mentor Detail",
          roles: [{ role_id: "mentor", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/mentor/dashboard": {
      status: 200,
      body: {
        ok: true,
        scope: "mentor_assigned",
        summary: {
          assignedCount: 1,
          needsRevision: 1,
          missingMeeting: 1,
          presentationPending: 1,
        },
        assignedStudents: [
          {
            studentId: "demo-student-101",
            studentName: "Missing Mentor Demo 001",
            submissionStatus: "revision_requested",
            evidenceCount: 3,
            mentorMeetingStatus: "makeup_required",
            presentationStatus: "not_scheduled",
            outlineStatus: "pending",
            needsAttention: ["mentor_meeting", "presentation"],
          },
        ],
      },
    },
    "/api/mentor/assigned": {
      status: 200,
      body: {
        ok: true,
        mentorId: "mentor-detail-user",
        assignedStudents: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [], summary: {} },
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: true }),
    },
  });

  vm.runInContext('activeSection = "mentorDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /Assigned Student Focus/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-action="open-student"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-student-id="demo-student-101"/);

  await vm.runInContext(`
    handleMentorDashboardAction({
      currentTarget: {
        dataset: {
          mentorDashboardAction: "open-student",
          mentorDashboardStudentId: "demo-student-101"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /Student detail loaded/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /Assigned Students/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "mentorDashboard", sourceSection: "mentorDashboard" },
  );

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "mentorDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
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

test("workspace gates review queue visibility and refresh behavior by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const reviewRoleHelperBlock = workspaceJs.match(/function hasSiteReviewQueueRole[\s\S]*?function defaultSiteStudentFilters/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteReviewQueueRole\(roles\)/);
  assert.match(reviewRoleHelperBlock, /"platform_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"viewer",\s+"program_teacher"/);
  assert.doesNotMatch(reviewRoleHelperBlock, /"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /id: "teacher", label: "Review Queue", detail: "Teacher review and submitted work"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteReviewQueueRole\(roles\).*\/api\/site\/review-queue/s);
  assert.match(workspaceJs, /function submitReviewDecision/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "submitted"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "revision-requested"/);
  assert.match(workspaceJs, /loadReviewQueueResult\("Showing submitted work ready for review\."\)/);
  assert.match(workspaceJs, /loadReviewQueueResult\("Review decision saved\."\)/);
  assert.match(workspaceJs, /function refreshSelectedStudentDetailAfterReview/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(selected\.studentId\)\}/);
});

test("workspace gates mentor assignment visibility and refresh behavior by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const mentorRoleHelperBlock = workspaceJs.match(/function hasSiteMentorAssignmentRole[\s\S]*?function defaultSiteStudentFilters/)?.[0] || "";
  const sectionOpenBlock = workspaceJs.match(/async function openWorkspaceSection[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteMentorAssignmentRole\(roles\)/);
  assert.match(mentorRoleHelperBlock, /"platform_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"viewer",\s+"program_teacher"/);
  assert.doesNotMatch(mentorRoleHelperBlock, /"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /id: "mentorAssignments", label: "Mentor Assignments", detail: "Coverage and assignment workflow"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteMentorAssignmentRole\(roles\).*\/api\/site\/mentor-assignments/s);
  assert.match(sectionOpenBlock, /section === "mentorAssignments" && button\.dataset\.sectionPreset === "no-mentor"/);
  assert.match(sectionOpenBlock, /status:\s*"unassigned"/);
  assert.match(sectionOpenBlock, /noMentor:\s*true/);
  assert.match(sectionOpenBlock, /loadMentorAssignmentsResult\("Showing students without mentors\."\)/);
  assert.match(sectionOpenBlock, /section === "mentorAssignments" && button\.dataset\.sectionPreset === "mentor-workload"/);
  assert.match(sectionOpenBlock, /const mentorUserId = cleanDirectoryFilter\(button\.dataset\.mentorId\)/);
  assert.match(sectionOpenBlock, /mentorUserId,/);
  assert.match(sectionOpenBlock, /loadMentorAssignmentsResult\("Showing this mentor's active student load\."\)/);
  assert.match(workspaceJs, /function submitMentorAssignment/);
  assert.match(workspaceJs, /\/api\/site\/mentor-assignments/);
  assert.match(workspaceJs, /function refreshConnectedSurfacesAfterMentorAssignment/);
  assert.match(workspaceJs, /loadMentorAssignmentsResult\("Mentor assignment saved\."\)/);
  assert.match(workspaceJs, /\/api\/site\/dashboard\$\{query\}/);
  assert.match(workspaceJs, /\/api\/site\/students\$\{siteStudentQueryString\(\)\}/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(studentId\)\}/);
  assert.doesNotMatch(workspaceJs, /site_mentor_assignment_reassigned|site_mentor_assignment_deactivated|data-mentor-assignment-action="reassign"|data-mentor-assignment-action="deactivate"/);
});

test("workspace gates operations readiness visibility and keeps it read-only", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const operationsRoleHelperBlock = workspaceJs.match(/function hasSiteOperationsRole[\s\S]*?function defaultSiteStudentFilters/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteOperationsRole\(roles\)/);
  assert.match(operationsRoleHelperBlock, /"platform_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"viewer",\s+"program_teacher"/);
  assert.doesNotMatch(operationsRoleHelperBlock, /"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /id: "operations", label: "Operations", detail: "Presentation, archive, and readiness"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteOperationsRole\(roles\).*\/api\/site\/operations-readiness/s);
  assert.match(workspaceJs, /function renderOperationsReadinessSection/);
  assert.match(workspaceJs, /function applyOperationsReadinessFilters/);
  assert.match(workspaceJs, /function loadOperationsReadinessResult/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "presentation-pending"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "archive-failed"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "needs-attention"/);
  assert.match(workspaceJs, /data-operations-action="filter-category"/);
  assert.match(workspaceJs, /data-operations-action="open-student"/);
  assert.match(workspaceJs, /openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.operationsStudentId/);
  assert.match(workspaceJs, /scope\.readOnly/);
  assert.doesNotMatch(workspaceJs, /data-operations-action="schedule"|data-operations-action="retry"|data-operations-action="check-in"|data-operations-action="check-out"/);
});

test("workspace exposes a real admin site switcher and collapsible navigation", () => {
  const siteSwitcherBlock = workspaceJs.match(/function renderSiteSwitcherControl[\s\S]*?function canUseSiteSwitcher/)?.[0] || "";
  const siteSwitcherRoleBlock = workspaceJs.match(/function canUseSiteSwitcher[\s\S]*?function currentSiteWorkspaceContext/)?.[0] || "";
  assert.match(workspaceJs, /let selectedSiteId = ""/);
  assert.match(workspaceJs, /id="workspaceMenuToggle"/);
  assert.match(workspaceJs, /aria-label="\$\{workspaceNavCollapsed \? "Open menu" : "Close menu"\}"/);
  assert.match(workspaceJs, /workspace-menu-icon/);
  assert.match(workspaceJs, /workspace-topbar-start/);
  assert.match(workspaceJs, /data-nav-state="\$\{workspaceNavCollapsed \? "collapsed" : "expanded"\}"/);
  assert.match(workspaceJs, /function toggleWorkspaceMenu/);
  assert.match(workspaceJs, /Menu closed\./);
  assert.match(workspaceJs, /hidden aria-hidden="true"/);
  assert.match(siteSwitcherBlock, /id="workspaceSiteSelect"/);
  assert.match(workspaceJs, /data-site-switch-id/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("platform_admin"\)/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("admin"\)/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("org_admin"\)/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("site_admin"\)/);
  assert.doesNotMatch(siteSwitcherRoleBlock, /roles\.has\("viewer"\)|roles\.has\("student"\)|roles\.has\("mentor"\)/);
  assert.match(workspaceJs, /function siteDashboardQueryString/);
  assert.match(workspaceJs, /selectedSiteQueryValue\(\)/);
  assert.match(workspaceCss, /max-width: none/);
  assert.match(workspaceCss, /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-content[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(workspaceCss, /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-rail[\s\S]*display: none/);
});

test("workspace dashboard actions use supported filters and loaders", () => {
  const sectionOpenBlock = workspaceJs.match(/async function openWorkspaceSection[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(sectionOpenBlock, /section === "students" && button\.dataset\.sectionPreset === "all-students"/);
  assert.match(sectionOpenBlock, /syncSiteStudentUrlState\(\{ clearFilters: true \}\)/);
  assert.match(sectionOpenBlock, /section === "students" && button\.dataset\.sectionPreset === "missing-mentors"/);
  assert.match(sectionOpenBlock, /noMentor:\s*true/);
  assert.match(sectionOpenBlock, /loadWorkspaceData\("Showing students missing mentors\."\)/);
  assert.match(sectionOpenBlock, /section === "students" && button\.dataset\.sectionPreset === "program"/);
  assert.match(sectionOpenBlock, /const programId = cleanDirectoryFilter\(button\.dataset\.programId\)/);
  assert.match(sectionOpenBlock, /programId,/);
  assert.match(sectionOpenBlock, /loadWorkspaceData\("Showing students in the selected program\."\)/);
  assert.match(sectionOpenBlock, /section === "students" && button\.dataset\.sectionPreset === "status-breakdown"/);
  assert.match(sectionOpenBlock, /const status = canonicalReviewQueueValue\(normalizeStatus\(button\.dataset\.statusFilter\), SITE_STUDENT_STATUS_VALUES\)/);
  assert.match(sectionOpenBlock, /status,/);
  assert.match(sectionOpenBlock, /loadWorkspaceData\(`Showing \$\{statusText\(status\)\} students\.`\)/);
  assert.match(sectionOpenBlock, /section === "operations" && button\.dataset\.sectionPreset === "program-breakdown"/);
  assert.match(sectionOpenBlock, /section === "operations" && button\.dataset\.sectionPreset === "outline-pending"/);
  assert.match(sectionOpenBlock, /programId,/);
  assert.match(sectionOpenBlock, /loadOperationsReadinessResult\("Showing operations rows for the selected program\."\)/);
  assert.match(workspaceJs, /data-operations-action="filter-category"/);
  assert.match(workspaceJs, /const category = canonicalReviewQueueValue\(event\.currentTarget\?\.dataset\?\.operationsCategory, OPERATIONS_CATEGORY_VALUES\)/);
  assert.match(workspaceJs, /params\.set\("category", filters\.category\)/);
  assert.match(workspaceJs, /params\.set\("needsAttention", "true"\)/);
  assert.match(workspaceJs, /params\.set\("outlineAttention", "true"\)/);
  assert.match(workspaceJs, /function siteStudentQueryString/);
  assert.match(workspaceJs, /params\.set\("programId", filters\.programId\)/);
  assert.match(workspaceJs, /params\.set\("status", filters\.status\)/);
  assert.match(workspaceJs, /params\.set\("noMentor", "true"\)/);
  assert.match(workspaceJs, /function siteMentorAssignmentQueryString/);
  assert.match(workspaceJs, /params\.set\("mentorUserId", filters\.mentorUserId\)/);
  assert.match(workspaceJs, /preset: "all-students"/);
  assert.match(workspaceJs, /preset: "missing-mentors"|data-section-preset="missing-mentors"/);
  assert.match(workspaceJs, /data-section-preset="program"/);
  assert.match(workspaceJs, /data-section-preset="status-breakdown"/);
  assert.match(workspaceJs, /data-section-preset="mentor-workload"/);
  assert.match(workspaceJs, /data-section-preset="program-breakdown"/);
  assert.match(workspaceJs, /preset: "outline-pending"/);
  assert.match(workspaceJs, /Showing students missing mentors/);
  assert.doesNotMatch(workspaceJs, /href="#"/);
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
      body: {
        ok: true,
        summary: {
          readyChecks: 1,
          missingChecks: 2,
          totalChecks: 4,
          archiveAvailableToRequest: false,
        },
        checks: [
          {
            id: "reflection_portfolio",
            label: "Reflections and portfolio",
            status: "missing",
            evidenceCount: 0,
            message: "Needs evidence or staff review before the archive package is ready.",
          },
        ],
        archive: { status: "not_requested" },
        storage: { credentialsConfigured: true, providerStatus: "ready" },
        retention: {},
      },
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
  assert.match(uploading, /Your Senior Project/);
  assert.doesNotMatch(uploading, /workspace-product-header/);
  assert.doesNotMatch(uploading, /Database-backed MVP|Cloudflare target|Audit-sensitive admin/);

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

test("workspace renders a progress-first student homepage with safe language", async () => {
  const student = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-progress-home",
          email: "student.progress@senior-capstone.test",
          displayName: "Progress Student",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/student/dashboard": {
      status: 200,
      body: {
        ok: true,
        viewer: { self: true },
        nextAction: "Revise Senior Project Proposal and send it back for review.",
        summary: {
          requirementsTotal: 6,
          requirementsComplete: 3,
          completionPercent: 50,
          phasesTotal: 4,
          phasesComplete: 2,
          submittedRequiredCount: 4,
          missingRequiredCount: 2,
          waitingForReviewCount: 1,
          revisionRequestedCount: 1,
          currentPhase: "proposal-and-research",
          currentPhaseLabel: "Proposal And Research",
          currentStatus: "Needs Revision",
          lastUpdatedAt: "2026-05-24T18:00:00.000Z",
          mentor: {
            assigned: true,
            name: "Ms. Garcia",
            message: "Ms. Garcia can help with project questions.",
          },
          dueDatesAvailable: true,
        },
        nextSteps: [
          {
            title: "Senior Project Proposal",
            status: "Needs Revision",
            detail: "Revise Senior Project Proposal and send it back for review.",
            dueDate: "2025-10-09T00:00:00Z",
            dueLabel: "October 9 and 10",
          },
          {
            title: "Mentor Meeting One Plan",
            status: "Missing",
            detail: "Start or finish Mentor Meeting One Plan.",
            dueDate: "2026-01-14T00:00:00Z",
            dueLabel: "January 14, make-up January 16",
          },
        ],
        requirements: [
          {
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            title: "Senior Project Proposal",
            description: "Explain the problem, solution, audience, and evidence for your capstone project.",
            phase: "proposal-and-research",
            phaseLabel: "Proposal And Research",
            status: "revision_requested",
            progressStatus: "revision_requested",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            evidenceCount: 1,
            dueDate: "2025-10-09T00:00:00Z",
            dueLabel: "October 9 and 10",
            qualityPrompt: "Add one measurable success target before you send the proposal back.",
            lastUpdatedAt: "2026-05-24T18:00:00.000Z",
            nextAction: "Send the revised Senior Project Proposal back for teacher review.",
          },
          {
            requirementId: "req-mentor-plan",
            submissionId: null,
            title: "Mentor Meeting One Plan",
            description: "Bring your proposal and ask your mentor for help with scope, evidence, and timeline.",
            phase: "mentor-meetings",
            phaseLabel: "Mentor Meetings",
            status: "missing",
            progressStatus: null,
            submissionStatus: null,
            submissionVersion: null,
            evidenceCount: 0,
            dueDate: "2026-01-14T00:00:00Z",
            dueLabel: "January 14, make-up January 16",
            qualityPrompt: "Write down the strongest advice you heard and your next step.",
            lastUpdatedAt: null,
            nextAction: "Start Mentor Meeting One Plan when your teacher is ready for this step.",
          },
          {
            requirementId: "req-reflection",
            submissionId: "submission-reflection",
            title: "Final Reflection",
            description: "Choose evidence that shows growth, skill, effort, or impact.",
            phase: "portfolio",
            phaseLabel: "Portfolio",
            status: "approved",
            progressStatus: "approved",
            submissionStatus: "approved",
            submissionVersion: 1,
            evidenceCount: 2,
            dueDate: "2026-04-08T00:00:00Z",
            dueLabel: "April 8 and 9",
            qualityPrompt: "Explain why this work shows your best effort.",
            lastUpdatedAt: "2026-05-23T18:00:00.000Z",
            nextAction: "You are done with Final Reflection.",
          },
        ],
        progress: [
          { requirement_id: "req-proposal", phase: "proposal-and-research", status: "revision_requested", updated_at: "2026-05-24T18:00:00.000Z", requirement_title: "Senior Project Proposal" },
        ],
        submissions: [
          { id: "submission-proposal", requirement_id: "req-proposal", requirement_title: "Senior Project Proposal", status: "revision_requested", version: 2, evidence_count: 1, updated_at: "2026-05-24T18:00:00.000Z" },
        ],
        evidence: [
          { id: "evidence-proposal", title: "Proposal draft", artifact_type: "planning_document", source_kind: "external_link", externalUrl: "https://example.test/proposal", review_status: "pending_review", created_at: "2026-05-24T17:50:00.000Z" },
        ],
        feedback: [
          {
            id: "review-proposal",
            kind: "review",
            submissionId: "submission-proposal",
            requirementTitle: "Senior Project Proposal",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            status: "revision_requested",
            message: "Add one measurable success target before resubmitting.",
            authorName: "Ms. Garcia",
            createdAt: "2026-05-24T18:30:00.000Z",
          },
        ],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: {
        ok: true,
        summary: {
          readyChecks: 1,
          missingChecks: 2,
          totalChecks: 4,
          archiveAvailableToRequest: false,
        },
        checks: [
          {
            id: "reflection_portfolio",
            label: "Reflections and portfolio",
            status: "missing",
            evidenceCount: 0,
            message: "Needs evidence or staff review before the archive package is ready.",
          },
        ],
        archive: { status: "not_requested" },
        storage: { credentialsConfigured: true, providerStatus: "ready" },
        retention: {},
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  });

  assert.match(student, /Your Senior Project/);
  assert.match(student, /Track what is complete, what is missing, and what to do next/);
  assert.match(student, /role="progressbar"/);
  assert.match(student, /aria-valuenow="50"/);
  assert.match(student, /Project Phases/);
  assert.match(student, /2 of 4 complete/);
  assert.match(student, /Required Submissions/);
  assert.match(student, /4 of 6 submitted/);
  assert.match(student, /Review Status/);
  assert.match(student, /1 needs revision/);
  assert.match(student, /Mentor: Ms\. Garcia/);
  assert.match(student, /workspace-student-primary-action/);
  assert.match(student, /Do this next/);
  assert.match(student, /Senior Project Proposal/);
  assert.match(student, /Your action/);
  assert.match(student, /What to Work On Next/);
  assert.match(student, /data-student-requirements-panel="true"/);
  assert.match(student, /data-student-requirements-count="3"/);
  assert.match(student, /Your Required Work/);
  assert.equal((student.match(/data-student-requirement-phase="true"/g) || []).length, 3);
  assert.match(student, /data-student-requirement-phase-key="proposal-and-research"/);
  assert.match(student, /data-student-requirement-phase-key="mentor-meetings"/);
  assert.match(student, /data-student-requirement-phase-key="portfolio"/);
  assert.match(student, /Proposal And Research/);
  assert.match(student, /Mentor Meetings/);
  assert.match(student, /Portfolio/);
  assert.match(student, /0 of 1 complete \/ 1 still need work/);
  assert.match(student, /1 of 1 complete/);
  assert.match(student, /data-student-requirement-row="true"/);
  assert.match(student, /data-student-requirement-submission-id="submission-proposal"/);
  assert.match(student, /data-student-requirement-evidence-count="1"/);
  assert.match(student, /data-student-requirement-evidence="true"/);
  assert.match(student, />1 evidence</);
  assert.match(student, /data-student-submission-action="submit"/);
  assert.match(student, /data-student-submission-id="submission-proposal"/);
  assert.match(student, /Send revision/);
  assert.match(student, /data-student-requirement-description="true"/);
  assert.match(student, /Explain the problem, solution, audience, and evidence for your capstone project/);
  assert.match(student, /data-student-requirement-quality="true"/);
  assert.match(student, /Try this: Add one measurable success target before you send the proposal back/);
  assert.match(student, /Send the revised Senior Project Proposal back for teacher review/);
  assert.match(student, /data-student-next-step-due="true"/);
  assert.match(student, /data-student-requirement-due="true"/);
  assert.match(student, /Due October 9 and 10/);
  assert.match(student, /Due January 14, make-up January 16/);
  assert.match(student, /Version 2/);
  assert.match(student, /data-student-feedback-panel="true"/);
  assert.match(student, /data-student-feedback-history="true"/);
  assert.match(student, /data-student-feedback-count="1"/);
  assert.match(student, /Feedback History/);
  assert.match(student, /Showing the latest 1 teacher note meant for you/);
  assert.match(student, /Add one measurable success target before resubmitting/);
  assert.match(student, /data-student-feedback-context="true"/);
  assert.match(student, /Version 2 \/ Current status: Revision requested/);
  assert.match(student, /data-submission-feedback="true"/);
  assert.match(student, /Latest teacher feedback: Add one measurable success target before resubmitting/);
  assert.match(student, /Progress Details/);
  assert.match(student, /May 5 archive/);
  assert.match(student, /Finish Reflections and portfolio/);
  assert.match(student, /Need help/);
  assert.doesNotMatch(student, /Due date: Not available yet/);
  assert.doesNotMatch(student, /Database-backed MVP/);
  assert.doesNotMatch(student, /Cloudflare target/);
  assert.doesNotMatch(student, /Audit-sensitive admin/);
  assert.doesNotMatch(student, /href="#"/);
  for (const pattern of [
    /\bprompt\b/i,
    /\bdeveloper\b/i,
    /\bprototype\b/i,
    /\bmock\b/i,
    /\bfake\b/i,
    /\bseed\b/i,
    /\binternal\b/i,
    /\bRBAC\b/i,
    /\bschema\b/i,
    /\bdebug\b/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
  ]) {
    assert.doesNotMatch(student, pattern);
  }
});

test("student feedback rows open a student-safe review timeline", async () => {
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-feedback-history",
          email: "student.feedback.history@senior-capstone.test",
          displayName: "Feedback History Student",
          roles: [{ role_id: "student", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/student/dashboard": {
      status: 200,
      body: {
        ok: true,
        viewer: { self: true },
        summary: {
          requirementsTotal: 2,
          requirementsComplete: 1,
          completionPercent: 50,
          submittedRequiredCount: 1,
          missingRequiredCount: 1,
          revisionRequestedCount: 1,
        },
        progress: [],
        submissions: [
          { id: "submission-proposal", requirement_id: "req-proposal", requirement_title: "Senior Project Proposal", status: "revision_requested", version: 2, updated_at: "2026-05-24T18:00:00.000Z" },
        ],
        evidence: [],
        feedback: [
          {
            id: "review-proposal",
            submissionId: "submission-proposal",
            requirementTitle: "Senior Project Proposal",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            status: "revision_requested",
            message: "Add one measurable success target before resubmitting.",
            authorName: "Ms. Garcia",
            createdAt: "2026-05-24T18:30:00.000Z",
          },
        ],
      },
    },
    "/api/reviews/submission-proposal/history": {
      status: 200,
      body: {
        ok: true,
        submission: { id: "submission-proposal", studentId: "student-feedback-history", status: "revision_requested", version: 2 },
        reviews: [
          {
            id: "review-proposal",
            decision: "revision_requested",
            feedback: "Add one measurable success target before resubmitting.",
            created_at: "2026-05-24T18:30:00.000Z",
            reviewer_name: "Ms. Garcia",
          },
        ],
        statusHistory: [
          {
            id: "status-proposal",
            from_status: "submitted",
            to_status: "revision_requested",
            reason: "Sent back for revision.",
            created_at: "2026-05-24T18:31:00.000Z",
            changed_by_name: "Ms. Garcia",
          },
        ],
        versions: [
          {
            id: "version-proposal-2",
            version: 2,
            status: "submitted",
            submittedAt: "2026-05-24T18:00:00.000Z",
            submittedByName: "Feedback History Student",
            notes: "",
            evidence: [],
          },
        ],
        comments: [
          {
            id: "comment-proposal",
            body: "Thanks for resubmitting the outline.",
            visibility: "student_visible",
            created_at: "2026-05-24T18:35:00.000Z",
            author_name: "Ms. Garcia",
          },
        ],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: { ok: true, summary: {}, checks: [], archive: {}, storage: {}, retention: {} },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  });

  assert.match(workspaceRoot.innerHTML, /data-student-feedback-action="open-history"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-submission-id="submission-proposal"/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackSubmissionId: "submission-proposal" } } })',
    context,
  );

  assert.ok(fetchLog.includes("/api/reviews/submission-proposal/history"));
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /Submission timeline/);
  assert.match(workspaceRoot.innerHTML, /Only feedback meant for you is shown here/);
  assert.match(workspaceRoot.innerHTML, /Version 2 submitted/);
  assert.match(workspaceRoot.innerHTML, /Sent back for revision/);
  assert.match(workspaceRoot.innerHTML, /Add one measurable success target before resubmitting/);
  assert.match(workspaceRoot.innerHTML, /Thanks for resubmitting the outline/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /staff_only|Private staff note|drive_file_id|driveFileId/i);
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
  assert.match(denied, /You do not have access to this section/);
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
  assert.match(noAssignment, /No students are assigned to you yet/);
  assert.match(noAssignment, /Mentor students/);
  assert.match(noAssignment, /No active students are assigned to this account yet/);

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
  assert.match(enabled, /Capstone Project Workspace/);
  assert.match(enabled, /School workspace/);
  assert.match(enabled, /Student progress/);
  assert.match(enabled, /Private evidence/);
  assert.match(enabled, /Mentor coverage/);
  assert.match(enabled, /Review queue/);
  assert.match(enabled, /Presentation readiness/);
  assert.doesNotMatch(enabled, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "admin", readOnly: true }),
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "admin", readOnly: true }),
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
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
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
          {
            id: "reflection_portfolio",
            label: "Reflections and portfolio",
            status: "missing",
            evidenceCount: 0,
            message: "Needs evidence or staff review before the archive package is ready.",
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
  assert.match(archive, /data-archive-guidance="true"/);
  assert.match(archive, /Your archive package is ready/);
  assert.match(archive, /data-archive-download="manifest"/);
  assert.match(archive, /Download archive manifest/);
  assert.match(archive, /Private file details stay hidden/);
  assert.match(archive, /data-archive-drive-package="ready"/);
  assert.match(archive, /Drive-backed archive package is stored/);
  assert.match(archive, /data-archive-retention-status="policy_review_required"/);
  assert.match(archive, /Retention policy needs school review before pilot archives/);
  assert.match(archive, /expiring soon/i);
});

test("workspace explains the next student archive blocker without adding fake actions", async () => {
  const archive = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-archive-blocked",
          email: "student.archive.blocked@example.edu",
          displayName: "Archive Blocked Student",
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
        evidence: [],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: {
        ok: true,
        source: "persisted_rows",
        summary: {
          readyChecks: 1,
          missingChecks: 2,
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
            id: "reflection_portfolio",
            label: "Reflections and portfolio",
            status: "missing",
            evidenceCount: 0,
            message: "Needs evidence or staff review before the archive package is ready.",
          },
        ],
        archive: {
          status: "not_requested",
          scopedDownloadReady: false,
          signedDownloadReady: false,
          drivePackageReady: false,
          downloadUrl: null,
        },
        storage: {
          providerStatus: "ready",
          credentialsConfigured: true,
          drivePackageReady: false,
          storageIdentifiersRedacted: true,
        },
        retention: {
          downloadWindowDays: 14,
          expiryWarningDays: 3,
          policyStatus: "policy_review_required",
          policyReviewRequired: true,
          downloadExpiresSoon: false,
        },
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "archive");

  assert.match(archive, /data-archive-guidance="true"/);
  assert.match(archive, /data-archive-guidance-status="missing"/);
  assert.match(archive, /Archive next step/);
  assert.match(archive, /Finish Reflections and portfolio/);
  assert.match(archive, /1 of 4 closeout checks ready/);
  assert.match(archive, /Add the missing work or ask your program teacher what to attach/);
  assert.match(archive, /Evidence matched: 0/);
  assert.doesNotMatch(archive, /data-archive-action|Request archive|href="#"/);
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
        label: "Teacher follow-up",
        detail: "84 submitted or revision-requested records need teacher follow-up.",
        status: "revision_requested",
      },
      {
        label: "Private evidence",
        detail: "690 private evidence items are counted without showing private file details.",
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

function siteReviewQueueFixture({
  role = "program_teacher",
  readOnly = role !== "program_teacher",
  canReview = role === "program_teacher" && !readOnly,
  queue = null,
  filters = null,
} = {}) {
  const rows = queue ?? [
    {
      submissionId: "submission-review-001",
      studentId: "demo-student-101",
      studentName: "Revision Loop Demo 001",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      programId: "it",
      programName: "Information Technology",
      cohortId: "cohort-it-2026",
      cohortName: "IT 2026",
      requirementId: "req-proposal",
      requirementTitle: "Project proposal",
      status: "submitted",
      version: 2,
      submittedAt: "2026-05-21T12:00:00.000Z",
      updatedAt: "2026-05-21T12:20:00.000Z",
      evidenceCount: 3,
      reviewCount: 1,
      commentCount: 2,
      storyBucket: "revision_requested",
      riskScore: 6,
      riskFlags: ["awaiting_review", "stale"],
      nextAction: "Review evidence and record teacher feedback.",
    },
    {
      submissionId: "submission-review-002",
      studentId: "demo-student-144",
      studentName: "Archive Failed Demo 001",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      programId: "it",
      programName: "Information Technology",
      cohortId: "cohort-it-2026",
      cohortName: "IT 2026",
      requirementId: "req-final",
      requirementTitle: "Final reflection",
      status: "revision_requested",
      version: 3,
      submittedAt: "2026-05-20T12:00:00.000Z",
      updatedAt: "2026-05-22T12:00:00.000Z",
      evidenceCount: 2,
      reviewCount: 2,
      commentCount: 3,
      storyBucket: "archive_failed",
      riskScore: 8,
      riskFlags: ["revision_requested", "high"],
      nextAction: "Wait for student revision or add comment-only guidance.",
    },
  ];
  return {
    ok: true,
    generatedAt: "2026-05-24T17:00:00.000Z",
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
      status: "",
      programId: "",
      search: "",
      story: "",
      risk: "any",
      limit: 50,
      offset: 0,
    },
    pagination: {
      limit: 50,
      offset: 0,
      returned: rows.length,
      total: rows.length,
      filteredTotal: rows.length,
    },
    summary: {
      submitted: rows.filter((row) => row.status === "submitted").length,
      revisionRequested: rows.filter((row) => row.status === "revision_requested").length,
      readyToReview: rows.filter((row) => row.status === "submitted" && row.evidenceCount > 0).length,
      overdueOrStale: 1,
      evidenceAttached: rows.filter((row) => row.evidenceCount > 0).length,
      highRisk: rows.filter((row) => row.riskScore >= 7).length,
    },
    queue: rows,
    filterOptions: {
      programs: [{ programId: "it", programName: "Information Technology", queueCount: rows.length }],
      statuses: ["submitted", "revision_requested", "approved"],
      storyBuckets: ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"],
      risks: ["any", "high", "medium", "low", "stale", "no_mentor"],
    },
    permissions: {
      canReview,
      canApprove: canReview,
      canRequestRevision: canReview,
      canCommentOnly: canReview,
      canViewStudentDetail: true,
      canViewStudentEvidence: true,
      canManageUsers: false,
      canManageSecurity: false,
    },
    emptyState: rows.length === 0 ? {
      reason: "No submitted or revision-requested work matches the selected filters.",
      owner: "Program teacher or site staff.",
      nextAction: "Adjust filters or review the student detail timeline for context.",
    } : null,
  };
}

function siteMentorAssignmentsFixture({
  role = "site_admin",
  readOnly = !["site_admin", "admin", "org_admin", "platform_admin"].includes(role),
  canManage = !readOnly && role !== "program_teacher" && role !== "viewer",
  filters = null,
} = {}) {
  return {
    ok: true,
    generatedAt: "2026-05-24T17:30:00.000Z",
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
      studentScope: role === "program_teacher" ? "program_teacher" : "site",
    },
    filters: filters || {
      siteId: "site-desert-valley-high",
      programId: "",
      mentorUserId: "",
      studentSearch: "",
      status: "",
      noMentor: false,
      limit: 50,
      offset: 0,
    },
    pagination: {
      limit: 50,
      offset: 0,
      returned: 2,
      total: role === "program_teacher" ? 45 : 250,
      filteredTotal: 17,
    },
    summary: {
      studentsTotal: role === "program_teacher" ? 45 : 250,
      studentsWithActiveMentor: role === "program_teacher" ? 41 : 233,
      studentsWithoutActiveMentor: role === "program_teacher" ? 4 : 17,
      activeMentors: 28,
      overloadedMentors: 1,
      averageAssignedPerMentor: 8.3,
    },
    mentors: [
      {
        mentorUserId: "demo-mentor-001",
        mentorName: "Mentor One",
        email: "mentor001@demo-mentor.capstone.test",
        activeAssignmentCount: 8,
        siteId: "site-desert-valley-high",
        siteName: "Desert Valley High School",
        loadStatus: "steady",
        nextAction: "Available for mentor support at this school.",
      },
      {
        mentorUserId: "demo-mentor-002",
        mentorName: "Mentor Two",
        email: "mentor002@demo-mentor.capstone.test",
        activeAssignmentCount: 0,
        siteId: "site-desert-valley-high",
        siteName: "Desert Valley High School",
        loadStatus: "available",
        nextAction: "Available for mentor support at this school.",
      },
    ],
    unassignedStudents: [
      {
        studentId: "demo-student-101",
        displayName: "Missing Mentor Demo 001",
        email: "missing.mentor.001@demo-student.capstone.test",
        programId: "it",
        programName: "Information Technology",
        cohortId: "cohort-it-2026",
        cohortName: "IT 2026",
        storyBucket: "missing_mentor",
        riskScore: 8,
        riskFlags: ["no_mentor", "high"],
        latestSubmissionStatus: "revision_requested",
        nextAction: "Assign a mentor before the next follow-up checkpoint.",
      },
    ],
    assignments: [
      {
        assignmentId: "demo-mentor-assignment-144",
        studentId: "demo-student-144",
        studentName: "Archive Failed Demo 001",
        mentorUserId: "demo-mentor-001",
        mentorName: "Mentor One",
        programId: "it",
        programName: "Information Technology",
        active: true,
        assignedAt: "2026-05-20T12:00:00.000Z",
        nextAction: "Monitor mentor meeting cadence and student progress.",
      },
    ],
    filterOptions: {
      programs: [
        { programId: "it", programName: "Information Technology", studentCount: role === "program_teacher" ? 45 : 69 },
      ],
      mentors: [
        { mentorUserId: "demo-mentor-001", mentorName: "Mentor One", activeAssignmentCount: 8 },
        { mentorUserId: "demo-mentor-002", mentorName: "Mentor Two", activeAssignmentCount: 0 },
      ],
      statuses: ["active", "unassigned", "all"],
      risks: ["any", "high", "medium", "low", "stale", "no_mentor"],
      storyBuckets: ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"],
    },
    permissions: {
      canManageMentorAssignments: canManage,
      canViewStudentDetail: true,
      canViewStudentDirectory: true,
      canManageUsers: false,
      canManageSecurity: false,
    },
    emptyState: null,
  };
}

function siteOperationsReadinessFixture({
  role = "site_admin",
  readOnly = true,
  total = role === "program_teacher" ? 45 : 250,
  filters = null,
} = {}) {
  const presentationRows = [
    {
      studentId: "demo-student-040",
      studentName: "Presentation Pending Demo 001",
      programId: "it",
      programName: "Information Technology",
      cohortId: "cohort-it-2026",
      cohortName: "IT 2026",
      storyBucket: "presentation_pending",
      riskScore: 6,
      riskFlags: ["presentation_pending", "no_mentor"],
      presentationStatus: "outline_pending",
      scheduledFor: "2026-06-04T17:00:00.000Z",
      location: "Demo Room 105",
      outlineStatus: "pending",
      checkInStatus: "scheduled",
      reason: "Presentation outline is pending approval.",
      owner: "Site administration",
      nextAction: "Review presentation readiness before completion.",
    },
  ];
  const archiveRows = [
    {
      studentId: "demo-student-054",
      studentName: "Archive Failed Demo 001",
      programId: "it",
      programName: "Information Technology",
      storyBucket: "archive_failed",
      riskScore: 7,
      riskFlags: ["archive_failed", "high"],
      archiveStatus: "failed",
      exportStatus: "failed",
      ready: false,
      failed: true,
      providerStatus: "drive_config_missing",
      downloadReady: false,
      downloadExpiresSoon: false,
      storageIdentifiersRedacted: true,
      reason: "Archive export failed and needs staff follow-up.",
      owner: "Archive operations",
      nextAction: "Review archive failure details before completion.",
    },
    {
      studentId: "demo-student-050",
      studentName: "Archive Ready Demo 001",
      programId: "it",
      programName: "Information Technology",
      storyBucket: "archive_ready",
      riskScore: 2,
      riskFlags: [],
      archiveStatus: "complete",
      exportStatus: "complete",
      ready: true,
      failed: false,
      providerStatus: "ready",
      downloadReady: true,
      downloadExpiresSoon: false,
      storageIdentifiersRedacted: true,
      reason: "Archive package is complete and scoped download is available when permitted.",
      owner: "Site administration",
      nextAction: "Continue closeout monitoring.",
    },
  ];
  const attentionRows = [
    {
      studentId: "demo-student-059",
      studentName: "High Risk Demo 001",
      programId: "it",
      programName: "Information Technology",
      category: "risk",
      status: "attention_required",
      reason: "High risk or stale capstone activity needs staff follow-up.",
      owner: "Site administration",
      nextAction: "Open student detail and confirm the current blocker.",
    },
  ];
  return {
    ok: true,
    generatedAt: "2026-05-24T18:00:00.000Z",
    scope: {
      tenantId: "tenant-desert-valley",
      tenantName: "Desert Valley School District",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      schoolYear: "2025-2026",
      role,
      readOnly,
      selectedBy: "single_accessible_site",
      studentScope: role === "program_teacher" ? "program_teacher" : "selected_site",
      accessibleSites: [
        { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      ],
    },
    filters: filters || {
      siteId: "site-desert-valley-high",
      programId: "",
      status: "",
      story: "",
      risk: "any",
      presentationStatus: "",
      archiveStatus: "",
      readiness: "",
      category: "",
      needsAttention: false,
      outlineAttention: false,
      limit: 50,
      offset: 0,
    },
    pagination: {
      limit: 50,
      offset: 0,
      returned: 3,
      total,
      filteredTotal: 3,
    },
    summary: {
      studentsTotal: total,
      presentationReady: 12,
      presentationPending: 9,
      presentationScheduled: 6,
      outlinePending: 5,
      archiveReady: 10,
      archiveFailed: 5,
      archiveMissing: 20,
      highRisk: 5,
      needsAttention: 15,
    },
    presentation: {
      summary: {
        ready: 12,
        scheduled: 6,
        pending: 0,
        completed: 8,
        missing: 14,
        outlinePending: 5,
        outlineRevisionNeeded: 4,
        attentionRequired: 0,
      },
      rows: presentationRows,
    },
    archive: {
      summary: {
        ready: 4,
        missing: 20,
        failed: 5,
        complete: 6,
        queued: 0,
        running: 0,
        expired: 0,
        expiringSoon: 0,
        providerUnavailable: 0,
      },
      rows: archiveRows,
    },
    readiness: {
      programBreakdown: [
        {
          programId: "it",
          programName: "Information Technology",
          studentsTotal: total,
          presentationPending: 9,
          archiveReady: 10,
          archiveFailed: 5,
          needsAttention: 15,
        },
      ],
      filteredProgramBreakdown: [
        {
          programId: "it",
          programName: "Information Technology",
          studentsTotal: 3,
          presentationPending: 1,
          archiveReady: 1,
          archiveFailed: 1,
          needsAttention: 1,
        },
      ],
      attentionRows,
      nextActions: [
        {
          owner: "Site administration",
          nextAction: "Open student detail and confirm the current blocker.",
          count: 5,
          category: "risk",
        },
      ],
    },
    permissions: {
      canViewPresentationOperations: true,
      canManagePresentationOperations: false,
      canViewArchiveOperations: true,
      canManageArchiveOperations: false,
      canViewReadinessReports: true,
      canViewStudentDetail: true,
      canManageUsers: false,
      canManageSecurity: false,
    },
    filterOptions: {
      programs: [{ programId: "it", programName: "Information Technology" }],
      statuses: ["draft", "submitted", "revision_requested", "approved", "archived"],
      storyBuckets: ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"],
      risks: ["high", "medium", "low", "stale", "no_mentor"],
      presentationStatuses: ["ready", "pending", "scheduled", "completed", "missing", "outline_pending", "outline_revision_needed", "attention_required"],
      archiveStatuses: ["ready", "complete", "failed", "missing", "queued", "running", "expired", "expiring_soon", "provider_unavailable"],
      readiness: ["ready", "in_progress", "attention_required", "blocked", "missing", "complete"],
      categories: ["archive", "risk", "mentor", "review", "presentation", "completion", "evidence", "readiness"],
    },
  };
}

function reviewHistoryFixture() {
  return {
    ok: true,
    submission: {
      id: "submission-review-001",
      status: "submitted",
      version: 2,
    },
    reviews: [
      {
        id: "review-review-001",
        decision: "revision_requested",
        feedback: "Improve scope and cite the private evidence summary.",
        reviewerName: "Program Teacher",
        reviewer_name: "Program Teacher",
        createdAt: "2026-05-21T12:30:00.000Z",
      },
    ],
    comments: [
      {
        id: "comment-review-001",
        body: "Bounded teacher comment.",
        authorName: "Program Teacher",
        createdAt: "2026-05-21T12:35:00.000Z",
      },
    ],
    statusHistory: [],
    versions: [],
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

async function renderWorkspaceWithFetch(routes, section = "", beforeSectionScript = "", options = {}) {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(routes, options);
  if (section || beforeSectionScript) {
    vm.runInContext(`${beforeSectionScript}\nactiveSection = ${JSON.stringify(section || "overview")}; renderAppShell();`, context);
  }
  return workspaceRoot.innerHTML;
}

async function createWorkspaceContextWithFetch(routes, options = {}) {
  const workspaceRoot = {
    innerHTML: "",
    querySelectorAll: () => [],
  };
  const inertElement = {
    addEventListener: () => {},
    querySelectorAll: () => [],
    value: "",
  };
  const initialUrl = options.url || "https://workspace.example/workspace.html";
  let currentHref = initialUrl;
  const listeners = new Map();
  const fetchLog = [];
  const locationChanges = [];
  const location = {};
  const updateLocation = (nextUrl) => {
    const parsed = new URL(nextUrl, currentHref);
    currentHref = parsed.href;
    location.href = parsed.href;
    location.pathname = parsed.pathname;
    location.search = parsed.search;
    location.hash = parsed.hash;
  };
  updateLocation(initialUrl);
  const history = {
    pushState(state, title, url) {
      updateLocation(url || currentHref);
      locationChanges.push({ method: "pushState", state, title, href: currentHref });
    },
    replaceState(state, title, url) {
      updateLocation(url || currentHref);
      locationChanges.push({ method: "replaceState", state, title, href: currentHref });
    },
  };
  const window = {
    location,
    history,
    addEventListener(type, handler) {
      const rows = listeners.get(type) || [];
      rows.push(handler);
      listeners.set(type, rows);
    },
    dispatchEvent(event) {
      const rows = listeners.get(event?.type) || [];
      for (const handler of rows) handler(event);
    },
  };
  const context = vm.createContext({
    Blob,
    FormData,
    Headers,
    Intl,
    URL,
    URLSearchParams,
    __fetchLog: fetchLog,
    __locationChanges: locationChanges,
    addEventListener: window.addEventListener,
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
      fetchLog.push(String(rawPath || ""));
      const pathname = String(rawPath || "").startsWith("http")
        ? new URL(rawPath).pathname
        : String(rawPath || "").split("?")[0];
      const route = routes[pathname] || (pathname === "/api/site/operations-readiness"
        ? { status: 200, body: siteOperationsReadinessFixture() }
        : null);
      if (!route) throw new Error(`Unexpected workspace fetch: ${pathname}`);
      return {
        ok: route.status >= 200 && route.status < 300,
        status: route.status,
        json: async () => route.body,
      };
    },
    history,
    location,
    setTimeout,
    window,
  });

  vm.runInContext(workspaceJs, context);
  for (let index = 0; index < 8; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return { context, workspaceRoot, fetchLog, locationChanges, window };
}
