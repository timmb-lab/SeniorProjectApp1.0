import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getViewerRoleContext,
  isAdmin,
  isLegacyAdmin,
  isPlatformAdmin,
} from "../functions/_lib/permissions.ts";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";
import { seedUser } from "./helpers/auth-fixtures.mjs";

const MIGRATION = "migrations/0011_multisite_site_role_foundation.sql";
const V5_MIGRATION = "migrations/0012_users_access_v5.sql";
const SITE_FOUNDATION_ROLES = ["platform_admin", "org_admin", "site_admin", "viewer"];
const V5_ROLES = ["global_admin", "administration"];
const NEW_ROLES = [...SITE_FOUNDATION_ROLES, ...V5_ROLES];
const OLD_ROLES = ["admin", "misc_admin", "student", "mentor", "program_teacher"];

test("multisite migration source adds site tables, indexes, target roles, and sandbox site", () => {
  const source = readFileSync(MIGRATION, "utf8");

  for (const table of ["sites", "site_users", "site_programs"]) {
    assert.match(source, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }
  for (const roleId of SITE_FOUNDATION_ROLES) {
    assert.match(source, new RegExp(`'${roleId}'`));
  }
  for (const indexName of [
    "idx_sites_tenant_status",
    "idx_site_users_user_status",
    "idx_site_programs_program_active",
  ]) {
    assert.match(source, new RegExp(`CREATE INDEX IF NOT EXISTS ${indexName}\\b`));
  }

  assert.match(source, /site-capstone-sandbox-main/);
  assert.match(source, /tenant-capstone-sandbox/);
  assert.match(source, /INSERT OR IGNORE INTO site_programs/);
});

test("RoleId and permission source recognize new roles while preserving legacy roles", () => {
  const types = readFileSync("functions/_types.ts", "utf8");
  for (const roleId of [...NEW_ROLES, ...OLD_ROLES]) {
    assert.match(types, new RegExp(`"${roleId}"`));
  }
  for (const interfaceName of ["Site", "SiteUser", "SiteProgram"]) {
    assert.match(types, new RegExp(`export interface ${interfaceName}\\b`));
  }

  const permissions = readFileSync("functions/_lib/permissions.ts", "utf8");
  assert.match(permissions, /export async function isLegacyAdmin/);
  assert.match(permissions, /export async function isPlatformAdmin/);
  assert.match(permissions, /GLOBAL_ADMIN_ROLE_IDS/);
  assert.match(permissions, /isLegacyAdmin\(env, userId\)/);

  const v5Migration = readFileSync(V5_MIGRATION, "utf8");
  for (const roleId of V5_ROLES) {
    assert.match(v5Migration, new RegExp(`'${roleId}'`));
  }
  assert.match(v5Migration, /viewer_student_assignments/);

  const effectiveAccess = readFileSync("functions/_lib/effective-access.ts", "utf8");
  const order = [
    "global_admin",
    "site_admin",
    "administration",
    "program_teacher",
    "mentor",
    "viewer",
    "student",
  ];
  const primaryRoleBlock = effectiveAccess.slice(effectiveAccess.indexOf("export const V5_ROLE_ORDER"));
  let lastIndex = -1;
  for (const roleId of order) {
    const index = primaryRoleBlock.indexOf(`"${roleId}"`, lastIndex + 1);
    assert.notEqual(index, -1, `${roleId} should appear in primary-role ordering`);
    assert.ok(index > lastIndex, `${roleId} should stay after prior role in primary-role ordering`);
    lastIndex = index;
  }
});

test("local migration proof creates two empty active test schools and clean foreign keys", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });

  const oldSite = await db.prepare(
    `SELECT id, tenant_id, name, slug, status, timezone, school_year
     FROM sites
     WHERE id = 'site-capstone-sandbox-main'`,
  ).first();
  assert.deepEqual({ ...oldSite }, {
    id: "site-capstone-sandbox-main",
    tenant_id: "tenant-capstone-sandbox",
    name: "Capstone Sandbox High School",
    slug: "capstone-sandbox-main",
    status: "archived",
    timezone: "America/Los_Angeles",
    school_year: "2026-2027",
  });

  const activeSites = await db.prepare(
    `SELECT id, tenant_id, name, slug, status, school_year
     FROM sites
     WHERE status = 'active'
     ORDER BY name`,
  ).all();
  assert.deepEqual(activeSites.results.map((row) => ({ ...row })), [
    {
      id: "site-east-career-technical-academy",
      tenant_id: "tenant-capstone-sandbox",
      name: "East Career & Technical Academy",
      slug: "east-career-technical-academy",
      status: "active",
      school_year: "2026-2027",
    },
    {
      id: "site-test-high-school",
      tenant_id: "tenant-capstone-sandbox",
      name: "Test High School",
      slug: "test-high-school",
      status: "active",
      school_year: "2026-2027",
    },
  ]);

  const emptySchoolCounts = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM site_programs WHERE site_id IN ('site-test-high-school', 'site-east-career-technical-academy') AND active = 1) AS site_programs,
       (SELECT COUNT(*) FROM site_users WHERE site_id IN ('site-test-high-school', 'site-east-career-technical-academy') AND membership_status = 'active') AS site_users`,
  ).first();
  assert.equal(Number(emptySchoolCounts.site_programs), 0);
  assert.equal(Number(emptySchoolCounts.site_users), 0);

  const roles = await db.prepare(
    `SELECT id
     FROM roles
     WHERE id IN (${[...NEW_ROLES, ...OLD_ROLES].map(() => "?").join(", ")})
     ORDER BY id`,
  ).bind(...NEW_ROLES, ...OLD_ROLES).all();
  assert.deepEqual(
    roles.results.map((row) => row.id).sort(),
    [...NEW_ROLES, ...OLD_ROLES].sort(),
  );

  const roleCounts = await db.prepare(
    "SELECT COUNT(*) AS total, COUNT(DISTINCT id) AS distinct_total FROM roles",
  ).first();
  assert.equal(Number(roleCounts.total), Number(roleCounts.distinct_total));

  const fk = await db.prepare("PRAGMA foreign_key_check;").all();
  assert.deepEqual(fk.results, []);
});

test("legacy admin remains platform-equivalent while admin-only checks stay legacy-admin only", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = { DB: db };

  await seedUser(db, { id: "legacy-admin", roleId: "admin" });
  await seedUser(db, { id: "platform-admin", roleId: "platform_admin" });
  await seedUser(db, { id: "site-admin", roleId: "site_admin" });
  await seedUser(db, { id: "misc-admin", roleId: "misc_admin" });

  assert.equal(await isLegacyAdmin(env, "legacy-admin"), true);
  assert.equal(await isPlatformAdmin(env, "legacy-admin"), true);
  assert.equal(await isAdmin(env, "legacy-admin"), true);

  assert.equal(await isPlatformAdmin(env, "platform-admin"), true);
  assert.equal(await isAdmin(env, "platform-admin"), false);
  assert.equal(await isPlatformAdmin(env, "site-admin"), false);
  assert.equal(await isPlatformAdmin(env, "misc-admin"), false);

  assert.equal((await getViewerRoleContext(env, { id: "legacy-admin" })).isPlatformAdmin, true);
  assert.equal((await getViewerRoleContext(env, { id: "platform-admin" })).primaryRole, "global_admin");
  assert.equal((await getViewerRoleContext(env, { id: "site-admin" })).primaryRole, "site_admin");
});

test("phase 2 source does not alter domain, OAuth, or Cloudflare project settings", () => {
  const wrangler = readFileSync("wrangler.jsonc", "utf8");
  const packageJson = readFileSync("package.json", "utf8");
  const migration = readFileSync(MIGRATION, "utf8");

  assert.match(wrangler, /"name": "senior-capstone-app"/);
  assert.match(packageJson, /--project-name=senior-capstone-app/);
  assert.doesNotMatch(migration, /GOOGLE_OAUTH|redirect_uri|redirect URI|project-name|custom hostname|Cloudflare Pages/i);
});
