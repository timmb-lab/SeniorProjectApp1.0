import { readFileSync } from "node:fs";

const files = {
  permissions: "functions/_lib/permissions.ts",
  siteAwareTests: "tests/site-aware-permissions.test.mjs",
  workspace: "workspace.js",
  roleMatrix: "docs/security/role-access-matrix.md",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]),
);
const failures = [];

function fail(message) {
  failures.push(message);
}

function assertMatches(key, pattern, message) {
  if (!pattern.test(source[key])) fail(`${files[key]}: ${message}`);
}

function assertIncludes(key, needle, message) {
  if (!source[key].includes(needle)) fail(`${files[key]}: ${message}`);
}

assertMatches(
  "permissions",
  /export async function canManageSecurity\([\s\S]*return isPlatformAdmin\(env, viewer\.id\);/,
  "security management must remain platform/global-admin only",
);
assertMatches(
  "permissions",
  /export async function canManageUsers\([\s\S]*return isGlobalAdmin\(env, viewer\.id\);/,
  "global user management must remain global-admin only",
);
assertMatches(
  "permissions",
  /export async function canManageMentorAssignments\([\s\S]*\["site_admin", "administration", "program_teacher"\]/,
  "Program Teacher may manage mentor coverage through the scoped mentor-assignment path",
);
assertMatches(
  "permissions",
  /mentor_assignments ma[\s\S]*ma\.mentor_user_id = \?[\s\S]*ma\.student_user_id = \?[\s\S]*ma\.active = 1/,
  "mentor student access must stay assignment-backed",
);
assertMatches(
  "permissions",
  /teacher_role\.role_id = 'program_teacher'[\s\S]*teacher_role\.scope_type = 'program'[\s\S]*teacher_role\.scope_type = 'cohort'/,
  "Program Teacher student access must stay program/cohort scoped",
);

for (const [pattern, message] of [
  [/program teacher remains program scoped and only manages mentor coverage/, "Program Teacher boundary integration test must exist"],
  [/canManageUsers\(env, users\.teacherIt\), false/, "Program Teacher must not manage global users"],
  [/canManageSecurity\(env, users\.teacherIt\), false/, "Program Teacher must not manage security"],
  [/canManageMentorAssignments\(env, users\.teacherIt, "site-a1"\), true/, "Program Teacher mentor coverage permission must remain explicit"],
  [/canMutateReviewDecision\(env, users\.teacherIt, "submission-b1"\), false/, "Program Teacher must not review outside scoped students"],
  [/mentor can access assigned students only and never mutates reviews or full directories/, "Mentor boundary integration test must exist"],
  [/canViewStudentDirectory\(env, users\.mentorA1, "site-a1"\), false/, "Mentor must not gain full directory access"],
  [/canMutateReviewDecision\(env, users\.mentorA1, "submission-a1"\), false/, "Mentor must not mutate review decisions"],
  [/canManageUsers\(env, users\.mentorA1\), false/, "Mentor must not manage users"],
  [/canManageSecurity\(env, users\.mentorA1\), false/, "Mentor must not manage security"],
]) {
  assertMatches("siteAwareTests", pattern, message);
}

assertIncludes(
  "workspace",
  "You do not create or remove Global Admin or Site Admin access.",
  "Program Teacher workspace copy must preserve the narrow access boundary",
);
assertIncludes(
  "workspace",
  "Assigned students only. Can view assigned student progress and feedback workflows.",
  "Mentor account preview must preserve assigned-student-only wording",
);

for (const [pattern, message] of [
  [/Student \| Own student record only\./, "role matrix must document student self-only access"],
  [/Mentor \| Active mentor-assigned students only\./, "role matrix must document mentor assignment-backed access"],
  [/Viewer \| Viewer-assigned students only\./, "role matrix must document viewer assigned-student-only access"],
  [/Program Teacher \| Students inside assigned program or cohort scopes only\./, "role matrix must document Program Teacher program/cohort scope"],
  [/Site Admin \| Students and operations inside assigned site only\./, "role matrix must document Site Admin site scope"],
  [/Global Admin \/ Platform Admin \/ legacy Admin \| All active tenants, sites, and students exposed by the current APIs\./, "role matrix must document global admin scope"],
  [/Student accounts cannot start View as Student/, "role matrix must document student View as Student denial"],
  [/Unauthorized `viewAsStudentId` requests are removed from URL state/, "role matrix must document unauthorized View as Student deep-link handling"],
  [/Report CSV exports are generated from data already loaded for the authorized viewer/, "role matrix must document scoped report export boundary"],
  [/omit internal IDs, storage identifiers, password material, admin notes, and raw JSON/, "role matrix must document CSV redaction boundary"],
  [/npm run verify:permission-matrix/, "role matrix must list permission matrix proof command"],
  [/npm run verify:mutation-origin/, "role matrix must list mutation origin proof command"],
  [/node --test tests\\workspace-app\.test\.mjs/, "role matrix must list workspace role proof tests"],
]) {
  assertMatches("roleMatrix", pattern, message);
}

if (failures.length) {
  console.error("Permission role matrix verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Permission role matrix verification passed: Program Teacher, Mentor, Viewer, and admin boundaries stayed scoped.");
