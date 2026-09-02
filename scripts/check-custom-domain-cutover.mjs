#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve4, resolve6, resolveCname } from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, "config", "production-domains.json");

const EXPECTED = {
  accountId: "539e8f7c55e7b1472013626ad72f4c7f",
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
  guideFutureCustomDomain: "TBD",
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
};

const REQUIRED_TARGET_HOSTNAMES = new Set([
  ...Object.values(EXPECTED.targetHostnames),
  EXPECTED.redirectHostnames.productWwwAlias,
  EXPECTED.redirectHostnames.secondaryApex,
  EXPECTED.redirectHostnames.secondaryWwwAlias,
]);
const ACTIVE_STATUS = new Set(["active"]);
const PENDING_STATUS = new Set(["initializing", "pending"]);
const FAIL_STATUS = new Set(["blocked", "deactivated", "error"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function stringField(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function collectStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (isRecord(value)) return Object.values(value).flatMap(collectStrings);
  return [];
}

export function redactKnownSecrets(text, extraSecrets = []) {
  let sanitized = String(text || "").replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
  const exactSecrets = [
    process.env.CLOUDFLARE_API_TOKEN,
    ...extraSecrets,
  ]
    .map((value) => String(value || "").trim())
    .filter((value) => value.length >= 8);

  for (const secret of exactSecrets) {
    sanitized = sanitized.split(secret).join("[REDACTED]");
  }

  return sanitized
    .replace(/Authorization:\s*Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Authorization: Bearer [REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{24,}/gi, "Bearer [REDACTED]")
    .replace(/(["']?(?:token|secret|client_secret|private_key|password|sc_session)["']?\s*[:=]\s*["'])[^"'\r\n]{4,}(["'])/gi, "$1[REDACTED]$2");
}

function addFailure(result, message) {
  result.failures.push(message);
}

function assertEqual(result, actual, expected, label) {
  if (actual === expected) return;
  addFailure(result, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assertNested(result, object, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    assertEqual(result, object?.[key], value, `${label}.${key}`);
  }
}

export function validateProductionDomainConfig(config) {
  const result = { ok: true, failures: [], warnings: [] };

  if (!isRecord(config)) {
    result.failures.push("config must be an object");
    result.ok = false;
    return result;
  }

  assertEqual(result, config.schemaVersion, 4, "schemaVersion");
  assertEqual(result, config.productDomain, EXPECTED.productDomain, "productDomain");
  assertEqual(result, config.canonicalUrl, EXPECTED.canonicalUrl, "canonicalUrl");
  assertEqual(result, config.rootMode, EXPECTED.rootMode, "rootMode");
  assertNested(result, config.targetHostnames, EXPECTED.targetHostnames, "targetHostnames");
  assertNested(result, config.redirectHostnames, EXPECTED.redirectHostnames, "redirectHostnames");
  assertNested(result, config.retiredHostnames, EXPECTED.retiredHostnames, "retiredHostnames");
  assertEqual(result, config.currentSsoRedirectUri, EXPECTED.currentSsoRedirectUri, "currentSsoRedirectUri");
  assertEqual(result, config.guide?.futureCustomDomain, EXPECTED.guideFutureCustomDomain, "guide.futureCustomDomain");
  assertEqual(result, config.guide?.currentDeploySource, "public-companion/", "guide.currentDeploySource");
  assertEqual(result, config.guide?.currentPagesProject, EXPECTED.pagesProjects.publicGuide, "guide.currentPagesProject");
  assertEqual(result, config.guide?.currentPagesDevFallback, EXPECTED.pagesDevFallbacks.publicGuide, "guide.currentPagesDevFallback");
  assertNested(result, config.pagesProjects, EXPECTED.pagesProjects, "pagesProjects");
  assertNested(result, config.retiredPagesProjects, EXPECTED.retiredPagesProjects, "retiredPagesProjects");
  assertNested(result, config.pagesDevFallbacks, EXPECTED.pagesDevFallbacks, "pagesDevFallbacks");
  assertNested(result, config.retiredPagesDevFallbacks, EXPECTED.retiredPagesDevFallbacks, "retiredPagesDevFallbacks");

  const policy = config.policy || {};
  assertEqual(result, policy.stakeholderOptionsMayUseProductDomain, false, "policy.stakeholderOptionsMayUseProductDomain");
  assertEqual(result, policy.retiredStakeholderOptionsMayDeploy, false, "policy.retiredStakeholderOptionsMayDeploy");
  assertEqual(result, policy.realUserOnboardingPolicyChangeAllowed, false, "policy.realUserOnboardingPolicyChangeAllowed");
  assertEqual(result, policy.redirectAppPagesDevAliasToCanonical, true, "policy.redirectAppPagesDevAliasToCanonical");
  assertEqual(result, policy.guideFutureDomainMustRemainTbd, true, "policy.guideFutureDomainMustRemainTbd");
  assertEqual(result, policy.doNotUseRedirectsFileForDomainLevelRedirects, true, "policy.doNotUseRedirectsFileForDomainLevelRedirects");
  assertEqual(result, policy.targetDomainLiveStatus, "active-cloudflare-dns-tls-verified", "policy.targetDomainLiveStatus");
  assertEqual(result, policy.canonicalRedirectStatus, "all-user-facing-aliases-to-thecapstoneapp.com", "policy.canonicalRedirectStatus");
  assertEqual(result, policy.retiredAppSubdomainStatus, "must-have-no-pages-attachment-or-dns-record", "policy.retiredAppSubdomainStatus");

  const retiredStrings = [
    ...collectStrings(config.retiredPagesProjects),
    ...collectStrings(config.customDomains?.stakeholderTitan),
    ...collectStrings(config.customDomains?.stakeholderPrimary),
  ];
  for (const value of retiredStrings) {
    if (REQUIRED_TARGET_HOSTNAMES.has(value)) {
      addFailure(result, `retired stakeholder project is mapped to target product hostname ${value}`);
    }
  }

  result.ok = result.failures.length === 0;
  return result;
}

export function validateCutoverDocs(files) {
  const result = { ok: true, failures: [], warnings: [] };
  const cutover = files["docs/custom-domain-cutover-checklist.md"] || "";
  const registry = files["docs/production-surface-registry.md"] || "";
  const policy = files["docs/production-deployment-policy.md"] || "";

  const requiredCutoverPhrases = [
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
    "CNAME-only",
    "`_redirects`",
  ];
  for (const phrase of requiredCutoverPhrases) {
    if (!cutover.includes(phrase)) {
      result.failures.push(`custom-domain checklist missing required phrase: ${phrase}`);
    }
  }

  for (const hostname of Object.values(EXPECTED.targetHostnames)) {
    if (!registry.includes(hostname)) {
      result.failures.push(`production surface registry missing target hostname ${hostname}`);
    }
  }
  for (const hostname of [
    EXPECTED.redirectHostnames.productWwwAlias,
    EXPECTED.redirectHostnames.secondaryApex,
    EXPECTED.redirectHostnames.secondaryWwwAlias,
    EXPECTED.retiredHostnames.appSubdomain,
  ]) {
    if (!registry.includes(hostname)) {
      result.failures.push(`production surface registry missing redirect/retired hostname ${hostname}`);
    }
  }

  const registryCommands = [
    "npm run check:custom-domain-cutover",
    "npm run check:alpha-account-gating",
    "npm run check:production-cutover",
  ];
  for (const command of registryCommands) {
    if (!registry.includes(command)) {
      result.failures.push(`production surface registry missing validation command ${command}`);
    }
  }

  const policyPhrases = [
    "Capstone Project",
    "thecapstoneproject.com",
    "East Tech guide future custom domain is `TBD`",
    "Cloudflare Pages custom-domain association",
    "senior-capstone-option-titan",
    "senior-capstone-option-primary",
    "`_routes.json`",
    "`_redirects`",
  ];
  for (const phrase of policyPhrases) {
    if (!policy.includes(phrase)) {
      result.failures.push(`production deployment policy missing required phrase: ${phrase}`);
    }
  }

  result.ok = result.failures.length === 0;
  return result;
}

function domainRecordName(record) {
  return stringField(record, ["name", "hostname", "domain", "domain_name"]);
}

function domainStatus(record) {
  return normalizeStatus(stringField(record, ["status"]));
}

function nestedStatus(record, key) {
  const value = record?.[key];
  if (typeof value === "string") return normalizeStatus(value);
  if (isRecord(value)) return normalizeStatus(stringField(value, ["status"]));
  return "";
}

function safeDomainSummary(record) {
  return {
    name: domainRecordName(record),
    status: domainStatus(record) || "unknown",
    validationStatus: nestedStatus(record, "validation_data") || "unknown",
    verificationStatus: nestedStatus(record, "verification_data") || "unknown",
  };
}

function statusBucket(record) {
  const statuses = [
    domainStatus(record),
    nestedStatus(record, "validation_data"),
    nestedStatus(record, "verification_data"),
  ].filter(Boolean);
  if (statuses.some((status) => FAIL_STATUS.has(status))) return "fail";
  if (statuses.some((status) => PENDING_STATUS.has(status))) return "pending";
  if (statuses.length > 0 && statuses.every((status) => ACTIVE_STATUS.has(status) || status === "unknown")) return "active";
  if (ACTIVE_STATUS.has(domainStatus(record))) return "active";
  if (PENDING_STATUS.has(domainStatus(record))) return "pending";
  if (FAIL_STATUS.has(domainStatus(record))) return "fail";
  return "unknown";
}

export function evaluatePagesDomainAssociations({
  projectDomains,
  dnsRecords = [],
  expected = EXPECTED,
} = {}) {
  const findings = [];
  const summaries = [];
  const expectedMappings = [
    { hostname: expected.targetHostnames.productApex, project: expected.pagesProjects.appBackend, role: "product apex" },
    { hostname: expected.redirectHostnames.productWwwAlias, project: expected.pagesProjects.appBackend, role: "product www redirect" },
    { hostname: expected.redirectHostnames.secondaryApex, project: expected.pagesProjects.appBackend, role: "secondary redirect apex" },
    { hostname: expected.redirectHostnames.secondaryWwwAlias, project: expected.pagesProjects.appBackend, role: "secondary redirect www" },
  ];
  const retiredProjects = Object.values(expected.retiredPagesProjects || {});
  const domainsByProject = projectDomains || {};

  for (const [project, entries] of Object.entries(domainsByProject)) {
    for (const entry of entries || []) {
      summaries.push({ project, ...safeDomainSummary(entry), bucket: statusBucket(entry) });
    }
  }

  for (const mapping of expectedMappings) {
    const record = (domainsByProject[mapping.project] || []).find((entry) => domainRecordName(entry) === mapping.hostname);
    if (!record) {
      const cnameOnly = dnsRecords.some((entry) => (
        isRecord(entry)
        && stringField(entry, ["name", "hostname"]) === mapping.hostname
        && stringField(entry, ["type"]).toUpperCase() === "CNAME"
        && /\.pages\.dev\.?$/i.test(stringField(entry, ["content", "target", "value"]))
      ));
      findings.push({
        code: cnameOnly ? "CNAME_ONLY_WITHOUT_PAGES_ASSOCIATION" : "PAGES_DOMAIN_ASSOCIATION_MISSING",
        label: "PAGES_DOMAIN_ASSOCIATION_MISSING",
        project: mapping.project,
        hostname: mapping.hostname,
        optional: false,
        message: cnameOnly
          ? `${mapping.hostname} has CNAME-looking evidence but no Pages custom-domain association on ${mapping.project}`
          : `${mapping.hostname} is missing from ${mapping.project}`,
      });
      continue;
    }

    const bucket = statusBucket(record);
    if (bucket === "active") {
      findings.push({
        code: "PAGES_DOMAIN_ASSOCIATION_ACTIVE",
        label: "PAGES_DOMAIN_ASSOCIATION_ACTIVE",
        project: mapping.project,
        hostname: mapping.hostname,
        optional: false,
        message: `${mapping.hostname} is active on ${mapping.project}`,
      });
    } else if (bucket === "pending") {
      findings.push({
        code: "PAGES_DOMAIN_ASSOCIATION_PENDING",
        label: "PAGES_DOMAIN_ASSOCIATION_PENDING",
        project: mapping.project,
        hostname: mapping.hostname,
        optional: false,
        message: `${mapping.hostname} is pending on ${mapping.project}`,
      });
    } else {
      findings.push({
        code: "PAGES_DOMAIN_ASSOCIATION_NOT_ACTIVE",
        label: bucket === "fail" ? "PAGES_DOMAIN_ASSOCIATION_FAILED" : "PAGES_DOMAIN_ASSOCIATION_PENDING",
        project: mapping.project,
        hostname: mapping.hostname,
        optional: false,
        message: `${mapping.hostname} is not active on ${mapping.project}`,
      });
    }
  }

  const retiredHostnames = new Set(Object.values(expected.retiredHostnames || {}));
  for (const [project, entries] of Object.entries(domainsByProject)) {
    for (const entry of entries || []) {
      const hostname = domainRecordName(entry);
      if (!retiredHostnames.has(hostname)) continue;
      findings.push({
        code: "RETIRED_HOSTNAME_STILL_ATTACHED",
        label: "RETIRED_HOSTNAME_STILL_ATTACHED",
        project,
        hostname,
        optional: false,
        message: `${hostname} must be detached from ${project}`,
      });
    }
  }

  for (const project of retiredProjects) {
    for (const entry of domainsByProject[project] || []) {
      const hostname = domainRecordName(entry);
      if (REQUIRED_TARGET_HOSTNAMES.has(hostname)) {
        findings.push({
          code: "RETIRED_STAKEHOLDER_PROJECT_HAS_TARGET_HOSTNAME",
          label: "CUSTOM_DOMAIN_CUTOVER_NOT_VERIFIED",
          project,
          hostname,
          message: `${hostname} must not be attached to retired stakeholder project ${project}`,
        });
      }
    }
  }

  const requiredFindings = findings.filter((finding) => !finding.optional);
  const activeCount = requiredFindings.filter((finding) => finding.code === "PAGES_DOMAIN_ASSOCIATION_ACTIVE").length;
  const pendingCount = requiredFindings.filter((finding) => finding.code === "PAGES_DOMAIN_ASSOCIATION_PENDING" || finding.label === "PAGES_DOMAIN_ASSOCIATION_PENDING").length;
  const missingCount = requiredFindings.filter((finding) => finding.code === "PAGES_DOMAIN_ASSOCIATION_MISSING" || finding.code === "CNAME_ONLY_WITHOUT_PAGES_ASSOCIATION").length;
  const failCount = findings.filter((finding) => /FAILED|STAKEHOLDER|NOT_ACTIVE|RETIRED_HOSTNAME/.test(finding.code) && !finding.optional).length;

  return {
    ok: activeCount === expectedMappings.length && failCount === 0,
    active: activeCount,
    pending: pendingCount,
    missing: missingCount,
    fail: failCount,
    findings,
    summaries,
  };
}

function resultArray(data) {
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data)) return data;
  return [];
}

async function cloudflareRequest(fetchImpl, apiPath, token) {
  const response = await fetchImpl(`https://api.cloudflare.com/client/v4${apiPath}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Cloudflare API returned HTTP ${response.status} with non-JSON output`);
  }

  if (!response.ok || data.success === false) {
    const errors = Array.isArray(data.errors)
      ? data.errors.map((error) => `${error?.code || ""} ${error?.message || ""}`.trim()).filter(Boolean).join("; ")
      : "";
    const permission = response.status === 401 || response.status === 403 || /permission|auth|scope|forbidden/i.test(errors);
    const error = new Error(`Cloudflare API ${apiPath} failed with HTTP ${response.status}${errors ? `: ${errors}` : ""}`);
    error.status = response.status;
    error.insufficientScope = permission;
    throw error;
  }
  return data;
}

export async function fetchPagesDomainAssociations({ token, accountId, fetchImpl = fetch }) {
  await cloudflareRequest(fetchImpl, "/user/tokens/verify", token);

  const projectNames = [
    ...Object.values(EXPECTED.pagesProjects),
    ...Object.values(EXPECTED.retiredPagesProjects),
  ];
  const projectDomains = {};
  for (const projectName of projectNames) {
    try {
      const data = await cloudflareRequest(
        fetchImpl,
        `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}/domains`,
        token,
      );
      projectDomains[projectName] = resultArray(data);
    } catch (error) {
      if (error?.status === 404 && projectName !== EXPECTED.pagesProjects.appBackend) {
        projectDomains[projectName] = [];
        continue;
      }
      throw error;
    }
  }
  return projectDomains;
}

async function fetchWithRedirects(url, { fetchImpl = fetch, timeoutMs = 8000, maxRedirects = 5 } = {}) {
  let current = new URL(url);
  const visited = [];
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "CapstoneProjectDomainCutoverChecker/1.0",
        },
      });
      const location = response.headers.get("location");
      visited.push({ url: current.toString(), status: response.status, location: location || "" });
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, current);
        if (current.protocol !== "https:") {
          return { ok: false, reason: "redirected away from HTTPS", visited };
        }
        continue;
      }
      const text = await response.text().catch(() => "");
      return { ok: response.ok, status: response.status, text, visited, finalUrl: current.toString() };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, reason: "too many redirects", visited };
}

