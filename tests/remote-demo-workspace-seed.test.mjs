import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { DirectD1Adapter } from "../scripts/seed-local-demo-workspace.mjs";
import { parseArgs, runRemoteDemoSeed } from "../scripts/seed-remote-demo-workspace.mjs";
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
];

test("remote demo seeder requires remote target and explicit write confirmation", () => {
  assert.throws(
    () => parseArgs(["--local", "--dry-run"]),
    /remote/i,
  );
  assert.throws(
    () => parseArgs(["--remote", "--write"]),
    /SEED_REMOTE_DEMO/,
  );
  assert.deepEqual(parseArgs(["--remote", "--dry-run"]).mode, "dryrun");
  assert.deepEqual(parseArgs(["--remote", "--write", "--confirm", "SEED_REMOTE_DEMO"]).mode, "write");
});

test("remote demo dry run builds remote-shaped fake data without writing", async () => {
  const db = await createRemoteDemoDb();
  const result = await runRemoteDemoSeed({ target: "remote", mode: "dryrun", reset: false }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    writeCredentials: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.generatedCounts.userAccounts, 308);
  assert.equal(result.generatedCounts.passwordCredentials, 58);
  assert.equal(result.generatedCounts.mentorAssignments, 225);
  assert.equal(result.generatedCounts.submissions, 230);
  assert.equal(result.generatedCounts.evidenceArtifacts, 606);
  assert.equal(result.generatedCounts.comments, 243);
  assert.equal(result.generatedCounts.reviews, 176);
  assert.equal(result.generatedCounts.mentorMeetings, 200);
  assert.equal("announcements" in result.generatedCounts, false);
  assert.equal(result.remoteSafety.fakeDomainsOnly, true);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test'"), 0);
});

test("remote demo seed creates requested counts and preserves real accounts/config", async () => {
  const db = await createRemoteDemoDb();
  await db.prepare(
    `INSERT INTO announcements (id, title, body, audience_scope, audience_id, created_by)
     VALUES ('demo-announcement-stale', 'DEMO_SEED: stale announcement', 'DEMO_SEED: stale announcement body', 'all', NULL, 'bryan-prod-admin')`,
  ).run();
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "capstone-remote-demo-seed-"));
  const result = await runRemoteDemoSeed({ target: "remote", mode: "write", reset: true, confirm: "SEED_REMOTE_DEMO" }, {
    adapter: new DirectD1Adapter(db),
    verifyRepo: false,
    repoRoot,
    assertIgnored: () => {},
    now: new Date("2026-05-22T20:00:00.000Z"),
    provisionStaffWithHostedApp: false,
  });

  assert.equal(result.finalVerification.demoStudents, 250);
  assert.equal(result.finalVerification.demoProgramTeachers, 9);
  assert.equal(result.finalVerification.demoMentors, 48);
  assert.equal(result.finalVerification.demoAdmins, 1);
  assert.equal(result.finalVerification.mentorAssignments, 225);
  assert.equal(result.finalVerification.studentsWithMentors, 225);
  assert.equal(result.finalVerification.studentsWithoutMentors, 25);
  assert.equal(result.finalVerification.unsafeDemoEvidenceRows, 0);
  assert.equal(result.finalVerification.unsafeDemoExportDriveRows, 0);
  assert.equal(result.finalVerification.forbiddenDemoRealDomainRows, 0);
  assert.equal("announcements" in result.finalVerification, false);
  assert.equal(result.finalVerification.foreignKeyViolations, 0);
  assert.equal(result.protectedStateBefore.realUsersPreservedBaseline, result.protectedStateAfter.realUsersPreservedBaseline);
  assert.equal(result.protectedStateBefore.knownRealDomainUsersBaseline, result.protectedStateAfter.knownRealDomainUsersBaseline);

  assert.deepEqual(result.finalVerification.programDistribution, {
    Construction: 25,
    Culinary: 35,
    "Early Childhood Education": 20,
    "Hospitality & Marketing": 25,
    IT: 45,
    "Mechanical Technology": 25,
    "Medical Professions": 20,
    "Sports Medicine": 35,
    "Teaching & Training": 20,
  });

  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm = 'bryan@thecapstoneapp.com'"), 1);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm = 'timmb@nv.ccsd.net'"), 1);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM tenant_domains WHERE domain = 'nv.ccsd.net'"), 1);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND (drive_file_id IS NOT NULL OR drive_parent_folder_id IS NOT NULL)"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND external_url NOT LIKE 'https://example.com/capstone-demo/%'"), 0);
  assert.equal(await count(db, "SELECT COUNT(*) AS count FROM announcements WHERE id LIKE 'demo-%' OR title LIKE '%DEMO_SEED%' OR body LIKE '%DEMO_SEED%'"), 0);

  assert.match(result.credentialPath, /^\.secrets\/demo-remote-staff-logins-/);
  const credentialPayload = JSON.parse(readFileSync(path.join(repoRoot, result.credentialPath), "utf8"));
  assert.equal(credentialPayload.adminLogins.length, 1);
  assert.equal(credentialPayload.programTeacherLogins.length, 9);
  assert.equal(credentialPayload.mentorLogins.length, 48);
  assert.equal(credentialPayload.sampleStudentLogins.length, 0);
  assert.equal(credentialPayload.studentCredentialsCreated, false);
  assert.doesNotMatch(JSON.stringify(result), /DemoRemote!/);
});

async function createRemoteDemoDb() {
  const db = createSqliteD1({ migrations: MIGRATIONS });
  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES
       ('bryan-prod-admin', 'bryan@thecapstoneapp.com', 'bryan@thecapstoneapp.com', 'Bryan Timm', 'active'),
       ('bryan-breakglass', 'bryan.timm89@gmail.com', 'bryan.timm89@gmail.com', 'Bryan Timm', 'active'),
       ('real-program-teacher', 'timmb@nv.ccsd.net', 'timmb@nv.ccsd.net', 'Bryan Timm', 'active')`,
  ).run();
  await db.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES
       ('bryan-prod-admin', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0),
       ('bryan-breakglass', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 0),
       ('real-program-teacher', 'hash', 'salt', 'PBKDF2-SHA-256', 100000, 1)`,
  ).run();
  await db.prepare(
    `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
     VALUES
       ('bryan-prod-admin', 'admin', 'global', ''),
       ('bryan-breakglass', 'admin', 'global', ''),
       ('real-program-teacher', 'program_teacher', 'program', 'it')`,
  ).run();
  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, subscription_status, storage_mode)
     VALUES ('tenant-east-tech', 'East Tech', 'east-tech', 'active', 'trial', 'app_managed_google_drive')`,
  ).run();
  await db.prepare(
    `INSERT INTO tenant_domains (id, tenant_id, domain, verified)
     VALUES ('tenant-domain-east-tech', 'tenant-east-tech', 'nv.ccsd.net', 1)`,
  ).run();
  await db.prepare(
    `INSERT INTO identity_providers (id, tenant_id, provider, client_id, hosted_domain, status)
     VALUES ('idp-east-tech-google', 'tenant-east-tech', 'google_workspace', 'client-id', 'nv.ccsd.net', 'configured')`,
  ).run();
  return db;
}

async function count(db, sql) {
  const row = await db.prepare(sql).first();
  return Number(row?.count || 0);
}
