import type { Env } from "../_types.ts";
import { randomId, sha256Hex } from "./crypto.ts";
import { getGoogleDriveAccessToken, googleDriveCredentialParts, googleWorkspaceExportPlan, probeGoogleDriveFile, uploadGoogleDriveFile } from "./google-drive.ts";

export const STUDENT_ARCHIVE_MANIFEST_TYPE = "student_archive_manifest_json";
export const STUDENT_ARCHIVE_DRIVE_PACKAGE_TYPE = "student_archive_drive_package_json";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ARCHIVE_DOWNLOAD_WINDOW_DAYS = 14;
const MAX_ARCHIVE_DOWNLOAD_WINDOW_DAYS = 90;

interface ProgressRow {
  requirement_id: string | null;
  phase: string;
  status: string;
  updated_at: string;
  requirement_title: string | null;
}

interface EvidenceRow {
  artifact_type: string;
  source_kind: string;
  external_url: string | null;
  mime_type: string | null;
  title: string;
  review_status: string;
  created_at: string;
  requirement_id: string | null;
}

interface StudentRow {
  id: string;
  display_name: string;
}

export interface ArchiveManifestArtifact {
  id: string;
  artifactType: typeof STUDENT_ARCHIVE_MANIFEST_TYPE;
  title: string;
  mimeType: "application/json";
  bodyJson: string;
  byteLength: number;
  contentSha256: string;
  expiresAt: string;
  generatedAt: string;
  itemCounts: {
    progressRows: number;
    evidenceArtifacts: number;
  };
  retention: ArchiveRetentionPolicy;
}

export interface ArchiveRetentionPolicy {
  downloadWindowDays: number;
  expiryWarningDays: number;
  policyStatus: "configured" | "policy_review_required";
  policyReviewRequired: boolean;
}

export interface ArchiveProviderReadiness {
  ready: boolean;
  status:
    | "ready"
    | "drive_config_missing"
    | "drive_credentials_missing"
    | "drive_token_exchange_failed"
    | "drive_provider_error"
    | "drive_access_denied";
  error: string | null;
  httpStatus: number;
  retry: "configure_drive_repository" | "configure_drive_credentials" | "retry_archive_export" | null;
  rootConfigured: boolean;
  indexConfigured: boolean;
  credentialParts: {
    clientEmail: boolean;
    privateKey: boolean;
  };
  message: string;
}

export interface ArchiveDrivePackage {
  fileId: string;
  name: string;
  mimeType: string;
  uploadedAt: string;
}

export function getArchiveRetentionPolicy(env: Pick<Env, "ARCHIVE_DOWNLOAD_WINDOW_DAYS" | "ARCHIVE_RETENTION_POLICY_STATUS">): ArchiveRetentionPolicy {
  const parsedDays = Number.parseInt(String(env.ARCHIVE_DOWNLOAD_WINDOW_DAYS || ""), 10);
  const downloadWindowDays = Number.isFinite(parsedDays) && parsedDays > 0
    ? Math.min(parsedDays, MAX_ARCHIVE_DOWNLOAD_WINDOW_DAYS)
    : DEFAULT_ARCHIVE_DOWNLOAD_WINDOW_DAYS;
  const policyStatus = env.ARCHIVE_RETENTION_POLICY_STATUS === "configured"
    ? "configured"
    : "policy_review_required";

  return {
    downloadWindowDays,
    expiryWarningDays: Math.min(3, downloadWindowDays),
    policyStatus,
    policyReviewRequired: policyStatus !== "configured",
  };
}

export function getArchiveProviderConfiguration(env: Env): ArchiveProviderReadiness {
  const rootConfigured = configured(env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID);
  const indexConfigured = configured(env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID);
  const credentialParts = googleDriveCredentialParts(env);

  if (!rootConfigured || !indexConfigured) {
    return {
      ready: false,
      status: "drive_config_missing",
      error: "drive_config_missing",
      httpStatus: 503,
      retry: "configure_drive_repository",
      rootConfigured,
      indexConfigured,
      credentialParts,
      message: "Drive repository configuration is incomplete, so archive package generation is unavailable.",
    };
  }

  if (!credentialParts.clientEmail || !credentialParts.privateKey) {
    return {
      ready: false,
      status: "drive_credentials_missing",
      error: "drive_credentials_missing",
      httpStatus: 503,
      retry: "configure_drive_credentials",
      rootConfigured,
      indexConfigured,
      credentialParts,
      message: "Drive credentials are not configured, so archive package generation is unavailable.",
    };
  }

  return {
    ready: true,
    status: "ready",
    error: null,
    httpStatus: 200,
    retry: null,
    rootConfigured,
    indexConfigured,
    credentialParts,
    message: "Drive repository configuration is ready for archive package generation.",
  };
}

