import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production cutover avoids duplicate upload-heavy Drive proof aliases", async () => {
  const source = await readFile("scripts/check-production-cutover.mjs", "utf8");
  const docs = await readFile("docs/production-predeploy-checklist.md", "utf8");

  assert.match(source, /\["check:workspace:hosted-evidence"\]/);
  assert.doesNotMatch(source, /\["check:drive:live"\]/);
  assert.match(
    docs,
    /Production cutover aggregate runs the hosted workspace evidence gate once/i,
  );
});
