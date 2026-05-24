import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const dashboardRoute = await readFile("functions/api/student/dashboard.ts", "utf8");
const auditEventsRoute = await readFile("functions/api/admin/audit-events.ts", "utf8");
const archiveQueueRoute = await readFile("functions/api/admin/exports/student-archive.ts", "utf8");
const archiveReadinessRoute = await readFile("functions/api/student/archive/readiness.ts", "utf8");
const archiveExportLib = await readFile("functions/_lib/archive-export.ts", "utf8");
const evidenceRoute = await readFile("functions/api/submissions/[id]/evidence.ts", "utf8");
const submissionDetailRoute = await readFile("functions/api/submissions/[id].ts", "utf8");
const exportDownloadRoute = await readFile("functions/api/exports/[id]/download.ts", "utf8");
const productionRouteInventory = await readFile("docs/generated/production-route-inventory.md", "utf8");
const siteDashboardRoute = await readFile("functions/api/site/dashboard.ts", "utf8");
const mentorAssignedRoute = await readFile("functions/api/mentor/assigned.ts", "utf8");
const mentorMeetingsRoute = await readFile("functions/api/mentor/meetings.ts", "utf8");
const readinessRoute = await readFile("functions/api/reports/readiness.ts", "utf8");
const reviewHistoryRoute = await readFile("functions/api/reviews/[submissionId]/history.ts", "utf8");
const reviewQueueRoute = await readFile("functions/api/teacher/review-queue.ts", "utf8");
const submitRoute = await readFile("functions/api/submissions/[id]/submit.ts", "utf8");
const reviewRoute = await readFile("functions/api/reviews/[submissionId]/decision.ts", "utf8");
const workflowLib = await readFile("functions/_lib/workflow.ts", "utf8");
const workspaceJs = await readFile("workspace.js", "utf8");
const localDemoSeed = await readFile("scripts/seed-local-demo-workspace.mjs", "utf8");
const remoteDemoSeed = await readFile("scripts/seed-remote-demo-workspace.mjs", "utf8");
const localDemoProof = await readFile("scripts/prove-local-demo-workspace.mjs", "utf8");
const remoteDemoProof = await readFile("scripts/prove-remote-demo-workspace.mjs", "utf8");
const readme = await readFile("README.md", "utf8");
const productionSurfaceRegistry = await readFile("docs/production-surface-registry.md", "utf8");

test("student dashboard is D1-backed and uses server authorization", () => {
  assert.match(dashboardRoute, /getCurrentUser/);
  assert.match(dashboardRoute, /canAccessStudent/);
  assert.match(dashboardRoute, /progress_records/);
  assert.match(dashboardRoute, /submissions/);
  assert.match(dashboardRoute, /evidence_artifacts/);
  assert.match(dashboardRoute, /deriveNextAction/);
  assert.doesNotMatch(dashboardRoute, /localStorage|sessionStorage|indexedDB/);
});

test("student submission endpoint persists status history and audit events", () => {
  assert.match(submitRoute, /requirePost/);
  assert.match(submitRoute, /getCurrentUser/);
  assert.match(submitRoute, /hasRole\(env, user\.id, "student"\)/);
  assert.match(submitRoute, /UPDATE submissions/);
  assert.match(submitRoute, /UPDATE progress_records/);
  assert.match(submitRoute, /writeStatusHistory/);
  assert.match(submitRoute, /submission_submit_unauthorized/);
  assert.match(submitRoute, /submission_submitted/);
  assert.match(submitRoute, /submission_submit_denied/);
  assert.match(submitRoute, /actorRoleScopes/);
});

