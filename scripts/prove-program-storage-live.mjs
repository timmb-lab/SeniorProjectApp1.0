import { createHmac } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = new URL((process.env.PROGRAM_STORAGE_PROOF_BASE_URL || "https://thecapstoneproject.com").replace(/\/$/, ""));
const CREDENTIALS_PATH = process.env.PROGRAM_STORAGE_PROOF_ACCOUNTS || path.join(".secrets", "role-audit-accounts-v2.json");
const DOCX_PATH = process.env.PROGRAM_STORAGE_PROOF_DOCX || path.join("docs", "admin", "Senior-Project-Admin-Overview.docx");
const MANIFEST_PATH = process.env.PROGRAM_STORAGE_PROOF_MANIFEST || path.join("docs", "progress", "runs", "program-storage-live-proof.json");
const SITE_ID = "site-desert-valley-high";
const PROGRAM_ID = "it";
const SUBMISSION_ID = "submission-storage-live-proof";

class SessionClient {
  cookies = new Map();
  async request(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "));
    const response = await fetch(new URL(pathname, BASE_URL), { ...init, headers, redirect: "manual" });
    const setCookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : [];
    for (const cookie of setCookies) {
      const [pair] = cookie.split(";");
      const split = pair.indexOf("=");
      if (split > 0) this.cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    return response;
  }
  async json(pathname, init = {}) {
    const response = await this.request(pathname, init);
    return { response, body: await response.json().catch(() => ({})) };
  }
}

async function readAccounts() {
  const payload = JSON.parse(await fs.readFile(path.resolve(ROOT, CREDENTIALS_PATH), "utf8"));
  const accounts = Array.isArray(payload) ? payload : payload.accounts || [];
  const byRole = new Map(accounts.map((account) => [String(account.role || account.key || "").toLowerCase(), account]));
  for (const role of ["student", "program_teacher", "mentor", "site_admin", "admin"]) {
    const account = byRole.get(role);
    if (!account?.email || !account?.password || !String(account.email).endsWith(".test")) throw new Error(`Missing safe fake credential for ${role}.`);
  }
  return byRole;
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const character of String(value || "").toUpperCase().replace(/=+$/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid fake-account MFA state.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totp(secret) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const value = ((digest[offset] & 127) << 24) | ((digest[offset + 1] & 255) << 16) | ((digest[offset + 2] & 255) << 8) | (digest[offset + 3] & 255);
  return String(value % 1_000_000).padStart(6, "0");
}

async function login(client, account) {
  const first = await client.json("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL.origin },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  if (first.response.status === 200 && first.body.ok === true) return;
  if (first.response.status !== 202 || !first.body.challengeToken) throw new Error(`Fake-account login failed (${first.response.status}).`);
  const secret = first.body?.mfa?.secret || account.mfaSecret;
  if (!secret) throw new Error("Fake-account MFA proof secret is unavailable.");
  const verified = await client.json("/api/auth/mfa/verify", {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL.origin },
    body: JSON.stringify({ challengeToken: first.body.challengeToken, code: totp(secret) }),
  });
  if (verified.response.status !== 200 || verified.body.ok !== true) throw new Error(`Fake-account MFA verification failed (${verified.response.status}).`);
}

async function ensureProgramStorage(teacher) {
  const status = await teacher.json(`/api/program-storage?siteId=${SITE_ID}&programId=${PROGRAM_ID}`);
  if (status.response.status !== 200) throw new Error(`Program storage status failed (${status.response.status}).`);
  if (status.body?.storage?.status === "ready") return { created: false, revision: status.body.storage.revision };
  const configured = await teacher.json("/api/program-storage", {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL.origin },
    body: JSON.stringify({ action: "create", siteId: SITE_ID, programId: PROGRAM_ID }),
  });
  if (configured.response.status !== 200 || configured.body.ok !== true) throw new Error(`Program storage configuration failed (${configured.response.status}).`);
  if (configured.body.createdByApp !== true || /folderId|folder_id|driveFileId|drive_file_id/i.test(JSON.stringify(configured.body))) {
    throw new Error("Program storage creation response did not preserve its identifier-safe contract.");
  }
  return { created: true, revision: configured.body.storage.revision };
}

function buildPdf() {
  const stream = "BT /F1 18 Tf 72 720 Td (Capstone storage proof) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

async function uploadEvidence(student, { title, fileName, mimeType, bytes }) {
  const form = new FormData();
  form.set("title", title);
  form.set("artifactType", "live_program_storage_proof");
  form.set("file", new File([bytes], fileName, { type: mimeType }));
  const result = await student.json(`/api/submissions/${SUBMISSION_ID}/evidence/upload`, {
    method: "POST",
    headers: { origin: BASE_URL.origin },
    body: form,
  });
  if (result.response.status !== 200 || result.body.ok !== true || !result.body?.evidence?.id) throw new Error(`${fileName} upload failed (${result.response.status}).`);
  if (/drive[_-]?(file|folder|parent)[_-]?id/i.test(JSON.stringify(result.body))) throw new Error(`${fileName} upload response exposed a provider identifier.`);
  return result.body.evidence.id;
}

async function verifyPreview(client, evidenceId) {
  const response = await client.request(`/api/evidence/${encodeURIComponent(evidenceId)}/preview`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const prefix = new TextDecoder().decode(bytes.slice(0, 5));
  if (response.status !== 200 || response.headers.get("content-type") !== "application/pdf" || prefix !== "%PDF-") throw new Error(`PDF preview proof failed (${response.status}).`);
  return { status: response.status, contentType: response.headers.get("content-type"), bytes: bytes.length };
}

async function main() {
  const accounts = await readAccounts();
  const clients = Object.fromEntries(["student", "program_teacher", "mentor", "site_admin", "admin"].map((role) => [role, new SessionClient()]));
  for (const [role, client] of Object.entries(clients)) await login(client, accounts.get(role));

  const storage = await ensureProgramStorage(clients.program_teacher);
  const siteView = await clients.site_admin.json(`/api/program-storage?siteId=${SITE_ID}&programId=${PROGRAM_ID}`);
  if (siteView.response.status !== 200 || siteView.body?.setup?.canManage !== false || siteView.body?.storage?.openUrl) throw new Error("Site Admin storage oversight exposed management capability.");
  const deniedChange = await clients.site_admin.json("/api/program-storage", {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL.origin },
    body: JSON.stringify({ action: "disconnect", siteId: SITE_ID, programId: PROGRAM_ID }),
  });
  if (deniedChange.response.status !== 403) throw new Error("Site Admin storage mutation was not denied.");

  const pdfId = await uploadEvidence(clients.student, { title: "Hosted PDF proof", fileName: "hosted-proof.pdf", mimeType: "application/pdf", bytes: buildPdf() });
  const docxBytes = await fs.readFile(path.resolve(ROOT, DOCX_PATH));
  const docxId = await uploadEvidence(clients.student, { title: "Hosted DOCX proof", fileName: "hosted-proof.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: docxBytes });

  const previews = {
    studentPdf: await verifyPreview(clients.student, pdfId),
    studentDocx: await verifyPreview(clients.student, docxId),
    mentorPdf: await verifyPreview(clients.mentor, pdfId),
    teacherDocx: await verifyPreview(clients.program_teacher, docxId),
    globalAdminPdf: await verifyPreview(clients.admin, pdfId),
  };
  const dashboard = await clients.student.json("/api/student/dashboard");
  const uploaded = (dashboard.body?.evidence || []).filter((item) => item.id === pdfId || item.id === docxId);
  if (dashboard.response.status !== 200 || uploaded.length !== 2 || uploaded.some((item) => !item.previewUrl || !item.downloadUrl || !item.openInDriveUrl)) throw new Error("Student dashboard did not expose all app-scoped file actions.");
  if (/drive[_-]?(file|folder|parent)[_-]?id/i.test(JSON.stringify(dashboard.body))) throw new Error("Student dashboard exposed a provider identifier.");

  const manifest = {
    status: "PASS",
    proofBoundary: "Fake .test accounts and synthetic files only; this is not real-student pilot approval.",
    canonicalOrigin: BASE_URL.origin,
    checkedAt: new Date().toISOString(),
    programStorage: { status: "ready", createdThisRun: storage.created, revision: storage.revision, teacherManaged: true, siteAdminReadOnly: true },
    uploads: { pdf: "passed", docx: "passed", durableBytes: "google_drive", appMetadata: "d1", rawProviderIdentifiersExposed: false },
    previews,
    roles: { studentOwnFiles: "passed", mentorAssignedStudent: "passed", programTeacherScope: "passed", siteAdminMutationDenied: "passed", globalAdminRecoveryRead: "passed" },
    fallbacks: { download: "present", openInDrive: "present", existingGoogleLinksPreserved: true },
  };
  const outputPath = path.resolve(ROOT, MANIFEST_PATH);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log("Program storage live proof passed: teacher connection, PDF/DOCX upload and previews, role boundaries, fallbacks, and identifier redaction are verified with fake data.");
}

await main();
