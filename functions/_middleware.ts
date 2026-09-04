import type { Env } from "./_types.ts";
import { applyApiSecurityHeaders } from "./_lib/http.ts";

const INTERNAL_QA_PATHS = new Set([
  "/alpha.html",
  "/alpha.js",
  "/alpha.css",
  "/account.html",
  "/account.js",
  "/account.css",
  "/app-preview.html",
]);

const CANONICAL_HOST = "thecapstoneproject.com";
const REDIRECT_HOSTS = new Set([
  "www.thecapstoneproject.com",
  "thecapstoneapp.com",
  "www.thecapstoneapp.com",
  "senior-capstone-app.pages.dev",
  // Safety nets only. These hostnames must not remain attached to Pages or DNS.
  "app.thecapstoneproject.com",
  "app.thecapstoneapp.com",
]);
const LEGACY_WORKSPACE_PATHS = new Set(["/workspace", "/workspace/", "/workspace.html", "/index.html"]);
const PRODUCTION_STATIC_PATHS = new Set(["/", "/styles.css", "/workspace.css"]);
const PRODUCTION_PATH_PREFIXES = ["/api/", "/assets/", "/templates/", "/workspace/", "/cdn-cgi/"];
const ADMIN_MODE_HEADER = "x-capstone-admin-mode";
const ADMIN_MODE_SITE_HEADER = "x-capstone-site-id";

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const requestUrl = new URL(request.url);
  if (REDIRECT_HOSTS.has(requestUrl.hostname.toLowerCase())) {
    requestUrl.hostname = CANONICAL_HOST;
    requestUrl.protocol = "https:";
    requestUrl.port = "";
    if (LEGACY_WORKSPACE_PATHS.has(requestUrl.pathname)) requestUrl.pathname = "/";
    return Response.redirect(requestUrl.toString(), 308);
  }

  if (LEGACY_WORKSPACE_PATHS.has(requestUrl.pathname)) {
    requestUrl.pathname = "/";
    return Response.redirect(requestUrl.toString(), 308);
  }

  const requestedAdminMode = String(request.headers.get(ADMIN_MODE_HEADER) || "").trim().toLowerCase();
  if (requestUrl.pathname.startsWith("/api/") && requestedAdminMode === "site_admin") {
    const workingSiteId = cleanWorkingSiteId(request.headers.get(ADMIN_MODE_SITE_HEADER));
    if (requestUrl.pathname.startsWith("/api/admin/")) {
      return workingModeError("global_admin_mode_required", 403);
    }
    const querySiteId = requestUrl.searchParams.has("siteId")
      ? cleanWorkingSiteId(requestUrl.searchParams.get("siteId"))
      : "";
    if (requestUrl.searchParams.has("siteId") && (!querySiteId || !workingSiteId || querySiteId !== workingSiteId)) {
      return workingModeError("working_site_mismatch", 403);
    }
  }

  const internalQaEnabled = ["local", "development", "test"].includes(String(env.APP_ENV || "").trim().toLowerCase());
  if (!internalQaEnabled && INTERNAL_QA_PATHS.has(requestUrl.pathname)) {
    const headers = applyApiSecurityHeaders(new Headers({
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    }));
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  }
  if (!internalQaEnabled
    && !PRODUCTION_STATIC_PATHS.has(requestUrl.pathname)
    && !PRODUCTION_PATH_PREFIXES.some((prefix) => requestUrl.pathname.startsWith(prefix))) {
    const headers = applyApiSecurityHeaders(new Headers({
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    }));
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  }
  return next();
};

function cleanWorkingSiteId(value: string | null): string {
  const clean = String(value || "").trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(clean) ? clean : "";
}

function workingModeError(error: string, status: number): Response {
  const headers = applyApiSecurityHeaders(new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    vary: `${ADMIN_MODE_HEADER}, ${ADMIN_MODE_SITE_HEADER}`,
  }));
  return new Response(JSON.stringify({ error, workingMode: "site_admin" }), { status, headers });
}
