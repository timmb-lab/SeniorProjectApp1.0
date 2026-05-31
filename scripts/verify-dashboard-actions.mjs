import { readFileSync } from "node:fs";

const files = {
  workspaceHtml: "workspace.html",
  workspaceJs: "workspace.js",
  siteDashboardApi: "functions/api/site/dashboard.ts",
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
  "siteDashboard",
  "students",
  "student",
  "archive",
  "mentorDashboard",
  "mentor",
  "programDashboard",
  "teacher",
  "mentorAssignments",
  "operations",
  "presentation",
  "adminDashboard",
  "readiness",
  "adminUsers",
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
  ["missing-mentors", "students"],
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
  assertIncludes(
    "workspaceJs",
    `section === "${section}" && button.dataset.sectionPreset === "${preset}"`,
    `preset "${preset}" must be handled by openWorkspaceSection()`,
  );
}

assertIncludes("workspaceJs", "function siteStudentQueryString()", "Student Directory query helper must exist");
assertIncludes("workspaceJs", "function syncSiteStudentUrlState", "Student Directory filtered actions must sync shareable URL state");
assertIncludes("workspaceJs", 'params.set("programId", filters.programId)', "Student Directory must support programId filters");
assertIncludes("workspaceJs", 'params.set("noMentor", "true")', "Student Directory must support missing-mentor filters");
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "all-students"[\s\S]*siteStudentFilters = defaultSiteStudentFilters\(\)[\s\S]*syncSiteStudentUrlState\(\{ clearFilters: true \}\)/,
  "all-students drill-down must clear Student Directory filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "students" && button\.dataset\.sectionPreset === "missing-mentors"[\s\S]*noMentor: true[\s\S]*syncSiteStudentUrlState\(\)/,
  "missing-mentors drill-down must set the Student Directory missing mentor filter and sync URL state",
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
  /function renderSiteStudentDirectorySection\([\s\S]*renderMetricTile\("Submitted"[\s\S]*"students", \{ label: "View students", preset: "submitted-students" \}\)/,
  "Student Directory Submitted summary must expose a real submitted filter action",
);
assertMatches(
  "workspaceJs",
  /function renderSiteStudentDirectorySection\([\s\S]*renderMetricTile\("High Risk"[\s\S]*"students", \{ label: "View students", preset: "high-risk-students" \}\)/,
  "Student Directory High Risk summary must expose a real high-risk filter action",
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
  "workspaceJs",
  /function renderViewerMonitoringOverview\([\s\S]*data-viewer-monitoring-overview="true"[\s\S]*data-section="teacher" data-section-preset="\$\{escapeHtml\(reviewPreset\)\}"[\s\S]*data-section="students" data-section-preset="missing-mentors"[\s\S]*data-section="operations" data-section-preset="\$\{escapeHtml\(operationsPreset\)\}"/,
  "Viewer monitoring overview must use existing route-backed Review Queue, Student Directory, and Operations presets",
);
assertMatches(
  "workspaceJs",
  /function renderProgramTeacherDashboardSection\([\s\S]*renderMetricTile\("Submitted"[\s\S]*"teacher", \{ label: "Review", preset: "submitted" \}\)/,
  "Program Teacher Submitted metric must open the existing submitted Review Queue filter",
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
  /function renderTeacherSection\([\s\S]*renderMetricTile\("High Risk"[\s\S]*"teacher", \{ label: "Review rows", preset: "high-risk" \}\)/,
  "Review Queue High Risk metric must open the existing high-risk Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "stale-review"[\s\S]*risk: "stale"[\s\S]*syncReviewQueueUrlState\(\)/,
  "stale-review dashboard preset must be backed by a Review Queue stale risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderTeacherSection\([\s\S]*renderMetricTile\("Stale Activity"[\s\S]*"teacher", \{ label: "Review rows", preset: "stale-review" \}\)/,
  "Review Queue Stale Activity metric must open the existing stale Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "missing-mentor-review"[\s\S]*risk: "no_mentor"[\s\S]*syncReviewQueueUrlState\(\)/,
  "missing-mentor-review dashboard preset must be backed by a Review Queue no-mentor risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderTeacherSection\([\s\S]*renderMetricTile\("Missing Mentor"[\s\S]*"teacher", \{ label: "Review rows", preset: "missing-mentor-review" \}\)/,
  "Review Queue Missing Mentor metric must open the existing no-mentor Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "evidence-attached-review"[\s\S]*evidenceStatus: "attached"[\s\S]*syncReviewQueueUrlState\(\)/,
  "evidence-attached-review dashboard preset must be backed by a Review Queue evidenceStatus filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderTeacherSection\([\s\S]*renderMetricTile\("Evidence Attached"[\s\S]*"teacher", \{ label: "Review rows", preset: "evidence-attached-review" \}\)/,
  "Review Queue Evidence Attached metric must open the existing evidence-attached Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /section === "teacher" && button\.dataset\.sectionPreset === "evidence-missing-review"[\s\S]*evidenceStatus: "missing"[\s\S]*syncReviewQueueUrlState\(\)/,
  "evidence-missing-review dashboard preset must be backed by a Review Queue evidenceStatus filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /function renderTeacherSection\([\s\S]*renderMetricTile\("Evidence Missing"[\s\S]*"teacher", \{ label: "Review rows", preset: "evidence-missing-review" \}\)/,
  "Review Queue Evidence Missing metric must open the existing evidence-missing Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /function renderProgramTeacherDashboardSection\([\s\S]*renderMetricTile\("Needs Revision"[\s\S]*"teacher", \{ label: "Review", preset: "revision-requested" \}\)/,
  "Program Teacher Needs Revision metric must open the existing revision Review Queue filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "presentation-pending"[\s\S]*presentationStatus: "pending"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "presentation dashboard preset must be backed by an operations presentation filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Presentation Pending"[\s\S]*"operations", \{ label: "Review rows", preset: "presentation-pending" \}\)/,
  "Operations Presentation Pending metric must open the existing presentation-pending worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "presentation-attention"[\s\S]*presentationStatus: "attention_required"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "presentation attention dashboard preset must be backed by the Operations attention-required presentation filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Check-In Needed"[\s\S]*"operations", \{ label: "Review rows", preset: "presentation-attention" \}\)/,
  "Operations Check-In Needed metric must open the existing presentation attention worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-failed"[\s\S]*archiveStatus: "failed"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive dashboard preset must be backed by an operations archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Archive Failed"[\s\S]*"operations", \{ label: "Review rows", preset: "archive-failed" \}\)/,
  "Operations Archive Failed metric must open the existing archive-failed worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-in-progress"[\s\S]*archiveStatus: "in_progress"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive in-progress dashboard preset must be backed by the Operations queued/running archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Archive In Progress"[\s\S]*"operations", \{ label: "Review rows", preset: "archive-in-progress" \}\)/,
  "Operations Archive In Progress metric must open the existing queued/running archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-expiring-soon"[\s\S]*archiveStatus: "expiring_soon"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive expiring soon dashboard preset must be backed by the Operations expiring-soon archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Archive Expiring Soon"[\s\S]*"operations", \{ label: "Review rows", preset: "archive-expiring-soon" \}\)/,
  "Operations Archive Expiring Soon metric must open the existing expiring-soon archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-expired"[\s\S]*archiveStatus: "expired"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive expired dashboard preset must be backed by the Operations expired archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Archive Expired"[\s\S]*"operations", \{ label: "Review rows", preset: "archive-expired" \}\)/,
  "Operations Archive Expired metric must open the existing expired archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-provider-unavailable"[\s\S]*archiveStatus: "provider_unavailable"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive provider-unavailable dashboard preset must be backed by the exact Operations provider-unavailable archive filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Storage Setup Needed"[\s\S]*"operations", \{ label: "Review rows", preset: "archive-provider-unavailable" \}\)/,
  "Operations Storage Setup Needed metric must open the existing provider-unavailable archive worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "needs-attention"[\s\S]*needsAttention: true[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "needs-attention dashboard preset must be backed by the Operations attention filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Needs Attention"[\s\S]*"operations", \{ label: "Review rows", preset: "needs-attention" \}\)/,
  "Operations Needs Attention metric must open the existing attention worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "stale-activity"[\s\S]*risk: "stale"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "stale-activity dashboard preset must be backed by the Operations stale risk filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Stale Activity"[\s\S]*"operations", \{ label: "Review rows", preset: "stale-activity" \}\)/,
  "Operations Stale Activity metric must open the existing stale activity worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "outline-pending"[\s\S]*outlineAttention: true[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "outline-pending dashboard preset must be backed by the Operations outline filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Outline Pending"[\s\S]*"operations", \{ label: "Review rows", preset: "outline-pending" \}\)/,
  "Operations Outline Pending metric must open the existing outline worklist filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "evidence-missing"[\s\S]*readiness: "missing"[\s\S]*category: "evidence"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "evidence-missing dashboard preset must be backed by the Operations evidence/readiness filters and sync URL state",
);
assertMatches(
  "workspaceJs",
  /renderMetricTile\("Evidence Missing"[\s\S]*"operations", \{ label: "Review rows", preset: "evidence-missing" \}\)/,
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
  /function handleSiteStudentAction\([\s\S]*?const sourceSection = activeSection === "programDashboard" \|\| activeSection === "siteDashboard" \? activeSection : "students"[\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.studentDetailId \|\| "", \{ sourceSection \}\)/,
  "Program Teacher and Site Dashboard student-detail actions must keep their dashboard as the detail source",
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

assertMatches("workspaceJs", /function renderReadOnlyBanner\(\)[\s\S]*Read-only workspace/, "viewer read-only banner must remain visible");
assertMatches("workspaceJs", /data-review-queue-read-only="true"[\s\S]*No teacher decision available for this row/, "read-only review queue must not expose mutation actions as available");
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
