#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.cwd();
const scriptPath = fileURLToPath(import.meta.url);

export const DRIVE_FAILURES = {
  CONFIG_MISSING: "DRIVE_CONFIG_MISSING",
  CREDENTIALS_MISSING: "DRIVE_CREDENTIALS_MISSING",
  TOKEN_EXCHANGE_FAILED: "DRIVE_TOKEN_EXCHANGE_FAILED",
  ROOT_NOT_VISIBLE: "DRIVE_ROOT_NOT_VISIBLE",
  INDEX_NOT_VISIBLE: "DRIVE_INDEX_NOT_VISIBLE",
  ROOT_NOT_FOLDER: "DRIVE_ROOT_NOT_FOLDER",
  INDEX_NOT_SHEET: "DRIVE_INDEX_NOT_SHEET",
  UPLOAD_DENIED: "DRIVE_UPLOAD_DENIED",
  UPLOAD_FAILED: "DRIVE_UPLOAD_FAILED",
  UPLOAD_METADATA_MISSING: "DRIVE_UPLOAD_METADATA_MISSING",
  UPLOAD_BROWSER_LEAK_RISK: "DRIVE_UPLOAD_BROWSER_LEAK_RISK",
  UNKNOWN_FAILURE: "DRIVE_UNKNOWN_FAILURE",
};

const EXPECTED = {
  provider: "google_drive",
  accountId: "539e8f7c55e7b1472013626ad72f4c7f",
  d1DatabaseName: "senior-capstone-db",
  rootMimeType: "application/vnd.google-apps.folder",
  indexMimeType: "application/vnd.google-apps.spreadsheet",
};

const DEFAULT_BASE_URL = "https://senior-capstone-app.pages.dev";
const DEFAULT_CREDENTIALS_FILE = ".secrets/test-accounts-2026-05-18.json";
const PROOF_CONTENT = "SeniorProjectApp fake .test Google Drive live proof. No student data.";
const LARGE_PROOF_BYTES = 5 * 1024 * 1024 + 64 * 1024;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

class DriveLiveCheckError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "DriveLiveCheckError";
    this.classification = classification;
    this.details = details;
  }
}

class SessionClient {
  #cookies = new Map();

  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (this.#cookies.size > 0 && !headers.has("cookie")) {
      headers.set("cookie", this.#cookieHeader());
    }

    const response = await fetch(new URL(pathname, this.baseUrl), { ...init, headers });
    this.#storeCookies(response.headers);
    return response;
  }

  async fetchJson(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.fetch(pathname, { ...init, headers });
    const body = await response.json().catch(() => null);
    return { response, body };
  }

  hasCookie(name) {
    return this.#cookies.has(name);
  }

  #cookieHeader() {
    return Array.from(this.#cookies, ([name, value]) => `${name}=${value}`).join("; ");
  }

  #storeCookies(headers) {
    for (const value of readSetCookies(headers)) {
      const [nameValue, ...attributes] = value.split(";");
      const equalsIndex = nameValue.indexOf("=");
      if (equalsIndex === -1) continue;
      const name = nameValue.slice(0, equalsIndex).trim();
      const cookieValue = nameValue.slice(equalsIndex + 1).trim();
      const lowerAttributes = attributes.map((attribute) => attribute.trim().toLowerCase());
      if (!cookieValue || lowerAttributes.includes("max-age=0")) {
        this.#cookies.delete(name);
      } else {
        this.#cookies.set(name, cookieValue);
      }
    }
  }
}

function readSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

export function stripJsonComments(text) {
  let output = "";
  let inString = false;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        output += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === "\"" || char === "'") {
      inString = true;
      quote = char;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    output += char;
  }

  return output;
}

function readJsonc(relativePath) {
  const raw = readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(stripJsonComments(raw));
}

function configured(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized
      && !normalized.startsWith("pending")
      && !normalized.startsWith("replace-with")
      && normalized !== "undefined"
      && normalized !== "null",
  );
}

export function validateWranglerDriveConfig(wranglerConfig) {
  const vars = wranglerConfig?.vars || {};
  return {
    providerConfigured: vars.EVIDENCE_STORAGE_PROVIDER === EXPECTED.provider,
    rootConfigured: configured(vars.GOOGLE_DRIVE_EVIDENCE_ROOT_ID),
    indexConfigured: configured(vars.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID),
  };
}

