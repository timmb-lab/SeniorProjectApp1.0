import fs from "node:fs";
import { readWorkspaceCssSource } from "./lib/workspace-sources.mjs";

const browserProof = fs.readFileSync("scripts/prove-workspace-ui-polish.mjs", "utf8");
const workspaceCss = await readWorkspaceCssSource();

const requiredRoles = ["student", "program_teacher", "mentor", "viewer", "site_admin", "misc_admin", "admin"];
const missingRoles = requiredRoles.filter((role) => !new RegExp(`authRole:\\s*["']${role}["']`).test(browserProof));
if (missingRoles.length) {
  throw new Error(`Browser usability proof is missing roles: ${missingRoles.join(", ")}`);
}

const requiredViewports = [
  [390, "phone"],
  [820, "tablet or half-screen"],
  [1366, "Chromebook"],
  [1440, "desktop"],
];
for (const [width, label] of requiredViewports) {
  if (!new RegExp(`width:\\s*${width}\\b`).test(browserProof)) {
    throw new Error(`Browser usability proof is missing the ${label} viewport (${width}px).`);
  }
}

const requiredProofMarkers = [
  /const DARK_THEME_ROLE_PLAN/,
  /theme:\s*["']dark["']/,
  /applyProofTheme/,
  /auditKeyboardFlow/,
  /keyboardFocusMoves/,
  /keyboardFocusIsShown/,
  /keyboardReverseMoves/,
  /expectedThemeApplied/,
  /expectedSchoolThemeApplied/,
  /noHorizontalOverflow/,
];
for (const marker of requiredProofMarkers) {
  if (!marker.test(browserProof)) throw new Error(`Browser usability proof is missing ${marker}.`);
}

for (const schoolTheme of ["east-tech", "desert-valley", "canyon-ridge", "north-valley"]) {
  const schoolThemePattern = new RegExp(`expectedSchoolTheme:\\s*["']${schoolTheme}["']`);
  if (!schoolThemePattern.test(browserProof)) {
    throw new Error(`Browser usability proof is missing the ${schoolTheme} school theme.`);
  }
}

for (const role of requiredRoles) {
  const darkRolePattern = new RegExp(`authRole:\\s*["']${role}["'][\\s\\S]{0,360}?theme:\\s*["']dark["']`);
  if (!darkRolePattern.test(browserProof)) {
    throw new Error(`Browser usability proof is missing a dark-view check for ${role}.`);
  }
}

if (!/:where\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible/.test(workspaceCss)) {
  throw new Error("Workspace controls do not share one clear keyboard focus style.");
}

console.log("Role usability coverage passed.");
console.log("Covered every role, light and dark views, keyboard focus, all four school themes, and phone/tablet/Chromebook/desktop widths.");
