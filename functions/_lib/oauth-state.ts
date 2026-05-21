import type { Env, OAuthState } from "../_types.ts";
import { newRandomToken, randomId, sha256Hex } from "./crypto.ts";

const OAUTH_STATE_TTL_MINUTES = 10;
const OAUTH_STATE_COOKIE_NAME = "sc_oauth_state";

export interface CreatedOAuthState {
  state: string;
  stateHash: string;
  nonce: string;
  expiresAt: string;
  stateCookie: string;
}

export async function createOAuthState(
  env: Env,
  input: { tenantHint?: string | null; returnTo?: string | null } = {},
): Promise<CreatedOAuthState> {
  const state = newRandomToken();
  const nonce = newRandomToken();
  const stateHash = await sha256Hex(state);
  const nonceHash = await sha256Hex(nonce);
  const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MINUTES * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO oauth_states (id, state_hash, nonce_hash, tenant_hint, return_to, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(
    randomId("oauth-state"),
    stateHash,
    nonceHash,
    cleanOptionalHint(input.tenantHint),
    safeReturnTo(input.returnTo || "") || "/workspace.html",
    expiresAt,
  ).run();

  return {
    state,
    stateHash,
    nonce,
    expiresAt,
    stateCookie: oauthStateCookie(stateHash, OAUTH_STATE_TTL_MINUTES * 60),
  };
}

export async function consumeOAuthState(env: Env, state: string, cookieHeader: string | null): Promise<OAuthState | null> {
  const stateHash = await sha256Hex(state);
  const cookieStateHash = readOAuthStateCookie(cookieHeader || "");
  if (!cookieStateHash || cookieStateHash !== stateHash) return null;

  const row = await env.DB.prepare(
    `SELECT id, state_hash, nonce_hash, tenant_hint, return_to, expires_at, used_at
     FROM oauth_states
     WHERE state_hash = ?
       AND used_at IS NULL
       AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     LIMIT 1`,
  ).bind(stateHash).first<OAuthState>();
  if (!row) return null;

  await env.DB.prepare(
    "UPDATE oauth_states SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
  ).bind(row.id).run();

  return row;
}

export function clearOAuthStateCookie(): string {
  return [
    `${OAUTH_STATE_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

export function safeReturnTo(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return "";
  if (/[\r\n]/.test(trimmed)) return "";
  return trimmed;
}

function oauthStateCookie(stateHash: string, maxAgeSeconds: number): string {
  return [
    `${OAUTH_STATE_COOKIE_NAME}=${stateHash}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

function readOAuthStateCookie(cookieHeader: string): string {
  const name = `${OAUTH_STATE_COOKIE_NAME}=`;
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(name));
  const value = cookie ? cookie.slice(name.length) : "";
  return /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : "";
}

function cleanOptionalHint(value: string | null | undefined): string | null {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return null;
  return /^[a-z0-9_.@-]+$/.test(trimmed) ? trimmed : null;
}
