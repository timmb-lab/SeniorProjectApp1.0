import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { onRequestGet as onMe } from "../functions/api/auth/me.ts";
import { onRequestGet as onAdminDashboard } from "../functions/api/admin/dashboard.ts";
import { onRequestGet as onProgramTeacherDashboard } from "../functions/api/program-teacher/dashboard.ts";
import { onRequestGet as onMentorDashboard } from "../functions/api/mentor/dashboard.ts";
import { onRequestGet as onTeacherReviewQueue } from "../functions/api/teacher/review-queue.ts";
import { onRequestGet as onReadinessReport } from "../functions/api/reports/readiness.ts";
import { onRequestGet as onSiteStudents } from "../functions/api/site/students.ts";
import { onRequestGet as onSiteStudentDetail } from "../functions/api/site/students/[studentId].ts";
import { onRequestGet as onSiteReviewQueue } from "../functions/api/site/review-queue.ts";
import {
  DirectD1Adapter,
  parseArgs,
  runDemoSeed,
} from "../scripts/seed-local-demo-workspace.mjs";
import { createSqliteD1 } from "./helpers/d1-sqlite.mjs";
import { buildRequest, seedSession } from "./helpers/auth-fixtures.mjs";

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

test("demo seeder refuses remote mode", () => {
  assert.throws(
    () => parseArgs(["--remote", "--dry-run"]),
    /local-only|remote/i,
  );
});

test("demo dry run writes nothing and requires protected admins", async () => {
  const dbWithoutAdmins = createSqliteD1({ migrations: MIGRATIONS });
  await assert.rejects(
    () => runDemoSeed({ target: "local", mode: "dryrun", reset: false }, {
      adapter: new DirectD1Adapter(dbWithoutAdmins),
      verifyRepo: false,
      writeCredentials: false,
    }),
    /protected local admins/i,
  );

  const db = await createDemoDb();
  const result = await runDemoSeed({ target: "local", mode: "dryrun", reset: false }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    writeCredentials: false,
  });
  assert.equal(result.ok, true);
  assert.equal(result.deletePlan.totalDemoRowsFoundBeforeReset, 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test'"), 0);
});

