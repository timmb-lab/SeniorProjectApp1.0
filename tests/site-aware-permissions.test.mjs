import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  canAccessSite,
  canAccessStudent,
  canAccessTenant,
  canAddStaffNote,
  canDownloadStudentEvidence,
  canManageMentorAssignments,
  canManageOrganizations,
  canManageArchiveOperations,
  canManageSecurity,
  canManageSites,
  canManageTenantConfig,
  canManagePresentationOperations,
  canManageUsers,
  canMutateReviewDecision,
  canViewArchiveOperations,
  canViewAuditEvents,
  canViewMentorAssignments,
  canViewOrgDashboard,
  canViewPlatformAdmin,
  canViewPresentationOperations,
  canViewReadinessReports,
  canViewReviewQueue,
  canViewSiteDashboard,
  canViewSiteStudentDetail,
  canViewSiteStudentEvidence,
  canViewStudentDirectory,
  canViewStudentTimeline,
  getAccessibleSiteIds,
  getAccessibleTenantIds,
  getMentorAssignedStudentIds,
  getRoleScopeSummary,
  getSiteMemberships,
  getTenantMemberships,
  hasAnyRole,
  isAdmin,
  isLegacyAdmin,
  isMentor,
  isMiscAdmin,
  isOrgAdmin,
  isPlatformAdmin,
  isProgramTeacher,
  isSiteAdmin,
  isStudent,
  isViewer,
} from "../functions/_lib/permissions.ts";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";
import { seedUser } from "./helpers/auth-fixtures.mjs";

test("platform admin and legacy admin remain platform-capable while legacy admin route behavior is preserved", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isPlatformAdmin(env, users.platformAdmin.id), true);
  assert.equal(await isPlatformAdmin(env, users.legacyAdmin.id), true);
  assert.equal(await isLegacyAdmin(env, users.legacyAdmin.id), true);
  assert.equal(await isAdmin(env, users.legacyAdmin.id), true);
  assert.equal(await isAdmin(env, users.platformAdmin.id), false);

  for (const user of [users.platformAdmin, users.legacyAdmin]) {
    assert.equal(await canViewPlatformAdmin(env, user), true);
    assert.equal(await canManageOrganizations(env, user), true);
    assert.equal(await canManageSecurity(env, user), true);
    assert.equal(await canManageUsers(env, user), true);
    assert.equal(await canManageTenantConfig(env, user, "tenant-a"), true);
    assert.equal(await canAccessTenant(env, user, "tenant-a"), true);
    assert.equal(await canAccessSite(env, user, "site-a1"), true);
    assert.equal(await canViewSiteStudentDetail(env, user, "student-a1", "site-a1"), true);
    assert.equal(await canMutateReviewDecision(env, user, "submission-a1"), true);
  }

  assert.deepEqual(await getAccessibleTenantIds(env, users.platformAdmin), ["tenant-a", "tenant-b", "tenant-capstone-sandbox"]);
  assert.equal(await canAccessTenant(env, users.platformAdmin, "missing-tenant"), false);
  assert.equal(await canAccessSite(env, users.platformAdmin, "missing-site"), false);
});

test("org admin gets assigned tenant and site visibility without platform security powers", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isOrgAdmin(env, users.orgAdminA.id), true);
  assert.equal(await isPlatformAdmin(env, users.orgAdminA.id), false);
  assert.deepEqual((await getTenantMemberships(env, users.orgAdminA.id)).map((row) => ({ ...row })), [
    { tenant_id: "tenant-a", user_id: users.orgAdminA.id, membership_status: "active" },
  ]);
  assert.deepEqual(await getAccessibleTenantIds(env, users.orgAdminA), ["tenant-a"]);
  assert.deepEqual(await getAccessibleSiteIds(env, users.orgAdminA), ["site-a1", "site-a2"]);

  assert.equal(await canAccessTenant(env, users.orgAdminA, "tenant-a"), true);
  assert.equal(await canAccessTenant(env, users.orgAdminA, "tenant-b"), false);
  assert.equal(await canViewOrgDashboard(env, users.orgAdminA, "tenant-a"), true);
  assert.equal(await canViewSiteDashboard(env, users.orgAdminA, "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.orgAdminA, "student-a1", "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.orgAdminA, "student-b1", "site-b1"), false);
  assert.equal(await canManageSites(env, users.orgAdminA, "tenant-a"), true);
  assert.equal(await canManageSites(env, users.orgAdminA, "tenant-b"), false);
  assert.equal(await canManageSecurity(env, users.orgAdminA), false);
  assert.equal(await canManageUsers(env, users.orgAdminA), false);
  assert.equal(await canViewPlatformAdmin(env, users.orgAdminA), false);
});

