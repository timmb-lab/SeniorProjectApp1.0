import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { hashPassword, normalizeEmail } from "../functions/_lib/crypto.ts";
import { onRequest as onLogin } from "../functions/api/auth/login.ts";
import {
  LocalAdminProofError,
  assertApprovedAccountEmails,
  assertInsideSecrets,
  readSetupCredentials,
  runLocalAdminLoginProof,
} from "../scripts/prove-local-admin-logins.mjs";

const MIGRATIONS = [
  "migrations/0001_foundation.sql",
  "migrations/0004_mentor_meetings.sql",
  "migrations/0006_presentation_slots.sql",
  "migrations/0007_archive_export_artifacts.sql",
  "migrations/0010_tenant_google_sso.sql",
  "migrations/0011_multisite_site_role_foundation.sql",
  "migrations/0012_users_access_v5.sql",
];

const APPROVED = [
  {
    email: "bryan@learntechonline.com",
    displayName: "Bryan Timm",
    setupPassword: "Setup-Proof-Local-Admin-147!Aa",
  },
  {
    email: "bryan.timm89@gmail.com",
    displayName: "Bryan Timm",
    setupPassword: "Setup-Proof-Break-Glass-258!Aa",
  },
];

test("local admin proof refuses unsafe credential paths and non-gitignored secrets", async () => {
  const fixture = await createFixture();
  try {
    assert.throws(
      () => assertInsideSecrets(fixture.repoRoot, path.join(fixture.repoRoot, "outside.json")),
      LocalAdminProofError,
    );

    await assert.rejects(
      () => runLocalAdminLoginProof({
        repoRoot: fixture.repoRoot,
        verifyRepo: false,
        db: fixture.db,
        setupCredentialFile: fixture.setupCredentialFile,
        assertIgnored() {
          throw new LocalAdminProofError("SECRET_PATH_NOT_IGNORED", "not ignored");
        },
      }),
      /not ignored/,
    );
  } finally {
    fixture.cleanup();
  }
});

test("local admin proof accepts only the two approved emails", async () => {
  const fixture = await createFixture();
  try {
    assert.throws(
      () => assertApprovedAccountEmails([
        { email: "bryan@learntechonline.com" },
        { email: "not-approved@example.com" },
      ]),
      /approved local admin emails/,
    );

    const badFile = path.join(fixture.repoRoot, ".secrets", "local-admin-reset-bad.json");
    writeFileSync(badFile, `${JSON.stringify({
      accounts: [
        { email: "bryan@learntechonline.com", displayName: "Bryan Timm", setupPassword: "Secret-123!Aa456" },
        { email: "not-approved@example.com", displayName: "Bryan Timm", setupPassword: "Secret-123!Aa456" },
      ],
    })}\n`);
    assert.throws(() => readSetupCredentials(badFile, fixture.repoRoot), /approved local admin emails/);
  } finally {
    fixture.cleanup();
  }
});

