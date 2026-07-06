import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const functionsRoot = path.join(repoRoot, "functions");
const failures = [];

function listSourceFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(fullPath));
    else if (entry.isFile() && fullPath.endsWith(".ts")) files.push(fullPath);
  }
  return files;
}

function normalize(file) {
  return file.replace(repoRoot + path.sep, "").replace(/\\/g, "/");
}

function fail(message) {
  failures.push(message);
}

const libraryGuards = {
  "functions/_lib/presentation-slots.ts": "requirePost(request)",
  "functions/_lib/site-mentor-assignments.ts": "requirePost(request)",
};

for (const [file, marker] of Object.entries(libraryGuards)) {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  if (!text.includes(marker)) fail(`${file}: delegated mutation helper must call ${marker}`);
}

const adminUserImport = readFileSync(path.join(repoRoot, "functions/api/admin/users/import.ts"), "utf8");
for (const [marker, message] of [
  ["const methodError = requirePost(request);", "admin user import must enforce same-origin POST before reading JSON"],
  ["const actorAccess = await loadEffectiveAccess(env, caller);", "admin user import must load effective scoped access"],
  ["if (!canUseUserImport(actorAccess))", "admin user import must reject actors outside the allowed admin roles"],
  ["canActorCreateRole(env, caller, roleId", "admin user import must validate each requested role against actor scope"],
]) {
  if (!adminUserImport.includes(marker)) fail(`functions/api/admin/users/import.ts: ${message}`);
}

for (const file of listSourceFiles(path.join(functionsRoot, "api"))) {
  const relative = normalize(file);
  const text = readFileSync(file, "utf8");
  if (/export const onRequestPost\b/.test(text)) {
    const delegated =
      text.includes("handlePresentationSlotTransition")
      || text.includes("handleSiteMentorAssignmentsPost");
    if (!delegated && !text.includes("requirePost(request)")) {
      fail(`${relative}: onRequestPost must call requirePost(request) before reading JSON or mutating state`);
    }
  }
  if (/export const onRequestDelete\b/.test(text) && !text.includes("requireDelete(request)")) {
    fail(`${relative}: onRequestDelete must call requireDelete(request) before reading JSON or mutating state`);
  }
}

const http = readFileSync(path.join(repoRoot, "functions/_lib/http.ts"), "utf8");
for (const marker of [
  "export function requirePost",
  "export function requireDelete",
  "hasAllowedMutationOrigin",
  "cross_origin_post_denied",
]) {
  if (!http.includes(marker)) fail(`functions/_lib/http.ts: missing ${marker}`);
}

if (failures.length) {
  console.error("Mutation origin coverage verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Mutation origin coverage verification passed: POST and DELETE mutations require same-origin browser requests.");
