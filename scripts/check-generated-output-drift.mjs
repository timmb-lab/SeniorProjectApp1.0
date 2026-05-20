#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const appUrl = "https://senior-capstone-app.pages.dev";

const publicPages = [
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
  "app-preview.html",
];

const stakeholderPages = [
  "program.html",
  "sponsorship-support.html",
  "calendar.html",
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
  "portfolio.html",
  "app-preview.html",
  "templates.html",
  "rubrics.html",
  "grades.html",
];

const publicSourceFiles = [
  ...publicPages,
  "styles.css",
  "app.js",
  ".nojekyll",
];

const expectedPublicRedirects = "# Public companion does not proxy internal alpha, account QA, or app API routes.\n";
const expectedStakeholderRedirects = "# Stakeholder option output does not proxy app API or internal alpha routes.\n";

const expectedPublicHeaders = [
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
  "",
  "/assets/*",
  "  Cache-Control: public, max-age=604800",
].join("\n") + "\n";

const expectedPublicWrangler = {
  "$schema": "../node_modules/wrangler/config-schema.json",
  name: "senior-capstone-public",
  compatibility_date: "2026-05-18",
  pages_build_output_dir: ".",
};

const stakeholderOptions = [
  {
    dir: "stakeholder-options/titan-blend",
    option: "Titan Blend",
    projectName: "senior-capstone-option-titan",
  },
  {
    dir: "stakeholder-options/back-to-basics",
    option: "Back To Basics",
    projectName: "senior-capstone-option-primary",
  },
];

// These are forbidden in the generated public companion because that surface is
// a production-safe public guide. Internal QA and stakeholder-review output are
// checked by their own explicit labels instead of this public-copy list.
const publicCompanionForbidden = [
  ["fake account", /\bfake\s+account\b/i],
  ["test account", /\btest\s+account\b/i],
  ["smoke test", /\bsmoke\s+test\b/i],
  ["seeded demo", /\bseeded\s+demo\b/i],
  ["seeded persona", /\bseeded\s+persona\b/i],
  ["demo persona", /\bdemo\s+persona\b/i],
  ["Day 7 Alpha", /\bday\s+7\s+alpha\b/i],
  ["alpha console", /\balpha\s+console\b/i],
  ["reset alpha", /\breset\s+alpha\b/i],
  ["run report", /\brun\s+report\b/i],
  [".test account", /\.test\s+account\b/i],
  ["no production accounts", /\bno\s+production\s+accounts\b/i],
  ["do not enter real student records", /\bdo\s+not\s+enter\s+real\s+student\s+records\b/i],
  ["Open App Alpha", /\bopen\s+app\s+alpha\b/i],
  ["Account Smoke Test", /\baccount\s+smoke\s+test\b/i],
];

const findings = [];

function normalizePath(value) {
  return String(value).replace(/\\/g, "/");
}

function relativePath(fullPath) {
  return normalizePath(path.relative(repoRoot, fullPath));
}

function normalizeText(value) {
  return value.replace(/\r\n/g, "\n");
}

function report(relativeFile, reason) {
  findings.push({ file: normalizePath(relativeFile), reason });
}

async function exists(relativeFile) {
  try {
    return (await stat(path.join(repoRoot, relativeFile))).isFile();
  } catch {
    return false;
  }
}

async function readText(relativeFile) {
  return normalizeText(await readFile(path.join(repoRoot, relativeFile), "utf8"));
}

