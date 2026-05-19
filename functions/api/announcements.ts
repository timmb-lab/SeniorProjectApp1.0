import type { Env } from "../_types";
import { getCurrentUser } from "../_lib/auth";
import { json } from "../_lib/http";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience_scope: string;
  audience_id: string | null;
  publish_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const announcements = await env.DB.prepare(
    `SELECT id, title, body, audience_scope, audience_id, publish_at, expires_at, created_at
     FROM announcements
     WHERE (publish_at IS NULL OR publish_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       AND (
         audience_scope = 'all'
         OR (
           audience_scope = 'role'
           AND EXISTS (
             SELECT 1 FROM user_roles
             WHERE user_roles.user_id = ?
               AND user_roles.role_id = announcements.audience_id
           )
         )
         OR (
           audience_scope IN ('program', 'cohort')
           AND EXISTS (
             SELECT 1
             FROM group_memberships
             JOIN groups ON groups.id = group_memberships.group_id
             WHERE group_memberships.user_id = ?
               AND (
                 (announcements.audience_scope = 'program' AND groups.program_id = announcements.audience_id)
                 OR (announcements.audience_scope = 'cohort' AND groups.cohort_id = announcements.audience_id)
               )
           )
         )
       )
     ORDER BY created_at DESC
     LIMIT 25`,
  ).bind(user.id, user.id).all<AnnouncementRow>();

  return json({
    ok: true,
    announcements: (announcements.results || []).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      audienceScope: announcement.audience_scope,
      audienceId: announcement.audience_id,
      publishAt: announcement.publish_at,
      expiresAt: announcement.expires_at,
      createdAt: announcement.created_at,
    })),
  });
};
