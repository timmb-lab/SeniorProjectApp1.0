#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hashPassword, normalizeEmail } from "../functions/_lib/crypto.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_CREDENTIAL_FILE = ".secrets/local-workspace-smoke-accounts.json";
const LEGACY_CREDENTIAL_FILE = ".secrets/test-accounts-2026-05-18.json";
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

const ACCOUNTS = [
  {
    key: "student",
    id: "test_user_student_maya",
    email: "maya.student@senior-capstone.test",
    displayName: "Test Student Maya",
    roleId: "student",
    scopeType: "global",
    scopeId: "",
  },
  {
    key: "program_teacher",
    id: "test_user_teacher_chen",
    email: "chen.teacher@senior-capstone.test",
    displayName: "Test Teacher Chen",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
  },
  {
    key: "mentor",
    id: "test_user_mentor_rivera",
    email: "rivera.mentor@senior-capstone.test",
    displayName: "Test Mentor Rivera",
    roleId: "mentor",
    scopeType: "global",
    scopeId: "",
  },
  {
    key: "mentor_no_assignment",
    id: "test_user_mentor_unassigned",
    email: "unassigned.mentor@senior-capstone.test",
    displayName: "Test Unassigned Mentor",
    roleId: "mentor",
    scopeType: "global",
    scopeId: "",
  },
  {
    key: "admin",
    id: "test_user_admin_lee",
    email: "lee.admin@senior-capstone.test",
    displayName: "Test Admin Lee",
    roleId: "admin",
    scopeType: "global",
    scopeId: "",
  },
  {
    key: "misc_admin",
    id: "test_user_misc_reporting",
    email: "reporting.miscadmin@senior-capstone.test",
    displayName: "Test Reporting Admin",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "alpha-readiness",
  },
  {
    key: "no_role",
    id: "test_user_no_role_pending",
    email: "norole.pending@senior-capstone.test",
    displayName: "Test Role Pending User",
    roleId: null,
    scopeType: "",
    scopeId: "",
  },
];

const FIXTURES = {
  cohortId: "alpha-2026",
  groupId: "group-alpha-it-2026",
  mentorAssignmentId: "mentor-alpha-rivera-maya",
  requirementId: "req-proposal-draft",
  presentationRequirementId: "req-presentation-day",
  progressRecordId: "progress-alpha-maya-proposal",
  submissionId: "submission-alpha-maya-proposal",
  evidenceArtifactId: "evidence-alpha-maya-category-map",
  presentationSlotId: "presentation-alpha-maya-slot",
};

const args = parseArgs(process.argv.slice(2));
const credentialFile = path.resolve(REPO_ROOT, args.credentialFile || DEFAULT_CREDENTIAL_FILE);

if (args.remote) {
  fail("This script is local-only and refuses remote D1 targets.");
}
if (!existsSync(WRANGLER_JS)) {
  fail("Local Wrangler CLI is not installed. Run npm install before seeding local D1.");
}
assertInsideRepo(credentialFile);
assertIgnored(path.relative(REPO_ROOT, credentialFile));

const existingCredentials = readExistingCredentials(credentialFile, path.resolve(REPO_ROOT, LEGACY_CREDENTIAL_FILE));
const accountsWithPasswords = ACCOUNTS.map((account) => ({
  ...account,
  password: existingCredentials.get(account.key) || generatePassword(),
}));

await runWrangler(["d1", "migrations", "apply", DATABASE_NAME, "--local"], "apply local D1 migrations");

const sqlFile = path.resolve(REPO_ROOT, ".secrets", "local-workspace-smoke-seed.sql");
assertInsideRepo(sqlFile);
writeFileSync(sqlFile, await buildSeedSql(accountsWithPasswords), "utf8");

try {
  await runWrangler(["d1", "execute", DATABASE_NAME, "--local", "--file", sqlFile], "seed local workspace smoke accounts");
} finally {
  rmSync(sqlFile, { force: true });
}

writeCredentialsFile(credentialFile, accountsWithPasswords);
await verifyLocalSeed();

console.log(JSON.stringify({
  ok: true,
  localOnly: true,
  database: DATABASE_NAME,
  credentialFile: path.relative(REPO_ROOT, credentialFile).replaceAll("\\", "/"),
  accounts: accountsWithPasswords.map((account) => ({
    key: account.key,
    id: account.id,
    email: account.email,
    roleId: account.roleId,
    scopeType: account.scopeType,
    scopeId: account.scopeId,
  })),
  fixtures: FIXTURES,
  note: "Passwords were written to the ignored credential file and were not printed.",
}, null, 2));

function parseArgs(values) {
  const parsed = { credentialFile: "", remote: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--credential-file") {
      parsed.credentialFile = values[index + 1] || "";
      index += 1;
    } else if (value === "--remote") {
      parsed.remote = true;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: seed-local-workspace-smoke.mjs [--credential-file .secrets/local-workspace-smoke-accounts.json]");
      process.exit(0);
    } else {
      fail(`Unknown argument: ${value}`);
    }
  }
  return parsed;
}