function responseLooksUnsafe(response) {
  const text = String(response.text || "");
  const urls = (response.visited || []).map((entry) => `${entry.url} ${entry.location}`).join(" ");
  return /senior-capstone-option-(titan|primary)|alpha\.html|account\.html/i.test(`${urls}\n${text}`);
}

export async function runHttpsLiveChecks({ fetchImpl = fetch, domains = EXPECTED } = {}) {
  const checks = [];
  const productTargets = [
    { label: "product root", url: `https://${domains.targetHostnames.productApex}/` },
    { label: "legacy workspace path", url: `https://${domains.targetHostnames.productApex}/workspace?domain-check=1` },
    { label: "product api health", url: `https://${domains.targetHostnames.productApex}/api/health` },
    { label: "product api auth me", url: `https://${domains.targetHostnames.productApex}/api/auth/me` },
  ];
  for (const target of productTargets) {
    try {
      const response = await fetchWithRedirects(target.url, { fetchImpl });
      let ok = Boolean(response.ok && !responseLooksUnsafe(response));
      if (target.label === "product api auth me") {
        ok = [200, 401].includes(response.status) && /authenticated|unauthorized|not_authenticated/i.test(response.text || "");
      }
      if (target.label === "product api health") {
        ok = response.status === 200 && /environment|ok|healthy|authMode/i.test(response.text || "");
      }
      if (target.label === "product root") {
        const finalUrl = response.finalUrl ? new URL(response.finalUrl) : null;
        ok = response.status === 200
          && finalUrl?.hostname === domains.targetHostnames.productApex
          && finalUrl?.pathname === "/"
          && !responseLooksUnsafe(response);
      }
      if (target.label === "legacy workspace path") {
        const firstHop = response.visited?.[0];
        const redirectLocation = firstHop?.location ? new URL(firstHop.location, target.url) : null;
        const finalUrl = response.finalUrl ? new URL(response.finalUrl) : null;
        ok = firstHop?.status === 308
          && redirectLocation?.hostname === domains.targetHostnames.productApex
          && redirectLocation?.pathname === "/"
          && redirectLocation?.search === "?domain-check=1"
          && finalUrl?.pathname === "/"
          && response.status === 200
          && !responseLooksUnsafe(response);
      }
      checks.push({
        ...target,
        ok,
        status: response.status || null,
        finalUrl: response.finalUrl || "",
        reason: response.reason || "",
      });
    } catch (error) {
      checks.push({ ...target, ok: false, status: null, finalUrl: "", reason: error instanceof Error ? error.message : String(error) });
    }
  }

  const redirectTargets = [
    { label: "product www redirect", url: `https://${domains.redirectHostnames.productWwwAlias}/workspace?domain-check=1`, expectedPath: "/" },
    { label: "secondary redirect apex", url: `https://${domains.redirectHostnames.secondaryApex}/workspace?domain-check=1`, expectedPath: "/" },
    { label: "secondary redirect www", url: `https://${domains.redirectHostnames.secondaryWwwAlias}/workspace?domain-check=1`, expectedPath: "/" },
    { label: "Pages alias redirect", url: `https://${domains.redirectHostnames.pagesDevAlias}/workspace?domain-check=1`, expectedPath: "/" },
  ];
  for (const target of redirectTargets) {
    try {
      const response = await fetchWithRedirects(target.url, { fetchImpl });
      const firstHop = response.visited?.[0];
      const redirectLocation = firstHop?.location ? new URL(firstHop.location, target.url) : null;
      const finalUrl = response.finalUrl ? new URL(response.finalUrl) : null;
      checks.push({
        ...target,
        ok: firstHop?.status === 308
          && redirectLocation?.hostname === domains.targetHostnames.productApex
          && redirectLocation?.pathname === target.expectedPath
          && redirectLocation?.search === "?domain-check=1"
          && finalUrl?.hostname === domains.targetHostnames.productApex
          && finalUrl?.pathname === target.expectedPath
          && response.status === 200,
        status: response.status || null,
        finalUrl: response.finalUrl || "",
        reason: response.reason || "",
      });
    } catch (error) {
      checks.push({ ...target, ok: false, status: null, finalUrl: "", reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return checks;
}

async function resolveRetiredHostnameRecords(hostname) {
  const lookups = [
    ["A", resolve4],
    ["AAAA", resolve6],
    ["CNAME", resolveCname],
  ];
  const records = [];
  for (const [type, lookup] of lookups) {
    try {
      const values = await lookup(hostname);
      for (const value of values || []) records.push({ type, value });
    } catch (error) {
      const code = String(error?.code || "").toUpperCase();
      if (code !== "ENOTFOUND" && code !== "ENODATA") throw error;
    }
  }
  return records;
}

export async function runRetiredHostnameDnsChecks({ resolveRecordsImpl = resolveRetiredHostnameRecords, domains = EXPECTED } = {}) {
  const checks = [];
  for (const hostname of Object.values(domains.retiredHostnames || {})) {
    try {
      const records = await resolveRecordsImpl(hostname);
      checks.push({
        label: "retired hostname DNS",
        hostname,
        ok: records.length === 0,
        records: Array.isArray(records) ? records.length : 0,
        reason: records.length === 0 ? "no A, AAAA, or CNAME record" : "retired hostname still resolves",
      });
    } catch (error) {
      checks.push({
        label: "retired hostname DNS",
        hostname,
        ok: false,
        records: 0,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return checks;
}

async function readTextIfExists(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8").catch(() => "");
}

async function loadDocsForValidation() {
  const paths = [
    "docs/custom-domain-cutover-checklist.md",
    "docs/production-surface-registry.md",
    "docs/production-deployment-policy.md",
  ];
  const entries = await Promise.all(paths.map(async (relativePath) => [relativePath.replace(/\\/g, "/"), await readTextIfExists(relativePath)]));
  return Object.fromEntries(entries);
}

function printStaticLabels(config) {
  console.log(`PRODUCT_DOMAIN_TARGET ${config.productDomain}`);
  console.log(`CANONICAL_URL ${config.canonicalUrl}`);
  console.log(`ROOT_MODE_TARGET ${config.rootMode}`);
  console.log(`TARGET_PRODUCT_APEX ${config.targetHostnames.productApex}`);
  console.log(`REDIRECT_PRODUCT_WWW_ALIAS ${config.redirectHostnames.productWwwAlias}`);
  console.log(`REDIRECT_SECONDARY_APEX ${config.redirectHostnames.secondaryApex}`);
  console.log(`REDIRECT_SECONDARY_WWW_ALIAS ${config.redirectHostnames.secondaryWwwAlias}`);
  console.log(`REDIRECT_PAGES_DEV_ALIAS ${config.redirectHostnames.pagesDevAlias}`);
  console.log(`GUIDE_FUTURE_DOMAIN ${config.guide.futureCustomDomain}`);
  console.log(`RETIRED_APP_SUBDOMAIN ${config.retiredHostnames.appSubdomain}`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const liveRequired = args.has("--live-required");
  const liveHttp = args.has("--live-http") || liveRequired;
  const staticOnly = args.has("--static-only");
  const token = String(process.env.CLOUDFLARE_API_TOKEN || "").trim();
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || EXPECTED.accountId).trim();
  let exitCode = 0;

  const config = JSON.parse(await readFile(configPath, "utf8"));
  printStaticLabels(config);

  const configResult = validateProductionDomainConfig(config);
  for (const failure of configResult.failures) {
    console.error(`FAIL static: ${failure}`);
  }

  const docResult = validateCutoverDocs(await loadDocsForValidation());
  for (const failure of docResult.failures) {
    console.error(`FAIL static: ${failure}`);
  }

  if (!configResult.ok || !docResult.ok) {
    console.error("CUSTOM_DOMAIN_CUTOVER_NOT_VERIFIED static config/docs failed.");
    process.exit(1);
  }
  console.log("PASS static: target domain config and docs are aligned without claiming live Cloudflare cutover.");

  if (staticOnly) {
    console.log("CUSTOM_DOMAIN_CUTOVER_NOT_VERIFIED live custom-domain checks skipped by --static-only.");
    process.exit(0);
  }

  let associationsVerified = false;
  if (!token) {
    console.log("CLOUDFLARE_DOMAIN_CHECK_BLOCKED_NO_TOKEN Pages Domains API verification blocked because CLOUDFLARE_API_TOKEN is not set.");
  } else {
    try {
      const projectDomains = await fetchPagesDomainAssociations({ token, accountId });
      const association = evaluatePagesDomainAssociations({ projectDomains });
      for (const finding of association.findings) {
        const method = finding.code === "PAGES_DOMAIN_ASSOCIATION_ACTIVE" || finding.optional ? "log" : "error";
        console[method](`${finding.label} ${finding.hostname} ${finding.project}: ${finding.message}`);
      }
      for (const summary of association.summaries) {
        console.log(`PAGES_DOMAIN_SUMMARY ${summary.project} ${summary.name} status=${summary.status} validation=${summary.validationStatus} verification=${summary.verificationStatus}`);
      }
      associationsVerified = association.ok;
      if (!association.ok && liveRequired) exitCode = 1;
    } catch (error) {
      const message = redactKnownSecrets(error instanceof Error ? error.message : String(error));
      if (error?.insufficientScope) {
        console.error(`CLOUDFLARE_DOMAIN_CHECK_BLOCKED_INSUFFICIENT_SCOPE ${message}`);
      } else {
        console.error(`CUSTOM_DOMAIN_CUTOVER_NOT_VERIFIED ${message}`);
      }
      if (liveRequired) exitCode = 1;
    }
  }

  let httpsVerified = false;
  let retiredDnsVerified = false;
  if (liveHttp) {
    const checks = await runHttpsLiveChecks({ domains: config });
    httpsVerified = checks.every((check) => check.ok);
    for (const check of checks) {
      const label = check.ok ? "PASS live" : "FAIL live";
      console.log(`${label}: ${check.label} ${check.url} status=${check.status ?? "n/a"}${check.finalUrl ? ` final=${check.finalUrl}` : ""}${check.reason ? ` reason=${redactKnownSecrets(check.reason)}` : ""}`);
    }
    if (!httpsVerified) {
      console.log("DNS_OR_TLS_PENDING one or more HTTPS target-domain checks did not pass.");
      if (liveRequired) exitCode = 1;
    }

    const retiredDnsChecks = await runRetiredHostnameDnsChecks({ domains: config });
    retiredDnsVerified = retiredDnsChecks.every((check) => check.ok);
    for (const check of retiredDnsChecks) {
      const label = check.ok ? "PASS live" : "FAIL live";
      console.log(`${label}: ${check.label} ${check.hostname} records=${check.records}${check.reason ? ` reason=${redactKnownSecrets(check.reason)}` : ""}`);
    }
    if (!retiredDnsVerified && liveRequired) exitCode = 1;
  }

  if (associationsVerified && (!liveHttp || (httpsVerified && retiredDnsVerified))) {
    console.log("CUSTOM_DOMAIN_CUTOVER_VERIFIED target product domain associations, HTTPS behavior, and retired-hostname DNS checks passed.");
  } else {
    console.log("CUSTOM_DOMAIN_CUTOVER_NOT_VERIFIED target product domain cutover is pending, blocked, or not requested.");
  }

  process.exit(exitCode);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  main().catch((error) => {
    console.error(redactKnownSecrets(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
