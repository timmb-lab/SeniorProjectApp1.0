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
assertMatches("workspaceJs", /sectionPreset === "all-students"[\s\S]*siteStudentFilters = defaultSiteStudentFilters\(\)/, "Students dashboard preset must open the Student Directory without stale filters");
assertMatches("workspaceJs", /sectionPreset === "missing-mentors"[\s\S]*noMentor: true[\s\S]*syncSiteStudentUrlState\(\)/, "Missing mentor dashboard preset must open Student Directory with a missing-mentor filter");
assertMatches("workspaceJs", /sectionPreset === "program"[\s\S]*siteStudentFilters = [\s\S]*programId/, "Program dashboard rows must open Student Directory with a program filter");
assertMatches("workspaceJs", /sectionPreset === "status-breakdown"[\s\S]*siteStudentFilters = [\s\S]*status/, "Status Breakdown rows must open Student Directory with a status filter");
assertMatches("workspaceJs", /sectionPreset === "mentor-workload"[\s\S]*mentorAssignmentFilters = [\s\S]*mentorUserId/, "Mentor workload rows must open Mentor Assignments with a mentor filter");
assertMatches("workspaceJs", /sectionPreset === "presentation-pending"[\s\S]*presentationStatus: "pending"/, "Presentation dashboard preset must open Operations with a supported filter");
assertMatches("workspaceJs", /sectionPreset === "archive-failed"[\s\S]*archiveStatus: "failed"/, "Archive dashboard preset must open Operations with a supported filter");
assertMatches("workspaceJs", /sectionPreset === "needs-attention"[\s\S]*needsAttention: true/, "Needs Attention dashboard preset must open Operations with a supported attention filter");
assertMatches("workspaceJs", /sectionPreset === "outline-pending"[\s\S]*outlineAttention: true/, "Outline Pending dashboard preset must open Operations with a supported outline filter");
assertMatches("workspaceJs", /data-operations-action="filter-category"[\s\S]*data-operations-category/, "Operations Next Actions must expose route-backed category filter controls");
assertMatches("workspaceJs", /action === "filter-category"[\s\S]*category,[\s\S]*syncOperationsReadinessUrlState\(\)/, "Operations category controls must sync shareable URL state");
assertMatches("workspaceJs", /aria-label="\$\{workspaceNavCollapsed \? "Open menu" : "Close menu"\}"/, "Menu toggle must expose an accessible open/close label");
assertMatches("workspaceCss", /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-rail[\s\S]*display: none/, "Collapsed workspace nav must hide the full navigation rail");
assertMatches("workspaceCss", /\.workspace-app\[data-nav-state="collapsed"\] \.workspace-content[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "Collapsed workspace content must use the freed navigation width");

assertMatches("workspaceJs", /renderReadOnlyBanner\(\)[\s\S]*Read-only workspace/, "Viewer read-only banner must stay visible");
assertMatches("workspaceJs", /data-review-queue-read-only="true"[\s\S]*Review actions unavailable/, "Read-only Review Queue must not expose decision controls");
assertMatches("workspaceJs", /data-mentor-assignment-controls-hidden="true"[\s\S]*Assignment changes unavailable/, "Read-only Mentor Assignments must hide mutation controls");
assertMatches("workspaceJs", /data-operations-read-only="true"[\s\S]*Read-only operations worklists/, "Operations view must remain monitoring-only");

assertMatches("workspaceJs", /renderActiveFilterSummary\(/, "Workspace lists must expose active filter summaries");
assertMatches("workspaceJs", /Reload or share this view with the current browser URL/, "Filtered worklists must explain reloadable/shareable URL state");
for (const fn of [
  "siteStudentFiltersFromSearchParams",
  "mentorAssignmentFiltersFromSearchParams",
  "operationsReadinessFiltersFromSearchParams",
  "syncSiteStudentUrlState",
  "syncMentorAssignmentUrlState",
  "syncOperationsReadinessUrlState",
  "syncCurrentWorkspaceUrlState",
  "syncWorkspaceSectionOnlyUrlState",
]) {
  assertMatches("workspaceJs", new RegExp(`function ${fn}\\b`), `${fn} must exist for shareable worklist URL state`);
}
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
