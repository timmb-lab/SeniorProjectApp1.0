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
  "studentWork",
  "studentFeedback",
  "studentFinalChecklist",
  "archive",
  "mentorDashboard",
  "mentor",
  "programDashboard",
  "teacher",
  "mentorAssignments",
  "operations",
  "presentation",
  "staffReports",
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
assertMatches("workspaceJs", /renderWorkspaceStudentSearchControl\(roles\)[\s\S]*data-workspace-student-search="true"/, "Workspace shell must render the topbar student search landing for Student Directory roles");
assertMatches("workspaceJs", /document\.querySelector\("#workspaceStudentSearchForm"\)\?\.addEventListener\("submit", submitWorkspaceStudentSearch\)/, "Workspace student search form must bind a real submit handler");
assertMatches("workspaceJs", /function openWorkspaceStudentSearch\(searchValue = ""\)[\s\S]*siteStudentFilters = \{[\s\S]*search,[\s\S]*syncSiteStudentUrlState\(\{ clearFilters: !search \}\)[\s\S]*loadWorkspaceData\(/, "Workspace student search landing must reuse Student Directory search filters and URL state");
assertMatches("workspaceJs", /function renderScreenOrientation\(sectionId = activeSection[\s\S]*data-screen-orientation-actions="true"[\s\S]*renderScreenOrientationAction\(action, index\)/, "Screen orientation must render suggested next-click actions");
assertMatches("workspaceJs", /function screenOrientationActionsFor\([\s\S]*allowedIds\.has\(action\.section\)[\s\S]*slice\(0, 3\)/, "Screen orientation next-click actions must be limited to available sections");
assertMatches("workspaceJs", /function renderScreenOrientationAction\(action, index\)[\s\S]*data-section="\$\{escapeHtml\(action\.section\)\}"[\s\S]*data-section-preset="\$\{escapeHtml\(action\.preset\)\}"/, "Screen orientation next-click actions must reuse workspace section and preset routing");
assertMatches("workspaceJs", /auditAction[\s\S]*data-audit-action="\$\{escapeHtml\(action\.auditAction\)\}"[\s\S]*data-audit-entity-type="\$\{escapeHtml\(action\.auditEntityType\)\}"/, "Screen orientation audit actions must reuse the filtered Audit route");
assertMatches("workspaceJs", /renderScreenGuidance\(activeSection, guidancePrimaryRole, guidanceRoles, sections\)/, "Workspace app shell must render the shared screen guidance helper");
assertMatches("workspaceJs", /function renderScreenGuidance\(sectionId = activeSection[\s\S]*renderScreenOrientation\(sectionId, primaryRole, roles, sections\)[\s\S]*renderScreenDoneGuide\(sectionId, primaryRole, roles, sections\)/, "Screen guidance helper must render all guide panels");
assertMatches("workspaceJs", /function renderScreenLanguageGuide\(sectionId = activeSection[\s\S]*data-screen-language-guide="\$\{escapeHtml\(activeId\)\}"[\s\S]*data-language-term="\$\{escapeHtml\(key\)\}"/, "Screen language guide must render stable plain-language term markers");
assertMatches("workspaceJs", /function screenLanguageTermsFor\(sectionId = "overview"[\s\S]*Program Teacher approval[\s\S]*Smallest role[\s\S]*Redacted[\s\S]*Protected record/, "Screen language guide must explain student, account, and audit terms");
assertMatches("workspaceJs", /renderScreenOrientation\(sectionId, primaryRole, roles, sections\)[\s\S]*renderScreenLanguageGuide\(sectionId, primaryRole, roles, sections\)/, "Workspace app shell must render the language guide after the current-screen guide");
assertMatches("workspaceJs", /function renderScreenActionImpactGuide\(sectionId = activeSection[\s\S]*data-screen-action-impact-guide="\$\{escapeHtml\(activeId\)\}"[\s\S]*data-action-impact="\$\{escapeHtml\(key\)\}"/, "Screen action-impact guide must render stable click-effect markers");
assertMatches("workspaceJs", /function screenActionImpactsFor\(sectionId = "overview"[\s\S]*Add file or link[\s\S]*Save decision[\s\S]*Create or import[\s\S]*Audit filters narrow logged activity/, "Screen action-impact guide must explain safe navigation, saved changes, and audit filtering");
assertMatches("workspaceJs", /renderScreenLanguageGuide\(sectionId, primaryRole, roles, sections\)[\s\S]*renderScreenActionImpactGuide\(sectionId, primaryRole, roles, sections\)/, "Workspace app shell must render the action-impact guide after the language guide");
assertMatches("workspaceJs", /function renderScreenVisibilityGuide\(sectionId = activeSection[\s\S]*data-screen-visibility-guide="\$\{escapeHtml\(activeId\)\}"[\s\S]*data-visibility-note="\$\{escapeHtml\(key\)\}"/, "Screen visibility guide must render stable privacy and audience markers");
assertMatches("workspaceJs", /function screenVisibilityNotesFor\(sectionId = "overview"[\s\S]*Files and links you add are visible to you and staff who are allowed to review or support that work[\s\S]*Setup passwords[\s\S]*Redacted rows/, "Screen visibility guide must explain student files, account setup, and audit redaction");
assertMatches("workspaceJs", /renderScreenActionImpactGuide\(sectionId, primaryRole, roles, sections\)[\s\S]*renderScreenVisibilityGuide\(sectionId, primaryRole, roles, sections\)/, "Workspace app shell must render the visibility guide after the action-impact guide");
assertMatches("workspaceJs", /function renderScreenStartGuide\(sectionId = activeSection[\s\S]*data-screen-start-guide="\$\{escapeHtml\(activeId\)\}"[\s\S]*data-start-requirement="\$\{escapeHtml\(key\)\}"/, "Screen start guide must render stable before-you-start markers");
assertMatches("workspaceJs", /function screenStartRequirementsFor\(sectionId = "overview"[\s\S]*Have the exact file or link ready before adding it or turning in work[\s\S]*Review proof and history before saving a Program Teacher decision[\s\S]*Set action, person, or record filters before investigating the log/, "Screen start guide must explain prerequisites for student files, review decisions, and audit investigation");
assertMatches("workspaceJs", /renderScreenVisibilityGuide\(sectionId, primaryRole, roles, sections\)[\s\S]*renderScreenStartGuide\(sectionId, primaryRole, roles, sections\)/, "Workspace app shell must render the start guide after the visibility guide");
assertMatches("workspaceJs", /function renderScreenDoneGuide\(sectionId = activeSection[\s\S]*data-screen-done-guide="\$\{escapeHtml\(activeId\)\}"[\s\S]*data-done-signal="\$\{escapeHtml\(key\)\}"/, "Screen done guide must render stable completion-signal markers");
assertMatches("workspaceJs", /function screenDoneSignalsFor\(sectionId = "overview"[\s\S]*The current phase item shows the new file count, waiting review state, feedback message, or Done status[\s\S]*The selected review item shows the saved Program Teacher decision or follow-up message[\s\S]*Filters point to the action, person, or record pattern you needed to investigate/, "Screen done guide must explain completion signals for student work, review decisions, and audit filters");
assertMatches("workspaceJs", /renderScreenStartGuide\(sectionId, primaryRole, roles, sections\)[\s\S]*renderScreenDoneGuide\(sectionId, primaryRole, roles, sections\)/, "Workspace app shell must render the done guide after the start guide");
assertMatches("workspaceJs", /data-experience="\$\{escapeHtml\(experience\)\}"/, "Workspace app shell must expose student, staff workspace, and admin console experience markers");
assertMatches("workspaceJs", /studentExperience \? "My Capstone" : "Staff Workspace"/, "Workspace app shell must use product mental-model titles instead of a generic workspace title");
assertMatches("workspaceJs", /renderWorkspaceNavigation\(sections,[\s\S]*visibleSections = sections\.filter\(\(section\) => !section\.hidden\)/, "Workspace navigation must hide compatibility-only legacy sections from visible nav");
assertMatches("workspaceJs", /STUDENT_NAV_SECTION_IDS = new Set\(\["student", "studentWork", "studentFeedback", "studentFinalChecklist"\]\)/, "Student nav contract must include Today, My Work, Feedback, and Final Checklist route ids");
assertMatches("workspaceJs", /function roleCommandSafetyText\([\s\S]*Viewer remains read-only[\s\S]*Students see only their own workspace[\s\S]*Global Admin is local-account-only/, "Role command strip must explain student, Viewer, and Global Admin safety boundaries");
assertMatches("workspaceJs", /function roleCommandConfidenceItems\([\s\S]*Account type[\s\S]*Use training records for walkthroughs[\s\S]*Cannot do here/, "Legacy role confidence helper must avoid demo-proof and live-use product copy");
assertMatches("workspaceJs", /function roleCommandBoundaryText\([\s\S]*No proof, submission, password, review, import, account, or assignment changes can be saved from View as Student[\s\S]*Approve, import, assignment, schedule, review, and account controls stay hidden[\s\S]*Students cannot open staff dashboards, staff preview tools, management consoles, or other student records/, "Role confidence strip must preserve student, Viewer, and View as Student boundaries");
assertMatches("workspaceCss", /\.workspace-active-role-badge/, "Compact active role badge must remain styled");
assertMatches("workspaceCss", /@media \(max-width: 900px\)[\s\S]*\.workspace-active-role-badge/, "Compact role badge must collapse cleanly on compact screens");
assertMatches("workspaceJs", /async function openWorkspaceSection\(button\)[\s\S]*activeSection = section;\s*syncCurrentWorkspaceUrlState\(\);\s*renderAppShell\(\);/, "Plain workspace section actions must sync the URL before rendering");
assertMatches("workspaceJs", /function renderTaskFinishChecklist\(id, title, items = \[\], options = \{\}\)[\s\S]*data-task-finish-checklist="\$\{escapeHtml\(id\)\}"[\s\S]*data-task-finish-check/, "High-risk workflow surfaces must render shared before-you-finish checklists");
assertMatches("workspaceJs", /renderTaskFinishChecklist\("student-next-action"[\s\S]*studentPrimaryActionChecklist\(action, summary\)/, "Student command card must explain the checks before acting");
assertMatches("workspaceJs", /renderTaskFinishChecklist\("mentor-assignment-save"[\s\S]*Before assigning this mentor/, "Mentor assignment form must explain checks before saving");
assertMatches("workspaceJs", /renderTaskFinishChecklist\("account-create-save"[\s\S]*Before creating this account/, "Users & Access must explain account creation checks before saving");
assertMatches("workspaceJs", /renderTaskFinishChecklist\("password-change"[\s\S]*Before changing your password/, "Account screen must explain password-change checks before saving");
assertMatches("workspaceJs", /renderTaskFinishChecklist\("student-final-files"[\s\S]*Before you save final files/, "Student final files must explain checks before download or save");
assertMatches("workspaceJs", /renderTaskFinishChecklist\("admin-final-file-handoff"[\s\S]*Before final-file handoff/, "Admin final-file exports must explain checks before handoff");
assertMatches("workspaceJs", /function renderProblemStateActions\(actions = problemStateDefaultActions\(\)\)[\s\S]*data-problem-state-actions="true"[\s\S]*renderProblemStateAction\(action, index\)/, "Problem states must render recovery actions");
assertMatches("workspaceJs", /function renderProblemStateAction\(action, index\)[\s\S]*data-problem-action="\$\{escapeHtml\(action\.problemAction\)\}"[\s\S]*data-section="\$\{escapeHtml\(action\.section\)\}"/, "Problem state recovery actions must use refresh or real workspace section routing");
assertMatches("workspaceJs", /function handleProblemStateAction\(button\)[\s\S]*action === "refresh"[\s\S]*loadWorkspaceData\("Refreshing workspace\.\.\."\)/, "Problem state refresh action must reload workspace data");
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
assertMatches("workspaceJs", /function renderAdminConsoleOverviewSection\(capabilities = adminConsoleCapabilitiesFor\(currentUser\)\)[\s\S]*data-admin-console-setup-list="true"[\s\S]*data-admin-console-health="true"[\s\S]*data-admin-console-quick-actions="true"[\s\S]*data-admin-console-recent-activity="true"/, "Admin Console overview must render setup issues, health, quick actions, and recent activity");
assertMatches("workspaceJs", /function renderAdminSetupIssues\(issues = \[\]\)[\s\S]*Needs Setup[\s\S]*No setup issues found/, "Admin Console overview must prioritize setup issues without proof copy");
assertMatches("workspaceJs", /function adminConsoleSectionsForRoles\(roles\)[\s\S]*add\("adminPeople", "People"[\s\S]*add\("adminStudents", "Students"[\s\S]*add\("adminAssignments", "Assignments"[\s\S]*add\("programs", "Programs"[\s\S]*add\("adminImports", "Imports"[\s\S]*add\("adminReports", "Reports"[\s\S]*add\("audit", "Audit"/, "Admin Console nav must follow the operations IA order");
assertMatches("workspaceJs", /data-review-queue-read-only="true"[\s\S]*only assigned Program Teachers can save feedback or decisions/, "Read-only Review Queue must not expose decision controls");
assertMatches("workspaceJs", /data-mentor-assignment-controls-hidden="true"[\s\S]*Assignment changes unavailable/, "Read-only Mentor Assignments must hide mutation controls");
assertMatches("workspaceJs", /data-operations-read-only="true"[\s\S]*Read-only operations worklists/, "Operations view must remain monitoring-only");
assertMatches("workspaceJs", /\/api\/site\/programs/, "Programs section must load the scoped site-programs route");
assertMatches("workspaceJs", /function canUseSitePrograms\(roles\)\s*\{\s*return hasGlobalAdminRole\(roles\) \|\| roles\.has\("site_admin"\);\s*\}/, "Programs navigation must stay hidden for School Admin, Viewer, Program Teacher, Mentor, and Student roles");
assertMatches("workspaceJs", /if \(canUseSitePrograms\(roles\)\) \{[\s\S]*add\("programs", "Programs", "Site program management"\)/, "Programs section must live in the scoped Admin Console for Site Admin and Global Admin");
assertMatches("workspaceJs", /function canUseSitePrograms\(roles\)\s*\{\s*return hasGlobalAdminRole\(roles\) \|\| roles\.has\("site_admin"\);\s*\}/, "Programs visibility must stay limited to Site Admin and Global Admin");
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
  "presentationSlotFilterFromSearchParams",
  "mentorAssignmentFiltersFromSearchParams",
  "operationsReadinessFiltersFromSearchParams",
  "restoreSiteStudentDetailFromUrlState",
  "syncMentorDashboardUrlState",
  "syncPresentationScheduleUrlState",
  "syncSiteStudentUrlState",
  "syncMentorAssignmentUrlState",
  "syncOperationsReadinessUrlState",
  "syncCurrentWorkspaceUrlState",
  "syncWorkspaceSectionOnlyUrlState",
]) {
  assertMatches("workspaceJs", new RegExp(`function ${fn}\\b`), `${fn} must exist for shareable worklist URL state`);
}
assertMatches("workspaceJs", /SITE_STUDENT_DETAIL_URL_PARAMS = \["detailStudentId", "detailTab", "detailTimelineType"\]/, "Student detail URL state must use dedicated safe params");
assertMatches("workspaceJs", /SITE_STUDENT_DETAIL_URL_SECTIONS = new Set\(\[[\s\S]*"adminDashboard"[\s\S]*"siteDashboard"[\s\S]*"students"[\s\S]*"teacher"[\s\S]*"mentorAssignments"[\s\S]*"mentorDashboard"[\s\S]*"programDashboard"[\s\S]*"operations"[\s\S]*\]\)/, "Student detail URL state must include the Admin Command Center alongside existing scoped worklist sections");
assertMatches("workspaceJs", /openSiteStudentDetail\(studentId, options = \{\}\)[\s\S]*syncCurrentWorkspaceUrlState\(\)/, "Opening student detail must sync shareable URL state");
assertMatches("workspaceJs", /handleSiteStudentDetailAction\(event\)[\s\S]*action === "close"[\s\S]*syncCurrentWorkspaceUrlState\(\)/, "Closing student detail must clear detail URL state");
assertMatches("workspaceJs", /appendSiteStudentDetailUrlState\(url, section\)/, "Section URL sync helpers must be able to append student detail state");
assertMatches("workspaceJs", /function handleSiteStudentAction\(event\)[\s\S]*activeSection === "adminDashboard" \|\| activeSection === "programDashboard" \|\| activeSection === "siteDashboard"[\s\S]*openSiteStudentDetail\(event\.currentTarget\?\.dataset\?\.studentDetailId \|\| "", \{ sourceSection \}\)/, "Student detail actions must preserve Admin Command Center dashboard context instead of forcing the broader Student Directory");
assertMatches("workspaceJs", /function canUseSiteStudentDetailUrlState\(section, roles = roleIds\(currentUser\)\) \{[\s\S]*sourceSection === "adminDashboard"[\s\S]*hasGlobalAdminRole\(roles\)/, "Student detail URL restore must allow Admin Command Center detail only for global admin roles");
assertMatches("workspaceJs", /activeSection === "mentorDashboard"[\s\S]*syncMentorDashboardUrlState\(options\)/, "Mentor Dashboard focus filters must sync section URL state");
assertMatches("workspaceJs", /data-mentor-dashboard-action="filter"[\s\S]*data-mentor-dashboard-filter/, "Mentor Dashboard focus controls must keep explicit filter actions");
assertMatches("workspaceJs", /activeSection === "presentation"[\s\S]*syncPresentationScheduleUrlState\(options\)/, "Presentation schedule filters must sync section URL state");
assertMatches("workspaceJs", /function handlePresentationFilterAction\(event\)[\s\S]*syncPresentationScheduleUrlState\(\{ clearFilters: presentationSlotFilter === "all" \}\)/, "Presentation schedule filter controls must update shareable URL state");
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
