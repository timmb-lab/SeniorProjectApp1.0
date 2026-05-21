import type { Env } from "../_types";
import { json } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM user_accounts").first<{ count: number }>();
  const driveClientEmailConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_CLIENT_EMAIL);
  const drivePrivateKeyConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_PRIVATE_KEY);
  const driveProviderConfigured = env.EVIDENCE_STORAGE_PROVIDER === "google_drive";
  const driveRootConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID);
  const driveIndexConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID);
  return json({
    ok: true,
    app: "senior-capstone-app",
    environment: env.APP_ENV || null,
    authMode: env.AUTH_MODE,
    evidenceStorageProvider: env.EVIDENCE_STORAGE_PROVIDER,
    evidenceRootConfigured: driveRootConfigured,
    evidenceIndexSheetId: env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID || null,
    evidenceIndexConfigured: driveIndexConfigured,
    googleDriveProviderConfigured: driveProviderConfigured,
    googleDriveRootIdConfigured: driveRootConfigured,
    googleDriveIndexConfigured: driveIndexConfigured,
    googleDriveCredentialsConfigured: driveClientEmailConfigured && drivePrivateKeyConfigured,
    googleDriveCredentialParts: {
      clientEmail: driveClientEmailConfigured,
      privateKey: drivePrivateKeyConfigured,
    },
    googleDriveLiveProbeSupported: true,
    userCount: row?.count ?? 0,
  });
};

function isConfiguredSecret(value?: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized
      && !normalized.startsWith("pending")
      && !normalized.startsWith("replace-with")
      && normalized !== "undefined"
      && normalized !== "null",
  );
}
