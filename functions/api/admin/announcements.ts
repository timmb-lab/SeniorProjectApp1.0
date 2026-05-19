import type { Env } from "../../_types";
import { getCurrentUser, writeAudit } from "../../_lib/auth";
import { randomId } from "../../_lib/crypto";
import { badRequest, json, readJson, requirePost } from "../../_lib/http";
import { isAdmin } from "../../_lib/permissions";
import { cleanWorkflowText, workflowError } from "../../_lib/workflow";

type AnnouncementScope = "all" | "program" | "cohort" | "role";

interface AnnouncementBody {
  title?: string;
  body?: string;
  audienceScope?: AnnouncementScope;
  audienceId?: string;
  publishAt?: string | null;
  expiresAt?: string | null;
}

const VALID_SCOPES = new Set<AnnouncementScope>(["all", "program", "cohort", "role"]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  if (!user) return workflowError("unauthorized", 401);
  if (!await isAdmin(env, user.id)) return workflowError("forbidden", 403);

  let body: AnnouncementBody;
  try {
    body = await readJson<AnnouncementBody>(request);
  } catch {
    return badRequest("invalid_json");
  }

  const audienceScope = body.audienceScope && VALID_SCOPES.has(body.audienceScope) ? body.audienceScope : "all";
  const audienceId = audienceScope === "all" ? null : cleanWorkflowText(body.audienceId, "", 120);
  if (audienceScope !== "all" && !audienceId) return badRequest("missing_audience_id");

  const title = cleanWorkflowText(body.title, "", 160);
  const announcementBody = cleanWorkflowText(body.body, "", 1200);
  if (!title || !announcementBody) return badRequest("missing_announcement_text");

  const announcementId = randomId("announcement");
  await env.DB.prepare(
    `INSERT INTO announcements (id, title, body, audience_scope, audience_id, publish_at, expires_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    announcementId,
    title,
    announcementBody,
    audienceScope,
    audienceId,
    cleanOptionalDate(body.publishAt),
    cleanOptionalDate(body.expiresAt),
    user.id,
  ).run();

  await writeAudit(env, {
    actorUserId: user.id,
    action: "announcement_created",
    entityType: "announcement",
    entityId: announcementId,
    request,
    metadata: { audienceScope, audienceId },
  });

  return json({
    ok: true,
    announcement: {
      id: announcementId,
      title,
      audienceScope,
      audienceId,
    },
  });
};

function cleanOptionalDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

