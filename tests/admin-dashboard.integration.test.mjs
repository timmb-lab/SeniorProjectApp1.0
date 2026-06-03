import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet } from "../functions/api/admin/dashboard.ts";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("admin dashboard enforces admin-only access and returns safe D1-backed summaries", async () => {
  const { env, db, tokens } = await createFixture();

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/admin/dashboard"),
      env,
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "unauthorized" });
  }

  for (const [label, token] of [
    ["student", tokens.studentA],
    ["mentor", tokens.mentor],
    ["program teacher", tokens.teacher],
    ["misc admin", tokens.misc],
  ]) {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/admin/dashboard", token),
      env,
    });
    assert.equal(response.status, 403, `${label} should be denied`);
    assert.deepEqual(await response.json(), { error: "forbidden" });
  }

  const response = await onRequestGet({
    request: buildRequest("https://example.test/api/admin/dashboard", tokens.admin),
    env,
  });
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.ok, true);
  assert.equal(body.scope, "admin_global");
  assert.equal(body.summary.studentsTotal, 3);
  assert.equal(body.summary.studentsActive, 3);
  assert.equal(body.summary.studentsNoMentor, 2);
  assert.equal(body.summary.submissionsSubmitted, 1);
  assert.equal(body.summary.revisionRequested, 1);
  assert.equal(body.summary.approved, 1);
  assert.equal(body.summary.evidenceArtifacts, 2);
  assert.equal(body.summary.mentorAssignmentsActive, 1);
  assert.equal(body.summary.mentorMeetingsMissed, 1);
  assert.equal(body.summary.presentationScheduled, 1);
  assert.equal(body.summary.exportsFailed, 1);
  assert.ok(Array.isArray(body.programBreakdown));
  assert.ok(body.programBreakdown.some((row) => row.programId === "it" && row.studentCount === 2));
  assert.equal(body.reviewQueue.length, 2);
  assert.equal(body.reviewQueue[0].studentName.length > 0, true);
  assert.ok(Array.isArray(body.mentorCoverage));
  assert.ok(Array.isArray(body.presentationSnapshot));
  assert.ok(Array.isArray(body.archiveSnapshot));
  assert.ok(Array.isArray(body.needsAttention));
  assert.ok(Array.isArray(body.recentAudit));
  assert.ok(Array.isArray(body.recentExports));
  assert.equal(body.recentExports.length, 3);
  assert.equal(body.recentExports[0].status, "failed");
  assert.equal(body.recentExports[0].studentName, "Student A");
  assert.equal(body.recentExports[1].status, "queued");
  assert.equal(body.recentExports[2].status, "complete");

  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /drive_file_id|drive_parent_folder_id|storage_key|temporaryPassword/i);
  assert.doesNotMatch(serialized, /password|token|secret/i);

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "admin_dashboard_viewed"), true);
  const viewed = audits.find((event) => event.action === "admin_dashboard_viewed");
  assert.deepEqual(viewed.metadata.scope, "admin_global");
  assert.equal(viewed.metadata.summaryCountsOnly, true);
});

