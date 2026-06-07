import type { Env } from "../_types.ts";

export type AuthMode = Env["AUTH_MODE"];

const AUTH_MODES = new Set<AuthMode>([
  "hardened_username_password",
  "hybrid_google_workspace_local",
  "google_workspace_sso",
]);

export function authMode(env: Env): AuthMode {
  const value = String(env.AUTH_MODE || "hardened_username_password").trim();
  return AUTH_MODES.has(value as AuthMode) ? (value as AuthMode) : "hardened_username_password";
}

export function isLocalOnlyAuthMode(env: Env): boolean {
  return authMode(env) === "hardened_username_password";
}

export function isLocalLoginEnabled(env: Env): boolean {
  const explicit = parseBooleanEnv(env.AUTH_LOCAL_LOGIN_ENABLED);
  if (explicit !== null) return explicit;
  return true;
}

export function hasGoogleOAuthClientConfig(env: Env): boolean {
  return Boolean(
    cleanEnv(env.GOOGLE_OAUTH_CLIENT_ID) &&
      cleanEnv(env.GOOGLE_OAUTH_CLIENT_SECRET) &&
      cleanEnv(env.GOOGLE_OAUTH_REDIRECT_URI),
  );
}

export function isGoogleSsoEnabled(env: Env): boolean {
  if (isLocalOnlyAuthMode(env)) return false;
  return parseBooleanEnv(env.AUTH_GOOGLE_SSO_ENABLED) === true && hasGoogleOAuthClientConfig(env);
}

export function isManagedLocalAccountCreationEnabled(env: Env): boolean {
  if (parseBooleanEnv(env.ALLOW_REAL_TEMP_CREDENTIAL_IMPORT) === true) return true;
  return isLocalOnlyAuthMode(env) && isLocalLoginEnabled(env);
}

export function allowedGoogleDomains(env: Env): string[] {
  return String(env.GOOGLE_OAUTH_ALLOWED_HOSTED_DOMAINS || "")
    .split(/[,\s]+/)
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter((domain) => /^[a-z0-9.-]+$/.test(domain));
}

export function safeAuthConfig(env: Env): {
  ok: true;
  authMode: AuthMode;
  googleSsoEnabled: boolean;
  googleSsoConfigured: boolean;
  localLoginEnabled: boolean;
  googleWorkspaceLabel: string;
} {
  return {
    ok: true,
    authMode: authMode(env),
    googleSsoEnabled: isGoogleSsoEnabled(env),
    googleSsoConfigured: hasGoogleOAuthClientConfig(env),
    localLoginEnabled: isLocalLoginEnabled(env),
    googleWorkspaceLabel: "Use your school Google Workspace account",
  };
}

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function cleanEnv(value: string | undefined): string {
  return String(value || "").trim();
}