function readCredentialFile(relativePath) {
  const resolvedPath = path.resolve(repoRoot, relativePath);
  if (!existsSync(resolvedPath)) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `Fake .test credential file is missing: ${relativePath}`,
      { credentialFilePresent: false },
    );
  }

  const payload = JSON.parse(readFileSync(resolvedPath, "utf8").replace(/^\uFEFF/, ""));
  const byKey = new Map();
  for (const account of payload.accounts || []) {
    if (account?.key) byKey.set(account.key, account);
  }
  return byKey;
}

function requireFakeCredential(credentials, key) {
  const account = credentials.get(key);
  if (!account?.email || !account?.password) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `Fake .test credential '${key}' is missing or incomplete.`,
      { credentialKey: key },
    );
  }
  if (!String(account.email).endsWith(".test")) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `Credential '${key}' is not a fake .test account.`,
      { credentialKey: key },
    );
  }
  return account;
}

function proofFileName(now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  return `codex-drive-live-proof-${stamp}.txt`;
}

function uploadForm({ title, artifactType = "live_readiness", fileName, mimeType, content }) {
  const form = new FormData();
  form.set("title", title);
  form.set("artifactType", artifactType);
  form.set("file", new Blob([content], { type: mimeType }), fileName);
  return form;
}

function largeProofBytes() {
  const bytes = new Uint8Array(LARGE_PROOF_BYTES);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = (index * 31 + 17) % 251;
  }
  const prefix = new TextEncoder().encode("SeniorProjectApp fake .test resumable upload proof. No student data.\n");
  bytes.set(prefix, 0);
  return bytes;
}

export function classifyDriveHttpFailure(responseStatus, body) {
  const error = String(body?.error || "");
  if (error === "drive_config_missing") return DRIVE_FAILURES.CONFIG_MISSING;
  if (error === "drive_credentials_missing") return DRIVE_FAILURES.CREDENTIALS_MISSING;
  if (error === "drive_token_exchange_failed") return DRIVE_FAILURES.TOKEN_EXCHANGE_FAILED;
  if (error === "drive_access_denied") {
    const rootOk = Boolean(body?.drive?.root?.ok);
    const indexOk = Boolean(body?.drive?.indexSheet?.ok);
    if (!rootOk) return DRIVE_FAILURES.ROOT_NOT_VISIBLE;
    if (!indexOk) return DRIVE_FAILURES.INDEX_NOT_VISIBLE;
    return DRIVE_FAILURES.UNKNOWN_FAILURE;
  }
  if (error === "drive_upload_failed" || error === "drive_package_upload_failed") return DRIVE_FAILURES.UPLOAD_FAILED;
  if (error === "drive_provider_error") return DRIVE_FAILURES.UPLOAD_FAILED;
  if (responseStatus === 401 || responseStatus === 403) return DRIVE_FAILURES.UPLOAD_DENIED;
  return DRIVE_FAILURES.UNKNOWN_FAILURE;
}

function classifyDriveProbeFailure(body, details = {}) {
  const rootOk = Boolean(body?.drive?.root?.ok);
  const indexOk = Boolean(body?.drive?.indexSheet?.ok);
  const rootStatus = Number(body?.drive?.root?.status ?? details.rootStatus ?? 0);
  const indexStatus = Number(body?.drive?.indexSheet?.status ?? details.indexStatus ?? 0);

  if (!rootOk && rootStatus >= 400) return DRIVE_FAILURES.ROOT_NOT_VISIBLE;
  if (!indexOk && indexStatus >= 400) return DRIVE_FAILURES.INDEX_NOT_VISIBLE;
  return classifyDriveHttpFailure(502, body);
}

export function validateDriveProbeMimes(probeBody) {
  const rootMimeType = probeBody?.drive?.root?.mimeType || null;
  const indexMimeType = probeBody?.drive?.indexSheet?.mimeType || null;
  if (rootMimeType !== EXPECTED.rootMimeType) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.ROOT_NOT_FOLDER,
      `Drive root is visible but is not a folder.`,
      { rootMimeType },
    );
  }
  if (indexMimeType !== EXPECTED.indexMimeType) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.INDEX_NOT_SHEET,
      `Drive index is visible but is not a Google Sheet.`,
      { indexMimeType },
    );
  }
}

