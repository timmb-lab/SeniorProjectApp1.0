import { readFileSync } from "node:fs";

const workspaceJs = readFileSync("workspace.js", "utf8");
const failures = [];

function requirePattern(label, text, pattern) {
  if (!pattern.test(text)) failures.push(label);
}

function functionBody(name) {
  const marker = `function ${name}`;
  const start = workspaceJs.indexOf(marker);
  if (start === -1) {
    failures.push(`${name} exists`);
    return "";
  }
  const next = workspaceJs.indexOf("\nfunction ", start + marker.length);
  return workspaceJs.slice(start, next === -1 ? workspaceJs.length : next);
}

const genericErrorMessage = functionBody("messageForApiError");
requirePattern("401 asks user to sign in again", genericErrorMessage, /status === 401[\s\S]*Sign in again to view this section/);
requirePattern("403 explains access without leaking detail", genericErrorMessage, /status === 403[\s\S]*does not have access to this section/);
requirePattern("404 tells user record disappeared", genericErrorMessage, /status === 404[\s\S]*record was not found or is no longer available/);
requirePattern("409 asks user to refresh or select a record", genericErrorMessage, /status === 409[\s\S]*current selection or refreshed record/);
requirePattern("429 gives wait-and-retry guidance", genericErrorMessage, /status === 429[\s\S]*Wait a few minutes/);
requirePattern("502 and 503 give provider fallback guidance", genericErrorMessage, /status === 502 \|\| status === 503[\s\S]*storage or provider service is not ready/);
requirePattern("500 class gives support guidance", genericErrorMessage, /status >= 500[\s\S]*server problem/);
requirePattern("generic fallback avoids raw error values", genericErrorMessage, /workspace could not complete that request/);
requirePattern("generic fallback does not return raw error text", genericErrorMessage, /return "The workspace could not complete that request/);

const apiNotice = functionBody("renderApiNotice");
requirePattern("API notice uses generic error mapper", apiNotice, /messageForApiError\(result\.error,\s*result\.status\)/);
requirePattern("503 can render as neutral provider state", apiNotice, /result\.status === 503 \? "neutral" : "error"/);

const majorSections = [
  ["Site dashboard", "renderSiteDashboardSection"],
  ["Site programs", "renderSiteProgramsSection"],
  ["Student directory", "renderSiteStudentDirectorySection"],
  ["Program dashboard", "renderProgramTeacherDashboardSection"],
  ["Mentor dashboard", "renderMentorDashboardSection"],
  ["Mentor assignments", "renderMentorAssignmentsSection"],
  ["Operations readiness", "renderOperationsReadinessSection"],
  ["Admin audit", "renderAdminAuditSection"],
  ["Admin command center", "renderAdminOverviewSection"],
  ["Student workspace", "renderStudentSection"],
  ["Review queue", "renderTeacherSection"],
  ["Mentor students", "renderMentorSection"],
  ["Readiness report", "renderAggregateReadinessDashboard"],
  ["Site readiness report", "renderSiteReadinessDashboard"],
  ["Users and Access assignments", "renderAdminAccessAssignmentPanel"],
  ["Users and Access role assignments", "renderAdminRoleAssignmentsPanel"],
  ["Presentation schedule", "renderPresentationSection"],
  ["Final files", "renderArchiveSection"],
];

for (const [label, functionName] of majorSections) {
  const body = functionBody(functionName);
  requirePattern(`${label} has an API notice error path`, body, /renderApiNotice\(/);
}

const actionErrorMappers = [
  ["login", "messageForAuthError", /rate_limited[\s\S]*Too many sign-in attempts/],
  ["password change", "messageForChangePasswordError", /status === 401[\s\S]*Sign in again before changing your password/],
  ["admin import", "messageForAdminImportError", /status === 401[\s\S]*Sign in again before creating accounts/],
  ["account removal", "messageForAccountRemovalError", /status === 401[\s\S]*Sign in again before removing accounts/],
  ["student removal", "messageForStudentRemovalError", /status === 401[\s\S]*Sign in again before removing students/],
  ["review decision", "messageForReviewDecisionError", /status === 401[\s\S]*Sign in again before saving review feedback/],
  ["mentor assignment", "messageForMentorAssignmentError", /status === 401[\s\S]*Sign in again before assigning a mentor/],
  ["mentor meeting", "messageForMentorMeetingError", /status === 401[\s\S]*Sign in again before recording a mentor meeting/],
  ["proof link", "messageForEvidenceError", /status === 401[\s\S]*Sign in again before adding proof/],
  ["submit work", "messageForStudentSubmissionError", /status === 401[\s\S]*Sign in again before sending work for review/],
  ["file upload", "messageForUploadError", /status === 401[\s\S]*Sign in again before uploading proof/],
  ["presentation transition", "messageForPresentationActionError", /status === 401[\s\S]*Sign in again before updating a presentation slot/],
];

for (const [label, functionName, pattern] of actionErrorMappers) {
  const body = functionBody(functionName);
  requirePattern(`${label} action has user-safe error copy`, body, pattern);
}

if (failures.length) {
  console.error("Workspace error-state contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace error-state contract passed: major sections and action failures have user-safe fallback guidance.");
