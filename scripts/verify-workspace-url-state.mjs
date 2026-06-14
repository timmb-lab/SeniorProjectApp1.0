import { readFileSync } from "node:fs";

const workspace = readFileSync("workspace.js", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

function assertIncludes(needle, message) {
  if (!workspace.includes(needle)) fail(`workspace.js: ${message}`);
}

function assertMatches(pattern, message) {
  if (!pattern.test(workspace)) fail(`workspace.js: ${message}`);
}

if (!String(packageJson.scripts?.["verify:workspace-url-state"] || "").includes("scripts/verify-workspace-url-state.mjs")) {
  fail("package.json: verify:workspace-url-state must point at scripts/verify-workspace-url-state.mjs");
}

const contracts = [
  ["Student Directory", "siteStudentFiltersFromSearchParams", "syncSiteStudentUrlState", "siteStudentQueryString"],
  ["Student Detail", "siteStudentDetailUrlStateFromSearchParams", "restoreSiteStudentDetailFromUrlState", "appendSiteStudentDetailUrlState"],
  ["Review Queue", "reviewQueueFiltersFromSearchParams", "syncReviewQueueUrlState", "siteReviewQueueQueryString"],
  ["Mentor Dashboard", "mentorDashboardFilterFromSearchParams", "syncMentorDashboardUrlState", "mentorDashboardFilter"],
  ["Mentor Assignments", "mentorAssignmentFiltersFromSearchParams", "syncMentorAssignmentUrlState", "siteMentorAssignmentQueryString"],
  ["Presentation", "presentationSlotFilterFromSearchParams", "syncPresentationScheduleUrlState", "presentationFocus"],
  ["Operations", "operationsReadinessFiltersFromSearchParams", "syncOperationsReadinessUrlState", "siteOperationsReadinessQueryString"],
  ["Admin Audit", "adminAuditFiltersFromSearchParams", "syncAdminAuditUrlState", "adminAuditQueryString"],
  ["Archive Exports", "adminArchiveExportFilterFromSearchParams", "syncAdminArchiveExportUrlState", "adminArchiveExportFilter"],
];

for (const [label, parser, syncer, query] of contracts) {
  assertMatches(new RegExp(`function ${parser}\\b`), `${label} URL parser must exist`);
  assertMatches(new RegExp(`function ${syncer}\\b`), `${label} URL sync helper must exist`);
  assertIncludes(query, `${label} query/state marker must exist`);
}

assertIncludes("WORKSPACE_URL_FILTER_PARAMS", "central URL filter registry must exist");
assertIncludes("syncCurrentWorkspaceUrlState", "central URL sync dispatcher must exist");
assertIncludes("applyWorkspaceUrlState", "initial URL state restore must exist");
assertIncludes("bindWorkspaceUrlEvents", "popstate binding must exist");
assertIncludes("Reload or share this view with the current browser URL", "users must see shareable URL guidance");
assertMatches(/selectWorkspaceSite\(siteId\)[\s\S]*clearFilters: true, replace: true/, "site switch must clear stale URL filters");
assertMatches(/SITE_STUDENT_DETAIL_URL_PARAMS = \["detailStudentId", "detailTab", "detailTimelineType"\]/, "student detail URL state must stay bounded to safe params");
assertMatches(/adminAuditFilters = \{[\s\S]*action:[\s\S]*entityType:/, "admin audit URL state must restore action/entity filters");
assertMatches(/adminArchiveExportFilter = cleanAdminArchiveExportFilter/, "archive export URL state must restore exact export filter");

if (failures.length) {
  console.error("Workspace URL-state verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace URL-state verification passed: all major worklists and detail views have bounded shareable state.");
