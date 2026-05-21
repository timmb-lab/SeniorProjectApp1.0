import type { Env } from "../../../_types.ts";
import { createSession, sessionCookie, writeAudit } from "../../../_lib/auth.ts";
import { allowedGoogleDomains, isGoogleSsoEnabled } from "../../../_lib/auth-config.ts";
import {
  exchangeGoogleCodeForTokens,
  GoogleOAuthError,
  linkOrCreateUserForGoogleIdentity,
  resolveTenantForGoogleIdentity,
  verifyGoogleIdToken,
} from "../../../_lib/google-oauth.ts";
import { json } from "../../../_lib/http.ts";
import { clearOAuthStateCookie, consumeOAuthState, safeReturnTo } from "../../../_lib/oauth-state.ts";

const SAFE_SSO_ERRORS = new Set([
  "sso_not_configured",
  "sso_invalid_state",
  "sso_token_exchange_failed",
  "sso_invalid_id_token",
  "sso_email_not_verified",
  "sso_domain_not_allowed",
  "sso_tenant_inactive",
  "sso_account_not_provisioned",
]);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!isGoogleSsoEnabled(env)) {
    return authErrorResponse(request, "sso_not_configured", "/workspace.html", 503);
  }

  let returnTo = "/workspace.html";
  let actorUserId: string | null = null;
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("error")) {
      throw new GoogleOAuthError("sso_token_exchange_failed");
    }

    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    if (!code || !state) throw new GoogleOAuthError("sso_invalid_state");

    const oauthState = await consumeOAuthState(env, state, request.headers.get("cookie"));
    if (!oauthState) throw new GoogleOAuthError("sso_invalid_state");
    returnTo = safeReturnTo(oauthState.return_to || "") || "/workspace.html";

    const tokens = await exchangeGoogleCodeForTokens({
      code,
      clientId: env.GOOGLE_OAUTH_CLIENT_ID || "",
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI || "",
      fetcher: fetch,
    });

    const claims = await verifyGoogleIdToken({
      idToken: tokens.id_token,
      clientId: env.GOOGLE_OAUTH_CLIENT_ID || "",
      expectedNonceHash: oauthState.nonce_hash,
      allowedHostedDomains: allowedGoogleDomains(env),
      issuerAllowlist: issuerAllowlist(env),
      fetcher: fetch,
    });
    const tenant = await resolveTenantForGoogleIdentity(env, claims);
    const user = await linkOrCreateUserForGoogleIdentity(env, claims, tenant);
    actorUserId = user.id;

    const session = await createSession(request, env, user.id);
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_sso_login_completed",
      entityType: "auth_session",
      entityId: session.sessionId,
      request,
      metadata: {
        tenantId: tenant.tenant.id,
        hostedDomain: tenant.hostedDomain,
      },
    });

    return redirect(returnTo, [
      sessionCookie(session.token, env),
      clearOAuthStateCookie(),
    ]);
  } catch (error) {
    const code = safeSsoErrorCode(error);
    await writeAudit(env, {
      actorUserId,
      action: "google_sso_login_denied",
      entityType: "auth_session",
      entityId: null,
      request,
      metadata: { reason: code },
    });
    return authErrorResponse(request, code, returnTo, code === "sso_not_configured" ? 503 : 400);
  }
};

function authErrorResponse(request: Request, code: string, returnTo: string, status: number): Response {
  if ((request.headers.get("accept") || "").includes("application/json")) {
    return json({ ok: false, error: code }, {
      status,
      headers: { "set-cookie": clearOAuthStateCookie() },
    });
  }

  const target = new URL(safeReturnTo(returnTo) || "/workspace.html", "https://app.thecapstoneapp.com");
  target.searchParams.set("authError", code);
  return redirect(`${target.pathname}${target.search}`, [clearOAuthStateCookie()]);
}

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({
    location,
    "cache-control": "no-store",
  });
  for (const cookie of cookies) {
    headers.append("set-cookie", cookie);
  }
  return new Response(null, { status: 302, headers });
}

function issuerAllowlist(env: Env): string[] {
  return String(env.GOOGLE_OAUTH_ISSUER_ALLOWLIST || "")
    .split(/[,\s]+/)
    .map((issuer) => issuer.trim())
    .filter(Boolean);
}

function safeSsoErrorCode(error: unknown): string {
  const code = error instanceof GoogleOAuthError ? error.code : "sso_invalid_id_token";
  return SAFE_SSO_ERRORS.has(code) ? code : "sso_invalid_id_token";
}
