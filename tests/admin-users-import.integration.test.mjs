import assert from "node:assert/strict";
import test from "node:test";

import { sha256Hex, validatePassword, verifyPassword } from "../functions/_lib/crypto.ts";
import { onRequestPost } from "../functions/api/admin/users/import.ts";
import { onRequest as onCompleteReset } from "../functions/api/auth/complete-reset.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";

test("admin users import returns 401 when session is missing", async () => {
  const { env } = createFixture();

  const response = await onRequestPost({
    request: buildJsonRequest("https://example.test/api/admin/users/import", {
      reason: "Initial pilot roster import.",
      users: [studentInput()],
    }),
    env,
    params: {},
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized", ok: false });
});

test("admin users import returns 403 when caller is not admin", async () => {
  const fixture = await createFixtureWithSession({ userId: "mentor-a", roleId: "mentor" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [studentInput()],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden", ok: false });
  assert.equal(fixture.db.data.auditEvents.length, 1);
  assert.equal(fixture.db.data.auditEvents[0].action, "access.scope_validation_rejected");
  assert.equal(fixture.db.data.auditEvents[0].actor_user_id, "mentor-a");
  assert.equal(fixture.db.data.auditEvents[0].metadata.reason, "forbidden");
  assert.equal(fixture.db.data.auditEvents[0].metadata.requiredRole, "global_admin_school_admin_site_admin_or_program_teacher");
});

test("admin users import validates json, reason, users, duplicate emails, and role scopes", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  {
    const response = await onRequestPost({
      request: new Request("https://example.test/api/admin/users/import", {
        method: "POST",
        headers: { cookie: `sc_session=${fixture.token}`, "content-type": "application/json" },
        body: "{not json",
      }),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_json" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        { adminNote: " ", users: [studentInput()] },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "missing_admin_note" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        { reason: "Initial pilot roster import.", users: [] },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "missing_users" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ email: "dupe@senior-capstone.test" }), studentInput({ email: "DUPE@senior-capstone.test" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "duplicate_email" });
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          adminNote: "Initial pilot roster import.",
          users: [studentInput({ roleId: "site_admin", siteIds: [] })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, "site_admin_requires_site_assignment");
  }
});

test("admin users import rejects existing emails and unknown role or scope records before mutation", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("existing-a", "existing@senior-capstone.test", "Existing A"));

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ email: "EXISTING@senior-capstone.test" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "email_already_exists", ok: false });
  }

  {
    const missingRoleFixture = await createFixtureWithSession({
      userId: "admin-b",
      roleId: "admin",
      roles: ["admin"],
    });
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [studentInput({ email: "student-b@senior-capstone.test" })],
        },
        { cookie: `sc_session=${missingRoleFixture.token}` },
      ),
      env: missingRoleFixture.env,
      params: {},
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "role_not_found", ok: false });
    assert.equal(missingRoleFixture.db.data.userAccounts.length, 1);
  }

  {
    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Initial pilot roster import.",
          users: [teacherInput({ scopeId: "missing-program" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "program_not_found");
  }
});

test("admin users import allows real local accounts by default in local-only mode", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [studentInput({ email: "student.real@example.edu", displayName: "Real Student" })],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.importedCount, 1);
  assert.equal(body.users[0].email, "student.real@example.edu");
  assert.equal(body.users[0].delivery, "one_time_admin_display");
  assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "student.real@example.edu"), true);
  assert.equal(fixture.db.data.siteUsers.some((row) => row.user_id === body.users[0].id && row.site_id === "site-a"), true);
  assert.equal(fixture.db.data.auditEvents.some((row) => row.action === "user.create_rejected"), false);
  assert.doesNotMatch(JSON.stringify(fixture.db.data.auditEvents), /student\.real@example\.edu/i);
});

test("production keeps real accounts blocked until operating approvals are recorded", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.env.APP_ENV = "production";
  fixture.env.SESSION_PEPPER = "production-session-pepper-for-test";
  fixture.db.data.sessions[0].token_hash = await sha256Hex(`${fixture.env.SESSION_PEPPER}${fixture.token}`);
  const productionCookie = `__Host-sc_session=${fixture.token}`;

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Try to start a real pilot before approvals.",
        users: [studentInput({ email: "real.student@example.edu", displayName: "Real Student" })],
      },
      { cookie: productionCookie },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "pilot_approval_required");
  assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "real.student@example.edu"), false);
  assert.equal(fixture.db.data.auditEvents.at(-1).metadata.approvalGateEnabled, true);

  fixture.env.REAL_STUDENT_PILOT_APPROVED = "true";
  const approved = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Recorded school approval for the real pilot.",
        users: [studentInput({ email: "real.student@example.edu", displayName: "Real Student" })],
      },
      { cookie: productionCookie },
    ),
    env: fixture.env,
    params: {},
  });
  assert.equal(approved.status, 200);
});

test("admin users import still blocks real local accounts outside local-only mode without explicit override", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.env.AUTH_MODE = "hybrid_google_workspace_local";

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [studentInput({ email: "student.real@example.edu", displayName: "Real Student" })],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, "credential_delivery_policy_required");
  assert.match(body.message, /local-account setup is enabled/i);
  assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "student.real@example.edu"), false);
  assert.equal(fixture.db.data.auditEvents[0].metadata.managedLocalAccountCreationEnabled, false);
  assert.doesNotMatch(JSON.stringify(fixture.db.data.auditEvents), /student\.real@example\.edu/i);
});

test("admin users import allows real non-.test setup codes in hybrid mode with explicit override", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.env.AUTH_MODE = "hybrid_google_workspace_local";
  fixture.env.ALLOW_REAL_TEMP_CREDENTIAL_IMPORT = "true";

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Bryan-approved manual delivery proof.",
        users: [studentInput({ email: "student.allowed@example.edu", displayName: "Allowed Student" })],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.importedCount, 1);
  assert.equal(body.users[0].email, "student.allowed@example.edu");
  assert.equal(body.users[0].delivery, "one_time_admin_display");
  assert.match(body.users[0].setupCode, /^SET-/);
  assert.equal(body.users[0].temporaryPassword, undefined);
  assert.equal(fixture.db.data.auditEvents.some((row) => row.action === "user.create_rejected"), false);
  assert.equal(fixture.db.data.auditEvents.at(-1).metadata.oneTimeSetupCodesIssued, true);
  assert.equal(JSON.stringify(fixture.db.data.auditEvents).includes(body.users[0].setupCode), false);
});

