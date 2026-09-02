import type { Env } from "../_types.ts";
import { getCurrentUser } from "../_lib/auth.ts";
import { json } from "../_lib/http.ts";
import { canManageSecurity } from "../_lib/permissions.ts";
import { studentRosterProfilesTableExists } from "../_lib/student-roster-profiles.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  const mayViewReadiness = user ? await canManageSecurity(env, user) : false;
  if (!mayViewReadiness) {
    return json({ ok: true });
  }
  const [row, rosterProfilesReady] = await Promise.all([
    env.DB.prepare("SELECT 1 AS ready").first<{ ready: number }>(),
    studentRosterProfilesTableExists(env),
  ]);
  const driveClientEmailConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_CLIENT_EMAIL);
  const drivePrivateKeyConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_PRIVATE_KEY);
  const driveProviderConfigured = env.EVIDENCE_STORAGE_PROVIDER === "google_drive";
  const driveRootConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID);
  const driveIndexConfigured = isConfiguredSecret(env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID);
  return json({
    ok: true,
    readiness: {
      environment: env.APP_ENV || null,
      authMode: env.AUTH_MODE,
      databaseReady: row?.ready === 1,
      studentRosterProfilesReady: rosterProfilesReady,
      evidenceStorageProvider: env.EVIDENCE_STORAGE_PROVIDER,
      evidenceRootConfigured: driveRootConfigured,
      evidenceIndexConfigured: driveIndexConfigured,
      googleDriveProviderConfigured: driveProviderConfigured,
      googleDriveRootIdConfigured: driveRootConfigured,
      googleDriveIndexConfigured: driveIndexConfigured,
      googleDriveCredentialsConfigured: driveClientEmailConfigured && drivePrivateKeyConfigured,
      googleDriveLiveProbeSupported: true,
    },
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
