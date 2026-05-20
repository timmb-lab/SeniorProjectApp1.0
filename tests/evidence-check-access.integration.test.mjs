import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestGet } from "../functions/api/evidence/[id]/check-access.ts";

test("evidence access check returns 401 and audits when session is missing", async () => {
  const { env, db, evidenceId } = createFixture();

  const request = new Request(`https://example.test/api/evidence/${evidenceId}/check-access`, {
    headers: {
      "cf-connecting-ip": "203.0.113.10",
      "user-agent": "integration-test",
    },
  });

  const response = await onRequestGet({
    request,
    env,
    params: { id: evidenceId },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", canAccess: false });

  const [event] = db.data.auditEvents;
  assert.equal(db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, null);
  assert.equal(event.action, "evidence_access_unauthorized");
  assert.equal(event.entity_type, "evidence_artifact");
  assert.equal(event.entity_id, evidenceId);
  assert.deepEqual(event.metadata, { reason: "missing_session" });
});

test("evidence access check returns 404 and audits when evidence is missing", async () => {
  const { env, db, evidenceId, token } = await createFixtureWithSession({
    userId: "student-a",
    roleId: "student",
  });

  const request = new Request(`https://example.test/api/evidence/${evidenceId}/check-access`, {
    headers: {
      cookie: `sc_session=${token}`,
      "cf-connecting-ip": "203.0.113.11",
      "user-agent": "integration-test",
    },
  });

  const response = await onRequestGet({
    request,
    env,
    params: { id: evidenceId },
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "not_found", canAccess: false });

  const [event] = db.data.auditEvents;
  assert.equal(db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, "student-a");
  assert.equal(event.action, "evidence_access_missing");
  assert.equal(event.entity_type, "evidence_artifact");
  assert.equal(event.entity_id, evidenceId);
  assert.deepEqual(event.metadata, {
    reason: "not_found_or_deleted",
    actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
  });
});

test("evidence access check returns 403 and audits when scope is denied", async () => {
  const fixture = await createFixtureWithSession({
    userId: "misc-admin",
    roleId: "misc_admin",
  });
  fixture.db.data.evidenceArtifacts.push({
    id: fixture.evidenceId,
    student_id: "student-a",
    submission_id: null,
    artifact_type: "reflection",
    source_kind: "external_link",
    external_url: "https://example.com",
    title: "Denied artifact",
    review_status: "pending",
    created_at: new Date("2026-05-20T00:00:00.000Z").toISOString(),
    deleted_at: null,
  });

  const request = new Request(`https://example.test/api/evidence/${fixture.evidenceId}/check-access`, {
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "cf-connecting-ip": "203.0.113.12",
      "user-agent": "integration-test",
    },
  });

  const response = await onRequestGet({
    request,
    env: fixture.env,
    params: { id: fixture.evidenceId },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", canAccess: false });

  const [event] = fixture.db.data.auditEvents;
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, "misc-admin");
  assert.equal(event.action, "evidence_access_denied");
  assert.equal(event.entity_type, "evidence_artifact");
  assert.equal(event.entity_id, fixture.evidenceId);
  assert.deepEqual(event.metadata, {
    studentId: "student-a",
    reason: "student_scope_denied",
    actorRoleScopes: [{ roleId: "misc_admin", scopeType: "global", scopeId: "" }],
  });
});

test("evidence access check returns 200, omits storage ids, and audits when allowed", async () => {
  const fixture = await createFixtureWithSession({
    userId: "student-a",
    roleId: "student",
  });
  fixture.db.data.evidenceArtifacts.push({
    id: fixture.evidenceId,
    student_id: "student-a",
    submission_id: "submission-1",
    artifact_type: "reflection",
    source_kind: "external_link",
    external_url: "https://example.com/portfolio",
    title: "Allowed artifact",
    review_status: "pending",
    created_at: new Date("2026-05-20T00:00:00.000Z").toISOString(),
    deleted_at: null,
  });

  const request = new Request(`https://example.test/api/evidence/${fixture.evidenceId}/check-access`, {
    headers: {
      cookie: `sc_session=${fixture.token}`,
      "cf-connecting-ip": "203.0.113.13",
      "user-agent": "integration-test",
    },
  });

  const response = await onRequestGet({
    request,
    env: fixture.env,
    params: { id: fixture.evidenceId },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.canAccess, true);
  assert.equal(body.artifact.id, fixture.evidenceId);
  assert.equal(body.artifact.studentId, "student-a");
  assert.equal(body.artifact.sourceKind, "external_link");
  assert.equal(body.artifact.externalUrl, "https://example.com/portfolio");
  assert.deepEqual(body.storage, {
    provider: "google_drive",
    fileBytesReady: false,
    signedRetrievalReady: false,
  });
  assert.doesNotMatch(JSON.stringify(body), /drive_file_id|drive_parent_folder_id/);

  const [event] = fixture.db.data.auditEvents;
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(event.actor_user_id, "student-a");
  assert.equal(event.action, "evidence_access_checked");
  assert.equal(event.entity_type, "evidence_artifact");
  assert.equal(event.entity_id, fixture.evidenceId);
  assert.deepEqual(event.metadata, {
    studentId: "student-a",
    sourceKind: "external_link",
    actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
  });
});

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    groupMemberships: [],
    groups: [],
    evidenceArtifacts: [],
    auditEvents: [],
  });

  return {
    evidenceId: "evidence-1",
    env: { DB: db, SESSION_PEPPER: "" },
    db,
  };
}