async function createFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
    EVIDENCE_STORAGE_PROVIDER: "google_drive",
  };

  await db.prepare("INSERT OR IGNORE INTO cohorts (id, label, school_year) VALUES ('cohort-a', '2026 A', '2025-2026')").run();
  await db.prepare("INSERT OR IGNORE INTO groups (id, name, group_type, program_id, cohort_id) VALUES ('group-it', 'IT Seniors', 'program', 'it', 'cohort-a')").run();
  await db.prepare("INSERT OR IGNORE INTO groups (id, name, group_type, program_id, cohort_id) VALUES ('group-culinary', 'Culinary Seniors', 'program', 'culinary', 'cohort-a')").run();

  await seedUser(db, { id: "admin-a", displayName: "Admin A", roleId: "admin" });
  await seedUser(db, { id: "teacher-it", displayName: "Teacher IT", roleId: "program_teacher", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "mentor-a", displayName: "Mentor A", roleId: "mentor" });
  await seedUser(db, { id: "misc-a", displayName: "Misc A", roleId: "misc_admin", scopeType: "reporting", scopeId: "readiness" });
  await seedUser(db, { id: "student-a", displayName: "Student A", roleId: "student" });
  await seedUser(db, { id: "student-b", displayName: "Student B", roleId: "student" });
  await seedUser(db, { id: "student-c", displayName: "Student C", roleId: "student" });

  await db.prepare("INSERT INTO group_memberships (group_id, user_id) VALUES ('group-it', 'student-a')").run();
  await db.prepare("INSERT INTO group_memberships (group_id, user_id) VALUES ('group-it', 'student-b')").run();
  await db.prepare("INSERT INTO group_memberships (group_id, user_id) VALUES ('group-culinary', 'student-c')").run();
  await db.prepare("INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, active) VALUES ('assign-a', 'mentor-a', 'student-a', 1)").run();

  await db.prepare("INSERT INTO requirements (id, phase, title) VALUES ('req-proposal', 'proposal', 'Core Proposal')").run();
  await db.prepare("INSERT INTO submissions (id, student_id, requirement_id, status, updated_at) VALUES ('sub-a', 'student-a', 'req-proposal', 'submitted', '2026-05-21T08:00:00.000Z')").run();
  await db.prepare("INSERT INTO submissions (id, student_id, requirement_id, status, updated_at) VALUES ('sub-b', 'student-b', 'req-proposal', 'revision_requested', '2026-05-21T08:05:00.000Z')").run();
  await db.prepare("INSERT INTO submissions (id, student_id, requirement_id, status, updated_at) VALUES ('sub-c', 'student-c', 'req-proposal', 'approved', '2026-05-21T08:10:00.000Z')").run();
  await db.prepare("INSERT INTO evidence_artifacts (id, student_id, submission_id, artifact_type, source_kind, drive_file_id, title) VALUES ('ev-a', 'student-a', 'sub-a', 'reflection', 'google_drive_file', 'drive-secret-a', 'Evidence A')").run();
  await db.prepare("INSERT INTO evidence_artifacts (id, student_id, submission_id, artifact_type, source_kind, drive_file_id, title) VALUES ('ev-b', 'student-b', 'sub-b', 'reflection', 'google_drive_file', 'drive-secret-b', 'Evidence B')").run();
  await db.prepare("INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, status) VALUES ('meet-a', 'mentor-a', 'student-a', 'held')").run();
  await db.prepare("INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, status) VALUES ('meet-b', 'mentor-a', 'student-b', 'missed')").run();
  await db.prepare("INSERT INTO presentation_slots (id, student_user_id, scheduled_for, duration_minutes, location, status, outline_status) VALUES ('slot-a', 'student-a', '2026-05-21T18:00:00.000Z', 15, 'Room 1', 'scheduled', 'pending')").run();
  await db.prepare("INSERT INTO presentation_slots (id, student_user_id, scheduled_for, duration_minutes, location, status, outline_status) VALUES ('slot-b', 'student-b', '2026-05-21T18:30:00.000Z', 15, 'Room 2', 'completed', 'approved')").run();
  await db.prepare("INSERT INTO exports (id, export_type, requested_by, target_user_id, status, created_at) VALUES ('export-a', 'student_archive', 'admin-a', 'student-a', 'failed', '2026-05-21T09:00:00.000Z')").run();
  await db.prepare("INSERT INTO exports (id, export_type, requested_by, target_user_id, status, created_at) VALUES ('export-b', 'student_archive', 'admin-a', 'student-b', 'queued', '2026-05-21T08:30:00.000Z')").run();
  await db.prepare("INSERT INTO exports (id, export_type, requested_by, target_user_id, status, created_at, completed_at) VALUES ('export-c', 'student_archive', 'admin-a', 'student-c', 'complete', '2026-05-21T08:00:00.000Z', '2026-05-21T08:45:00.000Z')").run();
  await db.prepare("INSERT INTO audit_events (id, actor_user_id, action, entity_type) VALUES ('audit-seed', 'admin-a', 'student_dashboard_viewed', 'student_dashboard')").run();

  const tokens = {
    admin: await seedSession(db, env, "admin-a"),
    teacher: await seedSession(db, env, "teacher-it"),
    mentor: await seedSession(db, env, "mentor-a"),
    misc: await seedSession(db, env, "misc-a"),
    studentA: await seedSession(db, env, "student-a"),
  };

  return { env, db, tokens };
}
