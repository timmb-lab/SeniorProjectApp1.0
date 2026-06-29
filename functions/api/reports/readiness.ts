import type { Env } from "../../_types.ts";
import { getCurrentUser, writeAudit } from "../../_lib/auth.ts";
import { json } from "../../_lib/http.ts";
import { canViewAggregateReadiness, isAdministration, isGlobalAdmin, isMiscAdmin, isSiteAdmin } from "../../_lib/permissions.ts";

interface CountRow {
  count: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  if (!await canViewAggregateReadiness(env, user)) return json({ error: "forbidden" }, { status: 403 });

  const [submitted, revisionRequested, approved, evidence, exportsQueued] = await Promise.all([
    count(env, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'submitted'"),
    count(env, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'revision_requested'"),
    count(env, "SELECT COUNT(*) AS count FROM submissions WHERE status = 'approved'"),
    count(env, "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE deleted_at IS NULL"),
    count(env, "SELECT COUNT(*) AS count FROM exports WHERE status = 'queued'"),
  ]);

  const [globalAdmin, siteAdmin, administration, miscAdmin] = await Promise.all([
    isGlobalAdmin(env, user.id),
    isSiteAdmin(env, user.id),
    isAdministration(env, user.id),
    isMiscAdmin(env, user.id),
  ]);

  await writeAudit(env, {
    actorUserId: user.id,
    action: "readiness_report_viewed",
    entityType: "readiness_report",
    entityId: "test-account-mvp",
    request,
    metadata: { globalAdmin, siteAdmin, administration, miscAdmin },
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
