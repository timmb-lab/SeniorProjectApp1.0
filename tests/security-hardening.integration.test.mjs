import assert from "node:assert/strict";
import test from "node:test";

import { json } from "../functions/_lib/http.ts";
import { securityFingerprint, writeAudit } from "../functions/_lib/auth.ts";
import { onRequest as onMiddleware } from "../functions/_middleware.ts";
import { onRequestGet as onAlphaGet, onRequestPost as onAlphaPost } from "../functions/api/alpha/state.js";
import { onRequestGet as onRepositoryGet } from "../functions/api/evidence/repository.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import { onRequestGet as onMe } from "../functions/api/auth/me.ts";
import { onRequestPost as onChangePassword } from "../functions/api/auth/change-password.ts";
import { onRequestPost as onProjectPost } from "../functions/api/projects.ts";
import { onRequestPost as onUploadPost } from "../functions/api/submissions/[id]/evidence/upload.ts";
import { seedSession, seedUser } from "./helpers/auth-fixtures.mjs";
import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("production blocks legacy internal QA pages and the mutable alpha API", async () => {
  const next = async () => new Response("public", { status: 200 });
  for (const path of ["/alpha.html", "/alpha.js", "/account.html", "/account.js", "/app-preview.html"]) {
    const response = await onMiddleware({
      request: new Request(`https://example.test${path}`),
      env: { APP_ENV: "production" },
      next,
    });
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get("cache-control"), "no-store", path);
  }

  const alphaGet = await onAlphaGet({ env: { APP_ENV: "production" } });
  assert.equal(alphaGet.status, 404);
  const alphaPost = await onAlphaPost({
    request: new Request("https://example.test/api/alpha/state", { method: "POST" }),
    env: { APP_ENV: "production" },
  });
  assert.equal(alphaPost.status, 404);

  const publicResponse = await onMiddleware({
    request: new Request("https://example.test/workspace.html"),
    env: { APP_ENV: "production" },
    next,
  });
  assert.equal(publicResponse.status, 308);
  assert.equal(publicResponse.headers.get("location"), "https://example.test/");

  const missingEnvironmentResponse = await onMiddleware({
    request: new Request("https://example.test/account.html"),
    env: {},
    next,
  });
  assert.equal(missingEnvironmentResponse.status, 404);
  const missingEnvironmentAlpha = await onAlphaGet({ env: {} });
  assert.equal(missingEnvironmentAlpha.status, 404);
});

test("production keeps one canonical app host and root path", async () => {
  const next = async () => new Response("workspace", { status: 200 });
  const aliases = [
    "www.thecapstoneproject.com",
    "thecapstoneapp.com",
    "www.thecapstoneapp.com",
    "senior-capstone-app.pages.dev",
    "app.thecapstoneproject.com",
    "app.thecapstoneapp.com",
  ];
  for (const host of aliases) {
    const response = await onMiddleware({
      request: new Request(`https://${host}/workspace?section=student`),
      env: { APP_ENV: "production" },
      next,
    });
    assert.equal(response.status, 308, host);
    assert.equal(response.headers.get("location"), "https://thecapstoneproject.com/?section=student", host);
  }

  for (const path of ["/workspace", "/workspace/", "/workspace.html", "/index.html"]) {
    const response = await onMiddleware({
      request: new Request(`https://thecapstoneproject.com${path}?section=student`),
      env: { APP_ENV: "production" },
      next,
    });
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("location"), "https://thecapstoneproject.com/?section=student", path);
  }

  const apiResponse = await onMiddleware({
    request: new Request("https://thecapstoneapp.com/api/health?domain-check=1"),
    env: { APP_ENV: "production" },
    next,
  });
  assert.equal(apiResponse.status, 308);
  assert.equal(apiResponse.headers.get("location"), "https://thecapstoneproject.com/api/health?domain-check=1");

  for (const oldPage of ["/phase-1", "/program.html", "/app", "/anything-else"]) {
    const response = await onMiddleware({
      request: new Request(`https://thecapstoneproject.com${oldPage}`),
      env: { APP_ENV: "production" },
      next,
    });
    assert.equal(response.status, 404, oldPage);
  }
});

