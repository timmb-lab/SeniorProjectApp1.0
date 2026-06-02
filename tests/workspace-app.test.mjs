import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

const workspaceHtml = await readFile("workspace.html", "utf8");
const workspaceJs = await readFile("workspace.js", "utf8");
const workspaceCss = await readFile("workspace.css", "utf8");
const productionSurfaceCheck = await readFile("scripts/check-production-surfaces.mjs", "utf8");

function assertMarkupOrder(markup, beforeNeedle, afterNeedle, message) {
  const beforeIndex = markup.indexOf(beforeNeedle);
  const afterIndex = markup.indexOf(afterNeedle);
  assert.ok(beforeIndex >= 0, `missing before marker: ${beforeNeedle}`);
  assert.ok(afterIndex >= 0, `missing after marker: ${afterNeedle}`);
  assert.ok(beforeIndex < afterIndex, message);
}

function assertFocusableStudentDetailPanel(markup) {
  assert.match(markup, /id="siteStudentDetailPanel"/);
  assert.match(markup, /data-student-detail-panel="true"/);
  assert.match(markup, /tabindex="-1"/);
  assert.match(markup, /aria-labelledby="siteStudentDetailTitle"/);
}

function openWorkspaceDisclosure(context, scope, id) {
  vm.runInContext(`
    handleWorkspaceDisclosureToggle({
      currentTarget: {
        dataset: {
          workspaceDisclosureScope: ${JSON.stringify(scope)},
          workspaceDisclosureId: ${JSON.stringify(id)}
        }
      }
    });
  `, context);
}

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
  assert.match(workspaceJs, /\/api\/site\/programs/);
  assert.match(workspaceJs, /\/api\/site\/students/);
  assert.match(workspaceJs, /\/api\/admin\/dashboard/);
  assert.match(workspaceJs, /\/api\/program-teacher\/dashboard/);
  assert.match(workspaceJs, /\/api\/mentor\/dashboard/);
  assert.match(workspaceJs, /\/api\/mentor\/meetings/);
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
  assert.match(workspaceJs, /Welcome back/);
  assert.match(workspaceJs, /Sign in to open your workspace/);
  assert.match(workspaceJs, /What this workspace does/);
  assert.match(workspaceJs, /data-auth-action="complete-reset"/);
  assert.match(workspaceJs, /data-auth-action="change-password"/);
  assert.match(workspaceJs, /label: "Account", detail: "Password and sessions"/);
  assert.match(workspaceJs, /data-admin-action="import-users"/);
  assert.match(workspaceJs, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(workspaceJs, /credential_delivery_policy_required/);
  assert.match(workspaceJs, /Real local-account creation is blocked until the credential delivery policy is approved/);
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
  assert.match(workspaceJs, /function renderSiteProgramsSection/);
  assert.match(workspaceJs, /function renderSiteStudentDirectorySection/);
  assert.match(workspaceJs, /function renderProgramTeacherDashboardSection/);
  assert.match(workspaceJs, /function renderMentorDashboardSection/);
  assert.match(workspaceJs, /function submitMentorMeeting/);
  assert.match(workspaceJs, /function requestSiteStudentDetailFocus/);
  assert.match(workspaceJs, /data-student-detail-panel="true"/);
  assert.match(workspaceJs, /panel\.scrollIntoView\?\.\(\{ block: "start", behavior: "auto" \}\)/);
  assert.match(workspaceJs, /panel\.focus\?\.\(\{ preventScroll: true \}\)/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(selectedStudentId\)\}/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(siteStudentDetailState\.studentId\)\}\/timeline/);
  assert.match(workspaceJs, /Continue with Google/);
  assert.match(workspaceJs, /Google Workspace sign-in is not configured for this environment yet/);
  assert.match(workspaceJs, /Use this only if your school or project coordinator gave you a local account/);
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
    ".workspace-product-header-main",
    ".workspace-product-eyebrow",
    ".workspace-product-title",
    ".workspace-product-subtitle",
    ".workspace-posture-chips",
    ".workspace-posture-chip",
    ".workspace-landing-brand-row",
    ".workspace-landing-copy",
    ".workspace-home-info",
    ".workspace-auth-panel-heading",
    ".workspace-auth-section-heading",
    ".workspace-auth-section-label",
    ".workspace-dashboard-summary",
    ".workspace-dashboard-summary-badges",
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
  assert.match(workspaceJs, /site_admin: "Site Admin"/);
  assert.match(workspaceJs, /administration: "Administration"/);
  assert.match(workspaceJs, /platform_admin: "Global Admin"/);
  assert.match(workspaceJs, /org_admin: "Organization Admin"/);
  assert.match(workspaceJs, /viewer: "Viewer"/);
  assert.match(workspaceJs, /"platform_admin",\s+"global_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"administration"/);
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
    "Capstone Workspace",
    "Capstone Project Workspace",
  ]) {
    assert.ok(workspaceJs.includes(copy), `missing product header copy ${copy}`);
  }
  assert.doesNotMatch(workspaceJs, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);

  const signInBlock = workspaceJs.match(/function renderSignIn[\s\S]*?async function signIn/)?.[0] || "";
  const appShellBlock = workspaceJs.match(/function renderAppShell[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(workspaceJs, /function renderProductHeader\(options = \{\}\)/);
  assert.match(workspaceJs, /function renderWorkspaceLandingHero\(\)/);
  assert.match(workspaceJs, /function renderWorkspaceHomeInfoBox\(\)/);
  assert.match(workspaceJs, /What this workspace does/);
  assert.match(workspaceJs, /Students can see requirements, submit evidence, review feedback, and prepare for presentations/);
  assert.match(signInBlock, /renderWorkspaceLandingHero\(\)/);
  assert.doesNotMatch(signInBlock, /renderProductHeader\(/);
  assert.doesNotMatch(signInBlock, /Student progress|Private evidence|Mentor coverage|Review queue|Presentation readiness/);
  assert.match(appShellBlock, /renderProductHeader\(\{[\s\S]*context: headerContext,[\s\S]*readOnly: roles\.has\("viewer"\)/);
  assert.match(workspaceJs, /chips = WORKSPACE_POSTURE_CHIPS/);
  assert.match(workspaceCss, /\.workspace-auth-intro::before/);
  assert.match(workspaceCss, /\.workspace-auth-intro::after/);
  assert.match(workspaceCss, /\.workspace-home-info/);
  assert.doesNotMatch(workspaceCss, /app-hero\.jpg/);
  assert.match(workspaceJs, /function canUseSitePrograms\(roles\)\s*\{\s*return hasGlobalAdminRole\(roles\) \|\| roles\.has\("site_admin"\);\s*\}/);

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
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
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
  });
  vm.runInContext('activeSection = "siteDashboard"; renderAppShell();', context);
  const siteDashboard = workspaceRoot.innerHTML;

  assert.match(siteDashboard, /Site Dashboard/);
  assert.match(siteDashboard, /Desert Valley High School/);
  assert.match(siteDashboard, /Desert Valley High School \/ 2025-2026/);
  assert.match(siteDashboard, /Desert Valley School District/);
  assert.match(siteDashboard, /workspace-product-header/);
  assert.match(siteDashboard, /Capstone Workspace/);
  assert.match(siteDashboard, /Capstone Project Workspace/);
  assert.match(siteDashboard, /Student progress/);
  assert.match(siteDashboard, /Mentor coverage/);
  assert.match(siteDashboard, /Site Admin \/ Desert Valley High School/);
  assert.doesNotMatch(siteDashboard, /site:site-desert-valley-high|Global scope|role scope|total in scope/);
  assert.doesNotMatch(siteDashboard, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);
  assert.match(siteDashboard, /workspace-site-context-badge/);
  assert.match(siteDashboard, /Default site/);
  assert.match(siteDashboard, /Administration access/);
  assert.match(siteDashboard, /workspace-metric-tile/);
  assert.match(siteDashboard, /Students/);
  assert.match(siteDashboard, /No Mentor/);
  assert.match(siteDashboard, /data-section="students" data-section-preset="missing-mentors">View students/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="submitted">Review/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="revision-requested">Review/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="presentation-pending">Review/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="archive-failed">Review/);
  assert.match(siteDashboard, /Submitted/);
  assert.match(siteDashboard, /Needs Revision/);
  assert.match(siteDashboard, /Evidence/);
  assert.match(siteDashboard, /Presentations/);
  assert.match(siteDashboard, /Archive \/ Exports/);
  assert.match(siteDashboard, /data-workspace-disclosure-panel="dashboard:siteDashboard"/);
  assert.match(siteDashboard, /aria-expanded="false"/);
  assert.doesNotMatch(siteDashboard, /Program Breakdown|Top Risk Students|View load|data-site-student-action="view-detail"/);

  openWorkspaceDisclosure(context, "dashboard", "siteDashboard");
  const expandedSiteDashboard = workspaceRoot.innerHTML;
  assert.match(expandedSiteDashboard, /aria-expanded="true"/);
  assert.match(expandedSiteDashboard, /data-section="mentorAssignments" data-section-preset="mentor-workload" data-mentor-id="demo-mentor-001"/);
  assert.match(expandedSiteDashboard, /View load/);
  assert.match(expandedSiteDashboard, /data-section="students" data-section-preset="program" data-program-id="it"/);
  assert.match(expandedSiteDashboard, /View students/);
  assert.match(expandedSiteDashboard, /data-section="students" data-section-preset="status-breakdown" data-status-filter="submitted"/);
  assert.match(expandedSiteDashboard, /data-section="students" data-section-preset="status-breakdown" data-status-filter="revision_requested"/);
  assert.match(expandedSiteDashboard, /data-section="operations" data-section-preset="presentation-snapshot" data-presentation-status="scheduled">[\s\S]*Review rows/);
  assert.match(expandedSiteDashboard, /data-section="operations" data-section-preset="archive-snapshot" data-archive-status="failed">[\s\S]*Review rows/);
  assert.match(expandedSiteDashboard, /Checked out[\s\S]*Summary only/);
  assert.match(expandedSiteDashboard, /Private evidence/);
  assert.match(expandedSiteDashboard, /Assigned student records/);
  assert.match(expandedSiteDashboard, /Protected access/);
  assert.match(siteDashboard, /Teacher follow-up/);
  assert.doesNotMatch(siteDashboard, /Teacher intervention|Dashboard access is logged for protected school records/);
  assert.match(siteDashboard, /Current site/);
  assert.doesNotMatch(siteDashboard, /<p class="workspace-kicker">Current site<\/p>/);
  assert.match(siteDashboard, /workspace-site-switcher/);
  assert.match(expandedSiteDashboard, /data-site-student-action="view-detail"/);
  assert.match(expandedSiteDashboard, /workspace-status-pill/);
  assert.match(expandedSiteDashboard, /workspace-risk-chip/);
  assert.doesNotMatch(siteDashboard, /data-viewer-monitoring-overview="true"/);
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
  assert.match(viewer, /assigned student records for context/);
  assert.match(viewer, /data-workspace-state="permission-denied"/);
  assert.match(viewer, /Site dashboard unavailable/);
  assert.match(viewer, /assigned site dashboard records/);
  assert.doesNotMatch(viewer, /data-viewer-monitoring-overview="true"|data-admin-action="import-users"|Assign mentor|data-review-decision="approved"|data-archive-action/);

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
  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="dashboard:siteDashboard"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Top Risk Students/);
  openWorkspaceDisclosure(context, "dashboard", "siteDashboard");
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
  assert.match(workspaceRoot.innerHTML, /Desert Valley High School \/ 2025-2026/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'data-site-student-action="view-detail"',
    "site dashboard detail should render before dashboard student actions",
  );
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

test("site admin dashboard recent activity stays summary-only without global admin audit data", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-summary-only-audit",
          email: "site.audit.summary@example.edu",
          displayName: "Site Audit Summary Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false }),
    },
  });

  vm.runInContext('activeSection = "siteDashboard"; renderAppShell();', context);
  const sectionIds = JSON.parse(vm.runInContext("JSON.stringify(availableSections().map((section) => section.id))", context));

  assert.ok(!sectionIds.includes("audit"));
  assert.ok(!sectionIds.includes("archiveExports"));
  assert.match(workspaceRoot.innerHTML, /Recent Activity[\s\S]*Summary only/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-section="audit"/);
});

test("program teacher dashboard rows open existing student detail", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
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
        needsReview: [
          {
            submissionId: "submission-program-student-001",
            studentId: "demo-program-student-001",
            studentName: "Program Student One",
            requirementTitle: "Core Concept Proposal",
            status: "submitted",
            evidenceCount: 2,
            updatedAt: "2026-05-24T18:00:00.000Z",
          },
        ],
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
  });
  vm.runInContext('activeSection = "programDashboard"; renderAppShell();', context);
  const programTeacher = workspaceRoot.innerHTML;

  assert.match(programTeacher, /Program Dashboard/);
  assert.match(programTeacher, /Program Teacher Dashboard/);
  assert.match(programTeacher, /Total Students/);
  assert.match(programTeacher, /On Track/);
  assert.match(programTeacher, /Behind \/ Needs Support/);
  assert.match(programTeacher, /Missing Evidence/);
  assert.match(programTeacher, /Needs Review/);
  assert.match(programTeacher, /Missing Mentor/);
  assert.match(programTeacher, /data-section="students" data-section-preset="all-students"/);
  assert.match(programTeacher, /data-section="students" data-section-preset="on-track-students"/);
  assert.match(programTeacher, /data-section="students" data-section-preset="behind-students"/);
  assert.match(programTeacher, /data-section="students" data-section-preset="missing-evidence-students"/);
  assert.match(programTeacher, /Program Teacher \/ Assigned program: IT/);
  assert.match(programTeacher, /data-workspace-disclosure-panel="dashboard:programDashboard"/);
  assert.match(programTeacher, /aria-expanded="false"/);
  assert.doesNotMatch(programTeacher, /Students by program|Assigned student list|Recent Activity|Core Concept Proposal \/ 2 evidence/);

  openWorkspaceDisclosure(context, "dashboard", "programDashboard");
  const expandedProgramTeacher = workspaceRoot.innerHTML;
  assert.match(expandedProgramTeacher, /Students by program/);
  assert.match(expandedProgramTeacher, /Assigned student list/);
  assert.match(expandedProgramTeacher, /Recent Activity/);
  assert.match(expandedProgramTeacher, /Program Student One/);
  assert.match(expandedProgramTeacher, /Core Concept Proposal \/ 2 evidence/);
  assert.match(expandedProgramTeacher, /data-site-student-action="view-detail"/);
  assert.match(expandedProgramTeacher, /data-student-detail-id="demo-program-student-001"/);
  assert.doesNotMatch(programTeacher, /Source record counts|Visible in this role scope|assigned scope|Scoped Student Progress|program:it/);
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
        needsReview: [
          {
            submissionId: "submission-demo-student-101",
            studentId: "demo-student-101",
            studentName: "Program Student One",
            requirementTitle: "Core Concept Proposal",
            status: "submitted",
            evidenceCount: 2,
            updatedAt: "2026-05-24T18:00:00.000Z",
          },
        ],
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
  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="dashboard:programDashboard"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Core Concept Proposal \/ 2 evidence/);
  openWorkspaceDisclosure(context, "dashboard", "programDashboard");
  assert.match(workspaceRoot.innerHTML, /Program Student One/);
  assert.match(workspaceRoot.innerHTML, /Core Concept Proposal \/ 2 evidence/);
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
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'data-site-student-action="view-detail"',
    "program dashboard detail should render before dashboard student actions",
  );
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "programDashboard", sourceSection: "programDashboard" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "programDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
});

