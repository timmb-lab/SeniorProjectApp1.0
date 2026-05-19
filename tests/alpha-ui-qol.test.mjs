import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const alphaHtml = await readFile("alpha.html", "utf8");
const alphaJs = await readFile("alpha.js", "utf8");
const alphaCss = await readFile("alpha.css", "utf8");

test("alpha reviewer UI exposes copyable summary, checklist, next-persona cue, and reset guard", () => {
  assert.match(alphaHtml, /id="copyAlphaSummary"/);
  assert.match(alphaJs, /renderReviewerChecklist/);
  assert.match(alphaJs, /copyCurrentAlphaSummary/);
  assert.match(alphaJs, /alphaSummaryText/);
  assert.match(alphaJs, /confirmAlphaReset/);
  assert.match(alphaJs, /is-next-persona/);
  assert.match(alphaJs, /alpha-persona-next/);
  assert.match(alphaJs, /File-byte upload remains explicitly pending/);
  assert.match(alphaCss, /alpha-check-list/);
  assert.match(alphaCss, /alpha-check\.check-pass/);
  assert.match(alphaCss, /alpha-persona-next/);
});
