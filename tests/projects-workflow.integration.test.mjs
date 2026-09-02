import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onProjectsGet, onRequestPost as onProjectsPost } from "../functions/api/projects.ts";
import { seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("staff project creation and regrouping move every linked record without duplicate active memberships", async () => {
  const fixture = await createWorkflowFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "workflow-admin");
  await seedAllProjectRecordTypes(fixture.db, "workflow-student-b", "project-workflow-student-b", "b");
  await seedAllProjectRecordTypes(fixture.db, "workflow-student-c", "project-workflow-student-c", "c");

  const created = await postProjects(fixture, adminToken, {
    action: "create_project",
    siteId: "site-project-workflow",
    name: "Shared Build",
    summary: "Two students will build one project.",
    studentIds: ["workflow-student-a", "workflow-student-b"],
    mentorUserId: "workflow-mentor",
    programTeacherUserId: "workflow-teacher",
  });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  const sharedProjectId = createdBody.projectId;
  assert.match(createdBody.message, /2 students now share one project/i);
  assert.deepEqual(await activeProjectIds(fixture.db, ["workflow-student-a", "workflow-student-b"]), [sharedProjectId, sharedProjectId]);
  await assertEveryRecordMoved(fixture.db, "workflow-student-b", sharedProjectId);

  const archivedOldProjects = await fixture.db.prepare(
    `SELECT id, status FROM projects
     WHERE id IN ('project-workflow-student-a', 'project-workflow-student-b')
     ORDER BY id`,
  ).all();
  assert.deepEqual(archivedOldProjects.results.map((row) => ({ ...row })), [
    { id: "project-workflow-student-a", status: "archived" },
    { id: "project-workflow-student-b", status: "archived" },
  ]);

  const regrouped = await postProjects(fixture, adminToken, {
    action: "update_project",
    siteId: "site-project-workflow",
    projectId: sharedProjectId,
    name: "Shared Build, New Team",
    summary: "Student C joined and Student B now works alone.",
    studentIds: ["workflow-student-a", "workflow-student-c"],
  });
  assert.equal(regrouped.status, 200);
  const active = await fixture.db.prepare(
    `SELECT student_user_id, project_id, COUNT(*) AS active_count
     FROM project_members
     WHERE student_user_id IN ('workflow-student-a', 'workflow-student-b', 'workflow-student-c') AND active = 1
     GROUP BY student_user_id, project_id
     ORDER BY student_user_id`,
  ).all();
  assert.equal(active.results.length, 3);
  assert.ok(active.results.every((row) => row.active_count === 1));
  assert.equal(active.results[0].project_id, sharedProjectId);
  assert.notEqual(active.results[1].project_id, sharedProjectId, "removed student gets a separate active project");
  assert.equal(active.results[2].project_id, sharedProjectId);
  await assertEveryRecordMoved(fixture.db, "workflow-student-b", active.results[1].project_id);
  await assertEveryRecordMoved(fixture.db, "workflow-student-c", sharedProjectId);

  const savedProject = await fixture.db.prepare("SELECT name, summary FROM projects WHERE id = ?").bind(sharedProjectId).first();
  assert.deepEqual({ ...savedProject }, {
    name: "Shared Build, New Team",
    summary: "Student C joined and Student B now works alone.",
  });
  const auditActions = await fixture.db.prepare(
    "SELECT action FROM audit_events WHERE entity_id = ? ORDER BY created_at",
  ).bind(sharedProjectId).all();
  assert.deepEqual(auditActions.results.map((row) => row.action), ["project_created", "project_updated"]);
});

