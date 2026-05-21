import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost as onAttachEvidenceLink } from "../functions/api/submissions/[id]/evidence.ts";

test("evidence link attach audits missing-session access", async () => {
  const fixture = createFixture();
  fixture.db.data.submissions.push(buildSubmission("submission-1", "student-a"));

  const response = await onAttachEvidenceLink({
    request: buildJsonRequest({
      url: "https://example.test/api/submissions/submission-1/evidence",
      token: null,
      body: { title: "Proposal notes", url: "https://example.test/evidence" },
    }),
    env: fixture.env,
    params: { id: "submission-1" },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
  assert.equal(fixture.db.data.evidenceArtifacts.length, 0);
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.deepEqual(fixture.db.data.auditEvents[0], {
    actor_user_id: null,
    action: "evidence_attach_unauthorized",
    entity_type: "submission",
    entity_id: "submission-1",
    metadata: { reason: "missing_session" },
  });
});

test("evidence link attach denies cross-student and staff attempts with role scopes", async () => {
  {
    const fixture = await createFixtureWithSession({ userId: "student-b", roleId: "student" });
    fixture.db.data.submissions.push(buildSubmission("submission-1", "student-a"));

    const response = await onAttachEvidenceLink({
      request: buildJsonRequest({
        url: "https://example.test/api/submissions/submission-1/evidence",
        token: fixture.token,
        body: { title: "Other student evidence", url: "https://example.test/other" },
      }),
      env: fixture.env,
      params: { id: "submission-1" },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
    assert.equal(fixture.db.data.evidenceArtifacts.length, 0);
    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "evidence_attach_denied");
    assert.deepEqual(fixture.db.data.auditEvents[0].metadata, {
      reason: "student_scope_denied",
      studentId: "student-a",
      actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
    });
  }

  for (const roleId of ["mentor", "program_teacher", "admin", "misc_admin"]) {
    const fixture = await createFixtureWithSession({ userId: `${roleId}-a`, roleId });
    fixture.db.data.submissions.push(buildSubmission("submission-1", "student-a"));

    const response = await onAttachEvidenceLink({
      request: buildJsonRequest({
        url: "https://example.test/api/submissions/submission-1/evidence",
        token: fixture.token,
        body: { title: `${roleId} evidence`, url: "https://example.test/staff" },
      }),
      env: fixture.env,
      params: { id: "submission-1" },
    });

    assert.equal(response.status, 403, roleId);
    assert.deepEqual(await response.json(), { error: "forbidden", ok: false }, roleId);
    assert.equal(fixture.db.data.evidenceArtifacts.length, 0, roleId);
    assert.equal(fixture.db.data.auditEvents.length, 1, roleId);
    assert.equal(fixture.db.data.auditEvents[0].action, "evidence_attach_denied", roleId);
    assert.deepEqual(fixture.db.data.auditEvents[0].metadata, {
      reason: "student_scope_denied",
      studentId: "student-a",
      actorRoleScopes: [{ roleId, scopeType: "global", scopeId: "" }],
    }, roleId);
  }
});

test("evidence link attach stores scoped metadata and omits Drive storage ids", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.submissions.push(buildSubmission("submission-1", "student-a"));

  const response = await onAttachEvidenceLink({
    request: buildJsonRequest({
      url: "https://example.test/api/submissions/submission-1/evidence",
      token: fixture.token,
      body: {
        title: "Research proposal source notes",
        artifactType: "planning document",
        url: "https://example.test/source-notes",
      },
    }),
    env: fixture.env,
    params: { id: "submission-1" },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.evidence.submissionId, "submission-1");
  assert.equal(body.evidence.studentId, "student-a");
  assert.equal(body.evidence.title, "Research proposal source notes");
  assert.equal(body.evidence.artifactType, "planning_document");
  assert.equal(body.evidence.sourceKind, "external_link");
  assert.equal(body.storage.metadataReady, true);
  assert.equal(body.storage.fileBytesReady, false);
  assert.doesNotMatch(JSON.stringify(body), /drive_file_id|driveFileId|drive_parent_folder_id|storage_id/i);

  assert.equal(fixture.db.data.evidenceArtifacts.length, 1);
  assert.equal(fixture.db.data.evidenceArtifacts[0].student_id, "student-a");
  assert.equal(fixture.db.data.evidenceArtifacts[0].submission_id, "submission-1");
  assert.equal(fixture.db.data.evidenceArtifacts[0].source_kind, "external_link");
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "evidence_link_attached");
  assert.equal(fixture.db.data.auditEvents[0].entity_type, "evidence_artifact");
  assert.deepEqual(fixture.db.data.auditEvents[0].metadata, {
    submissionId: "submission-1",
    studentId: "student-a",
    sourceKind: "external_link",
    actorRoleScopes: [{ roleId: "student", scopeType: "global", scopeId: "" }],
  });
});

function buildSubmission(id, studentId) {
  return {
    id,
    student_id: studentId,
    requirement_id: "req-proposal-draft",
    status: "draft",
    version: 1,
  };
}

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    submissions: [],
    evidenceArtifacts: [],
    auditEvents: [],
  });

  return {
    env: {
      DB: db,
      SESSION_PEPPER: "",
    },
    db,
  };
}

async function createFixtureWithSession({ userId, roleId }) {
  const base = createFixture();
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push({
    id: userId,
    email: `${userId}@senior-capstone.test`,
    email_norm: `${userId}@senior-capstone.test`,
    display_name: userId,
    status: "active",
  });
  base.db.data.userRoles.push({
    user_id: userId,
    role_id: roleId,
    scope_type: "global",
    scope_id: "",
  });
  base.db.data.sessions.push({
    id: `sess-${userId}`,
    user_id: userId,
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });

  return { ...base, token };
}

function buildJsonRequest({ url, token, body }) {
  const headers = {
    "content-type": "application/json",
    "cf-connecting-ip": "203.0.113.70",
    "user-agent": "integration-test",
  };
  if (token) {
    headers.cookie = `sc_session=${token}`;
  }

  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
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

    if (this.sql.startsWith("select id, student_id, requirement_id, status, version from submissions where id = ?")) {
      const [submissionId] = this.params;
      return this.data.submissions.find((row) => row.id === submissionId) ?? null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params;
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
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

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      return { success: true };
    }

    if (this.sql.startsWith("insert into evidence_artifacts")) {
      const [
        evidenceId,
        studentId,
        submissionId,
        artifactType,
        externalUrl,
        title,
        createdBy,
      ] = this.params;
      this.data.evidenceArtifacts.push({
        id: evidenceId,
        repository_id: "default-google-drive",
        student_id: studentId,
        submission_id: submissionId,
        artifact_type: artifactType,
        source_kind: "external_link",
        external_url: externalUrl,
        title,
        review_status: "pending_review",
        created_by: createdBy,
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
