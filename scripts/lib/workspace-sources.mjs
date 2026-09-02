import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const workspaceJavaScriptFiles = [
  "workspace/loader.js",
  "workspace/shared.js",
  "workspace/core.js",
  "workspace/features/projects.js",
  "workspace/features/staff.js",
  "workspace/features/student.js",
  "workspace/features/review-admin.js",
  "workspace/features/actions.js",
];

export const workspaceCssFiles = [
  "workspace/styles/01-workspace.css",
  "workspace/styles/02-workspace.css",
  "workspace/styles/03-workspace.css",
  "workspace/styles/04-workspace.css",
  "workspace/styles/05-brand-foundations.css",
  "workspace/styles/06-visual-polish.css",
];

export async function readWorkspaceJavaScriptSource(options = {}) {
  const parts = await Promise.all(workspaceJavaScriptFiles.map((file) => readFile(file, "utf8")));
  if (options.preloadFeatures !== false) parts.push("markWorkspaceFeaturesPreloaded();");
  if (options.includeBootstrap !== false) parts.push(await readFile("workspace/bootstrap.js", "utf8"));
  return parts.join("\n");
}

export async function readWorkspaceCssSource() {
  return (await Promise.all(workspaceCssFiles.map((file) => readFile(file, "utf8")))).join("\n");
}

export async function workspaceSourceSizes() {
  const files = [...workspaceJavaScriptFiles, "workspace/bootstrap.js", ...workspaceCssFiles];
  return Promise.all(files.map(async (file) => ({ file, bytes: (await stat(file)).size, extension: path.extname(file) })));
}
