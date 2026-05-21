#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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
  "audit.html",
  "roadmap.html",
]);

const productionAssetFiles = new Set([
  "app.js",
  "styles.css",
  "workspace.js",
  "workspace.css",
]);

const textExtensions = new Set([".html", ".js", ".css", ".md"]);

const forbiddenPhrases = [
  ["internal alpha", /\binternal\s+alpha\b/i],
  ["QA only", /\bqa\s+only\b/i],
  ["QA console", /\bqa\s+console\b/i],
  ["fake account", /\bfake\s+account\b/i],
  ["smoke test", /\bsmoke\s+test\b/i],
  ["seeded demo", /\bseeded\s+demo\b/i],
  ["Day 7 Alpha", /\bday\s+7\s+alpha\b/i],
  ["alpha console", /\balpha\s+console\b/i],
  ["reset alpha", /\breset\s+alpha\b/i],
  ["run report", /\brun\s+report\b/i],
  ["test account", /\btest\s+account\b/i],
  [".test account", /\.test\s+account\b/i],
  ["localhost", /\blocalhost\b/i],
  ["not pilot-ready", /\bnot\s+pilot-ready\b/i],
  ["non-production preview", /\bnon-production\s+preview\b/i],
  ["preview-only", /\bpreview-only\b/i],
  ["app boundary", /\bapp[-\s]+boundary\b/i],
  ["prototype only", /\bprototype\s+only\b/i],
  ["stakeholder review direction", /\bstakeholder\s+review\s+direction\b/i],
  ["Option 1", /\boption\s+1\b/i],
  ["Option 2", /\boption\s+2\b/i],
  ["product preview", /\bproduct\s+preview\b/i],
  ["Product App Preview", /\bproduct\s+app\s+preview\b/i],
  ["demo persona", /\bdemo\s+persona\b/i],
  ["seeded persona", /\bseeded\s+persona\b/i],
  ["prompt leftover", /\bprompt\s+leftover\b/i],
  ["Codex", /\bcodex\b/i],
  ["builder", /\bbuilder\b/i],
  ["automation prompt", /\bautomation\s+prompt\b/i],
  ["TODO", /\btodo\b/i],
  ["FIXME", /\bfixme\b/i],
  ["dev note", /\bdev\s+note\b/i],
  ["developer note", /\bdeveloper\s+note\b/i],
  ["lorem ipsum", /\blorem\s+ipsum\b/i],
  ["dummy data", /\bdummy\s+data\b/i],
  ["fake data", /\bfake\s+data\b/i],
  ["not production", /\bnot\s+production\b/i],
  ["no production accounts", /\bno\s+production\s+accounts\b/i],
  ["do not enter real student records", /\bdo\s+not\s+enter\s+real\s+student\s+records\b/i],
  ["setup key", /\bsetup\s+key\b/i],
  ["API secret", /\bapi\s+secret\b/i],
  ["MVP account check", /\bmvp\s+account\s+check\b/i],
  ["Open App Alpha", /\bopen\s+app\s+alpha\b/i],
  ["App Alpha", /\bapp\s+alpha\b/i],
  ["Account Smoke Test", /\baccount\s+smoke\s+test\b/i],
  ["alpha route", /\balpha\s+route\b/i],
  ["internal only", /\binternal\s+only\b/i],
  ["Titan Blend", /\btitan\s+blend\b/i],
  ["Back To Basics", /\bback\s+to\s+basics\b/i],
  ["raw Drive storage IDs", /\braw\s+drive\s+storage\s+ids?\b/i],
  ["stack traces", /\bstack\s+traces?\b/i],
  ["debug output", /\bdebug\s+output\b/i],
];

