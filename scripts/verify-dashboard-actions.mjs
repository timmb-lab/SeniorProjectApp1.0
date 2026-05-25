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
  ["mentor-workload", "mentorAssignments"],
  ["all-students", "students"],
  ["missing-mentors", "students"],
  ["program", "students"],
  ["status-breakdown", "students"],
  ["submitted", "teacher"],
  ["revision-requested", "teacher"],
  ["presentation-pending", "operations"],
  ["archive-failed", "operations"],
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
  /section === "teacher" && button\.dataset\.sectionPreset === "revision-requested"[\s\S]*status: "revision_requested"/,
  "revision dashboard preset must be backed by a review queue status filter",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "presentation-pending"[\s\S]*presentationStatus: "pending"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "presentation dashboard preset must be backed by an operations presentation filter and sync URL state",
);
assertMatches(
  "workspaceJs",
  /section === "operations" && button\.dataset\.sectionPreset === "archive-failed"[\s\S]*archiveStatus: "failed"[\s\S]*syncOperationsReadinessUrlState\(\)/,
  "archive dashboard preset must be backed by an operations archive filter and sync URL state",
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
  /function handleSiteStudentAction\([\s\S]*?const sourceSection = activeSection === "programDashboard" \? "programDashboard" : "students"[\s\S]*?openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.studentDetailId \|\| "", \{ sourceSection \}\)/,
  "Program Teacher dashboard student-detail actions must keep the Program Dashboard as the detail source",
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
assertMatches("workspaceJs", /data-review-queue-read-only="true"[\s\S]*Review actions unavailable/, "read-only review queue must not expose mutation actions as available");
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
