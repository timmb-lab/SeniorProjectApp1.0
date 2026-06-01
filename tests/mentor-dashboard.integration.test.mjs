import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet } from "../functions/api/mentor/dashboard.ts";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("mentor dashboard returns active assignments only and supports admin inspection", async () => {
  const { env, db, tokens } = await createFixture();

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/mentor/dashboard"),
      env,
    });
    assert.equal(response.status, 401);
  }

  for (const [label, token] of [
    ["student", tokens.studentA],
    ["misc admin", tokens.misc],
  ]) {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/mentor/dashboard", token),
      env,
    });
    assert.equal(response.status, 403, `${label} should be denied`);
  }

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/mentor/dashboard", tokens.mentorA),
      env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.scope, "mentor_assigned");
    assert.equal(body.summary.assignedCount, 1);
    assert.equal(body.assignedStudents.length, 1);
    assert.equal(body.assignedStudents[0].studentId, "student-a");
    assert.equal(body.assignedStudents[0].studentName, "Student A");
    assert.equal(body.assignedStudents[0].submissionStatus, "revision_requested");
    assert.equal(body.assignedStudents[0].latestSubmissionUpdatedAt, "2026-05-21T08:00:00.000Z");
    assert.equal(body.assignedStudents[0].mentorMeetingStatus, "makeup_required");
    assert.equal(body.assignedStudents[0].latestMentorMeetingAt, "2026-05-21T09:15:00.000Z");
    assert.equal(body.assignedStudents[0].latestPresentationScheduledFor, "2026-05-21T18:00:00.000Z");
    assert.equal(body.assignedStudents[0].needsAttention.includes("mentor_meeting"), true);
    assert.equal(JSON.stringify(body).includes("Student B"), false);
    assert.equal(JSON.stringify(body).includes("Student C"), false);
    assert.doesNotMatch(JSON.stringify(body), /drive_file_id|drive_parent_folder_id|storage_key|password|token|secret/i);
  }

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/mentor/dashboard?mentorUserId=mentor-b", tokens.admin),
      env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.scope, "admin_selected_mentor");
    assert.equal(body.summary.assignedCount, 1);
    assert.equal(body.assignedStudents[0].studentId, "student-c");
    assert.equal(body.assignedStudents[0].mentorId, "mentor-b");
  }

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/mentor/dashboard", tokens.admin),
      env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.scope, "admin_mentor_coverage");
    assert.deepEqual(body.assignedStudents.map((row) => row.studentId).sort(), ["student-a", "student-c"]);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "mentor_dashboard_viewed"), true);
  assert.equal(audits.some((event) => event.action === "mentor_dashboard_denied"), true);
});

async function createFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
    EVIDENCE_STORAGE_PROVIDER: "google_drive",
  };

  await seedUser(db, { id: "admin-a", displayName: "Admin A", roleId: "admin" });
  await seedUser(db, { id: "misc-a", displayName: "Misc A", roleId: "misc_admin", scopeType: "reporting", scopeId: "readiness" });
  await seedUser(db, { id: "mentor-a", displayName: "Mentor A", roleId: "mentor" });
  await seedUser(db, { id: "mentor-b", displayName: "Mentor B", roleId: "mentor" });
  await seedUser(db, { id: "student-a", displayName: "Student A", roleId: "student" });
  await seedUser(db, { id: "student-b", displayName: "Student B", roleId: "student" });
  await seedUser(db, { id: "student-c", displayName: "Student C", roleId: "student" });

  await db.prepare("INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, active) VALUES ('assign-a', 'mentor-a', 'student-a', 1)").run();
  await db.prepare("INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, active) VALUES ('assign-inactive', 'mentor-a', 'student-b', 0)").run();
  await db.prepare("INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, active) VALUES ('assign-c', 'mentor-b', 'student-c', 1)").run();
  await db.prepare("INSERT INTO requirements (id, phase, title) VALUES ('req-proposal', 'proposal', 'Core Proposal')").run();
  await db.prepare("INSERT INTO submissions (id, student_id, requirement_id, status, updated_at) VALUES ('sub-a', 'student-a', 'req-proposal', 'revision_requested', '2026-05-21T08:00:00.000Z')").run();
  await db.prepare("INSERT INTO submissions (id, student_id, requirement_id, status, updated_at) VALUES ('sub-b', 'student-b', 'req-proposal', 'submitted', '2026-05-21T08:05:00.000Z')").run();
  await db.prepare("INSERT INTO submissions (id, student_id, requirement_id, status, updated_at) VALUES ('sub-c', 'student-c', 'req-proposal', 'approved', '2026-05-21T08:10:00.000Z')").run();
  await db.prepare("INSERT INTO evidence_artifacts (id, student_id, submission_id, artifact_type, source_kind, drive_file_id, title) VALUES ('ev-a', 'student-a', 'sub-a', 'reflection', 'google_drive_file', 'drive-secret-a', 'Evidence A')").run();
  await db.prepare("INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, status, scheduled_for, held_at, created_at) VALUES ('meet-a', 'mentor-a', 'student-a', 'makeup_required', '2026-05-21T09:00:00.000Z', '2026-05-21T09:15:00.000Z', '2026-05-21T08:30:00.000Z')").run();
  await db.prepare("INSERT INTO presentation_slots (id, student_user_id, scheduled_for, duration_minutes, location, status, outline_status) VALUES ('slot-a', 'student-a', '2026-05-21T18:00:00.000Z', 15, 'Room 1', 'scheduled', 'pending')").run();
  await db.prepare("INSERT INTO presentation_slots (id, student_user_id, scheduled_for, duration_minutes, location, status, outline_status) VALUES ('slot-c', 'student-c', '2026-05-21T18:30:00.000Z', 15, 'Room 2', 'completed', 'approved')").run();

  const tokens = {
    admin: await seedSession(db, env, "admin-a"),
    mentorA: await seedSession(db, env, "mentor-a"),
    misc: await seedSession(db, env, "misc-a"),
    studentA: await seedSession(db, env, "student-a"),
  };

  return { env, db, tokens };
}