export async function verifyArchiveProviderReady(env: Env): Promise<ArchiveProviderReadiness> {
  const configuration = getArchiveProviderConfiguration(env);
  if (!configuration.ready) return configuration;

  let accessToken = "";
  try {
    const tokenResult = await getGoogleDriveAccessToken(env);
    accessToken = tokenResult.accessToken;
  } catch {
    return {
      ...configuration,
      ready: false,
      status: "drive_token_exchange_failed",
      error: "drive_token_exchange_failed",
      httpStatus: 502,
      retry: "retry_archive_export",
      message: "Drive token exchange failed, so archive package generation should be retried after provider access is fixed.",
    };
  }

  try {
    const rootProbe = await probeGoogleDriveFile(accessToken, String(env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID || "").trim());
    const indexProbe = await probeGoogleDriveFile(accessToken, String(env.GOOGLE_DRIVE_EVIDENCE_INDEX_SHEET_ID || "").trim());
    if (!rootProbe.ok || !indexProbe.ok) {
      return {
        ...configuration,
        ready: false,
        status: "drive_access_denied",
        error: "drive_access_denied",
        httpStatus: 502,
        retry: "retry_archive_export",
        message: "Drive repository access was denied, so archive package generation remains unavailable.",
      };
    }
  } catch {
    return {
      ...configuration,
      ready: false,
      status: "drive_provider_error",
      error: "drive_provider_error",
      httpStatus: 502,
      retry: "retry_archive_export",
      message: "Drive provider verification failed, so archive package generation remains unavailable.",
    };
  }

  return configuration;
}

export async function buildStudentArchiveManifest(
  env: Env,
  input: {
    exportId: string;
    studentId: string;
    requestedBy: string;
    reason: string;
  },
): Promise<ArchiveManifestArtifact> {
  const retention = getArchiveRetentionPolicy(env);
  const generatedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + retention.downloadWindowDays * DAY_MS).toISOString();

  const [student, progress, evidence] = await Promise.all([
    env.DB.prepare(
      "SELECT id, display_name FROM user_accounts WHERE id = ? AND status = 'active'",
    ).bind(input.studentId).first<StudentRow>(),
    env.DB.prepare(
      `SELECT
         progress.requirement_id,
         progress.phase,
         progress.status,
         progress.updated_at,
         requirements.title AS requirement_title
       FROM progress_records progress
       LEFT JOIN requirements ON requirements.id = progress.requirement_id
       WHERE progress.student_id = ?
       ORDER BY progress.updated_at ASC`,
    ).bind(input.studentId).all<ProgressRow>(),
    env.DB.prepare(
      `SELECT
         evidence.artifact_type,
         evidence.source_kind,
         evidence.external_url,
         evidence.mime_type,
         evidence.title,
         evidence.review_status,
         evidence.created_at,
         submissions.requirement_id
       FROM evidence_artifacts evidence
       LEFT JOIN submissions ON submissions.id = evidence.submission_id
       WHERE evidence.student_id = ?
         AND evidence.deleted_at IS NULL
         AND evidence.review_status != 'archived'
       ORDER BY evidence.created_at ASC`,
    ).bind(input.studentId).all<EvidenceRow>(),
  ]);

  if (!student) {
    throw new Error("student_not_found");
  }

  const progressRows = progress.results || [];
  const evidenceRows = evidence.results || [];
  const manifest = {
    manifestVersion: "student-archive-v1",
    exportId: input.exportId,
    generatedAt,
    expiresAt,
    requestedBy: input.requestedBy,
    requestReason: input.reason,
    student: {
      id: student.id,
      displayName: student.display_name,
    },
    retention: {
      downloadWindowDays: retention.downloadWindowDays,
      expiryWarningDays: retention.expiryWarningDays,
      policyStatus: retention.policyStatus,
      policyReviewRequired: retention.policyReviewRequired,
      retryAfterExpiry: "Ask an admin to generate a fresh archive package.",
    },
    progress: progressRows.map((row) => ({
      requirementId: row.requirement_id,
      requirementTitle: row.requirement_title,
      phase: row.phase,
      status: row.status,
      updatedAt: row.updated_at,
    })),
    evidenceArtifacts: evidenceRows.map((row) => ({
      artifactType: row.artifact_type,
      sourceKind: row.source_kind,
      mimeType: row.mime_type,
      externalUrl: row.source_kind === "external_link" ? row.external_url : null,
      title: row.title,
      reviewStatus: row.review_status,
      createdAt: row.created_at,
      requirementId: row.requirement_id,
      fileBytesReady: row.source_kind === "google_drive_file",
      googleWorkspaceExport: archiveGoogleWorkspaceExport(row.mime_type),
    })),
    guardrails: [
      "Private Drive storage identifiers are redacted from this package.",
      "The package is only served through authenticated role-scoped export download checks.",
      "Expired packages require a fresh admin-generated archive.",
    ],
  };

  const bodyJson = JSON.stringify(manifest, null, 2);
  const byteLength = new TextEncoder().encode(bodyJson).byteLength;

  return {
    id: randomId("export-artifact"),
    artifactType: STUDENT_ARCHIVE_MANIFEST_TYPE,
    title: `${student.display_name} Senior Project archive manifest`,
    mimeType: "application/json",
    bodyJson,
    byteLength,
    contentSha256: await sha256Hex(bodyJson),
    expiresAt,
    generatedAt,
    itemCounts: {
      progressRows: progressRows.length,
      evidenceArtifacts: evidenceRows.length,
    },
    retention,
  };
}