test("submission detail endpoint returns scoped protected-record readback", () => {
  assert.match(submissionDetailRoute, /onRequestGet/);
  assert.match(submissionDetailRoute, /canViewSubmission/);
  assert.match(submissionDetailRoute, /submission_detail_unauthorized/);
  assert.match(submissionDetailRoute, /submission_detail_denied/);
  assert.match(submissionDetailRoute, /submission_detail_viewed/);
  assert.match(submissionDetailRoute, /actorRoleScopes/);
  assert.match(submissionDetailRoute, /storageIdentifiersRedacted: true/);
  assert.match(submissionDetailRoute, /SELECT id, title, artifact_type, source_kind, review_status, created_at/);
  assert.doesNotMatch(submissionDetailRoute, /drive_file_id/);
});

test("student evidence endpoint validates HTTPS metadata and keeps file upload pending", () => {
  assert.match(evidenceRoute, /cleanHttpsUrl/);
  assert.match(evidenceRoute, /INSERT INTO evidence_artifacts/);
  assert.match(evidenceRoute, /sourceKind: "external_link"/);
  assert.match(evidenceRoute, /evidence_attach_unauthorized/);
  assert.match(evidenceRoute, /evidence_link_attached/);
  assert.match(evidenceRoute, /evidence_attach_denied/);
  assert.match(evidenceRoute, /actorRoleScopes/);
  assert.match(evidenceRoute, /fileBytesReady: false/);
});

test("production route inventory classifies the canonical workspace route", () => {
  assert.match(productionRouteInventory, /\| workspace\.html \| senior-capstone-app \| production \| conditional \|/);
  assert.match(productionRouteInventory, /\| \/api\/site\/dashboard \| functions\/api\/site\/dashboard\.ts \| senior-capstone-app \| production \| conditional \|/);
  assert.match(productionRouteInventory, /Canonical protected app route/);
  assert.doesNotMatch(productionRouteInventory, /\| workspace\.html \|  \| unknown \| unknown \|/);
});

