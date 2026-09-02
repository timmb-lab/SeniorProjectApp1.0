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

  const adultOwnershipReady = await tableExists(env, "project_adult_assignments");
  const [projects, projectsAdultsReady, projectsMissingMentor, projectsMissingProgramTeacher] = adultOwnershipReady
    ? await Promise.all([
        count(env, "SELECT COUNT(*) AS count FROM projects WHERE status != 'archived'"),
        count(env, `SELECT COUNT(*) AS count FROM projects
          WHERE status != 'archived'
           AND EXISTS (SELECT 1 FROM project_adult_assignments WHERE project_id = projects.id AND adult_role = 'mentor' AND status = 'accepted')
           AND EXISTS (SELECT 1 FROM project_adult_assignments WHERE project_id = projects.id AND adult_role = 'program_teacher' AND status = 'accepted')`),
        count(env, `SELECT COUNT(*) AS count FROM projects
          WHERE status != 'archived'
           AND NOT EXISTS (SELECT 1 FROM project_adult_assignments WHERE project_id = projects.id AND adult_role = 'mentor' AND status = 'accepted')`),
        count(env, `SELECT COUNT(*) AS count FROM projects
          WHERE status != 'archived'
           AND NOT EXISTS (SELECT 1 FROM project_adult_assignments WHERE project_id = projects.id AND adult_role = 'program_teacher' AND status = 'accepted')`),
      ])
    : [0, 0, 0, 0];

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
      projects,
      projectsAdultsReady,
      projectsMissingMentor,
      projectsMissingProgramTeacher,
      projectsMissingRequiredAdult: Math.max(projects - projectsAdultsReady, 0),
      projectAdultSetupAvailable: adultOwnershipReady,
    },
  });
};

async function count(env: Env, sql: string): Promise<number> {
  const row = await env.DB.prepare(sql).first<CountRow>();
  return Number(row?.count || 0);
}

async function tableExists(env: Env, tableName: string): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
  ).bind(tableName).first<{ name: string }>();
  return Boolean(row?.name);
}
