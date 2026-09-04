import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readWorkspaceCssSource, workspaceCssFiles } from "./lib/workspace-sources.mjs";

const css = await readWorkspaceCssSource();
const rootCss = await readFile("workspace.css", "utf8");

const brandFile = "workspace/styles/05-brand-foundations.css";
const visualPolishFile = "workspace/styles/06-visual-polish.css";
assert.ok(workspaceCssFiles.indexOf(brandFile) < workspaceCssFiles.indexOf(visualPolishFile), "The brand foundation must load before the final visual polish layer.");
assert.equal(workspaceCssFiles.at(-1), visualPolishFile, "The visual polish layer must load last.");
assert.match(rootCss, /05-brand-foundations\.css/, "The workspace stylesheet must load the brand layer.");
assert.match(rootCss.trimEnd(), /06-visual-polish\.css"\);$/, "The actual browser stylesheet must load the visual polish layer last.");

for (const token of [
  "--font-ui",
  "--font-display",
  "--school-display-font",
  "--school-primary",
  "--school-primary-strong",
  "--school-accent",
  "--school-on-primary",
  "--type-page-title",
  "--type-body",
]) {
  assert.match(css, new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`), `Missing ${token}.`);
}

for (const theme of ["light", "dark"]) {
  assert.match(css, new RegExp(`:root\\[data-theme=["']${theme}["']\\]`), `Missing ${theme} view.`);
}

for (const school of ["east-tech", "desert-valley", "canyon-ridge", "north-valley"]) {
  assert.match(css, new RegExp(`:root\\[data-school-theme=["']${school}["']\\]`), `Missing ${school} theme.`);
}

assert.match(css, /--school-primary:\s*#1d50a2/i, "East Tech must use its official Titan blue.");
assert.match(css, /--school-accent:\s*#c0c1c3/i, "East Tech must use silver.");
assert.match(css, /--school-display-font:\s*"Barlow Semi Condensed"/i, "East Tech must use its official display family.");
assert.match(css, /font-family:\s*var\(--font-ui\)/, "Workspace controls must use the shared UI font.");

function luminance(hex) {
  const values = hex.slice(1).match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
  const linear = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrast(first, second) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

const primaryColors = ["#2463a6", "#1d50a2", "#166b80", "#875b14", "#176d5d"];
for (const color of primaryColors) {
  assert.ok(contrast(color, "#ffffff") >= 4.5, `${color} must pass normal-text contrast with white.`);
}
assert.ok(contrast("#172033", "#ffffff") >= 7, "Light-view text contrast must be strong.");
assert.ok(contrast("#f3f7fc", "#0f1b2e") >= 7, "Dark-view text contrast must be strong.");

for (const [foreground, background, label] of [
  ["#182033", "#ffffff", "final light primary text"],
  ["#526176", "#ffffff", "final light secondary text"],
  ["#f7f9fc", "#111f33", "final dark primary text"],
  ["#c0cad8", "#111f33", "final dark secondary text"],
]) {
  assert.ok(contrast(foreground, background) >= 4.5, `${label} must pass normal-text contrast.`);
}

assert.match(css, /--shell-canvas:\s*#eef1f7/i, "Light view must separate its tinted canvas from white panes.");
assert.match(css, /--shell-pane:\s*#ffffff/i, "Light view must keep content panes white.");
assert.match(css, /--shell-canvas:\s*#07111f/i, "Dark view must use a distinct deep canvas.");
assert.match(css, /--shell-pane:\s*#111f33/i, "Dark view must raise content panes above the canvas.");
assert.match(css, /--shell-pane-muted:\s*#192a41/i, "Dark view must separate nested panes from parent panes.");
assert.match(css, /--font-size-body:\s*1rem/i, "Workspace body text must remain at a readable base size.");
assert.match(css, /--font-size-caption:\s*0\.82rem/i, "Workspace captions must not collapse into tiny labels.");
assert.match(css, /\.workspace-v2-stage\s*\{[\s\S]*?gap:\s*clamp\(1\.25rem,[\s\S]*?padding:\s*clamp\(28px/i, "The main canvas must preserve obvious space between panes.");

console.log("Workspace brand tokens verified: four school palettes, two views, consistent type, and AA contrast.");