test("site admin gets assigned site operations without becoming platform or user security admin", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isSiteAdmin(env, users.siteAdminA1.id), true);
  assert.equal(await isPlatformAdmin(env, users.siteAdminA1.id), false);
  assert.deepEqual((await getSiteMemberships(env, users.siteAdminA1.id)).map((row) => ({ ...row })), [
    { site_id: "site-a1", user_id: users.siteAdminA1.id, membership_status: "active" },
  ]);
  assert.deepEqual(await getAccessibleSiteIds(env, users.siteAdminA1), ["site-a1"]);

  assert.equal(await canAccessSite(env, users.siteAdminA1, "site-a1"), true);
  assert.equal(await canAccessSite(env, users.siteAdminA1, "site-a2"), false);
  assert.equal(await canViewSiteDashboard(env, users.siteAdminA1, "site-a1"), true);
  assert.equal(await canViewStudentDirectory(env, users.siteAdminA1, "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.siteAdminA1, "student-a1", "site-a1"), true);
  assert.equal(await canViewStudentTimeline(env, users.siteAdminA1, "student-a1", "site-a1"), true);
  assert.equal(await canViewSiteStudentEvidence(env, users.siteAdminA1, "student-a1", "site-a1"), true);
  assert.equal(await canDownloadStudentEvidence(env, users.siteAdminA1, "student-a1", "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.siteAdminA1, "student-a2", "site-a2"), false);
  assert.equal(await canManageMentorAssignments(env, users.siteAdminA1, "site-a1"), true);
  assert.equal(await canAddStaffNote(env, users.siteAdminA1, "student-a1", "site-a1"), true);
  assert.equal(await canManageUsers(env, users.siteAdminA1), false);
  assert.equal(await canManageSecurity(env, users.siteAdminA1), false);
  assert.equal(await canManageTenantConfig(env, users.siteAdminA1, "tenant-a"), false);
});

test("viewer has assigned-site read-only capabilities and no mutation or security powers", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isViewer(env, users.viewerA1.id), true);
  assert.equal(await canAccessSite(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canAccessSite(env, users.viewerA1, "site-b1"), false);
  assert.equal(await canViewSiteDashboard(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canViewStudentDirectory(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.viewerA1, "student-a1", "site-a1"), true);
  assert.equal(await canViewReviewQueue(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canViewMentorAssignments(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canViewPresentationOperations(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canViewArchiveOperations(env, users.viewerA1, "site-a1"), true);
  assert.equal(await canViewReadinessReports(env, users.viewerA1, "site-a1"), true);

  assert.equal(await canMutateReviewDecision(env, users.viewerA1, "submission-a1"), false);
  assert.equal(await canAddStaffNote(env, users.viewerA1, "student-a1", "site-a1"), false);
  assert.equal(await canManageMentorAssignments(env, users.viewerA1, "site-a1"), false);
  assert.equal(await canManagePresentationOperations(env, users.viewerA1, "site-a1"), false);
  assert.equal(await canManageArchiveOperations(env, users.viewerA1, "site-a1"), false);
  assert.equal(await canManageUsers(env, users.viewerA1), false);
  assert.equal(await canManageSecurity(env, users.viewerA1), false);
  assert.equal(await canViewAuditEvents(env, users.viewerA1, "site-a1"), false);
});

test("program teacher remains program scoped and cannot manage users or security", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isProgramTeacher(env, users.teacherIt.id), true);
  assert.equal(await canAccessStudent(env, users.teacherIt, "student-a1"), true);
  assert.equal(await canAccessStudent(env, users.teacherIt, "student-b1"), false);
  assert.equal(await canAccessSite(env, users.teacherIt, "site-a1"), true);
  assert.equal(await canAccessSite(env, users.teacherIt, "site-b1"), false);
  assert.equal(await canViewStudentDirectory(env, users.teacherIt, "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.teacherIt, "student-a1", "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.teacherIt, "student-b1", "site-b1"), false);
  assert.equal(await canViewReviewQueue(env, users.teacherIt, "site-a1"), true);
  assert.equal(await canMutateReviewDecision(env, users.teacherIt, "submission-a1"), true);
  assert.equal(await canMutateReviewDecision(env, users.teacherIt, "submission-b1"), false);
  assert.equal(await canManageUsers(env, users.teacherIt), false);
  assert.equal(await canManageSecurity(env, users.teacherIt), false);
  assert.equal(await canManageMentorAssignments(env, users.teacherIt, "site-a1"), false);

  assert.equal(await canViewStudentDirectory(env, users.teacherEmpty, "site-a1"), false);
  assert.equal(await canMutateReviewDecision(env, users.teacherEmpty, "submission-a1"), false);
});

test("mentor can access assigned students only and never mutates reviews or full directories", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isMentor(env, users.mentorA1.id), true);
  assert.deepEqual(await getMentorAssignedStudentIds(env, users.mentorA1), ["student-a1"]);
  assert.equal(await canAccessStudent(env, users.mentorA1, "student-a1"), true);
  assert.equal(await canAccessStudent(env, users.mentorA1, "student-a2"), false);
  assert.equal(await canAccessSite(env, users.mentorA1, "site-a1"), true);
  assert.equal(await canViewSiteStudentDetail(env, users.mentorA1, "student-a1", "site-a1"), true);
  assert.equal(await canViewStudentDirectory(env, users.mentorA1, "site-a1"), false);
  assert.equal(await canMutateReviewDecision(env, users.mentorA1, "submission-a1"), false);
  assert.equal(await canManageUsers(env, users.mentorA1), false);
  assert.equal(await canManageSecurity(env, users.mentorA1), false);
});

test("student self access remains self-only and does not grant site admin capabilities", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isStudent(env, users.studentA1.id), true);
  assert.equal(await canAccessStudent(env, users.studentA1, "student-a1"), true);
  assert.equal(await canAccessStudent(env, users.studentA1, "student-a2"), false);
  assert.equal(await canViewSiteStudentDetail(env, users.studentA1, "student-a1", "site-a1"), true);
  assert.equal(await canViewSiteDashboard(env, users.studentA1, "site-a1"), false);
  assert.equal(await canViewStudentDirectory(env, users.studentA1, "site-a1"), false);
  assert.equal(await canManageMentorAssignments(env, users.studentA1, "site-a1"), false);
  assert.equal(await canManageUsers(env, users.studentA1), false);
  assert.equal(await canManageSecurity(env, users.studentA1), false);
});