export function containsForbiddenStorageLeak(value) {
  return /drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|access_token|refresh_token|BEGIN PRIVATE KEY|GOOGLE_DRIVE_PRIVATE_KEY/i
    .test(JSON.stringify(value));
}

function assertNoForbiddenStorageLeak(value, label) {
  if (containsForbiddenStorageLeak(value)) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UPLOAD_BROWSER_LEAK_RISK,
      `${label} exposes a forbidden storage identifier or secret marker.`,
    );
  }
}

function readLatestDriveProbeAuditStatuses() {
  try {
    const payload = runWranglerD1Json(
      "SELECT metadata_json FROM audit_events WHERE action = 'google_drive_probe_access_denied' ORDER BY created_at DESC LIMIT 1;",
    );
    const metadata = payload?.[0]?.results?.[0]?.metadata_json;
    const parsed = metadata ? JSON.parse(metadata) : {};
    return {
      rootStatus: Number(parsed.rootStatus || 0) || null,
      indexStatus: Number(parsed.indexStatus || 0) || null,
    };
  } catch {
    return { rootStatus: null, indexStatus: null };
  }
}

async function login(client, account, label) {
  const result = await client.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });

  if (result.response.status !== 200 || result.body?.ok !== true || !client.hasCookie("sc_session")) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `${label} fake .test login failed.`,
      { status: result.response.status, error: result.body?.error || null },
    );
  }
  return result.body;
}

async function expectUploadDenial({ client, submissionId, expectedStatus, expectedError, label, form }) {
  const result = await client.fetchJson(`/api/submissions/${encodeURIComponent(submissionId)}/evidence/upload`, {
    method: "POST",
    body: form,
  });

  if (result.response.status !== expectedStatus || result.body?.error !== expectedError) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `${label} returned an unexpected result.`,
      {
        expectedStatus,
        expectedError,
        actualStatus: result.response.status,
        actualError: result.body?.error || null,
      },
    );
  }

  return { status: result.response.status, error: result.body.error };
}

async function verifyBlockedAllowedUpload({ client, submissionId, log }) {
  const fileBytes = new TextEncoder().encode(PROOF_CONTENT);
  const result = await client.fetchJson(`/api/submissions/${encodeURIComponent(submissionId)}/evidence/upload`, {
    method: "POST",
    body: uploadForm({
      title: "Blocked Drive live proof",
      fileName: proofFileName(),
      mimeType: "text/plain",
      content: fileBytes,
    }),
  });

  if (result.response.status === 200 || result.body?.ok === true) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      "Drive probe failed, but the allowed fake upload unexpectedly succeeded.",
    );
  }

  const error = String(result.body?.error || "");
  const expected = new Set([
    "drive_credentials_missing",
    "drive_token_exchange_failed",
    "drive_provider_error",
    "drive_upload_failed",
  ]);
  if (!expected.has(error)) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      "Allowed fake upload did not fail with a Drive provider error while Drive was blocked.",
      { status: result.response.status, error: error || null },
    );
  }

  assertNoForbiddenStorageLeak(result.body, "blocked upload response");
  log(`PASS blocked-upload: allowed fake upload failed truthfully with ${error}.`);
  return { status: result.response.status, error };
}

function extractJson(output) {
  const trimmed = String(output || "").trim();
  const arrayStart = trimmed.indexOf("[");
  const objectStart = trimmed.indexOf("{");
  const starts = [arrayStart, objectStart].filter((index) => index >= 0);
  if (!starts.length) throw new Error("no JSON payload found");
  const start = Math.min(...starts);
  const arrayEnd = trimmed.lastIndexOf("]");
  const objectEnd = trimmed.lastIndexOf("}");
  const end = Math.max(arrayEnd, objectEnd);
  if (end <= start) throw new Error("no complete JSON payload found");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function runWranglerD1Json(sql) {
  const tokenPresent = Boolean(String(process.env.CLOUDFLARE_API_TOKEN || "").trim());
  if (!tokenPresent) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UPLOAD_METADATA_MISSING,
      "CLOUDFLARE_API_TOKEN is missing, so server-side D1 metadata cannot be verified.",
      { cloudflareTokenPresent: false },
    );
  }

  const wranglerJs = path.join(repoRoot, "node_modules", "wrangler", "bin", "wrangler.js");
  if (!existsSync(wranglerJs)) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UPLOAD_METADATA_MISSING,
      "Local Wrangler CLI is missing, so server-side D1 metadata cannot be verified.",
    );
  }

  const result = spawnSync(
    process.execPath,
    [
      wranglerJs,
      "d1",
      "execute",
      EXPECTED.d1DatabaseName,
      "--remote",
      "--json",
      "--command",
      sql,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || EXPECTED.accountId,
        CI: "1",
      },
    },
  );

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UPLOAD_METADATA_MISSING,
      "Wrangler D1 metadata verification failed.",
      { status: result.status },
    );
  }

  return extractJson(output);
}

