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

function visibleText(markup) {
  return String(markup || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function assertFocusableStudentDetailPanel(markup) {
  assert.match(markup, /id="siteStudentDetailPanel"/);
  assert.match(markup, /data-student-detail-panel="true"/);
  assert.match(markup, /tabindex="-1"/);
  assert.match(markup, /aria-labelledby="siteStudentDetailTitle"/);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cssMediaBlock(maxWidth) {
  const marker = `@media (max-width: ${maxWidth}px)`;
  const start = workspaceCss.indexOf(marker);
  if (start === -1) return "";
  const open = workspaceCss.indexOf("{", start);
  if (open === -1) return "";
  let depth = 0;
  for (let index = open; index < workspaceCss.length; index += 1) {
    const char = workspaceCss[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return workspaceCss.slice(open + 1, index);
    }
  }
  return "";
}

function workspaceDrawerWidthForViewport(viewportWidth) {
  return Math.min(360, viewportWidth - 32);
}

function adminReadableWidthForViewport(viewportWidth) {
  return Math.min(1560, viewportWidth);
}

function authConfigFixture() {
  return {
    ok: true,
    authMode: "hardened_username_password",
    googleSsoEnabled: false,
    googleSsoConfigured: false,
    localLoginEnabled: true,
    googleWorkspaceLabel: "Use your school Google Workspace account",
  };
}

function studentPreviewDashboardFixture({ studentId = "demo-student-101", displayName = "Missing Mentor Demo 001" } = {}) {
  return {
    ok: true,
    studentId,
    student: {
      studentId,
      displayName,
      email: `${studentId}@demo-student.capstone.test`,
    },
    viewer: { id: "staff-preview", self: false },
    nextAction: "Fix the proposal revision and send it back for review.",
    summary: {
      requirementsTotal: 1,
      requirementsComplete: 0,
      phasesTotal: 1,
      phasesComplete: 0,
      completionPercent: 20,
      currentStatus: "revision_requested",
      submittedRequiredCount: 0,
      missingRequiredCount: 1,
      revisionRequestedCount: 1,
      waitingForReviewCount: 0,
      mentor: { assigned: true, name: "Mentor One" },
    },
    nextSteps: [
      {
        title: "Project proposal",
        detail: "Fix the measurable success criteria.",
        requirementId: "req-proposal",
        status: "revision_requested",
        submissionId: "submission-preview-001",
        submissionStatus: "revision_requested",
        evidenceCount: 1,
      },
    ],
    requirements: [
      {
        requirementId: "req-proposal",
        title: "Project proposal",
        description: "Revise the project proposal.",
        phase: "phase-1",
        phaseLabel: "Phase 1",
        status: "revision_requested",
        submissionId: "submission-preview-001",
        submissionStatus: "revision_requested",
        version: 2,
        evidenceCount: 1,
        nextAction: "Fix the note and send it back.",
      },
    ],
    submissions: [
      {
        id: "submission-preview-001",
        requirement_id: "req-proposal",
        requirement_title: "Project proposal",
        status: "revision_requested",
        version: 2,
        updated_at: "2026-05-20T12:00:00.000Z",
        evidence_count: 1,
      },
    ],
    evidence: [
      {
        id: "evidence-preview-001",
        submissionId: "submission-preview-001",
        requirementId: "req-proposal",
        requirementTitle: "Project proposal",
        title: "Proposal draft",
        artifact_type: "proposal",
        source_kind: "external_link",
        externalUrl: "https://example.com/proposal",
        review_status: "pending_review",
        created_at: "2026-05-19T12:00:00.000Z",
      },
    ],
    feedback: [
      {
        id: "feedback-preview-001",
        kind: "review",
        submissionId: "submission-preview-001",
        requirementTitle: "Project proposal",
        submissionStatus: "revision_requested",
        submissionVersion: 2,
        status: "revision_requested",
        message: "Add one measurable success criteria.",
        authorName: "Program Teacher",
        createdAt: "2026-05-20T12:00:00.000Z",
      },
    ],
  };
}

function userForRoleProfile(roleId) {
  if (roleId === "role_pending") {
    return {
      id: "role-profile-pending",
      email: "pending.role@example.edu",
      displayName: "Pending Role",
      roles: [],
    };
  }
  const scope = {
    student: { scope_type: "global", scope_id: "" },
    mentor: { scope_type: "site", scope_id: "site-desert-valley-high" },
    viewer: { scope_type: "site", scope_id: "site-desert-valley-high" },
    program_teacher: { scope_type: "program", scope_id: "it" },
    administration: { scope_type: "site", scope_id: "site-desert-valley-high" },
    site_admin: { scope_type: "site", scope_id: "site-desert-valley-high" },
    global_admin: { scope_type: "global", scope_id: "*" },
    platform_admin: { scope_type: "global", scope_id: "*" },
    admin: { scope_type: "global", scope_id: "*" },
    misc_admin: { scope_type: "global", scope_id: "" },
  }[roleId] || { scope_type: "global", scope_id: "" };
  return {
    id: `role-profile-${roleId}`,
    email: `${roleId.replace(/_/g, ".")}.profile@example.edu`,
    displayName: `${roleId.replace(/_/g, " ")} Profile`,
    roles: [{ role_id: roleId, ...scope }],
  };
}

function profileRoutesForRole(roleId) {
  return {
    "/api/auth/config": { status: 200, body: authConfigFixture() },
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: userForRoleProfile(roleId),
      },
    },
    "/api/student/dashboard": {
      status: 200,
      body: {
        ok: true,
        viewer: { self: true },
        nextAction: "Finish the next senior project step.",
        summary: {},
        nextSteps: [],
        requirements: [],
        submissions: [],
        evidence: [],
        feedback: [],
      },
    },
    "/api/student/archive/readiness": {
      status: 200,
      body: { ok: true, checks: [], archive: { status: "not_requested" }, storage: {}, retention: {} },
    },
    "/api/site/dashboard": { status: 200, body: siteDashboardFixture({ readOnly: roleId === "viewer", role: roleId }) },
    "/api/site/programs": { status: 200, body: siteProgramsFixture() },
    "/api/site/students": { status: 200, body: siteStudentsFixture({ readOnly: roleId === "viewer", role: roleId }) },
    "/api/site/review-queue": { status: 200, body: siteReviewQueueFixture({ role: roleId, readOnly: roleId !== "program_teacher" }) },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: roleId }) },
    "/api/site/access-assignments": { status: 200, body: siteAccessAssignmentsFixture() },
    "/api/site/operations-readiness": { status: 200, body: siteOperationsReadinessFixture({ role: roleId, readOnly: roleId === "viewer" }) },
    "/api/admin/role-assignments": { status: 200, body: { ok: true, assignments: [] } },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        generatedAt: "2026-06-07T12:00:00.000Z",
        summary: {},
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
        recentExports: [],
      },
    },
    "/api/mentor/dashboard": {
      status: 200,
      body: { ok: true, scope: "mentor_assigned", summary: { assignedCount: 0, needsRevision: 0, missingMeeting: 0, presentationPending: 0 }, assignedStudents: [] },
    },
    "/api/mentor/assigned": {
      status: 200,
      body: { ok: true, mentorId: `role-profile-${roleId}`, assignedStudents: [] },
    },
    "/api/program-teacher/dashboard": {
      status: 200,
      body: { ok: true, scope: { scopeType: "program", scopeId: "it" }, summary: {}, students: [], needsAttention: [], needsReview: [], recentActivity: [], programBreakdown: [] },
    },
    "/api/presentation-slots": { status: 200, body: { ok: true, slots: [], summary: {} } },
    "/api/reports/readiness": { status: 200, body: { ok: true, scope: "aggregate_only", metrics: {} } },
  };
}

function viewAsStudentRoutesForRole(roleId) {
  const routes = { ...profileRoutesForRole(roleId) };
  const allowedName = viewAsStudentAllowedName(roleId);
  routes["/api/student/dashboard"] = ({ url }) => {
    const parsed = new URL(url, "https://workspace.example");
    const studentId = parsed.searchParams.get("studentId") || "demo-student-101";
    if (studentId !== "demo-student-101") {
      return { status: 403, body: { error: "forbidden" } };
    }
    return {
      status: 200,
      body: studentPreviewDashboardFixture({ studentId, displayName: allowedName }),
    };
  };
  routes["/api/student/archive/readiness"] = ({ url }) => {
    const parsed = new URL(url, "https://workspace.example");
    const studentId = parsed.searchParams.get("studentId") || "demo-student-101";
    if (studentId !== "demo-student-101") {
      return { status: 403, body: { error: "forbidden" } };
    }
    return {
      status: 200,
      body: {
        ok: true,
        source: "staff_preview",
        summary: { readyChecks: 0, missingChecks: 1, totalChecks: 1, archiveAvailableToRequest: false },
        checks: [],
        archive: { status: "not_requested", downloadUrl: null },
        storage: { storageIdentifiersRedacted: true },
        retention: { policyStatus: "policy_review_required" },
      },
    };
  };
  if (roleId === "mentor") {
    routes["/api/mentor/dashboard"] = {
      status: 200,
      body: {
        ok: true,
        scope: "mentor_assigned",
        summary: { assignedCount: 1, needsRevision: 1, missingMeeting: 1, presentationPending: 1 },
        assignedStudents: [
          {
            studentId: "demo-student-101",
            studentName: "Zoe Needs Help",
            submissionStatus: "revision_requested",
            latestSubmissionUpdatedAt: "2026-05-28T18:00:00.000Z",
            evidenceCount: 3,
            mentorMeetingStatus: "makeup_required",
            latestMentorMeetingAt: "2026-05-27T15:30:00.000Z",
            presentationStatus: "not_scheduled",
            outlineStatus: "pending",
            latestPresentationScheduledFor: "2026-05-29T18:15:00.000Z",
            needsAttention: ["mentor_meeting", "presentation"],
          },
        ],
      },
    };
  }
  return routes;
}

function viewAsStudentAllowedName(roleId) {
  if (roleId === "program_teacher") return "Revision Loop Demo 001";
  if (roleId === "mentor") return "Zoe Needs Help";
  return "Missing Mentor Demo 001";
}

async function enterViewAsStudentFromDataset(context, { studentId, studentName, sourceSection }) {
  await vm.runInContext(`
    handleViewAsStudentAction({
      currentTarget: {
        dataset: {
          viewAsStudentAction: "enter",
          viewAsStudentId: ${JSON.stringify(studentId)},
          viewAsStudentName: ${JSON.stringify(studentName)},
          viewAsStudentSourceSection: ${JSON.stringify(sourceSection)}
        }
      }
    });
  `, context);
}

function assertStaffPreviewActive(markup, studentName) {
  assert.match(markup, /data-view-as-student="active"/);
  assert.match(markup, new RegExp(`Viewing as:\\s*${escapeRegExp(studentName)}`));
  assert.match(markup, /Exit student view/);
  assert.match(markup, /data-student-view-mode="staff-preview"/);
  assert.match(markup, /data-view-as-student-readonly="true"/);
  assert.match(markup, /Staff preview is read-only|Viewer role remains read-only/);
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
  assert.match(workspaceJs, /\/api\/admin\/users\/\$\{encodeURIComponent\(userId\)\}/);
  assert.match(workspaceJs, /\/api\/site\/dashboard/);
  assert.match(workspaceJs, /\/api\/site\/programs/);
  assert.match(workspaceJs, /\/api\/site\/students/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(studentId\)\}/);
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
  assert.match(workspaceJs, /Sending your work to the Program Teacher for review/);
  assert.match(workspaceJs, /Your work was sent to the Program Teacher\. Wait for approval before starting the next step/);
  assert.match(workspaceJs, /Wait for Program Teacher approval/);
  assert.match(workspaceJs, /Your work is with your Program Teacher\. Check what you sent once, then wait for approval or revision before changing direction/);
  assert.match(workspaceJs, /Wait for your Program Teacher to set up your work/);
  assert.match(workspaceJs, /Required work will appear here when your Program Teacher is ready for you to start/);
  assert.match(workspaceJs, /Do not change direction or start the next phase until your Program Teacher records approval/);
  assert.match(workspaceJs, /Attach the link or file that shows this exact work/);
  assert.match(workspaceJs, /Open the item marked Needs Revision, make the changes, then send it back to your Program Teacher/);
  assert.match(workspaceJs, /Try again later or ask your Program Teacher which version to update/);
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
  assert.match(workspaceJs, /add\("security", "Account", "Password and sessions", \{ hidden: true \}\)/);
  assert.match(workspaceJs, /data-admin-action="import-users"/);
  assert.match(workspaceJs, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(workspaceJs, /credential_delivery_policy_required/);
  assert.match(workspaceJs, /Local accounts only\. SSO is disabled for this setup\./);
  assert.match(workspaceJs, /SSO is disabled for this setup\. Choose Local account\./);
  assert.match(workspaceJs, /data-admin-account-remove-form/);
  assert.match(workspaceJs, /data-site-student-remove-form/);
  assert.match(workspaceJs, /Create a new password/);
  assert.match(workspaceJs, /Password and Sessions/);
  assert.match(workspaceJs, /Your file was received/);
  assert.match(workspaceJs, /file uploads are not ready here/);
  assert.match(workspaceJs, /XMLHttpRequest/);
  assert.match(workspaceJs, /data-upload-state/);
  assert.match(workspaceJs, /data-upload-progress/);
  assert.match(workspaceJs, /data-upload-message/);
  assert.match(workspaceJs, /data-upload-action="select-file"/);
  assert.match(workspaceJs, /data-upload-action="retry"/);
  assert.match(workspaceJs, /data-workspace-student-search="true"/);
  assert.match(workspaceJs, /function openWorkspaceStudentSearch\(searchValue = ""\)/);
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
  assert.match(workspaceJs, /data-sso-disabled-reason="configuration"/);
  assert.match(workspaceJs, /data-sso-disabled-reason="local-only"/);
  assert.match(workspaceJs, /Google Workspace sign-in is disabled until the approved school identity provider is configured/);
  assert.match(workspaceJs, /Use this only if your school or project coordinator gave you a local account/);
  assert.match(workspaceJs, /aria-pressed="\$\{workspaceNavCollapsed \? "true" : "false"\}"/);
  assert.match(workspaceJs, /data-session-recovery-guide="true"/);
  assert.match(workspaceJs, /Your session expired/);
  assert.match(workspaceJs, /data-destructive-confirmation/);
  assert.match(workspaceJs, /data-destructive-confirmation="\$\{escapeHtml\(id\)\}"/);
  assert.match(workspaceJs, /deliveryConfirmation/);
  assert.match(workspaceJs, /confirmImpact/);
  assert.match(workspaceJs, /status === 404[\s\S]*That record was not found or is no longer available/);
  assert.match(workspaceJs, /status === 409[\s\S]*needs a current selection or refreshed record/);
  assert.match(workspaceJs, /status === 429[\s\S]*Too many requests happened in a short time/);
  assert.match(workspaceJs, /status === 502 \|\| status === 503[\s\S]*storage or provider service is not ready/);
  assert.match(workspaceJs, /status >= 500[\s\S]*server problem/);
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

test("workspace normalizes stale student Program Teacher instruction copy", async () => {
  const { context } = await createWorkspaceContextWithFetch(profileRoutesForRole("student"));
  assert.equal(
    vm.runInContext('studentInstructionCopy("Start when your teacher is ready for teacher review.")', context),
    "Start when your Program Teacher is ready for Program Teacher review.",
  );
  assert.equal(
    vm.runInContext('studentInstructionCopy("Ask your program teacher who can help with mentor questions.")', context),
    "Ask your Program Teacher who can help with mentor questions.",
  );
});

test("workspace defaults to workflow landings instead of role profiles", async () => {
  const student = await renderWorkspaceWithFetch(profileRoutesForRole("student"));
  const studentText = visibleText(student);
  assert.match(student, /data-experience="student"/);
  assert.match(student, /aria-label="My Capstone navigation"/);
  for (const label of ["Today", "My Work", "Feedback", "Final Checklist"]) {
    assert.match(student, new RegExp(`title="${escapeRegExp(label)}"`), `student nav includes ${label}`);
  }
  assert.doesNotMatch(student, /data-workspace-mode-switch="true"/);
  assert.doesNotMatch(studentText, /Admin Console|Staff Workspace|working profile|Role context|Demo boundary/);
  assert.match(studentText, /My Capstone/);
  assert.match(studentText, /What do I need to do next\?/);

  const staffCases = [
    ["mentor", ["Today", "Students", "Reports"]],
    ["viewer", ["Today", "Students", "Reports"]],
    ["program_teacher", ["Today", "Students", "Reviews", "Reports"]],
    ["administration", ["Today", "Students", "Reports"]],
    ["site_admin", ["Today", "Students", "Reviews", "Reports"]],
    ["global_admin", ["Today", "Students", "Reviews", "Reports"]],
  ];
  for (const [roleId, expectedLabels] of staffCases) {
    const markup = await renderWorkspaceWithFetch(profileRoutesForRole(roleId));
    const text = visibleText(markup);
    assert.match(markup, /data-experience="staff-workspace"/, `${roleId} staff experience`);
    assert.match(markup, /aria-label="Staff Workspace navigation"/, `${roleId} staff nav label`);
    assert.match(text, /Staff Workspace|Which students need attention today\?|Read-only access/, `${roleId} workflow question`);
    assert.doesNotMatch(text, /working profile|Role context|Demo boundary|What this role can manage or monitor/, `${roleId} no role-proof landing`);
    for (const label of expectedLabels) {
      assert.match(markup, new RegExp(`title="${escapeRegExp(label)}"`), `${roleId} nav includes ${label}`);
    }
  }

  const hiddenProfile = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "profile");
  assert.match(hiddenProfile, /data-role-profile="global_admin"/);
  assert.match(hiddenProfile, /Global Admin guide/);
  assert.doesNotMatch(visibleText(hiddenProfile), /Global Admin working profile/);
});

test("workspace separates Admin Console mode by role and URL state", async () => {
  const studentWorkspace = await renderWorkspaceWithFetch(profileRoutesForRole("student"));
  assert.match(studentWorkspace, /data-experience="student"/);
  assert.match(studentWorkspace, /aria-label="My Capstone navigation"/);
  assert.doesNotMatch(studentWorkspace, /data-workspace-mode-switch="true"/);
  assert.doesNotMatch(visibleText(studentWorkspace), /Admin Console|Staff Workspace|Role context|Demo boundary/);

  const studentAdminDeepLink = await renderWorkspaceWithFetch(profileRoutesForRole("student"), "", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=students",
  });
  assert.match(studentAdminDeepLink, /data-app-mode="workspace"/);
  assert.match(studentAdminDeepLink, /data-admin-console-unavailable="true"/);
  assert.match(studentAdminDeepLink, /My Capstone/);
  assert.doesNotMatch(studentAdminDeepLink, /workspace-admin-console-rail|data-admin-console-overview="true"/);

  for (const roleId of ["viewer", "mentor"]) {
    const denied = await renderWorkspaceWithFetch(profileRoutesForRole(roleId), "", "", {
      url: "https://workspace.example/workspace.html?mode=admin&section=overview",
    });
    assert.match(denied, /data-app-mode="workspace"/, `${roleId} stays in Workspace`);
    assert.match(denied, /data-admin-console-unavailable="true"/, `${roleId} admin deep link denied`);
    assert.doesNotMatch(denied, /workspace-admin-console-rail|data-admin-console-overview="true"|data-workspace-mode-target="admin"/, `${roleId} no admin shell`);
  }

  const roleMatrix = [
    {
      roleId: "program_teacher",
      scope: "Program",
      visible: ["adminPeople", "adminStudents", "adminAssignments", "adminImports"],
      hiddenAllowed: ["students", "teacher", "mentorAssignments", "operations", "adminUsers"],
      absent: ["programs", "security", "audit", "archiveExports"],
    },
    {
      roleId: "administration",
      scope: "School",
      visible: ["adminPeople", "adminStudents", "adminAssignments", "adminImports", "adminReports"],
      hiddenAllowed: ["siteDashboard", "students", "mentorAssignments", "operations", "adminUsers", "presentation", "readiness"],
      absent: ["programs", "security", "audit", "archiveExports"],
    },
    {
      roleId: "site_admin",
      scope: "Site",
      visible: ["adminPeople", "adminStudents", "adminAssignments", "programs", "adminImports", "adminReports"],
      hiddenAllowed: ["siteDashboard", "students", "teacher", "mentorAssignments", "operations", "adminUsers", "presentation", "readiness"],
      absent: ["security", "audit", "archiveExports"],
    },
    {
      roleId: "global_admin",
      scope: "Global",
      visible: ["adminPeople", "adminStudents", "adminAssignments", "programs", "adminImports", "adminReports", "audit"],
      hiddenAllowed: ["adminDashboard", "siteDashboard", "students", "teacher", "mentorAssignments", "operations", "adminUsers", "presentation", "readiness", "archiveExports", "security"],
      absent: [],
    },
  ];

  for (const row of roleMatrix) {
    const markup = await renderWorkspaceWithFetch(profileRoutesForRole(row.roleId), "", "", {
      url: "https://workspace.example/workspace.html?mode=admin&section=overview",
    });
    assert.match(markup, /data-app-mode="admin"/, `${row.roleId} admin mode`);
    assert.match(markup, /data-experience="admin-console"/, `${row.roleId} admin experience`);
    assert.match(markup, /data-workspace-mode-switch="true"/, `${row.roleId} mode switch`);
    assert.match(markup, /data-workspace-mode-target="workspace"[\s\S]*Workspace/, `${row.roleId} workspace switch`);
    assert.match(markup, /data-workspace-mode-target="admin"[\s\S]*Admin Console/, `${row.roleId} admin switch`);
    assert.doesNotMatch(markup, /data-role-command-strip="true"/, `${row.roleId} no role command strip`);
    assert.match(markup, /data-admin-console-overview="true"/, `${row.roleId} overview`);
    assert.match(markup, /data-admin-console-setup-list="true"/, `${row.roleId} setup list`);
    assert.match(markup, /Needs Setup/, `${row.roleId} setup heading`);
    assert.match(markup, /data-admin-console-health="true"/, `${row.roleId} health summary`);
    assert.match(markup, /Health Summary/, `${row.roleId} health heading`);
    assert.match(markup, /data-admin-console-quick-actions="true"/, `${row.roleId} quick actions`);
    assert.match(markup, /Quick Actions/, `${row.roleId} quick action heading`);
    assert.match(markup, /data-admin-console-recent-activity="true"/, `${row.roleId} recent activity`);
    assert.match(markup, /Recent Admin Activity/, `${row.roleId} recent activity heading`);
    assert.doesNotMatch(visibleText(markup), /Demo proof guard|live student use still needs district policy sign-off|What this role can manage or monitor/, `${row.roleId} no proof overview copy`);
    assert.doesNotMatch(markup, /data-admin-console-safety-strip="true"|data-admin-console-operating-order="true"/, `${row.roleId} old overview panels removed`);
    assert.match(markup, new RegExp(escapeRegExp(row.scope)), `${row.roleId} scope`);
    for (const section of row.visible) {
      assert.match(markup, new RegExp(`data-section="${escapeRegExp(section)}"`), `${row.roleId} nav/action should route ${section}`);
    }
    for (const section of row.hiddenAllowed) {
      assert.doesNotMatch(markup, new RegExp(`data-admin-console-quick-action="${escapeRegExp(section)}"`), `${row.roleId} hidden legacy section ${section} not in quick actions`);
    }
    for (const section of row.absent) {
      assert.doesNotMatch(markup, new RegExp(`data-admin-console-quick-action="${escapeRegExp(section)}"|data-section="${escapeRegExp(section)}"`), `${row.roleId} should hide ${section}`);
    }
  }

  const siteAdminPrograms = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=programs",
  });
  assert.match(siteAdminPrograms, /data-app-mode="admin"/);
  assert.match(siteAdminPrograms, /data-site-programs-section="true"/);
  assert.match(siteAdminPrograms, /Programs at Desert Valley High School/);

  const globalSecurity = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=security",
  });
  assert.match(globalSecurity, /data-app-mode="admin"/);
  assert.match(globalSecurity, /data-admin-console-active-section="security"/);
  assert.match(globalSecurity, /Security action map/);
  assert.match(globalSecurity, /data-security-action-map-card="users"[\s\S]*Open users/);
  assert.match(globalSecurity, /data-security-action-map-card="audit"[\s\S]*Open audit/);
});

test("workspace keeps staff admin tools out of the regular Workspace shell and supports mobile mode UI", async () => {
  const siteAdminWorkspace = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "", "", {
    url: "https://workspace.example/workspace.html?mode=workspace",
  });
  assert.match(siteAdminWorkspace, /data-app-mode="workspace"/);
  assert.match(siteAdminWorkspace, /data-experience="staff-workspace"/);
  assert.match(siteAdminWorkspace, /data-staff-workspace-today="true"/);
  assert.match(siteAdminWorkspace, /data-staff-attention-model="true"/);
  assert.match(siteAdminWorkspace, /data-staff-attention-queue="needs-review"/);
  assert.match(siteAdminWorkspace, /Who needs attention today\?/);
  assert.match(siteAdminWorkspace, /Open Student/);
  assert.doesNotMatch(siteAdminWorkspace, /data-workspace-admin-console-handoff="true"|Need setup or access work\?/);
  assert.doesNotMatch(visibleText(siteAdminWorkspace), /Management lives in Admin Console|working profile|Role context|Demo boundary/);
  assert.doesNotMatch(siteAdminWorkspace, /workspace-admin-console-content|data-admin-section="users"|data-site-programs-section="true"/);

  const globalAdminWorkspace = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "", "", {
    url: "https://workspace.example/workspace.html?mode=workspace",
  });
  assert.match(globalAdminWorkspace, /data-app-mode="workspace"/);
  assert.match(globalAdminWorkspace, /data-staff-workspace-today="true"/);
  assert.match(globalAdminWorkspace, /data-staff-attention-model="true"/);
  assert.doesNotMatch(globalAdminWorkspace, /data-workspace-admin-console-handoff="true"/);
  assert.doesNotMatch(globalAdminWorkspace, /workspace-admin-console-content|adminDashboardTitle|data-admin-section="users"|data-site-programs-section="true"/);

  assert.match(workspaceCss, /\.workspace-mode-switch/);
  assert.match(workspaceCss, /\.workspace-admin-console-content/);
  assert.match(workspaceCss, /\.workspace-staff-attention-layout/);
  assert.match(workspaceCss, /@media \(max-width: 900px\)[\s\S]*\.workspace-mode-switch/);
  assert.match(cssMediaBlock(900), /\.workspace-staff-attention-layout[\s\S]*grid-template-columns: 1fr/);
  assert.match(workspaceCss, /@media \(max-width: 620px\)[\s\S]*\.workspace-mode-switch/);
});

test("workspace main role landings stay free of proof-dashboard copy", async () => {
  const bannedLandingCopy = /What this role can do|Your account can|Daily workspace is clear|Global Admin working profile|Security controls enforced by this role|role proof|fake pilot|hydrated dashboard|Showing 0 of 0|Need setup or access work\?|What this role can manage or monitor|Demo proof guard|Role context|Demo boundary/i;
  for (const roleId of ["student", "mentor", "viewer", "program_teacher", "administration", "site_admin", "global_admin"]) {
    const markup = await renderWorkspaceWithFetch(profileRoutesForRole(roleId));
    assert.doesNotMatch(visibleText(markup), bannedLandingCopy, `${roleId} landing avoids proof-dashboard copy`);
  }
});