test("demo seed creates deterministic fake workspace rows and preserves admins", async () => {
  const db = await createDemoDb();
  await db.prepare(
    `INSERT INTO announcements (id, title, body, audience_scope, audience_id, created_by)
     VALUES ('demo-announcement-stale', 'DEMO_SEED: stale announcement', 'DEMO_SEED: stale announcement body', 'all', NULL, 'protected-admin-primary')`,
  ).run();
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "capstone-demo-seed-"));
  const result = await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    repoRoot,
    assertIgnored: () => {},
    now: new Date("2026-05-22T12:00:00.000Z"),
  });

  assert.equal(result.finalVerification.demoStudents, 370);
  assert.equal(result.finalVerification.primarySiteStudents, 250);
  assert.deepEqual(result.finalVerification.secondarySiteCounts, {
    "site-canyon-ridge-career": 60,
    "site-north-valley-tech": 60,
  });
  assert.equal(result.finalVerification.demoProgramTeachers, 22);
  assert.equal(result.finalVerification.demoMentors, 41);
  assert.equal(result.finalVerification.mentorAssignments, 320);
  assert.equal(result.finalVerification.studentsWithMentors, 320);
  assert.equal(result.finalVerification.studentsWithoutMentors, 50);
  assert.equal(result.finalVerification.submissions, 344);
  assert.equal(result.finalVerification.evidenceMetadata, 964);
  assert.equal(result.finalVerification.mentorMeetings, 200);
  assert.equal(result.finalVerification.presentationSlots, 72);
  assert.equal(result.finalVerification.globalAdmins, 1);
  assert.equal(result.finalVerification.administrationUsers, 1);
  assert.equal(result.finalVerification.siteAdmins, 3);
  assert.equal(result.finalVerification.viewers, 1);
  assert.equal(result.finalVerification.viewerStudentAssignments, 3);
  assert.equal(result.finalVerification.studentCredentials, 0);
  assert.equal("announcements" in result.generatedCounts, false);
  assert.equal(result.finalVerification.announcements, 0);
  assert.equal(result.finalVerification.foreignKeyViolations, 0);
  assert.equal(result.protectedAdminsAfter.preserved, true);

  assert.deepEqual(result.finalVerification.programDistribution, {
    Construction: 37,
    Culinary: 47,
    "Early Childhood Education": 32,
    "Hospitality & Marketing": 37,
    IT: 69,
    "Mechanical Technology": 37,
    "Medical Professions": 32,
    "Sports Medicine": 47,
    "Teaching & Training": 32,
  });
  assert.equal(result.finalVerification.storyBuckets.model_excellent.count, 3);
  assert.equal(result.finalVerification.storyBuckets.missing_mentor.count, 10);
  assert.equal(result.finalVerification.storyBuckets.awaiting_review.count, 10);
  assert.equal(result.finalVerification.storyBuckets.revision_requested.count, 10);
  assert.equal(result.finalVerification.storyBuckets.presentation_pending.count, 10);
  assert.equal(result.finalVerification.storyBuckets.archive_ready.count, 10);
  assert.equal(result.finalVerification.storyBuckets.archive_failed.count, 5);
  assert.equal(result.finalVerification.storyBuckets.high_risk.count, 5);
  assert.equal(result.finalVerification.storyBuckets.rich_timeline.count, 3);

  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test' AND email_norm NOT LIKE '%.test'"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%@demo-staff.capstone.test' AND email_norm NOT LIKE '%.test'"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%nv.ccsd.net' OR email_norm = 'bryan@thecapstoneapp.com'"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm IN ('bryan@learntechonline.com', 'bryan.timm89@gmail.com')"), 2);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student' WHERE u.email_norm LIKE '%@demo-student.capstone.test'"), 370);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'mentor' WHERE u.email_norm LIKE '%@demo-staff.capstone.test'"), 41);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'program_teacher' WHERE u.email_norm LIKE '%@demo-staff.capstone.test'"), 22);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND source_kind = 'external_link' AND external_url LIKE 'https://example.com/capstone-demo/%' AND drive_file_id IS NULL AND drive_parent_folder_id IS NULL"), 964);

  const statuses = await db.prepare(
    `SELECT COALESCE(s.status, 'not_started') AS status, COUNT(*) AS count
     FROM user_accounts u
     JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student'
     LEFT JOIN submissions s ON s.student_id = u.id
     WHERE u.email_norm LIKE '%@demo-student.capstone.test'
     GROUP BY COALESCE(s.status, 'not_started')`,
  ).all();
  const byStatus = Object.fromEntries(statuses.results.map((row) => [row.status, row.count]));
  assert.equal(byStatus.not_started, 26);
  assert.equal(byStatus.draft, 39);
  assert.equal(byStatus.submitted, 71);
  assert.equal(byStatus.revision_requested, 68);
  assert.equal(byStatus.approved, 137);
  assert.equal(byStatus.archived, 29);

  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM presentation_slots WHERE id LIKE 'demo-%' AND status NOT IN ('scheduled', 'checked_out', 'checked_in', 'completed', 'cancelled')"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM presentation_slots WHERE id LIKE 'demo-%' AND outline_status NOT IN ('pending', 'approved', 'revision_needed')"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM mentor_meetings WHERE id LIKE 'demo-%' AND status NOT IN ('scheduled', 'held', 'missed', 'makeup_required')"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM reviews r JOIN submissions s ON s.id = r.submission_id WHERE s.status = 'draft'"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM reviews WHERE id LIKE 'demo-%' AND decision NOT IN ('approved', 'revision_requested', 'comment_only')"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM comments WHERE id LIKE 'demo-%' AND body NOT LIKE '%DEMO_SEED%'"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM announcements WHERE id LIKE 'demo-%' OR title LIKE '%DEMO_SEED%' OR body LIKE '%DEMO_SEED%'"), 0);

  assert.match(result.credentialPath, /^\.secrets\/demo-staff-logins-/);
  const credentialPayload = JSON.parse(readFileSync(path.join(repoRoot, result.credentialPath), "utf8"));
  assert.equal(credentialPayload.personaLogins.length, 6);
  assert.equal(credentialPayload.programTeacherLogins.length, 3);
  assert.equal(credentialPayload.mentorLogins.length, 3);
  assert.equal(credentialPayload.sampleStudentLogins.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /DemoLocal!/);
});

