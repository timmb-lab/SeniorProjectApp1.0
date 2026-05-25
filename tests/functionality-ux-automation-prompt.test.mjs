import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const promptPath = "automation/prompts/functionality-ux-upgrade-hourly.md";
const ladderPath = "docs/functionality-ux-growth-ladder.md";
const ledgerPath = "docs/functionality-ux-growth-ledger.md";
const statePath = "automation/state/functionality-ux-growth-state.json";

const [prompt, ladder, ledger, stateText] = await Promise.all([
  readFile(promptPath, "utf8"),
  readFile(ladderPath, "utf8"),
  readFile(ledgerPath, "utf8"),
  readFile(statePath, "utf8"),
]);

const state = JSON.parse(stateText);

async function listFilesRecursive(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const path = `${dir}/${entry}`;
    const info = await stat(path);
    if (info.isDirectory()) {
      files.push(...await listFilesRecursive(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function assertConcepts(text, concepts) {
  for (const [label, pattern] of Object.entries(concepts)) {
    assert.match(text, pattern, `Missing prompt concept: ${label}`);
  }
}

test("functionality UX growth artifacts exist and are parseable", () => {
  assert.equal(existsSync(promptPath), true);
  assert.equal(existsSync(ladderPath), true);
  assert.equal(existsSync(ledgerPath), true);
  assert.equal(existsSync(statePath), true);
  assert.equal(state.schemaVersion, 1);
  assert.equal(Array.isArray(state.completedWorkOrders), true);
  assert.equal(Array.isArray(state.deferredWorkOrders), true);
  assert.equal(Array.isArray(state.blockedWorkOrders), true);
  assert.equal(Array.isArray(state.nextRecommendedWorkOrders), true);
  assert.equal(Array.isArray(state.doNotRepeat), true);
});

test("functionality UX upgrade is the only active automation contract", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const automationScriptNames = Object.keys(packageJson.scripts).filter((name) =>
    /automation|cadence/i.test(name),
  );
  assert.deepEqual(automationScriptNames, ["verify:functionality-ux-automation"]);

  const promptFiles = (await readdir("automation/prompts")).filter((name) => name.endsWith(".md"));
  assert.deepEqual(promptFiles, ["functionality-ux-upgrade-hourly.md"]);

  const scriptFiles = await readdir("scripts");
  const retiredVerifierPrefix = ["verify", "cadence"].join("-");
  assert.ok(!scriptFiles.some((name) => name.toLowerCase().startsWith(retiredVerifierPrefix)));
  const automationFiles = await listFilesRecursive("automation");
  assert.ok(!automationFiles.some((name) => name.split(/[\\/]/).includes("qol")));

  const activeDocs = [
    "docs/automation.md",
    "docs/automation-cadence.md",
    "docs/automation-runbook.md",
    "docs/automation-memory.md",
    "docs/automation-self-improvement.md",
  ];
  for (const file of activeDocs) {
    const text = await readFile(file, "utf8");
    assert.match(text, /Functionality UX Upgrade/);
    assert.match(text, /functionality-ux-upgrade-hourly/);
  }
});

test("functionality UX growth ladder defines durable maturity levels", () => {
  for (const heading of [
    "Level 0 - Prototype Cleanup",
    "Level 1 - Navigable Dashboards",
    "Level 2 - Student Detail Depth",
    "Level 3 - Mentor Assignment Workflow",
    "Level 4 - Role-Specific Workspaces",
    "Level 5 - Review and Intervention Queues",
    "Level 6 - Student Progress Drill-Down",
    "Level 7 - Auditability and Trust",
    "Level 8 - Reporting and Operational Readiness",
    "Level 9 - Autonomous Quality Improvement",
  ]) {
    assert.match(ladder, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const concept of [
    /Purpose/,
    /Role Impact/,
    /Example Work Orders/,
    /Exit Criteria/,
    /Safe Automation Slices/,
    /Do-Not-Automate Warnings/,
    /Suggested Tests\/Verifiers/,
  ]) {
    assert.match(ladder, concept);
  }
});

test("functionality UX automation prompt enforces ladder, scoring, safety, and handoff concepts", () => {
  assertConcepts(prompt, {
    "growth ladder": /Growth Ladder Model/,
    "growth ledger": /Growth Ledger And State Rules/,
    "JSON state": /automation\/state\/functionality-ux-growth-state\.json/,
    "candidate discovery": /Discover 10 to 20 possible work orders/,
    "candidate scoring": /Candidate Scoring Rubric/,
    "scoring table": /\| Candidate \| Ladder Level \| Roles \| Impact \| Safety \| Testability \| Size \| Score \| Decision \|/,
    "ladder handoff": /Ladder Handoff/,
    "do not repeat": /do-not-repeat|Do not repeat/i,
    "role hierarchy": /Role Hierarchy And Permissions/,
    "student privacy": /Student Privacy Rules/,
    "mentor restrictions": /Mentors cannot assign students to themselves/,
    "dashboard click-through": /Dashboard Click-Through Rules/,
    "student detail": /Student Detail Rules/,
    "viewer admin": /Viewer\/Admin Role Rules/,
    "language cleanup": /Language Cleanup Rules/,
    "empty states": /Empty State Rules/,
    "route link rules": /Route\/Link Rules/,
    "data reality": /Data Reality Rules/,
    "validation": /Validation Requirements/,
    "commit rules": /Commit Rules/,
    "failure handling": /Failure Handling/,
    "no random walk": /No Random Walk Rules/,
    "autonomous accountable": /Autonomous But Accountable Rules/,
  });
});

test("functionality UX automation prompt includes required work order type templates", () => {
  for (const type of [
    "TYPE A - Language/Product Readiness",
    "TYPE B - Dashboard Click-Through",
    "TYPE C - Student Detail / Drill-Down",
    "TYPE D - Role Workspace",
    "TYPE E - Mentor Assignment",
    "TYPE F - Review/Intervention Queue",
    "TYPE G - Verification/Regression Protection",
    "TYPE H - Documentation/Backlog Alignment",
  ]) {
    assert.match(prompt, new RegExp(type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(prompt, /when user-facing copy still leaks internal terms/i);
  assert.match(prompt, /card opens an existing workspace section/i);
  assert.match(prompt, /self-assignment prevention test/i);
  assert.match(prompt, /no brittle exact-prose checks/i);
});

test("functionality UX ledger and state preserve handoff and repetition memory", () => {
  assert.match(ledger, /Run Entry Template/);
  assert.match(ledger, /Ladder Handoff/);
  assert.match(ledger, /Do-not-repeat notes/);
  assert.match(ledger, /Site Dashboard No Mentor/);
  assert.match(ledger, /LEVEL_1_NAVIGABLE_DASHBOARDS/);

  assert.ok(
    state.completedWorkOrders.some((workOrder) => workOrder.id === "site-dashboard-no-mentor-clickthrough"),
    "state should remember completed No Mentor dashboard work",
  );
  assert.ok(
    state.nextRecommendedWorkOrders.some((workOrder) => /Review Queue/.test(workOrder.summary)),
    "state should recommend review queue dashboard click-through work",
  );
  assert.ok(
    state.doNotRepeat.some((note) => /No Mentor metric/i.test(note)),
    "state should prevent repeating the No Mentor click-through",
  );
});
