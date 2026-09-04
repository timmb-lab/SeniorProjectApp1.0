import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("students can schedule only their own practice presentation", async () => {
  const route = await read("functions/api/presentation-slots.ts");
  assert.match(route, /studentSelfSchedule = await hasRole\(env, user\.id, "student"\)/);
  assert.match(route, /studentId !== user\.id[\s\S]*workflowError\("forbidden", 403\)/);
  assert.match(route, /canAccessStudent\(env, user, studentId\)/);
});

test("practice feedback is role-scoped, student-scoped, audited, and excludes students from authorship", async () => {
  const route = await read("functions/api/presentation-slots/[id]/feedback.ts");
  assert.match(route, /"program_teacher", "mentor"/);
  assert.doesNotMatch(route, /"student"/);
  assert.match(route, /canAccessStudent\(env, user, slot\.student_user_id\)/);
  assert.match(route, /presentation_practice_feedback_denied/);
  assert.match(route, /presentation_practice_feedback_saved/);
  assert.match(route, /score >= 1 && score <= 4/);
});

test("practice feedback storage stays attached to the slot and author", async () => {
  const migration = await read("migrations/0034_presentation_practice_feedback.sql");
  assert.match(migration, /presentation_slot_id TEXT NOT NULL REFERENCES presentation_slots\(id\) ON DELETE CASCADE/);
  assert.match(migration, /author_user_id TEXT NOT NULL REFERENCES user_accounts\(id\) ON DELETE CASCADE/);
  assert.match(migration, /CHECK \(clarity_score BETWEEN 1 AND 4\)/);
  assert.match(migration, /UNIQUE \(presentation_slot_id, author_user_id\)/);
});

test("presentation UI leads students to a date and labels rubric privacy", async () => {
  const actions = await read("workspace/features/actions.js");
  assert.match(actions, /Schedule a practice presentation/);
  assert.match(actions, /type="datetime-local"/);
  assert.match(actions, /Visible only to this project’s students and authorized staff/);
  assert.match(actions, /Clarity[\s\S]*Evidence[\s\S]*Organization[\s\S]*Readiness/);
});
