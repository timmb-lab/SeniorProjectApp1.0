import type { Env } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { getGoogleDriveAccessToken, googleDriveCredentialParts, probeGoogleDriveFile } from "../../_lib/google-drive.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return workflowError("unauthorized", 401);
  }

  const rootFolderId = String(env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID || "").trim();
  const indexSheetId = String(env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID || "").trim();
  const credentialParts = googleDriveCredentialParts(env);

  if (!rootFolderId || !indexSheetId) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_probe_missing_config",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: {
        rootConfigured: Boolean(rootFolderId),
        indexConfigured: Boolean(indexSheetId),
      },
    });
    return workflowError("drive_config_missing", 503);
  }

  if (!credentialParts.clientEmail || !credentialParts.privateKey) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_probe_missing_credentials",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { credentialParts },
    });
    return workflowError("drive_credentials_missing", 503);
  }

  let accessToken: string;
  let expiresIn = 0;
  try {
    const tokenResult = await getGoogleDriveAccessToken(env);
    accessToken = tokenResult.accessToken;
    expiresIn = tokenResult.expiresIn;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_probe_token_exchange_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { message },
    });
    return workflowError("drive_token_exchange_failed", 502);
  }

  let rootProbe;
  let indexProbe;
  try {
    rootProbe = await probeGoogleDriveFile(accessToken, rootFolderId);
    indexProbe = await probeGoogleDriveFile(accessToken, indexSheetId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_probe_request_failed",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: { message },
    });
    return workflowError("drive_provider_error", 502);
  }

  if (!rootProbe.ok || !indexProbe.ok) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "google_drive_probe_access_denied",
      entityType: "evidence_repository",
      entityId: "default-google-drive",
      request,
      metadata: {
        rootStatus: rootProbe.status,
        indexStatus: indexProbe.status,
      },
    });
    return workflowError("drive_access_denied", 502);
  }

  await writeAudit(env, {
    actorUserId: user.id,
    action: "google_drive_probe_success",
    entityType: "evidence_repository",
    entityId: "default-google-drive",
    request,
    metadata: {
      tokenExpiresIn: expiresIn,
      rootOk: rootProbe.ok,
      indexOk: indexProbe.ok,
    },
  });

  return json({
    ok: true,
    drive: {
      tokenExpiresIn: expiresIn,
      root: rootProbe,
      indexSheet: indexProbe,
    },
  });
};

function workflowError(error: string, status: number): Response {
  return json({ error, ok: false }, { status });
}
