import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const projectRoot = process.cwd();

function runWrapper(args, env) {
  return spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      "scripts/run-automation.ps1",
      ...args,
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, ...env },
    },
  );
}

test("guardrail wrapper dry-run succeeds with required env", () => {
  const result = runWrapper(["qol:hourly", "-DryRun", "-AllowDirtyStart"], {
    AUTOMATION_SHEETS_SPREADSHEET_ID: "TEST_SPREADSHEET",
    AUTOMATION_SHEETS_TAB_NAME: "Automation Runs",
    GOOGLE_SHEETS_CLIENT_EMAIL: "test@example.com",
    GOOGLE_SHEETS_PRIVATE_KEY: "TEST_KEY",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /DRY RUN:/);
});

test("guardrail wrapper dry-run fails fast when sheet config is missing", () => {
  const result = runWrapper(["qol:hourly", "-DryRun", "-AllowDirtyStart"], {
    AUTOMATION_SHEETS_SPREADSHEET_ID: "",
    AUTOMATION_SHEETS_TAB_NAME: "",
    GOOGLE_SHEETS_CLIENT_EMAIL: "",
    GOOGLE_SHEETS_PRIVATE_KEY: "",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Missing env var: AUTOMATION_SHEETS_SPREADSHEET_ID/);
});

