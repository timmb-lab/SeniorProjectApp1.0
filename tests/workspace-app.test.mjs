import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const workspaceHtml = await readFile("workspace.html", "utf8");
const workspaceJs = await readFile("workspace.js", "utf8");
const workspaceCss = await readFile("workspace.css", "utf8");
const productionSurfaceCheck = await readFile("scripts/check-production-surfaces.mjs", "utf8");

test("workspace route is a real authenticated app surface", () => {
  assert.match(workspaceHtml, /Senior Project Workspace/);
  assert.match(workspaceHtml, /workspace\.js/);
  assert.match(workspaceHtml, /workspace\.css/);
  assert.match(workspaceJs, /\/api\/auth\/me/);
  assert.match(workspaceJs, /\/api\/auth\/login/);
  assert.match(workspaceJs, /\/api\/auth\/logout/);
  assert.match(workspaceJs, /\/api\/student\/dashboard/);
  assert.match(workspaceJs, /\/api\/teacher\/review-queue/);
  assert.match(workspaceJs, /\/api\/mentor\/assigned/);
  assert.match(workspaceJs, /\/api\/reports\/readiness/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(values\.submissionId\)\}\/evidence/);
  assert.match(workspaceJs, /\/api\/submissions\/\$\{encodeURIComponent\(submissionId\)\}\/evidence\/upload/);
  assert.match(workspaceJs, /Sign in to continue/);
  assert.match(workspaceJs, /Your file was received/);
  assert.match(workspaceJs, /storage is not configured for this environment/);
  assert.doesNotMatch(workspaceJs, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotThrow(() => new Function(workspaceJs));
});

test("workspace production text avoids internal build language", () => {
  const combined = `${workspaceHtml}\n${workspaceJs}\n${workspaceCss}`;
  for (const pattern of [
    /\bCodex\b/i,
    /\bprompt\b/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
    /\bplaceholder\b/i,
    /\blorem\b/i,
    /\bmock(?:ed)?\b/i,
    /\bfake\b/i,
    /\bfixture\b/i,
    /\bdev only\b/i,
    /\bdevelopment only\b/i,
    /\bdebug\b/i,
    /\bscaffold\b/i,
    /\bprototype copy\b/i,
    /\bsample student\b/i,
    /\bsample upload\b/i,
    /\bpretend\b/i,
    /\bdummy\b/i,
    /\bnot implemented\b/i,
    /\bunder construction\b/i,
    /\bwireframe\b/i,
  ]) {
    assert.doesNotMatch(combined, pattern);
  }
});

test("production surface checker includes the authenticated workspace", () => {
  assert.match(productionSurfaceCheck, /"workspace\.html"/);
  assert.match(productionSurfaceCheck, /"workspace\.js"/);
});
