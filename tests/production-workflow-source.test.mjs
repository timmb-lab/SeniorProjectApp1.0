import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const dashboardRoute = await readFile("functions/api/student/dashboard.ts", "utf8");
const auditEventsRoute = await readFile("functions/api/admin/audit-events.ts", "utf8");
const evidenceRoute = await readFile("functions/api/submissions/[id]/evidence.ts", "utf8");
const reviewHistoryRoute = await readFile("functions/api/reviews/[submissionId]/history.ts", "utf8");
const reviewQueueRoute = await readFile("functions/api/teacher/review-queue.ts", "utf8");
const submitRoute = await readFile("functions/api/submissions/[id]/submit.ts", "utf8");
const reviewRoute = await readFile("functions/api/reviews/[submissionId]/decision.ts", "utf8");
const workflowLib = await readFile("functions/_lib/workflow.ts", "utf8");

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
  assert.match(submitRoute, /submission_submitted/);
  assert.match(submitRoute, /submission_submit_denied/);
});

test("student evidence endpoint validates HTTPS metadata and keeps file upload pending", () => {
  assert.match(evidenceRoute, /cleanHttpsUrl/);
  assert.match(evidenceRoute, /INSERT INTO evidence_artifacts/);
  assert.match(evidenceRoute, /sourceKind: "external_link"/);
  assert.match(evidenceRoute, /evidence_link_attached/);
  assert.match(evidenceRoute, /evidence_attach_denied/);
  assert.match(evidenceRoute, /fileBytesReady: false/);
});

test("review decision endpoint enforces teacher or admin scope and immutable review records", () => {
  assert.match(reviewRoute, /canReviewSubmission/);
  assert.match(reviewRoute, /INSERT INTO reviews/);
  assert.match(reviewRoute, /UPDATE submissions/);
  assert.match(reviewRoute, /UPDATE progress_records/);
  assert.match(reviewRoute, /writeStatusHistory/);
  assert.match(reviewRoute, /submission_approved/);
  assert.match(reviewRoute, /submission_revision_requested/);
  assert.match(reviewRoute, /review_decision_denied/);
  assert.match(workflowLib, /hasRole\(env, reviewer\.id, "program_teacher"\)/);
  assert.match(workflowLib, /isAdmin\(env, reviewer\.id\)/);
  assert.match(workflowLib, /canAccessStudent/);
});

test("review history endpoint is scoped and includes status history", () => {
  assert.match(reviewHistoryRoute, /canViewSubmission/);
  assert.match(reviewHistoryRoute, /review_history_denied/);
  assert.match(reviewHistoryRoute, /FROM reviews/);
  assert.match(reviewHistoryRoute, /FROM status_history/);
  assert.match(reviewHistoryRoute, /reviewer_name/);
  assert.match(reviewHistoryRoute, /changed_by_name/);
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
