import type { Env } from "../../../_types.ts";
import { writeAudit } from "../../../_lib/auth.ts";
import {
  allowedGoogleDomains,
  authMode,
  hasGoogleOAuthClientConfig,
  isGoogleSsoEnabled,
} from "../../../_lib/auth-config.ts";
import { buildGoogleAuthUrl, getGoogleDiscovery, GoogleOAuthError } from "../../../_lib/google-oauth.ts";
import { json } from "../../../_lib/http.ts";
import { createOAuthState, safeReturnTo } from "../../../_lib/oauth-state.ts";

type GoogleSsoStartStep = "env_check" | "request" | "oauth_state" | "google_discovery" | "auth_url" | "audit";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const allowedDomains = allowedGoogleDomains(env);
  if (!isGoogleSsoEnabled(env)) {
    logGoogleSsoStartFailure(env, {
      reason: "sso_env_disabled",
      step: "env_check",
      hasAllowedDomains: allowedDomains.length > 0,
    });
    return json({ ok: false, error: "sso_not_configured" }, { status: 503 });
  }

  let step: GoogleSsoStartStep = "request";
  try {
    const url = new URL(request.url);
    const returnTo = safeReturnTo(url.searchParams.get("returnTo") || "") || "/workspace.html";
    const domainHint = cleanDomainHint(url.searchParams.get("domain") || url.searchParams.get("tenant"));
    const hostedDomain = domainHint && (allowedDomains.length === 0 || allowedDomains.includes(domainHint))
      ? domainHint
      : allowedDomains[0] || "";
    step = "oauth_state";
    const state = await createOAuthState(env, { tenantHint: hostedDomain || domainHint || null, returnTo });
    step = "google_discovery";
    const discovery = await getGoogleDiscovery(fetch);
    step = "auth_url";
    const location = buildGoogleAuthUrl({
      authorizationEndpoint: discovery.authorization_endpoint,
      clientId: env.GOOGLE_OAUTH_CLIENT_ID || "",
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI || "",
      state: state.state,
      nonce: state.nonce,
      hostedDomain,
    });

    step = "audit";
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
    logGoogleSsoStartFailure(env, {
      reason: googleSsoStartFailureReason(step),
      step,
      hasAllowedDomains: allowedDomains.length > 0,
      error,
    });
    return json({ ok: false, error: code }, { status: 503 });
  }
};

function cleanDomainHint(value: string | null): string {
  const trimmed = String(value || "").trim().toLowerCase().replace(/^@/, "");
  return /^[a-z0-9.-]+$/.test(trimmed) ? trimmed : "";
}

function googleSsoStartFailureReason(step: GoogleSsoStartStep): string {
  if (step === "oauth_state") return "sso_oauth_state_failed";
  if (step === "google_discovery") return "sso_google_discovery_failed";
  if (step === "auth_url") return "sso_auth_url_failed";
  return "sso_start_failed";
}

function logGoogleSsoStartFailure(
  env: Env,
  input: {
    reason: string;
    step: GoogleSsoStartStep;
    hasAllowedDomains: boolean;
    error?: unknown;
  },
): void {
  console.error("google_sso_start_failed", {
    route: "/api/auth/google/start",
    reason: input.reason,
    step: input.step,
    authMode: authMode(env),
    googleSsoConfigured: hasGoogleOAuthClientConfig(env),
    googleSsoEnabled: isGoogleSsoEnabled(env),
    hasAllowedDomains: input.hasAllowedDomains,
    ...safeErrorDetails(input.error),
  });
}

function safeErrorDetails(error: unknown): Record<string, string> {
  if (!error) return {};
  if (error instanceof Error) {
    return {
      errorName: safeLogText(error.name, 80),
      errorMessage: safeLogText(error.message, 180),
    };
  }
  return {
    errorName: typeof error,
    errorMessage: safeLogText(String(error), 180),
  };
}

function safeLogText(value: string, maxLength: number): string {
  return value
    .replace(
      /\b(client[_-]?secret|password|pepper|private[_-]?key|token|state|nonce)\b\s*[:=]\s*["']?[^"',\s;)]*/gi,
      "$1=[redacted]",
    )
    .replace(/[A-Za-z0-9_-]{80,}/g, "[redacted]")
    .slice(0, maxLength);
}
