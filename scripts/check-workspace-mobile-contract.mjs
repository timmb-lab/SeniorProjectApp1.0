import { readFileSync } from "node:fs";

const workspaceCss = readFileSync("workspace.css", "utf8");
const workspaceJs = readFileSync("workspace.js", "utf8");

const failures = [];

function requirePattern(label, text, pattern) {
  if (!pattern.test(text)) failures.push(label);
}

function requireIncludes(label, text, value) {
  if (!text.includes(value)) failures.push(label);
}

function mediaBlock(maxWidth) {
  const marker = `@media (max-width: ${maxWidth}px)`;
  const start = workspaceCss.indexOf(marker);
  if (start === -1) return "";
  const open = workspaceCss.indexOf("{", start);
  if (open === -1) return "";
  let depth = 0;
  for (let index = open; index < workspaceCss.length; index += 1) {
    const char = workspaceCss[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return workspaceCss.slice(open + 1, index);
    }
  }
  return "";
}

const tablet = mediaBlock(900);
const phone = mediaBlock(620);

requireIncludes("tablet breakpoint exists", workspaceCss, "@media (max-width: 900px)");
requireIncludes("phone breakpoint exists", workspaceCss, "@media (max-width: 620px)");

requirePattern("workspace page suppresses document horizontal overflow", workspaceCss, /html,\s*body\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*hidden;/);
requirePattern("workspace shell caps page width", workspaceCss, /body\[data-page="workspace"\],[\s\S]*?\.workspace-shell,[\s\S]*?\.workspace-app\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;/);
requirePattern("tablet app layout collapses to one column", tablet, /\.workspace-content,[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet dashboard grids collapse to one column", tablet, /\.workspace-dashboard-grid,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet review layout collapses to one column", tablet, /\.workspace-review-layout,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet mentor assignment layout collapses to one column", tablet, /\.workspace-mentor-assignment-layout,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet operations layout collapses to one column", tablet, /\.workspace-operations-layout,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet worklist heads become labeled stacked rows", tablet, /\.workspace-worklist-head\s*\{[\s\S]*?display:\s*none;[\s\S]*?\.workspace-worklist-label\s*\{[\s\S]*?display:\s*block;/);
requirePattern("tablet review panel stops sticky positioning", tablet, /\.workspace-review-panel\s*\{[\s\S]*?position:\s*static;/);
requirePattern("half-width rail is fixed overlay drawer", tablet, /\.workspace-rail\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?width:\s*min\(360px,\s*calc\(100vw - 32px\)\);[\s\S]*?max-height:\s*calc\(100dvh - var\(--workspace-drawer-top\) - 1rem - env\(safe-area-inset-bottom\)\);[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/);
requirePattern("half-width drawer has sticky visible close control", tablet, /\.workspace-rail-drawer-header\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?display:\s*flex;/);
requirePattern("half-width header wraps user controls", tablet, /\.workspace-user\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?justify-content:\s*flex-start;/);
requirePattern("half-width email text cannot stretch layout", tablet, /\.workspace-user-text\s*\{[\s\S]*?flex:\s*1 1 12rem;[\s\S]*?max-width:\s*min\(100%,\s*24rem\);/);
requirePattern("half-width main content stays in viewport", tablet, /\.workspace-main\s*\{[\s\S]*?grid-column:\s*1 \/ -1;[\s\S]*?max-width:\s*100%;/);

requirePattern("phone controls stretch for tap targets", phone, /\.workspace-button,[\s\S]*?\.workspace-site-switcher select\s*\{[\s\S]*?width:\s*100%;/);
requirePattern("phone content keeps viewport width", phone, /\.workspace-content\s*\{[\s\S]*?width:\s*100%;[\s\S]*?padding-inline:\s*0\.75rem;/);
requirePattern("phone student rows stack", phone, /\.workspace-student-requirement-row\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("phone feedback rows stack", phone, /\.workspace-student-feedback-row\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);

const criticalMobileSurfaces = [
  ["student first next action", /data-student-command-line="true"[\s\S]*Do this now:/],
  ["student approval gate", /data-student-approval-gate-banner="true"/],
  ["student due-date next step", /data-student-next-step-due="true"/],
  ["mentor queue guide", /data-mentor-dashboard-queue-guide="true"/],
  ["mentor row details", /data-mentor-dashboard-row-detail="true"/],
  ["program teacher review queue", /workspace-review-queue/],
  ["review queue read-only state", /data-review-queue-read-only="true"/],
  ["site dashboard next actions", /renderSiteNextActions/],
  ["operations row next action", /data-operations-row-next-action="true"/],
  ["staff attention queues", /data-staff-attention-model="true"[\s\S]*data-staff-attention-queue/],
  ["users and access import preflight", /workspace-admin-import-preflight/],
];

for (const [label, pattern] of criticalMobileSurfaces) {
  requirePattern(label, workspaceJs, pattern);
}

requirePattern("workspace drawer close button is rendered", workspaceJs, /id="workspaceRailClose"[\s\S]*Close menu/);
requirePattern("workspace drawer close handler is bound", workspaceJs, /#workspaceRailClose"\)\?\.addEventListener\("click", closeWorkspaceMenu\)/);
requirePattern("workspace collapses nav by default at half-width desktop", workspaceJs, /window\.matchMedia\("\(max-width: 900px\)"\)\.matches/);
requirePattern("workspace syncs drawer below wrapped header", workspaceJs, /function syncWorkspaceDrawerOffset\(\)[\s\S]*--workspace-drawer-top/);

if (failures.length) {
  console.error("Workspace mobile contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace mobile contract passed: critical student, mentor, teacher, site, viewer, and admin surfaces have responsive layout guards.");