test("program teacher dashboard review metrics open filtered Review Queue", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "program-teacher-review-drilldown",
          email: "program.teacher.review.drilldown@example.edu",
          displayName: "Program Teacher Review Drilldown",
          roles: [{ role_id: "program_teacher", scope_type: "program", scope_id: "it" }],
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", total: 45 }),
    },
    "/api/site/review-queue": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      const status = parsed.searchParams.get("status") || "";
      return {
        status: 200,
        body: siteReviewQueueFixture({
          role: "program_teacher",
          filters: {
            programId: "",
            search: "",
            story: "",
            risk: "any",
            limit: 50,
            offset: 0,
            status,
          },
        }),
      };
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: {
        ok: true,
        scope: { role: "program_teacher", scopeType: "program", scopeId: "it" },
        summary: {
          scopedStudents: 45,
          submitted: 3,
          revisionRequested: 2,
          approved: 8,
          evidenceArtifacts: 12,
          noMentor: 1,
          meetingsMakeupRequired: 0,
          presentationsPending: 1,
        },
        needsAttention: [],
        needsReview: [],
        programBreakdown: [],
        students: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  });

  vm.runInContext('activeSection = "programDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-section="teacher" data-section-preset="submitted"/);
  assert.match(workspaceRoot.innerHTML, /data-section="teacher" data-section-preset="revision-requested"/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "submitted" } })', context);
  const submittedFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(submittedFetch, "expected submitted dashboard metric to load Review Queue");
  const submittedUrl = new URL(submittedFetch, "https://workspace.example");
  assert.equal(submittedUrl.searchParams.get("status"), "submitted");
  assert.equal(vm.runInContext("activeSection", context), "teacher");
  assert.match(window.location.href, /section=teacher/);
  assert.match(window.location.href, /status=submitted/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "revision-requested" } })', context);
  const revisionFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(revisionFetch, "expected revision dashboard metric to load Review Queue");
  const revisionUrl = new URL(revisionFetch, "https://workspace.example");
  assert.equal(revisionUrl.searchParams.get("status"), "revision_requested");
  assert.match(window.location.href, /status=revision_requested/);
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
  assert.match(siteAdmin, /250 total available/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="missing-mentors">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="submitted-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="revision-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="presentation-pending-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="archive-ready-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="archive-failed-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="high-risk-students">View students/);
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
  assert.match(teacher, /45 total available/);
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
  assert.match(empty, /No student records are visible right now/);
  assert.match(empty, /Reason/);
  assert.match(empty, /Owner/);
  assert.match(empty, /Next action/);

  const filteredSubmittedEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-empty-submitted-students",
          email: "site.empty.submitted@example.edu",
          displayName: "Site Empty Submitted Admin",
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
      body: siteStudentsFixture({
        filteredTotal: 0,
        students: [],
        filters: {
          search: "",
          programId: "",
          status: "submitted",
          noMentor: false,
          risk: "any",
          story: "",
          presentationStatus: "any",
          archiveStatus: "any",
          limit: 50,
          offset: 0,
        },
      }),
    },
  }, "students");
  assert.match(filteredSubmittedEmpty, /No matching submitted work/);
  assert.match(filteredSubmittedEmpty, /No students with submitted work match these filters/);
  assert.match(filteredSubmittedEmpty, /check the Review Queue for broader review work/);
  assert.doesNotMatch(filteredSubmittedEmpty, /No student records match these filters|No students match these filters/);

  const filteredArchiveEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-empty-archive-students",
          email: "viewer.empty.archive@example.edu",
          displayName: "Viewer Empty Archive",
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
      body: siteStudentsFixture({
        readOnly: true,
        filteredTotal: 0,
        students: [],
        filters: {
          search: "",
          programId: "",
          status: "",
          noMentor: false,
          risk: "any",
          story: "",
          presentationStatus: "any",
          archiveStatus: "failed",
          limit: 50,
          offset: 0,
        },
      }),
    },
  }, "students");
  assert.match(filteredArchiveEmpty, /No matching archive follow-up/);
  assert.match(filteredArchiveEmpty, /No students with archive export follow-up match these filters/);
  assert.match(filteredArchiveEmpty, /open Operations for archive readiness work/i);
  assert.doesNotMatch(filteredArchiveEmpty, /No student records match these filters|No students match these filters/);
});

test("student directory summary tiles apply real directory filters", async () => {
  const { context, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-directory-summary",
          email: "site.directory.summary@example.edu",
          displayName: "Site Directory Summary",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false }),
    },
    "/api/site/students": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      return {
        status: 200,
        body: siteStudentsFixture({
          filters: {
            search: "",
            programId: "",
            status: parsed.searchParams.get("status") || "",
            progressStatus: parsed.searchParams.get("progressStatus") || "",
            evidenceStatus: parsed.searchParams.get("evidenceStatus") || "",
            reviewStatus: parsed.searchParams.get("reviewStatus") || "",
            noMentor: parsed.searchParams.get("noMentor") === "true",
            risk: parsed.searchParams.get("risk") || "any",
            story: "",
            presentationStatus: parsed.searchParams.get("presentationStatus") || "any",
            archiveStatus: parsed.searchParams.get("archiveStatus") || "any",
            limit: 50,
            offset: 0,
          },
        }),
      };
    },
  }, "students");

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "submitted-students" } })', context);
  let studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  assert.ok(studentFetch, "expected submitted Student Directory tile to reload directory");
  let studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("status"), "submitted");
  assert.equal(vm.runInContext("activeSection", context), "students");
  assert.match(window.location.href, /section=students/);
  assert.match(window.location.href, /status=submitted/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "on-track-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("progressStatus"), "on_track");
  assert.match(window.location.href, /progressStatus=on_track/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "behind-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("progressStatus"), "behind");
  assert.match(window.location.href, /progressStatus=behind/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "missing-evidence-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("evidenceStatus"), "missing");
  assert.match(window.location.href, /evidenceStatus=missing/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "needs-review-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("reviewStatus"), "needs_review");
  assert.match(window.location.href, /reviewStatus=needs_review/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "revision-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("status"), "revision_requested");
  assert.match(window.location.href, /status=revision_requested/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "high-risk-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("risk"), "high");
  assert.match(window.location.href, /risk=high/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "presentation-pending-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("presentationStatus"), "pending");
  assert.match(window.location.href, /presentationStatus=pending/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "archive-ready-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("archiveStatus"), "ready");
  assert.match(window.location.href, /archiveStatus=ready/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "archive-failed-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("archiveStatus"), "failed");
  assert.match(window.location.href, /archiveStatus=failed/);
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
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch({
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
    "/api/site/students/demo-student-101/timeline": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      const body = siteStudentTimelineFixture({ readOnly: true });
      if (parsed.searchParams.get("type") === "review") {
        body.filters.type = "review";
        body.events = body.events.filter((event) => event.type === "review");
        body.pagination.returned = body.events.length;
      }
      return { status: 200, body };
    },
    "/api/site/operations-readiness": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      return {
        status: 200,
        body: siteOperationsReadinessFixture({
          role: "viewer",
          readOnly: true,
          filters: {
            ...siteOperationsReadinessFixture({ role: "viewer", readOnly: true }).filters,
            studentId: parsed.searchParams.get("studentId") || "",
          },
        }),
      };
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
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'data-site-student-action="view-detail"',
    "student directory detail should render before filtered student rows",
  );
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

  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "mentor" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="mentor"/);
  assert.match(workspaceRoot.innerHTML, /Mentor Coverage History/);
  assert.match(workspaceRoot.innerHTML, /Assignment timeline/);
  assert.match(workspaceRoot.innerHTML, /Previous Mentor/);
  assert.match(workspaceRoot.innerHTML, /This previous mentor assignment is inactive/);
  assert.match(workspaceRoot.innerHTML, /Assigned May 1/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /assignment-previous-101|mentor-previous-101|assigned-by-101/);

  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "timeline" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="timeline"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-timeline-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /Showing all activity/);
  assert.match(workspaceRoot.innerHTML, /Timeline event/);
  assert.match(workspaceRoot.innerHTML, /Evidence added/);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  let timelineFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students/demo-student-101/timeline?"));
  let timelineUrl = new URL(timelineFetch, "https://workspace.example");
  assert.equal(timelineUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(timelineUrl.searchParams.has("type"), false);

  await vm.runInContext('selectSiteStudentTimelineType({ currentTarget: { dataset: { studentDetailTimelineType: "review" } } })', context);
  assert.match(workspaceRoot.innerHTML, /Showing reviews/);
  assert.match(workspaceRoot.innerHTML, /Review Revision requested/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Evidence added/);
  timelineFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students/demo-student-101/timeline?"));
  timelineUrl = new URL(timelineFetch, "https://workspace.example");
  assert.equal(timelineUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(timelineUrl.searchParams.get("type"), "review");

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  assert.match(workspaceRoot.innerHTML, /Offset 50 \/ Limit 50/);

  await vm.runInContext('openSiteStudentDetail("demo-student-101")', context);
  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "presentation" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="presentation"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-detail-action="open-operations"|Open operations for this student/);
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
  assert.doesNotMatch(teacher, /Teacher intervention/);
  assert.match(teacher, /data-section="teacher" data-section-preset="evidence-attached-review">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="evidence-missing-review">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="high-risk">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="stale-review">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="missing-mentor-review">Review rows/);
  assert.match(teacher, /workspace-student-row is-selected/);
  assert.match(teacher, /data-review-row-state="selected"/);
  assert.match(teacher, /workspace-status-pill submitted/);
  assert.match(teacher, /workspace-story-chip/);
  assert.match(teacher, /workspace-risk-chip/);
  assert.match(teacher, /Selected row\. History and available actions are loaded on the right\./);
  assert.match(teacher, /Teacher decisions are ready on this submitted row\./);
  assert.match(teacher, /data-review-queue-action="open-student"/);
  assert.match(teacher, /data-review-history-section="true"/);
  assert.match(teacher, /data-review-comment-visibility-summary="true"/);
  assert.match(teacher, /Student-visible comments: 1/);
  assert.match(teacher, /Staff-only comments: 1/);
  assert.match(teacher, /Only counts are shown here; teacher note text stays protected/);
  assert.match(teacher, /data-review-decision="approved"/);
  assert.match(teacher, /data-review-decision="revision_requested"/);
  assert.match(teacher, /data-review-decision="comment_only"/);
  assert.match(teacher, /<textarea name="feedback"/);
  assert.doesNotMatch(teacher, /Bounded teacher comment|Private staff planning note/);

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
  assert.match(viewer, /data-workspace-state="permission-denied"/);
  assert.match(viewer, /Teacher review queue unavailable/);
  assert.match(viewer, /submitted student work/);
  assert.doesNotMatch(viewer, /data-review-decision="approved"|data-review-decision="revision_requested"|data-review-decision="comment_only"|<textarea name="feedback"/);

  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
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
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'workspace-review-layout',
    "review queue detail should render before the review worklist layout",
  );
  assert.match(workspaceRoot.innerHTML, /Submitted work/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "teacher", sourceSection: "teacher" },
  );
  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "teacher");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "high-risk" } })', context);
  const highRiskFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(highRiskFetch, "expected high-risk Review Queue metric to load Review Queue");
  const highRiskUrl = new URL(highRiskFetch, "https://workspace.example");
  assert.equal(highRiskUrl.searchParams.get("risk"), "high");
  assert.equal(highRiskUrl.searchParams.has("status"), false);
  assert.match(window.location.href, /section=teacher/);
  assert.match(window.location.href, /risk=high/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "stale-review" } })', context);
  const staleReviewFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(staleReviewFetch, "expected stale Review Queue metric to load Review Queue");
  const staleReviewUrl = new URL(staleReviewFetch, "https://workspace.example");
  assert.equal(staleReviewUrl.searchParams.get("risk"), "stale");
  assert.equal(staleReviewUrl.searchParams.has("status"), false);
  assert.match(window.location.href, /section=teacher/);
  assert.match(window.location.href, /risk=stale/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "missing-mentor-review" } })', context);
  const missingMentorReviewFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(missingMentorReviewFetch, "expected missing-mentor Review Queue metric to load Review Queue");
  const missingMentorReviewUrl = new URL(missingMentorReviewFetch, "https://workspace.example");
  assert.equal(missingMentorReviewUrl.searchParams.get("risk"), "no_mentor");
  assert.equal(missingMentorReviewUrl.searchParams.has("status"), false);
  assert.match(window.location.href, /section=teacher/);
  assert.match(window.location.href, /risk=no_mentor/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "evidence-attached-review" } })', context);
  const evidenceAttachedFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(evidenceAttachedFetch, "expected evidence-attached Review Queue metric to load Review Queue");
  const evidenceAttachedUrl = new URL(evidenceAttachedFetch, "https://workspace.example");
  assert.equal(evidenceAttachedUrl.searchParams.get("evidenceStatus"), "attached");
  assert.equal(evidenceAttachedUrl.searchParams.has("status"), false);
  assert.match(window.location.href, /section=teacher/);
  assert.match(window.location.href, /evidenceStatus=attached/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "teacher", sectionPreset: "evidence-missing-review" } })', context);
  const evidenceMissingFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(evidenceMissingFetch, "expected evidence-missing Review Queue metric to load Review Queue");
  const evidenceMissingUrl = new URL(evidenceMissingFetch, "https://workspace.example");
  assert.equal(evidenceMissingUrl.searchParams.get("evidenceStatus"), "missing");
  assert.equal(evidenceMissingUrl.searchParams.has("status"), false);
  assert.match(window.location.href, /section=teacher/);
  assert.match(window.location.href, /evidenceStatus=missing/);
});

