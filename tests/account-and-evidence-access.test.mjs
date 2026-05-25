import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const accountHtml = await readFile("account.html", "utf8");
const accountJs = await readFile("account.js", "utf8");
const appJs = await readFile("app.js", "utf8");
const buildPublicSite = await readFile("scripts/build-public-site.mjs", "utf8");
const evidenceRoute = await readFile("functions/api/evidence/[id]/check-access.ts", "utf8");
const healthRoute = await readFile("functions/api/health.ts", "utf8");
const envTypes = await readFile("functions/_types.ts", "utf8");

test("account smoke page exercises real auth endpoints without storing credentials", () => {
  assert.match(accountHtml, /Fake Test Account Smoke Page/);
  assert.match(accountJs, /\/api\/auth\/login/);
  assert.match(accountJs, /\/api\/auth\/me/);
  assert.match(accountJs, /\/api\/auth\/logout/);
  assert.match(accountJs, /\/api\/health/);
  assert.match(accountJs, /maya\.student@senior-capstone\.test/);
  assert.match(accountJs, /lee\.admin@senior-capstone\.test/);
  assert.match(accountJs, /reporting\.miscadmin@senior-capstone\.test/);
  assert.match(accountHtml, /id="selectedExpectation"/);
  assert.match(accountHtml, /id="smokeChecklist"/);
  assert.match(accountHtml, /id="runSmokeSequence"/);
  assert.match(accountHtml, /id="loadReviewHistory"/);
  assert.match(accountHtml, /id="reviewHistoryPanel"/);
  assert.match(accountJs, /renderSelectedExpectation/);
  assert.match(accountJs, /renderSmokeChecklist/);
  assert.match(accountJs, /runAccountSmokeSequence/);
  assert.match(accountJs, /fetchReviewHistory/);
  assert.match(accountJs, /\/api\/reviews\/\$\{ALPHA_SUBMISSION_ID\}\/history/);
  assert.match(accountJs, /renderReviewHistorySummary/);
  assert.match(accountJs, /renderVersionRow/);
  assert.match(accountJs, /containsStorageIdentifiers/);
  assert.match(accountJs, /REVIEW_HISTORY_STORAGE_KEYS/);
  assert.match(accountJs, /expectedEvidenceAccess: "denied"/);
  assert.match(accountJs, /expectedRole: "program_teacher"/);
  assert.match(accountJs, /expectedRole: "admin"/);
  assert.match(accountJs, /expectedScopeId: "alpha-readiness"/);
  assert.match(accountJs, /getAccountForCurrentSession/);
  assert.match(accountJs, /hasExpectedRole/);
  assert.match(accountJs, /renderHealthSummary/);
  assert.match(accountJs, /outcomeMatches/);
  assert.match(accountJs, /Selected expectation updated/);
  assert.doesNotMatch(accountJs, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(accountJs, /drive_file_id|drive_parent_folder_id|driveFileId|driveParentFolderId/);
  assert.doesNotMatch(accountJs, /\.secrets|test-accounts-2026-05-18|passwords\s*:/);
  assert.doesNotThrow(() => new Function(accountJs));
});

test("account smoke and alpha routes stay out of production public navigation", () => {
  assert.doesNotMatch(appJs, /href="account\.html"/);
  assert.doesNotMatch(appJs, /href="alpha\.html"/);
  assert.doesNotMatch(appJs, /Account Smoke Test/);
  assert.doesNotMatch(appJs, /Alpha Console/);
  assert.doesNotMatch(appJs, /Internal alpha/);
  assert.doesNotMatch(appJs, /App Boundary/);
  assert.doesNotMatch(buildPublicSite, /account\.html/);
  assert.doesNotMatch(buildPublicSite, /alpha\.html/);
  assert.match(appJs, /Separate account-check pages are reserved for approved workspace verification/);
});

test("public site exposes Student and Teacher guide modes without treating them as auth", () => {
  assert.match(accountHtml, /Fake Test Account Smoke Page/);
  assert.match(appJs, /senior-capstone-guide-mode/);
  assert.match(appJs, /Viewing: Student Guide/);
  assert.match(appJs, /Viewing: Teacher Guide/);
  assert.match(appJs, /Switch to Student Guide/);
  assert.match(appJs, /Switch to Teacher Guide/);
  assert.match(appJs, /data-guide-mode-option="student"/);
  assert.match(appJs, /data-guide-mode-option="teacher"/);
  assert.match(appJs, /aria-pressed="\$\{currentGuideMode === "student"\}"/);
  assert.match(appJs, /The top banner changes emphasis and quick actions only/);
  assert.match(appJs, /Senior Remind and the class website/);
  assert.match(appJs, /Core Concept Proposal and Research Proposal Challenge/);
  assert.match(appJs, /Google Form grading workflow/);
  assert.match(appJs, /student check-out\/check-in/);
  assert.match(appJs, /first 10 minutes in class rule/);
  assert.match(appJs, /paper rubric option/);
  assert.match(appJs, /May 5 archive\/download copy/);
  assert.match(appJs, /not login, permission, or a private workflow/);
});

test("public guide home exposes no-hidden-core-content route coverage", () => {
  assert.match(appJs, /data-no-hidden-core-content="true"/);
  assert.match(appJs, /Required Content Has A Visible Path/);
  assert.match(appJs, /required directions, due dates, rubrics, responsibilities, and actions/);
  assert.match(appJs, /const noHiddenCoreContentRoutes = \[/);
  for (const phrase of [
    "Plan the right project",
    "Build with evidence",
    "Prepare to present",
    "Finish and archive",
    "Requirements, program expectations, due windows",
    "Meeting duties, missed-meeting follow-up",
    "paper-rubric option",
    "May 5 archive reminder"
  ]) {
    assert.match(appJs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const href of [
    "program.html",
    "process.html",
    "calendar.html",
    "phase-1.html",
    "phase-2a.html",
    "phase-2b.html",
    "gathering-supplies.html",
    "managing-your-vision.html",
    "mentor-meeting-1.html",
    "mentor-meeting-2.html",
    "present.html",
    "project-showcase.html",
    "celebrate.html",
    "portfolio.html",
    "finish.html",
    "rubrics.html",
    "grades.html",
    "templates.html"
  ]) {
    assert.match(appJs, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("public support pages expose page-level teacher and mentor checkpoints", () => {
  assert.match(appJs, /data-resource-teacher-support="true"/);
  assert.match(appJs, /How Adults Can Support This Page/);
  assert.match(appJs, /teacherMoves: \[/);
  for (const phrase of [
    "Approve the sponsor contact plan",
    "Use the calendar to spot late proposal",
    "Review supply, safety, cost, space, and outside-contact needs",
    "Listen for scope creep",
    "Watch for missed meetings and make-up needs",
    "Help students sort finished work, partial work, blockers, and cuts",
    "Check final build evidence and presentation outline together",
    "Use a quick visitor test"
  ]) {
    assert.match(appJs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("public phase pages expose page-level adult support checks", () => {
  assert.match(appJs, /data-phase-teacher-support="true"/);
  assert.match(appJs, /How Adults Can Support This Step/);
  assert.match(appJs, /function phaseTeacherSupportHtml\(phase\)/);
  assert.match(appJs, /phaseTeacherSupportHtml\(phase\)/);
  for (const phrase of [
    "Use these checks to keep students moving without taking over the work.",
    "Ask students to show or name this evidence before moving on",
    "Use this check-in question when a student is stuck",
    "Senior program teacher: checks program fit",
    "Mentor: reviews progress, presentation outline, and logistics"
  ]) {
    assert.match(appJs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("public workspace workflow guide avoids stale future-app and implementation copy", () => {
  assert.match(appJs, /Workspace Workflow/);
  assert.match(appJs, /How The Signed-In Workspace Works/);
  assert.match(appJs, /A public guide to the signed-in workflow/);
  assert.match(appJs, /real student records stay inside the Capstone Project Workspace/);
  assert.match(appJs, /Example workspace search/);
  assert.match(appJs, /Protected activity/);
  assert.doesNotMatch(appJs, /Future App Workflow/);
  assert.doesNotMatch(appJs, /Non-production workflow preview/);
  assert.doesNotMatch(appJs, /when the backend is ready/);
  assert.doesNotMatch(appJs, /Search preview data/);
  assert.doesNotMatch(appJs, /source counts/);
  assert.doesNotMatch(appJs, /Audit-sensitive/);
  assert.doesNotMatch(appJs, /No localStorage source of truth/);
  assert.doesNotMatch(appJs, /role scope created/);
});

test("protected evidence access route is scoped, audited, and avoids storage id exposure", () => {
  assert.match(evidenceRoute, /getCurrentUser/);
  assert.match(evidenceRoute, /canAccessStudent/);
  assert.match(evidenceRoute, /getRoleAssignments/);
  assert.match(evidenceRoute, /evidence_artifacts/);
  assert.match(evidenceRoute, /evidence_access_unauthorized/);
  assert.match(evidenceRoute, /evidence_access_denied/);
  assert.match(evidenceRoute, /evidence_access_checked/);
  assert.match(evidenceRoute, /actorRoleScopes/);
  assert.match(evidenceRoute, /roleId: assignment\.role_id/);
  assert.match(evidenceRoute, /scopeType: assignment\.scope_type/);
  assert.match(evidenceRoute, /scopeId: assignment\.scope_id/);
  assert.match(evidenceRoute, /source_kind === "external_link"/);
  assert.doesNotMatch(evidenceRoute, /drive_file_id|drive_parent_folder_id/);
});

test("health route reports Drive credential readiness without exposing secret values", () => {
  assert.match(envTypes, /GOOGLE_DRIVE_CLIENT_EMAIL/);
  assert.match(envTypes, /GOOGLE_DRIVE_PRIVATE_KEY/);
  assert.match(healthRoute, /googleDriveCredentialsConfigured/);
  assert.match(healthRoute, /googleDriveCredentialParts/);
  assert.match(healthRoute, /isConfiguredSecret/);
  assert.doesNotMatch(healthRoute, /GOOGLE_DRIVE_PRIVATE_KEY\s*[,}]/);
});
