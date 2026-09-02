import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(repoRoot, ".deploy-app");
const requiredRootFiles = ["_headers", "_redirects", ".nojekyll"];
const appRootAssets = ["styles.css", "workspace.css"];
const copiedDirectories = ["assets", "templates", "workspace"];
const bundledFontFiles = [
  {
    source: "node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff2",
    output: "assets/fonts/barlow-semi-condensed-latin-600-normal-5.3.0.woff2",
  },
  {
    source: "node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-700-normal.woff2",
    output: "assets/fonts/barlow-semi-condensed-latin-700-normal-5.3.0.woff2",
  },
  {
    source: "node_modules/@fontsource/barlow-semi-condensed/LICENSE",
    output: "assets/fonts/BARLOW-SEMI-CONDENSED-OFL.txt",
  },
];
const workspaceEntryScripts = [
  "workspace/loader.js",
  "workspace/shared.js",
  "workspace/core.js",
  "workspace/bootstrap.js",
];
const workspaceFeatureScripts = [
  "workspace/features/projects.js",
  "workspace/features/staff.js",
  "workspace/features/student.js",
  "workspace/features/review-admin.js",
  "workspace/features/actions.js",
];

function assertSafeOutputPath() {
  const outputRelative = relative(repoRoot, outDir).replaceAll("\\", "/");
  if (outputRelative !== ".deploy-app") {
    throw new Error(`Refusing unsafe deployment output path: ${outDir}`);
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

function contentHash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function versionedUrl(file, content) {
  return `${file}?v=${contentHash(content)}`;
}

async function buildVersionedWorkspaceCss() {
  let css = await readFile(join(repoRoot, "workspace.css"), "utf8");
  const imports = [...css.matchAll(/@import\s+url\(["']([^"'?]+)(?:\?v=[^"']*)?["']\);/g)];
  if (!imports.length) throw new Error("workspace.css must import the ordered workspace style modules.");

  for (const match of imports) {
    const relativeFile = match[1];
    const source = await readFile(join(repoRoot, relativeFile), "utf8");
    css = css.replace(match[0], `@import url("${versionedUrl(relativeFile, source)}");`);
  }
  return css;
}

async function buildVersionedFeatureLoader() {
  let loader = await readFile(join(repoRoot, "workspace", "loader.js"), "utf8");
  for (const relativeFile of workspaceFeatureScripts) {
    const source = await readFile(join(repoRoot, relativeFile), "utf8");
    loader = loader.replaceAll(relativeFile, versionedUrl(relativeFile, source));
  }
  return loader;
}

function replaceExactAssetReference(html, file, versioned) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(["'])${escaped}(?:\\?v=[^"']*)?\\1`, "g");
  const next = html.replace(pattern, (_match, quote) => `${quote}${versioned}${quote}`);
  if (next === html) throw new Error(`workspace.html does not reference required asset: ${file}`);
  return next;
}

async function main() {
  assertSafeOutputPath();
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const file of [...requiredRootFiles, ...appRootAssets]) {
    const source = join(repoRoot, file);
    if (!(await exists(source))) throw new Error(`Missing production app asset: ${file}`);
    await cp(source, join(outDir, file));
  }

  const workspaceEntry = join(repoRoot, "workspace.html");
  if (!(await exists(workspaceEntry))) throw new Error("Missing production workspace entry: workspace.html");
  await cp(workspaceEntry, join(outDir, "index.html"));

  for (const directory of copiedDirectories) {
    const source = join(repoRoot, directory);
    if (!(await exists(source))) throw new Error(`Missing production app directory: ${directory}`);
    await cp(source, join(outDir, directory), { recursive: true });
  }

  for (const font of bundledFontFiles) {
    const source = join(repoRoot, font.source);
    const output = join(outDir, font.output);
    if (!(await exists(source))) throw new Error(`Missing bundled font dependency: ${font.source}`);
    await mkdir(dirname(output), { recursive: true });
    await cp(source, output);
  }

  const versionedWorkspaceCss = await buildVersionedWorkspaceCss();
  await writeFile(join(outDir, "workspace.css"), versionedWorkspaceCss);

  const versionedLoader = await buildVersionedFeatureLoader();
  await writeFile(join(outDir, "workspace", "loader.js"), versionedLoader);

  const assetContents = new Map();
  assetContents.set("styles.css", await readFile(join(outDir, "styles.css")));
  assetContents.set("workspace.css", Buffer.from(versionedWorkspaceCss));
  assetContents.set("workspace/loader.js", Buffer.from(versionedLoader));
  for (const relativeFile of workspaceEntryScripts.slice(1)) {
    assetContents.set(relativeFile, await readFile(join(outDir, relativeFile)));
  }

  let html = await readFile(workspaceEntry, "utf8");
  const manifest = {};
  for (const [relativeFile, content] of assetContents) {
    const versioned = versionedUrl(relativeFile, content);
    html = replaceExactAssetReference(html, relativeFile, versioned);
    manifest[relativeFile] = {
      hash: contentHash(content),
      url: versioned,
    };
  }
  await writeFile(join(outDir, "index.html"), html);
  await writeFile(join(outDir, "asset-manifest.json"), `${JSON.stringify({ version: 1, assets: manifest }, null, 2)}\n`);

  console.log(`Built isolated production app bundle with ${Object.keys(manifest).length} content-versioned entry assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
