import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const dashboardRoute = await readFile("functions/api/student/dashboard.ts", "utf8");
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
