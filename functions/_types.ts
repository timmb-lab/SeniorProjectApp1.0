export interface Env {
  DB: D1Database;
  APP_ENV?: "local" | "preview" | "production";
  AUTH_MODE: "hardened_username_password" | "hybrid_google_workspace_local" | "google_workspace_sso";
  BOOTSTRAP_SETUP_KEY?: string;
  SESSION_COOKIE_NAME?: string;
  SESSION_PEPPER?: string;
  PASSWORD_PEPPER?: string;
  ALLOW_REAL_TEMP_CREDENTIAL_IMPORT?: string;
  AUTH_GOOGLE_SSO_ENABLED?: string;
  AUTH_LOCAL_LOGIN_ENABLED?: string;
  GOOGLE_OAUTH_CLIENT_ID?: string;
  GOOGLE_OAUTH_CLIENT_SECRET?: string;
  GOOGLE_OAUTH_REDIRECT_URI?: string;
  GOOGLE_OAUTH_ALLOWED_HOSTED_DOMAINS?: string;
  GOOGLE_OAUTH_ISSUER_ALLOWLIST?: string;
  TENANT_AUTO_PROVISION_DEFAULT?: string;
  EVIDENCE_STORAGE_PROVIDER: "google_drive";
  GOOGLE_DRIVE_CLIENT_EMAIL?: string;
  GOOGLE_DRIVE_PRIVATE_KEY?: string;
  GOOGLE_DRIVE_EVIDENCE_ROOT_ID?: string;
  GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID?: string;
  ARCHIVE_DOWNLOAD_WINDOW_DAYS?: string;
  ARCHIVE_RETENTION_POLICY_STATUS?: "configured" | "policy_review_required";
}

export interface UserAccount {
  id: string;
  email: string;
  email_norm: string;
  display_name: string;
  status: "active" | "disabled" | "pending_reset";
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export type RoleId =
  | "student"
  | "mentor"
  | "program_teacher"
  | "site_admin"
  | "org_admin"
  | "platform_admin"
  | "viewer"
  | "admin"
  | "misc_admin";

export interface RoleAssignment {
  role_id: RoleId;
  scope_type: string;
  scope_id: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  subscription_status: "trial" | "active" | "past_due" | "cancelled" | "suspended";
  storage_mode: "app_managed_google_drive" | "tenant_owned_google_drive" | "pending";
}

export interface Site {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  timezone: string;
  school_year: string | null;
}

export interface SiteUser {
  site_id: string;
  user_id: string;
  membership_status: "active" | "suspended" | "archived";
}

export interface SiteProgram {
  site_id: string;
  program_id: string;
  active: number;
}

export interface IdentityProvider {
  id: string;
  tenant_id: string;
  provider: "google_workspace";
  client_id: string | null;
  hosted_domain: string | null;
  status: "configured" | "disabled" | "needs_config";
  auto_provision_users: number;
}

export interface AuthIdentity {
  id: string;
  user_id: string;
  tenant_id: string | null;
  provider: "google_workspace" | "local_password";
  provider_subject: string;
  email_norm: string;
  last_login_at: string | null;
}

export interface OAuthState {
  id: string;
  state_hash: string;
  nonce_hash: string;
  tenant_hint: string | null;
  return_to: string | null;
  expires_at: string;
  used_at: string | null;
}
