import assert from "node:assert/strict";
import test from "node:test";

import {
  DRIVE_FAILURES,
  classifyDriveHttpFailure,
  containsForbiddenStorageLeak,
  stripJsonComments,
  validateDriveProbeMimes,
  validateWranglerDriveConfig,
} from "../scripts/check-google-drive-live.mjs";

test("Drive live script validates JSONC Drive config without exposing ids", () => {
  const parsed = JSON.parse(stripJsonComments(`{
    // comments are allowed in wrangler.jsonc
    "vars": {
      "EVIDENCE_STORAGE_PROVIDER": "google_drive",
      "GOOGLE_DRIVE_EVIDENCE_ROOT_ID": "root",
      "GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID": "sheet"
    }
  }`));

  assert.deepEqual(validateWranglerDriveConfig(parsed), {
    providerConfigured: true,
    rootConfigured: true,
    indexConfigured: true,
  });
});

test("Drive live script classifies credential and token failures", () => {
  assert.equal(
    classifyDriveHttpFailure(503, { error: "drive_credentials_missing" }),
    DRIVE_FAILURES.CREDENTIALS_MISSING,
  );
  assert.equal(
    classifyDriveHttpFailure(502, { error: "drive_token_exchange_failed" }),
    DRIVE_FAILURES.TOKEN_EXCHANGE_FAILED,
  );
});

test("Drive live script distinguishes root and index visibility failures", () => {
  assert.equal(
    classifyDriveHttpFailure(502, {
      error: "drive_access_denied",
      drive: { root: { ok: false, status: 404 }, indexSheet: { ok: true, status: 200 } },
    }),
    DRIVE_FAILURES.ROOT_NOT_VISIBLE,
  );
  assert.equal(
    classifyDriveHttpFailure(502, {
      error: "drive_access_denied",
      drive: { root: { ok: true, status: 200 }, indexSheet: { ok: false, status: 403 } },
    }),
    DRIVE_FAILURES.INDEX_NOT_VISIBLE,
  );
});

test("Drive live script rejects wrong Drive MIME types", () => {
  assert.throws(
    () => validateDriveProbeMimes({
      drive: {
        root: { mimeType: "text/plain" },
        indexSheet: { mimeType: "application/vnd.google-apps.spreadsheet" },
      },
    }),
    /Drive root is visible but is not a folder/,
  );
  assert.throws(
    () => validateDriveProbeMimes({
      drive: {
        root: { mimeType: "application/vnd.google-apps.folder" },
        indexSheet: { mimeType: "application/pdf" },
      },
    }),
    /Drive index is visible but is not a Google Sheet/,
  );
});

test("Drive live script flags forbidden storage identifiers in browser/API JSON", () => {
  assert.equal(containsForbiddenStorageLeak({ evidence: { sourceKind: "google_drive_file" } }), false);
  assert.equal(containsForbiddenStorageLeak({ evidence: { driveFileId: "secret-drive-id" } }), true);
  assert.equal(containsForbiddenStorageLeak({ token: "access_token" }), true);
});
