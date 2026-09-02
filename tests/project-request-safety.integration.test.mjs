import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onProjectsGet, onRequestPost as onProjectsPost } from "../functions/api/projects.ts";
import { seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("a tagged teammate must accept before a confirmed approval can move records", async () => {
  const fixture = await createSafetyFixture();
  const ownerToken = await seedSession(fixture.db, fixture.env, "safety-owner");
  const teammateToken = await seedSession(fixture.db, fixture.env, "safety-teammate");
  const adminToken = await seedSession(fixture.db, fixture.env, "safety-admin");

  await fixture.db.prepare(
    `INSERT INTO submissions (id, student_id, status, project_id)
     VALUES ('safety-submission-owner', 'safety-owner', 'draft', 'project-safety-owner')`,
  ).run();
  await fixture.db.prepare(
    `INSERT INTO submissions (id, student_id, status, project_id)
     VALUES ('safety-submission-teammate', 'safety-teammate', 'submitted', 'project-safety-teammate')`,
  ).run();

  const submitted = await postProjects(fixture, ownerToken, {
    action: "submit_request",
    siteId: "site-project-safety",
    name: "Safe Team Project",
    summary: "We will make a tool that helps our school.",
    studentIds: ["safety-teammate"],
  });
  assert.equal(submitted.status, 201);
  const submittedBody = await submitted.json();
  assert.match(submittedBody.message, /teammates must join/i);
  const requestId = submittedBody.requestId;
  await confirmRequiredAdults(fixture, requestId);

  const teammateView = await getProjects(fixture, teammateToken);
  const teammateBody = await teammateView.json();
  assert.equal(teammateBody.requests.length, 1, "an invited student must be able to see the request");
  assert.equal(teammateBody.requests[0].members.find((member) => member.studentId === "safety-teammate").invitationStatus, "pending");
  assert.deepEqual(teammateBody.requests[0].history.map((event) => event.action), ["submitted"]);

  const beforeAcceptance = await getProjects(fixture, adminToken);
  const beforeBody = await beforeAcceptance.json();
  const blockedPreview = beforeBody.requests.find((request) => request.requestId === requestId).approvalPreview;
  assert.equal(blockedPreview.approvalReady, false);
  assert.equal(blockedPreview.pendingCount, 1);
  assert.equal(blockedPreview.studentCount, 2);
  assert.equal(blockedPreview.recordCount, 2);

  const blockedApproval = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    confirmImpact: true,
    approvalToken: blockedPreview.approvalToken,
  });
  assert.equal(blockedApproval.status, 409);
  assert.equal((await blockedApproval.json()).error, "project_teammates_not_ready");

  const accepted = await postProjects(fixture, teammateToken, {
    action: "accept_project_invitation",
    requestId,
  });
  assert.equal(accepted.status, 200);

  const readyView = await getProjects(fixture, adminToken);
  const readyBody = await readyView.json();
  const readyRequest = readyBody.requests.find((request) => request.requestId === requestId);
  assert.equal(readyRequest.approvalPreview.approvalReady, true);
  assert.equal(readyRequest.approvalPreview.pendingCount, 0);
  assert.equal(readyRequest.approvalPreview.studentsMoving, 2);
  assert.deepEqual(readyRequest.history.map((event) => event.action), ["submitted", "invitation_accepted"]);

  const noConfirmation = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    approvalToken: readyRequest.approvalPreview.approvalToken,
  });
  assert.equal(noConfirmation.status, 400);
  assert.equal((await noConfirmation.json()).error, "project_approval_confirmation_required");

  const stalePreview = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    confirmImpact: true,
    approvalToken: "0".repeat(64),
  });
  assert.equal(stalePreview.status, 409);
  assert.equal((await stalePreview.json()).error, "project_approval_preview_changed");

  const approval = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    feedback: "Approved. Start with your plan.",
    confirmImpact: true,
    approvalToken: readyRequest.approvalPreview.approvalToken,
  });
  assert.equal(approval.status, 200);
  const approvalBody = await approval.json();
  const approvedProjectId = approvalBody.projectId;

  const memberships = await fixture.db.prepare(
    `SELECT student_user_id, project_id FROM project_members
     WHERE student_user_id IN ('safety-owner', 'safety-teammate') AND active = 1
     ORDER BY student_user_id`,
  ).all();
  assert.deepEqual(memberships.results.map((row) => row.project_id), [approvedProjectId, approvedProjectId]);
  const movedSubmissions = await fixture.db.prepare(
    "SELECT DISTINCT project_id FROM submissions WHERE student_id IN ('safety-owner', 'safety-teammate')",
  ).all();
  assert.deepEqual(movedSubmissions.results.map((row) => row.project_id), [approvedProjectId]);
  const moveCount = await fixture.db.prepare(
    "SELECT COUNT(*) AS count FROM project_request_moves WHERE request_id = ?",
  ).bind(requestId).first();
  assert.equal(moveCount.count, 2);

  const undo = await postProjects(fixture, adminToken, {
    action: "undo_project_approval",
    requestId,
    changeReason: "The team was approved by mistake.",
    confirmImpact: true,
  });
  assert.equal(undo.status, 200);

  const restoredMemberships = await fixture.db.prepare(
    `SELECT student_user_id, project_id FROM project_members
     WHERE student_user_id IN ('safety-owner', 'safety-teammate') AND active = 1
     ORDER BY student_user_id`,
  ).all();
  assert.deepEqual(restoredMemberships.results.map((row) => ({ ...row })), [
    { student_user_id: "safety-owner", project_id: "project-safety-owner" },
    { student_user_id: "safety-teammate", project_id: "project-safety-teammate" },
  ]);
  const restoredSubmissions = await fixture.db.prepare(
    "SELECT student_id, project_id FROM submissions WHERE student_id IN ('safety-owner', 'safety-teammate') ORDER BY student_id",
  ).all();
  assert.deepEqual(restoredSubmissions.results.map((row) => ({ ...row })), [
    { student_id: "safety-owner", project_id: "project-safety-owner" },
    { student_id: "safety-teammate", project_id: "project-safety-teammate" },
  ]);
  const requestAfterUndo = await fixture.db.prepare(
    "SELECT status, approval_revert_reason FROM project_requests WHERE id = ?",
  ).bind(requestId).first();
  assert.deepEqual({ ...requestAfterUndo }, {
    status: "cancelled",
    approval_revert_reason: "The team was approved by mistake.",
  });
  const finalEvents = await fixture.db.prepare(
    "SELECT action FROM project_request_events WHERE request_id = ? ORDER BY created_at, id",
  ).bind(requestId).all();
  assert.deepEqual(finalEvents.results.map((event) => event.action), [
    "submitted",
    "invitation_accepted",
    "approved",
    "approval_undone",
  ]);
});