test("project folder links stay link-only and are limited to the team or project managers", async () => {
  const fixture = await createWorkflowFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "workflow-admin");
  const memberToken = await seedSession(fixture.db, fixture.env, "workflow-student-a");
  const outsiderToken = await seedSession(fixture.db, fixture.env, "workflow-student-b");
  const projectId = "project-workflow-student-a";

  const invalid = await postProjects(fixture, memberToken, {
    action: "set_folder_link",
    projectId,
    folderUrl: "https://docs.google.com/document/d/not-a-folder/edit",
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error, "invalid_google_drive_folder_url");

  const denied = await postProjects(fixture, outsiderToken, {
    action: "set_folder_link",
    projectId,
    folderUrl: "https://drive.google.com/drive/folders/OUTSIDER",
  });
  assert.equal(denied.status, 403);

  const unchecked = await postProjects(fixture, memberToken, {
    action: "set_folder_link",
    projectId,
    folderUrl: "https://drive.google.com/drive/folders/UNCHECKED",
  });
  assert.equal(unchecked.status, 400);
  assert.equal((await unchecked.json()).error, "drive_folder_open_confirmation_required");

  const saved = await postProjects(fixture, memberToken, {
    action: "set_folder_link",
    projectId,
    folderUrl: "https://drive.google.com/drive/folders/STUDENT_FOLDER_123",
    confirmLinkOpened: true,
  });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).folderUrl, "https://drive.google.com/drive/folders/STUDENT_FOLDER_123");
  const stored = await fixture.db.prepare(
    "SELECT drive_folder_url, drive_folder_added_by, drive_folder_check_status FROM projects WHERE id = ?",
  ).bind(projectId).first();
  assert.deepEqual({ ...stored }, {
    drive_folder_url: "https://drive.google.com/drive/folders/STUDENT_FOLDER_123",
    drive_folder_added_by: "workflow-student-a",
    drive_folder_check_status: "student_confirmed",
  });

  const managed = await postProjects(fixture, adminToken, {
    action: "set_folder_link",
    projectId,
    folderUrl: "https://drive.google.com/drive/u/0/folders/ADMIN_FOLDER_456",
    confirmLinkOpened: true,
  });
  assert.equal(managed.status, 200);
  const audit = await fixture.db.prepare(
    "SELECT metadata_json FROM audit_events WHERE action = 'project_drive_folder_link_saved' AND entity_id = ? ORDER BY created_at DESC LIMIT 1",
  ).bind(projectId).first();
  assert.equal(JSON.stringify(JSON.parse(audit.metadata_json)).includes("ADMIN_FOLDER_456"), false, "audit data must not retain the Drive resource id");
  assert.equal(JSON.parse(audit.metadata_json).hostname, "drive.google.com");
});

test("template creation validates Google links and remains manager-only", async () => {
  const fixture = await createWorkflowFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "workflow-admin");
  const studentToken = await seedSession(fixture.db, fixture.env, "workflow-student-a");

  const badHost = await postProjects(fixture, adminToken, {
    action: "save_template",
    siteId: "site-project-workflow",
    name: "Unsafe Template",
    phase: "phase-1",
    templateUrl: "https://example.test/template",
  });
  assert.equal(badHost.status, 400);
  assert.equal((await badHost.json()).error, "template_fields_required");

  const denied = await postProjects(fixture, studentToken, {
    action: "save_template",
    siteId: "site-project-workflow",
    name: "Student Template",
    phase: "phase-1",
    templateUrl: "https://docs.google.com/document/d/student-template/edit",
  });
  assert.equal(denied.status, 403);

  const created = await postProjects(fixture, adminToken, {
    action: "save_template",
    siteId: "site-project-workflow",
    name: "Project Proposal",
    description: "Make a copy. Fill in your project plan.",
    phase: "phase-1",
    templateUrl: "https://docs.google.com/document/d/project-proposal/edit",
    confirmLinkOpened: true,
  });
  assert.equal(created.status, 201);
  const { templateId } = await created.json();
  const directory = await getProjects(fixture, adminToken);
  const body = await directory.json();
  const template = body.templates.find((row) => row.templateId === templateId);
  assert.deepEqual(template, {
    templateId,
    siteId: "site-project-workflow",
    programId: "",
    phase: "phase-1",
    title: "Project Proposal",
    description: "Make a copy. Fill in your project plan.",
    templateUrl: "https://docs.google.com/document/d/project-proposal/edit",
    linkCheckStatus: "staff_confirmed",
    linkCheckedAt: template.linkCheckedAt,
    active: true,
    updatedAt: template.updatedAt,
  });
});

