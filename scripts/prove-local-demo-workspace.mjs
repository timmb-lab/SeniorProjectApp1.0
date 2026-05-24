#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";
import { onRequestGet as onAdminDashboard } from "../functions/api/admin/dashboard.ts";
import { onRequestGet as onSiteDashboard } from "../functions/api/site/dashboard.ts";
import { onRequestGet as onProgramTeacherDashboard } from "../functions/api/program-teacher/dashboard.ts";
import { onRequestGet as onMentorDashboard } from "../functions/api/mentor/dashboard.ts";
import { onRequestGet as onTeacherReviewQueue } from "../functions/api/teacher/review-queue.ts";
import { onRequestGet as onReadinessReport } from "../functions/api/reports/readiness.ts";
import { onRequestGet as onMentorAssigned } from "../functions/api/mentor/assigned.ts";
import {
  canAccessSite,
  canAccessTenant,
  canManageSecurity,
  canMutateReviewDecision,
  canViewSiteDashboard,
  canViewStudentDirectory,
  canViewSiteStudentDetail,
  getAccessibleSiteIds,
  getAccessibleTenantIds,
} from "../functions/_lib/permissions.ts";
import { runLocalAdminLoginProof } from "./prove-local-admin-logins.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_ROOT = path.resolve("C:/SeniorProjectApp1.0");
const EXPECTED_BRANCH = "main";
const EXPECTED_REMOTE = "https://github.com/timmb-lab/SeniorProjectApp1.0.git";
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

const PROGRAM_EXPECTATIONS = Object.freeze({
  it: 69,
  culinary: 47,
  "sports-medicine": 47,
});

const DEMO_TENANT_ID = "tenant-desert-valley";
const PRIMARY_SITE_ID = "site-desert-valley-high";
const SECONDARY_SITE_IDS = Object.freeze(["site-canyon-ridge-career", "site-north-valley-tech"]);

class DemoProofError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "DemoProofError";
    this.classification = classification;
    this.details = details;
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    credentialFile: "",
    runAdminProof: false,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--credential-file") {
      parsed.credentialFile = values[index + 1] || "";
      index += 1;
    } else if (value === "--remote") {
      throw new DemoProofError("REMOTE_REFUSED", "The demo proof is local-only and refuses --remote.");
    } else if (value === "--run-admin-proof") {
      parsed.runAdminProof = true;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/prove-local-demo-workspace.mjs [--credential-file .secrets/demo-staff-logins-YYYYMMDD-HHMMSS.json] [--run-admin-proof]");
      process.exit(0);
    } else {
      throw new DemoProofError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  return parsed;
}

function runGit(args, repoRoot = REPO_ROOT) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new DemoProofError("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed.`, { status: result.status });
  }
  return String(result.stdout || "").trim();
}

function normalizePathForCompare(value) {
  return path.resolve(value).replaceAll("\\", "/").toLowerCase();
}

function assertRepoIdentity(repoRoot = REPO_ROOT) {
  const root = runGit(["rev-parse", "--show-toplevel"], repoRoot);
  const branch = runGit(["branch", "--show-current"], repoRoot);
  const remotes = runGit(["remote", "-v"], repoRoot);
  const head = runGit(["rev-parse", "HEAD"], repoRoot);
  const status = runGit(["status", "--short", "--branch"], repoRoot);
  const originFetch = remotes.split(/\r?\n/).find((line) => line.startsWith("origin") && line.includes("(fetch)"));
  const remote = originFetch?.split(/\s+/)[1] || "";
  if (normalizePathForCompare(root) !== normalizePathForCompare(EXPECTED_ROOT)) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Demo proof is restricted to C:\\SeniorProjectApp1.0.", { root });
  }
  if (branch !== EXPECTED_BRANCH) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Demo proof must run from main.", { branch });
  }
  if (remote !== EXPECTED_REMOTE) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Unexpected origin remote.", { remote });
  }
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new DemoProofError("REPO_IDENTITY_FAILED", "Unexpected package name.", { packageName: pkg.name });
  }
  return { root, branch, remote, head, status };
}

function findNewestMatchingFile(repoRoot, patternPrefix) {
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `if (Test-Path -LiteralPath .secrets) { Get-ChildItem -LiteralPath .secrets -Filter '${patternPrefix}*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName }`,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  const found = String(result.stdout || "").trim();
  return found ? path.resolve(found) : null;
}

