import { readFileSync } from "node:fs";

const files = {
  workspaceJs: "workspace.js",
  workspaceCss: "workspace.css",
  packageJson: "package.json",
};

const source = {
  workspaceJs: readFileSync(files.workspaceJs, "utf8"),
  workspaceCss: readFileSync(files.workspaceCss, "utf8"),
  packageJson: readFileSync(files.packageJson, "utf8"),
};

const packageJson = JSON.parse(source.packageJson);
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

function functionBlock(name) {
  const pattern = new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`, "m");
  return source.workspaceJs.match(pattern)?.[0] || "";
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

for (const [pattern, message] of [
  [/\bhref=(['"])#\1/i, "dead href=\"#\" link"],
  [/\bhref=(['"])\1/i, "empty href"],
  [/\bcoming soon\b/i, "placeholder text: coming soon"],
  [/\bTODO\b/i, "placeholder text: TODO"],
  [/\bFIXME\b/i, "placeholder text: FIXME"],
  [/\bprototype-only\b/i, "placeholder text: prototype-only"],
  [/\bmock only\b/i, "placeholder text: mock only"],
]) {
  if (pattern.test(source.workspaceJs)) fail(`${files.workspaceJs}: ${message}`);
}

if (!String(packageJson.scripts["verify:workspace-density"] || "").includes("scripts/verify-workspace-density.mjs")) {
  fail("package.json: verify:workspace-density must run scripts/verify-workspace-density.mjs");
}

assertIncludes("workspaceJs", "function renderWorkspaceDisclosurePanel", "shared disclosure helper must exist");
assertMatches("workspaceJs", /data-workspace-disclosure-action="toggle"[\s\S]*aria-expanded="\$\{open \? "true" : "false"\}"[\s\S]*aria-controls/, "disclosure controls must expose aria-expanded and aria-controls");
assertIncludes("workspaceJs", "function handleWorkspaceDisclosureToggle", "disclosure toggle handler must exist");

const studentSection = functionBlock("renderStudentSection");
assertIncludes("workspaceJs", "data-student-secondary-stack=\"true\"", "student secondary surfaces must render in one disclosure stack");
if (/renderStudentRequirementPanel\(/.test(studentSection) || /renderStudentFeedbackPanel\(/.test(studentSection) || /renderStudentProgressDetails\(/.test(studentSection)) {
  fail(`${files.workspaceJs}: Student Dashboard must not render full requirement, feedback, or progress panels directly on first load`);
}
assertMatches("workspaceJs", /renderStudentWorkspaceDisclosurePanels\([\s\S]*id: "requirements"[\s\S]*id: "feedback"[\s\S]*id: "progress"[\s\S]*id: "evidence"[\s\S]*id: "submissions"[\s\S]*id: "files"/, "student requirements, feedback, progress, evidence, submissions, and files must be disclosed");
assertMatches("workspaceJs", /function handleStudentRequirementAction\([\s\S]*studentDisclosureState = \{[\s\S]*requirements: true/, "student requirement actions must open the checklist disclosure");
assertMatches("workspaceJs", /function focusEvidenceFormsForSubmission\([\s\S]*evidence: true[\s\S]*pendingStudentEvidenceSubmissionId/, "student evidence actions must open evidence tools before focusing forms");

const usersAccessPanel = functionBlock("renderAdminAccessAssignmentPanel");
assertIncludes("workspaceJs", "function renderSiteAccessSafetyNote", "Users & Access must have one concise safety note");
assertIncludes("workspaceJs", "function renderSiteAccessGuidanceDisclosure", "Users & Access detailed guidance must be disclosed");
assertMatches("workspaceJs", /function renderSiteAccessAssignmentHistory\([\s\S]*renderWorkspaceDisclosurePanel\(\{[\s\S]*scope: "usersAccess"[\s\S]*id: "history"[\s\S]*data-site-access-history="true"/, "recent access history must be behind Users & Access disclosure");
if (!/renderSiteAccessAssignmentSummary\([\s\S]*renderSiteAccessAssignmentHistory\([\s\S]*renderSiteAccessGuidanceDisclosure\([\s\S]*workspace-assignment-tabs/.test(usersAccessPanel)) {
  fail(`${files.workspaceJs}: Users & Access must order summary, collapsed history/guidance, then forms`);
}

for (const [name, maxMetrics] of [
  ["renderSiteDashboardSection", 6],
  ["renderAdminOverviewSection", 6],
  ["renderProgramTeacherDashboardSection", 6],
]) {
  const block = functionBlock(name);
  const metricCount = countMatches(block, /renderMetricTile\(/g);
  if (metricCount > maxMetrics) {
    fail(`${files.workspaceJs}: ${name} renders ${metricCount} metric tiles; first-load budget is ${maxMetrics}`);
  }
}

assertMatches("workspaceJs", /function renderSiteDashboardSection\([\s\S]*id: "siteDashboard"[\s\S]*workspace-dashboard-secondary-grid/, "Site Dashboard secondary detail panels must be behind disclosure");
assertMatches("workspaceJs", /function renderAdminOverviewSection\([\s\S]*id: "adminDashboard"[\s\S]*workspace-dashboard-secondary-grid/, "Admin Dashboard secondary detail panels must be behind disclosure");
assertMatches("workspaceJs", /function renderProgramTeacherDashboardSection\([\s\S]*id: "programDashboard"[\s\S]*workspace-dashboard-secondary-grid/, "Program Teacher secondary detail panels must be behind disclosure");

assertMatches("workspaceJs", /function renderMetricTile\([\s\S]*data-metric-behavior="\$\{hasAction \? "action" : "summary"\}"/, "metric tiles must distinguish action and summary-only behavior");
assertMatches("workspaceJs", /workspace-summary-only-metric/, "summary-only metrics must use distinct styling");
assertMatches("workspaceJs", /function renderMentorStudentCards\([\s\S]*data-mentor-dashboard-summary="true"[\s\S]*data-workspace-disclosure-scope="mentorRow"[\s\S]*renderMentorDashboardRowDetails/, "Mentor Dashboard rows must be compact by default with expandable row details");
assertMatches("workspaceJs", /function renderMentorDashboardRowDetails\([\s\S]*data-mentor-dashboard-signals="true"[\s\S]*data-mentor-dashboard-action="open-meetings"/, "Mentor Dashboard secondary signals and meeting history must remain reachable after disclosure");

for (const [needle, message] of [
  [".workspace-summary-only-metric", "summary-only metric style"],
  [".workspace-action-metric", "action metric style"],
  [".workspace-disclosure-panel", "disclosure panel style"],
  [".workspace-summary-strip", "summary strip style"],
  [".workspace-mentor-student-row", "mentor compact row style"],
  [".workspace-density-action-row", "dense action row style"],
  [".workspace-quiet-helper", "quiet helper text style"],
]) {
  assertIncludes("workspaceCss", needle, message);
}

if (failures.length) {
  console.error("Workspace density verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace density verification passed.");
console.log("Checked first-load budgets, disclosure controls, summary-only metrics, and compact mentor/student/access surfaces.");
