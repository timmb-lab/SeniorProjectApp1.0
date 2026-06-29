import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onSiteReviewQueue } from "../functions/api/site/review-queue.ts";
import { onRequestPost as onReviewDecision } from "../functions/api/reviews/[submissionId]/decision.ts";
import { onRequestGet as onReviewHistory } from "../functions/api/reviews/[submissionId]/history.ts";
import {
  DirectD1Adapter,
  runDemoSeed,
} from "../scripts/seed-local-demo-workspace.mjs";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1 } from "./helpers/d1-sqlite.mjs";

const MIGRATIONS = [
  "migrations/0001_foundation.sql",
  "migrations/0002_framework_seed.sql",
  "migrations/0003_framework_seed_data.sql",
  "migrations/0004_mentor_meetings.sql",
  "migrations/0005_submission_versions.sql",
  "migrations/0006_presentation_slots.sql",
  "migrations/0007_archive_export_artifacts.sql",
  "migrations/0008_update_drive_resource_ids.sql",
  "migrations/0009_update_drive_shared_drive_root.sql",
  "migrations/0010_tenant_google_sso.sql",
  "migrations/0011_multisite_site_role_foundation.sql",
  "migrations/0012_users_access_v5.sql",
  "migrations/0015_remove_org_admin_role.sql",
];

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const FORBIDDEN_RESPONSE_FIELDS = /drive_file_id|drive_parent_folder_id|root_folder_id|index_sheet_id|storage_key|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key|content_sha256|body_json|PASSWORD_PEPPER|temporaryPassword|setupPassword/i;
const MUTATION_PERMISSION_KEYS = ["canReview", "canApprove", "canRequestRevision", "canCommentOnly"];

