import type { Env } from "../_types.ts";
import { randomId, sha256Hex } from "./crypto.ts";

export const STUDENT_ARCHIVE_MANIFEST_TYPE = "student_archive_manifest_json";

const ARCHIVE_DOWNLOAD_TTL_MS = 14 * 24 * 60 * 60 * 1000;

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
  const generatedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ARCHIVE_DOWNLOAD_TTL_MS).toISOString();

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
      downloadWindowDays: 14,
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
      externalUrl: row.source_kind === "external_link" ? row.external_url : null,
      title: row.title,
      reviewStatus: row.review_status,
      createdAt: row.created_at,
      requirementId: row.requirement_id,
      fileBytesReady: row.source_kind === "google_drive_file",
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
  };
}

export function archiveArtifactExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}
