import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  AccountResetError,
  assertApprovedAccounts,
  parseArgs,
  runAccountReset,
  validateWriteSafety,
} from "../scripts/reset-accounts-and-create-local-admins.mjs";

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
  "migrations/0016_student_roster_profiles.sql",
];

test("account reset CLI and write gates fail closed", () => {
  assert.deepEqual(parseArgs(["--local", "--dry-run"]), {
    target: "local",
    mode: "dryrun",
    confirm: "",
    baseUrl: "https://senior-capstone-app.pages.dev",
  });
  assert.deepEqual(parseArgs(["--remote", "--write", "--confirm", "RESET_ALL_ACCOUNTS"]), {
    target: "remote",
    mode: "write",
    confirm: "RESET_ALL_ACCOUNTS",
    baseUrl: "https://senior-capstone-app.pages.dev",
  });
  assert.throws(() => parseArgs(["--local", "--write"]), AccountResetError);
  assert.throws(() => parseArgs(["--local", "--remote", "--dry-run"]), AccountResetError);
  assert.throws(() => parseArgs(["--local", "--dry-run", "--write"]), AccountResetError);

  assert.throws(
    () => validateWriteSafety({ target: "remote", mode: "write", confirm: "RESET_ALL_ACCOUNTS" }, {}),
    /ALLOW_REMOTE_ACCOUNT_RESET=true/,
  );
  assert.throws(
    () => validateWriteSafety(
      { target: "remote", mode: "write", confirm: "RESET_ALL_ACCOUNTS" },
      { ALLOW_REMOTE_ACCOUNT_RESET: "true" },
    ),
    /CLOUDFLARE_API_TOKEN/,
  );
  assert.throws(
    () => validateWriteSafety(
      { target: "remote", mode: "write", confirm: "RESET_ALL_ACCOUNTS" },
      { ALLOW_REMOTE_ACCOUNT_RESET: "true", CLOUDFLARE_API_TOKEN: "redacted-token" },
    ),
    /PASSWORD_PEPPER/,
  );
});

test("account reset refuses admins outside the approved allowlist", () => {
  assert.throws(
    () => assertApprovedAccounts([{
      label: "bad_admin",
      email: "not-approved@example.com",
      displayName: "Bryan Timm",
      roleId: "admin",
      scopeType: "global",
      scopeId: "",
    }]),
    /approved allowlist/,
  );
});

test("local dry run builds a plan without writing backups, credentials, or SQL", async () => {
  const fixture = createResetFixture();
  try {
    const result = await runAccountReset(parseArgs(["--local", "--dry-run"]), {
      adapter: fixture.adapter,
      repoRoot: fixture.repoRoot,
      verifyRepo: false,
      databaseInfo: fixture.databaseInfo,
      assertIgnored: assertTempSecretsIgnored,
    });

    assert.equal(result.mode, "dryrun");
    assert.equal(result.backupPath, null);
    assert.equal(result.credentialPath, null);
    assert.equal(fixture.adapter.writeCount, 0);
    assert.equal(existsSync(path.join(fixture.repoRoot, ".secrets")), false);
    assert.equal(result.beforeCounts.fakeTestUsers, 1);
    assert.equal(result.beforeCounts.oldBryanCapstoneAppUsers, 1);
    assert.equal(result.plan.localPasswordAuthIdentitiesRequired, false);
    assert.ok(result.plan.resetTables.some((row) => row.table === "auth_identities"));
    assert.ok(result.plan.resetTables.some((row) => row.table === "site_users"));
    assert.ok(result.plan.preserveTables.some((row) => row.table === "sites"));
    assert.ok(result.plan.preserveTables.some((row) => row.table === "site_programs"));
    assert.ok(result.plan.preserveTables.some((row) => row.table === "identity_providers"));
  } finally {
    fixture.cleanup();
  }
});

