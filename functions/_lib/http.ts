const JSON_BODY_ENCODER = new TextEncoder();

export function json(data: unknown, init: ResponseInit = {}): Response {
  const body = JSON.stringify(data);
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("content-length", String(JSON_BODY_ENCODER.encode(body).byteLength));
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return new Response(body, { ...init, headers });
}

const MAX_JSON_BODY_BYTES = 16 * 1024;

export async function readJson<T>(request: Request): Promise<T> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    throw new Error("Expected application/json request body.");
  }
  if (declaredJsonBodyTooLarge(request)) {
    throw new Error("Request body is too large.");
  }
  const body = await request.text();
  if (JSON_BODY_ENCODER.encode(body).byteLength > MAX_JSON_BODY_BYTES) {
    throw new Error("Request body is too large.");
  }
  return JSON.parse(body) as T;
}

function isJsonContentType(contentType: string | null): boolean {
  const mediaType = (contentType || "").split(";")[0].trim().toLowerCase();
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function declaredJsonBodyTooLarge(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return false;
  }
  const byteLength = Number(contentLength);
  return Number.isFinite(byteLength) && byteLength > MAX_JSON_BODY_BYTES;
}

export function badRequest(message = "bad_request"): Response {
  return json({ error: message }, { status: 400 });
}

export function methodNotAllowed(): Response {
  return json({ error: "method_not_allowed" }, { status: 405 });
}

export function requirePost(request: Request): Response | null {
  return requireMutationMethod(request, "POST");
}

export function requireDelete(request: Request): Response | null {
  return requireMutationMethod(request, "DELETE");
}

function requireMutationMethod(request: Request, method: string): Response | null {
  if (request.method !== method) {
    return methodNotAllowed();
  }
  if (!hasAllowedMutationOrigin(request)) {
    return json({ error: "cross_origin_post_denied" }, { status: 403 });
  }
  return null;
}

function hasAllowedMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}
