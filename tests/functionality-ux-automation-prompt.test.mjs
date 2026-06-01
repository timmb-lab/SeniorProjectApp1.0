import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const promptPath = "automation/prompts/functionality-ux-upgrade-hourly.md";
const ladderPath = "docs/functionality-ux-growth-ladder.md";
const ledgerPath = "docs/functionality-ux-growth-ledger.md";
const statePath = "automation/state/functionality-ux-growth-state.json";
const roleReadinessPath = "docs/product/demo-role-readiness.md";

const [prompt, ladder, ledger, stateText, roleReadiness] = await Promise.all([
  readFile(promptPath, "utf8"),
  readFile(ladderPath, "utf8"),
  readFile(ledgerPath, "utf8"),
  readFile(statePath, "utf8"),
  readFile(roleReadinessPath, "utf8"),
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

function listTrackedTextFiles() {
  const output = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => existsSync(file))
    .filter((file) =>
      /\.(css|html|js|json|jsonc|md|mjs|ps1|sql|toml|ts|txt|ya?ml)$/i.test(file),
    );
}

function assertConcepts(text, concepts) {
  for (const [label, pattern] of Object.entries(concepts)) {
    assert.match(text, pattern, `Missing prompt concept: ${label}`);
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("functionality UX growth artifacts exist and are parseable", () => {
  assert.equal(existsSync(promptPath), true);
  assert.equal(existsSync(ladderPath), true);
  assert.equal(existsSync(ledgerPath), true);
  assert.equal(existsSync(statePath), true);
  assert.equal(existsSync(roleReadinessPath), true);
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
  const retiredSegment = ["qo", "l"].join("");
  assert.ok(!automationFiles.some((name) => name.split(/[\\/]/).includes(retiredSegment)));

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

  const retiredAutomationTokens = [
    ["senior-capstone-", "nonfigma-mvp-builder"],
    ["senior-capstone-", "figma-product-builder"],
    ["senior-capstone-", "daily-mvp-summary"],
    ["senior-capstone-", "weekly-script-audit"],
    ["senior-capstone-", "hourly-", retiredSegment],
    ["automation/", retiredSegment],
    ["verify-", "cadence"],
    ["check:", "automation"],
    ["verify:", retiredSegment],
    [retiredSegment, ":"],
    ["quarter", "-hour"],
    ["quarter", "_hour"],
    ["quarter", "Hour"],
    ["every", " quarter hour"],
    ["every ", "15 minutes"],
    ["15", "-minute cadence"],
    ["split", "-builder"],
    ["split", " builder"],
    ["BYMINUTE=", "15"],
    ["BYMINUTE=", "30"],
    ["BYMINUTE=", "45"],
    ["expected", "BuilderCadences"],
    ["expected", "BuilderAutomationIds"],
  ].map((parts) => parts.join(""));

  for (const file of listTrackedTextFiles()) {
    for (const token of retiredAutomationTokens) {
      assert.ok(
        !file.includes(token),
        `Retired automation reference "${token}" must stay out of tracked file paths: ${file}`,
      );
    }

    const text = await readFile(file, "utf8");
    for (const token of retiredAutomationTokens) {
      assert.ok(
        !text.includes(token),
        `Retired automation reference "${token}" must stay out of tracked text: ${file}`,
      );
    }
  }
});

test("functionality UX automation keeps GUI identity and top-bottom cadence", async (t) => {
  assert.match(prompt, /^# Functionality UX Upgrade/m);
  assert.match(prompt, /Automation slug: `functionality-ux-upgrade-hourly`/);
  assert.match(prompt, /automation\/prompts\/functionality-ux-upgrade-hourly\.md/);
  assert.match(prompt, /top of the hour/i);
  assert.match(prompt, /bottom of the hour/i);
  assert.match(prompt, /HH:00/);
  assert.match(prompt, /HH:30/);
  assert.match(prompt, /Wednesday, June 3, 2026/);
  assert.doesNotMatch(prompt, /hourly at minute 20/i);

  const activeGuidanceDocs = [
    "docs/automation.md",
    "docs/automation-cadence.md",
    "docs/automation-runbook.md",
    "docs/automation-memory.md",
    "docs/automation-self-improvement.md",
    "docs/mvp-requirements-catalog.md",
    "docs/progress/figma.md",
    "docs/progress/handoffs.md",
  ];
  const staleActivePatterns = [
    ["minutes ", "15 and 45"],
    ["non-", "Figma builder"],
    ["Figma-only product ", "builder"],
    ["top-of-hour non-", "Figma"],
    ["bottom-of-hour ", "Figma"],
    ["daily summary ", "automation"],
    ["weekly strategy review ", "automation"],
  ].map((parts) => new RegExp(escapeRegex(parts.join("")), "i"));
  for (const file of activeGuidanceDocs) {
    const text = await readFile(file, "utf8");
    for (const pattern of staleActivePatterns) {
      assert.doesNotMatch(text, pattern, `${file} must not describe retired split-lane automation`);
    }
  }

  const legacyScriptPath = ["scripts", ["run", "npm", "script.ps1"].join("-")].join("/");
  assert.doesNotMatch(prompt, new RegExp(escapeRegex(legacyScriptPath)), "Prompt must not recommend adding the retired package-script fallback path");

  const home = process.env.USERPROFILE || process.env.HOME || "";
  const guiAutomationPath = home
    ? join(home, ".codex", "automations", "functionality-ux-upgrade-hourly", "automation.toml")
    : "";
  if (!guiAutomationPath || !existsSync(guiAutomationPath)) {
    t.diagnostic("Local Codex Desktop GUI automation TOML not present; repo-side identity checks still passed.");
    return;
  }

  const guiText = await readFile(guiAutomationPath, "utf8");
  const expectedRrule = ["FREQ=HOURLY", ["BYMINUTE=0", "30"].join(","), "BYSECOND=0"].join(";");
  assert.match(guiText, /^id = "functionality-ux-upgrade-hourly"$/m);
  assert.match(guiText, /^name = "Functionality UX Upgrade"$/m);
  assert.match(guiText, /^status = "(ACTIVE|PAUSED)"$/m);
  assert.match(guiText, /automation\/prompts\/functionality-ux-upgrade-hourly\.md/);
  assert.match(guiText, /C:\\\\SeniorProjectApp1\.0/);
  assert.match(guiText, new RegExp(`^rrule = "${escapeRegex(expectedRrule)}"$`, "m"));
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
    "role scorecard": /Role Demo Readiness Scorecard/,
    "role readiness doc": /docs\/product\/demo-role-readiness\.md/,
    "role scorecard statuses": /DEMO READY[\s\S]*PARTIALLY READY[\s\S]*BLOCKED[\s\S]*NEEDS SEEDED DATA[\s\S]*NEEDS LIVE HOSTED TEST/,
    "separate role surface categories": /visible menu sections[\s\S]*loaded API routes[\s\S]*allowed actions[\s\S]*forbidden or hidden actions/i,
    "wednesday demo lens": /Wednesday Demo Readiness Lens/,
    "student privacy": /Student Privacy Rules/,
    "mentor restrictions": /Mentors cannot assign students to themselves/,
    "dashboard click-through": /Dashboard Click-Through Rules/,
    "click-through verification": /verify the actual click-through path still works/i,
    "student detail": /Student Detail Rules/,
    "site admin programs": /Site Admin Programs Requirement/,
    "seeded data": /Seeded Demo Data Requirement/,
    "viewer admin": /Viewer\/Admin Role Rules/,
    "language cleanup": /Language Cleanup Rules/,
    "empty states": /Empty State Rules/,
    "route link rules": /Route\/Link Rules/,
    "no visible dead ends": /Every role-visible menu item[\s\S]*real permitted action[\s\S]*clear reason/i,
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
    state.nextRecommendedWorkOrders.some(
      (workOrder) =>
        /Review Queue/.test(workOrder.summary) ||
        /role-readiness|demo-role-readiness|role scorecard/i.test(`${workOrder.id} ${workOrder.summary}`),
    ),
    "state should recommend either review queue follow-up work or the current role-readiness scorecard handoff",
  );
  assert.ok(
    state.doNotRepeat.some((note) => /No Mentor metric/i.test(note)),
    "state should prevent repeating the No Mentor click-through",
  );
  assert.match(roleReadiness, /# Demo Role Readiness/);
  assert.match(roleReadiness, /## 4\. Current Role Readiness Table/);
  assert.match(roleReadiness, /\| Global Admin \|/);
  assert.match(roleReadiness, /## 6\. Role-By-Role Loaded API Routes/);
  assert.match(roleReadiness, /## 8\. Role-By-Role Forbidden Or Hidden Actions/);
});
