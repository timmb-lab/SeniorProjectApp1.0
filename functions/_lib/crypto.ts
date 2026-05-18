const PASSWORD_ITERATIONS = 100000;

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

async function derivePasswordBits(password: string, salt: Uint8Array, pepper = ""): Promise<ArrayBuffer> {
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
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  );
}

export async function hashPassword(password: string, pepper = ""): Promise<{
  hash: string;
  salt: string;
  algorithm: "PBKDF2-SHA-256";
  iterations: number;
}> {
  const salt = new Uint8Array(24);
  crypto.getRandomValues(salt);
  const derived = new Uint8Array(await derivePasswordBits(password, salt, pepper));
  return {
    hash: bytesToBase64Url(derived),
    salt: bytesToBase64Url(salt),
    algorithm: "PBKDF2-SHA-256",
    iterations: PASSWORD_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
  pepper = "",
): Promise<boolean> {
  const salt = base64UrlToBytes(storedSalt);
  const derived = new Uint8Array(await derivePasswordBits(password, salt, pepper));
  return equalBytes(derived, base64UrlToBytes(storedHash));
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
