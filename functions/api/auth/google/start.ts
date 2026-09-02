import type { Env } from "../../../_types.ts";
import { securityFingerprint, writeAudit } from "../../../_lib/auth.ts";
import {
  allowedGoogleDomains,
  authMode,
  hasGoogleOAuthClientConfig,
  isGoogleSsoEnabled,
} from "../../../_lib/auth-config.ts";
import { buildGoogleAuthUrl, getGoogleDiscovery, GoogleOAuthError } from "../../../_lib/google-oauth.ts";
import { applyApiSecurityHeaders, getClientIp, json } from "../../../_lib/http.ts";
import { createOAuthState, safeReturnTo } from "../../../_lib/oauth-state.ts";
import { authSecretsConfigured } from "../../../_lib/auth-config.ts";

type GoogleSsoStartStep = "env_check" | "request" | "oauth_state" | "google_discovery" | "auth_url" | "audit";
const SSO_START_WINDOW_MINUTES = 15;
const MAX_SSO_STARTS_PER_IP = 30;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const allowedDomains = allowedGoogleDomains(env);
  if (!authSecretsConfigured(env)) {
    return json({ ok: false, error: "sso_not_configured" }, { status: 503 });
  }
  if (!isGoogleSsoEnabled(env)) {
    logGoogleSsoStartFailure(env, {
      reason: "sso_env_disabled",
      step: "env_check",
      hasAllowedDomains: allowedDomains.length > 0,
    });
    return json({ ok: false, error: "sso_not_configured" }, { status: 503 });
  }

  const ipHash = await securityFingerprint(env, `ip:${getClientIp(request)}`);
  const recentStarts = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM audit_events
     WHERE action = 'google_sso_start_attempt'
       AND ip_hash = ?
       AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
  ).bind(ipHash, `-${SSO_START_WINDOW_MINUTES} minutes`).first<{ count: number }>();
  if (Number(recentStarts?.count || 0) >= MAX_SSO_STARTS_PER_IP) {
    return json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  await writeAudit(env, {
    actorUserId: null,
    action: "google_sso_start_attempt",
    entityType: "auth_session",
    entityId: null,
    request,
    metadata: { allowedDomainConfigured: allowedDomains.length > 0 },
  });

  let step: GoogleSsoStartStep = "request";
  try {
    step = "oauth_state";
    await env.DB.prepare(
      `DELETE FROM oauth_states
       WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          OR (used_at IS NOT NULL AND used_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day'))`,
    ).run();
    const url = new URL(request.url);
    const returnTo = safeReturnTo(url.searchParams.get("returnTo") || "") || "/";
    const domainHint = cleanDomainHint(url.searchParams.get("domain") || url.searchParams.get("tenant"));
    const hostedDomain = domainHint && (allowedDomains.length === 0 || allowedDomains.includes(domainHint))
      ? domainHint
      : allowedDomains[0] || "";
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

    const headers = applyApiSecurityHeaders(new Headers({
      location,
      "set-cookie": state.stateCookie,
      "cache-control": "no-store",
    }));
    return new Response(null, {
      status: 302,
      headers,
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