test("a declined teammate invitation keeps project approval locked", async () => {
  const fixture = await createSafetyFixture();
  const ownerToken = await seedSession(fixture.db, fixture.env, "safety-owner");
  const teammateToken = await seedSession(fixture.db, fixture.env, "safety-teammate");
  const adminToken = await seedSession(fixture.db, fixture.env, "safety-admin");
  const submitted = await postProjects(fixture, ownerToken, {
    action: "submit_request",
    siteId: "site-project-safety",
    name: "Declined Team Project",
    summary: "We will make something useful.",
    studentIds: ["safety-teammate"],
  });
  const { requestId } = await submitted.json();
  await confirmRequiredAdults(fixture, requestId);
  assert.equal((await postProjects(fixture, teammateToken, {
    action: "decline_project_invitation",
    requestId,
  })).status, 200);

  const adminView = await getProjects(fixture, adminToken);
  const request = (await adminView.json()).requests.find((row) => row.requestId === requestId);
  assert.equal(request.approvalPreview.approvalReady, false);
  assert.equal(request.approvalPreview.declinedCount, 1);
  const blocked = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    confirmImpact: true,
    approvalToken: request.approvalPreview.approvalToken,
  });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).error, "project_teammates_not_ready");
});

test("undo refuses to overwrite a later project assignment and leaves all records unchanged", async () => {
  const fixture = await createSafetyFixture();
  const ownerToken = await seedSession(fixture.db, fixture.env, "safety-owner");
  const teammateToken = await seedSession(fixture.db, fixture.env, "safety-teammate");
  const adminToken = await seedSession(fixture.db, fixture.env, "safety-admin");
  const submitted = await postProjects(fixture, ownerToken, {
    action: "submit_request",
    siteId: "site-project-safety",
    name: "Later Assignment Project",
    summary: "Test safe recovery rules.",
    studentIds: ["safety-teammate"],
  });
  const { requestId } = await submitted.json();
  await confirmRequiredAdults(fixture, requestId);
  await postProjects(fixture, teammateToken, { action: "accept_project_invitation", requestId });
  const ready = await getProjects(fixture, adminToken);
  const request = (await ready.json()).requests.find((row) => row.requestId === requestId);
  const approved = await postProjects(fixture, adminToken, {
    action: "approve_request",
    requestId,
    confirmImpact: true,
    approvalToken: request.approvalPreview.approvalToken,
  });
  const approvedProjectId = (await approved.json()).projectId;

  await fixture.db.prepare(
    `INSERT INTO projects (id, site_id, name, status, current_phase, created_by)
     VALUES ('later-project', 'site-project-safety', 'Later Project', 'active', 'start', 'safety-admin')`,
  ).run();
  await fixture.db.prepare("UPDATE project_members SET active = 0 WHERE student_user_id = 'safety-teammate'").run();
  await fixture.db.prepare(
    `INSERT INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
     VALUES ('later-project', 'safety-teammate', 'lead', 1, 'safety-admin')`,
  ).run();

  const undo = await postProjects(fixture, adminToken, {
    action: "undo_project_approval",
    requestId,
    changeReason: "Try to undo after a later move.",
    confirmImpact: true,
  });
  assert.equal(undo.status, 409);
  assert.equal((await undo.json()).error, "project_rollback_membership_changed");
  const memberships = await fixture.db.prepare(
    `SELECT student_user_id, project_id FROM project_members
     WHERE student_user_id IN ('safety-owner', 'safety-teammate') AND active = 1
     ORDER BY student_user_id`,
  ).all();
  assert.deepEqual(memberships.results.map((row) => row.project_id), [approvedProjectId, "later-project"]);
  const requestRow = await fixture.db.prepare("SELECT status FROM project_requests WHERE id = ?").bind(requestId).first();
  assert.equal(requestRow.status, "approved");
  const reverted = await fixture.db.prepare(
    "SELECT COUNT(*) AS count FROM project_request_moves WHERE request_id = ? AND reverted_at IS NOT NULL",
  ).bind(requestId).first();
  assert.equal(reverted.count, 0);
});

