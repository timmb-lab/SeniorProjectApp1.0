import { readFileSync } from "node:fs";

const workspaceJs = readFileSync("workspace.js", "utf8");
const workspaceTest = readFileSync("tests/workspace-app.test.mjs", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

const failures = [];

function fail(message) {
  failures.push(message);
}

function assertIncludes(text, needle, message) {
  if (!text.includes(needle)) fail(message);
}

function assertMatches(text, pattern, message) {
  if (!pattern.test(text)) fail(message);
}

assertIncludes(
  packageJson.scripts["verify:review-queue-deeplinks"] || "",
  "scripts/verify-review-queue-deeplinks.mjs",
  "package.json must register verify:review-queue-deeplinks",
);

for (const name of [
  "workspaceUrlStateFromLocation",
  "reviewQueueFiltersFromSearchParams",
  "syncReviewQueueUrlState",
  "handleWorkspaceUrlPopState",
  "REVIEW_QUEUE_URL_FILTER_PARAMS",
]) {
  assertMatches(workspaceJs, new RegExp(`function ${name}\\b|const ${name}\\b`), `${name} must exist`);
}

for (const param of [
  "status",
  "reviewStatus",
  "submissionStatus",
  "programId",
  "search",
  "story",
  "risk",
  "evidenceStatus",
  "limit",
  "offset",
  "needsReview",
  "unassigned",
  "overdue",
]) {
  assertIncludes(workspaceJs, `"${param}"`, `review queue deep-link support should mention supported param ${param}`);
}

for (const unsupported of [
  "missing",
  "mentorUserId",
  "studentUserId",
  "studentId",
]) {
  assertMatches(
    workspaceJs,
    new RegExp(`REVIEW_QUEUE_URL_FILTER_PARAMS = \\[[\\s\\S]*"${unsupported}"[\\s\\S]*\\]`),
    `review queue sync should remove unsupported/stale param ${unsupported} from generated queue URLs`,
  );
}

assertMatches(
  workspaceJs,
  /canonicalReviewQueueValue\(rawStatus, REVIEW_QUEUE_STATUS_VALUES\)/,
  "review queue status deep links must be canonicalized",
);
assertMatches(
  workspaceJs,
  /filters\.evidenceStatus = canonicalReviewQueueValue\(params\.get\("evidenceStatus"\), REVIEW_QUEUE_EVIDENCE_STATUS_VALUES\)/,
  "review queue evidence-status deep links must be canonicalized",
);
assertMatches(
  workspaceJs,
  /if \(filters\.evidenceStatus\) params\.set\("evidenceStatus", filters\.evidenceStatus\)/,
  "review queue evidence-status filters must sync to shareable URLs",
);
assertMatches(
  workspaceJs,
  /filters\.limit = clampDirectoryNumber\(params\.get\("limit"\), 50, 1, 100\)/,
  "review queue limit must be clamped",
);
assertMatches(
  workspaceJs,
  /filters\.offset = clampDirectoryNumber\(params\.get\("offset"\), 0, 0, 100000\)/,
  "review queue offset must be clamped",
);
assertMatches(
  workspaceJs,
  /function hasReviewQueueFilterParams\(params\)[\s\S]*"programId"[\s\S]*"limit"[\s\S]*"offset"/,
  "review queue URL detection must recognize programId, limit, and offset as queue filter params",
);
assertMatches(
  workspaceJs,
  /window\.addEventListener\("popstate"/,
  "review queue URL state must listen for back/forward navigation",
);
assertMatches(
  workspaceJs,
  /window\.history\[method\]\?\.\(\{ section: "teacher" \}/,
  "review queue filter changes must sync through history state",
);
assertMatches(
  workspaceJs,
  /syncReviewQueueUrlState\(\{ clearFilters: true \}\)/,
  "review queue clear filters action must clear filter query params",
);

for (const expectedTest of [
  "workspace applies Review Queue URL filters safely and syncs filter URLs",
  "unknown=keep",
  "status=revision_requested",
  "risk=stale",
  "Clear filters",
]) {
  assertIncludes(workspaceTest, expectedTest, `workspace tests must cover ${expectedTest}`);
}

if (failures.length) {
  console.error("Review Queue deep-link verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Review Queue deep-link verification passed.");
console.log("Checked Review Queue URL parsing, canonicalization, history sync, clear filters, and regression tests.");
