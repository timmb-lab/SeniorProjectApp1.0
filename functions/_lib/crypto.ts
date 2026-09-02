// Cloudflare Workers' Web Crypto implementation caps PBKDF2 at 100,000
// iterations. A server-side pepper plus login throttling provide the remaining
// defense in depth without generating hashes the production runtime cannot
// verify.
export const PASSWORD_ITERATIONS = 100000;
const MIN_SUPPORTED_PASSWORD_ITERATIONS = 100000;
const MAX_SUPPORTED_PASSWORD_ITERATIONS = 100000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function newRandomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return bytesToBase64Url(buffer);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function derivePasswordBits(
  password: string,
  salt: Uint8Array,
  pepper = "",
  iterations = PASSWORD_ITERATIONS,
): Promise<ArrayBuffer> {
  if (!Number.isInteger(iterations)
    || iterations < MIN_SUPPORTED_PASSWORD_ITERATIONS
    || iterations > MAX_SUPPORTED_PASSWORD_ITERATIONS) {
    throw new Error("Unsupported password hash work factor.");
  }
  const passwordBytes = new TextEncoder().encode(`${pepper}${password}`);
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(passwordBytes),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations,
    },
    key,
    256,
  );
}

export async function hashPassword(password: string, pepper = "", iterations = PASSWORD_ITERATIONS): Promise<{
  hash: string;
  salt: string;
  algorithm: "PBKDF2-SHA-256";
  iterations: number;
}> {
  const salt = new Uint8Array(24);
  crypto.getRandomValues(salt);
  const derived = new Uint8Array(await derivePasswordBits(password, salt, pepper, iterations));
  return {
    hash: bytesToBase64Url(derived),
    salt: bytesToBase64Url(salt),
    algorithm: "PBKDF2-SHA-256",
    iterations,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
  pepper = "",
  iterations = PASSWORD_ITERATIONS,
): Promise<boolean> {
  try {
    const salt = base64UrlToBytes(storedSalt);
    const derived = new Uint8Array(await derivePasswordBits(password, salt, pepper, iterations));
    return equalBytes(derived, base64UrlToBytes(storedHash));
  } catch {
    return false;
  }
}

export async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  if (!secret) throw new Error("Fingerprint key is required.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function validatePassword(password: string, context: { email?: string; displayName?: string } = {}): string[] {
  const errors: string[] = [];
  if (password.length < 14) errors.push("Password must be at least 14 characters.");
  if (!/[a-z]/.test(password)) errors.push("Password must include a lowercase letter.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include an uppercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include a number.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must include a symbol.");
  const lower = password.toLowerCase();
  const emailLocal = context.email?.split("@")[0]?.trim().toLowerCase();
  if (emailLocal && emailLocal.length >= 4 && lower.includes(emailLocal)) {
    errors.push("Password must not include the email username.");
  }
  const nameParts = (context.displayName || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 4);
  if (nameParts.some((part) => lower.includes(part))) {
    errors.push("Password must not include the display name.");
  }
  return errors;
}
