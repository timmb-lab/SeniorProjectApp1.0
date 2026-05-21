import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex } from "../functions/_lib/crypto.ts";
import { onRequestPost as onQueueArchive } from "../functions/api/admin/exports/student-archive.ts";
import { onRequestGet as onArchiveReadiness } from "../functions/api/student/archive/readiness.ts";
import { onRequestGet as onExportDownload } from "../functions/api/exports/[id]/download.ts";

test("student archive readiness derives closeout checks from persisted rows and redacts storage ids", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  seedArchiveReadyStudent(fixture.db, "student-a");
  fixture.db.data.exports.push({
    id: "export-student-a",
    export_type: "student_archive",
    requested_by: "admin-a",
    target_user_id: "student-a",
    drive_file_id: "drive-export-secret",
    status: "queued",
    created_at: "2026-05-04T16:00:00.000Z",
    completed_at: null,
  });

  const response = await onArchiveReadiness({
    request: buildRequest("https://example.test/api/student/archive/readiness", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.studentId, "student-a");
  assert.equal(body.viewer.scope, "student-own archive");
  assert.equal(body.source, "persisted_rows");
  assert.equal(body.storage.provider, "google_drive");
  assert.equal(body.storage.credentialsConfigured, false);
  assert.equal(body.storage.storageIdentifiersRedacted, true);
  assert.equal(body.summary.readyChecks, 4);
  assert.equal(body.summary.missingChecks, 0);
  assert.equal(body.summary.archiveAvailableToRequest, false);
  assert.equal(body.archive.status, "queued");
  assert.equal(body.archive.signedDownloadReady, false);
  assert.deepEqual(
    body.checks.map((check) => [check.id, check.status]),
    [
      ["celebration_evidence", "ready"],
      ["thank_you_and_mentor_note", "ready"],
      ["reflection_portfolio", "ready"],
      ["ingredient_list_if_needed", "ready"],
    ],
  );
  assert.doesNotMatch(JSON.stringify(body), /drive-export-secret|drive_file_id|driveFileId/i);

  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "student_archive_readiness_viewed");
  assert.equal(fixture.db.data.auditEvents[0].entity_id, "student-a");
  assert.equal(fixture.db.data.auditEvents[0].metadata.readyChecks, 4);
});

