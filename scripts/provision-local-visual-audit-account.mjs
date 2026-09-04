#!/usr/bin/env node
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = String(process.env.VISUAL_AUDIT_BASE_URL || "http://127.0.0.1:8788").replace(/\/$/, "");
const SOURCE_PATH = path.resolve(ROOT, ".secrets", "test-accounts-2026-05-18.json");
const LOCAL_SOURCE_PATH = path.resolve(ROOT, ".secrets", "local-workspace-smoke-accounts.json");
const TARGET_PATH = path.resolve(ROOT, ".secrets", "exhaustive-visual-audit-accounts.json");
const SITE_ID = "site-desert-valley-high";

class Session {
  constructor() {
    this.cookies = new Map();
  }

  async post(route, body) {
    const response = await fetch(`${BASE_URL}${route}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(this.cookies.size ? { cookie: [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ") } : {}),
      },
      body: JSON.stringify(body),
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      for (const part of setCookie.split(/,(?=\s*[^;,]+=)/g)) {
        const pair = part.split(";", 1)[0].trim();
        const index = pair.indexOf("=");
        if (index > 0) this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
      }
    }
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }
}

assertLoopback(BASE_URL);
assertIgnored(TARGET_PATH);

const source = readJson(SOURCE_PATH);
const localSource = readJson(LOCAL_SOURCE_PATH);
const sourceAccounts = Array.isArray(source.accounts) ? source.accounts : [];
const localAccounts = Array.isArray(localSource.accounts) ? localSource.accounts : [];
const bootstrapCandidates = [
  ...sourceAccounts.filter((account) => normalizeRole(account.role || account.roleId || account.key) === "admin"),
  ...localAccounts.filter((account) => normalizeRole(account.role || account.roleId || account.key) === "admin"),
];

let adminSession = null;
for (const candidate of bootstrapCandidates) {
  const session = new Session();
  const login = await session.post("/api/auth/login", {
    email: candidate.email,
    password: candidate.password || candidate.workingPassword,
  });
  if (login.status === 200 && login.body?.ok === true) {
    adminSession = session;
    break;
  }
}
if (!adminSession) throw new Error("A local synthetic admin could not authenticate. Run the local smoke seed first.");

const suffix = `${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex")}`;
const schoolAdmin = {
  email: `visual-audit-school-admin-${suffix}@senior-capstone.test`,
  displayName: "Visual Audit School Admin",
  roleId: "administration",
  scopeType: "site",
  scopeId: SITE_ID,
  siteIds: [SITE_ID],
  programIds: [],
  identityType: "local",
  status: "active",
};

const imported = await adminSession.post("/api/admin/users/import", {
  adminNote: "Create one isolated local-only School Admin for exhaustive visual coverage.",
  users: [schoolAdmin],
});
if (imported.status !== 200 || imported.body?.ok !== true) {
  throw new Error(`Local synthetic School Admin import failed with HTTP ${imported.status} (${imported.body?.error || "unknown"}).`);
}

const importedUser = imported.body?.users?.[0];
if (!importedUser?.setupCode) throw new Error("The local synthetic School Admin setup code was not returned.");

const password = `Va9!${randomBytes(18).toString("base64url")}z7`;
const resetSession = new Session();
const completed = await resetSession.post("/api/auth/complete-reset", {
  email: importedUser.email,
  currentPassword: importedUser.setupCode,
  newPassword: password,
});
if (completed.status !== 200 || completed.body?.ok !== true) {
  throw new Error(`Local synthetic School Admin setup failed with HTTP ${completed.status}.`);
}

const proofSession = new Session();
const login = await proofSession.post("/api/auth/login", { email: importedUser.email, password });
let mfaSecret = "";
if (login.status === 202 && login.body?.error === "mfa_enrollment_required") {
  mfaSecret = String(login.body?.mfa?.secret || "").trim();
  const challengeToken = String(login.body?.challengeToken || "");
  if (!mfaSecret || !challengeToken) throw new Error("Local synthetic School Admin MFA enrollment data is missing.");
  const verified = await proofSession.post("/api/auth/mfa/verify", {
    challengeToken,
    code: currentTotpCode(mfaSecret),
  });
  if (verified.status !== 200 || verified.body?.ok !== true) {
    throw new Error("Local synthetic School Admin MFA enrollment failed.");
  }
} else if (login.status !== 200 || login.body?.ok !== true) {
  throw new Error(`Local synthetic School Admin login failed with HTTP ${login.status}.`);
}

const accounts = sourceAccounts
  .filter((account) => account?.email && (account?.password || account?.workingPassword))
  .map((account) => ({
    email: account.email,
    role: normalizeRole(account.role || account.roleId || account.key),
    password: account.password || account.workingPassword,
    ...(account.mfaSecret ? { mfaSecret: account.mfaSecret } : {}),
  }))
  .filter((account) => account.role);
accounts.push({
  email: importedUser.email,
  role: "administration",
  password,
  ...(mfaSecret ? { mfaSecret } : {}),
});

writeFileSync(TARGET_PATH, `${JSON.stringify({
  kind: "exhaustive_visual_audit_accounts",
  generatedAt: new Date().toISOString(),
  localOnly: true,
  syntheticOnly: true,
  accounts,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  ok: true,
  localOnly: true,
  syntheticOnly: true,
  target: path.relative(ROOT, TARGET_PATH).replaceAll("\\", "/"),
  roles: accounts.map((account) => account.role),
  note: "Credential values were written only to the ignored local secret file and were not printed.",
}, null, 2));

function readJson(file) {
  if (!existsSync(file)) throw new Error(`Required ignored credential source is missing: ${path.relative(ROOT, file)}`);
  return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (["global_admin", "platform_admin"].includes(role)) return "admin";
  return role;
}

function assertLoopback(value) {
  const parsed = new URL(value);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)) {
    throw new Error("This provisioning helper is local-only and refuses non-loopback URLs.");
  }
}

function assertIgnored(file) {
  const relative = path.relative(ROOT, file);
  const result = spawnSync("git", ["check-ignore", "-q", relative], { cwd: ROOT, windowsHide: true });
  if (result.status !== 0) throw new Error(`Credential target must be git-ignored: ${relative}`);
}

function currentTotpCode(secret) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const value = ((digest[offset] & 127) << 24)
    | ((digest[offset + 1] & 255) << 16)
    | ((digest[offset + 2] & 255) << 8)
    | (digest[offset + 3] & 255);
  return String(value % 1_000_000).padStart(6, "0");
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const character of String(value || "").toUpperCase().replace(/=+$/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid synthetic MFA secret.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