function assertInsideSecrets(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new DemoProofError("SECRET_PATH_UNSAFE", "Credential paths must stay inside the repo .secrets folder.");
  }
}

function assertGitIgnored(repoRoot, relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const result = spawnSync("git", ["check-ignore", "-q", normalized], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new DemoProofError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function readJsonSecret(repoRoot, file) {
  assertInsideSecrets(repoRoot, file);
  assertGitIgnored(repoRoot, path.relative(repoRoot, file));
  return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function jsonRequest(url, data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", accept: "application/json", ...headers },
    body: JSON.stringify(data),
  });
}

function authedRequest(url, cookie) {
  return new Request(url, {
    headers: {
      accept: "application/json",
      cookie,
      "cf-connecting-ip": "203.0.113.44",
      "user-agent": "local-demo-proof",
    },
  });
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromResponse(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0] || "";
}

async function login(env, account) {
  const response = await onLogin({
    request: jsonRequest("https://local.capstone.test/api/auth/login", {
      email: account.email,
      password: account.password || account.workingPassword,
    }, {
      "cf-connecting-ip": "203.0.113.44",
      "user-agent": "local-demo-proof",
    }),
    env,
  });
  if (response.status !== 200) {
    throw new DemoProofError("LOGIN_FAILED", "Local auth login failed for a proof account.", {
      email: account.email,
      status: response.status,
    });
  }
  const cookie = cookieFromResponse(response);
  if (!cookie) {
    throw new DemoProofError("SESSION_COOKIE_MISSING", "Login did not return a session cookie.", { email: account.email });
  }
  return cookie;
}

async function getMe(env, cookie, expectedEmail, expectedRole) {
  const response = await onMe({
    request: authedRequest("https://local.capstone.test/api/auth/me", cookie),
    env,
  });
  const body = await responseJson(response);
  const roles = Array.isArray(body.user?.roles) ? body.user.roles : [];
  const ok = response.status === 200
    && body.authenticated === true
    && normalizeEmail(body.user?.email || "") === normalizeEmail(expectedEmail)
    && roles.some((role) => role.role_id === expectedRole);
  if (!ok) {
    throw new DemoProofError("AUTH_ME_FAILED", "/api/auth/me did not expose the expected user role.", {
      email: expectedEmail,
      status: response.status,
      expectedRole,
    });
  }
  return body;
}

async function runDemoProof(args = {}, options = {}) {
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  assertGitIgnored(repoRoot, ".secrets/");

  const localAdminProof = !(args.runAdminProof || options.runAdminLoginProof)
    ? { ok: true, skipped: true, workingCredentialPath: options.adminCredentialFile || null, accounts: [] }
    : await runLocalAdminLoginProof({
        repoRoot,
        verifyRepo: options.verifyRepo !== false,
        db: options.db || undefined,
      });

  const demoCredentialFile = args.credentialFile
    ? path.resolve(repoRoot, args.credentialFile)
    : findNewestMatchingFile(repoRoot, "demo-staff-logins-");
  if (!demoCredentialFile || !existsSync(demoCredentialFile)) {
    throw new DemoProofError("DEMO_CREDENTIAL_FILE_MISSING", "No demo staff credential file was found under .secrets/.");
  }
  const demoCredentials = readJsonSecret(repoRoot, demoCredentialFile);
  const adminCredentialFile = localAdminProof.workingCredentialPath
    ? path.resolve(repoRoot, localAdminProof.workingCredentialPath)
    : options.adminCredentialFile
      ? path.resolve(repoRoot, options.adminCredentialFile)
      : findNewestMatchingFile(repoRoot, "local-admin-working-logins-");
  if (!adminCredentialFile || !existsSync(adminCredentialFile)) {
    throw new DemoProofError("ADMIN_WORKING_CREDENTIAL_FILE_MISSING", "No local admin working credential file was found under .secrets/.");
  }
  const adminCredentials = readJsonSecret(repoRoot, adminCredentialFile);
  const adminAccount = adminCredentials.accounts?.[0];
  if (!adminAccount?.workingPassword) {
    throw new DemoProofError("ADMIN_WORKING_CREDENTIAL_FILE_INVALID", "Local admin working credential file is missing a working password.");
  }

  const env = {
    AUTH_MODE: "hardened_username_password",
    AUTH_LOCAL_LOGIN_ENABLED: "true",
    AUTH_GOOGLE_SSO_ENABLED: "false",
    SESSION_COOKIE_NAME: "sc_session",
    PASSWORD_PEPPER: options.passwordPepper ?? process.env.PASSWORD_PEPPER ?? "",
    SESSION_PEPPER: options.sessionPepper ?? process.env.SESSION_PEPPER ?? "",
    ...(options.env || {}),
    DB: options.db || new LocalSqliteD1(locateLocalD1Sqlite(repoRoot)),
  };

  const adminCookie = await login(env, { email: adminAccount.email, password: adminAccount.workingPassword });
  const adminMe = await getMe(env, adminCookie, adminAccount.email, "admin");
  const adminDashboard = await routeJson(onAdminDashboard, env, adminCookie, "https://local.capstone.test/api/admin/dashboard");
  const siteDashboardPrimary = await routeJson(onSiteDashboard, env, adminCookie, `https://local.capstone.test/api/site/dashboard?siteId=${PRIMARY_SITE_ID}`);
  const siteDashboardSecondary = await routeJson(onSiteDashboard, env, adminCookie, `https://local.capstone.test/api/site/dashboard?siteId=${SECONDARY_SITE_IDS[0]}`);
  const adminReviewQueue = await routeJson(onTeacherReviewQueue, env, adminCookie, "https://local.capstone.test/api/teacher/review-queue");
  const readiness = await routeJson(onReadinessReport, env, adminCookie, "https://local.capstone.test/api/reports/readiness");
  const multisite = await verifyMultisiteShape(env);
  const siteAwarePermissions = await verifySiteAwarePermissions(env);
  const siteDashboardRoleProof = await verifySiteDashboardRouteProof(env, demoCredentials);

  const adminChecks = {
    authMe: adminMe.authenticated === true,
    dashboardStudents370: Number(adminDashboard.summary?.studentsTotal || 0) === 370,
    siteDashboardPrimary250: Number(siteDashboardPrimary.summary?.studentsTotal || 0) === 250,
    siteDashboardSecondary60: Number(siteDashboardSecondary.summary?.studentsTotal || 0) === 60,
    siteDashboardNoLeak: Number(siteDashboardPrimary.summary?.studentsTotal || 0) !== 370
      && siteDashboardPrimary.scope?.siteId === PRIMARY_SITE_ID
      && siteDashboardSecondary.scope?.siteId === SECONDARY_SITE_IDS[0],
    primarySiteStudents250: multisite.primarySiteStudents === 250,
    secondarySitesInRange: Object.values(multisite.secondarySiteCounts).every((count) => count >= 40 && count <= 75),
    programBreakdownNinePrograms: Array.isArray(adminDashboard.programBreakdown) && adminDashboard.programBreakdown.length === 9,
    mentorCoveragePopulated: Array.isArray(adminDashboard.mentorCoverage) && adminDashboard.mentorCoverage.length >= 41,
    reviewQueuePopulated: Array.isArray(adminDashboard.reviewQueue) && adminDashboard.reviewQueue.length > 0 && Array.isArray(adminReviewQueue.queue) && adminReviewQueue.queue.length > 0,
    readinessPopulated: Number(readiness.report?.submitted || 0) > 0
      && Number(readiness.report?.revisionRequested || 0) > 0
      && Number(readiness.report?.approved || 0) > 0
      && Number(readiness.report?.evidence || 0) > 0,
    noAnnouncements: multisite.announcements === 0,
    noStudentCredentials: multisite.studentCredentials === 0,
    siteAwarePermissions: siteAwarePermissions.ok === true,
    siteDashboardRoleProof: siteDashboardRoleProof.ok === true,
  };
  assertChecks("ADMIN_API_PROOF_FAILED", adminChecks);

  const teacherProofs = [];
  for (const programId of Object.keys(PROGRAM_EXPECTATIONS)) {
    const loginAccount = (demoCredentials.programTeacherLogins || []).find((account) => account.scope === `program:${programId}`);
    if (!loginAccount) {
      throw new DemoProofError("DEMO_TEACHER_LOGIN_MISSING", `Missing demo teacher credential for ${programId}.`);
    }
    const cookie = await login(env, loginAccount);
    const me = await getMe(env, cookie, loginAccount.email, "program_teacher");
    const dashboard = await routeJson(onProgramTeacherDashboard, env, cookie, "https://local.capstone.test/api/program-teacher/dashboard");
    const reviewQueue = await routeJson(onTeacherReviewQueue, env, cookie, "https://local.capstone.test/api/teacher/review-queue");
    const expectedCount = PROGRAM_EXPECTATIONS[programId];
    const programRow = (dashboard.programBreakdown || []).find((row) => row.programId === programId);
    const nonEmpty = Number(dashboard.summary?.scopedStudents || 0) === expectedCount
      && Array.isArray(dashboard.students)
      && dashboard.students.length > 0
      && Array.isArray(dashboard.programBreakdown)
      && Number(programRow?.studentCount || 0) === expectedCount
      && Array.isArray(reviewQueue.queue);
    if (!nonEmpty) {
      throw new DemoProofError("PROGRAM_TEACHER_API_PROOF_FAILED", "Program teacher dashboard was not scoped as expected.", {
        programId,
        expectedCount,
        actualScopedStudents: dashboard.summary?.scopedStudents,
      });
    }
    teacherProofs.push({
      email: loginAccount.email,
      programId,
      scopedStudents: Number(dashboard.summary.scopedStudents || 0),
      authMe: me.authenticated === true,
      dashboardNonEmpty: true,
      reviewQueueRows: reviewQueue.queue.length,
    });
  }

  const mentorProofs = [];
  for (const loginAccount of (demoCredentials.mentorLogins || []).slice(0, 3)) {
    const cookie = await login(env, loginAccount);
    const me = await getMe(env, cookie, loginAccount.email, "mentor");
    const mentorId = me.user.id;
    const dashboard = await routeJson(onMentorDashboard, env, cookie, "https://local.capstone.test/api/mentor/dashboard");
    const assigned = await routeJson(onMentorAssigned, env, cookie, "https://local.capstone.test/api/mentor/assigned");
    const expectedAssigned = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM mentor_assignments WHERE mentor_user_id = ? AND active = 1",
    ).bind(mentorId).first();
    const assignedCount = Number(expectedAssigned?.count || 0);
    const ok = assignedCount > 0
      && Number(dashboard.summary?.assignedCount || 0) === assignedCount
      && Array.isArray(dashboard.assignedStudents)
      && dashboard.assignedStudents.length === assignedCount
      && Array.isArray(assigned.assignedStudents)
      && assigned.assignedStudents.length === assignedCount;
    if (!ok) {
      throw new DemoProofError("MENTOR_API_PROOF_FAILED", "Mentor dashboard did not return exactly assigned students.", {
        email: loginAccount.email,
        assignedCount,
        dashboardCount: dashboard.summary?.assignedCount,
      });
    }
    mentorProofs.push({
      email: loginAccount.email,
      assignedCount,
      authMe: me.authenticated === true,
      dashboardAssignedOnly: true,
    });
  }
  if (mentorProofs.length !== 3) {
    throw new DemoProofError("MENTOR_LOGIN_COUNT_FAILED", "Expected three demo mentor login proofs.");
  }

  return {
    ok: true,
    repo,
    method: "direct_route_handler",
    localOnly: true,
    credentialPath: path.relative(repoRoot, demoCredentialFile).replaceAll("\\", "/"),
    credentialValuesPrinted: false,
    credentialValuesCommitted: false,
    localAdminProof: {
      ok: localAdminProof.ok === true,
      workingCredentialPath: localAdminProof.workingCredentialPath,
      accounts: (localAdminProof.accounts || []).map((account) => ({
        email: account.email,
        loginVerified: account.loginVerified,
        meVerified: account.meVerified,
        globalAdminVerified: account.globalAdminVerified,
      })),
    },
    admin: {
      email: adminAccount.email,
      checks: adminChecks,
      studentsTotal: Number(adminDashboard.summary.studentsTotal || 0),
      siteDashboardPrimaryStudents: Number(siteDashboardPrimary.summary.studentsTotal || 0),
      siteDashboardSecondaryStudents: Number(siteDashboardSecondary.summary.studentsTotal || 0),
      programBreakdownCount: adminDashboard.programBreakdown.length,
      mentorCoverageCount: adminDashboard.mentorCoverage.length,
      reviewQueueCount: adminReviewQueue.queue.length,
      readinessReport: readiness.report,
    },
    multisite,
    siteAwarePermissions,
    siteDashboard: {
      ok: true,
      route: "/api/site/dashboard",
      primarySiteId: PRIMARY_SITE_ID,
      primarySiteStudents: Number(siteDashboardPrimary.summary.studentsTotal || 0),
      secondarySiteId: SECONDARY_SITE_IDS[0],
      secondarySiteStudents: Number(siteDashboardSecondary.summary.studentsTotal || 0),
      viewerReadOnly: siteDashboardRoleProof.viewerReadOnly,
      viewerMutationPermissionsFalse: siteDashboardRoleProof.viewerMutationPermissionsFalse,
      siteAdminCannotAccessSecondary: siteDashboardRoleProof.siteAdminCannotAccessSecondary,
    },
    programTeachers: teacherProofs,
    mentors: mentorProofs,
    googleSsoRequired: false,
  };
}