test("Site Admin working mode cannot cross into global routes or a different school", async () => {
  let nextCalls = 0;
  const next = async () => {
    nextCalls += 1;
    return new Response("allowed", { status: 200 });
  };
  const modeHeaders = {
    "x-capstone-admin-mode": "site_admin",
    "x-capstone-site-id": "site-desert-valley-high",
  };

  const globalResponse = await onMiddleware({
    request: new Request("https://thecapstoneproject.com/api/admin/dashboard", { headers: modeHeaders }),
    env: { APP_ENV: "production" },
    next,
  });
  assert.equal(globalResponse.status, 403);
  assert.deepEqual(await globalResponse.json(), { error: "global_admin_mode_required", workingMode: "site_admin" });
  assert.equal(globalResponse.headers.get("cache-control"), "no-store");

  const crossSiteResponse = await onMiddleware({
    request: new Request("https://thecapstoneproject.com/api/site/students?siteId=site-other-school", { headers: modeHeaders }),
    env: { APP_ENV: "production" },
    next,
  });
  assert.equal(crossSiteResponse.status, 403);
  assert.deepEqual(await crossSiteResponse.json(), { error: "working_site_mismatch", workingMode: "site_admin" });

  const selectedSiteResponse = await onMiddleware({
    request: new Request("https://thecapstoneproject.com/api/site/students?siteId=site-desert-valley-high", { headers: modeHeaders }),
    env: { APP_ENV: "production" },
    next,
  });
  assert.equal(selectedSiteResponse.status, 200);
  assert.equal(nextCalls, 1, "only the matching school request reaches its route");
});

test("alpha mutations still reject cross-origin requests outside production", async () => {
  const response = await onAlphaPost({
    request: new Request("https://example.test/api/alpha/state", {
      method: "POST",
      headers: { origin: "https://attacker.test", "content-type": "application/json" },
      body: "{}",
    }),
    env: { APP_ENV: "local" },
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "cross_origin_post_denied" });
});

test("API responses carry defense-in-depth browser headers", async () => {
  const response = json({ ok: true });
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") || "", /default-src 'none'/);
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.match(response.headers.get("strict-transport-security") || "", /max-age=31536000/);
});

test("production authentication fails closed when peppers are missing", async () => {
  const response = await onLogin({
    request: new Request("https://example.test/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: JSON.stringify({ email: "user@example.test", password: "anything" }),
    }),
    env: { APP_ENV: "production" },
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "auth_not_configured" });

  const meResponse = await onMe({
    request: new Request("https://example.test/api/auth/me", {
      headers: { cookie: "sc_session=old-unpeppered-session" },
    }),
    env: { APP_ENV: "production" },
  });
  assert.equal(meResponse.status, 503);
  assert.deepEqual(await meResponse.json(), { authenticated: false, error: "auth_not_configured" });
});

test("Drive repository diagnostics reject ordinary authenticated users", async () => {
  const fixture = await createSecurityFixture();
  const studentToken = await seedSession(fixture.db, fixture.env, "student-a");
  const response = await onRepositoryGet({
    request: authenticatedRequest("https://example.test/api/evidence/repository", studentToken),
    env: fixture.env,
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "forbidden" });
  const audit = await fixture.db.prepare(
    "SELECT action FROM audit_events WHERE actor_user_id = 'student-a' ORDER BY created_at DESC LIMIT 1",
  ).first();
  assert.equal(audit.action, "evidence_repository_read_denied");
});