export async function uploadStudentArchiveDrivePackage(
  env: Env,
  artifact: ArchiveManifestArtifact,
): Promise<ArchiveDrivePackage> {
  const tokenResult = await getGoogleDriveAccessToken(env);
  const fileName = archivePackageFileName(artifact.title);
  const uploadResult = await uploadGoogleDriveFile(
    tokenResult.accessToken,
    {
      name: fileName,
      mimeType: artifact.mimeType,
      parentFolderId: env.GOOGLE_DRIVE_EVIDENCE_ROOT_ID,
    },
    new TextEncoder().encode(artifact.bodyJson),
  );

  if (!uploadResult.ok || !uploadResult.fileId) {
    throw new Error(`google_drive_archive_upload_failed:${uploadResult.status}`);
  }

  return {
    fileId: uploadResult.fileId,
    name: uploadResult.name || fileName,
    mimeType: uploadResult.mimeType || artifact.mimeType,
    uploadedAt: new Date().toISOString(),
  };
}

export function archiveArtifactExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function archiveArtifactExpiresSoon(
  expiresAt: string | null | undefined,
  options: { now?: Date; warningDays?: number } = {},
): boolean {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) return false;
  const now = options.now || new Date();
  const warningDays = Number.isFinite(options.warningDays) && Number(options.warningDays) > 0
    ? Number(options.warningDays)
    : 3;
  return timestamp > now.getTime() && timestamp - now.getTime() <= warningDays * DAY_MS;
}

function configured(value?: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(
    normalized
      && !normalized.startsWith("pending")
      && !normalized.startsWith("replace-with")
      && normalized !== "undefined"
      && normalized !== "null",
  );
}

function archivePackageFileName(title: string): string {
  const safeTitle = String(title || "senior-project-archive")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\w.\- ()]/g, "_")
    .trim()
    .slice(0, 120) || "senior-project-archive";
  return safeTitle.toLowerCase().endsWith(".json") ? safeTitle : `${safeTitle}.json`;
}

function archiveGoogleWorkspaceExport(mimeType: string | null) {
  const plan = googleWorkspaceExportPlan(mimeType);
  if (!plan.native) return null;
  return {
    nativeType: plan.sourceMimeType === "application/vnd.google-apps.document" ? "google_docs" : "google_workspace",
    supported: plan.supported,
    status: plan.status,
    exportMimeType: plan.exportMimeType,
    exportExtension: plan.extension,
    storageIdentifiersRedacted: true,
  };
}
