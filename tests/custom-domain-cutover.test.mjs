import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluatePagesDomainAssociations,
  redactKnownSecrets,
  runRetiredHostnameDnsChecks,
  validateCutoverDocs,
  validateProductionDomainConfig,
} from "../scripts/check-custom-domain-cutover.mjs";

const validConfig = {
  schemaVersion: 4,
  productDomain: "thecapstoneapp.com",
  canonicalUrl: "https://thecapstoneapp.com/",
  rootMode: "single-canonical-app-root-with-secondary-domain-redirect",
  targetHostnames: {
    productApex: "thecapstoneapp.com",
  },
  redirectHostnames: {
    productWwwAlias: "www.thecapstoneapp.com",
    secondaryApex: "thecapstoneproject.com",
    secondaryWwwAlias: "www.thecapstoneproject.com",
    pagesDevAlias: "senior-capstone-app.pages.dev",
  },
  retiredHostnames: {
    appSubdomain: "app.thecapstoneapp.com",
  },
  currentSsoRedirectUri: "https://thecapstoneapp.com/api/auth/google/callback",
  guide: {
    futureCustomDomain: "TBD",
    currentDeploySource: "public-companion/",
    currentPagesProject: "senior-capstone-public",
    currentPagesDevFallback: "https://senior-capstone-public.pages.dev",
  },
  pagesProjects: {
    publicGuide: "senior-capstone-public",
    appBackend: "senior-capstone-app",
  },
  retiredPagesProjects: {
    stakeholderTitan: "senior-capstone-option-titan",
    stakeholderPrimary: "senior-capstone-option-primary",
  },
  pagesDevFallbacks: {
    publicGuide: "https://senior-capstone-public.pages.dev",
    appBackend: "https://senior-capstone-app.pages.dev",
  },
  retiredPagesDevFallbacks: {
    stakeholderTitan: "https://senior-capstone-option-titan.pages.dev",
    stakeholderPrimary: "https://senior-capstone-option-primary.pages.dev",
  },
  policy: {
    stakeholderOptionsMayUseProductDomain: false,
    retiredStakeholderOptionsMayDeploy: false,
    realUserOnboardingPolicyChangeAllowed: false,
    redirectAppPagesDevAliasToCanonical: true,
    guideFutureDomainMustRemainTbd: true,
    doNotUseRedirectsFileForDomainLevelRedirects: true,
    targetDomainLiveStatus: "active-cloudflare-dns-tls-verified",
    canonicalRedirectStatus: "all-user-facing-aliases-to-thecapstoneapp.com",
    retiredAppSubdomainStatus: "must-have-no-pages-attachment-or-dns-record",
  },
};

const currentDocs = {
  "docs/custom-domain-cutover-checklist.md": [
    "Product/app canonical domain: `thecapstoneapp.com`",
    "Canonical app URL: `https://thecapstoneapp.com/`",
    "Canonical product alias: `www.thecapstoneapp.com`",
    "Secondary redirect hostnames: `thecapstoneproject.com`, `www.thecapstoneproject.com`",
    "Retired app hostname: `app.thecapstoneapp.com`",
    "must be absent from both DNS and the Pages domain list",
    "East Tech guide future custom domain: `TBD`",
    "Permanent redirect target: `https://thecapstoneapp.com`",
    "Google OAuth redirect URI: `https://thecapstoneapp.com/api/auth/google/callback`",
    "GET /accounts/{account_id}/pages/projects/{project_name}/domains",
    "DELETE /accounts/{account_id}/pages/projects/{project_name}/domains/{domain_name}",
    "CNAME-only warning",
    "`_redirects` limitations",
  ].join("\n"),
  "docs/production-surface-registry.md": [
    "thecapstoneproject.com",
    "www.thecapstoneproject.com",
    "thecapstoneapp.com",
    "www.thecapstoneapp.com",
    "app.thecapstoneapp.com",
    "npm run check:custom-domain-cutover",
    "npm run check:alpha-account-gating",
    "npm run check:production-cutover",
  ].join("\n"),
  "docs/production-deployment-policy.md": [
    "Capstone Project",
    "thecapstoneproject.com",
    "East Tech guide future custom domain is `TBD`",
    "Cloudflare Pages custom-domain association",
    "senior-capstone-option-titan",
    "senior-capstone-option-primary",
    "`_routes.json`",
    "`_redirects`",
  ].join("\n"),
};

test("valid Capstone Project target-domain config passes", () => {
  assert.equal(validateProductionDomainConfig(validConfig).ok, true);
});