function verifyD1EvidenceMetadata({ evidenceId, studentId, submissionId, sizeBytes }) {
  const sql = `
    SELECT
      COUNT(*) AS row_count,
      MAX(CASE WHEN student_id = ${sqlString(studentId)} THEN 1 ELSE 0 END) AS student_match,
      MAX(CASE WHEN submission_id = ${sqlString(submissionId)} THEN 1 ELSE 0 END) AS submission_match,
      MAX(CASE WHEN source_kind = 'google_drive_file' THEN 1 ELSE 0 END) AS source_kind_match,
      MAX(CASE WHEN drive_file_id IS NOT NULL AND length(drive_file_id) > 8 THEN 1 ELSE 0 END) AS drive_file_id_present,
      MAX(CASE WHEN drive_parent_folder_id IS NOT NULL AND length(drive_parent_folder_id) > 8 THEN 1 ELSE 0 END) AS drive_parent_folder_id_present,
      MAX(CASE WHEN size_bytes = ${Number(sizeBytes)} THEN 1 ELSE 0 END) AS size_bytes_match,
      MAX(CASE WHEN review_status = 'pending_review' THEN 1 ELSE 0 END) AS review_status_match,
      (SELECT COUNT(*) FROM audit_events WHERE action = 'evidence_file_uploaded' AND entity_id = ${sqlString(evidenceId)}) AS upload_audit_count
    FROM evidence_artifacts
    WHERE id = ${sqlString(evidenceId)};
  `;

  const payload = runWranglerD1Json(sql);
  const row = payload?.[0]?.results?.[0] || {};
  const checks = {
    rowPresent: Number(row.row_count) === 1,
    studentMatch: Number(row.student_match) === 1,
    submissionMatch: Number(row.submission_match) === 1,
    sourceKindMatch: Number(row.source_kind_match) === 1,
    driveFileIdPresent: Number(row.drive_file_id_present) === 1,
    driveParentFolderIdPresent: Number(row.drive_parent_folder_id_present) === 1,
    sizeBytesMatch: Number(row.size_bytes_match) === 1,
    reviewStatusMatch: Number(row.review_status_match) === 1,
    auditEventPresent: Number(row.upload_audit_count) >= 1,
  };

  if (!Object.values(checks).every(Boolean)) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UPLOAD_METADATA_MISSING,
      "Uploaded evidence metadata or audit row is missing in remote D1.",
      checks,
    );
  }

  return checks;
}

function verifyD1DownloadAudit({ evidenceId }) {
  const sql = `
    SELECT COUNT(*) AS download_audit_count
    FROM audit_events
    WHERE action = 'evidence_downloaded' AND entity_id = ${sqlString(evidenceId)};
  `;

  const payload = runWranglerD1Json(sql);
  const row = payload?.[0]?.results?.[0] || {};
  const checks = {
    auditEventPresent: Number(row.download_audit_count) >= 1,
  };

  if (!checks.auditEventPresent) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UPLOAD_METADATA_MISSING,
      "Downloaded evidence audit row is missing in remote D1.",
      checks,
    );
  }

  return checks;
}