test("project updates cannot move a team across schools through a mismatched site id", async () => {
  const fixture = await createSecurityFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "admin-a");
  const sites = await fixture.db.prepare("SELECT id FROM sites WHERE status = 'active' ORDER BY id LIMIT 2").all();
  assert.equal(sites.results.length, 2);
  const [siteA, siteB] = sites.results.map((row) => row.id);

  await fixture.db.prepare(
    "INSERT INTO site_users (site_id, user_id, membership_status) VALUES (?, 'student-a', 'active'), (?, 'student-b', 'active')",
  ).bind(siteA, siteB).run();
  const projectA = await fixture.db.prepare(
    "SELECT project_id FROM project_members WHERE student_user_id = 'student-a' AND active = 1",
  ).first();
  assert.ok(projectA?.project_id);

  const response = await onProjectPost({
    request: authenticatedRequest("https://example.test/api/projects", adminToken, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: JSON.stringify({
        action: "update_project",
        projectId: projectA.project_id,
        siteId: siteB,
        name: "Cross-school move",
        summary: "Should not be saved",
        studentIds: ["student-b"],
      }),
    }),
    env: fixture.env,
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "project_site_mismatch" });
  const membership = await fixture.db.prepare(
    "SELECT project_id FROM project_members WHERE student_user_id = 'student-b' AND active = 1",
  ).first();
  assert.equal(membership.project_id, "project-student-b");
});

test("template link replacement keeps the same template details and records a reason", async () => {
  const fixture = await createSecurityFixture();
  const adminToken = await seedSession(fixture.db, fixture.env, "admin-a");
  const site = await fixture.db.prepare("SELECT id FROM sites WHERE status = 'active' ORDER BY id LIMIT 1").first();
  assert.ok(site?.id);
  await fixture.db.prepare(
    `INSERT INTO project_templates (
       id, site_id, phase, title, description, template_url, active, created_by
     ) VALUES ('template-a', ?, 'phase-1', 'Proposal Template', 'Use this for the proposal.', 'https://docs.google.com/document/d/old-template/edit', 1, 'admin-a')`,
  ).bind(site.id).run();

  const missingConfirmation = await onProjectPost({
    request: authenticatedRequest("https://example.test/api/projects", adminToken, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: JSON.stringify({
        action: "save_template",
        siteId: site.id,
        templateId: "template-a",
        templateUrl: "https://docs.google.com/document/d/new-template/edit",
        changeReason: "The school published a corrected copy.",
        confirmLinkOpened: true,
      }),
    }),
    env: fixture.env,
  });
  assert.equal(missingConfirmation.status, 400);
  assert.deepEqual(await missingConfirmation.json(), { error: "template_change_confirmation_required" });

  const response = await onProjectPost({
    request: authenticatedRequest("https://example.test/api/projects", adminToken, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: JSON.stringify({
        action: "save_template",
        siteId: site.id,
        templateId: "template-a",
        templateUrl: "https://docs.google.com/document/d/new-template/edit",
        name: "Changed title should be ignored",
        phase: "finish",
        description: "Changed description should be ignored",
        programId: "not-a-program",
        changeReason: "The school published a corrected copy.",
        confirmImpact: true,
        confirmLinkOpened: true,
      }),
    }),
    env: fixture.env,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).templateId, "template-a");

  const saved = await fixture.db.prepare(
    "SELECT id, phase, title, description, template_url FROM project_templates WHERE id = 'template-a'",
  ).first();
  assert.deepEqual({ ...saved }, {
    id: "template-a",
    phase: "phase-1",
    title: "Proposal Template",
    description: "Use this for the proposal.",
    template_url: "https://docs.google.com/document/d/new-template/edit",
  });

  const audit = await fixture.db.prepare(
    "SELECT action, metadata_json FROM audit_events WHERE entity_id = 'template-a' ORDER BY created_at DESC LIMIT 1",
  ).first();
  assert.equal(audit.action, "project_template_updated");
  const metadata = JSON.parse(audit.metadata_json);
  assert.equal(metadata.changeType, "link_only");
  assert.equal(metadata.changeReason, "The school published a corrected copy.");
  assert.equal(metadata.hostname, "docs.google.com");
  assert.equal(JSON.stringify(metadata).includes("new-template"), false);
});