test("demo seed is idempotent and reset removes prior demo-owned rows", async () => {
  const db = await createDemoDb();
  const adapter = new DirectD1Adapter(db);
  await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter,
    verifyRepo: false,
    writeCredentials: false,
  });
  const firstCounts = await finalCounts(db);
  await db.prepare(
    `INSERT INTO comments (id, entity_type, entity_id, body)
     VALUES ('demo-comment-extra-reset-check', 'submission', 'demo-submission-student-001-proposal', 'DEMO_SEED: extra row should be reset')`,
  ).run();
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM comments WHERE id = 'demo-comment-extra-reset-check'"), 1);

  const result = await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter,
    verifyRepo: false,
    writeCredentials: false,
  });
  assert.equal(result.deletePlan.demoRowsDeleted.comments > 0, true);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM comments WHERE id = 'demo-comment-extra-reset-check'"), 0);
  assert.deepEqual(await finalCounts(db), firstCounts);
});

test("demo APIs can see seeded admin, teacher, mentor, and readiness data", async () => {
  const db = await createDemoDb();
  await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    writeCredentials: false,
  });
  const env = { DB: db, SESSION_COOKIE_NAME: "sc_session" };

  const adminToken = await seedSession(db, env, "protected-admin-primary", "admin-demo-token");
  const adminMe = await routeJson(onMe, env, "/api/auth/me", adminToken);
  assert.equal(adminMe.authenticated, true);
  assert.equal(adminMe.user.roles.some((role) => role.role_id === "admin"), true);

  const adminDashboard = await routeJson(onAdminDashboard, env, "/api/admin/dashboard", adminToken);
  assert.equal(adminDashboard.summary.studentsTotal, 370);
  assert.equal(adminDashboard.programBreakdown.length, 9);
  assert.equal(adminDashboard.mentorCoverage.length, 41);
  assert.equal(adminDashboard.reviewQueue.length > 0, true);

  const adminReviewQueue = await routeJson(onTeacherReviewQueue, env, "/api/teacher/review-queue", adminToken);
  assert.equal(adminReviewQueue.queue.length > 0, true);
  const readiness = await routeJson(onReadinessReport, env, "/api/reports/readiness", adminToken);
  assert.equal(readiness.report.submitted > 0, true);
  assert.equal(readiness.report.revisionRequested > 0, true);
  assert.equal(readiness.report.approved > 0, true);
  assert.equal(readiness.report.evidence > 0, true);

  const teacherToken = await seedSession(db, env, "demo-teacher-it-01", "teacher-it-demo-token");
  const teacherMe = await routeJson(onMe, env, "/api/auth/me", teacherToken);
  assert.equal(teacherMe.user.roles.some((role) => role.role_id === "program_teacher" && role.scope_id === "it"), true);
  const teacherDashboard = await routeJson(onProgramTeacherDashboard, env, "/api/program-teacher/dashboard", teacherToken);
  assert.equal(teacherDashboard.summary.scopedStudents, 69);
  assert.equal(teacherDashboard.summary.totalStudents, 69);
  assert.equal(teacherDashboard.summary.onTrack > 0, true);
  assert.equal(teacherDashboard.summary.behindSupport > 0, true);
  assert.equal(teacherDashboard.summary.missingEvidence > 0, true);
  assert.equal(teacherDashboard.summary.needsReview > 0, true);
  assert.equal(teacherDashboard.summary.missingMentor > 0, true);
  assert.equal(teacherDashboard.summary.readyComplete > 0, true);
  assert.equal(teacherDashboard.programBreakdown.some((row) => row.programId === "it" && row.studentCount === 69), true);
  assert.equal(teacherDashboard.students.length > 0, true);
  assert.equal(
    teacherDashboard.needsAttention.some((item) => item.actionSection === "students" && item.actionPreset === "missing-mentors"),
    true,
  );
  assert.equal(
    teacherDashboard.needsAttention.some((item) => item.actionSection === "teacher" && item.actionPreset === "submitted"),
    true,
  );

  const missingMentor = await routeJson(onSiteStudents, env, "/api/site/students?siteId=site-desert-valley-high&noMentor=true&progressStatus=missing_mentor&limit=25", teacherToken);
  assert.equal(missingMentor.pagination.filteredTotal > 0, true);
  assert.equal(missingMentor.students.every((student) => student.siteId === "site-desert-valley-high" && student.programId === "it"), true);
  assert.equal(missingMentor.students.every((student) => student.hasActiveMentor === false || student.progressStatus === "missing_mentor"), true);

  const missingEvidence = await routeJson(onSiteStudents, env, "/api/site/students?siteId=site-desert-valley-high&evidenceStatus=missing&limit=25", teacherToken);
  assert.equal(missingEvidence.pagination.filteredTotal > 0, true);
  assert.equal(missingEvidence.students.every((student) => student.programId === "it" && student.evidenceStatus === "missing"), true);

  const needsReview = await routeJson(onSiteReviewQueue, env, "/api/site/review-queue?siteId=site-desert-valley-high&status=submitted&limit=25", teacherToken);
  assert.equal(needsReview.pagination.filteredTotal > 0, true);
  assert.equal(needsReview.queue.every((row) => row.siteId === "site-desert-valley-high" && row.programId === "it" && row.status === "submitted"), true);
  assert.equal(needsReview.permissions.canApprove, true);

  const detailStudentId = missingMentor.students[0].studentId;
  const teacherDetail = await routeJson(
    onSiteStudentDetail,
    env,
    `/api/site/students/${detailStudentId}?siteId=site-desert-valley-high`,
    teacherToken,
    { studentId: detailStudentId },
  );
  assert.equal(teacherDetail.scope.role, "program_teacher");
  assert.equal(teacherDetail.student.programId, "it");
  assert.equal(teacherDetail.mentor.active, false);
  assert.match(`${teacherDetail.student.nextAction} ${teacherDetail.mentor.nextAction}`, /mentor/i);
  assert.equal(teacherDetail.permissions.canManageSecurity, false);
  assert.equal(teacherDetail.permissions.canManageUsers, false);

  const mentorToken = await seedSession(db, env, "demo-mentor-001", "mentor-demo-token");
  const mentorMe = await routeJson(onMe, env, "/api/auth/me", mentorToken);
  assert.equal(mentorMe.user.roles.some((role) => role.role_id === "mentor"), true);
  const mentorDashboard = await routeJson(onMentorDashboard, env, "/api/mentor/dashboard", mentorToken);
  assert.equal(mentorDashboard.summary.assignedCount, 9);
  assert.equal(mentorDashboard.assignedStudents.length, 9);
});

