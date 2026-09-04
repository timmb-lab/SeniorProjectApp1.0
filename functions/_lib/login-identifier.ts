import { normalizeEmail } from "./crypto.ts";

export function normalizeLoginIdentifier(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function validLoginAlias(value: unknown): boolean {
  const alias = normalizeLoginIdentifier(value);
  return /^[a-z0-9][a-z0-9._-]{2,63}$/.test(alias) && !alias.includes("@");
}

export function accountLookupSql(): string {
  return `
    SELECT u.id AS user_id, u.email, u.email_norm, u.display_name, u.status,
           c.password_hash, c.password_salt, c.algorithm, c.iterations, c.requires_reset
    FROM user_accounts u
    JOIN password_credentials c ON c.user_id = u.id
    WHERE u.email_norm = ? OR u.id = (
      SELECT user_id FROM account_login_aliases WHERE alias_norm = ? LIMIT 1
    )
    LIMIT 1`;
}

export function internalEmailForAlias(alias: string): string {
  return `${normalizeLoginIdentifier(alias)}@login.thecapstoneproject.invalid`;
}

export function normalizedEmailOrIdentifier(value: unknown): string {
  const normalized = normalizeLoginIdentifier(value);
  return normalized.includes("@") ? normalizeEmail(normalized) : normalized;
}
