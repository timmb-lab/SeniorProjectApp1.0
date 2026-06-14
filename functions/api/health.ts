import type { Env } from "../_types";
import { json } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare("SELECT 1 AS ready").first<{ ready: number }>();
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
    databaseReady: row?.ready === 1,
    evidenceStorageProvider: env.EVIDENCE_STORAGE_PROVIDER,
    evidenceRootConfigured: driveRootConfigured,
    evidenceIndexConfigured: driveIndexConfigured,
    googleDriveProviderConfigured: driveProviderConfigured,
    googleDriveRootIdConfigured: driveRootConfigured,
    googleDriveIndexConfigured: driveIndexConfigured,
    googleDriveCredentialsConfigured: driveClientEmailConfigured && drivePrivateKeyConfigured,
    googleDriveLiveProbeSupported: true,
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
