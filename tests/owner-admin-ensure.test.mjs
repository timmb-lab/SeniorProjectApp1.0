import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  OwnerAdminEnsureError,
  hasGlobalAdmin,
  ownerConfigFromEnv,
  parseArgs,
  stripJsonComments,
} from "../scripts/ensure-owner-admin-account.mjs";

test("owner-admin ensure is restricted to Bryan and explicit local/remote targets", () => {
  assert.deepEqual(parseArgs(["--remote"]), { target: "remote", baseUrl: "https://senior-capstone-app.pages.dev" });
  assert.deepEqual(parseArgs(["--local", "--base-url", "http://127.0.0.1:8788"]), {
    target: "local",
    baseUrl: "http://127.0.0.1:8788",
  });

  assert.throws(() => parseArgs([]), OwnerAdminEnsureError);
  assert.throws(() => parseArgs(["--local", "--remote"]), OwnerAdminEnsureError);

  assert.deepEqual(ownerConfigFromEnv({}), {
    email: "bryan.timm89@gmail.com",
    displayName: "Bryan Timm",
  });
  assert.throws(
    () => ownerConfigFromEnv({ OWNER_ADMIN_EMAIL: "teacher@example.edu", OWNER_ADMIN_DISPLAY_NAME: "Bryan Timm" }),
    /restricted to Bryan Timm only/,
  );
});

test("owner-admin ensure recognizes only a global admin role assignment", () => {
  assert.equal(hasGlobalAdmin({
    roles: [{ roleId: "admin", scopeType: "global", scopeId: "" }],
  }), true);
  assert.equal(hasGlobalAdmin({
    roles: [{ roleId: "misc_admin", scopeType: "global", scopeId: "" }],
  }), false);
  assert.equal(hasGlobalAdmin({
    roles: [{ roleId: "admin", scopeType: "program", scopeId: "it" }],
  }), false);
});

test("owner-admin ensure source keeps the Bryan path separate from general imports", async () => {
  const source = await readFile("scripts/ensure-owner-admin-account.mjs", "utf8");
  const gitignore = await readFile(".gitignore", "utf8");
  const humanDecisions = await readFile("docs/human-decisions.md", "utf8");

  assert.match(source, /OWNER_EMAIL = "bryan\.timm89@gmail\.com"/);
  assert.match(source, /OWNER_DISPLAY_NAME = "Bryan Timm"/);
  assert.match(source, /hashPassword/);
  assert.match(source, /requires_reset/);
  assert.match(source, /\.secrets/);
  assert.match(source, /PASSWORD_PEPPER is required locally before creating a remote password credential/);
  assert.doesNotMatch(source, /ALLOW_REAL_TEMP_CREDENTIAL_IMPORT\s*=\s*["']true["']/);
  assert.match(gitignore, /^\.secrets\/$/m);
  assert.match(humanDecisions, /HD-2026-05-21-001/);
  assert.match(humanDecisions, /status`: open/);
});

test("jsonc comment stripping preserves strings while removing comments", () => {
  const parsed = JSON.parse(stripJsonComments(`{
    // comment
    "url": "https://example.test/path",
    "value": "not // a comment"
  }`));
  assert.equal(parsed.url, "https://example.test/path");
  assert.equal(parsed.value, "not // a comment");
});
