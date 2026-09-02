import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { onRequestGet as onAdultsGet, onRequestPost as onAdultsPost } from "../functions/api/project-adults.ts";
import { onRequestGet as onProjectsGet, onRequestPost as onProjectsPost } from "../functions/api/projects.ts";
import { onRequestPost as onReviewDecision } from "../functions/api/reviews/[submissionId]/decision.ts";
import { seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("migration repairs clear legacy ownership and leaves ambiguous projects visibly missing", async () => {
  const migrations = foundationMigrations();
  const db = createSqliteD1({ migrations: migrations.filter((file) => !file.includes("0025_required_project_adults")) });
  await db.prepare("INSERT INTO tenants (id, name, slug, status) VALUES ('adult-migration-tenant', 'Adult Migration District', 'adult-migration', 'active')").run();
  await db.prepare("INSERT INTO sites (id, tenant_id, name, slug, status) VALUES ('adult-migration-site', 'adult-migration-tenant', 'Adult Migration School', 'adult-migration-school', 'active')").run();
  await db.prepare("INSERT INTO site_programs (site_id, program_id, active) VALUES ('adult-migration-site', 'it', 1)").run();
  await seedUser(db, { id: "migration-student-ready", displayName: "Ready Student", roleId: "student" });
  await seedUser(db, { id: "migration-student-missing", displayName: "Missing Student", roleId: "student" });
  await seedUser(db, { id: "migration-mentor", displayName: "Migration Mentor", roleId: "mentor" });
  await seedUser(db, { id: "migration-teacher", displayName: "Migration Teacher", roleId: "program_teacher", scopeType: "program", scopeId: "it" });
  await db.prepare("INSERT INTO groups (id, name, group_type, program_id) VALUES ('migration-it-group', 'Migration IT', 'program', 'it')").run();
  await db.prepare("INSERT INTO group_memberships (group_id, user_id) VALUES ('migration-it-group', 'migration-student-ready')").run();
  for (const userId of ["migration-student-ready", "migration-student-missing", "migration-mentor", "migration-teacher"]) {
    await db.prepare("INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('adult-migration-site', ?, 'active')").bind(userId).run();
  }
  await db.prepare(
    `INSERT INTO project_mentor_assignments (id, project_id, mentor_user_id, active, assigned_by)
     VALUES ('migration-project-mentor', 'project-migration-student-ready', 'migration-mentor', 1, 'migration-teacher')`,
  ).run();

  db.exec(readFileSync("migrations/0025_required_project_adults.sql", "utf8"));

  const repaired = await db.prepare(
    `SELECT projects.program_id,
       SUM(CASE WHEN project_adult_assignments.status = 'accepted' THEN 1 ELSE 0 END) AS confirmed
     FROM projects
     LEFT JOIN project_adult_assignments ON project_adult_assignments.project_id = projects.id
     WHERE projects.id = 'project-migration-student-ready'
     GROUP BY projects.id`,
  ).first();
  assert.equal(repaired.program_id, "it");
  assert.equal(repaired.confirmed, 2);
  const missing = await db.prepare(
    "SELECT COUNT(*) AS confirmed FROM project_adult_assignments WHERE project_id = 'project-migration-student-missing' AND status = 'accepted'",
  ).first();
  assert.equal(missing.confirmed, 0);
});

test("students tag both required adults, adults accept, and approval moves the confirmed roles to the project", async () => {
  const fixture = await createFixture();
  const studentToken = await seedSession(fixture.db, fixture.env, "adult-student");
  const mentorToken = await seedSession(fixture.db, fixture.env, "adult-mentor");
  const teacherToken = await seedSession(fixture.db, fixture.env, "adult-teacher");
  const adminToken = await seedSession(fixture.db, fixture.env, "adult-admin");

  const submitted = await postProjects(fixture, studentToken, {
    action: "submit_request",
    siteId: fixture.siteId,
    name: "Clear Water Project",
    summary: "We will help our school save water.",
    studentIds: [],
  });
  assert.equal(submitted.status, 201);
  const { requestId } = await submitted.json();

  const missing = await getAdults(fixture, studentToken, { requestId });
  assert.equal(missing.status, 200);
  const missingBody = await missing.json();
  assert.deepEqual(missingBody.setup.missingRoles, ["mentor", "program_teacher"]);
  assert.equal(missingBody.options.mentors.some((adult) => adult.userId === "adult-mentor"), true);
  assert.equal(missingBody.options.programTeachers.some((adult) => adult.userId === "adult-teacher"), true);

  const mentorInvite = await postAdults(fixture, studentToken, {
    action: "nominate_adult",
    requestId,
    adultRole: "mentor",
    assigneeUserId: "adult-mentor",
  });
  assert.equal(mentorInvite.status, 201);
  const mentorAssignmentId = (await mentorInvite.json()).assignmentId;
  const duplicate = await postAdults(fixture, studentToken, {
    action: "nominate_adult",
    requestId,
    adultRole: "mentor",
    assigneeUserId: "adult-mentor",
  });
  assert.equal(duplicate.status, 409);

  const teacherInvite = await postAdults(fixture, studentToken, {
    action: "nominate_adult",
    requestId,
    adultRole: "program_teacher",
    assigneeUserId: "adult-teacher",
  });
  assert.equal(teacherInvite.status, 201);
  const teacherAssignmentId = (await teacherInvite.json()).assignmentId;

  const blockedView = await getProjects(fixture, adminToken);
  const blockedRequest = (await blockedView.json()).requests.find((row) => row.requestId === requestId);
  assert.equal(blockedRequest.approvalPreview.approvalReady, false);
  assert.equal(blockedRequest.adultSetup.ready, false);
  const blockedApproval = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    confirmImpact: true,
    approvalToken: blockedRequest.approvalPreview.approvalToken,
  });
  assert.equal(blockedApproval.status, 409);
  assert.equal((await blockedApproval.json()).error, "project_adults_not_ready");

  assert.equal((await postAdults(fixture, mentorToken, {
    action: "accept_adult_invitation",
    assignmentId: mentorAssignmentId,
  })).status, 200);
  assert.equal((await postAdults(fixture, teacherToken, {
    action: "accept_adult_invitation",
    assignmentId: teacherAssignmentId,
  })).status, 200);
  const answeredNotices = await fixture.db.prepare(
    `SELECT user_id, read_at
     FROM user_notifications
     WHERE kind = 'project_adult_invitation'
       AND entity_id = ?
     ORDER BY user_id`,
  ).bind(requestId).all();
  assert.equal(answeredNotices.results.length, 2);
  assert.equal(answeredNotices.results.every((row) => Boolean(row.read_at)), true);

  const readyView = await getProjects(fixture, adminToken);
  const readyRequest = (await readyView.json()).requests.find((row) => row.requestId === requestId);
  assert.equal(readyRequest.adultSetup.ready, true);
  assert.equal(readyRequest.approvalPreview.approvalReady, true);
  const approved = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    confirmImpact: true,
    approvalToken: readyRequest.approvalPreview.approvalToken,
  });
  assert.equal(approved.status, 200);
  const { projectId } = await approved.json();

  const assignments = await fixture.db.prepare(
    `SELECT project_id, request_id, adult_role, assignee_user_id, status
     FROM project_adult_assignments
     WHERE project_id = ?
     ORDER BY adult_role`,
  ).bind(projectId).all();
  assert.deepEqual(assignments.results.map((row) => ({ ...row })), [
    { project_id: projectId, request_id: null, adult_role: "mentor", assignee_user_id: "adult-mentor", status: "accepted" },
    { project_id: projectId, request_id: null, adult_role: "program_teacher", assignee_user_id: "adult-teacher", status: "accepted" },
  ]);
  const mentorScope = await fixture.db.prepare(
    "SELECT active FROM project_mentor_assignments WHERE project_id = ? AND mentor_user_id = 'adult-mentor'",
  ).bind(projectId).first();
  assert.equal(mentorScope.active, 1);
  const movedEvents = await fixture.db.prepare(
    "SELECT COUNT(*) AS count FROM project_adult_assignment_events WHERE action = 'moved_to_project'",
  ).first();
  assert.equal(movedEvents.count, 2);
});

