import type { Env } from "../../_types.ts";
import { clearSessionCookie, getCurrentUser, revokeSession, writeAudit } from "../../_lib/auth.ts";
import { json, requirePost } from "../../_lib/http.ts";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  const user = await getCurrentUser(request, env);
  await revokeSession(request, env);
  if (user) {
    await writeAudit(env, {
      actorUserId: user.id,
      action: "logout",
      entityType: "session",
      request,
    });
  }

  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(env) } });
};
