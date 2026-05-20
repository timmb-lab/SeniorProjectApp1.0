import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost as onSubmitSubmission } from "../functions/api/submissions/[id]/submit.ts";
import { onRequestPost as onReviewSubmission } from "../functions/api/reviews/[submissionId]/decision.ts";
import { onRequestGet as onReviewHistory } from "../functions/api/reviews/[submissionId]/history.ts";
import { onRequestGet as onTeacherReviewQueue } from "../functions/api/teacher/review-queue.ts";

test("end-to-end teacher review loop persists history and updates queue", async () => {
  const fixture = await createFixture();

  // student submits draft
  {
    const response = await onSubmitSubmission({
      request: buildAuthedRequest("https://example.test/api/submissions/submission-1/submit", fixture.studentToken, {
        method: "POST",
      }),
      env: fixture.env,
      params: { id: "submission-1" },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.submission, {
      id: "submission-1",
      studentId: "student-a",
      status: "submitted",
      version: 1,
    });
  }

  // teacher sees submission in queue
  {
    const response = await onTeacherReviewQueue({
      request: buildAuthedRequest("https://example.test/api/teacher/review-queue", fixture.teacherToken),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.queue.length, 1);
    assert.equal(body.queue[0].submission_id, "submission-1");
    assert.equal(body.queue[0].status, "submitted");
    assert.equal(body.queue[0].evidence_count, 0);
  }

  // teacher requests revision
  {
    const response = await onReviewSubmission({
      request: buildAuthedJsonRequest(
        "https://example.test/api/reviews/submission-1/decision",
        fixture.teacherToken,
        { decision: "revision_requested", feedback: "Please add more detail." },
      ),
      env: fixture.env,
      params: { submissionId: "submission-1" },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.submission.status, "revision_requested");
  }

  // student resubmits (version bumps)
  {
    const response = await onSubmitSubmission({
      request: buildAuthedRequest("https://example.test/api/submissions/submission-1/submit", fixture.studentToken, {
        method: "POST",
      }),
      env: fixture.env,
      params: { id: "submission-1" },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.submission, {
      id: "submission-1",
      studentId: "student-a",
      status: "submitted",
      version: 2,
    });
  }

  // teacher approves
  {
    const response = await onReviewSubmission({
      request: buildAuthedJsonRequest(
        "https://example.test/api/reviews/submission-1/decision",
        fixture.teacherToken,
        { decision: "approved" },
      ),
      env: fixture.env,
      params: { submissionId: "submission-1" },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.submission.status, "approved");
  }

  // approved submissions drop out of the teacher queue
  {
    const response = await onTeacherReviewQueue({
      request: buildAuthedRequest("https://example.test/api/teacher/review-queue", fixture.teacherToken),
      env: fixture.env,
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.queue.length, 0);
  }

  // history shows both reviews and the status transitions
  {
    const response = await onReviewHistory({
      request: buildAuthedRequest("https://example.test/api/reviews/submission-1/history", fixture.teacherToken),
      env: fixture.env,
      params: { submissionId: "submission-1" },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.submission.status, "approved");

    assert.equal(body.reviews.length, 2);
    assert.deepEqual(
      body.reviews.map((row) => row.decision),
      ["approved", "revision_requested"],
    );

    const toStatuses = body.statusHistory.map((row) => row.to_status);
    assert.equal(toStatuses.includes("submitted"), true);
    assert.equal(toStatuses.includes("revision_requested"), true);
    assert.equal(toStatuses.includes("approved"), true);
  }
});

async function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    groupMemberships: [],
    groups: [],
    requirements: [],
    submissions: [],
    progressRecords: [],
    evidenceArtifacts: [],
    reviews: [],
    statusHistory: [],
    auditEvents: [],
  });

  const env = {
    DB: db,
    SESSION_PEPPER: "",
  };

  db.data.requirements.push({ id: "req-proposal-draft", title: "Proposal draft" });

  db.data.groups.push({ id: "group-a", program_id: "it", cohort_id: "cohort-a" });
  db.data.groupMemberships.push({ user_id: "student-a", group_id: "group-a" });

  db.data.userAccounts.push(buildUser("student-a", "Student A"));
  db.data.userAccounts.push(buildUser("teacher-a", "Teacher A"));

  db.data.userRoles.push({ user_id: "student-a", role_id: "student", scope_type: "global", scope_id: "" });
  db.data.userRoles.push({ user_id: "teacher-a", role_id: "program_teacher", scope_type: "global", scope_id: "" });

  const studentToken = "token-student-a";
  const teacherToken = "token-teacher-a";

  db.data.sessions.push({
    id: "sess-student-a",
    user_id: "student-a",
    token_hash: await sha256Hex(studentToken),
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });
  db.data.sessions.push({
    id: "sess-teacher-a",
    user_id: "teacher-a",
    token_hash: await sha256Hex(teacherToken),
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });

  db.data.submissions.push({
    id: "submission-1",
    student_id: "student-a",
    requirement_id: "req-proposal-draft",
    status: "draft",
    version: 1,
    submitted_at: null,
    updated_at: "2026-05-20T00:00:00.000Z",
  });

  db.data.progressRecords.push({
    student_id: "student-a",
    requirement_id: "req-proposal-draft",
    phase: "proposal",
    status: "in_progress",
    updated_by: null,
    updated_at: "2026-05-20T00:00:00.000Z",
  });

  return { env, db, studentToken, teacherToken };
}

function buildUser(id, displayName) {
  return {
    id,
    email: `${id}@senior-capstone.test`,
    email_norm: `${id}@senior-capstone.test`,
    display_name: displayName,
    status: "active",
  };
}

function buildAuthedRequest(url, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("cf-connecting-ip", "203.0.113.120");
  headers.set("user-agent", "integration-test");
  if (token) {
    headers.set("cookie", `sc_session=${token}`);
  }
  return new Request(url, { ...init, headers });
}

function buildAuthedJsonRequest(url, token, body) {
  return buildAuthedRequest(url, token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

class MockD1Database {
  constructor(data) {
    this.data = data;
    this.clockMs = new Date("2026-05-20T00:00:00.000Z").getTime();
  }

  nowIso() {
    this.clockMs += 1000;
    return new Date(this.clockMs).toISOString();
  }

  prepare(sql) {
    return new MockPreparedStatement(sql, this.data, this);
  }
}

class MockPreparedStatement {
  constructor(sql, data, db) {
    this.sql = normalizeSql(sql);
    this.data = data;
    this.db = db;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params;
      return this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at) ?? null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params;
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id, student_id, requirement_id, status, version from submissions where id = ?")) {
      const [submissionId] = this.params;
      const row = this.data.submissions.find((submission) => submission.id === submissionId);
      if (!row) return null;
      return {
        id: row.id,
        student_id: row.student_id,
        requirement_id: row.requirement_id,
        status: row.status,
        version: row.version,
      };
    }

    if (this.sql.includes("from mentor_assignments")) {
      const [mentorId, studentId] = this.params;
      const exists = this.data.mentorAssignments.some(
        (row) =>
          row.mentor_user_id === mentorId &&
          row.student_user_id === studentId &&
          Number(row.active) === 1,
      );
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.includes("from user_roles teacher_role")) {
      const [studentId, teacherUserId] = this.params;
      return teacherScopeAllows(this.data, { studentId, teacherUserId }) ? { ok: 1 } : null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.includes("from submissions") && this.sql.includes("count(evidence.id) as evidence_count")) {
      const teacherUserId = this.params[0] ? String(this.params[0]) : null;
      const submissions = this.data.submissions.filter((submission) =>
        ["submitted", "revision_requested"].includes(submission.status),
      );

      const results = submissions
        .filter((submission) => {
          if (!teacherUserId) return true;
          return teacherScopeAllows(this.data, { studentId: submission.student_id, teacherUserId });
        })
        .map((submission) => {
          const student = this.data.userAccounts.find((row) => row.id === submission.student_id);
          const requirement = this.data.requirements.find((row) => row.id === submission.requirement_id);
          const evidenceCount = this.data.evidenceArtifacts.filter(
            (artifact) => artifact.submission_id === submission.id && !artifact.deleted_at,
          ).length;

          return {
            submission_id: submission.id,
            student_id: submission.student_id,
            student_name: student?.display_name ?? null,
            requirement_title: requirement?.title ?? null,
            status: submission.status,
            version: submission.version,
            submitted_at: submission.submitted_at ?? null,
            updated_at: submission.updated_at ?? this.db.nowIso(),
            evidence_count: evidenceCount,
          };
        })
        .sort((left, right) => String(right.updated_at).localeCompare(String(left.updated_at)));

      return { results };
    }

    if (this.sql.includes("from reviews")) {
      const [submissionId] = this.params;
      const results = this.data.reviews
        .filter((row) => row.submission_id === submissionId)
        .map((row) => {
          const reviewer = this.data.userAccounts.find((account) => account.id === row.reviewer_user_id);
          return {
            id: row.id,
            decision: row.decision,
            feedback: row.feedback ?? null,
            created_at: row.created_at,
            reviewer_name: reviewer?.display_name ?? null,
          };
        })
        .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)));

      return { results };
    }

    if (this.sql.includes("from status_history")) {
      const [entityId] = this.params;
      const results = this.data.statusHistory
        .filter((row) => row.entity_type === "submission" && row.entity_id === entityId)
        .map((row) => {
          const actor = this.data.userAccounts.find((account) => account.id === row.changed_by);
          return {
            id: row.id,
            from_status: row.from_status ?? null,
            to_status: row.to_status,
            reason: row.reason ?? null,
            created_at: row.created_at,
            changed_by_name: actor?.display_name ?? null,
          };
        })
        .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)));

      return { results };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      return { success: true };
    }

    if (this.sql.startsWith("update submissions set status = 'submitted'")) {
      const [nextVersion, submissionId] = this.params;
      const row = this.data.submissions.find((submission) => submission.id === submissionId);
      if (!row) return { success: false };
      row.status = "submitted";
      row.version = Number(nextVersion);
      row.submitted_at = this.db.nowIso();
      row.updated_at = this.db.nowIso();
      return { success: true };
    }

    if (this.sql.startsWith("update submissions set status = ?")) {
      const [status, submissionId] = this.params;
      const row = this.data.submissions.find((submission) => submission.id === submissionId);
      if (!row) return { success: false };
      row.status = String(status);
      row.updated_at = this.db.nowIso();
      return { success: true };
    }

    if (this.sql.startsWith("update progress_records set status = 'submitted'")) {
      const [updatedBy, studentId, requirementId] = this.params;
      const row = this.data.progressRecords.find(
        (record) => record.student_id === studentId && record.requirement_id === requirementId,
      );
      if (row) {
        row.status = "submitted";
        row.updated_by = updatedBy;
        row.updated_at = this.db.nowIso();
      }
      return { success: true };
    }

    if (this.sql.startsWith("update progress_records set status = ?")) {
      const [status, updatedBy, studentId, requirementId] = this.params;
      const row = this.data.progressRecords.find(
        (record) => record.student_id === studentId && record.requirement_id === requirementId,
      );
      if (row) {
        row.status = String(status);
        row.updated_by = updatedBy;
        row.updated_at = this.db.nowIso();
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into status_history")) {
      const [
        id,
        studentId,
        entityType,
        entityId,
        fromStatus,
        toStatus,
        changedBy,
        reason,
      ] = this.params;
      this.data.statusHistory.push({
        id,
        student_id: studentId,
        entity_type: entityType,
        entity_id: entityId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: changedBy,
        reason,
        created_at: this.db.nowIso(),
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into reviews")) {
      const [id, submissionId, reviewerUserId, decision, feedback] = this.params;
      this.data.reviews.push({
        id,
        submission_id: submissionId,
        reviewer_user_id: reviewerUserId,
        decision,
        feedback,
        created_at: this.db.nowIso(),
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into audit_events")) {
      const [
        _id,
        actorUserId,
        action,
        entityType,
        entityId,
        _ipHash,
        _userAgentHash,
        metadataJson,
      ] = this.params;
      this.data.auditEvents.push({
        actor_user_id: actorUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadataJson ? JSON.parse(metadataJson) : null,
      });
      return { success: true };
    }

    throw new Error(`Unmocked D1 run() query: ${this.sql}`);
  }
}

function teacherScopeAllows(data, { studentId, teacherUserId }) {
  const teacherAssignments = data.userRoles.filter(
    (row) => row.user_id === teacherUserId && row.role_id === "program_teacher",
  );
  if (teacherAssignments.length === 0) return false;

  const studentGroups = data.groupMemberships
    .filter((membership) => membership.user_id === studentId)
    .map((membership) => data.groups.find((group) => group.id === membership.group_id))
    .filter(Boolean);
  if (studentGroups.length === 0) return false;

  for (const assignment of teacherAssignments) {
    if (assignment.scope_type === "global") return true;
    if (assignment.scope_type === "program") {
      if (studentGroups.some((group) => String(group.program_id ?? "") === String(assignment.scope_id ?? ""))) {
        return true;
      }
      continue;
    }
    if (assignment.scope_type === "cohort") {
      if (studentGroups.some((group) => String(group.cohort_id ?? "") === String(assignment.scope_id ?? ""))) {
        return true;
      }
      continue;
    }
  }
  return false;
}

