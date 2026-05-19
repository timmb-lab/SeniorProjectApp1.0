import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const sites = [
  {
    label: "public companion",
    dir: "public-companion",
    requiredFiles: ["index.html", "styles.css", "app.js", "wrangler.jsonc", "_headers", "_redirects"],
    requiredManifest: { source: "SeniorProjectApp1.0 public companion site" },
  },
  {
    label: "stakeholder option titan",
    dir: "stakeholder-options/titan-blend",
    requiredFiles: ["index.html", "styles.css", "option.js", "wrangler.jsonc", "_headers", "_redirects"],
    requiredManifest: { projectName: "senior-capstone-option-titan" },
  },
  {
    label: "stakeholder option primary",
    dir: "stakeholder-options/back-to-basics",
    requiredFiles: ["index.html", "styles.css", "option.js", "wrangler.jsonc", "_headers", "_redirects"],
    requiredManifest: { projectName: "senior-capstone-option-primary" },
  },
];

async function assertFile(path, label) {
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`${label} is missing required file: ${path}`);
  }
}

async function readJson(path, label) {
  const raw = await readFile(path, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} has invalid JSON in ${path}: ${error.message}`);
  }
}

for (const site of sites) {
  const rootPath = join(repoRoot, site.dir);
  const manifestPath = join(rootPath, "site-manifest.json");
  await assertFile(manifestPath, site.label);

  for (const file of site.requiredFiles) {
    await assertFile(join(rootPath, file), site.label);
  }

  const manifest = await readJson(manifestPath, site.label);
  if (!manifest.generatedAt || Number.isNaN(Date.parse(manifest.generatedAt))) {
    throw new Error(`${site.label} manifest is missing a valid generatedAt timestamp`);
  }

  for (const [key, expected] of Object.entries(site.requiredManifest)) {
    if (manifest[key] !== expected) {
      throw new Error(`${site.label} manifest ${key} is ${JSON.stringify(manifest[key])}; expected ${JSON.stringify(expected)}`);
    }
  }

  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    throw new Error(`${site.label} manifest must include a non-empty pages array`);
  }

  for (const page of manifest.pages) {
    if (!page.endsWith(".html")) {
      throw new Error(`${site.label} manifest page is not an HTML file: ${page}`);
    }

    const pagePath = join(rootPath, page);
    await assertFile(pagePath, site.label);
    const html = await readFile(pagePath, "utf8");
    if (!/<html[\s>]/i.test(html)) {
      throw new Error(`${site.label} page does not look like HTML: ${page}`);
    }
  }
}

console.log(`Site option check passed: ${sites.length} site roots and their manifest pages are present.`);