test("workspace clarifies Review Queue row actions and follow-up-only selected rows", async () => {
  const rowActions = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-actions",
          email: "teacher.review.actions@example.edu",
          displayName: "Program Teacher Review Actions",
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
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 2 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher");

  assert.match(rowActions, /Open review/);
  assert.match(rowActions, /Open follow-up/);
  assert.match(rowActions, /Open this row to load history and teacher decisions\./);
  assert.match(rowActions, /Open this row to load history and follow-up context\./);
  assert.match(rowActions, /Open a submitted row to load teacher decisions, or open a revision row to review history and follow-up context\./);

  const revisionHistory = {
    ...reviewHistoryFixture(),
    submission: {
      id: "submission-review-002",
      status: "revision_requested",
      version: 3,
    },
  };
  const revisionSelected = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-revision-selected",
          email: "teacher.review.revision.selected@example.edu",
          displayName: "Program Teacher Review Revision Selected",
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
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 2 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher", `
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId: "submission-review-002",
      historyResult: { ok: true, status: 200, body: ${JSON.stringify(revisionHistory)} }
    };
  `);

  assert.match(revisionSelected, /Revision requested is follow-up only here\. Use history and student detail for context\./);
  assert.match(revisionSelected, /No teacher decision available for this row/);
  assert.match(revisionSelected, /This row is currently revision requested\./i);
  assert.match(revisionSelected, /open submitted work from this queue when a decision is needed/i);
});

test("workspace renders Review Queue empty and history states with assigned-work language", async () => {
  const emptyFilters = {
    status: "approved",
    programId: "",
    search: "no matching proposal",
    story: "",
    risk: "any",
    limit: 50,
    offset: 0,
  };
  const filteredEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-empty",
          email: "teacher.review.empty@example.edu",
          displayName: "Program Teacher Review Empty",
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
      body: siteReviewQueueFixture({ role: "program_teacher", queue: [], filters: emptyFilters }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 0 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher");

  assert.match(filteredEmpty, /No matching approved work/);
  assert.match(filteredEmpty, /No approved review records match these filters/);
  assert.match(filteredEmpty, /Assigned review staff/);
  assert.match(filteredEmpty, /Clear filters to return to submitted and revision work/);
  assert.doesNotMatch(filteredEmpty, /No review rows match|No review items match|assigned access|Program teacher or site staff/);

  const evidenceMissingEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-evidence-empty",
          email: "teacher.review.evidence.empty@example.edu",
          displayName: "Program Teacher Review Evidence Empty",
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
      body: siteReviewQueueFixture({
        role: "program_teacher",
        queue: [],
        filters: {
          status: "",
          programId: "",
          search: "",
          story: "",
          risk: "any",
          evidenceStatus: "missing",
          limit: 50,
          offset: 0,
        },
      }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 0 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher");

  assert.match(evidenceMissingEmpty, /No matching evidence follow-up/);
  assert.match(evidenceMissingEmpty, /No submitted or revision-requested work without attached evidence matches these filters/);
  assert.match(evidenceMissingEmpty, /Clear the evidence filter or check Operations Evidence Missing/);
  assert.doesNotMatch(evidenceMissingEmpty, /No submitted or revision-requested work matches these filters/);

  const revisionEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-revision-empty",
          email: "teacher.review.revision.empty@example.edu",
          displayName: "Program Teacher Review Revision Empty",
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
      body: siteReviewQueueFixture({
        role: "program_teacher",
        queue: [],
        filters: {
          status: "revision_requested",
          programId: "",
          search: "",
          story: "",
          risk: "any",
          evidenceStatus: "",
          limit: 50,
          offset: 0,
        },
      }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 0 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher");

  assert.match(revisionEmpty, /No matching revision follow-up/);
  assert.match(revisionEmpty, /No work needing revision follow-up matches these filters/);
  assert.match(revisionEmpty, /Clear filters or check Submitted for newly sent work/);
  assert.doesNotMatch(revisionEmpty, /No submitted or revision-requested work matches these filters/);

  const unfilteredEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-no-work",
          email: "teacher.review.no-work@example.edu",
          displayName: "Program Teacher Review No Work",
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
      body: siteReviewQueueFixture({ role: "program_teacher", queue: [] }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 0 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher");

  assert.match(unfilteredEmpty, /No review work waiting/);
  assert.match(unfilteredEmpty, /No submitted or revision-requested work is waiting in this review queue right now/);
  assert.match(unfilteredEmpty, /Open Students for context or keep monitoring new submissions/);
  assert.doesNotMatch(unfilteredEmpty, /No review rows match|assigned access/);

  const noHistory = {
    ...reviewHistoryFixture(),
    reviews: [],
    comments: [],
  };
  const historyEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-history-empty",
          email: "teacher.review.history.empty@example.edu",
          displayName: "Program Teacher Review History Empty",
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
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 1 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "teacher", `
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId: "submission-review-001",
      historyResult: { ok: true, status: 200, body: ${JSON.stringify(noHistory)} }
    };
  `);

  assert.match(historyEmpty, /data-review-history-empty="true"/);
  assert.match(historyEmpty, /No review decisions recorded yet/);
  assert.match(historyEmpty, /No protected comments recorded for this submission yet/);
  assert.doesNotMatch(historyEmpty, /No review history is loaded yet|comments available for this submission/);
});

test("workspace applies Review Queue URL filters safely and syncs filter URLs", async () => {
  const urlFilters = {
    status: "revision_requested",
    programId: "",
    search: "proposal scope",
    story: "",
    risk: "stale",
    evidenceStatus: "attached",
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
    "/api/reviews/submission-review-001/history": {
      status: 200,
      body: reviewHistoryFixture(),
    },
  }, {
    url: "https://workspace.example/workspace.html?section=teacher&siteId=site-desert-valley-high&status=revision_requested&search=%20proposal%20scope%20&risk=bogus&overdue=true&evidenceStatus=attached&submissionId=submission-review-001&limit=999&offset=-50&unknown=keep",
  });

  const reviewFetch = fetchLog.find((entry) => entry.startsWith("/api/site/review-queue?"));
  assert.ok(reviewFetch, "expected Review Queue fetch with URL-derived filters");
  const fetched = new URL(reviewFetch, "https://workspace.example");
  assert.equal(fetched.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(fetched.searchParams.get("status"), "revision_requested");
  assert.equal(fetched.searchParams.get("search"), "proposal scope");
  assert.equal(fetched.searchParams.get("risk"), "stale");
  assert.equal(fetched.searchParams.get("evidenceStatus"), "attached");
  assert.equal(fetched.searchParams.get("limit"), "100");
  assert.equal(fetched.searchParams.has("offset"), false);
  assert.match(workspaceRoot.innerHTML, /data-section="teacher"/);
  assert.match(workspaceRoot.innerHTML, /Active filters/);
  assert.match(workspaceRoot.innerHTML, /Revision requested/);
  assert.match(workspaceRoot.innerHTML, /Stale activity/);
  assert.match(workspaceRoot.innerHTML, /Evidence attached/);
  assert.match(workspaceRoot.innerHTML, /proposal scope/);
  assert.match(workspaceRoot.innerHTML, /Clear filters/);
  assert.ok(fetchLog.includes("/api/reviews/submission-review-001/history?siteId=site-desert-valley-high"));
  assert.match(workspaceRoot.innerHTML, /data-review-selected-submission="submission-review-001"/);
  assert.match(workspaceRoot.innerHTML, /Improve scope and cite the private evidence summary/);

  await vm.runInContext('handleReviewQueueAction({ currentTarget: { dataset: { reviewQueueAction: "reset-filters" } } })', context);
  assert.match(window.location.href, /unknown=keep/);
  assert.match(window.location.href, /section=teacher/);
  assert.doesNotMatch(window.location.href, /status=|search=|risk=|limit=|offset=|evidenceStatus=|submissionId=/);

  vm.runInContext(`
    reviewQueueFilters = {
      ...defaultReviewQueueFilters(),
      status: "submitted",
      programId: "it",
      search: "senior proposal",
      risk: "high",
      evidenceStatus: "attached",
      limit: 25
    };
    reviewQueueState = {
      ...defaultReviewQueueState(),
      selectedSubmissionId: "submission-review-001"
    };
    syncReviewQueueUrlState();
  `, context);
  const synced = new URL(window.location.href);
  assert.equal(synced.searchParams.get("section"), "teacher");
  assert.equal(synced.searchParams.get("status"), "submitted");
  assert.equal(synced.searchParams.get("programId"), "it");
  assert.equal(synced.searchParams.get("search"), "senior proposal");
  assert.equal(synced.searchParams.get("risk"), "high");
  assert.equal(synced.searchParams.get("evidenceStatus"), "attached");
  assert.equal(synced.searchParams.get("submissionId"), "submission-review-001");
  assert.equal(synced.searchParams.get("limit"), "25");
  assert.equal(synced.searchParams.get("unknown"), "keep");

  const historyFetchesBeforePop = fetchLog.filter((entry) => entry.startsWith("/api/reviews/submission-review-001/history")).length;
  window.history.pushState({}, "", "/workspace.html?section=teacher&siteId=site-desert-valley-high&status=revision_requested&risk=stale&evidenceStatus=attached&submissionId=submission-review-001&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  for (let index = 0; index < 4; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const restored = JSON.parse(vm.runInContext("JSON.stringify(reviewQueueFilters)", context));
  assert.equal(restored.status, "revision_requested");
  assert.equal(restored.risk, "stale");
  assert.equal(restored.evidenceStatus, "attached");
  assert.equal(vm.runInContext("reviewQueueState.selectedSubmissionId", context), "submission-review-001");
  assert.equal(
    fetchLog.filter((entry) => entry.startsWith("/api/reviews/submission-review-001/history")).length,
    historyFetchesBeforePop + 1,
  );
});

test("workspace explains Review Queue shared selections that are no longer visible", async () => {
  const otherReviewRow = siteReviewQueueFixture({ role: "program_teacher" }).queue[1];
  const { workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-stale-selection",
          email: "teacher.review.stale.selection@example.edu",
          displayName: "Program Teacher Review Stale Selection",
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
      body: siteReviewQueueFixture({ role: "program_teacher", queue: [otherReviewRow] }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, summary: { scopedStudents: 45, submissionsAwaitingReview: 1 }, students: [], programBreakdown: [] },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, {
    url: "https://workspace.example/workspace.html?section=teacher&siteId=site-desert-valley-high&submissionId=submission-review-001&unknown=keep",
  });

  assert.match(workspaceRoot.innerHTML, /data-review-panel-state="selection-unavailable"/);
  assert.match(workspaceRoot.innerHTML, /Shared submission not visible/);
  assert.match(workspaceRoot.innerHTML, /The shared submission is not visible in this review queue with the current filters/);
  assert.match(workspaceRoot.innerHTML, /Protected history loads only after the row appears in this scoped queue/);
  assert.match(window.location.href, /unknown=keep/);
  assert.doesNotMatch(window.location.href, /submissionId=/);
  assert.equal(fetchLog.some((entry) => entry.startsWith("/api/reviews/submission-review-001/history")), false);
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
  assert.equal(operationsUrl.searchParams.get("studentId"), "stale");
  assert.equal(operationsUrl.searchParams.has("presentationStatus"), false);
  assert.equal(operationsUrl.searchParams.has("offset"), false);
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

test("mentor dashboard focus URLs restore and sync without refetching assigned-student data", async () => {
  const mentorDashboardBody = {
    ok: true,
    scope: "mentor_assigned",
    summary: {
      assignedCount: 2,
      needsRevision: 1,
      missingMeeting: 1,
      presentationPending: 1,
    },
    assignedStudents: [
      {
        studentId: "demo-student-102",
        studentName: "Avery On Track",
        submissionStatus: "approved",
        latestSubmissionUpdatedAt: "2026-05-27T15:00:00.000Z",
        evidenceCount: 5,
        mentorMeetingStatus: "completed",
        latestMentorMeetingAt: "2026-05-28T14:30:00.000Z",
        presentationStatus: "completed",
        outlineStatus: "approved",
        latestPresentationScheduledFor: "2026-05-30T18:00:00.000Z",
        needsAttention: [],
      },
      {
        studentId: "demo-student-101",
        studentName: "Zoe Needs Help",
        submissionStatus: "revision_requested",
        latestSubmissionUpdatedAt: "2026-05-24T18:00:00.000Z",
        evidenceCount: 3,
        mentorMeetingStatus: "makeup_required",
        latestMentorMeetingAt: "2026-05-27T15:30:00.000Z",
        presentationStatus: "not_scheduled",
        outlineStatus: "pending",
        latestPresentationScheduledFor: "2026-05-29T18:15:00.000Z",
        needsAttention: ["mentor_meeting", "presentation"],
      },
    ],
  };
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "mentor-url-state-user",
          email: "mentor.url.state@example.edu",
          displayName: "Mentor URL State",
          roles: [{ role_id: "mentor", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/mentor/dashboard": () => ({ status: 200, body: mentorDashboardBody }),
    "/api/mentor/assigned": () => ({ status: 200, body: { ok: true, mentorId: "mentor-url-state-user", assignedStudents: [] } }),
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [], summary: {} },
    },
  }, {
    url: "https://workspace.example/workspace.html?section=mentorDashboard&siteId=site-desert-valley-high&mentorFocus=%20meeting%20&unknown=keep",
  });

  assert.match(workspaceRoot.innerHTML, /data-section="mentorDashboard"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filter="meeting" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Zoe Needs Help/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Avery On Track/);

  vm.runInContext(`
    mentorDashboardFilter = "presentation";
    activeSection = "mentorDashboard";
    syncMentorDashboardUrlState();
  `, context);
  const synced = new URL(window.location.href);
  assert.equal(synced.searchParams.get("section"), "mentorDashboard");
  assert.equal(synced.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(synced.searchParams.get("mentorFocus"), "presentation");
  assert.equal(synced.searchParams.get("unknown"), "keep");

  const dashboardFetchCount = fetchLog.filter((entry) => entry === "/api/mentor/dashboard").length;
  window.history.pushState({}, "", "/workspace.html?section=mentorDashboard&siteId=site-desert-valley-high&mentorFocus=bogus&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  for (let index = 0; index < 2; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(vm.runInContext("mentorDashboardFilter", context), "all");
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filter="all" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Avery On Track/);
  assert.equal(fetchLog.filter((entry) => entry === "/api/mentor/dashboard").length, dashboardFetchCount);
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
  assert.match(siteAdmin, /data-section="mentorAssignments" data-section-preset="active-assignments">View assignments/);
  assert.match(siteAdmin, /data-section="mentorAssignments" data-section-preset="no-mentor">View students/);
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
  assert.match(siteAdmin, /data-mentor-assignment-load-guidance="true"/);
  assert.match(siteAdmin, /Mentor load is shown before assignment/);
  assert.match(siteAdmin, /Mentor One \/ 8 active \/ Steady load/);
  assert.match(siteAdmin, /Mentor Two \/ 0 active \/ Available/);
  assert.match(siteAdmin, /Lightest visible mentor: Mentor Two \/ 0 active \/ Available/);
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
  assert.match(viewer, /data-workspace-state="permission-denied"/);
  assert.match(viewer, /Mentor assignments unavailable/);
  assert.match(viewer, /assigned site mentor coverage records/);
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

test("mentor summary tiles and rows filter Mentor Assignments", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-mentor-row-filter",
          email: "site.mentor.row.filter@example.edu",
          displayName: "Mentor Row Filter Admin",
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
  }, {
    url: "https://workspace.example/workspace.html?section=mentorAssignments&siteId=site-desert-valley-high",
  });

  assert.match(workspaceRoot.innerHTML, /data-mentor-coverage-list="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-assignment-action="filter-mentor" data-mentor-id="demo-mentor-001"/);
  assert.match(workspaceRoot.innerHTML, /View assignments/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-active-assignments="true"/);
  assert.match(workspaceRoot.innerHTML, /View mentor load/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-assignment-action="filter-mentor" data-mentor-id="demo-mentor-001"[\s\S]*View mentor load/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "mentorAssignments", sectionPreset: "active-assignments" } })', context);
  const activeFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/mentor-assignments?"));
  assert.ok(activeFetch, "expected Mentor Assignments fetch after active summary filter");
  const activeUrl = new URL(activeFetch, "https://workspace.example");
  assert.equal(activeUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(activeUrl.searchParams.get("status"), "active");
  assert.equal(activeUrl.searchParams.get("noMentor"), null);
  assert.match(window.location.href, /section=mentorAssignments/);
  assert.match(window.location.href, /status=active/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "mentorAssignments", sectionPreset: "no-mentor" } })', context);
  const noMentorFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/mentor-assignments?"));
  assert.ok(noMentorFetch, "expected Mentor Assignments fetch after missing mentor summary filter");
  const noMentorUrl = new URL(noMentorFetch, "https://workspace.example");
  assert.equal(noMentorUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(noMentorUrl.searchParams.get("status"), "unassigned");
  assert.equal(noMentorUrl.searchParams.get("noMentor"), "true");
  assert.match(window.location.href, /status=unassigned/);
  assert.match(window.location.href, /noMentor=true/);

  await vm.runInContext('handleMentorAssignmentAction({ currentTarget: { dataset: { mentorAssignmentAction: "filter-mentor", mentorId: "demo-mentor-001" } } })', context);
  const mentorFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/mentor-assignments?"));
  assert.ok(mentorFetch, "expected Mentor Assignments fetch after row filter");
  const mentorUrl = new URL(mentorFetch, "https://workspace.example");
  assert.equal(mentorUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(mentorUrl.searchParams.get("mentorUserId"), "demo-mentor-001");
  assert.equal(mentorUrl.searchParams.get("status"), "active");
  assert.match(window.location.href, /section=mentorAssignments/);
  assert.match(window.location.href, /mentorUserId=demo-mentor-001/);
  assert.match(window.location.href, /status=active/);
});

test("mentor assignment empty state uses student coverage language instead of row jargon", async () => {
  const filtered = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-mentor-empty",
          email: "site.mentor.empty@example.edu",
          displayName: "Mentor Empty Admin",
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
        unassignedStudents: [],
        pagination: { returned: 0, filteredTotal: 0 },
        filters: {
          siteId: "site-desert-valley-high",
          programId: "it",
          mentorUserId: "",
          studentSearch: "",
          status: "unassigned",
          noMentor: true,
          limit: 50,
          offset: 0,
        },
      }),
    },
  }, "mentorAssignments");

  assert.match(filtered, /data-mentor-assignments-empty="true"/);
  assert.match(filtered, /No matching students need mentors/);
  assert.match(filtered, /Clear filters or review active assignments/);
  assert.doesNotMatch(filtered, /No missing mentor rows match|data rows/i);

  const noCoverageNeeded = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-mentor-no-coverage-needed",
          email: "site.mentor.no.coverage@example.edu",
          displayName: "Mentor Coverage Admin",
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
        unassignedStudents: [],
        pagination: { returned: 0, filteredTotal: 0 },
      }),
    },
  }, "mentorAssignments");

  assert.match(noCoverageNeeded, /No students need mentors right now/);
  assert.match(noCoverageNeeded, /Every visible student at this school has active mentor coverage/);
  assert.doesNotMatch(noCoverageNeeded, /No missing mentor rows match|data rows/i);
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
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'workspace-mentor-assignment-layout',
    "mentor assignment detail should render before the mentor assignment layout",
  );
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
  assert.match(siteAdmin, /Operations command center/);
  assert.match(siteAdmin, /School operations dashboard/);
  assert.match(siteAdmin, /School follow-up worklists/);
  assert.match(siteAdmin, /workspace-operations-readiness/);
  assert.match(siteAdmin, /workspace-filter-bar/);
  assert.match(siteAdmin, /data-readiness-score-card="true"/);
  assert.match(siteAdmin, /Readiness score/);
  assert.match(siteAdmin, /Stage distribution/);
  assert.match(siteAdmin, /Top blocker categories/);
  assert.match(siteAdmin, /Top next actions/);
  assert.match(siteAdmin, /Priority worklist/);
  assert.match(siteAdmin, /data-operations-compact-worklist="true"/);
  assert.match(siteAdmin, /data-operations-ranked-actions="true"/);
  assert.equal((siteAdmin.match(/<article class="workspace-dashboard-kpi/g) || []).length, 6);
  assert.doesNotMatch(siteAdmin, /workspace-metric-tile/);
  assert.match(siteAdmin, /Presentation ready/);
  assert.match(siteAdmin, /Presentation pending/);
  assert.match(siteAdmin, /Outline pending/);
  assert.match(siteAdmin, /Archive ready/);
  assert.match(siteAdmin, /Archive in progress/);
  assert.match(siteAdmin, /Archive failed/);
  assert.match(siteAdmin, /Storage setup needed/);
  assert.match(siteAdmin, /Needs staff action/);
  assert.match(siteAdmin, /Stale activity/);
  assert.match(siteAdmin, /Evidence missing/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="presentation-pending">Review rows/);
  assert.match(siteAdmin, /Check-in needed/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="presentation-attention">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="outline-pending">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-in-progress">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-expiring-soon">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-expired">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-failed">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-provider-unavailable">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="needs-attention">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="stale-activity">Review rows/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="evidence-missing">Review rows/);
  assert.match(siteAdmin, /Presentation Pending Demo 001/);
  assert.match(siteAdmin, /Archive Failed Demo 001/);
  assert.match(siteAdmin, /Archive Ready Demo 001/);
  assert.match(siteAdmin, /Archive Storage Demo 001/);
  assert.match(siteAdmin, /Storage unavailable/);
  assert.match(siteAdmin, /Storage setup needed/);
  assert.match(siteAdmin, /Storage setup is needed before archive packages can be prepared/);
  assert.match(siteAdmin, /Archive export needs staff follow-up/);
  assert.match(siteAdmin, /Scoped download is available/);
  assert.match(siteAdmin, /Download window expiring soon/);
  assert.match(siteAdmin, /Download window expired/);
  assert.doesNotMatch(siteAdmin, /drive_config_missing|drive_credentials_missing|drive_token_exchange_failed|drive_provider_error|drive_access_denied/);
  assert.match(siteAdmin, /High Risk Demo 001/);
  assert.match(siteAdmin, /data-operations-program-breakdown="true"/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="program-breakdown" data-program-id="it"/);
  assert.match(siteAdmin, /View program rows/);
  assert.match(siteAdmin, /data-operations-next-actions="true"/);
  assert.match(siteAdmin, /data-operations-action="filter-category" data-operations-category="risk"/);
  assert.match(siteAdmin, /View risk rows/);
  assert.match(siteAdmin, /View student detail/);
  assert.match(siteAdmin, /status-pill|workspace-status-pill/);
  assert.match(siteAdmin, /protected student blockers/);
  assert.match(siteAdmin, /presentations/);
  assert.match(siteAdmin, /archive readiness/);
  assert.match(siteAdmin, /listed owner/);
  assert.match(siteAdmin, /No student messaging/);
  assert.doesNotMatch(siteAdmin, /data-presentation-action|data-archive-action|data-admin-action="import-users"|<button[^>]*>\s*(?:Archive retry|Retry archive|Schedule presentation|Check out|Check in|Export package)/i);

  const programTeacherOperations = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "program-teacher-operations",
          email: "program.teacher.operations@example.edu",
          displayName: "Program Teacher Operations",
          roles: [{ role_id: "program_teacher", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture(),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "program_teacher", readOnly: true, total: 45, filteredTotal: 45 }),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "program_teacher" }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "program_teacher", readOnly: true, canManage: false }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "program_teacher", readOnly: true }),
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  }, "operations");

  assert.match(programTeacherOperations, /Program-scoped operations dashboard/);
  assert.match(programTeacherOperations, /Program follow-up worklists/);
  assert.match(programTeacherOperations, /your assigned students/);
  assert.match(programTeacherOperations, /review workflows to coordinate follow-up with site staff/i);
  assert.doesNotMatch(programTeacherOperations, /School follow-up worklists/);

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
  assert.match(viewer, /data-workspace-state="permission-denied"/);
  assert.match(viewer, /Operations readiness unavailable/);
  assert.match(viewer, /site presentation, archive, and readiness worklists/);
  assert.doesNotMatch(viewer, /data-presentation-action|data-archive-action|<button[^>]*>\s*(?:Archive retry|Retry archive|Schedule presentation)/i);

  const administrationOperations = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-operations",
          email: "administration.operations@example.edu",
          displayName: "Administration Operations",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "administration", readOnly: true }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: true }),
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "aggregate_only",
        generatedAt: "2026-05-31T18:00:00.000Z",
        metrics: [],
        rows: [],
      },
    },
  }, "operations");

  assert.match(administrationOperations, /Read-only operations dashboard/);
  assert.match(administrationOperations, /Read-only operations worklists/);

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
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'aria-label="Operations readiness results"',
    "operations detail should render before readiness result rows",
  );
  assert.match(workspaceRoot.innerHTML, /data-operations-compact-worklist="true"/);
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

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "presentation-snapshot", presentationStatus: "scheduled" } })', context);
  const presentationSnapshotFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(presentationSnapshotFetch, "expected Operations fetch with presentation snapshot filter");
  const presentationSnapshotUrl = new URL(presentationSnapshotFetch, "https://workspace.example");
  assert.equal(presentationSnapshotUrl.searchParams.get("presentationStatus"), "scheduled");
  assert.equal(presentationSnapshotUrl.searchParams.has("readiness"), false);
  assert.equal(presentationSnapshotUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /presentationStatus=scheduled/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "archive-snapshot", archiveStatus: "complete" } })', context);
  const archiveSnapshotFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(archiveSnapshotFetch, "expected Operations fetch with archive snapshot filter");
  const archiveSnapshotUrl = new URL(archiveSnapshotFetch, "https://workspace.example");
  assert.equal(archiveSnapshotUrl.searchParams.get("archiveStatus"), "complete");
  assert.equal(archiveSnapshotUrl.searchParams.has("readiness"), false);
  assert.equal(archiveSnapshotUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /archiveStatus=complete/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "presentation-pending" } })', context);
  const presentationFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(presentationFetch, "expected Operations fetch with presentation filter");
  const presentationUrl = new URL(presentationFetch, "https://workspace.example");
  assert.equal(presentationUrl.searchParams.get("presentationStatus"), "pending");
  assert.equal(presentationUrl.searchParams.get("readiness"), "attention_required");
  assert.equal(presentationUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /presentationStatus=pending/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "presentation-attention" } })', context);
  const presentationAttentionFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(presentationAttentionFetch, "expected Operations fetch with presentation check-in filter");
  const presentationAttentionUrl = new URL(presentationAttentionFetch, "https://workspace.example");
  assert.equal(presentationAttentionUrl.searchParams.get("presentationStatus"), "attention_required");
  assert.equal(presentationAttentionUrl.searchParams.has("readiness"), false);
  assert.equal(presentationAttentionUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /presentationStatus=attention_required/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "archive-failed" } })', context);
  const archiveFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(archiveFetch, "expected Operations fetch with archive filter");
  const archiveUrl = new URL(archiveFetch, "https://workspace.example");
  assert.equal(archiveUrl.searchParams.get("archiveStatus"), "failed");
  assert.equal(archiveUrl.searchParams.get("readiness"), "blocked");
  assert.equal(archiveUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /archiveStatus=failed/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "archive-in-progress" } })', context);
  const archiveProgressFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(archiveProgressFetch, "expected Operations fetch with archive in-progress filter");
  const archiveProgressUrl = new URL(archiveProgressFetch, "https://workspace.example");
  assert.equal(archiveProgressUrl.searchParams.get("archiveStatus"), "in_progress");
  assert.equal(archiveProgressUrl.searchParams.has("readiness"), false);
  assert.equal(archiveProgressUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /archiveStatus=in_progress/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "archive-expiring-soon" } })', context);
  const archiveExpiringFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(archiveExpiringFetch, "expected Operations fetch with archive expiring-soon filter");
  const archiveExpiringUrl = new URL(archiveExpiringFetch, "https://workspace.example");
  assert.equal(archiveExpiringUrl.searchParams.get("archiveStatus"), "expiring_soon");
  assert.equal(archiveExpiringUrl.searchParams.has("readiness"), false);
  assert.equal(archiveExpiringUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /archiveStatus=expiring_soon/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "archive-expired" } })', context);
  const archiveExpiredFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(archiveExpiredFetch, "expected Operations fetch with archive expired filter");
  const archiveExpiredUrl = new URL(archiveExpiredFetch, "https://workspace.example");
  assert.equal(archiveExpiredUrl.searchParams.get("archiveStatus"), "expired");
  assert.equal(archiveExpiredUrl.searchParams.has("readiness"), false);
  assert.equal(archiveExpiredUrl.searchParams.has("programId"), false);
  assert.match(window.location.href, /archiveStatus=expired/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "needs-attention" } })', context);
  const attentionFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(attentionFetch, "expected Operations fetch with needs-attention filter");
  const attentionUrl = new URL(attentionFetch, "https://workspace.example");
  assert.equal(attentionUrl.searchParams.get("needsAttention"), "true");
  assert.equal(attentionUrl.searchParams.has("archiveStatus"), false);
  assert.equal(attentionUrl.searchParams.has("readiness"), false);
  assert.match(window.location.href, /needsAttention=true/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "stale-activity" } })', context);
  const staleFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(staleFetch, "expected Operations fetch with stale activity filter");
  const staleUrl = new URL(staleFetch, "https://workspace.example");
  assert.equal(staleUrl.searchParams.get("risk"), "stale");
  assert.equal(staleUrl.searchParams.has("needsAttention"), false);
  assert.equal(staleUrl.searchParams.has("readiness"), false);
  assert.match(window.location.href, /risk=stale/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "outline-pending" } })', context);
  const outlineFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(outlineFetch, "expected Operations fetch with outline attention filter");
  const outlineUrl = new URL(outlineFetch, "https://workspace.example");
  assert.equal(outlineUrl.searchParams.get("outlineAttention"), "true");
  assert.equal(outlineUrl.searchParams.has("presentationStatus"), false);
  assert.equal(outlineUrl.searchParams.has("needsAttention"), false);
  assert.match(window.location.href, /outlineAttention=true/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "operations", sectionPreset: "evidence-missing" } })', context);
  const evidenceFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(evidenceFetch, "expected Operations fetch with evidence missing filter");
  const evidenceUrl = new URL(evidenceFetch, "https://workspace.example");
  assert.equal(evidenceUrl.searchParams.get("category"), "evidence");
  assert.equal(evidenceUrl.searchParams.get("readiness"), "missing");
  assert.equal(evidenceUrl.searchParams.has("needsAttention"), false);
  assert.equal(evidenceUrl.searchParams.has("outlineAttention"), false);
  assert.match(window.location.href, /category=evidence/);
  assert.match(window.location.href, /readiness=missing/);

  await vm.runInContext('handleOperationsReadinessAction({ currentTarget: { dataset: { operationsAction: "filter-category", operationsCategory: "risk" } } })', context);
  const categoryFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/operations-readiness?"));
  assert.ok(categoryFetch, "expected Operations fetch with readiness category filter");
  const categoryUrl = new URL(categoryFetch, "https://workspace.example");
  assert.equal(categoryUrl.searchParams.get("category"), "risk");
  assert.equal(categoryUrl.searchParams.get("offset"), null);
  assert.match(window.location.href, /category=risk/);
});

test("workspace clarifies Operations empty states for active filters and true no-data", async () => {
  const filteredOperations = siteOperationsReadinessFixture({
    role: "site_admin",
    filters: {
      siteId: "site-desert-valley-high",
      programId: "culinary",
      status: "",
      story: "",
      risk: "any",
      presentationStatus: "pending",
      archiveStatus: "",
      readiness: "attention_required",
      category: "",
      needsAttention: false,
      outlineAttention: false,
      limit: 50,
      offset: 0,
    },
  });
  filteredOperations.pagination.returned = 0;
  filteredOperations.pagination.filteredTotal = 0;
  filteredOperations.presentation.rows = [];
  filteredOperations.archive.rows = [];
  filteredOperations.readiness.attentionRows = [];
  filteredOperations.readiness.filteredProgramBreakdown = [];
  filteredOperations.readiness.nextActions = [];

  const filtered = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-operations-empty",
          email: "site.operations.empty@example.edu",
          displayName: "Operations Empty Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: false }) },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }) },
    "/api/site/operations-readiness": { status: 200, body: filteredOperations },
  }, "operations");

  assert.match(filtered, /No matching presentation work/);
  assert.match(filtered, /No presentation readiness work matches these filters for this school/);
  assert.match(filtered, /data-operations-compact-worklist-empty="true"/);
  assert.doesNotMatch(filtered, /No presentation rows match|No archive rows match|No attention rows match/);

  const unfilteredOperations = siteOperationsReadinessFixture({ role: "viewer", readOnly: true });
  unfilteredOperations.pagination.returned = 0;
  unfilteredOperations.pagination.filteredTotal = 0;
  unfilteredOperations.pagination.total = 0;
  unfilteredOperations.summary.studentsTotal = 0;
  unfilteredOperations.presentation.rows = [];
  unfilteredOperations.archive.rows = [];
  unfilteredOperations.readiness.attentionRows = [];
  unfilteredOperations.readiness.filteredProgramBreakdown = [];
  unfilteredOperations.readiness.programBreakdown = [];
  unfilteredOperations.readiness.nextActions = [];

  const unfiltered = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-operations-empty",
          email: "viewer.operations.empty@example.edu",
          displayName: "Operations Empty Viewer",
          roles: [{ role_id: "viewer", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: true }) },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: true }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: "viewer", readOnly: true }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "viewer", readOnly: true, canManage: false }) },
    "/api/site/operations-readiness": { status: 200, body: unfilteredOperations },
  }, "operations");

  assert.match(unfiltered, /data-workspace-state="permission-denied"/);
  assert.match(unfiltered, /Operations readiness unavailable/);
  assert.doesNotMatch(unfiltered, /No presentation rows match|No archive rows match|No attention rows match|data-presentation-action|data-archive-action/);

  const providerUnavailableEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-operations-provider-empty",
          email: "site.operations.provider.empty@example.edu",
          displayName: "Operations Provider Empty Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: false }) },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }) },
    "/api/site/operations-readiness": { status: 200, body: emptyArchiveOperationsFixture("provider_unavailable") },
  }, "operations");

  assert.match(providerUnavailableEmpty, /No storage setup blockers match/);
  assert.match(providerUnavailableEmpty, /No archive rows waiting on storage setup match these filters for this school/);
  assert.match(providerUnavailableEmpty, /Clear filters or review archive failures for broader closeout blockers/);

  const expiredDownloadEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-operations-expired-empty",
          email: "site.operations.expired.empty@example.edu",
          displayName: "Operations Expired Empty Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: false }) },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }) },
    "/api/site/operations-readiness": { status: 200, body: emptyArchiveOperationsFixture("expired") },
  }, "operations");

  assert.match(expiredDownloadEmpty, /No expired archive downloads match/);
  assert.match(expiredDownloadEmpty, /No archive rows with expired download windows match these filters for this school/);
  assert.match(expiredDownloadEmpty, /Clear filters or review expiring archive downloads for active follow-up/);

  const exactStudentEmpty = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-operations-student-empty",
          email: "site.operations.student.empty@example.edu",
          displayName: "Operations Student Empty Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: false }) },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: false }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: "site_admin", readOnly: true }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "site_admin", canManage: true }) },
    "/api/site/operations-readiness": { status: 200, body: emptyStudentOperationsFixture() },
  }, "operations");

  assert.match(exactStudentEmpty, /Operations readiness active filters/);
  assert.match(exactStudentEmpty, /This student/);
  assert.match(exactStudentEmpty, /No operations attention for this student/);
  assert.match(exactStudentEmpty, /This student has no blocked, missing, or attention-required rows matching these Operations filters/);
  assert.match(exactStudentEmpty, /data-operations-compact-worklist-empty="true"/);
  assert.match(exactStudentEmpty, /return to student detail/);
  assert.doesNotMatch(exactStudentEmpty, /review the student directory|open student detail from the directory/);

  function emptyArchiveOperationsFixture(archiveStatus) {
    const operations = siteOperationsReadinessFixture({
      role: "site_admin",
      filters: {
        siteId: "site-desert-valley-high",
        programId: "",
        status: "",
        story: "",
        risk: "any",
        presentationStatus: "",
        archiveStatus,
        readiness: "",
        category: "",
        needsAttention: false,
        outlineAttention: false,
        limit: 50,
        offset: 0,
      },
    });
    operations.pagination.returned = 0;
    operations.pagination.filteredTotal = 0;
    operations.presentation.rows = [];
    operations.archive.rows = [];
    operations.readiness.attentionRows = [];
    operations.readiness.filteredProgramBreakdown = [];
    operations.readiness.nextActions = [];
    return operations;
  }

  function emptyStudentOperationsFixture() {
    const operations = siteOperationsReadinessFixture({
      role: "site_admin",
      filters: {
        siteId: "site-desert-valley-high",
        studentId: "demo-student-101",
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
    });
    operations.pagination.returned = 0;
    operations.pagination.filteredTotal = 0;
    operations.presentation.rows = [];
    operations.archive.rows = [];
    operations.readiness.attentionRows = [];
    operations.readiness.filteredProgramBreakdown = [];
    operations.readiness.nextActions = [];
    return operations;
  }
});

test("mentor dashboard assigned students open detail and meeting history without leaving mentor context", async () => {
  const detailFixture = siteStudentDetailFixture({ readOnly: true });
  let meetingRecorded = false;
  let mentorMeetingPostBody = null;
  const mentorDashboardBody = {
    ok: true,
    scope: "mentor_assigned",
    summary: {
      assignedCount: 2,
      needsRevision: 1,
      missingMeeting: 1,
      presentationPending: 1,
    },
    assignedStudents: [
      {
        studentId: "demo-student-102",
        studentName: "Avery On Track",
        submissionStatus: "approved",
        latestSubmissionUpdatedAt: "2026-05-27T15:00:00.000Z",
        evidenceCount: 5,
        mentorMeetingStatus: "completed",
        latestMentorMeetingAt: "2026-05-28T14:30:00.000Z",
        presentationStatus: "completed",
        outlineStatus: "approved",
        latestPresentationScheduledFor: "2026-05-30T18:00:00.000Z",
        needsAttention: [],
      },
      {
        studentId: "demo-student-101",
        studentName: "Zoe Needs Help",
        submissionStatus: "revision_requested",
        latestSubmissionUpdatedAt: "2026-05-24T18:00:00.000Z",
        evidenceCount: 3,
        mentorMeetingStatus: "makeup_required",
        latestMentorMeetingAt: "2026-05-27T15:30:00.000Z",
        presentationStatus: "not_scheduled",
        outlineStatus: "pending",
        latestPresentationScheduledFor: "2026-05-29T18:15:00.000Z",
        needsAttention: ["mentor_meeting", "presentation"],
      },
    ],
  };
  const mentorAssignedBody = {
    ok: true,
    mentorId: "mentor-detail-user",
    assignedStudents: [],
  };
  const detailWithMeetings = () => ({
    ...detailFixture,
    mentor: {
      ...detailFixture.mentor,
      mentorUserId: "mentor-detail-user",
      mentorName: "Mentor Detail",
      active: true,
      meetingCount: meetingRecorded ? 2 : 1,
      latestMeetingStatus: meetingRecorded ? "held" : "makeup_required",
    },
    mentorMeetings: [
      ...(meetingRecorded ? [{
        mentorMeetingId: "meeting-new-101",
        mentorUserId: "mentor-detail-user",
        mentorName: "Mentor Detail",
        status: "held",
        scheduledFor: "",
        heldAt: "2026-05-28T15:30:00.000Z",
        notes: "Reviewed the updated evidence plan and next presentation step.",
        createdAt: "2026-05-28T15:30:00.000Z",
        updatedAt: "2026-05-28T15:30:00.000Z",
        nextAction: "Meeting recorded.",
      }] : []),
      {
        mentorMeetingId: "meeting-safe-101",
        mentorUserId: "mentor-detail-user",
        mentorName: "Mentor Detail",
        submissionId: "submission-101",
        submissionTitle: "Senior Project Proposal Draft",
        submissionStatus: "revision_requested",
        submissionVersion: 3,
        status: "makeup_required",
        scheduledFor: "2026-05-27T15:30:00.000Z",
        heldAt: "",
        notes: "Confirm a make-up check-in before presentation practice.",
        createdAt: "2026-05-24T15:30:00.000Z",
        updatedAt: "2026-05-24T15:30:00.000Z",
        nextAction: "Follow up on the mentor meeting.",
      },
    ],
  });
  const { context, workspaceRoot, fetchRequests, window } = await createWorkspaceContextWithFetch({
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
    "/api/mentor/dashboard": () => ({ status: 200, body: mentorDashboardBody }),
    "/api/mentor/assigned": () => ({ status: 200, body: mentorAssignedBody }),
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [], summary: {} },
    },
    "/api/site/students/demo-student-101": () => ({ status: 200, body: detailWithMeetings() }),
    "/api/mentor/meetings": ({ options }) => {
      mentorMeetingPostBody = JSON.parse(String(options.body || "{}"));
      meetingRecorded = true;
      return {
        status: 200,
        body: {
          ok: true,
          meeting: {
            id: "meeting-new-101",
            mentorId: "mentor-detail-user",
            studentId: "demo-student-101",
            status: "held",
            heldAt: "2026-05-28T15:30:00.000Z",
            scheduledFor: null,
            notes: "Reviewed the updated evidence plan and next presentation step.",
            submissionId: null,
          },
        },
      };
    },
  });

  vm.runInContext('activeSection = "mentorDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /Assigned Student Focus/);
  assert.match(workspaceRoot.innerHTML, /Attention-needed assignments first/);
  assert.ok(
    workspaceRoot.innerHTML.indexOf("Zoe Needs Help") < workspaceRoot.innerHTML.indexOf("Avery On Track"),
    "mentor dashboard should show attention-needed students before on-track students",
  );
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /All \(2\)/);
  assert.match(workspaceRoot.innerHTML, /Needs revision \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Meeting attention \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Presentation follow-up \(1\)/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-summary="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-compact-signals="true"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-mentor-dashboard-row-detail="true"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-mentor-dashboard-activity="true"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Open meeting history/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-action="open-student"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-student-id="demo-student-101"/);

  openWorkspaceDisclosure(context, "mentorRow", "demo-student-101");
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-row-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-signals="true"/);
  assert.match(workspaceRoot.innerHTML, /Meeting[\s\S]*Make-up required/);
  assert.match(workspaceRoot.innerHTML, /Presentation[\s\S]*Not scheduled/);
  assert.match(workspaceRoot.innerHTML, /Outline[\s\S]*Pending/);
  assert.match(workspaceRoot.innerHTML, /Evidence[\s\S]*3 items/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-activity="true"/);
  assert.match(workspaceRoot.innerHTML, /Work updated May 24/);
  assert.match(workspaceRoot.innerHTML, /Meeting activity May 27/);
  assert.match(workspaceRoot.innerHTML, /Presentation May 29/);
  assert.match(workspaceRoot.innerHTML, /Update the mentor meeting plan or make-up status before the next check-in/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-action="open-meetings"/);
  assert.match(workspaceRoot.innerHTML, /Open meeting history/);

  vm.runInContext(`
    handleMentorDashboardAction({
      currentTarget: {
        dataset: {
          mentorDashboardAction: "filter",
          mentorDashboardFilter: "presentation"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filter="presentation" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Presentation follow-up/);
  assert.match(workspaceRoot.innerHTML, /Zoe Needs Help/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Avery On Track/);
  assert.equal(new URL(window.location.href).searchParams.get("mentorFocus"), "presentation");

  vm.runInContext(`
    handleMentorDashboardAction({
      currentTarget: {
        dataset: {
          mentorDashboardAction: "filter",
          mentorDashboardFilter: "bogus"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filter="all" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Avery On Track/);
  assert.equal(new URL(window.location.href).searchParams.get("mentorFocus"), null);

  await vm.runInContext(`
    handleMentorDashboardAction({
      currentTarget: {
        dataset: {
          mentorDashboardAction: "open-meetings",
          mentorDashboardStudentId: "demo-student-101"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /Student detail loaded/);
  assert.match(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assertFocusableStudentDetailPanel(workspaceRoot.innerHTML);
  assertMarkupOrder(
    workspaceRoot.innerHTML,
    'data-student-detail-panel="true"',
    'data-mentor-dashboard-action="open-student"',
    "mentor dashboard detail should render before assigned student actions",
  );
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="mentor"/);
  assert.match(workspaceRoot.innerHTML, /Mentor Meetings/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-meeting-form="true"/);
  assert.match(workspaceRoot.innerHTML, /Record meeting/);
  assert.match(workspaceRoot.innerHTML, /Only actively assigned mentors can record meetings for their assigned students/);
  assert.match(workspaceRoot.innerHTML, /Confirm a make-up check-in before presentation practice/);
  assert.match(workspaceRoot.innerHTML, /Linked work: Senior Project Proposal Draft \(version 3, Revision requested\)/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /submission-101/);
  assert.match(workspaceRoot.innerHTML, /Assigned Students/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection, activeTab: siteStudentDetailState.activeTab })', context)),
    { activeSection: "mentorDashboard", sourceSection: "mentorDashboard", activeTab: "mentor" },
  );

  await vm.runInContext(`
    FormData = class {
      get(name) {
        return {
          studentId: "demo-student-101",
          status: "held",
          notes: "Reviewed the updated evidence plan and next presentation step."
        }[name] || "";
      }
    };
    submitMentorMeeting({
      preventDefault() {},
      currentTarget: {
        querySelectorAll() { return []; }
      }
    });
  `, context);

  assert.deepEqual(mentorMeetingPostBody, {
    studentId: "demo-student-101",
    status: "held",
    notes: "Reviewed the updated evidence plan and next presentation step.",
  });
  assert.ok(fetchRequests.some((entry) => entry.url === "/api/mentor/meetings" && entry.method === "POST"));
  assert.match(workspaceRoot.innerHTML, /Mentor meeting recorded/);
  assert.match(workspaceRoot.innerHTML, /Reviewed the updated evidence plan and next presentation step/);
  assert.match(workspaceRoot.innerHTML, /2 meetings/);

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "mentorDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
});

test("workspace gates student directory visibility by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const directoryRoleHelperBlock = workspaceJs.match(/function hasSiteStudentDirectoryRole[\s\S]*?function defaultSiteStudentFilters/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteStudentDirectoryRole\(roles\)/);
  assert.match(workspaceJs, /"platform_admin",\s+"global_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"administration",\s+"viewer",\s+"program_teacher"/);
  assert.match(availableSectionsBlock, /id: "students", label: "Students", detail: "Search and filter capstone progress"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteStudentDirectoryRole\(roles\).*\/api\/site\/students/s);
  assert.doesNotMatch(directoryRoleHelperBlock, /"mentor"|"student"|"misc_admin"/);
});

test("workspace gates review queue visibility and refresh behavior by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const reviewRoleHelperBlock = workspaceJs.match(/function hasSiteReviewQueueRole[\s\S]*?function hasSiteMentorAssignmentRole/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteReviewQueueRole\(roles\)/);
  assert.match(reviewRoleHelperBlock, /"platform_admin",\s+"global_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"program_teacher"/);
  assert.doesNotMatch(reviewRoleHelperBlock, /"viewer"|"administration"|"mentor"|"student"|"misc_admin"/);
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
  const mentorRoleHelperBlock = workspaceJs.match(/function hasSiteMentorAssignmentRole[\s\S]*?function hasSiteOperationsRole/)?.[0] || "";
  const sectionOpenBlock = workspaceJs.match(/async function openWorkspaceSection[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteMentorAssignmentRole\(roles\)/);
  assert.match(mentorRoleHelperBlock, /"platform_admin",\s+"global_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"program_teacher"/);
  assert.doesNotMatch(mentorRoleHelperBlock, /"viewer"|"administration"|"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /id: "mentorAssignments", label: "Mentor Assignments", detail: "Coverage and assignment workflow"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteMentorAssignmentRole\(roles\).*\/api\/site\/mentor-assignments/s);
  assert.match(sectionOpenBlock, /section === "mentorAssignments" && button\.dataset\.sectionPreset === "no-mentor"/);
  assert.match(sectionOpenBlock, /status:\s*"unassigned"/);
  assert.match(sectionOpenBlock, /noMentor:\s*true/);
  assert.match(sectionOpenBlock, /loadMentorAssignmentsResult\("Showing students without mentors\."\)/);
  assert.match(sectionOpenBlock, /section === "mentorAssignments" && button\.dataset\.sectionPreset === "active-assignments"/);
  assert.match(sectionOpenBlock, /status:\s*"active"/);
  assert.match(sectionOpenBlock, /loadMentorAssignmentsResult\("Showing students with active mentor coverage\."\)/);
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
  assert.match(operationsRoleHelperBlock, /"platform_admin",\s+"global_admin",\s+"admin",\s+"org_admin",\s+"site_admin",\s+"administration",\s+"program_teacher"/);
  assert.doesNotMatch(operationsRoleHelperBlock, /"viewer"|"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /id: "operations", label: "Operations", detail: "Presentation, archive, and readiness"/);
  assert.match(loadWorkspaceDataBlock, /hasSiteOperationsRole\(roles\).*\/api\/site\/operations-readiness/s);
  assert.match(workspaceJs, /function renderOperationsReadinessSection/);
  assert.match(workspaceJs, /function applyOperationsReadinessFilters/);
  assert.match(workspaceJs, /function loadOperationsReadinessResult/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "presentation-pending"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "presentation-attention"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "archive-failed"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "needs-attention"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "evidence-missing"/);
  assert.match(workspaceJs, /data-operations-action="filter-category"/);
  assert.match(workspaceJs, /data-operations-action="open-student"/);
  assert.match(workspaceJs, /openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.operationsStudentId/);
  assert.match(workspaceJs, /scope\.readOnly/);
  assert.doesNotMatch(workspaceJs, /data-operations-action="schedule"|data-operations-action="retry"|data-operations-action="check-in"|data-operations-action="check-out"/);
});

test("workspace keeps audit and archive export sections global-admin only", () => {
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const siteDashboardBlock = workspaceJs.match(/function renderSiteDashboardSection[\s\S]*?function renderSiteStudentDirectorySection/)?.[0] || "";
  assert.match(availableSectionsBlock, /if \(hasGlobalAdminRole\(roles\)\) sections\.push\(\{ id: "audit", label: "Audit", detail: "Recent protected-record activity" \}\);/);
  assert.match(availableSectionsBlock, /if \(hasGlobalAdminRole\(roles\)\) sections\.push\(\{ id: "archiveExports", label: "Archive \/ Exports", detail: "Closeout package status" \}\);/);
  assert.doesNotMatch(availableSectionsBlock, /roles\.has\("site_admin"\)\) sections\.push\(\{ id: "audit"/);
  assert.doesNotMatch(availableSectionsBlock, /roles\.has\("site_admin"\)\) sections\.push\(\{ id: "archiveExports"/);
  assert.match(siteDashboardBlock, /const canOpenAudit = availableSectionIds\(\)\.has\("audit"\);/);
  assert.match(siteDashboardBlock, /label: "Recent Activity", value: safeNumber\(summary\.recentActivityCount\), detail: canOpenAudit \? "Audit destination available\." : "Summary only on this role\."/);
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
  assert.match(sectionOpenBlock, /section === "operations" && button\.dataset\.sectionPreset === "presentation-attention"/);
  assert.match(sectionOpenBlock, /section === "operations" && button\.dataset\.sectionPreset === "outline-pending"/);
  assert.match(sectionOpenBlock, /section === "operations" && button\.dataset\.sectionPreset === "evidence-missing"/);
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
  assert.match(workspaceJs, /preset: "presentation-attention"/);
  assert.match(workspaceJs, /preset: "outline-pending"/);
  assert.match(workspaceJs, /preset: "evidence-missing"/);
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
    studentDisclosureState.evidence = true;
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
    studentDisclosureState.evidence = true;
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
    studentDisclosureState.evidence = true;
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
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            submissionStatus: "revision_requested",
            evidenceCount: 1,
          },
          {
            title: "Mentor Meeting One Plan",
            status: "Missing",
            detail: "Start or finish Mentor Meeting One Plan.",
            dueDate: "2026-01-14T00:00:00Z",
            dueLabel: "January 14, make-up January 16",
            requirementId: "req-mentor-plan",
            submissionId: null,
            submissionStatus: null,
            evidenceCount: 0,
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
  }, "student", `
    studentDisclosureState.requirements = true;
    studentDisclosureState.feedback = true;
    studentDisclosureState.progress = true;
    studentDisclosureState.evidence = true;
    studentDisclosureState.submissions = true;
    studentDisclosureState.files = true;
  `);

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
  assert.match(student, /data-student-requirement-action="open-detail"/);
  assert.match(student, /Open requirement/);
  assert.match(student, /data-student-requirements-panel="true"/);
  assert.match(student, /3 requirements available/);
  assert.match(student, /Requirement Checklist/);
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
  assert.match(student, /data-student-feedback-origin="submissions"/);
  assert.match(student, /data-student-requirement-description="true"/);
  assert.match(student, /Explain the problem, solution, audience, and evidence for your capstone project/);
  assert.match(student, /data-student-requirement-quality="true"/);
  assert.match(student, /Try this: Add one measurable success target before you send the proposal back/);
  assert.match(student, /Send the revised Senior Project Proposal back for teacher review/);
  assert.match(student, /data-student-next-step-due="true"/);
  assert.match(student, /data-student-deadlines-panel="true"/);
  assert.match(student, /Upcoming deadlines/);
  assert.match(student, /data-student-deadline-row="true"/);
  assert.match(student, /data-student-deadline-phase="true"/);
  assert.match(student, /data-student-deadline-due="true"/);
  assert.match(student, /Proposal And Research \/ Current phase/);
  assert.match(student, /data-student-requirement-due="true"/);
  assert.match(student, /Due October 9 and 10/);
  assert.match(student, /Due January 14, make-up January 16/);
  assert.match(student, /Version 2/);
  assert.match(student, /data-student-feedback-panel="true"/);
  assert.match(student, /data-student-feedback-history="true"/);
  assert.match(student, /data-student-feedback-count="1"/);
  assert.match(student, /Feedback History/);
  assert.match(student, /1 teacher note available/);
  assert.match(student, /Add one measurable success target before resubmitting/);
  assert.match(student, /data-student-feedback-context="true"/);
  assert.match(student, /Version 2 \/ Current status: Revision requested/);
  assert.match(student, /data-submission-feedback="true"/);
  assert.match(student, /Latest teacher feedback: Add one measurable success target before resubmitting/);
  assert.match(student, /Progress Details/);
  assert.match(student, /May 5 archive/);
  assert.match(student, /Finish Reflections and portfolio/);
  assert.match(student, /Need help/);
  assert.match(student, /data-student-support-box="true"/);
  assert.match(student, /Review feedback/);
  assert.match(student, /Open submitted work/);
  assert.match(student, /Open next requirement/);
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

test("student requirement rows open in-page details without another route", async () => {
  const routes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-requirement-detail",
          email: "student.requirement.detail@senior-capstone.test",
          displayName: "Requirement Detail Student",
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
          requirementsTotal: 1,
          requirementsComplete: 0,
          completionPercent: 0,
          submittedRequiredCount: 1,
          missingRequiredCount: 0,
          revisionRequestedCount: 1,
          waitingForReviewCount: 0,
          currentStatus: "Needs Revision",
        },
        nextSteps: [
          {
            title: "Senior Project Proposal",
            status: "Needs Revision",
            detail: "Revise Senior Project Proposal and send it back for review.",
            dueLabel: "October 9 and 10",
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            submissionStatus: "revision_requested",
            evidenceCount: 1,
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
            dueLabel: "October 9 and 10",
            qualityPrompt: "Add one measurable success target before you send the proposal back.",
            lastUpdatedAt: "2026-05-24T18:00:00.000Z",
            nextAction: "Send the revised Senior Project Proposal back for teacher review.",
          },
        ],
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
    "/api/student/archive/readiness": {
      status: 200,
      body: {
        ok: true,
        summary: { readyChecks: 0, missingChecks: 0, totalChecks: 0, archiveAvailableToRequest: false },
        checks: [],
        archive: { status: "not_requested" },
        storage: {},
        retention: {},
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  };
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch(routes);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-action="open-detail"/);
  assert.match(workspaceRoot.innerHTML, /Open requirement/);
  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:requirements"/);
  assert.match(workspaceRoot.innerHTML, /aria-expanded="false"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-action="toggle-detail"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Review details/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);

  const fetchCountBeforeDetail = fetchLog.length;
  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-proposal" } } })', context);
  assert.equal(fetchLog.length, fetchCountBeforeDetail);
  assert.match(workspaceRoot.innerHTML, /aria-expanded="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-action="toggle-detail"/);
  assert.match(workspaceRoot.innerHTML, /Hide details/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /Requirement details/);
  assert.match(workspaceRoot.innerHTML, /Due October 9 and 10/);
  assert.match(workspaceRoot.innerHTML, /1 item attached/);
  assert.match(workspaceRoot.innerHTML, /Version 2 \/ Revision requested/);
  assert.match(workspaceRoot.innerHTML, /Latest teacher feedback/);
  assert.match(workspaceRoot.innerHTML, /Add one measurable success target before resubmitting/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /href="#"/);
});

test("student upcoming deadlines panel lists nearest incomplete work and reuses requirement actions", async () => {
  const student = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-deadlines",
          email: "student.deadlines@senior-capstone.test",
          displayName: "Deadline Student",
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
          requirementsTotal: 4,
          requirementsComplete: 1,
          completionPercent: 25,
          phasesTotal: 3,
          phasesComplete: 1,
          submittedRequiredCount: 2,
          missingRequiredCount: 2,
          waitingForReviewCount: 0,
          revisionRequestedCount: 1,
          currentPhase: "proposal-and-research",
          currentPhaseLabel: "Proposal And Research",
          currentStatus: "Needs Revision",
          dueDatesAvailable: true,
          mentor: { assigned: true, name: "Mentor One", message: "Mentor One can help with project questions." },
        },
        nextSteps: [
          {
            title: "Senior Project Proposal",
            status: "Needs Revision",
            detail: "Revise Senior Project Proposal and send it back for review.",
            dueDate: "2025-10-09T00:00:00Z",
            dueLabel: "October 9 and 10",
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            submissionStatus: "revision_requested",
            evidenceCount: 1,
          },
        ],
        requirements: [
          {
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            title: "Senior Project Proposal",
            phase: "proposal-and-research",
            phaseLabel: "Proposal And Research",
            status: "revision_requested",
            progressStatus: "revision_requested",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            evidenceCount: 1,
            dueDate: "2025-10-09T00:00:00Z",
            dueLabel: "October 9 and 10",
            nextAction: "Send the revised Senior Project Proposal back for teacher review.",
          },
          {
            requirementId: "req-presentation",
            submissionId: "submission-presentation",
            title: "Presentation Outline",
            phase: "presentation",
            phaseLabel: "Presentation",
            status: "draft",
            progressStatus: "draft",
            submissionStatus: "draft",
            submissionVersion: 1,
            evidenceCount: 0,
            dueDate: "2026-01-14T00:00:00Z",
            dueLabel: "January 14, make-up January 16",
            nextAction: "Add outline evidence before sending it for review.",
          },
          {
            requirementId: "req-portfolio",
            submissionId: "",
            title: "Portfolio Reflection",
            phase: "portfolio",
            phaseLabel: "Portfolio",
            status: "missing",
            progressStatus: null,
            submissionStatus: null,
            submissionVersion: null,
            evidenceCount: 0,
            dueLabel: "Before celebration day",
            nextAction: "Start the reflection draft before closeout week.",
          },
          {
            requirementId: "req-complete",
            submissionId: "submission-complete",
            title: "Completed checkpoint",
            phase: "proposal-and-research",
            phaseLabel: "Proposal And Research",
            status: "approved",
            progressStatus: "approved",
            submissionStatus: "approved",
            submissionVersion: 1,
            evidenceCount: 1,
            dueDate: "2025-09-01T00:00:00Z",
            dueLabel: "September 1",
            nextAction: "This item is complete.",
          },
        ],
        progress: [],
        submissions: [
          { id: "submission-proposal", requirement_id: "req-proposal", requirement_title: "Senior Project Proposal", status: "revision_requested", version: 2, updated_at: "2026-05-24T18:00:00.000Z" },
          { id: "submission-presentation", requirement_id: "req-presentation", requirement_title: "Presentation Outline", status: "draft", version: 1, updated_at: "2026-05-24T19:00:00.000Z" },
        ],
        evidence: [],
        feedback: [],
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
  }, "student");

  assert.match(student, /data-student-deadlines-panel="true"/);
  assert.match(student, /data-student-deadlines-count="3"/);
  assertMarkupOrder(student, "Senior Project Proposal", "Presentation Outline", "nearest dated deadline should render first");
  assertMarkupOrder(student, "Presentation Outline", "Portfolio Reflection", "label-only deadline should render after dated deadlines");
  assert.match(student, /Open requirement/);
  assert.match(student, /Send revision/);
  assert.match(student, /Add evidence/);
  assert.match(student, /Proposal And Research \/ Current phase/);
  assert.doesNotMatch(student, /data-student-deadline-requirement-id="req-complete"/);
});

test("student requirement phase focus narrows the checklist and open requirement switches to the matching phase", async () => {
  const routes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-phase-focus",
          email: "student.phase.focus@senior-capstone.test",
          displayName: "Phase Focus Student",
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
          phasesTotal: 2,
          phasesComplete: 1,
          submittedRequiredCount: 1,
          missingRequiredCount: 1,
          waitingForReviewCount: 0,
          revisionRequestedCount: 1,
          currentPhase: "proposal-and-research",
          currentPhaseLabel: "Proposal And Research",
          currentStatus: "Needs Revision",
          mentor: { assigned: false, name: null, message: "No mentor assigned yet." },
        },
        nextSteps: [
          {
            title: "Senior Project Proposal",
            status: "Needs Revision",
            detail: "Revise Senior Project Proposal and send it back for review.",
            dueLabel: "October 9 and 10",
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            submissionStatus: "revision_requested",
            evidenceCount: 1,
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
            dueLabel: "October 9 and 10",
            qualityPrompt: "Add one measurable success target before you send the proposal back.",
            lastUpdatedAt: "2026-05-24T18:00:00.000Z",
            nextAction: "Send the revised Senior Project Proposal back for teacher review.",
          },
          {
            requirementId: "req-celebration",
            submissionId: "",
            title: "Celebration Day Setup",
            description: "Prepare the display and materials for celebration day.",
            phase: "celebration-day",
            phaseLabel: "Celebration Day",
            status: "missing",
            progressStatus: null,
            submissionStatus: null,
            submissionVersion: null,
            evidenceCount: 0,
            dueLabel: "May 1",
            qualityPrompt: "List the materials you still need.",
            lastUpdatedAt: null,
            nextAction: "Start Celebration Day Setup when your teacher is ready for this step.",
          },
        ],
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
    "/api/student/archive/readiness": {
      status: 200,
      body: {
        ok: true,
        summary: { readyChecks: 0, missingChecks: 0, totalChecks: 0, archiveAvailableToRequest: false },
        checks: [],
        archive: { status: "not_requested" },
        storage: {},
        retention: {},
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  };
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(routes);
  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:requirements"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-phase-focus="true"/);
  openWorkspaceDisclosure(context, "student", "requirements");
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-phase-focus="true"/);
  assert.match(workspaceRoot.innerHTML, /Proposal And Research \(Current\)/);
  assert.match(workspaceRoot.innerHTML, /Celebration Day/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-phase-key="proposal-and-research"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-phase-key="celebration-day"/);

  vm.runInContext('handleStudentRequirementPhaseAction({ currentTarget: { dataset: { studentRequirementPhaseAction: "set-phase", studentRequirementPhaseKey: "celebration-day" } } })', context);
  assert.doesNotMatch(workspaceRoot.innerHTML, /<h3>Proposal And Research<\/h3>/);
  assert.match(workspaceRoot.innerHTML, /<h3>Celebration Day<\/h3>/);
  assert.match(workspaceRoot.innerHTML, /Celebration Day: 0 of 1 complete, 1 still need work\./);

  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-proposal" } } })', context);
  assert.match(workspaceRoot.innerHTML, /<h3>Proposal And Research<\/h3>/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /<h3>Celebration Day<\/h3>/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /Requirement details/);
  assert.match(workspaceRoot.innerHTML, /Add one measurable success target before resubmitting/);
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
            id: "version-proposal-1",
            version: 1,
            status: "submitted",
            submittedAt: "2026-05-24T16:00:00.000Z",
            submittedByName: "Feedback History Student",
            notes: "",
            evidence: [
              { id: "evidence-proposal-1a" },
            ],
          },
          {
            id: "version-proposal-2",
            version: 2,
            status: "submitted",
            submittedAt: "2026-05-24T18:00:00.000Z",
            submittedByName: "Feedback History Student",
            notes: "",
            evidence: [
              { id: "evidence-proposal-2a" },
              { id: "evidence-proposal-2b" },
            ],
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

  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:feedback"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-feedback-action="open-history"/);
  openWorkspaceDisclosure(context, "student", "feedback");
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-action="open-history"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-origin="feedback"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-submission-id="submission-proposal"/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackSubmissionId: "submission-proposal" } } })',
    context,
  );

  assert.ok(fetchLog.includes("/api/reviews/submission-proposal/history"));
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-timeline-summary="true"/);
  assert.match(workspaceRoot.innerHTML, /Submission timeline/);
  assert.match(workspaceRoot.innerHTML, /Only feedback meant for you is shown here/);
  assert.match(workspaceRoot.innerHTML, /Current version[\s\S]*Version 2/);
  assert.match(workspaceRoot.innerHTML, /Submitted versions[\s\S]*2/);
  assert.match(workspaceRoot.innerHTML, /Teacher notes[\s\S]*2/);
  assert.match(workspaceRoot.innerHTML, /Status updates[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /Version 2 submitted/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-current-version="true"[\s\S]*2 evidence items/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-version="1"[\s\S]*1 evidence item/);
  assert.match(workspaceRoot.innerHTML, /Sent back for revision/);
  assert.match(workspaceRoot.innerHTML, /Add one measurable success target before resubmitting/);
  assert.match(workspaceRoot.innerHTML, /Thanks for resubmitting the outline/);
  const timelineMarkup = workspaceRoot.innerHTML.match(/<section class="workspace-student-feedback-timeline"[\s\S]*?<\/section>/)?.[0] || "";
  assertMarkupOrder(timelineMarkup, "Thanks for resubmitting the outline.", "Add one measurable success target before resubmitting.", "newer visible teacher note should render before the older review note");
  assert.doesNotMatch(workspaceRoot.innerHTML, /staff_only|Private staff note|drive_file_id|driveFileId/i);
});

