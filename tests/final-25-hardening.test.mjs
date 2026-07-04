import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const runNpmScript = await readFile("scripts/run-npm-script.ps1", "utf8");
const permissionMatrix = await readFile("scripts/verify-permission-role-matrix.mjs", "utf8");
const mutationOrigin = await readFile("scripts/verify-mutation-origin-coverage.mjs", "utf8");
const urlState = await readFile("scripts/verify-workspace-url-state.mjs", "utf8");
const accessibility = await readFile("scripts/check-workspace-accessibility-contract.mjs", "utf8");
const errorState = await readFile("scripts/check-workspace-error-state-contract.mjs", "utf8");
const mobileContract = await readFile("scripts/check-workspace-mobile-contract.mjs", "utf8");
const weeklyReadiness = await readFile("scripts/report-weekly-readiness.mjs", "utf8");
const pilotProof = await readFile("scripts/prove-pilot-flow-local.mjs", "utf8");
const cadenceDoc = await readFile("docs/release/weekly-readiness-and-dependency-cadence.md", "utf8");

test("final hardening verifier scripts are registered in package and local fallback check", () => {
  assert.match(packageJson.scripts["verify:permission-matrix"], /verify-permission-role-matrix\.mjs/);
  assert.match(packageJson.scripts["verify:mutation-origin"], /verify-mutation-origin-coverage\.mjs/);
  assert.match(packageJson.scripts["verify:workspace-url-state"], /verify-workspace-url-state\.mjs/);
  assert.match(packageJson.scripts["check:workspace-accessibility"], /check-workspace-accessibility-contract\.mjs/);
  assert.match(packageJson.scripts["check:workspace-errors"], /check-workspace-error-state-contract\.mjs/);
  assert.match(packageJson.scripts["check:workspace-mobile"], /check-workspace-mobile-contract\.mjs/);
  assert.match(packageJson.scripts["readiness:weekly"], /report-weekly-readiness\.mjs/);
  assert.match(packageJson.scripts["prove:pilot:local"], /prove-pilot-flow-local\.mjs/);

  for (const script of [
    "verify-permission-role-matrix.mjs",
    "verify-mutation-origin-coverage.mjs",
    "verify-workspace-url-state.mjs",
    "check-workspace-accessibility-contract.mjs",
    "check-workspace-error-state-contract.mjs",
    "check-workspace-mobile-contract.mjs",
    "prove-pilot-flow-local.mjs",
  ]) {
    assert.match(runNpmScript, new RegExp(script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("local pilot proof runner covers the major fake-account workflow stages", () => {
  for (const phrase of [
    "Import users and account lifecycle",
    "Student proof upload/link and submission",
    "Program Teacher revision, resubmit, and approval loop",
    "Mentor meeting proof",
    "Presentation readiness and check-in/out",
    "Final files, archive readiness, and package download",
  ]) {
    assert.match(pilotProof, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(pilotProof, /deploy|db:migrate:remote|seed:demo:remote|reset:accounts:remote/);
});

test("permission and mutation verifiers guard the specific exploit-prone boundaries", () => {
  assert.match(permissionMatrix, /Program Teacher may manage mentor coverage/);
  assert.match(permissionMatrix, /Mentor must not gain full directory access/);
  assert.match(permissionMatrix, /security management must remain platform\/global-admin only/);
  assert.match(mutationOrigin, /onRequestDelete must call requireDelete/);
  assert.match(mutationOrigin, /onRequestPost must call requirePost/);
  assert.match(mutationOrigin, /handlePresentationSlotTransition/);
  assert.match(mutationOrigin, /handleSiteMentorAssignmentsPost/);
});

test("url-state and accessibility contracts cover major usability proof surfaces", () => {
  for (const phrase of [
    "Student Directory",
    "Student Detail",
    "Review Queue",
    "Mentor Dashboard",
    "Mentor Assignments",
    "Presentation",
    "Operations",
    "Admin Audit",
    "Archive Exports",
  ]) {
    assert.match(urlState, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(accessibility, /nav collapse button/);
  assert.match(accessibility, /review decision form/);
  assert.match(accessibility, /upload progress/);
  assert.match(accessibility, /mobile workspace layout breakpoint/);
  assert.match(errorState, /401 asks user to sign in again/);
  assert.match(errorState, /403 explains access without leaking detail/);
  assert.match(errorState, /429 gives wait-and-retry guidance/);
  assert.match(errorState, /provider fallback guidance/);
  assert.match(errorState, /majorSections/);
  assert.match(mobileContract, /student first next action/);
  assert.match(mobileContract, /mentor queue guide/);
  assert.match(mobileContract, /program teacher review queue/);
  assert.match(mobileContract, /staff attention queues/);
  assert.match(mobileContract, /users and access import preflight/);
});

test("weekly readiness report names local gates, skipped hosted gates, and dependency cadence", () => {
  assert.match(weeklyReadiness, /Permission role matrix/);
  assert.match(weeklyReadiness, /Mutation origin coverage/);
  assert.match(weeklyReadiness, /Workspace accessibility contract/);
  assert.match(weeklyReadiness, /Workspace error-state contract/);
  assert.match(weeklyReadiness, /Workspace mobile contract/);
  assert.match(weeklyReadiness, /Local fake-account pilot flow proof/);
  assert.match(weeklyReadiness, /SKIPPED BY DEFAULT/);
  assert.match(weeklyReadiness, /mobile screenshot proof/);
  assert.match(weeklyReadiness, /Large workspace bundle should be split after behavior stabilizes/);
  assert.match(cadenceDoc, /Wrangler, Workers types, and TypeScript versions/);
  assert.match(cadenceDoc, /only update one dependency family at a time/);
  assert.match(cadenceDoc, /Hosted and mobile screenshot checks are not marked complete by this local command/);
});
