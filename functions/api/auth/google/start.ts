import type { Env } from "../../../_types.ts";
import { writeAudit } from "../../../_lib/auth.ts";
import { allowedGoogleDomains, isGoogleSsoEnabled } from "../../../_lib/auth-config.ts";
import { buildGoogleAuthUrl, getGoogleDiscovery, GoogleOAuthError } from "../../../_lib/google-oauth.ts";
import { json } from "../../../_lib/http.ts";
import { createOAuthState, safeReturnTo } from "../../../_lib/oauth-state.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!isGoogleSsoEnabled(env)) {
    return json({ ok: false, error: "sso_not_configured" }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const returnTo = safeReturnTo(url.searchParams.get("returnTo") || "") || "/workspace.html";
    const domainHint = cleanDomainHint(url.searchParams.get("domain") || url.searchParams.get("tenant"));
    const allowedDomains = allowedGoogleDomains(env);
    const hostedDomain = domainHint && (allowedDomains.length === 0 || allowedDomains.includes(domainHint))
      ? domainHint
      : allowedDomains[0] || "";
    const state = await createOAuthState(env, { tenantHint: hostedDomain || domainHint || null, returnTo });
    const discovery = await getGoogleDiscovery(fetch);

    await writeAudit(env, {
      actorUserId: null,
      action: "google_sso_login_started",
      entityType: "auth_session",
      entityId: null,
      request,
      metadata: {
        hostedDomainHint: hostedDomain || null,
        returnTo,
      },
    });

    const location = buildGoogleAuthUrl({
      authorizationEndpoint: discovery.authorization_endpoint,
      clientId: env.GOOGLE_OAUTH_CLIENT_ID || "",
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI || "",
      state: state.state,
      nonce: state.nonce,
      hostedDomain,
    });

    return new Response(null, {
      status: 302,
      headers: {
        location,
        "set-cookie": state.stateCookie,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const code = error instanceof GoogleOAuthError ? error.code : "sso_not_configured";
    return json({ ok: false, error: code }, { status: 503 });
  }
};

function cleanDomainHint(value: string | null): string {
  const trimmed = String(value || "").trim().toLowerCase().replace(/^@/, "");
  return /^[a-z0-9.-]+$/.test(trimmed) ? trimmed : "";
}
