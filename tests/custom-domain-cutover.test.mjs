import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluatePagesDomainAssociations,
  redactKnownSecrets,
  validateCutoverDocs,
  validateProductionDomainConfig,
} from "../scripts/check-custom-domain-cutover.mjs";

const validConfig = {
  schemaVersion: 1,
  domain: "thecapstoneapp.com",
  rootMode: "guide-root-app-subdomain",
  hostnames: {
    publicApex: "thecapstoneapp.com",
    publicWww: "www.thecapstoneapp.com",
    app: "app.thecapstoneapp.com",
  },
  pagesProjects: {
    publicGuide: "senior-capstone-public",
    appBackend: "senior-capstone-app",
    stakeholderTitan: "senior-capstone-option-titan",
    stakeholderPrimary: "senior-capstone-option-primary",
  },
  pagesDevFallbacks: {
    publicGuide: "https://senior-capstone-public.pages.dev",
    appBackend: "https://senior-capstone-app.pages.dev",
    stakeholderTitan: "https://senior-capstone-option-titan.pages.dev",
    stakeholderPrimary: "https://senior-capstone-option-primary.pages.dev",
  },
  policy: {
    stakeholderOptionsMayUseProductionDomain: false,
    realUserOnboardingPolicyChangeAllowed: false,
    disablePagesDevFallbackAfterCutover: false,
    publicWwwBehavior: "serve-same-public-guide-or-cloudflare-redirect-rule",
    doNotUseRedirectsFileForDomainLevelRedirects: true,
  },
};

const currentDocs = {
  "docs/custom-domain-cutover-checklist.md": [
    "Domain selected: `thecapstoneapp.com`",
    "Purchased through Cloudflare: confirmed by Bryan",
    "Added to Cloudflare: confirmed by Bryan",
    "Root mode: `guide-root-app-subdomain`",
    "`thecapstoneapp.com`",
    "`www.thecapstoneapp.com`",
    "`app.thecapstoneapp.com`",
    "GET /accounts/{account_id}/pages/projects/{project_name}/domains",
    "POST /accounts/{account_id}/pages/projects/{project_name}/domains",
    "CNAME-only warning",
    "`_redirects` limitations",
  ].join("\n"),
  "docs/production-surface-registry.md": [
    "thecapstoneapp.com",
    "www.thecapstoneapp.com",
    "app.thecapstoneapp.com",
    "npm run check:custom-domain-cutover",
    "npm run check:alpha-account-gating",
    "npm run check:production-cutover",
  ].join("\n"),
  "docs/production-deployment-policy.md": [
    "guide-root-app-subdomain",
    "Cloudflare Pages custom-domain association",
    "senior-capstone-option-titan",
    "senior-capstone-option-primary",
    "`_routes.json`",
    "`_redirects`",
  ].join("\n"),
};

test("valid thecapstoneapp.com config passes", () => {
  assert.equal(validateProductionDomainConfig(validConfig).ok, true);
});

test("stale placeholder docs fail", () => {
  const docs = {
    ...currentDocs,
    "docs/custom-domain-cutover-checklist.md": "Hostnames are placeholders until Bryan chooses the final mapping.",
  };
  const result = validateCutoverDocs(docs);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /placeholder/i);
});

test("stakeholder project mapped to production hostname fails", () => {
  const config = structuredClone(validConfig);
  config.customDomains = {
    stakeholderTitan: ["thecapstoneapp.com"],
  };
  const result = validateProductionDomainConfig(config);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /stakeholder project/);
});

test("missing app hostname fails", () => {
  const config = structuredClone(validConfig);
  config.hostnames.app = "";
  const result = validateProductionDomainConfig(config);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /hostnames\.app/);
});

test("no token can be reported as static pass plus live blocked by caller", () => {
  assert.equal(validateProductionDomainConfig(validConfig).ok, true);
  const association = evaluatePagesDomainAssociations({ projectDomains: {} });
  assert.equal(association.ok, false);
  assert.equal(association.missing, 3);
});

test("Pages API active statuses pass", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-public": [
        { name: "thecapstoneapp.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
        { name: "www.thecapstoneapp.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
      ],
      "senior-capstone-app": [
        { name: "app.thecapstoneapp.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
      ],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, true);
  assert.equal(association.active, 3);
});

test("Pages API pending statuses produce pending", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-public": [
        { name: "thecapstoneapp.com", status: "pending" },
        { name: "www.thecapstoneapp.com", status: "initializing" },
      ],
      "senior-capstone-app": [
        { name: "app.thecapstoneapp.com", status: "active" },
      ],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, false);
  assert.equal(association.pending, 2);
});

test("Pages API missing association fails", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-public": [],
      "senior-capstone-app": [],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, false);
  assert.equal(association.missing, 3);
});

test("CNAME-only fixture fails", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-public": [],
      "senior-capstone-app": [],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
    dnsRecords: [
      { type: "CNAME", name: "app.thecapstoneapp.com", content: "senior-capstone-app.pages.dev" },
    ],
  });
  assert.equal(association.ok, false);
  assert.match(association.findings.map((finding) => finding.code).join("\n"), /CNAME_ONLY_WITHOUT_PAGES_ASSOCIATION/);
});

test("output redacts token-like values", () => {
  const redacted = redactKnownSecrets("Authorization: Bearer TOKEN_CANARY_1234567890", ["TOKEN_CANARY_1234567890"]);
  assert.match(redacted, /\[REDACTED\]/);
  assert.doesNotMatch(redacted, /TOKEN_CANARY/);
});

test("domain-level redirect is not required from _redirects", () => {
  const result = validateCutoverDocs(currentDocs);
  assert.equal(result.ok, true);
});
