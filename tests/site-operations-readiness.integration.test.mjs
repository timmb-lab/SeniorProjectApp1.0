import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onSiteOperationsReadiness } from "../functions/api/site/operations-readiness.ts";
import { onRequestGet as onSiteStudentDetail } from "../functions/api/site/students/[studentId].ts";
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
];

const PRIMARY_SITE_ID = "site-desert-valley-high";
const CANYON_SITE_ID = "site-canyon-ridge-career";
const FORBIDDEN_RESPONSE_FIELDS = /drive_file_id|drive_parent_folder_id|root_folder_id|index_sheet_id|storage_key|password_hash|password_salt|token_hash|client_secret|refresh_token|access_token|private_key|content_sha256|body_json|PASSWORD_PEPPER|temporaryPassword|setupPassword/i;
const MUTATION_PERMISSION_KEYS = ["canManagePresentationOperations", "canManageArchiveOperations", "canManageUsers", "canManageSecurity"];

test("site operations readiness route is scoped, read-only, audited, bounded, and redacted", async () => {
  const { env, db, tokens } = await createSeededDemoFixture();

  {
    const { response, body } = await routeOperations(env, null, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "unauthorized" });
  }

  const platform = await expectOperations(env, tokens.platformAdmin, `?siteId=${PRIMARY_SITE_ID}&limit=100`);
  assert.equal(platform.scope.role, "platform_admin");
  assert.equal(platform.scope.readOnly, true);
  assert.equal(platform.scope.siteId, PRIMARY_SITE_ID);
  assert.equal(platform.summary.studentsTotal, 250);
  assert.equal(platform.pagination.total, 250);
  assert.equal(platform.pagination.returned, 100);
  assert.equal(platform.presentation.rows.every((row) => row.studentId.startsWith("demo-student-")), true);
  assert.equal(platform.archive.rows.every((row) => row.studentId.startsWith("demo-student-")), true);

  const secondary = await expectOperations(env, tokens.platformAdmin, `?siteId=${CANYON_SITE_ID}&limit=100`);
  assert.equal(secondary.scope.siteId, CANYON_SITE_ID);
  assert.equal(secondary.summary.studentsTotal, 60);
  assert.equal(secondary.pagination.total, 60);

  const legacy = await expectOperations(env, tokens.legacyAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(legacy.scope.role, "admin");
  assert.equal(legacy.scope.readOnly, true);

  const org = await expectOperations(env, tokens.orgAdmin, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(org.scope.role, "org_admin");
  assert.equal(org.scope.readOnly, true);

  const siteAdmin = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(siteAdmin.scope.role, "site_admin");
  assert.equal(siteAdmin.scope.readOnly, true);
  const siteAdminDenied = await routeOperations(env, tokens.siteAdminPrimary, `?siteId=${CANYON_SITE_ID}`);
  assert.equal(siteAdminDenied.response.status, 403);
  assert.doesNotMatch(JSON.stringify(siteAdminDenied.body), /Canyon|site-canyon-ridge-career/i);

  const viewer = await expectOperations(env, tokens.viewerPrimary, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(viewer.scope.role, "viewer");
  assert.equal(viewer.scope.readOnly, true);
  for (const key of MUTATION_PERMISSION_KEYS) {
    if (key.startsWith("canManage")) assert.equal(viewer.permissions[key], false, `viewer ${key}`);
  }

  const teacher = await expectOperations(env, tokens.programTeacher, `?siteId=${PRIMARY_SITE_ID}&limit=100`);
  assert.equal(teacher.scope.role, "program_teacher");
  assert.equal(teacher.scope.readOnly, true);
  assert.equal(teacher.scope.studentScope, "program_teacher");
  assert.equal(teacher.summary.studentsTotal, 45);
  assert.equal(teacher.pagination.total, 45);
  assert.equal(
    [
      ...teacher.presentation.rows,
      ...teacher.archive.rows,
      ...teacher.readiness.attentionRows,
    ].every((row) => row.programId === "it"),
    true,
  );
  assert.equal(teacher.permissions.canManagePresentationOperations, false);
  assert.equal(teacher.permissions.canManageArchiveOperations, false);

  for (const [label, token] of [
    ["mentor", tokens.mentor],
    ["student", tokens.student],
    ["misc", tokens.miscAdmin],
  ]) {
    const denied = await routeOperations(env, token, `?siteId=${PRIMARY_SITE_ID}`);
    assert.equal(denied.response.status, 403, label);
    assert.deepEqual(denied.body, { error: "forbidden" }, label);
  }

  const archiveFailed = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&archiveStatus=failed&limit=100`);
  assert.equal(archiveFailed.pagination.filteredTotal, 5);
  assert.equal(archiveFailed.archive.rows.every((row) => row.archiveStatus === "failed" && row.failed), true);
  assert.equal(archiveFailed.archive.rows.some((row) => /^Archive Failed Demo/i.test(row.studentName)), true);

  const archiveReady = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&archiveStatus=ready&limit=100`);
  assert.equal(archiveReady.pagination.filteredTotal >= 10, true);
  assert.equal(archiveReady.archive.rows.some((row) => /^Archive Ready Demo/i.test(row.studentName)), true);
  assert.equal(archiveReady.archive.rows.every((row) => row.storageIdentifiersRedacted === true), true);

  const archiveInProgress = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&archiveStatus=in_progress&limit=100`);
  assert.equal(archiveInProgress.filters.archiveStatus, "in_progress");
  assert.equal(archiveInProgress.summary.archiveInProgress > 0, true);
  assert.equal(archiveInProgress.pagination.filteredTotal, archiveInProgress.summary.archiveInProgress);
  assert.equal(archiveInProgress.archive.rows.every((row) => ["queued", "running"].includes(row.archiveStatus)), true);

  const presentationPending = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&presentationStatus=pending&limit=100`);
  assert.equal(presentationPending.pagination.filteredTotal > 0, true);
  assert.equal(presentationPending.presentation.rows.some((row) => /^Presentation Pending Demo/i.test(row.studentName)), true);
  assert.equal(presentationPending.presentation.rows.every((row) => ["pending", "outline_pending", "outline_revision_needed", "attention_required"].includes(row.presentationStatus)), true);

  const presentationAttention = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&presentationStatus=attention_required&limit=100`);
  assert.equal(presentationAttention.pagination.filteredTotal > 0, true);
  assert.equal(presentationAttention.presentation.rows.every((row) => row.presentationStatus === "attention_required"), true);
  assert.equal(presentationAttention.presentation.rows.some((row) => row.checkInStatus === "checked_out"), true);

  const outlineAttention = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&outlineAttention=true&limit=100`);
  assert.equal(outlineAttention.filters.outlineAttention, true);
  assert.equal(outlineAttention.pagination.filteredTotal, outlineAttention.summary.outlinePending);
  assert.equal(outlineAttention.presentation.rows.length > 0, true);
  assert.equal(
    outlineAttention.presentation.rows.every((row) => ["outline_pending", "outline_revision_needed"].includes(row.presentationStatus)),
    true,
  );

  const highRisk = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&story=high_risk&limit=100`);
  assert.equal(highRisk.pagination.filteredTotal, 5);
  assert.equal(highRisk.readiness.attentionRows.every((row) => row.category === "risk" && row.status === "attention_required"), true);

  const staleActivity = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&risk=stale&limit=100`);
  assert.equal(staleActivity.filters.risk, "stale");
  assert.equal(staleActivity.summary.staleActivity > 0, true);
  assert.equal(staleActivity.pagination.filteredTotal, staleActivity.summary.staleActivity);
  assert.equal(staleActivity.readiness.attentionRows.every((row) => row.category === "risk" && row.status === "attention_required"), true);

  const archiveCategory = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&category=archive&limit=100`);
  assert.equal(archiveCategory.pagination.filteredTotal, 5);
  assert.equal(archiveCategory.filters.category, "archive");
  assert.equal(archiveCategory.readiness.attentionRows.every((row) => row.category === "archive"), true);
  assert.equal(archiveCategory.readiness.nextActions.every((row) => row.category === "archive"), true);

  const needsAttention = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&needsAttention=true&limit=100`);
  assert.equal(needsAttention.filters.needsAttention, true);
  assert.equal(needsAttention.pagination.filteredTotal, needsAttention.summary.needsAttention);
  assert.equal(
    needsAttention.readiness.attentionRows.every((row) => ["blocked", "attention_required", "missing"].includes(row.status)),
    true,
  );
  assert.equal(needsAttention.readiness.nextActions.length > 0, true);

  const evidenceMissing = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&category=evidence&readiness=missing&limit=100`);
  assert.equal(evidenceMissing.filters.category, "evidence");
  assert.equal(evidenceMissing.filters.readiness, "missing");
  assert.equal(evidenceMissing.summary.evidenceMissing > 0, true);
  assert.equal(evidenceMissing.pagination.filteredTotal, evidenceMissing.summary.evidenceMissing);
  assert.equal(
    evidenceMissing.readiness.attentionRows.every((row) => row.category === "evidence" && row.status === "missing"),
    true,
  );
  assert.equal(evidenceMissing.readiness.nextActions.every((row) => row.category === "evidence"), true);

  for (const story of ["presentation_pending", "archive_ready", "archive_failed", "high_risk"]) {
    const body = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&story=${story}&limit=100`);
    assert.equal(body.pagination.filteredTotal > 0, true, story);
  }

  const paged = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&limit=2`);
  const offset = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&limit=2&offset=2`);
  assert.equal(paged.pagination.limit, 2);
  assert.equal(paged.pagination.returned, 2);
  assert.notEqual(firstReturnedStudentId(offset), firstReturnedStudentId(paged));

  const capped = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&limit=500`);
  assert.equal(capped.pagination.limit, 100);

  const richTimeline = await expectOperations(env, tokens.siteAdminPrimary, `?siteId=${PRIMARY_SITE_ID}&story=rich_timeline&limit=100`);
  assert.equal(richTimeline.pagination.filteredTotal, 3);
  const richStudentId = firstReturnedStudentId(richTimeline);
  assert.ok(richStudentId);
  const detail = await routeStudentDetail(env, tokens.siteAdminPrimary, richStudentId, `?siteId=${PRIMARY_SITE_ID}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.student.studentId, richStudentId);

  for (const body of [platform, secondary, legacy, org, siteAdmin, viewer, teacher, archiveFailed, archiveReady, archiveInProgress, presentationPending, presentationAttention, outlineAttention, highRisk, staleActivity, archiveCategory, needsAttention, evidenceMissing, paged, offset, capped, richTimeline, detail.body]) {
    assert.doesNotMatch(JSON.stringify(body), FORBIDDEN_RESPONSE_FIELDS);
  }

  const audits = await readAuditActions(db);
  assert.equal(audits.some((event) => event.action === "site_operations_readiness_viewed"), true);
  assert.equal(audits.some((event) => event.action === "site_operations_readiness_denied"), true);
  assert.equal(audits.some((event) => event.action === "site_operations_readiness_unauthorized"), true);
  assert.doesNotMatch(JSON.stringify(audits), FORBIDDEN_RESPONSE_FIELDS);
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

  await seedUser(db, {
    id: "misc-operations-user",
    displayName: "Misc Operations User",
    roleId: "misc_admin",
    scopeType: "reporting",
    scopeId: "readiness",
  });

  const tokens = {
    platformAdmin: await seedSession(db, env, "demo-platform-admin-001", "site-ops-platform"),
    legacyAdmin: await seedSession(db, env, "protected-admin-primary", "site-ops-legacy"),
    orgAdmin: await seedSession(db, env, "demo-org-admin-desert-valley", "site-ops-org"),
    siteAdminPrimary: await seedSession(db, env, "demo-site-admin-desert-valley-high", "site-ops-site-admin"),
    viewerPrimary: await seedSession(db, env, "demo-viewer-desert-valley-high", "site-ops-viewer"),
    programTeacher: await seedSession(db, env, "demo-teacher-it-01", "site-ops-teacher"),
    mentor: await seedSession(db, env, "demo-mentor-001", "site-ops-mentor"),
    student: await seedSession(db, env, "demo-student-001", "site-ops-student"),
    miscAdmin: await seedSession(db, env, "misc-operations-user", "site-ops-misc"),
  };

  return { db, env, tokens };
}

async function expectOperations(env, token, query = "") {
  const { response, body } = await routeOperations(env, token, query);
  assert.equal(response.status, 200, body?.error || "expected site operations readiness success");
  assert.equal(body.ok, true);
  return body;
}

async function routeOperations(env, token, query = "") {
  const response = await onSiteOperationsReadiness({
    request: buildRequest(`https://local.capstone.test/api/site/operations-readiness${query}`, token),
    env,
  });
  const body = await response.json();
  return { response, body };
}

async function routeStudentDetail(env, token, studentId, query = "") {
  const response = await onSiteStudentDetail({
    request: buildRequest(`https://local.capstone.test/api/site/students/${encodeURIComponent(studentId)}${query}`, token),
    env,
    params: { studentId },
  });
  const body = await response.json();
  return { response, body };
}

function firstReturnedStudentId(body) {
  return body.readiness.attentionRows[0]?.studentId
    || body.archive.rows[0]?.studentId
    || body.presentation.rows[0]?.studentId
    || "";
}