test("local write reset snapshots old rows and recreates only two non-SSO local admins", async () => {
  const fixture = createResetFixture();
  try {
    const result = await runAccountReset(parseArgs(["--local", "--write", "--confirm", "RESET_ALL_ACCOUNTS"]), {
      adapter: fixture.adapter,
      repoRoot: fixture.repoRoot,
      verifyRepo: false,
      databaseInfo: fixture.databaseInfo,
      assertIgnored: assertTempSecretsIgnored,
      env: {},
      now: new Date("2026-05-21T12:00:00.000Z"),
    });

    assert.equal(result.mode, "write");
    assert.match(result.backupPath, /^\.secrets\/account-reset-backup-LOCAL-20260521-120000\.json$/);
    assert.match(result.credentialPath, /^\.secrets\/local-admin-reset-20260521-120000\.json$/);
    assert.equal(existsSync(path.join(fixture.repoRoot, result.backupPath)), true);
    assert.equal(existsSync(path.join(fixture.repoRoot, result.credentialPath)), true);
    assert.equal(JSON.stringify(result).includes("setupPassword"), false);
    assert.equal(JSON.stringify(result).includes("Capstone!"), false);

    const rows = fixture.sqlite.prepare(
      `SELECT u.email_norm, u.display_name, u.status, c.requires_reset, ur.role_id, ur.scope_type, ur.scope_id
       FROM user_accounts u
       JOIN password_credentials c ON c.user_id = u.id
       JOIN user_roles ur ON ur.user_id = u.id
       ORDER BY u.email_norm`,
    ).all();
    assert.deepEqual(rows.map((row) => row.email_norm), [
      "bryan.timm89@gmail.com",
      "bryan@learntechonline.com",
    ]);
    for (const row of rows) {
      assert.equal(row.display_name, "Bryan Timm");
      assert.equal(row.status, "pending_reset");
      assert.equal(row.requires_reset, 1);
      assert.equal(row.role_id, "admin");
      assert.equal(row.scope_type, "global");
      assert.equal(row.scope_id, "");
    }

    assert.equal(count(fixture.sqlite, "user_accounts", "email_norm LIKE '%.test'"), 0);
    assert.equal(count(fixture.sqlite, "user_accounts", "email_norm = 'bryan@thecapstoneapp.com'"), 0);
    assert.equal(count(fixture.sqlite, "sessions"), 0);
    assert.equal(count(fixture.sqlite, "oauth_states"), 0);
    assert.equal(count(fixture.sqlite, "tenant_users"), 0);
    assert.equal(count(fixture.sqlite, "auth_identities", "provider = 'google_workspace'"), 0);
    assert.equal(count(fixture.sqlite, "auth_identities", "provider = 'local_password'"), 0);
    assert.equal(count(fixture.sqlite, "submissions"), 0);
    assert.equal(count(fixture.sqlite, "evidence_artifacts"), 0);
    assert.equal(count(fixture.sqlite, "announcements"), 0);
    assert.equal(count(fixture.sqlite, "roles"), 10);
    assert.equal(count(fixture.sqlite, "roles", "id = 'org_admin'"), 0);
    assert.equal(count(fixture.sqlite, "programs"), 9);
    assert.equal(count(fixture.sqlite, "sites"), 1);
    assert.equal(count(fixture.sqlite, "site_programs"), 9);
    assert.equal(count(fixture.sqlite, "site_users"), 0);
    assert.ok(count(fixture.sqlite, "requirements") > 0);
    assert.equal(count(fixture.sqlite, "evidence_repositories"), 1);
    assert.equal(count(fixture.sqlite, "identity_providers"), 1);
    assert.equal(result.finalVerification.counts.users, 2);
    assert.equal(result.finalVerification.counts.googleAuthIdentities, 0);
    assert.equal(result.finalVerification.auditEventsContainSecrets, false);
    assert.equal(result.finalVerification.preservedConfig.preserved, true);
  } finally {
    fixture.cleanup();
  }
});

test("reset safety source keeps secrets ignored and protected SSO paths out of reset code", () => {
  const gitignore = readFileSync(".gitignore", "utf8");
  assert.match(gitignore, /^\.secrets\/$/m);

  const resetSource = readFileSync("scripts/reset-accounts-and-create-local-admins.mjs", "utf8");
  for (const protectedFile of [
    "functions/api/auth/config.ts",
    "functions/api/auth/google/start.ts",
    "functions/api/auth/google/callback.ts",
    "functions/_lib/google-oauth.ts",
    "functions/_lib/oauth-state.ts",
  ]) {
    assert.equal(
      resetSource.includes(protectedFile),
      false,
      `${protectedFile} must not be referenced by the account reset pass`,
    );
  }
});

function createResetFixture() {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "capstone-reset-test-"));
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  for (const migration of MIGRATIONS) {
    sqlite.exec(readFileSync(migration, "utf8"));
  }
  seedOldAccountState(sqlite);
  const adapter = new SqliteResetAdapter(sqlite);
  return {
    repoRoot,
    sqlite,
    adapter,
    databaseInfo: {
      binding: "DB",
      databaseName: "senior-capstone-db",
      databaseId: "test-database-id",
      migrationsDir: "./migrations",
    },
    cleanup() {
      sqlite.close();
      rmSync(repoRoot, { recursive: true, force: true });
    },
  };
}