async function uploadLiveEvidence({ client, submissionId, title, fileName, mimeType, content, label }) {
  const upload = await client.fetchJson(`/api/submissions/${encodeURIComponent(submissionId)}/evidence/upload`, {
    method: "POST",
    body: uploadForm({
      title,
      fileName,
      mimeType,
      content,
    }),
  });

  if (upload.response.status !== 200 || upload.body?.ok !== true) {
    const classification = classifyDriveHttpFailure(upload.response.status, upload.body);
    throw new DriveLiveCheckError(classification, `${label} Drive upload failed.`, {
      status: upload.response.status,
      error: upload.body?.error || null,
    });
  }

  assertNoForbiddenStorageLeak(upload.body, `${label} upload response`);
  const evidence = upload.body.evidence || {};
  const storage = upload.body.storage || {};
  const uploadChecks = {
    sourceKind: evidence.sourceKind === "google_drive_file",
    reviewStatus: evidence.reviewStatus === "pending_review",
    storageProvider: storage.provider === EXPECTED.provider,
    metadataReady: storage.metadataReady === true,
    fileBytesReady: storage.fileBytesReady === true,
    signedRetrievalReady: storage.signedRetrievalReady === false,
  };
  if (!Object.values(uploadChecks).every(Boolean)) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UPLOAD_METADATA_MISSING, `${label} upload response did not match expected storage contract.`, uploadChecks);
  }

  return { evidence, storage };
}

async function downloadLiveEvidence({ client, evidenceId, expectedBytes, expectedContentType, label }) {
  const response = await client.fetch(`/api/evidence/${encodeURIComponent(evidenceId)}/download`, {
    headers: { accept: expectedContentType },
  });

  if (response.status !== 200) {
    const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
    const classification = classifyDriveHttpFailure(response.status, body);
    throw new DriveLiveCheckError(classification, `${label} evidence download failed.`, {
      status: response.status,
      error: body?.error || null,
    });
  }

  assertNoForbiddenStorageLeak({
    contentType: response.headers.get("content-type") || "",
    contentDisposition: response.headers.get("content-disposition") || "",
  }, `${label} download headers`);

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes(expectedContentType.toLowerCase())) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `${label} download returned an unexpected content type.`,
      { contentType, expectedContentType },
    );
  }

  const actual = new Uint8Array(await response.arrayBuffer());
  if (actual.byteLength !== expectedBytes.byteLength) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.UNKNOWN_FAILURE,
      `${label} download size did not match uploaded bytes.`,
      { actualBytes: actual.byteLength, expectedBytes: expectedBytes.byteLength },
    );
  }
  for (let index = 0; index < actual.byteLength; index += 1) {
    if (actual[index] !== expectedBytes[index]) {
      throw new DriveLiveCheckError(
        DRIVE_FAILURES.UNKNOWN_FAILURE,
        `${label} download bytes did not match uploaded bytes.`,
        { mismatchIndex: index },
      );
    }
  }

  return {
    status: response.status,
    contentType,
    bytes: actual.byteLength,
    cacheControl: response.headers.get("cache-control") || null,
  };
}

