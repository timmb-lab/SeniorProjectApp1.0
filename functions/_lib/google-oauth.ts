import type { Env, Tenant, UserAccount } from "../_types.ts";
import { normalizeEmail, randomId, sha256Hex } from "./crypto.ts";

export interface GoogleDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

export interface GoogleIdTokenClaims {
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
  sub: string;
  email: string;
  email_verified: boolean | string;
  hd?: string;
  nonce?: string;
  name?: string;
}

export interface ResolvedGoogleTenant {
  tenant: Tenant;
  hostedDomain: string;
  identityProvider: {
    id: string;
    status: "configured" | "disabled" | "needs_config";
    autoProvisionUsers: boolean;
  };
}

export class GoogleOAuthError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function googleDiscoveryUrl(): string {
  return "https://accounts.google.com/.well-known/openid-configuration";
}

export async function getGoogleDiscovery(fetcher: typeof fetch = fetch): Promise<GoogleDiscovery> {
  const response = await fetcher(googleDiscoveryUrl(), { headers: { accept: "application/json" } });
  if (!response.ok) throw new GoogleOAuthError("sso_not_configured");
  const discovery = await response.json() as GoogleDiscovery;
  if (!discovery.authorization_endpoint || !discovery.token_endpoint || !discovery.jwks_uri) {
    throw new GoogleOAuthError("sso_not_configured");
  }
  return discovery;
}

export function buildGoogleAuthUrl(input: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  hostedDomain?: string | null;
}): string {
  const url = new URL(input.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  url.searchParams.set("prompt", "select_account");
  const hostedDomain = String(input.hostedDomain || "").trim().toLowerCase();
  if (hostedDomain) url.searchParams.set("hd", hostedDomain);
  return url.toString();
}

export async function exchangeGoogleCodeForTokens(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetcher?: typeof fetch;
}): Promise<{ id_token: string }> {
  const fetcher = input.fetcher || fetch;
  const discovery = await getGoogleDiscovery(fetcher);
  const body = new URLSearchParams();
  body.set("code", input.code);
  body.set("client_id", input.clientId);
  body.set("client_secret", input.clientSecret);
  body.set("redirect_uri", input.redirectUri);
  body.set("grant_type", "authorization_code");

  const response = await fetcher(discovery.token_endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) throw new GoogleOAuthError("sso_token_exchange_failed");

  const tokens = await response.json() as { id_token?: string };
  if (!tokens.id_token) throw new GoogleOAuthError("sso_token_exchange_failed");
  return { id_token: tokens.id_token };
}

export function decodeJwtParts(idToken: string): { header: Record<string, unknown>; payload: GoogleIdTokenClaims; signingInput: string; signature: Uint8Array } {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new GoogleOAuthError("sso_invalid_id_token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseBase64UrlJson<Record<string, unknown>>(encodedHeader);
  const payload = parseBase64UrlJson<GoogleIdTokenClaims>(encodedPayload);
  return {
    header,
    payload,
    signingInput: `${encodedHeader}.${encodedPayload}`,
    signature: base64UrlToBytes(encodedSignature),
  };
}

export async function verifyGoogleIdToken(input: {
  idToken: string;
  clientId: string;
  expectedNonceHash: string;
  allowedHostedDomains: string[];
  issuerAllowlist?: string[];
  fetcher?: typeof fetch;
  nowMs?: number;
}): Promise<GoogleIdTokenClaims> {
  const decoded = decodeJwtParts(input.idToken);
  if (decoded.header.alg !== "RS256" || typeof decoded.header.kid !== "string") {
    throw new GoogleOAuthError("sso_invalid_id_token");
  }

  const fetcher = input.fetcher || fetch;
  const discovery = await getGoogleDiscovery(fetcher);
  const jwksResponse = await fetcher(discovery.jwks_uri, { headers: { accept: "application/json" } });
  if (!jwksResponse.ok) throw new GoogleOAuthError("sso_invalid_id_token");
  const jwks = await jwksResponse.json() as { keys?: JsonWebKey[] };
  const key = (jwks.keys || []).find((candidate) => (candidate as JsonWebKey & { kid?: string }).kid === decoded.header.kid);
  if (!key) throw new GoogleOAuthError("sso_invalid_id_token");

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    decoded.signature,
    new TextEncoder().encode(decoded.signingInput),
  );
  if (!verified) throw new GoogleOAuthError("sso_invalid_id_token");

  await validateGoogleClaims({
    claims: decoded.payload,
    clientId: input.clientId,
    expectedNonceHash: input.expectedNonceHash,
    allowedHostedDomains: input.allowedHostedDomains,
    issuerAllowlist: input.issuerAllowlist,
    nowMs: input.nowMs,
  });
  return decoded.payload;
}