test("admin users import creates pending-reset users, role assignments, credentials, and redacted audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [
          studentInput({ email: "Student.New@senior-capstone.test", displayName: "Student New" }),
          teacherInput({ email: "teacher.new@senior-capstone.test", displayName: "Teacher New" }),
        ],
      },
      {
        cookie: `sc_session=${fixture.token}`,
        "cf-connecting-ip": "203.0.113.91",
        "user-agent": "integration-test",
      },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.importedCount, 2);
  assert.equal(body.users.length, 2);

  const [student, teacher] = body.users;
  assert.equal(student.email, "Student.New@senior-capstone.test");
  assert.equal(student.status, "pending_reset");
  assert.equal(student.mustReset, true);
  assert.equal(student.delivery, "one_time_admin_display");
  assert.deepEqual(student.role, { roleId: "student", scopeType: "global", scopeId: "" });
  assert.match(student.setupCode, /^SET-/);
  assert.match(teacher.setupCode, /^SET-/);
  assert.equal(student.temporaryPassword, undefined);
  assert.equal(teacher.temporaryPassword, undefined);
  assert.notEqual(student.setupCode, teacher.setupCode);
  assert.match(student.id, /^user_/);

  const createdStudent = fixture.db.data.userAccounts.find((row) => row.id === student.id);
  const createdTeacher = fixture.db.data.userAccounts.find((row) => row.id === teacher.id);
  assert.equal(createdStudent.status, "pending_reset");
  assert.equal(createdStudent.email_norm, "student.new@senior-capstone.test");
  assert.equal(createdTeacher.status, "pending_reset");

  const studentCredential = fixture.db.data.passwordCredentials.find((row) => row.user_id === student.id);
  assert.equal(studentCredential.requires_reset, 1);
  assert.equal(studentCredential.password_version, 1);
  assert.equal(await verifyPassword(student.setupCode, studentCredential.password_hash, studentCredential.password_salt, ""), false);

  assert.equal(
    fixture.db.data.userRoles.some(
      (row) => row.user_id === student.id && row.role_id === "student" && row.scope_type === "global" && row.scope_id === "",
    ),
    true,
  );
  assert.equal(
    fixture.db.data.userRoles.some(
      (row) => row.user_id === teacher.id && row.role_id === "program_teacher" && row.scope_type === "program" && row.scope_id === "it",
    ),
    true,
  );

  assert.equal(fixture.db.data.auditEvents.length, 3);
  assert.equal(fixture.db.data.auditEvents[0].action, "user.created");
  assert.equal(fixture.db.data.auditEvents[1].action, "user.created");
  assert.equal(fixture.db.data.auditEvents[2].action, "user.create_batch_completed");

  const auditJson = JSON.stringify(fixture.db.data.auditEvents);
  assert.equal(auditJson.includes(student.setupCode), false);
  assert.equal(auditJson.includes(teacher.setupCode), false);
  assert.equal(fixture.db.data.auditEvents[0].metadata.oneTimeSetupCodeIssued, true);
  assert.equal(fixture.db.data.auditEvents[2].metadata.importedCount, 2);
});

test("admin users import persists student roster profile fields and creates scoped mentor/viewer assignments", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  seedScopedStaff(fixture.db, { userId: "mentor-scope", roleId: "mentor", siteId: "site-a", email: "mentor.scope@senior-capstone.test" });
  seedScopedStaff(fixture.db, { userId: "viewer-scope", roleId: "viewer", siteId: "site-a", email: "viewer.scope@senior-capstone.test" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Create demo-ready student with roster profile and scoped support.",
        users: [
          studentInput({
            email: "student.profile@senior-capstone.test",
            displayName: "Student Profile",
            cohort: "Class of 2026",
            graduationYear: "2026",
            mentorUserId: "mentor-scope",
            viewerUserId: "viewer-scope",
          }),
        ],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.importedCount, 1);
  assert.equal(body.summary.studentsCreated, 1);
  assert.equal(body.summary.mentorAssignmentsCreated, 1);
  assert.equal(body.summary.viewerAssignmentsCreated, 1);
  const created = body.users[0];
  assert.equal(created.studentProfile.cohort, "Class of 2026");
  assert.equal(created.studentProfile.graduationYear, "2026");
  assert.equal(created.assignmentSummary.mentorAssignmentsCreated, 1);
  assert.equal(created.assignmentSummary.viewerAssignmentsCreated, 1);
  assert.deepEqual(
    fixture.db.data.studentRosterProfiles.find((row) => row.student_user_id === created.id),
    {
      student_user_id: created.id,
      cohort: "Class of 2026",
      graduation_year: "2026",
    },
  );
  assert.equal(fixture.db.data.mentorAssignments.some((row) => row.mentor_user_id === "mentor-scope" && row.student_user_id === created.id && Number(row.active) === 1), true);
  assert.equal(fixture.db.data.viewerStudentAssignments.some((row) => row.viewer_user_id === "viewer-scope" && row.student_user_id === created.id && Number(row.active) === 1), true);
  assert.equal(fixture.db.data.siteUsers.some((row) => row.site_id === "site-a" && row.user_id === "mentor-scope" && row.membership_status === "active"), true);
  assert.equal(fixture.db.data.siteUsers.some((row) => row.site_id === "site-a" && row.user_id === "viewer-scope" && row.membership_status === "active"), true);
});

