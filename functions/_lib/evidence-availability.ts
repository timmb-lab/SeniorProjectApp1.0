import type { Env } from "../_types.ts";

export type EvidenceAvailabilityStatus =
  | "unknown"
  | "available"
  | "missing_or_inaccessible"
  | "access_lost"
  | "provider_error";

export function availabilityFromDriveStatus(status: number): EvidenceAvailabilityStatus {
  if (status >= 200 && status < 300) return "available";
  if (status === 401 || status === 403) return "access_lost";
  if (status === 404 || status === 410) return "missing_or_inaccessible";
  return "provider_error";
}

export async function recordEvidenceAvailability(
  env: Env,
  evidenceId: string,
  status: EvidenceAvailabilityStatus,
  errorCode = "",
): Promise<void> {
  await env.DB.prepare(
    `UPDATE evidence_artifacts
     SET availability_status = ?,
         availability_checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         availability_error_code = ?
     WHERE id = ?`,
  ).bind(status, errorCode || null, evidenceId).run();
}
