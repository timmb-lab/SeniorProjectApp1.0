import type { Env, UserAccount } from "../_types.ts";
import { randomId } from "./crypto.ts";
import { json } from "./http.ts";
import { canAccessStudent, hasRole, isGlobalAdmin } from "./permissions.ts";

export type SubmissionDecision = "approved" | "revision_requested" | "comment_only";

export interface SubmissionRow {
  id: string;
  student_id: string;
  requirement_id: string | null;
  status: "draft" | "submitted" | "revision_requested" | "approved" | "archived";
  version: number;
}

interface EvidenceSnapshotRow {
  id: string;
  title: string;
  artifact_type: string;
  source_kind: string;
  review_status: string;
  created_at: string;
}

const MAX_WORKFLOW_HTTPS_URL_LENGTH = 2048;

export function cleanWorkflowText(value: unknown, fallback: string, maxLength = 800): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

export function cleanHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > MAX_WORKFLOW_HTTPS_URL_LENGTH) return null;
  try {
    const url = new URL(trimmed);
    const normalized = url.toString();
    if (
      url.protocol !== "https:"
      || !url.hostname.includes(".")
      || url.username
      || url.password
      || normalized.length > MAX_WORKFLOW_HTTPS_URL_LENGTH
    ) return null;
    return normalized;
  } catch {
    return null;
  }
}

export async function getSubmission(env: Env, submissionId: string): Promise<SubmissionRow | null> {
  return env.DB.prepare(
    `SELECT id, student_id, requirement_id, status, version
     FROM submissions
     WHERE id = ?`,
  ).bind(submissionId).first<SubmissionRow>();
}

export async function canReviewSubmission(env: Env, reviewer: UserAccount, submission: SubmissionRow): Promise<boolean> {
  if (await isGlobalAdmin(env, reviewer.id)) return true;
  if (!await hasRole(env, reviewer.id, "program_teacher")) return false;
  return canAccessStudent(env, reviewer, submission.student_id);
}

export async function canViewSubmission(env: Env, viewer: UserAccount, submission: SubmissionRow): Promise<boolean> {
  return canAccessStudent(env, viewer, submission.student_id);
}

export function workflowError(error: string, status: number): Response {
  return json({ error, ok: false }, { status });
}

export async function writeStatusHistory(
  env: Env,
  input: {
    studentId: string;
    entityType: string;
    entityId: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string;
    reason: string;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO status_history (id, student_id, entity_type, entity_id, from_status, to_status, changed_by, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    randomId("status"),
    input.studentId,
    input.entityType,
    input.entityId,
    input.fromStatus,
    input.toStatus,
    input.changedBy,
    input.reason,
  ).run();
}

export async function writeSubmissionVersionSnapshot(
  env: Env,
  input: {
    submission: SubmissionRow;
    version: number;
    submittedBy: string;
    notes: string;
  },
): Promise<void> {
  const evidence = await env.DB.prepare(
    `SELECT id, title, artifact_type, source_kind, review_status, created_at
     FROM evidence_artifacts
     WHERE submission_id = ?
       AND deleted_at IS NULL
       AND review_status != 'archived'
     ORDER BY created_at ASC`,
  ).bind(input.submission.id).all<EvidenceSnapshotRow>();

  const evidenceSnapshot = (evidence.results || []).map((artifact) => ({
    id: artifact.id,
    title: artifact.title,
    artifactType: artifact.artifact_type,
    sourceKind: artifact.source_kind,
    reviewStatus: artifact.review_status,
    createdAt: artifact.created_at,
  }));

  await env.DB.prepare(
    `INSERT OR IGNORE INTO submission_versions (
       id,
       submission_id,
       student_id,
       requirement_id,
       version,
       status,
       submitted_by,
       evidence_snapshot_json,
       notes
     )
     VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?)`,
  ).bind(
    randomId("submission-version"),
    input.submission.id,
    input.submission.student_id,
    input.submission.requirement_id,
    input.version,
    input.submittedBy,
    JSON.stringify(evidenceSnapshot),
    input.notes,
  ).run();
}