test("student import creates a project and records both required project adults when supplied", async () => {
  const fixture = await createFixtureWithSession({
    userId: "admin-import-adults",
    roleId: "global_admin",
    roles: ["student", "mentor", "program_teacher", "global_admin"],
  });
  seedScopedStaff(fixture.db, {
    userId: "mentor-import-adults",
    roleId: "mentor",
    siteId: "site-a",
    email: "mentor-import-adults@senior-capstone.test",
  });
  fixture.db.data.userAccounts.push(buildUser(
    "teacher-import-adults",
    "teacher-import-adults@senior-capstone.test",
    "Teacher Import Adults",
  ));
  fixture.db.data.userRoles.push({
    user_id: "teacher-import-adults",
    role_id: "program_teacher",
    scope_type: "program",
    scope_id: "it",
  });
  fixture.db.data.siteUsers.push({
    site_id: "site-a",
    user_id: "teacher-import-adults",
    membership_status: "active",
  });

  const response = await onRequestPost({
    request: buildJsonRequest("https://example.test/api/admin/users/import", {
      adminNote: "Create a student project with both required adults.",
      users: [studentInput({
        email: "project-adults-student@senior-capstone.test",
        programIds: ["it"],
        mentorUserId: "mentor-import-adults",
        programTeacherUserId: "teacher-import-adults",
      })],
    }, { cookie: `sc_session=${fixture.token}` }),
    env: fixture.env,
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.summary.projectMentorsCreated, 1);
  assert.equal(body.summary.projectProgramTeachersCreated, 1);
  assert.equal(fixture.db.data.projects.length, 1);
  assert.equal(fixture.db.data.projectMembers.length, 1);
  assert.deepEqual(
    fixture.db.data.projectAdultAssignments.map((row) => row.adult_role).sort(),
    ["mentor", "program_teacher"],
  );
});

test("admin users import blocks student creation until roster profile migration is applied", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.studentRosterProfilesTableExists = false;

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Create demo-ready student with roster profile.",
        users: [
          studentInput({
            email: "student.needs-migration@senior-capstone.test",
            displayName: "Student Needs Migration",
            cohort: "Class of 2026",
            graduationYear: "2026",
          }),
        ],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, "student_roster_profiles_migration_required");
  assert.match(body.message, /0016_student_roster_profiles\.sql/);
  assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "student.needs-migration@senior-capstone.test"), false);
  assert.equal(fixture.db.data.studentRosterProfiles.length, 0);
});

test("admin users import blocks unsafe student mentor/viewer assignment targets", async () => {
  {
    const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
    seedScopedStaff(fixture.db, { userId: "student-target", roleId: "student", siteId: "site-a", email: "student.target@senior-capstone.test" });

    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Student target must not become mentor.",
          users: [studentInput({ email: "student.badmentor@senior-capstone.test", mentorUserId: "student-target" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });

    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "mentor_assignment_target_forbidden");
    assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "student.badmentor@senior-capstone.test"), false);
  }

  {
    const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
    fixture.db.data.sites.push({ id: "site-b", status: "active" });
    seedScopedStaff(fixture.db, { userId: "mentor-other-site", roleId: "mentor", siteId: "site-b", email: "mentor.other@senior-capstone.test" });

    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Out-of-scope mentor must be blocked.",
          users: [studentInput({ email: "student.outscope@senior-capstone.test", mentorUserId: "mentor-other-site" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });

    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, "mentor_assignment_target_forbidden");
    assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "student.outscope@senior-capstone.test"), false);
  }

  {
    const fixture = await createFixtureWithSession({ userId: "program-teacher-a", roleId: "program_teacher" });
    const actorRole = fixture.db.data.userRoles.find((row) => row.user_id === "program-teacher-a" && row.role_id === "program_teacher");
    actorRole.scope_type = "program";
    actorRole.scope_id = "it";
    fixture.db.data.siteUsers.push({ site_id: "site-a", user_id: "program-teacher-a", membership_status: "active" });
    seedScopedStaff(fixture.db, { userId: "viewer-scope", roleId: "viewer", siteId: "site-a", email: "viewer.scope@senior-capstone.test" });

    const response = await onRequestPost({
      request: buildJsonRequest(
        "https://example.test/api/admin/users/import",
        {
          reason: "Program Teacher cannot create broad viewer assignment.",
          users: [studentInput({ email: "student.viewerblocked@senior-capstone.test", viewerUserId: "viewer-scope" })],
        },
        { cookie: `sc_session=${fixture.token}` },
      ),
      env: fixture.env,
      params: {},
    });

    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, "viewer_student_forbidden");
    assert.equal(fixture.db.data.userAccounts.some((row) => row.email_norm === "student.viewerblocked@senior-capstone.test"), false);
  }
});

test("admin users import accepts V5 global, site, administration, and viewer roles for fake test users", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  fixture.db.data.userAccounts.push(buildUser("student-scope", "student.scope@senior-capstone.test", "Student Scope"));
  fixture.db.data.userRoles.push({ user_id: "student-scope", role_id: "student", scope_type: "global", scope_id: "" });
  fixture.db.data.siteUsers.push({ site_id: "site-a", user_id: "student-scope", membership_status: "active" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        adminNote: "Synthetic multisite role fixture import.",
        users: [
          studentInput({ email: "global.admin@senior-capstone.test", displayName: "Global Admin", roleId: "global_admin", globalAdminConfirmation: true }),
          studentInput({ email: "site.admin@senior-capstone.test", displayName: "Site Admin", roleId: "site_admin", siteIds: ["site-a"] }),
          studentInput({ email: "administration@senior-capstone.test", displayName: "School Admin", roleId: "administration", siteIds: ["site-a"] }),
          studentInput({ email: "viewer@senior-capstone.test", displayName: "Viewer", roleId: "viewer", studentIds: ["student-scope"] }),
        ],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.importedCount, 4);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "global_admin" && row.scope_type === "global"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "site_admin" && row.scope_type === "site" && row.scope_id === "site-a"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "administration" && row.scope_type === "site" && row.scope_id === "site-a"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.role_id === "viewer" && row.scope_type === "global"), true);
  assert.equal(fixture.db.data.viewerStudentAssignments.some((row) => row.student_user_id === "student-scope" && Number(row.active) === 1), true);
});