async function readJson(relativeFile) {
  try {
    return JSON.parse(await readText(relativeFile));
  } catch (error) {
    report(relativeFile, `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function hashFile(relativeFile) {
  const buffer = await readFile(path.join(repoRoot, relativeFile));
  return createHash("sha256").update(buffer).digest("hex");
}

async function listFilesRecursive(relativeDir) {
  const fullDir = path.join(repoRoot, relativeDir);
  const entries = await readdir(fullDir, { withFileTypes: true }).catch(() => null);
  if (!entries) {
    report(relativeDir, "directory is missing");
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const child = normalizePath(path.join(relativeDir, entry.name));
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(child));
    } else if (entry.isFile()) {
      files.push(child);
    }
  }
  return files.sort();
}

async function assertFileExists(relativeFile) {
  if (!(await exists(relativeFile))) {
    report(relativeFile, "expected generated file is missing");
    return false;
  }
  return true;
}

async function assertTextEquals(relativeFile, expectedText) {
  if (!(await assertFileExists(relativeFile))) return;
  const actual = await readText(relativeFile);
  if (actual !== normalizeText(expectedText)) {
    report(relativeFile, "text differs from deterministic source expectation");
  }
}

async function assertCopiedFile(sourceFile, generatedFile) {
  if (!(await assertFileExists(sourceFile)) || !(await assertFileExists(generatedFile))) return;
  const sourceHash = await hashFile(sourceFile);
  const generatedHash = await hashFile(generatedFile);
  if (sourceHash !== generatedHash) {
    report(generatedFile, `does not match source file ${normalizePath(sourceFile)}`);
  }
}

async function assertCopiedDirectory(sourceDir, generatedDir) {
  const sourceFiles = await listFilesRecursive(sourceDir);
  const generatedFiles = await listFilesRecursive(generatedDir);
  const sourceRelative = sourceFiles.map((file) => normalizePath(path.relative(sourceDir, file))).sort();
  const generatedRelative = generatedFiles.map((file) => normalizePath(path.relative(generatedDir, file))).sort();

  if (JSON.stringify(sourceRelative) !== JSON.stringify(generatedRelative)) {
    report(generatedDir, `file list differs from source directory ${normalizePath(sourceDir)}`);
  }

  for (const relativeFile of sourceRelative) {
    await assertCopiedFile(
      normalizePath(path.join(sourceDir, relativeFile)),
      normalizePath(path.join(generatedDir, relativeFile)),
    );
  }
}

function assertManifest(relativeFile, actual, expectedWithoutGeneratedAt) {
  if (!actual) return;
  if (!actual.generatedAt || Number.isNaN(Date.parse(actual.generatedAt))) {
    report(relativeFile, "manifest generatedAt is missing or invalid");
  }

  const { generatedAt, ...actualWithoutGeneratedAt } = actual;
  if (JSON.stringify(actualWithoutGeneratedAt) !== JSON.stringify(expectedWithoutGeneratedAt)) {
    report(relativeFile, "manifest fields differ from deterministic source expectation");
  }
}

async function scanPublicCompanionText() {
  const files = await listFilesRecursive("public-companion");
  const textFiles = files.filter((file) => {
    const ext = path.extname(file);
    return [".html", ".js", ".css", ".json", ""].includes(ext) || path.basename(file).startsWith("_");
  });

  for (const file of textFiles) {
    const text = await readText(file);

    if (/(^|\n)\s*[^#\n]*\balpha\.html\b/i.test(text)) {
      report(file, "public companion contains an alpha.html redirect or link");
    }
    if (/(^|\n)\s*[^#\n]*\baccount\.html\b/i.test(text)) {
      report(file, "public companion contains an account.html redirect or link");
    }
    if (file.endsWith("_redirects") && /(^|\n)\s*[^#\n]*\/api(\/|\s|$)/i.test(text)) {
      report(file, "public companion _redirects contains an API proxy redirect");
    }

    for (const [label, pattern] of publicCompanionForbidden) {
      if (pattern.test(text)) {
        report(file, `public companion contains forbidden QA/test copy: ${label}`);
      }
    }
  }
}

async function checkPublicCompanion() {
  const topLevelHtml = (await readdir(path.join(repoRoot, "public-companion"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(topLevelHtml) !== JSON.stringify([...publicPages].sort())) {
    report("public-companion", "top-level HTML entry points differ from scripts/build-public-site.mjs");
  }

  for (const file of publicSourceFiles) {
    await assertCopiedFile(file, `public-companion/${file}`);
  }
  await assertCopiedDirectory("assets", "public-companion/assets");
  await assertCopiedDirectory("templates", "public-companion/templates");

  await assertTextEquals("public-companion/_redirects", expectedPublicRedirects);
  await assertTextEquals("public-companion/_headers", expectedPublicHeaders);
  await assertTextEquals("public-companion/wrangler.jsonc", `${JSON.stringify(expectedPublicWrangler, null, 2)}\n`);

  const manifest = await readJson("public-companion/site-manifest.json");
  assertManifest("public-companion/site-manifest.json", manifest, {
    source: "SeniorProjectApp1.0 public companion site",
    appUrl,
    pages: publicPages,
  });

  await scanPublicCompanionText();
}

async function checkStakeholderOption(option) {
  const manifest = await readJson(`${option.dir}/site-manifest.json`);
  assertManifest(`${option.dir}/site-manifest.json`, manifest, {
    option: option.option,
    projectName: option.projectName,
    appUrl,
    pages: stakeholderPages,
  });

  const expectedWrangler = {
    "$schema": "../../node_modules/wrangler/config-schema.json",
    name: option.projectName,
    compatibility_date: "2026-05-18",
    pages_build_output_dir: ".",
  };

  await assertFileExists(`${option.dir}/index.html`);
  await assertFileExists(`${option.dir}/styles.css`);
  await assertFileExists(`${option.dir}/option.js`);
  await assertCopiedFile("assets/app-hero.jpg", `${option.dir}/assets/app-hero.jpg`);
  await assertTextEquals(`${option.dir}/_redirects`, expectedStakeholderRedirects);
  await assertTextEquals(`${option.dir}/wrangler.jsonc`, `${JSON.stringify(expectedWrangler, null, 2)}\n`);

  const htmlFiles = ["index.html", ...stakeholderPages];
  for (const file of htmlFiles) {
    const relativeFile = `${option.dir}/${file}`;
    if (!(await assertFileExists(relativeFile))) continue;
    const html = await readText(relativeFile);

    if (!html.includes("Stakeholder review option. Not the canonical production site or app.")) {
      report(relativeFile, "missing stakeholder review banner");
    }
    if (/\bOpen App Alpha\b/i.test(html) || /\bApp Alpha\b/i.test(html) || /\bAccount Smoke Test\b/i.test(html)) {
      report(relativeFile, "contains unlabeled internal QA link copy");
    }
    if (html.includes(`${appUrl}/alpha.html`) && !html.includes("Internal Alpha QA")) {
      report(relativeFile, "links to alpha.html without the Internal Alpha QA label");
    }
    if (/href=["'][^"']*account\.html/i.test(html)) {
      report(relativeFile, "links to account.html from stakeholder review output");
    }
  }
}

await checkPublicCompanion();
for (const option of stakeholderOptions) {
  await checkStakeholderOption(option);
}

if (findings.length > 0) {
  console.error("Generated output drift check failed.");
  for (const finding of findings.sort((a, b) => a.file.localeCompare(b.file))) {
    console.error(`${finding.file} -> ${finding.reason}`);
  }
  process.exit(1);
}

console.log("Generated output drift check passed: public companion and stakeholder review outputs match deterministic source expectations.");