test("student feedback filters focus action-needed notes and clear hidden feedback timelines", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-feedback-filters",
          email: "student.feedback.filters@senior-capstone.test",
          displayName: "Feedback Filter Student",
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
          requirementsTotal: 3,
          requirementsComplete: 1,
          completionPercent: 33,
          submittedRequiredCount: 3,
          missingRequiredCount: 0,
          revisionRequestedCount: 1,
        },
        progress: [],
        submissions: [
          { id: "submission-revision", requirement_id: "req-revision", requirement_title: "Research Proposal", status: "revision_requested", version: 2, updated_at: "2026-05-24T18:00:00.000Z" },
          { id: "submission-note", requirement_id: "req-note", requirement_title: "Mentor Summary", status: "under_review", version: 1, updated_at: "2026-05-24T17:00:00.000Z" },
          { id: "submission-approved", requirement_id: "req-approved", requirement_title: "Presentation Outline", status: "approved", version: 3, updated_at: "2026-05-24T16:00:00.000Z" },
        ],
        evidence: [],
        feedback: [
          {
            id: "review-revision",
            submissionId: "submission-revision",
            requirementTitle: "Research Proposal",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            status: "revision_requested",
            message: "Please add one measurable success target before resubmitting.",
            authorName: "Ms. Garcia",
            createdAt: "2026-05-24T18:30:00.000Z",
          },
          {
            id: "review-note",
            submissionId: "submission-note",
            requirementTitle: "Mentor Summary",
            submissionStatus: "under_review",
            submissionVersion: 1,
            status: "under_review",
            message: "Thanks for turning this in early.",
            authorName: "Mr. Lee",
            createdAt: "2026-05-24T17:30:00.000Z",
          },
          {
            id: "review-approved",
            submissionId: "submission-approved",
            requirementTitle: "Presentation Outline",
            submissionStatus: "approved",
            submissionVersion: 3,
            status: "approved",
            message: "Approved and ready to move on.",
            authorName: "Ms. Patel",
            createdAt: "2026-05-24T16:30:00.000Z",
          },
        ],
      },
    },
    "/api/reviews/submission-approved/history": {
      status: 200,
      body: {
        ok: true,
        submission: { id: "submission-approved", studentId: "student-feedback-filters", status: "approved", version: 3 },
        reviews: [
          {
            id: "review-approved",
            decision: "approved",
            feedback: "Approved and ready to move on.",
            created_at: "2026-05-24T16:30:00.000Z",
            reviewer_name: "Ms. Patel",
          },
        ],
        statusHistory: [],
        versions: [],
        comments: [],
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

  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:feedback"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-feedback-filters="true"/);
  openWorkspaceDisclosure(context, "student", "feedback");
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /All notes \(3\)/);
  assert.match(workspaceRoot.innerHTML, /Needs revision \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Teacher notes \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Approved \(1\)/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackOrigin: "feedback", studentFeedbackSubmissionId: "submission-approved" } } })',
    context,
  );

  assert.match(workspaceRoot.innerHTML, /data-student-feedback-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /Approved and ready to move on/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "set-filter", studentFeedbackFilter: "revision_requested" } } })',
    context,
  );

  assert.match(workspaceRoot.innerHTML, /data-student-feedback-active-filter="revision_requested"/);
  assert.match(workspaceRoot.innerHTML, /Please add one measurable success target before resubmitting/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-feedback-item="/g) || []).length, 1);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-feedback-timeline="true"/);
  assert.equal(vm.runInContext("studentFeedbackHistoryState.selectedSubmissionId", context), "");
  assert.equal(vm.runInContext("studentFeedbackFilter", context), "revision_requested");
});

