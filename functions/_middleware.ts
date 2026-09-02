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