export async function validateGoogleClaims(input: {
  claims: GoogleIdTokenClaims;
  clientId: string;
  expectedNonceHash: string;
  allowedHostedDomains: string[];
  issuerAllowlist?: string[];
  nowMs?: number;
}): Promise<void> {
  const claims = input.claims;
  const issuers = input.issuerAllowlist?.length
    ? input.issuerAllowlist
    : ["https://accounts.google.com", "accounts.google.com"];
  if (!issuers.includes(claims.iss)) throw new GoogleOAuthError("sso_invalid_id_token");

  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(input.clientId)) throw new GoogleOAuthError("sso_invalid_id_token");

  const nowSeconds = Math.floor((input.nowMs || Date.now()) / 1000);
  const skewSeconds = 300;
  if (!claims.exp || claims.exp <= nowSeconds - skewSeconds) throw new GoogleOAuthError("sso_invalid_id_token");
  if (claims.iat && claims.iat > nowSeconds + skewSeconds) throw new GoogleOAuthError("sso_invalid_id_token");
  if (!claims.sub || !claims.email) throw new GoogleOAuthError("sso_invalid_id_token");
  if (!(claims.email_verified === true || claims.email_verified === "true")) {
    throw new GoogleOAuthError("sso_email_not_verified");
  }

  const nonce = String(claims.nonce || "");
  if (!nonce || await sha256Hex(nonce) !== input.expectedNonceHash) {
    throw new GoogleOAuthError("sso_invalid_id_token");
  }

  const allowedDomains = input.allowedHostedDomains.map((domain) => domain.toLowerCase());
  if (allowedDomains.length > 0) {
    const hostedDomain = String(claims.hd || "").trim().toLowerCase();
    if (!hostedDomain || !allowedDomains.includes(hostedDomain)) {
      throw new GoogleOAuthError("sso_domain_not_allowed");
    }
  }
}

export async function resolveTenantForGoogleIdentity(
  env: Env,
  claims: GoogleIdTokenClaims,
): Promise<ResolvedGoogleTenant> {
  const hostedDomain = String(claims.hd || "").trim().toLowerCase();
  if (!hostedDomain) throw new GoogleOAuthError("sso_domain_not_allowed");

  const row = await env.DB.prepare(
    `SELECT
       tenants.id,
       tenants.name,
       tenants.slug,
       tenants.status,
       tenants.subscription_status,
       tenants.storage_mode,
       tenant_domains.domain,
       identity_providers.id AS identity_provider_id,
       identity_providers.status AS identity_provider_status,
       identity_providers.auto_provision_users
     FROM tenant_domains
     JOIN tenants ON tenants.id = tenant_domains.tenant_id
     JOIN identity_providers
       ON identity_providers.tenant_id = tenants.id
      AND identity_providers.provider = 'google_workspace'
      AND lower(identity_providers.hosted_domain) = lower(tenant_domains.domain)
     WHERE lower(tenant_domains.domain) = ?
       AND tenant_domains.verified = 1
     LIMIT 1`,
  ).bind(hostedDomain).first<{
    id: string;
    name: string;
    slug: string;
    status: Tenant["status"];
    subscription_status: Tenant["subscription_status"];
    storage_mode: Tenant["storage_mode"];
    domain: string;
    identity_provider_id: string;
    identity_provider_status: "configured" | "disabled" | "needs_config";
    auto_provision_users: number;
  }>();

  if (!row) throw new GoogleOAuthError("sso_domain_not_allowed");
  if (row.status !== "active" || row.identity_provider_status === "disabled") {
    throw new GoogleOAuthError("sso_tenant_inactive");
  }
  if (row.identity_provider_status !== "configured") {
    throw new GoogleOAuthError("sso_not_configured");
  }

  return {
    tenant: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      subscription_status: row.subscription_status,
      storage_mode: row.storage_mode,
    },
    hostedDomain: row.domain,
    identityProvider: {
      id: row.identity_provider_id,
      status: row.identity_provider_status,
      autoProvisionUsers: Number(row.auto_provision_users || 0) === 1,
    },
  };
}