test("student submission rows open the student-safe review timeline without duplicating the feedback panel", async () => {
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-submission-timeline",
          email: "student.submission.timeline@senior-capstone.test",
          displayName: "Submission Timeline Student",
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
        submission: { id: "submission-proposal", studentId: "student-submission-timeline", status: "revision_requested", version: 2 },
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
            submittedByName: "Submission Timeline Student",
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

  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:submissions"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-feedback-origin="submissions"/);
  openWorkspaceDisclosure(context, "student", "submissions");
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-origin="submissions"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-submission-id="submission-proposal"/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackOrigin: "submissions", studentFeedbackSubmissionId: "submission-proposal" } } })',
    context,
  );

  assert.ok(fetchLog.includes("/api/reviews/submission-proposal/history"));
  assert.match(workspaceRoot.innerHTML, /data-student-submission-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /Submission timeline/);
  assert.match(workspaceRoot.innerHTML, /Version 2 submitted/);
  assert.match(workspaceRoot.innerHTML, /Sent back for revision/);
  assert.match(workspaceRoot.innerHTML, /Thanks for resubmitting the outline/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-feedback-timeline="true"/g) || []).length, 1);
  assert.doesNotMatch(workspaceRoot.innerHTML, /staff_only|Private staff note|drive_file_id|driveFileId/i);
});