test("a database failure rolls back the whole approval instead of leaving a half-moved project", async () => {
  const fixture = await createSafetyFixture();
  const ownerToken = await seedSession(fixture.db, fixture.env, "safety-owner");
  const adminToken = await seedSession(fixture.db, fixture.env, "safety-admin");
  const submitted = await postProjects(fixture, ownerToken, {
    action: "submit_request",
    siteId: "site-project-safety",
    name: "Atomic Approval Project",
    summary: "No partial moves should survive a database error.",
    studentIds: [],
  });
  const { requestId } = await submitted.json();
  await confirmRequiredAdults(fixture, requestId);
  const adminView = await getProjects(fixture, adminToken);
  const request = (await adminView.json()).requests.find((row) => row.requestId === requestId);
  const projectCountBefore = await fixture.db.prepare("SELECT COUNT(*) AS count FROM projects").first();

  await fixture.db.prepare(
    `INSERT INTO project_request_moves (
       request_id, student_user_id, from_project_id, from_member_role, to_project_id, approved_by
     ) VALUES (?, 'safety-owner', 'project-safety-owner', 'lead', 'project-safety-owner', 'safety-admin')`,
  ).bind(requestId).run();

  await assert.rejects(
    () => postProjects(fixture, adminToken, {
      action: "approve_request",
      requestId,
      confirmImpact: true,
      approvalToken: request.approvalPreview.approvalToken,
    }),
    /UNIQUE constraint failed: project_request_moves/i,
  );
  const membership = await fixture.db.prepare(
    "SELECT project_id FROM project_members WHERE student_user_id = 'safety-owner' AND active = 1",
  ).first();
  assert.equal(membership.project_id, "project-safety-owner");
  const requestAfterFailure = await fixture.db.prepare(
    "SELECT status, approved_project_id FROM project_requests WHERE id = ?",
  ).bind(requestId).first();
  assert.deepEqual({ ...requestAfterFailure }, { status: "submitted", approved_project_id: null });
  const projectCountAfter = await fixture.db.prepare("SELECT COUNT(*) AS count FROM projects").first();
  assert.equal(projectCountAfter.count, projectCountBefore.count);
  const approvedEvents = await fixture.db.prepare(
    "SELECT COUNT(*) AS count FROM project_request_events WHERE request_id = ? AND action = 'approved'",
  ).bind(requestId).first();
  assert.equal(approvedEvents.count, 0);
});

