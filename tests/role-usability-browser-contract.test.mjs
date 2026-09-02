import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readWorkspaceCssSource } from "../scripts/lib/workspace-sources.mjs";

const browserProof = readFileSync("scripts/prove-workspace-ui-polish.mjs", "utf8");
const workspaceCss = await readWorkspaceCssSource();

test("browser proof covers every role in both themes and across common school device widths", () => {
  for (const role of ["student", "program_teacher", "mentor", "viewer", "site_admin", "misc_admin", "admin"]) {
    assert.match(browserProof, new RegExp(`authRole:\\s*["']${role}["']`));
    assert.match(browserProof, new RegExp(`authRole:\\s*["']${role}["'][\\s\\S]{0,360}?theme:\\s*["']dark["']`));
  }
  for (const width of [390, 820, 1366, 1440]) {
    assert.match(browserProof, new RegExp(`width:\\s*${width}\\b`));
  }
  for (const schoolTheme of ["east-tech", "desert-valley", "canyon-ridge", "north-valley"]) {
    assert.match(browserProof, new RegExp(`expectedSchoolTheme:\\s*["']${schoolTheme}["']`));
  }
});

test("browser proof drives the keyboard and requires visible, reversible focus", () => {
  for (const marker of [
    "auditKeyboardFlow",
    "Input.dispatchKeyEvent",
    "keyboardFocusMoves",
    "keyboardFocusIsShown",
    "keyboardReverseMoves",
    "expectedThemeApplied",
    "noHorizontalOverflow",
  ]) {
    assert.match(browserProof, new RegExp(marker));
  }
  assert.match(workspaceCss, /:where\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible/);
});
