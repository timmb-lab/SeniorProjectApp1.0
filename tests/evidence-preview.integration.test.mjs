import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";

import { onRequestGet } from "../functions/api/evidence/[id]/preview.ts";
import { buildRequest, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("evidence preview enforces student scope and streams PDFs inline without Drive ids", async () => {
  const fixture = await createFixture();
  const missingSession = await preview(fixture, null);
  assert.equal(missingSession.status, 401);

  const denied = await preview(fixture, fixture.otherToken);
  assert.equal(denied.status, 403);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    }
    if (url.includes("/drive/v3/files/private-drive-id") && url.includes("alt=media")) {
      return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }
    throw new Error(`Unexpected provider URL: ${url}`);
  };
  try {
    const response = await preview(fixture, fixture.ownerToken);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.match(response.headers.get("content-disposition"), /^inline;/);
    assert.match(response.headers.get("content-security-policy"), /sandbox/);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(Buffer.from(await response.arrayBuffer()).toString("ascii"), "%PDF");
    assert.doesNotMatch([...response.headers].flat().join(" "), /private-drive-id|access_token/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("DOCX preview exports the converted Google Doc companion as a safe inline PDF", async () => {
  const fixture = await createFixture();
  await fixture.env.DB.prepare(
    `INSERT INTO evidence_artifacts (
       id, repository_id, student_id, artifact_type, source_kind, drive_file_id,
       title, mime_type, review_status, created_by, preview_kind, preview_status, preview_drive_file_id
     ) VALUES ('evidence-docx', 'default-google-drive', 'owner', 'file_upload', 'google_drive_file',
       'private-original-docx-id', 'My plan',
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'pending_review', 'owner', 'converted_pdf', 'ready', 'private-converted-doc-id')`,
  ).run();

  const originalFetch = globalThis.fetch;
  let sawExport = false;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    }
    if (url.startsWith("https://www.googleapis.com/drive/v3/files/private-converted-doc-id/export")) {
      sawExport = true;
      assert.match(url, /mimeType=application%2Fpdf/);
      assert.doesNotMatch(url, /private-original-docx-id/);
      return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }
    throw new Error(`Unexpected provider URL: ${url}`);
  };
  try {
    const response = await preview(fixture, fixture.ownerToken, "evidence-docx");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.match(response.headers.get("content-disposition"), /^inline;/);
    assert.equal(Buffer.from(await response.arrayBuffer()).toString("ascii"), "%PDF");
    assert.equal(sawExport, true);
    assert.doesNotMatch([...response.headers].flat().join(" "), /private-converted-doc-id|private-original-docx-id/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

async function createFixture() {
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
    EVIDENCE_STORAGE_PROVIDER: "link_only",
    GOOGLE_DRIVE_CLIENT_EMAIL: "storage@example.test",
    GOOGLE_DRIVE_PRIVATE_KEY: privateKey,
  };
  await seedUser(db, { id: "owner", roleId: "student", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "other", roleId: "student", scopeType: "program", scopeId: "it" });
  await db.prepare(
    `INSERT INTO evidence_artifacts (
       id, repository_id, student_id, artifact_type, source_kind, drive_file_id,
       title, mime_type, review_status, created_by, preview_kind, preview_status
     ) VALUES ('evidence-pdf', 'default-google-drive', 'owner', 'file_upload', 'google_drive_file',
       'private-drive-id', 'My report', 'application/pdf', 'pending_review', 'owner', 'inline_pdf', 'ready')`,
  ).run();
  return {
    env,
    ownerToken: await seedSession(db, env, "owner"),
    otherToken: await seedSession(db, env, "other"),
  };
}

function preview(fixture, token, evidenceId = "evidence-pdf") {
  return onRequestGet({
    request: buildRequest(`https://example.test/api/evidence/${evidenceId}/preview`, token),
    env: fixture.env,
    params: { id: evidenceId },
  });
}
