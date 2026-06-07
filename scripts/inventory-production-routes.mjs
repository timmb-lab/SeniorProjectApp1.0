#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, "docs", "generated", "production-route-inventory.md");
const args = new Set(process.argv.slice(2));
const productionDomainsPath = path.join(repoRoot, "config", "production-domains.json");

const rootProductionPages = new Set([
  "index.html",
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

const riskyPatterns = [
  ["alpha", /\balpha\b/i],
  ["fake account", /\bfake\s+account\b/i],
  ["smoke test", /\bsmoke\s+test\b/i],
  ["test account", /\btest\s+account\b/i],
  ["seeded demo", /\bseeded\s+demo\b/i],
  ["stakeholder", /\bstakeholder\b/i],
  ["Option", /\boption\s+\d+\b/i],
  ["localhost", /\blocalhost\b/i],
  ["product preview", /\bproduct\s+(app\s+)?preview\b/i],
  ["Open App Alpha", /\bopen\s+app\s+alpha\b/i],
  ["App Alpha", /\bapp\s+alpha\b/i],
];

function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (
      entry.name === ".git"
      || entry.name === "node_modules"
      || entry.name === ".secrets"
      || entry.name === ".wrangler"
      || entry.name === ".automation-log-outbox"
      || entry.name === "public-site"
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripJsonComments(text) {
  let output = "";
  let inString = false;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        output += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) inString = false;
      continue;
    }
    if (char === "\"" || char === "'") {
      inString = true;
      quote = char;
      output += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }
    output += char;
  }
  return output;
}

function classifyPath(relativePath) {
  if (relativePath.startsWith("old/stakeholder-options/titan-blend/")) {
    return {
      classification: "retired-stakeholder-option",
      deployProject: "senior-capstone-option-titan",
      productionSafe: "historical-only",
      reason: "Retired stakeholder option kept only as historical review output; not an active deploy target.",
    };
  }
  if (relativePath.startsWith("old/stakeholder-options/back-to-basics/")) {
    return {
      classification: "retired-stakeholder-option",
      deployProject: "senior-capstone-option-primary",
      productionSafe: "historical-only",
      reason: "Retired stakeholder option kept only as historical review output; not an active deploy target.",
    };
  }
  if (relativePath.startsWith("public-companion/")) {
    return {
      classification: "generated-output",
      deployProject: "senior-capstone-public",
      productionSafe: "yes",
      reason: "Generated public companion guide.",
    };
  }
  if (/^alpha\.(html|js|css)$/.test(relativePath) || relativePath === "alpha.html") {
    return {
      classification: "internal-alpha",
      deployProject: "senior-capstone-app",
      productionSafe: "no",
      reason: "Internal alpha/QA surface.",
    };
  }
  if (/^account\.(html|js|css)$/.test(relativePath) || relativePath === "account.html") {
    return {
      classification: "internal-smoke",
      deployProject: "senior-capstone-app",
      productionSafe: "no",
      reason: "Internal account smoke/QA surface.",
    };
  }
  if (relativePath === "old/legacy-redirects/audit.html" || relativePath === "old/legacy-redirects/roadmap.html") {
    return {
      classification: "legacy",
      deployProject: "senior-capstone-app",
      productionSafe: "historical-only",
      reason: "Archived legacy redirect to the public guide home.",
    };
  }
  if (relativePath === "workspace.html") {
    return {
      classification: "production",
      deployProject: "senior-capstone-app",
      productionSafe: "conditional",
      reason: "Canonical protected app route; production-safe only behind authenticated role/scope checks.",
    };
  }
  if (rootProductionPages.has(relativePath)) {
    return {
      classification: "production",
      deployProject: "senior-capstone-app",
      productionSafe: "yes",
      reason: relativePath === "app-preview.html"
        ? "Public non-production workflow preview with production boundary copy."
        : "Root public guide page.",
    };
  }
  if (relativePath.startsWith("functions/api/alpha/")) {
    return {
      classification: "internal-alpha",
      deployProject: "senior-capstone-app",
      productionSafe: "no",
      reason: "Internal alpha API route.",
    };
  }
  if (relativePath.startsWith("functions/api/admin/test-accounts")) {
    return {
      classification: "internal-smoke",
      deployProject: "senior-capstone-app",
      productionSafe: "no",
      reason: "Internal fake-account QA seeding route.",
    };
  }
  if (relativePath.startsWith("functions/api/")) {
    return {
      classification: "production",
      deployProject: "senior-capstone-app",
      productionSafe: "conditional",
      reason: "Cloudflare Pages Function protected by auth/permissions where required.",
    };
  }
  return {
    classification: "unknown",
    deployProject: "",
    productionSafe: "unknown",
    reason: "No registry rule matched.",
  };
}