async function createSafetyFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "project-safety-session-pepper",
    PASSWORD_PEPPER: "project-safety-password-pepper",
  };
  await seedUser(db, { id: "safety-admin", displayName: "Safety Admin", roleId: "global_admin" });
  await seedUser(db, { id: "safety-owner", displayName: "Safety Owner", roleId: "student" });
  await seedUser(db, { id: "safety-teammate", displayName: "Safety Teammate", roleId: "student" });
  await seedUser(db, { id: "safety-mentor", displayName: "Safety Mentor", roleId: "mentor" });
  await seedUser(db, {
    id: "safety-teacher",
    displayName: "Safety Teacher",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
  });
  await db.prepare(
    "INSERT INTO tenants (id, name, slug, status) VALUES ('tenant-project-safety', 'Project Safety District', 'project-safety', 'active')",
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, status, school_year)
     VALUES ('site-project-safety', 'tenant-project-safety', 'Project Safety School', 'project-safety-school', 'active', '2026-2027')`,
  ).run();
  await db.prepare("INSERT INTO site_programs (site_id, program_id, active) VALUES ('site-project-safety', 'it', 1)").run();
  await db.prepare(
    "INSERT INTO groups (id, name, group_type, program_id) VALUES ('group-project-safety', 'Safety IT', 'program', 'it')",
  ).run();
  for (const studentId of ["safety-owner", "safety-teammate"]) {
    await db.prepare(
      "INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('site-project-safety', ?, 'active')",
    ).bind(studentId).run();
    await db.prepare(
      "INSERT INTO group_memberships (group_id, user_id) VALUES ('group-project-safety', ?)",
    ).bind(studentId).run();
  }
  for (const adultId of ["safety-mentor", "safety-teacher"]) {
    await db.prepare(
      "INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('site-project-safety', ?, 'active')",
    ).bind(adultId).run();
  }
  return { db, env };
}

async function confirmRequiredAdults(fixture, requestId) {
  await fixture.db.prepare(
    `INSERT INTO project_adult_assignments (
       id, request_id, site_id, program_id, adult_role, assignee_user_id,
       status, nominated_by, responded_by, responded_at
     ) VALUES
       (?, ?, 'site-project-safety', 'it', 'mentor', 'safety-mentor', 'accepted', 'safety-admin', 'safety-mentor', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
       (?, ?, 'site-project-safety', 'it', 'program_teacher', 'safety-teacher', 'accepted', 'safety-admin', 'safety-teacher', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
  ).bind(`adult-mentor-${requestId}`, requestId, `adult-teacher-${requestId}`, requestId).run();
}

function getProjects(fixture, token) {
  return onProjectsGet({
    request: requestWithSession("https://example.test/api/projects?siteId=site-project-safety", token),
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
      "cf-connecting-ip": "203.0.113.62",
      "user-agent": "project-safety-test",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
