import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(repoRoot, "public-site");
const appUrl = "https://senior-capstone-app.pages.dev";

const pages = [
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
  "app-preview.html"
];

const rootFiles = [
  ...pages,
  "styles.css",
  "app.js",
  ".nojekyll"
];

const directories = [
  "assets",
  "templates"
];

function assertInsideRepo(path) {
  const rel = relative(repoRoot, path);
  if (rel.startsWith("..") || rel === "" || resolve(path) === repoRoot) {
    throw new Error(`Refusing to use output path outside repo workspace: ${path}`);
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyFileWithTransforms(file) {
  const source = join(repoRoot, file);
  const destination = join(outDir, file);
  let text = await readFile(source, "utf8");

  if (file === "app.js" || file.endsWith(".html")) {
    text = text.replaceAll('"alpha.html"', `"${appUrl}/alpha.html"`);
    text = text.replaceAll('href="alpha.html"', `href="${appUrl}/alpha.html"`);
  }

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, text, "utf8");
}

async function writeRedirects() {
  const redirects = [
    `/alpha.html ${appUrl}/alpha.html 302`,
    `/api/* ${appUrl}/api/:splat 302`
  ].join("\n");
  await writeFile(join(outDir, "_redirects"), `${redirects}\n`, "utf8");
}

async function writeHeaders() {
  const headers = [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=604800"
  ].join("\n");
  await writeFile(join(outDir, "_headers"), `${headers}\n`, "utf8");
}

async function writeManifest() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "SeniorProjectApp1.0 public companion site",
    appUrl,
    pages
  };
  await writeFile(join(outDir, "site-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function main() {
  assertInsideRepo(outDir);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const file of rootFiles) {
    if (!(await exists(join(repoRoot, file)))) {
      throw new Error(`Missing public site source file: ${file}`);
    }
    await copyFileWithTransforms(file);
  }

  for (const directory of directories) {
    const source = join(repoRoot, directory);
    if (!(await exists(source))) {
      throw new Error(`Missing public site source directory: ${directory}`);
    }
    await cp(source, join(outDir, directory), { recursive: true });
  }

  await writeRedirects();
  await writeHeaders();
  await writeManifest();

  const outputFiles = await readdir(outDir);
  console.log(`Built public-site with ${outputFiles.length} top-level entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