test("template removal needs a reason and confirmation and can be restored without losing its link", async () => {
  const fixture = await createWorkflowFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "workflow-admin");
  const studentToken = await seedSession(fixture.db, fixture.env, "workflow-student-a");
  const created = await postProjects(fixture, adminToken, {
    action: "save_template",
    siteId: "site-project-workflow",
    name: "Reflection Guide",
    description: "Answer three short questions.",
    phase: "phase-4",
    templateUrl: "https://docs.google.com/document/d/reflection-guide/edit",
    confirmLinkOpened: true,
  });
  const { templateId } = await created.json();

  const noReason = await postProjects(fixture, adminToken, {
    action: "archive_template",
    siteId: "site-project-workflow",
    templateId,
    confirmImpact: true,
  });
  assert.equal(noReason.status, 400);
  assert.equal((await noReason.json()).error, "template_remove_reason_required");
  const noConfirmation = await postProjects(fixture, adminToken, {
    action: "archive_template",
    siteId: "site-project-workflow",
    templateId,
    changeReason: "A newer guide is being checked.",
  });
  assert.equal(noConfirmation.status, 400);
  assert.equal((await noConfirmation.json()).error, "template_remove_confirmation_required");

  const removed = await postProjects(fixture, adminToken, {
    action: "archive_template",
    siteId: "site-project-workflow",
    templateId,
    changeReason: "A newer guide is being checked.",
    confirmImpact: true,
  });
  assert.equal(removed.status, 200);
  assert.match((await removed.json()).message, /restore it/i);
  const adminView = await getProjects(fixture, adminToken);
  const adminTemplate = (await adminView.json()).templates.find((template) => template.templateId === templateId);
  assert.equal(adminTemplate.active, false);
  assert.equal(adminTemplate.templateUrl, "https://docs.google.com/document/d/reflection-guide/edit");
  const studentView = await getProjects(fixture, studentToken);
  assert.equal((await studentView.json()).templates.some((template) => template.templateId === templateId), false);

  const restoreWithoutConfirmation = await postProjects(fixture, adminToken, {
    action: "restore_template",
    siteId: "site-project-workflow",
    templateId,
    changeReason: "The guide is ready again.",
  });
  assert.equal(restoreWithoutConfirmation.status, 400);
  assert.equal((await restoreWithoutConfirmation.json()).error, "template_restore_confirmation_required");
  const restored = await postProjects(fixture, adminToken, {
    action: "restore_template",
    siteId: "site-project-workflow",
    templateId,
    changeReason: "The guide is ready again.",
    confirmImpact: true,
  });
  assert.equal(restored.status, 200);
  const saved = await fixture.db.prepare(
    "SELECT active, template_url FROM project_templates WHERE id = ?",
  ).bind(templateId).first();
  assert.deepEqual({ ...saved }, {
    active: 1,
    template_url: "https://docs.google.com/document/d/reflection-guide/edit",
  });
  const audits = await fixture.db.prepare(
    `SELECT action, metadata_json FROM audit_events
     WHERE entity_id = ? AND action IN ('project_template_archived', 'project_template_restored')
     ORDER BY created_at`,
  ).bind(templateId).all();
  assert.deepEqual(audits.results.map((row) => row.action), ["project_template_archived", "project_template_restored"]);
  assert.deepEqual(audits.results.map((row) => JSON.parse(row.metadata_json).changeReason), [
    "A newer guide is being checked.",
    "The guide is ready again.",
  ]);
  assert.equal(audits.results.some((row) => row.metadata_json.includes("reflection-guide")), false);
});

