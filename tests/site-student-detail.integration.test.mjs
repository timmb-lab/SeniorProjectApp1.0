import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onSiteStudentDetail } from "../functions/api/site/students/[studentId].ts";
import { onRequestGet as onSiteStudentTimeline } from "../functions/api/site/students/[studentId]/timeline.ts";
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
];

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const FORBIDDEN_RESPONSE_FIELDS = /drive_file_id|drive_parent_folder_id|root_folder_id|index_sheet_id|storage_key|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key|content_sha256|body_json|PASSWORD_PEPPER|temporaryPassword|setupPassword/i;
const MUTATION_PERMISSION_KEYS = [
  "canMutateReviewDecision",
  "canAddStaffNote",
  "canManageMentorAssignments",
  "canManagePresentationOperations",
  "canManageArchiveOperations",
  "canManageUsers",
  "canManageSecurity",
];

test("site student detail and timeline are scoped, bounded, role-aware, and redacted", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();
  const stories = {
    modelExcellent: await findStudentByPrefix(env, "Model Excellent Demo"),
    missingMentor: await findStudentByPrefix(env, "Missing Mentor Demo"),
    revisionLoop: await findStudentByPrefix(env, "Revision Loop Demo"),
    archiveFailed: await findStudentByPrefix(env, "Archive Failed Demo"),
    richTimeline: await findStudentByPrefix(env, "Rich Timeline Demo"),
  };
  const secondaryStudent = await findSiteStudent(env, CANYON_SITE_ID);
  const nonItStudent = await findPrimaryNonItStudent(env);

  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES ('history-mentor-detail', 'history.mentor.detail@senior-capstone.test', 'history.mentor.detail@senior-capstone.test', 'History Mentor', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES ('history-mentor-detail', 'mentor', 'site', ?)`,
  ).bind(PRIMARY_SITE_ID).run();
  await db.prepare(
    `INSERT INTO site_users (site_id, user_id, membership_status)
     VALUES (?, 'history-mentor-detail', 'active')`,
  ).bind(PRIMARY_SITE_ID).run();
  await db.prepare(
    `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active, created_at)
     VALUES ('history-assignment-detail', 'history-mentor-detail', ?, 'protected-admin-primary', 0, '2026-05-01T12:00:00.000Z')`,
  ).bind(stories.modelExcellent.id).run();
  await db.prepare(
    `INSERT INTO submissions (id, student_id, requirement_id, status, version, submitted_at, created_at, updated_at)
     VALUES ('meeting-context-submission', ?, 'req-proposal-draft', 'approved', 3, '2026-05-22T12:00:00.000Z', '2026-05-22T12:00:00.000Z', '2026-05-22T12:00:00.000Z')`,
  ).bind(stories.modelExcellent.id).run();
  await db.prepare(
    `INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, submission_id, status, scheduled_for, held_at, notes, created_by, created_at, updated_at)
     VALUES ('meeting-context-detail', 'history-mentor-detail', ?, 'meeting-context-submission', 'held', '2026-05-23T12:00:00.000Z', '2026-05-23T12:00:00.000Z', 'Reviewed the proposal revision plan.', 'history-mentor-detail', '2026-05-23T12:00:00.000Z', '2026-05-23T12:00:00.000Z')`,
  ).bind(stories.modelExcellent.id).run();

  {
    const { response, body } = await routeDetail(env, null, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const platform = await expectDetail(env, tokens.platformAdmin, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(platform.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(platform.scope.studentId, stories.modelExcellent.id);
  assert.equal(platform.student.displayName.startsWith("Model Excellent Demo"), true);
  assert.equal(platform.student.storyBucket, "model_excellent");
  assert.equal(["archived", "approved", "complete"].includes(platform.student.status), true);
  assert.equal(platform.timeline.strategy, "separate_route_with_preview");
  assert.equal(platform.timelinePreview.length <= platform.limits.timelinePreview, true);
  assert.equal(platform.submissions.length <= platform.limits.submissions, true);
  assert.equal(platform.evidence.length <= platform.limits.evidence, true);
  assert.equal(platform.reviews.length <= platform.limits.reviews, true);
  assert.equal(platform.comments.length <= platform.limits.comments, true);
  assert.equal(platform.statusHistory.length <= platform.limits.statusHistory, true);
  assert.equal(platform.mentorAssignmentHistory.length <= platform.limits.mentorAssignmentHistory, true);
  assert.equal(
    platform.mentorAssignmentHistory.some((assignment) => (
      assignment.assignmentId === "history-assignment-detail"
      && assignment.mentorName === "History Mentor"
      && assignment.active === false
      && assignment.assignedByName === "Bryan Timm"
    )),
    true,
  );
  assert.equal(platform.mentorMeetings.length <= platform.limits.mentorMeetings, true);
  assert.equal(
    platform.mentorMeetings.some((meeting) => (
      meeting.mentorMeetingId === "meeting-context-detail"
      && meeting.submissionTitle === "Senior Project Proposal Draft"
      && meeting.submissionStatus === "approved"
      && meeting.submissionVersion === 3
    )),
    true,
  );
  assert.deepEqual(platform.canonicalValues.storyBuckets, [
    "model_excellent",
    "missing_mentor",
    "awaiting_review",
    "revision_requested",
    "presentation_pending",
    "archive_ready",
    "archive_failed",
    "high_risk",
    "rich_timeline",
  ]);

  const inferred = await expectDetail(env, tokens.platformAdmin, stories.modelExcellent.id, "");
  assert.equal(inferred.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(inferred.scope.selectionMode, "student_accessible_site");

  const legacy = await expectDetail(env, tokens.legacyAdmin, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(legacy.scope.role, "global_admin");
  const org = await expectDetail(env, tokens.orgAdmin, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(org.scope.role, "administration");
  const orgOutside = await routeDetail(env, tokens.orgAdmin, "outside-student-001", "?siteId=site-outside-district");
  assert.equal(orgOutside.response.status, 403);
  assert.equal(orgOutside.body.reason, "site_not_accessible");

  const siteAdmin = await expectDetail(env, tokens.siteAdminPrimary, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdmin.scope.role, "site_admin");
  const siteAdminSecondaryByPrimarySite = await routeDetail(env, tokens.siteAdminPrimary, secondaryStudent.id, `?siteId=${PRIMARY_SITE_ID}`);
  const siteAdminMissingByPrimarySite = await routeDetail(env, tokens.siteAdminPrimary, "not-a-real-student", `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdminSecondaryByPrimarySite.response.status, 404);
  assert.equal(siteAdminMissingByPrimarySite.response.status, 404);
  assert.deepEqual(siteAdminSecondaryByPrimarySite.body, siteAdminMissingByPrimarySite.body);
  assert.doesNotMatch(JSON.stringify(siteAdminSecondaryByPrimarySite.body), new RegExp(secondaryStudent.id));
  assert.doesNotMatch(JSON.stringify(siteAdminSecondaryByPrimarySite.body), /Canyon|site-canyon-ridge-career/i);
  const siteAdminSecondarySite = await routeDetail(env, tokens.siteAdminPrimary, secondaryStudent.id, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(siteAdminSecondarySite.response.status, 403);
  assert.equal(siteAdminSecondarySite.body.reason, "site_not_accessible");

  const viewer = await expectDetail(env, tokens.viewerPrimary, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.scope.readOnly, true);
  assert.equal(viewer.permissions.canViewStudentEvidence, true);
  for (const key of MUTATION_PERMISSION_KEYS) assert.equal(viewer.permissions[key], false, `viewer ${key}`);

  const teacher = await expectDetail(env, tokens.programTeacher, stories.revisionLoop.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(teacher.scope.role, "program_teacher");
  assert.equal(teacher.student.programId, "it");
  for (const key of MUTATION_PERMISSION_KEYS) assert.equal(teacher.permissions[key], false, `program teacher ${key}`);
  const teacherDenied = await routeDetail(env, tokens.programTeacher, nonItStudent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(teacherDenied.response.status, 404);
  assert.deepEqual(teacherDenied.body, { error: "not_found" });

  const mentorAssignedStudent = await findAssignedStudentForMentor(env, "demo-mentor-001");
  const mentor = await expectDetail(env, tokens.mentor, mentorAssignedStudent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(mentor.scope.role, "mentor");
  assert.equal(mentor.visibility.staffOnlyComments, "omitted");
  assert.equal(mentor.mentorAssignmentHistory.every((assignment) => !assignment.assignedByName), true);
  for (const key of MUTATION_PERMISSION_KEYS) assert.equal(mentor.permissions[key], false, `mentor ${key}`);
  const mentorDenied = await routeDetail(env, tokens.mentor, stories.missingMentor.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(mentorDenied.response.status, 404);
  assert.deepEqual(mentorDenied.body, { error: "not_found" });

  const studentOwn = await expectDetail(env, tokens.student, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(studentOwn.scope.role, "student");
  for (const key of MUTATION_PERMISSION_KEYS) assert.equal(studentOwn.permissions[key], false, `student ${key}`);

  for (const [label, token] of [
    ["misc_admin", tokens.miscAdmin],
  ]) {
    const denied = await routeDetail(env, token, stories.modelExcellent.id, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, `${label} should not access site detail`);
    assert.deepEqual(denied.body, { error: "forbidden" });
  }

  const invalidSite = await routeDetail(env, tokens.platformAdmin, stories.modelExcellent.id, "?siteId=../../bad-site");
  assert.equal(invalidSite.response.status, 403);
  assert.equal(invalidSite.body.reason, "invalid_site_id");
  const missingSite = await routeDetail(env, tokens.platformAdmin, stories.modelExcellent.id, "?siteId=site-does-not-exist");
  assert.equal(missingSite.response.status, 403);
  assert.equal(missingSite.body.reason, "site_not_accessible");

  const missingMentor = await expectDetail(env, tokens.platformAdmin, stories.missingMentor.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(missingMentor.student.storyBucket, "missing_mentor");
  assert.equal(missingMentor.mentor.active, false);
  assert.equal(missingMentor.mentor.mentorUserId, "");
  assert.match(missingMentor.mentor.nextAction, /Assign|mentor/i);

  const revisionLoop = await expectDetail(env, tokens.platformAdmin, stories.revisionLoop.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(revisionLoop.student.storyBucket, "revision_requested");
  assert.equal(revisionLoop.student.latestSubmissionStatus, "revision_requested");
  assert.equal(revisionLoop.reviews.some((review) => review.decision === "revision_requested" && /Revision requested/i.test(review.feedback)), true);
  assert.equal(revisionLoop.statusHistory.some((event) => event.toStatus === "revision_requested"), true);

  const archiveFailed = await expectDetail(env, tokens.platformAdmin, stories.archiveFailed.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(archiveFailed.student.storyBucket, "archive_failed");
  assert.equal(archiveFailed.archive.status, "failed");
  assert.equal(archiveFailed.archive.failed, true);
  assert.equal(archiveFailed.archive.storageIdentifiersRedacted, true);

  const richTimeline = await expectDetail(env, tokens.platformAdmin, stories.richTimeline.id, `?siteId=${PRIMARY_SITE_ID}`);
  const previewTypes = new Set(richTimeline.timelinePreview.map((event) => event.type));
  assert.equal(previewTypes.size >= 3, true);
  assert.equal(["evidence", "review", "comment", "mentor_meeting", "presentation", "archive_export"].some((type) => previewTypes.has(type)), true);
  assert.equal(richTimeline.evidence.every((row) => row.storageIdentifiersRedacted === true), true);
  assert.equal(richTimeline.evidence.some((row) => String(row.externalUrl || "").startsWith("https://example.com/capstone-demo/")), true);

  const timeline = await expectTimeline(env, tokens.platformAdmin, stories.richTimeline.id, `?siteId=${PRIMARY_SITE_ID}&limit=5`);
  assert.equal(timeline.events.length <= 5, true);
  assert.equal(timeline.pagination.limit, 5);
  assert.equal(timeline.events.some((event) => event.type === "evidence"), true);
  const timelineOffset = await expectTimeline(env, tokens.platformAdmin, stories.richTimeline.id, `?siteId=${PRIMARY_SITE_ID}&limit=2&offset=1`);
  assert.equal(timelineOffset.events.length <= 2, true);
  assert.notEqual(timelineOffset.events[0]?.id, timeline.events[0]?.id);
  const maxTimeline = await expectTimeline(env, tokens.platformAdmin, stories.richTimeline.id, `?siteId=${PRIMARY_SITE_ID}&limit=999`);
  assert.equal(maxTimeline.pagination.limit, 100);
  const filteredTimeline = await expectTimeline(env, tokens.platformAdmin, stories.richTimeline.id, `?siteId=${PRIMARY_SITE_ID}&type=evidence&limit=10`);
  assert.equal(filteredTimeline.events.length > 0, true);
  assert.equal(filteredTimeline.events.every((event) => event.type === "evidence"), true);
  const timelineDenied = await routeTimeline(env, tokens.siteAdminPrimary, secondaryStudent.id, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(timelineDenied.response.status, 404);

  for (const body of [
    platform,
    inferred,
    legacy,
    org,
    siteAdmin,
    viewer,
    teacher,
    mentor,
    studentOwn,
    missingMentor,
    revisionLoop,
    archiveFailed,
    richTimeline,
    timeline,
    timelineOffset,
    maxTimeline,
    filteredTimeline,
  ]) {
    assert.doesNotMatch(JSON.stringify(body), FORBIDDEN_RESPONSE_FIELDS);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_student_detail_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_student_detail_denied"), true);
  assert.equal(audits.some((event) => event.action === "site_student_detail_unauthorized"), true);
  assert.equal(audits.some((event) => event.action === "site_student_timeline_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_student_timeline_denied"), true);
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

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, subscription_status, storage_mode)
     VALUES ('tenant-outside-district', 'Outside District', 'outside-district', 'active', 'trial', 'app_managed_google_drive')`,
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, school_year, status)
     VALUES ('site-outside-district', 'tenant-outside-district', 'Outside High School', 'outside-high-school', '2025-2026', 'active')`,
  ).run();
  await seedUser(db, {
    id: "outside-student-001",
    displayName: "Outside Student One",
    email: "outside.student.001@demo-student.capstone.test",
    roleId: "student",
  });
  await db.prepare(
    "INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('site-outside-district', 'outside-student-001', 'active')",
  ).run();
  await seedUser(db, {
    id: "misc-detail-user",
    displayName: "Misc Detail User",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "readiness",
  });

  const tokens = {
    platformAdmin: await seedSession(db, env, "demo-platform-admin-001", "site-detail-platform"),
    legacyAdmin: await seedSession(db, env, "protected-admin-primary", "site-detail-legacy"),
    orgAdmin: await seedSession(db, env, "demo-administration-desert-valley-high", "site-detail-org"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-detail-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-detail-viewer"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-detail-teacher"),
    mentor: await seedSession(db, env, "demo-mentor-001", "site-detail-mentor"),
    student: await seedSession(db, env, "demo-student-001", "site-detail-student"),
    miscAdmin: await seedSession(db, env, "misc-detail-user", "site-detail-misc"),
  };

  return { db, env, tokens };
}

async function expectDetail(env, token, studentId, query = "") {
  const { response, body } = await routeDetail(env, token, studentId, query);
  assert.equal(response.status, 200, body?.error || "expected site student detail success");
  assert.equal(body.ok, true);
  return body;
}

async function expectTimeline(env, token, studentId, query = "") {
  const { response, body } = await routeTimeline(env, token, studentId, query);
  assert.equal(response.status, 200, body?.error || "expected site student timeline success");
  assert.equal(body.ok, true);
  return body;
}

async function routeDetail(env, token, studentId, query = "") {
  const response = await onSiteStudentDetail({
    request: buildRequest(`https://local.capstone.test/api/site/students/${encodeURIComponent(studentId)}${query}`, token),
    env,
    params: { studentId },
  });
  const body = await response.json();
  return { response, body };
}

async function routeTimeline(env, token, studentId, query = "") {
  const response = await onSiteStudentTimeline({
    request: buildRequest(`https://local.capstone.test/api/site/students/${encodeURIComponent(studentId)}/timeline${query}`, token),
    env,
    params: { studentId },
  });
  const body = await response.json();
  return { response, body };
}

async function findStudentByPrefix(env, prefix) {
  const row = await env.DB.prepare(
    `SELECT user_accounts.id, user_accounts.display_name
     FROM user_accounts
     JOIN site_users ON site_users.user_id = user_accounts.id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE user_accounts.display_name LIKE ?
     ORDER BY user_accounts.display_name ASC
     LIMIT 1`,
  ).bind(PRIMARY_SITE_ID, `${prefix}%`).first();
  assert.ok(row, `missing seeded story student ${prefix}`);
  return { id: row.id, displayName: row.display_name };
}

async function findSiteStudent(env, siteId) {
  const row = await env.DB.prepare(
    `SELECT user_accounts.id, user_accounts.display_name
     FROM site_users
     JOIN user_accounts ON user_accounts.id = site_users.user_id
      AND user_accounts.status = 'active'
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     WHERE site_users.site_id = ?
      AND site_users.membership_status = 'active'
     ORDER BY user_accounts.display_name ASC
     LIMIT 1`,
  ).bind(siteId).first();
  assert.ok(row, `missing seeded site student ${siteId}`);
  return { id: row.id, displayName: row.display_name };
}

async function findPrimaryNonItStudent(env) {
  const row = await env.DB.prepare(
    `SELECT DISTINCT user_accounts.id, user_accounts.display_name
     FROM site_users
     JOIN user_accounts ON user_accounts.id = site_users.user_id
      AND user_accounts.status = 'active'
     JOIN user_roles ON user_roles.user_id = user_accounts.id
      AND user_roles.role_id = 'student'
     JOIN group_memberships ON group_memberships.user_id = user_accounts.id
     JOIN groups ON groups.id = group_memberships.group_id
     WHERE site_users.site_id = ?
      AND site_users.membership_status = 'active'
      AND groups.program_id IS NOT NULL
      AND groups.program_id <> 'it'
     ORDER BY user_accounts.display_name ASC
     LIMIT 1`,
  ).bind(PRIMARY_SITE_ID).first();
  assert.ok(row, "missing non-IT primary-site student");
  return { id: row.id, displayName: row.display_name };
}

async function findAssignedStudentForMentor(env, mentorId) {
  const row = await env.DB.prepare(
    `SELECT user_accounts.id, user_accounts.display_name
     FROM mentor_assignments
     JOIN user_accounts ON user_accounts.id = mentor_assignments.student_user_id
      AND user_accounts.status = 'active'
     JOIN site_users ON site_users.user_id = user_accounts.id
      AND site_users.site_id = ?
      AND site_users.membership_status = 'active'
     WHERE mentor_assignments.mentor_user_id = ?
      AND mentor_assignments.active = 1
     ORDER BY user_accounts.display_name ASC
     LIMIT 1`,
  ).bind(PRIMARY_SITE_ID, mentorId).first();
  assert.ok(row, `missing assigned student for mentor ${mentorId}`);
  return { id: row.id, displayName: row.display_name };
}