test("student submission filters narrow rows and clear hidden submission timelines", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-submission-filters",
          email: "student.submission.filters@senior-capstone.test",
          displayName: "Submission Filter Student",
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
          requirementsTotal: 4,
          requirementsComplete: 1,
          completionPercent: 25,
          submittedRequiredCount: 3,
          missingRequiredCount: 1,
          revisionRequestedCount: 1,
          waitingForReviewCount: 1,
        },
        progress: [],
        submissions: [
          { id: "submission-draft", requirement_id: "req-draft", requirement_title: "Concept Draft", status: "draft", version: 1, updated_at: "2026-05-24T15:00:00.000Z" },
          { id: "submission-submitted", requirement_id: "req-submitted", requirement_title: "Research Notes", status: "submitted", version: 1, updated_at: "2026-05-24T16:00:00.000Z" },
          { id: "submission-revision", requirement_id: "req-revision", requirement_title: "Portfolio Reflection", status: "revision_requested", version: 2, updated_at: "2026-05-24T17:00:00.000Z" },
          { id: "submission-approved", requirement_id: "req-approved", requirement_title: "Presentation Outline", status: "approved", version: 3, updated_at: "2026-05-24T18:00:00.000Z" },
        ],
        evidence: [],
        feedback: [
          {
            id: "review-revision",
            submissionId: "submission-revision",
            requirementTitle: "Portfolio Reflection",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            status: "revision_requested",
            message: "Revise the reflection conclusion before resubmitting.",
            authorName: "Ms. Garcia",
            createdAt: "2026-05-24T17:30:00.000Z",
          },
          {
            id: "review-approved",
            submissionId: "submission-approved",
            requirementTitle: "Presentation Outline",
            submissionStatus: "approved",
            submissionVersion: 3,
            status: "approved",
            message: "Approved and ready for presentation practice.",
            authorName: "Mr. Lee",
            createdAt: "2026-05-24T18:30:00.000Z",
          },
        ],
      },
    },
    "/api/reviews/submission-approved/history": {
      status: 200,
      body: {
        ok: true,
        submission: { id: "submission-approved", studentId: "student-submission-filters", status: "approved", version: 3 },
        reviews: [
          {
            id: "review-approved",
            decision: "approved",
            feedback: "Approved and ready for presentation practice.",
            created_at: "2026-05-24T18:30:00.000Z",
            reviewer_name: "Mr. Lee",
          },
        ],
        statusHistory: [],
        versions: [],
        comments: [],
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

  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:submissions"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-submission-filters="true"/);
  openWorkspaceDisclosure(context, "student", "submissions");
  assert.match(workspaceRoot.innerHTML, /data-student-submission-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /All work \(4\)/);
  assert.match(workspaceRoot.innerHTML, /Drafts \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Waiting for review \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Needs revision \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Approved \(1\)/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackOrigin: "submissions", studentFeedbackSubmissionId: "submission-approved" } } })',
    context,
  );

  assert.match(workspaceRoot.innerHTML, /data-student-submission-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /Approved and ready for presentation practice/);

  await vm.runInContext(
    'handleStudentSubmissionAction({ currentTarget: { dataset: { studentSubmissionAction: "set-filter", studentSubmissionFilter: "revision_requested" } } })',
    context,
  );

  assert.match(workspaceRoot.innerHTML, /data-student-submission-active-filter="revision_requested"/);
  assert.match(workspaceRoot.innerHTML, /Portfolio Reflection/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-row="submission-revision"/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-submission-row="/g) || []).length, 1);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-submission-timeline="true"/);
  assert.equal(vm.runInContext("studentFeedbackHistoryState.selectedSubmissionId", context), "");
  assert.equal(vm.runInContext("studentSubmissionFilter", context), "revision_requested");
});

