import { readFileSync } from "node:fs";

const files = {
  workspaceHtml: "workspace.html",
  workspaceJs: "workspace.js",
  workspaceCss: "workspace.css",
};
const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

function assertMatches(fileKey, pattern, message) {
  if (!pattern.test(source[fileKey])) fail(`${files[fileKey]}: ${message}`);
}

function assertIncludes(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) fail(`${files[fileKey]}: ${message}`);
}

if (!String(packageJson.scripts?.["check:workspace-accessibility"] || "").includes("scripts/check-workspace-accessibility-contract.mjs")) {
  fail("package.json: check:workspace-accessibility must point at scripts/check-workspace-accessibility-contract.mjs");
}

assertMatches("workspaceHtml", /<main[^>]+id="workspaceMain"[^>]*>/, "workspace must keep a main landmark");
assertMatches("workspaceJs", /aria-label="\$\{workspaceNavCollapsed \? "Open menu" : "Close menu"\}"/, "nav collapse button needs dynamic aria-label");
assertMatches("workspaceJs", /aria-pressed="\$\{workspaceNavCollapsed \? "true" : "false"\}"/, "nav collapse button needs aria-pressed state");
assertMatches("workspaceJs", /handleWorkspaceKeydown[\s\S]*Escape[\s\S]*workspaceNavCollapsed = true/, "Escape key should close the workspace rail");
assertMatches("workspaceJs", /data-workspace-disclosure-action="toggle"[\s\S]*aria-expanded="\$\{open \? "true" : "false"\}"/, "disclosure toggles must expose aria-expanded");
assertIncludes("workspaceJs", "aria-live=\"polite\"", "status and preview regions should announce changes politely");
assertIncludes("workspaceJs", "data-active-role-badge=\"true\"", "active role badge must keep visible role text near user identity");
assertMatches("workspaceJs", /aria-label="Active role:/, "active role badge must expose active role text to assistive tech");
assertMatches("workspaceJs", /aria-labelledby="siteStudentDetailTitle"/, "student detail drawer must be labelled");
assertMatches("workspaceJs", /tabindex="-1"/, "student detail drawer must be focusable after open");
assertMatches("workspaceJs", /panel\.focus\?\.\(\{ preventScroll: true \}\)/, "student detail drawer should receive focus");
assertMatches("workspaceJs", /data-review-decision-form="true"[\s\S]*name="decision"[\s\S]*required/, "review decision form must require a decision");
assertMatches("workspaceJs", /name="feedback"[\s\S]*required/, "review decision form must require feedback");
assertMatches("workspaceJs", /data-upload-progress[\s\S]*aria-valuenow/, "upload progress must expose progress semantics");
assertMatches("workspaceJs", /aria-label="\$\{escapeHtml\(disabled \? "Choose a site before searching students" : "Search the current student view"\)\}"/, "student search needs a clear label");
assertMatches("workspaceJs", /data-active-filters="true"/, "filter summaries must be visible to users");
assertMatches("workspaceCss", /@media \(max-width: 900px\)[\s\S]*\.workspace-app/, "mobile workspace layout breakpoint must exist");
assertMatches("workspaceCss", /\.workspace-button:focus-visible|:focus-visible/, "visible focus styles must exist");

if (failures.length) {
  console.error("Workspace accessibility contract check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace accessibility contract passed: nav, disclosures, filters, review forms, upload progress, and mobile layout expose stable accessibility markers.");
