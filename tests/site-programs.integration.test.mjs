import assert from "node:assert/strict";
import test from "node:test";

import {
  onRequestGet as onSiteProgramsGet,
  onRequestPost as onSiteProgramsPost,
} from "../functions/api/site/programs.ts";
import {
  DirectD1Adapter,
  runDemoSeed,
} from "../scripts/seed-local-demo-workspace.mjs";
import { buildRequest, readAuditActions, seedSession } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1 } from "./helpers/d1-sqlite.mjs";

const MIGRATIONS = [
  "migrations/0001_foundation.sql",
  "migrations/0002_framework_seed.sql",
  "migrations/0003_framework_seed_data.sql",
  "migrations/0004_mentor_meetings.sql",
  "migrations/0005_submission_versions.sql",
  "migrations/0006_presentation_slots.sql",
  "migrations/0007_archive_export_artifacts.sql",
  "migrations/0008_update_drive_resource_ids.sql",
  "migrations/0009_update_drive_shared_drive_root.sql",
  "migrations/0010_tenant_google_sso.sql",
  "migrations/0011_multisite_site_role_foundation.sql",
  "migrations/0012_users_access_v5.sql",
];

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const FORBIDDEN_RESPONSE_FIELDS = /adminNote|actorRoleScopes|temporaryPassword|password_hash|password_salt|drive_file_id|access_token|refresh_token/i;

test("site programs route stays scoped and supports add/remove site mappings", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();
  await db.prepare(
    "INSERT OR IGNORE INTO programs (id, name, active) VALUES ('biotech', 'Biotechnology', 1)",
  ).run();

  {
    const { response, body } = await routeProgramsGet(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const siteAdmin = await expectProgramsGet(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdmin.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(siteAdmin.permissions.canManageSitePrograms, true);
  assert.equal(siteAdmin.activePrograms.some((row) => row.programId === "it"), true);
  assert.equal(siteAdmin.availablePrograms.some((row) => row.programId === "biotech"), true);
  assert.equal(siteAdmin.availablePrograms.some((row) => row.previouslyRemoved === true), false);
  assert.doesNotMatch(JSON.stringify(siteAdmin), FORBIDDEN_RESPONSE_FIELDS);

  const globalAdmin = await expectProgramsGet(env, tokens.globalAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(globalAdmin.scope.siteId, CANYON_SITE_ID);

  const forbiddenSite = await routeProgramsGet(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(forbiddenSite.response.status, 403);
  assert.doesNotMatch(JSON.stringify(forbiddenSite.body), /Canyon Ridge Career/i);

  const viewer = await routeProgramsGet(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.response.status, 403);
  assert.equal(viewer.body.error, "forbidden");

  const remove = await routeProgramsPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    programId: "it",
    action: "remove",
    adminNote: "Close summer IT section setup",
  });
  assert.equal(remove.response.status, 200);
  assert.equal(remove.body.ok, true);
  const removedRow = await db.prepare(
    "SELECT active FROM site_programs WHERE site_id = ? AND program_id = ?",
  ).bind(PRIMARY_SITE_ID, "it").first();
  assert.equal(Number(removedRow.active), 0);

  const afterRemove = await expectProgramsGet(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  const removedProgram = afterRemove.availablePrograms.find((row) => row.programId === "it");
  assert.equal(Boolean(removedProgram), true);
  assert.equal(removedProgram.previouslyRemoved, true);

  const add = await routeProgramsPost(env, tokens.siteAdminPrimary, {
    siteId: PRIMARY_SITE_ID,
    programId: "biotech",
    action: "assign",
    adminNote: "Open biotech pilot for this school",
  });
  assert.equal(add.response.status, 200);
  assert.equal(add.body.ok, true);
  const addedRow = await db.prepare(
    "SELECT active FROM site_programs WHERE site_id = ? AND program_id = ?",
  ).bind(PRIMARY_SITE_ID, "biotech").first();
  assert.equal(Number(addedRow.active), 1);

  const blockedPost = await routeProgramsPost(env, tokens.viewerPrimary, {
    siteId: PRIMARY_SITE_ID,
    programId: "biotech",
    action: "remove",
    adminNote: "Viewer should not do this",
  });
  assert.equal(blockedPost.response.status, 403);

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_programs_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_program_removed"), true);
  assert.equal(audits.some((event) => event.action === "site_program_assigned"), true);
  assert.equal(
    audits.some((event) => event.action === "security.denied_access" && event.entity_type === "site_program_assignment"),
    true,
  );
});

async function createSeededDemoFixture() {
  const db = createSqliteD1({ migrations: MIGRATIONS });
  const env = {
    DB: db,
    SESSION_COOKIE_NAME: "sc_session",
    SESSION_PEPPER: "",
    AUTH_MODE: "hardened_username_password",
  };

  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES
       ('protected-admin-primary', 'bryan@learntechonline.com', 'bryan@learntechonline.com', 'Bryan Timm', 'active'),
       ('protected-admin-breakglass', 'bryan.timm89@gmail.com', 'bryan.timm89@gmail.com', 'Bryan Timm', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES
       ('protected-admin-primary', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0),
       ('protected-admin-breakglass', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0)`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES
       ('protected-admin-primary', 'admin', 'global', ''),
       ('protected-admin-breakglass', 'admin', 'global', '')`,
  ).run();

  await runDemoSeed({ target: "local", mode: "write", reset: true }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    writeCredentials: false,
  });

  const tokens = {
    globalAdminPrimary: await seedSession(db, env, "protected-admin-primary", "site-programs-global-admin"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-programs-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-programs-viewer"),
  };

  return { db, env, tokens };
}

async function expectProgramsGet(env, token, query = "") {
  const { response, body } = await routeProgramsGet(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site programs success");
  assert.equal(body.ok, true);
  return body;
}

async function routeProgramsGet(env, token, query = "") {
  const response = await onSiteProgramsGet({
    request: buildRequest(`https://local.capstone.test/api/site/programs${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

async function routeProgramsPost(env, token, body) {
  const response = await onSiteProgramsPost({
    request: buildRequest("https://local.capstone.test/api/site/programs", token, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
  });
  return { response, body: await response.json() };
}