test("misc admin remains narrow and default-deny rules reject bad scopes and unknown roles", async () => {
  const { env, users } = await createSitePermissionFixture();

  assert.equal(await isMiscAdmin(env, users.miscAdmin.id), true);
  assert.equal(await isSiteAdmin(env, users.miscAdmin.id), false);
  assert.equal(await isPlatformAdmin(env, users.miscAdmin.id), false);
  assert.equal(await canViewReadinessReports(env, users.miscAdmin), true);
  assert.equal(await canViewSiteStudentDetail(env, users.miscAdmin, "student-a1", "site-a1"), false);
  assert.equal(await canViewSiteDashboard(env, users.miscAdmin, "site-a1"), false);
  assert.equal(await canManageUsers(env, users.miscAdmin), false);

  assert.equal(await hasAnyRole(env, users.rolePending.id, ["student", "viewer"]), false);
  assert.equal(await canViewSiteDashboard(env, users.rolePending, "site-a1"), false);
  assert.equal(await canViewSiteDashboard(env, users.unknownRole, "site-a1"), false);
  assert.equal(await canAccessTenant(env, users.platformAdmin, ""), false);
  assert.equal(await canAccessSite(env, users.platformAdmin, ""), false);
  assert.equal(await canAccessTenant(env, users.orgAdminInvalid, "missing-tenant"), false);
  assert.equal(await canViewSiteDashboard(env, users.siteAdminNoSite, "site-a1"), false);
  assert.equal(await canViewStudentDirectory(env, users.teacherEmpty, "site-a1"), false);

  const scopeSummary = await getRoleScopeSummary(env, users.siteAdminA1);
  assert.deepEqual(scopeSummary.siteIds, ["site-a1"]);
  assert.deepEqual(scopeSummary.tenantIds, ["tenant-a"]);
  assert.deepEqual(scopeSummary.mentorAssignedStudentIds, []);
});

