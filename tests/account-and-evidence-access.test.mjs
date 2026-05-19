import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const accountHtml = await readFile("account.html", "utf8");
const accountJs = await readFile("account.js", "utf8");
const appJs = await readFile("app.js", "utf8");
const buildPublicSite = await readFile("scripts/build-public-site.mjs", "utf8");
const evidenceRoute = await readFile("functions/api/evidence/[id]/check-access.ts", "utf8");
const healthRoute = await readFile("functions/api/health.ts", "utf8");
const envTypes = await readFile("functions/_types.ts", "utf8");

test("account smoke page exercises real auth endpoints without storing credentials", () => {
  assert.match(accountHtml, /Fake Test Account Smoke Page/);
  assert.match(accountJs, /\/api\/auth\/login/);
  assert.match(accountJs, /\/api\/auth\/me/);
  assert.match(accountJs, /\/api\/auth\/logout/);
  assert.match(accountJs, /\/api\/health/);
  assert.match(accountJs, /maya\.student@senior-capstone\.test/);
  assert.match(accountJs, /lee\.admin@senior-capstone\.test/);
  assert.match(accountJs, /reporting\.miscadmin@senior-capstone\.test/);
  assert.match(accountHtml, /id="selectedExpectation"/);
  assert.match(accountHtml, /id="smokeChecklist"/);
  assert.match(accountHtml, /id="runSmokeSequence"/);
  assert.match(accountJs, /renderSelectedExpectation/);
  assert.match(accountJs, /renderSmokeChecklist/);
  assert.match(accountJs, /runAccountSmokeSequence/);
  assert.match(accountJs, /expectedEvidenceAccess: "denied"/);
  assert.match(accountJs, /expectedRole: "program_teacher"/);
  assert.match(accountJs, /expectedRole: "admin"/);
  assert.match(accountJs, /expectedScopeId: "alpha-readiness"/);
  assert.match(accountJs, /getAccountForCurrentSession/);
  assert.match(accountJs, /hasExpectedRole/);
  assert.match(accountJs, /renderHealthSummary/);
  assert.match(accountJs, /outcomeMatches/);
  assert.match(accountJs, /Selected expectation updated/);
  assert.doesNotMatch(accountJs, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(accountJs, /\.secrets|test-accounts-2026-05-18|passwords\s*:/);
});

test("account smoke route is reachable from the app navigation but public builds point back to the app host", () => {
  assert.match(appJs, /href="account\.html"/);
  assert.match(appJs, /Account Smoke Test/);
  assert.match(buildPublicSite, /href="account\.html"/);
  assert.match(buildPublicSite, /account\.html/);
});

test("protected evidence access route is scoped, audited, and avoids storage id exposure", () => {
  assert.match(evidenceRoute, /getCurrentUser/);
  assert.match(evidenceRoute, /canAccessStudent/);
  assert.match(evidenceRoute, /evidence_artifacts/);
  assert.match(evidenceRoute, /evidence_access_unauthorized/);
  assert.match(evidenceRoute, /evidence_access_denied/);
  assert.match(evidenceRoute, /evidence_access_checked/);
  assert.match(evidenceRoute, /source_kind === "external_link"/);
  assert.doesNotMatch(evidenceRoute, /drive_file_id|drive_parent_folder_id/);
});

test("health route reports Drive credential readiness without exposing secret values", () => {
  assert.match(envTypes, /GOOGLE_DRIVE_CLIENT_EMAIL/);
  assert.match(envTypes, /GOOGLE_DRIVE_PRIVATE_KEY/);
  assert.match(healthRoute, /googleDriveCredentialsConfigured/);
  assert.match(healthRoute, /googleDriveCredentialParts/);
  assert.match(healthRoute, /isConfiguredSecret/);
  assert.doesNotMatch(healthRoute, /GOOGLE_DRIVE_PRIVATE_KEY\s*[,}]/);
});