test("workspace reports render accessible shared report bars with mobile fallback", async () => {
  const staffReports = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "", "", {
    url: "https://workspace.example/workspace.html?mode=workspace&section=staffReports&siteId=site-desert-valley-high",
  });
  assert.match(staffReports, /data-staff-reports="true"/);
  assert.match(staffReports, /data-staff-report-bars="true"/);
  assert.match(staffReports, /data-report-row="visible-students"[\s\S]*aria-label="Visible students:/);
  assert.match(staffReports, /data-staff-report-row="needs-review"[\s\S]*role="meter"[\s\S]*aria-valuetext=/);
  assert.match(staffReports, /Missing work\/setup/);
  assert.doesNotMatch(visibleText(staffReports), /Showing 0 of 0|No data|No rows/);

  const adminReports = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminReports&siteId=site-desert-valley-high",
  });
  assert.match(adminReports, /data-admin-reports="true"/);
  assert.match(adminReports, /data-admin-report-summary="true"/);
  assert.match(adminReports, /data-admin-report-row="roster"[\s\S]*aria-valuemax="100"[\s\S]*aria-valuetext="/);
  assert.match(adminReports, /data-admin-report-row="issues"[\s\S]*Setup\/import issues/);
  assert.match(adminReports, /data-report-bars="true"/);

  assert.match(workspaceCss, /\.workspace-report-row/);
  assert.match(cssMediaBlock(900), /\.workspace-report-row[\s\S]*grid-template-columns: 1fr/);
  assert.match(cssMediaBlock(620), /\.workspace-admin-flow\s*\{[\s\S]*grid-template-columns: 1fr/);
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
    "--surface-muted",
    "--surface-section",
    "--surface-row",
    "--surface-raised",
    "--surface-muted-quiet",
    "--border-soft",
    "--border-subtle",
    "--border-divider",
    "--text-primary",
    "--text-secondary",
    "--text-muted",
    "--action-primary",
    "--action-secondary",
    "--action-danger",
    "--action-success",
    "--action-warning",
    "--shadow-card",
    "--shadow-soft",
    "--shadow-row",
    "--space-xs",
    "--space-sm",
    "--space-md",
    "--space-lg",
    "--row-padding-y",
    "--row-padding-x",
    "--radius-card",
    "--focus-ring",
  ]) {
    assert.ok(workspaceCss.includes(token), `missing workspace token ${token}`);
  }

  assert.match(workspaceCss, /--shadow-card:\s*0 5px 16px rgba\(23, 32, 38, 0\.04\);/);
  assert.match(workspaceCss, /--shadow-soft:\s*0 2px 10px rgba\(23, 32, 38, 0\.035\);/);
  assert.match(workspaceCss, /--border-subtle:\s*rgba\(34, 48, 58, 0\.1\);/);
  assert.match(workspaceCss, /\.workspace-button,\s*\.workspace-link-button\s*\{[\s\S]*?border-color:\s*var\(--border-subtle\);/);
  assert.match(workspaceCss, /\.workspace-button-primary\s*\{[\s\S]*?background:\s*var\(--action-primary\);/);
  assert.match(workspaceCss, /\.workspace-button-secondary\s*\{[\s\S]*?background:\s*var\(--action-secondary\);/);
  assert.match(workspaceCss, /\.workspace-report-row,\s*\.workspace-admin-report-row\s*\{[\s\S]*?border-color:\s*var\(--border-subtle\);/);
  assert.match(workspaceCss, /\.workspace-metric,\s*\.workspace-metric-tile,\s*\.workspace-summary-only-metric,[\s\S]*?border-left-width:\s*3px;/);
  assert.match(workspaceCss, /\.workspace-student-row,\s*\.workspace-student-card,[\s\S]*?border-left-width:\s*3px;/);
  assert.match(workspaceCss, /\.workspace-student-row,\s*\.workspace-student-card,[\s\S]*?box-shadow:\s*var\(--shadow-row\);/);
  assert.match(workspaceCss, /\.workspace-chip,\s*\.workspace-status-pill,\s*\.workspace-story-chip,\s*\.workspace-risk-chip,\s*\.workspace-detail-tab/s);
  assert.doesNotMatch(workspaceJs, /"No data"|"No rows to summarize\."|Showing 0 of 0|Nothing to display/);

  for (const className of [
    ".workspace-read-only-banner",
    ".workspace-menu-toggle",
    ".workspace-topbar-search",
    ".workspace-product-header",
    ".workspace-product-header-main",
    ".workspace-product-eyebrow",
    ".workspace-product-title",
    ".workspace-product-subtitle",
    ".workspace-posture-chips",
    ".workspace-posture-chip",
    ".workspace-screen-orientation",
    ".workspace-screen-orientation-actions",
    ".workspace-language-guide",
    ".workspace-language-grid",
    ".workspace-language-term",
    ".workspace-action-impact-guide",
    ".workspace-action-impact-grid",
    ".workspace-action-impact-item",
    ".workspace-visibility-guide",
    ".workspace-visibility-grid",
    ".workspace-visibility-note",
    ".workspace-start-guide",
    ".workspace-start-grid",
    ".workspace-start-item",
    ".workspace-done-guide",
    ".workspace-done-grid",
    ".workspace-done-item",
    ".workspace-task-finish-checklist",
    ".workspace-task-finish-steps",
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
    ".workspace-problem-state-actions",
    ".workspace-problem-state-item",
    ".workspace-problem-state-label",
    ".workspace-problem-state-value",
    ".workspace-read-only-boundary-list",
    ".workspace-intentional-empty-state",
    ".workspace-csv-import-stepper",
    ".workspace-site-switcher",
    ".workspace-tab-short",
    ".workspace-site-context-badge",
    ".workspace-student-setup-guide",
    ".workspace-student-setup-guide-grid",
    ".workspace-student-setup-step",
    ".workspace-student-deadline-guide",
    ".workspace-student-deadline-guide-grid",
    ".workspace-student-deadline-guide-card",
    ".workspace-student-send-path",
    ".workspace-student-send-path-grid",
    ".workspace-student-send-path-card",
    ".workspace-student-phase-path",
    ".workspace-student-phase-path-list",
    ".workspace-student-phase-step",
    ".workspace-student-action-path",
    ".workspace-student-action-path-head",
    ".workspace-student-action-path-steps",
    ".workspace-student-action-step",
    ".workspace-student-presentation-plan",
    ".workspace-student-presentation-plan-grid",
    ".workspace-student-presentation-step",
    ".workspace-student-account-path",
    ".workspace-student-account-path-grid",
    ".workspace-student-account-step",
    ".workspace-student-files-review",
    ".workspace-student-files-review-grid",
    ".workspace-student-files-review-card",
    ".workspace-student-submission-status-guide",
    ".workspace-student-submission-status-grid",
    ".workspace-student-submission-status-card",
    ".workspace-student-support-map",
    ".workspace-student-support-map-card",
    ".workspace-student-mission-board",
    ".workspace-student-mission-grid",
    ".workspace-student-mission-card",
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
  assert.match(workspaceJs, /administration: "School Admin"/);
  assert.match(workspaceJs, /platform_admin: "Global Admin"/);
  assert.match(workspaceJs, /viewer: "Viewer"/);
  assert.match(workspaceJs, /"platform_admin",\s+"global_admin",\s+"admin",\s+"site_admin",\s+"administration"/);
  assert.doesNotMatch(`${workspaceHtml}\n${workspaceJs}\n${workspaceCss}`, /client_secret|refresh_token|access_token|private_key|drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|PASSWORD_PEPPER/i);
});

test("workspace uses Phase 6.6 Figma cleanup patterns in real render paths", () => {
  for (const copy of [
    "School workspace",
    "Student progress",
    "Private proof",
    "Mentor coverage",
    "Review queue",
    "Presentation readiness",
    "Staff Workspace",
    "My Capstone",
    "Capstone Project Workspace",
  ]) {
    assert.ok(workspaceJs.includes(copy), `missing product header copy ${copy}`);
  }
  assert.doesNotMatch(workspaceJs, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);

  const signInBlock = workspaceJs.match(/function renderSignIn[\s\S]*?async function signIn/)?.[0] || "";
  const appShellBlock = workspaceJs.match(/function renderAppShell[\s\S]*?function availableSections/)?.[0] || "";
  const screenGuidanceBlock = workspaceJs.match(/function renderScreenGuidance[\s\S]*?function sectionShortLabel/)?.[0] || "";
  assert.match(workspaceJs, /function renderProductHeader\(options = \{\}\)/);
  assert.match(workspaceJs, /function renderScreenOrientation\(sectionId = activeSection/);
  assert.match(workspaceJs, /function screenOrientationFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function screenOrientationActionsFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function renderScreenOrientationAction\(action, index\)/);
  assert.match(workspaceJs, /function screenLanguageTermsFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function renderScreenLanguageGuide\(sectionId = activeSection/);
  assert.match(workspaceJs, /function screenActionImpactsFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function renderScreenActionImpactGuide\(sectionId = activeSection/);
  assert.match(workspaceJs, /function screenVisibilityNotesFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function renderScreenVisibilityGuide\(sectionId = activeSection/);
  assert.match(workspaceJs, /function screenStartRequirementsFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function renderScreenStartGuide\(sectionId = activeSection/);
  assert.match(workspaceJs, /function screenDoneSignalsFor\(sectionId = "overview"/);
  assert.match(workspaceJs, /function renderScreenDoneGuide\(sectionId = activeSection/);
  assert.match(workspaceJs, /function renderScreenGuidance\(sectionId = activeSection/);
  assert.match(workspaceJs, /function renderTaskFinishChecklist\(id, title, items = \[\], options = \{\}\)/);
  assert.match(workspaceJs, /data-task-finish-checklist="\$\{escapeHtml\(id\)\}"/);
  assert.match(workspaceJs, /function studentPrimaryActionChecklist\(action = \{\}, summary = \{\}\)/);
  assert.match(workspaceJs, /function renderWorkspaceLandingHero\(\)/);
  assert.match(workspaceJs, /function renderWorkspaceHomeInfoBox\(\)/);
  assert.match(workspaceJs, /What this workspace does/);
  assert.match(workspaceJs, /Students can see their booklet phases, add proof, send work for review, read feedback, and prepare for presentations/);
  assert.match(signInBlock, /renderWorkspaceLandingHero\(\)/);
  assert.doesNotMatch(signInBlock, /renderProductHeader\(/);
  assert.doesNotMatch(signInBlock, /Student progress|Private proof|Mentor coverage|Review queue|Presentation readiness/);
  assert.match(appShellBlock, /renderProductHeader\(\{[\s\S]*context: headerContext,[\s\S]*readOnly: roles\.has\("viewer"\)/);
  assert.match(appShellBlock, /renderScreenGuidance\(activeSection, guidancePrimaryRole, guidanceRoles, sections\)/);
  assert.match(screenGuidanceBlock, /renderScreenOrientation\(sectionId, primaryRole, roles, sections\)/);
  assert.match(screenGuidanceBlock, /renderScreenLanguageGuide\(sectionId, primaryRole, roles, sections\)/);
  assert.match(screenGuidanceBlock, /renderScreenActionImpactGuide\(sectionId, primaryRole, roles, sections\)/);
  assert.match(screenGuidanceBlock, /renderScreenVisibilityGuide\(sectionId, primaryRole, roles, sections\)/);
  assert.match(screenGuidanceBlock, /renderScreenStartGuide\(sectionId, primaryRole, roles, sections\)/);
  assert.match(screenGuidanceBlock, /renderScreenDoneGuide\(sectionId, primaryRole, roles, sections\)/);
  assert.match(appShellBlock, /renderWorkspaceStudentSearchControl\(roles\)/);
  for (const screenGuideCopy of [
    "Current screen",
    "Words on this screen",
    "plain-language terms",
    "What clicks do here",
    "click effects",
    "Who can see this",
    "visibility notes",
    "Before you start",
    "start checks",
    "How you know you're done",
    "done signals",
    "Use this for",
    "Start here",
    "Not for",
    "See what to do next, what this phase must finish, and what proof or feedback needs action.",
    "Review one submitted or revision item at a time.",
    "Create or change access only after school access is clear.",
    "Review access, roles, assignments, and recent changes while staying redacted.",
    "Suggested next clicks",
    "Before you finish",
    "Before you act on this item",
    "Before creating this account",
    "Before final-file handoff",
    "Program Teacher approval",
    "The manual review gate that decides whether submitted work is accepted or needs revision.",
    "Saved filter",
    "A ready-made view that narrows the directory to one kind of follow-up.",
    "Redacted",
    "Private details are intentionally hidden so the event can be reviewed safely.",
    "Smallest role",
    "The lowest access level that lets the person do the job.",
    "Add proof",
    "Proof links or uploads are saved to the exact checklist item you selected.",
    "Save decision",
    "The decision form records the Program Teacher outcome when your role is allowed to decide.",
    "Create or import",
    "Account creation and import forms save users, roles, and school, program, or student access.",
    "Audit filters narrow logged activity without changing the records.",
    "Proof you add is visible to you and staff who are allowed to review or support that work.",
    "Temporary setup passwords are sensitive handoffs and should only be shared through the school-approved process.",
    "Rows hide private student, proof, account, and file details until a source screen is opened with allowed access.",
    "Have the exact proof link or file ready before adding proof or sending work for review.",
    "Review proof and history before saving a Program Teacher decision.",
    "Have the setup handoff and admin note ready before creating or importing accounts.",
    "Set action, person, or record filters before investigating the log.",
    "The current phase item shows the new proof count, waiting review state, revision message, or approval status.",
    "The selected review item shows the saved Program Teacher decision or follow-up message.",
    "Current access shows the intended person, role, and school, program, cohort, or student.",
    "Filters point to the action, person, or record pattern you needed to investigate.",
    "Review submitted work",
    "Find missing mentors",
  ]) {
    assert.ok(workspaceJs.includes(screenGuideCopy), `missing screen orientation copy: ${screenGuideCopy}`);
  }
  assert.match(workspaceJs, /chips = WORKSPACE_POSTURE_CHIPS/);
  assert.match(workspaceCss, /\.workspace-auth-intro::before/);
  assert.match(workspaceCss, /\.workspace-auth-intro::after/);
  assert.match(workspaceCss, /\.workspace-home-info/);
  assert.doesNotMatch(workspaceCss, /app-hero\.jpg/);
  assert.match(workspaceJs, /function canUseSitePrograms\(roles\)\s*\{\s*return hasGlobalAdminRole\(roles\) \|\| roles\.has\("site_admin"\);\s*\}/);
  assert.match(workspaceJs, /function renderWorkspaceStudentSearchControl\(roles = roleIds\(currentUser\)\)\s*\{\s*if \(!roles\?\.size \|\| !availableSectionIds\(activeWorkspaceMode\)\.has\("students"\)\) return "";/);

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

  assert.match(workspaceJs, /function renderProblemState\(\{ reason, owner, nextAction, actions \} = \{\}\)/);
  assert.match(workspaceJs, /workspace-problem-state/);
  assert.match(workspaceJs, /Reason/);
  assert.match(workspaceJs, /Owner/);
  assert.match(workspaceJs, /Next action/);
  assert.match(workspaceJs, /function renderIntentionalEmptyState/);
  assert.match(workspaceJs, /data-intentional-empty-state/);
  assert.match(workspaceJs, /id: "needs-attention-clear"[\s\S]*Nothing urgent matches this view/);
  assert.match(workspaceJs, /id: "recent-program-activity-empty"[\s\S]*No recent program activity is visible yet/);
  assert.match(workspaceJs, /id: "recent-school-activity-empty"[\s\S]*No recent school activity is visible yet/);
  assert.match(workspaceJs, /filter\(\(action\) => !action\.section \|\| allowedSections\.has\(action\.section\)\)/);
  assert.match(workspaceCss, /\.workspace-intentional-empty-state/);
  assert.match(workspaceJs, /function renderProblemStateActions\(actions = problemStateDefaultActions\(\)\)/);
  assert.match(workspaceJs, /data-problem-state-actions="true"/);
  assert.match(workspaceJs, /problemAction: "refresh"/);
  assert.match(workspaceJs, /data-problem-action="\$\{escapeHtml\(action\.problemAction\)\}"/);
  assert.match(workspaceJs, /function handleProblemStateAction\(button\)/);
  assert.match(workspaceJs, /loadWorkspaceData\("Refreshing workspace\.\.\."\)/);
  assert.ok((workspaceJs.match(/renderProblemState\(/g) || []).length >= 5, "problem-state helper must be used by multiple real states");
  assert.match(workspaceJs, /data-workspace-state="role-pending"[\s\S]*renderProblemState\(/);
  assert.match(workspaceJs, /data-workspace-state="no-active-assignment"[\s\S]*renderProblemState\(/);
  assert.match(workspaceJs, /data-workspace-state="permission-denied"[\s\S]*renderProblemState\(/);

  assert.match(appShellBlock, /readOnly: roles\.has\("viewer"\)/);
  assert.match(workspaceJs, /data-workspace-mode="read-only"/);
  assert.match(workspaceJs, /Read-only workspace/);
  assert.doesNotMatch(workspaceJs, /\/api\/announcements|\/api\/admin\/announcements|workspace-kicker">Announcements/i);
});

test("workspace student search landing opens the Student Directory with scoped search filters", async () => {
  const viewerDirectory = siteStudentsFixture({ readOnly: true, role: "viewer" });
  const matchingStudent = viewerDirectory.students[0];
  const { context, workspaceRoot, fetchRequests, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-search-user",
          email: "viewer.search@example.edu",
          displayName: "Viewer Search",
          roles: [{ role_id: "viewer", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: true }),
    },
    "/api/site/students": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      const search = parsed.searchParams.get("search") || "";
      return {
        status: 200,
        body: siteStudentsFixture({
          readOnly: true,
          role: "viewer",
          filteredTotal: search ? 1 : viewerDirectory.pagination.filteredTotal,
          students: search ? [matchingStudent] : viewerDirectory.students,
          filters: {
            search,
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
        }),
      };
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture({ role: "viewer", readOnly: true, canReview: false }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "viewer", readOnly: true, canManage: false }),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "viewer", readOnly: true }),
    },
  });

  assert.match(workspaceRoot.innerHTML, /data-workspace-student-search="true"/);
  assert.match(workspaceRoot.innerHTML, /Find a student/);
  assert.match(workspaceRoot.innerHTML, /Uses the current Student Directory scope and permissions\./);

  await vm.runInContext('openWorkspaceStudentSearch("Missing Mentor Demo")', context);

  const lastStudentFetch = [...fetchRequests].reverse().find((request) => request.url.startsWith("/api/site/students"));
  assert.ok(lastStudentFetch, "expected a scoped Student Directory fetch after search");
  assert.match(lastStudentFetch.url, /search=Missing(?:\+|%20)Mentor(?:\+|%20)Demo/);
  assert.equal(vm.runInContext("activeSection", context), "students");
  assert.equal(new URL(window.location.href).searchParams.get("section"), "students");
  assert.equal(new URL(window.location.href).searchParams.get("search"), "Missing Mentor Demo");
  assert.match(workspaceRoot.innerHTML, /Showing student search results for &quot;Missing Mentor Demo&quot;\./);
  assert.match(workspaceRoot.innerHTML, /value="Missing Mentor Demo"/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo 001/);
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
  vm.runInContext('activeWorkspaceMode = "admin"; activeSection = "siteDashboard"; renderAppShell();', context);
  const siteDashboard = workspaceRoot.innerHTML;

  assert.match(siteDashboard, /Site Dashboard/);
  assert.match(siteDashboard, /Desert Valley High School/);
  assert.match(siteDashboard, /Desert Valley High School \/ 2025-2026/);
  assert.match(siteDashboard, /Desert Valley School District/);
  assert.match(siteDashboard, /data-app-mode="admin"/);
  assert.match(siteDashboard, /workspace-admin-console-header/);
  assert.match(siteDashboard, /data-admin-console-shell-header="compact"/);
  assert.match(siteDashboard, /Operations/);
  assert.match(siteDashboard, /Admin Console/);
  assert.match(siteDashboard, /data-admin-console-active-section="siteDashboard"/);
  assert.match(siteDashboard, /Admin Console sections/);
  assert.match(siteDashboard, /data-screen-orientation-section="siteDashboard"/);
  assert.match(siteDashboard, /Use this for/);
  assert.match(siteDashboard, /School-wide health and urgent follow-up/);
  assert.match(siteDashboard, /Use urgent tiles and first-day setup before expanding details/);
  assert.match(siteDashboard, /Do not edit records from summary-only rows/);
  assert.match(siteDashboard, /data-screen-language-guide="siteDashboard"/);
  assert.match(siteDashboard, /Words on this screen/);
  assert.match(siteDashboard, /Urgent tile/);
  assert.match(siteDashboard, /A summary tile that points to student or school follow-up needing attention\./);
  assert.match(siteDashboard, /First-day setup/);
  assert.match(siteDashboard, /data-screen-orientation-actions="true"/);
  assert.match(siteDashboard, /data-screen-orientation-action="true"[\s\S]*data-section="students" data-section-preset="missing-mentors"[\s\S]*Find missing mentors/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="submitted"[\s\S]*Review submitted work/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="archive-failed"[\s\S]*Review final-file failures/);
  assert.match(siteDashboard, /data-admin-console-active-section="siteDashboard"/);
  assert.match(siteDashboard, /mentor coverage/i);
  assert.match(siteDashboard, /data-rail-access-summary="compact"/);
  assert.match(siteDashboard, /data-active-role-badge="true"[\s\S]*data-role-identity="site_admin"/);
  assert.match(siteDashboard, /data-rail-access-summary="compact"[\s\S]*Site Admin[\s\S]*Site-scoped tools for the assigned school/);
  assert.doesNotMatch(siteDashboard, /site:site-desert-valley-high|Global scope|role scope|total in scope/);
  assert.doesNotMatch(siteDashboard, /Database-backed MVP|Cloudflare target|Audit-sensitive admin|Senior Capstone Product/);
  assert.match(siteDashboard, /workspace-site-context-badge/);
  assert.match(siteDashboard, /Default site/);
  assert.match(siteDashboard, /School access/);
  assert.match(siteDashboard, /workspace-metric-tile/);
  assert.match(siteDashboard, /Students/);
  assert.match(siteDashboard, /No Mentor/);
  assert.match(siteDashboard, /data-section="students" data-section-preset="missing-mentors">View students/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="submitted">Review/);
  assert.match(siteDashboard, /data-section="teacher" data-section-preset="revision-requested">Review/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="presentation-pending">Review/);
  assert.match(siteDashboard, /data-section="operations" data-section-preset="archive-failed">Review/);
  assert.match(siteDashboard, /data-site-admin-first-day-checklist="true"/);
  assert.match(siteDashboard, /First-day setup checklist/);
  assert.match(siteDashboard, /data-first-use-guide="site-dashboard"/);
  assert.match(siteDashboard, /Run the school workspace from this dashboard/);
  assert.match(siteDashboard, /Open the most urgent tile/);
  assert.match(siteDashboard, /Route the owner/);
  assert.match(siteDashboard, /data-site-action-map="true"/);
  assert.match(siteDashboard, /Where to start at this school/);
  assert.match(siteDashboard, /Current school: Desert Valley High School/);
  assert.match(siteDashboard, /data-site-action-map-card="setup"[\s\S]*School Admin[\s\S]*1 setup[\s\S]*Fix the first setup gap[\s\S]*Start with mentor coverage/);
  assert.match(siteDashboard, /data-site-action-map-card="mentor"[\s\S]*Site staff[\s\S]*17 missing[\s\S]*Assign mentor coverage[\s\S]*data-section="mentorAssignments" data-section-preset="no-mentor"[\s\S]*Open coverage/);
  assert.match(siteDashboard, /data-site-action-map-card="review"[\s\S]*Program Teacher[\s\S]*84 review[\s\S]*Route review work[\s\S]*data-section="teacher" data-section-preset="revision-requested"[\s\S]*Open revisions/);
  assert.match(siteDashboard, /data-site-action-map-card="proof"[\s\S]*Student \+ reviewer[\s\S]*1 risk[\s\S]*Check proof blockers[\s\S]*data-section="students" data-section-preset="high-risk-students"[\s\S]*Open high risk/);
  assert.match(siteDashboard, /data-site-action-map-card="operations"[\s\S]*Site operations[\s\S]*15 ops[\s\S]*Finish operations follow-up[\s\S]*data-section="operations" data-section-preset="archive-failed"[\s\S]*Open failures/);
  assert.match(siteDashboard, /data-site-action-map-card="all-clear"[\s\S]*School team[\s\S]*101 signals[\s\S]*Return here after the first blocker/);
  assert.match(siteDashboard, /data-section="mentorAssignments" data-section-preset="no-mentor">Assign mentors/);
  assert.match(siteDashboard, /Submitted/);
  assert.match(siteDashboard, /Needs Revision/);
  assert.match(siteDashboard, /Proof/);
  assert.match(siteDashboard, /Proof[\s\S]*Summary only/);
  assert.match(siteDashboard, /Recent Activity[\s\S]*Summary only/);
  assert.match(siteDashboard, /Presentations/);
  assert.match(siteDashboard, /Final Files/);
  assert.match(siteDashboard, /Students without active mentors/);
  assert.match(siteDashboard, /Program Teacher follow-up needed/);
  assert.match(siteDashboard, /Presentation readiness pending/);
  assert.match(siteDashboard, /Final-file exports failed/);
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
  assert.match(expandedSiteDashboard, /Act on assigned site records[\s\S]*data-section="students" data-section-preset="all-students"[\s\S]*Open student list/);
  assert.match(expandedSiteDashboard, /Program Teacher follow-up[\s\S]*data-section="teacher" data-section-preset="revision-requested"[\s\S]*Open review queue/);
  assert.match(expandedSiteDashboard, /Presentation and final-file follow-up[\s\S]*data-section="operations" data-section-preset="archive-failed"[\s\S]*Open operations/);
  assert.match(expandedSiteDashboard, /Private proof[\s\S]*Summary only/);
  assert.match(expandedSiteDashboard, /Protected access[\s\S]*Summary only/);
  assert.match(expandedSiteDashboard, /Private proof/);
  assert.match(expandedSiteDashboard, /Assigned student records/);
  assert.match(expandedSiteDashboard, /Protected access/);
  assert.match(siteDashboard, /Program Teacher follow-up/);
  assert.doesNotMatch(siteDashboard, /Teacher intervention|Dashboard access is logged for protected school records/);
  assert.match(siteDashboard, /Current site/);
  assert.doesNotMatch(siteDashboard, /<p class="workspace-kicker">Current site<\/p>/);
  assert.match(siteDashboard, /workspace-site-switcher/);
  assert.match(expandedSiteDashboard, /data-site-student-action="view-detail"/);
  assert.match(expandedSiteDashboard, /workspace-status-pill/);
  assert.match(expandedSiteDashboard, /workspace-risk-chip/);
  assert.match(expandedSiteDashboard, /Why this row is highlighted: No active mentor is assigned yet\. Revision feedback is still open\./);
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
  assert.match(viewer, /data-read-only-escalation-guide="viewer"/);
  assert.match(viewer, /When you need someone to act/);
  assert.match(viewer, /Read-only workspace/);
  assert.match(viewer, /assigned student records for context/);
  assert.match(viewer, /data-workspace-state="permission-denied"/);
  assert.match(viewer, /Access to Site Dashboard is limited/);
  assert.match(viewer, /assigned site dashboard records/);
  assert.doesNotMatch(viewer, /data-viewer-monitoring-overview="true"/);
  assert.doesNotMatch(viewer, /data-admin-action="import-users"/);
  assert.doesNotMatch(viewer, /data-mentor-assignment-form="true"/);
  assert.doesNotMatch(viewer, /data-review-decision="approved"/);
  assert.doesNotMatch(viewer, /data-archive-action/);

  const selectionRequired = await renderWorkspaceWithFetch({
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
  assert.match(selectionRequired, /data-problem-state-actions="true"/);
  assert.match(selectionRequired, /data-problem-action="refresh"[\s\S]*Refresh workspace/);
  assert.match(selectionRequired, /data-section="profile"[\s\S]*Review profile/);
  assert.match(selectionRequired, /data-section="security"[\s\S]*Open Account/);
});

test("workspace renders screen-specific plain-language term guides", async () => {
  const student = await renderWorkspaceWithFetch(profileRoutesForRole("student"), "student");
  assert.match(student, /data-experience="student"/);
  assert.match(student, /My Capstone/);
  assert.doesNotMatch(student, /data-screen-language-guide="student"/);

  const teacher = await renderWorkspaceWithFetch(profileRoutesForRole("program_teacher"), "teacher");
  assert.match(teacher, /data-screen-language-guide="teacher"/);
  assert.match(teacher, /Sent item/);
  assert.match(teacher, /An item a student sent for Program Teacher review\./);
  assert.match(teacher, /Proof history/);

  const adminUsers = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "adminUsers");
  assert.match(adminUsers, /data-screen-language-guide="adminUsers"/);
  assert.match(adminUsers, /Smallest role/);
  assert.match(adminUsers, /The lowest access level that lets the person do the job\./);
  assert.match(adminUsers, /Setup password/);

  const audit = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "audit");
  assert.match(audit, /data-screen-language-guide="audit"/);
  assert.match(audit, /Redacted/);
  assert.match(audit, /Private details are intentionally hidden so the event can be reviewed safely\./);
  assert.match(audit, /Protected record/);
});

test("workspace explains what clicks do before users act", async () => {
  const student = await renderWorkspaceWithFetch(profileRoutesForRole("student"), "student");
  assert.match(student, /data-experience="student"/);
  assert.match(student, /What do I need to do next\?/);
  assert.doesNotMatch(student, /data-screen-action-impact-guide="student"/);

  const teacher = await renderWorkspaceWithFetch(profileRoutesForRole("program_teacher"), "teacher");
  assert.match(teacher, /data-screen-action-impact-guide="teacher"/);
  assert.match(teacher, /data-action-impact="filters" data-action-impact-state="safe"/);
  assert.match(teacher, /Queue filters only change which rows are visible\./);
  assert.match(teacher, /data-action-impact="select-row" data-action-impact-state="route"/);
  assert.match(teacher, /Selecting a row opens proof, history, and the decision area for that item\./);
  assert.match(teacher, /data-action-impact="save-decision" data-action-impact-state="changes"/);

  const adminUsers = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "adminUsers");
  assert.match(adminUsers, /data-screen-action-impact-guide="adminUsers"/);
  assert.match(adminUsers, /data-action-impact="create-or-import" data-action-impact-state="changes"/);
  assert.match(adminUsers, /Account creation and import forms save users, roles, and school, program, or student access\./);
  assert.match(adminUsers, /Profile and Security clicks are safe navigation before risky account work\./);

  const audit = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "audit");
  assert.match(audit, /data-screen-action-impact-guide="audit"/);
  assert.match(audit, /data-action-impact="filters" data-action-impact-state="safe"/);
  assert.match(audit, /Audit filters narrow logged activity without changing the records\./);
  assert.match(audit, /Rows stay redacted so private notes, file links, and Drive identifiers are not exposed\./);
});

test("workspace explains who can see screen information", async () => {
  const student = await renderWorkspaceWithFetch(profileRoutesForRole("student"), "student");
  assert.match(student, /data-experience="student"/);
  assert.match(student, /Only your own project work and feedback are visible here/);
  assert.doesNotMatch(student, /data-screen-visibility-guide="student"/);

  const teacher = await renderWorkspaceWithFetch(profileRoutesForRole("program_teacher"), "teacher");
  assert.match(teacher, /data-screen-visibility-guide="teacher"/);
  assert.match(teacher, /data-visibility-note="program-teacher-reviewers" data-visibility-note-state="staff"/);
  assert.match(teacher, /Review Queue items are visible to Program Teachers and authorized school staff for the student\./);
  assert.match(teacher, /data-visibility-note="student-visible-feedback" data-visibility-note-state="shared"/);
  assert.match(teacher, /Approval and revision feedback can be read by the student after the decision is saved\./);
  assert.match(teacher, /data-visibility-note="staff-only-notes" data-visibility-note-state="private"/);

  const adminUsers = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "adminUsers");
  assert.match(adminUsers, /data-screen-visibility-guide="adminUsers"/);
  assert.match(adminUsers, /data-visibility-note="authorized-account-staff" data-visibility-note-state="staff"/);
  assert.match(adminUsers, /Users &amp; Access is for staff approved to manage accounts for the selected school or platform\./);
  assert.match(adminUsers, /data-visibility-note="setup-passwords" data-visibility-note-state="private"/);
  assert.match(adminUsers, /Temporary setup passwords are sensitive handoffs and should only be shared through the school-approved process\./);

  const audit = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "audit");
  assert.match(audit, /data-screen-visibility-guide="audit"/);
  assert.match(audit, /data-visibility-note="global-admin-only" data-visibility-note-state="staff"/);
  assert.match(audit, /Audit details are limited to global admins and authorized security review staff\./);
  assert.match(audit, /data-visibility-note="redacted-rows" data-visibility-note-state="redacted"/);
  assert.match(audit, /Rows hide private student, proof, account, and file details until a source screen is opened with allowed access\./);
});

test("workspace explains what users need before starting a screen", async () => {
  const student = await renderWorkspaceWithFetch(profileRoutesForRole("student"), "student");
  assert.match(student, /data-experience="student"/);
  assert.match(student, /Start with the next capstone action/);
  assert.doesNotMatch(student, /data-screen-start-guide="student"/);

  const teacher = await renderWorkspaceWithFetch(profileRoutesForRole("program_teacher"), "teacher");
  assert.match(teacher, /data-screen-start-guide="teacher"/);
  assert.match(teacher, /data-start-requirement="select-one-row" data-start-requirement-state="choose"/);
  assert.match(teacher, /Choose one review item before reading proof, history, or the decision area\./);
  assert.match(teacher, /data-start-requirement="proof-and-history" data-start-requirement-state="check"/);
  assert.match(teacher, /Review proof and history before saving a Program Teacher decision\./);

  const adminUsers = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "adminUsers");
  assert.match(adminUsers, /data-screen-start-guide="adminUsers"/);
  assert.match(adminUsers, /data-start-requirement="confirm-person-and-school" data-start-requirement-state="confirm"/);
  assert.match(adminUsers, /Know the exact person, school, program, cohort, or student before changing access\./);
  assert.match(adminUsers, /data-start-requirement="handoff-ready" data-start-requirement-state="prepare"/);
  assert.match(adminUsers, /Have the setup handoff and admin note ready before creating or importing accounts\./);

  const audit = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "audit");
  assert.match(audit, /data-screen-start-guide="audit"/);
  assert.match(audit, /data-start-requirement="filters-first" data-start-requirement-state="choose"/);
  assert.match(audit, /Set action, person, or record filters before investigating the log\./);
  assert.match(audit, /data-start-requirement="fix-elsewhere" data-start-requirement-state="source"/);
});

test("workspace explains how users know a screen is done", async () => {
  const student = await renderWorkspaceWithFetch(profileRoutesForRole("student"), "student");
  assert.match(student, /data-experience="student"/);
  assert.match(student, /data-student-screen="today"/);
  assert.match(student, /My Capstone/);
  assert.doesNotMatch(student, /data-screen-done-guide="student"/);

  const teacher = await renderWorkspaceWithFetch(profileRoutesForRole("program_teacher"), "teacher");
  assert.match(teacher, /data-screen-done-guide="teacher"/);
  assert.match(teacher, /data-done-signal="decision-saved" data-done-signal-state="saved"/);
  assert.match(teacher, /The selected review item shows the saved Program Teacher decision or follow-up message\./);
  assert.match(teacher, /data-done-signal="student-next-step-clear" data-done-signal-state="complete"/);
  assert.match(teacher, /Student-facing feedback is ready after the saved decision is visible in the selected item\./);

  const adminUsers = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "adminUsers");
  assert.match(adminUsers, /data-screen-done-guide="adminUsers"/);
  assert.match(adminUsers, /data-done-signal="access-row-correct" data-done-signal-state="saved"/);
  assert.match(adminUsers, /Current access shows the intended person, role, and school, program, cohort, or student\./);
  assert.match(adminUsers, /data-done-signal="handoff-recorded" data-done-signal-state="handoff"/);
  assert.match(adminUsers, /Setup handoff and admin note are ready for the school.*approved process\./);

  const audit = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "audit");
  assert.match(audit, /data-screen-done-guide="audit"/);
  assert.match(audit, /data-done-signal="pattern-identified" data-done-signal-state="complete"/);
  assert.match(audit, /Filters point to the action, person, or record pattern you needed to investigate\./);
  assert.match(audit, /data-done-signal="log-stays-redacted" data-done-signal-state="safe"/);
});

test("global admin programs section asks for site selection before managing school programs", async () => {
  const selectionRequiredBody = {
    ok: false,
    error: "site_selection_required",
    selectionRequired: true,
    accessibleSites: [
      { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
    ],
  };
  const programs = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-program-selection",
          email: "global.program.selection@example.edu",
          displayName: "Global Program Selection Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 409, body: selectionRequiredBody },
    "/api/site/programs": { status: 409, body: selectionRequiredBody },
    "/api/site/students": { status: 409, body: selectionRequiredBody },
    "/api/site/review-queue": { status: 409, body: selectionRequiredBody },
    "/api/site/mentor-assignments": { status: 409, body: selectionRequiredBody },
    "/api/site/access-assignments": { status: 409, body: selectionRequiredBody },
    "/api/site/operations-readiness": { status: 409, body: selectionRequiredBody },
    "/api/admin/role-assignments": { status: 200, body: { ok: true, assignments: [] } },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {},
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
      },
    },
    "/api/mentor/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {},
        assignedStudents: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [],
        summary: {},
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
  }, "programs");

  assert.match(programs, /data-workspace-state="site-programs-selection-required"/);
  assert.match(programs, /Select a site before managing school programs/);
  assert.match(programs, /reviewing active program mappings or saving program changes/);
  assert.match(programs, /data-site-switch-id="site-desert-valley-high"/);
  assert.match(programs, /data-site-switch-id="site-canyon-ridge-career"/);
  assert.match(programs, /Choose a site from the Current site menu/);
  assert.match(programs, /workspace-problem-state/);
  assert.match(programs, /data-problem-state-actions="true"/);
  assert.match(programs, /data-problem-action="refresh"[\s\S]*Refresh workspace/);
  assert.match(programs, /data-section="profile"[\s\S]*Review profile/);
  assert.match(programs, /data-section="security"[\s\S]*Open Security/);
  assert.doesNotMatch(programs, /Active site programs|Add program|Remove program/);
});

test("global admin site dashboard recent activity opens the existing audit section", async () => {
  const body = siteDashboardFixture({ readOnly: false });
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-site-dashboard",
          email: "global.audit@example.edu",
          displayName: "Global Admin",
          roles: [{ role_id: "platform_admin", scope_type: "global", scope_id: "*" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: {
        ...body,
        scope: {
          ...body.scope,
          role: "platform_admin",
        },
      },
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture(),
    },
    "/api/site/review-queue": {
      status: 200,
      body: siteReviewQueueFixture(),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture(),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture(),
    },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {
          recentAuditEvents: 3,
        },
        recentAudit: [
          {
            id: "audit-1",
            label: "Review updated",
            detail: "Program Teacher follow-up was saved without private notes.",
            at: "2026-05-24T16:00:00.000Z",
          },
        ],
      },
    },
    "/api/mentor/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {},
        assignedStudents: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [],
        summary: {},
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
    "/api/site/programs": {
      status: 200,
      body: siteProgramsFixture(),
    },
  });

  vm.runInContext('activeSection = "siteDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /Recent Activity[\s\S]*data-section="audit">Open audit/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "audit" } })', context);

  assert.equal(vm.runInContext("activeSection", context), "audit");
  assert.match(workspaceRoot.innerHTML, /Access Review/);
  assert.match(workspaceRoot.innerHTML, /Redacted activity list/);
});

test("global admin command center quick actions include programs and open the existing programs section", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-command-center",
          email: "global.command.center@example.edu",
          displayName: "Global Command Center Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
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
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "site_admin" }),
    },
    "/api/site/programs": {
      status: 200,
      body: siteProgramsFixture(),
    },
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [],
      },
    },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          exportsQueued: 6,
          exportsFailed: 2,
          exportsComplete: 4,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [],
        programBreakdown: siteDashboardFixture({ readOnly: false }).programBreakdown,
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
      },
    },
    "/api/mentor/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {},
        assignedStudents: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [],
        summary: {},
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
  });

  vm.runInContext('activeSection = "adminDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="dashboard:adminDashboard"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Quick Actions[\s\S]*Programs[\s\S]*Update school programs/);
  openWorkspaceDisclosure(context, "dashboard", "adminDashboard");
  assert.match(workspaceRoot.innerHTML, /Quick Actions[\s\S]*Programs[\s\S]*Update school programs/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "programs" } })', context);

  assert.equal(vm.runInContext("activeSection", context), "programs");
  assert.match(workspaceRoot.innerHTML, /data-site-programs-section="true"/);
  assert.match(workspaceRoot.innerHTML, /Programs at Desert Valley High School/);
});

test("global admin needs attention rows use real drill-downs and keep unmatched rows summary-only", async () => {
  const selectionRequired = {
    ok: false,
    error: "site_selection_required",
    selectionRequired: true,
    accessibleSites: [
      { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
    ],
  };
  const { context, workspaceRoot, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-needs-attention",
          email: "global.needs.attention@example.edu",
          displayName: "Global Admin Needs Attention",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 409, body: selectionRequired },
    "/api/site/students": { status: 409, body: selectionRequired },
    "/api/site/review-queue": { status: 409, body: selectionRequired },
    "/api/site/mentor-assignments": { status: 409, body: selectionRequired },
    "/api/site/operations-readiness": { status: 409, body: selectionRequired },
    "/api/site/programs": { status: 409, body: selectionRequired },
    "/api/site/access-assignments": { status: 409, body: selectionRequired },
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [],
      },
    },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          presentationOutlinePending: 2,
          exportsQueued: 6,
          exportsFailed: 2,
          exportsComplete: 4,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [
          {
            type: "mentor_coverage",
            label: "Students without mentors",
            detail: "18 active student record(s) need mentor coverage.",
            severity: "urgent",
            actionSection: "students",
            actionPreset: "missing-mentors",
            actionLabel: "Open student list",
          },
          {
            type: "review_workload",
            label: "Revision requests open",
            detail: "10 submission(s) need a student revision loop.",
            severity: "warning",
            actionSection: "teacher",
            actionPreset: "revision-requested",
            actionLabel: "Open review queue",
          },
          {
            type: "mentor_meetings",
            label: "Mentor meeting follow-up",
            detail: "3 meeting record(s) need attention.",
            severity: "warning",
            actionSection: "students",
            actionPreset: "mentor-meeting-follow-up-students",
            actionLabel: "Open student list",
          },
          {
            type: "archive_exports",
            label: "Final-file exports failed",
            detail: "2 export(s) need review before handoff.",
            severity: "urgent",
            actionSection: "archiveExports",
            actionPreset: "failed-exports",
            actionLabel: "Open final files",
          },
          {
            type: "presentation_readiness",
            label: "Presentation outlines pending",
            detail: "2 presentation slot(s) still have pending outline status.",
            severity: "info",
            actionSection: "presentation",
            actionPreset: "outline-follow-up",
            actionLabel: "Open schedule",
          },
        ],
        programBreakdown: [],
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
        recentExports: [
          {
            exportId: "export-failed",
            exportType: "student_archive",
            status: "failed",
            createdAt: "2026-03-26T15:15:00.000Z",
            studentName: "Avery Archive",
            requestedBy: "Global Admin Needs Attention",
          },
          {
            exportId: "export-running",
            exportType: "student_archive",
            status: "running",
            createdAt: "2026-03-26T15:45:00.000Z",
            studentName: "Blair Archive",
            requestedBy: "Global Admin Needs Attention",
          },
          {
            exportId: "export-complete",
            exportType: "student_archive",
            status: "complete",
            createdAt: "2026-03-26T14:30:00.000Z",
            completedAt: "2026-03-26T15:05:00.000Z",
            studentName: "Casey Archive",
            requestedBy: "Global Admin Needs Attention",
          },
        ],
      },
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
            id: "slot-outline-pending-scheduled",
            studentName: "Riley Student",
            scheduledFor: "2026-03-26T16:45:00.000Z",
            durationMinutes: 15,
            location: "Room 104",
            status: "scheduled",
            outlineStatus: "pending",
            checkedOutAt: null,
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
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
  });

  vm.runInContext('activeSection = "adminDashboard"; renderAppShell();', context);
  const adminDashboard = workspaceRoot.innerHTML;
  assert.match(adminDashboard, /Students without mentors[\s\S]*data-section="students" data-section-preset="missing-mentors"[\s\S]*Open student list/);
  assert.match(adminDashboard, /Revision requests open[\s\S]*data-section="teacher" data-section-preset="revision-requested"[\s\S]*Open review queue/);
  assert.match(adminDashboard, /Presentation outlines pending[\s\S]*data-section="presentation" data-section-preset="outline-follow-up"[\s\S]*Open schedule/);
  assert.match(adminDashboard, /Mentor meeting follow-up[\s\S]*data-section="students" data-section-preset="mentor-meeting-follow-up-students"[\s\S]*Open student list/);
  assert.match(adminDashboard, /Final-file exports failed[\s\S]*data-section="archiveExports" data-section-preset="failed-exports"[\s\S]*Open final files/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "mentor-meeting-follow-up-students" } })', context);

  assert.equal(vm.runInContext("activeSection", context), "students");
  assert.equal(vm.runInContext("siteStudentFilters.progressStatus", context), "mentor_meeting_follow_up");
  assert.match(workspaceRoot.innerHTML, /data-workspace-state="student-directory-site-selection-required"/);
  assert.match(window.location.href, /section=students/);
  assert.match(window.location.href, /progressStatus=mentor_meeting_follow_up/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "presentation", sectionPreset: "outline-follow-up" } })', context);

  assert.equal(vm.runInContext("activeSection", context), "presentation");
  assert.equal(vm.runInContext("presentationSlotFilter", context), "outline_follow_up");
  assert.match(workspaceRoot.innerHTML, /data-presentation-filter="outline_follow_up"/);
  assert.match(workspaceRoot.innerHTML, /Riley Student/);
  assert.match(workspaceRoot.innerHTML, /Sam Student/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Maya Student|Jordan Student/);
  assert.match(window.location.href, /section=presentation/);
  assert.match(window.location.href, /presentationFocus=outline_follow_up/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "archiveExports", sectionPreset: "failed-exports" } })', context);

  assert.equal(vm.runInContext("activeSection", context), "archiveExports");
  assert.equal(vm.runInContext("adminArchiveExportFilter", context), "failed");
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-storage-readiness="true"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-failure-guide="failed"/);
  assert.match(workspaceRoot.innerHTML, /No inactive retry control is shown here/);
  assert.match(workspaceRoot.innerHTML, /data-task-finish-checklist="admin-final-file-handoff"/);
  assert.match(workspaceRoot.innerHTML, /Before final-file handoff/);
  assert.match(workspaceRoot.innerHTML, /Failed packages reviewed/);
  assert.match(workspaceRoot.innerHTML, /In-progress packages not promised/);
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-filter="failed" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-list="failed"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-next-action="true"[\s\S]*approved admin flow/);
  assert.match(workspaceRoot.innerHTML, /Avery Archive/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Blair Archive|Casey Archive/);
  assert.equal(new URL(window.location.href).searchParams.get("section"), "archiveExports");
  assert.equal(new URL(window.location.href).searchParams.get("adminExportFilter"), "failed");
});

test("global admin archive export URL state restores filtered package requests", async () => {
  const { context, workspaceRoot, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-export-url-state",
          email: "export.url.state@example.edu",
          displayName: "Export URL State",
          roles: [{ role_id: "global_admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 403, body: { error: "forbidden" } },
    "/api/site/students": { status: 403, body: { error: "forbidden" } },
    "/api/site/review-queue": { status: 403, body: { error: "forbidden" } },
    "/api/site/mentor-assignments": { status: 403, body: { error: "forbidden" } },
    "/api/site/programs": { status: 403, body: { error: "forbidden" } },
    "/api/site/access-assignments": { status: 403, body: { error: "forbidden" } },
    "/api/site/operations-readiness": { status: 403, body: { error: "forbidden" } },
    "/api/admin/role-assignments": { status: 200, body: { ok: true, assignments: [] } },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        generatedAt: "2026-03-26T16:00:00.000Z",
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          exportsQueued: 1,
          exportsRunning: 1,
          exportsFailed: 1,
          exportsComplete: 1,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
        recentExports: [
          {
            exportId: "export-failed-1",
            exportType: "student_archive",
            status: "failed",
            createdAt: "2026-03-26T15:30:00.000Z",
            studentName: "Avery Archive",
            requestedBy: "Global Admin",
          },
          {
            exportId: "export-running-1",
            exportType: "student_archive",
            status: "running",
            createdAt: "2026-03-26T15:10:00.000Z",
            studentName: "Blair Archive",
            requestedBy: "Global Admin",
          },
          {
            exportId: "export-complete-1",
            exportType: "student_archive",
            status: "complete",
            createdAt: "2026-03-26T14:55:00.000Z",
            completedAt: "2026-03-26T15:05:00.000Z",
            studentName: "Casey Archive",
            requestedBy: "Global Admin",
          },
        ],
      },
    },
    "/api/admin/audit-events": { status: 200, body: { ok: true, events: [] } },
    "/api/presentation-slots": { status: 200, body: { ok: true, slots: [] } },
    "/api/reports/readiness": { status: 200, body: { ok: true, scope: "all-programs", metrics: {} } },
  }, {
    url: "https://workspace.example/workspace.html?section=archiveExports&adminExportFilter=failed&unknown=keep",
  });

  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-filter="failed" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-list="failed"/);
  assert.match(workspaceRoot.innerHTML, /Avery Archive/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Blair Archive|Casey Archive/);

  vm.runInContext(`
    adminArchiveExportFilter = "complete";
    activeSection = "archiveExports";
    syncCurrentWorkspaceUrlState();
  `, context);
  const syncedArchiveUrl = new URL(window.location.href);
  assert.equal(syncedArchiveUrl.searchParams.get("section"), "archiveExports");
  assert.equal(syncedArchiveUrl.searchParams.get("adminExportFilter"), "complete");
  assert.equal(syncedArchiveUrl.searchParams.get("unknown"), "keep");

  window.history.pushState({}, "", "/workspace.html?section=archiveExports&adminExportFilter=in_progress&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  for (let index = 0; index < 2; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(vm.runInContext("adminArchiveExportFilter", context), "in_progress");
  assert.match(workspaceRoot.innerHTML, /data-admin-archive-export-filter="in_progress" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Blair Archive/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Avery Archive|Casey Archive/);
});