test("student archive readiness denies another student's archive and audits the denial", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-b", roleId: "student" });
  seedArchiveReadyStudent(fixture.db, "student-a");

  const response = await onArchiveReadiness({
    request: buildRequest("https://example.test/api/student/archive/readiness?studentId=student-a", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "student_archive_readiness_denied");
  assert.equal(fixture.db.data.auditEvents[0].entity_id, "student-a");
  assert.deepEqual(fixture.db.data.auditEvents[0].metadata.actorRoleScopes, [
    { roleId: "student", scopeType: "global", scopeId: "" },
  ]);
});

test("misc admin cannot open a student archive readiness record without explicit student scope", async () => {
  const fixture = await createFixtureWithSession({ userId: "misc-a", roleId: "misc_admin" });
  fixture.db.data.userRoles[0].scope_type = "reporting";
  fixture.db.data.userRoles[0].scope_id = "alpha-readiness";
  seedArchiveReadyStudent(fixture.db, "student-a");

  const response = await onArchiveReadiness({
    request: buildRequest("https://example.test/api/student/archive/readiness?studentId=student-a", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "student_archive_readiness_denied");
});

test("admin archive readiness can inspect a scoped student but still reports signed downloads disabled", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.env.GOOGLE_DRIVE_CLIENT_EMAIL = "service-account@example.test";
  fixture.env.GOOGLE_DRIVE_PRIVATE_KEY = "private-key";
  seedArchiveReadyStudent(fixture.db, "student-a");
  fixture.db.data.exports.push({
    id: "export-complete",
    export_type: "student_archive",
    requested_by: "admin-a",
    target_user_id: "student-a",
    drive_file_id: "drive-complete-secret",
    status: "complete",
    created_at: "2026-05-04T16:00:00.000Z",
    completed_at: "2026-05-04T16:05:00.000Z",
  });

  const response = await onArchiveReadiness({
    request: buildRequest("https://example.test/api/student/archive/readiness?studentId=student-a", fixture.token),
    env: fixture.env,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.viewer.scope, "admin archive");
  assert.equal(body.archive.status, "complete");
  assert.equal(body.archive.signedDownloadReady, false);
  assert.equal(body.archive.scopedDownloadReady, false);
  assert.match(body.archive.message, /signed archive links are still disabled/i);
  assert.doesNotMatch(JSON.stringify(body), /drive-complete-secret|drive_file_id|driveFileId/i);
});

test("admin archive export generates a scoped manifest artifact without storage ids", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  seedArchiveReadyStudent(fixture.db, "student-a");

  const response = await onQueueArchive({
    request: buildJsonRequest(
      "https://example.test/api/admin/exports/student-archive",
      fixture.token,
      { studentId: "student-a", reason: "May 5 archive package" },
      "POST",
    ),
    env: fixture.env,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.export.status, "complete");
  assert.equal(body.export.scopedDownloadReady, true);
  assert.equal(body.export.signedDownloadReady, false);
  assert.match(body.export.downloadUrl, /^\/api\/exports\/export[_-]/);
  assert.equal(fixture.db.data.exports.length, 1);
  assert.equal(fixture.db.data.exports[0].status, "complete");
  assert.equal(fixture.db.data.exportArtifacts.length, 1);
  assert.equal(fixture.db.data.exportArtifacts[0].artifact_type, "student_archive_manifest_json");
  assert.doesNotMatch(fixture.db.data.exportArtifacts[0].body_json, /drive-celebration-secret|drive_file_id|driveFileId/i);
  assert.equal(fixture.db.data.auditEvents[0].action, "student_archive_export_generated");
  assert.equal(fixture.db.data.auditEvents[0].metadata.scopedDownloadReady, true);
});

test("export download streams the generated archive manifest for scoped users", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  seedArchiveReadyStudent(fixture.db, "student-a");

  const queueResponse = await onQueueArchive({
    request: buildJsonRequest(
      "https://example.test/api/admin/exports/student-archive",
      fixture.token,
      { studentId: "student-a", reason: "May 5 archive package" },
      "POST",
    ),
    env: fixture.env,
  });
  const queued = await queueResponse.json();
  fixture.db.data.auditEvents.length = 0;

  const response = await onExportDownload({
    request: buildRequest(`https://example.test/api/exports/${queued.export.id}/download`, fixture.token),
    env: fixture.env,
    params: { id: queued.export.id },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.match(response.headers.get("content-disposition"), /attachment/);
  assert.equal(response.headers.get("x-archive-storage-identifiers-redacted"), "true");
  const manifest = await response.json();
  assert.equal(manifest.manifestVersion, "student-archive-v1");
  assert.equal(manifest.exportId, queued.export.id);
  assert.equal(manifest.student.id, "student-a");
  assert.equal(manifest.evidenceArtifacts.length, 8);
  assert.equal(manifest.evidenceArtifacts[0].fileBytesReady, true);
  assert.doesNotMatch(JSON.stringify(manifest), /drive-celebration-secret|drive_file_id|driveFileId/i);
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "export_downloaded");
  assert.equal(fixture.db.data.auditEvents[0].metadata.scopedDownloadReady, true);
});

test("export download reports missing archive artifacts instead of claiming signed URL readiness", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.exports.push({
    id: "export-complete",
    export_type: "student_archive",
    requested_by: "admin-a",
    target_user_id: "student-a",
    drive_file_id: "drive-complete-secret",
    status: "complete",
    created_at: "2026-05-04T16:00:00.000Z",
    completed_at: "2026-05-04T16:05:00.000Z",
  });

  const response = await onExportDownload({
    request: buildRequest("https://example.test/api/exports/export-complete/download", fixture.token),
    env: fixture.env,
    params: { id: "export-complete" },
  });

  const body = await response.json();
  assert.equal(response.status, 409);
  assert.deepEqual(body, { error: "archive_artifact_missing", ok: false });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "export_download_missing_artifact");
});

test("export download returns an expired-package retry state", async () => {
  const fixture = await createFixtureWithSession({ userId: "student-a", roleId: "student" });
  fixture.db.data.exports.push({
    id: "export-expired",
    export_type: "student_archive",
    requested_by: "admin-a",
    target_user_id: "student-a",
    drive_file_id: null,
    status: "complete",
    created_at: "2026-05-04T16:00:00.000Z",
    completed_at: "2026-05-04T16:05:00.000Z",
  });
  fixture.db.data.exportArtifacts.push({
    id: "artifact-expired",
    export_id: "export-expired",
    artifact_type: "student_archive_manifest_json",
    title: "Expired archive",
    mime_type: "application/json",
    byte_length: 2,
    content_sha256: "sha",
    body_json: "{}",
    expires_at: "2000-01-01T00:00:00.000Z",
    created_at: "2000-01-01T00:00:00.000Z",
  });

  const response = await onExportDownload({
    request: buildRequest("https://example.test/api/exports/export-expired/download", fixture.token),
    env: fixture.env,
    params: { id: "export-expired" },
  });

  assert.equal(response.status, 410);
  const body = await response.json();
  assert.equal(body.error, "archive_download_expired");
  assert.equal(body.download.retry, "request_new_archive_export");
  assert.equal(fixture.db.data.auditEvents[0].action, "export_download_expired");
});

function seedArchiveReadyStudent(db, studentId) {
  db.data.userAccounts.push({
    id: studentId,
    email: `${studentId}@senior-capstone.test`,
    email_norm: `${studentId}@senior-capstone.test`,
    display_name: "Archive Student",
    status: "active",
  });
  db.data.userRoles.push({
    user_id: studentId,
    role_id: "student",
    scope_type: "global",
    scope_id: "",
  });
  for (const requirementId of [
    "req-celebration-day",
    "req-thanks-and-thanks",
    "req-reflection-best-work",
    "req-reflection-senior-project",
    "req-reflection-tenet-mastery",
    "req-reflection-project-based-learning",
    "req-reflection-next-year-plan",
  ]) {
    db.data.progressRecords.push({
      student_id: studentId,
      requirement_id: requirementId,
      phase: "reflection-and-archive",
      status: "approved",
      updated_at: "2026-05-03T16:00:00.000Z",
      requirement_title: requirementId,
    });
  }
  db.data.evidenceArtifacts.push(
    {
      student_id: studentId,
      artifact_type: "celebration_photo",
      source_kind: "google_drive_file",
      title: "Celebration setup photo",
      review_status: "approved",
      created_at: "2026-05-03T16:00:00.000Z",
      requirement_id: "req-celebration-day",
      drive_file_id: "drive-celebration-secret",
      deleted_at: null,
    },
    {
      student_id: studentId,
      artifact_type: "ingredient_list",
      source_kind: "external_link",
      title: "Ingredient and allergen list",
      review_status: "approved",
      created_at: "2026-05-03T16:01:00.000Z",
      requirement_id: "req-celebration-day",
      drive_file_id: null,
      deleted_at: null,
    },
    {
      student_id: studentId,
      artifact_type: "thank_you_letter",
      source_kind: "external_link",
      title: "Thank-you letter and mentor note",
      review_status: "approved",
      created_at: "2026-05-03T16:02:00.000Z",
      requirement_id: "req-thanks-and-thanks",
      drive_file_id: null,
      deleted_at: null,
    },
    ...[
      "req-reflection-best-work",
      "req-reflection-senior-project",
      "req-reflection-tenet-mastery",
      "req-reflection-project-based-learning",
      "req-reflection-next-year-plan",
    ].map((requirementId, index) => ({
      student_id: studentId,
      artifact_type: "reflection",
      source_kind: "external_link",
      title: `Reflection ${index + 1}`,
      review_status: "approved",
      created_at: `2026-05-03T16:0${index + 3}:00.000Z`,
      requirement_id: requirementId,
      drive_file_id: null,
      deleted_at: null,
    })),
  );
}

function buildRequest(url, token) {
  return new Request(url, {
    headers: {
      cookie: `sc_session=${token}`,
      "cf-connecting-ip": "203.0.113.70",
      "user-agent": "integration-test",
    },
  });
}

function buildJsonRequest(url, token, body, method = "POST") {
  return new Request(url, {
    method,
    headers: {
      cookie: `sc_session=${token}`,
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.70",
      "user-agent": "integration-test",
    },
    body: JSON.stringify(body),
  });
}

function createFixture() {
  const db = new MockD1Database({
    userAccounts: [],
    sessions: [],
    userRoles: [],
    mentorAssignments: [],
    groupMemberships: [],
    groups: [],
    progressRecords: [],
    evidenceArtifacts: [],
    exports: [],
    exportArtifacts: [],
    auditEvents: [],
  });

  return {
    env: {
      DB: db,
      SESSION_PEPPER: "",
      EVIDENCE_STORAGE_PROVIDER: "google_drive",
      GOOGLE_DRIVE_EVIDENCE_ROOT_ID: "root-123",
      GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID: "sheet-456",
      GOOGLE_DRIVE_CLIENT_EMAIL: "",
      GOOGLE_DRIVE_PRIVATE_KEY: "",
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

    if (this.sql.startsWith("select id from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      const user = this.data.userAccounts.find((row) => row.id === userId && row.status === "active");
      return user ? { id: user.id } : null;
    }

    if (this.sql.startsWith("select id, display_name from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params;
      const user = this.data.userAccounts.find((row) => row.id === userId && row.status === "active");
      return user ? { id: user.id, display_name: user.display_name } : null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params;
      return this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId) ? { ok: 1 } : null;
    }

    if (this.sql.includes("from mentor_assignments")) {
      const [mentorId, studentId] = this.params;
      return this.data.mentorAssignments.some(
        (row) =>
          row.mentor_user_id === mentorId &&
          row.student_user_id === studentId &&
          Number(row.active) === 1,
      ) ? { ok: 1 } : null;
    }

    if (this.sql.includes("from user_roles teacher_role")) {
      const [studentId, teacherUserId] = this.params;
      const teacherRoles = this.data.userRoles.filter(
        (row) => row.user_id === teacherUserId && row.role_id === "program_teacher",
      );
      if (!teacherRoles.length) return null;
      const memberships = this.data.groupMemberships.filter((row) => row.user_id === studentId);
      const groupsById = new Map(this.data.groups.map((row) => [row.id, row]));
      for (const membership of memberships) {
        const group = groupsById.get(membership.group_id);
        if (!group) continue;
        for (const role of teacherRoles) {
          if (role.scope_type === "global") return { ok: 1 };
          if (role.scope_type === "program" && role.scope_id && role.scope_id === group.program_id) return { ok: 1 };
          if (role.scope_type === "cohort" && role.scope_id && role.scope_id === group.cohort_id) return { ok: 1 };
        }
      }
      return null;
    }

    if (this.sql.startsWith("select id, export_type, requested_by, target_user_id, drive_file_id, status, created_at, completed_at from exports where id = ?")) {
      const [exportId] = this.params;
      return this.data.exports.find((row) => row.id === exportId) ?? null;
    }

    if (this.sql.startsWith("select id, artifact_type, title, mime_type, byte_length, content_sha256, body_json, expires_at, created_at from export_artifacts")) {
      const [exportId, artifactType] = this.params;
      return this.data.exportArtifacts
        .filter((row) => row.export_id === exportId && row.artifact_type === artifactType)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] ?? null;
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

    if (this.sql.startsWith("select progress.requirement_id")) {
      const [studentId] = this.params;
      return {
        results: this.data.progressRecords.filter((row) => row.student_id === studentId),
      };
    }

    if (this.sql.startsWith("select evidence.artifact_type")) {
      const [studentId] = this.params;
      return {
        results: this.data.evidenceArtifacts
          .filter((row) => row.student_id === studentId && !row.deleted_at && row.review_status !== "archived")
          .map((row) => ({
            artifact_type: row.artifact_type,
            source_kind: row.source_kind,
            external_url: row.external_url || null,
            title: row.title,
            review_status: row.review_status,
            created_at: row.created_at,
            requirement_id: row.requirement_id,
          })),
      };
    }

    if (this.sql.startsWith("select exports.id")) {
      const [studentId] = this.params;
      return {
        results: this.data.exports
          .filter((row) => row.export_type === "student_archive" && row.target_user_id === studentId)
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .slice(0, 5)
          .map((row) => {
            const artifact = this.data.exportArtifacts
              .filter((candidate) => candidate.export_id === row.id && candidate.artifact_type === "student_archive_manifest_json")
              .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
            return {
              ...row,
              artifact_id: artifact?.id || null,
              artifact_expires_at: artifact?.expires_at || null,
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

    if (this.sql.startsWith("insert into exports")) {
      const [id, requestedBy, targetUserId, completedAt] = this.params;
      this.data.exports.push({
        id,
        export_type: "student_archive",
        requested_by: requestedBy,
        target_user_id: targetUserId,
        drive_file_id: null,
        status: "complete",
        created_at: completedAt,
        completed_at: completedAt,
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into export_artifacts")) {
      const [
        id,
        exportId,
        artifactType,
        title,
        mimeType,
        byteLength,
        contentSha256,
        bodyJson,
        expiresAt,
        createdAt,
      ] = this.params;
      this.data.exportArtifacts.push({
        id,
        export_id: exportId,
        artifact_type: artifactType,
        title,
        mime_type: mimeType,
        byte_length: byteLength,
        content_sha256: contentSha256,
        body_json: bodyJson,
        expires_at: expiresAt,
        created_at: createdAt,
      });
      return { success: true };
    }

    throw new Error(`Unmocked D1 run() query: ${this.sql}`);
  }
}