test("School Admin can create mentors and Program Teachers for an assigned school", async () => {
  const fixture = await createFixtureWithSession({ userId: "school-admin-a", roleId: "administration" });
  const actorRole = fixture.db.data.userRoles.find((row) => row.user_id === "school-admin-a" && row.role_id === "administration");
  actorRole.scope_type = "site";
  actorRole.scope_id = "site-a";
  fixture.db.data.siteUsers.push({ site_id: "site-a", user_id: "school-admin-a", membership_status: "active" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        adminNote: "School admin adds staff for the test school.",
        users: [
          studentInput({ email: "mentor.school@senior-capstone.test", displayName: "School Mentor", roleId: "mentor", siteIds: ["site-a"] }),
          teacherInput({ email: "teacher.school@senior-capstone.test", displayName: "School Program Teacher", programIds: ["it"] }),
        ],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.importedCount, 2);
  const mentor = body.users.find((user) => user.email === "mentor.school@senior-capstone.test");
  const teacher = body.users.find((user) => user.email === "teacher.school@senior-capstone.test");
  assert.equal(fixture.db.data.userRoles.some((row) => row.user_id === mentor.id && row.role_id === "mentor"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.user_id === teacher.id && row.role_id === "program_teacher" && row.scope_type === "program" && row.scope_id === "it"), true);
  assert.equal(fixture.db.data.siteUsers.some((row) => row.site_id === "site-a" && row.user_id === mentor.id && row.membership_status === "active"), true);
  assert.equal(fixture.db.data.siteUsers.some((row) => row.site_id === "site-a" && row.user_id === teacher.id && row.membership_status === "active"), true);
});

test("Site Admin can create scoped Administration and inactive accounts stay disabled", async () => {
  const fixture = await createFixtureWithSession({ userId: "site-admin-a", roleId: "site_admin" });
  const actorRole = fixture.db.data.userRoles.find((row) => row.user_id === "site-admin-a" && row.role_id === "site_admin");
  actorRole.scope_type = "site";
  actorRole.scope_id = "site-a";
  fixture.db.data.siteUsers.push({ site_id: "site-a", user_id: "site-admin-a", membership_status: "active" });

  const response = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        adminNote: "Site admin adds scoped school operations staff.",
        users: [
          studentInput({
            email: "administration.site@senior-capstone.test",
            displayName: "Site Administration",
            roleId: "administration",
            siteIds: ["site-a"],
            status: "inactive",
          }),
        ],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.importedCount, 1);
  const created = body.users[0];
  assert.equal(created.role.roleId, "administration");
  assert.equal(created.status, "disabled");
  assert.equal(created.temporaryPassword, undefined);
  assert.equal(fixture.db.data.passwordCredentials.some((row) => row.user_id === created.id), false);
  assert.equal(fixture.db.data.userRoles.some((row) => row.user_id === created.id && row.role_id === "administration" && row.scope_type === "site" && row.scope_id === "site-a"), true);
});

test("Program Teacher can create students and mentors but not Program Teachers", async () => {
  const fixture = await createFixtureWithSession({ userId: "program-teacher-a", roleId: "program_teacher" });
  const actorRole = fixture.db.data.userRoles.find((row) => row.user_id === "program-teacher-a" && row.role_id === "program_teacher");
  actorRole.scope_type = "program";
  actorRole.scope_id = "it";
  fixture.db.data.siteUsers.push({ site_id: "site-a", user_id: "program-teacher-a", membership_status: "active" });

  const allowed = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        adminNote: "Program teacher maintains the local roster.",
        users: [
          studentInput({ email: "student.program@senior-capstone.test", displayName: "Program Student", siteIds: ["site-a"] }),
          studentInput({ email: "mentor.program@senior-capstone.test", displayName: "Program Mentor", roleId: "mentor", siteIds: ["site-a"] }),
        ],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(allowed.status, 200);
  const allowedBody = await allowed.json();
  assert.equal(allowedBody.importedCount, 2);
  const student = allowedBody.users.find((user) => user.email === "student.program@senior-capstone.test");
  const mentor = allowedBody.users.find((user) => user.email === "mentor.program@senior-capstone.test");
  assert.equal(fixture.db.data.userRoles.some((row) => row.user_id === student.id && row.role_id === "student"), true);
  assert.equal(fixture.db.data.userRoles.some((row) => row.user_id === mentor.id && row.role_id === "mentor"), true);

  const blocked = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        adminNote: "Program teacher should not create another teacher.",
        users: [teacherInput({ email: "teacher.program.blocked@senior-capstone.test", displayName: "Blocked Program Teacher", programIds: ["it"] })],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error, "program_assignment_forbidden");
});

test("admin users import enforces reset-first login and keeps credential values out of audits", async () => {
  const fixture = await createFixtureWithSession({ userId: "admin-a", roleId: "admin" });
  const newPassword = "Ready-For-Capstone-2026!";

  const importResponse = await onRequestPost({
    request: buildJsonRequest(
      "https://example.test/api/admin/users/import",
      {
        reason: "Initial pilot roster import.",
        users: [studentInput({ email: "reset.first@senior-capstone.test", displayName: "Reset First" })],
      },
      { cookie: `sc_session=${fixture.token}` },
    ),
    env: fixture.env,
    params: {},
  });

  assert.equal(importResponse.status, 200);
  assert.equal(importResponse.headers.get("cache-control"), "no-store");
  const importBody = await importResponse.json();
  const importedUser = importBody.users[0];
  assert.equal(importedUser.status, "pending_reset");
  assert.equal(importedUser.mustReset, true);
  assert.equal(importedUser.delivery, "one_time_admin_display");

  const createdUser = fixture.db.data.userAccounts.find((row) => row.id === importedUser.id);
  const credential = fixture.db.data.passwordCredentials.find((row) => row.user_id === importedUser.id);
  assert.equal(createdUser.status, "pending_reset");
  assert.equal(credential.requires_reset, 1);
  assert.match(importedUser.setupCode, /^SET-/);
  assert.equal(importedUser.temporaryPassword, undefined);
  assert.equal(await verifyPassword(importedUser.setupCode, credential.password_hash, credential.password_salt, ""), false);

  const resetRequiredLogin = await onLogin({
    request: buildJsonRequest("https://example.test/api/auth/login", {
      email: importedUser.email,
      password: importedUser.setupCode,
    }),
    env: fixture.env,
  });
  assert.equal(resetRequiredLogin.status, 401);
  assert.deepEqual(await resetRequiredLogin.json(), { error: "invalid_credentials" });

  const resetResponse = await onCompleteReset({
    request: buildJsonRequest("https://example.test/api/auth/complete-reset", {
      email: importedUser.email,
      currentPassword: importedUser.setupCode,
      newPassword,
    }),
    env: fixture.env,
  });
  assert.equal(resetResponse.status, 200);
  const resetCookie = resetResponse.headers.get("set-cookie")?.split(";")[0];
  assert.ok(resetCookie);
  assert.equal(createdUser.status, "active");
  assert.equal(credential.requires_reset, 0);
  assert.equal(credential.password_version, 2);
  assert.equal(await verifyPassword(newPassword, credential.password_hash, credential.password_salt, ""), true);

  const oldTemporaryPasswordLogin = await onLogin({
    request: buildJsonRequest("https://example.test/api/auth/login", {
      email: importedUser.email,
      password: importedUser.setupCode,
    }),
    env: fixture.env,
  });
  assert.equal(oldTemporaryPasswordLogin.status, 401);

  const normalLoginCookie = await loginAndExtractCookie({
    env: fixture.env,
    email: importedUser.email,
    password: newPassword,
  });
  assert.match(normalLoginCookie, /^sc_session=/);

  const meResponse = await onMe({
    request: new Request("https://example.test/api/auth/me", { headers: { cookie: resetCookie } }),
    env: fixture.env,
  });
  assert.equal(meResponse.status, 200);
  const meBody = await meResponse.json();
  assert.equal(meBody.authenticated, true);
  assert.equal(meBody.user.email, importedUser.email);
  assert.equal(meBody.user.roles.some((row) => row.role_id === "student"), true);

  const auditJson = JSON.stringify(fixture.db.data.auditEvents);
  assert.equal(auditJson.includes(importedUser.setupCode), false);
  assert.equal(auditJson.includes(newPassword), false);
  assert.equal(fixture.db.data.auditEvents.some((row) => row.action === "password_reset_completed"), true);
});

