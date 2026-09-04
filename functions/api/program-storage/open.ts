import type { Env } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { getRoleAssignments } from "../../_lib/permissions.ts";
import { canManageProgramStorage, loadProgramStorage } from "../program-storage.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const siteId = cleanId(url.searchParams.get("siteId"));
  const programId = cleanId(url.searchParams.get("programId"));
  if (!siteId || !programId) return json({ error: "missing_storage_scope" }, { status: 400 });
  const roles = await getRoleAssignments(env, user.id);
  if (!await canManageProgramStorage(env, user, roles, siteId, programId)) {
    await audit(env, request, user.id, "program_storage_open_denied", siteId, programId);
    return json({ error: "forbidden" }, { status: 403 });
  }
  const storage = await loadProgramStorage(env, siteId, programId);
  if (!storage || storage.status !== "ready") return json({ error: "storage_not_ready" }, { status: 409 });
  await audit(env, request, user.id, "program_storage_opened", siteId, programId);
  const headers = new Headers({
    location: storage.folder_url,
    "cache-control": "private, no-store, max-age=0",
    "referrer-policy": "no-referrer",
  });
  return new Response(null, { status: 302, headers });
};

async function audit(env: Env, request: Request, userId: string, action: string, siteId: string, programId: string) {
  await writeAudit(env, {
    actorUserId: userId,
    action,
    entityType: "program_storage",
    entityId: `${siteId}:${programId}`,
    request,
    metadata: { siteId, programId },
  });
}

function cleanId(value: string | null): string {
  const id = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{1,120}$/.test(id) ? id : "";
}
