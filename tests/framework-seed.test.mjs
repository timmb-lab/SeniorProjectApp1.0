import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { buildFrameworkSeedPlan, planToSql } from "../scripts/framework-seed.mjs";

const framework = JSON.parse(await readFile("data/capstone-framework.json", "utf8"));

test("framework seed plan maps requirements, deadlines, review gates, and checks", () => {
  const seed = buildFrameworkSeedPlan(framework);

  assert.equal(seed.cohortYear, 2026);
  assert.equal(seed.counts.requirements, 16);
  assert.equal(seed.counts.deadlines, 24);
  assert.equal(seed.counts.reviewGates, 4);
  assert.equal(seed.counts.qualityChecks, 20);

  const reqIds = seed.plan.requirements.map((req) => req.id);
  assert.equal(new Set(reqIds).size, reqIds.length);
  for (const id of reqIds) {
    assert.match(id, /^req-/);
  }

  for (const deadline of seed.plan.deadlines) {
    assert.match(deadline.dueAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.ok(Number.isFinite(Date.parse(deadline.dueAt)));
    assert.match(deadline.id, /^deadline-/);
    assert.ok(deadline.requirementId);
  }
});

test("framework seed SQL is idempotent and includes all core inserts", () => {
  const seed = buildFrameworkSeedPlan(framework);
  const sql = planToSql(seed);

  assert.match(sql, /INSERT INTO requirements/);
  assert.match(sql, /INSERT INTO deadlines/);
  assert.match(sql, /INSERT INTO quality_checks/);
  assert.match(sql, /ON CONFLICT/);

  // Guardrail: never embed local filesystem-only sourcePdf paths into SQL output.
  assert.doesNotMatch(sql, /C:\\\\Users\\\\|C:\\/);
});

