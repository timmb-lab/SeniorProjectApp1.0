import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const failures = [];

const retiredOptionScripts = [
  "build:stakeholder-sites",
  "build:site-options",
  "dev:option:titan",
  "dev:option:primary",
  "deploy:option:titan",
  "deploy:option:primary",
];

const publicCompanion = {
  label: "East Tech guide generated output",
  dir: "public-companion",
  requiredFiles: ["index.html", "styles.css", "app.js", "wrangler.jsonc", "_headers", "_redirects"],
  requiredManifest: { source: "SeniorProjectApp1.0 public companion site" },
};

const retiredOptions = [
  {
    label: "retired Titan Blend option",
    dir: "stakeholder-options/titan-blend",
    bannerPattern: /Stakeholder review option\. Not the canonical production site or app\./i,
  },
  {
    label: "retired Back To Basics option",
    dir: "stakeholder-options/back-to-basics",
    bannerPattern: /Stakeholder review option\. Not the canonical production site or app\./i,
  },
];

function fail(message) {
  failures.push(message);
}

async function fileExists(path) {
  const info = await stat(path).catch(() => null);
  return Boolean(info?.isFile());
}

async function dirExists(path) {
  const info = await stat(path).catch(() => null);
  return Boolean(info?.isDirectory());
}

async function assertFile(path, label) {
  if (!(await fileExists(path))) {
    fail(`${label} is missing required file: ${path}`);
  }
}

async function readJson(path, label) {
  const raw = await readFile(path, "utf8").catch((error) => {
    fail(`${label} cannot read JSON file ${path}: ${error.message}`);
    return "";
  });
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label} has invalid JSON in ${path}: ${error.message}`);
    return null;
  }
}

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".html")).map((entry) => entry.name).sort();
}

async function checkPublicCompanion() {
  const rootPath = join(repoRoot, publicCompanion.dir);
  const manifestPath = join(rootPath, "site-manifest.json");
  await assertFile(manifestPath, publicCompanion.label);
  for (const file of publicCompanion.requiredFiles) {
    await assertFile(join(rootPath, file), publicCompanion.label);
  }

  const manifest = await readJson(manifestPath, publicCompanion.label);
  if (!manifest) return;
  if (!manifest.generatedAt || Number.isNaN(Date.parse(manifest.generatedAt))) {
    fail(`${publicCompanion.label} manifest is missing a valid generatedAt timestamp`);
  }
  for (const [key, expected] of Object.entries(publicCompanion.requiredManifest)) {
    if (manifest[key] !== expected) {
      fail(`${publicCompanion.label} manifest ${key} is ${JSON.stringify(manifest[key])}; expected ${JSON.stringify(expected)}`);
    }
  }
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    fail(`${publicCompanion.label} manifest must include a non-empty pages array`);
  }
}

async function checkRetiredOption(option) {
  const rootPath = join(repoRoot, option.dir);
  if (!(await dirExists(rootPath))) return;

  const htmlFiles = await listHtmlFiles(rootPath);
  if (htmlFiles.length === 0) {
    fail(`${option.label} exists but has no HTML files; delete/archive it completely or keep it as readable history`);
    return;
  }

  for (const file of htmlFiles) {
    const relative = `${option.dir}/${file}`;
    const html = await readFile(join(rootPath, file), "utf8");
    if (!option.bannerPattern.test(html)) {
      fail(`${relative} is retained as history but missing the review-artifact boundary banner`);
    }
    if (/href=["'][^"']*account\.html/i.test(html)) {
      fail(`${relative} links to account.html`);
    }
    if (/href=["'][^"']*alpha\.html/i.test(html) && !/Internal Alpha QA|internal QA/i.test(html)) {
      fail(`${relative} links to alpha.html without an internal QA label`);
    }
  }
}

const packageJson = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
for (const scriptName of retiredOptionScripts) {
  if (packageJson.scripts?.[scriptName]) {
    fail(`package.json still exposes active retired stakeholder option script: ${scriptName}`);
  }
}

const docsText = await Promise.all([
  "docs/stakeholder-option-lifecycle.md",
  "docs/production-deployment-policy.md",
  "docs/production-surface-registry.md",
  "README.md",
].map((relativePath) => readFile(join(repoRoot, relativePath), "utf8").catch(() => "")));
const joinedDocs = docsText.join("\n");
for (const stalePattern of [
  /No final lifecycle decision is recorded yet/i,
  /Bryan still wants stakeholders to compare visual directions/i,
  /deploy scripts named as review-only targets/i,
]) {
  if (stalePattern.test(joinedDocs)) {
    fail(`stale active stakeholder option lifecycle language remains: ${stalePattern.source}`);
  }
}

await checkPublicCompanion();
for (const option of retiredOptions) {
  await checkRetiredOption(option);
}

if (failures.length > 0) {
  console.error("Site option retirement check failed.");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Site option retirement check passed: East Tech guide output is present and retired stakeholder options are not active deploy targets.");
