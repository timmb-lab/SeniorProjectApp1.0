import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(".");

const paths = {
  doc: "docs/sales/real-student-pilot-readiness-gap-analysis.md",
  hostedPlan: "docs/sales/hosted-proof-plan.md",
  operatorScript: "docs/sales/demo-day-operator-script.md",
  screenshotIndex: "docs/sales/hosted-browser-proof-screenshot-index.md",
  hostedManifest: "docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json",
  hostedPermissions: "scripts/check-hosted-workspace-permissions.mjs",
  hostedBrowserProof: "scripts/prove-hosted-fake-pilot-browser.mjs",
  healthRoute: "functions/api/health.ts",
  migration0016: "migrations/0016_student_roster_profiles.sql",
  importRoute: "functions/api/admin/users/import.ts",
  importTests: "tests/admin-users-import.integration.test.mjs",
  workspaceTests: "tests/workspace-app.test.mjs",
  packageJson: "package.json",
  runner: "scripts/run-npm-script.ps1",
};

const requiredMatrixRows = [
  "Hosted app availability",
  "Database health",
  "Migration health, including 0016",
  "Google SSO",
  "Local Global Admin account model",
  "Test/fake accounts",
  "Real staff account onboarding",
  "Real student account onboarding",
  "Add Student",
  "Student CSV Import",
  "Staff CSV Import, if present",
  "Student roster profiles",
  "Mentor assignment",
  "Viewer assignment",
  "Program Teacher scope",
  "Administration/Admin scope",
  "Site Admin scope",
  "Global Admin scope",
  "View as Student",
  "Viewer read-only",
  "Student dashboard",
  "Student detail",
  "Program management",
  "Audit/logging, if present",
  "Error handling",
  "Data export/archive/download",
  "Backups/rollback",
  "Privacy/data separation",
  "Tenant/school separation",
  "Hosted proof screenshots",
  "No-go checks",
  "Known skipped items, including `student_archive_manifest_download`",
  "Legacy synthetic hosted sales-demo seed",
  "Real production pilot acceptance criteria",
];

const requiredDocPhrases = [
  "NO-GO for real-student production pilot readiness",
  "Hosted fake-account click-around demo readiness is green",
  "HOSTED_FAKE_ACCOUNT_PILOT_GREEN",
  "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF",
  "NOT_CLAIMED_READY",
  "student_archive_manifest_download",
  "skipped_not_ready",
  "Future pilot item",
  "LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING",
  "0016_student_roster_profiles.sql",
  "studentRosterProfilesReady=true",
  "student_roster_profiles_migration_required",
  "credential_delivery_policy_required",
  "viewer_student_forbidden",
  "Global Admin",
  "local",
  "View as Student",
  "read-only",
  "Backup/restore",
  "privacy",
  "support",
  "SSO",
];

const requiredSourcePhrases = {
  [paths.hostedPlan]: [
    "Hosted fake-account click-around demo readiness is green",
    "student_archive_manifest_download",
    "Future Pilot Item: Archive Manifest Download",
    "LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING",
    "studentRosterProfilesReady=true",
    "already-applied Health signal",
  ],
  [paths.operatorScript]: [
    "Real-student production pilot readiness: No-go / not claimed",
    "Add Student Safe Demo",
    "CSV Import Safe Demo",
    "View As Student Safe Demo",
    "Viewer remains read-only",
    "student_archive_manifest_download",
  ],
  [paths.screenshotIndex]: [
    "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF",
    "HOSTED_FAKE_ACCOUNTS_USED_FOR_BROWSER_PROOF",
    "student_archive_manifest_download",
    "Future pilot item",
  ],
  [paths.hostedPermissions]: [
    'name: "student_archive_manifest_download"',
    'readinessCategory: "future_pilot_item"',
    "requiredForHostedFakeAccountDemoDay: false",
    "liveDemoBlocker: false",
  ],
  [paths.hostedBrowserProof]: [
    "HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016",
    "studentRosterProfilesReady",
  ],
  [paths.healthRoute]: [
    "databaseReady",
    "studentRosterProfilesReady",
  ],
  [paths.migration0016]: [
    "CREATE TABLE IF NOT EXISTS student_roster_profiles",
    "student_user_id",
    "graduation_year",
  ],
  [paths.importRoute]: [
    "student_roster_profiles_migration_required",
    "credential_delivery_policy_required",
    "${targetRoleId}_assignment_target_forbidden",
    "canActorCreateStudentAssignment",
    "activeScopedAssignmentTarget",
  ],
  [paths.importTests]: [
    "student_roster_profiles_migration_required",
    "viewer_student_forbidden",
    "credential_delivery_policy_required",
    "mentor_assignment_target_forbidden",
  ],
  [paths.workspaceTests]: [
    "View as Student",
    "Viewer",
    "read-only",
  ],
  [paths.runner]: [
    '"check:pilot-readiness"',
    "scripts\\check-real-student-pilot-readiness.mjs",
  ],
};

const forbiddenClaimPatterns = [
  /\bproduction\s+pilot\s+ready\b/i,
  /\breal\s+student\s+data\s+ready\b/i,
  /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student production/i,
  /real-student production pilot readiness (is )?(complete|ready|approved)/i,
  /approved for real student data/i,
];