test("site review queue is scoped, read-only by role, mutable for program teachers, audited, and redacted", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();
  const submittedIt = await findSubmittedProgramSubmissions(env, "it", 4);
  const revisionIt = await findSubmissionByStatusAndProgram(env, "revision_requested", "it");
  const nonItSubmitted = await findSubmittedOutsideProgram(env, "it");
  await ensureActiveEvidenceForSubmission(env, submittedIt[0]);
  await env.DB.prepare(
    "DELETE FROM evidence_artifacts WHERE submission_id = ?",
  ).bind(submittedIt[3].id).run();
  await insertArchivedEvidenceForSubmission(env, submittedIt[3]);

  {
    const { response, body } = await routeQueue(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const platform = await expectQueue(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(platform.scope.role, "global_admin");
  assert.equal(platform.scope.readOnly, true);
  assert.equal(platform.permissions.canReview, false);
  assert.equal(platform.queue.every((row) => row.siteId === PRIMARY_SITE_ID), true);

  const legacy = await expectQueue(env, tokens.legacyAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(legacy.scope.role, "global_admin");
  assert.equal(legacy.permissions.canReview, false);

  const administrationDenied = await routeQueue(env, tokens.orgAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(administrationDenied.response.status, 403);
  assert.deepEqual(administrationDenied.body, { error: "forbidden" });

  const siteAdmin = await expectQueue(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdmin.scope.role, "site_admin");
  assert.equal(siteAdmin.scope.readOnly, true);
  for (const key of MUTATION_PERMISSION_KEYS) assert.equal(siteAdmin.permissions[key], false, `site admin ${key}`);
  const siteAdminDenied = await routeQueue(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(siteAdminDenied.response.status, 403);
  assert.doesNotMatch(JSON.stringify(siteAdminDenied.body), /Canyon|site-canyon-ridge-career/i);

  const viewer = await routeQueue(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.response.status, 403);
  assert.deepEqual(viewer.body, { error: "forbidden" });

  const teacher = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&limit=100`);
  assert.equal(teacher.scope.role, "program_teacher");
  assert.equal(teacher.scope.readOnly, false);
  for (const key of MUTATION_PERMISSION_KEYS) assert.equal(teacher.permissions[key], true, `teacher ${key}`);
  assert.equal(teacher.queue.length > 0, true);
  assert.equal(teacher.queue.every((row) => row.siteId === PRIMARY_SITE_ID && row.programId === "it"), true);
  assert.equal(teacher.pagination.total < platform.pagination.total, true);
  assert.equal(teacher.pagination.total < 69, true);
  const revisionQueueRow = teacher.queue.find((row) => row.status === "revision_requested");
  assert.ok(revisionQueueRow);
  assert.equal(revisionQueueRow.decisionState, "student-revision");
  assert.equal(revisionQueueRow.approvalBlockedReason, "not_submitted");
  assert.deepEqual(revisionQueueRow.availableDecisions, {
    approved: false,
    revision_requested: false,
    comment_only: false,
  });
  assert.match(revisionQueueRow.nextAction, /Wait for student revision before recording another decision/);

  const paged = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&limit=2`);
  assert.equal(paged.pagination.limit, 2);
  assert.equal(paged.pagination.returned <= 2, true);
  const offset = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&limit=2&offset=1`);
  assert.notEqual(offset.queue[0]?.submissionId, paged.queue[0]?.submissionId);

  const submitted = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&status=submitted&limit=100`);
  assert.equal(submitted.queue.every((row) => row.status === "submitted"), true);
  const evidenceAttached = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&evidenceStatus=attached&limit=100`);
  assert.equal(evidenceAttached.queue.length > 0, true);
  assert.equal(evidenceAttached.queue.every((row) => row.evidenceCount > 0), true);
  assert.equal(evidenceAttached.pagination.filteredTotal, evidenceAttached.summary.evidenceAttached);
  const approvalReadyRow = evidenceAttached.queue.find((row) => row.submissionId === submittedIt[0].id);
  assert.ok(approvalReadyRow);
  assert.equal(approvalReadyRow.decisionState, "decision-ready");
  assert.equal(approvalReadyRow.approvalBlockedReason, "");
  assert.deepEqual(approvalReadyRow.availableDecisions, {
    approved: true,
    revision_requested: true,
    comment_only: true,
  });
  assert.match(approvalReadyRow.decisionGuidance, /active proof is attached/i);
  const evidenceMissing = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&evidenceStatus=missing&limit=100`);
  assert.equal(evidenceMissing.queue.length > 0, true);
  assert.equal(evidenceMissing.queue.every((row) => row.evidenceCount === 0), true);
  assert.equal(evidenceMissing.queue.every((row) => row.riskFlags.includes("missing_evidence")), true);
  assert.equal(evidenceMissing.pagination.filteredTotal, evidenceMissing.summary.evidenceMissing);
  const archivedOnlyProofRow = evidenceMissing.queue.find((row) => row.submissionId === submittedIt[3].id);
  assert.ok(archivedOnlyProofRow);
  assert.equal(archivedOnlyProofRow.evidenceCount, 0);
  assert.equal(archivedOnlyProofRow.decisionState, "proof-missing");
  assert.equal(archivedOnlyProofRow.approvalBlockedReason, "missing_evidence");
  assert.deepEqual(archivedOnlyProofRow.availableDecisions, {
    approved: false,
    revision_requested: true,
    comment_only: true,
  });
  assert.match(archivedOnlyProofRow.decisionGuidance, /active proof is missing/i);
  const missingMentor = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&risk=no_mentor&limit=100`);
  assert.equal(missingMentor.queue.length > 0, true);
  assert.equal(missingMentor.queue.every((row) => row.riskFlags.includes("no_mentor")), true);
  assert.equal(missingMentor.pagination.filteredTotal, missingMentor.summary.noMentor);
  const searched = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&search=${encodeURIComponent("Revision Loop Demo")}&limit=100`);
  assert.equal(searched.queue.every((row) => /Revision Loop Demo/i.test(row.studentName)), true);
  const noMatches = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&search=${encodeURIComponent("No Matching Review Work")}`);
  assert.equal(noMatches.queue.length, 0);
  assert.deepEqual(noMatches.emptyState, {
    reason: "No submitted or revision-requested work matches the current review filters.",
    owner: "Assigned review staff.",
    nextAction: "Clear or adjust filters to return to submitted work this view can access.",
  });

  for (const [label, token] of [
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc", tokens.miscAdmin],
  ]) {
    const denied = await routeQueue(env, token, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, label);
    assert.deepEqual(denied.body, { error: "forbidden" }, label);
  }

  const approved = await routeDecision(env, tokens.programTeacher, submittedIt[0].id, "approved", "Approved after reviewing private evidence.", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(approved.response.status, 200);
  assert.equal(approved.body.submission.status, "approved");
  await assertDecisionRecords(env, submittedIt[0].id, "approved", "approved");

  const revision = await routeDecision(env, tokens.programTeacher, submittedIt[1].id, "revision_requested", "Please add source context and resubmit.", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(revision.response.status, 200);
  assert.equal(revision.body.submission.status, "revision_requested");
  await assertDecisionRecords(env, submittedIt[1].id, "revision_requested", "revision_requested");

  const comment = await routeDecision(env, tokens.programTeacher, submittedIt[2].id, "comment_only", "Comment-only coaching note before final decision.", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(comment.response.status, 200);
  assert.equal(comment.body.submission.status, "submitted");
  await assertDecisionRecords(env, submittedIt[2].id, "comment_only", "submitted");

  const missingProof = await routeDecision(env, tokens.programTeacher, submittedIt[3].id, "approved", "Should attach proof before approval.", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(missingProof.response.status, 409);
  assert.deepEqual(missingProof.body, { error: "submission_missing_evidence", ok: false });

  const history = await routeHistory(env, tokens.siteAdminPrimary, submittedIt[0].id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(history.response.status, 200);
  assert.equal(history.body.ok, true);
  assert.equal(history.body.reviews.length >= 1, true);
  assert.doesNotMatch(JSON.stringify(history.body), FORBIDDEN_RESPONSE_FIELDS);

  const teacherOutOfScope = await routeDecision(env, tokens.programTeacher, nonItSubmitted.id, "approved", "Should not review.", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(teacherOutOfScope.response.status, 404);
  assert.deepEqual(teacherOutOfScope.body, { error: "not_found", ok: false });
  assert.doesNotMatch(JSON.stringify(teacherOutOfScope.body), new RegExp(nonItSubmitted.studentId));

  for (const [label, token] of [
    ["viewer", tokens.viewerPrimary],
    ["administration", tokens.orgAdmin],
    ["site_admin", tokens.siteAdminPrimary],
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc", tokens.miscAdmin],
  ]) {
    const denied = await routeDecision(env, token, submittedIt[3].id, "approved", "Should not mutate.", `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, label);
  }

  const conflict = await routeDecision(env, tokens.programTeacher, revisionIt.id, "approved", "Cannot approve a non-submitted row.", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(conflict.response.status, 409);
  assert.deepEqual(conflict.body, { error: "submission_not_in_review", ok: false });

  const legacyCompat = await routeDecision(env, tokens.legacyAdmin, submittedIt[3].id, "comment_only", "Legacy admin compatibility path.");
  assert.equal(legacyCompat.response.status, 200);
  assert.equal(legacyCompat.body.review.decision, "comment_only");

  for (const body of [platform, legacy, siteAdmin, teacher, paged, offset, submitted, evidenceAttached, evidenceMissing, missingMentor, searched, noMatches, approved.body, revision.body, comment.body, missingProof.body, legacyCompat.body]) {
    assert.doesNotMatch(JSON.stringify(body), FORBIDDEN_RESPONSE_FIELDS);
  }

  const refreshed = await expectQueue(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&status=submitted&limit=100`);
  assert.equal(refreshed.queue.some((row) => row.submissionId === submittedIt[0].id), false);
  assert.equal(refreshed.queue.some((row) => row.submissionId === submittedIt[1].id), false);
  assert.equal(refreshed.queue.some((row) => row.submissionId === submittedIt[2].id), true);

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "review_queue_viewed" && event.entity_type === "site_review_queue"), true);
  assert.equal(audits.some((event) => event.action === "review_queue_denied"), true);
  assert.equal(audits.some((event) => event.action === "review_queue_unauthorized"), true);
  assert.equal(audits.some((event) => event.action === "submission_approved"), true);
  assert.equal(audits.some((event) => event.action === "submission_revision_requested"), true);
  assert.equal(audits.some((event) => event.action === "submission_review_comment_added"), true);
  assert.equal(audits.some((event) => event.action === "review_decision_blocked_missing_evidence"), true);
  assert.doesNotMatch(JSON.stringify(audits), FORBIDDEN_RESPONSE_FIELDS);
});

async function createSeededDemoFixture() {
  const db = createSqliteD1({ migrations: MIGRATIONS });
  const env = {
    DB: db,
    SESSION_COOKIE_NAME: "sc_session",
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
  };

  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES
       ('protected-admin-primary', 'bryan@learntechonline.com', 'bryan@learntechonline.com', 'Bryan Timm', 'active'),
       ('protected-admin-breakglass', 'bryan.timm89@gmail.com', 'bryan.timm89@gmail.com', 'Bryan Timm', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES
       ('protected-admin-primary', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0),
       ('protected-admin-breakglass', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0)`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES
       ('protected-admin-primary', 'admin', 'global', ''),
       ('protected-admin-breakglass', 'admin', 'global', '')`,
  ).run();

  await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    writeCredentials: false,
  });

  await seedUser(db, {
    id: "misc-review-user",
    displayName: "Misc Review User",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "readiness",
  });

  const tokens = {
    platformAdmin: await seedSession(db, env, "demo-platform-admin-001", "site-review-platform"),
    legacyAdmin: await seedSession(db, env, "protected-admin-primary", "site-review-legacy"),
    orgAdmin: await seedSession(db, env, "demo-administration-desert-valley-high", "site-review-org"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-review-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-review-viewer"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-review-teacher"),
    mentor: await seedSession(db, env, "demo-mentor-001", "site-review-mentor"),
    student: await seedSession(db, env, "demo-student-001", "site-review-student"),
    miscAdmin: await seedSession(db, env, "misc-review-user", "site-review-misc"),
  };

  return { db, env, tokens };
}

async function expectQueue(env, token, query = "") {
  const { response, body } = await routeQueue(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site review queue success");
  assert.equal(body.ok, true);
  return body;
}

async function routeQueue(env, token, query = "") {
  const response = await onSiteReviewQueue({
    request: buildRequest(`https://local.capstone.test/api/site/review-queue${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

async function routeDecision(env, token, submissionId, decision, feedback, query = "") {
  const response = await onReviewDecision({
    request: buildRequest(`https://local.capstone.test/api/reviews/${encodeURIComponent(submissionId)}/decision${query}`, token, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, feedback }),
    }),
    env,
    params: { submissionId },
  });
  const body = await response.json();
  return { response, body };
}

