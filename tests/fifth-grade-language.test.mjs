import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("signed-in app copy meets the fifth-grade language budget", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-workspace-readability.mjs", "--check"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /average estimated grade 5\.[0-9]/);
  assert.match(result.stdout, /Long strings: 0\./);
  assert.match(result.stdout, /Fifth-grade language check passed/);
});

test("the language standard defines direct steps and a measurable limit", () => {
  const standard = readFileSync("docs/design/fifth-grade-language-standard.md", "utf8");
  assert.match(standard, /what happened, what to do next, and where to click/i);
  assert.match(standard, /22 words/);
  assert.match(standard, /5\.9 or lower/);
  assert.match(standard, /open, read, fix, add, send, save, ask, and check/i);
});