test("oversized evidence requests are rejected before multipart buffering", async () => {
  const fixture = await createSecurityFixture();
  const studentToken = await seedSession(fixture.db, fixture.env, "student-a");
  await fixture.db.prepare(
    "INSERT INTO submissions (id, student_id, status) VALUES ('submission-a', 'student-a', 'draft')",
  ).run();
  const response = await onUploadPost({
    request: authenticatedRequest("https://example.test/api/submissions/submission-a/evidence/upload", studentToken, {
      method: "POST",
      headers: {
        origin: "https://example.test",
        "content-type": "multipart/form-data; boundary=test",
        "content-length": String(25 * 1024 * 1024),
      },
      body: "--test--\r\n",
    }),
    env: fixture.env,
    params: { id: "submission-a" },
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "file_too_large" });
});

test("password-change verification is rate-limited for an authenticated account", async () => {
  const fixture = await createSecurityFixture();
  const studentToken = await seedSession(fixture.db, fixture.env, "student-a");
  const identifierHash = await securityFingerprint(fixture.env, "password-change:student-a");
  const ipHash = await securityFingerprint(fixture.env, "ip:203.0.113.90");
  for (let index = 0; index < 10; index += 1) {
    await fixture.db.prepare(
      `INSERT INTO login_attempts (id, identifier_hash, ip_hash, success, reason)
       VALUES (?, ?, ?, 0, 'invalid_current_password')`,
    ).bind(`password-change-failure-${index}`, identifierHash, ipHash).run();
  }

  const response = await onChangePassword({
    request: authenticatedRequest("https://example.test/api/auth/change-password", studentToken, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: JSON.stringify({ currentPassword: "wrong", newPassword: "Strong-New-Password-123!" }),
    }),
    env: fixture.env,
  });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "rate_limited" });
});

test("audit metadata recursively redacts credentials and provider secrets", async () => {
  const fixture = await createSecurityFixture();
  await writeAudit(fixture.env, {
    actorUserId: "admin-a",
    action: "security_redaction_test",
    entityType: "test",
    entityId: "redaction",
    request: new Request("https://example.test/api/test", {
      headers: { "cf-connecting-ip": "203.0.113.90", "user-agent": "security-audit-test" },
    }),
    metadata: {
      accessToken: "ya29.secret-provider-token",
      nested: { password: "Secret123!", note: "safe value" },
      privateKey: "-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----",
    },
  });
  const row = await fixture.db.prepare(
    "SELECT metadata_json FROM audit_events WHERE action = 'security_redaction_test' LIMIT 1",
  ).first();
  const metadata = JSON.parse(row.metadata_json);
  assert.equal(metadata.accessToken, "[redacted]");
  assert.equal(metadata.nested.password, "[redacted]");
  assert.equal(metadata.nested.note, "safe value");
  assert.equal(metadata.privateKey, "[redacted]");
  assert.doesNotMatch(row.metadata_json, /secret-provider-token|Secret123|BEGIN PRIVATE KEY/);
});

async function createSecurityFixture() {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const env = {
    DB: db,
    APP_ENV: "local",
    SESSION_PEPPER: "test-session-pepper",
    PASSWORD_PEPPER: "test-password-pepper",
  };
  await seedUser(db, { id: "admin-a", displayName: "Admin A", roleId: "global_admin" });
  await seedUser(db, { id: "student-a", displayName: "Student A", roleId: "student" });
  await seedUser(db, { id: "student-b", displayName: "Student B", roleId: "student" });
  return { db, env };
}

function authenticatedRequest(url, token, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("cookie", `sc_session=${token}`);
  headers.set("cf-connecting-ip", "203.0.113.90");
  headers.set("user-agent", "security-audit-test");
  return new Request(url, { ...init, headers });
}