async function verifyMultisiteShape(env) {
  const [tenant, sites, primarySite, secondaryRows, sitePrograms, roleRows, storyRows, studentCredentials, announcements, unsafeEvidence, richTimelineRows] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM tenants WHERE id = ? AND status = 'active'").bind(DEMO_TENANT_ID).first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM sites WHERE tenant_id = ? AND status = 'active'").bind(DEMO_TENANT_ID).first(),
    env.DB.prepare(
      `SELECT COUNT(DISTINCT su.user_id) AS count
       FROM site_users su
       JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
       JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@demo-student.capstone.test'
       WHERE su.site_id = ? AND su.membership_status = 'active'`,
    ).bind(PRIMARY_SITE_ID).first(),
    env.DB.prepare(
      `SELECT su.site_id, COUNT(DISTINCT su.user_id) AS count
       FROM site_users su
       JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
       JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@demo-student.capstone.test'
       WHERE su.site_id IN (${SECONDARY_SITE_IDS.map(sqlLiteral).join(", ")})
       GROUP BY su.site_id
       ORDER BY su.site_id`,
    ).all(),
    env.DB.prepare("SELECT site_id, COUNT(*) AS count FROM site_programs WHERE active = 1 AND site_id IN (?, ?, ?) GROUP BY site_id").bind(PRIMARY_SITE_ID, ...SECONDARY_SITE_IDS).all(),
    env.DB.prepare(
      `SELECT role_id, COUNT(*) AS count
       FROM user_roles
       WHERE role_id IN ('platform_admin', 'org_admin', 'site_admin', 'viewer')
         AND user_id IN (SELECT id FROM user_accounts WHERE email_norm LIKE '%@demo-staff.capstone.test')
       GROUP BY role_id`,
    ).all(),
    env.DB.prepare(
      `SELECT
         SUM(CASE WHEN display_name LIKE 'Model Excellent Demo%' THEN 1 ELSE 0 END) AS model_excellent,
         SUM(CASE WHEN display_name LIKE 'Missing Mentor Demo%' THEN 1 ELSE 0 END) AS missing_mentor,
         SUM(CASE WHEN display_name LIKE 'Awaiting Review Demo%' THEN 1 ELSE 0 END) AS awaiting_review,
         SUM(CASE WHEN display_name LIKE 'Revision Loop Demo%' THEN 1 ELSE 0 END) AS revision_requested,
         SUM(CASE WHEN display_name LIKE 'Presentation Pending Demo%' THEN 1 ELSE 0 END) AS presentation_pending,
         SUM(CASE WHEN display_name LIKE 'Archive Ready Demo%' THEN 1 ELSE 0 END) AS archive_ready,
         SUM(CASE WHEN display_name LIKE 'Archive Failed Demo%' THEN 1 ELSE 0 END) AS archive_failed,
         SUM(CASE WHEN display_name LIKE 'High Risk Demo%' THEN 1 ELSE 0 END) AS high_risk,
         SUM(CASE WHEN display_name LIKE 'Rich Timeline Demo%' THEN 1 ELSE 0 END) AS rich_timeline
       FROM user_accounts
       WHERE email_norm LIKE '%@demo-student.capstone.test'`,
    ).first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM password_credentials WHERE user_id IN (SELECT id FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM announcements WHERE id LIKE 'demo-%' OR title LIKE '%DEMO_SEED%' OR body LIKE '%DEMO_SEED%'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND (drive_file_id IS NOT NULL OR drive_parent_folder_id IS NOT NULL OR external_url NOT LIKE 'https://example.com/capstone-demo/%')").first(),
    env.DB.prepare(
      `SELECT COUNT(DISTINCT u.id) AS count
       FROM user_accounts u
       JOIN submissions s ON s.student_id = u.id
       JOIN evidence_artifacts e ON e.submission_id = s.id
       JOIN comments c ON c.entity_id = s.id
       JOIN reviews r ON r.submission_id = s.id
       JOIN mentor_meetings mm ON mm.student_user_id = u.id
       JOIN presentation_slots ps ON ps.student_user_id = u.id
       JOIN exports ex ON ex.target_user_id = u.id
       WHERE u.display_name LIKE 'Rich Timeline Demo%'`,
    ).first(),
  ]);
  const secondarySiteCounts = Object.fromEntries((secondaryRows.results || []).map((row) => [row.site_id, Number(row.count || 0)]));
  const siteProgramCounts = Object.fromEntries((sitePrograms.results || []).map((row) => [row.site_id, Number(row.count || 0)]));
  const roles = Object.fromEntries((roleRows.results || []).map((row) => [row.role_id, Number(row.count || 0)]));
  const storyBuckets = Object.fromEntries(Object.entries(storyRows || {}).map(([key, value]) => [key, Number(value || 0)]));
  const ok = Number(tenant?.count || 0) === 1
    && Number(sites?.count || 0) === 3
    && Number(primarySite?.count || 0) === 250
    && Object.values(secondarySiteCounts).every((count) => count >= 40 && count <= 75)
    && Number(siteProgramCounts[PRIMARY_SITE_ID] || 0) === 9
    && Number(roles.platform_admin || 0) === 1
    && Number(roles.org_admin || 0) === 1
    && Number(roles.site_admin || 0) === 3
    && Number(roles.viewer || 0) === 1
    && Number(storyBuckets.model_excellent || 0) >= 3
    && Number(storyBuckets.missing_mentor || 0) >= 10
    && Number(storyBuckets.awaiting_review || 0) >= 10
    && Number(storyBuckets.revision_requested || 0) >= 10
    && Number(storyBuckets.presentation_pending || 0) >= 10
    && Number(storyBuckets.archive_ready || 0) >= 10
    && Number(storyBuckets.archive_failed || 0) >= 5
    && Number(storyBuckets.high_risk || 0) >= 5
    && Number(storyBuckets.rich_timeline || 0) >= 3
    && Number(richTimelineRows?.count || 0) >= 3
    && Number(studentCredentials?.count || 0) === 0
    && Number(announcements?.count || 0) === 0
    && Number(unsafeEvidence?.count || 0) === 0;
  if (!ok) {
    throw new DemoProofError("MULTISITE_SHAPE_PROOF_FAILED", "Local multisite seed shape did not match the sales demo contract.", {
      tenantRows: Number(tenant?.count || 0),
      siteRows: Number(sites?.count || 0),
      primarySiteStudents: Number(primarySite?.count || 0),
      secondarySiteCounts,
      roles,
      storyBuckets,
    });
  }
  return {
    ok,
    tenantId: DEMO_TENANT_ID,
    sites: 3,
    primarySiteStudents: Number(primarySite?.count || 0),
    secondarySiteCounts,
    siteProgramCounts,
    roles,
    storyBuckets,
    studentCredentials: Number(studentCredentials?.count || 0),
    announcements: Number(announcements?.count || 0),
    unsafeEvidenceRows: Number(unsafeEvidence?.count || 0),
    richTimelineStudents: Number(richTimelineRows?.count || 0),
  };
}

