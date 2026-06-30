#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(".");

const STATUS = Object.freeze({
  PASS: "PASS",
  BLOCKED: "BLOCKED",
  NON_BLOCKING_DEMO_ONLY: "NON_BLOCKING_DEMO_ONLY",
  FUTURE_PILOT_ITEM: "FUTURE_PILOT_ITEM",
  MANUAL_PROOF_REQUIRED: "MANUAL_PROOF_REQUIRED",
});

const paths = {
  doc: "docs/sales/real-student-pilot-readiness-gap-analysis.md",
  proofPlan: "docs/sales/real-student-pilot-proof-plan.md",
  hostedPlan: "docs/sales/hosted-proof-plan.md",
  operatorScript: "docs/sales/demo-day-operator-script.md",
  screenshotIndex: "docs/sales/hosted-browser-proof-screenshot-index.md",
  technicalProof: "docs/sales/technical-proof-checklist.md",
  hostedManifest: "docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json",
  hostedPermissions: "scripts/check-hosted-workspace-permissions.mjs",
  hostedBrowserProof: "scripts/prove-hosted-fake-pilot-browser.mjs",
  healthRoute: "functions/api/health.ts",
  migration0016: "migrations/0016_student_roster_profiles.sql",
  importRoute: "functions/api/admin/users/import.ts",
  importTests: "tests/admin-users-import.integration.test.mjs",
  workspaceTests: "tests/workspace-app.test.mjs",
  permissionMatrix: "scripts/verify-permission-role-matrix.mjs",
  mutationOrigin: "scripts/verify-mutation-origin-coverage.mjs",
  packageJson: "package.json",
  runner: "scripts/run-npm-script.ps1",
};

const expectedEvidence = [
  {
    id: "role_scoped_pilot_account_proof",
    statusWhenMissing: STATUS.MANUAL_PROOF_REQUIRED,
    requiredForPilot: true,
    path: "docs/progress/runs/real-student-pilot-role-scope-proof.json",
    message: "Role-scoped pilot-account proof has not been captured with approved pilot-shaped accounts.",
    proof: "Manual hosted/API proof after approved pilot accounts exist; then save the redacted manifest at this path.",
  },
  {
    id: "backup_restore_rehearsal_evidence",
    statusWhenMissing: STATUS.MANUAL_PROOF_REQUIRED,
    requiredForPilot: true,
    path: "docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json",
    message: "Backup/restore rehearsal evidence is missing. Do not infer D1 restore readiness from migrations or fake demo proof.",
    proof: "Manual D1 export/restore rehearsal against non-real data with rollback owner and restore-success evidence.",
  },
  {
    id: "real_roster_validation_evidence",
    statusWhenMissing: STATUS.MANUAL_PROOF_REQUIRED,
    requiredForPilot: true,
    path: "docs/progress/runs/real-student-pilot-roster-validation-evidence.json",
    message: "Real-roster validation evidence is missing. Only fake/synthetic row rehearsals are allowed until approval.",
    proof: "Manual roster-owner signoff plus sanitized dry-run/preview evidence before any real import.",
  },
  {
    id: "privacy_support_retention_approval",
    statusWhenMissing: STATUS.MANUAL_PROOF_REQUIRED,
    requiredForPilot: true,
    path: "docs/progress/runs/real-student-pilot-privacy-support-retention-approval.json",
    message: "Privacy, support, retention, and data ownership approval evidence is missing.",
    proof: "School/district approval packet; do not store student data until approved.",
  },
  {
    id: "sso_or_managed_local_credential_delivery",
    statusWhenMissing: STATUS.MANUAL_PROOF_REQUIRED,
    requiredForPilot: true,
    path: "docs/progress/runs/real-student-pilot-credential-delivery-approval.json",
    message: "SSO or approved managed-local credential delivery evidence is missing.",
    proof: "Approved live-domain SSO proof or managed-local credential delivery approval; Global Admin remains local-account-only.",
  },
  {
    id: "archive_manifest_download_acceptance",
    statusWhenMissing: STATUS.FUTURE_PILOT_ITEM,
    requiredForPilot: false,
    path: "docs/progress/runs/real-student-pilot-archive-download-evidence.json",
    message: "Archive manifest download remains future/pilot-scope-dependent unless the first pilot includes archive handoff.",
    proof: "`student_archive_manifest_download` must pass hosted dashboard proof before archive download is claimed.",
  },
];

