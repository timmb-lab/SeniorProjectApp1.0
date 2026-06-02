import { readFileSync } from "node:fs";

const files = {
  workspaceHtml: "workspace.html",
  workspaceJs: "workspace.js",
  workspaceCss: "workspace.css",
  dashboardVerifier: "scripts/verify-dashboard-actions.mjs",
  reviewQueueVerifier: "scripts/verify-review-queue-deeplinks.mjs",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
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

const expectedSections = [
  "overview",
  "siteDashboard",
  "programs",
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
];

if (!String(packageJson.scripts["verify:workspace-navigation"] || "").includes("scripts/verify-workspace-navigation-integrity.mjs")) {
  fail("package.json must register verify:workspace-navigation");
}

for (const section of expectedSections) {
  assertMatches(
    "workspaceJs",
    new RegExp(`["']${section}["']`),
    `known workspace section ${section} must be present in the shell`,
  );
}

for (const pattern of [
  /\bhref=(['"])#\1/i,
  /\bhref=(['"])\1/i,
  /\bcoming soon\b/i,
  /\bnot implemented\b/i,
  /\bwire later\b/i,
]) {
  if (pattern.test(source.workspaceHtml) || pattern.test(source.workspaceJs)) {
    fail(`workspace contains dead navigation or placeholder text matching ${pattern}`);
  }
}

assertMatches("workspaceJs", /function openWorkspaceSection\(button\)[\s\S]*sectionPreset === "submitted"[\s\S]*status: "submitted"/, "Submitted dashboard preset must open a real Review Queue filter");
assertMatches("workspaceJs", /sectionPreset === "revision-requested"[\s\S]*status: "revision_requested"/, "Needs Revision dashboard preset must open a real Review Queue filter");
assertMatches("workspaceJs", /sectionPreset === "high-risk"[\s\S]*risk: "high"[\s\S]*syncReviewQueueUrlState\(\)/, "High Risk review metric must open Review Queue with the supported risk filter");
assertMatches("workspaceJs", /sectionPreset === "stale-review"[\s\S]*risk: "stale"[\s\S]*syncReviewQueueUrlState\(\)/, "Stale Activity review metric must open Review Queue with the supported stale risk filter");
assertMatches("workspaceJs", /sectionPreset === "missing-mentor-review"[\s\S]*risk: "no_mentor"[\s\S]*syncReviewQueueUrlState\(\)/, "Missing Mentor review metric must open Review Queue with the supported no-mentor risk filter");
assertMatches("workspaceJs", /sectionPreset === "evidence-attached-review"[\s\S]*evidenceStatus: "attached"[\s\S]*syncReviewQueueUrlState\(\)/, "Evidence Attached review metric must open Review Queue with the supported evidence filter");
assertMatches("workspaceJs", /sectionPreset === "evidence-missing-review"[\s\S]*evidenceStatus: "missing"[\s\S]*syncReviewQueueUrlState\(\)/, "Evidence Missing review metric must open Review Queue with the supported evidence filter");
assertMatches("workspaceJs", /sectionPreset === "all-students"[\s\S]*siteStudentFilters = defaultSiteStudentFilters\(\)/, "Students dashboard preset must open the Student Directory without stale filters");
assertMatches("workspaceJs", /sectionPreset === "on-track-students"[\s\S]*progressStatus: "on_track"[\s\S]*syncSiteStudentUrlState\(\)/, "On Track dashboard preset must open Student Directory with an on-track progress filter");
assertMatches("workspaceJs", /sectionPreset === "behind-students"[\s\S]*progressStatus: "behind"[\s\S]*syncSiteStudentUrlState\(\)/, "Behind dashboard preset must open Student Directory with a support filter");
assertMatches("workspaceJs", /sectionPreset === "missing-mentors"[\s\S]*noMentor: true[\s\S]*syncSiteStudentUrlState\(\)/, "Missing mentor dashboard preset must open Student Directory with a missing-mentor filter");
assertMatches("workspaceJs", /sectionPreset === "missing-evidence-students"[\s\S]*evidenceStatus: "missing"[\s\S]*syncSiteStudentUrlState\(\)/, "Missing Evidence dashboard preset must open Student Directory with a missing-evidence filter");
assertMatches("workspaceJs", /sectionPreset === "needs-review-students"[\s\S]*reviewStatus: "needs_review"[\s\S]*syncSiteStudentUrlState\(\)/, "Needs Review Student Directory preset must open Student Directory with a review filter");
assertMatches("workspaceJs", /sectionPreset === "submitted-students"[\s\S]*status: "submitted"[\s\S]*syncSiteStudentUrlState\(\)/, "Submitted Student Directory summary must open the directory with a submitted filter");
assertMatches("workspaceJs", /sectionPreset === "revision-students"[\s\S]*status: "revision_requested"[\s\S]*syncSiteStudentUrlState\(\)/, "Needs Revision Student Directory summary must open the directory with a revision filter");
assertMatches("workspaceJs", /sectionPreset === "high-risk-students"[\s\S]*risk: "high"[\s\S]*syncSiteStudentUrlState\(\)/, "High Risk Student Directory summary must open the directory with a high-risk filter");
assertMatches("workspaceJs", /sectionPreset === "presentation-pending-students"[\s\S]*presentationStatus: "pending"[\s\S]*syncSiteStudentUrlState\(\)/, "Presentation Pending Student Directory summary must open the directory with a pending-presentation filter");
assertMatches("workspaceJs", /sectionPreset === "archive-ready-students"[\s\S]*archiveStatus: "ready"[\s\S]*syncSiteStudentUrlState\(\)/, "Archive Ready Student Directory summary must open the directory with an archive-ready filter");
assertMatches("workspaceJs", /sectionPreset === "archive-failed-students"[\s\S]*archiveStatus: "failed"[\s\S]*syncSiteStudentUrlState\(\)/, "Archive Failed Student Directory summary must open the directory with an archive-failed filter");
assertMatches("workspaceJs", /sectionPreset === "program"[\s\S]*siteStudentFilters = [\s\S]*programId/, "Program dashboard rows must open Student Directory with a program filter");
assertMatches("workspaceJs", /sectionPreset === "status-breakdown"[\s\S]*siteStudentFilters = [\s\S]*status/, "Status Breakdown rows must open Student Directory with a status filter");
assertMatches("workspaceJs", /sectionPreset === "no-mentor"[\s\S]*mentorAssignmentFilters = [\s\S]*status: "unassigned"[\s\S]*noMentor: true[\s\S]*syncMentorAssignmentUrlState\(\)/, "Missing Mentors summary must open Mentor Assignments with the unassigned filter");
assertMatches("workspaceJs", /sectionPreset === "active-assignments"[\s\S]*mentorAssignmentFilters = [\s\S]*status: "active"[\s\S]*syncMentorAssignmentUrlState\(\)/, "Students With Mentors summary must open Mentor Assignments with the active filter");
assertMatches("workspaceJs", /sectionPreset === "mentor-workload"[\s\S]*mentorAssignmentFilters = [\s\S]*mentorUserId/, "Mentor workload rows must open Mentor Assignments with a mentor filter");
assertMatches("workspaceJs", /sectionPreset === "presentation-pending"[\s\S]*presentationStatus: "pending"/, "Presentation dashboard preset must open Operations with a supported filter");
assertMatches("workspaceJs", /sectionPreset === "presentation-attention"[\s\S]*presentationStatus: "attention_required"/, "Check-In Needed dashboard preset must open Operations with the supported presentation attention filter");
assertMatches("workspaceJs", /sectionPreset === "archive-failed"[\s\S]*archiveStatus: "failed"/, "Archive dashboard preset must open Operations with a supported filter");
assertMatches("workspaceJs", /sectionPreset === "archive-in-progress"[\s\S]*archiveStatus: "in_progress"/, "Archive In Progress dashboard preset must open Operations with the supported queued/running filter");
assertMatches("workspaceJs", /sectionPreset === "archive-expiring-soon"[\s\S]*archiveStatus: "expiring_soon"/, "Archive Expiring Soon dashboard preset must open Operations with the supported expiring-soon filter");
assertMatches("workspaceJs", /sectionPreset === "archive-expired"[\s\S]*archiveStatus: "expired"/, "Archive Expired dashboard preset must open Operations with the supported expired filter");
assertMatches("workspaceJs", /sectionPreset === "archive-provider-unavailable"[\s\S]*archiveStatus: "provider_unavailable"/, "Storage Setup Needed dashboard preset must open Operations with the supported provider-unavailable filter");
assertMatches("workspaceJs", /sectionPreset === "needs-attention"[\s\S]*needsAttention: true/, "Needs Attention dashboard preset must open Operations with a supported attention filter");
assertMatches("workspaceJs", /sectionPreset === "stale-activity"[\s\S]*risk: "stale"/, "Stale Activity dashboard preset must open Operations with the supported stale risk filter");
assertMatches("workspaceJs", /sectionPreset === "outline-pending"[\s\S]*outlineAttention: true/, "Outline Pending dashboard preset must open Operations with a supported outline filter");
assertMatches("workspaceJs", /sectionPreset === "evidence-missing"[\s\S]*readiness: "missing"[\s\S]*category: "evidence"/, "Evidence Missing dashboard preset must open Operations with supported evidence and readiness filters");
assertMatches("workspaceJs", /data-operations-action="filter-category"[\s\S]*data-operations-category/, "Operations Next Actions must expose route-backed category filter controls");
assertMatches("workspaceJs", /action === "filter-category"[\s\S]*category,[\s\S]*syncOperationsReadinessUrlState\(\)/, "Operations category controls must sync shareable URL state");
assertMatches("workspaceJs", /aria-label="\$\{workspaceNavCollapsed \? "Open menu" : "Close menu"\}"/, "Menu toggle must expose an accessible open/close label");
assertMatches("workspaceCss", /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-rail[\s\S]*display: none/, "Collapsed workspace nav must hide the full navigation rail");
assertMatches("workspaceCss", /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-content[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "Collapsed workspace content must use the freed navigation width");

assertMatches("workspaceJs", /renderReadOnlyBanner\(\)[\s\S]*Read-only workspace/, "Viewer read-only banner must stay visible");
assertMatches("workspaceJs", /data-review-queue-read-only="true"[\s\S]*No teacher decision available for this row/, "Read-only Review Queue must not expose decision controls");
assertMatches("workspaceJs", /data-mentor-assignment-controls-hidden="true"[\s\S]*Assignment changes unavailable/, "Read-only Mentor Assignments must hide mutation controls");
assertMatches("workspaceJs", /data-operations-read-only="true"[\s\S]*Read-only operations worklists/, "Operations view must remain monitoring-only");
assertMatches("workspaceJs", /\/api\/site\/programs/, "Programs section must load the scoped site-programs route");
assertMatches("workspaceJs", /function canUseSitePrograms\(roles\)\s*\{\s*return hasGlobalAdminRole\(roles\) \|\| roles\.has\("site_admin"\);\s*\}/, "Programs navigation must stay hidden for Administration, Viewer, Program Teacher, Mentor, and Student roles");
assertMatches("workspaceJs", /canUseSitePrograms\(roles\)[\s\S]*id: "programs"[\s\S]*Add or remove site programs/, "Programs section must stay limited to site and global admins");
assertMatches("workspaceJs", /data-site-programs-section="true"[\s\S]*Active site programs[\s\S]*Programs you can add/, "Programs section must render real current and available program states");
assertMatches("workspaceJs", /data-site-program-form/, "Programs section must expose real program forms");
assertMatches("workspaceJs", /renderSiteProgramForm\("assign", "Add program"/, "Programs section must expose a real add-program form");
assertMatches("workspaceJs", /renderSiteProgramForm\("remove", "Remove program"/, "Programs section must expose a real remove-program form");

assertMatches("workspaceJs", /renderActiveFilterSummary\(/, "Workspace lists must expose active filter summaries");
assertMatches("workspaceJs", /Reload or share this view with the current browser URL/, "Filtered worklists must explain reloadable/shareable URL state");
for (const fn of [
  "siteStudentFiltersFromSearchParams",
  "siteStudentDetailUrlStateFromSearchParams",
  "mentorDashboardFilterFromSearchParams",
  "mentorAssignmentFiltersFromSearchParams",
  "operationsReadinessFiltersFromSearchParams",
  "restoreSiteStudentDetailFromUrlState",
  "syncMentorDashboardUrlState",
  "syncSiteStudentUrlState",
  "syncMentorAssignmentUrlState",
  "syncOperationsReadinessUrlState",
  "syncCurrentWorkspaceUrlState",
  "syncWorkspaceSectionOnlyUrlState",
]) {
  assertMatches("workspaceJs", new RegExp(`function ${fn}\\b`), `${fn} must exist for shareable worklist URL state`);
}
assertMatches("workspaceJs", /SITE_STUDENT_DETAIL_URL_PARAMS = \["detailStudentId", "detailTab", "detailTimelineType"\]/, "Student detail URL state must use dedicated safe params");
assertMatches("workspaceJs", /openSiteStudentDetail\(studentId, options = \{\}\)[\s\S]*syncCurrentWorkspaceUrlState\(\)/, "Opening student detail must sync shareable URL state");
assertMatches("workspaceJs", /handleSiteStudentDetailAction\(event\)[\s\S]*action === "close"[\s\S]*syncCurrentWorkspaceUrlState\(\)/, "Closing student detail must clear detail URL state");
assertMatches("workspaceJs", /appendSiteStudentDetailUrlState\(url, section\)/, "Section URL sync helpers must be able to append student detail state");
assertMatches("workspaceJs", /activeSection === "mentorDashboard"[\s\S]*syncMentorDashboardUrlState\(options\)/, "Mentor Dashboard focus filters must sync section URL state");
assertMatches("workspaceJs", /data-mentor-dashboard-action="filter"[\s\S]*data-mentor-dashboard-filter/, "Mentor Dashboard focus controls must keep explicit filter actions");
assertMatches("workspaceJs", /selectWorkspaceSite\(siteId\)[\s\S]*syncCurrentWorkspaceUrlState\(\{ clearFilters: true, replace: true \}\)/, "Site switching must clear stale worklist filters from URL state");
assertMatches("workspaceCss", /\.workspace-active-filters/, "Active filter summaries must have stable styling");
assertMatches("workspaceCss", /\.workspace-active-filter-note/, "Shareable filter URL note must have stable styling");
assertIncludes("dashboardVerifier", "unsupported dashboard action preset", "dashboard verifier should still guard unsupported presets");
assertIncludes("reviewQueueVerifier", "Review Queue URL parsing", "review queue deep-link verifier should be present");

if (failures.length) {
  console.error("Workspace navigation integrity verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace navigation integrity verification passed.");
console.log(`Checked ${expectedSections.length} workspace sections, route-backed presets, read-only boundaries, and active-filter UI.`);