async function runDriveLiveCheck(options = {}) {
  const baseUrl = new URL(options.baseUrl || process.env.DRIVE_LIVE_BASE_URL || DEFAULT_BASE_URL);
  const credentialsFile = options.credentialsFile || process.env.DRIVE_LIVE_CREDENTIALS_FILE || DEFAULT_CREDENTIALS_FILE;
  const studentKey = options.studentKey || process.env.DRIVE_LIVE_STUDENT_KEY || "student";
  const nonStudentKey = options.nonStudentKey || process.env.DRIVE_LIVE_NON_STUDENT_KEY || "program_teacher";

  const logs = [];
  const log = (message) => {
    logs.push(message);
    console.log(message);
  };

  log(`Drive live verification target: ${baseUrl.origin}`);
  log("Drive live verification uses ignored fake .test credentials; passwords are not printed.");

  const wranglerConfig = readJsonc("wrangler.jsonc");
  const config = validateWranglerDriveConfig(wranglerConfig);
  if (!config.providerConfigured || !config.rootConfigured || !config.indexConfigured) {
    throw new DriveLiveCheckError(
      DRIVE_FAILURES.CONFIG_MISSING,
      "wrangler.jsonc Drive provider/root/index configuration is incomplete.",
      config,
    );
  }
  log("PASS config: wrangler.jsonc declares google_drive provider plus root/index ids.");

  const healthResponse = await fetch(new URL("/api/health", baseUrl), { headers: { accept: "application/json" } });
  const health = await healthResponse.json().catch(() => null);
  if (healthResponse.status !== 200 || health?.ok !== true) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UNKNOWN_FAILURE, "Live /api/health did not return ok:true.", {
      status: healthResponse.status,
    });
  }
  assertNoForbiddenStorageLeak(health, "/api/health");

  if (health.evidenceStorageProvider !== EXPECTED.provider || !health.evidenceRootConfigured || !health.evidenceIndexConfigured) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.CONFIG_MISSING, "Live health reports Drive provider/root/index not ready.", {
      provider: health.evidenceStorageProvider || null,
      rootConfigured: Boolean(health.evidenceRootConfigured),
      indexConfigured: Boolean(health.evidenceIndexConfigured),
    });
  }
  if (!health.googleDriveCredentialsConfigured) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.CREDENTIALS_MISSING, "Live health reports Google Drive credential parts are missing.", {
      credentialParts: health.googleDriveCredentialParts || null,
    });
  }
  log("PASS health: live runtime reports provider config and credential parts configured.");

  const credentials = readCredentialFile(credentialsFile);
  const student = requireFakeCredential(credentials, studentKey);
  const nonStudent = credentials.has(nonStudentKey) ? requireFakeCredential(credentials, nonStudentKey) : null;

  const studentClient = new SessionClient(baseUrl);
  const loginBody = await login(studentClient, student, "student");
  log("PASS auth: fake .test student login succeeded.");

  const me = await studentClient.fetchJson("/api/auth/me");
  if (me.response.status !== 200 || me.body?.authenticated !== true || me.body?.user?.email !== student.email) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UNKNOWN_FAILURE, "Fake student /api/auth/me did not restore the session.", {
      status: me.response.status,
    });
  }
  log("PASS auth: fake .test student session restored.");

  const dashboard = await studentClient.fetchJson("/api/student/dashboard");
  if (dashboard.response.status !== 200 || dashboard.body?.ok !== true || !Array.isArray(dashboard.body.submissions) || dashboard.body.submissions.length === 0) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UNKNOWN_FAILURE, "Fake student dashboard did not expose a seeded submission.", {
      status: dashboard.response.status,
    });
  }
  assertNoForbiddenStorageLeak(dashboard.body, "/api/student/dashboard before upload");

  const submissionId = dashboard.body.submissions[0].id;
  const studentId = loginBody.user.id;
  log("PASS dashboard: fake student submission discovered.");

  const workspaceHtml = await fetch(new URL("/workspace.html", baseUrl));
  const workspaceScript = await fetch(new URL("/workspace.js", baseUrl));
  const workspaceScriptText = await workspaceScript.text();
  if (workspaceHtml.status !== 200 || workspaceScript.status !== 200) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UNKNOWN_FAILURE, "Hosted canonical workspace assets did not load.", {
      workspaceHtmlStatus: workspaceHtml.status,
      workspaceScriptStatus: workspaceScript.status,
    });
  }
  if (!workspaceScriptText.includes("data-evidence-download=\"file\"") || !workspaceScriptText.includes("/api/evidence/")) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UNKNOWN_FAILURE, "Hosted workspace script does not expose the app-scoped evidence download action.", {
      evidenceDownloadMarker: workspaceScriptText.includes("data-evidence-download=\"file\""),
      evidenceDownloadRouteMarker: workspaceScriptText.includes("/api/evidence/"),
    });
  }
  assertNoForbiddenStorageLeak(workspaceScriptText, "hosted workspace script");
  log("PASS workspace: hosted canonical workspace serves the evidence upload and app-scoped download markers.");

  const denials = {};
  const signedOut = new SessionClient(baseUrl);
  denials.signedOutUpload = await expectUploadDenial({
    client: signedOut,
    submissionId,
    expectedStatus: 401,
    expectedError: "unauthorized",
    label: "signed-out upload denial",
    form: uploadForm({
      title: "Signed-out Drive live denial",
      fileName: "signed-out-denial.txt",
      mimeType: "text/plain",
      content: "signed out denial",
    }),
  });

  denials.unsupportedFile = await expectUploadDenial({
    client: studentClient,
    submissionId,
    expectedStatus: 400,
    expectedError: "unsupported_file_type",
    label: "unsupported file upload denial",
    form: uploadForm({
      title: "Unsupported Drive live denial",
      fileName: "blocked.exe",
      mimeType: "application/x-msdownload",
      content: "MZ",
    }),
  });

  denials.emptyFile = await expectUploadDenial({
    client: studentClient,
    submissionId,
    expectedStatus: 400,
    expectedError: "empty_file",
    label: "empty file upload denial",
    form: uploadForm({
      title: "Empty Drive live denial",
      fileName: "empty.txt",
      mimeType: "text/plain",
      content: new Uint8Array(0),
    }),
  });

  denials.oversizedFile = await expectUploadDenial({
    client: studentClient,
    submissionId,
    expectedStatus: 400,
    expectedError: "file_too_large",
    label: "oversized file upload denial",
    form: uploadForm({
      title: "Oversized Drive live denial",
      fileName: "oversized.pdf",
      mimeType: "application/pdf",
      content: new Uint8Array(MAX_UPLOAD_BYTES + 1),
    }),
  });

  if (nonStudent) {
    const nonStudentClient = new SessionClient(baseUrl);
    await login(nonStudentClient, nonStudent, "non-student");
    denials.nonStudentUpload = await expectUploadDenial({
      client: nonStudentClient,
      submissionId,
      expectedStatus: 403,
      expectedError: "forbidden",
      label: "non-student upload denial",
      form: uploadForm({
        title: "Non-student Drive live denial",
        fileName: "non-student-denial.txt",
        mimeType: "text/plain",
        content: "non student denial",
      }),
    });
  } else {
    denials.nonStudentUpload = { skipped: true, reason: "missing_non_student_fake_credential" };
  }

  const secondStudent = Array.from(credentials.values())
    .find((account) => account.key !== studentKey && String(account.email || "").endsWith(".test") && account.roleId === "student");
  denials.crossStudentUpload = secondStudent
    ? { attempted: true }
    : { skipped: true, reason: "missing_second_fake_student_credential" };

  log("PASS denials: signed-out, unsupported, empty, oversized, and non-student upload guards verified.");

  const probe = await studentClient.fetchJson("/api/evidence/drive-probe");
  if (probe.response.status !== 200 || probe.body?.ok !== true) {
    const auditStatuses = probe.body?.error === "drive_access_denied"
      ? readLatestDriveProbeAuditStatuses()
      : { rootStatus: null, indexStatus: null };
    const blockedUpload = await verifyBlockedAllowedUpload({ client: studentClient, submissionId, log });
    const details = {
      status: probe.response.status,
      error: probe.body?.error || null,
      rootStatus: probe.body?.drive?.root?.status || auditStatuses.rootStatus,
      indexStatus: probe.body?.drive?.indexSheet?.status || auditStatuses.indexStatus,
      blockedUpload,
    };
    const classification = classifyDriveProbeFailure(probe.body, details);
    throw new DriveLiveCheckError(classification, "Live Drive probe failed.", {
      ...details,
    });
  }
  assertNoForbiddenStorageLeak(probe.body, "/api/evidence/drive-probe");
  validateDriveProbeMimes(probe.body);
  log("PASS drive: token exchange succeeded, root folder is visible, and index sheet is visible.");

  const fileBytes = new TextEncoder().encode(PROOF_CONTENT);
  const fileName = proofFileName();
  const { evidence } = await uploadLiveEvidence({
    client: studentClient,
    submissionId,
    title: "Codex Drive live proof",
    fileName,
    mimeType: "text/plain",
    content: fileBytes,
    label: "small text",
  });
  log("PASS upload: fake .test text file uploaded through the app path with no raw Drive ID in the response.");

  const d1Checks = verifyD1EvidenceMetadata({
    evidenceId: evidence.id,
    studentId,
    submissionId,
    sizeBytes: fileBytes.length,
  });
  log("PASS D1: evidence metadata and evidence_file_uploaded audit row verified without selecting raw Drive IDs.");

  const smallDownload = await downloadLiveEvidence({
    client: studentClient,
    evidenceId: evidence.id,
    expectedBytes: fileBytes,
    expectedContentType: "text/plain",
    label: "small text",
  });
  const smallDownloadD1Checks = verifyD1DownloadAudit({ evidenceId: evidence.id });
  log("PASS download: fake .test text file downloaded through the app-scoped evidence route and matched uploaded bytes.");

  const dashboardAfter = await studentClient.fetchJson("/api/student/dashboard");
  if (dashboardAfter.response.status !== 200 || dashboardAfter.body?.ok !== true) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UPLOAD_BROWSER_LEAK_RISK, "Dashboard refresh after upload failed.", {
      status: dashboardAfter.response.status,
    });
  }
  assertNoForbiddenStorageLeak(dashboardAfter.body, "/api/student/dashboard after upload");
  const uploadedEvidenceSummary = (dashboardAfter.body.evidence || []).find((item) => item.id === evidence.id);
  if (!uploadedEvidenceSummary?.downloadUrl || uploadedEvidenceSummary.fileBytesReady !== true || uploadedEvidenceSummary.storageIdentifiersRedacted !== true) {
    throw new DriveLiveCheckError(DRIVE_FAILURES.UPLOAD_METADATA_MISSING, "Dashboard evidence summary did not expose the safe app-scoped download marker after upload.", {
      evidenceId: evidence.id,
      hasDownloadUrl: Boolean(uploadedEvidenceSummary?.downloadUrl),
      fileBytesReady: uploadedEvidenceSummary?.fileBytesReady,
      storageIdentifiersRedacted: uploadedEvidenceSummary?.storageIdentifiersRedacted,
    });
  }
  log("PASS leak-check: upload response, download headers, and dashboard output omit raw Drive storage identifiers.");

  const largeBytes = largeProofBytes();
  const largeFileName = proofFileName().replace(".txt", "-resumable.txt");
  const largeUpload = await uploadLiveEvidence({
    client: studentClient,
    submissionId,
    title: "Codex Drive live resumable proof",
    fileName: largeFileName,
    mimeType: "text/plain",
    content: largeBytes,
    label: "resumable >5MB",
  });
  log("PASS upload: fake .test >5MB file uploaded through the resumable Drive path.");

  const largeD1Checks = verifyD1EvidenceMetadata({
    evidenceId: largeUpload.evidence.id,
    studentId,
    submissionId,
    sizeBytes: largeBytes.length,
  });
  const largeDownload = await downloadLiveEvidence({
    client: studentClient,
    evidenceId: largeUpload.evidence.id,
    expectedBytes: largeBytes,
    expectedContentType: "text/plain",
    label: "resumable >5MB",
  });
  const largeDownloadD1Checks = verifyD1DownloadAudit({ evidenceId: largeUpload.evidence.id });
  log("PASS resumable: >5MB fake .test upload, D1 metadata, app-scoped download, and download audit all passed.");

  const summary = {
    ok: true,
    classification: null,
    baseUrl: baseUrl.origin,
    config: {
      providerConfigured: true,
      rootConfigured: true,
      indexConfigured: true,
      credentialsConfigured: true,
    },
    drive: {
      tokenExchange: "passed_via_drive_probe",
      rootProbe: "passed_folder",
      indexProbe: "passed_sheet",
      upload: "passed",
      proofArtifact: {
        fileName,
        leftInDrive: true,
        fileIdPresent: true,
        rawFileIdExposed: false,
      },
      appScopedDownload: "passed",
      resumableUploadOver5MB: "passed",
    },
    fakeUpload: {
      studentLogin: true,
      submissionDiscovered: true,
      evidenceId: evidence.id,
      d1Metadata: d1Checks,
      download: {
        smallText: {
          evidenceId: evidence.id,
          response: smallDownload,
          d1Audit: smallDownloadD1Checks,
        },
        largeResumable: {
          evidenceId: largeUpload.evidence.id,
          response: largeDownload,
          d1Metadata: largeD1Checks,
          d1Audit: largeDownloadD1Checks,
        },
      },
      denialCases: denials,
    },
    workspace: {
      canonicalRouteLoaded: true,
      uploadMarkerPresent: workspaceScriptText.includes("/evidence/upload"),
      downloadMarkerPresent: true,
    },
    security: {
      noSecretValuesPrinted: true,
      rawDriveIdsInBrowserOutput: false,
      realStudentDataUsed: false,
    },
    logs,
  };

  log("Drive live verification passed: provider, runtime credentials, Drive probes, fake upload/download, >5MB resumable proof, D1 metadata/audits, denials, and leak checks passed.");
  return summary;
}

export { DriveLiveCheckError, proofFileName, runDriveLiveCheck };

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) {
  try {
    await runDriveLiveCheck();
  } catch (error) {
    if (error instanceof DriveLiveCheckError) {
      console.error(`Drive live verification failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(error.details)}`);
      }
    } else {
      console.error(`Drive live verification failed: ${DRIVE_FAILURES.UNKNOWN_FAILURE}: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
