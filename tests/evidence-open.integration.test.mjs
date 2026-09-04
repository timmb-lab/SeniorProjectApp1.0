import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";

import { onRequestGet } from "../functions/api/evidence/[id]/open.ts";
import { buildRequest, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("open in Drive enforces student scope and reveals the provider location only after authorization", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const env = {
    DB: db,
    AUTH_MODE: "hardened_username_password",
    SESSION_PEPPER: "",
    GOOGLE_DRIVE_CLIENT_EMAIL: "storage@example.test",
    GOOGLE_DRIVE_PRIVATE_KEY: privateKey,
  };
  await seedUser(db, { id: "owner", roleId: "student", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "other", roleId: "student", scopeType: "program", scopeId: "it" });
  await db.prepare(
    `INSERT INTO evidence_artifacts (
       id, repository_id, student_id, artifact_type, source_kind, drive_file_id,
       title, mime_type, review_status, created_by
     ) VALUES ('evidence-open', 'default-google-drive', 'owner', 'file_upload', 'google_drive_file',
       'private-drive-file-id', 'Prototype', 'application/pdf', 'pending_review', 'owner')`,
  ).run();

  const ownerToken = await seedSession(db, env, "owner");
  const otherToken = await seedSession(db, env, "other");
  assert.equal((await openEvidence(env, null)).status, 401);
  assert.equal((await openEvidence(env, otherToken)).status, 403);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    }
    if (url.includes("/drive/v3/files/private-drive-file-id")) {
      return new Response(JSON.stringify({ id: "private-drive-file-id", trashed: false }), { status: 200 });
    }
    throw new Error(`Unexpected provider URL: ${url}`);
  };
  try {
    const response = await openEvidence(env, ownerToken);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://drive.google.com/open?id=private-drive-file-id");
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(await response.text(), "");
    const artifact = await db.prepare("SELECT availability_status, availability_error_code FROM evidence_artifacts WHERE id = ?").bind("evidence-open").first();
    assert.equal(artifact.availability_status, "available");
    assert.equal(artifact.availability_error_code, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("open in Drive preserves a recoverable state when the provider file is missing", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const env = { DB: db, AUTH_MODE: "hardened_username_password", SESSION_PEPPER: "", GOOGLE_DRIVE_CLIENT_EMAIL: "storage@example.test", GOOGLE_DRIVE_PRIVATE_KEY: privateKey };
  await seedUser(db, { id: "owner", roleId: "student", scopeType: "program", scopeId: "it" });
  await db.prepare(`INSERT INTO evidence_artifacts (id, repository_id, student_id, artifact_type, source_kind, drive_file_id, title, mime_type, review_status, created_by) VALUES ('evidence-missing', 'default-google-drive', 'owner', 'file_upload', 'google_drive_file', 'missing-id', 'Missing', 'application/pdf', 'pending_review', 'owner')`).run();
  const token = await seedSession(db, env, "owner");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    if (url.includes("/drive/v3/files/missing-id")) return new Response("missing", { status: 404 });
    throw new Error(`Unexpected provider URL: ${url}`);
  };
  try {
    const response = await openEvidence(env, token, "evidence-missing");
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "drive_file_missing_or_inaccessible", ok: false });
    const artifact = await db.prepare("SELECT availability_status, availability_error_code FROM evidence_artifacts WHERE id = ?").bind("evidence-missing").first();
    assert.equal(artifact.availability_status, "missing_or_inaccessible");
    assert.equal(artifact.availability_error_code, "open_provider_404");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function openEvidence(env, token, evidenceId = "evidence-open") {
  return onRequestGet({
    request: buildRequest(`https://example.test/api/evidence/${evidenceId}/open`, token),
    env,
    params: { id: evidenceId },
  });
}