test("adult tags enforce role and school scope, support safe external Mentor linking, and audit staff replacement", async () => {
  const fixture = await createFixture();
  const studentToken = await seedSession(fixture.db, fixture.env, "adult-student");
  const adminToken = await seedSession(fixture.db, fixture.env, "adult-admin");
  const submitted = await postProjects(fixture, studentToken, {
    action: "submit_request",
    siteId: fixture.siteId,
    name: "Community Garden",
    summary: "We will make a garden plan.",
    studentIds: [],
  });
  const { requestId } = await submitted.json();

  const wrongRole = await postAdults(fixture, studentToken, {
    action: "nominate_adult",
    requestId,
    adultRole: "program_teacher",
    assigneeUserId: "adult-mentor",
  });
  assert.equal(wrongRole.status, 409);
  assert.equal((await wrongRole.json()).error, "program_teacher_not_eligible");

  const external = await postAdults(fixture, studentToken, {
    action: "nominate_adult",
    requestId,
    adultRole: "mentor",
    inviteName: "New Mentor",
    inviteEmail: "adult-external@senior-capstone.test",
  });
  assert.equal(external.status, 201);
  const assignmentId = (await external.json()).assignmentId;
  const wrongLink = await postAdults(fixture, adminToken, {
    action: "link_external_mentor",
    assignmentId,
    assigneeUserId: "adult-mentor",
  });
  assert.equal(wrongLink.status, 409);
  assert.equal((await wrongLink.json()).error, "mentor_email_does_not_match_invite");
  await seedUser(fixture.db, { id: "adult-external", displayName: "New Mentor", roleId: "mentor" });
  await fixture.db.prepare("INSERT INTO site_users (site_id, user_id, membership_status) VALUES (?, 'adult-external', 'active')")
    .bind(fixture.siteId).run();
  const linked = await postAdults(fixture, adminToken, {
    action: "link_external_mentor",
    assignmentId,
    assigneeUserId: "adult-external",
  });
  assert.equal(linked.status, 200);

  const noReason = await postAdults(fixture, adminToken, {
    action: "assign_adult",
    requestId,
    adultRole: "mentor",
    assigneeUserId: "adult-mentor",
  });
  assert.equal(noReason.status, 201, "the first confirmed adult does not replace anyone");
  const replacement = await postAdults(fixture, adminToken, {
    action: "assign_adult",
    requestId,
    adultRole: "mentor",
    assigneeUserId: "adult-replacement",
  });
  assert.equal(replacement.status, 400);
  assert.equal((await replacement.json()).error, "replacement_reason_required");
  const replaced = await postAdults(fixture, adminToken, {
    action: "assign_adult",
    requestId,
    adultRole: "mentor",
    assigneeUserId: "adult-replacement",
    reason: "The student asked for the mentor who works on this topic.",
  });
  assert.equal(replaced.status, 201);
  const audit = await fixture.db.prepare(
    `SELECT action, metadata_json FROM audit_events
     WHERE action = 'project_adult_assigned'
     ORDER BY created_at DESC LIMIT 1`,
  ).first();
  assert.equal(audit.action, "project_adult_assigned");
  assert.equal(JSON.parse(audit.metadata_json).adultRole, "mentor");
});