test("global admin review workload rows open student detail and keep admin dashboard context", async () => {
  const selectionRequired = {
    ok: false,
    error: "site_selection_required",
    selectionRequired: true,
    accessibleSites: [
      { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
    ],
  };
  const { context, workspaceRoot, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-review-detail",
          email: "global.review.detail@example.edu",
          displayName: "Global Admin Review Detail",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 409, body: selectionRequired },
    "/api/site/students": { status: 409, body: selectionRequired },
    "/api/site/review-queue": { status: 409, body: selectionRequired },
    "/api/site/mentor-assignments": { status: 409, body: selectionRequired },
    "/api/site/operations-readiness": { status: 409, body: selectionRequired },
    "/api/site/programs": { status: 409, body: selectionRequired },
    "/api/site/access-assignments": { status: 409, body: selectionRequired },
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [],
      },
    },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        generatedAt: "2026-03-26T16:00:00.000Z",
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          exportsQueued: 6,
          exportsFailed: 2,
          exportsComplete: 4,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [
          {
            submissionId: "submission-admin-review-001",
            studentId: "demo-student-101",
            studentName: "Taylor Student",
            requirementTitle: "Presentation outline",
            evidenceCount: 2,
            status: "submitted",
            updatedAt: "2026-03-26T15:30:00.000Z",
          },
        ],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
        recentExports: [],
      },
    },
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: false }),
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [],
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
  });

  vm.runInContext('activeSection = "adminDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-workspace-disclosure-panel="dashboard:adminDashboard"/);
  openWorkspaceDisclosure(context, "dashboard", "adminDashboard");
  assert.match(workspaceRoot.innerHTML, /Review Workload[\s\S]*View student detail/);

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
  assert.match(workspaceRoot.innerHTML, /Back to Admin Command Center/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-return-context="adminDashboard"/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection })', context)),
    { activeSection: "adminDashboard", sourceSection: "adminDashboard" },
  );
  assert.match(window.location.href, /section=adminDashboard/);
  assert.match(window.location.href, /detailStudentId=demo-student-101/);

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "adminDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
  assert.doesNotMatch(window.location.href, /detailStudentId=/);
});

test("global admin student detail prompts for a site when no current school is selected", async () => {
  const selectionRequired = {
    ok: false,
    error: "site_selection_required",
    selectionRequired: true,
    accessibleSites: [
      { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
    ],
  };
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-detail-site-selection",
          email: "global.detail.selection@example.edu",
          displayName: "Global Detail Selection Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 409, body: selectionRequired },
    "/api/site/students": { status: 409, body: selectionRequired },
    "/api/site/review-queue": { status: 409, body: selectionRequired },
    "/api/site/mentor-assignments": { status: 409, body: selectionRequired },
    "/api/site/operations-readiness": { status: 409, body: selectionRequired },
    "/api/site/programs": { status: 409, body: selectionRequired },
    "/api/site/access-assignments": { status: 409, body: selectionRequired },
    "/api/site/students/demo-student-101": { status: 409, body: selectionRequired },
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [],
      },
    },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        generatedAt: "2026-03-26T16:00:00.000Z",
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          exportsQueued: 6,
          exportsFailed: 2,
          exportsComplete: 4,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [
          {
            submissionId: "submission-admin-review-002",
            studentId: "demo-student-101",
            studentName: "Student Needs Site Context",
            requirementTitle: "Industry partner reflection",
            evidenceCount: 2,
            status: "submitted",
            updatedAt: "2026-03-26T15:42:00.000Z",
          },
        ],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
        recentExports: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [],
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
  });

  vm.runInContext('activeSection = "adminDashboard"; renderAppShell();', context);
  openWorkspaceDisclosure(context, "dashboard", "adminDashboard");
  assert.match(workspaceRoot.innerHTML, /Review Workload[\s\S]*View student detail/);

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

  assert.ok(
    fetchLog.includes("/api/site/students/demo-student-101"),
    "expected detail request without a site id before a school is chosen",
  );
  assert.match(workspaceRoot.innerHTML, /data-student-detail-state="site-selection-required"/);
  assert.match(workspaceRoot.innerHTML, /Select a site before opening student detail/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-return-context="adminDashboard"/);
  assert.match(workspaceRoot.innerHTML, /Back to Admin Command Center/);
  assert.match(workspaceRoot.innerHTML, /data-site-switch-id="site-desert-valley-high"/);
  assert.match(workspaceRoot.innerHTML, /data-site-switch-id="site-canyon-ridge-career"/);
  assert.match(workspaceRoot.innerHTML, /Choose a site from the Current site menu/);
  assert.match(window.location.href, /section=adminDashboard/);
  assert.match(window.location.href, /detailStudentId=demo-student-101/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /This student detail is unavailable for the current school assignment/);
});

test("global admin recent audit rows open filtered audit activity", async () => {
  const selectionRequired = {
    ok: false,
    error: "site_selection_required",
    selectionRequired: true,
    accessibleSites: [
      { siteId: "site-desert-valley-high", siteName: "Desert Valley High School" },
      { siteId: "site-canyon-ridge-career", siteName: "Canyon Ridge Career Academy" },
    ],
  };
  const auditEvents = [
    {
      id: "audit-dashboard-1",
      action: "student_dashboard_viewed",
      entityType: "student_dashboard",
      createdAt: "2026-03-26T15:30:00.000Z",
      actorName: "Global Admin Audit",
    },
    {
      id: "audit-review-1",
      action: "review_queue_viewed",
      entityType: "review_queue",
      createdAt: "2026-03-26T15:10:00.000Z",
      actorName: "Global Admin Audit",
    },
  ];
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-audit-detail",
          email: "global.audit.detail@example.edu",
          displayName: "Global Admin Audit Detail",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 409, body: selectionRequired },
    "/api/site/students": { status: 409, body: selectionRequired },
    "/api/site/review-queue": { status: 409, body: selectionRequired },
    "/api/site/mentor-assignments": { status: 409, body: selectionRequired },
    "/api/site/operations-readiness": { status: 409, body: selectionRequired },
    "/api/site/programs": { status: 409, body: selectionRequired },
    "/api/site/access-assignments": { status: 409, body: selectionRequired },
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [],
      },
    },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        generatedAt: "2026-03-26T16:00:00.000Z",
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          exportsQueued: 6,
          exportsFailed: 2,
          exportsComplete: 4,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [
          {
            id: "audit-summary-1",
            action: "student_dashboard_viewed",
            entityType: "student_dashboard",
            createdAt: "2026-03-26T15:30:00.000Z",
            actorDisplayName: "Global Admin Audit",
          },
        ],
        recentExports: [],
      },
    },
    "/api/admin/audit-events": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      const action = parsed.searchParams.get("action") || "";
      const entityType = parsed.searchParams.get("entityType") || "";
      const filteredEvents = auditEvents.filter((event) => {
        if (action && event.action !== action) return false;
        if (entityType && event.entityType !== entityType) return false;
        return true;
      });
      return {
        status: 200,
        body: {
          ok: true,
          events: filteredEvents,
        },
      };
    },
    "/api/presentation-slots": {
      status: 200,
      body: {
        ok: true,
        slots: [],
      },
    },
    "/api/reports/readiness": {
      status: 200,
      body: {
        ok: true,
        scope: "all-programs",
        metrics: {},
      },
    },
  });

  vm.runInContext('activeSection = "adminDashboard"; renderAppShell();', context);
  openWorkspaceDisclosure(context, "dashboard", "adminDashboard");
  assert.match(workspaceRoot.innerHTML, /Recent Audit[\s\S]*Review in audit/);
  assert.match(workspaceRoot.innerHTML, /data-section="audit" data-audit-action="student_dashboard_viewed" data-audit-entity-type="student_dashboard"/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "audit", auditAction: "student_dashboard_viewed", auditEntityType: "student_dashboard" } })', context);

  assert.equal(vm.runInContext("activeSection", context), "audit");
  const auditFetch = fetchLog.findLast((entry) => entry.startsWith("/api/admin/audit-events?"));
  assert.ok(auditFetch, "expected audit events request");
  const auditUrl = new URL(auditFetch, "https://workspace.example");
  assert.equal(auditUrl.searchParams.get("action"), "student_dashboard_viewed");
  assert.equal(auditUrl.searchParams.get("entityType"), "student_dashboard");
  assert.equal(new URL(window.location.href).searchParams.get("section"), "audit");
  assert.equal(new URL(window.location.href).searchParams.get("action"), "student_dashboard_viewed");
  assert.equal(new URL(window.location.href).searchParams.get("entityType"), "student_dashboard");
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /data-screen-orientation-section="audit"/);
  assert.match(workspaceRoot.innerHTML, /Review access, roles, assignments, and recent changes while staying redacted/);
  assert.match(workspaceRoot.innerHTML, /Open saved filters and anomaly cards first/);
  assert.match(workspaceRoot.innerHTML, /Do not expose private notes, file links, tokens, or Drive identifiers/);
  assert.match(workspaceRoot.innerHTML, /data-screen-orientation-actions="true"/);
  assert.match(workspaceRoot.innerHTML, /data-section="audit"[\s\S]*Recent activity/);
  assert.match(workspaceRoot.innerHTML, /data-section="audit" data-audit-action="student_dashboard_viewed" data-audit-entity-type="student_dashboard"[\s\S]*Student dashboard activity/);
  assert.match(workspaceRoot.innerHTML, /data-section="audit" data-audit-action="review_queue_viewed" data-audit-entity-type="review_queue"[\s\S]*Review queue activity/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-overview="true"/);
  assert.match(workspaceRoot.innerHTML, /Access Review/);
  assert.match(workspaceRoot.innerHTML, /Role Assignments/);
  assert.match(workspaceRoot.innerHTML, /Recent Changes/);
  assert.match(workspaceRoot.innerHTML, /Potential Issues/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-first-use-guide="audit"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map="true"/);
  assert.match(workspaceRoot.innerHTML, /Choose one redacted audit lane/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="recent"[\s\S]*Global admin[\s\S]*1 event[\s\S]*Start with latest changes[\s\S]*data-section="audit"[\s\S]*Show recent/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="review-decisions"[\s\S]*Program Teacher lead[\s\S]*0 decisions[\s\S]*Confirm review decisions[\s\S]*data-audit-entity-type="review"[\s\S]*Open reviews/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-saved-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-anomaly-view="true"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-anomaly-owner="true"/);
  assert.match(workspaceRoot.innerHTML, /Owner: Access admin/);
  assert.match(workspaceRoot.innerHTML, /Confirm the current school, program, or student assignment before changing access/);
  assert.match(workspaceRoot.innerHTML, /Owner: Storage admin/);
  assert.match(workspaceRoot.innerHTML, /Check storage readiness, then tell students to use the secure link fallback if needed/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-admin-security-proof="true"|Security checks that are enforced now|Audit is for triage and proof/);
  assert.match(workspaceRoot.innerHTML, /Filtered by student dashboard \/ student dashboard viewed/);
  assert.match(workspaceRoot.innerHTML, /Show recent activity/);
  assert.match(workspaceRoot.innerHTML, /student dashboard viewed/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /review queue viewed/);
});

test("global admin audit URL state restores filtered activity", async () => {
  const auditEvents = [
    {
      id: "audit-student-1",
      action: "student_dashboard_viewed",
      entityType: "student_dashboard",
      actorName: "Global Admin Audit",
      createdAt: "2026-03-26T15:30:00.000Z",
    },
    {
      id: "audit-review-1",
      action: "review_queue_viewed",
      entityType: "review_queue",
      actorName: "Program Teacher Audit",
      createdAt: "2026-03-26T14:10:00.000Z",
    },
    {
      id: "audit-blocked-file-1",
      action: "evidence_upload_blocked_signature",
      entityType: "submission",
      actorName: "Student Upload Audit",
      createdAt: "2026-03-26T13:40:00.000Z",
    },
    {
      id: "audit-blocked-link-1",
      action: "evidence_link_blocked_unsafe_url",
      entityType: "submission",
      actorName: "Student Link Audit",
      createdAt: "2026-03-26T13:30:00.000Z",
    },
  ];
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-audit-url-state",
          email: "audit.url.state@example.edu",
          displayName: "Audit URL State",
          roles: [{ role_id: "global_admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/dashboard": { status: 403, body: { error: "forbidden" } },
    "/api/site/students": { status: 403, body: { error: "forbidden" } },
    "/api/site/review-queue": { status: 403, body: { error: "forbidden" } },
    "/api/site/mentor-assignments": { status: 403, body: { error: "forbidden" } },
    "/api/site/programs": { status: 403, body: { error: "forbidden" } },
    "/api/site/access-assignments": { status: 403, body: { error: "forbidden" } },
    "/api/site/operations-readiness": { status: 403, body: { error: "forbidden" } },
    "/api/admin/role-assignments": { status: 200, body: { ok: true, assignments: [] } },
    "/api/admin/dashboard": {
      status: 200,
      body: {
        ok: true,
        generatedAt: "2026-03-26T16:00:00.000Z",
        summary: {
          studentsActive: 250,
          studentsNoMentor: 18,
          submissionsSubmitted: 22,
          revisionRequested: 10,
          presentationScheduled: 14,
          exportsQueued: 6,
          exportsFailed: 2,
          exportsComplete: 4,
          recentAuditEvents: 3,
          approved: 88,
          evidenceArtifacts: 690,
        },
        needsAttention: [],
        programBreakdown: [],
        reviewQueue: [],
        mentorCoverage: [],
        presentationSnapshot: [],
        archiveSnapshot: [],
        recentAudit: [],
        recentExports: [],
      },
    },
    "/api/admin/audit-events": ({ url }) => {
      const parsed = new URL(url, "https://workspace.example");
      const action = parsed.searchParams.get("action") || "";
      const entityType = parsed.searchParams.get("entityType") || "";
      return {
        status: 200,
        body: {
          ok: true,
          events: auditEvents.filter((event) => {
            if (action && event.action !== action) return false;
            if (entityType && event.entityType !== entityType) return false;
            return true;
          }),
        },
      };
    },
    "/api/presentation-slots": { status: 200, body: { ok: true, slots: [] } },
    "/api/reports/readiness": { status: 200, body: { ok: true, scope: "all-programs", metrics: {} } },
  }, {
    url: "https://workspace.example/workspace.html?section=audit&action=student_dashboard_viewed&entityType=student_dashboard&unknown=keep",
  });

  assert.match(workspaceRoot.innerHTML, /Filtered by student dashboard \/ student dashboard viewed/);
  assert.match(workspaceRoot.innerHTML, /student dashboard viewed/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /review queue viewed/);
  const initialAuditFetch = fetchLog.find((entry) => entry.startsWith("/api/admin/audit-events?"));
  assert.ok(initialAuditFetch, "expected filtered audit request on initial load");
  const initialAuditUrl = new URL(initialAuditFetch, "https://workspace.example");
  assert.equal(initialAuditUrl.searchParams.get("action"), "student_dashboard_viewed");
  assert.equal(initialAuditUrl.searchParams.get("entityType"), "student_dashboard");

  vm.runInContext(`
    adminAuditFilters = {
      ...defaultAdminAuditFilters(),
      action: "review_queue_viewed",
      entityType: "review_queue",
    };
    activeSection = "audit";
    syncCurrentWorkspaceUrlState();
  `, context);
  const syncedAuditUrl = new URL(window.location.href);
  assert.equal(syncedAuditUrl.searchParams.get("section"), "audit");
  assert.equal(syncedAuditUrl.searchParams.get("action"), "review_queue_viewed");
  assert.equal(syncedAuditUrl.searchParams.get("entityType"), "review_queue");
  assert.equal(syncedAuditUrl.searchParams.get("unknown"), "keep");

  window.history.pushState({}, "", "/workspace.html?section=audit&action=review_queue_viewed&entityType=review_queue&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  for (let index = 0; index < 4; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(vm.runInContext("adminAuditFilters.action", context), "review_queue_viewed");
  assert.equal(vm.runInContext("adminAuditFilters.entityType", context), "review_queue");
  assert.match(workspaceRoot.innerHTML, /Filtered by review queue \/ review queue viewed/);
  assert.match(workspaceRoot.innerHTML, /review queue viewed/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /student dashboard viewed/);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "audit", auditAction: "evidence_upload_blocked_signature", auditEntityType: "submission" } })', context);
  const blockedFileFetch = fetchLog.findLast((entry) => entry.startsWith("/api/admin/audit-events?"));
  assert.ok(blockedFileFetch, "expected blocked file audit request");
  const blockedFileUrl = new URL(blockedFileFetch, "https://workspace.example");
  assert.equal(blockedFileUrl.searchParams.get("action"), "evidence_upload_blocked_signature");
  assert.equal(blockedFileUrl.searchParams.get("entityType"), "submission");
  assert.match(workspaceRoot.innerHTML, /Filtered by submission \/ evidence upload blocked signature/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="blocked-evidence"[\s\S]*1 block[\s\S]*Review blocked evidence safely[\s\S]*data-audit-action="evidence_upload_blocked_signature"[\s\S]*data-audit-entity-type="submission"[\s\S]*aria-pressed="true"[\s\S]*Viewing/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-saved-filter="blocked-file-uploads"[\s\S]*aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /evidence upload blocked signature/i);
  assert.doesNotMatch(workspaceRoot.innerHTML, /student:secret|password-reset|drive_file_id|driveFileId/i);

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "audit" } })', context);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="recent"[\s\S]*4 events[\s\S]*Start with latest changes/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="blocked-evidence"[\s\S]*2 blocks[\s\S]*Review blocked evidence safely/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="review-decisions"[\s\S]*1 decision[\s\S]*Confirm review decisions/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="session-pressure" data-admin-audit-action-owner="Account support" data-current-filter="false"/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-action-map-card="session-pressure"[\s\S]*Account support[\s\S]*0 signals[\s\S]*Summary only/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-anomaly="blocked-evidence-attempts" data-admin-audit-anomaly-state="needs-review"/);
  assert.match(workspaceRoot.innerHTML, /Blocked evidence attempts[\s\S]*2/);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-saved-filter="blocked-proof-links"[\s\S]*evidence link blocked unsafe url/i);
  assert.match(workspaceRoot.innerHTML, /data-admin-audit-saved-filter="blocked-file-uploads"[\s\S]*evidence upload blocked signature/i);
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
  assert.match(workspaceRoot.innerHTML, /Back to Site Dashboard/);
  assert.match(workspaceRoot.innerHTML, /Return to Site Dashboard when you finish with this record\./);
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

test("site admin dashboard recent activity shows a local detail list without opening global audit", async () => {
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
  assert.match(workspaceRoot.innerHTML, /Recent Activity[\s\S]*Latest updates are listed below\./);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-section="audit"/);

  openWorkspaceDisclosure(context, "dashboard", "siteDashboard");

  assert.match(workspaceRoot.innerHTML, /Latest student updates/);
  assert.match(workspaceRoot.innerHTML, /Recent activity is summarized without sensitive private details/);
  assert.match(workspaceRoot.innerHTML, /Missing Mentor Demo/);
  assert.match(workspaceRoot.innerHTML, /Proof added/);
  assert.match(workspaceRoot.innerHTML, /data-site-student-action="view-detail" data-student-detail-id="demo-student-101"/);
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
          revisionRequested: 1,
          approved: 0,
          evidenceArtifacts: 2,
          noMentor: 1,
          meetingsMakeupRequired: 1,
          presentationsPending: 1,
        },
        needsAttention: [
          {
            type: "mentor_coverage",
            label: "Students without active mentors",
            detail: "1 student record needs mentor assignment review.",
            severity: "urgent",
            actionSection: "students",
            actionPreset: "missing-mentors",
            actionLabel: "View students",
          },
          {
            type: "teacher_review",
            label: "Submitted work needs review",
            detail: "1 student has submitted work waiting for Program Teacher review.",
            severity: "urgent",
            actionSection: "teacher",
            actionPreset: "submitted",
            actionLabel: "Open review queue",
          },
          {
            type: "missing_evidence",
            label: "Proof is missing",
            detail: "1 student does not have proof attached yet.",
            severity: "warning",
            actionSection: "students",
            actionPreset: "missing-evidence-students",
            actionLabel: "View students",
          },
          {
            type: "behind_support",
            label: "Students need support",
            detail: "1 student has risk or stale-activity signals.",
            severity: "warning",
            actionSection: "students",
            actionPreset: "behind-students",
            actionLabel: "View students",
          },
          {
            type: "revision_loop",
            label: "Revision loop active",
            detail: "1 student is waiting on revisions.",
            severity: "warning",
            actionSection: "teacher",
            actionPreset: "revision-requested",
            actionLabel: "Open review queue",
          },
          {
            type: "mentor_meeting",
            label: "Mentor meeting follow-up",
            detail: "1 scoped meeting record needs follow-up.",
            severity: "warning",
            actionSection: "students",
            actionPreset: "mentor-meeting-follow-up-students",
            actionLabel: "View students",
          },
          {
            type: "presentation",
            label: "Presentation readiness pending",
            detail: "1 scoped presentation slot needs outline readiness.",
            severity: "info",
            actionSection: "operations",
            actionPreset: "presentation-pending",
            actionLabel: "Open operations",
          },
        ],
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
  assert.match(programTeacher, /Missing Proof/);
  assert.match(programTeacher, /Needs Review/);
  assert.match(programTeacher, /Missing Mentor/);
  assert.match(programTeacher, /data-section="students" data-section-preset="all-students"/);
  assert.match(programTeacher, /data-section="students" data-section-preset="on-track-students"/);
  assert.match(programTeacher, /data-section="students" data-section-preset="behind-students"/);
  assert.match(programTeacher, /data-section="students" data-section-preset="missing-evidence-students"/);
  assert.match(programTeacher, /Students without active mentors[\s\S]*data-section="students" data-section-preset="missing-mentors"/);
  assert.match(programTeacher, /Submitted work needs review[\s\S]*data-section="teacher" data-section-preset="submitted"/);
  assert.match(programTeacher, /Proof is missing[\s\S]*data-section="students" data-section-preset="missing-evidence-students"/);
  assert.match(programTeacher, /Students need support[\s\S]*data-section="students" data-section-preset="behind-students"/);
  assert.match(programTeacher, /Revision loop active[\s\S]*data-section="teacher" data-section-preset="revision-requested"/);
  assert.match(programTeacher, /Presentation readiness pending[\s\S]*data-section="operations" data-section-preset="presentation-pending"/);
  assert.match(programTeacher, /Mentor meeting follow-up[\s\S]*data-section="students" data-section-preset="mentor-meeting-follow-up-students"/);
  assert.match(programTeacher, /data-rail-access-summary="full"[\s\S]*Program Teacher[\s\S]*Assigned program: IT[\s\S]*Review work and student support stay inside your assigned program/);
  assert.match(programTeacher, /data-workspace-disclosure-panel="dashboard:programDashboard"/);
  assert.match(programTeacher, /aria-expanded="false"/);
  assert.doesNotMatch(programTeacher, /Students by program|Assigned student list|Recent Activity|Core Concept Proposal \/ 2 proof items/);

  openWorkspaceDisclosure(context, "dashboard", "programDashboard");
  const expandedProgramTeacher = workspaceRoot.innerHTML;
  assert.match(expandedProgramTeacher, /Students by program/);
  assert.match(expandedProgramTeacher, /Assigned student list/);
  assert.match(expandedProgramTeacher, /Recent Activity/);
  assert.match(expandedProgramTeacher, /Program Student One/);
  assert.match(expandedProgramTeacher, /Core Concept Proposal \/ 2 proof items/);
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
      body: siteMentorAssignmentsFixture({ role: "program_teacher", readOnly: false, canManage: true }),
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
  assert.doesNotMatch(workspaceRoot.innerHTML, /Core Concept Proposal \/ 2 proof items/);
  openWorkspaceDisclosure(context, "dashboard", "programDashboard");
  assert.match(workspaceRoot.innerHTML, /Program Student One/);
  assert.match(workspaceRoot.innerHTML, /Core Concept Proposal \/ 2 proof items/);
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
  assert.match(siteAdmin, /Staff Workspace/);
  assert.match(siteAdmin, /Students: Site student rows/);
  assert.match(siteAdmin, /workspace-student-directory/);
  assert.match(siteAdmin, /workspace-filter-bar/);
  assert.match(siteAdmin, /workspace-directory-summary/);
  assert.match(siteAdmin, /2 of 250 students shown/);
  assert.match(siteAdmin, /250 total available/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="missing-mentors">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="submitted-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="revision-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="presentation-pending-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="archive-ready-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="archive-failed-students">View students/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="high-risk-students">View students/);
  assert.match(siteAdmin, /data-student-directory-action-map="true"/);
  assert.match(siteAdmin, /Jump directly to the roster slice that matches the next staff move/);
  assert.match(siteAdmin, /data-student-directory-action-card="all"[\s\S]*aria-pressed="true"[\s\S]*Viewing lane/);
  assert.match(siteAdmin, /data-student-directory-action-card="missing-mentor"[\s\S]*Owner: Site Admin or Program Teacher/);
  assert.match(siteAdmin, /data-student-directory-action-card="missing-evidence"[\s\S]*Owner: Student and Program Teacher/);
  assert.match(siteAdmin, /data-student-directory-action-card="review-needed"[\s\S]*data-section="students" data-section-preset="needs-review-students"/);
  assert.match(siteAdmin, /data-student-directory-action-card="high-risk"[\s\S]*Owner: School team/);
  assert.match(siteAdmin, /data-student-directory-action-card="mentor-meeting"[\s\S]*data-section="students" data-section-preset="mentor-meeting-follow-up-students"/);
  assert.match(siteAdmin, /data-student-directory-action-card="final-files-blocked"[\s\S]*Resolve export or storage blockers/);
  assert.match(siteAdmin, /data-student-directory-saved-filters="true"/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="submitted-students"[\s\S]*Needs approval/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="missing-evidence-students"[\s\S]*Evidence missing/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="mentor-meeting-follow-up-students"[\s\S]*Mentor meeting/);
  assert.match(siteAdmin, /data-section="students" data-section-preset="archive-failed-students"[\s\S]*Final files blocked/);
  assert.match(siteAdmin, /workspace-student-row/);
  assert.match(siteAdmin, /workspace-student-card/);
  assert.match(siteAdmin, /Missing Mentor Demo 001/);
  assert.match(siteAdmin, /workspace-story-chip/);
  assert.match(siteAdmin, /Missing mentor/);
  assert.match(siteAdmin, /workspace-risk-chip/);
  assert.match(siteAdmin, /No mentor/);
  assert.match(siteAdmin, /data-student-directory-row-guidance="true"/);
  assert.match(siteAdmin, /Owner: Site Admin or Program Teacher/);
  assert.match(siteAdmin, /Open Mentor Assignments and assign coverage before the next check-in/);
  assert.match(siteAdmin, /Owner: Site Admin/);
  assert.match(siteAdmin, /Open Operations final-file rows and resolve the export or storage blocker/);
  assert.match(siteAdmin, /workspace-status-pill revision_requested/);
  assert.match(siteAdmin, /Assigned records only/);
  assert.doesNotMatch(siteAdmin, /<strong>Private proof<\/strong>|Protected access/);
  assert.match(siteAdmin, /Open Student/);
  assert.match(siteAdmin, /data-site-student-action="view-detail"/);
  assert.match(siteAdmin, /data-student-detail-id="demo-student-101"/);
  assert.match(siteAdmin, /Remove student/);
  assert.match(siteAdmin, /data-site-student-remove-form="true"/);
  assert.match(siteAdmin, /data-destructive-confirmation="student-remove"/);
  assert.match(siteAdmin, /I reviewed what student removal does for this student/);
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
  assert.match(viewer, /data-read-only-boundary-list="viewer"/);
  assert.match(viewer, /You can[\s\S]*Open assigned student records/);
  assert.match(viewer, /You cannot[\s\S]*Edit records/);
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
  assert.match(filteredArchiveEmpty, /No matching final-file follow-up/);
  assert.match(filteredArchiveEmpty, /No students with final-file export follow-up match these filters/);
  assert.match(filteredArchiveEmpty, /open Operations for final-file readiness work/i);
  assert.doesNotMatch(filteredArchiveEmpty, /No student records match these filters|No students match these filters/);
});

test("student directory summary tiles apply real directory filters", async () => {
  const { context, fetchLog, window, workspaceRoot } = await createWorkspaceContextWithFetch({
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

  await vm.runInContext('openWorkspaceSection({ dataset: { section: "students", sectionPreset: "mentor-meeting-follow-up-students" } })', context);
  studentFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students?"));
  studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("progressStatus"), "mentor_meeting_follow_up");
  assert.match(window.location.href, /progressStatus=mentor_meeting_follow_up/);

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
  assert.match(workspaceRoot.innerHTML, /data-student-directory-action-card="final-files-blocked"[\s\S]*data-current-filter="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-directory-action-card="final-files-blocked"[\s\S]*aria-pressed="true"[\s\S]*Viewing lane/);
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
  assert.match(workspaceRoot.innerHTML, /data-student-detail-site="Desert Valley High School"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-program="Information Technology"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-cohort="IT 2026"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-year="2026"/);
  assert.match(workspaceRoot.innerHTML, /workspace-story-chip/);
  assert.match(workspaceRoot.innerHTML, /workspace-risk-chip/);
  assert.match(workspaceRoot.innerHTML, /Read-only viewer/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-plan="true" data-student-detail-case-read-only="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="status"[\s\S]*Revision requested/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="step"[\s\S]*proposal/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="coverage"[\s\S]*No active mentor/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="attention"[\s\S]*No mentor/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="action"[\s\S]*Use this row for context, then share the student name with authorized staff/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="access"[\s\S]*Read-only context/);
  assert.match(workspaceRoot.innerHTML, /Overview/);
  assert.match(workspaceRoot.innerHTML, /Work/);
  assert.match(workspaceRoot.innerHTML, /Feedback/);
  assert.match(workspaceRoot.innerHTML, /Evidence/);
  assert.match(workspaceRoot.innerHTML, /Timeline/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Reviews &amp; Comments|data-student-detail-tab="summary"|data-student-detail-tab="progress"/);
  assert.match(workspaceRoot.innerHTML, /Latest Feedback/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-feedback="latest"/);
  assert.match(workspaceRoot.innerHTML, /Student-visible note/);
  assert.match(workspaceRoot.innerHTML, /Use the rubric to tighten the next draft/);
  assert.match(workspaceRoot.innerHTML, /workspace-status-pill/);
  assert.match(workspaceRoot.innerHTML, /Back to Students/);
  assert.match(workspaceRoot.innerHTML, /Return to the filtered student list when you finish with this record\./);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  assert.match(workspaceRoot.innerHTML, /Offset 50 \/ Limit 50/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-review-decision|data-mentor-assignment|data-archive-retry|Request revision|Assign mentor|Archive retry|Download file|Download archive/);

  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "mentor" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="work"/);
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
  assert.match(workspaceRoot.innerHTML, /Proof added/);
  assert.match(workspaceRoot.innerHTML, /value="Revision Loop Demo"/);
  let timelineFetch = fetchLog.findLast((entry) => entry.startsWith("/api/site/students/demo-student-101/timeline?"));
  let timelineUrl = new URL(timelineFetch, "https://workspace.example");
  assert.equal(timelineUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(timelineUrl.searchParams.has("type"), false);

  await vm.runInContext('selectSiteStudentTimelineType({ currentTarget: { dataset: { studentDetailTimelineType: "review" } } })', context);
  assert.match(workspaceRoot.innerHTML, /Showing reviews/);
  assert.match(workspaceRoot.innerHTML, /Review Revision requested/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Proof added/);
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
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="work"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="presentation"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-detail-action="open-operations"|Open operations for this student/);
});

test("student detail handles missing real-data fields conservatively", async () => {
  const incompleteDetail = siteStudentDetailFixture({ readOnly: false });
  incompleteDetail.student = {
    studentId: "demo-student-101",
    displayName: "Incomplete Student",
    email: "",
    siteName: "Desert Valley High School",
    programName: "",
    cohortName: "",
    graduationYear: "",
    status: "",
    presentationStatus: "",
    archiveStatus: "",
    riskFlags: [],
    evidenceCount: null,
    reviewCount: null,
    commentCount: null,
    nextAction: "",
  };
  incompleteDetail.progress = {};
  incompleteDetail.submissions = { unexpected: "shape" };
  incompleteDetail.evidence = [];
  incompleteDetail.reviews = [{
    reviewId: "review-missing-fields",
    requirementTitle: "",
    decision: "",
    feedback: "",
    reviewerName: "",
    createdAt: "",
  }];
  incompleteDetail.comments = { unexpected: "shape" };
  incompleteDetail.mentorAssignmentHistory = { unexpected: "shape" };
  incompleteDetail.mentorMeetings = { unexpected: "shape" };
  incompleteDetail.timelinePreview = [{
    id: "timeline-missing-fields",
    type: "",
    occurredAt: "",
    title: "",
    summary: "",
    status: "",
  }];

  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-incomplete-detail",
          email: "site.admin.incomplete@example.edu",
          displayName: "Site Admin Incomplete Detail",
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
  });

  vm.runInContext(`
    siteStudentDetailState = {
      ...defaultSiteStudentDetailState(),
      studentId: "demo-student-101",
      sourceSection: "students",
      activeTab: "overview",
      result: { ok: true, status: 200, body: ${JSON.stringify(incompleteDetail)} }
    };
    activeSection = "students";
    renderAppShell();
  `, context);

  assert.match(workspaceRoot.innerHTML, /Incomplete Student/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-plan="true" data-student-detail-case-read-only="false"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="status"[\s\S]*Pending/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="step"[\s\S]*Current step not confirmed yet/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="coverage"[\s\S]*No active mentor/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-case-item="access"[\s\S]*Authorized staff context/);
  assert.match(workspaceRoot.innerHTML, /Work item total is not confirmed yet/);
  assert.match(workspaceRoot.innerHTML, /Progress percent not confirmed yet \/ Current stage not confirmed yet/);
  assert.match(workspaceRoot.innerHTML, /workspace-status-pill pending/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /0 of 0 work items done|0% complete \/ proposal|undefined|Invalid Date|\[object Object\]/);

  vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "work" } } })', context);
  assert.match(workspaceRoot.innerHTML, /No sent work is available for this student/);
  assert.match(workspaceRoot.innerHTML, /No mentor assignment history is available for this student/);
  assert.match(workspaceRoot.innerHTML, /No mentor meetings are available for this student/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /undefined|Invalid Date|\[object Object\]/);

  vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "feedback" } } })', context);
  assert.match(workspaceRoot.innerHTML, /Senior Project work/);
  assert.match(workspaceRoot.innerHTML, /Review recorded/);
  assert.match(workspaceRoot.innerHTML, /Reviewer \/ Date not recorded/);
  assert.match(workspaceRoot.innerHTML, /No student-visible or staff-only notes are available for this student/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /undefined|Invalid Date|Not set|\[object Object\]/);

  vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "evidence" } } })', context);
  assert.match(workspaceRoot.innerHTML, /No evidence records are available for this student/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /undefined|Invalid Date|\[object Object\]/);

  vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "timeline" } } })', context);
  assert.match(workspaceRoot.innerHTML, /Timeline event/);
  assert.match(workspaceRoot.innerHTML, /Timeline event recorded/);
  assert.match(workspaceRoot.innerHTML, /Timeline \/ Date not recorded/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Unknown|undefined|Invalid Date|Not set|\[object Object\]/);
});

test("staff roles can enter and exit read-only View as Student from authorized contexts", async () => {
  const roleCases = [
    { roleId: "global_admin", section: "students", studentName: "Missing Mentor Demo 001" },
    { roleId: "site_admin", section: "students", studentName: "Missing Mentor Demo 001" },
    { roleId: "administration", section: "students", studentName: "Missing Mentor Demo 001" },
    { roleId: "program_teacher", section: "teacher", studentName: "Revision Loop Demo 001" },
    { roleId: "mentor", section: "mentorDashboard", studentName: "Zoe Needs Help" },
    { roleId: "viewer", section: "students", studentName: "Missing Mentor Demo 001" },
  ];

  for (const roleCase of roleCases) {
    const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch(viewAsStudentRoutesForRole(roleCase.roleId));
    vm.runInContext(`activeSection = ${JSON.stringify(roleCase.section)}; renderAppShell();`, context);
    assert.match(
      workspaceRoot.innerHTML,
      /data-view-as-student-action="enter"[\s\S]*data-view-as-student-id="demo-student-101"[\s\S]*View as Student/,
      `${roleCase.roleId} should see a View as Student action in an authorized staff context`,
    );
    assert.match(workspaceRoot.innerHTML, /workspace-view-as-action[\s\S]*Read-only preview/);

    await enterViewAsStudentFromDataset(context, {
      studentId: "demo-student-101",
      studentName: roleCase.studentName,
      sourceSection: roleCase.section,
    });

    assertStaffPreviewActive(workspaceRoot.innerHTML, roleCase.studentName);
    assert.match(workspaceRoot.innerHTML, /data-view-as-student-banner="true" data-view-as-student-mode="safe-preview"/);
    assert.match(workspaceRoot.innerHTML, /data-view-as-student-staff-context="true"[\s\S]*Staff account:/);
    assert.match(workspaceRoot.innerHTML, /Read-only preview[\s\S]*Authorized student only[\s\S]*No student changes saved here/);
    assert.match(workspaceRoot.innerHTML, /No proof or account changes/);
    assert.doesNotMatch(workspaceRoot.innerHTML, /data-role-command-mode="student-preview"/);
    assert.match(workspaceRoot.innerHTML, /data-view-as-student-action="exit"[\s\S]*Exit student view/);
    assert.equal(vm.runInContext("activeSection", context), "student");
    assert.ok(fetchLog.includes("/api/student/dashboard?studentId=demo-student-101"));
    assert.ok(fetchLog.includes("/api/student/archive/readiness?studentId=demo-student-101"));
    const enteredUrl = new URL(window.location.href);
    assert.equal(enteredUrl.searchParams.get("section"), "student");
    assert.equal(enteredUrl.searchParams.get("viewAsStudentId"), "demo-student-101");
    assert.equal(enteredUrl.searchParams.get("viewAsReturnSection"), roleCase.section);
    vm.runInContext('activeSection = "studentWork"; renderAppShell("Previewing My Work.", "success");', context);
    assert.match(workspaceRoot.innerHTML, /data-view-as-student-proof-preview="true"/);
    assert.doesNotMatch(workspaceRoot.innerHTML, /id="workspaceEvidenceLinkForm"|id="workspaceFileUploadForm"|data-student-storage-focus/);
    assert.match(workspaceRoot.innerHTML, /data-view-as-student-submit-disabled="true"[\s\S]*Preview only/);
    if (roleCase.roleId === "viewer") {
      assert.match(workspaceRoot.innerHTML, /data-workspace-mode="read-only"/);
      assert.match(workspaceRoot.innerHTML, /Read-only workspace/);
    }

    await vm.runInContext("exitViewAsStudent()", context);
    assert.equal(vm.runInContext("activeSection", context), roleCase.section);
    const exitedUrl = new URL(window.location.href);
    assert.equal(exitedUrl.searchParams.get("section"), roleCase.section);
    assert.equal(exitedUrl.searchParams.get("viewAsStudentId"), null);
    assert.doesNotMatch(workspaceRoot.innerHTML, /Viewing as:/);
  }
});