async function routeHistory(env, token, submissionId, query = "") {
  const response = await onReviewHistory({
    request: buildRequest(`https://local.capstone.test/api/reviews/${encodeURIComponent(submissionId)}/history${query}`, token),
    env,
    params: { submissionId },
  });
  const body = await response.json();
  return { response, body };
}

async function ensureActiveEvidenceForSubmission(env, submission) {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO evidence_artifacts (
       id,
       student_id,
       submission_id,
       artifact_type,
       source_kind,
       external_url,
       title,
       review_status,
       created_by
     ) VALUES (?, ?, ?, 'review_proof', 'external_link', ?, 'Review approval proof', 'pending_review', ?)`,
  ).bind(
    `test-proof-${submission.id}`,
    submission.studentId,
    submission.id,
    `https://example.com/capstone-demo/proof/${encodeURIComponent(submission.id)}`,
    submission.studentId,
  ).run();
}

async function insertArchivedEvidenceForSubmission(env, submission) {
  await env.DB.prepare(
    `INSERT INTO evidence_artifacts (
       id,
       student_id,
       submission_id,
       artifact_type,
       source_kind,
       external_url,
       title,
       review_status,
       created_by
     ) VALUES (?, ?, ?, 'review_proof', 'external_link', ?, 'Archived approval proof', 'archived', ?)`,
  ).bind(
    `test-archived-proof-${submission.id}`,
    submission.studentId,
    submission.id,
    `https://example.com/capstone-demo/archived-proof/${encodeURIComponent(submission.id)}`,
    submission.studentId,
  ).run();
}

