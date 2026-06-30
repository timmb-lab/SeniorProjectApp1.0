import assert from "node:assert/strict";
import test from "node:test";

import { createSqliteD1, foundationMigrations } from "./helpers/d1-sqlite.mjs";

test("migration 0016 creates durable student roster profile storage", async () => {
  const db = createSqliteD1({
    migrations: [
      ...foundationMigrations(),
      "migrations/0016_student_roster_profiles.sql",
    ],
  });

  const columns = await db.prepare("PRAGMA table_info(student_roster_profiles)").all();
  const byName = Object.fromEntries(columns.results.map((column) => [column.name, column]));
  assert.deepEqual(Object.keys(byName), [
    "student_user_id",
    "cohort",
    "graduation_year",
    "created_at",
    "updated_at",
  ]);
  assert.equal(byName.student_user_id.pk, 1);
  assert.equal(byName.cohort.notnull, 1);
  assert.equal(byName.cohort.dflt_value, "''");
  assert.equal(byName.graduation_year.notnull, 1);
  assert.equal(byName.graduation_year.dflt_value, "''");

  const indexes = await db.prepare("PRAGMA index_list(student_roster_profiles)").all();
  assert.equal(
    indexes.results.some((index) => index.name === "idx_student_roster_profiles_graduation_year"),
    true,
  );

  await db.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES ('student-migration-0016', 'student.migration@senior-capstone.test', 'student.migration@senior-capstone.test', 'Student Migration', 'active')`,
  ).run();
  await db.prepare(
    "INSERT INTO student_roster_profiles (student_user_id) VALUES ('student-migration-0016')",
  ).run();
  let row = await db.prepare(
    "SELECT cohort, graduation_year FROM student_roster_profiles WHERE student_user_id = 'student-migration-0016'",
  ).first();
  assert.equal(row.cohort, "");
  assert.equal(row.graduation_year, "");

  await db.prepare(
    `INSERT INTO student_roster_profiles (student_user_id, cohort, graduation_year)
     VALUES ('student-migration-0016', 'Class of 2026', '2026')
     ON CONFLICT(student_user_id) DO UPDATE SET
       cohort = excluded.cohort,
       graduation_year = excluded.graduation_year`,
  ).run();
  row = await db.prepare(
    "SELECT cohort, graduation_year FROM student_roster_profiles WHERE student_user_id = 'student-migration-0016'",
  ).first();
  assert.equal(row.cohort, "Class of 2026");
  assert.equal(row.graduation_year, "2026");

  await db.prepare("DELETE FROM user_accounts WHERE id = 'student-migration-0016'").run();
  const orphanCount = await db.prepare("SELECT COUNT(*) AS count FROM student_roster_profiles").first();
  assert.equal(Number(orphanCount.count), 0);
});
