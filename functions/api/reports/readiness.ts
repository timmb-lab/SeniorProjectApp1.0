import type { Env } from "../../_types";
import { getCurrentUser, writeAudit } from "../../_lib/auth";
import { json } from "../../_lib/http";
import { hasRole, isAdmin } from "../../_lib/permissions";

interface CountRow {
  count: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const admin = await isAdmin(env, user.id);
  const miscAdmin = await hasRole(env, user.id, "misc_admin");
  if (!admin && !miscAdmin) return json({ error: "forbidden" }, { status: 403 });

  const [submitted, revisionRequested, approved, evidence, exportsQueued] = await Promise.all([
    count(env, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'submitted'"),
    count(env, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'revision_requested'"),
    count(env, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'approved'"),
    count(env, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE deleted_at IS NULL"),
    count(env, "SELECT COUNT(*) AS count FROM exports WHERE status = 'queued'"),
  ]);

  await writeAudit(env, {
    actorUserId: user.id,
    action: "readiness_report_viewed",
    entityType: "readiness_report",
    entityId: "test-account-mvp",
    request,
    metadata: { admin, miscAdmin },
  });

  return json({
    ok: true,
    scope: "aggregate_only",
    report: {
      submitted,
      revisionRequested,
      approved,
      evidence,
      exportsQueued,
    },
  });
};

async function count(env: Env, sql: string): Promise<number> {
  const row = await env.DB.prepare(sql).first<CountRow>();
  return Number(row?.count || 0);
}
