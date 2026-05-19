export interface Env {
  DB: D1Database;
  APP_ENV?: "local" | "preview" | "production";
  AUTH_MODE: "hardened_username_password";
  BOOTSTRAP_SETUP_KEY?: string;
  SESSION_COOKIE_NAME?: string;
  SESSION_PEPPER?: string;
  PASSWORD_PEPPER?: string;
  EVIDENCE_STORAGE_PROVIDER: "google_drive";
  GOOGLE_DRIVE_CLIENT_EMAIL?: string;
  GOOGLE_DRIVE_PRIVATE_KEY?: string;
  GOOGLE_DRIVE_EVIDENCE_ROOT_ID?: string;
  GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID?: string;
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

export type RoleId = "student" | "mentor" | "program_teacher" | "admin" | "misc_admin";

export interface RoleAssignment {
  role_id: RoleId;
  scope_type: string;
  scope_id: string;
}
