import { readFileSync } from "node:fs";

const files = {
  workspaceHtml: "workspace.html",
  workspaceJs: "workspace.js",
  siteDashboardApi: "functions/api/site/dashboard.ts",
  programTeacherApi: "functions/api/program-teacher/dashboard.ts",
  adminDashboardApi: "functions/api/admin/dashboard.ts",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);

const failures = [];

function fail(message) {
  failures.push(message);
}

function assertIncludes(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) fail(`${files[fileKey]}: ${message}`);
}

function assertMatches(fileKey, pattern, message) {
  if (!pattern.test(source[fileKey])) fail(`${files[fileKey]}: ${message}`);
}

function scanForbiddenText(fileKey) {
  const rules = [
    [/\bhref=(['"])#\1/i, "dead href=\"#\" link"],
    [/\bhref=(['"])\1/i, "empty href"],
    [/\bcoming soon\b/i, "placeholder text: coming soon"],
    [/\bTODO\b/i, "placeholder text: TODO"],
    [/\bFIXME\b/i, "placeholder text: FIXME"],
    [/\bwire later\b/i, "placeholder text: wire later"],
    [/\bprototype-only\b/i, "placeholder text: prototype-only"],
    [/\bmock only\b/i, "placeholder text: mock only"],
    [/\bnot implemented\b/i, "placeholder text: not implemented"],
  ];
  for (const [pattern, message] of rules) {
    if (pattern.test(source[fileKey])) fail(`${files[fileKey]}: ${message}`);
  }
}

for (const key of ["workspaceHtml", "workspaceJs"]) scanForbiddenText(key);

const allowedSections = new Set([
  "overview",
  "profile",
  "siteDashboard",
  "programs",
  "students",
  "student",
  "archive",
  "mentorDashboard",
  "mentor",
  "programDashboard",
  "teacher",
  "staffReports",
  "mentorAssignments",
  "operations",
  "presentation",
  "adminDashboard",
  "readiness",
  "adminUsers",
  "adminPeople",
  "adminStudents",
  "adminAssignments",
  "adminImports",
  "adminReports",
  "audit",
  "archiveExports",
  "security",
]);

for (const match of source.workspaceJs.matchAll(/data-section="([a-zA-Z][a-zA-Z0-9]*)"/g)) {
  const section = match[1];
  if (!allowedSections.has(section)) {
    fail(`${files.workspaceJs}: workspace action uses unsupported section "${section}"`);
  }
}

const allowedPresets = new Map([
  ["no-mentor", "mentorAssignments"],
  ["active-assignments", "mentorAssignments"],
  ["mentor-workload", "mentorAssignments"],
  ["all-students", "students"],
  ["on-track-students", "students"],
  ["behind-students", "students"],
  ["mentor-meeting-follow-up-students", "students"],
  ["missing-mentors", "students"],
  ["missing-evidence-students", "students"],
  ["needs-review-students", "students"],
  ["submitted-students", "students"],
  ["revision-students", "students"],
  ["high-risk-students", "students"],
  ["presentation-pending-students", "students"],
  ["archive-ready-students", "students"],
  ["archive-failed-students", "students"],
  ["program", "students"],
  ["status-breakdown", "students"],
  ["submitted", "teacher"],
  ["revision-requested", "teacher"],
  ["high-risk", "teacher"],
  ["stale-review", "teacher"],
  ["missing-mentor-review", "teacher"],
  ["evidence-attached-review", "teacher"],
  ["evidence-missing-review", "teacher"],
  ["presentation-pending", "operations"],
  ["presentation-attention", "operations"],
  ["archive-failed", "operations"],
  ["archive-in-progress", "operations"],
  ["archive-expiring-soon", "operations"],
  ["archive-expired", "operations"],
  ["archive-provider-unavailable", "operations"],
  ["needs-attention", "operations"],
  ["stale-activity", "operations"],
  ["outline-pending", "operations"],
  ["evidence-missing", "operations"],
  ["program-breakdown", "operations"],
  ["presentation-snapshot", "operations"],
  ["archive-snapshot", "operations"],
  ["all-exports", "archiveExports"],
  ["failed-exports", "archiveExports"],
  ["in-progress-exports", "archiveExports"],
  ["complete-exports", "archiveExports"],
  ["ready-for-check-out", "presentation"],
  ["checked-out", "presentation"],
  ["checked-in", "presentation"],
  ["outline-follow-up", "presentation"],
]);

const presetMatches = [
  ...source.workspaceJs.matchAll(/preset:\s*"([^"]+)"/g),
  ...source.workspaceJs.matchAll(/data-section-preset="([a-z0-9-]+)"/g),
];

for (const match of presetMatches) {
  const preset = match[1];
  if (!allowedPresets.has(preset)) {
    fail(`${files.workspaceJs}: unsupported dashboard action preset "${preset}"`);
  }
}

for (const [preset, section] of allowedPresets) {
  if (!source.workspaceJs.includes(`data-section-preset="${preset}"`) && !source.workspaceJs.includes(`preset: "${preset}"`)) {
    continue;
  }
  if (section === "archiveExports" || section === "presentation") {
    continue;
  }
  assertIncludes(
    "workspaceJs",
    `section === "${section}" && button.dataset.sectionPreset === "${preset}"`,
    `preset "${preset}" must be handled by openWorkspaceSection()`,
  );
}

assertMatches(
  "workspaceJs",
  /function screenOrientationActionsFor\([\s\S]*screenOrientationActionCandidates\([\s\S]*allowedIds\.has\(action\.section\)[\s\S]*slice\(0, 3\)/,
  "screen orientation suggestions must filter to available workspace sections and stay compact",
);
assertMatches(
  "workspaceJs",
  /function renderScreenOrientationAction\(action, index\)[\s\S]*data-screen-orientation-action="true"[\s\S]*data-section="\$\{escapeHtml\(action\.section\)\}"/,
  "screen orientation suggestions must render real workspace section actions",
);
assertMatches(
  "workspaceJs",
  /function renderScreenLanguageGuide\(sectionId = activeSection[\s\S]*Words on this screen[\s\S]*plain-language terms/,
  "screen language guide must render plain-language terminology support",
);
assertMatches(
  "workspaceJs",
  /function screenLanguageTermsFor\(sectionId = "overview"[\s\S]*File or link[\s\S]*Teacher check[\s\S]*Setup password[\s\S]*Protected record/,
  "screen language terms must cover student files, review checks, account setup, and protected records",
);
assertMatches(
  "workspaceJs",
  /function renderScreenActionImpactGuide\(sectionId = activeSection[\s\S]*What clicks do here[\s\S]*click effects/,
  "screen action-impact guide must render click-effect terminology support",
);
assertMatches(
  "workspaceJs",
  /function screenActionImpactsFor\(sectionId = "overview"[\s\S]*Files and links are saved to the exact checklist item you selected[\s\S]*The decision form records the Program Teacher outcome[\s\S]*Account creation and import forms save users, roles, and school, program, or student access/,
  "screen action-impact terms must distinguish safe navigation from saved proof, review, and account changes",
);
assertMatches(
  "workspaceJs",
  /function renderScreenVisibilityGuide\(sectionId = activeSection[\s\S]*Who can see this[\s\S]*visibility notes/,
  "screen visibility guide must render privacy and audience support",
);
assertMatches(
  "workspaceJs",
  /function screenVisibilityNotesFor\(sectionId = "overview"[\s\S]*Files and links you add are visible to you and staff who are allowed to review or support that work[\s\S]*Temporary setup passwords are sensitive handoffs[\s\S]*Rows hide private student, work, account, and file details/,
  "screen visibility terms must cover file visibility, setup password handoff, and redacted audit rows",
);
assertMatches(
  "workspaceJs",
  /function renderScreenStartGuide\(sectionId = activeSection[\s\S]*Before you start[\s\S]*start checks/,
  "screen start guide must render before-you-start support",
);
assertMatches(
  "workspaceJs",
  /function screenStartRequirementsFor\(sectionId = "overview"[\s\S]*Have the exact file or link ready before adding it or turning in work[\s\S]*Have the setup handoff and admin note ready[\s\S]*Set action, person, or record filters before investigating the log/,
  "screen start requirements must cover student file readiness, account setup preparation, and audit filters",
);
assertMatches(
  "workspaceJs",
  /function renderScreenDoneGuide\(sectionId = activeSection[\s\S]*How you know you're done[\s\S]*done signals/,
  "screen done guide must render completion-signal support",
);
assertMatches(
  "workspaceJs",
  /function screenDoneSignalsFor\(sectionId = "overview"[\s\S]*The current phase item shows the new file count, waiting review state, feedback message, or Done status[\s\S]*Current access shows the intended person, role, and school, program, cohort, or student[\s\S]*Filters point to the action, person, or record pattern you needed to investigate/,
  "screen done signals must cover student status, account access rows, and audit investigations",
);
assertMatches(
  "workspaceJs",
  /siteDashboard: \[[\s\S]*label: "Find missing mentors", section: "students", preset: "missing-mentors"[\s\S]*label: "Review work", section: "teacher", preset: "submitted"[\s\S]*label: "Review final-file failures", section: "operations", preset: "archive-failed"/,
  "Site Dashboard orientation suggestions must use existing Student Directory, Review Queue, and Operations filters",
);
assertMatches(
  "workspaceJs",
  /teacher: \[[\s\S]*label: "Needs review", section: "teacher", preset: "submitted"[\s\S]*label: "Revision follow-up", section: "teacher", preset: "revision-requested"[\s\S]*label: "Files attached", section: "teacher", preset: "evidence-attached-review"/,
  "Review Queue orientation suggestions must use existing Review Queue filters",
);
assertMatches(
  "workspaceJs",
  /operations: \[[\s\S]*label: "Presentation follow-up", section: "operations", preset: "presentation-pending"[\s\S]*label: "Final-file failures", section: "operations", preset: "archive-failed"[\s\S]*label: "Missing work", section: "operations", preset: "evidence-missing"/,
  "Operations orientation suggestions must use existing Operations filters",
);
assertMatches(
  "workspaceJs",
  /audit: \[[\s\S]*label: "Student dashboard activity", section: "audit", auditAction: "student_dashboard_viewed", auditEntityType: "student_dashboard"[\s\S]*label: "Review work activity", section: "audit", auditAction: "review_queue_viewed", auditEntityType: "review_queue"/,
  "Audit orientation suggestions must use the existing filtered audit route",
);

assertIncludes("workspaceJs", "function siteStudentQueryString()", "Student Directory query helper must exist");
assertIncludes("workspaceJs", "function syncSiteStudentUrlState", "Student Directory filtered actions must sync shareable URL state");
assertIncludes("workspaceJs", 'params.set("programId", filters.programId)', "Student Directory must support programId filters");
assertIncludes("workspaceJs", 'params.set("progressStatus", filters.progressStatus)', "Student Directory must support progressStatus filters");
assertIncludes("workspaceJs", 'params.set("evidenceStatus", filters.evidenceStatus)', "Student Directory must support evidenceStatus filters");
assertIncludes("workspaceJs", 'params.set("reviewStatus", filters.reviewStatus)', "Student Directory must support reviewStatus filters");
assertIncludes("workspaceJs", 'params.set("noMentor", "true")', "Student Directory must support missing-mentor filters");
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "all-students"[\s\S]*siteStudentFilters = defaultSiteStudentFilters\(\)[\s\S]*syncSiteStudentUrlState\(\{ clearFilters: true \}\)/,
  "all-students drill-down must clear Student Directory filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "on-track-students"[\s\S]*progressStatus: "on_track"[\s\S]*syncSiteStudentUrlState\(\)/,
  "on-track-students drill-down must set the Student Directory progress filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "behind-students"[\s\S]*progressStatus: "behind"[\s\S]*syncSiteStudentUrlState\(\)/,
  "behind-students drill-down must set the Student Directory support filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "missing-mentors"[\s\S]*noMentor: true[\s\S]*syncSiteStudentUrlState\(\)/,
  "missing-mentors drill-down must set the Student Directory missing mentor filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "missing-evidence-students"[\s\S]*evidenceStatus: "missing"[\s\S]*syncSiteStudentUrlState\(\)/,
  "missing-evidence-students drill-down must set the Student Directory evidence filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "needs-review-students"[\s\S]*reviewStatus: "needs_review"[\s\S]*syncSiteStudentUrlState\(\)/,
  "needs-review-students drill-down must set the Student Directory review filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "submitted-students"[\s\S]*status: "submitted"[\s\S]*syncSiteStudentUrlState\(\)/,
  "submitted-students drill-down must set the Student Directory submitted filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "revision-students"[\s\S]*status: "revision_requested"[\s\S]*syncSiteStudentUrlState\(\)/,
  "revision-students drill-down must set the Student Directory revision filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "high-risk-students"[\s\S]*risk: "high"[\s\S]*syncSiteStudentUrlState\(\)/,
  "high-risk-students drill-down must set the Student Directory risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "presentation-pending-students"[\s\S]*presentationStatus: "pending"[\s\S]*syncSiteStudentUrlState\(\)/,
  "presentation-pending-students drill-down must set the Student Directory presentation filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "archive-ready-students"[\s\S]*archiveStatus: "ready"[\s\S]*syncSiteStudentUrlState\(\)/,
  "archive-ready-students drill-down must set the Student Directory archive-ready filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "archive-failed-students"[\s\S]*archiveStatus: "failed"[\s\S]*syncSiteStudentUrlState\(\)/,
  "archive-failed-students drill-down must set the Student Directory archive-failed filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderStudentDirectoryStartHere\([\s\S]*id: "review"[\s\S]*preset: "needs-review-students"/,
  "Student Directory Start Here review action must expose a real review filter action",
);
assertMatches(
  "workspaceJs",
  /function renderStudentDirectoryStartHere\([\s\S]*id: "needs-help-soon"[\s\S]*preset: "high-risk-students"/,
  "Student Directory Start Here help-soon action must expose a real high-risk filter action",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "program"[\s\S]*const programId = cleanDirectoryFilter\(button\.dataset\.programId\)[\s\S]*programId,[\s\S]*syncSiteStudentUrlState\(\)/,
  "program drill-down must set the Student Directory program filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "status-breakdown"[\s\S]*const status = canonicalReviewQueueValue\(normalizeStatus\(button\.dataset\.statusFilter\), SITE_STUDENT_STATUS_VALUES\)[\s\S]*status,[\s\S]*syncSiteStudentUrlState\(\)/,
  "status breakdown drill-down must set the Student Directory status filter and sync URL state",
);

assertIncludes("workspaceJs", "function siteMentorAssignmentQueryString()", "Mentor Assignments query helper must exist");
assertIncludes("workspaceJs", "function syncMentorAssignmentUrlState", "Mentor Assignments filtered actions must sync shareable URL state");
assertIncludes("workspaceJs", 'params.set("mentorUserId", filters.mentorUserId)', "Mentor Assignments must support mentorUserId filters");
assertMatches(
  "workspaceJs",
  /section === "mentorAssignments" && button\.dataset\.sectionPreset === "no-mentor"[\s\S]*status: "unassigned"[\s\S]*noMentor: true[\s\S]*syncMentorAssignmentUrlState\(\)/,
  "no-mentor drill-down must set the Mentor Assignments unassigned filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "mentorAssignments" && button\.dataset\.sectionPreset === "active-assignments"[\s\S]*status: "active"[\s\S]*syncMentorAssignmentUrlState\(\)/,
  "active-assignments drill-down must set the Mentor Assignments active filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderMentorAssignmentsSection\([\s\S]*renderMetricTile\("Students With Mentors"[\s\S]*"mentorAssignments", \{ label: "View assignments", preset: "active-assignments" \}\)[\s\S]*renderMetricTile\("Missing Mentors"[\s\S]*"mentorAssignments", \{ label: "View students", preset: "no-mentor" \}\)/,
  "Mentor Assignments summary tiles must expose real active and missing mentor filters",
);
assertMatches(
  "workspaceJs",
  /section === "mentorAssignments" && button\.dataset\.sectionPreset === "mentor-workload"[\s\S]*const mentorUserId = cleanDirectoryFilter\(button\.dataset\.mentorId\)[\s\S]*mentorUserId,[\s\S]*syncMentorAssignmentUrlState\(\)/,
  "mentor workload drill-down must set the Mentor Assignments mentor filter and sync URL state",
);

assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "submitted"[\s\S]*status: "submitted"/,
  "submitted dashboard preset must be backed by a review queue status filter",
);
assertMatches(
  "siteDashboardApi",
  /type: "mentor_coverage"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "missing-mentors"[\s\S]*actionLabel: "Open student list"/,
  "site dashboard mentor coverage attention item must link to the Student Directory missing-mentor filter",
);
assertMatches(
  "siteDashboardApi",
  /type: "teacher_intervention"[\s\S]*actionSection: "teacher"[\s\S]*actionPreset: "revision-requested"[\s\S]*actionLabel: "Open review queue"/,
  "site dashboard teacher follow-up attention item must link to the revision-requested review queue filter",
);
assertMatches(
  "siteDashboardApi",
  /type: "presentation_readiness"[\s\S]*actionSection: "operations"[\s\S]*actionPreset: "presentation-pending"[\s\S]*actionLabel: "Open operations"/,
  "site dashboard presentation attention item must link to the presentation-pending operations filter",
);
assertMatches(
  "siteDashboardApi",
  /type: "archive_exports"[\s\S]*actionSection: "operations"[\s\S]*actionPreset: "archive-failed"[\s\S]*actionLabel: "Open operations"/,
  "site dashboard archive attention item must link to the archive-failed operations filter",
);
assertMatches(
  "siteDashboardApi",
  /label: `\$\{prefix\} assigned site records`[\s\S]*actionSection: "students"[\s\S]*actionPreset: "all-students"[\s\S]*actionLabel: "Open student list"/,
  "site dashboard next-actions student summary must link to the all-students directory filter",
);
assertMatches(
  "siteDashboardApi",
  /label: "Teacher follow-up"[\s\S]*actionSection: reviewSection[\s\S]*actionPreset: reviewActionPreset[\s\S]*actionLabel: reviewActionLabel/,
  "site dashboard next-actions teacher follow-up must route through the role-safe review or student preset",
);
assertMatches(
  "siteDashboardApi",
  /label: "Presentation and archive follow-up"[\s\S]*actionSection: hasOperationsFollowUp \? "operations" : ""[\s\S]*actionPreset: hasOperationsFollowUp \? operationsPreset : ""[\s\S]*actionLabel: hasOperationsFollowUp \? "Open operations" : ""/,
  "site dashboard next-actions operations follow-up must use the existing operations presets when follow-up exists",
);
assertMatches(
  "workspaceJs",
  /function renderSiteNextActions\([\s\S]*data-section="\$\{escapeHtml\(action\.actionSection\)\}" data-section-preset="\$\{escapeHtml\(action\.actionPreset\)\}"[\s\S]*workspace-summary-badge">Summary only<\/span>/,
  "site dashboard next-actions must distinguish actionable rows from summary-only rows",
);
assertMatches(
  "workspaceJs",
  /label: "Recent Activity"[\s\S]*actionHtml: canOpenAudit[\s\S]*data-section="audit">Open audit<\/button>/,
  "site dashboard recent-activity summary must open the existing Audit section for Global Admin users",
);
assertMatches(
  "workspaceJs",
  /function renderNeedsAttention\([\s\S]*availableSectionIdsForAnyMode\(\)\.has\(item\.actionSection\)[\s\S]*workspace-summary-badge">Summary only<\/span>/,
  "dashboard attention rows must hide unavailable destination buttons behind summary-only treatment",
);
assertMatches(
  "workspaceJs",
  /function renderSummaryStrip\([\s\S]*item\.actionHtml \|\| `<span class="workspace-summary-badge">Summary only<\/span>`/,
  "dashboard summary strips must render explicit summary-only treatment when no destination exists",
);
assertMatches(
  "workspaceJs",
  /function renderReadOnlyMonitoringOverview\([\s\S]*data-viewer-monitoring-overview="true"[\s\S]*data-section="students" data-section-preset="\$\{escapeHtml\(reviewPreset\)\}"[\s\S]*data-section="students" data-section-preset="missing-mentors"[\s\S]*data-section="students" data-section-preset="\$\{escapeHtml\(operationsPreset\)\}"/,
  "Viewer monitoring overview must use existing Student Directory presets instead of denied sections",
);
assertMatches(
  "workspaceJs",
  /function renderProgramTeacherDashboardSection\([\s\S]*renderMetricTile\("Needs Review"[\s\S]*"teacher", \{ label: "Review", preset: "submitted" \}\)/,
  "Program Teacher Needs Review metric must open the existing submitted Review Queue filter",
);
assertMatches(
  "programTeacherApi",
  /type: "mentor_coverage"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "missing-mentors"[\s\S]*actionLabel: "View students"/,
  "Program Teacher missing-mentor attention rows must link to the existing Student Directory missing-mentor filter",
);
assertMatches(
  "programTeacherApi",
  /type: "teacher_review"[\s\S]*actionSection: "teacher"[\s\S]*actionPreset: "submitted"[\s\S]*actionLabel: "Open review queue"/,
  "Program Teacher submitted attention rows must link to the existing submitted Review Queue filter",
);
assertMatches(
  "programTeacherApi",
  /type: "missing_evidence"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "missing-evidence-students"[\s\S]*actionLabel: "View students"/,
  "Program Teacher missing-evidence attention rows must link to the existing Student Directory missing-evidence filter",
);
assertMatches(
  "programTeacherApi",
  /type: "behind_support"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "behind-students"[\s\S]*actionLabel: "View students"/,
  "Program Teacher support attention rows must link to the existing Student Directory behind-support filter",
);
assertMatches(
  "programTeacherApi",
  /type: "revision_loop"[\s\S]*actionSection: "teacher"[\s\S]*actionPreset: "revision-requested"[\s\S]*actionLabel: "Open review queue"/,
  "Program Teacher revision attention rows must link to the existing revision Review Queue filter",
);
assertMatches(
  "programTeacherApi",
  /type: "presentation"[\s\S]*actionSection: "operations"[\s\S]*actionPreset: "presentation-pending"[\s\S]*actionLabel: "Open operations"/,
  "Program Teacher presentation attention rows must link to the existing Operations presentation filter",
);
assertMatches(
  "programTeacherApi",
  /type: "mentor_meeting"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "mentor-meeting-follow-up-students"[\s\S]*actionLabel: "View students"/,
  "Program Teacher mentor-meeting attention rows must link to the existing Student Directory mentor-meeting follow-up filter",
);
assertMatches(
  "adminDashboardApi",
  /type: "mentor_coverage"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "missing-mentors"[\s\S]*actionLabel: "Open student list"/,
  "Admin dashboard mentor coverage attention rows must link to the Student Directory missing-mentor filter",
);
assertMatches(
  "adminDashboardApi",
  /type: "review_workload"[\s\S]*actionSection: "teacher"[\s\S]*actionPreset: "revision-requested"[\s\S]*actionLabel: "Open review queue"/,
  "Admin dashboard revision attention rows must link to the existing revision Review Queue filter",
);
assertMatches(
  "adminDashboardApi",
  /type: "presentation_readiness"[\s\S]*actionSection: "presentation"[\s\S]*actionPreset: "outline-follow-up"[\s\S]*actionLabel: "Open schedule"/,
  "Admin dashboard presentation attention rows must link to the existing Presentation outline-follow-up filter",
);
assertMatches(
  "adminDashboardApi",
  /type: "mentor_meetings"[\s\S]*actionSection: "students"[\s\S]*actionPreset: "mentor-meeting-follow-up-students"[\s\S]*actionLabel: "Open student list"/,
  "Admin dashboard mentor-meeting attention rows must link to the existing Student Directory mentor-meeting follow-up filter",
);
assertMatches(
  "adminDashboardApi",
  /type: "archive_exports"[\s\S]*actionSection: "archiveExports"[\s\S]*actionPreset: "failed-exports"[\s\S]*actionLabel: "Open exports"/,
  "Admin dashboard export-failure attention rows must link to the filtered Archive / Exports worklist",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "revision-requested"[\s\S]*status: "revision_requested"/,
  "revision dashboard preset must be backed by a review queue status filter",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "high-risk"[\s\S]*risk: "high"[\s\S]*syncReviewQueueUrlState\(\)/,
  "high-risk dashboard preset must be backed by a Review Queue risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderReviewQueueStartHere\([\s\S]*id: "high-priority"[\s\S]*preset: "high-risk"/,
  "Review Work Start Here high-priority action must open the existing high-risk Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "stale-review"[\s\S]*risk: "stale"[\s\S]*syncReviewQueueUrlState\(\)/,
  "stale-review dashboard preset must be backed by a Review Queue stale risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderReviewQueueFilters\([\s\S]*name="risk"[\s\S]*"stale"[\s\S]*riskFilterLabel/,
  "Review Work advanced filters must keep the existing stale Review Queue filter reachable",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "missing-mentor-review"[\s\S]*risk: "no_mentor"[\s\S]*syncReviewQueueUrlState\(\)/,
  "missing-mentor-review dashboard preset must be backed by a Review Queue no-mentor risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderReviewQueueFilters\([\s\S]*name="risk"[\s\S]*"no_mentor"[\s\S]*riskFilterLabel/,
  "Review Work advanced filters must keep the existing no-mentor Review Queue filter reachable",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "evidence-attached-review"[\s\S]*evidenceStatus: "attached"[\s\S]*syncReviewQueueUrlState\(\)/,
  "evidence-attached-review dashboard preset must be backed by a Review Queue evidenceStatus filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderReviewQueueFilters\([\s\S]*name="evidenceStatus"[\s\S]*"attached"[\s\S]*studentWorkStatusFilterLabel/,
  "Review Work advanced filters must keep the existing evidence-attached Review Queue filter reachable",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "evidence-missing-review"[\s\S]*evidenceStatus: "missing"[\s\S]*syncReviewQueueUrlState\(\)/,
  "evidence-missing-review dashboard preset must be backed by a Review Queue evidenceStatus filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderReviewQueueStartHere\([\s\S]*id: "missing-work"[\s\S]*preset: "evidence-missing-review"/,
  "Review Work Start Here missing-work action must open the existing evidence-missing Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /function renderProgramTeacherDashboardSection\([\s\S]*renderMetricTile\("Needs Revision"[\s\S]*"teacher", \{ label: "Review", preset: "revision-requested" \}\)/,
  "Program Teacher Needs Revision metric must open the existing revision Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /function renderAdminOverviewSection\([\s\S]*renderDashboardCard\("Review Workload", "Submitted and revision records", renderReviewQueueSummary\(dashboard\.reviewQueue, \{ allowStudentDetail: true \}\)\)/,
  "Admin dashboard Review Workload rows must keep the existing student-detail action enabled",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "presentation-pending"[\s\S]*presentationStatus: "pending"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "presentation dashboard preset must be backed by an operations presentation filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsRankedNextActions\([\s\S]*label: "Review presentation follow-up"[\s\S]*preset: "presentation-pending"/,
  "Operations Presentation Pending metric must open the existing presentation-pending worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "presentation-attention"[\s\S]*presentationStatus: "attention_required"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "presentation attention dashboard preset must be backed by the Operations attention-required presentation filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsBlockerBars\([\s\S]*label: "Check-in needed"[\s\S]*preset: "presentation-attention"/,
  "Operations Check-In Needed metric must open the existing presentation attention worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-failed"[\s\S]*archiveStatus: "failed"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive dashboard preset must be backed by an operations archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsRankedNextActions\([\s\S]*label: "Review final-file issues"[\s\S]*preset: "archive-failed"/,
  "Operations Archive Failed metric must open the existing archive-failed worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-in-progress"[\s\S]*archiveStatus: "in_progress"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive in-progress dashboard preset must be backed by the Operations queued/running archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsRankedNextActions\([\s\S]*label: "Confirm final-file packages in progress"[\s\S]*preset: "archive-in-progress"/,
  "Operations Archive In Progress metric must open the existing queued/running archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-expiring-soon"[\s\S]*archiveStatus: "expiring_soon"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive expiring soon dashboard preset must be backed by the Operations expiring-soon archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsRankedNextActions\([\s\S]*label: "Watch expiring downloads"[\s\S]*preset: "archive-expiring-soon"/,
  "Operations Archive Expiring Soon metric must open the existing expiring-soon archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-expired"[\s\S]*archiveStatus: "expired"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive expired dashboard preset must be backed by the Operations expired archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsRankedNextActions\([\s\S]*label: "Refresh expired downloads"[\s\S]*preset: "archive-expired"/,
  "Operations Archive Expired metric must open the existing expired archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-provider-unavailable"[\s\S]*archiveStatus: "provider_unavailable"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive provider-unavailable dashboard preset must be backed by the exact Operations provider-unavailable archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsBlockerBars\([\s\S]*label: "Storage setup needed"[\s\S]*preset: "archive-provider-unavailable"[\s\S]*operationsRankedNextActions\([\s\S]*label: "Confirm storage setup"[\s\S]*preset: "archive-provider-unavailable"/,
  "Operations Storage Setup Needed metric must open the existing provider-unavailable archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "needs-attention"[\s\S]*needsAttention: true[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "needs-attention dashboard preset must be backed by the Operations attention filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsBlockerBars\([\s\S]*label: "Needs staff action"[\s\S]*preset: "needs-attention"[\s\S]*operationsRankedNextActions\([\s\S]*label: "Review staff-action rows"[\s\S]*preset: "needs-attention"/,
  "Operations Needs Attention metric must open the existing attention worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "stale-activity"[\s\S]*risk: "stale"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "stale-activity dashboard preset must be backed by the Operations stale risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsBlockerBars\([\s\S]*label: "Stale activity"[\s\S]*preset: "stale-activity"[\s\S]*operationsRankedNextActions\([\s\S]*label: "Check stale activity rows"[\s\S]*preset: "stale-activity"/,
  "Operations Stale Activity metric must open the existing stale activity worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "outline-pending"[\s\S]*outlineAttention: true[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "outline-pending dashboard preset must be backed by the Operations outline filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsRankedNextActions\([\s\S]*label: "Review pending outlines"[\s\S]*preset: "outline-pending"/,
  "Operations Outline Pending metric must open the existing outline worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "evidence-missing"[\s\S]*readiness: "missing"[\s\S]*category: "evidence"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "evidence-missing dashboard preset must be backed by the Operations evidence/readiness filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /operationsBlockerBars\([\s\S]*label: "Missing work"[\s\S]*preset: "evidence-missing"[\s\S]*operationsRankedNextActions\([\s\S]*label: "Find missing work rows"[\s\S]*preset: "evidence-missing"/,
  "Operations Evidence Missing metric must open the existing evidence-missing worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "program-breakdown"[\s\S]*const programId = cleanDirectoryFilter\(button\.dataset\.programId\)[\s\S]*programId,[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "operations program breakdown rows must be backed by a scoped Operations program filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "presentation-snapshot"[\s\S]*const presentationStatus = canonicalReviewQueueValue\(button\.dataset\.presentationStatus, OPERATIONS_PRESENTATION_STATUS_VALUES\)[\s\S]*presentationStatus,[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "presentation snapshot rows must be backed by exact Operations presentation filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderSnapshotRows\(dashboard\.presentationSnapshot, "presentation"\)/,
  "Site Dashboard presentation snapshot rows must opt in to route-backed Operations actions",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-snapshot"[\s\S]*const archiveStatus = canonicalReviewQueueValue\(button\.dataset\.archiveStatus, OPERATIONS_ARCHIVE_STATUS_VALUES\)[\s\S]*archiveStatus,[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive snapshot rows must be backed by exact Operations archive filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /if \(section === "archiveExports"\) \{[\s\S]*const presetMap = \{[\s\S]*"failed-exports": "failed"[\s\S]*"in-progress-exports": "in_progress"[\s\S]*adminArchiveExportFilter = cleanAdminArchiveExportFilter\(presetMap\[button\.dataset\.sectionPreset\] \|\| button\.dataset\.sectionPreset \|\| "all"\)[\s\S]*syncAdminArchiveExportUrlState\(\{ clearFilters: adminArchiveExportFilter === "all" \}\)/,
  "archive export presets must map to supported Archive / Exports filters",
);
assertMatches(
  "workspaceJs",
  /if \(section === "audit"\) \{[\s\S]*adminAuditFilters = \{[\s\S]*action: cleanAdminAuditFilter\(button\.dataset\.auditAction\),[\s\S]*entityType: cleanAdminAuditFilter\(button\.dataset\.auditEntityType\),[\s\S]*loadAdminAuditEventsResult/,
  "audit dashboard actions must load the filtered audit route without inventing a new section",
);
assertMatches(
  "workspaceJs",
  /section === "presentation" && button\.dataset\.sectionPreset[\s\S]*const presetMap = \{[\s\S]*"outline-follow-up": "outline_follow_up"[\s\S]*presentationSlotFilter = cleanPresentationSlotFilter\(presetMap\[button\.dataset\.sectionPreset\] \|\| button\.dataset\.sectionPreset \|\| "all"\)[\s\S]*syncPresentationScheduleUrlState\(\{ clearFilters: presentationSlotFilter === "all" \}\)/,
  "presentation dashboard presets must map to supported Presentation filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderAuditSummary\([\s\S]*data-section="audit" data-audit-action="\$\{escapeHtml\(row\.action\)\}" data-audit-entity-type="\$\{escapeHtml\(row\.entityType\)\}"[\s\S]*Review in audit/,
  "recent audit rows must open the existing Audit section with exact action and entity filters",
);
assertMatches(
  "workspaceJs",
  /renderSnapshotRows\(dashboard\.archiveSnapshot, "archive"\)/,
  "Site Dashboard archive snapshot rows must opt in to route-backed Operations actions",
);

for (const [handler, action, loader] of [
  ["handleSiteStudentAction", "view-detail", "openSiteStudentDetail"],
  ["handleMentorAssignmentAction", "open-student", "openSiteStudentDetail"],
  ["handleMentorDashboardAction", "open-student", "openSiteStudentDetail"],
  ["handleOperationsReadinessAction", "open-student", "openSiteStudentDetail"],
  ["handleReviewQueueAction", "open-student", "openSiteStudentDetail"],
]) {
  assertMatches(
    "workspaceJs",
    new RegExp(`function ${handler}\\([\\s\\S]*?action === "${action}"[\\s\\S]*?${loader}\\(`),
    `${handler} must route "${action}" through ${loader}()`,
  );
}

assertMatches(
  "workspaceJs",
  /function handleOperationsReadinessAction\([\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.operationsStudentId \|\| "", \{ sourceSection: "operations" \}\)/,
  "Operations student-detail actions must keep the Operations worklist as the detail source",
);
assertMatches(
  "workspaceJs",
  /function renderOperationsProgramBreakdown\([\s\S]*data-section="operations" data-section-preset="program-breakdown" data-program-id="\$\{escapeHtml\(row\.programId\)\}"/,
  "Operations Program Breakdown rows must render a real program filter action",
);
assertMatches(
  "workspaceJs",
  /function renderOperationsNextActions\([\s\S]*data-operations-action="filter-category" data-operations-category="\$\{escapeHtml\(row\.category\)\}"/,
  "Operations Next Actions rows must render a real category filter action",
);
assertMatches(
  "workspaceJs",
  /function handleOperationsReadinessAction\([\s\S]*?action === "filter-category"[\s\S]*?const category = canonicalReviewQueueValue\(event\.currentTarget\?\.dataset\?\.operationsCategory, OPERATIONS_CATEGORY_VALUES\)[\s\S]*?category,[\s\S]*?syncOperationsReadinessUrlState\(\)/,
  "Operations Next Actions category action must set a supported category filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function handleMentorDashboardAction\([\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.mentorDashboardStudentId \|\| "", \{ sourceSection: "mentorDashboard" \}\)/,
  "Mentor Dashboard student-detail actions must keep the Mentor Dashboard as the detail source",
);
assertMatches(
  "workspaceJs",
  /function renderMentorDashboardSection\([\s\S]*renderMetricTile\("Assigned"[\s\S]*renderMentorDashboardMetricAction\("all", "Show all"\)[\s\S]*renderMetricTile\("Needs Revision"[\s\S]*renderMentorDashboardMetricAction\("revision", "Focus list"\)[\s\S]*renderMetricTile\("Meetings"[\s\S]*renderMentorDashboardMetricAction\("meeting", "Focus list"\)[\s\S]*renderMetricTile\("Presentations"[\s\S]*renderMentorDashboardMetricAction\("presentation", "Focus list"\)/,
  "Mentor Dashboard summary metrics must reuse the existing mentor focus filters",
);
assertMatches(
  "workspaceJs",
  /function handleReviewQueueAction\([\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.reviewStudentId \|\| "", \{ sourceSection: "teacher" \}\)/,
  "Review Queue student-detail actions must keep the Review Queue as the detail source",
);
assertMatches(
  "workspaceJs",
  /function renderTeacherSection\([\s\S]*?siteStudentDetailState\?\.sourceSection === "teacher"[\s\S]*?renderSiteStudentDetailSurface/,
  "Review Queue must render the existing student detail surface inside the queue context",
);
assertMatches(
  "workspaceJs",
  /function handleSiteStudentAction\([\s\S]*?const requestedSource = cleanWorkspaceSection\(event\.currentTarget\?\.dataset\?\.studentDetailSourceSection \|\| ""\)[\s\S]*?const sourceSection = requestedSource \|\| \(activeSection === "adminDashboard" \|\| activeSection === "programDashboard" \|\| activeSection === "siteDashboard"[\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.studentDetailId \|\| "", \{ sourceSection \}\)/,
  "Admin, Program Teacher, and Site Dashboard student-detail actions must keep their dashboard as the detail source",
);
assertMatches(
  "workspaceJs",
  /function renderSiteDashboardSection\([\s\S]*?siteStudentDetailState\?\.sourceSection === "siteDashboard"[\s\S]*?renderSiteStudentDetailSurface/,
  "Site Dashboard must render the existing student detail surface inside the dashboard context",
);
assertMatches(
  "workspaceJs",
  /function renderProgramTeacherDashboardSection\([\s\S]*?siteStudentDetailState\?\.sourceSection === "programDashboard"[\s\S]*?renderSiteStudentDetailSurface/,
  "Program Teacher dashboard must render the existing student detail surface inside the dashboard context",
);
assertMatches(
  "workspaceJs",
  /function handleMentorAssignmentAction\([\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.mentorStudentId \|\| "", \{ sourceSection: "mentorAssignments" \}\)/,
  "Mentor Assignment student-detail actions must keep Mentor Assignments as the detail source",
);
assertMatches(
  "workspaceJs",
  /function renderMentorAssignmentsSection\([\s\S]*?siteStudentDetailState\?\.sourceSection === "mentorAssignments"[\s\S]*?renderSiteStudentDetailSurface/,
  "Mentor Assignments must render the existing student detail surface inside the coverage context",
);
assertMatches(
  "workspaceJs",
  /async function openSiteStudentDetail\(studentId, options = \{\}\)[\s\S]*const sourceSection = cleanWorkspaceSection\(options\.sourceSection\) \|\| "students"[\s\S]*activeSection = sourceSection/,
  "student detail loader must preserve an explicit source section",
);
assertMatches(
  "workspaceJs",
  /function handleSiteStudentDetailAction\([\s\S]*const sourceSection = cleanWorkspaceSection\(siteStudentDetailState\.sourceSection\) \|\| "students"[\s\S]*activeSection = sourceSection/,
  "closing student detail must return to the opening worklist",
);

assertMatches(
  "workspaceJs",
  /function renderScopedStudentList\([\s\S]*data-site-student-action="view-detail"[\s\S]*data-student-detail-id="\$\{escapeHtml\(row\.studentId\)\}"/,
  "Program Teacher scoped student rows must use the existing student detail handler",
);
assertMatches(
  "workspaceJs",
  /function renderMentorStudentCards\([\s\S]*data-mentor-dashboard-action="open-student"[\s\S]*data-mentor-dashboard-student-id="\$\{escapeHtml\(row\.studentId\)\}"/,
  "Mentor Dashboard assigned-student rows must use the existing student detail route through a mentor-scoped handler",
);

assertMatches("workspaceJs", /function renderReadOnlyBanner\([^)]*\)[\s\S]*Read-only workspace/, "viewer read-only banner must remain visible");
assertMatches("workspaceJs", /data-review-queue-read-only="true"[\s\S]*No review action available for this row/, "read-only review queue must not expose mutation actions as available");
assertMatches("workspaceJs", /data-mentor-assignment-controls-hidden="true"[\s\S]*Assignment changes unavailable/, "read-only mentor coverage must hide assignment controls");
assertMatches("workspaceJs", /data-operations-read-only="true"[\s\S]*Read-only operations worklists/, "operations read-only state must remain explicit");

for (const [fileKey, pattern, message] of [
  ["workspaceJs", /\brole scoped views\b/i, "workspace copy must not expose role-scope jargon"],
  ["workspaceJs", /\bstorage identifiers\b/i, "workspace copy must not expose storage-identifier jargon"],
  ["siteDashboardApi", /\brole scoped views\b/i, "site dashboard API copy must not expose role-scope jargon"],
  ["siteDashboardApi", /\bstorage identifiers\b/i, "site dashboard API copy must not expose storage-identifier jargon"],
]) {
  if (pattern.test(source[fileKey])) fail(`${files[fileKey]}: ${message}`);
}

if (failures.length) {
  console.error("Dashboard/action verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Dashboard/action verification passed.");
console.log(`Checked protected workspace actions in ${Object.values(files).join(", ")}.`);
