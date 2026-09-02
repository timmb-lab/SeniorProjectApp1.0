import assert from "node:assert/strict";
import test from "node:test";

import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("every active school receives checked, fifth-grade-level starter guidance templates", async () => {
  const db = createSqliteD1({ migrations: foundationMigrations() });
  const sites = await db.prepare("SELECT id FROM sites WHERE status = 'active' ORDER BY id").all();
  assert.ok(sites.results.length > 0);
  for (const site of sites.results) {
    const templates = await db.prepare(
      `SELECT phase, title, description, template_url, link_check_status
       FROM project_templates
       WHERE site_id = ? AND active = 1 AND id LIKE 'template-starter-%'
       ORDER BY id`,
    ).bind(site.id).all();
    assert.equal(templates.results.length, 7, `${site.id} should receive seven starter templates`);
    assert.ok(templates.results.every((row) => row.link_check_status === "staff_confirmed"));
    assert.ok(templates.results.every((row) => /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+\/edit$/.test(row.template_url)));
  }
});
