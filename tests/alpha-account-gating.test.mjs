import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAlphaAccountGatingFixture } from "../scripts/check-alpha-account-gating.mjs";

const validFixture = {
  productionFiles: {
    "index.html": '<a href="workspace.html">Open Workspace</a>',
    "workspace.html": '<main>Capstone Project Workspace</main>',
  },
  publicCompanionFiles: {
    "public-companion/index.html": '<a href="phase-1.html">Phase 1</a>',
    "public-companion/_redirects": "# Public companion serves static guide pages only.\n",
  },
  stakeholderFiles: {
    "stakeholder-options/titan-blend/index.html": "Stakeholder review option. Not the canonical production site or app.",
  },
  alphaHtml: "Internal alpha / QA only. Not production navigation. Do not enter real student records.",
  accountHtml: "Internal QA account smoke. Fake .test accounts only. Do not use this page as the student or staff production path, and do not enter real student records.",
  alphaApiSource: "ALPHA_STATE_KEY createAlphaSeedState alphaOnly seeded internal QA state",
  testAccountsSource: 'const email = "maya.student@senior-capstone.test"; credentialNote: "Passwords were accepted from the request and are not returned by this endpoint."',
  optionPolicy: "option-a-open",
};

function cloneFixture(changes = {}) {
  return structuredClone({ ...validFixture, ...changes });
}

test("production nav link to alpha fails", () => {
  const fixture = cloneFixture();
  fixture.productionFiles["index.html"] = '<a href="alpha.html">Alpha</a>';
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /PRODUCTION_NAV_INTERNAL_ROUTE_LINK/);
});

test("production nav link to account fails", () => {
  const fixture = cloneFixture();
  fixture.productionFiles["workspace.html"] = '<a href="account.html">Account</a>';
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.detail).join("\n"), /account\.html/);
});

test("public companion _redirects 200 proxy to /api/* fails", () => {
  const fixture = cloneFixture();
  fixture.publicCompanionFiles["public-companion/_redirects"] = "/api/* https://senior-capstone-app.pages.dev/api/:splat 200\n";
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /PUBLIC_COMPANION_API_PROXY/);
});

test("alpha page missing internal QA label fails", () => {
  const fixture = cloneFixture({ alphaHtml: "App flow console. Do not enter real student records." });
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /ALPHA_MISSING_INTERNAL_QA_LABEL/);
});

test("account page missing internal QA label fails", () => {
  const fixture = cloneFixture({ accountHtml: "Account sign in. Do not enter real student records." });
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /ACCOUNT_MISSING_INTERNAL_QA_LABEL/);
});

test("fake password fixture fails", () => {
  const fixture = cloneFixture({ accountHtml: 'Internal QA account smoke. Fake .test accounts only. Do not enter real student records. password: "LEAK_MARKER"' });
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /ACCOUNT_SECRET_OR_STORAGE_ID_LEAK/);
});

test("Option A unlinked/labeled pages pass with warning", () => {
  const result = evaluateAlphaAccountGatingFixture(validFixture);
  assert.equal(result.ok, true);
  assert.match(result.warnings.join("\n"), /OPTION_A_OPEN/);
});

test("Option B selected with no deny/access evidence blocks or fails", () => {
  const fixture = cloneFixture({ optionPolicy: "option-b", policyDocs: "Option B selected." });
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /OPTION_B_ACCESS_GATE_MISSING/);
});

test("Option C selected while files still served fails", () => {
  const fixture = cloneFixture({ optionPolicy: "option-c" });
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /OPTION_C_INTERNAL_FILES_STILL_SERVED/);
});

test("stakeholder alpha link without internal QA label fails", () => {
  const fixture = cloneFixture();
  fixture.stakeholderFiles["stakeholder-options/titan-blend/index.html"] = '<a href="alpha.html">Open alpha</a>';
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /STAKEHOLDER_ALPHA_LINK_UNLABELED/);
});

test("internal API real data or secret leak fixture fails", () => {
  const fixture = cloneFixture({ alphaApiSource: "createAlphaSeedState real student bryan.timm89@gmail.com" });
  const result = evaluateAlphaAccountGatingFixture(fixture);
  assert.equal(result.ok, false);
  assert.match(result.failures.map((failure) => failure.code).join("\n"), /ALPHA_API_REAL_DATA_RISK/);
});
