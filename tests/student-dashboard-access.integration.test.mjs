import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestGet } from "../functions/api/student/dashboard.ts";

test("student dashboard returns 401 and audits when session is missing", async () => {
  const { env, db } = createFixture();

  const response = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a"),
    env,
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
  assert.equal(db.data.auditEvents.length, 1);
  assert.equal(db.data.auditEvents[0].actor_user_id, null);
  assert.equal(db.data.auditEvents[0].action, "student_dashboard_unauthorized");
  assert.equal(db.data.auditEvents[0].entity_type, "student_dashboard");
  assert.equal(db.data.auditEvents[0].entity_id, "student-a");
  assert.deepEqual(db.data.auditEvents[0].metadata, { reason: "missing_session" });
});

test("student dashboard returns own rows without storage ids and audits the view", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  seedStudentRecord(fixture.db, "student-a");
  fixture.db.data.userAccounts.push(buildUser("mentor-a", "Mentor A"));
  fixture.db.data.userRoles.push({
    user_id: "mentor-a",
    role_id: "mentor",
    scope_type: "global",
    scope_id: "",
  });
  fixture.db.data.mentorAssignments.push({
    id: "mentor-assignment-a",
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    active: 1,
    created_at: "2026-05-20T08:20:00.000Z",
  });

  const response = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.studentId, "student-a");
  assert.equal(body.viewer.self, true);
  assert.equal(body.nextAction, "Start or finish Core Concept Proposal.");
  assert.deepEqual(body.summary, {
    requirementsTotal: 1,
    requirementsComplete: 0,
    completionPercent: 0,
    phasesTotal: 1,
    phasesComplete: 0,
    submittedRequiredCount: 0,
    missingRequiredCount: 1,
    waitingForReviewCount: 0,
    revisionRequestedCount: 0,
    currentPhase: "proposal",
    currentPhaseLabel: "Proposal",
    currentStatus: "Getting Started",
    lastUpdatedAt: "2026-05-20T08:20:00.000Z",
    mentor: {
      assigned: true,
      name: "Mentor A",
      message: "Mentor A can help with project questions.",
    },
    dueDatesAvailable: true,
  });
  assert.deepEqual(body.nextSteps, [
    {
      title: "Core Concept Proposal",
      status: "Missing",
      detail: "Start or finish Core Concept Proposal.",
      dueDate: "2025-10-09T00:00:00Z",
      dueLabel: "October 9 and 10",
      requirementId: "req-proposal-draft",
      submissionId: "submission-student-a",
      submissionStatus: "draft",
      evidenceCount: 1,
    },
  ]);
  assert.deepEqual(body.requirements, [
      {
        requirementId: "req-proposal-draft",
        submissionId: "submission-student-a",
        title: "Core Concept Proposal",
        description: "Draft the proposal with a clear problem, solution, audience, and proof of work.",
        phase: "proposal",
        phaseLabel: "Proposal",
        status: "draft",
        progressStatus: "draft",
        submissionStatus: "draft",
        submissionVersion: 1,
        evidenceCount: 1,
        dueDate: "2025-10-09T00:00:00Z",
        dueLabel: "October 9 and 10",
        qualityPrompt: "Name the problem, who benefits, and the evidence that proves your work.",
        lastUpdatedAt: "2026-05-20T08:10:00.000Z",
        nextAction: "Send Core Concept Proposal for teacher review.",
      },
  ]);
  assert.equal(body.progress.length, 1);
  assert.equal(body.submissions.length, 1);
  assert.equal(body.evidence.length, 1);
  assert.equal(body.evidence[0].fileBytesReady, true);
  assert.equal(body.evidence[0].downloadUrl, "/api/evidence/evidence-student-a/download");
  assert.equal(body.evidence[0].externalUrl, null);
  assert.equal(body.evidence[0].storageIdentifiersRedacted, true);
  assert.doesNotMatch(JSON.stringify(body), /drive_file_id|driveFileId|drive-secret/i);

  const [event] = fixture.db.data.auditEvents;
  assert.equal(event.actor_user_id, "student-a");
  assert.equal(event.action, "student_dashboard_viewed");
  assert.equal(event.entity_id, "student-a");
  assert.deepEqual(event.metadata, {
    self: true,
    progressCount: 1,
    submissionCount: 1,
    evidenceCount: 1,
    actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
  });
});