test("local admin proof completes reset, verifies login/me/admin, and never returns password values", async () => {
  const fixture = await createFixture();
  try {
    for (const account of APPROVED) {
      const response = await login({
        env: fixture.env,
        email: account.email,
        password: account.setupPassword,
      });
      assert.equal(response.status, 403);
      assert.equal((await response.json()).error, "password_reset_required");
    }

    const result = await runLocalAdminLoginProof({
      repoRoot: fixture.repoRoot,
      verifyRepo: false,
      db: fixture.db,
      setupCredentialFile: fixture.setupCredentialFile,
      assertIgnored: assertTempSecretsIgnored,
      now: new Date("2026-05-21T20:00:00.000Z"),
      passwordPepper: "",
      sessionPepper: "test-session-pepper",
    });

    assert.equal(result.ok, true);
    assert.equal(result.method, "direct_route_handler");
    assert.equal(result.googleSsoRequired, false);
    assert.equal(result.credentialValuesPrinted, false);
    assert.equal(result.workingCredentialPath, ".secrets/local-admin-working-logins-20260521-200000.json");
    assert.equal(existsSync(path.join(fixture.repoRoot, result.workingCredentialPath)), true);
    assert.ok(result.accounts.every((account) => account.resetRequiredStateVerified));
    assert.ok(result.accounts.every((account) => account.resetCompleted));
    assert.ok(result.accounts.every((account) => account.loginVerified));
    assert.ok(result.accounts.every((account) => account.meVerified));
    assert.ok(result.accounts.every((account) => account.globalAdminVerified));
    assert.ok(result.accounts.every((account) => account.workspaceReachableAfterAuth));
    assert.ok(result.accounts.every((account) => account.ssoDependency === "none"));
    assert.ok(result.accounts.every((account) => account.setupCredentialInvalidAfterReset));

    const publicResult = JSON.stringify(result);
    for (const account of APPROVED) {
      assert.equal(publicResult.includes(account.setupPassword), false);
      const oldSetupLogin = await login({
        env: fixture.env,
        email: account.email,
        password: account.setupPassword,
      });
      assert.equal(oldSetupLogin.status, 401);
    }

    const workingPayload = JSON.parse(readFileSync(path.join(fixture.repoRoot, result.workingCredentialPath), "utf8"));
    assert.equal(workingPayload.accounts.length, 2);
    for (const account of workingPayload.accounts) {
      assert.equal(publicResult.includes(account.workingPassword), false);
      const workingLogin = await login({
        env: fixture.env,
        email: account.email,
        password: account.workingPassword,
      });
      assert.equal(workingLogin.status, 200);
    }
  } finally {
    fixture.cleanup();
  }
});

test("local admin proof can verify already-active accounts from the ignored working credential file", async () => {
  const fixture = await createFixture();
  try {
    const first = await runLocalAdminLoginProof({
      repoRoot: fixture.repoRoot,
      verifyRepo: false,
      db: fixture.db,
      setupCredentialFile: fixture.setupCredentialFile,
      assertIgnored: assertTempSecretsIgnored,
      now: new Date("2026-05-21T20:00:00.000Z"),
      sessionPepper: "test-session-pepper",
    });
    const second = await runLocalAdminLoginProof({
      repoRoot: fixture.repoRoot,
      verifyRepo: false,
      db: fixture.db,
      setupCredentialFile: fixture.setupCredentialFile,
      workingCredentialFile: path.join(fixture.repoRoot, first.workingCredentialPath),
      assertIgnored: assertTempSecretsIgnored,
      now: new Date("2026-05-21T20:05:00.000Z"),
      sessionPepper: "test-session-pepper",
    });

    assert.equal(second.ok, true);
    assert.equal(second.workingCredentialPath, first.workingCredentialPath);
    assert.equal(second.workingCredentialFileCreated, false);
    assert.ok(second.accounts.every((account) => account.loginVerified));
    assert.ok(second.accounts.every((account) => account.globalAdminVerified));
  } finally {
    fixture.cleanup();
  }
});

test("local admin proof creates a fresh working file when pending-reset accounts have stale working credentials", async () => {
  const fixture = await createFixture();
  try {
    const staleFile = path.join(fixture.repoRoot, ".secrets", "local-admin-working-logins-stale.json");
    writeFileSync(staleFile, `${JSON.stringify({
      kind: "local_admin_working_logins",
      generatedAt: "2026-05-21T19:00:00.000Z",
      localUrl: "https://local.capstone.test/workspace.html",
      accounts: APPROVED.map((account) => ({
        email: account.email,
        displayName: account.displayName,
        role: "admin",
        scopeType: "global",
        scopeId: "",
        workingPassword: `Stale-${normalizeEmail(account.email)}-147!Aa`,
      })),
    }, null, 2)}\n`);

    const result = await runLocalAdminLoginProof({
      repoRoot: fixture.repoRoot,
      verifyRepo: false,
      db: fixture.db,
      setupCredentialFile: fixture.setupCredentialFile,
      workingCredentialFile: staleFile,
      assertIgnored: assertTempSecretsIgnored,
      now: new Date("2026-05-21T20:10:00.000Z"),
      sessionPepper: "test-session-pepper",
    });

    assert.equal(result.workingCredentialFileCreated, true);
    assert.equal(result.workingCredentialPath, ".secrets/local-admin-working-logins-20260521-201000.json");
    assert.notEqual(path.join(fixture.repoRoot, result.workingCredentialPath), staleFile);
    const workingPayload = JSON.parse(readFileSync(path.join(fixture.repoRoot, result.workingCredentialPath), "utf8"));
    for (const account of workingPayload.accounts) {
      const staleLogin = await login({
        env: fixture.env,
        email: account.email,
        password: `Stale-${normalizeEmail(account.email)}-147!Aa`,
      });
      assert.equal(staleLogin.status, 401);
      const workingLogin = await login({
        env: fixture.env,
        email: account.email,
        password: account.workingPassword,
      });
      assert.equal(workingLogin.status, 200);
    }
  } finally {
    fixture.cleanup();
  }
});

