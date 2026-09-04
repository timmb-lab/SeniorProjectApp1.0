import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet } from "../functions/api/evidence/[id]/open.ts";
import { buildRequest, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("open in Drive enforces student scope and reveals the provider location only after authorization", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = { DB: db, AUTH_MODE: "hardened_username_password", SESSION_PEPPER: "" };
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

  const response = await openEvidence(env, ownerToken);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://drive.google.com/open?id=private-drive-file-id");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(await response.text(), "");
});

function openEvidence(env, token) {
  return onRequestGet({
    request: buildRequest("https://example.test/api/evidence/evidence-open/open", token),
    env,
    params: { id: "evidence-open" },
  });
}
