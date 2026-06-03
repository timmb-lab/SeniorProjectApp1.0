import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet } from "../functions/api/program-teacher/dashboard.ts";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("program teacher dashboard scopes records by valid program/cohort role", async () => {
  const { env, db, tokens } = await createFixture();

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/program-teacher/dashboard"),
      env,
    });
    assert.equal(response.status, 401);
  }

  for (const [label, token] of [
    ["student", tokens.studentA],
    ["misc admin", tokens.misc],
  ]) {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/program-teacher/dashboard", token),
      env,
    });
    assert.equal(response.status, 403, `${label} should be denied`);
  }

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/program-teacher/dashboard", tokens.teacherEmpty),
      env,
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "forbidden" });
  }

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/program-teacher/dashboard", tokens.teacherIt),
      env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.scope.role, "program_teacher");
    assert.equal(body.scope.scopeType, "program");
    assert.equal(body.scope.scopeId, "it");
    assert.equal(body.summary.scopedStudents, 2);
    assert.equal(body.summary.submitted, 1);
    assert.equal(body.summary.revisionRequested, 1);
    assert.equal(body.summary.approved, 0);
    assert.equal(body.summary.evidenceArtifacts, 2);
    assert.equal(body.summary.noMentor, 1);
    assert.deepEqual(body.students.map((row) => row.studentId).sort(), ["student-a", "student-b"]);
    assert.equal(JSON.stringify(body).includes("Student C"), false);
    assert.equal(body.needsReview.length, 2);
    assert.ok(body.programBreakdown.every((row) => row.programId === "it"));
    assert.deepEqual(
      body.needsAttention.map((row) => ({
        type: row.type,
        actionSection: row.actionSection || "",
        actionPreset: row.actionPreset || "",
      })),
      [
        { type: "mentor_coverage", actionSection: "students", actionPreset: "missing-mentors" },
        { type: "teacher_review", actionSection: "teacher", actionPreset: "submitted" },
        { type: "behind_support", actionSection: "students", actionPreset: "behind-students" },
        { type: "revision_loop", actionSection: "teacher", actionPreset: "revision-requested" },
        { type: "mentor_meeting", actionSection: "students", actionPreset: "mentor-meeting-follow-up-students" },
        { type: "presentation", actionSection: "operations", actionPreset: "presentation-pending" },
      ],
    );
    assert.doesNotMatch(JSON.stringify(body), /drive_file_id|drive_parent_folder_id|storage_key|password|token|secret/i);
  }

  {
    const response = await onRequestGet({
      request: buildRequest("https://example.test/api/program-teacher/dashboard", tokens.admin),
      env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.scope.role, "admin");
    assert.equal(body.summary.scopedStudents, 3);
    assert.equal(body.summary.approved, 1);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "program_teacher_dashboard_viewed"), true);
  assert.equal(audits.some((event) => event.action === "program_teacher_dashboard_denied"), true);
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
  await seedUser(db, { id: "teacher-empty", displayName: "Teacher Empty", roleId: "program_teacher", scopeType: "program", scopeId: "" });
  await seedUser(db, { id: "misc-a", displayName: "Misc A", roleId: "misc_admin", scopeType: "reporting", scopeId: "readiness" });
  await seedUser(db, { id: "mentor-a", displayName: "Mentor A", roleId: "mentor" });
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
  await db.prepare("INSERT INTO evidence_artifacts (id, student_id, submission_id, artifact_type, source_kind, drive_file_id, title) VALUES ('ev-c', 'student-c', 'sub-c', 'reflection', 'google_drive_file', 'drive-secret-c', 'Evidence C')").run();
  await db.prepare("INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, status) VALUES ('meet-b', 'mentor-a', 'student-b', 'makeup_required')").run();
  await db.prepare("INSERT INTO presentation_slots (id, student_user_id, scheduled_for, duration_minutes, location, status, outline_status) VALUES ('slot-b', 'student-b', '2026-05-21T18:30:00.000Z', 15, 'Room 2', 'scheduled', 'pending')").run();

  const tokens = {
    admin: await seedSession(db, env, "admin-a"),
    teacherIt: await seedSession(db, env, "teacher-it"),
    teacherEmpty: await seedSession(db, env, "teacher-empty"),
    misc: await seedSession(db, env, "misc-a"),
    studentA: await seedSession(db, env, "student-a"),
  };

  return { env, db, tokens };
}