test("guide domain invented value fails", () => {
  const config = structuredClone(validConfig);
  config.guide.futureCustomDomain = "easttechcapstone.example";
  const result = validateProductionDomainConfig(config);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /guide\.futureCustomDomain/);
});

test("retired stakeholder project mapped to target product hostname fails", () => {
  const config = structuredClone(validConfig);
  config.customDomains = {
    stakeholderTitan: ["thecapstoneproject.com"],
  };
  const result = validateProductionDomainConfig(config);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /retired stakeholder project/);
});

test("missing target product hostname fails", () => {
  const config = structuredClone(validConfig);
  config.targetHostnames.productApex = "";
  const result = validateProductionDomainConfig(config);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /targetHostnames\.productApex/);
});

test("docs must include target, legacy, and SSO redirect state", () => {
  const result = validateCutoverDocs(currentDocs);
  assert.equal(result.ok, true);
});

test("docs missing target domain fail", () => {
  const docs = {
    ...currentDocs,
    "docs/custom-domain-cutover-checklist.md": "Permanent redirect target: `https://thecapstoneapp.com`",
  };
  const result = validateCutoverDocs(docs);
  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /Product\/app canonical domain/);
});

test("no token can be reported as static pass plus live blocked by caller", () => {
  assert.equal(validateProductionDomainConfig(validConfig).ok, true);
  const association = evaluatePagesDomainAssociations({ projectDomains: {} });
  assert.equal(association.ok, false);
  assert.equal(association.missing, 4);
});

test("Pages API active target product statuses pass", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-app": [
        { name: "thecapstoneapp.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
        { name: "www.thecapstoneapp.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
        { name: "thecapstoneproject.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
        { name: "www.thecapstoneproject.com", status: "active", validation_data: { status: "active" }, verification_data: { status: "active" } },
      ],
      "senior-capstone-public": [],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, true);
  assert.equal(association.active, 4);
});

test("retired app subdomain must remain unconfigured", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-app": [
        { name: "thecapstoneapp.com", status: "active" },
        { name: "www.thecapstoneapp.com", status: "active" },
        { name: "thecapstoneproject.com", status: "active" },
        { name: "www.thecapstoneproject.com", status: "active" },
      ],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, true);
  assert.doesNotMatch(association.findings.map((finding) => finding.label).join("\n"), /RETIRED_HOSTNAME_STILL_ATTACHED/);
});

test("retired app subdomain attachment fails", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-app": [
        { name: "thecapstoneapp.com", status: "active" },
        { name: "www.thecapstoneapp.com", status: "active" },
        { name: "thecapstoneproject.com", status: "active" },
        { name: "www.thecapstoneproject.com", status: "active" },
        { name: "app.thecapstoneapp.com", status: "active" },
      ],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, false);
  assert.match(association.findings.map((finding) => finding.label).join("\n"), /RETIRED_HOSTNAME_STILL_ATTACHED/);
});

test("retired app subdomain DNS absence passes", async () => {
  const checks = await runRetiredHostnameDnsChecks({
    domains: validConfig,
    resolveRecordsImpl: async () => [],
  });
  assert.equal(checks.length, 1);
  assert.equal(checks[0].ok, true);
});

test("retired app subdomain DNS record fails", async () => {
  const checks = await runRetiredHostnameDnsChecks({
    domains: validConfig,
    resolveRecordsImpl: async () => [{ type: "CNAME", value: "senior-capstone-app.pages.dev" }],
  });
  assert.equal(checks.length, 1);
  assert.equal(checks[0].ok, false);
  assert.equal(checks[0].records, 1);
});

test("Pages API pending statuses produce pending", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-app": [
        { name: "thecapstoneapp.com", status: "pending" },
        { name: "www.thecapstoneapp.com", status: "initializing" },
        { name: "thecapstoneproject.com", status: "pending" },
        { name: "www.thecapstoneproject.com", status: "initializing" },
      ],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
  });
  assert.equal(association.ok, false);
  assert.equal(association.pending, 4);
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
  assert.equal(association.missing, 4);
});

test("CNAME-only fixture fails", () => {
  const association = evaluatePagesDomainAssociations({
    projectDomains: {
      "senior-capstone-app": [],
      "senior-capstone-option-titan": [],
      "senior-capstone-option-primary": [],
    },
    dnsRecords: [
      { type: "CNAME", name: "www.thecapstoneproject.com", content: "senior-capstone-app.pages.dev" },
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
