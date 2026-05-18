import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(resolve(root, path), "utf8");
const failures = [];
const assert = (condition, message) => {
  if (!condition) {
    failures.push(message);
  }
};

const packageJson = JSON.parse(read("package.json"));
const alphaHtml = read("alpha.html");
const alphaJs = read("alpha.js");
const alphaCss = read("alpha.css");
const alphaRunbook = read("docs/alpha-runbook.md");
const alphaModel = read("functions/_lib/alpha-flow-model.js");
const alphaTests = read("tests/alpha-flow.test.mjs");

const modelUrl = pathToFileURL(resolve(root, "functions/_lib/alpha-flow-model.js")).href;
const { createAlphaSeedState, deriveMetrics } = await import(`${modelUrl}?contract=${Date.now()}`);
const seed = createAlphaSeedState();

const requiredScripts = [
  "dev:alpha",
  "deploy:preview",
  "check",
  "check:alpha",
  "check:alpha-contract",
  "test",
  "typecheck",
];
const requiredPersonas = ["student", "program_teacher", "mentor", "admin", "misc_admin"];
const requiredActions = [
  "save_draft",
  "submit_proposal",
  "resubmit_revision",
  "add_evidence_link",
  "request_revision",
  "approve_submission",
  "mark_meeting_held",
  "flag_presentation_risk",
  "queue_archive_export",
  "add_deadline_notice",
  "run_readiness_report",
  "reset_alpha",
];

assert(seed.mode === "day-7-alpha", "Alpha seed mode must be day-7-alpha.");
assert(/seeded demo personas/i.test(seed.alphaBoundary || ""), "Alpha seed must label seeded demo personas.");
assert(/real student data/i.test(seed.alphaBoundary || ""), "Alpha seed must warn against real student data.");
assert(Array.isArray(seed.personas) && seed.personas.length >= 5, "Alpha seed needs at least five personas.");
assert(deriveMetrics(seed).evidenceCount >= 1, "Alpha seed needs evidence metadata for the walkthrough.");

const personaIds = new Set((seed.personas || []).map((persona) => persona.id));
for (const persona of requiredPersonas) {
  assert(personaIds.has(persona), `Alpha seed is missing persona ${persona}.`);
}

for (const action of requiredActions) {
  assert(alphaJs.includes(`"${action}"`) || alphaModel.includes(action), `Alpha flow is missing action ${action}.`);
}

for (const storageApi of ["localStorage", "sessionStorage", "indexedDB"]) {
  assert(!alphaJs.includes(storageApi), `alpha.js must not use ${storageApi} for student records.`);
}

assert(alphaHtml.includes('id="alphaRoot"'), "alpha.html must include #alphaRoot.");
assert(/skip-link/i.test(alphaHtml), "alpha.html must include a skip link.");
assert(/aria-live="polite"/i.test(alphaHtml), "alpha.html must include polite live region semantics.");
assert((alphaCss.match(/@media \(max-width:/g) || []).length >= 2, "alpha.css must include responsive media queries.");
assert(/Do not enter real student records/i.test(alphaRunbook), "Alpha runbook must warn against real student records.");
assert(/node:test/.test(alphaTests), "Alpha state-machine tests must use the Node test runner.");
assert(existsSync(resolve(root, ".github/workflows/ci.yml")), "Primary CI workflow must exist.");

for (const scriptName of requiredScripts) {
  assert(packageJson.scripts?.[scriptName], `package.json is missing script ${scriptName}.`);
}

if (failures.length > 0) {
  console.error("Alpha contract check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  if (globalThis.process) {
    globalThis.process.exitCode = 1;
  } else {
    throw new Error("Alpha contract check failed.");
  }
} else {
  console.log(
    `Alpha contract check passed: ${seed.personas.length} personas, ${requiredActions.length} workflow actions, ${deriveMetrics(seed).evidenceCount} seed evidence item(s).`,
  );
}