test("student dashboard returns latest review feedback scoped to the viewed student", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  seedStudentRecord(fixture.db, "student-a");
  seedStudentRecord(fixture.db, "student-b");
  fixture.db.data.userAccounts.push(buildUser("teacher-a", "Teacher A"));
  const ownSubmission = fixture.db.data.submissions.find((row) => row.id === "submission-student-a");
  ownSubmission.status = "revision_requested";
  ownSubmission.updated_at = "2026-05-24T18:30:00.000Z";
  fixture.db.data.reviews.push(
    {
      id: "review-student-a-old",
      submission_id: "submission-student-a",
      reviewer_user_id: "teacher-a",
      decision: "comment_only",
      feedback: "Earlier note for the same submission.",
      created_at: "2026-05-24T17:30:00.000Z",
    },
    {
      id: "review-student-a-latest",
      submission_id: "submission-student-a",
      reviewer_user_id: "teacher-a",
      decision: "revision_requested",
      feedback: "Add one measurable success target before resubmitting.",
      created_at: "2026-05-24T18:40:00.000Z",
    },
    {
      id: "review-student-b",
      submission_id: "submission-student-b",
      reviewer_user_id: "teacher-a",
      decision: "revision_requested",
      feedback: "This belongs to another student.",
      created_at: "2026-05-24T19:00:00.000Z",
    },
  );

  const response = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.feedback.length, 2);
  assert.deepEqual(body.feedback[0], {
    id: "review-student-a-latest",
    kind: "review",
    submissionId: "submission-student-a",
    requirementTitle: "Core Concept Proposal",
    submissionStatus: "revision_requested",
    submissionVersion: 1,
    status: "revision_requested",
    message: "Add one measurable success target before resubmitting.",
    authorName: "Teacher A",
    createdAt: "2026-05-24T18:40:00.000Z",
  });
  assert.doesNotMatch(JSON.stringify(body.feedback), /another student|drive-secret|staff_only/i);
});

test("student dashboard denies another student's record and audits role scope", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-b", roleId: "student" });
  seedStudentRecord(fixture.db, "student-a");

  const response = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden" });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "student_dashboard_denied");
  assert.equal(fixture.db.data.auditEvents[0].entity_id, "student-a");
  assert.deepEqual(fixture.db.data.auditEvents[0].metadata, {
    reason: "student_scope_denied",
    actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
  });
});

test("student dashboard allows active assigned mentors and denies inactive assignments", async () => {
  const allowed = await createFixtureWithSession({ userId: "mentor-a", roleId: "mentor" });
  seedStudentRecord(allowed.db, "student-a");
  allowed.db.data.mentorAssignments.push({
    mentor_user_id: "mentor-a",
    student_user_id: "student-a",
    active: 1,
  });

  const allowedResponse = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", allowed.token),
    env: allowed.env,
  });

  assert.equal(allowedResponse.status, 200);
  const allowedBody = await allowedResponse.json();
  assert.equal(allowedBody.viewer.self, false);
  assert.equal(allowed.db.data.auditEvents[0].action, "student_dashboard_viewed");
  assert.deepEqual(allowed.db.data.auditEvents[0].metadata.actorRoleScopes, [
    { roleId: "mentor", scopeType: "global", scopeId: "" },
  ]);

  const denied = await createFixtureWithSession({ userId: "mentor-b", roleId: "mentor" });
  seedStudentRecord(denied.db, "student-a");
  denied.db.data.mentorAssignments.push({
    mentor_user_id: "mentor-b",
    student_user_id: "student-a",
    active: 0,
  });

  const deniedResponse = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", denied.token),
    env: denied.env,
  });

  assert.equal(deniedResponse.status, 403);
  assert.equal(denied.db.data.auditEvents[0].action, "student_dashboard_denied");
});

test("student dashboard allows matching program teachers and denies empty scopes", async () => {
  const allowed = await createFixtureWithSession({
    userId: "teacher-it",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
  });
  seedStudentRecord(allowed.db, "student-a", { programId: "it", cohortId: "cohort-a" });

  const allowedResponse = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", allowed.token),
    env: allowed.env,
  });

  assert.equal(allowedResponse.status, 200);
  assert.equal(allowed.db.data.auditEvents[0].action, "student_dashboard_viewed");
  assert.deepEqual(allowed.db.data.auditEvents[0].metadata.actorRoleScopes, [
    { roleId: "program_teacher", scopeType: "program", scopeId: "it" },
  ]);

  const denied = await createFixtureWithSession({
    userId: "teacher-empty",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "",
  });
  seedStudentRecord(denied.db, "student-a", { programId: null, cohortId: "cohort-a" });

  const deniedResponse = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", denied.token),
    env: denied.env,
  });

  assert.equal(deniedResponse.status, 403);
  assert.deepEqual(denied.db.data.auditEvents[0].metadata, {
    reason: "student_scope_denied",
    actorRoleScopes: [{ roleId: "program_teacher", scopeType: "program", scopeId: "" }],
  });
});

