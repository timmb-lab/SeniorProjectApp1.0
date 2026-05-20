import assert from "node:assert/strict";
import test from "node:test";

const rawBaseUrl = process.env.WORKSPACE_SMOKE_BASE_URL;
const baseUrl = rawBaseUrl ? new URL(rawBaseUrl) : null;

const forbiddenProductionCopy = [
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
  /\binternal QA\b/i,
  /\bwireframe\b/i,
];

test("workspace route signed-out smoke over local HTTP", { skip: !baseUrl }, async () => {
  const htmlResponse = await fetchFromBase("/workspace.html");
  assert.equal(htmlResponse.status, 200);
  assert.ok(htmlResponse.url.endsWith("/workspace") || htmlResponse.url.endsWith("/workspace.html"));
  assert.equal(htmlResponse.headers.get("content-type")?.includes("text/html"), true);

  const html = await htmlResponse.text();
  assert.match(html, /<title>Senior Project Workspace<\/title>/);
  assert.match(html, /workspaceMain/);
  assert.match(html, /workspace\.css/);
  assert.match(html, /workspace\.js/);
  assertSafeProductionCopy("workspace.html", html);

  const script = await fetchTextAsset("/workspace.js");
  assert.match(script, /<h1 id="signInTitle">Senior Project Workspace<\/h1>/);
  assert.match(script, /<h2>Sign in to continue<\/h2>/);
  assert.match(script, /Sign in to continue/);
  assert.match(script, /workspaceEmail/);
  assert.match(script, /workspacePassword/);
  assert.match(script, /Return to the guide/);
  assert.match(script, /\/api\/auth\/login/);
  assert.match(script, /\/api\/auth\/me/);
  assert.match(script, /\/api\/auth\/logout/);
  assert.match(script, /\/api\/submissions\/\$\{encodeURIComponent\(values\.submissionId\)\}\/evidence/);
  assert.match(script, /\/api\/submissions\/\$\{encodeURIComponent\(submissionId\)\}\/evidence\/upload/);
  assert.match(script, /storage is not configured for this environment/);
  assert.doesNotMatch(script, /Your file was received[^.]*storage is not configured/i);
  assertSafeProductionCopy("workspace.js", script);

  const styles = await fetchTextAsset("/workspace.css");
  assert.match(styles, /\.workspace-auth/);
  assert.match(styles, /\.workspace-app/);
  assertSafeProductionCopy("workspace.css", styles);

  const meResponse = await fetchFromBase("/api/auth/me", {
    headers: { accept: "application/json" },
  });
  assert.equal(meResponse.status, 401);
  assert.deepEqual(await meResponse.json(), { authenticated: false });

  const logoutResponse = await fetchFromBase("/api/auth/logout", {
    method: "POST",
    headers: { accept: "application/json" },
  });
  assert.equal(logoutResponse.status, 200);
  assert.deepEqual(await logoutResponse.json(), { ok: true });
});

async function fetchTextAsset(pathname) {
  const response = await fetchFromBase(pathname);
  assert.equal(response.status, 200, `${pathname} status`);
  return response.text();
}

function fetchFromBase(pathname, init = {}) {
  return fetch(new URL(pathname, baseUrl), init);
}

function assertSafeProductionCopy(label, text) {
  for (const pattern of forbiddenProductionCopy) {
    assert.doesNotMatch(text, pattern, `${label} contains ${pattern}`);
  }
}
