#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const productionRootHtml = new Set([
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
  "audit.html",
  "roadmap.html",
  "app-preview.html",
]);

const productionAssetFiles = new Set([
  "app.js",
]);

const textExtensions = new Set([".html", ".js", ".md"]);

const forbiddenPhrases = [
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
  ["prototype only", /\bprototype\s+only\b/i],
  ["stakeholder review direction", /\bstakeholder\s+review\s+direction\b/i],
  ["Option 1", /\boption\s+1\b/i],
  ["Option 2", /\boption\s+2\b/i],
  ["product preview", /\bproduct\s+preview\b/i],
  ["Product App Preview", /\bproduct\s+app\s+preview\b/i],
  ["demo persona", /\bdemo\s+persona\b/i],
  ["seeded persona", /\bseeded\s+persona\b/i],
  ["no production accounts", /\bno\s+production\s+accounts\b/i],
  ["do not enter real student records", /\bdo\s+not\s+enter\s+real\s+student\s+records\b/i],
  ["MVP account check", /\bmvp\s+account\s+check\b/i],
  ["Open App Alpha", /\bopen\s+app\s+alpha\b/i],
  ["App Alpha", /\bapp\s+alpha\b/i],
  ["Account Smoke Test", /\baccount\s+smoke\s+test\b/i],
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

for (const fullPath of allFiles) {
  const relativePath = normalizePath(path.relative(repoRoot, fullPath));
  if (!isProductionTextSurface(relativePath)) continue;
  scannedFiles.push(relativePath);

  const text = await readFile(fullPath, "utf8");
  for (const [phrase, pattern] of forbiddenPhrases) {
    const match = pattern.exec(text);
    if (!match) continue;
    const { line, column } = findLineAndColumn(text, match.index);
    findings.push({ relativePath, phrase, line, column });
  }
}

if (findings.length > 0) {
  console.error("Production surface leak check failed.");
  for (const finding of findings) {
    console.error(`${finding.relativePath}:${finding.line}:${finding.column} -> ${finding.phrase}`);
  }
  console.error(`Scanned ${scannedFiles.length} production text surface(s).`);
  process.exit(1);
}

console.log(`Production surface leak check passed: ${scannedFiles.length} production text surface(s) scanned.`);