const requiredMatrixRows = [
  "Hosted app availability",
  "Local/demo readiness",
  "Hosted fake-account demo readiness",
  "Real-student pilot decision",
  "Full production readiness",
  "Database health",
  "Migration health, including 0016",
  "Google SSO or approved managed-local credential delivery",
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
  "Audit/logging",
  "Error handling",
  "Data export/archive/download",
  "Backup/restore rehearsal",
  "Real roster validation",
  "Privacy/data separation",
  "Tenant/school separation",
  "Hosted proof screenshots",
  "Known skipped items, including `student_archive_manifest_download`",
  "Legacy synthetic hosted sales-demo seed",
];

const requiredDocPhrases = [
  "NO-GO for real-student production pilot readiness",
  "Hosted fake-account click-around demo readiness is green",
  "Local/demo readiness",
  "Real-student pilot readiness",
  "Full production readiness",
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
  "SSO or approved managed-local credential delivery",
  "privacy, support, retention, and data ownership",
  "real roster validation",
  "backup/restore rehearsal",
  "role-scoped pilot-account proof",
  "fake `.test` proof limitations",
];

const requiredProofPlanPhrases = [
  "Role-Scoped Pilot Account Proof Plan",
  "Student cannot access admin/staff surfaces",
  "Mentor cannot access unassigned students",
  "Program Teacher cannot cross program/site scope",
  "Viewer cannot mutate",
  "SSO cannot create or use Global Admin",
  "View as Student cannot mutate",
  "Global Admin local account",
  "Backup/Restore Rehearsal Checklist",
  "D1 export",
  "restore rehearsal",
  "non-real data",
  "Real-Roster Validation Checklist",
  "approved source of truth",
  "required fields",
  "cohort",
  "graduation year",
  "program/site mapping",
  "mentor/viewer assignment",
  "duplicate handling",
  "deactivation/archive handling",
  "fake/synthetic rows only",
  "Archive/Download Acceptance Criteria",
  "no raw Drive IDs",
  "audit/logging",
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
  [paths.technicalProof]: [
    "check:pilot-readiness",
    "real-student-pilot-proof-plan.md",
    "Backup/restore rehearsal evidence",
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
  [paths.permissionMatrix]: [
    "Program Teacher",
    "Mentor",
    "Viewer",
    "global-admin only",
    "assigned-student-only",
  ],
  [paths.mutationOrigin]: [
    "requirePost",
    "requireDelete",
    "hasAllowedMutationOrigin",
    "cross_origin_post_denied",
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

const integrityFailures = [];
const warnings = [];
const checks = [];

function absolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  const filePath = absolute(relativePath);
  if (!existsSync(filePath)) {
    integrityFailures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    integrityFailures.push(`Could not parse ${relativePath}: ${error.message}`);
    return {};
  }
}

function check(condition, message) {
  if (!condition) integrityFailures.push(message);
}

function requireIncludes(label, content, phrase) {
  check(content.includes(phrase), `${label} is missing required phrase: ${phrase}`);
}

function requireMatch(label, content, pattern, description) {
  check(pattern.test(content), `${label} is missing required pattern: ${description}`);
}

function forbidMatch(label, content, pattern, description) {
  check(!pattern.test(content), `${label} contains forbidden pattern: ${description}`);
}

function recordCheck(input) {
  checks.push({
    id: input.id,
    area: input.area,
    status: input.status,
    requiredForRealStudentPilot: input.requiredForRealStudentPilot === true,
    evidence: input.evidence,
    proofCommandOrManualProofNeeded: input.proofCommandOrManualProofNeeded,
    ownerOrDependency: input.ownerOrDependency || "TBD",
    message: input.message,
  });
}

const contents = Object.fromEntries(
  Object.entries(paths).map(([key, relativePath]) => [key, read(relativePath)]),
);

const doc = contents.doc;
const proofPlan = contents.proofPlan;

requireIncludes(
  paths.doc,
  doc,
  "| Area | Current state | Evidence | Real-student blocker? | Acceptance criteria | Proof command or manual proof needed | Owner/dependency if known |",
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
requireMatch(paths.doc, doc, /^## Readiness Tiers$/m, "Readiness Tiers section");
requireMatch(paths.doc, doc, /^## Pilot No-Go Checks$/m, "Pilot No-Go Checks section");

for (const phrase of requiredProofPlanPhrases) {
  requireIncludes(paths.proofPlan, proofPlan, phrase);
}
for (const item of expectedEvidence) {
  requireIncludes(paths.proofPlan, proofPlan, item.path);
}

for (const pattern of forbiddenClaimPatterns) {
  forbidMatch(paths.doc, doc, pattern, pattern.toString());
  forbidMatch(paths.proofPlan, proofPlan, pattern, pattern.toString());
}

for (const [relativePath, phrases] of Object.entries(requiredSourcePhrases)) {
  const content = read(relativePath);
  for (const phrase of phrases) {
    requireIncludes(relativePath, content, phrase);
  }
}

const manifest = readJson(paths.hostedManifest);
check(manifest.proof === "hosted_fake_pilot_browser", `${paths.hostedManifest} proof should be hosted_fake_pilot_browser`);
check(manifest.verdict === "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF", `${paths.hostedManifest} verdict should remain GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF`);
check(manifest.realStudentProductionStatus === "NOT_CLAIMED_READY", `${paths.hostedManifest} realStudentProductionStatus should remain NOT_CLAIMED_READY`);
check(manifest.health?.databaseReady === true, `${paths.hostedManifest} should record databaseReady=true`);
check(manifest.health?.studentRosterProfilesReady === true, `${paths.hostedManifest} should record studentRosterProfilesReady=true`);
check(Array.isArray(manifest.screenshots) && manifest.screenshots.length >= 8, `${paths.hostedManifest} should include hosted screenshot coverage`);

const packageJson = readJson(paths.packageJson);
check(
  packageJson.scripts?.["check:pilot-readiness"]
    === "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/check-real-student-pilot-readiness.mjs",
  `${paths.packageJson} is missing the check:pilot-readiness alias`,
);

const thisScript = read("scripts/check-real-student-pilot-readiness.mjs");
for (const pattern of forbiddenExecutionApis) {
  forbidMatch("scripts/check-real-student-pilot-readiness.mjs", thisScript, pattern, pattern.toString());
}

const combinedClaims = [
  doc,
  proofPlan,
  contents.hostedPlan,
  contents.operatorScript,
  contents.screenshotIndex,
  JSON.stringify(manifest, null, 2),
].join("\n\n");
for (const pattern of forbiddenClaimPatterns) {
  forbidMatch("pilot readiness proof surfaces", combinedClaims, pattern, pattern.toString());
}

if (!doc.includes("NO-GO") && !doc.includes("No-go")) {
  integrityFailures.push(`${paths.doc} must keep an explicit no-go decision`);
}
if (!doc.includes("fake `.test`") && !doc.includes("fake .test")) {
  warnings.push("Pilot readiness doc should keep fake .test account language visible.");
}

recordCheck({
  id: "hosted_fake_account_browser_proof",
  area: "Hosted fake-account demo readiness",
  status: STATUS.NON_BLOCKING_DEMO_ONLY,
  requiredForRealStudentPilot: false,
  evidence: paths.hostedManifest,
  proofCommandOrManualProofNeeded: "npm run prove:hosted-fake-pilot-browser",
  ownerOrDependency: "Demo operator",
  message: "Fake `.test` hosted browser proof is green for click-around demo only; it does not satisfy real-student pilot approval.",
});

recordCheck({
  id: "pilot_gap_matrix_static_integrity",
  area: "Readiness documentation",
  status: integrityFailures.length ? STATUS.BLOCKED : STATUS.PASS,
  requiredForRealStudentPilot: true,
  evidence: paths.doc,
  proofCommandOrManualProofNeeded: "npm run check:pilot-readiness",
  ownerOrDependency: "Technical owner",
  message: integrityFailures.length
    ? "Readiness documentation or source guardrail checks failed."
    : "Readiness tiers, matrix, caveats, no-go checks, and source cross-links are present.",
});

recordCheck({
  id: "role_scope_guardrails_source",
  area: "Role-scoped source guardrails",
  status: STATUS.PASS,
  requiredForRealStudentPilot: true,
  evidence: `${paths.importRoute}; ${paths.workspaceTests}; ${paths.permissionMatrix}; ${paths.mutationOrigin}`,
  proofCommandOrManualProofNeeded: "npm test; npm run verify:permission-matrix; npm run verify:mutation-origin",
  ownerOrDependency: "Technical owner",
  message: "Source/test surfaces still include role, mutation-origin, View as Student, Viewer, and import assignment guardrails.",
});

recordCheck({
  id: "migration_0016_health_signal",
  area: "Migration 0016 health treatment",
  status: STATUS.PASS,
  requiredForRealStudentPilot: true,
  evidence: `${paths.migration0016}; ${paths.healthRoute}; ${paths.hostedBrowserProof}`,
  proofCommandOrManualProofNeeded: "/api/health; npm run prove:hosted-fake-pilot-browser",
  ownerOrDependency: "Technical owner",
  message: "Migration 0016 is treated as an already-applied health signal, not as a live-demo migration step.",
});

recordCheck({
  id: "legacy_synthetic_seed_status",
  area: "Legacy synthetic hosted seed",
  status: STATUS.NON_BLOCKING_DEMO_ONLY,
  requiredForRealStudentPilot: false,
  evidence: `${paths.hostedPlan}; ${paths.operatorScript}`,
  proofCommandOrManualProofNeeded: "npm run prove:sales-demo:hosted only if a technical reviewer asks about the legacy gate",
  ownerOrDependency: "Demo operator",
  message: "Legacy synthetic hosted sales-demo seed absence remains non-blocking for the canonical fake-account hosted demo.",
});

recordCheck({
  id: "student_archive_manifest_download",
  area: "Archive/download",
  status: STATUS.FUTURE_PILOT_ITEM,
  requiredForRealStudentPilot: false,
  evidence: `${paths.hostedPermissions}; ${paths.hostedPlan}`,
  proofCommandOrManualProofNeeded: "npm run check:workspace:hosted-dashboard; archive scope signoff if included in pilot",
  ownerOrDependency: "Technical owner plus privacy/retention owner",
  message: "`student_archive_manifest_download` remains skipped/not-ready unless hosted dashboard proof marks it passed and archive is in pilot scope.",
});

for (const item of expectedEvidence) {
  const present = existsSync(absolute(item.path));
  recordCheck({
    id: item.id,
    area: item.id.replaceAll("_", " "),
    status: present ? STATUS.PASS : item.statusWhenMissing,
    requiredForRealStudentPilot: item.requiredForPilot,
    evidence: item.path,
    proofCommandOrManualProofNeeded: item.proof,
    ownerOrDependency: "Pilot owner / school dependency",
    message: present ? "Evidence manifest exists; inspect contents before using it for pilot approval." : item.message,
  });
}

const requiredManualItems = checks.filter(
  (item) => item.requiredForRealStudentPilot && item.status === STATUS.MANUAL_PROOF_REQUIRED,
);

recordCheck({
  id: "real_student_pilot_final_decision",
  area: "Real-student pilot final decision",
  status: requiredManualItems.length || integrityFailures.length ? STATUS.BLOCKED : STATUS.PASS,
  requiredForRealStudentPilot: true,
  evidence: `${paths.doc}; ${paths.proofPlan}`,
  proofCommandOrManualProofNeeded: "All required manual proof manifests plus full validation stack",
  ownerOrDependency: "Pilot owner; technical owner; privacy/support owner; school roster owner",
  message: requiredManualItems.length || integrityFailures.length
    ? "Real-student pilot remains NO-GO. Fake-account demo proof is green, but required pilot evidence is missing or blocked."
    : "All required static and manual evidence is present; human approval still must inspect the proof packet before changing any claim.",
});

const statusCounts = Object.values(STATUS).reduce((counts, status) => {
  counts[status] = checks.filter((item) => item.status === status).length;
  return counts;
}, {});

const summary = {
  scriptStatus: integrityFailures.length ? "FAIL" : "PASS",
  finalDecision: {
    status: checks.find((item) => item.id === "real_student_pilot_final_decision")?.status || STATUS.BLOCKED,
    decision: requiredManualItems.length || integrityFailures.length
      ? "NO_GO_REAL_STUDENT_PILOT"
      : "STATIC_PREFLIGHT_COMPLETE_REQUIRES_HUMAN_APPROVAL",
    hostedFakeAccountDemo: manifest.verdict ?? "missing",
    realStudentProductionStatus: manifest.realStudentProductionStatus ?? "missing",
    fakeAccountProofLimit: "Hosted fake-account click-around demo readiness is green only for fake `.test` accounts and fake data.",
  },
  statusCounts,
  missingRequiredManualProofIds: requiredManualItems.map((item) => item.id),
  expectedEvidenceManifests: expectedEvidence.map((item) => ({
    id: item.id,
    path: item.path,
    present: existsSync(absolute(item.path)),
    statusWhenMissing: item.statusWhenMissing,
    requiredForRealStudentPilot: item.requiredForPilot,
  })),
  nonMutating: true,
  checkedAt: new Date().toISOString(),
  checks,
  warnings,
  integrityFailures,
};

if (integrityFailures.length > 0) {
  console.error("PILOT_READINESS_PREFLIGHT_FAILED");
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("PILOT_READINESS_PREFLIGHT_COMPLETE_NO_GO");
console.log(JSON.stringify(summary, null, 2));
