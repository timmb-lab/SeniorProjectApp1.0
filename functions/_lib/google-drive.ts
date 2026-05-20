const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

function isConfiguredSecret(value?: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized
      && !normalized.startsWith("pending")
      && !normalized.startsWith("replace-with")
      && normalized !== "undefined"
      && normalized !== "null",
  );
}

function normalizePrivateKey(value: string): string {
  return String(value || "").replace(/\\n/g, "\n").trim();
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeJson(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = String(pem)
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) {
    throw new Error("Invalid PEM private key.");
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signJwtRs256(privateKeyPem: string, payload: Record<string, unknown>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: payload.iat ?? now,
    exp: payload.exp ?? now + 60 * 60,
  };

  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(body);
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importRsaPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export function googleDriveCredentialParts(env: { GOOGLE_DRIVE_CLIENT_EMAIL?: string; GOOGLE_DRIVE_PRIVATE_KEY?: string }): {
  clientEmail: boolean;
  privateKey: boolean;
} {
  return {
    clientEmail: isConfiguredSecret(env.GOOGLE_DRIVE_CLIENT_EMAIL),
    privateKey: isConfiguredSecret(env.GOOGLE_DRIVE_PRIVATE_KEY),
  };
}

export async function getGoogleDriveAccessToken(
  env: { GOOGLE_DRIVE_CLIENT_EMAIL?: string; GOOGLE_DRIVE_PRIVATE_KEY?: string },
  options: { fetchFn?: typeof fetch } = {},
): Promise<{ accessToken: string; expiresIn: number; tokenType: string }> {
  const credentialParts = googleDriveCredentialParts(env);
  if (!credentialParts.clientEmail || !credentialParts.privateKey) {
    throw new Error("missing_google_drive_credentials");
  }

  const clientEmail = String(env.GOOGLE_DRIVE_CLIENT_EMAIL || "").trim();
  const privateKeyPem = normalizePrivateKey(String(env.GOOGLE_DRIVE_PRIVATE_KEY || ""));
  const assertion = await signJwtRs256(privateKeyPem, {
    iss: clientEmail,
    scope: DRIVE_SCOPE,
    aud: TOKEN_AUDIENCE,
  });

  const fetchFn = options.fetchFn || fetch;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }).toString();

  const response = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`google_drive_token_exchange_failed:${response.status}:${text || response.statusText}`);
  }

  const json = await response.json().catch(() => null);
  const accessToken = json?.access_token ? String(json.access_token) : "";
  if (!accessToken) {
    throw new Error("google_drive_token_exchange_missing_access_token");
  }

  const expiresIn = Number(json?.expires_in || 0);
  return {
    accessToken,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 0,
    tokenType: json?.token_type ? String(json.token_type) : "Bearer",
  };
}

export async function probeGoogleDriveFile(
  accessToken: string,
  fileId: string,
  options: { fetchFn?: typeof fetch } = {},
): Promise<{ ok: boolean; status: number; mimeType: string | null; name: string | null }> {
  if (!fileId) {
    return { ok: false, status: 0, mimeType: null, name: null };
  }

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("fields", "id,name,mimeType,trashed");
  url.searchParams.set("supportsAllDrives", "true");

  const fetchFn = options.fetchFn || fetch;
  const response = await fetchFn(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return { ok: false, status: response.status, mimeType: null, name: null };
  }

  const json = await response.json().catch(() => null);
  return {
    ok: true,
    status: response.status,
    mimeType: json?.mimeType ? String(json.mimeType) : null,
    name: json?.name ? String(json.name) : null,
  };
}