test("student support actions reuse existing feedback, submission, and requirement state", async () => {
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-support-actions",
          email: "student.support.actions@senior-capstone.test",
          displayName: "Support Action Student",
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
          requirementsTotal: 3,
          requirementsComplete: 1,
          completionPercent: 33,
          submittedRequiredCount: 2,
          missingRequiredCount: 1,
          revisionRequestedCount: 1,
          waitingForReviewCount: 1,
          dueDatesAvailable: true,
          mentor: { assigned: false, name: null, message: "Ask your program teacher who can help with mentor questions." },
        },
        nextSteps: [
          {
            title: "Research Proposal",
            status: "Needs Revision",
            detail: "Revise the research proposal and send it back for review.",
            dueLabel: "October 9 and 10",
            requirementId: "req-revision",
            submissionId: "submission-revision",
            submissionStatus: "revision_requested",
            evidenceCount: 1,
          },
        ],
        requirements: [
          {
            requirementId: "req-revision",
            submissionId: "submission-revision",
            title: "Research Proposal",
            phase: "proposal-and-research",
            phaseLabel: "Proposal And Research",
            status: "revision_requested",
            progressStatus: "revision_requested",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            evidenceCount: 1,
            dueLabel: "October 9 and 10",
            nextAction: "Send the revised proposal back for teacher review.",
          },
          {
            requirementId: "req-submitted",
            submissionId: "submission-submitted",
            title: "Mentor Summary",
            phase: "mentor-meetings",
            phaseLabel: "Mentor Meetings",
            status: "submitted",
            progressStatus: "submitted",
            submissionStatus: "submitted",
            submissionVersion: 1,
            evidenceCount: 1,
            dueLabel: "October 20",
            nextAction: "Wait for feedback on the mentor summary.",
          },
          {
            requirementId: "req-missing",
            submissionId: "",
            title: "Portfolio Reflection",
            phase: "portfolio",
            phaseLabel: "Portfolio",
            status: "missing",
            progressStatus: null,
            submissionStatus: null,
            submissionVersion: null,
            evidenceCount: 0,
            dueLabel: "Before celebration day",
            nextAction: "Start the reflection draft.",
          },
        ],
        progress: [],
        submissions: [
          { id: "submission-revision", requirement_id: "req-revision", requirement_title: "Research Proposal", status: "revision_requested", version: 2, updated_at: "2026-05-24T17:00:00.000Z" },
          { id: "submission-submitted", requirement_id: "req-submitted", requirement_title: "Mentor Summary", status: "submitted", version: 1, updated_at: "2026-05-24T16:00:00.000Z" },
          { id: "submission-draft", requirement_id: "req-draft", requirement_title: "Portfolio Reflection", status: "draft", version: 1, updated_at: "2026-05-24T15:00:00.000Z" },
        ],
        evidence: [],
        feedback: [
          {
            id: "review-revision",
            submissionId: "submission-revision",
            requirementTitle: "Research Proposal",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            status: "revision_requested",
            message: "Add one measurable success target before resubmitting.",
            authorName: "Ms. Garcia",
            createdAt: "2026-05-24T18:30:00.000Z",
          },
          {
            id: "review-submitted",
            submissionId: "submission-submitted",
            requirementTitle: "Mentor Summary",
            submissionStatus: "under_review",
            submissionVersion: 1,
            status: "under_review",
            message: "Thanks for turning this in early.",
            authorName: "Mr. Lee",
            createdAt: "2026-05-24T17:30:00.000Z",
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

  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="student:progress"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-support-box="true"/);
  openWorkspaceDisclosure(context, "student", "progress");
  assert.match(workspaceRoot.innerHTML, /data-student-support-box="true"/);
  assert.match(workspaceRoot.innerHTML, /Review feedback/);
  assert.match(workspaceRoot.innerHTML, /Open submitted work/);
  assert.match(workspaceRoot.innerHTML, /Open next requirement/);

  const fetchCountBeforeSupport = fetchLog.length;
  vm.runInContext('handleStudentSupportAction({ currentTarget: { dataset: { studentSupportAction: "focus-feedback", studentSupportFilter: "revision_requested" } } })', context);
  assert.equal(fetchLog.length, fetchCountBeforeSupport);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-active-filter="revision_requested"/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-feedback-item="/g) || []).length, 1);
  assert.equal(vm.runInContext("studentFeedbackFilter", context), "revision_requested");

  vm.runInContext('handleStudentSupportAction({ currentTarget: { dataset: { studentSupportAction: "focus-submissions", studentSupportFilter: "revision_requested" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-active-filter="revision_requested"/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-submission-row="/g) || []).length, 1);
  assert.equal(vm.runInContext("studentSubmissionFilter", context), "revision_requested");

  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-revision" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /Research Proposal/);
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
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: true }),
    },
  });
  assert.match(viewer, /data-workspace-mode="read-only"/);
  assert.match(viewer, /Read-only workspace/);
  assert.match(viewer, /Read-only viewer/);
  assert.match(viewer, /data-viewer-monitoring-overview="true"/);
  assert.match(viewer, /Read-only monitoring queue/);
  assert.match(viewer, /data-section="students" data-section-preset="submitted-students"/);
  assert.match(viewer, /data-section="students" data-section-preset="missing-mentors"/);
  assert.match(viewer, /data-section="students" data-section-preset="archive-failed-students"/);
  assert.doesNotMatch(viewer, /Open review queue|Open operations/);
  assert.match(viewer, /Private evidence/);

  const administration = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-read-only",
          email: "administration.readonly@example.edu",
          displayName: "Administration Readonly",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true, role: "administration" }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: true, role: "administration" }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: true }),
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "aggregate_only",
        generatedAt: "2026-05-31T18:00:00.000Z",
        metrics: [],
        rows: [],
      },
    },
  });
  assert.match(administration, /data-workspace-mode="read-only"/);
  assert.match(administration, /Read-only monitoring workspace/);
  assert.match(administration, /Administration/);
});

test("workspace renders Administration site dashboard and readiness without viewer-only labels", async () => {
  const sharedResponses = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-dashboard",
          email: "administration.dashboard@example.edu",
          displayName: "Administration Dashboard",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true, role: "administration" }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: true, role: "administration" }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: true }),
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "aggregate_only",
        generatedAt: "2026-05-31T18:00:00.000Z",
        metrics: [],
        rows: [],
      },
    },
  };

  const administrationDashboard = await renderWorkspaceWithFetch(sharedResponses, "siteDashboard");
  assert.match(administrationDashboard, /Leadership priorities/);
  assert.match(administrationDashboard, /Administration monitoring queue/);
  assert.match(administrationDashboard, /Leadership monitoring/);
  assert.match(administrationDashboard, /School follow-up to monitor/);
  assert.doesNotMatch(administrationDashboard, /Viewer priorities|Read-only viewer/);

  const administrationReadiness = await renderWorkspaceWithFetch(sharedResponses, "readiness");
  assert.match(administrationReadiness, /data-readiness-report="site-operations"/);
  assert.match(administrationReadiness, /Leadership readiness/);
  assert.match(administrationReadiness, /School Readiness/);
  assert.match(administrationReadiness, /Leadership monitoring/);
  assert.match(administrationReadiness, /teachers and site staff still handle approvals, mentor assignments, account updates, and security settings/i);
  assert.doesNotMatch(administrationReadiness, /Read-only viewer/);
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
  assert.match(disabled, /Welcome back/);
  assert.match(disabled, /Sign in to open your workspace\./);
  assert.match(disabled, /What this workspace does/);
  assert.match(disabled, /School Google account/);
  assert.match(disabled, /Google Workspace sign-in is not configured for this environment yet/);
  assert.match(disabled, /Local account/);
  assert.match(disabled, /Use this only if your school or project coordinator gave you a local account\./);
  assert.doesNotMatch(disabled, /Approved fallback access|Local account sign in/);
  assert.doesNotMatch(disabled, /Continue with Google(?: Workspace)?/);

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
  assert.match(enabled, /Continue with Google/);
  assert.match(enabled, /href="\/api\/auth\/google\/start\?returnTo=\/workspace\.html"/);
  assert.match(enabled, /School Google account/);
  assert.match(enabled, /Local account/);
  assert.match(enabled, /workspace-home-info/);
  assert.match(enabled, /workspace-landing-copy/);
  assert.match(enabled, /Capstone Project Workspace/);
  assert.match(enabled, /School workspace/);
  assert.doesNotMatch(enabled, /Continue with Google Workspace/);
  assert.doesNotMatch(enabled, /workspace-product-header/);
  assert.doesNotMatch(enabled, /Student progress|Private evidence|Mentor coverage|Review queue|Presentation readiness/);
  assert.doesNotMatch(enabled, /Approved fallback access|Local account sign in/);
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
  assert.match(security, /<strong>Account<\/strong>/);
  assert.match(security, /Account settings/);
  assert.match(security, /data-auth-action="change-password"/);
  assert.match(security, /\/api\/auth\/change-password/);
  assert.match(security, /without access to admin security tools/);
  assert.match(security, /other active sessions for this account are closed/);
  assert.doesNotMatch(security, /<strong>Security<\/strong>/);
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
  }, "student", `
    studentDisclosureState.files = true;
  `);

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
  assert.match(adminUsers, /Add User/);
  assert.match(adminUsers, /Full name/);
  assert.match(adminUsers, /Admin note/);
  assert.match(adminUsers, /Create account/);
  assert.doesNotMatch(adminUsers, /Import Account|Import reason|Misc Admin|misc_admin/);
  assert.match(adminUsers, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(adminUsers, /N9!aA-setup-zZ/);
  assert.match(adminUsers, /pending reset/i);
  assert.match(adminUsers, /will create a new password at first sign-in/i);
});

test("workspace renders current site access assignments before management forms", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-access-admin",
          email: "site.access@example.edu",
          displayName: "Site Access Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  });
  vm.runInContext('activeSection = "adminUsers"; renderAppShell();', context);
  const adminUsers = workspaceRoot.innerHTML;

  assert.match(adminUsers, /data-site-access-assignment-summary="true"/);
  assert.match(adminUsers, /Active Assignments/);
  assert.match(adminUsers, /Use these rows to confirm current access before saving changes below/);
  assert.match(adminUsers, /Mentor student coverage/);
  assert.match(adminUsers, /Mentor One/);
  assert.match(adminUsers, /Missing Mentor Demo 001/);
  assert.match(adminUsers, /Viewer student access/);
  assert.match(adminUsers, /Read-only Viewer/);
  assert.match(adminUsers, /Viewer access is read-only and limited to this student/);
  assert.match(adminUsers, /Program teacher access/);
  assert.match(adminUsers, /Program Teacher One/);
  assert.match(adminUsers, /Information Technology/);
  assert.match(adminUsers, /Administration access/);
  assert.match(adminUsers, /Principal One/);
  assert.match(adminUsers, /Desert Valley High School/);
  assert.match(adminUsers, /No site admin access is active for this school/);
  assert.match(adminUsers, /data-site-access-history="true"/);
  assert.match(adminUsers, /Recent access changes/);
  assert.match(adminUsers, /data-workspace-disclosure-panel="usersAccess:history"/);
  assert.match(adminUsers, /aria-expanded="false"/);
  assert.doesNotMatch(adminUsers, /Viewer access assigned|Program teacher access removed|Platform Admin/);
  openWorkspaceDisclosure(context, "usersAccess", "history");
  const adminUsersWithHistory = workspaceRoot.innerHTML;
  assert.match(adminUsersWithHistory, /aria-expanded="true"/);
  assert.match(adminUsersWithHistory, /Viewer access assigned/);
  assert.match(adminUsersWithHistory, /Site Access Admin/);
  assert.match(adminUsersWithHistory, /Program teacher access removed/);
  assert.match(adminUsersWithHistory, /Platform Admin/);
  assert.match(adminUsers, /data-site-access-action-guidance="mentor_student"/);
  assert.match(adminUsers, /Full rules are in Access guidance above/);
  assert.match(adminUsers, /data-site-access-guidance-panel="true"/);
  assert.doesNotMatch(adminUsers, /Remove should match a current mentor-student row/);
  openWorkspaceDisclosure(context, "usersAccess", "guidance");
  const adminUsersWithGuidance = workspaceRoot.innerHTML;
  assert.match(adminUsersWithGuidance, /Remove should match a current mentor-student row/);
  assert.match(adminUsers, /data-site-access-action-guidance="program_teacher_program"/);
  assert.match(adminUsersWithGuidance, /Remove does not delete accounts or program records/);
  assert.match(adminUsers, /Save access change/);
  assertMarkupOrder(adminUsers, "Active Assignments", "data-site-access-assignment-form", "current access summary should render before assignment forms");
  assertMarkupOrder(adminUsers, "Recent access changes", "data-site-access-assignment-form", "recent access changes should render before assignment forms");
  assert.doesNotMatch(adminUsers, /password_hash|temporaryPassword|drive_file_id|access_token|refresh_token|Family schedule change/i);
});

test("workspace renders site programs management for site admins with real empty states", async () => {
  const programs = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-program-admin",
          email: "site.programs@example.edu",
          displayName: "Site Program Admin",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/programs": {
      status: 200,
      body: siteProgramsFixture(),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  }, "programs");

  assert.match(programs, /data-site-programs-section="true"/);
  assert.match(programs, /Programs at Desert Valley High School/);
  assert.match(programs, /Manage which active programs belong to this school/);
  assert.match(programs, /Active site programs/);
  assert.match(programs, /Information Technology/);
  assert.match(programs, /Added May 29/);
  assert.match(programs, /Programs you can add/);
  assert.match(programs, /Biotechnology/);
  assert.match(programs, /Previously removed from this school/);
  assert.match(programs, /data-site-program-form/);
  assert.match(programs, /data-site-program-guidance="assign"/);
  assert.match(programs, /data-site-program-guidance="remove"/);
  assert.match(programs, /Add program/);
  assert.match(programs, /Remove program/);
  assert.match(programs, /keeps historical student and assignment records intact/);
  assert.doesNotMatch(programs, /coming soon|placeholder|href="#"/i);

  const emptyPrograms = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-program-admin-empty",
          email: "site.programs.empty@example.edu",
          displayName: "Site Program Admin Empty",
          roles: [{ role_id: "site_admin", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/programs": {
      status: 200,
      body: siteProgramsFixture({ activePrograms: [], availablePrograms: [] }),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  }, "programs");

  assert.match(emptyPrograms, /data-site-programs-empty="active"/);
  assert.match(emptyPrograms, /No programs are active for this school yet/);
  assert.match(emptyPrograms, /data-site-programs-empty="available"/);
  assert.match(emptyPrograms, /No more active programs are waiting to be added/);
  assert.match(emptyPrograms, /data-site-programs-form-empty="assign"/);
  assert.match(emptyPrograms, /data-site-programs-form-empty="remove"/);
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
  assert.match(nonAdminImport, /Users &amp; Access unavailable/);
  assert.doesNotMatch(nonAdminImport, /data-admin-action="import-users"/);
});