async function createFixtureWithSession({ userId, roleId }) {
  const base = createFixture();
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push(buildUser(userId));
  base.db.data.sessions.push({
    id: `sess-${userId}`,
    user_id: userId,
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });
  base.db.data.userRoles.push({
    user_id: userId,
    role_id: roleId,
    scope_type: "global",
    scope_id: "",
  });

  return { ...base, token };
}

function buildUser(id) {
  return {
    id,
    email: `${id}@senior-capstone.test`,
    email_norm: `${id}@senior-capstone.test`,
    display_name: id,
    status: "active",
  };
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
    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params;
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
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
      const [studentId, teacherId] = this.params;
      return resolveTeacherScopeRow(this.data, { studentId, teacherId });
    }

    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params;
      const session = this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at);
      return session ?? null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    if (this.sql.startsWith("select id, student_id, submission_id, artifact_type, source_kind, external_url, title, review_status, created_at, deleted_at from evidence_artifacts where id = ?")) {
      const [evidenceId] = this.params;
      return this.data.evidenceArtifacts.find((row) => row.id === evidenceId) ?? null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params;
      const results = this.data.userRoles
        .filter((row) => row.user_id === userId)
        .map((row) => ({
          role_id: row.role_id,
          scope_type: row.scope_type,
          scope_id: row.scope_id,
        }));
      return { results };
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

function resolveTeacherScopeRow(data, { studentId, teacherId }) {
  const teacherAssignments = data.userRoles.filter(
    (row) => row.user_id === teacherId && row.role_id === "program_teacher",
  );
  if (teacherAssignments.length === 0) return null;

  const studentGroups = data.groupMemberships
    .filter((membership) => membership.user_id === studentId)
    .map((membership) => data.groups.find((group) => group.id === membership.group_id))
    .filter(Boolean);

  if (studentGroups.length === 0) {
    return null;
  }

  const studentProgramIds = studentGroups.map((group) => group.program_id ?? "");
  const studentCohortIds = studentGroups.map((group) => group.cohort_id ?? "");

  const allowed = teacherAssignments.some((assignment) => {
    if (assignment.scope_type === "global") return true;
    if (assignment.scope_type === "program") {
      return studentProgramIds.includes(String(assignment.scope_id ?? ""));
    }
    if (assignment.scope_type === "cohort") {
      return studentCohortIds.includes(String(assignment.scope_id ?? ""));
    }
    return false;
  });

  return allowed ? { ok: 1 } : null;
}