const forbiddenExecutionApis = [
  /from\s+["']node:child_process["']/,
  /from\s+["']child_process["']/,
  /\bspawnSync\s*\(/,
  /\bexecFileSync\s*\(/,
  /\bexecSync\s*\(/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
];

const failures = [];
const warnings = [];

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }

  return readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    failures.push(`Could not parse ${relativePath}: ${error.message}`);
    return {};
  }
}

function requireIncludes(label, content, phrase) {
  if (!content.includes(phrase)) {
    failures.push(`${label} is missing required phrase: ${phrase}`);
  }
}

function requireMatch(label, content, pattern, description) {
  if (!pattern.test(content)) {
    failures.push(`${label} is missing required pattern: ${description}`);
  }
}

function forbidMatch(label, content, pattern, description) {
  if (pattern.test(content)) {
    failures.push(`${label} contains forbidden pattern: ${description}`);
  }
}

const contents = Object.fromEntries(
  Object.entries(paths).map(([key, relativePath]) => [key, read(relativePath)]),
);

const doc = contents.doc;
requireIncludes(
  paths.doc,
  doc,
  "| Capability | Current status | Evidence | Demo-only/fake-only dependency? | Real-student pilot risk | Required before pilot? | Recommended next action | Validation command/proof |",
);
for (const row of requiredMatrixRows) {
  requireIncludes(paths.doc, doc, `| ${row} |`);
}
for (const phrase of requiredDocPhrases) {
  requireIncludes(paths.doc, doc, phrase);
}
for (let item = 1; item <= 15; item += 1) {
  requireMatch(paths.doc, doc, new RegExp(`^${item}\\. `, "m"), `acceptance criterion ${item}`);
}
requireMatch(paths.doc, doc, /^## Pilot No-Go Checks$/m, "Pilot No-Go Checks section");
requireMatch(paths.doc, doc, /^## Low-Risk Improvements Added With This Pass$/m, "Low-Risk Improvements section");

for (const pattern of forbiddenClaimPatterns) {
  forbidMatch(paths.doc, doc, pattern, pattern.toString());
}

for (const [relativePath, phrases] of Object.entries(requiredSourcePhrases)) {
  const content = read(relativePath);
  for (const phrase of phrases) {
    requireIncludes(relativePath, content, phrase);
  }
}

const manifest = readJson(paths.hostedManifest);
if (manifest.proof !== "hosted_fake_pilot_browser") {
  failures.push(`${paths.hostedManifest} proof should be hosted_fake_pilot_browser`);
}
if (manifest.verdict !== "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF") {
  failures.push(`${paths.hostedManifest} verdict should remain GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`);
}
if (manifest.realStudentProductionStatus !== "NOT_CLAIMED_READY") {
  failures.push(`${paths.hostedManifest} realStudentProductionStatus should remain NOT_CLAIMED_READY`);
}
if (manifest.health?.databaseReady !== true) {
  failures.push(`${paths.hostedManifest} should record databaseReady=true`);
}
if (manifest.health?.studentRosterProfilesReady !== true) {
  failures.push(`${paths.hostedManifest} should record studentRosterProfilesReady=true`);
}
if (!Array.isArray(manifest.screenshots) || manifest.screenshots.length < 8) {
  failures.push(`${paths.hostedManifest} should include hosted screenshot coverage`);
}

const packageJson = readJson(paths.packageJson);
if (
  packageJson.scripts?.["check:pilot-readiness"]
    !== "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/check-real-student-pilot-readiness.mjs"
) {
  failures.push(`${paths.packageJson} is missing the check:pilot-readiness alias`);
}

const thisScript = read("scripts/check-real-student-pilot-readiness.mjs");
for (const pattern of forbiddenExecutionApis) {
  forbidMatch("scripts/check-real-student-pilot-readiness.mjs", thisScript, pattern, pattern.toString());
}

const combinedClaims = [
  doc,
  contents.hostedPlan,
  contents.operatorScript,
  contents.screenshotIndex,
  JSON.stringify(manifest, null, 2),
].join("\n\n");
for (const pattern of forbiddenClaimPatterns) {
  forbidMatch("pilot readiness proof surfaces", combinedClaims, pattern, pattern.toString());
}

if (!doc.includes("NO-GO") && !doc.includes("No-go")) {
  failures.push(`${paths.doc} must keep an explicit no-go decision`);
}

if (!doc.includes("fake `.test`") && !doc.includes("fake .test")) {
  warnings.push("Pilot readiness doc should keep fake .test account language visible.");
}

const summary = {
  status: failures.length ? "FAIL" : "PILOT_READINESS_PREFLIGHT_PASS",
  realStudentPilotDecision: "NO_GO_NOT_CLAIMED",
  hostedFakeAccountProof: manifest.verdict ?? "missing",
  realStudentProductionStatus: manifest.realStudentProductionStatus ?? "missing",
  matrixRowsChecked: requiredMatrixRows.length,
  archiveManifestDownload: "student_archive_manifest_download",
  nonMutating: true,
  warnings,
  failures,
};

if (failures.length > 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("PILOT_READINESS_PREFLIGHT_PASS");
console.log(JSON.stringify(summary, null, 2));