test("View as Student refresh and deep links restore allowed students and reject unauthorized students", async () => {
  const allowed = await createWorkspaceContextWithFetch(viewAsStudentRoutesForRole("site_admin"), {
    url: "https://workspace.example/workspace.html?section=student&siteId=site-desert-valley-high&viewAsStudentId=demo-student-101&viewAsReturnSection=students&unknown=keep",
  });
  assertStaffPreviewActive(allowed.workspaceRoot.innerHTML, "Missing Mentor Demo 001");
  assert.equal(vm.runInContext("activeSection", allowed.context), "student");
  assert.ok(allowed.fetchLog.includes("/api/student/dashboard?studentId=demo-student-101"));
  const allowedUrl = new URL(allowed.window.location.href);
  assert.equal(allowedUrl.searchParams.get("viewAsStudentId"), "demo-student-101");
  assert.equal(allowedUrl.searchParams.get("unknown"), "keep");

  const denied = await createWorkspaceContextWithFetch(viewAsStudentRoutesForRole("site_admin"), {
    url: "https://workspace.example/workspace.html?section=student&siteId=site-desert-valley-high&viewAsStudentId=outside-student&viewAsReturnSection=students&unknown=keep",
  });
  assert.ok(denied.fetchLog.includes("/api/student/dashboard?studentId=outside-student"));
  const deniedSection = vm.runInContext("activeSection", denied.context);
  assert.notEqual(deniedSection, "student");
  assert.equal(vm.runInContext("availableSectionIds(activeWorkspaceMode).has(activeSection)", denied.context), true);
  assert.doesNotMatch(denied.workspaceRoot.innerHTML, /Viewing as:|data-view-as-student="active"/);
  const deniedUrl = new URL(denied.window.location.href);
  assert.equal(deniedUrl.searchParams.get("section"), deniedSection);
  assert.equal(deniedUrl.searchParams.get("viewAsStudentId"), null);
  assert.equal(deniedUrl.searchParams.get("unknown"), "keep");
});

test("student accounts do not see or activate View as Student", async () => {
  const student = await createWorkspaceContextWithFetch(profileRoutesForRole("student"), {
    url: "https://workspace.example/workspace.html?section=student&viewAsStudentId=demo-student-101&viewAsReturnSection=students&unknown=keep",
  });

  assert.equal(vm.runInContext("activeSection", student.context), "student");
  assert.doesNotMatch(student.workspaceRoot.innerHTML, /data-view-as-student-action="enter"|Viewing as:/);
  assert.match(student.workspaceRoot.innerHTML, /data-view-as-student="inactive"/);
  assert.equal(new URL(student.window.location.href).searchParams.get("viewAsStudentId"), null);

  await enterViewAsStudentFromDataset(student.context, {
    studentId: "demo-student-101",
    studentName: "Missing Mentor Demo 001",
    sourceSection: "students",
  });
  assert.equal(vm.runInContext("activeSection", student.context), "student");
  assert.doesNotMatch(student.workspaceRoot.innerHTML, /data-view-as-student="active"|Viewing as:/);
});

test("student detail reviews explain note visibility for scoped and admin readers", async () => {
  const scopedDetail = siteStudentDetailFixture({ readOnly: true });
  scopedDetail.comments = [
    {
      commentId: "comment-scoped-101",
      visibility: "scoped",
      body: "Use the rubric to tighten the next draft.",
      authorName: "Program Teacher",
      createdAt: "2026-05-20T12:10:00.000Z",
    },
  ];
  const adminDetail = siteStudentDetailFixture({ readOnly: false });
  adminDetail.comments = [
    {
      commentId: "comment-admin-student-101",
      visibility: "student_and_staff",
      body: "Share the revision checklist with the student.",
      authorName: "Program Teacher",
      createdAt: "2026-05-20T12:10:00.000Z",
    },
    {
      commentId: "comment-admin-staff-101",
      visibility: "staff_only",
      body: "Private staffing follow-up note.",
      authorName: "Site Admin",
      createdAt: "2026-05-20T11:55:00.000Z",
    },
  ];

  const scopedRoutes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-comment-scope",
          email: "viewer.comments@example.edu",
          displayName: "Viewer Comment Scope",
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
    "/api/site/students/demo-student-101": {
      status: 200,
      body: scopedDetail,
    },
  };
  const { context: scopedContext, workspaceRoot: scopedRoot } = await createWorkspaceContextWithFetch(scopedRoutes);
  vm.runInContext('activeSection = "students"; renderAppShell();', scopedContext);
  await vm.runInContext('openSiteStudentDetail("demo-student-101")', scopedContext);
  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "reviews" } } })', scopedContext);
  assert.match(scopedRoot.innerHTML, /data-student-detail-comment-visibility-summary="true"/);
  assert.match(scopedRoot.innerHTML, /Staff follow-up notes: 1/);
  assert.match(scopedRoot.innerHTML, /Staff follow-up included/);
  assert.match(scopedRoot.innerHTML, /Admin-only context hidden/);
  assert.match(scopedRoot.innerHTML, /Visible in this detail/);
  assert.match(scopedRoot.innerHTML, /Staff follow-up notes/);

  const adminRoutes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "site-admin-comments",
          email: "site.admin.comments@example.edu",
          displayName: "Site Admin Comments",
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
    "/api/site/students/demo-student-101": {
      status: 200,
      body: adminDetail,
    },
  };
  const { context: adminContext, workspaceRoot: adminRoot } = await createWorkspaceContextWithFetch(adminRoutes);
  vm.runInContext('activeSection = "students"; renderAppShell();', adminContext);
  await vm.runInContext('openSiteStudentDetail("demo-student-101")', adminContext);
  await vm.runInContext('selectSiteStudentDetailTab({ currentTarget: { dataset: { studentDetailTab: "reviews" } } })', adminContext);
  assert.match(adminRoot.innerHTML, /Student-visible notes: 1/);
  assert.match(adminRoot.innerHTML, /Staff-only notes: 1/);
  assert.match(adminRoot.innerHTML, /Student-visible and staff-only notes/);
  assert.match(adminRoot.innerHTML, /Student-visible notes can be shared with the student\./);
  assert.match(adminRoot.innerHTML, /Private staffing follow-up note\./);
  assert.match(adminRoot.innerHTML, /Staff-only/);
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
  assert.match(teacher, /data-screen-orientation-section="teacher"/);
  assert.match(teacher, /Review one submitted or revision item at a time/);
  assert.match(teacher, /Select one row, then check proof and history/);
  assert.match(teacher, /Do not approve missing proof or batch approve/);
  assert.match(teacher, /data-screen-orientation-actions="true"/);
  assert.match(teacher, /data-section="teacher" data-section-preset="submitted"[\s\S]*Needs review/);
  assert.match(teacher, /data-section="teacher" data-section-preset="revision-requested"[\s\S]*Revision follow-up/);
  assert.match(teacher, /data-section="teacher" data-section-preset="evidence-attached-review"[\s\S]*Proof attached/);
  assert.match(teacher, /Program Teacher review queue/);
  assert.match(teacher, /Submitted work, revision follow-up/);
  assert.match(teacher, /protected proof/);
  assert.match(teacher, /assigned records/);
  assert.match(teacher, /Program Teacher review/);
  assert.match(teacher, /No student messaging/);
  assert.match(teacher, /workspace-review-queue/);
  assert.match(teacher, /workspace-filter-bar/);
  assert.doesNotMatch(teacher, /Teacher intervention/);
  assert.match(teacher, /data-first-use-guide="review-queue"/);
  assert.match(teacher, /Review one submitted item at a time/);
  assert.match(teacher, /Start with decision order/);
  assert.match(teacher, /Save exactly one decision/);
  assert.match(teacher, /data-section="teacher" data-section-preset="evidence-attached-review">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="evidence-missing-review">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="high-risk">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="stale-review">Review rows/);
  assert.match(teacher, /data-section="teacher" data-section-preset="missing-mentor-review">Review rows/);
  assert.match(teacher, /data-review-decision-guide="true"/);
  assert.match(teacher, /Program Teacher decision order/);
  assert.match(teacher, /Start with proof-ready submitted work\. Approve only when the proof and history support next steps/);
  assert.match(teacher, /1<\/b> proof-ready/);
  assert.match(teacher, /0<\/b> missing proof/);
  assert.match(teacher, /1<\/b> revision follow-up/);
  assert.match(teacher, /1<\/b> high risk/);
  assert.match(teacher, /data-review-action-map="true"/);
  assert.match(teacher, /data-review-action-map-active="all"/);
  assert.match(teacher, /Where to review next/);
  assert.match(teacher, /Choose one review lane/);
  assert.match(teacher, /Use this map before scanning rows or changing filters/);
  assert.match(teacher, /data-review-action-map-card="submitted"[\s\S]*Submitted decisions[\s\S]*1 waiting[\s\S]*data-section="teacher" data-section-preset="submitted"/);
  assert.match(teacher, /data-review-action-map-card="proof-ready"[\s\S]*Proof-ready[\s\S]*1 ready[\s\S]*data-section="teacher" data-section-preset="evidence-attached-review"/);
  assert.match(teacher, /data-review-action-map-card="missing-proof"[\s\S]*Missing proof[\s\S]*0 hold[\s\S]*approval stays locked until proof appears/);
  assert.match(teacher, /data-review-action-map-card="revision"[\s\S]*Revision follow-up[\s\S]*1 open[\s\S]*data-section="teacher" data-section-preset="revision-requested"/);
  assert.match(teacher, /data-review-action-map-card="high-risk"[\s\S]*High risk[\s\S]*1 flagged[\s\S]*data-section="teacher" data-section-preset="high-risk"/);
  assert.match(teacher, /workspace-student-row is-selected/);
  assert.match(teacher, /data-review-row-state="selected"/);
  assert.match(teacher, /data-review-decision-state="decision-ready"/);
  assert.match(teacher, /workspace-status-pill submitted/);
  assert.match(teacher, /workspace-story-chip/);
  assert.match(teacher, /workspace-risk-chip/);
  assert.match(teacher, /Why this row is highlighted: Submitted work is still waiting for Program Teacher review\. Recent activity has slowed and may need staff follow-up\./);
  assert.match(teacher, /data-review-row-decision-hint="true"/);
  assert.match(teacher, /Decision needed: active proof is attached\. Review history, then approve next steps or request revision\./);
  assert.match(teacher, /Student action needed: wait for the revised submission before recording another Program Teacher decision\./);
  assert.match(teacher, /Selected row\. History and available actions are loaded on the right\./);
  assert.match(teacher, /Decision needed: active proof is attached\. Review history, then approve next steps or request revision\./);
  assert.match(teacher, /data-review-decision-readiness="true"/);
  assert.match(teacher, /Ready for a manual Program Teacher decision/);
  assert.match(teacher, /data-review-selected-summary="true"/);
  assert.match(teacher, /data-review-selected-summary-state="decision-ready"/);
  assert.match(teacher, /Selected row[\s\S]*Project proposal[\s\S]*Information Technology \/ version 2 \/ Submitted/);
  assert.match(teacher, /3<\/b> proof[\s\S]*1<\/b> reviews[\s\S]*2<\/b> comments/);
  assert.match(teacher, /One saved decision updates the student&#039;s next-step signal/);
  assert.match(teacher, /Proof[\s\S]*3 attached/);
  assert.match(teacher, /Manual gate[\s\S]*Program Teacher decision controls next steps/);
  assert.match(teacher, /data-review-proof-quality-checklist="true"/);
  assert.match(teacher, /data-review-proof-quality-state="ready"/);
  assert.match(teacher, /Correct work item[\s\S]*Project proposal is the row being reviewed/);
  assert.match(teacher, /Active proof visible[\s\S]*3 proof items are attached to this row/);
  assert.match(teacher, /History checked[\s\S]*1 prior review record is available for comparison/);
  assert.match(teacher, /Decision matches gate[\s\S]*Approval, revision, and comment-only are available; choose exactly one/);
  assert.match(teacher, /data-review-decision-checklist="true"/);
  assert.match(teacher, /Approve next steps checklist/);
  assert.match(teacher, /data-review-submission-recovery="true"/);
  assert.match(teacher, /data-review-next-step-checkpoint="true"/);
  assert.match(teacher, /Approval controls the student&#039;s next steps/);
  assert.match(teacher, /Check proof and history/);
  assert.match(teacher, /Approve next steps only when ready/);
  assert.match(teacher, /Request revision to hold the phase/);
  assert.match(teacher, /data-review-student-impact-preview="true"/);
  assert.match(teacher, /What the student sees after this decision/);
  assert.match(teacher, /Student sees approved for next steps and can continue with the next assigned item/);
  assert.match(teacher, /Student stays in this phase, sees the feedback, fixes the work, and sends a revision/);
  assert.match(teacher, /Adds context without changing the student status or approval gate/);
  assert.match(teacher, /data-review-queue-action="open-student"/);
  assert.match(teacher, /data-review-history-section="true"/);
  assert.match(teacher, /data-review-comment-visibility-summary="true"/);
  assert.match(teacher, /Student-visible comments: 1/);
  assert.match(teacher, /Staff-only comments: 1/);
  assert.match(teacher, /Only counts are shown here; Program Teacher note text stays protected/);
  assert.match(teacher, /data-review-decision="approved"/);
  assert.match(teacher, /Approve next steps/);
  assert.match(teacher, /data-review-decision="revision_requested"/);
  assert.match(teacher, /data-review-decision="comment_only"/);
  assert.match(teacher, /data-review-decision-helper="true"/);
  assert.match(teacher, /Approval opens the student&#039;s next-step signal; revision holds the current phase; comment-only adds context without changing status/);
  assert.match(teacher, /data-review-decision-rubric="true"/);
  assert.match(teacher, /data-review-comment-only-non-gating="true"/);
  assert.match(teacher, /Student-visible feedback/);
  assert.match(teacher, /<textarea name="feedback"[\s\S]*aria-describedby="reviewDecisionFeedbackHelp"/);
  assert.match(teacher, /Write the exact approval note or revision step the student should see\./);
  assert.match(teacher, /data-review-decision-storage-note="true"/);
  assert.match(teacher, /Private proof file details stay hidden/);
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
  assert.match(viewer, /Access to Program Teacher review queue is limited/);
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
  assert.match(workspaceRoot.innerHTML, /Improve scope and cite the private proof summary/);

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

test("workspace guides multi-site staff to choose a school before opening the Review Queue", async () => {
  const reviewQueue = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-review-selection",
          email: "global.review.selection@example.edu",
          displayName: "Global Review Selection",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/review-queue": {
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
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  }, "teacher");

  assert.match(reviewQueue, /data-workspace-state="review-queue-site-selection-required"/);
  assert.match(reviewQueue, /Select a site before opening the Review Queue/);
  assert.match(reviewQueue, /data-site-switch-id="site-desert-valley-high"/);
  assert.match(reviewQueue, /data-site-switch-id="site-canyon-ridge-career"/);
  assert.match(reviewQueue, /Choose a site from the Current site menu/);
  assert.match(reviewQueue, /workspace-problem-state/);
  assert.match(reviewQueue, /data-problem-state-actions="true"/);
  assert.match(reviewQueue, /data-problem-action="refresh"[\s\S]*Refresh workspace/);
  assert.match(reviewQueue, /data-section="profile"[\s\S]*Review profile/);
  assert.match(reviewQueue, /data-section="security"[\s\S]*Open Security/);
  assert.doesNotMatch(reviewQueue, /data-review-queue-filters="true"|Program Teacher decisions enabled/);
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
  assert.match(rowActions, /Open this row to load history and Program Teacher decisions\./);
  assert.match(rowActions, /Open this row to load history and follow-up context\./);
  assert.match(rowActions, /Open a submitted row to load Program Teacher decisions, or open a revision row to review history and follow-up context\./);
  assert.match(rowActions, /data-review-row-owner-action="true"/);
  assert.match(rowActions, /Owner: Program Teacher/);
  assert.match(rowActions, /Select the row, check proof and history, then record one decision/);
  assert.match(rowActions, /Owner: Student/);
  assert.match(rowActions, /Wait for a submitted revision; use history only for support context/);

  const missingProofHistory = {
    ...reviewHistoryFixture(),
    submission: {
      id: "submission-review-missing-proof",
      status: "submitted",
      version: 1,
    },
    reviews: [],
    comments: [],
  };
  const missingProofSelected = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-review-missing-proof",
          email: "teacher.review.missing.proof@example.edu",
          displayName: "Program Teacher Missing Proof",
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
        queue: [{
          submissionId: "submission-review-missing-proof",
          studentId: "demo-student-188",
          studentName: "Missing Proof Demo 001",
          siteId: "site-desert-valley-high",
          siteName: "Desert Valley High School",
          programId: "it",
          programName: "Information Technology",
          cohortId: "cohort-it-2026",
          cohortName: "IT 2026",
          requirementId: "req-missing-proof",
          requirementTitle: "Project proof",
          status: "submitted",
          version: 1,
          submittedAt: "2026-05-22T12:00:00.000Z",
          updatedAt: "2026-05-22T12:15:00.000Z",
          evidenceCount: 0,
          reviewCount: 0,
          commentCount: 0,
          storyBucket: "missing_evidence",
          riskScore: 5,
          riskFlags: ["awaiting_review", "missing_evidence"],
          nextAction: "Confirm proof before approval.",
        }],
      }),
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
      selectedSubmissionId: "submission-review-missing-proof",
      historyResult: { ok: true, status: 200, body: ${JSON.stringify(missingProofHistory)} }
    };
  `);

  assert.match(missingProofSelected, /data-review-missing-proof-hold="true"/);
  assert.match(missingProofSelected, /data-review-action-map-card="missing-proof"[\s\S]*Missing proof[\s\S]*1 hold/);
  assert.match(missingProofSelected, /data-review-selected-summary="true"/);
  assert.match(missingProofSelected, /data-review-proof-quality-checklist="true"/);
  assert.match(missingProofSelected, /data-review-proof-quality-state="blocked"/);
  assert.match(missingProofSelected, /Active proof visible[\s\S]*No active proof is attached; approval must stay locked/);
  assert.match(missingProofSelected, /Decision matches gate[\s\S]*Use revision or comment-only context until the row is submitted with proof/);
  assert.match(missingProofSelected, /data-review-approval-blocked="missing-proof"/);
  assert.match(missingProofSelected, /data-review-approval-blocked-reason="missing_evidence"/);
  assert.match(missingProofSelected, /data-review-decision-inline-proof-hold="true"/);
  assert.match(missingProofSelected, /Approval remains locked here/);
  assert.match(missingProofSelected, /Active proof is missing from this submitted work\. Use Request revision or Add comment only until proof appears/);
  assert.match(missingProofSelected, /data-review-decision="approved" disabled aria-disabled="true" data-review-decision-blocked="missing-proof"/);
  assert.match(missingProofSelected, /Approval locked: proof needed/);
  assert.match(missingProofSelected, /Choose revision or comment-only until active proof is attached/);
  assert.match(missingProofSelected, /Approval locked: active proof is missing/);
  assert.match(missingProofSelected, /data-review-decision="revision_requested"/);
  assert.match(missingProofSelected, /data-review-decision="comment_only"/);

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
  assert.match(revisionSelected, /No Program Teacher decision available for this row/);
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
  assert.doesNotMatch(filteredEmpty, /No review rows match|No review items match|assigned access|Program Teacher or site staff/);

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

  assert.match(evidenceMissingEmpty, /No matching proof follow-up/);
  assert.match(evidenceMissingEmpty, /No submitted or revision-requested work without attached proof matches these filters/);
  assert.match(evidenceMissingEmpty, /Clear the proof filter or check Operations Proof Missing/);
  assert.match(evidenceMissingEmpty, /data-review-queue-empty-guide="filtered"/);
  assert.match(evidenceMissingEmpty, /Filtered queue is empty/);
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
  assert.match(unfilteredEmpty, /data-review-queue-empty-guide="all-done"/);
  assert.match(unfilteredEmpty, /Queue is clear/);
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
  assert.match(workspaceRoot.innerHTML, /Proof attached/);
  assert.match(workspaceRoot.innerHTML, /proposal scope/);
  assert.match(workspaceRoot.innerHTML, /Clear filters/);
  assert.match(workspaceRoot.innerHTML, /data-review-queue-share-link="true"/);
  assert.match(workspaceRoot.innerHTML, /href="\/workspace\.html\?[^"]*section=teacher/);
  assert.match(workspaceRoot.innerHTML, /href="[^"]*siteId=site-desert-valley-high/);
  assert.match(workspaceRoot.innerHTML, /href="[^"]*submissionId=submission-review-001/);
  assert.match(workspaceRoot.innerHTML, /href="[^"]*evidenceStatus=attached/);
  assert.ok(fetchLog.includes("/api/reviews/submission-review-001/history?siteId=site-desert-valley-high"));
  assert.match(workspaceRoot.innerHTML, /data-review-selected-submission="submission-review-001"/);
  assert.match(workspaceRoot.innerHTML, /Improve scope and cite the private proof summary/);

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
        latestSubmissionUpdatedAt: "2026-05-28T18:00:00.000Z",
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
    "/api/site/students/demo-student-101": {
      status: 200,
      body: siteStudentDetailFixture({ readOnly: true }),
    },
  }, {
    url: "https://workspace.example/workspace.html?section=mentorDashboard&siteId=site-desert-valley-high&mentorFocus=%20meeting%20&mentorSort=newest&unknown=keep",
  });

  assert.match(workspaceRoot.innerHTML, /data-screen-guide-panel="mentorDashboard"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filter="meeting" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-sort="newest" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Zoe Needs Help/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Avery On Track/);

  vm.runInContext(`
    mentorDashboardFilter = "presentation";
    mentorDashboardSort = "meeting";
    activeSection = "mentorDashboard";
    syncMentorDashboardUrlState();
  `, context);
  const synced = new URL(window.location.href);
  assert.equal(synced.searchParams.get("section"), "mentorDashboard");
  assert.equal(synced.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(synced.searchParams.get("mentorFocus"), "presentation");
  assert.equal(synced.searchParams.get("mentorSort"), "meeting");
  assert.equal(synced.searchParams.get("unknown"), "keep");

  const dashboardFetchCount = fetchLog.filter((entry) => entry === "/api/mentor/dashboard").length;
  window.history.pushState({}, "", "/workspace.html?section=mentorDashboard&siteId=site-desert-valley-high&mentorFocus=bogus&mentorSort=bogus&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  for (let index = 0; index < 2; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(vm.runInContext("mentorDashboardFilter", context), "all");
  assert.equal(vm.runInContext("mentorDashboardSort", context), "priority");
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filter="all" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-sort="priority" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Avery On Track/);
  assert.equal(fetchLog.filter((entry) => entry === "/api/mentor/dashboard").length, dashboardFetchCount);

  await vm.runInContext('openSiteStudentDetail("demo-student-101", { sourceSection: "mentorDashboard", activeTab: "mentor" })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-panel="true"/);
  assert.match(workspaceRoot.innerHTML, /Back to Mentor Dashboard/);
  const detailUrl = new URL(window.location.href);
  assert.equal(detailUrl.searchParams.get("section"), "mentorDashboard");
  assert.equal(detailUrl.searchParams.get("mentorFocus"), null);
  assert.equal(detailUrl.searchParams.get("detailStudentId"), "demo-student-101");
  assert.equal(detailUrl.searchParams.get("detailTab"), "work");

  const dashboardFetchCountBeforeDetailPop = fetchLog.filter((entry) => entry === "/api/mentor/dashboard").length;
  window.history.pushState({}, "", "/workspace.html?section=mentorDashboard&siteId=site-desert-valley-high&mentorFocus=meeting&detailStudentId=demo-student-101&detailTab=mentor&unknown=keep");
  window.dispatchEvent({ type: "popstate" });
  for (let index = 0; index < 4; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(vm.runInContext("mentorDashboardFilter", context), "meeting");
  assert.match(workspaceRoot.innerHTML, /data-student-detail-panel="true"/);
  assert.match(workspaceRoot.innerHTML, /Mentor Coverage History/);
  assert.equal(fetchLog.filter((entry) => entry === "/api/mentor/dashboard").length, dashboardFetchCountBeforeDetailPop);
});

test("student detail URLs restore a scoped record and clear back to the current worklist", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "viewer-detail-url",
          email: "viewer.detail.url@example.edu",
          displayName: "Viewer Detail URL",
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
        filters: {
          search: "Revision Loop Demo",
          programId: "it",
          status: "revision_requested",
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
  }, {
    url: "https://workspace.example/workspace.html?section=students&siteId=site-desert-valley-high&search=%20Revision%20Loop%20Demo%20&programId=it&status=revision_requested&detailStudentId=demo-student-101&detailTab=timeline&detailTimelineType=review&unknown=keep",
  });

  const studentFetch = fetchLog.find((entry) => entry.startsWith("/api/site/students?"));
  assert.ok(studentFetch, "expected Student Directory fetch from the detail URL");
  const studentUrl = new URL(studentFetch, "https://workspace.example");
  assert.equal(studentUrl.searchParams.get("search"), "Revision Loop Demo");
  assert.equal(studentUrl.searchParams.get("programId"), "it");
  assert.equal(studentUrl.searchParams.get("status"), "revision_requested");

  assert.ok(fetchLog.includes("/api/site/students/demo-student-101?siteId=site-desert-valley-high"));
  const timelineFetch = fetchLog.find((entry) => entry.startsWith("/api/site/students/demo-student-101/timeline?"));
  assert.ok(timelineFetch, "expected student timeline fetch from the detail URL");
  const timelineUrl = new URL(timelineFetch, "https://workspace.example");
  assert.equal(timelineUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(timelineUrl.searchParams.get("type"), "review");

  assert.match(workspaceRoot.innerHTML, /data-section="students"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-panel="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-section="timeline"/);
  assert.match(workspaceRoot.innerHTML, /Showing reviews/);
  assert.match(workspaceRoot.innerHTML, /Revision Loop Demo/);
  assert.match(workspaceRoot.innerHTML, /Back to Students/);

  const openUrl = new URL(window.location.href);
  assert.equal(openUrl.searchParams.get("detailStudentId"), "demo-student-101");
  assert.equal(openUrl.searchParams.get("detailTab"), "timeline");
  assert.equal(openUrl.searchParams.get("detailTimelineType"), "review");
  assert.equal(openUrl.searchParams.get("unknown"), "keep");

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);

  const closedUrl = new URL(window.location.href);
  assert.equal(closedUrl.searchParams.get("section"), "students");
  assert.equal(closedUrl.searchParams.get("search"), "Revision Loop Demo");
  assert.equal(closedUrl.searchParams.get("programId"), "it");
  assert.equal(closedUrl.searchParams.get("status"), "revision_requested");
  assert.equal(closedUrl.searchParams.get("detailStudentId"), null);
  assert.equal(closedUrl.searchParams.get("detailTab"), null);
  assert.equal(closedUrl.searchParams.get("detailTimelineType"), null);
  assert.equal(closedUrl.searchParams.get("unknown"), "keep");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);
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
  assert.match(siteAdmin, /data-mentor-assignment-wizard="true"/);
  assert.match(siteAdmin, /Assign one student at a time/);
  assert.match(siteAdmin, /Start with[\s\S]*Missing Mentor Demo 001/);
  assert.match(siteAdmin, /Review before save/);
  assert.match(siteAdmin, /data-mentor-assignment-form="true"/);
  assert.match(siteAdmin, /Assign mentor/);
  assert.match(siteAdmin, /data-mentor-assignment-load-guidance="true"/);
  assert.match(siteAdmin, /Mentor load is shown before assignment/);
  assert.match(siteAdmin, /Mentor One \/ 8 active \/ Steady load/);
  assert.match(siteAdmin, /Mentor Two \/ 0 active \/ Available/);
  assert.match(siteAdmin, /Lightest visible mentor: Mentor Two \/ 0 active \/ Available/);
  assert.match(siteAdmin, /data-task-finish-checklist="mentor-assignment-save"/);
  assert.match(siteAdmin, /Before assigning this mentor/);
  assert.match(siteAdmin, /Student still needs coverage/);
  assert.match(siteAdmin, /Mentor load checked/);
  assert.match(siteAdmin, /Assignments stay within the current school/);
  assert.match(siteAdmin, /protected proof boundaries/);
  assert.match(siteAdmin, /assigned records/);
  assert.match(siteAdmin, /Program Teacher follow-up/);
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
  assert.match(viewer, /Access to Mentor assignments is limited/);
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
  assert.match(siteAdmin, /data-screen-orientation-section="operations"/);
  assert.match(siteAdmin, /Triage presentation, final-file, and readiness blockers/);
  assert.match(siteAdmin, /Use the ranked actions before opening longer worklists/);
  assert.match(siteAdmin, /Do not mark completion from this summary/);
  assert.match(siteAdmin, /data-screen-orientation-actions="true"/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="presentation-pending"[\s\S]*Presentation follow-up/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="archive-failed"[\s\S]*Final-file failures/);
  assert.match(siteAdmin, /data-section="operations" data-section-preset="evidence-missing"[\s\S]*Missing proof/);
  assert.match(siteAdmin, /School operations dashboard/);
  assert.match(siteAdmin, /School follow-up worklists/);
  assert.match(siteAdmin, /workspace-operations-readiness/);
  assert.match(siteAdmin, /data-operations-action-map="true"/);
  assert.match(siteAdmin, /Operations lane map/);
  assert.match(siteAdmin, /Work one operations lane first/);
  assert.match(siteAdmin, /Desert Valley High School \/ 2025-2026/);
  assert.match(siteAdmin, /data-operations-action-map-card="final-files"[\s\S]*Site Admin[\s\S]*5 failed[\s\S]*Fix failed final files first[\s\S]*data-section="operations" data-section-preset="archive-failed"[\s\S]*Open failures/);
  assert.match(siteAdmin, /data-operations-action-map-card="storage"[\s\S]*Site Admin[\s\S]*1 setup[\s\S]*Confirm storage setup[\s\S]*data-section="operations" data-section-preset="archive-provider-unavailable"[\s\S]*Open setup blockers/);
  assert.match(siteAdmin, /data-operations-action-map-card="proof"[\s\S]*Student \+ Program Teacher[\s\S]*7 missing[\s\S]*Route missing proof[\s\S]*data-section="operations" data-section-preset="evidence-missing"[\s\S]*Open proof rows/);
  assert.match(siteAdmin, /data-operations-action-map-card="presentation"[\s\S]*Program Teacher or site staff[\s\S]*16 follow-up[\s\S]*Clarify presentation readiness[\s\S]*data-section="operations" data-section-preset="presentation-attention"[\s\S]*Open presentation/);
  assert.match(siteAdmin, /data-operations-action-map-card="staff-action"[\s\S]*Assigned staff[\s\S]*15 action[\s\S]*Work ranked staff actions[\s\S]*data-section="operations" data-section-preset="needs-attention"[\s\S]*Open actions/);
  assert.match(siteAdmin, /data-operations-action-map-card="source-screens"[\s\S]*School team[\s\S]*49 signals[\s\S]*Return after the first blocker[\s\S]*data-section="operations" data-section-preset="stale-activity"[\s\S]*Open stale rows/);
  assert.match(siteAdmin, /workspace-filter-bar/);
  assert.match(siteAdmin, /data-readiness-score-card="true"/);
  assert.match(siteAdmin, /Readiness score/);
  assert.match(siteAdmin, /Stage distribution/);
  assert.match(siteAdmin, /Top blocker categories/);
  assert.match(siteAdmin, /Top next actions/);
  assert.match(siteAdmin, /Priority worklist/);
  assert.match(siteAdmin, /data-operations-compact-worklist="true"/);
  assert.match(siteAdmin, /data-operations-role-action-guide="true"/);
  assert.match(siteAdmin, /data-operations-role-guide="site-admin"/);
  assert.match(siteAdmin, /Site Admin actions/);
  assert.match(siteAdmin, /data-operations-owner="true"/);
  assert.match(siteAdmin, /data-operations-row-next-action="true"/);
  assert.match(siteAdmin, /Do this next/);
  assert.match(siteAdmin, /data-operations-ranked-actions="true"/);
  assert.match(siteAdmin, /data-operations-ranked-owner="true"/);
  assert.match(siteAdmin, /Owner: Site Admin/);
  assert.match(siteAdmin, /Open failed final-file rows, check student detail, then use the approved export flow/);
  assert.match(siteAdmin, /Owner: Student with Program Teacher follow-up/);
  assert.match(siteAdmin, /Tell the student which proof belongs with the current phase work/);
  assert.equal((siteAdmin.match(/<article class="workspace-dashboard-kpi/g) || []).length, 6);
  assert.doesNotMatch(siteAdmin, /workspace-metric-tile/);
  assert.match(siteAdmin, /Presentation ready/);
  assert.match(siteAdmin, /Presentation pending/);
  assert.match(siteAdmin, /Outline pending/);
  assert.match(siteAdmin, /Final files ready/);
  assert.match(siteAdmin, /Final files in progress/);
  assert.match(siteAdmin, /Final files failed/);
  assert.match(siteAdmin, /Storage setup needed/);
  assert.match(siteAdmin, /Needs staff action/);
  assert.match(siteAdmin, /Stale activity/);
  assert.match(siteAdmin, /Proof missing/);
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
  assert.match(siteAdmin, /Storage setup is needed before final-file packages can be prepared/);
  assert.match(siteAdmin, /Final-file export needs staff follow-up/);
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
  assert.match(siteAdmin, /final-file readiness/);
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
      body: siteMentorAssignmentsFixture({ role: "program_teacher", readOnly: false, canManage: true }),
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
  assert.match(programTeacherOperations, /data-operations-role-guide="program-teacher"/);
  assert.match(programTeacherOperations, /Program Teacher actions/);
  assert.match(programTeacherOperations, /Focus on blockers you can solve through feedback, approval, proof, and presentation guidance/);
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
  assert.match(viewer, /Access to Operations readiness is limited/);
  assert.match(viewer, /site presentation, final-file, and readiness worklists/);
  assert.doesNotMatch(viewer, /data-presentation-action|data-archive-action|<button[^>]*>\s*(?:Archive retry|Retry archive|Schedule presentation)/i);

  const administrationOperations = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-operations",
          email: "administration.operations@example.edu",
          displayName: "School Admin Operations",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ role: "administration", readOnly: false }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "administration", readOnly: false, canManage: true }),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: false }),
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
  assert.match(unfiltered, /Access to Operations readiness is limited/);
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
  assert.match(providerUnavailableEmpty, /No final-file rows waiting on storage setup match these filters for this school/);
  assert.match(providerUnavailableEmpty, /Clear filters or review final-file failures for broader closeout blockers/);

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

  assert.match(expiredDownloadEmpty, /No expired downloads match/);
  assert.match(expiredDownloadEmpty, /No final-file rows with expired download windows match these filters for this school/);
  assert.match(expiredDownloadEmpty, /Clear filters or review expiring final-file downloads for active follow-up/);

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
        latestSubmissionUpdatedAt: "2026-05-28T18:00:00.000Z",
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
        notes: "Reviewed the updated proof plan and next presentation step.",
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
    "/api/site/students/not-assigned": {
      status: 403,
      body: { error: "forbidden" },
    },
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
            notes: "Reviewed the updated proof plan and next presentation step.",
            submissionId: null,
          },
        },
      };
    },
  });

  vm.runInContext('activeSection = "mentorDashboard"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /Assigned Student Focus/);
  assert.match(workspaceRoot.innerHTML, /Needs me first/);
  assert.match(workspaceRoot.innerHTML, /data-first-use-guide="mentor-dashboard"/);
  assert.match(workspaceRoot.innerHTML, /Help the assigned student who needs you first/);
  assert.match(workspaceRoot.innerHTML, /Use the focus order/);
  assert.match(workspaceRoot.innerHTML, /Record the next check-in/);
  assert.ok(
    workspaceRoot.innerHTML.indexOf("Zoe Needs Help") < workspaceRoot.innerHTML.indexOf("Avery On Track"),
    "mentor dashboard should show attention-needed students before on-track students",
  );
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-sort-controls="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-sort="priority" aria-pressed="true"/);
  assert.match(workspaceRoot.innerHTML, /Needs me first \(2\)/);
  assert.match(workspaceRoot.innerHTML, /Revision since check-in \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Meeting due \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Presentation risk \(1\)/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-active-filter="all"/);
  assert.match(workspaceRoot.innerHTML, /Where to help next/);
  assert.match(workspaceRoot.innerHTML, /Choose one mentor action/);
  assert.match(workspaceRoot.innerHTML, /Use this map before scanning every assigned student row/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="focus"[\s\S]*Next conversation[\s\S]*Zoe Needs Help[\s\S]*Ask next: What exactly did your Program Teacher ask you to change/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="focus"[\s\S]*data-mentor-dashboard-action="open-meetings"[\s\S]*data-mentor-dashboard-student-id="demo-student-101"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="revision"[\s\S]*Revision follow-up[\s\S]*1 student[\s\S]*Compare the Program Teacher request with proof added after the last check-in/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="meeting"[\s\S]*Meeting follow-up[\s\S]*1 due[\s\S]*Focus meetings/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="presentation"[\s\S]*Presentation readiness[\s\S]*1 risk[\s\S]*Focus presentations/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="steady" data-current-filter="true"[\s\S]*Regular support[\s\S]*1 steady[\s\S]*Viewing/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-queue-guide="true"/);
  assert.match(workspaceRoot.innerHTML, /Today&#039;s mentor queue: Needs me first/);
  assert.match(workspaceRoot.innerHTML, /Start with revision follow-up, then meeting due, then presentation risk/);
  assert.match(workspaceRoot.innerHTML, /1<\/b> revision since check-in/);
  assert.match(workspaceRoot.innerHTML, /1<\/b> no recent meeting/);
  assert.match(workspaceRoot.innerHTML, /1<\/b> presentation risk/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-priority="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-queue-kind="revision"/);
  assert.match(workspaceRoot.innerHTML, /Revision changed since the last mentor check-in\. Compare the Program Teacher request with the new proof/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-collapsed-revision="true"/);
  assert.match(workspaceRoot.innerHTML, /Details include revision changes since the last mentor check-in/);
  assert.match(workspaceRoot.innerHTML, /Assigned[\s\S]*data-mentor-dashboard-action="filter"[\s\S]*data-mentor-dashboard-filter="all"[\s\S]*Show all/);
  assert.match(workspaceRoot.innerHTML, /Needs Revision[\s\S]*data-mentor-dashboard-action="filter"[\s\S]*data-mentor-dashboard-filter="revision"[\s\S]*Focus list/);
  assert.match(workspaceRoot.innerHTML, /Meetings[\s\S]*data-mentor-dashboard-action="filter"[\s\S]*data-mentor-dashboard-filter="meeting"[\s\S]*Focus list/);
  assert.match(workspaceRoot.innerHTML, /Presentations[\s\S]*data-mentor-dashboard-action="filter"[\s\S]*data-mentor-dashboard-filter="presentation"[\s\S]*Focus list/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-summary="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-compact-signals="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-no-action-today="true"/);
  assert.match(workspaceRoot.innerHTML, /No action needed today beyond regular check-ins/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-mentor-dashboard-row-detail="true"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-mentor-dashboard-activity="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-next-meeting-plan="true"/);
  assert.match(workspaceRoot.innerHTML, /Next meeting plan/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-revision-since-meeting="true"/);
  assert.match(workspaceRoot.innerHTML, /Open meeting history/);
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
  assert.match(workspaceRoot.innerHTML, /Work updated May 28/);
  assert.match(workspaceRoot.innerHTML, /Meeting activity May 27/);
  assert.match(workspaceRoot.innerHTML, /Presentation May 29/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-detail-priority="true"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-revision-followup="true"/);
  assert.match(workspaceRoot.innerHTML, /Open the student detail, compare the revision request with recent proof, and plan the next check-in/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-question="true"/);
  assert.match(workspaceRoot.innerHTML, /What exactly did your Program Teacher ask you to change/);
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
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-active-filter="presentation"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-action-map-card="presentation" data-current-filter="true"[\s\S]*Viewing/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-active-queue="presentation"/);
  assert.match(workspaceRoot.innerHTML, /Presentation risk/);
  assert.match(workspaceRoot.innerHTML, /Start with outline approval and presentation scheduling risk/);
  assert.match(workspaceRoot.innerHTML, /Zoe Needs Help/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Avery On Track/);
  assert.equal(new URL(window.location.href).searchParams.get("mentorFocus"), "presentation");

  vm.runInContext(`
    handleMentorDashboardAction({
      currentTarget: {
        dataset: {
          mentorDashboardAction: "sort",
          mentorDashboardSort: "newest"
        }
      }
    });
  `, context);

  assert.match(workspaceRoot.innerHTML, /data-mentor-dashboard-sort="newest" aria-pressed="true"/);
  assert.equal(new URL(window.location.href).searchParams.get("mentorSort"), "newest");

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
  assert.match(workspaceRoot.innerHTML, /data-student-detail-phase-approval="true"/);
  assert.match(workspaceRoot.innerHTML, /Revision required before moving on|Waiting for Program Teacher approval/);
  assert.match(workspaceRoot.innerHTML, /data-student-detail-mentor-work-context="true"/);
  assert.match(workspaceRoot.innerHTML, /Work context for the next mentor conversation/);
  assert.match(workspaceRoot.innerHTML, /Mentor Meetings/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-meeting-form="true"/);
  assert.match(workspaceRoot.innerHTML, /name="purpose"/);
  assert.match(workspaceRoot.innerHTML, /data-mentor-meeting-purpose-guide="true"/);
  assert.match(workspaceRoot.innerHTML, /Record meeting/);
  assert.match(workspaceRoot.innerHTML, /Only actively assigned mentors can record meetings for their assigned students/);
  assert.match(workspaceRoot.innerHTML, /Confirm a make-up check-in before presentation practice/);
  assert.match(workspaceRoot.innerHTML, /Linked work: Senior Project Proposal Draft \(version 3, Revision requested\)/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /submission-101/);
  assert.match(workspaceRoot.innerHTML, /Assigned Students/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify({ activeSection, sourceSection: siteStudentDetailState.sourceSection, activeTab: siteStudentDetailState.activeTab })', context)),
    { activeSection: "mentorDashboard", sourceSection: "mentorDashboard", activeTab: "work" },
  );

  await vm.runInContext(`
    FormData = class {
      get(name) {
        return {
          studentId: "demo-student-101",
          status: "held",
          notes: "Reviewed the updated proof plan and next presentation step."
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
    notes: "Reviewed the updated proof plan and next presentation step.",
  });
  assert.ok(fetchRequests.some((entry) => entry.url === "/api/mentor/meetings" && entry.method === "POST"));
  assert.match(workspaceRoot.innerHTML, /Mentor meeting recorded/);
  assert.match(workspaceRoot.innerHTML, /Reviewed the updated proof plan and next presentation step/);
  assert.match(workspaceRoot.innerHTML, /2 meetings/);

  vm.runInContext('handleSiteStudentDetailAction({ currentTarget: { dataset: { studentDetailAction: "close" } } })', context);
  assert.equal(vm.runInContext("activeSection", context), "mentorDashboard");
  assert.doesNotMatch(workspaceRoot.innerHTML, /workspace-detail-drawer/);

  await vm.runInContext('openSiteStudentDetail("not-assigned", { sourceSection: "mentorDashboard" })', context);
  assert.match(workspaceRoot.innerHTML, /data-mentor-unassigned-denial="true"/);
  assert.match(workspaceRoot.innerHTML, /This student is not assigned to your mentor account/);
  assert.match(workspaceRoot.innerHTML, /choose an assigned student/);
});

