import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onSiteDashboard } from "../functions/api/site/dashboard.ts";
import {
  DirectD1Adapter,
  runDemoSeed,
} from "../scripts/seed-local-demo-workspace.mjs";
import { buildRequest, readAuditActions, seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
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
const NORTH_SITE_ID = "site-north-valley-tech";
const FORBIDDEN_RESPONSE_FIELDS = /drive_file_id|drive_parent_folder_id|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key|PASSWORD_PEPPER|temporaryPassword|setupPassword/i;

test("site dashboard route is site-scoped, role-gated, audited, and safe", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();

  {
    const { response, body } = await routeSiteDashboard(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const platformPrimary = await expectDashboard(env, tokens.platformAdmin, PRIMARY_SITE_ID);
  assert.equal(platformPrimary.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(platformPrimary.scope.tenantId, "tenant-desert-valley");
  assert.equal(platformPrimary.scope.siteName, "Desert Valley High School");
  assertDemoSitesVisible(platformPrimary);
  assert.equal(platformPrimary.summary.studentsTotal, 250);
  assert.equal(platformPrimary.summary.studentsActive, 250);
  assert.notEqual(platformPrimary.summary.studentsTotal, 370);
  assert.equal(platformPrimary.permissions.canManageUsers, true);

  const legacyPrimary = await expectDashboard(env, tokens.legacyAdmin, PRIMARY_SITE_ID);
  assert.equal(legacyPrimary.summary.studentsTotal, 250);
  assert.equal(legacyPrimary.scope.role, "global_admin");

  const orgPrimary = await expectDashboard(env, tokens.orgAdmin, PRIMARY_SITE_ID);
  assert.equal(orgPrimary.scope.role, "administration");
  assert.equal(orgPrimary.summary.studentsTotal, 250);
  assert.equal(orgPrimary.scope.accessibleSites.length, 1);
  const orgOutside = await routeSiteDashboard(env, tokens.orgAdmin, "?siteId=site-outside-district");
  assert.equal(orgOutside.response.status, 403);
  assert.equal(orgOutside.body.reason, "site_not_accessible");

  const siteAdminPrimary = await expectDashboard(env, tokens.siteAdminPrimary, PRIMARY_SITE_ID);
  assert.equal(siteAdminPrimary.scope.role, "site_admin");
  assert.equal(siteAdminPrimary.scope.selectionMode, "requested");
  assert.equal(siteAdminPrimary.summary.studentsTotal, 250);

  const siteAdminInferred = await expectDashboard(env, tokens.siteAdminPrimary, "");
  assert.equal(siteAdminInferred.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(siteAdminInferred.scope.selectionMode, "single_accessible_site");

  const siteAdminDenied = await routeSiteDashboard(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(siteAdminDenied.response.status, 403);
  assert.equal(siteAdminDenied.body.reason, "site_not_accessible");

  const viewerPrimary = await routeSiteDashboard(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewerPrimary.response.status, 403);
  assert.equal(viewerPrimary.body.error, "forbidden");

  for (const [label, token] of [
    ["program_teacher", tokens.programTeacher],
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc_admin", tokens.miscAdmin],
  ]) {
    const denied = await routeSiteDashboard(env, token, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, `${label} should not view site dashboard`);
    assert.equal(denied.body.error, "forbidden");
  }

  const invalidSite = await routeSiteDashboard(env, tokens.platformAdmin, "?siteId=../../bad-site");
  assert.equal(invalidSite.response.status, 403);
  assert.equal(invalidSite.body.reason, "invalid_site_id");

  const missingSite = await routeSiteDashboard(env, tokens.platformAdmin, "?siteId=site-does-not-exist");
  assert.equal(missingSite.response.status, 403);
  assert.equal(missingSite.body.reason, "site_not_accessible");

  const platformDefault = await expectDashboard(env, tokens.platformAdmin, "");
  assert.equal(platformDefault.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(platformDefault.scope.selectionMode, "demo_default_site");
  assertDemoSitesVisible(platformDefault);

  const canyon = await expectDashboard(env, tokens.platformAdmin, CANYON_SITE_ID);
  const north = await expectDashboard(env, tokens.platformAdmin, NORTH_SITE_ID);
  assert.equal(canyon.summary.studentsTotal, 60);
  assert.equal(north.summary.studentsTotal, 60);
  assert.equal(canyon.summary.studentsActive, 60);
  assert.equal(north.summary.studentsActive, 60);
  assert.equal(platformPrimary.summary.studentsTotal + canyon.summary.studentsTotal + north.summary.studentsTotal, 370);
  assert.equal(canyon.topRiskStudents.every((row) => row.studentId.startsWith("demo-student-")), true);
  assert.equal(north.programBreakdown.reduce((sum, row) => sum + row.studentCount, 0), 60);

  for (const body of [platformPrimary, legacyPrimary, orgPrimary, siteAdminPrimary, canyon, north]) {
    assert.equal(Array.isArray(body.programBreakdown), true);
    assert.equal(Array.isArray(body.statusBreakdown), true);
    assert.equal(Array.isArray(body.needsAttention), true);
    assert.equal(Array.isArray(body.topRiskStudents), true);
    assert.equal(Array.isArray(body.mentorCoverage), true);
    assert.equal(Array.isArray(body.recentActivity), true);
    assert.equal(Array.isArray(body.presentationSnapshot), true);
    assert.equal(Array.isArray(body.archiveSnapshot), true);
    assert.equal(Array.isArray(body.nextActions), true);
    assert.equal(body.summary.studentsNoMentor <= body.summary.studentsTotal, true);
    assert.equal(body.summary.mentorAssignmentsActive <= body.summary.studentsTotal, true);
    assert.doesNotMatch(JSON.stringify(body), FORBIDDEN_RESPONSE_FIELDS);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_dashboard_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_dashboard_denied"), true);
  assert.equal(audits.some((event) => event.action === "site_dashboard_unauthorized"), true);
  const viewed = audits.find((event) => event.action === "site_dashboard_viewed");
  assert.equal(viewed.entity_type, "site_dashboard");
  assert.equal(viewed.entity_id, PRIMARY_SITE_ID);
  assert.equal(viewed.metadata.summary.studentsActive, 250);
  assert.doesNotMatch(JSON.stringify(audits), FORBIDDEN_RESPONSE_FIELDS);

  assert.ok(platformPrimary.recentActivity.length > 0);
  assert.ok(platformPrimary.recentActivity.length <= 8);
  assert.ok(platformPrimary.recentActivity.every((row) => row.studentId && row.studentName && row.type && row.title && row.occurredAt));
  assert.ok(platformPrimary.recentActivity.every((row) => ["submission", "evidence", "review"].includes(row.type)));
  assert.ok(platformPrimary.recentActivity.every((row) => !String(row.title).includes("drive_file_id")));
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

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, subscription_status, storage_mode)
     VALUES ('tenant-outside-district', 'Outside District', 'outside-district', 'active', 'trial', 'app_managed_google_drive')`,
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, school_year, status)
     VALUES ('site-outside-district', 'tenant-outside-district', 'Outside High School', 'outside-high-school', '2025-2026', 'active')`,
  ).run();
  await seedUser(db, {
    id: "misc-dashboard-user",
    displayName: "Misc Dashboard User",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "readiness",
  });

  const tokens = {
    platformAdmin: await seedSession(db, env, "demo-platform-admin-001", "site-dashboard-platform"),
    legacyAdmin: await seedSession(db, env, "protected-admin-primary", "site-dashboard-legacy"),
    orgAdmin: await seedSession(db, env, "demo-administration-desert-valley-high", "site-dashboard-org"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-dashboard-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-dashboard-viewer"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-dashboard-teacher"),
    mentor: await seedSession(db, env, "demo-mentor-001", "site-dashboard-mentor"),
    student: await seedSession(db, env, "demo-student-001", "site-dashboard-student"),
    miscAdmin: await seedSession(db, env, "misc-dashboard-user", "site-dashboard-misc"),
  };

  return { db, env, tokens };
}

async function expectDashboard(env, token, siteIdOrQuery) {
  const query = siteIdOrQuery.startsWith("?")
    ? siteIdOrQuery
    : siteIdOrQuery
      ? `?siteId=${siteIdOrQuery}`
      : "";
  const { response, body } = await routeSiteDashboard(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site dashboard success");
  assert.equal(body.ok, true);
  return body;
}

async function routeSiteDashboard(env, token, query = "") {
  const response = await onSiteDashboard({
    request: buildRequest(`https://local.capstone.test/api/site/dashboard${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

function assertDemoSitesVisible(body) {
  const siteIds = new Set(body.scope.accessibleSites.map((site) => site.siteId));
  assert.equal(siteIds.has(PRIMARY_SITE_ID), true);
  assert.equal(siteIds.has(CANYON_SITE_ID), true);
  assert.equal(siteIds.has(NORTH_SITE_ID), true);
}