async function verifySiteAwarePermissions(env) {
  const users = await loadProofUsers(env);
  const sampleSubmission = await env.DB.prepare(
    "SELECT id, student_id FROM submissions WHERE student_id = 'demo-student-001' LIMIT 1",
  ).first();
  const checks = {
    platformTenant: await canAccessTenant(env, users.platform, DEMO_TENANT_ID),
    platformSecurity: await canManageSecurity(env, users.platform),
    orgTenant: await canAccessTenant(env, users.org, DEMO_TENANT_ID),
    orgPrimarySite: await canAccessSite(env, users.org, PRIMARY_SITE_ID),
    orgNotSecurity: !await canManageSecurity(env, users.org),
    siteDashboard: await canViewSiteDashboard(env, users.siteAdmin, PRIMARY_SITE_ID),
    siteDirectory: await canViewStudentDirectory(env, users.siteAdmin, PRIMARY_SITE_ID),
    siteStudentDetail: await canViewSiteStudentDetail(env, users.siteAdmin, "demo-student-001", PRIMARY_SITE_ID),
    siteUnrelatedDenied: !await canAccessSite(env, users.siteAdmin, SECONDARY_SITE_IDS[0]),
    viewerReadOnly: await canViewSiteDashboard(env, users.viewer, PRIMARY_SITE_ID)
      && !await canMutateReviewDecision(env, users.viewer, sampleSubmission?.id || ""),
    teacherSiteAccess: (await getAccessibleSiteIds(env, users.teacher)).includes(PRIMARY_SITE_ID),
    mentorAssignedSites: (await getAccessibleSiteIds(env, users.mentor)).includes(PRIMARY_SITE_ID),
    studentSiteDashboardDenied: !await canViewSiteDashboard(env, users.student, PRIMARY_SITE_ID),
  };
  assertChecks("SITE_AWARE_PERMISSION_PROOF_FAILED", checks);
  return { ok: true, checks };
}

