import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const SALES_DOCS = [
  "docs/sales/demo-runbook.md",
  "docs/sales/admin-demo-script.md",
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
  assert.match(runbook, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING|missing remote demo seed data/i);
  assert.match(runbook, /No announcements\/student messaging/i);
  assert.match(runbook, /Do not show `.secrets`|Do not show During Demo/i);
  assert.match(runbook, /post-demo follow-up/i);
  assert.match(runbook, /Go \/ No-Go Table/);
});

test("administrator-facing docs include required safe answers and flows", () => {
  const script = docs["docs/sales/admin-demo-script.md"];
  assert.match(script, /7-Minute Quick Demo/);
  assert.match(script, /15-Minute Deeper Demo/);
  assert.match(script, /Rich Timeline Demo/);
  assert.match(script, /hosted fake-account browser screenshots/i);
  assert.match(script, /missing remote demo seed data/i);
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
  assert.match(faq, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
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
  assert.match(hosted, /Hosted fake-account pilot proof is green/i);
  assert.match(hosted, /0011_multisite_site_role_foundation\.sql/);
  assert.match(hosted, /sites/);
  assert.match(hosted, /site_users/);
  assert.match(hosted, /site_programs/);
  assert.match(hosted, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011/);
  assert.match(hosted, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
  assert.match(hosted, /HOSTED_FAKE_ACCOUNT_PILOT_GREEN/);
  assert.match(hosted, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF/);
  assert.match(hosted, /SCREENSHOTS_GENERATED_SAFE/);
  assert.match(hosted, /0016_student_roster_profiles\.sql/);
  assert.match(hosted, /studentRosterProfilesReady=true/);
  assert.match(hosted, /No remote seed\/reset writes/);
});

test("sales docs avoid overclaims, secret-like values, and screenshot proof claims", () => {
  assert.match(combinedSalesDocs, /fake data|fake-data/i);
  assert.match(combinedSalesDocs, /not a FERPA certification|not claiming FERPA/i);
  assert.match(combinedSalesDocs, /not claiming production pilot readiness|not a hosted pilot claim|No-go/i);
  assert.match(combinedSalesDocs, /GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF|Hosted fake-account pilot proof ready/i);
  assert.match(combinedSalesDocs, /HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING/);
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

  const localScript = read("scripts/prove-sales-demo-local.mjs");
  assert.match(localScript, /runDemoProof/);
  assert.match(localScript, /credentialsPrinted:\s*false/);
  assert.doesNotMatch(localScript, /console\.log\(JSON\.stringify\(result/);

  const hostedScript = read("scripts/prove-sales-demo-hosted.mjs");
  assert.match(hostedScript, /HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011/);
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