test("site dashboard route is site-scoped and not a legacy global dashboard wrapper", () => {
  assert.match(siteDashboardRoute, /canViewSiteDashboard/);
  assert.match(siteDashboardRoute, /getAccessibleSiteIds/);
  assert.match(siteDashboardRoute, /site_users/);
  assert.match(siteDashboardRoute, /site_programs/);
  assert.match(siteDashboardRoute, /site_dashboard_viewed/);
  assert.match(siteDashboardRoute, /site_dashboard_denied/);
  assert.match(siteDashboardRoute, /site_dashboard_unauthorized/);
  assert.match(siteDashboardRoute, /DEMO_DEFAULT_SITE_ID = "site-desert-valley-high"/);
  assert.match(siteDashboardRoute, /readOnly \? false :/);
  assert.doesNotMatch(siteDashboardRoute, /from "\.\.\/admin\/dashboard|\/api\/admin\/dashboard|drive_file_id|drive_parent_folder_id|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key/i);
});

test("review decision endpoint enforces teacher or admin scope and immutable review records", () => {
  assert.match(reviewRoute, /canReviewSubmission/);
  assert.match(reviewRoute, /comment_only/);
  assert.match(reviewRoute, /INSERT INTO reviews/);
  assert.match(reviewRoute, /INSERT INTO comments/);
  assert.match(reviewRoute, /UPDATE submissions/);
  assert.match(reviewRoute, /UPDATE progress_records/);
  assert.match(reviewRoute, /writeStatusHistory/);
  assert.match(reviewRoute, /submission_approved/);
  assert.match(reviewRoute, /submission_revision_requested/);
  assert.match(reviewRoute, /submission_review_comment_added/);
  assert.match(reviewRoute, /review_decision_unauthorized/);
  assert.match(reviewRoute, /review_decision_denied/);
  assert.match(reviewRoute, /actorRoleScopes/);
  assert.match(workflowLib, /hasRole\(env, reviewer\.id, "program_teacher"\)/);
  assert.match(workflowLib, /isAdmin\(env, reviewer\.id\)/);
  assert.match(workflowLib, /canAccessStudent/);
});

test("review history endpoint is scoped and includes status and version history", () => {
  assert.match(reviewHistoryRoute, /canViewSubmission/);
  assert.match(reviewHistoryRoute, /review_history_unauthorized/);
  assert.match(reviewHistoryRoute, /review_history_denied/);
  assert.match(reviewHistoryRoute, /review_history_viewed/);
  assert.match(reviewHistoryRoute, /actorRoleScopes/);
  assert.match(reviewHistoryRoute, /FROM reviews/);
  assert.match(reviewHistoryRoute, /FROM status_history/);
  assert.match(reviewHistoryRoute, /FROM submission_versions/);
  assert.match(reviewHistoryRoute, /FROM comments/);
  assert.match(reviewHistoryRoute, /reviewer_name/);
  assert.match(reviewHistoryRoute, /changed_by_name/);
  assert.match(reviewHistoryRoute, /author_name/);
  assert.match(reviewHistoryRoute, /evidence_snapshot_json/);
});

test("teacher review queue scopes submissions by program or admin role", () => {
  assert.match(reviewQueueRoute, /hasRole\(env, user\.id, "program_teacher"\)/);
  assert.match(reviewQueueRoute, /isAdmin\(env, user\.id\)/);
  assert.match(reviewQueueRoute, /teacherScopePredicate/);
  assert.match(reviewQueueRoute, /submissions\.status IN \('submitted', 'revision_requested'\)/);
  assert.match(reviewQueueRoute, /COUNT\(evidence\.id\) AS evidence_count/);
});

test("admin audit endpoint is admin-only and redacts sensitive metadata", () => {
  assert.match(auditEventsRoute, /isAdmin/);
  assert.match(auditEventsRoute, /FROM audit_events/);
  assert.match(auditEventsRoute, /redactMetadata/);
  assert.match(auditEventsRoute, /\[redacted\]/);
  assert.match(auditEventsRoute, /entityType/);
  assert.match(auditEventsRoute, /action/);
});

test("announcement routes and seed creation are removed from active MVP surfaces", () => {
  assert.equal(existsSync("functions/api/announcements.ts"), false);
  assert.equal(existsSync("functions/api/admin/announcements.ts"), false);
  assert.doesNotMatch(productionRouteInventory, /\/api\/(?:admin\/)?announcements/);
  assert.doesNotMatch(workspaceJs, /\/api\/announcements|announcements:\s*null|Current Updates|No current announcements/i);
  assert.doesNotMatch(readme, /\/api\/(?:admin\/)?announcements/);
  assert.doesNotMatch(productionSurfaceRegistry, /\| \/api\/(?:admin\/)?announcements \|/);
  assert.match(productionSurfaceRegistry, /announcement routes are removed from the active MVP product surface/i);
  assert.doesNotMatch(localDemoSeed, /announcementRow|rows\.announcements|pushRows\(statements, "announcements"|optional\.announcements/);
  assert.match(localDemoSeed, /\["announcements",/);
  assert.doesNotMatch(remoteDemoSeed, /optional\.announcements|announcements:\s*\[\]/);
  assert.match(localDemoProof, /noAnnouncements|announcements.*0/);
  assert.doesNotMatch(`${localDemoProof}\n${remoteDemoProof}`, /\/api\/(?:admin\/)?announcements|announcementRow|rows\.announcements|pushRows\(statements, "announcements"/);
});

test("archive export endpoints generate scoped manifest artifacts and expiry states", () => {
  assert.match(archiveQueueRoute, /isAdmin/);
  assert.match(archiveQueueRoute, /INSERT INTO exports/);
  assert.match(archiveQueueRoute, /buildStudentArchiveManifest/);
  assert.match(archiveQueueRoute, /INSERT INTO export_artifacts/);
  assert.match(archiveQueueRoute, /student_archive_export_generated/);
  assert.match(archiveQueueRoute, /verifyArchiveProviderReady/);
  assert.match(archiveQueueRoute, /uploadStudentArchiveDrivePackage/);
  assert.match(archiveQueueRoute, /student_archive_export_drive_upload_failed/);
  assert.match(archiveQueueRoute, /student_archive_export_provider_unavailable/);
  assert.match(archiveQueueRoute, /missing_reason/);
  assert.match(archiveQueueRoute, /scopedDownloadReady: true/);
  assert.match(archiveQueueRoute, /signedDownloadReady: false/);
  assert.match(archiveExportLib, /STUDENT_ARCHIVE_MANIFEST_TYPE/);
  assert.match(archiveExportLib, /STUDENT_ARCHIVE_DRIVE_PACKAGE_TYPE/);
  assert.match(archiveExportLib, /getArchiveRetentionPolicy/);
  assert.match(archiveExportLib, /uploadGoogleDriveFile/);
  assert.match(archiveExportLib, /archiveArtifactExpiresSoon/);
  assert.match(archiveExportLib, /policy_review_required/);
  assert.match(archiveExportLib, /drive_credentials_missing/);
  assert.match(archiveExportLib, /storage identifiers are redacted/i);
  assert.doesNotMatch(archiveExportLib, /drive_file_id/i);
  assert.match(archiveReadinessRoute, /student_archive_readiness_viewed/);
  assert.match(archiveReadinessRoute, /student_archive_readiness_denied/);
  assert.match(archiveReadinessRoute, /canAccessStudent/);
  assert.match(archiveReadinessRoute, /getArchiveProviderConfiguration/);
  assert.match(archiveReadinessRoute, /providerStatus/);
  assert.match(archiveReadinessRoute, /policyReviewRequired/);
  assert.match(archiveReadinessRoute, /downloadExpiresSoon/);
  assert.match(archiveReadinessRoute, /storageIdentifiersRedacted: true/);
  assert.match(archiveReadinessRoute, /scopedDownloadReady/);
  assert.match(archiveReadinessRoute, /drivePackageReady/);
  assert.match(exportDownloadRoute, /canAccessStudent/);
  assert.match(exportDownloadRoute, /export_download_denied/);
  assert.match(exportDownloadRoute, /export_downloaded/);
  assert.match(exportDownloadRoute, /export_download_expired/);
  assert.match(exportDownloadRoute, /archive_artifact_missing/);
  assert.match(exportDownloadRoute, /x-archive-storage-identifiers-redacted/);
  assert.match(exportDownloadRoute, /x-archive-drive-package-ready/);
  assert.match(exportDownloadRoute, /signedDownloadReady: false/);
});

test("mentor and misc-admin reporting endpoints stay scoped and aggregate-only", () => {
  assert.match(mentorAssignedRoute, /hasRole\(env, user\.id, "mentor"\)/);
  assert.match(mentorAssignedRoute, /mentor_assignments/);
  assert.match(mentorAssignedRoute, /assignedStudents/);
  assert.match(readinessRoute, /hasRole\(env, user\.id, "misc_admin"\)/);
  assert.match(readinessRoute, /aggregate_only/);
  assert.match(readinessRoute, /readiness_report_viewed/);
  assert.doesNotMatch(readinessRoute, /student_name|display_name|email/);
});

test("mentor meetings endpoint audits scoped protected-record access", () => {
  assert.match(mentorMeetingsRoute, /canAccessStudent/);
  assert.match(mentorMeetingsRoute, /mentor_meetings_unauthorized/);
  assert.match(mentorMeetingsRoute, /mentor_meetings_denied/);
  assert.match(mentorMeetingsRoute, /mentor_meetings_viewed/);
  assert.match(mentorMeetingsRoute, /mentor_meeting_unauthorized/);
  assert.match(mentorMeetingsRoute, /mentor_meeting_denied/);
  assert.match(mentorMeetingsRoute, /actorRoleScopes/);
  assert.match(mentorMeetingsRoute, /missing_meeting_view_role/);
  assert.match(mentorMeetingsRoute, /student_scope_denied/);
});
