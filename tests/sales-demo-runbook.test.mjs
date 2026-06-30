import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const SALES_DOCS = [
  "docs/sales/demo-runbook.md",
  "docs/sales/admin-demo-script.md",
  "docs/sales/demo-day-operator-script.md",
  "docs/sales/admin-faq.md",
  "docs/sales/demo-one-page-leavebehind.md",
  "docs/sales/technical-proof-checklist.md",
  "docs/sales/demo-preflight-checklist.md",
  "docs/sales/demo-data-dictionary.md",
  "docs/sales/hosted-proof-plan.md",
  "docs/sales/demo-screenshot-checklist.md",
];

const docs = Object.fromEntries(SALES_DOCS.map((file) => [file, read(file)]));
const combinedSalesDocs = Object.values(docs).join("\n\n");

test("sales demo documentation package exists", () => {
  for (const file of SALES_DOCS) {
    assert.equal(existsSync(file), true, `${file} should exist`);
  }
});

test("runbook covers required demo flow, claims, caveats, and proof matrix", () => {
  const runbook = docs["docs/sales/demo-runbook.md"];
  for (const text of [
    "Demo Purpose",
    "Claims Legend",
    "What This Demo Proves",
    "What This Demo Does Not Yet Prove",
    "Demo Environment",
    "Local Demo Reset Checklist",
    "Demo Personas",
    "Demo Story Students",
    "Demo Data Dictionary",
    "Recommended Demo Flow",
    "Role-Based Demo Paths",
    "7-Minute Quick Demo",
    "15-Minute Deeper Demo",
    "Talking Points For Administrators",
    "Do Not Show During Demo",
    "Live Demo Fallback Plan",
    "Technical Proof Matrix",
    "Role Access Matrix",
    "Known Caveats",
    "Before Live Hosted Demo Checklist",
    "Sales Demo Do / Do Not",
    "Post-Demo Follow-Up Checklist",
    "Go / No-Go Table",
  ]) {
    assert.match(runbook, new RegExp(escapeRegex(text)));
  }

  for (const surface of [
    "Site Dashboard",
    "Student Directory",
    "Student Detail",
    "Review Queue",
    "Mentor Assignments",
    "Operations Readiness",
    "Viewer read-only",
  ]) {
    assert.match(runbook, new RegExp(escapeRegex(surface), "i"));
  }

  for (const command of [
    "npm run seed:demo:local:reset",
    "npm run prove:demo:local",
    "npm run prove:sales-demo:local",
  ]) {
    assert.match(runbook, new RegExp(escapeRegex(command)));
  }

  assert.match(runbook, /Fake-data demo only/);
  assert.match(runbook, /Hosted fake-account pilot proof ready/i);
  assert.match(runbook, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(runbook, /No announcements\/student messaging/i);
  assert.match(runbook, /Do not show `.secrets`|Do not show During Demo/i);
  assert.match(runbook, /post-demo follow-up/i);
  assert.match(runbook, /Go \/ No-Go Table/);
});

test("demo day operator script covers hosted role order and safety guardrails", () => {
  const operator = docs["docs/sales/demo-day-operator-script.md"];
  for (const text of [
    "Demo Day Operator Script",
    "Hosted fake-account click-around demo readiness is green",
    "databaseReady=true",
    "studentRosterProfilesReady=true",
    "HOSTED_FAKE_ACCOUNT_PILOT_GREEN",
    "GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF",
    "student_archive_manifest_download",
    "LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING",
    "HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING",
    "One-Page Claims Boundary",
    "This is demo-ready with fake accounts.",
    "Real student pilot requires these approvals/proofs first.",
    "Preflight Command Path",
    "npm run check:pilot-readiness",
    "npm run prove:demo:local",
    "npm run check:workspace:hosted-permissions",
    "npm run check:workspace:hosted-dashboard",
    "npm run check:workspace:hosted-evidence",
    "npm run prove:hosted-fake-pilot-browser",
    "npm run prove:sales-demo:hosted",
    "Demo Readiness Summary",
    "Hosted app loads",
    "Login/auth",
    "Student roster profile health",
    "Fake `.test` role accounts",
    "View as Student",
    "Add Student",
    "CSV Student Import",
    "Viewer read-only",
    "Program Teacher scope",
    "Mentor scope",
    "Site Admin/Admin/Global Admin boundaries",
    "Archive manifest download",
    "Legacy synthetic hosted sales-demo seed",
    "maya.student@senior-capstone.test",
    "chen.teacher@senior-capstone.test",
    "rivera.mentor@senior-capstone.test",
    "sam.viewer@senior-capstone.test",
    "parker.siteadmin@senior-capstone.test",
    "lee.admin@senior-capstone.test",
    "reporting.miscadmin@senior-capstone.test",
    "Add Student Safe Demo",
    "CSV Import Safe Demo",
    "View As Student Safe Demo",
    "Students cannot activate View as Student",
    "Staff can only enter for authorized students",
    "Viewer remains read-only",
    "first_name,last_name,email,site,program,status,cohort,graduation_year,mentor_email,viewer_email",
    "Preview first",
    "Recovery / Fallback Notes",
  ]) {
    assert.match(operator, new RegExp(escapeRegex(text)));
  }

  for (const noGo of [
    "The hosted app is not reachable.",
    "Any canonical fake `.test` role login fails.",
    "Any role boundary proof fails.",
    "Viewer has a mutation control.",
    "Student can reach staff-only View as Student or admin actions.",
    "Admin Console is exposed to an unauthorized role.",
    "View as Student can mutate or bypass authorized-student scope.",
    "Screenshot or proof manifest artifacts are stale, missing, or no longer match the current UI.",
  ]) {
    assert.match(operator, new RegExp(escapeRegex(noGo)));
  }

  assert.match(operator, /unsafe targets are blocked before the account is created/i);
  assert.match(operator, /out-of-scope sites\/programs/i);
  assert.match(operator, /student-as-mentor\/student-as-viewer/i);
  assert.match(operator, /Real-student production pilot readiness:\s*No-go \/ not claimed/i);
  assert.match(operator, /Health signal/i);
  assert.match(operator, /Future pilot item/i);
  assert.match(operator, /No-go/i);
  assert.match(operator, /Caveat/i);
  assert.match(operator, /Canonical fake `?\.test`? accounts|canonical fake accounts/i);
  assert.match(operator, /not as a live-demo migration step/i);
  assert.match(operator, /Keep them separate instead of using a single wrapper/i);
  assert.match(operator, /deprecated synthetic hosted seed and does not block/i);
  assert.doesNotMatch(operator, /\bproduction\s+pilot\s+ready\b/i);
  assert.doesNotMatch(operator, /\breal\s+student\s+data\s+ready\b/i);
});

test("administrator-facing docs include required safe answers and flows", () => {
  const script = docs["docs/sales/admin-demo-script.md"];
  assert.match(script, /7-Minute Quick Demo/);
  assert.match(script, /15-Minute Deeper Demo/);
  assert.match(script, /Rich Timeline Demo/);
  assert.match(script, /demo-day-operator-script\.md/);
  assert.match(script, /hosted fake-account browser screenshots/i);
  assert.match(script, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(script, /not a FERPA certification/i);

  const faq = docs["docs/sales/admin-faq.md"];
  for (const question of [
    "Is this replacing Canvas?",
    "Is this replacing Remind or school messaging?",
    "Is this using real student data?",
    "Is this FERPA compliant today?",
    "Who can see student evidence?",
    "Can principals or APs see the whole school?",
    "Can teachers only see their assigned or scoped students?",
    "Can mentors only see assigned students?",
    "Can schools export or retain their data?",
    "What is needed before a real pilot?",
    "What is currently local-only versus hosted?",
    "What happens if a school stops using it?",
    "Where would evidence live long-term?",
    "Can this work for multiple schools?",
    "Can students or parents message inside it?",
  ]) {
    assert.match(faq, new RegExp(escapeRegex(question)));
  }
  assert.match(faq, /No\. Fake-data demo only/);
  assert.match(faq, /not a FERPA certification/i);
  assert.match(faq, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(faq, /hosted fake-account browser screenshots/i);
});

test("technical proof and hosted plan map screens to routes and blockers", () => {
  const checklist = docs["docs/sales/technical-proof-checklist.md"];
  for (const route of [
    "/api/site/dashboard",
    "/api/site/students",
    "/api/site/students/:studentId",
    "/api/site/students/:studentId/timeline",
    "/api/site/review-queue",
    "/api/reviews/:submissionId/decision",
    "/api/site/mentor-assignments",
    "/api/site/operations-readiness",
  ]) {
    assert.match(checklist, new RegExp(escapeRegex(route)));
  }
  for (const testFile of [
    "tests/site-dashboard.integration.test.mjs",
    "tests/site-students.integration.test.mjs",
    "tests/site-student-detail.integration.test.mjs",
    "tests/site-review-queue.integration.test.mjs",
    "tests/site-mentor-assignments.integration.test.mjs",
    "tests/site-operations-readiness.integration.test.mjs",
  ]) {
    assert.match(checklist, new RegExp(escapeRegex(testFile)));
  }

  const hosted = docs["docs/sales/hosted-proof-plan.md"];
  assert.match(hosted, /Hosted fake-account click-around demo readiness is green/i);
  assert.match(hosted, /0011_multisite_site_role_foundation\.sql/);
  assert.match(hosted, /sites/);
  assert.match(hosted, /site_users/);
  assert.match(hosted, /site_programs/);
  assert.match(hosted, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011/);
  assert.match(hosted, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(hosted, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(hosted, /HOSTED_FAKE_ACCOUNT_PILOT_GREEN/);
  assert.match(hosted, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(hosted, /SCREENSHOTS_GENERATED_SAFE/);
  assert.match(hosted, /0016_student_roster_profiles\.sql/);
  assert.match(hosted, /studentRosterProfilesReady=true/);
  assert.match(hosted, /already-applied Health signal/i);
  assert.match(hosted, /Demo-Day Preflight Commands/);
  assert.match(hosted, /npm run check:pilot-readiness/);
  assert.match(hosted, /npm run check:workspace:hosted-permissions/);
  assert.match(hosted, /npm run check:workspace:hosted-dashboard/);
  assert.match(hosted, /npm run check:workspace:hosted-evidence/);
  assert.match(hosted, /npm run prove:hosted-fake-pilot-browser/);
  assert.match(hosted, /npm run prove:sales-demo:hosted/);
  assert.match(hosted, /Stop the live hosted walkthrough/);
  assert.match(hosted, /Admin Console is exposed to an unauthorized role/);
  assert.match(hosted, /Future Pilot Item: Archive Manifest Download/);
  assert.match(hosted, /Acceptance criteria/);
  assert.match(hosted, /No remote seed\/reset writes/);
});

test("sales docs avoid overclaims, secret-like values, and screenshot proof claims", () => {
  assert.match(combinedSalesDocs, /fake data|fake-data/i);
  assert.match(combinedSalesDocs, /not a FERPA certification|not claiming FERPA/i);
  assert.match(combinedSalesDocs, /not claiming production pilot readiness|real-student production pilot readiness.*not claimed|No-go/i);
  assert.match(combinedSalesDocs, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF|Hosted fake-account pilot proof ready/i);
  assert.match(combinedSalesDocs, /Hosted fake-account click-around demo readiness/);
  assert.match(combinedSalesDocs, /Real-student production pilot readiness/);
  assert.match(combinedSalesDocs, /This is demo-ready with fake accounts\./);
  assert.match(combinedSalesDocs, /Real student pilot requires these approvals\/proofs first\./);
  assert.match(combinedSalesDocs, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(combinedSalesDocs, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.doesNotMatch(combinedSalesDocs, /fake-account[^.\n]{0,160}(means|equals|proves)[^.\n]{0,160}real-student production/i);
  assert.doesNotMatch(combinedSalesDocs, /real-student production pilot readiness (is )?(complete|ready|approved)/i);
  assert.match(docs["docs/sales/demo-screenshot-checklist.md"], /2026-06-29 pass generated a hosted fake-account screenshot set/);
  assert.match(docs["docs/sales/demo-screenshot-checklist.md"], /hosted-browser-proof-screenshot-index\.md/);

  const forbidden = [
    /BEGIN PRIVATE KEY/i,
    /AIza[0-9A-Za-z_-]{20,}/,
    /sk-[0-9A-Za-z_-]{20,}/,
    /"password"\s*:/i,
    /"workingPassword"\s*:/i,
    /access_token\s*[:=]\s*["'][^"']+/i,
    /refresh_token\s*[:=]\s*["'][^"']+/i,
    /password_hash\s*[:=]\s*["'][^"']+/i,
    /password_salt\s*[:=]\s*["'][^"']+/i,
    /drive_file_id\s*[:=]\s*["'][^"']+/i,
    /drive_parent_folder_id\s*[:=]\s*["'][^"']+/i,
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(combinedSalesDocs, pattern);
  }
});

test("sales demo proof scripts and package aliases are present and safe", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["prove:sales-demo:local"], "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/prove-sales-demo-local.mjs");
  assert.equal(pkg.scripts["prove:sales-demo:hosted"], "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/prove-sales-demo-hosted.mjs");
  assert.equal(pkg.scripts["prove:hosted-fake-pilot-browser"], "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/prove-hosted-fake-pilot-browser.mjs");
  assert.equal(pkg.scripts["check:pilot-readiness"], "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/run-node-script.ps1 scripts/check-real-student-pilot-readiness.mjs");

  const localScript = read("scripts/prove-sales-demo-local.mjs");
  assert.match(localScript, /runDemoProof/);
  assert.match(localScript, /credentialsPrinted:\s*false/);
  assert.doesNotMatch(localScript, /console\.log\(JSON\.stringify\(result/);

  const hostedScript = read("scripts/prove-sales-demo-hosted.mjs");
  assert.match(hostedScript, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011/);
  assert.match(hostedScript, /LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING/);
  assert.match(hostedScript, /LEGACY_COMPATIBILITY_SEED_STATUS/);
  assert.match(hostedScript, /hostedProofStatusMeaning/);
  assert.match(hostedScript, /realStudentProductionStatus:\s*"NOT_CLAIMED_READY"/);
  assert.match(hostedScript, /migration0016Treatment/);
  assert.match(hostedScript, /proofBoundary/);
  assert.match(hostedScript, /canonicalHostedProofCommand/);
  assert.match(hostedScript, /hostedFakeAccountDemoBlocked:\s*false/);
  assert.match(hostedScript, /currentDemoReadinessImpact:\s*"NON_BLOCKING_CAVEAT"/);
  assert.match(hostedScript, /remoteWritesPerformed:\s*false/);
  assert.match(hostedScript, /remoteSeedPerformed:\s*false/);
  assert.match(hostedScript, /deployPerformed:\s*false/);
  assert.doesNotMatch(hostedScript, /migrations\s+apply/i);
  assert.doesNotMatch(hostedScript, /--write/);
  assert.doesNotMatch(hostedScript, /seed:demo:remote/);
  assert.doesNotMatch(hostedScript, /d1[^"\n]+execute[^"\n]+--file/i);
});

function read(file) {
  return readFileSync(file, "utf8");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
