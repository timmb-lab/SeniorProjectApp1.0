import type { Env } from "../../_types.ts";
import { handleSiteOperationsReadinessGet } from "../../_lib/site-operations-readiness.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  return handleSiteOperationsReadinessGet({ request, env });
};
