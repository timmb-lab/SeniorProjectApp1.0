import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as onProjectsGet } from "../functions/api/projects.ts";
import { seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("project directory returns truthful totals with server paging, search, and filters", async () => {
  const fixture = await createProjectDirectoryFixture();
  const token = await seedSession(fixture.db, fixture.env, "directory-admin");

  const firstPage = await getProjects(fixture, token, "?siteId=site-project-directory&limit=25");
  assert.equal(firstPage.status, 200);
  const firstBody = await firstPage.json();
  assert.equal(firstBody.summary.total, 61);
  assert.equal(firstBody.summary.teams, 1);
  assert.equal(firstBody.summary.individual, 60);
  assert.equal(firstBody.pagination.total, 61);
  assert.equal(firstBody.pagination.page, 1);
  assert.equal(firstBody.pagination.pageSize, 25);
  assert.equal(firstBody.pagination.totalPages, 3);
  assert.equal(firstBody.pagination.hasPrevious, false);
  assert.equal(firstBody.pagination.hasNext, true);
  assert.equal(firstBody.projects.length, 25);
  assert.equal(firstBody.availableStudents.length, 63);
  assert.match(firstBody.availableStudents[0].email, /@senior-capstone\.test$/);

  const lastPage = await getProjects(fixture, token, "?siteId=site-project-directory&page=3&limit=25");
  const lastBody = await lastPage.json();
  assert.equal(lastBody.pagination.page, 3);
  assert.equal(lastBody.pagination.total, 61);
  assert.equal(lastBody.pagination.hasPrevious, true);
  assert.equal(lastBody.pagination.hasNext, false);
  assert.equal(lastBody.projects.length, 11);

  const search = await getProjects(fixture, token, "?siteId=site-project-directory&search=Atlas");
  const searchBody = await search.json();
  assert.equal(searchBody.summary.total, 61, "school summary must stay truthful while searching");
  assert.equal(searchBody.pagination.total, 1);
  assert.equal(searchBody.projects.length, 1);
  assert.equal(searchBody.projects[0].name, "Team Atlas");

  const teams = await getProjects(fixture, token, "?siteId=site-project-directory&filter=team");
  const teamBody = await teams.json();
  assert.equal(teamBody.pagination.total, 1);
  assert.equal(teamBody.projects[0].memberCount, 3);
});

test("project paging keeps student access limited to their own project", async () => {
  const fixture = await createProjectDirectoryFixture();
  const token = await seedSession(fixture.db, fixture.env, "directory-student-61");
  const response = await getProjects(fixture, token, "?siteId=site-project-directory&limit=50");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.summary.total, 1);
  assert.equal(body.pagination.total, 1);
  assert.equal(body.projects.length, 1);
  assert.equal(body.projects[0].name, "Team Atlas");
  assert.equal(body.permissions.canManage, false);
});

async function createProjectDirectoryFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "project-directory-session-pepper",
    PASSWORD_PEPPER: "project-directory-password-pepper",
  };
  await seedUser(db, { id: "directory-admin", displayName: "Directory Admin", roleId: "global_admin" });
  await db.prepare(
    "INSERT INTO tenants (id, name, slug, status) VALUES ('tenant-project-directory', 'Project Directory District', 'project-directory', 'active')",
  ).run();
  await db.prepare(
    `INSERT INTO sites (id, tenant_id, name, slug, status, school_year)
     VALUES ('site-project-directory', 'tenant-project-directory', 'Project Directory School', 'project-directory-school', 'active', '2026-2027')`,
  ).run();

  for (let index = 1; index <= 63; index += 1) {
    const suffix = String(index).padStart(2, "0");
    const studentId = `directory-student-${suffix}`;
    await seedUser(db, {
      id: studentId,
      displayName: `Directory Student ${suffix}`,
      email: `${studentId}@senior-capstone.test`,
      roleId: "student",
    });
    await db.prepare(
      "INSERT INTO site_users (site_id, user_id, membership_status) VALUES ('site-project-directory', ?, 'active')",
    ).bind(studentId).run();
  }

  for (let index = 1; index <= 60; index += 1) {
    const suffix = String(index).padStart(2, "0");
    const studentId = `directory-student-${suffix}`;
    await db.prepare(
      `UPDATE projects
       SET name = ?, summary = ?, current_phase = 'phase-1', updated_at = ?
       WHERE id = ?`,
    ).bind(`Project ${suffix}`, `Work for Directory Student ${suffix}`, `2026-08-01T00:${suffix}:00.000Z`, `project-${studentId}`).run();
  }

  for (let index = 61; index <= 63; index += 1) {
    const studentId = `directory-student-${String(index).padStart(2, "0")}`;
    await db.prepare("UPDATE project_members SET active = 0 WHERE student_user_id = ?").bind(studentId).run();
    await db.prepare("UPDATE projects SET status = 'archived' WHERE id = ?").bind(`project-${studentId}`).run();
  }

  await db.prepare(
    `INSERT INTO projects (id, site_id, name, summary, status, current_phase, created_by, updated_at)
     VALUES ('directory-project-team', 'site-project-directory', 'Team Atlas', 'A team project for search proof.', 'active', 'phase-2a', 'directory-admin', '2026-09-01T00:00:00.000Z')`,
  ).run();
  for (let index = 61; index <= 63; index += 1) {
    const suffix = String(index).padStart(2, "0");
    await db.prepare(
      `INSERT INTO project_members (project_id, student_user_id, member_role, active, assigned_by)
       VALUES ('directory-project-team', ?, ?, 1, 'directory-admin')`,
    ).bind(`directory-student-${suffix}`, index === 61 ? "lead" : "member").run();
  }
  return { db, env };
}

function getProjects(fixture, token, query = "") {
  return onProjectsGet({
    request: new Request(`https://example.test/api/projects${query}`, {
      headers: {
        cookie: `sc_session=${token}`,
        "cf-connecting-ip": "203.0.113.61",
        "user-agent": "project-directory-test",
      },
    }),
    env: fixture.env,
  });
}