async function verifySiteDashboardRouteProof(env, demoCredentials) {
  const viewerAccount = (demoCredentials.personaLogins || []).find((account) => (
    account.role === "viewer" && account.scope === `site:${PRIMARY_SITE_ID}`
  ));
  const siteAdminAccount = (demoCredentials.personaLogins || []).find((account) => (
    account.role === "site_admin" && account.scope === `site:${PRIMARY_SITE_ID}`
  ));
  if (!viewerAccount || !siteAdminAccount) {
    throw new DemoProofError("SITE_DASHBOARD_CREDENTIALS_MISSING", "Missing demo viewer or site-admin credential for site dashboard proof.");
  }

  const viewerCookie = await login(env, viewerAccount);
  await getMe(env, viewerCookie, viewerAccount.email, "viewer");
  const viewerDashboard = await routeJson(onSiteDashboard, env, viewerCookie, `https://local.capstone.test/api/site/dashboard?siteId=${PRIMARY_SITE_ID}`);

  const siteAdminCookie = await login(env, siteAdminAccount);
  await getMe(env, siteAdminCookie, siteAdminAccount.email, "site_admin");
  const siteAdminPrimary = await routeJson(onSiteDashboard, env, siteAdminCookie, `https://local.capstone.test/api/site/dashboard?siteId=${PRIMARY_SITE_ID}`);
  const siteAdminSecondary = await routeStatus(onSiteDashboard, env, siteAdminCookie, `https://local.capstone.test/api/site/dashboard?siteId=${SECONDARY_SITE_IDS[0]}`);

  const checks = {
    viewerPrimary250: Number(viewerDashboard.summary?.studentsTotal || 0) === 250,
    viewerReadOnly: viewerDashboard.scope?.readOnly === true,
    viewerMutationPermissionsFalse: viewerDashboard.permissions?.canManageMentorAssignments === false
      && viewerDashboard.permissions?.canManagePresentationOperations === false
      && viewerDashboard.permissions?.canManageArchiveOperations === false
      && viewerDashboard.permissions?.canManageUsers === false
      && viewerDashboard.permissions?.canManageSecurity === false,
    siteAdminPrimary250: Number(siteAdminPrimary.summary?.studentsTotal || 0) === 250,
    siteAdminCannotAccessSecondary: siteAdminSecondary.status === 403,
  };
  assertChecks("SITE_DASHBOARD_ROUTE_PROOF_FAILED", checks);
  return { ok: true, ...checks };
}

