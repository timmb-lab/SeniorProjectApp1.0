import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { buildFrameworkSeedPlan, planToSql } from "../scripts/framework-seed.mjs";

const framework = JSON.parse(await readFile("data/capstone-framework.json", "utf8"));

function normalizeSql(text) {
  return String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
}

test("framework seed migration matches generated SQL output", async () => {
  const seed = buildFrameworkSeedPlan(framework);
  const expected = normalizeSql(planToSql(seed));
  const migration = normalizeSql(await readFile("migrations/0003_framework_seed_data.sql", "utf8"));

  assert.equal(migration, expected);
});

