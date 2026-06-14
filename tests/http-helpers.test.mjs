import assert from "node:assert/strict";
import test from "node:test";

import { badRequest, json, readJson, requireDelete, requirePost } from "../functions/_lib/http.ts";

test("json helper applies no-store and browser hardening headers", async () => {
  const body = JSON.stringify({ ok: true });
  const response = json({ ok: true }, { headers: { "x-existing": "kept" } });

  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("content-length"), String(new TextEncoder().encode(body).byteLength));
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("x-existing"), "kept");
  assert.deepEqual(await response.json(), { ok: true });
});

test("json helper reports UTF-8 byte length instead of character count", async () => {
  const payload = { value: "\u00e9" };
  const body = JSON.stringify(payload);
  const response = json(payload);

  assert.notEqual(new TextEncoder().encode(body).byteLength, body.length);
  assert.equal(response.headers.get("content-length"), String(new TextEncoder().encode(body).byteLength));
  assert.deepEqual(await response.json(), payload);
});

test("bad request responses inherit JSON hardening headers", async () => {
  const response = badRequest("invalid_json");
  const body = JSON.stringify({ error: "invalid_json" });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("content-length"), String(new TextEncoder().encode(body).byteLength));
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(await response.json(), { error: "invalid_json" });
});

test("readJson accepts JSON content type case-insensitively", async () => {
  const request = new Request("https://example.test/api/example", {
    method: "POST",
    headers: { "content-type": "Application/JSON; charset=utf-8" },
    body: JSON.stringify({ ok: true }),
  });

  assert.deepEqual(await readJson(request), { ok: true });
});

test("readJson accepts structured JSON media types", async () => {
  const request = new Request("https://example.test/api/example", {
    method: "POST",
    headers: { "content-type": "application/merge-patch+json" },
    body: JSON.stringify({ patch: true }),
  });

  assert.deepEqual(await readJson(request), { patch: true });
});

test("readJson rejects misleading non-JSON content types", async () => {
  for (const contentType of [
    "text/plain; note=application/json",
    "application/json-malformed",
    "application/json+xml",
  ]) {
    const request = new Request("https://example.test/api/example", {
      method: "POST",
      headers: { "content-type": contentType },
      body: JSON.stringify({ ok: true }),
    });

    await assert.rejects(() => readJson(request), /Expected application\/json request body/, contentType);
  }
});

test("readJson enforces the body limit by UTF-8 bytes, not character count", async () => {
  const body = JSON.stringify({ value: "\u00e9".repeat(9 * 1024) });
  assert.ok(body.length < 16 * 1024);
  assert.ok(new TextEncoder().encode(body).byteLength > 16 * 1024);

  const request = new Request("https://example.test/api/example", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  await assert.rejects(() => readJson(request), /Request body is too large/);
});

test("readJson rejects declared oversized bodies before parsing", async () => {
  const request = new Request("https://example.test/api/example", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(16 * 1024 + 1),
    },
    body: JSON.stringify({ ok: true }),
  });

  await assert.rejects(() => readJson(request), /Request body is too large/);
});

test("requirePost blocks cross-origin browser posts while allowing same-origin posts", async () => {
  const blocked = requirePost(new Request("https://example.test/api/auth/login", {
    method: "POST",
    headers: { origin: "https://attacker.test" },
  }));
  assert.equal(blocked?.status, 403);
  assert.deepEqual(await blocked?.json(), { error: "cross_origin_post_denied" });

  const allowed = requirePost(new Request("https://example.test/api/auth/login", {
    method: "POST",
    headers: { origin: "https://example.test" },
  }));
  assert.equal(allowed, null);
});

test("requireDelete blocks cross-origin browser deletes while allowing same-origin deletes", async () => {
  const blocked = requireDelete(new Request("https://example.test/api/admin/users/user-a", {
    method: "DELETE",
    headers: { origin: "https://attacker.test" },
  }));
  assert.equal(blocked?.status, 403);
  assert.deepEqual(await blocked?.json(), { error: "cross_origin_post_denied" });

  const allowed = requireDelete(new Request("https://example.test/api/admin/users/user-a", {
    method: "DELETE",
    headers: { origin: "https://example.test" },
  }));
  assert.equal(allowed, null);
});