test("student dashboard allows admin inspection and denies misc admin broad access", async () => {
  const admin = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  seedStudentRecord(admin.db, "student-a");

  const adminResponse = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", admin.token),
    env: admin.env,
  });

  assert.equal(adminResponse.status, 200);
  assert.equal(admin.db.data.auditEvents[0].action, "student_dashboard_viewed");
  assert.deepEqual(admin.db.data.auditEvents[0].metadata.actorRoleScopes, [
    { roleId: "admin", scopeType: "global", scopeId: "" },
  ]);

  const misc = await createFixtureWithSession({
    userId: "misc-a",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "alpha-readiness",
  });
  seedStudentRecord(misc.db, "student-a");

  const miscResponse = await onRequestGet({
    request: buildRequest("https://example.test/api/student/dashboard?studentId=student-a", misc.token),
    env: misc.env,
  });

  assert.equal(miscResponse.status, 403);
  assert.equal(misc.db.data.auditEvents[0].action, "student_dashboard_denied");
  assert.deepEqual(misc.db.data.auditEvents[0].metadata.actorRoleScopes, [
    { roleId: "misc_admin", scopeType: "reporting", scopeId: "alpha-readiness" },
  ]);
});

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    groupMemberships: [],
    groups: [],
    requirements: [
      { id: "req-proposal-draft", program_id: null, phase: "proposal", title: "Core Concept Proposal", required: 1, sort_order: 1 },
    ],
    qualityChecks: [
      {
        id: "qc-proposal-draft-1",
        requirement_id: "req-proposal-draft",
        prompt: "Name the problem, who benefits, and the evidence that proves your work.",
        sort_order: 1,
        active: 1,
      },
    ],
    deadlines: [
      {
        id: "deadline-proposal-draft-1",
        requirement_id: "req-proposal-draft",
        program_id: null,
        cohort_id: null,
        title: "October 9 and 10",
        due_at: "2025-10-09T00:00:00Z",
        active: 1,
      },
    ],
    progressRecords: [],
    submissions: [],
    evidenceArtifacts: [],
    reviews: [],
    auditEvents: [],
  });

  return {
    env: { DB: db, SESSION_PEPPER: "" },
    db,
  };
}

async function createFixtureWithSession({ userId, roleId, scopeType = "global", scopeId = "" }) {
  const base = createFixture();
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push(buildUser(userId));
  base.db.data.sessions.push({
    id: `sess-${userId}`,
    user_id: userId,
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: "2099-01-01T00:00:00.000Z",
  });
  if (roleId) {
    base.db.data.userRoles.push({
      user_id: userId,
      role_id: roleId,
      scope_type: scopeType,
      scope_id: scopeId,
    });
  }

  return { ...base, token };
}

function seedStudentRecord(db, studentId, { programId = "it", cohortId = "cohort-a" } = {}) {
  db.data.userAccounts.push(buildUser(studentId));
  if (!db.data.userRoles.some((row) => row.user_id === studentId && row.role_id === "student")) {
    db.data.userRoles.push({
      user_id: studentId,
      role_id: "student",
      scope_type: "global",
      scope_id: "",
    });
  }
  db.data.groups.push({
    id: `group-${studentId}`,
    program_id: programId,
    cohort_id: cohortId,
  });
  db.data.groupMemberships.push({
    user_id: studentId,
    group_id: `group-${studentId}`,
  });
  db.data.progressRecords.push({
    id: `progress-${studentId}`,
    student_id: studentId,
    requirement_id: "req-proposal-draft",
    phase: "proposal",
    status: "draft",
    updated_at: "2026-05-20T08:00:00.000Z",
  });
  db.data.submissions.push({
    id: `submission-${studentId}`,
    student_id: studentId,
    requirement_id: "req-proposal-draft",
    status: "draft",
    version: 1,
    submitted_at: null,
    updated_at: "2026-05-20T08:10:00.000Z",
  });
  db.data.evidenceArtifacts.push({
    id: `evidence-${studentId}`,
    student_id: studentId,
    submission_id: `submission-${studentId}`,
    title: "Protected build log",
    artifact_type: "reflection",
    source_kind: "google_drive_file",
    external_url: null,
    mime_type: "text/plain",
    size_bytes: 4096,
    drive_file_id: "drive-secret",
    review_status: "pending",
    created_at: "2026-05-20T08:15:00.000Z",
    deleted_at: null,
  });
}

