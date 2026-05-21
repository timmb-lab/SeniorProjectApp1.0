import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const dashboardProofScript = await readFile("scripts/check-hosted-workspace-permissions.mjs", "utf8");
const packageJson = await readFile("package.json", "utf8");
const runNpmScript = await readFile("scripts/run-npm-script.ps1", "utf8");

test("hosted workspace dashboard proof stays fake-account-only and redacted", () => {
  assert.match(dashboardProofScript, /Hosted workspace permission proof refused a non-\.test/);
  assert.match(dashboardProofScript, /String\(account\.email\)\.endsWith\("\.test"\)/);
  assert.match(dashboardProofScript, /passwords are not printed|password/i);
  assert.match(dashboardProofScript, /assertNoStorageLeak/);
  assert.match(dashboardProofScript, /drive_file_id\|driveFileId\|drive_parent_folder_id\|driveParentFolderId\|access_token\|refresh_token/);
  assert.doesNotMatch(dashboardProofScript, /console\.log\(.*password/i);
  assert.doesNotMatch(dashboardProofScript, /console\.log\(.*cookie/i);
});

test("hosted workspace dashboard proof covers presentation and archive dashboard surfaces", () => {
  assert.match(dashboardProofScript, /data-presentation-state/);
  assert.match(dashboardProofScript, /data-archive-check-status/);
  assert.match(dashboardProofScript, /data-archive-download="manifest"/);
  assert.match(dashboardProofScript, /data-archive-drive-package/);
  assert.match(dashboardProofScript, /\/api\/student\/archive\/readiness/);
  assert.match(dashboardProofScript, /\/api\/presentation-slots/);
  assert.match(dashboardProofScript, /student_archive_readiness/);
  assert.match(dashboardProofScript, /student_presentation_scope/);
  assert.match(dashboardProofScript, /teacher_presentation_dashboard/);
  assert.match(dashboardProofScript, /mentor_presentation_dashboard/);
  assert.match(dashboardProofScript, /misc_admin_presentation_denial/);
  assert.match(dashboardProofScript, /admin_archive_dashboard/);
  assert.match(dashboardProofScript, /student_archive_manifest_download/);
});

test("hosted dashboard proof has an explicit npm alias outside default local check", () => {
  assert.match(packageJson, /"check:workspace:hosted-dashboard"/);
  assert.match(runNpmScript, /"check:workspace:hosted-dashboard"/);
  assert.match(runNpmScript, /check-hosted-workspace-permissions\.mjs/);
});