function studentInput(overrides = {}) {
  return {
    email: "student-a@senior-capstone.test",
    displayName: "Student A",
    roleId: "student",
    scopeType: "global",
    scopeId: "",
    siteIds: ["site-a"],
    ...overrides,
  };
}

function teacherInput(overrides = {}) {
  return {
    email: "teacher-a@senior-capstone.test",
    displayName: "Teacher A",
    roleId: "program_teacher",
    scopeType: "program",
    scopeId: "it",
    ...overrides,
  };
}

function buildJsonRequest(url, data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(data),
  });
}

async function loginAndExtractCookie({ env, email, password }) {
  const response = await onLogin({
    request: buildJsonRequest("https://example.test/api/auth/login", { email, password }),
    env,
  });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  return setCookie.split(";")[0];
}

function createFixture(options = {}) {
  const db = new MockD1Database({
    userAccounts: [],
    passwordCredentials: [],
    passwordSetupTokens: [],
    loginAttempts: [],
    sessions: [],
    userRoles: [],
    roles: (options.roles ?? [
      "student",
      "mentor",
      "program_teacher",
      "site_admin",
      "administration",
      "global_admin",
      "viewer",
      "admin",
      "misc_admin",
    ]).map((id) => ({ id })),
    programs: [{ id: "it" }],
    sites: [{ id: "site-a", status: "active" }],
    sitePrograms: [{ site_id: "site-a", program_id: "it", active: 1 }],
    siteUsers: [],
    mentorAssignments: [],
    projects: [],
    projectMembers: [],
    projectAdultAssignments: [],
    projectAdultAssignmentEvents: [],
    userNotifications: [],
    projectMentorAssignments: [],
    viewerStudentAssignments: [],
    studentRosterProfiles: [],
    studentRosterProfilesTableExists: true,
    authIdentities: [],
    cohorts: [{ id: "cohort-a" }],
    auditEvents: [],
  });

  return { env: { DB: db, SESSION_PEPPER: "", PASSWORD_PEPPER: "" }, db };
}

async function createFixtureWithSession({ userId, roleId, roles }) {
  const base = createFixture({ roles });
  const token = `token-${userId}`;
  const tokenHash = await sha256Hex(token);

  base.db.data.userAccounts.push(buildUser(userId, `${userId}@senior-capstone.test`, userId));
  base.db.data.sessions.push({
    id: `sess-${userId}`,
    user_id: userId,
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: new Date("2099-01-01T00:00:00.000Z").toISOString(),
  });
  base.db.data.userRoles.push({
    user_id: userId,
    role_id: roleId,
    scope_type: "global",
    scope_id: "",
  });
  base.db.data.passwordCredentials.push({
    user_id: userId,
    password_hash: "session-user-hash",
    password_salt: "session-user-salt",
    algorithm: "pbkdf2-sha256",
    iterations: 1,
    password_version: 1,
    requires_reset: 0,
  });

  return { ...base, token };
}

function buildUser(id, email = `${id}@senior-capstone.test`, displayName = id, status = "active") {
  return {
    id,
    email,
    email_norm: email.trim().toLowerCase(),
    display_name: displayName,
    status,
  };
}

