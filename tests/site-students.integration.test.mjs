import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onSiteStudents } from "../functions/api/site/students.ts";
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
  "migrations/0015_remove_org_admin_role.sql",
];

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const NORTH_SITE_ID = "site-north-valley-tech";
const FORBIDDEN_RESPONSE_FIELDS = /drive_file_id|drive_parent_folder_id|storage_key|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key|PASSWORD_PEPPER|temporaryPassword|setupPassword/i;

test("site student directory is site-scoped, paginated, filterable, role-gated, and safe", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();

  {
    const { response, body } = await routeSiteStudents(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const primary = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(primary.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(primary.pagination.total, 250);
  assert.equal(primary.summary.studentsTotal, 250);
  assert.equal(primary.pagination.filteredTotal, 250);
  assert.equal(primary.summary.filteredTotal, 250);
  assert.equal(primary.pagination.limit, 50);
  assert.equal(primary.pagination.returned, primary.students.length);
  assert.equal(primary.students.length <= 50, true);
  assert.equal(primary.students.every((student) => student.siteId === PRIMARY_SITE_ID), true);
  assert.notEqual(primary.pagination.total, 370);

  const legacyPrimary = await expectDirectory(env, tokens.legacyAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(legacyPrimary.pagination.total, 250);
  assert.equal(legacyPrimary.scope.role, "global_admin");

  const orgPrimary = await expectDirectory(env, tokens.orgAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(orgPrimary.scope.role, "administration");
  assert.equal(orgPrimary.pagination.total, 250);
  const orgOutside = await routeSiteStudents(env, tokens.orgAdmin, "?siteId=site-outside-district");
  assert.equal(orgOutside.response.status, 403);
  assert.equal(orgOutside.body.reason, "site_not_accessible");

  const siteAdminPrimary = await expectDirectory(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdminPrimary.pagination.total, 250);
  const siteAdminInferred = await expectDirectory(env, tokens.siteAdminPrimary, "");
  assert.equal(siteAdminInferred.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(siteAdminInferred.scope.selectionMode, "single_accessible_site");
  const siteAdminDenied = await routeSiteStudents(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(siteAdminDenied.response.status, 403);
  assert.equal(siteAdminDenied.body.reason, "site_not_accessible");

  const viewer = await expectDirectory(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.scope.role, "viewer");
  assert.equal(viewer.scope.readOnly, true);
  assert.equal(viewer.pagination.total, 3);
  assert.equal(viewer.students.length, 3);
  assert.equal(viewer.permissions.canViewStudentDetail, true);
  assert.equal(viewer.permissions.canManageMentorAssignments, false);
  assert.equal(viewer.permissions.canManageUsers, false);
  assert.equal(viewer.permissions.canManageSecurity, false);

  const teacher = await expectDirectory(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(teacher.scope.role, "program_teacher");
  assert.equal(teacher.summary.studentsTotal, 45);
  assert.equal(teacher.summary.studentsTotal < primary.summary.studentsTotal, true);
  assert.equal(teacher.students.every((student) => student.siteId === PRIMARY_SITE_ID), true);
  assert.equal(teacher.students.every((student) => student.programId === "it"), true);
  assert.deepEqual(teacher.filterOptions.programs.map((program) => program.programId), ["it"]);
  assert.equal(teacher.scope.accessibleSites.length, 1);
  assert.equal(teacher.permissions.canManageMentorAssignments, true);

  for (const [label, token] of [
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc_admin", tokens.miscAdmin],
  ]) {
    const denied = await routeSiteStudents(env, token, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, `${label} should not view full site directory`);
    assert.equal(denied.body.error, "forbidden");
  }

  const invalidSite = await routeSiteStudents(env, tokens.platformAdmin, "?siteId=../../bad-site");
  assert.equal(invalidSite.response.status, 403);
  assert.equal(invalidSite.body.reason, "invalid_site_id");
  const missingSite = await routeSiteStudents(env, tokens.platformAdmin, "?siteId=site-does-not-exist");
  assert.equal(missingSite.response.status, 403);
  assert.equal(missingSite.body.reason, "site_not_accessible");

  const defaultSite = await expectDirectory(env, tokens.platformAdmin, "");
  assert.equal(defaultSite.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(defaultSite.scope.selectionMode, "demo_default_site");

  const limit100 = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&limit=100`);
  assert.equal(limit100.pagination.limit, 100);
  assert.equal(limit100.students.length <= 100, true);
  assert.equal(limit100.pagination.returned, limit100.students.length);

  const offset50 = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&offset=50`);
  assert.equal(offset50.pagination.offset, 50);
  assert.notEqual(offset50.students[0]?.studentId, primary.students[0]?.studentId);

  const canyon = await expectDirectory(env, tokens.platformAdmin, `?siteId=${CANYON_SITE_ID}`);
  const north = await expectDirectory(env, tokens.platformAdmin, `?siteId=${NORTH_SITE_ID}`);
  assert.equal(canyon.pagination.total, 60);
  assert.equal(north.pagination.total, 60);
  assert.equal(canyon.students.every((student) => student.siteId === CANYON_SITE_ID), true);
  assert.equal(north.students.every((student) => student.siteId === NORTH_SITE_ID), true);

  const missingMentor = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&story=missing_mentor&limit=100`);
  assert.equal(missingMentor.pagination.filteredTotal >= 10, true);
  assert.equal(missingMentor.students.every((student) => student.storyBucket === "missing_mentor"), true);
  assert.equal(missingMentor.students.every((student) => student.hasActiveMentor === false), true);

  const noMentor = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&noMentor=true&limit=100`);
  assert.equal(noMentor.pagination.filteredTotal >= 10, true);
  assert.equal(noMentor.students.every((student) => student.hasActiveMentor === false), true);

  const revisionSearch = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&search=${encodeURIComponent("Revision Loop Demo")}&limit=100`);
  assert.equal(revisionSearch.pagination.filteredTotal >= 10, true);
  assert.equal(revisionSearch.students.every((student) => /Revision Loop Demo/.test(student.displayName)), true);

  const revisionStatus = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&status=revision_requested&limit=100`);
  assert.equal(revisionStatus.pagination.filteredTotal > 0, true);
  assert.equal(revisionStatus.students.every((student) => student.latestSubmissionStatus === "revision_requested"), true);

  const mentorMeetingFollowUp = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&progressStatus=mentor_meeting_follow_up&limit=100`);
  assert.equal(mentorMeetingFollowUp.pagination.filteredTotal > 0, true);
  assert.equal(mentorMeetingFollowUp.students.every((student) => student.progressStatus === "mentor_meeting_follow_up"), true);
  assert.equal(mentorMeetingFollowUp.students.every((student) => ["missed", "makeup_required"].includes(student.mentorMeetingStatus)), true);

  const revisionStory = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&story=revision_requested&limit=100`);
  assert.equal(revisionStory.pagination.filteredTotal >= 10, true);
  assert.equal(revisionStory.students.every((student) => student.storyBucket === "revision_requested"), true);

  const archiveFailed = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&archiveStatus=failed&limit=100`);
  assert.equal(archiveFailed.pagination.filteredTotal >= 5, true);
  assert.equal(archiveFailed.students.every((student) => student.archiveStatus === "failed"), true);

  const archiveFailedStory = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&story=archive_failed&limit=100`);
  assert.equal(archiveFailedStory.pagination.filteredTotal >= 5, true);
  assert.equal(archiveFailedStory.students.every((student) => student.storyBucket === "archive_failed"), true);

  for (const story of ["model_excellent", "awaiting_review", "presentation_pending", "archive_ready", "high_risk", "rich_timeline"]) {
    const storyResult = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&story=${story}&limit=100`);
    assert.equal(storyResult.pagination.filteredTotal > 0, true, `${story} should match seeded story students`);
    assert.equal(storyResult.students.every((student) => student.storyBucket === story), true);
  }

  const combined = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&story=missing_mentor&noMentor=true&limit=100`);
  assert.equal(combined.students.every((student) => student.siteId === PRIMARY_SITE_ID), true);
  assert.equal(combined.students.every((student) => student.storyBucket === "missing_mentor"), true);

  const noMatches = await expectDirectory(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&search=NoSuchDemoStudentForDirectory`);
  assert.equal(noMatches.pagination.filteredTotal, 0);
  assert.equal(noMatches.pagination.returned, 0);
  assert.deepEqual(noMatches.students, []);
  assert.equal(noMatches.emptyState.reason.length > 0, true);

  assert.ok(primary.filterOptions.progressStatuses.includes("mentor_meeting_follow_up"));

  for (const body of [primary, legacyPrimary, orgPrimary, siteAdminPrimary, viewer, teacher, limit100, offset50, canyon, north, missingMentor, noMentor, revisionSearch, revisionStatus, mentorMeetingFollowUp, archiveFailed, noMatches]) {
    assert.doesNotMatch(JSON.stringify(body), FORBIDDEN_RESPONSE_FIELDS);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_student_directory_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_student_directory_denied"), true);
  assert.equal(audits.some((event) => event.action === "site_student_directory_unauthorized"), true);
  assert.doesNotMatch(JSON.stringify(audits), FORBIDDEN_RESPONSE_FIELDS);
  assert.doesNotMatch(JSON.stringify(audits), /Revision Loop Demo|NoSuchDemoStudentForDirectory/);
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
    id: "misc-directory-user",
    displayName: "Misc Directory User",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "readiness",
  });

  const tokens = {
    platformAdmin: await seedSession(db, env, "demo-platform-admin-001", "site-students-platform"),
    legacyAdmin: await seedSession(db, env, "protected-admin-primary", "site-students-legacy"),
    orgAdmin: await seedSession(db, env, "demo-administration-desert-valley-high", "site-students-org"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-students-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-students-viewer"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-students-teacher"),
    mentor: await seedSession(db, env, "demo-mentor-001", "site-students-mentor"),
    student: await seedSession(db, env, "demo-student-001", "site-students-student"),
    miscAdmin: await seedSession(db, env, "misc-directory-user", "site-students-misc"),
  };

  return { db, env, tokens };
}

async function expectDirectory(env, token, query) {
  const { response, body } = await routeSiteStudents(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site student directory success");
  assert.equal(body.ok, true);
  return body;
}

async function routeSiteStudents(env, token, query = "") {
  const response = await onSiteStudents({
    request: buildRequest(`https://local.capstone.test/api/site/students${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}