async function createFixture() {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "capstone-local-proof-"));
  const secretsRoot = path.join(repoRoot, ".secrets");
  mkdirSync(secretsRoot, { recursive: true });
  writeFileSync(path.join(repoRoot, "workspace.html"), "<!doctype html><title>Workspace</title>\n");

  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  for (const migration of MIGRATIONS) {
    sqlite.exec(readFileSync(migration, "utf8"));
  }
  for (const account of APPROVED) {
    const id = `user_${normalizeEmail(account.email).replace(/[^a-z0-9]+/g, "_")}`;
    const credential = await hashPassword(account.setupPassword, "");
    sqlite.prepare(
      `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
       VALUES (?, ?, ?, ?, 'pending_reset')`,
    ).run(id, account.email, normalizeEmail(account.email), account.displayName);
    sqlite.prepare(
      `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations, requires_reset)
       VALUES (?, ?, ?, ?, ?, 1)`,
    ).run(id, credential.hash, credential.salt, credential.algorithm, credential.iterations);
    sqlite.prepare(
      `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
       VALUES (?, 'admin', 'global', '', NULL)`,
    ).run(id);
  }

  const setupCredentialFile = path.join(secretsRoot, "local-admin-reset-20260521-200000.json");
  writeFileSync(setupCredentialFile, `${JSON.stringify({
    kind: "local_admin_reset_setup_credentials",
    accounts: APPROVED.map((account) => ({
      email: account.email,
      displayName: account.displayName,
      role: "admin",
      scopeType: "global",
      scopeId: "",
      setupPassword: account.setupPassword,
    })),
  }, null, 2)}\n`);

  const db = new SqliteD1Database(sqlite);
  const env = {
    AUTH_MODE: "hardened_username_password",
    AUTH_LOCAL_LOGIN_ENABLED: "true",
    AUTH_GOOGLE_SSO_ENABLED: "false",
    SESSION_COOKIE_NAME: "sc_session",
    PASSWORD_PEPPER: "",
    SESSION_PEPPER: "test-session-pepper",
    DB: db,
  };

  return {
    repoRoot,
    setupCredentialFile,
    sqlite,
    db,
    env,
    cleanup() {
      sqlite.close();
      rmSync(repoRoot, { recursive: true, force: true });
    },
  };
}

function assertTempSecretsIgnored(repoRoot, relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  assert.ok(normalized === ".secrets/" || normalized.startsWith(".secrets/"));
}

async function login({ env, email, password }) {
  return onLogin({
    request: new Request("https://local.capstone.test/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8", accept: "application/json" },
      body: JSON.stringify({ email, password }),
    }),
    env,
  });
}

class SqliteD1Database {
  constructor(sqlite) {
    this.sqlite = sqlite;
  }

  prepare(sql) {
    return new SqliteD1Statement(this.sqlite, sql);
  }
}

class SqliteD1Statement {
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
    return { results: this.sqlite.prepare(this.sql).all(...this.params) };
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
