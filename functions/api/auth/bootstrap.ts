import type { Env } from "../../_types";
import { hashPassword, normalizeEmail, randomId, validatePassword } from "../../_lib/crypto";
import { badRequest, json, readJson, requirePost } from "../../_lib/http";
import { writeAudit } from "../../_lib/auth";

interface BootstrapBody {
  setupKey?: string;
  email?: string;
  displayName?: string;
  password?: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;

  if (!env.BOOTSTRAP_SETUP_KEY) {
    return json({ error: "bootstrap_disabled" }, { status: 403 });
  }

  const existing = await env.DB.prepare("SELECT COUNT(*) AS count FROM user_accounts").first<{ count: number }>();
  if ((existing?.count || 0) > 0) {
    return json({ error: "bootstrap_already_completed" }, { status: 409 });
  }

  let body: BootstrapBody;
  try {
    body = await readJson<BootstrapBody>(request);
  } catch {
    return badRequest("invalid_json");
  }
  if (body.setupKey !== env.BOOTSTRAP_SETUP_KEY) {
    return json({ error: "invalid_setup_key" }, { status: 403 });
  }

  const email = body.email || "";
  const displayName = (body.displayName || "").trim();
  const password = body.password || "";
  const passwordErrors = validatePassword(password, { email, displayName });
  if (!email.includes("@") || !displayName || passwordErrors.length > 0) {
    return json({ error: "invalid_bootstrap_payload", passwordErrors }, { status: 400 });
  }

  const userId = randomId("user");
  const emailNorm = normalizeEmail(email);
  const credential = await hashPassword(password, env.PASSWORD_PEPPER || "");

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO user_accounts (id, email, email_norm, display_name, status)
       VALUES (?, ?, ?, ?, 'active')`,
    ).bind(userId, email.trim(), emailNorm, displayName),
    env.DB.prepare(
      `INSERT INTO password_credentials (user_id, password_hash, password_salt, algorithm, iterations)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(userId, credential.hash, credential.salt, credential.algorithm, credential.iterations),
    env.DB.prepare(
      `INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by)
       VALUES (?, 'admin', 'global', '', NULL)`,
    ).bind(userId),
  ]);

  await writeAudit(env, {
    actorUserId: userId,
    action: "bootstrap_admin_created",
    entityType: "user_account",
    entityId: userId,
    request,
  });

  return json({ ok: true, userId, email: emailNorm });
};