function htmlAssets(html) {
  const assets = new Set();
  for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) {
    assets.add(match[1].split("?")[0]);
  }
  for (const match of html.matchAll(/<link\b[^>]*\bhref="([^"]+\.(?:css|ico|png|jpg|jpeg|webp|svg)(?:\?[^"]*)?)"/gi)) {
    assets.add(match[1].split("?")[0]);
  }
  return [...assets].sort();
}

function riskyLabels(text) {
  return riskyPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label)
    .sort();
}

function apiRouteFromPath(relativePath) {
  const withoutPrefix = relativePath
    .replace(/^functions\/api\//, "")
    .replace(/\.(ts|js)$/, "");
  const route = withoutPrefix
    .split("/")
    .map((part) => {
      const dynamic = /^\[(.+)\]$/.exec(part);
      return dynamic ? `:${dynamic[1]}` : part;
    })
    .join("/");
  return `/api/${route}`;
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");
}

const allFiles = (await listFiles(repoRoot))
  .map((fullPath) => normalizePath(path.relative(repoRoot, fullPath)))
  .sort();

const htmlRows = [];
for (const relativePath of allFiles.filter((file) => file.endsWith(".html"))) {
  const text = await readFile(path.join(repoRoot, relativePath), "utf8");
  const classification = classifyPath(relativePath);
  htmlRows.push([
    relativePath,
    classification.deployProject,
    classification.classification,
    classification.productionSafe,
    htmlAssets(text).join(", ") || "-",
    riskyLabels(text).join(", ") || "-",
    classification.reason,
  ]);
}

const apiRows = allFiles
  .filter((file) => /^functions\/api\/.+\.(ts|js)$/.test(file))
  .map((file) => {
    const classification = classifyPath(file);
    return [
      apiRouteFromPath(file),
      file,
      classification.deployProject,
      classification.classification,
      classification.productionSafe,
      classification.reason,
    ];
  });

const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const productionDomains = JSON.parse(await readFile(productionDomainsPath, "utf8"));

const customDomainRows = [
  [
    productionDomains.targetHostnames.productApex,
    "target Capstone Project product/app root",
    productionDomains.pagesProjects.appBackend,
    ".",
    "npm run deploy",
    productionDomains.pagesDevFallbacks.appBackend,
  ],
  [
    productionDomains.targetHostnames.productWwwAlias,
    "optional product alias",
    productionDomains.pagesProjects.appBackend,
    ".",
    "npm run deploy",
    productionDomains.pagesDevFallbacks.appBackend,
  ],
  [
    productionDomains.targetHostnames.appSubdomainIfNeeded,
    "optional app split if the implementation requires it",
    productionDomains.pagesProjects.appBackend,
    ".",
    "npm run deploy",
    productionDomains.pagesDevFallbacks.appBackend,
  ],
  [
    productionDomains.currentLegacyHostnames.publicApex,
    "current legacy public guide hostname pending migration",
    productionDomains.pagesProjects.publicGuide,
    "public-companion/",
    "npm run deploy:public-site",
    productionDomains.pagesDevFallbacks.publicGuide,
  ],
  [
    productionDomains.currentLegacyHostnames.publicWww,
    "current legacy public guide alias pending migration",
    productionDomains.pagesProjects.publicGuide,
    "public-companion/",
    "npm run deploy:public-site",
    productionDomains.pagesDevFallbacks.publicGuide,
  ],
  [
    productionDomains.currentLegacyHostnames.app,
    "current legacy app/backend hostname and SSO redirect host",
    productionDomains.pagesProjects.appBackend,
    ".",
    "npm run deploy",
    productionDomains.pagesDevFallbacks.appBackend,
  ],
];

const customDomainPolicyRows = [
  ["Product/app target domain", productionDomains.productDomain],
  ["Root mode", productionDomains.rootMode],
  ["East Tech guide future custom domain", productionDomains.guide.futureCustomDomain],
  ["Current Google OAuth redirect URI", productionDomains.currentSsoRedirectUri],
  ["Pages custom-domain association", "Required before live cutover is verified; CNAME-only evidence is not enough."],
  ["Retired stakeholder option exclusion", `${productionDomains.retiredPagesProjects.stakeholderTitan} and ${productionDomains.retiredPagesProjects.stakeholderPrimary} must not use product hostnames or active deploy scripts.`],
  ["Alpha/account policy", "Option A safety remains current: deployed from app project but unlinked, internal-labeled, and not pilot-safe final production without Bryan accepting direct URL exposure or choosing Option B/C."],
];

const validationRows = [
  ["check:custom-domain-cutover", "npm run check:custom-domain-cutover", "Static domain config/docs and read-only Pages Domains API status when token allows."],
  ["check:alpha-account-gating", "npm run check:alpha-account-gating", "Static internal QA surface gating and no production nav/proxy leakage."],
  ["check:production-cutover", "npm run check:production-cutover", "Aggregate production cutover gate; live-only failures remain blocking/not verified."],
];

const deployRows = Object.entries(packageJson.scripts || {})
  .filter(([name]) => /^(deploy|dev)(:|$)/.test(name))
  .map(([name, command]) => {
    const project = /--project-name=([^\s]+)/.exec(command)?.[1] || "-";
    const classification = name.includes("option")
      ? "stakeholder-review"
      : name.includes("preview") || name.includes("alpha")
        ? "internal-alpha"
        : "production";
    return [name, project, classification, command];
  });

const wranglerRows = [];
for (const file of allFiles.filter((entry) => entry.endsWith("wrangler.jsonc"))) {
  const raw = await readFile(path.join(repoRoot, file), "utf8");
  const parsed = JSON.parse(stripJsonComments(raw));
  wranglerRows.push([
    file,
    parsed.name || "-",
    parsed.pages_build_output_dir || "-",
    Array.isArray(parsed.d1_databases) ? parsed.d1_databases.map((db) => db.binding).join(", ") : "-",
  ]);
}

const generatedRows = [
  ["public-companion/", "scripts/build-public-site.mjs", "generated-output", "senior-capstone-public", "East Tech guide mirror"],
  ["old/stakeholder-options/titan-blend/", "historical output archived; active build/deploy scripts retired", "retired-stakeholder-option", "senior-capstone-option-titan", "historical Titan direction source"],
  ["old/stakeholder-options/back-to-basics/", "historical output archived; active build/deploy scripts retired", "retired-stakeholder-option", "senior-capstone-option-primary", "historical retired option"],
  ["old/legacy-redirects/", "legacy root redirect shells archived", "legacy", "senior-capstone-app", "historical redirect reference"],
];

const output = `# Production Route Inventory

This file is generated by \`scripts/inventory-production-routes.mjs\`. Do not edit it by hand.

## Custom Domain Mapping

${markdownTable(
  ["Hostname", "Purpose", "Pages project", "Deploy source", "Deploy command", "Pages.dev fallback"],
  customDomainRows,
)}

## Custom Domain Policy

${markdownTable(
  ["Policy item", "Value"],
  customDomainPolicyRows,
)}

## Cutover Validation Commands

${markdownTable(
  ["Check", "Command", "Purpose"],
  validationRows,
)}

## HTML Entry Points

${markdownTable(
  ["Path", "Deploy project", "Classification", "Production-safe", "Assets referenced", "Risky labels found", "Reason"],
  htmlRows,
)}

## API Routes

${markdownTable(
  ["Route", "Source path", "Deploy project", "Classification", "Production-safe", "Reason"],
  apiRows,
)}

## Deploy And Dev Scripts

${markdownTable(
  ["Script", "Project", "Classification", "Command"],
  deployRows,
)}

## Wrangler Project Names

${markdownTable(
  ["Config", "Project name", "Output dir", "D1 bindings"],
  wranglerRows,
)}

## Generated Output Roots

${markdownTable(
  ["Output root", "Source of truth", "Classification", "Deploy project", "Intent"],
  generatedRows,
)}
`;

if (args.has("--check")) {
  const existing = await readFile(outputPath, "utf8").catch(() => "");
  if (existing !== output) {
    console.error(`${normalizePath(path.relative(repoRoot, outputPath))} is out of date. Run inventory:production-routes.`);
    process.exit(1);
  }
  console.log("Production route inventory is up to date.");
} else if (args.has("--write")) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  console.log(`Wrote ${normalizePath(path.relative(repoRoot, outputPath))}.`);
} else {
  process.stdout.write(output);
}
