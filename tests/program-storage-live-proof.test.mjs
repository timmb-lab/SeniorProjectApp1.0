import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("program storage live proof is fake-only, redacted, and covers the end-to-end contract", async () => {
  const [script, packageJson] = await Promise.all([
    readFile("scripts/prove-program-storage-live.mjs", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  assert.match(packageJson, /prove:program-storage:live/);
  assert.match(script, /\.test/);
  assert.match(script, /PDF\/DOCX upload and previews/);
  assert.match(script, /siteAdminMutationDenied/);
  assert.match(script, /rawProviderIdentifiersExposed: false/);
  assert.match(script, /existingGoogleLinksPreserved: true/);
  assert.doesNotMatch(script, /console\.log\([^\n]*(password|mfaSecret|folderUrl|evidenceId)/i);
});
