export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

const MAX_JSON_BODY_BYTES = 16 * 1024;

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected application/json request body.");
  }
  const body = await request.text();
  if (body.length > MAX_JSON_BODY_BYTES) {
    throw new Error("Request body is too large.");
  }
  return JSON.parse(body) as T;
}

export function badRequest(message = "bad_request"): Response {
  return json({ error: message }, { status: 400 });
}

export function methodNotAllowed(): Response {
  return json({ error: "method_not_allowed" }, { status: 405 });
}

export function requirePost(request: Request): Response | null {
  return request.method === "POST" ? null : methodNotAllowed();
}

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}
