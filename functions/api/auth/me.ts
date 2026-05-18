import type { Env } from "../../_types";
import { getCurrentUser } from "../../_lib/auth";
import { json } from "../../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return json({ authenticated: false }, { status: 401 });
  }
  const roles = await env.DB.prepare(
    "SELECT role_id, scope_type, scope_id FROM user_roles WHERE user_id = ?",
  ).bind(user.id).all();

  return json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      roles: roles.results || [],
    },
  });
};