async function loadProofUsers(env) {
  const ids = {
    platform: "demo-platform-admin-001",
    org: "demo-org-admin-desert-valley",
    siteAdmin: "demo-site-admin-desert-valley-high",
    viewer: "demo-viewer-desert-valley-high",
    teacher: "demo-teacher-it-01",
    mentor: "demo-mentor-001",
    student: "demo-student-001",
  };
  const output = {};
  for (const [key, id] of Object.entries(ids)) {
    const user = await env.DB.prepare("SELECT id, email, email_norm, display_name, status FROM user_accounts WHERE id = ?").bind(id).first();
    if (!user) throw new DemoProofError("SITE_AWARE_PERMISSION_USER_MISSING", "Missing seeded proof user.", { key, id });
    output[key] = user;
  }
  return output;
}

async function routeJson(handler, env, cookie, url) {
  const response = await handler({ request: authedRequest(url, cookie), env });
  const body = await responseJson(response);
  if (response.status !== 200 || body.ok !== true) {
    throw new DemoProofError("API_ROUTE_FAILED", "A required local demo API route failed.", { url, status: response.status, body: safeBody(body) });
  }
  return body;
}

async function routeStatus(handler, env, cookie, url) {
  const response = await handler({ request: authedRequest(url, cookie), env });
  const body = await responseJson(response);
  return { status: response.status, body: safeBody(body) };
}