export async function linkOrCreateUserForGoogleIdentity(
  env: Env,
  claims: GoogleIdTokenClaims,
  tenant: ResolvedGoogleTenant,
): Promise<UserAccount> {
  const emailNorm = normalizeEmail(claims.email);
  const existingIdentity = await env.DB.prepare(
    `SELECT user_accounts.id, user_accounts.email, user_accounts.email_norm, user_accounts.display_name, user_accounts.status
     FROM auth_identities
     JOIN user_accounts ON user_accounts.id = auth_identities.user_id
     WHERE auth_identities.provider = 'google_workspace'
       AND auth_identities.provider_subject = ?
     LIMIT 1`,
  ).bind(claims.sub).first<UserAccount>();

  if (existingIdentity) {
    if (existingIdentity.status !== "active") throw new GoogleOAuthError("sso_account_not_provisioned");
    await markIdentityLogin(env, claims.sub);
    return existingIdentity;
  }

  const existingUser = await env.DB.prepare(
    "SELECT id, email, email_norm, display_name, status FROM user_accounts WHERE email_norm = ? LIMIT 1",
  ).bind(emailNorm).first<UserAccount>();

  if (existingUser) {
    if (existingUser.status !== "active") throw new GoogleOAuthError("sso_account_not_provisioned");
    await linkIdentity(env, existingUser.id, tenant.tenant.id, claims.sub, emailNorm);
    await env.DB.prepare(
      `INSERT OR IGNORE INTO tenant_users (tenant_id, user_id, membership_status)
       VALUES (?, ?, 'active')`,
    ).bind(tenant.tenant.id, existingUser.id).run();
    return existingUser;
  }

  if (!tenant.identityProvider.autoProvisionUsers) {
    throw new GoogleOAuthError("sso_account_not_provisioned");
  }

  const userId = randomId("user");
  const displayName = cleanDisplayName(claims.name, claims.email);
  await env.DB.prepare(
    `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
     VALUES (?, ?, ?, ?, 'active')`,
  ).bind(userId, claims.email, emailNorm, displayName).run();
  await env.DB.prepare(
    `INSERT INTO tenant_users (tenant_id, user_id, membership_status)
     VALUES (?, ?, 'active')`,
  ).bind(tenant.tenant.id, userId).run();
  await linkIdentity(env, userId, tenant.tenant.id, claims.sub, emailNorm);

  return {
    id: userId,
    email: claims.email,
    email_norm: emailNorm,
    display_name: displayName,
    status: "active",
  };
}

async function linkIdentity(env: Env, userId: string, tenantId: string, subject: string, emailNorm: string): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO auth_identities (id, user_id, tenant_id, provider, provider_subject, email_norm, last_login_at)
     VALUES (?, ?, ?, 'google_workspace', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
  ).bind(randomId("auth-identity"), userId, tenantId, subject, emailNorm).run();
  await markIdentityLogin(env, subject);
}

async function markIdentityLogin(env: Env, subject: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE auth_identities
     SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE provider = 'google_workspace' AND provider_subject = ?`,
  ).bind(subject).run();
}

function parseBase64UrlJson<T>(value: string): T {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as T;
  } catch {
    throw new GoogleOAuthError("sso_invalid_id_token");
  }
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function cleanDisplayName(name: string | undefined, email: string): string {
  const trimmed = String(name || "").trim().replace(/\s+/g, " ");
  if (trimmed.length >= 2 && trimmed.length <= 120) return trimmed;
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Google Workspace User";
}