test("students cannot create or regroup projects directly", async () => {
  const fixture = await createWorkflowFixture();
  const studentToken = await seedSession(fixture.db, fixture.env, "workflow-student-a");
  const response = await postProjects(fixture, studentToken, {
    action: "create_project",
    siteId: "site-project-workflow",
    name: "Bypass Approval",
    summary: "This must not move anyone.",
    studentIds: ["workflow-student-a", "workflow-student-b"],
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await activeProjectIds(fixture.db, ["workflow-student-a", "workflow-student-b"]), [
    "project-workflow-student-a",
    "project-workflow-student-b",
  ]);
});

async function createWorkflowFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "projects-workflow-session-pepper",
    PASSWORD_PEPPER: "projects-workflow-password-pepper",
  };
  await seedUser(db, { id: "workflow-admin", displayName: "Workflow Admin", roleId: "global_admin" });
  await seedUser(db, { id: "workflow-mentor", displayName: "Workflow Mentor", roleId: "mentor" });
  await seedUser(db, {
    id: "workflow-teacher",
    displayName: "Workflow Teacher",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
  });
  for (const suffix of ["a", "b", "c"]) {
    await seedUser(db, {
      id: `workflow-student-${suffix}`,
      displayName: `Workflow Student ${suffix.toUpperCase()}`,
      roleId: "student",
    });
  }
  await db.prepare(
    "INSERT INTO tenants (id, name, slug, status) VALUES ('tenant-project-workflow', 'Project Workflow District', 'project-workflow', 'active')",
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, status, school_year)
     VALUES ('site-project-workflow', 'tenant-project-workflow', 'Project Workflow School', 'project-workflow-school', 'active', '2026-2027')`,
  ).run();
  await db.prepare("INSERT INTO site_programs (site_id, program_id, active) VALUES ('site-project-workflow', 'it', 1)").run();
  await db.prepare(
    "INSERT INTO groups (id, name, group_type, program_id) VALUES ('group-project-workflow', 'Workflow IT', 'program', 'it')",
  ).run();
  for (const suffix of ["a", "b", "c"]) {
    await db.prepare(
      "INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('site-project-workflow', ?, 'active')",
    ).bind(`workflow-student-${suffix}`).run();
    await db.prepare(
      "INSERT INTO group_memberships (group_id, user_id) VALUES ('group-project-workflow', ?)",
    ).bind(`workflow-student-${suffix}`).run();
  }
  for (const adultId of ["workflow-mentor", "workflow-teacher"]) {
    await db.prepare(
      "INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('site-project-workflow', ?, 'active')",
    ).bind(adultId).run();
  }
  return { db, env };
}

async function seedAllProjectRecordTypes(db, studentId, projectId, suffix) {
  await db.prepare(
    "INSERT INTO submissions (id, student_id, status, project_id) VALUES (?, ?, 'draft', ?)",
  ).bind(`workflow-submission-${suffix}`, studentId, projectId).run();
  await db.prepare(
    "INSERT INTO progress_records (id, student_id, phase, status, project_id) VALUES (?, ?, 'start', 'in_progress', ?)",
  ).bind(`workflow-progress-${suffix}`, studentId, projectId).run();
  await db.prepare(
    `INSERT INTO evidence_artifacts (
       id, student_id, artifact_type, source_kind, external_url, title, project_id
     ) VALUES (?, ?, 'planning', 'external_link', 'https://docs.google.com/document/d/proof/edit', 'Project proof', ?)`,
  ).bind(`workflow-evidence-${suffix}`, studentId, projectId).run();
  await db.prepare(
    `INSERT INTO status_history (id, student_id, entity_type, entity_id, to_status, project_id)
     VALUES (?, ?, 'progress_record', ?, 'in_progress', ?)`,
  ).bind(`workflow-history-${suffix}`, studentId, `workflow-progress-${suffix}`, projectId).run();
  await db.prepare(
    `INSERT INTO mentor_meetings (
       id, mentor_user_id, student_user_id, status, scheduled_for, created_by, project_id
     ) VALUES (?, 'workflow-mentor', ?, 'scheduled', '2026-09-15T16:00:00.000Z', 'workflow-admin', ?)`,
  ).bind(`workflow-meeting-${suffix}`, studentId, projectId).run();
  await db.prepare(
    `INSERT INTO presentation_slots (
       id, student_user_id, scheduled_for, location, created_by, project_id
     ) VALUES (?, ?, '2027-05-01T16:00:00.000Z', 'Library', 'workflow-admin', ?)`,
  ).bind(`workflow-presentation-${suffix}`, studentId, projectId).run();
}

async function assertEveryRecordMoved(db, studentId, projectId) {
  const checks = [
    ["submissions", "student_id"],
    ["progress_records", "student_id"],
    ["evidence_artifacts", "student_id"],
    ["status_history", "student_id"],
    ["mentor_meetings", "student_user_id"],
    ["presentation_slots", "student_user_id"],
  ];
  for (const [table, column] of checks) {
    const rows = await db.prepare(`SELECT DISTINCT project_id FROM ${table} WHERE ${column} = ?`).bind(studentId).all();
    assert.deepEqual(rows.results.map((row) => row.project_id), [projectId], `${table} should move with ${studentId}`);
  }
}

async function activeProjectIds(db, studentIds) {
  const rows = await db.prepare(
    `SELECT student_user_id, project_id FROM project_members
     WHERE student_user_id IN (${studentIds.map(() => "?").join(", ")}) AND active = 1
     ORDER BY student_user_id`,
  ).bind(...studentIds).all();
  return rows.results.map((row) => row.project_id);
}

function getProjects(fixture, token) {
  return onProjectsGet({
    request: requestWithSession("https://example.test/api/projects?siteId=site-project-workflow", token),
    env: fixture.env,
  });
}

function postProjects(fixture, token, body) {
  return onProjectsPost({
    request: requestWithSession("https://example.test/api/projects", token, body),
    env: fixture.env,
  });
}

function requestWithSession(url, token, body = undefined) {
  return new Request(url, {
    method: body ? "POST" : "GET",
    headers: {
      cookie: `sc_session=${token}`,
      "cf-connecting-ip": "203.0.113.63",
      "user-agent": "projects-workflow-test",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