function assertInsideRepo(candidate) {
  const relative = path.relative(REPO_ROOT, path.resolve(candidate));
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`Path must stay inside repo root: ${candidate}`);
  }
}

function assertIgnored(relativeFile) {
  const result = spawnSync("git", ["check-ignore", "-q", relativeFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    fail(`Credential file is not ignored by git: ${relativeFile}`);
  }
}

function readExistingCredentials(...candidateFiles) {
  const byKey = new Map();
  for (const file of candidateFiles) {
    if (!existsSync(file)) continue;
    const parsed = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    for (const account of parsed.accounts || []) {
      if (account?.key && typeof account.password === "string" && account.password) {
        byKey.set(account.key, account.password);
      }
    }
  }
  return byKey;
}

function generatePassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const random = Buffer.from(bytes).toString("base64url");
  return `ScLocal!${random}9zZ`;
}

async function buildSeedSql(accounts) {
  const statements = [
    "PRAGMA foreign_keys = ON;",
    `INSERT OR IGNORE INTO roles (id, label, description) VALUES
      ('student', 'Student', 'Own workspace and own evidence only.'),
      ('mentor', 'Mentor', 'Assigned student visibility only.'),
      ('program_teacher', 'Program Teacher', 'Assigned program or cohort visibility.'),
      ('admin', 'Admin', 'Full operational access with audit logging.'),
      ('misc_admin', 'Misc Admin', 'Narrow explicit support permissions only.');`,
    `INSERT OR IGNORE INTO programs (id, name) VALUES ('it', 'IT');`,
  ];

  for (const account of accounts) {
    const credential = await hashPassword(account.password, process.env.PASSWORD_PEPPER || "");
    statements.push(
      `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
       VALUES (${sql(account.id)}, ${sql(account.email)}, ${sql(normalizeEmail(account.email))}, ${sql(account.displayName)}, 'active')
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         email_norm = excluded.email_norm,
         display_name = excluded.display_name,
         status = 'active',
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`,
      `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
       VALUES (${sql(account.id)}, ${sql(credential.hash)}, ${sql(credential.salt)}, ${sql(credential.algorithm)}, ${credential.iterations}, 0)
       ON CONFLICT(user_id) DO UPDATE SET
         password_hash = excluded.password_hash,
         password_salt = excluded.password_salt,
         algorithm = excluded.algorithm,
         iterations = excluded.iterations,
         requires_reset = 0,
         password_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`,
    );
    if (account.roleId) {
      statements.push(
        `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
         VALUES (${sql(account.id)}, ${sql(account.roleId)}, ${sql(account.scopeType)}, ${sql(account.scopeId)}, NULL);`,
      );
    }
  }

  statements.push(
    `INSERT INTO cohorts (id, label, school_year, active)
     VALUES (${sql(FIXTURES.cohortId)}, 'Alpha Test Cohort 2026', '2025-2026', 1)
     ON CONFLICT(id) DO UPDATE SET label = excluded.label, school_year = excluded.school_year, active = 1;`,
    `INSERT INTO groups (id, name, group_type, program_id, cohort_id)
     VALUES (${sql(FIXTURES.groupId)}, 'Alpha IT Test Cohort', 'cohort', 'it', ${sql(FIXTURES.cohortId)})
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       group_type = excluded.group_type,
       program_id = excluded.program_id,
       cohort_id = excluded.cohort_id;`,
    `INSERT OR IGNORE INTO group_memberships (group_id, user_id, membership_role)
     VALUES (${sql(FIXTURES.groupId)}, 'test_user_student_maya', 'student');`,
    `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
     VALUES (${sql(FIXTURES.mentorAssignmentId)}, 'test_user_mentor_rivera', 'test_user_student_maya', NULL, 1)
     ON CONFLICT(mentor_user_id, student_user_id) DO UPDATE SET active = 1;`,
    `INSERT INTO requirements (id, program_id, phase, title, description, required, sort_order)
     VALUES (
       ${sql(FIXTURES.requirementId)},
       NULL,
        'phase-1',
       'Senior Project Proposal Draft',
       'Student drafts proposal in the app or uploads a proposal document.',
       1,
       3
     )
     ON CONFLICT(id) DO UPDATE SET
       program_id = excluded.program_id,
       phase = excluded.phase,
       title = excluded.title,
       description = excluded.description,
       required = excluded.required,
       sort_order = excluded.sort_order;`,
    `INSERT INTO requirements (id, program_id, phase, title, description, required, sort_order)
     VALUES (
       ${sql(FIXTURES.presentationRequirementId)},
       NULL,
        'phase-3a',
       'Presentation Day',
       'Student completes presentation day schedule, check-out, and check-in workflow.',
       1,
       11
     )
     ON CONFLICT(id) DO UPDATE SET
       program_id = excluded.program_id,
       phase = excluded.phase,
       title = excluded.title,
       description = excluded.description,
       required = excluded.required,
       sort_order = excluded.sort_order;`,
    `INSERT INTO progress_records (id, student_id, requirement_id, phase, status, updated_by)
     VALUES (
       ${sql(FIXTURES.progressRecordId)},
       'test_user_student_maya',
       ${sql(FIXTURES.requirementId)},
        'phase-1',
       'submitted',
       'test_user_student_maya'
     )
     ON CONFLICT(id) DO UPDATE SET
       student_id = excluded.student_id,
       requirement_id = excluded.requirement_id,
       phase = excluded.phase,
       status = excluded.status,
       updated_by = excluded.updated_by,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`,
    `INSERT INTO submissions (id, student_id, requirement_id, status, version)
     VALUES (${sql(FIXTURES.submissionId)}, 'test_user_student_maya', ${sql(FIXTURES.requirementId)}, 'submitted', 1)
     ON CONFLICT(id) DO UPDATE SET
       student_id = excluded.student_id,
       requirement_id = excluded.requirement_id,
       status = excluded.status,
       version = excluded.version,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`,
    `INSERT INTO evidence_artifacts (
       id,
       repository_id,
       student_id,
       submission_id,
       artifact_type,
       source_kind,
       external_url,
       title,
       review_status,
       created_by
     )
     VALUES (
       ${sql(FIXTURES.evidenceArtifactId)},
       'default-google-drive',
       'test_user_student_maya',
       ${sql(FIXTURES.submissionId)},
       'planning_document',
       'external_link',
       'https://example.test/evidence/local-workspace-seed',
       'Local workspace smoke evidence link',
       'pending_review',
       'test_user_student_maya'
     )
     ON CONFLICT(id) DO UPDATE SET
       student_id = excluded.student_id,
       submission_id = excluded.submission_id,
       external_url = excluded.external_url,
       title = excluded.title,
       review_status = excluded.review_status;`,
    `INSERT INTO presentation_slots (
       id,
       student_user_id,
       submission_id,
       requirement_id,
       scheduled_for,
       duration_minutes,
       location,
       status,
       outline_status,
       notes,
       created_by
     )
     VALUES (
       ${sql(FIXTURES.presentationSlotId)},
       'test_user_student_maya',
       ${sql(FIXTURES.submissionId)},
       ${sql(FIXTURES.presentationRequirementId)},
       '2026-03-26T16:00:00.000Z',
       20,
       'Room 101',
       'scheduled',
       'approved',
       'Local workspace presentation readiness slot.',
       'test_user_teacher_chen'
     )
     ON CONFLICT(id) DO UPDATE SET
       student_user_id = excluded.student_user_id,
       submission_id = excluded.submission_id,
       requirement_id = excluded.requirement_id,
       scheduled_for = excluded.scheduled_for,
       duration_minutes = excluded.duration_minutes,
       location = excluded.location,
       status = excluded.status,
       outline_status = excluded.outline_status,
       checked_out_at = NULL,
       checked_in_at = NULL,
       notes = excluded.notes,
       created_by = excluded.created_by,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');`,
  );

  return `${statements.join("\n\n")}\n`;
}