function buildUser(id, displayName = id) {
  return {
    id,
    email: `${id}@senior-capstone.test`,
    email_norm: `${id}@senior-capstone.test`,
    display_name: displayName,
    status: "active",
  };
}

function buildRequest(url, token = null) {
  const headers = new Headers({
    "cf-connecting-ip": "203.0.113.20",
    "user-agent": "student-dashboard-test",
  });
  if (token) headers.set("cookie", `sc_session=${token}`);
  return new Request(url, { headers });
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

class MockD1Database {
  constructor(data) {
    this.data = data;
  }

  prepare(sql) {
    return new MockPreparedStatement(sql, this.data);
  }
}

class MockPreparedStatement {
  constructor(sql, data) {
    this.sql = normalizeSql(sql);
    this.data = data;
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

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ?")) {
      const [userId, roleId] = this.params;
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.includes("from mentor_assignments ma")) {
      const [mentorId, studentId] = this.params;
      const hasMentorRole = this.data.userRoles.some(
        (row) => row.user_id === mentorId && row.role_id === "mentor",
      );
      const exists = this.data.mentorAssignments.some(
        (row) =>
          row.mentor_user_id === mentorId &&
          row.student_user_id === studentId &&
          Number(row.active) === 1,
      );
      return hasMentorRole && exists ? { ok: 1 } : null;
    }

    if (this.sql.includes("from mentor_assignments") && this.sql.includes("mentor.display_name as mentor_name")) {
      const [studentId] = this.params;
      const assignment = this.data.mentorAssignments
        .filter((row) => row.student_user_id === studentId && Number(row.active) === 1)
        .find((row) => {
          const mentor = this.data.userAccounts.find((user) => user.id === row.mentor_user_id && user.status === "active");
          const hasMentorRole = this.data.userRoles.some(
            (role) => role.user_id === row.mentor_user_id && role.role_id === "mentor",
          );
          return mentor && hasMentorRole;
        });
      if (!assignment) return null;
      const mentor = this.data.userAccounts.find((row) => row.id === assignment.mentor_user_id);
      return {
        mentor_name: mentor?.display_name || null,
        created_at: assignment.created_at || null,
      };
    }

    if (this.sql.includes("from user_roles teacher_role")) {
      const [studentId, teacherId] = this.params;
      return resolveTeacherScopeRow(this.data, { studentId, teacherId });
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params;
      return {
        results: this.data.userRoles
          .filter((row) => row.user_id === userId)
          .map((row) => ({
            role_id: row.role_id,
            scope_type: row.scope_type,
            scope_id: row.scope_id,
          })),
      };
    }

    if (this.sql.includes("from progress_records progress")) {
      const [studentId] = this.params;
      return {
        results: this.data.progressRecords
          .filter((row) => row.student_id === studentId)
          .map((row) => ({
            id: row.id,
            requirement_id: row.requirement_id,
            phase: row.phase,
            status: row.status,
            updated_at: row.updated_at,
            requirement_title: requirementTitle(this.data, row.requirement_id),
          })),
      };
    }

    if (this.sql.includes("from requirements") && this.sql.includes("requirements.required = 1")) {
      const [studentId] = this.params;
      const studentProgramIds = new Set(
        this.data.groupMemberships
          .filter((membership) => membership.user_id === studentId)
          .map((membership) => this.data.groups.find((group) => group.id === membership.group_id)?.program_id)
          .filter(Boolean),
      );
      const studentCohortIds = new Set(
        this.data.groupMemberships
          .filter((membership) => membership.user_id === studentId)
          .map((membership) => this.data.groups.find((group) => group.id === membership.group_id)?.cohort_id)
          .filter(Boolean),
      );
      return {
        results: this.data.requirements
          .filter((row) => Number(row.required ?? 1) === 1)
          .filter((row) => !row.program_id || studentProgramIds.has(row.program_id))
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((row) => {
            const deadline = (this.data.deadlines || [])
              .filter((deadlineRow) => deadlineRow.requirement_id === row.id && Number(deadlineRow.active ?? 1) === 1)
              .filter((deadlineRow) => !deadlineRow.program_id || studentProgramIds.has(deadlineRow.program_id))
              .filter((deadlineRow) => !deadlineRow.cohort_id || studentCohortIds.has(deadlineRow.cohort_id))
              .sort((a, b) => String(a.due_at || "").localeCompare(String(b.due_at || "")) || String(a.title || "").localeCompare(String(b.title || "")))[0] || null;
            return {
              id: row.id,
              program_id: row.program_id ?? null,
              phase: row.phase || "proposal",
              title: row.title,
              description: row.description || "Draft the proposal with a clear problem, solution, audience, and proof of work.",
              required: row.required ?? 1,
              sort_order: row.sort_order ?? 0,
              due_at: deadline?.due_at || null,
              due_label: deadline?.title || null,
              quality_prompt: (this.data.qualityChecks || [])
                .filter((qualityRow) => qualityRow.requirement_id === row.id && Number(qualityRow.active ?? 1) === 1)
                .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.id || "").localeCompare(String(b.id || "")))[0]?.prompt || null,
            };
          }),
      };
    }

    if (this.sql.includes("from submissions")) {
      const [studentId] = this.params;
      return {
        results: this.data.submissions
          .filter((row) => row.student_id === studentId)
          .map((row) => ({
            id: row.id,
            requirement_id: row.requirement_id,
            status: row.status,
            version: row.version,
            submitted_at: row.submitted_at,
            updated_at: row.updated_at,
            requirement_title: requirementTitle(this.data, row.requirement_id),
            evidence_count: this.data.evidenceArtifacts.filter((artifact) =>
              artifact.submission_id === row.id &&
              !artifact.deleted_at &&
              artifact.review_status !== "archived"
            ).length,
          })),
      };
    }

    if (this.sql.startsWith("select id, title, artifact_type, source_kind, external_url, mime_type, size_bytes, review_status, created_at from evidence_artifacts")) {
      const [studentId] = this.params;
      return {
        results: this.data.evidenceArtifacts
          .filter((row) => row.student_id === studentId && !row.deleted_at)
          .map((row) => ({
            id: row.id,
            title: row.title,
            artifact_type: row.artifact_type,
            source_kind: row.source_kind,
            external_url: row.external_url,
            mime_type: row.mime_type,
            size_bytes: row.size_bytes,
            review_status: row.review_status,
            created_at: row.created_at,
          })),
      };
    }

    if (this.sql.includes("from reviews") && this.sql.includes("join submissions on submissions.id = reviews.submission_id")) {
      const [studentId] = this.params;
      return {
        results: this.data.reviews
          .filter((row) => {
            const submission = this.data.submissions.find((submissionRow) => submissionRow.id === row.submission_id);
            return submission?.student_id === studentId;
          })
          .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
          .slice(0, 5)
          .map((row) => {
            const submission = this.data.submissions.find((submissionRow) => submissionRow.id === row.submission_id);
            const reviewer = this.data.userAccounts.find((user) => user.id === row.reviewer_user_id);
            return {
              id: row.id,
              submission_id: row.submission_id,
              requirement_title: requirementTitle(this.data, submission?.requirement_id),
              submission_status: submission?.status || "draft",
              submission_version: submission?.version || 1,
              decision: row.decision,
              feedback: row.feedback,
              created_at: row.created_at,
              reviewer_name: reviewer?.display_name || null,
            };
          }),
      };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
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

function requirementTitle(data, requirementId) {
  return data.requirements.find((row) => row.id === requirementId)?.title ?? null;
}

function resolveTeacherScopeRow(data, { studentId, teacherId }) {
  const teacherAssignments = data.userRoles.filter(
    (row) => row.user_id === teacherId && row.role_id === "program_teacher",
  );
  if (teacherAssignments.length === 0) return null;

  const studentGroups = data.groupMemberships
    .filter((membership) => membership.user_id === studentId)
    .map((membership) => data.groups.find((group) => group.id === membership.group_id))
    .filter(Boolean);

  if (studentGroups.length === 0) return null;

  const studentProgramIds = studentGroups
    .map((group) => group.program_id)
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map(String);

  const studentCohortIds = studentGroups
    .map((group) => group.cohort_id)
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map(String);

  const allowed = teacherAssignments.some((assignment) => {
    if (assignment.scope_type === "global") return true;
    const scopeId = String(assignment.scope_id ?? "").trim();
    if (!scopeId) return false;
    if (assignment.scope_type === "program") return studentProgramIds.includes(scopeId);
    if (assignment.scope_type === "cohort") return studentCohortIds.includes(scopeId);
    return false;
  });

  return allowed ? { ok: 1 } : null;
}