test("workspace gates student directory visibility by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const directoryRoleHelperBlock = workspaceJs.match(/function hasSiteStudentDirectoryRole[\s\S]*?function hasSiteReviewQueueRole/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteStudentDirectoryRole\(roles\)/);
  assert.match(workspaceJs, /"platform_admin",\s+"global_admin",\s+"admin",\s+"site_admin",\s+"administration",\s+"viewer",\s+"program_teacher"/);
  assert.match(availableSectionsBlock, /add\("students", "Students", "Site student rows"\)/);
  assert.match(availableSectionsBlock, /add\("students", "Students", "Program-scoped student rows"\)/);
  assert.match(availableSectionsBlock, /add\("students", "Students", "Assigned read-only student records"\)/);
  assert.match(loadWorkspaceDataBlock, /hasSiteStudentDirectoryRole\(roles\).*\/api\/site\/students/s);
  assert.doesNotMatch(directoryRoleHelperBlock, /"mentor"|"student"|"misc_admin"/);
});

test("workspace gates review queue visibility and refresh behavior by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const availableSectionsBlock = workspaceJs.match(/function availableSections[\s\S]*?function renderActiveSection/)?.[0] || "";
  const reviewRoleHelperBlock = workspaceJs.match(/function hasSiteReviewQueueRole[\s\S]*?function hasSiteMentorAssignmentRole/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteReviewQueueRole\(roles\)/);
  assert.match(reviewRoleHelperBlock, /"platform_admin",\s+"global_admin",\s+"admin",\s+"site_admin",\s+"program_teacher"/);
  assert.doesNotMatch(reviewRoleHelperBlock, /"viewer"|"administration"|"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /add\("teacher", "Reviews", "Submitted work waiting for feedback"\)/);
  assert.match(availableSectionsBlock, /add\("teacher", "Reviews", "Submitted work and follow-up"\)/);
  assert.match(loadWorkspaceDataBlock, /hasSiteReviewQueueRole\(roles\).*\/api\/site\/review-queue/s);
  assert.match(workspaceJs, /function submitReviewDecision/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "submitted"/);
  assert.match(workspaceJs, /button\.dataset\.sectionPreset === "revision-requested"/);
  assert.match(workspaceJs, /loadReviewQueueResult\("Showing submitted work ready for review\."\)/);
  assert.match(workspaceJs, /loadReviewQueueResult\(reviewDecisionSuccessMessage\(decision\)\)/);
  assert.match(workspaceJs, /Approval saved\. The student's next-step signal was updated\./);
  assert.match(workspaceJs, /Revision request saved\. The student should fix this phase before moving ahead\./);
  assert.match(workspaceJs, /Comment saved\. The student's approval status did not change\./);
  assert.match(workspaceJs, /function refreshSelectedStudentDetailAfterReview/);
  assert.match(workspaceJs, /\/api\/site\/students\/\$\{encodeURIComponent\(selected\.studentId\)\}/);
});

test("workspace gates mentor assignment visibility and refresh behavior by role", () => {
  const loadWorkspaceDataBlock = workspaceJs.match(/async function loadWorkspaceData[\s\S]*?function renderLoading/)?.[0] || "";
  const mentorRoleHelperBlock = workspaceJs.match(/function hasSiteMentorAssignmentRole[\s\S]*?function hasSiteOperationsRole/)?.[0] || "";
  const sectionOpenBlock = workspaceJs.match(/async function openWorkspaceSection[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteMentorAssignmentRole\(roles\)/);
  assert.match(mentorRoleHelperBlock, /"platform_admin",\s+"global_admin",\s+"admin",\s+"site_admin",\s+"administration",\s+"program_teacher"/);
  assert.doesNotMatch(mentorRoleHelperBlock, /"viewer"|"mentor"|"student"|"misc_admin"/);
  assert.match(workspaceJs, /add\("mentorAssignments", "Mentor Assignments", "Coverage and assignment workflow", \{ hidden: true \}\)/);
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
  const operationsRoleHelperBlock = workspaceJs.match(/function hasSiteOperationsRole[\s\S]*?function hasStaffReportsSection/)?.[0] || "";
  assert.match(workspaceJs, /function hasSiteOperationsRole\(roles\)/);
  assert.match(operationsRoleHelperBlock, /"platform_admin",\s+"global_admin",\s+"admin",\s+"site_admin",\s+"administration",\s+"program_teacher"/);
  assert.doesNotMatch(operationsRoleHelperBlock, /"viewer"|"mentor"|"student"|"misc_admin"/);
  assert.match(availableSectionsBlock, /add\("operations", "Operations", "Presentation, final files, and readiness", \{ hidden: true \}\)/);
  assert.match(workspaceJs, /add\("operations", "Operations", "Legacy readiness worklist", \{ hidden: true \}\)/);
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
  const adminConsoleSectionsBlock = workspaceJs.match(/function adminConsoleSectionsForRoles[\s\S]*?function defaultSiteStudentFilters/)?.[0] || "";
  const siteAdminConsoleBlock = workspaceJs.match(/if \(roles\.has\("site_admin"\)\) \{[\s\S]*?  \}/)?.[0] || "";
  const siteDashboardBlock = workspaceJs.match(/function renderSiteDashboardSection[\s\S]*?function renderSiteStudentDirectorySection/)?.[0] || "";
  assert.match(adminConsoleSectionsBlock, /if \(hasGlobalAdminRole\(roles\)\) \{[\s\S]*add\("audit", "Audit", "Access review and recent changes"\)/);
  assert.match(adminConsoleSectionsBlock, /if \(hasGlobalAdminRole\(roles\)\) \{[\s\S]*add\("archiveExports", "Final Files", "Legacy closeout package status", \{ hidden: true \}\)/);
  assert.doesNotMatch(siteAdminConsoleBlock, /add\("audit"/);
  assert.doesNotMatch(siteAdminConsoleBlock, /add\("archiveExports"/);
  assert.match(siteDashboardBlock, /const canOpenAudit = availableSectionIdsForAnyMode\(\)\.has\("audit"\);/);
  assert.match(siteDashboardBlock, /label: "Recent Activity"[\s\S]*value: safeNumber\(summary\.recentActivityCount\)[\s\S]*detail: canOpenAudit \? "Latest updates are listed below\. Audit destination available\." : "Latest updates are listed below\."/);
  assert.match(siteDashboardBlock, /actionHtml: canOpenAudit[\s\S]*data-section="audit">Open audit<\/button>/);
  assert.match(siteDashboardBlock, /renderDashboardCard\("Recent Activity", "Latest student updates", renderSiteRecentActivity\(dashboard\.recentActivity\)\)/);
  assert.match(workspaceJs, /function renderSummaryStrip\([\s\S]*item\.actionHtml \|\| `<span class="workspace-summary-badge">Summary only<\/span>`/);
});

test("workspace exposes a real admin site switcher and collapsible navigation", () => {
  const siteSwitcherBlock = workspaceJs.match(/function renderSiteSwitcherControl[\s\S]*?function canUseSiteSwitcher/)?.[0] || "";
  const siteSwitcherRoleBlock = workspaceJs.match(/function canUseSiteSwitcher[\s\S]*?function currentSiteWorkspaceContext/)?.[0] || "";
  assert.match(workspaceJs, /let selectedSiteId = ""/);
  assert.match(workspaceJs, /let workspaceNavCollapsed = shouldCollapseWorkspaceNavByDefault\(\)/);
  assert.match(workspaceJs, /function shouldCollapseWorkspaceNavByDefault\(\)/);
  assert.match(workspaceJs, /window\.matchMedia\("\(max-width: 900px\)"\)\.matches/);
  assert.match(workspaceJs, /id="workspaceMenuToggle"/);
  assert.match(workspaceJs, /id="workspaceRailClose"/);
  assert.match(workspaceJs, /function renderWorkspaceNavigation/);
  assert.match(workspaceJs, /data-workspace-nav-group/);
  assert.match(workspaceCss, /\.workspace-tab-group-label/);
  assert.match(workspaceJs, /aria-label="\$\{workspaceNavCollapsed \? "Open menu" : "Close menu"\}"/);
  assert.match(workspaceJs, /workspace-menu-icon/);
  assert.match(workspaceJs, /workspace-topbar-start/);
  assert.match(workspaceJs, /workspace-topbar-actions/);
  assert.match(workspaceJs, /data-nav-state="\$\{workspaceNavCollapsed \? "collapsed" : "expanded"\}"/);
  assert.match(workspaceJs, /function toggleWorkspaceMenu/);
  assert.match(workspaceJs, /function closeWorkspaceMenu/);
  assert.match(workspaceJs, /function syncWorkspaceDrawerOffset/);
  assert.match(workspaceJs, /Menu closed\./);
  assert.match(workspaceJs, /hidden aria-hidden="true"/);
  assert.match(siteSwitcherBlock, /id="workspaceSiteSelect"/);
  assert.match(workspaceJs, /data-site-switch-id/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("platform_admin"\)/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("admin"\)/);
  assert.match(siteSwitcherRoleBlock, /roles\.has\("site_admin"\)/);
  assert.doesNotMatch(siteSwitcherRoleBlock, /roles\.has\("viewer"\)|roles\.has\("student"\)|roles\.has\("mentor"\)/);
  assert.match(workspaceJs, /function siteDashboardQueryString/);
  assert.match(workspaceJs, /selectedSiteQueryValue\(\)/);
  assert.match(workspaceCss, /max-width: none/);
  assert.match(workspaceCss, /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-content[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(workspaceCss, /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-rail[\s\S]*display: none/);
});

test("workspace half-width drawer and phone drawer stay bounded and keep global admin controls reachable", async () => {
  const tablet = cssMediaBlock(900);
  const phone = cssMediaBlock(620);
  assert.match(workspaceCss, /html,\s*body\s*\{[\s\S]*max-width:\s*100%;[\s\S]*overflow-x:\s*hidden;/);
  assert.match(workspaceCss, /body\[data-page="workspace"\],[\s\S]*\.workspace-shell,[\s\S]*\.workspace-app\s*\{[\s\S]*max-width:\s*100%;[\s\S]*min-width:\s*0;/);
  assert.match(tablet, /\.workspace-rail\s*\{[\s\S]*position:\s*fixed;[\s\S]*width:\s*min\(360px,\s*calc\(100vw - 32px\)\);[\s\S]*max-width:\s*calc\(100vw - 32px\);[\s\S]*max-height:\s*calc\(100dvh - var\(--workspace-drawer-top\) - 1rem - env\(safe-area-inset-bottom\)\);[\s\S]*overflow-x:\s*hidden;[\s\S]*overflow-y:\s*auto;/);
  assert.match(tablet, /\.workspace-rail-drawer-header\s*\{[\s\S]*position:\s*sticky;[\s\S]*top:\s*0;[\s\S]*display:\s*flex;/);
  assert.match(tablet, /\.workspace-user\s*\{[\s\S]*flex-wrap:\s*wrap;[\s\S]*justify-content:\s*flex-start;/);
  assert.match(tablet, /\.workspace-user-text\s*\{[\s\S]*flex:\s*1 1 auto;[\s\S]*max-width:\s*100%;/);
  assert.match(tablet, /\.workspace-main\s*\{[\s\S]*grid-column:\s*1 \/ -1;[\s\S]*max-width:\s*100%;/);
  assert.match(phone, /\.workspace-button,[\s\S]*\.workspace-site-switcher select\s*\{[\s\S]*width:\s*100%;/);
  assert.match(workspaceJs, /data-topbar-density="compact"/);
  assert.match(workspaceJs, /function renderWorkspaceAccountMenu/);
  assert.match(workspaceJs, /function accountInitials/);
  assert.match(workspaceJs, /workspace-account-avatar/);
  assert.match(workspaceJs, /data-admin-console-shell-header="compact"/);
  assert.match(workspaceCss, /\.workspace-topbar\s*\{[\s\S]*grid-template-columns:\s*minmax\(17rem,\s*0\.72fr\) minmax\(0,\s*1\.28fr\);/);
  assert.match(workspaceCss, /\.workspace-topbar-center\s*\{[\s\S]*display:\s*flex;[\s\S]*justify-content:\s*flex-end;/);
  assert.match(workspaceCss, /\.workspace-topbar-actions\s*\{[\s\S]*position:\s*absolute;[\s\S]*display:\s*none;/);
  assert.match(workspaceCss, /\.workspace-account-menu\[open\] \.workspace-topbar-actions\s*\{[\s\S]*display:\s*grid;/);
  assert.match(tablet, /\.workspace-topbar-center\s*\{[\s\S]*flex-wrap:\s*wrap;[\s\S]*justify-content:\s*flex-start;/);
  assert.match(tablet, /\.workspace-topbar-actions\s*\{[\s\S]*position:\s*static;[\s\S]*flex:\s*1 1 100%;/);
  assert.match(phone, /\.workspace-account-summary \.workspace-user-text[\s\S]*display:\s*none;/);
  assert.match(phone, /\.workspace-active-role-badge small,[\s\S]*\.workspace-site-switcher em\s*\{[\s\S]*display:\s*none;/);
  assert.match(phone, /\.workspace-admin-setup-row\s*\{[\s\S]*grid-template-columns:\s*1fr;/);
  assert.match(phone, /\.workspace-admin-setup-row \.workspace-button\s*\{[\s\S]*width:\s*100%;/);
  assert.match(workspaceCss, /\.workspace-admin-console-content\s*\{[\s\S]*grid-template-columns:\s*minmax\(188px,\s*220px\) minmax\(0,\s*1560px\);[\s\S]*justify-content:\s*center;/);
  assert.match(workspaceCss, /\.workspace-admin-console-main\s*\{[\s\S]*max-width:\s*1560px;/);
  assert.match(workspaceCss, /\.workspace-admin-operations-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(185px,\s*1fr\)\);/);
  assert.match(workspaceCss, /\.workspace-admin-flow\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(workspaceCss, /\.workspace-screen-guide-panel\s*\{[\s\S]*overflow:\s*hidden;/);
  for (const viewportWidth of [800, 820, 390]) {
    const drawerWidth = workspaceDrawerWidthForViewport(viewportWidth);
    assert.ok(drawerWidth < viewportWidth, `drawer ${drawerWidth}px must fit inside ${viewportWidth}px viewport`);
    assert.ok(drawerWidth <= 360, "drawer must keep the 360px desktop cap");
  }
  assert.equal(adminReadableWidthForViewport(1920), 1560, "wide admin content should cap at readable width");

  const tabletContext = await createWorkspaceContextWithFetch(profileRoutesForRole("global_admin"), {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminDashboard",
    viewportWidth: 800,
    viewportHeight: 1000,
    topbarBottom: 148,
  });
  assert.match(tabletContext.workspaceRoot.innerHTML, /data-nav-state="collapsed"/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /id="workspaceMenuToggle"[\s\S]*Open menu/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /id="workspaceRefresh"[\s\S]*Refresh/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /id="workspaceLogout"[\s\S]*Sign out/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /workspace-topbar-actions/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /data-account-menu="true"/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /workspace-account-avatar/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /data-topbar-density="compact"/);
  assert.equal(tabletContext.documentElements.get("#workspaceMenuToggle")?.hasEventListener("click"), true);
  assert.equal(tabletContext.documentElements.get("#workspaceRefresh")?.hasEventListener("click"), true);
  assert.equal(tabletContext.documentElements.get("#workspaceLogout")?.hasEventListener("click"), true);
  assert.match(tabletContext.workspaceRoot.innerHTML, /data-active-role-badge="true"[\s\S]*data-role-identity="global_admin"/);
  assertMarkupOrder(tabletContext.workspaceRoot.innerHTML, "School-Wide Operations", "Screen guide", "admin console content should appear before helper guide");
  assertMarkupOrder(tabletContext.workspaceRoot.innerHTML, "School-Wide Operations", "Words on this screen", "admin console content should not be pushed down by language guidance");
  assert.match(
    tabletContext.documentElements.get(".workspace-app")?.style.getPropertyValue("--workspace-drawer-top") || "",
    /calc\(156px \+ env\(safe-area-inset-top\)\)/,
  );

  tabletContext.documentElements.get("#workspaceMenuToggle")?.click();
  const drawerOpen = tabletContext.workspaceRoot.innerHTML;
  assert.match(drawerOpen, /data-nav-state="expanded"/);
  assert.match(drawerOpen, /id="workspaceNavigationRail"/);
  assert.match(drawerOpen, /id="workspaceRailClose"[\s\S]*Close menu/);
  assert.match(drawerOpen, /data-section="adminPeople"[\s\S]*People/);
  assert.match(drawerOpen, /data-section="adminAssignments"[\s\S]*Assignments/);
  assert.equal(tabletContext.documentElements.get("#workspaceRailClose")?.hasEventListener("click"), true);
  assert.match(drawerOpen, /data-active-role-badge="true"[\s\S]*data-role-identity="global_admin"/);
  assert.match(drawerOpen, /id="workspaceRefresh"[\s\S]*Refresh/);
  assert.match(drawerOpen, /id="workspaceLogout"[\s\S]*Sign out/);

  tabletContext.documentElements.get("#workspaceRailClose")?.click();
  assert.match(tabletContext.workspaceRoot.innerHTML, /data-nav-state="collapsed"/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /Admin Console/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /data-rail-access-summary="compact"/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /workspace-command-center/);
  assert.match(tabletContext.workspaceRoot.innerHTML, /School-Wide Operations/);

  const phoneContext = await createWorkspaceContextWithFetch(profileRoutesForRole("global_admin"), {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminDashboard",
    viewportWidth: 390,
    viewportHeight: 844,
  });
  assert.match(phoneContext.workspaceRoot.innerHTML, /data-nav-state="collapsed"/);
  phoneContext.documentElements.get("#workspaceMenuToggle")?.click();
  assert.match(phoneContext.workspaceRoot.innerHTML, /data-nav-state="expanded"/);
  assert.match(phoneContext.workspaceRoot.innerHTML, /id="workspaceRailClose"[\s\S]*Close menu/);
  assert.equal(phoneContext.documentElements.get("#workspaceRailClose")?.hasEventListener("click"), true);
  phoneContext.documentElements.get("#workspaceRailClose")?.click();
  assert.match(phoneContext.workspaceRoot.innerHTML, /data-nav-state="collapsed"/);
  assert.match(phoneContext.workspaceRoot.innerHTML, /workspace-command-center/);
  assert.match(phoneContext.workspaceRoot.innerHTML, /School-Wide Operations/);
});

test("workspace wide admin console keeps operations readable and source actions reachable", async () => {
  assert.match(workspaceCss, /html,\s*body\s*\{[\s\S]*max-width:\s*100%;[\s\S]*overflow-x:\s*hidden;/);
  assert.match(workspaceCss, /\.workspace-admin-console-content\s*\{[\s\S]*grid-template-columns:\s*minmax\(188px,\s*220px\) minmax\(0,\s*1560px\);[\s\S]*justify-content:\s*center;/);
  assert.match(workspaceCss, /\.workspace-admin-command-center\s*\{[\s\S]*max-width:\s*100%;/);
  assert.match(workspaceCss, /\.workspace-admin-operations-grid \.workspace-metric-tile\s*\{[\s\S]*min-height:\s*132px;/);
  assert.equal(adminReadableWidthForViewport(1920), 1560);

  const wideContext = await createWorkspaceContextWithFetch(profileRoutesForRole("global_admin"), {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminDashboard",
    viewportWidth: 1920,
    viewportHeight: 1080,
    topbarBottom: 76,
  });
  const markup = wideContext.workspaceRoot.innerHTML;
  assert.match(markup, /data-app-mode="admin"/);
  assert.match(markup, /data-nav-state="expanded"/);
  assert.match(markup, /data-rail-access-summary="compact"[\s\S]*Global Admin[\s\S]*Global view/);
  assert.match(markup, /data-rail-access-summary="compact"/);
  assert.match(markup, /data-admin-command-center="true"/);
  assert.match(markup, /data-admin-operations-flow="true"/);
  assert.match(markup, /data-admin-flow-step="students"[\s\S]*Students[\s\S]*Active/);
  assert.match(markup, /data-admin-operations-grid="true"/);
  assert.match(markup, /School-Wide Operations/);
  assert.match(markup, /Needs Attention/);
  assert.match(markup, /School-Wide Detail Panels/);
  assert.match(markup, /data-admin-console-active-section="adminDashboard"/);
  assert.match(markup, /data-section="adminReports"[\s\S]*Reports/);
  assert.match(markup, /id="workspaceRefresh"[\s\S]*Refresh/);
  assert.match(markup, /id="workspaceLogout"[\s\S]*Sign out/);
  assert.equal(wideContext.documentElements.get("#workspaceRefresh")?.hasEventListener("click"), true);
  assert.equal(wideContext.documentElements.get("#workspaceLogout")?.hasEventListener("click"), true);
  for (const section of ["adminPeople", "adminStudents", "adminAssignments", "adminImports", "adminReports", "audit"]) {
    assert.match(markup, new RegExp(`data-section="${section}"`), `${section} remains reachable`);
  }
  assertMarkupOrder(markup, "School-Wide Operations", "Needs Attention", "operations summary should lead before attention list");
  assertMarkupOrder(markup, "Needs Attention", "School-Wide Detail Panels", "attention list should lead before detail panels");
  assertMarkupOrder(markup, "School-Wide Operations", "Screen guide", "screen guide should follow the dashboard content on wide desktop");
  assertMarkupOrder(markup, "School-Wide Operations", "Words on this screen", "diagnostic language rows should not precede the dashboard");
});

test("admin console surfaces setup reasons across overview people students and reports", async () => {
  const accessAssignments = siteAccessAssignmentsFixture();
  accessAssignments.users.students = [
    {
      ...accessAssignments.users.students[0],
      programName: "",
      programId: "",
    },
    {
      userId: "student-needs-setup",
      displayName: "No Year Student",
      email: "no.year.student@demo-student.capstone.test",
      programName: "Information Technology",
      cohort: "",
      graduationYear: "",
    },
  ];
  accessAssignments.users.mentors.push({
    userId: "mentor-no-scope",
    displayName: "Orphan Mentor",
    email: "",
  });
  const routes = {
    ...profileRoutesForRole("site_admin"),
    "/api/site/access-assignments": { status: 200, body: accessAssignments },
  };
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(routes, {
    url: "https://workspace.example/workspace.html?mode=admin&section=overview&siteId=site-desert-valley-high",
  });

  vm.runInContext(`
    adminCsvImportState.students = validateAdminCsvImport("students", ${JSON.stringify([
      "first_name,last_name,email,site,program,guardian_phone",
      "Header,Drift,header.drift@senior-capstone.test,Desert Valley High School,Information Technology,555-0100",
    ].join("\n"))});
    activeWorkspaceMode = "admin";
    activeSection = "overview";
    renderAppShell();
  `, context);

  const overview = workspaceRoot.innerHTML;
  assert.match(overview, /data-admin-console-overview="true"/);
  assert.match(overview, /data-admin-setup-readiness="true"/);
  assert.match(overview, /Student program missing/);
  assert.match(overview, /Roster profile incomplete/);
  assert.match(overview, /Staff scope needs confirmation/);
  assert.match(overview, /CSV preview needs fixes/);
  assert.match(overview, /data-admin-setup-readiness-row="students"[\s\S]*Student roster setup[\s\S]*1 profile, 1 program, 17 mentor, 1 viewer gaps/);
  assert.match(overview, /No Year Student: Missing cohort\/year, No mentor, No viewer/);
  assert.match(overview, /data-admin-setup-readiness-row="staff"[\s\S]*Orphan Mentor: Missing email, No mentor students/);
  assert.match(overview, /data-admin-setup-readiness-row="imports"[\s\S]*Student CSV: 0 valid \/ 1 to fix/);

  vm.runInContext('activeSection = "adminStudents"; adminPeopleView = "manage-students"; renderAppShell();', context);
  const students = workspaceRoot.innerHTML;
  assert.match(students, /data-manage-student-row="student-needs-setup" data-manage-student-setup="needs-review"/);
  assert.match(students, /data-admin-setup-flag="profile"[\s\S]*Missing cohort\/year/);
  assert.match(students, /data-admin-setup-flag="mentor"[\s\S]*No mentor/);
  assert.match(students, /data-admin-setup-flag="viewer"[\s\S]*No viewer/);

  vm.runInContext('activeSection = "adminPeople"; adminPeopleView = "manage-staff"; renderAppShell();', context);
  const people = workspaceRoot.innerHTML;
  assert.match(people, /data-manage-staff-row="mentor-no-scope" data-manage-staff-setup="needs-review"/);
  assert.match(people, /data-admin-setup-flag="email"[\s\S]*Missing email/);
  assert.match(people, /data-admin-setup-flag="mentor-scope"[\s\S]*No mentor students/);

  vm.runInContext('activeSection = "adminReports"; renderAppShell();', context);
  const reports = workspaceRoot.innerHTML;
  assert.match(reports, /data-admin-setup-readiness="true"/);
  assert.match(reports, /Operational coverage summary/);
  assert.match(reports, /Setup\/import issues/);
});

test("workspace dashboard actions use supported filters and loaders", () => {
  const sectionOpenBlock = workspaceJs.match(/async function openWorkspaceSection[\s\S]*?function availableSections/)?.[0] || "";
  assert.match(sectionOpenBlock, /activeSection = section;\s*syncCurrentWorkspaceUrlState\(\);\s*renderAppShell\(\);/);
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
  assert.match(sectionOpenBlock, /if \(section === "archiveExports"\) \{/);
  assert.match(sectionOpenBlock, /adminArchiveExportFilter = cleanAdminArchiveExportFilter/);
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
  assert.match(workspaceJs, /"failed-exports"/);
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
  assert.match(productionSurfaceCheck, /sensitiveValuePatterns/);
  assert.match(productionSurfaceCheck, /temporary setup credential value/);
  assert.match(productionSurfaceCheck, /Drive id assignment/);
  assert.match(productionSurfaceCheck, /private key material/);
});

test("workspace evidence forms capture values before disabling controls", () => {
  assert.match(
    workspaceJs,
    /const values = Object\.fromEntries\(new FormData\(form\)\.entries\(\)\);\s+const validationMessage = validateEvidenceLinkValues\(values\);/,
  );
  assert.match(workspaceJs, /if \(validationMessage \|\| !externalUrl\)[\s\S]*renderAppShell\(validationMessage \|\| messageForEvidenceError\("invalid_https_evidence_url"\), "error"\);/);
  assert.match(workspaceJs, /url: externalUrl,/);
  assert.match(
    workspaceJs,
    /const attempt = buildUploadAttemptFromForm\(form\);\s+let validationMessage = validateUploadAttempt\(attempt\);\s+if \(!validationMessage\) \{\s+validationMessage = await validateWorkspaceUploadFileSignature\(attempt\.file\);/,
  );
  assert.match(workspaceJs, /function buildUploadAttemptFromForm\(form\)[\s\S]*new FormData\(form\)/);
  assert.match(workspaceJs, /function formDataForUploadAttempt\(attempt\)[\s\S]*formData\.set\("file", attempt\.file/);
  assert.match(workspaceJs, /await loadWorkspaceData\("Proof link attached\. Your Program Teacher can now review it\."\);\s+openStudentProofReceipt\("Proof link attached\. Files list opened/);
  assert.match(workspaceJs, /await loadWorkspaceData\("Your file was received and added to your Senior Project proof\."\);\s+openStudentProofReceipt\("Your file was received\. Files list opened/);
  assert.match(workspaceJs, /function openStudentProofReceipt\(message = "Proof saved\. Files list opened\.", receipt = \{\}\)[\s\S]*studentProofReceiptState = normalizeStudentProofReceipt\(receipt\)[\s\S]*files: true[\s\S]*requestStudentSectionFocus\("files"\)/);
  assert.match(workspaceJs, /data-student-proof-receipt="true"/);
  assert.match(workspaceJs, /data-student-proof-receipt-map="true"/);
  assert.match(workspaceJs, /data-student-proof-receipt-action="\$\{escapeHtml\(card\.actionType \|\| "open-files"\)\}"/);
  assert.match(workspaceJs, /function handleStudentProofReceiptAction/);
  assert.match(workspaceJs, /requestStudentRequirementFocus\(requirementId\)/);
  assert.match(workspaceJs, /pendingStudentEvidenceSubmissionId = submissionId/);
  assert.match(workspaceJs, /data-student-proof-receipt-gate="true"[\s\S]*not approved for next steps until a Program Teacher reviews it/);
  assert.match(workspaceJs, /Wait for Program Teacher approval before moving to the next Senior Project step/);
  assert.match(workspaceJs, /function normalizeStudentProofReceipt/);
  assert.match(workspaceJs, /requirementId: matchedSubmission\?\.requirement_id \|\| matchedSubmission\?\.requirementId \|\| ""/);
});

test("workspace proof link validation matches server HTTPS rules", async () => {
  const { context } = await createWorkspaceContextWithFetch(profileRoutesForRole("student"));
  const httpsMessage = "Use a full HTTPS link for your proof, beginning with https://, under 2,048 characters, and without usernames or passwords.";

  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-link", title: "Proof link", url: "https://example.test/proof" })', context),
    "",
  );
  assert.equal(
    vm.runInContext('cleanWorkspaceHttpsUrl(" https://example.test/proof ")', context),
    "https://example.test/proof",
  );
  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-link", title: "Proof link", url: "http://example.test/proof" })', context),
    httpsMessage,
  );
  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-link", title: "Proof link", url: "https://localhost/proof" })', context),
    httpsMessage,
  );
  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-link", title: "Proof link", url: "https://student:secret@example.test/proof" })', context),
    httpsMessage,
  );
  assert.equal(
    vm.runInContext('cleanWorkspaceHttpsUrl("https://student:secret@example.test/proof")', context),
    "",
  );
  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-link", title: "Proof link", url: "https://example.test/" + "a".repeat(2050) })', context),
    httpsMessage,
  );
  assert.equal(
    vm.runInContext('cleanWorkspaceHttpsUrl("https://example.test/" + "a".repeat(2050))', context),
    "",
  );
  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-link", title: "", url: "https://example.test/proof" })', context),
    "Add a short title for this proof link.",
  );
});

test("workspace student submission errors give direct recovery steps", async () => {
  const { context } = await createWorkspaceContextWithFetch(profileRoutesForRole("student"));

  assert.equal(
    vm.runInContext('messageForStudentSubmissionError("submission_missing_evidence", 400)', context),
    "Add at least one proof link or file, then press Send for review again so the Program Teacher has work to approve.",
  );
  assert.equal(
    vm.runInContext('messageForStudentSubmissionError("submission_not_submittable", 409)', context),
    "This work is not ready to send. Open the matching checklist item, follow the next step shown there, then try again.",
  );
});

test("workspace evidence actions only render safe proof and file links", async () => {
  const { context } = await createWorkspaceContextWithFetch(profileRoutesForRole("student"));

  assert.equal(
    vm.runInContext('renderEvidenceActions({ source_kind: "external_link", externalUrl: "javascript:alert(1)" }).length', context),
    0,
  );
  assert.equal(
    vm.runInContext('renderEvidenceActions({ source_kind: "external_link", externalUrl: "https://student:secret@example.test/proof" }).length', context),
    0,
  );
  assert.equal(
    vm.runInContext('renderEvidenceActions({ source_kind: "external_link", externalUrl: "https://example.test/" + "a".repeat(2050) }).length', context),
    0,
  );
  assert.equal(
    vm.runInContext('renderEvidenceActions({ source_kind: "google_drive_file", downloadUrl: "javascript:alert(1)" }).length', context),
    0,
  );
  assert.equal(
    vm.runInContext('renderEvidenceActions({ source_kind: "google_drive_file", downloadUrl: "https://example.test/api/evidence/evidence-1/download" }).length', context),
    0,
  );

  const rendered = vm.runInContext('renderEvidenceActions({ title: " Research proof  link ", source_kind: "external_link", externalUrl: " https://example.test/proof " }).join("")', context);
  assert.match(rendered, /href="https:\/\/example\.test\/proof"/);
  assert.match(rendered, /rel="noopener noreferrer"/);
  assert.match(rendered, /aria-label="Open proof link: Research proof link"/);
  assert.match(rendered, /Open proof link/);

  const download = vm.runInContext('renderEvidenceActions({ title: "Prototype screen recording", source_kind: "google_drive_file", downloadUrl: " /api/evidence/evidence-1/download " }).join("")', context);
  assert.match(download, /data-evidence-download="file"/);
  assert.match(download, /href="\/api\/evidence\/evidence-1\/download"/);
  assert.match(download, /aria-label="Download proof file: Prototype screen recording"/);
  assert.match(download, /Download file/);

  const fallbackDownload = vm.runInContext('renderEvidenceActions({ source_kind: "google_drive_file", downloadUrl: "/api/evidence/evidence-1/download" }).join("")', context);
  assert.match(fallbackDownload, /aria-label="Download proof file: proof"/);

  assert.equal(vm.runInContext('cleanWorkspaceArchiveDownloadUrl(" /api/exports/export-ready/download ")', context), "/api/exports/export-ready/download");
  assert.equal(vm.runInContext('cleanWorkspaceArchiveDownloadUrl("javascript:alert(1)")', context), "");
  assert.equal(vm.runInContext('cleanWorkspaceArchiveDownloadUrl("https://example.test/api/exports/export-ready/download")', context), "");
});

test("workspace upload validation matches server file type rules", async () => {
  const { context } = await createWorkspaceContextWithFetch(profileRoutesForRole("student"));

  assert.equal(
    vm.runInContext('validateWorkspaceUploadFile({ name: "proof.pdf", size: 2048, type: "application/pdf" })', context),
    "",
  );
  assert.equal(
    vm.runInContext('validateWorkspaceUploadFile({ name: "photo.png", size: 2048, type: "image/png" })', context),
    "",
  );
  assert.equal(
    vm.runInContext('validateWorkspaceUploadFile({ name: "legacy-proof.pdf", size: 2048, type: "application/octet-stream" })', context),
    "",
  );
  assert.equal(
    vm.runInContext('validateWorkspaceUploadFile({ name: "renamed-proof.pdf", size: 2048, type: "image/png" })', context),
    "Choose a PDF, image, text file, spreadsheet, presentation, or document. If the file was renamed, make sure its extension matches the file type.",
  );
  assert.equal(
    vm.runInContext('validateWorkspaceUploadFile({ name: "no-extension", size: 2048, type: "application/pdf" })', context),
    "",
  );
  assert.equal(
    vm.runInContext('validateWorkspaceUploadFile({ name: "script.exe", size: 2048, type: "application/octet-stream" })', context),
    "Choose a PDF, image, text file, spreadsheet, presentation, or document. If the file was renamed, make sure its extension matches the file type.",
  );
  assert.equal(
    vm.runInContext('validateEvidenceLinkValues({ submissionId: "submission-1", title: "Proof", url: "https://school-login-verify.example.test/password-reset" })', context),
    "Use a direct proof link, not a sign-in, password, verification, or credential collection page.",
  );
  assert.equal(
    vm.runInContext('cleanWorkspaceHttpsUrl("https://school-login-verify.example.test/password-reset")', context),
    "",
  );
  assert.equal(
    vm.runInContext('messageForUploadError("rate_limited", 429)', context),
    "Too many file uploads happened in a short time. Wait a few minutes, then try again or use a proof link.",
  );
  assert.equal(
    vm.runInContext('messageForUploadError("blocked_file_signature", 400)', context),
    "This file cannot be uploaded safely. Choose the original PDF, image, text file, spreadsheet, presentation, or document, or attach a proof link instead.",
  );
  assert.equal(
    await vm.runInContext(`
      validateWorkspaceUploadFileSignature({
        name: "renamed-proof.pdf",
        size: 2048,
        type: "application/pdf",
        slice() {
          return { arrayBuffer: async () => new Uint8Array([0x4d, 0x5a, 0x90, 0x00]).buffer };
        }
      })
    `, context),
    "This file cannot be uploaded safely. Choose the original PDF, image, text file, spreadsheet, presentation, or document, or attach a proof link instead.",
  );
  assert.equal(
    await vm.runInContext(`
      validateWorkspaceUploadFileSignature({
        name: "proof.pdf",
        size: 2048,
        type: "application/pdf",
        slice() {
          return { arrayBuffer: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer };
        }
      })
    `, context),
    "",
  );
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
        requirements: [
          {
            requirementId: "req-upload",
            submissionId: "submission-upload",
            title: "Reflection",
            description: "Explain what changed from your first idea to your current project choice.",
            phase: "reflection-and-archive",
            phaseLabel: "Reflection And Archive",
            status: "draft",
            submissionStatus: "draft",
            nextAction: "Attach the reflection proof, then send it for Program Teacher review.",
            qualityPrompt: "Name one choice you made and one thing your proof shows.",
          },
        ],
        submissions: [
          {
            id: "submission-upload",
            requirement_id: "req-upload",
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
            message: "Needs proof or staff review before final files are ready.",
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
  assert.match(uploading, /maxlength="2048"/);
  assert.match(uploading, /Use a direct https:\/\/ proof link under 2,048 characters\. Do not use sign-in, password reset, verification, or credential collection pages\./);
  assert.match(uploading, /data-student-proof-submission-select="true"/);
  assert.match(uploading, /data-student-proof-guide-list="link"/);
  assert.match(uploading, /data-student-proof-guide="submission-upload" data-student-proof-guide-selected="true"/);
  assert.match(uploading, /What counts as proof for Reflection/);
  assert.match(uploading, /Explain what changed from your first idea to your current project choice\./);
  assert.match(uploading, /Before you attach it: Name one choice you made and one thing your proof shows\./);
  assert.match(uploading, /Attach the reflection proof, then send it for Program Teacher review\./);
  assert.match(uploading, /data-student-storage-fallback-map="true"/);
  assert.match(uploading, /data-student-storage-state="ready"/);
  assert.match(uploading, /Attach proof without getting stuck/);
  assert.match(uploading, /data-student-storage-card="select-work"[\s\S]*Choose the exact work item/);
  assert.match(uploading, /data-student-storage-card="link-first"[\s\S]*Use a secure proof link first/);
  assert.match(uploading, /data-student-storage-card="file-upload"[\s\S]*Upload only when files are working/);
  assert.match(uploading, /data-student-storage-card="upload-status"[\s\S]*Read upload status/);
  assert.match(uploading, /data-student-storage-card="program-teacher"[\s\S]*Tell your Program Teacher what happened/);
  assert.match(uploading, /data-student-storage-card="final-files"[\s\S]*Staff handle final-file downloads/);
  assert.match(uploading, /data-student-storage-focus="link-form"/);
  assert.match(uploading, /data-student-storage-focus="file-form"/);
  assert.match(uploading, /data-student-storage-focus="upload-status"/);
  assert.match(uploading, /data-student-storage-focus="proof-guide"/);
  assert.match(uploading, /data-student-storage-focus="support"/);
  assert.match(uploading, /data-section="archive"[\s\S]*Open final files/);
  assert.match(uploading, /name="file"[\s\S]*aria-describedby="workspaceFileUploadHelp"/);
  assert.match(uploading, /id="workspaceFileUploadHelp"/);
  assert.match(uploading, /Upload a PDF, image, text file, spreadsheet, presentation, or document up to 20 MB/i);
  assert.match(uploading, /data-student-screen="work"/);
  assert.match(uploading, /Evidence \/ Files/);
  assert.match(uploading, /workspace-product-header/);
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
      message: "The upload service could not receive the file. Try again or contact your instructor.",
      fileName: "progress-proof.txt",
      fileSize: 2048,
      retryReady: true
    };
  `);
  assert.match(failed, /data-upload-state="failed"/);
  assert.match(failed, /data-upload-action="retry"/);
  assert.match(failed, /Retry upload/);
  assert.match(failed, /data-upload-link-fallback="true"/);
  assert.match(failed, /data-upload-fallback-priority="link-first"/);
  assert.match(failed, /tell your Program Teacher the file upload did not finish/);
  assert.match(failed, /Retry only if staff says file uploads are ready/);
  assert.match(failed, /data-student-storage-state="failed"/);
  assert.match(failed, /Upload problem/);
  assert.match(failed, /upload service could not receive the file/i);

  const complete = await renderWorkspaceWithFetch(routes, "student", `
    studentDisclosureState.evidence = true;
    uploadState = {
      state: "complete",
      progress: 100,
      message: "Your file was received and added to your proof.",
      fileName: "progress-proof.txt",
      fileSize: 2048,
      retryReady: false
    };
  `);
  assert.match(complete, /data-upload-state="complete"/);
  assert.match(complete, /data-upload-progress="100"/);
  assert.match(complete, /Your file was received and added to your proof/);

  const receiptRoutes = JSON.parse(JSON.stringify(routes));
  receiptRoutes["/api/student/dashboard"].body.evidence = [
    {
      id: "proof-receipt-1",
      submissionId: "submission-upload",
      requirementId: "req-upload",
      requirementTitle: "Reflection",
      title: "Progress proof",
      source_kind: "external_link",
      artifact_type: "reflection",
      externalUrl: "https://example.test/proof",
      review_status: "pending_review",
    },
  ];
  const receipt = await renderWorkspaceWithFetch(receiptRoutes, "student", `
    studentDisclosureState.files = true;
    studentProofReceiptState = {
      visible: true,
      proofKind: "link",
      submissionId: "submission-upload",
      requirementId: "req-upload",
      title: "Progress proof",
      requirementTitle: "Reflection",
      savedAt: "2026-05-01T12:00:00.000Z"
    };
  `);
  assert.match(receipt, /data-student-proof-receipt="true"/);
  assert.match(receipt, /data-student-proof-receipt-matched="true"/);
  assert.match(receipt, /data-student-proof-receipt-submission-id="submission-upload"/);
  assert.match(receipt, /data-student-proof-receipt-requirement-id="req-upload"/);
  assert.match(receipt, /Proof saved/);
  assert.match(receipt, /Confirm it is on the right checklist item/);
  assert.match(receipt, /Proof link saved for Reflection/);
  assert.match(receipt, /data-student-proof-receipt-map="true"/);
  assert.match(receipt, /data-student-proof-receipt-card="matching-item"[\s\S]*Open the matching checklist item[\s\S]*data-student-proof-receipt-action="open-checklist"/);
  assert.match(receipt, /data-student-proof-receipt-card="wrong-item"[\s\S]*Wrong item\? Add corrected proof[\s\S]*data-student-proof-receipt-action="correct-proof"/);
  assert.match(receipt, /data-student-proof-receipt-card="send-review"[\s\S]*Send the work for review[\s\S]*data-student-proof-receipt-action="open-submissions"/);
  assert.match(receipt, /data-student-proof-receipt-card="approval-gate"[\s\S]*Approval still comes later[\s\S]*data-student-proof-receipt-action="open-files"/);
  assert.match(receipt, /Leave this proof alone, add the corrected proof to the right item, then tell your Program Teacher which one to ignore/);
  assert.match(receipt, /Proof is saved, but next steps wait until a Program Teacher records approval/);
  assert.match(receipt, /Wait for Program Teacher approval before moving to the next Senior Project step/);

  const storageBlockedRoutes = JSON.parse(JSON.stringify(routes));
  storageBlockedRoutes["/api/student/archive/readiness"].body.storage = {
    credentialsConfigured: false,
    providerStatus: "drive_config_missing",
  };
  const blockedEvidence = await renderWorkspaceWithFetch(storageBlockedRoutes, "student", `
    studentDisclosureState.evidence = true;
  `);
  assert.match(blockedEvidence, /data-student-storage-state="provider_unavailable"/);
  assert.match(blockedEvidence, /Staff setup needed/);
  assert.match(blockedEvidence, /Use a proof link first when uploads or final-file downloads are not ready/);
  assert.match(blockedEvidence, /File uploads and final downloads may not be ready here/);
  assert.match(blockedEvidence, /Use secure proof links for checklist work while staff fixes download setup/);

  const blockedArchiveRoutes = JSON.parse(JSON.stringify(storageBlockedRoutes));
  blockedArchiveRoutes["/api/student/archive/readiness"].body.summary = {
    readyChecks: 0,
    missingChecks: 0,
    totalChecks: 0,
    archiveAvailableToRequest: false,
  };
  blockedArchiveRoutes["/api/student/archive/readiness"].body.checks = [];
  const blockedArchive = await renderWorkspaceWithFetch(blockedArchiveRoutes, "archive");
  assert.match(blockedArchive, /Staff need to finish download setup/);
  assert.match(blockedArchive, /Downloads are not ready yet, but your checklist can still be reviewed with proof links or existing proof/);
  assert.match(blockedArchive, /Use proof links for checklist work; staff own download setup/);
  assert.match(blockedArchive, /If a final check asks for proof, use a proof link when uploads are not working/);

  assert.match(workspaceJs, /unsupported_file_type/);
  assert.match(workspaceJs, /selected file is empty/i);
  assert.match(workspaceJs, /20 MB limit/);
  assert.match(workspaceJs, /data-student-storage-focus/);
  assert.match(workspaceJs, /data-student-proof-receipt-action/);
  assert.match(workspaceJs, /handleStudentProofReceiptAction/);
  assert.doesNotMatch(`${uploading}\n${failed}\n${complete}\n${receipt}`, /drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|access_token|refresh_token/i);
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
            description: "Explain the problem, solution, audience, and proof for your Senior Project.",
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
            nextAction: "Fix Senior Project Proposal and send it back for Program Teacher review.",
          },
          {
            requirementId: "req-mentor-plan",
            submissionId: null,
            title: "Mentor Meeting One Plan",
            description: "Bring your proposal and ask your mentor for help with scope, proof, and timeline.",
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
            nextAction: "Start Mentor Meeting One Plan when your Program Teacher is ready for this step.",
          },
          {
            requirementId: "req-reflection",
            submissionId: "submission-reflection",
            title: "Final Reflection",
            description: "Choose proof that shows growth, skill, effort, or impact.",
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
          { id: "evidence-proposal", submissionId: "submission-proposal", requirementId: "req-proposal", requirementTitle: "Senior Project Proposal", title: "Proposal draft", artifact_type: "planning_document", source_kind: "external_link", externalUrl: "https://example.test/proposal", review_status: "pending_review", created_at: "2026-05-24T17:50:00.000Z" },
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
            message: "Needs proof or staff review before final files are ready.",
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
    studentDisclosureState = defaultStudentDisclosureState();
  `);

  assert.match(student, /data-student-screen="today"/);
  assert.match(student, /My Capstone/);
  assert.match(student, /What do I need to do next\?/);
  assert.match(student, /data-student-primary-action="continue-work"[\s\S]*Continue My Work/);
  assert.match(student, /Current Step \/ Next Action/);
  assert.match(student, /data-student-current-step-card="true"[\s\S]*data-student-current-step-status="true"[\s\S]*Status: Revision requested/);
  assert.match(student, /data-student-next-action-card="true"[\s\S]*data-student-next-action-path="true"[\s\S]*Open Feedback or My Work, fix the note, then send the revision/);
  assert.match(student, /Progress Tracker/);
  assert.match(student, /Feedback Alert/);
  assert.match(student, /Upcoming or Missing Items/);
  assert.match(student, /data-section="studentWork"[\s\S]*<strong>My Work<\/strong>/);
  assert.match(student, /data-section="studentFeedback"[\s\S]*<strong>Feedback<\/strong>/);
  assert.match(student, /data-section="studentFinalChecklist"[\s\S]*<strong>Final Checklist<\/strong>/);
  assert.doesNotMatch(student, /Your Senior Project|Use My Work in order|data-student-panel-map="true"|data-student-secondary-stack="true"/);
  assert.doesNotMatch(visibleText(student), /Admin Console|Staff Workspace|Role context|Demo boundary|Showing 0 of 0/);
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
            description: "Explain the problem, solution, audience, and proof for your Senior Project.",
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
            nextAction: "Fix Senior Project Proposal and send it back for Program Teacher review.",
          },
        ],
        progress: [],
        submissions: [
          { id: "submission-proposal", requirement_id: "req-proposal", requirement_title: "Senior Project Proposal", status: "revision_requested", version: 2, updated_at: "2026-05-24T18:00:00.000Z" },
        ],
        evidence: [
          {
            id: "evidence-proposal",
            submissionId: "submission-proposal",
            requirementId: "req-proposal",
            requirementTitle: "Senior Project Proposal",
            title: "Proposal draft link",
            artifact_type: "planning_document",
            source_kind: "external_link",
            review_status: "pending_review",
            externalUrl: "https://example.test/proposal-detail",
            created_at: "2026-05-24T17:50:00.000Z",
          },
        ],
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
  vm.runInContext('activeSection = "studentWork"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="work"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-action="toggle-detail"/);
  assert.match(workspaceRoot.innerHTML, /Check details/);
  assert.match(workspaceRoot.innerHTML, /aria-expanded="false"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Review details/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);

  const fetchCountBeforeDetail = fetchLog.length;
  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-proposal" } } })', context);
  assert.equal(fetchLog.length, fetchCountBeforeDetail);
  assert.match(workspaceRoot.innerHTML, /aria-expanded="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-action="toggle-detail"/);
  assert.match(workspaceRoot.innerHTML, /Hide details/);
  assert.match(workspaceRoot.innerHTML, /aria-label="Hide details: Senior Project Proposal"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /What to check/);
  assert.match(workspaceRoot.innerHTML, /Phase goal[\s\S]*An approved project proposal/);
  assert.match(workspaceRoot.innerHTML, /Include[\s\S]*What you will make; Who it helps and why it matters; How you will prove it worked/);
  assert.match(workspaceRoot.innerHTML, /Done when[\s\S]*Program Teacher approves the proposal/);
  assert.match(workspaceRoot.innerHTML, /Due October 9 and 10/);
  assert.match(workspaceRoot.innerHTML, /Proof added[\s\S]*1 item attached/);
  assert.match(workspaceRoot.innerHTML, /Version 2: Revision requested/);
  assert.match(workspaceRoot.innerHTML, /Approval gate[\s\S]*Revise this item, send it again, then wait for Program Teacher approval before next steps/);
  assert.match(workspaceRoot.innerHTML, /Latest Program Teacher feedback/);
  assert.match(workspaceRoot.innerHTML, /Add one measurable success target before resubmitting/);
  assert.match(workspaceRoot.innerHTML, /Files and links already added/);
  assert.match(workspaceRoot.innerHTML, /Proposal draft link/);
  assert.match(workspaceRoot.innerHTML, /href="https:\/\/example\.test\/proposal-detail"/);
  assert.match(workspaceRoot.innerHTML, /rel="noopener noreferrer"/);
  assert.match(workspaceRoot.innerHTML, /Open proof link/);
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
            nextAction: "Fix Senior Project Proposal and send it back for Program Teacher review.",
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

  assert.match(student, /data-student-screen="today"/);
  assert.match(student, /Upcoming or Missing Items/);
  assert.match(student, /data-student-upcoming-row="true"/);
  assertMarkupOrder(student, "Senior Project Proposal", "Presentation Outline", "nearest dated deadline should render first");
  assertMarkupOrder(student, "Presentation Outline", "Portfolio Reflection", "label-only deadline should render after dated deadlines");
  assert.match(student, /Open item/);
  assert.match(student, /Send revision/);
  assert.match(student, /Add proof/);
  assert.match(student, /Open Final Checklist/);
  assert.doesNotMatch(student, /data-student-upcoming-row="true"[\s\S]*Completed checkpoint/);
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
          requirementsTotal: 3,
          requirementsComplete: 1,
          completionPercent: 33,
          phasesTotal: 3,
          phasesComplete: 1,
          submittedRequiredCount: 1,
          missingRequiredCount: 2,
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
            description: "Explain the problem, solution, audience, and proof for your Senior Project.",
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
            nextAction: "Fix Senior Project Proposal and send it back for Program Teacher review.",
          },
          {
            requirementId: "req-reflection",
            submissionId: "",
            title: "Final Reflection",
            description: "Explain what changed from the first idea to the final result.",
            phase: "reflection-and-archive",
            phaseLabel: "Reflections and portfolio",
            status: "missing",
            progressStatus: null,
            submissionStatus: null,
            submissionVersion: null,
            evidenceCount: 0,
            dueLabel: "April 8 and 9",
            qualityPrompt: "Use one specific moment as proof.",
            lastUpdatedAt: null,
            nextAction: "Write Final Reflection after presentation and celebration work is done.",
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
            nextAction: "Start Celebration Day Setup when your Program Teacher is ready for this step.",
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
  vm.runInContext('activeSection = "studentWork"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="work"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-phase-focus="true"/);
  assert.match(workspaceRoot.innerHTML, /Phase 1: Kickoff and Proposal \(Current\)/);
  assert.match(workspaceRoot.innerHTML, /Phase 3B: Celebrate/);
  assert.match(workspaceRoot.innerHTML, /Phase 4: Give Thanks, Reflect, Launch/);
  assertMarkupOrder(workspaceRoot.innerHTML, "<h3>Phase 3B: Celebrate</h3>", "<h3>Phase 4: Give Thanks, Reflect, Launch</h3>", "booklet phase groups should sort before legacy payload order");
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-phase-key="phase-1"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-phase-key="phase-3b"/);

  vm.runInContext('handleStudentRequirementPhaseAction({ currentTarget: { dataset: { studentRequirementPhaseAction: "set-phase", studentRequirementPhaseKey: "phase-3b" } } })', context);
  assert.doesNotMatch(workspaceRoot.innerHTML, /<h3>Phase 1: Kickoff and Proposal<\/h3>/);
  assert.match(workspaceRoot.innerHTML, /<h3>Phase 3B: Celebrate<\/h3>/);
  assert.match(workspaceRoot.innerHTML, /Phase 3B: Celebrate: 0 of 1 done, 1 still need work\./);

  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-proposal" } } })', context);
  assert.match(workspaceRoot.innerHTML, /<h3>Phase 1: Kickoff and Proposal<\/h3>/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /<h3>Phase 3B: Celebrate<\/h3>/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /What to check/);
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

  vm.runInContext('activeSection = "studentFeedback"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="feedback"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-action="open-history"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-origin="feedback"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-submission-id="submission-proposal"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-approval-gate="true"/);
  assert.match(workspaceRoot.innerHTML, /Fix this feedback item, send the revision, then wait for Program Teacher approval/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackSubmissionId: "submission-proposal" } } })',
    context,
  );

  assert.ok(fetchLog.includes("/api/reviews/submission-proposal/history"));
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-timeline-summary="true"/);
  assert.match(workspaceRoot.innerHTML, /Work history/);
  assert.match(workspaceRoot.innerHTML, /Only feedback meant for you is shown here/);
  assert.match(workspaceRoot.innerHTML, /Newest sent work[\s\S]*Version 2/);
  assert.match(workspaceRoot.innerHTML, /Sent versions[\s\S]*2/);
  assert.match(workspaceRoot.innerHTML, /Program Teacher notes[\s\S]*2/);
  assert.match(workspaceRoot.innerHTML, /What changed[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /data-student-timeline-guide="true"/);
  assert.match(workspaceRoot.innerHTML, /Program Teacher asked/);
  assert.match(workspaceRoot.innerHTML, /I changed/);
  assert.match(workspaceRoot.innerHTML, /Latest sent version: Version 2 with 2 proof items/);
  assert.match(workspaceRoot.innerHTML, /Now/);
  assert.match(workspaceRoot.innerHTML, /Fix the Program Teacher note, send the revision, then wait for Program Teacher approval/);
  assert.match(workspaceRoot.innerHTML, /data-student-version-compare="true"/);
  assert.match(workspaceRoot.innerHTML, /Newest sent work: Version 2 \/ 2 proof items/);
  assert.match(workspaceRoot.innerHTML, /Previous: Version 1 \/ 1 proof item/);
  assert.match(workspaceRoot.innerHTML, /Version 2 submitted/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-current-version="true"[\s\S]*2 proof items/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-version="1"[\s\S]*1 proof item/);
  assert.match(workspaceRoot.innerHTML, /Sent back for revision/);
  assert.match(workspaceRoot.innerHTML, /data-student-status-history-explanation="true"/);
  assert.match(workspaceRoot.innerHTML, /Add one measurable success target before resubmitting/);
  assert.match(workspaceRoot.innerHTML, /Thanks for resubmitting the outline/);
  const teacherNotesMarkup = workspaceRoot.innerHTML.match(/<div class="workspace-student-feedback-timeline-list">\s*<strong>Program Teacher notes<\/strong>[\s\S]*?<\/div>/)?.[0] || "";
  assertMarkupOrder(teacherNotesMarkup, "Thanks for resubmitting the outline.", "Add one measurable success target before resubmitting.", "newer visible Program Teacher note should render before the older review note");
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

  vm.runInContext('activeSection = "studentFeedback"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="feedback"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /All notes \(3\)/);
  assert.match(workspaceRoot.innerHTML, /Needs revision \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Program Teacher notes \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Approved \(1\)/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-feedback-approval-gate="true"/g) || []).length, 3);
  assert.match(workspaceRoot.innerHTML, /Fix this feedback item, send the revision, then wait for Program Teacher approval/);
  assert.match(workspaceRoot.innerHTML, /Wait here\. Your Program Teacher must approve this work before next steps/);
  assert.match(workspaceRoot.innerHTML, /Approved for next steps\. Use this Program Teacher approval to continue with the next assigned item/);

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

  vm.runInContext('activeSection = "studentWork"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="work"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-origin="submissions"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-submission-id="submission-proposal"/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-approval-gate="true"/);
  assert.match(workspaceRoot.innerHTML, /Fix this sent work, send the revision, then wait for Program Teacher approval/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackOrigin: "submissions", studentFeedbackSubmissionId: "submission-proposal" } } })',
    context,
  );

  assert.ok(fetchLog.includes("/api/reviews/submission-proposal/history"));
  assert.match(workspaceRoot.innerHTML, /data-student-submission-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /Work history/);
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

  vm.runInContext('activeSection = "studentWork"; renderAppShell();', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="work"/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-filters="true"/);
  assert.match(workspaceRoot.innerHTML, /All work \(4\)/);
  assert.match(workspaceRoot.innerHTML, /Drafts \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Waiting for review \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Needs revision \(1\)/);
  assert.match(workspaceRoot.innerHTML, /Approved \(1\)/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-summary="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-status-guide="true"/);
  assert.match(workspaceRoot.innerHTML, /What sent-work statuses mean/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-status-card="draft"[\s\S]*Draft[\s\S]*1 item[\s\S]*Finish the work, attach matching proof, then send it for Program Teacher review[\s\S]*Show drafts/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-status-card="submitted"[\s\S]*Waiting for review[\s\S]*1 item[\s\S]*Your Program Teacher owns the next decision[\s\S]*Show waiting work/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-status-card="revision_requested"[\s\S]*Needs revision[\s\S]*1 item[\s\S]*Fix the Program Teacher note, update the matching proof if needed, then send the revision[\s\S]*Show revision work/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-status-card="approved"[\s\S]*Approved[\s\S]*1 item[\s\S]*This work is complete for now[\s\S]*Show approved work/);
  assert.match(workspaceRoot.innerHTML, /Show approved work/);
  assert.match(workspaceRoot.innerHTML, /data-student-submission-filter="approved"/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-submission-approval-gate="true"/g) || []).length, 4);
  assert.match(workspaceRoot.innerHTML, /Finish this work, attach proof if needed, then send it to your Program Teacher for review/);
  assert.match(workspaceRoot.innerHTML, /Wait here\. Your Program Teacher must approve this sent work before next steps/);
  assert.match(workspaceRoot.innerHTML, /Fix this sent work, send the revision, then wait for Program Teacher approval/);
  assert.match(workspaceRoot.innerHTML, /Approved for next steps\. Use this approval to continue with the next assigned item/);

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
  assert.match(workspaceRoot.innerHTML, /data-student-submission-status-card="revision_requested"[\s\S]*aria-pressed="true"[\s\S]*Viewing/);
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
          mentor: { assigned: false, name: null, message: "Ask your Program Teacher who can help with mentor questions." },
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
            nextAction: "Send the revised proposal back for Program Teacher review.",
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

  const fetchCountBeforeSupport = fetchLog.length;
  vm.runInContext('handleStudentSupportAction({ currentTarget: { dataset: { studentSupportAction: "focus-feedback", studentSupportFilter: "revision_requested" } } })', context);
  assert.equal(fetchLog.length, fetchCountBeforeSupport);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="feedback"/);
  assert.match(workspaceRoot.innerHTML, /data-student-feedback-active-filter="revision_requested"/);
  assert.equal((workspaceRoot.innerHTML.match(/data-student-feedback-item="/g) || []).length, 1);
  assert.equal(vm.runInContext("studentFeedbackFilter", context), "revision_requested");

  vm.runInContext('handleStudentSupportAction({ currentTarget: { dataset: { studentSupportAction: "focus-submissions", studentSupportFilter: "revision_requested" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-student-screen="work"/);
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
  assert.match(expiredSession, /data-session-recovery-guide="true"/);
  assert.match(expiredSession, /Sign in again with your approved workspace account/);
  assert.match(expiredSession, /If a form was open, check the record before submitting again/);

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
  assert.match(denied, /Access to My Capstone is limited/);
  assert.match(denied, /My Capstone/);
  assert.match(denied, /workspace-problem-state/);
  assert.match(denied, /data-problem-state-actions="true"/);
  assert.match(denied, /data-problem-action="refresh"[\s\S]*Refresh workspace/);
  assert.match(denied, /data-section="profile"[\s\S]*Review profile/);
  assert.match(denied, /data-section="security"[\s\S]*Open Account/);

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
  assert.match(viewer, /data-staff-workspace-today="true"/);
  assert.match(viewer, /Viewer Workspace \/ Read-only/);
  assert.match(viewer, /data-staff-attention-queue="needs-review"/);
  assert.match(viewer, /data-staff-queue-student-row="true"/);
  assert.match(viewer, /data-staff-row-case-plan="true"[\s\S]*Owner: Assigned staff[\s\S]*Do next: Use this row for context, then share the student name with authorized staff/);
  assert.match(viewer, /data-section="students" data-section-preset="all-students"/);
  assert.match(viewer, /data-section="students" data-section-preset="mentor-meeting-follow-up-students"/);
  assert.doesNotMatch(viewer, /Open review queue|Open operations/);
  assert.match(viewer, /Open Student/);

  const administration = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-read-only",
          email: "administration.readonly@example.edu",
          displayName: "School Admin",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "administration", readOnly: false, canManage: true }),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: false }),
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
  assert.doesNotMatch(administration, /Read-only monitoring workspace/);
  assert.match(administration, /School Admin/);
});

test("workspace renders School Admin site dashboard and readiness without viewer-only labels", async () => {
  const sharedResponses = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-dashboard",
          email: "administration.dashboard@example.edu",
          displayName: "School Admin Dashboard",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "administration", readOnly: false, canManage: true }),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: false }),
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
  assert.match(administrationDashboard, /School access/);
  assert.match(administrationDashboard, /data-section="students" data-section-preset="missing-mentors"/);
  assert.match(administrationDashboard, /Summary only/);
  assert.doesNotMatch(administrationDashboard, /Leadership priorities|School Admin monitoring queue|Leadership monitoring/);
  assert.doesNotMatch(administrationDashboard, /Viewer priorities|Read-only viewer/);

  const administrationReadiness = await renderWorkspaceWithFetch(sharedResponses, "readiness");
  assert.match(administrationReadiness, /data-readiness-report="site-operations"/);
  assert.match(administrationReadiness, /School Readiness/);
  assert.match(administrationReadiness, /School access/);
  assert.match(administrationReadiness, /data-readiness-action-map="site"/);
  assert.match(administrationReadiness, /Choose one monitoring lane/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="staff-action"/);
  assert.match(administrationReadiness, /data-section="operations" data-section-preset="needs-attention"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="final-files"/);
  assert.match(administrationReadiness, /data-section="operations" data-section-preset="archive-failed"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="proof"/);
  assert.match(administrationReadiness, /data-section="operations" data-section-preset="evidence-missing"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="presentation"/);
  assert.match(administrationReadiness, /data-section="operations" data-section-preset="presentation-pending"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="stale"/);
  assert.match(administrationReadiness, /data-section="operations" data-section-preset="stale-activity"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="program-risk"/);
  assert.match(administrationReadiness, /data-section="operations" data-section-preset="program-breakdown" data-program-id="it"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="mentor"/);
  assert.match(administrationReadiness, /data-section="mentorAssignments" data-section-preset="no-mentor"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="school"/);
  assert.match(administrationReadiness, /data-section="siteDashboard"/);
  assert.match(administrationReadiness, /data-readiness-action-map-card="review"[\s\S]*Summary only/);
  assert.doesNotMatch(administrationReadiness, /Read-only viewer/);
});

test("School Admin next actions stay role-safe on the Site Dashboard", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "administration-next-actions",
          email: "administration.next.actions@example.edu",
          displayName: "School Admin Next Actions",
          roles: [{ role_id: "administration", scope_type: "site", scope_id: "site-desert-valley-high" }],
        },
      },
    },
    "/api/site/dashboard": {
      status: 200,
      body: siteDashboardFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/students": {
      status: 200,
      body: siteStudentsFixture({ readOnly: false, role: "administration" }),
    },
    "/api/site/mentor-assignments": {
      status: 200,
      body: siteMentorAssignmentsFixture({ role: "administration", readOnly: false, canManage: true }),
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/site/operations-readiness": {
      status: 200,
      body: siteOperationsReadinessFixture({ role: "administration", readOnly: false }),
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

  vm.runInContext('activeSection = "siteDashboard"; renderAppShell();', context);
  openWorkspaceDisclosure(context, "dashboard", "siteDashboard");
  assert.match(workspaceRoot.innerHTML, /Act on assigned site records[\s\S]*data-section="students" data-section-preset="all-students"[\s\S]*Open student list/);
  assert.match(workspaceRoot.innerHTML, /Program Teacher follow-up[\s\S]*Summary only/);
  assert.match(workspaceRoot.innerHTML, /Presentation and final-file follow-up[\s\S]*data-section="operations" data-section-preset="archive-failed"[\s\S]*Open operations/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-section="teacher" data-section-preset="revision-requested"[\s\S]*Open review queue/);
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
  assert.match(disabled, /Local account/);
  assert.match(disabled, /Use this only if your school or project coordinator gave you a local account\./);
  assert.match(disabled, /data-sso-disabled-reason="local-only"/);
  assert.match(disabled, /School Google account sign-in is disabled here\./);
  assert.doesNotMatch(disabled, /workspace-sso-panel/);
  assert.doesNotMatch(disabled, /Google Workspace sign-in is not configured for this environment yet/);
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
  assert.doesNotMatch(enabled, /Student progress|Private proof|Mentor coverage|Review queue|Presentation readiness/);
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

  assert.match(security, /Password and Sessions/);
  assert.match(security, /<strong>Account<\/strong>/);
  assert.match(security, /Account settings/);
  assert.match(security, /data-security-action-map="true"/);
  assert.match(security, /Account action map/);
  assert.match(security, /Use this only for your account/);
  assert.match(security, /Change your password here\. Ask staff for reset, sign-in, or access problems/);
  assert.match(security, /data-security-action-map-card="identity"[\s\S]*data-section="profile"[\s\S]*Open profile/);
  assert.match(security, /data-security-action-map-card="password"[\s\S]*data-security-focus="password-form"[\s\S]*Open form/);
  assert.match(security, /data-security-action-map-card="checklist"[\s\S]*data-security-focus="password-checklist"[\s\S]*Open checks/);
  assert.match(security, /data-security-action-map-card="sessions"[\s\S]*data-security-focus="session-impact"[\s\S]*Open impact/);
  assert.match(security, /data-security-action-map-card="sign-in"[\s\S]*data-security-focus="sign-in-mode"[\s\S]*Open sign-in note/);
  assert.match(security, /data-security-action-map-card="support"[\s\S]*data-security-focus="support"[\s\S]*Open support/);
  assert.doesNotMatch(security, /data-security-action-map-card="users"|data-security-action-map-card="audit"/);
  assert.match(security, /data-student-account-path="true"/);
  assert.match(security, /Account path/);
  assert.match(security, /Use Account in this order/);
  assert.match(security, /This screen is for sign-in only\. It does not change project work, proof, feedback, roles, or school access/);
  assert.match(security, /data-student-account-step="confirm"[\s\S]*Confirm this is you[\s\S]*student\.security@example\.edu[\s\S]*data-section="profile"[\s\S]*Open profile/);
  assert.match(security, /data-student-account-step="change"[\s\S]*Change only if you know the current password[\s\S]*Use this form only when you know the password that signs you into this workspace[\s\S]*data-security-focus="password-form"[\s\S]*Open password form/);
  assert.match(security, /data-student-account-step="return"[\s\S]*Return to project work[\s\S]*Use My Work for proof, feedback, deadlines, and Senior Project next steps[\s\S]*data-section="student"[\s\S]*Open My Work/);
  assert.match(security, /data-security-password-form="true"/);
  assert.match(security, /data-auth-action="change-password"/);
  assert.match(security, /\/api\/auth\/change-password/);
  assert.match(security, /This does not change your role, class access, project work, or anyone else/);
  assert.match(security, /data-task-finish-checklist="password-change"/);
  assert.match(security, /Before changing your password/);
  assert.match(security, /Current password ready/);
  assert.match(security, /New password typed twice/);
  assert.match(security, /other active sessions for this account are closed/);
  assert.match(security, /data-security-signin-mode="true"[\s\S]*Local only[\s\S]*Current account only/);
  assert.match(security, /data-security-session-impact="true"[\s\S]*Other sessions close[\s\S]*Return to your workspace/);
  assert.match(security, /data-security-support-guide="true"[\s\S]*When to ask for help[\s\S]*Forgot current password[\s\S]*My Work looks wrong[\s\S]*Proof or feedback issue/);
  assert.match(security, /Use My Work for project proof and Program Teacher feedback/);
  assert.doesNotMatch(security, /<strong>Security<\/strong>/);

  const googleStudentRoutes = profileRoutesForRole("student");
  googleStudentRoutes["/api/auth/config"].body = {
    ...authConfigFixture(),
    googleSsoEnabled: true,
    googleSsoConfigured: true,
    localLoginEnabled: true,
  };
  const googleStudentSecurity = await renderWorkspaceWithFetch(googleStudentRoutes, "security");
  assert.match(googleStudentSecurity, /data-security-action-map-card="sign-in"[\s\S]*Google sign-in \+ local/);
  assert.match(googleStudentSecurity, /Google sign-in is available; local password changes only affect this app&#039;s local password/);
  assert.match(googleStudentSecurity, /If you use Google sign-in, ask staff before changing a local password you do not use/);
  assert.match(googleStudentSecurity, /data-security-signin-mode="true"[\s\S]*Google sign-in \+ local/);
  assert.doesNotMatch(googleStudentSecurity, /Google SSO|SSO \+ local|local credentials/);

  const adminSecurity = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "security");
  assert.match(adminSecurity, /<strong>Security<\/strong>/);
  assert.match(adminSecurity, /Account security/);
  assert.match(adminSecurity, /Security action map/);
  assert.match(adminSecurity, /data-security-action-map-card="users"[\s\S]*data-section="adminUsers"[\s\S]*Open users/);
  assert.match(adminSecurity, /data-security-action-map-card="audit"[\s\S]*data-section="audit"[\s\S]*Open audit/);
  assert.match(adminSecurity, /data-security-session-impact="true"[\s\S]*Admin work continues after sign-in/);
  assert.match(adminSecurity, /data-security-support-guide="true"[\s\S]*Other users need Users &amp; Access[\s\S]*Audit activity belongs in Audit/);
  assert.doesNotMatch(adminSecurity, /data-student-account-path="true"|Use Account in this order/);
});

test("workspace renders evidence download and external-link actions without storage ids", async () => {
  const studentEvidenceRoutes = {
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
            submissionId: "submission-proposal",
            requirementId: "req-proposal",
            requirementTitle: "Senior Project Proposal",
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
            submissionId: "submission-research",
            requirementId: "req-research",
            requirementTitle: "Research Notes",
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
  };
  const student = await renderWorkspaceWithFetch(studentEvidenceRoutes, "student", `
    studentDisclosureState.requirements = true;
    studentDisclosureState.evidence = true;
    studentDisclosureState.files = true;
  `);

  assert.match(student, /data-student-screen="work"/);
  assert.match(student, /My Work/);
  assert.match(student, /Evidence \/ Files/);
  assert.match(student, /data-student-requirements-empty="true"/);
  assert.match(student, /Your Program Teacher has not assigned Senior Project work yet/);
  assert.match(student, /Assigned capstone work will appear here after your Program Teacher adds it/);
  assert.match(student, /Ask your Program Teacher which Senior Project item should be assigned first/);
  assert.match(student, /Do not start a new phase until it appears here/);
  assert.match(student, /data-student-evidence-empty="true"/);
  assert.match(student, /No proof can be uploaded yet/);
  assert.match(student, /First open What to Work On Next and start the item your Program Teacher assigned/);
  assert.match(student, /ask your Program Teacher which Senior Project step should be assigned before you upload proof/);
  assert.match(student, /data-evidence-download="file"/);
  assert.match(student, /href="\/api\/evidence\/evidence-drive\/download"/);
  assert.match(student, /Download file/);
  assert.match(student, /Checklist item: Senior Project Proposal/);
  assert.match(student, /Checklist item: Research Notes/);
  assert.match(student, /data-student-requirement-action="open-detail"/);
  assert.match(student, /data-evidence-link="external"/);
  assert.match(student, /href="https:\/\/example\.edu\/research"/);
  assert.match(student, /rel="noopener noreferrer"/);
  assert.match(student, /Open proof link/);
  assert.doesNotMatch(student, /drive_file_id|driveFileId|drive-secret/i);

  const finalChecklist = await renderWorkspaceWithFetch(studentEvidenceRoutes, "studentFinalChecklist");
  assert.match(finalChecklist, /data-student-screen="final-checklist"/);
  assert.match(finalChecklist, /data-student-final-checklist="true"/);
  assert.match(finalChecklist, /data-student-final-check-row="phase-1"[\s\S]*Not confirmed yet/);
  assert.match(finalChecklist, /data-student-final-check-row="evidence"[\s\S]*No evidence has been uploaded yet|data-student-final-check-row="evidence"[\s\S]*Not confirmed yet/);
  assert.match(finalChecklist, /data-student-primary-action="open-next-missing"[\s\S]*Continue My Work/);
  assert.doesNotMatch(visibleText(finalChecklist), /Approved for next steps|Complete for closeout/);
});

test("student files rows reopen the matching requirement detail", async () => {
  const routes = {
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-files-detail",
          email: "student.files.detail@example.edu",
          displayName: "Files Detail Student",
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
          completionPercent: 50,
          requirementsComplete: 1,
          requirementsTotal: 2,
          phasesComplete: 1,
          phasesTotal: 2,
          submittedRequiredCount: 1,
          missingRequiredCount: 1,
          waitingForReviewCount: 0,
          revisionRequestedCount: 1,
          currentPhaseLabel: "Proposal And Research",
          mentor: { assigned: true, name: "Ms. Garcia", message: "Check your proposal updates with your mentor." },
        },
        nextSteps: [],
        requirements: [
          {
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            title: "Senior Project Proposal",
            description: "Explain the problem, solution, audience, and proof for your Senior Project.",
            phase: "proposal-and-research",
            phaseLabel: "Proposal And Research",
            status: "revision_requested",
            progressStatus: "revision_requested",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            evidenceCount: 1,
            dueDate: "2026-05-30T00:00:00Z",
            dueLabel: "May 30",
            qualityPrompt: "Add one measurable success target before you send the proposal back.",
            lastUpdatedAt: "2026-05-24T18:00:00.000Z",
            nextAction: "Fix Senior Project Proposal and send it back for Program Teacher review.",
          },
        ],
        progress: [],
        submissions: [
          { id: "submission-proposal", requirement_id: "req-proposal", requirement_title: "Senior Project Proposal", status: "revision_requested", version: 2, evidence_count: 1, updated_at: "2026-05-24T18:00:00.000Z" },
        ],
        evidence: [
          {
            id: "evidence-proposal",
            submissionId: "submission-proposal",
            requirementId: "req-proposal",
            requirementTitle: "Senior Project Proposal",
            title: "Proposal draft",
            artifact_type: "planning_document",
            source_kind: "external_link",
            review_status: "pending_review",
            externalUrl: "https://example.test/proposal",
            created_at: "2026-05-24T17:50:00.000Z",
          },
        ],
        feedback: [],
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
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(routes);
  vm.runInContext('studentDisclosureState.files = true; activeSection = "student"; renderAppShell();', context);

  assert.match(workspaceRoot.innerHTML, /data-student-files-review="true"/);
  assert.match(workspaceRoot.innerHTML, /Check saved proof/);
  assert.match(workspaceRoot.innerHTML, /Files and links are proof, not approval/);
  assert.match(workspaceRoot.innerHTML, /data-student-files-review-card="match"[\s\S]*Match proof to a checklist item[\s\S]*All 1 proof item below is grouped by checklist item[\s\S]*Open checklist item/);
  assert.match(workspaceRoot.innerHTML, /data-student-files-review-card="review"[\s\S]*Waiting for review[\s\S]*1 proof item is saved, but still waiting for Program Teacher review/);
  assert.match(workspaceRoot.innerHTML, /data-student-files-review-card="correct"[\s\S]*Need to change proof\?[\s\S]*Add corrected proof to the right item[\s\S]*data-workspace-disclosure-id="evidence"[\s\S]*Open proof tools/);
  assert.match(workspaceRoot.innerHTML, /Checklist item: Senior Project Proposal/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);

  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-proposal" } } })', context);

  assert.match(workspaceRoot.innerHTML, /data-student-screen="work"/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /Senior Project Proposal/);
  assert.match(workspaceRoot.innerHTML, /Version 2: Revision requested/);
  assert.match(workspaceRoot.innerHTML, /Files and links already added/);
  assert.match(workspaceRoot.innerHTML, /Proposal draft/);
  assert.match(workspaceRoot.innerHTML, /Open proof link/);
});

test("student requirement detail opens the submission timeline inline", async () => {
  const { context, workspaceRoot, fetchLog } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-requirement-history",
          email: "student.requirement.history@senior-capstone.test",
          displayName: "Requirement Timeline Student",
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
        requirements: [
          {
            requirementId: "req-proposal",
            submissionId: "submission-proposal",
            title: "Senior Project Proposal",
            description: "Explain the problem, solution, audience, and proof for your Senior Project.",
            phase: "proposal-and-research",
            phaseLabel: "Proposal And Research",
            status: "revision_requested",
            progressStatus: "revision_requested",
            submissionStatus: "revision_requested",
            submissionVersion: 2,
            evidenceCount: 1,
            dueDate: "2026-05-30T00:00:00Z",
            dueLabel: "May 30",
            qualityPrompt: "Add one measurable success target before you send the proposal back.",
            lastUpdatedAt: "2026-05-24T18:00:00.000Z",
            nextAction: "Fix Senior Project Proposal and send it back for Program Teacher review.",
          },
          {
            requirementId: "req-showcase",
            submissionId: "",
            title: "Celebration Day Plan",
            description: "Prepare your showcase setup and visitor plan.",
            phase: "celebration-day",
            phaseLabel: "Celebration Day",
            status: "not_started",
            progressStatus: "not_started",
            submissionStatus: "",
            submissionVersion: 0,
            evidenceCount: 0,
            dueDate: "2026-06-02T00:00:00Z",
            dueLabel: "June 2",
            qualityPrompt: "",
            lastUpdatedAt: "2026-05-20T18:00:00.000Z",
            nextAction: "Start planning your showcase setup.",
          },
        ],
        progress: [],
        submissions: [
          { id: "submission-proposal", requirement_id: "req-proposal", requirement_title: "Senior Project Proposal", status: "revision_requested", version: 2, evidence_count: 1, updated_at: "2026-05-24T18:00:00.000Z" },
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
        submission: { id: "submission-proposal", studentId: "student-requirement-history", status: "revision_requested", version: 2 },
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
            submittedByName: "Requirement Timeline Student",
            notes: "",
            evidence: [{ id: "evidence-proposal-2a" }],
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
      body: { ok: true, checks: [], summary: {}, archive: {}, storage: {}, retention: {} },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
  });

  vm.runInContext('studentDisclosureState.requirements = true; activeSection = "student"; renderAppShell();', context);
  vm.runInContext('handleStudentRequirementAction({ currentTarget: { dataset: { studentRequirementAction: "open-detail", studentRequirementId: "req-proposal" } } })', context);

  assert.match(workspaceRoot.innerHTML, /data-student-feedback-origin="requirements"/);
  assert.match(workspaceRoot.innerHTML, /View work history/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-timeline="true"/);

  await vm.runInContext(
    'handleStudentFeedbackAction({ currentTarget: { dataset: { studentFeedbackAction: "open-history", studentFeedbackOrigin: "requirements", studentFeedbackSubmissionId: "submission-proposal" } } })',
    context,
  );

  assert.ok(fetchLog.includes("/api/reviews/submission-proposal/history"));
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.match(workspaceRoot.innerHTML, /data-student-send-path="true"/);
  assert.match(workspaceRoot.innerHTML, /Before you send this item/);
  assert.match(workspaceRoot.innerHTML, /Stay on this checklist item until the work, proof, and Program Teacher note all match/);
  assert.match(workspaceRoot.innerHTML, /Phase goal: An approved project proposal/);
  assert.match(workspaceRoot.innerHTML, /data-student-send-path-card="finish"[\s\S]*Fix the note first[\s\S]*Add one measurable success target before resubmitting/);
  assert.match(workspaceRoot.innerHTML, /data-student-send-path-card="proof"[\s\S]*Proof is attached[\s\S]*1 proof item is attached to this checklist item/);
  assert.match(workspaceRoot.innerHTML, /data-student-send-path-card="send"[\s\S]*Send revision[\s\S]*Send only after the work and proof match this item/);
  assert.match(workspaceRoot.innerHTML, /data-student-ready-checklist="true"/);
  assert.match(workspaceRoot.innerHTML, /Ready to send\?/);
  assert.match(workspaceRoot.innerHTML, /data-student-requirement-timeline="true"/);
  assert.match(workspaceRoot.innerHTML, /Refresh work history/);
  assert.match(workspaceRoot.innerHTML, /Work history/);
  assert.match(workspaceRoot.innerHTML, /Thanks for resubmitting the outline/);
  assert.match(workspaceRoot.innerHTML, /Sent back for revision/);
  assert.equal(vm.runInContext("studentFeedbackHistoryState.source", context), "requirements");

  await vm.runInContext(
    'handleStudentRequirementPhaseAction({ currentTarget: { dataset: { studentRequirementPhaseAction: "set-phase", studentRequirementPhaseKey: "phase-3b" } } })',
    context,
  );

  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-detail="true"/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /data-student-requirement-timeline="true"/);
  assert.equal(vm.runInContext("studentFeedbackHistoryState.selectedSubmissionId", context), "");
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
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/admin/role-assignments": {
      status: 200,
      body: { ok: true, assignments: [] },
    },
  }, "adminUsers", `
    lastAdminImportResult = {
      summary: {
        studentsCreated: 1,
        studentsSkipped: 2,
        invalidRowsBlocked: 0,
        mentorAssignmentsCreated: 1,
        mentorAssignmentsSkipped: 0,
        viewerAssignmentsCreated: 1,
        viewerAssignmentsSkipped: 0
      },
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

  assert.match(adminUsers, /data-people-management="true"/);
  assert.match(adminUsers, /data-people-view="manage-students"/);
  assert.match(adminUsers, /data-people-nav="true"/);
  assert.match(adminUsers, /data-screen-orientation-section="adminUsers"/);
  assert.match(adminUsers, /Create or change access only after school access is clear/);
  assert.match(adminUsers, /Review current access and preflight checks before saving/);
  assert.match(adminUsers, /Do not create real accounts without approved setup-password delivery/);
  assert.match(adminUsers, /data-screen-orientation-actions="true"/);
  assert.match(adminUsers, /data-section="siteDashboard"[\s\S]*Review current school/);
  assert.match(adminUsers, /data-section="profile"[\s\S]*Review profile/);
  assert.match(adminUsers, /data-section="security"[\s\S]*Open Security/);
  assert.match(adminUsers, /data-users-access-action-map="true"/);
  assert.match(adminUsers, /Do one safe access step first/);
  assert.match(adminUsers, /Desert Valley High School \/ 2025-2026/);
  assert.match(adminUsers, /data-users-access-action-map-card="scope"[\s\S]*School scope[\s\S]*1 school[\s\S]*Confirm the current school[\s\S]*data-section="siteDashboard"[\s\S]*Review school/);
  assert.match(adminUsers, /data-users-access-action-map-card="role"[\s\S]*Smallest role[\s\S]*7 roles[\s\S]*Pick the smallest role[\s\S]*data-users-access-focus="create"[\s\S]*Pick role/);
  assert.match(adminUsers, /data-users-access-action-map-card="current-access"[\s\S]*Current access[\s\S]*4 active[\s\S]*Check active access first[\s\S]*data-users-access-focus="current-access"[\s\S]*Review access/);
  assert.match(adminUsers, /data-users-access-action-map-card="create"[\s\S]*Account setup[\s\S]*Local[\s\S]*Create with handoff ready[\s\S]*data-users-access-focus="preflight"[\s\S]*Open preflight/);
  assert.match(adminUsers, /data-users-access-action-map-card="assign"[\s\S]*School grants[\s\S]*3 forms[\s\S]*Assign one scope at a time[\s\S]*data-users-access-focus="assignment-forms"[\s\S]*Open forms/);
  assert.match(adminUsers, /data-users-access-action-map-card="remove"[\s\S]*Removal safety[\s\S]*5 removable[\s\S]*Read removal impact first[\s\S]*data-users-access-focus="removal"[\s\S]*Review warning/);
  assert.match(adminUsers, /data-users-access-action-map-card="history"[\s\S]*Access history[\s\S]*2 changes[\s\S]*Review recent changes[\s\S]*data-workspace-disclosure-scope="usersAccess"[\s\S]*data-workspace-disclosure-id="history"[\s\S]*Open changes/);
  assert.match(adminUsers, /data-users-access-action-map-card="role-history"[\s\S]*Role history[\s\S]*0 grants[\s\S]*Review role grants[\s\S]*data-workspace-disclosure-scope="usersAccess"[\s\S]*data-workspace-disclosure-id="roleAssignments"[\s\S]*Open grants/);
  assert.match(adminUsers, /Students, staff, imports, and assignments/);
  assert.match(adminUsers, /data-people-scope-summary="true"/);
  assert.match(adminUsers, /data-people-nav-group="students"[\s\S]*Manage Students[\s\S]*Add Student/);
  assert.match(adminUsers, /data-people-nav-group="staff"[\s\S]*Manage Staff[\s\S]*Add Staff/);
  assert.match(adminUsers, /data-people-nav-group="imports"[\s\S]*Import Students[\s\S]*Import Staff/);
  assert.match(adminUsers, /data-people-nav-group="assignments"[\s\S]*Assignments/);
  assert.match(adminUsers, /data-people-screen="manage-students"/);
  assert.match(adminUsers, /data-manage-student-row="demo-student-101"/);
  assert.match(adminUsers, /Class of 2026 \/ Graduation 2026/);
  assert.match(adminUsers, /Mentor: Mentor One \/ Viewer: Read-only Viewer/);
  assert.match(adminUsers, /View student/);
  assert.match(adminUsers, /View as Student/);
  assert.match(adminUsers, /data-site-account-management="true"/);
  assert.match(adminUsers, /data-site-staff-account-management="true"/);
  assert.match(adminUsers, /Staff, admin, Program Teacher, and student accounts/);
  assert.match(adminUsers, /Remove account/);
  assert.match(adminUsers, /data-site-access-removal-warning="true"/);
  assert.match(adminUsers, /Before removing access/);
  assert.match(adminUsers, /does not delete student work, proof, programs, or audit history/);
  assert.match(adminUsers, /data-site-account-remove-impact="true"/);
  assert.doesNotMatch(adminUsers, /Import Account|Import reason|Misc Admin|misc_admin/);
  assert.match(adminUsers, /data-admin-import-result="one-time-setup-passwords"/);
  assert.match(adminUsers, /data-admin-import-final-summary="true"/);
  assert.match(adminUsers, /Students created[\s\S]*1/);
  assert.match(adminUsers, /Students skipped[\s\S]*2/);
  assert.match(adminUsers, /Mentor assignments created[\s\S]*1/);
  assert.match(adminUsers, /Viewer assignments created[\s\S]*1/);
  assert.match(adminUsers, /N9!aA-setup-zZ/);
  assert.match(adminUsers, /pending reset/i);
  assert.match(adminUsers, /will create a new password at first sign-in/i);

  const adminAddStudent = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-student",
  });
  assert.match(adminAddStudent, /data-people-view="add-student"/);
  assert.match(adminAddStudent, /data-admin-add-person-form="true" data-person-kind="student"/);
  assert.match(adminAddStudent, /First name[\s\S]*Last name[\s\S]*Email or login identifier/);
  assert.match(adminAddStudent, /Site \/ school[\s\S]*Program[\s\S]*Cohort[\s\S]*Graduation year[\s\S]*Status/);
  assert.match(adminAddStudent, /Mentor assignment[\s\S]*Viewer assignment/);
  assert.match(adminAddStudent, /Cohort and graduation year save to the student/);
  assert.match(adminAddStudent, /Selected mentor and viewer access is applied during save/);
  assert.match(adminAddStudent, /data-destructive-confirmation="student-create-delivery"/);
  assert.match(adminAddStudent, /Create student/);
  assert.match(adminAddStudent, /Return to Manage Students/);

  const adminAddStaff = await renderWorkspaceWithFetch(profileRoutesForRole("global_admin"), "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-staff",
  });
  assert.match(adminAddStaff, /data-people-view="add-staff"/);
  assert.match(adminAddStaff, /data-admin-add-person-form="true" data-person-kind="staff"/);
  assert.match(adminAddStaff, /data-admin-role-quick-picks="true"/);
  assert.match(adminAddStaff, /data-admin-role-pick="program_teacher"/);
  assert.match(adminAddStaff, /data-admin-role-pick="administration"/);
  assert.match(adminAddStaff, /data-admin-role-pick="site_admin"/);
  assert.match(adminAddStaff, /data-admin-role-pick="global_admin"/);
  assert.match(adminAddStaff, /Staff role[\s\S]*Status[\s\S]*Site \/ school[\s\S]*Program[\s\S]*Assigned students/);
  assert.match(adminAddStaff, /Admin note/);
  assert.match(adminAddStaff, /data-destructive-confirmation="staff-create-delivery"/);
  assert.match(adminAddStaff, /Create staff member/);
  assert.doesNotMatch(adminAddStaff, /<option value="sso">SSO account<\/option>/);
});

test("workspace scopes Users & Access GUI controls for School Admin and Program Teacher", async () => {
  const schoolAdminAccess = siteAccessAssignmentsFixture();
  schoolAdminAccess.permissions = {
    ...schoolAdminAccess.permissions,
    canAssignMentors: true,
    canAssignViewers: true,
    canAssignProgramTeachers: true,
    canAssignAdministration: false,
    canAssignSiteAdmins: false,
    canCreateGlobalAdmin: false,
  };
  const schoolAdminRoutes = {
    ...profileRoutesForRole("administration"),
    "/api/site/access-assignments": { status: 200, body: schoolAdminAccess },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "administration", readOnly: false, canManage: true }) },
  };
  const schoolAdmin = await renderWorkspaceWithFetch(schoolAdminRoutes, "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-staff",
  });

  assert.match(schoolAdmin, /data-people-management="true"/);
  assert.match(schoolAdmin, /data-people-view="add-staff"/);
  assert.match(schoolAdmin, /data-admin-role-pick="mentor"/);
  assert.match(schoolAdmin, /data-admin-role-pick="viewer"/);
  assert.match(schoolAdmin, /data-admin-role-pick="program_teacher"/);
  assert.doesNotMatch(schoolAdmin, /data-admin-role-pick="student"|data-admin-role-pick="administration"|data-admin-role-pick="site_admin"|data-admin-role-pick="global_admin"/);
  assert.match(schoolAdmin, /Staff role[\s\S]*Status[\s\S]*Site \/ school[\s\S]*Program[\s\S]*Assigned students/);
  assert.match(schoolAdmin, /data-assignment-type="mentor_student"/);
  assert.match(schoolAdmin, /data-assignment-type="viewer_student"/);
  assert.match(schoolAdmin, /data-assignment-type="program_teacher_program"/);
  assert.doesNotMatch(schoolAdmin, /data-assignment-type="administration_site"|data-assignment-type="site_admin_site"/);
  assert.equal((schoolAdmin.match(/data-admin-account-remove-form="true"/g) || []).length, 4);

  const schoolAdminStudent = await renderWorkspaceWithFetch(schoolAdminRoutes, "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-student",
  });
  assert.match(schoolAdminStudent, /data-people-view="add-student"/);
  assert.match(schoolAdminStudent, /data-admin-add-person-form="true" data-person-kind="student"/);
  assert.match(schoolAdminStudent, /<input type="hidden" name="roleId" value="student">/);
  assert.match(schoolAdminStudent, /Site \/ school[\s\S]*Program[\s\S]*Status/);

  const programTeacherAccess = siteAccessAssignmentsFixture();
  programTeacherAccess.permissions = {
    ...programTeacherAccess.permissions,
    canAssignMentors: true,
    canAssignViewers: false,
    canAssignProgramTeachers: false,
    canAssignAdministration: false,
    canAssignSiteAdmins: false,
    canCreateGlobalAdmin: false,
  };
  const programTeacherRoutes = {
    ...profileRoutesForRole("program_teacher"),
    "/api/site/access-assignments": { status: 200, body: programTeacherAccess },
    "/api/site/mentor-assignments": { status: 200, body: siteMentorAssignmentsFixture({ role: "program_teacher", readOnly: false, canManage: true }) },
  };
  const programTeacher = await renderWorkspaceWithFetch(programTeacherRoutes, "adminUsers");

  assert.match(programTeacher, /data-admin-role-pick="student"/);
  assert.match(programTeacher, /data-admin-role-pick="mentor"/);
  assert.doesNotMatch(programTeacher, /data-admin-role-pick="viewer"|data-admin-role-pick="program_teacher"|data-admin-role-pick="administration"|data-admin-role-pick="site_admin"|data-admin-role-pick="global_admin"/);
  assert.match(programTeacher, /data-assignment-type="mentor_student"/);
  assert.doesNotMatch(programTeacher, /data-assignment-type="viewer_student"|data-assignment-type="program_teacher_program"|data-assignment-type="administration_site"|data-assignment-type="site_admin_site"/);
  assert.equal((programTeacher.match(/data-admin-account-remove-form="true"/g) || []).length, 2);
});

test("workspace renders visible role identity for every logged-in role", async () => {
  const roles = [
    ["student", "Student"],
    ["viewer", "Viewer"],
    ["mentor", "Mentor"],
    ["program_teacher", "Program Teacher"],
    ["administration", "Administration"],
    ["site_admin", "Site Admin"],
    ["global_admin", "Global Admin"],
  ];

  for (const [roleId, label] of roles) {
    const markup = await renderWorkspaceWithFetch(profileRoutesForRole(roleId));
    assert.match(markup, new RegExp(`data-primary-role="${escapeRegExp(roleId)}"`), `${roleId} primary role marker`);
    assert.match(markup, /data-active-role-badge="true"/, `${roleId} active role badge`);
    assert.match(markup, new RegExp(`data-role-identity="${escapeRegExp(roleId)}"`), `${roleId} role identity marker`);
    assert.match(markup, new RegExp(`Active role:\\s*${escapeRegExp(label)}|${escapeRegExp(label)}[\\s\\S]*Active role`), `${roleId} visible role text`);
    assert.doesNotMatch(markup, /data-role-command-strip="true"/, `${roleId} role command strip removed from landing`);
    assert.match(markup, /workspace-product-header/, `${roleId} product header`);
    if (roleId === "student") {
      assert.match(markup, /data-experience="student"/);
      assert.match(markup, /My Capstone/);
    } else {
      assert.match(markup, /data-experience="staff-workspace"/);
      assert.match(markup, /Staff Workspace/);
    }
    assert.doesNotMatch(visibleText(markup), /Role context|Demo boundary|working profile|What this role can manage or monitor/, `${roleId} no role-proof landing text`);
  }

  for (const roleId of ["student", "viewer", "mentor", "program_teacher", "administration", "site_admin", "global_admin"]) {
    assert.match(workspaceCss, new RegExp(`data-primary-role="${escapeRegExp(roleId)}"[\\s\\S]*--role-accent`), `${roleId} role accent CSS`);
  }
  assert.match(workspaceCss, /@media \(max-width: 900px\)[\s\S]*\.workspace-active-role-badge/, "role badge must have mobile handling");
});

test("People management screens stay limited to Global Admin, Site Admin, and Administration", async () => {
  for (const roleId of ["global_admin", "site_admin", "administration"]) {
    const markup = await renderWorkspaceWithFetch(profileRoutesForRole(roleId), "adminUsers", "", {
      url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers",
    });
    assert.match(markup, /data-people-management="true"/, `${roleId} sees People management`);
    assert.match(markup, /data-people-nav="true"/, `${roleId} sees People nav`);
    assert.match(markup, /Add Student/);
    assert.match(markup, /Add Staff/);
    assert.match(markup, /Import Students/);
    assert.match(markup, /Import Staff/);
    assert.match(markup, /Manage Students/);
    assert.match(markup, /Manage Staff/);
    assert.match(markup, /data-people-screen="manage-students"/);
    assert.match(markup, /data-manage-student-row="demo-student-101"/);
    assert.match(markup, /View as Student/);
  }

  const siteAdminStaff = await renderWorkspaceWithFetch(profileRoutesForRole("site_admin"), "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-staff",
  });
  assert.match(siteAdminStaff, /data-people-view="add-staff"/);
  assert.match(siteAdminStaff, /data-admin-role-pick="administration"/, "site admin can create scoped Administration");
  assert.doesNotMatch(siteAdminStaff, /data-admin-role-pick="global_admin"/, "site admin cannot create Global Admin");

  const administrationStaff = await renderWorkspaceWithFetch(profileRoutesForRole("administration"), "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-staff",
  });
  assert.match(administrationStaff, /data-people-view="add-staff"/);
  assert.match(administrationStaff, /data-admin-role-pick="mentor"/);
  assert.match(administrationStaff, /data-admin-role-pick="viewer"/);
  assert.match(administrationStaff, /data-admin-role-pick="program_teacher"/);
  assert.doesNotMatch(administrationStaff, /data-admin-role-pick="student"|data-admin-role-pick="administration"|data-admin-role-pick="site_admin"|data-admin-role-pick="global_admin"/);

  const administrationStudent = await renderWorkspaceWithFetch(profileRoutesForRole("administration"), "adminUsers", "", {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=add-student",
  });
  assert.match(administrationStudent, /data-people-view="add-student"/);
  assert.match(administrationStudent, /<input type="hidden" name="roleId" value="student">/);

  const deniedRoles = ["program_teacher", "mentor", "viewer", "student"];
  for (const roleId of deniedRoles) {
    const markup = await renderWorkspaceWithFetch(profileRoutesForRole(roleId), "", "", {
      url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=import-students",
    });
    assert.doesNotMatch(markup, /data-people-management="true"/, `${roleId} must not see broad People management`);
    assert.doesNotMatch(markup, /data-csv-import-kind="students"|Download CSV template|data-people-screen="add-student"|data-people-screen="add-staff"/, `${roleId} must not reach import/add screens`);
  }
});

test("People CSV import screens provide templates and row-level preview validation", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch(profileRoutesForRole("site_admin"), {
    url: "https://workspace.example/workspace.html?mode=admin&section=adminUsers&peopleView=import-students",
  });

  vm.runInContext(`
    currentUser = ${JSON.stringify(userForRoleProfile("site_admin"))};
    currentData = defaultCurrentData({ ok: true, body: ${JSON.stringify(authConfigFixture())} });
    currentData.authConfig = { ok: true, body: ${JSON.stringify(authConfigFixture())} };
    currentData.accessAssignments = { ok: true, body: ${JSON.stringify(siteAccessAssignmentsFixture())} };
    currentData.sitePrograms = { ok: true, body: ${JSON.stringify(siteProgramsFixture())} };
    currentData.siteStudents = { ok: true, body: ${JSON.stringify(siteStudentsFixture({ role: "site_admin" }))} };
    currentData.reviewQueue = { ok: true, body: ${JSON.stringify(siteReviewQueueFixture({ role: "site_admin", readOnly: true }))} };
  `, context);
  vm.runInContext(`
    activeWorkspaceMode = "admin";
    activeSection = "adminImports";
    adminPeopleView = "import-students";
    renderAppShell();
  `, context);
  const importShelfMarkup = workspaceRoot.innerHTML;
  assert.match(importShelfMarkup, /data-admin-import-template-shelf="true"/);
  assert.match(importShelfMarkup, /data-admin-import-template="students"[\s\S]*Required[\s\S]*data-csv-template-column="first_name" data-csv-template-column-required="true"[\s\S]*data-csv-template-column="program" data-csv-template-column-required="true"/);
  assert.match(importShelfMarkup, /data-admin-import-template="students"[\s\S]*Optional[\s\S]*data-csv-template-column="mentor_email" data-csv-template-column-required="false"[\s\S]*data-csv-template-column="viewer_email" data-csv-template-column-required="false"/);
  assert.match(importShelfMarkup, /data-admin-import-template="staff"[\s\S]*Staff imports cannot create Global Admin or student rows/);
  assert.match(importShelfMarkup, /Unsupported columns are blocked so data is not silently ignored/);

  vm.runInContext(`
    activeSection = "adminUsers";
    adminPeopleView = "import-students";
    renderAppShell();
  `, context);

  assert.match(workspaceRoot.innerHTML, /data-people-view="import-students"/);
  assert.match(workspaceRoot.innerHTML, /data-csv-template-download="students"/);
  assert.match(workspaceRoot.innerHTML, /data-csv-import-stepper="students"/);
  assert.match(workspaceRoot.innerHTML, /Before you import[\s\S]*Download the template[\s\S]*Preview validation[\s\S]*Confirm only valid rows/);
  assert.match(workspaceRoot.innerHTML, /Mentor and Viewer emails must already exist in the current roster/);
  assert.match(workspaceRoot.innerHTML, /first_name[\s\S]*last_name[\s\S]*mentor_email[\s\S]*viewer_email/);
  assert.match(workspaceRoot.innerHTML, /data-csv-preview="students" data-csv-preview-state="waiting"/);
  assert.equal(
    vm.runInContext('csvTemplateForKind("students").split("\\n")[0]', context),
    vm.runInContext('csvTemplateColumnsForKind("students").join(",")', context),
  );
  assert.equal(
    vm.runInContext('csvTemplateForKind("staff").split("\\n")[0]', context),
    vm.runInContext('csvTemplateColumnsForKind("staff").join(",")', context),
  );

  vm.runInContext(`
    adminCsvImportState.students = validateAdminCsvImport("students", ${JSON.stringify([
      "first_name,last_name,email,site,program,cohort,graduation_year,status,mentor_email,viewer_email",
      "Ada,Lovelace,ada.student@senior-capstone.test,Desert Valley High School,Information Technology,Class of 2026,2026,active,mentor.one@demo-staff.capstone.test,viewer.one@demo-staff.capstone.test",
    ].join("\n"))});
    adminPeopleView = "import-students";
    activeSection = "adminUsers";
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-csv-preview="students" data-csv-preview-state="ready"/);
  assert.match(workspaceRoot.innerHTML, /Rows detected[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /Valid rows[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /Rows with errors[\s\S]*0/);
  assert.match(workspaceRoot.innerHTML, /New records[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /Mentor assignments[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /Viewer assignments[\s\S]*1/);
  assert.match(workspaceRoot.innerHTML, /Previewed mentor\/viewer assignments are created during import/);
  const studentCsvUser = vm.runInContext("adminCsvImportState.students.validRows[0].user", context);
  assert.equal(studentCsvUser.cohort, "Class of 2026");
  assert.equal(studentCsvUser.graduationYear, "2026");
  assert.equal(studentCsvUser.mentorUserId, "demo-mentor-001");
  assert.equal(studentCsvUser.viewerUserId, "demo-viewer-001");

  vm.runInContext(`
    adminCsvImportState.students = validateAdminCsvImport("students", ${JSON.stringify([
      "first_name,last_name,email,site,program,cohort,graduation_year,status,mentor_email,viewer_email",
      "Sam,Student,sam.student@senior-capstone.test,Desert Valley High School,Information Technology,Class of 2026,2026,active,missing.mentor.001@demo-student.capstone.test,viewer.one@demo-staff.capstone.test",
      "Out,Scope,outside.student@senior-capstone.test,Desert Valley High School,Information Technology,Class of 2026,2026,active,outside.mentor@demo-staff.capstone.test,viewer.one@demo-staff.capstone.test",
    ].join("\n"))});
    adminPeopleView = "import-students";
    activeSection = "adminUsers";
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-csv-preview="students" data-csv-preview-state="errors"/);
  assert.match(workspaceRoot.innerHTML, /Student users cannot be assigned as mentors/);
  assert.match(workspaceRoot.innerHTML, /Mentor email must already exist in the current roster before automatic assignment/);

  vm.runInContext(`
    adminCsvImportState.students = validateAdminCsvImport("students", ${JSON.stringify([
      "first_name,last_name,email,site,program,guardian_phone",
      "Header,Drift,header.drift@senior-capstone.test,Desert Valley High School,Information Technology,555-0100",
    ].join("\n"))});
    adminPeopleView = "import-students";
    activeSection = "adminUsers";
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-csv-preview="students" data-csv-preview-state="errors"/);
  assert.match(workspaceRoot.innerHTML, /Unsupported column: guardian_phone/);
  assert.equal(vm.runInContext("adminCsvImportState.students.validRows.length", context), 0);

  vm.runInContext(`
    adminCsvImportState.staff = validateAdminCsvImport("staff", ${JSON.stringify([
      "first_name,last_name,email,role,site,program,assigned_student_emails,status",
      "Maya,Rivera,maya.staff@senior-capstone.test,mentor,Desert Valley High School,,missing.mentor.001@demo-student.capstone.test,active",
    ].join("\n"))});
    adminPeopleView = "import-staff";
    activeSection = "adminUsers";
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-csv-template-download="staff"/);
  assert.match(workspaceRoot.innerHTML, /data-csv-import-stepper="staff"/);
  assert.match(workspaceRoot.innerHTML, /Staff assignments must match an existing school, program, or assigned student/);
  assert.match(workspaceRoot.innerHTML, /data-csv-preview="staff" data-csv-preview-state="ready"/);
  assert.match(workspaceRoot.innerHTML, /Valid rows[\s\S]*1/);

  vm.runInContext(`
    adminCsvImportState.staff = validateAdminCsvImport("staff", ${JSON.stringify([
      "first_name,last_name,email,role,site,program,assigned_student_emails,status",
      "Gina,Global,gina.global@senior-capstone.test,global_admin,Desert Valley High School,,,active",
      "Stu,Dent,student.staff@senior-capstone.test,student,Desert Valley High School,,,active",
      "Out,Scope,out.scope@senior-capstone.test,mentor,Other School,,missing.mentor.001@demo-student.capstone.test,active",
    ].join("\n"))});
    adminPeopleView = "import-staff";
    activeSection = "adminUsers";
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-csv-preview="staff" data-csv-preview-state="errors"/);
  assert.match(workspaceRoot.innerHTML, /CSV import cannot create Global Admin accounts/);
  assert.match(workspaceRoot.innerHTML, /Use Import Students for student rows/);
  assert.match(workspaceRoot.innerHTML, /Site is not in your current scope|Mentor and Viewer rows need a site or assigned students/);
});

test("workspace renders recent role assignments for global admins before site access forms", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-role-admin",
          email: "global.roles@example.edu",
          displayName: "Global Role Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
      status: 200,
      body: siteAccessAssignmentsFixture(),
    },
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [
          {
            userId: "global-target",
            userName: "Global Access Lead",
            roleId: "global_admin",
            scopeType: "global",
            scopeId: "",
            assignedByName: "Platform Owner",
            assignedAt: "2026-06-02T20:15:00.000Z",
          },
          {
            userId: "teacher-target",
            userName: "Program Scope Teacher",
            roleId: "program_teacher",
            scopeType: "program",
            scopeId: "it",
            scopeSiteIds: ["site-desert-valley-high"],
            assignedByName: "Program Director",
            assignedAt: "2026-06-02T19:10:00.000Z",
          },
          {
            userId: "admin-target",
            userName: "Site Access Principal",
            roleId: "administration",
            scopeType: "site",
            scopeId: "site-desert-valley-high",
            assignedByName: "Global Access Lead",
            assignedAt: "2026-06-02T18:05:00.000Z",
          },
        ],
      },
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

  assert.match(adminUsers, /data-admin-role-assignments="true"/);
  assert.match(adminUsers, /Recent role assignments/);
  assert.match(adminUsers, /data-workspace-disclosure-panel="usersAccess:roleAssignments"/);
  assert.match(adminUsers, /aria-expanded="false"/);
  assert.doesNotMatch(adminUsers, /Global Access Lead|Program Scope Teacher|Site Access Principal/);

  openWorkspaceDisclosure(context, "usersAccess", "roleAssignments");
  const adminUsersWithRoles = workspaceRoot.innerHTML;
  assert.match(adminUsersWithRoles, /Global Access Lead/);
  assert.match(adminUsersWithRoles, /Global Admin \/ All schools/);
  assert.match(adminUsersWithRoles, /Assigned by Platform Owner/);
  assert.match(adminUsersWithRoles, /Program Scope Teacher/);
  assert.match(adminUsersWithRoles, /Program Teacher \/ Program access \/ Information Technology/);
  assert.match(adminUsersWithRoles, /Assigned by Program Director/);
  assert.match(adminUsersWithRoles, /data-role-assignment-action="open-program-students"/);
  assert.match(adminUsersWithRoles, /Site Access Principal/);
  assert.match(adminUsersWithRoles, /School Admin \/ Site access \/ Desert Valley High School/);
  assert.match(adminUsersWithRoles, /Assigned by Global Access Lead/);
  assert.match(adminUsersWithRoles, /<span class="workspace-chip">Current school<\/span>/);
  assertMarkupOrder(adminUsers, "Recent role assignments", "data-site-access-assignment-form", "recent role assignments should render before assignment forms");
});

test("workspace guides multi-site admins to choose a school before managing site access", async () => {
  const adminUsers = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-site-selection",
          email: "global.selection@example.edu",
          displayName: "Global Selection Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
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
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [],
      },
    },
    "/api/presentation-slots": {
      status: 200,
      body: { ok: true, slots: [] },
    },
    "/api/reports/readiness": {
      status: 200,
      body: { ok: true, scope: "all-programs", metrics: {} },
    },
  }, "adminUsers");

  assert.match(adminUsers, /data-admin-role-assignments="true"/);
  assert.match(adminUsers, /Recent role assignments/);
  assert.match(adminUsers, /data-workspace-state="access-assignment-site-selection-required"/);
  assert.match(adminUsers, /Select a site before managing school access/);
  assert.match(adminUsers, /data-site-switch-id="site-desert-valley-high"/);
  assert.match(adminUsers, /data-site-switch-id="site-canyon-ridge-career"/);
  assert.match(adminUsers, /Choose a site from the Current site menu/);
  assert.match(adminUsers, /workspace-problem-state/);
  assert.match(adminUsers, /data-problem-state-actions="true"/);
  assert.match(adminUsers, /data-problem-action="refresh"[\s\S]*Refresh workspace/);
  assert.match(adminUsers, /data-section="profile"[\s\S]*Review profile/);
  assert.match(adminUsers, /data-section="security"[\s\S]*Open Security/);
  assert.doesNotMatch(adminUsers, /Manage Site Access|data-site-access-assignment-form/);
});

test("workspace uses route-backed scope names in recent role assignments without a current site selection", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-route-scopes",
          email: "global.scopes@example.edu",
          displayName: "Global Scope Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
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
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [
          {
            userId: "site-scope-principal",
            userName: "Site Scope Principal",
            roleId: "administration",
            scopeType: "site",
            scopeId: "site-canyon-ridge-career",
            scopeName: "Canyon Ridge Career Academy",
            assignedByName: "Global Scope Admin",
            assignedAt: "2026-06-02T18:05:00.000Z",
          },
          {
            userId: "program-scope-teacher",
            userName: "Program Scope Teacher",
            roleId: "program_teacher",
            scopeType: "program",
            scopeId: "biotech",
            scopeName: "Biotechnology",
            scopeSiteIds: ["site-desert-valley-high"],
            assignedByName: "Global Scope Admin",
            assignedAt: "2026-06-02T19:10:00.000Z",
          },
          {
            userId: "cohort-scope-teacher",
            userName: "Cohort Scope Teacher",
            roleId: "program_teacher",
            scopeType: "cohort",
            scopeId: "spring-showcase",
            scopeName: "Spring Showcase Cohort",
            assignedByName: "Global Scope Admin",
            assignedAt: "2026-06-02T20:15:00.000Z",
          },
        ],
      },
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
  openWorkspaceDisclosure(context, "usersAccess", "roleAssignments");

  const adminUsers = workspaceRoot.innerHTML;
  assert.match(adminUsers, /Site Scope Principal/);
  assert.match(adminUsers, /Site Scope Principal[\s\S]*School Admin \/ Site access \/ Canyon Ridge Career Academy/);
  assert.match(adminUsers, /Site Scope Principal[\s\S]*Assigned by Global Scope Admin/);
  assert.match(adminUsers, /data-site-switch-id="site-canyon-ridge-career"/);
  assert.match(adminUsers, /Program Scope Teacher[\s\S]*Program Teacher \/ Program access \/ Biotechnology/);
  assert.match(adminUsers, /Program Scope Teacher[\s\S]*data-role-assignment-action="open-program-students"/);
  assert.match(adminUsers, /Cohort Scope Teacher[\s\S]*Program Teacher \/ Cohort access \/ Spring Showcase Cohort/);
  assert.doesNotMatch(adminUsers, /<span class="workspace-chip">Current school<\/span>/);
  assert.doesNotMatch(adminUsers, /Site access \/ site-canyon-ridge-career|Program access \/ biotech|Cohort access \/ spring-showcase|current_site|current_program|current_cohort/);
});

test("program-scoped role assignments open the filtered student list when one accessible school matches", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-program-handoff",
          email: "global.programs@example.edu",
          displayName: "Global Program Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
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
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [
          {
            userId: "program-scope-teacher",
            userName: "Program Scope Teacher",
            roleId: "program_teacher",
            scopeType: "program",
            scopeId: "it",
            scopeName: "Information Technology",
            scopeSiteIds: ["site-desert-valley-high"],
            assignedByName: "Global Program Admin",
            assignedAt: "2026-06-03T00:52:00.000Z",
          },
        ],
      },
    },
    "/api/site/students": ({ url }) => {
      const parsed = new URL(url);
      return {
        status: 200,
        body: siteStudentsFixture({
          filters: {
            search: "",
            programId: parsed.searchParams.get("programId") || "",
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
        }),
      };
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
  openWorkspaceDisclosure(context, "usersAccess", "roleAssignments");
  assert.match(workspaceRoot.innerHTML, /data-role-assignment-action="open-program-students"/);

  await vm.runInContext(
    'handleRoleAssignmentAction({ currentTarget: { dataset: { roleAssignmentAction: "open-program-students", roleAssignmentSiteId: "site-desert-valley-high", roleAssignmentProgramId: "it" } } })',
    context,
  );

  const studentsUrl = new URL(window.location.href);
  assert.equal(studentsUrl.searchParams.get("section"), "students");
  assert.equal(studentsUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(studentsUrl.searchParams.get("programId"), "it");
  assert.ok(fetchLog.includes("/api/site/students?siteId=site-desert-valley-high&programId=it"));
});

test("cohort-scoped role assignments open the filtered student list when one accessible school matches", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-cohort-handoff",
          email: "global.cohorts@example.edu",
          displayName: "Global Cohort Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
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
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [
          {
            userId: "cohort-scope-teacher",
            userName: "Cohort Scope Teacher",
            roleId: "program_teacher",
            scopeType: "cohort",
            scopeId: "cohort-it-2026",
            scopeName: "IT 2026",
            scopeSiteIds: ["site-desert-valley-high"],
            assignedByName: "Global Cohort Admin",
            assignedAt: "2026-06-03T01:26:00.000Z",
          },
        ],
      },
    },
    "/api/site/students": ({ url }) => {
      const parsed = new URL(url);
      return {
        status: 200,
        body: siteStudentsFixture({
          filters: {
            search: "",
            programId: "",
            cohortId: parsed.searchParams.get("cohortId") || "",
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
        }),
      };
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
  openWorkspaceDisclosure(context, "usersAccess", "roleAssignments");
  assert.match(workspaceRoot.innerHTML, /data-role-assignment-action="open-cohort-students"/);

  await vm.runInContext(
    'handleRoleAssignmentAction({ currentTarget: { dataset: { roleAssignmentAction: "open-cohort-students", roleAssignmentSiteId: "site-desert-valley-high", roleAssignmentCohortId: "cohort-it-2026" } } })',
    context,
  );

  const studentsUrl = new URL(window.location.href);
  assert.equal(studentsUrl.searchParams.get("section"), "students");
  assert.equal(studentsUrl.searchParams.get("siteId"), "site-desert-valley-high");
  assert.equal(studentsUrl.searchParams.get("cohortId"), "cohort-it-2026");
  assert.ok(fetchLog.includes("/api/site/students?siteId=site-desert-valley-high&cohortId=cohort-it-2026"));
  assert.match(workspaceRoot.innerHTML, /Showing students in the assigned cohort\./);
});

test("multi-school program role assignments render exact school choices and open the selected student list", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-program-multisite",
          email: "global.program.multisite@example.edu",
          displayName: "Global Program Multisite Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
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
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [
          {
            userId: "program-scope-teacher",
            userName: "Program Scope Teacher",
            roleId: "program_teacher",
            scopeType: "program",
            scopeId: "it",
            scopeName: "Information Technology",
            scopeSiteIds: ["site-desert-valley-high", "site-canyon-ridge-career"],
            assignedByName: "Global Program Multisite Admin",
            assignedAt: "2026-06-03T02:08:00.000Z",
          },
        ],
      },
    },
    "/api/site/students": ({ url }) => {
      const parsed = new URL(url);
      return {
        status: 200,
        body: siteStudentsFixture({
          filters: {
            search: "",
            programId: parsed.searchParams.get("programId") || "",
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
        }),
      };
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
  openWorkspaceDisclosure(context, "usersAccess", "roleAssignments");
  assert.match(workspaceRoot.innerHTML, /Choose school/);
  assert.match(workspaceRoot.innerHTML, /Desert Valley High School/);
  assert.match(workspaceRoot.innerHTML, /Canyon Ridge Career Academy/);

  await vm.runInContext(
    'handleRoleAssignmentAction({ currentTarget: { dataset: { roleAssignmentAction: "open-program-students", roleAssignmentSiteId: "site-canyon-ridge-career", roleAssignmentProgramId: "it" } } })',
    context,
  );

  const studentsUrl = new URL(window.location.href);
  assert.equal(studentsUrl.searchParams.get("section"), "students");
  assert.equal(studentsUrl.searchParams.get("siteId"), "site-canyon-ridge-career");
  assert.equal(studentsUrl.searchParams.get("programId"), "it");
  assert.ok(fetchLog.includes("/api/site/students?siteId=site-canyon-ridge-career&programId=it"));
  assert.match(workspaceRoot.innerHTML, /Showing students in the assigned program\./);
});

test("multi-school cohort role assignments render exact school choices and open the selected student list", async () => {
  const { context, workspaceRoot, fetchLog, window } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "global-admin-cohort-multisite",
          email: "global.cohort.multisite@example.edu",
          displayName: "Global Cohort Multisite Admin",
          roles: [{ role_id: "admin", scope_type: "global", scope_id: "" }],
        },
      },
    },
    "/api/site/access-assignments": {
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
    "/api/admin/role-assignments": {
      status: 200,
      body: {
        ok: true,
        assignments: [
          {
            userId: "cohort-scope-teacher",
            userName: "Cohort Scope Teacher",
            roleId: "program_teacher",
            scopeType: "cohort",
            scopeId: "cohort-it-2026",
            scopeName: "IT 2026",
            scopeSiteIds: ["site-desert-valley-high", "site-canyon-ridge-career"],
            assignedByName: "Global Cohort Multisite Admin",
            assignedAt: "2026-06-03T02:11:00.000Z",
          },
        ],
      },
    },
    "/api/site/students": ({ url }) => {
      const parsed = new URL(url);
      return {
        status: 200,
        body: siteStudentsFixture({
          filters: {
            search: "",
            programId: "",
            cohortId: parsed.searchParams.get("cohortId") || "",
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
        }),
      };
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
  openWorkspaceDisclosure(context, "usersAccess", "roleAssignments");
  assert.match(workspaceRoot.innerHTML, /Choose school/);
  assert.match(workspaceRoot.innerHTML, /Desert Valley High School/);
  assert.match(workspaceRoot.innerHTML, /Canyon Ridge Career Academy/);

  await vm.runInContext(
    'handleRoleAssignmentAction({ currentTarget: { dataset: { roleAssignmentAction: "open-cohort-students", roleAssignmentSiteId: "site-canyon-ridge-career", roleAssignmentCohortId: "cohort-it-2026" } } })',
    context,
  );

  const studentsUrl = new URL(window.location.href);
  assert.equal(studentsUrl.searchParams.get("section"), "students");
  assert.equal(studentsUrl.searchParams.get("siteId"), "site-canyon-ridge-career");
  assert.equal(studentsUrl.searchParams.get("cohortId"), "cohort-it-2026");
  assert.ok(fetchLog.includes("/api/site/students?siteId=site-canyon-ridge-career&cohortId=cohort-it-2026"));
  assert.match(workspaceRoot.innerHTML, /Showing students in the assigned cohort\./);
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
  assert.match(adminUsers, /data-site-access-removal-warning="true"/);
  assert.match(adminUsers, /data-destructive-confirmation="account-remove"/);
  assert.match(adminUsers, /I reviewed what account removal does for this person/);
  assert.match(adminUsers, /Active Assignments/);
  assert.match(adminUsers, /Use these rows to confirm current access before saving changes below/);
  assert.match(adminUsers, /Mentor student coverage/);
  assert.match(adminUsers, /Mentor One/);
  assert.match(adminUsers, /Missing Mentor Demo 001/);
  assert.match(adminUsers, /Viewer student access/);
  assert.match(adminUsers, /Read-only Viewer/);
  assert.match(adminUsers, /Viewer access is read-only and limited to this student/);
  assert.match(adminUsers, /Program Teacher access/);
  assert.match(adminUsers, /Program Teacher One/);
  assert.match(adminUsers, /Information Technology/);
  assert.match(adminUsers, /School admin access/);
  assert.match(adminUsers, /Principal One/);
  assert.match(adminUsers, /Desert Valley High School/);
  assert.match(adminUsers, /No site admin access is active for this school/);
  assert.match(adminUsers, /data-site-access-history="true"/);
  assert.match(adminUsers, /Recent access changes/);
  assert.match(adminUsers, /data-workspace-disclosure-panel="usersAccess:history"/);
  assert.match(adminUsers, /aria-expanded="false"/);
  assert.doesNotMatch(adminUsers, /Viewer access assigned|Program Teacher access removed|Platform Admin/);
  openWorkspaceDisclosure(context, "usersAccess", "history");
  const adminUsersWithHistory = workspaceRoot.innerHTML;
  assert.match(adminUsersWithHistory, /aria-expanded="true"/);
  assert.match(adminUsersWithHistory, /Viewer access assigned/);
  assert.match(adminUsersWithHistory, /Site Access Admin/);
  assert.match(adminUsersWithHistory, /Program Teacher access removed/);
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
  assert.match(programs, /data-site-programs-setup-flow="true"/);
  assert.match(programs, /Program setup order/);
  assert.match(programs, /Review before save/);
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
  assert.match(emptyPrograms, /data-site-programs-setup-state="ready"/);
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
    adminPeopleView = "add-student";
    renderAppShell();
  `, context);
  assert.match(workspaceRoot.innerHTML, /data-people-view="add-student"/);
  assert.match(workspaceRoot.innerHTML, /data-destructive-confirmation="student-create-delivery"/);
  assert.match(workspaceRoot.innerHTML, /I reviewed the role, school scope, and setup-password delivery process/);
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
  assert.match(nonAdminImport, /Access to Users &amp; Access is limited/);
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
  assert.match(readiness, /data-readiness-action-map="aggregate"/);
  assert.match(readiness, /Read the report safely/);
  assert.match(readiness, /data-readiness-action-map-card="score"/);
  assert.match(readiness, /data-readiness-action-map-card="submitted"/);
  assert.match(readiness, /data-readiness-action-map-card="revision"/);
  assert.match(readiness, /data-readiness-action-map-card="proof"/);
  assert.match(readiness, /data-readiness-action-map-card="final-files"/);
  assert.match(readiness, /data-readiness-action-map-card="privacy"/);
  assert.match(readiness, /Report signal/);
  assert.match(readiness, /Summary only/);
  assert.match(readiness, /Private proof hidden/);
  assert.match(readiness, /Keep this report aggregate/);
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
  const { context, workspaceRoot, window } = await createWorkspaceContextWithFetch({
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
            id: "slot-outline-pending-scheduled",
            studentName: "Riley Student",
            scheduledFor: "2026-03-26T16:45:00.000Z",
            durationMinutes: 15,
            location: "Room 104",
            status: "scheduled",
            outlineStatus: "pending",
            checkedOutAt: null,
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
  }, { url: "https://workspace.example/workspace.html?section=presentation" });

  vm.runInContext('activeSection = "presentation"; renderAppShell();', context);
  const presentation = workspaceRoot.innerHTML;
  assert.match(presentation, /data-presentation-schedule="true"/);
  assert.match(presentation, /workspace-presentation-dashboard/);
  assert.match(presentation, /Presentation readiness score/);
  assert.match(presentation, /Presentation stage breakdown/);
  assert.match(presentation, /Needs action worklist/);
  assert.match(presentation, /data-presentation-filters="true"/);
  assert.match(presentation, /data-presentation-filter="all"/);
  assert.match(presentation, /All \(4\)/);
  assert.match(presentation, /Ready for check-out \(1\)/);
  assert.match(presentation, /Checked out \(1\)/);
  assert.match(presentation, /Checked in \(1\)/);
  assert.match(presentation, /Outline follow-up \(2\)/);
  assert.match(presentation, /data-presentation-state="scheduled"/);
  assert.match(presentation, /data-presentation-state="checked_out"/);
  assert.match(presentation, /Maya Student/);
  assert.match(presentation, /Jordan Student/);
  assert.match(presentation, /Riley Student/);
  assert.match(presentation, /Sam Student/);
  assert.match(presentation, /Room 101/);
  assert.match(presentation, /Outline[\s\S]*Approved/);
  assert.doesNotMatch(presentation, /data-mentor-presentation-prep="true"/);
  assert.match(presentation, /Outline approval needed/);
  assert.match(presentation, /data-presentation-action="check-out"/);
  assert.match(presentation, /data-presentation-action="check-in"/);

  vm.runInContext('handlePresentationFilterAction({ currentTarget: { dataset: { presentationFilterAction: "scheduled" } } })', context);
  const scheduledOnly = workspaceRoot.innerHTML;
  assert.match(scheduledOnly, /data-presentation-filter="scheduled"/);
  assert.match(scheduledOnly, /Maya Student/);
  assert.doesNotMatch(scheduledOnly, /Jordan Student|Riley Student|Sam Student/);
  assert.match(scheduledOnly, /data-presentation-action="check-out"/);
  assert.match(window.location.href, /section=presentation/);
  assert.match(window.location.href, /presentationFocus=scheduled/);

  vm.runInContext('handlePresentationFilterAction({ currentTarget: { dataset: { presentationFilterAction: "outline_follow_up" } } })', context);
  const outlineOnly = workspaceRoot.innerHTML;
  assert.match(outlineOnly, /data-presentation-filter="outline_follow_up"/);
  assert.match(outlineOnly, /Riley Student/);
  assert.match(outlineOnly, /Sam Student/);
  assert.match(outlineOnly, /Pending/);
  assert.match(outlineOnly, /Revision needed/);
  assert.doesNotMatch(outlineOnly, /Maya Student|Jordan Student/);
  assert.match(window.location.href, /presentationFocus=outline_follow_up/);

  vm.runInContext('handlePresentationFilterAction({ currentTarget: { dataset: { presentationFilterAction: "bogus" } } })', context);
  assert.match(workspaceRoot.innerHTML, /data-presentation-filter="all"/);
  assert.doesNotMatch(window.location.href, /presentationFocus=/);

  vm.runInContext(`
    currentUser = {
      ...currentUser,
      roles: [{ role_id: "mentor", scope_type: "site", scope_id: "site-desert-valley-high" }]
    };
    renderAppShell();
  `, context);
  const mentorPresentation = workspaceRoot.innerHTML;
  assert.match(mentorPresentation, /data-mentor-presentation-prep="true"/);
  assert.match(mentorPresentation, /Mentor presentation prep/);
  assert.match(mentorPresentation, /Program Teachers still approve phase movement and outline readiness/);
});

test("student presentation screen explains time, outline, and proof in student language", async () => {
  const presentation = await renderWorkspaceWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "student-presentation",
          email: "student.presentation@example.edu",
          displayName: "Presentation Student",
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
      body: {
        ok: true,
        slots: [
          {
            id: "slot-student-revision",
            studentName: "Presentation Student",
            scheduledFor: "2026-03-26T16:00:00.000Z",
            durationMinutes: 20,
            location: "Room 101",
            status: "scheduled",
            outlineStatus: "revision_needed",
            checkedOutAt: null,
            checkedInAt: null,
          },
        ],
      },
    },
  }, "presentation");

  assert.match(presentation, /data-presentation-schedule="true"/);
  assert.match(presentation, /Presentation plan/);
  assert.match(presentation, /Your Presentation/);
  assert.match(presentation, /Check your time, room, outline status, and what still needs attention before presentation day/);
  assert.match(presentation, /data-task-finish-checklist="student-presentation"/);
  assert.match(presentation, /data-student-presentation-phase-goal="true"/);
  assert.match(presentation, /What presentation day finishes/);
  assert.match(presentation, /Phase 3A: Present/);
  assert.match(presentation, /Completed presentation with your project proof ready to show/);
  assert.match(presentation, /Practice from your approved outline/);
  assert.match(presentation, /Show what you made or learned/);
  assert.match(presentation, /Complete check-out or check-in if your school uses it/);
  assert.match(presentation, /Done when:[\s\S]*Presentation status is complete or checked in/);
  assert.match(presentation, /Before presentation day/);
  assert.match(presentation, /Know when and where/);
  assert.match(presentation, /Outline status: Revision needed/);
  assert.match(presentation, /Bring project proof/);
  assert.match(presentation, /approved outline and project proof should match the checklist work in My Work/);
  assert.match(presentation, /Presentation is about showing your work\. It does not replace missing checklist proof or Program Teacher approval/);
  assert.match(presentation, /data-student-presentation-plan="true"/);
  assert.match(presentation, /Presentation day plan/);
  assert.match(presentation, /Before, during, after/);
  assert.match(presentation, /data-student-presentation-step="before"[\s\S]*Before[\s\S]*Know your time and outline[\s\S]*Mar 26,[\s\S]*in Room 101[\s\S]*Outline: Revision needed[\s\S]*data-section="student"[\s\S]*Open My Work/);
  assert.match(presentation, /data-student-presentation-step="during"[\s\S]*During[\s\S]*Show the work you finished[\s\S]*Do not use Presentation to replace missing proof/);
  assert.match(presentation, /data-student-presentation-step="after"[\s\S]*After[\s\S]*Confirm it is recorded[\s\S]*After presenting, check that this screen shows presented or checked in[\s\S]*data-section="archive"[\s\S]*Open Final Files/);
  assert.match(presentation, /Ready to present \(0\)/);
  assert.match(presentation, /Checked out by staff \(0\)/);
  assert.match(presentation, /Presented \/ checked in \(0\)/);
  assert.match(presentation, /Outline needs work \(1\)/);
  assert.match(presentation, /Time, Room, and Status/);
  assert.match(presentation, /Your time/);
  assert.match(presentation, /Room and length/);
  assert.match(presentation, /After presentation/);
  assert.match(presentation, /Check-in appears after presentation day/);
  assert.doesNotMatch(presentation, /Needs action worklist|Schedule And Check-In|Ready for check-out|scoped presentation records|authorized staff schedule them for visible students/);
  assert.doesNotMatch(presentation, /data-presentation-action="check-out"|data-presentation-action="check-in"/);
});

test("workspace restores presentation schedule focus from URL state", async () => {
  const { context, workspaceRoot } = await createWorkspaceContextWithFetch({
    "/api/auth/me": {
      status: 200,
      body: {
        authenticated: true,
        user: {
          id: "teacher-presentation-restore",
          email: "teacher.restore@example.edu",
          displayName: "Presentation Restore Teacher",
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
            id: "slot-outline-pending-scheduled",
            studentName: "Riley Student",
            scheduledFor: "2026-03-26T16:45:00.000Z",
            durationMinutes: 15,
            location: "Room 104",
            status: "scheduled",
            outlineStatus: "pending",
            checkedOutAt: null,
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
  }, { url: "https://workspace.example/workspace.html?section=presentation&presentationFocus=checked_out" });

  assert.equal(vm.runInContext("activeSection", context), "presentation");
  assert.equal(vm.runInContext("presentationSlotFilter", context), "checked_out");
  assert.match(workspaceRoot.innerHTML, /data-presentation-filter="checked_out"/);
  assert.match(workspaceRoot.innerHTML, /Jordan Student/);
  assert.doesNotMatch(workspaceRoot.innerHTML, /Maya Student|Sam Student/);
});

test("workspace renders final-file readiness from persisted rows", async () => {
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
        nextAction: "Review final file readiness.",
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
            label: "Celebration Day proof",
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
            message: "Needs proof or staff review before final files are ready.",
          },
        ],
        archive: {
          status: "complete",
          scopedDownloadReady: true,
          signedDownloadReady: false,
          drivePackageReady: true,
          downloadUrl: "/api/exports/export-ready/download",
          downloadExpiresAt: "2026-05-05T16:00:00.000Z",
          message: "Your final file package is ready for protected download.",
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
  assert.match(archive, /Do not assume files are ready until this screen says your download is ready/);
  assert.match(archive, /Whether your final files are ready, still being prepared, blocked, expired, or waiting for staff/);
  assert.match(archive, /Blocked or failed states explain the issue; this student screen does not restart a download/);
  assert.match(archive, /Staff help status/);
  assert.match(archive, /Final files readiness score/);
  assert.match(archive, /What affects your download/);
  assert.match(archive, /Files ready/);
  assert.match(archive, /Needs action/);
  assert.match(archive, /data-student-final-files-phase-goal="true"/);
  assert.match(archive, /What final files finishes/);
  assert.match(archive, /Finish: Download and Keep/);
  assert.match(archive, /Final files downloaded and saved somewhere you can keep/);
  assert.match(archive, /Download is ready/);
  assert.match(archive, /Important files are saved/);
  assert.match(archive, /Ask staff if downloads are blocked/);
  assert.match(archive, /Done when:[\s\S]*Download is saved outside your school account/);
  assert.match(archive, /data-archive-check-status="ready"/);
  assert.match(archive, /data-archive-check-status="attention_required"/);
  assert.match(archive, /Celebration Day proof/);
  assert.match(archive, /data-archive-guidance="true"/);
  assert.match(archive, /Your download is ready/);
  assert.match(archive, /data-task-finish-checklist="student-final-files"/);
  assert.match(archive, /Before you save final files/);
  assert.match(archive, /Download while the window is open/);
  assert.match(archive, /Keep a personal copy/);
  assert.match(archive, /data-archive-download="manifest"/);
  assert.match(archive, /href="\/api\/exports\/export-ready\/download"/);
  assert.match(archive, /Download file list/);
  assert.match(archive, /Your download is ready until/);
  assert.match(archive, /Private file details stay hidden/);
  assert.match(archive, /data-archive-drive-package="ready"/);
  assert.match(archive, /Your final file set is stored for protected download/);
  assert.match(archive, /data-archive-retention-status="policy_review_required"/);
  assert.match(archive, /School download rules still need review/);
  assert.match(archive, /expiring soon/i);
  assert.doesNotMatch(archive, /signed archive links|export generation is wired|Scoped archive|Drive-backed archive package/i);
});

test("workspace explains the next student final-files blocker without adding fake actions", async () => {
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
            label: "Celebration Day proof",
            status: "ready",
            evidenceCount: 2,
            message: "Ready for final-file review.",
          },
          {
            id: "reflection_portfolio",
            label: "Reflections and portfolio",
            status: "missing",
            evidenceCount: 0,
            message: "Needs proof or staff review before final files are ready.",
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
  assert.match(archive, /Final files next step/);
  assert.match(archive, /Finish Reflections and portfolio/);
  assert.match(archive, /1 of 4 final checks ready/);
  assert.match(archive, /Add the missing work or ask your Program Teacher what to attach/);
  assert.match(archive, /Proof matched: 0/);
  assert.doesNotMatch(archive, /data-archive-action|Request archive|href="#"/);
});

test("workspace explains student final-file package failures without fake retry controls", async () => {
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
            label: "Celebration Day proof",
            status: "ready",
            evidenceCount: 2,
            message: "Ready for final-file review.",
          },
        ],
        archive: {
          status: "failed",
          scopedDownloadReady: false,
          signedDownloadReady: false,
          drivePackageReady: false,
          downloadUrl: null,
          downloadExpired: false,
          message: "Your final file package needs staff follow-up.",
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
  assert.match(archive, /Staff need to review your final files/);
  assert.match(archive, /Staff need to fix your final-file download/);
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
        actionSection: "students",
        actionPreset: "missing-mentors",
        actionLabel: "Open student list",
      },
      {
        label: "Program Teacher follow-up needed",
        detail: "38 revision-requested submission(s) need follow-up.",
        severity: "warning",
        actionSection: "teacher",
        actionPreset: "revision-requested",
        actionLabel: "Open review queue",
      },
      {
        label: "Presentation readiness pending",
        detail: "14 active presentation record(s) need readiness attention.",
        severity: "info",
        actionSection: "operations",
        actionPreset: "presentation-pending",
        actionLabel: "Open operations",
      },
      {
        label: "Final-file exports failed",
        detail: "1 final-file export(s) need review.",
        severity: "urgent",
        actionSection: "operations",
        actionPreset: "archive-failed",
        actionLabel: "Open operations",
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
    recentActivity: [
      {
        studentId: "demo-student-101",
        studentName: "Missing Mentor Demo",
        type: "evidence",
        title: "Proof added",
        status: "attached",
        occurredAt: "2026-05-31T16:15:00.000Z",
      },
      {
        studentId: "demo-student-102",
        studentName: "Revision Follow-up Demo",
        type: "review",
        title: "Core Concept Proposal",
        status: "revision_requested",
        occurredAt: "2026-05-31T15:30:00.000Z",
      },
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
        label: readOnly ? "Review assigned site records" : "Act on assigned site records",
        detail: "250 active student records are visible for this site.",
        status: "ready",
        actionSection: "students",
        actionPreset: "all-students",
        actionLabel: "Open student list",
      },
      {
        label: "Program Teacher follow-up",
        detail: "84 submitted or revision-requested records need Program Teacher follow-up.",
        status: "revision_requested",
        actionSection: readOnly ? "students" : "teacher",
        actionPreset: readOnly ? "revision-students" : "revision-requested",
        actionLabel: readOnly ? "Open student list" : "Open review queue",
      },
      {
        label: "Presentation and final-file follow-up",
        detail: "1 final-file export(s) need follow-up.",
        status: "failed",
        actionSection: "operations",
        actionPreset: "archive-failed",
        actionLabel: "Open operations",
      },
      {
        label: "Private proof",
        detail: "690 private proof items are counted without showing private file details.",
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
          cohort: "Class of 2026",
          graduationYear: "2026",
          mentorUserId: "demo-mentor-001",
          mentorName: "Mentor One",
          viewerUserId: "demo-viewer-001",
          viewerName: "Read-only Viewer",
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
      canAssignAdministration: false,
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
      cohort: "Class of 2026",
      graduationYear: "2026",
      mentorUserId: "",
      mentorName: "",
      viewerUserId: "demo-viewer-001",
      viewerName: "Read-only Viewer",
      hasActiveMentor: false,
      mentorMeetingStatus: "not_recorded",
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
      cohort: "Class of 2026",
      graduationYear: "2026",
      mentorUserId: "demo-mentor-001",
      mentorName: "Mentor One",
      viewerUserId: "demo-viewer-001",
      viewerName: "Read-only Viewer",
      hasActiveMentor: true,
      mentorMeetingStatus: "not_recorded",
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
      nextAction: "Review final-file export failure.",
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
      cohortId: "",
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
      cohorts: [
        { cohortId: "cohort-it-2026", cohortName: "IT 2026", studentCount: visibleStudents.length },
      ],
      statuses: ["draft", "submitted", "under_review", "revision_requested", "approved", "blocked", "archived", "complete"],
      storyBuckets: ["model_excellent", "missing_mentor", "awaiting_review", "revision_requested", "presentation_pending", "archive_ready", "archive_failed", "high_risk", "rich_timeline"],
      risks: ["any", "high", "medium", "low", "stale", "no_mentor"],
      progressStatuses: ["on_track", "behind", "missing_mentor", "missing_evidence", "needs_review", "needs_revision", "mentor_meeting_follow_up", "ready_complete"],
      evidenceStatuses: ["attached", "missing"],
      reviewStatuses: ["needs_review", "needs_revision", "approved", "reviewed", "not_reviewed"],
      presentationStatuses: ["any", "pending", "scheduled", "completed", "missing"],
      archiveStatuses: ["any", "ready", "complete", "failed", "missing"],
    },
    permissions: {
      canViewStudentDetail: true,
      canViewStudentEvidence: true,
      canViewReviewQueue: true,
      canManageMentorAssignments: !readOnly && ["site_admin", "administration", "program_teacher", "admin", "global_admin", "platform_admin"].includes(role),
      canViewPresentationOperations: true,
      canViewArchiveOperations: true,
      canManageUsers: false,
      canManageSiteUsers: !readOnly && ["site_admin", "administration", "program_teacher", "admin", "global_admin", "platform_admin"].includes(role),
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
      nextAction: "Review proof and record Program Teacher feedback.",
      decisionState: "decision-ready",
      approvalBlockedReason: "",
      availableDecisions: {
        approved: true,
        revision_requested: true,
        comment_only: true,
      },
      decisionGuidance: "Decision needed: active proof is attached. Review history, then approve next steps or request revision.",
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
      nextAction: "Wait for student revision before recording another decision.",
      decisionState: "student-revision",
      approvalBlockedReason: "not_submitted",
      availableDecisions: {
        approved: false,
        revision_requested: false,
        comment_only: false,
      },
      decisionGuidance: "Student action needed: wait for the revised submission before recording another Program Teacher decision.",
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
  readOnly = !["site_admin", "administration", "program_teacher", "admin", "global_admin", "platform_admin"].includes(role),
  canManage = !readOnly && role !== "viewer",
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
      nextAction: "Review final-file failure details before completion.",
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
      nextAction: "Ask authorized staff to generate a fresh final-file package.",
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
      nextAction: "Confirm final-file storage setup before generating packages.",
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
        feedback: "Improve scope and cite the private proof summary.",
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
      cohort: "Class of 2026",
      graduationYear: "2026",
      viewerUserId: "demo-viewer-001",
      viewerName: "Read-only Viewer",
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
        reason: "Revision requested after Program Teacher feedback.",
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
      nextAction: "Prepare final-file readiness checks when the student reaches closeout.",
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
        title: "Proof added",
        summary: "Timeline event with storage identifiers redacted.",
        actorName: "Student",
        status: "pending_review",
        reason: "",
        owner: "Student",
        nextAction: "Review proof context in the proof section.",
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
        owner: "Program Teacher",
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
  const initialUrl = options.url || "https://workspace.example/workspace.html";
  const viewportWidth = Number(options.viewportWidth || 1024);
  const viewportHeight = Number(options.viewportHeight || 768);
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
  const inertElement = {
    addEventListener: () => {},
    hasEventListener: () => false,
    querySelectorAll: () => [],
    value: "",
  };
  const documentElements = new Map();
  function createDocumentElement(selector) {
    const listenersByType = new Map();
    const styleProperties = new Map();
    const topbarBottom = Number(options.topbarBottom || options.topbarHeight || 96);
    return {
      selector,
      value: "",
      offsetHeight: selector === ".workspace-topbar" ? topbarBottom : 0,
      style: {
        setProperty(name, value) {
          styleProperties.set(name, value);
        },
        getPropertyValue(name) {
          return styleProperties.get(name) || "";
        },
      },
      addEventListener(type, handler) {
        listenersByType.set(type, typeof handler === "function" ? [handler] : []);
      },
      hasEventListener(type) {
        return (listenersByType.get(type) || []).length > 0;
      },
      click() {
        for (const handler of listenersByType.get("click") || []) {
          handler({ type: "click", currentTarget: this, preventDefault: () => {} });
        }
      },
      getBoundingClientRect() {
        return selector === ".workspace-topbar" ? { bottom: topbarBottom } : { bottom: 0 };
      },
      querySelectorAll: () => [],
    };
  }
  function queryDocumentElement(selector) {
    if (selector === "#workspaceMain") return workspaceRoot;
    if (!String(selector || "").startsWith("#") && selector !== ".workspace-app" && selector !== ".workspace-topbar") {
      return inertElement;
    }
    if (!documentElements.has(selector)) documentElements.set(selector, createDocumentElement(selector));
    return documentElements.get(selector);
  }
  const window = {
    location,
    history,
    innerWidth: viewportWidth,
    innerHeight: viewportHeight,
    addEventListener(type, handler) {
      const rows = listeners.get(type) || [];
      rows.push(handler);
      listeners.set(type, rows);
    },
    removeEventListener(type, handler) {
      const rows = listeners.get(type) || [];
      listeners.set(type, rows.filter((row) => row !== handler));
    },
    dispatchEvent(event) {
      const rows = listeners.get(event?.type) || [];
      for (const handler of rows) handler(event);
    },
    matchMedia(query) {
      const maxWidth = String(query || "").match(/max-width:\s*(\d+)px/);
      const minWidth = String(query || "").match(/min-width:\s*(\d+)px/);
      const matchesMax = maxWidth ? viewportWidth <= Number(maxWidth[1]) : true;
      const matchesMin = minWidth ? viewportWidth >= Number(minWidth[1]) : true;
      return {
        media: String(query || ""),
        matches: matchesMax && matchesMin,
        addEventListener: () => {},
        removeEventListener: () => {},
      };
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
        return queryDocumentElement(selector);
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
            : pathname === "/api/admin/audit-events"
              ? { status: 200, body: { ok: true, events: [] } }
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
  return { context, workspaceRoot, fetchLog, fetchRequests, locationChanges, window, documentElements };
}
