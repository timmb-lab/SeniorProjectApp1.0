import type { Env } from "../_types";
import { json } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM user_accounts").first<{ count: number }>();
  return json({
    ok: true,
    app: "senior-capstone-app",
    environment: env.APP_ENV || null,
    authMode: env.AUTH_MODE,
    evidenceStorageProvider: env.EVIDENCE_STORAGE_PROVIDER,
    evidenceIndexSheetId: env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID || null,
    userCount: row?.count ?? 0,
  });
};