function writeCredentialsFile(file, accounts) {
  mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    created_at: new Date().toISOString(),
    purpose: "Local-only credential-backed workspace smoke accounts for Capstone Project.",
    local_only: true,
    app_url: "http://127.0.0.1:8788",
    accounts: accounts.map((account) => ({
      key: account.key,
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      roleId: account.roleId,
      scopeType: account.scopeType,
      scopeId: account.scopeId,
      password: account.password,
    })),
    fixtures: FIXTURES,
  };
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function verifyLocalSeed() {
  const seededAccountIds = ACCOUNTS.map((account) => sql(account.id)).join(", ");
  const output = await runWrangler([
    "d1",
    "execute",
    DATABASE_NAME,
    "--local",
    "--command",
    `SELECT COUNT(*) AS count FROM user_accounts WHERE id IN (${seededAccountIds})`,
  ], "verify local fake account count");

  if (!/"count":\s*7/.test(output)) {
    fail("Local D1 verification did not find the expected seven seeded fake account IDs.");
  }
}

async function runWrangler(wranglerArgs, label) {
  const result = spawnSync(process.execPath, [WRANGLER_JS, ...wranglerArgs], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    windowsHide: true,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if (result.status !== 0) {
    fail(`${label} failed: ${redact(output)}`);
  }
  return output;
}

function sql(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function redact(value) {
  return String(value || "")
    .replace(/"password"\s*:\s*"[^"]+"/g, '"password":"[REDACTED]"')
    .replace(/\b(password_hash|password_salt)\s*=\s*'[^']+'/gi, "$1='[REDACTED]'");
}

function fail(message) {
  console.error(redact(message));
  process.exit(1);
}