const normalNavLinkPatterns = [
  ["alpha.html link", /\bhref=["'][^"']*alpha\.html\b/i],
  ["account.html link", /\bhref=["'][^"']*account\.html\b/i],
  ["internal alpha route text", /\bopen\s+app\s+alpha\b/i],
  ["account smoke route text", /\baccount\s+smoke\s+test\b/i],
];

// Allowlist rules are intentionally path-based so a new production file cannot
// silence a leak by adding inline comments or alternate spelling.
const excludedPathRules = [
  {
    reason: "Docs intentionally explain production/internal/stakeholder boundaries.",
    test: (relativePath) => relativePath === "README.md" || relativePath.startsWith("docs/"),
  },
  {
    reason: "Tests and fixtures must be able to name internal account and alpha scenarios.",
    test: (relativePath) => relativePath.startsWith("tests/"),
  },
  {
    reason: "Internal alpha console is not production navigation.",
    test: (relativePath) => /^(alpha|alpha\.)/.test(path.basename(relativePath)),
  },
  {
    reason: "Internal account QA smoke page is not production navigation.",
    test: (relativePath) => /^(account|account\.)/.test(path.basename(relativePath)),
  },
  {
    reason: "Stakeholder options are review artifacts and have their own visible review banner.",
    test: (relativePath) => relativePath.startsWith("stakeholder-options/"),
  },
  {
    reason: "Automation, scripts, migrations, and backend source may reference test fixtures or validation labels.",
    test: (relativePath) => (
      relativePath.startsWith("automation/")
      || relativePath.startsWith("scripts/")
      || relativePath.startsWith("migrations/")
      || relativePath.startsWith("functions/")
      || relativePath.startsWith(".github/")
    ),
  },
  {
    reason: "Ignored local secrets are never production public surfaces.",
    test: (relativePath) => relativePath.startsWith(".secrets/"),
  },
];

function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function isExcluded(relativePath) {
  return excludedPathRules.some((rule) => rule.test(relativePath));
}

function isProductionTextSurface(relativePath) {
  if (isExcluded(relativePath)) return false;
  if (productionRootHtml.has(relativePath)) return true;
  if (productionAssetFiles.has(relativePath)) return true;
  if (relativePath.startsWith("public-companion/")) {
    return textExtensions.has(path.extname(relativePath));
  }
  if (relativePath.startsWith("templates/")) {
    return textExtensions.has(path.extname(relativePath));
  }
  return false;
}

function isPreviewSurface(relativePath) {
  return relativePath === "app-preview.html" || relativePath.endsWith("/app-preview.html");
}

function isAllowedPreviewPhrase(relativePath, phrase) {
  if (!isPreviewSurface(relativePath)) return false;
  return new Set([
    "non-production preview",
    "app boundary",
  ]).has(phrase);
}

function shouldCheckNormalNavigation(relativePath) {
  return (
    productionRootHtml.has(relativePath)
    || productionAssetFiles.has(relativePath)
    || relativePath.startsWith("public-companion/")
  );
}

function findLineAndColumn(text, index) {
  const before = text.slice(0, index);
  const lines = before.split(/\r?\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

const allFiles = await listFiles(repoRoot);
const scannedFiles = [];
const findings = [];
const navFindings = [];

for (const fullPath of allFiles) {
  const relativePath = normalizePath(path.relative(repoRoot, fullPath));
  if (!isProductionTextSurface(relativePath)) continue;
  scannedFiles.push(relativePath);

  const text = await readFile(fullPath, "utf8");
  for (const [phrase, pattern] of forbiddenPhrases) {
    if (isAllowedPreviewPhrase(relativePath, phrase)) continue;
    const match = pattern.exec(text);
    if (!match) continue;
    const { line, column } = findLineAndColumn(text, match.index);
    findings.push({ relativePath, phrase, line, column });
  }
  if (shouldCheckNormalNavigation(relativePath)) {
    for (const [label, pattern] of normalNavLinkPatterns) {
      const match = pattern.exec(text);
      if (!match) continue;
      const { line, column } = findLineAndColumn(text, match.index);
      navFindings.push({ relativePath, label, line, column });
    }
  }
}

const appShellText = await Promise.all(
  ["index.html", "app.js"].map(async (relativePath) => {
    try {
      return await readFile(path.join(repoRoot, relativePath), "utf8");
    } catch {
      return "";
    }
  }),
);
const publicGuideToggleRequirements = [
  ["Student Guide", /Student\s+Guide/i],
  ["Teacher Guide", /Teacher\s+Guide/i],
  ["Viewing: Student Guide", /Viewing:\s*Student\s+Guide/i],
  ["Viewing: Teacher Guide", /Viewing:\s*Teacher\s+Guide/i],
  ["Switch to Student Guide", /Switch\s+to\s+Student\s+Guide/i],
  ["Switch to Teacher Guide", /Switch\s+to\s+Teacher\s+Guide/i],
  ["guide preference storage", /senior-capstone-guide-mode/],
  ["aria-pressed segmented control", /aria-pressed/],
];
const missingPublicGuideToggleRequirements = publicGuideToggleRequirements
  .filter(([, pattern]) => !pattern.test(appShellText.join("\n")))
  .map(([label]) => label);

if (missingPublicGuideToggleRequirements.length > 0) {
  console.warn(
    `P0 pending: public production website is missing Student Guide / Teacher Guide toggle markers: ${missingPublicGuideToggleRequirements.join(", ")}.`,
  );
}

const workspaceText = await Promise.all(
  ["workspace.html", "workspace.js", "workspace.css"].map(async (relativePath) => {
    try {
      return [relativePath, await readFile(path.join(repoRoot, relativePath), "utf8")];
    } catch {
      return [relativePath, ""];
    }
  }),
);
const schoolSpecificWorkspacePatterns = [
  ["East Tech", /\bEast\s+Tech\b/i],
  ["East Career", /\bEast\s+Career\b/i],
  ["ECTA", /\bECTA\b/i],
  ["Titans", /\bTitans?\b/i],
  ["Las Vegas", /\bLas\s+Vegas\b/i],
  ["CCSD", /\bCCSD\b/i],
  ["titan-blue token", /--titan-blue\b/i],
  ["titan-silver token", /--titan-silver\b/i],
];
for (const [relativePath, text] of workspaceText) {
  for (const [label, pattern] of schoolSpecificWorkspacePatterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const { line, column } = findLineAndColumn(text, match.index);
    findings.push({ relativePath, phrase: `school-specific workspace leakage: ${label}`, line, column });
  }
}

if (findings.length > 0 || navFindings.length > 0) {
  console.error("Production surface leak check failed.");
  for (const finding of findings) {
    console.error(`${finding.relativePath}:${finding.line}:${finding.column} -> ${finding.phrase}`);
  }
  for (const finding of navFindings) {
    console.error(`${finding.relativePath}:${finding.line}:${finding.column} -> normal nav leak: ${finding.label}`);
  }
  console.error(`Scanned ${scannedFiles.length} production text surface(s).`);
  process.exit(1);
}

console.log(`Production surface leak check passed: ${scannedFiles.length} production text surface(s) scanned.`);