function seedScopedStaff(db, { userId, roleId, siteId, email }) {
  db.data.userAccounts.push(buildUser(userId, email, userId));
  db.data.userRoles.push({ user_id: userId, role_id: roleId, scope_type: "global", scope_id: "" });
  db.data.siteUsers.push({ site_id: siteId, user_id: userId, membership_status: "active" });
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

class MockD1Database {
  constructor(data) {
    this.data = data;
  }

  prepare(sql) {
    return new MockPreparedStatement(sql, this.data);
  }

  nowIso() {
    return new Date().toISOString();
  }
}

class MockPreparedStatement {
  constructor(sql, data) {
    this.sql = normalizeSql(sql);
    this.data = data;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    if (this.sql.startsWith("select name from sqlite_master where type = 'table' and name = 'student_roster_profiles'")) {
      return this.data.studentRosterProfilesTableExists ? { name: "student_roster_profiles" } : null;
    }

    if (this.sql.startsWith("select 1 from password_credentials where user_id = ? limit 1")) {
      const [userId] = this.params.map(String);
      return this.data.passwordCredentials.some((row) => row.user_id === userId) ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select 1 from auth_identities where user_id = ?")) {
      const [userId] = this.params.map(String);
      return this.data.authIdentities.some((row) => row.user_id === userId && row.provider !== "local_password") ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select count(*) as count from login_attempts")) {
      const [identifierHash] = this.params;
      const count = this.data.loginAttempts.filter(
        (row) => row.identifier_hash === identifierHash && row.success === 0,
      ).length;
      return { count };
    }

    if (this.sql.includes("from user_accounts u join password_credentials c")) {
      const [emailNorm] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.email_norm === emailNorm);
      if (!user) return null;
      const credential = this.data.passwordCredentials.find((row) => row.user_id === user.id);
      if (!credential) return null;
      return {
        user_id: user.id,
        email: user.email,
        email_norm: user.email_norm,
        display_name: user.display_name,
        status: user.status,
        password_hash: credential.password_hash,
        password_salt: credential.password_salt,
        algorithm: credential.algorithm,
        iterations: credential.iterations,
        password_version: credential.password_version ?? 1,
        requires_reset: credential.requires_reset ?? 0,
      };
    }

    if (this.sql.startsWith("select id, user_id, token_hash, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params.map(String);
      return this.data.sessions.find((row) => row.token_hash === tokenHash && !row.revoked_at) ?? null;
    }

    if (this.sql.startsWith("select id, user_id, expires_at, revoked_at from sessions where token_hash = ?")) {
      const [tokenHash] = this.params.map(String);
      return this.data.sessions.find((row) => row.token_hash === tokenHash) ?? null;
    }

    if (this.sql.includes("from user_accounts left join password_credentials")) {
      const [userId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === userId);
      const credential = this.data.passwordCredentials.find((row) => row.user_id === userId);
      return user
        ? {
            id: user.id,
            email: user.email,
            email_norm: user.email_norm,
            display_name: user.display_name,
            status: user.status,
            requires_reset: credential?.requires_reset ?? 0,
          }
        : null;
    }

    if (this.sql.startsWith("select id, email, email_norm, display_name, status from user_accounts where id = ? and status = 'active'")) {
      const [userId] = this.params.map(String);
      return this.data.userAccounts.find((row) => row.id === userId && row.status === "active") ?? null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id = ? limit 1")) {
      const [userId, roleId] = this.params.map(String);
      const exists = this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id from auth_password_setup_tokens")) {
      const [userId, tokenHash] = this.params.map(String);
      const now = Date.now();
      return this.data.passwordSetupTokens.find((row) => (
        row.user_id === userId
        && row.token_hash === tokenHash
        && !row.used_at
        && new Date(row.expires_at).getTime() > now
      )) ?? null;
    }

    if (this.sql.startsWith("select 1 from user_roles where user_id = ? and role_id in (")) {
      const [userId, ...roleIds] = this.params.map(String);
      const exists = this.data.userRoles.some((row) => row.user_id === userId && roleIds.includes(row.role_id));
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id from user_accounts where email_norm = ? limit 1")) {
      const [emailNorm] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.email_norm === emailNorm);
      return user ? { id: user.id } : null;
    }

    if (this.sql.startsWith("select id from roles where id = ? limit 1")) {
      const [roleId] = this.params.map(String);
      const role = this.data.roles.find((row) => row.id === roleId);
      return role ? { id: role.id } : null;
    }

    if (this.sql.startsWith("select 1 from sites where id = ? and status = 'active' limit 1")) {
      const [siteId] = this.params.map(String);
      return this.data.sites.some((row) => row.id === siteId && row.status === "active") ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select user_accounts.id from user_accounts join user_roles target_role") && this.sql.includes("target_role.role_id = 'program_teacher'")) {
      const [programIdsJson, targetUserIdValue] = this.params;
      const targetUserId = String(targetUserIdValue);
      const programIds = JSON.parse(String(programIdsJson));
      const user = this.data.userAccounts.find((row) => row.id === targetUserId && ["active", "pending_reset"].includes(row.status));
      const hasProgramRole = this.data.userRoles.some((row) => row.user_id === targetUserId && row.role_id === "program_teacher" && row.scope_type === "program" && programIds.includes(row.scope_id));
      const elevated = this.data.userRoles.some((row) => row.user_id === targetUserId && ["global_admin", "admin", "platform_admin"].includes(row.role_id));
      return user && hasProgramRole && !elevated ? { id: targetUserId } : null;
    }

    if (this.sql.startsWith("select user_accounts.id from user_accounts join user_roles target_role")) {
      const targetRoleId = String(this.params[0]);
      const targetUserId = String(this.params.at(-1));
      const siteIds = this.params.slice(1, -1).map(String);
      const user = this.data.userAccounts.find((row) => row.id === targetUserId && ["active", "pending_reset"].includes(row.status));
      const hasRole = this.data.userRoles.some((row) => row.user_id === targetUserId && row.role_id === targetRoleId);
      const inSite = this.data.siteUsers.some((row) => row.user_id === targetUserId && siteIds.includes(row.site_id) && row.membership_status === "active");
      const elevated = this.data.userRoles.some((row) => row.user_id === targetUserId && ["global_admin", "admin", "platform_admin"].includes(row.role_id));
      return user && hasRole && inSite && !elevated ? { id: targetUserId } : null;
    }

    if (this.sql.startsWith("select 1 from mentor_assignments where mentor_user_id = ?")) {
      const [mentorUserId, studentUserId] = this.params.map(String);
      const exists = this.data.mentorAssignments.some((row) => row.mentor_user_id === mentorUserId && row.student_user_id === studentUserId && Number(row.active) === 1);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select 1 from viewer_student_assignments where viewer_user_id = ?")) {
      const [viewerUserId, studentUserId] = this.params.map(String);
      const exists = this.data.viewerStudentAssignments.some((row) => row.viewer_user_id === viewerUserId && row.student_user_id === studentUserId && Number(row.active) === 1);
      return exists ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select 1 from user_accounts join user_roles")) {
      const [studentId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === studentId && row.status === "active");
      const role = this.data.userRoles.find((row) => row.user_id === studentId && row.role_id === "student");
      return user && role ? { ok: 1 } : null;
    }

    if (this.sql.startsWith("select id from programs where id = ? limit 1")) {
      const [programId] = this.params.map(String);
      const program = this.data.programs.find((row) => row.id === programId);
      return program ? { id: program.id } : null;
    }

    if (this.sql.startsWith("select id from cohorts where id = ? limit 1")) {
      const [cohortId] = this.params.map(String);
      const cohort = this.data.cohorts.find((row) => row.id === cohortId);
      return cohort ? { id: cohort.id } : null;
    }

    throw new Error(`Unmocked D1 first() query: ${this.sql}`);
  }

  async all() {
    if (this.sql.startsWith("select role_id, scope_type, scope_id from user_roles where user_id = ?")) {
      const [userId] = this.params.map(String);
      return {
        results: this.data.userRoles.filter((row) => row.user_id === userId),
      };
    }

    if (this.sql.startsWith("select id from sites where status = 'active'")) {
      return { results: this.data.sites.filter((row) => row.status === "active").map((row) => ({ id: row.id })) };
    }

    if (this.sql.startsWith("select distinct student.id from site_users")) {
      const siteIds = this.params.map(String);
      return {
        results: this.data.siteUsers
          .filter((row) => siteIds.includes(row.site_id) && row.membership_status === "active")
          .filter((row) => this.data.userRoles.some((role) => role.user_id === row.user_id && role.role_id === "student"))
          .map((row) => ({ id: row.user_id })),
      };
    }

    if (this.sql.startsWith("select id from programs where active = 1")) {
      return { results: this.data.programs.map((row) => ({ id: row.id })) };
    }

    if (this.sql.startsWith("select distinct user_accounts.id from user_accounts join user_roles")) {
      return { results: [] };
    }

    if (this.sql.startsWith("select user_accounts.id from user_accounts join user_roles")) {
      return {
        results: this.data.userRoles
          .filter((row) => row.role_id === "student")
          .map((row) => ({ id: row.user_id })),
      };
    }

    if (this.sql.startsWith("select site_users.site_id as id from site_users")) {
      const [userId] = this.params.map(String);
      return {
        results: this.data.siteUsers
          .filter((row) => row.user_id === userId && row.membership_status !== "inactive")
          .map((row) => ({ id: row.site_id })),
      };
    }

    if (this.sql.startsWith("select sites.id from site_programs")) {
      const [programId] = this.params.map(String);
      return {
        results: this.data.sitePrograms
          .filter((row) => row.program_id === programId && Number(row.active) === 1)
          .filter((row) => this.data.sites.some((site) => site.id === row.site_id && site.status === "active"))
          .map((row) => ({ id: row.site_id })),
      };
    }

    if (this.sql.startsWith("select distinct site_programs.site_id as id")) {
      const programIds = this.params.map(String);
      return {
        results: this.data.sitePrograms
          .filter((row) => programIds.includes(row.program_id) && Number(row.active) === 1)
          .filter((row) => this.data.sites.some((site) => site.id === row.site_id && site.status === "active"))
          .map((row) => ({ id: row.site_id })),
      };
    }

    if (this.sql.startsWith("select distinct site_users.site_id as id from mentor_assignments")) {
      return { results: [] };
    }

    if (this.sql.startsWith("select distinct student_user_id as id from mentor_assignments")) {
      const [mentorId] = this.params.map(String);
      return {
        results: this.data.mentorAssignments
          .filter((row) => row.mentor_user_id === mentorId && Number(row.active) === 1)
          .map((row) => ({ id: row.student_user_id })),
      };
    }

    if (this.sql.startsWith("select distinct site_users.site_id as id from viewer_student_assignments")) {
      return { results: [] };
    }

    if (this.sql.startsWith("select distinct viewer_student_assignments.student_user_id as id")) {
      const [viewerId] = this.params.map(String);
      return {
        results: this.data.viewerStudentAssignments
          .filter((row) => row.viewer_user_id === viewerId && Number(row.active) === 1)
          .map((row) => ({ id: row.student_user_id })),
      };
    }

    if (this.sql.startsWith("select distinct site_users.site_id as id")) {
      const studentIds = this.params.map(String);
      return {
        results: this.data.siteUsers
          .filter((row) => studentIds.includes(row.user_id) && row.membership_status !== "inactive")
          .map((row) => ({ id: row.site_id })),
      };
    }

    throw new Error(`Unmocked D1 all() query: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("delete from sessions where user_id = ?")) {
      return { success: true };
    }

    if (this.sql.startsWith("update sessions set revoked_at = strftime") && this.sql.includes("limit -1 offset 9")) {
      return { success: true };
    }

    if (this.sql.startsWith("insert into login_attempts")) {
      const [id, identifierHash, ipHash, success, reason] = this.params;
      this.data.loginAttempts.push({
        id: String(id),
        identifier_hash: String(identifierHash),
        ip_hash: String(ipHash),
        success: Number(success),
        reason,
        created_at: new Date().toISOString(),
      });
      return { success: true };
    }

    if (this.sql.startsWith("update sessions set last_seen_at = strftime(")) {
      return { success: true };
    }

    if (this.sql.startsWith("insert into sessions")) {
      const [id, userId, tokenHash, expiresAt, ipHash, userAgentHash] = this.params;
      this.data.sessions.push({
        id: String(id),
        user_id: String(userId),
        token_hash: String(tokenHash),
        expires_at: String(expiresAt),
        revoked_at: null,
        ip_hash: String(ipHash),
        user_agent_hash: String(userAgentHash),
      });
      return { success: true };
    }

    if (this.sql.startsWith("update password_credentials set password_hash = ?")) {
      const [passwordHash, passwordSalt, algorithm, iterations, userId] = this.params;
      const credential = this.data.passwordCredentials.find((row) => row.user_id === String(userId));
      if (credential) {
        credential.password_hash = String(passwordHash);
        credential.password_salt = String(passwordSalt);
        credential.algorithm = String(algorithm);
        credential.iterations = Number(iterations);
        credential.password_version = Number(credential.password_version || 1) + 1;
        credential.requires_reset = 0;
        credential.password_changed_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (this.sql.startsWith("update user_accounts set status = 'active'")) {
      const [userId] = this.params.map(String);
      const user = this.data.userAccounts.find((row) => row.id === userId);
      if (user) {
        user.status = "active";
        user.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    if (this.sql.startsWith("update sessions set revoked_at = strftime") && this.sql.includes("where user_id = ?")) {
      const [userId] = this.params.map(String);
      for (const session of this.data.sessions) {
        if (session.user_id === userId && !session.revoked_at) {
          session.revoked_at = new Date().toISOString();
        }
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into user_accounts")) {
      const [id, email, emailNorm, displayName, status] = this.params.map(String);
      this.data.userAccounts.push({
        id,
        email,
        email_norm: emailNorm,
        display_name: displayName,
        status,
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into password_credentials")) {
      const [userId, passwordHash, passwordSalt, algorithm, iterations] = this.params;
      this.data.passwordCredentials.push({
        user_id: String(userId),
        password_hash: String(passwordHash),
        password_salt: String(passwordSalt),
        algorithm: String(algorithm),
        iterations: Number(iterations),
        password_version: 1,
        requires_reset: 1,
      });
      return { success: true };
    }

    if (this.sql.startsWith("insert into user_roles") || this.sql.startsWith("insert or ignore into user_roles")) {
      const [userId, roleId, scopeType, scopeId, assignedBy] = this.params.map(String);
      if (!this.data.userRoles.some((row) => row.user_id === userId && row.role_id === roleId && row.scope_type === scopeType && row.scope_id === scopeId)) {
        this.data.userRoles.push({
          user_id: userId,
          role_id: roleId,
          scope_type: scopeType,
          scope_id: scopeId,
          assigned_by: assignedBy,
          assigned_at: "2026-05-21T00:00:00.000Z",
        });
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into auth_password_setup_tokens")) {
      const [id, userId, tokenHash, createdBy] = this.params;
      this.data.passwordSetupTokens.push({
        id: String(id),
        user_id: String(userId),
        token_hash: String(tokenHash),
        created_by: String(createdBy),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        used_at: null,
      });
      return { success: true };
    }

    if (this.sql.startsWith("update auth_password_setup_tokens set used_at = strftime")) {
      const [tokenId] = this.params.map(String);
      const token = this.data.passwordSetupTokens.find((row) => row.id === tokenId && !row.used_at);
      if (token) token.used_at = new Date().toISOString();
      return { success: true };
    }

    if (this.sql.startsWith("insert into student_roster_profiles")) {
      const [studentUserId, cohort, graduationYear] = this.params.map(String);
      const existing = this.data.studentRosterProfiles.find((row) => row.student_user_id === studentUserId);
      if (existing) {
        existing.cohort = cohort;
        existing.graduation_year = graduationYear;
      } else {
        this.data.studentRosterProfiles.push({
          student_user_id: studentUserId,
          cohort,
          graduation_year: graduationYear,
        });
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into projects")) {
      const [id, siteId, programId, name, createdBy] = this.params;
      const existing = this.data.projects.find((row) => row.id === String(id));
      const row = {
        id: String(id),
        site_id: String(siteId),
        program_id: programId == null ? null : String(programId),
        name: String(name),
        created_by: String(createdBy),
        status: "active",
      };
      if (existing) Object.assign(existing, row);
      else this.data.projects.push(row);
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.startsWith("insert into project_members")) {
      const [projectId, studentUserId, assignedBy] = this.params.map(String);
      const existing = this.data.projectMembers.find((row) => row.project_id === projectId && row.student_user_id === studentUserId);
      const row = { project_id: projectId, student_user_id: studentUserId, member_role: "lead", active: 1, assigned_by: assignedBy };
      if (existing) Object.assign(existing, row);
      else this.data.projectMembers.push(row);
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.startsWith("insert or ignore into site_users")) {
      const [siteId, userId] = this.params.map(String);
      if (!this.data.siteUsers.some((row) => row.site_id === siteId && row.user_id === userId)) {
        this.data.siteUsers.push({ site_id: siteId, user_id: userId, membership_status: "active" });
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into mentor_assignments")) {
      const [id, mentorUserId, studentUserId, assignedBy] = this.params.map(String);
      const existing = this.data.mentorAssignments.find((row) => row.mentor_user_id === mentorUserId && row.student_user_id === studentUserId);
      if (existing) {
        existing.assigned_by = assignedBy;
        existing.active = 1;
      } else {
        this.data.mentorAssignments.push({ id, mentor_user_id: mentorUserId, student_user_id: studentUserId, assigned_by: assignedBy, active: 1 });
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert or ignore into project_adult_assignments")) {
      assert.doesNotMatch(this.sql, /invitation_kind/, "student setup must use the deployed project-adult schema");
      const [id, projectId, siteId, adultRole, assigneeUserId, nominatedBy, respondedBy] = this.params.map(String);
      const duplicate = this.data.projectAdultAssignments.some((row) => row.project_id === projectId && row.adult_role === adultRole && row.status === "accepted");
      if (duplicate) return { success: true, meta: { changes: 0 } };
      this.data.projectAdultAssignments.push({
        id,
        project_id: projectId,
        site_id: siteId,
        adult_role: adultRole,
        assignee_user_id: assigneeUserId,
        status: "accepted",
        nominated_by: nominatedBy,
        responded_by: respondedBy,
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.startsWith("insert into project_adult_assignment_events")) {
      assert.match(this.sql, /action, detail_json/, "student setup events must use the deployed event schema");
      const [id, assignmentId, actorUserId] = this.params.map(String);
      this.data.projectAdultAssignmentEvents.push({ id, assignment_id: assignmentId, actor_user_id: actorUserId, action: "accepted" });
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.startsWith("insert into user_notifications")) {
      const [id, userId, entityId, title, message] = this.params.map(String);
      this.data.userNotifications.push({ id, user_id: userId, entity_id: entityId, title, message });
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.startsWith("insert into project_mentor_assignments")) {
      const [id, projectId, mentorUserId, assignedBy] = this.params.map(String);
      this.data.projectMentorAssignments.push({ id, project_id: projectId, mentor_user_id: mentorUserId, assigned_by: assignedBy, active: 1 });
      return { success: true, meta: { changes: 1 } };
    }

    if (this.sql.startsWith("insert into viewer_student_assignments")) {
      const [id, viewerUserId, studentUserId, assignedBy] = this.params.map(String);
      const existing = this.data.viewerStudentAssignments.find((row) => row.viewer_user_id === viewerUserId && row.student_user_id === studentUserId);
      if (existing) {
        existing.assigned_by = assignedBy;
        existing.active = 1;
      } else {
        this.data.viewerStudentAssignments.push({ id, viewer_user_id: viewerUserId, student_user_id: studentUserId, assigned_by: assignedBy, active: 1 });
      }
      return { success: true };
    }

    if (this.sql.startsWith("insert into audit_events")) {
      const [
        id,
        actorUserId,
        action,
        entityType,
        entityId,
        ipHash,
        userAgentHash,
        metadataJson,
      ] = this.params;
      this.data.auditEvents.push({
        id,
        actor_user_id: actorUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        metadata: metadataJson ? JSON.parse(metadataJson) : null,
      });
      return { success: true };
    }

    throw new Error(`Unmocked D1 run() query: ${this.sql}`);
  }
}
