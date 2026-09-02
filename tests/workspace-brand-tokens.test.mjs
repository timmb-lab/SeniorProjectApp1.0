import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("workspace brand, view, and type tokens stay valid", () => {
  const output = execFileSync(process.execPath, ["scripts/verify-workspace-brand-tokens.mjs"], { encoding: "utf8" });
  assert.match(output, /brand tokens verified/i);
});
