import type { Env, UserAccount } from "../_types.ts";
import { randomId } from "./crypto.ts";
import { json } from "./http.ts";
import { canAccessStudent, hasRole, isAdmin } from "./permissions.ts";

export type SubmissionDecision = "approved" | "revision_requested";

export interface SubmissionRow {
  id: string;
  student_id: string;
  requirement_id: string | null;
  status: "draft" | "submitted" | "revision_requested" | "approved" | "archived";
  version: number;
}

export function cleanWorkflowText(value: unknown, fallback: string, maxLength = 800): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

export function cleanHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return null;
    return url.toString();
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
  if (await isAdmin(env, reviewer.id)) return true;
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