test("approval stays blocked until the project has both confirmed adults, but draft work stays saved", async () => {
  const fixture = await createFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "adult-admin");
  const projectId = "project-adult-student";
  await fixture.db.prepare(
    `INSERT INTO requirements (id, program_id, phase, title, description, required, sort_order, work_scope)
     VALUES ('adult-gate-requirement', 'it', 'phase-1', 'Project plan', 'Write the project plan.', 1, 1, 'project')`,
  ).run();
  await fixture.db.prepare(
    `INSERT INTO submissions (id, student_id, requirement_id, status, version, project_id)
     VALUES ('adult-gate-submission', 'adult-student', 'adult-gate-requirement', 'submitted', 1, ?)`,
  ).bind(projectId).run();
  await fixture.db.prepare(
    `INSERT INTO student_work_responses (id, submission_id, student_id, requirement_id, response_text)
     VALUES ('adult-gate-response', 'adult-gate-submission', 'adult-student', 'adult-gate-requirement', 'This draft stays saved while the adults are confirmed.')`,
  ).run();

  const blocked = await reviewDecision(fixture, adminToken, "adult-gate-submission", "approved");
  assert.equal(blocked.status, 409);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.error, "project_adults_not_ready");
  assert.deepEqual(blockedBody.adultSetup.missingRoles, ["mentor", "program_teacher"]);
  const savedDraft = await fixture.db.prepare(
    "SELECT response_text FROM student_work_responses WHERE submission_id = 'adult-gate-submission'",
  ).first();
  assert.match(savedDraft.response_text, /draft stays saved/i);

  assert.equal((await postAdults(fixture, adminToken, {
    action: "assign_adult",
    projectId,
    adultRole: "mentor",
    assigneeUserId: "adult-mentor",
  })).status, 201);
  assert.equal((await postAdults(fixture, adminToken, {
    action: "assign_adult",
    projectId,
    adultRole: "program_teacher",
    assigneeUserId: "adult-teacher",
  })).status, 201);

  const approved = await reviewDecision(fixture, adminToken, "adult-gate-submission", "approved");
  assert.equal(approved.status, 200);
  assert.equal((await approved.json()).submission.status, "approved");
  const directory = await getProjects(fixture, adminToken);
  const directoryBody = await directory.json();
  assert.equal(directoryBody.summary.missingRequiredAdult, 0);
  assert.equal(directoryBody.summary.adultsReady, 1);
});