test("demo persona and story docs stay sanitized and match multisite shape", () => {
  const personas = readFileSync("docs/demo/personas.md", "utf8");
  const storyMap = readFileSync("docs/demo/story-map.md", "utf8");
  const programTeacherHandoff = readFileSync("docs/demo/program-teacher-demo-handoff.md", "utf8");
  const docs = `${personas}\n${storyMap}\n${programTeacherHandoff}`;

  for (const text of [
    "Desert Valley School District",
    "Desert Valley High School",
    "Canyon Ridge Career Academy",
    "North Valley Technical High School",
    "Model Excellent Demo",
    "Missing Mentor Demo",
    "Awaiting Review Demo",
    "Revision Loop Demo",
    "Presentation Pending Demo",
    "Archive Ready Demo",
    "Archive Failed Demo",
    "High Risk Demo",
    "Rich Timeline Demo",
    ".secrets/demo-staff-logins-*.json",
    "Program Teacher Demo Handoff",
    "teacher-it-01@demo-staff.capstone.test",
    "Missing Evidence",
    "Needs Review",
  ]) {
    assert.match(docs, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.doesNotMatch(docs, /DemoLocal!|Q9!vV-|workingPassword|"password"\s*:|password_hash|password_salt/i);
  assert.doesNotMatch(docs, /@(?:nv\.ccsd\.net|gmail\.com|thecapstoneapp\.com|learntechonline\.com)/i);
});

async function createDemoDb() {
  const db = createSqliteD1({ migrations: MIGRATIONS });
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
  return db;
}

async function count(db, sql) {
  const row = await db.prepare(sql).first();
  return Number(row?.count || 0);
}

async function finalCounts(db) {
  return {
    students: await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test'"),
    staff: await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%@demo-staff.capstone.test'"),
    assignments: await count(db, "SELECT COUNT(*) AS count FROM mentor_assignments WHERE id LIKE 'demo-%'"),
    submissions: await count(db, "SELECT COUNT(*) AS count FROM submissions WHERE id LIKE 'demo-%'"),
    evidence: await count(db, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%'"),
    comments: await count(db, "SELECT COUNT(*) AS count FROM comments WHERE id LIKE 'demo-%'"),
  };
}

async function routeJson(handler, env, route, token, params = undefined) {
  const response = await handler({
    request: buildRequest(`https://local.capstone.test${route}`, token),
    env,
    params,
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok === true || body.authenticated === true, true);
  return body;
}
