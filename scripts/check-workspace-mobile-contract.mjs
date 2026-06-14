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

requirePattern("tablet app layout collapses to one column", tablet, /\.workspace-content,[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet dashboard grids collapse to one column", tablet, /\.workspace-dashboard-grid,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet review layout collapses to one column", tablet, /\.workspace-review-layout,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet mentor assignment layout collapses to one column", tablet, /\.workspace-mentor-assignment-layout,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet operations layout collapses to one column", tablet, /\.workspace-operations-layout,[\s\S]*?\.workspace-student-card\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
requirePattern("tablet worklist heads become labeled stacked rows", tablet, /\.workspace-worklist-head\s*\{[\s\S]*?display:\s*none;[\s\S]*?\.workspace-worklist-label\s*\{[\s\S]*?display:\s*block;/);
requirePattern("tablet review panel stops sticky positioning", tablet, /\.workspace-review-panel\s*\{[\s\S]*?position:\s*static;/);
requirePattern("mobile rail fits inside viewport", tablet, /\.workspace-rail\s*\{[\s\S]*?width:\s*min\(360px,\s*calc\(100vw - 2rem\)\);[\s\S]*?overflow:\s*auto;/);

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
  ["viewer monitoring overview", /data-viewer-monitoring-overview="true"/],
  ["users and access import preflight", /workspace-admin-import-preflight/],
];

for (const [label, pattern] of criticalMobileSurfaces) {
  requirePattern(label, workspaceJs, pattern);
}

if (failures.length) {
  console.error("Workspace mobile contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Workspace mobile contract passed: critical student, mentor, teacher, site, viewer, and admin surfaces have responsive layout guards.");