function assertChecks(classification, checks) {
  const failed = Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key);
  if (failed.length > 0) {
    throw new DemoProofError(classification, "One or more API proof checks failed.", { failed, checks });
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sqlLiteral(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function materializeSql(sql, params) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    if (index >= params.length) {
      throw new DemoProofError("SQL_BINDING_MISMATCH", "Not enough SQL bind parameters.");
    }
    const value = params[index];
    index += 1;
    return sqlLiteral(value);
  });
}

function extractJson(output) {
  const trimmed = String(output || "").trim();
  const startCandidates = [trimmed.indexOf("["), trimmed.indexOf("{")].filter((index) => index >= 0);
  if (!startCandidates.length) throw new Error("No JSON payload found.");
  const start = Math.min(...startCandidates);
  const end = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
  if (end <= start) throw new Error("No complete JSON payload found.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload[0]?.results || [];
  if (Array.isArray(payload?.result)) return payload.result[0]?.results || [];
  return payload?.result?.results || [];
}

function locateLocalD1Sqlite(repoRoot = REPO_ROOT) {
  const d1Root = path.join(repoRoot, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  if (!existsSync(d1Root)) {
    throw new DemoProofError("LOCAL_D1_STATE_MISSING", "Local Wrangler D1 state folder was not found. Run the local demo seed first.");
  }
  const candidates = readdirSync(d1Root)
    .filter((file) => file.endsWith(".sqlite") && file !== "metadata.sqlite")
    .map((file) => path.join(d1Root, file))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  for (const candidate of candidates) {
    try {
      const sqlite = new DatabaseSync(candidate, { readOnly: true });
      const found = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_accounts'").get();
      sqlite.close();
      if (found) return candidate;
    } catch {
      // Try the next local D1 sqlite file.
    }
  }
  throw new DemoProofError("LOCAL_D1_DATABASE_NOT_FOUND", "No local D1 sqlite database containing user_accounts was found.");
}

class LocalSqliteD1 {
  constructor(file) {
    this.file = file;
    this.sqlite = new DatabaseSync(file);
    this.sqlite.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(sql) {
    return new LocalSqliteD1Statement(this.sqlite, sql);
  }
}

class LocalSqliteD1Statement {
  constructor(sqlite, sql) {
    this.sqlite = sqlite;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    return this.sqlite.prepare(this.sql).get(...this.params) || null;
  }

  async all() {
    return {
      results: this.sqlite.prepare(this.sql).all(...this.params),
    };
  }

  async run() {
    const result = this.sqlite.prepare(this.sql).run(...this.params);
    return {
      success: true,
      meta: {
        changes: result.changes,
        last_row_id: result.lastInsertRowid,
      },
      results: [],
    };
  }
}

class LocalWranglerD1 {
  constructor(repoRoot = REPO_ROOT) {
    this.repoRoot = repoRoot;
  }

  prepare(sql) {
    return new LocalWranglerD1Statement(this.repoRoot, sql);
  }
}

class LocalWranglerD1Statement {
  constructor(repoRoot, sql) {
    this.repoRoot = repoRoot;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  runWrangler() {
    if (!existsSync(WRANGLER_JS)) {
      throw new DemoProofError("WRANGLER_NOT_FOUND", "Local Wrangler CLI is missing.");
    }
    const sql = materializeSql(this.sql, this.params);
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, "--local", "--json", "--command", sql], {
      cwd: this.repoRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "1" },
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new DemoProofError("LOCAL_D1_QUERY_FAILED", "Local D1 query failed.", { status: result.status });
    }
    return normalizeRows(extractJson(`${result.stdout || ""}\n${result.stderr || ""}`));
  }

  async first() {
    return this.runWrangler()[0] || null;
  }

  async all() {
    return { results: this.runWrangler() };
  }

  async run() {
    this.runWrangler();
    return { success: true, results: [] };
  }
}

function safeBody(body) {
  return JSON.parse(redact(JSON.stringify(body || {})));
}

function redact(value) {
  return String(value || "")
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"')
    .replace(/"workingPassword"\s*:\s*"[^"]+"/gi, '"workingPassword":"[REDACTED]"');
}

function redactDetails(details) {
  return JSON.parse(redact(JSON.stringify(details || {})));
}

export {
  DemoProofError,
  LocalSqliteD1,
  LocalWranglerD1,
  assertRepoIdentity,
  locateLocalD1Sqlite,
  parseArgs,
  runDemoProof,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runDemoProof(parseArgs());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof DemoProofError) {
      console.error(`Local demo proof failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactDetails(error.details))}`);
      }
    } else {
      console.error(`Local demo proof failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