async function createFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "project-adult-session-pepper",
    PASSWORD_PEPPER: "project-adult-password-pepper",
  };
  const siteId = "site-adult-test";
  await seedUser(db, { id: "adult-admin", displayName: "Adult Admin", roleId: "global_admin" });
  await seedUser(db, { id: "adult-student", displayName: "Adult Student", roleId: "student" });
  await seedUser(db, { id: "adult-mentor", displayName: "Adult Mentor", roleId: "mentor" });
  await seedUser(db, { id: "adult-replacement", displayName: "Replacement Mentor", roleId: "mentor" });
  await seedUser(db, {
    id: "adult-teacher",
    displayName: "Adult Teacher",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
  });
  await db.prepare(
    "INSERT INTO tenants (id, name, slug, status) VALUES ('tenant-adult-test', 'Adult Test District', 'adult-test', 'active')",
  ).run();
  await db.prepare(
    "INSERT INTO sites (id, tenant_id, name, slug, status) VALUES (?, 'tenant-adult-test', 'Adult Test School', 'adult-test-school', 'active')",
  ).bind(siteId).run();
  await db.prepare("INSERT INTO site_programs (site_id, program_id, active) VALUES (?, 'it', 1)").bind(siteId).run();
  await db.prepare(
    "INSERT INTO groups (id, name, group_type, program_id) VALUES ('group-adult-it', 'Adult IT', 'program', 'it')",
  ).run();
  await db.prepare(
    "INSERT INTO group_memberships (group_id, user_id) VALUES ('group-adult-it', 'adult-student')",
  ).run();
  for (const userId of ["adult-student", "adult-mentor", "adult-replacement", "adult-teacher"]) {
    await db.prepare("INSERT INTO site_users (site_id, user_id, membership_status) VALUES (?, ?, 'active')")
      .bind(siteId, userId).run();
  }
  return { db, env, siteId };
}

function getAdults(fixture, token, params = {}) {
  const url = new URL("https://example.test/api/project-adults");
  if (params.projectId) url.searchParams.set("projectId", params.projectId);
  if (params.requestId) url.searchParams.set("requestId", params.requestId);
  return onAdultsGet({ request: requestWithSession(url.toString(), token), env: fixture.env });
}

function postAdults(fixture, token, body) {
  return onAdultsPost({
    request: requestWithSession("https://example.test/api/project-adults", token, body),
    env: fixture.env,
  });
}

function getProjects(fixture, token) {
  return onProjectsGet({
    request: requestWithSession(`https://example.test/api/projects?siteId=${fixture.siteId}`, token),
    env: fixture.env,
  });
}

function postProjects(fixture, token, body) {
  return onProjectsPost({
    request: requestWithSession("https://example.test/api/projects", token, body),
    env: fixture.env,
  });
}

function reviewDecision(fixture, token, submissionId, decision) {
  return onReviewDecision({
    request: requestWithSession(`https://example.test/api/reviews/${submissionId}/decision`, token, {
      decision,
      feedback: decision === "approved" ? "Accepted. You can start the next step." : "Please make the requested change.",
    }),
    env: fixture.env,
    params: { submissionId },
  });
}

function requestWithSession(url, token, body = undefined) {
  return new Request(url, {
    method: body ? "POST" : "GET",
    headers: {
      cookie: `sc_session=${token}`,
      "cf-connecting-ip": "203.0.113.93",
      "user-agent": "project-adults-test",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
