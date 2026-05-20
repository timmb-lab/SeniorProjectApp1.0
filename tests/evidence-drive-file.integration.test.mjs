import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost as onUploadEvidenceFile } from "../functions/api/submissions/[id]/evidence/upload.ts";
import { onRequestGet as onDownloadEvidenceFile } from "../functions/api/evidence/[id]/download.ts";

test("evidence file upload returns 401 when session is missing", async () => {
  const fixture = createFixture();
  fixture.db.data.submissions.push({
    id: "submission-1",
    student_id: "student-a",
    requirement_id: null,
    status: "draft",
    version: 1,
  });

  const response = await onUploadEvidenceFile({
    request: buildUploadRequest({
      url: "https://example.test/api/submissions/submission-1/evidence/upload",
      token: null,
    }),
    env: fixture.env,
    params: { id: "submission-1" },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("evidence file upload returns 503 and audits when Drive root config is missing", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID = "";
  fixture.db.data.submissions.push({
    id: "submission-1",
    student_id: "student-a",
    requirement_id: null,
    status: "draft",
    version: 1,
  });

  const response = await onUploadEvidenceFile({
    request: buildUploadRequest({
      url: "https://example.test/api/submissions/submission-1/evidence/upload",
      token: fixture.token,
    }),
    env: fixture.env,
    params: { id: "submission-1" },
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "drive_config_missing", ok: false });

  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "google_drive_upload_missing_config");
});

test("evidence file upload returns 502 and audits when token exchange fails", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.submissions.push({
    id: "submission-1",
    student_id: "student-a",
    requirement_id: null,
    status: "draft",
    version: 1,
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response("token failure", { status: 500, headers: { "content-type": "text/plain" } });
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onUploadEvidenceFile({
      request: buildUploadRequest({
        url: "https://example.test/api/submissions/submission-1/evidence/upload",
        token: fixture.token,
      }),
      env: fixture.env,
      params: { id: "submission-1" },
    });

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "drive_token_exchange_failed", ok: false });
    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "google_drive_upload_token_exchange_failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("evidence file upload returns 200, writes DB rows, and omits storage ids", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.submissions.push({
    id: "submission-1",
    student_id: "student-a",
    requirement_id: null,
    status: "draft",
    version: 1,
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      return jsonResponse({ access_token: "test-token", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.startsWith("https://www.googleapis.com/upload/drive/v3/files")) {
      return jsonResponse({ id: "drive-file-123", name: "uploaded.bin", mimeType: "application/octet-stream", size: "5" });
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onUploadEvidenceFile({
      request: buildUploadRequest({
        url: "https://example.test/api/submissions/submission-1/evidence/upload",
        token: fixture.token,
        title: "My evidence",
      }),
      env: fixture.env,
      params: { id: "submission-1" },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.evidence.submissionId, "submission-1");
    assert.equal(body.evidence.studentId, "student-a");
    assert.equal(body.evidence.sourceKind, "google_drive_file");
    assert.equal(body.storage.fileBytesReady, true);
    assert.equal(fixture.db.data.evidenceArtifacts.length, 1);
    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "evidence_file_uploaded");
    assert.doesNotMatch(JSON.stringify(body), /drive_file_id|driveFileId|access_token|PRIVATE KEY/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("evidence download returns 401 and audits when session is missing", async () => {
  const fixture = createFixture();
  fixture.db.data.evidenceArtifacts.push({
    id: "evidence-1",
    student_id: "student-a",
    source_kind: "google_drive_file",
    drive_file_id: "drive-file-123",
    mime_type: "application/pdf",
    title: "Evidence PDF",
    deleted_at: null,
  });

  const response = await onDownloadEvidenceFile({
    request: new Request("https://example.test/api/evidence/evidence-1/download", {
      headers: { "cf-connecting-ip": "203.0.113.60", "user-agent": "integration-test" },
    }),
    env: fixture.env,
    params: { id: "evidence-1" },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "evidence_download_unauthorized");
});

test("evidence download returns 502 and audits when Drive download fails", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.evidenceArtifacts.push({
    id: "evidence-1",
    student_id: "student-a",
    source_kind: "google_drive_file",
    drive_file_id: "drive-file-123",
    mime_type: "application/pdf",
    title: "Evidence PDF",
    deleted_at: null,
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      return jsonResponse({ access_token: "test-token", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.includes("https://www.googleapis.com/drive/v3/files/") && url.includes("alt=media")) {
      return new Response("forbidden", { status: 403, headers: { "content-type": "text/plain" } });
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onDownloadEvidenceFile({
      request: new Request("https://example.test/api/evidence/evidence-1/download", {
        headers: {
          cookie: `sc_session=${fixture.token}`,
          "cf-connecting-ip": "203.0.113.61",
          "user-agent": "integration-test",
        },
      }),
      env: fixture.env,
      params: { id: "evidence-1" },
    });

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "drive_download_failed", ok: false });
    assert.equal(fixture.db.data.auditEvents.length, 2);
    assert.equal(fixture.db.data.auditEvents[0].action, "google_drive_download_failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("evidence download returns 200 and streams bytes when allowed", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.evidenceArtifacts.push({
    id: "evidence-1",
    student_id: "student-a",
    source_kind: "google_drive_file",
    drive_file_id: "drive-file-123",
    mime_type: "application/pdf",
    title: "Evidence PDF",
    deleted_at: null,
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = resolveFetchUrl(input);
    if (url === "https://oauth2.googleapis.com/token") {
      return jsonResponse({ access_token: "test-token", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.includes("https://www.googleapis.com/drive/v3/files/") && url.includes("alt=media")) {
      return new Response("pdf-bytes", { status: 200, headers: { "content-type": "application/pdf" } });
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  try {
    const response = await onDownloadEvidenceFile({
      request: new Request("https://example.test/api/evidence/evidence-1/download", {
        headers: {
          cookie: `sc_session=${fixture.token}`,
          "cf-connecting-ip": "203.0.113.62",
          "user-agent": "integration-test",
        },
      }),
      env: fixture.env,
      params: { id: "evidence-1" },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.equal(await response.text(), "pdf-bytes");
    assert.equal(fixture.db.data.auditEvents.length, 1);
    assert.equal(fixture.db.data.auditEvents[0].action, "evidence_downloaded");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function resolveFetchUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input === "object" && typeof input.url === "string") return input.url;
  return String(input);
}

function buildUploadRequest({ url, token, title = "Evidence Upload" }) {
  const form = new FormData();
  const file = new File(["hello"], "hello.txt", { type: "text/plain" });
  form.set("file", file);
  form.set("title", title);
  form.set("artifactType", "reflection");

  const headers = {
    "cf-connecting-ip": "203.0.113.50",
    "user-agent": "integration-test",
  };
  if (token) {
    headers.cookie = `sc_session=${token}`;
  }

  return new Request(url, { method: "POST", headers, body: form });
}

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    groupMemberships: [],
    groups: [],
    submissions: [],
    evidenceArtifacts: [],
    auditEvents: [],
  });

  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  return {
    env: {
      DB: db,
      SESSION_PEPPER: "",
      GOOGLE_DRIVE_EVIDENCE_ROOT_ID: "root-123",
      GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID: "sheet-456",
      GOOGLE_DRIVE_CLIENT_EMAIL: "service-account@example.test",
      GOOGLE_DRIVE_PRIVATE_KEY: privateKey,
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
      const session = this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at);
      return session ?? null;
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
      return this.data.submissions.find((row) => row.id === submissionId) ?? null;
    }

    if (this.sql.startsWith("select id, student_id, source_kind, drive_file_id, mime_type, title, deleted_at from evidence_artifacts where id = ?")) {
      const [evidenceId] = this.params;
      return this.data.evidenceArtifacts.find((row) => row.id === evidenceId) ?? null;
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
      return null;
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

    if (this.sql.startsWith("insert into evidence_artifacts")) {
      const [
        evidenceId,
        studentId,
        submissionId,
        artifactType,
        driveFileId,
        driveParentFolderId,
        title,
        mimeType,
        sizeBytes,
        createdBy,
      ] = this.params;
      this.data.evidenceArtifacts.push({
        id: evidenceId,
        student_id: studentId,
        submission_id: submissionId,
        artifact_type: artifactType,
        source_kind: "google_drive_file",
        drive_file_id: driveFileId,
        drive_parent_folder_id: driveParentFolderId,
        title,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        created_by: createdBy,
        review_status: "pending_review",
        deleted_at: null,
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

