import type { Env } from "../_types.ts";
import { newRandomToken, randomId, sha256Hex } from "./crypto.ts";

const MFA_WINDOW_SECONDS = 30;
const MFA_CHALLENGE_MINUTES = 10;
const MFA_REQUIRED_ROLES = ["program_teacher", "viewer"];
const MFA_EXEMPT_ADMIN_ROLES = ["administration", "site_admin", "global_admin", "platform_admin", "admin", "misc_admin"];
const MFA_RELEVANT_ROLES = [...new Set([...MFA_REQUIRED_ROLES, ...MFA_EXEMPT_ADMIN_ROLES])];

export interface MfaChallengeResult {
  challengeToken: string;
  challengeType: "enroll" | "login";
  secret?: string;
  otpauthUrl?: string;
}

export function staffMfaEnabled(env: Env): boolean {
  return ["1", "true", "yes", "on"].includes(String(env.AUTH_STAFF_MFA_REQUIRED || "").trim().toLowerCase());
}

export async function userNeedsStaffMfa(env: Env, userId: string): Promise<boolean> {
  if (!staffMfaEnabled(env)) return false;
  const rows = await env.DB.prepare(
    `SELECT role_id FROM user_roles
     WHERE user_id = ? AND role_id IN (${MFA_RELEVANT_ROLES.map(() => "?").join(", ")})`,
  ).bind(userId, ...MFA_RELEVANT_ROLES).all<{ role_id: string }>();
  const roleIds = new Set((rows.results || []).map((row) => row.role_id));
  if (MFA_EXEMPT_ADMIN_ROLES.some((roleId) => roleIds.has(roleId))) return false;
  return MFA_REQUIRED_ROLES.some((roleId) => roleIds.has(roleId));
}

export async function beginMfaChallenge(env: Env, user: { id: string; email: string }): Promise<MfaChallengeResult> {
  const enrolled = await env.DB.prepare(
    "SELECT secret_ciphertext FROM auth_mfa_totp WHERE user_id = ? AND status = 'active' LIMIT 1",
  ).bind(user.id).first<{ secret_ciphertext: string }>();
  const challengeType: "enroll" | "login" = enrolled?.secret_ciphertext ? "login" : "enroll";
  const secret = challengeType === "enroll" ? generateTotpSecret() : "";
  const secretCiphertext = secret ? await encryptMfaSecret(env, secret) : null;
  const challengeToken = newRandomToken(32);
  const tokenHash = await mfaTokenHash(env, challengeToken);
  const challengeId = randomId("mfa_challenge");
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE auth_mfa_challenges
       SET consumed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE user_id = ? AND consumed_at IS NULL`,
    ).bind(user.id),
    env.DB.prepare(
      `INSERT INTO auth_mfa_challenges (id, user_id, token_hash, challenge_type, secret_ciphertext, expires_at)
       VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?))`,
    ).bind(challengeId, user.id, tokenHash, challengeType, secretCiphertext, `+${MFA_CHALLENGE_MINUTES} minutes`),
  ]);
  return {
    challengeToken,
    challengeType,
    ...(secret ? {
      secret,
      otpauthUrl: `otpauth://totp/${encodeURIComponent(`Senior Project:${user.email}`)}?secret=${secret}&issuer=${encodeURIComponent("Senior Project")}&digits=6&period=30`,
    } : {}),
  };
}

export async function mfaTokenHash(env: Env, token: string): Promise<string> {
  return sha256Hex(`${env.SESSION_PEPPER || ""}:staff-mfa-challenge:${token}`);
}

export function normalizeMfaCode(value: unknown): string {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function verifyTotp(secret: string, code: string, lastUsedStep: number | null = null): Promise<number | null> {
  if (!/^\d{6}$/.test(code)) return null;
  const currentStep = Math.floor(Date.now() / 1000 / MFA_WINDOW_SECONDS);
  for (const step of [currentStep - 1, currentStep, currentStep + 1]) {
    if (lastUsedStep !== null && step <= lastUsedStep) continue;
    if (await totpForStep(secret, step) === code) return step;
  }
  return null;
}

export function totpCodeForSecret(secret: string, timestampMs = Date.now()): Promise<string> {
  return totpForStep(secret, Math.floor(timestampMs / 1000 / MFA_WINDOW_SECONDS));
}

export async function encryptMfaSecret(env: Env, secret: string): Promise<string> {
  const key = await encryptionKey(env);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(secret));
  return `${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptMfaSecret(env: Env, ciphertext: string): Promise<string> {
  const [ivValue, bodyValue] = String(ciphertext || "").split(".");
  if (!ivValue || !bodyValue) throw new Error("invalid_mfa_secret");
  const key = await encryptionKey(env);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toBuffer(fromBase64Url(ivValue)) },
    key,
    toBuffer(fromBase64Url(bodyValue)),
  );
  return new TextDecoder().decode(plaintext);
}

export function generateRecoveryCodes(count = 8): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: count }, () => {
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    return `${value.slice(0, 5)}-${value.slice(5)}`;
  });
}

export async function recoveryCodeHash(env: Env, code: string): Promise<string> {
  return sha256Hex(`${env.SESSION_PEPPER || ""}:staff-mfa-recovery:${normalizeMfaCode(code)}`);
}

function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

async function totpForStep(secret: string, step: number): Promise<string> {
  const counter = new Uint8Array(8);
  let remaining = step;
  for (let index = 7; index >= 0; index -= 1) {
    counter[index] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  const key = await crypto.subtle.importKey("raw", toBuffer(base32Decode(secret)), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, toBuffer(counter)));
  const offset = digest[digest.length - 1] & 0x0f;
  const value = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
}

async function encryptionKey(env: Env): Promise<CryptoKey> {
  const material = String(env.MFA_ENCRYPTION_KEY || env.SESSION_PEPPER || "");
  if (!material) throw new Error("mfa_encryption_key_missing");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`senior-project-mfa:v1:${material}`));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(value: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let buffer = 0;
  const output: number[] = [];
  for (const character of value.toUpperCase().replace(/=+$/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("invalid_mfa_secret");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