async function findSubmittedProgramSubmissions(env, programId, limit) {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT submissions.id, submissions.student_id
     FROM submissions
     JOIN site_users ON site_users.user_id = submissions.student_id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     JOIN group_memberships ON group_memberships.user_id = submissions.student_id
     JOIN groups ON groups.id = group_memberships.group_id
     WHERE groups.program_id = ?
      AND submissions.status = 'submitted'
     ORDER BY submissions.updated_at DESC, submissions.id ASC
     LIMIT ?`,
  ).bind(PRIMARY_SITE_ID, programId, limit).all();
  assert.equal((rows.results || []).length >= limit, true, `missing ${limit} submitted ${programId} submissions`);
  return (rows.results || []).map((row) => ({ id: row.id, studentId: row.student_id }));
}

async function findSubmissionByStatusAndProgram(env, status, programId) {
  const row = await env.DB.prepare(
    `SELECT DISTINCT submissions.id, submissions.student_id
     FROM submissions
     JOIN site_users ON site_users.user_id = submissions.student_id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     JOIN group_memberships ON group_memberships.user_id = submissions.student_id
     JOIN groups ON groups.id = group_memberships.group_id
     WHERE groups.program_id = ?
      AND submissions.status = ?
     ORDER BY submissions.updated_at DESC, submissions.id ASC
     LIMIT 1`,
  ).bind(PRIMARY_SITE_ID, programId, status).first();
  assert.ok(row, `missing ${status} ${programId} submission`);
  return { id: row.id, studentId: row.student_id };
}

async function findSubmittedOutsideProgram(env, programId) {
  const row = await env.DB.prepare(
    `SELECT DISTINCT submissions.id, submissions.student_id
     FROM submissions
     JOIN site_users ON site_users.user_id = submissions.student_id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     JOIN group_memberships ON group_memberships.user_id = submissions.student_id
     JOIN groups ON groups.id = group_memberships.group_id
     WHERE groups.program_id <> ?
      AND submissions.status = 'submitted'
     ORDER BY submissions.updated_at DESC, submissions.id ASC
     LIMIT 1`,
  ).bind(PRIMARY_SITE_ID, programId).first();
  assert.ok(row, `missing submitted non-${programId} submission`);
  return { id: row.id, studentId: row.student_id };
}

async function assertDecisionRecords(env, submissionId, decision, expectedStatus) {
  const submission = await env.DB.prepare(
    "SELECT status, student_id, requirement_id FROM submissions WHERE id = ?",
  ).bind(submissionId).first();
  assert.equal(submission.status, expectedStatus);

  const review = await env.DB.prepare(
    "SELECT decision FROM reviews WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1",
  ).bind(submissionId).first();
  assert.equal(review.decision, decision);

  const comment = await env.DB.prepare(
    "SELECT visibility FROM comments WHERE entity_type = 'submission' AND entity_id = ? ORDER BY created_at DESC LIMIT 1",
  ).bind(submissionId).first();
  assert.equal(comment.visibility, "student_and_staff");

  if (decision !== "comment_only") {
    const progress = await env.DB.prepare(
      "SELECT status FROM progress_records WHERE student_id = ? AND requirement_id = ?",
    ).bind(submission.student_id, submission.requirement_id).first();
    assert.equal(progress.status, expectedStatus);
    const statusHistory = await env.DB.prepare(
      "SELECT to_status FROM status_history WHERE entity_type = 'submission' AND entity_id = ? ORDER BY created_at DESC LIMIT 1",
    ).bind(submissionId).first();
    assert.equal(statusHistory.to_status, expectedStatus);
  }
}
