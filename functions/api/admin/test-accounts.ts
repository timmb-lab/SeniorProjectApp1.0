import type { Env, RoleId } from "../../_types";
import { getCurrentUser, writeAudit } from "../../_lib/auth";
import { hashPassword, normalizeEmail } from "../../_lib/crypto";
import { badRequest, json, readJson, requirePost } from "../../_lib/http";
import { isAdmin } from "../../_lib/permissions";

type TestAccountKey = "student" | "program_teacher" | "mentor" | "misc_admin";

interface SeedTestAccountsBody {
  passwords?: Partial<Record<TestAccountKey, string>>;
}

interface TestAccountSeed {
  key: TestAccountKey;
  id: string;
  email: string;
  displayName: string;
  roleId: RoleId;
  scopeType: string;
  scopeId: string;
}

const TEST_ACCOUNTS: TestAccountSeed[] = [
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
    key: "misc_admin",
    id: "test_user_misc_reporting",
    email: "reporting.miscadmin@senior-capstone.test",
    displayName: "Test Reporting Admin",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "alpha-readiness",
  },
];

function passwordLooksUsable(password: string): boolean {
  return (
    password.length >= 14
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
}

async function upsertTestAccount(env: Env, seed: TestAccountSeed, password: string): Promise<void> {
  const emailNorm = normalizeEmail(seed.email);
  const credential = await hashPassword(password, env.PASSWORD_PEPPER || "");

  await env.DB.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES (?, ?, ?, ?, 'active')
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       email_norm = excluded.email_norm,
       display_name = excluded.display_name,
       status = 'active',
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(seed.id, seed.email, emailNorm, seed.displayName).run();

  await env.DB.prepare(
    `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(user_id) DO UPDATE SET
       password_hash = excluded.password_hash,
       password_salt = excluded.password_salt,
       algorithm = excluded.algorithm,
       iterations = excluded.iterations,
       requires_reset = 0,
       password_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).bind(seed.id, credential.hash, credential.salt, credential.algorithm, credential.iterations).run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
     VALUES (?, ?, ?, ?, NULL)`,
  ).bind(seed.id, seed.roleId, seed.scopeType, seed.scopeId).run();
}

async function seedAlphaAssignments(env: Env): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO cohorts (id, label, school_year, active)
     VALUES ('alpha-2026', 'Alpha Test Cohort 2026', '2025-2026', 1)
     ON CONFLICT(id) DO UPDATE SET label = excluded.label, school_year = excluded.school_year, active = 1`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO groups (id, name, group_type, program_id, cohort_id)
     VALUES ('group-alpha-it-2026', 'Alpha IT Test Cohort', 'cohort', 'it', 'alpha-2026')
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       group_type = excluded.group_type,
       program_id = excluded.program_id,
       cohort_id = excluded.cohort_id`,
  ).run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO group_memberships (group_id, user_id, membership_role)
     VALUES ('group-alpha-it-2026', 'test_user_student_maya', 'student')`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active)
     VALUES ('mentor-alpha-rivera-maya', 'test_user_mentor_rivera', 'test_user_student_maya', NULL, 1)
     ON CONFLICT(mentor_user_id, student_user_id) DO UPDATE SET active = 1`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO requirements (id, program_id, phase, title, description, required, sort_order)
     VALUES (
       'req-alpha-proposal',
       'it',
       'proposal',
       'Alpha proposal/research submission',
       'Fake alpha requirement for testing database-backed student workflow only.',
       1,
       10
     )
     ON CONFLICT(id) DO UPDATE SET
       program_id = excluded.program_id,
       phase = excluded.phase,
       title = excluded.title,
       description = excluded.description,
       required = excluded.required,
       sort_order = excluded.sort_order`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO progress_records (id, student_id, requirement_id, phase, status, updated_by)
     VALUES (
       'progress-alpha-maya-proposal',
       'test_user_student_maya',
       'req-alpha-proposal',
       'proposal',
       'in_progress',
       'test_user_student_maya'
     )
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       updated_by = excluded.updated_by,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).run();

  await env.DB.prepare(
    `INSERT INTO submissions (id, student_id, requirement_id, status, version)
     VALUES ('submission-alpha-maya-proposal', 'test_user_student_maya', 'req-alpha-proposal', 'draft', 1)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       version = excluded.version,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).run();

  await env.DB.prepare(
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
       'evidence-alpha-maya-category-map',
       'default-google-drive',
       'test_user_student_maya',
       'submission-alpha-maya-proposal',
       'planning_document',
       'external_link',
       'https://example.com/alpha-help-desk-category-map',
       'Alpha test ticket-category map',
       'pending_review',
       'test_user_student_maya'
     )
     ON CONFLICT(id) DO UPDATE SET
       external_url = excluded.external_url,
       title = excluded.title,
       review_status = excluded.review_status`,
  ).run();
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  if (!await isAdmin(env, user.id)) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  let body: SeedTestAccountsBody;
  try {
    body = await readJson<SeedTestAccountsBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const passwords = body.passwords || {};
  const missing = TEST_ACCOUNTS.filter((account) => !passwords[account.key]).map((account) => account.key);
  if (missing.length > 0) {
    return badRequest(`missing_passwords:${missing.join(",")}`);
  }

  const weak = TEST_ACCOUNTS
    .filter((account) => !passwordLooksUsable(passwords[account.key] || ""))
    .map((account) => account.key);
  if (weak.length > 0) {
    return badRequest(`weak_passwords:${weak.join(",")}`);
  }

  for (const account of TEST_ACCOUNTS) {
    await upsertTestAccount(env, account, passwords[account.key] || "");
  }
  await seedAlphaAssignments(env);

  await writeAudit(env, {
    actorUserId: user.id,
    action: "test_accounts_seeded",
    entityType: "test_account_seed",
    entityId: "alpha-test-accounts",
    request,
    metadata: {
      accounts: TEST_ACCOUNTS.map((account) => ({
        key: account.key,
        email: account.email,
        roleId: account.roleId,
        scopeType: account.scopeType,
        scopeId: account.scopeId,
      })),
      includesWorkflowFixtures: true,
    },
  });

  return json({
    ok: true,
    accounts: TEST_ACCOUNTS.map((account) => ({
      key: account.key,
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      roleId: account.roleId,
      scopeType: account.scopeType,
      scopeId: account.scopeId,
    })),
    fixtures: {
      cohortId: "alpha-2026",
      groupId: "group-alpha-it-2026",
      studentId: "test_user_student_maya",
      mentorAssignmentId: "mentor-alpha-rivera-maya",
      requirementId: "req-alpha-proposal",
      progressRecordId: "progress-alpha-maya-proposal",
      submissionId: "submission-alpha-maya-proposal",
      evidenceArtifactId: "evidence-alpha-maya-category-map",
    },
    credentialNote: "Passwords were accepted from the request and are not returned by this endpoint.",
  });
};