function seedOldAccountState(sqlite) {
  sqlite.exec(`
    INSERT INTO user_accounts (id, email, email_norm, display_name, status) VALUES
      ('old_fake_student', 'maya.student@senior-capstone.test', 'maya.student@senior-capstone.test', 'Test Student Maya', 'active'),
      ('old_bryan_capstone', 'bryan@thecapstoneapp.com', 'bryan@thecapstoneapp.com', 'Old Bryan', 'disabled'),
      ('old_staff_admin', 'staff.admin@example.edu', 'staff.admin@example.edu', 'Old Staff Admin', 'active');

    INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset) VALUES
      ('old_fake_student', 'hash-a', 'salt-a', 'PBKDF2-SHA-256', 100000, 0),
      ('old_bryan_capstone', 'hash-b', 'salt-b', 'PBKDF2-SHA-256', 100000, 1),
      ('old_staff_admin', 'hash-c', 'salt-c', 'PBKDF2-SHA-256', 100000, 0);

    INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by) VALUES
      ('old_fake_student', 'student', 'global', '', NULL),
      ('old_bryan_capstone', 'admin', 'global', '', NULL),
      ('old_staff_admin', 'admin', 'global', '', NULL);

    INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES
      ('sess_old', 'old_fake_student', 'token-old', '2099-01-01T00:00:00.000Z');
    INSERT INTO login_attempts (id, identifier_hash, ip_hash, success, reason) VALUES
      ('login_old', 'identifier', 'ip', 0, 'invalid_credentials');
    INSERT INTO tenant_users (tenant_id, user_id) VALUES
      ('tenant-capstone-sandbox', 'old_fake_student');
    INSERT INTO auth_identities (id, user_id, tenant_id, provider, provider_subject, email_norm) VALUES
      ('auth_google_old', 'old_fake_student', 'tenant-capstone-sandbox', 'google_workspace', 'google-subject-old', 'maya.student@senior-capstone.test'),
      ('auth_local_old', 'old_staff_admin', NULL, 'local_password', 'staff.admin@example.edu', 'staff.admin@example.edu');
    INSERT INTO oauth_states (id, state_hash, nonce_hash, tenant_hint, return_to, expires_at) VALUES
      ('oauth_old', 'state-hash', 'nonce-hash', 'senior-capstone.test', '/workspace.html', '2099-01-01T00:00:00.000Z');
    INSERT INTO groups (id, name, group_type, program_id, cohort_id) VALUES
      ('group_old', 'Old Test Group', 'program', 'it', NULL);
    INSERT INTO group_memberships (group_id, user_id, membership_role) VALUES
      ('group_old', 'old_fake_student', 'student');
    INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by) VALUES
      ('mentor_old', 'old_staff_admin', 'old_fake_student', 'old_staff_admin');
    INSERT INTO progress_records (id, student_id, requirement_id, phase, status, updated_by) VALUES
      ('progress_old', 'old_fake_student', 'req-proposal-draft', 'proposal-and-research', 'in_progress', 'old_fake_student');
    INSERT INTO status_history (id, student_id, entity_type, entity_id, to_status, changed_by) VALUES
      ('status_old', 'old_fake_student', 'submission', 'submission_old', 'submitted', 'old_staff_admin');
    INSERT INTO submissions (id, student_id, requirement_id, status, version) VALUES
      ('submission_old', 'old_fake_student', 'req-proposal-draft', 'draft', 1);
    INSERT INTO submission_versions (id, submission_id, student_id, requirement_id, version, status, submitted_by) VALUES
      ('version_old', 'submission_old', 'old_fake_student', 'req-proposal-draft', 1, 'draft', 'old_fake_student');
    INSERT INTO reviews (id, submission_id, reviewer_user_id, decision, feedback) VALUES
      ('review_old', 'submission_old', 'old_staff_admin', 'comment_only', 'Old feedback');
    INSERT INTO comments (id, entity_type, entity_id, author_user_id, body) VALUES
      ('comment_old', 'submission', 'submission_old', 'old_staff_admin', 'Old comment');
    INSERT INTO evidence_artifacts (
      id, repository_id, student_id, submission_id, artifact_type, source_kind, external_url, title, created_by
    ) VALUES (
      'evidence_old', 'default-google-drive', 'old_fake_student', 'submission_old', 'planning_document',
      'external_link', 'https://example.com/old', 'Old evidence', 'old_fake_student'
    );
    INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, submission_id, status, created_by) VALUES
      ('meeting_old', 'old_staff_admin', 'old_fake_student', 'submission_old', 'scheduled', 'old_staff_admin');
    INSERT INTO presentation_slots (id, student_user_id, submission_id, requirement_id, scheduled_for, location, created_by) VALUES
      ('slot_old', 'old_fake_student', 'submission_old', 'req-proposal-draft', '2099-01-01T00:00:00.000Z', 'Room 1', 'old_staff_admin');
    INSERT INTO announcements (id, title, body, created_by) VALUES
      ('announcement_old', 'Old announcement', 'Old body', 'old_staff_admin');
    INSERT INTO exports (id, export_type, requested_by, target_user_id, status) VALUES
      ('export_old', 'student_archive', 'old_staff_admin', 'old_fake_student', 'complete');
    INSERT INTO export_artifacts (id, export_id, artifact_type, title, content_sha256, body_json) VALUES
      ('export_artifact_old', 'export_old', 'manifest', 'Old manifest', 'abc123', '{}');
    INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES
      ('audit_old', 'old_staff_admin', 'old_action', 'user_account', 'old_fake_student', '{"old":true}');
  `);
}

function count(sqlite, table, where = "1 = 1") {
  return sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get().count;
}

function assertTempSecretsIgnored(repoRoot, relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  assert.ok(normalized === ".secrets/" || normalized.startsWith(".secrets/"));
}

class SqliteResetAdapter {
  constructor(sqlite) {
    this.sqlite = sqlite;
    this.writeCount = 0;
  }

  async query(sql) {
    return this.sqlite.prepare(sql).all();
  }

  async executeScript(sqlText) {
    this.writeCount += 1;
    this.sqlite.exec(sqlText);
  }
}
