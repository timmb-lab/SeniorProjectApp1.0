const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

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

type GoogleDriveTokenResponse = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
};

type GoogleDriveFileResponse = {
  id: string | null;
  mimeType: string | null;
  name: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: Record<string, unknown>, key: string): string | null {
  const property = value[key];
  return typeof property === "string" && property ? property : null;
}

function getPositiveNumber(value: Record<string, unknown>, key: string): number {
  const property = value[key];
  const numberValue = typeof property === "number"
    ? property
    : typeof property === "string" && property ? Number(property) : 0;
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function parseGoogleDriveTokenResponse(value: unknown): GoogleDriveTokenResponse {
  const record = isRecord(value) ? value : {};
  return {
    accessToken: getString(record, "access_token") || "",
    expiresIn: getPositiveNumber(record, "expires_in"),
    tokenType: getString(record, "token_type") || "Bearer",
  };
}

function parseGoogleDriveFileResponse(value: unknown): GoogleDriveFileResponse {
  const record = isRecord(value) ? value : {};
  return {
    id: getString(record, "id"),
    mimeType: getString(record, "mimeType"),
    name: getString(record, "name"),
  };
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

  const json = await response.json().catch((): unknown => null);
  const tokenResponse = parseGoogleDriveTokenResponse(json);
  if (!tokenResponse.accessToken) {
    throw new Error("google_drive_token_exchange_missing_access_token");
  }

  return {
    accessToken: tokenResponse.accessToken,
    expiresIn: tokenResponse.expiresIn,
    tokenType: tokenResponse.tokenType,
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

  const json = await response.json().catch((): unknown => null);
  const file = parseGoogleDriveFileResponse(json);
  return {
    ok: true,
    status: response.status,
    mimeType: file.mimeType,
    name: file.name,
  };
}

function cleanDriveFileName(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/[\r\n]+/g, " ");
  return trimmed ? trimmed.slice(0, 200) : fallback;
}

export async function uploadGoogleDriveFile(
  accessToken: string,
  input: {
    name: string;
    mimeType: string;
    parentFolderId?: string | null;
  },
  fileBytes: Uint8Array,
  options: { fetchFn?: typeof fetch } = {},
): Promise<{ ok: boolean; status: number; fileId: string | null; mimeType: string | null; name: string | null }> {
  const boundary = `sc_${crypto.randomUUID()}`;
  const mimeType = input.mimeType || "application/octet-stream";
  const metadata: Record<string, unknown> = {
    name: cleanDriveFileName(input.name, "evidence-upload"),
    mimeType,
  };
  if (input.parentFolderId) {
    metadata.parents = [input.parentFolderId];
  }

  const delimiter = `--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const body = new Blob([
    delimiter,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify(metadata),
    "\r\n",
    delimiter,
    `Content-Type: ${mimeType}\r\n\r\n`,
    fileBytes,
    closeDelimiter,
  ]);

  const url = new URL(DRIVE_UPLOAD_URL);
  url.searchParams.set("uploadType", "multipart");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,name,mimeType,size");

  const fetchFn = options.fetchFn || fetch;
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": `multipart/related; boundary=${boundary}`,
      accept: "application/json",
    },
    body,
  });

  if (!response.ok) {
    return { ok: false, status: response.status, fileId: null, mimeType: null, name: null };
  }

  const json = await response.json().catch((): unknown => null);
  const file = parseGoogleDriveFileResponse(json);
  const fileId = file.id || "";
  return {
    ok: Boolean(fileId),
    status: response.status,
    fileId: fileId || null,
    mimeType: file.mimeType,
    name: file.name,
  };
}

export async function uploadGoogleDriveFileResumable(
  accessToken: string,
  input: {
    name: string;
    mimeType: string;
    parentFolderId?: string | null;
  },
  fileBytes: Uint8Array,
  options: { fetchFn?: typeof fetch } = {},
): Promise<{ ok: boolean; status: number; fileId: string | null; mimeType: string | null; name: string | null }> {
  const mimeType = input.mimeType || "application/octet-stream";
  const metadata: Record<string, unknown> = {
    name: cleanDriveFileName(input.name, "evidence-upload"),
    mimeType,
  };
  if (input.parentFolderId) {
    metadata.parents = [input.parentFolderId];
  }

  const url = new URL(DRIVE_UPLOAD_URL);
  url.searchParams.set("uploadType", "resumable");
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,name,mimeType,size");

  const fetchFn = options.fetchFn || fetch;
  const initResponse = await fetchFn(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=UTF-8",
      accept: "application/json",
      "x-upload-content-type": mimeType,
      "x-upload-content-length": String(fileBytes.length),
    },
    body: JSON.stringify(metadata),
  });

  const resumableUri = initResponse.headers.get("location") || initResponse.headers.get("Location");
  if (!initResponse.ok || !resumableUri) {
    return { ok: false, status: initResponse.status, fileId: null, mimeType: null, name: null };
  }

  const putResponse = await fetchFn(resumableUri, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": mimeType,
      "content-range": fileBytes.length > 0 ? `bytes 0-${fileBytes.length - 1}/${fileBytes.length}` : "bytes */0",
      accept: "application/json",
    },
    body: fileBytes,
  });

  if (!putResponse.ok) {
    return { ok: false, status: putResponse.status, fileId: null, mimeType: null, name: null };
  }

  const json = await putResponse.json().catch((): unknown => null);
  const file = parseGoogleDriveFileResponse(json);
  const fileId = file.id || "";
  return {
    ok: Boolean(fileId),
    status: putResponse.status,
    fileId: fileId || null,
    mimeType: file.mimeType,
    name: file.name,
  };
}

export async function downloadGoogleDriveFileMedia(
  accessToken: string,
  fileId: string,
  options: { fetchFn?: typeof fetch } = {},
): Promise<Response> {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("supportsAllDrives", "true");

  const fetchFn = options.fetchFn || fetch;
  return fetchFn(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}
