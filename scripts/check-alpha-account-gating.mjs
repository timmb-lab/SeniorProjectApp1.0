#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.cwd();

const productionRootHtml = new Set([
  "index.html",
  "workspace.html",
  "program.html",
  "sponsorship-support.html",
  "calendar.html",
  "process.html",
  "phase-1.html",
  "phase-2a.html",
  "gathering-supplies.html",
  "managing-your-vision.html",
  "mentor-meeting-1.html",
  "phase-2b.html",
  "sprint-to-finish.html",
  "mentor-meeting-2.html",
  "present.html",
  "project-showcase.html",
  "celebrate.html",
  "launch.html",
  "finish.html",
  "pacing.html",
  "examples.html",
  "links.html",
  "templates.html",
  "portfolio.html",
  "rubrics.html",
  "grades.html",
  "start.html",
  "app-preview.html",
]);

const internalRoutePatterns = [
  ["alpha.html", /\bhref=["'][^"']*alpha\.html\b/i],
  ["account.html", /\bhref=["'][^"']*account\.html\b/i],
  ["/api/alpha/state", /\/api\/alpha\/state\b/i],
  ["/api/admin/test-accounts", /\/api\/admin\/test-accounts\b/i],
  ["smoke/reset/report controls", /\b(reset_alpha|run_readiness_report|runSmokeSequence|test-account|fake account)\b/i],
];

const driveIdPattern = /\b(?:0A|1[A-Za-z0-9_-])[A-Za-z0-9_-]{18,}\b/;
const rawSecretPattern = /\b(?:Authorization:\s*Bearer|CLOUDFLARE_API_TOKEN|client_secret|private_key|sc_session=|Set-Cookie:|Cookie:)/i;
const passwordLiteralPattern = /(["']?(?:password|passwords|temporaryPassword|setupPassword)["']?\s*[:=]\s*["'])(?!\[redacted\]|<redacted>|password|current-password|new-password|old-password)[^"'\r\n]{6,}(["'])/i;

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function textIncludesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasInternalQaLabel(text) {
  return /\binternal\b/i.test(text) && /\b(alpha|qa|smoke|account)\b/i.test(text);
}

function hasNotProductionWarning(text) {
  return /\bnot\s+(production|pilot-ready|canonical production navigation)\b/i.test(text)
    || /\bnot\s+production\s+navigation\b/i.test(text)
    || /\bdo\s+not\s+enter\s+real\s+student\s+records\b/i.test(text);
}

function hasNoRealStudentWarning(text) {
  return /\bdo\s+not\s+enter\s+real\s+student\s+records\b/i.test(text)
    || /\bno\s+real\s+student\s+records\b/i.test(text)
    || /\bfake\s+\.test\s+accounts?\s+only\b/i.test(text);
}

function containsLeak(text) {
  return rawSecretPattern.test(text) || passwordLiteralPattern.test(text) || driveIdPattern.test(text);
}

function report(failures, code, pathName, detail) {
  failures.push({ code, path: normalizePath(pathName), detail });
}

export function evaluateAlphaAccountGatingFixture(fixture) {
  const failures = [];
  const warnings = [];
  const productionFiles = fixture.productionFiles || {};
  const publicCompanionFiles = fixture.publicCompanionFiles || {};
  const stakeholderFiles = fixture.stakeholderFiles || {};
  const alphaHtml = fixture.alphaHtml || "";
  const accountHtml = fixture.accountHtml || "";
  const alphaApiSource = fixture.alphaApiSource || "";
  const testAccountsSource = fixture.testAccountsSource || "";
  const optionPolicy = fixture.optionPolicy || "option-a-open";

  for (const [file, text] of Object.entries(productionFiles)) {
    for (const [label, pattern] of internalRoutePatterns) {
      if (pattern.test(text)) {
        report(failures, "PRODUCTION_NAV_INTERNAL_ROUTE_LINK", file, `production navigation references ${label}`);
      }
    }
  }

  for (const [file, text] of Object.entries(publicCompanionFiles)) {
    if (/\bhref=["'][^"']*alpha\.html\b/i.test(text)) {
      report(failures, "PUBLIC_COMPANION_ALPHA_LINK", file, "public companion links to alpha.html");
    }
    if (/\bhref=["'][^"']*account\.html\b/i.test(text)) {
      report(failures, "PUBLIC_COMPANION_ACCOUNT_LINK", file, "public companion links to account.html");
    }
    if (file.endsWith("_redirects") && /(^|\n)\s*[^#\n]*\/api(?:\/|\s|$)/i.test(text)) {
      report(failures, "PUBLIC_COMPANION_API_PROXY", file, "public companion _redirects proxies /api/*");
    }
    if (file.endsWith("_redirects") && /(^|\n)\s*[^#\n]*(?:alpha\.html|account\.html)/i.test(text)) {
      report(failures, "PUBLIC_COMPANION_INTERNAL_PROXY", file, "public companion _redirects proxies internal alpha/account route");
    }
  }

  for (const [file, text] of Object.entries(stakeholderFiles)) {
    if (/\bhref=["'][^"']*account\.html\b/i.test(text)) {
      report(failures, "STAKEHOLDER_ACCOUNT_LINK", file, "stakeholder review output links to account.html");
    }
    if (/\bhref=["'][^"']*alpha\.html\b/i.test(text) && !/internal\s+(alpha\s+)?qa|qa\s+only|review-only/i.test(text)) {
      report(failures, "STAKEHOLDER_ALPHA_LINK_UNLABELED", file, "stakeholder alpha link is not explicitly labeled internal QA/review-only");
    }
  }

  if (!hasInternalQaLabel(alphaHtml)) {
    report(failures, "ALPHA_MISSING_INTERNAL_QA_LABEL", "alpha.html", "alpha page must say internal alpha/QA");
  }
  if (!hasNotProductionWarning(alphaHtml) || !hasNoRealStudentWarning(alphaHtml)) {
    report(failures, "ALPHA_MISSING_NOT_PRODUCTION_WARNING", "alpha.html", "alpha page must warn it is not production/pilot-ready and not for real student records");
  }
  if (containsLeak(alphaHtml)) {
    report(failures, "ALPHA_SECRET_OR_STORAGE_ID_LEAK", "alpha.html", "alpha page includes a password, token/cookie marker, or raw storage id");
  }

  if (!hasInternalQaLabel(accountHtml)) {
    report(failures, "ACCOUNT_MISSING_INTERNAL_QA_LABEL", "account.html", "account page must say internal account/session/evidence smoke or QA");
  }
  if (!hasNotProductionWarning(accountHtml) || !hasNoRealStudentWarning(accountHtml)) {
    report(failures, "ACCOUNT_MISSING_NOT_PRODUCTION_WARNING", "account.html", "account page must warn it is not production/pilot-ready and not for real student records");
  }
  if (containsLeak(accountHtml)) {
    report(failures, "ACCOUNT_SECRET_OR_STORAGE_ID_LEAK", "account.html", "account page includes a password, token/cookie marker, or raw storage id");
  }

  if (!/ALPHA_STATE_KEY|createAlphaSeedState|alphaOnly|seed/i.test(alphaApiSource)) {
    report(failures, "ALPHA_API_NOT_SEEDED_INTERNAL_STATE", "functions/api/alpha/state.js", "alpha state source must use seeded internal alpha state");
  }
  if (textIncludesAny(alphaApiSource, [/student_name/i, /\breal\s+student\b/i, /bryan\.timm89/i])) {
    report(failures, "ALPHA_API_REAL_DATA_RISK", "functions/api/alpha/state.js", "alpha state source contains real-data-looking markers");
  }

  if (!/senior-capstone\.test/.test(testAccountsSource) || !/Passwords were accepted.*not returned/i.test(testAccountsSource)) {
    report(failures, "TEST_ACCOUNTS_ROUTE_NOT_FAKE_OR_REDACTED", "functions/api/admin/test-accounts.ts", "test-account route must stay fake .test only and not return passwords");
  }
  if (passwordLiteralPattern.test(testAccountsSource.replace(/autocomplete="current-password"/g, ""))) {
    report(failures, "TEST_ACCOUNTS_PASSWORD_LITERAL", "functions/api/admin/test-accounts.ts", "test-account route includes a committed password literal");
  }

  if (optionPolicy === "option-a-open") {
    warnings.push("ALPHA_ACCOUNT_OPTION_A_OPEN: direct URL exposure remains acceptable only for internal QA until Bryan accepts Option B/C or direct exposure before pilot.");
  } else if (optionPolicy === "option-b") {
    const accessEvidence = `${fixture.policyDocs || ""}\n${fixture.cloudflareAccessEvidence || ""}`;
    if (!/Cloudflare Access|access-denied|unauthorized access.*denied|equivalent edge gate/i.test(accessEvidence)) {
      report(failures, "OPTION_B_ACCESS_GATE_MISSING", "docs/alpha-account-deployment-decision.md", "Option B requires verified Access/equivalent deny evidence");
    }
  } else if (optionPolicy === "option-c") {
    if (alphaHtml || accountHtml || fixture.alphaServed || fixture.accountServed) {
      report(failures, "OPTION_C_INTERNAL_FILES_STILL_SERVED", "alpha.html/account.html", "Option C requires alpha/account files to be absent or not served from production");
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
  };
}

async function existsFile(relativePath) {
  const info = await stat(path.join(repoRoot, relativePath)).catch(() => null);
  return Boolean(info?.isFile());
}

async function listFiles(dir) {
  const entries = await readdir(path.join(repoRoot, dir), { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const relative = normalizePath(path.join(dir, entry.name));
    if (entry.isDirectory()) {
      files.push(...await listFiles(relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

async function readText(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8").catch(() => "");
}

async function loadFixtureFromRepo() {
  const productionFiles = {};
  for (const file of productionRootHtml) {
    if (await existsFile(file)) {
      productionFiles[file] = await readText(file);
    }
  }
  for (const file of ["app.js", "styles.css", "workspace.js", "workspace.css"]) {
    if (await existsFile(file)) {
      productionFiles[file] = await readText(file);
    }
  }

  const publicCompanionFiles = {};
  for (const file of await listFiles("public-companion")) {
    if (/\.(html|js|css|json)$/.test(file) || path.basename(file).startsWith("_")) {
      publicCompanionFiles[file] = await readText(file);
    }
  }

  const stakeholderFiles = {};
  for (const root of ["old/stakeholder-options/titan-blend", "old/stakeholder-options/back-to-basics"]) {
    for (const file of await listFiles(root)) {
      if (/\.(html|js|css|json)$/.test(file) || path.basename(file).startsWith("_")) {
        stakeholderFiles[file] = await readText(file);
      }
    }
  }

  const policyDocs = await readText("docs/alpha-account-deployment-decision.md");
  return {
    productionFiles,
    publicCompanionFiles,
    stakeholderFiles,
    alphaHtml: await readText("alpha.html"),
    accountHtml: await readText("account.html"),
    alphaApiSource: await readText("functions/api/alpha/state.js"),
    testAccountsSource: await readText("functions/api/admin/test-accounts.ts"),
    policyDocs,
    optionPolicy: /Current enforceable state is Option A safety/i.test(policyDocs)
      ? "option-a-open"
      : "option-a-open",
  };
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "SeniorProjectAppAlphaAccountGatingChecker/1.0",
      },
    });
    const text = await response.text().catch(() => "");
    return { ok: response.ok, status: response.status, text, location: response.headers.get("location") || "" };
  } finally {
    clearTimeout(timer);
  }
}

async function runLiveChecks(baseUrl) {
  const urls = [
    "/alpha.html",
    "/account.html",
    "/api/alpha/state",
    "/api/admin/test-accounts",
  ];
  const checks = [];
  for (const suffix of urls) {
    const url = new URL(suffix, baseUrl).toString();
    try {
      const response = await fetchWithTimeout(url);
      const safeText = response.text.slice(0, 2000);
      let ok = true;
      if (suffix.endsWith("alpha.html")) {
        ok = response.status === 200 && hasInternalQaLabel(safeText) && !containsLeak(safeText);
      } else if (suffix.endsWith("account.html")) {
        ok = response.status === 200 && hasInternalQaLabel(safeText) && !containsLeak(safeText);
      } else if (suffix === "/api/alpha/state") {
        ok = response.status === 200 && /state|alpha|walkthrough/i.test(safeText) && !containsLeak(safeText);
      } else if (suffix === "/api/admin/test-accounts") {
        ok = [401, 403, 405].includes(response.status) && !containsLeak(safeText);
      }
      checks.push({ url, status: response.status, ok, location: response.location });
    } catch (error) {
      checks.push({ url, status: null, ok: false, location: "", error: error instanceof Error ? error.message : String(error) });
    }
  }
  return checks;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const liveRequired = args.has("--live-required");
  const live = args.has("--live") || liveRequired;
  const fixture = await loadFixtureFromRepo();
  const result = evaluateAlphaAccountGatingFixture(fixture);

  for (const failure of result.failures) {
    console.error(`FAIL static: ${failure.code} ${failure.path} - ${failure.detail}`);
  }
  for (const warning of result.warnings) {
    console.log(`WARN static: ${warning}`);
  }

  if (!result.ok) {
    console.error("ALPHA_ACCOUNT_GATING_NOT_VERIFIED static gating checks failed.");
    process.exit(1);
  }

  console.log("PASS static: alpha/account internal QA labels, production nav scan, public companion redirect scan, and fake-account source checks passed.");

  let liveOk = true;
  if (live) {
    const baseUrl = String(process.env.ALPHA_ACCOUNT_GATING_BASE_URL || "https://app.thecapstoneapp.com").replace(/\/+$/, "/");
    const checks = await runLiveChecks(baseUrl);
    liveOk = checks.every((check) => check.ok);
    for (const check of checks) {
      const label = check.ok ? "PASS live" : "FAIL live";
      console.log(`${label}: ${check.url} status=${check.status ?? "n/a"}${check.location ? ` location=${check.location}` : ""}${check.error ? ` error=${check.error}` : ""}`);
    }
  }

  if (!liveOk && liveRequired) {
    console.error("ALPHA_ACCOUNT_GATING_NOT_VERIFIED live gating checks failed.");
    process.exit(1);
  }

  console.log("ALPHA_ACCOUNT_GATING_VERIFIED static checks passed; live checks are separate unless requested.");
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