test("workspace renders readiness report with aggregate-only role guidance", async () => {
  const readiness = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "readiness-viewer",
          email: "readiness.viewer@example.edu",
          displayName: "Readiness Viewer",
          roles: [{ role_id: "misc_admin", scope_type: "reporting", scope_id: "alpha-readiness" }],
        },
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "aggregate_only",
        report: {
          submitted: 8,
          revisionRequested: 3,
          approved: 12,
          evidence: 41,
          exportsQueued: 2,
        },
      },
    },
  }, "readiness");

  assert.match(readiness, /data-readiness-report="aggregate"/);
  assert.match(readiness, /Aggregate Project Readiness/);
  assert.match(readiness, /Aggregate reporting only/);
  assert.match(readiness, /aggregate project activity only/);
  assert.match(readiness, /does not open individual student records/);
  assert.match(readiness, /Archive Packages Queued/);
  assert.match(readiness, /Closeout packages waiting to finish/);
  assert.doesNotMatch(readiness, /aggregate_only|Project Snapshot|Exports Queued/);
  assert.doesNotMatch(readiness, /data-admin-action="import-users"|View student detail/);
});

test("workspace renders presentation schedule filters and day-of actions", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
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
          {
            id: "slot-outline-follow-up",
            studentName: "Sam Student",
            scheduledFor: "2026-03-26T17:00:00.000Z",
            durationMinutes: 15,
            location: "Room 103",
            status: "checked_in",
            outlineStatus: "revision_needed",
            checkedOutAt: "2026-03-26T16:58:00.000Z",
            checkedInAt: "2026-03-26T17:13:00.000Z",
          },
        ],
      },
    },
  }, "presentation");

  vm.runInContext('activeSection = "presentation"; renderAppShell();', context);
  const presentation = workspaceRoot.innerHTML;
  assert.match(presentation, /data-presentation-schedule="true"/);
  assert.match(presentation, /workspace-presentation-dashboard/);
  assert.match(presentation, /Presentation readiness score/);
  assert.match(presentation, /Presentation stage breakdown/);
  assert.match(presentation, /Needs action worklist/);
  assert.match(presentation, /data-presentation-filters="true"/);
  assert.match(presentation, /data-presentation-filter="all"/);
  assert.match(presentation, /All \(3\)/);
  assert.match(presentation, /Ready for check-out \(1\)/);
  assert.match(presentation, /Checked out \(1\)/);
  assert.match(presentation, /Checked in \(1\)/);
  assert.match(presentation, /Outline follow-up \(1\)/);
  assert.match(presentation, /data-presentation-state="scheduled"/);
  assert.match(presentation, /data-presentation-state="checked_out"/);
  assert.match(presentation, /Maya Student/);
  assert.match(presentation, /Jordan Student/);
  assert.match(presentation, /Sam Student/);
  assert.match(presentation, /Room 101/);
  assert.match(presentation, /Outline[\s\S]*Approved/);
  assert.match(presentation, /data-presentation-action="check-out"/);
  assert.match(presentation, /data-presentation-action="check-in"/);

  vm.runInContext('handlePresentationFilterAction({ currentTarget: { dataset: { presentationFilterAction: "scheduled" } } })', context);
  const scheduledOnly = workspaceRoot.innerHTML;
  assert.match(scheduledOnly, /data-presentation-filter="scheduled"/);
  assert.match(scheduledOnly, /Maya Student/);
  assert.doesNotMatch(scheduledOnly, /Jordan Student|Sam Student/);
  assert.match(scheduledOnly, /data-presentation-action="check-out"/);

  vm.runInContext('handlePresentationFilterAction({ currentTarget: { dataset: { presentationFilterAction: "outline_follow_up" } } })', context);
  const outlineOnly = workspaceRoot.innerHTML;
  assert.match(outlineOnly, /data-presentation-filter="outline_follow_up"/);
  assert.match(outlineOnly, /Sam Student/);
  assert.match(outlineOnly, /Revision needed/);
  assert.doesNotMatch(outlineOnly, /Maya Student|Jordan Student/);

  vm.runInContext('handlePresentationFilterAction({ currentTarget: { dataset: { presentationFilterAction: "bogus" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-presentation-filter="all"/);
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

  assert.match(archive, /workspace-archive-dashboard/);
  assert.match(archive, /Archive readiness score/);
  assert.match(archive, /Archive distribution/);
  assert.match(archive, /Archive ready/);
  assert.match(archive, /Needs action/);
  assert.match(archive, /data-archive-check-status="ready"/);
  assert.match(archive, /data-archive-check-status="attention_required"/);
  assert.match(archive, /Celebration Day evidence/);
  assert.match(archive, /data-archive-guidance="true"/);
  assert.match(archive, /Your archive package is ready/);
  assert.match(archive, /data-archive-download="manifest"/);
  assert.match(archive, /Download archive manifest/);
  assert.match(archive, /Your archive download is ready until/);
  assert.match(archive, /Private file details stay hidden/);
  assert.match(archive, /data-archive-drive-package="ready"/);
  assert.match(archive, /Archive package file is stored for protected download/);
  assert.match(archive, /data-archive-retention-status="policy_review_required"/);
  assert.match(archive, /Retention policy needs school review before archive packages are used broadly/);
  assert.match(archive, /expiring soon/i);
  assert.doesNotMatch(archive, /signed archive links|export generation is wired|Scoped archive|Drive-backed archive package/i);
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

test("workspace explains student archive package failures without fake retry controls", async () => {
  const archive = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-archive-failed",
          email: "student.archive.failed@example.edu",
          displayName: "Archive Failed Student",
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
          readyChecks: 4,
          missingChecks: 0,
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
        ],
        archive: {
          status: "failed",
          scopedDownloadReady: false,
          signedDownloadReady: false,
          drivePackageReady: false,
          downloadUrl: null,
          downloadExpired: false,
          message: "Archive package failed and needs staff follow-up.",
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

  assert.match(archive, /data-archive-guidance-status="failed"/);
  assert.match(archive, /Staff need to review your archive package/);
  assert.match(archive, /Archive package preparation needs staff follow-up/);
  assert.match(archive, /No retry action is needed from you right now/);
  assert.doesNotMatch(archive, /data-archive-action|Retry archive|Request archive|signed archive links|export generation is wired|href="#"/i);
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

function siteAccessAssignmentsFixture() {
  return {
    ok: true,
    generatedAt: "2026-05-31T14:05:00.000Z",
    scope: {
      tenantId: "tenant-desert-valley",
      tenantName: "Desert Valley School District",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      schoolYear: "2025-2026",
      role: "site_admin",
      accessibleSites: [
        { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      ],
    },
    users: {
      students: [
        {
          userId: "demo-student-101",
          displayName: "Missing Mentor Demo 001",
          email: "missing.mentor.001@demo-student.capstone.test",
        },
      ],
      mentors: [
        {
          userId: "demo-mentor-001",
          displayName: "Mentor One",
          email: "mentor.one@demo-staff.capstone.test",
        },
      ],
      viewers: [
        {
          userId: "demo-viewer-001",
          displayName: "Read-only Viewer",
          email: "viewer.one@demo-staff.capstone.test",
        },
      ],
      programTeachers: [
        {
          userId: "demo-teacher-001",
          displayName: "Program Teacher One",
          email: "teacher.one@demo-staff.capstone.test",
        },
      ],
      administration: [
        {
          userId: "demo-principal-001",
          displayName: "Principal One",
          email: "principal.one@demo-staff.capstone.test",
        },
      ],
      siteAdmins: [],
    },
    programs: [
      { programId: "it", programName: "Information Technology" },
    ],
    assignments: {
      mentorStudent: [
        {
          assignmentId: "mentor-student-001",
          mentorUserId: "demo-mentor-001",
          studentId: "demo-student-101",
        },
      ],
      viewerStudent: [
        {
          assignmentId: "viewer-student-001",
          viewerUserId: "demo-viewer-001",
          studentId: "demo-student-101",
        },
      ],
      programTeacherProgram: [
        {
          programTeacherUserId: "demo-teacher-001",
          programId: "it",
        },
      ],
      administrationSite: [
        {
          userId: "demo-principal-001",
          siteId: "site-desert-valley-high",
        },
      ],
      siteAdminSite: [],
    },
    history: [
      {
        historyId: "access-history-001",
        assignmentType: "viewer_student",
        action: "assign",
        actorName: "Site Access Admin",
        targetUserId: "demo-viewer-001",
        studentId: "demo-student-101",
        programId: "",
        siteId: "site-desert-valley-high",
        createdAt: "2026-05-31T13:58:00.000Z",
      },
      {
        historyId: "access-history-002",
        assignmentType: "program_teacher_program",
        action: "remove",
        actorName: "Platform Admin",
        targetUserId: "demo-teacher-001",
        studentId: "",
        programId: "it",
        siteId: "site-desert-valley-high",
        createdAt: "2026-05-31T13:12:00.000Z",
      },
    ],
    permissions: {
      canAssignMentors: true,
      canAssignViewers: true,
      canAssignProgramTeachers: true,
      canAssignAdministration: true,
      canAssignSiteAdmins: false,
      canCreateGlobalAdmin: false,
    },
  };
}

function siteProgramsFixture({ activePrograms = null, availablePrograms = null } = {}) {
  return {
    ok: true,
    generatedAt: "2026-05-31T15:40:00.000Z",
    scope: {
      tenantId: "tenant-desert-valley",
      tenantName: "Desert Valley School District",
      siteId: "site-desert-valley-high",
      siteName: "Desert Valley High School",
      schoolYear: "2025-2026",
      role: "site_admin",
      accessibleSites: [
        { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      ],
    },
    activePrograms: activePrograms ?? [
      {
        programId: "it",
        programName: "Information Technology",
        assignedAt: "2026-05-29T14:00:00.000Z",
      },
    ],
    availablePrograms: availablePrograms ?? [
      {
        programId: "biotech",
        programName: "Biotechnology",
        assignedAt: "",
        previouslyRemoved: true,
      },
      {
        programId: "culinary",
        programName: "Culinary Arts",
        assignedAt: "",
        previouslyRemoved: false,
      },
    ],
    permissions: {
      canManageSitePrograms: true,
    },
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
      evidenceStatus: "attached",
      reviewCount: 1,
      reviewStatus: "needs_revision",
      commentCount: 2,
      presentationStatus: "pending",
      archiveStatus: "missing",
      riskScore: 8,
      riskFlags: ["no_mentor", "high"],
      progressStatus: "missing_mentor",
      progressPercent: 50,
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
      evidenceStatus: "attached",
      reviewCount: 2,
      reviewStatus: "approved",
      commentCount: 1,
      presentationStatus: "scheduled",
      archiveStatus: "failed",
      riskScore: 5,
      riskFlags: ["archive_failed"],
      progressStatus: "ready_complete",
      progressPercent: 75,
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
      progressStatus: "",
      evidenceStatus: "",
      reviewStatus: "",
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
      onTrack: 6,
      evidenceMissing: 5,
      needsReview: 18,
      readyComplete: 8,
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
      progressStatuses: ["on_track", "behind", "missing_mentor", "missing_evidence", "needs_review", "needs_revision", "ready_complete"],
      evidenceStatuses: ["attached", "missing"],
      reviewStatuses: ["needs_review", "needs_revision", "approved", "reviewed", "not_reviewed"],
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
      evidenceStatus: "",
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
      evidenceMissing: rows.filter((row) => row.evidenceCount === 0).length,
      highRisk: rows.filter((row) => row.riskScore >= 7).length,
      noMentor: rows.filter((row) => Array.isArray(row.riskFlags) && row.riskFlags.includes("no_mentor")).length,
    },
    queue: rows,
    filterOptions: {
      programs: [{ programId: "it", programName: "Information Technology", queueCount: rows.length }],
      statuses: ["submitted", "revision_requested", "approved"],
      storyBuckets: ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"],
      risks: ["any", "high", "medium", "low", "stale", "no_mentor"],
      evidenceStatuses: ["attached", "missing"],
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
      reason: "No submitted or revision-requested work matches the current review filters.",
      owner: "Assigned review staff.",
      nextAction: "Clear or adjust filters to return to submitted work this view can access.",
    } : null,
  };
}

function siteMentorAssignmentsFixture({
  role = "site_admin",
  readOnly = !["site_admin", "admin", "org_admin", "platform_admin"].includes(role),
  canManage = !readOnly && role !== "program_teacher" && role !== "viewer",
  filters = null,
  unassignedStudents = null,
  pagination = null,
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
      ...(pagination || {}),
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
    unassignedStudents: unassignedStudents || [
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
    {
      studentId: "demo-student-051",
      studentName: "Archive Expiring Demo 001",
      programId: "it",
      programName: "Information Technology",
      storyBucket: "archive_ready",
      riskScore: 2,
      riskFlags: [],
      archiveStatus: "expiring_soon",
      exportStatus: "complete",
      ready: true,
      failed: false,
      providerStatus: "ready",
      downloadReady: true,
      downloadExpiresSoon: true,
      storageIdentifiersRedacted: true,
      reason: "Archive package is ready, but its download window is expiring soon.",
      owner: "Site administration",
      nextAction: "Confirm archive download window before it expires.",
    },
    {
      studentId: "demo-student-052",
      studentName: "Archive Expired Demo 001",
      programId: "it",
      programName: "Information Technology",
      storyBucket: "archive_ready",
      riskScore: 3,
      riskFlags: [],
      archiveStatus: "expired",
      exportStatus: "complete",
      ready: false,
      failed: false,
      providerStatus: "ready",
      downloadReady: false,
      downloadExpiresSoon: false,
      storageIdentifiersRedacted: true,
      reason: "Archive package download window expired.",
      owner: "Site administration",
      nextAction: "Ask authorized staff to generate a fresh archive package.",
    },
    {
      studentId: "demo-student-053",
      studentName: "Archive Storage Demo 001",
      programId: "it",
      programName: "Information Technology",
      storyBucket: "archive_ready",
      riskScore: 4,
      riskFlags: ["archive_failed"],
      archiveStatus: "provider_unavailable",
      exportStatus: "not_requested",
      ready: false,
      failed: true,
      providerStatus: "drive_credentials_missing",
      downloadReady: false,
      downloadExpiresSoon: false,
      storageIdentifiersRedacted: true,
      reason: "Archive provider setup is unavailable.",
      owner: "Archive operations",
      nextAction: "Confirm archive storage setup before generating packages.",
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
      studentId: "",
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
      returned: 5,
      total,
      filteredTotal: 5,
    },
    summary: {
      studentsTotal: total,
      presentationReady: 12,
      presentationPending: 9,
      presentationScheduled: 6,
      outlinePending: 5,
      archiveReady: 10,
      archiveInProgress: 3,
      archiveExpiringSoon: 1,
      archiveExpired: 1,
      archiveFailed: 5,
      archiveMissing: 20,
      evidenceMissing: 7,
      highRisk: 5,
      staleActivity: 5,
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
        attentionRequired: 2,
      },
      rows: presentationRows,
    },
    archive: {
      summary: {
        ready: 4,
        missing: 20,
        failed: 5,
        complete: 6,
        queued: 2,
        running: 1,
        expired: 1,
        expiringSoon: 1,
        providerUnavailable: 1,
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
      archiveStatuses: ["ready", "complete", "failed", "missing", "queued", "running", "in_progress", "expired", "expiring_soon", "provider_unavailable"],
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
        visibility: "student_and_staff",
        authorName: "Program Teacher",
        createdAt: "2026-05-21T12:35:00.000Z",
      },
      {
        id: "comment-review-staff-001",
        body: "Private staff planning note.",
        visibility: "staff_only",
        authorName: "Program Teacher",
        createdAt: "2026-05-21T12:40:00.000Z",
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
    mentorAssignmentHistory: [
      {
        assignmentId: "assignment-previous-101",
        mentorUserId: "mentor-previous-101",
        mentorName: "Previous Mentor",
        active: false,
        assignedAt: "2026-05-01T12:00:00.000Z",
        assignedByName: "",
        nextAction: "This previous mentor assignment is inactive.",
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
      canViewReviewQueue: !readOnly,
      canMutateReviewDecision: false,
      canAddStaffNote: false,
      canManageMentorAssignments: false,
      canViewPresentationOperations: !readOnly,
      canManagePresentationOperations: false,
      canViewArchiveOperations: !readOnly,
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
  const fetchRequests = [];
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
    fetch: async (url, options = {}) => {
      const rawPath = typeof url === "string" ? url : url?.pathname;
      fetchLog.push(String(rawPath || ""));
      fetchRequests.push({
        url: String(rawPath || ""),
        method: String(options?.method || "GET").toUpperCase(),
        body: options?.body || "",
      });
      const pathname = String(rawPath || "").startsWith("http")
        ? new URL(rawPath).pathname
        : String(rawPath || "").split("?")[0];
      const routeMatch = routes[pathname]
        || (pathname === "/api/site/operations-readiness"
          ? { status: 200, body: siteOperationsReadinessFixture() }
          : pathname === "/api/site/programs"
            ? { status: 200, body: siteProgramsFixture() }
            : null);
      const route = typeof routeMatch === "function" ? await routeMatch({ url: String(rawPath || ""), options }) : routeMatch;
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
  return { context, workspaceRoot, fetchLog, fetchRequests, locationChanges, window };
}
