import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";

import { parseGoogleDriveFolderUrl } from "../functions/_lib/google-drive.ts";
import { getCurrentUser } from "../functions/_lib/auth.ts";
import { canAccessSite, hasAnyRole } from "../functions/_lib/permissions.ts";
import { onRequestGet, onRequestPost } from "../functions/api/program-storage.ts";
import { onRequestGet as onRequestOpen } from "../functions/api/program-storage/open.ts";
import { buildRequest, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

const SITE_ID = "site-test-high-school";
const PROGRAM_ID = "it";
const FOLDER_ID = "folder_1234567890";
const ROOT_FOLDER_ID = "root_folder_1234567890";
const CREATED_FOLDER_ID = "created_folder_1234567890";

test("Drive folder parser accepts only canonical HTTPS folder links", () => {
  assert.deepEqual(parseGoogleDriveFolderUrl(`https://drive.google.com/drive/u/0/folders/${FOLDER_ID}?usp=sharing`), {
    ok: true,
    folderId: FOLDER_ID,
    canonicalUrl: `https://drive.google.com/drive/folders/${FOLDER_ID}`,
  });
  for (const value of [
    `http://drive.google.com/drive/folders/${FOLDER_ID}`,
    `https://docs.google.com/document/d/${FOLDER_ID}`,
    `https://drive.google.com/file/d/${FOLDER_ID}`,
    `https://user:secret@drive.google.com/drive/folders/${FOLDER_ID}`,
    "not-a-url",
  ]) assert.equal(parseGoogleDriveFolderUrl(value).ok, false, value);
});

test("an assigned Program Teacher can create one dedicated program folder without receiving provider IDs", async () => {
  const fixture = await createFixture();
  const originalFetch = globalThis.fetch;
  let createCalls = 0;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    }
    if (url.includes(`/drive/v3/files/${ROOT_FOLDER_ID}`)) {
      return new Response(JSON.stringify({
        id: ROOT_FOLDER_ID,
        name: "School evidence root",
        mimeType: "application/vnd.google-apps.folder",
        driveId: "shared-drive-school",
        capabilities: { canAddChildren: true },
      }), { status: 200 });
    }
    if (url.startsWith("https://www.googleapis.com/drive/v3/files?") && init.method === "POST") {
      createCalls += 1;
      const body = JSON.parse(String(init.body || "{}"));
      assert.equal(body.mimeType, "application/vnd.google-apps.folder");
      assert.deepEqual(body.parents, [ROOT_FOLDER_ID]);
      assert.match(body.name, /Capstone Program Files/);
      return new Response(JSON.stringify({ id: CREATED_FOLDER_ID, name: body.name, mimeType: body.mimeType }), { status: 200 });
    }
    throw new Error(`Unexpected provider URL: ${url}`);
  };
  try {
    const created = await changeStorage(fixture, fixture.tokens.teacher, {
      action: "create", siteId: SITE_ID, programId: PROGRAM_ID,
    });
    assert.equal(created.response.status, 200);
    assert.equal(created.body.createdByApp, true);
    assert.equal(created.body.storage.status, "ready");
    assert.equal(created.body.storage.ownershipMode, "teacher_managed_shared_folder");
    assert.equal(createCalls, 1);
    assert.doesNotMatch(JSON.stringify(created.body), new RegExp(CREATED_FOLDER_ID, "i"));
    assert.doesNotMatch(JSON.stringify(created.body), /folderId|folder_id|private_key|access_token/i);

    const repeated = await changeStorage(fixture, fixture.tokens.teacher, {
      action: "create", siteId: SITE_ID, programId: PROGRAM_ID,
    });
    assert.equal(repeated.response.status, 409);
    assert.equal(repeated.body.error, "storage_already_connected");
    assert.equal(createCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("program storage is teacher-managed, role-scoped, revisioned, and identifier-safe", async () => {
  const fixture = await createFixture();
  const unauthenticated = await onRequestGet({
    request: buildRequest(`https://example.test/api/program-storage?siteId=${SITE_ID}&programId=${PROGRAM_ID}`),
    env: fixture.env,
  });
  assert.equal(unauthenticated.status, 401);

  const studentDenied = await getStorage(fixture, fixture.tokens.student, PROGRAM_ID);
  assert.equal(studentDenied.response.status, 403);
  assert.equal((await getStorage(fixture, fixture.tokens.mentor, PROGRAM_ID)).response.status, 403);
  assert.equal((await getStorage(fixture, fixture.tokens.viewer, PROGRAM_ID)).response.status, 403);
  const seededSiteAdminRole = await fixture.db.prepare("SELECT role_id, scope_type, scope_id FROM user_roles WHERE user_id = 'site-admin'").first();
  assert.equal(seededSiteAdminRole.role_id, "site_admin");
  assert.equal(seededSiteAdminRole.scope_type, "site");
  assert.equal(seededSiteAdminRole.scope_id, SITE_ID);
  const siteAdminRequest = buildRequest(`https://example.test/api/program-storage?siteId=${SITE_ID}&programId=${PROGRAM_ID}`, fixture.tokens.siteAdmin);
  const siteAdminUser = await getCurrentUser(siteAdminRequest, fixture.env);
  assert.equal(siteAdminUser.id, "site-admin");
  assert.equal(await hasAnyRole(fixture.env, siteAdminUser.id, ["site_admin", "administration"]), true);
  assert.equal(await canAccessSite(fixture.env, siteAdminUser, SITE_ID), true);
  const siteAdminView = await getStorage(fixture, fixture.tokens.siteAdmin, PROGRAM_ID);
  assert.equal(siteAdminView.response.status, 200, JSON.stringify(siteAdminView.body));
  assert.equal(siteAdminView.body.setup.canManage, false);
  const schoolAdminView = await getStorage(fixture, fixture.tokens.administration, PROGRAM_ID);
  assert.equal(schoolAdminView.response.status, 200);
  assert.equal(schoolAdminView.body.setup.canManage, false);
  const siteAdminChange = await changeStorage(fixture, fixture.tokens.siteAdmin, {
    action: "configure", siteId: SITE_ID, programId: PROGRAM_ID,
    folderUrl: `https://drive.google.com/drive/folders/${FOLDER_ID}`, confirmedSharedWithApp: true,
  });
  assert.equal(siteAdminChange.response.status, 403);
  const schoolAdminChange = await changeStorage(fixture, fixture.tokens.administration, {
    action: "configure", siteId: SITE_ID, programId: PROGRAM_ID,
    folderUrl: `https://drive.google.com/drive/folders/${FOLDER_ID}`, confirmedSharedWithApp: true,
  });
  assert.equal(schoolAdminChange.response.status, 403);

  const missingConfirmation = await changeStorage(fixture, fixture.tokens.teacher, {
    action: "configure", siteId: SITE_ID, programId: PROGRAM_ID,
    folderUrl: `https://drive.google.com/drive/folders/${FOLDER_ID}`,
  });
  assert.equal(missingConfirmation.response.status, 400);
  assert.equal(missingConfirmation.body.error, "drive_folder_share_confirmation_required");

  await withDriveProvider(async () => {
    const personalFolder = await changeStorage(fixture, fixture.tokens.teacher, {
      action: "configure", siteId: SITE_ID, programId: PROGRAM_ID,
      folderUrl: `https://drive.google.com/drive/folders/${FOLDER_ID}`, confirmedSharedWithApp: true,
    });
    assert.equal(personalFolder.response.status, 400);
    assert.equal(personalFolder.body.error, "writable_shared_drive_folder_required");
  }, { driveId: null, capabilities: { canAddChildren: true } });

  await withDriveProvider(async () => {
    const configured = await changeStorage(fixture, fixture.tokens.teacher, {
      action: "configure", siteId: SITE_ID, programId: PROGRAM_ID,
      folderUrl: `https://drive.google.com/drive/u/0/folders/${FOLDER_ID}?usp=sharing`, confirmedSharedWithApp: true,
    });
    assert.equal(configured.response.status, 200);
    assert.equal(configured.body.storage.revision, 1);
    assert.equal(configured.body.storage.openUrl, `/api/program-storage/open?siteId=${SITE_ID}&programId=${PROGRAM_ID}`);
    assert.doesNotMatch(JSON.stringify(configured.body), /folderId|folder_id|private_key|access_token/i);
    assert.doesNotMatch(JSON.stringify(configured.body), new RegExp(FOLDER_ID, "i"));

    const safeOversightView = await getStorage(fixture, fixture.tokens.siteAdmin, PROGRAM_ID);
    assert.equal(safeOversightView.body.storage.status, "ready");
    assert.equal(safeOversightView.body.storage.openUrl, "");
    assert.doesNotMatch(JSON.stringify(safeOversightView.body), new RegExp(FOLDER_ID, "i"));

    const teacherOpen = await openStorage(fixture, fixture.tokens.teacher);
    assert.equal(teacherOpen.status, 302);
    assert.equal(teacherOpen.headers.get("location"), `https://drive.google.com/drive/folders/${FOLDER_ID}`);
    assert.equal(teacherOpen.headers.get("referrer-policy"), "no-referrer");
    assert.equal((await openStorage(fixture, fixture.tokens.siteAdmin)).status, 403);

    const verified = await changeStorage(fixture, fixture.tokens.teacher, {
      action: "verify", siteId: SITE_ID, programId: PROGRAM_ID,
    });
    assert.equal(verified.response.status, 200);
    assert.equal(verified.body.storage.revision, 2);
  });

  const disconnected = await changeStorage(fixture, fixture.tokens.teacher, {
    action: "disconnect", siteId: SITE_ID, programId: PROGRAM_ID,
  });
  assert.equal(disconnected.response.status, 200);
  assert.equal(disconnected.body.existingEvidencePreserved, true);
  assert.equal(disconnected.body.storage.revision, 3);

  const history = await fixture.db.prepare(
    "SELECT action, revision FROM program_storage_history ORDER BY revision",
  ).all();
  assert.deepEqual(history.results.map((row) => ({ action: row.action, revision: row.revision })), [
    { action: "configured", revision: 1 },
    { action: "verified", revision: 2 },
    { action: "disconnected", revision: 3 },
  ]);
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
    GOOGLE_DRIVE_EVIDENCE_ROOT_ID: ROOT_FOLDER_ID,
  };
  await db.prepare("INSERT OR IGNORE INTO site_programs (site_id, program_id, active) VALUES (?, ?, 1)").bind(SITE_ID, PROGRAM_ID).run();
  await seedUser(db, { id: "teacher", roleId: "program_teacher", scopeType: "program", scopeId: PROGRAM_ID });
  await seedUser(db, { id: "site-admin", roleId: "site_admin", scopeType: "site", scopeId: SITE_ID });
  await seedUser(db, { id: "school-admin", roleId: "administration", scopeType: "site", scopeId: SITE_ID });
  await seedUser(db, { id: "mentor", roleId: "mentor", scopeType: "site", scopeId: SITE_ID });
  await seedUser(db, { id: "viewer", roleId: "viewer", scopeType: "site", scopeId: SITE_ID });
  await seedUser(db, { id: "student", roleId: "student", scopeType: "program", scopeId: PROGRAM_ID });
  for (const id of ["teacher", "site-admin", "school-admin", "mentor", "viewer", "student"]) {
    await db.prepare("INSERT INTO site_users (site_id, user_id, membership_status) VALUES (?, ?, 'active')").bind(SITE_ID, id).run();
  }
  return {
    env,
    db,
    tokens: {
      teacher: await seedSession(db, env, "teacher"),
      siteAdmin: await seedSession(db, env, "site-admin"),
      administration: await seedSession(db, env, "school-admin"),
      mentor: await seedSession(db, env, "mentor"),
      viewer: await seedSession(db, env, "viewer"),
      student: await seedSession(db, env, "student"),
    },
  };
}

async function getStorage(fixture, token, programId) {
  const response = await onRequestGet({
    request: buildRequest(`https://example.test/api/program-storage?siteId=${SITE_ID}&programId=${programId}`, token),
    env: fixture.env,
  });
  return { response, body: await response.json() };
}

async function changeStorage(fixture, token, body) {
  const response = await onRequestPost({
    request: buildRequest("https://example.test/api/program-storage", token, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: JSON.stringify(body),
    }),
    env: fixture.env,
  });
  return { response, body: await response.json() };
}

function openStorage(fixture, token) {
  return onRequestOpen({
    request: buildRequest(`https://example.test/api/program-storage/open?siteId=${SITE_ID}&programId=${PROGRAM_ID}`, token),
    env: fixture.env,
  });
}

async function withDriveProvider(callback, folderOverrides = {}) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    }
    if (url.includes(`/drive/v3/files/${FOLDER_ID}`)) {
      return new Response(JSON.stringify({ id: FOLDER_ID, name: "IT Senior Projects", mimeType: "application/vnd.google-apps.folder", driveId: "shared-drive-school", capabilities: { canAddChildren: true }, ...folderOverrides }), { status: 200 });
    }
    throw new Error(`Unexpected provider URL: ${url}`);
  };
  try { await callback(); } finally { globalThis.fetch = originalFetch; }
}