test("site-aware permission source does not change domain, OAuth, Cloudflare, or secret handling", () => {
  const permissions = readFileSync("functions/_lib/permissions.ts", "utf8");
  const wrangler = readFileSync("wrangler.jsonc", "utf8");

  for (const helperName of [
    "canViewSiteDashboard",
    "canViewStudentDirectory",
    "canMutateReviewDecision",
    "canManageSecurity",
    "canManageTenantConfig",
  ]) {
    assert.match(permissions, new RegExp(`export async function ${helperName}\\b`));
  }

  assert.doesNotMatch(permissions, /drive_file_id|drive_parent_folder_id|password_hash|password_salt|token_hash|GOOGLE_OAUTH|CLOUDFLARE_API_TOKEN/);
  assert.match(wrangler, /"name": "senior-capstone-app"/);
});

async function createSitePermissionFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = { DB: db };

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, subscription_status, storage_mode)
     VALUES
       ('tenant-a', 'Tenant A', 'tenant-a', 'active', 'trial', 'app_managed_google_drive'),
       ('tenant-b', 'Tenant B', 'tenant-b', 'active', 'trial', 'app_managed_google_drive')`,
  ).run();

  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, status)
     VALUES
       ('site-a1', 'tenant-a', 'Site A1', 'site-a1', 'active'),
       ('site-a2', 'tenant-a', 'Site A2', 'site-a2', 'active'),
       ('site-b1', 'tenant-b', 'Site B1', 'site-b1', 'active')`,
  ).run();

  await db.prepare(
    `INSERT INTO site_programs (site_id, program_id, active)
     VALUES
       ('site-a1', 'it', 1),
       ('site-b1', 'culinary', 1)`,
  ).run();

  await seedUser(db, { id: "platform-admin-user", roleId: "platform_admin" });
  await seedUser(db, { id: "legacy-admin-user", roleId: "admin" });
  await seedUser(db, { id: "org-admin-a", roleId: "org_admin", scopeType: "tenant", scopeId: "tenant-a" });
  await seedUser(db, { id: "org-admin-invalid", roleId: "org_admin", scopeType: "tenant", scopeId: "" });
  await seedUser(db, { id: "site-admin-a1", roleId: "site_admin" });
  await seedUser(db, { id: "site-admin-no-site", roleId: "site_admin" });
  await seedUser(db, { id: "viewer-a1", roleId: "viewer" });
  await seedUser(db, { id: "teacher-it-a1", roleId: "program_teacher", scopeType: "program", scopeId: "it" });
  await seedUser(db, { id: "teacher-empty", roleId: "program_teacher", scopeType: "program", scopeId: "" });
  await seedUser(db, { id: "mentor-a1", roleId: "mentor" });
  await seedUser(db, { id: "student-a1", roleId: "student" });
  await seedUser(db, { id: "student-a2", roleId: "student" });
  await seedUser(db, { id: "student-b1", roleId: "student" });
  await seedUser(db, { id: "misc-admin", roleId: "misc_admin", scopeType: "reporting", scopeId: "readiness" });
  await seedUser(db, { id: "role-pending" });
  await seedUser(db, { id: "unknown-role" });
  await db.prepare("INSERT INTO roles (id, label, description) VALUES ('unexpected_role', 'Unexpected Role', 'Unknown role fixture')").run();
  await db.prepare("INSERT INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES ('unknown-role', 'unexpected_role', 'global', '')").run();

  await db.prepare("INSERT INTO tenant_users (tenant_id, user_id) VALUES ('tenant-a', 'org-admin-a')").run();
  await db.prepare(
    `INSERT INTO site_users (site_id, user_id)
     VALUES
       ('site-a1', 'site-admin-a1'),
       ('site-a1', 'viewer-a1'),
       ('site-a1', 'student-a1'),
       ('site-a2', 'student-a2'),
       ('site-b1', 'student-b1')`,
  ).run();

  await db.prepare("INSERT OR IGNORE INTO cohorts (id, label, school_year) VALUES ('cohort-a', '2026 A', '2026-2027')").run();
  await db.prepare("INSERT OR IGNORE INTO groups (id, name, group_type, program_id, cohort_id) VALUES ('group-it-a1', 'IT A1', 'program', 'it', 'cohort-a')").run();
  await db.prepare("INSERT OR IGNORE INTO groups (id, name, group_type, program_id, cohort_id) VALUES ('group-culinary-b1', 'Culinary B1', 'program', 'culinary', 'cohort-a')").run();
  await db.prepare(
    `INSERT INTO group_memberships (group_id, user_id)
     VALUES
       ('group-it-a1', 'student-a1'),
       ('group-culinary-b1', 'student-b1')`,
  ).run();

  await db.prepare("INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, active) VALUES ('assign-a1', 'mentor-a1', 'student-a1', 1)").run();
  await db.prepare("INSERT OR IGNORE INTO requirements (id, phase, title) VALUES ('req-proposal', 'proposal', 'Core Proposal')").run();
  await db.prepare(
    `INSERT INTO submissions (id, student_id, requirement_id, status)
     VALUES
       ('submission-a1', 'student-a1', 'req-proposal', 'submitted'),
       ('submission-b1', 'student-b1', 'req-proposal', 'submitted')`,
  ).run();

  const users = Object.fromEntries([
    "platformAdmin",
    "legacyAdmin",
    "orgAdminA",
    "orgAdminInvalid",
    "siteAdminA1",
    "siteAdminNoSite",
    "viewerA1",
    "teacherIt",
    "teacherEmpty",
    "mentorA1",
    "studentA1",
    "studentA2",
    "studentB1",
    "miscAdmin",
    "rolePending",
    "unknownRole",
  ].map((key) => [key, buildUser(idForKey(key))]));

  return { env, db, users };
}

function idForKey(key) {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/^-/, "")
    .replace("platform-admin", "platform-admin-user")
    .replace("legacy-admin", "legacy-admin-user")
    .replace("org-admin-a", "org-admin-a")
    .replace("org-admin-invalid", "org-admin-invalid")
    .replace("site-admin-a1", "site-admin-a1")
    .replace("site-admin-no-site", "site-admin-no-site")
    .replace("viewer-a1", "viewer-a1")
    .replace("teacher-it", "teacher-it-a1")
    .replace("teacher-empty", "teacher-empty")
    .replace("mentor-a1", "mentor-a1")
    .replace("student-a1", "student-a1")
    .replace("student-a2", "student-a2")
    .replace("student-b1", "student-b1")
    .replace("misc-admin", "misc-admin")
    .replace("role-pending", "role-pending")
    .replace("unknown-role", "unknown-role");
}

function buildUser(id) {
  return {
    id,
    email: `${id}@capstone.test`,
    email_norm: `${id}@capstone.test`,
    display_name: id,
    status: "active",
  };
}
